"use strict";
var commandLine = (()=>{
    const COMMAND_ID = UID ++;
    const id = getGUID();
    var returnedLine, bufferPos, inBatch, batchError,  commandTextCallback,commandTextCompleteCallback, commandTextEvents, debugBatch = false;
    var enumber = 1;
    bufferPos = 0;
    inBatch = false;
    batchError = false; // used to reset on run or call commands.
    function logDebug(line){
        if (inBatch && batchHandler.currentBatch) {
            if(batchHandler.currentBatch.lineNumbers === undefined) {
                logDebugOutsideSource(line);
                return;
            }
            batchHandler.currentBatch.lineNumbers[batchHandler.currentBatch.lineNum] + ": " + line;
        }

        console.log(line);
    }
    function logDebugOutsideSource(line) {
        console.log(line);
    }
    const commandScope = {};
    const namedSelections = {};
    const keyboardModeName = "commandLine";
    const info = { size : 1,};
    const batches = [
        { name : "tileSetBorder", help : "Creates a border tileset, Arg tile size", },
        { name : "tileSetFill4", help : "Creates a 4 tile fill. Arg tile size", },
        { name : "tileSetFill4Rot", help : "Creates a 4 tile fill rotated. Arg tile size", },
        { name : "tileSetRoad", help : "Creates a road tileset. First arg as tile size", },
        { name : "mirrored4", help : "Image mirror vert and hor. Arg tile size", },
        { name : "mirroredOver4", help : "Image mirror vert and hor, overlap. Arg tile size", },
        { name : "flower4", help : "Creates drawable rotated 4 times", },
        { name : "flower8", help : "Creates drawable rotated 8 times", },
        { name : "flower16", help : "Creates drawable rotated 16 times", },
        { name : "shadow", help : "Adds shadow to selected", },
        { name : "isoGrid", help : "Creates drawable with Isometric grid", },
        { name : "iso", help : "Creates drawable  Isometric box 2/1", },
        { name : "toIso", help : "Converts selected sprite to an isometric projection", },
        { name : "toIsoMenu", help : "Displays menu for converting sprites to isometric projectiion", },
        { name : "spriteFX", help : "Setting sprite fx", },
        { name : "tileImage", help : "", },
    ];
    const matcher = {
        call : /^(\$[a-z0-9_.]+ ?= ?)?call /i,
        variable : /\$[a-z0-9_.]+/gi,
        comment : /\/\/.*/g,
        negNumFix : /- ([0-9])/g,
    };
    const hasProperty = (obj, path) => {
        const names = path.split(".");
        while(names.length > 0){
            const name = names.shift();
            if(obj !== null && typeof obj === "object" && obj.hasOwnProperty(name)){
                obj = obj[name];
            }else {
                return false;
            }
        }
        return true;
    }
    const isNum = val => ! isNaN(val);
    const commandBuffer = storage.getCommandLineHistory();
    bufferPos = 0;//commandBuffer.length - 1;
    const maxBatchStack = 1024; // this limits batch recursion depth. Must have or recursion can crash page a lose all work
    const batchStack = [];
    const scopeStack = [];
    const functionLinkRefs = new Map();
    function functionLinkRefDeleting(spr) {
        const remove = [];
        for (const [name, flRef] of functionLinkRefs.entries()) {
            var i = 0;
            while (i < flRef.sprites.length) {
                if (flRef.sprites[i] === spr) {
                    log("Fnuction link ref. Removing sprite: '" + spr.name + "' from ref: '" + name + "'");
                    flRef.sprites.splice(i--,1);
                    if (flRef.sprites.length === 0) {
                        remove.push(name);
                    }
                }
                i++;
            }
        }
        for (const name of remove) {
            log("Deleting empty function link reference: '" + name + "'");
            functionLinkRefs.delete(name);
        }

    }

    const batchDefaultGlobals = {
        get uID() { return UID++ },
        image() { return media.byName(this.imageName) },
        randArray : [],
        randMin : 0,
        randMax : 1,
        randI() { return (Math.random() * (batchHandler.global.randMax-batchHandler.global.randMin) | 0) + batchHandler.global.randMin },
        randItem() { return batchHandler.global.randArray[batchHandler.global.randArray.length * Math.random() | 0] },
    };
    const quickMenu = {
        batchMenu : false,
        options : "",
        exits : [],
        exitCommands : [],
        extraCommands : [],
        title : "",
        result : undefined,
        open: false,
    };
    const valueTypes = {
        number : enumber++,
        string : enumber++,
        name : enumber++,
        variable : enumber++,
        token : enumber++,
    };
    const tokens = {
        variable : enumber++,
        call : enumber++,
        exit : enumber++,
        "if" : enumber++,
        "else" : enumber++,
        label : enumber++,
        "=" : enumber++,
        "for" : enumber++,
        jump : enumber++,
        jumpSub : enumber++,
        exitSub : enumber++,
        "{" : enumber++,
        "}" : enumber++,

        event : enumber++,
        wait : enumber++,
        menuUpdate :  enumber++,
        menuButton :  enumber++,
        menuEnable: enumber++,
        menuDisable: enumber++,
        timeout : enumber++,
        frameRendered : enumber++,
        commandLine : enumber++,
       "+=" : enumber++,
       "-=" : enumber++,
       "*=" : enumber++,
       "/=" : enumber++,
       "**=" : enumber++,
    };
    const tokensNamed = {
        assign: tokens["="],
        assignAdd: tokens["+="],
        assignSub: tokens["-="],
        assignMult: tokens["*="],
        assignDiv: tokens["/="],
        assignPow: tokens["**="],
    };


    const assignmentTokens = [tokens["="],tokens["+="],tokens["-="],tokens["*="],tokens["/="],tokens["**="]];
    const proxyTypes = {
        data: {
            vet(value){
                return value;
            },
            error(name, value){ throw new Error("ISO PROXY ERROR!!!!!") },
        },
        number: {
            vet(value){ return isNum(value) ? Number(value) : undefined },
            error(name, value) { throw new TypeError("Sprite property  '"+ name + "' must be a number.") },
        },
        normalisable: {
            vet(value){ value.normalisable == true },
            error(name, value) { throw new TypeError("normalisable is Read only!") },
        },
        angle: {
            vet(value){
                value = (""+value).toLowerCase();
                if(value.indexOf("d") > -1) {
                    value = Number(value.split("d")[0]) / (180 / Math.PI);
                }
                return isNum(value) ? Number(value) : undefined
           },
            error(name, value) { throw new TypeError("Sprite property  '"+ name + "' must be an angle") },
        },
        unit: {
            vet(value){ return isNum(value) && Number(value) >= 0 && Number(value) <= 1 ? Number(value) : undefined },
            error(name, value){
                if( isNaN(value) ) {
                    throw new TypeError("Sprite property  '"+ name + "' must be a number." );
                }
                throw new RangeError("Sprite property  '"+ name + "' must be in the range 0 to 1 inclusive.");
            },
        },
        numberNotZero : {
            vet(value){ return isNum(value) && Math.abs(Number(value)) >= Math.EPSILON ? Number(value) : undefined },
            error(name, value){
                if( isNaN(value) ) {
                    throw new TypeError("Sprite property  '"+ name + "' must be a number." );
                }
                throw new RangeError("Sprite property  '"+ name + "' must be  greater than " +Math.EPSILON+ " or less than -" + Math.EPSILON);
            },
        },
        FXFilter: {
            vet(value) {
                if(isNaN(value)){ return  undefined };
                return Number(value);
            },
            error(name, value){
                throw new TypeError("Sprite FX filter value must be a number." );
            },
        },
        vectorSettings: {
            vet(value) {
                if(isNaN(value)){ return  undefined };
                return Number(value);
            },
            error(name, value){
                throw new TypeError("Vector settings value must be a number." );
            },
        },
        vectorSettingsBool: {
            vet(value) {return value === true },
            error(name, value){ throw new TypeError("Something is wrong.." ) },
        },
        shadowFilter: {
            vet(value) { return  undefined },
            error(name, value){throw new Error("Sprite shadow filter can not be changed.") },
        },
        name: {
            vet(value){ return value },
            error(name, value){ throw new Error("String error") }, // currently this wll never be called
        },
        fontName: {
            vet(value){ return value },
            error(name, value){ throw new Error("Font error") }, // currently this wll never be called
        },
        textContent: {
            vet(value){ return value.toString() },
            error(name, value){ throw new Error("Text error") }, // currently this wll never be called
        },
        pallet: {
            vet(value){
                return value.isPallet ? value : undefined;
            },
            error(name, value){ throw new Error("Not a pallet") },
        },
        image: {
            vet(value){
                return value;
            },
            error(name, value){ throw new Error("Not an image") },
        }
    }
    const akaList = {};
    function createProxyType(type,name,...aka){
        for (const aName of aka) { akaList[aName] = name }
        return proxyTypes[type];
    }
    const spriteWrapper = {
        w: createProxyType("number", "w", "width"),
        h: createProxyType("number", "h", "height"),
        x: createProxyType("number", "x"),
        y: createProxyType("number", "y"),
        rx: createProxyType("number", "rx","xAxis"),
        ry: createProxyType("number", "ry","yAxis"),
        sx: createProxyType("numberNotZero", "sx","xScale"),
        sy: createProxyType("numberNotZero", "sy","yScale"),
        scale: createProxyType("numberNotZero", "scale"),
        guid: createProxyType("number", "guid"),
        normalisable: createProxyType("normalisable", "type"),
        iso: createProxyType("data", "iso"),
        name:  createProxyType("name", "name"),
        angle: createProxyType("angle", "angle"),
        rotate: createProxyType("angle", "rotate"),
        a: createProxyType("unit", "a", "alpha"),
        FX: createProxyType("FXFilter", "FX", "blur", "brightness", "contrast", "grayscale", "saturate", "sepia", "hue","invert"),
        vector: createProxyType("vectorSettings","vector", "detail", "segs", "tolerance", "cornerAngle"),
        vectorBool: createProxyType("vectorSettingsBool","vectorBool", "smooth", "isVector"),
        shadow: createProxyType("shadowFilter", "shadow"),
        font: createProxyType("fontName", "font"),
        text: createProxyType("textContent", "text"),
        pallet: createProxyType("pallet", "pallet"),
        image: createProxyType("image", "image"),
    };
    const wrapperHasProp = (name) => {
        if(spriteWrapper[name] !== undefined) { return true }
        if(spriteWrapper[akaList[name]] !== undefined) { return true }
        return false;
    }
    const spriteAbstracts = {
        FX: {
            setValue(target, value, aka) {
                if(target.filters === undefined){
                    target.addFilter();
                }
                if(target.filters && target.filters[aka]){
                    target.filters[aka].amount = value;
                    target.filters.update();
                }
            },
            getValue(target, aka){
                if(target.filters === undefined || target.filters[aka] === undefined) { return undefined }
                if(!target.filters[aka].active ) { return undefined }
                return target.filters[aka].amount;
            },
        },
        vector: {
            setValue(target, value, aka) {
                if(target.type.vector){
                    const ps = target.vector.desc.pathStr;
                    if(ps[aka]!== undefined){
                        ps[aka] = value;
                        ps.cornerAngle = ps.cornerAngle < 0 ? 0 : ps.cornerAngle > 1 ? 1 : ps.cornerAngle;
                        ps.segs = ps.segs < 2 ? 2 : ps.segs > 16 ? 16 : ps.segs;
                        ps.detail = ps.detail < 0.5 ? 0.5 : ps.detail > 1024 ** 2 ? 1024 ** 2 : ps.detail;
                        ps.tolerance = ps.tolerance < 1 ? 1 : ps.tolerance > 255 ? 255 : ps.tolerance;
                        if(aka === "tolerance"){
                            target.vector.remake();
                        }else{
                            target.vector.redraw();
                        }
                    }
                }
            },
            getValue(target, aka){
                if(target.type.vector){
                    const ps = target.vector.desc.pathStr;
                    if(ps[aka] !== undefined){
                        return ps[aka];
                    }
                    return undefined;
                }
            },
        },
        vectorBool: {
            setValue(target, value, aka) {
                if(aka === "isVector") { return }
                if(target.type.vector){
                    const ps = target.vector.desc.pathStr;
                    if(ps[aka]!== undefined){
                        ps[aka] = value == true;
                        target.vector.redraw();
                    }
                }
            },
            getValue(target, aka){
                if(target.type.vector){
                    if(aka === "isVector") { return target.vector.desc.pathStr !== undefined }
                    const ps = target.vector.desc.pathStr;
                    if(ps[aka]!== undefined){
                        return ps[aka];
                    }
                }else if( aka === "isVector") { return false }
            },
        },
        shadow: {
            setValue(target, value) { },
            getValue(target){
                if(target.filters === undefined) { return undefined }
                return target.filters.shadow;
            },
        },
        font: {
            setValue(target, value) {
                if(target.type.text && target.textInfo){
                    target.textInfo.font = value;
                    target.textInfo.update();
                }
            },
            getValue(target){
                if(target.type.text && target.textInfo){
                    return target.textInfo.font;
                }
                return undefined;
            },
        },
        text: {
            setValue(target, value) {
                if(target.type.text && target.textInfo){
                    target.textInfo.text = value;
                    target.textInfo.update();
                }
            },
            getValue(target){
                if(target.type.text && target.textInfo){
                    return target.textInfo.text;
                }
                return undefined;
            },
        },
        name: {
            setValue(target, name) {
                if (name[0] === "#") {
                    name = name.slice(1);
                    name = textIcons.strToMath(name);
                } else if (name[name.length - 1] === "#") {
                    name = name.slice(0, name.length - 1);
                    name = textIcons.strToMath(name);
                }
                if (name.length === 0 || name === "*") {

                } else {
                    target.name = NAMES.register(name);
                }
            },
            getValue(target){
                return target.name;
            }

        },
        scale: {
            setValue(target, value) {
                target.sx = value;
                target.sy = value;
            },
            getValue(target) { return (target.sx + target.sy) / 2 }
        },
        normalisable: {
            setValue(target, value) { throw new Error("normalisable is read only"); },
            getValue(target) { return target.type.normalisable }
        },
        iso: {
            setValue(target, value) { target.iso = value },
            getValue(target) { return target.iso ? target.iso : "-" }
        },
        pallet: {
            setValue(target, value) {
                if(target.type.pallet){
                    target.pallet = value;
                }
            },
            getValue(target){
                if(target.type.pallet){
                    return target.pallet;
                }
            }
        },
        image: {
            setValue(target, value) {
                if(target.type.image || target.type.cutter){
                    target.changeImage(value);
                }
            },
            getValue(target){
                if(target.type.image) {
                    return target.image;
                }
            }
        },
        /*height : {
            setValue(target, value) {
                if(target.type.normalisable){
                    target.sy = 1;
                    target.h = value;
                    target.cy = target.h / 2;
                    log("ljshfjhdfs" + value);
                }else{
                    target.sy = value / target.h;
                }
            },
            getValue(target){
                return target.h * target.sy;
            }
        },
        width : {
            setValue(target, value) {
                if(target.type.normalisable){
                    target.sx = 1;
                    target.w = value;
                    target.cx = target.w / 2;
                }else{
                    target.sx = value / target.w;
                }
            },
            getValue(target){
                return target.w * target.sx;
            }
        },*/
        angle: {
            setValue(target, value) {
                const dif = target.ry - target.rx;
                target.rx = value;
                target.ry = value + dif;
            },
            getValue(target){
                return target.rx;
            }
        },
        rotate: {
            setValue(target, value) {
                const dif = target.ry - target.rx;
                target.rx += value;
                target.ry = target.rx + dif;
            },
            getValue(target){
                return 0;
            }
        },
    }
    function createSpriteProxy(sprite){
        const wrapper = {...spriteWrapper}
        const proxyHandler = {
            get(target, name) {
                if(typeof name !== "symbol"){
                    if(name === "hasOwnProperty"){
                        return wrapperHasProp;
                    }
                    var aka = "";
                    if(wrapper[name] === undefined){
                        if(akaList[name] === undefined){
                            log.error("Unknown sprite property '"+ name + "'");
                            throw new ReferenceError("Unknown sprite property '"+ name + "'");
                        }
                        aka = name;
                        name = akaList[name];
                    }
                    if (spriteWrapper.hasOwnProperty(name)){
                        if (spriteAbstracts[name] !== undefined) {
                            return spriteAbstracts[name].getValue(sprite,aka);
                        }
                        return sprite[name];
                    }
                }
                return target[name];
            },
            set(target, name, value) {
                var aka = "";
                if(wrapper[name] === undefined){
                    if(akaList[name] === undefined){
                        log.error("Unknown sprite property '"+ name + "'");
                        throw new ReferenceError("Unknown sprite property '"+ name + "'");
                    }
                    aka = name;
                    name = akaList[name];
                }
                const newValue = wrapper[name].vet(value);
                if(newValue === undefined){
                    log.error(wrapper[name].error(name, value));
                    return wrapper[name];
                }else{
                    if(spriteAbstracts[name] !== undefined){
                        spriteAbstracts[name].setValue(sprite, newValue, aka);
                    }else{
                        sprite[name] = newValue;
                    }
                }
                if(sprite.type.normalisable){ sprite.normalize() }
                sprite.key.update();
                if(!inBatch){
                    sprites.cleanup();
                    widget.update();
                    editSprites.update();
                    spriteList.update();
                }
                return wrapper[name];
            },
        };
        return new Proxy(spriteWrapper, proxyHandler);
    }
    function tokenArray(){
        function toValue(token){
            if (token !== undefined) {
                if (token.type === valueTypes.variable) { return token.name }
                return token.value;
            }
        }
        return Object.assign([],{
            each(cb) {
                var i = 0;
                for (const token of this) { cb(token,i++,this) }
            },
            joinVal(joiner = " ") {
                var str = "";
                var s = ""
                for(const v of this) {
                    str += s + toValue(v);
                    s = joiner;
                }
                return str;
            },
            shiftVal() { return toValue(this.shift()) },
            popVal() { return toValue(this.pop()) },
            hasTokens(pos, ...tokens){
                for(var i = 0; i < tokens.length; i++){
                    const v = this[pos + i];
                    if(!(v !== undefined && (v.type === valueTypes.token || v.type === valueTypes.variable) && v.token === tokens[i])){
                        return false;
                    }
                }
                return true;
            },
            copyToken(token) { return {...token} },
            evalValCommandScope(val) {
                const evalInScope = (scope) => {
                    if (typeof scope[val.name] === "string") { val.type = valueTypes.string }
                    else if (typeof scope[val.name] === "number") { val.type = valueTypes.number }
                    else { val.type = valueTypes.name }
                    val.value = scope[val.name];
                }
                if (val.type === valueTypes.variable) {
                    if (commandScope.hasOwnProperty(val.name)) { evalInScope(commandScope) }
                    else if (batchHandler.global.hasOwnProperty(val.name)) { evalInScope(batchHandler.global) }
                    else { val.value = undefined  }
                    if (typeof val.value === "function") { val.value = val.value() }
                }
                return val;
            },
            evalVal(val) {
                const bh = batchHandler;
                const cs = bh.currentScope;
                const g = bh.global;
                if (val.type === valueTypes.variable) {
                    const name = val.name;
                    var res;
                    if (cs !== null && cs.hasOwnProperty(name)) {
                        if (typeof cs[val.name] === "string") { val.type = valueTypes.string }
                        else if (typeof cs[val.name] === "number") { val.type = valueTypes.number }
                        else { val.type = valueTypes.name }
                        val.value = cs[val.name];
                    } else if (g.hasOwnProperty(name)) {
                        if (typeof g[val.name] === "string") { val.type = valueTypes.string }
                        else if (typeof g[val.name] === "number") { val.type = valueTypes.number }
                        else { val.type = valueTypes.name }
                        val.value = g[val.name];
                    } else { val.value = undefined  }
                    if (typeof val.value === "function") { val.value = val.value() }
                    if (debugBatch) { logDebug("$" + name + " = " + val.value) }
                }
                return val;
            },
            evalVals() {
                const bh = batchHandler;
                const cs = bh.currentScope;
                const g = bh.global;
                for (const val of this) {
                    if (val.type === valueTypes.variable) {
                        this.evalVal(val);
                    }
                }
                return this;
            },
            evalArrayValsInScope (scope) {
                const cs = scope;
                for(const val of this){
                    if(val.type === valueTypes.variable){
                        const name = val.name;
                        var res;
                        if (cs !== null && cs.hasOwnProperty(name)) {
                            if (typeof cs[val.name] === "string") { val.type = valueTypes.string }
                            else if (typeof cs[val.name] === "number") { val.type = valueTypes.number }
                            else { val.type = valueTypes.name }

                            val.value = [...cs[val.name]];

                        } else { val.value = undefined  }
                        if (typeof val.value === "function") { val.value = val.value() }
                    }
                }
                return this;
            },         
            evalValsInScope (scope) {
                if (this[0]?.name?.includes(".")) {
                    this[0].namePath = this[0].name.split(".");
                    if (Array.isArray(scope[this[0].namePath[0]])) {
                        this[0].name = this[0].namePath[0];
                        this[0].valuePath = this[0].value.split(".");
                        this[0].value = this[0].valuePath[0];
                        return this.evalArrayValsInScope(scope);
                    }
                }
                    
                if (Array.isArray(scope[this[0].name])) {
                    return this.evalArrayValsInScope(scope);
                }
                const cs = scope;
                for(const val of this){
                    if(val.type === valueTypes.variable){
                        const name = val.name;
                        var res;
                        if (cs !== null && cs.hasOwnProperty(name)) {
                            if (typeof cs[val.name] === "string") { val.type = valueTypes.string }
                            else if (typeof cs[val.name] === "number") { val.type = valueTypes.number }
                            else { val.type = valueTypes.name }
                            val.value = cs[val.name];
                        } else { val.value = undefined  }
                        if (typeof val.value === "function") { val.value = val.value() }
                    }
                }
                return this;
            },
            toScopedJS(name){
                var idx = 0;
                var JS = "";
                var space = "";
                while (idx < this.length) {
                    const val = this[idx++];
                    const next = this[idx];
                    if (val.token && val.token === tokens.variable && next && assignmentTokens.includes(next.token)) {  // unlike valueTypes.variable, token.variable has been evaluated
                        JS += space + name + "." + val.name;
                    } else  if (val.type === valueTypes.variable){ JS += space +  name + "." + val.name }
                    else if(val.type === valueTypes.string) { JS += space + "\"" + val.value + "\"" }
                    else if(Array.isArray(val.value)) { 
                        if (val.namePath) {
                            JS += space  + "Object.assign([" + val.value.map((v, i) => name + "." + val.name + "[" + i + "]." + val.namePath[1]).join(", ") + "], {arrVal: true, nPath: '" + val.namePath[1] + "'})"; 
                        } else {
                            JS += space  + "Object.assign([" + val.value.map((v, i) => name + "." + val.name + "[" + i + "]").join(", ") + "], {arrVal: true})"; 
                        }
                    } else { JS += space + val.value }
                    space = " ";
                }
                return JS;
            },
            evalDebugVars : [],
            toJS(){
                if(debugBatch) { this.evalDebugVars.length = 0 }
                const bh = batchHandler;
                const cs = bh.currentScope;
                const g = bh.global;
                var jsVar,JS = "";
                var space = "";
                for (const val of this) {
                    if(val.type === valueTypes.variable){
                        if (cs !== null && (cs.hasOwnProperty(val.name) || hasProperty(cs, val.name))) { jsVar = "batchHandler.currentScope." + val.name }
                        else if (g.hasOwnProperty(val.name) || hasProperty(g, val.name)) {  jsVar = "batchHandler.global." + val.name }
                        else { jsVar = "batchHandler.currentScope." + val.name }
                    } else if (val.type === valueTypes.string) { jsVar = "\"" + val.value + "\"" }
                    else {
                        if (typeof val.value === "object") { jsVar = "\"" + val.value + "\"" }
                        else { jsVar = val.value ;}
                    }
                    if (debugBatch && space === "") { this.evalDebugVars[0] = jsVar }
                    JS += space + jsVar;
                    space = " ";
                }
                return JS;
            },
            toLine(dontDelimit = false) {
                var line = "";
                var space = "";
                for (const val of this) {
                    if (val.type === valueTypes.string && !dontDelimit) { line += space + "\"" + val.value + "\"" }
                    else { line += space + val.value }
                    space = " ";
                }
                return line.replace(matcher.negNumFix,"-$1");
            }
        });
    }
    function tokenize(line){
        var inStr,val,i,arr = tokenArray();
        line = line.trim();
        inStr = false;
        for(i = 0; i < line.length; i++){
            if(!inStr && line[i] === "$") {
                if(val !== undefined) { arr.push(val) }
                matcher.variable.lastIndex = i;
                const res = matcher.variable.exec(line);
                arr.push({
                    type : valueTypes.name,
                    value : res[0],
                });
                i += res[0].length - 1;
                val = undefined;
            } else if(inStr || line[i] !== " "){
                if(line[i] === "\""){
                    if(inStr){
                        inStr = false;
                        arr.push(val);
                        val = undefined;
                    }else{
                        if(val !== undefined){ arr.push(val) }
                        inStr = true;
                        val = {
                            type : valueTypes.string,
                            value : "",
                        }
                    }
                } else if(val === undefined){
                    val = {
                        type : valueTypes.name,
                        value : line[i],
                    };
                } else {
                    val.value += line[i];
                }
            } else if(val !== undefined){
                arr.push(val);
                val = undefined;
            }
        }
        if(val !== undefined) { arr.push(val) }
        for(const v of arr){
            if(v.type !== valueTypes.string && isNum(v.value)){
                v.type = valueTypes.number;
            }else if(v.type === valueTypes.name && v.value[0] === "$"){
                v.type = valueTypes.variable;
                v.token = tokens.variable;
                v.name = v.value.substr(1);
            }else if(v.type === valueTypes.name && tokens[v.value] !== undefined){
                v.type = valueTypes.token;
                v.name = v.value;
                v.token = tokens[v.value];
            }
        }
        return arr;
    }
    function splitLine(line, split) {
        const a = [];
        var i = 0;
        var inQuote = false;
        var item = "";
        while (i < line.length) {
            if (line[i] === split) {
                if (inQuote) {
                    item += line[i];
                } else {
                    a.push(item);
                    item = "";
                }
            } else {
                item += line[i];
            }
            if (line[i] === "\"") {
                if (inQuote) { inQuote = false; }
                else { inQuote = true; }
            }
            i++;
        }
        if (item.length) { a.push(item); }
        return a;
    }
    const batchHandler = {
        reset() {
            batchError = false;
            inBatch = false;
            scopeStack.length = 0;
            batchStack.length = 0;
            batchHandler.currentBatch = null;
            batchHandler.currentScope = null;
            batchHandler.global = batchDefaultGlobals;
            batchHandler.subStack = [];
            if(debugBatch) {
                logDebug("Batch Handler reset and debug turned off")
                debugBatch = false;
            }
            runOnce();
        },
        createScope(batch) {
            batchHandler.currentBatch = batch;
            if (batchHandler.currentScope) { scopeStack.push(batchHandler.currentScope) }
            batchHandler.currentScope = {}
            if(debugBatch) { logDebug("New batch scope pushed to call stack") }
            batch.args.forEach((arg, i) => {
                if(isNaN(arg.value)) { batchHandler.currentScope["arg" + i] = arg.value }
                else {  batchHandler.currentScope["arg" + i] = Number(arg.value) }
            });
            if(debugBatch) { logDebug(batchHandler.currentScope) }
        },
        removeScope() {
            if(debugBatch) { logDebug("Batch scope popped") }
            if (scopeStack.length > 0) { batchHandler.currentScope = scopeStack.pop() }
            else { batchHandler.currentScope = null }
        },
        evalLine(line,num) {
            const batch = batchHandler.currentBatch;
            if (!batch) { return "" }
            try{
                const args = tokenize(line);
                if(args.hasTokens(0,tokens["}"]) && args.length === 1){ return "" }
                if(args.hasTokens(0,tokens.variable,tokens["="],tokens.call)){
                    const theCall = {};
                    theCall.assignTo = args.shift().name;  // get the variable name
                    args.shift();  // remove = token
                    args.shift();  // remove call token
                    args.evalVals(); // evaluate
                    theCall.callName = args.shiftVal();
                    theCall.call = theCall.callName + " " +args.toLine();
                    return theCall;
                }
                if(args.hasTokens(0,tokens.variable,tokens["="])){
                    if (args.length === 2) {
                        const js = args.toJS();
                    } else {
                        eval(args.toJS());
                    }
                    if(debugBatch && args.evalDebugVars[0]) {
                        const pathNames = args.evalDebugVars.pop().split(".");
                        pathNames.shift();
                        var path = batchHandler[pathNames.shift()]
                        while(pathNames.length > 1){
                            path = path[pathNames.shift()];
                        }
                        const pn = pathNames.shift();
                        if(typeof path[pn] === "string") {
                            logDebug("$"+ pn + " = \"" + path[pn] + "\"");
                        } else {
                            logDebug("$"+ pn + " = " + (path[pn] !== undefined && path[pn] !== null && path[pn].toString ? path[pn].toString():"undefined"));
                        }
                    }
                    return "";
                }
                if(args.hasTokens(0,tokens.exitSub)){
                    return {exitSub : true};
                }
                if(args.hasTokens(0,tokens.jumpSub)){
                    args.shift();
                    const label = args.pop().value;
                    if (batch.labels[label] === undefined) { throw new ReferenceError("Unknown label '"+label+"'") }
                    return {asSub : true, go : label};
                }
                if(args.hasTokens(0,tokens.jump)){
                    args.shift();
                    const label = args.pop().value;
                    if(debugBatch) { logDebug("Jumping to label " + label + "'") }
                    if (batch.labels[label] === undefined) { throw new ReferenceError("Unknown label '"+label+"'") }
                    return {go : label};
                }
                if(args.hasTokens(0,tokens["}"],tokens["else"]) && args.length === 3){
                    const block = batch.blocks.get(batch.lineNum);
                    if (block === undefined) { throw new Error("Syntax error, unknown else block.") }
                    go = block;
                    return {go : go};
                }
                if(args.hasTokens(0,tokens["else"])){

                    args.shift();
                    args.evalVals();
                    const label = args.pop();
                    var go = label.value;
                    if(label.type === valueTypes.token && label.token === tokens["{"]){
                        return "";
                    }
                    if (go !== "exit" && batch.labels[go] === undefined){
                        throw new ReferenceError("Unknown label '"+go+"'");
                    }
                    if (go === "exit") { return {exit : args.toLine()} }
                    return {go : go }
                }
                if(args.hasTokens(0,tokens["if"])){
                    args.shift();
                    args.evalVals();
                    const label = args.pop();
                    var go = label.value;
                    if(label.type === valueTypes.token && label.token === tokens["{"]){
                        const block = batch.blocks.get(batch.lineNum);
                        if(block === undefined){
                            throw new Error("Syntax error, unknown block.");
                        }
                        go = block;
                        if(!eval(args.toJS())) {
                            if (go.Else !== null) {
                                go = batch.blocks.get(go.Else);
                                if (go === undefined) {  throw new Error("Syntax error, unknown Else block.") }
                                go = {...go, close: go.open};
                            }
                            return {go : go};
                        };
                        return "";
                    }else if(go !== "exit" && batch.labels[go] === undefined){
                        throw new ReferenceError("Unknown label '"+go+"'");
                    }
                    if(eval(args.toJS())) {
                        if(go === "exit") {
                            return {exit : args.toLine()};
                        }
                        return {go : go }
                    };
                    return "";
                }
                if(args.hasTokens(0,tokens.exit)){
                    args.shift();
                    if(quickMenu.batchMenu && quickMenu.results) {
                        if(quickMenu.results.close) {
                            quickMenu.results.close(true)
                            quickMenu.open = false;

                        }
                    }
                    return {exit : args.evalVals().toLine()};
                }
                if(args.hasTokens(0,tokens.menuEnable) || args.hasTokens(0,tokens.menuDisable)){
                    const disable = args.hasTokens(0,tokens.menuDisable);
                    args.shift();
                    if (quickMenu.results && quickMenu.results.update){
                        while (args.length > 0){
                            var a = args.shift();
                            const name = a.type === valueTypes.variable ? a.name : a.type === valueTypes.name ? a.value : undefined;
                            if (name) {
                                quickMenu.results.update(name, undefined, disable ? "disable" : "enable");
                            }
                        }
                    } else { log.warn("No menu to update. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]) }
                    return "";
                }
                if(args.hasTokens(0,tokens.menuUpdate)){
                    args.shift();
                    if (quickMenu.results && quickMenu.results.update){
                        while (args.length > 0){
                            var a = args.shift();
                            if (a.type === valueTypes.variable){
                                args.evalVal(a);
                                quickMenu.results.update(a.name, a.value);
                            }
                        }
                    } else { log.warn("No menu to update. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]) }
                    return "";
                }
                if(args.hasTokens(0,tokens.menuButton)){
                    args.shift();
                    if(quickMenu.results && quickMenu.results.getButton){
                        var a = args.shift()
                        if (a && (a.type === valueTypes.variable || a.type === valueTypes.string)) {
                            var butName = a.type === valueTypes.variable  ? a.name : a.value;
                            const but = quickMenu.results.getButton(butName);
                            if (but) {
                                const path = args.shift();
                                if (path) {
                                    args.evalVal(path);
                                    const pathArr = path.value.split(".");
                                    if (pathArr.length > 0 && pathArr.length < 5) {
                                        let idx = 0;
                                        let bb = but[pathArr[idx++]]
                                        while (bb !== undefined && idx < pathArr.length ) { bb = bb[pathArr[idx++]] }
                                        if (bb !== undefined && idx === pathArr.length) {
                                            const propVal = args.shift();
                                            if (propVal) {
                                                args.evalVal(propVal);
                                                let fPath = undefined;
                                                if (pathArr.length === 1) { fPath = but[pathArr[0]] }
                                                else if (pathArr.length === 2) { fPath = but[pathArr[0]][pathArr[1]] }
                                                else if (pathArr.length === 3) { fPath = but[pathArr[0]][pathArr[1]][pathArr[2]] }
                                                else if (pathArr.length === 4) { fPath = but[pathArr[0]][pathArr[1]][pathArr[2]][pathArr[3]] }
                                                if (fPath) {
                                                    if(typeof fPath === "function") { fPath(propVal.value) }
                                                    else {
                                                        if (pathArr.length === 1)      { but[pathArr[0]] = propVal.value }
                                                        else if (pathArr.length === 2) { but[pathArr[0]][pathArr[1]] = propVal.value }
                                                        else if (pathArr.length === 3) {  but[pathArr[0]][pathArr[1]][pathArr[2]] = propVal.value }
                                                        else if (pathArr.length === 4) { but[pathArr[0]][pathArr[1]][pathArr[2]][pathArr[3]] = propVal.value }
                                                    }
                                                }
                                            }
                                            //log.warn("Path property invalid '"+path.value+"'. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]);
                                            return "";

                                        }
                                    }
                                }
                                log.warn("Path property path invalid '"+path.value+"'. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]);

                            } else {
                                log.warn("Could not locate button '"+a.name+"'. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]);
                            }
                        } else {  log.warn("menuButton missing button name. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]) }
                    }else { log.warn("No menu to update. Batch '" + batch.name + "'  line : " + batch.lineNumbers[batch.lineNum]) }
                    return "";
                }
                if(args.hasTokens(0,tokens.timeout)){
                    args.shift();
                    args.evalVals();
                    let timeout = args.shiftVal();
                    if (isNaN(timeout)) { timeout = 0 }
                    setTimeout(() => batchHandler.event("ontimeout"), timeout);
                    if (debugBatch) { logDebug("Timeout event in " + timeout + "ms") }
                    return "";
                }
                if(args.hasTokens(0,tokens.frameRendered)){
                    args.shift();
                    extraRenders.addOneTimeReady(() => batchHandler.event("onframerendered"));
                    if (debugBatch) { logDebug("Frame render event set") }
                    return "";
                }
                if(args.hasTokens(0,tokens.wait)){
                    args.shift();
                    args.evalVals();
                    const waitFor = {};
                    waitFor.timeout = args.shiftVal();
                    if (isNaN(waitFor.timeout)) { waitFor.timeout = 0 }
                    if(debugBatch) { logDebug("Batch wait for " + waitFor.timeout + "ms") }
                    return waitFor;
                }
                if(args.hasTokens(0, tokens.commandLine)){
                    args.shift();
                    return args.evalVals().toLine(true);
                }
                if(args.hasTokens(0, tokens.call)){
                    args.shift();
                    args.evalVals();
                    const theCall = {};
                    theCall.callName = args.shiftVal();
                    theCall.call = theCall.callName + " batch " + args.toLine(); // reserved word "batch" Is ignored ATM
                    return theCall;
                }
                return args.evalVals().toLine();
            }catch(e){
                log.error("Error in `" + batch.name + "` line " + batch.lineNumbers[batch.lineNum] + " " + e.message);
                log.sys(line);
            }
            return "error"
        },
        error(message){
            if(batchHandler.currentBatch) {
                log.error("External error while in batch '" + batchHandler.currentBatch.name + "'")
                log.error(message);
                log.warn("Line " + batchHandler.currentBatch.lineNumbers[batchHandler.currentBatch.lineNum] + " : " + batchHandler.currentBatch.lines[batchHandler.currentBatch.lineNum]);
            }
        },
        /*extendCurrent(pScriptSrc) {
            if (batchError) { log.error("Can not extend batch!"); return; }
            if (batchHandler.currentBatch === undefined) {  log.error("Can not extend undefined batch!"); return; }
            const pBat = {
                lines: pScriptSrc.split("/n"),
                lineNumbers: [],
            };
            const batch = batchHandler.currentBatch;
            batchHandler.readLines(pBat);
            
        },*/
        readLines(bat) {
            var lineNumber = bat.lineNumbers.length;
            var newLines = [];
            var inCompoundLine = false;
            var compoundLine = "";
            var compoundLineEndsWith = "";
            var compoundLineStarts;
            for (const line of bat.lines) {
                let newLine = line.replace(matcher.comment, "").trim();
                lineNumber ++;
                if (newLine !== "") {
                    if(inCompoundLine) {
                        compoundLine += newLine;
                        if(newLine.endsWith(compoundLineEndsWith)) {
                            inCompoundLine = false;
                            compoundLineEndsWith = "";
                            bat.lineNumbers.push(compoundLineStarts + "-" + lineNumber);
                            newLines.push(compoundLine);
                            compoundLine = ""
                            compoundLineStarts = undefined;
                        }
                    } else {
                        if(newLine.endsWith("[")) {
                            inCompoundLine = true;
                            compoundLine = newLine;
                            compoundLineEndsWith = "]"
                            compoundLineStarts = lineNumber;
                        } else {
                            bat.lineNumbers.push(lineNumber);
                            newLines.push(newLine);
                        }
                    }
                }
            }
            if(inCompoundLine) {
                log.error("Syntax error in `" + bat.name + "` lines " + compoundLineStarts + "-" + lineNumber+ " No closing " + compoundLineEndsWith + " found." );
                log.sys(bat.lines[i]);
                throw new Error("Macro error");
            }  
            bat.lines.length = 0; // Cant remember if there are other references (should not be). Set to zero to findout (should throw or do strange shit)
            bat.lines = newLines;            
        },
        run(batch){
            if (batchError) { batchHandler.reset() }
            if(debugBatch) { logDebugOutsideSource(">>> Batch `" + batch.name + "`") }
            inBatch = true;
            batchHandler.createScope(batch);
            batch.labels = {};
            batch.subStack = [];
            batch.blocks = new Map();
            batch.eventBlocks = [];
            batch.eventStack = [];
            batch.workingLines = [];
            batch.inEvent = false;
            batch.lineNumbers = [];
            batchHandler.readLines(batch);

            batch.macros = {};
            for(var i = 0; i < batch.lines.length; i++){
                if(batch.lines[i][0] === "#"){
                    const parts = batch.lines[i].split(" ");
                    const macro = parts.shift().substr(1);
                    batch.macros[macro] = { lines : parts.join(" ").split(";") }
                    batch.lineNumbers.splice(i,1);
                    batch.lines.splice(i--,1);
                    if(debugBatch) {
                        logDebug("Macro #" + macro + " defined as")
                        batch.macros[macro].lines.forEach(line=>logDebug(line));
                    }
                }else{
                    break;
                }
            }
            for(var i = 0; i < batch.lines.length; i++){
                if(batch.lines[i][0] === "#"){
                    const parts = splitLine(batch.lines[i], " ");//batch.lines[i].split(" ");
                    const macro = parts.shift().substr(1);
                    if(batch.macros[macro] === undefined){
                        log.error("Error in `" + batch.name + "` line " + batch.lineNumbers[i] + " Unknown macro '" + macro +"'" );
                        log.sys(batch.lines[i]);
                        throw new Error("Macro error");
                    }else{
                        const lines = batch.macros[macro].lines.map(l=>l);
                        if(parts.length > 0) {
                            parts.forEach((part,i) => {
                                const reg = new RegExp("\%"+i,"g");
                                lines.forEach((line,j) => { lines[j] = line.replace(reg,part) })
                            });
                        }
                        lines.forEach((line,j) => { lines[j] = line.replace(/\%[0-9]+/g,"") })
                        const dupLineNum = batch.lineNumbers[i];
                        batch.lineNumbers.splice(i, 1, $setOf(lines.length, () => dupLineNum));
                        batch.lines.splice(i--, 1, ...lines);

                    }
                }
            }
            for(var i = 0; i < batch.lines.length; i++){
                const parts = batch.lines[i].split(" ");
                if(parts[0] === "label"){
                    batch.labels[parts[1]] = {lineNum : i - 1};
                    batch.lineNumbers.splice(i,1);
                    batch.lines.splice(i--,1);
                }
            }
            if(debugBatch) {
                logDebug("Batch labels");
                logDebug(batch.labels);
            }
            const blockStack = [];
            const open = tokens["{"];
            const close = tokens["}"];
            const Else = tokens["else"];
            var currentBlock, lineBlock;
            var eventBlock;
            for(var i = 0; i < batch.lines.length; i++){
                var lineBlockCount = 0;
                lineBlock = undefined;
                tokenize(batch.lines[i]).each((val, idx, line) => {
                    if(val.type === valueTypes.token) {
                        if(val.token === tokens.event && idx === 0){
                            eventBlock = line[idx + 1].value;
                        }
                        if(val.token === open) {
                            if (currentBlock) {  blockStack.push(currentBlock) }
                            currentBlock = { open : i, close : null , Else: null};
                            if(eventBlock !== undefined){
                                currentBlock.event = eventBlock;
                                eventBlock = undefined;
                                if(debugBatch) { logDebug("Added batch event " + currentBlock.event) }
                                batch.eventBlocks.push(currentBlock);
                            }
                            lineBlockCount ++;
                        }else if(val.token === Else){
                            if (lineBlock) {
                                lineBlock.Else = i;
                                lineBlock = undefined;
                            } else {
                                //log.error("Error in `" + batch.name + "` line " + batch.lineNumbers[i] + " else with out matching if.");
                                //log.sys(batch.lines[i]);
                                //throw new Error("Block error");
                            }
                        }else if(val.token === close){
                            if(currentBlock === undefined){
                                log.error("Error in `" + batch.name + "` line " + batch.lineNumbers[i] + " Closing block '}' with out matching open.");
                                log.sys(batch.lines[i]);
                                throw new Error("Block error");
                            }
                            currentBlock.close = i;
                            batch.blocks.set(currentBlock.open, currentBlock);
                            lineBlock = currentBlock;
                            if (blockStack.length > 0) { currentBlock = blockStack.pop() }
                            else { currentBlock = undefined }
                        }
                    }
                });
                if(eventBlock !== undefined){
                    log.error("Error in `" + batch.name + "` line " + batch.lineNumbers[i] + " Event missing opening `{`");
                    log.sys(batch.lines[i]);
                    throw new Error("Block error");
                }
            }
            if(currentBlock){
                if(debugBatch) {  logDebug("Open block starts at line " + currentBlock.open) }
                log.error("Error in `" + batch.name + "` line " + batch.lineNumbers[batch.lines.length -1] + " " + " Block missmatch");
                log.sys(batch.lines[i]);
                throw new Error("Block error");
            }
            batch.lineNum = 0;
            if(debugBatch) { console.log(batch.lines.join("\n")) }
            batchHandler.continueRun(batch);
        },
        continueFromMenu(result){
            const batch = batchHandler.currentBatch = batchStack.pop();
            if (batch === undefined) { // this can happen when a Keep open memu script exits unexpectedly
                log.warn("Batch unexpected termination.");
                if(quickMenu.batchMenu && quickMenu.results) {
                    if(quickMenu.results.close) {
                        quickMenu.results.close(true);
                        quickMenu.open = false;

                        log.warn("Dialog forced close.");
                    }
                }
                return;
            }
            if(typeof result === "string" || !isNaN(result)){

                if(batch.nextAssignment) { batch.workingLines.push("$"+ batch.nextAssignment + " = " + result) }
                batch.lineNum ++;
                batch.nextAssignment = undefined;
                batchHandler.continueRun(batch);
            }else{
                if(isNaN(result.value)) {
                    batch.workingLines.push(result.arg + " = \"" + result.value + "\"");
                }else{
                    batch.workingLines.push(result.arg + " = " + result.value);
                }
                if(batch.nextAssignment){
                    batch.workingLines.push("$"+ batch.nextAssignment + " = \"" + result.arg.substr(1)+"\"");
                }
                batch.lineNum ++;
                batch.nextAssignment = undefined;
                batchHandler.continueRun(batch);
            }
            return;
        },
        continueFromWait(){
            const batch = batchHandler.currentBatch = batchStack.pop();
            batch.lineNum ++;
            batch.nextAssignment = undefined;
            setTimeout(()=>{ batchHandler.continueRun(batch) },0);
            return;
        },
        event(name){
            if(batchHandler.currentBatch && batchHandler.currentBatch.eventBlocks){
                batchHandler.currentBatch.eventBlocks.forEach(block => {
                    if(block.event === name){
                        batchHandler.fireEvent(batchHandler.currentBatch,block);
                    }
                });
            }
        },
        fireEvent(batch,eventBlock){
            if(debugBatch) {
                logDebug("Event " + eventBlock.event + " in '" + batch.name + "' line : " + batch.lineNumbers[eventBlock.open]);
            }
            const line = batch.lineNum;
            const nextAssignment =  batch.nextAssignment;
            batch.inEvent = eventBlock;
            batch.lineNum = eventBlock.open + 1;
            batch.nextAssignment = undefined;
            batchHandler.continueRun(batch);
            batch.lineNum = line;
            batch.nextAssignment = nextAssignment;
            batch.inEvent = undefined;
        },
        continueRun(batch) {
            busy();
            var i, line;
            const start = batch.lineNum;
            const end = batch.inEvent ? batch.inEvent.close : batch.lines.length;
            for (i = start; i < end ; i++) {
                batch.lineNum = i;
                if(batch.workingLines.length > 0){
                    line = batch.workingLines.shift();
                    i--;
                } else {
                    line = batch.lines[i];
                }
                if(debugBatch) { logDebug(batch.lineNumbers[i] + " : " + line) }
                line = batchHandler.evalLine(line);
                if(line !== "error"){
                     if(line.go !== undefined) {
                        if (line.asSub) { batch.subStack.push(batch.lineNum) }
                        if(typeof line.go === "string"){
                            i =  batch.labels[line.go].lineNum;
                        }else{
                            i = line.go.close;
                        }
                    } else if (line.timeout !== undefined) {
                        mouse.requestCapture(COMMAND_ID);
                        if(mouse.captured !== COMMAND_ID) {
                            log.error("Batch wait command could not capture mouse");
                            log.warn("Error '" + batch.name + "' : " + batch.lineNumbers[i] + " : " + line);
                            batchError = true;
                            break;
                        }
                        batchStack.push(batch);
                        setTimeout(()=>{
                                mouse.release(COMMAND_ID);
                                batchHandler.continueFromWait() ;
                            },  line.timeout
                        );
                        sprites.cleanup();
                        widget.update();
                        editSprites.update();
                        spriteList.update();
                        busy.end();
                        return;
                    }else if (line.call !== undefined) {
                        if (batch.inEvent) {
                            log.error("Illegal expresion. Can not call from events");
                            log.warn("Error '" + batch.name + "' : " + batch.lineNumbers[i] + " : " + line);
                            batchError = true;
                            break;
                        }
                        if (batchStack.length === maxBatchStack) {
                            log.error("Batch call overflow");
                            log.warn("Error '" + batch.name + "' : " + batch.lineNumbers[i] + " : " + line);
                            batchError = true;
                            break;
                        }
                        batchStack.push(batch);
                        if(line.callName === "menu"){
                            quickMenu.batchMenu = true;
                            commandInput.value = "menu show";
                            batch.nextAssignment = line.assignTo;
                        }else{
                            commandInput.value = "run " + line.call;

                            batch.nextAssignment = line.assignTo;
                        }
                        setTimeout(() => commandKeyInput({key : "SoftEnter", batch : true}), 0);
                        sprites.cleanup();
                        widget.update();
                        editSprites.update();
                        spriteList.update();
                        busy.end();
                        return;
                    } else if (line.exit !== undefined) {
                        returnedLine = line.exit;
                        break;
                    } else if(line.exitSub !== undefined) {
                        if (batch.subStack.length > 0) {
                            i = batch.subStack.pop();
                        }else{
                            log.error("Can not exitSub, not in Sub!");
                            log.warn("Error '" + batch.name + "' : " + batch.lineNumbers[i] + " : " + line);
                            batchError = true;
                            break;
                        }
                    }else if(line !== "") {
                        commandInput.value = line;
                        if (commandKeyInput({key : "SoftEnter", batch : true})) {
                            log.warn("Error '" + batch.name + "' : " + batch.lineNumbers[i] + " : " + line);
                            batchError = true;
                            break;
                        }
                    }
                } else {
                    log.warn("Batch terminated due to error.");
                    batchError = true;
                    break;
                }
            }
            if(batch.inEvent && !batchError){
                busy.end();
                return;
            }else if(batchStack.length > 0 && !batchError){
                batchHandler.removeScope();
                batch = batchHandler.currentBatch = batchStack.pop();
                if(batch.nextAssignment){
                    batch.workingLines.push("$"+ batch.nextAssignment + " = " + returnedLine);
                }
                batch.lineNum ++;
                batch.nextAssignment = undefined;
                returnedLine = undefined;
                setTimeout(()=>{
                        batchHandler.continueRun(batchHandler.currentBatch)
                    },0
                );
            } else if(!batchError) {
                batchHandler.removeScope();
                if(scopeStack.length === 0){
                    batchHandler.currentBatch = null;
                    inBatch = false;
                    returnedLine = undefined;
                    if(debugBatch) { logDebug("Batch '" + batch.name + "' completed.") }
                }
            }else{
                if(quickMenu.results) {
                    if(quickMenu.results.close) { quickMenu.results.close(true) }
                }
                quickMenu.results = undefined;
                quickMenu.open = false;

            }
            sprites.cleanup();
            widget.update();
            editSprites.update();
            spriteList.update();
            busy.end();
        },
    }
    window["batchHandler"] = batchHandler;
    var runOnce = ()=>{};
    const eventHandler = (e, name) => {
        if(inBatch) {
            setTimeout(()=>batchHandler.event(name),0)
        }
    }
    runOnce = () => {
        selection.addEvent("change",(e)=>eventHandler(e,"onselectionchanged"));
        localProcessImage.addEventOLD((e)=>eventHandler(e,"onimageprocessed"));
        localProcessImage.addEvent("workercomplete", (e)=>eventHandler(e,"workercomplete"));
        animation.addEvent("change",(e)=>eventHandler(e,"onanimtimechanged") );
        editSprites.addEvent("update",(e)=>eventHandler(e,"onspritesupdated") );
        //editSprites.addEvent("update",(e)=>eventHandler(e,"onspritesupdated") );
        tracker.addEvent("update",(e)=>eventHandler(e,"ontrackerupdated") );
        colours.addEvent("maincolorchanged", e => eventHandler(e,"onmaincolorchanged") );
        runOnce = ()=>{};
    }
    batchHandler.reset();
    function showHelp(name, args) {
        if(args.indexOf("?") > -1 && args.trim().split(" ").length === 2){
            log.sys("----------------------------------------------");
            log.sys("> Help for " + name);
            log.sys("> " + name + " ? : shows help for " + name);
            log.sys(lineCommands[name].helpExtended);
            return true;
        }
        return false;
    }
    const lineCommands =  {
        debug : {
            batchOnly: true,
            help : "> Toggle batch debug mode. debug ? for help",
            helpExtended : [
                "> debug : Toggles batch debug mode",
                "> debug [true | on]: Turns on debug use either true or on",
                "> debug [false | off]: Turns off debug use either false or off",
                "> debug [toggle]: Toggles batch debug mode",
                "> Use the DevTools console to see the batch lines",
                "> and the evaluated results to help find problems",
                "> in your batches",
            ],
            f(args){
                if (showHelp("debug",args)) { return  }
                args = tokenize(args);
                args.shift();
                if(args.length > 0){
                    const state = args.shiftVal().toLowerCase();
                    if(state === "off" || state === "false"){
                        debugBatch = false;
                    }else if(state === "on" || state === "true"){
                        debugBatch = true;
                    }else if(state === "toggle"){
                        debugBatch = !debugBatch;
                    }
                }else {
                    debugBatch = !debugBatch;
                }
                if(debugBatch){
                    log.sys("Debug mode on");
                }else {
                    log.sys("Debug mode off");
                }
            }
        },
        menu : {
            batchOnly: true,
            help : "> Creates a menu. Menu ? for help",
            helpExtended : [
                "> menu title title : Resets menu and sets title",
                ">                  : To create a new menu use this",
                ">                  : command to remove the previouse settings",
                "> menu options option 0,option 1,option 2... : sets options",
                ">              : comman delimited list of options",
                "> menu option optiontext : adds to the current options",
                "> menu exits exitText1, exitText2 ... : sets exit buttons",
                ">              : comman delimited list of options",
                "> menu exit exitText : adds to the current exit buttons",
                "> menu keep : Will keep the menu open untill an exit button",
                ">             has been pressed",
                "> menu display  : Well display the menu (like a status / progress dialog)",
                ">                 The menu is non blocking and will be removed on the next",
                ">                 menu command. eg to close enter command menu title \"\"",
            ],
            f(args){
                if (showHelp("scale",args)) { return  }
                args = tokenize(args);
                args.shift();
                if(args.length > 0){
                    const menuCommand = args.shiftVal().toLowerCase();
                    if (menuCommand === "close") {
                        if(quickMenu.results){
                            if(quickMenu.results.close){ quickMenu.results.close(true) }
                        }
                        quickMenu.open = false;
                        return;
                    } else if (menuCommand === "title") {
                        if(quickMenu.results){
                            if(quickMenu.results.close){ quickMenu.results.close(true) }
                        }
                        quickMenu.title = args.shiftVal();
                        quickMenu.options = "";
                        quickMenu.exits.length = 0;
                        quickMenu.exitCommands.length = 0;
                        quickMenu.extraCommands.length = 0;
                        quickMenu.keepOpen = false;
                        quickMenu.results = undefined;
                        quickMenu.vars = {};
                        quickMenu.displayOnly = false;
                        return;
                    } else if (menuCommand === "options"){
                        quickMenu.options = args.shiftVal();
                        return;
                    } else if (menuCommand === "option"){
                        if(quickMenu.options !== ""){
                            quickMenu.options += ",";
                        }
                        quickMenu.options += args.shiftVal();
                        return;
                    } else if (menuCommand === "exit"){
                        args = args.shiftVal().split(",");
                        quickMenu.exits.push(args[0]);
                        if(args.length > 1){
                            quickMenu.exitCommands.push(args[1]);
                        }else{
                            quickMenu.exitCommands.push("");
                        }
                        return;
                    }  else if (menuCommand === "extra"){
                        args = args.shiftVal().split(",");
                        if(args.length > 0){ quickMenu.extraCommands.push(...args) }
                        return;
                    } else if (menuCommand === "keep"){
                        quickMenu.keepOpen = true;
                        return;
                    } else if (menuCommand === "display"){
                        if(quickMenu.results === undefined){
                            quickMenu.results = buttons.quickMenu( quickMenu.title + "|" + quickMenu.exits.join(",")+ "|"+quickMenu.options , true);
                            quickMenu.open = true;

                        }
                        return;
                    } else if (menuCommand === "show"){
                        quickMenu.open = true;

                        if(quickMenu.results === undefined || !quickMenu.results.waiting){
                            if(quickMenu.batchMenu) {
                                quickMenu.results = buttons.quickMenu(
                                    quickMenu.title + "|" +
                                    quickMenu.exits.join(",") + "|" + quickMenu.options,
                                    quickMenu.keepOpen,
                                    batchHandler.currentScope
                                );
                                quickMenu.results.extras = [...quickMenu.extraCommands];
                            }else{
                                quickMenu.results = buttons.quickMenu(
                                    quickMenu.title + "|" +
                                    quickMenu.exits.join(",") + "|" + quickMenu.options,
                                    quickMenu.keepOpen
                                );
                            }
                            if(quickMenu.batchMenu && quickMenu.keepOpen){
                                quickMenu.results.oncommand = (optionClicked) => {
                                    const isStr = typeof optionClicked === "string";
                                    if(quickMenu.results.optionArg !== undefined){
                                        batchHandler.continueFromMenu({
                                            arg : quickMenu.results.optionArg,
                                            value : optionClicked ,
                                        });
                                    }else {

                                        if(isNum(optionClicked)){
                                            batchHandler.continueFromMenu(optionClicked);
                                        }else{
                                            if(isStr) {
                                                if(optionClicked[0] === "\""){
                                                    batchHandler.continueFromMenu(optionClicked);
                                                }else {
                                                    batchHandler.continueFromMenu("\""+optionClicked+"\"");
                                                }
                                            }else {
                                                batchHandler.continueFromMenu("\""+optionClicked+"\"");
                                            }
                                        }
                                    }
                                }
                            }
                            quickMenu.results.onclosed = () => {
                                if(quickMenu.batchMenu){
                                    quickMenu.batchMenu = false;
                                    if (quickMenu.results.exitUsed) {

                                        if(quickMenu.results.exitClicked === "" || quickMenu.results.exitClicked.toLowerCase() === "cancel"){
                                            batchHandler.continueFromMenu("\"cancel\"");
                                        } else  if(quickMenu.results.exitClicked.toLowerCase() === "done"){
                                            batchHandler.continueFromMenu("\"done\"");
                                        } else  if(quickMenu.results.optionsClicked === undefined) {
                                            batchHandler.continueFromMenu("\""+quickMenu.results.exitClicked.toLowerCase()+"\"");
                                        } else if(isNum(quickMenu.results.optionClicked)){
                                            batchHandler.continueFromMenu(quickMenu.results.optionClicked);
                                        }else{
                                            batchHandler.continueFromMenu("\""+quickMenu.results.optionClicked+"\"");
                                        }
                                    }else{

                                        if(quickMenu.results.optionClicked === ""){
                                            batchHandler.continueFromMenu("\"cancel\"");
                                        } else if(isNum(quickMenu.results.optionClicked)){
                                            batchHandler.continueFromMenu(quickMenu.results.optionClicked);
                                        }else{
                                            batchHandler.continueFromMenu("\""+quickMenu.results.optionClicked+"\"");
                                        }
                                    }
                                } else {
                                    var idx = quickMenu.exits.indexOf(quickMenu.results.exitClicked);
                                    if(idx > -1){
                                        var commandStr = quickMenu.exitCommands[idx].replace(/\{option\}/g,quickMenu.results.optionClicked);
                                        commandKeyInput({commandStr});
                                    }
                                }
                                quickMenu.open = false;
                            }
                        }
                        return;
                    }
                }
                log.error("Menu command unknown.");
            },
        },
        /*safe : {
            help : "> Allows unsafe functionality.",
            helpExtended : [
                "> unsafe : turns on canvas functions that can taint the canvas",
            ],
            f(args){
                if (showHelp("safe",args)) { return  }
                if(!settings.allowUnsafe){
                    settings.allowUnsafe = true;
                    log("You can now use unsafe functions.");
                    log("You will need to reload Painter");
                    settingsHandler.saveSettings();
                }else{
                    log("Unsafe functions are already avaliable.");
                }
            }
        },
        unsafe : {
            help : "> Protects against unsafe functionality.",
            helpExtended : [
                "> unsafe : turns off canvas functions that can taint the canvas",
            ],
            f(args){
                if (showHelp("unsafe",args)) { return  }
                if(settings.allowUnsafe){
                    settings.allowUnsafe = false;
                    log("Unsafe functions have been blocked.");
                    log("You will need to reload Painter");
                    settingsHandler.saveSettings();
                }else{
                    log("Unsafe functions are already blocked.");
                }
            }
        },*/
        text : {
            help : "> Help for text input.",
            helpExtended : [
                "Type text Hit enter or change focus to accept, Hit escape to",
                " regect. Empty strings will be regected,",
                "Leading/trailing spaces will be removed and ignored.",
                "Naming multiple items names will be numbered,",
                "Numbers make the name unique for this session.",
                "The item clicked gets the lowest number, other",
                "items are numbered in list order.",
                "To override numbering start or end with *.",
                "Use math parser start or end with #.",
                "The * and or # will be removed.",
                "Names for MEDIA will ignor * and # char commands",
                "To use both * and # add once to either end.",
                "Function links automaticly get parsed as math strings.",
                "Math string char commands",
                "> use ` for subscript numbers eg `12",
                "> use ^ for superscript numbers eg ^12",
                "> use #pi = \u03C0 #ang = \u2222 #fta = \u03B8 ",
                "> use #rt2 = \u221A #rt3 = \u221B #rt4 = \u221C",
            ],
            f(args){  showHelp("text","text ?") }
        },
        info : {
            help : "> Displays the line on the log with an info feedback flash",
            helpExtended : [
                "> info text to add to log",
            ],
            f(args){
                if (showHelp("info",args)) { return  }
                args = args.split(" ");
                args.shift();
                log.info(args.join(" "));
            }
        },
        warn : {
            batchOnly: true,
            help : "> Displays the line on the log with an warning feedback flash",
            helpExtended : [
                "> warn text to add to log",
            ],
            f(args){
                if (showHelp("warn",args)) { return  }
                args = args.split(" ");
                args.shift();
                log.warn(args.join(" "));
            }
        },
        error : {
            batchOnly: true,
            help : "> Displays the line on the log with an error feedback flash",
            helpExtended : [
                "> error text to add to log",
            ],
            f(args){
                if (showHelp("error",args)) { return  }
                args = args.split(" ");
                args.shift();
                log.error(args.join(" "));
            }
        },
        log : {
            batchOnly: true,
            help : "> Displays the line on the log",
            helpExtended : [
                "> log text to add to log",
            ],
            f(args){
                if (showHelp("log",args)) { return  }
                args = args.split(" ");
                args.shift();
                log(args.join(" "));
            }
        },
        clear : {
            help : "> Clears the log",
            helpExtended : [
                "> clear Clears the log display",
                "> clear [errors|err|error]  clears errors",
                "> clear [warnings|warn]     clears warning items",
                "> clear [infomation|info]   clears infomation item",
                "> clear [system|sys]        clears system items",
                "> clear [messages|mes|mess] clears messages from batches",
                ">                         or standard log text",
                "? Same as commmand clr",
            ],
            f(args) {
                if (showHelp("clear",args)) { return  }
                args = tokenize(args);
                args.shift();
                var what = args.shiftVal();
                log.clear(what);

            },
        },
        clr : {
            help : "> Clears the log",
            helpExtended : [
                "> clr Clears the log display",
                "> clr [errors|err|error]  clears errors",
                "> clr [warnings|warn]     clears warning items",
                "> clr [infomation|info]   clears infomation item",
                "> clr [system|sys]        clears system items",
                "> clr [messages|mes|mess] clears messages from batches",
                ">                         or standard log text",
                "? Same as commmand clear",
            ],
            f(args) {
                if (showHelp("clr",args)) { return  }
                args = tokenize(args);
                args.shift();
                var what = args.shiftVal();
                log.clear(what);
            },
        },
        time : {
            help : "> set current animation time",
            helpExtended : [
                "> time frame Frame to move to.",
                "> time + frame Frame relative.",
                "> time - frame Frame relative.",
                "> time m:s:f [minutes] seconds,frames to move to",
                "> time + m:s:f move time relative",
                "> time - m:s:f move time relative",
                "> time + move 1 frame forward",
                "> time - move 1 frame backward",
                "> time  show current time",
            ],
            f(args) {
                if (showHelp("time",args)) { return  }

                args = tokenize(args);
                args.shift();
                const timeMove = args[0];
                var time = args.shiftVal();
                if(time === undefined) {
                    log.sys("Time is " + timeToStr(animation.time));
                    return;
                }
                var rel = 0;

                if(timeMove.type === valueTypes.number) {
                    if(timeMove.value[0] === "+") {
                        rel =  1;
                    }else if(timeMove.value[0] === "-") {
                        rel = -1;
                        time = -time;
                    }
                }else if(timeMove.type === valueTypes.name) {
                    if(timeMove.value[0] === "+") {
                        rel =  1;
                    }else if(timeMove.value[0] === "-") {
                        rel = 1;
                    }
                }
                if(time === "+") {
                    rel = 1;
                    time = args.shiftVal();
                }
                if(time === "-") {
                    rel = -1;
                    time = args.shiftVal();

                }
                if(time === undefined) {
                    time = 1;
                }
                if(isNaN(time)) {
                    time = time.split(":");
                    if(time.length === 2){
                        time = (Math.abs(Number(time[0] * 60)) + Number(time[1])) * (time[0][0] === "-" ? -1 : 1);
                    }else if(time.length === 3) {
                        time = (Math.abs(Number(time[0] * 60 * 60)) +Number(time[1] * 60) + Number(time[2])) * (time[0][0] === "-" ? -1 : 1);
                    }
                }
                if(isNum(time)) {
                    time = Math.round(time);
                    if(rel !== 0){
                        animation.addTime = time * rel;
                    }else{
                        animation.time = time;
                    }
                    log.sys("Moved to time " + timeToStr(animation.time));
                }else {
                    log.warn("Unknown time args.");
                }


            },
        },
        help : {
            help : "> Shows help in log display",
            f(args) {
                log.sys(["--------------------------------------","","> List of command line commands.",""]);
                for(const com of commandList){ log.sys("> " + com + " : " + lineCommands[com].help) }
                log.sys("> For more help `command ?`");
                log.sys(["> ","> You can also evaluate expresions."]);
                log.sys( "> eg 10 + 20 will display the result 10 + 20 = 30");
                log.sys( "> Variables can be used but must begin with the $ sign");
                log.sys( "> eg $a = 100");
                log.sys( "> eg $a * 10 will display $a * 10 = 1000");
            }
        },
        com : {
            help : "> Calls a UI command. `com ??` for com list",
            helpExtended : [
                "> com ?? : shows a list of all commands",
                "> com ?? filter : shows a list of all commands containing filter str",
                "> run commandName [right left ctrl shift alt]",
                ">     commandName command identifier",
                ">  [right left ctrl shift alt] modifiers none is left",
            ],
            f(args){
                if(args.indexOf("??") > -1){
                    args = tokenize(args);
                    args.shift();
                    args.shift();
                    var filter = args.shiftVal();
                    log.sys("===========================================.");
                    if (filter) {
                        filter = filter.toLowerCase();
                        log.sys("List of commands containings '" + filter + "'");
                    } else {
                        log.sys("List of commands.");
                    }
                    var keys = filter ? Object.keys(commands).filter(k => k.toLowerCase().includes(filter)) : Object.keys(commands);
                    for(const key of keys){
                        if(commandLineCommandSliders.indexOf(commands[key]) > -1){  log("com " + key + " value") }
                        else if(commandLineCommands.indexOf(commands[key]) > -1){  log("com " + key) }
                    }
                    log.sys("===========================================.");
                    log.sys("> Click command to add to command line");
                    return;
                }
                if (showHelp("com",args)) { return  }
                mouse.oldButton = 1;
                mouse.button = 1;
                if(args.indexOf("right") > -1){ mouse.button = mouse.oldButton = 4 }
                if(args.indexOf("ctrl") > -1){ mouse.ctrl = true }
                if(args.indexOf("shift") > -1){ mouse.shift = true }
                if(args.indexOf("alt") > -1){ mouse.alt = true }
                args = args.replace(/ +/g," ").split(" ");
                if(commands[args[1]] !== undefined){
                    if(commandLineCommandSliders.indexOf(commands[args[1]]) > -1){
                        var button = buttons.sliders.get(commands[args[1]]);
                        if(args[2] !== undefined && !isNaN(args[2])){
                            var val = Number(args[2]);
                            val = val < button.slider.min ? button.slider.min : val > button.slider.max ? button.slider.max : val;
                            button.slider.value = Number(val);
                        }
                        if(isNaN(args[2])) {
                            log.error("Command slider value is not a number");
                        }else{
                            button.element.updateValue();
                        }
                    }else{
                        issueCommand(commands[args[1]]);
                    }
                }else{
                    log.sys("com missing command argument. com ? for help");
                }
                //mouse.oldButton = 0;
                mouse.button = 0;
                mouse.shift = false;
                mouse.alt = false;
                mouse.ctrl = false;
            }
        },
        fl : {
            autoComplete: ["?", "??", "reset", ...functionLinkBuilder.names.functionType,
                ],

            help : "> fl or functionlink Creates function links",
            helpExtended : [
                "> fl ?  : To show function link full help",
                "> To list avalible input output and function types",
                "> Use ??  Named types have a short and long from ",
                "> fl ?? type:  any of [in, out, func, ref]",
                "> fl ?? typeLong:  any of [inLong, outLong, funcLong]",
                "> fl    : Adds default function link",
                "> fl reset: Resets all function link references",
                "> fl ",
                ">    [function ?] : Name of function",
                ">    [* ?]      : Scale function by",
                ">    [+ ?]      : Offset function by",
                ">    [in [?]]   : List of input types or references to bind input to",
                ">    [out [?]]  : List of output types",
                ">    [as [?]]   : List of reference names to create",
                ">    [to [?]]   : List of references to bind outputs to",

            ],
            f(args){
                 const flb = functionLinkBuilder;
                const names = flb.names;
                const listNames = (type, asLong = false) => {
                    log.sys("===========================================.");
                    log.sys("List of " + type + " types " + (asLong ? " long form" : " short form"));
                    names[type + "Type" + (asLong ? "Long" : "")].forEach(name => {log(name)});
                    log.sys("--------------------------------------------.");
                }
                const listRefs = () => {
                    log.sys("===========================================.");
                    log.sys("List of function link references");
                    [...functionLinkRefs.keys()].forEach(name => {
                        log("Ref name: " + name);
                        functionLinkRefs.get(name).sprites.forEach(spr => {
                            log("    sprite: " + spr.name);
                        });
                    });
                    log.sys("--------------------------------------------.");
                }

                const error = (mes) => (log.error(mes), exit = true);
                var exit = false;
                const vets = {
                    ref(name) {
                        if (name === "sel" || name === "selection") { return "sel" }
                        if (!functionLinkRefs.has(name)) { throw new ReferenceError("Unknown function link reference '"+name+"'") }
                        return name;
                    },
                    as(name) {
                        if (name === "sel" || name === "selection")  { throw new RangeError("Can not use `" + name + "` it is a reserved name") }
                        if (names.vetIn(name) !== undefined) { throw new RangeError("Can not use `" + name + "` it is a reserved input name") }
                        if (names.vetOut(name) !== undefined) { throw new RangeError("Can not use `" + name + "` it is a reserved output name") }

                        if (functionLinkRefs.has(name)) { throw new RangeError("`" + name + "` already defined")  }
                        return name;
                    },
                    in(name) {
                        const iName = names.vetIn(name);
                        if (iName) { return iName }
                        if (functionLinkRefs.has(name)) { return name }

                        throw new Error("Unknown input type '"+name+"'");
                    },
                    out(name) {
                        const oName = names.vetOut(name);
                        if (oName) { return oName }
                        throw new Error("Unknown output type '"+name+"'")
                    },
                    to(name) {
                        if (name === "sel" || name === "selection") { return "sel" }
                        if (!functionLinkRefs.has(name)) { throw new ReferenceError("Unknown function link reference '"+name+"'") }
                        return name;
                    },
                }

                if (args.indexOf("??") > -1) {
                    const hp = args.split(" ");
                    if(hp[2] === "in") { listNames("input") }
                    else if(hp[2] === "inLong") { listNames("input", true) }
                    else if(hp[2] === "out") { listNames("output") }
                    else if(hp[2] === "outLong") { listNames("output", true) }
                    else if(hp[2] === "func") { listNames("function") }
                    else if(hp[2] === "funcLong") { listNames("function", true) }
                    else if(hp[2] === "ref") { listRefs() }
                    return;
                }

                if (showHelp("fl",args) || showHelp("functionlink",args)) { return  }
                log.sys("Parsing: " + args);
                args = tokenize(args);
                args.shift();
                if(args.length === 0) {
                    issueCommand(commands.edSprCreateFunctionLink);

                } else {

                    var currentCom = "ref";
                    var data = {
                        ref: [],  // link input ref
                        in:[],    // input type or ref
                        out: [],  // output type
                        as: [],  // as named ref
                        to: [],  // link output to
                    };
                    var func = args.shiftVal();
                    if (func === "reset") {
                        for(const refs of functionLinkRefs.values()) {
                            refs.forEach(spr => spr.removeEvent("ondeleting",functionLinkRefDeleting));
                        }
                        functionLinkRefs.clear();
                        log("Function link references reset");
                        return;
                    }
                    if (func === "in") {
                        func = "sum";
                        currentCom = "in";
                    }
                    if (func === "sel") {
                        func = "sum";
                        data.ref.push("sel");
                        currentCom = "ref";
                        //log(currentCom + ": " + "sel");
                    }
                    const funcName = names.vetFunc(func);

                    if (funcName === undefined) { throw new RangeError("Unknown function '" + func + "'");}
                    var scaleFunc = 1;
                    var offsetFunc = 0;
                    if (args[0].value === "*") {
                         args.shiftVal();
                         scaleFunc = args.shiftVal();
                         if (isNaN(scaleFunc)) { throw new RangeError(" * `" + scaleFunc + "` must be a number") }
                         scaleFunc = Number(scaleFunc);
                    }
                    if (args[0].value === "+") {
                         args.shiftVal();
                         offsetFunc = args.shiftVal();
                         if (isNaN(offsetFunc)) { throw new RangeError(" + `" + offsetFunc + "` must be a number") }
                         offsetFunc = Number(offsetFunc);
                    }




                    while (args.length) {
                        const val = args.shiftVal();
                        if (val === "in") { currentCom = "in" }
                        else if (val === "out") { currentCom = "out" }
                        else if (val === "as") { currentCom = "as" }
                        else if (val === "ref") { currentCom = "ref" }
                        else if (val === "to") { currentCom = "to" }
                        else if (data[currentCom]) {
                            vets[currentCom](val);
                            if (exit) { return }
                            data[currentCom].push(val);
                            //log(currentCom + ": " + val);
                        }
                    }
                    const newFLSprs = [];
                    var i = 0, o = 0, a = 0, r = 0, t = 0, inName, outName, asName, fromRef, toRef;
                    if (lineCommands.fl.placement === undefined) {
                        lineCommands.fl.placement = [...utils.viewCenter];
                    }
                    const curSelection = selection.asArray();
                    if (data.in.length === 0 && data.out.length === 0 && data.ref.length > 0 && data.as.length > 0) {
                        while (r < data.ref.length) {
                            fromRef = data.ref.length ? data.ref[r++ % data.ref.length] : undefined;
                            if (fromRef === "sel") {
                                a = 0;
                                while(a < curSelection.length) {
                                    asName = data.as.length ? data.as[a % data.as.length] : undefined;
                                    if (!functionLinkRefs.has(asName)) { functionLinkRefs.set(asName, {sprites: []}) }
                                    selection[a].addEvent("ondeleting",functionLinkRefDeleting);
                                    functionLinkRefs.get(asName).sprites.push(selection[a++]);
                                }
                                break;
                            }
                        }

                    } else {
                        while (i < data.in.length || o < data.out.length) {
                            inName = i < data.in.length ? data.in[i++] : undefined;
                            outName = o < data.out.length ? data.out[o++] : undefined;
                            asName = data.as.length ? data.as[a++ % data.as.length] : undefined;
                            if (asName) {
                                if (!functionLinkRefs.has(asName)) { functionLinkRefs.set(asName, {sprites: []}) }
                            }
                            if (functionLinkRefs.has(inName)) {
                                fromRef = inName;
                                inName = undefined;
                            } else {
                                fromRef = data.ref.length ? data.ref[r++ % data.ref.length] : undefined;
                            }
                            toRef = data.to.length ? data.to[t++ % data.to.length] : undefined;
                            const spriteName = (asName ? asName + ":" : "") + funcName + (inName ? " in:" + inName : "") + (outName ? " out:" + outName : "") + " #";
                            log("new function link: '" + spriteName + "'");
                            if (fromRef && fromRef !== "sel") {
                                const fSprs = functionLinkRefs.get(fromRef).sprites;
                                let i = 0;
                                while (i < fSprs.length) {
                                    if (fSprs[i].type.functionLink) {
                                        const fSpr = fSprs[i];
                                        lineCommands.fl.placement[0] = fSpr.x + fSpr.cx * 2 + fSpr.w * fSpr.sx;
                                        lineCommands.fl.placement[1] = fSpr.y;
                                        break;
                                    }
                                    i++
                                }
                            }
                            const fl = new Sprite(...lineCommands.fl.placement, 48 * 2, 16, spriteName);
                            lineCommands.fl.placement[1] += 18;
                            fl.changeToFunctionLink();
                            fl.fLink.type = funcName;
                            inName && (fl.fLink.inFrom = inName);
                            outName && (fl.fLink.outTo = outName);
                            fl.fLink.scale = scaleFunc;
                            fl.fLink.offset = offsetFunc;
                            fl.rgb.parseCSS(settings.functionLinkOutlineColor);
                            newFLSprs.push(fl);
                            if (asName) {
                                functionLinkRefs.get(asName).sprites.push(fl);
                                fl.addEvent("ondeleting",functionLinkRefDeleting);

                            }
                            if (fromRef) {
                                if (fromRef === "sel") {
                                    log("attaching: selection")
                                    curSelection.forEach(s => fl.attachFunc(s, "input"));
                                } else {
                                    const f = functionLinkRefs.get(fromRef).sprites;
                                    f.forEach(s => fl.attachFunc(s, "input"));
                                }
                            }
                            if (toRef) {
                                if (toRef === "sel") {
                                    log("attaching: selection")
                                    curSelection.forEach(s => fl.attachFunc(s, "output"));
                                } else {
                                    const f = functionLinkRefs.get(toRef).sprites;
                                    f.forEach(s => fl.attachFunc(s, "output"));
                                }
                            }
                        }
                        editSprites.addCreatedSprites(...newFLSprs);
                    }



                }
            }
        },
        pos : {
            batchOnly: true,
            help : "> Positions selected sprites at x,y `pos ?` for help",
            helpExtended : [
                "> pos x y  : move selected centers to x y",
                "> pos      : List selected positions",
            ],
            f(args){
                if (showHelp("pos",args)) { return  }
                args = tokenize(args);
                args.shift();
                if(args.length === 0) {
                    selection.each(spr => {
                        log("pos " + spr.x.toFixed(3) + " " + spr.y.toFixed(3));
                    });

                } else {
                    var x = args.shiftVal();
                    var y = args.shiftVal();

                    if(isNaN(x) || isNaN(y)){
                        log.error("Pos argument is not a number");
                    }else{
                        x = Number(x);
                        y = Number(y);
                        selection.each(spr => {
                            spr.x = x;
                            spr.y = y;
                            spr.key.update();
                        });
                        sprites.cleanup();
                        widget.update();
                    }
                }
            }
        },
        move : {
            batchOnly: true,
            help : "> moves selected sprites x y `move ?` for help",
            helpExtended : [
                "> move x y  : x and y distance to move sprite in world space",
                "? move lx ly wx wy : move the sprite so the local coordinate",
                "                     lx,ly is at world coords wx wy",
            ],
            f(args){
                if (showHelp("move",args)) { return  }
                args = tokenize(args);
                args.shift();
                var x = args.shiftVal();
                var y = args.shiftVal();

                if(isNaN(x) || isNaN(y)){
                    log.error("Move argument is not a number");
                }else{
                    x = Number(x);
                    y = Number(y);
                    if(args.length > 0 !== undefined){
                        let wx = args.shiftVal();
                        let wy = args.shiftVal();
                        if(isNaN(wx) || isNaN(wy)){
                            log.error("Move argument is not a number");
                        }else{
                            wx = Number(wx);
                            wy = Number(wy);
                            selection.moveLocal(x,y,wx,wy);
                            selection.callIf(spr => spr.type.normalisable, "normalize");
                            sprites.cleanup();
                            widget.update();
                        }
                    }else{
                        selection.move(x,y);
                        selection.callIf(spr => spr.type.normalisable, "normalize");
                        sprites.cleanup();
                        widget.update();
                    }
                }
            }
        },
        rotate : {
            batchOnly: true,
            help : "> rotate selected sprites axies x & y `rotate ?` for help",
            helpExtended : [
                "> rotate rotateX rotateY : rotateX rotateY amount, in degrees,",
                ">                         to rotate axies ofselected sprites",
                ">                         If rotateY is not given then rotated both axis by RotateX",
            ],
            f(args){
                if (showHelp("rotate",args)) { return  }
                args = tokenize(args);
                args.shift();
                var rx = args.shiftVal();
                var ry = args.shiftVal();
                if(isNaN(rx)){
                    log.error("Rotate argument is not a number");
                }else{
                    rx = Number(rx) * (Math.PI / 180);
                    if(ry === undefined || isNaN(ry)){
                        ry = rx;
                    }else{
                        ry = Number(ry) * (Math.PI / 180);
                    }
                    selection.rotate(0,0,rx,ry);
                    selection.callIf(spr => spr.type.normalisable, "normalize");
                    sprites.cleanup();
                    widget.update();
                }
            }
        },
        rotater : {
            batchOnly: true,
            help : "> rotateR selected sprite axies x & y in radians ? for help",
            helpExtended : [
                "> rotateR rotateX rotateY : rotateX rotateY amount, in radians,",
                ">                         to rotate axies ofselected sprites",
                ">                         If rotateY is not given then rotated both axis by RotateX",
            ],
            f(args){
                if (showHelp("rotater",args)) { return  }
                args = tokenize(args);
                args.shift();
                var rx = args.shiftVal();
                var ry = args.shiftVal();
                if(isNaN(rx)){
                    log.error("Rotate argument is not a number");
                }else{
                    rx = Number(rx);
                    if(ry === undefined || isNaN(ry)){
                        ry = rx;
                    }else{
                        ry = Number(ry);
                    }
                    selection.rotate(0,0,rx,ry);
                    selection.callIf(spr => spr.type.normalisable, "normalize");
                    sprites.cleanup();
                    widget.update();
                }
            }
        },
        scale : {
            batchOnly: true,
            help : "> scale selected sprites sx sy `scale ?` for help",
            helpExtended : [
                "> scale sx sy: scales selected sprites by sx and sy in sprite local space",
            ],
            f(args){
                if (showHelp("scale",args)) { return  }
                args = tokenize(args);
                args.shift();
                var sx = args.shiftVal();
                var sy = args.shiftVal();
                if (isNaN(sx) && isNum(sy)) {
                    log.error("Scale argument is not a number");
                }else{
                    sx = isNum(sx) ? Number(sx) : 1;
                    sy = isNum(sy) ? Number(sy) : sx;
                    selection.scaleLocal(sx,sy);
                    selection.callIf(spr => spr.type.normalisable, "normalize");
                    sprites.cleanup();
                    widget.update();
                }
            }
        },
        name : {
            autoComplete: ["?", "selected", "selected images", "selected sprites"],
            help : "> sets variouse object names ?` for help",
            helpExtended : [
                "> name selected sprites `name` : Name selected items 'new name'",
                ">                              : If the name is not unique the name",
                ">                              : will be post fixed with a number",
                "> name selected images `name` : Name selected images 'new name'",
                ">                             : If more than one image selected",
                ">                             : Image names will be numbered",

            ],
            f(args){
                if (showHelp("name",args)) { return  }
                args = tokenize(args);
                if (args.length < 4) {
                    log.warn("Missing arguments");
                    showHelp("name","?");
                    return;
                }
                args.shift();
                const which = args.shiftVal().toLowerCase();
                const what = args.shiftVal().toLowerCase();
                const name = args.shift().value;
                if (which === "selected" || which === "sel") {
                    if (what === "images") {
                        let idx = 1, count = 0;
                        selection.eachImage(() => count++);
                        const dig = Math.log10(count + 1) | 0 + 1;
                        if (count > 1) { selection.eachImage((spr, image) => { image.desc.name = name + ((idx++).toString().padStart(dig,"0")) }) }
                        else { selection.eachImage((spr, image) => { image.desc.name = name }) }

                    } else if (what === "sprites") {
                        selection.each(spr=> {
                            if(what === "images") {
                                if (spr.type.image) {
                                    spr.image.desc.name = name;
                                }
                            } else if(what === "sprites") {
                                spr.name = NAMES.register(name);
                            }
                        });
                    }
                    spriteList.update();
                }
            }
        },
        font : {
            autoComplete: ["?", "list"],
            help : "> Sets selected text sprites tonamed system font. ?` for help",
            helpExtended : [
                "> font",
                ">     : lists names of selected text sprite fonts.",
                "> font list",
                ">     : Displays list of known fonts.",
                "> font 'font name'",
                ">     : Sets selected text sprite font to 'font name'",
                ">     : If name not found will display browser default",
                "> font 'font name' size",
                ">     : Font to 'font name'",
                ">     : Font base size in pixels. Value must be >= 6",
            ],
            f(args){
                if (showHelp("font",args)) { return  }
                args = tokenize(args);
                if (args.length < 2) {
                    log.warn("Missing arguments");
                    showHelp("font","?");
                    return;
                }
                var fontName, fontBaseSize;
                if (args.length === 1) {
                    args.shift();
                    const names = new Set();
                    selection.eachOfType(spr => names.add(spr.textInfo.font + " " + spr.textInfo.size), "text");
                    for (const name of names) { log(name); }
                    return;
                }
                if (args.length === 2) {
                    args.shift();
                    fontName = args.shiftVal();
                    if (fontName === "list") {
                        const showAllFonts = () => {
                            for (const font of APIs.knownFonts) { 
                                log.command(font, "font \"" + font + "\"");
                            }
                        }
                        showAllFonts();
                        return;
                        
                    }
                } else if (args.length >= 3) {
                    args.shift();
                    fontName = args.shiftVal();
                    fontBaseSize = Number(args.shiftVal());
                } else {
                    log.warn("Missing arguments");
                    showHelp("font", "?");
                    return;              
                }                    
                isNaN(fontBaseSize) || fontBaseSize < 6 && (fontBaseSize = undefined);
                const setFonts = () => {
                    var textSprs = new Set();
                    selection.eachOfType(spr => { textSprs.add(spr.textInfo) }, "text");
                    for (const t of textSprs) { t.setFont(fontName, fontBaseSize) }    
                    setTimeout(() => {
                        selection.eachOfType(spr => spr.textInfo.update(), "text");
                        widget.update();
                    }, 1000);                    
                    
                };
                loadGoogleFont(fontName, setFonts);
                /*setTimeout(() => {
                    selection.eachOfType(spr => spr.key.update(), "text");
                    widget.update();
                }, 1000);*/
                    
                
            }
        },
        draw : {
            batchOnly: true,
            help : "> Turn on/off drawing mode",
            helpExtended : [
                "> draw on : Turn on draw mode",
                "> draw off : Turn off draw mode",
                "> draw : Toggles draw mode",
            ],
            f(args){
                if(showHelp("draw",args)){ return }
                args = tokenize(args);
                args.shift();
                var com = args.shiftVal();
                if(com === undefined) {
                    com = !editSprites.drawingModeOn;
                }else if(com.toLowerCase() === "on") {
                    if (editSprites.drawingModeOn) { return }
                    com = true;
                }else if(com.toLowerCase() === "off") {
                    if (!editSprites.drawingModeOn) { return }
                    com = false;
                } else {
                    com = !editSprites.drawingModeOn;
                }
                uiPannelList.paint.toggleShow();



            }
        },
        run : {
            help : "> Runs painter script. `run scriptName [arg [arg ... []]]`  or `run ?` for help",
            helpExtended : [
                "> run name : Runs script named name",
                "> run safe name : Runs script only if no  dialog is open",
                "> run name ?: Displays help for script if available",
                "> run name extensionName : Runs script named name, calling extentionName just befor script is run",
                "> run safe name extensionName : Runs script  only if no  dialog is open, calling extentionName just befor script is run",
                "> List of known scripts ",
                //...batches.map(b => "> "+b.name+" : " + b.help )
            ],
            f(args){
                if(showHelp("run",args)){
                    batches.map(b => "run "+b.name ).forEach(b => log(b));
                    return;
                }
                args = tokenize(args);
                args.shift();
                var name = args.shiftVal();
                var name1 = args.shiftVal();
                var name2 = args.shiftVal();
                var helpOnly = false;
                if (name1 === "?") {
                    helpOnly = true;
                } else if (name === "safe") {
                    if (quickMenu.open) {
                        log.info("Existing dialog should be closed!");
                        return;
                    }
                    name = name1;
                    name1 = name2;
                } else {
                    name2 = undefined;
                }
                fileReadWriter.load("pscripts/" + name + ".pscript", (file) => {
                    if (file.status === "loaded") {
                        const bat = file.ajax.responseText;
                        if (helpOnly && bat.includes("assert help")) {
                            lineCommands.run.assertHelp = true;
                            batchHandler.run({args, name, lines: bat.split("\n")});
                        } else {
                            lineCommands.run.assertHelp = false;
                            if (name1 !== undefined) {
                                const extAPI = system.getExtension(name1);
                                if (extAPI?.ext?.runExtension) {
                                    const batch = extAPI.ext.runExtension({args, name, lines: bat.split("\n")});
                                    if (batch) {
                                        batchHandler.run(batch);
                                    } else {
                                        log.error("Run could not run extension '" + name1 + "'");
                                    }
                                } else {
                                    log.warn("Run did no find extention '" + name1 + "'");
                                    batchHandler.run({args, name, lines: bat.split("\n")});
                                }
                            } else {
                                batchHandler.run({args, name, lines: bat.split("\n")});
                            }
                        }
                    } else { log.error("Could not run script '"+ name + "' " + file.status) }
                },true);
            }
        },       
        /*extend : {
            help : "> ",
            helpExtended : [
                ""
            ],
            f(args){
                if(showHelp("extend",args)){
                    batches.map(b => "extend "+b.name ).forEach(b => log(b));
                    return;
                }
                args = tokenize(args);
                args.shift();
                var name = args.shiftVal();
                var name1 = args.shiftVal();
                var helpOnly = false;
                if (name1 === "?") {
                    helpOnly = true;
                } else if (name === "safe") {
                    if (quickMenu.open) {
                        log.info("Existing dialog should be closed!");
                        return;
                    }
                    name = name1;
                }
                fileReadWriter.load("pscripts/" + name + ".pscript", (file) => {
                    if (file.status === "loaded") {
                        const bat = file.ajax.responseText;
                        if (helpOnly && bat.includes("assert help")) {
                            lineCommands.run.assertHelp = true;
                            batchHandler.run({args, name, lines: bat.split("\n")});
                        } else {
                            lineCommands.run.assertHelp = false;
                            batchHandler.run({args, name, lines: bat.split("\n")});
                        }
                    } else { log.error("Could not run script '"+ name + "' " + file.status) }
                },true);
            }
        },    */     
        setsize : {
            help : "> sets size of create sprites",
            helpExtended : [
                "> setsize size : size in pixels of the next created sprite",
            ],
            f(args){
                if (showHelp("setsize",args)) { return  }
                args = args.toLowerCase().replace(/ +/g," ").split(" ");
                if(!isNaN(args[1])){
                    info.size = Number(args[1])
                }else{
                    log.error("Size is not a number");
                }
            }
        },
        sel : {
            autoComplete: ["?", "x", "y", "sx", "sy", "rx", "ry", "cx", "cy", "w", "h"],
            help : "> Proxy for selection array",
            helpExtended : [
                "> sel property1 [property2] ...: lists selected sprite and the value of the property",
                "> sel property = val: Sets all selected with property to val.",

            ],
            f(args){
                if (showHelp("sel",args)) { return  }
                log(">"+args);
                const tokens = tokenize(args);
                if(selection.length === 0) {
                    log("No sprites selected.");
                } else if(tokens.length > 2 && args.indexOf("sel ") === 0 && tokens[2].type === valueTypes.token && assignmentTokens.includes(tokens[2].token)) {
                    tokens.shift()
                    var prop = tokens.shiftVal();
                    const assignment = tokens.shift();
                    var val = tokens.shift();
                    var count = 0;
                    selection.markAnimatedForChange();
                    selection.each((spr, i) => {
                        const pSpr = createSpriteProxy(spr);
                        if(typeof pSpr[prop] !== "function") {
                            if (assignment.token === tokensNamed.assign) {
                                pSpr[prop] = inBatch ? tokens.evalVal(val).value : tokens.evalValCommandScope(tokens.copyToken(val)).value;
                                log ("sprite." + prop + " = " + pSpr[prop]);
                            } else if (assignment.token === tokensNamed.assignAdd) {
                                const was = pSpr[prop]
                                pSpr[prop] -= -(inBatch ? tokens.evalVal(val).value : tokens.evalValCommandScope(tokens.copyToken(val)).value);
                                log ("sprite." + prop + " = " + was + " + " + pSpr[prop]);
                            } else if (assignment.token === tokensNamed.assignSub) {
                                const was = pSpr[prop]
                                pSpr[prop] -= inBatch ? tokens.evalVal(val).value : tokens.evalValCommandScope(tokens.copyToken(val)).value;
                                log ("sprite." + prop + " = " + was + " + " + pSpr[prop]);
                            } else if (assignment.token === tokensNamed.assignMult) {
                                const was = pSpr[prop]
                                pSpr[prop] *= inBatch ? tokens.evalVal(val).value : tokens.evalValCommandScope(tokens.copyToken(val)).value;
                                log ("sprite." + prop + " = " + was + " + " + pSpr[prop]);
                            } else if (assignment.token === tokensNamed.assignDiv) {
                                const was = pSpr[prop]
                                pSpr[prop] /= inBatch ? tokens.evalVal(val).value : tokens.evalValCommandScope(tokens.copyToken(val)).value;
                                log ("sprite." + prop + " = " + was + " + " + pSpr[prop]);
                            } else if (assignment.token === tokensNamed.assignPow) {
                                const was = pSpr[prop]
                                pSpr[prop] **= inBatch ? tokens.evalVal(val).value : tokens.evalValCommandScope(tokens.copyToken(val)).value;
                                log ("sprite." + prop + " = " + was + " + " + pSpr[prop]);
                            }
                            count ++;
                        }

                    });
                    if("x,y,rx,ry,sx,sy,cx,cy,w,h".split(",").indexOf(prop) > -1) {
                        selection.forEach((spr,i) => spr.key.update());

                        widget.update();
                    }
                    selection.checkForAnimatedChanges();
                    spriteList.updateInfo();
                    log("Property '" + prop + "' set for "+ count + " sprites");



                }else if(args.indexOf("sel ") === 0) {

                    args = tokenize(args);
                    args.shift()
                    const props = [];
                    while (args.length) {
                        props.push(args.shiftVal());
                    }
                    //var val = args.shift();
                    var count = 0;

                    //const props = args.replace(/  /g," ").split(" ");
                    //props.shift()
                    var count = 0;
                    selection.forEach((spr, i) => {
                        const pSpr = createSpriteProxy(spr);
                        var str = "["+i+"]:"
                        for(const prop of props) {
                            const p = pSpr[prop];
                            if(p !== undefined && typeof p !== "object") {
                                if(isNaN(p)) {
                                    str += " "+p;
                                } else {
                                    str += " "+Number(p.toFixed(3));
                                }
                                count ++;
                            }
                        }
                        log(str);
                    });
                    if(count === 0) {
                        log("No properties named " + props.join(" ") + " found in selection");
                    }
                }
            }

        },
        selected : {
            autoComplete: ["?", "as", "array", "first", "next", "-", "+"],
            help : "> Returns properties of selected sprite",
            helpExtended : [
                "> selected as name : Adds selected as global variable named name",
                "> selected first name: Selects the first selected item as named variable name",
                "> selected next name : Selects the next selected item as named variable name",
                ">                      When next is past last sprite variable is undefined",
                "> selected array name : Adds selected as global array named name",
                "> selected - name : Remove selected from named selection",
                "> selected + name : Adds selected from named selection",
                "> selected < propName value : Adds selected from named selection",
            ],
            f(args){
                if (showHelp("selected",args)) { return  }
                args = tokenize(args);
                args.shiftVal();
                var com = args.shiftVal();
                if(com === "first"){
                     lineCommands.selected.selectedIndex = undefined;
                     com = "next"
                }
                if(com === "next"){
                    if(lineCommands.selected.selectedIndex === undefined){
                        lineCommands.selected.selectedIndex = 0;
                    }
                    var name = args.shiftVal();
                    if(lineCommands.selected.selectedIndex >= selection.length){
                        if(inBatch){
                            batchHandler.global[name] = undefined;
                        }else{
                            commandScope[name] = undefined;
                            log("No next selected sprite index. '" + name + "' set to undefined");
                        }
                        lineCommands.selected.selectedIndex = undefined;
                    }else{
                        if(inBatch){
                            batchHandler.global[name] = createSpriteProxy(selection[lineCommands.selected.selectedIndex]);
                        }else{
                            commandScope[name] = createSpriteProxy(selection[lineCommands.selected.selectedIndex]);
                            log("Sprite index "+lineCommands.selected.selectedIndex+" selected  as $" + name);
                        }
                        lineCommands.selected.selectedIndex ++;
                    }
                } else if(com === "array"){
                    if(selection.length > 0){
                        var name = args.shiftVal();
                        if(inBatch){
                            batchHandler.global[name] = selection.map(spr => createSpriteProxy(spr));
                        }else{
                            commandScope[name] = selection.map(spr => createSpriteProxy(spr));
                            log("Selection as array $" + name);
                        }
                        
                    }else{
                        log.error("There are no sprites selected");
                        if(inBatch){
                            throw new RangeError("No selected sprites");
                        }
                    }                   
                } else if(com === "as"){
                    if(selection.length > 0){
                        var name = args.shiftVal();
                        lineCommands.selected.selectedIndex = 0;
                        if(inBatch){
                            batchHandler.global[name] = createSpriteProxy(selection[0]);
                        }else{
                            commandScope[name] = createSpriteProxy(selection[0]);
                            log("First sprite selected  as $" + name);
                        }
                        lineCommands.selected.selectedIndex = selection.length > 1 ? 1 : undefined;
                    }else{
                        log.error("There are no sprites selected");
                        if(inBatch){
                            throw new RangeError("No selected sprites");
                        }
                    }
                }else if(com === ">" || com === "+" || com === "-"){
                    var name = args.shiftVal();
                    var ids = selection.asGUIDArray();
                    if (com === ">") {
                        namedSelections[name] = ids;
                    } else if(com === "+") {
                        namedSelections[name] = utils.arrayMerge(namedSelections[name],ids);
                    } else {
                        namedSelections[name] = utils.arrayRemove(namedSelections[name],ids);
                    }
                    if(selection.length === 0){
                        log.warn("Named selection is empty.");
                    }else{
                        if(!inBatch){
                            log.info("Named selection '" + name + "' with " + namedSelections[name].length + " sprites.");
                        }
                    }
                }else{
                    log.error("Unknown argument for selected command");
                }
            }
        },
        select : {
            autoComplete: ["?","*", "#", "^", "!", "+", "-"],
            help : "> Selects sprites.",
            helpExtended : [
                "> select *  : select all",
                "> select    : select top most sprite",
                "> select # string : selects sprites with name containing string",
                "> select ^ string : selects sprites with name containing string case insensitive",
                "> select !  : Clear selection",
                "> select < name   : Selects named selection",
                ">                 : To create a named selection use selected > selectionName",
                "> select + name   : Add named selection to selected",
                "> select - name   : Remove named selection from selected",
                "> select [name [name1 [name2 ....]]]",
                ">             name of selected sprites",
                "> select [index [index1 [index2 ....]]]",
                ">             Index of selected sprites",
                ">             -index selects from top sprite",
            ],
            f(args){
                if (showHelp("select",args)) { return  }
                args = tokenize(args);
                args.shiftVal();
                if(args.length === 0){
                    selection.clear();
                    selection.add(sprites[sprites.length - 1]);
                }else{
                    var val = args.shiftVal();
                    if(isNaN(val)){
                        if(val === "#" || val[0] === "#" || val === "^" || val[0] === "^") { 
                            const matchCase = val[0] === "#";
                            let name = args.shiftVal();                            
                            if (val.length > 1) {
                                name = val.slice(1) + (name !== undefined ? " " + name : "");
                            }
                            const nameC = matchCase ? name : name.toLowerCase();
                            if (matchCase) {
                                sprites.select(spr => spr.name.includes(nameC));
                            } else {
                                sprites.select(spr => spr.name.toLowerCase().includes(nameC));
                            }
                                
                            if (selection.length) {
                                log.info("Selected " + selection.length + " sprites with name containing '" + name + "'");
                            } else {
                                log.info("No sprites contain the str '" + name + "'");
                            }
                            return;
                        }
                        if(val === "!"){ selection.clear() }
                        if(val === "*"){ issueCommand(commands.spritesSelectAll) }
                        else if(val === "<" || val === "+" || val === "-"){
                            const name = args.shiftVal();
                            if(val === "<"){ selection.clear() }
                            if(namedSelections[name] === undefined){
                                log.warn("No selection named '"+name+"'");
                            }else{
                                for(const guid of namedSelections[name]){
                                    const spr = sprites.getByGUID(guid);
                                    if(spr) {
                                        if(val === "-"){
                                            selection.remove(spr)
                                        }else{
                                            selection.add(spr)
                                        }
                                    }
                                }
                            }
                        }else{
                            if(!selection.addByName(val )){
                                if(!selection.addByImageName(val)){
                                    log.info("Could not find sprite named '"+val+"'");
                                }
                            }
                            while(args.length){
                                val = args.shiftVal();
                                if(!selection.addByName(val )){
                                    if(!selection.addByImageName(val)){
                                        log.info("Could not find sprite named '"+val+"'");
                                    }
                                }
                            }
                        }
                    }else{
                        val = Math.floor(Number(val));
                        if(val < 0){ val = sprites.length + val }
                        val = val < 0 ? 0 : val > sprites.length - 1 ? sprites.length - 1 : val;
                        selection.add(sprites[val]);
                        while(args.length){
                            val = args.shiftVal()
                            if(!isNaN(val)){
                                var val = Math.floor(Number(val));
                                if(val < 0){ val = sprites.length + val }
                                val = val < 0 ? 0 : val > sprites.length - 1 ? sprites.length - 1 : val;
                                selection.add(sprites[val]);
                            }
                        }
                    }
                }
            }
        },
        scene : {
            autoComplete: ["?","name"],
            help : "> Sets and gets scene information",
            helpExtended : [
                "> scene name: displays scene name",
                "> scene name [name]: sets the scene name",
                "> NOTE: Scene names have restrictions.",
                ">       The following names can not be used",
                ">          " + storage.localStorageNames[0],
                ">          " + storage.localStorageNames[1],
                ">          " + storage.localStorageNames[2],
            ],
            f(args){
                if (showHelp("scene",args)) { return  }
                args = tokenize(args);
                args.shift();
                const subCommand = args.shiftVal();
                if(subCommand === "name") {
                    if(args.length === 0) {
                        log("Scene name '"+sprites.sceneName + "'");
                    } else {
                        const newName = args.joinVal(" ");
                        if (storage.localStorageNames.includes(newName)) {
                            log.warn("'" + newName + "' is a protected name and can not be used.");
                        } else {
                            sprites.sceneName = newName;
                            document.title = "V3 '" + sprites.sceneName + "'";
                            log("Scene name changed to '"+sprites.sceneName + "'");
                        }
                    }
                }
            }
        },
        load : {
            help : "> Load media",
            helpExtended : [
                "> load * : Clickable file history list",
                "> load mediaURL : mediaURL location of file",
                "> load painter.json : Loads a JSON URL and if",
                "                       correctly formated loads",
                "                       its content. Must include .json ",
                "                       in the name. ",
            ],
            f(args){
                if (showHelp("load",args)) { return  }
                if (args.toLowerCase().trim() === "load *") {
                    lineCommands.com.f("com sysShowFileHistory");
                    return;
                }
                args = args.toLowerCase().replace(/ +/g," ").split(" ");
                if(args[1].indexOf(".json") === args[1].length - 5) {
                    storage.loadJSON(args[1])
                        .then(()=>{})
                        .catch(e=> {
                            log.warn("Could not load file " + args[1]);
                            log.warn("Error : " + e.status);
                        });

                }else {
                    media.create(args[1], (image) => {
                        if(image){
                            if(args[2] === "add") {
                                setTimeout(() => {
                                    mediaList.selected.clear();
                                    mediaList.selected.add(image);
                                    issueCommand(commands.mediaAddToWorkspace);
                                    issueCommand(commands.edSprResetViewFit);

                                }, 200);
                            }
                        } else {
                            log.error("Could not load media.");
                            return;
                        }
                    });
                }
            }
        },
        save : {
            autoComplete: ["?", "scene", "image", "pen"],
            help : "> save state",
            helpExtended : [
                "> save pen [filename] : Saves the current pen's state to filename.json",
                "> save pen : Saves the current pen's state. The filename is auto generated",
            ],
            f(args){
                if (showHelp("save",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift()
                const com = args.shiftVal();
                if(com === "scene"){
                    log.warn("This function is not yet implemented");
                } else if(com === "image"){
                    log.warn("This function is not yet implemented");
                } else if(com === "pen"){
                    var name = args.shiftVal();
                    if(name === undefined || name.trim() === ""){
                        var penName = paint.currentDrawName;
                        if(penName !== undefined){
                            name = "PainterPen_" + paint.currentDrawName;
                        }else{
                            name = "PainterPen_Unknown";
                        }
                    }
                    const state = paint.copyPenState();
                    log.info("Downloading current pen state as '"+name + ".json`");
                    setTimeout(()=>{
                        downloadText(JSON.stringify(state),name + ".json");
                    },0);
                }else{
                    log.warn("Unknown save type!. Use save ? for more info.");
                }
            }
        },
        pen : {
            batchOnly: true,
            help : "> pen commands let you paint using the paint tools",
            helpExtended : [
                "> pen ((down | d) | (move | m)) x y [[(move | m) x y [x y ...[x y]]] up [x y]]",
                "> A pen command has 3 actions",
                ">     down x y Location to start at",
                ">     move x y [x y...] A location/s to move to",
                ">              There can be many move locations",
                ">     up [x y] Lift pen. If no location given then",
                ">              Pen is lifted at the last given x y",
                "> If you start with a move command the first x y will",
                "> be used to send the down command.",
                "> Pen actions will depend on the current paint settings",
                "> You can change paint settings with 'com' commands ",
                "> (Coming soon paint commands to use easy to remeber setting)",
                ">",
                "> You can use variables or expresions for x and y coordinates",
                "> however they must evaluate to numbers. The pen command",
                "> will first vet all its parts and only start if all is valid.",
                ">",
                "> Pen commands requier realtime rendering and may requier some",
                "> time to commplete. During this time the UI will be locked.",
                "> You can cancel the pen command using [esc] which will issuse a ",
                "> pen up (At current location) and stop.",
            ],
            f(args){
                if (showHelp("pen",args)) { return  }
                if (!editSprites.drawingModeOn) {
                    log.warn("Can not use pen, as not in painting mode");
                    return;
                }
                const penComList = [];
                var firstComOk = false;
                var str = args;
                args = tokenize(args);
                args.shift();
                try {
                    while(args.length) {
                        const com = args.shiftVal().toLowerCase();
                        if (typeof com === "string" && (
                            com[0] === "d" || com[0] === "m" || com[0] === "u")){
                            penComList.push(com[0]);
                            firstComOk = true;
                        }else if (isNum(com) && firstComOk){
                            var x = Number(com);
                            var y = Number(args.shiftVal());
                            if(isNaN(x) || isNaN(y)){
                                throw new Error("Coordinate pair is not valid '" + x + " " + y +"'" );
                            }else if(x < - 32000 || x > 32000 || y < -32000 || y > 32000){
                                throw new Error("Coordinate is out of range (-32000 to 32000)");
                            }
                            penComList.push(x,y);
                        }else{
                            throw new Error("Unknown pen sub command '"+com+"'");
                        }
                    }
                    log("Pen command evaluated and sent. Hit [esc] to stop.");
                    setTimeout(()=>pens.processPenCommandList(penComList),0);
                }catch(e){
                    log.warn("Pen command error");
                    log.warn(e.message);
                }
            }
        },
        color: {
            autoComplete: ["?", "list", "main", "second"],
            help : "> Show colors from pallet",
            helpExtended : [
                "> color list: Lists colors as CSS hex values in log",
                "> color main: Logs CSS hex of main color",
                "> color second: Logs CSS hex of second color",

            ],
            f(args){
                if (showHelp("color",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift();
                var a1 = args.shiftVal();
                if (a1 === "main") {
                    log.info("Main color")
                    log(colours.mainColor.css);
                    log(utils.RGB2CSSHex(colours.mainColor));
                    
                } else if (a1 === "second") {
                    log.info("Second color");
                    log(colours.secondColor.css);
                    log(utils.RGB2CSSHex(colours.secondColor));
                    
                } else if (a1 === "list") {
                    let colStr = "";
                    let s = "";
                    let count = 0;

                    colours.each(col => {
                        colStr += s + utils.RGB2CSSHex(col);
                        count ++;
                        s = ", ";
                    })
                    log("Current pallet contains " + count + " colors");
                    log(colStr);
                } else {
                    log.warn("Unknown color command");
                }
            }
        },    
        pallet: {
            autoComplete: ["?", "new", "remove", "list", "main", "second"],
            help : "> Create or modify a pallet",
            helpExtended : [
                "> pallet new [col ... n]: creates a new pallet",
                "> pallet [col ... n]: adds one or more colors to existing pallet",
                "> pallet remove [col ... n]: removes one or more colors from existing pallet",
                "> pallet list: Lists colors as CSS hex values in log",
                "> pallet main: Logs CSS hex of main color",
                "> pallet second: Logs CSS hex of second color",

            ],
            f(args){
                if (showHelp("pallet",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift();
                var a1 = args.shiftVal();
                if (a1 === "main") {
                    log.info("Main color")
                    log(colours.mainColor.css);
                    log(utils.RGB2CSSHex(colours.mainColor));
                    
                } else if (a1 === "second") {
                    log.info("Second color");
                    log(colours.secondColor.css);
                    log(utils.RGB2CSSHex(colours.secondColor));
                    
                } else if (a1 === "list") {
                    let colStr = "";
                    let s = "";
                    let count = 0;

                    colours.each(col => {
                        colStr += s + utils.RGB2CSSHex(col);
                        count ++;
                        s = ", ";
                    })
                    log("Current pallet contains " + count + " colors");
                    log(colStr);
                } else if (a1 === "new") {
                    if (!uiPannelList.color.isOpen) {
                        log.warn("Color pannel must be open to create a new pallet");
                        return;
                    }
                    issueCommand(commands.edSprCreatePallet);
                    const palSpr = selection[0];
                    a1 = args.shiftVal();
                    while (a1) {
                        a1 = utils.CSS2RGB(a1)
                        palSpr.pallet.addColor(a1.r, a1.g, a1.b);
                        a1 = args.shiftVal();
                    }
                    palSpr.pallet.clean();
                    palSpr.setScale(8,8);
                    selection.clear();
                    selection.add(palSpr);


                } else if (a1 === "remove") {
                    if (!uiPannelList.color.isOpen) {
                        log.warn("Color pannel must be open to add or remove colors");
                        return;
                    }
                    a1 = args.shiftVal();
                    while (a1) {
                        colours.removeColor(utils.CSS2RGB(a1));
                        a1 = args.shiftVal();
                    }


                } else {
                    if (!uiPannelList.color.isOpen) {
                        log.warn("Color pannel must be open to add or remove colors");
                        return;
                    }
                    if (a1) {
                        colours.addColor(utils.CSS2RGB(a1));
                        a1 = args.shiftVal();
                        while (a1) {
                            colours.addColor(utils.CSS2RGB(a1));
                            a1 = args.shiftVal();
                        }
                    }
                }
            }
        },
        create : {
            autoComplete: ["?", "image", "sprite", "row"],
            help : "> Create an object.",
            helpExtended : [
                "> create image name w [h] [sel] : creates an image",
                ">             name of image",
                ">             w is width",
                ">             h is height optional",
                ">             sel if include image is selected",
                ">             in media tab",
                "> eg create image 128 128",
                ">    create image 128",
                ">    create image 128 128 sel",
                "> create sprite name x y : create sprite",
                ">        name is image name",
                ">        x y is location of sprite center",
                "> create row y name name ... name",
                ">        creates a row of named sprites ",
            ],
            f(args){
                if (showHelp("create",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift()
                const com = args.shiftVal();
                if(com === "sprite"){
                    var name = args.shiftVal();;
                    var x = args.shiftVal();;
                    var y = args.length > 0 ? args.shiftVal() : x;
                    if(isNum(x) && isNum(y)){
                        var image = media.byName(name);
                        if(image) {
                            var sprite = new Sprite(x * info.size, y * info.size, image.w, image.h,"Batch created ");
                            sprite.changeImage(image);
                            sprites.add(sprite);
                        }else{
                            log.error("No image by name '"+name+"'");
                        }
                    }else{
                        log.error("Bad arguments for command string ");
                        log.warn(str);
                    }
                }
                if(com === "image"){
                    var name = args.shiftVal();;
                    var w = args.shiftVal();;
                    var h = args.length > 0 ? args.shiftVal() : w;
                    var selectOnCreate = false
                    h = h === "sel" ? (selectOnCreate = true, w) : h;
                    var sel = args.length > 0 ? args.shiftVal() : "";
                    selectOnCreate = sel === "sel" ? true : selectOnCreate;

                    if(isNum(w) && isNum(h)){
                        media.create({
                                name : name,
                                type : "canvas",
                                width : w,
                                height : h
                        }, (m) => {
                            if(selectOnCreate) {
                                setTimeout(()=>mediaList.mediaSelected.add(m),100);
                            }
                        });
                    }else{
                        log.error("Bad arguments for command string ");
                        log.warn(str);
                    }
                }
                return
                if(args[1] === "row"){
                    var name;
                    var idx = 2;
                    if(!isNaN(args[idx])){
                        var y = Number(args[idx++]) | 0;
                        var x = 0;
                        while(idx < args.length){
                            var image = media.byName(args[idx++]);
                            if(image) {
                                var sprite = new Sprite(x * info.size, y * info.size, image.w, image.h, "*" + image.name);
                                sprite.changeImage(image);
                                sprites.add(sprite);
                                x += 1;
                            }
                        }
                        return;
                    }
                    log.error("Bad arguments row. ? for help");
                }
                if(com === "image"){
                    var name;
                    var idx = 2;
                    if(isNaN(args[idx])) {
                        name = args[idx ++];
                    }
                    if(!isNaN(args[idx])){
                        const w = Number(args[idx++]) | 0;
                        var h = w;
                        if(!isNaN(args[idx])){ h = Number(args[idx]) | 0 }
                        if(w > 0 && h > 0){
                            media.create({
                                name : name,
                                type : "canvas",
                                width : w,
                                height : h
                            });
                            //log.sys("Created image " + w +" by " + h );
                            return;
                        }
                    }
                    log.error("Bad arguments could not create image. create ? for help");
                    return;
                }
                log.error("Create is missing arguments. create ? for help");
            }
        },
        filter : {
            autoComplete: namedGLFilters,
            help : "> Apply filter to selected",
            helpExtended : [
                "> filter  : Displays a list of avialible filters",
                "> filter list : Displays a list of avialible filters",
                "> filter list name : displays a list of filters containg name",
                "> filter filterName ? : Displays information about the filter.",
            ],
            f(args){
                if (showHelp("filter",args)) { return  }
                if(filterGL === undefined){
                    log.warn("WebGL filters have not loaded.");
                    return;
                }
                var str = args;
                args = tokenize(args);
                args.shift()
                const filterName = args.shiftVal();
                if(filterName === undefined || filterName === "list"){
                    var filterMatch = args.shiftVal();
                    log.sys("======================================================");
                    if (filterMatch !== undefined) {
                        log.sys("List of filers with names containing '" + filterMatch+"'");
                        filterMatch = filterMatch.toString().toLowerCase();
                    } else {
                        log.sys("List of filters");
                    }
                    filterGL.filters.availableFilters().forEach(filterName => {
                        if (filterMatch === undefined || (filterName.toLowerCase().includes(filterMatch))) {
                            log(filterName);
                        }
                    });
                    log.sys("======================================================");
                }else{
                    var filter = filterGL.filters.getFilter(filterName);
                    if(filter === undefined){
                        log.warn("Filter '"+filterName+"' does not exist.");
                    }else{
                        const arg1 = args.shiftVal();
                        if(arg1 === "?" || arg1.toLowerCase() === "help"){
                            log("=====================================================");
                            log("Filter  : '" + filterName + "'");
                            if(typeof filter.description === "string"){
                                log(filter.description);
                            }else{
                                log("About   : " + filter.description.text);
                                log("Author  : " + filter.description.author);
                                log("Contact : " + filter.description.contact);
                            }
                            log("-Arguments ------------------------------------------");
                            filter.arguments.forEach(arg => {
                                log("Name: '" + arg.name + "' Type: " + arg.type + " Desc: '"+ arg.description +"'");
                                if (arg.type === "Number") {
                                    log("    Min: " + arg.range.min + " Max: " + arg.range.max + " default: " + arg.range.def );
                                } else if (arg.type === "String") {
                                    log("    String options: '" + arg.range.join("', '") + "'");
                                } else if (arg.type === "Image") {
                                    log("    Reference image by name or id");
                                }
                                log("-----------------------------------------------------");
                            });
                            log("=====================================================");
                        }else if(selection.length === 0){
                            log.warn("No sprites selected, could not apply filter");
                        }else{
                            var count = 0;
                            var drawOn = 0;

                            const fArgs = filterGL.filters.getFilterDefaultsArguments(filterName);
                            let i = 0;
                            if (arg1 !== undefined) { fArgs[i++] = arg1 }
                            while (args.length) {
                                 fArgs[i++] = inBatch ? args.evalVal(args.shift()).value : args.evalValCommandScope(args.shift()).value;
                             }
                            filter.arguments.forEach((arg,i) => {
                                if (arg.type === "Number") { fArgs[i] = Number(fArgs[i]) }
                                else if(arg.type === "Boolean") {fArgs[i] = fArgs[i] == "true" }
                            })

                            selection.processImages((image,index) => {
                                if(image.isDrawable){
                                    if(!filter.webGLFilters.isSourceTextureSet()){
                                        filter.webGLFilters.sourceTexture = filter.webGLFilters.createTexture(image,image.width,image.height);
                                    }
                                    filter.webGLFilters.setSource(image);
                                    filter.callback(...fArgs).show();
                                    image.ctx.setTransform(1,0,0,1,0,0);
                                    image.ctx.clearRect(0,0,image.width, image.height);
                                    image.ctx.drawImage(filter.webGLFilters.canvas,0,0);
                                    count += 1;
                                    return true;
                                }
                                return false;
                            })
                            if(count){
                                sprites.updateProcessed();
                                log("Filter applied to "+ count + " image/s");
                            }else{
                                log("Filter was not applied to any image");
                            }
                            if(drawOn) { log("Some drawable images were marked as dont draw on.") }
                        }
                    }
                }
            }
        },
        sprite : {
            autoComplete: ["?",
                "grid",
                ... Object.keys(spriteRender.gridSpecialNames).map(name => "grid " + name),
                "gridX", "gridY", "gridXY", "hideOutline true", "hideOutline false", "scaleable true", "scaleable false"],
            help : "> Lets you change sprite [selected or by id] properties by name.",
            helpExtended : [
                "> sprite id property value : Change sprite",
                ">                          : with id",
                ">                          : property to set",
                ">                          : value to use",
                "> sprite property value",
                ">             propery to change",
                ">             value new value of propery",
                ">  Avialible properties ",
                ">  grid : Assign special render type to grid",
                ... Object.keys(spriteRender.gridSpecialNames).map(name => "    : " + name),
                ">  gridX : number of x grid lines 0-32 ",
                ">  gridY : number of y grid lines 0-32",
                ">  gridXY : number of x and y grid lines 0-32",
                ">  hideOutline : stops sprite drawing an outline. Value true or false",
                ">  scaleable : Set sprite (only cutters) size by scale (true) or size (false)",
            ],
            f(args){
                if (showHelp("sprite",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift();
                var spritesToChange;
                var value, prop = args.shiftVal();
                if(!isNaN(prop)) {
                    var id = prop;
                    const spr = sprites.getById(Number(prop));
                    if(spr === undefined) {
                        log.warn("Could not find sprite by id : " + prop);
                        return;
                    }
                    spritesToChange = [spr];
                    prop = args.shiftVal();
                    value = args.shiftVal();
                } else {
                    if(selection.length === 0) {
                        log.warn("There are no sprites selected!");
                        return;
                    }

                    spritesToChange = selection.asArray();
                    value = args.shiftVal();

                }

                const names = {
                    mark(val) { log(val);  return val },
                    hideOutline(val) { return val.toLowerCase() === "true" },
                    gridX(val) {
                        if (isNaN(val)) { return }
                        val = Math.abs(Number(val)) | 0;
                        val = val < 1 ? 1 : val > 32 ? 32 : val;
                        return val;
                    },
                    gridY(val) { return names.gridX(val) },
                    gridXY(val) { return names.gridX(val) },
                    grid(val) { return spriteRender.gridSpecialNames[val] },
                    scaleable(val) { return val.toLowerCase() === "true" },
                };
                const transformName = {
                    mark : ["marker"],
                    gridXY : ["gridX", "gridY"],
                    grid : ["gridSpecial"],
                    scaleable: ["normalize"],
                };
                if(names[prop]){
                    const propName = transformName[prop] ? transformName[prop] : [prop];
                    value = names[prop](value);
                    if (value !== undefined) {
                        spritesToChange.forEach(spr => {
                            propName.forEach(pName => {
                                if(spr[pName] !== undefined){
                                    if (typeof spr[pName] === "function") { spr[pName](value) }
                                    else { spr[pName] = value }
                                }
                            });
                        });

                        if(spritesToChange.length === 1) {
                            log.sys("Sprite" + spritesToChange[0].guid + "."+prop+" = " + value);
                        } else {
                            log.sys(spritesToChange.length + " sprites changed to sprite."+prop+" = " + value);
                        }

                    } else {
                        log.warn("Invalid property value.");
                    }
                }else{
                    log.warn("Unknown property name.");
                }
            }
        },
        settings : {
            autoComplete: ["?", ...Object.keys(settings)],
            help : "> Lets you change system settings by name.",
            helpExtended : [
                "> settings settingsName value",
                ">             settingName to change",
                ">             value new value of settings",
            ],
            f(args){
                if (showHelp("settings",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift()
                const settingName = args.shiftVal();
                if(settings[settingName] !== undefined){
                    settings[settingName] = args.shiftVal();
                    log.sys("Setting '"+settingName+"' set to " + settings[settingName]);
                    settingsHandler.updateSettings();
                    if(settingsHandler.settingsMenuItems[settingName] && settingsHandler.settingsMenuItems[settingName].onchange){
                        settingsHandler.settingsMenuItems[settingName].onchange(settingName);
                    }
                    log.sys("The new setting have been saved");
                }else{
                    log.warn("Unknown setting '"+ settingName + "'");
                }
            }
        },
        assert : {
            autoComplete: ["?", "selected", "captureSprite", "drawable", "text", "drawon", "painting", "animated", "pallet", "help"],
            help : "Set assert flag depending on the assertion",
            helpExtended : [
                "> assert assertType [text] : ",
                ">  assertType : The assertion type ",
                ">        text : OptionalThe text to display if assertion is false ",
                "> assert text ",
                ">     True if any of selected sprites are text sprite",
                "> assert selected ",
                ">     True if there are selected sprites",
                "> assert drawable ",
                ">     True if any of the selected sprites are drawable",
                "> assert captureSprite ",
                ">     True if any of the selected sprites are capture sprites",
                "> assert drawOn ",
                ">     True if any of the selected sprites are drawable and are flagged to be drawn on",
                "> assert painting ",
                ">     True if in painting mode",
                "> assert image ",
                ">     True if any selected sprites contain an image",
                "> assert pallet ",
                ">     True if any selected sprites contain a pallet with 2 or more colors",
                 "> assert help ",
                ">     True if help has been request for running batch",
            ],
            f(args){
                if (showHelp("assert",args)) { return  }
                var str = args;
                args = tokenize(args);
                args.shift();
                const type = args.shiftVal().toLowerCase();
                var result;
                if(type === "selected"){
                    result = selection.length > 0;

                }else if(type === "capturesprite"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.image && spr.type.liveCapture){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "drawable"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.image && spr.image.isDrawable){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "text"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.text){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "drawon"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.image && spr.image.isDrawable && spr.drawOn){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "painting"){
                    result = editSprites.drawingModeOn;
                }else if(type === "image"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.image){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "animated"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.animated){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "pallet"){
                    result = false;
                    selection.each(spr=> {
                        if(spr.type.pallet && spr.pallet.length >= 2){
                            result = true;
                            return true;
                        }
                    });
                }else if(type === "help"){
                    result = lineCommands.run.assertHelp;
                    lineCommands.run.assertHelp = false;
                }
                if(result === undefined){
                    log.error("Unknown assertion '" + type + "'");
                    if (inBatch) { batchHandler.global.assertion = false }
                }else if(result === false){
                    if (inBatch) { batchHandler.global.assertion = false }
                    if(args.length === 0 && !inBatch){
                        log.warn("Assertion " + type + " : false");
                    } else {
                        log.warn(args.toLine());
                    }
                }else{
                    if(!inBatch){
                        log.warn("Assertion " + type + " : true");
                    }
                    if (inBatch) { batchHandler.global.assertion = true }
                }
            }
        },
        view : {
            autoComplete: ["?", "send", "get"],
            help : "Used with Image Zoom chrome extension. Send or get images from Image Zoom viewer tab",
            helpExtended : [
                "> view send",
                ">     Sends selected images to Image Zoom extention",
                "> view send ",
                ">     NOT COMPLETE",
            ],
            f(args){
                if (showHelp("assert",args)) { return  }
                var str = args;

                const type = str.split(" ")[1];
                const command = type.toLowerCase();
                if(type === "send"){

                    IMAGE_ZOOM_DATA.textContent  = "Images\n" +  mediaList.selected.map(media => media.src ?? media.desc.srcName ?? media.desc.fname).join("\n")

                    log.sys("view send request made");
                } else if(type === "get"){
                    log.warn("view: Command view get is not yet implemented");
                } else {
                    log.warn("view: Unknown argument '"+command+"'");
                }
            }
        },
    };
    const observeImageZoomData = new MutationObserver(() => {
        if (IMAGE_ZOOM_DATA_IN.textContent) {
            const data = IMAGE_ZOOM_DATA_IN.textContent.split("\n");
            function doCommand() {
                if (data.length) {
                    const cmd = data.shift();
                    if (cmd === "IMAGE_ZOOM") { system.hasImageZoomExt = true; log.sys("Image zoom (IZ) extension available") }
                    else {
                        if (cmd.includes("D:\\")) {
                            const cmds = cmd.split(" ");
                            const add = cmds.pop()
                            const src = cmds.pop().split("\\").pop();
                            if (cmd.toLowerCase().includes(".gif")) {
                                cmds.push(src);
                            } else {
                                cmds.push(src, add);
                            }
                            APIFunc(cmds.join(" "), true);
                            log(cmd);
                        } else {
                            APIFunc(cmd, true);
                            log(cmd);
                        }
                    }
                    mouse.eventTime = performance.now();

                    setTimeout(doCommand, 10);
                }
            }
            doCommand();
            IMAGE_ZOOM_DATA_IN.textContent = "";
        }
    });
    observeImageZoomData.observe(IMAGE_ZOOM_DATA_IN, {subtree: true, childList: true, characterData: true});
    lineCommands.fuctionLink = lineCommands.fl;
    var commandList = Object.keys(lineCommands);
    const autoComplete = ["selection"];
    const autoCompleteList = [];
    commandList.forEach(cmd => {
        if (!lineCommands[cmd].batchOnly) {
            autoComplete.push(cmd);
            if(lineCommands[cmd].autoComplete) {
                autoCompleteList.push(cmd, ...lineCommands[cmd].autoComplete.map(s => cmd + " " + s));
            } else {
                autoCompleteList.push(cmd);
            }
        }
    });
    const infoPannelStatus = {
        open: false,
        cmdStr: undefined,
    }
    function commandKeyInput(event){
        if(commandTextCallback) {
            if(event.key === "Enter" || event.key === "Escape"){
                commandTextCompleteCallback && commandTextCompleteCallback(event.key === "Escape" ? "rejected"  : "accepted");
                commandTextCompleteCallback = undefined;
                commandTextCallback = undefined;
                commandInput.value = "";
                commandInput.blur();
            }else{
                commandTextCallback();
            }
            return;
        }
        if(commandTextEvents) {
            if(event.key === "Enter"){
                commandTextEvents.complete(commandInput.value)
                commandTextEvents = undefined;
                commandInput.value = "";
                commandInput.blur();
            }else{
                commandTextEvents.change(commandInput.value);
            }
            return;
        }
        if (!inBatch && event.key === "Escape") {
            refocus(undefined,true);
            return;
        }
        if (!inBatch && event.key === "Tab") {
            if(infoPannelStatus.open){
                const line = infoPannel.update(id,"first");
                if(line) {
                    refocus(line._commandStr);
                    return
                }
            }
        }
        if(event.key === "Enter" || event.key === "SoftEnter"  || event.commandStr){
            if(!inBatch && event.key === "Enter" && !event.commandStr) {
                if(infoPannelStatus.open){
                    const line = infoPannel.update(id,"selected");
                    if(line) {
                        refocus(line._commandStr);
                        return
                    }
                }
            }
            APIFunc.clearOnBlur = false;
            commandInput.blur();
            var error = false;
            var commandWord, command = commandInput.value.trim();
            if(event.commandStr){ command = event.commandStr; }
            try{
                command = command === "?" ? "help" : command;
                commandWord = command.split(" ")[0];
                const cW = commandWord.toLowerCase();
                if (lineCommands[cW] && lineCommands[cW].f) { lineCommands[cW].f(command) }
                else{
                    var lineToken = tokenize(command)
                    var line  = lineToken.evalValsInScope(commandScope).toScopedJS("commandScope");
                    var result = eval(line);
                    if(!inBatch || event.key === "Enter") {
                        if (result !== null && typeof result === "object") {
                            const str = ("== Result of " + command + " ====").padEnd(58,"=");
                            log.sys(str);
                            if (Array.isArray(result)) {
                                if (result.arrVal) {
                                    let idx = 0;                                    
                                    for (const res of result) {
                                        if (result.nPath) {
                                            log(lineToken[0].valuePath[0] + "[" + idx + "]." + result.nPath + " = " + res);
                                            idx ++;                                    
                                            
                                        } else {
                                            log.sys(command + "[" + idx + "] = ");
                                            log.obj(sprites.getByGUID(res.guid), false, 5);
                                            log.sys("------------").padEnd(58,"-");
                                            idx ++;                                    
                                        }
                                    }
                                } else {
                                    log.obj({[command]: result}, false, 3)
                                }
                            } else {
                                log.obj(result, false, 3)
                            }
                            log.sys(("-").padEnd(58,"-"));
                        } else if(typeof result === "function") { log(command + " = function") }
                        else { log.clickable(command + " = " + result,{command,result}) }
                    }
                }
            } catch(e) {
                error = true;
                if (inBatch && batchHandler) { batchHandler.error(e.message) }
                else { log.error("Command line error : " + e.message) }
                if(quickMenu.results) {
                    if(quickMenu.results.close) { quickMenu.results.close(true) }
                }
            }
            commandInput.value = "";
            if ((!inBatch || event.key === "Enter")&& !event.commandStr) {
                if(commandBuffer[commandBuffer.length - 1] !== command) {
                    commandBuffer.push(command);
                    !error && storage.addCommandLineHistory(command);
                }
                bufferPos = commandBuffer.length;
                setTimeout(() => focusCommandLine(),0);
            } else if (batchError) { batchHandler.reset(); }
            if (event.batch) { return error; }
        }else if(!infoPannelStatus.open && (event.code === "ArrowUp" || event.code === "ArrowDown")){

            if(commandBuffer.length > 0){
                bufferPos += event.code === "ArrowDown" ? 1 : -1;
                if (bufferPos < 0) { bufferPos = commandBuffer.length -1 }
                if (bufferPos >= commandBuffer.length) { bufferPos = 0 }
                commandInput.value = commandBuffer[bufferPos];
            }
        } else if (!inBatch && (infoPannelStatus.open || commandInput.value.length > 0)) {
            if (!infoPannelStatus.open) {
                if (mouse.requestCapture(id)) {
                    infoPannel.show(infoPannel.displayTypes.autoComplete, id);
                    infoPannelStatus.open = true;
                    infoPannelStatus.cmdStr = undefined;
                    infoPannel.update(id,"show",commandInput);
                    mouse.onbutton = commandSelect;
                }
            }
            if (infoPannelStatus.open) {
                if(event.code === "ArrowUp" || event.code === "ArrowDown") {
                    const line = infoPannel.update(id,"select",undefined,event.code === "ArrowUp" ? -1 : 1);
                } else {
                    const cmdStr = commandInput.value;
                    if (cmdStr.includes(" ")) {
                        /*const cmds = cmdStr.trim().split(" ");
                        if (cmds.lenght > 1 && lineCommands[cmds]?.autoCompleteSub?.[cmds[cmds.length - 1]]) {
                            const subComplete = lineCommands[cmds]?.autoCompleteSub?.[cmds[cmds.length - 1]];
                            const list = subComplete.filter(cmd =>
                            infoPannel.update(id, "list", commandInput, ...autoCompleteList.filter(cmd => cmd.indexOf(cmdStr) === 0));
                        } else {*/

                            infoPannel.update(id,"list",commandInput,...autoCompleteList.filter(cmd => cmd.indexOf(cmdStr) === 0));
                        /*}*/
                    } else {
                        infoPannel.update(id,"list",commandInput,...autoComplete.filter(cmd => cmd.indexOf(cmdStr) === 0));
                    }
                }
            }
        }
    };
    function refocus(val, clearOnBlur = false) {
        if (val !== undefined) { commandInput.value = val }
        APIFunc.clearOnBlur = clearOnBlur;
        commandInput.blur();
        setTimeout(()=>focusCommandLine(),0);
    }
    function commandSelect(mouse, event) {
        if (event.target._commandStr) {
            if (event.type === "mouseup") {
                if(infoPannelStatus.cmdStr === event.target._commandStr) {
                    refocus(infoPannelStatus.cmdStr);
                }
            } else if (event.type === "mousedown") {
               infoPannelStatus.cmdStr = event.target._commandStr;
               event.preventDefault();
            }
        }
    }
    commandInput.addEventListener("keydown", e => {
        if (e.key === "Tab") { e.preventDefault() }
    });
    commandInput.addEventListener("keyup",commandKeyInput);
    function focusCommandLine(e){
        commandInput.keepingAwake = true;
        heartBeat.keepAwake = true;
        if (keyboard.requestCapture(id)) {
            if (commandInput.selectOnFocus) {
                if (commandInput.selectLastItemOnly) {
                    if (commandInput.value.length > 0) {
                        if (commandInput.value.trim()[commandInput.value.trim().length-1] === "\"") {
                            const startIdx = commandInput.value.indexOf("\"") + 1;
                            const endIdx = commandInput.value.trim().length - 1;
                            commandInput.setSelectionRange(startIdx, endIdx, "forward");
                        } else {
                            const chars = commandInput.value.split(" ").pop().length;
                            commandInput.setSelectionRange(commandInput.value.length - chars, commandInput.value.length, "forward");
                        }
                    }
                } else { commandInput.setSelectionRange(0, commandInput.value.length, "forward"); }
            }
        }
        if (!e) {
            if (!commandInput.selectOnFocus || !commandInput.selectLastItemOnly) { commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length); }
            commandInput.focus();
            commandInput.selectOnFocus = false;
            commandInput.selectLastItemOnly = false;
        }
        setKeyboardMode();
    }
    commandInput.addEventListener("focus" ,focusCommandLine);
    commandInput.addEventListener("blur" , function(e){

        if (infoPannelStatus.open) {
            infoPannel.update(id,"close")
            infoPannelStatus.open = false;
            mouse.onbutton = undefined;
            mouse.release(id, true);
        }
        keyboard.release(id);
		if(commandInput.keepingAwake) {
			commandInput.keepingAwake = false;
			heartBeat.keepAwake = false;
		}
        if(commandTextCallback){
            commandTextCompleteCallback && commandTextCompleteCallback("accepted");
            commandTextCompleteCallback = undefined;
            commandTextCallback = undefined;
            commandInput.value = "";
        }
        if(commandTextEvents) {
            commandTextEvents.complete(commandInput.value)
            commandTextEvents = undefined;
            commandInput.value = "";
        }
        if(APIFunc.clearOnBlur) {
            commandInput.value = "";
            APIFunc.clearOnBlur = false;
        }
        setKeyboardMode();

    });
    logs.addEventListener("click" , function(e){
        if(e.target.logExtra){
            if((mouse.oldButton & 1) === 1){
                if(typeof e.target.logExtra === "string"){
                    if(e.target.executeOnClick){
                        commandKeyInput({commandStr : e.target.logExtra});
                    } else {
                        commandLine(commandLine()+e.target.logExtra);
                        setTimeout(()=>focusCommandLine(),0);
                    }
                } else if(e.target.logExtra.fold){
                    e.target.logExtra.fold.classList.toggle("loggerFolded");
                    if (e.target.logExtra.fold.classList.contains("loggerFolded")){ e.target.textContent += "...}" }
                    else { e.target.textContent = e.target.textContent.replace("...}","") }
                }else{
                    commandLine(commandLine()+e.target.logExtra.result);
                    setTimeout(()=>focusCommandLine(),0);
                }
            }else if((mouse.oldButton & 4) === 4){
                commandLine(e.target.logExtra.command);
                e.preventDefault();
            }
        }
    } );
    setTimeout(()=>keyboard.addMode(keyboardModeName),0);
    var APIFunc  = Object.assign(function(value, andExecute = false, andFocus = false, andSelect = false, selectLastItemOnly = false){
        if(typeof value === "function"){
            if(commandTextEvents){
                commandTextEvents.complete(commandInput.value);
                commandTextEvents = undefined;
            }
            if (commandTextCallback) {
                commandTextCompleteCallback && commandTextCompleteCallback("accepted");
            }
            commandTextCallback = value;
            commandTextCompleteCallback = andExecute ? andExecute : undefined;
            return;
        }
        if(value !== null && typeof value === "object"){
            if(value.batch) {
                batchHandler.run({args: value.args, name: value.name, lines: value.batch.split("\n")});
                return;
            }
            commandTextCallback = undefined;
            commandTextEvents = value;
            return;
        }
        if(value === "Value"){  return commandInput.value; }
        if(value !== undefined){
            if(andExecute){
                commandKeyInput({commandStr : value});
                return;
            }
			heartBeat.keepAwake = true;
			commandInput.keepingAwake = true;
            commandInput.value = value;
            if(andFocus){

                setTimeout(()=>{
                    commandInput.selectOnFocus = andSelect;
                    commandInput.selectLastItemOnly = selectLastItemOnly;
                    focusCommandLine();
                },0);
            }
            return;
        }

        const command = commandInput.value;
        return commandInput.value;
    },{
        quickMenuOpen() {return quickMenu.open },
        isInBatch() { return inBatch === true },
        isCaptured() { return keyboard.captureId === id },
        keyboardModeName,
        saveBufferAsJson() {
            storage.saveJSON(commandBuffer,"CommandBuffer", "commandBuffer");
        },
        clearCommandBuffer() {
            commandBuffer.length = 0;
            bufferPos = 0;
        },
        addToBuffer(cmd, force = false) {
            if (force) {
                if (Array.isArray(cmd)) {
                    for(const c of cmd) {
                        commandBuffer.push(c);
                        storage.addCommandLineHistory(c);
                        bufferPos = commandBuffer.length;
                    }
                } else {
                    commandBuffer.push(cmd);
                    storage.addCommandLineHistory(cmd);
                    bufferPos = commandBuffer.length;
                }
                bufferPos %= commandBuffer.length;
                return true;
            } else {
                if(commandBuffer[commandBuffer.length - 1] !== cmd){
                    commandBuffer.push(cmd);
                    storage.addCommandLineHistory(cmd);
                    bufferPos = commandBuffer.length;
                    bufferPos %= commandBuffer.length;
                    log.sys("Added `" + cmd + "` to command line buffer")
                    return true;
                } else {
                    log.warn("Did not add duplicated command");
                }
            }
        },


    });

    return APIFunc;
})()