//"use strict";
// Code writen too long ago and not ready for strict mode. Too many undeclared variables used (my bad)
var DP = GG.dragPoints;
var C = function(p1,r){ return new GG.Circle(p1,r);};
var L = function(p1,p2){ return new GG.Line(p1,p2);};
var V = function(x,y){ return new GG.Vec(x,y);};
var A = function(c,s,e){ return new GG.Arc(c,s,e);};
var B = function(p1,p2,cp1,cp2){ return new GG.Bezier(p1,p2,cp1,cp2);};
var T = function(p1,p2,p3){ return new GG.Triangle(p1,p2,p3);};
var Tf = function(ax,ay,o){ return new GG.Transform(ax,ay,o);};
var R = function(l,a){ return new GG.Rectangle(l,a);};
var VA = function(){ return new GG.VecArray();};
var PA = function(){ return new GG.PrimitiveArray();};
/** GEOMShortcuts.js end **/
const downloadPath = "./Scenes/";
const downloadPaths = ["./Scenes/"];
downloadPaths.pathIdx = 0;
var TextData;
var modelName;
if (location.href.includes("?name=")) {
    modelName = location.href.split("?name=").pop();
} else {
    modelName = "DefaultModel";
}
const waveFormCreater = (function(){
    var audioCtx; //
    var pixelPlayTime,sBuffers,ctx,can,startTime,source;  // sBuffers is the wav form array
    function normalizeBuffers(b1,b2,len){
        var i, min, max;
        max = -Infinity;
        min = Infinity;
        for(i = 0; i < len; i++){
            min = Math.min(min,b1[i],b2[i]);
            max = Math.max(max,b1[i],b2[i]);
        }
        for(i = 0; i < len; i++){
            b1[i] = (b1[i] - min) / (max - min) + min;
            b2[i] = (b2[i] - min) / (max - min) + min;
        }
    }
    const API = {
        createSoundBuffer(length,bufCallback,bufReadyCallback){
            if(audioCtx === undefined){
                 audioCtx = new AudioContext();
            }
            var samples = length * audioCtx.sampleRate;
            var buffers = audioCtx.createBuffer(2, samples, audioCtx.sampleRate);
            var sound = {
                buffers,samples,
                ch1 : buffers.getChannelData(0),
                ch2 : buffers.getChannelData(1),
                bufPos1 : 0,
                bufPos2 : 0,
                buf1Full : false,
                buf2Full : false,
                ready : false,
                playing : false,
                connect(){
                    this.source = audioCtx.createBufferSource(); // for playing the buffer
                    this.source.buffer = buffers;              // point to the buffer
                    this.source.connect(audioCtx.destination);       // connect
                },
                play(){
                    if(this.playing){
                        this.stop();
                    }
                    this.playing = true;
                    this.source = audioCtx.createBufferSource(); // for playing the buffer
                    this.source.buffer = buffers;              // point to the buffer
                    this.source.connect(audioCtx.destination);       // connect
                    this.source.start();
                },
                stop(){
                    this.playing = false;
                    this.source.stop();
                },
                addSupSample(channel,value,steps){
                    var lastV = 0;
                    if(channel === 1){
                        if(this.bufPos1 > 0){
                            lastV = this.ch1[this.bufPos1-1];
                        }
                    }else{
                        if(this.bufPos2 > 0){
                            lastV = this.ch2[this.bufPos2-1];
                        }
                    }
                    var r = value-lastV;
                    var c = 1;
                    while(c <= steps && ((channel === 1 && !this.buf1Full) || (channel === 2 && !this.buf2Full))){
                        this.addSample(channel,
                            lastV + r * (c / steps)
                        );
                        c++;
                    }
                },
                addSample(channel,value){
                    if(!this.ready){
                        if(channel === 1){
                            if(this.bufPos1 < this.samples){
                                this.ch1[this.bufPos1 ++] = value;
                            }else{
                                this.buf1Full = true;
                            }
                        }else{
                            if(this.bufPos2 < this.samples){
                                this.ch2[this.bufPos2 ++] = value;
                            }else{
                                this.buf2Full = true;
                            }
                        }
                        if((this.bufPos1 + this.bufPos2)% 100 === 0){
                            bufCallback(sound);
                        }
                        if(this.buf1Full && this.buf2Full){
                            this.ready = true;
                            normalizeBuffers(this.ch1,this.ch2,this.samples);
                            bufReadyCallback(sound);
                        }
                    }
                }
            }
            return sound;
        },
        saveSoundBuffer(sound,filename){
            saveBufferAsWAV(audioCtx,sound.buffers,filename);
        }
    }
    return API;
}())
const CONST = {
    wheelSpeedScale : 50,
    cos45: Math.cos(Math.PI * 0.25),
    sin45: Math.sin(Math.PI * 0.25),
}
const wavePhaseStepInFrames = 20;
const COLS = {  // col for colour, w for line width, sel prefix for selected, e prefix for extra
    markings : {
        col :  "black",
        w : 0.5,
        selCol : "white",
        selW : 0.75,
    },
    running : {
        col : "rgba(60,200,169,1)"
    },
    groundEdit : {
        col : "rgba(200,169,60,1)",
    },
    stickEdit : {
        col : "rgba(169,169,169,1)",
    },
    norm : {
        ui : "black",
    },
    damper : {
        ui : "#A50",
        col : "#A50",
        w : 3,
        selCol : "#F00",
        selW : 2,
        eCol : "#D70",
        eW : 4,
        selECol : "#F90",
        selEW : 4,
        e1Col : "#07D",
        e1W : 4,
        selE1Col : "#09F",
        selE1W : 4,
    },
    mirror : {
        col : "green",
        selCol : "#0F0",
        w : 2
    },
    dir : {
        col : "Black",
        selCol : "#555",
        w : 0.5,
    },
    freePoint :{
        col : "Blue",
        selCol : "Red",
        w : 1,
        ui : "#00A",
    },
    noBreak:{
        col : "#888",
        selCol : "#AAA",
        w : 1,
        ui : "#999",
    },
    noGround : {
        col : "#A60",
        selCol : "#FF8",
        w : 1,
        ui : "#A60",
    },
    fixedPoint : {
        col : "#800",
        selCol : "#F00",
        w : 1,
        ui : "#800",
    },
    attachedPoint: {
        col : "#0AA",
        selCol : "#8FF",
        selW : 0.75,
        w : 0.75,
        ui : "#0AA",
    },
    fromLength: {
        col : "yellow",
        w : 0.75,
        ui : "#AA0",
    },
    /*romStress: {
        col : "yellow",
        w : 0.75,
        ui : "#F2A",
    },	*/
    fromSpeed: {
        col : "#0F0",
        w : 0.75,
        ui : "#0A0",
    },
    fromAngle: {
        col : "#0FF",
        w : 0.75,
        ui : "#0AA",
    },
    fromDAngle: {
        col : "#00F",
        w : 1.5,
        ui : "#00A",
    },
    fromAs : {
        col : "#F0F",
        w : 1.5,
        ui : "#00A",
    },
	fromSt : {
        col : "#F2A",
        w : 1.5,
        ui : "#F2A",
    },
	fromSi : {
        col : "#A2F",
        w : 1.5,
        ui : "#A2F",
    },
    thruster: {
        col : "#FA0",
        w : 4,
        selCol : "#FF0",
        selW : 2,
        ui : "#FA0",
    },
    wave : {
        col : "#00F",
        selCol : "#f0F",
        w : 3,
        selW : 3,
        eCol : "#0FF",
        eW : 3,
        markCol : "black",
        markW : 0.5,
        ui : "#00f",
    },
    circleMove : {
        col : "Black",
        selCol : "Red",
        w : 1,
        selW : 1
    },
    gravPoint : {
        col : "#000",
        selCol : "#F8F",
        w : 1,
        selW : 3
    },
    flags : {
        col : ["#000","yellow","#FA0","#AF0","#0F0","#843","#0FF","#F00","#F0F","White","#8F8","#0FF","#0F8","#F08","#80F","#8FF","#555","#555","black","#050","#090"],
        selCol : ["#888","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55","#F55", "#F55","#F55"],
        w : 2,
        selW : 4,
    }
}
function sCurve(x){
    return (2 / (1 + Math.pow(5,-x))) -1;
}
function sCurveP(x,p){
    return (2 / (1 + Math.pow(p,-x))) -1;
}
function eCurve(x, p){
    x = x < 0 ? 0 : x > 1 ? 1 : x;
	var xx = Math.pow(x, p);
	return xx / (xx + Math.pow(1 - x, p))
}
const forces = {
    AIR_FRICTION : 0.99,
    GRAVITY : 0.1,
    SURFACE_FRICTION : 0.5,
    WHEEL_FRICTION : 0.99,
    MIN_WHEEL_SIZE : 5,
}
const listTypes = {
    normal : 0,
    selected :1,
    highlighted :2,
}
const stressColors = [];
(function(){
    for(var i = 0; i < 360; i++){
        var rgb = mMath.lshToRGB(128, 255, (i / 360) * 200);
        stressColors.push(0xFF000000 + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]);
        var c = "#" + ((0x1000000 + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).substr(1));
        stressColors.push(c);
    }
    stressColors[0] = 0xFFFF8888;
    stressColors[1] = "#FF8888";
    stressColors[359 * 2] = 0xFF8888FF;
    stressColors[359 * 2 + 1] = "#8888FF";
}())
const getStressPix = function(value){
    var c1 = Math.floor(180 + value * 120);
    c1 = c1 < 0 ? 0 : c1 > 359 ? 359 : c1;
    return stressColors[(c1<<1)]; //`hsl(${c1},100%,50%)`;
}
var overStressed = 0;  // 0 = not true.  !0 over stressed eg 2 or -1
const getStressCol = function(value){
    var c1 = Math.floor(180 + value * 120);
    if (c1 <= 0) { overStressed = 2; return "#FFEEEE" }      // tension
    if (c1 >= 359) { overStressed = 2; return "#EEEEFF" }    // compression
    overStressed = 0;
    return stressColors[(c1<<1) + 1]; //`hsl(${c1},100%,50%)`;
}
var id = 0;
var images = {
    items : {},
    load(name){
        var img = new Image;
        img.src = "images/"+name+".png";
        images.items[name] = img;
    }
}
"atavusGlobe,spaceSuitBody,spaceSuitPants,spaceSuitHead,spaceSuitBoot,spaceSuitHand,spaceSuitArm".split(",").forEach(images.load);

var DMObj = new DropManager(
    "canvasId",
    dropObj,
    ["obj"]
);
function dropObj(oFile){
    var fileName = oFile.name;  
    fileReadWriter.load(downloadPaths[0] + fileName, file => {
        const text = file.ajax.responseText;
        const tLines = text.split("\n");
        var firstPoint = -1;
        for (const tLine of tLines) {
            if (tLine[0] === "#") { // comment
                textMessage(tLine);
            } else if (tLine[0] === "v") {
                const vals = tLine.split(" ");
                if (tLine[1] === " ") {         // vert
                    if (firstPoint === -1) {
                        firstPoint = points.items.length;
                    }
                    points.add(points.create(Number(vals[1]) * 1000, Number(vals[3]) * 1000));
                } else if (tLine[1] === "n") { // normal
                } else if (tLine[1] === "t") { // texture coord
                }
            } else if (tLine[0] === "o") { // o name (think this is an object)
                const vals = tLine.split(" ");
                textMessage(vals.pop());
            } else if (tLine[0] === "s") { // s 0
            } else if (tLine[0] === "f") { // f 1/1/1 5/5/1 8/8/1
                const vals = tLine.split(" ");
                const i1 = Number(vals[1].split("/")[0]) - 1;
                const i2 = Number(vals[2].split("/")[0]) - 1;
                const i3 = Number(vals[3].split("/")[0]) - 1;
                lines.add(lines.create(points.items[i1], points.items[i2]));
                lines.add(lines.create(points.items[i2], points.items[i3]));
                lines.add(lines.create(points.items[i3], points.items[i1]));
                
            }
            
            
        }
    });
}
var DM = new DropManager(
    "canvasId",
    dropJson,
    ["json"]
);
var fileName ="sticks.json";
function dropJson(file){
    fileName = file.name;
    downloadPaths.pathIdx = 0;
    function tryLoad() {
        jsonReadWriter.load(downloadPaths[downloadPaths.pathIdx] + file.name, function(shadowed){
            if(shadowed.info === "RetroLander-GroundLines"){
                groundLines.empty();
                var pts = shadowed.points.split("|");
                pts.forEach(p => {
                    var c = p.split(",");
                    var x = parseInt(c[0],36);
                    var y = parseInt(c[1],36);
                    var flag = flagTypes.none;
                    if(c.length > 2){
                        flag = parseInt(c[2],10);
                    }
                    var pt = groundLines.create(x,y);
                    pt.flag = flag;
                    groundLines.add(pt);
                })
                groundLines.fix();
                systemMessage("Replaced ground line with file");
            }else if(shadowed.info === "Sticks structure object"){
                imageListFromShadow(shadowed.images);
                structureFromShadow(shadowed.points,shadowed.lines);
                modelName = shadowed.name;
                systemMessage("File '" + file.name + "' as model name '" + modelName + "'");
            }else{
                sceneFromJson(shadowed);
            }
            id = findSafeId();
            file.onloaded instanceof Function && file.onloaded(shadowed); 
        }, () => {
            downloadPaths.pathIdx += 1;
            if (downloadPaths.pathIdx < downloadPaths.length) {
                tryLoad();
            } else {
                systemMessage("Could not locate '" + file.name + "' ");
            }
        });
    }
    tryLoad();
}
function undefinedError (name) {
    throw new ReferenceError(`list.${name} bad argument 'undefined'`);
}
function removeDefaults(item,defaultItem){
    Object.keys(item).forEach(key=>{
        if(item[key] !== null &&
        typeof item[key] === "object" &&
        defaultItem[key] !== null &&
        typeof defaultItem[key] === "object" ){
            removeDefaults(item[key],defaultItem[key]);
        }else if(item[key] !== undefined &&
        (item[key] === defaultItem[key] ||  defaultItem[key] === undefined ||
        (defaultItem.excludeFromShadow && defaultItem.excludeFromShadow.keys.indexOf(key) > -1)
        )){  // if defaultItem[key] is undefined then it represents a computed value
            item[key] = undefined;
        }
    })
    return item;
}
function restoreDefaults(item,defaultItem){
    Object.keys(defaultItem).forEach(key=>{
        if(key !== "excludeFromShadow"){
            if(item[key] !== null && typeof item[key] === "object" && defaultItem[key] !== null && typeof defaultItem[key] === "object" ){
                restoreDefaults(item[key],defaultItem[key]);
            }else if(item[key] === undefined && defaultItem[key] !== undefined){
                item[key] = defaultItem[key];
            }
        }
    })
    if(defaultItem.excludeFromShadow && typeof defaultItem.excludeFromShadow.restore === "function"){
        defaultItem.excludeFromShadow.restore(item);
    }
    return item;
}
var itterationDepth = 0;
var util = {
    toString(){
        return Object.keys(this).reduce((a,key,i)=>{
            return typeof this[key] !== "function" && key !== "name" ?
                `${a}${a === ""? this.name+" : {" : ", "} ${key}:${this[key]}` :
                a;
        },"") + "}";
    }
}
/*List objects are generic array manager */
var listItem = { /* A single item in list. Shadow refers to a copy of the item */
    id : null,
    selected : false,
    highlight : false,
    select(){ this.selected = true },
    deselect(){ this.selected = false },
    shadow(){
        itterationDepth += 1;
        if(itterationDepth > 15){ throw new RangeError("Shadow item iteration depth overflow pre call stack error")  }
        var shadow = {};
        Object.keys(this).forEach(key=>{
            if(typeof this[key] !== "function"){
                if(this[key] && typeof this[key].shadow === "function"){
                    shadow[key] = this[key].shadow();
                }else{
                    if(Array.isArray(this[key])){
                        shadow[key] = [];
                        this[key].forEach(item=>{
                            if(item && typeof item.shadow === "function"){ shadow[key].push(item.shadow()) }
                            else{ shadow[key].push(item) }
                        })
                    }else{ shadow[key] = this[key] }
                }
            }
        })
        itterationDepth -= 1;
        return shadow;
    },
    fromShadow(shadow){
        Object.keys(this).forEach(key=>{
            if(typeof this[key] !== "function"){  this[key] = shadow[key] }
        })
        return this;
    },
    isListItem : true,
}
var list = {
    items : [],
    name : "list",
    count : 0, // some functions set count eg setIf sets count to the number of true matches
    lastIndex : 0, // holds the index of a found item (only for some functions)
    add (item = undefinedError("add")) {
        if(!item.isListItem){
            item = Object.assign(item,listItem);
            item.id = item.id === null ? id ++ : item.id;
        }else { item.id = item.id === null ? id ++ : item.id }
        this.items.push(item);
        this.length = this.items.length;
        return item;
    },
    insert(item,index) {
        if(!this.isListItem(item)){
            item = Object.assign(item,listItem);
            item.id = item.id === null ? id ++ : item.id;
        }
        this.items.splice(index,0,item);
        this.length += 1;
        return item;
    },
    isListItem(item) {
        if(item.id === undefined || item.selected === undefined || item.highlight === undefined){  return  false }
        if(item.select === undefined || item.deselect === undefined || item.shadow === undefined || item.fromShadow === undefined){ return false }
        return true;
    },
    empty () {  this.length = this.items.length = 0 },
    remove (id){
        var len = this.items.length;
        for (var i = 0; i < len; i ++ ){
            if(this.items[i].id === id){
                this.length -= 1;
                return this.items.splice(i,1)[0];
            }
        }
    },
    removeIf(callback){
        for (var i = 0; i < this.items.length; i ++ ){
            if(callback(this.items[i],i) === true){
                this.length -= 1;
                this.items.splice(i--,1);
            }
        }
        this.length = this.items.length;
    },
    toString (lineFeed = "<br>") {
        var str = `List : name : '${this.name}', ${this.length} items${lineFeed} `;
        this.eachItem((item, i) => {str += "[" + i + "] : " + item.toString() + lineFeed});
        return str;
    },
    swap(id1,id2){
        var item, index1,index2;
        this.lastIndex = -1;
        if(id1 === id2){ return };
        for(var i = 0; i < this.length; i ++){
            if(this.items[i].id === id1){
                index1 = i;
                if(index1 !== undefined && index2 !== undefined) { break }
            }else if(this.items[i].id === id2){
                index2 = i;
                if(index1 !== undefined && index2 !== undefined) { break }
            }
        }
        if(index1 !== undefined && index2 !== undefined){
            item = this.items[index1];
            this.items[index1] = this.items[index2];
            this.items[index2] = item;
            this.lastIndex = index1;
        }
    },
    moveTo(id,location){
        var index;
        var item = this.getById(id);
        if(item){
            if(location === "top"){ location = 10000000 }
            else if(location === "bottom"){ location = -10000000 }
            else if(location === "down"){ location = -1 }
            else if(location === "up"){ location = 1 }
            if(typeof location === "number"){
                index = Math.floor(this.lastIndex + location);
                index = index < 0 ? 0 : index >= this.length ? this.length - 1 : index;
                if(index !== this.lastIndex){
                    if(index > this.lastIndex){ index -= 1 }
                    this.items.splice(index,0,this.items.splice(this.lastIndex,1)[0]);
                }
            }
        }
    },
    eachItem (callback) {
        var len = this.items.length; // dont use length in the loop as callback may be growing this list
        for (var i = 0; i < len; i ++ ) {  if (callback(this.items[i], i) === true) { break } }
    },
    eachSelected(callback){
        var len = this.items.length; // dont use length in the loop as callback may be growing this list
        this.count = 0;
        for (var i = 0; i < len; i ++ ){
            if(this.items[i].selected){
                this.count += 1;
                if (callback(this.items[i], i) === true) { break }
            }
        }
    },
    eachPair (callback, step = 1, closed = true) {
        var len = this.items.length; // dont use length in the loop as callback may be growing this list
        if (closed) {
            for (var i = 0; i < len; i += step ){
                if (callback(this.items[i], this.items[(i + 1) % len], i) === true) { break }
            }
        } else {  // having one loop do closed and open too ugly
            for (var i = 0; i < len - 1; i += step ){
                if (callback(this.items[i], this.items[i + 1], i) === true) { break }
            }
        }
    },
    setAll (name, value){ this.eachItem(item=>{if(item[name] !== undefined){ item[name] = value }}) },
    setIf (name,value,callback){
        this.count = 0;
        this.eachItem((item,i)=>{ if(callback(item,i) === true){ item[name] = value; this.count += 1 } })
    },
    ifAny (callback){
	    var result = false;
		this.eachItem((item,i)=>{
			if(callback(item,i) === true) { return result = true }
		});
		return result;
	},
    apply (name, argumentArray = []) {
        this.eachItem(item=>{ if(typeof item[name] === "function" ){ item[name](...argumentArray) } })
    },
    applyQuick (name) {
        var len = this.items.length; // dont use length in the loop as callback may be growing this list
        for (var i = 0; i < len; i ++ ){ this.items[i][name]() }
    },
    getById (id) {
        for(var i = 0; i < this.items.length; i += 1 ){
            if (this.items[i].id === id) {
                this.lastIndex = i;
                return this.items[i];
            }
        }
    },
    getIf(callback,start = 0){ for(var i = start; i < this.items.length; i += 1 ){  if (callback(this.items[i],i) === true) { return this.items[i] } } },
    defineDefault(item){ this.defaultItem = Object.assign(item,listItem) },
    shadow (shadow = []) {
        shadow.length = 0;
        var defItem = this.getDefaultItem();
        for(var i = 0; i < this.items.length; i += 1 ){ shadow.push(removeDefaults(this.items[i].shadow(),defItem)) }
        return shadow;
    },
    getSubList (from, count) {
        var subList = Object.assign({}, list);
        var end = from + count;
        end = end < this.items.length ? end : this.items.length - 1;
        for (var i = from; i <= end; i+= 1) { subList.add(this.items[i]) }
        return subList;
    },
    getAllWithin(x,y,min = 50,arr = [],condition){
        var i,index,dist;
        index = -1;
        arr.length = 0;
        if(condition){
            for(i = 0; i < this.items.length; i += 1){
                if(condition(this.items[i],i) === true){
                    dist = this.items[i].distFrom(x,y);
                    if(dist < min){ arr.push(this.items[i]) }
                }
            }
        }else{
            if(min === -1){
                min = 50
                for(i = 0; i < this.items.length; i += 1){
                    dist = this.items[i].distFrom(x,y);
                    if(Math.max(1,this.items[i].radius) >= dist){
                        if(dist < min){  arr.push(this.items[i]) }
                    }
                }
            }else{
                for(i = 0; i < this.items.length; i += 1){
                    dist = this.items[i].distFrom(x,y);
                    if(dist < min){  arr.push(this.items[i]) }
                }
            }
        }
        return arr;
    },
    getClosest(x,y,min = 50,condition){
        var i,index,dist;
        index = -1;
        if(condition){
            for(i = 0; i < this.items.length; i += 1){
                if(condition(this.items[i],i) === true){
                    dist = this.items[i].distFrom(x,y);
                    if(dist < min){ min = dist; index = i }
                }
            }
        }else{
            if(min === -1){
                min = 50
                for(i = 0; i < this.items.length; i += 1){
                    dist = this.items[i].distFrom(x,y);
                    if(Math.max(1,this.items[i].radius) >= dist){
                        if(dist < min){ min = dist; index = i }
                    }
                }
            }else{
                for(i = 0; i < this.items.length; i += 1){
                    dist = this.items[i].distFrom(x,y);
                    if(dist < min){ min = dist; index = i }
                }
            }
        }
        this.lastIndex = index;
        return index < 0 ? undefined : this.items[index];
    },
    drawSelected (...args){ for (var i = 0; i < this.items.length; i += 1) { if(this.items[i].selected) { this.items[i].draw(...args) } } },
    drawUnSelected (...args){ for (var i = 0; i < this.items.length; i += 1) { if(!this.items[i].selected) { this.items[i].draw(...args) } } },
    drawNormal (...args){ for(var i = 0; i < this.items.length; i += 1){ if(!(this.items[i].selected || this.items[i].highlight)) { this.items[i].draw(...args) }} },
    drawHighlighted (...args){ for (var i = 0; i < this.items.length; i += 1) { if(this.items[i].highlight) { this.items[i].draw(...args) } } },
    draw (...args) { this.eachItem(item => item.draw(...args)) }
}
var lists = (function () { return function (name) { return Object.assign({}, list, {items : [], name, length : 0}) } }());
const objectStack = {
    items : [],
    length : 0,
    eachItem(callback) { for(var i = 0; i < this.length; i++){  if(callback(this.items[i],i) === true){ break } } },
    push(item) {
        if(this.length < this.items.length) { this.items[this.length++] = item }
        else{
            this.items.push(item);
            this.length = this.items.length;
        }
    },
    pop() { if(this.length > 0){ return this.items[this.length --] }},
    empty() {  this.length = 0 },
    clear(){ this.items.length = 0; this.empty() },
}
function createObjectStack(){ return Object.assign({},objectStack,{items : []}) }
const pointsUtil = {
}
const flagTypes = {
    up : 0, left : 1, right : 2, down : 11, shutdown : 12, release : 13,
    fuel : 3, base : 4, lifeSupport : 5, volatiles : 6, feet : 7,
    trajectoryBase : 8, trajectory : 9, altitude : 10, attitude : 14, attitudeRef : 16,
    statics : 15,
    drive : 17,
    brake : 18,
    connect : 19,
    none : 0
};
const lineTypes = {line : 0, dampener : 1, thruster : 2, wave : 3,};
const fromTypes = { length : 0, angle : 1, thruster : 2, speed : 3,  deltaA : 4,  as : 5, st: 6, si: 7}
/* Define a line and create a list of lines */
var line = Object.assign({}, util, {
    p1 : null,
    p2 : null,
    type : 0,
    uid : 0,
    length : null,
    startLength : null,
    tension : 0,
    angle : 0,
    color : null,
    lineWidth : null,
    visible : true,
    fixedPoints : null,
    lengthFrom : null,
    fromType : fromTypes.length,
    mirrorLine : false,
    screenSpace : false,
    noBreak : false,
    name : "Line",
    dampA : 0,  // stiffness
    dampB : 0,  // dampening
    dampC : 0,
    dampD : 0,  // travel
    dampAStart : 0,
    dampBStart : 0,
    dLen : 0,
    samplers : false,
    waveFrequency : 0,
    waveFrequencyCurrent : 0,
    waveAmplitude : 0,
    waveAmplitudeFraction : 1,
    waveTime : 0,
    wavePhase : 0,
    waveMultiply : 0,
    waveCustom : false,
    flag : flagTypes.none,
    image : null, // image id not a referance to an image
    thrustCurrent : 0, // amount of thrust at any moment
    thrust : 0, // amount of thrust if a thruster
    stress : 0, // negative is compression/ positive streaching
    stressCounter : 0, // to stop stress creating too many new lines and points
    wear : 0,
    lengthCurrent :0,
    draw (col, lw, forceStyle = false) {
        var l=this, s, i, x, len, y, nx, ny, lf, x1, y1, len1,iScale,wid1,extentShown;
        if(l.flag < flagTypes.none){
            if(!forceStyle){
                col = l.selected ? COLS.flags.selCol[l.flag % COLS.flags.selCol.length] : COLS.flags.col[l.flag % COLS.flags.col.length];
                lw = l.selected ? COLS.flags.selW : COLS.flags.w;
            }
        }else{
            if(l.type === lineTypes.wave){
                if(!forceStyle){
                    col = l.selected ? COLS.wave.selCol : COLS.wave.col;
                    lw = COLS.wave.w;
                }
            }else if(l.type === lineTypes.thruster){
                if(!forceStyle){
                    col = l.selected ? COLS.thruster.selCol : COLS.thruster.col;
                    lw = COLS.thruster.w;
                }
            }else if(l.type === lineTypes.dampener){
                if(!forceStyle){
                    col = l.selected ? COLS.damper.selCol : COLS.damper.col;
                    lw = COLS.damper.w;
                }
            }
        }
        if (l.noBreak) { lw *= 2; }
        if (l.visible || !running || mainMenu.showStress){
            if(!running && !l.visible){ ctx.globalAlpha = 0.2; }
            ctx.strokeStyle = col;
            ctx.lineWidth = lw * invScale;
            if (running) {
                if (l.screenSpace) {
                    ctx.setTransform(1,0,0,1,0,0);
                    wid1 = ctx.lineWidth;
                    ctx.lineWidth = wid1 / invScale;
                    invScale = 1;
                }else if(mainMenu.showStress){
                    ctx.strokeStyle = getStressCol(l.stress / (mainMenu.snapStrength * l.wear));
                    ctx.lineWidth = (lw + overStressed * 2) * invScale;
                } else {
                    if (l.color) { ctx.strokeStyle = l.color }
                    if (l.lineWidth) { ctx.lineWidth = l.lineWidth * (invScale / 2) }
                }
                ctx.beginPath();
                ctx.moveTo(l.p1.x, l.p1.y);
                ctx.lineTo(l.p2.x, l.p2.y);
                ctx.stroke();
                if(l.type === lineTypes.thruster){
                    ctx.strokeStyle = COLS.thruster.selCol;
                    ctx.lineWidth = COLS.thruster.selW*invScale;
                    var nx = -(l.p2.y - l.p1.y) * 2;
                    var ny = (l.p2.x - l.p1.x) * 2;
                    var r = 0.8+Math.random() * 0.2;
                    ctx.moveTo(l.p1.x,l.p1.y);
                    ctx.lineTo(
                        (l.p1.x + l.p2.x) / 2 + nx * l.thrustCurrent * r,
                        (l.p1.y + l.p2.y) / 2 + ny * l.thrustCurrent * r
                    );
                    ctx.lineTo(l.p2.x,l.p2.y);
                    ctx.stroke();
                }
                if(l.screenSpace){
                    view.apply(ctx);
                    invScale = view.invScale;
                    ctx.lineWidth = wid1;
                }
            }else if(!running){
                ctx.beginPath();
                ctx.moveTo(l.p1.x, l.p1.y);
                ctx.lineTo(l.p2.x, l.p2.y);
                if(l.selected && !forceStyle){
                     if(l.color){
                        ctx.strokeStyle = l.color;
                     }
                     if(l.lineWidth){
                         ctx.lineWidth = l.lineWidth * (invScale / 2);
                     }
                }
                ctx.stroke();
                x = l.p2.x - l.p1.x;
                y = l.p2.y - l.p1.y;
                len = Math.sqrt(x * x + y * y);
                if(l.selected || l.mirrorLine || forceStyle){
                    nx = -y / len;
                    ny = x / len;
                    if(l.tension !== 0 && l.type !== lineTypes.wave && (l.type === lineTypes.dampener && l.dampA !== 0)){
                        ctx.beginPath();
                        ctx.moveTo(l.p1.x + nx * 8,l.p1.y + ny * 8);
                        ctx.lineTo(l.p1.x - x * l.tension ,l.p1.y - y * l.tension);
                        ctx.lineTo(l.p1.x  - nx * 8,l.p1.y - ny * 8);
                        ctx.moveTo(l.p2.x + nx * 8,l.p2.y + ny * 8);
                        ctx.lineTo(l.p1.x + x * (1+l.tension) ,l.p1.y + y * (1+l.tension));
                        ctx.lineTo(l.p2.x - nx * 8,l.p2.y - ny * 8);
                        ctx.stroke();
                    }
                    ctx.beginPath();
                    if( l.mirrorLine){
                        ctx.strokeStyle = l.selected ? COLS.mirror.selCol : COLS.mirror.col;
                        ctx.lineWidth = COLS.mirror.w*invScale;
                        ctx.moveTo(l.p1.x + x /2, l.p1.y + y /2);
                        ctx.lineTo(l.p1.x + x /2 + nx * 28, l.p1.y + y /2 + ny * 28);
                        if(buildMenu.currentMirrorLine && buildMenu.currentMirrorLine.id === l.id ){
                            ctx.moveTo(l.p1.x, l.p1.y);
                            ctx.lineTo(l.p2.x, l.p2.y);
                        }
                    }else{
                        ctx.strokeStyle = COLS.dir.col;
                        ctx.lineWidth = COLS.dir.w*invScale;
                        ctx.moveTo(l.p1.x + x /2, l.p1.y + y /2);
                        ctx.lineTo(l.p1.x + x /2 + nx * 12, l.p1.y + y /2 + ny * 12)
                    }
                    ctx.stroke();
                }
                if(l.fixedPoints){
                    if(l.selected){
                        ctx.strokeStyle = COLS.attachedPoint.selCol;
                        ctx.lineWidth = COLS.attachedPoint.selW*invScale;
                        ctx.beginPath();
                        for(i = 0; i < l.fixedPoints.length; i++){
                            ctx.moveTo(l.p2.x, l.p2.y);
                            ctx.lineTo(l.fixedPoints[i].x, l.fixedPoints[i].y);
                        }
                        ctx.stroke();
                    }else{
                        ctx.strokeStyle = COLS.attachedPoint.col;
                        ctx.lineWidth = COLS.attachedPoint.w*invScale;
                        pSel = false;
                        ctx.beginPath();
                        for(i = 0; i < l.fixedPoints.length; i++){
                            if(!l.fixedPoints[i].selected){
                                ctx.moveTo(l.p2.x, l.p2.y);
                                ctx.lineTo(l.fixedPoints[i].x, l.fixedPoints[i].y);
                            }else{
                                pSel = true;
                            }
                        }
                        ctx.stroke();
                        if(pSel){
                            ctx.strokeStyle = COLS.attachedPoint.selCol;
                            ctx.lineWidth = COLS.attachedPoint.selW*invScale;
                            ctx.beginPath();
                            for(i = 0; i < l.fixedPoints.length; i++){
                                if(l.fixedPoints[i].selected){
                                    ctx.moveTo(l.p2.x, l.p2.y);
                                    ctx.lineTo(l.fixedPoints[i].x, l.fixedPoints[i].y);
                                }
                            }
                            ctx.stroke();
                        }
                    }
                }
                if(l.lengthFrom && l.selected){
                    lf = l.lengthFrom;
                    ctx.beginPath();
                    ctx.moveTo((l.p1.x + l.p2.x)/2, (l.p1.y + l.p2.y)/2);
                    ctx.lineTo((lf.p1.x + lf.p2.x)/2, (lf.p1.y + lf.p2.y)/2);
                    x1 = lf.p2.x - lf.p1.x;
                    y1 = lf.p2.y - lf.p1.y;
                    len1 = Math.sqrt(x1 * x1 + y1 * y1);
                    x1 /= len1;
                    y1 /= len1;
                    if(l.fromType === fromTypes.length){
                        ctx.strokeStyle = COLS.fromLength.col;
                        ctx.lineWidth = COLS.fromLength.w * invScale;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.lineWidth = invScale * 2 ;
                        ctx.moveTo(lf.p1.x - y1 * 8, lf.p1.y +  x1 * 8);
                        ctx.lineTo(lf.p1.x - y1 * 8 + x1 * len, lf.p1.y +  x1 * 8 + y1 * len);
                        ctx.stroke();
                        ctx.strokeStyle = COLS.dir.col;
                        ctx.lineWidth = COLS.dir.w*invScale;
                        ctx.beginPath();
                        ctx.moveTo(lf.p1.x, lf.p1.y);
                        ctx.lineTo(lf.p1.x - y1 * 12, lf.p1.y +  x1 * 12);
                        ctx.moveTo(lf.p2.x, lf.p2.y);
                        ctx.lineTo(lf.p2.x - y1 * 12, lf.p2.y +  x1 * 12);
                        ctx.stroke();
                    } else if(l.fromType === fromTypes.angle){
                        x = l.p2.x - l.p1.x;
                        y = l.p2.y - l.p1.y;
                        len = Math.sqrt(x * x + y * y);
                        var ang = Math.atan2(y,x);
                        nx = x / len;
                        ny = y / len;
                        var fVal = Math.acos((nx * y1) - (ny * x1));
                        var fValN = (fVal / (Math.PI / 2) ) * lf.length;
                        ctx.strokeStyle = COLS.fromAngle.col;
                        ctx.lineWidth = COLS.fromAngle.w*invScale;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.lineWidth = invScale * 2 ;
                        ctx.moveTo(lf.p1.x, lf.p1.y);
                        ctx.lineTo(lf.p1.x  + Math.cos(ang) * fValN, lf.p1.y + Math.sin(ang) * fValN);
                        ctx.stroke();
                    } else if(l.fromType === fromTypes.speed){
                        ctx.strokeStyle = COLS.fromSpeed.col;
                        ctx.lineWidth = COLS.fromSpeed.w*invScale;
                        ctx.stroke();
                    } else if(l.fromType === fromTypes.deltaA){
                        ctx.strokeStyle = COLS.fromDAngle.col;
                        ctx.lineWidth = COLS.fromDAngle.w*invScale;
                        ctx.stroke();
                    } else if(l.fromType === fromTypes.as){
                        ctx.strokeStyle = COLS.fromAs.col;
                        ctx.lineWidth = COLS.fromAs.w*invScale;
                        ctx.stroke();
                    } else if(l.fromType === fromTypes.st){
                        ctx.strokeStyle = COLS.fromSt.col;
                        ctx.lineWidth = COLS.fromSt.w*invScale;
                        ctx.stroke();
                    } else if(l.fromType === fromTypes.si){
                        ctx.strokeStyle = COLS.fromSi.col;
                        ctx.lineWidth = COLS.fromSi.w*invScale;
                        ctx.stroke();
                    }
                }
                if(l.selected || forceStyle){
                    if(l.type === lineTypes.dampener){
                        var nx = -(y / len);
                        var ny = (x / len);
                        if(l.dampA * l.dampB === 0){
                            if(l.dampB !== 0){
                                if(l.selected ){
                                    ctx.strokeStyle = COLS.damper.selE1Col;
                                    ctx.lineWidth = COLS.damper.selE1W*invScale;
                                }else{
                                    ctx.strokeStyle = COLS.damper.e1Col;
                                    ctx.lineWidth = COLS.damper.e1W*invScale;
                                }
                                nx *= ctx.lineWidth ;
                                ny *= ctx.lineWidth ;
                                ctx.beginPath();
                                ctx.moveTo(l.p1.x , l.p1.y );
                                ctx.lineTo(l.p1.x + x * (l.tension + 1), l.p1.y + y  * (l.tension + 1));
                                ctx.moveTo(l.p1.x + x * (l.tension + 1) * l.dampB + nx *2, l.p1.y + y  * (l.tension + 1) * l.dampB + ny * 2);
                                ctx.lineTo(l.p1.x , l.p1.y);
                                ctx.lineTo(l.p1.x + x * (l.tension + 1) * l.dampB - nx * 2, l.p1.y + y  * (l.tension + 1) * l.dampB - ny * 2);
                                ctx.stroke();
                            }else{
                                if(l.selected ){
                                    ctx.strokeStyle = COLS.damper.selECol;
                                    ctx.lineWidth = COLS.damper.selEW*invScale;
                                }else{
                                    ctx.strokeStyle = COLS.damper.eCol;
                                    ctx.lineWidth = COLS.damper.eW*invScale;
                                }
                                nx *= ctx.lineWidth;
                                ny *= ctx.lineWidth;
                                ctx.beginPath();
                                ctx.moveTo(l.p1.x + nx, l.p1.y + ny);
                                ctx.lineTo(l.p1.x + (l.p2.x - l.p1.x) * l.dampA + nx, l.p1.y + (l.p2.y - l.p1.y) * l.dampA + ny);
                                ctx.stroke();
                            }
                        }else{
                            if(l.selected ){
                                ctx.strokeStyle = COLS.damper.selECol;
                                ctx.lineWidth = COLS.damper.selEW*invScale;
                            }else{
                                ctx.strokeStyle = COLS.damper.eCol;
                                ctx.lineWidth = COLS.damper.eW*invScale;
                            }
                            nx *= ctx.lineWidth;
                            ny *= ctx.lineWidth;
                            ctx.beginPath();
                            ctx.moveTo(l.p1.x + nx, l.p1.y + ny);
                            ctx.lineTo(l.p1.x + (l.p2.x - l.p1.x) * l.dampA + nx, l.p1.y + (l.p2.y - l.p1.y) * l.dampA + ny);
                            ctx.stroke();
                            if(l.selected ){
                                ctx.strokeStyle = COLS.damper.selE1Col;
                                ctx.lineWidth = COLS.damper.selE1W*invScale;
                            }else{
                                ctx.strokeStyle = COLS.damper.e1Col;
                                ctx.lineWidth = COLS.damper.e1W*invScale;
                            }
                            ctx.beginPath();
                            ctx.moveTo(l.p1.x - nx, l.p1.y - ny);
                            ctx.lineTo(l.p1.x + (l.p2.x - l.p1.x) * l.dampB - nx, l.p1.y + (l.p2.y - l.p1.y) * l.dampB - ny);
                            ctx.stroke();
                        }
                    }
                    if(l.type === lineTypes.thruster  ){
                        if(l.selected ){
                            ctx.strokeStyle = COLS.thruster.selCol;
                            ctx.lineWidth = COLS.thruster.selW*invScale;
                        }else{
                            ctx.strokeStyle = COLS.thruster.col;
                            ctx.lineWidth = COLS.thruster.w*invScale;
                        }
                         ctx.beginPath();
                        var nx = -(l.p2.y - l.p1.y) * 2;
                        var ny = (l.p2.x - l.p1.x) * 2;
                        ctx.moveTo(l.p1.x,l.p1.y);
                        ctx.lineTo(
                            (l.p1.x + l.p2.x) / 2 + nx * l.thrust,
                            (l.p1.y + l.p2.y) / 2 + ny * l.thrust
                        );
                        ctx.lineTo(l.p2.x,l.p2.y);
                        ctx.stroke();
                    }
                    if(l.type === lineTypes.wave  ){
                        if(l.waveMultiply < 0){
                            var waveM = 1 / l.waveMultiply ;
                        }else{
                            var waveM = l.waveMultiply > 0 ? l.waveMultiply : 1;
                        }
                        var waveTime1 = l.waveFrequencyCurrent * l.waveFrequencyCurrent * waveM;
                        var waveTime = 0;
                        var waf = l.waveAmplitudeFraction;
                        var waf2 = l.waveAmplitudeFraction/2;
                        var tt = 1 + l.tension * waf2;
                        var length = (tt + Math.sin(waveTime + (l.wavePhase * Math.PI * 2)) * waf2) * l.waveAmplitude;
                        var length2 = (tt + Math.sin(waveTime1 + (l.wavePhase * Math.PI * 2)) * waf2) * l.waveAmplitude;
                        var nx = x / len;
                        var ny = y / len;
                        var tt = l.tension * waf2-waf2;
                        var f = (1-l.waveFrequency) * l.waveAmplitudeFraction;
                        var x1 = l.p1.x + nx * length;
                        var y1 = l.p1.y + ny * length;
                        ctx.strokeStyle =  COLS.wave.eCol;
                        ctx.lineWidth = COLS.wave.eW*invScale;
                        ctx.beginPath();
                        ctx.moveTo(l.p1.x + nx * length2, l.p1.y + ny * length2 );
                        ctx.lineTo(x1 - ny * 12 , y1 + nx * 12 );
                        ctx.lineTo(x1 + ny * 12 , y1 - nx * 12);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.lineWidth = COLS.wave.markW*invScale *3;
                        ctx.moveTo(l.p2.x + x * tt, l.p2.y + y * tt);
                        ctx.lineTo(l.p2.x + x * (tt+waf), l.p2.y + y * (tt+waf )) ;
                        ctx.stroke();
                        tt += 1;
                        ctx.strokeStyle =  COLS.markings.col;
                        ctx.lineWidth = COLS.markings.w*invScale;
                        ctx.beginPath();
                        if(buildMenu.showRadialExtent){
                            extentShown = true;
                            ctx.moveTo(l.p1.x + len,l.p1.y);
                            ctx.arc(l.p1.x,l.p1.y,len,0,Math.PI * 2);  // end point permiter
                            ctx.moveTo(l.p1.x + length,l.p1.y);
                            ctx.arc(l.p1.x,l.p1.y,length,0,Math.PI * 2); // start point permiter
                            ctx.moveTo(l.p1.x + (tt)*len,l.p1.y);
                            ctx.arc(l.p1.x,l.p1.y,(tt)*len,0,Math.PI * 2); // inner point permiter
                            ctx.moveTo(l.p1.x + (tt + waf)*len,l.p1.y);
                            ctx.arc(l.p1.x,l.p1.y,(tt + waf)*len,0,Math.PI * 2); // max point permiter
                        }
                        //tt -= waf2;
                        waf /= 4;
                        ctx.moveTo(l.p1.x + x * tt - ny * 8, l.p1.y + y * tt + nx * 8 );
                        ctx.lineTo(l.p1.x + x * tt + ny * 8, l.p1.y + y * tt - nx * 8 );
                        tt += waf;
                        ctx.moveTo(l.p1.x + x * tt - ny * 4, l.p1.y + y * tt + nx * 4 );
                        ctx.lineTo(l.p1.x + x * tt + ny * 4, l.p1.y + y * tt - nx * 4 );
                        tt += waf;
                        ctx.moveTo(l.p1.x + x * tt - ny * 8, l.p1.y + y * tt + nx * 8 );
                        ctx.lineTo(l.p1.x + x * tt + ny * 8, l.p1.y + y * tt - nx * 8 );
                        tt += waf;
                        ctx.moveTo(l.p1.x + x * tt - ny * 4, l.p1.y + y * tt + nx * 4 );
                        ctx.lineTo(l.p1.x + x * tt + ny * 4, l.p1.y + y * tt - nx * 4 );
                        tt += waf;
                        ctx.moveTo(l.p1.x + x * tt - ny * 8, l.p1.y + y * tt + nx * 8 );
                        ctx.lineTo(l.p1.x + x * tt + ny * 8, l.p1.y + y * tt - nx * 8 );
                        ctx.stroke();
                    }
                }
                if(l.selected && buildMenu.showRadialExtent){
                    if(!extentShown){
                        if(l.selected ){
                            ctx.strokeStyle =  COLS.markings.selCol;
                            ctx.lineWidth = COLS.markings.selW*invScale;
                        }else{
                            ctx.strokeStyle =  COLS.markings.col;
                            ctx.lineWidth = COLS.markings.w*invScale;
                        }
                        ctx.beginPath();
                        ctx.moveTo(l.p1.x + len,l.p1.y);
                        ctx.arc(l.p1.x,l.p1.y,len,0,Math.PI * 2);  // end point permiter
                        ctx.stroke();
                    }
                }
               /* if(l.type === lineTypes.thruster){
                    ctx.strokeStyle = COLS.thruster.selCol;
                    ctx.lineWidth = COLS.thruster.selW*invScale;
                    var nx = -(l.p2.y - l.p1.y) * 2;
                    var ny = (l.p2.x - l.p1.x) * 2;
                    var r = 0.8+Math.random() * 0.2;
                    ctx.moveTo(l.p1.x,l.p1.y);
                    ctx.lineTo(
                        (l.p1.x + l.p2.x) / 2 + nx * l.thrustCurrent * r,
                        (l.p1.y + l.p2.y) / 2 + ny * l.thrustCurrent * r
                    );
                    ctx.lineTo(l.p2.x,l.p2.y);
                    ctx.stroke();
                }*/
            }
            ctx.globalAlpha = 1;
        }
    },
    getPointOnLine(p1){
        var x = this.p2.x - this.p1.x;
        var y = this.p2.y - this.p1.y;
        var x1 = p1.x - this.p1.x;
        var y1 = p1.y - this.p1.y;
        var l;
        var len = Math.sqrt(l=(x * x + y * y));
        var d = len*( (x1 * x + y1 * y)/l);
        p1.x = this.p1.x + (x / len) * d
        p1.y = this.p1.y + (y / len) * d
        return p1;
    },
    attachPoint(p1){
        var x = this.p1.x - this.p2.x;
        var y = this.p1.y - this.p2.y;
        var dir = -Math.atan2(y,x);
        var x1 = p1.x - this.p2.x;
        var y1 = p1.y - this.p2.y;
        p1.fixX = x1 * Math.cos(dir) - y1 * Math.sin(dir);
        p1.fixY = x1 * Math.sin(dir) + y1 * Math.cos(dir);
        p1.type = pointTypes.attchedToLine;
        if(this.fixedPoints === null){
            this.fixedPoints = [p1];
        }else{
            this.fixedPoints.push(p1);
        }
    },
    isPointAttached(p1){
        if(this.fixedPoints !== null) {
            for(var i = 0; i < this.fixedPoints.length; i ++){
                if(this.fixedPoints[i].id === p1.id){
                    return true;
                }
            }
        }
        return false;
    },
    dettachPoints(p){
        var l = this;
        if(l.fixedPoints){
            for(var k = 0; k < l.fixedPoints.length; k++){
                l.fixedPoints[k].type = pointTypes.normal;
            }
            l.fixedPoints = null;
        }
    },
    isLineCyclic(line){
        if(line.lengthFrom === null ) { return false }
        if(line.lengthFrom.id === this.id) { return true }
        return this.isLineCyclic(line.lengthFrom);
    },
    init () {
        if(this.p1 === null || this.p2 === null){ return this }
        var x = this.p2.x - this.p1.x;
        var y = this.p2.y - this.p1.y;
        this.lengthCurrent = this.length = this.startLength = Math.sqrt(x * x + y * y);
        this.wear = 1;
        if(this.type === lineTypes.dampener){
            this.dLen = this.length;
            this.dampC = 0;
            this.dampAStart = this.dampA;
            this.dampBStart = this.dampB;
        }
        if(this.type === lineTypes.wave){
            this.waveTime = 0;
            this.waveAmplitude = this.length;
            if(this.waveMultiply < 0){ this.waveTime = -((this.waveFrequencyCurrent * 100) / CONST.wheelSpeedScale) / this.waveMultiply }
            else{  this.waveTime = -(((this.waveFrequencyCurrent * 100) / CONST.wheelSpeedScale) * (this.waveMultiply > 0 ? this.waveMultiply : 1)) }
        }
        if(this.p1.radius > forces.MIN_WHEEL_SIZE) { this.angle = Math.atan2(y,x) }
        if(this.fixedPoints !== null){
            x = this.p1.x - this.p2.x;
            y = this.p1.y - this.p2.y;
            var dir = -Math.atan2(y,x);
            for(var i = 0; i < this.fixedPoints.length; i++){
                var p1 = this.fixedPoints[i];
                var x1 = p1.x - this.p2.x;
                var y1 = p1.y - this.p2.y;
                p1.fixX = x1 * Math.cos(dir) - y1 * Math.sin(dir);
                p1.fixY = x1 * Math.sin(dir) + y1 * Math.cos(dir);
                p1.type = pointTypes.attchedToLine;
            }
        }
        return this;
    },
    distFrom (x,y){
        var v1x,v1y,v2x,v2y,u;
        v1x = this.p2.x - this.p1.x;
        v1y = this.p2.y - this.p1.y;
        v2x = x - this.p1.x;
        v2y = y - this.p1.y;
        u = (v2x * v1x + v2y * v1y)/(v1y * v1y + v1x * v1x);
        if(u >= 0 && u <= 1){
            x = this.p1.x + v1x * u - x;
            y = this.p1.y + v1y * u - y;
            return Math.sqrt(x * x + y * y);
        }
        v1x = x - this.p2.x;
        v1y = y - this.p2.y;
        return Math.min(
            Math.sqrt(v1x * v1x + v1y * v1y),
            Math.sqrt(v2x * v2x + v2y * v2y)
        );
    },
    update(){
        var l = this;
        var lx = l.p2.x - l.p1.x;
        var ly = l.p2.y - l.p1.y;
        l.lengthCurrent =  Math.sqrt(lx*lx + ly*ly);
        if(l.samplers && recordSound){
            var val = (l.lengthCurrent - l.startLength) /l.startLength;
            sampleValue += val;
        }
        l.isAttachedLine = l.p1.type === pointTypes.attchedToLine && l.p2.type === pointTypes.attchedToLine;
        if((mainMenu.showStress || mainMenu.breakable) && (l.type !== lineTypes.dampener && l.noBreak === false)){
            l.stress = (l.length - l.lengthCurrent)/ 20;
            if(mainMenu.breakable){
                if(l.stress < -(mainMenu.snapStrength * this.wear)){
                    l.stressCounter += -l.stress / (mainMenu.snapStrength * this.wear);
                    this.wear *= 0.99;
                    if(l.stressCounter > 10){
                        this.dettachPoints();
                        breakLine(this);
                        l.stressCounter = 0;
                    }
                }else if(l.stress > (mainMenu.snapStrength * this.wear)){
                    l.stressCounter += l.stress / (mainMenu.snapStrength  * this.wear);
                    this.wear *= 0.99;
                    //l.stressCounter += 1;
                    if(l.stressCounter > 10){
                        this.dettachPoints();
                        bendLine(this);
                        l.stressCounter = 0;
                    }
                }else if(l.stressCounter> 0){
                    l.stressCounter -= 1;
                }
            }
        }
    },
    makeSafeForDelete(){
        lines.eachItem(item=>{
            if(item.id !== this.id){
                if(item.lengthFrom !== null && item.lengthFrom.id === this.id){
                    item.lengthFrom = null;
                    item.fromType = fromTypes.length;
                }
            }
        })
        points.eachItem(item=>{
            if(item.valueFrom !== null && item.valueFrom.id === this.id){ item.valueFrom = null }
            if(item.type === pointTypes.attchedToLine){
                if(this.isPointAttached(item)){
                    item.type = pointTypes.normal;
                    item.fixed = false;
                    item.fixX = null;
                    item.fixY = null;
                }
            }
        })
        if(this.fixedPoints !== null){ this.fixedPoints.length = 0 }
        this.fixedPoints = null;
        imageList.remove(this.id);
    }
});
var lines = Object.assign({
    selectLinesAttachedToPoint(point){
        this.eachItem(line=>{
            if(line.p1.id === point.id || line.p2.id === point.id){ line.selected = true }
        });
    },
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({},
                line, {
                    excludeFromShadow : {
                        keys : ["wear","waveAmplitude","dLen","startLength"],
                        restore(item){
                            item.wear = 1;
                            item.startLength = null;
                            if(item.type === lineTypes.wave) { item.waveAmplitude = item.length }
                            else if(item.type === lineTypes.dampener) { item.dLen = item.length }
                        }
                    },
                    p1 : points.getDefaultItem(),
                    p2 : points.getDefaultItem(),
                    type : null,
                    length : null,
                    id : null,
                }
            ));
        }
        return this.defaultItem;
    },
    create (p1, p2) {
        var l = Object.assign({}, line,{ p1 : p1, p2 : p2,  type : null, length : null, id : null, });
        return l.init();
    },
    copy (p1, p2, oldLine){
        var l = Object.assign({}, oldLine,{ p1 : p1, p2 : p2, id : null });
        if(oldLine.fixedPoints) { l.fixedPoints = [...oldLine.fixedPoints]  }
        return l.init();
    },
    linkPoints (pointList) {
        pointList.eachPair((p1, p2, i) => { this.add(this.create(p1, p2)) })
        return this;
    },
    isPointAttachedToLine(p){
        var found = false;
        this.eachItem(l=>{
            if(l.fixedPoints){
                for(var k = 0; k < l.fixedPoints.length; k++){
                    if(l.fixedPoints[k].id === p.id){
                        found = true;
                        return true;
                    }
                }
            }
        });
        return found;
    },
    dettachPoint(p){
        this.eachItem(l=>{
            if(l.fixedPoints){
                for(var k = 0; k < l.fixedPoints.length; k++){ if(l.fixedPoints[k].id === p.id){  l.fixedPoints.splice(k--,1) } }
                if(l.fixedPoints.length === 0){ l.fixedPoints = null }
            }
        })
        p.fixed = false;
        p.type = pointTypes.normal;
    },
    updateStart(updateLengthFrom,updateAttachedPoints){
        var i, l, len, xdx, xdy, k;
        for(i = 0; i < this.items.length; i ++){
            l = this.items[i];
            if(updateLengthFrom && l.lengthFrom && l.fromType === fromTypes.as){
                if(l.lengthFrom.type === lineTypes.thruster){
                    l.thrust = l.lengthFrom.thrust;
                }else if(l.lengthFrom.type === lineTypes.wave){
                    l.waveFrequency = l.lengthFrom.waveFrequency;
                    l.waveFrequencyCurrent = l.lengthFrom.waveFrequencyCurrent;
                    l.waveAmplitude = l.lengthFrom.waveAmplitude;
                    l.waveTime = l.lengthFrom.waveTime;
                    l.wavePhase  = l.lengthFrom.wavePhase ;
                    l.waveMultiply = l.lengthFrom.waveMultiply;
                }else if(l.lengthFrom.type === lineTypes.dampener){
                    l.dampA = l.lengthFrom.dampA;
                    l.dampB = l.lengthFrom.dampB;
                    l.dampD = l.lengthFrom.dampA;
                }
            }
            if(updateAttachedPoints){
                if(l.fixedPoints !== null){
                    xdx = l.p1.x - l.p2.x;
                    xdy = l.p1.y - l.p2.y;
                    len = Math.sqrt(xdx*xdx + xdy*xdy);
                    xdx /= len;
                    xdy /= len;
                    for(k = 0; k < l.fixedPoints.length; k++){
                        var p = l.fixedPoints[k];
                        p.x = p.fixX * xdx - p.fixY * xdy + l.p2.x;
                        p.y = p.fixX * xdy + p.fixY * xdx + l.p2.y;
                    }
                }
            }
        }
    },
    updateAttachedPoints(){
        var i, l, len, xdx, xdy, k;
        for(i = 0; i < this.items.length; i ++){
            l = this.items[i];
            if(l.fixedPoints !== null){
                xdx = l.p1.x - l.p2.x;
                xdy = l.p1.y - l.p2.y;
                len = Math.sqrt(xdx*xdx + xdy*xdy);
                xdx /= len;
                xdy /= len;
                for(k = 0; k < l.fixedPoints.length; k++){
                    var p = l.fixedPoints[k];
                    p.x = p.fixX * xdx - p.fixY * xdy + l.p2.x;
                    p.y = p.fixX * xdy + p.fixY * xdx + l.p2.y;
                }
            }
        }
    },
    repair(){
        this.setAll("highlight",false);
        this.setIf("highlight",true,l => l.selected);
        this.setAll("selected",false);
        this.eachItem(l=>{ if(l.p1.id === l.p2.id){  l.selected = true } })
        this.removeIf(line=>line.selected);
        this.setIf("selected",true,l => l.highlight);
    },
    constrainToWheel(pass){
        var i, l, len, lx, ly, w1, balance, x, ang, y;
        for(i = 0; i < this.items.length; i ++){
            l = this.items[i];
            if(l.p1.radius > forces.MIN_WHEEL_SIZE){
                ang = l.p1.angle + l.angle;
                x = l.p2.x - l.p1.x;
                y = l.p2.y - l.p1.y;
                len = Math.sqrt(x * x + y * y);
                l.p2.x = l.p1.x + Math.cos(ang) * len;
                l.p2.y = l.p1.y + Math.sin(ang) * len;
            }
        }
    },
    constrainLength(pass){
        var i, l, len, oLen,lx, ly,zeroDamp, waveM,w1,x,y,x1,y1, balance, fraction, fx, fy,fVal,fValNorm, fAng,fAngNorm, bypassFixed2;
        const updateLengthFrom = (calcOLen,oLenShadow) => {
            if (l.type === lineTypes.thruster) {
                if (l.thrust === 0) { l.thrustCurrent = sCurve(fValNorm - 1) }
                else { l.thrustCurrent = fValNorm * l.thrust }
            }else if (l.type === lineTypes.wave) {
                if (l.waveFrequency === 0) {
                    if (calcOLen) { l.waveFrequencyCurrent = fValNorm }
                    else { l.waveFrequencyCurrent = sCurve((fValNorm - 1) * (fValNorm - 1)) }
                }else { l.waveAmplitude = fVal }
            }else if (l.type === lineTypes.dampener) {
                if(dB === 0){
                    dA = l.dampA * fValNorm;
                }else if(dA === 0){
                    //dB = l.dampB * fValNorm;
                    var tl;
                    if (calcOLen) { tl = l.startLength  * (1 + (l.tension * fValNorm)) }
                    else { tl = l.startLength  * (1 + (l.tension * sCurve(fValNorm - 1))) }
                    l.length = l.lengthCurrent = tl < 1 ? 1 : tl;
                    //l.length = (sCurve(fValNorm - 1) + 1) * l.startLength;
                }/*else{
                    fValNorm = (sCurve(fValNorm - 1) + 1);
                    dA = l.dampA * fValNorm;
                    dB = l.dampB * fValNorm;
                }*/
            }else{
                l.length = fVal;
                if(l.p1.fixed && l.p2.fixed){
                    if(calcOLen){
                        if(oLenShadow !== undefined){
                            fx = l.p2.startX - l.p1.startX;
                            fy = l.p2.startY - l.p1.startY;
                            oLen = Math.sqrt(fx*fx + fy*fy);
                            //oLen =oLenShadow;
                        }else{
                            fx = l.p2.startX - l.p1.startX;
                            fy = l.p2.startY - l.p1.startY;
                            oLen = Math.sqrt(fx*fx + fy*fy);
                        }
                    }
                    l.p2.x = l.p1.startX + (fx / oLen) * l.length;
                    l.p2.y = l.p1.startY + (fy / oLen) * l.length;
                    bypassFixed2 = true;
                }
            }
        }
        zeroDamp = false;
        for(i = 0; i < this.items.length; i ++){
            l = this.items[i];
            lx = l.p2.x - l.p1.x;
            ly = l.p2.y - l.p1.y;
            len = Math.sqrt(lx*lx + ly*ly);
            var tension = l.tension;
            var dA = l.dampA;
            var dB = l.dampB;
            if(pass === 0 && l.type === lineTypes.dampener && dA * dB === 0){  // damper with zero damping
                if(dA){
                    //l.length = l.lengthCurrent = len < 1 ? 1 : len;
                    l.length  = len < 1 ? 1 : len;
                    l.dLen = len * (1 + l.tension);
                    l.dLen = l.dLen < 1 ? 1 : l.dLen;
                }else{
                    var tl = l.startLength  * (1 + l.tension);
                    //l.length = l.lengthCurrent = tl < 1 ? 1 : tl;
                    l.length  = tl < 1 ? 1 : tl;
                }
                zeroDamp = true;
            }else {
                zeroDamp = false;
            }
            w1 = Math.min(forces.MIN_WHEEL_SIZE+1,l.p1.radius+1);
            balance = w1 / (w1 + Math.min(forces.MIN_WHEEL_SIZE+1,l.p2.radius+1));
            var d1 = 1 - l.p1.surfaceFriction;
            var d2 = 1 - l.p2.surfaceFriction;
            if(l.type === lineTypes.wave ){
                if(pass === 0){
                    if(l.waveMultiply < 0){
                        waveM = 1 / l.waveMultiply ;
                    }else{
                        waveM = l.waveMultiply > 0 ? l.waveMultiply : 1;
                    }
                    if(l.waveFrequencyCurrent === 0){
                        if(l.waveTime < Math.PI){
                            l.waveTime += Math.abs((( 1) / CONST.wheelSpeedScale) * waveM);
                        }
                        var tt = 1 + tension * (l.waveAmplitudeFraction / 2);
                        if(l.waveCustom && customWave.ready){
                            l.length = (tt +customWave.getAt(l.waveTime + l.wavePhase) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                        }else{
                            l.length = (tt + Math.sin(l.waveTime + (l.wavePhase * Math.PI * 2)) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                        }
                    }else{
                        l.waveTime += ((l.waveFrequencyCurrent * 100) / CONST.wheelSpeedScale) *waveM;
                        var tt = 1 + tension * (l.waveAmplitudeFraction / 2);
                        if(l.waveCustom && customWave.ready){
                            if(wavePhaseEase < 1){
                                l.length = (tt + customWave.getAt(l.waveTime + l.wavePhase) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                                l.length = wavePhaseEase * l.length + (1 - wavePhaseEase) * l.waveAmplitude;
                            }else{
                                l.length = (tt +customWave.getAt(l.waveTime + l.wavePhase) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                            }
                        }else{
                            if(wavePhaseEase < 1){
                                l.length = (tt + Math.sin(l.waveTime + (l.wavePhase * Math.PI * 2)) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                                l.length = wavePhaseEase * l.length + (1 - wavePhaseEase) * l.waveAmplitude;
                            }else{
                                l.length = (tt + Math.sin(l.waveTime + (l.wavePhase * Math.PI * 2)) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                            }
                        }
                    }
                }
                tension = 0
            }
            if(l.lengthFrom !== null){
                bypassFixed2 = false;
                if(l.fromType === fromTypes.length){
                    if(l.lengthFrom.isAttachedLine && l.lengthFrom.lengthFrom){
                        fVal = l.lengthFrom.length;
                        fValNorm = fVal / l.lengthFrom.lengthCurrent;
                    }else{
                        fx = l.lengthFrom.p1.x - l.lengthFrom.p2.x;
                        fy = l.lengthFrom.p1.y - l.lengthFrom.p2.y;
                        fVal = l.lengthFrom.lengthCurrent;//Math.sqrt(fx * fx + fy * fy);
                        //fValNorm = fVal / l.lengthFrom.startLength;
                        fValNorm = l.lengthFrom.lengthCurrent / l.lengthFrom.startLength;
                    }
                    updateLengthFrom(true);
                } else if(l.fromType === fromTypes.angle){
                    fx = l.lengthFrom.p1.x - l.lengthFrom.p2.x;
                    fy = l.lengthFrom.p1.y - l.lengthFrom.p2.y;
                    fVal = Math.sqrt(fx * fx + fy * fy);
                    fVal = Math.acos((lx / len) * (fy / fVal) - (ly / len) * (fx / fVal));
                    fValNorm = fVal / (Math.PI / 2);
                    fx = l.p2.startX - l.p1.startX;
                    fy = l.p2.startY - l.p1.startY;
                    var oLen = Math.sqrt(fx*fx + fy*fy);
                    fVal = fValNorm * oLen;
                    updateLengthFrom(false);
                } else if(l.fromType === fromTypes.speed){
                    var dx = l.lengthFrom.p1.x - l.lengthFrom.p1.ox
                    dx += l.lengthFrom.p2.x - l.lengthFrom.p2.ox
                    var dy = l.lengthFrom.p1.y - l.lengthFrom.p1.oy
                    dy += l.lengthFrom.p2.y - l.lengthFrom.p2.oy
                    dx /= 2;
                    dy /= 2;
                    fVal = Math.max(0.001,Math.sqrt(dx * dx + dy * dy));
                    var dir = (lx / len) * ( dy / fVal) - (ly / len) * ( dx / fVal);
                    if(l.isAttachedLine){
                        oLen = l.lengthCurrent;
                    }else{
                        var oLen = l.startLength;//Math.sqrt(fx*fx + fy*fy);
                    }
                    fVal = sCurveP(fVal,1.02);// + (l.startLength/100));
                    fValNorm = (fVal *dir);// / oLen;
                    fVal = oLen + (fVal*(oLen/1)) * dir; // OLen is the represents the lineFrom speed in pixels per second hence the oLen/60  for 60frames per second frame rate
                    updateLengthFrom(true,oLen);
                } else if(l.fromType === fromTypes.deltaA){
                    var dx = l.lengthFrom.p2.ox - l.lengthFrom.p1.ox;
                    var dx1 = l.lengthFrom.p2.x - l.lengthFrom.p1.x;
                    var dy = l.lengthFrom.p2.oy - l.lengthFrom.p1.oy;
                    var dy1 = l.lengthFrom.p2.y - l.lengthFrom.p1.y;
                    var len1 = Math.max(0.0001,Math.sqrt(dx * dx + dy * dy));
                    var len2 = Math.max(0.0001,Math.sqrt(dx1 * dx1 + dy1 * dy1));
                    fVal = Math.asin((dx / len1) * (dy1 / len2) -  (dy / len1) * (dx1 / len2));
                    fx = l.p2.startX - l.p1.startX;
                    fy = l.p2.startY - l.p1.startY;
                    var oLen = Math.sqrt(fx*fx + fy*fy);
                    fValNorm = fVal ;
                    fVal = oLen + fVal * oLen * Math.PI * 2;
                    updateLengthFrom(false); // use function scope vars rather than arguments
                } else if(l.fromType === fromTypes.st || l.fromType === fromTypes.si){
                    var stress = (l.lengthFrom.length - l.lengthFrom.lengthCurrent) / mainMenu.snapStrength;
                    fx = l.p2.startX - l.p1.startX;
                    fy = l.p2.startY - l.p1.startY;
                    var oLen = Math.sqrt(fx*fx + fy*fy);
					const sign = l.fromType === fromTypes.st ? 1 : -1;
					fVal = Math.max(-oLen, Math.min(oLen, stress));
                    fValNorm = fVal / oLen ;
                    fVal = oLen + fVal * sign;
                    updateLengthFrom(true); // use function scope vars rather than arguments
                }
                if(bypassFixed2){
                    lx = l.p2.x - l.p1.x;
                    ly = l.p2.y - l.p1.y;
                    len = Math.sqrt(lx*lx + ly*ly);
                }
            }
            if(!l.isAttachedLine){
                if(l.type === lineTypes.dampener){
                    if(l.p1.fixed && l.p2.fixed){
                        l.p1.x = l.p1.startX;
                        l.p1.y = l.p1.startY;
                        x = l.p2.startX - l.p1.startX;
                        y = l.p2.startY - l.p1.startY;
                        x1 = l.p2.x - l.p1.startX;
                        y1 = l.p2.y - l.p1.startY;
                        var le = (x1 * x + y1 * y)/(l.length * l.length);
                        l.p2.x = x * le + l.p1.startX;
                        l.p2.y = y * le + l.p1.startY;
                        bypassFixed2 = true;
                        lx = l.p2.x - l.p1.x;
                        ly = l.p2.y - l.p1.y;
                        len = Math.sqrt(lx*lx + ly*ly);
                    }
                    if(zeroDamp){
                        //zeroDamp = false;
                        if(dA){
                            fraction = ((l.dLen - len) / len) * dA;
                            lx *= fraction;
                            ly *= fraction;
                        }else{
                            fraction = ((l.length - len) / len) * dB;
                            lx *= fraction;
                            ly *= fraction;
                        }
                    } else {
                        l.dampC += (l.length- l.dLen) * l.dampA;
                        l.dampC *=   l.dampB;
                        l.dLen += l.dampC;
                        fraction = ((l.dLen - len) / len);
                        lx *= fraction;
                        ly *= fraction;
                        l.dLen -= Math.sqrt(lx*lx+ly*ly) * 0.5 * l.dampD * Math.sign(fraction);
                    }
                }else{
                    fraction = ((l.length * (tension + 1) - len) / len);
                    lx *= fraction;
                    ly *= fraction;
                    if(l.type === lineTypes.wave){
                        bypassFixed2 = true;
                    }
                }
                if(l.p2.fixed){
                    if(!l.p1.fixed){
                        l.p1.x -= lx * d1;
                        l.p1.y -= ly * d1;
                    }else if(bypassFixed2){
                        l.p2.x += lx * d2;
                        l.p2.y += ly * d2;
                    }
                }else if(l.p1.fixed){
                    if(!l.p2.fixed){
                        l.p2.x += lx * d2;
                        l.p2.y += ly * d2;
                    }
                }else{
                    l.p1.x -= lx * (1-balance) * d1;
                    l.p1.y -= ly * (1-balance) * d1;
                    l.p2.x += lx * balance * d2;
                    l.p2.y += ly * balance * d2;
                }
                if(l.type === lineTypes.thruster && pass === 0){
                    var nx = -(l.p2.y - l.p1.y) / 100; //len;
                    var ny = (l.p2.x - l.p1.x) / 100; //len;
                    var t = l.thrustCurrent;
                    l.p1.ox += nx * t;
                    l.p1.oy += ny * t;
                    l.p2.ox += nx * t;
                    l.p2.oy += ny * t;
                }
            }
            if(systemMenu.showDataGraph && !recordSound){
                if(l.selected){
                    if(l.type === lineTypes.dampener){
                        if(zeroDamp){
                            var y1 = Math.round((len - l.length) + 128) % 256;
                            gDataRawPix[y1] = 0xFFFF00FF;
                            gDataRawPix[y1 + 1] = 0xFFFF00FF;
                            gDataRawPix[y1 - 1] = 0xFFFF00FF;
                        }else{
                            var y = Math.round((l.dLen - l.length) + 128) % 256;
                            var y1 = Math.round((len - l.length) + 128) % 256;
                            if(y=== y1){
                                gDataRawPix[y] = 0xFFFFFF00;
                            }else{
                                gDataRawPix[y] = 0xFF00FF00;
                                gDataRawPix[y1] = 0xFFFF0000;
                            }
                        }
                    }else{
                        if(oLen!== undefined){
                            var y = Math.abs(Math.round((oLen - l.length) + 128) % 256);
                            gDataRawPix[y] = 0xFFFF00FF;
                        }else {
                            var y = Math.abs(Math.round((len - l.length) + 128) % 256);
                            gDataRawPix[y] = 0xFF00FFFF;
                            if(mainMenu.showStress){
                                var y = Math.round((l.stress/(mainMenu.snapStrength * l.wear))* 64 + 128) % 256;
                                y = y < 0 ? 0 : y > 255 ? 255 : y;
                                gDataRawPix[y] = getStressPix((l.stress/(mainMenu.snapStrength * l.wear)));
                            }
                        }
                    }
                }
            }
        }
    },
}, lists("Lines"));
const pointTypes = { normal : 0, lineFixed : 1, attchedToLine : 1, circleMove : 2,}
/* define a point and create a list of points */
var point = Object.assign( {}, util, {
    x : 0,
    y : 0,
    type : 0,
    imageIndex : 4,
    uid : 0,
    ox : 0,
    oy : 0,
    startX : 0,
    startY : 0,
    radius : 3,
    color : null,
    startRadius : 3,
    wheelSpeed : null,
    wheelTurn : null,
    valueFrom : null,
    screenSpace : false,
    posPoints : null,
    gravity : false,
    surfaceFriction : 0, //the friction applied by toucing a surface
    noGround : false,
    surface : false, // true if part of a surface
    angle : 0,
    oAngle : 0, // old Angle
    drag : 1,
    power : 0, // analogy of torque like
    powerPos : 0, // to display power
    startAngle : 0,
    fixed : false,
    fixX : null,  // relative position to fixture
    fixY : null,
    visible : true,
    viewable : true,
    image : null,
    flag : flagTypes.none,
    name : "Point",
    draw (col,lw,forceStyle = false) {
        var wid1,r;
        if(this.visible || !running){
            if(!running && !this.visible){ ctx.globalAlpha = 0.2 }
            if(running){
                if(this.screenSpace){
                    ctx.setTransform(1,0,0,1,0,0);
                    wid1 = ctx.lineWidth;
                    ctx.lineWidth = wid1 / invScale;
                    invScale = 1;
                }
            }
            if(running || (this.selected && !forceStyle)){
                if(this.color){
                    col = this.color;
                }
            }
            if(this.flag < flagTypes.none){
                col = this.selected ? COLS.flags.selCol[this.flag % COLS.flags.selCol.length] : COLS.flags.col[this.flag % COLS.flags.col.length];
                forceStyle = true;
            }
            ctx.fillStyle = col;
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            if(this.type === pointTypes.attchedToLine){
                if(!forceStyle){
                    ctx.fillStyle = !this.selected ? COLS.attachedPoint.col : COLS.attachedPoint.selCol;
                }
                r = this.radius + 0.2
                ctx.fillRect(this.x-r, this.y-r, r * 2,r * 2);
            } else if(this.type === pointTypes.circleMove){
                if(!forceStyle){
                    ctx.strokeStyle = !this.selected ? COLS.circleMove.col : COLS.circleMove.selCol;
                    ctx.lineWidth = COLS.circleMove.w;
                }
                if(running){
                    ctx.fillRect(this.x-3,this.y-3, 6,6);
                }else{
                    if(!forceStyle){
                        this.angle += this.wheelSpeed / CONST.wheelSpeedScale;
                        //this.angle += (this.wheelSpeed / 100) * (this.wheelSpeed / 100);// this.radius;
                    }
                    var ppx = Math.cos(this.angle) * this.radius + this.startX;
                    var ppy  = Math.sin(this.angle) * this.radius + this.startY;
                    ctx.beginPath();
                    ctx.arc(this.startX, this.startY,this.radius,0,Math.PI * 2);
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(Math.cos(this.startAngle) * this.radius + this.startX,Math.sin(this.startAngle) * this.radius + this.startY);
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(ppx,ppy);
                    ctx.rect(ppx - 3, ppy - 3, 6,6);
                    ctx.stroke();
                }
            }else{
                if(this.radius > forces.MIN_WHEEL_SIZE){
                    if (running) {
                        ctx.beginPath();
                        var pp = Math.abs(this.power / buildMenu.wheelTurn);
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        if(this.selected){
                            ctx.moveTo(this.x + this.radius-2, this.y);
                            ctx.arc(this.x, this.y, this.radius*pp, 0, Math.PI * 2);
                        }
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.x + Math.cos(this.angle) * this.radius, this.y + Math.sin(this.angle) * this.radius);
                        if(this.selected){
                            ctx.moveTo(this.x, this.y);
                            ctx.lineTo(this.x + Math.cos(this.powerPos) * (this.radius*pp), this.y + Math.sin(this.powerPos) * (this.radius*pp));
                        }
                        ctx.stroke();
                    } else {
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        var pp = Math.abs(this.power / buildMenu.wheelTurn);
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        const inRad = forces.MIN_WHEEL_SIZE * 2;
                        ctx.moveTo(this.x + CONST.cos45 * inRad, this.y + CONST.sin45 * inRad);
                        ctx.lineTo(this.x + CONST.cos45 * this.radius, this.y + CONST.sin45 * this.radius);
                        ctx.stroke();
                        ctx.lineWidth = lw;
                    }
                }
                var ss = ctx.strokeStyle;
                if(this.selected && this.valueFrom){
                    var wid = ctx.lineWidth;
                    ctx.lineWidth = invScale / 2;
                    ctx.strokeStyle = "blue";
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo((this.valueFrom.p1.x + this.valueFrom.p2.x) /2,(this.valueFrom.p1.y + this.valueFrom.p2.y) /2);
                    ctx.stroke();
                    ctx.strokeStyle = ss;
                    ctx.lineWidth = wid;
                }
                if(this.fixed){
                    if(!forceStyle){
                        ctx.strokeStyle = !this.selected ? COLS.fixedPoint.col : COLS.fixedPoint.selCol;
                        ctx.lineWidth = COLS.fixedPoint.w;;
                    }
                    ctx.strokeRect(this.x - (this.radius + 1), this.y - (this.radius + 1), this.radius * 2 + 2, this.radius * 2 + 2);
                    ctx.strokeStyle = ss;
                } else if(this.noGround){
                    if(!forceStyle){
                        ctx.strokeStyle = !this.selected ? COLS.noGround.col : COLS.noGround.selCol;
                        ctx.lineWidth = COLS.noGround.w;;
                    }
                    ctx.beginPath();
                    ctx.moveTo(this.x - (this.radius + 1), this.y - (this.radius + 1));
                    ctx.lineTo(this.x + (this.radius + 1), this.y + (this.radius + 1));
                    ctx.moveTo(this.x + (this.radius + 1), this.y - (this.radius + 1));
                    ctx.lineTo(this.x - (this.radius + 1), this.y + (this.radius + 1));
                    ctx.stroke();
                    ctx.strokeStyle = ss;
                }else if(this.radius <= forces.MIN_WHEEL_SIZE){
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
                    ctx.fill();
                }else{
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, forces.MIN_WHEEL_SIZE, 0, Math.PI * 2);
                    ctx.fill();
                }
                if(this.gravity){
                    ctx.strokeStyle = !this.selected ? COLS.gravPoint.col : COLS.gravPoint.selCol;
                    ctx.lineWidth = !this.selected ? COLS.gravPoint.w : COLS.gravPoint.selW;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
            if(running && this.screenSpace){
                view.apply(ctx);
                invScale = view.invScale;
                ctx.lineWidth = wid1;
            }
        }
    },
    distFrom(x,y){
        x = this.x - x;
        y = this.y - y;
        return Math.sqrt(x * x + y * y);
    },
    remember(){
        if(this.type === pointTypes.circleMove){
            this.angle = this.startAngle;
            this.startX = this.x;
            this.startY = this.y;
        }else{
            this.startX = this.x;
            this.startY = this.y;
            this.startAngle = this.angle;
        }
        if(this.gravity){
            var p = gravPoints.getById(this.id);
            if(p === undefined){ gravPoints.add(this) }
        }
    },
    revert(){
        this.ox = this.x = this.startX;
        this.oy = this.y = this.startY;
        this.oAngle = this.angle = this.startAngle;
    },
    setPoint(x,y){
        if(this.type === pointTypes.circleMove){
            this.startX = this.ox = this.x = x;
            this.startY = this.oy = this.y = y;
        }else{
            this.ox = this.x = x;
            this.oy = this.y = y;
        }
    },
    movePoint(x,y){
        if(this.type === pointTypes.circleMove){
            this.startX = this.x = x;
            this.startY = this.y = y;
        }else{
            this.x = x;
            this.y = y;
        }
    },
    isInBox(box){ return this.x>box.left && this.x < box.right && this.y > this.top && this.y < box.bottom },
    updatePosPoints(){
        var p = this;
        if(p.posPoints !== null){
            var x,y;
            x = 0;
            y = 0;
            for(var i = 0; i < p.posPoints.length; i++){ x += p.posPoints[i].x; y += p.posPoints[i].y }
            p.ox = p.x;
            p.oy = p.y;
            p.x = x /  p.posPoints.length;
            p.y = y /  p.posPoints.length;
        }
    },
    isLineCyclic(line){
        if(line.p1.id === this.id || line.p2.id === this.id) { return true }
        if(line.p1.valueFrom &&  this.isLineCyclic(line.p1.valueFrom)) { return true }
        if(line.p2.valueFrom &&  this.isLineCyclic(line.p2.valueFrom)) { return true }
        if(line.lengthFrom === null ) { return false }
        if(line.lengthFrom.p1.id === this.id || line.lengthFrom.p2.id === this.id) { return true }
        if(line.lengthFrom.p1.valueFrom &&  this.isLineCyclic(line.lengthFrom.p1.valueFrom)) { return true }
        if(line.lengthFrom.p2.valueFrom &&  this.isLineCyclic(line.lengthFrom.p2.valueFrom)) { return true }
        return false;
    },
    update(){
        if (!this.fixed && this.radius > 0 && this.viewable) {
            points.massCenter.x += this.x;
            points.massCenter.y += this.y;
            points.massCenter.count += 1;
        }
    },  // required stub
    makeSafeForDelete(){
        points.eachItem(item=>{
            if(this.id !== item.id){
                if(item.valueFrom !== null && item.valueFrom.id === this.id){ item.valueFrom = null }
                if(item.posPoints !== null){
                    for(var i = 0; i < item.posPoints.length; i++){
                        if(item.posPoints[i].id === this.id){ item.posPoints.splice(i--,1) }
                    }
                    if(item.posPoints.length === 0){ item.posPoints = null }
                }
            }
        });
        imageList.remove(this.id);
        outlines.removePoint(this);
        lines.dettachPoint(this);
    }
});
var points = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(
                Object.assign(
                    {},
                    point,{
                        excludeFromShadow : {
                            keys : ["ox","oy","startX","startY","surfaceFriction","wheelTurn"],
                            restore(item){
                                item.startX = item.ox = item.x;
                                item.startY = item.oy = item.y;
                                //surfaceFriction = 0;
                            }
                        }
                    }
                )
            );
        }
        return this.defaultItem;
    },
    create (x, y) { return Object.assign({}, point, { x : x,  y : y, ox : x, oy : y, startX : x, startY : y, oAngle : 0, angle : 0,  power : 0, powerPos : 0, }) },
    copy (x,y,oldPoint) { return Object.assign({}, point,oldPoint, { x : x, y : y,  ox : x,  oy : y, startX : x, startY : y, oAngle : 0, angle : 0, power : 0,  powerPos : 0, id : null, }) },
    fromArray (pArray) {
        for (var i = 0; i < pArray.length; i +=2) { this.add(this.create(pArray[i], pArray[i + 1])) }
        return this;
    },
    getExtent(extent = {},callback,ofStart){
        if(callback){
            extent.left = null;
            for(var i = 0; i < this.items.length; i ++){
                var p = this.items[i];
                if(callback(p) === true){
                    if(extent.left === null){
                        if(ofStart){
                            extent.left = p.startX - p.radius;
                            extent.top = p.startY - p.radius;
                            extent.right = p.startX + p.radius;
                            extent.bottom = p.startY + p.radius;
                        }else{
                            extent.left = p.x - p.radius;
                            extent.top = p.y - p.radius;
                            extent.right = p.x + p.radius;
                            extent.bottom = p.y + p.radius;
                        }
                    }else{
                        if(ofStart){
                            extent.left = Math.min(p.startX - p.radius,extent.left);
                            extent.top = Math.min(p.startY - p.radius,extent.top);
                            extent.right = Math.max(p.startX + p.radius,extent.right);
                            extent.bottom = Math.max(p.startY + p.radius,extent.bottom);
                        }else{
                            extent.left = Math.min(p.x - p.radius,extent.left);
                            extent.top = Math.min(p.y - p.radius,extent.top);
                            extent.right = Math.max(p.x + p.radius,extent.right);
                            extent.bottom = Math.max(p.y + p.radius,extent.bottom);
                        }
                    }
                }
            }
            return extent;
        }
        extent.left = null;
        for(var i = 0; i < this.items.length; i ++){
            var p = this.items[i];
            if(p.viewable){
                if(extent.left === null){
                    if(ofStart){
                        extent.left = p.startX - p.radius;
                        extent.top = p.startY - p.radius;
                        extent.right = p.startX + p.radius;
                        extent.bottom = p.startY + p.radius;
                    }else{
                        extent.left = p.x - p.radius;
                        extent.top = p.y - p.radius;
                        extent.right = p.x + p.radius;
                        extent.bottom = p.y + p.radius;
                    }
                }else{
                    if(ofStart){
                        extent.left = Math.min(p.startX - p.radius,extent.left);
                        extent.top = Math.min(p.startY - p.radius,extent.top);
                        extent.right = Math.max(p.startX + p.radius,extent.right);
                        extent.bottom = Math.max(p.startY + p.radius,extent.bottom);
                    }else{
                        extent.left = Math.min(p.x - p.radius,extent.left);
                        extent.top = Math.min(p.y - p.radius,extent.top);
                        extent.right = Math.max(p.x + p.radius,extent.right);
                        extent.bottom = Math.max(p.y + p.radius,extent.bottom);
                    }
                }
            }
        }
        return extent;
    },
    getMeanPos(){
        if(this.meanPos === undefined) { this.meanPos = {x:0,y:0,c:0,minx:0,lastStartLine : 0} }
        this.meanPos.x = 0;
        this.meanPos.y = 0;
        this.meanPos.c = 0;
        this.meanPos.minx = Infinity;
        for(var i = 0; i < this.items.length; i ++){
            var p = this.items[i];
            if(!p.fixed){
                if(p.viewable){
                    this.meanPos.x += p.x;
                    this.meanPos.y += p.y;
                    this.meanPos.c += 1;
                }
                this.meanPos.minx = Math.min(p.x,this.meanPos.minx);
            }
        }
        if(this.meanPos.c > 0){
            this.meanPos.x /= this.meanPos.c;
            this.meanPos.y /= this.meanPos.c;
        }
    },
    move(){
        if(this.meanPos === undefined){  this.meanPos = {x:0,y:0,c:0,minx:0,lastStartLine : 0} }
        this.meanPos.x = 0;
        this.meanPos.y = 0;
        this.meanPos.c = 0;
        this.meanPos.minx = Infinity;
        pointStack.empty();
        for(var i = 0; i < this.items.length; i ++){
            var p = this.items[i];
            if(p.valueFrom){
                if(p.radius > forces.MIN_WHEEL_SIZE && p.wheelSpeed !== null){
                    p.wheelTurn = p.wheelSpeed * ((p.valueFrom.lengthCurrent - p.valueFrom.startLength) / p.valueFrom.startLength);
                }
            }else{
                if(p.radius > forces.MIN_WHEEL_SIZE && p.wheelSpeed !== null){ p.wheelTurn = p.wheelSpeed }
            }
            if(!p.fixed){
                var vx = (p.x - p.ox) * forces.AIR_FRICTION; // Not really ait friction Needs to be refactored some time
                var vy = (p.y - p.oy) * forces.AIR_FRICTION; // its just a dampening FX
                var speed = Math.sqrt(vx*vx+vy*vy);
                if(p.drag < 1){
                    var d = 1-(((2 / (1 + Math.pow(1.2,-speed)))-1) * (1-p.drag));
                    vx *= d;
                    vy *= d;
                }
                if(p.radius > forces.MIN_WHEEL_SIZE){
                    if(isNaN(p.angle)){ // when picking up wheel with mouse during sim running pushing the wheel to the ground creates a NaN that I have not found the cause of. This is just a quick fix
                        p.angle = 0; p.oAngle = 0;  p.power = 0;  p.powerPos = 0;
                    }
                    if(p.wheelTurn !== null){
                        if(p.pC === undefined){
                            p.pC = 0;
                            p.pR = 0;
                        }
                        p.power += ((p.wheelTurn / p.radius) - p.pR) / 8;
                        p.pC += (p.power - p.pR) * 0.45;
                        p.pC *= 0.45;
                        p.pR += p.pC;
                        p.power *= 0.95;
                        //var va = (p.angle - p.oAngle);
                        p.oAngle = p.angle;
                        p.angle += p.pR;
                        p.powerPos += p.pR;
                    }else{
                        var va = (p.angle - p.oAngle);
                        p.oAngle = p.angle;
                        p.angle += va;
                    }
                }
                p.ox = p.x;
                p.oy = p.y;
                p.x += vx;
                p.y += vy;
                p.y += forces.GRAVITY;
                p.surfaceFriction = 0;
                if(p.viewable){
                    this.meanPos.x += p.x;
                    this.meanPos.y += p.y;
                    this.meanPos.c += 1;
                }
                this.meanPos.minx = Math.min(p.x,this.meanPos.minx);
            }else{
                if(p.type === pointTypes.circleMove){
                    p.ox = p.x;
                    p.oy = p.y;
                    p.oAngle = p.angle;
                    p.angle += p.wheelSpeed / CONST.wheelSpeedScale;
                    p.x = Math.cos(p.angle) * p.radius + p.startX;
                    p.y = Math.sin(p.angle) * p.radius + p.startY;
                }
                if(p.posPoints !== null){
                    pointStack.push(p);
                }
            }
        }
        if(this.meanPos.c > 0){
            this.meanPos.x /= this.meanPos.c;
            this.meanPos.y /= this.meanPos.c;
        }
    },
    applyGravityPoints(){
        for(var j = 0; j < gravPoints.length; j ++){
            var g = gravPoints.items[j];
            var m1 = g.radius *g.radius *g.radius * Math.PI * 0.75;
            for(var i = 0; i < this.items.length; i ++){
                var p = this.items[i];
                if(!p.fixed){
                    if(g.id !== p.id){
                        var gx = g.x - p.x;
                        var gy = g.y - p.y;
                        var dist = Math.max(g.radius,Math.sqrt(gx * gx + gy * gy));
                        gx /= dist;
                        gy /= dist;
                        var f = 0.01 * m1 / (dist * dist);
                        p.x += gx * f;
                        p.y += gy * f;
                    }
                }
            }
        }
    },
    constrainToLine(line,changeVelocity,transferForce = false){
        var vx,vy,startLine,foundLine,r,i,l,l1,snx,sny,nvx,nvy,len,touching,lenV,move,rx,ry,sx,sy,lpx,lpy,l1px,l1py,ox,oy,px,py,c,plen,pnx,pny,lLen,hx,hy,lenR,nrx,nry,c,c1,nd,b;
        if(line.items.length === 0) { return }
        if(this.meanPos.minx > line.items[line.items.length - 1].x){ return }
        startLine = 0;
        //if(this.meanPos.lastStartLine < this.items.length && this.meanPos.minx > line.items[this.meanPos.lastStartLine].x){
        if(this.meanPos.lastStartLine < line.items.length && this.meanPos.minx > line.items[this.meanPos.lastStartLine].x){
            startLine = this.meanPos.lastStartLine;
        }
        for(i = startLine; i < line.items.length; i += 1){
            l = line.items[i];
            if(l.x + 100 > this.meanPos.minx){
                startLine = i - 1;
                startLine = startLine < 0 ? 0 : startLine;
                this.meanPos.lastStartLine = startLine;
                break;
            }
        }
        this.eachItem(p=>{
            if(p.noGround || (transferForce && p.surface)){ return }
            vx = (p.x - p.ox);
            vy = (p.y - p.oy);
            lenV = Math.hypot(vx,vy);
            r = p.radius;
            foundLine = -1;
            for(i = startLine; i < line.items.length - 1; i += 1){
                l = line.items[i];
                l1 = line.items[i+1];
                lpx = l.x + l.j1x  * p.radius;
                lpy = l.y + l.j1y  * p.radius;
                if(p.x >= lpx){
                    l1px = l1.x + l1.j1x  * p.radius;
                    l1py = l1.y + l1.j1y  * p.radius;
                    if(p.x < l1px){
                        foundLine = 1;
                        snx = l.ny;  // pointing up
                        sny = -l.nx;
                        ox = snx * p.radius
                        oy = sny * p.radius
                        px = p.x-(l.x+ox);
                        py = p.y-(l.y+oy);
                        c= l.vx * py - l.vy * px;
                        if(c > 0){
                            nvx = vx / lenV;
                            nvy = vy / lenV;
                            plen = Math.sqrt(px * px + py * py);
                            pnx = px / plen;
                            pny = py / plen;
                            lLen = (px * l.vx + py * l.vy)/(l.dist * l.dist);
                            hx = l.vx * lLen + (l.x+ox);
                            hy = l.vy * lLen + (l.y+oy);
                            lenR = (vx * l.nx + vy * l.ny) * 2; // dot
                            rx = l.nx * lenR -vx; // new refelected velocity
                            ry = l.ny * lenR -vy;
                            len = Math.sqrt(rx * rx + ry * ry);
                            nrx = rx / len; // new refelected velocity normlised
                            nry = ry / len;
                            var b = (l.nx * nvy - l.ny * nvx) * lenV; // cross velocity to surface normal
                            p.surfaceFriction += b > 0 ? b * forces.SURFACE_FRICTION : 0;
                            p.surfaceFriction = p.surfaceFriction > 1 ? 1 : p.surfaceFriction;
                            if(transferForce && changeVelocity){
                                var ddx = p.x - snx * r;
                                var ddy = p.y - sny * r;
                                var lp1x = ddx - l.point.x;
                                var lp1y = ddy - l.point.y;
                                var lp2x = ddx - l1.point.x;
                                var lp2y = ddy - l1.point.y;
                                var ds1 = Math.sqrt(lp1x * lp1x + lp1y * lp1y);
                                var ds2 = Math.sqrt(lp2x * lp2x + lp2y * lp2y);
                                var amount = 1- (ds1 / (ds1 + ds2));
                                if(b > 0){
                                    amount = amount * 0.25 * b;
                                    if(!l.point.fixed){
                                        l.point.ox += snx * amount;
                                        l.point.oy += sny * amount;
                                        rx -= snx * amount;
                                        ry -= sny * amount;
                                    }
                                    if(!l1.point.fixed){
                                        l1.point.ox += snx * (1-amount);
                                        l1.point.oy += sny * (1-amount);
                                        rx -= snx * (1-amount);
                                        ry -= sny * (1-amount);
                                    }
                                }
                            }
                            if(r > forces.MIN_WHEEL_SIZE){
                                if(changeVelocity){
                                    sx = snx * b; // apply bounce from surface
                                    sy = sny * b;
                                    sx += l.nx * -l.ny * forces.GRAVITY;
                                    sy += l.ny * -l.ny * forces.GRAVITY;
                                    nvx = hx-p.ox;
                                    nvy = hy-p.oy;
                                    lenV = Math.sqrt(nvx * nvx + nvy * nvy);
                                    if(lenV !== 0){
                                        nvx /= lenV;
                                        nvy /= lenV;
                                    }
                                    p.x = hx;
                                    p.y = hy;
                                    c1 = snx * nvy - sny * nvx;
                                    nd = (lenV * c1)/r;
                                    if(p.wheelTurn !== null){
                                        p.power += ((p.wheelTurn / r) - nd) / 8;
                                        move = p.pR * r;
                                        sx += l.nx * move;
                                        sy += l.ny * move;
                                    }else{
                                        p.power += ((0/r) - nd) / 8;
                                        move = nd * r;
                                        sx += l.nx * move;
                                        sy += l.ny * move;
                                    }
                                    p.oAngle = p.angle - nd;
                                    sx *= forces.WHEEL_FRICTION;
                                    sy *= forces.WHEEL_FRICTION;
                                    rx *= 1-forces.WHEEL_FRICTION;
                                    ry *= 1-forces.WHEEL_FRICTION;
                                    p.ox = hx - rx - sx;
                                    p.oy = hy - ry - sy;
                                }else{
                                    p.x = hx;
                                    p.y = hy;
                                }
                            }else{
                                p.x = hx;
                                p.y = hy;
                                if(changeVelocity){
                                    //var b = l.nx * nvy - l.ny * nvx; // cross velocity to surface normal
                                    sx = snx * b; // apply bounce from surface
                                    sy = sny * b;
                                    // apply force to negate slippage due to gravity
                                    sx += l.nx * -l.ny * forces.GRAVITY;
                                    sy += l.ny * -l.ny * forces.GRAVITY;
                                    sx *= forces.SURFACE_FRICTION;
                                    sy *= forces.SURFACE_FRICTION;
                                    rx *= 1-forces.SURFACE_FRICTION;
                                    ry *= 1-forces.SURFACE_FRICTION;
                                    p.ox = hx - rx - sx;
                                    p.oy = hy - ry - sy;
                                }
                            }
                        }
                    }
                }
                if(foundLine === 1){ foundLine = 0 }
                else if(foundLine === 0){ break }
            }
        });
    },
    constrainBounds (box,changeVelocity = true){
        var vx,vy,speed,p,i,r,c,d;
        for(i = 0; i < this.items.length; i ++){
            p = this.items[i];
            if(!p.fixed){
                vx = (p.x - p.ox);
                vy = (p.y - p.oy);
                speed = Math.sqrt(vx*vx + vy*vy);
                r = p.radius;
                if(changeVelocity){
                    if(p.y <= box.top + r){
                        p.y = box.top + r;
                        p.oy = p.y + vy * forces.SURFACE_FRICTION;
                        p.ox = p.x - vx * forces.SURFACE_FRICTION;
                    }
                    if(p.y >= box.bottom - r){
                        p.y = box.bottom - r;
                        p.oy = p.y + vy * forces.SURFACE_FRICTION;
                        p.ox = p.x - vx * forces.SURFACE_FRICTION;// * (vy / speed)
                    }
                    if(p.x <= box.left + r){
                        p.x = box.left + r;
                        p.ox = p.x + vx * forces.SURFACE_FRICTION;
                        p.oy = p.y - vy * forces.SURFACE_FRICTION;
                    }
                    if(p.x >= box.right - r){
                        p.x = box.right - r;
                        p.ox = p.x + vx * forces.SURFACE_FRICTION;
                        p.oy = p.y - vy * forces.SURFACE_FRICTION;
                    }
                }else{
                    if(p.y < box.top + r){
                        p.y = box.top + r;
                    }
                    if(p.y > box.bottom - r){
                        p.y = box.bottom - r;
                    }
                    if(p.x < box.left + r){
                        p.x = box.left + r;
                    }
                    if(p.x > box.right - r){
                        p.x = box.right - r;
                    }
                }
            }
        }
    }
}, lists("points"));
points.massCenter = {x: 0, y: 0, count: 0};
const pointStack = createObjectStack();
var ground = Object.assign( {}, util, {
    x : 0,
    y : 0,
    nx : 0,
    ny : 0,
    vx : 0,
    vy : 0,
    dist : 0,
    flag : flagTypes.none,
    name : "groundLine",
    distFrom(x,y){
        x = this.x - x;
        y = this.y - y;
        return Math.sqrt(x * x + y * y);
    },
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * invScale, 0, Math.PI * 2);
        ctx.fill();
    },
});
var groundLines = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({}, {x:0,y:0, flag : flagTypes.none,}));
        }
        return this.defaultItem;
    },
    getPointOnLine(p){
        var i;
        for(i = 0; i < this.items.length-1; i ++){
            if(this.items[i].x < p.x && this.items[i+1].x > p.x){
                var p1 = this.items[i];
                var p2 = this.items[i+1];
                var x = p2.x - p1.x;
                var y = p2.y - p1.y;
                var x1 = p.x - p1.x;
                var y1 = p.y - p1.y;
                var l;
                var len = Math.sqrt(l=(x * x + y * y));
                var d = len*( (x1 * x + y1 * y)/l);
                p.x = p1.x + (x / len) * d;
                p.y = p1.y + (y / len) * d;
                this.indexOfPoint = i;
                return p;
            }
        }
        this.indexOfPoint = undefined;
    },
    create (x,y) {
        return Object.assign({}, ground, {x,y});
    },
    fix (){
        // remove duplicates or points too close
        var i;
        for(i = 0; i < this.items.length-1; i ++){
            var vx = this.items[i+1].x - this.items[i].x;
            var vy = this.items[i+1].y - this.items[i].y;
            var dist = Math.sqrt(vx * vx + vy * vy);
            if(dist < 1){
                this.items.splice(i--,1);
                this.length -= 1;
            }
        }
        for(i = 0; i < this.items.length-1; i ++){
            var vx = this.items[i+1].x - this.items[i].x;
            var vy = this.items[i+1].y - this.items[i].y;
            var dist = Math.sqrt(vx * vx + vy * vy);
            this.items[i].vx = vx;
            this.items[i].vy = vy;
            this.items[i].nx = vx / dist;
            this.items[i].ny = vy / dist;
            this.items[i].dist = dist;
        }
        if(this.items.length > 0){
            // get the join lines for each line /*todo should only have one join not two (j1 & j2))
            this.items[0].j1x = this.items[0].ny;
            this.items[0].j1y = -this.items[0].nx;
            for(i = 1; i < this.items.length; i ++){
                var l1 = this.items[i-1];
                var l2 = this.items[i];
                var nx = l1.ny + l2.ny;
                var ny = -l1.nx - l2.nx;
                var dist = Math.sqrt(nx*nx + ny*ny);
                l2.j1x = l1.j2x = nx / dist;
                l2.j1y = l1.j2y = ny / dist;
                var c =(-l2.j1y * l2.ny - l2.j1x * l2.nx);
                var a =c * (1 / Math.cos(Math.asin(-l2.j1y * l2.ny - l2.j1x * l2.nx)));
                a = Math.sqrt(1 + a * a)
                l2.j1x *= a;
                l2.j1y *= a;
                l1.j2x *= a;
                l1.j2y *= a;
            }
        }
    },
    getExtent(extent = {},callback){
        if(callback){
            extent.left = null;
            for(var i = 0; i < this.items.length; i ++){
                var p = this.items[i];
                if(callback(p) === true){
                    if(extent.left === null){
                        extent.left = p.x;
                        extent.top = p.y;
                        extent.right = p.x;
                        extent.bottom = p.y;
                    }else{
                        extent.left = Math.min(p.x,extent.left);
                        extent.top = Math.min(p.y,extent.top);
                        extent.right = Math.max(p.x,extent.right);
                        extent.bottom = Math.max(p.y,extent.bottom);
                    }
                }
            }
            return extent;
        }
        extent.left = null;
        for(var i = 0; i < this.items.length; i ++){
            var p = this.items[i];
            if(extent.left === null){
                extent.left = p.x;
                extent.top = p.y;
                extent.right = p.x;
                extent.bottom = p.y;
            }else{
                extent.left = Math.min(p.x,extent.left);
                extent.top = Math.min(p.y,extent.top);
                extent.right = Math.max(p.x,extent.right);
                extent.bottom = Math.max(p.y,extent.bottom);
            }
        }
        return extent;
    },
}, lists("groundLine"),{
    draw(){
        var i,j;
        if(this.items.length > 1){
            ctx.beginPath();
            ctx.moveTo(this.items[0].x,this.items[0].y);
            for(i = 1; i < this.items.length; i ++){
                ctx.lineTo(this.items[i].x,this.items[i].y);
            }
            ctx.stroke();
        }
    },
    createLine(lines){
        var i,j;
        if(this.items.length > 1){
            lines.empty();
            for(i = 0; i < this.items.length-2; i += 2){
                var p1 = this.items[i];
                var p2 = this.items[i+1];
                var p3 = this.items[i+2];
                var x = p3.x - p1.x;
                var y = p3.y - p1.y;
                for(j = 0; j < 1; j+= 0.1){
                    var x1 = p1.x + x * j;
                    var y1 = p1.y + y * j;
                    var xx = p2.x - x1;
                    var yy = p2.y - y1;
                    var jj = Math.sin(j * Math.PI) * 0.3;
                    x1 += xx * jj;
                    y1 += yy * jj;
                    lines.add(lines.create(x1,y1));
                }
            }
            lines.items.sort((a,b)=>{
                return a.x - b.x;
            })
            lines.fix();
        }
    }
});
var gravPoints = Object.assign({},lists("gravity"));
var surface = Object.assign( {}, util, {
    x : 0,
    y : 0,
    nx : 0,
    ny : 0,
    vx : 0,
    vy : 0,
    dist : 0,
    point : null,
    name : "surfacePoint",
    distFrom(x,y){
        x = this.x - x;
        y = this.y - y;
        return Math.sqrt(x * x + y * y);
    },
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * invScale, 0, Math.PI * 2);
        ctx.fill();
    },
});
var surfaceLines = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({}, {x:0,y:0}));
        }
        return this.defaultItem;
    },
    getPointOnLine(p){
        for(var i = 0; i < this.items.length-1; i ++){
            if(this.items[i].x < p.x && this.items[i+1].x > p.x){
                var p1 = this.items[i];
                var p2 = this.items[i+1];
                var x = p2.x - p1.x;
                var y = p2.y - p1.y;
                var x1 = p.x - p1.x;
                var y1 = p.y - p1.y;
                var l;
                var len = Math.sqrt(l=(x * x + y * y));
                var d = len*( (x1 * x + y1 * y)/l);
                p.x = p1.x + (x / len) * d;
                p.y = p1.y + (y / len) * d;
                this.indexOfPoint = i;
                return p;
            }
        }
        this.indexOfPoint = undefined;
    },
    create (point) {
        point.surface = true;
        return Object.assign({}, surface, {point});
    },
    sort(){
        this.items.sort((a,b)=>a.point.x - b.point.x);
    },
    fix (){
        var i;
        if(this.items.length === 0 ){
            return;
        }
        for(i = 0; i < this.items.length; i ++){
            this.items[i].x = this.items[i].point.x;
            this.items[i].y = this.items[i].point.y;
        }
        for(i = 0; i < this.items.length-1; i ++){
            var vx = this.items[i+1].x - this.items[i].x;
            var vy = this.items[i+1].y - this.items[i].y;
            var dist = Math.sqrt(vx * vx + vy * vy);
            this.items[i].vx = vx;
            this.items[i].vy = vy;
            this.items[i].nx = vx / dist;
            this.items[i].ny = vy / dist;
            this.items[i].dist = dist;
        }
        // get the join lines for each line /*todo should only have one join not two (j1 & j2))
        this.items[0].j1x = this.items[0].ny;
        this.items[0].j1y = -this.items[0].nx;
        for(i = 1; i < this.items.length; i ++){
            var l1 = this.items[i-1];
            var l2 = this.items[i];
            var nx = l1.ny + l2.ny;
            var ny = -l1.nx - l2.nx;
            var dist = Math.sqrt(nx*nx + ny*ny);
            l2.j1x = l1.j2x = nx / dist;
            l2.j1y = l1.j2y = ny / dist;
            var c =(-l2.j1y * l2.ny - l2.j1x * l2.nx);
            var a =c * (1 / Math.cos(Math.asin(-l2.j1y * l2.ny - l2.j1x * l2.nx)));
            a = Math.sqrt(1 + a * a)
            l2.j1x *= a;
            l2.j1y *= a;
            l1.j2x *= a;
            l1.j2y *= a;
        }
    }
}, lists("groundLine"),{
    draw(){
        var i;
        if(this.items.length > 1){
            ctx.beginPath();
            ctx.moveTo(this.items[0].x,this.items[0].y);
            for(i = 1; i < this.items.length; i ++){
                ctx.lineTo(this.items[i].x,this.items[i].y);
            }
            ctx.stroke();
        }
    }
});
var outline = Object.assign( {}, util, {
    points : null,
    lineWidth : 3,
    lineColour : "black",
    fillColour : "yellow",
    lineRGBA : [0,0,0,255],
    fillRGBA : [255,255,0,255],
    zIndex : 50,
    name : "outline",
    update(){
        if(this.lineRGBA[3] > 0)  {
            this.lineColour = "rgba(";
            this.lineColour += this.lineRGBA[0] + ",";
            this.lineColour += this.lineRGBA[1] + ",";
            this.lineColour += this.lineRGBA[2] + ",";
            this.lineColour += (this.lineRGBA[3]/255) + ")";
        }else{
            this.lineColour = null;
        }
        if(this.fillRGBA[3] > 0)  {
            this.fillColour = "rgba(";
            this.fillColour += this.fillRGBA[0] + ",";
            this.fillColour += this.fillRGBA[1] + ",";
            this.fillColour += this.fillRGBA[2] + ",";
            this.fillColour += (this.fillRGBA[3]/255) + ")";
        }else{
            this.fillColour = null;
        }
    },
    draw() {
        if (this.points.length > 0) {
            if (!running){ ctx.globalAlpha = 0.5; }
            ctx.beginPath();
            for (const path of this.points) {
                if (path && path.length > 0) {
                    var i = 0;
                    ctx.moveTo(path[i].x, path[i].y);
                    i++;
                    while (i < path.length) {                
                        ctx.lineTo(path[i].x, path[i].y);
                        i++;
                    }
                }
            }
            if (this.selected &&  !running) {
                //ctx.globalAlpha = Math.sin(globalTime / 100) * 0.5 + 0.5;
                ctx.lineWidth = this.lineWidth * 2;
                ctx.strokeStyle = "#F00";
                ctx.stroke();                
            }
            if (this.fillColour) {
                ctx.fillStyle = this.fillColour;
                ctx.fill("evenodd");
            }
            if (this.lineColour) {
                ctx.lineWidth = this.lineWidth;
                ctx.strokeStyle = this.lineColour;
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    },
});
var outlines = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({}, outline));
        }
        return this.defaultItem;
    },
    create(zIndex){
        var firstLine, nextLine, nextPoint, firstPoint, outlining;
        lines.eachSelected(line => { firstLine = line; return true; })
        if (firstLine === undefined) { return; }
        
        var outL = Object.assign({}, outline);
        outL.points = [];
        outL.lineRGBA = [outlineMenu.lineR, outlineMenu.lineG, outlineMenu.lineB, outlineMenu.lineA];
        outL.fillRGBA = [outlineMenu.fillR, outlineMenu.fillG, outlineMenu.fillB, outlineMenu.fillA];
        outL.zIndex = zIndex;
        
        while (firstLine) {
            var pointSet = [];
            outL.points.push(pointSet);
            nextLine = firstLine;
            firstPoint = nextLine.p1;
            nextPoint = nextLine.p2;
            if (nextLine) {
                outlining = true;
                //outL.points.push(firstPoint);
                pointSet.push(firstPoint);
                while (outlining) {
                    //outL.points.push(nextPoint);
                    pointSet.push(nextPoint);
                    nextLine.selected = false;
                    outlining = false;
                    if (nextPoint.id !== firstPoint.id) {
                        lines.eachSelected(line => {
                            if (nextPoint.id === line.p1.id) {
                                nextLine = line;
                                nextPoint = nextLine.p2;
                                outlining = true;
                                return true;
                            }
                            if (nextPoint.id === line.p2.id) {
                                nextLine = line;
                                nextPoint = nextLine.p1;
                                outlining = true;
                                return true;
                            }
                        });
                    }
                }
            }
            firstLine = undefined;
            lines.eachSelected(line => { firstLine = line; return true; })
        }
        outL.update();
        return outL;
    },
    removeEmpty(){
        var deleting = true;
        var i;
        while(deleting){
            deleting = false;
            this.eachItem(outline=>{
                i = 0;
                while (i < outline.points.length) {
                    if (outline.points[i].length === 0) {
                        outline.points.splice(i--, 1);
                    }
                    i++;
                    
                }                
                if(outline.points.length === 0){
                    this.remove(outline.id);
                    deleting = true;
                    return true;
                }
            })
        }
    },
    removePoint(point){
        this.eachItem(outline => {
            var i;
            for (const path of outline.points) {
                for (i = 0; i < path.length; i ++) {
                    path.splice(i--, 1);
                }
            }

        });
        this.removeEmpty();
    },
    updateSelected(){
        this.eachItem(outline=>{
            outline.selected = false;
            for (const path of outline.points) {
                for (const point of path) {
                    var id = point.id;
                    if(point.selected){
                        outline.selected = true;
                        break;
                    }
                    if(lines.ifAny(line =>line.selected && (line.p1.id === id || line.p2.id === id))){
                        outline.selected = true;
                        break;
                    }                        
                }
                if (outline.selected) { break; }
            }
        })
    },
    sort(){
        this.items.sort((a,b)=>a.zIndex - b.zIndex);
    },
    fromShadowCustom(shadowed) {
        for (const sOut of shadowed) {
            var outL = Object.assign({}, outline);
            outL.points = [];
            outL.lineRGBA = [...sOut.lCol];
            outL.fillRGBA = [...sOut.fCol];
            outL.zIndex = sOut.zIndex;           
            outL.lineWidth = sOut.lineWidth;
            
            for (const path of sOut.points) {
                outL.points.push(path.map(id => points.getById(id)));
            }  
            outL.update();
            outlines.add(outL);            
        }
    },
    shadowCustom() {
        const shadowed = [];
        this.eachItem(outline=>{
            shadowed.push({
                lCol: outline.lineRGBA,
                fCol: outline.fillRGBA,
                lineWidth: outline.lineWidth,
                zIndex: outline.zIndex,
                points: (()=> {
                    const paths = [];
                    for (const path of outline.points)  {
                        paths.push(path.map(p => p.id));
                    }
                    return paths;
                })()
            });            
        });
        return shadowed;
    }
},lists("outlines"));
function setMirrorPoint(point,mirror){
    var ml = buildMenu.currentMirrorLine;
    if(ml === undefined){
        ml = lines.getIf(line=>line.mirrorLine);
    }
    if(ml){
        var x = ml.p2.x - ml.p1.x;
        var y = ml.p2.y - ml.p1.y;
        var dir = -Math.atan2(y,x);
        var len = Math.sqrt(x * x + y * y);
        var nx = x / len;
        var ny = y / len;
        var x1 = point.x - ml.p1.x;
        var y1 = point.y - ml.p1.y;
        var px = x1 * Math.cos(dir) - y1 * Math.sin(dir);
        var py = -(x1 * Math.sin(dir) + y1 * Math.cos(dir));
        var mx = px * nx - py * ny + ml.p1.x;
        var my = px * ny + py * nx + ml.p1.y;
        mirror.setPoint(mx,my);
    }
}
function findMirrorPoint(point){
    var ml = buildMenu.currentMirrorLine;
    if(ml === undefined){
        ml = lines.getIf(line=>line.mirrorLine);
    }
    var mirrorPoint;
    if(ml){
        var x = ml.p2.x - ml.p1.x;
        var y = ml.p2.y - ml.p1.y;
        var dir = -Math.atan2(y,x);
        var len = Math.sqrt(x * x + y * y);
        var nx = x / len;
        var ny = y / len;
        var x1 = point.x - ml.p1.x;
        var y1 = point.y - ml.p1.y;
        var side = Math.sign(x * y1 - y * x1);
        if(side !== 0){
            var px = x1 * Math.cos(dir) - y1 * Math.sin(dir);
            var py = -(x1 * Math.sin(dir) + y1 * Math.cos(dir));
            var mx = px * nx - py * ny + ml.p1.x;
            var my = px * ny + py * nx + ml.p1.y;
            mirrorPoint = points.getClosest(mx,my,50 * invScale,p=>{
                var x1 = p.x - ml.p1.x;
                var y1 = p.y - ml.p1.y;
                var pSide = Math.sign(x * y1 - y * x1);
                return pSide !== side && pSide !== 0;
            });
            if(mirrorPoint && (mirrorPoint.id === ml.p1.id || mirrorPoint.id === ml.p2.id )){
                mirrorPoint = undefined;
            }
        }
    }
    return mirrorPoint;
}
const imagePosTypes = {
    center : 0,
    start : 1,
    end : 2,
    stretch : 3,
}
var imageItem = Object.assign({},util,{
    line : null,
    point : null,
    image : null,
    zIndex : 0,
    scale : 1,
    posType : imagePosTypes.center,
    draw(){
        var cx,cy;
        var i = this;
        var img = images.items[i.image]; // get by name
        if(img.complete){
            ctx.save();
            if(!running){
                ctx.globalAlpha = 0.4;
            }
            if(i.line){
                var l = i.line
                var nx = (l.p2.x - l.p1.x);
                var ny = (l.p2.y - l.p1.y);
                var len = Math.sqrt(nx * nx + ny * ny);
                nx /= len;
                ny /= len;
                nx *= i.scale;
                ny *= i.scale;
                if(i.posType === imagePosTypes.center){
                    cx = (l.p1.x + l.p2.x) / 2;
                    cy = (l.p1.y + l.p2.y) / 2;
                    ctx.transform(nx,ny,-ny,nx,cx,cy);
                    ctx.drawImage(img,-img.width / 2,-img.height / 2);
                }else if(i.posType === imagePosTypes.start){
                    ctx.transform(nx,ny,-ny,nx,l.p1.x,l.p1.y);
                    ctx.drawImage(img,0,-img.height / 2);
                }else if(i.posType === imagePosTypes.end){
                    ctx.transform(nx,ny,-ny,nx,l.p2.x,l.p2.y);
                    ctx.drawImage(img,-img.width,-img.height / 2);
                }else if(i.posType === imagePosTypes.stretch){
                    len *= 1/i.scale;
                    len /= img.width;
                    ctx.transform(nx*len,ny*len,-ny,nx,l.p1.x,l.p1.y);
                    ctx.drawImage(img,0,-img.height / 2);
                }
            }else{
                var p = i.point;
                var nx = Math.cos(p.angle)*i.scale;
                var ny = Math.sin(p.angle)*i.scale;
                ctx.transform(nx,ny,-ny,nx,p.x,p.y);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
            }
            ctx.restore();
        }
    },
})
var imageList = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({}, { image : null, zIndex : 0 , posType : 0, scale : 1}));
        }
        return this.defaultItem;
    },
    create(img,line = null,point = null,zIndex = 0){
        return Object.assign({}, imageItem, {image : img,line,point,zIndex});
    },
    sort(){
        this.items.sort((a,b)=>a.zIndex - b.zIndex);
    }
},lists("images"));
var customWave = {
    points : [],
    ready : false,
    reset(){
        this.ready = false;
        this.points.length = 0;
    },
    addPoint(x,y){
        this.points.push({x,y})
        this.ready = false;
    },
    activate(){
        this.points.sort((a,b) =>{ return a.x - b.x });
        var start = this.points[0].x;
        var miny = this.points[0].y;
        var maxy = this.points[0].y;
        var end = this.points[this.points.length -1].x;
        this.points.forEach(p=>{
            p.x = (p.x - start) / (end-start);
            miny = Math.min(p.y,miny);
            maxy = Math.max(p.y,maxy);
        })
        this.points.forEach(p=>{
            p.y = ((p.y - miny) / (maxy-miny)) * 2 - 1 ;
        })
        this.ready = true;
    },
    getAt(t){
        var y;
        if(this.ready === false && this.points.length > 1){
            this.activate();
        }
        t = Math.abs(t%1);
        var p1 = this.points[0];
        for(var i = 1; i < this.points.length; i++){
            var p2 = this.points[i];
            if(p2.x >= t){
                var x = (t-p1.x) / (p2.x - p1.x)
                y = (p2.y - p1.y) * x + p1.y;
                return y;
            }
            p1 = p2;
        }
    }
}
const stickHelper = {
    list : {
        items : [],
        map : new Map,
        clear(){
            stickHelper.list.items.length = 0;
        },
        each(callback){
            var l = stickHelper.list.items;
            for(var i = 0; i  < l.length; i++){
                if(callback(l[i],i)=== true){
                    break;
                }
            }
        }
    },
    mapPointsLines(pointFilter,lineFilter){
        var map = stickHelper.list.map;
        map.clear();
        points.eachItem(p=>{
            if(!pointFilter || pointFilter(p) === true){
                var pLines = [];
                map.set(p,pLines);
                lines.eachItem(l=>{
                    if(!lineFilter || lineFilter(l) === true){
                        if(l.p1.id === p.id || l.p2.id === p.id){
                            pLines.push(l);
                        }
                    }
                });
            }
        });
        return map;
    },
    linesOfPoints(pointFilter,lineFilter){
        var lineList = stickHelper.list.items;
        lineList.length = 0;
        points.eachItem(p=>{
            if(!pointFilter || pointFilter(p) === true){
                lines.eachItem(l=>{
                    if(!lineFilter || lineFilter(l) === true){
                        if(l.p1.id === p.id || l.p2.id === p.id){
                            var add = true;
                            for(var i = 0; i < lineList.length; i++){
                                if(lineList[i].id === l.id){
                                    add = false;
                                    break;
                                }
                            }
                            if(add){
                                lineList.push(l);
                            }
                        }
                    }
                });
            }
        });
        return lineList;
    },
    pointLines(pFilt, lFilt){
        var lp = stickHelper.list.items;
        lp.length = 0;
        points.eachItem(p=>{
            if(!pFilt || pFilt(p) === true){
                var pl = [p];
                lines.eachItem(l=>{
                    if(!lFilt || lFilt(l) === true){
                        if(l.p1.id === p.id || l.p2.id === p.id){
                            pl.push(l);
                        }
                    }
                });
                lp.push(pl);
            }
        })
        return stickHelper.list;
    },
}
var undos = [];
var needsUndo = false;
var undoPos = 0;
var undoActionCount = 0;
var lastSavedUndo = -1;
const actionsPerUndo = 1;
var linesShadow = [];
var pointsShadow = [];
var pointsBase = [];
function findSafeId(){
    var id = 0;
    function getId(item){
        if(item.id > id){
            id = item.id + 1;
        }
    }
    outlines.eachItem(getId);
    points.eachItem(getId);
    lines.eachItem(getId);
    imageList.eachItem(getId);
    groundLines.eachItem(getId);
    surfaceLines.eachItem(getId);
    return id;
}
function shadowPoints(arr){
    points.eachItem(p=>{
        if(p.valueFrom){
            p._valueFrom = p.valueFrom;
            p.valueFrom = p.valueFrom.id;
        }
        if(p.posPoints !== null){
            p._posPoints = p.posPoints;
            p.posPoints = p.posPoints.map(pp => pp.id);
        }
    })
    arr = points.shadow(arr);
    points.eachItem(p=>{
        if(p._valueFrom){
            p.valueFrom = p._valueFrom;
            p._valueFrom = undefined;
        }
        if(p.posPoints !== null){
            p.posPoints = p._posPoints;
            p._posPoints = undefined;
        }
    })
    return arr;
}
function shadowStructure(linesShadow){ // creats a simple copy of the structure
    lines.repair();
    lines.eachItem(line=>{
        line.pp1 = line.p1;
        line.pp2 = line.p2;
        line.p1 = line.p1.id;
        line.p2 = line.p2.id;
        if(line.fixedPoints){
            line.fixedPoints1 = [...line.fixedPoints];
            line.fixedPoints1.forEach((p,i)=>line.fixedPoints[i] = p.id);
        }
        if(line.lengthFrom){
            line._lengthFrom = line.lengthFrom;
            line.lengthFrom = line.lengthFrom.id;
        }
    });
    linesShadow = lines.shadow(linesShadow);
    lines.eachItem(line=>{
        line.p1 = line.pp1;
        line.p2 = line.pp2;
        line.pp1 = undefined;
        line.pp2 = undefined;
        if(line.fixedPoints){
            line.fixedPoints1.forEach((p,i)=>line.fixedPoints[i] = p);
            line.fixedPoints1 = undefined;
        }
        if(line._lengthFrom){
            line.lengthFrom = line._lengthFrom;
            line._lengthFrom = undefined;
        }
    });
    return linesShadow;
}
function structureFromShadow(pointsShadow,linesShadow){
    lines.empty();
    points.empty();
    pointsShadow.forEach(point=>{
        var p = points.add(points.create(point.x,point.y)).fromShadow(restoreDefaults(point,points.getDefaultItem()));
    });
    linesShadow.forEach(line=>{
        // note fromShadow is a ListItem property and is not avalible until item added to a list
        var op1,op2; // original points to get the Id from so that images can be attached to new line and points
        var lid;
        var l = lines.add(lines.create(null,null)).fromShadow(restoreDefaults(line,lines.getDefaultItem()));
        var img = imageList.getById(line.id);
        if(img !== undefined){
            img.id = l.id;
            img.line = l;
        }
        var p1 = l.p1;
        var p2 = l.p2;
        l.p1 = points.getById(l.p1);
        l.p2 = points.getById(l.p2);
        var img = imageList.getById(l.p1.id);
        if(img !== undefined){
            img.point = l.p1;
        }
        var img = imageList.getById(l.p2.id);
        if(img !== undefined){
            img.point = l.p2;
        }
        if(Array.isArray(l.fixedPoints)){
            var fixedPoints = [...l.fixedPoints];
            l.fixedPoints.length = 0;
            fixedPoints.forEach((p,i)=>{
                pp = points.getById(p);
                if(pp !== undefined){
                    l.attachPoint(pp);
                    var img = imageList.getById(p);
                    if(img !== undefined){
                        img.point = l.fixedPoints[i];
                    }
                }else{
                    log("Could not find point with ID" + p);
                    textMessage("ID error!!!!!");
                }
            })
        }
        return;
    })
    lines.eachItem(line=>{
        if(line.lengthFrom !== null){
            line.lengthFrom = lines.getById(line.lengthFrom);
        }
    })
    points.eachItem(point=>{
        if(point.valueFrom !== null){
            point.valueFrom = lines.getById(point.valueFrom);
            if(point.valueFrom === undefined){
                log("Point valueFrom Could not find line with correct id.");
            }
        }
        if(point.posPoints !== null){
            for(var i = 0; i < point.posPoints.length; i ++){
                point.posPoints[i] = points.getById(point.posPoints[i]);
            }
        }
    })
    outlines.eachItem(o => {
        for (const path of o.points) {
            for(var i = 0; i < path.length; i ++){
                path[i] = points.getById(path[i].id);
            }
        }
    })
    outlines.sort();
    surfaceLines.eachItem(p=>{
        p.point = points.getById(p.point.id);
    })
    surfaceLines.sort();
    surfaceLines.fix();
}
function imageListFromShadow(shadow){
    imageList.empty();
    shadow.forEach(img=>{
        imageList.add(imageList.create(null)).fromShadow(restoreDefaults(img,imageList.getDefaultItem()));
    });
}
var box = Object.assign({},util,{
    top : 0,
    left : 0,
    right : 0,
    bottom : 4,
    name : "Box",
    draw () {
        ctx.strokeRect(this.left, this.top, this.right - this.left, this.bottom - this.top);
    },
});
var boxes = Object.assign({},{
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({}, box));
        }
        return this.defaultItem;
    },
    create (left, top, right, bottom) {
        return Object.assign({}, box, {
            left, top, right, bottom,
        });
    },
}, lists("boxess"));
function breakLine(line){
    if(line.startLength > line.p2.radius + line.p1.radius + 1){
        var cx,cy,cx1,cy1;
        if(line.lengthFrom !== null){
            line.lengthFrom = null;
            line.fromType = fromTypes.length;
        }
        line.type = 0;
        var breakPoint = ((Math.random()+Math.random()+Math.random()+Math.random())/4) * 0.8 +0.1;
        var compressed = 1 - Math.abs(Math.random()+Math.random()-1) * 0.1;
        var x = line.p2.x - line.p1.x;
        var y = line.p2.y - line.p1.y;
        var len = Math.sqrt(x * x + y * y);
        cx = line.p1.x + x * breakPoint;
        cy = line.p1.y + y * breakPoint;
        if(breakPoint < 0.45){
            cx = line.p1.x + x * breakPoint;
            cy = line.p1.y + y * breakPoint;
            cx1 = line.p1.x + x * (1-breakPoint);
            cy1 = line.p1.y + y * (1-breakPoint);
        }else{
            cx1 = cx;
            cy1 = cy;
        }
        var ox = ((line.p2.x - line.p2.ox) + (line.p1.x - line.p1.ox)) /2;
        var oy = ((line.p2.y - line.p2.oy) + (line.p1.y - line.p1.oy)) /2;
        var p1 = points.add(points.create(cx, cy));
        var p2 = points.add(points.create(cx1, cy1));
        p1.visible = false;
        p2.visible = false;
        p1.viewable = false;
        p2.viewable = false;
        line.visible = true;
        var l2 = lines.add(lines.create(line.p2, p2))
        line.p2 = p1;
        if(breakPoint < 0.4){
            l2.startLength = l2.length = len * compressed * breakPoint- p2.radius;
        }else{
            l2.startLength = l2.length = len * compressed * (1-breakPoint)- p2.radius;
        }
        if(mainMenu.noShrapnel){
            line.tension = 0;
            l2.tension = line.tension;
        }else{
            line.tension /= 2;
            l2.tension = line.tension;
        }
        line.startLength = line.length = len * compressed * breakPoint- p2.radius;
        l2.color = line.color;
        l2.lineWidth = line.lineWidth;
        p1.x -= (x / len) * p1.radius;
        p1.y -= (y / len) * p1.radius;
        p2.x += (x / len) * p2.radius;
        p2.y += (y / len) * p2.radius;
        p1.radius = 1  + Math.random();
        p2.radius = 1+ Math.random();
        p1.ox -= ox;
        p1.oy -= oy;
        p2.ox -= ox;
        p2.oy -= oy;
        if(breakPoint < 0.4 && ! mainMenu.noShrapnel){
            var p1 = points.add(points.create(cx, cy));
            var p2 = points.add(points.create(cx1, cy1));
            p1.visible = false;
            p2.visible = false;
            p1.viewable = false;
            p2.viewable = false;
            p1.radius = 1;
            p2.radius = 1;
            var l2 = lines.add(lines.create(p1, p2))
            l2.startLength = l2.length *= 0.9;
            l2.color = line.color;
            l2.lineWidth = line.lineWidth;
            l2.viewable = false;
            var dr  = Math.sign(Math.random() - 0.5);
            p1.ox -= ox * dr;
            p1.oy -= oy * dr;
            //dr  = Math.sign(Math.random() - 0.5);
            p2.ox += ox * dr;
            p2.oy += oy * dr;
        }
    }
}
function bendLine(line){
    if(line.length > line.p2.radius + line.p1.radius){
        if(line.lengthFrom !== null){
            line.lengthFrom = null;
            line.fromType = fromTypes.length;
        }
        line.type = 0;
        var bendPoint = ((Math.random()+Math.random()+Math.random()+Math.random())/4) * 0.8 +0.1;
        var compressed = 1;// - Math.abs(Math.random()+Math.random()-1) * 0.3;
        var x = (line.p2.x - line.p1.x);
        var y = (line.p2.y - line.p1.y);
        var len = Math.sqrt(x * x + y * y);
        var cx = line.p1.x + x * bendPoint;
        var cy = line.p1.y + y * bendPoint;
        var ox = ((line.p2.x - line.p2.ox) + (line.p1.x - line.p1.ox)) *0.5;
        var oy = ((line.p2.y - line.p2.oy) + (line.p1.y - line.p1.oy)) *0.5;
        var p1 = points.add(points.create(cx,cy));
        p1.visible = false;
        p1.viewable = false;
        var l2 = lines.add(lines.create(line.p2,p1))
        line.p2 = p1;
        l2.length = len * compressed * (1-bendPoint);
        line.length = len * compressed * bendPoint;
        l2.color = line.color;
        l2.lineWidth = line.lineWidth;
        line.visible = true;
        l2.visible = true;
        if(mainMenu.noShrapnel){
            line.tension = 0;
            l2.tension = line.tension;
        }else{
            line.tension /= 2;
            l2.tension = line.tension;
        }
        p1.ox -= ox;
        p1.oy -= oy;
        p1.radius = 1 + Math.random();
    }
}
function createWheels(points,lines){
    points.eachItem(point=>{
        var p2, p2, p3, ang, x, y, p1, i;
        if(point.selected){
            for(i = 0; i < 10; i ++){
                ang = (i / 10) * Math.PI * 2;
                x = point.x + Math.cos(ang) * 20;
                y = point.y + Math.sin(ang) * 20;
                p1 = points.add(points.create(x,y));
                lines.add(lines.create(point,p1));
                if(p2){
                    lines.add(lines.create(p1,p2));
                    if(i === 9){
                        lines.add(lines.create(p3,p1));
                    }
                }else{
                    p3 = p1;
                }
                p2 = p1;
            }
        }
    })
}
function CSS_TO_Cpp_RGBA(obj) {
    if (obj.color) {
        const chns = obj.color.replace("rgba(", "").replace(")","").split(",");
        CSS_TO_Cpp_RGBA.d8[0] = Math.max(0, Math.min(255, Number(chns[0]) | 0));
        CSS_TO_Cpp_RGBA.d8[1] = Math.max(0, Math.min(255, Number(chns[1]) | 0));
        CSS_TO_Cpp_RGBA.d8[2] = Math.max(0, Math.min(255, Number(chns[2]) | 0));
        CSS_TO_Cpp_RGBA.d8[3] = Math.max(0, Math.min(255, (Number(chns[3])* 255) | 0));
        obj.RGBA = CSS_TO_Cpp_RGBA.d32[0]; //(A << 24) | (B << 16) | (G << 8) | R;
    }
    return obj;
}
CSS_TO_Cpp_RGBA.d32 = new Uint32Array(1);
CSS_TO_Cpp_RGBA.d8 = new Uint8Array(CSS_TO_Cpp_RGBA.d32.buffer);
var fixCSS_color = false;
function sceneAsJson(){
    points.apply("remember");
    points.setAll("highlight",false);
    points.setAll("selected",false);
    lines.setAll("selected",false);
    lines.setAll("highlight",false);
    groundLines.setAll("highlight",false);
    groundLines.setAll("selected",false);
    imageList.setAll("highlight",false);
    imageList.setAll("selected",false);
    var pointsFix = shadowPoints([]);
    var linesFix = shadowStructure([])
    if (fixCSS_color) {
        pointsFix = pointsFix.map(CSS_TO_Cpp_RGBA);
        linesFix = linesFix.map(CSS_TO_Cpp_RGBA);
    }
    return JSON.stringify({
        stiffness:      mainMenu.stiffness,
        airFriction:    mainMenu.airFriction,
        surfaceFriction:mainMenu.surfaceFriction,
        wheelTraction:  mainMenu.wheelTraction,
        gravity:        mainMenu.gravity,
        showStress :    mainMenu.showStress ,
        breakable :     mainMenu.breakable ,
        snapStrength :  mainMenu.snapStrength ,
        points : pointsFix,
        lines : linesFix,
        ground : groundLines.shadow([]),
        images : imageList.shadow([]),
        outlines: outlines.shadowCustom(),
    },null,"\t");
}
function sceneFromJson(dat){
    mainMenu.stiffness=      dat.stiffness ;
    mainMenu.airFriction=    dat.airFriction  ;
    mainMenu.surfaceFriction=dat.surfaceFriction;
    mainMenu.wheelTraction=  dat.wheelTraction;
    mainMenu.gravity=        dat.gravity   ;
    mainMenu.showStress =    dat.showStress ;
    mainMenu.breakable =     dat.breakable ;
    mainMenu.snapStrength =  dat.snapStrength;
    if(dat.images === undefined){
        imageList.empty();
    }else{
        imageListFromShadow(dat.images);
    }
    structureFromShadow(dat.points,dat.lines);
    
    outlines.empty();
    outlines.fromShadowCustom(dat.outlines);
    outlines.sort();
    
    groundLines.empty();
    dat.ground.forEach(p=>{
        groundLines.add(groundLines.create(0,0))
            .fromShadow(restoreDefaults(p,groundLines.getDefaultItem()));
    });
    groundLines.fix();
    UIMain.update();
}
function updateMenus(){
    buildMenu.ignorUpdates = true;
    buildMenu.from._setDefaultCol();
    buildMenu.fixing._setDefaultCol();
    buildMenu.types._setDefaultCol();
    var firstPointCol = true;
    var pCount = 0;
    var lCount = 0;
    var lLen = 0;
    var lineId = -1;
    var pointId = -1;
    points.eachSelected(point=>{
        pCount += 1;
        pointId = point.id;
        if(point.radius > 10){
            buildMenu.radius = Math.sqrt(point.radius)+ 9;
        }else{
            buildMenu.radius = point.radius;
        }
        buildMenu.drag = point.drag;
        var img = imageList.getById(point.id);
        if(img){
            buildMenu.image = img.image;
            buildMenu.imageZindex = img.zIndex;
            buildMenu.imageScale = img.scale;
        }
        if(point.type === pointTypes.attchedToLine){
            buildMenu.fixing._setCol("attach");
        }else if(point.type === pointTypes.circleMove){
            buildMenu.tension = point.startAngle / Math.PI;
            buildMenu.wheelTurn = point.wheelSpeed;
        }
        if(point.noGround){
            buildMenu.fixing._setCol("noG");
        }
        if(point.fixed){
            buildMenu.fixing._setCol("fix");
        }else{
            buildMenu.fixing._setCol("free");
        }
        if(point.color && firstPointCol){
            firstPointCol = false
            outlineMenu._colorFromCSS(point.color,"fill");
        }
    })
    var firstLineCol = true;
    lines.eachSelected(line=>{
        lCount += 1;
        lineId = line.id;
        if(line.type === lineTypes.dampener){
            buildMenu.dampA = line.dampA;
            buildMenu.phase = line.dampB;
            buildMenu.types._setCol("damp");
        }else if(line.type === lineTypes.thruster){
            buildMenu.dampA = line.thrust / 4;
            buildMenu.types._setCol("thrust");
        }else if(line.type === lineTypes.wave){
            buildMenu.dampA = line.waveFrequency;
            buildMenu.phase = line.wavePhase;
            buildMenu.drag = line.waveAmplitudeFraction;
            buildMenu.wheelTurn = line.waveMultiply;
            buildMenu.types._setCol("wave");
        }else{
            buildMenu.types._setCol("norm");
        }
        if(line.noBreak){
            buildMenu.fixing._setCol("noB");
        }
        if(line.lengthFrom){
            if(line.fromType === fromTypes.length){
                buildMenu.from._setCol("len");
            }else if(line.fromType === fromTypes.angle){
                buildMenu.from._setCol("ang");
            }else if(line.fromType === fromTypes.speed){
                buildMenu.from._setCol("vel");
            }else if(line.fromType === fromTypes.deltaA){
                buildMenu.from._setCol("rot");
			}else if(line.fromType === fromTypes.st){
                buildMenu.from._setCol("st");
			}else if(line.fromType === fromTypes.si){
                buildMenu.from._setCol("si");
            }else if(line.fromType === fromTypes.as){
                buildMenu.from._setCol("as");
            }
        }
        if(line.color && firstLineCol){
            firstLineCol = false;
            outlineMenu._colorFromCSS(line.color,"line");
        }
        if(line.lineWidth){
            outlineMenu.lineWidth = line.lineWidth;
        }
        buildMenu.lineLength = line.length;
        lLen += line.length;
        buildMenu.tension = line.tension;
        var img = imageList.getById(line.id);
        if(img){
            buildMenu.image = img.image;
            buildMenu.imageZindex = img.zIndex;
            buildMenu.imageScale = img.scale;
        }
    })
    outlines.eachSelected(outline=>{
        outlineMenu.lineR = outline.lineRGBA[0];
        outlineMenu.lineG = outline.lineRGBA[1];
        outlineMenu.lineB = outline.lineRGBA[2];
        outlineMenu.lineA = outline.lineRGBA[3];
        outlineMenu.fillR = outline.fillRGBA[0];
        outlineMenu.fillG = outline.fillRGBA[1];
        outlineMenu.fillB = outline.fillRGBA[2];
        outlineMenu.fillA = outline.fillRGBA[3];
        outlineMenu.lineWidth = outline.lineWidth;
        outlineMenu._colorFromCSS(outlineMenu._colorAsCSS("line"),"line");
        outlineMenu._colorFromCSS(outlineMenu._colorAsCSS("fill"),"fill");
        return true;
    })
    UIOutline.update();
    UIBuild.update();
    UIMesh.controls.addGroup.setState({text : "Total len P : "+lLen.toFixed(2) })
    var pInfo = pCount > 1 ? "P : " + pCount + "/" + points.items.length : "P.id : " + pointId;
    var lInfo = lCount > 1 ? "L : "  +lCount + "/" + lines.items.length : "L.id : " + lineId;
    UIMesh.controls.selectorGroup.setState({text : "Sel " + pInfo + lInfo});
    AoidsMenu.onupdateall();
    UIAoids.update();
}
function saveUndo(createData = false){
    if(needsUndo){
        undoActionCount = 0;
        if(createData){
            points.apply("remember");
            pointsShadow = shadowPoints(pointsShadow);
            shadowStructure(linesShadow);
        }
        if(undoPos === 9){
            undos.shift();
        }else{
            undoPos ++;
            undos.length = undoPos;
        }
        undos[undoPos]={
            points : [...pointsShadow],
            lines : [...linesShadow],
            ground : groundLines.shadow([]),
            images : imageList.shadow([]),
        };
        needsUndo = false;
        lastSavedUndo = undoPos;
        UISystem.controls.run.setButtonState("undo",{text : "undo "+undoPos})
        UISystem.controls.run.setButtonState("redo",{text : "redo "+(undos.length-undoPos)-1})
    }
}
var selections = {
    named : {},
    nameCount : 0,
    add(name = "sel_"+(selections.nameCount++)){
        var sel  = {
            points : [],
            lines : [],
        };
        var count = 0;
        points.eachSelected(p=>{
            sel.points.push(p.id);
            count += 1;
        });
        lines.eachSelected(l=>{
            sel.lines.push(l.id);
            count += 1;
        });
        if(count > 0){
            selections.named[name] = sel;
            buildMenu._addNamedSelection(name);
        }else{
            textMessage("Nothing to add.")
        }
    },
    removeIdFromNamedSelection(id){
        Object.keys(selections.named).forEach(key=>{
            var sel = selections.named[key];
            sel.points.cull(pid => pid === id);
            sel.lines.cull(lid => lid === id);
            if(sel.points.length === 0 && sel.lines.length === 0){
                buildMenu._removeNamedSelection(key);
                textMessage("Removed empty named selection '"+key+"'")
            }
        })
    },
    removeAllNamedSelections(){
        Object.keys(selections.named).forEach(key=>{
            buildMenu._removeNamedSelection(key);
            textMessage("Removed key :'"+key+"'");
        });
    },
    selectByName(name, flagBits = 0){
        name = name.toLowerCase();
        if(name === "all"){
            points.setAll("selected",true)
            lines.setAll("selected",true)
            groundLines.setAll("selected",true)
        }else if(name === "none"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            groundLines.setAll("selected",false)
        }else if(name === "lines"){
            points.setAll("selected",false)
            lines.setAll("selected",true)
            groundLines.setAll("selected",false)
        }else if(name === "points"){
            points.setAll("selected",true)
            lines.setAll("selected",false)
            groundLines.setAll("selected",false)
        }else if(name === "lineflags"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            lines.setIf("selected", true, line => (line.flag & flagBits) === flagBits);
        }else if(name === "pointflags"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            points.setIf("selected", true, point => (point.flag & flagBits) === flagBits);
        }else if(name === "wheels"){
            points.setAll("selected",false)
            points.setIf("selected",true,point=>point.radius > forces.MIN_WHEEL_SIZE);
            lines.setAll("selected",false)
            groundLines.setAll("selected",false)
        }else if(name === "dampeners"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            lines.setIf("selected",true,line=>line.type === lineTypes.dampener);
            groundLines.setAll("selected",false)
        }else if(name === "occilators"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            lines.setIf("selected",true,line=>line.type === lineTypes.wave);
            groundLines.setAll("selected",false)
        }else if(name === "thrusters"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            lines.setIf("selected",true,line=>line.type === lineTypes.thruster);
            groundLines.setAll("selected",false)
        }else if(name === "fixed"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            points.setIf("selected",true,point=>point.fixed);
            groundLines.setAll("selected",false)
        }else if(name === "no break"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            lines.setIf("selected",true,lines=>lines.noBreak);
            groundLines.setAll("selected",false)
        }else if(name === "no ground"){
            points.setAll("selected",false)
            lines.setAll("selected",false)
            points.setIf("selected",true,points=>points.noGround);
            groundLines.setAll("selected",false)
        }else if(name === "select invert"){
            points.setAll("highlight",false);
            lines.setAll("highlight",false);
            points.setIf("highlight",true,p=>p.selected);
            lines.setIf("highlight",true,l=>l.selected);
            lines.eachItem(l=>{ l.selected = ! l.highlight });
            points.eachItem(p=>{ p.selected = ! p.highlight });
        }else if(name === "visible"){
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.setIf("selected",true,l=>l.visible===true);
            points.setIf("selected",true,p=>p.visible===true);
        }else if(name === "hidden"){
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.setIf("selected",true,l=>l.visible!==true);
            points.setIf("selected",true,p=>p.visible!==true);
        }else if(name === "deselect points"){
            points.setAll("selected",false);
        }else if(name === "deselect lines"){
            lines.setAll("selected",false);
        }else if(name === "duplicated lines"){
            points.setAll("selected",false);
            lines.setAll("selected",false);
            lines.setIf("selected",true,l1 =>{
                var dup = false;
                lines.eachItem(l2 => {
                    if(l1.id !== l2.id){
                        if((l1.p1.id === l2.p1.id && l1.p2.id === l2.p2.id) ||
                        (l1.p2.id === l2.p1.id && l1.p1.id === l2.p2.id)){
                            dup = true;
                            return true;
                        }
                    }
                })
                return dup;
            })
        }else if(name === "point's lines"){
            lines.setAll("selected",false)
            lines.setIf("selected",true,line=>{
                var isAttached = false;
                points.eachSelected(point=>{
                    if(line.p1.id === point.id || line.p2.id === point.id){
                        isAttached = true;
                        return true;
                    }
                })
                return isAttached;
            });
            groundLines.setAll("selected",false)
        }else if(name === "line's points"){
            points.setAll("selected",false);
            points.setIf("selected",true,point=>{
                var isAttached = false;
                lines.eachSelected(line=>{
                    if(line.p1.id === point.id || line.p2.id === point.id){
                        isAttached = true;
                        return true;
                    }
                })
                return isAttached;
            });
            groundLines.setAll("selected",false)
        }else if(name === "add"){
            selections.add();
        }else{
            if(selections.named[name]){
                var sel = selections.named[name];
                points.setAll("selected",false);
                lines.setAll("selected",false);
                points.setIf("selected",true,point=>sel.points.indexOf(point.id) > -1);
                lines.setIf("selected",true,line=>sel.lines.indexOf(line.id) > -1);
            }
        }
        structDirty = true;
    }
};
function moveStructureTo(x,y){
    points.eachItem(p=>{
        if(!p.screenSpace){
            p.x += x;
            p.y += y;
            p.ox += x;
            p.oy += y;
        }
    });
}
var systemMessageTimeoutHandle;
var systemMessageList = [];
function textMessage(message, time = 3000){
    console.log("Text: " + message);
    systemMessageList.push({message, time});
}
function systemMessage(message, time = 2000){
    console.log("SYS: " + message);
    IOHappening = true;
    IOMessage = message;
    clearTimeout(systemMessageTimeoutHandle);
    systemMessageTimeoutHandle= setTimeout(() => IOHappening = false,time);
}
function messageDisplay(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "16px Arial";
    if(IOHappening){
        ctx.fillText(IOMessage,cw,ch);
    }
    if(systemMessageList.length > 0){
        var len = systemMessageList.length;
        for(var i = 0; i < systemMessageList.length; i++){
            ctx.fillText(systemMessageList[i].message, cw, h - (systemMessageList.length - i) * 18);
            systemMessageList[i].time -= frameTime;
            if(systemMessageList[i].time <= 0){
                systemMessageList.splice(i--,1);
            }
        }
    }
}
var wavePhaseStepIn = 0;
var wavePhaseEase = 0;
var closeSim = false;
var running = true;
var IOHappening = false;
var IOMessage = "";
var stepSim = false;
var stepSimTimerHandle;
var stepSimTime = 1000;
function stepSimTimer(){
    stepSim = true;
    stepSimTime /= 2;
    stepSimTime = stepSimTime < 100 ? 100 : stepSimTime;
    stepSimTimerHandle = setTimeout(stepSimTimer,stepSimTime)
}
var onbeforeclose = function(control){
    if(control.name === "System" && !systemMenu.closeAll){
        systemMenu._exit();
        return false;
    }
    if(systemMenu.closeAll){
        return true;
    }
    return false;
}
var mainMenu = {
    onbeforeclose,
    onafterupdate(){
        if(mainMenu.ignorUpdates){
            mainMenu.ignorUpdates = false;
        }
    },
    dialogState : {
        color : "hsl(160,60%,40%)",
        highlight : "hsl(160,60%,60%)",
        closeIconHelp : "Click to close Sticks the App.",
        showResizeIcon : false,
        commonState : {
            color : "hsl(170,50%,40%)",
            highlight : "hsl(170,50%,60%)",
            mouseDownHighlight : "hsl(170,60%,70%)",
        },
        help: "UI to set global states\n[LEFT] click to open close menu\n[LEFT] drag to move/tear/doc menu",
    },
    name : "Scene settings.",
    onchanged(control){
        forces.AIR_FRICTION = mainMenu.airFriction;
        forces.SURFACE_FRICTION = mainMenu.surfaceFriction;
        forces.GRAVITY = mainMenu.gravity;
        forces.WHEEL_FRICTION = mainMenu.wheelTraction;
    },
    store : {
        loadScene(){
            if(running){
                UISystem.controls.run.click("build");
            }
            IOHappening = true;
            IOMessage = "Open scene.";
            var el = document.createElement("input");
            el.type = "file";
            el.addEventListener("change",function(){
                debugger;
                if(el.files.length > 0){
                    IOMessage = "Loading : " + el.files[0].name;
                    jsonReadWriter.load(downloadPath + el.files[0].name,function(shadowed){
                        debugger;
                        sceneFromJson(shadowed);
                        IOHappening = false;
                    });
                }else{
                    IOHappening = false;
                }
                el = undefined;
            })
            el.dispatchEvent(new MouseEvent( "click"));
        },
        saveScene(){
            fixCSS_color = true;
            downloadText(sceneAsJson(), fileName);
            fixCSS_color = false;
            systemMessage("Saved lines as " + fileName);
        },
        saveStatic(){
            //lines.setAll("selected",false);
            lines.setAll("highlight",false);
            const newLines = [];
            lines.eachItem(l => {
                const lineseg = [];
                if(l.selected && !l.highlight && l.visible){
                    lineseg.push(l.p1.x | 0, l.p1.y | 0, l.p2.x | 0, l.p2.y | 0);
                    l.highlight = true;
                    var id = l.p2.id;
                    var looking = true;
                    while(looking){
                        looking = false;
                        lines.eachItem(l1 => {
                            if(l1.selected && !l1.highlight &&  l.visible){
                                if(l1.p1.id === id){
                                    lineseg.push(l1.p2.x | 0, l1.p2.y | 0);
                                    l1.highlight = true;
                                    id = l1.p2.id;
                                    looking = true;
                                }else if(l1.p2.id === id){
                                    lineseg.push(l1.p1.x | 0, l1.p1.y | 0);
                                    l1.highlight = true;
                                    id = l1.p1.id;
                                    looking = true;
                                }
                                return looking;
                            }
                        });
                    }
                }
                if(lineseg.length > 0){
                    newLines.push(lineseg);
                }
            });
            if(newLines.length > 0){
                downloadText(JSON.stringify(newLines),fileName.split(".")[0] + "_LINE.json");
                systemMessage("Created and saved lines");
            }
            lines.setAll("selected",false);
            lines.setIf("selected",true,l=>l.highlight);
            lines.setAll("highlight",false);
        },
        gSave(){
            var pts = [];
            groundLines.eachItem(p=> {
                if(p.selected){
                    p.x |= 0;
                    p.y |= 0;
                    var pt = (p.x | 0).toString(36) + "," + (p.y | 0).toString(36);
                    if(p.flag !== flagTypes.none) {
                        pt += "," + p.flag;
                    }
                    pts.push(pt);
                }
            });
            var groundLineSave = {
                info : "RetroLander-GroundLines",
                radix : 36,
                points : pts.join("|"),
            };
            downloadText(JSON.stringify(groundLineSave),fileName.split(".")[0] + "_Ground.json");
            systemMessage("Created and saved lines");
        },
        _loadScene: {active: false},
        _saveStatic: {help: "Saves selected lines as a static drawing for lander game", active: false},
        _gSave: {help: "Saves ground lines for Retro lander", active: false},
    },
    stiffness: "##1,1,40,1,Number of iteration for constraints.",
    airFriction: "##0.99,0.7,1,0.001,Amount of resistance to air points have. 1 is no friction.",
    surfaceFriction: "##0.99,0.0,1,0.01,Amount friction a point contact has. 0 is no friction.",
    wheelTraction: "##0.99,0.0,1,0.01,Amount traction for wheels. 0 is no traction.",
    gravity: "##0.9,0.0,4,0.01,Downward force of gravity.",
    noShrapnel : "##false,When on breaking lines will not produce shrapnel.",
    showStress : "##false,When on lines show colour coded stress levels",
    breakable : "##false,When on lines can break via compression and streaching stress",
    _breakable : {
        autoSetup : true,
    },
    snapStrength : "##1,0.005,1,0.005,Stress level at which stick will snap in two.",
}
var buildMenu = {
    onbeforeclose,
    onafterupdate(){
        if(buildMenu.ignorUpdates){
            buildMenu.ignorUpdates = false;
        }
    },
    onchanged(control){
        if(buildMenu.ignorUpdates){
            return;
        }
        if(control.name === "dampA"){
            lines.eachSelected(line=>{
                if(line.type === lineTypes.dampener){
                    line.dampA = buildMenu[control.name];
                    line.dampD = 1-buildMenu[control.name];
                }else if(line.type === lineTypes.thruster){
                    line.thrust = buildMenu[control.name] * 4;
                    line.thrustCurrent = buildMenu[control.name] * 4;
                }else if(line.type === lineTypes.wave){
                    line.waveFrequency = buildMenu[control.name];
                    line.waveFrequencyCurrent = buildMenu[control.name];
                }
            })
        }else if(control.name === "phase"){
            lines.eachSelected(line=>{
                if(line.type === lineTypes.dampener){
                    line.dampB = buildMenu[control.name];
                }else if(line.type === lineTypes.thruster){
                }else if(line.type === lineTypes.wave){
                    line.wavePhase = buildMenu[control.name];
                }
            })
        }else if(control.name === "radius"){
            points.eachSelected(p=>{
                if(buildMenu.radius < 10){
                    p.radius = buildMenu.radius;;
                }else{
                    p.radius = 10+Math.pow(buildMenu.radius-9,2);;
                }
            })
        }else if(control.name === "drag"){
            points.eachSelected(p=>{
                p.drag = buildMenu.drag;
            })
            lines.eachSelected(l=>{
                if(l.type === lineTypes.wave){
                    l.waveAmplitudeFraction = buildMenu.drag;
                }
            });
        }else if(control.name === "wheelTurn"){
            points.eachSelected(p=>{
                if(p.type === pointTypes.circleMove){
                    p.wheelSpeed = buildMenu.wheelTurn;
                }
            })
            lines.eachSelected(l=>{
                if(l.type ===lineTypes.wave){
                    l.waveMultiply = buildMenu.wheelTurn;
                }
            })
        }else if(control.name === "tension"){
            lines.eachSelected(l=>{
                l.tension = buildMenu.tension;
            });
            points.eachSelected(p=>{
                if(p.type === pointTypes.circleMove){
                    p.startAngle = buildMenu.tension * Math.PI;
                }
            });
        }else if(control.name === "selection"){
            if(UIBuild !== undefined){
                var index = UIBuild.controls.namedSel.options.items.indexOf(control.value);
                if(index > -1){
                }else{
                    UIBuild.controls.namedSel.addOption(control.value);
                }
            }
        }else if(control.name === "namedSel"){
            selections.selectByName(control.value);
        }
    },
    dialogState : {
        color : "hsl(200,60%,40%)",
        highlight : "hsl(200,60%,60%)",
        showResizeIcon : false,
        commonState : {
            color : "hsl(210,50%,40%)",
            highlight : "hsl(210,50%,60%)",
            mouseDownHighlight : "hsl(200,80%,80%)",
        },
        help: "UI used to build structures\n[LEFT] click to open close menu\n[LEFT] drag to move/tear/doc menu",
    },
    name : "Build menu",
    capture(){
        points.apply("remember");
        pointsShadow = shadowPoints(pointsShadow);
        shadowStructure(linesShadow);
        lines.apply("init");
    },
    remover : {
        deleteSelected(){
            var deleting = true;
            while(deleting){
                deleting = false;
                points.eachSelected(item=>{
                    deleting = true;
                    lines.selectLinesAttachedToPoint(item);
                    item.makeSafeForDelete();
                    selections.removeIdFromNamedSelection(item.id);
                    points.remove(item.id);
                    return true;
                })
            }
            deleting = true;
            while(deleting){
                deleting = false;
                lines.eachItem(line=>{
                    if(line.selected){
                        deleting = true;
                        line.makeSafeForDelete();
                        selections.removeIdFromNamedSelection(line.id);
                        lines.remove(line.id)
                        return true;
                    }
                })
            }
        },
        _deleteSelected : {
            help : "Delete selected lines and points.",
            key : "delete",
        },
        newStructure(){
            if(!running){
                lines.empty();
                points.empty();
                selections.removeAllNamedSelections();
            }
        },
    },
    namedSel : ["All","Add","Lines","Points","Hidden","Visible","Select invert","Wheels","Dampeners","Occilators","Thrusters","Fixed","No break","No Ground","Point's lines","Line's points","Deselect points","Deselect lines","Duplicated lines"],
    _addNamedSelection(name){
        UIBuild.controls.namedSel.addOption(name);
    },
    _removeNamedSelection(name){
        UIBuild.controls.namedSel.removeOption(name);
    },
    showRadialExtent : "##false,If on then selected lines will show the radial extent from the starting point as a circle.",
    useMirror : "##false,If on then edits will find mirrored point and mirror on the current mirror line.",
    _useMirror : {
        onchanged(control){
            if(buildMenu.useMirror){
                if(buildMenu.currentMirrorLine !== undefined){
                    buildMenu.currentMirrorLine.mirrorLine = false;
                }
                buildMenu.currentMirrorLine = undefined;
                var ml = lines.getIf(line=>line.selected);
                if(ml !== undefined){
                    ml.mirrorLine = true;
                    buildMenu.currentMirrorLine = ml;
                }else{
                    buildMenu.useMirror = false;
                    systemMessage("No line selected");
                    UIBuild.controls.useMirror.update();
                }
            }else{
                if(buildMenu.currentMirrorLine !== undefined){
                    buildMenu.currentMirrorLine.mirrorLine = false;
                    buildMenu.currentMirrorLine = undefined;
                }
            }
        }
    },
    from : {
        len(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
                    line.fromType = fromTypes.length;
                    setCol = true;
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("len");
            }
        },
        _setCol(name){
            if(name === "len"){
                UIBuild.controls.from.setButtonState("len",{background : COLS.fromLength.ui});
            }else if(name === "vel"){
                UIBuild.controls.from.setButtonState("vel",{background : COLS.fromSpeed.ui});
            }else if(name === "ang"){
                UIBuild.controls.from.setButtonState("ang",{background : COLS.fromAngle.ui});
            }else if(name === "rot"){
                UIBuild.controls.from.setButtonState("rot",{background : COLS.fromDAngle.ui});
            }else if(name === "as"){
                UIBuild.controls.from.setButtonState("as",{background : COLS.fromAs.ui});
            } else if(name === "st"){
                UIBuild.controls.from.setButtonState("st",{background : COLS.fromSt.ui});
            } else if(name === "si"){
                UIBuild.controls.from.setButtonState("si",{background : COLS.fromSi.ui});
            }
        },
        _setDefaultCol(){
            UIBuild.controls.from.setButtonState("len",{background : "default"});
            UIBuild.controls.from.setButtonState("vel",{background : "default"});
            UIBuild.controls.from.setButtonState("ang",{background : "default"});
            UIBuild.controls.from.setButtonState("rot",{background : "default"});
            UIBuild.controls.from.setButtonState("as",{background : "default"});
            UIBuild.controls.from.setButtonState("st",{background : "default"});
            UIBuild.controls.from.setButtonState("si",{background : "default"});
        },
        _len : {
            help : "Line length set by the length of attached line",
        },
        ang(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
                    line.fromType = fromTypes.angle;
                    setCol = true;
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("ang");
            }
        },
        _ang : {
            help : "Line length set by the diferance in angle from attached line",
        },
        vel(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
                    line.fromType = fromTypes.speed;
                    setCol = true;
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("vel");
            }
        },
        _vel : {
            help : "Line length set by attached velocity at 90 deg to line",
        },
        rot(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
                    line.fromType = fromTypes.deltaA;
                    setCol = true;
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("rot");
            }
        },
        _rot : {
            help : "Line length set by attached change in rotation",
        },
        as(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
                    if(line.lengthFrom.type === line.type){
                        line.fromType = fromTypes.as;
                        setCol = true;
                    }
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("as");
            }else{
                systemMessage("One or more types not set as line types don't match");
            }
        },
        _as : {
            help : "Sets line to attached line type properties.\nMust be the same line type",
        },
        st(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
					line.fromType = fromTypes.st;
					setCol = true;
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("st");
            }else{
                systemMessage("One or more types not set as line types don't match");
            }
        },
        _st : {
            help : "Length from line stress",
        },
        si(){
            var setCol = false;
            lines.eachSelected(line => {
                if(line.lengthFrom !== null){
					line.fromType = fromTypes.si;
					setCol = true;
                }
            });
            if(setCol){
                buildMenu.from._setDefaultCol();
                buildMenu.from._setCol("si");
            }else{
                systemMessage("One or more types not set as line types don't match");
            }
        },
        _si : {
            help : "Length from line inverse stress",
        },
    },
    lengthFrom (){
        if(! groundMenu.editGround){
            selectingLine = true;
            lines.setAll("highlight",false);
            lines.setIf("highlight",true,line=>line.selected);
            lines.setAll("selected",false);
            points.setAll("highlight",false);
            points.setIf("highlight",true,point=>point.selected);
            points.setAll("selected",false);
        }
    },
    _lengthFrom : {
        help : "Click and then select a line to get info from.\Unfortunate name should be infoFrom.",
        key : "l",
    },
    special:{
        mean (){
            var x,y;
            var ps = [];
            x = 0;
            y = 0;
            points.eachSelected(p=>{
                ps.push(p);
                x += p.x;
                y += p.y;
            })
            var p = points.add(points.create(x / ps.length,y / ps.length));
            p.fixed = true;
            p.posPoints = ps;
        },
        cir (){
            points.eachSelected(p=>{
                p.type = pointTypes.circleMove;
                p.fixed = true;
                p.angle = 0;
                p.oAngle = 0;
                p.startAngle = buildMenu.tension * Math.PI;
                p.wheelSpeed = buildMenu.wheelTurn;
            });
        },
        waveform(){
            customWave.reset();
            points.eachSelected(p=>{
                customWave.addPoint(p.x,p.y);
            });
            if(customWave.points.length > 1){
                customWave.activate();
                textMessage("Custom wave form ready");
            }else{
                textMessage("Need more than one point!!!!");
                customWave.reset();
            }
        },
        _waveform :{help : "Creates a custom wave from from selected points."},
        _cir : {help: "moves in a circle"},
    },
    display : {
        show(){
            lines.setIf("visible",true,l=>l.selected);
            points.setIf("visible",true,p=>p.selected);
            points.setIf("screenSpace",false, p=>p.selected);
            lines.setIf("screenSpace",false, p=>p.selected);
        },
        _show : {key : "s", help : "Flags selected lines and points as visible.\nNote that attached sprites are always visible." },
        hide(){
            lines.setIf("visible",false,line=>line.selected===true);
            points.setIf("visible",false,p=>p.selected===true);
        },
        _hide : {key : "h", help : "Flags selected lines and points as not visible.\nNote that attached sprites are always visible." },
        view(){
            points.setAll("viewable",false);
            points.setIf("viewable",true, p=>p.selected);
        },
        _view : { key : "v",help : "For extent and mean position view this set which points are used" },
    },
    fixing : {
        free(){
            points.setIf("fixed",false,item=>item.selected===true);
            points.setIf("noGround",false,p=>p.selected);
            lines.setIf("noBreak",false,l=>l.selected);
            points.eachSelected(p=>{
                if(p.type === pointTypes.attachToLine){
                    lines.dettachPoint(p);
                    textMessage("Detached point :" + p.id)
                    log(p)
                    structDirty = true;
                }
            })
            if(dragging){
                if(dragType === 0){
                    dragData.fixed = false;
                }
            }
        },
        _free : { help : "Set selected point as not fixed and aware of the ground." },
        fix(){
            points.setIf("fixed",true,item=>item.selected===true);
            if(dragging){
                if(dragType === 0){
                    dragData.fixed = true;
                }
            }
            if (points.count > 0) { structDirty = true }
        },
        _fix : {key : "f", help : "Set selected points as fixed in place. They will not move in the simulation." },
        attach(){
            var line = null;
            lines.eachSelected(l=>{
                line = l;
                return true;
            });
            points.eachSelected(p=>{
                lines.dettachPoint(p);
                if(line !== null){
                    line.attachPoint(p);
                }
                structDirty = true;
            });
        },
        _attach : { key : "a",help : "Attaches selected points to the first selected line.\nAttached points are structualy inert." },
        noG(){
            points.setIf("noGround",true,p=>p.selected);
            if (points.count > 0) { structDirty = true }
        },
        _noG : { key : "g",help : "Selected points will ignor the ground lines." },
        noB(){
            var someOff = false;
            lines.eachSelected(l => {
                if(!l.noBreak){
                    someOff = true;
                    return true;
                }
            })
            if(someOff){
                lines.setIf("noBreak",true,l=>l.selected);
            }else{
                lines.setIf("noBreak",false,l=>l.selected);
            }
            if (lines.count > 0) { structDirty = true }
        },
        _noB : { key : "b",help : "Selected lines will ignor breaking stresses." },
        _setCol(name){
            if(name === "free"){
                UIBuild.controls.fixing.setButtonState("free",{background : COLS.freePoint.ui});
            }else if(name === "fix"){
                UIBuild.controls.fixing.setButtonState("fix",{background : COLS.fixedPoint.ui});
            }else if(name === "attach"){
                UIBuild.controls.fixing.setButtonState("attach",{background : COLS.attachedPoint.ui});
            }else if(name === "noG"){
                UIBuild.controls.fixing.setButtonState("noG",{background : COLS.noGround.ui});
            }else if(name === "noB"){
                UIBuild.controls.fixing.setButtonState("noB",{background : COLS.noBreak.ui});
            }
        },
        _setDefaultCol(){
            UIBuild.controls.fixing.setButtonState("free",{background : "default"});
            UIBuild.controls.fixing.setButtonState("fix",{background : "default"});
            UIBuild.controls.fixing.setButtonState("attach",{background : "default"});
            UIBuild.controls.fixing.setButtonState("noG",{background : "default"});
            UIBuild.controls.fixing.setButtonState("noB",{background : "default"});
        },
    },
    dampA: "##0.9,0.0,1,0.01,Sets the dampening  or thrust amount or wave frequency.",
    phase: "##0.9,0.0,1,0.01,Sets the dampening or wave phase.",
    //dampB: "##0.9,0.0,1,0.01,Sets the dampening.",
    //dampD: "##0.9,0.0,1,0.01,Sets the travel.",
    types : {
        damp(){
            lines.eachSelected(line=>{
                if(line.p1.type === pointTypes.attchedToLine && line.p2.type === pointTypes.attchedToLine){
                    systemMessage("Damper skipped line with attached ends.")
                }else{
                    if(line.type === lineTypes.wave){
                        line.length = line.waveAmplitude ;
                    }
                    line.type = lineTypes.dampener;
                    line.dampA = this.dampA;
                    line.dampB = this.phase;
                    line.dampD = 1- this.dampA;
                    line.dampC = 0;
                    line.dLen = line.length;
                    line.waveFrequency = 0;
                    line.waveFrequencyCurrent = 0;
                    line.waveAmplitude = 0;
                    line.waveTime = 0;
                    line.thrust = 0;
                    line.thrustCurrent = 0;
                    line.wavePhase = 0;
                    line.waveMultiply = 1;
                    structDirty = true;
                }
            })
        },
        thrust(){
            lines.eachSelected(line=>{
                if(line.p1.type === pointTypes.attchedToLine && line.p2.type === pointTypes.attchedToLine){
                    systemMessage("Thrust skipped line with attached ends.")
                }else{
                    if(line.type === lineTypes.wave){
                        line.length = line.waveAmplitude ;
                    }
                    line.type = lineTypes.thruster;
                    line.thrust = this.dampA * 4;
                    line.thrustCurrent = this.dampA * 4;
                    line.dampA = 0;
                    line.dampB = 0;
                    line.dampC = 0;
                    line.dampD = 0;
                    line.dLen = 0;
                    line.waveFrequency = 0;
                    line.waveFrequencyCurrent = 0;
                    line.waveAmplitude = 0;
                    line.waveTime = 0;
                    line.wavePhase = 0;
                    line.waveMultiply = 1;
                    structDirty = true;
                }
            });
        },
        wave(event){
            if(event && event.which === 3){
                textMessage("Creating oscillator for custom waver form")
            }
            lines.eachSelected(line=>{
                if(line.p1.type === pointTypes.attchedToLine && line.p2.type === pointTypes.attchedToLine){
                    systemMessage("Wave skipped line with attached ends.")
                }else{
                    if(line.type === lineTypes.wave){
                        line.length = line.waveAmplitude ;
                    }
                    line.type = lineTypes.wave;
                    line.waveFrequency = this.dampA;// * this.wheelTurn;
                    line.waveFrequencyCurrent = this.dampA;//  * this.wheelTurn;
                    line.waveAmplitude = line.length;
                    line.waveTime = 0;
                    line.wavePhase = this.phase;
                    line.waveMultiply = this.wheelTurn;
                    if(event && event.which){
                        line.waveCustom = true;
                    }else{
                        if(line.waveCustom){
                            textMessage("Turning off custom wave");
                        }
                        line.waveCustom = false;
                    }
                    line.dampA = 0;
                    line.dampB = 0;
                    line.dampC = 0;
                    line.dampD = 0;
                    line.dLen = 0;
                    line.thrust = 0;
                    line.thrustCurrent = 0;
                    structDirty = true;
                }
            });
        },
        norm(){
            lines.eachSelected(line=>{
                if(line.type === lineTypes.wave){
                    line.length = line.waveAmplitude ;
                }
                line.type = lineTypes.normal;
                line.dampA = 0;
                line.dampB = 0;
                line.dampC = 0;
                line.dampD = 0;
                line.dLen = 0;
                line.thrust = 0;
                line.waveFrequency = 0;
                line.waveFrequencyCurrent = 0;
                line.waveAmplitude = 0;
                line.waveTime = 0;
                line.waveMultiply = 1;
                line.wavePhase = 0;
                line.thrustCurrent = 0;
                structDirty = true;
            })
        },
        _setDefaultCol(){
            UIBuild.controls.types.setButtonState("damp",{iconIndex : 0, iconOver : 1, background : "default"});
            UIBuild.controls.types.setButtonState("thrust",{iconIndex : 0, iconOver : 1,background : "default"});
            UIBuild.controls.types.setButtonState("wave",{iconIndex : 0, iconOver : 1,background : "default"});
            UIBuild.controls.types.setButtonState("norm",{iconIndex : 0, iconOver : 1,background : "default"});
        },
        _setCol(name){
            switch(name){
                case "damp":
                    UIBuild.controls.types.setButtonState("damp",{iconIndex : 2, iconOver : 3, background : COLS.damper.ui});
                    break;
                case "thrust":
                    UIBuild.controls.types.setButtonState("thrust",{iconIndex : 2, iconOver : 3, background : COLS.thruster.ui});
                    break;
                case "wave":
                    UIBuild.controls.types.setButtonState("wave",{iconIndex : 2, iconOver : 3, background : COLS.wave.ui});
                    break;
                case "norm":
                    UIBuild.controls.types.setButtonState("norm",{iconIndex : 2, iconOver : 3, background : COLS.norm.ui});
                    break;
            }
        },
        _damp :   {icon : {name : "meshModWideIcons",index : 80},key : "d",help : "Converts selected lines into dampeners."},
        _thrust : {icon : {name : "meshModWideIcons",index : 84},key : "t",help : "Converts selected lines into a thruster."},
        _wave :   {icon : {name : "meshModWideIcons",index : 88},key : "w",help : "Converts selected lines occilator."},
        _norm :   {icon : {name : "meshModWideIcons",index : 92},key : "n",help : "Converts selected lines into standard (normal) lines."},
    },
    radius : "##3,0,40,1,Change the joint radius",
    drag : "##1,0.0,1,0.01,Set the selected points drag or\nWave line types amplitude fraction.",
    wheelTurn : "##0,-200,200,1,Current selected wheel speed in pixels per frame",
    tension : "##0,-1,1,0.01,Sets the tension on selected lines.",
    pointTypes : {
        drive(){
            points.eachSelected(item=>{
                item.wheelSpeed = buildMenu.wheelTurn;
                //item.wheelTurn = buildMenu.wheelTurn;
            })
        },
        _drive : {help : "A drive wheel set to speed from wheel turn."},
        disp(){
            points.setIf("viewable",false, p=>p.selected);
            points.setIf("screenSpace",true, p=>p.selected);
            lines.setIf("screenSpace",true, p=>p.selected);
        },
        _disp : {
            help : "Locks point and lines to screen space, only when simulation is running.",
        },
        norm(){
            points.eachSelected(item=>{
                item.wheelSpeed = null;
            })
        },
        _norm : {help : "Normal point"},
    },
    store :{
        save(){
            if(localStorage.currentStructure !== undefined){
            }
            points.setAll("highlight",false);
            lines.setAll("highlight",false);
            points.setAll("selected",false);
            lines.setAll("selected",false);
            var pShadow = shadowPoints(pShadow);
            var lShadow;
            lShadow = shadowStructure(lShadow);
            localStorage.currentStructure = JSON.stringify({
                info : "Sticks structure object",
                name: modelName,
                points : pShadow,
                lines : lShadow,
                images : imageList.shadow([]),
            },null,"\t")
            downloadText( localStorage.currentStructure, modelName + ".json");
            saveStructAsBin({
                points : pShadow,
                lines : lShadow,
            }, modelName);
        },
        _save : {help : "Saves (downloads) the current structure as a JSON file.", active: false},
        load(){
            if(running){
                UISystem.controls.run.click("build");
            }
            IOHappening = true;
            IOMessage = "Open FILE.";
            var el = document.createElement("input");
            el.type = "file";
           // var event = new MouseEvent( "click", {view  : window, bubbles: true,cancelable : true} );
            el.addEventListener("change",function(){
                if(el.files.length > 0){
                    IOMessage = "Loading : " + el.files[0].name;
                    jsonReadWriter.load(downloadPath + el.files[0].name, function(shadowed) {
                        imageListFromShadow(shadowed.images);
                        structureFromShadow(shadowed.points,shadowed.lines);
                        modelName = shadowed.name;
                        IOHappening = false;
                    })
                }else{
                    IOHappening = false;
                }
                el = undefined;
            })
            var event = new MouseEvent( "click");//, {view  : window} );
            el.dispatchEvent(event);
        },
        _load : {help : "Loads a JSON file.", active: false },
    },
}
var groundMenu = {
    dialogState : {
        color : "hsl(240,60%,40%)",
        highlight : "hsl(240,60%,60%)",
        commonState : {
            color : "hsl(250,50%,40%)",
            highlight : "hsl(250,50%,60%)",
            mouseDownHighlight : "hsl(250,60%,70%)",
        },
        showResizeIcon : false,
        help: "UI used to add/edit ground lines[LEFT] click to open close menu\n[LEFT] drag to move/tear/doc menu",
    },
    name : "Ground Line",
    onbeforeclose,
    onchanged(control){
        if(control.type === GUI.controlTypes.slider)  {
            if(groundMenu.useGround && !groundMenu.editGround){
                if(typeof groundMenu.create[groundMenu.groundType] === "function"){
                    groundMenu.create[groundMenu.groundType]();
                }
            }
        }
    },
    editGround : "##false,When on edit the ground line",
    useGround : "##false,When on structure interacts with ground line",
    remove : {
        clear(){
            groundLines.empty();
        },
        _clear : { help : "Removes ALL ground points."},
        invert(){
            groundLines.eachItem(p => { p.selected = p.selected ? false : true });
        },
        _invert : {help : "Inverts selection." },
        removeSel(){
            var deleting = true;
            while(deleting){
                deleting = false;
                groundLines.eachItem(item=>{
                    if(item.selected){
                        deleting = true;
                        groundLines.remove(item.id)
                        groundLines.fix();
                        return true;
                    }
                })
            }
        },
        _removeSel : { help : "Removes selected ground points."},
    },
    builds : {
        detail(event){
            var minIndex = -1;
            var maxIndex = -1;
            groundLines.eachSelected((p,i) => {
                if(minIndex === -1) { minIndex = i };
                maxIndex = i;
            });
            if(minIndex === maxIndex) {
                systemMessage("Need more than one point selected");
                return
            }
            if(event.which === 3){
                var x = groundLines.items[minIndex].x;
                var dist = groundLines.items[maxIndex].x - x;
                var step = dist / (maxIndex - minIndex);
                groundLines.eachItem((p,i) => {
                    if(i >= minIndex && i <= maxIndex){
                        p.x = x;
                        x += step;
                    }
                });
            }else{
                var step =1.5;
                var stepInc = 0.01;
                for(var i = 0; i < groundLines.length; i += step){
                    var iia = maxIndex + i | 0;
                    var iib = minIndex - i | 0;
                    if(iia < groundLines.items.length){ groundLines.items[iia].selected = true }
                    if(iib > -1) { groundLines.items[iib].selected = true }
                    if(iia >= groundLines.items.length && iib < 0) { break }
                    step += stepInc
                }
                groundLines.items[0].selected = true;
                groundLines.items[groundLines.items.length - 1].selected = true;
            }
        },
        _detail : {help : "Selects ground points from the current selection out.\nAs selection moves out detail is reduced\nRight click evenly spaces point from first selected to last selected"},
        base(event) {
            if(event.which === 3){
                groundLines.eachSelected(p=> p.flag = flagTypes.none);
                systemMessage("Removed base flag from selected");
            } else if(event.which === 2){
                groundLines.setAll("selected",false);
                groundLines.setIf("selected",true,p=> p.flag === flagTypes.base);
                systemMessage("Selected base flags");
            }else{
                groundLines.eachSelected(p=> p.flag = flagTypes.base);
                systemMessage("Added base flags to ground lines");
            }
        },
        _base : { help : "Left click : Assign base flag on selected.\nMiddle click : Select points with base flag from selected.\nRight click : Remove base flag from selected" },
        round(){
            var inserting = true;
            while(inserting){
                inserting = false;
                groundLines.eachItem((p1,i)=>{
                    if(p1.selected && i > 0 && i < groundLines.items.length){
                        var p0 = groundLines.items[i-1];
                        var p2 = groundLines.items[i+1];
                        var x = (p0.x - p1.x)/2;
                        var y = (p0.y - p1.y)/2;
                        var x1 = (p2.x - p1.x)/2;
                        var y1 = (p2.y - p1.y)/2;
                        p1.selected = false;
                        p1.highlight = true;
                        var p0a = groundLines.create(p1.x + x,p1.y + y);
                        var p2a = groundLines.create(p1.x + x1,p1.y + y1);
                        p0a.highlight = true;
                        p2a.highlight = true;
                        p1.x = (p1.x + (p0a.x + p2a.x)/2)/2;
                        p1.y = (p1.y + (p0a.y + p2a.y)/2)/2;
                        groundLines.insert(p2a,i+1);
                        groundLines.insert(p0a,i);
                        groundLines.fix();
                        inserting = true;
                        return true;
                    }
                },1,false)
            }
            var h;
            groundLines.setIf("selected",true,item =>(h=item.highlight,item.highlight=false,h===true));
        },
        _round : { help : "Rounds the corner at selected ground points."},
        divide(event){
            if(event.which === 2){
                var x = groundLines.items[0].x;
                var dist = groundLines.items[groundLines.items.length-1].x - x;
                var step = dist / groundLines.items.length;
                groundLines.eachItem(p => {
                    p.x = x;
                    x += step;
                });
            }else{
                var inserting = true;
                while(inserting){
                    inserting = false;
                    groundLines.eachPair((p1,p2,i)=>{
                        if(p1.selected && p2.selected){
                            var x = (p1.x + p2.x)/2;
                            var y = (p1.y + p2.y)/2;
                            if(event.which === 3){
                                x += (p2.x - p1.x) * 0.8 * (Math.random() - 0.5);
                                y += Math.hypot(p2.y - p1.y,p2.x - p1.x) * 0.6 * (Math.random() - 0.5);
                            }
                            p1.selected = false;
                            p1.highlight = true;
                            p2.highlight = true;
                            var p3 = groundLines.create(x,y);
                            p3 = groundLines.insert(p3,i+1);
                            p3.highlight = true;
                            groundLines.fix();
                            inserting = true;
                            return true;
                        }
                    },1,false)
                }
                var h;
                groundLines.setIf("selected",true,item =>item.highlight);
                groundLines.setAll("highlight",false);
            }
        },
        _divide : { help : "Splits a ground line in two. The ground lines split are between two consecutive selected points.\nRight click to add noise.\nMiddle click just moves all points to be evenly spaced"},
    },
    slope : "##1,0,10,0.1,Slope or frequency",
    amplitude : "##1,0,10,0.1,Amplitude",
    level : "##0,0,1000,1,The y position",
    create : {
        build(){
            //groundLines.createLine(groundDesignLines);
        },
        flat(){
            groundLines.empty();
            groundMenu.groundType = "flat";
            var n = groundMenu.slope / 10;
            var n1 = groundMenu.amplitude * 5;
            structExtent = points.getExtent(structExtent,null,true);
            var step = sizeOfPlay*2 / 1000;
            var disy = -20 * n1 + structExtent.bottom + groundMenu.level;
            for(var i = -sizeOfPlay; i < sizeOfPlay; i += step){
                var y = disy + (Math.random()+ Math.random()+ Math.random()+ Math.random())*10*n1+n*i;
                groundLines.add(groundLines.create(i ,y));
                if(y > boxes.items[0].bottom || i > boxes.items[0].right ){
                    break;
                }
            }
            groundLines.fix();
            groundMenu.useGround = true;
            UIGround.controls.useGround.update();
        },
        _flat : { help : "Creates a ground line where ground slider is the slope.\nGround1 is the bumpyness."},
        sin(){
            groundLines.empty();
            groundMenu.groundType = "sin";
            var n = groundMenu.slope / 10;
            var n1 = groundMenu.amplitude;
            structExtent = points.getExtent(structExtent,null,true);
            var disy = 120 * 2.5 * n1 + structExtent.bottom + groundMenu.level * groundMenu.level;
            var step = sizeOfPlay*2 / 500;
            for(var i = -sizeOfPlay; i < sizeOfPlay; i += step){
                groundLines.add(groundLines.create(i ,disy +
                    Math.sin((i/(w*50))*Math.PI * 2 *n * 30)*120*n1 +
                    Math.sin((i/(w*50))*Math.PI * 2 *n * 10)*120*n1 +
                    Math.sin((i/(w*50))*Math.PI * 2 *n * 7)*120 *n1+
                    Math.sin((i/(w*50))*Math.PI * 2 *n * 3)*120 *n1+
                    Math.sin((i/(w*50))*Math.PI * 2 *n * 2)*120*n1
                ));
                if(groundLines.items[groundLines.items.length-1].y > boxes.items[0].bottom || i > boxes.items[0].right ){
                    break;
                }
            }
            groundLines.fix();
            groundMenu.useGround = true;
            UIGround.controls.useGround.update();
        },
        _sin : { help : "Creates a ground line using a sin wave where ground slider is frequency.\nGround1 is amplitude."},
        line(){
            structExtent = points.getExtent(structExtent,null,true);
            groundMenu.groundType = "line";
             var n = groundMenu.slope / 10;
            groundLines.empty();
            groundLines.add(groundLines.create(-sizeOfPlay,structExtent.bottom + groundMenu.level- n * sizeOfPlay));
            groundLines.add(groundLines.create(sizeOfPlay,structExtent.bottom + groundMenu.level + n * sizeOfPlay));
            groundLines.fix();
            groundMenu.useGround = true;
            UIGround.controls.useGround.update();
        },
        _line : { help : "Creates a single horizontal ground line"},
        struct(){
            surfaceLines.empty();
            groundMenu.groundType = "";
            points.eachSelected(p=>{
                surfaceLines.add(surfaceLines.create(p));
            })
            surfaceLines.sort();
            surfaceLines.fix();
            groundMenu.useGround = true;
            UIGround.controls.useGround.update();
        },
        _struct : { help : "Turns selected lines into ground lines.\nExisting structural ground lines are reset."},
    }
}
var outlineMenu = {
    name : "Dressing",
    dialogState : {
        top : 0,
        left : innerWidth - 210 - 204,
        color : "hsl(280,60%,40%)",
        highlight : "hsl(280,60%,60%)",
        commonState : {
            color : "hsl(290,50%,40%)",
            highlight : "hsl(290,50%,60%)",
            mouseDownHighlight : "hsl(290,60%,70%)",
        },
        showResizeIcon : false,
        help: "UI used to add color and attach sprites\n[LEFT] click to open close menu\n[LEFT] drag to move/tear/doc menu",
    },
    onbeforeclose,
    onchanged(control){
        if(buildMenu.ignorUpdates){
            return;
        }
        if(control.name === "lineWidth"){
            outlines.eachSelected(outline=>{
                outline.lineWidth = outlineMenu.lineWidth;
            });
            if(outlines.count === 0){
                lines.setIf("lineWidth",outlineMenu.lineWidth,l=>l.selected);
            }
        }else if(control.name.indexOf("line") > -1){
            var col = outlineMenu._colorAsCSS("line");
            outlines.eachSelected(outline=>{
                outline.lineRGBA[0] = outlineMenu.lineR;
                outline.lineRGBA[1] = outlineMenu.lineG;
                outline.lineRGBA[2] = outlineMenu.lineB;
                outline.lineRGBA[3] = outlineMenu.lineA;
            });
            outlines.apply("update");
            if(outlines.count === 0){
                lines.setIf("color",col,l=>l.selected);
            }
            control.dialog.controls.lineColor.setState({text : col,background : col});
        }
        if(control.name.indexOf("fill") > -1){
            var col = outlineMenu._colorAsCSS("fill");
            outlines.eachSelected(outline=>{
                outline.fillRGBA[0] = outlineMenu.fillR;
                outline.fillRGBA[1] = outlineMenu.fillG;
                outline.fillRGBA[2] = outlineMenu.fillB;
                outline.fillRGBA[3] = outlineMenu.fillA;
            });
            outlines.apply("update");
            if(outlines.count === 0){
                points.setIf("color",col,p=>p.selected);
            }
            control.dialog.controls.fillColor.setState({text : col, background : col});
        }
    },
    edit : {
        create(){
            const outL = outlines.create(outlineMenu.imageZindex);
            if (outL) {
                outlines.add(outL);
                outlines.sort();
            } else {
                textMessage("Could not create outline!");
            }
        },
        _create : {
            help : "Creates a outline shape from selected lines",
        },
        remove(){
            var deleting = true;
            while(deleting){
                deleting = false;
                outlines.eachSelected(outline=>{
                    deleting = true;
                    outlines.remove(outline.id);
                    return true;
                })
            }
            lines.eachSelected(line=>{
                line.color = null;
                line.lineWidth = null;
            })
            points.eachSelected(point=>{
                point.color = null;
            })
        },
        _remove : {
            help : "Removes selected shape.",
        },
    },
    lineColor : "==Line style,default,Controls to set line colour and width.",
    //lineColor(){},
    _colorAsCSS(name = "line"){
        var col = "rgba(" + outlineMenu[name + "R"]
        col += "," + outlineMenu[name + "G"]
        col += "," + outlineMenu[name + "B"]
        col += "," + (outlineMenu[name + "A"]/255).toFixed(2)+")";
        return col
    },
    _colorFromCSS(rgba, name = "line"){
        var col = rgba.split("rgba(")[1].split(",");
        outlineMenu[name + "R"] = Number(col[0]);
        outlineMenu[name + "G"] = Number(col[1]);
        outlineMenu[name + "B"] = Number(col[2]);
        outlineMenu[name + "A"] = Math.max(0,Math.min(255,Math.floor(Number(col[3].split(")")[0]) * 255)));
        UIOutline.controls[name + "Color"].setState({text : rgba,background : col})
    },
    lineR : "##255,0,255,1,Red channel line colour.",
    _lineR : {color : "#F55",highlight : "#F99"},
    lineG : "##255,0,255,1,Green channel line colour.",
    _lineG : {color : "#5F5",highlight : "#9F9"},
    lineB : "##255,0,255,1,Blue channel line colour.",
    _lineB : {color : "#55F",highlight : "#99F"},
    lineA : "##255,0,255,1,Alpha channel line colour.",
    _lineA : {color : "#555",highlight : "#999"},
    lineWidth : "##1,0.1,32,0.1,Line width.",
    fillColor : "==Fill style,big,Controls to set fill colour.",
    fillR : "##255,0,255,1,Red channel fill colour.",
    _fillR : {color : "#F55",highlight : "#F99"},
    fillG : "##255,0,255,1,Green channel fill colour.",
    _fillG : {color : "#5F5",highlight : "#9F9"},
    fillB : "##255,0,255,1,Blue channel fill colour.",
    _fillB : {color : "#55F",highlight : "#99F"},
    fillA : "##255,0,255,1,Alpha channel fill colour.",
    _fillA : {color : "#555",highlight : "#999"},
    imageGroup : "==Images,big,For adding and removing images.",
    imageScale : "##1,0.01,10,0.01,Set the image scale.",
    _imageScale_options : {
        onchange(control){
            if(buildMenu.ignorUpdates){return}
            points.eachSelected(p=>{
                var img = imageList.getById(p.id);
                if(img){
                    img.scale = outlineMenu.imageScale;
                }
            })
            lines.eachSelected(l=>{
                var img = imageList.getById(l.id);
                if(img){
                    img.scale = outlineMenu.imageScale;
                }
            })
        }
    },
    imageZindex : "##50,0,100,1,Sets the z order of images.",
    _imageZindex_options : {
        onchange(control){
            if(buildMenu.ignorUpdates){return}
            points.eachSelected(p=>{
                var img = imageList.getById(p.id);
                if(img){
                    img.zIndex = outlineMenu.imageZindex;
                }
            })
            lines.eachSelected(l=>{
                var img = imageList.getById(l.id);
                if(img){
                    img.zIndex = outlineMenu.imageZindex;
                }
            })
            imageList.sort();
        }
    },
    image : ["none",...Object.keys(images.items)],
    attach : {
        mid () {outlineMenu.attach._attach("center") },
        _mid : {help:"Set image to be at line center.\nFor points this is always center"},
        start () { outlineMenu.attach._attach("start") },
        _start : {help:"Set image to be at line start.\nFor points this is always center"},
        end () { outlineMenu.attach._attach("end") },
        _end : {help:"Set image to be at line end.\nFor points this is always center"},
        len () { outlineMenu.attach._attach("stretch") },
        _len : {help:"Set image to strech over the line length.\nFor points this is always center"},
        none () {
            if(buildMenu.ignorUpdates){return}
            lines.eachSelected(line=>{imageList.remove(line.id)})
            points.eachSelected(point=>{imageList.remove(point.id)})
        },
        _none : {help:"Remove images from selected points and lines."},
        _attach(type){
            if(buildMenu.ignorUpdates){return}
            if(outlineMenu.image === "none"){
                lines.eachSelected(line=>{imageList.remove(line.id)})
                points.eachSelected(point=>{imageList.remove(point.id)})
            }else{
                //debugger
                lines.eachSelected(line=>{
                    var img = imageList.getById(line.id);
                    if(img === undefined){
                        img = imageList.add(imageList.create(outlineMenu.image,line,null,outlineMenu.imageZindex));
                        img.id = line.id;
                        img.posType = imagePosTypes[type.toLowerCase()];
                        img.scale = outlineMenu.imageScale;
                    }else{
                        img.image = outlineMenu.image;
                        img.zIndex = outlineMenu.imageZindex;
                        img.posType = imagePosTypes[type.toLowerCase()];
                        img.scale = outlineMenu.imageScale;
                    }
                })
                points.eachSelected(point=>{
                    var img = imageList.getById(point.id);
                    if(img === undefined){
                        img = imageList.add(imageList.create(outlineMenu.image,null,point,outlineMenu.imageZindex));
                        img.id = point.id;
                        img.scale = outlineMenu.imageScale;
                    }else{
                        img.image = outlineMenu.image;
                        img.zIndex = outlineMenu.imageZindex;
                        img.scale = outlineMenu.imageScale;
                    }
                })
                imageList.sort();
            }
        },
    },
}
var meshExtrasMenu = {
    name : "Mesh extras",
    dialogState : {
        top : 0,
        left : innerWidth - 210 - 204 - 204,
        color : "hsl(320,60%,40%)",
        highlight : "hsl(320,60%,60%)",
        commonState : {
            color : "hsl(330,50%,40%)",
            highlight : "hsl(330,50%,60%)",
            mouseDownHighlight : "hsl(330,60%,70%)",
        },
        showResizeIcon : false,
        help: "UI used to perform mesh like operations on selected structures\n[LEFT] click to open close menu\n[LEFT] drag to move/tear/doc menu",
    },
    onbeforeclose,
    onchanged(control){
        if(buildMenu.ignorUpdates){
            return;
        }
        if(control.name === "lineWidth"){
        }
    },
    addGroup : "==Add,default,Functions to add points and lines.",
    add1 : {
        copy(){
            lines.eachItem(l=>{
                if(l.selected){
                    l1 = lines.add(lines.copy(l.p1,l.p2,l));
                    var img = imageList.getById(l.id);
                    if(img){
                        imageList.add(imageList.create(img.image,l1,null,img.zIndex)).id = l1.id;
                    }
                    l1.id1 = l.p1.id;
                    l1.id2 = l.p2.id;
                    l1.copyOf = l.id;
                    l.selected = false;
                    l1.selected = true;
                }
            })
            lines.eachSelected(l=>{
                if(l.lengthFrom){
                    lines.eachSelected(l1=>{
                        if(l1.id !== l.id){
                            if(l1.copyOf === l.lengthFrom.id){
                                l.lengthFrom = l1;
                                return true;
                            }
                        }
                    })
                }
            });
            if(!meshExtrasMenu.keepCopyOfData){
                lines.eachSelected(l=>{
                    l.copyOf = undefined;
                });
            }
            points.eachItem(p=>{
                if(p.selected){
                    p1 = points.add(points.copy(p.x,p.y,p));
                    var img = imageList.getById(p.id);
                    if(img){
                        imageList.add(imageList.create(img.image,null,p1,img.zIndex)).id = p1.id;
                    }
                    lines.eachItem(l=>{
                        if(l.id1 === p.id){
                            l.p1 = p1;
                            l.id1 = undefined;
                        }
                        if(l.id2 === p.id){
                            l.p2 = p1;
                            l.id2 = undefined;
                        }
                    });
                    lines.eachSelected(l=>{
                        if(l.fixedPoints){
                            for(var i = 0; i < l.fixedPoints.length; i++){
                                if(l.fixedPoints[i].id === p.id){
                                    l.fixedPoints[i] = p1;
                                }
                            }
                        }
                    })
                    p.selected = false;
                    p1.selected = true;
                }
            })
            lines.apply("init");
            points.apply("remember");
            selectedExtent = points.getExtent(selectedExtent,p=>p.selected);
            imageList.sort();
        },
        _copy:{key : "c", keyMod : "ctrl",help :"Copies all selected lines and points."},
        copyLF(){
            meshExtrasMenu.keepCopyOfData = true;
            meshExtrasMenu.add1.copy();
            meshExtrasMenu.keepCopyOfData = false;
            lines.eachSelected(l=>{
                var lF = lines.getById(l.copyOf);
                if(lF !== undefined){
                    if(!l.isLineCyclic(lF)){
                        l.lengthFrom = lF;
                    }
                }
                l.copyOf = undefined;
            });
        },
        _copyLF : { help : "Creates a copy and sets the lengthFrom of the new lines to the line it was copied from."},
    },
    modGroup : "==Modify Len : 50.00,default,Functions to modify existing points and lines.",
    _minLen : 50,
    add : {
        brace(){
            var dist,minDistPoint,L1,L2,vv1,pArr,maxAngle, maxPoint, meanDist, distCount;
            L1 = L(V(0,0),V(0,0));
            L2 = L(V(0,0),V(0,0));
            vv1 = V(0,0)
            pArr = [];
            meanDist = 0;
            distCount = 0;
            points.eachSelected((p1,i1)=>{
                points.eachSelected((p2,i2)=>{
                    var x,y,d;
                    if(i2 > i1){
                        x = p1.x - p2.x;
                        y = p1.y - p2.y;
                        meanDist += Math.sqrt(x * x + y * y);
                        distCount += 1;
                    }
                });
            });
            if(distCount > 0){
                meanDist /= distCount;
            }
            points.eachSelected((p1,i1)=>{
                dist = Infinity;
                minDistPoint = null;
                maxPoint = null;
                maxAngle = 0;
                pArr.length = 0;
                points.eachSelected((p2,i2)=>{
                    var x, y, d, isLine, safe;
                    if(i2 !== i1){
                        isLine = false;
                        lines.eachItem(l1=>{
                            if((l1.p1.id === p1.id && l1.p2.id === p2.id) || (l1.p1.id === p2.id && l1.p2.id === p1.id)){
                                isLine = true;
                                return true;
                            }
                        });
                        if(isLine){
                            return false;
                        }
                        x = p1.x - p2.x;
                        y = p1.y - p2.y;
                        d = Math.sqrt(x*x+y*y);
                        if( d < meanDist * 1.5){
                            L1.p1.setAs(p1);
                            L1.p2.setAs(p2);
                            safe = true;
                            lines.eachItem(l1=>{
                                var u;
                                L2.p1.setAs(l1.p1)
                                L2.p2.setAs(l1.p2)
                                if(L1.isLineSegIntercepting(L2)){
                                    u = GG.registers.get("u");;
                                    if(u > 1e-4 && u < 1-1e-4){
                                        safe = false;
                                        return true;
                                    }
                                }
                            });
                            if(safe){
                                points.eachItem(pp => {
                                    if(pp.id !== p1.id && pp.id !== p2.id){
                                        vv1.setAs(pp);
                                        if(L1.distFrom(vv1) < pp.radius){
                                            safe = false;
                                            return true;
                                        }
                                    }
                                })
                                if(safe){
                                    var minAng = Infinity;
                                    lines.eachItem(l1 =>{
                                        if(l1.p1.id === p1.id || l1.p2.id === p1.id  || l1.p1.id === p2.id || l1.p2.id === p2.id ){
                                            L2.p1.setAs(l1.p1);
                                            L2.p2.setAs(l1.p2);
                                            d = Math.abs(L1.angleBetween(L2));
                                            if(d < minAng){
                                                minAng = d;
                                            }
                                        }
                                    })
                                    //pArr.push(p2);
                                    //x = p1.x - p2.x;
                                    //y = p1.y - p2.y;
                                    //d = Math.sqrt(x*x+y*y);
                                    if(minAng > maxAngle){
                                        maxAngle = minAng;
                                        maxPoint = p2;
                                    }
                                }
                            }
                        }
                    }
                });
                if(maxPoint !== null){
                    var l3 = lines.add(lines.create(p1,maxPoint));
                    l3.init();
                }
            });
        },
        cross(){
            var v = V(0,0);
            var intercepting = true;
            var cc = 0;
            while(intercepting && cc < 100){
                cc += 1;
                intercepting = false;
                lines.eachItem((l1,i1)=>{
                    if(l1.selected){
                        var L1 = L(V(l1.p1.x,l1.p1.y),V(l1.p2.x,l1.p2.y));
                        lines.eachItem((l2,i2)=>{
                            if(l2.selected && i2 > i1){
                                var L2 = L(V(l2.p1.x,l2.p1.y),V(l2.p2.x,l2.p2.y));
                                if(L1.isLineSegIntercepting(L2)){
                                    var u = GG.registers.get("u");
                                    if(u > 1e-4 && u < 1-1e-4){
                                        v = L1.interceptSeg(L2,v);
                                        var p1;
                                        points.eachItem(p=>{
                                            var dist = p.distFrom(v.x,v.y);
                                            if(dist < 1){
                                                p1 = p;
                                                return true; // break from iteration
                                            }
                                        })
                                        if(!p1){
                                            p1 = points.add(points.create(v.x,v.y));
                                        }
                                        var l1b = lines.add(lines.create(p1,l1.p2));
                                        var l2b = lines.add(lines.create(p1,l2.p2));
                                        l1b.init();
                                        l2b.init();
                                        l1.p2 = p1;
                                        l2.p2 = p1;
                                        l1b.selected = true;
                                        l2b.selected = true;
                                        intercepting = true;
                                        return true; // break out of eachItem
                                    }
                                }
                            }
                        });
                    }
                    return intercepting; // break out of eachItem if new lines added and start from scratch
                });
            }
        },
        at(){
            var v = V(0,0);
            lines.eachItem((l1,i1)=>{
                if(l1.selected){
                    var L1 = L(V(l1.p1.x,l1.p1.y),V(l1.p2.x,l1.p2.y));
                    lines.eachItem((l2,i2)=>{
                        if(l2.selected && i2 > i1){
                            var L2 = L(V(l2.p1.x,l2.p1.y),V(l2.p2.x,l2.p2.y));
                            if(L1.isLineSegIntercepting(L2)){
                                var u = GG.registers.get("u");
                                if(u > 1e-4 && u < 1-1e-4){
                                    v = L1.interceptSeg(L2,v);
                                    var p1;
                                    points.eachItem(p=>{
                                        var dist = p.distFrom(v.x,v.y);
                                        if(dist < 1){
                                            p1 = p;
                                            return true; // break from iteration
                                        }
                                    })
                                    if(!p1){
                                        p1 = points.add(points.create(v.x,v.y));
                                    }
                                }
                            }
                        }
                    });
                }
            });
        },
        split(){
            if(lines.ifAny(l=>l.selected)){
                lines.setAll("highlight",false);
                lines.setIf("highlight",true,line=>line.selected);
                lines.eachSelected(line=>{
                    var x, y, p, l;
                    x = line.p2.x - line.p1.x;
                    y = line.p2.y - line.p1.y;
                    p = points.add(points.create(line.p1.x + x / 2,line.p1.y + y / 2));
                    p.drag = (line.p1.drag + line.p2.drag) / 2;
                    p.radius = (line.p1.radius + line.p2.radius) / 2;
                    l = lines.add(lines.create(p,line.p2));
                    line.p2 = p;
                    l.highlight = true;
                    line.selected = false;
                })
                lines.setIf("selected",true,line=>line.highlight);
            }else{
                points.setAll("highlight",false);
                points.setIf("highlight",true,points=>points.selected);
                points.eachSelected(point=>{
                    var first = true;
                    lines.eachItem(line=>{
                        var np;
                        if(line.p1.id === point.id || line.p2.id === point.id){
                            if(!first){
                                np = points.add(points.copy(point.x,point.y,point));
                                if(line.p1.id === point.id){
                                    line.p1 = np;
                                }else{
                                    line.p2 = np;
                                }
                                np.highlight = true;
                            }else{
                                first = false;
                                point.highlight = true;
                                point.selected = false;
                            }
                        }
                    });
                });
                 points.setIf("selected",true,point=>point.highlight);
            }
        },
        connect(){
            var v1 = V(0,0);
            var v2 = V(0,0);
            var v3 = V(0,0);
            var ll = L(v1,v2);
            var maxLen = meshExtrasMenu._minLen;
            if(event.which === 3){
                maxLen = Infinity;
            }
            lines.setAll("selected",false);
            points.eachSelected((p1,i1)=>{
                points.eachSelected((p2,i2)=>{
                    if(i2 > i1){
                        if(! lines.ifAny(line => (line.p1.id === p1.id && line.p2.id === p2.id) || (line.p2.id === p1.id && line.p1.id === p2.id ))){
                            v1.setAs(p1);
                            v2.setAs(p2);
                            if(ll.leng() <= maxLen){
                                if(!points.ifAny(pp=>{
                                        if(pp.selected && pp.id !== p1.id && pp.id !== p2.id){
                                            v3.setAs(pp);
                                            if(ll.distFrom(v3) <= pp.radius){
                                                return true;
                                            }
                                        }
                                        return false;
                                    })){
                                    lines.add(lines.create(p1,p2)).selected = true;
                                }
                            }
                        }
                    }
                })
            })
        },
        autoMirror() {
            if (!running && buildMenu.useMirror) {
                const newSel = [];
                //points.setAll("highlight", false);
                //points.setIf("highlight", true, p=>p.selected);
                points.eachSelected(point=>{
                    dragMirror = findMirrorPoint(point);
                    if (dragMirror) {
                        setMirrorPoint(point, dragMirror);
                        newSel.push(point, dragMirror);
                    }
                });
                points.setAll("selected", false);
                newSel.forEach(p=>p.selected = true);
            }
        },
        _brace:{key : "a", keyMod : "alt" ,icon : {name : "meshModIcons",index : 80}, help :"Creates new lines between selected points.\nNew lines will not cross each other or existing lines."},
        _cross:{key : "c", keyMod : "alt" ,icon : {name : "meshModIcons",index : 78}, help :"Create new points where lines cross."},
        _at : {key : "t", keyMod : "alt" ,icon : {name : "meshModIcons",index : 76}, help : "Creates a new point at each selected line crossing"},
        _split : {key : "s", keyMod : "alt" ,icon : {name : "meshModIcons",index : 74},  help : "Splits selected lines by adding a point at its center.\nIf no lines are slected then splits appartt selected points." },
        _connect : {key : "n", keyMod : "alt" ,icon : {name : "meshModIcons",index : 82},  help : "Connects all selected points to each other.Right click to limit line length to mod group len"},
        _autoMirror : {icon : {name : "meshModIcons",index : 16},  help : "If Use Mirror is on will recalculate all setected points and assoicated mirror point if possible!"},
    },
    mod3 : {
         dir(){
            lines.eachSelected(line=>{
                var p = line.p1;
                line.p1 = line.p2;
                line.p2 = p;
            })
        },
        unify(){
            lines.setAll("highlight",false);
            lines.setIf("highlight",true,l=>l.selected);
            var nextLine;
            var looking = true;
            while(looking){
                looking = false;
                lines.eachSelected(l=>{
                    nextLine = l;
                    looking = true;
                    while(nextLine){
                        l = nextLine;
                        nextLine = null;
                        lines.eachSelected(l1=>{
                            if(l1.id !== l.id){
                                if(l1.p2.id === l.p2.id){
                                    var p = l1.p2;
                                    l1.p2 = l1.p1;
                                    l1.p1 = p;
                                }
                                if(l.p2.id === l1.p1.id && nextLine === null){
                                    nextLine = l1;
                                }
                            }
                        })
                        l.selected = false;
                    }
                    return true;
                })
            }
            lines.setAll("selected",false);
            lines.setIf("selected",true,l=>l.highlight);
            selectExtent = true;
        },
        flat(){
            var extent = points.getExtent(undefined,p=>p.selected);
            var w = extent.right - extent.left;
            var h = extent.bottom - extent.top;
            if(w > h){
                var y = (extent.bottom + extent.top) / 2;
                points.eachSelected(p=>{
                    p.setPoint(p.x,y);
                })
            }else{
                var x = (extent.left + extent.right) / 2;
                points.eachSelected(p=>{
                    p.setPoint(x,p.y);
                })
            }
        },
        space(){
            points.setIf("selected",true,p=>p.selected);
            var count = points.count-1;
            if(count > 0){
                selectExtent = true;
                var extent = points.getExtent(undefined,p=>p.selected);
                var w = extent.right - extent.left;
                var h = extent.bottom - extent.top;
                var i = 0;
                var pps = [];
                points.eachSelected(p=>{pps.push(p)})
                if(w > h){
                    pps.sort((a,b)=>{ a.x - b.x });
                    pps.forEach(p=>{ p.setPoint(extent.left + (w / count) * i++, p.y ) })
                }else{
                    pps.sort((a,b)=>{ a.x - b.x });
                    pps.forEach(p=>{ p.setPoint(p.x, extent.top + (h / count) * i++) })
                }
            }
        },
        round(){
            stickHelper.pointLines(p=>p.selected,l=>l.selected).each(pl=>{
                if(pl.length === 3){
                    var p = pl[0];
                    var p1,p2,p3;
                    var l1 = pl[1];
                    var l2 = pl[2]
                    p2 = points.add(points.create(
                        (l1.p1.x + l1.p2.x) / 2,
                        (l1.p1.y + l1.p2.y) / 2
                    ));
                    p3 = points.add(points.create(
                        (l2.p1.x + l2.p2.x) / 2,
                        (l2.p1.y + l2.p2.y) / 2
                    ));
                    p.setPoint(
                        (((p2.x + p3.x) / 2) + p.x)/2,
                        (((p2.y + p3.y) / 2) + p.y)/2
                    );
                    if(l1.p1.id === p.id){
                        l1.p1 = p2;
                    }else{
                        l1.p2 = p2;
                    }
                    if(l2.p1.id === p.id){
                        l2.p1 = p3;
                    }else{
                        l2.p2 = p3;
                    }
                    p2.selected = true;
                    p3.selected = true;
                    lines.add(lines.create(p2,p)).selected = true;
                    lines.add(lines.create(p,p3)).selected = true;;
                }
            })
        },
        circle(event){
            lines.setAll("highlight",false);
            lines.setIf("highlight",true,line=>line.selected);
            lines.setAll("selected",false);
            points.setAll("selected",false);
            var outsideOnly = false;
            if(event.which === 3){
                outsideOnly = true;
            }
            lines.eachItem(line=>{
                if(line.highlight){
                    var cx = line.p1.x;
                    var cy = line.p1.y;
                    var x = (line.p2.x - line.p1.x);
                    var y = (line.p2.y - line.p1.y);
                    var rad = Math.sqrt(x * x + y * y);
                    var sAng = Math.atan2(y, x);
                    var ps = [];
                    p1 = line.p2;
                    for(var i = 1/16; i < 1; i += 1/16){
                        var px = Math.cos(i * Math.PI * 2 + sAng) * rad + cx;
                        var py = Math.sin(i * Math.PI * 2 + sAng) * rad + cy;
                        var p2 = points.add(points.create(px, py));
                        lines.add(lines.create(p1,p2)).selected = true;
                        if(!outsideOnly){
                            lines.add(lines.create(line.p1,p2)).selected = true;
                        }
                        p2.selected = true;
                        p1.selected = true;
                        p1 = p2;
                    }
                    lines.add(lines.create(p2,line.p2)).selected = true;
                    selectExtent = true;
                }
            })
        },
        box(){
            lines.setAll("highlight",false);
            lines.setIf("highlight",true,line=>line.selected);
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.eachItem(line=>{
                if(line.highlight){
                    var x = line.p2.x - line.p1.x;
                    var y = line.p2.y - line.p1.y;
                    var p1 = points.add(points.create(line.p1.x - y, line.p1.y + x));
                    var p2 = points.add(points.create(line.p2.x - y, line.p2.y + x));
                    lines.add(lines.create(p2,line.p2))
                    lines.add(lines.create(line.p1,p1))
                    var l = lines.add(lines.create(p1,p2))
                    lines.add(lines.create(line.p1,p2))
                    lines.add(lines.create(line.p2,p1))
                    line.selected = false;
                    p1.selected = true;
                    p2.selected = true;
                    l.selected = true;
                    selectExtent = true;
                }
            })
        },
        box2(){
            lines.setAll("highlight",false);
            lines.setIf("highlight",true,line=>line.selected);
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.eachItem(line=>{
                if(line.highlight){
                    var x = (line.p2.x - line.p1.x) * 2;
                    var y = (line.p2.y - line.p1.y) * 2;
                    var p1 = points.add(points.create(line.p1.x - y, line.p1.y + x));
                    var p2 = points.add(points.create(line.p2.x - y, line.p2.y + x));
                    lines.add(lines.create(p2,line.p2))
                    lines.add(lines.create(line.p1,p1))
                    var l = lines.add(lines.create(p1,p2))
                    lines.add(lines.create(line.p1,p2))
                    lines.add(lines.create(line.p2,p1))
                    line.selected = false;
                    l.selected = true;
                    p1.selected = true;
                    p2.selected = true;
                    selectExtent = true;
                }
            })
        },
        thick(){
            var gL = L(V(0,0),V(0,0))
            var n1 = V(0,0);
            var n2 = V(0,0);
            var n3 = V(0,0);
            var na = V(0,0);
            var nb = V(0,0);
            var lineIds = new Set();
            var edgeIds = new Set();
            lines.setAll("highlight",false);
            points.setAll("highlight",false);
            var minLen = meshExtrasMenu._minLen;
            points.setAll("selected",false);
            lines.eachSelected(l=>{
                //l.selected = false;
                //l.highlight = true;
                var l1,l2
                lines.eachSelected(ll => {
                    if(ll.id !== l.id){
                        if(ll.p1.id === l.p1.id || ll.p2.id === l.p1.id){
                            l1 = ll;
                            return true;
                        }
                    }
                });
                lines.eachSelected(ll => {
                    if(ll.id !== l.id){
                        if(ll.p1.id === l.p2.id || ll.p2.id === l.p2.id){
                            l2 = ll;
                            return true;
                        }
                    }
                });
                gL.setEnds(l.p1,l.p2).norm(n1);
                if(l1){
                    if (l1.p1.id === l.p1.id) { gL.setEnds(l1.p2, l.p1).norm(n2) }
                    else { gL.setEnds(l1.p1, l.p1).norm(n2) }
                } else { n2.setAs(n1) }
                if(l2){
                    if (l2.p1.id === l.p2.id) { gL.setEnds(l.p2, l2.p2).norm(n3) }
                    else { gL.setEnds(l.p2, l2.p1).norm(n3) }
                } else { n3.setAs(n1) }
                gL.setEnds(l.p1,l.p2);
                var c1 = n2.add(n1).norm().cross(n1);
                var c2 = n3.add(n1).norm().cross(n1);
                var a1 = c1 * ( 1 / Math.cos(Math.asin(c1)));
                var a2 = c2 * ( 1 / Math.cos(Math.asin(c2)));
                //a1 = Math.sqrt(1 + a1 * a1);
                //a2 = Math.sqrt(1 + a2 * a2);
                gL.p1.add(n2.mult(Math.sqrt(1 + a1 * a1) * minLen));
                gL.p2.add(n3.mult(Math.sqrt(1 + a2 * a2) * minLen));
                var p1 = points.add(points.create(gL.p1.x,gL.p1.y));
                var p2 = points.add(points.create(gL.p2.x,gL.p2.y));
                p1.highlight = true;
                p2.highlight = true;
                var nl = lines.add(lines.create(p1,p2));
                nl.highlight = true;
                lineIds.add(nl.id);
                nl = lines.add(lines.create(l.p1,p1));
                nl.highlight = l1 === undefined;
                lineIds.add(nl.id);
                nl = lines.add(lines.create(p2,l.p2));
                nl.highlight = l2 === undefined;
                lineIds.add(nl.id);
                nl = lines.add(lines.create(l.p1,p2));
                lineIds.add(nl.id);
                nl = lines.add(lines.create(l.p2,p1));
                lineIds.add(nl.id);
            })
            lines.eachItem(l => {if(l.highlight){ edgeIds.add(l.id) }});
            points.setIf("selected",true,p=>p.highlight);
            meshExtrasMenu.mod3.wClose();
            lines.setIf("selected",true,l=>lineIds.has(l.id));
            meshExtrasMenu.mod.dups();
            buildMenu.remover.deleteSelected();
            lines.setIf("selected",true,l=>edgeIds.has(l.id));
            selectExtent = true;
        },
        rem(){
            lines.setAll("highlight",false);
            points.setAll("highlight",false);
            lines.setAll("selected",false);
            lines.eachItem(l=>{
                if(l.p1.selected){
                    lines.eachItem(l1=>{
                        if(l1.id !== l.id){
                            if(l1.p1.id === l.p1.id){
                                l1.p1 = l.p2;
                            }
                            if(l1.p2.id === l.p1.id){
                                l1.p2 = l.p2;
                            }
                            l.highlight = true;
                        }
                    });
                }
                if(l.p2.selected){
                    lines.eachItem(l1=>{
                        if(l1.id !== l.id){
                            if(l1.p1.id === l.p2.id){
                                l1.p1 = l.p1;
                            }
                            if(l1.p2.id === l.p2.id){
                                l1.p2 = l.p1;
                            }
                            l.highlight = true;
                        }
                    });
                }
            });
            lines.setIf("selected",true,l=>l.highlight);
            buildMenu.remover.deleteSelected();
            selectExtent = true;
        },
        weld(){
            var x,y,count, welding;
            count = 0;
            points.eachItem(point=>{
                if(point.selected){
                    if(x === undefined){
                        x = point.x;
                        y = point.y;
                        count += 1;
                    }else{
                        x += point.x;
                        y += point.y;
                        count += 1;
                    }
                }
            })
            x /= count;
            y /= count;
            if(count > 1){
                var p = points.add(points.create(x,y));
                welding = true;
                while(welding){
                    welding = false;
                    lines.eachItem(line=>{
                        if(line.p1.selected && line.p2.selected){
                            welding = true;
                            lines.remove(line.id);
                            imageList.remove(line.id);
                            return true;
                        }else if(line.p1.selected || line.p2.selected){
                            if(line.p1.selected){
                                line.p1 = p;
                            }else{
                                line.p2 = p;
                            }
                            line.init();
                        }
                    })
                }
                welding = true;
                while(welding){
                    welding = false;
                    points.eachSelected(point=>{
                        welding = true;
                        points.remove(point.id);
                        imageList.remove(point.id);
                        outlines.removePoint(point);
                        return true;
                    });
                }
                points.apply("remember");
                points.setAll("selected",false);
                lines.setAll("selected",false);
                p.selected = true;
            }
        },
        wClose(){
            if(!running){
                var newPoints = [];
                points.setAll("highlight",false);
                points.setIf("highlight",true,p=>p.selected);
                points.setAll("selected",false);
                var welding = true;
                while(welding){
                    welding = false;
                    points.eachItem(p1=>{
                        if(p1.highlight){
                            points.eachItem(p2=>{
                                if(p2.highlight && p2.id !== p1.id){
                                    var dist = p2.distFrom(p1.x,p1.y);
                                    if(dist <= p1.radius + p2.radius){
                                        p1.selected = true;
                                        p2.selected = true;
                                    }
                                }
                            })
                            if(p1.selected){
                                meshExtrasMenu.mod3.weld(true);
                                selectExtent = true;
                                points.eachSelected(p=>{
                                    newPoints.push(p);
                                    p.selected = false;
                                })
                                welding = true;
                                return true;
                            }
                            p1.highlight = false;
                        }
                    })
                }
                newPoints.forEach(p=>p.selected = true);
            }
        },
        _dir:{icon : {name : "meshModIcons",index : 44},help :"Changes the direction of the line."},
        _wClose : {icon : {name : "meshModIcons",index : 40}, help : "Welds selected points that are touching." },
        _weld:{icon : {name : "meshModIcons",index : 42},help :"Welds currently selected points together removing lines as needed."},
        _unify : { icon : {name : "meshModIcons",index : 0},help : "Changes line directions so that all selected lines are in the same direction"}  ,
        _flat : {icon : {name : "meshModIcons",index : 36}, help : "Moves points so that they are aligned to the x or y axis."},
        _space : {icon : {name : "meshModIcons",index : 38}, help : "Spaces point evenly." },
        _round : {icon : {name : "meshModIcons",index : 24}, help :"Rounds a corner. Select the two lines and point at the corner."},
        _rem : {icon : {name : "meshModIcons",index : 26}, help :"Removes points from lines."},
        _circle : {icon : {name : "meshModIcons",index : 28}, help : "Creates a circle from the line.\nLine start point is the center.\nLine end point is the radius." },
        _box : { icon : {name : "meshModIcons",index : 30},help : "Extrudes the selected lines to make a box like structure." },
        _box2 : {icon : {name : "meshModIcons",index : 32}, help : "Extrudes the selected lines 2Times to make a box structure." },
        _thick : {icon : {name : "meshModIcons",index : 34}, help : "Extrudes a set of lines out by length set with size." },
    },
    mod6 : {
        _moveP(mX, mY) {
            points.eachSelected(p=>{
                p.setPoint(p.x + mX, p.y + mY);
                selectExtent = true;
            });
        },
        _scaleP(scaleX,scaleY){
            var extent  = points.getExtent(undefined,p=>p.selected);
            var cx = (extent.left + extent.right)/2;
            var cy = (extent.top + extent.bottom)/2;
            points.eachSelected(p=>{
                p.setPoint(cx + (p.x - cx) * scaleX,cy + (p.y - cy) * scaleY);
                selectExtent = true;
            });
        },
        _moveTo(pos){
            var ids = [];
            lines.eachSelected(l=>{ids.push(l.id)});
            if(pos > 0){ ids.reverse() }
            while(ids.length > 0){ lines.moveTo(ids.pop(),pos) }
            points.eachSelected(p=>{ids.push(p.id)});
            if(pos > 0){ ids.reverse() }
            while(ids.length > 0){ points.moveTo(ids.pop(),pos) }
        },
        size(event){
            var wl = L(V(),V());
            var minLen = Infinity;
            var maxLen = -Infinity;
            var total = 0;
            var count = 0;
            lines.eachSelected(l=>{
                var len = wl.setEnds(l.p1,l.p2).leng();
                minLen = Math.min(minLen,len)
                maxLen = Math.max(maxLen,len)
                total += len;
                count += 1;
            });
            if(count === 0){
                points.eachSelected(p=>{
                    var rad = p.radius;
                    minLen = Math.min(rad,minLen);
                    maxLen = Math.min(rad,maxLen);
                    total += rad;
                    count += 1;
                });
            }
            if(count === 0){
                textMessage("Nothing selected!!!");
            }else{
                var size = minLen;
                var str = "min";
                if(event.which === 2){ size = maxLen; str = "max" }// middle button
                else if(event.which === 3){ size = total / count; str = "mean" }
                size = size < 1 ? (str += " *",1) : size;
                meshExtrasMenu._minLen = size;
                UIMesh.controls.modGroup.setState({text : "Modify Len "+str+": " + size.toFixed(2)});
            }
        },
        bottom(){ meshExtrasMenu.mod6._moveTo(-1000000) },
        down(){ meshExtrasMenu.mod6._moveTo(-1) },
        up(){ meshExtrasMenu.mod6._moveTo(1) },
        top(){ meshExtrasMenu.mod6._moveTo(10000000) },
        scale(event){
            if (event.which === 1) { meshExtrasMenu.mod6._scaleP(0.9,0.9) }
            else { meshExtrasMenu.mod6._scaleP(1/0.9,1/0.9) }
        },
        scaleX(event){
            if (event.ctrlKey) {
                var dist = event.shiftKey ? 10 : 1;
                if (event.which === 1) { meshExtrasMenu.mod6._moveP(-dist,0) }
                else { meshExtrasMenu.mod6._moveP(dist,0) }
            } else {
                if (event.which === 1) { meshExtrasMenu.mod6._scaleP(0.9,1) }
                else { meshExtrasMenu.mod6._scaleP(1/0.9,1) }
            }
        },
        scaleY(event){
            if (event.ctrlKey) {
                var dist = event.shiftKey ? 10 : 1;
                if (event.which === 1) { meshExtrasMenu.mod6._moveP(0,-dist) }
                else { meshExtrasMenu.mod6._moveP(0,dist) }
            } else {
                if (event.which === 1) { meshExtrasMenu.mod6._scaleP(1,0.9) }
                else { meshExtrasMenu.mod6._scaleP(1,1/0.9) }
            }
        },
        mirX(){
            var extent  = points.getExtent(undefined,p=>p.selected);
            points.eachSelected(p=>{
                p.setPoint(extent.right - (p.x - extent.left),p.y);
            })
        },
        mirY(){
            var extent  = points.getExtent(undefined,p=>p.selected);
            points.eachSelected(p=>{
                p.setPoint(p.x,extent.bottom - (p.y - extent.top));
            })
        },
        rot(event,control,angStep = Math.PI / 4){
            if(event && event.which === 3){
                angStep = -angStep;
            }
            var extent  = points.getExtent(undefined,p=>p.selected);
            var cx = (extent.left + extent.right)/2;
            var cy = (extent.top + extent.bottom)/2;
            points.eachSelected(p=>{
                var vx = p.x - cx;
                var vy = p.y - cy;
                var dist =  Math.sqrt(vx * vx + vy * vy);
                var ang = Math.atan2(vy,vx);
                p.setPoint(
                    Math.cos(ang + angStep) * dist + cx,
                    Math.sin(ang + angStep) * dist + cy
                );
            })
            selectExtent = true;
        },
        rot1(event,control){ meshExtrasMenu.mod6.rot(event,control,Math.PI / 90); },
        _size : {icon : {name : "meshModIcons",index : 46}, help : "Get the size setting using the min size of\nselected lines or if no lines use min radius.\n[Left] for min size\n[Center] formax size\n [Right for mean size.\nSize displayed in menu group heading.\n(*) in headin indicates size is clipped."},
        _down : {icon : {name : "meshModIcons",index : 4}, help : "Move selected down one" },
        _up : {icon : {name : "meshModIcons",index : 6}, help : "Move selected up one" },
        _bottom : {icon : {name : "meshModIcons",index : 2}, help : "Move selected to bottom." },
        _top : {icon : {name : "meshModIcons",index : 8}, help : "Move selected to bottom." },
        _scale : {key : "minus",keyRight : "equal", icon : {name : "meshModIcons",index : 10}, help : "Scales selected points\n[Left] scale in\n[Right] scale out"},
        _scaleX : {key : "minus", keyMod : "alt", keyRight : "equal", keyModRight : "alt", icon : {name : "meshModIcons",index : 12}, help : "Scales selected points along X.\n[Left] scale in\n[Right] scale out\n[Ctrl][Left] Move left [Shift]+10px\n[Ctrl][Right] Move right [shift]+10px\n"},
        _scaleY : {key : "minus", keyMod : "ctrl", keyRight : "equal", keyModRight : "ctrl",keyboardPreventDefault : true, icon : {name : "meshModIcons",index : 14}, help : "Scales selected points along Y.\n[Left] scale in\n[Right] scale out\n[Ctrl][Left] Move up [Shift]+10px\n[Ctrl][Right] Move down [Shift]+10px"},
        _mirX : {key : "m", keyMod : "ctrl",icon : {name : "meshModIcons",index : 16}, help : "Mirrors selected along x" },
        _mirY : {key : "m", keyMod : "alt",icon : {name : "meshModIcons",index : 18}, help : "Mirrors selected along y" },
        _rot : {key : "e",keyRight : "r",icon : {name : "meshModIcons",index : 20}, help : "Rotate 45 deg steps\n[Left] rotates clockwise\n[Right] rotates anti clockwise" },
        _rot1 : {key : "e", keyMod : "alt",keyRight : "r", keyModRight : "alt",keyboardPreventDefault : true,icon : {name : "meshModIcons",index : 22}, help : "Rotate in one two degree steps\n[Left] rotates clockwise\n[Right] rotates anti clockwise" },
    },
    _changeData(amount,type,property){
        lines.eachSelected(l=>{
            if(l.type === type){
                if(Array.isArray(property)){
                    l[property[0]] += 1 + amount;
                    l[property[0]] %= 1;
                    property.forEach((p, i) =>{
                        if( i > 0){
                            l[p] = l[property[0]];
                        }
                    });
                }else{
                    l[property] += 1 + amount;
                    l[property] %= 1;
                }
                structDirty = true;
            }
        })
    },
    dataWP : "==Data modify,default,Controls used to change line's and point's data.",
    phase : {
        phase(){ textMessage("Use buttons to add or subtract from wave phase >> 0.1 > 0.01") },
        stepBack10(){ meshExtrasMenu._changeData(-0.1,lineTypes.wave,"wavePhase"); },
        stepBack01(){ meshExtrasMenu._changeData(-0.01,lineTypes.wave,"wavePhase"); },
        setpForward01(){ meshExtrasMenu._changeData(0.01,lineTypes.wave,"wavePhase"); },
        stepForward1(){ meshExtrasMenu._changeData(0.1,lineTypes.wave,"wavePhase"); },
        _stepBack10 : {icon : {name : "meshModIcons",index : 50}, help : "Subtracts 0.1 from the phase of all selected wave (occilators) lines." },
        _stepBack01 : {icon : {name : "meshModIcons",index : 48}, help : "Subtracts 0.01 from the phase of all selected wave (occilators) lines." },
        _setpForward01 : {icon : {name : "meshModIcons",index : 52}, help : "Adds 0.01 from the phase of all selected wave (occilators) lines." },
        _stepForward1 : {icon : {name : "meshModIcons",index : 54}, help : "Adds 0.1 from the phase of all selected wave (occilators) lines." },
    },
    frequency : {
        freq(){ textMessage("Use buttons to add or subtract from wave Frequency") },
        stepBack10(){ meshExtrasMenu._changeData(-0.1,lineTypes.wave,["waveFrequency","waveFrequencyCurrent"]); },
        stepBack01(){ meshExtrasMenu._changeData(-0.01,lineTypes.wave,["waveFrequency","waveFrequencyCurrent"]); },
        setpForward01(){ meshExtrasMenu._changeData(0.01,lineTypes.wave,["waveFrequency","waveFrequencyCurrent"]); },
        stepForward1(){ meshExtrasMenu._changeData(0.1,lineTypes.wave,["waveFrequency","waveFrequencyCurrent"]); },
        _stepBack10 : {icon : {name : "meshModIcons",index : 50}, help : "Subtracts 0.1 from the frequency of all selected wave (occilators) lines." },
        _stepBack01 : {icon : {name : "meshModIcons",index : 48}, help : "Subtracts 0.01 from the frequency of all selected wave (occilators) lines." },
        _setpForward01 : {icon : {name : "meshModIcons",index : 52}, help : "Adds 0.01 from the frequency of all selected wave (occilators) lines." },
        _stepForward1 : {icon : {name : "meshModIcons",index : 54}, help : "Adds 0.1 from the frequency of all selected wave (occilators) lines." },
    },
    gravity : {
        trunc(){
            var count = 0;
            points.eachSelected(p => {count ++; p.setPoint(p.x | 0, p.y | 0); });
            systemMessage(count + " points coords truncated");
        },
        _trunc : { help : "Selected points have the x,y coordinates truncated" },
        toGravity(){
            points.setIf("gravity",true,p=>p.selected);
            gravPoints.empty();
            points.apply("remember");
        },
        removeGravity(){
            points.setIf("gravity",false,p=>p.selected);
            gravPoints.empty();
            points.apply("remember");
        },
    },
    selectorGroup : "==Selectors,default,Functions to select deselect points and lines",
    selector : {
        all(){ selections.selectByName("all"); selectExtent = true },
        invert(){ selections.selectByName("Select invert"); selectExtent = true },
        lines(){ selections.selectByName("Lines"); selectExtent = true },
        points(){ selections.selectByName("Points"); selectExtent = true },
        none(){ selections.selectByName("None");  selectExtent = true },
        _all : {key : "a", keyMod : "ctrl", keyboardPreventDefault : true, help : "Select all." },
        _invert : {key : "i", keyMod : "ctrl", keyboardPreventDefault : true, help : "Invert selections." },
        _lines : {key : "l", keyMod : "ctrl", keyboardPreventDefault : true, help : "Select all lines." },
        _points : {key : "p", keyMod : "ctrl", keyboardPreventDefault : true, help : "Select all points." },
        _none : {key : "Escape", help : "Unselect all points and lines." },
            //namedSel : ["All","Add","Lines","Points","Hidden","Visible","Select invert","Wheels","Dampeners","Occilators","Thrusters","Fixed","No break","No Ground",
      //      "//Point's lines","Line's points","Deselect points","Deselect lines","Duplicated lines"],
    },
    deselector : {
        noLines(){ selections.selectByName("Deselect lines") },
        noPoints(){ selections.selectByName("Deselect points") },
        _noLines : { help : "Deselect all lines." },
        _noPoints : { help : "Deselect all points." },
    },
    selectSize : {
        longer(){
            var min = Infinity;
            lines.eachSelected(line => { min = Math.min(line.length,min) });
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.setIf("selected",true,l=>l.length > min);
            selectExtent = true;
        },
        shorter(){
            var max = 0;
            lines.eachSelected(line => { max = Math.max(line.length,max) });
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.setIf("selected",true,l=>l.length < max);
            selectExtent = true;
        },
        touchP(){
            var v1 = V(0,0);
            var v2 = V(0,0);
            var v3 = V(0,0);
            var ll = L(v1,v2);
            lines.setAll("selected",false);
            lines.eachItem(l=>{
                v1.setAs(l.p1);
                v2.setAs(l.p2);
                points.eachItem(p=>{
                    if(l.p1.id !== p.id && l.p2.id !== p.id){
                        v3.setAs(p);
                        if(ll.distFrom(v3) <= p.radius + Math.max(l.p1.radius,l.p2.radius)){
                            l.selected = true;
                            selectExtent = true;
                            return true;
                        }
                    }
                })
            })
        },
        dups(){
            var removing = true;
            lines.setAll("highlight",false);
            lines.eachSelected((l1,i1)=>{
                lines.eachSelected((l2,i2)=>{
                    if(i2 > i1){
                        if((l1.p1.id === l2.p1.id && l1.p2.id === l2.p2.id) || (l1.p2.id === l2.p1.id && l1.p1.id === l2.p2.id)){
                            l1.highlight = true;
                        }
                    }
                });
            });
            lines.setAll("selected",false);
            points.setAll("selected",false);
            lines.setIf("selected",true,l=>l.highlight);
            selectExtent = true;
            //buildMenu.remover.deleteSelected();
        },
        short(){
            var wla = L(V(),V());
            var wlb = L(V(),V());
            var len;
            points.setAll("selected",false);
            lines.setAll("selected",false);
            lines.eachItem(l=>{
                wla.setEnds(l.p1,l.p2);
                if((len = wla.leng()) < meshExtrasMenu._minLen){
                    if(!l.p1.selected && !l.p2.selected){
                        var isEnd = true;
                        lines.eachItem(l1=>{
                            if(l1.id !== l.id){
                                if(l1.p1.id === l.p1.id || l1.p2.id === l.p1.id){
                                    isEnd = false;
                                    return true;
                                }
                            }
                        });
                        if(!isEnd){
                            l.p1.selected = true;
                        }
                    }
                }
            });
            lines.eachItem(l=>{
                if(l.p1.selected && l.p2.selected){
                    l.p2.selected = false;
                }
            });
            selectExtent = true;
        },
        _short : {help : "Select points that are connected to a short line."},
        _dups : {help : "Selects duplicated lines" },
        _touchP : {help : "Select all lines that are touched by points"},
        _longer : {help : "Select all lines longer than the shortest selected line."},
        _shorter : {help : "Select all lines shorter than the longest selected line."},
    },
    selectorSmart : {
        grow(event){
            var allConnected = event.which != 1;
            
            var tPCount = 0;
            var tLCount = 0;
            lines.setIf("selected", true, l => l.selected);
            points.setIf("selected", true, p => p.selected);
            while ((allConnected && (tPCount != points.count || tLCount != lines.count)) || !allConnected) {
                tPCount = points.count;
                tLCount = lines.count;
                var count = 0;
                if(tPCount + tLCount === 0){
                    return;
                }else if(points.count > 0 && lines.count === 0){
                    selections.selectByName("Point's lines");
                }else if(points.count === 0 && lines.count > 0){
                    selections.selectByName("Line's points");
                }else{
                    points.setIf("selected", true, p => p.selected);
                    count = points.count;
                    selections.selectByName("Line's points");
                    points.setIf("selected", true, p => p.selected);
                    if(count === points.count){
                        selections.selectByName("Point's lines");
                    }
                }
                if (!allConnected) { break; }
            }
            selectExtent = true;
        },
        edge(event){
            var count = 0;
            var lastCount = 0;
            var rev = event.which === 3;
            var gL = L(V(),V());
            var gL1 = L(V(),V());
            lines.eachSelected(l=>{count += 1});
            while (count !== lastCount){
                lines.setAll("highlight",false);
                lines.eachSelected(l=>{
                    if(rev){
                        gL.setEnds(l.p2,l.p1) ;
                    }else{
                        gL.setEnds(l.p1,l.p2) ;
                    }
                    var nextLine;
                    //var nextAng = rev ? Infinity : -Infinity;
                    var nextAng = -Infinity;
                    lines.eachItem(l1 => {
                        if(l1.id !== l.id){
                            var found = false;
                            if(rev){
                                if(l.p1.id === l1.p2.id) {
                                    gL1.setEnds(l1.p2,l1.p1);
                                    found = true;
                                }else if(l.p1.id === l1.p1.id){
                                    gL1.setEnds(l1.p1,l1.p2);
                                    found = true;
                                }
                                if(found){
                                    var ang = gL.angleBetween(gL1);
                                    if(ang > nextAng){
                                        nextLine = l1;
                                        nextAng = ang;
                                    }
                                }
                            } else {
                                if(l.p2.id === l1.p1.id) {
                                    gL1.setEnds(l1.p1,l1.p2);
                                    found = true;
                                }else if(l.p2.id === l1.p2.id){
                                    gL1.setEnds(l1.p2,l1.p1);
                                    found = true;
                                }
                                if(found){
                                    var ang = gL.angleBetween(gL1);
                                    if(ang > nextAng){
                                        nextLine = l1;
                                        nextAng = ang;
                                    }
                                }
                            }
                            //else if(l.p2.id === l1.p2.id) { gL1.setEnds(l1.p2,l1.p1); found = true }
                            if(found){
                                var ang = gL.angleBetween(gL1);
                                if(ang > nextAng){
                                    nextLine = l1;
                                    nextAng = ang;
                                }
                            }
                        }
                    })
                    if(nextLine){
                        nextLine.highlight = true;
                    }
                })
                lastCount = count;
                count = 0;
                lines.eachItem(l=>{
                    if(l.highlight) {
                        l.selected = true;
                        selectExtent = true;
                    }
                    if(l.selected){ count ++ };
                });
            }
        },
        /*connected(){
            var count = 0;
            var lastCount =  0;
            points.setIf("selected",true,p=>p.selected);
            lines.setIf("selected",true,l=>l.selected);
            count = points.count + lines.count;
            while(count !== lastCount){
                if(lines.count === 0){
                    selections.selectByName("Point's lines");
                }
                selections.selectByName("Line's points");
                selections.selectByName("Point's lines");
                lastCount = count;
                points.setIf("selected",true,p=>p.selected);
                lines.setIf("selected",true,l=>l.selected);
                count = points.count + lines.count;
            }
            selectExtent = true;
        },*/
        gizmo (){ selectExtent = true },
        _gizmo : { help : "sets up selection extent bounding box gizmo using current selection."},
        /*_connected : { help : "Select all connected points and lines to the current selection. " },*/
        _grow : { help : "Select points and lines conected to current selected\n[RIGHT] click select all common points and lines" },
    },
    soundTestGroup : "==Sound tester,default,Experimental sounds",
    createBuffer(){
        soundBuf = waveFormCreater.createSoundBuffer(meshExtrasMenu.length,
            (sound)=>{
                meshExtrasMenu.buffer = ((sound.bufPos1 + sound.bufPos2)/(sound.samples*2)) * 100;
                UIMesh.controls.buffer.update();
            },
            (sound)=>{
               // sound.connect();
                meshExtrasMenu.buffer = 100;
                UIMesh.controls.createBuffer.setButtonState(undefined,{text:"Sound buf ready"});
                UIMesh.controls.buffer.update();
                UIMesh.controls.createBuffer.update();
                UIMesh.controls.play.setButtonState(undefined,{text:"Click to play"});
                UIMesh.controls.buffer.setState({color : "default",highlight : "default"});
            }
        );
        recordSound = true;
        sampleMax = 0;
        sampleMin = 0;
        UIMesh.controls.play.setButtonState(undefined,{text:"Recording"});
        UIMesh.controls.buffer.setState({color : "red",highlight : "#F88"});
        return {text:"buffer created"};
    },
    length : "##0.5,0.5,5,0.5,Length of sound sample in seconds",
    supSample : "##1,1,100,1,Number of sound samples per frame",
    buffer : "##0,0,100,0.01,Current buffer full state",
    play(){
        if(soundBuf.ready){
            soundBuf.play();
        }else if(soundBuf){
            setTimeout(()=>{
                    soundBuf.addSupSample(1,0,(soundBuf.samples- soundBuf.bufPos1)+ 2)
                    soundBuf.addSupSample(2,0,(soundBuf.samples- soundBuf.bufPos2)+ 2)
                },20
            );
        }
    },
    saveSound(){
        if(soundBuf){
            if(soundBuf.ready){
                waveFormCreater.saveSoundBuffer(soundBuf,"SticksSound");
            }
        }
    }
}
var systemMenu = {
    name : "System",
    dialogState : {
        top : 0,
        left : innerWidth - 210,
        color : "hsl(120,60%,40%)",
        highlight : "hsl(120,60%,60%)",
        commonState : {
            color : "hsl(120,50%,40%)",
            highlight : "hsl(120,50%,60%)",
            mouseDownHighlight : "hsl(120,60%,70%)",
        },
        showResizeIcon : false,
        showCloseIcon : true,
        help: "UI to control running/view state of simulation\n[LEFT] click to open close menu\n[LEFT] drag to move/tear/doc menu",
    },
    onbeforeclose,
    _exit(){
        this.closeAll = true;
        UIMain.close();
        UIGround.close();
        UIBuild.close();
        UIOutline.close();
        UIMesh.close();
        UISystem.close();
        DM.remove();
    },
    autoView : "##false,Automaticly zoom to structure",
    _autoView : {
        onchanged(control){
            if(running){
                if(systemMenu.autoView){
                    systemMenu.useAutoView = true;
                    systemMenu.useAutoMeanView = false;
                    textMessage("Run mode set to auto view");
                }else{
                    systemMenu.useAutoView = false;
                }
            }else{
                systemMenu.useAutoView = false;
            }
        }
    },
    useMeanView : "##true,Use the mean point position to center view\nElse use extent center to position view",
    _useMeanView : {
        onchanged(control){
            if(running){
                if(systemMenu.useMeanView){
                    systemMenu.useAutoMeanView = true;
                    systemMenu.useAutoView = false;
                    textMessage("Run mode set to mean view");
                }else{
                    systemMenu.useAutoMeanView = false;
                }
            }else{
                systemMenu.useAutoMeanView = false;
            }
        }
    },
    showDataGraph : "##false,Shows the data graph",
    _showDataGraph : {
        onChanged(control){
            if(systemMenu.showDataGraph){
                clearPlots();
            }
        }
    },
    stuff : {
        viewHome(){
            UISystem.controls.autoView.setValue(false);
            view.x = w / 2;
            view.y = h / 2;
            systemMenu.scale = view.scale = 1;
        },
        samplers(event){
            if(event.which === 1){
                lines.setAll("samplers",false);
                lines.setIf("samplers",true,l=>l.selected);
            }else{
                points.setAll("selected",false);
                lines.setAll("selected",false);
                lines.setIf("selected",true,l=>l.samplers);
                selectExtent = true;
            }
        },
        points(event){
            systemMenu._showPoints = !systemMenu._showPoints;
            if(systemMenu._showPoints){
                return {
                    text : "Points On",
                    background : "#4C8",
                }
            }
            return {
                text : "Points Off",
                background : "default",
            }
        },
        _points : { help : "If on then points are only shown for mouse over and selected." },
        _samplers : { help : "Set lines for sound sampling.\n[Left]Sets current selected lines as samplers\n[Right]Selects current samplers"},
    },
    _showPoints : false,
    onclose(){
        localStorage.sticksScene = sceneAsJson();
        closeSim = true;
    },
    stepSim : "##false,When on simulation run in steps",
    run : {
        undo(){
            if(!running && undos.length > 0 && undoPos > 0){
                var undo = undos[--undoPos ];
                if (undo) {
                    imageListFromShadow(undo.images);
                    structureFromShadow(undo.points,undo.lines);
                    groundLines.empty();
                    undo.ground.forEach(p=>{
                        groundLines.add(groundLines.create(0,0))
                            .fromShadow(
                                restoreDefaults(p,groundLines.getDefaultItem())
                            );
                    });
                    needsUndo = false;
                    undoActionCount = 0;
                    groundLines.fix();
                    UISystem.controls.run.setButtonState("redo",{text : "redo "+(undos.length-undoPos)-1})
                }
                return {
                    text : "Undo " + undoPos,
                }
            }
        },
        redo(){
            if(!running && undos.length > 0 && undoPos < undos.length - 1){
                var undo = undos[++undoPos];
                imageListFromShadow(undo.images);
                structureFromShadow(undo.points,undo.lines);
                groundLines.empty();
                undo.ground.forEach(p=>{
                    groundLines.add(groundLines.create(0,0))
                        .fromShadow(
                            restoreDefaults(p,groundLines.getDefaultItem())
                        );
                });
                groundLines.fix();
                needsUndo = false;
                undoActionCount = 0;
                UISystem.controls.run.setButtonState("undo",{text : "undo "+undoPos})
                return {
                    text : "redo " + (undos.length - undoPos)-1,
                }
            }
        },
        step(event){
            if(!running){
                UISystem.controls.run.click("build");
            }
            if(!this.stepSim ){
                this.stepSim = true;
                UISystem.controls.stepSim.update();
            }
            if(event.type === "mousedown"){
                stepSimTime = 1000;
                stepSimTimerHandle = setTimeout(stepSimTimer,100)
                return;
            } else if (event.type === "mouseout"){
                clearTimeout(stepSimTimerHandle);
                return;
            }else{
                clearTimeout(stepSimTimerHandle);
            }
            stepSim = true;
        },
        _step : {
            fireOnMouseDown : true,
            help : "Step the simulation. Hold button to slow step.",
        },
        build(){
            running = !running;
            if (running) {
                if (exampleOnLoad.autoView) {
                    systemMenu.autoView = systemMenu.useAutoView = true;
                    UISystem.controls.autoView.update();
                    exampleOnLoad.autoView = false;
                }
                if(systemMenu.useAutoView || systemMenu.useAutoMeanView){
                    view.save("home");
                    textMessage("Home view saved")
                    systemMenu.autoView = systemMenu.useAutoView;
                    systemMenu.useMeanView = systemMenu.useAutoMeanView
                    UISystem.controls.autoView.update(false,true);
                    UISystem.controls.useMeanView.update(false,true);
                }
                wavePhaseStepIn = 0;
                wavePhaseEase = 0;
                gravPoints.empty();
                points.apply("remember");
                pointsShadow = shadowPoints(pointsShadow);
                shadowStructure(linesShadow);
                if(needsUndo){
                    saveUndo(false);
                }
                lines.apply("init");
                runTime = 0;
                currentRun = 0;
                return {
                    text : "Build",
                    background : "#C48",
                }
            }else{
                structureFromShadow(pointsShadow,linesShadow);
                systemMenu.stepSim = false;
                UISystem.controls.stepSim.update();
                if((systemMenu.useAutoView && systemMenu.autoView) || (systemMenu.useAutoMeanView && systemMenu.useMeanView)){
                    systemMenu.autoView = false;
                    systemMenu.useMeanView = false;
                    UISystem.controls.autoView.update(false,true);
                    UISystem.controls.useMeanView.update(false,true);
                    if(!view.restore("home")){
                        view.restore("default");
                        textMessage("Default view restored");
                    }else{
                        textMessage("Home view restored");
                    }
                }
                simTime = 0;
            }
            points.apply("revert");
            points.eachSelected(point=>{
                buildMenu.radius = point.radius;
                var img = imageList.getById(point.id);
                if(img){
                    buildMenu.image = img.image;
                    buildMenu.imageZindex = img.zIndex;
                }
            })
            updateMenus();
            return {
                text : "Run Sim",
                background : "default",
            }
        },
        _build :{
            help : "Starts and stops the simulation",
            key : "Backslash",
        }
    }
}
const AOIDS = {
    NULL: 0,
    FLAG: {
        THRUST: 0,
        RCS_RIGHT: 1,
        RCS_LEFT: 2,
        RCS_UP: 3,
        RCS_DOWN: 4,
        BODY: 5,
        LEG_RIGHT: 6,
        NO_SIM: 7,
        LEG_LEFT: 8,
        NO_BREAK: 9,
        A_MARK: 10,
        B_MARK: 11,
        WEAPON: 12,
        NO_COLLIDE: 13,
        IGNOR: 14,
        MOUNT: 15,
        RCS_FRONT: 16,
        RCS_BACK: 17,
        BROKEN: 18,
    },
    ID: {
    }
};
const Aoids = {
    lineClear(flag) {
        lines.eachSelected(l => l.flag = AOIDS.NULL);
        AoidsMenu.onupdateall();
    },
    lineClick(flag) {
        var f = 1 << flag;
        var fMask = ~f;
        var remove = false;
        var firstFlag;
        lines.eachSelected(l => {
            if (firstFlag === undefined) {
                if (l.flag & f) {
                    remove = true;
                } else {
                    remove = false;
                }
                //firstFlag = l.flag;
                //if (firstFlag != flag) { firstFlag = flag }
                //else { firstFlag = AOIDS.NULL }
            }
            remove ?
                l.flag &= fMask :
                l.flag |= f;
        });
        AoidsMenu.onupdateall();
    },
    pointClear(flag) {
        points.eachSelected(p => p.flag = AOIDS.NULL);
        AoidsMenu.onupdateall();
    },
    pointClick(flag) {
        var f = 1 << flag;
        var fMask = ~f;
        var remove = false;
        var firstFlag;
        points.eachSelected(p => {
            if (firstFlag === undefined) {
                if (p.flag & f) {
                    remove = true;
                } else {
                    remove = false;
                }
                //firstFlag = p.flag;
                //if (firstFlag != flag) { firstFlag = flag }
                //else { firstFlag = AOIDS.NULL }
            }
            remove ?
                p.flag &= fMask :
                p.flag |= f;
        });
        AoidsMenu.onupdateall();
    },
    flagClick(e, flag) {
        if (e.ctrlKey) {
            selections.selectByName(e.which === 1 ? "lineFlags" : "pointFlags", 1 << flag);
            selectExtent = true;
        } else {
            e.which === 1 ? Aoids.lineClick(flag) : Aoids.pointClick(flag);
        }
    }
}
var AoidsMenu = {
    name : "Aoids Structure",
    dialogState : {
        top : 0,
        left : innerWidth - 210 - 204 - 204,
        color : "hsl(320,60%,40%)",
        highlight : "hsl(320,60%,60%)",
        commonState : {
            color : "hsl(330,50%,40%)",
            highlight : "hsl(330,50%,60%)",
            mouseDownHighlight : "hsl(330,60%,70%)",
        },
        showResizeIcon : false,
    },
    onbeforeclose,
    onupdateall() {
        const background = "hsl(120,60%,60%)";
        const backgroundP = "hsl(180,60%,60%)";
        const offCol = "default";
        const conts = UIAoids.controls;
        conts.flagLine1.setButtonState("thrust", {background: offCol});
        conts.flagLine1.setButtonState("body",   {background: offCol});
        conts.flagLine2.setButtonState("left",   {background: offCol});
        conts.flagLine2.setButtonState("right",  {background: offCol});
        conts.flagLine2.setButtonState("back",   {background: offCol});
        conts.flagLine2.setButtonState("front",  {background: offCol});
        conts.flagLine3.setButtonState("RLeg",   {background: offCol});
        conts.flagLine3.setButtonState("noB",    {background: offCol});
        conts.flagLine3.setButtonState("ignor",  {background: offCol});
        conts.flagLine3.setButtonState("weapon", {background: offCol});
        conts.flagLine4.setButtonState("LLeg",   {background: offCol});
        conts.flagLine4.setButtonState("noSim",  {background: offCol});
        conts.flagLine4.setButtonState("mount",   {background: offCol});
        conts.flagLine4.setButtonState("noColl",  {background: offCol});
        conts.flagLine5.setButtonState("aMark",  {background: offCol});
        conts.flagLine5.setButtonState("bMark",  {background: offCol});
        lines.eachSelected(l => {
            (l.flag & (1 << AOIDS.FLAG.THRUST          )) && conts.flagLine1.setButtonState("thrust",{background});
            (l.flag & (1 << AOIDS.FLAG.BODY            )) && conts.flagLine1.setButtonState("body",  {background});
            (l.flag & (1 << AOIDS.FLAG.RCS_RIGHT       )) && conts.flagLine2.setButtonState("right", {background});
            (l.flag & (1 << AOIDS.FLAG.RCS_LEFT        )) && conts.flagLine2.setButtonState("left",  {background});
            (l.flag & (1 << AOIDS.FLAG.RCS_BACK        )) && conts.flagLine2.setButtonState("back",  {background});
            (l.flag & (1 << AOIDS.FLAG.RCS_FRONT       )) && conts.flagLine2.setButtonState("front", {background});
            (l.flag & (1 << AOIDS.FLAG.LEG_RIGHT       )) && conts.flagLine3.setButtonState("RLeg",  {background});
            (l.flag & (1 << AOIDS.FLAG.NO_BREAK        )) && conts.flagLine3.setButtonState("noB",   {background});
            (l.flag & (1 << AOIDS.FLAG.IGNOR           )) && conts.flagLine3.setButtonState("ignor",  {background});
            (l.flag & (1 << AOIDS.FLAG.WEAPON          )) && conts.flagLine3.setButtonState("weapon", {background});
            (l.flag & (1 << AOIDS.FLAG.LEG_LEFT        )) && conts.flagLine4.setButtonState("LLeg",  {background});
            (l.flag & (1 << AOIDS.FLAG.NO_SIM          )) && conts.flagLine4.setButtonState("noSim",{background});
            (l.flag & (1 << AOIDS.FLAG.MOUNT           )) && conts.flagLine4.setButtonState("mount",  {background});
            (l.flag & (1 << AOIDS.FLAG.NO_COLLIDE      )) && conts.flagLine4.setButtonState("noColl", {background});
            (l.flag & (1 << AOIDS.FLAG.A_MARK          )) && conts.flagLine5.setButtonState("aMark", {background});
            (l.flag & (1 << AOIDS.FLAG.B_MARK          )) && conts.flagLine5.setButtonState("bMark", {background});
        });
        points.eachSelected(p => {
            (p.flag & (1 << AOIDS.FLAG.THRUST          )) && conts.flagLine1.setButtonState("thrust",{background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.BODY            )) && conts.flagLine1.setButtonState("body",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.RCS_RIGHT       )) && conts.flagLine2.setButtonState("right", {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.RCS_LEFT        )) && conts.flagLine2.setButtonState("left",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.RCS_BACK        )) && conts.flagLine2.setButtonState("back",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.RCS_FRONT       )) && conts.flagLine2.setButtonState("front", {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.LEG_RIGHT       )) && conts.flagLine3.setButtonState("RLeg",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.NO_BREAK        )) && conts.flagLine3.setButtonState("noB",   {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.IGNOR           )) && conts.flagLine3.setButtonState("ignor",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.WEAPON          )) && conts.flagLine3.setButtonState("weapon", {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.LEG_LEFT        )) && conts.flagLine4.setButtonState("LLeg",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.NO_SIM          )) && conts.flagLine4.setButtonState("noSim",{background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.MOUNT           )) && conts.flagLine4.setButtonState("mount",  {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.NO_COLLIDE      )) && conts.flagLine4.setButtonState("noColl", {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.A_MARK          )) && conts.flagLine5.setButtonState("aMark", {background: backgroundP});
            (p.flag & (1 << AOIDS.FLAG.B_MARK          )) && conts.flagLine5.setButtonState("bMark", {background: backgroundP});
        });
    },
    onchanged(control){
        if (AoidsMenu.ignorUpdates) { return; }
        if (control.name === "lineWidth") { }
    },
    clearGroup : "==Reset,default,Reset flags and ids",
    clear: {
        lineClear() { Aoids.lineClear() },
        pointClear() { Aoids.pointClear() },
        _lineClear: { help : "Removes flags form selected lines" },
        _pointClear: { help : "Removes ids form selected points" },
    },
    flagGroup : "==Flags LClick lines RClick points,default,Sets flags of selected lines [left][click]and or points [right][click]",
    flagLine1: {
        thrust(e) { Aoids.flagClick(e, AOIDS.FLAG.THRUST) },
        body(e) { Aoids.flagClick(e, AOIDS.FLAG.BODY) },
        _thrust: { help : "Selected lines flagged thrust\n[Right}[Click] to flag points" },
        _body: { help : "Selected lines flagged body\n[Right}[Click] to flag points" },
    },
    flagLine2: {
        left(e) { Aoids.flagClick(e, AOIDS.FLAG.RCS_LEFT) },
        right(e) { Aoids.flagClick(e, AOIDS.FLAG.RCS_RIGHT) },
        back(e) { Aoids.flagClick(e, AOIDS.FLAG.RCS_BACK) },
        front(e) { Aoids.flagClick(e, AOIDS.FLAG.RCS_FRONT) },
        //up() { Aoids.lineClick(AOIDS.FLAG.RCS_UP) },
        //down() { Aoids.lineClick(AOIDS.FLAG.RCS_DOWN) },
        _left: { help : "Selected lines flagged RCS left\n[Right}[Click] to flag points" },
        _right: { help : "Selected lines flagged RCS right\n[Right}[Click] to flag points" },
        _back: { help : "Selected lines flagged RCS back\n[Right}[Click] to flag points" },
        _front: { help : "Selected lines flagged RCS front\n[Right}[Click] to flag points" },
        //_up: { help : "Selected lines flagged RCS up" },
        //_down: { help : "Selected lines flagged RCS_down" },
    },
    flagLine3: {
        RLeg(e) { Aoids.flagClick(e, AOIDS.FLAG.LEG_RIGHT) },
        noB(e) { Aoids.flagClick(e, AOIDS.FLAG.NO_BREAK) },
        ignor(e) { Aoids.flagClick(e, AOIDS.FLAG.IGNOR) },
        weapon(e) { Aoids.flagClick(e, AOIDS.FLAG.WEAPON) },
        _RLeg: { help : "Selected lines flagged landing leg right\n[Right}[Click] to flag points" },
        _noB: { help : "Flags lines as unbreakable\n[Left][Click] lines [Right}[Click] points" },
        _ignor: { help : "Do not use in simulation [Left][Click] lines [Right}[Click] points" },
        _weapon: { help : "Flags lines as weapon\n[Left][Click] lines [Right}[Click] points" },
    },
    flagLine4: {
        LLeg(e) { Aoids.flagClick(e, AOIDS.FLAG.LEG_LEFT) },
        noSim(e) { Aoids.flagClick(e, AOIDS.FLAG.NO_SIM) },
        mount(e) { Aoids.flagClick(e, AOIDS.FLAG.MOUNT) },
        noColl(e) { Aoids.flagClick(e, AOIDS.FLAG.NO_COLLIDE) },
        _LLeg: { help : "Selected lines flagged landing leg Left\n[Right}[Click] to flag points" },
        _noSim: { help : "Do not constrain line flag [Left][Click] lines [Right}[Click] points" },
        _mount: { help : "Mount flag (used to attach to main model)\n[Left][Click] lines [Right}[Click] points" },
        _noColl: { help : "No Colide flag [Left][Click] lines [Right}[Click] points" },
    },
     flagLine5: {
        aMark(e) { Aoids.flagClick(e, AOIDS.FLAG.A_MARK) },
        bMark(e) { Aoids.flagClick(e, AOIDS.FLAG.B_MARK) },
        _aMark: { help : "Toggle mark A [Left][Click] lines [Right}[Click] points" },
        _bMark: { help : "Toggle mark B [Left][Click] lines [Right}[Click] points" },
    },
    /*idPoint: {
    }*/
};
var retroLanderMenu = {
    name : "Retro lander",
    dialogState : {
        top : 0,
        left : innerWidth - 210 - 204 - 204,
        color : "hsl(320,60%,40%)",
        highlight : "hsl(320,60%,60%)",
        commonState : {
            color : "hsl(330,50%,40%)",
            highlight : "hsl(330,50%,60%)",
            mouseDownHighlight : "hsl(330,60%,70%)",
        },
        showResizeIcon : false,
    },
    onbeforeclose,
    onchanged(control){
        if(buildMenu.ignorUpdates){
            return;
        }
        if(control.name === "lineWidth"){
        }
    },
    assign: {
        fuel(){
            points.eachSelected(p => p.flag = flagTypes.fuel );
            lines.eachSelected(l => l.flag = flagTypes.fuel );
        },
        life(){  lines.eachSelected(l => l.flag = flagTypes.lifeSupport  ) },
        vol(){  lines.eachSelected(l => l.flag = flagTypes.volatiles  ) },
        feet(){  points.eachSelected(p => p.flag = flagTypes.feet  ) },
        _fuel : { help : "Selected lines and points become fuel" },
        _life : {help : "Selected lines contain life support"},
        _vol : {help : "Selected lines contain volatiles "},
        _feet : {help : "Selected points become landing pads\n(used to find landing) "},
    },
    assignC : {
        att(){  lines.eachSelected(l => l.flag = flagTypes.attitude  ) },
        ref(){  lines.eachSelected(l => l.flag = flagTypes.attitudeRef  ) },
        drive(){ points.eachSelected(p => p.flag = flagTypes.drive ) },
        brake(){ points.eachSelected(p => p.flag = flagTypes.brake ) },
        _drive : {help : "Selected points become drive wheels / and brake wheels"},
        _brake : {help : "Selected points become brake wheels"},
        _att : {help : "Selected lines become attitude guide"},
        _ref : {help : "Selected lines become attitude reference"},
    },
    assignB : {
        up(){ lines.eachSelected(l => l.flag = flagTypes.up  ) },
        left(){ lines.eachSelected(l => l.flag = flagTypes.left ) },
        right(){  lines.eachSelected(l => l.flag = flagTypes.right  ) },
        down(){ lines.eachSelected(l => l.flag = flagTypes.down ) },
        shut(){ lines.eachSelected(l => l.flag = flagTypes.shutdown ) },
        release(){ lines.eachSelected(l => l.flag = flagTypes.release ) },
        _up : { help : "Selected lines become main thruster (up action)"},
        _left : {help : "Selected lines RCS left"},
        _right : {help : "Selected lines RCS right"},
        _down : {help : "Selected lines RCS down"},
        _shut : {help : "Selected lines craft shutdown"},
        _release : {help : "Selected lines craft release"},
    },
    assignA : {
        tBase(){  points.eachSelected(p => p.flag = flagTypes.trajectoryBase  ) },
        traj(){  points.eachSelected(p => p.flag = flagTypes.trajectory  ) },
        alt(){  points.eachSelected(p => p.flag = flagTypes.altitude  ) },
        statics() {
             points.eachSelected(p => p.flag = flagTypes.statics  )
             lines.eachSelected(l => l.flag = flagTypes.statics  )
        },
        _tBase : { help : "Selected point is the base of trajectory" },
        _traj : { help : "Selected points define the trajectory"},
        _alt : { help : "Selected points define the min altitude."},
        _statics : { help : "Selected points/lines are static and do not get simulated."},
    },
    assignD : {
        none(){
             points.eachSelected(p => p.flag = flagTypes.connect  );
             lines.eachSelected(l => l.flag = flagTypes.connect  );
        },
        connect() {
             points.eachSelected(p => p.flag = flagTypes.connect  );
             lines.eachSelected(l => l.flag = flagTypes.connect  );
        },
        _none : { help : "Sets selected points and lines to flag type none (default)" },
        _connect : { help : "Selected points/lines are flaged as connectors."},
    },
}
function exampleOnLoad(data) {
    if (data.messages) {
        for (const mess of data.messages) {
            if (mess[0] === "sys") { systemMessage(mess[1], mess[2]) }
            else { textMessage(mess[1], mess[2]) }
        }
    }
    if (data.useGround) {        
        groundMenu.useGround = true;
        UIGround.controls.useGround.update();        
        if (data.groundType) { 
            UIGround.controls.create.click(data.groundType); 
            if (data.groundSlope !== undefined) { 
                groundMenu.slope = data.groundSlope;
                UIGround.controls.slope.update();            
            }
        }
    }
    if (data.showPoints) {
        UISystem.controls.stuff.click("points");        
    }
    exampleOnLoad.autoView = data.autoView === true ? true : false;
    if (data.clicks) {
        for (const click of data.clicks) {
            if (click[0] === "system") {
                if (click.length  === 3) {
                    UISystem.controls[click[1]].click(click[2]);                
                }
            }
        }
        
    }
}
var ExamplesMenu = {
    name : "Example scenes",
    dialogState : {
        top : 0,
        left : innerWidth - 210 - 204 - 204,
        color : "hsl(360,60%,40%)",
        highlight : "hsl(360,60%,60%)",
        commonState : {
            color : "hsl(320,50%,40%)",
            highlight : "hsl(320,50%,60%)",
            mouseDownHighlight : "hsl(320,60%,70%)",
        },
        showResizeIcon : false,
    },
    onbeforeclose,
    onchanged(control){ },
    loadBuilding() {
        if (!running) {
            systemMenu.useAutoView = false;
            dropJson({name: "Building111Stories.json", onloaded: exampleOnLoad});
        } else {
            systemMessage("Stop sim befor loading scene.");
        }
    },
    _loadBuilding: {help: "Click to load 111 story building simulation."},
    loadCar() {        
        if (!running) { systemMenu.useAutoView = false; dropJson({name: "Car.json", onloaded: exampleOnLoad}); }
        else { systemMessage("Stop sim befor loading scene."); }
    },
    _loadCar: {help: "Click to load car with suspension and drive wheel."},    
    loadWorm() {        
        if (!running) { systemMenu.useAutoView = false; dropJson({name: "Worm.json", onloaded: exampleOnLoad}); }
        else { systemMessage("Stop sim befor loading scene."); }
    },
    _loadWorm: {help: "Click to load Worm that uses occilators to move."},    
};

GUI.start();
GUI.image.spriteSheet("meshModIcons","icons/MeshModifyIcons.png",{width : 16, height : 16})
GUI.image.spriteSheet("meshModWideIcons","icons/MeshModifyIcons.png",{width : 32, height : 16})
var UISystem = dataGUI.createDialog(systemMenu);
var UIMain = dataGUI.createDialog(mainMenu);
var UIGround = dataGUI.createDialog(groundMenu);
var UIOutline = dataGUI.createDialog(outlineMenu);
var UIMesh = dataGUI.createDialog(meshExtrasMenu);
var UIBuild = dataGUI.createDialog(buildMenu);
const UIScenes = dataGUI.createDialog(ExamplesMenu);
var UIAoids = dataGUI.createDialog(AoidsMenu);
var UIRetro = dataGUI.createDialog(retroLanderMenu);
setTimeout(()=>{
    UIGround.dock(UIBuild);
    UIBuild.dock(UIMain);
    UIMain.dock(UISystem);
    UIMesh.dock(UIOutline);
    UIScenes.dock(UIMesh);
    //UIAoids.dock(UIMesh);
    //UIRetro.dock(UIMesh);
    UISystem.open();
    UIMain.open();
    UIBuild.open();
    UIGround.open();
    UIOutline.open();
    UIMesh.open();
    UIScenes.open();
    //UIAoids.open();
    //UIRetro.open();
    setTimeout(()=>{
        UIOutline.fold();
        UIMesh.fold();
        UIAoids.fold();
        UISystem.controls.stuff.click("points");
    }, 1500);
},100);
/*setTimeout(()=>{UIBuild.open();UIBuild.dock(UIMain);},150);
setTimeout(()=>{UIGround.open();UIGround.dock(UIBuild);},200);
setTimeout(()=>{UIOutline.open();},200);*/
setTimeout(()=>{UISystem.controls.run.click("build")},500);
systemMenu.scale = 1;
var soundBuf;
var recordSound = false;
var sampleMax = 0;
var sampleMin = 0;
var sampleValue = 0;
function createTestData(){
    var w  = 0;//innerWidth / 2;
    var h  = 0;//innerHeight / 2;
    points.fromArray([w - 50, h + 50, w + 50, h + 50,w + 50, h - 50,w - 50, h - 50]);
    lines.linkPoints(points.getSubList(0, points.length));
    lines.add(lines.create(points.items[0],points.items[2]));
    lines.add(lines.create(points.items[1],points.items[3]));
    //points.items[2].radius = 30;
    //points.items[3].radius = 30;
    pointsShadow = shadowPoints(pointsShadow);
    shadowStructure(linesShadow);
}
function createFromGrooverSVG(data){
    data.forEach(shape => {
        var p1,p2,firstP;
        shape.forEach(p => {
            if(p1 !== undefined){
                if(p[0] === shape[0][0] && p[1] === shape[0][1]){
                    lines.add(lines.create(p1,firstP));
                }else{
                    p2 = points.add(points.create(p[0],p[1]));
                    lines.add(lines.create(p1,p2));
                }
            }else{
                p2 = points.add(points.create(p[0],p[1]));
                firstP = p2;
            }
            p1 = p2;
        })
    });
    pointsShadow = shadowPoints(pointsShadow);
    shadowStructure(linesShadow);
}
canvas.style.position = "absolute"
canvas.style.top = "0px"
canvas.style.left = "0px"
canvas.style.right = "0px"
canvas.style.bottom = "0px"
canvas.style.background = "rgba(0,0,0,0)"
canvas.width = innerWidth
canvas.height = innerHeight
canvas.style.zIndex = 1000;
canvas.style.border = "none";
var gCanvas = document.createElement("canvas");
gCanvas.width = 1024;
gCanvas.height = 256;
var ctxG = gCanvas.getContext("2d");
var gDataRaw = ctxG.getImageData(1023,0,1,256);
var gDataRawPix = new Uint32Array(gDataRaw.data.buffer);
gDataRawPix.fill(0xFF000000);
function updatePlots(){
    ctxG.drawImage(gCanvas,-1,0);
    ctxG.fillStyle = "black";
    ctxG.fillRect(1023,0,1,256);
    ctxG.fillStyle = "white";
}
function clearPlots(){
    ctxG.fillStyle = "black";
    ctxG.fillRect(0,0,1024,256);
    ctxG.fillStyle = "white";
    ctxG.fillRect(0,128,1024,1)
}
var selectingLine = false;
var runTime = 0;
var lastRun = Infinity;
var currentRun = 0;
var debugData = {
    x : 0,
    y: 0,
}
var w = canvas.width;
var h = canvas.height;
var cw = w / 2;  // center
var ch = h / 2;
var globalTime;  // global to this
boxes.add(boxes.create(10,10,w-10,h * 0.95));
var dragging = false;
var dragItem;
var dragOffX;
var dragOffY;
var dragOffScrX;
var dragOffScrY;
var dragStartX;
var dragStartY;
var lastX,lastY;
var dragBox ={
    x :0, y : 0, w : 0, h : 0,
}
var dragType = 0; // 0 for point 1 for line
var dragMirror;
var dragCount = 0;
var pull = {
    x : 0, y : 0, len : 0,
    pull(p){
        this.nx = p.x  + (this.x - p.x) * 0.1;
        this.ny = p.y  + (this.y - p.y) * 0.1;
    },
    setPos(x,y){
        this.x = x;
        this.y = y;
    }
}
var cursor;
var newLine;
var newLineMirror;
var dragData = {};
var invScale = 1;
var structExtent = {};
var selectedExtent = {left : null};
var selectExtent = false;
var lastSx = 0;
var lastSy = 0;
// working vectors and lines.
var wv1 = V(0,0);
var wv2 = V(0,0);
var wv3 = V(0,0);
//var wv4 = V(0,0);
var wl1 = L(V(),V());
var wl2 = L(V(),V());
//var wl2 = L(V(0,0),V(0,0));
//var wl12 = L(wv1,wv2);
//var wl34 = L(wv3,wv4);
var pointLines; // array of lines attached to selected points
ctx.font = "16px arial";
ctx.lineJoin = "round";
ctx.lineCap = "round";
var mouseButtonLastOn = 0; // used to delay some functions after mouse button released
var structDirty = true;
var structScruffy = false;
var lastLineSelectedIndex = 0;
var closestArray = [];
const sizeOfPlay = 400000;
const view = (()=>{
    const matrix = [1,0,0,1,0,0]; // current view transform
    const invMatrix = [1,0,0,1,0,0]; // current inverse view transform
    var m = matrix;  // alias
    var im = invMatrix; // alias
    var rotate = 0;  // current x axis direction in radians
    var scale = 1;   // current scale
    const views = [];
    const pos = {      // current position of origin
        x : 0,
        y : 0,
    }
    var dirty = true;
    const API = {
        apply(ctx){
            if(dirty){ this.update() }
            ctx.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        },
        getScale(){
            return scale;
        },
        matrix,
        changed : false,
        save(name){
            var sV = views[name];
            if(sV === undefined){
                sV = {};
            }
            sV.rotate = rotate;
            sV.scale = scale;
            sV.pos = {x:pos.x,y:pos.y};
            views[name] = sV;
        },
        restore(name){
            var sV = views[name];
            if(sV !== undefined){
                rotate = sV.rotate;
                scale = sV.scale;
                pos.x = sV.pos.x;
                pos.y = sV.pos.y;
                this.update();
                this.changed = true;
                return true;
            }
            return false;
        },
        update(){ // call to update transforms
            var xdx = Math.cos(rotate) * scale;
            var xdy = Math.sin(rotate) * scale;
            this.invScale = 1 / scale;
            m[0] = xdx;
            m[1] = xdy;
            m[2] = -xdy;
            m[3] = xdx;
            m[4] = pos.x;
            m[5] = pos.y;
            // calculate the inverse transformation
            var cross = m[0] * m[3] - m[1] * m[2];
            im[0] =  m[3] / cross;
            im[1] = -m[1] / cross;
            im[2] = -m[2] / cross;
            im[3] =  m[0] / cross;
            dirty = false;
        },
        toWorld(x,y,point = {}){  // convert screen to world coords
            var xx, yy;
            if(dirty){ this.update() }
            xx = x - m[4];
            yy = y - m[5];
            point.x = xx * im[0] + yy * im[2];
            point.y = xx * im[1] + yy * im[3];
            return point;
        },
        toScreen(x,y,point = {}){  // convert world coords to  coords
            if(dirty){ this.update() }
            point.x =  x * m[0] + y * m[2] + m[4];
            point.y = x * m[1] + y * m[3] + m[5];
            return point;
        },
        movePos(x,y){
            pos.x += x;
            pos.y += y;
            dirty = true;
        },
        setPos(x,y){
            pos.x = x;
            pos.y = y;
            dirty = true;
        },
        setScale(sc){
            scale = sc;
            dirty = true;
        },
        scaleScale(sc){
            scale *= sc;
            dirty = true;
        },
        scaleAt(x,y,sc){
            if(dirty){ this.update() }
            scale *= sc;
            pos.x = x - (x - pos.x) * sc;
            pos.y = y - (y - pos.y) * sc;
            dirty = true;
        }
    };
    setTimeout(()=>{API.save("default")},2000);
    return API;
})();
var frameTime = 0;
var lineInterceptSel = false;
const mouseTransform = {
    on : false,
    button : {
        from : 0,
        to : 0,
    }
}
// main update function
var simTime = 0;
function update(timer){
    var closeLine, closePoint, closeGroundPoint, closeExtent, i, sx, sy, s, smx, smy, mx, my, pix, clearSel, p, dist, p1, dx, dy, mx1, my1;
    if(canvas.width !== innerWidth || canvas.height !== innerHeight){
        cw = (w = canvas.width = innerWidth) / 2;
        ch = (h = canvas.height = innerHeight) / 2;
        ctx.font = "16px arial";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
    }
    cursor = "default";
    runTime += 1;
    frameTime = timer - globalTime;
    globalTime = timer;
    ctx.setTransform(1,0,0,1,0,0); // reset transform
    ctx.globalAlpha = 1;           // reset alpha
    ctx.clearRect(0,0,w,h);
    if(running){
        ctx.fillStyle = COLS.running.col;
    }else{
        ctx.fillStyle = groundMenu.editGround ? COLS.groundEdit.col : COLS.stickEdit.col;
    }
    ctx.fillRect(0,0,w,h);
    if(mouseTransform.on){
        if(mouse.buttonRaw === 0){
            mouseTransform.on = false;
        }else if(mouse.buttonRaw === mouseTransform.button.from){
            mouse.buttonRaw = mouseTransform.button.to;
        }
    }
    if(mouse.buttonRaw !== 0){
        mouseButtonLastOn = 5;
    }else{
        if(mouseButtonLastOn > 0){
            mouseButtonLastOn --;
        }
    }
    if(mouse.w !== 0){
        if(mouse.w < 0){
            systemMenu.scale *= 1/1.1;
            mouse.w = 0;
            view.scaleAt(mouse.x,mouse.y,1/1.1);
        }else{
            systemMenu.scale *= 1.1;
            mouse.w = 0;
            view.scaleAt(mouse.x,mouse.y,1.1);
        }
    }
    boxes.items[0].top = - sizeOfPlay;
    boxes.items[0].left = - sizeOfPlay;
    boxes.items[0].right = sizeOfPlay;
    boxes.items[0].bottom = sizeOfPlay;
    if(running){
        selectedExtent.left = null; // turn off selection box
        if((systemMenu.stepSim && stepSim) || (!systemMenu.stepSim)){
            simTime += 1;
            systemMenu._controls?.stepSim.setState({text : "Step Sim " + (simTime / 60).toFixed(2) + "Sec"});
            stepSim = false;
            if(systemMenu.showDataGraph){
                gDataRawPix.fill(0xFF000000);
            }
            var rep = 1;
            rep = meshExtrasMenu.supSample;
            for(var k = 0; k < rep; k++){
                if(recordSound){
                    sampleMax = Math.max(sampleMax,sampleValue)
                    sampleMin = Math.min(sampleMin,sampleValue)
                    sampleValue = 0;
                }
                points.move();
                points.applyGravityPoints();
                lines.updateStart(true,true);
                pointStack.eachItem(p=>{
                    p.updatePosPoints();
                })
                points.constrainBounds(boxes.items[0]);
                if(groundMenu.useGround){
                    surfaceLines.fix();
                    points.constrainToLine(surfaceLines,true,true);
                }
                points.applyQuick("update");
                for(i = 0; i < mainMenu.stiffness; i++){
                    lines.constrainLength(i);
                    lines.updateAttachedPoints()
                    points.constrainBounds(boxes.items[0],false);
                    surfaceLines.fix();
                    if(groundMenu.useGround){
                        points.constrainToLine(groundLines,i === 0);
                        if(surfaceLines.length > 1){
                            points.constrainToLine(surfaceLines,false,true);
                        }
                    }
                    pointStack.eachItem(p=>{
                        p.updatePosPoints();
                    })
                }
                lines.applyQuick("update");
                if(running){
                    if(points.meanPos.x > boxes.items[0].right -2000){
                        moveStructureTo((boxes.items[0].left - boxes.items[0].right) + 3000,0);
                    }
                }
                if(wavePhaseStepIn < 1){
                    wavePhaseStepIn += 1/wavePhaseStepInFrames;
                    wavePhaseEase = eCurve(wavePhaseStepIn,2);
                    if(wavePhaseStepIn >= 1){
                        wavePhaseStepIn = 1;
                    }
                }
                if(recordSound){
                    soundBuf.addSupSample(1,sampleValue,1);
                    soundBuf.addSupSample(2,sampleValue,1);
                    if(systemMenu.showDataGraph){
                        var y = (sampleValue - sampleMin) / (sampleMax-sampleMin)
                        if(y === Infinity){
                            var y = Math.round(sampleValue * 128 + 128) % 256;
                        }else{
                            y = Math.round((y-0.5) * 256 + 128);
                        }
                        gDataRawPix[y] = 0xFFFFFFFF;
                    }
                }
            }
        }
    }else{
        lines.updateStart(true,false);
    }
    if((systemMenu.autoView || systemMenu.useMeanView) && !view.changed){
        if(mouseButtonLastOn === 0 && points.items.length > 0){}
        s = systemMenu.scale;
        if(running){
            if(!systemMenu.useMeanView){
                structExtent = points.getExtent(structExtent);
                sx = (structExtent.right + structExtent.left)/2// - (w /2) * s;
                sy = (structExtent.bottom + structExtent.top)/2 //- (h /2) * s;
            }else{
                sx = points.meanPos.x;
                sy = points.meanPos.y;
            }
        }else{
            if(!systemMenu.useMeanView){
                structExtent = points.getExtent(structExtent);
                sx = (structExtent.right + structExtent.left)/2// - (w /2) * s;
                sy = (structExtent.bottom + structExtent.top)/2 //- (h /2) * s;
                textMessage("Auto view only applied once in build mode.")
            }else{
                points.getMeanPos();
                sx = points.meanPos.x;
                sy = points.meanPos.y;
                textMessage("Mean view only applied once in build mode.")
            }
            systemMenu.useMeanView = false;
            UISystem.controls.useMeanView.update();
            systemMenu.autoView = false;
            UISystem.controls.autoView.update();
        }
        smx = sx-lastSx;
        smy = sy-lastSy;
        lastSx = sx;
        lastSy = sy;
        s = view.getScale();
        view.setPos((-sx * s)  + (w / 2) ,(-sy * s) + (h / 2) )
    }else{
        view.scale = systemMenu.scale;
        view.changed = false;
    }
    view.apply(ctx);
    invScale = 1 / view.getScale();
    mx = mouse.x;
    my = mouse.y;
    view.toWorld(mx,my,mouse);
    if(! running){
        ctx.fillStyle = groundMenu.editGround ? "#00F" : "#0F0";
        ctx.fillRect(mouse.x,boxes.items[0].top,invScale,boxes.items[0].bottom - boxes.items[0].top);
        ctx.fillRect(boxes.items[0].left,mouse.y,boxes.items[0].right - boxes.items[0].left,invScale);
    }
    ctx.lineWidth = invScale;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    boxes.draw();
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-1 * invScale,boxes.items[0].top,2 * invScale,boxes.items[0].bottom-boxes.items[0].top);
    ctx.fillRect(boxes.items[0].left,-1 * invScale,boxes.items[0].right - boxes.items[0].left,2 * invScale);
    ctx.strokeRect(-1920 / 2, -1080 / 2, 1920, 1080);
    ctx.globalAlpha = 1;
    points.massCenter.x = 0;
    points.massCenter.y = 0;
    points.massCenter.count = 0;
    points.applyQuick("update");
    if(selectExtent){
        selectExtent = false;
        if(!running){
            selectedExtent = points.getExtent(selectedExtent,p=>p.selected);
        }
    }
    if(!dragging){
        if(groundMenu.editGround){
            closeGroundPoint = groundLines.getClosest(mouse.x,mouse.y,8 * invScale);
            if(closeGroundPoint){
                cursor = "move";
            }
        }else{
            closePoint = undefined;
            if(!selectingLine){
                var distLimit = running ? 50 : -1;
                if(invScale > 0.4){
                    distLimit = running ? 50 : 8;
                    distLimit *= invScale;
                }
                closePoint = points.getClosest(mouse.x,mouse.y,distLimit);
                if((closePoint === undefined && running) || (running && closePoint && closePoint.screenSpace)){
                    closePoint = points.getClosest(mx,my,distLimit);
                }
                if(closePoint !== undefined){
                    if(closePoint.selected){
                        cursor = "move";
                    }else{
                        cursor = "pointer";
                        closePoint.highlight = true;
                    }
                }
            }
            if(!running && closePoint === undefined){
                if(mouse.ctrl){
                    lines.getAllWithin(mouse.x,mouse.y,5 * invScale,closestArray);
                    if(closestArray.length > 0){
                        if(closestArray[closestArray.length-1].selected){
                            closeLine = closestArray[0];
                        }else{
                            for(var i = closestArray.length -1; i >= 0; i--){
                                if(closestArray[i].selected) { break; }
                                closeLine = closestArray[i];
                            }
                        }
                    }
                }else{
                    closeLine = lines.getClosest(mouse.x,mouse.y,5 * invScale);
                }
                if(closeLine !== undefined){
                    lastLineSelectedIndex = lines.lastIndex;
                    if(mouse.ctrl){
                        cursor = "pointer";
                    }else{
                        if(closeLine.selected){
                            cursor = "move";
                        }else{
                            cursor = "pointer";
                        }
                    }
                }
            }
        }
    }
    if(groundMenu.editGround){
        ctx.lineWidth = 2*invScale;
        ctx.strokeStyle = "purple";
        groundLines.draw();
        ctx.fillStyle = "red";
        groundLines.drawSelected();
        ctx.fillStyle = "#0f0";
        groundLines.drawNormal();
        if(closeGroundPoint){
            ctx.fillStyle = "#0F0";
            ctx.strokeStyle = "#F90";
            ctx.lineWidth = 4 * invScale;
            closeGroundPoint.draw();
            ctx.stroke();
        }
        ctx.lineWidth = 2 * invScale;
        ctx.strokeStyle = "green";
        surfaceLines.draw();
    }else{
        ctx.lineWidth = 2 * invScale;
        ctx.strokeStyle = "green";
        groundLines.draw();
        surfaceLines.draw();
    }
    ctx.lineWidth = 2 * invScale;
    ctx.strokeStyle = "black";
    lines.drawUnSelected("black",2);
    ctx.lineWidth = 2 * invScale;
    if(systemMenu._showPoints){
        ctx.fillStyle = "blue";
        points.drawUnSelected("blue",2);
    }
    ctx.fillStyle = "red";
    points.drawSelected("red",2);
    ctx.fillStyle = "black";
    points.massCenter.x /= points.massCenter.count;
    points.massCenter.y /= points.massCenter.count;
    ctx.fillRect(points.massCenter.x - 2, points.massCenter.y - 2, 4, 4);
    ctx.strokeStyle = "red";
    lines.drawSelected("red",2);
    if(selectingLine){
        ctx.strokeStyle = "yellow";
        ctx.fillStyle = "yellow";
        lines.drawHighlighted("yellow",2);
        points.drawHighlighted();
    }
    if(selectedExtent.left !== null && !dragging){
        ctx.lineWidth = invScale;
        ctx.strokeStyle = "blue";
        pix = invScale;
        if(mouse.x >= selectedExtent.left && mouse.x <= selectedExtent.right &&
            mouse.y >= selectedExtent.top && mouse.y <= selectedExtent.bottom ){
            closePoint = undefined;
            closeLine = undefined;
            closeExtent = true;
            cursor = "move";
            ctx.strokeStyle = "cyan";
        }else{
            closeExtent = false;
            ctx.strokeStyle = "blue";
        }
        ctx.strokeRect(
            selectedExtent.left - pix,
            selectedExtent.top - pix,
            selectedExtent.right - selectedExtent.left + pix * 2,
            selectedExtent.bottom - selectedExtent.top + pix * 2
        );
    }else{
        closeExtent = false;
    }
    if(mouse.buttonRaw === 4 && groundMenu.editGround){
        if(!closeGroundPoint){
            if(groundLines.length === 0 || mouse.x > groundLines.items[groundLines.length-1].x){
                groundLines.add(groundLines.create(mouse.x,mouse.y));
                groundLines.fix();
            }else{
                clearSel = true;
                p = groundLines.getPointOnLine({x:mouse.x,y:mouse.y});
                if(p !== undefined && groundLines.indexOfPoint !== undefined){
                    dist = Math.hypot(mouse.x - p.x,mouse.y - p.y);
                    if(dist < 8 * invScale){
                        groundLines.insert(groundLines.create(p.x,p.y), groundLines.indexOfPoint + 1);
                        groundLines.fix();
                        clearSel = false;
                    }
                }
                if(clearSel){
                    groundLines.setAll("selected",false);
                }
            }
            mouse.buttonRaw = 0;
        }
        //groundLines.setAll("selected",false);
    }
    if(mouse.buttonRaw === 4 && !running){
        if(closeExtent){
            meshExtrasMenu.add1.copy();
            mouse.buttonRaw = 1; // convert to left click for drag
            mouseTransform.button.from  = 4;
            mouseTransform.button.to  = 1;
            mouseTransform.on = true;
        }else if(closePoint){
            if(newLine){
                if(closePoint.id !== newLine.p1.id){
                    newLine.p2 = closePoint;
                    newLine.init();
                    lines.add(newLine);
                    newLine = lines.create(newLine.p2,null);
                    newLine.p2 = {x:mouse.x,y:mouse.y};
                    //newLine = undefined;
                    structDirty = true;
                }
            }else{
                newLine = lines.create(closePoint,null);
                newLine.p2 = {x:mouse.x,y:mouse.y};
            }
            mouse.buttonRaw = 0;
        }else{
            if(newLine){
                newLine.p2 = points.add(points.create(mouse.x,mouse.y));
                lines.add(newLine);
                newLine.init();
                if(closeLine){ // splite line if over
                    closeLine.getPointOnLine(newLine.p2);
                    newLine.init();
                    lines.add(lines.create(newLine.p2,closeLine.p2));
                    closeLine.p2 = newLine.p2;
                    closeLine.init();
                }
                newLine = lines.create(newLine.p2,null);
                newLine.p2 = {x:mouse.x,y:mouse.y};
                structDirty = true;
            }else{
                p1 = points.add(points.create(mouse.x,mouse.y));
                if(buildMenu.useMirror){
                    var p2 = points.add(points.create(mouse.x,mouse.y));
                    setMirrorPoint(p1,p2);
                }
                if(closeLine){ // split line if over
                    closeLine.getPointOnLine(p1);
                    wv1.setAs(closeLine.p1);
                    wv3.setAs(closeLine.p2);
                    wv2.setAs(p1);
                    var dist = wv1.distFrom(wv2)/ wv1.distFrom(wv3);
                    p1.radius = (closeLine.p2.radius - closeLine.p1.radius) * dist + closeLine.p1.radius;
                    p1.drag = (closeLine.p2.drag - closeLine.p1.drag) * dist + closeLine.p1.drag;
                    lines.add(lines.create(p1,closeLine.p2));
                    closeLine.p2 = p1;
                    closeLine.init();
                }
                structDirty = true;
            }
            mouse.buttonRaw = 0;
        }
    }
    if(newLine && mouse.buttonRaw === 1 ){ // stop building lines
        newLine = undefined;
        mouse.buttonRaw = 0;
    }
    if(newLine){
        ctx.strokeStyle = "#A00";
        newLine.p2.x = mouse.x;
        newLine.p2.y = mouse.y;
        newLine.draw();
        if(cursor === "move"){
            cursor = "pointer";
        }
    }
    if(mouse.buttonRaw === 1){
        if(dragging && dragType === 5){
            view.movePos((mx - dragBox.mx),(my - dragBox.my));
            view.toWorld(mx,my,mouse);
            dragBox.mx = mx;//mouse.x;
            dragBox.my = my;//mouse.y;
            cursor = "move";
        }else if(dragging && dragType === 3){
            dragBox.mx = mx;
            dragBox.my = my;
            dragBox.x2 = mouse.x;
            dragBox.y2 = mouse.y;
            dragBox.x = Math.min(dragBox.x1,dragBox.x2);
            dragBox.y = Math.min(dragBox.y1,dragBox.y2);
            dragBox.w = Math.max(dragBox.x1,dragBox.x2) - Math.min(dragBox.x1,dragBox.x2);
            dragBox.h = Math.max(dragBox.y1,dragBox.y2) - Math.min(dragBox.y1,dragBox.y2);
            dragCount += 1;
            if(dragCount === 10 && dragBox.w < 2 && dragBox.h < 2){
                dragType = 5;
            }else{
                ctx.lineWidth = 2 * invScale;
                ctx.strokeStyle = "black";
                ctx.strokeRect(dragBox.x,dragBox.y,dragBox.w,dragBox.h);
                ctx.lineWidth = 1 * invScale;
                ctx.strokeStyle = "white";
                ctx.strokeRect(dragBox.x,dragBox.y,dragBox.w,dragBox.h);
                if(lineInterceptSel){
                    ctx.lineWidth = 2 * invScale;
                    ctx.strokeStyle = "black";
                    ctx.beginPath();
                    ctx.moveTo(dragBox.x1,dragBox.y1);
                    ctx.lineTo(dragBox.x2,dragBox.y2);
                    ctx.stroke();
                    ctx.lineWidth = 1 * invScale;
                    ctx.strokeStyle = "white";
                    ctx.stroke();
                }
                if(groundMenu.editGround){
                    groundLines.setAll("selected",false);
                    groundLines.setIf("selected",true,p=>{
                        return p.x > dragBox.x && p.x < dragBox.x + dragBox.w &&
                        p.y > dragBox.y && p.y < dragBox.y + dragBox.h;
                    })
                }else{
                    var countSel = 0;
                    points.setAll("selected",false);
                    lines.setAll("selected",false);
                    points.setIf("selected",true,p=>{
                        var inside = p.x > dragBox.x && p.x < dragBox.x + dragBox.w &&
                        p.y > dragBox.y && p.y < dragBox.y + dragBox.h;
                        if(inside){
                            countSel += 1;
                        }
                        return inside;
                    })
                    if(countSel > 0){
                        lineInterceptSel = false;
                        lines.setIf("selected",true,l=>{
                            return l.p1.selected && l.p2.selected;
                        })
                    }else{
                        lineInterceptSel = true;
                        wl1.p1.x = dragBox.x1;
                        wl1.p1.y = dragBox.y1;
                        wl1.p2.x = dragBox.x2;
                        wl1.p2.y = dragBox.y2;
                        lines.eachItem(l=>{
                            wl2.setEnds(l.p1,l.p2);
                            if(wl1.isLineSegIntercepting(wl2)){
                                l.selected = true;
                            }
                        })
                    }
                }
            }
        }else
        if(!dragging && !closeGroundPoint && !closeLine && !closePoint && !closeExtent && !selectingLine){
            dragging = true;
            dragType = 3;
            dragBox.x1 = mouse.x;
            dragBox.y1 = mouse.y;
            dragBox.w = 0;
            dragBox.h = 0;
            dragCount = 0;
        }else if(groundMenu.editGround){
            if(dragType === 4){
                dx = mouse.x - lastX;
                dy = mouse.y - lastY;
                groundLines.eachItem(p=>{
                    if(p.selected){
                        p.x += dx;
                        p.y += dy;
                    }
                })
            }else if(closeExtent && !dragging){
                    dragItem = null;
                    dragging = true;
                    dragType = 4;
            }else if(closeGroundPoint && !dragging){
                dragItem = closeGroundPoint;
                dragOffX = mouse.x - dragItem.x;
                dragOffY = mouse.y - dragItem.y;
                dragging = true;
                dragType = 2;
            }else if(dragging){
                dragItem.x = mouse.x - dragOffX;
                dragItem.y = mouse.y - dragOffY;
                groundLines.fix();
            }else{
                if(groundLines.length === 0 || mouse.x > groundLines.items[groundLines.length-1].x){
                    groundLines.add(groundLines.create(mouse.x,mouse.y));
                    groundLines.fix();
                }
                mouse.buttonRaw = 0;
            }
        }else{
            if(!dragging){
                if(closeExtent){
                    dragItem = null;
                    dragging = true;
                    dragType = 4;
                }else if(closeLine !== undefined){
                    if(selectingLine){
                        IOMessage = ""
                        lines.eachItem(line=>{
                            if(line.highlight && line.id !== closeLine.id){
                                line.selected = true;
                                if(!line.isLineCyclic(closeLine)){
                                    line.lengthFrom = closeLine;
                                }else{
                                    IOMessage = "Cyclic links rejected."
                                }
                            }
                        });
                        points.eachItem(point=>{
                            if(point.highlight){
                                point.selected = true;
                                if(!point.isLineCyclic(closeLine)){
                                    point.valueFrom = closeLine;
                                }else{
                                    IOMessage = "Cyclic links rejected."
                                }
                            }
                        });
                        if(IOMessage !== ""){
                            IOHappening = true;
                            setTimeout(()=>IOHappening = false,2000)
                        }
                        selectingLine = false;
                        mouse.buttonRaw = 0;
                        structDirty = true;
                    }else{
                        if(closeLine.selected || running){
                            dragItem = closeLine;
                            dragOffX = mouse.x - dragItem.p1.x;
                            dragOffY = mouse.y - dragItem.p1.y;
                            dragging = true;
                            dragType = 1;
                        }else{
                            if(mouse.ctrl && closestArray.length > 1){
                                for(var i = 0; i < closestArray.length; i ++){
                                    closestArray[i].selected = false;
                                }
                            }
                            closeLine.selected = true;
                            mouse.buttonRaw = 0;
                            structDirty = true;
                        }
                    }
                }else if(closePoint !== undefined){
                    if(closePoint.selected || running){
                        dragItem = closePoint;
                        dragOffX = mouse.x - dragItem.x;
                        dragOffY = mouse.y - dragItem.y;
                        dragOffScrX = mx - dragItem.x;
                        dragOffScrY = my - dragItem.y;
                        dragging = true;
                        dragType = 0;
                        dragData.fixed = dragItem.fixed;
                    }else{
                        closePoint.selected = true;
                        mouse.buttonRaw = 0;
                        structDirty = true;
                    }
                    if(buildMenu.useMirror && !running){
                        dragMirror = findMirrorPoint(closePoint);
                    }
                }else{
                    mouse.buttonRaw = 0;
                    if(selectingLine){
                        lines.eachItem(line=>{
                            if(line.highlight){
                                line.lengthFrom = null;
                            }
                        });
                        points.eachItem(point=>{
                            if(point.highlight){
                                point.valueFrom = null;
                            }
                        });
                        selectingLine = false;
                        structDirty = true;
                    }
                    points.setAll("selected",false);
                    lines.setAll("selected",false);
                    dragging = false;
                }
            }else{
                if(dragType === 4){
                    dx = mouse.x - lastX;
                    dy = mouse.y - lastY;
                    points.eachItem(p=>{
                        if(p.selected){
                            p.x += dx;
                            p.y += dy;
                            p.ox = p.x;
                            p.oy = p.y;
                        }
                    })
                    structScruffy = true;
                }else if(dragType === 0){
                    //dragItem.fixed = true;
                    if(dragItem.screenSpace && running){
                        pull.setPos(mx - dragOffScrX,my - dragOffScrY);
                        pull.pull(dragItem);
                        dragItem.setPoint(pull.nx ,pull.ny);
                    }else{
                        if(running){
                            pull.setPos(mouse.x - dragOffX,mouse.y - dragOffY);
                            pull.pull(dragItem);
                            dragItem.movePoint(pull.nx ,pull.ny);
                        }else{
                            dragItem.setPoint(mouse.x - dragOffX,mouse.y - dragOffY);
                            if(buildMenu.useMirror){
                                if(dragMirror !== undefined){
                                    setMirrorPoint(dragItem,dragMirror);
                                }
                            }
                        }
                    }
                    ctx.fillStyle = "white";
                    dragItem.draw();
                    structScruffy = true;
                }else{
                    mx1 = dragItem.p2.x - (dragItem.p1.x - (mouse.x - dragOffX));
                    my1 = dragItem.p2.y - (dragItem.p1.y - (mouse.y - dragOffY));
                    dragItem.p1.setPoint(mouse.x - dragOffX,mouse.y - dragOffY);
                    dragItem.p2.setPoint(mx1,my1);
                    ctx.strokeStyle = "white";
                    dragItem.draw();
                    structScruffy = true;
                }
            }
        }
    }else if(dragging){
        if(dragType === 5){
            dragItem = undefined;
            dragging = false;
        }else if(dragType === 3 || dragType === 4){
            dragItem = undefined;
            dragging = false;
            if(groundMenu.editGround){
                selectedExtent = groundLines.getExtent(selectedExtent,p=>p.selected);
            }else{
                selectedExtent = points.getExtent(selectedExtent,p=>p.selected);
            }
            mouseTransform.on = false;
            structDirty = true;
        }else if(dragType === 2){
            dragItem.x = mouse.x - dragOffX;
            dragItem.y = mouse.y - dragOffY;
            groundLines.fix();
            dragItem.selected = !dragItem.selected;
            dragItem = undefined;
            dragging = false;
        }else if(dragType === 0){
            dragItem.fixed = dragData.fixed;
            if(dragItem.screenSpace && running){
                pull.setPos(mx - dragOffScrX,my - dragOffScrY);
                pull.pull(dragItem);
                dragItem.setPoint(pull.nx ,pull.ny);
            }else{
                if(running){
                    pull.setPos(mouse.x - dragOffX,mouse.y - dragOffY);
                    pull.pull(dragItem);
                    dragItem.movePoint(pull.nx ,pull.ny);
                }else{
                    dragItem.setPoint(mouse.x - dragOffX,mouse.y - dragOffY);
                    if(buildMenu.useMirror){
                        if(dragMirror !== undefined){
                            setMirrorPoint(dragItem,dragMirror);
                        }
                    }
                }
            }
            dragItem.selected = true;
            dragItem = undefined;
            dragMirror = undefined;
            dragging = false;
            structDirty = true;
        }else{
            mx = dragItem.p2.x - (dragItem.p1.x - (mouse.x - dragOffX));
            my = dragItem.p2.y - (dragItem.p1.y - (mouse.y - dragOffY));
            dragItem.p1.setPoint(mouse.x - dragOffX,mouse.y - dragOffY);
            dragItem.p2.setPoint(mx,my);
            dragItem.selected = true;
            dragItem = undefined;
            dragging = false;
            structDirty = true;
        }
    }
    if(closeLine !== undefined && !dragging){// && closeLine.highlight){
        ctx.strokeStyle = "white";
        closeLine.draw("white","2",true);
    }
    if(closePoint !== undefined && !dragging && closePoint.highlight){
        ctx.fillStyle = "white";
        closePoint.draw("white","2",true);
    }
    if(buildMenu.useMirror && !running && dragMirror){
        ctx.fillStyle = "white";
        dragMirror.draw();
        ctx.strokeRect(dragMirror.x - 5,dragMirror.y - 5,10,10)
    }
    lastX = mouse.x;
    lastY = mouse.y;
    mouse.x = mx;
    mouse.y = my;
    outlines.draw();
    imageList.draw();
    if(structScruffy && !structDirty){
        structScruffy = false;
        if(!running){
            if(pointLines !== undefined){
                for(var i = 0; i < pointLines.length; i ++){
                    pointLines[i].init();
                }
            }
        }
    }
    if(structDirty){
        if(!running){
            lines.apply("init");
            points.apply("updatePosPoints");
            pointLines = [...stickHelper.linesOfPoints(p=>p.selected)];
            needsUndo = true;
            undoActionCount += 1;
            if( undoActionCount === actionsPerUndo){
                saveUndo(true);
            }
        }
        outlines.updateSelected();
        updateMenus();
        structDirty = false;
    }
    if(systemMenu.showDataGraph && running){
        ctx.setTransform(1,0,0,1,0,0);
        if(runTime % 3 === 0){
            //ctxG.fillRect(1022,128,2,1)
        }
        ctxG.putImageData(gDataRaw,1023,0);
        updatePlots();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(gCanvas,0,h - 257);
        ctx.globalCompositeOperation = "source-over";
    }
   // debugHelpers.displayStack(canvas.width / 2, 30)
    canvas.style.cursor = cursor;
    messageDisplay();
    if(mouseTransform.on){  // reverse transform so that we can see if the transformed button is up
        if(mouse.buttonRaw === mouseTransform.button.to){
            mouse.buttonRaw = mouseTransform.button.from;
        }
    }
    if(!closeSim){
        requestAnimationFrame(update);
    }else{
        log("done");
    }
}
if(TextData){
    createFromGrooverSVG(TextData);
}else{
    createTestData();
}
function createBuffer(size, growBy = 1024 * 8) {
    const API = {
        buf: new ArrayBuffer(size),
        pos: 0,
        markStack: [],
        posStack: [],
        pushMark() { this.markStack.push(this.pos) },
        popMark() {
            this.posStack.push(this.pos);
            this.pos = this.markStack.pop();
        },
        popPos() { this.pos = this.posStack.pop() },
        vetAlignment(message, alignTo = 4) {
            if (this.pos % alignTo) { throw new RangeError("Write " + message + " alignment error out by " + (this.pos % alignTo) + "bytes"); }
        },
        addBlock(name) {
            API.writeHeaderName(name);
            API.pushMark();
            API.seek(4);
        },
        closeBlock() {
            const p = API.pos;
            API.popMark();
            API.writeInts((p - API.pos) - 4);
            API.popPos();
        },
        downloadBuf(filename) {
            const anchor = document.createElement('a');
            const url = anchor.href = URL.createObjectURL(new Blob([this.buf] ,{type: "application/octet-stream"}));
            anchor.download = filename;
            anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
            setTimeout(() => URL.revokeObjectURL(url) , 1000);
        },
        grow(space) {
            if (this.pos + space >= this.buf.length) {
                const newBuf = new ArrayBuffer(this.buf.length + growBy);
                const nb8 = new Uint8Array(newBuf);
                const b8 = new Uint8Array(this.buf);
                nb8.set(b8);
                this.buf = newBuf;
            }
        },
        close() {
            const len = (((this.pos / 4) | 0)  + 1) * 4;
            const newBuf = new ArrayBuffer(len);
            const nb8 = new Uint8Array(newBuf);
            const b8 = new Uint8Array(this.buf);
            var i = 0;
            while (i < this.pos) { nb8[i] = b8[i++] }
            while (i < len) { nb8[i++] = 0; }
            this.buf = newBuf;
            return len;
        },
        seek(steps) {
            this.grow(steps);
            this.pos += steps;
        },
        writeHeaderName(str) {
            this.vetAlignment("header '" + str + "'");
            this.grow(4);
            const b8 = new Uint8Array(this.buf);
            b8[this.pos++] = str.charCodeAt(0);
            b8[this.pos++] = str.charCodeAt(1);
            b8[this.pos++] = str.charCodeAt(2);
            b8[this.pos++] = str.charCodeAt(3);
        },
        writeRGBAs(...rgbas) {
            this.vetAlignment("color");
            this.grow(rgbas.length * 4);
            const b8 = new Uint8Array(this.buf);
            var i = 0;
            while (i < rgbas.length) {
                const col = rgbas[i++].replace("rgba(", "").replace(")", "").split(",");
                col[3] *= 255;
                col[0] = Number(col[0]);
                col[1] = Number(col[1]);
                col[2] = Number(col[2]);
                b8[this.pos++] = (col[0] < 0 ? 0 : col[0] > 255 ? 255 : col[0]) | 0;
                b8[this.pos++] = (col[1] < 0 ? 0 : col[1] > 255 ? 255 : col[1]) | 0;
                b8[this.pos++] = (col[2] < 0 ? 0 : col[2] > 255 ? 255 : col[2]) | 0;
                b8[this.pos++] = (col[3] < 0 ? 0 : col[3] > 255 ? 255 : col[3]) | 0;
            }
        },
        writeInts(...ints) {
            this.vetAlignment("int");
            this.grow(ints.length * 4);
            const b32 = new Uint32Array(this.buf);
            var i = 0, idx = this.pos / 4 | 0;
            while (i < ints.length) { b32[idx + i] = ints[i++] }
            this.pos += ints.length * 4;
        },
        writeFloats(...floats) {
            this.vetAlignment("float");
            this.grow(floats.length * 4);
            const f32 = new Float32Array(this.buf);
            var i = 0, idx = this.pos / 4 | 0;
            while (i < floats.length) { f32[idx + i] = floats[i++] }
            this.pos += floats.length * 4;
        },
        writeShorts(...shorts) {
            this.vetAlignment("short", 2);
            this.grow(shorts.length * 2);
            const b16 = new Uint16Array(this.buf);
            var i = 0, idx = this.pos / 2 | 0;
            while (i < shorts.length) { b16[idx + i] = shorts[i++] }
            this.pos += shorts.length * 2;
        },
        writeString(str) {
            var len = str.length + 1;
            var tLen = (((len / 4) | 0) + 1) * 4 + 4;
            this.grow(tLen);
            this.writeShorts(tLen - 2, len);
            const b8 = new Uint8Array(this.buf);
            var i = 0, idx = this.pos;
            while (i < len) { b8[idx + i] = str.charCodeAt(i++) }
            b8[idx + i] = 0;
            this.pos += tLen - 4;
        },
        showState(mess) { log("At pos: " + this.pos + " " + mess); }
    };
    return API;
}
function saveStructAsBin(data, name) {
    /*------------------------------*/
    /* WARNING WARNING  WARNING     */
    /*------------------------------*/
    /* Remember buffer alignment is */
    /* 4 bytes. You can not write a */
    /* float at 10, must be 8 or 12 */
    /* etc                          */
    /*------------------------------*/
    /* WARNING WARNING  WARNING     */
    /*------------------------------*/
    const buf = createBuffer(2048 * 8);
    buf.addBlock("Ptns");
    buf.writeInts(data.points.length);
    for (const p of data.points) {
        buf.writeInts(p.id);
        buf.writeInts((p.visible ? 0x100 : 0) | (p.noGround ? 0x80 : 0) | (((p.flag ? p.flag : 0) & 0x1F) << 9));
        buf.writeFloats(p.x, p.y);
        buf.writeFloats(p.radius);
    }
    buf.closeBlock();
    buf.addBlock("Lins");
    buf.writeInts(data.lines.length);
    for (const l of data.lines) {
        var type = l.type ?? 0;
        type |= (l.visible ?? true) ? 0x100 : 0;
        type |= (((l.flag ? l.flag : 0) & 0x1F) << 9);
        buf.writeInts(type);
        buf.writeRGBAs(l.color ?? "rgba(255,0,0,1.0)");
        buf.writeInts(l.p1, l.p2);
        buf.writeFloats(l.length);
        buf.writeFloats(l.dampA ?? 0, l.dampB ?? 0);
        // reserved . Remove from reserved when adding data above.
        buf.writeInts(0,0,0,0,0,0,0,0);  // 8 ints 32 bytes
    }
    buf.closeBlock();
    const fileSize = buf.close();
    buf.downloadBuf(name + ".bin");
}
requestAnimationFrame(update);
