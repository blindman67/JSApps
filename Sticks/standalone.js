var TextData;
var running = false;
var autoRun = true;
var loadingModel = false;
var loaded = false;
var wavePhaseStepIn = 0;
var wavePhaseEase = 0;
var oldW = canvas.width;
var oldH = canvas.height;
canvas.style.position = "absolute"
canvas.style.top = "0px"
canvas.style.left = "0px"
canvas.style.background = "rgba(0,0,0,0)"
canvas.width = innerWidth
canvas.height = innerHeight
canvas.style.zIndex = 1000;
canvas.style.border = "none";
var selectingLine = false;
var runTime = 0;
var lastRun = Infinity;
var currentRun = 0;
var w = canvas.width;
var h = canvas.height;
var cw = w / 2; 
var ch = h / 2;
var globalTime;  
var scale = 1;
var invScale = 1;
var cursor;
ctx.font = "16px arial";
ctx.lineJoin = "round";
ctx.lineCap = "round";
var frameTime = 0;
var lineInterceptSel = false;
var id = 0;
var linesShadow = [];
var pointsShadow = [];
var pointsBase = [];
var itterationDepth = 0;
const pointsUtil = {}
const lineTypes = {line : 0, dampener : 1, thruster : 2, wave : 3,}
const fromTypes = {length : 0, angle : 1, thruster : 2, speed : 3,  deltaA : 4,  as : 5, }
const pointTypes = { normal : 0, lineFixed : 1, attchedToLine : 1, circleMove : 2,}
const imagePosTypes = { center : 0, start : 1, end : 2, stretch : 3,}
const CONST = {  wheelSpeedScale : 50}
const wavePhaseStepInFrames = 20;
const COLS = {  // col for colour, w for line width, sel prefix for selected, e prefix for extra
    markings : { col :  "black", w : 0.5, selCol : "white", selW : 0.75, },
    damper : { col : "#A50", w : 3, eCol : "#D70", eW : 4, e1Col : "#07D", e1W : 4, },
    dir : { col : "Black", w : 0.5, },
    freePoint :{ col : "Blue", w : 1, },
    noBreak:{ col : "#888", w : 1, },
    noGround : { col : "#A60", w : 1, },
    fixedPoint : { col : "#800", w : 1, },
    attachedPoint: { col : "#0AA", w : 0.5, },
    thruster: { col : "#FA0", w : 4, selCol : "#FF0", selW : 2, },
    wave : { col : "#00F", w : 3, eCol : "#0FF", eW : 3, markCol : "black", markW : 0.5, },
    circleMove : { col : "Black", w : 1, },
}
function sCurve(x) {return (2 / (1 + Math.pow(5,-x))) -1}
function sCurveP(x, p) { return (2 / (1 + Math.pow(p,-x))) -1;}
function eCurve(x, p) {
    x = x < 0 ? 0 : x > 1 ? 1 : x;
	const xx = Math.pow(x, p);
	return xx / (xx + Math.pow(1 - x, p));
}
const forces = { AIR_FRICTION : 0.99, GRAVITY : 0.1, SURFACE_FRICTION : 0.5, WHEEL_FRICTION : 0.99, MIN_WHEEL_SIZE : 5 };
const listTypes = {  normal : 0,selected :1, highlighted :2 }
const stressColors = [];
(function(){
    for(var i = 0; i < 360; i++){
        var rgb = mMath.lshToRGB(128,255,(i/360)*200);
        stressColors.push(0xFF000000 + (rgb[0]<<16) + (rgb[1]<<8) + rgb[2]);
        var c = "#" + ((0x1000000 + (rgb[0]<<16) + (rgb[1]<<8) + rgb[2]).toString(16).substr(1));
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
const getStressCol = function(value){
    var c1 = Math.floor(180 + value * 120);
    c1 = c1 < 0 ? 0 : c1 > 359 ? 359 : c1;
    return stressColors[(c1<<1) + 1]; //`hsl(${c1},100%,50%)`;
}
var images = {
    items : {},
    load(name){
        var img = new Image;
        img.src = "images/"+name+".png";
        images.items[name] = img;
    }
}
function load(filename){
	loadingModel = true;
    jsonReadWriter.load(filename, function(shadowed){
        if(shadowed.info === "Sticks structure object"){
            imageListFromShadow(shadowed.images);
            structureFromShadow(shadowed.points,shadowed.lines);
        }else{  sceneFromJson(shadowed)}
        id = findSafeId();
		setTimeout(()=>{loadingModel = false; loaded =true }, 1000);
    });
}
function undefinedError (name) { throw new ReferenceError(`list.${name} bad argument 'undefined'`)}
function removeDefaults(item,defaultItem){
    Object.keys(item).forEach(key=>{
        if(item[key] !== null && typeof item[key] === "object" && defaultItem[key] !== null && typeof defaultItem[key] === "object" ){ removeDefaults(item[key],defaultItem[key]) }
        else if(item[key] !== undefined && (item[key] === defaultItem[key] ||  defaultItem[key] === undefined || (defaultItem.excludeFromShadow && defaultItem.excludeFromShadow.keys.indexOf(key) > -1) )){ item[key] = undefined }
    })
    return item;
}
function restoreDefaults(item,defaultItem){
    Object.keys(defaultItem).forEach(key=>{
        if(key !== "excludeFromShadow"){
            if(item[key] !== null && typeof item[key] === "object" && defaultItem[key] !== null && typeof defaultItem[key] === "object" ){  restoreDefaults(item[key],defaultItem[key]) }
            else if(item[key] === undefined && defaultItem[key] !== undefined){ item[key] = defaultItem[key] }
        }
    })
    if(defaultItem.excludeFromShadow && typeof defaultItem.excludeFromShadow.restore === "function"){  defaultItem.excludeFromShadow.restore(item) }
    return item;
}
var util = {
    toString(){
        return Object.keys(this).reduce((a,key,i)=>{
            return typeof this[key] !== "function" && key !== "name" ?
                `${a}${a === ""? this.name+" : {" : ", "} ${key}:${this[key]}` :
                a;
        },"") + "}";
    }
}
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
                if (this[key] && typeof this[key].shadow === "function") {  shadow[key] = this[key].shadow() }
                else{
                    if(Array.isArray(this[key])){
                        shadow[key] = [];
                        this[key].forEach(item=>{
                            if(item && typeof item.shadow === "function"){ shadow[key].push(item.shadow()) }
                            else{ shadow[key].push(item) }
                        })
                    } else { shadow[key] = this[key] }
                }
            }
        })
        itterationDepth -= 1;
        return shadow;
    },
    fromShadow(shadow){
        Object.keys(this).forEach(key=>{  if(typeof this[key] !== "function"){  this[key] = shadow[key] }});
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
    setIf (name,value,callback){ this.count = 0; this.eachItem((item,i)=>{ if(callback(item,i) === true){ item[name] = value; this.count += 1 } }) },
	ifAny (callback){  var result = false;this.eachItem((item,i)=>{if(callback(item,i) === true) { return result = true }}); return result; },
    apply (name, argumentArray = []) { this.eachItem(item=>{ if(typeof item[name] === "function" ){ item[name](...argumentArray) } }) },
    applyQuick (name) { var len = this.items.length;  for (var i = 0; i < len; i ++ ){ this.items[i][name]() } },
    getById (id) { for(var i = 0; i < this.items.length; i += 1 ){ if (this.items[i].id === id) { this.lastIndex = i; return this.items[i] } } },
    getIf(callback,start = 0){ for(var i = start; i < this.items.length; i += 1 ){  if (callback(this.items[i],i) === true) { return this.items[i] } } },
    defineDefault(item){ this.defaultItem = Object.assign(item,listItem) },
    drawSelected (...args){ for (var i = 0; i < this.items.length; i += 1) { if(this.items[i].selected) { this.items[i].draw(...args) } } },
    drawUnSelected (...args){ for (var i = 0; i < this.items.length; i += 1) { if(!this.items[i].selected) { this.items[i].draw(...args) } } },
    drawNormal (...args){ for(var i = 0; i < this.items.length; i += 1){ if(!(this.items[i].selected || this.items[i].highlight)) { this.items[i].draw(...args) }} },
    drawHighlighted (...args){ for (var i = 0; i < this.items.length; i += 1) { if(this.items[i].highlight) { this.items[i].draw(...args) } } },
    draw (...args) { this.eachItem(item => item.draw(...args)) },
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
        return index < 0 ? undefined : this.items[index];
    },
}
var lists = (function () { return function (name) { return Object.assign({}, list, {items : [], name, length : 0}) } }());
const objectStack = {
    items : [],
    length : 0,
    eachItem(callback) { for(var i = 0; i < this.length; i++){  if(callback(this.items[i],i) === true){ break } } },
    push(item) {
        if(this.length < this.items.length) { this.items[this.length++] = item }
        else{ this.items.push(item); this.length = this.items.length }
    },
    pop() { if(this.length > 0){ return this.items[this.length --] }},
    empty() {  this.length = 0 },
    clear(){ this.items.length = 0; this.empty() },
}
function createObjectStack(){ return Object.assign({},objectStack,{items : []}) }
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
    dampA : 0,  
    dampB : 0,
    dampC : 0,
    dampD : 0,
    dampAStart : 0,
    dampBStart : 0,
    dLen : 0,
    waveFrequency : 0,
    waveFrequencyCurrent : 0,
    waveAmplitude : 0,
    waveAmplitudeFraction : 1,
    waveTime : 0,
    wavePhase : 0,
    waveMultiply : 0,
    waveCustom : false,
    image : null,
    thrustCurrent : 0,
    thrust : 0,
    stress : 0,
    stressCounter : 0,
    wear : 0,
    lengthCurrent :0,
    draw (col,lw,forceStyle = false) {
        var l=this, s, i, x, len, y, nx, ny, lf, x1, y1, len1,iScale,wid1,extentShown;
        if(l.type === lineTypes.wave){if(!forceStyle){ col = COLS.wave.col; lw = COLS.wave.w; } }
        else if(l.type === lineTypes.thruster){ if(!forceStyle){ col = COLS.thruster.col; lw = COLS.thruster.w; } }
        else if(l.type === lineTypes.dampener){if(!forceStyle){ col = COLS.damper.col; lw = COLS.damper.w; } }
        
        if(l.noBreak){ lw *= 2 }
        if(l.visible || mainMenu.showStress){
            ctx.strokeStyle = col;
            ctx.lineWidth = lw*invScale;
			if(l.screenSpace){
				ctx.setTransform(1,0,0,1,0,0);
				wid1 = ctx.lineWidth;
				ctx.lineWidth = wid1 / invScale;
				invScale = 1;
			}else if(mainMenu.showStress){
				ctx.strokeStyle = getStressCol(l.stress/(mainMenu.snapStrength * l.wear));
			} else {
				if(l.color){ ctx.strokeStyle = l.color }
				if(l.lineWidth){ ctx.lineWidth = l.lineWidth * (invScale / 2) }
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
				ctx.lineTo( (l.p1.x + l.p2.x) / 2 + nx * l.thrustCurrent * r, (l.p1.y + l.p2.y) / 2 + ny * l.thrustCurrent * r );
				ctx.lineTo(l.p2.x,l.p2.y);
				ctx.stroke();
			}
			if(l.screenSpace){
				view.apply(ctx);
				invScale = view.getInvScale();
				ctx.lineWidth = wid1;
			}
            ctx.globalAlpha = 1;
        }
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
        if(this.fixedPoints === null){ this.fixedPoints = [p1]; }
		else{ this.fixedPoints.push(p1); }
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
        lx = l.p2.x - l.p1.x;
        ly = l.p2.y - l.p1.y;
        l.lengthCurrent =  Math.sqrt(lx*lx + ly*ly);
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
});
var lines = Object.assign({
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
    constrainLength(pass){
        var i, l, len, oLen,lx, ly,zeroDamp, waveM,w1,x,y,x1,y1, balance, fraction, fx, fy,fVal,fValNorm, fAng,fAngNorm, bypassFixed2;
        const updateLengthFrom = (calcOLen,oLenShadow) => {
            if (l.type === lineTypes.thruster) {
                if (l.thrust === 0) { l.thrustCurrent = sCurve(fValNorm - 1) }
                else { l.thrustCurrent = fValNorm * l.thrust }
            }else if (l.type === lineTypes.wave) {
                if (l.waveFrequency === 0) {
                    if (calcOLen) { l.waveFrequencyCurrent = fValNorm}
                    else { l.waveFrequencyCurrent = sCurve((fValNorm - 1) * (fValNorm - 1)) }
                }else { l.waveAmplitude = fVal }
            }else if (l.type === lineTypes.dampener) {
                if(dB === 0){
                    dA = l.dampA * fValNorm;
                }else if(dA === 0){
                    var tl;
                    if (calcOLen) { tl = l.startLength  * (1 + (l.tension * fValNorm)) }
                    else { tl = l.startLength  * (1 + (l.tension * sCurve(fValNorm - 1))) }
                    l.length = l.lengthCurrent = tl < 1 ? 1 : tl;
                }
            }else{
                l.length = fVal;
                if(l.p1.fixed && l.p2.fixed){
                    if(calcOLen){
                        if(oLenShadow !== undefined){
                            fx = l.p2.startX - l.p1.startX;
                            fy = l.p2.startY - l.p1.startY;
                            oLen = Math.sqrt(fx*fx + fy*fy);
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
            if(pass === 0 && l.type === lineTypes.dampener && dA * dB === 0){ 
                if(dA){
                    l.length  = len < 1 ? 1 : len;
                    l.dLen = len * (1 + l.tension);
                    l.dLen = l.dLen < 1 ? 1 : l.dLen;
                }else{
                    var tl = l.startLength  * (1 + l.tension);
                    l.length  = tl < 1 ? 1 : tl;
                }
                zeroDamp = true;
            }else {  zeroDamp = false }
            w1 = Math.min(forces.MIN_WHEEL_SIZE+1,l.p1.radius+1);
            balance = w1 / (w1 + Math.min(forces.MIN_WHEEL_SIZE+1,l.p2.radius+1));
            var d1 = 1 - l.p1.surfaceFriction;
            var d2 = 1 - l.p2.surfaceFriction;
            if(l.type === lineTypes.wave ){
                if(pass === 0){
                    if(l.waveMultiply < 0){  waveM = 1 / l.waveMultiply }
                    else{  waveM = l.waveMultiply > 0 ? l.waveMultiply : 1 }
                    l.waveTime += ((l.waveFrequencyCurrent * 100) / CONST.wheelSpeedScale) *waveM;
                    var tt = 1 + tension * (l.waveAmplitudeFraction / 2);
                    if(l.waveCustom && customWave.ready){
                        if(wavePhaseEase < 1){
                            l.length = (tt + customWave.getAt(l.waveTime + l.wavePhase) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                            l.length = wavePhaseEase * l.length + (1 - wavePhaseEase) * l.waveAmplitude;
                        }else{ l.length = (tt +customWave.getAt(l.waveTime + l.wavePhase) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude ) }
                    }else{
                        if(wavePhaseEase < 1){
                            l.length = (tt + Math.sin(l.waveTime + (l.wavePhase * Math.PI * 2)) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude );
                            l.length = wavePhaseEase * l.length + (1 - wavePhaseEase) * l.waveAmplitude;
                        }else{  l.length = (tt + Math.sin(l.waveTime + (l.wavePhase * Math.PI * 2)) * l.waveAmplitudeFraction*0.5) * (l.waveAmplitude ) }
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
                        fVal = l.lengthFrom.lengthCurrent;
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
                    if(l.isAttachedLine){  oLen = l.lengthCurrent}
                    else{ var oLen = l.startLength }
                    fVal = sCurveP(fVal,1.02);
                    fValNorm = (fVal *dir);
                    fVal = oLen + (fVal*(oLen/1)) * dir; 
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
                    updateLengthFrom(false); 
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
                    if(l.type === lineTypes.wave){ bypassFixed2 = true }
                }
                if(l.p2.fixed){
                    if(!l.p1.fixed){ l.p1.x -= lx * d1; l.p1.y -= ly * d1;}
                    else if(bypassFixed2){ l.p2.x += lx * d2; l.p2.y += ly * d2; }
                }else if(l.p1.fixed){
                    if(!l.p2.fixed){ l.p2.x += lx * d2; l.p2.y += ly * d2; }
                }else{
                    l.p1.x -= lx * (1-balance) * d1;
                    l.p1.y -= ly * (1-balance) * d1;
                    l.p2.x += lx * balance * d2;
                    l.p2.y += ly * balance * d2;
                }
                if(l.type === lineTypes.thruster && pass === 0){
                    var nx = -(l.p2.y - l.p1.y) / 100; 
                    var ny = (l.p2.x - l.p1.x) / 100; 
                    var t = l.thrustCurrent;
                    l.p1.ox += nx * t;
                    l.p1.oy += ny * t;
                    l.p2.ox += nx * t;
                    l.p2.oy += ny * t;
                }
            }
        }
    },
}, lists("Lines"));
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
    surfaceFriction : 0,
    noGround : false,
    surface : false,
    angle : 0,
    oAngle : 0,
    drag : 1,
    power : 0,
    powerPos : 0,
    startAngle : 0,
    fixed : false,
    fixX : null,
    fixY : null,
    visible : true,
    viewable : true,
    image : null,
    name : "Point",
    draw (col,lw,forceStyle = false) {
        var wid1,r;
        if(this.visible){
			if(this.screenSpace){
				ctx.setTransform(1,0,0,1,0,0);
				wid1 = ctx.lineWidth;
				ctx.lineWidth = wid1 / invScale;
				invScale = 1;
			}
            if(this.color){ col = this.color; }
            ctx.fillStyle = col;
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            if(this.type === pointTypes.attchedToLine){
                if(!forceStyle){  ctx.fillStyle =  COLS.attachedPoint.col }
                r = this.radius + 0.2
                ctx.fillRect(this.x-r, this.y-r, r * 2,r * 2);
            } else if(this.type === pointTypes.circleMove){
                if(!forceStyle){ ctx.strokeStyle = COLS.circleMove.col; ctx.lineWidth = COLS.circleMove.w }
                ctx.fillRect(this.x-3,this.y-3, 6,6);
            }else{
                if(this.radius > forces.MIN_WHEEL_SIZE){
                    ctx.beginPath();
                    var pp = Math.abs(this.power / this.wheeSpeed);
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(this.angle) * this.radius, this.y + Math.sin(this.angle) * this.radius);
                    ctx.stroke();
                }
                var ss = ctx.strokeStyle;
                if(this.fixed){
                    if(!forceStyle){ ctx.strokeStyle = COLS.fixedPoint.col; ctx.lineWidth = COLS.fixedPoint.w;; }
                    ctx.strokeRect(this.x - (this.radius + 1), this.y - (this.radius + 1), this.radius * 2 + 2, this.radius * 2 + 2);
                    ctx.strokeStyle = ss;
                } else if(this.noGround){
                    if(!forceStyle){ ctx.strokeStyle = COLS.noGround.col; ctx.lineWidth = COLS.noGround.w }
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
            }
            ctx.globalAlpha = 1;
            if(running && this.screenSpace){
                view.apply(ctx);
                invScale = view.getInvScale();
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
        if(this.type === pointTypes.circleMove){ this.startX = this.x = x; this.startY = this.y = y }
        else{ this.x = x; this.y = y }
    },
    updatePosPoints(){
        p = this;
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
    update(){ },  // required stub
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
                                surfaceFriction = 0;
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
        if(!this.meanPos){  this.meanPos = {x:0,y:0,c:0,minx:0,lastStartLine : 0} }
        this.meanPos.x = 0;
        this.meanPos.y = 0;
        this.meanPos.c = 0;
        this.meanPos.minx = Infinity;
        pointStack.empty();
        for(var i = 0; i < this.items.length; i ++){
            var p = this.items[i];
			if(p.radius > forces.MIN_WHEEL_SIZE && p.wheelSpeed !== null){
				if (p.valueFrom) { p.wheelTurn = p.wheelSpeed * ((p.valueFrom.lengthCurrent - p.valueFrom.startLength) / p.valueFrom.startLength) }
				else { p.wheelTurn = p.wheelSpeed }
			}
            if(!p.fixed){
                var vx = (p.x - p.ox) * forces.AIR_FRICTION; 
                var vy = (p.y - p.oy) * forces.AIR_FRICTION; 
                var speed = Math.sqrt(vx * vx + vy * vy);
                if(p.drag < 1){
                    var d = 1 - (((2 / (1 + Math.pow(1.2, -speed))) - 1) * (1 - p.drag));
                    vx *= d;
                    vy *= d;
                }
                if(p.radius > forces.MIN_WHEEL_SIZE){
                    if(isNaN(p.angle)){  p.angle = 0; p.oAngle = 0;  p.power = 0;  p.powerPos = 0;}
                    if(p.wheelTurn !== null){
                        if(p.pC === undefined){ p.pC = 0;  p.pR = 0 }
                        p.power += ((p.wheelTurn / p.radius) - p.pR) / 8;
                        p.pC += (p.power - p.pR) * 0.45;
                        p.pC *= 0.45;
                        p.pR += p.pC;
                        p.power *= 0.95;
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
                if(p.posPoints !== null){ pointStack.push(p) }
            }
        }
        if(this.meanPos.c > 0){ this.meanPos.x /= this.meanPos.c; this.meanPos.y /= this.meanPos.c; }
    },
    constrainToLine(line,changeVelocity,transferForce = false){
        var vx,vy,startLine,foundLine,r,i,l,l1,snx,sny,nvx,nxy,len,touching,lenV,move,rx,ry,sx,sy,lpx,lpy,l1px,l1py,ox,oy,px,py,c,plen,pnx,pny,lLen,hx,hy,lenR,nrx,nry,c,c1,nd,b;
        if(line.items.length === 0) { return }
        if(this.meanPos.minx > line.items[line.items.length - 1].x){ return }
        startLine = 0;
        if(this.meanPos.lastStartLine < this.items.length && this.meanPos.minx > line.items[this.meanPos.lastStartLine].x){ startLine = this.meanPos.lastStartLine; }
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
                            lenR = (vx * l.nx + vy * l.ny) * 2; 
                            rx = l.nx * lenR -vx; 
                            ry = l.ny * lenR -vy;
                            len = Math.sqrt(rx * rx + ry * ry);
                            nrx = rx / len; 
                            nry = ry / len;
                            var b = (l.nx * nvy - l.ny * nvx) * lenV; 
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
                                    sx = snx * b; 
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
                                    sx = snx * b; 
                                    sy = sny * b;
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
}, lists("points"));
const pointStack = createObjectStack();
var ground = Object.assign( {}, util, { x : 0, y : 0, nx : 0, ny : 0, vx : 0, vy : 0, dist : 0, name : "groundLine",
    distFrom(x,y){ x = this.x - x; y = this.y - y; return Math.sqrt(x * x + y * y); },
    draw(){ ctx.beginPath(); ctx.arc(this.x, this.y, 4 * invScale, 0, Math.PI * 2); ctx.fill(); },
});
var groundLines = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){ this.defineDefault(Object.assign({}, {x:0,y:0})); }
        return this.defaultItem;
    },
    getPointOnLine(p){
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
    create (x,y) { return Object.assign({}, ground, {x,y}); },
    fix (){
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
            for(i = 1; i < this.items.length; i ++){ ctx.lineTo(this.items[i].x,this.items[i].y); }
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
            lines.items.sort((a,b)=>{ return a.x - b.x })
            lines.fix();
        }
    }
});
var surface = Object.assign( {}, util, { x : 0, y : 0, nx : 0, ny : 0, vx : 0, vy : 0, dist : 0, point : null, name : "surfacePoint",
    distFrom(x,y){ x = this.x - x; y = this.y - y; return Math.sqrt(x * x + y * y); },
    draw(){ ctx.beginPath(); ctx.arc(this.x, this.y, 4 * invScale, 0, Math.PI * 2); ctx.fill(); },
});
var surfaceLines = Object.assign({
    getDefaultItem (){
        if(this.defaultItem === undefined){
            this.defineDefault(Object.assign({}, {x:0,y:0}));
        }
        return this.defaultItem;
    },
    getPointOnLine(p){
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
    create (point) { point.surface = true; return Object.assign({}, surface, {point}); },
    sort(){ this.items.sort((a,b)=>a.point.x - b.point.x); },
    fix (){
        if(this.items.length === 0 ){ return; }
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
        // get the join lines for each line todo should only have one join not two (j1 & j2))
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
            for(i = 1; i < this.items.length; i ++){ ctx.lineTo(this.items[i].x,this.items[i].y); }
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
        }else{ this.lineColour = null; }
        if(this.fillRGBA[3] > 0)  {
            this.fillColour = "rgba(";
            this.fillColour += this.fillRGBA[0] + ",";
            this.fillColour += this.fillRGBA[1] + ",";
            this.fillColour += this.fillRGBA[2] + ",";
            this.fillColour += (this.fillRGBA[3]/255) + ")";
        }else{ this.fillColour = null; }
    },
    draw(){
        if(this.points.length > 0){
            ctx.beginPath();
            ctx.moveTo(this.points[0].x,this.points[0].y);
            for(var i = 1; i < this.points.length; i ++){ ctx.lineTo(this.points[i].x,this.points[i].y);  }
            if(this.fillColour){  ctx.fillStyle = this.fillColour; ctx.fill() }
            if(this.lineColour){ ctx.lineWidth = this.lineWidth; ctx.strokeStyle = this.lineColour; ctx.stroke(); }
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
        var firstLine,nextLine,nextPoint,firstPoint,outlining;
        var outL = Object.assign({},outline);
        outL.points = [];
        outL.lineRGBA = [outlineMenu.lineR,outlineMenu.lineG,outlineMenu.lineB,outlineMenu.lineA];
        outL.fillRGBA = [outlineMenu.fillR,outlineMenu.fillG,outlineMenu.fillB,outlineMenu.fillA];
        outL.zIndex = zIndex;
        lines.eachSelected(line => {
            firstLine = line;
            return true; 
        })
        nextLine = firstLine;
        firstPoint = nextLine.p1;
        nextPoint = nextLine.p2;
        if(nextLine){
            outlining = true;
            outL.points.push(firstPoint);
            while(outlining){
                outL.points.push(nextPoint);
                nextLine.selected = false;
                outlining = false;
                if(nextPoint.id !== firstPoint.id){
                    lines.eachSelected(line => {
                        if(nextPoint.id === line.p1.id){
                            nextLine = line;
                            nextPoint = nextLine.p2;
                            outlining = true;
                            return true;
                        }
                        if(nextPoint.id === line.p2.id){
                            nextLine = line;
                            nextPoint = nextLine.p1;
                            outlining = true;
                            return true;
                        }
                    });
                }
            }
        }
        outL.update();
        return outL;
    },
    sort(){  this.items.sort((a,b)=>a.zIndex - b.zIndex) },
},lists("outlines"));
var image = Object.assign({},util,{ line : null, point : null, image : null, zIndex : 0, scale : 1, posType : imagePosTypes.center,
    draw(){
        var cx,cy;
        var i = this;
        var img = images.items[i.image]; // get by name
        if(img.complete){
            ctx.save();
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
    create(img,line = null,point = null,zIndex = 0){ return Object.assign({}, image, {image : img,line,point,zIndex}); },
    sort(){ this.items.sort((a,b)=>a.zIndex - b.zIndex); }
},lists("images"));
var customWave = { 
	points : [], ready : false,
    reset(){ this.ready = false; this.points.length = 0; },
    addPoint(x,y){ this.points.push({x,y}); this.ready = false },
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
        this.points.forEach(p=>{ p.y = ((p.y - miny) / (maxy-miny)) * 2 - 1 ; });
        this.ready = true;
    },
    getAt(t){
        var y;
        if(this.ready === false && this.points.length > 1){ this.activate(); }
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
function findSafeId(){
    var id = 0;
    function getId(item){ if(item.id > id){ id = item.id + 1 } }
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
        if(p.valueFrom){ p._valueFrom = p.valueFrom; p.valueFrom = p.valueFrom.id; }
        if(p.posPoints !== null){ p._posPoints = p.posPoints; p.posPoints = p.posPoints.map(pp => pp.id); }
    })
    arr = points.shadow(arr);
    points.eachItem(p=>{
        if(p._valueFrom){ p.valueFrom = p._valueFrom; p._valueFrom = undefined; }
        if(p.posPoints !== null){ p.posPoints = p._posPoints; p._posPoints = undefined; }
    })
    return arr;
}
function shadowStructure(linesShadow){ // creates a simple copy of the structure
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
    pointsShadow.forEach(point=>{ var p = points.add(points.create(point.x,point.y)).fromShadow(restoreDefaults(point,points.getDefaultItem())); });
    linesShadow.forEach(line=>{
        var op1,op2,lid;
        var l = lines.add(lines.create(null,null)).fromShadow(restoreDefaults(line,lines.getDefaultItem()));
        var img = imageList.getById(line.id);
        if(img !== undefined){ img.id = l.id; img.line = l; }
        var p1 = l.p1;
        var p2 = l.p2;
        l.p1 = points.getById(l.p1);
        l.p2 = points.getById(l.p2);
        var img = imageList.getById(l.p1.id);
        if(img !== undefined){ img.point = l.p1; }
        var img = imageList.getById(l.p2.id);
        if(img !== undefined){ img.point = l.p2; }
        if(Array.isArray(l.fixedPoints)){
            var fixedPoints = [...l.fixedPoints];
            l.fixedPoints.length = 0;
            fixedPoints.forEach((p,i)=>{
                pp = points.getById(p);
                if(pp !== undefined){
                    l.attachPoint(pp);
                    var img = imageList.getById(p);
                    if(img !== undefined){ img.point = l.fixedPoints[i]; }
                }
            })
        }
        return;
    })
    lines.eachItem(line=>{ if(line.lengthFrom !== null){ line.lengthFrom = lines.getById(line.lengthFrom); } });
    points.eachItem(point=>{
        if(point.valueFrom !== null){ point.valueFrom = lines.getById(point.valueFrom); }
        if(point.posPoints !== null){ for(var i = 0; i < point.posPoints.length; i ++){ point.posPoints[i] = points.getById(point.posPoints[i]); } }
    })
    outlines.eachItem(o => { for(var i = 0; i < o.points.length; i ++){ o.points[i] = points.getById(o.points[i].id); } });
    outlines.sort();
    surfaceLines.eachItem(p=>{ p.point = points.getById(p.point.id); });
    surfaceLines.sort();
    surfaceLines.fix();
}
function imageListFromShadow(shadow){
    imageList.empty();
    shadow.forEach(img=>{ imageList.add(imageList.create(null)).fromShadow(restoreDefaults(img,imageList.getDefaultItem())) });
}
var box = Object.assign({},util,{ top : 0, left : 0, right : 0, bottom : 4, name : "Box",
    draw () { ctx.strokeRect(this.left, this.top, this.right - this.left, this.bottom - this.top) },
});
var boxes = Object.assign({},{
    getDefaultItem (){
        if(this.defaultItem === undefined){ this.defineDefault(Object.assign({}, box)); }
        return this.defaultItem;
    },
    create (left, top, right, bottom) { return Object.assign({}, box, { left, top, right, bottom, }); },
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
        p2.viewable = p1.viewable = p2.visible = p1.visible = false;
        line.visible = true;
        var l2 = lines.add(lines.create(line.p2, p2))
        line.p2 = p1;
        if (breakPoint < 0.4){ l2.startLength = l2.length = len * compressed * breakPoint- p2.radius}
        else { l2.startLength = l2.length = len * compressed * (1-breakPoint)- p2.radius }
        if(mainMenu.noShrapnel){ l2.tension = line.tension = 0}
		else{ l2.tension = line.tension /= 2 }
        line.startLength = line.length = len * compressed * breakPoint- p2.radius;
        l2.color = line.color;
        l2.lineWidth = line.lineWidth;
        p1.x -= (x / len) * p1.radius;
        p1.y -= (y / len) * p1.radius;
        p2.x += (x / len) * p2.radius;
        p2.y += (y / len) * p2.radius;
        p1.radius = 1 + Math.random();
        p2.radius = 1 + Math.random();
        p1.ox -= ox;
        p1.oy -= oy;
        p2.ox -= ox;
        p2.oy -= oy;
        if(breakPoint < 0.4 && ! mainMenu.noShrapnel){
            var p1 = points.add(points.create(cx, cy));
            var p2 = points.add(points.create(cx1, cy1));
            p1.viewable = p2.viewable = p2.visible = p1.visible = false;
            p2.radius = p1.radius = 1;
            var l2 = lines.add(lines.create(p1, p2))
            l2.startLength = l2.length *= 0.9;
            l2.color = line.color;
            l2.lineWidth = line.lineWidth;
            l2.viewable = false;
            var dr  = Math.sign(Math.random()-0.5);
            p1.ox -= ox * dr;
            p1.oy -= oy * dr;
            dr  = Math.sign(Math.random()-0.5);
            p2.ox -= ox * dr;
            p2.oy -= oy * dr;
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
        p1.viewable = p1.visible = false;
        var l2 = lines.add(lines.create(line.p2,p1))
        line.p2 = p1;
        l2.length = len * compressed * (1-bendPoint);
        line.length = len * compressed * bendPoint;
        l2.color = line.color;
        l2.lineWidth = line.lineWidth;
        l2.visible = line.visible = true;
        if(mainMenu.noShrapnel){l2.tension = line.tension = 0}
        else { l2.tension = line.tension /= 2 }
        p1.ox -= ox;
        p1.oy -= oy;
        p1.radius = 1 + Math.random();
    }
}
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
    return JSON.stringify({
        stiffness:      mainMenu.stiffness,
        airFriction:    mainMenu.airFriction,
        surfaceFriction:mainMenu.surfaceFriction,
        wheelTraction:  mainMenu.wheelTraction,
        gravity:        mainMenu.gravity,
        showStress :    mainMenu.showStress ,
        breakable :     mainMenu.breakable ,
        snapStrength :  mainMenu.snapStrength ,
        points : shadowPoints([]),
        lines : shadowStructure([]),
        ground : groundLines.shadow([]),
        images : imageList.shadow([]),
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
    if(dat.images === undefined){ imageList.empty() }else{imageListFromShadow(dat.images) }
    structureFromShadow(dat.points,dat.lines);
    groundLines.empty();
    dat.ground.forEach(p=>{ groundLines.add(groundLines.create(0,0)).fromShadow(  restoreDefaults(p,groundLines.getDefaultItem()) ); });
    groundLines.fix();
	mainMenu.update();
}
function startSim(){
	running = true;
	wavePhaseStepIn = 0;
	wavePhaseEase = 0;
	points.apply("updatePosPoints");
	points.apply("remember");
	lines.apply("init");	
    points.apply("revert");	
	points.setIf("viewable",true,p=>!p.screenSpace);
}
function updateSim(){
	if(!running){
		if(autoRun && loaded){ startSim() }
		else { return }
	}
	var i;
	for(var k = 0; k < mainMenu.simSteps; k++){
		points.move();
		lines.updateStart(true,true);
		pointStack.eachItem(p=>{p.updatePosPoints()})
		if(surfaceLines.length > 1){
			surfaceLines.fix();
			points.constrainToLine(surfaceLines,true,true);
		}
		points.applyQuick("update");
		for(i = 0; i < mainMenu.stiffness; i++){
			lines.constrainLength(i);
			lines.updateAttachedPoints()
			if(surfaceLines.length > 1){ surfaceLines.fix() }
			points.constrainToLine(groundLines,i === 0);
			if(surfaceLines.length > 1){ points.constrainToLine(surfaceLines,false,true) }
			pointStack.eachItem(p=>{p.updatePosPoints()})
		}
		lines.applyQuick("update");
		if(wavePhaseStepIn < 1){ // this eases in oscillators (called wave unfortunately) at start of animation to prevent model from being destroyed by excess force
			wavePhaseStepIn += 1/wavePhaseStepInFrames;
			wavePhaseEase = eCurve(wavePhaseStepIn,2);
			if(wavePhaseStepIn >= 1){
				wavePhaseStepIn = 1;
			}
		}
	}
}
function drawSim(){
	
	updateSim();	
	invScale = 1/(scale = view.getScale());	
	if(points.meanPos){
		view.setPos(-points.meanPos.x * scale + cw ,-points.meanPos.y * scale + ch );
	}
	
	view.apply(ctx);
	invScale = 1/(scale = view.getScale());	
	ctx.lineWidth = 2 * invScale;
    ctx.strokeStyle = "#000"

	
	ctx.strokeStyle = "green";
	groundLines.draw();
	surfaceLines.draw();	
    ctx.lineWidth = 2 * invScale;
    ctx.strokeStyle = "black";
    lines.drawUnSelected("black",2);
    ctx.lineWidth = 2 * invScale;
    ctx.fillStyle = "blue";
    points.drawUnSelected("blue",2);
}	
function mouseUI(){
    if(mouse.w !== 0){
        if(mouse.w < 0){ view.scaleAt(mouse.x,mouse.y,1/1.1) }
        else{ view.scaleAt(mouse.x,mouse.y,1.1) }
		mouse.w *= 0.5;
		if(Math.abs(mouse.w) < 1){ mouse.w = 0 };
    }	
    if((mouse.buttonRaw & 4) === 4 ){
		view.movePos(mouse.x - mouse.oldX, mouse.y - mouse.oldY);
	}
    view.toWorld(mouse.x,mouse.y,mouse.world); 	
	mouse.oldX = mouse.x;
	mouse.oldY = mouse.y;
}
const mainMenu = {// to replace UI from Sticks editor.
   stiffness : 1,
   airFriction : 0,
   surfaceFrictionn : 1,
   wheelTraction : 1,
   gravity : 0,
   showStress : false,
   breakable : 0,
   snapStrength : 0,	
   simSteps : 1,
   noShrapnel : true,
   update() {
		forces.AIR_FRICTION = mainMenu.airFriction;
		forces.SURFACE_FRICTION = mainMenu.surfaceFrictionn;
		forces.WHEEL_FRICTION = mainMenu.wheelTraction;
		forces.MIN_WHEEL_SIZE = 3;
		forces.GRAVITY = mainMenu.gravity;
   }
}
function resizeCanvas(){
	if(w !== innerWidth || h !== innerHeight){
		cw = (w = canvas.width = innerWidth) / 2;
		ch = (h = canvas.height = innerHeight) / 2;
	}
}
const view = (()=>{
    const matrix = [1,0,0,1,0,0]; // current view transform
    const invMatrix = [1,0,0,1,0,0]; // current inverse view transform
    var m = matrix;  // alias
    var im = invMatrix; // alias
    var rotate = 0;  // current x axis direction in radians
    var scale = 1;   // current scale
    const views = [];
    const pos = {  x : 0,  y : 0 }
    var dirty = true;
    const API = {
        apply(ctx){
            if(dirty){ this.update() }
            ctx.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        },
        getScale(){  return scale },
		getInvScale() { return 1 / scale },
        matrix,
        update(){
            var xdx = Math.cos(rotate) * scale;
            var xdy = Math.sin(rotate) * scale;
            m[3] = m[0] = xdx;
            m[2] = -(m[1] = xdy);
            m[4] = pos.x;
            m[5] = pos.y;
            var cross = xdx * xdx + xdy * xdy;
            im[3] = im[0] = xdx / cross;
            im[1] = -(im[2] = xdy / cross);            
            dirty = false;
        },
        toWorld(x, y, point = {}) {
            var xx, yy;
            if(dirty){ this.update() }
            xx = x - m[4];
            yy = y - m[5];
            point.x = xx * im[0] + yy * im[2];
            point.y = xx * im[1] + yy * im[3];
            return point;
        },
        toScreen(x, y, point = {}) {  
            if(dirty) { this.update() }
            point.x = x * m[0] + y * m[2] + m[4]; 
            point.y = x * m[1] + y * m[3] + m[5];
            return point;
        },   		
        movePos(x, y) { pos.x += x; pos.y += y; dirty = true },
        setPos(x, y) {  pos.x = x;pos.y = y; dirty = true },
        setScale(sc) { scale = sc; dirty = true },
        scaleAt(x, y, sc) {
            if(dirty) { this.update() }
            scale *= sc;
            pos.x = x - (x - pos.x) * sc;
            pos.y = y - (y - pos.y) * sc;
            dirty = true;
        }
    };
    return API;
})();
function update(timer){
	resizeCanvas();
    cursor = "default";
    runTime += 1;
    frameTime = timer - globalTime;
    globalTime = timer;
    ctx.setTransform(1,0,0,1,0,0); // reset transform
    ctx.globalAlpha = 1;           // reset alpha

	if(loaded) { 
		ctx.fillStyle = "#888";
		ctx.fillRect(0,0,w,h);
		mouseUI();	
		drawSim() 
	} else {
		if(loadingModel){
			ctx.fillStyle = "#4C7";
			ctx.fillRect(0,0,w,h);
			ctx.strokeStyle = "#EEE";
			ctx.lineWidth = 8;
			ctx.lineCap = "round";
			ctx.beginPath();
			const cp = (timer / 500) * Math.PI;
			ctx.arc(cw,ch,30,cp,cp+((timer / 500)%2) * Math.PI);
			ctx.stroke();
		} else {
			ctx.fillStyle = "#28A";
			ctx.fillRect(0,0,w,h);
			ctx.fillStyle = "#FFF";
			ctx.font = "32px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText("STICKS standalone player",cw,ch);
		}
	}
	
    canvas.style.cursor = cursor;
	requestAnimationFrame(update);
}
requestAnimationFrame(update);
setTimeout(()=>load("Walker2.json"),1000);
