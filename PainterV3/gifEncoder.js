"use strict";

/* USAGE 

    const pixels = [
       1,1,1,1,1,1,1,1,
       1,0,0,0,0,0,0,1,
       1,0,0,0,0,0,0,1,
       1,0,0,0,0,0,0,1,
       1,0,0,0,0,0,0,1,
       1,0,0,0,0,0,0,1,
       1,0,0,0,0,0,0,1,
       1,1,1,1,1,1,1,1
    ];
    const pallet = [[0,0,0],[255,255,255]];
    GIFEncoder.start(pallet, {w: 8, h: 8});
    GIFEncoder.comment = "Test GIF encoder";
    GIFEncoder.addFrame(pixels);
    GIFEncoder.stop();
    GIFEncoder.saveStream("test.gif");
    
    


*/


const GIFEncoder = (() => {
    /* References
        https://www.w3.org/Graphics/GIF/spec-gif89a.txt
        http://www.onicos.com/staff/iz/formats/gif.html
        http://www.vurdalakov.net/misc/gif/netscape-looping-application-extension
    */
    const BLOB_TYPE = {type: "image/gif"};
    const MAX_SIZE = 0x7FF;
    const LZW_HASH_TABLE_SIZE = 5003;  // (From bytearray.org Thibault Imbert)
    const LZW_MASKS  = [0, 1, 3, 7, 0xF, 0x1F, 0x3F, 0x7F, 0xFF, 0x1FF, 0x3FF, 0x7FF, 0xFFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF];
    const DISPOSE = {
        NO_ACTION : 0,      // Do nothing
        KEEP : 1,           // Keep new pixels
        TO_BACKGROUND : 2,  // new pixels restored to background
        REVERT : 3,         // Keep old pixels
    };
    const GIF_BLOCKS = {
        HEADER: "GIF89a",  // Do not use GIF87a as some blocks are not compatable
        FRAME: 0x2c,
        HEAD: 0x21,
        DISPOSE: 0xf9,
        COMMENT: 0xfe,
        REPEATS: 0xff,
        CUSTOM: "NETSCAPE2.0",  // concat of "NETSCAPE" and "2.0" MUST be 8 then 3chars. Total must === 11 chars
        EOF: 59,
    };
    var stream, GIF, S, error, status = "";
    function Stream() {
        var blockSize = 0;
        const buf32 = new Int32Array(LZW_HASH_TABLE_SIZE);  // Buffer for LZW encoder
        const buf16 = new Uint16Array(LZW_HASH_TABLE_SIZE); // Buffer for LZW encoder
        const bin = [];
        const buf8 = new Uint8Array(260);  // MUST BE Uint8Array (DONT USE Uint8ClampedArray) 
        function writeBlock() {
            bin.push(blockSize);
            for (let i = 0; i < blockSize; i++) { bin.push(buf8[i]) }
            blockSize = 0;
        }
        const API = {
            buf32, buf16,
            writeBytes(array, start = 0, len = array.lenght) {
                for (;start < len; start++) { bin.push(array[start]) }
            },
            writeArrayBuff(data) {
                var idx = 0;
                while (idx < data.length) { bin.push(data[idx++]) }
            },
            writeShort(data) { bin.push(data & 0xFF, (data >> 8) & 0xFF) },
            writeByte(val) { bin.push(val)  },
            writeString(string) {
                for (var i = 0; i < string.length; i++) { bin.push(string.charCodeAt(i)) }
            },
            writeToBlock(data) {
                buf8[blockSize++] = data;
                if (blockSize >= 254) { writeBlock() }
            },
            LZW_EOF(){
                if (blockSize) { writeBlock() }
                bin.push(0);  // 0 sized block is END of LZW blocks
                blockSize = 0;
            },
            write(data) {  // Warning recursive, can throw call stack overflow
                if (Array.isArray(data)) {
                    for (const d of data) {
                        if (typeof d === 'string') { API.writeString(d) }
                        else if (d instanceof Uint8ClampedArray) { API.writeArrayBuff(d) }
                        else if (!Array.isArray(d) && typeof d === 'object') {
                            if (d.int !== undefined) { API.writeShort(d.int) }
                            else { LZWEncoder(d.pixels, d.pixD, API) }
                        } else { API.write(d) }
                    }
                } else { bin.push(data) }
            },
            get blob() {
                const arrBuf = new ArrayBuffer(bin.length)
                const charBuf = new Uint8Array(arrBuf);
                charBuf.set(bin);
                return new Blob([arrBuf] , BLOB_TYPE);
            },
            dump() { bin.length = 0 },
            get length() { return bin.length },
        }
        return API;
    }
    function GIFStream(stream) {
        const S = stream;
        var openBlock;
        const blockTypes = {
            head : {
                data : [GIF_BLOCKS.HEADER, {int: 0}, {int: 0}, 0, 0, 0, 0],
                set width(width) { this.data[1].int = width & MAX_SIZE },
                set height(height) { this.data[2].int = height & MAX_SIZE },
                set globalColor(flag) { this.data[3] = (this.data[3] & 0b01111111) | (flag ? 0x80 : 0) },
                set globalColorDepth(colors) {
                    var bits = (this.data[3] & 0b10001000);
                    const gct = Math.log2(((colors < 256 ? colors : 255) & 0xFF) - 1) | 0;
                    bits |= (gct << 4) | gct;
                    this.data[3] = bits;
                },
                set backColourIndex(index) { this.data[4] = index },
                set pixelAspectRatio(aspect) { this.data[5] = 0 },
                set pallet(colors) { this.data[6] = colors },
            },
            dispose : {
                data: [GIF_BLOCKS.HEAD, GIF_BLOCKS.DISPOSE, 4, 0, {int : 0}, 0, 0],
                set transparent(flag) { this.data[3] = (this.data[3] & 0b11111110) | (flag ? 1 : 0) },
                set dispose(type) { this.data[3] = (this.data[3] & 0b11110011) | (type << 2) },
                set delay(ms) { this.data[4].int = ms < 10 ? 1 : (ms / 10) | 0 },
                set transparentIndex(idx) {
                    this.data[5] = idx < 0 ? 0 : idx;
                    this.transparent = idx >= 0;
                },
            },
            repeats: {
                data: [GIF_BLOCKS.HEAD, GIF_BLOCKS.REPEATS,  11, GIF_BLOCKS.CUSTOM, 3, 1, {int: 0}, 0],
                set repeat(rep) { this.data[6] = {int : rep } },
            },
            comment: {
                data: [GIF_BLOCKS.HEAD, GIF_BLOCKS.COMMENT, 1, ".", 0],
                set comment(str) { this.data[2] = str.length; this.data[3] = str },
            },
            frame: {
                data: [GIF_BLOCKS.FRAME, {int: 0}, {int: 0}, {int: 0}, {int: 0}, 0, {pixels: null, pixD: 0}],
                set x(x) { this.data[1] = {int: x & MAX_SIZE} },
                set y(y) { this.data[2] = {int: y & MAX_SIZE} },
                set width(w) { this.data[3] = {int: w & MAX_SIZE} },
                set height(h) { this.data[4] = {int: h & MAX_SIZE} },
                set depth(d) { this.data[6].pixD = d + 1 },
                set pixels(pixels) { this.data[6].pixels = pixels },
            },
        }
        const data = [];
        return {
            set block(type) {
                openBlock = blockTypes[type];
                data.push(openBlock.data);
            },
            purge() {
                stream.write(data);
                openBlock = undefined;
                data.length = 0;
            },
            get block() { return openBlock },
            EOF() { stream.writeByte(GIF_BLOCKS.EOF) },
        };
    }
    function LZWEncoder(indexPixels, bitWidth, out) {
        bitWidth = Math.max(2, bitWidth);
        const pixels = indexPixels.idxPix;
        const PIXEL_BITS = bitWidth + 1;
        const HASH_TABLE = out.buf32, CODE_TABLE = out.buf16;
        const HSIZE = HASH_TABLE.length, BITS = 12, MAX_CODE = 1 << BITS, MASKS = LZW_MASKS, HASH_SHIFT = 4;
        var x = indexPixels.x, y = indexPixels.y;
        const left = x + indexPixels.w, bot = y + indexPixels.h, mod = indexPixels.mod;
        const nextPixelSub = () => {
            if (y === bot) { return }
            const pix = pixels[(x++) + y * mod];
            if (x === left) { (x = indexPixels.x, y += 1) }
            return pix;
        }
        const nextPixelFull = () => pixels[pixelIdx++];
        const nextPixel = (indexPixels.w * indexPixels.h) !== pixels.length ? nextPixelSub : nextPixelFull;
        const findEnt = () => {
            if (HASH_TABLE[hash] >= 0) {
                disp = (hash === 0) ? 1 : HSIZE - hash;
                do {
                    (hash -= disp) < 0 && (hash += HSIZE);
                    if (HASH_TABLE[hash] === fcode) {
                        ent = CODE_TABLE[hash];
                        return false;
                    }
                } while (HASH_TABLE[hash] >= 0);
            }
            return true;
        }
        const writeByte = () => {
            out.writeToBlock(bitStream);
            bitStream >>= 8;
            streamSize -= 8;
        }
        const writeBits = code => {
            bitStream |= code << streamSize;
            streamSize += bits;
            while (streamSize > 7) { writeByte() }
            if (freeEntry > maxCode) { maxCode = (++bits) === BITS ? MAX_CODE : MASKS[bits] }
        }
        var bits = PIXEL_BITS, maxCode = MASKS[bits], pixelIdx = 0;
        var clearCode = 1 << bitWidth, EOFCode = clearCode + 1, freeEntry = clearCode + 2;
        var fcode, hash, ent, disp, bitStream = 0, streamSize = 0;
        HASH_TABLE.fill(-1);
        CODE_TABLE.fill(0);
        out.writeByte(bitWidth);
        writeBits(clearCode);
        compress();
        writeBits(EOFCode);
        if (streamSize > 0) { writeByte() }
        out.LZW_EOF();
        function compress() {
            var pix;
            ent = nextPixel();
            while ((pix = nextPixel()) !== undefined) {
                fcode = (pix << BITS) + ent;
                hash = (pix << HASH_SHIFT) ^ ent;
                if (HASH_TABLE[hash] === fcode) { ent = CODE_TABLE[hash] }
                else if (findEnt()) {
                    writeBits(ent);
                    ent = pix;
                    if (freeEntry < MAX_CODE) {
                        CODE_TABLE[hash] = freeEntry++;
                        HASH_TABLE[hash] = fcode;
                    } else {
                        HASH_TABLE.fill(-1);
                        freeEntry = clearCode + 2;
                        writeBits(clearCode);
                        bits = PIXEL_BITS;
                        maxCode = MASKS[bits];
                    }
                }
            }
            writeBits(ent);
        }
    }
    const settings = {
        dispose : 0,
        repeat : 0,
        delay : 2,
        top : undefined,
        left : undefined,
        width : undefined,
        height : undefined,
        lastFrame : false,
        firstFrameColours : false,
        useIdependentColours : false,
        numberOfColours : 256,
        globalColourFlag : true,
        colourFlag : true,
        backColourIndex : 1,
        optimiseMethod : "none",
        comment: "Generated by Groover\n(blindmanmag4@gmail.com)",
        transparentIndex : 255,
        transparentFlag : true,
    };
    const encoder = {
        reset() { E.frameCount = 0 },
        frameCount : 0,
        head(settings){
            GIF.block = "head";
            GIF.block.width = settings.width;
            GIF.block.height = settings.height;
            GIF.block.globalColor = settings.globalColourFlag;
            GIF.block.globalColorDepth = settings.numberOfColours;
            GIF.block.backColourIndex = settings.backColourIndex
            GIF.block.pixelAspectRatio = 0; // 1:1
            GIF.block.pallet = settings.pallet;
            GIF.block = "repeats";
            GIF.block.repeat = 0;
            GIF.block = "dispose";
            GIF.block.dispose = settings.dispose;
            GIF.block.delay = settings.delay;
            GIF.block.transparentIndex = settings.transparentIndex;
            GIF.block = "comment";
            GIF.block.comment = settings.comment;
            GIF.purge();
        },
        addFrame(depth, pixels){
            GIF.block = "dispose";
            GIF.block.dispose = settings.dispose;
            GIF.block.delay = settings.delay;
            GIF.block.transparentIndex = settings.transparentIndex;
            GIF.block = "frame";
            GIF.block.x = pixels.x;
            GIF.block.y = pixels.y;
            GIF.block.width = pixels.w;
            GIF.block.height = pixels.h;
            GIF.block.depth = depth;
            GIF.block.pixels = pixels;
            encoder.frameCount++;
            GIF.purge();
        },
        EOF() { GIF.EOF() },
    }
    const E = encoder; // alias
    const API = {
        DISPOSE,
        close() {
            if (stream) { stream.dump() }
            status = "Closed";
            stream = GIF = undefined;
            settings.pallet = undefined;
            settings.width = settings.height = undefined;
        },
        start(pallet, image) {  // image need only have width amd height to set the size of the gif
            if (stream) { API.close() }
            GIF = new GIFStream(stream = new Stream);
            if (pallet) { API.pallet = pallet.asArray() }
            else if(settings.pallet === undefined) {
                error = new ReferenceError("Requiers a pallet to start");
                status ="Error";
                return false;
            }
            if (image) {
                API.width = image.w || image.height;
                API.height = image.h || image.height;
            }
            if (API.width > MAX_SIZE || API.width <= 0 || API.height > MAX_SIZE || API.height <= 0) {
                error = new RangeError("GIF size error. Size must be  0 < W & H <= " + MAX_SIZE);
                status ="Error";
                return false;
            } else if (API.width === undefined || API.height === undefined) {
                error = new ReferenceError("GIF width and or height not set");
                status ="Error";
                return false;
            }
            E.reset();
            E.head(settings);
            status = "Ready";
            return true;
        },
        stop() {
            if (GIF) {
                E.EOF();
                GIF = undefined;
                status = "Encoding complete";
                return true
            }
            return false;
        },
        addFrame(imageData) {
            if (GIF) {
                E.addFrame( Math.log2(settings.numberOfColours - 1) | 0, imageData);
                status = stream.length + "bytes";
                return true;
            }
            return false;
        },
        saveStream(name) {
            if (stream && !GIF) {
                const anchor = document.createElement('a');
                const url = anchor.href = URL.createObjectURL(stream.blob);
                anchor.download = name;
                anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
                setTimeout(() => URL.revokeObjectURL(url) , 1000);
            }
        },
        get GIFBlob() { return stream && !GIF ? stream.blob : undefined },
        set pallet(pallet) {
            const palletLength = 2 ** (((Math.log2(pallet.length - 1) | 0) + 1));
            while (pallet.length < palletLength) { pallet.push([0, 0, 0]) } // pad pallet if short
            settings.pallet = pallet;
            settings.numberOfColours = pallet.length;
        },
        set transparentIndex(index) {
            settings.transparentIndex = index;
            API.dispose = index >= 0 ? DISPOSE.TO_BACKGROUND : DISPOSE.NO_ACTION;
        },
        set width(w) { settings.width = w },
        set height(h) { settings.height = h },
        set dispose(dispose) { settings.dispose = dispose },
        set delay(delay) { settings.delay = delay },
        set comment(text) { settings.comment = text },
        set backgroundIndex(index) { settings.backColourIndex = index },
        get width() { return settings.width },
        get height() { return settings.height },
        get error() { return error },
        get errorMessage() { return error.message },
        get status() { return status },
        get frames() { return E.frameCount },
        get fileSize() { return stream.length },
    }
    return API;
})();