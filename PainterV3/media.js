"use strict";
const media = (()=>{
    const uOC = settings.useOffscreenCanvas;
    var maxDependencyRate = settings.maxImageDependencyRate;
    var palletFormat = "Compressed";
    var imageExtraUndos = false;
    function getSettings(){
        if(uOC !== settings.useOffscreenCanvas) {
            log.warn("UseOffscreenCanvas requieres restart of PainterV3");
        }
        maxDependencyRate = settings.maxImageDependencyRate;
        palletFormat = settings.palletFormat;
        imageExtraUndos = settings.imageExtraUndos;
    }
    getSettings();
    settingsHandler.onchange = getSettings;
    function createCanvas(w, h) {
        return uOC ? new OffscreenCanvas(w, h) : $("canvas",{width: w, height: h});
    }
    const palletLayouts = {
        long : 1,
        square : 2,
        double : 3,
        named : [,"long","square","double"],
        double8: {w: 1, h: 1, m: 128},
        double7: {w: 2, h: 1, m: 64},
        double6: {w: 4, h: 1, m: 32},
        double5: {w: 8, h: 1, m: 16},
        double4: {w: 16, h: 1, m: 8},
        double3: {w: 32, h: 1, m: 4},
        double2: {w: 64, h: 1, m: 2},
        double1: {w: 64, h: 2, m: 1},
        double0: {w: 64, h: 2, m: 1},
        long8: {w: 1, h: 1, m: 256},
        long7: {w: 2, h: 1, m: 256},
        long6: {w: 4, h: 1, m: 256},
        long5: {w: 8, h: 1, m: 256},
        long4: {w: 16, h: 1, m: 256},
        long3: {w: 32, h: 1, m: 256},
        long2: {w: 64, h: 1, m: 256},
        long1: {w: 128, h: 1, m: 256},
        long0: {w: 128, h: 1, m: 256},
        square8: {w: 1, h: 1, m: 16},
        square7: {w: 1, h: 2, m: 16},
        square6: {w: 2, h: 2, m: 8},
        square5: {w: 2, h: 4, m: 8},
        square4: {w: 4, h: 4, m: 4},
        square3: {w: 4, h: 8, m: 4},
        square2: {w: 8, h: 8, m: 2},
        square1: {w: 8, h:16, m: 2},
        square0: {w: 8, h:16, m: 2},
        setLayoutCanvas(can,type) {
            if(type === palletLayouts.square){
                can.w = can.width = 16;
                can.h = can.height = 16;
            } else if(type === palletLayouts.long){
                can.w = can.width = 256;
                can.h = can.height = 1;
            } else if(type === palletLayouts.double){
                can.w = can.width = 128;
                can.h = can.height = 2;
            }
        },
        getLayout(count, type) {
            if(count === 0) { return {w:1,h:1,m:1} }
            if(type === palletLayouts.square){
                return palletLayouts["square" + Math.ceil(Math.log2(count))];
            }
            if(type === palletLayouts.long){
                return palletLayouts["long" + Math.ceil(Math.log2(count))];
            }
            if(type === palletLayouts.double){
                return palletLayouts["double" + Math.ceil(Math.log2(count))]
            }
        }
    }
    const palletSorts = {
        hue : 1,
        val : 2,
        valReverse : 3,
        hueReverse : 4,
        perceptualVal: 5,
        perceptualValReverse: 6,
        noSort: 7,
        fixed: 8,
        named : [,"hue","val", "valReverse", "hueReverse", "perceptualVal", "perceptualValReverse", "noSort", "fixed"],
    };
    const palletConst = {
        perceptualWeights: {  // linear
            r: 0.2126,
            g: 0.7152,
            b: 0.0722,
        },
    };
    const lockTypes = {
        pixelSet : 1,  // The pixels can not be changed during the lock
        dataOnly : 2,  // Only data exrtracted pixels can be changed.
    }
    const clipUsedFlags = { // as bit fields
        subSpr: 0b1,
        extent: 0b10,
        restore2: 0b11,
    };
    const onLoadActions = new Map();
    const items = [];
    isImageTainted.testCan = createCanvas(1,1);
    function isImageTainted(img) {
        const ctx = isImageTainted.testCan.getContext("2d");
        ctx.drawImage(img,0,0);
        try {
            ctx.getImageData(0,0,1,1);
            return false;
        } catch(e) {
            isImageTainted.testCan = createCanvas(1,1);
        }
        return true;
    }
    function createImageMirror(can){
        var mirror =  createCanvas(can.width, can.height);
        can.desc.mirror = mirror;
        can.changed = frameCount;
        can.dependacyFrame = 0;
		can.ctx.imageSmoothingQuality = 'high';
        can._ID = 1;
        mirror._ID = 2;
        
        mirror.ctx = mirror.getContext("2d");
        mirror.ctx.imageSmoothingEnabled = false;
        mirror.ctx.buffer_Id = 0;;
		mirror.ctx.imageSmoothingQuality = 'high';
        mirror.ctx.drawImage(can, 0, 0);
        can.update = function(flagsOnly, putInUndoBuff = true){
            if (can.isLocked) {
                log.error("Locked drawable can not be updated");
                return;
            }
            if (!flagsOnly){
                if (can.processed && can.pushUndo && putInUndoBuff) { can.pushUndo() }
                mirror.ctx.imageSmoothingEnabled = false;
                mirror.ctx.clearRect(0, 0, can.w, can.h);
                mirror.ctx.drawImage(can, 0, 0);
                mirror.ctx.buffer_Id = 0;
                if(can.onupdated) { can.onupdated("onupdated", can) }
                can.changed = frameCount;
                can.presentationFrame = 0;
            } 
            can.restored = false;
            if(can.dependent && can.processed) { can.callDependents() }
            can.desc.dirty = can.processed ? true : can.desc.dirty;
            can.processed = false;
            can.saved = !can.desc.dirty ? can.saved === true : false;
        }
        can.callDependents = function() {  // caller must ensure dependents exist if
            if (!can.isLocked && can.dependacyFrame !== frameCount) {
                log("Dependent called " + frameCount);
                for(const [img, depend] of can.dependent.entries()) {
                    !img.isLocked && depend()
                }
                can.dependacyFrame = frameCount;
            }
        }
        can.removeDependent = function(img, cb) {
            if (can.dependent) {
                for (const [im, cB] of can.dependent.entries()) {
                    if(im === img && (cb === cB || cb === undefined)) {
                        can.dependent.delete(img);
                        img.dependentOn.delete(can);
                    }
                }
                img.dependentOn.size === 0 && (img.dependentOn = undefined)
                can.dependent.size === 0 && (can.dependent = undefined);
            }
        }
        can.addDependent = function(img, cb) {
            !can.dependent && (can.dependent = new Map());
            !img.dependentOn && (img.dependentOn = new Set());
            can.dependent.set(img, cb);
            img.dependentOn.add(can);
        }
        can.presented = function() {
            if (can.dependent) {
                (frameCount - can.dependacyFrame) >= maxDependencyRate &&  can.callDependents();
            }
        }
        can.restore = function(markRestored = true){
            can.ctx.setTransform(1, 0, 0, 1, 0, 0);
            can.ctx.imageSmoothingEnabled = false;
            can.ctx.globalAlpha = 1;
            can.ctx.filter = "none";
            can.ctx.shadowColor ="rgba(0,0,0,0)";
            can.ctx.globalCompositeOperation = "copy";
            can.ctx.drawImage(mirror, 0, 0);
            can.ctx.buffer_Id = 0;
            can.ctx.globalCompositeOperation = "source-over";
            if(can.undo && (can.w !== can.desc.undoCan.width || can.h !== can.desc.undoCan.height)){
                 if (can.desc.undoCan1) {
                    const undo = can.desc.undoCan1;
                    undo.width = undo.w = can.w;
                    undo.height = undo.h = can.h;
                    undo.ctx.globalCompositeOperation = "copy";
                    undo.ctx.drawImage(can.desc.undoCan, 0, 0);
                    undo.ctx.globalCompositeOperation = "source-over";                    
                }              
                const undo = can.desc.undoCan;
                undo.width = undo.w = can.w;
                undo.height = undo.h = can.h;
                undo.ctx.globalCompositeOperation = "copy";
                undo.ctx.drawImage(mirror, 0, 0);
                undo.ctx.globalCompositeOperation = "source-over";
                 

            }
            can.changed = frameCount;
            can.restored = markRestored;
            can.processed = false;
        }
        can.lockPending = function(lockType){  // Must register lock pending befor you can get a lock
            can.isLocked = true;
            can.pendingLockTypes.push(lockTypes[lockType] ? lockTypes[lockType] : lockTypes.pixelSet);
            can.pendingLocks === 0 && heartBeat.countKeepAwake(1);
            can.pendingLocks += 1;
            spriteList.updateInfo();
        }
        can.lock = function(progress, getPix = true){
            if(can.isLocked) {
                if(can.pendingLocks === 0){
                    return undefined
                }
                can.pendingLocks -= 1;
            }else{
                return undefined;
            }
            spriteList.updateInfo();
            can.isLocked = true;
            can.lockType = can.pendingLockTypes.shift();
            if(progress !== undefined){
                can.progress = progress;
            }
            if(getPix){
                const imgData = can.ctx.getImageData(0,0, can.w, can.h);
                return imgData;
            }
        }
        can.pixels = function(progress, getPix = true){
            if (progress !== undefined) { can.progress = progress  }
            if (getPix) {
                const imgData = can.ctx.getImageData(0,0, can.w, can.h);
                return imgData;
            }
        }
        can.unlock = function(imgData){
            if (imgData !== undefined){
                if (can.lockType === lockTypes.pixelSet) {
                    if (imgData.data) {
                        can.ctx.putImageData(imgData,0,0);
                        can.ctx.buffer_Id = 0;
                        can.processed = true;
                    }
                } else {
                    can.processedData = imgData;  // for example is imgData holds indexed pixels
                }
            }
            if (can.pendingLocks === 0){
                can.isLocked = false;
                heartBeat.countKeepAwake(-1);
                can.lockType = 0;
                can.pendingLockTypes.length = 0;
                if (can.processed) { can.update() }
            }
            can.progress = undefined;
            spriteList.updateInfo();
        }
        can.restoreLostContext = function() {
            var undoOld = can.desc.undoCan;
            var mirrorOld = can.desc.mirror;
            can.desc.undoCan = undefined;
            can.desc.mirror = undefined;
            const descA = {
                width: can.w,
                height: can.h,
                guid: can.guid,
                of: can.desc,
                type: "restoreLost"
            };
            API.create(descA, canNew => {
                if(canNew.desc.undoCan){
                    canNew.desc.undoCan.ctx.globalCompositeOperation = "copy";
                    canNew.desc.undoCan.ctx.drawImage(undoOld,0,0);
                    canNew.desc.undoCan.ctx.buffer_Id = 0;;
                    canNew.desc.undoCan.ctx.globalCompositeOperation = "source-over";
                }
                canNew.desc.mirror.ctx.globalCompositeOperation = "copy";
                canNew.desc.mirror.ctx.drawImage(mirrorOld,0,0);
                canNew.desc.mirror.ctx.buffer_Id = 0;
                canNew.desc.mirror.ctx.globalCompositeOperation = "source-over";
            });
        }
        if(can.desc.undoCan){
            if (can.desc.undoCan1) {
                can.undo = function() {
                    const t2 = can.desc.undoCan1;
                    const t1 = can.desc.undoCan;
                    const t0 = can.desc.mirror;
                    can.desc.undoCan1 = t0;
                    can.desc.undoCan = t2;
                    mirror = can.desc.mirror = t1;
                    can.changed = frameCount;
                    if (can.dependent) { can.callDependents() }   
                }                
                can.redo = can.pushUndo = function() {
                    const t2 = can.desc.undoCan1;
                    const t1 = can.desc.undoCan;
                    const t0 = can.desc.mirror;                   
                    can.desc.undoCan1 = t1;
                    can.desc.undoCan = t0;
                    mirror = can.desc.mirror = t2;
                    can.changed = frameCount;
                    if (can.dependent) { can.callDependents() }                   
                }
            } else {
                can.pushUndo = can.redo = can.undo = function() {
                    var temp = can.desc.undoCan;
                    can.desc.undoCan = can.desc.mirror;
                    mirror = can.desc.mirror = temp;
                    can.changed = frameCount;
                    if (can.dependent) { can.callDependents() }
                }
            }
        }
        can.isLocked = false;
        can.lockType = 0;
        can.pendingLocks = 0;
        can.pendingLockTypes = [];
        can.processed = true;
        can.restored = false;
        can.shared = false; // two or more systems can be rendering to this media. This is set true to ensure the systems coordinate their rendering
        can.update();
    }
    function addUndo(can, undoName, id) {
        const undoCan =  createCanvas(can.width, can.height);
        can.desc[undoName] = undoCan;
        undoCan._ID = id;
        undoCan.ctx = undoCan.getContext("2d");
        undoCan.ctx.imageSmoothingEnabled = false;
		undoCan.ctx.imageSmoothingQuality = 'high';
        undoCan.ctx.drawImage(can, 0, 0);
        undoCan.ctx.buffer_Id = 0;
        
    }
    function createDrawableExtras(can) {
        addUndo(can, "undoCan", 3);
        if (imageExtraUndos) {
            addUndo(can, "undoCan1", 4);
        }
    }
    function createVideoExtras(video){
        const frameHold =  createCanvas(video.width, video.height);//document.createElement("canvas");
        frameHold.w = frameHold.width = video.width;
        frameHold.h = frameHold.height = video.height;
        video.desc.frameHold = frameHold;
        frameHold.ctx = frameHold.getContext("2d");
        frameHold.ctx.imageSmoothingEnabled = false;
        frameHold.ctx.globalCompositeOperation = "copy";
        frameHold.ctx.buffer_Id = 0;
        var mustCap = false;
        function capFrame() {
            frameHold.ctx.drawImage(video, 0, 0, video.width, video.height);
            video.holdingFrame = true;
            mustCap = false;
        }
        video.holdFrame = function(mustCapture = false) {
            if(!video.seeking) { capFrame() }
            else if(mustCapture) { mustCap = true }
        }
        video.seekTo = function(time){
            if(!video.seeking) { capFrame() }
            video.currentTime = time;
        }
        video.onseeked = function(event) {
            if (mustCap) { capFrame() }
            video.holdingFrame = false;
            if(video.onSeeked) { video.onSeeked(event) }
        }
    }
    function createSoundExtras(sound){
		const desc = sound.desc;
		Object.assign(sound.desc, {
			name:  "Sound" + getGUID(),
			toString() { return "Loading sound: " + this.src },
			status: "Loading",
			isSound: true,
			dirty: true,
			duration: 0,
			playing: false,
            renderPosition(sprite) {
                var rate =  sprite.image.w / Math.max(1, Math.abs(sprite.w * sprite.sx));
                
                var x = sprite.x - (sprite.w * sprite.sx * 0.5);
                sprite.sound.rateScale = rate;
                sprite.sound.startOffset = -(x / 128);

            },           
			onLoaded(buffer) {
				desc.status = "OK";
				desc.sBuffer = buffer;
				desc.duration = buffer.duration;
				sound.w = sound.width = buffer.duration * 128 + 1 | 0
				sound.marked = true;
				sound.desc.toString = () => textIcons.speakerOn + ": " + sound.desc.fname + " " + buffer.duration.toFixed(3) + "seconds ";
				desc.onLoaded = undefined;
				Audio.draw(sound);
				if (buffer.duration * 60 > animation.maxLength) {
					animation.endTime = animation.maxLength =  buffer.duration * 60 | 0;
				}
			},
		});
    }
    function createImageUtils(img){
        if (img.desc.vector) {
            img.desc.pathPointCount = 0;
            img.save = function(name = img.desc.name, type = "vectorpaths", quality = 1){
                if(img.desc.dirtyLines) { img.redraw() }
				const ps = {paths:[]}
				for(const path of img.paths) {
					const p = [];
					for(const pp of path) {
						p.push(Math.round(pp[0] * 10) / 10, Math.round(pp[1] * 10) / 10);
					}
					ps.paths.push(p);
				}
                storage.saveJSON(ps, name, type);
                img.desc.dirty = false;
            }
            img.desc.toString = function(){
                return img.desc.name +
                    " " + textIcons.vector+
                    " " + img.w +
                    " * "  + img.h + "px " +
                    img.desc.pathPointCount + "pts " +
                    (img.desc.dirty ? "Dirty " : "");
            }
            img.remake = function(layer = false) {
                const ps = localProcessImage.imageToVectorPaths(img.desc.fromImage, img.desc.pathStr.color, img.desc.pathStr.tolerance, undefined, layer);
                img.desc.pathStr.paths = ps.paths;
                img.desc.dirty = true;
                img.desc.dirtyLines = true;
                img.desc.lastRemakeAnimTime = animation.time;
            }
            if(img.desc.fromImage) {
                if(img.desc.fromImage.dependent === undefined){
                    img.desc.fromImage.dependent = new Map();
                }
                img.desc.fromImage.dependent.set(img, img.remake);
                img.desc.fromImage.desc.issueFrameCapture = true;
                img.desc.fromImage.desc.addEvent("framecapture", () => {
                    if (animation.time !== img.desc.lastRemakeAnimTime) {
                        img.remake();
                    }
                });
            }
            img.redraw = function() {
                img.paths = utils.pathStrToPoints(img.desc.pathStr);
                img.desc.pathPointCount = utils.lastVectorPointCount;
                img.desc.dirtyLines = false;
            }
            img.asSVG = function() {
                const svg = createSVG("svg", {width : img.w, height : img.height});
                img.paths.forEach((path,i)=>{
                   svg[path+i] = createSVG("path", {points : path});
                    svg[path+i].fill = "black";
                });
                var d = $("div",{})
                d.appendChild(svg.node)
                var html = d.innerHTML;
                var color = "#"+img.desc.pathStr.displayColor.r.toString(16).padStart(2,"0") +
                    img.desc.pathStr.displayColor.g.toString(16).padStart(2,"0") +
                    img.desc.pathStr.displayColor.b.toString(16).padStart(2,"0");
                html = html.replace(/<path points="/g,"<path fill-rule=\"evenodd\" d=\"M");
                html = html.replace(/([0-9]) ([-0-9])/g,"$1 L $2");
                html = html.replace(/" fill/g,"Z\" fill");
                html = html.replace("<svg width=", '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ##V width=');
                html = html.replace(" ##V",' viewBox="0 0 '+img.w+' '+img.h+'" ');
                html = html.replace(/\" fill=\"black\"><\/path><path fill-rule=\"evenodd\" d="/g," ");
                html = html.replace(/\"black\"/g,"\""+color+"\"");
                img.SVG = new Image();
                img.SVG.src = "data:image/svg+xml;base64," + window.btoa(html);
                img.desc.pathStr.renderAsSVG = true;
                img.desc.dirtyLines = false;
            }
            img.onremove = function() {
                if(img.desc.fromImage && img.desc.fromImage.dependent) {
                    img.desc.fromImage.dependent.delete(img);
                    if(img.desc.fromImage.dependent.size === 0){
                        img.desc.fromImage.dependent = undefined;
                    }
                }
            }
        }
        if (!img.desc.vector && !img.desc.video) {
            Object.assign(img.desc, Events(img.desc));
            img.save = function(name = img.desc.name, type = "png", quality = 1){
                if(img.desc.videoCap && media.videoCapture) {
					if (!media.videoCapture.busy && media.videoCapture.hasContent) {
						if(media.videoCapture.stop()) {
							let s = media.videoCapture.owner;
							if(s) { s.type.videoCapture = false }
							media.videoCapture = undefined;
							img.desc.videoCap = false;
							img.lastAction = " as video";
							img.desc.dirty = false;
							addToString();
							//editSprites.getButton(commands.edSprBigPlayPause).setSprite(0) ;
							timeline.getButton(commands.animPlayPause).setSprite(0);
							timeline.getButton(commands.animGotoPrevFrame).setSprite(0);
							timeline.getButton(commands.animGotoNextFrame).setSprite(0);
						}
                    }else {
						if(media.videoCapture.busy) {
							log.info("Video capture is busy!");
						}else{
							log.info("Nothing to save from video capture");
						}
                    }
                }else if(img.desc.videoCap && paint.videoCapture) {
                    if(paint.videoCapture.hasContent) {
                        paint.videoCapture.download(name);
                        img.desc.dirty = false;
                    }else {
                        log.info("Nothing to save from video capture");
                    }
                }else{
                    saveImage(img, name, type ,quality);
                    img.desc.fname = img.src = settings.downloadDir + name + "." + type;
                    img.desc.dirty = false;
                    img.lastAction = "as " + type;
                }
            }
            img.clear = function(andMirror = true, rect){
                img.ctx.setTransform(1,0,0,1,0,0);
                img.ctx.globalAlpha = 1;
                img.ctx.globalCompositeOperation = "source-over";
                img.ctx.buffer_Id = 0;;
				if (rect) {
					img.ctx.clearRect(rect.x,rect.y,rect.w,rect.h);
				} else {
					img.ctx.clearRect(0,0,img.w,img.h);
				}
                img.processed = true;
                if (andMirror) { img.update() }
            }
			function addToString() {
                if (img.tainted) { img.desc.toString = function() { return "Untrusted!!! " + img.desc.name } }
                else {
                    img.desc.toString = function(){
                        const locks = () => (textIcons.locked).padStart(img.pendingLocks+1,textIcons.locked);
                        return img.desc.name + " " + (img.isLocked ? locks : (img.isDrawable ? textIcons.pallet :"")) + " " +
                            img.w + " * "  + img.h + "px " +
                            (img.desc.sprites ? img.desc.sprites.length + " " + textIcons.sprite : "") +
                            (img.desc.capturing ? textIcons.captureOn + " " : "") +
                            (img.desc.dirty ? "Dirty " : (img.saved ? "Saved" : "")) +
                            (img.lastAction ? " '" + img.lastAction + "'" : "");
                    }
                }
			}
			addToString();
            img.onremove = function() {
                if (img.dependentOn) {
                    for (const dep of img.dependentOn.values()) {
                        dep.removeDependent(img);
                    }
                }
                if(img.dependent) {
                    img.dependent = undefined;
                }
            }
            img.addSubSprites = function(sprites) {
				img.desc.sprites = sprites;
				img.desc.subSprCount = sprites.length;
				sprites.sort((a,b) => a.id - b.id);
            }
			img.encodeSubSprites = function(sprites, header = subSpriteHeader) {
                img.addSubSprites(sprites);
				if(img.desc.sprites) {
					const addByteInt = (b,v) => vals.push(0xFF, b, (v >> 8) & 0xFF, v & 0xFF);
					const addInt = v => vals.push(0xFF, v >> 16, (v >> 8) & 0xFF, v & 0xFF);
					var len = img.desc.sprites.length * 4 * 4;
					const vals = [...[...header].map(c => c === "0" ? 0xFF : c.charCodeAt(0))];
					addInt(len);
					for(const spr of img.desc.sprites) {
						addByteInt(spr.id >> 16, spr.x);
						addByteInt(spr.id & 0xff, spr.y);
						addInt(spr.w);
						addInt(spr.h);
					}
					if(subSpriteHeader !== header) {
						img.desc.gridSubSprites = true;
					}
					var h = Math.ceil(vals.length / (img.w * 4));
					const data = img.ctx.getImageData(0,img.h - h, img.w, h);
					data.data.set(vals.reverse(), data.data.length - vals.length);
					img.ctx.putImageData(data, 0, img.h - h);
				}
			}
			img.decodeSubSprites = function() {
				if(!img.desc.sprites) {
					const readInt = pos => {
						pos --;
						return (dat[pos--] << 16) | (dat[pos--] << 8) | dat[pos--];
					}
					const readInt16 = pos => (dat[pos-2] << 8) | dat[pos-3];
					const readId = pos => (dat[pos-1] << 8) | dat[pos-5];
					const data = img.ctx.getImageData(img.w - (subSpriteHeader.length / 4), img.h - 1, subSpriteHeader.length / 4, 1);
					const vals = [...[...subSpriteHeader].map(c => c === "0" ? 0xFF : c.charCodeAt(0))].reverse();
					const valsGrid = [...[...subSpriteGridHeader].map(c => c === "0" ? 0xFF : c.charCodeAt(0))].reverse();
					delete img.desc.gridSubSprites ;
					var i = 0, dat;
					while(i < vals.length && vals[i] === data.data[i]) { i ++ }
					if(i < vals.length) {
						i = 0;
						while(i < valsGrid.length && valsGrid[i] === data.data[i]) { i ++ }
						if(i === valsGrid.length) {
							img.desc.gridSubSprites = true;
						}
					}
					if(i === vals.length) {
						dat = img.ctx.getImageData(img.w - (subSpriteHeader.length / 4) - 1, img.h - 1, 1, 1).data;
						const subSprCount = readInt(3) / 16;
						const h = Math.ceil((subSpriteHeader.length + subSprCount * 4 + 1) / img.w);
						dat = img.ctx.getImageData(0,img.h - h, img.w, h).data;
						var p = dat.length - (subSpriteHeader.length + 4) - 1;
						i = 0;
						const sprArr = [];
						while(i < subSprCount) {
							sprArr.push({
								id : readId(p),
								x : readInt16(p),
								y : readInt16(p-4),
								w : readInt16(p-8),
								h : readInt16(p-12),
							});
							p -= 16;
							i ++;
						}
						img.desc.sprites = sprArr;
					}
				}
			}
            img.desc.clipType = 0;
            img.clipToExtent = function(extent) {
                if ((img.desc.clipType & clipUsedFlags.extent) === 0) {
                    img.ctx.setTransform(1,0,0,1,0,0);
                    img.ctx.save()
                    img.ctx.beginPath();
                    img.ctx.rect(extent.x, extent.y, extent.w, extent.h);
                    img.ctx.clip();
                    if (!img.desc.clipped) { img.desc.clipped = {x:0, y:0, x1:0, y1:0} }
                    const cc = img.desc.clipped;
                    cc.x = extent.x;
                    cc.y = extent.y;
                    cc.x1 = extent.x + extent.w;
                    cc.y1 = extent.y + extent.h;
                    img.desc.clipType |= clipUsedFlags.extent;
                }
            }
			img.subSpriteClip = function(subSprite) {
				if(img.desc.sprites && (img.desc.clipType & clipUsedFlags.subSpr) === 0) {
					img.ctx.setTransform(1,0,0,1,0,0);
					img.ctx.save()
					img.ctx.beginPath();
					img.ctx.rect(subSprite.x, subSprite.y, subSprite.w, subSprite.h);
					img.ctx.clip();
					img.desc.clipType |= clipUsedFlags.subSpr;
                    if (!img.desc.clipped) { img.desc.clipped = {x:0, y:0, x1:0, y1:0} }
                    const cc = img.desc.clipped;
                    cc.x = subSprite.x;
                    cc.y = subSprite.y;
                    cc.x1 = subSprite.x + subSprite.w;
                    cc.y1 = subSprite.y + subSprite.h;
				}
			}
            // subSpriteUnclip is legacy will remove when I am sure I got em all
			img.unclip = img.subSpriteUnclip = function() {
				if(img.desc.clipType !== 0) {
                    if (img.desc.clipType === clipUsedFlags.restore2) {  img.ctx.restore() }
                    img.ctx.restore();
					img.desc.clipType = 0;
				}
			}
            img.saveSpriteSheet = function(name = "SpriteSheetDesc_"+ img.guid) {
                if (img.desc.sprites) {
                    var sep = "";
                    var str = "const spriteSheet = [\r\n";
                    for (const subSpr of img.desc.sprites) {
                        sep = "";
                        str += "    {";
                        for (const [key, val] of Object.entries(subSpr)) {
                            str += sep + key + ": ";
                            if (isNaN(val)) { str += "\"" + val + "\"" }
                            else { str += val }
                            sep = ", ";
                        }
                        str += "},\r\n";
                    }
                    str += "];\r\n\r\n";
                    downloadTextAs(str, name, "txt");
                }
            }
            img.isDrawable = true;
        }
    }
    const API = {
        lockTypes,
        createCanvas,
        each(cb) { for(const media of items) { cb(media) } },
        updateLists() { for (const item of items) { mediaList.add(img) } },
        clearActionItems() { onLoadActions.clear() },
        get loadActionCount() { return onLoadActions.size },
        reportOnLoadActions() {
            if (onLoadActions.size > 0) {
                log.info(onLoadActions.size + " pending load action/s");
                for(const a of onLoadActions.values()) {
                    log.info(a.actions.length + " Load actions pending for media '"+a.id+"'");
                }
            }
        },
        updateLoadActions(m) {
            var actionId = onLoadActions.has(m.guid) ? m.guid : m.desc.fname;
            var actionItem = onLoadActions.get(actionId);
            if (actionItem) {
                for (const action of actionItem.actions) { action(m) }
                onLoadActions.delete(actionId);
            }
        },
		deserialiseSprites(list) { // must call BRFORE loading media
            list.forEach(mm => {
                const m = mm.imgGuid ? media.byGUID(mm.imgGuid) : media.getByUrl(mm.fname);
                const setSprites = (m) => {
                    if (mm.grid) {
                        m.desc.gridSubSprites = true;
                        m.desc.sprites = [];
                        m.desc.subSprCount = (m.w / m.desc.sprites.w | 0) * (m.h / m.desc.sprites.h | 0);
                        var y, x, id = 0;
                        for (y = 0; y < m.h / mm.sprites.h; y ++) {
                            for (x = 0; x < m.w / mm.sprites.w; x ++) {
                                m.desc.sprites.push({
                                    x: x * mm.sprites.w,
                                    y: y * mm.sprites.h,
                                    w: mm.sprites.w,
                                    h: mm.sprites.h,
                                    id: id++
                                });
                            }
                        }
                    } else {
                        m.desc.sprites = mm.sprites.map(s => ({...s}));
                        m.desc.subSprCount = m.desc.sprites.length;
                    }
                }
                if (m) {
                    if (m.desc.sprites === undefined) {
                        setSprites(m);
                    }
                } else {
                    var id = mm.fname ?? mm.imgGuid;
                    var actionItem = onLoadActions.get(id);
                    if (actionItem === undefined) {
                        onLoadActions.set(id, actionItem = {id, actions: [], });
                    }
                    actionItem.actions.push(setSprites);
                }
            });
        },
		serialiseSprites(checkUsage = false, selectedOnly = false) {
			const spriteList = [];
			API.each(m => {
                var serialise = (selectedOnly && selection.hasMediaForSave(m)) || (checkUsage && !selectedOnly && sprites.hasMedia(m)) || checkUsage === false;
                if (serialise) {
                    if (m.desc.sprites) {
                        const [fname, imgGuid] = (!m.desc.fname || (m.isDrawable && m.desc && m.desc.dirty)) ? [undefined, m.guid] : [m.desc.fname, undefined];
                        if (m.desc.gridSubSprites) {
                            spriteList.push({
                                fname, imgGuid,
								id: m.guid,
                                grid: true,
                                sprites: {...m.desc.sprites[0]},
                            });
                        } else {
                            spriteList.push({
                                fname, imgGuid,
								id: m.guid,
                                sprites: m.desc.sprites.map(sprite => ({...sprite})),
                            });
                        }
                    }
                }
			});
			return spriteList;
		},
        hasUnused() {
            var res = false;
			API.each(m => {
                if (!m.desc.video && !m.desc.vector) {
                    if (!sprites.hasMedia(m)) { res = true }
                }
            });
            return res;
        },
        async serialiseImages(checkUsage = false, selectedOnly = false) {
			const imageList = [];
            const tCan = $("canvas",{});
            const ctxt = tCan.getContext("2d");
			API.each(m => { if (!m.desc.video && !m.desc.vector) { m.desc.serialised = false } });
			API.each(m => {
                if (!m.desc.video && !m.desc.vector) {
                    const serialise = (selectedOnly && selection.hasMediaForSave(m)) || (checkUsage && !selectedOnly && sprites.hasMedia(m)) || checkUsage === false;
                    if (serialise) {
                        if (m.desc.dirty) {
                            m.desc.dirty = false;
                            m.guid = getGUID();
                        }
                        if (m.ctx?.canvas?.toDataURL) {
                            m.desc.serialised = true;
                            imageList.push({
                                fname: m.desc.fname,
                                name: m.desc.name,
                                id: m.guid,
                                dataURL: m.ctx.canvas.toDataURL(),
                            });
                        } else {
                            m.desc.serialised = true;
                            tCan.width = m.w;
                            tCan.height = m.h;
                            ctxt.drawImage(m.ctx ? m.ctx.canvas : m,0,0);
                            imageList.push({
                                fname: m.desc.fname,
                                name: m.desc.name,
                                id: m.guid,
                                dataURL: tCan.toDataURL(),
                            });
                        }
                    }
                }
			});
            for (const imgDesc of imageList) {
                if (imgDesc.canvas) {
                    imgDesc.dataURL = await URL.createObjectURL(await imgDesc.canvas.convertToBlob({type : "image/png"}));
                    delete imgDesc.canvas
                }
            };
            tCan.width = tCan.height = 1;
			return imageList;
		},
        getMediaDeviceList() {
            var foundVideo = false;
            if(settings.localMedia === false) { return }
            if(navigator.mediaDevices &&  navigator.mediaDevices.enumerateDevices){
                navigator.mediaDevices.enumerateDevices()
                    .then(devices => { devices.forEach(device =>{
                        if(!foundVideo){
                            if(device.kind === "videoinput") {
                                const video = document.createElement('video');
                                video.userMedia = true;
                                video.guid = getGUID();
                                video.desc = {
                                    name : "WebCam",
                                    status : "Availible",
                                    toString() { return this.name + " " + this.status},
                                };
                                video.desc.supports = navigator.mediaDevices.getSupportedConstraints();
                                video.marked = true;
                                items.push(video);
                                mediaList.add(video);
                                video.openMedia = function(callback) {
                                    if(settings.localMedia) {
                                        if(video.desc.status === "Availible") {
                                            var busyId = busy("WebCam");
                                            navigator.mediaDevices.getUserMedia({audio: false, video: true})
                                                .then(stream => {
                                                    video.srcObject = stream;
                                                    video.onloadedmetadata = (e) => {
                                                        video.desc.status = "OK";
                                                        video.w = video.width = video.videoWidth;
                                                        video.h = video.height = video.videoHeight;
                                                        video.desc.toString = function() {
                                                            return this.name + " " + this.status +  "  " + video.w + "by"  + video.h ;
                                                        }
                                                        if(callback) { callback(video) }
                                                        busy.end(busyId);
                                                        video.play();
                                                         setTimeout(()=>mediaList.update(),10);
                                                    };
                                                })
                                                .catch(err => {
                                                    busy.end(busyId);
                                                    if (error.name === 'ConstraintNotSatisfiedError') {
                                                    } else if (error.name === 'PermissionDeniedError') {
                                                        log.warn("Media permission denied.");
                                                        log.warn("Painter will turn off User media search for following sessions.");
                                                        log.warn("To turn on goto extras=>System settings=>Misc and check. Local Media");
                                                        settings.localMedia = false;
                                                        settingsHandler.saveSettings();
                                                    }
                                                    video.desc.status = "Blocked";
                                                    mediaList.update();
                                                });
                                        }
                                    } else {
                                        video.desc.status = "Blocked in Painter settings.";
                                    }
                                }
                                foundVideo = true;
                            }
                        }
                        //log.obj(device, false, 2))
                    })})
                    .catch(function (err) { log.error(err.name + ": " + err.message) });
            }else {
                log.warn("No media devices located.");
            }
        },
        byName(name) {
            for(const media of items) {
                if(media.desc.name === name) { return media }
            }
        },
		byGUID(guid) {
            for(const media of items) {
				if(media.guid === guid) { return media }
			}
		},
        remove(media) {
            if (Array.isArray(media)) {
                for (const m of media) { API.remove(m) }
            } else {
                for(var i = 0; i < items.length; i ++) {
                    if(items[i] === media) {
                        if(media.onremove) { media.onremove() } // legacy event
                        items.splice(i, 1);
                        API.fireEvent("onremoved", {media});
                        return;
                    }
                }
            }
        },
        reset() {
            API.remove([...items]);
        },
        replace(media, newMedia) {
            for(var i = 0; i < items.length; i ++) {
                if(items[i] === media) {
                    items[i] = newMedia;
                    return;
                }
            }
        },
        replaceMediaListItem(media, newMedia) {
            for(var i = 0; i < mediaList.length; i ++) {
                if(mediaList[i] === media) {
                    mediaList[i] = newMedia;
                    return;
                }
            }
        },        
        replaceMediaByGUID(newMedia) {
            for(var i = 0; i < items.length; i ++) {
                if(items[i].guid === newMedia.guid) {
                    items[i] = newMedia;
                }
            }
        },
        convertToCanvas(media) {
             if (media.tainted) {
                log.warn("Can not create drawable from untrusted image.");
                return media;
            }
            if(media instanceof OffscreenCanvas) {
                const can = document.createElement("canvas");
                can.desc = media.desc;
                can.width = can.w = media.w
                can.height = can.h = media.h;
                can.desc.status = "OK";
                can.desc.dirty = true;
                can.ctx = can.getContext("2d");
                can.ctx.drawImage(media, 0, 0);
                can.ctx.buffer_Id = 0;;
                createDrawableExtras(can);
                createImageUtils(can);
                createImageMirror(can);
                API.replace(media, can);
                return can;
            }
            return media;
        },
        toDrawable(media) {
            if (media.tainted) {
                log.warn("Can not create drawable from untrusted image.");
                return media;
            }
            const can = createCanvas(media.w, media.h);//document.createElement("canvas");
            if (media.desc.guid)  {  // from legacy code
                delete media.desc.guid;  // should not be in description
            }
            can.desc = media.desc;
            can.guid = media.guid ?? getGUID();
            can.w = media.w
            can.h = media.h;
            can.desc.status = "OK";
            can.ctx = can.getContext("2d");
            can.ctx.drawImage(media, 0, 0);
            can.ctx.buffer_Id = 0;
            createDrawableExtras(can);
            createImageUtils(can);
			can.decodeSubSprites();
            createImageMirror(can);
            API.replace(media, can);
            can.desc.dirty = false;
            return can;
        },
        getByUrl(name) {
            var m = items.find(m=> m.src && m.src === name);
            if (!m) {
                m = items.find(m=> m.desc && (m.desc.fname === name || (m.desc.src && m.desc.src === name) || (m.desc.name && m.desc.name === name)))
            }
            return m;
        },
        isLoaded(name) {
            return items.findIndex(m=>{
                if(m.src && m.src === name) {
                    return true;
                }
                if(m.desc && (m.desc.fname === name || (m.desc.src && m.desc.src === name) || (m.desc.name && m.desc.name === name))){
                    return true;
                }
                return false;
            }) > -1;
        },
        createPallet(count) {
            const lookup = new Uint8ClampedArray(256 * 3);
            const pLookup = [];
            const MAX_DIST = (((255*255)**2)*3)**0.5; // Spacial seperation of White and Black
            const can = createCanvas(16, 16);//document.createElement("canvas");
            can.w = 16;
            can.h = 16;
            can.ctx = can.getContext("2d");
            can.ctx.imageSmoothingEnabled = false;
            var dirty = true;
            var sortBy = palletSorts.val;
            var layout = palletLayouts.square;
            var layoutStr = "square";
            const API = {
                APIName: "Pallet",
                image : can,
                isPallet : true,
                save(filename) {
                    if(count === 0) { return false }
                    filename = "Painter3_Pallet" + "_" + filename + "_" + getGUID();
                    var str = "";
                    var s = "";
                    this.each((r, g, b, idx)=>{ str += s + this.getCSS(idx); s = ","});
                    const data = {
                        colors : str,
                        layout : palletLayouts.named[layout],
                        sortBy :  palletSorts.named[sortBy],
                    };
                    storage.saveJSON(data, filename, "palletv2");
                },
                toHexStr() {
                    this.clean();
                    var i = 0, str = "", join = "";
                    if (palletFormat === "CSSHex") {
                        while (i < count) {
                            str += join + "#";                            
                            str += (lookup[i     * 3    ] | 0).toString(16).padStart(2, "0");
                            str += (lookup[i     * 3 + 1] | 0).toString(16).padStart(2, "0");
                            str += (lookup[(i++) * 3 + 2] | 0).toString(16).padStart(2, "0");
                            join = ", ";
                        }
                    } else if (palletFormat === "Hex32") {
                        while (i < count) {
                            str += join + "0xff";    
                            str += (lookup[i     * 3 + 2] | 0).toString(16).padStart(2, "0");
                            str += (lookup[i     * 3 + 1] | 0).toString(16).padStart(2, "0");
                            str += (lookup[(i++) * 3 + 0] | 0).toString(16).padStart(2, "0");
                            join = ", ";
                        }
                    } else {
                        while (i < count) {
                            str += (lookup[i     * 3    ] | 0).toString(16).padStart(2, "0");
                            str += (lookup[i     * 3 + 1] | 0).toString(16).padStart(2, "0");
                            str += (lookup[(i++) * 3 + 2] | 0).toString(16).padStart(2, "0");
                        }
                    }
                    return str;
                },
                fromHexStr(str, clean = true) {
                    var i = 0;
                    if (str.includes("0X") || str.includes("0x")) {
                        str = str.replace(/0xff|\,| /gi, "");
                        count = str.length / 6 | 0;
                        while (i < count) {
                            lookup[i * 3 + 0] = parseInt(str.substring(i * 6 + 4, i * 6 + 6), 16);
                            lookup[i * 3 + 1] = parseInt(str.substring(i * 6 + 2, i * 6 + 4), 16);
                            lookup[i * 3 + 2] = parseInt(str.substring(i * 6 + 0, i * 6 + 2), 16);
                            i++;
                        }
                    } else {
                        str = str.replace(/\#|\,| /g, "");
                        count = str.length / 6 | 0;
                        while (i < count) {
                            lookup[i * 3]     = parseInt(str.substring(i * 6,     i * 6 + 2), 16);
                            lookup[i * 3 + 1] = parseInt(str.substring(i * 6 + 2, i * 6 + 4), 16);
                            lookup[i * 3 + 2] = parseInt(str.substring(i * 6 + 4, i * 6 + 6), 16);
                            i++;
                        }
                    }
                    this.dirty = true;
                    clean && this.clean();
                },
                getLookup() {
                    const res = [];
                    var i = 0, ic = 0, l = lookup
                    while (i < count) {
                        res.push([l[ic++], l[ic++], l[ic++]]);
                        i++;
                    }
                    return res;
                },
                each(cb) {
                    var i = count, ii = 0, idx = 0;
                    const l = lookup;
                    while (i-- > 0) {
                        if (cb(l[ii++], l[ii++], l[ii++], idx++) === true) { break }
                    }
                },
                eachCSS(cb) {
                    var i;
                    for (i = 0; i < count; i ++) { cb(this.getCSS(i), i) }
                },
                idxOfRGB(r, g, b) {
                    if (count <= 0) { return -1 }
                    var i = count, ic = 0;
                    const l = lookup;
                    r |= 0; g |= 0; b |= 0;
                    while (i--) {
                        const ci = i * 3;
                        if (l[ci] === r && l[ci + 1] === g && l[ci + 2] === b) { return i }
                    }
                    return -1;
                },
                closestColorIdx(r, g, b, min = Infinity) {
                    if (count <= 0) { return -1 }
                    r *= r; g *= g; b *= b;
                    var i = 0, ic = 0, dist, l = lookup, idx = -1;
                    while (i < count) {
                        dist = (l[ic] * l[ic++] - r) ** 2 + (l[ic] * l[ic++] - g) ** 2  + (l[ic] * l[ic++] - b) ** 2;
                        if (dist <= min) {
                            if (dist === 0) { return i }
                            min = dist;
                            idx = i;
                        }
                        i ++;
                    }
                    return idx;
                },
                sort() {
                    if (sortBy === palletSorts.noSort || sortBy === palletSorts.fixed) { return }
                    var i, r , g, b, rr, gg, bb, rgb, hsl;
                    var tp = [];
                    if (sortBy === palletSorts.val || sortBy === palletSorts.valReverse) {
                        for (i = 0; i < count; i++) {
                            r = lookup[i* 3];
                            g = lookup[i* 3 + 1];
                            b = lookup[i* 3 + 2];
                            tp.push([r, g, b, r * r + g * g + b * b]);
                        }
                    } else if (sortBy === palletSorts.perceptualVal || sortBy === palletSorts.perceptualValReverse) {
                        for (i = 0; i < count; i++) {
                            rr = (r = lookup[i* 3]) * palletConst.perceptualWeights.r;
                            gg = (g = lookup[i* 3+ 1]) * palletConst.perceptualWeights.g;
                            bb = (b = lookup[i* 3+ 2]) * palletConst.perceptualWeights.b;
                            tp.push([r, g, b, rr + gg + bb]);
                        }
                    } else if (sortBy === palletSorts.hue || sortBy === palletSorts.hueReverse) {
                        rgb = utils.rgba;
                        hsl = utils.rgba;
                        for (i = 0; i < count; i++) {
                            r = rgb.r = lookup[i* 3];
                            g = rgb.g = lookup[i* 3 + 1];
                            b = rgb.b = lookup[i* 3 + 2];
                            rgb.asHSL(hsl);
                            if (hsl.g < 4) {
                                tp.push([r, g, b, -100 + hsl.b]);
                            } else {
                                tp.push([r, g, b, ((hsl.r / 22) | 0) * 100 + hsl.b]);
                            }
                        }
                    }
                    sortBy === palletSorts.val || sortBy === palletSorts.hue || sortBy === palletSorts.perceptualVal ? tp.sort((a,b)=> a[3] - b[3]) : tp.sort((a,b)=> b[3] - a[3]);;
                    for (i = 0; i < count; i++) {
                        lookup[i*3] = tp[i][0];
                        lookup[i*3 + 1] = tp[i][1];
                        lookup[i*3 + 2] = tp[i][2];
                    }
                },
                sortUsing(orderArray) {
                    if (sortBy === palletSorts.fixed) { return }
                    if (orderArray.length !== count) { return }
                    var tp = [];
                    for (i = 0; i < count; i++) {
                        const r = lookup[i*3];
                        const g = lookup[i*3 + 1];
                        const b = lookup[i*3 + 2];
                        tp.push([r, g, b, orderArray[i]]);
                    }
                    tp.sort((a, b)=> a[3] - b[3]);
                    for (i = 0; i < count; i++) {
                        lookup[i*3] = tp[i][0];
                        lookup[i*3 + 1] = tp[i][1];
                        lookup[i*3 + 2] = tp[i][2];
                    }
                    sortBy = palletSorts.noSort;
                    this.update();
                },
                createColorPairing(threshold) {
                    pLookup.length = 0;
                    var i = 0, ic = 0, udist, l = lookup
                    var i1 = 0, ic1 = 0;
                    while (i < count) {
                        const r = l[ic] * l[ic++];
                        const g = l[ic] * l[ic++];
                        const b = l[ic] * l[ic++];
                        pLookup.push([i + (i<<8), 0, r, g, b]);
                        i1 = i + 1;
                        ic1 = (i + 1) * 3;
                        while (i1 < count) {
                            const rr = l[ic1] * l[ic1++]
                            const gg = l[ic1] * l[ic1++]
                            const bb = l[ic1] * l[ic1++]
                            udist = Math.sqrt( (rr - r) ** 2 + (gg - g) ** 2  + (bb - b) ** 2 ) / MAX_DIST;
                            if (udist < threshold) {
                                pLookup.push([i + (i1<<8), udist, (rr + r) / 2 | 0, (gg + g) / 2 | 0, (bb + b) / 2 | 0]);
                            }
                            i1++;
                        }
                        i++;
                    }
                    pLookup.sort((a, b)=> a[1] - b[1]);
                    log("Dither scope " + pLookup.length);
                },
                createLogLookup() {
                    pLookup.length = 0;
                    var i = 0, ic = 0, l = lookup
                    while (i < count) {
                        const r = l[ic] * l[ic++];
                        const g = l[ic] * l[ic++];
                        const b = l[ic] * l[ic++];
                        pLookup.push([r, g, b]);
                        i++;
                    }
                    return pLookup;
                },
                cleanupColorSearch() {
                    pLookup.length = 0;
                },
                closestColorPair(fr, fg, fb) {
                    if (count <= 0) { return -1 }
                    fr *= fr; fg *= fg; fb *= fb;
                    var r, g, b;
                    var len = pLookup.length;
                    var i = 0, dist, min = Infinity, idx = -1;
                    while (i < len) {
                        var p = pLookup[i];
                        dist = ((fr - p[0]) ** 2 + (fg - p[1]) ** 2 + (fb - p[2]) ** 2);
                        if (dist === 0) { return i + (i<<8) }
                        if (dist < min) {
                            min = dist;
                            idx = i;
                        }
                        i ++;
                    }
                    var p = pLookup[idx];
                    r = (p[0] - fr);
                    g = (p[1] - fg);
                    b = (p[2] - fb);
                    fr -= r;
                    fg -= g;
                    fb -= b;
                    //const distA = min;
                    var i = 0, dist, min = Infinity, idx1 = -1;
                    while (i < len) {
                        var p = pLookup[i];
                        dist = ((fr - p[0]) ** 2 + (fg - p[1]) ** 2 + (fb - p[2]) ** 2);
                        if (dist < min) {
                            min = dist;
                            idx1 = i;
                        }
                        i ++;
                    }
                    if (idx1 === idx) { return idx + (idx<<8) }
                    //const distB = min;
                    //const f = distA / (distB + distA);
                    fr += r;
                    fg += g;
                    fb += b;
                    var p = pLookup[idx];
                    var p1 = pLookup[idx1];
                    var r1 = Math.abs(fr - p[0]);
                    var g1 = Math.abs(fg - p[1]);
                    var b1 = Math.abs(fb - p[2]);
                    var r2 = Math.abs(fr - p1[0]);
                    var g2 = Math.abs(fg - p1[1]);
                    var b2 = Math.abs(fb - p1[2]);
                    r = r1 / (r1 + r2);
                    g = g1 / (g1 + g2);
                    b = b1 / (b1 + b2);
                    if (Math.random() < (r + g + b) / 3) { return idx + (idx1 << 8) }
                    return idx + (idx << 8);
                },
                addColor(r, g, b) {
                    if (count >= 256) { return false }
                    lookup[count * 3] = r;
                    lookup[count * 3 + 1] = g;
                    lookup[count * 3 + 2] = b;
                    dirty = true;
                    count += 1;
                    return count;
                },
                removeColor(r, g, b) {
                    const idx = API.idxOfRGB(r, g, b);
                    var i, ii;
                    if (idx > -1) {
                        i = idx * 3, ii = i + 3;
                        while (ii < count * 3) {
                            lookup[i++] = lookup[ii++];
                            lookup[i++] = lookup[ii++];
                            lookup[i++] = lookup[ii++];
                        }
                        dirty = true;
                        count -= 1;
                    }
                    return count;
                },
                replaceColor(idx, r, g, b) {
                    if (idx > count) { return false }
                    if (g === undefined) {
                        lookup[idx * 3] = r.r;
                        lookup[idx * 3 + 1] = r.g;
                        lookup[idx * 3 + 2] = r.b;
                    } else {
                        lookup[idx * 3] = r;
                        lookup[idx * 3 + 1] = g;
                        lookup[idx * 3 + 2] = b;
                    }
                    dirty = true;
                    return idx;
                },
                getRGB(idx, rgb = utils.rgba) {
                    idx *= 3;
                    rgb.r = lookup[idx++];
                    rgb.g = lookup[idx++];
                    rgb.b = lookup[idx++];
                    return rgb
                    
                },
                getRGBArray(idx, array = []) {
                    idx *= 3;
                    array[0] = lookup[idx++];
                    array[1] = lookup[idx++];
                    array[2] = lookup[idx++];
                    return array;
                },
                getCSS(idx) {
                    return "#" +
                        lookup[idx * 3].toString(16).padStart(2, "0") +
                        lookup[idx * 3 + 1].toString(16).padStart(2, "0") +
                        lookup[idx * 3 + 2].toString(16).padStart(2, "0");
                },
                setPixel(idx, data) {
                    data[0] = lookup[idx * 3];
                    data[1] = lookup[idx * 3 + 1];
                    data[2] = lookup[idx * 3 + 2];
                },
                fromColorRange(range) {
                    if (range.useLookup) {
                        const rl = range.lookupVal;
                        for (var i = 0; i < range.lookupLen; i++) {
                            lookup[i * 3] = rl[i][0];
                            lookup[i * 3 + 1] = rl[i][1];
                            lookup[i * 3 + 2] = rl[i][2];
                        };
                        count = range.lookupLen;
                    }else{
                        const rgb = {r : 0, g : 0, b : 0, a : 0}
                        for (var i = 0; i < 256; i++) {
                            range.rgbAt(i / 255, rgb);
                            lookup[i * 3] = rgb.r;
                            lookup[i * 3 + 1] = rgb.g;
                            lookup[i * 3 + 2] = rgb.b;
                        }
                        count = 256;
                    }
                    dirty = true;
                },
                asColorRange(range = utils.colorRange) {
                    range.lookupLen = count;
                    range.useLookup = true;
                    const rl = range.lookupVal;
                    for (var i = 0; i < count; i ++) {
                        if (rl[i] === undefined) {
                            rl[i] = [lookup[i * 3], lookup[i * 3 + 1], lookup[i * 3 + 2], 255];
                        }else{
                            rl[i][0] = lookup[i * 3];
                            rl[i][1] = lookup[i * 3 + 1];
                            rl[i][2] = lookup[i * 3 + 2];
                            rl[i][3] = 255;
                        }
                    }
                    return range;
                },
                asArray() {
                    var res = [];
                    for (var i = 0; i < count; i ++) {
                        res[i] =  [lookup[i * 3], lookup[i * 3 + 1], lookup[i * 3 + 2]];
                    }
                    return res;
                },
                optimize() {
                    const pal = this.asArray();
                    for (var i = 0; i < pal.length; i++) {
                        const p = pal[i];
                        for (var j = i + 1; j < pal.length; j++) {
                            const dR = p[0] - pal[j][0];
                            const dG = p[1] - pal[j][1];
                            const dB = p[2] - pal[j][2];
                            if (dR === 0 && dG === 0 && dB === 0) {
                                pal.splice(j--, 1);
                            }
                        }
                    }
                    count = 0;
                    pal.forEach(p => this.addColor(p[0], p[1], p[2]));
                },
                colorIndexAtCoord(x, y) {
                    const l = palletLayouts.getLayout(count, layout);
                    return ((x / l.w) | 0) + (y / l.h | 0) * l.m;
                },
                update() {
                    const {w, h, m} = palletLayouts.getLayout(count, layout);
                    var x, y;
                    var i = 0;
                    can.ctx.clearRect(0, 0, 16, 16);
                    while (i < count) {
                        x = (i % m) * w;
                        y = (i / m | 0) * h;
                        can.ctx.fillStyle = this.getCSS(i++);
                        can.ctx.fillRect(x, y, w, h);
                    }
                    API.fireEvent("updated");
                    dirty = false;
                },
                clean(sort = true) {
                    if (dirty) {
                        this.optimize();
                        sort && this.sort();
                        this.update();
                    }
                },
                get layout() { return layout },
                set layout(val) {
                    layoutStr = val;
                    var apply = val[0] === "*" ? (val = val.slice(1), false) : true;
                    if (palletLayouts[val] !== undefined && palletLayouts[val] !== layout) {
                        layout = palletLayouts[val];
                        palletLayouts.setLayoutCanvas(can, layout);
                        if (apply) {
                            this.sort();
                            this.update();
                        } else {
                            dirty = true;
                        }
                    }
                },
                get layoutString() { return layoutStr },
                get sortBy() { return sortBy },
                get sortByString() { return palletSorts.named[sortBy] },
                set sortBy(val) {
                    var apply = val[0] === "*" ? (val = val.slice(1), false) : true;
                    if (palletSorts[val] !== undefined) {
                        if (sortBy !== palletSorts.noSort) {
                            sortBy = palletSorts[val];
                            if (apply) {
                                this.sort();
                                this.update();
                            } else {
                                dirty = true;
                            }
                        }
                    }
                },
                get length() { return count },
                set length(value) {
                    dirty = true;
                    count = (value <= 256 ? (value >= 0 ? value : 0) : 256) | 0;
                },
            };
            Object.assign(API, Events(API));
            if(isNaN(count) && count && count.isPallet) {
                const p = count;
                count = p.length;
                API.length = 0;
                p.each(API.addColor);
                sortBy = p.sortBy;
                p.layout = p.layoutString;
                API.clean();
            }
            return API;
        },
        lastLoadedGif : {name : "", frames : 0 },
        extractGifFrames(gif, name, lastCall){
            var frame = 0;
            var frameCount = gif.frameCount;
            const gifName = name;
            name = name.replace(/\.gif/gi,"") + "_" + getGUID();
            API.lastLoadedGif.name = name + "{F#}";
            API.lastLoadedGif.frames = frameCount;
            for(frame = 0; frame < frameCount; frame += 1){
                var img = gif.getFrame(frame);
                if (img) {
                    img.marked = true;
                    var desc = {
                        type : "canvas",
                        width : img.width,
                        height : img.height,
                        name : name + "{F" + frame + "}",
                        fname : gifName + "{F" + frame + "}",
                        isGif : true,
                        copyImg : img,
                        frame,
                        frameCount,
                    }
                    if(lastCall && frame === frameCount - 1) {
                        API.create(desc, lastCall);
                    } else {
                        API.create(desc);
                    }
                }
                gif.releaseFrame(frame);
            }
            if(settings.animateGifOnLoad) {
                setTimeout(() => {
                    API.lastLoadedGif.name = name + "{F#}";
                    API.lastLoadedGif.frames = frameCount ;
                    log.info(animation.createImageAnimation("From GIF"));
                },0);
            }
        },
        create(desc,callback){
            function showLoaded(i){
                if(i){
                    var sprite = new Sprite(0, 0, i.w, i.h);
                    sprite.changeImage(i);
                    sprites.add(sprite);
                    view.centerOn(sprite.x, sprite.y);
                    selection.clear(true);
                    selection.add(sprite);
                }else{
                    log("Did not load");
                }
            }
            if(typeof desc === "string"){
                if(typeof callback ==="string" && callback === "show"){
                    callback = showLoaded;
                }
                var busyId = busy("loading");
                var img,gImg;
                if(desc.toLowerCase().indexOf(".gif") > 0){
                    gImg = GIFGroover();
                    let dir = 0;
                    gImg.src = desc;
                    var name = gImg.src.split("/").pop();
                    gImg.onprogress = (event) => {
                        if(gImg.frameCount > animation.length) {
                            animation.length = animation.maxLength = gImg.frameCount;
                        }
                        busy.text = ((event.progress) | 0) + "%"
                    }
                    gImg.onload = ()=>{
                        directortySearch.found(dir - 1);
                        storage.addFileHistory(gImg.src);
                        gImg.w = gImg.width;
                        gImg.h = gImg.height;
                        gImg.onerror = gImg.onload = undefined;
                        if(gImg.frameCount > animation.length) {
                            animation.length = animation.maxLength = gImg.frameCount;
                        }
                        API.extractGifFrames(gImg,gImg.src.split("/").pop(), callback);
                        gImg = undefined;
                        busy.end(busyId);
                    };
                    gImg.onerror = ()=>{
                        if(gImg && dir < directories.length){
                            gImg.src = directories[dir++] + name;
                            busy.text = "Searching";
                        }else{
                            log.warn("Could not load " + name);
                            gImg && (gImg.onerror = gImg.onload = undefined);
                            if(callback) { callback({status : "failed" }) }
                            busy.end(busyId);
                        }
                    }
                    return;
				} else if(desc.toLowerCase().indexOf(".wav") > 0 || desc.toLowerCase().indexOf(".ogg") > 0 || desc.toLowerCase().indexOf(".mp3") > 0) {
					Audio.start();
					const file = desc;
					const src = APP_ROOT_DIR + "Downloads/" + desc;
					Audio.loadSound(src, (buffer) => {
						var can = createCanvas(16, 128);
						can.guid = getGUID();
						desc = can.desc = {src, fname: file};
						can.w = can.width;
						can.h = can.height;
						can.marked = true;
						can.ctx = can.getContext("2d");
						can.ctx.imageSmoothingEnabled = false;
						can.ctx.buffer_Id = 0;
						createSoundExtras(can);
						desc.onLoaded(buffer);
						items.push(can);
						API.updateLoadActions(can);
						if(callback) { callback(can) }
						mediaList.add(can);
						addLoadedMedia(desc.src);
						API.fireEvent("oncreated",{media: can});
						busy.end(busyId);
					}, (error) => {
						log.warn("Failed to load: '" + file + "'");
						log.warn("Error: '" + (error?.mesage ?? error ?? "Unknown") + "'");
						busy.end(busyId);
					});
					return;
				} else if(desc.toLowerCase().indexOf(".mpg") > 0 ||desc.toLowerCase().indexOf(".mp4") > 0 || desc.toLowerCase().indexOf(".webm") > 0  ) {
                    img = document.createElement('video'),
                    img.guid = getGUID();
                    img.crossOrigin = "use-credentials";//Anonymous";
                    img.src = desc;
                    name = img.src.split("/").pop();
                    desc = img.desc = {
                        name,
                        fname: img.src,
                        dir : 0,
                        status : "loading",
                        video : true,
                        toString() { return this.name + " At: " + img.currentTime.toFixed(2) + " Duration: "+ img.duration.toFixed(2) + "sec VID " + img.w + "by"  + img.h   },
                    }
                    img.onprogress = (event) => { busy.text = ((event.loaded / event.total) | 0) + "%" }
                    img.onloadstart = ()=> { busy.text = "Loading" }
                    img.oncanplaythrough = ()=>{
                        storage.addFileHistory(img.src);
						directortySearch.found(desc.dir - 1);
                        busy.text = "Loaded"
                        if (!img.src.includes(APP_ROOT_DIR)) {
                            img.tainted = true;
                        }
                        img.w = img.width = img.videoWidth;
                        img.h = img.height = img.videoHeight;
                        img.oncanplay = img.oncanplaythrough = img.onprogress = img.onloadStart = img.onerror = img.onload = undefined;
                        img.volume = 0;
                        img.loop = false;
                        img.marked = true;
                        if( isNaN(img.duration) || img.duration === 0 || img.duration === Infinity) {
                            log.warn("Video does not contain REQUIERED duration information.");
                            log.error("Many features will fail to work with this video loaded.");
                            log.error("Best to restart and use an alternative video source.");
					    } else if( img.duration * 60 > settings.maxAnimationLength)  {
                            log.warn("Video is too long!!! " + (img.duration * 60) + "min long")
                            log.error("Many features will fail to work with this video loaded.");
                            log.error("Best to restart and use an alternative video source.");                            
                        } else {
                            animation.maxLength = img.duration * 60;
                        }
                        items.push(img);
                        createVideoExtras(img);
                        desc.status = "OK";
                        if(callback) { callback(img) }
                        mediaList.add(img);
                        addLoadedMedia(img.src);
						img.seekTo(0);
                        img.holdFrame(true);
                        busy.end(busyId);
                    }
                    img.onerror = (e)=>{
                        if(desc.dir < directories.length){
                            img.src = directories[desc.dir++] + img.desc.name;
                            busy.text = "Searching";
                        }else{
                            log.warn("Could not load " + desc.name);
                            img.onerror = img.onload = undefined;
                            desc.status = "failed";
                            if(callback) { callback() }
                            busy.end(busyId);
                        }
                    }
                    return;
                } else { img = new Image() }
                img.guid = getGUID();
                const sameDomain = !((desc.includes("http://") || desc.includes("https://")) && !desc.toLowerCase().includes(APP_ROOT_DIR));
                //sameDomain || (img.crossOrigin = "Anonymous");
                img.src = desc;
                name = img.src.split("/").pop();
                desc = img.desc = {
                    name,
                    dir : 0,
                    sameDomain,
                    status : "loading",
                    toString() { return this.name + " IMG " + img.w + "by"  + img.h },
                }
                img.onload = ()=>{
                    storage.addFileHistory(img.src);
                    directortySearch.found(desc.dir - 1);
                    img.desc.scrName = img.src;
                    if (!img.src.toLowerCase().includes(APP_ROOT_DIR)) {
                        if (isImageTainted(img)) {
                            img.tainted = true;
                            img.helpString = () => "This image is tainted. Tained images will block many of painters features if displayed";
                            desc.toString = () => "TAINTED!!!..... " + desc.name;
                            log("image load is tainted!! ");
                        } else {
                            log("Image loaded for outside domain is not tainted!! ");
                        }
                    } else {
                        log("image load is same domain: " + desc.sameDomain);
                    }
                    img.desc.fname = desc.name;
                    img.desc.name = desc.name.replace(/\.(png|jpg|jpeg|webp|svg)$/gi,"").split("/").pop();
                    if(/\.svg/i.test(img.desc.fname)) {
                        img.w = img.width;
                        img.h = img.height;
                    } else {
                        img.w = img.naturalWidth;
                        img.h = img.naturalHeight;
                    }
                    img.onerror = img.onload = undefined;
                    img.marked = true;
                    items.push(img);
                    API.updateLoadActions(img);
                    desc.status = "OK";
                    if(callback) { callback(img) }
                    mediaList.add(img);
                    addLoadedMedia(img.src);
                    if(/zoomRip/i.test(img.src)){
                        var timeStamp = img.src.split(/zoomRip_/i)[1].split(/[^0-9]/)[0];
                        var ms = Number(timeStamp) * (timeStamp.length === 11 ? 100 : 1000);
                        const time = new Date(ms);
                        log.sys("Ripped image date " + time.toLocaleString('en-AU'));
                    }
                    busy.end(busyId);
                }
                img.onerror = (e)=>{
                    if(desc.dir < directories.length && desc.sameDomain) {
                        img.src = directories[desc.dir++] + img.desc.name;
                        busy.text = "Searching";
                    }else{
                        log.warn("Could not load " + desc.name);
                        img.onerror = img.onload = undefined;
                        desc.status = "failed";
                        if(callback) { callback() }
                        busy.end(busyId);
                    }
                }
            } else if(desc.type === "dataURL") {
                const img = new Image();
                img.src = desc.image.dataURL;
                const name = desc.image.name;
                const fname = desc.image.fname;
                const uid = desc.image.id;
                desc = {};
                img.addEventListener("error",() => {
                    log.warn("Could not load " + desc.name);
                    desc.status = "failed";
                    if(callback) { callback() }
                });
                img.addEventListener("load",() => {
                    var can = createCanvas(img.width,img.height);
                    can.guid = uid ?? getGUID();
                    can.desc = desc;
                    can.w = can.width;
                    can.h = can.height;
                    desc.name =  name;
                    desc.fname =  fname;
                    desc.status = "OK";
                    desc.dirty = true;
                    can.marked = true;
                    can.ctx = can.getContext("2d");
                    can.ctx.buffer_Id = 0;
                    can.ctx.drawImage(img,0,0);
                    if(!desc.simple) {
                        createDrawableExtras(can);
                        createImageUtils(can);
                        createImageMirror(can);
                        !desc.private && items.push(can);
                        callback && callback(can);
                        !desc.private && mediaList.add(can);
                    } else {
                        callback && callback(can);
                    }
                    API.updateLoadActions(can);
                    API.fireEvent("oncreated",{media : can});
                },{once:true});
            } else if(desc.type === "vector") {
                const vector = {};
                vector.guid = getGUID();
                vector.desc = desc;
                desc.vector = true;
                vector.w = vector.width = desc.width !== undefined ? desc.width | 0 : 256;
                vector.h = vector.height = desc.height !== undefined ? desc.height | 0 : 256;
                desc.name =  desc.name !== undefined ? desc.name : "vector#" + getGUID();
                desc.fname = desc.name;
                desc.status = "OK";
                desc.dirty = true;
                vector.marked = true;
                createImageUtils(vector);
                items.push(vector);
                vector.redraw();
                if (callback) { callback(vector) }
                mediaList.add(vector);
                API.fireEvent("oncreated",{media : vector});
            }else if(desc.type === "video"){
                const vid = document.createElement("video");
                vid.guid = getGUID();
                vid.desc = desc;
                vid.w = vid.width = desc.width !== undefined ? desc.width | 0 : 256;
                vid.h = vid.height = desc.height !== undefined ? desc.height | 0 : 256;
                desc.name =  desc.name !== undefined ? desc.name : "vid" + getGUID();
                desc.fname = desc.name;
                desc.video = true;
                desc.toString = function() { return "Vid " + (isNaN(vid.duration) ? "Cap playback" : vid.duration + "sec VID ") + vid.w + "by"  + vid.h   };
                vid.volume = 0;
                vid.loop = true;
                vid.marked = true;
                items.push(vid);
                createVideoExtras(vid);
                desc.status = "OK";
                desc.dirty = true;
                if (!desc.private) { items.push(vid) }
                if (callback) { callback(vid) }
                if (!desc.private) { mediaList.add(vid) }
                API.fireEvent("oncreated",{media : vid});
            }else if(desc.type === "restoreLost"){
                var can = createCanvas(
                    desc.width !== undefined ? desc.width | 0 : 256,
                    desc.height !== undefined ? desc.height | 0 : 256
                );
                can.guid = desc.guid;
                can.desc = desc.of;
                can.w = can.width;
                can.h = can.height;
                desc.status = "OK";
                desc.dirty = true;
                can.marked = true;
                can.ctx = can.getContext("2d");
                can.ctx.imageSmoothingEnabled = false;
                createDrawableExtras(can);
                createImageUtils(can);
                createImageMirror(can);
                if (callback) { callback(can) }
                mediaList.replace(can);
                API.replaceMediaByGUID(can);
                API.fireEvent("oncontextrestored",{media : can});
            }else if(desc.type === "canvas" || desc.type ===  "offScreenCanvas"){
                var can = createCanvas(
                    desc.width !== undefined ? desc.width | 0 : 256,
                    desc.height !== undefined ? desc.height | 0 : 256
                );
                can.guid = getGUID();
                can.desc = desc;
                can.w = can.width;
                can.h = can.height;
                desc.name =  desc.name !== undefined ? desc.name : "canvas" + getGUID();
                desc.status = "OK";
                desc.dirty = true;
                can.marked = true;
                can.ctx = can.getContext("2d");
                can.ctx.imageSmoothingEnabled = false;
                can.ctx.buffer_Id = 0;
                if(desc.copyImg){
                    can.ctx.drawImage(desc.copyImg,0,0);
                    desc.copyImg = undefined;
                }
				if(!desc.simple) {
					createDrawableExtras(can);
					createImageUtils(can);
					createImageMirror(can);
					!desc.private && items.push(can);
					callback && callback(can);
					!desc.private && mediaList.add(can);
				} else {
					callback && callback(can);
				}
                API.fireEvent("oncreated",{media : can});
                if(desc.isGif) {
                    desc.dirty = false;
                }
            }else if(desc.type === "copy"){
                const copyOf = desc.of;
				if (copyOf.desc.isSound) {
					var can = createCanvas(copyOf.w , copyOf.h );
					can.w = copyOf.w;
					can.h = copyOf.h;
					const desc = can.desc = {src: copyOf.src, name: copyOf.name};
					can.guid = getGUID();
					desc.name = desc.name !== undefined ? desc.name : copyOf.desc.name.replace(/[0-9]*$/,"" + can.guid);
					can.ctx = can.getContext("2d");
					can.ctx.imageSmoothingEnabled = false;
					can.ctx.buffer_Id = 0;
					createSoundExtras(can);
					desc.onLoaded(Audio.copyBuffer(copyOf.desc.sBuffer));
					items.push(can);
					API.updateLoadActions(can);
					if(callback) { callback(can) }
					mediaList.add(can);
					addLoadedMedia(desc.src);
					API.fireEvent("oncreated",{media: can});
					return;
				} else {
					const subSprite = desc.subSprite;
					let newName;
					if (subSprite) {
						var can = createCanvas(subSprite.w , subSprite.h );
						can.w = subSprite.w;
						can.h = subSprite.h;
						newName = desc.name !== undefined ? desc.name : copyOf.desc.name.replace(/[0-9]*$/,"_Sub" + subSprite.id + "_" + getGUID());
					} else {
						var can = createCanvas(copyOf.w , copyOf.h );
						can.w = copyOf.w;
						can.h = copyOf.h;
						newName = desc.name !== undefined ? desc.name : copyOf.desc.name.replace(/[0-9]*$/,"" + getGUID());
					}
					desc.of = undefined;
					desc.subSprite = undefined;
					can.guid = getGUID();
					can.desc = desc;
					desc.fname = desc.name;
					desc.name =  newName;
					desc.status = "OK";
					desc.dirty = true;
					can.marked = true;
					can.ctx = can.getContext("2d");
					can.ctx.buffer_Id = 0;
					can.ctx.imageSmoothingEnabled = false;
					createDrawableExtras(can);
					createImageUtils(can);
					can.clear(false); // Not needed but trying to fix slow renders for canvas that has not been touched by render
					if (!desc.copySizeOnly) {
						if(copyOf.isGif){
							if (subSprite) {
								log.warn("Incomplete feature. GIF sub sprite may be incorrect");
								const spr = subSprite;
								can.ctx.drawImage(copyOf.image, spr.x, spr.y, spr.w, spr.h, 0, 0, spr.w, spr.h);
							} else {
								can.ctx.drawImage(copyOf.image,0,0);
							}
						} else {
							if (subSprite) {
								const spr = subSprite;
								can.ctx.drawImage(copyOf, spr.x, spr.y, spr.w, spr.h, 0, 0, spr.w, spr.h);
							} else {
								can.ctx.drawImage(copyOf, 0, 0);
							}
						}
					}
					createImageMirror(can);
					items.push(can);
					if (callback) { callback(can) }
					mediaList.add(can);
					API.fireEvent("oncreated",{media : can});
				}
            }
        },
        createImage(width, height, name, callback) {
            setTimeout(()=>media.create({width, height, name, type : "canvas" }, callback), 1);
        },
        createTempImage(width, height) { return createCanvas(width, height); },  /* callee must dereference image when no longer needed */
        contextLost() {
            for(const media of items) {
                if(media.restoreLostContext) { media.restoreLostContext() }
            }
            log.info("Restored lost context");
        }
    };
    Object.assign(API, Events(API));
    return API;
})();


const Audio = (() => {
	var dynamicCompressor = settings.dynamicCompressor;
    settingsHandler.onchange = function getSettings(){
		var update = false;
		if (dynamicCompressor !== settings.dynamicCompressor) {
			dynamicCompressor = settings.dynamicCompressor;
			update = true;
		}
		update && setupAudioState();
    }
	var atx, compressor, gain;
	function setupAudioState() {
		if (atx) {
			gain.disconnect();
			compressor.disconnect();
			if (settings.dynamicCompressor) {
				gain.connect(compressor).connect(atx.destination);
			} else {
				gain.connect(atx.destination);
			}
		}
	}
	async function loadSampleBuffer(atx, url) {
		return await atx.decodeAudioData(await (await fetch(url)).arrayBuffer())
	}
	function volBuffer(sprite) {
        const sound = sprite.sound;
        const vol = Math.min(2.0, Math.abs((sprite.h * sprite.sy) / sprite.image.h));
        if (sound.volume !== vol) {
            sound.volume = vol;
            if (sprite.image.desc.playing) {
                sound.gain.gain.value = vol;
            }
        }
    }

    
	function playBuffer(sprite, rate = 1, from = 0,start = 0, end = desc.sBuffer.duration) {
		const sound = sprite.sound;
		const desc = sprite.image.desc;
		const buf = desc.sBuffer;
		sound.sample?.stop?.();
		const sample = sound.sample = atx.createBufferSource();
		const bufferGain = sound.gain = atx.createGain();
		sample.buffer = buf;
		sound.loop = sample.loop = false;//from !== 0;
		//sound.loop = sample.loop = true;//from !== 0;
		//sound.loopStart = sample.loopStart = start;
		//sound.loopEnd = sample.loopEnd = end;
		sound.rate = rate;
		const scaledRate = sample.playbackRate.value = sound.rate * sound.rateScale;
        sound.volume = Math.min(2.0, Math.abs((sprite.h * sprite.sy) / sprite.image.h));
        
        
		bufferGain.gain.value = sound.volume;

		sample.connect(bufferGain).connect(gain);
        desc.renderPosition(sprite);
		if (sound.startOffset < 0) {
			sample.start(sound.startTime = atx.currentTime - sound.startOffset / sound.rateScale, from);
			sound.startTime -= from;
		} else {
			sample.start(sound.startTime = atx.currentTime, (from + sound.startOffset));
			sound.startTime -= (from + sound.startOffset) / scaledRate;
		}
		desc.playing = true;
		desc.status = "Playing";
        

    
		sample.onended = () => {
			sound.gain = undefined;
			sound.sample = undefined;
			desc.playing = false;
			desc.status = "Stopped";
		};
	}
	function drawPCM(can) {
		const h = can.h;
		const w = can.w;
		const data = can.desc.sBuffer.getChannelData(0);
		const time = can.desc.sBuffer.duration;
		const len = data.length;
		const vBuf = can.desc.vBuf = new Array(w);
		var x = 0, xx;
		var i = 0, smin = 0, smax = 0, sMinSum, sMaxSum, c;
		const ctx = can.ctx;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = "#FFF";
		while (i < len) {
			sMinSum = sMaxSum = 0;
			smin = data[i];
			smax = data[i];
			c = 0;
			xx = (i / len) * w | 0;
			x = xx;
			while (x === xx && i < len) {
				const s = data[i++];
				smin = Math.min(smin, s);
				smax = Math.max(smax, s);
				sMinSum += s < 0 ? s : 0;
				sMaxSum += s > 0 ? s : 0;
				c ++;
				xx = (i / len) * w | 0;
			}
			vBuf[x * 2] = Math.max(Math.abs(smin), Math.abs(smax));
			vBuf[x * 2 + 1] = (Math.abs(sMinSum) + Math.abs(sMaxSum)) * 0.5 / c;
			smin = (1 - (smin * 0.5 + 0.5)) * h;
			smax = (1 - (smax * 0.5 + 0.5)) * h;
			ctx.fillRect(x + 0.2, smin  , 0.6, smax - smin);
			smin = (1 - ((sMinSum / c) * 0.5 + 0.5)) * h;
			smax = (1 - ((sMaxSum / c) * 0.5 + 0.5)) * h;
			ctx.fillRect(x, smin  , 1, smax - smin);
		}
	}
	const API = {
		start() {
			if (!atx) {
				atx = new AudioContext();
				if (dynamicCompressor) {
					compressor = atx.createDynamicsCompressor();
					gain = atx.createGain();
					setupAudioState();
				}
			}
		},
		loadSound(url, ready, failed) {
			loadSampleBuffer(atx, url)
				.then(ready)
				.catch(failed);
		},
		copyBuffer(buffer) {
			API.start();
			const copy = atx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
			var data, channels = buffer.numberOfChannels, i = 0;
			while (i < channels) { copy.copyToChannel(buffer.getChannelData(i), i++) }
			return buffer;
		},
		draw: drawPCM,
		play: playBuffer,
        vol: volBuffer,
		stop(spr) {
			const sound = spr.sound;
			const desc = spr.image.desc;
			sound.sample?.stop?.();
			sound.sample = undefined;
			sound.gain = undefined;        
			desc.playing = false;
			desc.status = "Stopped";
		},
		getTime() { return atx?.currentTime },
	};
	return API;
})();