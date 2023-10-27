"use strict";
function DropManager(dropElement, callback, types){
    if (typeof dropElement === "string") {
        var s = dropElement;
        dropElement = document.getElementById(dropElement);
        if (dropElement === null) { throw new ReferenceError("Can not find elementID:" + s) }
    }
    dropElement.ondragover = this.onDragOver;
    dropElement.ondrop = this.drop.bind(this);
    this.fileList = [];
    this.dropFileCallback = callback;
    this.types = types;
    this.element = dropElement;
}
DropManager.prototype.remove = function(){}  // Really not needed just a stub for now
DropManager.prototype.onDragEnter = function(event) { event.preventDefault() }
DropManager.prototype.onDragOver = function(event) { event.preventDefault() }
DropManager.prototype.getit = function(str) {
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

DropManager.prototype.mimeTypes = {
    png: "image/png",
    jpg: "image/jpg",
    gif: "image/gif",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    mp3: "audio/mp3",
    wav: "audio/wav",
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
