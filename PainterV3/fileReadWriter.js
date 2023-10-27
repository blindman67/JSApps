function downloadData(data, filename, type){
    const e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    $("a",{
        href : URL.createObjectURL(new Blob([data], { type })),
        download : filename,
    }).dispatchEvent(e);
}
function downloadText(text, filename) {
    if(filename.indexOf(".txt") === -1){ filename += ".txt" }
    downloadData(text,filename,"text/txt")
}
function downloadTextAs(text, filename, ext) {

    downloadData(text,filename + "." + ext, "text/txt")
}
function downloadAsJson(data, filename, replacer) {
    try {
        if(filename.indexOf(".json") === -1){ filename += ".json" }
		if (replacer) {
			downloadData((settings.prettyJSON ? JSON.stringify(data, replacer, "    ") : JSON.stringify(data, replacer)), filename, "text/json");
		} else {
			downloadData((settings.prettyJSON ? JSON.stringify(data, null, "    ") : JSON.stringify(data)), filename, "text/json");
		}
    } catch(e) {
        return false;
    }
    return true;
}
function localStoreJson(data, name) {
    try {
        localStorage[name] = JSON.stringify(data);
    } catch(e) {
        return false;
    }
    return true;
}
function saveImage(image, filename, type = "png", quality = 0.9){      // No IE <11 support. Chrome URL bug for large images may crash

    if(!(image instanceof OffscreenCanvas) && !image.toDataURL) {return false }
    try {
        const anchorElement = document.createElement('a');
        filename = filename.replace(/\.(png|jpg|jpeg)$/gi, "");
        anchorElement.download = filename + "." + (type.toLowerCase() === "png" ? "png" : "jpg");
        if(image instanceof OffscreenCanvas) {
            image.convertToBlob({type : "image/"+ type, quality} ).then(blob => {
                anchorElement.href = URL.createObjectURL(blob);
                anchorElement.dispatchEvent(new MouseEvent( "click", {view  : window, bubbles: true,cancelable : true} ));
                image.saved = true;
            });
        }else {
            if(type.toLowerCase() === "jpg" || type.toLowerCase() === "jpeg"){
                mine = "image/jpeg";
                quality = quality ? quality : 0.9;
                anchorElement.href = image.toDataURL("image/jpeg", quality);         // attach the image data URL
            } else { anchorElement.href = image.toDataURL("image/png") }
            anchorElement.dispatchEvent(new MouseEvent( "click", {view  : window, bubbles: true,cancelable : true} ));
            image.saved = true;
        }
    } catch(e) { return false }
    return true;
}
const fontManager = (()=>{
    const sysFonts =  "Arial Black,Arial Rounded MT Bold,Arial,Impact,Georgia,Brush Script MT,Rockwell Extra Bold,Papyrus,Franklin Gothic Medium,Comic Sans MS,Lucida Sans Unicode,Tahoma,Trebuchet MS,Verdana,Courier New,Lucida Console,Times New Roman,Webdings,Symbol".split(",");
    return {
        useFont(name, callback, isLocal = true){
            const nameLower = name.toLowerCase();
            if (isLocal || sysFonts.some(sysName => sysName.toLowerCase() === nameLower)){
                if (callback) { callback(name, true) }
                return;
            }
            loadGoogleFont(name, callback);
        }


    };

})()
const loadGoogleFont = (()=>{
    const loadedFonts = new Set();

    function loadGoogleFont(fontName, loadCallBack){
        var busyId;

        if(loadedFonts.has(fontName)){
            setTimeout(()=>loadCallBack && loadCallBack(fontName, false), 0);
        }else{
            var timeout;
            loadedFonts.add(fontName);
            const googleFontLink = document.getElementById("googleFonts");
            if(googleFontLink !== null){
                busyId = busy("Load Font");
                var newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.type ='text/css';
                newLink.href = APP_PROTOCOL + "//fonts.googleapis.com/css?family="+fontName.replace(/ /g,"+");
                newLink.onload  = ()=>{
                    setTimeout(()=>{
                        clearTimeout(timeout);
                        busy.end(busyId);
                        loadCallBack && loadCallBack(fontName, false);
                    },0)
                };
                timeout = setTimeout(()=>{
                    busy.end(busyId);
                    fontManager.useFont("Arial", loadCallBack, true);
                    log.error("Loading google font '"+fontName+"' timed out.");
                },5000)
                googleFontLink.parentNode.insertBefore(newLink, googleFontLink);
            }
        }

    }
    return loadGoogleFont;
})();


const localFileCache = [];
var fileReadWriter = (function(){
    var headers = [];
    var noCache = false;
    var statusTypes = new Map();
    statusTypes.set(200,"loaded");  // should be ok by dont like it
    statusTypes.set(400,"bad request");
    statusTypes.set(404,"not found");
    function load(file) {

        if(file.cacheLocal){
            const cFile = localFileCache.find(cfile => cfile.name === file.name);
            if(cFile){
                file.status = cFile.status;
                if(file.status === "error") {
                    setTimeout(()=>onError(cFile.errorEvent),0);
                    return;
                }
                if(file.status === "loading"){
                    setTimeout(()=>onLoad({target : {status : "loading"}}),0);
                    return;
                }
                file.ajax = cFile.ajax;
                setTimeout(()=>onLoad({target : {status : cFile.status}}),0);
                return;
            }
            localFileCache.push(file);
        }
        function onLoad(e) {
            if (statusTypes.has(e.target.status)) {
                file.status = statusTypes.get(e.target.status);
                if (typeof file.callback === "function") { file.callback(file) }
            } else {
                file.status = e.target.status.toString();
                if (typeof file.callback === "function") { file.callback(file) }
            }
            busy.end(busyId);
        }
        function onError(e){
            file.errorEvent = e;
            file.status = "error";
            if (typeof file.callback === "function") { file.callback(file) }
            busy.end(busyId);

        }
        var busyId = busy("Load file");
        file.ajax.onload = onLoad;
        file.ajax.onerror = onError;
        file.status = "loading";
        file.ajax.open('GET', file.name, true);
        headers.forEach(n=>file.ajax.setRequestHeader(n[0],n[1]));
        if (noCache) { file.ajax.setRequestHeader("Pragma","no-cache") }
        file.ajax.send();
    }
    return {
        noCache() { noCache = true  },
        cache() { noCache = false },
        setHeaders(_headers) { headers = _headers },
        load(name,callback,cacheLocal = false) {
            if (name.indexOf("__Procedural__") === 0) {
                name = name.replace("__Procedural__","");
                var file = {
                    cacheLocal,
                    ajax: {
                        status: "loaded",
                    },
                    name,
                    callback,
                };
                return file;
            } 
            var file = {cacheLocal : false};
            file.ajax = new XMLHttpRequest();
            file.name = name;
            if(callback === undefined){
                return new Promise((ok, error) => {
                    file.callback = f => {
                        if(f.status === "loaded"){
                            ok(f.ajax.responseText);
                        }else{
                            error(f.status);
                        }
                    }
                    load(file);
                })
            }
            file.callback = callback;
            load(file);
            return file;
        }
    };
})();
var jsonReadWriter = (function(){
    var callback;
    function loaded(file){
        if(file.status === "loaded"){
            if (typeof callback === "function") {
                try {
                    const data = JSON.parse(file.ajax.responseText);
                    callback(data);
                } catch(error) {
                    data = { status: "JSON error" }
                    callback(data);
                }
            } else {
                file.data = JSON.parse(file.ajax.responseText)
            }
        }else{
            if (typeof callback === "function") { callback(file) }
        }
    }
    function loadedAsText(file) {
        if(file.status === "loaded"){
            let data;
            data ={text: file.ajax.responseText};
            if (typeof callback === "function") { callback(data) }
            else { file.data = data }

        } else {
            if (typeof callback === "function") { callback("Error") }
        }
    }
    return {
        loadLocal(filename, callback){
            if (localStorage[filename]) {
                try {
                    callback(JSON.parse(localStorage[filename]));
                } catch(e) {
                    callback({status: "error"});
                }

            } else {
                 callback({status: "error"});

            }
        },
        load(filename,_callback){
            callback = _callback;
            return fileReadWriter.load(filename, loaded);
        },
        loadText(filename,_callback){
            callback = _callback;
            return fileReadWriter.load(filename, loadedAsText);
        },
    };
})();



const [File, Directory] = (()=> {
	function Directory(url) {
		this.url = url;
	}
	Directory.prototype = {
		async getFiles(...types) {
			return this.files = await fetch(this.url)
				.then(res => res.text())
				.then(text => {
					var items = text.split("<br>");
					items.shift(); // remove header
					items.shift();
					items.pop();  // remove footer
					var files = items.reduce((files,file) => {
						const p = file.split(" <A HREF=\"");
						const size = Number(p[0].trim());
						if (size > 0) {
							const url = decodeURI(p[1].split("\">")[0]);
							const name = url.split("/").pop();//.split(/\..+?$/gi)[0];
							//const name = url.split("/").pop().split(/\..+?$/gi)[0];
							var type = url.split(".").pop();
							if(!types || types.includes(type.toLowerCase())) {
								files.push(new File(name,type,size))

							}
						}
						return files;

					},[])
					return files;
				})
		},
		*items(filter) {
			for(const file of this.files)  {
				filter(file) && (yield file);
			}
		},
		sorts: {
			size(a,b) { return a.size - b.size },
			name(a,b) { return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0) },
			type(a,b) { return a.type > b.type ? 1 : (a.type < b.type ? -1 : 0) },
		},
		sortBy(by) {
			by = by.toLowerCase();
			this.sorts[by] && this.files.sort(this.sorts[by]);
		},



	}
	const formatFileSize = (() => {
		const prefixs = "B,kB,MB,GB,TB".split(",");
		return number => {
			const i = Math.floor( Math.log(number) / Math.log(1024) );
			return (number / 1024 ** i).toFixed(2) + prefixs[i];
		};
	})();

	function File(name, type, size) {
		this.name = name;
		this.type = type;
		this.size = size;
	}
	File.prototype = {
		toURL(directory) { return directory.url + "/" + encodeURI(this.name) },
		toString() {  return this.name + " : " + this.type + " : " + formatFileSize(this.size) },
	}
	return [File, Directory];
})();


function createRiffBuffer(size, growBy = 1024 * 8) {
    var firstWarn = 0;
    var currentBlock, blockHeader;
    const API = {
        buf: new ArrayBuffer(size),
        pos: 0,
        markStack: [],
        posStack: [],
        pushMark() { 
            if (currentBlock) { currentBlock.children ++; }
            currentBlock = {pos: API.pos, children: 0};
            API.markStack.push(currentBlock);
        },
        popMark() {
            API.posStack.push(API.pos);
            API.markStack.pop();
            API.pos = currentBlock.pos;
            currentBlock = API.markStack.length > 0 ? API.markStack[API.markStack.length - 1] : undefined;
        },
        popPos() { API.pos = API.posStack.pop() },
        setPos(newPos) { API.posStack.push(API.pos); API.pos = newPos },
        blockHeaders: {
            simple: { // default type
                add() { API.seek(4) },
                close() {
                    const p = API.pos;
                    API.popMark();
                    API.writeInts((p - API.pos) - 4);
                    API.popPos();
                }                    
            },
            withChildren: {  // As defined for Magica Voxel
                add() { API.seek(8) },
                close() {
                    const p = API.pos;
                    const hasChildren = currentBlock.children > 0;
                    API.popMark();
                    if (hasChildren) { API.writeInts(0, (p - API.pos) - 8) }
                    else { API.writeInts((p - API.pos) - 8, 0) }
                    API.popPos();
                }                 
            }
        },
        blockType(typeName) {
            if (API.pos !== 0) { throw new Error("Can not change block type after writing to buffer "); }
            if (!API.blockHeaders[typeName]) { throw new Error("Unknown block type name '" + typeName + "'"); }
            blockHeader = API.blockHeaders[typeName];
        },
        addBlock(name) {
            API.writeHeaderName(name);
            API.pushMark();
            blockHeader.add();
        },
        closeBlock() { blockHeader.close() },
        downloadBuf(filename) {
            const anchor = document.createElement('a');
            const url = anchor.href = URL.createObjectURL(new Blob([API.buf] ,{type: "application/octet-stream"}));
            anchor.download = filename;
            anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
            setTimeout(() => URL.revokeObjectURL(url) , 1000);
        },			
        grow(space) {
            if (API.pos + space >= API.buf.length) {
                const newBuf = new ArrayBuffer(API.buf.length + growBy);
                const nb8 = new Uint8Array(newBuf);
                const b8 = new Uint8Array(API.buf);
                nb8.set(b8);
                API.buf = newBuf;
            }
        },
        close(pad = 1) {
            const len = (((API.pos / 4) | 0)  + pad) * 4;
            const newBuf = new ArrayBuffer(len);
            const nb8 = new Uint8Array(newBuf);
            const b8 = new Uint8Array(API.buf);
            var i = 0;
            while (i < API.pos) { nb8[i] = b8[i++] }
            while (i < len) { nb8[i++] = 0; }
            API.buf = newBuf;
            return len;
        },			
        seek(steps) {
            API.grow(steps);
            API.pos += steps;
        },
        writeHeaderName(str) {
            if (API.pos % 4) { throw new RangeError("Write Header '" + str + "' alignment error out by " + (API.pos % 4) + "bytes"); }                
            API.grow(4);
            const b8 = new Uint8Array(API.buf);
            b8[API.pos++] = str.charCodeAt(0);
            b8[API.pos++] = str.charCodeAt(1);
            b8[API.pos++] = str.charCodeAt(2);
            b8[API.pos++] = str.charCodeAt(3);
        },
        writeInts(...ints) {
            if (API.pos % 4) { throw new RangeError("Write int alignment error out by " + (API.pos % 4) + "bytes"); }
            API.grow(ints.length * 4);
            const b32 = new Uint32Array(API.buf);
            var i = 0, idx = API.pos / 4 | 0;
            while (i < ints.length) { b32[idx + i] = ints[i++] }
            API.pos += ints.length * 4;
        },
        writeFloats(...floats) {
            if (API.pos % 4) { throw new RangeError("Write float alignment error out by " + (API.pos % 4) + "bytes"); }
            API.grow(floats.length * 4);
            const f32 = new Float32Array(API.buf);
            var i = 0, idx = API.pos / 4 | 0;
            while (i < floats.length) { f32[idx + i] = floats[i++] }
            API.pos += floats.length * 4;
        },			
        writeShorts(...shorts) {
            if (API.pos % 2) { throw new RangeError("Write short  alignment error out by " + (API.pos % 2) + "bytes"); }
            API.grow(shorts.length * 2);
            const b16 = new Uint16Array(API.buf);
            var i = 0, idx = API.pos / 2 | 0;
            while (i < shorts.length) { b16[idx + i] = shorts[i++] }
            API.pos += shorts.length * 2;
        },
        writeString(str) {
            var len = str.length + 1;
            var tLen = (((len / 4) | 0) + 1) * 4 + 4;
            API.grow(tLen);
            API.writeShorts(tLen - 2, len);				
            const b8 = new Uint8Array(API.buf);
            var i = 0, idx = API.pos;
            while (i < len) { b8[idx + i] = str.charCodeAt(i++) }
            b8[idx + i] = 0;
            API.pos += tLen - 4;
        },
        writeBytes(...bytes) {
            if ((API.pos % 4) && firstWarn === 0) { log.warn("Byte alignment warning."); firstWarn = 1; }
            API.grow(bytes.length);
            const b8 = new Uint8Array(API.buf);
            var i = 0, idx = API.pos;
            while (i < bytes.length) { b8[idx + i] = bytes[i++] }
            API.pos += bytes.length;
        },            
        showState(mess) { log("At pos: " + API.pos + " " + mess); }
    };
    API.blockType("simple");
    return API;
}