"use strict";
const CanvasGroover = (()=>{

    const PI2 = Math.PI * 2;
    const PI90 = Math.PI / 2;
    const PI = Math.PI;
    const PI270 = Math.PI * 1.5;
    const defaultFeatureSize = 10;
    const defaultFeatureAspect = 1;
    const defaultFeatureArcStart = 0;
    const defaultFeatureArcEnd = PI2;
    const workPoint1 = {x : 0, y : 0};
    const workPoint2 = {x : 0, y : 0};
    const rect1 = {x : 0, y : 0, width : 100, height : 100};
    const rect2 = {x : 0, y : 0, width : 100, height : 100};
    const transformArray = [1,0,0,1,0,0];
    var tx,ty,vx,vy,nx,ny, dist;
    var fillCan, fctx; // canvas used for fill operations;
    function pointsToCoords(points) {
        var p;
        if(Array.isArray(points[0])){
            p = [];
            for(var i = 0; i < points.length; i++) { p.push(...points[i]) }
        } else if(!isNaN(points[0])){
            p = points;
        } else {
            for(var i = 0; i < points.length; i++) { p.push(points[i].x, points[i].y) }
        }
        return p;
    }
    function circlesToCoords(circles) {
        var c;
        if(Array.isArray(circles[0])){
            c = [];
            for(var i = 0; i < circles.length; i++) { c.push(...circles[i]) }
        } else if(!isNaN(circles[0])){ c = circles }
        else {
            for(var i = 0; i < circles.length; i++) {
                c.push(circles[i].x, circles[i].y, circles[i].r !== undefined ? circles[i].r : circles[i].radius);
            }
        }
        return c;
    }
    function normalizeLine(x1,y1,x2,y2) {
        vx = x2 - x1;
        vy = y2 - y1;
        dist = Math.sqrt(vx * vx + vy * vy);
        nx = vx / dist;
        ny = vy / dist;
    }
    function crossProductLines(x1, y1, x2, y2, x3, y3) {
        return (x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2);
    }
    function transformPoint(x1,y1,width,length) {
        tx = x1 * nx * length - y1 * ny * width;
        ty = x1 * ny * length + y1 * nx * width;
    }
    function setRect(x, y, w, h, rect = {}) {
        rect.x = x;
        rect.y = y;
        rect.width = w;
        rect.height = h;
        return rect;
    }
    function matrixTransformPoint(x, y, transform, point = {}){
        const m = transform;
        point.x = x * m[0] + y * m[2] + m[4];
        point.y = x * m[1] + y * m[3] + m[5];
    }
    function fitRectOverRect(rect, angle, rectToFit, resultTransformArray = []){
        const iw = rectToFit.width / 2;
        const ih = rectToFit.height / 2;
        const cw = rect.width / 2;
        const ch = rect.height / 2;
        const dist = Math.sqrt(cw * cw + ch * ch);
        const diagAngle = Math.asin(ch / dist);
        var a1 = ((angle % PI2)+ PI2) % PI2;
        if (a1 > PI) { a1 -= PI }
        if (a1 > PI90 && a1 <= PI) { a1 = PI90 - (a1 - PI90)}
        const scale = Math.max(
            Math.cos(Math.abs(diagAngle - Math.abs(a1))) * dist / iw,
            Math.cos(PI90 - diagAngle - Math.abs(a1)) * dist / ih
        );
        const dx = Math.cos(angle) * scale;
        const dy = Math.sin(angle) * scale;
        resultTransformArray[0] = dx;
        resultTransformArray[1] = dy;
        resultTransformArray[2] = -dy;
        resultTransformArray[3] = dx;
        resultTransformArray[4] = rect.x + cw;
        resultTransformArray[5] = rect.y + ch;
        return resultTransformArray;
    }
    function circleTangents(x1, y1, r1, x2, y2, r2, lines = {}){
        const vx = (x2 - x1);
        const vy = (y2 - y1);
        const distSq = vx * vx + vy * vy;
        lines.count = 0;
        if (distSq <= (r1 - r2) * (r1 - r2)) { return lines}
        if (lines.array === undefined) { lines.array = [] }
        const dist = Math.sqrt(distSq);
        const nx = vx / dist;
        const ny = vy / dist;
        var i = 0;
        for (var sign1 = 1; sign1 >= -1; sign1 -= 2) {
            const c = (r1 - sign1 * r2) / dist;
            if (c * c <= 1) {
                const h = Math.sqrt(Math.max(0 , 1 - c * c));
                for (var sign2 = 1; sign2 >= -1; sign2 -= 2) {
                    const x = nx * c - sign2 * h * ny;
                    const y = ny * c + sign2 * h * nx;
                    lines.array[i++] = x1 + r1 * x;
                    lines.array[i++] = y1 + r1 * y;
                    lines.array[i++] = x2 + sign1 * r2 * x;
                    lines.array[i++] = y2 + sign1 * r2 * y;
                    lines.count += 1;
                }
            }
        }
        return lines;
    }
    /*== Marks Extension support =====================================================================================*/
    const marks = {
        x(x,y){
            const size = this.featureSize / 2;
            this.moveTo(x - size, y - size);
            this.lineTo(x + size, y + size);
            this.moveTo(x - size, y + size);
            this.lineTo(x + size, y - size);
            return this;
        },
        dimond(x,y){
            const size = this.featureSize / 2;
            this.moveTo(x - size, y);
            this.lineTo(x, y - size);
            this.lineTo(x + size, y);
            this.lineTo(x, y + size);
            this.closePath();
            return this;
        },
        triangle(x,y){
            const size = this.featureSize / 2;
            this.moveTo(x, y - size);
            this.lineTo(x + size * 0.866, y + size * 0.5);
            this.lineTo(x - size * 0.866, y + size * 0.5);
            this.closePath();
            return this;
        },
        cross(x,y){
            const size = this.featureSize / 2;
            this.moveTo(x - size, y);
            this.lineTo(x + size, y);
            this.moveTo(x, y + size);
            this.lineTo(x, y - size);
            return this;
        },
        box(x,y){
            const size = this.featureSize;
            this.rect(x - size / 2, y - size / 2, size, size);
            return this;
        },
        circle(x,y){
            const size = this.featureSize;
            this.moveTo(x + size / 2, y);
            this.arc(x, y, size / 2, 0, PI2);
            return this;
        },
    }
    /*== Arrow Extension support =====================================================================================*/
    const arrows = {
        none : {
            dist : 0,
            path : [],
            closed : false,
        },
        open : {
            dist : 0,
            path : [1,1,0,0,1,-1],
            closed : false,
        },
        closed : {
            dist : 1,
            path : [1,1,0,0,1,-1],
            closed : true,
        },
        closedInset : {
            dist : 0.5,
            path : [0.5,0,1,1,0,0,1,-1],
            closed : true,
        },
        flat : {
            dist : 0.0,
            path : [0,1,0,-1],
            closed : false,
        },
        cross : {
            dist : 0.0,
            path : [-0.5,1,0.5,-1,"m",-0.5,-1,0.5,1],
            closed : false,
        },
        boxOver : {
            dist : 0.5,
            path : [-0.5,1,-0.5,-1,0.5,-1,0.5,1],
            closed : true,
        },
        box : {
            dist : 0.5,
            path : [0,1,0,-1,1,-1,1,1],
            closed : close,
        },
        sharp : {
            dist : 0.5,
            path : [0.5,0, 1,1, 0.75,0.5, 0,0, 0.75,-0.5, 1,-1],
            closed : true,
        },
        blunt : {
            dist : 0.5,
            path : [0.5,0, 1,1, 0.25,0.6, 0,0, 0.25,-0.6, 1,-1],
            closed : true,
        },
    }
    /*== Gradient Extension support ==================================================================================*/
    function interpolateHSLGradient(gradient,start,end,startCol, endCol, dist){
        var hslStart, hslEnd, step, hslStep =[];
        if(startCol.indexOf("hsla") > -1){
            hslStart = startCol.replace(/hsla\(|\)|\%/g,"").split(",").map(num=>Number(num));
        }else if(startCol.indexOf("hsl") > -1){
            hslStart = startCol.replace(/hsl\(|\)|\%/g,"").split(",").map(num=>Number(num));
            hslStart.push(1);
        }
        if(endCol.indexOf("hsla") > -1){
            hslEnd = endCol.replace(/hsla\(|\)|\%/g,"").split(",").map(num=>Number(num));
        }else if(endCol.indexOf("hsl") > -1){
            hslEnd = endCol.replace(/hsl\(|\)|\%/g,"").split(",").map(num=>Number(num));
            hslEnd.push(1);
        }
        hslStep[0] = (hslEnd[0] - hslStart[0]) / dist;
        hslStep[1] = (hslEnd[1] - hslStart[1]) / dist;
        hslStep[2] = (hslEnd[2] - hslStart[2]) / dist;
        hslStep[3] = (hslEnd[3] - hslStart[3]) / dist;
        step = (end-start) / dist;
        for(var i = 0; i < dist; i ++){
            gradient.addColorStop(start + step * i,
                "hsla(" + (((hslStart[0] + hslStep[0] * i) | 0) % 360) + "," +
                           ((hslStart[1] + hslStep[1] * i) | 0) + "%," +
                           ((hslStart[2] + hslStep[2] * i) | 0) + "%," +
                            (hslStart[3] + hslStep[3] * i) + ")"
            );
        }
    }
    /*== Fill Extension support ======================================================================================*/
    const floodFillResult = {
        painted : null,
        imgData : null,
        top : 0,
        right : 0,
        bottom : 0,
        left : 0,
        pixels : 0,
    };
    const floodFillClip = {
        x: 0, y:0, x1: 0, y1: 0, use: false,
        isPointOver: (x, y) => (x >= floodFillClip.x && y >= floodFillClip.y && x < floodFillClip.x1 && y < floodFillClip.y1),
    };
    function fillAll(x, y, imgData, tolerance, clearFilled = false) {
        x |= 0;
        y |= 0;
        const w = imgData.width;
        const h = imgData.height;
        const d = imgData.data;
        const data32 = new Uint32Array(d.buffer);
        const size = data32.length;
        const rightPos = w - 1;
        const difMap = new Uint8ClampedArray(size);
        const painted = new Uint8ClampedArray(size);
        var lookLeft, lookRight, idx, idx4, dif, minIdx, maxIdx, minModIdx, maxModIdx, mIdx, count, sa, sr, sg, sb, R, G, B, A;
        function checkPixelTolerance(idx4){
            R = sr - d[idx4];
            G = sg - d[idx4 + 1];
            B = sb - d[idx4 + 2];
            A = sa - d[idx4 + 3];
            return tolerance > (dif = (R * R + B * B + G * G + A * A) ** 0.5);
        }
        function checkPixelNonTrans(idx4){
            dif = d[idx4 + 3] > 0 ? 1 : 0;
            return dif > 0;
        }
        
        idx = (y * w + x) * 4;        
        sr = d[idx];
        sg = d[idx+1];
        sb = d[idx+2];
        sa = d[idx+3];
        var checkPixel = checkPixelTolerance;
        if(tolerance < 0){
            checkPixel = checkPixelNonTrans;
        } else {
            tolerance = (tolerance * tolerance * 4) ** 0.5; // 4D RGBA max distance
        }
        idx4 = idx = 0;
        maxIdx = minIdx = idx;
        maxModIdx = minModIdx = idx % w;
        count = 0;
        while (idx < size) {
            if (checkPixel(idx4)) {
                painted[idx] = 1;
                difMap[idx] = tolerance < 0 ? 255 - dif : (tolerance - dif) / tolerance * 255;
                data32[idx] = clearFilled ? 0 : data32[idx];
                count ++;
                mIdx = idx % w;
                minIdx = idx < minIdx ? idx : minIdx;
                maxIdx = idx > maxIdx ? idx : maxIdx;
                minModIdx = mIdx < minModIdx ? mIdx : minModIdx;
                maxModIdx = mIdx > maxModIdx ? mIdx : maxModIdx;
            }
            idx ++;
            idx4 += 4;
        }
        floodFillResult.painted = difMap;
        floodFillResult.imgData = imgData;
        floodFillResult.d32 = data32;
        floodFillResult.d8 = d;
        floodFillResult.top = minIdx / w | 0;
        floodFillResult.bottom = maxIdx / w | 0;
        floodFillResult.left = minModIdx;
        floodFillResult.right = maxModIdx;
        floodFillResult.pixels = count;
    }
    function floodFill(x, y, diagonal, imgData, tolerance, clearFilled = false) {
        var lookLeft, lookRight, ind, dif, minIdx, maxIdx, minModIdx, maxModIdx, mIdx, count, sa, sr, sg, sb, R, G, B, A;
        x |= 0;
        y |= 0;
        const w = imgData.width;
        const h = imgData.height;
        const wUL = - w - 1; // up left
        const wUR = - w + 1; // up right
        const d = imgData.data;
        const data32 = new Uint32Array(d.buffer);
        const size = data32.length;
        const rightPos = w - 1;
        const stack = [];
        const difMap = new Uint8ClampedArray(w * h);
        const painted = new Uint8ClampedArray(w * h);

        ind = (y * w + x) * 4;
        sr = d[ind];
        sg = d[ind+1];
        sb = d[ind+2];
        sa = d[ind+3];
        // Three versions to improve performance
        function checkPixelLeftTolerance(ind){
            if(painted[ind] > 0 || ind < 0 || ind >= size || (ind % w) === rightPos) { return false }
            const i = ind << 2;
            R = sr - d[i];
            G = sg - d[i + 1];
            B = sb - d[i + 2];
            A = sa - d[i + 3];
            return tolerance > (dif = (R * R + B * B + G * G + A * A) ** 0.5);
        }
        function checkPixelRightTolerance(ind){
            if(painted[ind] > 0 || ind < 0 || ind >= size || (ind % w) === 0) { return false }
            const i = ind << 2;
            R = sr - d[i];
            G = sg - d[i + 1];
            B = sb - d[i + 2];
            A = sa - d[i + 3];
            return tolerance > (dif = (R * R + B * B + G * G + A * A) ** 0.5);
        }
        function checkPixelTolerance(ind){
            if(painted[ind] > 0 || ind < 0 || ind >= size) { return false }
            const i = ind << 2;
            R = sr - d[i];
            G = sg - d[i + 1];
            B = sb - d[i + 2];
            A = sa - d[i + 3];
            return tolerance > (dif = (R * R + B * B + G * G + A * A) ** 0.5);
        }
        function checkPixelLeftNonTrans(ind){
            if(painted[ind] > 0 || ind < 0 || ind >= size || (ind % w) === rightPos) { return false }
            dif = d[(ind << 2) + 3] > 0 ? 1 : 0;
            return dif > 0;
        }
        function checkPixelRightNonTrans(ind){
            if(painted[ind] > 0 || ind < 0 || ind >= size || (ind % w) === 0) { return false }
            dif = d[(ind << 2) + 3] > 0 ? 1 : 0;
            return dif > 0;
        }
        function checkPixelNonTrans(ind){
            if(painted[ind] > 0 || ind < 0 || ind >= size) { return false }
            dif = d[(ind << 2) + 3] > 0 ? 1 : 0;
            return dif > 0;
        }

        var checkPixel = checkPixelTolerance;
        var checkPixelRight = checkPixelRightTolerance;
        var checkPixelLeft = checkPixelLeftTolerance;
        if(tolerance < 0){
            checkPixel = checkPixelNonTrans;
            checkPixelRight = checkPixelRightNonTrans;
            checkPixelLeft= checkPixelLeftNonTrans;
        } else {
            tolerance = (tolerance * tolerance * 4) ** 0.5; // 4D RGBA max distance
        }

        ind = y * w + x;
        maxIdx = minIdx = ind;
        maxModIdx = minModIdx = ind % w;
        count = 0;
        stack.push(ind);
        while (stack.length) {
            ind = stack.pop();
            while (checkPixel(ind - w)) { ind -= w }
            if(diagonal){
                if (!checkPixelLeft(ind - 1) && checkPixelLeft(ind + wUL)) { stack.push(ind + wUL) }
                if (!checkPixelRight(ind + 1) && checkPixelRight(ind + wUR)) { stack.push(ind + wUR) }
            }
            lookRight = lookLeft = false;
            while (checkPixel(ind)) {
                painted[ind] = 1;
                difMap[ind] = tolerance < 0 ? 255 - dif : (tolerance - dif) / tolerance * 255;
                data32[ind] = clearFilled ? 0 : data32[ind];
                count ++;
                mIdx = ind % w;
                minIdx = ind < minIdx ? ind : minIdx;
                maxIdx = ind > maxIdx ? ind : maxIdx;
                minModIdx = mIdx < minModIdx ? mIdx : minModIdx;
                maxModIdx = mIdx > maxModIdx ? mIdx : maxModIdx;

                if (checkPixelLeft(ind - 1)) {
                    if (!lookLeft) {
                        stack.push(ind - 1);
                        lookLeft = true;
                    }
                } else if (lookLeft) { lookLeft = false }
                if (checkPixelRight(ind + 1)) {
                    if (!lookRight) {
                        stack.push(ind + 1);
                        lookRight = true;
                    }
                } else if (lookRight) { lookRight = false }
                ind += w;
            }
            if (diagonal) {
                if (checkPixelLeft(ind - 1) && !lookLeft) { stack.push(ind - 1) }
                if (checkPixelRight(ind + 1) && !lookRight) { stack.push(ind + 1) }
            }
        }


        floodFillResult.painted = difMap;
        floodFillResult.imgData = imgData;
        floodFillResult.d32 = data32;
        floodFillResult.d8 = d;
        floodFillResult.top = minIdx / w | 0;
        floodFillResult.bottom = maxIdx / w | 0;
        floodFillResult.left = minModIdx;
        floodFillResult.right = maxModIdx;
        floodFillResult.pixels = count;

    }
    function createFillMask(tolerance, aliasEdge = false, maskCol = 0xFFFFFFFF){
        const painted = floodFillResult.painted;
        const d32 = floodFillResult.d32;
        const d = floodFillResult.d8;
        const size = d32.length;
        const w = floodFillResult.imgData.width;
        const h = floodFillResult.imgData.height;
        const rightPos = w - 1;
        const bottomPos = h - 1;
        var ind = 0;
        floodFillResult.maskColor = maskCol
        const mask = maskCol;
        const minDif = 255 - tolerance;
        if(aliasEdge){
            while(ind < size){
                if(painted[ind]){
                    var edge = 0;
                    const x = ind % w;
                    const y = ind / w | 0;
                    if (x > 0 && painted[ind - 1] === 0) { edge = 1 }
                    else if (x < rightPos && painted[ind + 1] === 0) { edge = 1 }
                    else if (y > 0 && painted[ind - w] === 0) { edge = 1 }
                    else if (y < bottomPos && painted[ind + w] === 0) { edge = 1 }

                    if (edge) {
                        d32[ind] = mask;
                        d[(ind << 2) + 3] = painted[ind];
                    } else { d32[ind] = painted[ind] > 0 ? mask : 0 }
                }else{ d32[ind] = 0 }
                ind ++;
            }
        }else{
            while (ind < size) {
                d32[ind] = painted[ind] > 0 ? mask : 0;
                ind++;
            }
        }
    }
    const maskBoolOps = {
        // b1 is painted buffer 1 and b2 is painted buffer 2, idx is the pixel index. Result in b1
        or(idx, b1, b2) {
            if (b1[idx] && b2[idx]) { b1[idx] = b2[idx] > b1[idx] ? b2[idx] : b1[idx] }
            else { b1[idx] = b1[idx] ? b1[idx] : b2[idx] ? b2[idx] : 0 }
        },
        and(idx, b1, b2) { b1[idx] = b1[idx] && b2[idx] ? (b2[idx] + b2[idx]) / 2 : 0 },
        remove(idx, b1, b2) { b1[idx] = b1[idx] && !b2[idx] ? b1[idx] : 0 },
    }
    function boolMask(op,paintedA, paintedB){
        const bool =  maskBoolOps[op];
        const d32 = floodFillResult.d32;
        const d = floodFillResult.d8;
        const size = paintedA.length;
        const w = floodFillResult.imgData.width;
        const mask = floodFillResult.maskColor;
        var ind = 0;
        var maxIdx,minIdx,maxModIdx,minModIdx;

        while (ind < size) {
            bool(ind, paintedA, paintedB);
            if(paintedA[ind]){
                d32[ind] = paintedA[ind] ? mask : 0;
                var mIdx = ind % w;
                if(minIdx !== undefined){
                    minIdx = ind < minIdx ? ind : minIdx;
                    maxIdx = ind > maxIdx ? ind : maxIdx;
                    minModIdx = mIdx < minModIdx ? mIdx : minModIdx;
                    maxModIdx = mIdx > maxModIdx ? mIdx : maxModIdx;
                }else{
                    minIdx = ind;
                    maxIdx = ind;
                    minModIdx = mIdx;
                    maxModIdx = mIdx;
                }
            }
            ind ++;
        }

        floodFillResult.top = minIdx / w | 0;
        floodFillResult.bottom = maxIdx / w | 0;
        floodFillResult.left = minModIdx;
        floodFillResult.right = maxModIdx;
        floodFillResult.painted = paintedA;
    }
    const edges = {
        top :1,
        right : 2,
        bottom : 4,
        left : 8,
        topLeft : 16,
        topRight : 32,
        bottomRight : 64,
        bottomLeft : 128,
        topLeftMask : 1 + 8,
        topRightMask : 1 + 2,
        bottomRightMask : 4 + 2,
        bottomLeftMask : 4 + 8,
    }
    function createEdgeMask(edgeSelect){
        const painted = floodFillResult.painted;
        const d32 = floodFillResult.d32;
        const d = floodFillResult.d8;
        const size = d32.length;
        const w = floodFillResult.imgData.width;
        const rightPos = w - 1;
        const h = floodFillResult.imgData.height;
        var ind = 0;
        const mask = 0xFFFFFFFF;
        while(ind < size){
            if(painted[ind]){
                var edge = 0;
                const x = ind % w;
                const y = ind / w | 0;
                if (x > 0 && x < rightPos) {
                    if (painted[ind - 1] === 0) { edge |= edges.left }
                    if (painted[ind + 1] === 0) { edge |= edges.right }
                } else if(x > 0) {
                    if (painted[ind - 1] === 0) { edge |= edges.left }
                } else if (painted[ind + 1] === 0) { edge |= edges.right }
                if (y > 0 && y < h - 1) {
                    if (painted[ind - w] === 0) { edge |= edges.top }
                    if (painted[ind + w] === 0) { edge |= edges.bottom }
                } else if(y > 0) {
                    if (painted[ind - w] === 0) { edge |= edges.top }
                } else if (painted[ind + w] === 0) { edge |= edges.bottom }
                if(edge){

                    if(edge === edges.topLeftMask) { edge = edges.topLeft }
                    if(edge === edges.topRightMask) { edge = edges.topRight }
                    if(edge === edges.bottomLeftMask) { edge = edges.bottomLeft }
                    if(edge === edges.bottomRightMask) { edge = edges.bottomRight }

                    if ((edge & edgeSelect) !== 0 ) {
                        d32[ind] = mask;
                    } else { d32[ind] = 0 }
                }else{ d32[ind] = 0 }

            }else{ d32[ind] = 0 }
            ind ++;
        }
    }




    /*== Styles Extension support ====================================================================================*/
    const styleTypes = {fill : 0, stroke : 1, strokeFill : 2, all : 3};
    const styleTypeNames = ["fill","stroke","strokeFill","all"];
    const stylePropertyNames = ["color","strokeStyle","fillStyle","cap","join","lineWidth","comp","composite","filter","smooth","baseline","align","alpha","fillRule","size","aspect","arcStart","arcEnd"];
    const functionalStyleKeys = {shadow : true, font : true, fontSize : true };
    const styleKeyTransforms = {
        stroke : {
            color : "strokeStyle",
            strokeStyle : "strokeStyle",
            fillStyle : "fillStyle",
            cap : "lineCap",
            join : "lineJoin",
            lineWidth : "lineWidth",
            comp : "globalCompositeOperation",
            composite : "globalCompositeOperation",
            filter : "filter",
            smooth : "imageSmoothingEnabled",
            baseline : "textBaseline",
            align : "textAlign",
            alpha : "globalAlpha",
            fillRule : "fillRule",
            size : "featureSize",
            aspect : "featureAspect",
            arcStart : "featureArcStart",
            arcEnd : "featureArcEnd",

        },
        fill : {
            color : "fillStyle",
            fillStyle : "fillStyle",
            strokeStyle : "strokeStyle",
            cap : "lineCap",
            join : "lineJoin",
            lineWidth : "lineWidth",
            comp : "globalCompositeOperation",
            composite : "globalCompositeOperation",
            filter : "filter",
            smooth : "imageSmoothingEnabled",
            baseline : "textBaseline",
            align : "textAlign",
            alpha : "globalAlpha",
            fillRule : "fillRule",
            size : "featureSize",
            aspect : "featureAspect",
            arcStart : "featureArcStart",
            arcEnd : "featureArcEnd",
        },
        strokeFill : {
            color : "fillStyle",
            fillStyle : "fillStyle",
            strokeStyle : "strokeStyle",
            cap : "lineCap",
            join : "lineJoin",
            lineWidth : "lineWidth",
            comp : "globalCompositeOperation",
            composite : "globalCompositeOperation",
            filter : "filter",
            smooth : "imageSmoothingEnabled",
            baseline : "textBaseline",
            align : "textAlign",
            alpha : "globalAlpha",
            fillRule : "fillRule",
            size : "featureSize",
            aspect : "featureAspect",
            arcStart : "featureArcStart",
            arcEnd : "featureArcEnd",
        },
        all : {
            color : "fillStyle",
            fillStyle : "fillStyle",
            strokeStyle : "strokeStyle",
            cap : "lineCap",
            join : "lineJoin",
            lineWidth : "lineWidth",
            comp : "globalCompositeOperation",
            composite : "globalCompositeOperation",
            filter : "filter",
            smooth : "imageSmoothingEnabled",
            baseline : "textBaseline",
            align : "textAlign",
            alpha : "globalAlpha",
            fillRule : "fillRule",
            size : "featureSize",
            aspect : "featureAspect",
            arcStart : "featureArcStart",
            arcEnd : "featureArcEnd",
        },
    }
    function CanvasGrooverStyle(){};
    Object.defineProperty(CanvasGrooverStyle.prototype, 'keys', {writable : true, enumerable : false, configurable : false, value : [] });
    Object.defineProperty(CanvasGrooverStyle.prototype, 'extras', {writable : true, enumerable : false, configurable : false, value : [] });
    var restore = false;
    function setStyle(ctx, type, style){
        if(typeof style === "string"){
            if (type === styleTypes.fill) { ctx.fillStyle = style }
            else if (type === styleTypes.stroke) { ctx.strokeStyle = style }
            else if (type === styleTypes.strokeFill) { ctx.strokeStyle = style }
            else { ctx.strokeStyle = ctx.fillStyle = style }
            return;
        }
        if(style instanceof CanvasGrooverStyle){
            if(style.restore){
                ctx.save()
                restore = true;
            }
            const trans = styleKeyTransforms[styleTypeNames[type]];
            for (const key of style.keys) { ctx[trans[key]] = style[key] }
            for (const extra of style.extras) { extra(style) }
            return;
        }
        if(style.restore){
            ctx.save()
            restore = true;
        }
        if(type === styleTypes.fill){
            ctx.fillStyle = style.fillStyle ? style.fillStyle : style.color ? style.color : ctx.fillStyle;
        }else if(type === styleTypes.stroke){
            ctx.strokeStyle = style.strokeStyle ? style.strokeStyle : style.color ? style.color : ctx.strokeStyle;
            ctx.lineWidth   = style.lineWidth ? style.lineWidth : ctx.lineWidth;
            ctx.lineCap     = style.cap ? style.cap : ctx.lineCap;
            ctx.lineJoin    = style.join ? style.join : ctx.lineJoin;
        }else if(type === styleTypes.strokeFill){
            ctx.strokeStyle = style.strokeStyle ? style.strokeStyle : style.color ? style.color : ctx.strokeStyle;
            ctx.fillStyle   = style.fillStyle ? style.fillStyle : style.color ? style.color : ctx.fillStyle;
            ctx.lineWidth   = style.lineWidth ? style.lineWidth : ctx.lineWidth;
            ctx.lineCap     = style.cap ? style.cap : ctx.lineCap;
            ctx.lineJoin    = style.join ? style.join : ctx.lineJoin;
        }else{
            ctx.fillStyle   = style.fillStyle ? style.fillStyle : style.color ? style.color : ctx.fillStyle;
            ctx.strokeStyle = style.strokeStyle ? style.strokeStyle : style.color ? style.color : ctx.strokeStyle;
            ctx.fillStyle   = style.fillStyle ? style.fillStyle : style.color ? style.color : ctx.fillStyle;
            ctx.lineWidth   = style.lineWidth ? style.lineWidth : ctx.lineWidth;
            ctx.lineCap     = style.cap ? style.cap : ctx.lineCap;
            ctx.lineJoin    = style.join ? style.join : ctx.lineJoin;
        }
        if(style.shadow){
            var options       = style.shadow.split(" ");
            ctx.shadowColor   = options[0];
            ctx.shadowOffsetX = options[1];
            ctx.shadowOffsetY = options[2];
            ctx.shadowBlur    = options[3];
        }
        if (style.fontSize) {
            ctx.fontSize = style.fontSize;
            if (style.font) {
                ctx.font = style.font.replace(/[0-9].*(px)/gi, style.fontSize + "$1")
            }
        } else if(style.font) {
            var hasSize = style.font.indexOf("px");
            if(hasSize > -1){
                style.fontSize = Number(style.font.split("px")[0]);
                ctx.font = style.font;
            }else{
                ctx.font = ctx.fontSize + "px " + style.font;
            }
        }

        if (style.comp !== undefined) { ctx.globalCompositeOperation = style.comp }
        else if (style.composite !== undefined) { ctx.globalCompositeOperation = style.composite }
        if (style.alpha !== undefined)     { ctx.globalAlpha = style.alpha }
        if (style.filter !== undefined)    { ctx.filter = style.filter }
        if (style.smooth !== undefined)    { ctx.imageSmoothingEnabled = style.smooth }
        if (style.baseline !== undefined)    { ctx.textBaseline = style.baseline }
        if (style.align !== undefined)    { ctx.textBaseline = style.align }
        if (style.fillRule !== undefined)    { ctx.fillRule = style.fillRule }
        if (style.size !== undefined)    { ctx.featureSize = style.size }
        if (style.aspect !== undefined)    { ctx.featureAspect = style.aspect }
        if (style.arcStart !== undefined)    { ctx.featureArcStart = style.arcStart }
        if (style.arcEnd !== undefined)    { ctx.featureArcEnd = style.arcEnd }
    }
   /*== Extensions ===================================================================================================*/
    function addImageExtensions(context) {
        const ctx = context;
        var xdx, xdy, sprite;
        Object.assign(ctx, {
            bgImage(image, fillType = "fit") {
                var x,y,scale = 1;
                ctx.setTransform(1,0,0,1,0,0);
                const cw = ctx.canvas.width / 2;
                const ch = ctx.canvas.height / 2;
                if (fillType === "fill") {
                    scale = Math.max(ctx.canvas.width / image.width, ctx.canvas.height / image.height);
                } else if (fillType === "fit") {
                    scale = Math.min(ctx.canvas.width / image.width, ctx.canvas.height / image.height);
                }
                ctx.drawImage(image, cw - image.width * scale / 2, ch - image.height * scale / 2);
            },
            drawImageCentered(image, x, y, scale = 1, rotate = 0, alpha = 1) {
                xdx = Math.cos(rotate) * scale;
                xdy = Math.sin(rotate) * scale;
                ctx.setTransform(xdx, xdy, -xdy, xdx, x, y);
                ctx.drawImage(image, - image.width / 2, - image.height / 2);
            },
            drawImageSprite(image, spriteIndex, x, y, scale = 1, rotate = 0, alpha = 1) {
                if (image.sprites === undefined || spriteIndex < 0) {
                    ctx.drawImageCentered(image, x, y, scale, rotate, alpha);
                } else {
                    sprite = image.sprites[spriteIndex % image.sprites.length];
                    xdx = Math.cos(rotate) * scale;
                    xdy = Math.sin(rotate) * scale;
                    ctx.setTransform(xdx, xdy, -xdy, xdx, x, y);
                    ctx.drawImage(image, sprite.x, sprite.y, sprite.w, sprite.h, -sprite.w / 2, -sprite.h / 2, sprite.w, sprite.h);
                }
            },

        });
    }
    function addMarkerExtensions(context) {
        const ctx = context;
        var currentMark = "x";
        Object.assign(ctx, {
            markType(name){
                if(marks[name]){
                    ctx.mark = marks[name].bind(ctx);  // the binding is to ensure custom marks are correctly bound
                    currentMark = name;
                }
            },
            customMark(name, markFunction){
                if(typeof markFunction === "function"){
                    if(marks[name]){
                        console.warn("You are replacing an existing marker named '"+name+"'");
                    }
                    marks[name] = markFunction;
                    ctx.markType(name);
                }
            },
            mark : marks[currentMark],
            strokeMark(x,y,style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.mark(x,y);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            marks(points){
                var i = 0;
                if(points.length > 0){
                    if(Array.isArray(points[0])){
                        while (i < points.length) {
                            ctx.mark(points[i][0], points[i++][1]);
                        }
                    } else if(!isNaN(points[0])){
                        while (i < points.length) {
                            ctx.mark(points[i++], points[i++]);
                        }
                    } else {
                        while (i < points.length) {
                            ctx.mark(points[i].x, points[i++].y);
                        }
                    }
                }
                return ctx;
            },
            strokeMarks(points, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                var i = 0;
                ctx.beginPath();
                if(points.length > 0){
                    if(Array.isArray(points[0])){
                        while (i < points.length) {
                            ctx.mark(points[i][0], points[i++][1]);
                        }
                    } else if(!isNaN(points[0])){
                        while (i < points.length) {
                            ctx.mark(points[i++], points[i++]);
                        }
                    } else {
                        while (i < points.length) {
                            ctx.mark(points[i].x, points[i++].y);
                        }
                    }
                    ctx.stroke();
                }
                if (restore) { ctx.restore() }
                return ctx;
            },
        });
    }
    function addArrowExtensions(context) {
        const ctx = context;
        var arrowStart = arrows.none;
        var arrowStartName = "none"
        var arrowEnd = arrows.open;
        var arrowEndName = "open"
        Object.assign(ctx, {
            arrowStart(name){
                if(arrows[name]){
                    arrowStartName = name;
                    arrowStart = arrows[name];
                }
            },
            arrowEnd(name){
                if(arrows[name]){
                    arrowEndName = name;
                    arrowEnd = arrows[name];
                }
            },
            arrowEnds(name){
                if(arrows[name]){
                    arrowEndName = name;
                    arrowStartName = name;
                    arrowEnd = arrows[name];
                    arrowStart = arrows[name];
                }
            },
            arrowLine(x1, y1, x2, y2){
                normalizeLine(x1, y1, x2, y2);
                var x = x1;
                var y = y1;
                const width = ctx.featureSize / 2;
                const length = ctx.featureSize * ctx.featureAspect;
                var a = arrowStart;
                if(a.path.length > 0){
                    x += nx * a.dist * length;
                    y += ny * a.dist * length;
                    var i = 0;
                    transformPoint(a.path[i++],a.path[i++],width,length);
                    ctx.moveTo(x1 + tx, y1 + ty);
                    while (i < a.path.length) {
                        if (a.path[i] === "m") {
                            i++;
                            transformPoint(a.path[i++],a.path[i++],width,length);
                            ctx.moveTo(x1 + tx, y1 + ty);
                        } else {
                            transformPoint(a.path[i++],a.path[i++],width,length);
                            ctx.lineTo(x1 + tx, y1 + ty);
                        }
                    }
                    if (a.closed) { ctx.closePath() }
                }
                ctx.moveTo(x,y);
                x = x2;
                y = y2;
                var a = arrowEnd;
                if (a.path.length > 0) {
                    x -= nx * a.dist * length;
                    y -= ny * a.dist * length;
                    ctx.lineTo(x,y);
                    var i = 0;
                    transformPoint(a.path[i++],a.path[i++],width,length);
                    ctx.moveTo(x2 - tx, y2 - ty );
                    while (i < a.path.length) {
                        if (a.path[i] === "m") {
                            i++;
                            transformPoint(a.path[i++],a.path[i++],width,length);
                            ctx.moveTo(x2 - tx, y2 - ty);
                        } else {
                            transformPoint(a.path[i++],a.path[i++],width,length);
                            ctx.lineTo(x2 - tx, y2 - ty);
                        }
                    }
                    if (a.closed) { ctx.closePath() }
                } else {
                    ctx.lineTo(x2,y2);
                }
                return ctx;
            },
            strokeArrowLine(x1, y1, x2, y2, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.arrowLine(x1, y1, x2, y2);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillArrowLine(x1, y1, x2, y2, style) {
                if (style) { setStyle(ctx, styleTypes.strokeFlil, style) }
                ctx.beginPath();
                ctx.arrowLine(x1, y1, x2, y2);
                ctx.fill();
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            }
        });
    }
    function addTextExtensions(context) {
        const ctx = context;
        Object.assign(ctx, {
            strokeTextRect(text,x,y,width,height,style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                const tWidth = ctx.measureText(text).width;
                const sx = width / tWidth;
                const sy = height / ctx.fontSize;
                var tx = 0;
                if (ctx.textAlign === "right") { tx = width }
                else if (ctx.textAlign === "center") { tx = width / 2 }
                ctx.save();
                ctx.textBaseline = "top";
                ctx.transform(sx,0,0,sy,x,y);
                ctx.strokeText(text,tx,0);
                ctx.restore();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillTextRect(text,x,y,width,height,style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                const tWidth = ctx.measureText(text).width;
                const sx = width / tWidth;
                const sy = height / ctx.fontSize;
                var tx = 0;
                if (ctx.textAlign === "right") { tx = width }
                else if (ctx.textAlign === "center") { tx = width / 2 }
                ctx.save();
                ctx.textBaseline = "top";
                ctx.transform(sx,0,0,sy,x,y);
                ctx.fillText(text,tx,0);
                ctx.restore();
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokeTextLine(text,x1,y1,x2,y2,style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                var nx = x2 - x1;
                var ny = y2 - y1;
                const len = (nx ** 2 + ny ** 2) ** 0.5;
                nx /= len;
                ny /= len;
                var tx = 0;
                if (ctx.textAlign === "right") { tx = len }
                else if (ctx.textAlign === "center") { tx = len / 2 }
                ctx.save();

                ctx.transform(nx,ny,-ny,nx,x1,y1);
                ctx.strokeText(text,tx,0);
                ctx.restore();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillTextLine(text,x1,y1,x2,y2,style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                var nx = x2 - x1;
                var ny = y2 - y1;
                const len = (nx ** 2 + ny ** 2) ** 0.5;
                nx /= len;
                ny /= len;
                var tx = 0;
                if (ctx.textAlign === "right") { tx = len }
                else if (ctx.textAlign === "center") { tx = len / 2 }
                ctx.save();

                ctx.transform(nx,ny,-ny,nx,x1,y1);
                ctx.fillText(text,tx,0);
                ctx.restore();
                if (restore) { ctx.restore() }
                return ctx;
            },

        });
    };
    function addFillExtensions(context){
        const ctx = context;
        var fillArea = false;
        if(fillCan === undefined){
            if(typeof OffscreenCanvas !== "undefined" ) {
                fillCan = new OffscreenCanvas(16,16);//document.createElement("canvas");
                fctx = fillCan.getContext("2d");
                CanvasGroover(fctx, {style : true});
            } else {
                fillCan = document.createElement("canvas");
                fillCan.width = 16
                fillCan.height = 16;
                fctx = fillCan.getContext("2d");
                CanvasGroover(fctx, {style : true});
            }

        }


        const FFC = floodFillClip;
        Object.assign(ctx, {
            fillArea(state) { fillArea = state; },            
            fillClip(x, y, w, h) {
                if (x === undefined) {
                    FFC.use = false;
                } else {
                    FFC.use = true;
                    FFC.x = x;
                    FFC.y = y;
                    FFC.w = w;
                    FFC.h = h;
                    FFC.x1 = x + w;
                    FFC.y1 = y + h;
                }
            },
            edgeFill(x, y, tolerance, diagonal, edgeSelect, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                if(x !== "mask"){
                    if (fillCan.width !== ctx.canvas.width || fillCan.height !== ctx.canvas.height) {
                        fillCan.width = ctx.canvas.width;
                        fillCan.height = ctx.canvas.height;
                    } else { fctx.setDefault() }

                    if (FFC.use) {
                        const imgData = ctx.getImageData(FFC.x, FFC.y, FFC.w, FFC.h);
                        if (fillArea) {
                            fillAll(x - FFC.x, y - FFC.y, imgData, tolerance);
                        } else {
                            floodFill(x - FFC.x, y - FFC.y, diagonal === true, imgData, tolerance);
                        }
                    } else {
                        const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                        if (fillArea) {
                            fillAll(x, y, imgData, tolerance);
                        } else {
                            floodFill(x, y, diagonal === true, imgData, tolerance);
                        }
                    }
                    createEdgeMask(edgeSelect);
                }
                FFC.use ? fctx.putImageData(floodFillResult.imgData, FFC.x, FFC.y) : fctx.putImageData(floodFillResult.imgData, 0, 0);
                fctx.fillStyle = ctx.fillStyle;
                fctx.globalCompositeOperation = "source-in";
                FFC.use ? fctx.fillRect(FFC.x, FFC.y, FFC.w, FFC.h) : fctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                fctx.globalCompositeOperation = "source-over";
                ctx.save();
                ctx.setTransform(1,0,0,1,0,0);
                ctx.drawImage(fillCan,0,0);
                ctx.restore();
                if (restore) { ctx.restore() }
                return ctx;
            },
            floodFill(x, y, tolerance, diagonal, aliasEdge, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                if(x !== "mask"){
                    if (fillCan.width !== ctx.canvas.width || fillCan.height !== ctx.canvas.height) {
                        fillCan.width = ctx.canvas.width;
                        fillCan.height = ctx.canvas.height;
                    }else{
                        fctx.setDefault();
                    }
                    if (FFC.use) {
                        const imgData = ctx.getImageData(FFC.x, FFC.y, FFC.w, FFC.h);
                        if (fillArea) {
                            fillAll(x - FFC.x, y - FFC.y, imgData, tolerance);
                        } else {                        
                            floodFill(x - FFC.x, y - FFC.y, diagonal === true, imgData, tolerance);
                        }
                    } else {
                        const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                        if (fillArea) {
                            fillAll(x, y, imgData, tolerance);
                        } else {
                            floodFill(x, y, diagonal === true, imgData, tolerance);
                        }
                    }
                    createFillMask(tolerance, aliasEdge);
                }
                FFC.use ? fctx.putImageData(floodFillResult.imgData, FFC.x, FFC.y) : fctx.putImageData(floodFillResult.imgData, 0, 0);
                fctx.fillStyle = ctx.fillStyle;
                fctx.globalCompositeOperation = "source-in";
                FFC.use ? fctx.fillRect(FFC.x, FFC.y, FFC.w, FFC.h) : fctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                fctx.globalCompositeOperation = "source-over";
                ctx.save();
                ctx.setTransform(1,0,0,1,0,0);
                ctx.drawImage(fillCan,0,0);
                ctx.restore();
                if (restore) { ctx.restore() }
                return ctx;
            },
            floodFillMask(x, y, tolerance, diagonal, aliasEdge, maskCol = 0xFFFFFFFF){
                if (fillCan.width !== ctx.canvas.width || fillCan.height !== ctx.canvas.height) {
                    fillCan.width = ctx.canvas.width;
                    fillCan.height = ctx.canvas.height;
                }else{
                    fctx.setDefault();
                }
                const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                if (fillArea) {
                    fillAll(x, y, imgData, tolerance);
                } else {
                    floodFill(x, y, diagonal === true, imgData, tolerance);
                }
                createFillMask(tolerance, aliasEdge, maskCol);
            },
            floodFillExtractFromData(x, y, imgData, result = {}){
                if (fillArea) {
                    fillAll(x, y, imgData, -1, true);
                } else {
                    floodFill(x, y, true, imgData, -1, true);
                }
                result.top = floodFillResult.top;
                result.left = floodFillResult.left;
                result.bottom = floodFillResult.bottom;
                result.right = floodFillResult.right;
                result.pixelsFilled = floodFillResult.pixels;
                result.imgData = imgData;
                return result;
            },
            floodFillKeep(x, y, imgData, result = {}){
                if (fillArea) {
                    fillAll(x, y, imgData, -1);
                } else {
                    floodFill(x, y, true, imgData, -1);
                }
                var p = floodFillResult.painted;
                var d = floodFillResult.d32;
                var i = p.length;
                while (i--) { d[i] = p[i] === 0 ? 0 : d[i] }
                result.top = floodFillResult.top;
                result.left = floodFillResult.left;
                result.bottom = floodFillResult.bottom;
                result.right = floodFillResult.right;
                result.pixelsFilled = floodFillResult.pixels;
                result.imgData = imgData;
                return result;
            },
            floodFillBoolMask(op, x, y, tolerance, diagonal, aliasEdge, maskCol = 0xFFFFFFFF){
                if (fillCan.width !== ctx.canvas.width || fillCan.height !== ctx.canvas.height) {
                    // if the size is not the same then assume a new mask
                    ctx.floodFillMask(x, y, tolerance, diagonal, aliasEdge, maskCol = 0xFFFFFFFF);
                    return;
                }else{
                    fctx.setDefault();
                }
                const paintedA = floodFillResult.painted;

                const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                if (fillArea) {
                    fillAll(x, y, imgData, tolerance);
                } else {
                    floodFill(x, y, diagonal === true, imgData, tolerance);
                }
                boolMask(op, paintedA, floodFillResult.painted);
                floodFillResult.painted = paintedA;
                createFillMask(tolerance, aliasEdge, maskCol);
            },
            edgeFillMask(x, y, tolerance, diagonal, edgeSelect){
                if (fillCan.width !== ctx.canvas.width || fillCan.height !== ctx.canvas.height) {
                    fillCan.width = ctx.canvas.width;
                    fillCan.height = ctx.canvas.height;
                }else{
                    fctx.setDefault();
                }
                const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                if (fillArea) {
                    fillAll(x, y, imgData, tolerance);
                } else {
                    floodFill(x, y, diagonal === true, imgData, tolerance);
                }
                createEdgeMask(edgeSelect);
            },
            floodFillMaskInfo(result = {}){
                result.top = floodFillResult.top;
                result.left = floodFillResult.left;
                result.bottom = floodFillResult.bottom;
                result.right = floodFillResult.right;
                result.pixelsFilled = floodFillResult.pixels;
                result.imgData = floodFillResult.imgData;
                return result;
            },
            floodFillImgData(){
                return floodFillResult.imgData;
            },



        });

    }
    function addStyleExtensions(context) {
        const ctx = context;
        ctx.styles = {}; // named styles
        function setFont(style){
            if (style.fontSize) {
                ctx.fontSize = style.fontSize;
                if (style.font) {
                    const hasSize = style.font.indexOf("px");
                    if(hasSize > -1){
                        ctx.font = style.font.replace(/[0-9].*(px)/gi, style.fontSize + "$1");
                    }else{
                        ctx.font = ctx.fontSize + "px " + style.font;
                    }
                }else{
                    ctx.font = ctx.font.replace(/[0-9].*(px)/gi, style.fontSize + "$1");
                }
            } else if(style.font) {
                const hasSize = style.font.indexOf("px");
                if(hasSize > -1){
                    ctx.fontSize = Number(style.font.split("px")[0]);
                    ctx.font = style.font;
                }else{
                    ctx.font = ctx.fontSize + "px " + style.font;
                }
            }
        }
        function setShadow(style){
            const options     = style.shadow.split(" ");
            ctx.shadowColor   = options[0];
            ctx.shadowOffsetX = options[1];
            ctx.shadowOffsetY = options[2];
            ctx.shadowBlur    = options[3];
        }
        Object.assign(ctx, {
            copyStyle(fromContext) {
                ctx.fillStyle                 = fromContext.fillStyle;
                ctx.strokeStyle               = fromContext.strokeStyle;
                ctx.globalAlpha               = fromContext.globalAlpha;
                ctx.globalACompositeOperation = fromContext.globalACompositeOperation;
                ctx.imageSmoothingEnabled     = fromContext.imageSmoothingEnabled;
                ctx.filter                    = fromContext.filter;
                ctx.font                      = fromContext.font;
                ctx.fontSize                  = fromContext.fontSize;
                ctx.textAlign                 = fromContext.textAlign;
                ctx.textBaseline              = fromContext.textBaseline;
                ctx.lineWidth                 = fromContext.lineWidth;
                ctx.lineCap                   = fromContext.lineCap;
                ctx.lineJoin                  = fromContext.lineJoin;
                ctx.shadowColor               = fromContext.shadowColor;
                ctx.shadowOffsetX             = fromContext.shadowOffsetX;
                ctx.shadowOffsetY             = fromContext.shadowOffsetY;
                ctx.shadowBlur                = fromContext.shadowBlur;
                return ctx;
            },
            addStyle(name, style){
                const st = ctx.styles[name] = new CanvasGrooverStyle();
                st.keys = [];
                for (const key of stylePropertyNames) {
                    if (style[key] !== undefined) {
                        st[key] = style[key];
                        if (!functionalStyleKeys[key]) { st.keys.push(key) }
                    }
                }
                st.extras = [];
                if (style.font || style.fontSize) {
                    st.extras.push(setFont);
                    style.font !== undefined && (st.font = style.font);
                    style.fontSize !== undefined && (st.fontSize = style.fontSize);
                }
                if (style.shadow) { st.extras.push(setShadow) }
                return st;
            }
        });
    }
    function addGradientExtensions(context) {
        const ctx = context;
        function createGradient(type, coords){
            var gradient;
            if (type === "radial") {
                if (coords.length === 3) {
                    gradient = ctx.createRadialGradient(coords[0], coords[1], 0, coords[0], coords[1], coords[2]);
                } else if (coords.length === 6) {
                    gradient = ctx.createRadialGradient(...coords);
                }
            } else {
                if (coords.length === 1) {
                    fitRectOverRect(setRect(0, 0, ctx.canvas.width, ctx.canvas.height), coords[0], setRect(0, 0, ctx.canvas.width, ctx.canvas.height), transformArray);
                    matrixTransformPoint(0, -ctx.canvas.height / 2, transformArray, workPoint1);
                    matrixTransformPoint(0,  ctx.canvas.height / 2, transformArray, workPoint2);
                    gradient = ctx.createLinearGradient(workPoint1.x, workPoint1.y, workPoint2.x, workPoint2.y);
                }else if (coords.length === 4) {
                    gradient = ctx.createLinearGradient(...coords);
                }
            }
            return gradient;
        }
        Object.assign(ctx, {
            createHSLGradient(type, coords, dist, colors) {
                var gradient = createGradient(type, coords);
                if (gradient === undefined) {
                    return undefined;
                }
                dist |= 0;
                if (colors.length === 2) {
                    interpolateHSLGradient(gradient, 0, 1, colors[0], colors[1], dist);
                    gradient.addColorStop(1, colors[1]);
                }else{
                    var i = 0;
                    const steps = colors.length;
                    var lastCol, lastPos;
                    while (i < steps) {
                        if(colors[i] !== undefined && colors[i] !== null){
                            var pos = i / (steps-1);
                            var col = colors[i];
                            if(lastCol !== undefined){
                                interpolateHSLGradient(gradient, lastPos, pos, lastCol, col, (pos - lastPos) * dist);
                            }
                            lastPos = pos;
                            lastCol = col;
                        }
                        i++;
                    }
                    gradient.addColorStop(pos,col);
                }
                return gradient;
            },
            createGradient(type, coords, colors) {
                var gradient = createGradient(type, coords);
                if (gradient === undefined) {
                    return undefined;
                }
                if (colors.length === 2) {
                    gradient.addColorStop(0, colors[0]);
                    gradient.addColorStop(1, colors[1]);
                } else {
                    var i = 0;
                    const steps = colors.length;
                    while (i < steps) {
                        if(colors[i] !== undefined && colors[i] !== null){
                            var pos = i / (steps-1);
                            gradient.addColorStop(pos,colors[i]);
                        }
                        i++;
                    }
                }
                return gradient;
            }
        });
    }
    function addPixelArtExtensions(context) {

        var textureBuffer32, textureBuffer8, textureSprites,renderBuffer, renderBuffer8, renderBuffer32;
        const zBuffer = {
            back: 100,
            front: 1,
            buffer: null,
        }

        var textureWidth, textureHeight;
        const ctx = context;
        const pixel = ctx.createImageData(1,1);
        const pixelBytes = pixel.data;
        function line(x1 ,y1, x2, y2){
            const lineWidth = (ctx.lineWidth | 0) < 1 ? 1 : ctx.lineWidth | 0;
            const offset = ((lineWidth + 1) % 2) / 2 - (lineWidth-1) / 2;
            x1 |= 0;
            y1 |= 0;
            x2 |= 0;
            y2 |= 0;
            var dx = Math.abs(x2 - x1);
            var sx = x1 < x2 ? 1 : -1;
            var dy = -Math.abs(y2 - y1);
            var sy = y1 < y2 ? 1 : -1;
            var er = dx + dy;
            var e2;
            var end = false;
            while (!end) {
                ctx.rect(x1 + offset, y1 + offset, lineWidth, lineWidth);
                if (x1 === x2 && y1 === y2) {
                    end = true;
                } else {
                    e2 = 2 * er;
                    if (e2 >= dy) {
                        er += dy;
                        x1 += sx;
                    }
                    if (e2 <= dx) {
                        er += dx;
                        y1 += sy;
                    }
                }
            }
        }
        Object.assign(ctx, {
            setPixelTexture(image, spriteLocations) {
                const can = CanvasGrooverHelpers.cloneImage(image);
                textureWidth = can.width;
                textureHeight = can.height;
                const buf = can.ctx.getImageData(0,0,can.width,can.height);
                textureBuffer8 = new Uint8ClampedArray(buf.data.buffer);
                textureBuffer32 = new Uint32Array(buf.data.buffer);
                textureSprites = spriteLocations;
            },
            createRenderBuffer() {
                renderBuffer = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
                renderBuffer8 = new Uint8ClampedArray(renderBuffer.data.buffer);
                renderBuffer32 = new Uint32Array(renderBuffer.data.buffer);
                return {
                    clear(ABGR32 = 0, pixel = true, zBuff = true) {
                        pixel && renderBuffer32.fill(ABGR32);
                        zBuff && zBuffer.buffer && zBuffer.buffer.fill(zBuffer.back);
                    },
                    present() { ctx.putImageData(renderBuffer,0,0) },
                    release() { zBuffer.buffer = renderBuffer = renderBuffer8 = renderBuffer32 = undefined },
                    addZBuffer(front, back) {
                        zBuffer.front = front;
                        zBuffer.back = back;
                        zBuffer.buffer = new Float64Array(ctx.canvas.width * ctx.canvas.height)
                    },
                    zBufferToPixel() {
                        const z = zBuffer.buffer;
                        const f = zBuffer.front;
                        const b = zBuffer.back;
                        const r = b - f;
                        var i = z.length;
                        var rb = renderBuffer32;
                        const OVER = 0xFF0000FF;
                        const UNDER = 0xFF00FF00;

                        while (i--) {
                            var bz = z[i];
                            if(bz > b) { rb[i] = OVER }
                            else if(bz < f) { rb[i] = UNDER }
                            else {
                                const bt = (bz - f) / r * 256 | 0;
                                rb[i] = 0xFF000000 + bt + (bt << 8) + (bt << 16);
                            }
                        }
                    },
                    zBufferShadow(lightDirection, shadow) {
                        const zb = zBuffer.buffer;
                        const f = zBuffer.front;
                        const b = zBuffer.back;
                        const W = ctx.canvas.width;
                        const H = ctx.canvas.height;
                        var i = 0,x1,y1,z1,x2,y2,z2;
                        while(i < zb.length) {
                            if(zb[i] < b) {
                                x1 = i % W;
                                y1 = i / W | 0;
                                z1 = zb[i];
                                x2 = x1 + lightDirection.x;
                                y2 = y1 + lightDirection.y;
                                z2 = z1 + lightDirection.z;
                                if(traceLight()) {
                                    const pix = renderBuffer32[i]
                                    renderBuffer32[i] = (pix & 0xFF000000) + ((pix & 0xFF) * shadow & 0xFF) + ((pix & 0xFF00) * shadow & 0xFF00) + ((pix & 0xFF0000) * shadow & 0xFF0000)

                                }
                            }
                            i++;
                        }
                        function traceLight() {
                            var z = z2 - z1
                            var x = x1;
                            var y = y1;
                            var dx = Math.abs(x2 - x1);
                            var sx = x1 < x2 ? 1 : -1;
                            var dy = -Math.abs(y2 - y1);
                            var sy = y1 < y2 ? 1 : -1;
                            var er = dx + dy;
                            var dist = dx * dx + dy * dy;
                            var e2;
                            var end = false;
                            while (!end) {
                                if(x1 < 0 || x1 >= W || y1 < 0 || y1 >= H) {
                                    return false;
                                }
                                const zv = zb[x1 + y1 * W];
                                if(zv === b) { return false }

                                const tdx = x1 - x;
                                const tdy = y1 - y;
                                const zz = z1 + z * ((tdx * tdx + tdy * tdy) / dist);
                                if(zv < zz) { return true }
                                e2 = 2 * er;
                                if (e2 >= dy) {
                                    er += dy;
                                    x1 += sx;
                                }
                                if (e2 <= dx) {
                                    er += dx;
                                    y1 += sy;
                                }

                            }
                        }

                    }

                }
            },
            pixelZBufLine(x1, y1, z1, x2, y2, z2, light, pixColor, pixColor2) {
                if( renderBuffer === undefined) { return  }
                const zBuf = zBuffer.buffer;
                const rendBufStride = renderBuffer.width;
                const writePixel = (sIdx, pix) => {
                    const ii = sIdx << 2;
                    const d = renderBuffer8[ii+3] ;
                    const s = (pix >> 24) & 0xFF;
                    if(d === 0 || s === 0xFF) {
                        renderBuffer32[sIdx] = light === 1 ? pix : (light === 0 ? (pix & 0xFF000000) : pix);
                    } else {
                        const s1 = s / 255;
                        const d1 = 1 - s1;
                        renderBuffer8[ii] =  ((pix >> 16) & 0xFF) * s1 + renderBuffer8[ii] * d1;
                        renderBuffer8[ii+1] = ((pix >> 8) & 0xFF) * s1 + renderBuffer8[ii+1] * d1;
                        renderBuffer8[ii+2] = (pix & 0xFF) * s1 + renderBuffer8[ii+2] * d1;
                        renderBuffer8[ii+3] = s + d * (1 - s1);
                    }
                }
                const a = pixColor >> 24;
                const b = ((pixColor >> 16) & 0xFF) * light;
                const g = ((pixColor >> 8) & 0xFF) * light;
                const r = (pixColor & 0xFF) * light;
                const a1 = ((pixColor2 !== undefined ? pixColor2 : pixColor) >> 24) - a;
                const b1 = (((pixColor2 !== undefined ? pixColor2 : pixColor) >> 16) & 0xFF) * light - b;
                const g1 = (((pixColor2 !== undefined ? pixColor2 : pixColor) >> 8) & 0xFF) * light - g;
                const r1 = ((pixColor2 !== undefined ? pixColor2 : pixColor) & 0xFF) * light - r;
                const secondColor = pixColor2 !== undefined;
                const H = renderBuffer.height;
                const W = rendBufStride;
                var x = x1 |= 0;
                var y = y1 |= 0;
                x2 |= 0;
                y2 |= 0;
                var dx = Math.abs(x2 - x1);
                var sx = x1 < x2 ? 1 : -1;
                var dy = -Math.abs(y2 - y1);
                const len = Math.sqrt(dx * dx + dy * dy);
                const dz = z2 - z1;
                var sy = y1 < y2 ? 1 : -1;
                var er = dx + dy;
                var e2;
                var end = false;
                var z;
                while (!end) {
                    if ((sx > 0 && x >= W) || (sx < 0 && x < 0) || (sy > 0 && y >= H) || (sy < 0 && y < 0)){ break }
                    if (x >= 0 && x < W && y >= 0 && y < H) {
                        const ddx = x - x1;
                        const ddy = y - y1;
                        const pos = Math.sqrt(ddx * ddx + ddy * ddy) / len;
                        const sIdx = x + y * W;
                        z = z1 + dz * pos ;
                        if (secondColor) {
                            pixColor = ((a + a1 * pos) << 24) + ((b + b1 * pos) << 16) + ((g + g1 * pos) << 8) + ((r + r1 * pos) | 0);
                        }
                        if(z <= zBuf[sIdx]) {
                            zBuf[sIdx] = z;
                            writePixel(sIdx, pixColor);
                        }
                    }
                    if (x === x2 && y === y2) {
                        break;
                    } else {
                        e2 = 2 * er;
                        if (e2 >= dy) {
                            er += dy;
                            x += sx;
                        }
                        if (e2 <= dx) {
                            er += dx;
                            y += sy;
                        }
                    }
                }
            },
            pixelPolygonTextured(verts, light, spriteIdx, tex, map, forceZBufWrite = false, forcedZBufValue) { // convex polys only. Texture
                if(textureBuffer8 === undefined || spriteIdx > textureSprites.length || renderBuffer === undefined) {
                    return;
                }
                var tIdx = 0;
                const zBuf = zBuffer.buffer;
                const rendBufStride = renderBuffer.width;
                var TW = textureWidth, W = TW, MW = 1,MH = 1;
                var H = textureHeight;
                const count = verts.length;
                const vL = new Array(count);
                const vR = new Array(count);
                const tLen = tex[0].length;
                const tL = new Array(tLen);
                const tR = new Array(tLen);
                const tt = new Array(tLen);
                var  topIdx, min = Infinity, botIdx,  max = -Infinity, maxX = max, minX = min;;
                var idx = 0, leftIdx, rightIdx, leftDir, rightDir, lIdx, rIdx, leftDone = false, rightDone = false;;
                var scanY, xl, xr, yl, yr, ztl, ztr, zbl, zbr, zl, zr, slopeL, slopeR, nextL, nextR, dist, xxl, xxr, texLA, texRA, texLB, texRB;

                const lerpTex = (u, t, b, res) => {
                    if(u <= 0) { res[0] = t[0]; res[1] = t[1] }
                    else if(u >= 1) { res[0] = b[0]; res[1] = b[1] }
                    else {
                        let i = tLen;
                        while (i--) { res[i] = (b[i] - t[i]) * u + t[i] }
                    }
                }
                const writePixel = (sIdx, pix) => {
                    const ii = sIdx << 2;
                    const d = renderBuffer8[ii+3] ;
                    const s = (pix >> 24) & 0xFF;
                    if(d === 0 || s === 0xFF) {
                        renderBuffer32[sIdx] = light === 1 ? pix : (light === 0 ? (pix & 0xFF000000) : (pix & 0xFF000000) + ((pix & 0xFF) * light & 0xFF) + ((pix & 0xFF00) * light & 0xFF00) + ((pix & 0xFF0000) * light & 0xFF0000));
                    } else {
                        const s1 = s / 255;
                        const d1 = 1 - s1;
                        const r = (((pix >> 16) & 0xFF) * light) * s1;
                        const g = (((pix >> 8) & 0xFF) * light) * s1;
                        const b = ((pix & 0xFF) * light) * s1;
                        renderBuffer8[ii] =  r + renderBuffer8[ii] * d1;
                        renderBuffer8[ii+1] = g + renderBuffer8[ii+1] * d1;
                        renderBuffer8[ii+2] = b + renderBuffer8[ii+2] * d1;
                        renderBuffer8[ii+3] = s + d * (1 - s1);
                    }
                }
                for (const p of verts) {
                    if (p.x < minX) { minX = p.x;}
                    if (p.x > maxX) { maxX = p.x;}
                    if (p.y < min) { min = p.y; topIdx = idx; }
                    if (p.y > max) { max = p.y; botIdx = idx; }
                    idx++
                }
                if(max < 0 || min >= renderBuffer.height || maxX < 0 || minX >= rendBufStride) { return }
                if(spriteIdx > -1) {
                    const spr = textureSprites[spriteIdx];
                    tIdx = spr[0] + spr[1] * TW;
                    W = spr[2];
                    H = spr[3];
                    if(map) {
                        MW = map.width;
                        MH = map.height;
                        map = map.map;
                    }
                }
                {
                    const pt = verts[topIdx];
                    const p1 = verts[(topIdx + count -1) % count];
                    const p2 = verts[(topIdx + 1) % count];
                    if ((p1.x - pt.x) / (p1.y - pt.y) < (p2.x - pt.x) / (p2.y - pt.y)) {
                        rightIdx = (topIdx + 1) % count;
                        rightDir = 1;
                        leftIdx = (topIdx + count -1) % count;
                        leftDir = count -1;
                    } else {
                        rightIdx = (topIdx + count -1) % count;
                        rightDir = count -1;
                        leftIdx = (topIdx + 1) % count;
                        leftDir = 1;
                    }
                    nextL = vL[0] = {p: pt, y: Math.floor(pt.y), slope : 0, idx: topIdx};
                    nextR = vR[0] = {p: pt, y: Math.floor(pt.y), slope : 0, idx: topIdx};
                    yr = yl = scanY = nextL.y;
                    lIdx = rIdx = 0;
                }
                while (!rightDone || !leftDone) {
                    if (!leftDone) {
                        const pt = vL[lIdx++];
                        while (Math.floor(verts[leftIdx].y) === pt.y && leftIdx !== botIdx ) {
                            pt.p = verts[leftIdx]
                            pt.idx = leftIdx;
                            leftIdx = (leftIdx + leftDir) % count;
                        }
                        let p1 = verts[leftIdx];
                        vL[lIdx] = {p: p1, y: Math.floor(p1.y), slope: (p1.x - pt.p.x) / (p1.y - pt.p.y), idx: leftIdx};
                        if (leftIdx === botIdx) { leftDone = true }
                        else { leftIdx = (leftIdx + leftDir) % count }
                    }
                    if(!rightDone) {
                        const pt = vR[rIdx++];
                        while (Math.floor(verts[rightIdx].y) === pt.y  && rightIdx !== botIdx) {
                            pt.p = verts[rightIdx]
                            pt.idx = rightIdx;
                            rightIdx = (rightIdx + rightDir) % count;
                        }
                        let p1 = verts[rightIdx];
                        vR[rIdx] = {p: p1, y: Math.floor(p1.y), slope : (p1.x - pt.p.x) / (p1.y - pt.p.y), idx: rightIdx};
                        if (rightIdx === botIdx) { rightDone = true; }
                        else { rightIdx = (rightIdx + rightDir) % count }
                    }
                }
                lIdx = rIdx = 0;
                var lDist,rDist;
                max = Math.min(max, renderBuffer.height);
                while (scanY < max) {
                    if (scanY >= nextR.y) {
                        if (!vR[rIdx + 1]) { break }
                        xr = nextR.p.x;
                        yr = nextR.y;
                        ztr = nextR.p.z;
                        texRA = tex[nextR.idx];
                        rIdx ++
                        rDist = vR[rIdx].p.y - nextR.p.y;
                        nextR = vR[rIdx];
                        zbr = nextR.p.z;
                        texRB = tex[nextR.idx];
                        slopeR = nextR.slope;
                    }
                    if (scanY >= nextL.y) {
                        if (!vL[lIdx + 1]) { break }
                        xl = nextL.p.x;
                        yl = nextL.y;
                        ztl = nextL.p.z;
                        texLA = tex[nextL.idx];
                        lIdx ++;
                        lDist = vL[lIdx].p.y - nextL.p.y;
                        nextL = vL[lIdx];
                        zbl = nextL.p.z;
                        texLB = tex[nextL.idx];
                        slopeL = nextL.slope;
                    }
                    if(scanY >= 0) {
                        xxl = Math.floor(scanY < yl ? xl : xl + (scanY - yl) * slopeL);
                        if(xxl > rendBufStride) { scanY += 1; continue }
                        xxr = Math.ceil(scanY < yr ? xr : xr + (scanY - yr) * slopeR)
                        if(xxr < 0) { scanY += 1; continue }
                        xxr -= xxl - 1;
                        const uL = (scanY - yl) / lDist;
                        const uR = (scanY - yr) / rDist;
                        lerpTex(uL, texLA, texLB, tL);
                        lerpTex(uR, texRA, texRB, tR);
                        zl = (zbl - ztl) * uL + ztl;
                        zr = (zbr - ztr) * uR + ztr;
                        const scanIdx = scanY * rendBufStride + xxl;
                        let x = 0;
                        while (x < xxr) {
                            const u = x / xxr;
                            var zz = (zr - zl) * u + zl;
                            if(zz <= zBuf[scanIdx + x]) {
                                const sIdx = scanIdx + x;
                                if (forceZBufWrite) {
                                    zz = forcedZBufValue !== undefined ? forcedZBufValue : zz;
                                    zBuf[sIdx] = zz;
                                }
                                lerpTex(u, tL, tR, tt);
                                if (map) {
                                    const spr = textureSprites[spriteIdx + map[((tt[0] | 0) % MW) + ((tt[1] | 0) % MH) * MW]];
                                    if (spr) {
                                        W = spr[2];
                                        H = spr[3];
                                        const pix = textureBuffer32[spr[0] + spr[1] * TW + ((tt[0] * W | 0) % W) +  ((tt[1] * H | 0) % H) * TW];
                                        if(pix) {
                                            zBuf[sIdx] = zz;
                                            writePixel(sIdx,pix);
                                        }
                                    }
                                } else {
                                    const pix = spriteIdx === -1 ? tex : textureBuffer32[tIdx + ((tt[0] | 0) % W) +  ((tt[1] | 0) % H) * TW];
                                    if(pix) {
                                        zBuf[sIdx] = zz;
                                        writePixel(sIdx,pix);
                                    }
                                }
                            }
                            x++;
                        }
                    }
                    scanY += 1;
                }
            },
            pixelFillPolygon(verts, style) { // convex polys only
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.pixelPolygon(verts);
                ctx.fill();
                if (restore) { ctx.restore() }
                return ctx;
            },
            pixelPolygon(verts) { // convex polys only
                const count = verts.length;
                const vL = new Array(count);
                const vR = new Array(count);
                var  topIdx, min = Infinity, botIdx,  max = -Infinity;
                var idx = 0, leftIdx, rightIdx, leftDir, rightDir, lIdx, rIdx, leftDone = false, rightDone = false;;
                var scanY, xl, xr, yl, yr, slopeL, slopeR, nextL, nextR, dist, xxl, xxr;

                for (const p of verts) {
                    if (p.y < min) { min = p.y; topIdx = idx; }
                    if (p.y > max) { max = p.y; botIdx = idx; }
                    idx++
                }
                {
                    const pt = verts[topIdx];
                    const p1 = verts[(topIdx + count -1) % count];
                    const p2 = verts[(topIdx + 1) % count];
                    if ((p1.x - pt.x) / (p1.y - pt.y) < (p2.x - pt.x) / (p2.y - pt.y)) {
                        rightIdx = (topIdx + 1) % count;
                        rightDir = 1;
                        leftIdx = (topIdx + count -1) % count;
                        leftDir = count -1;
                    } else {
                        rightIdx = (topIdx + count -1) % count;
                        rightDir = count -1;
                        leftIdx = (topIdx + 1) % count;
                        leftDir = 1;
                    }
                    nextL = vL[0] = {p: pt, y: Math.floor(pt.y), slope : 0};
                    nextR = vR[0] = {p: pt, y: Math.floor(pt.y), slope : 0};
                    yr = yl = scanY = nextL.y;
                    lIdx = rIdx = 0;
                }
                while (!rightDone || !leftDone) {
                    if (!leftDone) {
                        const pt = vL[lIdx++];
                        while (Math.floor(verts[leftIdx].y) === pt.y && leftIdx !== botIdx ) {
                            pt.p = verts[leftIdx]
                            leftIdx = (leftIdx + leftDir) % count;
                        }
                        let p1 = verts[leftIdx];
                        vL[lIdx] = {p: p1, y: Math.floor(p1.y), slope: (p1.x - pt.p.x) / (p1.y - pt.p.y)};
                        if (leftIdx === botIdx) { leftDone = true }
                        else { leftIdx = (leftIdx + leftDir) % count }
                    }
                    if(!rightDone) {
                        const pt = vR[rIdx++];
                        while (Math.floor(verts[rightIdx].y) === pt.y  && rightIdx !== botIdx) {
                            pt.p = verts[rightIdx]
                            rightIdx = (rightIdx + rightDir) % count;
                        }
                        let p1 = verts[rightIdx];
                        vR[rIdx] = {p: p1, y: Math.floor(p1.y), slope : (p1.x - pt.p.x) / (p1.y - pt.p.y)};
                        if (rightIdx === botIdx) { rightDone = true; }
                        else { rightIdx = (rightIdx + rightDir) % count }
                    }
                }
                lIdx = rIdx = 0;
                while (scanY < max) {
                    if (scanY >= nextR.y) {
                        if (!vR[rIdx + 1]) { break }
                        xr = vR[rIdx].p.x;
                        yr = vR[rIdx++].y;
                        nextR = vR[rIdx];
                        slopeR = nextR.slope;
                    }
                    if (scanY >= nextL.y) {
                        if (!vL[lIdx + 1]) { break }
                        xl = vL[lIdx].p.x;
                        yl = vL[lIdx++].y;
                        nextL = vL[lIdx];
                        slopeL = nextL.slope;
                    }
                    xxl = Math.floor(scanY < yl ? xl : xl + (scanY - yl) * slopeL);
                    xxr = Math.ceil(scanY < yr ? xr : xr + (scanY - yr) * slopeR) - xxl + 1
                    ctx.rect(xxl, scanY, xxr, 1);
                    scanY += 1;
                }
            },
            pixelFillRect(x1, y1, width, height, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                const x = x1 | 0;
                const y = y1 | 0;
                width   = ((x1 + width) | 0) - x;
                height  = ((y1 + height) | 0) - y;
                ctx.rect(x, y, width, height);
                ctx.fill();
                if (restore) { ctx.restore() }
                return ctx;
            },
            pixelStrokeRect(x1, y1, width, height, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                const fillStyle = ctx.fillStyle;
                ctx.fillStyle = ctx.strokeStyle;
                const lineWidth = (ctx.lineWidth | 0) < 1 ? 1 : ctx.lineWidth | 0;
                ctx.beginPath();
                var x = x1 | 0;
                var y = y1 | 0;
                width   = ((x1 + width) | 0) - x;
                height  = ((y1 + width) | 0) - y;
                ctx.rect(x, y, width, height);
                ctx.rect(x + lineWidth, y + lineWidth, width - lineWidth * 2, height - lineWidth * 2);
                ctx.fill("evenodd");
                ctx.fillStyle = fillStyle;
                if (restore) { ctx.restore() }
                return ctx;
            },
            pixelLine(x1, y1, x2, y2, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                const fillStyle = ctx.fillStyle;
                ctx.fillStyle = ctx.strokeStyle;
                ctx.beginPath();
                line(x1, y1, x2, y2);
                ctx.fill();
                ctx.fillStyle = fillStyle;
                if (restore) { ctx.restore() }
                return ctx;
            },
            pixelPath(points, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                const fillStyle = ctx.fillStyle;
                ctx.fillStyle = ctx.strokeStyle;
                ctx.beginPath();
                var i = 0;
                if(Array.isArray(points[0])){
                    while (i < points.length) {
                        line(points[i][0], points[i++][1], points[i][0], points[i][1]);
                    }
                } else if(!isNaN(points[0])){
                    ctx.moveTo(points[i++], points[i++]);
                    while (i < points.length) {
                        line(points[i++], points[i++], points[i++], points[i]);
                        i --;
                    }
                } else {
                    while (i < points.length) {
                        line(points[i].x, points[i++].y,points[i].x, points[i].y);
                    }
                }
                ctx.fill();
                ctx.fillStyle = fillStyle;
                if (restore) { ctx.restore() }
                return ctx;
            },
            pixelCircle(x0, y0, radius, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                const fillStyle = ctx.fillStyle;
                ctx.fillStyle = ctx.strokeStyle;
                const lineWidth = (ctx.lineWidth | 0) < 1 ? 1 : ctx.lineWidth | 0;
                const offset = ((lineWidth + 1) % 2) / 2 - (lineWidth - 1) / 2;
                ctx.beginPath();
                radius |= 0;
                x0 |= 0;
                y0 |= 0;
                var x = radius-1;
                var y = 0;
                var dx = 1;
                var dy = 1;
                var err = dx - (radius << 1);
                x0 += offset;
                y0 += offset;
                const x1 = x0 + 1;
                const y1 = y0 + 1;
                while (x >= y) {
                    ctx.rect(x1 + x, y1 + y, lineWidth, lineWidth);
                    ctx.rect(x0 - x, y0 - y, lineWidth, lineWidth);
                    ctx.rect(x0 - y, y1 + x, lineWidth, lineWidth);
                    ctx.rect(x1 + x, y0 - y, lineWidth, lineWidth);
                    if (x > y) {
                        ctx.rect(x1 + y, y1 + x, lineWidth, lineWidth);
                        ctx.rect(x0 - x, y1 + y, lineWidth, lineWidth);
                        ctx.rect(x0 - y, y0 - x, lineWidth, lineWidth);
                        ctx.rect(x1 + y, y0 - x, lineWidth, lineWidth);
                    }
                    y++;
                    err += dy;
                    dy += 2;
                    if (err > 0) {
                        x--;
                        dx += 2;
                        err += (-radius << 1) + dx;
                    }
                }
                ctx.fill();
                ctx.fillStyle = fillStyle;
                if (restore) { ctx.restore() }
                return ctx;
            },
            setPixel(x,y,color){
                ctx.save();
                if (color) { ctx.fillStyle = color }
                ctx.setTransform(1,0,0,1,0,0);
                ctx.fillRect(x | 0, y | 0, 1, 1);
                ctx.restore();
            },
            setPixelFast(x, y, r, g, b, a) {
                pixelBytes[0] = r;
                pixelBytes[1] = g;
                pixelBytes[2] = b;
                pixelBytes[3] = a;
                ctx.setImageData(pixel, x | 0, y | 0);
            },
            getPixel(x, y, pixel = []){
                const data = ctx.getImageData(x | 0, y | 0, 1, 1).data;
                pixel[0] = data[0];
                pixel[1] = data[1];
                pixel[2] = data[2];
                pixel[3] = data[3];
                return pixel;
            }

        });
    }
    function addGraphingExtentions(context) {
        const ctx = context;
        Object.assign(ctx, {
            plotY(start, end, top, bottom, func, style){
                var scaleX = (end - start) /ctx.canvas.width;
                var scaleY = ctx.canvas.height/(bottom - top);
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                var newLine = true;
                for(var i = 0; i < ctx.canvas.width; i ++){
                    var y = func(i * scaleX + start) * scaleY + top;
                    if(! isNaN(y)){
                        if(newLine){
                            ctx.beginPath();
                            newLine = false;
                        }
                        ctx.lineTo(i, y);
                    }else{
                        if(newLine === false){ ctx.stroke(); newLine = true }
                    }
                }
                if(newLine === false){ ctx.stroke() }
                if (restore) { ctx.restore() }
                return ctx;
            }
        });


    }
    function addStandardExtentions(context) {
        const ctx = context;
        Object.assign(ctx, {
            clear() {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                return ctx;
            },
            copy(applyCanvasGroover = true,settings){
                if(typeof OffscreenCanvas !== "undefined") {
                    const can = new OffscreenCanvas(ctx.can.width, ctx.can.height);//
                } else {
                    document.createElement("canvas");
                    can.width = ctx.canvas.width;
                    can.height = ctx.canvas.height;
                }
                can.ctx = can.getContext("2d");
                can.ctx.drawImage(ctx.canvas,0,0);
                if (ctx.canvas.sprites) {
                    can.sprites = ctx.canvas.sprites.map(sprite => ({x : sprite.x, y : sprite.y, w : sprite.w, h : sprite.h}));
                }
                if (applyCanvasGroover) { CanvasGroover(can.ctx,settings) }
                return can;
            },
            setStyle(style) {
                setStyle(ctx, styleTypes.all, style);
                restore = false;
            },
            setDefault() {
                ctx.setTransform(1,0,0,1,0,0);
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = "source-over";
                ctx.filter = "";
                ctx.imageSmoothingEnabled = true;
                ctx.lineWidth = 1;
                ctx.strokeStyle = ctx.fillStyle = "black";
                ctx.fillRule = "nonzero"; // "evenodd"
                ctx.fontSize = Number(ctx.font.split("px")[0]);
                ctx.featureSize = defaultFeatureSize;
                ctx.featureAspect = defaultFeatureAspect;
                ctx.featureArcStart = defaultFeatureArcStart;
                ctx.featureArcEnd = defaultFeatureArcEnd;

            }
        });


    }
    function addShapeExtensions(context) {
        const ctx = context;
        var currentMark = "x";
        Object.assign(ctx, {
            fillAll(style) {
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                if (restore) { ctx.restore() }
                return ctx;
            },
            line(x1, y1, x2, y2) {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                return ctx;
            },
            strokeLine(x1, y1, x2, y2, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            indexedPath(points, idxs) {
                var first = true;
                for (const i of idxs) {
                    if (Array.isArray(i)) {
                        first = true;
                        for (const j of i) {
                            if (first) {
                                ctx.moveTo(points[j].x, points[j].y);
                                first = false;
                            } else {
                                ctx.lineTo(points[j].x, points[j].y);
                            }
                        }
                    } else {
                        if (first) {
                            ctx.moveTo(points[i].x, points[i].y);
                            first = false;
                        } else {
                            ctx.lineTo(points[i].x, points[i].y);
                        }
                    }
                }
            },
            strokeIndexedPath(points, idxs, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.indexedPath(points, idxs);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            path(points){
                var i = 0;
                if(points.length > 0){
                    if(Array.isArray(points[0])){
                        ctx.moveTo(points[i][0], points[i++][1]);
                        while (i < points.length) {
                            const p = points[i++];
                            if (p.length === 2) { ctx.lineTo(p[0], p[1]) }
                            else if (p.length === 4) { ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]) }
                            else if (p.length >= 6) { ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]) }
                        }
                    } else if(!isNaN(points[0]) ){
                        if(points.length > 1){
                            ctx.moveTo(points[i++], points[i++]);
                            while (i < points.length) {
                                ctx.lineTo(points[i++], points[i++]);
                            }
                        }
                    } else {
                        ctx.moveTo(points[i].x, points[i++].y);
                        while (i < points.length) {
                            ctx.lineTo(points[i].x, points[i++].y);
                        }
                    }
                }
                return ctx;
            },
            strokePath(points, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.path(points);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            hub(cx,cy,radius1, radius2, start, end){
                var x = Math.cos(start) * radius2 + cx;
                var y = Math.sin(start) * radius2 + cy;
                ctx.moveTo(x,y);
                ctx.arc(cx,cy,radius2, start, end);
                ctx.arc(cx,cy,radius1, end, start, true);
                ctx.closePath();
                return ctx;
            },
            strokeHub(cx,cy,radius1, radius2, start, end, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.arc(cx,cy,radius2, start, end);
                ctx.arc(cx,cy,radius1, end, start, true);
                ctx.closePath();
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillHub(cx,cy,radius1, radius2, start, end, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.arc(cx,cy,radius2, start, end);
                ctx.arc(cx,cy,radius1, end, start, true);
                ctx.closePath();
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            pie(cx, cy, radius, from,  width){
                ctx.moveTo(cx,cy);
                ctx.arc(cx, cy, radius, from / 100 * PI2, (from + width) / 100 * PI2);
                ctx.closePath();
                return ctx;
            },
            strokePie(cx, cy, radius, from,  width, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.moveTo(cx,cy);
                ctx.arc(cx, cy, radius, from / 100 * PI2, (from + width) / 100 * PI2);
                ctx.closePath();
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillPie(cx, cy, radius, from,  width, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.moveTo(cx,cy);
                ctx.arc(cx, cy, radius, from / 100 * PI2, (from + width) / 100 * PI2);
                ctx.closePath();
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            circleFlat(cx, cy, radiusX, radiusY) {
                if(ctx.featureArcStart !== 0){
                    ctx.moveTo(
                        cx + Math.cos(ctx.featureArcStart) * radiusX,
                        cy + Math.sin(ctx.featureArcStart) * radiusY
                    );
                } else {
                    ctx.moveTo(cx + radiusX, cy)
                }
                ctx.ellipse(cx, cy, radiusX, radiusY, 0, ctx.featureArcStart, ctx.featureArcEnd);
                return ctx;
            },
            strokeCircleFlat(cx, cy, radiusX, radiusY, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.ellipse(cx, cy, radiusX, radiusY, 0, ctx.featureArcStart, ctx.featureArcEnd);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillCircleFlat(cx, cy, radiusX, radiusY, style) {
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.ellipse(cx, cy, radiusX, radiusY, 0, ctx.featureArcStart, ctx.featureArcEnd);
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            circle(cx, cy, radius) {
                if(ctx.featureArcStart !== 0){
                    ctx.moveTo(cx + Math.cos(ctx.featureArcStart) * radius, cy + Math.sin(ctx.featureArcStart) * radius);
                } else {
                    ctx.moveTo(cx + radius, cy);
                }
                ctx.arc(cx, cy, radius, ctx.featureArcStart, ctx.featureArcEnd);
                return ctx;
            },
            strokeCircle(cx, cy, radius, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.arc(cx, cy, radius, ctx.featureArcStart, ctx.featureArcEnd);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillCircle(cx, cy, radius, style) {
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.arc(cx, cy, radius, ctx.featureArcStart, ctx.featureArcEnd);
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokeRectangle(x, y, width, height, style) {
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            fillRectangle(x, y, width, height, style) {
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            star(cx, cy, radius1, radius2, points, start = 0){
                var i;
                if(points > 2){
                    var angStep = PI2 / points;
                    if(angStep * radius1 < 2){  // side length smaller than 2 pixels is a circle
                        angStep = radius1 / 2;
                    }
                    const angStepHalf = angStep / 2;
                    for(i = 0; i < points; i++){
                        if(i === 0){
                            ctx.moveTo(
                                Math.cos(start) * radius2 + cx,
                                Math.sin(start) * radius2 + cy
                            );
                        }else{
                            const ang = start + angStep * i;
                            ctx.lineTo(
                                Math.cos(ang) * radius2 + cx,
                                Math.sin(ang) * radius2 + cy
                            );
                        }
                        const ang = start + angStepHalf + angStep * i;
                        ctx.lineTo(
                            Math.cos(ang) * radius1 + cx,
                            Math.sin(ang) * radius1 + cy
                        );
                    }
                    ctx.closePath();
                }
                return ctx;
            },
            fillStar(cx, cy, radius1, radius2, points, start, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                var i;
                if(points > 2){
                    ctx.beginPath();
                    ctx.star(cx, cy, radius1, radius2, points, start);
                    ctx.fill(ctx.fillRule);
                }
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokeStar(cx, cy, radius1, radius2,points, start, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                var i;
                if(points > 2){
                    ctx.beginPath();
                    ctx.star(cx, cy, radius1, radius2, points, start);
                    ctx.stroke();
                }
                if (restore) { ctx.restore() }
                return ctx;
            },
            polygon(cx, cy, radius, sides, start = 0, forced = false){
                var i;
                if(sides > 2){
                    const angStep = PI2 / sides;
                    if(!forced && angStep * radius < 2){  // side length smaller than 2 pixels is a circle
                        ctx.circle(cx, cy, radius);
                    }else{
                        for(i = 0; i < sides; i++){
                            if(i === 0){
                                ctx.moveTo(
                                    Math.cos(start) * radius + cx,
                                    Math.sin(start) * radius + cy
                                );
                            }else{
                                const ang = start + angStep * i;
                                ctx.lineTo(
                                    Math.cos(ang) * radius + cx,
                                    Math.sin(ang) * radius + cy
                                );
                            }
                        }
                        ctx.closePath();
                    }
                }
                return ctx;
            },
            fillPolygon(cx, cy, radius, sides, start, style, forced = false){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                var i;
                if(sides > 2){
                    ctx.beginPath();
                    ctx.polygon(cx, cy, radius, sides, start, forced);
                    ctx.fill(ctx.fillRule);
                }
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokePolygon(cx, cy, radius, sides, start, style, forced = false){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                var i;
                if(sides > 2){
                    ctx.beginPath();
                    ctx.polygon(cx, cy, radius, sides, start, forced);
                    ctx.stroke();
                }
                if (restore) { ctx.restore() }
                return ctx;
            },
            roundedPath(points, radius) {
                var i,cross, o, len, len2, x1,y1,x2,y2,x3,y3,p1,p2,p3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2;
                var r = radius;
                o = pointsToCoords(points);
                len = (len2 = o.length) / 2;
                for(i = 0; i < len; i ++ ){
                    p1 = i * 2;
                    p2 = ((i + 1) * 2) % len2;
                    p3 = ((i + len - 1) * 2) % len2;
                    x1 = o[p1];
                    y1 = o[p1 + 1];
                    x2 = o[p2];
                    y2 = o[p2 + 1];
                    x3 = o[p3];
                    y3 = o[p3 + 1];
                    vx1 = x2 - x1;
                    vy1 = y2 - y1;
                    vx2 = x3 - x1;
                    vy2 = y3 - y1;
                    a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                    b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                    c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                    nx1 = vx1 / a;
                    ny1 = vy1 / a;
                    nx2 = vx2 / b;
                    ny2 = vy2 / b;
                    ang = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
                    d1 = Math.sqrt(Math.pow(r / Math.sin(ang / 2), 2) - r * r);
                    cross = nx1 * ny2 - nx2 * ny1;
                    if (cross < 0) {
                        as = Math.atan2(-nx2, ny2);
                        ae = Math.atan2(nx1, -ny1);
                        x = x1 + nx1 * d1 - (-ny1) * r;
                        y = y1 + ny1 * d1 - nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae, true);
                    } else {
                        as = Math.atan2(nx2, -ny2);
                        ae = Math.atan2(-nx1, ny1);
                        x = x1 + nx1 * d1 + -ny1 * r;
                        y = y1 + ny1 * d1 + nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae);
                    }
                }
                ctx.closePath();
                return ctx;
            },
            fillRoundedPath(points, radius, style){
                 if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.roundedPath(points, radius);
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokeRoundedPath(points, radius, style){
                 if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.roundedPath(points, radius);
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            roundedRect(x, y, w, h, radius){
                ctx.moveTo(x + radius, y);
                ctx.arc(x + w - radius, y + radius, radius, PI270, PI2);
                ctx.arc(x + w - radius, y + h - radius, radius, 0, PI90);
                ctx.arc(x + radius, y + h - radius, radius, PI90, PI);
                ctx.arc(x + radius, y + radius, radius, PI, PI270);
                ctx.closePath();
                return ctx;
            },
            fillRoundedRect(x, y, w, h, radius, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.arc(x + w - radius, y + radius, radius, PI270, PI2);
                ctx.arc(x + w - radius, y + h - radius, radius, 0, PI90);
                ctx.arc(x + radius, y + h - radius, radius, PI90, PI);
                ctx.arc(x + radius, y + radius, radius, PI, PI270);
                ctx.closePath();
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokeRoundedRect(x, y, w, h, radius, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.arc(x + w - radius, y + radius, radius, PI270, PI2);
                ctx.arc(x + w - radius, y + h - radius, radius, 0, PI90);
                ctx.arc(x + radius, y + h - radius, radius, PI90, PI);
                ctx.arc(x + radius, y + radius, radius, PI, PI270);
                ctx.closePath();
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
            pill(x1, y1, x2, y2, radius){
                const vx = (x2 - x1);
                const vy = (y2 - y1);
                const dir = Math.atan2(vy, vx);
                ctx.moveTo(
                    Math.cos(dir-PI90) * radius + x2,
                    Math.sin(dir-PI90) * radius + y2
                );
                ctx.arc(x2,y2,radius, dir - PI90, dir + PI90);
                ctx.arc(x1,y1,radius, dir + PI90, dir + PI270);
                ctx.closePath();
                return ctx;
            },
            fillPill(x1, y1, x2, y2, radius, style){
                if (style) { setStyle(ctx, styleTypes.fill, style) }
                ctx.beginPath();
                ctx.pill(x1, y1, x2, y2, radius)
                ctx.fill(ctx.fillRule);
                if (restore) { ctx.restore() }
                return ctx;
            },
            strokePill(x1, y1, x2, y2, radius, style){
                if (style) { setStyle(ctx, styleTypes.stroke, style) }
                ctx.beginPath();
                ctx.pill(x1, y1, x2, y2, radius)
                ctx.stroke();
                if (restore) { ctx.restore() }
                return ctx;
            },
        });
    }
    return function(context,settings){
        var canvas;
        var ctx;
        var returnObj;
        if (typeof context === "string") {
            canvas = document.querySelector(context);
            if (canvas instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== "undefined" && context instanceof  OffscreenCanvas)) {
                ctx = canvas.getContext("2d");
            } else {
                console.warn("CanvasGroover could not find the canvas.");
                return {canvas : null, ctx : undefined};
            }
        }else if (context instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== "undefined" && context instanceof  OffscreenCanvas)) {
            canvas = context;
            ctx = canvas.getContext("2d");
            canvas.ctx = ctx;
            returnObj = canvas;
        } else if (context instanceof CanvasRenderingContext2D || (typeof OffscreenCanvasRenderingContext2D !== "undefined"  && context instanceof OffscreenCanvasRenderingContext2D)) {
            ctx = context;
            canvas = ctx.canvas;
            returnObj = ctx;
        } else if(settings === undefined && context === undefined){
            if(typeof OffscreenCanvas !== "undefined") {
                canvas = new OffscreenCanvas(16,16);//document.createElement("canvas");
                ctx = canvas.getContext("2d");
                canvas.ctx = ctx;
            } else {
                canvas = document.createElement("canvas");
                canvas.width = 16
                canvas.height = 16;
                ctx = canvas.getContext("2d");
            }
            returnObj = canvas;
        } else if(settings === undefined){
            settings = context;
            if(typeof OffscreenCanvas !== "undefined") {
                canvas = new OffscreenCanvas(16,16);//document.createElement("canvas");
                ctx = canvas.getContext("2d");
                canvas.ctx = ctx;
            } else {
                canvas = document.createElement("canvas");
                canvas.width = 16
                canvas.height = 16;
                ctx = canvas.getContext("2d");
            }

            returnObj = canvas;
        }
        addStandardExtentions(ctx);
        if (settings === undefined || settings.all === true) {
            addShapeExtensions(ctx);
            addMarkerExtensions(ctx);
            addArrowExtensions(ctx);
            addGradientExtensions(ctx);
            addPixelArtExtensions(ctx);
            addImageExtensions(ctx);
            addStyleExtensions(ctx);
            addTextExtensions(ctx);
            addFillExtensions(ctx);
            addGraphingExtentions(ctx);
        } else {
            if (settings.shapes === true) { addShapeExtensions(ctx) }
            if (settings.markers === true) { addMarkerExtensions(ctx) }
            if (settings.arrows === true) { addArrowExtensions(ctx) }
            if (settings.gradients === true) { addGradientExtensions(ctx) }
            if (settings.pixelArt === true) { addPixelArtExtensions(ctx) }
            if (settings.images === true) { addImageExtensions(ctx) }
            if (settings.style === true) { addStyleExtensions(ctx) }
            if (settings.text === true) { addTextExtensions(ctx) }
            if (settings.fills === true) { addFillExtensions(ctx) }
            if (settings.graphing === true) { addGraphingExtentions(ctx) }
        }
        ctx.fillRule = "nonzero"; // "evenodd"
        ctx.fontSize = Number(ctx.font.split("px")[0]);
        ctx.featureSize = defaultFeatureSize; // in pixels
        ctx.featureAspect = defaultFeatureAspect;
        ctx.featureArcStart = defaultFeatureArcStart;
        ctx.featureArcEnd = defaultFeatureArcEnd;
        return returnObj;
    }

})();
const CanvasGrooverHelpers=(()=>{
    const API = {
        createImage(w, h) {
            if(typeof OffscreenCanvas !== "undefined") {
                const can = new OffscreenCanvas(w,h);
                can.ctx = can.getContext("2d");
                return can;
            }
            const can = document.createElement("canvas");
            can.width = w;
            can.height = h;
            can.ctx = can.getContext("2d");
            return can;
        },
        cloneImage(image) {
            const img = API.createImage(image.width,image.height);
            img.ctx.drawImage(image,0,0);
            if (image.sprites) {
                img.sprites = image.sprites.map(sprite => ({x : sprite.x, y : sprite.y, w : sprite.w, h : sprite.h}));
            }
            return img;
        },
        addSpriteToImage(image, x, y, w, h){
            if (image.sprites === undefined) { image.sprites = [] }
            image.sprites.push({x, y, w, h});
        },
        addSpriteGridToImage(image, width, height) {
            var x, y;
            if (image.sprites === undefined) { image.sprites = [] }
            for (y = 0; y < image.height - height; y += height) {
                for (x = 0; x < image.width - width; x += width) {
                    image.sprites.push({x : x, y : y, w : width, h : height});
                }
            }
        },
        getData(image) {
           /* if(instanceof image HTMLCanvasElement){
                if(image.ctx && instanceof image.ctx CanvasRenderingContext2D){
                    return image.ctx.getImageData(0,0,image.width,image.height);
                }else{
                    return image.getContext("2d").getImageData(0,0,image.width,image.height);
                }
            }*/
        },
        createRect(x,y,w,h) { return setRect(x,y,w,h) },
    }
    return API;
})()