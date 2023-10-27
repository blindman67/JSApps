"use strict";
const cutBuffer = (()=> {
    const buffer = media.createCanvas(16,16);
    const ctx = buffer.getContext("2d");
    const pos = utils.point;
    const size = utils.size;
    const originalPos1 = utils.point;
    const originalPos2 = utils.point;

    var isAnimated = false;
    var pattern;
    const imgSeq = {
        buffers : new Map(),
        bufferIds : [],
        firstFrame: -1,
        currentGuid: -1,
        fromImage: null,
        sprite: null,
        frameOffset: 0,
        clear(){
            imgSeq.sprite = undefined;
            imgSeq.fromImage = undefined;
            imgSeq.buffers.clear();
            isAnimated = false;
            imgSeq.bufferIds.length = 0;
            imgSeq.firstFrame = -1;
            imgSeq.frameOffset = 0;
            imgSeq.currentGuid = 0;
        },
        transformSquare(...matrix) {
            const m = matrix;
            for(const buf of imgSeq.buffers.values()) {
                buf.ctx.globalCompositeOperation = "copy";
                buf.ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); //could have used setTransform(...m) but currently this is slow
                buf.ctx.drawImage(buf,0,0);
                buf.ctx.globalCompositeOperation = "source-over";
                buf.ctx.setTransform(1,0,0,1,0,0);
            }
            imgSeq.getBuffer(true);
        },
        transform(...matrix) {
            const m = matrix;
            ctx.setTransform(1,0,0,1,0,0);
            ctx.globalCompositeOperation = "copy";
            for(const buf of imgSeq.buffers.values()) {
                ctx.drawImage(buf, 0,0);
                buf.width = buffer.height;
                buf.height = buffer.width;
                buf.ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); //could have used setTransform(...m) but currently this is slow
                buf.ctx.drawImage(buffer,0,0);
                buf.ctx.globalCompositeOperation = "source-over";
                buf.ctx.setTransform(1,0,0,1,0,0);
            }
            ctx.globalCompositeOperation = "source-over";
            ctx.setTransform(1,0,0,1,0,0);
            [buffer.width, buffer.height] = [buffer.height, buffer.width];
            imgSeq.getBuffer(true);


        },
        fromSprite(spr, pos, size) {
            if(size.w > 0 && size.h > 0) {
                if(spr.type.animated && spr.animation.tracks.image && !spr.type.subSprite) {
                    imgSeq.sprite = spr;
                    imgSeq.buffers.clear();
                    imgSeq.bufferIds.length = 0;
                    imgSeq.firstFrame = -1;
                    imgSeq.frameOffset = 0;
                    imgSeq.currentGuid = 0;
                    var t = 0;
                    while(t <= animation.length) {
                        imgSeq.bufferIds.push(0);
                        t++;
                    }
                    buffer.width = size.w;
                    buffer.height = size.h;
                    ctx.setTransform(1,0,0,1,0,0);
                    var keyTime, prevKeyTime = 0, prevId = 0;
                    spr.animation.tracks.image.eachKey(key => {
                        if(!imgSeq.buffers.has(key.value.guid)) {
                            const buf = new OffscreenCanvas(buffer.width, buffer.height);
                            buf.ctx = buf.getContext("2d");
                            buf.ctx.drawImage(key.value, -pos.x, -pos.y)
                            imgSeq.buffers.set(key.value.guid, buf);
                        }
                        if(imgSeq.firstFrame === -1) {
                            imgSeq.firstFrame = key.time;
                        }
                        while(prevKeyTime < key.time) {
                            imgSeq.bufferIds[prevKeyTime ++] = prevId;
                        }
                        prevId = key.value.guid;
                        imgSeq.bufferIds[key.time] = prevId;
                    });
                    while(prevKeyTime <= animation.length) {
                        imgSeq.bufferIds[prevKeyTime ++] = prevId;
                    }
                }
                imgSeq.getBuffer(true);


            } else {
                throw new Error("Cutting buffer of size 0 should not be happening");
            }
        },
        getBuffer(force = false, atTime = animation.time ) {
            var time = (atTime + imgSeq.frameOffset) - imgSeq.firstFrame;
            var len = imgSeq.bufferIds.length - imgSeq.firstFrame;
            time = (((time % len) + len) % len) + imgSeq.firstFrame;
            if (imgSeq.sprite && (force || imgSeq.currentGuid !== imgSeq.bufferIds[time])) {
                if(imgSeq.buffers.has(imgSeq.bufferIds[time])) {
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.globalCompositeOperation = "copy";
                    ctx.drawImage(imgSeq.buffers.get(imgSeq.bufferIds[time]),0,0);
                    imgSeq.currentGuid = imgSeq.bufferIds[time];
                }
                isAnimated = true;
            }
        }
    };
    function getBuffer(image) {
        if(size.w > 0 && size.h > 0) {
            buffer.w = buffer.width = size.w;
            buffer.h = buffer.height = size.h;
            ctx.drawImage(image, -pos.x, -pos.y);
            isAnimated = false;
        } else {
            throw new Error("Cutting buffer of size 0 should not be happening");
        }
    }
    function selectionSize(image, left, top, right, bottom, pos, size, op1, op2) {
        op1.as(left, top);
        op2.as(right, bottom);
        if (left < 0) { left = 0 }
        if (top < 0) { top = 0 }
        if (bottom < 0) { bottom = 0 }
        if (right < 0) { right = 0 }
        if (left > image.w) { left = image.w }
        if (top > image.h) { top = image.h }
        if (bottom > image.h) { bottom = image.h }
        if (right > image.w) { right = image.w }
        pos.as(Math.min(left, right), Math.min(top, bottom));
        size.as(Math.max(left, right) - Math.min(left, right), Math.max(top, bottom) - Math.min(top, bottom));

    }
    const API = {
        buffer,
        hasContent : false,
        get isAnimated() { return isAnimated },
        get hasPattern() { return pattern !== undefined },
        get pattern() { return pattern },
        clearPattern() { pattern = undefined },
        clear(){
            pattern = undefined;
            if(API.hasContent){
                API.hasContent = false;
                imgSeq.clear();
                issueCommand(commands.mediaCutBufferUpdate);
            }
            buffer.width = 16;
            buffer.height = 16;
        },
        setSelection(selBox){
            selBox.top = pos.y;
            selBox.left = pos.x;
            selBox.bottom = pos.y + size.h;
            selBox.right = pos.x + size.w;
            selBox.offsetX = 0;
            selBox.offsetY = 0;
        },
        setOriginalPos(left, top, right, bottom) {
            originalPos1.as(left, top);
            originalPos2.as(right, bottom);
        },
        copyDirectToMedia(image, left, top, right, bottom, mask) {
            return new Promise((created, failed) => {
                const pos = utils.point;
                const size = utils.size;
                const originalPos1 = utils.point;
                const originalPos2 = utils.point;
                selectionSize(image, left, top, right, bottom, pos, size, originalPos1, originalPos2);
                if(size.h === 0 || size.w === 0){ failed("Selection has zero area")  }
                else{
                    media.create({ width : size.w, height : size.h, type : "canvas" , name : NAMES.register("cutBuffer")},
                        canvas => {
                            canvas.ctx.drawImage(image,-pos.x,-pos.y);
                            canvas.update();
                            created(canvas);
                        }
                    )
                }
            });
        },
        copyToMedia(){
            if(isAnimated) {
                for(const buf of imgSeq.buffers.values()) {
                    media.create({ width : size.w, height : size.h, type : "canvas" , name : NAMES.register("cutBufferAnim")},
                        canvas => { canvas.ctx.drawImage(buf, 0, 0); canvas.update() }
                    )
                }
            } else {
                return new Promise((created) => {
                    media.create({ width : size.w, height : size.h, type : "canvas" , name : NAMES.register("cutBuffer")},
                        canvas => { canvas.ctx.drawImage(buffer, 0, 0); canvas.update(); created(canvas) }
                    );
                })
            }
        },
        patternToMedia(){
            if(isAnimated) {
                log.warn("Animated pattern currently not supported");
            } else if (API.hasPattern) {
                media.create({ width : pattern.w, height : pattern.h, type : "canvas" , name : NAMES.register("patternBuffer")},
                    canvas => {
                        canvas.ctx.fillStyle = pattern;
                        canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
                        canvas.update()
                    }
                )
            }
        },
        createPattern() {
            if (isAnimated) {
                log.warn("Animated cut buffer to pattern currently not supported");

            } else {
                pattern = ctx.createPattern(buffer, "repeat");
                pattern.w = size.w;
                pattern.h = size.h;
                pattern.isPattern = true;
            }
        },
        directToPattern(image, left, top, right, bottom, mask) {
            const pos = utils.point;
            const size = utils.size;
            const originalPos1 = utils.point;
            const originalPos2 = utils.point;
            selectionSize(image, left, top, right, bottom, pos, size, originalPos1, originalPos2);
            if(size.h === 0 || size.w === 0){ return  }
            else{
                const can = $("canvas", {width : size.w, height : size.h});
                const ctx = can.getContext("2d");
                ctx.drawImage(image,-pos.x,-pos.y);
                pattern = ctx.createPattern(can, "repeat");
                pattern.w = size.w;
                pattern.h = size.h;
                pattern.isPattern = true;
            }
        },
        tile() {
            if (isAnimated) {
                log.warn("Tile is not supported for Animated cut buffers");

            } else {
                if (size.w > 2048 || size.h > 2048) {
                    log.warn("Tile command will exceedmMax cut buffer size of 4096px")
                } else {
                    const pattern = ctx.createPattern(buffer, "repeat");
                    buffer.w = buffer.width = (size.w *= 2);
                    buffer.h = buffer.height = (size.h *= 2);
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, size.w, size.h);
                    ctx.fillStyle = "#000";
                    return true;
                }
            }

        },
        transform(how){
            if(isAnimated) {
                if(how === "mirror hor"){
                    imgSeq.transformSquare(-1, 0, 0, 1, size.w, 0);
                }else if(how === "mirror ver"){
                    imgSeq.transformSquare(1,0,0,-1,0,size.h);
                } else if(how === "rotate ccw" || how === "rotate cw") {
                    if(size.h === size.w){
                        if (how === "rotate ccw") { imgSeq.transformSquare(0,-1,1,0,0,size.w) }
                        else { imgSeq.transformSquare(0,1,-1,0,size.h,0) }
                    } else {
                        if (how === "rotate ccw") { imgSeq.transform(0,-1,1,0,0,size.w) }
                        else { imgSeq.transformSquare(0,1,-1,0,size.h,0) }
                        const x = pos.x + size.w / 2;
                        const y = pos.y + size.h / 2;
                        [size.h, size.w] = [size.w, size.h];
                        pos.x = Math.round(x - size.w / 2);
                        pos.y = Math.round(y - size.h / 2);
                    }
                }
            } else {
                cuttingTools.getTopLeftCoord(pos);
                ctx.globalCompositeOperation = "copy";
                if(how === "mirror hor"){
                    ctx.setTransform(-1,0,0,1,size.w,0);
                    ctx.drawImage(buffer,0,0);
                }else if(how === "mirror ver"){
                    ctx.setTransform(1,0,0,-1,0,size.h);
                    ctx.drawImage(buffer,0,0);
                }else if(how === "rotate cw" || how === "rotate ccw"){
                    if(size.h !== size.w){
                        const x = pos.x + size.w / 2;
                        const y = pos.y + size.h / 2;
                        const tempCanvas = localProcessImage.borrowWorkingCanvas();
                        tempCanvas.width = size.w;
                        tempCanvas.height = size.h;
                        tempCanvas.ctx.drawImage(buffer,0,0);
                        buffer.width = size.h;
                        buffer.height = size.w;
                        ctx.globalCompositeOperation = "copy";
                        if (how === "rotate ccw") { ctx.setTransform(0,-1,1,0,0,size.w) }
                        else { ctx.setTransform(0,1,-1,0,size.h,0) }
                        ctx.drawImage(tempCanvas,0,0);
                        tempCanvas.width = 16;
                        tempCanvas.height = 16;
                        localProcessImage.returnWorkingCanvas(tempCanvas);
                        [size.h, size.w] = [size.w, size.h];
                        pos.x = Math.round(x - size.w / 2);
                        pos.y = Math.round(y - size.h / 2);
                    }else{
                        if (how === "rotate ccw"){ctx.setTransform(0,-1,1,0,0,size.w)}
                        else{ctx.setTransform(0,1,-1,0,size.w,0)}
                        ctx.drawImage(buffer,0,0);
                    }
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.globalCompositeOperation = "source-over";
                }
            }
        },
        fromMedia(image){
            originalPos1.as(0,0);
            originalPos2.as(image.w, image.h);
            API.copy(image,0,0,image.w, image.h);
        },
        updateAnimated(time){
            imgSeq.getBuffer(false,time);
        },
        stepFrame(frameOffset) {
            if(isAnimated) {
                imgSeq.frameOffset += frameOffset;
                imgSeq.getBuffer(true);
            }
        },
        copyAnim(spr, image, left, top, right, bottom, mask){
            selectionSize(image, left, top, right, bottom, pos, size, originalPos1, originalPos2);
            if(size.h === 0 || size.w === 0){ API.clear() }
            else{
                imgSeq.clear();
                imgSeq.fromSprite(spr, pos, size);
                imgSeq.getBuffer();
                if(mask){
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.drawImage(mask,pos.x, pos.y, size.w, size.h, 0, 0, size.w, size.h);
                    ctx.globalCompositeOperation = "source-over";
                }
                if(!API.hasContent){
                    API.hasContent = true;
                    issueCommand(commands.mediaCutBufferUpdate);
                }
            }
        },
        copy(image, left, top, right, bottom, mask) {
            selectionSize(image, left, top, right, bottom, pos, size, originalPos1, originalPos2);
            if (size.h === 0 || size.w === 0) {  API.clear() }
            else {
                imgSeq.clear();
                getBuffer(image);
                if (mask) {
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.drawImage(mask, pos.x, pos.y, size.w, size.h, 0, 0, size.w, size.h);
                    ctx.globalCompositeOperation = "source-over";
                }
                if (!API.hasContent) {
                    API.hasContent = true;
                    issueCommand(commands.mediaCutBufferUpdate);
                }
            }
        },
        cut(image, left, top, right, bottom, mask) {
            API.copy(image, left, top, right, bottom, mask);
            if (API.hasContent) {
                if (mask) {
                    image.ctx.save();
                    image.ctx.globalAlpha = 1;
                    image.ctx.filter = "none";
                    image.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    image.ctx.globalCompositeOperation = "destination-out";
                    image.ctx.drawImage(mask, pos.x, pos.y, size.w, size.h, pos.x, pos.y, size.w, size.h);
                    image.ctx.restore();
                } else {
                    image.ctx.clearRect(pos.x, pos.y, size.w, size.h);
                }
                image.update();
            }
        },
        fromClipboard(cb) {
            /*navigator.clipboard.read().then(content => {
                for (const item of content) {
                    if (item.types.includes("image/png")) { 
                        item.getType('image/png').then(blob => {
                            const img = new Image;
                            img.addEventListener("load", () => {
                                img.w = img.width;
                                img.h = img.height;
                                selectionSize(img, 0, 0, img.width, img.height, pos, size, originalPos1, originalPos2);
                                imgSeq.clear();
                                getBuffer(img);
                                API.hasContent = true;
                                cb && cb(size);
                                issueCommand(commands.paintCutBufferUpdate);                                
                                issueCommand(commands.mediaCutBufferUpdate);                                
                            }, {once: true});
                            img.src = URL.createObjectURL(blob);
                        });
                    }
                }
            }).catch(() => log.warn("There was a problem accessing the clipboard."));    */        
        },
        toClipboard() {
            if (API.hasContent) {
                buffer.toBlob((blob) => {
                    const data = [new ClipboardItem({ [blob.type]: blob })];
                    navigator.clipboard.write(data).then(
                        () => {  },
                        () => { log.warn("Could not copy cutbuffer to clipboard"); },
                    );
                });
            }          
        },
    };
    return API;
})()
const cuttingTools = (()=>{
    const id = UID ++;
    var sprite;
    var active = false;
    var holdingMask = false;
    var magicStack = [];
    var mask;
    var workCanvas;
    var clip = {
        extent: null,  // NOT OWNED BY THIS SCOPE
        sprite: null,
        world : {
            p1 : utils.point,
            p2 : utils.point,
            p3 : utils.point,
            p4 : utils.point,
        },
    }
    const workPoint = utils.point;
    const dragPos = utils.point;
    const savedSize = {w: 0, h: 0, x: 0, y: 0};
    const selBox = {
        offsetX : 0,
        offsetW : 0,
        offsetH : 0,
        offsetY : 0,
        guideX: null,
        guideY: null,
        top : 10,
        left : 10,
        bottom : 130,
        right :120,
        cursor : "",
        normalise() {
            const sb = selBox;
            sb.top += sb.offsetY;
            sb.bottom += sb.offsetY + sb.offsetH;
            sb.left += sb.offsetX;
            sb.right += sb.offsetX + sb.offsetW;
            sb.offsetY = 0;
            sb.offsetX = 0;
            sb.offsetH = 0;
            sb.offsetW = 0;
            if(sb.top > sb.bottom){ [sb.top, sb.bottom] = [sb.bottom, sb.top] }
            if(sb.left > sb.right){ [sb.left, sb.right] = [sb.right, sb.left] }
        },
        zeroOffset(){
            const sb = selBox;
            sb.offsetY = 0;
            sb.offsetX = 0;
            sb.offsetH = 0;
            sb.offsetW = 0;
        },
        world : {
            p1 : utils.point,
            p2 : utils.point,
            p3 : utils.point,
            p4 : utils.point,
        },
        toWorld() {
            const k = sprite.key;
            const sb = selBox;
            const w = sb.world;
            k.toWorldPoint(sb.offsetX + sb.left, sb.offsetY + sb.top, w.p1);
            k.toWorldPoint(sb.offsetX + sb.right + sb.offsetW, sb.offsetY + sb.top, w.p2);
            k.toWorldPoint(sb.offsetX + sb.right + sb.offsetW, sb.offsetY + sb.bottom + sb.offsetH, w.p3);
            k.toWorldPoint(sb.offsetX + sb.left, sb.offsetY + sb.bottom + sb.offsetH, w.p4);
        },
        calculateOffsets(){
            const sb = selBox;
            if(API.cursor === "move"){
                sb.offsetX = Math.round(sprite.key.lx) - dragPos.x;
                sb.offsetY = Math.round(sprite.key.ly) - dragPos.y;
            } else if(API.cursor.indexOf("resize") > -1){
                var offx = Math.round(sprite.key.lx) - dragPos.x;
                var offy = Math.round(sprite.key.ly) - dragPos.y;
                if(API.cursor[7] === "W" || API.cursor[8] === "W") {
                    sb.offsetX = offx;
                    sb.offsetW = -offx;
                } else if (API.cursor[7] === "E" || API.cursor[8] === "E") { sb.offsetW = offx }
                if(API.cursor[7] === "N") {
                    sb.offsetY = offy;
                    sb.offsetH = -offy;
                }else if (API.cursor[7] === "S") { sb.offsetH = offy }
            }
        },
        scale(sX, sY) {
            const sb = selBox;
            var w = Math.round((sb.right - sb.left) * sX);
            var h = Math.round((sb.bottom - sb.top) * sY);
            if (w < 1 || h < 1) {
                if (sX === sY) { return  }
                w = w < 1 ? 1 : w;
                h = h < 1 ? 1 : h;
            }
            const cx = (sb.right + sb.left) * 0.5;
            const cy = (sb.bottom + sb.top) * 0.5;
            sb.left = Math.round(cx - w  * 0.5);
            sb.top = Math.round(cy - h  * 0.5);
            sb.right = sb.left  + w;
            sb.bottom = sb.top  + h;
        },
        getSize(res = savedSize) {
            res.w = selBox.right - selBox.left;
            res.h = selBox.bottom - selBox.top;
            res.x = (selBox.right + selBox.left) / 2;
            res.y = (selBox.bottom + selBox.top) / 2;
            return res
        },
        setSizeOnly(w, h) {
            selBox.left = 0;
            selBox.top = 0;
            selBox.right = w;
            selBox.bottom = h;
        },
        setSize(size) {
            const sb = selBox;
            const w  = size.w < 1 ? 1 : size.w;
            const h  = size.h < 1 ? 1 : size.h;
            sb.left = Math.round(size.x - w  * 0.5);
            sb.top = Math.round(size.y - h  * 0.5);
            sb.right = sb.left  + w;
            sb.bottom = sb.top  + h;

        },
        resize(sX, sY) {
            const sb = selBox;
            sX = Math.round(sX);
            sY = Math.round(sY);
            var l = sb.left - sX;
            var r = sb.right + sX;
            var t = sb.top - sY;
            var b = sb.bottom + sY;
            if (l < r) {
                sb.left = l;
                sb.right = r;
            }
            if (t < b) {
                sb.top = t;
                sb.bottom = b;
            }
            return true;
        },
    };
    function drawClipArea(ctx, common) {
        view.apply();
        const k = clip.sprite.key;
        const c = clip;
        const w = c.world;
        const e = c.extent;
        k.toWorldPoint(e.x, e.y, w.p1);
        k.toWorldPoint(e.x + e.w, e.y, w.p2);
        k.toWorldPoint(e.x + e.w, e.y + e.h, w.p3);
        k.toWorldPoint(e.x, e.y + e.h, w.p4);

        const dO = ((globalTime / 500 | 0) % 2)  * common.dash[0];
        const dO1 = (dO + common.dash[0])  % (common.dash[0] * 2);

        ctx.lineWidth = 1;
        ctx.strokeStyle = "white";
        ctx.beginPath();

        ctx.lineTo(w.p1.x, w.p1.y);
        ctx.lineTo(w.p2.x, w.p2.y);
        ctx.lineTo(w.p3.x, w.p3.y);
        ctx.lineTo(w.p4.x, w.p4.y);
        ctx.closePath();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.setLineDash(common.dash);

        ctx.lineDashOffset = dO;
        ctx.stroke();
        ctx.lineDashOffset = dO1;
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.setLineDash(common.emptyDash);
    }
    function drawSelectionBox(ctx, common) {
        if(holdingMask){
            //return;
        }
        view.apply();
        selBox.toWorld();
        const w = selBox.world;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        var renderLines = true;
        if (paint.gridGuides) {
            const useG = guides.useOnly;
            var gx, gy;
            if (guides.guides.length > 1) {
                gx = guides.guides[0];
                gy = guides.guides[1];
            }
            if (gx && gy) {
                const wd = ((w.p1.x - w.p2.x) ** 2 +  (w.p1.y - w.p2.y) ** 2) ** 0.5;
                const hd = ((w.p2.x - w.p3.x) ** 2 +  (w.p2.y - w.p3.y) ** 2) ** 0.5;
                const xax = Math.cos(gx.grid.angle);
                const xay = Math.sin(gx.grid.angle);
                const yax = Math.cos(gy.grid.angle);
                const yay = Math.sin(gy.grid.angle);
                ctx.lineTo(w.p1.x, w.p1.y);
                ctx.lineTo(w.p1.x + wd * xax, w.p1.y + wd * xay);
                ctx.lineTo(w.p1.x + wd * xax + hd * yax, w.p1.y + wd * xay + hd * yay);
                ctx.lineTo(w.p1.x + hd * yax, w.p1.y + hd * yay);
                renderLines = false;

            }
        }
        if (renderLines) {
            ctx.lineTo(w.p1.x, w.p1.y);
            ctx.lineTo(w.p2.x, w.p2.y);
            ctx.lineTo(w.p3.x, w.p3.y);
            ctx.lineTo(w.p4.x, w.p4.y);
        }
        ctx.closePath();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.setLineDash(common.dash);
        ctx.lineDashOffset = API.isHoldingBuffer ? common.dashOffset : (Math.sin(globalTime / 100) * 2 + 2) * common.dash[0];
        ctx.stroke();
        ctx.lineDashOffset = API.isHoldingBuffer ? (common.dashOffset + common.dash[0]) % (common.dash[0]*2 ) : (Math.sin(globalTime / 100) * 2 + 2) * common.dash[0]+ common.dash[0];
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.setLineDash(common.emptyDash);

        ctx.fillStyle="white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.5;
        ctx.font = "12px arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const mid = ctx.canvas.width / 2 | 0;
        const xx = Math.round(selBox.left + selBox.offsetX);
        const yy = Math.round(selBox.top + selBox.offsetY);
        const ww = Math.round(selBox.right + selBox.offsetX + selBox.offsetW) - xx;
        const hh = Math.round(selBox.bottom + selBox.offsetY + selBox.offsetH) - yy;

        ctx.globalAlpha = 1;
        const text = "X: " + (xx | 0) + " Y: " + (yy | 0) + " W: " + (ww | 0) + " H: " + (hh | 0);

        ctx.strokeText(text, mid, 12.25);
        ctx.fillText(text, mid, 12);
        if (paint.logCoords) {
            log.clipboardLine("{x: " + (xx | 0) + ", y: " + (yy | 0) + ", w: " + (ww | 0) + ", h: " + (hh | 0) + "},");
            paint.logCoords = false;
        }
    }
    const API = {
        id,
        cursor : "select",
        cursorAngle : 0,
        isHoldingBuffer : false,
        active : false,
        draggingSelection : false,
        isClipArea: false,
        dragging: false,
        hasDragged: true,
        defined : false,
        animated: false,
        get sprite() { return sprite },
        set sprite(spr){
            if (spr) {
                sprite = spr;
                API.cursorAngle = spr.rx;
            } else { API.active = false }
        },
        getTopLeftCoord(point){
            point.as(selBox.left, selBox.top);
            return point;
        },
        stop() {
            API.isHoldingMask = false;
            API.sprite = undefined;
            API.defined = false;
            API.isHoldingBuffer = false;
            magicStack.length = 0;
        },
        release() {
            API.isHoldingMask = false;
            API.isHoldingBuffer = false;
            magicStack.length = 0;
        },
        constrainSelection() {
            const img = sprite.image;
            const sb = selBox;
            sb.normalise();
            sb.left   = Math.max(sb.left, 0);
            sb.top    = Math.max(sb.top, 0);
            sb.bottom = Math.max(sb.bottom, 0);
            sb.right  = Math.max(sb.right, 0);
            sb.left   = Math.min(sb.left, img.w);
            sb.top    = Math.min(sb.top, img.h);
            sb.bottom = Math.min(sb.bottom, img.h);
            sb.right  = Math.min(sb.right, img.w);
            sb.normalise();
        },
        async selectionToMedia() {
            if (API.active) {
                return await cutBuffer.copyDirectToMedia(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom, workCanvas);
            }
        },
        async directToMedia() {
            if(API.active && API.defined){
                return await cutBuffer.copyDirectToMedia(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom, workCanvas);
            }
        },
        directToPattern() {
            if(API.active && API.defined){
                cutBuffer.directToPattern(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom, workCanvas);
            }
        },
        toCutBuffer(cut){
            if (API.active && API.defined) {
                if (holdingMask) {
                    if (cut) {
                        cutBuffer.cut(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom, workCanvas);
                        sprite.image.processed = true;
                        sprite.image.update();
                        sprite.image.restore();
                    } else {
                        if (animation.playing && sprite.type.animated && sprite.animation.tracks.image) {
                            API.animated = true;
                            cutBuffer.copyAnim(sprite, sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom, workCanvas);
                        } else {
                            API.animated = false;
                            cutBuffer.copy(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom, workCanvas);
                        }
                    }
                    API.isHoldingMask = false;
                } else {
                    if (cut) {
                        cutBuffer.cut(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom);
                        sprite.image.processed = true;
                        sprite.image.update();
                        sprite.image.restore();
                    } else {
                        if (animation.playing && sprite.type.animated && sprite.animation.tracks.image) {
                            API.animated = true;
                            cutBuffer.copyAnim(sprite, sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom);
                        } else {
                            API.animated = false;
                            cutBuffer.copy(sprite.image, selBox.left, selBox.top, selBox.right, selBox.bottom);
                        }
                    }
                }
            }
        },
        setFromCutBuffer(){
            if (cutBuffer.hasContent) {
                API.isHoldingMask = false;
                API.selectionType = "default";
                API.active = true;
                API.isHoldingBuffer = true;
                magicStack.length = 0;
                cutBuffer.setSelection(selBox);
                API.defined = true;
            }
        },
        selectAll(){
            API.isHoldingMask = false;
            API.selectionType = "default";
            selBox.top = 0;
            selBox.left = 0;
            selBox.bottom = sprite.h;
            selBox.right = sprite.w;
            API.isHoldingBuffer = false;
            magicStack.length = 0;
            API.draggingSelection = false;
            API.defined = true;
            selBox.normalise();
            API.hasDragged = true;
        },
        setStartBox(x,y){
            selBox.top = Math.round(sprite.key.ly);
            selBox.left = Math.round(sprite.key.lx);
            selBox.bottom = Math.round(sprite.key.ly);
            selBox.right = Math.round(sprite.key.lx);
            API.defined = true;
            API.draggingSelection = true;
            API.isHoldingBuffer = false;
            API.hasDragged = true;
        },
        updateMagicStack() {
            if (magicStack.length > 0) {
                var area;
                API.isHoldingBuffer = false;
                API.defined = true;
                API.draggingSelection = false;
                API.isHoldingMask = false;
                for (const mSel of magicStack) {
                    if (mSel.type === "select") {
                        area = localProcessImage.floodFillSelectArea(sprite.image, mSel.x, mSel.y, paint.brushMin | 0, paint.diagonalCut, "select",  paint.antiAlias);
                    }else{
                        area = localProcessImage.floodFillSelectArea(sprite.image, mSel.x, mSel.y, paint.brushMin | 0, paint.diagonalCut, mSel.type, paint.antiAlias);
                    }
                }
                API.isHoldingMask = true;
                selBox.left = area.left;
                selBox.top = area.top;
                selBox.right = area.right + 1;
                selBox.bottom = area.bottom + 1;
                selBox.zeroOffset();
                selBox.normalise();
                mask = area.imgData;
                workCanvas = localProcessImage.borrowWorkingCanvas();
                workCanvas.ctx.putImageData(area.imgData,0,0);
                workCanvas.buffer = workCanvas.ctx;
                workCanvas.buffer.width = workCanvas.width;
                workCanvas.buffer.height = workCanvas.height;
                API.hasDragged = true;
            }
        },
        setStartMagic(){
            if(!API.dragging){
                var area;
                sprite.key.lx = (sprite.key.lx + 4096 | 0) - 4096;
                sprite.key.ly = (sprite.key.ly + 4096 | 0) - 4096;
                if(sprite.key.lx < 0 || sprite.key.ly < 0 || sprite.key.lx >= sprite.image.width || sprite.key.ly >= sprite.image.height){
                    return;
                }
                API.isHoldingBuffer = false;
                API.defined = true;
                API.draggingSelection = false;
                if(holdingMask && (mouse.alt || mouse.shift)){
                    API.isHoldingMask = false;
                    area = localProcessImage.floodFillSelectArea(sprite.image, sprite.key.lx, sprite.key.ly, paint.brushMin | 0, paint.diagonalCut, mouse.alt ? "or" : "remove", paint.antiAlias);
                    magicStack.push({x: sprite.key.lx, y: sprite.key.ly, type: mouse.alt ? "or" : "remove"});
                    API.isHoldingMask = true;
                }else{
                    API.isHoldingMask = false;
                    area = localProcessImage.floodFillSelectArea(sprite.image, sprite.key.lx, sprite.key.ly, paint.brushMin | 0, paint.diagonalCut, "select",  paint.antiAlias);
                    magicStack.length = 0;
                    magicStack.push({x: sprite.key.lx, y: sprite.key.ly, type: "select"});
                    API.isHoldingMask = true;
                }
                selBox.left = area.left;
                selBox.top = area.top;
                selBox.right = area.right + 1;
                selBox.bottom = area.bottom + 1;
                selBox.zeroOffset();
                selBox.normalise();
                mask = area.imgData;
                workCanvas = localProcessImage.borrowWorkingCanvas();
                workCanvas.ctx.putImageData(area.imgData,0,0);
                workCanvas.buffer = workCanvas.ctx;
                workCanvas.buffer.width = workCanvas.width;
                workCanvas.buffer.height = workCanvas.height;
            }
            API.dragging = false;
            API.hasDragged = true;
        },
        setEnd(x,y){
            selBox.bottom = Math.round(sprite.key.ly);
            selBox.right = Math.round(sprite.key.lx);
            API.hasDragged = true;           
        },
        moveSelection(dx, dy) {
            dx = Math.round(dx);
            dy = Math.round(dy);
            selBox.top += dy;
            selBox.left += dx;
            selBox.bottom += dy;
            selBox.right += dx;
            selBox.normalise();
            cutBuffer.setOriginalPos(selBox.left, selBox.top, selBox.right, selBox.bottom);
            API.hasDragged = true;
        },
        endDragSelection(){
            API.draggingSelection = false;
            API.defined = true;
            selBox.normalise();
            API.hasDragged = true;
        },
        dragStart(){
            if(!API.dragging){
                dragPos.x = Math.round(sprite.key.lx);
                dragPos.y = Math.round(sprite.key.ly);
                API.dragging = true;
                API.hasDragged = true;
            }
        },
        dragEnd(){
            if(API.dragging){
                selBox.calculateOffsets();
                selBox.normalise();
            }
            API.dragging = false;
            API.hasDragged = true;
        },
        drag(){
            if (API.dragging) {
                selBox.calculateOffsets();
                API.hasDragged = true;
            }
        },
        resize(method, amount, axisX = true, axisY = true) {
            if (method === "scale") {
                selBox.scale(axisX ? amount : 1, axisY ? amount : 1);
                selBox.normalise();
            } else if(method === "resize") {
                selBox.resize(axisX ? amount : 1, axisY ? amount : 1);
                selBox.normalise();
            }
        },
        tile() {
            if (cutBuffer.tile()) {
                selBox.scale(2,2);
                selBox.normalise();
            }
        },
        zeroOffset() { selBox.zeroOffset() },
        saveSize() { return {...selBox.getSize()}; },
        restoreSize(size = savedSize) {
            if (API.dragging) { selBox.zeroOffset() }
            selBox.setSize(size);
            selBox.normalise();
        },
        asClip(extent) {
            if (extent) {
                API.isClipArea = true;
                extent.add(selBox.left, selBox.top);
                extent.add(selBox.right, selBox.bottom);
                clip.sprite = sprite;
                clip.extent = extent;
                clip.defined = true;
                return extent;
            }
            API.isClipArea = false;
            clip.defined = false;
            clip.sprite = undefined;
            clip.extent = undefined;
        },
        set isHoldingMask(value){
            if(holdingMask && workCanvas){
                workCanvas.buffer = undefined;
                localProcessImage.returnWorkingCanvas(workCanvas);
                workCanvas = undefined;
                mask = undefined;
            }
            holdingMask = value;
        },
        get isHoldingMask() { return holdingMask },
        set selectionType(value) { API.setStart = value === "magic" ? API.setStartMagic : API.setStartBox },
        cutBufferFromClipboard() {
            if (CanDo.clipboard) {
                /*cutBuffer.fromClipboard((size) => {
                    selBox.setSize(size.w, size.h);
                    API.active = true;
                    API.defined = false;                   
                });*/
            }
        },
        cutBufferToClipboard() {
            if (CanDo.clipboard) {
                cutBuffer.toClipboard();
            }
        },
        updateCursor(){
            if(API.defined === false){ return }
            API.cursor = "select";
            const x = sprite.key.lx;
            const y = sprite.key.ly;
            var wScale = view.scale;
            const sx = Math.abs(sprite.sx);
            const sy = Math.abs(sprite.sy);
            var distLeft = ((x - selBox.left) * sx) * wScale;
            var distRight = ((selBox.right - x) * sx) * wScale;
            var distW = ((selBox.right - selBox.left) * sx) * wScale
            var distTop = ((y - selBox.top) * sy) * wScale;
            var distBottom = ((selBox.bottom - y) * sy) * wScale;
            var distH = ((selBox.bottom - selBox.top) * sy) * wScale;
            var insideW = 10;
            var insideH = 10;
            var outsideW = -10;
            var outsideH = -10;
            if(distH < 5){
                insideH = -2;
                outsideH = -15
            }else if(distH < 20){
                insideH = 2;
                outsideH = -15
            }
            if(distW <5){
                insideW = -2;
                outsideW = -15
            }else if(distW < 20){
                insideW = 2;
                outsideW = -15
            }
            if(holdingMask){
                const xx = (x + 4096 | 0) - 4096;
                const yy = (y + 4096 | 0) - 4096;
                const idx = (xx + yy * mask.width) * 4;
                const overMask = mask.data[idx+3] > 0;
                if(overMask && !mouse.shift  && !mouse.alt) {// && distLeft > insideW && distRight > insideW && distTop > insideH && distBottom > insideH){
                    API.cursor = "move";
                } else {

                    if(mouse.shift){
                        API.cursor = "select_sub";
                    }else {
                        API.cursor = "select_add";
                    }
                }
            }else{


                if(distLeft > insideW && distRight > insideW && distTop > insideH && distBottom > insideH){
                    API.cursor = "move";
                }else if(distLeft > outsideW && distRight > outsideW && distTop > outsideH && distBottom > outsideH){
                    if(distLeft <= insideW){
                        if( distTop <= insideH){
                            API.cursor = "resize_NW"
                            API.cursorAngle = (sprite.rx + sprite.rx) / 2;
                        }else if(distBottom <= insideH){
                            API.cursor = "resize_SW"
                            API.cursorAngle = (sprite.rx + sprite.rx) / 2;
                        }else {
                            API.cursor = "resize_W";
                            API.cursorAngle = sprite.rx;
                        }
                    }else if(distRight <= insideW){
                        if(distTop <= insideH){
                            API.cursor = "resize_NE"
                            API.cursorAngle = (sprite.rx + sprite.rx) / 2;
                        }else if(distBottom <= insideH){
                            API.cursor = "resize_SE"
                            API.cursorAngle = (sprite.rx + sprite.rx) / 2;
                        }else {
                            API.cursor = "resize_E";
                            API.cursorAngle = sprite.rx;
                        }
                    }else if(distTop <= insideH){
                        API.cursor = "resize_N";
                        API.cursorAngle = sprite.rx;
                    }else if(distBottom <= insideH){
                        API.cursor = "resize_S";
                        API.cursorAngle = sprite.rx;
                    }
                }
            }
        },
        update(ctx){
            if (API.active) {
                var cursor = "select"
                if(API.defined){
                    extraRenders.addOneTime(drawSelectionBox);
                    cursor = API.cursor;
                }
                mouse.requestCursor(id, cursor, API.cursorAngle);;
            }
            if (clip.defined) {
                extraRenders.addOneTime(drawClipArea);

            }
        },
        drawBuffer(spr, ctx, time){
            if (API.active && (API.isHoldingBuffer || holdingMask)) {
                if (API.animated) { cutBuffer.updateAnimated(time) }
                const cBuff = holdingMask ? workCanvas : cutBuffer;
                const sb = selBox;
                const x = Math.round(sb.left + sb.offsetX);
                const y = Math.round(sb.top + sb.offsetY);
                const w = Math.round(sb.right + sb.offsetX + sb.offsetW) - x;
                const h = Math.round(sb.bottom + sb.offsetY + sb.offsetH) - y;
                ctx.imageSmoothingEnabled = paint.antiAlias;
                if (holdingMask) {
                    const GCO = ctx.globalCompositeOperation;
                    const GA = ctx.globalAlpha;
                    const fade = Math.sin(globalTime / 100);
                    if (fade < 0) { ctx.globalCompositeOperation = "screen" }
                    else { ctx.globalCompositeOperation = "multiply" }
                    ctx.globalAlpha = Math.abs(fade);
                    if (spr.guid === sprite.guid) {
                        ctx.drawImage(cBuff, x, y, w, h, x, y, w, h);
                    } else {
                        const topLeft = sb.world.p1;
                        sprite.key.toWorldPoint(sb.offsetX + sb.left, sb.offsetY + sb.top, topLeft);
                        spr.key.toLocalP(0, 0, workPoint);
                        const im = spr.key.im;
                        const m = sprite.key.m;
                        ctx.setTransform(im[0], im[1], im[2], im[3], workPoint.x, workPoint.y);
                        ctx.transform(m[0], m[1], m[2], m[3], topLeft.x, topLeft.y);
                        ctx.drawImage(cBuff, 0, 0, cBuff.width, cBuff.height, 0, 0, w, h);
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }
                    ctx.globalCompositeOperation = GCO;
                    ctx.globalAlpha = GA;
                } else {
                    if (spr.guid === sprite.guid) {
                        ctx.drawImage(cBuff.buffer, 0, 0, cBuff.buffer.width, cBuff.buffer.height, x, y, w, h);
                    } else {
                        const topLeft = sb.world.p1;
                        sprite.key.toWorldPoint(sb.offsetX + sb.left, sb.offsetY + sb.top, topLeft);
                        spr.key.toLocalP(0, 0, workPoint);
                        const im = spr.key.im;
                        const m = sprite.key.m;
                        ctx.setTransform(im[0], im[1], im[2], im[3], workPoint.x, workPoint.y);
                        ctx.transform(m[0], m[1], m[2], m[3], topLeft.x, topLeft.y);
                        ctx.drawImage(cBuff.buffer, 0, 0, cBuff.buffer.width, cBuff.buffer.height, 0, 0, w, h);
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }
                }
                spr.image.processed = true;
            }
        }
    };
    API.selectionType = "default";
    return API;
})();