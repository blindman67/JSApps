function GIFGroover() {
    "use strict";
    var interlacedBufSize, deinterlaceBuf, pixelBufSize, pixelBuf, s, timerID, currentFrame, currentTime, playing;
    var loading, complete, cancel, disposalMethod, transparencyGiven, delayTime, transparencyIndex, gifWidth, gifHeight;
    var duration, frameTime, playSpeed, nextFrameTime, nextFrame, lastFrame, bgColorCSS, gifSrc, paused, colorRes;
    var globalColourCount, bgColourIndex, globalColourTable;
    const bitValues = new Uint32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]);
    const interlaceOffsets  = [0, 4, 2, 1];
    const interlaceSteps    = [8, 8, 4, 2];
    const frames   = [];
    const comments = [];
    const events   = [];

    nextFrameTime  = undefined;
    nextFrame      = null;
    playSpeed      = 1;
    frameTime = duration = gifHeight = gifWidth = 0;
    cancel = complete = loading = playing = false;

    // gif  data block headers
    const GIF_FILE = {
        GCExt   : 249,
        COMMENT : 254,  // Comment block
        APPExt  : 255,  // Application extention
        UNKNOWN : 1,    // not sure what this is but need to skip it in parser
        IMAGE   : 44,   // This block contains compressed image data
        EOF     : 59,
        EXT     : 33,
    };

    // creates a block aware by byte and string stream to simplify decoding.
    function Stream(data) {
        var pos = this.pos = 0;
        const dat = this.data = new Uint8Array(data instanceof ArrayBuffer ? data : data);
        const len = this.data.length;
        this.getString = function (count) { // returns a string from current pos
            var s = "";
            pos = this.pos;
            while (count--) { s += String.fromCharCode(dat[pos++]) }
            this.pos = pos;
            return s;
        };
        this.readSubBlocks = function () { // reads a set of blocks as a string
            var size, count, data  = "";
            pos = this.pos;
            while (size !== 0 && pos < len) {
                count = size = dat[pos++];
                while (count--) { data += String.fromCharCode(dat[pos++]) }
            }
            this.pos = pos;
            return data;
        }
        this.readSubBlocksB = function () { // reads a set of blocks as binary
            var size, count, data = [], idx = 0;
            pos = this.pos;
             while (size !== 0 && pos < len) {
                count = size = dat[pos++];
                while (count--) { data[idx++] = dat[pos++] }
            }
            this.pos = pos;
            return data;
        }
    }
    function decodePixels(minSize, data) { // Subset of LZ decoder. Only used on image data (pixels) returns 8bit pixel array
        var i, pixelPos, pos, clear, end, size, busy, key, last, plen, len;
        const bitVals = bitValues;
        const dic     = [];
        pos = pixelPos = 0;
        clear    = bitVals[minSize];
        end      = clear + 1;
        size     = minSize + 1;
        busy     = true;
        for (i = 0; i < clear; i++) { dic[i] = [i] }
        len = end + 1;
        while (busy) {
            last = key;
            key = 0;
            for (i = 0; i < size; i++) {
                if (data[pos >> 3] & bitVals[pos & 7]) { key |= bitVals[i] }
                pos++;
            }
            if (key === clear) { // reset the dictionary
                size = minSize + 1;
                len = end + 1;
                for (i = 0; i < end; i++) { dic[i] = [i] }
                dic[end] = [0];
                dic[clear] = [0];
            } else {
                if (key === end) { break }  // THIS IS EXIT POINT
                if (key >= len) { dic[len ++] = [...dic[last], dic[last][0]] }
                else if (last !== clear) { dic[len ++] = [...dic[last], dic[key][0]] }
                if (!dic[key]) { return false }
                plen = dic[key].length;
                for (i = 0; i < plen; i++) { pixelBuf[pixelPos++] = dic[key][i] }
                if (size < 12 && len === bitVals[size]) { size += 1 }
            }
        }
        return true;
    }
    function createColourTable(count) { // create colour lookup table from stream
        var i = 0;
        count <<= 2;
        const colours = new Uint8Array(count);
        while (i < count) {
            colours[i++] = s.data[s.pos++];
            colours[i++] = s.data[s.pos++];
            colours[i++] = s.data[s.pos++];
            colours[i++] = 255;
        }
        return new Uint32Array(colours.buffer);
    }
    function parse (){  // read gif header, decode gif globals. Start decoding frames
        s.pos  += 6;
        gifWidth             = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        gifHeight            = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        pixelBuf             = new Uint8Array(gifWidth * gifHeight);
        const bitField       = s.data[s.pos++];
        gif.colorRes         = (bitField & 112) >> 4;  //0b1110000
        globalColourCount    = 1 << ((bitField & 7) + 1);
        bgColourIndex        = s.data[s.pos++];
        s.pos++;            // ignoring pixel aspect ratio have yet to see it used. if not 0, aspectRatio = (pixelAspectRatio + 15) / 64
        if (bitField & 128) {  // global colour flag
            globalColourTable = createColourTable(globalColourCount);
            const bg   = globalColourTable[bgColourIndex];
            bgColorCSS = bg !== undefined ? `rgb(${bg&255},${(bg>>8)&255},${(bg>>16)&255})` : `black`;
        }
        fireEvent("decodestart", { width : gifWidth, height : gifHeight}, true);
        setTimeout(parseBlock,0);
    }
    function parseAppExt() { // get application specific data.
        s.pos += 1;
        if ('NETSCAPE' === s.getString(8)) { s.pos += 8 }  // ignoring this data. iterations (word) and terminator (byte)
        else { s.pos += 3; s.readSubBlocks() } // 3 bytes of string usually "2.0"
    };
    function parseGCExt() { // get GC data
        s.pos++;
        const bitField    = s.data[s.pos++];
        disposalMethod    = (bitField & 28) >> 2;
        transparencyGiven = bitField & 1 ? true : false; // ignoring bit two that is marked as  userInput???
        delayTime         = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        transparencyIndex = s.data[s.pos++];
        s.pos++;
    }
    function parseImg() {   // Creates a new frame. Decompress lz zipped 2-8bit sub image block to 8Bit indexed color.
        function deinterlace(width) {               // de interlace pixel data if needed
            var pass, toLine, fromLine = 0;
            const lines = pixelBufSize / width;
            if (interlacedBufSize !== pixelBufSize) {
                deinterlaceBuf = new Uint8Array(pixelBufSize);
                interlacedBufSize = pixelBufSize;
            }
            for (pass = 0; pass < 4; pass++) {
                for (toLine = interlaceOffsets[pass]; toLine < lines; toLine += interlaceSteps[pass]) {
                    deinterlaceBuf.set(pixelBuf.subarray(fromLine, fromLine + width), toLine * width);
                    fromLine += width;
                }
            }
        };
        const frame = {}
        frames.push(frame);
        frame.disposalMethod = disposalMethod;
        frame.time     = duration;
        frame.delay    = delayTime * 10;
        duration      += frame.delay;
        frame.leftPos  = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        frame.topPos   = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        frame.width    = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        frame.height   = (s.data[s.pos++]) + ((s.data[s.pos++]) << 8);
        const bitField = s.data[s.pos++];
        frame.localColourTableFlag = bitField & 128 ? true : false;
        if (frame.localColourTableFlag) { frame.localColourTable = createColourTable(1 << ((bitField & 7) + 1)) }
        if (pixelBufSize !== frame.width * frame.height) { pixelBufSize = frame.width * frame.height }
        if (transparencyGiven) { frame.transparencyIndex = transparencyIndex }
        else { frame.transparencyIndex = undefined }
        if (!decodePixels(s.data[s.pos++], s.readSubBlocksB())) { return false };
        if (bitField & 64) {
            frame.interlaced = true;
            deinterlace(frame.width);
        } else { frame.interlaced = false }
        processFrame(frame);
        return true;
    };
    function processFrame(frame) { // Convert from 8bit indexed image, to full size 32Bit canvas image
        var useT, i, pixel, pDat, col;
        frame.image        = document.createElement('canvas');
        frame.image.width  = gifWidth;
        frame.image.height = gifHeight;
        frame.image.ctx    = frame.image.getContext("2d");
        const ct = frame.localColourTableFlag ? frame.localColourTable : globalColourTable;
        lastFrame = lastFrame ? lastFrame : frame;
        useT = (lastFrame.disposalMethod === 2 || lastFrame.disposalMethod === 3) ? true : false;
        if (!useT) { frame.image.ctx.drawImage(lastFrame.image, 0, 0, gifWidth, gifHeight) }
        const cData = frame.image.ctx.getImageData(frame.leftPos, frame.topPos, frame.width, frame.height);
        const ti  = frame.transparencyIndex;
        const dat = new Uint32Array(cData.data.buffer);
        if (frame.interlaced) { pDat = deinterlaceBuf }
        else { pDat = pixelBuf }
        for (i = 0; i < pixelBufSize; i++) {
            pixel = pDat[i];
            if (ti !== pixel) { dat[i] = ct[pixel] }
            else if (useT) { dat[i] = 0 }
        }
        frame.image.ctx.putImageData(cData, frame.leftPos, frame.topPos);
        if (!playing) { gif.image = frame.image }
        lastFrame = frame;
    };
    function parseExt() {              // parse extended blocks
        const blockID = s.data[s.pos++];
        if      (blockID === GIF_FILE.GCExt)   { parseGCExt() }
        else if (blockID === GIF_FILE.COMMENT) { comments.push(s.readSubBlocks()) }
        else if (blockID === GIF_FILE.APPExt)  { parseAppExt() }
        else {
            if (blockID === GIF_FILE.UNKNOWN) { s.pos += 13 } // skip unknown block
            s.readSubBlocks();
        }
    }
    function parseBlock() { // parsing  blocks
        if (cancel === true) { return canceled() }
        if (s.pos > s.data.length) {
            error("Data read overflow. Gif file is corrupted.");
            return;
        }

        var blockId = s.data[s.pos++];
        while(blockId !== GIF_FILE.IMAGE && blockId !== GIF_FILE.EOF && blockId !== GIF_FILE.EXT) {
            if (s.pos > s.data.length) {
                error("Data read overflow. Gif file is corrupted.");
                return;
            }
            blockId = s.data[s.pos++];
        }
        if (blockId === GIF_FILE.IMAGE ) {
            if (!parseImg()) { error("Could not parse sub image"); return finnished() }
            fireEvent("progress", { progress : ((s.pos / s.data.length) * 1000 | 0) / 10, frameCount : frames.length });
            if (gif.firstFrameOnly) { return finnished() }
        } else if (blockId === GIF_FILE.EOF) { return finnished() }
        else if (blockId === GIF_FILE.EXT) {  parseExt() }
        setTimeout(parseBlock, 0);
    }
    //End of decode phase functions
    function cleanup() { // a little house keeping
        lastFrame         = null;
        s                = undefined;
        disposalMethod    = undefined;
        transparencyGiven = undefined;
        delayTime         = undefined;
        transparencyIndex = undefined;
        pixelBuf          = undefined;
        deinterlaceBuf    = undefined;
        pixelBufSize      = undefined;
        deinterlaceBuf    = undefined;
        complete          = true;
    }
    function finnished() { // called when the load has completed
        loading = false;
        if (!playing) {
            currentTime = currentFrame = 0;
            if (frames.length > 0) { gif.image = frames[0].image }
        }
        doOnloadEvent();
        cleanup();
    }
    function canceled () { finnished() }
    function dataLoaded(data) { // Data loaded create stream and parse
        s = new Stream(data);  // s short for stream
        parse();
    }
    function loadGif(filename) { // starts the load
        var ajax = new XMLHttpRequest();
        gifSrc = filename;
        loading = true;
        ajax.responseType = "arraybuffer";
        ajax.onload = function (e) {
            if (e.target.status === 404) {
                gifSrc = undefined;
                error("File not found");
            } else if (e.target.status >= 200 && e.target.status < 300 ) { dataLoaded(ajax.response) }
            else {
                gifSrc = undefined;
                error("Loading error : " + e.target.status)
             }
        };
        ajax.onerror = function (e) {
            gifSrc = undefined;
            error("File error " + e.message);
        };
        ajax.open('GET', filename, true);
        ajax.send();
    }
    function startLoad(filename) {
        if (gifSrc === undefined) {
            gifSrc = filename;
            setTimeout(() => loadGif(gifSrc), 0);
        } else {
            const message = "GIF is limited to a single load. Create a new GIF object to load another gif.";
            error(message);
            console.warn(message);
        }
    }
    function cancelLoad() { // cancels the loading. This will cancel the load before the next frame is decoded
        if (complete) { return false }
        return cancel = true;
    }
    function error(message) {
        fireEvent("error", {message : message}, false);
        loading = false;
    }
    function doOnloadEvent() { // fire onload event if set
        currentTime = currentFrame = 0;
        fireEvent("load", {frameCount : frames.length}, true);
        if (gif.playOnLoad) { gif.play() }
    }
    function setPlaySpeed(speed) {
        playSpeed = (speed * 100 | 0) / 100;
        nextFrameTime = undefined;
        if (Math.abs(playSpeed) === 0) {
            playSpeed = 0;
            if (playing) { pause() }
        }
    }
    function play() { // starts play if paused
        if (!playing) {
            if (playSpeed === 0) { playSpeed = 1 }
            paused  = false;
            playing = true;
            tick();
        }
    }
    function pause() { // stops play
        paused  = true;
        playing = false;
        clearTimeout(timerID);
        nextFrameTime = undefined;
    }
    function togglePlay(){
        if (paused || !playing) { gif.play() }
        else { gif.pause() }
    }
    function seekFrame(index) { // seeks to frame number.
        clearTimeout(timerID);
        nextFrameTime = undefined;
        nextFrame = null;
        currentFrame = ((index % frames.length) + frames.length) % frames.length;
        if (playing) { tick() }
        else {
            gif.image = frames[currentFrame].image;
            currentTime = frames[currentFrame].time;
        }
    }
    function getFrameAtTime(timeMs) { // returns frame that is displayed at timeMs (ms 1/1000th)
        if (timeMs < 0) { timeMs = 0 }
        timeMs %= duration;
        var frame = 0;
        while (frame < frames.length && timeMs > frames[frame].time + frames[frame].delay) { frame += 1 }
        return frame;
    }
    function seek(time) { // time in Seconds  // seek to frame that would be displayed at time
        clearTimeout(timerID);
        nextFrameTime = undefined;
        nextFrame     = null;
        currentFrame  = getFrameAtTime(time * 1000);
        if (playing) { tick() }
        else {
            currentTime = frames[currentFrame].time;
            gif.image   = frames[currentFrame].image;
        }
    }
    function tick() {
        var delay, frame, framesSkipped = false, delayFix = 0;
        if (playSpeed === 0) {
            gif.pause();
            return;
        } else {
            if (nextFrameTime !== undefined && nextFrame === null) {
                const behind = nextFrameTime - performance.now();
                if (behind < -frameTime / 2) {
                    framesSkipped = true;
                    nextFrameTime = ((nextFrameTime + behind  / playSpeed) % duration) + duration; // normalize to positive
                    currentFrame  = getFrameAtTime(nextFrameTime);
                    if (playSpeed < 0) { frame = currentFrame === 0 ?  frames.length - 1 : currentFrame - 1 }
                    else { frame = currentFrame }
                } else if (behind < 0) { delayFix = behind } // always behind as code takes time to execute;
            }
            if (! framesSkipped) {
                if (playSpeed < 0) {
                    if (nextFrame !== null) { currentFrame = nextFrame }
                    else { currentFrame = currentFrame === 0 ?  frames.length - 1 : currentFrame - 1 }
                    frame = currentFrame === 0 ?  frames.length - 1 : currentFrame - 1;
                } else {
                    if (nextFrame !== null) { currentFrame = nextFrame }
                    frame = currentFrame = (currentFrame + 1) % frames.length;
                }
            }
            delay         = Math.abs(frames[frame].delay / playSpeed) + delayFix;
            frameTime     = Math.abs(frames[frame].delay / playSpeed);
            nextFrameTime = performance.now() + delay;
            gif.image     = frames[currentFrame].image;
            currentTime   = frames[currentFrame].time;
            timerID       = setTimeout(tick, delay);
            nextFrame     = null;
        }
    }
    function fireEvent(name, data, clearEvent = false) {
        if (events["on" + name]) {
            setTimeout(() => {
                data.type = name;
                data.gif = gif;
                events["on" + name](data);
                if (clearEvent) { _removeEventListener(name) }
            }, 0);
        }
    }
    function _addEventListener(name, func) {
        if (typeof func === "function") {
            if (name !== "progress") { func = func.bind(gif) }
            events["on" + name] = func;
        };
    }
    function _removeEventListener(name) {
        if (events["on" + name] !== undefined) { events["on" + name] = undefined }
    }
    const playSpeedSteps = [-10,-7.5,-5,-2.5,-2,-1.5,-1.25,-1,-0.8,-0.6,-0.5,-0.25,-0.1,0,0.1,0.25,0.5,0.6,0.8,1,1.25,1.5,2,2.5,5,7.5,10];
    function playSpeedStepInd(){
        var len;
        var idx = (len = playSpeedSteps.length) / 2 | 0;

        if(playSpeed < 0) {
            while(idx > 0){
                if(playSpeed < playSpeedSteps[idx]){ idx -- }
                else { break }
            }

        } else if(playSpeed > 0) {
            while(idx < len){
                if(playSpeed > playSpeedSteps[idx]){ idx ++ }
                else { break }
            }
        }
        return idx;
    }
    // The exposed interface
    const gif = {                               // the gif image object
        image          : null,                  // the current image at the currentFrame
        comments       : comments,
        releaseFrame(idx) {
            delete frames[idx].image;
        },
        //==============================================================================================================
        // Play status
        get paused()    { return paused },      // true if paused
        get playing()   { return playing },     // true if playing
        get loading()   { return loading },     // true if still loading
        get complete()  { return complete },    // true when loading complete. Does not mean success

        //==============================================================================================================
        // Use to load the gif.
        set src(URL)    { startLoad(URL) },  // load the gif from URL. Note that the gif will only start loading after current execution is complete.
        cancel : cancelLoad,                 // Stop loading cancel() returns true if cancels, false if already loaded
        async create(file)  {                // Creates from File object (Blob like)
            if (gifSrc === undefined) {
                gifSrc = file.name;
                const buf = await file.arrayBuffer();
                setTimeout(() => dataLoaded(buf), 0);
            } else {
                const message = "GIF is limited to a single load. Create a new GIF object to load another gif.";
                error(message);
                console.warn(message);
            }
        },

        //==============================================================================================================
        // General properties getters or functions
        get backgroundColor() { return bgColorCSS },// returns the background colour as a CSS color value
        get src()          { return gifSrc },       // get the gif URL
        get width()        { return gifWidth },     // Read only. Width in pixels
        get height()       { return gifHeight },    // Read only. Height in pixels
        get naturalWidth() { return gifWidth },     // Read only. Width in pixels
        get naturalHeight(){ return gifHeight },    // Read only. Height in pixels
        get allFrames()    { return frames.map(frame => frame.image) },  // returns array of frames as images (canvas).
        get duration()     { return duration },     // Read only. gif duration in ms (1/1000 second)
        get currentFrame() { return currentFrame }, // gets the current frame index
        get currentTime()  { return currentTime },  // gets the current frame index
        get frameCount()   { return frames.length },// Read only. Total number of frames, during load is number of frames loaded
        get playSpeed()    { return playSpeed },    // play speed 1 normal, 2 twice 0.5 half, -1 reverse etc...
        getFrame(index) {                           // return the frame at index. If index is < 0 return frame 0. If past end then last frame is returned
            return frames[index < 0 ? 0 : index >= frames.length ? frames.length-1 : index].image;
        },

        //==============================================================================================================
        // Shuttle control setters
        set currentFrame(index)   { seekFrame(index) },    // seeks to frame index
        set currentTime(time)     { seek(time) },          // seeks to time
        // NOTE play speed changes at the start of the next frame
        set playSpeed(speed)      { setPlaySpeed(speed) }, // set the play speed.

        //==============================================================================================================
        // load control flags
        playOnLoad     : true,       // if true starts playback when loaded
        firstFrameOnly : false,      // if true only load the first frame

        //==============================================================================================================
        // events. Note if func is not a function .
        set onload(func)        { _addEventListener("load", func) },       // fires when gif loaded and decode.
                                                                           // Will fire if you cancel before all frames are decoded.
        set onerror(func)       { _addEventListener("error", func) },      // fires on error
        set onprogress(func)    { _addEventListener("progress", func) },   // fires a load progress event
        set ondecodestart(func) { _addEventListener("decodestart", func) },// event fires when gif file content has been read
                                                                           // and basic header info is read (width, height)
                                                                           // and before frame decoding starts.

        //==============================================================================================================
        // play controls
        play           : play,       // Start playback of gif. myGif.play()
        pause          : pause,      // Pause gif at currentframe. myGif.pause()
        seek           : seek,       // Seeks to time in second. myGif(time)
        seekFrame      : seekFrame,  // Seeks to start of frame indexx myGif.seekFrame(index)
        togglePlay     : togglePlay, // toggles play/play state myGif.togglePlay();
        nextFrame() { gif.currentFrame += 1 },
        prevFrame() { gif.currentFrame -= 1 },
        firstFrame() { gif.currentFrame = 0 },
        lastFrame() { gif.currentFrame = gif.frameCount-1 },
        slower() {
            var idx = playSpeedStepInd();
            if(idx > 0){ gif.playSpeed = playSpeedSteps[idx - 1] };
        },
        faster() {
            var idx = playSpeedStepInd();
            if(idx < playSpeedSteps.length - 1){ gif.playSpeed = playSpeedSteps[idx - 1] };
        },

    };
    return gif;
}