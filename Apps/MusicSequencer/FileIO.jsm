
function downloadData(data, filename, type){
    const e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    Object.assign(document.createElement("a"),{
        href : URL.createObjectURL(new Blob([data], { type })),
        download : filename,
    }).dispatchEvent(e);
}
function downloadBlob(blob, filename){
    const e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    Object.assign(document.createElement("a"),{
        href : URL.createObjectURL(blob),
        download : filename,
    }).dispatchEvent(e);
}
function  saveJSON(data, name, content, info){
    try {
        const pack = {
            info: {
                app: "GrooverMusic V1",
                date: new Date(),
                id: 666,
                author: "Blindman67 DEV",
                copyright: "All content copyright Blindman67 DEV, All rights reserved. 2018-2021",
                type: content,
                ...info,
            },
            [content]: data,
        };
        if (name === "localStorage") {
            localStorage["MusicGrooverV1_seq"] = JSON.stringify(pack);
        } else {
            downloadData(JSON.stringify(pack), name + ".json", "text/json");
        }
    } catch(e) {
        return false;
    }
    return true;
}



function DropManager(dropElement, callback, types){
    dropElement.ondragover = this.onDragOver;
    dropElement.ondrop = this.drop.bind(this);
    this.fileList = [];
    this.dropFileCallback = callback;
    this.types = types;
    this.element = dropElement;
}
DropManager.prototype.remove = () => {}  // Really not needed just a stub for now
DropManager.prototype.onDragEnter = e => { e.preventDefault() }
DropManager.prototype.onDragOver = e => { e.preventDefault() }
DropManager.prototype.mimeTypes = {
    png: "image/png",
    jpg: "image/jpg",
    gif: "image/gif",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    mp3: "audio/mp3",
    wav: "audio/wav",
	mid: "audio/midi",
	midi: "audio/midi",
    mp4: "video/mp4",
    mpeg: "video/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    ogg: "video/ogg",
    webm: "video/webm",
    txt: "text/plain",
    json: "text/json",
    grv: "text/json",
    grvb: "text/groover-batch",
    csv: "application/vnd.ms-excel",
    js: "application/javascript",
    all: "*",
}


DropManager.prototype.getit = str => {
    var type = ""
    if (str.indexOf("img") > -1) {
        var s = str.split('src="');
        for (var i = 0; i < s.length; i++) {
            type = "";
            if (s[i].indexOf(".gif") > -1) { type = "image/gif" }
            else if (s[i].indexOf(".jpg") > -1) { type = "image/jpg" }
            else if (s[i].indexOf(".png") > -1) { type = "image/png" }
            else if (s[i].indexOf(".jpeg") > -1) { type = "image/jpeg" }
            if (type !== "") { this.fileList.push(s[i].split('"')[0]) }
        }
    }
}
DropManager.prototype.drop = function(event) {
    event.preventDefault();
    this.droppedItems = [];
    var getData = false;
    var dt = event.dataTransfer;
    if (dt !== null) {
        for (var i = 0; i < dt.types.length; i++) {
            getData = false;
            if (dt.types[i] === "text/html") { getData = true  }// if its html there might be content in it
            if (getData) {
                dt.getData(dt.types[i]);
                for (var j = 0; j < dt.items.length; j++) {  dt.items[j].getAsString(this.getit.bind(this)) }
            }
            if (dt.types[i] === "Files") {    // content from the file system
                try{                        // IE and Firefox do not have type Files
                   var types =  dt.getData(dt.types[i]);
                } catch(e) { dt.getData("URL") }
                for (var j = 0; j < dt.files.length; j++) {
                    for (var k = 0; k < this.types.length; k++) {
                        if (dt.files[j].type.toUpperCase() === this.types[k].toUpperCase() ||
                        this.types[k] === "*" || dt.files[j].name.split(".").pop().toUpperCase() === this.types[k].toUpperCase()) {
                            this.fileList.push({
                                name:dt.files[j].name,
                                mimeType:this.types[k] === "*" ? dt.files[j].type.toUpperCase() : this.types[k],
                            });
                            break;
                        }
                    }
                }
            }
        }
    }
    if (this.fileList.length > 0 && this.dropFileCallback !== undefined) {
        while(this.fileList.length>0){ this.dropFileCallback(this.fileList.shift())}
    }
    this.fileList.length = 0;

}

function  loadJSON(filename, cb, eCb = (e) => console.log(e)) {
    fetch(filename)
        .then(res => res.json(res))
        .then(cb)
        .catch(eCb);
}

async function fileExists(filename) {
    return fetch(filename, {method: "HEAD", cache: "no-store"})
        .then(res => res.status === 200)
        .catch((e)=>e);
}

/* NOTE server must be set up to provide file list and file list must be default for directory */
/* Note server should only present file and directory names */
async function getDirectory(path, directories = true, files = true) {
    const text = (await (await fetch(path)).text());
    const lines = text.split("<pre>")[1].split("</pre>")[0].split("<br>");
    lines.shift(); // removes [To Parent Directory]
    lines.shift(); // empty line 
    lines.pop(); // empty line 
    const items = [];
    for (const line of lines) {
        const name = line.split("\">")[1].split("</A>")[0];
        if (line.includes("/" + name + "/\">" + name + "</A>")) {
            if (directories) {
                items.push({
                    directory: true,
                    path: path + name + "/",
                    name,
                });
            }
        } else {
            if (files) {
                items.push({
                    file: true,
                    path: path + name,
                    name,
                });
            }
        }
    }
    return items;
            
}
/*
<html><head><title>localhost - /CanvasTemplate/Apps/MusicSequencer/sounds/</title></head><body><H1>localhost - /CanvasTemplate/Apps/MusicSequencer/sounds/</H1><hr>

<pre>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/">[To Parent Directory]</A>

<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/AssortedHits/">AssortedHits</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/bass.wav">bass.wav</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/BassBuzz_B2.wav">BassBuzz_B2.wav</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/trumpet.wav">trumpet.wav</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/tuba.wav">tuba.wav</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/viola.wav">viola.wav</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/violin2.wav">violin2.wav</A>
<A HREF="/CanvasTemplate/Apps/MusicSequencer/sounds/web.config">web.config</A>



</pre><hr></body></html>*/
export {saveJSON, loadJSON, DropManager, downloadBlob, fileExists, getDirectory};