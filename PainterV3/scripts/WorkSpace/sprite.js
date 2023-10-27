"use strict";

const Sprite = (()=>{
    var CUTTER_SIZE = settings.cutterSize;
    const workPointA = {x : 0, y :  0};
    const workPoint0 = {x : 0, y :  0};
    const workPoint1 = {x : 0, y :  0};
    const workPoint2 = {x : 0, y :  0};
    const workPoint3 = {x : 0, y :  0};
    const workLineA = {p1 : workPoint0, p2 : workPoint1};
    const workLineB = {p1 : workPoint2, p2 : workPoint3};
    const workArray = [];
    const gridNames = ["X","Y","Z"];
    const corners = [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]];
    const animPlayTypes = {
        normal : 0,  // uses main animation
        loop : 1,
        forward : 2,
        reverse : 3,
        pingPong : 4,
        leadOn : 5,
    };
    const animCurveTypes = {
        linear : 0,
        easeOut1 : 1,
        easeOut2 : 2,
        easeOut3 : 3,
        sinEaseOut: 4,
        elasticOut2 : 5,
        elasticOut3 : 6,
        easeInOut1 : 7,
        easeInOut2 : 8,
        easeInOut3 : 9,
        sinEaseInOut: 10,
        elasticInOut2 : 11,
        elasticInOut3 : 12,
        easeIn1 : 13,
        easeIn2 : 14,
        easeIn3 : 15,
        sinEaseOut: 16,
        elasticOut2 : 17,
        elasticOut3 : 18,
        step : 19,

    };
    utils.animCurveTypes = animCurveTypes;
    utils.animPlayTypes = animPlayTypes;
    const hexLookup = $setOf(256,i => i.toString(16).padStart(2,"0"));
    function RGB(r = 0, g = 0, b = 0) {
        this.r2 = (this.r = r) ** 2;
        this.g2 = (this.g = g) ** 2;
        this.b2 = (this.b = b) ** 2;
        this.update();
    }
    RGB.prototype = {
        tween(rgb, val) {
            val = val > 1 ? 1 : val < 0 ? 0 : val;
            return this.css = "#" +
                hexLookup[((rgb.r2 - this.r2) * val + this.r2) ** 0.5 | 0] +
                hexLookup[((rgb.g2 - this.g2) * val + this.g2) ** 0.5 | 0] +
                hexLookup[((rgb.b2 - this.b2) * val + this.b2) ** 0.5 | 0];
        },
        update() {
            return this.css =  "#" + hexLookup[this.r | 0] + hexLookup[this.g | 0] + hexLookup[this.b | 0];
        },
        getHexA(a) { return this.css + hexLookup[a * 255 | 0] },
        isSame(rgb) { return ((this.r | 0) === (rgb.r | 0)) && ((this.g | 0) === (rgb.g | 0)) &&  ((this.b | 0) === (rgb.b | 0)) },
        toString(){ return this.css },
        fromArray(arr, unit = true) {
            if (unit) {
                this.r = (this.r2 = Math.unit(arr[0]) * Math.W16) **  0.5 | 0;
                this.g = (this.g2 = Math.unit(arr[1]) * Math.W16) **  0.5 | 0;
                this.b = (this.b2 = Math.unit(arr[2]) * Math.W16) **  0.5 | 0;
            } else {
                this.r2 = (this.r = arr[0]) ** 2;
                this.g2 = (this.g = arr[1]) ** 2;
                this.b2 = (this.b = arr[2]) ** 2;
            }
            this.update();
        },
        parseCSS(css = "#000000") {
            if(css.length < 6) {
                this.r2 = (this.r = parseInt(css[1] + css[1], 16)) ** 2;
                this.g2 = (this.g = parseInt(css[2] + css[2], 16)) ** 2;
                this.b2 = (this.b = parseInt(css[3] + css[3], 16)) ** 2;
            }else{
                this.r2 = (this.r = parseInt(css.substring(1,3), 16)) ** 2;
                this.g2 = (this.g = parseInt(css.substring(3,5), 16)) ** 2;
                this.b2 = (this.b = parseInt(css.substring(5,7), 16)) ** 2;
            }
            this.update();
        },
        fromColor(color) {
            this.r2 = (this.r = color.r) ** 2;
            this.g2 = (this.g = color.g) ** 2;
            this.b2 = (this.b = color.b) ** 2;
            this.update();
        },
        copy() { return new RGB(this.r,this.g, this.b) },
        fromRGB(rgb) {
            this.r2 = (this.r = rgb.r) ** 2;
            this.g2 = (this.g = rgb.g) ** 2;
            this.b2 = (this.b = rgb.b) ** 2;
            this.update();
        }
    };

    function isInShape(x, y, shape) {
        const len = shape.length;
        var i = len - 2, x2, y2, x1 = shape[i++], y1 = shape[i];
        i = 0;
        while (i < len) {
            x2 = shape[i++]; y2 = shape[i++];
            if ((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1) < 0) { return false }
            x1 = x2; y1 = y2;
        }
        return true;
    }
    const gridSpecialNames = {
        default: 0,
        view: 1,
        bone: 2,
        hinge: 3,
        IK_foot: 4,
        IK_lookat: 5,
        IK_start: 6,
        gravity: 7,
        cameraSpr: 8,
        gradientColor: 9,
        gridSpecial: 10,
    };
    const gridSpecialOverPoints = {
        [2]: [[64, 0, 192, 0,128, 32], [128, 222, 179, 251, 128 , 256, 77, 251]],
        [4]: [128, 115, 192, 128, 244, 256, 12, 256, 64, 128],
        [5]: [128, 153, 64, 128, 128, 0, 192, 128],
        [6]: [[0, 0, 128, 0, 0, 56], [0,0, 56, 0, 0, 128]],
    };
    const gridSpecialOver = {
        [gridSpecialNames.bone](x,y,w,h) {
            const xx = x * (256 / w);
            if (Math.abs(xx  - 128) < 26) { return true }
            const yy = y * (256 / h);
            return isInShape(xx, yy, gridSpecialOverPoints[2][0]) || isInShape(xx, yy, gridSpecialOverPoints[2][1])
        },
        [gridSpecialNames.hinge](x, y, w, h) { return ((x - w * 0.5) ** 2 + (y - h * 0.5) ** 2) < (w * w * 0.25) },
        [gridSpecialNames.IK_foot](x,y,w,h) { return isInShape(x * (256 / w), y * (256 / h), gridSpecialOverPoints[4]) },
        [gridSpecialNames.IK_lookat](x,y,w,h) { return isInShape(x * (256 / w), y * (256 / h), gridSpecialOverPoints[5]) },
        [gridSpecialNames.IK_start](x,y,w,h) {
            const xx = Math.abs(x * (256 / w) - 128);
            const yy = Math.abs(y * (256 / h) - 128);
            return (xx < 38 && yy < 38) || isInShape(xx, yy, gridSpecialOverPoints[6][0]) || isInShape(xx, yy, gridSpecialOverPoints[6][1]);
        },
        [gridSpecialNames.gradientColor](x, y, w, h) { return ((x - w * 0.5) ** 2 + (y - h * 0.5) ** 2) < w * w * 0.25 },
    };
    const elasticIn = (t, a, p) => a * 2 ** (10 * --t) * Math.sin((Math.asin(1 / a) * p - t) / p);
    const elasticOut = (t, a, p) => 1 - a * 2 ** (-10 * (t = +t)) * Math.sin((t + Math.asin(1 / a) * p) / p);
    const elasticInOut = (t, a, p) => ((t = t * 2 - 1) < 0
            ? a * 2 ** (10 * t) * Math.sin((Math.asin(1 / a) * p - t) / p)
            : 2 - a * 2 ** (-10 * t) * Math.sin((Math.asin(1 / a) * p + t) / p)) / 2;
    const animCurves = [
        v => v,
        v => v ** 1.5,
        v => v ** 2,
        v => v ** 3,
        v => 1 - Math.sin((1 - v) * Math.PI90),

        v => elasticIn(v, 1.5 , 0.039789),
        v => elasticIn(v, 1   , 0.031831),
        v => (v ** 1.5) / ((v ** 1.5)  + (1 - v) ** 1.5),
        v => (v * v) / ((v * v)  + (1 - v) ** 2),
        v => (v ** 3) / ((v ** 3)  + (1 - v) ** 3),
        v => Math.sin((v * 2 - 1) * Math.PI90) * 0.5 + 0.5,

        v => elasticInOut(v, 1.5 , 0.039789), // 0.25 / pi2
        v => elasticInOut(v, 1   , 0.031831), // 0.2 / pi2
        v => v ** 0.66667,
        v => v ** 0.5,
        v => v ** 0.33333,
        v => Math.sin(v * Math.PI90),
        //v => elasticOut(v, 1.15, 0.047746),
        v => elasticOut(v, 1.5 , 0.039789),
        v => elasticOut(v, 1   , 0.031831),
        v => v < 1 ? 0 : 1,
    ];
    const animTrackType = {
        x: 1,
        y: 2,
        sx: 3,
        sy: 4,
        rx: 5,
        ry: 6,
        a: 7,
        image: 8,
        rgb: 9,
    };
    const animTrackTypeNames = ["","x" ,"y" ,"sx","sy" ,"rx","ry","a" ,"image" ,"rgb"];
    const animExportShapeDefaultKeys = ["x" ,"y" ,"sx","sy" ,"rx","ry"];
    const animExportKey = {
        x(k)  { return Math.round(k.value * 100) / 100 },
        y(k)  { return Math.round(k.value * 100) / 100 },
        sx(k) { return Math.round(k.value * 100) / 100 },
        sy(k) { return Math.round(k.value * 100) / 100 },
        rx(k) { return Math.round(k.value * 1000) / 1000 },
        ry(k) { return Math.round(k.value * 1000) / 1000 },
        a(k)  { return Math.round(k.value * 100) / 100 },
        image(k) {
            if (k.value && k.value.isDrawable && k.value.desc && k.value.desc.serialised) { return k.value.guid }
            return k.value && k.value.desc ? k.value.desc.fname : k.value
        },
        rgb(k) { return k.value.css },
    };
    const animImportKey = {
        x(val)  { return val },
        y(val)  { return val },
        sx(val) { return val },
        sy(val) { return val },
        rx(val) { return val },
        ry(val) { return val },
        a(val)  { return val },
        image(val) { return val },
        rgb(val) { const rgb = new RGB(); rgb.parseCSS(val);  return rgb },
    };
    const exportProps = [["x",2],["y",2],["w",2],["h",2],["sx",3],["sy",3],["rx",6],["ry",6],["a",3]];
    const exportLocks = ["position","positionX","positionY","scale","scaleX","scaleY","rotate","rotateX","rotateY","locX","locY","UI"];
    function getSettings(){
        CUTTER_SIZE = settings.cutterSize;
        defaults.color = settings.cutterColor;
        Sprite.prototype.toString = settings.useDetailedNames ? nameMethods.toStringComplex : nameMethods.toString;
    }
    const nameMethods = {
        toStringComplex() {
            if (this.type.cutter) {  return "Cutter " + this.name +" #" + this.guid + " "  +  (this.w * this.sx).toFixed(1) + " by " + (this.h * this.sy).toFixed(1) }
            else if (this.type.image) {
                var icons = "";
                if (this.image.isDrawable) {
                    if(this.image.isLocked){
                        icons = textIcons.locked;
                    }else{
                        icons = textIcons.pallet;
                        if (this.drawOn) { icons += textIcons.pen }
                    }
                }
                if (this.type.pattern) { icons += textIcons.pattern }
                if (icons !== "") { icons = " " +icons + " " }
                else { icons = " " }
                return this.name +" #" + this.guid + icons + this.w.toFixed(1) + " by " + this.h.toFixed(1);
            }else if (this.type.vanish) {
                if (this.grid.radial){ return "Radial vanish " + this.grid.type  }
                return "Vanish " + this.grid.type + " #" + this.guid;
            } else if (this.type.grid) { return "Grid " + this.grid.type }
            else if (this.type.pallet) { return "Pallet " + this.pallet.length + " colors." }
        },
        toString() {
            var name = "";
            if (this.type.hidden) { name += "HIDDEN... "; }
            name += this.name + " ";
            var icons = "";

            if(this.attachedTo) { name += "<-- "+ this.attachment.zorder+" --=<(" + this.attachedTo.name + ")"; }
            if(this.locates) {
                let i = 0
                for(const l of this.locates) { name += "(" + i+">+" + l.name + ")"; }
            }
            if(this.type.lookat) { name +=  " ("+this.lookat.spr.name+"<"+textIcons.lookat+")"; }
            if(this.type.linked) { name +=  " ("+this.linked.name+"<=)"; }			
            this.type.vector   && (cons += textIcons.vector);
            this.type.view     && (icons += textIcons.view);
            this.type.snapTo   && (icons += textIcons.snapSprite);
            this.type.animated && (icons += textIcons.running);
            if (this.type.image) {
                if (this.image.isDrawable) {
                    if(this.image.isLocked){
                        icons += textIcons.locked;
                    }else{
                        icons += textIcons.pallet;
                        if (this.drawOn) { icons += textIcons.pen }
                    }
                }
                if (this.type.pattern) { icons += textIcons.pattern }
                if (icons !== "") { icons = " " +icons + " " }
                else { icons = " " }
                if(this.type.liveCapture){ icons += textIcons.captureOn }
                if(this.type.imgSequence){ icons += textIcons.film + "F:" + this.imageIdx+" " }
                if(this.type.view){ icons += textIcons.view }
                if(this.type.snapTo) { icons += textIcons.snapSprite  }
                name += " "+  "["+this.w+"]"+ (this.w * this.sx).toFixed(0) + " by [" + this.h + "] " + (this.h * this.sy).toFixed(0) + " " + icons;
				if(this.type.subSprite) { name += " " +textIcons.sprite + ": " +  this.subSpriteIdx + " (" + Math.abs(this.subSpriteIdx % this.image.desc.subSprCount) + ")"}
            } else if(this.type.shape){
                name += " " + this.shapeName +  " " +  this.w.toFixed(0) + " by " + this.h.toFixed(0) + " " + icons;
            } else if(this.type.text){
                name += " '"  + (this.textInfo.text.length < 20 ? this.textInfo.text : this.textInfo.text.substr(0,17) + "...") + "' " +  (this.w * this.sx).toFixed(0) + " by " + (this.h * this.sy).toFixed(0);
            } else if(this.type.grid) { name += " Grid " + this.grid.type + " " +  (this.w * this.sx).toFixed(0) + " by " + (this.h * this.sy).toFixed(0) }
            else if(this.type.pallet)  { name += " Pallet " + this.pallet.length + " colors." }
            else if(this.type.marker)  { name +=  " Marker '" + this.marker + "'" }
            else if(this.type.shadow) { name +=  textIcons.ungrouped }
            else if(this.type.group) { name +=  (this.type.openGroup ? " Open" + textIcons.ungrouped : textIcons.grouped) }
            else if(this.type.functionLink) {
                if(this.fLink.funcObj) { name = " " + this.name +" " + textIcons.link + " " + this.fLink.type; }
                else { name = this.name + " >`" +functionLink.input.names[this.fLink.inFrom] + "` >`" + functionLink.output.names[this.fLink.outTo] + "` " + textIcons.link + " " + this.fLink.type; }
            } else { name +=  (this.w * this.sx).toFixed(0) + " by " + (this.h * this.sy).toFixed(0) + " " + icons }
            if(sprites.hasFunctionLinks){
               this.isNamedInLink && (name += " [In]" );
               this.isNamedOutLink && (name += " [Out]");
            }
            if(this.type.shiftClickSetting) { name += " [Sft Click]" }
            if(this.type.flagged) { name += " "+textIcons.flag }
            return name;
        },
    };
    const functionLink = functionLinkBuilder.functionLink;
    const gridInfo = { // should have been called guideInfo.
        angle : 0,
        sx : 0,
        sy : 0,
        wangle : 0, // widget display
        wx : 0, // widget display
        wy : 0, // widget display
        x : 0,
        y : 0,
        p1 : { x : 0, y : 0},
        p2 : { x : 0, y : 0},
        dist : 0,  // this,is the dist from the line
        active : false,
        lockedOn : false,
        type : 0, // X,Y,Z
        radial : false, // for valnish types this controls how the guide is displayed
    };
    const defaults = {
        x : 0,
        y : 0,
        w : CUTTER_SIZE,
        h : CUTTER_SIZE,
        cx : CUTTER_SIZE / 2,
        cy : CUTTER_SIZE / 2,
        sx : 1,
        sy : 1,
        rx : 0,
        ry : Math.PI * 0.5,
        a : 1,
        type : {
            cutter : true,
            image : false,
            pattern : false,
            gradient: false,
            usingPattern : false,
            grid : false,
            vanish : false,
            marker : false,
            pallet : false,
            normalisable : true,
            mirrorX : false,
            mirrorY : false,
            snapTo : false,
            liveCapture : false,
            videoCapture : false,
            captureFeedback : true,
            text : false,
            renderable : false,
            animated : false,
            animate: false,
            showAnimPath: false,
            locked : false,
            hidden : false,
            hideOutline : false,
			linked : false,
            lookat : false,
            attached : false,
            vector : false,
            shape : false,
            compoundShape: false, // if part of compound shape
            hasLocators : false,
            locates : false,
            penColorSrc: false,
            functionLink: false,
            flagged: false,
            imgSequence: false,
            view: false,
            group: false,
            inGroup: false,
            shadow: false,
            openGroup: false,
			subSprite: false,
            shiftClickSetting: false,
            ISO: false,
			sound: false,
            sprite : true,
        },
        locks : {
            position: false,
            positionX : false,
            positionY : false,
            scale: false,
            scaleX: false,
            scaleY: false,
            rotate : false,
            rotateX : false,
            rotateY : false,
            locX : false,
            locY : false,
            UI: false,            
        },
        gridX : 2,
        gridY : 2,
        gridSpecial : 0,
        index : 0,
        snapFunc: undefined,
        lookat : null,
        linked : null,
        attachedTo : null,
        locators : undefined,
        smoothing : false,
        compMode : "source-over",
        filter : "none",
        image : null,
        name : "Sprite",
        flag: "",
        color :  settings.cutterColor,
        rgb : null,
        drawOn : false,
        changed : false,
        changeCount: 0,
        isSprite : true,
        gridSpecial : 0,
    }
  /*  function Group(owner) {
        this.owner = owner;
        this.sprites = [];
        this.ids = new Set();
        this.matrix = [1,0,0,1,0,0];
        this.animated = false;
        this.isOpen = false;
        this.updatePos = {x:0, y:0};
        //this.dirty = false;
    }*/
    function ShiftClick(command, prop, help) {
        const API =  {
            commandLine(spr) {
                return command
                    .replace(/##GUID##/g, spr.guid)
                    .replace(/##VALUE##/g, spr[prop])
            },
            get help() { return help }
        };
        return API;
    }
    const shiftClickTypes = {
        add(sprite, type) {
            if(shiftClickTypes[type]) {
                sprite.type.shiftClickSetting = true;
                sprite.shiftClick = shiftClickTypes[type];
            }
        },
        remove(sprite) {
            if(sprite.type.shiftClickSetting) {
                sprite.type.shiftClickSetting = false;
                delete sprite.shiftClick;
            }
        },
        gridSetting : new ShiftClick("sprite ##GUID## gridY ##VALUE##", "gridY", "Enter number of grid lines?"),
        markerName : new ShiftClick("sprite ##GUID## mark \"##VALUE##\"", "marker", "Enter name of marker?"),
    }
    function ISOInfo(spr, ) {
        this.rx = spr.rx;
        this.ry = spr.ry;
        this.ro = Math.PI90;
        spr.ry = spr.rx + Math.PI90;
        this.m = [Math.cos(this.rx), Math.sin(this.rx),   Math.cos(this.ry), Math.sin(this.ry)];
        /*this.m = [Math.cos(rot)
        0 1 2
        3 4 5
        6 7 8
            m[4] = m[0] = Math.cos(rot);
            m[3] = -(m[1] = Math.sin(rot));
            m[5] = m[2] = 0;
        */
    }
	function Sound(owner, from = {}) {
		owner.type.sound = true; 
		owner.sound = {
			rate: 1,
			volume: 1,
			startOffset: 0,
			rateScale: 1,
			loop: true,
			loopStart: 0,
			loopEnd: 1,
			startTime: 0,
			pos: 0,
			...from.sound,
			sample: undefined,
			gain: undefined,
		};	
	}		
	
    function AnimationTrack(name) {
        this.keys = [];
        this.frames = [];
        this.frameStarts = 0;
        this.timing = new AnimTiming();
        this.frameAIdx = 0;
        this.frameBIdx = 0;
        this.selected = false;
        this.atKey = false;
        this.dirty = false;
        this.name = name;
        this.type = animTrackType[name];
        this.timing.canLead = (this.type !== animTrackType.image && this.type !== animTrackType.rgb);
    }
    AnimationTrack.prototype = {
        eachKey(cb) {
            for(const key of this.keys) {
                if(cb(key) === true) { break }
            }
        },
        preDelete() {
            this.frames.length = 0;
            for(const key of this.keys) { key.selected = false }
            this.keys.length = 0;
            this.keys = undefined;
            this.frames = undefined;
            this.timing = undefined;
        },
        updateLookup() {
            var k1, t, kCount = 0, fCount = 0;
            const track = this;
            const time = track.timing;
            const keys = track.keys;
            const timeExtent = () => {
                time.start = Math.min(time.start, keys[0].time);
                time.end = Math.max(time.end, keys[keys.length-1].time);
                if(time.canLead) {
                    time.leadVal = keys[keys.length-1].value - keys[0].value;
                }
            }
            time.start = Infinity;
            time.end = 0;
            track.dirty = false;
            if (keys.length > 1) {
                keys.sort((a, b) => a.time - b.time);
                timeExtent();
                const frames = track.frames;
                for (const k2 of keys) {
                    if (k1) {
                        for (t = k1.time; t < k2.time; t++) { frames[fCount++] = kCount }
                        kCount++;
                    } else { track.frameStarts = k2.time }
                    k1 = k2;
                }
                frames[fCount++] = kCount;
                frames.length = fCount;
            } else if(keys.length === 1) {
                timeExtent();
                track.frames.length = 0;
                track.frameStarts = keys[0].time;
            } else if(keys.length === 0) {
                return true;
            }
        },
        setTime(time) {
            const track = this;
            if(track.dirty) { track.updateLookup() }
            const keys = track.keys;
            const len = keys.length;
            if (len > 0) {
                var kTime = track.timing.getTime(time);
                track.atKey = false;
                if (kTime <= keys[0].time) {
                    track.frameAIdx = 0;
                    track.frameBIdx = len === 1 ? 0 : 1;
                    if (kTime === keys[0].time) { track.atKey = true }
                    else { track.frameBIdx = track.frameAIdx }
                } else if (kTime >= keys[len - 1].time) {
                    track.frameAIdx = len - 1;
                    track.frameBIdx = len - (len === 1 ? 1 : 2);
                    if (kTime === keys[len - 1].time) { track.atKey = true }
                    else { track.frameBIdx = track.frameAIdx }
                } else {
                    const f = track.frames;
                    const t = kTime - track.frameStarts;
                    const f1 = keys[f[t]];
                    const f2 = keys[f[t] + 1];
                    track.frameAIdx = f[t];
                    track.frameBIdx = f[t] + 1;
                    if(f1 && kTime === f1.time) { track.atKey= true }
                }
            }
        },
        timeRange(){
            const track = this;
            if(track.dirty) { track.updateLookup() }
            const keys = track.keys;
            const len = keys.length;
            return {min: keys[0].time , max: keys[len - 1].time}
        },
		currentKey(time) {
            const track = this;
			if(track.atKey && time === track.keys[track.frameAIdx].time) {
				return track.keys[track.frameAIdx];
			}
		},
        keyAtTime(time) {
            const track = this;
            if(track.dirty) { track.updateLookup() }
            const kTime = track.timing.getTimeQuick(time);
            for(const key of track.keys) {
                if(key.time === kTime) { return key }
            }
        },
        clearRange(fromTime, toTime = Infinity) {
            const track = this;
            if (track.dirty) { track.updateLookup() }
            var i = 0;
            if (track.atKey && ((track.frameAIdx >= fromTime && track.frameAIdx <= toTime) || (track.frameBIdx >= fromTime && track.frameBIdx <= toTime))) {
                track.atKey = false;
            }
            while (i < track.keys.length) {
                const key = track.keys[i];
                if(key.time >= fromTime && key.time <= toTime) {
                    track.keys.splice(i--, 1);
                }
                i++;
            }
            track.updateLookup();
        },
        filter(predicate, fromTime = 0, toTime = Infinity) {
            const track = this;
            var i = 0;
            while (i < track.keys.length) {
                const key = track.keys[i];
                if(key.time >= fromTime && key.time <= toTime) {
                    if(predicate(key, i) === false) {
                        track.keys.splice(i--, 1);
                    }
                }
                i++;
            }
            track.dirty;
        },
        timeShift(shiftBy, fromTime = 0, toTime = Infinity) {
            const track = this;
            if(track.dirty) { track.updateLookup() }
            var i = 0;
            while (i < track.keys.length) {
                const key = track.keys[i];
                if(key.time >= fromTime && key.time <= toTime) {
                    key.time += shiftBy;
                }
                i++;
            }
            track.updateLookup();
        },


    }
    function AnimTiming(from) {
        if (from) {
            this.play  = from.play;
            this.type  = from.type;
            this.start = from.start;
            this.end   = from.end;
            this.speed = from.speed;
            this.leadVal = from.leadVal;
            this.leadStep = from.leadStep;
        }else {
            this.play = animPlayTypes.forward;
            this.type = animPlayTypes.normal;
            this.start = 0;
            this.end = 0;
            this.speed = 1;
            this.leadVal = 0;
            this.leadStep = 0;
        }
    }
    AnimTiming.prototype = {
        getTimeQuick(time) {
            var kTime = time, range, leadStep = 0;
            if (this.type === animPlayTypes.loop) {
                range = (this.end - this.start);
                if (this.play === animPlayTypes.forward) {
                    kTime = ((((time * this.speed - this.start) % (range + 1))+ (range + 1)) % (range + 1)) | 0;
                } else if (this.play === animPlayTypes.reverse) {
                    kTime = range -(((((time * this.speed - this.start) % (range + 1))+ (range + 1)) % (range + 1)) | 0);
                } else if (this.play === animPlayTypes.pingPong) {
                    kTime = ((time * this.speed - this.start) % (range * 2))
                    kTime = ((kTime + range * 2) % (range * 2)) | 0;
                    if (kTime > range) { kTime = range - (kTime - range) }
                } else if (this.play === animPlayTypes.leadOn) {
                    const t = time * this.speed;
                    kTime = ((((t - this.start) % range)+ range) % range) | 0;
                    leadStep = t < this.start ? - ((this.start - 1 - t) / range | 0) - 1 : (t - this.start) / range | 0;
                }
                kTime += this.start;
            }
            return kTime;
        },
        getTime(time) {
            var kTime = time, range, leadStep = 0;
            if (this.type === animPlayTypes.loop) {
                range = (this.end - this.start);
                if (this.play === animPlayTypes.forward) {
                    kTime = ((((time * this.speed - this.start) % (range + 1))+ (range + 1)) % (range + 1)) | 0;
                } else if (this.play === animPlayTypes.reverse) {
                    kTime = range -(((((time * this.speed - this.start) % (range + 1))+ (range + 1)) % (range + 1)) | 0);
                } else if (this.play === animPlayTypes.pingPong) {
                    kTime = ((time * this.speed - this.start) % (range * 2))
                    kTime = ((kTime + range * 2) % (range * 2)) | 0;
                    if (kTime > range) { kTime = range - (kTime - range) }
                } else if (this.play === animPlayTypes.leadOn) {
                    const t = time * this.speed;
                    kTime = ((((t - this.start) % range)+ range) % range) | 0;
                    leadStep = t < this.start ? - ((this.start - 1 - t) / range | 0) - 1 : (t - this.start) / range | 0;
                }
                kTime += this.start;
            }
            this.time = kTime;
            this.leadStep = leadStep;
            return kTime;
        },
        setFromKeys(keys){   // keys must be sorted
            if (this.type === animPlayTypes.loop) {
                this.start = keys[0].time;
                this.end = keys[keys.length-1].time;
                if(this.canLead) {
                    this.leadVal = keys[keys.length-1].value - keys[0].value;
                }
            }
        },
    }
    const animationFunctions = {
        eachSelectedTrackName(cb) {
            for (const name of this.named) {
                if (this.selected[name]) {
                    if (cb(name, this) === true) { break }
                }
            }
        },
        eachTrackName(cb) {
            for (const name of this.named) {
                if (cb(name, this) === true) { break }
            }
        },
        eachKeyOfTrack(cb,name) {
            if(this.tracks[name]) {
                const track = this.tracks[name];
                for(const key of track.keys) {
                    if (cb(key, name, this) === true) { break }
                }
            }
        },
        eachSelectedTrack(cb) {
            for (const name of this.named) {
                const track = this.tracks[name];
                if (track.selected && cb(track, this) === true) { break }
            }
        },
        eachTrack(cb) {
            for (const name of this.named) {
                if (cb(this.tracks[name], this) === true) { break }
            }
        },
        call(funcName,args) {
            for (const name of this.named) { this.tracks[name][funcName](args) }
        },
        cleanTracks() {
            for (const name of this.named) {
                if (this.tracks[name].updateLookup() === true) {
                    this.removeAnimTrack(name)
                }
            }
        }
    }
    function createLocators(locator,owner) {
        const loc = Object.assign([locator],{
            owner,
            scaleX : true,
            scaleY : true,
            releasing() {
                owner.locks.scaleX = owner.locks.scaleX === this.scaleX ? false : owner.locks.scaleX;
                owner.locks.scaleY = owner.locks.scaleY === this.scaleY ? false : owner.locks.scaleY;
                owner.locks.positionX = false;
                owner.locks.positionY = false;
            },
            scales(val) {
                val = val.toLowerCase();
                this.scaleX = (val === "xy" || val === "x" || val.includes("x"));
                this.scaleY = (val === "xy" || val === "y" || val.includes("y"));
                owner.locks.scaleX = this.scaleX;
                owner.locks.scaleY = this.scaleY;
            },
            update() {
                owner.locks.scaleX = this.scaleX;
                owner.locks.scaleY = this.scaleY;
                if(this.length > 1) {
                    owner.locks.positionX = true;
                    owner.locks.positionY = true;
                } else {
                    this.startX = this.owner.x;
                    this.startY = this.owner.y;
                }
                for(const l of this) {
                    l.locate();
                }
            },
            moveLocator(spr) {
                for(const l of this) {
                    if(l.spr === spr){ l.relocate(); break }
                }
            },
        });
        loc.update();
        return loc;
    }
    function Locator(owner,spr) {
        Object.assign(this, {
            owner,
            sx : owner.sx,
            sy : owner.sy,
            pos : utils.point,
            startPos : utils.point,
            spr,
        });
        this.startPos.x = spr.x;
        this.startPos.y = spr.y;
    }
    Locator.prototype = {
        serialize() {
            const L = {};
            L.guid = this.spr.guid;
            L.x = this.startPos.x !== 0 ? this.startPos.x : undefined;
            L.y = this.startPos.y !== 0 ? this.startPos.y : undefined;
            L.px = this.pos.x !== 0 ? this.pos.x : undefined;
            L.py = this.pos.y !== 0 ? this.pos.y : undefined;
            L.sx = this.sx !== 1 ? this.sx : undefined;
            L.sy = this.sy !== 1 ? this.sy : undefined;
            return L;
        },
        deserialize(L) {
            this.startPos.x = L.x !== undefined ? L.x : 0;
            this.startPos.y = L.y !== undefined ? L.y : 0;
            this.pos.x = L.px !== undefined ? L.px : 0;
            this.pos.y = L.py !== undefined ? L.py : 0;
            this.sx = L.sx !== undefined ? L.sx : 1;
            this.sy = L.sy !== undefined ? L.sy : 1;
        },
        relocate() {
            const x = this.spr.x;
            const y = this.spr.y;
            this.startPos.x = x;
            this.startPos.y = y;
            this.owner.key.toLocalP(x, y, this.pos);
            this.pos.x -= this.owner.cx;
            this.pos.y -= this.owner.cy;
        },
        locate() {
            this.owner.key.toLocalP(this.spr.x, this.spr.y, this.pos);
            this.pos.x -= this.owner.cx;
            this.pos.y -= this.owner.cy;
        },
    };
    const AttachmentDefaults = {
        x : 0,
        y : 0,
        rotOffset : Math.PI / 2,
        inheritRotate : false,
        inheritScaleX : false,
        inheritScaleY : false,
        scaleAttachX : false,
        scaleAttachY : false,
        computed : false,
    };
    function Attachment(owner) {
        Object.assign(this, {
            owner, // is normaly the sprite that references this (Attachment) object
            rx : owner.rx,
            ry : owner.ry,
            sx : owner.sx,
            sy : owner.sy,
            ...AttachmentDefaults,
        });
    }
    Attachment.prototype = {
        serialize() {
            const AD = AttachmentDefaults;
            const val = (name, pre, def, shortName = name) => {
                def = isNaN(def) ? def : Number(def.toFixed(pre));
                A[shortName] = Number(this[name].toFixed(pre)) !== def ? Number(this[name].toFixed(pre)) : undefined;
            }
            const valB = (name,shortName) => A[shortName] =  AD[name] !== undefined && this[name] === AD[name] ? undefined : this[name] && (this[name] = true);
            const A = {}
            val("x", 2, 0);
            val("y", 2, 0);
            val("rx", 3);
            val("ry", 3);
            val("sx", 3, 1);
            val("sy", 3, 1);
            val("rotOffset", 3, Math.PI / 2, "ro");
            valB("inheritRotate","ir");
            valB("inheritScaleX","isx");
            valB("inheritScaleY","isy");
            valB("scaleAttachX","iax");
           // valB("scaleAttachY","iay");
            valB("computed","comp");
            return A;
        },
        deserialize(A) {
            const AD = AttachmentDefaults;
            this.x = A.x !== undefined ? A.x : 0;
            this.y = A.y !== undefined ? A.y : 0;
            this.rx = A.rx;
            this.ry = A.ry;
            this.rotOffset = A.ro !== undefined ? A.ro : Math.PI / 2;
            this.sx = A.sx !== undefined ? A.sx : 1;
            this.sy = A.sy !== undefined ? A.sy : 1;
            this.inheritRotate = A.ir !== undefined ? A.ir === true : AD.inheritRotate;
            this.inheritScaleX = A.isx !== undefined ? A.isx === true : AD.inheritScaleX;
            this.inheritScaleY = A.isy !== undefined ? A.isy === true : AD.inheritScaleY;
            this.scaleAttachY = this.scaleAttachX =  A.iax !== undefined ? A.iax === true : AD.scaleAttachX;
            this.computed = A.comp !== undefined ? A.comp === true : AD.computed;
            //this.inheritScaleX = A.isx === true;
            //this.inheritScaleY = A.isy === true;
            //this.scaleAttachY = this.scaleAttachX = A.iax === true;
            //this.computed = A.comp === true;
        },
        copyOf(A) {
            this.x = A.x;
            this.y = A.y;
            this.rx = A.rx;
            this.ry = A.ry;
            this.rotOffset = A.rotOffset;
            this.sx = A.sx;
            this.sy = A.sy;
            this.inheritRotate = A.inheritRotate
            this.inheritScaleX = A.inheritScaleX
            this.inheritScaleY = A.inheritScaleY
            this.scaleAttachY = A.scaleAttachY
            this.scaleAttachX = A.scaleAttachX
            this.computed = A.computed;
        },
        set rotateType(val) {
            if (val === "inherit"  && !this.owner.type.lookat) {
                this.inheritRotate = true;
                const a = this.owner.attachedTo
                this.rotOffset = (a.ry-a.rx);
                this.rx = this.owner.rx - a.rx;
                this.ry = this.owner.ry - a.ry  + this.rotOffset;//(Math.PI / 2);
            } else {
                this.inheritRotate = false;
                this.rx = this.owner.rx;
                this.ry = this.owner.ry;
            }
        },
        set scaleAttach(bool) {
            const x = this.scaleAttachX, y = this.scaleAttachY;
            this.scaleAttachX = bool;
            this.scaleAttachY = bool;
            if(x !== this.scaleAttachX || y !== this.scaleAttachY) { this.locate() }
        },
        position() { // sets world pos of sprite with using `this` attachment
            this.owner.attachedTo.key.scaleSelToWorldPoint(
                this.x, this.y,
                this.scaleAttachX ,this.scaleAttachY,
                this.owner
            );
        },
        locate() { // set attachment position in local space of the sprite attachedTo
            this.owner.attachedTo.key.scaleSelToLocalP(
                this.owner.x, this.owner.y,
                this.scaleAttachX ,this.scaleAttachY,
                this
            );
        },
        locatePoint(point) { // set attachment position in local space of the sprite attachedTo
            this.owner.attachedTo.key.scaleSelToLocalP(
                point.x, point.y,
                this.scaleAttachX ,this.scaleAttachY,
                point
            );
            return point;
        }
    }
    const spriteSerial = "x,y,w,h,sx,sy,cx,cy,rx,ry,a,type.cutter,type.image,image.guid,smoothing,compMode,name".split(",").map(name => name.split("."));
    function Sprite(...args){
        return this.init(...args);
    }
    Sprite.prototype = {
        APIName : "Sprite",
        init (x, y, w, h, name = "Sprite") {
            Object.assign(this,defaults,{x, y, w, h, cx: w / 2, cy : h / 2, guid : getGUID(),type : { ...defaults.type},locks : {...defaults.locks}});
            this.rgb = new RGB();
            Object.assign(this, Events(this));
            this.rename(name);
            this.createWorldKey().update();
            return this;
        },
        rename(name) {
            if(name.indexOf("#") > -1) {
                name = name.replace(/#/g,"");
                if(name !== NAMES.isRegisteredAs(this.name)) {
                    this.name = NAMES.register(name);
                }
                this.name += "#";
            } else {
                if(name !== NAMES.isRegisteredAs(this.name)) {
                    this.name = NAMES.register(name);
                }
            }
        },
        toString : settings.useDetailedNames ? nameMethods.toStringComplex : nameMethods.toString,
        deserial(spr, UIDOffset) {
            this.guid_I = spr.id;
            this.x = spr.x !== undefined ? spr.x : 0;
            this.y = spr.y !== undefined ? spr.y : 0;
            this.w = spr.w !== undefined ? spr.w : this.w;
            this.h = spr.h !== undefined ? spr.h : this.h;
            this.sx = spr.sx !== undefined ? spr.sx : this.sx;
            this.sy = spr.sy !== undefined ? spr.sy : this.sy;
            this.rx = spr.rx !== undefined ? spr.rx : this.rx;
            this.ry = spr.ry !== undefined ? spr.ry : this.ry;
            this.a = spr.a !== undefined ? spr.a : this.a;
            this.cx = this.w * this.sx / 2;
            this.cy = this.h * this.sy / 2;
            this.type.hideOutline = spr.hideOutline !== undefined ? spr.hideOutline : this.type.hideOutline;  // legacy
            this.color = spr.color !== undefined ? spr.color : this.color;
            this.gridX = spr.gridX !== undefined ? spr.gridX : this.gridX;
            this.gridY = spr.gridY !== undefined ? spr.gridY : this.gridY;
            this.gridSpecial = spr.gridSpecial !== undefined ? spr.gridSpecial : this.gridSpecial;
            if (isNaN(this.gridSpecial)) {
                this.gridSpecial = spriteRender.gridSpecialNames[this.gridSpecial] ? spriteRender.gridSpecialNames[this.gridSpecial] : defaults.gridSpecial
            }
            this.smoothing = spr.smoothing !== undefined ? spr.smoothing : this.smoothing;
            if(spr.namedInLink !== undefined) { this.isNamedInLink = true }
            if(spr.namedOutLink !== undefined) { this.isNamedOutLink = true }
            this.compMode = spr.compMode !== undefined ? spr.compMode : this.compMode;
            this.filter = spr.filter !== undefined ? spr.filter : this.filter;
            this.type.hidden = spr.hidden !== undefined ? spr.hidden : this.type.hidden;
            this.type.showAnimPath = spr.showAnimPath !== undefined ? spr.showAnimPath : this.type.showAnimPath;
            this.rgb.parseCSS(spr.rgb ? spr.rgb : "#000000");
            if(spr.type === "cutterScale"){
                this.type.normalisable = false;
                spr.type = "cutter";
            }
            if(spr.type === "groupSprite") {
                this.key.update();
            } else if(spr.type === "gradient"){
                this.setGradient(true);
                this.gradient.type = spr.gType ? 1 : 0;
            } else if(spr.type === "cutter"){
                this.key.update();
            } else if(spr.type === "shape"){
                this.key.update();
                this.changeToShape(undefined, spr.shape.name);
                this.shape.deserial(spr.shape);
            }else if(spr.type === "text"){
                this.key.update();
                if (!spr.textId ) {
                    this.changeToText(spr.text === undefined ? "" : spr.text);
                    this.textInfo.font = spr.font;
                    this.textInfo.size = spr.size;
                    this.textInfo.strokeStyle = spr.strokeStyle ? spr.strokeStyle : null;
                    this.textInfo.lineWidth = spr.lineWidth;
                    this.textInfo.update(view.context);
                } else {
                    this.type.cutter = false;
                    this.type.text = true;
                }
            }else if(spr.type === "marker"){
                this.key.update();
                this.changeToMarker(spr.marker);
            }else if(spr.type === "grid"){
                this.key.update();
                this.changeToGrid();
            }else if(spr.type === "radial"){
                this.key.update();
                this.changeToVanish(true);
            }else if(spr.type === "vanish"){
                this.key.update();
                this.changeToVanish(false);
            }else if(spr.type === "pallet"){
                const pal = media.createPallet(0);
                pal.fromHexStr(spr.pallet);
                spr.palletLayout && (pal.layout = spr.palletLayout);
                spr.palletSortBy && (pal.sortBy = spr.palletSortBy);
                this.changeToPallet("", pal);

            }else if(spr.type === "capture") {
                media.create({type: "canvas", width: spr.w, height: spr.h}, img => this.changeImage(img));
                this.image.desc.capturing = spr.capturing !== undefined ? spr.capturing : true;
                this.image.desc.src = spr.capSrc;
                this.type.liveCapture = this.image.desc.capturing;
                this.type.captureFeedback = spr.capFB;
            }else if(spr.type === "fLink") {
                this.changeToFunctionLink();
                const f = this.fLink;
                const ff = spr.fLink;
                f.type = ff.type !== undefined ? ff.type : f.type;
                if(f.type !== "Compiled") {  // Compiled function links are reconstructed in storage module
                    
                    f.inFrom = ff.inFrom !== undefined ? ff.inFrom : f.inFrom;
                    f.outTo = ff.outTo !== undefined ? ff.outTo : f.outTo;
                    f.scale = ff.scale !== undefined ? ff.scale : f.scale;
                    f.offset = ff.offset !== undefined ? ff.offset : f.offset;
                    f.textColor = ff.textColor;
					
					if (functionLink.output.names[f.outTo] === undefined) {
						f.outTo = "v";
						log.warn("Function link output name unknown. Defaulting to 'v' value");
					}
					if (functionLink.input.names[f.inFrom] === undefined) {
						f.inFrom = "v";
						log.warn("Function link input name unknown. Defaulting to 'v' value");
					}
                }
            }
            if(spr.locks) { Object.assign(this.locks,spr.locks) }
            if(spr.animated) { this.deserialAnim(spr, UIDOffset, true); }
            this.key.update();
            this.name = spr.name;
        },
        deserialAnim(spr, UIDOffset, imageOnly = false) {
            if(spr.animated) {
                var wKey = { name : "", dontUpdate : true, isNew : true, time : 0, value : 0, curve : 0 ,id: undefined };
                for(const name of spr.namedKeys){
                    if ((imageOnly && name === "image") || (!imageOnly && name !== "image")) {
                        const keys = spr.keys[name];
                        wKey.name = name;
                        const importKey = animImportKey[name];
                        for(let i = 0; i < keys.time.length; i++){
                            wKey.value = importKey(keys.value[i]);
                            wKey.time = keys.time[i];
                            wKey.curve = Array.isArray(keys.curve) ? keys.curve[i] : keys.curve;
                            wKey.forceKey = true;
                            if(keys.id) {
                                wKey.id = keys.id[i] + UIDOffset;
                                maxUID = Math.max(maxUID, keys.id[i] + UIDOffset);
                            }
                            this.addAnimKey(wKey);
                        }
                        if(keys.timing) {
                            const ta = keys.timing;
                            const t = this.animation.tracks[name].timing;
                            t.type = animPlayTypes.loop;
                            t.play = ta[0];
                            t.start = ta[1];
                            t.end = ta[2];
                            t.speed = ta[3];
                        }
                    }
                }
                this.updateKeyFrameLookup();
                this.key.update();
            }
            
        },            
        serial() {
            this.setAnimFrame(animation.startTime);
            const val = (name, pre) => spr[name] = Number(this[name].toFixed(pre)) !== Number(defaults[name].toFixed(pre)) ? Number(this[name].toFixed(pre)) : undefined;
            const lock = name => anyLocks |= locks[name] = this.locks[name] ? true : undefined;;
            const spr = {};
            spr.name = this.name;
            spr.id = this.guid;
            for(const p of exportProps) { val(...p) }
            const locks = {};
            var anyLocks = false;
            for(const l of exportLocks) { lock(l) }
            if(anyLocks) { spr.locks = locks }
            spr.hideOutline = this.type.hideOutline !== defaults.hideOutline ? this.type.hideOutline : undefined;
            spr.color = this.color !== defaults.color ? this.color : undefined;
            spr.rgb = this.rgb.css !== "#000000" ? this.rgb.css : undefined;
            spr.gridX = this.gridX !== defaults.gridX ? this.gridX : undefined;
            spr.gridY = this.gridY !== defaults.gridY ? this.gridY : undefined;
            spr.gridSpecial = this.gridSpecial !== defaults.gridSpecial ? this.gridSpecial : undefined;
            spr.smoothing = this.smoothing ? true : undefined;
            spr.namedInLink = this.isNamedInLink === true ? true : undefined;
            spr.namedOutLink = this.isNamedOutLink === true ? true : undefined;
            spr.compMode = this.compMode !== defaults.compMode ? this.compMode : undefined;
            spr.filter = this.filter !== defaults.filter ? this.filter : undefined;
            spr.hidden = this.type.hidden !== defaults.type.hidden ? this.type.hidden : undefined;
            spr.showAnimPath = this.type.showAnimPath !== defaults.type.showAnimPath ? this.type.showAnimPath : undefined;
            /*if (this.type.linked) {
				spr.linked = this.linked.guid;
                
			}*/
            if (this.linkers) {
                const linkers = [];
                for (const s of this.linkers) { linkers.push(s.guid) }
                spr.linkers = linkers;
            }
            if (this.type.lookat) {
                spr.lookat = [this.lookat.spr.guid, this.lookat.offsetX, this.lookat.offsetY];
            }
            if (this.type.attached) {
                spr.attachedTo = this.attachedTo.guid;
                spr.attachment = this.attachment.serialize();
            }
            if (this.type.hasLocators) {
                spr.locators = [];
                spr.locatorScales = (this.locators.scaleX ? "x" : "") + (this.locators.scaleY ? "y" : "")
                for(const loc of this.locators) {
                    spr.locators.push(loc.serialize())
                }
            }
            if(this.type.group) {
                spr.type = "groupSprite";
                spr.groupId = this.group.guid;
                if (this.type.shape) {
                    spr.shape = {
                        name: this.shapeName,
                        id: this.shape.id,
                        ...this.shape.serial(),
                    };
                }
            } else if (this.type.gradient) {
                spr.type = "gradient";
                spr.gType = this.gradient.type === 0 ? undefined : 1;
            } else if (this.type.cutter) {
                spr.type = "cutter" + (this.type.normalisable ? "" : "Scale");

            } else if(this.type.pallet) {
                spr.type = "pallet";
                spr.palletLayout = this.pallet.layoutString;
                spr.palletSortBy = this.pallet.sortByString;
                spr.pallet = this.pallet.toHexStr();
            } else if(this.type.liveCapture) {
                spr.type = "capture";
                spr.capFB = this.type.captureFeedback;
                spr.capSrc = this.image.desc.src;
            } else if(this.type.image){
                spr.type = "image";
                if(this.image.desc.capturing) { spr.capImage = true }
                if (this.image.isDrawable && this.image.desc && this.image.desc.serialised) {
                    spr.imgName =  this.image.desc.name;
                    spr.imgGuid = this.image.guid;
                } else {
                    spr.src =  this.image.desc.fname || this.image.src;
                }
				if(this.type.subSprite) {
					spr.subSpriteIdx = this.subSpriteIdx;
					spr.w = this.image.w;
					spr.h = this.image.h;
				}
                if(this.type.pattern){
                    spr.pattern = true;
                    spr.pat = { rep: this.pattern.rep }
                }
                if(this.type.imgSequence) {
                    spr.imgSeq = this.imgSequence.map(img => (img.isDrawable && img.desc && img.desc.dirty) ? img.guid : img.desc.fname );
                    spr.imgIdx = spr.imageIdx ? spr.imageIdx : undefined;
                }
            } else if(this.type.text){
                spr.type = "text";
                spr.textId = this.textInfo.id;
            } else if(this.type.shape) {
                spr.type = "shape";
                spr.shape = {
                    name: this.shapeName,
                    id: this.shape.id,
                    ...this.shape.serial(),
                };
            } else if(this.type.marker){
                spr.type = "marker";
                spr.marker = this.marker;
            } else if(this.type.grid){
                spr.type = "grid";
            } else if(this.type.vanish){
                spr.type = this.grid.radial ? "radial" : "vanish";
            } else if(this.type.functionLink){
                spr.type = "fLink";
                if(this.fLink.funcObj) {
                    spr.fLink = {
                        inputs: this.fLink.inputs.length ? [...new Set(this.fLink.inputs.map(spr => spr.guid)).values()] : undefined,
                        outputs: this.fLink.outputs.length ? [...new Set(this.fLink.outputs.map(spr => spr.guid)).values()] : undefined,
                        linked: [...this.fLink.funcObj.spriteList.values()].map(spr => spr.guid),
                        srcIds: this.fLink.funcObj.srcIds ? this.fLink.funcObj.srcIds : undefined,
                        source: this.fLink.funcObj.fileSource ? this.fLink.funcObj.fileSource : this.fLink.funcObj.source,
                        values: this.fLink.funcObj.values ? this.fLink.funcObj.values : undefined,
                        textColor: this.fLink.textColor,
                        type: "Compiled",
                    };
                }else {
                    spr.fLink = {
                        inputs: this.fLink.inputs.length ? this.fLink.inputs.map(spr => spr.guid) : undefined,
                        outputs: this.fLink.outputs.length ? this.fLink.outputs.map(spr => spr.guid) : undefined,
                        inFrom: this.fLink.inFrom !== "v" ? this.fLink.inFrom : undefined,
                        outTo: this.fLink.outTo !== "v" ? this.fLink.outTo : undefined,
                        scale: this.fLink.scale !== 1 ? Number(this.fLink.scale.toFixed(3)) : undefined,
                        offset: this.fLink.offset !== 0 ? Number(this.fLink.offset.toFixed(3)) : undefined,
                        textColor: this.fLink.textColor,
                        type: this.fLink.type !== "sum" ? this.fLink.type : undefined,
                    };
                }
            }
            if(this.type.usingPattern) { spr.usePattern = this.patternSpr.guid }
            if(this.type.animated) {
                spr.animated = true;
                spr.namedKeys = [...this.animation.named];
                var keys = {};
                this.animation.eachTrack(track =>{
                    const name = track.name;
                    if (this.type.shape && this.shape.name === "vectorCommited") {  // exporting animated vector commited requiers defaults for pos, rotate and scale
                        if (animExportShapeDefaultKeys.includes(name)) {
                            spr[name] = undefined;
                        }
                    }
                    const k = keys[name] = {
                        time : [],
                        value : [],
                        curve : [],
                        id: [],
                    };
                    if (track.timing.type === animPlayTypes.loop) {
                        const t = track.timing;
                        k.timing = [t.play, t.start, t.end, t.speed];
                    }
                    const eFunc = animExportKey[name];
                    for(const key of track.keys){
                        k.time.push(key.time);
                        k.value.push(eFunc(key));
                        k.curve.push(key.curve);
                        k.id.push(key.id);
                    }
                    if(k.curve.every(c => c === k.curve[0])) {
                        k.curve = k.curve[0];
                    }
                });
                spr.keys = keys;
            }
            return spr;
        },
        copy (includeAnimation = false, holdGUID = false, clone = false) {
            const spr = new Sprite(this.x, this.y, this.w, this.h, this.name);
            if (holdGUID) { spr.guid_I = this.guid }
            spr.x = this.x;
            spr.y = this.y;
            spr.w = this.w;
            spr.h = this.h;
            spr.sx = this.sx;
            spr.sy = this.sy;
            spr.cx = this.cx;
            spr.cy = this.cy;
            spr.rx = this.rx;
            spr.ry = this.ry;
            spr.a = this.a;
            if (this.iso) { spr.iso = this.iso }
            spr.gridX = this.gridX;
            spr.gridY = this.gridY;
            spr.gridSpecial = this.gridSpecial === spriteRender.gridSpecialNames.cameraSpr ? 0 : this.gridSpecial;

            spr.type.hideOutline = this.type.hideOutline;
            spr.type.cutter = this.type.cutter;
            spr.type.normalisable = this.type.normalisable;
            spr.type.mirrorX = this.type.mirrorX;
            spr.type.mirrorY = this.type.mirrorY;
            spr.type.image = this.type.image;
            spr.type.snapTo = this.type.snapTo;
            spr.type.renderable = this.type.renderable;
            
            spr.type.showAnimPath = this.type.showAnimPath;
            //spr.type.UILocked = this.type.UILocked;
            spr.drawOn = this.drawOn;
            spr.color = this.color;
            spr.rgb.fromRGB(this.rgb);
            spr.type.liveCapture = false;
            spr.locks = Object.assign({},this.locks);
            var fixAnimScales = false;
            if((clone && this.type.group && !this.type.shape) || (!clone && this.type.group)) {

                if (this.type.shape) {
                    if(this.shape.name === "compoundShape"){
                        spr.changeToShape(this.name,"vectorCommited");
                        spr.shape.commitFrom(this);
                        spr.shape.valD = this.shape.valD;

                    } else {
                        spr.changeToGroup(undefined, false, this.group);
                        spr.changeToShape("Copy of " + this.name, this.shapeName);
                        spr.shape.radius = this.shape.radius;
                        spr.shape.inner = this.shape.inner;
                        spr.shape.sides = this.shape.sides;
                        spr.shape.valA = this.shape.valA;
                        spr.shape.valB = this.shape.valB;
                        spr.shape.valC = this.shape.valC;
                        spr.shape.valD = this.shape.valD;
                    }
                } else {
                    spr.changeToGroup(undefined, false, this.group);
                }

            } else if(spr.type.image){
                this.type.renderable = true;
                spr.image = this.image;
				if (this.image.desc.isSound) { Sound(spr, this) }
                if (this.type.pattern) { spr.setPattern(true, false, this.pattern.rep) }
				if (this.type.subSprite) { spr.changeToSubSprite(this.subSpriteIdx) }
				else if(this.type.imgSequence) {
                    spr.addImageSequence(this.imgSequence);
                    spr.imageIdx = this.imageIdx;
                }
            } else if (this.type.vector){
                spr.vector = this.vector;
                spr.type.vector = true;
            } else if (this.type.vanish) { spr.changeToVanish(this.grid.radial) }
            else if (this.type.gradient) {
                spr.setGradient(true)
                spr.gradient.type = this.gradient.type;
            } else if (this.type.grid) { spr.changeToGrid() }
            else if(this.type.pallet){
                spr.changeToPallet(this.name, media.createPallet(this.pallet));
                spr.pallet.layout = this.pallet.layoutString;
            }else if(this.type.shape) {

                if (clone /*&& !this.shape.isCompound*/) {
                    if (this.type.group) {
                        spr.changeToShape("Clone of " + this.name,this.shape,this.shape.data);
                    } else {
                        if (this.cast && this.cast.group && this.cast.group.owner && this.cast.group.owner.type.shape && this.cast.group.owner.shape.name === "compoundShape") {
                            spr.changeToShape(this.name,this.shape,this.shape.data);
                            this.cast.group.owner.shape.compoundJoin(spr);

                        } else {
                            spr.changeToShape(this.name,this.shape,this.shape.data);
                        }
                    }
                } else {
                    if (this.shape.name === "vectorCommited") {
                        if(this.shape.data.isShadowPath2D) {
                            spr.changeToShape(this.name,this.shape,this.shape.data);
                        } else {
                            spr.changeToShape(this.name,"vectorCommited");
                            spr.shape.commitFrom(this);
                            spr.shape.valD = this.shape.valD;
                        }

                    } else if (this.shape.name === "vector") {
                        spr.changeToShape(this.name,"vectorCommited");
                        spr.shape.commitFrom(this);
                        spr.shape.valD = this.shape.valD;
                    } else if (this.shape.canBake) {
                        spr.changeToShape(this.name,"vectorCommited");
                        spr.shape.commitFrom(this);
                        spr.shape.valD = this.shape.valD;
                        spr.shape.sides = 1;
                        fixAnimScales = true;

                    } else {
                        spr.changeToShape(this.name,this.shapeName);
                        spr.shape.radius = this.shape.radius;
                        spr.shape.inner = this.shape.inner;
                        spr.shape.sides = this.shape.sides;
                        spr.shape.valA = this.shape.valA;
                        spr.shape.valB = this.shape.valB;
                        spr.shape.valC = this.shape.valC;
                        spr.shape.valD = this.shape.valD;
                    }
                }
            }else if(this.type.text){
                let text;
                if(clone) {
                    spr.changeToText(undefined, this.textInfo);
                }else{
                    spr.changeToText(this.textInfo.content.text);

                }
               // if(!clone) { spr.textInfo.content = text }
                spr.textInfo.owner = spr;
                spr.textInfo.update(view.context);
            }else if(this.type.marker) {
                spr.changeToMarker(this.marker, this.name);
                spr.axiesLen.length = 0;
                spr.axiesLen.push(...this.axiesLen);
            }else if(this.type.functionLink) {
                spr.changeToFunctionLink(this.marker);
                if(this.fLink.funcObj) {
                    spr.locks.rotate = this.locks.rotate;
                    spr.locks.scale = this.locks.scale;
                    const f = spr.fLink;
                    const tf = this.fLink;
                    f.source = tf.funcObj.source;
                    f.inputs = tf.inputs.length ? tf.inputs.map(spr => spr.guid) : undefined;
                    f.outputs = tf.outputs.length ? tf.outputs.map(spr => spr.guid) : undefined;
                    f.linked = [...tf.funcObj.spriteList.values()].map(spr => spr.guid);
                     f.textColor = tf.textColor;
                    f.type = tf.type;
                }else{
                    spr.locks.rotate = this.locks.rotate;
                    spr.locks.scale = this.locks.scale;
                    const f = spr.fLink;
                    const tf = this.fLink;
                    f.scale = tf.scale;
                    f.offset = tf.offset;
                    f.inFrom = tf.inFrom;
                    f.outTo = tf.outTo;
                    f.value = tf.value;
                    f.textColor = tf.textColor;
                    f.type = tf.type;
                    f.inputs.push(...tf.inputs);
                    f.outputs.push(...tf.outputs);
                }
            }
            if(this.type.usingPattern) {
                spr.usePattern(this.patternSpr);
            }
            spr.smoothing = this.smoothing;
            spr.compMode = this.compMode;
            spr.filter = "none";
            if (this.type.animated && includeAnimation) {
                var wKey = { name : "", dontUpdate : true, isNew : true, time : 0, value : 0 , curve : 0};
                const a = this.animation;
                a.eachTrack(track => {
                    const ks = track.keys;
                    wKey.name  = track.name;
                    for(const k of ks) {
                        wKey.time = k.time;
                        wKey.value = k.value;
                        wKey.curve = k.curve;
                        spr.addAnimKey(wKey);
                    }
                    spr.animation.tracks[track.name].timing = new AnimTiming(track.timing);
                    spr.updateAnimTrackLookup(track.name);
                })
                if (fixAnimScales) {
                    const a = spr.animation;
                    const w = spr.w;
                    const h = spr.h;
                    a.eachKeyOfTrack((key, name, anim) => key.value /= w, "sx");
                    a.eachKeyOfTrack((key, name, anim) => key.value /= h, "sy");
                    log("rescaled")
                }
            }
            spr.key.update();
            if (spr.type.showAnimPath) { this.updateWidgetAnimPath(); }
            this.fireEvent("oncopied",{copy : spr, includeAnimation});
            return spr;
        },
        shadowOf(castBy, shadowOf, atPos = false) {
            this.type.shadow = true;
            this.type.hidden = true;
            this.type.normalisable = false;
            this.cast = castBy;
            this.shadow = shadowOf;
            shadowOf.shadowedBy = this;
            if(!atPos){
                this.transform(castBy.key.m, castBy.a, shadowOf.key.m);
            }
        },
        addAnimKey(key) {
            // from timeline (debugging 15/8/2020) {name, time, remember: true, value : workPoint[name]}
            var typeChange = false;
            if (key.name === undefined && key.type) { key.name = animTrackTypeNames[key.type] }
            if (!key.forceKey) {
                if (key.name === "image" && this.type.image === false) { return false }
                if (key.name === "text" && this.type.text === false) { return false }
            }
            if (key.value === undefined || key.value === null || isNaN(key.time) ) { return false }
            if (!this.type.animated) {
                this.type.animated = true;
                this.animation = {named: [],atKey: false, startTime: 0, endTime: 0, tracks: {}, ...animationFunctions};
                typeChange = true;
            }
            const a = this.animation;
            const name = key.name;
            if(a.tracks[name] === undefined) {
                a.tracks[name] = new AnimationTrack(name);
                a.named.push(name);
            }
            const track = a.tracks[name];
			var curve = key.curve;
			if (curve === undefined) {
				curve = track.keys[track.frameAIdx] && track.keys[track.frameAIdx].curve;
				if (curve === undefined) { curve = 0 }
			}
            if (!key.isNew && track.atKey) { // && track.frameAIdx === key.time) {
                track.keys[track.frameAIdx].value = key.value;
                track.keys[track.frameAIdx].curve = curve;
            } else {
                if (track.timing.type === animPlayTypes.loop && !key.isNew ) { key.time = track.timing.getTime(key.time)}
                if (key.remember) {
                    track.keys.push(key.created = {time : key.time, value : key.value, selected : false, curve, id: (key.id ? key.id : getUID())});
                } else {
                    track.keys.push({time : key.time, value : key.value, selected : false, curve, id: (key.id ? key.id : getUID())});
                }
                key.id = undefined;
            }
            if (this.type.attached && (name === "x" || name === "y")) { this.attachment.computed = true }
            track.dirty = true;
            !key.dontUpdate && this.updateAnimTrackLookup(name);
            typeChange && sprites.spriteTypeChange(this);
            return true;
        },
        copySelectedKeys() {
            var idx,idxs = [];
            var wKey = { name : "", dontUpdate : true, isNew : true, time : 0, value : 0, curve : 0 };
            if(this.type.animated) {
                const a = this.animation;
                a.eachTrack(track => {
                    const ks = track.keys;
                    idx = 0;
                    for(const k of ks) {
                        if(k.selected) { idxs.push(idx) }
                        idx ++;
                    }
                    wKey.name  = track.name;
                    while(idxs.length) {
                        idx = idxs.shift();
                        wKey.time = ks[idx].time;
                        wKey.value = ks[idx].value;
                        wKey.curve = ks[idx].curve;
                        this.addAnimKey(wKey);
                    }
                    this.updateAnimTrackLookup(name);
                })
            }
        },
        removeAnimTrack(name, removeFrames = false) {
            if (this.type.animated) {
                const a = this.animation;
                const idx = a.named.indexOf(name);
                if(idx > -1){
                    a.named.splice(idx,1);
                    a.tracks[name].preDelete();
                    delete a.tracks[name];
                    if (this.type.attached && !a.named.includes("x") && !a.named.includes("y")) {
                        this.attachment.computed = false;
                    }
                    if(a.named.length === 0 && this.type.animated){ // all keys are gone so remove animation
                        this.type.animated = false;
                        this.animation = undefined;
                        sprites.spriteTypeChange(this);
                    }
                }
            }
        },
        animKeyTimeRange() {
            if (this.type.animated) {
                const range = {
                    min: Infinity,
                    max: -1,
                };
                const a = this.animation;
                const t = a.tracks;
                const getTimeRange = ({min, max}) => {
                    range.min = Math.min(min, range.min);
                    range.max = Math.max(range.max, max);
                }
                for (const name of animTrackTypeNames) {
                    if (name !== "") { t[name] && getTimeRange(t[name].timeRange()) }
                }
                return range;
            }
            return { min: 0, max: 0 };
        },
        updateKeysFromStateArray(states) {
            if(this.type.animated) {
                const a = this.animation;
                const t = a.tracks;
                const wp = utils.point;
                if(this.type.attached) {
                }
                for(const state of states) {
                    for (const name of animTrackTypeNames) {
                        if (name !== "") {
                            if(t[name] && state[name]) {
                                const key = t[name].keyAtTime(state.time);
                                if(key){
                                    if(this.type.attached) {
                                        if(name === "x" || name === "y") {
                                            this.attachedTo.key.scaleSelToLocalP(state.x, state.y, this.attachment.scaleAttachX ,this.attachment.scaleAttachY,wp);
                                            key.value = wp[name];
                                        }
                                    } else {
                                        key.value = state[name];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        updateAnimTrackLookup(name) {
            if (this.type.animated) {
                const track = this.animation.tracks[name];
                if (track) {
                    if (track.updateLookup() === true) { this.removeAnimTrack(name) }
                }
            }
        },
        updateKeyFrameLookup(name) {
            if (this.type.animated) {
                if (name) { this.updateAnimTrackLookup(name) }
                else {
                    const a = this.animation;
                    const needToDelete = workArray;
                    for (const name of a.named) {
                        if (a.tracks[name].updateLookup() === true) { needToDelete.push(name) }
                    }
                    if (needToDelete.length > 0) {
                        for (const name of needToDelete) { this.removeAnimTrack(name) }
                        workArray.length = 0;
                    }
                }
            }
        },
        updateWidgetAnimPath() {
            if (this.type.showAnimPath) {
                if (!this.widgetAnimPath) { this.widgetAnimPath = [] }
                animation.updateSprWidgetAnimPath(this);        
            }
        },
        cleanAndUpdateTrackLookups() {
            if (this.type.animated) {
				const remove = [];
                for (const name of this.animation.named) {
                    const track = this.animation.tracks[name];
                    if(track) {
						if (track.keys.length === 0) { remove.push(name) }
						if (track.dirty) {
							if (track.updateLookup() === true) { this.removeAnimTrack(name) }
						}
                    }
                }
				for(const name of remove) { this.removeAnimTrack(name) }
            }
        },
        removeKeyFrame(key, safe = true) {
            var idx, deleted = false;;
            if(this.type.animated) {
                const a = this.animation;
                if (safe) {
                    const name = key.name;
                    const track = a.tracks[name];
                    if (track) {
                        this.setAnimTime(key.time);
                        if (track.atKey) {
                            const keys = track.keys;
                            keys.splice(track.frameAIdx, 1)[0].selected = false;
                            track.dirty = true;
                            if (track.updateLookup() === true) { this.removeAnimTrack(name) }
                            return true;
                        }
                    }
                }else{
                    a.eachTrack(track => {
                        idx = 0;
                        for(const k of track.keys) {
                            if(k === key) {
                                track.keys.splice(idx,1);
                                key.selected = false;
                                track.dirty = true;
                                deleted = true;
                                return true;
                            }
                            idx ++;
                        }
                    })
                    return deleted;
                }
            }
            return false;
        },
        prevFrameTime(){
            if(this.type.animated) {
                const a = this.animation;
                this.cleanAndUpdateTrackLookups();
                var t, time = animation.startTime;
                a.eachTrack(track => {
                    const keys = track.keys;
                    if(keys && keys.length) {
                        if(track.atKey) {
                            const t1 = track.frameAIdx;
                            t = keys[t1 > 0 ? t1 - 1 : t1].time;
                        }else {
                            const t1 = track.frameAIdx;
                            t = keys[t1].time;
                        }
                        time = t > time ? t : time;
                    }
                });
            }
            return time;
        },
        nextFrameTime(){
            if(this.type.animated) {
                const a = this.animation;
                this.cleanAndUpdateTrackLookups();
                var t, time = animation.endTime,timeFrom = animation.time;
                a.eachTrack(track => {
                    const keys = track.keys;
                    if(keys && keys.length) {
                        const t1 = track.frameBIdx;
                        t = keys[t1].time;
                        time = t > timeFrom && t < time ? t : time
                    }
                });
            }
            return time;
        },
        getAnimKey(time,name) {
            if(this.type.animated) {
                if (!isNaN(name)) { name = animTrackTypeNames[name] }
                const a = this.animation;
                this.cleanAndUpdateTrackLookups();
                if(a.tracks[name]) {
                    const track = a.tracks[name];
                    const keys = track.keys;
                    if(keys && keys.length) {
                        var kTime = track.timing.getTime(time);
                        for(const key of keys) {
                            if (key.time === kTime) {
                                return key;
                            }
                        }
                    }
                }
            }
        },
        setAnimTime(time) {
            if(this.type.animated) {
                time = Math.floor(time);
                const a = this.animation;
                a.time = time;
                a.atKey = false;
                a.eachTrack(track => {
                    track.setTime(time);
                    if(track.atKey) { a.atKey = true }
                });
            }
        },
        setAnimFrame(time){
            var v;
            this.setAnimTime(time);
            if(this.type.animated) {
                time = Math.floor(time);
                const att = animTrackType;
                const a = this.animation;
                a.needUpdate = false;
                a.eachTrack(track => {
                    const name = track.name;
                    const type = track.type;
                    const timing = track.timing;
                    const keys = track.keys;
                    const len = keys.length;
                    const f1 = keys[track.frameAIdx];
                    if(f1) {  // When timeline edits frams this sometimes is undefined. Needs to be fixed as should not happen
                        const f2 = keys[track.frameBIdx];
                        const kTime = timing.time;
                        var oldVal = this[name];
                        if(isNaN(f1.value)) {
                             if(type === att.rgb) {
                                const tRange = f2.time - f1.time;
                                v = tRange ? animCurves[f1.curve]((kTime - f1.time) / tRange) : 0;
                                this.rgb.css = f1.value.tween(f2.value, v);
                            } else {
                                this[name] = f1.value;
                            }
                        }else{
                            const tRange = f2.time - f1.time;
                            v = tRange ? animCurves[f1.curve]((kTime - f1.time) / tRange) * (f2.value - f1.value) + f1.value : f1.value;
                            v += timing.leadStep * timing.leadVal;
                            if ((type === att.sx || type === att.sy) && this.type.normalisable){
                                if(type === att.sx){
                                    this.w = v;
                                    this.cx = this.w / 2;
                                }else{
                                    this.h = v;
                                    this.cy = this.h / 2;
                                }
                            } else if(this.type.attached) {
                                if ((type === att.x || type === att.y) || (this.attachment.inheritRotate && (type === att.rx  || type === att.ry))){
                                    this.attachment[name] = v;
                                } else if (this.attachment.inheritScaleX && type === att.sx) {
                                    this.attachment.sx = v;
                                } else if (this.attachment.inheritScaleY && type === att.sy) {
                                    this.attachment.sy = v;
                                } else if (type === att.image) { // if here then must be a sub sprite idx
                                    oldVal = this.subSpriteIdx;
                                    this.quickSetSubSprite(v);
                                } else { this[name] = v }
                            } else if(type === att.image) {  // if here then must be a sub sprite idx
								oldVal = this.subSpriteIdx;
								this.quickSetSubSprite(v);
                            } else if(type === att.a) {
                                this.a = v < 0 ? 0 : v > 1 ? 1 : v;
                            } else { this[name] = v }
                        }
                        if (oldVal !== this[name]) { a.needUpdate = true }
                    }
                });
                if(a.needUpdate) {
                    if(this.type.image && this.image === undefined) {  // BUG this.image should never be undefined is this.type.image is true
                        log.warn("Bad image ref in key frames");
                    }else if (this.type.image && !this.type.subSprite && (this.w !== this.image.w || this.h !== this.image.h)) {
						this.cx = (this.w = this.image.w) / 2;
						this.cy = (this.h = this.image.h) / 2;
                    }
                }
            }
            if (this.type.group && this.group.animated) {
                if(this.group.time !== time) {
                    this.group.eachAnimated(spr => spr.setAnimFrame(time));
                    this.group.time = time;
                }
            }
        },
        getAnimTimeExtent() {
            var start = -1, end = 0;
            if (this.type.animated) {
                const a = this.animation;
                a.eachTrack(track => {                
                    const {min, max} = track.timeRange();
                    if (start = -1) {
                        start = min;
                        end = max;
                    }
                    if (min < start) { start = min; }
                    if (max > end) { end = max; }
                });
            } else {
                start = 0;
                end = 0;
            }
            return {start, end};
            
        },
        fitToExtent(extent, scale = true){
            if (scale) {
                this.sx = extent.w / this.w;
                this.sy = extent.h / this.h;
            }
            this.rx = 0;
            this.ry = Math.PI / 2;
            this.x = extent.x + extent.w / 2;
            this.y = extent.y + extent.h / 2;
            this.type.normalisable ? this.normalize() : this.key.update();
            return this;
        },
        fitToCorners(topLeft, topRight, botLeft) {
            const a = topLeft, b =  topRight, c  = botLeft;
            const xAx = b.x - a.x;
            const xAy = b.y - a.y;
            const yAx = c.x - a.x;
            const yAy = c.y - a.y;
            var rx = (Math.atan2(xAy, xAx) + Math.TAU) % Math.TAU;
            var ry = (Math.atan2(yAy, yAx) + Math.TAU) % Math.TAU;
            const xl = (xAx * xAx + xAy * xAy) ** 0.5;
            const yl = (yAx * yAx + yAy * yAy) ** 0.5;

            this.x = (b.x + c.x) / 2;
            this.y = (b.y + c.y) / 2;
            this.rx = rx;
            this.ry = ry;
            this.sx = xl / this.w;
            this.sy = yl / this.h;
            this.type.normalisable ? this.normalize() : this.key.update();
            return this;
        },
        fitToView(view){
            this.rx = 0;
            this.ry = Math.PI / 2;
            const viewPos = view.position;
            this.x = -viewPos.x / view.scale+ view.viewWidth / 2;
            this.y = -viewPos.y / view.scale + view.viewHeight / 2;
            if(this.type.normalisable){
                this.w = view.viewWidth;
                this.h = view.viewHeight;
                this.sx = 1;
                this.sy = 1;
                this.cx = this.w / 2;
                this.cy = this.h / 2;
            }else{
                this.sx = view.viewWidth / this.w;
                this.sy = view.viewHeight / this.h;
            }
            this.key.update();
            return this;
        },
        fitTo(spr, scale = true, rotate = true){
            if (scale) {
                this.sx = spr.w * spr.sx / this.w;
                this.sy = spr.h * spr.sy / this.h;
                if(this.type.normalisable){
                    this.sx = Math.abs(this.sx);
                    this.sy = Math.abs(this.sy);
                }
            }
            if (rotate) {
                this.rx = spr.rx;
                this.ry = spr.ry;
            }
            this.x = spr.x;
            this.y = spr.y;
            if(this.type.normalisable) {
                this.normalize();
            } else {
                this.key.update();
            }
            return this;
        },
        addFilter(){
            if(this.type.renderable){
                if(this.filters === undefined){
                    this.filters = new Filters(this);
                }
                this.filters.add("blur");
                this.filters.add("brightness");
                this.filters.add("shadow");
                this.filters.add("contrast");
                this.filters.add("grayscale");
                this.filters.add("saturate");
                this.filters.add("sepia");
                this.filters.add("hue");
                this.filters.add("invert");
            }
        },
        /*setOrderedLinkedSprite(spr, order) {
            if (spr) {
                this.type.linked = true;
                this.linked = spr;
                if (spr.linkers === undefined) { spr.linkers = new Set() }
                
                spr.linkers.add(this);
                spr.linkOrder = order
            }
            
            
        },*/
        /*setLinkedSprite(spr) {
            if (this.type.linked) {  this.clearLinked(spr) }
            if (spr) {
                this.type.linked = true;
                if (this.linked) { this.linked.push(spr); }
                } else { this.linked = spr; }
                if (spr.linkers === undefined) { spr.linkers = new Set() }
                spr.linkers.add(this);
            }
        },
        clearLinked(spr){
            if (this.type.linked && this.linked) {
                for (const linked of this.linked) {
                    if (spr === linked || spr === undefined) {
                        if (linked.linkers) {
                            linked.linkers.delete(this);
                            if (!linked.linkers.size) { linked.linkers = undefined; }                        
                        }
                    }
                }
                if (spr !== undefined) {
                    var i = 0;
                    for (const linked of this.linked) {
                        if (spr === linked) {
                            this.linked.splice(i, 1);
                            log("Link removed");
                            break;
                        }
                        i++;
                    }
                } else {
                    this.linked.length = 0;
                }
            }
            if (this.linked.length === 0) {
                this.type.linked = false;
                this.linked = undefined;
                log("Links cleared");
            }
        },	*/	
        setLinkedSprite(spr) {
            if (this.type.linked) {  this.clearLinked() }
            if (spr) {
                this.type.linked = true;
                this.linked = spr;
                if (spr.linkers === undefined) { spr.linkers = new Set() }
                spr.linkers.add(this);
            }
        },
        clearLinked(){
            if (this.type.linked && this.linked) {
                if (this.linked.linkers) {
                    this.linked.linkers.delete(this);
                    if (this.linked.linkers.size === 0) { this.linked.linkers = undefined; }                        
                }
            }
            this.type.linked = false;
            this.linked = undefined;
			log("Link cleared");
        },		        
        setLookatSprite(spr, rotateOffset){
            if(this.type.lookat){  this.clearLookat() }
            if(spr) {
                if (this.type.attached) { this.attachment.rotateType = "fixed" }
                this.type.lookat = true;
                this.lookat = {
                    spr,
                    offsetX : rotateOffset === undefined ? 0 : rotateOffset,
                    offsetY : 0,
                    distance: 0,
                };
                this.key.update();               // when first set update find the rotation to point to look at
                if(rotateOffset === undefined) { // assumes first setting the lookat
                    this.lookat.offsetX = 0;     // uses the calcualted direction from key.update to set the direction
                    this.key.update();
                }
                if(this.type.marker) {
                    this.axiesLen[0] = this.cy / 2;
                    this.axiesLen[2] = this.cy / 2;
                    this.axiesLen[3] = this.cx / 2;
                }
                if(spr.lookers === undefined){ spr.lookers = new Set() }
                spr.lookers.add(this);
            }
        },
        clearLookat(){
            if(this.type.lookat && this.lookat) {
                if(this.lookat.spr.lookers) {
                    this.lookat.spr.lookers.delete(this);
                    if (this.lookat.spr.lookers.size === 0) {
                        this.lookat.spr.lookers = undefined;
                    }
                }
            }
            this.type.lookat = false;
            this.lookat = undefined;
            if(this.type.marker) {
                this.axiesLen[0] = this.axiesLen[1] = this.axiesLen[2] = this.axiesLen[3] = 1000 * 16;
            }
            this.key.update();
        },
        attachLocator(spr){ // removes if already attached
            const loc = new Locator(this,spr);
            if (this.type.hasLocators) {
                if (this.locators.find(l => l.spr.guid === spr.guid)) {
                    this.removeLocator(spr);
                    return;
                }
                this.locators.push(loc);
            } else {
                if(this.type.cutter && this.type.normalisable) { this.normalize(false) }
                this.locators = createLocators(loc, this)
            }
            this.type.hasLocators = true;
            loc.locate();
            if (spr.locates) {
                if (!spr.locates.includes(this)) {  spr.locates.push(this) }
            } else { spr.locates = [this] }
            spr.type.locates = true;
            this.key.update();
        },
        removeLocator(spr){
            if (this.type.hasLocators) {
                const lIdx = this.locators.findIndex(loc => loc.spr.guid === spr.guid);
                if (lIdx > -1) {
                    if (spr.type.locates) {
                        const idx = spr.locates.findIndex(s => s.guid === this.guid);
                        if (idx > -1) { spr.locates.splice(idx,1) }
                        if (spr.locates.length === 0) { spr.locates = undefined; spr.type.locates = false }
                    }
                    this.locators.splice(lIdx,1);
                    if (this.locators.length === 0) {
                        this.locators.releasing();
                        this.locators = undefined;
                        this.type.hasLocators = false;
                    }
                    if(this.canBeNormalisable()) { this.normalize(true) }
                    return true;
                }
            }
        },
        clearLocators(){
            if(this.type.hasLocators) {
                while(this.locators.length) {
                    if(this.removeLocator(this.locators[0].spr)) {
                        if (!this.type.hasLocators) { return }
                    }else {
                        log.warn("Sprite could not clear locator");
                        return; // this covers a bug I have not yet looked for
                    }
                }
            }
        },
        attachSprite(spr, attachPos, ignoreState = false){
            var animStates;
            if (this.type.attached){ animStates = this.clearAttached(true) }
            if (this.type.animated && !animStates) { animStates = sprites.getSpriteStateAtKeys(this) }
            if (this.attachment === undefined) { this.attachment = new Attachment(this) }
            this.type.attached = true;
            this.attachedTo = spr;
            if (spr.attachers === undefined) {spr.attachers = new Set()}
            spr.attachers.add(this);
            if (spr.type.gradient) { this.gridSpecial = spriteRender.gridSpecialNames.gradientColor }

            if(attachPos) {
                this.attachment.x = attachPos.x;
                this.attachment.y = attachPos.y;
                this.attachment.position();
            }else{
                this.attachment.locate();
                if (animStates && !ignoreState) {
                    this.updateKeysFromStateArray(animStates);
                    this.setAnimFrame(animation.time)
                    spr.key.update();
                    //this.key.update();
                } // else { this.attachment.locate() }
            }
            this.attachment.zorder = spr.attachers.size - 1;
            this.type.canGroup = false;
            this.key.update();
            if(!spr.canBeNormalisable()) { spr.normalize(false) }
            if(!this.canBeNormalisable()) { this.normalize(false) }
        },
        clearAttached(tempClear = false){
            var animStates;
            if(this.type.attached && this.attachedTo) {
                if(this.type.animated) {  animStates = sprites.getSpriteStateAtKeys(this) }
                if(this.attachedTo.attachers) {
                    this.attachedTo.attachers.delete(this);
                    if (this.attachedTo.attachers.size === 0) { this.attachedTo.attachers = undefined }
                }
            }
            const att = this.attachedTo;
            this.type.attached = false;
            this.attachedTo = null;
            if (tempClear) {
                const attachment = this.attachment;
                this.attachment = undefined;
                this.key.update();
                this.attachment = attachment;
                return animStates;
            }
            if (att && att.type.gradient && this.gridSpecial === spriteRender.gridSpecialNames.gradientColor) {
                this.gridSpecial = 0;
            }
            this.attachment = undefined;
            if (animStates) {
                this.updateKeysFromStateArray( animStates);
                this.key.update();
             }
            if (this.canBeNormalisable()) {
                this.normalize(true);
            }
            if (att && att.canBeNormalisable()) {
                att.normalize(true);
            }
            this.key.update();
        },
        preDelete() {
            this.fireEvent("onpredelete");
            if (this.highlightSelecting) { this.highlightSelecting = false }
            if (this.type.compoundShape) {
                [...this.ofShapes.values()].forEach(shape => shape.compoundUnjoin(this));
            }
            if (this.type.hasLocators){ this.clearLocators() }
            if (this.locates) {
                for(const s of this.locates){  s.clearLocators() }
            }
            if (this.type.linked) { this.clearLinked() }
            if (this.linkers) { for(const s of this.linkers.values()) { s.clearLinked() } }			
            if (this.type.lookat) { this.clearLookat() }
            if (this.lookers) { for(const s of this.lookers.values()) { s.clearLookat() } }
            if (this.type.attached) {
                if (this.attachedTo.type.gradient) { this.attachedTo.gradient.update = true }
                this.clearAttached()
            }
            if(this.attachers) {
                for (const s of this.attachers.values()) { s.clearAttached() }
            }
            if (this.type.text) {  this.textInfo.removeOwner(this) }
            if (this.type.imgSequence) {
                this.imgSequence = undefined;
            }
            if(this.type.functionLink) {
                if(!this.fLink.funcObj && this.fLink.type === "cap") {
                    this.fLink.outputs.forEach(spr => {
                        if(spr.type.liveCapture) {
                            if(spr.captureList) { delete spr.captureList }
                        }
                    })
                }
            }
            sprites.eachFunctionLink(spr=> {
                if(spr.fLink.inputs.includes(this)) {
                    spr.fLink.reset = true;
                    const idx = spr.fLink.inputs.indexOf(this);
                    spr.fLink.inputs.splice(idx,1);
                }
                if(spr.fLink.outputs.includes(this)) {
                    spr.fLink.reset = true;
                    const idx = spr.fLink.outputs.indexOf(this);
                    spr.fLink.outputs.splice(idx,1);
                }
            });
            if (this.type.pattern) {
                sprites.eachShape((spr, shape) => {
                    if(shape.patternSpr && shape.patternSpr.guid === this.guid) {
                        shape.patternSpr = undefined;
                    }
                })
            }
            if (this.type.group && this.type.open) {
                this.closeGroup();
            }
            if (this.type.shadow) {
                if(this.cast.type.group) {
                    this.cast.group.remove(this.shadow);
                    groups.removeOwner(this.shadow);
                }
                this.shadow.shadowedBy = undefined;
            }
            if(this.type.group) {
                groups.removeOwner(this);
            }
            if (this.onDelete) { this.onDelete(this,"ondelete") }
            this.deleted = true;
            this.fireEvent("ondeleting");
        },
        hide(state) {
            if (this.type.hidden !== state) {
                this.type.hidden = state;
                sprites.spriteTypeChange(this);
            }
        },       
        showToRender(state) {
            if (this.type.renderable !== state) {
                this.type.renderable = state;
                sprites.spriteTypeChange(this);
            }
        },
        changeToGrid(){
            this.type.cutter = false;
            this.type.grid = true;
            this.rename("Guide");
            shiftClickTypes.add(this,"gridSetting");
            this.grid = {...gridInfo, p1 : {...gridInfo.p1}, p2 : {...gridInfo.p2}, p3 :{...gridInfo.p2} , p4 :{...gridInfo.p2} };
        },
        changeToTextOld(content = {text : "text"}){
            this.type.cutter = false;
            this.type.text = true;
            if(this.type.normalisable) {
                this.type.normalisable = false;
                this.type.mirrorX = false;
                this.type.mirrorY = false;
            }
            this.type.renderable = true;
            this.rename("Text");
            const owner = this;
            const textEvent = {text : ""};
            this.textInfo = {
                owner,
                content,
                get text() { return this.content.text },
                set text(val) { this.change(val) },
                set textData(data) {
                    textEvent.text = data;
                    owner.fireEvent("settext",textEvent);
                    this.content.text  = textEvent.text ;
                },
                get textData() {
                    textEvent.text = this.content.text ;
                    owner.fireEvent("gettext",textEvent);
                    return textEvent.text ;
                },
                font : "arial",
                size : 32,
                strokeStyle : null,
                lineWidth : 1,
                dirty : true,
                prevText : "",
                setFont(name, size = this.size) {
                    this.font = name;
                    this.size = size;
                    this.dirty = true;
                    this.update(view.context);
                },
                change(text) {
                    if (this.content.text !== text) {
                        this.content.text = "" + text;
                        this.prevText = "" + text;
                        this.update();
                    }
                },
                update(ctx = view.context){
                    ctx.font = this.size + "px " + this.font;
                    this.width = ctx.measureText(this.content.text).width;
                    this.owner.w = this.width;
                    this.owner.cx = this.width / 2;
                    this.owner.h = this.size * 1.2;
                    this.owner.cy = this.size * 1.2 / 2;
                    this.owner.key.update();
                    this.prevText = this.content.text;
                    this.dirty = false;
                },
                setState(ctx){
                    if(this.prevText !== this.content.text) { this.update() }
                    ctx.font = this.size + "px " + this.font;
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    if(this.strokeStyle !== null){
                        ctx.strokeStyle = this.strokeStyle;
                        ctx.lineWidth = this.lineWidth;
                    }
                    ctx.fillStyle = this.owner.rgb.css;
                },
            };
            this.textInfo.update(view.context);
        },
        changeToText(text, sprText, makeUnique = false) {
            if (this.type.text && makeUnique) {
                this.textInfo = spriteText.copy(this.textInfo);
                this.textInfo.addOwner(this);
                this.textInfo.update(view.context);
                if (text !== undefined && this.textInfo.text !== text) { this.textInfo.text = text; }
            } else {
                this.type.cutter = false;
                this.type.text = true;
                if(this.type.normalisable) {
                    this.type.normalisable = false;
                    this.type.mirrorX = false;
                    this.type.mirrorY = false;
                }
                this.type.renderable = true;
                if (sprText) {
                    this.textInfo = sprText;
                } else {
                    this.textInfo = spriteText.create(text);
                }
                this.textInfo.addOwner(this);
                this.textInfo.update(view.context);
            }
        },
        changeToVanish(radial){
            this.type.cutter = false;
            this.type.vanish = true;
            shiftClickTypes.add(this,"gridSetting");
            if(radial){
                this.rename("Vanish Guide");
            }else{
                this.rename("Vanish Guide Radial");
            }
            this.grid = {...gridInfo, radial, p1 : {...gridInfo.p1}, p2 : {...gridInfo.p2}, p3 :{...gridInfo.p2}, p4 :{...gridInfo.p2}};
        },
        changeToMarker(name, spriteName = "Marker"){
            this.type.cutter = false;
            this.type.marker = true;
            shiftClickTypes.add(this,"markerName");
            this.rename(spriteName);
            this.marker = name;
            this.axiesLen = [16000, 16000, 16000, 16000]; // Axis order -y +x +y -x
        },
        changeToPallet(name, pallet){
            this.type.cutter = false;
            this.type.pallet = true;
            this.rename(name ? name : "Pallet");
            if(pallet){
                this.pallet = pallet;

            }else{
                this.pallet = media.createPallet(0);
            }
        },
        changeToCutter(normalisable = true) {
            if (this.type.functionLink) { return }
            if (this.type.shadow) { return }

            if(this.type.marker) {
                delete this.marker;
                delete this.axiesLen;
                this.type.marker = false;
                shiftClickTypes.remove(this);

            } else if (this.type.pallet) {
                this.type.pallet = false;
                delete this.pallet;
            } else if (this.type.vanish) {
                this.type.vanish = false;
                delete this.grid;
                shiftClickTypes.remove(this);
            } else if (this.type.text) {
                this.type.text = false;
                delete this.textInfo
            } else if (this.type.grid) {
                this.type.grid = false;
                delete this.grid;
                shiftClickTypes.remove(this);
            } else if (this.type.shape) {
                this.type.shape = false;
                delete this.shapeName;
                delete this.shape;
                shiftClickTypes.remove(this);
            } else if (this.type.vector) {
                this.type.vector = false;
                delete this.vector;
            } else if (this.type.image) {
                this.type.image = false;
                delete this.image;
            }
            if(normalisable) {
                if(!this.type.normalisable && this.type.animated) {
                    const a = this.animation;
                    const w = this.w;
                    const h = this.h;
                    a.eachKeyOfTrack((key, name, anim) => key.value *= w, "sx");
                    a.eachKeyOfTrack((key, name, anim) => key.value *= h, "sy");
                }
                this.type.normalisable = true;
            }
            this.type.renderable = false;
            this.type.cutter = true;
            this.type.normalisable && this.normalize();
            sprites.spriteTypeChange(this);
            return this;


        },
        changeImage(image, rename = false, fitCurrent = false, dontNormalizeScale = false){
            if (!image || !image.desc) { return }
            if(image.vector) {
                this.changeToVector(rename ? undefined : this.name, image);
                this.type.renderable = true;
                return this;
            }
			if(image.desc.isSound) { Sound(this) }
            if(this.type.normalisable && this.type.animated && !dontNormalizeScale) {
                const a = this.animation;
                const w = image.w;
                const h = image.h;
                a.eachKeyOfTrack((key, name, anim) => key.value /= w, "sx");
                a.eachKeyOfTrack((key, name, anim) => key.value /= h, "sy");
            }
            this.image = image;
            if(rename){
                if(this.type.cutter) {
                    this.rename(this.name.indexOf("Cutter") === 0 ? NAMES.register(image.desc.name) : this.name);
                }else if(this.type.shape) {
                    this.rename(this.name.indexOf("Shape") === 0 ? NAMES.register(image.desc.name) : this.name);
                }else if(this.type.image) {
                    this.rename(image.desc.name);
                }
            }
            if (this.type.shape) {
                this.type.shape = false;
                this.shapeName = undefined;
                this.shape = undefined;
                this.setSnaps(undefined);
            }
            this.type.cutter = false;
            if(this.type.normalisable) {
                this.type.normalisable = false;
                this.type.mirrorX = false;
                this.type.mirrorY = false;
            }
            this.type.renderable = true;
            this.type.image = true;
            if(fitCurrent) {
                const w = this.w * this.sx;
                const h = this.h * this.sy;
                this.sx = w / image.w;
                this.sy = h / image.h;
                this.w = image.w;
                this.h = image.h;
                this.cx = image.w / 2;
                this.cy = image.h / 2;
            }
            this.w = image.w;
            this.h = image.h;
            this.cx = image.w / 2;
            this.cy = image.h / 2;
            this.key.update();
            if (this.type.shadow) { this.shadow.changeImage(image, rename) }
            sprites.spriteTypeChange(this);
            return this;
        },
        changeToShape(name = this.name, shapeName, data) {
            if(typeof shapeName === "string"  && spriteShapes[shapeName]) {
                this.type.cutter = false;
                this.type.shape = true;
                this.shapeName = shapeName;
                this.shape = {...spriteShapes[shapeName]};
                this.type.renderable = true;
                this.setSnaps(undefined);
            }else if(typeof shapeName === "object" && shapeName.draw) {
                this.type.cutter = false;
                this.type.shape = true;
                this.shapeName = shapeName.name;
                this.shape = shapeName;
                this.type.renderable = true;
                this.setSnaps(undefined);
            }
            if (this.shape.scaleable === true) {
                if(this.type.normalisable) {
                    this.type.normalisable = false;
                    this.type.mirrorX = false;
                    this.type.mirrorY = false;
                }
                if (data) {
                    this.shape.data = data
                    if (data.vector) {
                        this.w = data.w;
                        this.h = data.h;
                        this.cx = data.w / 2;
                        this.cy = data.h / 2;
                    }
                }
                this.key.update();
            }
            this.name !== name && this.rename(name);
        },
        changeToVector(name,vector) {  // do not use. Depreciated
            log.warn("Lazzy codder warning. Call to Depreciated sprite.changeToVector");
            if(this.type.normalisable && this.type.animated) {
                if(this.animation.tracks.sx){
                    const animW = this.animation.tracks.sx.keys[0];
                    this.animation.tracks.sx.eachKey(key => key.value /= animW)
                }
                if(this.animation.tracks.sy){
                    const animH = this.animation.tracks.sy.keys[0];
                    this.animation.tracks.sy.eachKey(key => key.value /= animH)
                }
            }
            this.type.vector = true;
            this.vector = vector;
            this.type.cutter = false;
            if(this.type.normalisable) {
                this.type.normalisable = false;
                this.type.mirrorX = false;
                this.type.mirrorY = false;
            }
            this.rename(name ? name : NAMES.register("Vector"));
            this.w = vector.w;
            this.h = vector.h;
            this.cx = vector.w / 2;
            this.cy = vector.h / 2;
            this.type.renderable = true;
            this.key.update();
            return this;
        },
        changeToFunctionLink() {
            this.type.cutter = false;
            this.type.functionLink = true;
            this.locks.rotate = true;
            this.locks.scale = true;
            this.fLink = {
                inputs: [],
                outputs: [],
                funcObj: undefined,
                value: 0,
                values: [],
                data: 0, // not fixed and used to pass data
                inFrom : "v",
                outTo: "v",
                scale: 1,
                offset: 0,
                type: "sum",
                blocks: 0, // bit mapped IO blocks. bit 1 blocks input, bit 2 blocks output
                textColor: settings.functionLinkTextColor,
                inName: functionLink.input.names.none,
                outName: functionLink.output.names.none,
            };
        },
        makeIso() {
            if(!this.type.ISO) {
                this.type.ISO = true;
                this.iso = new ISOInfo(this);
                this.key.update();
            }
        },
        removeIso() {
            if(this.type.ISO) {
                this.rx = this.iso.rx;
                this.ry = this.iso.ry;
                this.iso =  undefined;
                this.type.ISO = false;
                this.key.update();
            }
        },
        changeToGroup(spritesList, center = false, group) {
            if(this.group === undefined) {
                this.group = group ? group : groups.createGroup(this);
                this.type.cutter = false;
                this.type.group = true;
                this.type.normalisable = false;
                this.type.renderable = true;
                groups.addOwner(this.group, this);
            }
            if (!group) {
                if (center) {
                    spritesList.forEach(spr => {
                        if(!spr.type.attached) {
                            spr.x -= this.x;
                            spr.y -= this.y;
                            spr.key.update();
                        }
                    });
                }
                this.group.addSprites(spritesList);
            }
            this.type.animate = this.group.hasAnimated();
            sprites.spriteTypeChange(this);
        },
        openCopyGroup() {
            const newSprites = [];
            if (this.type.group && !this.group.isOpen) {
                this.group.each(spr => {
                    const copy = spr.copy(true, true, true);
                    const cast = this.shadowedBy ? this.shadowedBy : this;
                    copy.transform(cast.key.m, cast.a, spr.key.m);
                    newSprites.push(copy);
                });
            }
            return newSprites;
        },
        openGroup() {
            if (this.type.group && !this.group.isOpen) {
                this.type.openGroup = true;
                this.group.owner = this;
                this.group.open = true;
                this.groupShadow = [];
                this.group.each(spr => {
                    const shadow = spr.copy(true, true, true);
                    shadow.shadowOf(this.shadowedBy ? this.shadowedBy : this, spr);
                    sprites.add(shadow);
                    this.groupShadow.push(shadow);
                });
                this.updateGroupShadows();
            }
        },
        closeGroup() {
            if (this.type.group && this.group.isOpen) {
                if(this.groupShadow) {
                    this.groupShadow.forEach(spr => {
                        if(spr.type.group && spr.group.isOpen) {
                            if(spr.type.shadow && spr.shadow.type.openGroup){
                                spr.shadow.closeGroup();
                            }
                        }
                    });
                    while(this.groupShadow.length) {
                        const shadowSpr = this.groupShadow.pop()
                        shadowSpr.shadow.shadowedBy = undefined;
                        shadowSpr.type.shadow = false;
                        shadowSpr.cast = undefined;
                        shadowSpr.shadow = undefined;
                        sprites.remove(shadowSpr);
                    }
                }
                this.type.openGroup = false;
                this.group.open = false;
                this.groupShadow = undefined;
            }
        },
        updateGroupShadows() {
            if(this.type.openGroup) {
                if(this.shadowedBy) {
                    this.groupShadow.forEach(s => {
                        if(!s.selected){
                            s.a = s.shadow.a;
                            s.transform(this.shadowedBy.key.m, this.a, s.shadow.key.m);
                        } else {
                            s.key.matchShadow(s);
                        }
                    });
                } else {
                    this.groupShadow.forEach(s => {
                        if(!s.selected){
                            s.a = s.shadow.a;
                            s.transform(this.key.m, this.a, s.shadow.key.m);
                        } else {
                            s.key.matchShadow(s);
                        }
                    });
                }
            }
        },
        reboundGroup() {
            this.group.owner = this;
            const e = Extent();
            this.group.each(spr => spr.key.calcExtent(e));
            this.group.each(spr => {
                spr.x -= (e.l + e.r) / 2;
                spr.y -= (e.t + e.b) / 2;
            })
            this.group.each(spr => spr.key.update())
            this.w = e.w;
            this.h = e.h;
            const ofX = (e.l + e.r) / 2;
            const ofY = (e.t + e.b) / 2;
            this.key.toWorld(ofX, ofY);
            this.x += this.key.wrx;
            this.y += this.key.wry;
            this.cx = this.w / 2;
            this.cy = this.h / 2;
            this.key.update();
            groups.eachOwnerOf(spr => {
                if (spr.guid !== this.guid) {
                    spr.w = e.w;
                    spr.h = e.h;
                    spr.key.toWorld(ofX, ofY);
                    spr.x += spr.key.wrx;
                    spr.y += spr.key.wry;
                    spr.cx = e.w / 2;
                    spr.cy = e.h / 2;
                    spr.key.update();
                }
            }, this.group);
        },
        removeFromGroup(spr){
            if(this.type.group) {
                if(this.group.hasSprite(spr)) {
                    if(this.group.isOpen) {
                        const idx = this.groupShadow.indexOf(spr.shadowedBy);
                        if(idx > -1) {
                            this.groupShadow.splice(idx,1);
                        }
                        sprites.remove(spr.shadowedBy);
                        spr.shadowedBy = undefined;
                    }
                    this.group.remove(spr);
                }
            }
        },
        canGroup() {
            if(this.type.attached || this.type.hasLocators || this.type.lookat || this.locates || this.lookers || this.attachers || this.type.functionLink){
                return false;
            }
            return true;
        },
        addImageSequence(imgSequence, idx) {
            if(this.type.image) {
                this.type.imgSequence = true;
                this.imgSequence = imgSequence;
                this.imageIdx = idx !== undefined ? ((idx % imgSequence.length + imgSequence.length) % imgSequence.length) | 0 : 0;
                idx !== undefined && (this.image = imgSequence[this.imageIdx]);
            }
        },
		getUniqueSubSpriteForIdx(idx) {
			const desc = this.image.desc
			idx = ((idx | 0) % desc.subSprCount);
			if(desc.gridSubSprites) {
				const ss = this.subSprite;
				const x = (idx % ss.c) * ss.w ;
				const y = (idx / ss.c | 0)  * ss.h;
				return {
					uid: spr.image.guid + ":" + x + ":" + y + ":" + ss.w + ":" + ss.h,
					subSprite: {x, y, w: ss.w, h: ss.h},
				};
			}
			const ss = desc.sprites[idx];
			return {
				uid: spr.image.guid + ":" + ss.x + ":" + ss.y + ":" + ss.w + ":" + ss.h,
				subSprite: ss,
			};
		},
		quickSetSubSprite(idx) { // only call this if you are sure the spr state is correct
		    var xx, yy, ss;
			const desc = this.image.desc;
			this.subSpriteIdx = idx | 0;
			idx = Math.abs((idx | 0) % desc.subSprCount);
			if(desc.gridSubSprites) {
				ss = this.subSprite
				xx = ss.x;
				yy = ss.y;
				ss.x = (idx % ss.c) * ss.w ;
				ss.y = (idx / ss.c | 0)  * ss.h
			} else {
				ss = this.subSprite = desc.sprites[idx];
				xx = ss.x;
				yy = ss.y;
				this.w =  ss.w;
				this.h =  ss.h;
				this.cx = ss.w / 2;
				this.cy = ss.h / 2;
			}
			if (this.drawOn) {
				const k = this.key;
				k._lx = ss.x + (k._lx - xx);
				k._ly = ss.y + (k._ly - yy);
			}
		},
        updateSubSprite(x, y, w, h, anchorFromSub = false) {
            if (this.type.subSprite) {
                const desc = this.image.desc;
                if (!desc.gridSubSprites) {
                    const ss = this.subSprite
                    ss.x = x ?? ss.x;
                    ss.y = y ?? ss.y;
                    ss.w = w ?? ss.w;
                    ss.h = h ?? ss.h;
                    this.w =  ss.w;
                    this.h =  ss.h;
                    this.cx = ss.w / 2;
                    this.cy = ss.h / 2;
                    if (this.drawOn) {
                        const k = this.key;
                        k._lx = ss.x + (k._lx - xx);
                        k._ly = ss.y + (k._ly - yy);
                    }
                    if (this.attachers) {
                        const p = workPointA;
                        for (const atSpr of this.attachers.values()) {
                            if (atSpr.gridSpecial === spriteRender.gridSpecialNames.subSpriteAnchor) {
                                if (anchorFromSub && ss.cx !== undefined) {
                                    this.key.toWorldPoint(ss.x + ss.cx, ss.y + ss.cy, p);
                                    atSpr.x = p.x;
                                    atSpr.y = p.y;
                                    atSpr.key.update();
                                } else {
                                    p.x = atSpr.x;
                                    p.y = atSpr.y;
                                    this.key.toLocalPoint(p);
                                    this.subSprite.cx = Math.resolution(p.x, 0.5);
                                    this.subSprite.cy = Math.resolution(p.y, 0.5);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        },
		changeToSubSprite(idx) {
			if(this.type.image && !this.type.imgSequence && this.image.desc.sprites) {
				idx |= 0;
				if(this.type.subSprite) {
					if (Math.abs(idx % this.image.desc.subSprCount) ===  Math.abs(this.subSpriteIdx % this.image.desc.subSprCount)) { return }
				}else {
					this.key.toSubSprite();
					sprites.spriteTypeChange(this);
				}
				this.type.subSprite = true;
				let ss ;
				if(this.image.desc.gridSubSprites) {
					if(!this.subSprite ) {
						ss = this.subSprite = {
							x: 0,
							y: 0,
							w: this.image.desc.sprites[0].w,
							h: this.image.desc.sprites[0].h,
							c: (this.image.w / this.image.desc.sprites[0].w | 0),
							r: (this.image.h / this.image.desc.sprites[0].h | 0),

						};
						this.w =  ss.w;
						this.h =  ss.h;
						this.cx = ss.w / 2;
						this.cy = ss.h / 2;
						this.image.desc.subSprCount = ss.c * ss.r;
					} else { ss = this.subSprite }
					this.subSpriteIdx = idx;
					idx = Math.abs(idx % this.image.desc.subSprCount);
					ss.x = (idx % ss.c) * ss.w ;
					ss.y = (idx / ss.c | 0)  * ss.h
				} else {
					this.image.desc.subSprCount = this.image.desc.sprites.length;
					this.subSpriteIdx = idx;
					ss = this.subSprite = this.image.desc.sprites[Math.abs(idx % this.image.desc.sprites.length)];
					this.w =  ss.w;
					this.h =  ss.h;
					this.cx = ss.w / 2;
					this.cy = ss.h / 2;
                    if (this.attachers) {
                        const p = workPointA;
                        for(const a of this.attachers) {
                            if (a.gridSpecial === spriteRender.gridSpecialNames.subSpriteAnchor) {
                                if (ss.cx !== undefined && ss.cy !== undefined) {

                                    this.key.toWorldPoint(ss.cx, ss.cy, p);
                                    a.x = p.x;
                                    a.y = p.y;
                                    a.key.update();
                                }
                            }

                        }
                    }
				}
			}
		},
        updateSubGSpr() {
            const spr = this;
            if (spr.type.image && this.type.subSprite && spr.image.desc.sprites) {
                if (!spr.image.desc.gridSubSprites) {
                    const subSpr = spr.image.desc.sprites[spr.subSpriteIdx];
                    if (subSpr.gSpr) {
                        if (subSpr.name !== spr.name) {
                            spr.name = subSpr.name;
                        }
                        if (spr.type.attached) {
                            if (spr.attachedTo.name === "Center") {
                                let sx = spr.attachedTo.w * 0.5 * spr.attachedTo.sx;
                                let sy = spr.attachedTo.h * 0.5 * spr.attachedTo.sy;
                                sx += spr.sx * spr.w * 0.5;
                                sy += spr.sy * spr.h * 0.5;
                                spr.attachment.x = sx - (subSpr.cx * subSpr.w) * spr.sx;
                                spr.attachment.y = sy - (subSpr.cy * subSpr.h) * spr.sy;
                                spr.attachment.position();
                                spr.key.update();
                            }
                        }
                    }        
                }
            }
        },            
        updateFunctionLink(){
            var hasUpdated = false;
            if (this.type.functionLink) {
                const f = this.fLink;
                if(f.funcObj) {
                    if(f.reset) {
                        f.funcObj.reset();
                        f.reset = false;
                    }
                    f.funcObj.update();
                    return f.funcObj.updateWidget
                }
                const i = f.inputs;
                const o = f.outputs;

                var v = 0;
                if (f.type !== f.lastType || f.reset) {
                    functionLink.functions.reset(f);
                    f.lastType = f.type;
                    f.reset = false;
                }
                if ((f.blocks & 1) === 0 ) {
                    if (i.length) {
                        const func = functionLink.functions[f.type];
                        //const compFunc = functionLink.compound.funcSuport[f.type];
                        func(0, true, false, f);
                        const input = functionLink.input.sprite[f.inFrom];
                        let fromFLink = false;
                        if (input) {
                            for (const s of i) {
                                if (s) {
                                    fromFLink = s.type.functionLink ? true : fromFLink;
                                    if (s.type.functionLink && !input._fLinkSafe) { 
                                        func(s.fLink.value, false, false, f); 
                                    } else { func(input(s), false, false, f) }
                                } else {
                                    f.reset = true;
                                }
                            }
                            if(i.length === 1 && fromFLink) { f.inName = functionLink.input.names.none }
                            else { f.inName = functionLink.input.names[f.inFrom] }
                        }
                        v = func(0,false, true, f);
                    } else {
                        const input = functionLink.input.system[f.inFrom];
                        f.inName = functionLink.input.names.none;
                        if (input)  {
                            const func = functionLink.functions[f.type];
                            func(0, true, false, f);
                            func(input(), false, false, f);
                            v = func(0, false, true, f);
                        } else {
                            const func = functionLink.functions.system[f.type] ?  functionLink.functions.system[f.type] :  functionLink.functions.system.default;
                            v = func(f);
                        }
                    }
                }
                if ((f.blocks & 2) === 0 ) {
                    if (o.length) {
                        if (v !== undefined) {
                            const out = functionLink.output.sprite[f.outTo];
                            f.outName = functionLink.output.names[f.outTo];
                            for (const s of o) {
                                if ((s.type.functionLink && out && !out.flProp ) || (s.type.functionLink && !out)) { s.fLink.value = v }
                                else {
                                    if (out(v, s)) { s.key.update(); hasUpdated = true; }
                                }
                            }
                        }
                    } else {
                        f.outName = functionLink.output.names.none;
                    }
                }
            }
            return hasUpdated;
        },
        attachFunc(spr, type) {
            if(this.type.functionLink) {
                if(this.fLink.funcObj) {
                    if(this.fLink.attachIdx !== undefined) {
                        var id = (type === "input" ? this.fLink.funcObj.inputs : this.fLink.funcObj.outputs)[this.fLink.attachIdx][1];
                        this.fLink.funcObj.bind(spr, id);
                        this.fLink.attachIdx = undefined;
                    }
                } else {
                    var t = type === "input" ? this.fLink.inputs : this.fLink.outputs;
                    if(t.includes(spr)) {
                        const idx = t.indexOf(spr);
                        t.splice(idx,1);
                    }else{
                        t.push(spr);
                    }
                    if(this.fLink.resetOnChange) { this.fLink.reset = true }
                }
            }
        },
        canDrawOn() {
            return this.type.image && this.image.isDrawable && !this.type.hidden && !this.locks.UI;
        },
        setDrawOn(state){
            if (this.type.image && this.image.isDrawable && !this.type.hidden && !this.locks.UI) {
                this.drawOn = state;
                if(this.image.desc.capturing) {
                    this.image.desc.shared = state;
                }
            }
        },
        imageResized(hasClip){
            var i;
			if(this.type.image && !this.type.imgSequence && this.image.desc.sprites && this.subSprites) {
				const ss = this.subSprite;
				this.w = ss.w;
				this.h = ss.h;
				this.cx = ss.w / 2;
				this.cy = ss.h / 2;
				this.key.update();
			} else {
				if(hasClip && this.image.desc.clippedLeft !== undefined && this.image.desc.clippedTop !== undefined){
                    const keyTimes = sprites.time.getKeyTimes(this, ["x", "y"])
					this.key.toWorld(this.image.desc.clippedLeft - this.cx, this.image.desc.clippedTop - this.cy);
                    const attachersWPos = [];
                    if(this.attachers) {
                        i = 0;
                        for (const s of this.attachers.values()) {
                            sprites.time.getKeyTimes(s, ["x", "y"], keyTimes);
                            attachersWPos[i++] = s.key.toWorldP(0,0);
                        }
                    }
                    if (keyTimes.length > 0 && this.attachers) {
                        attachersWPos.length = 0;
                        sprites.time.eachTime(time => {
                            i = 0;
                            for (const s of this.attachers.values()) {
                                if (attachersWPos[i] === undefined) { attachersWPos[i] = [] }
                                attachersWPos[i++].push(s.key.toWorldP(0,0));
                            }
                        }, keyTimes);


                    }
                    if (this.drawOn) {
                        if (cuttingTools.isHoldingBuffer && cuttingTools.sprite === this) {
                            cuttingTools.moveSelection(-this.image.desc.clippedLeft, -this.image.desc.clippedTop);
                        }

                    }

                    var wx = this.key.wx;
                    var wy = this.key.wy;
                    this.w = this.image.w;
                    this.h = this.image.h;
                    this.cx = this.image.w / 2;
                    this.cy = this.image.h / 2;
                    this.key.update();
                    this.key.toWorld(-this.cx,-this.cy);
                    this.x -= this.key.wx - wx;
                    this.y -= this.key.wy - wy;
                    this.key.update();
                    if(this.attachers) {
                        i = 0;
                        if (keyTimes.length > 0) {
                            let first = true;
                            let j = 0;
                            sprites.time.eachTime(time => {
                                i = 0;
                                for (const s of this.attachers.values()) {
                                    if (s.type.animated) {
                                        const keyX = s.animation.tracks?.x.keyAtTime(time);
                                        const keyY = s.animation.tracks?.y.keyAtTime(time);
                                        if (keyX || keyY) {
                                            const point = s.attachment.locatePoint(attachersWPos[i][j]);
                                            keyX && (keyX.value = point.x, s.animation.tracks.x.dirty = true);
                                            keyY && (keyY.value = point.y, s.animation.tracks.y.dirty = true);
                                        }
                                    } else if (first) {
                                        s.x = attachersWPos[i][0].x;
                                        s.y = attachersWPos[i][0].y;
                                        s.attachment.locate();
                                        s.key.update();
                                    }
                                    i++;
                                }
                                j ++;
                                first = false;

                            }, keyTimes);
                            for (const s of this.attachers.values()) { s.key.update(); }


                        } else {
                            for (const s of this.attachers.values()) {
                                s.x = attachersWPos[i].x;
                                s.y = attachersWPos[i++].y;
                                s.attachment.locate();
                                s.key.update();
                            }
                        }
                    }

					return;
				}
				this.w = this.image.w;
				this.h = this.image.h;
				this.cx = this.image.w / 2;
				this.cy = this.image.h / 2;
				this.key.update();
			}
        },
        canBeNormalisable() {
            if((!this.type.cutter && !this.type.shape) || this.type.hasLocators) {//|| this.type.attached || this.attachers || this.type.hasLocators) {
                return false;
            }
            if(this.type.cutter || this.type.shape) { return true }
            return false;
        },
        normalize(type = this.type.normalisable){
            if(this.type.normalisable !== type) {
                if(type){
                    if(this.type.animated) {
                        const a = this.animation;
                        const w = this.w;
                        const h = this.h;
                        a.eachKeyOfTrack((key, name, anim) => key.value *= w, "sx");
                        a.eachKeyOfTrack((key, name, anim) => key.value *= h, "sy");
                    }
                    this.type.normalisable = true;
                }else{
                    this.sx = this.type.mirrorX ? -1 : 1;
                    this.sy = this.type.mirrorY ? -1 : 1;
                    this.w = this.w * this.sx;
                    this.h = this.h * this.sy;
                    this.cx = this.w / 2;
                    this.cy = this.h / 2;
                    this.type.normalisable = false;
                    this.key.update();
                }
            }
            if(this.type.normalisable) {
                if(this.attachers) {
                    for(const a of this.attachers.values()) {
                        if(a.attachment.scaleAttachX) { a.attachment.x *= this.sx }
                        if(a.attachment.scaleAttachY) { a.attachment.y *= this.sy }
                    }
                }
                this.type.mirrorX = this.sx < 0;
                this.type.mirrorY = this.sy < 0;
                this.w = this.w * Math.abs(this.sx);
                this.h = this.h * Math.abs(this.sy);
                this.cx = this.w / 2;
                this.cy = this.h / 2;
                this.sx = 1;
                this.sy = 1;
                this.key.update();
            }
            return this;
        },
        _updatePatternNull() { return this },
        _updatePattern() {
            if(this.type.pattern){
                this.pattern.img = view.context.createPattern(this.image,this.pattern.rep);
                this.pattern.img.setTransform(this.pattern.matrix);
            }
            return this;
        },
        updatePattern() { return this; },
        setPatternRepeat(type) {
            if(this.type.pattern && type !== this.pattern.rep) {
                this.pattern.rep = type;
                this.pattern.img = view.context.createPattern(this.image, this.pattern.rep);
                this.pattern.img.setTransform(this.pattern.matrix);
            }
        },
        setPattern(state, force = false, repeat){
            if(force || (state && !this.type.pattern)){
                this.type.pattern = true;
                if(this.pattern === undefined) {
                    this.pattern = { rep : repeat || "repeat", matrix : new DOMMatrix([1,0,0,1,0,0 ]) };
                }
                this.pattern.img = view.context.createPattern(this.image, this.pattern.rep);
                this.updatePattern = this._updatePattern;
                this.drawOn = false;
                if (!force) { this.key.update() }
            }else if(!state && this.type.pattern){
                this.type.pattern = false;
                this.pattern.img = undefined;
                this.updatePattern = this._updatePatternNull;
                this.key.update();
            }
            return this;
        },
        usePattern(pSpr){
            this.type.usingPattern = pSpr !== undefined;
            this.patternSpr = pSpr
            if(this.type.cutter) {
                this.type.renderable = this.type.usingPattern;
            }
        },
        _updateGradientNull() { return this },
        _updateGradient() {
            if(this.type.gradient){
                if (this.attachers) {
                    const a = [...this.attachers.values()];
                    const specialRenderSwatch = spriteRender.gridSpecialNames.gradientColor;
                    if (this.gradient.type === 0 && a.length >= 2 ) { // linear
                        const  ma = a[0], Ma = a[1];
                        const x1 = ma.attachment.x - this.cx;
                        const y1 = ma.attachment.y - this.cy;
                        const x2 = Ma.attachment.x - this.cx;
                        const y2 = Ma.attachment.y - this.cy;
                        const g = view.context.createLinearGradient(x1,y1,x2,y2);
                        g.addColorStop(0, a[0].rgb.getHexA(a[0].a));
                        g.addColorStop(1, a[1].rgb.getHexA(a[1].a));
                        Ma.gridSpecial = ma.gridSpecial =  specialRenderSwatch;
                        this.gradient.g = g;
                        if (a.length > 2) {
                            let idx = 2;
                            const v1x = x2 - x1;
                            const v1y = y2 - y1;
                            const dist = v1x * v1x + v1y * v1y;
                            while(idx < a.length) {
                                const st = a[idx++]
                                st.gridSpecial = specialRenderSwatch;
                                const u = ((st.attachment.x - this.cx - x1) * v1x + (st.attachment.y - this.cy - y1) * v1y) / dist;
                                if (u > 0 && u < 1) { g.addColorStop(u, st.rgb.getHexA(st.a)) }
                            }
                        }
                    } else  if (this.gradient.type === 1 && a.length >= 2 ) { // radial
                        if(a.length >= 2) {
                            const  ma = a[0], Ma = a[1];
                            Ma.gridSpecial = ma.gridSpecial =  specialRenderSwatch;
                            const x1 = ma.attachment.x - this.cx;
                            const y1 = ma.attachment.y - this.cy;
                            const x2 = Ma.attachment.x - this.cx;
                            const y2 = Ma.attachment.y - this.cy;
                            const r1 = Math.abs(Math.max(ma.w,ma.h) * 0.5);
                            const r2 = Math.abs(Math.max(Ma.w,Ma.h) * 0.5);
                            if (Math.abs(ma.x - Ma.x) < 1 && Math.abs(ma.y - Ma.y) < 1) {
                                const dist = ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
                                const g = view.context.createRadialGradient(x1,y1,r1,x1,y1, r2);
                                g.addColorStop(0, a[0].rgb.getHexA(a[0].a));
                                g.addColorStop(1, a[1].rgb.getHexA(a[1].a));
                                this.gradient.g = g;
                                let idx = 2;
                                while(idx < a.length) {
                                    const st = a[idx++]
                                    st.gridSpecial =  specialRenderSwatch;
                                    const dx = (st.attachment.x - this.cx - x1)
                                    const dy = (st.attachment.y - this.cy - y1)
                                    const u = ((dx * dx + dy * dy) ** 0.5 - r1) / (r2-r1);
                                    if (u > 0 && u < 1) { g.addColorStop(u, st.rgb.getHexA(st.a)) }
                                }
                            } else {
                                const g = view.context.createRadialGradient(x1,y1,r1,x2,y2, r2);
                                g.addColorStop(0, a[0].rgb.getHexA(a[0].a));
                                g.addColorStop(1, a[1].rgb.getHexA(a[1].a));
                                this.gradient.g = g;

                                let idx = 2;
                                let v1x = x2 - x1;
                                let v1y = y2 - y1;
                                let dist2 = (v1x * v1x + v1y * v1y) ** 0.5;
                                const nx = v1x / dist2;
                                const ny = v1y / dist2;
                                v1x = (x1 + nx * (r2+dist2+r1)) - (x1 + nx * r1);
                                v1y = (y1 + ny * (r2+dist2+r1)) - (y1 + ny * r1);
                                dist2 = v1x * v1x + v1y * v1y;
                                while(idx < a.length) {
                                    const st = a[idx++]
                                    st.gridSpecial =  specialRenderSwatch;
                                    let u = Math.abs(((st.attachment.x - this.cx - x1) * v1x + (st.attachment.y - this.cy - y1) * v1y) / dist2);
                                    if (u > 0 && u < 1) { g.addColorStop(u, st.rgb.getHexA(st.a)) }
                                }
                            }

                        }
                    } else {
                        this.gradient.g = a[0].rgb.getHexA(a[0].a);
                        a[0] =  specialRenderSwatch;
                    }

                } else {
                    this.gradient.g = this.rgb.css;
                }
            }

            this.gradient.update = false;
            return this;
        },
        updateGradient()  { return this },
        setGradient(state, force = false, repeat){
            if(force || (state && !this.type.gradient)){
                this.type.gradient = true;
                if(this.gradient === undefined) {
                    this.gradient = {  g: this.rgb.css, update: true, type: 0 };
                }
                if(this.type.normalisable) {
                    this.type.normalisable = false;
                    this.type.mirrorX = false;
                    this.type.mirrorY = false;
                }
                this.updateGradient = this._updateGradient;
                force && this.updateGradient();
                this.drawOn = false;
                if (!force) { this.key.update() }
            }else if(!state && this.type.gradient){
                this.type.gradient = false;
                this.gradient = undefined;
                this.type.normalisable = true;
                this.updateGradient = this._updateGradientNull;
                if (this.attachers) {
                    for (const a of this.attachers.values()) {
                        a.gridSpecial = 0;
                    }
                }
                this.key.update();
            }
            return this;
        },
        setSnaps(func) {
            this.snapFunc = func;
        },
        setGridLine(x,y,snap){
            const g = this.grid;
            if(this.type.grid){
                g.wangle = g.angle = this.rx;
                this.key.toLocalP(x,y,g.p3);
                if(snap){
                    g.p3.y = Math.round(g.p3.y / (this.cy / this.gridY)) * (this.cy / this.gridY);
                }
                g.wx = g.sx = this.x +  Math.cos(this.ry) * (g.p3.y - this.cy);
                g.wy = g.sy = this.y +  Math.sin(this.ry) * (g.p3.y - this.cy);
            }else{
                const dx = x - this.x;
                const dy = y - this.y;
                g.wangle = g.angle = Math.atan2(dy,dx);
                g.wDist = g.sDist = Math.sqrt(dx * dx + dy * dy);
                g.wx =  this.x;
                g.wy =  this.y;
                g.sx = x;
                g.sy = y;
            }
        },
        getGridPos(x,y){
            const g = this.grid;
            g.dist = distPointFromLine(
                g.sx, g.sy,
                g.sx + Math.cos(g.angle) * 100, g.sy + Math.sin(g.angle) * 100,
                x,y
            );
            g.x = D2PointRes.x;
            g.y = D2PointRes.y;
            if(this.type.grid){
                g.wangle = this.rx;
                this.key.toLocalP(x,y,workPointA);
                g.wx = this.x +  Math.cos(this.ry) * (workPointA.y - this.cy);
                g.wy = this.y +  Math.sin(this.ry) * (workPointA.y - this.cy);
            }else{
                const dx = x - this.x;
                const dy = y - this.y;
                g.wangle = Math.atan2(dy,dx);
                g.wDist = Math.sqrt(dx * dx + dy * dy);
                g.wx = this.x;
                g.wy = this.y;
            }
            return g.dist;
        },
        getGridLine(x1,y1){
            var angle;
            const g = this.grid;
            if(x1 === undefined){
                g.p1.x = g.sx;
                g.p1.y = g.sy;  // was g.sy
                g.p2.x = g.p1.x + Math.cos(g.angle) * 10000;
                g.p2.y = g.p1.y + Math.sin(g.angle) * 10000;
                angle = g.angle;
            }else{
                if(this.type.grid){
                    angle = this.rx;
                    this.key.toLocalP(x1, y1, g.p4);
                    g.p1.x = this.x +  Math.cos(this.ry) * (g.p4.y - this.cy);
                    g.p1.y = this.y +  Math.sin(this.ry) * (g.p4.y - this.cy);
                }else{
                    angle = Math.atan2(y1 - this.y, x1 - this.x);
                    g.p1.x = this.x;
                    g.p1.y = this.y;
                }
                g.p2.x = g.p1.x + Math.cos(angle) * 10000;
                g.p2.y = g.p1.y + Math.sin(angle) * 10000;
            }
            return angle;
        },
        setGridSnapLines(){
            const x = this.x;
            const y = this.y;
            const xx = -this.cx;
            const yy = -this.cy;
            const w = this.w;
            const h = this.h;
            const step =   h / this.gridY;
            if(this.type.vanish) {
                if(this.grid.radial){
                    for(var i = 0; i <= h + step / 2 ; i += step){
                        const ang = Math.atan2(i + yy, - xx);
                        this.key.toWorld(Math.cos(ang) * 10000, Math.sin(ang) * 10000);
                        snaps.addLine(x, y, this.key.wx, this.key.wy);
                    }
                } else {
                    for(var i = 0; i <= h + step / 2 ; i += step){
                        const ang = Math.atan2(i + yy, - xx);
                        this.key.toWorld(Math.cos(ang) * 10000, Math.sin(ang) * 10000);
                        snaps.addLine(x, y, this.key.wx, this.key.wy);
                    }
                }
            } else if(this.type.grid) {
                const step = h / this.gridY;
                for(var i = 0; i <= h + step / 2 ; i += step){
                    this.key.toWorld(0, i + yy);
                    const wx = this.key.wx;
                    const wy = this.key.wy;
                    this.key.toWorld(10000, i + yy);
                    snaps.addLine(wx,wy, this.key.wx, this.key.wy);
                }
            }
        },
        setFlag() {
            this.type.flagged = true;
            sprites.spriteTypeChange(this);
        },
        scaleTo(x,y,xx,yy){
            this.sx = (xx - x) / this.w;
            this.sy =  (yy - y) / this.h;
            this.key.update();
            return this;
        },
        grow(left, top, right, bottom) {
            if (this.type.normalisable) {
                const l1 = this.x - this.w * 0.5 - left;
                const r1 = this.x + this.w * 0.5 + right;
                const t1 = this.y - this.h * 0.5 - top;
                const b1 = this.y + this.h * 0.5 + bottom;
                const w1 = r1 - l1;
                const h1 = b1 - t1;
                if (w1 > 0 && h1 > 0) {
                    this.w = w1;
                    this.h = h1;
                    this.cx = w1 * 0.5;
                    this.cy = h1 * 0.5;
                    this.x = l1 + this.cx;
                    this.y = t1 + this.cy;
                    this.key.update();
                }
                
            } else {
                log.warn("Can not grow sprites that are not normalisable");
            }
            
        },
        rotate(amount, andTree = false){
            if(! andTree) {
                if(this.locks.locX) {
                    this.ry += amount;
                }else if(this.locks.locY) {
                    this.rx += amount;
                }else{
                    this.rx += amount;
                    this.ry += amount;
                }
            } else {
                var apply =true;
                if (this.type.lookat) {
                    this.lookat.offsetX += amount;
                    apply = false;
                }
                if (this.type.attached && this.attachment.inheritRotate) {
                    this.attachment.rx += amount;
                    this.attachment.ry += amount;
                    this.attachedTo.key.update();
                    apply = false;
                }
                if (apply) {
                    this.rx += amount;
                    this.ry += amount;
                }
            }
            this.key.update();
            return this;
        },
        positiveSize() {
            if(this.type.normalisable){
                if(this.w < 0) {
                    this.w = -this.w;
                    this.cx = this.w / 2;
                    this.sx = 1;
                    this.type.mirrorX = false;
                }
                if(this.h < 0) {
                    this.h = -this.h;
                    this.cy = this.h / 2;
                    this.sy = 1;
                    this.type.mirrorY = false;
                }
                this.key.update();
            }
            return this;
        },
        scaleSquare() {
            if (this.w === this.h) {
                this.sx = 1;
                this.sy = 1;
            }else if(this.w < this.h) {
                this.sx = 1;
                this.sy = this.w / this.h;
            }else{
                this.sy = 1;
                this.sx = this.h / this.w;
            }
            this.normalize();
            this.key.update();
        },
        scaleAt(x,y,sx,sy){
            const k = this.key;
            k.toWorld(x,y);
            const posX = k.wx;
            const posY = k.wy;
            this.setScale(this.sx * sx,this.sy * sy);
            k.toWorld(x,y);
            this.x -= k.wx - posX;
            this.y -= k.wy - posY;
            k.update();
        },
        setSize(w,h, warn = true) {
            if(warn) { log.warn("NEW setSize function called rather than depreciated setSize.")  }
            return this.setScale(w / this.w, h / this.h);
        },
        setPos(x,y){
            this.x = x;
            this.y = y;
            this.key.update();
            return this;
        },
        setScale(sx,sy){
            this.sx = sx;
            this.sy = sy;
            if (this.type.normalisable) { this.normalize(); }
            else { this.key.update(); }
            return this;
        },
		setRotateFix(r) {
            //if (this.type.shadow) { this.shadow.setRotateFix(r) }
			this.ry = r + (this.ry - this.rx);
			this.rx = r;
			this.key.update();
		},
        setRotate(rx, ry){
           // if (this.type.shadow) { this.shadow.setRotate(rx, ry) }
            this.rx = rx;
            this.ry = ry;
            this.key.update();
            return this;
        },
        setPosRot(x, y, dir) {
            this.x = x;
            this.y = y;       
            this.rx = dir;
            this.ry = dir + Math.PI90;
        },
        setGridSpecial(name) {
            if (this.type.cutter) {
                const id = spriteRender.gridSpecialNames[name];
                if (id !== undefined) {
                    this.gridSpecial = id;
                }
            }
        },
        resetRotate(andTree = false){
            var apply =true;
            if(andTree) {
                if (this.type.lookat) {
                    this.lookat.offsetX =  0;
                    apply = false;
                }
                if (this.type.attached && this.attachment.inheritRotate) {
                    this.attachment.ry -= this.attachment.rx;
                    this.attachment.rx = 0;
                    this.attachedTo.key.update();
                    apply = false;
                }
            }
            if (apply) {
                this.rx = 0;
                this.ry = Math.PI / 2;
            }
            this.key.update();
            return this;
        },
        resetScale(pixelAlign){
            if(pixelAlign){
                if(this.type.pallet){
                    this.w = Math.round(this.pallet.image.w * 4);
                    this.h = Math.round(this.pallet.image.h * 4);
                    this.cx = this.w / 2;
                    this.cy = this.h / 2;
                    this.sx = 1;
                    this.sy = 1;
                } else if(this.type.cutter){
                    this.w = Math.round(this.w);
                    this.h = Math.round(this.h);
                    this.cx = this.w / 2;
                    this.cy = this.h / 2;
                    this.sx = 1;
                    this.sy = 1;
                }else{
                    this.sx = Math.round(this.w * spr.sx) / this.w;
                    this.sy = Math.round(this.h * spr.sy) / this.h;
                }
            }else{
                if(this.type.pallet){
                    this.w = Math.round(this.pallet.image.w * 4);
                    this.h = Math.round(this.pallet.image.h * 4);
                    this.cx = this.w / 2;
                    this.cy = this.h / 2;
                    this.sx = 1;
                    this.sy = 1;
                } else  if(this.type.cutter){
                    this.w = CUTTER_SIZE;
                    this.h = CUTTER_SIZE;
                    this.cx = this.w / 2;
                    this.cy = this.h / 2;
                    this.sx = 1;
                    this.sy = 1;
                }else{
                    this.sx = 1;
                    this.sy = 1;
                }
            }
            this.key.update();
            return this;
        },
        isCoordInside(x,y){
            const p = workPointA;
            p.x = x;
            p.y = y;
            return this.key.isPointOver(p);
        },
        isSpriteInside(spr){
            const la = workLineA;
            const lb = workLineB;
            const k = this.key;
            const sk = spr.key;
            return k.isPointOver(sk.corner(0, la.p1)) &&
                k.isPointOver(sk.corner(1, la.p2)) &&
                k.isPointOver(sk.corner(2, lb.p1)) &&
                k.isPointOver(sk.corner(3, lb.p2));
        },
        isSpriteTouching(spr){
            const k = this.key;
            const sk = spr.key;
            const la = workLineA;
            const lb = workLineB;
            if (k.isPointOver(sk.corner(0, la.p1)) ||
                k.isPointOver(sk.corner(1, la.p2)) ||
                k.isPointOver(sk.corner(2, lb.p1)) ||
                k.isPointOver(sk.corner(3, lb.p2))) {
                    return true;
            }
            workingCache.release();
            const lineA = workingCache.line();
            const lineB = workingCache.line();
            if( sk.isPointOver(k.corner(0,lineA.p1)) ||
                sk.isPointOver(k.corner(1,lineA.p2)) ||
                sk.isPointOver(k.corner(2,lineB.p1)) ||
                sk.isPointOver(k.corner(3,lineB.p2))) {
                    return true;
            }
            if(doLineSegsIntercept(la,lineA) ||
                doLineSegsIntercept(la,lineB) ||
                doLineSegsIntercept(lb,lineA) ||
                doLineSegsIntercept(lb,lineB)) {
                    return true;
            }
            var tp = lineA.p1;
            lineA.p1 = lineA.p2;
            lineA.p2 = lineB.p1;
            lineB.p1 = lineB.p2;
            lineB.p2 = tp;
            if(doLineSegsIntercept(la,lineA) ||
                doLineSegsIntercept(la,lineB) ||
                doLineSegsIntercept(lb,lineA) ||
                doLineSegsIntercept(lb,lineB)) {
                    return true;
            }
            var tx = la.p1.x;
            var ty = la.p1.y;
            la.p1.x = la.p2.x;
            la.p1.y = la.p2.y;
            la.p2.x = lb.p1.x;
            la.p2.y = lb.p1.y;
            lb.p1.x = lb.p2.x;
            lb.p1.y = lb.p2.y;
            lb.p2.x = tx;
            lb.p2.y = ty;
            if(doLineSegsIntercept(la,lineA) ||
                doLineSegsIntercept(la,lineB) ||
                doLineSegsIntercept(lb,lineA) ||
                doLineSegsIntercept(lb,lineB)) {
                    return true;
            }
            var tp = lineA.p1;
            lineA.p1 = lineA.p2;
            lineA.p2 = lineB.p1;
            lineB.p1 = lineB.p2;
            lineB.p2 = tp;
            if(doLineSegsIntercept(la,lineA) ||
                doLineSegsIntercept(la,lineB) ||
                doLineSegsIntercept(lb,lineA) ||
                doLineSegsIntercept(lb,lineB)) {
                    return true;
            }
            return false;
        },
        uiFlashSprite(how = "fast", col = "white") {
            if (how === "attention") {
                spriteRender.renderStack.push(this.getSpriteLike(), "borderGrow", 30, [col, 3, 0.99, 0]);
            } else {
                spriteRender.renderStack.push(this.getSpriteLike(), "border", 5, [col, 2, 1, 0]);
            }
        },
        getSpriteLike(sprLike = {}) {
            sprLike.x = this.x;
            sprLike.y = this.y;
            sprLike.cx = this.cx;
            sprLike.cy = this.cy;
            sprLike.rx = this.rx;
            sprLike.ry = this.ry;
            sprLike.sx = this.sx;
            sprLike.sy = this.sy;
            sprLike.w = this.w;
            sprLike.h = this.h;
            if (!sprLike.key) { sprLike.key = {m:[...this.key.m], im:[this.key.im]} }
            else {
                const m = this.key.m;
                const im = this.key.im;
                const ms = sprLike.key.m;
                const ims = sprLike.key.im;
                (ms[0] = m[0], ms[1] = m[1], ms[2] = m[2], ms[3] = m[3], ms[4] = m[4], ms[5] = m[5]);
                (ims[0] = im[0], ims[1] = im[1], ims[2] = im[2], ims[3] = im[3], ims[4] = im[4], ims[5] = im[5]);
            }
            return sprLike;
        },
        getAnimatableState(state = {}) {
            state.x = this.x;
            state.y = this.y;
            state.sx = this.sx;
            state.sy = this.sy;
            state.rx = this.rx;
            state.ry = this.ry;
            state.cx = this.cx;
            state.cy = this.cy;
            state.w = this.w;
            state.h = this.h;
            state.a = this.a;
            if (this.type.attached) {
                const a = this.attachment;
                const as = state.attachment = state.attachment ?? {};
                as.x = a.x;
                as.y = a.y;
                as.sx = a.sx;
                as.sy = a.sy;
                as.rx = a.rx;
                as.ry = a.ry;
            }
            return state;
        },
        getState(state = {}) {
            state.x = this.x;
            state.y = this.y;
            state.sx = this.sx;
            state.sy = this.sy;
            state.rx = this.rx;
            state.ry = this.ry;
            state.cx = this.cx;
            state.cy = this.cy;
            state.w = this.w;
            state.h = this.h;
            state.a = this.a;
            return state;
        },
        setState(state){
            this.x =  state.x;
            this.y =  state.y;
            this.sx = state.sx;
            this.sy = state.sy;
            this.rx = state.rx;
            this.ry = state.ry;
            this.cx = state.cx;
            this.cy = state.cy;
            this.w =  state.w;
            this.h =  state.h;
            this.a =  state.a;
            this.key.update();
        },
        transform(mA, alpha, mB = this.key.m) {
            const m = workArray;
            m[0] = mA[0] * mB[0] + mA[2] * mB[1];
            m[1] = mA[1] * mB[0] + mA[3] * mB[1];
            m[2] = mA[0] * mB[2] + mA[2] * mB[3];
            m[3] = mA[1] * mB[2] + mA[3] * mB[3];
            const x = mA[0] * mB[4] + mA[2] * mB[5] + mA[4];
            const y = mA[1] * mB[4] + mA[3] * mB[5] + mA[5];
            const sx = Math.hypot(m[0], m[1]);
            const sy = Math.hypot(m[2], m[3]);
            const rx = Math.atan2(m[1], m[0]);
            const ry = Math.atan2(m[3], m[2]);
            this.key.updateLock(true);
            this.a *= alpha;
            this.setPos(x,y);
            this.setRotate(rx, ry);
            this.setScale(sx, sy);
            this.key.updateLock(false);
            this.key.quickUpdate();
        },
        matchShadow() { // apply to the shadow sprite position (invidisble spr) to the group sprite (spr being shadowed)
            throw new Error("Match shadow should be called via Sprite.key");
            const cim = this.cast.key.im
            const cm = this.cast.key.m
            const s = this.shadow
            const m = this.key.m;
            const sm = s.key.m;
            const sms = s.key.ms;
            const sim = s.key.im;
            const smsi = s.key.msi;
            const xx = this.x - cm[4];
            const yy = this.y - cm[5];
            sm[4] = s.key.x = s.x = xx * cim[0] + yy * cim[2];
            sm[5] = s.key.y = s.y = xx * cim[1] + yy * cim[3];
            sm[0] = cim[0] * m[0] + cim[2] * m[1];
            sm[1] = cim[1] * m[0] + cim[3] * m[1];
            sm[2] = cim[0] * m[2] + cim[2] * m[3];
            sm[3] = cim[1] * m[2] + cim[3] * m[3];
            s.sx = Math.hypot(sm[0], sm[1]);
            s.sy = Math.hypot(sm[2], sm[3]);
            s.rx = Math.atan2(sm[1], sm[0]);
            s.ry = Math.atan2(sm[3], sm[2]);
            smsi[3] = sms[0] = Math.cos(s.rx);
            smsi[1] = -(sms[1] = Math.sin(s.rx));
            smsi[2] = -(sms[2] = Math.cos(s.ry));
            smsi[0] = sms[3] = Math.sin(s.ry);
            const cross =  sm[0]  * sm[3]  - sm[1]  * sm[2];
            sim[0] =  sm[3] / cross;
            sim[1] = -sm[1] / cross;
            sim[2] = -sm[2] / cross;
            sim[3] =  sm[0] / cross;
            sim[4] = (sm[1] * sm[5] - sm[3] * sm[4]) / cross;
            sim[5] = (sm[2] * sm[4] - sm[0] * sm[5]) / cross;
            s.key.cx = s.cx;
            s.key.cy = s.cy;
            s.key.cross = Math.abs(1 / cross);
        },
        createWorldKey(key = this.key){
            var spr = this;
            var m,im,ms,msi;
            const fitLocators = () => {
                const scaleX = spr.locators.scaleX;
                const scaleY = spr.locators.scaleY;
                const updateUsing = spr.attachers ? update : quickUpdate;
                if (spr.locators.length === 1) {
                    const l1 = spr.locators[0];
                    var dx = spr.locators.startX - l1.startPos.x;
                    var dy = spr.locators.startY - l1.startPos.y;
                    var dx1 = spr.x - l1.spr.x;
                    var dy1 = spr.y - l1.spr.y;
                    const d = (dx * dx + dy * dy) ** 0.5;
                    const d1 = (dx1 * dx1 + dy1 * dy1) ** 0.5;
                    dx /= d;
                    dy /= d;
                    dx1 /= d1;
                    dy1 /= d1;
                    const ang = Math.asin(dx * dy1 - dy * dx1)
                    spr.rx += ang;
                    spr.ry += ang;
                    quickUpdate();
                    key.toWorld(l1.pos.x, l1.pos.y);
                    spr.x += l1.spr.x - key.wx
                    spr.y += l1.spr.y - key.wy
                    l1.startPos.x = l1.spr.x;
                    l1.startPos.y = l1.spr.y;
                    spr.locators.startX = spr.x;
                    spr.locators.startY = spr.y;
                    updateUsing();
                    l1.locate();
                }else  if (spr.locators.length === 2) {
                    const first = spr.locators[1].spr.selected ? 0 : 1;
                    const l1 = spr.locators[first];
                    const l2 = spr.locators[(first + 1) % 2];
                    var dx = l2.startPos.x - l1.startPos.x;
                    var dy = l2.startPos.y - l1.startPos.y;
                    var dx1 = l2.spr.x - l1.spr.x;
                    var dy1 = l2.spr.y - l1.spr.y;
                    const d = (dx * dx + dy * dy) ** 0.5;
                    const d1 = (dx1 * dx1 + dy1 * dy1) ** 0.5;
                    dx /= d;
                    dy /= d;
                    dx1 /= d1;
                    dy1 /= d1;
                    const ang = Math.asin(dx * dy1 - dy * dx1)
                    spr.rx += ang;
                    spr.ry += ang;
                    const scale = d1 / d;
                    spr.sx = scaleX ? l1.sx * scale : spr.sx;
                    spr.sy = scaleY ? l1.sy * scale : spr.sy;
                    quickUpdate();
                    key.toWorld(l1.pos.x, l1.pos.y);
                    spr.x += l1.spr.x - key.wx
                    spr.y += l1.spr.y - key.wy
                    l2.sx = l1.sx = spr.sx;
                    l2.sy  = l1.sy  = spr.sy
                    l1.startPos.x = l1.spr.x;
                    l1.startPos.y = l1.spr.y;
                    l2.startPos.x = l2.spr.x;
                    l2.startPos.y = l2.spr.y;
                    updateUsing();
                    l1.locate();
                    l2.locate();
                }else  if (spr.locators.length >= 3) {
                    const l1 = spr.locators[0];
                    const l2 = spr.locators[1];
                    const l3 = spr.locators[2];
                    var dx = l2.startPos.x - l1.startPos.x;
                    var dy = l2.startPos.y - l1.startPos.y;
                    var dxA = l3.startPos.x - l1.startPos.x;
                    var dyA = l3.startPos.y - l1.startPos.y;
                    var dx1 = l2.spr.x - l1.spr.x;
                    var dy1 = l2.spr.y - l1.spr.y;
                    var dxA1 = l3.spr.x - l1.spr.x;
                    var dyA1 = l3.spr.y - l1.spr.y;
                    const d = (dx * dx + dy * dy) ** 0.5;
                    const dA = (dxA * dxA + dyA * dyA) ** 0.5;
                    const d1 = (dx1 * dx1 + dy1 * dy1) ** 0.5;
                    const dA1 = (dxA1 * dxA1 + dyA1 * dyA1) ** 0.5;
                    dx /= d;
                    dy /= d;
                    dx1 /= d1;
                    dy1 /= d1;
                    dxA /= dA;
                    dyA /= dA;
                    dxA1 /= dA1;
                    dyA1 /= dA1;
                    const ang = Math.asin(dx * dy1 - dy * dx1)
                    const angA = Math.asin(dxA * dyA1 - dyA * dxA1)
                    spr.rx += ang;
                    spr.ry += angA;
                    const scale = d1 / d;
                    const scaleA = dA1 / dA;
                    spr.sx = scaleX ? l1.sx * scale : spr.sx;
                    spr.sy = scaleY ? l1.sy * scaleA : spr.sy;
                    quickUpdate();
                    key.toWorld(l1.pos.x, l1.pos.y);
                    spr.x += l1.spr.x - key.wx
                    spr.y += l1.spr.y - key.wy
                    l3.sx = l2.sx = l1.sx = spr.sx;
                    l3.sy = l2.sy  = l1.sy  = spr.sy
                    l1.startPos.x = l1.spr.x;
                    l1.startPos.y = l1.spr.y;
                    l2.startPos.x = l2.spr.x;
                    l2.startPos.y = l2.spr.y;
                    l3.startPos.x = l3.spr.x;
                    l3.startPos.y = l3.spr.y;
                    updateUsing();
                    l1.locate();
                    l2.locate();
                    l3.locate();
                }
            }
            const quickUpdate = (posOnly = false) => {
                if(posOnly) {
                    m[4] = key.x = spr.x;
                    m[5] = key.y = spr.y;
                    im[4] = (m[1] * m[5] - m[3] * m[4]) / key.cross;
                    im[5] = (m[2] * m[4] - m[0] * m[5]) / key.cross;
                }else{
                    m[0] = (ms[0] = Math.cos(spr.rx)) * spr.sx;
                    m[1] = (ms[1] = Math.sin(spr.rx)) * spr.sx;
                    m[2] = (ms[2] = Math.cos(spr.ry)) * spr.sy;
                    m[3] = (ms[3] = Math.sin(spr.ry)) * spr.sy;
                    m[4] = key.x = spr.x;
                    m[5] = key.y = spr.y;
                    const cross =  m[0]  * m[3]  - m[1]  * m[2];
                    im[0] = m[3] / cross;
                    im[1] = -m[1] / cross;
                    im[2] = -m[2] / cross;
                    im[3] = m[0] / cross;
                    im[4] = (m[1] * m[5] - m[3] * m[4]) / cross;
                    im[5] = (m[2] * m[4] - m[0] * m[5]) / cross;
                    msi[0] = ms[3];
                    msi[1] = -ms[1];
                    msi[2] = -ms[2];
                    msi[3] = ms[0];
                    key.cx = spr.cx;
                    key.cy = spr.cy;
                    key.cross = Math.abs(1 / cross);
                }
            }
            const matchShadow = shadow => { // apply to the shadow sprite
                const cim = shadow.cast.key.im
                const cm = shadow.cast.key.m
                const s = shadow.shadow
                const m = shadow.key.m;
                const sm = s.key.m;
                const sms = s.key.ms;
                const sim = s.key.im;
                const smsi = s.key.msi;
                const xx = shadow.x - cm[4];
                const yy = shadow.y - cm[5];
                sm[4] = s.key.x = s.x = xx * cim[0] + yy * cim[2];
                sm[5] = s.key.y = s.y = xx * cim[1] + yy * cim[3];
                sm[0] = cim[0] * m[0] + cim[2] * m[1];
                sm[1] = cim[1] * m[0] + cim[3] * m[1];
                sm[2] = cim[0] * m[2] + cim[2] * m[3];
                sm[3] = cim[1] * m[2] + cim[3] * m[3];
                s.sx = Math.hypot(sm[0], sm[1]);
                s.sy = Math.hypot(sm[2], sm[3]);
                s.rx = Math.atan2(sm[1], sm[0]);
                s.ry = Math.atan2(sm[3], sm[2]);
                smsi[3] = sms[0] = Math.cos(s.rx);
                smsi[1] = -(sms[1] = Math.sin(s.rx));
                smsi[2] = -(sms[2] = Math.cos(s.ry));
                smsi[0] = sms[3] = Math.sin(s.ry);
                const cross =  sm[0]  * sm[3]  - sm[1]  * sm[2];
                sim[0] =  sm[3] / cross;
                sim[1] = -sm[1] / cross;
                sim[2] = -sm[2] / cross;
                sim[3] =  sm[0] / cross;
                sim[4] = (sm[1] * sm[5] - sm[3] * sm[4]) / cross;
                sim[5] = (sm[2] * sm[4] - sm[0] * sm[5]) / cross;
                s.key.cx = s.cx;
                s.key.cy = s.cy;
                s.key.cross = Math.abs(1 / cross);
            }
            var updatePending = false;
            const deferedUpdate = () => {
                updatePending = true;
            }
            const update = (manualUpdate = true) => {
                key.updating = true;
                spr.fireEvent("onbeforeupdate");
                var dx,dy,rx,ry;
                if(spr.type.lookat) {
                    dx = spr.lookat.spr.x - spr.x;
                    dy = spr.lookat.spr.y - spr.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    spr.lookat.distance = dist ** 0.5;
                    let lr = 0;
                    spr.rx -= spr.lookat.offsetX;
                    spr.ry -= spr.lookat.offsetX;
                    if(dist > 0) {
                        dx /= dist;
                        dy /= dist;
                        let xx = Math.cos(spr.rx)
                        let yy = Math.sin(spr.rx)
                        const c = dx * yy - dy * xx;
                        lr = Math.asin(c < -1 ? -1 : c > 1 ? 1 : c);
                        if (dx * xx + dy * yy < 0) { lr = lr < 0 ? -Math.PI + lr : Math.PI - lr }
                    }
                    if (spr.type.marker) { spr.axiesLen[1] = dist }
                    const yaxis = spr.ry  - spr.rx;
                    spr.ry = (spr.rx = spr.rx - lr) + yaxis;
                    spr.rx += spr.lookat.offsetX;
                    spr.ry += spr.lookat.offsetX;
                }
                //????????????????????????????????????????????????????????????????????????????????
                // spr.attachment.computed may no longer be worth skipping the  locate call
                // However I cant remeber just why I put it there.
                // Computed is true only when spr is animated and there are position tracks (x, y)
                /*if (spr.type.attached && manualUpdate && !spr.attachment.computed) {
                    spr.attachment.locate();
                    if (spr.attachedTo.type.gradient) {spr.attachedTo.gradient.update = true }
                }       */
                // removed spr.attachment.computed from statement.
                // If after testing there are no issues with animated attachments remove computed from
                // attachment and all associated references.
                //???????????????????????????????????????????????????????????????????????????????????
                if (spr.type.attached && manualUpdate) {
                    spr.attachment.locate();
                    if (spr.attachedTo.type.gradient) {spr.attachedTo.gradient.update = true }
                }
                rx = spr.rx
                ry = spr.ry
                if(spr.type.ISO) { // spr.type.ISO is listed as depreciated (requires 3D UI which is beyond scope of Painter) and is being removed
                    const iso = spr.iso;
                    const mm = iso.m;
                    rx = spr.rx
                    ry = rx + Math.PI90
                    var x = Math.cos(rx);
                    var y = Math.sin(rx);
                    m[0] = (ms[0] = x * mm[0] + y * mm[2]) * spr.sx;
                    m[1] = (ms[1] = x * mm[1] + y * mm[3]) * spr.sx;
                    m[2] = (ms[2] = y * mm[0] - x * mm[2]) * spr.sx;
                    m[3] = (ms[3] = y * mm[1] - x * mm[3]) * spr.sx;
                    iso.irx = Math.atan2(ms[1], ms[0]);
                    iso.iry = Math.atan2(ms[3], ms[2]);
                    iso.isx = Math.sqrt(m[1] * m[1] + m[0] * ms[0]);
                    iso.isy = Math.sqrt(m[3] * m[3] + m[2] * ms[2]);
                } else {
                    if(this.type.normalisable){
                        const msx = this.type.mirrorX ? -spr.sx : spr.sx;
                        const msy = this.type.mirrorY ? -spr.sy : spr.sy;
                        m[0] = (ms[0] = Math.cos(rx)) * msx;
                        m[1] = (ms[1] = Math.sin(rx)) * msx;
                        m[2] = (ms[2] = Math.cos(ry)) * msy;
                        m[3] = (ms[3] = Math.sin(ry)) * msy;
                    }else{
                        m[0] = (ms[0] = Math.cos(rx)) * spr.sx;
                        m[1] = (ms[1] = Math.sin(rx)) * spr.sx;
                        m[2] = (ms[2] = Math.cos(ry)) * spr.sy;
                        m[3] = (ms[3] = Math.sin(ry)) * spr.sy;
                    }
                }
                if(spr.locks.locX || spr.locks.locY) {
                    if(spr.locks.locX ){
                        const u = ((spr.x - key.x) * m[0] + (spr.y - key.y) * m[1]) / (m[1] * m[1] + m[0] * m[0]);
                        spr.x = key.x = key.x + m[0] * u;
                        spr.y = key.y = key.y + m[1] * u;
                    }
                    if(spr.locks.locY ){
                        const u = ((spr.x - key.x) * m[2] + (spr.y - key.y) * m[3]) / (m[3] * m[3] + m[2] * m[2]);
                        spr.x = key.x = key.x + m[2] * u;
                        spr.y = key.y = key.y + m[3] * u;
                        if (spr.type.lookat) {
                            dx = key.x - spr.lookat.spr.x;
                            dy = key.y - spr.lookat.spr.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            dx = spr.x - spr.lookat.spr.x;
                            dy = spr.y - spr.lookat.spr.y;
                            const dist1 = Math.sqrt(dx * dx + dy * dy);
                            dx /= dist1;
                            dy /= dist1;
                            spr.x = key.x = spr.lookat.spr.x + dx * dist;
                            spr.y = key.y = spr.lookat.spr.y + dy * dist;
                        }
                    }
                }
                m[4] = key.x = spr.x;
                m[5] = key.y = spr.y;
                const cross =  m[0]  * m[3]  - m[1]  * m[2];
                im[0] =  m[3] / cross;
                im[1] = -m[1] / cross;
                im[2] = -m[2] / cross;
                im[3] =  m[0] / cross;
                im[4] = (m[1] * m[5] - m[3] * m[4]) / cross;
                im[5] = (m[2] * m[4] - m[0] * m[5]) / cross;
                msi[0] = ms[3];
                msi[1] = -ms[1];
                msi[2] = -ms[2];
                msi[3] = ms[0];
                key.cx = spr.cx;
                key.cy = spr.cy;
                key.cross = Math.abs(1 / cross);
                if (spr.lookers) {
                    for (const s of spr.lookers.values()) {
                        !s.key.updating && s.key.update(false);
                    }
                }
                if (spr.attachers) {
                    for (const s of spr.attachers.values()) {
                        if (!s.key.updating) {
                            s.attachment.position();
                            if (s.attachment.inheritRotate) {
                                s.rx = s.attachment.rx + rx;
                                s.ry = s.attachment.ry + ry - s.attachment.rotOffset;
                            }
                            if (s.attachment.inheritScaleX) { s.sx = s.attachment.sx * spr.sx }
                            if (s.attachment.inheritScaleY) { s.sy = s.attachment.sy * spr.sy }
                            if (spr.type.gradient) { spr.gradient.update = true }
                            s.key.update(false);
                        }
                    }
                }
                if (spr.type.group) {
                    spr.group.each(spr => {
                        if (spr.key.updatedFrame !== frameCount) { spr.key.update() }
                    });
                }
                if (spr.type.pattern) {
                    const pm = spr.pattern.matrix;
                    pm.a = m[0];
                    pm.b = m[1];
                    pm.c = m[2];
                    pm.d = m[3];
                    pm.e = m[4];
                    pm.f = m[5];
                    spr.pattern.img.setTransform(pm);
                }
                if (!spr.changed) {
                    if (spr.type.compoundShape && spr.ofShapes) {
                        for (const shape of spr.ofShapes.values()) { shape.update = frameCount }
                    }
                    spr.changed = true;
                }
                key.updatedFrame = frameCount;
                key.updating = false;
                spr.fireEvent("onupdate");
            }
			const subSprites = {
			    isPointOver(p) {
					const sSpr = spr.subSprite;
					const xx = p.x - m[4];
					const yy = p.y - m[5];
					const x = xx * im[0] + yy * im[2] + spr.cx;
					const y = xx * im[1] + yy * im[3] + spr.cy;
					this.lx = xx * im[0] + yy * im[2] + spr.cx + sSpr.x;
					this.ly = xx * im[1] + yy * im[3] + spr.cy + sSpr.y;
					return this.lx >= sSpr.x && this.lx < sSpr.x + sSpr.w &&  this.ly >= sSpr.y && this.ly < sSpr.y + sSpr.h;
				},
				toLocal(x, y) {
					const sSpr = spr.subSprite;
					const xx = x - m[4];
					const yy = y - m[5];
					this.lx = xx * im[0] + yy * im[2] + spr.cx + sSpr.x;
					this.ly = xx * im[1] + yy * im[3] + spr.cy + sSpr.y;
					this.over =  this.lx >= sSpr.x && this.lx < sSpr.x + sSpr.w &&  this.ly >= sSpr.y && this.ly < sSpr.y + sSpr.h;
					return this;
				},
				toLocalP(x, y, point = {}) {
					const xx = x - m[4];
					const yy = y - m[5];
					point.x = xx * im[0] + yy * im[2] + spr.cx + spr.subSprite.x;
					point.y = xx * im[1] + yy * im[3] + spr.cy + spr.subSprite.y;
					return point;
				},
			}
			if(!key){
                key = {
                    updatedFrame: -1,
                    updating : false,
                    x: 0, y: 0,
                    lx: 0, ly: 0, over: false,
                    olx: -1, oly: -1, lastPresentframe: 0,  // used for image dependency optimisations
                    wx: 0, wy: 0,
                    wrx: 0, wry: 0,
					dist: 0, // used by pens.js
                    edge: 0, // bit field edges (used by variouse UI functions) 1 left, 2 center, 3 right, 4 top, 5 middle, 6 bottom
                    //iso: "0", // used by ISO batch. Needs to find a better way.
                    cx : spr.cx,
                    cy : spr.cy,
                    cross : 1,
					toSubSprite() {
						if (!this.isSubSprite) {
							this.isSubSprite = true;
							Object.assign(key, subSprites);
						}
					},
                    updateLock(state) {
                        if (state) {
                            if (!this._update) {
                                this._update = this.update;
                                this.update = ()=>{};
                            }
                        } else {
                            if (this._update) {
                                this.update = this._update;
                                this._update = undefined;
                            }
                        }
                    },
                    m : [0,0,0,0,0,0],
                    im : [0,0,0,0,0,0],
                    ms : [0,0,0,0],
                    msi : [0,0,0,0],
                    funcLinkLock: 0,
                    flx:0,
                    fly:0,
                    flox:0,
                    floy:0,
                    holdingState : false,
                    state: {
                        x : spr.x,
                        y : spr.y,
                        sx : spr.sx,
                        sy : spr.sy,
                        rx : spr.rx,
                        ry : spr.ry,
                        cx : spr.cx,
                        cy : spr.cy,
                        w : spr.w,
                        h : spr.h,
                        image : null,
                        a : spr.a,
                        cross: 0,
                        m : [],
                        im : [],
                        ms : [],
                        msi : [],
                    },
                    previouseState : {
                        x : spr.x,
                        y : spr.y,
                        sx : spr.sx,
                        sy : spr.sy,
                        rx : spr.rx,
                        ry : spr.ry,
                        w : spr.w,
                        h : spr.h,
                        imageId : null,
                        a : spr.a,
                    },
                    extent : new Extent(),
                    copyStateTo(sprite) {
                        var i = 0;
                        sprite.x = spr.x;
                        sprite.y = spr.y;
                        sprite.sx = spr.sx;
                        sprite.sy = spr.sy;
                        sprite.rx = spr.rx;
                        sprite.ry = spr.ry;
                        sprite.cx = spr.cx;
                        sprite.cy = spr.cy;
                        sprite.w = spr.w;
                        sprite.h = spr.h;
                        const sprKey = sprite.key;
                        sprKey.cross = key.cross;
                        while (i < 4) {
                            sprKey.m[i] = key.m[i];
                            sprKey.im[i] = key.im[i];
                            sprKey.ms[i] = key.ms[i];
                            sprKey.msi[i] = key.msi[i++];
                        }
                        sprKey.m[i] = key.m[i];
                        sprKey.im[i] = key.im[i++];
                        sprKey.m[i] = key.m[i];
                        sprKey.im[i] = key.im[i++];
                    },
                    saveState() {
                        var i = 0;
                        if (!key.holdingState) {
                            key.holdingState = true;
                            const s = key.state;
                            s.x = spr.x;
                            s.y = spr.y;
                            s.sx = spr.sx;
                            s.sy = spr.sy;
                            s.rx = spr.rx;
                            s.ry = spr.ry;
                            s.cx = spr.cx;
                            s.cy = spr.cy;
                            s.w = spr.w;
                            s.h = spr.h;
                            s.image = spr.image;
                            s.a = spr.a;
                            s.cross = key.cross;
                            while (i < 4) {
                                s.m[i] = key.m[i];
                                s.im[i] = key.im[i];
                                s.ms[i] = key.ms[i];
                                s.msi[i] = key.msi[i++];
                            }
                            s.m[i] = key.m[i];
                            s.im[i] = key.im[i++];
                            s.m[i] = key.m[i];
                            s.im[i] = key.im[i++];
                        }
                    },
                    restoreState() {
                        var i = 0;
                        if (key.holdingState) {
                            key.holdingState = false;
                            const s = key.state;
                            spr.x = s.x;
                            spr.y = s.y;
                            spr.sx = s.sx;
                            spr.sy = s.sy;
                            spr.rx = s.rx;
                            spr.ry = s.ry;
                            spr.cx = s.cx;
                            spr.cy = s.cy;
                            spr.w = s.w;
                            spr.h = s.h;
                            spr.image = s.image;
                            s.image = undefined;
                            spr.a = s.a;
                            key.cross = s.cross;
                            while (i < 4) {
                                key.m[i] = s.m[i];
                                key.im[i] = s.im[i];
                                key.ms[i] = s.ms[i];
                                key.msi[i] = s.msi[i++];
                            }
                            key.m[i] = s.m[i];
                            key.im[i] = s.im[i++];
                            key.m[i] = s.m[i];
                            key.im[i] = s.im[i++];
                        }
                    },
                    quickUpdate,
                    update,
                    deferUpdates(defer) { 
                        if (defer) {
                            key.update = deferedUpdate; 
                        } else {
                            key.update = update;
                            if (updatePending)  {
                                key.update();
                                updatePending = false;
                            }
                        }
                    },
                    matchShadow,
                    fitLocators,
                    hasAnimatablePropertyChanged(frame, mark = false) {
                        const ps = key.previouseState;
                        if (mark) {
                            ps.frame = frame;
                            ps.x = spr.x;
                            ps.y = spr.y;
                            ps.sx = spr.sx;
                            ps.sy = spr.sy;
                            ps.w = spr.w;
                            ps.h = spr.h;
                            ps.rx = spr.rx;
                            ps.ry = spr.ry;
                            ps.a = spr.a;
                            ps.color = spr.rgb.css;
                            if(spr.type.image) {
								if (spr.type.subSprite) { ps.subSpriteIdx = spr.subSpriteIdx }
                                else { ps.imageId = spr.image.guid }
                            }
                        }
                        if (frame !== ps.frame) { return }
                        var posChanged = false;
                        var scaleChanged = false;
                        if (spr.x !== ps.x || spr.y !== ps.y) {
                            posChanged = true;
                            ps.x = spr.x;
                            ps.y = spr.y;
                        }
                        if (spr.sx !== ps.sx || spr.sy !== ps.sy || (spr.type.normalisable && (spr.w !== ps.w || spr.h !== ps.h))) {
                            scaleChanged = true;
                            ps.sx = spr.sx;
                            ps.sy = spr.sy;
                            ps.w = spr.w;
                            ps.h = spr.h;
                        }
						if (spr.type.image) {
							if (spr.type.subSprite) {
								if (spr.subSpriteIdx !== ps.subSpriteIdx) {
									ps.subSpriteIdx = spr.subSpriteIdx;
									timeline.keyUpdate(spr, commands.animSetKey_image);
								}
							} else  if (spr.image.guid !== ps.imageId) {
                                ps.imageId = spr.image.guid;
                                timeline.keyUpdate(spr, commands.animSetKey_image);
                            }
                        }
                        if (scaleChanged && posChanged) {
                            timeline.keyUpdate(spr, commands.animSetKeyPosScale);
                        }else if (scaleChanged) {
                            timeline.keyUpdate(spr, commands.animSetKeyPosScale);
                        }else if (posChanged) {
                            timeline.keyUpdate(spr, commands.animSetKeyPos);
                        }
                        if (spr.rx !== ps.rx || spr.ry !== ps.ry) {
                            ps.rx = spr.rx;
                            ps.ry = spr.ry;
                            timeline.keyUpdate(spr, commands.animSetKeyRotate);
                        }
                        if (spr.a !== ps.a) {
                            ps.a = spr.a;
                            timeline.keyUpdate(spr, commands.animSetKey_a);
                        }
                        if (spr.rgb.css !== ps.color) {
                            ps.color = spr.rgb.css;
                            timeline.keyUpdate(spr, commands.animSetKey_rgb);
                        }

                    },
                    setTransform(ctx) { ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]) },
                    setInvTransform(ctx) { ctx.setTransform(im[0], im[1], im[2], im[3], im[4], im[5]) },
                    transform(ctx) { ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]) },
                    invTransform(ctx) { ctx.transform(im[0], im[1], im[2], im[3], im[4], im[5]) },
                    keyPos(x,y) {
                        key.x = x;
                        key.y = y;
                    },
                    toLocal(x, y) {
                        const xx = x - m[4];
                        const yy = y - m[5];
                        this.lx = xx * im[0] + yy * im[2] + spr.cx;
                        this.ly = xx * im[1] + yy * im[3] + spr.cy;
                        this.over =  this.isOver(this.lx, this.ly);
                        return this;
                    },
                    isOver(x, y) {
                        var over = ((spr.w < 0 && x <= 0 && x > spr.w) || (spr.w >= 0 && x >= 0 && x < spr.w)) && ((spr.h < 0 && y <= 0 && y > spr.h) || (spr.h >= 0 && y >= 0 && y < spr.h));
                        if (over && spr.type.cutter && spr.gridSpecial) {
                            const gso = gridSpecialOver[spr.gridSpecial];
                            gso && (over = gso(x, y, spr.w, spr.h));
                        }
                        return over;
                    },
                    toLocalGroup(x, y) {
                        x -= spr.cx;
                        y -= spr.cy;
                        spr.group.each(s => {
                            s.key.toLocal(x, y);
                            if (s.type.group && s.group.isOpen) { s.key.toLocalGroup(s.key.lx, s.key.ly) }
                        });
                    },
                    isPointOver(p) {
                        const xx = p.x - m[4];
                        const yy = p.y - m[5];
                        const x = xx * im[0] + yy * im[2] + spr.cx;
                        const y = xx * im[1] + yy * im[3] + spr.cy;
                        return this.isOver(x,y);

                    },
                    toLocalP(x, y, point = {}) {
                        const xx = x - m[4];
                        const yy = y - m[5];
                        point.x = xx * im[0] + yy * im[2] + spr.cx;
                        point.y = xx * im[1] + yy * im[3] + spr.cy;
                        return point;
                    },
                    scaleSelToLocalP(x, y, sx, sy, point = {}) {
                        const xx = x - m[4];
                        const yy = y - m[5];
                        if (sx && sy) {
                            point.x = xx * im[0] + yy * im[2] + spr.cx;
                            point.y = xx * im[1] + yy * im[3] + spr.cy;
                        } else if (sx) {
                            point.x = xx * im[0] + yy * msi[2] + spr.cx;
                            point.y = xx * im[1] + yy * msi[3] + spr.cy;
                        } else if (sx) {
                            point.x = xx * msi[0] + yy * im[2] + spr.cx;
                            point.y = xx * msi[1] + yy * im[3] + spr.cy;
                        } else {
                            point.x = xx * msi[0] + yy * msi[2] + spr.cx;
                            point.y = xx * msi[1] + yy * msi[3] + spr.cy;
                        }
                        return point;
                    },
                    toLocalPoint(p) {
                        const xx = p.x - m[4];
                        const yy = p.y - m[5];
                        p.x = xx * im[0] + yy * im[2] + spr.cx;
                        p.y = xx * im[1] + yy * im[3] + spr.cy;
                        return p;
                    },
                    toLocalLine(l) {
                        const x1 = l.p1.x - m[4];
                        const y1 = l.p1.y - m[5];
                        const x2 = l.p2.x - m[4];
                        const y2 = l.p2.y - m[5];
                        l.p1.x = x1 * im[0] + y1 * im[2] + spr.cx;
                        l.p1.y = x1 * im[1] + y1 * im[3] + spr.cy;
                        l.p2.x = x2 * im[0] + y2 * im[2] + spr.cx;
                        l.p2.y = x2 * im[1] + y2 * im[3] + spr.cy;
                        return l;
                    },
                    arrayCircleToLocal(a){
                        a[7] = a[0];
                        a[8] = a[1];
                        if(Math.abs(a[4]) > 1){
                            a[9] = a[2];
                            a[10] = a[3];
                        }
                    },
                    arrayPointToLocal(a){ // see curveToLocal for array assignments
                        const xx = a[0] - m[4];
                        const yy = a[1] - m[5];
                        a[6] = (xx * im[0] + yy * im[2]) + spr.cx;
                        a[7] = (xx * im[1] + yy * im[3]) + spr.cy;
                        a[8] = (a[2] * im[0] + a[3] * im[2]);
                        a[9] = (a[2] * im[1] + a[3] * im[3]);
                    },
                    curveToLocal(p,res = []){
                        const xx = p[0] - m[4];
                        const yy = p[1] - m[5];
                        res[0] = (xx * im[0] + yy * im[2]) + spr.cx;  // x pos
                        res[1] = (xx * im[1] + yy * im[3]) + spr.cy;  // y pos
                        res[2] = (p[4] * im[0] + p[5] * im[2]); // transform segment normal x
                        res[3] = (p[4] * im[1] + p[5] * im[3]); // transform segment normal y
                        return res;
                    },
                    strokeToLocalBez(p,res = []){
                        var xx = p[0] - m[4];
                        var yy = p[1] - m[5];
                        res[0] = (xx * im[0] + yy * im[2]) + spr.cx;
                        res[1] = (xx * im[1] + yy * im[3]) + spr.cy;
                        if (!isNaN(p[6])) {
                            xx = p[6] - m[4];
                            yy = p[7] - m[5];
                            res[4] = (xx * im[0] + yy * im[2]) + spr.cx;
                            res[5] = (xx * im[1] + yy * im[3]) + spr.cy;
                            xx = p[8] - m[4];
                            yy = p[9] - m[5];
                            res[6] = (xx * im[0] + yy * im[2]) + spr.cx;
                            res[7] = (xx * im[1] + yy * im[3]) + spr.cy;
                        } else {
                            res[4] = NaN;
                        }
                        res[2] = (p[4] * im[0] + p[5] * im[2]);
                        res[3] = (p[4] * im[1] + p[5] * im[3]);
                        return res;
                    },
                    rotate(r) {
                        spr.ry = r + (spr.ry - spr.rx);
                        spr.rx = r;
                    },
                    scale(sx = spr.sx, sy = spr.sy) {
                        spr.sx = sx;
                        spr.sy = sy;
                    },
                    pos(x = spr.x, y = spr.y) {
                        spr.x = x;
                        spr.y = y;
                    },
                    toWorld(x, y) {
                        this.wx = (this.wrx = x * m[0] + y * m[2]) + m[4];
                        this.wy = (this.wry = x * m[1] + y * m[3]) + m[5];
                    },
                    toWorldP(x, y, p = {}) {
                        p.x = x * m[0] + y * m[2] + m[4];
                        p.y = x * m[1] + y * m[3] + m[5];
                        return p;
                    },
                    toWorldPoint(x, y, p = {}) {
                        x -= spr.cx;
                        y -= spr.cy;
                        p.x = x * m[0] + y * m[2] + m[4];
                        p.y = x * m[1] + y * m[3] + m[5];
                        return p;
                    },
                    scaleSelToWorldPoint(x, y, sx, sy, p = {}) {
                        x -= spr.cx;
                        y -= spr.cy;
                        if (sx && sy) {
                            p.x = x * m[0] + y * m[2] + m[4];
                            p.y = x * m[1] + y * m[3] + m[5];
                        } else if (sx) {
                            p.x = x * m[0] + y * ms[2] + m[4];
                            p.y = x * m[1] + y * ms[3] + m[5];
                        } else if (sy) {
                            p.x = x * ms[0] + y * m[2] + m[4];
                            p.y = x * ms[1] + y * m[3] + m[5];
                        } else {
                            p.x = x * ms[0] + y * ms[2] + m[4];
                            p.y = x * ms[1] + y * ms[3] + m[5];
                        }
                        return p;
                    },
                    toWorldScaleRotPoint(x, y, p = {}) {
                        p.x = x * m[0] + y * m[2];
                        p.y = x * m[1] + y * m[3];
                        return p;
                    },
                    toLocalScaleRotPoint(x,y, p = {}) {
                        p.x = x * im[0] + y * im[2];
                        p.y = x * im[1] + y * im[3];
                        return p;
                    },
                    isUnder(x,y,w,h){
                        this.toWorld(-spr.cx,-spr.cy);
                        if (this.wx >= x && this.wy >= y && this.wx < x + w && this.wy < y + h) { return true }
                        this.toWorld(-spr.cx + spr.w, -spr.cy);
                        if (this.wx >= x && this.wy >= y && this.wx < x + w && this.wy < y + h) { return true }
                        this.toWorld(-spr.cx + spr.w, -spr.cy + spr.h);
                        if (this.wx >= x && this.wy >= y && this.wx < x + w && this.wy < y + h) { return true }
                        this.toWorld(-spr.cx, -spr.cy + spr.h);
                        if (this.wx >= x && this.wy >= y && this.wx < x + w && this.wy < y + h) { return true }
                        return false;
                    },
                    extentToWorld(extent) {
                        const E = extent;
                        var x1 =  E.x * m[0] + E.y * m[2] + m[4];
                        var y1 =  E.x * m[1] + E.y * m[3] + m[5];
                    },
                    calcExtentGroup(extent) {
                        spr.group.each(s => {
                            s.key.calcExtent();
                            s.key.extent.transform(m).complete().combine(extent);
                        });
                    },
                    calcExtent(extent){
                        this.extent.irate();
                        this.toWorld(-spr.cx, -spr.cy);
                        this.extent.point(this.wx, this.wy);
                        this.toWorld(-spr.cx + spr.w, -spr.cy);
                        this.extent.point(this.wx, this.wy);
                        this.toWorld(-spr.cx + spr.w, -spr.cy + spr.h);
                        this.extent.point(this.wx, this.wy);
                        this.toWorld(-spr.cx, -spr.cy + spr.h);
                        this.extent.point(this.wx, this.wy);
                        this.extent.complete();
                        if (spr.type.group) {
                            spr.key.calcExtentGroup(this.extent);
                        }
                        if (extent) { return extent.combine(this.extent) }
                    },
                    corner(index, point = {}){ // index top left 0 clockwise 0,1,2,3
                        const x = corners[index][0] * spr.w;
                        const y = corners[index][1] * spr.h;
                        point.x = x * m[0] + y * m[2] + m[4];
                        point.y = x * m[1] + y * m[3] + m[5];
                        return point;
                    },
                    corners(p1, p2, p3, p4){ // index top left 0 clockwise 0,1,2,3
						this.corner(0, p1);
						this.corner(1, p2);
						this.corner(2, p3);
						this.corner(3, p4);
                    }					
                }
            }
            m = key.m;
            im = key.im;
            ms = key.ms;
            msi = key.msi;
            update();
            this.key = key;
            return key;
        }
    }
    getSettings();
    settingsHandler.onchange=getSettings;
    Sprite.RGB = RGB;
    return Sprite;
})();