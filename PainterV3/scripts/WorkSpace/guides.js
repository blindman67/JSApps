"use strict";
const guides = (()=> {
    const guides = [];
    const guidesExtra = { X : [],  Y : [],  Z : [],}
    var lockedGuideSpr;
    const colors = {  X : "red", Y : "#0C0", Z : "#88f" }
    const gMouse = {
        wox : 0,  // world origin (where the mouse is first down
        woy : 0,
        gridALocked : -1,
        gridBLocked : -1,
        minIndex : -1,
        count : 0,
        lockSet : false,
    }
    const API = {
        useOnly : 0b111, // bits 0-2 are X,Y,Z type guides
        availableAxies : 0,
        XGuideIndex : 0,
        ZGuideIndex : 0,
        YGuideIndex : 0,
        active : false,
        lockSet : false,
        surfaceLock : false,
        dontSetGuideLock : false,
        guides,
        ready() {
            mouse.gMouse = gMouse;
            guideFeedbackGlobalRender.ready(colors);
            guideFeedbackGlobalRender.updateActive(guides);
        },
        activateGrid(axis, state){
            for(const guide of guides){
                if(guide.grid.type === axis){ guide.grid.active = state }
            }
        },
        updateGuideIndexed(){
            guides.length = 0;
            API.XGuideIndex = guidesExtra.X.length ? API.XGuideIndex % guidesExtra.X.length : -1;
            API.YGuideIndex = guidesExtra.Y.length ? API.YGuideIndex % guidesExtra.Y.length : -1;
            API.ZGuideIndex = guidesExtra.Z.length ? API.ZGuideIndex % guidesExtra.Z.length : -1;
            if(API.XGuideIndex > -1) {API.availableAxies |= 1; guides.push(guidesExtra.X[API.XGuideIndex]) }
            if(API.YGuideIndex > -1) {API.availableAxies |= 2;  guides.push(guidesExtra.Y[API.YGuideIndex]) }
            if(API.ZGuideIndex > -1) {API.availableAxies |= 4;  guides.push(guidesExtra.Z[API.ZGuideIndex]) }
            var end = false;
            var i = 0;
            while(!end){
                end = true;
                if(i < guidesExtra.X.length){
                    if(i !== API.XGuideIndex) { guidesExtra.X[i].grid.active = false }
                    end = false;
                }
                if(i < guidesExtra.Y.length){
                    if(i !== API.YGuideIndex) { guidesExtra.Y[i].grid.active = false }
                    end = false;
                }
                if(i < guidesExtra.Z.length){
                    if(i !== API.ZGuideIndex) { guidesExtra.Z[i].grid.active = false }
                    end = false;
                }
                i++;
            }
        },
        setSpacingLock(){
            if (!settings.drawSpacingGuid) { return }
            for(const spr of guides){
                if(spr.grid.active){
                    const g = spr.grid;
                    if(g.spacing){
                        if(g.spacing.on){
                            g.spacing.on = false;
                        }else{
                            g.lockSpacing = true;
                        }
                    }else{
                        g.spacing  = {};
                        g.lockSpacing = true;

                    }
                }
            }

        },
        update(){
            guidesExtra.X.length = 0;
            guidesExtra.Y.length = 0;
            guidesExtra.Z.length = 0;
            API.active = false;
            if(sprites.hasGuides){
                sprites.eachGridLike(spr => {
                    guidesExtra[spr.grid.type].push(spr);
                    spr.color = colors[spr.grid.type];
                    if(spr.grid.typeBit & API.useOnly) { API.active = true }
                });
            }
            API.updateGuideIndexed();
        },
        doMouse(mouse, cid){
            const vScale = view.scale;
            const snapDist = 30 / vScale;
            const cMouse = mouse.cMouse;
            if(pens.canSnap && paint.gridCanSnap) { 
                var snapPoint = snaps.findSnap(cMouse.rx,cMouse.ry,snapDist);
                if(snapPoint){
                    cMouse.rx = snapPoint.x;
                    cMouse.ry = snapPoint.y;
                    cMouse.overSnap = true;
                    cMouse.overSnapPoint = snaps.foundPoint;
                    cMouse.overSnapLine = snaps.foundLine;
                    cMouse.overSnapCircle = snaps.foundCircle;
                }else{
                    cMouse.overSnap = false;
                    cMouse.overSnapPoint = undefined;
                    cMouse.overSnapLine = undefined;
                    cMouse.overSnapCircle = undefined;
                }
            }
            if (!API.active) {
                gMouse.gridALocked = -1;
                gMouse.gridBLocked = -1;
                if(mouse.captured === 0){ lockedGuideSpr = undefined  }
                return;
            }

            var minDist = Infinity;
            var minSpr,minGuide,minIndex,dx,dy, count = 0;
            const lockingDist = 10 / vScale;
            const highlightDist = 100 / vScale;

            if ((cMouse.over || mouse.captured === cid) && editSprites.drawingModeOn && (paint.gridGuides || paint.gridCanSnap)  ) {

                if (mouse.captured === 0) {
                    gMouse.lockSet = false;
                    lockedGuideSpr = undefined;
                    gMouse.wox = cMouse.rx;
                    gMouse.woy = cMouse.ry;
                    gMouse.gridALocked = -1;
                    gMouse.gridBLocked = -1;
                    gMouse.startDist = -1;

                    for(const spr of guides){
                        if(spr.grid.active){
                            spr.setGridLine(gMouse.wox, gMouse.woy);
                            spr.grid.lockedOn = false;
                        }
                    }
                }else if(mouse.captured === cid){
                    if(!API.surfaceLock){
                        if (gMouse.lockSet) {
                            lockedGuideSpr.getGridPos(cMouse.rx, cMouse.ry);
                            cMouse.rx = lockedGuideSpr.grid.x;
                            cMouse.ry = lockedGuideSpr.grid.y;
                            gMouse.startDist = lockedGuideSpr.grid.sDist;
                            gMouse.dist = lockedGuideSpr.grid.wDist;
                            for(const spr of guides){
                                if(spr.grid.active){
                                    if (! spr.grid.lockedOn) { spr.setGridLine(cMouse.rx, cMouse.ry, paint.gridCanSnap) }
                                }
                            }
                        }else{
                            for(const spr of guides){

                                const g = spr.grid;
                                if(g.active){
                                    g.lockedOn = false;
                                    if(g.typeBit & API.useOnly) {
                                        const dist = spr.getGridPos(cMouse.rx, cMouse.ry);
                                        if (dist < minDist) {
                                            minDist = dist;
                                            minGuide = g;
                                            lockedGuideSpr = spr;
                                        }
                                    }
                                }
                            }
                            if (minGuide) {
                                minGuide.lockedOn = true;
                                cMouse.rx = minGuide.x;
                                cMouse.ry = minGuide.y;
                                if(!API.dontSetGuideLock) {
                                    const dx = gMouse.wox - cMouse.rx;
                                    const dy = gMouse.woy - cMouse.ry;
                                    const dist = Math.sqrt(dx * dx + dy * dy);
                                    if (dist > lockingDist) {
                                        gMouse.lockSet = true;
                                    }
                                }
                            }
                        }
                    }else{
                        for(const spr of guides){
                            const g = spr.grid;
                            if(g.active){
                                g.lockedOn = false;
                                g.feedbackSize = 0;
                                if (count !== gMouse.gridALocked && count !== gMouse.gridBLocked ) {
                                    const dist = spr.getGridPos(cMouse.rx, cMouse.ry);
                                    if (dist < minDist) {
                                        minDist = dist;
                                        minGuide = g;
                                        minIndex = count;
                                    }
                                }
                            }
                            count ++;
                        }
                        gMouse.count = count;
                        if (minGuide) {
                            gMouse.minIndex = minIndex;
                            minGuide.lockedOn = true;
                            cMouse.rx = minGuide.x;
                            cMouse.ry = minGuide.y;
                            dx = cMouse.rx - gMouse.wox;
                            dy = cMouse.ry - gMouse.woy;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            minGuide.feedbackSize = dist < highlightDist ? 1 - (dist / highlightDist) : 0;
                            if (gMouse.gridALocked === -1 && minDist < 15) {
                                if (dist > 15) { gMouse.gridALocked = minIndex }
                            } else if (gMouse.gridALocked !== -1 && gMouse.gridBLocked === -1 && minDist < 15) {
                                if (dist > 15) { gMouse.gridBLocked = minIndex }
                            }
                        }
                    }
                }
            }else{
                if(mouse.captured === 0){ lockedGuideSpr = undefined  }
            }
            return

        },
    }
    return API;
})();
const guideFeedbackGlobalRender = (()=>{
    const workPoints = [utils.point, utils.point,utils.point, utils.point,utils.point, utils.point];
    const wp = utils.point;
    const wps = workPoints;
    var gMouse;
    var lineColors;
    var mmMax;
    var highLightLineSize = 1;
    const colorLine = ["",1,"",1,"",1]; // holds color and line width
    const colors = ["","","","","",""];
    const drawLineAway = (ctx,dist,awayIndex,alongIndex) => {
        view.apply();
        ctx.beginPath();
        ctx.strokeStyle = colorLine[alongIndex];
        const x = wps[awayIndex + 1].x;
        const y = wps[awayIndex + 1].y;
        var xx = x + dist * wps[awayIndex].x;
        var yy = y + dist * wps[awayIndex].y;
        var dx = mmMax * wps[alongIndex].x;
        var dy = mmMax * wps[alongIndex].y;
        ctx.lineTo(xx - dx, yy - dy);
        ctx.lineTo(xx + dx, yy + dy);
        xx = x - dist * wps[awayIndex].x;
        yy = y - dist * wps[awayIndex].y;
        ctx.moveTo(xx - dx, yy - dy);
        ctx.lineTo(xx + dx, yy + dy);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.lineWidth = colorLine[alongIndex + 1];
        ctx.stroke();
    }
    const drawLineForCircle = (ctx, pointIndex) => {
        view.apply();
        ctx.beginPath();
        ctx.strokeStyle = colorLine[pointIndex];
        const x = wps[pointIndex + 1].x;
        const y = wps[pointIndex + 1].y;
        var dx = mmMax * wps[pointIndex].x;
        var dy = mmMax * wps[pointIndex].y;
        ctx.lineTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.lineWidth = colorLine[pointIndex + 1];
        ctx.stroke();
    }
    const drawLine = (ctx, pointIndex) => {
        view.apply();
        ctx.beginPath();
        ctx.strokeStyle = colorLine[pointIndex];
        ctx.lineTo(wps[pointIndex].x, wps[pointIndex++].y);
        ctx.lineTo(wps[pointIndex].x, wps[pointIndex].y);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.lineWidth = colorLine[pointIndex];
        ctx.stroke();
    }
    const drawSpacing = (ctx, gSpr, idx) => {
        if (!settings.drawSpacingGuid) { return }
        const g = gSpr.grid;
        const x1 = gSpr.x;
        const y1 = gSpr.y;
        var sx =  g.sx;
        var sy =  g.sy;
        view.apply();
        ctx.beginPath();
        ctx.strokeStyle = colorLine[idx];
        var x2 = x1 + Math.cos(gSpr.rx) * 1000;
        var y2 = y1 + Math.sin(gSpr.rx) * 1000;
        if(g.spacing && g.spacing.on){
            wp.x = g.spacing.cx;
            wp.y = g.spacing.cy;
            sx = g.spacing.sx;
            sy = g.spacing.sy;
        }else{
            getClosestPointOnLine(x1,y1,x2,y2,sx,sy,wp);
        }
        var dx = sx - wp.x;
        var dy = sy - wp.y;

        var h = Math.sqrt(dx * dx + dy * dy);
        var nx = wp.x - x1;
        var ny = wp.y - y1;
        const dist = Math.sqrt(nx * nx + ny * ny);
        nx /= dist;
        ny /= dist;
        dx /= h;
        dy /= h;
        dx *= mmMax;
        dy *= mmMax;
        var sDist = dist;
        if(g.lockSpacing){

            g.spacing.cx = wp.x;
            g.spacing.cy = wp.y;
            g.spacing.sx = g.sx;
            g.spacing.sy = g.sy;

        }
        if(g.spacing && g.spacing.on){

            var w = g.spacing.width;
        }else{
            if(g.lockedOn){
                getClosestPointOnLine(x1,y1,x2,y2,g.x,g.y,wp);
                var xx = wp.x - x1;
                var yy = wp.y - y1;
                var dd = Math.sqrt(xx * xx + yy * yy);
                var w = dist- dd;
            }else{
                var w = gSpr.h / 2;
            }
        }
        if(g.lockSpacing){
            g.lockSpacing = false;
            g.spacing.width = w;
            g.spacing.on = true;
        }
        const s = h / dist;
        const s1 = w / h;
        var i = 0;


        x2 = x1 + nx * sDist;
        y2 = y1 + ny * sDist;
        while(w > 1 && i++ < 20){

            ctx.moveTo(x2-dx,y2-dy);
            ctx.lineTo(x2+dx,y2+dy);
            sDist -= w;
            x2 = x1 + nx * sDist;
            y2 = y1 + ny * sDist;
            h -= s * w
            w = h * s1;
        }
        ctx.setTransform(1,0,0,1,0,0);
        ctx.lineWidth = 0.5;
        ctx.stroke();


    }
    var guideList;
    const API = {
        ready(colors){
            lineColors = colors;
            gMouse = mouse.gMouse;
        },
        updateActive(_guideList){
            guideList = _guideList;
        },
        surfaceCircle(ctx, common){
            if(guideList.length > 0){
                var dx,dy,c = 0, pIdx = 0;
                const max = common.maxLineLen;
                mmMax = max;
                const A = gMouse.gridALocked;
                const B = gMouse.gridBLocked;
                const x = gMouse.wox;
                const y = gMouse.woy;
                const rad = gMouse.guideCircleRadius;
                var lockedOnGrid;
                highLightLineSize = Math.sin(globalTime / 250) + 2;
                for(const spr of guideList){
                    const g = spr.grid;
                    colorLine[pIdx] = lineColors[g.type];
                     if(g.lockedOn){
                        dx = Math.cos(g.angle) * max;
                        dy = Math.sin(g.angle) * max;
                        colorLine[pIdx + 1] = (Math.sin(globalTime / (100 + (250 * (1-g.feedbackSize)))) + 2) * (g.feedbackSize + 1);
                    }else{
                        colorLine[pIdx + 1] = 1;
                        spr.getGridLine(mouse.cMouse.rx, mouse.cMouse.ry);
                        dx = Math.cos(g.wangle) * max;
                        dy = Math.sin(g.wangle) * max;
                    }
                    wps[pIdx++].as(dx,dy);
                    wps[pIdx++].as(x, y);
                    if (!spr.type.grid) { drawSpacing(ctx, spr, c) }
                    c++
                }
                if(A !== -1 && B !== -1 && rad > 2){
                    drawLineAway(ctx,rad,A * 2, B * 2);
                    drawLineAway(ctx,rad,B * 2, A * 2);

                }else{
                    colorLine[pIdx + 1]
                    drawLineForCircle(ctx,0);
                    drawLineForCircle(ctx,2);
                    drawLineForCircle(ctx,4);
                }
            }
        },
        surfaceRectange(ctx, common){
            if(guideList.length > 0){
                const wps = workPoints;
                var dx, dy, pIdx = 0, c = 0;
                const A = gMouse.gridALocked;
                const B = gMouse.gridBLocked;
                const max = common.maxLineLen;
                const x = gMouse.wox;
                const y = gMouse.woy;
                var lockedOnGrid;
                for(const spr of guideList){
                    const g = spr.grid;
                    colorLine[pIdx] = lineColors[g.type];
                    if(A === c || B === c){
                        dx = Math.cos(g.angle) * max;
                        dy = Math.sin(g.angle) * max;
                        colorLine[pIdx + 1] = 2;
                    }else{
                        colorLine[pIdx + 1] = 1;
                        spr.getGridLine(mouse.cMouse.rx, mouse.cMouse.ry);
                        dx = Math.cos(g.wangle) * max;
                        dy = Math.sin(g.wangle) * max;
                    }
                    wps[pIdx++].as(x - dx, y - dy);
                    wps[pIdx++].as(x + dx, y + dy);
                    if (!spr.type.grid) { drawSpacing(ctx, spr, c) }
                    c ++;
                }
                if(pIdx > 0){
                    drawLine(ctx,0);
                    if(pIdx > 2){
                        drawLine(ctx,2);
                        if(pIdx > 4){
                            drawLine(ctx,4);
                        }
                    }
                }
            }
        },
        render(ctx, common){
            if(guideList.length > 0){
                const wps = workPoints;
                var dx,dy,pIdx = 0;
                var c = 0;
                const A = gMouse.gridALocked;
                const B = gMouse.gridBLocked;
                const max = common.maxLineLen;
                mmMax = max;
                const x = mouse.cMouse.rx;
                const y = mouse.cMouse.ry;
                var lockedOnGrid;
                ctx.strokeStyle = "black";
                for(const spr of guideList){

                    const g = spr.grid;
                    colorLine[pIdx] = lineColors[g.type];
                    if(g.lockedOn){
                        colorLine[pIdx + 1] = 2;
                        dx = Math.cos(g.angle) * max;
                        dy = Math.sin(g.angle) * max;

                    }else{
                        spr.getGridLine(mouse.cMouse.rx,mouse.cMouse.ry);
                        colorLine[pIdx + 1] = 1;
                        dx = Math.cos(g.wangle) * max;
                        dy = Math.sin(g.wangle) * max;
                    }
                    wps[pIdx++].as(x - dx, y - dy);
                    wps[pIdx++].as(x + dx, y + dy);
                    if (!spr.type.grid) { drawSpacing(ctx, spr, c) }
                    c ++;
                }
                if(pIdx > 0){
                    drawLine(ctx,0);
                    if(pIdx > 2){
                        drawLine(ctx,2);
                        if(pIdx > 4){
                            drawLine(ctx,4);
                        }
                    }
                }
                return;

            }
        },
    };
    return API;
})();