"use strict";


const renderFunctions = (()=>{
    const BRUSH_MAX_SIZE = 256;
    const wCanvas1 = utils.canvas(BRUSH_MAX_SIZE,BRUSH_MAX_SIZE);
    const wCanvas2 = utils.canvas(BRUSH_MAX_SIZE,BRUSH_MAX_SIZE);
    const API = {
        mark(ctx,x,y,size,col){
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.moveTo(x-size,y)
            ctx.lineTo(x+size,y)
            ctx.moveTo(x,y - size)
            ctx.lineTo(x,y + size)
            ctx.stroke();
        },
        line(ctx,l,col){
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.moveTo(l.p1.x,l.p1.y)
            ctx.lineTo(l.p2.x,l.p2.y)
            ctx.stroke();
        },
        interpolate : {
            desc : {
                x : 0,
                y : 0,
                dx : 0,
                dy : 0,
                step : 0,
                start : 0,
                count : 0,
                empty : true,
                onSpriteSingle(spr){
                    const k = spr.key;
                    this.x = k._lx;
                    this.y = k._ly;
                    this.empty = false;
                    var dx = this.dx = k.lx - k._lx;
                    var dy = this.dy = k.ly - k._ly;
                    var len = Math.sqrt(dx * dx + dy * dy) + 0.00001;
                    this.count = 1 ;
                    this.start = 0;
                    if(paint.drawType === commands.paintSpray){
                        this.dx = 0;
                        this.dy = 0;
                        this.x += dx * 0.5;
                        this.y += dy * 0.5;
                        this.step = 1 / (brushStep/4);
                    }else{
                        if(brushStep > 0){
                            this.step = 0.5
                        }else{
                            this.step = 0.5;
                            if(curveStep > 0){
                                this.step *= curveStep;
                                this.count += this.step/2
                                if (!firstDown){
                                    this.start += this.step;
                                }
                            }
                        }
                    }
                    k._lx = k.lx;
                    k._ly = k.ly;
                },
                onSprite(spr){
                    var dx,dy;
                    var lx,ly
                    const k = spr.key;
                    this.x = k._lx;
                    this.y = k._ly;
                    this.empty = false;
                    lx = k.lx;
                    ly = k.ly;
                    if(paint.alias){
                        lx |= 0;
                        ly |= 0;
                    }
                    dx = this.dx = lx - this.x;
                    dy = this.dy = ly - this.y;
                    var len = Math.sqrt(dx * dx + dy * dy) + 0.00001;
                    this.count = 1 ;
                    this.start = 0;
                    if(paint.drawType === commands.paintSpray){
                        this.step = 1 / (brushStep+1);
                        k._lx = lx;
                        k._ly = ly;
                    }else{
                        if( brushStep > 0){
                            this.step = 1 / brushStep;
                            k._lx = lx;
                            k._ly = ly;
                        }else{
                            this.step = 1 / (len > 1 ? len : 1);
                            if(curveStep > 0){
                                this.step *= curveStep;
                                this.count += this.step/2
                                if (!firstDown){
                                    if (len < curveStep) { this.empty = true }
                                    else { this.start += this.step }
                                }
                            }
                            if(this.empty) { return }
                            k._lx = lx;
                            k._ly = ly;
                        }
                    }
                }
            },
            point : {
                pixel(spr){
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var rx,ry,i;
                    const colorCurve = curves.brushColor;
                    var size, brushRadius = brushMin / 2;
                        for(i = d.start; i < count; i += step) {
                            if(paint.useSizeDist) {
                                size = curves.lineWidth(Math.random()) * brushRange + brushMin;
                                brushRadius = size < 1 ? 1 : size;
                            }
                            if(randomColor) { ctx.fillStyle = colorRange.cssAt(colorCurve(Math.random())) }
                            if(brushRadius <= 1){
                                rx = (x + dx * i) | 0;
                                ry = (y + dy * i) | 0;
                                ctx.fillRect(rx,ry,1,1);
                            } else if(brushRadius===2){
                                rx = ((x + dx * i) | 0) - 1;
                                ry = ((y + dy * i) | 0) - 1;
                                ctx.fillRect(rx,ry,2,2);
                            } else if(brushRadius===3){
                                rx = ((x + dx * i) | 0) +0.5;
                                ry = ((y + dy * i) | 0) + 0.5;
                                ctx.fillRect(rx - 0.5,ry- 1.5,1,3);
                                ry -= 0.5;
                                ctx.fillRect(rx - 1.5,ry,1,1);
                                ctx.fillRect(rx + 0.5,ry,1,1);
                            } else if(brushRadius===4){
                                rx = ((x + dx * i) | 0);
                                ry = ((y + dy * i) | 0);
                                ctx.fillRect(rx - 1,ry- 2,2,4);
                                ry -= 1;
                                ctx.fillRect(rx - 2,ry,1,2);
                                ctx.fillRect(rx + 1,ry,1,2);
                            } else if(brushRadius===5){
                                rx = ((x + dx * i) | 0) +0.5;
                                ry = ((y + dy * i) | 0) + 0.5;
                                ctx.fillRect(rx - 1.5,ry- 2.5,3,5);
                                ry -= 1.5;
                                ctx.fillRect(rx - 2.5,ry,1,3);
                                ctx.fillRect(rx + 1.5,ry,1,3);
                            }else{
                                rx = ((x + dx * i ) | 0) + 0.5;
                                ry = ((y + dy * i ) | 0) + 0.5;
                                ctx.beginPath();
                                ctx.arc(rx, ry, brushRadius/2, 0, Math.PI2);
                                ctx.fill();
                            }
                        }
                },
                point(spr){
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var size, brushRadius = brushMin / 2;
                    const colorCurve = curves.brushColor;
                    var rx,ry,i;
                    for(i = d.start; i < count; i += step) {
                        if(paint.useSizeDist) {
                            size = curves.lineWidth(Math.random()) * brushRange + brushMin;
                            brushRadius = size < 2 ? 1 : size / 2;
                        }
                        rx = x + dx * i;
                        ry = y + dy * i;
                        if(randomColor) { ctx.fillStyle = colorRange.cssAt(colorCurve(Math.random())) }
                        ctx.beginPath();
                        ctx.arc(rx, ry, brushRadius, 0, Math.PI2);
                        ctx.fill();
                    }
                },
                brush(spr){
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var brushRadius = brushMin / 2;
                    var size = brushMin;
                    var img = wCanvas1;
                    const colorCurve = curves.brushColor;
                    var rx,ry,i;
                    for(i = d.start; i < count; i += step) {
                        if(paint.useSizeDist) {
                            size = curves.lineWidth(Math.random()) * brushRange + brushMin;
                            brushRadius = size < 2 ? 1 : size / 2;
                        }
                        if(randomColor) {
                            renderFunctions.image.colorBrush(colorRange.cssAt(colorCurve(Math.random())));
                        }
                        rx = x + dx * i - brushRadius;
                        ry = y + dy * i - brushRadius;
                        ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx,ry,size,size);
                    }
                     img.ctx.globalCompositeOperation = "source-over";
                },
            },
            spray : {
                pixel(spr){
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var rx,ry,i;
                    var ang,dist,brushRadius,size;
                    const distCurve = curves.spraySpread;
                    const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                    brushRadius = brushMin;
                    const colorCurve = curves.sprayColor;
                    const fromPallet = !(paint.palletFrom === commands.paintColImage);
                    for(i = d.start; i < count; i += step) {
                        if(paint.useSizeDist) {
                            size = curves.spraySize(Math.random()) * brushRange + brushMin;
                            brushRadius = size | 0;
                        }
                        ang = Math.random() * Math.PI2;
                        dist = distCurve(Math.random());
                        ctx.globalAlpha = alphaCurve(1-dist) * alpha;
                        dist = (dist * sprayRange + sprayMin) / 2;
                        if(randomColor) {
                            ctx.fillStyle = fromPallet ? colorRange.cssAt(colorCurve(Math.random())) :
                                colorRange.lookup[colorRange.lookupLen * Math.random() | 0];
                        }
                        if(brushRadius <= 1){
                            rx = (x + dx * i + Math.cos(ang) * dist) | 0;
                            ry = (y + dy * i + Math.sin(ang) * dist) | 0;
                            ctx.fillRect(rx,ry,1,1);
                        } else if(brushRadius===2){
                            rx = ((x + dx * i + Math.cos(ang) * dist) | 0) - 1;
                            ry = ((y + dy * i + Math.sin(ang) * dist) | 0) - 1;
                            ctx.fillRect(rx,ry,2,2);
                        } else if(brushRadius===3){
                            rx = ((x + dx * i + Math.cos(ang) * dist) | 0) +0.5;
                            ry = ((y + dy * i + Math.sin(ang) * dist) | 0) + 0.5;
                            ctx.fillRect(rx - 0.5,ry- 1.5,1,3);
                            ry -= 0.5;
                            ctx.fillRect(rx - 1.5,ry,1,1);
                            ctx.fillRect(rx + 0.5,ry,1,1);
                        } else if(brushRadius===4){
                            rx = ((x + dx * i + Math.cos(ang) * dist) | 0);
                            ry = ((y + dy * i + Math.sin(ang) * dist) | 0);
                            ctx.fillRect(rx - 1,ry- 2,2,4);
                            ry -= 1;
                            ctx.fillRect(rx - 2,ry,1,2);
                            ctx.fillRect(rx + 1,ry,1,2);
                        } else if(brushRadius===5){
                            rx = ((x + dx * i + Math.cos(ang) * dist) | 0) +0.5;
                            ry = ((y + dy * i + Math.sin(ang) * dist) | 0) + 0.5;
                            ctx.fillRect(rx - 1.5,ry- 2.5,3,5);
                            ry -= 1.5;
                            ctx.fillRect(rx - 2.5,ry,1,3);
                            ctx.fillRect(rx + 1.5,ry,1,3);
                        }else{
                            rx = ((x + dx * i + Math.cos(ang) * dist) | 0) + 0.5;
                            ry = ((y + dy * i + Math.sin(ang) * dist) | 0) + 0.5;
                            ctx.beginPath();
                            ctx.arc(rx, ry, brushRadius/2, 0, Math.PI2);
                            ctx.fill();
                        }
                    }
                },
                point(spr){
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var brushRadius = brushMin / 4;
                    var rx,ry,i;
                    var ang,dist;
                    const distCurve = curves.spraySpread;
                    const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                    const colorCurve = curves.sprayColor;
                    const fromPallet = !(paint.palletFrom === commands.paintColImage);
                    for(i = d.start; i < count; i += step) {
                        if(paint.useSizeDist) {
                            var size = curves.spraySize(Math.random()) * brushRange + brushMin;
                            brushRadius = size / 4;
                        }
                        ang = Math.random() * Math.PI2;
                        dist = distCurve(Math.random());
                        ctx.globalAlpha = alphaCurve(1-dist) * alpha;
                        dist = (dist * sprayRange + sprayMin) / 2;
                        rx = x + dx * i + Math.cos(ang) * dist;
                        ry = y + dy * i + Math.sin(ang) * dist;
                        if(randomColor) {
                            ctx.fillStyle = fromPallet ? colorRange.cssAt(colorCurve(Math.random())) :
                                colorRange.lookup[colorRange.lookupLen * Math.random() | 0];
                        }
                        ctx.beginPath();
                        ctx.arc(rx, ry, brushRadius, 0, Math.PI2);
                        ctx.fill();
                    }
                },
                brush(spr){
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var brushRadius = brushMin / 2;
                    var size = brushMin;
                    var img = wCanvas1;
                    var ang,dist;
                    const blendColor = paint.colorBlend;
                    const distCurve = curves.spraySpread;
                    const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                    const colorCurve = curves.sprayColor;
                    const fromPallet = !(paint.palletFrom === commands.paintColImage);
                    var rx,ry,i;
                    if(blendColor){
                        for(i = d.start; i < count; i += step) {
                            if(paint.useSizeDist) {
                                size = curves.spraySize(Math.random()) * brushRange + brushMin;
                                brushRadius = size < 2 ? 1 : size / 2;
                            }
                            ang = Math.random() * Math.PI2;
                            dist = distCurve(Math.random());
                            ctx.globalAlpha = alphaCurve(1-dist) * alpha;
                            if(randomColor) {
                                renderFunctions.image.colorBrush( fromPallet ? colorRange.cssAt(colorCurve(Math.random())) : colorRange.lookup[colorRange.lookupLen * Math.random() | 0])
                            }else{
                                renderFunctions.image.colorBrush( fromPallet ? colorRange.cssAt(colorCurve(dist)) : colorRange.lookup[colorRange.lookupLen * dist | 0])
                            }
                            dist = dist * sprayRange + sprayMin;
                            rx = x + dx * i + Math.cos(ang) * dist - brushRadius;
                            ry = y + dy * i + Math.sin(ang) * dist - brushRadius;
                            ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx,ry,size,size);
                        }
                    }else{
                        for(i = d.start; i < count; i += step) {
                            if(paint.useSizeDist) {
                                size = curves.spraySize(Math.random()) * brushRange + brushMin;
                                brushRadius = size < 2 ? 1 : size / 2;
                            }
                            ang = Math.random() * Math.PI2;
                            dist = distCurve(Math.random());
                            ctx.globalAlpha = alphaCurve(1-dist) * alpha;
                            dist = dist * sprayRange + sprayMin;
                            rx = x + dx * i + Math.cos(ang) * dist - brushRadius;
                            ry = y + dy * i + Math.sin(ang) * dist - brushRadius;
                            if(randomColor) {
                                renderFunctions.image.colorBrush( fromPallet ? colorRange.cssAt(colorCurve(Math.random())) : colorRange.lookup[colorRange.lookupLen * Math.random() | 0])
                            }
                            ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx,ry,size,size);
                        }
                    }
                    img.ctx.globalCompositeOperation = "source-over";
                },
            },
            image : {
                pixel(spr) {},
                point(spr) {},
                brush(spr) {
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var brushRadius = brushMin / 2;
                    var size = brushMin;
                    var img = wCanvas1;
                    var xdx,xdy;
                    const dir = mouseBrush1.directionAccum - mouseBrush1.directionChange;
                    const dirChange = mouseBrush1.directionChange;
                    const colorCurve = curves.brushColor;
                    var rx,ry,i;
                    for(i = d.start; i < count; i += step) {
                        rx = x + dx * i;
                        ry = y + dy * i;
                        if(alias){
                            rx |= 0;
                            ry |= 0;
                        }
                        if(paint.useSizeDist) {
                            size = curves.lineWidth(Math.random()) * brushRange + brushMin;
                            brushRadius = size < 2 ? 1 : size / 2;
                        }
                        if(randomColor) {
                            renderFunctions.image.colorBrush(colorRange.cssAt(colorCurve(Math.random())));
                        }
                        if(useDirection){
                            const d = dir  + dirChange * i;
                            xdx = Math.cos(d);
                            xdy = Math.sin(d);
                            ctx.setTransform(xdx,xdy,-xdy,xdx, rx, ry);
                            ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,- brushRadius,- brushRadius,size,size);
                            if(imgCopyFade > 0){
                                renderFunctions.image.imageDirFade(imageTop.image,rx,ry,imgCopyFade,d);
                            }
                        }else{
                            ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx- brushRadius,ry- brushRadius,size,size);
                            if(imgCopyFade > 0){
                                renderFunctions.image.imageDirFade(imageTop.image,rx,ry,imgCopyFade,0);
                            }
                        }
                    }
                     img.ctx.globalCompositeOperation = "source-over";
                }
            },
            hairs : {
                brushPixel(spr) {
                    var hairs = specialBrushes.draw();
                    const ctx = spr.image.ctx;
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var brushRadius = brushMin / 2;
                    var size = brushMin;
                    var img = wCanvas1;
                    var xdx,xdy;
                    const dir = mouseBrush1.directionAccum - mouseBrush1.directionChange;
                    const dirChange = mouseBrush1.directionChange;
                    const colorCurve = curves.brushColor;
                    var rx,ry,i,j;
                    for(i = d.start; i < count; i += step) {
                        rx = x + dx * i;
                        ry = y + dy * i;
                        specialBrushes.currentStep(rx,ry,step);
                        ctx.setTransform(1,0,0,1,rx-hairs.xo|0,ry-hairs.yo|0);
                        for(j = 0; j < hairs.size; j++){
                            const h = hairs[j];
                            ctx.fillStyle = h.css;
                            var rec = aliasRects[h.size | 0];
                            rec = rec ? rec : 5;
                            ctx.beginPath();
                            ctx.rect(h.x + rec[0] | 0,h.y +rec[0] | 0, rec[1], rec[1]);
                            ctx.fill();
                        }
                    }
                },
                brush(spr) {
                    var hairs = specialBrushes.draw();
                    const ctx = spr.image.ctx;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    const d = renderFunctions.interpolate.desc;
                    const step = d.step;
                    const count = d.count;
                    const dx = d.dx;
                    const dy = d.dy;
                    var x = d.x;
                    var y = d.y;
                    var brushRadius = brushMin / 2;
                    var size = brushMin;
                    var img = wCanvas1;
                    var xdx,xdy;
                    const dir = mouseBrush1.directionAccum - mouseBrush1.directionChange;
                    const dirChange = mouseBrush1.directionChange;
                    const colorCurve = curves.brushColor;
                    var rx,ry,i,j;
                    for(i = d.start; i < count; i += step) {
                        rx = x + dx * i;
                        ry = y + dy * i;
                        specialBrushes.currentStep(rx,ry,step);
                        ctx.setTransform(1,0,0,1,rx-hairs.xo,ry-hairs.yo);
                        for(j = 0; j < hairs.size; j++){
                            const h = hairs[j];
                            ctx.strokeStyle = h.css;
                            ctx.lineWidth = h.size;
                            ctx.beginPath();
                            ctx.lineTo(h.x,h.y);
                            ctx.lineTo(h.x1 + 0.1,h.y1);
                            ctx.lineTo(h.x2,h.y2 + 0.1);
                            ctx.stroke();
                        }
                    }
                }
            }
        },
        curved : {
            show(spr){
                const ctx = spr.image.ctx;
                curved.eachLocal(p => ctx.lineTo(p[0],p[1]));
            },
            aliasPoints(spr){
                const ctx = spr.image.ctx;
                var len = 0;
                if(paint.sizeBlend){
                    len = curved.length;
                    curved.eachLocal(p => {
                        var pos = p[4] / len;
                        const rad = (curves.lineColor(pos) * curves.lineWidth(pos) * brushRange + brushMin)/4;
                        const x = p[6];
                        const y = p[7];
                        ctx.moveTo(x + rad,y);
                        ctx.arc(x,y,rad,0,Math.PI2);
                    });
                }else{
                    curved.eachLocal(p => ctx.rect(p[6] | 0, p[7] | 0, 1, 1));
                }
            },
            smoothed(spr){
                const ctx = spr.image.ctx;
                var len = 0;
                if(paint.sizeBlend){
                    len = curved.length;
                    const line = curved.line;
                    const points = line.points;
                    var count = line.count;
                    for(var i = 1; i < count; i++){
                        var p1 = points[i-1];
                        var p2 = points[i];
                        var c = Math.acos(Math.abs(p1[8] * -p2[9] - p1[9] * -p2[8])) / 2;
                        var pos = p2[4] / len;
                        const rad = (curves.lineColor(pos) * curves.lineWidth(pos) * brushRange + brushMin)/4;
                        var h = rad / Math.sin(c);
                        var nx = (p2[8] - p1[8])/2;
                        var ny = (p2[9] - p1[9])/2;
                        var len1 = Math.sqrt(nx*nx + ny * ny);
                        nx /= len1;
                        ny /= len1;
                        nx *= h;
                        ny *= h;
                        ctx.rect(p2[6] + p2[9] * rad | 0,p2[7] - p2[8] * rad | 0, 1, 1)
                        ctx.rect(p2[6] | 0,p2[7] | 0, 1, 1)
                    }
                    for(var i = 1; i < count; i++){
                        var ii = count - i;
                        var p2 = points[ii];
                        ctx.lineTo(p2[6],p2[7] );
                    }
                }else{
                    curved.eachLocal(p => ctx.lineTo(p[6],p[7]));
                }
            },
        },
        image : (()=>{
            const c1 = wCanvas1;  // These must be square (same width and height,
            const c2 = wCanvas1;  // must not change size and these must be in scope of pen object
            const ctx1 = wCanvas1.ctx;
            const ctx2 = wCanvas2.ctx;
            const size = c1.width;
            const size2 = size / 2;
            var alphaMask;
            const API = {
                createMask( alphaCurve){
                    alphaMask = renderFunctions.gradient.imageBrushMask(ctx1, size2, alphaCurve);
                },
                copyToOther(canvasID = 1){
                    const can = canvasID === 1 ? c1 : c2;
                    const can1 = canvasID === 1 ? c2 : c1;
                    const ctx = can1.ctx;
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.globalCompositeOperation = "copy";
                    ctx.drawImage(can,0,0);
                    ctx.globalCompositeOperation = "source-over";
                },
                imageDirFade(img,x,y, alpha, dir, canvasID = 1){
                    const can = canvasID === 1 ? c1 : c2;
                    const can1 = canvasID === 1 ? c2 : c1;
                    const ctx = can.ctx;
                    const scale = 256 / brushMin;
                    ctx.clearRect(0,0,size,size);
                    ctx.setTransform(scale,0,0,scale,size2,size2);
                    ctx.rotate(-dir);
                    ctx.drawImage(img, -x, -y);
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(can1,0,0);
                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.fillStyle = alphaMask;
                    ctx.fillRect(0,0,size,size);
                    ctx.globalCompositeOperation = "source-over";
                    return can;
                },
                imageDir(img,x,y, dir, canvasID = 1){
                    const can = canvasID === 1 ? c1 : c2;
                    const ctx = can.ctx;
                    const scale = 256 / brushMin;
                    ctx.clearRect(0,0,size,size);
                    ctx.setTransform(scale,0,0,scale,size2,size2);
                    ctx.rotate(-dir);
                    ctx.drawImage(img, -x, -y);
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.fillStyle = alphaMask;
                    ctx.fillRect(0,0,size,size);
                    ctx.globalCompositeOperation = "source-over";
                    return can;
                },
                colorBrush(color, canvasID = 1){
                    const can = canvasID === 1 ? c1 : c2;
                    const ctx = can.ctx;
                    ctx.fillStyle = color;
                    ctx.globalCompositeOperation = "source-atop";
                    ctx.fillRect(0,0,size,size);
                    ctx.globalCompositeOperation = "source-over";
                },
                circleBrush(fillStyle,canvasID = 1){
                    const can = canvasID === 1 ? c1 : c2;
                    const ctx = can.ctx;
                    ctx.clearRect(0,0,size,size);
                    ctx.fillStyle = fillStyle;
                    ctx.fillRect(0,0,size,size);
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.fillStyle = alphaMask;
                    ctx.fillRect(0,0,size,size);
                    ctx.globalCompositeOperation = "source-over";
                    ctx.setTransform(1,0,0,1,0,0);
                },
            };
            return API;
        })(),
        pixel : {
            getTopImage(){
                var maybe, top;
                sprites.eachDrawableVisual(spr => {
                    if(!maybe) { maybe = spr }
                    if(spr.key.lx >= 0 && spr.key.lx < spr.image.w && spr.key.ly >= 0 && spr.key.ly < spr.image.h){
                        top = spr;
                    }
                });
                return top ? top : maybe;
            },
            getColor(firstLoad = false){
                if(firstLoad){
                    wColor1.transparent();
                }
                sprites.eachDrawableVisual(spr => {
                    if(spr.key._lx >= 0 && spr.key._lx < spr.image.w && spr.key._ly >= 0 && spr.key._ly < spr.image.h){
                        var dat;
                        if(paint.recycleDestination && !firstLoad){
                            dat = spr.image.ctx.getImageData(spr.key._lx | 0, spr.key._ly | 0,1,1).data;
                        }else{
                            dat = spr.image.desc.mirror.ctx.getImageData(spr.key._lx | 0, spr.key._ly | 0,1,1).data;
                        }
                        if(dat[0] !== undefined  && dat[3] > 0){
                            if(!firstLoad && paint.recycleColor){
                                var pickup = curves.curves.B.value ** 2;
                                var pickup1 = 1-pickup;

                                    if(Math.random() < pickup ){
                                        wColor1.r = wColor1.r * pickup1 + dat[0] * pickup;
                                        wColor1.g = wColor1.g * pickup1 + dat[1] * pickup;
                                        wColor1.b = wColor1.b * pickup1 + dat[2] * pickup;
                                        wColor1.a = wColor1.a * pickup1 + dat[3] * pickup;
                                    }

                            }else{
                                wColor1.fromPixel(0, dat);
                            }
                            return true;
                        }
                    }
                });
            },
            getRandomColorSet(colorRange,firstLoad = false){
                var dat;
                var prevCount = 0;
                if(!firstLoad) {
                    prevCount = colorRange.lookupLen;
                 }
                colorRange.lookupLen = 0;
                wColor1.transparent();
                sprites.eachDrawableVisual(spr => {
                    if(spr.key.lx >= 0 && spr.key.lx < spr.image.w && spr.key.ly >= 0 && spr.key.ly < spr.image.h){
                        const size = 128;//(sprayMax + 1) | 0;
                        var cx = size;
                        var cy = size;
                        var x = (spr.key.lx | 0) - size;
                        var y = (spr.key.ly | 0) - size;
                        var x1 = (spr.key.lx | 0) + size;
                        var y1 = (spr.key.ly | 0) + size;
                        if( x < 0){
                            x = 0;
                            cx = spr.key.lx | 0;
                        }
                        if( y < 0){
                            y = 0;
                            cy = spr.key.ly | 0;
                        }
                        if(x1 > spr.image.w){ x1 = spr.image.w }
                        if(y1 > spr.image.h){ y1 = spr.image.h }
                        var w = x1 - x;
                        var h = y1 - y;
                        var dd,dd1;
                        if(paint.recycleDestination && !firstLoad){
                            dat = spr.image.ctx.getImageData(x, y,w,h).data;
                        }else{
                            dat = spr.image.desc.mirror.ctx.getImageData(x, y,w,h).data;
                        }
                        var maxDist = curves.curves.C.value * 100;
                        var pickup = firstLoad ? 1 : curves.curves.B.value;
                        const colCurve = curves.lineColor;
                        for(var i = 0; i < 256; i++){
                            const ang = Math.random() * Math.PI2;
                            const dist = colCurve(Math.random()) * maxDist;
                            var xx = Math.cos(ang) * dist + cx| 0;
                            var yy = Math.sin(ang) * dist + cy| 0;
                            if(xx >= 0 && xx < w && yy >= 0 && yy < h){
                                var idx = (xx + yy * w) * 4;
                                if(Math.random() < pickup){
                                    if(dat[idx + 3]  > 0){
                                        colorRange.lookup[colorRange.lookupLen++] = "rgba("+dat[idx++]+","+dat[idx++]+","+dat[idx++]+","+(dat[idx]/255)+")";
                                    }
                                }else{
                                    if(colorRange.lookupLen < prevCount){
                                        colorRange.lookupLen ++;
                                    }
                                }
                            }
                        }
                        return true;
                    }
                });
            },
            getHairColor(hairs,dryDist,add = false){
                var dat;
                wColor1.transparent();
                sprites.eachDrawableVisual(spr => {
                    if(spr.key._lx >= 0 && spr.key._lx < spr.image.w && spr.key._ly >= 0 && spr.key._ly < spr.image.h){
                        const size = 128;//(sprayMax + 1) | 0;
                        var cx = size;
                        var cy = size;
                        var x = (spr.key._lx | 0) - size;
                        var y = (spr.key._ly | 0) - size;
                        var x1 = (spr.key._lx | 0) + size;
                        var y1 = (spr.key._ly | 0) + size;
                        if( x < 0){
                            x = 0;
                            cx = spr.key._lx | 0;
                        }
                        if( y < 0){
                            y = 0;
                            cy = spr.key._ly | 0;
                        }
                        if(x1 > spr.image.w){ x1 = spr.image.w }
                        if(y1 > spr.image.h){ y1 = spr.image.h }
                        var w = x1 - x;
                        var h = y1 - y;
                        var xo = hairs.xo;
                        var yo = hairs.yo;
                        var dd,dd1;
                        if(paint.recycleDestination){
                            dat = spr.image.ctx.getImageData(x, y,w,h).data;
                        }else{
                            dat = spr.image.desc.mirror.ctx.getImageData(x, y,w,h).data;
                        }
                        var bright = 1;
                        if(randomColor){
                            if((mouse.button & 4) === 4){
                                bright = -(curves.curves.brushColor.value * 0.1 - 0.05);
                            }else{
                                bright = curves.curves.brushColor.value * 0.1 - 0.05;
                            }
                            if(bright < 0){
                                bright = 1 / (-bright + 1);
                            }else{
                                bright += 1;
                            }
                        }
                        for(var i = 0; i < hairs.size; i++){
                            const hr = hairs[i];
                            var xx = hr.x + cx - xo | 0;
                            var yy = hr.y + cy - yo | 0;
                            if(xx >= 0 && xx < w && yy >= 0 && yy < h){
                                const idx = (xx + yy * w) * 4;

                                    if(!add){
                                        hr.dryDist = dryDist;
                                        hr.a = 0;
                                        if(dat[idx + 3]  > 0){
                                            hr.r = dat[idx];
                                            hr.g = dat[idx + 1];
                                            hr.b = dat[idx + 2];
                                        }
                                        hr.a = dat[idx + 3] / 255;

                                    }else{
                                        if(paint.sizeBlend){
                                            dd = dryDist * curves.lineWidth(hr.distNorm);
                                            dd1 = (1-dd);
                                            dd *= bright
                                        }else{
                                            dd1 = (1-dryDist) ;
                                            dd = dryDist * bright;
                                        }
                                        if(dd < 0.1){
                                            if(Math.random() < dd * 10){
                                                dd = 0.1;
                                                dd1 = 0.9 *  bright;
                                                if(dat[idx + 3]  > 0){
                                                    hr.r = (hr.r * dd1 + dat[idx] * dd) | 0;
                                                    hr.g = (hr.g * dd1 + dat[idx + 1] * dd) | 0;
                                                    hr.b = (hr.b * dd1 + dat[idx + 2] * dd) | 0;
                                                    hr.r = hr.r > 255 ? 255 : hr.r < 0 ? 0 : hr.r;
                                                    hr.g = hr.g > 255 ? 255 : hr.g < 0 ? 0 : hr.g;
                                                    hr.b = hr.b > 255 ? 255 : hr.b < 0 ? 0 : hr.b;
                                                }
                                                hr.a = (hr.a * dd1 + (dat[idx + 3] / 255)  * dd) ;
                                                hr.a = hr.a > 1 ? 1 : hr.a < 0 ? 0 : hr.a;

                                            }
                                        }else{
                                            if(dat[idx + 3]  > 0){
                                                hr.r = (hr.r * dd1 + dat[idx] * dd) | 0;
                                                hr.g = (hr.g * dd1 + dat[idx + 1] * dd) | 0;
                                                hr.b = (hr.b * dd1 + dat[idx + 2] * dd) | 0;
                                                hr.r = hr.r > 255 ? 255 : hr.r < 0 ? 0 : hr.r;
                                                hr.g = hr.g > 255 ? 255 : hr.g < 0 ? 0 : hr.g;
                                                hr.b = hr.b > 255 ? 255 : hr.b < 0 ? 0 : hr.b;
                                            }
                                            hr.a = (hr.a * dd1 + (dat[idx + 3] / 255)  * dd) ;
                                            hr.a = hr.a > 1 ? 1 : hr.a < 0 ? 0 : hr.a;

                                        }
                                    }

                            }else{
                                if(add){
                                    hr.dryDist = dryDist;
                                }
                                hr.a = 0;
                                hr.a1 = 0;

                            }
                        }
                        return true;
                    }
                });
            }
        },
        gradient : {
            imageBrushMask(ctx, size2, curve){
                var i;
                const grad = ctx.createRadialGradient(size2,size2,0,size2,size2, size2);
                for(i = 0; i < size2; i ++){
                    const ii = i / size2;
                    grad.addColorStop(ii,"rgba(0,0,0,"+curve(1-ii)+")");
                }
                grad.addColorStop(0.99,"rgba(0,0,0,"+curve(0)+")");
                grad.addColorStop(1,"rgba(0,0,0,0)");
                return grad;
            },
            addStops(len, grad){
                var i = 0;
                if(gradientAlpha){
                    for(i = 0; i < len; i ++){
                        const ii = i / len;
                        const pos = curves.lineColor( ii );
                        grad.addColorStop(ii,colorRange.cssAtFixA(pos,curves.lineAlpha(ii)));
                    }
                    grad.addColorStop(1,colorRange.cssAtFixA(curves.lineColor( 1 ),curves.lineAlpha(1)));
                }else{
                    for(i = 0; i < len; i ++){
                        const ii = i / len;
                        const pos = curves.lineColor( ii );
                        grad.addColorStop(ii,colorRange.cssAt(pos));
                    }
                    grad.addColorStop(1,colorRange.cssAt(curves.lineColor( 1 )));
                }
            },
            lineLength(ctx,x,y,x1,y1){
                var i = 0;
                var dx = x1 - x;
                var dy = y1 - y;
                var len = Math.sqrt(dx * dx + dy * dy);
                const grad = ctx.createLinearGradient(x,y,x1,y1);
                renderFunctions.gradient.addStops(len,grad)
                return grad;
            },
            lineWidth(ctx,x,y,x1,y1,width){
                var i = 0;
                var dx = x1 - x;
                var dy = y1 - y;
                var len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
                dx *= width;
                dy *= width;
                x = (x1 + x) / 2;
                y = (y1 + y) / 2;
                const grad = ctx.createLinearGradient(x + dy,y - dx, x - dy, y + dx);
                renderFunctions.gradient.addStops(width * 2,grad)
                return grad;
            },
            rectangleLinear(ctx,x,y,w,h){
                const grad = ctx.createLinearGradient(x,y,x,y + h);
                renderFunctions.gradient.addStops(h,grad)
                return grad;
            },
            rectangleLinear90(ctx,x,y,w,h){
                const grad = ctx.createLinearGradient(x,y,x+w,y);
                renderFunctions.gradient.addStops(w,grad)
                return grad;
            },
            rectangleRadial(ctx,x,y,w,h){
                h /= 2;
                x += w / 2;
                y += h;
                const grad = ctx.createRadialGradient(x,y,0,x,y, h);
                renderFunctions.gradient.addStops(h,grad)
                return grad;
            }
        },
        alias : {
            line(ctx, x1,y1,x2,y2,skipFirst = false, render = true){
                var x,y;
                x1 = x = x1 | 0;
                y1 = y = y1 | 0;
                x2 |= 0;
                y2 |= 0;
                var dx = Math.abs(x2 - x1);
                var sx = x1 < x2 ? 1 : -1;
                var dy = -Math.abs(y2 - y1);
                var sy = y1 < y2 ? 1 : -1;
                var er = dx + dy;
                var e2;
                var end = false;
                if(skipFirst){
                    if (x1 === x2 && y1 === y2) {
                        end = true;
                    } else {
                        e2 = 2 * er;
                        if (e2 > dy) {
                            er += dy;
                            x1 += sx;
                        }
                        if (e2 < dx) {
                            er += dx;
                            y1 += sy;
                        }
                    }
                }
                if(render) { ctx.beginPath() }
                while (!end) {
                    ctx.rect(x1 , y1 , 1, 1);
                    if (x1 === x2 && y1 === y2) {
                        end = true;
                    } else {
                        e2 = 2 * er;
                        if (e2 > dy) {
                            er += dy;
                            x1 += sx;
                        }
                        if (e2 < dx) {
                            er += dx;
                            y1 += sy;
                        }
                    }
                }
                if(render){ ctx.fill() }
            },
        },
        antiAlias : {
            line(ctx,x1,y1,x2,y2){
                ctx.lineWidth = brushMin;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            },
            lineGradientTaper(ctx,x1,y1,x2,y2){
                var m = brushMin / 2 ;
                var M = paint.sizeBlend ? brushMax / 2 : m;
                var x = x2 - x1;
                var y = y2 - y1;
                const len = Math.sqrt(x * x + y * y);
                ctx.beginPath();
                if(len > Math.max(m, M) - Math.min(m, M)){
                    x /= len;
                    y /= len;
                    if(paint.gradientMode > 0){
                        if(paint.gradientMode === 1){
                            ctx.fillStyle = API.gradient.lineLength(ctx, x1 - x * m, y1 - y * m, x2 + x * M, y2 + y * M);
                        } else if(paint.gradientMode === 2){
                            ctx.fillStyle = API.gradient.lineWidth(ctx, x1 - x * m, y1 - y * m, x2 + x * M, y2 + y * M, Math.max(m,M));
                        }
                    }
                    var pheta = Math.acos((M - m) / len);
                    var ang = Math.atan2(y , x);
                    ctx.arc(x2,y2,M, ang -(Math.PI - pheta), ang -(Math.PI - pheta) + Math.PI2 - pheta * 2);
                    ctx.arc(x1,y1,m, ang -(Math.PI - pheta) + Math.PI2 - pheta * 2, ang -(Math.PI - pheta) + Math.PI2 - pheta * 2 + pheta * 2  );
                }else {
                    ctx.arc(x2,y2,Math.max(M,m),0, Math.PI2);
                }
                ctx.fill();
            }
        }
    };
    return API;
})();