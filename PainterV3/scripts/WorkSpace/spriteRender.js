"use strict";
const spriteRender = (()=>{
    const id = UID ++;
    // alias for ctx = c, view = v, view.matrix = m and view.invMatrix = im;
    var c,v,m,im, iScale = 1;
    var renderHeap = [];
    var highlightStack = [];
    highlightStack.size = 0;
    var gHighlightOccilator = 0;
	var currentAudioTime;
    /* TODO matrix stack needs more work
       Not working for more than one step into a group (eg groups => child => child) Could be iScale
    */
    var matrixStack = [];
    matrixStack.size = 0;
    matrixStack.current = 0;
    matrixStack.prev = [];
    matrixStack.first = function(m) {
        matrixStack[0] = m;
        matrixStack.size = 1;
        matrixStack.current = 0;
        matrixStack.prev.length = 0;
    }
    matrixStack.back = function() { matrixStack.current = matrixStack.prev.pop() }
    matrixStack.add = function(m) {
        var ms;
        if (matrixStack.length < matrixStack.size) {
            ms = matrixStack[matrixStack.size];
            ms[0] = m[0];
            ms[1] = m[1];
            ms[2] = m[2];
            ms[3] = m[3];
            ms[4] = m[4];
            ms[5] = m[5];
        } else { matrixStack[matrixStack.size] = [...m] }
        matrixStack.prev.push(matrixStack.current);
        matrixStack.current = matrixStack.size;
        matrixStack.size ++;
    }
    var inOpenGroup = false;
    var inGroup = false;
    const renderEventData = { };
    var gAlpha = 1;
    var gHideOutline = undefined;
    var gSmooth = undefined;
    var highlightColor;
    var displayFont;
    var selectedColor;
    var showColor;
    var renderUISize;
    var cutterColor;
    var onAnimationKeyColor;
    var shapeIconColor;
    var lightbox;
    var highlightAxis = false;
    const wp1 = utils.point;
    const wp2 = utils.point;
    const wp3 = utils.point;
    const wp4 = utils.point;
    var mouseDist = {
        spr : null,
        line : null,
        dist: 0,
        fromInput : false,
        reset() {
            mouseDist.prevSpr = mouseDist.spr ? mouseDist.spr.guid : - 1;
            mouseDist.prevLine = mouseDist.line;
            mouseDist.prevFromInput = mouseDist.fromInput;
            mouseDist.spr = null;
            mouseDist.dist = 10 * iScale;
        }
    }
    function getSettings(){
        highlightColor = settings.highlightColor;
        selectedColor = settings.selectedColor;
        showColor = settings.showColor;
        cutterColor = settings.cutterColor;
        onAnimationKeyColor = settings.onAnimationKeyColor;
        shapeIconColor = settings.shapeIconColor
        renderUISize = settings.Render_U_I_Size / 10;
        displayFont = "16px "  + settings.displayFont;
    }
    getSettings();
    settingsHandler.onchange=getSettings;
    const gridSpecial = {
        [1](spr, x, y, w, h) {
            c.rect(x, y, w, h);
            c.rect(x + w / 24, y + h / 24, w - w / 12, h - h / 12);
            c.rect(x + w / 6, y + h / 6, w - w / 3, h - h / 3);
        },
        [2](spr, x, y, w, h) { // bone
            if (h > w) {
                const xx = x + w / 2;
                const hh = h > 40 ? 20 : h * 0.25
                c.moveTo(xx - w * 0.25, y);
                c.lineTo(xx - w * 0.1, y + hh);
                c.lineTo(xx - w * 0.1, y + h - hh);
                c.lineTo(xx - w * 0.2, y + h - hh * 0.4);
                c.lineTo(xx , y + h);
                c.lineTo(xx + w * 0.2, y + h - hh * 0.4);
                c.lineTo(xx + w * 0.1, y + h - hh);
                c.lineTo(xx + w * 0.1, y + hh);
                c.lineTo(xx + w * 0.25, y);
            } else {            
                const yy = y + h / 2;
                const ww = w > 40 ? 20 : w * 0.25
                c.moveTo(x,                yy - h * 0.25);
                c.lineTo(x + ww,           yy - h * 0.1);
                c.lineTo(x + w - ww,       yy - h * 0.1);
                c.lineTo(x + w - ww * 0.4, yy - h * 0.2);
                c.lineTo(x + w,            yy );
                c.lineTo(x + w - ww * 0.4, yy + h * 0.2);
                c.lineTo(x + w - ww,       yy + h * 0.1);
                c.lineTo(x + ww,           yy + h * 0.1);
                c.lineTo(x,                yy + h * 0.25);
            }
            c.closePath();
        },
        [3](spr, x, y, w, h) { // Hinge
            const r = Math.abs(w) * 0.5;
            x += w * 0.5;
            y += h * 0.5;
            c.moveTo(x + r, y);
            c.arc(x, y , r, 0, Math.TAU);
        },
        [4](spr, x, y, w, h) { //  IK foot
            const xx = x + w * 0.5;
            const yy = y + h * 0.5;
            c.moveTo(xx, yy - h * 0.1);
            c.lineTo(xx - w * 0.25, yy);
            c.lineTo(xx - w * 0.45, y + h );
            c.lineTo(xx + w * 0.45, y + h);
            c.lineTo(xx + w * 0.25, yy);
            c.closePath();
        },
        [5](spr, x, y, w, h) {  // IK arm look at
            const xx = x + w * 0.5;
            const yy = y + h * 0.5;
            c.moveTo(xx, yy + h * 0.1);
            c.lineTo(xx - w * 0.25, yy);
            c.lineTo(xx, y);
            c.lineTo(xx + w * 0.25, yy);
            c.closePath();
        },
        [6](spr, x, y, w, h) { //  IK start
            const xx = x + w * 0.5;
            const yy = y + h * 0.5;
            const ww = w * 0.15;
            const hh = h * 0.15;
            c.moveTo(xx, y);
            c.lineTo(xx - ww, yy - hh);
            c.lineTo(x, yy);
            c.lineTo(xx - ww, yy + hh);
            c.lineTo(xx, y + h );
            c.lineTo(xx + ww, yy + hh);
            c.lineTo(x + w, yy);
            c.lineTo(xx + ww, yy - hh);
            c.closePath();
        },
        [7](spr, x, y, w, h) { // gravity
            const wh = w * 0.5, whh = wh * 0.5;
            x += wh;
            y += h * 0.5;
            c.moveTo(x - wh,  y);
            x += wh;
            c.lineTo(x,  y);
            c.moveTo(x - 6, y - 3);
            c.lineTo(x,  y);
            c.lineTo(x - 6, y + 3);

        },
        [8](spr, x, y, w, h) { // cameraSpr
            c.rect(x,y,w,h);
            const xx = x + w;
            const yy = y + h;
            w *= 0.03;
            h *= 0.03;
            const ww = w * 9, hh = h * 9;
            c.moveTo(x + w, y + hh);
            c.lineTo(x + w, y + h);
            c.lineTo(x + ww, y + h);
            c.moveTo(xx - ww, y + h);
            c.lineTo(xx - w, y + h);
            c.lineTo(xx - w, y + hh);
            c.moveTo(xx - ww, yy - h);
            c.lineTo(xx - w, yy - h);
            c.lineTo(xx - w, yy - hh);
            c.moveTo(x + ww, yy - h);
            c.lineTo(x + w, yy - h);
            c.lineTo(x + w, yy - hh);
        },
        [9](spr, x, y, w, h) { // gradient color
            c.fillStyle = spr.rgb.getHexA(spr.a);
            c.strokeStyle = spr.selected ? c.strokeStyle : "black";
            c.arc(x + w / 2, y + h / 2, Math.abs(w) / 2, 0, Math.TAU);
            return 1;
        },
        [10](spr, x, y, w, h) { // Tracking point
            var w1 = w * 0.5, h1 = h * 0.5;
            var xx = x + w1, yy = y + h1;
            var ww = iScale * 2;
            c.fillStyle = c.strokeStyle;
            c.rect(xx-iScale, y, ww, h1 -= ww)
            c.rect(xx-iScale, yy + ww, ww, h1)
            c.rect(x, yy-=iScale, w1 -= ww, ww)
            c.rect(xx + ww, yy, w1, ww)
            return 2;
        },
        [11](spr, x, y, w, h) { // Sub sprite anchor point
            var w1 = w * 0.5, h1 = h * 0.5;
            var xx = x + w1, yy = y + h1;
            var ww = iScale * 2;
            c.fillStyle = c.strokeStyle;
            c.rect(xx-iScale, y, ww, h1 -= ww)
            c.rect(xx-iScale, yy + ww, ww, h1)
            c.rect(x, yy-=iScale, w1 -= ww, ww)
            c.rect(xx + ww, yy, w1, ww)
            return 2;
        },
        [12](spr, x, y, w, h) {
            const st = c.strokeStyle;
            const lw = c.lineWidth;
            var ww = w * 0.5;
            var hh = h * 0.5;
            c.strokeStyle = "#000";
            c.lineTo(x + ww, y);
            c.lineTo(x + ww, y + h);
            c.moveTo(x, y + hh);
            c.lineTo(x + w, y + hh);
            c.lineWidth = lw * 3;
            c.stroke();
            c.strokeStyle = st;
            c.lineWidth = lw;
            return 0;
        },
        [13](spr, x, y, w, h) {
            const st = c.strokeStyle;
            const lw = c.lineWidth;
            c.strokeStyle = "#000";
            c.lineTo(x, y);
            c.lineTo(x + w, y + h);
            c.moveTo(x + w, y);
            c.lineTo(x, y + h);
            c.lineWidth = lw * 3;
            c.stroke();
            c.strokeStyle = st;
            c.lineWidth = lw;
            return 0;
        }        
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
        trackingPoint: 10,
        subSpriteAnchor: 11,
        gameSprCenter: 12,
        gameSprMark: 13
    };
    function drawImage(img, x, y, cx, cy, sx, sy, rot, alpha){
        c.globalAlpha = alpha * gAlpha;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        var dx= Math.cos(rot);
        var dy= Math.sin(rot);
        c.transform(dx * sx, dy * sx, -dy * sy, dx * sy, x, y);
        c.drawImage(img,-cx,-cy);
    }
    function drawSpriteClean(spr){
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.globalAlpha = spr.a * gAlpha;
        if(spr.image.filterCanvas){
            c.drawImage(spr.image.filterCanvas, -spr.cx, -spr.cy);
        }else if(spr.image.desc.video) {
            if (spr.image.holdingFrame) {
                c.drawImage(spr.image.desc.frameHold, -spr.cx, -spr.cy);
            } else {
                c.drawImage(spr.image, -spr.cx, -spr.cy);
            }
        } else {
            c.drawImage(spr.image, -spr.cx, -spr.cy);
        }
    }
	function drawSubSpriteClean(spr){
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.globalAlpha = spr.a * gAlpha;
		const sw = spr.subSprite.w;
		const sh = spr.subSprite.h;
		const sx = spr.subSprite.x;
		const sy = spr.subSprite.y;
        if(spr.image.filterCanvas){
            c.drawImage(spr.image.filterCanvas, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h);
        }else if(spr.image.desc.video) {
            if (spr.image.holdingFrame) { c.drawImage(spr.image.desc.frameHold, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
            else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
        } else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
    }
    function drawSpriteStandard(spr){
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.globalAlpha = spr.a * gAlpha;
        if(spr.image.filterCanvas){
            c.drawImage(spr.image.filterCanvas, -spr.cx, -spr.cy);
        }else if(spr.image.desc.video) {
            if (spr.image.holdingFrame) {
                c.drawImage(spr.image.desc.frameHold, -spr.cx, -spr.cy);
            } else {
                c.drawImage(spr.image, -spr.cx, -spr.cy);
            }
        } else{
            c.drawImage(spr.image, -spr.cx, -spr.cy);
        }
    }
    function drawSubSpriteStandard(spr){
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.globalAlpha = spr.a * gAlpha;
		const sw = spr.subSprite.w;
		const sh = spr.subSprite.h;
		const sx = spr.subSprite.x;
		const sy = spr.subSprite.y;
        if(spr.image.filterCanvas){
            c.drawImage(spr.image.filterCanvas, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h);
        }else if(spr.image.desc.video) {
            if (spr.image.holdingFrame) { c.drawImage(spr.image.desc.frameHold, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
            else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
        } else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
    }
    function drawSpriteOverlay(spr){
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.globalAlpha = spr.a * gAlpha;
        if(spr.image.overlay){
            if(spr.image.filterCanvas){
                //c.drawImage(spr.image.filterCanvas, -spr.cx, -spr.cy);
            }else if(spr.image.desc.video) {
                if (spr.image.holdingFrame) {
                    c.drawImage(spr.image.desc.frameHold, -spr.cx, -spr.cy);
                } else {
                    c.drawImage(spr.image, -spr.cx, -spr.cy);
                }
            } else{
                c.drawImage(spr.image.desc.mirror, -spr.cx, -spr.cy);
            }
        }else{
            if(spr.image.filterCanvas){
                c.drawImage(spr.image.filterCanvas, -spr.cx, -spr.cy);
            }else if(spr.image.desc.video) {
                if (spr.image.holdingFrame) {
                    c.drawImage(spr.image.desc.frameHold, -spr.cx, -spr.cy);
                } else {
                    c.drawImage(spr.image, -spr.cx, -spr.cy);
                }
            } else{
                c.drawImage(spr.image, -spr.cx, -spr.cy);
            }
        }
    }
    function drawSubSpriteOverlay(spr){
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.globalAlpha = spr.a * gAlpha;
		const sw = spr.subSprite.w;
		const sh = spr.subSprite.h;
		const sx = spr.subSprite.x;
		const sy = spr.subSprite.y;
        if(spr.image.overlay){
            if(spr.image.filterCanvas){
                //c.drawImage(spr.image.filterCanvas, -spr.cx, -spr.cy);
            }else if(spr.image.desc.video) {
                if (spr.image.holdingFrame) { c.drawImage(spr.image.desc.frameHold, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
                else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
            } else { c.drawImage(spr.image.desc.mirror, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
        }else{
            if(spr.image.filterCanvas){ c.drawImage(spr.image.filterCanvas, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
            else if(spr.image.desc.video) {
                if (spr.image.holdingFrame) { c.drawImage(spr.image.desc.frameHold, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
                else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
            } else { c.drawImage(spr.image, sx, sy, sw, sh, -spr.cx, -spr.cy, spr.w, spr.h) }
        }
    }
    var drawSprite = drawSpriteStandard;
    var drawSubSprite = drawSubSpriteStandard;
    function drawText(spr){
        c.globalAlpha = spr.a * gAlpha;
        const mat = spr.key.m;
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        spr.textInfo.setState(c, spr);
        if (spr.type.usingPattern && (spr.patternSpr.pattern || spr.patternSpr.gradient)) {
            c.fillStyle = spr.patternSpr.pattern ? spr.patternSpr.pattern.img : spr.patternSpr.gradient.g;
        }
        if (spr.textInfo.strokeStyle) { c.strokeText(spr.textInfo.text, -spr.cx, -spr.cy + 4) }
        c.fillText(spr.textInfo.text, -spr.cx, -spr.cy + 4);
    }
    function drawPallet(spr, andMark = true){
        spr.pallet.clean();
        c.imageSmoothingEnabled = false;
        c.globalAlpha = spr.a * gAlpha;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        const cx = -spr.cx;
        const cy = -spr.cy;
        c.drawImage(spr.pallet.image,0,0,spr.pallet.image.width,spr.pallet.image.height,cx, cy, spr.w, spr.h);
        if (andMark) {
            const sx =  ((1 / (mat[0] * mat[0] + mat[1] * mat[1]) ** 0.5) * iScale) * 2;
            const sy =  ((1 / (mat[2] * mat[2] + mat[3] * mat[3]) ** 0.5) * iScale) * 2;
            c.lineWidth = 2;
            c.strokeStyle = "#FFF";
            c.beginPath();
            c.moveTo(cx + 2 * sx , cy + 5 * sy)
            c.lineTo(cx + 5 * sx , cy + 5 * sy)
            c.lineTo(cx + 5 * sx , cy + 2 * sy)
            c.lineTo(cx + 2 * sx , cy + 2 * sy)
            c.lineTo(cx + 2 * sx , cy + 8 * sy)
            c.setTransform(1,0,0,1,0,0);
            c.stroke();
            c.lineWidth = 1;
            c.strokeStyle = "#F000";
            c.stroke();
        }
        c.imageSmoothingEnabled = true;
    }
    /*function drawVector(spr){ // replaced by draw shape but there may be some batches that requier this so keeping here till sure
        c.globalAlpha = spr.a * gAlpha;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        if(spr.vector.desc.dirtyLines) { spr.vector.redraw() }
        if(spr.vector.desc.pathStr.renderAsSVG) {
            c.drawImage(spr.vector.SVG,-spr.cx,-spr.cy)
        }else{
            c.transform(1, 0, 0, 1, -spr.cx, -spr.cy);
            c.strokeStyle = c.fillStyle = spr.rgb.css;
            c.beginPath();
            for(const path of spr.vector.paths) {
                var first = true;
                for(const point of path){
                    if(first){
                        first = false;
                        c.moveTo(point[0], point[1]);
                    }else{
                        c.lineTo(point[0], point[1]);
                    }
                }
                c.closePath();
            }
            c.fill("evenodd");
        }
    }*/
    function drawShape(spr){
        c.globalAlpha = spr.a * gAlpha;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        if(!spr.shape.outline && spr.type.usingPattern) {
            if(spr.patternSpr.pattern) {
                if (spr.shape.strokeWidth) {
                    c.strokeStyle = spr.patternSpr.pattern.img;
                    c.lineWidth = spr.shape.strokeWidth < 0 ? iScale : spr.shape.strokeWidth;
                    c.beginPath();
                    spr.shape.draw(c, spr);
                    c.stroke(spr.shapePath);
                } else {
                    c.fillStyle = spr.patternSpr.pattern.img;
                    c.beginPath();
                    spr.shape.draw(c, spr);
                    c.fill(spr.shapePath, spr.shapePath.fillRule);
                }
            } else {
                if (spr.shape.strokeWidth) {
                    c.strokeStyle = spr.patternSpr.gradient.g ?? spr.rgb.css;
                    c.lineWidth = spr.shape.strokeWidth < 0 ? iScale : spr.shape.strokeWidth;
                    c.beginPath();
                    spr.shape.draw(c, spr);
                    c.stroke(spr.shapePath);
                } else {
                    c.fillStyle = spr.patternSpr.gradient.g ?? spr.rgb.css;
                    c.beginPath();
                    spr.shape.draw(c, spr);
                    c.fill(spr.shapePath, spr.shapePath.fillRule);
                }
            }
        } else {
            c.strokeStyle = c.fillStyle = spr.rgb.css;
            c.beginPath();
            spr.shape.draw(c, spr);
            if(spr.shape.outline) {
                c.lineWidth = spr.shape.lineWidth;
                c.stroke(spr.shapePath);
            }else {
                if (spr.shape.strokeWidth) {
                    c.lineWidth = spr.shape.strokeWidth < 0 ? iScale : spr.shape.strokeWidth;
                    c.stroke(spr.shapePath);
                } else {
                    c.fill(spr.shapePath, spr.shapePath.fillRule);
                }
            }
        }
    }
    function drawShapeHighlight(spr, col = "#FF0", lWidth = 1, alpha = 0.7){
        if (spr.shapePath) {
            c.globalAlpha = alpha;
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            const mat = spr.key.m;
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.strokeStyle = col;
            c.beginPath();
            c.lineWidth = lWidth * iScale;
            c.stroke(spr.shapePath);
        }
    }
    function drawBorder(spr, col, lWidth,alpha, outset = 0){
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
         c.beginPath();
        c.rect(-spr.cx - outset, -spr.cy - outset, spr.w + outset * 2, spr.h + outset * 2);
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawShapeIcon(spr, col, lWidth, alpha){
        if(spr.shape.hasIcon) {
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            const mat = spr.key.m;
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.translate(-spr.cx * spr.shape.icon.x , -spr.cy * spr.shape.icon);
            c.globalAlpha = alpha;
            c.strokeStyle = spr.shape.icon.useSprCol ? col : shapeIconColor;
            c.lineWidth = lWidth;
            c.stroke(spr.shape.icon);
        } else {
            drawCutter(spr, shapeIconColor, lWidth);
        }
    }
    function drawAtKey(spr, col, lWidth, alpha){
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.beginPath();
        const sx =  ((1 / (mat[0] * mat[0] + mat[1] * mat[1]) ** 0.5) * iScale) * 2;
        const sy =  ((1 / (mat[2] * mat[2] + mat[3] * mat[3]) ** 0.5) * iScale) * 2;
        c.rect(-spr.cx + 1 * sx , -spr.cy + 2 * sy,  8 * sx,  + 8 * sy);
        c.moveTo(-spr.cx + 2 * sx , -spr.cy + 3 * sy)
        c.lineTo(-spr.cx + 2 * sx , -spr.cy + 8 * sy)
        c.moveTo(-spr.cx + 2 * sx , -spr.cy + 7 * sy)
        c.lineTo(-spr.cx + 8 * sx , -spr.cy + 3 * sy)
        c.moveTo(-spr.cx + 3 * sx , -spr.cy + 6 * sy)
        c.lineTo(-spr.cx + 8 * sx , -spr.cy + 9 * sy)
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawCapturingIcon(spr, col, lWidth, alpha){
        if(alpha > 0.90) {
            c.globalAlpha = alpha;
            c.fillStyle = col;
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            const mat = spr.key.m;
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.fillRect(-spr.cx , -spr.cy - 4 ,  8 , 4);
            c.setTransform(1,0,0,1,0,0);
        }
    }
    function drawVideoFrameHold(spr, col, lWidth, alpha){
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
         c.beginPath();
        const sx =  ((1 / (mat[0] * mat[0] + mat[1] * mat[1]) ** 0.5) * iScale) * 2;
        const sy =  ((1 / (mat[2] * mat[2] + mat[3] * mat[3]) ** 0.5) * iScale) * 2;
        c.rect(-spr.cx + 1 * sx , -spr.cy + 2 * sy,  8 * sx,  8 * sy);
        c.moveTo(-spr.cx + 2 * sx , -spr.cy + 3 * sy)
        c.lineTo(-spr.cx + 8 * sx , -spr.cy + 6 * sy)
        c.lineTo(-spr.cx + 2 * sx , -spr.cy + 9 * sy)
        c.closePath();
        //c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawVideoCap(spr, col, lWidth, alpha){
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
         c.beginPath();
        const sx =  ((1 / (mat[0] * mat[0] + mat[1] * mat[1]) ** 0.5) * iScale) * 2;
        const sy =  ((1 / (mat[2] * mat[2] + mat[3] * mat[3]) ** 0.5) * iScale) * 2;
        if(spr.image.desc.recording) {
            c.globalAlpha = alpha < 0.75 ? 1 : 0;
            c.moveTo(-spr.cx + 2 * sx , -spr.cy + 10 * sy);
            c.lineTo(-spr.cx + 2 * sx , -spr.cy + 2 * sy);
            c.lineTo(-spr.cx + 6 * sx , -spr.cy + 2 * sy);
            c.lineTo(-spr.cx + 6 * sx , -spr.cy + 6 * sy);
            c.lineTo(-spr.cx + 2 * sx , -spr.cy + 6 * sy);
            c.lineTo(-spr.cx + 6 * sx , -spr.cy + 10 * sy);
        } else {
            c.rect(-spr.cx + 2 * sx , -spr.cy + 2 * sy,  8 * sx,  8 * sy);
            c.moveTo(-spr.cx + 14 * sx , -spr.cy + 3 * sy)
            c.lineTo(-spr.cx + 10 * sx , -spr.cy + 6 * sy)
            c.lineTo(-spr.cx + 14 * sx , -spr.cy + 9 * sy)
            c.closePath();
            if(spr.type.videoCapture) {
                if(spr.selected) {
                    c.rect(-spr.cx + 1 * sx , -spr.cy + 1 * sy,  spr.cx * 2 - 2 * sx,spr.cy * 2 - 2 * sy);
                }else {
                    c.rect(-spr.cx  , -spr.cy ,  spr.cx * 2,spr.cy * 2);
                }
            }
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawLookat(spr){
        var dx = spr.lookat.spr.x - spr.x
        var dy = spr.lookat.spr.y - spr.y
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist > 0){
            dx /= dist;
            dy /= dist;
            const is = v.invScale * renderUISize;
            dist /= is;
            c.globalAlpha = 1;
            c.strokeStyle = "blue";
            c.lineWidth = 1;
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            c.transform(dx * is, dy * is, -dy * is, dx * is, spr.x, spr.y);
            c.beginPath();
            c.moveTo(0,0);
            c.lineTo(40,0);
            c.lineTo(80, 20);
            c.moveTo(40 ,0);
            c.lineTo(80,-20 );
            c.moveTo(70 ,15);
            c.lineTo(73,0 );
            c.lineTo(70,-15 );
            c.moveTo(80 ,0);
            c.lineTo(dist ,0);
            c.lineTo(dist  - 40,10);
            c.moveTo(dist ,0);
            c.lineTo(dist -40,-10);
            c.setTransform(1,0,0,1,0,0);
            c.stroke();
        }
    }
    function drawLinked(spr){
        var dx = spr.linked.x - spr.x
        var dy = spr.linked.y - spr.y
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist > 0){
            dx /= dist;
            dy /= dist;
            const is = v.invScale * renderUISize;
            dist /= is;
            c.globalAlpha = 1;
            c.strokeStyle = "blue";
            c.lineWidth = 1;
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            c.transform(dx * is, dy * is, -dy * is, dx * is, spr.x, spr.y);
            c.beginPath();
            c.moveTo(0,0);
            c.lineTo(40,0);
            c.lineTo(80, 20);
            c.moveTo(40 ,0);
            c.lineTo(80,-20 );
            c.moveTo(70 ,15);
            c.lineTo(73,0 );
            c.lineTo(70,-15 );
            c.moveTo(80 ,0);
            c.lineTo(dist ,0);
            c.lineTo(dist  - 40,10);
            c.moveTo(dist ,0);
            c.lineTo(dist -40,-10);
            c.setTransform(1,0,0,1,0,0);
            c.stroke();
        }
    }	
    function drawAttached(spr){
        var dx = spr.attachedTo.x - spr.x
        var dy = spr.attachedTo.y - spr.y
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist > 0){
            dx /= dist;
            dy /= dist;
            const is = v.invScale * renderUISize;
            dist /= is;
            c.globalAlpha = 1;
            c.strokeStyle = "green";
            c.lineWidth = 1;
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            c.transform(dx * is, dy * is, -dy * is, dx * is, spr.x, spr.y);
            c.beginPath();
            if(spr.attachment.inheritRotate) {
                c.arc(17,0,15, Math.PI * 1.5, Math.PI * 2.5,true);
            }else{
                c.moveTo(35,-10);
                c.lineTo(2,0);
                c.lineTo(35,10);
            }
            c.moveTo(2,0);
            c.lineTo(dist -10,0);
            c.lineTo(dist +5,10);
            c.lineTo(dist +5,-10);
            c.lineTo(dist -10,0);
            c.setTransform(1,0,0,1,0,0);
            c.stroke();
        }
    }
    function drawFunctionLink(spr){
        if (spr.a > 0 || spr.selected) {
            c.globalAlpha = (spr.selected ? 1 : spr.a)  * gAlpha;
            const mat = spr.key.m;
            if (!spr.type.hideOutline || spr.selected) {
                c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
                c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
                c.strokeStyle =spr.selected ? selectedColor : spr.rgb.css;
                c.beginPath();
                const xx = -spr.cx;
                const yy = -spr.cy;
                const w = spr.w;
                const h = spr.h;
                c.rect(xx, yy, w, h);
                c.setTransform(1,0,0,1,0,0);
                c.lineWidth = 1;
                c.stroke();
            }
            c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.font = displayFont;
            c.textAlign = "left";
            c.textBaseline = "middle";
            c.fillStyle = spr.fLink.textColor;
            c.lineWidth = 2;
            if (spr.fLink.funcObj) {
                const str = spr.name + (spr.fLink.funcObj.active && sprites.functionLinksOn ? " ON" : " OFF");
                c.fillText(str, -spr.cx,0);
            } else {
				if (spr.fLink.type === "A") {
					c.save();
            c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            c.transform(1,0,0,1, mat[4], mat[5]);					
					const txt = spr.fLink.inFrom === "An" ?"@" + spr.name : "*";
					c.strokeStyle = "black";
					c.strokeText(txt, -spr.cx, 0);
					c.fillText(txt, -spr.cx, 0);
					
					c.restore();
										
				} else {
                    if (Array.isArray(spr.fLink.value )) {
                        let i = 0;
                        let vStr = "";
                        let jStr = "";
                        while (i < spr.fLink.value.length) {
                            vStr +=  jStr + (isNaN(spr.fLink.value[i]) ? ""  : spr.fLink.value[i].toFixed(3))
                            jStr = ", ";
                            i++;
                        }
                        if (spr.selected) {
                            c.strokeStyle = "black";
                            let str = spr.fLink.type + "(" + spr.fLink.inName[0] + ")=[" + vStr + "]";
                            if(spr.fLink.outputs.length) { str += "=>" + spr.fLink.outName[0] }
                            c.strokeText(str, -spr.cx,0);
                            c.fillText(str, -spr.cx,0);
                        } else {
                            const str = spr.name + (spr.name[spr.name.length-1] === "#" ? "[" + vStr + "]" : "");
                            c.fillText(str,  -spr.cx,0);
                        }                        
                    } else {
                        if (isNaN(spr.fLink.value) && spr.fLink.value.text && spr.fLink.value.value !== undefined) {
                            if (spr.selected) {
                                c.strokeStyle = "black";
                                let str = (spr.name[spr.name.length-1] === "#" ? ("output." + spr.fLink.value.text + " = " + spr.fLink.value.value?.toFixed(3) ): spr.name);
                                c.strokeText(str, -spr.cx,0);
                                c.fillText(str, -spr.cx,0);
                            } else {
                                const str = (spr.name[spr.name.length-1] === "#" ? ("output." + spr.fLink.value.text + " = " + spr.fLink.value.value?.toFixed(3)) : spr.name );
                                c.fillText(str,  -spr.cx,0);
                            }
                            
                        } else {
                            const val = isNaN(spr.fLink.value) ? "" : spr.fLink.value.toFixed(3);
                            if (spr.selected) {
                                c.strokeStyle = "black";
                                let str = spr.fLink.type + "(" + spr.fLink.inName[0] + ")=" + val;
                                if(spr.fLink.outputs.length) { str += "=>" + spr.fLink.outName[0] }
                                c.strokeText(str, -spr.cx,0);
                                c.fillText(str, -spr.cx,0);
                            } else {
                                const str = spr.name + (spr.name[spr.name.length-1] === "#" ? "[" + val + "]" : "");
                                c.fillText(str,  -spr.cx,0);
                            }
                        }
                    }
				}
            }
        }
    }
    function drawLocators(spr){
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        const mat = spr.key.m;
        const is = v.invScale * renderUISize;
        c.transform(mat[0] * is, mat[1] * is, mat[2] * is, mat[3] * is, mat[4], mat[5]);
        c.globalAlpha = 1;
        c.strokeStyle = "cyan";
        c.lineWidth = 1;
        const s1 = 20, s2 = 10;
        c.beginPath();
        const scaleX = spr.locators.scaleX;
        const scaleY = spr.locators.scaleY;
        var p1;
        for (const l of spr.locators) {
            const p = l.pos;
            wp1.x = p.x / is;
            wp1.y = p.y / is;
            if(p1 === undefined) {
                c.rect(wp1.x - s2, wp1.y - s2, s1, s1);
                if (scaleX) {
                    c.moveTo(wp1.x - 50, wp1.y + 5);
                    c.lineTo(wp1.x - 60, wp1.y);
                    c.lineTo(wp1.x + 60, wp1.y);
                    c.lineTo(wp1.x + 50, wp1.y - 5);
                }
                if (scaleY) {
                    c.moveTo(wp1.x - 5, wp1.y - 50);
                    c.lineTo(wp1.x, wp1.y - 60);
                    c.lineTo(wp1.x, wp1.y + 60);
                    c.lineTo(wp1.x + 5, wp1.y + 50);
                }
                p1 = p;
                wp2.x = wp1.x;
                wp2.y = wp1.y;
            }else{
                c.rect(wp1.x - s2 / 2, wp1.y - s2 / 2, s2, s2);
                c.moveTo(wp2.x, wp2.y);
                c.lineTo(wp1.x, wp1.y);
            }
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
	function drawSoundInfo(spr) {
        
        spr.image.desc.renderPosition(spr);
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);        
        const xx = -spr.cx, yy = -spr.cy;
        const w = spr.w, h = spr.h, hw = w * 0.5;		
		var pos = 0;
		if (currentAudioTime === 0) { currentAudioTime = Audio.getTime() }
		const desc = spr.image.desc;
		const sound = spr.sound;
		if (desc.playing) {
			//pos = ((currentAudioTime  - sound.startTime)*(sound.rate * sound.rateScale) % (sound.loopEnd - sound.loopStart)) + sound.loopStart;
			//pos = ((pos / desc.duration) * w) % w;
			pos = ((currentAudioTime  - sound.startTime)*(sound.rate * sound.rateScale)) + sound.loopStart;
			pos = (pos / desc.duration) * w;
			sound.pos = pos | 0
			pos = xx + pos;
		} else {
			pos = (((animation.time / 60) * sound.rateScale + sound.startOffset) / desc.duration) * w
			sound.pos = pos | 0
			pos = xx + pos;
		}
        const isOver = pos < -hw || pos >= hw;
        c.globalAlpha = 1;
        c.strokeStyle = isOver ? "#F08" : "#0C0";
        c.lineWidth = 1;
        c.beginPath();
		c.lineTo(pos, -64);
		c.lineTo(pos, 64);
        (isOver && c.setTransform(1.2,0,0,1.2,0,0)) || c.setTransform(1,0,0,1,0,0);
        c.stroke();
	}
    function drawAxisLocks(spr){
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        const is = v.invScale * renderUISize;
        c.transform(mat[0] * is, mat[1] * is, mat[2] * is, mat[3] * is, mat[4], mat[5]);
        c.globalAlpha = 1;
        c.strokeStyle = "#D0D";
        c.lineWidth = 1;
        c.beginPath();
        if(spr.locks.locX) {
            const dist = (spr.w * spr.sx * 0.8) / is;
            c.moveTo(-dist + 10, 5);
            c.lineTo(-dist, 0);
            c.lineTo(dist, 0);
            c.lineTo(dist - 10, - 5);
        } else {
            const dist = (spr.h * spr.sy * 0.8) / is;
            c.moveTo(-5, -dist + 10);
            c.lineTo(0,  - dist);
            c.lineTo(0,  dist);
            c.lineTo( 5, dist - 10);
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawBorderAxisNear(spr, col, lWidth, alpha){
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.beginPath();
        const iScale = v.invScale
        const lDist = spr.key.lx;
        const rDist = spr.w - spr.key.lx;
        const tDist = spr.key.ly;
        const bDist = spr.h - spr.key.ly;
        const xDist = Math.abs(spr.cx - spr.key.lx);
        const yDist = Math.abs(spr.cy - spr.key.ly);
        if (xDist < yDist && xDist < lDist && xDist < rDist  && xDist < tDist && xDist < bDist) {
            c.moveTo(0,-spr.cy + spr.h + iScale * 1000);
            c.lineTo(0,-spr.cy- + iScale * 1000);
            spr.key.edge = 0b10;
        } else if (yDist < xDist && yDist < lDist && yDist < rDist  && yDist < tDist && yDist < bDist) {
            c.moveTo(-spr.cx - iScale * 1000,        0);
            c.lineTo(-spr.cx + spr.w + iScale * 1000,0);
            spr.key.edge = 0b10000;
        } else if (lDist < rDist  && lDist < tDist && lDist < bDist) {
            c.moveTo(-spr.cx,  -spr.cy + spr.h + iScale * 1000);
            c.lineTo(-spr.cx,  -spr.cy- + iScale * 1000);
            spr.key.edge = 0b1;
        } else if (rDist < lDist  && rDist < tDist && rDist < bDist) {
            c.moveTo(-spr.cx + spr.w,  -spr.cy - iScale * 1000);
            c.lineTo(-spr.cx + spr.w,  -spr.cy + spr.h + iScale * 1000);
            spr.key.edge = 0b100;
        } else if (tDist < bDist  && tDist < lDist && tDist <rDist) {
            c.moveTo(-spr.cx - iScale * 1000,        -spr.cy);
            c.lineTo(-spr.cx + spr.w + iScale * 1000,-spr.cy);
            spr.key.edge = 0b1000;
        } else  {
            c.moveTo(-spr.cx - iScale * 1000,        -spr.cy + spr.h);
            c.lineTo(-spr.cx + spr.w + iScale * 1000,-spr.cy + spr.h);
            spr.key.edge = 0b100000;
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawBorderAxis(spr, col, lWidth, alpha, xAxis, edges = 0b101){  // edges bits 3 left, bit 2 center, bit 1 right
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.beginPath();
        if(xAxis){
            if ((edges & 4) === 4) {
                c.moveTo(-spr.cx,           -spr.cy);
                c.lineTo(-spr.cx + spr.w,   -spr.cy);
            }
            if ((edges & 2) === 2) {
                c.moveTo(-spr.cx,           0);
                c.lineTo(-spr.cx + spr.w,   0);
            }
            if ((edges & 1) === 1) {
                c.moveTo(-spr.cx,           -spr.cy + spr.h);
                c.lineTo(-spr.cx + spr.w,   -spr.cy + spr.h);
            }
        }else{
            if ((edges & 4) === 4) {
                c.moveTo(-spr.cx + spr.w,   -spr.cy);
                c.lineTo(-spr.cx + spr.w,   -spr.cy + spr.h);
            }
            if ((edges & 2) === 2) {
                c.moveTo(0,   -spr.cy);
                c.lineTo(0,   -spr.cy + spr.h);
            }
            if ((edges & 1) === 1) {
                c.moveTo(-spr.cx,           -spr.cy + spr.h);
                c.lineTo(-spr.cx,           -spr.cy);
            }
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawLockedInfo(spr, col, lWidth,alpha){
        c.globalAlpha = alpha;
        c.strokeStyle = col;
        c.lineWidth = lWidth ;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        if(spr.image.lockType === media.lockTypes.pixelSet){
            c.beginPath();
            c.rect(-spr.cx, -spr.cy, spr.w, spr.h);
            c.moveTo(-spr.cx, -spr.cy);
            c.lineTo(spr.cx, spr.cy);
            c.moveTo(spr.cx, -spr.cy);
            c.lineTo(-spr.cx, spr.cy);
            c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            c.stroke();
            c.font = "32px Arial";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillStyle = "white";
            c.strokeStyle = "black";
            c.lineWidth = 3;
            var w = c.measureText("LOCKED").width;
            var scale = Math.min(spr.w * 0.8 / w, spr.h * 0.8 / 32);
            c.transform(scale,0,0,scale,spr.x,spr.y);
            c.strokeText("LOCKED", 0,0);
            c.fillText("LOCKED", 0,0);
            if(spr.image.progress !== undefined){
                c.fillStyle = "black";
                c.fillRect(-w / 2, 18, w, 10);
                c.fillStyle = "blue";
                c.fillRect(-w / 2 + 2, 20, (w -4) * spr.image.progress, 6);
            }
        } else {
            if(spr.image.progress !== undefined){
                c.fillStyle = "black";
                c.fillRect(-spr.cx + 4, -spr.cy + 4, (spr.w * 0.25 | 0), 8);
                c.fillStyle = "blue";
                c.fillRect(-spr.cx + 6, -spr.cy + 6, ((spr.w * 0.25 | 0)-4) * spr.image.progress, 4);
            }
        }
    }
    function drawMarked(spr) { // experimental displays corners and handles UI from tracking utils
        if(spr.hideCorners) { return }
        const nextCGroup = group => {
            for (const ng of group.nextg) {
                c.moveTo(group.x - spr.cx + 0.5, group.y - spr.cy + 0.5);
                c.lineTo(ng.x - spr.cx + 0.5, ng.y - spr.cy + 0.5);
                if (ng.nextg && ng.nextg.length) {
                    nextCGroup(ng);
                }
            }
        }
        const is = v.invScale;
        const mat = spr.key.m;
        var mO = false,mx,my, overP,dx,dy,minD = 20*is,d;
        const edit = (spr.selectPaths || spr.linkPoints || spr.linkPaths);
        if(edit) {
            if(spr.key.lx >= 0 && spr.key.lx <= spr.image.w && spr.key.ly >= 0 && spr.key.ly <= spr.image.h) {
                mO = true;
                mx = spr.key.lx;
                my = spr.key.ly;
            }
        }
        var i;
        const cols = ["#00F","#0F0","#F80","#F00"];
        for(i = 0; i < 4; i++) {
             c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.globalAlpha = 1;
            c.lineWidth = 2;
            c.strokeStyle = cols[i];
            c.beginPath();
            const cutTop = (1 / 4) * (i +1);
            const cutBot = cutTop - (1/4);
            for(const cr of spr.image.desc.corners){
                if(cr.v >= cutBot && cr.v < cutTop + 0.01) {
                    if (mO) {
                        dx = cr.x - mx;
                        dy = cr.y - my;
                        d = (dx * dx + dy * dy) ** 0.5;
                        if(d < minD) {
                            minD = d;
                            overP = cr;
                        }
                    }
                    if(cr.near) {
                        for(const n of cr.near) {
                            c.moveTo(cr.x - spr.cx + 0.5, cr.y - spr.cy+ 0.5);
                            c.lineTo(n.c.x - spr.cx+ 0.5, n.c.y - spr.cy+ 0.5);
                        }
                    }
                    c.rect(cr.x - spr.cx , cr.y - spr.cy, 1, 1);
                }
            }
            c.setTransform(1,0,0,1,0,0);
            c.stroke();
        }
        c.lineWidth = 1;
         c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.strokeStyle = "#0F0";
        c.beginPath();
        for(const cr of spr.image.desc.cornersStatic){
            if (mO) {
                dx = cr.x - mx;
                dy = cr.y - my;
                d = (dx * dx + dy * dy) ** 0.5;
                if(d < minD) {
                    minD = d;
                    overP = cr;
                }
            }
            c.moveTo(cr.x - spr.cx - 1, cr.y - spr.cy+ 0.5);
            c.lineTo(cr.x - spr.cx + 2 , cr.y - spr.cy+ 0.5);
            c.moveTo(cr.x - spr.cx + 0.5, cr.y - spr.cy- 1);
            c.lineTo(cr.x - spr.cx + 0.5, cr.y - spr.cy+ 2);
        }
        if(spr.image.desc.corners.converging) {
            for(const g of spr.image.desc.corners.converging) {
                c.moveTo(g.x - spr.cx + 0.5 - 2, g.y - spr.cy + 0.5 - 2);
                c.lineTo(g.x - spr.cx + 0.5 + 2, g.y - spr.cy + 0.5 + 2);
                c.moveTo(g.x - spr.cx + 0.5 - 2, g.y + 0.5 - spr.cy + 2);
                c.lineTo(g.x - spr.cx + 0.5 + 2, g.y + 0.5 - spr.cy - 2);
            }
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
        c.globalAlpha = 0.6;
         c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.strokeStyle = "#FF0";
        c.beginPath();
        for(const cr of spr.image.desc.corners){
            if(cr.next) {
                c.rect(cr.x - spr.cx + 0.25 , cr.y - spr.cy + 0.25, 0.5, 0.5);
                c.moveTo(cr.x - spr.cx + 0.5, cr.y - spr.cy+ 0.5);
                c.lineTo(cr.next.x - spr.cx+ 0.5, cr.next.y - spr.cy+ 0.5);
                var n = cr.next.next;
                while(n) {
                    c.lineTo(n.x - spr.cx+ 0.5, n.y - spr.cy+ 0.5);
                    n = n.next;
                }
            }
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
        c.lineWidth = 2;
        c.globalAlpha = 0.85;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.strokeStyle = spr.linkPaths ? "#0F0" : "#FFF";
        c.beginPath();
        if(mO) {
            mx -= spr.cx;
            my -= spr.cy;
            c.moveTo(mx, -spr.cy);
            c.lineTo(mx, spr.cy);
            c.moveTo(-spr.cx, my);
            c.lineTo(spr.cx, my);
            if(spr.linkPointFrom) {
                c.rect(spr.linkPointFrom.x - spr.cx + 0.5 - 0.5, spr.linkPointFrom.y - spr.cy + 0.5 - 0.5, 1, 1);
                c.moveTo(spr.linkPointFrom.x - spr.cx + 0.5, spr.linkPointFrom.y - spr.cy + 0.5);
                c.lineTo(mx,my);
            }
            if(overP) {
                if(spr.linkPathsFast) {
                    if(spr.linkPathLast) {
                        if(spr.linkPointTime === animation.time - 1){
                            spr.linkPathLast.next = overP;
                        }else if(spr.linkPointTime === animation.time + 1){
                            overP.next = spr.linkPathLast;
                        }
                    }
                    spr.linkPathLast = overP;
                    spr.linkPointTime = animation.time;
                }else{
                    if(mouse.button) {
                        if(spr.selectPaths) {
                            if(spr.selectedPaths === undefined) {
                                spr.selectedPaths = [];
                            }
                            const idxP = spr.selectedPaths.findIndex(p => p.path === overP);
                            if(idxP > -1) {
                                spr.selectedPaths.splice(idxP,1);
                            }else {
                                spr.selectedPaths.push({time : animation.time, path : overP});
                            }
                        }else{
                            if(spr.linkPointFrom === undefined) {
                                spr.linkPointFrom = overP;
                                spr.linkPointTime = animation.time;
                            }else {
                                if(spr.linkPoints) {
                                    if(spr.linkPointTime === animation.time && spr.linkPointFrom !== overP) {
                                        if(spr.linkPointFrom.near === undefined) {
                                            spr.linkPointFrom.near = [];
                                        }
                                        spr.linkPointFrom.near.push({c:overP});
                                        var nextA = spr.linkPointFrom.next;
                                        var nextB = overP.next;
                                        while(nextA && nextB) {
                                            if(nextA.near === undefined) { nextA.near = [] }
                                            nextA.near.push({c:nextB});
                                            nextA = nextA.next;
                                            nextB = nextB.next;
                                        }
                                    }
                                } else {
                                    if(spr.linkPointTime < animation.time) {
                                        spr.linkPointFrom.next = overP;
                                    }
                                }
                                spr.linkPointFrom = undefined;
                            }
                        }
                        mouse.button = 0;
                    }
                }
                c.rect(overP.x - spr.cx + 0.5 - 2, overP.y - spr.cy+ 0.5 - 2, 4, 4);
            }else {
                if(spr.linkPathsFast && (spr.linkPointTime !== animation.time + 1 && spr.linkPointTime !== animation.time - 1) ) {
                    spr.linkPathLast = undefined;
                }
                if (mouse.button && mouse.ctrl) {
                    const dat = spr.image.ctx.getImageData(spr.key.lx | 0, spr.key.ly | 0, 1, 1).data;
                    const v = (dat[0] * dat[0] + dat[1] * dat[1] + dat[2] * dat[2]) / (255 * 255 * 3);
                    spr.image.desc.corners.push({x : spr.key.lx, y: spr.key.ly, v, t:animation.time, e:0.5});
                    mouse.button = 0;
                }
                if(mouse.button && spr.linkPointFrom) {
                    spr.linkPointFrom = undefined;
                    mouse.button = 0;
                }
            }
        }
        if(spr.selectedPaths) {
            for(const pp of spr.selectedPaths) {
                var next = pp.path;
                c.moveTo(next.x - spr.cx + 0.5, next.y - spr.cy + 0.5);
                next = next.next;
                while(next) {
                    c.lineTo(next.x - spr.cx + 0.5, next.y - spr.cy + 0.5);
                    next = next.next;
                }
            }
        }
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    }
    function drawPattern(spr){
        const mat = spr.key.m;
        c.globalAlpha = spr.a * gAlpha;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.drawImage(spr.image, -spr.cx, -spr.cy);
    }
    function drawGradient(spr){
        const mat = spr.key.m;
        if (spr.gradient.update) { spr.updateGradient() }
        c.globalAlpha = spr.a * gAlpha;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.fillStyle = spr.gradient.g;
        c.beginPath();
        c.rect(-spr.cx, -spr.cy, spr.w, spr.h);
        c.fill();
    }
    function drawCutter(spr, col, lWidth, a = 1) {
        var iw, ih, fillSpecial;
        c.globalAlpha = spr.a  * gAlpha * a;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        const xx = -spr.cx;
        const yy = -spr.cy;
        const w = spr.w;
        const h = spr.h;
        if (spr.type.usingPattern && spr.patternSpr.pattern) {
            c.fillStyle = spr.patternSpr.pattern.img;
            c.fillRect(xx, yy, w, h);
        } else {
            c.strokeStyle =spr.selected ? selectedColor : col;
            c.lineWidth = lWidth;
            fillSpecial = 0;
            c.beginPath();
            if (spr.gridSpecial && gridSpecial[spr.gridSpecial]) {
                fillSpecial = gridSpecial[spr.gridSpecial](spr, xx, yy, w, h)
            } else {
                c.rect(xx, yy, w, h);
                const stepx = 1 / spr.gridX;
                const stepy = 1 / spr.gridY;
                iw = stepx, ih = stepy;
                while (iw < 1 && ih < 1) {
                    c.moveTo(xx + iw * w, yy);
                    c.lineTo(xx + iw * w, yy + h);
                    c.moveTo(xx, yy + ih * h);
                    c.lineTo(xx + w, yy + ih * h);
                    iw += stepx;
                    ih += stepy;
                }
                while (iw < 1) {
                    c.moveTo(xx + iw * w, yy);
                    c.lineTo(xx + iw * w, yy + h);
                    iw += stepx;
                }
                while (ih < 1) {
                    c.moveTo(xx, yy + ih * h);
                    c.lineTo(xx + w, yy + ih * h);
                    ih += stepy;
                }
            }
            c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            fillSpecial && c.fill();
            fillSpecial !== 2 && c.stroke();
        }
    }
    function drawVanish(spr) {
        c.globalAlpha = spr.a  * gAlpha;
        c.strokeStyle =spr.selected ? selectedColor :  spr.rgb.css;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.beginPath();
        const xx = -spr.cx;
        const yy = -spr.cy;
        const w = spr.w;
        const h = spr.h;
        c.rect(xx, yy, w, h);
        if (spr.grid.radial) {
           if (spr.grid.active || spr.type.snapTo) {
                const step =  1 / (spr.gridY * 4) ;
                for (var i = 0; i < 1; i += step) {
                    const ang = i * Math.TAU;
                    c.moveTo(0,0);
                    c.lineTo(Math.cos(ang) * 10000, Math.sin(ang) * 10000);
                }
            } else {
                c.moveTo(xx,-yy);
                c.lineTo(-xx,yy);
                c.moveTo(xx,yy);
                c.lineTo(-xx,-yy);
                c.moveTo(xx * 1000,0);
                c.lineTo(-xx * 1000,0);
                c.moveTo(0, yy * 1000,0);
                c.lineTo(0, -yy * 1000,0);
            }
        } else {
            if (spr.grid.active || spr.type.snapTo) {
                const step =   h / spr.gridY;
                for (var i = 0; i <= h + step / 2 ; i += step) {
                    const ang = Math.atan2(i + yy, - xx);
                    c.moveTo(0,0);
                    c.lineTo(Math.cos(ang) * 10000, Math.sin(ang) * 10000);
                }
            } else {
                c.moveTo(0,0);
                c.lineTo(-xx,yy);
                c.moveTo(0,0);
                c.lineTo(-xx,-yy);
                c.moveTo(0,0);
                c.lineTo(-xx * 1000,0);
            }
        }
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.lineWidth = iScale;
        c.stroke();
        c.font = "32px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = "white";
        c.strokeStyle = "black";
        c.lineWidth = 3;
        c.strokeText(spr.grid.type, spr.x, spr.y);
        c.fillText(spr.grid.type, spr.x, spr.y);
    }
    function drawMarker(spr, col, lWidth, alpha) {
        c.globalAlpha = spr.a * alpha  * gAlpha;
        c.strokeStyle =spr.selected ? selectedColor : col;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        c.lineWidth = lWidth;
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.beginPath();
        const xx = -spr.cx;
        const yy = -spr.cy;
        const w = spr.w;
        const h = spr.h;
        const ax = spr.axiesLen;
        c.rect(xx, yy, w, h);
        c.moveTo(xx,-yy);
        c.lineTo(-xx,yy);
        c.moveTo(xx,yy);
        c.lineTo(-xx,-yy);
        if(spr.gridX) {
            c.moveTo(ax[1],0);
            c.lineTo(-ax[3],0);
        }
        if(spr.gridY) {
            c.moveTo(0, ax[2]);
            c.lineTo(0, -ax[0]);
        }
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.stroke();
        c.font = "32px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = "white";
        c.strokeStyle = "black";
        c.lineWidth = 3;
        c.strokeText(spr.marker, spr.x, spr.y + (spr.h * 0.5) + 16);
        c.fillText(spr.marker, spr.x, spr.y + (spr.h * 0.5) + 16);
    }
    function drawGrid(spr) {
        var showExtraGrid = (spr.grid.typeBit & API.showGridAxies) ? showExtraGrid : false;
        c.globalAlpha = spr.a  * gAlpha;
        c.strokeStyle =spr.selected ? selectedColor :  spr.rgb.css;
        c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        const mat = spr.key.m;
        c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
        c.beginPath();
        const xx = -spr.cx;
        const yy = -spr.cy;
        const w = spr.w;
        const h = spr.h;
        c.moveTo(0,yy);
        c.lineTo(0,yy+h);
        c.moveTo(xx,yy);
        c.lineTo(xx + w,yy);
        c.moveTo(xx,yy + h);
        c.lineTo(xx + w,yy + h);
        if(spr.grid.active || spr.type.snapTo) {
            const step = h / spr.gridY;
            for(var i = 0; i <= h + step / 2 ; i += step){
                c.moveTo(0,i + yy);
                c.lineTo(10000, i + yy);
            }
        }else{
            c.moveTo(0,0);
            c.lineTo(-xx * 1000,0);
        }
        c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.lineWidth = iScale;
        c.stroke();
        c.font = "32px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = "white";
        c.strokeStyle = "black";
        c.lineWidth = 3;
        c.strokeText(spr.grid.type, spr.x, spr.y);
        c.fillText(spr.grid.type, spr.x, spr.y);
    }
    const drawUtils = {
        start() {
            c.beginPath();
            c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            return c;
        },
        line(x,y,xx,yy) {
            c.moveTo(x, y);
            c.lineTo(xx, yy);
        },
        stroke(width = 1, color = "#FFF") {
            c.setTransform(1,0,0,1,0,0);
            c.lineWidth = width;
            c.strokeStyle = color;
            c.stroke();
        },
    };
    const renderStack = {
        items: [],
        hasContent: false,
        push(spr, renderer, frames, args) {
            renderStack.items.push({
                spr,
                renderer: typeof renderer === "string" ? renderStack.renderers[renderer] : renderer,
                frames: frames ? frames : 1,
                args
            });
            renderStack.hasContent = true;
        },
        render() {
            if (renderStack.items.length) {
                for (const item of renderStack.items) {
                    item.frames --;
                   item.renderer(item);
                }
                var i = 0;
                while (i < renderStack.items.length) {
                    if (renderStack.items[i].frames <= 0) {
                        renderStack.items.splice(i--,1);
                    }
                    i++;
                }
            }
            if (renderStack.items.length <= 0) {
                renderStack.hasContent = false;
            }
        },
        renderers: {
            borderAxis(item) { drawBorderAxis(item.spr, ...item.args) },
            border(item) { drawBorder(item.spr,...item.args) },
            borderGrow(item) {
                if (item.grow === undefined) { item.grow = 0.5 }
                else { item.grow += item.grow }
                item.args[3] = item.grow;
                item.args[2] **= 1.2;
                drawBorder(item.spr, ...item.args);
                //spr, col, lWidth,alpha, outset = 0){
            }
        },
    }
    const API = {
        gridSpecialNames,
        utils : drawUtils,
        renderStack,
        setView(view){
            renderEventData.v = v = view;
            renderEventData.c = c = view.context;
            renderEventData.m = m = view.matrixRef;
            renderEventData.im = im = view.invMatrixRef;
        },
        get lightbox() { return lightbox !== undefined },
        set lightbox(on) {
            if(on && lightbox === undefined){
                lightbox = document.createElement("canvas");
                lightbox.width = c.canvas.width;
                lightbox.height = c.canvas.height;
                lightbox.ctx = lightbox.getContext("2d");
            }else if(!on && lightbox) {
                lightbox.ctx = undefined;
                lightbox = undefined;
            }
        },
        clearLightbox() {
            lightbox.ctx.setTransform(1,0,0,1,0,0);
            if (lightbox.width !== c.canvas.width || lightbox.height !== c.canvas.height) {
                lightbox.width = c.canvas.width;
                lightbox.height = c.canvas.height;
            } else {
                lightbox.ctx.clearRect(0,0,lightbox.width,lightbox.height);
            }
        },
        drawLightbox(renderContent = false, fade, layerAlpha = 1) {
            if(lightbox){
                if(renderContent) {
                    const cc = c;
                    c = lightbox.ctx;
                    if(fade) {
                        c.setTransform(1,0,0,1,0,0);
                        c.globalCompositeOperation = "destination-out";
                        c.fillStyle = "black";
                        c.globalAlpha = fade;
                        c.fillRect(0,0,lightbox.width,lightbox.height);
                        c.globalCompositeOperation =  "source-over";
                        c.globalAlpha = 1;
                    }
                    v.applyOn(c);
                    gAlpha = layerAlpha;
                    API.updateLightBox();
                    gAlpha = 1;
                    c = cc;
                }else {
                    c.setTransform(1,0,0,1,0,0);
                    c.globalAlpha = 0.25;
                    c.drawImage(lightbox,0,0);
                    c.globalAlpha = 1;
                }
            }
        },
        updateLightBox(sprList = sprites){
            var x, y, cx, cy, sx, sy, ang, i = 0, showExtraGrid = false;;
            iScale = v.invScale;
            c.lineJoin = "round"; // Some text uses outline (stroke) and this prevents bad miter artifacts
            if(editSprites.drawingModeOn){
                showExtraGrid = API.showExtraGrid;
                drawSprite =  drawSpriteOverlay;
                drawSubSprite =  drawSubSpriteOverlay;
            }else{
                drawSprite = drawSpriteStandard;
                drawSubSprite = drawSubSpriteStandard;
            }
            for(i = 0; i < sprList.length; i ++){
                const spr = sprList[i];
                if(!(spr.type.hidden && !spr.selected)){
                    if(spr.type.group) {
                        const ga =  gAlpha;
                        gAlpha = spr.a * gAlpha;
                        if(gAlpha > 0.001){
                            const mm = m;
                            m = spr.group.matrix;
                            const ms = spr.key.m
                            m[0] = mm[0] * ms[0] + mm[2] * ms[1];
                            m[1] = mm[1] * ms[0] + mm[3] * ms[1];
                            m[2] = mm[0] * ms[2] + mm[2] * ms[3];
                            m[3] = mm[1] * ms[2] + mm[3] * ms[3];
                            m[4] = mm[0] * ms[4] + mm[2] * ms[5] + mm[4];
                            m[5] = mm[1] * ms[4] + mm[3] * ms[5] + mm[5];
                            API.updateLightBox(spr.group.sprites);
                            m = mm;
                        }
                        gAlpha = ga;
                    } else if(spr.type.image){
                        c.globalCompositeOperation = spr.compMode;
                        c.imageSmoothingEnabled = spr.smoothing;
                        c.filter = spr.filter;
                        if (spr.type.pattern) { drawPattern(spr) }
                        else if (spr.type.subSprite) { drawSubSprite(spr) }
                        else { drawSprite(spr) }
                        c.filter = "none";
                        c.imageSmoothingEnabled = true;
                        c.globalCompositeOperation = "source-over";
                        if(!spr.image.isLocked && spr.key.over && !spr.type.hideOutline){
                            if(spr.type.animated && spr.animation.atKey) {
                                drawBorder(spr, onAnimationKeyColor, 3 , 0.75);
                            }else{
                                drawBorder(spr, showColor, 3 , 0.5);
                            }
                        }
                    } else if (spr.type.cutter) {
                        if (spr.type.gradient) { drawGradient(spr) }
                        else { drawCutter(spr , spr.rgb.css, iScale) }
                    } else if (spr.type.text) {  drawText(spr) }
                    else if (spr.type.marker) {  drawMarker(spr , spr.rgb.css, iScale, spr.selected ? 1.0 : 0.5) }
                    else if (spr.type.vanish) {  drawVanish(spr) }
                    else if (spr.type.grid) { drawGrid(spr) }
                   // else if (spr.type.pallet) { drawPallet(spr) }
                    else if (spr.type.vector) { drawVector(spr) }
                    else if (spr.type.shape) { drawShape(spr) }
                    if(spr.type.animated && spr.animation.atKey) { drawBorder(spr, onAnimationKeyColor, 1 , 0.75) }
                    if (spr.highlightSelecting) {
                        if (highlightAxis) {
                            drawBorderAxisNear(spr, highlightColor ,2 + Math.sin(globalTime / 100) + 1 ,Math.sin(globalTime / 100) * 0.25 + 0.75);
                        }else{
                            drawBorder(spr, highlightColor ,2 + Math.sin(globalTime / 100) + 1 ,Math.sin(globalTime / 100) * 0.25 + 0.75);
                        }
                    }
                    if(spr.type.animated && spr.animation.atKey && spr.selected) {
                        drawAtKey(spr, onAnimationKeyColor, 1, 1);
                    }
                }
            }
            c.filter = "none";
            c.imageSmoothingEnabled = true;
            c.globalCompositeOperation = "source-over";
        },
        capture(spr, canvas, quiet = false) {
            const cc = c;
            const mm = m;
            renderEventData.c = c = canvas.ctx;
			if (spr.type.subSprite) {
				const s = spr.subSprite;
				if (!quiet && canvas.processed) { canvas.update(false, false) }
				c.setTransform(1, 0, 0, 1, 0, 0);
				c.save()
				c.beginPath();
				c.rect(s.x, s.y, s.w, s.h);
				c.clip();
				if (!spr.type.captureFeedback){ c.clearRect(s.x, s.y, s.w, s.h); }
				spr.key.toLocal(0, 0);
				renderEventData.m = m = [spr.key.im[0], spr.key.im[1], spr.key.im[2], spr.key.im[3], spr.key.lx, spr.key.ly];
				API.drawVisible(spr.captureList, spr.captureList !== undefined );
				if (!quiet && !editSprites.drawingModeOn) { canvas.processed = true }
				c.restore();
			} else {
				if (!quiet && canvas.processed) { canvas.update(false, false) }
				if (!spr.type.captureFeedback){
					c.setTransform(1, 0, 0, 1, 0, 0);
					c.clearRect(0, 0, canvas.width, canvas.height);
				}
				spr.key.toLocal(0, 0);
				renderEventData.m = m = [spr.key.im[0], spr.key.im[1], spr.key.im[2], spr.key.im[3], spr.key.lx, spr.key.ly];
				API.drawVisible(spr.captureList, spr.captureList !== undefined);
				if (!quiet && !editSprites.drawingModeOn) { canvas.processed = true }
				c.setTransform(1, 0, 0, 1, 0, 0);
			}
            renderEventData.c = c = cc;
            renderEventData.m = m = mm;
        },
        captureSpecial(spr, canvas, spritesToCapture) { // currently only called from tracker
            const cc = c;
            const mm = m;
            renderEventData.c = c = canvas.ctx;
            if (!spr.type.captureFeedback) {
                c.setTransform(1,0,0,1,0,0);
                c.clearRect(0,0,canvas.width,canvas.height);
            }
            spr.key.toLocal(0,0);
            renderEventData.m = m = [spr.key.im[0], spr.key.im[1], spr.key.im[2], spr.key.im[3], spr.key.lx, spr.key.ly];
            API.drawVisible(spritesToCapture)
            c.setTransform(1,0,0,1,0,0);
            if (spr.attachers) {
                for (const attached of spr.attachers.values()) {
                    if (attached.name.toLowerCase().includes("mask")) {
                        if (attached.type.image) {
                            c.globalCompositeOperation = "destination-in";
                            c.globalAlpha = 1;
                            c.drawImage(attached.image, 0, 0, canvas.w, canvas.h);
                            c.globalCompositeOperation = "source-over";
                            break;
                        }
                    }
                }
            }
            spr.image.desc.captured = true;
            renderEventData.c = c = cc;
            renderEventData.m = m = mm;
        },
        showExtraGrid : false,
        showGridAxies : 0,
        liveCapture(){
            API.capturedReady = true;
            API.captureCount = 0;
            sprites.eachLiveCapture(spr=> {
                API.captureCount += 1;
                if (spr.image.desc.shared && spr.image.processed && !spr.image.restored) {
                    API.capture(spr,spr.image.desc.mirror, true);
                    spr.image.restore();
                } else {
                    spr.image.processed = false;
                    API.capture(spr, spr.image);
                    spr.image.desc.issueFrameCapture && spr.image.desc.fireEvent("framecapture");
                }
            });
        },
        renderEventData,
        captureCount : 0,
        capturedReady : true,
        renderedReady : true,
        set highlightColor(col) { highlightColor = col },
        resetUI() {
            mouseDist.reset();
        },
        setRenderDestination(ctx, transform) {
            renderHeap.push({c,m});
            renderEventData.c = c = ctx;
            m = transform;
        },
        restoreRenderdestination(){
            const r =renderHeap.pop();
            c = r.c;
            m = r.m;
        },
        drawSriteTo(spr){
            if (!(spr.type.hidden && !spr.selected)) {
                if (spr.type.image || spr.type.text || spr.type.shape) {
                    c.globalCompositeOperation = spr.compMode;
                    c.imageSmoothingEnabled = spr.smoothing;
                    c.filter = spr.filter;
                    if (spr.type.pattern) { drawPattern(spr) }
                    else if (spr.type.subSprite) { drawSubSpriteClean(spr) }
                    else if (spr.type.image) { drawSpriteClean(spr) }
                    else if (spr.type.text) { drawText(spr) }
                    else if (spr.type.shape) { drawShape(spr) }
                }
            }
        },
        drawVisible(sprList = sprites, showHidden){
            var x, y, cx, cy, sx, sy, ang, i = 0, showExtraGrid = false, holdRenderEvent;
            renderEventData.iScale = iScale = v.invScale;
            renderEventData.frameCount = frameCount;
            c.lineCap = c.lineJoin = "round";
            drawSprite = drawSpriteStandard;
            drawSubSprite = drawSubSpriteStandard;
            for(i = 0; i < sprList.length; i ++){
                const spr = sprList[i];
                if ((!spr.type.hidden || showHidden) && (spr.type.renderable)) {
                    const smooth = gSmooth === undefined ? spr.smoothing : gSmooth;
                    if (spr.type.group) {
                        if (spr.type.shape) {
                            c.globalCompositeOperation = spr.compMode;
                            c.imageSmoothingEnabled = smooth;
                            c.filter = spr.filter;
                            drawShape(spr)
                        }
                        const ga =  gAlpha;
                        const gs =  gSmooth;
                        gSmooth = smooth;
                        gAlpha = spr.a * gAlpha;
                        if (gAlpha > 0.001) {
                            const mm = m;
                            m = spr.group.matrix;
                            const ms = spr.key.m
                            m[0] = mm[0] * ms[0] + mm[2] * ms[1];
                            m[1] = mm[1] * ms[0] + mm[3] * ms[1];
                            m[2] = mm[0] * ms[2] + mm[2] * ms[3];
                            m[3] = mm[1] * ms[2] + mm[3] * ms[3];
                            m[4] = mm[0] * ms[4] + mm[2] * ms[5] + mm[4];
                            m[5] = mm[1] * ms[4] + mm[3] * ms[5] + mm[5];
                            API.drawVisible(spr.group.sprites, showHidden);
                            m = mm;
                        }
                        gAlpha = ga;
                        gSmooth = gs;
                    }else if(spr.a * gAlpha > 0.001 && (spr.type.image || spr.type.text || spr.type.shape||  spr.type.gradient || spr.type.pallet  || spr.type.renderable)){
                        c.globalCompositeOperation = spr.compMode;
                        c.imageSmoothingEnabled = smooth;
                        c.filter = spr.filter;
                        if(spr.type.pattern){ drawPattern(spr) }
                        else if(spr.type.gradient){ drawGradient(spr) }
                        else if(spr.type.subSprite) { drawSubSpriteClean(spr) }
                        else if(spr.type.image) { drawSpriteClean(spr) }
                        else if(spr.type.text){ drawText(spr) }
                        else if(spr.type.pallet){ drawPallet(spr, false) }
                        else if (spr.type.shape) { drawShape(spr) }
                    }
                }
            }
            c.filter = "none";
            c.imageSmoothingEnabled = true;
            c.globalCompositeOperation = "source-over";
        },
        drawAll(visibleOnly, sprList = sprites, ){
            var x, y, cx, cy, sx, sy, ang, i = 0, showExtraGrid = false, holdRenderEvent;;
			currentAudioTime = 0;
            renderEventData.iScale = iScale = v.invScale;
            renderEventData.frameCount = frameCount;
            c.lineCap = c.lineJoin = "round";
            const mainCanvas = c === view.context;
            mainCanvas && (c._tainted = false );
            if (!visibleOnly) {
                API.renderedReady = true;
                if(!inGroup) {
                    matrixStack.first(m)
                    highlightStack.size = 0;
                    gHighlightOccilator =Math.sin(globalTime / 100) * 0.25 + 0.75
                }
            } else { highlightStack.size = 0 }
            if(editSprites.drawingModeOn){
                showExtraGrid = API.showExtraGrid;
                drawSprite = visibleOnly ? drawSpriteStandard : drawSpriteOverlay;
                drawSubSprite = visibleOnly ? drawSubSpriteStandard : drawSubSpriteOverlay;
            }else{
                drawSprite = drawSpriteStandard;
                drawSubSprite = drawSubSpriteStandard;
            }
            const highlightOccilator = gHighlightOccilator;
            for(i = 0; i < sprList.length; i ++){
                const spr = sprList[i];
                if (visibleOnly) {
                    if (!spr.type.hidden) {
                        const smooth = gSmooth === undefined ? spr.smoothing : gSmooth;
                        if(spr.type.group) {
                            if (spr.type.shape) {
                                c.globalCompositeOperation = spr.compMode;
                                c.imageSmoothingEnabled = smooth;
                                c.filter = spr.filter;
                                drawShape(spr)
                            }
                            const ga =  gAlpha;
                            const gs =  gSmooth;
                            gSmooth = smooth;
                            gAlpha = spr.a * gAlpha;
                            if(gAlpha > 0.001){
                                const mm = m;
                                m = spr.group.matrix;
                                const ms = spr.key.m
                                m[0] = mm[0] * ms[0] + mm[2] * ms[1];
                                m[1] = mm[1] * ms[0] + mm[3] * ms[1];
                                m[2] = mm[0] * ms[2] + mm[2] * ms[3];
                                m[3] = mm[1] * ms[2] + mm[3] * ms[3];
                                m[4] = mm[0] * ms[4] + mm[2] * ms[5] + mm[4];
                                m[5] = mm[1] * ms[4] + mm[3] * ms[5] + mm[5];
                                API.drawAll(true,spr.group.sprites);
                                m = mm;
                            }
                            gAlpha = ga;
                            gSmooth = gs;
                        }else if(spr.a * gAlpha > 0.001 && (spr.type.image || spr.type.text || spr.type.shape|| /*spr.type.vector ||*/ spr.type.gradient || spr.type.pallet  || spr.type.renderable)){
                            c.globalCompositeOperation = spr.compMode;
                            c.imageSmoothingEnabled = smooth;
                            c.filter = spr.filter;
                            if (spr.type.image) {
                                drawSpriteClean(spr);
                                if (spr.image.tainted && mainCanvas) { c._tainted = true }
                            } else if (spr.type.subSprite) {
                                drawSubSpriteClean(spr)
                                if (spr.image.tainted && mainCanvas) { c._tainted = true }
                            } else if (spr.type.text){ drawText(spr) }
                            else if (spr.type.pallet){ drawPallet(spr, false) }
                            else if (spr.type.shape) { drawShape(spr) }
                            else if (spr.type.pattern){
                                drawPattern(spr)
                                if (spr.image.tainted && mainCanvas) { c._tainted = true }
                            } else if (spr.type.gradient){ drawGradient(spr) }
                            //else if (spr.type.vector) { drawVector(spr) }
                            //if(spr.type.renderable) {  spr.fireEvent("onrender",renderEventData)  }
                            if (spr.type.image && spr.image.desc.video && spr.image.seeking) { API.capturedReady = false }
                        }
                    }
                } else if (!(spr.type.hidden && !spr.selected) || (!visibleOnly && spr.highlight)) {
                        holdRenderEvent = false;
                        const hideOutline = gHideOutline === undefined ? spr.type.hideOutline : gHideOutline;
                        const smooth = gSmooth === undefined ? spr.smoothing : gSmooth;
                        if (!spr.key.over && !hideOutline) { drawBorder(spr, showColor, 0.5, 0.5) }
                        if (spr.type.group) {
                            if (spr.type.shape) {
                                c.globalCompositeOperation = spr.compMode;
                                c.imageSmoothingEnabled = smooth;
                                c.filter = spr.filter;
                                drawShape(spr)
                                c.filter = "none";
                                c.imageSmoothingEnabled = true;
                                c.globalCompositeOperation = "source-over";
                                holdRenderEvent = true;
                                if (spr.shape.isCompound && !hideOutline) { drawShapeIcon(spr , spr.rgb.css, iScale) }
                            }
                            const ga =  gAlpha;
                            const gho =  gHideOutline;
                            const gs =  gSmooth;
                            gAlpha = spr.a * gAlpha;
                            gHideOutline = hideOutline;
                            gSmooth = smooth;
                            if (gAlpha > 0.001){
                                const currentOpen = inOpenGroup;
                                const currentInGroup = inGroup;
                                if(spr.type.openGroup && !inGroup) { inOpenGroup = true }
                                inGroup = true;
                                const mm = m;
                                m = spr.group.matrix;
                                const ms = spr.key.m
                                m[0] = mm[0] * ms[0] + mm[2] * ms[1];
                                m[1] = mm[1] * ms[0] + mm[3] * ms[1];
                                m[2] = mm[0] * ms[2] + mm[2] * ms[3];
                                m[3] = mm[1] * ms[2] + mm[3] * ms[3];
                                m[4] = mm[0] * ms[4] + mm[2] * ms[5] + mm[4];
                                m[5] = mm[1] * ms[4] + mm[3] * ms[5] + mm[5];
                                matrixStack.add(m);
                                API.drawAll(false, spr.group.sprites);
                                matrixStack.back();
                                m = mm;
                                inGroup = currentInGroup;
                                inOpenGroup = currentOpen;
                                if (spr.type.openGroup && (inOpenGroup || !inGroup)) {  drawBorder(spr, "white", 1 , 1, iScale)  }
                            }
                            gAlpha = ga;
                            gHideOutline = gho;
                            gSmooth = gs;
                        } else if (spr.a * gAlpha > 0.001) {
                            if (spr.type.image){
                                c.globalCompositeOperation = spr.compMode;
                                c.imageSmoothingEnabled = smooth;
                                c.filter = spr.filter;
                                if (spr.type.pattern) { drawPattern(spr) }
                                else if (spr.type.subSprite) { drawSubSprite(spr) }
                                else { drawSprite(spr) }
                                if (spr.image.tainted && mainCanvas) { c._tainted = true }
                                c.filter = "none";
                                c.imageSmoothingEnabled = true;
                                c.globalCompositeOperation = "source-over";
                                if(spr.image.isLocked){
                                    drawLockedInfo(spr,"BLACK",iScale * 4,1);
                                }else{
                                    if (spr.image.desc.videoCap) { drawVideoCap(spr, onAnimationKeyColor, 2, highlightOccilator) }
                                    if (spr.image.desc.video && spr.image.seeking) {
                                        API.renderedReady = false;
                                        drawVideoFrameHold(spr, onAnimationKeyColor, 2, 1);
                                    }
                                    if (spr.type.liveCapture) { drawCapturingIcon(spr, "red", 2 , highlightOccilator) }
                                    if (spr.selected) { drawBorder(spr, selectedColor, 1, 1) }
                                    else if (spr.key.over && !hideOutline) {
                                        if(spr.type.animated && spr.animation.atKey) { drawBorder(spr, onAnimationKeyColor, 3 , 0.75) }
                                        else { drawBorder(spr, showColor, 3 , 0.5) }
                                    }
                                    if (spr.image.desc.highlight) {drawBorder(spr, "Yellow", 1 , highlightOccilator, 4*iScale)}
									if (spr.type.sound) {  drawSoundInfo(spr);  }
                                }


                                //if(spr.image.desc.corners) {drawMarked(spr)}
                            } else if (spr.type.cutter) {
                                if (spr.type.gradient) { drawGradient(spr) }
                                else { drawCutter(spr , spr.rgb.css, iScale) }
                            } else if (spr.type.text) {
                                c.globalCompositeOperation = spr.compMode;
                                c.imageSmoothingEnabled = smooth;
                                c.filter = spr.filter;
                                drawText(spr)
                                c.filter = "none";
                                c.imageSmoothingEnabled = true;
                                c.globalCompositeOperation = "source-over";
                            } else if (spr.type.marker) {  drawMarker(spr , spr.rgb.css, iScale, spr.selected ? 1.0 : 0.5) }
                            else if (spr.type.vanish) {  drawVanish(spr) }
                            else if (spr.type.grid) { drawGrid(spr) }
                            else if (spr.type.pallet) { drawPallet(spr) }
                            else if (spr.type.shape) {
                                c.globalCompositeOperation = spr.compMode;
                                c.imageSmoothingEnabled = smooth;
                                c.filter = spr.filter;
                                drawShape(spr)
                                c.filter = "none";
                                c.imageSmoothingEnabled = true;
                                c.globalCompositeOperation = "source-over";
                                holdRenderEvent = true;
                                if (spr.shape.isCompound && !hideOutline) { drawShapeIcon(spr , spr.rgb.css, iScale) }
                            }
                            else if (spr.type.functionLink) { 
                                drawFunctionLink(spr); 
                            }
                        }
                        if (spr.type.renderable && spr.hasEvent("onrender")) {
                            c.globalCompositeOperation = spr.compMode;
                            c.imageSmoothingEnabled = smooth;
                            c.filter = spr.filter;
                            spr.fireEvent("onrender",renderEventData);
                            c.filter = "none";
                            c.imageSmoothingEnabled = true;
                            c.globalCompositeOperation = "source-over";
                        }
                        if (spr.selected) {
                            if (spr.type.hasLocators) { drawLocators(spr) }
                            if (spr.locates) { for(const s of spr.locates) { drawLocators(s) } }
                            if (spr.locks.locX || spr.locks.locY) { drawAxisLocks(spr) }
							
                        }
                        if (spr.type.animated && spr.animation.atKey && spr.selected && !hideOutline) { drawAtKey(spr, onAnimationKeyColor, 1, 1) }
                        if (spr.highlightSelecting || spr.highlight || (spr.shadowedBy && spr.shadowedBy.highlight && spr.shadowedBy.cast.type.openGroup)) {
                            if (highlightStack[highlightStack.size]) {
                                highlightStack[highlightStack.size].spr = spr;
                                highlightStack[highlightStack.size].matrixIdx = matrixStack.current;
                                highlightStack.size ++;
                            } else { highlightStack[highlightStack.size++] = {spr, matrixIdx: matrixStack.current} }
                        }
                        // spr.fireEvent("onrenderinfo",renderEventData); // some old batches may need this
                }
                if (spr.changed) { spr.changed = false; spr.changeCount ++; }; // Added 4/8/2020 and may cause problems???? UPDATE 5/12/2020 no problems so far
            }
            if (!inGroup) {  // Highligh stack is used to move highlights to the top of the rendering (so that highlighting is not obscured)
                if (highlightStack.size > 0) {
                    let i = 0, mIdx = 0;
                    const len = highlightStack.size;
                    const mm = m;
                    while (i < len) {
                        const hl = highlightStack[i++];
                        const spr = hl.spr;
                        hl.spr = null;
                        if (mIdx !== hl.matrixIdx) {
                            mIdx = hl.matrixIdx;
                            m = matrixStack[mIdx];
                        }
                        if (spr.highlightSelecting) {
                            if (highlightAxis) {  drawBorderAxisNear(spr, highlightColor ,2 + Math.sin(globalTime / 100) + 1 ,highlightOccilator) }
                            else { drawBorder(spr, highlightColor ,2 + Math.sin(globalTime / 100) + 1 ,highlightOccilator) }
                            if (spr.type.cutter && spr.gridSpecial) { drawCutter(spr ,  highlightColor ,(2 + Math.sin(globalTime / 100) + 1) * iScale ,highlightOccilator) }
                            else if (spr.type.shape) { drawShapeHighlight(spr, highlightColor ,2 + Math.sin(globalTime / 100) + 1 ,highlightOccilator) }
                        } else {
                            drawBorder(spr, "Yellow", 1 , highlightOccilator, 4*iScale);
                            if (spr.type.cutter && spr.gridSpecial) { drawCutter(spr ,  "Yellow" ,1 * iScale ,highlightOccilator) }
                            else if (spr.type.shape) { drawShapeHighlight(spr, "Yellow", 1 , highlightOccilator, 4 * iScale) }
                        }
                    }
                    m = mm;
                }
            }
            c.filter = "none";
            c.imageSmoothingEnabled = true;
            c.globalCompositeOperation = "source-over";
        },
        set highlightAxis(val){ highlightAxis = val },
        drawSpriteList(sprList, highlightAxis, axisPositions) {  // called from widget when in selection mode
            var x, y, cx, cy, sx, sy, ang, i = 0, showExtraGrid = false;;
            const iScale = v.invScale;
            for (const spr of sprList) {
                if (highlightAxis === 1 || highlightAxis === 2) {  drawBorderAxis(spr, highlightColor ,2 ,1, highlightAxis === 1, axisPositions) }
                else {  drawBorder(spr, highlightColor ,2 ,1) }
            }
            c.imageSmoothingEnabled = true;
            c.globalCompositeOperation = "source-over";
        },
    }
    function addHeartBeatEvent() {
        setTimeout(() => {
            if (window.heartBeat === undefined) {
                addHeartBeatEvent();
            }else {
                heartBeat.addEvent("onsleep", () => { highlightStack.size = highlightStack.length = 0 })
            }
        }, 500);
    }
    addHeartBeatEvent();
    return API;
})();