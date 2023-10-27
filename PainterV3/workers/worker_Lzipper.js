"use strict";


/* For use with EZWebWorkers.js the use strict above is not needed but there as a matter of standards */
function worker_LZipper() {
    var progressVal = 0;

    /*
      Simple LZ compression and decompression JavaScript utility
      Usage
      var data = Any javascript string
      var compressed = LZipper.compress(data);
      var uncompressed = LZipper.decompress(compressed);
    */

    const LZipper = (() => {
        const fcc = String.fromCharCode;
        const API = {
            compress : function( str ){ return str; },
            decompress : function( str ){ return str; },
            set progress(value) {
                progressVal = value;
                progressMessage(value);
            },
        };
        const bitMask = 0xFFFFFFFFFFFF;
        const charMask = 0xFF;
        const s8Bit = 256;
        const s16Bit = 65536;
        const s15Bit = 32768;


        // converts a 16 bit javascript string 8 bit encoded string so that it can be converted to Base64
        function data16to8Bit(str){
            var i, outStr, len, c;
            outStr = "";
            len = str.length;
            for(i = 0; i < len; i++){
                c = str.charCodeAt(i);
                outStr += String.fromCharCode((c >> 8) & charMask);
                outStr += String.fromCharCode(c & charMask);
            }
            return outStr;
        }
        // converts a 8 bit encoded string 16 bit javascript string.
        function data8to16Bit(str){
            var i, outStr, len, c;
            outStr = "";
            len = str.length;
            for (i = 0; i < len; i++) {
                c = (str.charCodeAt(i++) & charMask) << 8;
                if (i < len) { c += str.charCodeAt(i) & charMask }
                outStr += String.fromCharCode(c);
            }
            return outStr;
        }
        // function compress data
        // data is a string
        // returns a string
        function compress( data ) {
            function decNoShift(numBits, v) {
                var i, m = bitMask;
                for (i = 0; i < numBits; i++) {
                    val = (val << 1) | (v & m);
                    if (pos === 15) {
                        str += fcc(val);
                        pos = val = 0;
                    } else { pos++ }
                    v = 0;
                }
            }
            function dec(numBits, v) {
                var i, m = 1;
                for (i = 0; i < numBits; i++) {
                    val = (val << 1) | (v & m);
                    if (pos === 15) {
                        str += fcc(val);
                        pos = val = 0;
                    } else { pos++ }
                    v >>= 1;
                }
            }
            if (data === null || data === undefined || data === "") { return "" }
            var i, ii, f, c, w, wc, cCode, enlargeIn, dictSize, numBits, str, val, pos, len, encoding;
            len = data.length;
            const dic = {};
            c = w = wc = "";
            w = "";
            enlargeIn = numBits = 2;
            dictSize = 3;
            str = "";
            val = pos = 0;

            for (ii = 0; ii < len; ii += 1) {
                c = data.charAt(ii);
                if (dic[c] === undefined) { dic[c] = {size: dictSize++, create: true} }
                wc = w + c;
                if (dic[wc] !== undefined) { w = wc }
                else {
                    if (dic[w].create) {
                        cCode = w.charCodeAt(0);
                        if (cCode < s8Bit) {
                            dec(numBits, 0);
                            dec(8, cCode);
                        } else {
                            decNoShift(numBits, 1)
                            dec(16, cCode);
                        }
                        enlargeIn--;
                        if (enlargeIn === 0) { enlargeIn = 1 << numBits++ }
                        dic[w].create = false;
                    } else { dec(numBits, dic[w].size) }
                    enlargeIn--;
                    if (enlargeIn === 0) { enlargeIn = 1 << numBits++ }
                    if (dic[wc] !== undefined) { dic[wc].size = dictSize++ }
                    else { dic[wc] = {size: dictSize++, create: false} }
                    w = String(c);
                }
            }
            if (w !== "") {
                if (dic[w].create) {
                    cCode = w.charCodeAt(0);
                    if (cCode < s8Bit) {
                        dec(numBits, 0);
                        dec(8, cCode);
                    } else {
                        decNoShift(numBits, 1)
                        dec(16, cCode);
                    }
                    enlargeIn--;
                    if (enlargeIn === 0) { enlargeIn = 1 << numBits++ }
                    dic[w].create = false;
                } else { dec(numBits, dic[w].size) }
                enlargeIn--;
                if (enlargeIn === 0) { enlargeIn = 1 << numBits++ }
            }
            dec(numBits, 2);
            encoding = true;
            while (encoding) {
                val <<= 1;
                if (pos === 15) {
                    str += fcc(val);
                    encoding = false;
                } else { pos++ }
            }
            return str;
        }
        // function decompress
        // cp is a string of compressed data
        // returns an uncompressed string
        function decompress(cp) {
            var len, w, bits, c, enlargeIn, dicSize, numBits, entry, result, str, val, pos, index, decoding;
            function dec(maxP){
                var p = 1,b = 0;
                while (p != maxP) {
                    b |= ((val & pos) > 0 ? 1 : 0) * p;
                    p <<= 1;
                    pos >>= 1;
                    if (pos === 0) {
                        pos = s15Bit;
                        val = str.charCodeAt(index++);
                    }
                }
                return b;
            }
            if (cp === null || cp === "" || cp === undefined) { return "" }
            const dic = [0, 1, 2];
            const s = [s8Bit, s16Bit];
            len = cp.length
            enlargeIn = dicSize = 4;
            numBits = 3;
            entry = result = "";
            str = cp;
            val = cp.charCodeAt(0);
            pos = s15Bit;
            index = 1;
            bits = dec(4);
            if (bits === 2) { return "" }
            else if(bits < 2) {
                bits = dec(s[bits]);
                c = fcc(bits);
            }
            dic[3] = w = result = c;
            decoding = true;
            while (decoding) {
                if (index > len) { return "" }
                c = bits = dec(1 << numBits);
                if (bits !== 2) {
                    if(bits < 2){
                        bits = dec(s[bits]);
                        dic[dicSize++] = fcc(bits);
                        c = dicSize - 1;
                        enlargeIn--;
                    }
                    if (enlargeIn === 0) { enlargeIn = 1 << numBits++ }
                    if (dic[c]) { entry = dic[c] }
                    else {
                        if (c === dicSize) { entry = w + w.charAt(0) }
                        else { return "" }
                    }
                    result += entry;
                    dic[dicSize++] = w + entry.charAt(0);
                    enlargeIn--;
                    w = entry;
                    if (enlargeIn === 0) { enlargeIn = 1 << numBits++ }
                } else { decoding = false }
            }
            return result;
        }
        if(typeof Map === 'function'){
            API.compress = compress;
            API.decompress = decompress;
        }
        API.int2Char = data16to8Bit;
        API.char2Int = data8to16Bit;
        return API;
    })();
    function workerFunction(data){
        var result;
        if(typeof LZipper[data.call] === "function"){
            result = LZipper[data.call](...data.args);
        }
        return result;
    }
}

const zipper = (() => {
    const zipper = {};
    EZWebWorkers.namedWorker(worker_LZipper, {obj: zipper, onprogress : (progress) => {}});
    return function() {
        const API = {
            compress(data) {
                return zipper.worker_LZipper({call: "compress", args: [data]});
            },
            decompress(data) {
                return zipper.worker_LZipper({call: "decompress", args: [data]});
            },

        };
        return API;
    };
})()










/*function worker_ImageStore() {
    const images = new Map();


    const store = (()=>{
        const API = {
            add(name, data) {
                images.set(name,data);
                return true;
            },
            get(name) {
                return images.get(name);
            },
            remove(name) {
                if(images.has(name)) { images.delete(name); return true; }
                return false;
            },
            memoryUsed() {
                var memory = 0;
                for(const img of images.values()) { memory += img.byteLength; }
                return {memory, count: images.size};
            }


        };
        return API;
    })();
    function workerFunction(data){
        var result;
        if(typeof store[data.call] === "function"){
            result = store[data.call](...data.args);
        }
        return result;
    }
}
const imageStore = (() => {
    const imageStore = {};
    var runWhenDone;
    var busyCount = 0;
    EZWebWorkers.namedWorker(worker_ImageStore, {obj: imageStore, onprogress : (progress) => {}});
    function save(...data) {
        return imageStore.worker_ImageStore({call: "add", args: data});
    }
    function load(...data) {
        return imageStore.worker_ImageStore({call: "get", args: data});
    }
    function remove(...data) {
        return imageStore.worker_ImageStore({call: "remove", args: data});
    }

    function arrayToImage(data, type = "png") {
        var url, bWord, i, wordMask = 0b111111, stream = 0, count = 0;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        url = 'data:image/' + type.toLowerCase() + ';base64,';
        for (i = 0; i < data.byteLength; i++) {
            stream |= data[i];
            count += 8;
            if (count === 12) {
                url += chars[(stream >> 6) & wordMask] + chars[stream & wordMask];
                stream = 0;
                count = 0;
            } else {
                url += chars[(stream >> (count - 6)) & wordMask];
                count -= 6;
                stream <<= 8;
            }
        }
        if (count > 0) { url += chars[(stream >> (count + 2)) & wordMask] }
        return url;
    }
    const API = {
        usage(){
            if (busyCount) { runWhenDone = API.usage; return }
            imageStore.worker_ImageStore({call: "memoryUsed", args: []}).then(use =>{
                var m = use.memory;
                if(m < 2024){
                    //log("Store "+ m + "bytes in " + use.count + " images");
                } else if(m < 1024 * 512){
                    //log("Store "+(m/1024).toFixed(2) + "Kb in " + use.count + " images");
                } else {
                    //log("Store "+(m / (1024 * 1024)).toFixed(2) + "Mb in " + use.count + " images");
                }
            });
        },
        storeImage(image) {
            busyCount ++;
            const name = image.guid;
            image.convertToBlob({type : "image/png"} ).then(blob => {
                var reader  = new FileReader();
                reader.readAsArrayBuffer(blob);
                reader.addEventListener("error", (e) => {
                    log.warn("Error storing Image '"+name+"' :" + e.message);
                    busyCount--;
                    if(busyCount === 0 && runWhenDone) { runWhenDone(); runWhenDone = undefined }

                })
                reader.addEventListener("load", () => {
                    save(name, reader.result).then(()=>{
                        image.desc.inStore = name;
                        busyCount--;
                        if(busyCount === 0 && runWhenDone) { runWhenDone(); runWhenDone = undefined }
                    })
                })
            });
        },
        restoreImage(image) {
            if(image.desc.inStore){
                load(image.desc.inStore).then(imgBytes => {
                    var img = new Image();
                    img.src = arrayToImage(new Uint8Array(imgBytes));;
                    img.onerror = (e) => {
                        log.warn("Error reading Image '"+image.desc.inStore+"' :" + e.message);
                        img = imgBytes = undefined;
                    }
                    img.onload = () => {
                        imgBytes  = undefined;
                        image.ctx.width = image.w;
                        image.ctx.globalCompositeOperation = "copy";
                        image.ctx.drawImage(img, 0, 0);
                        image.ctx.globalCompositeOperation = "source over";
                        image.desc.dirty = true;
                        image.lastAction = "Reverted";
                        image.processed = true;
                        image.update();
                        img = undefined;
                        log.info("Image '"+image.desc.inStore+"' restored!");
                    };

                })
                .catch((error)=> log.warn("Image '"+image.desc.inStore+"' could not be restored. "+ error.message) );


            }else{
                //log.warn("Image '"+image.desc.name+"' not in store");
            }
        },
        delete(media){
            if(media.desc.inStore){
                //log.info("Image '"+media.desc.inStore+"' removed from store");
                remove(media.desc.inStore);
            }else{
                //log.warn("Image '"+media.guid+"' not in store");
            }

        }
    };
    media.addEvent("onremoved",(target, type, mediaItem) => API.delete(mediaItem.media));
    return API;

})()
*/



