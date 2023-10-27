"use strict";
function ProcessImageWorker() {
    var progressVal = 0;
    var pLookup;
    function closestColorPair(fr,fg,fb){
        fr *= fr; fg *= fg; fb *= fb;
        var r,g,b;
        var len = pLookup.length;
        var i = 0,dist, min = Infinity, idx = -1;
        while(i < len){
            var p = pLookup[i];
            dist = ((fr-p[0]) ** 2 + (fg-p[1]) ** 2 + (fb-p[2]) ** 2);
            if(dist === 0) { return i + (i<<8) }
            if(dist < min){
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
        var i = 0,dist, min = Infinity, idx1 = -1;
        while(i < len){
            var p = pLookup[i];
            dist = ((fr-p[0]) ** 2 + (fg-p[1]) ** 2 + (fb-p[2]) ** 2);
            if(dist < min){
                min = dist;
                idx1 = i;
            }
            i ++;
        }
        if(idx1 === idx){ return idx + (idx<<8) }
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
        if(Math.random() < (r + g + b) / 3) { return idx + (idx1 << 8) }
        return idx + (idx << 8);

    }
    function closestColor(fr,fg,fb){
        fr *= fr; fg *= fg; fb *= fb;
        var r,g,b;
        var len = pLookup.length;
        var i = 0,dist, min = Infinity, idx = -1;
        while(i < len){
            var p = pLookup[i];
            dist = ((fr-p[0]) ** 2 + (fg-p[1]) ** 2 + (fb-p[2]) ** 2);
            if(dist === 0) { return i }
            if(dist < min){
                min = dist;
                idx = i;
            }
            i ++;
        }

        return idx;

    }

    const ditherMap = {
        map2 : [0/4,2/4,3/4,1/4],
        map3 : [0/9,7/9,3/9,6/9,5/9,2/9,4/9,1/9,8/9],
        map4 : [0/16,8/16,2/16,10/16,12/16,4/16,14/16,6/16,3/16,11/16,1/16,9/16,15/16,7/16,13/16,5/16],
    };
    var currentMap,currentSize,spread;
    function findOrderedDither(x,y,r,g,b){
        const offset = (currentMap[(x%currentSize) + (y%currentSize) * currentSize] - 0.5) * spread;
        return closestColor(r + offset,g + offset,b + offset)
    }


    const API = {
        applyPalletToImage(data, palletData, pallet, matrixSize){

            pLookup = palletData;
            spread = 255 / (pallet.length/ 3);
            currentMap = ditherMap["map" + matrixSize];
            currentSize = matrixSize;
            const d = data.data;
            const w = data.width;
            const len = d.length / 4;
            var idx = 0;
            var x = 0;
            var y = 0;
            var chunkSize = 64 * 64;

            function processPixels(){
                var count = chunkSize;
                var i1,ci,r,g,b,i = idx * 4;
                while(count && idx < len){
                    const pL = pallet[findOrderedDither(x,y,d[i],d[i+1],d[i+2])];
                    d[i++] = pL[0];
                    d[i++] = pL[1];
                    d[i++] = pL[2];
                    i++;
                    x += 1;
                    if(x === w){
                        x = 0;
                        y ++;
                    }
                    idx += 1;
                    count --;
                }
            }
            while(idx < len){
                processPixels();
                API.progress = idx / len
            }
            return data;
        },
        set progress(value) {
            progressVal = value;
            progressMessage(value);
        },
    };


    function workerFunction(data){
        var result;

        if(typeof API[data.call] === "function"){
            result = API[data.call](...data.args);
        }
        return result;
    }
}
const localProcessImage = (()=>{
    var workingCanvas = CanvasGroover();
    var ctx = workingCanvas.ctx;

    var holdingId = 100;
    var holding;
    function copyToWorking(image, showError = true){
        if(workingCanvas){


            if(workingCanvas.width !== image.w || workingCanvas.height !== image.h){
                workingCanvas.w = workingCanvas.width = image.w;
                workingCanvas.h = workingCanvas.height = image.h;
            }else{
                ctx.clearRect(0, 0, image.w, image.h);
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "copy";
            ctx.drawImage(image,0,0);
            ctx.globalCompositeOperation = "source-over";


            return true;
        }else{
            showError && log.error("Image processing failed. Working canvas is locked");
        }
    }
    function getCopyOfWorking(image){
        image.ctx.save();
        image.ctx.globalCompositeOperation = "copy";
        image.ctx.globalAlpha = 1;
        image.ctx.filter = "none";
        image.ctx.drawImage(workingCanvas,0,0);
        image.ctx.restore();

    }
    function resourceClean(){
        workingCanvas.width = 1;
        workingCanvas.height = 1;

    }
    function canProcess (img) { return img.isDrawable && !img.isLocked }
    function getPixelData8Bit(image, hold) {
        if (hold) {
            if (holding && image.ctx.buffer_Id === holdingId) {
                //log("Using held buffer ID:" + image.ctx.buffer_Id);
                return holding;
            }
            holding = image.ctx.getImageData(0,0,image.w,image.h);
            image.ctx.buffer_Id = ++holdingId;
            //log("Holding buffer ID:" + image.ctx.buffer_Id);
            return holding
        } else {
            //holding && log("Dropped held buffer");
            holding = undefined;
            return image.ctx.getImageData(0,0,image.w,image.h)
        }
    }
    function setPixelData(image, data) { image.ctx.putImageData(data,0,0) }
    function getSprPixelData8Bit(spr) {
        if (spr.type.subSprite) {
            const sub = spr.subSprite;
            return spr.image.ctx.getImageData(sub.x, sub.y, sub.w, sub.h);
        } else {
            return spr.image.ctx.getImageData(0, 0, spr.image.w, spr.image.h);
        }
    }
    function setSprPixelData(spr, data) {
        if (spr.type.subSprite) {
            const sub = spr.subSprite;
            return spr.image.ctx.putImageData(data, sub.x, sub.y);
        } else {
            return spr.image.ctx.putImageData(data, 0, 0);
        }
    }

    function RGBToHSLQuick(r, g, b, hsl = {}){
        var dif, h,s,l, min, max;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){
            hsl.h = hsl.s = 0;
            hsl.l = min;
            return hsl;
        }
        dif = max - min;
        l = max + min;
        if (l > 255) { s = dif / (510 - max - min) }
        else { s = dif / (max + min) }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2 }
        else { h = (r - g) / dif + 4 }
        hsl.h = (h * 42.5) % 255;
        hsl.s = s * 255;
        hsl.l = l / 2;
        return hsl;
    }
    media.addEvent("onremoved", () => holding = undefined);
    var pixelInFunc,pixelOutFunc;
    const events = [];
    var pId = 99999;
    const MAX_WORKERS = 8;
    var working = 0;
    var circleMask;
    const createCircleMask = () => {
        const img = new Image;
        img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbElEQVQ4T2NkwAT/sYghCzHi4hDSiG4u2CCYadg0o9gEVItVDTYD0DWi24xsECNIMYoAAf/DpOF6qGoAIadj9QqyC4aBAcjpglBkUDcWQLaRkhYwEhK6ATDnk5SUcRmCLyxQMhOyQkK5EsVlAHcLHAmYf3zxAAAAAElFTkSuQmCC";
        circleMask = img;
    }
    const jobQueue = [];
    function workerUpdate(){
        if(jobQueue.length > 0){
            if(working < MAX_WORKERS){
                const job = jobQueue.shift();
                var data = job.inspect ? job.image.pixels() : job.image.lock();
                if(data === undefined){
                    log.error("ERROR!! image can not give a lock.");
                    log.warn("System state untrusted, save work befor continuing.");
                    log.info("AGAIN...System state untrusted, save work befor continuing.");
                    return;
                }
                const workObj = {};
                const worker = workers.get(job.name);
                const wCall = EZWebWorkers.namedWorker(worker.worker,{obj : workObj, onprogress : (progress) => {job.image.progress = progress}});
                working += 1;
                wCall({call : job.name, args : [data, ...job.args]})
                    .then(data => {
                        wCall.close();
                        working -= 1;
                        if (!job.inspect) {  // warning batches may not have this set
                            job.image.unlock(data);
                            job.image.lastAction = job.name;
                            fireEvent(job.jobId);
                        } else {
                            API.fireEvent("workercomplete",[job.jobId, data]);
                        }
                        setTimeout(workerUpdate,0);
                    })
                    .catch(error => {
                        wCall.close();
                        working -= 1;
                        log.warn("Task failed '" + job.image.desc.name + "' due to worker Error.");
                        if (!job.inspect) {
                            job.image.unlock();
                            fireEvent(job.jobId)
                        } else {
                            API.fireEvent("workercomplete",job.jobId, false);
                        }
                        setTimeout(workerUpdate,0);
                    });
            }
        }
    }

    const workers = new Map();
    // Events are intended as a broadcasting service
    function fireEvent(pId){
        events.forEach(e => setTimeout(()=>e(pId),0));
    }
    const API = {
        // Event fires when non blocking filters are resolved
        addEventOLD(callback) {
            if(events.some(cb => cb === callback)){
                return;
            }
            events.push(callback);
        },
        removeEventOLD(callback) {
            const index = events.indexOf(callback);
            if (index > -1) {
                events.splice(index,1);
            }
        },
        borrowWorkingCanvas(){
            ctx.save();
            var wc = workingCanvas;
            workingCanvas = null;
            ctx = null
            return wc;
        },
        returnWorkingCanvas(canvas){
            workingCanvas = canvas;
            ctx = workingCanvas.ctx;
            ctx.restore();
        },
        registerWorker(workerFunction, ...functionNames){
            functionNames.forEach(name => {
                const named = name.split("|");
                workers.set(named[0], {functionName : name[0], worker : workerFunction, lockType: named[1]});
            })
        },
        createJob(name, image, ...args) {
            if(image.isDrawable){
                if(workers.has(name)){
                    const w = workers.get(name);
                    image.lockPending(w.lockType)
                    const jobId = getGUID();
                    jobQueue.push({name, image, args, jobId });
                    setTimeout(workerUpdate,0);
                    return jobId;
                }else{
                    log.warn("No worker named '"+name+"' found");
                }
            }else{
                log.warn("Can not process. Image '"+image.name + "' not drawable");
            }
        },
        createJobInspect(name, image, ...args) {  // Inspects the image. Pixels are not returned
            if(image.isDrawable){
                if(workers.has(name)){
                    const w = workers.get(name);
                    const jobId = getGUID();
                    jobQueue.push({name, image, args, inspect: true, jobId });
                    setTimeout(workerUpdate,0);
                    return jobId;
                }else{
                    log.warn("No worker named '"+name+"' found");
                }
            }else{
                log.warn("Can not process. Image '"+image.name + "' not drawable");
            }
        },
        halfSizeBitmap(img){
            var a1,a2,a3,a4,ch,cc;
            ch = [];
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                if (w === 1 || h === 1) {
                    img.lastAction = "Skipped Half pixel" ;
                    return true;
                }
                var data = img.ctx.getImageData(0, 0, w, h);
                var d = data.data;
                var x,y;
                var ww = w * 4;
                var ww4 = ww + 4;
                var i1,i2,i3,i4
                for (y = 0; y < h; y += 2) {
                    i4 = y + 1 === h ? 0 : ww;
                    for (x = 0; x < w; x += 2) {
                        var id = y * ww + x * 4;
                        var id1 = (y / 2 | 0) * ww + (x / 2 | 0) * 4;
                        i2 = x + 1 === w ? 0 : 4

                        a1 = d[id + 3];
                        a2 = d[id + 3 + i2];
                        a3 = d[id + i4 + 3 ];
                        a4 = d[id + i4 + 3 + i2];
                        if (a1 > 0 && a2 > 0 && a3 > 0 && a4 > 0) {
                            d[id1] = ((d[id] ** 2.2 + d[id + i2] ** 2.2 + d[id + i4] ** 2.2 + d[id + i4 + i2] ** 2.2) / 4) ** (1 / 2.2);
                            id += 1;
                            id1 += 1;
                            d[id1] = ((d[id] ** 2.2 + d[id + i2] ** 2.2 + d[id + i4] ** 2.2 + d[id + i4 + i2] ** 2.2) / 4) ** (1 / 2.2);
                            id += 1;
                            id1 += 1;
                            d[id1] = ((d[id] ** 2.2 + d[id + i2] ** 2.2 + d[id + i4] ** 2.2 + d[id + i4 + i2] ** 2.2) / 4) ** (1 / 2.2);
                            id += 1;
                            id1 += 1;
                            d[id1] = Math.sqrt((a1 * a1 + a2 * a2 + a3 * a3 + a4 * a4) / 4);
                        } else if (a1 + a2 + a3 + a4 === 0) {
                            d[id1++] = 0;
                            d[id1++] = 0;
                            d[id1++] = 0;
                            d[id1] = 0;
                        } else {
                            cc = 0;
                            ch[0] = ch[1] = ch[2] = 0;
                            if(a1 > 0){
                                ch[0] += d[id] ** 2.2;
                                ch[1] += d[id + 1] ** 2.2;
                                ch[2] += d[id + 2] ** 2.2;
                                cc++;
                            }
                            if(a2 > 0){
                                ch[0] += d[id + i2] ** 2.2;
                                ch[1] += d[id + i2 + 1] ** 2.2;
                                ch[2] += d[id + i2 + 2] ** 2.2;
                                cc++
                            }
                            if(a3 > 0){
                                ch[0] += d[id + i4    ] ** 2.2;
                                ch[1] += d[id + i4 + 1] ** 2.2;
                                ch[2] += d[id + i4 + 2] ** 2.2;
                                cc++
                            }
                            if(a4 > 0){
                                ch[0] += d[id + i4    ] * d[id + i4];
                                ch[1] += d[id + i4 + 1] * d[id + i4 + 1];
                                ch[2] += d[id + i4 + 2] * d[id + i4 + 2];
                                cc++;
                            }
                            d[id1++] = (ch[0] / cc) ** (1 / 2.2);
                            d[id1++] = (ch[1] / cc) ** (1 / 2.2);
                            d[id1++] = (ch[2] / cc) ** (1 / 2.2);
                            d[id1] = ((a1 * a1 + a2 * a2 + a3 * a3 + a4 * a4) / 4) ** 0.5;
                        }
                    }
                }
                w = w / 2 | 0;
                h = h / 2 | 0;
                img.desc.mirror.width = w ;
                img.desc.mirror.height = h;
                img.w = img.width = w;
                img.h = img.height = h;
                img.ctx.putImageData(data,0,0);
                img.desc.mirror.ctx.drawImage(img,0,0);
                img.desc.dirty = true;
                img.lastAction = "High quality halved";
                img.desc.clippedTop = w / 2;
                img.desc.clippedLeft = h / 2;
                img.restore();
                return true;
            }
        },
        downSampleBitmap(img, w, h){
            if(img.isDrawable){
                var srcW = img.w;
                var srcH = img.h;
                const srcData = img.ctx.getImageData(0,0,srcW,srcH);
                const destData = img.ctx.getImageData(0,0,w,h);
                const xStep = srcW / w;
                const yStep = srcH / h;
                const area = xStep * yStep
                const sD = srcData.data;
                const dD = destData.data;
                const RGB2sRGB = 2.2;
                const sRGB2RGB = 1 / RGB2sRGB;
                const sRGBMax = 255 ** RGB2sRGB;
                var x, y = 0, sx, sy, xx, yy, r, g, b, a;

                while (y < h) {
                    sy = y * yStep;
                    x = 0;
                    while (x < w) {
                        sx = x * xStep;
                        const ssyB = sy + yStep;
                        const ssxR = sx + xStep;
                        r = g = b = a = 0;
                        let st = 0;
                        yy = sy | 0;
                        while (yy < ssyB) {
                            const yy1 = yy + 1;
                            const yEdge = yy1 > ssyB ? ssyB - yy : yy < sy ? 1 - (sy-yy) : 1;
                            xx = sx | 0;
                            while (xx < ssxR) {
                                const xx1 = xx + 1;
                                const xEdge = xx1 > ssxR ? ssxR - xx : xx < sx ? 1 - (sx-xx) : 1;
                                const srcContribution = (yEdge * xEdge) / area;
                                const idx = (yy * srcW + xx) * 4;
                                r += ((sD[idx]   ** RGB2sRGB) / sRGBMax) * srcContribution;
                                g += ((sD[idx+1] ** RGB2sRGB) / sRGBMax) * srcContribution;
                                b += ((sD[idx+2] ** RGB2sRGB) / sRGBMax) * srcContribution;
                                a +=  (sD[idx+3] / 255) * srcContribution;
                                xx += 1;
                            }
                            yy += 1;
                        }
                        const idx = (y * w + x) * 4;
                        dD[idx]   = (r * sRGBMax) ** sRGB2RGB;
                        dD[idx+1] = (g * sRGBMax) ** sRGB2RGB;
                        dD[idx+2] = (b * sRGBMax) ** sRGB2RGB;
                        dD[idx+3] = a * 255;
                        x += 1;
                    }
                    y += 1;
                }
                img.desc.clippedTop = 0;
                img.desc.clippedLeft = 0;
                img.desc.mirror.width = w ;
                img.desc.mirror.height = h;
                img.w = img.width = w;
                img.h = img.height = h;
                img.ctx.putImageData(destData,0,0);
                img.desc.mirror.ctx.drawImage(img,0,0);
                img.desc.dirty = true;
                img.lastAction = "Down Sampled";
                img.restore();
                return true;


            }
        },
        halfSizeBitmapNearestDom(img, vert, dark) {
            var a1,a2,a3,a4;
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                if (w === 1 || h === 1) {
                    img.lastAction = "Skipped Half nearest dom" ;
                    return true;
                }
                var data = img.ctx.getImageData(0,0,w,h);
                var d = data.data;
                const d32 = new Uint32Array(d.buffer);
                var x,y;
                var ww = w;
                var r, r1, r2, aa, aa1, aa2, i,idA, id1;
                const w4 = ww * 4;
                var pxs = [0,0];
                var val = [0,0];
                const xStep = vert ? 1 : 2;
                const yStep = vert ? 2 : 1;

                for (y = 0; y < h; y += yStep) {
                    for (x = 0; x < w; x += xStep) {
                        idA = (y*ww+x) * 4;
                        id1 = vert ? (y / 2 | 0) * ww + x : y * ww + (x / 2 | 0);
                        aa1 = d[idA + 3];
                        aa2 = vert ? d[idA + w4 + 3] : d[idA + 7] ;
                        aa = aa1 >= aa2 ? aa1 : aa2;
                        if (aa === 0) {
                            d32[id1] = 0;
                        } else {
                            aa <<= 24;
                            var id = y*ww+x;
                            i = 0;
                            aa1 > 0 && (pxs[i] = d32[id] & 0xFFFFFF, val[i++] = d[idA] * 0.3 + d[idA + 1] * 0.5 + d[idA + 2] * 0.2);
                            aa2 > 0 && (pxs[i] = d32[id + 1] & 0xFFFFFF, val[i++] = d[idA + 4] * 0.3 + d[idA + 5] * 0.5 + d[idA + 6] * 0.2);
                            if (i === 1) {
                                d32[id1] = pxs[0] | aa;
                            } else {
                                r1 = val[0]; r2 = val[1];;
                                if (dark) {
                                    if (r1 < r2) { d32[id1] = pxs[0] | aa }
                                    else { d32[id1] = pxs[1] | aa }
                                } else {
                                    if (r1 > r2) { d32[id1] = pxs[0] | aa }
                                    else { d32[id1] = pxs[1] | aa }
                                }
                            }

                        }


                    }
                }

                w = vert ? w : w / 2 | 0;
                h = vert ? h / 2 | 0 : h;
                img.desc.mirror.width = w ;
                img.desc.mirror.height = h;
                img.w = img.width = w;
                img.h = img.height = h;
                img.ctx.putImageData(data,0,0);
                img.desc.mirror.ctx.drawImage(img,0,0);
                img.desc.dirty = true;
                img.lastAction = "Half " + (dark ? (vert ? "Dark vert" : "Dark Hor") : (vert ? "Light vert" : "Light hor"))  + " PixArt";
                img.desc.clippedTop = 0;
                img.desc.clippedLeft = 0;
                img.restore();
                return true;
            }
        },
        halfSizeBitmapNearest(img, dark = false) {
            var a1,a2,a3,a4;
            if(img.isDrawable){

                var w = img.w;
                var h = img.h;
                if (w === 1 || h === 1) {
                    img.lastAction = "Skipped Half Nearest" ;
                    return true;
                }
                var data = img.ctx.getImageData(0,0,w,h);
                var data1 = img.ctx.getImageData(0,0,w,h);
                var d = data.data;
                const d32 = new Uint32Array(d.buffer);
                const d32B = new Uint32Array(data1.data.buffer);
                var x,y;
                var ww = w;
                var a, a1, a2, a3, a4, i,idA, idxh, idx;
                var v1,v2,v3,v4;
                const w4 = w * 4;
                var as = [0,0,0,0];
                var mv = 256 * 3;
                var Mv = 0;
                var minPx = 0;
                var maxPx = 0;

                for (y = 0; y < h; y += 2) {
                    for (x = 0; x < w; x += 2) {
                        idA = (y * w + x) * 4;
                        idx = y * w + x;
                        i = 0;
                        a = d[idA + 3];
                        a += d[idA + 7];
                        a += d[idA + w4 + 3];
                        a += d[idA + w4 + 7];
                        if (a === 0) {
                            d32B[((y >> 1) * w) + (x >> 1)] = 0;
                        } else {
                            v1 = d[idA] + d[idA + 1] + d[idA + 2];
                            v2 = d[idA + 4] + d[idA + 5] + d[idA + 6];
                            v3 = d[idA + w4] + d[idA + w4 + 1] + d[idA + w4 + 2];
                            v4 = d[idA + w4 + 4] + d[idA + w4 + 5] + d[idA + w4 +6];
                            a1 = d32[idx] & 0xFFFFFF;
                            a2 = d32[idx + 1] & 0xFFFFFF;
                            a3 = d32[idx + w] & 0xFFFFFF;
                            a4 = d32[idx + w + 1] & 0xFFFFFF;
                            if (d32[idx] > 0 && v1 < mv) { mv = v1; minPx = d32[idx] }
                            if (d32[idx + 1] > 0 && v2 < mv) { mv = v2; minPx = d32[idx + 1] }
                            if (d32[idx + w ] > 0 && v3 < mv) { mv = v3; minPx = d32[idx + w] }
                            if (d32[idx + w + 1] > 0 && v4 < mv) { mv = v4; minPx = d32[idx + w + 1] }
                            if (d32[idx] > 0 && v1 > Mv) { Mv = v1; maxPx = d32[idx] }
                            if (d32[idx + 1] > 0 && v2 > Mv) { Mv = v2; maxPx = d32[idx + 1] }
                            if (d32[idx + w] > 0 && v3 > Mv) { Mv = v3; maxPx = d32[idx + w] }
                            if (d32[idx + w + 1] > 0 && v4 > Mv) { Mv = v4; maxPx = d32[idx + w + 1] }
                            if ((a1 === a2 && a2 === a3 && a3 === a4) || (a1 !== a2 && a2 !== a3 && a3 !== a4)) {
                                d32B[((y >> 1) * w) + (x >> 1)] = d32[idx];
                            } else {
                                as[0] = as[1] = as[2] = as[3] = 1;
                                a1 === a2 && (as[0]++, as[1]++);
                                a1 === a3 && (as[0]++, as[2]++);
                                a1 === a4 && (as[0]++, as[3]++);
                                a2 === a3 && (as[1]++, as[2]++);
                                a2 === a4 && (as[1]++, as[3]++);
                                a3 === a4 && (as[2]++, as[3]++);
                                const m = Math.max(...as);
                                if (m === 3) {
                                    d32B[((y >> 1) * w) + (x >> 1)] = as[0] === 3 ? d32[idx] : d32[idx + 1];
                                } else {
                                    if (a1 === a2) {
                                        d32B[((y >> 1) * w) + (x >> 1)] =  v1 < v3 ? d32[idx] : d32[idx + w];
                                    } else {
                                        d32B[((y >> 1) * w) + (x >> 1)] =  v1 < v2 ? d32[idx] : d32[idx + 1];
                                    }
                                }
                            }
                        }
                    }
                }

                const setCol = (val, vCmp) => {
                    for (y = 0; y < h; y += 2) {
                        for (x = 0; x < w; x += 2) {
                            idx = y * w + x;
                            a1 = d32[idx];
                            a2 = d32[idx + 1];
                            a3 = d32[idx + w];
                            a4 = d32[idx + w + 1];
                            if (((a1 & 0xFF000000) && (a1 & 0xFFFFFF) === vCmp) ||
                                ((a2 & 0xFF000000) && (a2 & 0xFFFFFF) === vCmp) ||
                                ((a3 & 0xFF000000) && (a3 & 0xFFFFFF) === vCmp) ||
                                ((a4 & 0xFF000000) && (a4 & 0xFFFFFF) === vCmp)) {
                                d32B[((y >> 1) * w) + (x >> 1)] = val;
                            }
                        }
                    }
                }
                if (dark) {
                    setCol(maxPx, maxPx & 0xFFFFFF);
                    setCol(minPx, minPx & 0xFFFFFF);
                } else {
                    setCol(minPx, minPx & 0xFFFFFF);
                    setCol(maxPx, maxPx & 0xFFFFFF);
                }



                w >>= 1;
                h >>= 1;
                img.desc.mirror.width = w;
                img.desc.mirror.height = h;
                img.w = img.width = w;
                img.h = img.height = h;
                img.ctx.putImageData(data1,0,0);
                img.desc.mirror.ctx.drawImage(img,0,0);
                img.desc.dirty = true;
                img.lastAction = "Half pixel" ;
                img.desc.clippedTop = 0;
                img.desc.clippedLeft = 0;
                img.restore();
                return true;
            }
        },
        getPxArtColors(img) {
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                var data = img.ctx.getImageData(0,0,w,h);
                var d = data.data;
                const d32 = new Uint32Array(d.buffer);
                var x, y, i = 0;
                const cols = new Map();
                while (i < d32.length) {
                    const c = d32[i++];
                    if (c & 0xFF000000) {
                        const rgb = c & 0xFFFFFF;
                        if (!cols.has(rgb)) {
                            cols.set(rgb, [rgb, 1]);
                        } else {
                            cols.get(rgb)[1]++;
                        }
                    }
                }
                const allC = [...cols.values()];
                log("Got " + allC.length);
                allC.sort((a,b) => b[1] - a[1]);
                const pallet = media.createPallet(0);
                pallet.sortBy = "noSort";
                for(const c of allC) {
                    pallet.addColor(c[0] & 0xFF, (c[0] >> 8) & 0xFF, (c[0] >> 16) & 0xFF);
                }
                return pallet;
            }



        },
        pixelShuffle(img){
            if(img.isDrawable){
                const w = img.w, h = img.h, size = w * h, ww = w -1, offsets = [-w-1,-w,-w+1,-1,1,w-1,w,w+1];
                const imgData = img.ctx.getImageData(0,0,w,h);
                const d32 = new Uint32Array(imgData.data.buffer);
                var i = size;
                while (i--) {
                    const x = Math.random() * w | 0;
                    const y = Math.random() * h | 0;
                    const idx = x + y * w;
                    const idx1 = idx + offsets[Math.random() * 8 | 0];
                    if(idx1 >= 0  && idx1 < size) {
                        if((x > 0 && x < ww) || (x === 0 && (idx1 % w) !== ww) || (x === ww && (idx1 % w > 0))) {
                            const tp = d32[idx];
                            d32[idx] = d32[idx1];
                            d32[idx1] = tp;
                        }
                    }
                }
                img.ctx.putImageData(imgData,0,0);
                img.desc.dirty = true;
                img.lastAction = "Shuffle";
                img.processed = true;
                img.update();
                return true;
            }
        },
        pixelMap(img, templateImg){
            if(img.isDrawable &&  templateImg?.isDrawable && img !== templateImg){
                if (img.w === templateImg.w && img.h === templateImg.h) {
                    const w = img.w, h = img.h, size = w * h;
                    const imgData = img.ctx.getImageData(0,0,w,h);
                    const tImgData = templateImg.ctx.getImageData(0,0,w,h);
                    const d32 = new Uint32Array(imgData.data.buffer);
                    const dT32 = new Uint32Array(tImgData.data.buffer);
                    var ww = 0, hh = 0;
                    while (d32[ww] !== 0 && ww < w) { ww ++ };
                    while (d32[hh * w] !== 0 && hh < h) { hh ++ };
                    var x = 0, y = 0, xx, yy;
                    for (y = 0; y < hh; y++) {
                        for (x = 0; x < ww; x++) {
                            const idx = y * w + x;
                            const id = dT32[idx];
                            const px = d32[idx];
                            for (yy = 0; yy < h; yy ++) {
                                for (xx = ww; xx < w; xx ++) {
                                    const idx = xx + yy * w;
                                    if (dT32[idx] === id) { d32[idx] = px }
                                }
                            }
                        }
                    }
                    img.ctx.putImageData(imgData,0,0);
                    img.desc.dirty = true;
                    img.lastAction = "Pixel mapped";
                    img.processed = true;
                    img.update();
                    return true;
                }
            }
        },
        pixelPlugHoles(img, level = 3) {
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                const w2 = w * 2;
                const w3 = w * 3;
                const data = getPixelData8Bit(img);
                const d = data.data;
                const d32 = new Uint32Array(d.buffer);
                const ps = new Uint8Array(d32.length);
                const offsets = [[
                    -w-1, -w, -w+1, // 0 - 2
                    -1,        1,   // 3 - 4
                     w-1,  w,  w+1],[ // 5 - 7
                     -w2-2, -w2-1, -w2, -w2+1, -w2+2, // 0 - 4
                     -w-2,                     -w+2,  // 5,6
                     -2,                        2,    // 7,8
                      w-2,                      w+2,  // 9,10
                      w2-2,  w2-1,  w2,  w2+1,  w2+2], [ // 11 - 15
                     -w3-3, -w3-2, -w3-1, -w3, -w3+1, -w3+2, -w3+3, // 0 - 6
                     -w2-3,                                  -w2+3, // 7, 8
                     -w-3,                                   -w+3,  // 9, 10
                     -3,                                      3,    // 11, 12
                     w-3,                                     w+3,  // 13, 14
                     w2-3,                                    w2+3, // 15, 16
                     w3-3,  w3-2,  w3-1,  w3,  w3+1,  w3+2,   w3+3] // 17 - 23
                ];
                const paths = [[
                    // indexes from offsets[1] to offsets[0]
                    0,0,1,2,2, // 0 - 4
                    0,      2, // 5,6
                    3,      4, // 7,8
                    5,      7, // 9,10
                    5,5,6,7,7], [ // 11 - 15
                    // indexes from offsets[2] to offsets[0]
                    0,0,1,1,1,2,2,
                    0,          2,
                    3,          4,
                    3,          4,
                    3,          4,
                    5,          7,
                    5,5,6,6,6,7,7],
                ];
                const pathsStep = [
                    0, 0, 1, 2, 3, 4, 4,
                    0,                4,
                    5,                6,
                    7,                8,
                    9,                10,
                    11,               15,
                    11,11,12,13,14,15,15

                ];
                //const revs = [[

                var x,y;
                const isConnected = (level, idx, px) => {
                    const os = offsets[level];
                    const len = offsets[level].length
                    var i = len, o = Math.random() * len | 0;
                    while (i-- > 0) {
                        if (d32[idx + os[o % len]] === px) { return (o % len) + 1 }
                        o ++;
                    }
                    return 0;
                }
                const nei = {
                    free: 0,
                    mask: 0,
                };
                const getNCount = (idx, px)=> {
                    const os = offsets[0];
                    const len = offsets[0].length
                    var i = len, o = Math.random() * len | 0;
                    var freeMask = 0;
                    var free = 0
                    while (i-- > 0) {
                        const idx1 = idx + os[o % len];
                        if (d32[idx1] !== px && (ps[idx1] & 0b10000000) !== 0b10000000) {
                            free ++;
                            freeMask += 1 << (o % len)
                        }
                        o ++;
                    }
                    nei.free = free;
                    nei.mask = freeMask;

                    return free;
                }
                //  76543210,   76543210,   76543210,   76543210,   76543210,   76543210,   76543210,   76543210,   76543210,
                const spaceMasks =  [0b00101111, 0b00111111, 0b10010111, 0b01101011, 0b11010110, 0b11101001, 0b11111100, 0b11110100];

                // 0 1 2
                // 3 - 4
                // 5 6 7
                const spaceCorn = [
                    [3,0,1],[0,1,2],[1,2,4], [5,3,0], [7,4,2], [6,5,3], [7,6,5], [4,7,6],
                ];
                const nPath = [];

                const canJoin = (px, idx, crn, os) => {
                    if (d32[idx + os[crn[0]]] === px ||
                        d32[idx + os[crn[1]]] === px ||
                        d32[idx + os[crn[2]]] === px) {
                            return true;
                    }


                }
                const nextNt = (idx, px, fMask)=> {
                    const os = offsets[0];
                    const len = offsets[0].length;


                    var i = len, o = 0;
                    while (i-- > 0) {
                        const sm = spaceMasks[o];
                        if ((fMask & sm) === sm) {

                            const crn = spaceCorn[o];
                            const idx1 = idx + os[o];
                            if (canJoin(px, idx1, crn, os)) {
                                nPath[0] = idx1;
                                return 1;
                            }
                            if (level > 1) {
                                let i = 0;
                                while (i < crn.length) {
                                    const idx2 = idx1 + os[crn[i]];
                                    const crn1 = spaceCorn[crn[i]];
                                    if (canJoin(px, idx2, crn1, os)) {
                                        nPath[0] = idx1;
                                        nPath[1] = idx2;
                                        return 2;
                                    }
                                    if (level > 2) {
                                        let ii = 0;
                                        while (ii < crn1.length) {
                                            const idx3 = idx2 + os[crn1[ii]];
                                            if (canJoin(px, idx3, spaceCorn[crn[ii]], os)) {
                                                nPath[0] = idx1;
                                                nPath[1] = idx2;
                                                nPath[2] = idx3;
                                                return 3;
                                            }
                                            ii++;
                                        }
                                    }
                                    i++;
                                }
                            }
                        }
                        o ++;
                    }
                    return 0;
                }
                const markIsolated = () => {
                    for (y = 2; y < h - 2; y++) {
                        for (x = 2; x < w - 2; x++) {
                            const idx = x + y * w;
                            const p = d32[idx];
                            if (p) {
                                if (!isConnected(0, idx, p)) {
                                    if (level > 1) {
                                        const c = isConnected(1, idx, p);
                                        if (! c) {
                                            if (level > 2) {
                                                const c = isConnected(2, idx, p);
                                                if (c) { ps[idx] = (c & 0b00011111) + 0b01000000 }
                                            }
                                        } else { ps[idx] =  (c & 0b00011111) + 0b00100000 }
                                    }
                                } else { ps[idx] = 0b10000000 }
                            }
                        }
                    }
                }



                const pathsCount2 = offsets[2].length;
                const pathsCount1 = offsets[1].length;
                const levPathA = paths[0], levPathB = paths[1], os = offsets[0];
                const  os1 = offsets[2];
                var moveMaxDist = 10;
                var moveDist = 0;



                const move1 = (idx, pp) => {
                    const toPos =  (pp & 0b11111) - 1;
                    const add = os[levPathA[toPos]];
                    const addLoc = os1[toPos];
                    d32[idx + add] = d32[idx];
                    ps[idx] = 0;
                    ps[idx + add] = 0;
                    const cp = ps[idx + addLoc];
                    if (cp && (cp & 0b01100000) === 0b00100000) {
                        const rpos = pathsCount1 - (cp & 0b11111);
                        if(rpos === toPos) {
                            ps[idx + addLoc] = 0;
                        } else if (moveDist > 0) {
                            moveDist --;
                            move1(idx + addLoc, cp);
                        }
                    } else if (cp && (cp & 0b01100000) === 0b01000000) {
                       if (moveDist > 0) {
                            moveDist --;
                            move2(idx + addLoc, cp);
                        }

                    }
                }
                const move2 = (idx, pp) => {
                    const toPos =  (pp & 0b11111) - 1;
                    const addA = os[levPathB[toPos]];
                    const addB = addA + os[levPathA[pathsStep[toPos]]];
                    const addLoc = os1[toPos];
                    d32[idx + addA] = d32[idx];
                    d32[idx + addB] = d32[idx];
                    ps[idx] = 0;
                    ps[idx + addA] = 0;
                    ps[idx + addB] = 0;
                    const cp = ps[idx + addLoc];
                    if (cp && (cp & 0b01100000) === 0b01000000) {
                        const rpos = pathsCount2 - (cp & 0b11111);
                        if(rpos === toPos) {
                            ps[idx + addLoc] = 0;
                        } else if (moveDist > 0) {
                            moveDist --;
                            move2(idx + addLoc, cp);
                        }
                    } else if (cp && (cp & 0b01100000) === 0b00100000) {
                        if (moveDist > 0) {
                            moveDist --;
                            move1(idx + addLoc, cp);
                        }
                    }
                }

                const connectIsolated = (mask, move) => {
                    var i = d32.length;
                    var idx = 0;
                    while (i--) {
                        const pp = ps[idx];
                        if (pp && (pp & mask)) {
                            moveDist = moveMaxDist;
                            move(idx, pp);
                        }
                        idx ++;
                    }
                }
                const connectIsolatedTails = () => {
                    var i = d32.length;
                    var idx = 0;
                    while (i--) {
                        const pp = ps[idx];
                        if (pp && (pp & 0b10000000)) {
                            const f = getNCount(idx, d32[idx]);
                            if (f > 5) {
                                var nidx = nextNt(idx, d32[idx], nei.mask);
                                while (nidx-- > 0) {
                                    d32[nPath[nidx]] = d32[idx];
                                    ps[nPath[nidx]] = 0;
                                }
                            }
                        }
                        idx ++;
                    }
                }

                markIsolated();
                connectIsolated(0b00100000, move1);
                connectIsolated(0b01000000, move2);
                connectIsolatedTails();


                setPixelData(img, data);
                img.processed = true;
                img.lastAction = "Pixel Fun";
                img.update();
                return true;


            }

        },
        CreateMappedEPS(maps) {
            const posMap = (idx) => {
                const px = p32[idx];
                var x = idx % w;
                var y = idx / w | 0;
                const w2 = w * 2;
                const sIdx0 = x * 2 + y * 2 * w2;
                const sIdx1 = sIdx0 + 1;
                const sIdx2 = sIdx0 + w2;
                const sIdx3 = sIdx0 + w2 + 1;
                var xx = 0;
                var yy = 0;
                while (x + xx < w && p32[idx + xx] === px) { xx++ }
                var tIdx = idx + xx + w;
                const tpos = [0, w, w * 2, w * 3, 1, w + 1, w * 2 + 1, w * 3 + 1];
                const transforms = [];
                for (const v of [0,1,2,3,4,5,6,7]) {
                    p32[tIdx + tpos[v]] !== 0 && (p32[tIdx + tpos[v]] = 0, transforms.push(v));
                }
                while (y + yy < h && p32[idx + yy * w] === px) { yy++ }
                const map = {
                    idx,
                    x,
                    y,
                    cx: 0,
                    cy: 0,
                    w: xx,
                    h: yy,
                    transforms,
                    same: [],
                    not: [],
                    //ignore: [],
                    set: [],
                };
                var getSet;
                yy = 0;
                while (yy < map.h) { 
                    xx = 0;                                 
                    while (xx < map.w){
                        const pIdx = idx + xx + yy * w;
                        p32[pIdx] = 0;
                        const p = f32[pIdx];
                        getSet = false;
                        if (p === 0) {
                            map.not.push(xx, yy);
                            getSet = true;
                        } else if (p === 0xFF0000FF) {
                            map.same.push(xx, yy);
                        } else if (p === 0xFF000000) {
                            getSet = true;
                            map.same.push(xx, yy);
                        } else if (p === 0xFF00FFFF) {
                            map.same.push(xx, yy);
                            map.cx = xx;
                            map.cy = yy;
                            getSet = true;
                        }
                        //else if (p === 0xFFFFFF00 || p === 0xFFFF0000) {
                        //    map.ignore.push(xx, yy);
                        //}
                        if (getSet) {
                            const x2 = xx * 2;
                            const y2 = yy * 2;
                            const off = x2 + y2 * w2;
                            if (t32[sIdx0 + off] !== 0) { map.set.push(x2,     y2)      }
                            if (t32[sIdx1 + off] !== 0) { map.set.push(x2 + 1, y2)      }
                            if (t32[sIdx2 + off] !== 0) { map.set.push(x2,     y2 + 1)  }
                            if (t32[sIdx3 + off] !== 0) { map.set.push(x2 + 1, y2 + 1)  }
                        }
                        xx++;
                    }
                    yy++;
                }
                map.same = map.same.map((v, i) => i % 2 ? v - map.cy : v - map.cx);
                map.not = map.not.map((v, i) => i % 2 ? v - map.cy : v - map.cx);
                //map.ignore = map.ignore.map((v, i) => i % 2 ? v - map.cy : v - map.cx);
                const cx = map.cx * 2;
                const cy = map.cy * 2;
                map.set = map.set.map((v, i) => i % 2 ? v - cy : v - cx);
                return map;
            }
            const p32 = maps.pos32;
            const f32 = maps.from32;
            const t32 = maps.to32; 
            maps.maps = [];
            const w = maps.w;
            const h = maps.h;
            const size = w * h;
            var idx = 0;
            while (idx < size) {
                if (p32[idx] !== 0) {
                    const map = posMap(idx);
                    if (map.set.length && map.transforms.length) {
                        maps.maps.push(map);
                    }
                    idx += map.w;
                } else {
                    idx ++;
                }
            }
            maps.pos32  = undefined;
            maps.from32 = undefined;
            maps.to32   = undefined; 
        },
        EPSMapped(img, foldEl) {
            if(img.isDrawable){
                if (API.EPSMapped.maps === undefined) {
                    const selIdx = selection.eachOfType(
                        (spr) => { if (spr.image === img) { return true; }},
                        "image"
                    );
                    const imgPos = selection[selIdx];
                    if (!imgPos.linkers) { log.warn("No from linkers found"); return }
                    const imgFrom = [...imgPos.linkers][0];
                    if (!imgFrom.linkers) { log.warn("No to linkers found"); return }
                    const imgTo =  [...imgFrom.linkers][0];
                    
                    if (!imgPos.type.image || !imgFrom.type.image || !imgTo.type.image) { log.warn("Not all linkers are images"); return }
                    
                    
                    const maps = API.EPSMapped.maps = {
                        //ready: false,
                        imgPos: imgPos.image,
                        imgFrom: imgFrom.image,
                        imgTo: imgTo.image,
                    };       
                    foldEl.textContent = "Double_EPS_mapped";    
                    selection.clear();
                    return;
                    
                }

                const maps = API.EPSMapped.maps;
                maps.w = maps.imgPos.w;
                maps.h = maps.imgPos.h;
                const dat1 =  maps.imgPos.ctx.getImageData(0, 0, maps.imgPos.w, maps.imgPos.h);
                const dat2 = maps.imgFrom.ctx.getImageData(0, 0, maps.imgFrom.w, maps.imgFrom.h);
                const dat3 =   maps.imgTo.ctx.getImageData(0, 0, maps.imgTo.w, maps.imgTo.h);
                maps.pos32 =  new Uint32Array(dat1.data.buffer);
                maps.from32 = new Uint32Array(dat2.data.buffer);
                maps.to32 =   new Uint32Array(dat3.data.buffer);
                API.CreateMappedEPS(maps);
                maps.ready = true;    
                
                const transforms = [
                    (x, y) => [ x,  y],
                    (x, y) => [-y,  x],
                    (x, y) => [-x, -y],
                    (x, y) => [ y, -x],
                    (x, y) => [ x, -y],
                    (x, y) => [ y,  x],
                    (x, y) => [-x,  y],
                    (x, y) => [-y, -x]
                ];
                const transformsSet = [
                    (x, y) => [    x,     y],
                    (x, y) => [1 - y,     x],
                    (x, y) => [1 - x, 1 - y],
                    (x, y) => [    y, 1 - x],
                    (x, y) => [    x, 1 - y],
                    (x, y) => [    y,     x],
                    (x, y) => [1 - x,     y],
                    (x, y) => [1 - y, 1 - x]
                ];                
                const checkMap = (idx, map, transformer) => {
                    const px = d32[idx];
                    //if (px === 0) { return false;  }
                    var x = idx % w;
                    var y = idx / w | 0;
                    var i = 0;
                    var count = 0;
                    while (i < map.same.length) {
                        const [xx, yy] = transformer(map.same[i++], map.same[i++])
                        const rx = x + xx;
                        const ry = y + yy;
                        if (rx >= 0 && rx < w && ry > 0 && ry < h) {
                            if (px === d32[idx + xx + yy * w]) {
                                count ++;
                            } else { break; }
                        } else { break; }                        
                    }
                    if (i < map.same.length || count < map.same.length / 2) { return false; }
                    i = 0;
                    count = 0;
                    while (i < map.not.length) {
                        const [xx, yy] = transformer(map.not[i++], map.not[i++])
                        const rx = x + xx;
                        const ry = y + yy;
                        if (rx >= 0 && rx < w && ry > 0 && ry < h) {
                            if (px !== d32[idx + xx + yy * w]) {
                                count ++;
                            } else { break; }
                        } else { 
                            count ++; 
                        }                        
                    }
                    if (i < map.not.length || count < map.not.length / 2) { return false; }       
                    return true;       
                }
                const setMap = (idx, map, transformer) => {
                    var x = (idx % w) * 2;
                    var y = (idx / w | 0) * 2;
                    const px = d32[idx];
                    var i = 0;
                    while (i < map.set.length) {
                        const [xx, yy] = transformer(map.set[i++], map.set[i++])
                        const rx = x + xx;
                        const ry = y + yy;
                        if (rx >= 0 && rx < w2 && ry > 0 && ry < h2) {
                            dest32[rx + ry * w2] = px;
                        }                      
                    }
                }               
                var w = img.w;
                var h = img.h;
                const size = w * h;
                var w4 = w*4;
                var w2 = w*2;
                var w3 = w*3;
                var h2 = h*2;
                var data = img.ctx.getImageData(0,0,w,h);
                var d8 = data.data;
                var d32 = new Uint32Array(d8.buffer);
                const m = img.desc.mirror;


                m.width = w2;
                m.height = h2;
                m.ctx.imageSmoothingEnabled = false;
                m.ctx.drawImage(img, 0, 0, w2, h2);
                var data2 = m.ctx.getImageData(0, 0, w2, h2);
                var dest32 = new Uint32Array(data2.data.buffer);   
                var idx = 0;
                while (idx < size) {
                    nextMap: for (const map of maps.maps) {
                        for (const tv of map.transforms) {
                            if (checkMap(idx, map, transforms[tv])) {
                                setMap(idx, map, transformsSet[tv]);
                                break nextMap;
                            }
                        }
                    }
                    idx ++;
                }


                
                
                m.ctx.putImageData(data2, 0, 0);
                img.w = img.width = w2;
                img.h = img.height = h2;
                img.desc.dirty = true;
                img.lastAction = "EPX mapped";
                img.desc.clippedTop = - w / 2;
                img.desc.clippedLeft = - h / 2;
                img.restore();
                return true;       
            }                
        },
        doubleBitmapSoft(img, fixCorners = false, tollerance = 0){
            var a1,a2,a3,a4,ch,cc;
            ch = [];
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                var w4 = w*4;
                var w2 = w*2;
                var w3 = w*3;
                var h2 = h*2;
                var data = img.ctx.getImageData(0,0,w,h);
                var d8 = data.data;
                var d32 = new Uint32Array(d8.buffer);
                const m = img.desc.mirror;

                if (tollerance > 0) {
                    var data2 = API.doublePixelsQuality(img);
                } else {
                    m.width = w2;
                    m.height = h2;
                    m.ctx.imageSmoothingEnabled = false;
                    m.ctx.drawImage(img, 0, 0, w2, h2);
                    var data2 = m.ctx.getImageData(0, 0, w2, h2);
                }
                var dest32 = new Uint32Array(data2.data.buffer);
                const createOffsets = (rotMir, coords) => {
                    const data = [];
                    var i = 0, x, y;
                    while (i < coords.length) {
                        x = coords[i++];
                        y = coords[i++];
                        if (rotMir > 3) {
                            if (rotMir === 4) { data.push(y + x * w2) }
                            else if (rotMir === 5) { data.push(-y + x * w2) }
                            else if (rotMir === 6) { data.push(y - x * w2) }
                            else { data.push(-y - x * w2) }

                        } else if (rotMir === 0) { data.push(x + y * w2) }
                        else if (rotMir === 1) { data.push(-x + y * w2) }
                        else if (rotMir === 2) { data.push(x - y * w2) }
                        else { data.push(-x - y * w2) }

                    }
                    return data;
                }
                const cor22 = (rotMir) => ({
                    on:    createOffsets(rotMir,    [0,0,  0,1,   1,1, -1,-1, -2,-1, -2,-2]),
                    off:   createOffsets(rotMir,    [-1,0, -2,0,  -1,1,  0,2,   1,2,  -3,-1, -3,-2]),
                    toOff: createOffsets(rotMir,    [0,1, -2,-1]),
                    toOn: [],
                });
                const cor23 = (rotMir) => ({
                    on:    createOffsets(rotMir,    [0,0,  0,1,   0,2,   1,2,  -1,-1, -2,-1, -2,-2, -2,-3]),
                    off:   createOffsets(rotMir,    [-1,0, -2,0,  -3,-1,  -3,-2,   -3,-3,  -1,1, -1,2, 0,3, 1,3]),
                    toOff: createOffsets(rotMir,    [-2,-1]),
                    toOn: createOffsets(rotMir,    [-1,0]),
                });
                const cor23A = (rotMir) => ({
                    on:    createOffsets(rotMir,    [0,0,  0,1,   0,2,   0,3,  1,-1,  2,-1,  2,-2,  2,-3]),
                    off:   createOffsets(rotMir,    [1,0,  2,0,   1,1,   1,2,  1,3,   0,4,   3,-1,  3,-2, 3,-3]),
                    toOff: [],
                    toOn: createOffsets(rotMir,    [1,0, 1,1]),
                });
                const cor23B = (rotMir) => ({
                    on:    createOffsets(rotMir,    [0,0,  0,1,   -1,-1,   -2,-1,  -2,-2, ]),
                    off:   createOffsets(rotMir,    [-1,0,  -1,1,   -1,2,   -2,0,  -3,-1,   -3,-2]),
                    toOff: [],
                    toOn: createOffsets(rotMir,    [-1,0]),
                });
                const point = (rotMir) => ({
                    on:    createOffsets(rotMir,    [0,0,  1,0, 2,0,   -1,-1,   0,-1,  1,-1, 1,-2,  0,1]),
                    off:   createOffsets(rotMir,    [1,-3, -1,-2, 0,-2, 2,-2, -2,-1, 2,-1, -1,0, 3,0, -1,1, 1,1, 2,1, 0,2]),
                    toOff: [],
                    toOn: createOffsets(rotMir,    [-1,0, 0,-2, 2,-1, 1,1]),
                });

                const fromStr = (str, c, r) => {
                    const shape = {on: [0,0], off: [],  toOff: [], toOn: []};
                    const xero = str.indexOf("*");
                    const xx = xero % c;
                    const yy = xero / c | 0
                    var i = 0, x = 0, y = 0;
                    while (i < str.length) {
                        const C = str[i];
                        if (C !== " ") {
                            const x1 = x - xx, y1 = y - yy;

                            if (C === "#" || C === "-") { shape.on.push(x1,y1) }
                            else if (C === "." || C === "+") { shape.off.push(x1,y1) }
                            if (C === "+") { shape.toOn.push(x1,y1) }
                            else if (C === "-") { shape.toOff.push(x1,y1) }
                        }
                        x = (x + 1) % c;
                        y = x === 0 ? y + 1 : y;
                        i++;
                    }
                    return shape;
                }

                const join = (rotMir) => ({
                    on:    createOffsets(rotMir,   join.shape.on),
                    off:   createOffsets(rotMir,   join.shape.off),
                    toOff: createOffsets(rotMir,   join.shape.toOff),
                    toOn:  createOffsets(rotMir,   join.shape.toOn),
                })
                join.shape = fromStr("    ##" +"  #*+." +"##+++." +"  ####", 6, 4);
                const joinA = (rotMir) => ({
                    on:    createOffsets(rotMir,   joinA.shape.on),
                    off:   createOffsets(rotMir,   joinA.shape.off),
                    toOff: createOffsets(rotMir,   joinA.shape.toOff),
                    toOn:  createOffsets(rotMir,   joinA.shape.toOn),
                })
                joinA.shape = fromStr(" #### " +"#++++#" +"#+*#+#" +" #### ", 6, 4);
                const joinB = (rotMir) => ({
                    on:    createOffsets(rotMir,   joinB.shape.on),
                    off:   createOffsets(rotMir,   joinB.shape.off),
                    toOff: createOffsets(rotMir,   joinB.shape.toOff),
                    toOn:  createOffsets(rotMir,   joinB.shape.toOn),
                })
                joinB.shape = fromStr(".#+#" +"#*++" +"++##" +"#+#.", 4, 4);

                const cornerSets = (corner, sets = [0,1,2,3]) => {
                    const set = [];
                    for (const i of sets) { set.push(corner(i)) }
                    return set;
                }


                function checkCorner(x, y, rule, inData, outData) {
                    var idx = x + y * w2;
                    var i = 0;
                    const onD = rule.on;
                    const offD = rule.off;
                    const on = inData[idx + onD[i]];
                    const off = inData[idx + offD[i]];
                    const len = onD.length > offD.length ? onD.length : offD.length;
                    while (i < len) {
                        if (i < onD.length && inData[idx + onD[i]] !== on) { return }
                        if (i < offD.length && inData[idx + offD[i]] === on) { return }
                        i++;
                    }
                    i = 0;
                    while (i < rule.toOff.length || i < rule.toOn.length) {
                        i < rule.toOff.length && (outData[idx + rule.toOff[i]] = off);
                        i < rule.toOn.length && (outData[idx + rule.toOn[i]] = on);
                        i++
                    }
                }
                function dist(idx1, idx2) {
                    const r = d8[idx1] * d8[idx1++] - d8[idx2] * d8[idx2++];
                    const g = d8[idx1] * d8[idx1++] - d8[idx2] * d8[idx2++];
                    const b = d8[idx1] * d8[idx1++] - d8[idx2] * d8[idx2++];
                    const a = d8[idx1] - d8[idx2];
                    return (r * r + g * g + b * b + a * a) ** 0.5  < tollerance;
                }



                var x,y,a,b,c,d,i,a1,b1,c1,d1;
                var ai,    ab,   ac,   ad, aa1, ab1, ac1, ad1;
                var bi,    bc,   bd,  ba1, bb1, bc1, bd1;
                var ci ,   cd,  ca1, cb1, cc1, cd1;
                var di,   da1,  db1,  dc1, dd1;
                var a1b1;
                var b1c1;
                var c1d1;



                tollerance *= tollerance;
                for(y = 1; y < h-1; y += 1){
                    for(x = 1; x < w-1; x +=1){
                        const idx = x + y * w;
                        i = d32[idx];
                        a = d32[idx - w];
                        b = d32[idx + 1];
                        c = d32[idx + w];
                        d = d32[idx - 1];
                        a1 = d32[idx - w + 1];
                        b1 = d32[idx + 1 + w];
                        c1 = d32[idx + w - 1];
                        d1 = d32[idx - 1 - w];
                        if (tollerance > 0) {
                            const idx8 = idx * 4;
                            const ia = idx8 - w4, ib = idx8 + 4, ic = idx8 + w4, id = idx8 - 4;
                            const ia1 = idx8 - w4 + 4, ib1 = idx8 + 4 + w4, ic1 = idx8 + w4 - 4, id1 = idx8 - 4 - w4;
                            ai   = dist(idx8, ia);
                            ab   = dist(ia, ib);
                            ac   = dist(ia, ic);
                            ad   = dist(ia, id);
                            aa1  = dist(ia, ia1);
                            ab1  = dist(ia, ib1);
                            ac1  = dist(ia, ic1);
                            ad1  = dist(ia, id1);
                            bi   = dist(ib, idx8);
                            bc   = dist(ib, ic);
                            bd   = dist(ib, id);
                            ba1  = dist(ib, ia1);
                            bb1  = dist(ib, ib1);
                            bc1  = dist(ib, ic1);
                            bd1  = dist(ib, id1);
                            ci   = dist(ic, idx8);
                            cd   = dist(ic, id);
                            ca1  = dist(ic, ia1);
                            cb1  = dist(ic, ib1);
                            cc1  = dist(ic, ic1);
                            cd1  = dist(ic, id1);
                            di   = dist(id, idx8);
                            da1  = dist(id, ia1);
                            db1  = dist(id, ib1);
                            dc1  = dist(id, ic1);
                            dd1  = dist(id, id1);
                            a1b1 = dist(ia1, ib1);
                            b1c1 = dist(ib1, ic1);
                            c1d1 = dist(ic1, id1);

                        } else {
                            ai  = a === i;
                            ab  = a === b;
                            ac  = a === c;
                            ad  = a === d;
                            aa1 = a === a1;
                            ab1 = a === b1;
                            ac1 = a === c1;
                            ad1 = a === d1;
                            bi  = b === i;
                            bc  = b === c;
                            bd  = b === d;
                            ba1 = b === a1;
                            bb1 = b === b1;
                            bc1 = b === c1;
                            bd1 = b === d1;
                            ci  = c === i;
                            cd  = c === d;
                            ca1 = c === a1;
                            cb1 = c === b1;
                            cc1 = c === c1;
                            cd1 = c === d1;
                            di  = d === i;
                            da1 = d === a1;
                            db1 = d === b1;
                            dc1 = d === c1;
                            dd1 = d === d1;
                            a1b1 = a1 === b1;
                            b1c1 = b1 === c1;
                            c1d1 = c1 === d1;

                        }


						if (!ai && ab && bc && cd && aa1 && a1b1 && b1c1 && c1d1) {
                            const idx2 = x*2 + y * 2 * w2;
                            dest32[idx2 + w2 * 2] = dest32[idx2 + 2 + w2] = dest32[idx2 + 1 - w2] = dest32[idx2 - 1] = i;


                        } else if (!bi  && bc && cd && !ab && !ba1 && !bd1 && !bc1 && !bd1) {
							const idx2 = x*2 + y * 2 * w2;
							dest32[idx2 + 1 + w2] = b;
						} else if (!ci && cd && ac && !bc && !ca1 && !cd1 && !cc1 && !cd1) {
							const idx2 = x*2 + y * 2 * w2;
							dest32[idx2 + w2] = c;
						} else if (!di && ad && bd && !cd && !db1 && !dc1 && !dd1 && !da1) {
							const idx2 = x*2 + y * 2 * w2;
							dest32[idx2] = d;
						} else if (!ai && ab && ac && !ad && !aa1 && !ab1 && !ac1 && !ad1) {
							const idx2 = x*2 + y * 2 * w2;
							dest32[idx2 + 1] = a;
                        } else if ((ab && bc) || (bc && cd) || (cd && ad) || (ad && ab)) {
                        } else {
                            const idx2 = (x*2 + y * 2 * w2);
                            if (ab && bb1) { dest32[idx2 + w2 + 1] = dest32[idx2 + 1] = a }
                            if (bc && ba1) { dest32[idx2 + w2 + 1] = dest32[idx2 + 1] = b }
                            if (bc && cc1) { dest32[idx2 + w2 + 1] = dest32[idx2 + w2] = b }
                            if (cd && cb1) { dest32[idx2 + w2 + 1] = dest32[idx2 + w2] = c }
                            if (cd && dd1) { dest32[idx2] = dest32[idx2 + w2] = c }
                            if (ad && dc1) { dest32[idx2] = dest32[idx2 + w2] = d }
                            if (ad && aa1) { dest32[idx2] = dest32[idx2 + 1] = d }
                            if (ab && ad1) { dest32[idx2] = dest32[idx2 + 1] = a }
                            if (ab) { dest32[idx2 + 1] = a }
                            if (bc) { dest32[idx2 + w2 + 1] = b }
                            if (cd) { dest32[idx2 + w2] = c }
                            if (ad) { dest32[idx2] = d }
                        }
                    }
                }
                if (fixCorners) {
                    const corners = [
                        ...cornerSets(point, [0]),
                        ...cornerSets(cor22),
                        ...cornerSets(cor23),
                        ...cornerSets(cor23A),
                        ...cornerSets(cor23B, [0,1,2,3,4,5,6,7]),
                        ...cornerSets(join, [0,1,2,3,4,5,6,7]),
                        ...cornerSets(joinA, [4,5,6,7]),
                        ...cornerSets(joinB, [0,1]),
                    ];
                    m.ctx.putImageData(data2, 0, 0);
                    var data3 = m.ctx.getImageData(0, 0, w2, h2);
                    var src32 = new Uint32Array(data2.data.buffer);
                    for (y = 1; y < h2-1; y += 1) {
                        for (x = 1; x < w2-1; x +=1) {
                            for (const corn of corners) {
                                checkCorner(x, y, corn, src32, dest32);
                            }
                        }
                    }

                }
                m.ctx.putImageData(data2, 0, 0);
                img.w = img.width = w2;
                img.h = img.height = h2;
                img.desc.dirty = true;
                img.lastAction = "EPX soft" + (fixCorners ? " fixed" : "") + " Tol: " + (tollerance ** 0.5).toFixed(0);
                img.desc.clippedTop = - w / 2;
                img.desc.clippedLeft = - h / 2;
                img.restore();
                return true;
            }
        },
        doubleBitmapEPX(img){
            var a1,a2,a3,a4,ch,cc;
            ch = [];
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                var data = img.ctx.getImageData(0,0,w,h);
                var d = data.data;
                var d32 = new Uint32Array(d.buffer);
                const m = img.desc.mirror;
                m.width = w * 2;
                m.height = h * 2;
                m.ctx.imageSmoothingEnabled = false;
                m.ctx.drawImage(img, 0, 0, w * 2, h * 2);
                var data2 = m.ctx.getImageData(0,0,m.width,m.height);
                var dest32 = new Uint32Array(data2.data.buffer);

                var x,y,a,b,c,d,p1,p2,p3,p4;
                var w2 = w*2;
                for(y = 1; y < h-1; y += 1){
                    for(x = 1; x < w-1; x +=1){
                        const idx = x + y * w;

                        a = d32[idx - w];
                        b = d32[idx + 1];
                        c = d32[idx + w];
                        d = d32[idx - 1];
                        if ((a === b && b === c) || (b === c && c === d) || (c === d && d === a) || (d === a && a === b)) {
                        } else {
                            p1 = p2 = p3 = p4 = d32[idx];
                            const idx2 = (x*2 + y * 2 * w2);
                            if (a === b) { dest32[idx2 + 1] = a }
                            if (b === c) { dest32[idx2 + w2 + 1] = b }
                            if (c === d) { dest32[idx2 + w2] = c }
                            if (d === a) { dest32[idx2] = d }
                        }
                    }
                }
                m.ctx.putImageData(data2,0,0);
                img.w = img.width = w * 2;
                img.h = img.height = h * 2;
                img.desc.dirty = true;
                img.lastAction = "Doubled EPX";
                img.desc.clippedTop = - w / 2;
                img.desc.clippedLeft = - h / 2;
                img.restore();
                return true;
            }
        },
        doublePixelsQuality(img){
            var a1,a2,a3,a4,ch,cc;
            ch = [];

            var w = img.w;
            var h = img.h;
            var data = img.ctx.getImageData(0,0,w,h);
            var d8 = data.data;
            var d32 = new Uint32Array(d8.buffer);
            const m = img.desc.mirror;
            var w2 = w*2, idx, idx1, idx32;
            const w4 = w * 4, w44 =  w4 + 4;
            const w24 = w2 * 4, w244 =  w24 + 4;
            const pow = 2.2, root = 1/pow;
            m.width = w * 2;
            m.height = h * 2;
            //m.ctx.imageSmoothingEnabled = false;
            //m.ctx.drawImage(img, 0, 0, w * 2, h * 2);
            var data2 = m.ctx.getImageData(0,0,m.width,m.height);
            var dest8 = data2.data;
            var dest32 = new Uint32Array(data2.data.buffer);

            var x,y,a,b,c,d,p1,p2,p3,p4;
            var ar,br,cr,dr;
            var ag,bg,cg,dg;
            var ab,bb,cb,db;
            var aa,ba,ca,da;

            for(y = 0; y < h-1; y += 1){
                for(x = 0; x < w-1; x +=1){
                    idx32 = x + y * w;
                    idx1 = idx = idx32 * 4;
                    a = d32[idx32];

                    ar = d8[idx] ** pow;
                    br = d8[idx + 4] ** pow;
                    cr = d8[idx + w4] ** pow;
                    dr = d8[idx + w44] ** pow;
                    idx ++;
                    ag = d8[idx] ** pow;
                    bg = d8[idx + 4] ** pow;
                    cg = d8[idx + w4] ** pow;
                    dg = d8[idx + w44] ** pow;
                    idx ++;

                    ab = d8[idx] ** pow;
                    bb = d8[idx + 4] ** pow;
                    cb = d8[idx + w4] ** pow;
                    db = d8[idx + w44] ** pow;
                    idx ++;

                    aa = d8[idx];
                    ba = d8[idx + 4];
                    ca = d8[idx + w4];
                    da = d8[idx + w44];
                    const idx2 = (x * 2 + y * 2 * w2);
                    if (aa === 0 && ba === 0 && ca === 0 && da === 0) {
                        dest32[idx2 + w2 + 1] = dest32[idx2 + w2] = dest32[idx2 + 1] = dest32[idx2] = 0;
                    } else {
                        if (aa === 0) {
                            if (ba !== 0) {
                                ar = dr;
                                ag = dg;
                                ab = db;
                            } else if (ca !== 0) {
                                ar = cr;
                                ag = cg;
                                ab = cb;
                            } else {
                                ar = dr;
                                ag = dg;
                                ab = db;
                            }
                        }
                        if (ba === 0) {
                            if (aa !== 0) {
                                br = ar;
                                bg = ag;
                                bb = ab;
                            } else if (ca !== 0) {
                                br = cr;
                                bg = cg;
                                bb = cb;
                            } else {
                                br = dr;
                                bg = dg;
                                bb = db;
                            }
                        }
                        if (ca === 0) {
                            if (aa !== 0) {
                                cr = ar;
                                cg = ag;
                                cb = ab;
                            } else if (ba !== 0) {
                                cr = br;
                                cg = bg;
                                cb = bb;
                            } else {
                                cr = dr;
                                cg = dg;
                                cb = db;
                            }
                        }
                        if (da === 0) {
                            if (aa !== 0) {
                                dr = ar;
                                dg = ag;
                                db = ab;
                            } else if (ba !== 0) {
                                dr = br;
                                dg = bg;
                                db = bb;
                            } else {
                                dr = cr;
                                dg = cg;
                                db = cb;
                            }
                        }


                        const idx24 = idx2 * 4;
                        dest32[idx2] = a;

                        dest8[idx24 + w24    ] = ((ar + cr) / 2) ** root;
                        dest8[idx24 + w24 + 1] = ((ag + cg) / 2) ** root;
                        dest8[idx24 + w24 + 2] = ((ab + cb) / 2) ** root;
                        dest8[idx24 + w24 + 3] = (aa + ca) / 2;

                        dest8[idx24 + 4] = ((ar + br) / 2) ** root;
                        dest8[idx24 + 5] = ((ag + bg) / 2) ** root;
                        dest8[idx24 + 6] = ((ab + bb) / 2) ** root;
                        dest8[idx24 + 7] = (aa + ba) / 2;

                        dest8[idx24 + w244    ] = ((ar + br + cr + dr) / 4) ** root;
                        dest8[idx24 + w244 + 1] = ((ag + bg + cg + dg) / 4) ** root;
                        dest8[idx24 + w244 + 2] = ((ab + bb + cb + db) / 4) ** root;
                        dest8[idx24 + w244 + 3] = (aa + ba + ca + da) / 4;
                    }
                }
            }
            //m.ctx.putImageData(data2,0,0);
            return data2;
        },
        doubleBitmapQuality(img){
            var a1,a2,a3,a4,ch,cc;
            ch = [];
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                var data = img.ctx.getImageData(0,0,w,h);
                var d8 = data.data;
                var d32 = new Uint32Array(d8.buffer);
                const m = img.desc.mirror;
                var w2 = w*2, idx, idx1, idx32;
                const w4 = w * 4, w44 =  w4 + 4;
                const w24 = w2 * 4, w244 =  w24 + 4;
                const pow = 2.2, root = 1/pow;
                m.width = w * 2;
                m.height = h * 2;
                m.ctx.imageSmoothingEnabled = false;
                m.ctx.drawImage(img, 0, 0, w * 2, h * 2);
                var data2 = m.ctx.getImageData(0,0,m.width,m.height);
                var dest8 = data2.data;
                var dest32 = new Uint32Array(data2.data.buffer);

                var x,y,a,b,c,d,p1,p2,p3,p4;
                var ar,br,cr,dr;
                var ag,bg,cg,dg;
                var ab,bb,cb,db;
                var aa,ba,ca,da;

                for(y = 0; y < h-1; y += 1){
                    for(x = 0; x < w-1; x +=1){
                        idx32 = x + y * w;
                        idx1 = idx = idx32 * 4;
                        a = d32[idx32];

                        ar = d8[idx] ** pow;
                        br = d8[idx + 4] ** pow;
                        cr = d8[idx + w4] ** pow;
                        dr = d8[idx + w44] ** pow;
                        idx ++;
                        ag = d8[idx] ** pow;
                        bg = d8[idx + 4] ** pow;
                        cg = d8[idx + w4] ** pow;
                        dg = d8[idx + w44] ** pow;
                        idx ++;

                        ab = d8[idx] ** pow;
                        bb = d8[idx + 4] ** pow;
                        cb = d8[idx + w4] ** pow;
                        db = d8[idx + w44] ** pow;
                        idx ++;

                        aa = d8[idx];
                        ba = d8[idx + 4];
                        ca = d8[idx + w4];
                        da = d8[idx + w44];
                        const idx2 = (x * 2 + y * 2 * w2);
                        if (aa === 0 && ba === 0 && ca === 0 && da === 0) {
                            dest32[idx2 + w2 + 1] = dest32[idx2 + w2] = dest32[idx2 + 1] = dest32[idx2] = 0;
                        } else {
                            if (aa === 0) {
                                if (ba !== 0) {
                                    ar = dr;
                                    ag = dg;
                                    ab = db;
                                } else if (ca !== 0) {
                                    ar = cr;
                                    ag = cg;
                                    ab = cb;
                                } else {
                                    ar = dr;
                                    ag = dg;
                                    ab = db;
                                }
                            }
                            if (ba === 0) {
                                if (aa !== 0) {
                                    br = ar;
                                    bg = ag;
                                    bb = ab;
                                } else if (ca !== 0) {
                                    br = cr;
                                    bg = cg;
                                    bb = cb;
                                } else {
                                    br = dr;
                                    bg = dg;
                                    bb = db;
                                }
                            }
                            if (ca === 0) {
                                if (aa !== 0) {
                                    cr = ar;
                                    cg = ag;
                                    cb = ab;
                                } else if (ba !== 0) {
                                    cr = br;
                                    cg = bg;
                                    cb = bb;
                                } else {
                                    cr = dr;
                                    cg = dg;
                                    cb = db;
                                }
                            }
                            if (da === 0) {
                                if (aa !== 0) {
                                    dr = ar;
                                    dg = ag;
                                    db = ab;
                                } else if (ba !== 0) {
                                    dr = br;
                                    dg = bg;
                                    db = bb;
                                } else {
                                    dr = cr;
                                    dg = cg;
                                    db = cb;
                                }
                            }


                            const idx24 = idx2 * 4;
                            dest32[idx2] = a;

                            dest8[idx24 + w24    ] = ((ar + cr) / 2) ** root;
                            dest8[idx24 + w24 + 1] = ((ag + cg) / 2) ** root;
                            dest8[idx24 + w24 + 2] = ((ab + cb) / 2) ** root;
                            dest8[idx24 + w24 + 3] = (aa + ca) / 2;

                            dest8[idx24 + 4] = ((ar + br) / 2) ** root;
                            dest8[idx24 + 5] = ((ag + bg) / 2) ** root;
                            dest8[idx24 + 6] = ((ab + bb) / 2) ** root;
                            dest8[idx24 + 7] = (aa + ba) / 2;

                            dest8[idx24 + w244    ] = ((ar + br + cr + dr) / 4) ** root;
                            dest8[idx24 + w244 + 1] = ((ag + bg + cg + dg) / 4) ** root;
                            dest8[idx24 + w244 + 2] = ((ab + bb + cb + db) / 4) ** root;
                            dest8[idx24 + w244 + 3] = (aa + ba + ca + da) / 4;
                        }
                    }
                }
                m.ctx.putImageData(data2,0,0);
                img.w = img.width = w * 2;
                img.h = img.height = h * 2;
                img.desc.dirty = true;
                img.lastAction = "Doubled Quality";
                img.desc.clippedTop = - w / 2;
                img.desc.clippedLeft = - h / 2;
                img.restore();
                return true;
            }
        },
        pixelCut(img, slices = 1){
            if(img.isDrawable && slices){
                var w = img.w;
                var h = img.h;
                var data = img.ctx.getImageData(0,0,w,h);
                var d = data.data;
                var d32 = new Uint32Array(d.buffer);

                var x,y,a,b, x1, y1, x2, y2, a1,a2,a3,a4,a5,l, idx;
                var count = 0, max, start, maxStart;

                while (slices--) {
                    var w2 = w*2;
                    const areas = [];
                    var maxLine = 0;
                    for(y = 0; y < h; y += 1){
                        count = 0;
                        max = 0;
                        maxStart = 0;
                        start = undefined;
                        b = 0;
                        for (x = 0; x <= w; x +=1) {
                            idx = x + y * w;
                            a = d32[idx];
                            if (x < w && (a & 0xFF000000) && a === b) {
                                 if (count === 0) { start = x - 1 };
                                 count ++;
                            } else {
                                if (count > max) {
                                    max = count;
                                    maxStart = start;
                                }
                                count = 0;
                            }
                            b = a;
                        }
                        areas.push([maxStart, max]);
                        if (max > maxLine) {
                            maxLine = y;
                        }
                    }
                    y1 = y2 = maxLine;
                    a = areas[maxLine];
                    x1 = a[0] + a[1];
                    max = -1;
                    maxStart = a[0] + a[1] / 2 | 0;
                    for (x = a[0]; x < x1; x++) {
                        if (x > 0 && x < w - 1) {
                            y1 = (y2 = maxLine) + 1;
                            idx = x + y2 * w;
                            l = d32[idx];
                            idx += w;
                            count = 0;
                            while (y1 < h) {
                                if (d32[idx] === l && d32[idx-1] === l && d32[idx+1] === l) {
                                    idx += w;
                                    y1 ++;
                                    count ++;
                                } else {
                                    break;
                                }
                            }
                            idx = x + y2 * w;
                            while (y2 > -1) {
                                if (d32[idx] === l && d32[idx-1] === l && d32[idx+1] === l) {
                                    idx -= w;
                                    y2 --;
                                    count ++;
                                } else {
                                    break;
                                }
                            }
                            if (count > max) {
                                max = count;
                                maxStart = x;
                            }
                        }
                    }

                    y1 = y2 = maxLine;
                    x1 = x2 = maxStart;
                    while (y1 < h || y2 > -1) {
                        if (y2 > -1) {
                            idx = x2 + y2 * w;
                            l = d32[idx] & 0xFFFFFF;
                            if (y2 !== y1) {
                                for (x = x2; x < w -1; x ++) {
                                    d32[idx] = d32[idx + 1];
                                    idx ++;
                                }
                            }
                            y2--;
                            if (y2 > -1) {
                                a = areas[y2];
                                if (a[1] === 0 || a[0] > x2 || a[0] + a[1] < x2) {
                                    idx = x2 + y2 * w;
                                    if (d32[idx] !== 0) {
                                        a1 = x2 > 1 ? d32[idx - 2] & 0xFFFFFF : NaN;
                                        a2 = x2 > 0 ? d32[idx - 1] & 0xFFFFFF : NaN;
                                        a3 = d32[idx] & 0xFFFFFF;
                                        a4 = x2 < w - 1 ? d32[idx + 1] & 0xFFFFFF : NaN;
                                        a5 = x2 < w - 2 ? d32[idx + 2] & 0xFFFFFF : NaN;
                                        if (isNaN(a4)) {
                                            if (a3 !== a2 && a2 === a1) { x2 -- }
                                        } else if (isNaN(a2)) {
                                            if (a3 !== a4 && a4 === a5) {x2 ++ }
                                        } else {
                                            if (a3 !== a2 && a3 !== a4) {
                                                if (a1 === a2) { x2 -- }
                                                else if (a4 === a5) { x2 ++ }
                                                else if (a4 === l) { x2 ++ }
                                                else if (a2 === l) { x2 -- }
                                            } else if (a3 !== a2 && a3 === a4 && a4 === a5) { x2 ++ }
                                            else if (a3 !== a4 && a3 === a2 && a2 === a1) { x2 -- }
                                        }
                                    }
                                } else {
                                    x = a[0] + (a[1] / 2 | 0);
                                    if (x < x2) { x2 -- }
                                    else if (x > x2) { x2 ++ }
                                }
                            }
                        }
                        if (y1 < h) {
                            idx = x1 + y1 * w;
                            l = d32[idx] & 0xFFFFFF;
                            for (x = x1; x < w -1; x ++) {
                                d32[idx] = d32[idx + 1];
                                idx ++;
                            }
                            y1++;
                            if (y1 < h) {
                                a = areas[y1];
                                if (a[1] === 0 || a[0] > x1 || a[0] + a[1] < x1) {
                                    idx = x1 + y1 * w;
                                    if (d32[idx] !== 0) {
                                        a1 = x1 > 1 ? d32[idx - 2] & 0xFFFFFF : NaN;
                                        a2 = x1 > 0 ? d32[idx - 1] & 0xFFFFFF : NaN;
                                        a3 = d32[idx] & 0xFFFFFF;
                                        a4 = x1 < w - 1 ? d32[idx + 1] & 0xFFFFFF : NaN;
                                        a5 = x1 < w - 2 ? d32[idx + 2] & 0xFFFFFF : NaN;
                                        if (isNaN(a4)) {
                                            if (a3 !== a2 && a2 === a1) { x1 -- }
                                        } else if (isNaN(a2)) {
                                            if (a3 !== a4 && a4 === a5) {x1 ++ }
                                        } else {
                                            if (a3 !== a2 && a3 !== a4) {
                                                if (a1 === a2) { x1 -- }
                                                else if (a4 === a5) { x1 ++ }
                                                else if (a4 === l) { x1 ++ }
                                                else if (a2 === l) { x1 -- }
                                            } else if (a3 !== a2 && a3 === a4 && a4 === a5) { x1 ++ }
                                            else if (a3 !== a4 && a3 === a2 && a2 === a1) { x1 -- }
                                        }
                                    }
                                } else {
                                    x = a[0] + (a[1] / 2 | 0);
                                    if (x < x1) { x1 -- }
                                    else if (x > x1) { x1 ++ }
                                }
                            }
                        }
                    }
                    w -= 1;
                }

                img.desc.mirror.width = w ;
                img.desc.mirror.height = h;
                img.w = img.width = w;
                img.h = img.height = h;
                img.ctx.putImageData(data,0,0);
                img.desc.mirror.ctx.drawImage(img,0,0);

                img.desc.dirty = true;
                img.lastAction = "Pixel cut";
                img.desc.clippedTop = - 0;
                img.desc.clippedLeft = - 0;
                img.restore();
                return true;
            }
        },
        carve(img, W, H) {
            if(img.isDrawable) {
                function normalizeEnergy(e, p = 2) {
                    var min = e[0];
                    var max = e[1];
                    for (const v of e) {
                        min = Math.min(min,v);
                        max = Math.max(max,v);
                    }
                    const r = max - min;
                    var i = 0;

                    while (i < e.length) {
                        e[i] = (((e[i] - min) / r) ** p) * 255;
                        i++;
                    }
                    return e;
                }
                function energy2Px(e) {
                    var i = 0, i8 = 0;
                    while (i < e.length) {
                        d8[i8]     = e[i];
                        d8[i8 + 1] = e[i];
                        d8[i8 + 2] = e[i];
                        //d8[i8] = e[i];
                        i ++;
                        i8 += 4;
                    }
                    return e;
                }
                function seam2Px(seam,  col, fat) {
                    var i = 0;
                    while (i < h) {
                        while (i < seam.idxs.length) {
                            const idx = seam.idxs[i++];
                            d32[idx] = col;
                            if(fat) {
                                d32[idx - 1] = col;
                                d32[idx + 1] = col;
                            }
                        }
                        if (seam.prevSeam) {
                            seam = seam.prevSeam;
                        } else {
                            break;  // dev safe
                        }
                    }
                }
                function removeSeams(seams, rows) {
                    var y = 0, yy, idx, idxX, idxY, x = 0, xx, next, seamIdx = 0, i;

                    if (rows) {
                        while (x < w) {
                            idx = x;
                            seamIdx = yy = y = i = 0;
                            next = seams[seamIdx++];
                            while (i < h) {
                                idxY = idx + y;
                                if (next && idxY === next.idxs[x]) { next = seams[seamIdx++] }
                                else {
                                    d32[idx + yy] = d32[idxY];
                                    yy += w;
                                }
                                y += w;
                                i++;
                            }
                            x++;
                        }
                        top -= (seams.length / 2 | 0);
                        bottom -= (seams.length - (seams.length / 2 | 0));

                    } else {
                        while (y < h) {
                            idx = y * w;
                            x = xx = seamIdx = 0
                            next = seams[seamIdx++];
                            while (x < w) {
                                idxX = idx + x;
                                if (next && idxX === next.idxs[y]) { next = seams[seamIdx++] }
                                else {
                                    d32[idx + xx] = d32[idxX];
                                    xx++;
                                }
                                x ++;
                            }
                            y++;
                        }
                        ;
                        right -= seams.length;

                    }
                }
                function getEnergySRGB() {

                    var x, y, r, g, b, idx, scale;
                    const scaler = 255 * 255;
                    const doColumn = (left, right) => {
                        var r, g, b, rr, gg, bb,  sum;
                        while (y < h4) {
                            sum = 0;
                            r = d8[y];
                            g = d8[y + 1];
                            b = d8[y + 2];
                            if (r === 255 && b === 0 && g === 0) {
                                scale = 0;
                                energy[idx] = 0;
                            } else {
                                r *= r;
                                g *= g;
                                b *= b;
                                scale = (Math.max(r,g,b) / scaler) ** 2 ;
                                /*if (y >= w4) {
                                    rr = d8[y - w4    ] ** 2 - r;
                                    gg = d8[y - w4 + 1] ** 2 - g;
                                    bb = d8[y - w4 + 2] ** 2 - b;
                                    sum += rr * rr + gg * gg + bb * bb;
                                }
                                if (y < h4 - w4) {
                                    rr = d8[y + w4    ] ** 2 - r;
                                    gg = d8[y + w4 + 1] ** 2 - g;
                                    bb = d8[y + w4 + 2] ** 2 - b;
                                    sum += rr * rr + gg * gg + bb * bb;
                                }*/
                                if (left) {
                                    rr = d8[y - 4] ** 2 - r;
                                    gg = d8[y - 3] ** 2 - g;
                                    bb = d8[y - 2] ** 2 - b;
                                    sum += rr * rr + gg * gg + bb * bb;
                                }
                                if (right) {
                                    rr = d8[y + 4] ** 2 - r;
                                    gg = d8[y + 5] ** 2 - g;
                                    bb = d8[y + 6] ** 2 - b;
                                    sum += rr * rr + gg * gg + bb * bb;
                                }
                                energy[idx] = sum * scale + 1;
                            }
                            idx += w;
                            y += w4;
                        }
                    }

                    idx = y = x = 0;
                    doColumn(false, true);
                    x ++;
                    while (x < w - 1) {
                        y = x * 4;
                        idx = x;
                        doColumn(true, true);
                        x++;
                    }
                    y = x * 4;
                    idx = x;
                    doColumn(true, false);
                    return energy;
                }
                function columnSeam(e, seams, x) {
                    var leftSeamIdx = seams.length - 1;
                    var leftSeam = leftSeamIdx >= 0 ? seams[leftSeamIdx] : undefined;
                    const findLeftSeam = () => {
                        while (leftSeamIdx >= 0 && seams[leftSeamIdx].idxs.length < seam.length) { leftSeamIdx -- }
                        leftSeam = leftSeamIdx >= 0 ? seams[leftSeamIdx] : undefined;
                    }
                    const seam = [];
                    const energies = [];
                    var idx = x, dir, i = 0, total = 0, min, hasRed = false;

                    const len = e.length;
                    const w2 = w - 2;;
                    while (idx < len) {
                        min = e[idx];
                        dir = 0;
                        if (d32[idx]  !== 0xFF0000FF) {
                            if (x > 1) {
                                if (e[idx - 1] < min || d32[idx - 1]  === 0xFF0000FF) {
                                    dir = -1;
                                    min = e[idx - 1]
                                }
                            } else  if (x === 0) { return }
                            if (x < w2) {
                                if (e[idx + 1] < min || d32[idx + 1]  === 0xFF0000FF) {
                                    dir = 1;
                                    min = e[idx + 1]
                                }
                            } else if (x === w2 + 1) { return }
                        }
                        idx += dir;
                        !hasRed && d32[idx]  === 0xFF0000FF && (hasRed = true);
                        if (leftSeam && leftSeam.idxs.length < i) {
                            leftSeamIdx--;
                            findLeftSeam();
                        }
                        if (leftSeam && leftSeam.idxs[i] === idx) {
                            total = leftSeam.total - leftSeam.energies[i] + total + min;
                            return {idxs: seam, x, energies, prevSeam: leftSeam, total};
                        }
                        total += min;

                        seam.push(idx);
                        energies.push(total);
                        idx +=  w;
                        x += dir;
                        i ++;
                    }
                    if(hasRed) {
                        return {idxs: seam, x, energies, total};
                    }
                }
                function rowSeam(e, seams, y) {
                    var topSeamIdx = seams.length - 1;
                    var topSeam = topSeamIdx >= 0 ? seams[topSeamIdx] : undefined;
                    const findTopSeam = () => {
                        while (topSeamIdx >= 0 && seams[topSeamIdx].idxs.length < seam.length) { topSeamIdx -- }
                        topSeam = topSeamIdx >= 0 ? seams[topSeamIdx] : undefined;
                    }
                    const seam = [];
                    const energies = [];
                    var idx = y * w, dirW, dir, i = 0, total = 0, min;
                    var len = idx + w;
                    const h2 = h - 2;;
                    while (i < w) {
                        min = e[idx];
                        dirW = dir = 0;
                        if (y > 1) {
                            if (e[idx - w] < min) {
                                dirW = -w;
                                dir = -1;
                                min = e[idx - w]
                            }
                        } else if (y === 0) { return }
                        if (y < h2) {
                            if (e[idx + w] < min) {
                                dirW = w;
                                dir = 1;
                                min = e[idx + w]
                            }
                        } else if (y === h2+1) { return }
                        if (topSeam && topSeam.idxs.length < i) {
                            topSeamIdx--;
                            findTopSeam();
                        }
                        if (topSeam && topSeam.idxs[i] === idx) {
                            total = topSeam.total - topSeam.energies[i] + total + min;
                            return {idxs: seam, y, energies, prevSeam: topSeam, total};
                        }
                        total += min;
                        seam.push(idx);
                        energies.push(total);
                        idx += dirW + 1;
                        y += dir;
                        i ++;
                    }
                    const fullSeam =  {idxs: seam, y, energies, total};
                    fullSeam.fullSeam = fullSeam;
                    return fullSeam;
                }
                function reduceSeam(seam) {
                    var i = 0;
                    var full = seam
                    while (full.prevSeam) { full = full.prevSeam }
                    if (seam !== full && seam.total < full.total) {
                        const idxs = [];
                        while (i < full.idxs.length) {
                            if (i < seam.idxs.length) {
                                idxs[i] = seam.idxs[i];
                                i++;
                            } else {
                                seam = seam.prevSeam;
                            }
                        }
                        full.idxs = idxs;
                        full.total = seam.total;
                        full.x = seam.x;
                        full.y = seam.y;
                    }
                }

                function getSeams(e, rows = false) {
                    const seams = [];
                    var x = 0, y = 0, i = 0;
                    if (rows) {
                        while (y < h) {
                            const seam = rowSeam(e, seams, y);
                            if (seam) { seams.push(seam) }
                            y += 1;
                        }
                    } else {
                        while (x < w) {
                            const seam = columnSeam(e, seams, x);
                            if (seam) { seams.push(seam) }
                            x += 1;
                        }
                    }
                    const fullSeams = seams.filter(seam => !seam.prevSeam);
                    if (fullSeams.length) {
                        for (const seam of seams) { reduceSeam(seam) }
                        /*var min = fullSeams[0].total, minSeam = fullSeams[0], max = min;

                        for (const seam of fullSeams) {
                            if (seam.total > max) { max = seam.total }
                            if (seam.total < min) {
                                min = seam.total;
                                minSeam = seam;
                            }
                        }

                        const dif = max - min * 0.1;
                        return fullSeams.filter(seam => seam.total <= min + dif);*/
                    }
                    return fullSeams
                }
                function carveImage(can, rows) {
                    getEnergy(can, rows);
                    const seams = [];
                    var x = 0, y = 0, i = 0;
                    if (rows) {
                        while (y < can.height) {
                            const seam = rowSeam(can, seams, y);
                            if (seam) { seams.push(seam) }
                            y += 1;
                        }
                    } else {
                        while (x < can.width) {
                            const seam = columnSeam(can, seams, x);
                            if (seam) { seams.push(seam) }
                            x += 1;
                        }
                    }
                    const fullSeams = seams.filter(seam => !seam.prevSeam);
                    if (fullSeams.length) {
                        for (const seam of seams) { reduceSeam(seam) }
                        var min = fullSeams[0].total, minSeam = fullSeams[0], max = min;

                        for (const seam of fullSeams) {
                            if (seam.total > max) { max = seam.total }
                            if (seam.total < min) {
                                min = seam.total;
                                minSeam = seam;
                            }
                        }

                        const dif = max - min * 0.05;
                        removeSeams(can, fullSeams.filter(seam => seam.total <= min + dif));
                    } else {
                        log("Too hard")
                    }


                }


                var top = 0, bottom = 0
                var left = 0, right = 0
                const m = img.desc.mirror;
                var w = img.w;
                var h = img.h;
                const WW = w;
                const HH = h;
                var w4 = w * 4;
                var h4 = w4 * h;
                var data = img.ctx.getImageData(0,0,w,h);
                var d8 = data.data;
                var d32 = new Uint32Array(d8.buffer);
                const energy = new Array(d32.length).fill(0);
                function resample() {
                    m.w = m.width = WW + right + left;
                    m.h = m.height = HH + top + bottom;
                    m.ctx.putImageData(data, 0, 0);
                    w = m.w;
                    h = m.h;
                    w4 = w * 4;
                    h4 = w4 * h;
                    data = m.ctx.getImageData(0,0,w,h);
                    d8 = data.data;
                    d32 = new Uint32Array(d8.buffer);
                    energy.length = d32.length;
                    energy.fill(0);
                }

                const cols = [0xFFFF0000,0xFF00FF00,0xFF0000FF,0xFFFFFF00,0xFF00FFFF,0xFFFF00FF];

                    let reducing = true;
                    while (reducing) {
                        normalizeEnergy(getEnergySRGB(), 2);
                        const cSeams = getSeams(energy);
                        if (cSeams.length) {
                            log("Carved: " + cSeams.length + " W: " + w + ", H: " + h)
                            cSeams.forEach((seam, i) => seam2Px(seam, cols[i % cols.length]));
                            removeSeams(cSeams, false);
                            resample();
                        } else {
                            log("No seams");
                            reducing = false;
                            break;
                        }
                    }

   



                img.w = img.width = WW + right + left;
                img.h = img.height = HH + top + bottom;
                img.desc.dirty = true;
                img.lastAction = "Carve reduce";
                img.desc.clippedTop = -top;
                img.desc.clippedLeft = -left;
                img.restore();
                return true;
            }
        },
        pad(img, color = 0, top, right = top, bottom = top, left = top){
            if(img.isDrawable){
                top |= 0;
                right |= 0;
                bottom |= 0;
                left |= 0;
                if(!top && !right && !bottom && !left){ return }
                var w = img.w;
                var h = img.h;
                const m = img.desc.mirror;
                m.width = w + right + left;
                m.height = h + top + bottom;
				if(color !== 0) {
					m.ctx.fillStyle = color;
					m.ctx.fillRect(0, 0, m.ctx.canvas.width, m.ctx.canvas.height);
					m.ctx.clearRect(left, top, w, h);
				}
                m.ctx.drawImage(img,left,top);
                img.w = img.width = w + right + left;
                img.h = img.height = h + top + bottom;
                img.desc.dirty = true;
                img.lastAction = "Padded";
                img.desc.clippedTop = -top;
                img.desc.clippedLeft = -left;
                img.restore();
                return true;
            }
        },
        reorient(img, how) {
            if (img.isDrawable && !img.isLocked) {
                var ctx = img.ctx, source = img.desc.mirror, dest = img;
                const w = img.w, h = img.h;
                let ok = false, restore = false;
                if (how === "rotateCW") {
                    if (w === h) {
                        ctx.setTransform(0,1,-1,0,w,0);
                    } else {
                        source = dest;
                        dest = img.desc.mirror;
                        ctx = dest.ctx;
                        dest.width = h;
                        dest.height = w;
                        ctx.setTransform(0,1,-1,0,h,0);
                        restore = true;
                    }
                    ok = true;
                } else if (how === "rotateCCW") {
                    if (w === h) {
                        ctx.setTransform(0,-1,1,0,0, h);
                    } else {
                        source = dest;
                        dest = img.desc.mirror;
                        ctx = dest.ctx;
                        dest.width = h;
                        dest.height = w;
                        ctx.setTransform(0,-1,1,0,0,w);
                        restore = true;
                    }
                    ok = true;
                } else if (how === "mirrorx") {
                    ctx.setTransform(-1,0,0,1,w,0);
                    ok = true;

                } else if (how === "mirrory") {
                    ctx.setTransform(1,0,0,-1,0,h);
                    ok = true;
                }
                if (ok) {
                    ctx.imageSmoothingEnabled = false;
                    ctx.globalAlpha = 1;
                    ctx.filter = "none";
                    ctx.shadowColor ="rgba(0,0,0,0)";
                    ctx.globalCompositeOperation = "copy";

                    ctx.drawImage(source, 0, 0);
                    if (restore) {
                        source.width = source.w = dest.width;
                        source.height = source.h = dest.height;
                        img.restore();
                    }
                    img.desc.dirty = true;
                    img.processed = true;
                    img.lastAction = how;

                    img.update();
                    return true;

                }
            }
            return false;
        },
        autoClip(img){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                var data = img.ctx.getImageData(0,0,w,h);
                var d = data.data;
                var x,y;
                var ww = w*4;
                var ww4 = ww+4;
                var left = w
                var right = 0;
                var top;
                var bottom;
                for(y = 0; y < h; y+=1){
                    for(x = 0; x < w; x+=1){
                        var ind = y*ww+x*4;
                        var p = d[ind]+d[ind+1]+d[ind+2]+d[ind+3];
                        if(p > 0){
                            if (top === undefined) { top = y }
                            bottom = y;
                            if (x < left) { left = x }
                            if (x > right) { right = x }
                        }
                    }
                }
                right += 1;
                bottom += 1;
                w = Math.floor(right-left);
                h = Math.floor(bottom-top);
                if(w <= 0){
                    log.warn("Can not size image to 0px by 0px");
                    return;
                }
                img.desc.mirror.width = w;
                img.desc.mirror.height = h;
                img.desc.mirror.ctx.drawImage(img,left,top,w,h,0,0,w,h);
                img.w = img.width = w;
                img.h = img.height = h;
                img.desc.dirty = true;
                img.lastAction = "Auto clip";
                img.desc.clippedTop = top;
                img.desc.clippedLeft = left;
                img.restore();
                return true;
            }
            return false;
        },
        pixelArtSubImageAlignment: 4,
        pixelArtSubImageReplace(imgSpr, rotate = true, mirror = true, findImgSpr, ...replaceImgSprs) {
            const img = imgSpr.image;
            const findImg = findImgSpr.image;
            if (img.isDrawable && findImg.isDrawable) {
                var dataA = getSprPixelData8Bit(imgSpr);
                var dataf = getSprPixelData8Bit(findImgSpr);
                img.ctx.globalCompositeOperation = "source-over";
                img.ctx.globalAlpha = 1;
                img.ctx.filter = "none";
                const w = dataA.width, h = dataA.height;
                const wf = dataf.width, hf = dataf.height;
                var replaceIdx = Math.random() * replaceImgSprs.length | 0;
                const d32 = new Uint32Array(dataA.data.buffer);
                const d32B = d32;
                const df32 = new Uint32Array(dataf.data.buffer);
                var found = 0;
                const normal = (x, y, w, h) => x + y * w;
                const mirrorW = (x, y, w, h) => (w - 1 - x) + y * w;
                const mirrorH = (x, y, w, h) => x + (h - 1 - y) * w;
                const mirrorWH = (x, y, w, h) => (w - 1 - x) + (h - 1 - y) * w;
                const rot90 = (x, y, w, h) => y + (h - 1 - x) * w;
                const rot90MirrorW = (x, y, w, h) => y + x * w;
                const rot270 = (x, y, w, h) =>  (w - 1 - y) + x * w;
                const rot90MirrorH = (x, y, w, h) => (w - 1 - y) + (h - 1 - x) * w;

                /*const normal =       (x, y, w, h) => x + y * w;
                const mirrorW =      (x, y, w, h) => (w - x) + y * w;
                const mirrorH =      (x, y, w, h) => x + (h - y) * w;
                const mirrorWH =     (x, y, w, h) => (w - x) + (h - y) * w;
                const rot90 =        (x, y, w, h) => y + (h - x) * w;
                const rot90MirrorW = (x, y, w, h) => y + x * w;
                const rot270 =       (x, y, w, h) => (w - y) + x * w;
                const rot90MirrorH = (x, y, w, h) => (w - y) + (h - x) * w;*/

                normal.m = [1,0,0,1,0,0];
                mirrorW.m = [-1,0,0,1,1,0];
                mirrorH.m = [1,0,0,-1,0,1];
                mirrorWH.m = [-1,0,0,-1,1,1];
                rot90.m = [0,1,-1,0,1,0];
                rot270.m = [0,-1,1,0,0,1];
                rot90MirrorW.m = [0,1,1,0,0,0];
                rot90MirrorH.m = [0,-1,-1,0,1,1];
                rot90.rot = true;
                rot270.rot = true;
                rot90MirrorW.rot = true;
                rot90MirrorH.rot = true;

                const transforms = [
                    normal,
                    ...(()=> mirror && !rotate ? [ mirrorW, mirrorH, mirrorWH] : [])(),
                    ...(()=> rotate && !mirror ? [rot90, mirrorWH, rot270] : [])(),
                    ...(()=> rotate && mirror ? [ mirrorW, mirrorH, mirrorWH,  rot90, rot90MirrorW, rot270, rot90MirrorH] : [])(),
                ];

                const usedAreas = [];
                var usedCount = 0;
                const used = (x, y, w, h) => usedAreas[usedCount++] = {x, y, x1: x + w, y1: y + h};
                const canFit = (x, y, w, h) => {
                    var head = 0, tail = 0
                    const x1 = x + w, y1 = y + h;
                    var OK = true;
                    while (head < usedCount) {
                        const area = usedAreas[head];
                        if (tail < head) { usedAreas[tail] = area }
                        if (x >= area.x1 || x1  <= area.x || y >= area.y1 || y1 <= area.y) {
                            if (y <= area.y1) { tail += 1 }
                            head += 1;
                        } else {
                            if (tail === head) { return false }
                            OK = false;
                            tail += 1;
                            head += 1;
                            break;
                        }
                    }
                    while (head < usedCount) { usedAreas[tail++] = usedAreas[head++] }
                    usedCount = tail;
                    return OK;

                }

                const isSame = (x, y, transform) => {
                    var xx, yy;
                    if (transform.rot) {
                        if (canFit(x, y, hf, wf)) {
                            for (yy = 0; yy < wf; yy  ++) {
                                for (xx = 0; xx < hf; xx  ++) {
                                    if (d32[x + xx + (y + yy) * w] !== df32[transform(xx, yy, wf, hf)]) {
                                        return false;
                                    }
                                }
                            }
                        } else { return false }
                    } else {
                        if (canFit(x, y, wf, hf)) {
                            for (yy = 0; yy < hf; yy  ++) {
                                for (xx = 0; xx < wf; xx  ++) {
                                    if (d32[x + xx + (y + yy) * w] !== df32[transform(xx, yy, wf, hf)]) {
                                        return false;
                                    }
                                }
                            }
                        } else { return false }
                    }
                    return true;
                }

                const replace = (x, y, transform) => {
                    var xx, yy;
                    const m = transform.m
                    const replaceImgSpr = replaceImgSprs[(replaceIdx ++) % replaceImgSprs.length];
                    const isSub = replaceImgSpr.type.subSprite;
                    const sub = replaceImgSpr.subSprite;
                    const replaceImg = replaceImgSpr.image;
                    const w = isSub ? sub.w : replaceImg.w;
                    const h = isSub ? sub.h : replaceImg.h;


                    if (transform.rot) {
                        img.ctx.setTransform(m[0], m[1], m[2], m[3], m[4] * h + x, m[5] * w + y);
                        img.ctx.clearRect(0, 0, w, h);
                        isSub ?
                            img.ctx.drawImage(replaceImg, sub.x, sub.y, sub.w, sub.h, 0, 0, w, h) :
                            img.ctx.drawImage(replaceImg, 0, 0);
                        used(x, y, h, w);
                        x += h - 1;
                    } else {
                        img.ctx.setTransform(m[0], m[1], m[2], m[3], m[4] * w + x, m[5] * h + y);
                        img.ctx.clearRect(0, 0, w, h);
                        isSub ?
                            img.ctx.drawImage(replaceImg, sub.x, sub.y, sub.w, sub.h, 0, 0, w, h) :
                            img.ctx.drawImage(replaceImg, 0, 0);
                        used(x, y, w, h);
                        x += w - 1;
                    }
                    found ++;
                    return x;

                }
                var x, y;
                const alignment = Math.max(1, API.pixelArtSubImageAlignment);
                const edge = Math.min(hf, wf) - 1;
                for (y = 0; y < h - edge; y  += alignment) {
                    for (x = 0; x < w - edge; x  += alignment) {
                        let i = Math.random() * transforms.length | 0
                        for (const tran of transforms) {
                            const t = transforms[(i++) % transforms.length];
                            if (isSame(x, y, t)) { x = replace(x, y, t); break }
                        }
                    }
                }

                log("Image find replaced " + found + " sub images");
                //setPixelData(img, dataA);

                return true;

            }
        },
        tileMapper(tileSpr, colMapSpr, mapSpr, layoutSprs, asImage = true, tileImage, redraw = false) {  // assumed arguments are vetted
            const addedSprites = [];
            const tileSheet = tileSpr.image;
            const tiles = tileSheet.desc.sprites;
            const isGrid = tileSheet.desc.gridSubSprites;

            var tx = 0, ty = 0, tw = tiles[0].w, th = tiles[0].h, cw = colMapSpr.image.w, ch = colMapSpr.image.h;
            const [gW, gH] = isGrid ? [tileSheet.w / tw | 0, tileSheet.h / th | 0] : [0, 0];
            const cols = !redraw ? new Uint32Array(colMapSpr.image.ctx.getImageData(0, 0, cw, ch).data.buffer) : undefined;
            const mapView = [...mapSpr.attachers.values()].find(spr => spr.type.cutter);
            const outsideCol = !redraw ? cols[0] : tileImage?.outsideCol;
            const [W, H] = mapView ? [mapView.w, mapView.h] : [mapSpr.image.w, mapSpr.image.h];
            const [mW, mH] = [mapSpr.image.w, mapSpr.image.h];
            var iW = 0, iH = 0;

            if (asImage && !tileImage) {
                iW = W * tw;
                iH = H * th;
                media.create({width: iW, height: iH, type: "canvas" , name: NAMES.register("tileMapper")}, canvas => {
                    tileImage = canvas;
					const spr = new Sprite(iW / 2, iH / 2, iW, iH);
					spr.changeImage(canvas);
                    spr.key.update();
                    sprites.add(spr);
                    addedSprites.push(spr);
                });
            }
            if (asImage) {
                if (!tileImage.tileMap || tileImage.tileMap.w !== W || tileImage.tileMap.h !== H) {
                    tileImage.tileMap = new Array(W * H).fill(outsideCol);
                    tileImage.tileMap.w = W;
                    tileImage.tileMap.h = H;
                }
                tileImage.ctx.clearRect(0, 0, tileImage.w, tileImage.h);
            }
            const map = new Uint32Array(mapSpr.image.ctx.getImageData(0, 0, mapSpr.image.w, mapSpr.image.h).data.buffer);
            var x, y;
            var i = 0;
            const wildCol = asImage && redraw ? tileImage.tileWildCols : {};
            const lSprs = (asImage && redraw) ? tileImage.tileLayouts : [];
            if (!redraw) {
                asImage && (tileImage.outsideCol = outsideCol);
                for (y = 0; y < ch; y++) {
                    const idx = y * cw;
                    if (cols[idx]) {
                        x = 1;
                        const match = [];
                        while (cols[idx + x] && x < cw) {
                            if (cols[idx + x] === 0xFFFF00FF) { match.push(0) }
                            else { match.push(cols[idx + x]) }
                            x++;
                        }
                        wildCol[cols[idx]] = match;
                    } else { break }
                }

                asImage && (tileImage.tileWildCols = wildCol);
                for (const l of layoutSprs) {
                    const c32 = [];
                    const cc = new Uint32Array(l.image.ctx.getImageData(0, 0, l.image.w, l.image.h).data.buffer);
                    i = 0;
                    while (i < cc.length) {
                        if (cc[i]) { c32.push(i) }
                        i++;
                    }
                    for (const c of l.attachers.values()) {
                        const layout = {
                           w: c.image.w,
                           h: c.image.h,
                           d32: new Uint32Array(c.image.ctx.getImageData(0, 0, c.image.w, c.image.h).data.buffer),
                           c32,
                        };
                        layout.ignore = c32.length === 0;
                        lSprs.push(layout);

                    }
                }
                asImage && (tileImage.tileLayouts = lSprs);
            }
            function matchLayout(X, Y, l) {
                var x, y;
                if (l.ignore) {
                    return map[X + 1 + (Y + 1) * mW] === l.d32[4];
                } else {
                    const {w, h, d32} = l;
                    for (y = 0; y < h; y++) {
                        for (x = 0; x < w; x++) {
                            const mCol = (X + x < 0 || X + x >= mW || Y + y < 0 || Y + y >= mH) ? outsideCol : map[X + x + (Y + y) * mW];
                            const tCol = d32[x + y * w];
                            if (tCol && wildCol[tCol]) {
                                if (!wildCol[tCol].includes(mCol)) { return false }
                            } else if (mCol !== tCol) { return false }
                        }
                    }
                }
                return true;
            }
            function addTileSprite(X, Y, l) {
                const tileIdx = l.c32[Math.random() * l.c32.length | 0];
                if (tileIdx !== undefined) {
                    const xx = X * tw, yy = Y * th;
                    const tile = tiles[tileIdx];
					const spr = new Sprite(xx + tw / 2, yy + th / 2, tw, th);
					spr.changeImage(tileSheet);
					spr.changeToSubSprite(tileIdx);
                    spr.sx = 1;
                    spr.sy = 1;
                    spr.rx = 0;
                    spr.ry = Math.PI / 2;
                    spr.key.update();
                    sprites.add(spr);
                    addedSprites.push(spr);
                }
            }
            function addTileToImage(X, Y, l) {
                //const tileIdx = l.c32[Math.random() * l.c32.length | 0];
                const tileIdx = l.c32[(X + Y + 2) % l.c32.length | 0];
                if (tileIdx !== undefined) {
                    tileImage.tileMap[X + 1 + (Y + 1) * W] = tileIdx;
                    const xx = (X + 1) * tw, yy = (Y + 1) * th;
                    if (isGrid) {
                        tileImage.ctx.drawImage(tileSheet, (tileIdx % gW) * tw, (tileIdx / gW | 0) * th, tiles[0].w, tiles[0].h, xx, yy, tiles[0].w, tiles[0].h);
                    } else {
                        const tile = tiles[tileIdx];
                        tileImage.ctx.drawImage(tileSheet, tile.x, tile.y, tile.w, tile.h, xx, yy, tile.w, tile.h);
                    }
                }
            }
            var x, y, c = 0;
            const p = utils.point;
            if (mapView) {
                /*for (y = -1; y <= H; y++) {
                    for (x = -1; x <= W; x++) {
                        mapSpr.key.toLocalPoint(mapView.key.toWorldP(x - W/2, y - H/2, p));
                        const xx = Math.round(p.x);
                        const yy = Math.round(p.y);
                        if (xx >= -1 && xx <= mW && yy >= -1 && yy <= mH) {
                            for (const l of lSprs) {
                                const {w, h} = l;
                                if (matchLayout(xx, yy, l)) {
                                    if (l.ignore) {

                                    } else {
                                        asImage ?  addTileToImage(x, y, l) : addTile(x, y, l);
                                    }
                                    c++;
                                    break;
                                }
                            }
                        }
                    }
                }*/
            } else {
                for (y = -1; y <= H; y++) {
                    for (x = -1; x <= W; x++) {
                        for (const l of lSprs) {
                            //const {w, h} = l;
                            if (matchLayout(x, y, l)) {
                                if (l.ignore) {
                                    tileImage.tileMap[x + 1 + (y + 1) * W] = -1;
                                } else {
                                    asImage ?  addTileToImage(x, y, l) : addTile(x, y, l);
                                }
                                c++;
                                break;
                            }
                        }
                    }
                }
            }
            if(asImage) {
                tileImage.processed = true;
                tileImage.lastAction = "Tile mapper";
                tileImage.update();
            }
            return addedSprites;
        },
		buildConnectedMap(map, sheet, mapping, tileImage) { // assumed arguments are vetted
			
			const w = map.image.w, h = map.image.h;
			const tw = map.image.desc.sprites[0].w, th = map.image.desc.sprites[0].h, cols = w / tw | 0, rows = h / th | 0;
			const sheetImg = sheet.image;
			const stw = sheetImg.desc.sprites[0].w, sth = sheetImg.desc.sprites[0].h;
			const [gW, gH] = [sheetImg.w / stw | 0, sheetImg.h / sth | 0];
			var iW, iH;
			const maps = [...mapping.values()];
			const layCount = [];
			for (const col of maps) { 
				i = 0;
				for (const v of col.vals) {
					layCount[i] === undefined && (layCount[i] = 0);
					layCount[i] += v !== 0 ? 1 : 0;
					i++;
				}
			}
						
					
			const mapShapes = maps.map(()=>[]);
			const tileCount = cols * rows;
			const d32 = new Uint32Array(map.image.ctx.getImageData(0, 0, w, h).data.buffer);
			var i = 0, x, y, xx, yy, bit, shapeA, shapeB;
			while (i < tileCount) {
				xx = (i % cols) * tw;
				yy = (i / cols | 0) * th;
				bit = 0;
				for (const col of maps) { col.val = 0 };
				for (y = 0; y < th; y ++) {
					for (x = 0; x < th; x ++) {
						const idx = xx + x + (yy + y) * w;
						const px = d32[idx];
						if (px !== 0) {
							const col = mapping.get(px);
							if (col) {
								col.val += 1 << bit;
							}
						}
						bit ++;
					}
				}
				for (const col of maps) { 
					mapShapes[col.idx][i] = col.val; 
				};
				i++;
			}
	
			var addedSprites = [];
			iW = cols * stw;
			iH = rows * sth;
            if (!tileImage) {
                media.create({width: iW, height: iH, type: "canvas" , name: NAMES.register(map.name + "_Map")}, canvas => {
                    tileImage = canvas;
					const spr = new Sprite(iW / 2, iH / 2, iW, iH);
					spr.changeImage(canvas);
                    spr.key.update();
                    sprites.add(spr);
                    addedSprites.push(spr);
                });
            } else {
				addedSprites.push(tileImage);
				tileImage = tileImage.image;
				if (tileImage.w !== iW || tileImage.h !== iH) {
					tileImage.w = tileImage.width = iW;
					tileImage.h = tileImage.height = iH;
				}
			}
			tileImage.ctx.clearRect(0, 0, tileImage.w, tileImage.h);	
			i = 0;
            var found, score, count, foundAll = new Map(), all = [], allc;
			var tIdx;
			const closest = (shape, set) => {
				var i = 0;
				var max = 6, found;
				for (const v of set) {
					if (v === shape) { 
						found = i; 
						max = 16; 
						foundAll.has(i) ? foundAll.get(i)[0] ++ : foundAll.set(i, [1]);
					} 
						
					i++;
				}
				return [found, max];
				
			}
			i = 0;
			
			var tileMap = map.tileMap;
			if (!tileMap || tileMap.length !== tileCount) {
				tileMap = new Uint16Array(tileCount);
			}
			tileMap.rows = rows;
			tileMap.cols = cols;
			while (i < tileCount) {		
				tIdx = -1;
				xx = i % cols;				
				yy = i / cols | 0;
				foundAll.clear();
				count = 0;
				for (const col of maps) { 
					if (mapShapes[col.idx][i] !== 0) {
						const shape = mapShapes[col.idx][i];
						[found, score] = closest(shape, col.vals);
						count += 1;
					}
				}
				if (count) {
					allc = 0;
					if (count === 1) {
						for (const [idx, c] of foundAll.entries()) { 
							if (c[0] === count && layCount[idx] === 1) { all[allc++] = idx; }
						}	
						
					} else {
						for (const [idx, c] of foundAll.entries()) { 
							if (c[0] === count) { all[allc++] = idx }
						}	
					}
					if (allc) {
						tIdx = all[Math.random() * allc | 0];
					}					
					if (tIdx > -1) {				
						tileImage.ctx.drawImage(sheetImg, (tIdx % gW) * stw, (tIdx / gW | 0) * sth, stw, sth, xx * stw, yy * sth, stw, sth);					
					}		
				}		
				tileMap[i] = tIdx > -1 ? tIdx : 0xffff;
				i++;
			
			}
			API.buildConnectedMap.tiles = tileMap;
			map.tileMap = tileMap;
			return addedSprites;
		
		},
		removeIdenticalTiles(img) {
			if (!img.isDrawable) { log.warn("Image is not drawable");return false }
			if (!img.desc.gridSubSprites) { log.warn("Image is not a tile sheet"); return false }

			const tiles = img.desc.sprites;
			const w = img.w, h = img.h;
			const tw = tiles[0].w, th = tiles[0].h, cols = w / tw | 0, rows = h / th | 0;
			const imgData = img.ctx.getImageData(0, 0, w, h);
			const d32 = new Uint32Array(imgData.data.buffer);
			const isSame = (tIdxA, tIdxB) => {
				const xA = (tIdxA % cols) * tw;
				const yA = (tIdxA / cols | 0) * th;
				const xB = (tIdxB % cols) * tw;
				const yB = (tIdxB / cols | 0) * th;
				for (y = 0; y < th; y++) {
					for (x = 0; x < tw; x++) {		
						if (d32[xA + x + (yA + y) * w] !== d32[xB + x + (yB + y) * w] ) { return false }						
					}
				}
				return true;
			}
			const isEmpty = (tIdx) => {
				const xx = (tIdx % cols) * tw;
				const yy = (tIdx / cols | 0) * th;
				for (y = 0; y < th; y++) {
					for (x = 0; x < tw; x++) {		
						if (d32[xx + x + (yy + y) * w] !== 0 ) { return false }						
					}
				}
				return true;
			}
			const empty = (tIdx) => {
				const xx = (tIdx % cols) * tw;
				const yy = (tIdx / cols | 0) * th;
				for (y = 0; y < th; y++) {
					for (x = 0; x < tw; x++) {		
						d32[xx + x + (yy + y) * w] = 0;
					}
				}
				return true;
			}
			
			var x, y, r, c, rr, cc, count;
			for (r = 0; r < rows; r++) {
				for (c = 0; c < cols; c++) {		
					const gIdxA = c + r * cols;
					if (!isEmpty(gIdxA)) {
						for (rr = 0; rr < rows; rr++) {
							for (cc = 0; cc < cols; cc++) {				
								const gIdxB = cc + rr * cols;
								if (gIdxB > gIdxA) {
									if (isSame(gIdxA, gIdxB)) {
										empty(gIdxB);
										count ++;
									}
								}
							}
						}
					}
				}
			}
			img.ctx.putImageData(imgData,0,0);
			img.desc.dirty = true;
			img.lastAction = "Removed " + count + " identical tiles";
			img.processed = true;
			img.update();	
			
			return true;
		},			
		createTileMapping(map) { // assumed arguments are vetted
            const img = map.image;
            const tiles = img.desc.sprites;
			const w = img.w, h  = img.h;
			const tw = tiles[0].w, th = tiles[0].h, columns = w / tw | 0, rows = h / th | 0;			
			const d32 = new Uint32Array(img.ctx.getImageData(0, 0, w, h).data.buffer);
			var x, y, r, c;
			const cols = new Map();
			const colA = [];
			var warn = false;
			var warnStr = "";
			const findCols = d32 => {
				var i = 0;
				while(i < d32.length) {
					var px = d32[i];
					if (px !== 0 && px !== 0xFFFF0000 && px !== 0xFF0000FF) {			
						
						if (!cols.has(px)) {
							const col = {px, idx: cols.size, val: 0, vals: []};
							cols.set(px, col);
							colA.push(col);
						}
					} else if (!warn && (px === 0xFFFF0000 || px === 0xFF0000FF)) {
						warn = true;
						warnStr = "Red and Blue are reserved for Tile connection map";
					}
					i++;
				}
			}
			findCols(d32);
			for (r = 0; r < rows; r++) {
				const yy = r * th;
				for (c = 0; c < columns; c++) {
					const gIdx = c + r * columns;
					const xx = c * tw;
					for (const col of colA) { col.val = 0 };
					let i = 0;
					for (y = 0; y < th; y++) {
						for (x = 0; x < tw; x++) {
							const col = cols.get(d32[xx + x + (yy + y) * w]);		
							if (col) {
								col.val += 1 << i;
							}
							i++;
						}
					}
					for (const col of colA) { col.vals.push(col.val) }
				}
			}
			if (warn) {
				log.warn(warnStr);
				
			}
			return cols;
		},
		createTileConnectMap(maps) { // assumed arguments are vetted
            const tiles = maps[0].image.desc.sprites;
			const tw = tiles[0].w, th = tiles[0].h, cols = maps[0].image.w / tw | 0, rows = maps[0].image.h / th | 0;
			const tw1 = tw - 1, th1 = th - 1;
			var x, y, r, c;
			const gridEdges = new Map();
			const sets = {};
			
			var add = true;
			for (const spr of maps) {
				const d32 = new Uint32Array(spr.image.ctx.getImageData(0, 0, spr.image.w, spr.image.h).data.buffer);
				for (r = 0; r < rows; r++) {
					const yy = r * th;
					for (c = 0; c < cols; c++) {
						const gIdx = c + r * cols;
						const xx = c * tw;
						var T = 0, B = 0, L = 0, R = 0;
						for (y = 0; y < th; y++) {
							for (x = 0; x < tw; x++) {
								if (px === 0xFFFF0000) {  // Blue left right edges
									if (x === 0) { L += 1 << y }
									else if (x === tw1) { R += 1 << y }
								} else  if (px === 0xFF0000FF) { // RED top bottom edges
									if (y === 0) { T += 1 << x }
									else if (y === th1) { B += 1 << x }
								} 
							}
						}
						gridEdges.set(gIdx, {idx: gIdx, T, B, L, R});
					}
				}
				const nSet = [];
				for (const e of gridEdges.values()) {
					const match = {idx: e.idx, L:[], R:[], T:[], B:[]};
					const {T, B, L, R} = e;
					if (T !== 0 || B !== 0 || L !== 0 || R !== 0) {
						for (const e1 of gridEdges.values()) {
							if (T !== 0 && e1.B === T) { match.T.push(e1.idx) }
							if (B !== 0 && e1.T === B) { match.B.push(e1.idx) }
							if (L !== 0 && e1.R === L) { match.L.push(e1.idx) }
							if (R !== 0 && e1.L === R) { match.R.push(e1.idx) }
						}
					}
					var del = 0;
					if (match.L.length === 0) { del ++; delete match.L }
					if (match.R.length === 0) { del ++; delete match.R }
					if (match.T.length === 0) { del ++; delete match.T }
					if (match.B.length === 0) { del ++; delete match.B }
					if (del < 4) { nSet.push(match) }
				}
				sets[spr.name] = nSet;	
					
			}
			return sets;
				
		},
		tileMapperV2(tileSpr, colMapSpr, mapSpr, tileImage ) { // assumed arguments are vetted
            const addedSprites = [];
            const tileSheet = tileSpr.image;
            const tiles = tileSheet.desc.sprites;
            const isGrid = tileSheet.desc.gridSubSprites;
            var iW = 0, iH = 0, i;
            var tx = 0, ty = 0, tw = tiles[0].w, th = tiles[0].h, cw = colMapSpr.image.w, ch = colMapSpr.image.h;
            const [gW, gH] = [tileSheet.w / tw | 0, tileSheet.h / th | 0];
            const [W, H]   = [mapSpr.image.w, mapSpr.image.h];
            const [mW, mH] = [mapSpr.image.w, mapSpr.image.h];
			iW = W * tw;
			iH = H * th;			
            if (!tileImage) {
                media.create({width: iW, height: iH, type: "canvas" , name: NAMES.register(tileSpr.image.desc.name + "_Mapped")}, canvas => {
                    tileImage = canvas;
					const spr = new Sprite(iW / 2, iH / 2, iW, iH);
					spr.changeImage(canvas);
                    spr.key.update();
                    sprites.add(spr);
                    addedSprites.push(spr);
                });
            } else {
				if (tileImage.w !== iW || tileImage.h !== iH) {
					tileImage.w = tileImage.width = iW;
					tileImage.h = tileImage.height = iH;
				}
			}

			/*if (!tileImage.tileMap || tileImage.tileMap.w !== W || tileImage.tileMap.h !== H) {
				tileImage.tileMap = new Array(W * H).fill(outsideCol);
				tileImage.tileMap.w = W;
				tileImage.tileMap.h = H;
			}*/
			tileImage.ctx.clearRect(0, 0, tileImage.w, tileImage.h);
			const colMapD32 = new Uint32Array(colMapSpr.image.ctx.getImageData(0, 0, colMapSpr.image.w, colMapSpr.image.h).data.buffer);
			const mapD32 = new Uint32Array(mapSpr.image.ctx.getImageData(0, 0, mapSpr.image.w, mapSpr.image.h).data.buffer);
			i = 0;
			const colMap = new Map();
			while (i < colMapD32.length) {
				let c = colMapD32[i];
				if (c !== 0) {
					c &= 0b0000_0000_1111_1100_1111_1100_1111_1100;
					if (colMap.has(c)) {
						colMap.get(c).push(i);
					} else {
						colMap.set(c, [i]);
					}
				}
				i++;
			}
			i = 0;
			while (i < mapD32.length) {
				let c = mapD32[i];
				if (c !== 0) {
					c &= 0b0000_0000_1111_1100_1111_1100_1111_1100;
					const idxs = colMap.get(c);
					if (idxs !== undefined) {
						const idx = idxs[Math.random() * idxs.length | 0];
						const xx = (i % mW) * tw;
						const yy = (i / mW | 0) * th;
						tileImage.ctx.drawImage(tileSheet, (idx % gW) * tw, (idx / gW | 0) * th, tw, th, xx, yy, tw, th);
					}
				}
				i++;
			}
				
				
			return addedSprites;
		},
        fixPixelArtLines(img, doNotUpdate = false, pixels){
            if(pixels || img.isDrawable){
                if (doNotUpdate && pixels) {
                    var data = pixels;
                } else {
                    var data = getPixelData8Bit(img);

                }
                var w = img.w;
                var h = img.h;
                const d = data.data;

                var x,y;

                var ww4 = w*4;
                var changed = false;

                const mirror = bits => {
                    var b = 0;
                    b += bits & 1   ? 32 : 0;
                    b += bits & 2   ? 64 : 0;
                    b += bits & 4   ? 128 : 0;
                    b += bits & 8   ? 8 : 0;
                    b += bits & 16  ? 16 : 0;
                    b += bits & 32  ? 1 : 0;
                    b += bits & 64  ? 2 : 0;
                    b += bits & 128 ? 4 : 0;
                    return b;
                }
                const rotate = bits => {
                    var b = 0;
                    b += bits & 1   ? 4 : 0;
                    b += bits & 2   ? 16 : 0;
                    b += bits & 4   ? 128 : 0;
                    b += bits & 8   ? 2 : 0;
                    b += bits & 16  ? 64 : 0;
                    b += bits & 32  ? 1 : 0;
                    b += bits & 64  ? 8 : 0;
                    b += bits & 128 ? 32 : 0;
                    return b;
                }
                const add = v => {
                    bitShapes.push(v);
                    bitShapes.push(v = rotate(v));
                    bitShapes.push(v = rotate(v));
                    bitShapes.push(v = rotate(v));
                    bitShapes.push(v = mirror(rotate(v)));
                    bitShapes.push(v = rotate(v));
                    bitShapes.push(v = rotate(v));
                    bitShapes.push(rotate(v));
                }
                const bitShapes = []
                add(0b00010011);
                add(0b01010000);
                add(0b01011000);
                add(0b11000000);
                add(0b11010000);
                add(0b10010110);
                add(0b01011010);
                add(0b11110100);
                add(0b00101110);
                add(0b11011000);
                add(0b10011010);
                add(0b00111111);
                add(0b11011100);

                const change = new Set(bitShapes);
                const getShape = (index) => {
                    index += 3;
                    var bits =0;
                    if(d[index] > 0){
                        bits += d[index-ww4-4] > 0  ? 1 : 0;
                        bits += d[index-ww4] > 0    ? 2 : 0;
                        bits += d[index-ww4+4] > 0  ? 4 : 0;
                        bits += d[index-4] > 0      ? 8 : 0;
                        bits += d[index+4] > 0      ? 16 : 0;
                        bits += d[index+ww4-4] > 0  ? 32 : 0;
                        bits += d[index+ww4] > 0    ? 64 : 0;
                        bits += d[index+ww4+4] > 0  ? 128 : 0;


                        return bits;
                    }
                    return bits;
                }

                for(y = 0; y < h; y+=1){
                    for(x = 0; x < w; x+=1){
                        var index = (y * w + x) * 4;
                        if(change.has(getShape(index))){
                            d[index + 3] = 0;
                            changed = true;
                        }
                    }
                }
                if(!doNotUpdate){
                    setPixelData(img, data);
                    img.processed = true;
                    img.lastAction = "Fix pixel art lines";
                    img.update();
                    return true;
                }
                return pixels;

            }
        },
        fixPixelArtLinesV2(img){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                var dataA = getPixelData8Bit(img);
                var dataB = getPixelData8Bit(img);
                var d32A = new Uint32Array(dataA.data.buffer);
                var d32B = new Uint32Array(dataB.data.buffer);
                const offsets = [-w-1, -w, -w+1, -1, 1, w-1, w, w+1];
                const bits = [128,64,32,16,8,4,2,1];
                const rules = new Uint8Array(256);

                // bits shape
                // 7,6,5
                // 4   3
                // 2,1,0
                // order 76543210
                rules[0] = 0;

                rules[0b00011111] = 1;
                rules[0b01101011] = 1;
                rules[0b00101111] = 1;
                rules[0b11101001] = 1;
                rules[0b00000111] = 1;
                rules[0b00101001] = 1;
                rules[0b00001011] = 1;
                rules[0b01101000] = 1;
                rules[0b00001111] = 1;
                rules[0b00010111] = 1;
                rules[0b00101011] = 1;
                rules[0b01101001] = 1;
                rules[0b00010110] = 1;

                rules[0b11111111] = 0;

                var x,y;

                const getShape = idx => {
                    const px = d32A[idx];
                    var i = 0;
                    if (px > 0) {
                        var shape = d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        shape += d32A[idx + offsets[i]] === px ? bits[i++] : (i++, 0);
                        return shape;
                    }
                    return 0;
                }

                var change = true;
                var its = 100;
                while (its-- && change) {
                    change = false;
                    for(y = 0; y < h; y+=1){
                        for(x = 0; x < w; x+=1){
                            var idx = y * w + x;
                            const shape = getShape(idx);
                            if (rules[shape]) {
                                d32B[idx] = 0;
                                change = true;
                            } else {
                                d32B[idx] = d32A[idx];
                            }
                        }
                    }
                    [d32A, d32B] = [d32B, d32A];
                    [dataA, dataB] = [dataB, dataA];
                }

                //fixPixelArtLines(img, true, dataA)
                setPixelData(img, API.fixPixelArtLines(img, true, dataA));
                img.processed = true;
                img.lastAction = "Fix pixel art V2";
                img.update();
                return true;


            }
        },
        SaveShaderToyImage(img, pallet){
            if(img.isDrawable && pallet){
                const pSize = pallet.length;
                var w = img.w;
                var h = img.h;
                if (w > 256 || h > 256) {
                    log.warn("Image size must be under 256 by 256");
                    return;
                }
                var dataA = getPixelData8Bit(img).data;
                //var d32A = new Uint32Array(dataA.data.buffer);     
                const pxBuf = new Uint8Array(w * h);
                const tBuf = new Uint8Array(w * h * 4);
                var tSize = 0, ttSize;;
                var ix, iy = 0;
                while (iy < h) {
                    ix = 0;
                    while (ix < w) {
                        const idx = (ix + iy * w) * 4;
                        let pIdx = 0;
                        if (dataA[idx + 3] < 255) {
                            pIdx = pSize;
                        } else {
                            pIdx = pallet.closestColorIdx(dataA[idx], dataA[idx + 1], dataA[idx + 2]);
                        }
                        pxBuf[ix + iy * w] = pIdx;
                        ix ++;
                    }
                    iy++;
                }
                
                const U32 = new Uint32Array(1);
                const wByte = val => tBuf[tSize++] = val;
                const wBytes = (...vals) => vals.forEach(wByte);
                const wShort = val => wBytes((val >> 8) & 0xff, val & 0xff);
                const wColor = (r,g,b) => wBytes(r, g, b);
                const wSeek = pos => { ttSize = tSize; tSize = pos; }
                const wRestore = pos => { tSize = ttSize; }
                const rByte = () => tBuf[tSize++];
                const rShort = () => (rByte() << 8) + rByte();
                const rInt = () => (U32[0]=(rByte() << 24) + (rByte() << 16) + (rByte() << 8) + rByte(),U32[0]);
                
                wByte(w);
                wByte(h);
                wByte(pSize);
                const pA = pallet.asArray()
                var i = 0;
                while (i < pSize) {
                    wColor(pA[i][0], pA[i][1], pA[i][2]);
                    i++;
                }
                iy = 0;
                const rowIdx = tSize;
                while (iy < h) {
                    wShort(0);
                    iy++;
                }
                iy = 0;
                var rIdx = h * 2;
                while (iy < h) {
                    ix = 0;
                    var same = 0;
                    var pPx = pSize;
                    var rowSize = 0;
                    while (ix < w) {
                        const idx = ix + iy * w;
                        if (pxBuf[idx] !== pPx) {
                            if (ix !== 0) {
                                wByte(same);
                                wByte(pPx);
                                rowSize += 2;
                            }
                            pPx = pxBuf[idx];
                            same = 1;
                        } else {
                            same ++;
                        }
                        ix++;
                    }
                    if (same >= w && pPx === pSize) { // empty row
                        wSeek(rowIdx + iy * 2);
                        wShort(rIdx >> 1);
                        wRestore();
                    } else {
                        if (pPx !== pSize) {
                            wByte(same);
                            wByte(pPx);                            
                            rowSize += 2;
                        }
                        wSeek(rowIdx + iy * 2);
                        wShort(rIdx >> 1);
                        wRestore();
                        rIdx += rowSize;
                    }
                    iy ++;
                }
                const tPos = tSize;
                var str = `
//---------------------------------------------------------------------------------------------------------------------------------
// Work by Blindman67. 
// Copyright Blindman67 2023.
// You cannot host, display, distribute or share this Work neither as it is or altered, in any form including physical and digital. 
// You cannot use this Work in any commercial or non-commercial product. 
`;
                i = 0;
                str += "// PainterV3 Image Export: localProcessImage.SaveShaderToyImage('" + img.desc.name + "', unnamedPallet);\n";                
                str += "//---------------------------------------------------------------------------------------------------------------------------------\n";


                str += "const uvec3 IMG_SIZE = uvec3(" + w + "u, " + h + "u, " + pSize +"u);\n";
                str += "const vec3 pallet[" + pSize + "] = vec3[](\n";
                var tail = "";
                while (i < pSize) {
                    str +=  tail + "    vec3(" + (pA[i][0] / 255).toFixed(3) + ", " +(pA[i][1] / 255).toFixed(3)+ ", " +(pA[i][2] / 255).toFixed(3)+ ")";
             
                    tail = ",\n";
                    i++;
                }
                str += ");\n";
                str += "const uint img[" + (((tSize - rowIdx) / 4) | 0 + 1) + "] = uint[](\n    ";
                var tail = "";
                
                
                i = rowIdx;
                var dataPos = 0;
                var dataIdx = 0;
                wSeek(rowIdx);
                while (i < tPos) {
                    str += tail + "0x" + rInt().toString(16) + "u";
                    i += 4;
                    if ((i - rowIdx) % 64 === 0) {
                        tail = ",\n    ";
                    } else {
                        tail = ", ";
                    }
                }
                str += ");\n\n\n\n";    
                
                if (img.desc.sprites) {
                    i = 0;
                    const sMap = new Map();
                    const sprites = new Uint32Array(img.desc.sprites.length);
                    var sprCount = 0;
                    while (i < img.desc.sprites.length) {
                        const spr = img.desc.sprites[i];
                        const data = (((spr.x | 0) & 0xFF) << 24) | (((spr.y | 0) & 0xFF) << 16) | (((spr.w | 0) & 0xFF) << 8) | ((spr.h | 0) & 0xFF);
                        if (!sMap.has(spr.name)) {
                            sMap.set(spr.name, {loc: new Uint32Array(img.desc.sprites.length), count: 0, name: spr.name});
                        }
                        const sm = sMap.get(spr.name);
                        sm.loc[sm.count++] = sprCount;
                        sprites[sprCount++] = data;
                        i++;
                    }
                    i = 0;
                    str += "const uint SPRITES[" + sprCount + "] = uint[](";
                    tail = "";
                    while (i < sprCount) {
                        str += tail + "0x" + sprites[i].toString(16) + "u";
                        tail = ", ";
                        i++;
                    }
                    str += ");\n"; 
                    for (const [name, sm] of sMap) {
                        str += "const uint SPR_" + name + "[" + sm.count + "] = uint[](";
                        i = 0;
                        tail = "";
                        while (i < sm.count) {
                            str += tail + "0x" + sm.loc[i].toString(16) + "u";
                            tail = ", ";
                            i++;
                        }
                        str += ");\n";                        
                    }
                        
                    str += "\n\n\n\n"; 
                }
                
                
                str += `
uint GetNextShort(uint idx) { return (img[(idx + 1u) >> 1] >> ((idx & 1u) << 4)) & 0xFFFFu; }
uint GetShort(uint idx) { return (img[idx >> 1] >> (((idx + 1u) & 1u) << 4)) & 0xFFFFu; }
vec4 ImagePixel(in vec2 fragCoord) {
    uint x = uint(fragCoord.x);
    uint y = uint(fragCoord.y);
    if (y < IMG_SIZE.y && x < IMG_SIZE.x) {
        uint row = GetShort(y);
        uint nextRow = GetNextShort(y);
        if (row == nextRow || row == 0u) { return vec4(0); }
        uint run = GetShort(row);
        uint px = run >> 8;
        while (row < nextRow && px < x) {
            row += 1u;
            if (row == nextRow) { return vec4(0); }
            run = GetShort(row);
            px += run >> 8;
        }
        uint colIdx = run & 0xFFu;
        return colIdx == IMG_SIZE.z ? vec4(0) : vec4(pallet[colIdx], 1);
    }
    return  vec4(0);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    fragColor = iFrame == 0 ? ImagePixel(fragCoord) : texelFetch(iChannel0, ivec2(fragCoord.xy), 0);
}
`                
                
                downloadTextAs(str, "ShaderToyImage_" + img.desc.name, "txt");
                
                
                
                return true;
            }
        },
        fillTransparentWithColor(img, color){
            if(img.isDrawable){
                img.ctx.fillStyle = color;
                img.ctx.setTransform(1,0,0,1,0,0);
                img.ctx.globalCompositeOperation = "destination-over";
                img.ctx.fillRect(0,0,img.w, img.h);
                img.ctx.globalCompositeOperation = "source-over";
                img.processed = true;
                img.lastAction = "Filled transparent";
                img.update();
                return true;
            }
        },
        fillForegroundWithColor(img, color){
            if(img.isDrawable){
                img.ctx.fillStyle = color;
                img.ctx.setTransform(1,0,0,1,0,0);
                img.ctx.globalCompositeOperation = "source-atop";
                img.ctx.fillRect(0,0,img.w, img.h);
                img.ctx.globalCompositeOperation = "source-over";
                img.processed = true;
                img.lastAction = "Filled foreground";
                img.update();
                return true;
            }
        },
        fillWithColor(img, color){
            if(img.isDrawable){
                img.ctx.setTransform(1,0,0,1,0,0);
                img.ctx.fillStyle = color;
                img.ctx.fillRect(0,0,img.w, img.h);
                img.processed = true;
                img.lastAction = "Filled color";
                img.update();
                return true;
            }
        },
        floodFill(img, x, y, tolerance, diagonal, alias, color, dontUpdate = false, areaFill = false){
            if(img.isDrawable){
                copyToWorking(img);
                ctx.fillArea(areaFill);
                if (img.desc.clipType) {
                    const cc = img.desc.clipped;
                    ctx.fillClip(cc.x, cc.y, cc.x1 - cc.x, cc.y1 - cc.y);
                } else {
                    ctx.fillClip(0, 0, img.w, img.h);
                }
                ctx.floodFill(x, y, tolerance, diagonal, alias, {color, comp: img.ctx.globalCompositeOperation, alpha: img.ctx.globalAlpha});
                getCopyOfWorking(img);
                img.processed = true;
                img.lastAction = "Flood fill";
                !dontUpdate && img.update();
                ctx.fillArea(false);
                return true;
            }
        },
        floodFillOutline(img, x, y, tolerance, diagonal, edge, color, dontUpdate = false, areaFill = false){
            if(img.isDrawable){
                copyToWorking(img);
                ctx.fillArea(areaFill);
                if (img.desc.clipType) {
                    const cc = img.desc.clipped;
                    ctx.fillClip(cc.x, cc.y, cc.x1 - cc.x, cc.y1 - cc.y);
                } else {
                    ctx.fillClip(0, 0, img.w, img.h);
                }
                ctx.edgeFill(x, y, tolerance, diagonal, edge, {color, comp: img.ctx.globalCompositeOperation, alpha: img.ctx.globalAlpha});
                getCopyOfWorking(img);
                img.processed = true;
                img.lastAction = "Flood fill outline";
                !dontUpdate && img.update();
                ctx.fillArea(false);
                return true;
            }
        },
        floodFillOutlineTemp(img,x,y,tolerance,diagonal,edge,color, areaFill = false){
            if(img.isDrawable){
                copyToWorking(img);
                ctx.fillArea(areaFill);
                if (img.desc.clipType) {
                    const cc = img.desc.clipped;
                    ctx.fillClip(cc.x, cc.y, cc.x1 - cc.x, cc.y1 - cc.y);
                } else {
                    ctx.fillClip(0, 0, img.w, img.h);
                }
                ctx.edgeFill(x,y,tolerance,diagonal,edge,{color,comp : img.ctx.globalCompositeOperation, alpha : img.ctx.globalAlpha});
                getCopyOfWorking(img);
                img.processed = true;
                ctx.fillArea(false);
                return true;
            }
        },
        floodFillSelectArea(img, x, y, tolerance, diagonal, op, alias, areaFill = false){
            if(img.isDrawable){
                copyToWorking(img);
                ctx.fillArea(areaFill);
                ctx.fillClip(0, 0, img.w, img.h);
                if(op !== "select"){
                    ctx.floodFillBoolMask(op,x,y,tolerance,diagonal,alias);
                }else{
                    copyToWorking(img);
                    ctx.floodFillMask(x,y,tolerance,diagonal,alias);
                    getCopyOfWorking(img);
                }
                ctx.fillArea(false);
                return ctx.floodFillMaskInfo();
            }
        },
        cleanWebGLEdge(img) {
            if (img.isDrawable) {
                const data = getPixelData8Bit(img);
                const d = data.data;
                const W = img.w;
                const H = img.h;
                const angs = new Float64Array(d.length);
                var i = 0, ii = 0;
                const rgb = {};
                const cutoff = 128, dotCutoff = 0.2;
                const rA = 0, gA = Math.PI2 * (1 / 3), bA = Math.PI2 * (2 / 3);
                const rx = Math.cos(rA);
                const ry = Math.sin(rA);
                const gx = Math.cos(gA);
                const gy = Math.sin(gA);
                const bx = Math.cos(bA);
                const by = Math.sin(bA);
                var r,g,b,a,x,y,xx,yy,x1,y1;
                while (i < d.length) {
                    r = d[ii + 0];
                    g = d[ii + 1];
                    b = d[ii + 2];
                    if(r + g + b < cutoff) {
                        d[ii + 0] = r = 0;
                        d[ii + 1] = g = 0;
                        d[ii + 2] = b = 0;
                        angs[i] = -1;
                    }else{
                        r /= 255;
                        g /= 255;
                        b /= 255;
                        x = rx * r + gx * g + bx * b;
                        y = ry * r + gy * g + by * b;
                        const ang = ((Math.atan2(y,x) + Math.PI2) % Math.PI2) * (180 / Math.PI);
                        angs[i] = ang;
                        utils.HSL2RGB(ang,100,50,rgb);
                        d[ii + 0] = rgb.r;
                        d[ii + 1] = rgb.g;
                        d[ii + 2] = rgb.b;
                    }
                    ii += 4;
                    i += 1;
                }
                i = 0;
                ii = 0;
                while (i < d.length) {
                    const a = angs[i];
                    if (a > -1) {
                        xx = i % W;
                        yy = i / W | 0;
                        x = Math.cos(a + Math.PI / 2);
                        y = Math.sin(a + Math.PI / 2);
                        x1 = Math.round(xx + x);
                        y1 = Math.round(yy + y);
                        if(x1 !== xx || y1 !== yy && x1 > -1 && y1 > -1 && x1 < W && y1 < H) {
                            ii = x1 + y1 * W;
                                    angs[ii] = -1;
                                    ii *= 4;
                                    d[ii + 0] = 0;
                                    d[ii + 1] = 0;
                                    d[ii + 2] = 0;

                        }
                        x1 = Math.round(xx - x);
                        y1 = Math.round(yy - y);
                        if(x1 !== xx || y1 !== yy && x1 > -1 && y1 > -1 && x1 < W && y1 < H) {
                            ii = x1 + y1 * W;
                                    angs[ii] = -1;
                                    ii *= 4;
                                    d[ii + 0] = 0;
                                    d[ii + 1] = 0;
                                    d[ii + 2] = 0;
                        }



                    }
                    i++;



                }
                setPixelData(img,data);
                img.processed = true;
                img.lastAction = "Cleaned edge";
                img.update();
                return true;

            }
        },
        findImageDifference(imgA, imgB, amp = 1, gridSize = 16, useMask = false, useValue = true, calcVariance = false){
			if(imgA === undefined) {
				API.findImageDifference.workBuffer = undefined;
				return;
			}
			if(API.findImageDifference.workBuffer === undefined && calcVariance) {
				API.findImageDifference.workBuffer = new Array(gridSize ** 2);
			}
			const ctxB = imgB.ctx;
			ctxB.imageSmoothingEnabled = true;
			const size = gridSize;
			const pixels = size ** 2;
			var linear = false
			var ampDif = false;
			if (amp < 1) { amp = 1; linear = true }
			else if(amp === 2) { amp = 1; ampDif = true }
			var w = imgB.width, h = imgB.height;
			w = 2 ** (Math.log2(w) | 0);
			h = 2 ** (Math.log2(h) | 0);
			ctxB.globalAlpha = 1;
			ctxB.globalCompositeOperation = "difference";
			ctxB.drawImage(imgA, 0, 0, w, h);
			if(amp > 1) {
				while (w > size && h > size) {
					const fw = w, fh = h;
					let i = amp;
					ctxB.globalCompositeOperation = "lighter";
					while (--i > 0) { ctxB.drawImage(imgB, 0, 0, w, h, 0, 0, w, h) }
					ctxB.globalCompositeOperation =  "copy";
					w = w > size ? w / 2 | 0 : w;
					h = h > size ? h / 2 | 0 : h;
					ctxB.drawImage(imgB, 0, 0, fw, fh, 0, 0, w, h);
				}
			} else {
				ctxB.globalCompositeOperation =  "copy";
				while (w > size && h > size) {
					const fw = w, fh = h;
					w = w > size ? w / 2 | 0 : w;
					h = h > size ? h / 2 | 0 : h;
					ctxB.drawImage(imgB, 0, 0, fw, fh, 0, 0, w, h);
				}
			}
			if(useMask) {
				ctxB.globalCompositeOperation = "destination-in";
				ctxB.drawImage(imgA,0,0,w,h);
			}
			ctxB.globalCompositeOperation = "source-over";
			/*{  // debug code to help see what is going on in tracker
				const c = view.context;
				c.save();
				if(c.__x === undefined) {
					c.__y = c.__x = 0;
				}
				c.drawImage(imgA,c.__x,c.__y);
				c.drawImage(imgA,c.__x,c.__y + imgA.h);
				c.__x += imgB.w;
				if(c.__x > c.canvas.width) {
					c.__x = 0;
					c.__y += imgB.h
					if(c.__y > c.canvas.height) {
						c.__y = 0
					}
				}

				c.restore();
			}*/

			const dat = ctxB.getImageData(0, 0, w, h).data;
			var sum = 0,sumShape = 0, count = 0,i,j,t;
			const size2 = size * size * 4;
			j = sum = count = i = 0;
			if(calcVariance){
				const vb = API.findImageDifference.workBuffer;
				if(!linear){
					if(ampDif) {
						while ( i < size2) {
							dat[i] = 128 + (((dat[i] - 128) / 128) ** 2 * 128 * (dat[i] < 128 ? -1 : 1));
							dat[i+1] = 128 + (((dat[i+1] - 128) / 128) ** 2 * 128 * (dat[i+1] < 128 ? -1 : 1));
							dat[i+2] = 128 + (((dat[i+2] - 128) / 128) ** 2 * 128 * (dat[i+2] < 128 ? -1 : 1));
							if (dat[i+3] > 250) {
								sum += vb[j++] = dat[i] * dat[i++] + dat[i]  * dat[i++] + dat[i]  * dat[i++];
								count++;
								i++;
							} else {
								i += 4;
								vb[j++] = -1;
							}
						}
					} else {
						while ( i < size2) {
							if (dat[i+3] > 250) {
								sum += vb[j++] = dat[i] * dat[i++] + dat[i]  * dat[i++] + dat[i]  * dat[i++];
								count++;
								i++;
							} else {
								i += 4;
								vb[j++] = -1;
							}
						}
					}
					sumShape = sum / count;
				}  else {
					while ( i < size2) {
						if (dat[i+3] > 250) {
							sum += vb[j++] = dat[i++] + dat[i++] + dat[i++];
							count++;
							i++;
						} else {
							i += 4;
							vb[j++] = -1;
						}
					}
					sumShape =  sum / count;
				}
				j = 0;
				let v = 0;
				while(j < pixels) {
					if(vb[j] > -1) {
						const vl = sumShape - vb[j++];
						v += vl * vl;
					} else { j++ }
				}
				v /= count;
				API.findImageDifference.coverage = count / pixels;
				API.findImageDifference.sumShape = sumShape;
				API.findImageDifference.variance = v;
				return sum;

			}
			if(!linear){
				if(ampDif) {
					while ( i < size2) {
						dat[i] = 128 + (((dat[i] - 128) / 128) ** 2 * 128 * (dat[i] < 128 ? -1 : 1));
						dat[i+1] = 128 + (((dat[i+1] - 128) / 128) ** 2 * 128 * (dat[i+1] < 128 ? -1 : 1));
						dat[i+2] = 128 + (((dat[i+2] - 128) / 128) ** 2 * 128 * (dat[i+2] < 128 ? -1 : 1));
						sum += dat[i+3] > 250 ? (count++, (dat[i] * dat[i++] + dat[i]  * dat[i++] + dat[i]  * dat[i++]) ) : (i += 3, 0);
						i ++;
					}
				} else {
					while ( i < size2) {
						sum += dat[i+3] > 250 ? (count++, (dat[i] * dat[i++] + dat[i]  * dat[i++] + dat[i]  * dat[i++]) ) : (i += 3, 0);
						i ++;
					}
				}
				sumShape = sum = (sum / (count * 3)) ** 0.5;
			}  else {
				while ( i < size2) {
					sum += dat[i+3] > 250 ? (count++, dat[i++] + dat[i++] + dat[i++]) : (i += 3, 0);
					i ++;
				}
				sumShape = sum = sum / (count * 3);
			}
			API.findImageDifference.coverage = count / (size * size);
			API.findImageDifference.sumShape = sumShape;
			return sum;
        },
        findImageDifferenceHSL(imgA, imgB, gain, compHue = true, compSat = true, compLum = true){
            if(imgA.isDrawable && imgB.isDrawable) {
                const size = 16;
                if(workingCanvas.w !== size || workingCanvas.h !== size) {
                    workingCanvas.w = workingCanvas.width = size;
                    workingCanvas.h = workingCanvas.height = size;
                }

                ctx.globalAlpha = 1;
                ctx.imageSmoothingEnabled = true;
                ctx.globalCompositeOperation = "copy";
                ctx.drawImage(imgA,0,0,size,size)
                const dataA = ctx.getImageData(0,0,size,size);
                const datA = dataA.data;
                ctx.drawImage(imgB,0,0,size,size)
                const dataB = ctx.getImageData(0,0,size,size);
                const datB = dataB.data;
                ctx.globalCompositeOperation = "source-over";

                var i = 0, sum = 0, count = 0;
                var minC, maxC, dif, h, l, s,ha,sa,la,min, max, r, g, b;
                const loged = 255 * 255;
                while(i < datA.length) {
                    if(datB[i + 3]) {
                        h = l = s = 0;
                        r = datA[i] * datA[i] / loged;
                        g = datA[i+1] * datA[i+1] / loged;
                        b = datA[i+2] * datA[i+2] / loged;
                        min = Math.min(r, g, b);
                        max = Math.max(r, g, b);
                        if(min === max){
                            s = min * 100;
                        } else {
                            dif = max - min;
                            l = (max + min) / 2;
                            if (l > 0.5) { s = dif / (2 - max - min) }
                            else { s = dif / (max + min) }
                            if (max === r) {
                                if (g < b) { h = (g - b) / dif + 6.0 }
                                else { h = (g - b) / dif }
                            } else if (max === g) { h = (b - r) / dif + 2.0 }
                            else { h = (r - g) / dif + 4.0 }
                            h *= 60;
                            s *= 100;
                            l *= 100;
                        }
                        ha = la = sa = 0;
                        r = datB[i] * datB[i] / loged;
                        g = datB[i+1] * datB[i+1] / loged;
                        b = datB[i+2] * datB[i+2] / loged;
                        min = Math.min(r, g, b);
                        max = Math.max(r, g, b);
                        if(min === max){
                            s -= min * 100;
                        } else {
                            dif = max - min;
                            la = (max + min) / 2;
                            if (la > 0.5) { sa = dif / (2 - max - min) }
                            else { sa = dif / (max + min) }
                            if (max === r) {
                                if (g < b) { ha = (g - b) / dif + 6.0 }
                                else { ha = (g - b) / dif }
                            } else if (max === g) { ha = (b - r) / dif + 2.0 }
                            else { ha = (r - g) / dif + 4.0 }
                            ha *= 60;
                            s -= sa * 100;
                            l -= la * 100;
                        }
                        var hh = Math.abs(ha - h);
                        hh = hh > 180 ? 360 - hh : hh;
                        sum  += compHue ? (count ++, hh*hh*gain): 0;
                        sum  += compSat ? (count ++, s*s*gain): 0;
                        sum  += compLum ? (count ++, l*l*gain): 0;

                    }
                    i += 4;
                }
                sum = (sum / count) ** 0.5;
                ctx.imageSmoothingEnabled = true;
                return sum;
            }
            return 0;
        },
        calcImageValueMetric(imgA, mask, rotater = false,info = {}){
            if(imgA.isDrawable) {
                ctx.imageSmoothingEnabled = true;
                if(copyToWorking(imgA)) {
                    var minSize = 5;
                    if (rotater) {
                        minSize = 16;
                    }

                    ctx.imageSmoothingEnabled = true;
                    var mins = Math.min(imgA.width,imgA.height)
                    var w = imgA.width;
                    var h = imgA.height;
                    var w1 = imgA.width;
                    var h1 = imgA.height;

                    while(mins > minSize){
                        ctx.globalCompositeOperation = "lighter";
                        ctx.drawImage(workingCanvas,0, 0, w, h, 0, 0, w, h);
                        ctx.globalCompositeOperation = "copy";
                        mins = mins / 2 | 0;
                        if(mins <= minSize) { w = h = minSize }
                        else {
                            w = w / 2 | 0;
                            h = h / 2 | 0;
                        }
                        ctx.drawImage(workingCanvas,0, 0, w1, h1, 0, 0, w, h);
                        w1 = w;
                        h1 = h;
                    }
                    if(mask) {
                        ctx.globalCompositeOperation = "destination-in";
                        ctx.drawImage(mask,0,0,w,h);
                    }

                    if (rotater) {
                       // ctx.globalCompositeOperation = "destination-in";
                       // ctx.drawImage(circleMask,0,0,w,h);

                    }
                    ctx.globalCompositeOperation = "source-over";
                    var data = ctx.getImageData(0,0,w,h);
                    var dat = data.data;
                    var i,ii = 0, sum = 0, count = 0,c1,c2,c3,c4,s1,s2,s3,s4,val;
                    if (rotater) {
                        let x,y,xx,yy;
                        s1 = s2 = s3 = s4 = c1 = c2 = c3 = c4 = 0;
                        const cx = w / 2;
                        const cy = h / 2;
                        for(y = 0; y < h; y++) {
                            for(x = 0; x < w; x++) {
                                xx = (x - cx) / cx;
                                yy = (y - cy) / cy;
                                if(xx * xx + yy * yy > 0.25) {
                                    i = ii;
                                    val = dat[i + 3] > 0 ? (count ++, dat[i] * dat[i] * dat[i++] + dat[i] * dat[i] * dat[i++] + dat[i] * dat[i] * dat[i++]) : 0;

                                     sum += val;
                                     if(xx < cx) {
                                         if(yy < cy) {s1 += val; c1 ++}
                                         else {s2 += val; c2++}
                                     }else{
                                         if(yy < cy) {s4 += val; c4 ++}
                                         else {s3 += val; c3++}
                                     }
                                }
                                ii += 4;
                            }
                        }
                        info.s1 = (s1 / (c1 * 3)) ** (1/3);
                        info.s2 = (s2 / (c2 * 3)) ** (1/3);
                        info.s3 = (s3 / (c3 * 3)) ** (1/3);
                        info.s4 = (s4 / (c4 * 3)) ** (1/3);
                    }else {
                        while(ii < dat.length) {
                            i = ii;
                            sum += dat[i + 3] > 0 ? (count ++, dat[i] * dat[i] * dat[i++] + dat[i] * dat[i] * dat[i++] + dat[i] * dat[i] * dat[i++]) : 0;
                            ii += 4;
                        }
                    }
                    sum = (sum / (count * 3)) ** (1/3);
                    data = undefined;  // Keep getting out of memory error this is an attempt to stop this happening.
                    dat = undefined;;   // WTF happened to managment?
                }
                //ctx.imageSmoothingEnabled = true;
                return sum;
            }
            return 0;
        },
        calcImageColorMetric(imgA, mask, rotater = false, info = {}){
            if(imgA.isDrawable) {
                ctx.imageSmoothingEnabled = true;
                if(copyToWorking(imgA)) {
                    var minSize = 5;
                    if (rotater) {
                        if (!circleMask) { createCircleMask() }
                        minSize = 16;
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.globalCompositeOperation = "difference";
                    ctx.globalAlpha  = 1;
                    ctx.drawImage(mask,0,0);
                    var mins = Math.min(imgA.width,imgA.height)
                    var w = imgA.width;
                    var h = imgA.height;
                    var w1 = imgA.width;
                    var h1 = imgA.height;

                    while(mins > minSize){
                        ctx.globalCompositeOperation = "lighter";
                        ctx.drawImage(workingCanvas,0, 0, w, h, 0, 0, w, h);
                        ctx.drawImage(workingCanvas,0, 0, w, h, 0, 0, w, h);
                        ctx.globalCompositeOperation = "copy";
                        mins = mins / 2 | 0;
                        if(mins <= minSize) { w = h = minSize }
                        else {
                            w = w / 2 | 0;
                            h = h / 2 | 0;
                        }
                        ctx.drawImage(workingCanvas,0, 0, w1, h1, 0, 0, w, h);
                        w1 = w;
                        h1 = h;
                    }
                    if(mask) {
                        ctx.globalCompositeOperation = "destination-in";
                        ctx.drawImage(mask,0,0,w,h);
                    }
                    if (rotater) {


                    }
                    ctx.globalCompositeOperation = "source-over";
                    var data = ctx.getImageData(0,0,w,h);
                    var dat = data.data;
                    var i,ii = 0, sum = 0, count = 0,r,g,b,c1,c2,c3,c4,s1,s2,s3,s4,val;
                   // 256 * 256 * 256 * 256 * 256 * 256
                    if (rotater) {
                        let x,y,xx,yy;
                        const cx = w / 2;
                        const cy = h / 2;
                        s1 = s2 = s3 = s4 = c1 = c2 = c3 = c4 = 0;

                        for(y = 0; y < h; y++) {
                            for(x = 0; x < w; x++) {
                                xx = (x - cx) / cx;
                                yy = (y - cy) / cy;
                                if(xx * xx + yy * yy > 0.25) {
                                    i = ii;
                                    val = dat[i + 3] > 0 ? (count ++,
                                        (dat[i] * dat[i++] + 1) *
                                        (dat[i] * dat[i++] + 1) *
                                        (dat[i] * dat[i++] + 1)
                                     ) : 0;
                                     sum += val;
                                     if(xx < cx) {
                                         if(yy < cy) {s1 += val; c1 ++}
                                         else {s2 += val; c2++}
                                     }else{
                                         if(yy < cy) {s4 += val; c4 ++}
                                         else {s3 += val; c3++}
                                     }

                                }
                                ii += 4;
                            }
                        }
                        info.s1 = (s1 / (c1 * 3)) ** (1/6);
                        info.s2 = (s2 / (c2 * 3)) ** (1/6);
                        info.s3 = (s3 / (c3 * 3)) ** (1/6);
                        info.s4 = (s4 / (c4 * 3)) ** (1/6);

                    }else {
                        while(ii < dat.length) {
                            i = ii;
                            sum += dat[i + 3] > 0 ? (count ++,
                                (dat[i] * dat[i++] + 1) *
                                (dat[i] * dat[i++] + 1) *
                                (dat[i] * dat[i++] + 1)
                             ) : 0;
                            ii += 4;
                        }
                    }
                    sum = (sum / (count * 3)) ** (1/6);
                    data = undefined;  // Keep getting out of memory error this is an attempt to stop this happening.
                    dat = undefined;;   // WTF happened to managment?
                }
                //ctx.imageSmoothingEnabled = true;
                return sum;
            }
            return 0;
        },
        mapImageToSphere1(img,cX = 0, cY = 0, alias = 4 /*centerY = img.h / 2*/){
            if(img.isDrawable){
                if(copyToWorking(img)){
                    const data = getPixelData8Bit(workingCanvas);
                    const d32 = new Uint32Array(data.data.buffer);
                    const d = data.data;
                    const d32Res = new Uint32Array(d32.length);
                    const dRes = new Uint8ClampedArray(d32Res.buffer);
                    const w = img.w, w2 = w / 2, w1 = w - 1;
                    const h = img.h, h1 = h - 1;
                    const cPX = ((cX + 90) / 180) *  Math.PI;
                    cX = ((cX + 90) / 360) * w;
                    const cPY = (-cY / 180) * Math.PI;
                    const cols = new Float64Array(w * 5)
                    const alias2 = alias * alias;
                    const p3 = {x:0,y:0,z:0,lon:0,lat:0};
                    const mat = [1,0,0,0,Math.cos(cPY),Math.sin(cPY),0,-Math.sin(cPY),Math.cos(cPY)];
                    var x,y,ay,ix,idxs,idxd;
                    const to3D = () => {
                        const out =  Math.sin(p3.lat);
                        p3.x = Math.cos(p3.lon) * out;
                        p3.y = Math.sin(p3.lon) * out;
                        p3.z = Math.cos(p3.lat);
                    }
                    const toLonLat = () => {
                        p3.lon = Math.atan2(p3.y, p3.x) + cPX;
                        p3.lat = Math.acos(p3.z);
                    }
                    const rotateX = () => {
                        var x = p3.x;
                        var y = p3.y;
                        var z = p3.z;
                        p3.x = x;
                        p3.y = y * mat[4] + z * mat[7]
                        p3.z = y * mat[5] + z * mat[8]

                    }

                    const getIdxMecator = (lon, lat) => {
                        return (
                            (w1 - Math.floor(lon * w2 / Math.PI + w) % w) +
                            (h1 - Math.floor(lat * h / Math.PI + h) % h) * w
                        ) * 4;
                    }

                    for(y = 0; y < h; y += 1){
                        for(ay = 0; ay < alias; ay ++){
                            const lat = Math.acos((y + ay / alias) / (h - (1 / alias)) * 2 - 1);

                            const tw = Math.abs( Math.sin(lat) * w2) * 2 * alias;
                            for(x = 0; x < tw; x += 1) {
                                const idx = Math.floor(w2 - tw / alias / 2 + x / alias) * 5;
                                ix = x  / (tw - 1);
                                p3.lon = Math.acos(ix * 2 - 1);
                                p3.lat = lat;
                                to3D();
                                rotateX()
                                toLonLat();

                                idxs =  getIdxMecator(p3.lon , p3.lat);
                                cols[idx + 0] += 1;
                                cols[idx + 1] += d[idxs] * d[idxs++];
                                cols[idx + 2] += d[idxs] * d[idxs++];
                                cols[idx + 3] += d[idxs] * d[idxs++];
                                cols[idx + 4] += d[idxs];
                            }
                        }
                        idxd = 0;
                        for(x = 0; x < w; x += 1) {
                            idxs = (x + y * w) * 4;
                            const count = cols[idxd++];
                            dRes[idxs++] = Math.round((cols[idxd++] / count) ** 0.5);
                            dRes[idxs++] = Math.round((cols[idxd++] / count) ** 0.5);
                            dRes[idxs++] = Math.round((cols[idxd++] / count) ** 0.5);
                            dRes[idxs] = Math.round(cols[idxd++] / count);
                        }
                        cols.fill(0);
                    }
                    d32.set(d32Res);
                    setPixelData(img,data);
                    img.processed = true;
                    img.lastAction = "Sphere";
                    img.update();
                     return true;
                }
            }
        },
        fitToSubSprite(sprite, imgSpr) {
            if (!API.fitToSubSprite.clearBuffer) {
                API.fitToSubSprite.clearBuffer = () => {
                    API.fitToSubSprite.imagedata = undefined;
                    API.fitToSubSprite.imageId = undefined;
                    API.fitToSubSprite.imageH = undefined;
                    API.fitToSubSprite.imageW = undefined;
                    API.fitToSubSprite.timeHdl = undefined;
                    log("Cleared pixel buffer");
                };
            }
            if (imgSpr.type.image && imgSpr.image.isDrawable) {
                const w = imgSpr.image.w;
                const h = imgSpr.image.h;
                var d8, d32;
                if (API.fitToSubSprite.imageId === imgSpr.image.guid && API.fitToSubSprite.imageH === h && API.fitToSubSprite.imageW === w) {
                    clearTimeout(API.fitToSubSprite.timeHdl);
                } else {
                    clearTimeout(API.fitToSubSprite.timeHdl);
                    API.fitToSubSprite.imageId = imgSpr.image.guid;
                    API.fitToSubSprite.imageW = w;
                    API.fitToSubSprite.imageH = h;
                    API.fitToSubSprite.imagedata = imgSpr.image.ctx.getImageData(0, 0, w, h);
                }
                d8 = API.fitToSubSprite.imagedata.data;
                d32 =  new Uint32Array(d8.buffer);
                API.fitToSubSprite.timeHdl = setTimeout(API.fitToSubSprite.clearBuffer, 30000);
                const isLineEmpty = (x, y, dx, dy, l) => {
                    var i = 0
                    while (i < l) {
                        if (d32[x + y * w] !== 0) { return false; }
                        i++;
                        x += dx;
                        y += dy;                        
                    }
                    return true;
                }
                        
                    
                var p1 = utils.point;
                var p2 = utils.point;
                var p3 = utils.point;
                var p4 = utils.point;
                var r1 = utils.point;
                var r2 = utils.point;
                var r3 = utils.point;
                var r4 = utils.point;
                sprite.key.corners(p1, p2, p3, p4);
                imgSpr.key.toLocalPoint(p1);
                imgSpr.key.toLocalPoint(p2);
                imgSpr.key.toLocalPoint(p3);
                imgSpr.key.toLocalPoint(p4);
                p1.x = Math.min(w, Math.max(0, p1.x | 0));
                p2.x = Math.min(w, Math.max(0, p2.x | 0));
                p3.x = Math.min(w, Math.max(0, p3.x | 0));
                p4.x = Math.min(w, Math.max(0, p4.x | 0));
                p1.y = Math.min(h, Math.max(0, p1.y | 0));
                p2.y = Math.min(h, Math.max(0, p2.y | 0));
                p3.y = Math.min(h, Math.max(0, p3.y | 0));
                p4.y = Math.min(h, Math.max(0, p4.y | 0));
                var left = Math.min(p1.x, p2.x, p3.x, p4.x);
                var right = Math.max(p1.x, p2.x, p3.x, p4.x);
                var top = Math.min(p1.y, p2.y, p3.y, p4.y);
                var bot = Math.max(p1.y, p2.y, p3.y, p4.y);
                
                
                var locating = true;
                var cc = 0;
                while (locating && cc++ < 100) {
                    locating = false;
                    const t = top, l = left, r = right, b = bot;
                    if (!isLineEmpty(left, top, 0, 1, bot - top)) {
                        left -= 1;
                        while (left > -1 && !isLineEmpty(left, top, 0, 1, bot - top)) { left -= 1; }
                    } else {                
                        while (left < right && isLineEmpty(left, top, 0, 1, bot - top)) { left += 1; }
                        if (left === right) { log.warn("Empty location"); return; }
                        left -= 1;
                    }
                    
                    if (!isLineEmpty(right, top, 0, 1, bot - top)) {
                        right += 1;
                        while (right < w && !isLineEmpty(right, top, 0, 1, bot - top)) { right += 1; }
                    } else {                 
                        while (left < right && isLineEmpty(right, top, 0, 1, bot - top)) { right -= 1; }
                        if (left === right) { log.warn("Empty location"); return; }   
                        right += 1;
                    }
                    
                    if (!isLineEmpty(left, top, 1, 0, right - left)) {
                        top -= 1;
                        while (top > -1 && !isLineEmpty(left, top, 1, 0, right - left)) { top -= 1; }
                    } else {  
                        while (top < bot && isLineEmpty(left, top, 1, 0, right - left)) { top += 1; }
                        if (top === bot) { log.warn("Empty location"); return; }  
                        top -= 1;    
                    }
                    
                    if (!isLineEmpty(left, bot, 1, 0, right - left)) {
                        bot += 1;
                        while (bot < h && !isLineEmpty(left, bot, 1, 0, right - left)) { bot += 1; }
                    } else {  
                        while (top < bot && isLineEmpty(left, bot, 1, 0, right - left)) { bot -= 1; }
                        if (top === bot) { log.warn("Empty location"); return; }    
                        bot += 1;
                    }
                    if (bot !== b || top !== t || l !== left || r !== right) {
                        locating = true;
                    }
                }
                if (cc === 100) { log.warn("Location did not solve for unknown reason!!!"); return; }
                left += 1;
                top += 1;
                //top -= 1;
                //bot += 1;
                left = Math.max(0, left);
                top = Math.max(0, top);
                bot = Math.min(h, bot);
                right = Math.min(w, right);
                    
                imgSpr.key.toWorldPoint(left, top, r1);    
                imgSpr.key.toWorldPoint(right, top, r2);    
                imgSpr.key.toWorldPoint(right, bot, r3);    
                imgSpr.key.toWorldPoint(left, bot, r4);    
                left  = Math.min(r1.x, r2.x, r3.x, r4.x);
                right = Math.max(r1.x, r2.x, r3.x, r4.x);
                top   = Math.min(r1.y, r2.y, r3.y, r4.y);
                bot   = Math.max(r1.y, r2.y, r3.y, r4.y);
                sprite.x = (left + right) * 0.5;
                sprite.y = (top + bot) * 0.5;
                sprite.w = right - left;
                sprite.h = bot - top;
                sprite.cx = sprite.w * 0.5;
                sprite.cy = sprite.h * 0.5;
                sprite.rx = 0;
                sprite.ry = Math.PI * 0.5;
                sprite.sx = 1;
                sprite.sy = 1;
                sprite.key.update();
                return true;
            }
            
        },
        packSprites(img, {
            locateOnly, markType, spacing = 1,
            boxed = false, save = false, extract = false, addToWorkspace = false,
            fromSprite, evenSize = false, onDone, joiner = false,
            }) {
                // if addToWorkspace true then requies fromSprite
                // if joiner then must have locateOnly = false,  boxed = false, markType !== "sides" && markType !== "box"
            if(img.isDrawable){
                if(copyToWorking(img)){
                    const saveSpriteList = (sprites, img) => {
                        sprites.sort((a,b)=>a.id - b.id);
                        if(save){
                            var str;
                            str = "    \"width\":  " + img.w + ",\n";
                            str = "    \"height\": " + img.h + ",\n";
                            str = "    \"animationCount\": " + 0 + ",\n";
                            str = "    \"sprites\": [\n"
							
                            for(const spr of sprites){
                                str += ("        { \"x\": " + spr.x + ", ").padEnd(22," ");
                                str += ("\"y\": " + spr.y + ", ").padEnd(12," ");
                                str += ("\"w\": " + spr.w + ", ").padEnd(12," ");
                                str += ("\"h\": " + spr.h + ", ").padEnd(12," ");
                                str += "\"cx\": " + 0.5 + ", ";
                                str += "\"cy\": " + 0.5 + ", ";
                                str += "\"id\": " + 0;
                                if(sideMark){
                                    str += ", xo: " + spr.xo + ", ";
                                    str += "yo: " + spr.yo + ", ";
                                    str += "wo: " + spr.wo + ", ";
                                    str += "ho: " + spr.ho;
                                }

                                str +=  "},\n";
                            }
                            str += "];\n";
                            downloadText(str,"SpriteLocations");
                        }
                    }
                    const createSprite = rect => {
                        if(sideMark){
                            return {id : rect.id, x: rect.x, y: rect.y, w: rect.w, h: rect.h, xo: rect.xo, yo: rect.yo, wo: rect.wo, ho: rect.ho };
                        }
                        return {id : rect.id,x: rect.x, y: rect.y, w: rect.w, h: rect.h};
                    }
                    var marked = markType === "box";
                    const sideMark = markType === "sides";
                    const data = getPixelData8Bit(workingCanvas);
                    const d32 = new Uint32Array(data.data.buffer);
                    const joiningPx = d32[0];
                    joiner && (d32[0] = 0);
                    const boxColor = colours.mainColor.css;
                    var sId = 0, maxW = 0, maxH = 0, minH = Infinity, minW = Infinity, warn;
                    const rects = [];
                    const xMarks = [];
                    var pixels = 0, j, i = 0, area = 0, areaSpaced = 0, xx,yy;
                    if(sideMark){
                        const markColor = d32[0];
                        marked = true;
                        for(xx = 0; xx < data.width; xx++){
                            const idx = xx;
                            if(d32[idx] === markColor){
                                d32[idx] = 0;
                                const yPos = [xx];
                                xMarks.push(yPos);
                                for(yy = 0; yy < data.height; yy++){
                                    const idx = xx + yy * data.width;
                                    if(d32[idx] === markColor){
                                        d32[idx] = 0;
                                        yPos.push(yy);
                                    }
                                }
                                yPos.push(data.height);

                            }
                        }
                        xMarks.push([data.width]);

                        if(xMarks.length > 1){
                            for(i = 0; i < xMarks.length-1; i++){
                                const px = xMarks[i][0];
                                const px1 = xMarks[i+1][0];
                                const yMarks = xMarks[i];
                                for(j = 1; j < yMarks.length-1; j++){
                                    let left=Infinity, top = Infinity, right = -1, bottom = -1, empty = true,count = 0;
                                    for(yy = 0; yy < yMarks[j+1] - yMarks[j]; yy++){
                                        for(xx = 0; xx < px1 - px; xx++){
                                            const x = xx + px + 1;
                                            const y = yy + yMarks[j] + 1;
                                            const idx = x + y * data.width;
                                            if(d32[idx] !== 0){
                                                if (x < left) { left = x }
                                                if (x > right) { right = x }
                                                if (y < top) { top = y }
                                                if (y > bottom) { bottom = y }
                                                empty = false;
                                                count ++;
                                            }
                                        }
                                    }
                                    if(!empty){
                                        const rect = {
                                            mLeft : px + 1,
                                            mTop : yMarks[j] + 1,
                                            mBottom : yMarks[j+1],
                                            mRight : px1,
                                            top,left,bottom,right,
                                            id: sId ++,
                                        };
                                        maxW = Math.max(maxW, rect.w = rect.right - rect.left + 1);
                                        maxH = Math.max(maxH, rect.h = rect.bottom - rect.top + 1);
                                        minW = Math.min(minW, rect.w);
                                        minH = Math.min(minH, rect.h);
                                        rect.area = rect.w * rect.h;
                                        rect.areaSpaced = rect.w * rect.h + rect.w + rect.h + 2;
                                        rect.x = rect.left;
                                        rect.y = rect.top;
                                        rect.xo = rect.left - rect.mLeft;
                                        rect.yo = rect.top - rect.mTop;
                                        rect.wo = rect.mRight - rect.mLeft;
                                        rect.ho = rect.mBottom - rect.mTop;
                                        rects.push(rect);
                                        pixels += count;
                                        area += rect.area;
                                        areaSpaced += rect.areaSpaced;

                                    }
                                }
                            }
                        }else {
                            log.warn("Could not complete extraction. Requier marks on top and left");
                            return;
                        }

                    } else {
                        while(i < d32.length) {
                            if(d32[i] !== 0){
                                const x = i % data.width;
                                const y = i / data.width | 0;
                                const rect = ctx.floodFillExtractFromData(x, y, data);
                                if(marked) {
                                    rect.top += 1;
                                    rect.left += 1;
                                    rect.bottom -= 1;
                                    rect.right -= 1;
                                }
                                maxW = Math.max(maxW, rect.w = rect.right - rect.left + 1);
                                maxH = Math.max(maxH, rect.h = rect.bottom - rect.top + 1);
                                minW = Math.min(minW, rect.w);
                                minH = Math.min(minH, rect.h);
                                rect.x = rect.left;
                                rect.y = rect.top;
                                rect.id = sId ++;
                                if(marked) {
                                    for (let y = 0; y < rect.h; y++) {
                                        for (let x = 0; x < rect.w; x++) {
                                            d32[rect.x + x + (rect.y + y) * data.width] = 0;
                                        }
                                    }
                                }

                                rect.area = boxed ?  (rect.w + 4) * (rect.h + 4)  : rect.w * rect.h;
                                rect.areaSpaced = boxed ? (rect.w + 4) * (rect.h + 4) + rect.w + 4 + rect.h + 4 + 2 : rect.w * rect.h + rect.w + rect.h + 2;
                                rect.x = rect.left;
                                rect.y = rect.top;
                                rect.px = x;
                                rect.py = y;
                                if(rect.area > 0 || marked){
                                    rects.push(rect);
                                    pixels += rect.pixelsFilled;
                                    area += rect.area;
                                    areaSpaced += rect.areaSpaced;
                                    rect.imgData = undefined;
                                }else{
                                    warn = "Found very small sprite that will not be included";
                                }
                            }
                            i++;
                        }
                    }

					if(!boxed) {
						var iy;
						const isYNotClear = y => rects.some(rect => rect.top <= y && rect.bottom >= y);
						const rows = [-1];
						for(iy = 0; iy <= img.h; iy ++){
							if (! isYNotClear(iy)) {
								if (iy === rows[rows.length - 1] + 1) {
									rows[rows.length - 1] = iy;
								} else {
									rows[rows.length] = iy;
								}
							}

						}
						const rowRects = [];
						for(iy = 0; iy < rows.length; iy ++){
							rowRects.push(rects.filter(rect => rect.bottom < rows[iy] && rect.top > rows[iy - 1]).sort((a,b)=> a.left - b.left));
						}
						sId = 0;
						rects.length = 0;
						rowRects.forEach(row => {
							row.forEach(rect => {
								rect.id = sId ++;
								rects.push(rect);
							})
						});

					}

                    log("Found " + rects.length + " sprites.");
                    if(warn) { log.warn(warn) }
                    rects.sort((a,b)=> {
                        if(a.area === b.area) { return b.w - a.w };
                        return b.area - a.area;
                    })

					;

                    var boxes;
                    const createBoxer = (width, height) => new BoxArea({
                            x: 0,  // x,y,width height of area
                            y: 0,
                            width: width + spacing * 2,
                            height : height + spacing * 2,
                            space : spacing, // optional default = 1 sets the spacing between boxes
                            minW : 1, // optional default = 0 sets the in width of expected box. Note this is for optimisation you can add smaller but it may fail
                            minH : 1, // optional default = 0 sets the in height of expected box. Note this is for optimisation you can add smaller but it may fail
                        });
                    var h = Math.max(maxH, (areaSpaced / img.w | 0) + spacing);
                    var w = img.w;
                    if(w * h > areaSpaced) {
                        w = maxW;
                    }
                    //var fitting = true;
                    var iterations = 0, lCount;

                    const fittingBoxes = () => {
						var sName = img.desc.name;
                        //fitting = false;
                        var bCount = 0, resizing = true;
                        while (resizing) {
                            resizing = false;
                            bCount = 0;
                            boxes = createBoxer(w,h);
                            for(const rect of rects){
                                if(!boxes.fitBox(rect)){
                                    if(w < img.w || iterations < 1280){
                                        //fitting = true;
                                        w += w < img.w ? minW : 0;
                                        h += w < img.w ? 0 : 1;
                                        iterations +=  1;
                                        if (bCount !== lCount) {
                                            setTimeout(()=>extraRenders.addOneTime(fittingBoxes),4);
                                            break;
                                        } else {
                                            resizing = true;
                                        }
                                    }else{
                                        log.warn("Could not fit boxes");
                                    }
                                    break
                                } else {
                                    bCount ++
                                }
                            }

                        }
                        lCount = bCount;
                        if (bCount < rects.length) {
                            img.ctx.globalAlpha = 1;
                            img.ctx.globalCompositeOperation = "source-over";
                            img.ctx.clearRect(0,0,img.w,img.h);
                            const sx = img.w / w;
                            const sy = img.h / h;
                            img.ctx.fillStyle = "black";
                            img.processed = true;
                            for(const box of boxes.boxes){
                                img.ctx.fillRect((box.x - spacing) * sx ,(box.y - spacing) * sy, box.w * sx, box.h * sy);
                            }
                        }else {
							const addedSprites = [];
                            let {w,h} = boxes.size();
                            w -= spacing;
                            h -= spacing;
							h += Math.ceil((boxes.boxes.length * 4 + 4) / w)+ 1;
                            media.create({ width : w, height : h, type : "canvas" , name : NAMES.register("packedSprites")},
                                canvas => {
                                    const spritesArr = [];
                                    const rect = {};
                                    const mir = img.desc.mirror;
                                    const mctx = mir.ctx;
                                    if(marked) {
                                        for(const box of boxes.boxes){
                                            canvas.ctx.drawImage(mir,box.left, box.top, box.w, box.h, box.x-spacing, box.y-spacing, box.w, box.h);
                                            box.x -= spacing;
                                            box.y -= spacing;
                                            spritesArr.push(createSprite(box));
                                        }
									} else if (boxed) {
                                        for(const box of boxes.boxes){
											box.x += 2;
											box.y += 2;
											box.w -= 4;
											box.h -= 4;
                                            ctx.floodFillKeep(box.px - box.left, box.py - box.top, mctx.getImageData(box.left, box.top, box.w, box.h), rect);
                                            canvas.ctx.putImageData(rect.imgData, box.x-1, box.y-1);
											box.bot =  box.top + box.h;
											box.rt =  box.left + box.w;
                                            box.x -= spacing + 2;
                                            box.y -= spacing + 2;
                                            box.w += 4;
                                            box.h += 4;

											canvas.ctx.fillStyle = boxColor;
											canvas.ctx.beginPath();
											canvas.ctx.rect(box.x, box.y, box.w, box.h);
											canvas.ctx.rect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
											canvas.ctx.fill("evenodd");


                                        }

										const rows = [];
                                        for(const box of boxes.boxes){
											let foundRow = false;
											for (const row of rows) {
												if (box.top > row.bot || box.bot < row.top) {

												} else {
													foundRow = true;
													row.boxes.push(box);
													row.top = Math.min(row.top, box.top);
													row.bot = Math.max(row.bot, box.bot);
													break;
												}
											}
											if (!foundRow) {
												rows.push({
													bot: box.bot,
													top: box.top,
													boxes: [box],
												});
											}
										}
										log("Found " + rows.length + " sprite rows");
										rows.sort((a,b) => a.top - b.top);
										for (const row of rows) {
											row.boxes.sort((a,b) => {
												if (a.left >  b.rt) { return 1 }
												if (a.rt <  b.left) { return -1 }
												return a.top - b.top;
											});
											log("Row: " + row.top + "px to " + row.bot + "px has " + row.boxes.length + " sprites");
										}
										for (const row of rows) {
											for(const b of row.boxes) {
												spritesArr.push(createSprite(b));

											}
										}





                                    }else{
                                        for(const box of boxes.boxes){
                                            ctx.floodFillKeep(box.px - box.left, box.py - box.top, mctx.getImageData(box.left, box.top, box.w, box.h), rect);
                                            if (joiner && joiningPx) {
                                                const dd32 = new Uint32Array(rect.imgData.data.buffer);
                                                let i = dd32.length;
                                                while (i--) { dd32[i] === joiningPx && (dd32[i] = 0) }
                                            }
                                            canvas.ctx.putImageData(rect.imgData, box.x - spacing, box.y - spacing);
                                            box.x -= spacing;
                                            box.y -= spacing;
                                            spritesArr.push(createSprite(box));
                                        }
                                    }
									canvas.desc.sprites = spritesArr;
                                    canvas.desc.subSprCount = spritesArr.length;

                                    saveSpriteList(spritesArr, canvas);
                                    canvas.update();

									if(addToWorkspace) {
										let idx = 0;
										for(const spr of spritesArr) {
											const topLeft = fromSprite.key.toWorldPoint(spr.x, spr.y);
											const botRight = fromSprite.key.toWorldPoint(spr.x + spr.w , spr.y + spr.h);
											var spr1 = new Sprite((topLeft.x + botRight.x) / 2 , (topLeft.y + botRight.y) / 2, spr.w, spr.h);
											spr1.changeImage(canvas);
											spr1.changeToSubSprite(idx);
											spr1.sx = fromSprite.sx;
											spr1.sy = fromSprite.sy;
											spr1.rx = fromSprite.rx;
											spr1.ry = fromSprite.ry;
											spr1.key.update();
											sprites.add(spr1);
											addedSprites.push(spr1);
											idx++;
										}
									} else {
                                        var spr1 = new Sprite(...utils.viewCenter, canvas.w, canvas.h);
                                        spr1.changeImage(canvas);
                                        spr1.key.update();
                                        sprites.add(spr1);
                                        addedSprites.push(spr1);
                                    }

                                    log("Completed in "+iterations+ " iterations.")
                                    log("Fitting to " + w + " by " + h + " image.");
                                    log("Efficency of " + (((w * h) / areaSpaced)*100).toFixed(2) + "%.");
                                }
                            )
                            if(img.processed){
                                img.restore();
                            }
							onDone && onDone(addedSprites);
                            setTimeout(()=>{issueCommand(commands.edSprUpdateUI)},100);
                        }
                    }
                    if(! locateOnly) {
						if (boxed) {
							for(const rect of rects){
								rect.x -= 2;
								rect.y -= 2;
								rect.w += 4;
								rect.h += 4;
							}
						}

                        extraRenders.addOneTime(fittingBoxes);
                    } else {
						const spritesArr = [];
                        for (const rect of rects) {
                            if(evenSize) {
                                if(rect.w % 2) { rect.w += 1}
                                if(rect.h % 2) { rect.h += 1}
                            }
                            spritesArr.push(createSprite(rect))
                        }
                        img.addSubSprites(spritesArr);

                        if(extract || addToWorkspace) {
                            var sName = img.desc.name;
							var idx = 0;
                            const sp = spacing * 2;
                            const addedSprites = [];
                            for(const rect of img.desc.sprites){
								if(addToWorkspace) {
									const topLeft = fromSprite.key.toWorldPoint(rect.x - spacing, rect.y - spacing);
									const botRight = fromSprite.key.toWorldPoint(rect.x + rect.w + sp, rect.y + rect.h + sp);
									var spr = new Sprite((topLeft.x + botRight.x) / 2 , (topLeft.y + botRight.y) / 2, rect.w + sp, rect.h + sp);
									spr.changeImage(img);
									spr.changeToSubSprite(idx);
									spr.sx = fromSprite.sx;
									spr.sy = fromSprite.sy;
									spr.rx = fromSprite.rx;
									spr.ry = fromSprite.ry;
									spr.key.update();
									sprites.add(spr);
									addedSprites.push(spr);
                                    idx++;
								}
                            }
                            saveSpriteList(spritesArr, img);
                            onDone && onDone(addedSprites);
                            //if (addToWorkspace) { return addedSprites }
                            setTimeout(()=>{issueCommand(commands.edSprUpdateUI)},100);
                            log("Completed sprite extract");
                            return;

                        }

                        saveSpriteList(spritesArr, img);
                        onDone && onDone([]);
                        setTimeout(()=>{issueCommand(commands.edSprUpdateUI)},100);
                        log("Completed sprite extract");
                    }
                    return true;
                }
            }
        },
        addGridNumberOverlay(img, xSteps, ySteps) {
			if (img.isDrawable) {
				if(colours.alpha === 0) {
					log.warn("Did not add overlay as main alpha is set to 0!");
					return;


				}
				var w = img.w;
				var h = img.h;
				var sw = w / xSteps | 0;
				var sh = h / ySteps | 0;
				var x, y;
				var idx = 0;
				img.ctx.save();
				img.ctx.setTransform(1,0,0,1,0,0);
				img.ctx.filter = "none";
				img.ctx.shadowColor ="rgba(0,0,0,0)";
				img.ctx.globalCompositeOperation = "source-over";
				img.ctx.font = 12 + "px " + settings.displayFont;
				img.ctx.textAlign = "left";
				img.ctx.textBaseline = "hanging";
				img.ctx.lineWidth = 2;
				img.ctx.strokeStyle = colours.mainColor.css;
				img.ctx.fillStyle = colours.secondColor.css;
				img.ctx.globalAlpha = colours.alpha;


				for(y = 0; y < ySteps; y++) {
					for(x = 0; x < xSteps; x++) {
						const xx = x * sw + 2;
						const yy = y * sh + 2;
						img.ctx.strokeText(""+idx, xx, yy);
						img.ctx.strokeText(""+idx, xx, yy);
						img.ctx.fillText(""+idx, xx, yy);


						idx ++;
					}
				}
				img.ctx.restore();
                img.processed = true;
                img.lastAction = "Grid # overlay";
                img.update();

            }
        },
		extractGridSprites(img, xSteps, ySteps, fromSprite, addToWorkspace = fromSprite !== undefined, dontAddEmpty = false, addUnique = false ) {

            var w = img.w;
            var h = img.h;
            var sw = w / xSteps | 0;
            var sh = h / ySteps | 0;
            var x, y;
			var createMedia = false;
            var sName = img.desc.name;
            var idx = 0;
			var data, d32;
			if (dontAddEmpty || addUnique) {
				if (copyToWorking(img, false)) {
					data = getPixelData8Bit(workingCanvas);
					d32 = new Uint32Array(data.data.buffer);
				} else {
					log.warn("Working canvas is currently locked, can not check if grid tiles are empty or unique");
					dontAddEmpty = false;
				}				
			}
			const isEmpty = (x, y, w, h) => {
				var i, j, idx;
				for (j = y; j < y + h; j++) {
					idx = j * img.w;
					for (i = x; i < x + w; i++) {
						if (d32[idx + i] !== 0) {
							return false;
						}
					}
				}
				return true;
			}
			const isUnique = (x, y, w, h, tileIdx) => {
				var i, j, xx, yy, k = 0, idx, unique = true, same;
				const px = new Uint32Array(w * h);;
				for (j = y; j < y + h; j++) {
					idx = j * img.w;
					for (i = x; i < x + w; i++) {
						px[k++] = d32[idx + i];
					}
				}
				done: for(yy = 0; yy < ySteps; yy++) {
					for(xx = 0; xx < xSteps; xx++) {
						const xi = xx * sw;
						const yi = yy * sh;
						const tIdx = xx + yy * xSteps;
						if (tIdx >= tileIdx) { break done }
						k = 0;
						same = true
						different: for (j = 0; j < h; j++) {
							idx = (yi + j) * img.w;
							for (i = 0; i < w; i++) {
								if (d32[idx + i + xi] !== px[k++]) {
									same = false;
									break different;
								}
							}
						}
						if (same) { return false; }
					}
				}
				return true;
			}			
            const addedSprites = [];
			//img.encodeSubSprites([{id:0, x:0, y: 0, w: sw, h: sh}],subSpriteGridHeader)
			img.desc.sprites = [{id:0, x:0, y: 0, w: sw, h: sh}];
			img.desc.gridSubSprites = true;
            for(y = 0; y < ySteps; y++) {
                for(x = 0; x < xSteps; x++) {
                    const xx = x * sw;
                    const yy = y * sh;
					if (createMedia) {
						media.create({width: sw, height: sh,type: "canvas", name: sName + "_Spr" + idx}, can => {
							can.ctx.drawImage(img, xx, yy, sw, sh, 0, 0, sw, sh);
							can.processed = true;
							can.update();
							if(addToWorkspace) {
								const topLeft = fromSprite.key.toWorldPoint(xx, yy);
								const botRight = fromSprite.key.toWorldPoint(xx + sw, yy + sh);
								var spr = new Sprite((topLeft.x + botRight.x) / 2 , (topLeft.y + botRight.y) / 2, can.w, can.h);
								spr.changeImage(can);
								spr.sx = fromSprite.sx;
								spr.sy = fromSprite.sy;
								spr.rx = fromSprite.rx;
								spr.ry = fromSprite.ry;
								spr.key.update();
								sprites.add(spr);
								addedSprites.push(spr);
							}
						});
					} else {
						if(addToWorkspace) {
							let addIt = true;
							dontAddEmpty && isEmpty(xx, yy, sw, sh) && (addIt = false);
							addIt && addUnique && !isUnique(xx, yy, sw, sh, idx) && (addIt = false);
							if (addIt) {
								const topLeft = fromSprite.key.toWorldPoint(xx, yy);
								const botRight = fromSprite.key.toWorldPoint(xx + sw, yy + sh);
								var spr = new Sprite((topLeft.x + botRight.x) / 2 , (topLeft.y + botRight.y) / 2, sw, sh);
								spr.changeImage(img);
								spr.changeToSubSprite(idx);
								spr.sx = fromSprite.sx;
								spr.sy = fromSprite.sy;
								spr.rx = fromSprite.rx;
								spr.ry = fromSprite.ry;
								spr.key.update();
								sprites.add(spr);
								addedSprites.push(spr);
							}
						}


					}
                    idx ++;
                }
            }

            return addedSprites;
        },
        normalMap(img, type = "detailed") {
            if(img.isDrawable){

                var w = img.w;
                var h = img.h;
				var w4 = w * 4;
                const data = getPixelData8Bit(img);
                const d = data.data;
				const buf = new Uint8Array(w * h);
                var i = 0, j = 0;
                while (i < d.length) {
					const r = d[i];
					const g = d[i+1];
					const b = d[i+2];
					buf[j++] = Math.max(r,g,b);
					i += 4;
				}
				var x, y, xx, yy, zz, xx1, yy1, zz1, xx2, yy2, zz2, dist;
				i = 0;
				if(type === "HSL") {
					const hsl = {h:0,s:0,l:0};
					for(y = 0; y < h; y ++){
						for(x = 0; x < w; x ++){
							utils.RGBToHSL(d[i], d[i+1], d[i+2], hsl);
							if(hsl.l >= 80 || hsl.l <= 20) {
								d[i++] = 128;
								d[i++] = 128;
								d[i++] = 255;
								i++;


							} else {
								const dir = (hsl.h / 240) * Math.PI * 2 +  Math.PI * 1.5;
								var slope = ((hsl.l < 20 ? 20 : hsl.l > 80 ? 80 : hsl.l) - 50) / 30;
								slope = (slope * slope) * Math.sign(slope) * Math.PI + Math.PI / 2 ;

								const zz = Math.cos(slope);
								const xx = Math.cos(dir) * Math.sin(slope);
								const yy = -Math.sin(dir) * Math.sin(slope);
								const dist = (xx * xx + yy * yy + zz * zz) ** 0.5;
								d[i++] = ((xx / dist) + 1.0) * 128;
								d[i++] = ((yy / dist) + 1.0) * 128;
								d[i++] = 255  - ((zz / dist) + 1.0) * 128;
								i++;
							}
						}
					}
				}else{
					for(y = 0; y < h; y ++){
						for(x = 0; x < w; x ++){
							const idx = x + y * w;
							const x1 = 1;
							const z1 = buf[idx - 1] === undefined ? 0 : buf[idx - 1] - buf[idx];
							const y1 = 0;
							const x2 = 0;
							const z2 = buf[idx - w] === undefined ? 0 : buf[idx - w] - buf[idx];
							const y2 = -1;
							const x3 = 1;
							const z3 = buf[idx - w - 1] === undefined ? 0 : buf[idx - w - 1] - buf[idx];
							const y3 = -1;


							xx = y3 * z2 - z3 * y2
							yy = z3 * x2 - x3 * z2
							zz = x3 * y2 - y3 * x2
							dist = (xx * xx + yy * yy + zz * zz) ** 0.5;
							xx /= dist;
							yy /= dist;
							zz /= dist;

							xx1 = y1 * z3 - z1 * y3
							yy1 = z1 * x3 - x1 * z3
							zz1 = x1 * y3 - y1 * x3
							dist = (xx1 * xx1 + yy1 * yy1 + zz1 * zz1) ** 0.5;

							xx += xx1 / dist;
							yy += yy1 / dist;
							zz += zz1 / dist;

							if (type !== "detailed") {
								const x1 = 2;
								const z1 = buf[idx - 2] === undefined ? 0 : buf[idx - 2] - buf[idx];
								const y1 = 0;
								const x2 = 0;
								const z2 = buf[idx - w * 2] === undefined ? 0 : buf[idx - w * 2] - buf[idx];
								const y2 = -2;
								const x3 = 2;
								const z3 = buf[idx - w * 2 - 2] === undefined ? 0 : buf[idx - w * 2 - 2] - buf[idx];
								const y3 = -2;
								xx2 = y3 * z2 - z3 * y2
								yy2 = z3 * x2 - x3 * z2
								zz2 = x3 * y2 - y3 * x2
								dist = (xx2 * xx2 + yy2 * yy2 + zz2 * zz2) ** 0.5 * 2;
								xx2 /= dist;
								yy2 /= dist;
								zz2 /= dist;

								xx1 = y1 * z3 - z1 * y3
								yy1 = z1 * x3 - x1 * z3
								zz1 = x1 * y3 - y1 * x3
								dist = (xx1 * xx1 + yy1 * yy1 + zz1 * zz1) ** 0.5 * 2;

								xx2 += xx1 / dist;
								yy2 += yy1 / dist;
								zz2 += zz1 / dist;

								xx += xx2;
								yy += yy2;
								zz += zz2;

							}
							dist = (xx * xx + yy * yy + zz * zz) ** 0.5;

							d[i++] = ((xx / dist) + 1.0) * 128;
							d[i++] = ((yy / dist) + 1.0) * 128;
							d[i++] = 255  - ((zz / dist) + 1.0) * 128;

							i++;
						}
					}
				}


                setPixelData(img,data);
                img.processed = true;
                img.lastAction = "NormalMap";
                img.update();
                return true;


            }

        },
		greenScreen(img) {
            if(img.isDrawable){
                const A = 1;
                const B = 3;
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const d = data.data;
                var i = 0;
                const pL = 255 * 255;
                while (i < d.length) {
                    const r = (d[i] * d[i]) / pL;
                    const g = (d[i + 1] * d[i + 1]) / pL;
                    const b = (d[i + 2] * d[i + 2]) / pL;
                    const a = d[i + 3];
                    const mix = Math.sqrt(Math.max(A * (1 + r + b) - B * g,0));
                    d[i + 3] = mix * a;
                    d[i + 1] = Math.sqrt((g * mix * pL) + ((1- mix) * Math.min(g, b)) * pL);
                    i += 4;
                }
                setPixelData(img,data);
                img.processed = true;
                img.lastAction = "Green screen";
                img.update();
                return true;
            }
        },
		shadeProfile(spr) {
            if (spr.image.isDrawable) {
                const lights = [];
                const shaded = [];
                if (spr.attachers) {
                    for (const aSpr of spr.attachers.values()) {
                        if (aSpr.type.cutter) {
                            lights.push(aSpr);
                        } else if (aSpr.type.image && aSpr.image.isDrawable) {
                            shaded.push(aSpr);
                        }
                    }
                }
                if (lights.length === 0) {
                    log.warning("Could not shade image without attached lights\n(A light is a cutter linked to the image.)");
                    return;
                }
                if (shaded.length === 0) {
                    log.warning("Could not shade image without attached drawable image sprite");
                    return;
                }
                function heightAt(x) {
                    var y = 0;
                    while (y < h && d32[x + y * w] === 0) { y++ }
                    return y;
                    
                }
                const heights = [];
                var w = spr.image.w;
                var h = spr.image.h;
				var w4 = w * 4;
                const data = getPixelData8Bit(spr.image);
                const d8 = data.data;
                const d32 = new Uint32Array(d8.buffer);
                var x = 0, y;
                while (x < w) {
                    const hh = heightAt(x);
                    heights.push({
                        x,
                        h: hh,
                        slope: 0.0,
                        col: (() => hh < h ? d32[x + hh * w] : 0 )(),
                    });
                    x += 1;
                }
                x = 0;
                const sW = 12;
                var rx, ry, prx = 1, pry = 0;
                //debugger
                while (x < heights.length) {
                    const hAt = heights[x];
                    rx = prx;
                    ry = pry;
                    let i = 1;
                    while (i < sW && x + i < heights.length) {
                        const rhAt = heights[x + i];
                        if (rhAt.col !== hAt.col) {
                            prx = 1;
                            pry = 0;                            
                            break;
                        } else if (rhAt.col === hAt.col && rhAt.h !== hAt.h) {
                            const rrx = i;
                            const rry = (rhAt.h - hAt.h);
                            const rrd = (rrx * rrx + rry * rry) ** 0.5;
                            prx = rrx / rrd;
                            pry = rry / rrd;
                            rx = prx;
                            ry = pry;
                            //i++;
                            break;
                        } else { i++; }
                    }
                    const rd = (rx * rx + ry * ry) ** 0.5;
                    hAt.rx = rx / rd;
                    hAt.ry = ry / rd;
                    if (i > 1) {
                        i--;
                        x++;
                        while (i -- > 0) {
                            const at = heights[x++];
                            at.rx = hAt.rx;
                            at.ry = hAt.ry;
                        }
                    } else {
                        x ++;
                    }
                }
                i = 0;
                while (i < lights.length) {
                    const lSpr = lights[i];
                    const x = lSpr.key.x - spr.key.x;
                    const y = lSpr.key.y - spr.key.y;
                    const d = (x * x + y * y) ** 0.5;
                    const col = {r: lSpr.rgb.r / 255, g: lSpr.rgb.g  / 255,  b: lSpr.rgb.b  / 255}; 
                    lights[i] = {
                        col,
                        x: x / d,
                        y: y / d,
                        //spr: lSpr,
                    };
                    i++;
                }
                for (const sSpr of shaded) {
                    x = 0;
                    const sImgDat = sSpr.image.ctx.getImageData(0, 0, sSpr.image.w, sSpr.image.h);
                    const sD32 = new Uint32Array(sImgDat.data.buffer);
                    const W = sSpr.image.w;
                    while (x < W) {
                        y = 0;
                        const hAt = heights[x];
                        //const lxs = hAt.lx;
                        //const lys = hAt.ly;
                        const rxs = hAt.rx;
                        const rys = hAt.ry;                        
                        
                        var rr = 0, gg = 0, bb = 0;
                        i = 0;
                        while (i < lights.length) {
                            const l = lights[i];
                            //const vl = Math.cos(Math.PI * 0.5 - Math.asin(Math.abs(l.x * lys - l.y * lxs)));
                            const v = Math.cos(Math.PI * 0.5 - Math.asin(Math.max(0, l.x * rys - l.y * rxs)));
                            //const v = (vl + vr) * 0.5
                            rr += l.col.r * v;
                            gg += l.col.g * v;
                            bb += l.col.b * v;                            
                            i++;
                        }
                        rr = (Math.min(1, Math.max(0, rr)) * 255) & 0xFF;
                        gg = ((Math.min(1, Math.max(0, gg)) * 255) & 0xFF) << 8;
                        bb = ((Math.min(1, Math.max(0, bb)) * 255) & 0xFF) << 16;
                        const c = 0xFF000000 + rr + gg + bb;
                        y = 0;
                        if (hAt) {

                            while (y < sSpr.image.h) {
                                sD32[x + y * W] = c;
                                y++;
                            }
                        }
                        x++;
                    }
                    sSpr.image.ctx.putImageData(sImgDat, 0, 0);
                    sSpr.image.processed = true;
                    sSpr.image.lastAction = "Shader profile";
                    sSpr.image.update();                    
                }
                
                
                return true;
            }
            log.warning("Could not shade image that is not drawable.");
            
        },
        RGB2HSL(img) {
            if(img.isDrawable){
                const A = 1;
                const B = 3;
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const hsl = {h:0,s:0,l:0};
                const d = data.data;
                var i = 0;
                const pL = 255 * 255;
                while (i < d.length) {
                    RGBToHSLQuick(d[i], d[i + 1], d[i + 2], hsl)
                    d[i++] = hsl.h;
                    d[i++] = hsl.s;
                    d[i++] = hsl.l;
                    i += 1;
                }
                setPixelData(img,data);
                img.processed = true;
                img.lastAction = "RGB2HSL";
                img.update();
                return true;
            }
        },
        ISO: {},
        createISOView(spr) {
            if (!spr) { log.warn("No sprite selected."); return false; }
            if (spr.type.image && spr.image.isDrawable) {
                if (!API.ISO.plan) { log.warn("ISO plan not defined."); return false; }
                if (!API.ISO.view) { log.warn("ISO view not defined."); return false; }
                if (API.ISO.addedSpr === undefined) {
                    API.ISO.addedSpr = [];
                }
                const plan = API.ISO.plan;
                const pD8 = plan.data.data;
                const view = API.ISO.view;
                const vD8 = view.data.data;
                const pxData =  getPixelData8Bit(spr.image).data;
                const cords = [];
                var cCount;
                const findCoords = (x, y, z) => {
                    var i = 0;
                    cCount = 0;
                    while (i < vD8.length) {
                        if (vD8[i + 3] > 0) {
                            if (Math.abs(vD8[i] - x) < 2) {
                                if (Math.abs(vD8[i + 1] - y) < 2) {
                                    if (Math.abs(vD8[i + 2] - z) < 2) {
                                        cords[cCount++] = i;
                                        
                                    }
                                }
                            }
                        }
                        i += 4;
                    }
                    
                }
                media.createImage(view.w, view.h, "testView", can => {
                    const imgData =  getPixelData8Bit(can);
                    const pxD8 =  imgData.data;
                    pxD8.fill(0);
                    var x,y,xx,yy,zz,lx,ly, px, py, idx, aa;
                    const hh = spr.h * spr.sy, h2 = spr.cy;
                    const ww = spr.w * spr.sx, w2 = spr.cx;
                    x = 0;
                    y = 0;
                    const pw = utils.point;
                    while (y < hh) {
                        x = 0;
                        while (x < ww) {
                            spr.key.toWorldPoint(x / spr.sx , y / spr.sy, pw);
                            spr.key.toLocal(pw.x, pw.y);
                            px = spr.key.lx | 0;
                            py = spr.key.ly | 0;
                            if (px >= 0 && px < spr.image.w && py >= 0 && py < spr.image.h) {
                                plan.spr.key.toLocal(pw.x, pw.y);
                                lx = plan.spr.key.lx | 0;
                                ly = plan.spr.key.ly | 0;
                                if (lx >= 0 && lx < plan.w && ly >= 0 && ly < plan.h) {
                                    idx = (lx + ly * plan.w) * 4;
                                    aa = pD8[idx + 3];
                                    if (aa > 0) {
                                        xx = pD8[idx];
                                        yy = pD8[idx + 1];
                                        zz = pD8[idx + 2];
                                        findCoords(xx, yy, zz);
                                        while (cCount-- > 0) {
                                            const idx1 = (px + py * spr.image.w) * 4;
                                            const idx2 = cords[cCount];
                                            pxD8[idx2    ] = pxData[idx1    ];
                                            pxD8[idx2 + 1] = pxData[idx1 + 1];
                                            pxD8[idx2 + 2] = pxData[idx1 + 2];
                                            pxD8[idx2 + 3] = pxData[idx1 + 3];
                         
                                        }
                                    }
                                }
                            }
                            x++;
                        }
                        y++;
                    }
                    setPixelData(can, imgData);
                    can.processed = true;
                    can.lastAction = "ISOView";
                    can.update();
                    
					var nSpr = new Sprite(API.ISO.view.spr.x , API.ISO.view.spr.y, API.ISO.view.spr.w, API.ISO.view.spr.h);
					nSpr.changeImage(can);
                    sprites.add(nSpr);
					API.ISO.addedSpr.push(nSpr);
                    
                });
                
            } else {
                log.warn("Selected sprite must be drawable image.");
                return false;
            }
        },
        defineISOView(img) {
            if(img.isDrawable){
                API.ISO.view = {
                    w: img.w,
                    h: img.h,
                    data: getPixelData8Bit(img),
                }
                return true;
            }
        },
        defineISOPlan(img) {
            if(img.isDrawable){
                API.ISO.plan = {
                    w: img.w,
                    h: img.h,
                    data: getPixelData8Bit(img),
                }
                return true;
            }
        },
        spacedImages(spr1, spr2, rotate, scaleMin, scaleMax = scaleMin, fails, scan) {
            var w, h, w2, h2, x, y, sx, sy, r, failCount = 0, ser = 0, subFails = 0, pxOffX, pxOffY, nextSub, nextRow;
            const s1 = spr1.image.w * spr1.image.h;
            const s2 = spr2.image.w * spr2.image.h;
            const spr = s1 >= s2 ? spr1 : spr2;
            const mask = s1 >= s2 ? spr2 : spr1;

            const W = spr.w;
            const H = spr.h;
            const ps = API.imgPackScan;

            if (spr.attachers) {
                nextSub = true;
                const subTrys = Math.min(mask.image.w, fails);
                const subs = [];
                while (failCount < fails) {
                    subs.length === 0 && subs.push(...spr.attachers.values(), ...spr.attachers.values(), ...spr.attachers.values());

                    const sub = $randPick(subs);
                    if (sub.type.image) {
                        const scale = Math.randR(scaleMin, scaleMax);
                        sx = scale * sub.sx;
                        sy = scale * sub.sy;
                        w2 = (w = sub.w * sx) / 2;
                        h2 = (h = sub.h * sy) / 2;
                        pxOffX = sx === 1 && w % 2 ? 0.5 : 0;
                        pxOffY = sy === 1 && h % 2 ? 0.5 : 0;
                        const dia = (w * w + h * h) ** 0.5 * 0.5;
                        if ((rotate && dia < W && dia < H) || (!rotate && w < W && h < H)) {
                            const left = rotate ? dia : w / 2;
                            const top = rotate ? dia : h / 2;
                            const right = rotate ? W - dia : W - w / 2;
                            const bottom = rotate ? H - dia : H - h / 2;
                            r = rotate ? Math.rand(Math.TAU) : sub.rx;
                            if (scan) {
                                if (ps.fromTopLeft) {
                                    ps.fromTopLeft = false;
                                    ps.x = 0;
                                    ps.y = 0;
                                    ps.rowMinY = Infinity;
                                    ps.height = top;
                                } else if (nextSub) {
                                    nextSub = false;
                                }
                                const offX = Math.abs(Math.cos(r) * w2) + Math.abs(Math.sin(r) * w2);
                                const offY = Math.abs(Math.cos(r + Math.PI90) * h2) + Math.abs(Math.sin(r + Math.PI90) * h2);

                                x = ps.x | 0;
                                y = ps.y | 0;

                                nextRow = false;
                                let found;
                                while ((found = API.addToImage(false, true, spr.image, mask.image, sub, x + pxOffX + offX, y + pxOffY + offY, sx, r, sy)) === false) {
                                    subFails += 1;
                                    x += 1;
                                    if (x + pxOffX + offX * 2 >= right) {

                                        x = 0;
                                        y += 1;//ps.rowMinY !== Infinity ? ps.rowMinY : 1 ;
                                        nextRow = true;
                                        ps.rowMinY = Infinity;
                                        if (y >= bottom) {
                                            ps.pastBottom = true;
                                            ps.fromTopLeft = true;
                                            failCount = fails;
                                            subFails = 0;
                                            break;
                                        }
                                    }
                                    x |= 0;
                                    y |= 0;
                                    if (subFails >= subTrys) {
                                        failCount += subFails;
                                        subFails = 0;
                                        ps.x = x + (nextRow ? 0 : 1);
                                       // ps.y = nextRow ? ps.y + 1 : ps.y;
                                        ps.y = y;//nextRow ? y  : ps.y;
                                        nextSub = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    ps.x = x + offX ;
                                    if (ps.x >= right) {
                                        ps.x = 0;
                                        ps.y = y +  1;//ps.rowMinY / 2;
                                        ps.rowMinY = Infinity;
                                        if (ps.y >= bottom) {
                                            ps.pastBottom = true;
                                            ps.fromTopLeft = true;
                                            failCount = fails;
                                            subFails = 0;
                                        }
                                    }
                                    nextSub = true;
                                }
                            } else {
                                x = (Math.randR(left, right) | 0) + pxOffX;
                                y = (Math.randR(top, bottom) | 0) + pxOffY;
                                if (API.addToImage(false, false, spr.image, mask.image, sub, x, y, sx, r, sy) === false) {failCount ++ }
                                /*else { update = true }*/
                            }
                        }
                    }

                }
                ps.progress = 1- ps.y / H;

            }
        },
        imgPackScan: { pastBottom: false, x: 0, y: 0,  rowMinY: 2, height: 2, fromTopLeft: true,  reset() {API.height = API.imgPackScan.x =  API.imgPackScan.x = 0; API.imgPackScan.fromTopLeft = true }},
        addToImage(update, scan, img, mask, spr, x, y, sx, rx,  sy = sx, ry = rx + Math.PI90) {
            if (img.isDrawable && spr.type.image && mask.isDrawable ) {
                const ps = API.imgPackScan;
                const ctx = img.ctx;
                const axx = Math.cos(rx) * sx;
                const axy = Math.sin(rx) * sx;
                const ayx = Math.cos(ry) * sy;
                const ayy = Math.sin(ry) * sy;


                if (scan) {

                    const l = -spr.w / 2, t = -spr.h / 2;
                    const r = l + spr.w, b = t + spr.h;
                    const xx1 = l * axx + t * ayx + x;
                    const yy1 = l * axy + t * ayy + y;
                    const xx2 = r * axx + b * ayx + x;
                    const yy2 = r * axy + b * ayy + y;
                    const R = img.w - 1, B = img.h - 1;
                    ps.height = height = Math.abs(yy1 - yy2);
                    if (xx1 < 0 || xx2 < 0 || yy1 < 0 || yy2 < 0 || xx1 > R || xx2 > R || yy1 > B || yy2 > B) {
                        return false;
                    }



                }

                var height;
                const ss = spr.type.subSprite && (spr.subSprite);
                var w = spr.w * sx, h = spr.h * sy;

                const is = Math.min(mask.w / w, mask.h / h);
                const iaxx = Math.cos(-rx) * is;
                const iaxy = Math.sin(-rx) * is;
                const iayx = Math.cos(-rx + Math.PI90) * is;
                const iayy = Math.sin(-rx + Math.PI90) * is;



                mask.ctx.imageSmoothingEnabled = false;
                mask.ctx.clearRect(0, 0, mask.w, mask.h)
                mask.ctx.setTransform(iaxx, iaxy, iayx, iayy, mask.w / 2, mask.h / 2);
                mask.ctx.drawImage(img, -x, -y);
                mask.ctx.setTransform(is, 0, 0, is, mask.w / 2, mask.h / 2);
                mask.ctx.globalCompositeOperation = "destination-in";
                ss ?
                    mask.ctx.drawImage(spr.image, ss.x, ss.y, ss.w, ss.h, -w / 2, -h / 2, w, h) :
                    mask.ctx.drawImage(spr.image, -w / 2, -h / 2, w, h);

                mask.ctx.setTransform(1,0,0,1,0,0);
                mask.ctx.globalCompositeOperation = "copy";
                mask.ctx.imageSmoothingEnabled = true;
                var ww = mask.w, hh = mask.h;
                while (ww > 4 && hh > 4) {
                    const w1 = ww / 2 | 0;
                    const h1 = hh / 2 | 0;
                    mask.ctx.drawImage(mask,0, 0, ww, hh, 0, 0, w1, h1);
                    ww = w1;
                    hh = h1;
                }
                mask.ctx.globalCompositeOperation = "source-over";
                mask.ctx.imageSmoothingEnabled = false;
                const data = new Uint32Array(mask.ctx.getImageData(0, 0, ww, hh).data.buffer);
                var idx = data.length;
                var over = false;
                while (idx --) {
                    if (data[idx] !== 0) {
                        over = true;
                        break;
                    }
                }

                if (!over) {
                    ps.rowMinY = Math.min(ps.rowMinY, height);
                    ctx.setTransform(axx, axy, ayx, ayy, x, y);
                    ctx.imageSmoothingEnabled = spr.smoothing;
                    ss ?
                        ctx.drawImage(spr.image, ss.x, ss.y, ss.w, ss.h, -spr.w / 2, -spr.h / 2, spr.w , spr.h) :
                        ctx.drawImage(spr.image, -spr.w / 2, -spr.h / 2, spr.w , spr.h);
                    ctx.setTransform(1,0,0,1,0,0);
                    if (update) {
                        img.processed = true;
                        img.lastAction = "Added image";
                        img.update();
                    }
                    return true;
                }
            }
            return false;
        },
        imageToVectorPaths(img, color, tolerance, spr, layer = false) {
            if(img.isDrawable){
                var scaleX = 1;
                var scaleY = 1;
                if (spr) {
                    scaleX = spr.sx;
                    scaleY = spr.sy;
                }

                const data = getPixelData8Bit(img);
                const d = data.data;
                const paths = [];
                const d32 = new Uint32Array(d.buffer);
                const w = data.width, h = data.height, wR = w -1, size = w * h;
                var x,y,idx = 0, idx4 = 0;
                const on = 0xFFFFFFFF, off = 0, t = 1, r = 2, b = 4, l = 8, edgeMask = 0b1111, z = 0;;
                const T = 1 + 16, R = 2 + 32, B = 4 + 64, L = 8 + 128;
                const highEdgeMask = 0b11110000;
                const TR = 16 + 32, TL = 16 + 128, RB = 32 + 64, BL = 64 + 128;
                const edgeIndex = [z,0,1,z,2,z,z,z,3];
                const reverseEdgeLetter = ["b","l","t","r"];
                //const innerAdCorners = [z, -w + 1, z, -w - 1, -w + 1, z, w + 1, z, z, w + 1, z, w - 1, -w - 1, z, w - 1, z];
                const innerAdCorners = [
                    z, z, z, 0b01000000,
                    0b10000000, z, z, z,
                    z, 0b00010000, z, z,
                    z, z, 0b00100000, z
                ];
                const edgeLetter = ["t","r","b","l"];
                const edgeLetterVals = {t : 0, r : 1, b : 2, l : 3};
                const edgeMaskOut = [0b11111110,0b11111101,0b11111011,0b11110111];
                const nextEdge = [[-w + 1, l, 1 , t, 0, r], [w + 1 , t, w , r, 0, b], [w - 1 , r, -1, b, 0, l], [-w - 1, b, -w, l, 0, t]];
                const diagonals = [0, -w + 1, w + 1, w - 1, -w - 1], NE = 1,SE = 2,SW = 3,NW = 4;
                const dirs = [[1,0], [0,1], [-1,0], [0,-1]];
                //const dirStarts = { t:{x:0,y:0}, r:{x:1,y:0}, b:{x:1,y:1}, l:{x:0,y:1} };
                const dirStarts = [{x:0,y:0}, {x:1,y:0}, {x:1,y:1}, {x:0,y:1}];
                var edgeFound = -1;
                var sharedCorner = 0;
                const getNextEdge = (startEdge, idx) => {
                    const e = nextEdge[startEdge];
                    var i = 0, ii = 1, E;
                    edgeFound = -1;
                    sharedCorner = 0;
                    while(i < 6){
                        if ((d32[idx + (E = e[i])] & e[ii]) === e[ii]) {
                            edgeFound = edgeIndex[e[ii]];
                            return E;
                        }
                        i += 2;
                        ii += 2;
                    }
                    return 0;
                }
                const traceEdge = (idx, edge) => {
                    x = idx % w;
                    y = idx / w | 0
                    d32[idx] &= edgeMaskOut[edge];
                    x += dirStarts[edge].x;
                    y += dirStarts[edge].y;
                    const path = [edgeLetter[edge]];
                    //var oEdge = edge << 2;
                    idx += getNextEdge(edge, idx);
                    while(edgeFound !== -1) {
                        d32[idx] &= edgeMaskOut[edgeFound];
                        /*const mask = innerAdCorners[edgeFound + oEdge];
                        if (mask) {
                            if ((d32[idx] & mask) === mask && path.length > 1) {
                                path.push(path[path.length - 1], edgeLetter[edgeFound])
                                path[path.length-3] = edgeLetter[(edgeLetterVals[path[path.length - 4]] + 2) % 4];
                            } else {
                                path.push(edgeLetter[edgeFound]);
                            }
                        } else {
                            path.push(edgeLetter[edgeFound]);
                        }
                        oEdge = edgeFound << 2;*/
                        path.push(edgeLetter[edgeFound]);
                        idx += getNextEdge(edgeFound, idx);
                    }
                    return {x, y, path: path.join("")};
                }
                var pxc = 0, rr, gg, bb


                const hsl1 = {h:0,s:0,l:0}, hsl2 = {h1: 0, h:0,s:0,l:0};
                RGBToHSLQuick(color.r, color.g, color.b, hsl1);

                if (hsl1.s < 60 || hsl1.l < 32 || hsl1.l > 180) {
                    const R = color.r ** 2, G = color.g ** 2, B = color.b ** 2;
                    const lum = (R + G + B) / 3;
                    const tolSqr = (((color.r + color.g + color.b) / 3 + tolerance) ** 2 - ((color.r + color.g + color.b) / 3) ** 2) ** 2 * 3;
                    while(idx < size) {
                        const x = idx % w;
                        if(x > 0 && x < wR && d32[idx] > 0 && Math.abs(d[idx4+3] - 255) < tolerance) {
                            rr = d[idx4];
                            gg = d[idx4 + 1];
                            bb = d[idx4 + 2];
                            if (layer) {
                                if ((rr * rr + gg * gg + bb * bb) / 3 >=  lum) {
                                    d32[idx++] = on;
                                    pxc ++;
                                } else {
                                    rr  = rr * rr - R
                                    gg  = gg * gg - G
                                    bb  = bb * bb - B
                                    if (rr * rr + gg * gg + bb * bb < tolSqr) {
                                        d32[idx++] = on;
                                        pxc ++;
                                    } else { d32[idx++] = off }
                                }
                            } else {
                                rr  = rr * rr - R
                                gg  = gg * gg - G
                                bb  = bb * bb - B
                                if (rr * rr + gg * gg + bb * bb < tolSqr) {
                                    d32[idx++] = on;
                                    pxc ++;
                                } else { d32[idx++] = off }
                            }
                        } else { d32[idx++] = off }
                        idx4 += 4;
                    }

                } else {
                    hsl1.h1 = hsl1.h + 255;
                    while(idx < size) {
                        const x = idx % w;
                        if(x > 0 && x < wR && d32[idx] > 0 && Math.abs(d[idx4+3] - 255) < tolerance) {
                            RGBToHSLQuick(d[idx4], d[idx4 + 1], d[idx4 + 2], hsl2);
                            if (layer) {
                                if (hsl2.l >= hsl1.l) {
                                    d32[idx++] = on;
                                    pxc ++;
                                } else {
                                    const huePass = Math.abs(hsl1.h1 - hsl2.h) < tolerance || Math.abs(hsl1.h - hsl2.h) < tolerance;
                                    if (huePass && Math.abs(hsl1.s - hsl2.s) < tolerance && Math.abs(hsl1.l - hsl2.l) < tolerance) {
                                        d32[idx++] = on;
                                        pxc ++;
                                    } else { d32[idx++] = off }
                                }
                            } else {
                                const huePass = Math.abs(hsl1.h1 - hsl2.h) < tolerance || Math.abs(hsl1.h - hsl2.h) < tolerance;
                                if (huePass && Math.abs(hsl1.s - hsl2.s) < tolerance && Math.abs(hsl1.l - hsl2.l) < tolerance) {
                                    d32[idx++] = on;
                                    pxc ++;
                                } else { d32[idx++] = off }
                            }
                        } else { d32[idx++] = off }
                        idx4 += 4;
                    }
                }

                const getPixOn = (i, edge) => {
                    if (i < 0 || i >= size || (edge === R && (i % w) === 0) || (edge === L && (i % w) === wR)) { return edge }
                    return d32[i] !== off ? 0 : edge;
                }
                const findEdgeStart = (idx) => {
                    while ((d32[idx] & edgeMask) === 0 && idx < size) { d32[idx++] &= highEdgeMask }
                    return idx;
                }
                var edges,x,y;
                idx = idx4 = 0;
                while(idx < d32.length) {
                    if(d32[idx] !== off) {
                        d32[idx] = getPixOn(idx - w, T) + getPixOn(idx + 1, R) + getPixOn(idx + w, B) + getPixOn(idx - 1, L);
                    }
                    idx++;
                }
                idx = 0;
                while(idx < size ){
                    idx = findEdgeStart(idx);
                    if(idx < size){
                        var p = d32[idx] & edgeMask;
                        if (p & t) { p = 0 }
                        else if (p & r) { p = 1 }
                        else if (p & b) { p = 2 }
                        else if (p & l) { p = 3 }
                        const edge = traceEdge(idx, p);
                        if(edge.path.length > 12) {
                            paths.push(edge);
                        }
                    }
                }
                const pathBitPos = [14,12,10,8,6,4,2,0];
                for(const path of paths) {
                    var i = 0;
                    var str = [];
                    var char = 0;
                    if (path.path[0] === "b" && path.path[1] === "r") {
                        path.x -= 1;
                        path.path = path.path.slice(1) + "b";
                        path.inside = true;
                    } else { path.inside = false }
                    while(i < path.path.length){
                        char += edgeLetterVals[path.path[i]] << pathBitPos[i % pathBitPos.length];
                        i ++;
                        if(i % pathBitPos.length === 0) {
                            str.push(String.fromCharCode(char));
                            char = 0;
                        }
                    }
                    if (i % pathBitPos.length !== 0) {str.push(String.fromCharCode(char)) }
                    path.length = path.path.length ;
                    path.path = str.join("");
                }

                return {
                    isPathStr : true,
                    renderAsSVG : false,
                    scaleX, scaleY,
                    detail : 2,
                    smooth : false,
                    cornerAngle : 0.85,
                    segs : 8,
                    paths,
                    color,
                    displayColor : {...color},
                    tolerance,
                };
            }
        },
        imagePallet(img, pallet,count, quality, sort = true){
            if(copyToWorking(img)){
                workingCanvas.w = workingCanvas.width;
                workingCanvas.h = workingCanvas.height;
                const data = getPixelData8Bit(workingCanvas);
                const eId = busy.start("Quantizing");
                const workers = {};
                EZWebWorkers.namedWorker(quantWorker,{obj : workers});

                workers.quantWorker({call : "getColorPalette", args : [data, count, quality, sort]})
                    .then(qPallet => {
                        pallet.length = 0;
                        for(const rgb of qPallet){
                            pallet.addColor(rgb[0],rgb[1],rgb[2]);
                        }
                        pallet.update();
                        busy.end(eId);

                    })
                    .catch(error => { log.warn("Could not complete task."); busy.end(eId) });
                resourceClean();
                return true;
            }
        },
        applyMorpher(img, functionName, jobDescription, ...args){
            if(canProcess(img)){
                var w = img.w;
                var h = img.h;
                img.lockPending();
                const data = img.lock(0);
                const eId = busy.start(jobDescription);
                const workers = {};
                EZWebWorkers.namedWorker(quantWorker,{obj : workers, onprogress : (progress) => {img.progress = progress}});
                workers.quantWorker({call : functionName, args})
                    .then(data => {
                        img.unlock(data);
                        img.lastAction = "Applied " + jobDescription;
                        img.update();
                        busy.end(eId);
                    })
                    .catch(error => {
                        log.warn("Could not complete task \"" + jobDescription + "\"");
                        img.unlock();
                        busy.end(eId)
                    });

                return eId;

            }
        },
        applyPallet(img,pallet,dither = false){
            if(canProcess(img)){
                var w = img.w;
                var h = img.h;
                img.lockPending();
                const data = img.lock(0); //getPixelData8Bit(img);
                const eId = busy.start("Quantizing");
                const workers = {};
                EZWebWorkers.namedWorker(quantWorker,{obj : workers, onprogress : (progress) => {img.progress = progress}});
                workers.quantWorker({call : "applyPaletteToImageData", args : [pallet.asArray(),data,dither]})
                    .then(data => {
                        img.unlock(data);
                        img.lastAction = "Applied Pallet";
                        img.update();
                        busy.end(eId);
                    })
                    .catch(error => {
                        log.warn("Could not complete task.");
                        img.unlock();
                        busy.end(eId)
                    });

                return eId;
            }
        },
        applyPalletAsIndex(img, pallet, dither = false){
            if(canProcess(img)){
                var w = img.w;
                var h = img.h;
                img.lockPending();
                const data = img.lock(0);
                const eId = busy.start("Indexed color");
                const workers = {};
                const pal = pallet.asArray();
                EZWebWorkers.namedWorker(quantWorker,{obj : workers, onprogress : (progress) => {img.progress = progress}});
                workers.quantWorker({call : "createIndexedLookup", args : [pal,data,dither]})
                    .then(data => {
                        img.unlock();
                        img.indexedColor = {pixels : data, pallet : pal}
                        img.lastAction = "Attached indexed color";
                        img.update();
                        busy.end(eId);
                    })
                    .catch(error => {
                        log.warn("Could not complete task.");
                        img.unlock();
                        busy.end(eId)
                    });

                return eId;
            }
        },
        applyPalletToImage(img, pallet, ditherType){
            if(canProcess(img)){


                const data = img.lock();

                const eId = busy.start("Quantizing");
                const workers = {};
                EZWebWorkers.namedWorker(ProcessImageWorker,{obj : workers, onprogress : (progress) => {img.progress = progress}});
                workers.ProcessImageWorker({call : "applyPalletToImage", args : [data, pallet.createColorLookup(),pallet.getLookup(), ditherType]})
                    .then(data => {
                        img.unlock(data);
                        img.lastAction = "Pallet";
                        img.update();
                        busy.end(eId);
                    })
                    .catch(error => {
                        log.warn("Could not complete task.");
                        img.unlock();
                        busy.end(eId)
                    });

                return eId;

            }
        },
        subSpriteRadialCollisionMap(img, {steps = 16, showResults = false, saveResults = false}){
            if(img.isDrawable && img.desc.sprites){
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const dat = data.data;
				const sprites = img.desc.sprites;
				const minDist = 4;
				var a, i, j = 0, x, y, edgeFound, dist;
				var str = "spriteEdges = {\n";
				for(const spr of sprites) {
					i = 0;
					spr.edges = [];
					const diag = (spr.w * spr.w + spr.h * spr.h) ** 0.5 / 2;
					const cx = spr.x + spr.w / 2;
					const cy = spr.y + spr.h / 2;
					while(i < steps) {
						a = (i / steps) * Math.PI * 2;
						const dx = Math.cos(a) / 2;
						const dy = Math.sin(a) / 2;
						edgeFound = false;
						dist = Math.round(diag * 2 + 1);
						while(!edgeFound) {
							x = (cx + dx * dist) | 0;
							y = (cy + dy * dist) | 0;
							if(x >= spr.x && x < spr.x + spr.w && y >= spr.y && y < spr.y + spr.h) {
								const idx = (x + y * w) * 4;
								if(dat[idx +3]) {
									edgeFound = true;
									spr.edges[i] = dist / 2;
									if (showResults) { dat[idx] = dat[idx + 1] = dat[idx + 2] = dat[idx + 3] = 255 }
									break;
								}
							}
							dist -= 1;
							if(dist < minDist * 2) {
								const idx = (x + y * w) * 4;
								edgeFound = true;
								spr.edges[i] = minDist;
								if (showResults) { dat[idx] = dat[idx + 1] = dat[idx + 2] = dat[idx + 3] = 255 }

								break;
							}
						}
						i++;
					}
					str += "    \"" + j + "\": [" + spr.edges.join(", ") + "],\n";
					j++;
					delete spr.edges;


				}
				str += "}\n";
				if(saveResults) {
					downloadText(str,"SpriteEdges_" + img.desc.name);
				}
				if (showResults) {
					img.lastAction = "SpriteEdges";
					setPixelData(img, data);
					img.processed = true;
					img.update();
				}
                return true;
            }
        },
        centerOfMass(img){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const dat = data.data;
                var mx = 0, my = 0;
                var x, y = 0, pixelCount = 0;
                while (y < h) {
                    let idx = y * w * 4 + 3;
                    x = 0;
                    while (x < w) {
                        const a = dat[idx] / 255;
                        if (a > 0) {
                            mx += x * a;
                            my += y * a;
                            pixelCount += 1;
                        }
                        idx += 4;
                        x++;
                        
                    }
                    y++;
                }
                if (pixelCount > 0) {
                    mx = mx / pixelCount | 0;
                    my = my / pixelCount | 0;
                    const idx = mx * 4 + my * 4 * w;
                    dat[idx] = 255;
                    dat[idx + 1] = 0;
                    dat[idx + 2] = 255;
                    dat[idx + 3] = 255;
                    setPixelData(img, data);
                    img.processed = true;
                    img.lastAction = "Center of Mass";
                    img.update();
                }
                return true;    
            }                
            
        },
        countPixels(img){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const dat = data.data;
                var x, y = 0, pixelCount = 0, pixelHash = new Uint32Array(3);
                pixelHash[0] = 0;
                pixelHash[1] = 0;
                pixelHash[2] = 0;
                while (y < h) {
                    let idx = y * w * 4;
                    x = 0;
                    while (x < w) {
                        if (dat[idx + 3] > 0) { 
                            pixelCount += 1; 
                            pixelHash[0] += dat[idx];
                            pixelHash[1] += dat[idx + 1];
                            pixelHash[2] += dat[idx + 2];
                        }
                        idx += 4;
                        x++;
                    }
                    y++;
                }
                img.desc.pixelChkSum = (pixelHash[0] + pixelHash[1] + pixelHash[2]) | 0;
                img.desc.pixelCount = pixelCount;
                log("Img pixels: " + pixelCount + " w: " + w + " h: " + h + " chkSum: " + img.desc.pixelChkSum);
                return true;    
            }                
            
        },        
        alphaCutOff(img, smoothAlpha = true, setTop = false){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const dat = data.data;
                const alpha = Math.round(colours.alpha * 255);
                const aBot = alpha > 16 ? (alpha - 8) : alpha;
                const aDist = alpha - aBot;

                var i = 0;
                if (smoothAlpha) {
                    while(i < dat.length) {
                        if(dat[i +3] < alpha) {
                            if(dat[i +3] > aBot) {
                                dat[i + 3] = ((dat[i+3]-aBot) / 8) * alpha;
                            }else{
                                dat[i + 3] = 0;
                            }
                        } else if(setTop) { dat[i + 3] = 255 }
                        i += 4;
                    }
                } else {
                    while(i < dat.length) {
                        if (dat[i +3] < alpha) { dat[i + 3] = 0 }
                        else if(setTop) { dat[i + 3] = 255 }
                        i += 4;
                    }
                }
                setPixelData(img, data);
                img.processed = true;
                img.lastAction = "Alpha cut <" + alpha;
                img.update();
                return true;
            }
        },
/*        errode(img, iterations, rain, cleanFlowData = false, range = false, showDebug = false) {
			if(cleanFlowData) {
				if(img.flowData) {
					delete img.flowData;
					console.log("Flow data removed");
					return true;
				}
			} else {
				if(img.isDrawable){
					iterations = iterations < 1 ? 1 : iterations;
					var W = img.w;
					var H = img.h;
					if(img.flowData) {
						if(img.flowData.W !== W || img.flowData.H !== H) {
							console.log("Flow data reset due to size change");
							img.flowData = undefined;
						}
					}
					if(img.flowData === undefined) {
						const flow = new Array(W * H * 4);
						const levs =  new Array(W * H * 4);
						const flowB = new Array(W * H * 4);
						const levsB =  new Array(W * H * 4);
						const work =  new Array(W * H * 4);

						flow.fill(0);
						levs.fill(0);
						flowB.fill(0);
						levsB.fill(0);
						img.flowData = {
							W, H,
							flow,
							levs,  // lev, sedement, hi
							flowB,
							levsB,
							work,
							step: 0,
						}

					}
					//const rain = 1;
					const data = getPixelData8Bit(img);
					const dat = data.data;
					const len = dat.length;
					const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
					const W4 = W * 4;
					const W1 = W - 1;
					const H1 = H - 1;
					const dirSt = [-4,4,-W4,W4];
					const dirP = [Math.PI,0, Math.PI * 1.5,Math.PI * 0.5];
					const LH = 2;  // land height
					rain *= 1;
					const evap = rain / 4;
					var x, y = 1, h, hu, hd, hl, hr, lh,lhl,lhr,lhu,lhd,sed, inFlow, inSed, outSed, lev, drain, drainC, outFlow,levl,levr,levu,levd;
					const EPSOLON = 0.01;
					var its = iterations;
					while(its--) {
						y = 1;
						const O = img.flowData.flow;
						const L = img.flowData.levs;
						const Om = img.flowData.flowB;
						const Lm = img.flowData.levsB;

						const K = img.flowData.work;

						if (img.flowData.step === 0) {
							while (y < H1) {
								x = 1;
								while (x < W1) {
									const i = (y * W + x) * 4;
									h = dat[i] + dat[i + 1] + dat[i + 2];
									L[i] = h;  // ground level
									L[i+1] = 0; // water level
									L[i+2] = 0; // sediment level
									L[i+3] = 0; // flow type. 0 down hill, 1 flat
									O[i] = Math.random()  * Math.PI * 2; // direction
									O[i+1] = (Math.random() - 0.5) * 2.0; // speed
									O[i+2] = 0; // slope angle
									O[i+3] = 0; // load
									x++;
								}
								y++;
							}
						}
						y = 1
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								const il = i - 4;
								const ir = i + 4;
								const iu = i - W4;
								const id = i + W4;

								L[i + 1] += rain;
								h =  L[i];
								hl = L[il];
								hr = L[ir];
								hu = L[iu];
								hd = L[id];
								let drX = (hl - h) + (h - hr);
								let drY = (hu - h) + (h - hd);
								const dp = (drX * drX + drY * drY) ** 0.5;
								if (dp > 0) {
									O[i] = Math.atan2(drY, drX);
									O[i+1] = dp;
									const min = Math.min(hl,hr,hu,hd);
									if (min < h) {
										O[i+2] = Math.PI - Math.acos(1 / ((1 + Math.max(drX * drX, drY * drY)) ** 0.5));
									} else {
										const dif = (Math.max(hl,hr,hu,hd) - min) / 2;

										O[i+2] = Math.PI - Math.acos(1 / ((1 +dif * dif) ** 0.5));

									}
								} else {
									O[i] = 0;
									O[i+1] = 0;
									O[i+2] = 0;
								}
								x++;
							}
							y++;
						}
						y = 1
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								const il = i - 4;
								const ir = i + 4;
								const iu = i - W4;
								const id = i + W4;
								h =  L[i];
								hl = L[il];
								hr = L[ir];
								hu = L[iu];
								hd = L[id];
								const wh =  L[i +1];
								const whl = L[il+1];
								const whr = L[ir+1];
								const whu = L[iu+1];
								const whd = L[id+1];

								const mean =  (hl + whl + hr + whr + hu + whu + hd + whd) / 4;
								const hw =  h + wh;
								const tMean =  (hw + mean) / 2;
								if (O[i + 2] === 0 || hw < tMean) {
									L[i+3] = 1;
									O[i+1] = tMean;


								} else {
									L[i+3] = 0;
								}
								Lm[i] = 0;
								Lm[i+1] = 0;
								Lm[i+2] = 0;
								Lm[i+3] = 0;
								x++;
							}
							y++;
						}

						y = 1
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								if (L[i+3] === 0) {
									const dx = Math.cos(O[i]) * O[i+1];
									const dy = Math.sin(O[i]) * O[i+1];
									const ii = i + (dx < -EPSOLON ? -4 : dx > EPSOLON ? 4 : 0) + (dy < -EPSOLON ? -W4 : dy > EPSOLON ? W4 : 0);
									if (ii !== i) {

										const move = Math.sin(O[i+2]);
										Lm[i+3] = Math.max(move,Lm[i+3]);
										const fw = L[i+1] * move;
										const fs = L[i+2] * move;
										var sed = Math.max(0,(L[i] - ((L[i] + L[ii]) / 2)) * 0.01);
										sed = Math.min(sed,Math.max(0,((L[i] + L[i + 1]) - ((L[i] + L[i + 1] + L[ii] + L[ii + 1]) / 2)) * 0.01));
										sed = sed * fw * move * move * move;// * (1 - L[i+2] / L[i+1]);
										Lm[i] = -sed;
										Lm[i+1] -= fw;
										Lm[i+2] -= fs;
										Lm[ii+1] += fw;
										Lm[ii+2] += fs + sed;
									}
								} else if(L[i+3] === 1 && L[i+1] > 0) {
									const il = i - 4;
									const ir = i + 4;
									const iu = i - W4;
									const id = i + W4;
									const mean = O[i+1];
									if (mean < L[i] + L[i+1]) {

										h = Math.max(mean- (L[i] + L[i+1]) , -L[i+1]);
										if(!(h < 0)) { throw new Error("Water from hell!") }
										let sedMove = (h / L[i+1]) * L[i+2];
										Lm[i+ 1] += h;
										Lm[i+ 2] += sedMove;
										h /= 4;
										sedMove /= 4;
										Lm[il+1] -= h;
										Lm[ir+1] -= h;
										Lm[iu+1] -= h;
										Lm[id+1] -= h;
										Lm[il+2] -= sedMove;
										Lm[ir+2] -= sedMove;
										Lm[iu+2] -= sedMove;
										Lm[id+2] -= sedMove;
									}
								}

								x++;
							}
							y++;
						}
						y = 1
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								L[i] += Lm[i];
								if(L[i] < 0) { L[i] = 0 }
								L[i+1] += Lm[i+1];
								L[i+2] += Lm[i+2];


								x++;
							}
							y++;
						}
						y = 1
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								const il = i - 4;
								const ir = i + 4;
								const iu = i - W4;
								const id = i + W4;
								h =  L[i];
								const min = Math.min(L[il], L[ir], L[iu],L[id]);
								//let dep = (L[i+2] ) * 0.5;
								let dep = (L[i+2] * (1-Lm[i+3])**2) * 0.5;
								if(h < min && dep > 0) {
									dep = Math.min(dep, min - h)
									L[i] += dep;
									L[i+2] -= dep;
								}
								if(L[i+1] - evap < 0) {
									L[i + 1] = 0;
									L[i] += L[i+2];
									L[i+2] = 0;
								} else {
									L[i+1] -= evap;
								}


								x++;
							}
							y++;
						}


						img.flowData.step++
					}
					{
						const O = img.flowData.flow;
						const L = img.flowData.levs;
						const K = img.flowData.work;
						var j = 0;
						var M = 0, m = Infinity;
						var Mw = 64, mw = Infinity;
						var Mr = 0, mr = Infinity;
						var Mg = 0, mg = Infinity;
						var Mb = 0, mb = Infinity;
						y = 1;
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								if(showDebug) {
									const v = L[i + 0];
									const v1 = L[i + 1];
									const v2 = L[i + 2];

								}else{
									const v = L[i];
									const w = L[i+1];
									M = v > M ? v : M;
									Mw = w > Mw ? w : Mw;
									m = v < m ? v : m;
									mw = w < mw ? w : mw;
								}
								x++;
							}
							y++;
						}
						y = 1;
						const rm = (M - m);
						const rmr = Mr - mr;
						const rmg = Mg - mg;
						const rmb = Mb - mb;
						while (y < H1) {
							x = 1;
							while (x < W1) {
								const i = (y * W + x) * 4;
								if(showDebug) {
									dat[i] = L[i ] / 3;
									dat[i+1] =  ((L[i + 1] - mg) / rmg) * 255;
									dat[i+2] =  ((L[i + 2] - mb) / rmb) * 255;

								} else if(range){
									dat[i] = dat[i + 1] = dat[i + 2] = ((L[i] - m) / rm) * 255;
									//dat[i + 2] = ((L[i + 2] + L[i + 3]- m) / rm) * 255;
								} else {
									//dat[i] = dat[i + 1] = dat[i + 2] = L[i + 2] /3;
									const ll = L[i] /3;
									//const ww = L[i + 3] / Mw;
									dat[i+1] = dat[i] = dat[i+2] = ll;
									//dat[i+2] = ll * (1-ww) + (128 * ww);
								}
								dat[i+3] = 255;
								x++;
							}
							y++;
						}
					}
					setPixelData(img, data);
					img.processed = true;
					img.lastAction = "Errored " + img.flowData.step;
					img.update();
					return true;
				}
			}


		},*/
        processCornersSprite(spr, applyFuncs) { return false },  // stub see backup before 10/10/19
        processCorners(img, corners, staticCorners, applyFuncs) { }, // stub see backup before 10/10/19
        harrisCornerDetect(img, k = 0.01, blockSize = 5, quantity = 50, display = false, time = animation.time) {},// stub see backup before 10/10/19
        imageToBin16Help() {
			log("Converts selected drawable bitmaps into bin files");
			log("File name is copied from sprite name with extesion .bin");
			log("Bin file header `GMap` then 2 shorts W,h, then short with bit length (16)");
			log("First row of image contains color map.");
			log("Color map is terminated with 0 or end of row");
			log("Color map is not written to file");
		},
        imageToBin16(spr) {
			const img = spr.image;
            if (img?.isDrawable) {
                var w = img.w;
                var h = img.h - 1;
                const data = getPixelData8Bit(img);
                const d8 = data.data;			
                const d32 = new Uint32Array(data.data.buffer);			
				var l = w * h;
				const head = "GMap";
				const byteBuf = new ArrayBuffer(l * 2 + 10)
				const bytes = new Uint8Array(byteBuf);
				const shorts = new Uint16Array(byteBuf);
				bytes[0] = head.charCodeAt(0);
				bytes[1] = head.charCodeAt(1);
				bytes[2] = head.charCodeAt(2);
				bytes[3] = head.charCodeAt(3);
				shorts[2] = w;
				shorts[3] = h;
				shorts[4] = 16;
				var i = 0;
				const cols = new Map();
				while (d32[i] !== 0 && i < w) {
					cols.set(d32[i], i + 1);
					i++;
				}
				
				i = 0;
				while (i < l) {
					shorts[5 + i] = cols.get(d32[w + i]) ?? 0;
					i++;
				}
				const anchor = document.createElement('a');
				const url = anchor.href = URL.createObjectURL(new Blob([byteBuf] ,{type: "application/octet-stream"}));
				anchor.download = spr.name + ".bin";
				anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
				setTimeout(() => URL.revokeObjectURL(url) , 1000);
				log.info("Saved bin map '" + spr.name + ".bin' " + w + " by " + h + " " + (w * h * 2 + 10) + " bytes");
			}				
				
			
		},
		imageToBinary(img){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                const data = getPixelData8Bit(img);
                const dat = data.data;
                var x,y;
                var byteArr = `[\n    ${w}, ${h},\n`;
                var hexArr = `[\n    0x${w.toString(16)}, 0x${h.toString(16)},\n`;
                var str = "";
                var hex = "";
                for(y = 0; y < h; y++){
                    str = "";
                    for(x = 0; x < w; x++){
                        str += dat[x * 4 + 3 + (y * w * 4)] > 0 ? "1" : "0"
                    }
                    var start = Math.ceil(str.length / 32) * 32 - str.length;
                    var b = "    ";
                    var c = "";
                    while(str.length > 0){
                        hex += c + "0x" + parseInt(str.substring(0,32-start),2).toString(16);
                        b += c + "0b" + str.substring(0,32-start);
                        str = str.substring(32-start);
                        start = 0;
                        c = ", ";
                    }
                    b += ",\n";
                    hex += ", ";
                    byteArr += b;
                }
                hexArr += hex;
                byteArr += "];\n";
                hexArr += "];\n";
                const code = `
function createBinImage(color, data) {  // Color is 32bit
    var w,h,can,c,d,d32,x,y,i,bits
    can = document.createElement("canvas");
    can.width = w = data.shift();
    can.height = h = data.shift();
    c = can.getContext("2d");
    d = c.getImageData(0,0,w,h);
    d32 = new Uint32Array(d.data.buffer);
    for (y = 0; y < h; y++) {
        x = 0;
        i = w - Math.floor(w / 32) * 32;
        while (x < w) {
            bits = data.shift();
            while (i--) { d32[(x++) + y * w] = bits & (1<<i) ? color : 0 }
            i = 32;
        }
    }
    c.putImageData(d,0,0);
    return can;
}
const binImage = ${byteArr}
const hexImage = ${hexArr}
`;
                downloadText(code,"binMap_"+img.desc.name+".js");
            }
        },
        imageToCharMap(img){
            if(img.isDrawable){
                var w = img.w;
                var h = img.h;
                const pixels = new Map();
                const data = getPixelData8Bit(img);
                const d = data.data;
                var len = d.length>>2;
                var cols = "";
                var sep = "";
                var id = 0;
                var idx = 0;
                while(len--){

                    const pix = d[idx] + (d[idx+1] << 8) + (d[idx+2] << 16);
                    if(!pixels.has(pix)){
                        pixels.set(pix, id++);
                        cols += sep + "#" +
                            d[idx].toString(16).padStart(2,"0") +
                            d[idx + 1].toString(16).padStart(2,"0") +
                            d[idx + 2].toString(16).padStart(2,"0");
                        sep = ",";
                    }
                    idx += 4;
                    if(pixels.size === 31){
                        break;
                    }
                }
                const chars = "#.-+=:|[0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                var str = "";
                var strPM = "";
                len = d.length>>2;
                var hasSpace = 0;
                idx = 0
                while(len--){

                    const pix = d[idx] + (d[idx+1] << 8) + (d[idx+2] << 16);
                    const xx = (idx / 4) % w;
                    const yy = (idx / 4) / w | 0;
                    idx += 4;
                    const val = pixels.get(pix);
                    if(yy > 0 && xx === 0){
                        strPM += "    \"";
                    }
                    if(val === undefined){
                        hasSpace = 1;
                        str += " ";
                        if(yy > 0){
                            strPM += " ";
                        }
                    }else{
                        str += chars[val];
                        if(yy > 0){
                            strPM += chars[val];
                        }
                    }
                    if(yy > 0 && xx === w-1){
                        strPM += "\",\n";
                    }
                }
                var map = `
// Groover V3 Image to Map Util (c) 2018
// Image source : ${img.desc.name}
// Image details : ${w} by ${h}
// Colors used : ${pixels.size + hasSpace}
const pixelMap = {
    width : ${w},
    height : ${h},
    str : "${str}",
    colors : "${cols}".split(","),
    order : "${chars.substring(0,pixels.size) + (hasSpace ? " " : "")}",
    toArray() {
        const map = new Map();
        this.order.split("").forEach((char, i) => map.set(char, i));
        const array = new Uint8Array(${w * h});
        var i = 0;
        while(i < ${w * h}) { array[i] = map.get(this.str[i++]) }
        return array;
    },
    charAt(x, y) { return this.str[x + y * ${w}] },
};
// End!

//Pacman convert
    const map = [
${strPM} ];
    const tTo = " #234567BhIcdf9";
    const tFrom = "#.-+=:|[0123456";
    const nMap = map.map(line => {
        var nl = "";
        for(var i = 0; i < line.length; i++){
            nl += tTo[tFrom.indexOf(line[i])];
        }
        return nl;
    })
    var str = "const map = [\\n";
    nMap.forEach(l=>{
        str += "    \\""+l+"\\",\\n";
    })
    str += "];\\n";
    downloadText(str,"map.txt")


`
                downloadText(map,"pixelMap_"+img.desc.name+".js");
            }
        },
        pixelFunctions : {
            none : null,
            invertRGB(pin,pout){
                pout[0] = 255-pin[0];
                pout[1] = 255-pin[1];
                pout[2] = 255-pin[2];
                return pout;
            },
            invertA(pin,pout){
                pout[3] = 255-pin[3];
                return pout;
            },
            alphaDown(pin,pout){
                  pout[3] = ((pin[3] / 255) ** 2) * 255;
                  return pout;
            },
            alphaUp(pin,pout){
                  pout[3] = ((pin[3] / 255) ** 0.5) * 255;
                  return pout;
            },
            minRGB(pin,pout){
                pout[2] = pout[1] = pout[0] = Math.min(pin[0],pin[1],pin[2]);
            },
            maxRGB(pin,pout){
                pout[2] = pout[1] = pout[0] = Math.max(pin[0],pin[1],pin[2]);
            },
            meanLogRGB(pin,pout){
                pout[2] = pout[1] = pout[0] = Math.sqrt((pin[0] * pin[0] + pin[1] * pin[1] + pin[2] * pin[2]) / 3);
                return pout;
            },
            RGBRotate(pin,pout){
                const r = pin[0];
                pout[0] = pin[2];
                pout[2] = pin[1];
                pout[1] = r;
                return pout;
            },
            redToGreenBlue(pin,pout){
                pout[2] = pout[1] = pin[0];
                return pout;
            },
            greenToRedBlue(pin,pout){
                pout[2] = pout[0] = pin[1];
                return pout;
            },
            blueToRedGreen(pin,pout){
                pout[0] = pout[1] = pin[2];
                return pout;
            },
            preceptualMeanRGB(pin,pout){
                pout[2] = pout[1] = pout[0] = Math.sqrt(pin[0] * pin[0] * 0.2 + pin[1] * pin[1] * 0.7 + pin[2] * pin[2] * 0.1);
            },
            meanRGB(pin,pout) {
                pout[2] = pout[1] = pout[0] = (pin[0] + pin[1] + pin[2]) / 3;
                return pout;
            },
            invMeanRGB(pin,pout) {
                pout[2] = pout[1] = pout[0] = 255 - (pin[0] + pin[1] + pin[2]) / 3;
                return pout;
            },
            moveR2A(pin,pout){
                pout[3] = pin[0];
                return pout;
            },
            moveR2RGB(pin,pout){
                pout[0] = pin[0];
                pout[1] = pin[0];
                pout[2] = pin[0];
                return pout;
            },
        },
        invertRGB(img){ API.channelCopy(img,API.pixelFunctions.none,API.pixelFunctions.invertRGB) },
        invertAlpha(img){ API.channelCopy(img,API.pixelFunctions.none,API.pixelFunctions.invertA) },
        channelCopy(img,getFunc,setFunc){
            if(img.isDrawable){
                const data = getPixelData8Bit(img);
                const dat = data.data;
                const pixelIn = new Uint8ClampedArray(4);
                const pixelOut = new Uint8ClampedArray(4);
                var i = 0;
                if(getFunc === null){
                    while(i < dat.length){
                        pixelIn[0] = dat[i];
                        pixelIn[1] = dat[i+1];
                        pixelIn[2] = dat[i+2];
                        pixelIn[3] = dat[i+3];
                        setFunc(pixelIn,pixelIn);
                        dat[i++] = pixelIn[0];
                        dat[i++] = pixelIn[1];
                        dat[i++] = pixelIn[2];
                        dat[i++] = pixelIn[3];
                    }
                } else {
                    while(i < dat.length){
                        pixelIn[0] = dat[i];
                        pixelIn[1] = dat[i+1];
                        pixelIn[2] = dat[i+2];
                        pixelIn[3] = dat[i+3];
                        setFunc(getFunc(pixelIn,pixelOut), pixelIn);
                        dat[i++] = pixelIn[0];
                        dat[i++] = pixelIn[1];
                        dat[i++] = pixelIn[2];
                        dat[i++] = pixelIn[3];
                    }
                }
                setPixelData(img,data);
                img.processed = true;
                img.lastAction = "Channel copy";
                img.update();
                return true;
            }
        },
        bodyPartsAPI(img, type) {
            API.bodyParts.locateBodyParts(img, type);
            return true;
        },      
        mapTileSet(spr) {
            const img = spr.image;
            if (img === undefined || img.desc.tileMapRender) { return; }
            if(img.isDrawable){
                const tS = API.tileSets;
                var w = img.w;
                var h = img.h;
                var wt = w / tS.tMPxW | 0;
                var ht = h / tS.tMPxH | 0;   
                var gw = tS.tW / tS.tMPxW;
                var gh = tS.tH / tS.tMPxH;
                var isZero;       
                const mapPx = [];   
                const found = [];
                found._size = 0;
                
                const imgData = getPixelData8Bit(img);            
                const d32 = new Uint32Array(imgData.data.buffer);            
                
                const setTilePx = (ctx, x, y, tpx) => {
                    var i = 0;
                    var yy = 0;
                    x *= tS.tMPxW;
                    y *= tS.tMPxH;
                    while (yy < tS.tMPxH) {
                        let idx = (yy + y) * w + x;
                        let xx = 0;
                        while (xx < tS.tMPxW) {
                            d32[idx + xx] = tpx[i];
                            /*if (tpx[i] !== 0) {
                                //ctx.clearRect((xx + x) * gw, (yy + y) * gh, gw, gh);
                            //} else {
                                const px = tpx[i];
                                ctx.fillStyle = "#" +
                                    (px & 0xFF        ).toString(16).padStart(2, "0") +
                                    ((px >> 8) & 0xFF ).toString(16).padStart(2, "0") +
                                    ((px >> 16) & 0xFF).toString(16).padStart(2, "0") +
                                    ((px >> 24) & 0xFF).toString(16).padStart(2, "0");
                                ctx.fillRect((xx + x) * gw, (yy + y) * gh, gw, gh);
                            }*/
                            i++;
                            xx++;
                        }
                        yy++;
                    }            
                }
                const getTilePx = (x, y, tpx = []) => {
                    var nn = 0, i = 0;
                    var yy = 0;
                    while (yy < tS.tMPxH) {
                        let idx = (yy + y) * w + x;
                        let xx = 0;
                        while (xx < tS.tMPxW) {
                            const p = d32[idx + xx];
                            nn |= p;
                            tpx[i++] = p;
                            xx++;
                        }
                        yy++;
                    }
                    isZero = nn === 0;
                    return tpx;
                    
                }
                const BAD_TILE = 0xFFFF00;
                const BAD_TILE_1 = 0xFFFF01;
                const BAD_TILE_2 = 0xFFFF02;
                const BAD_TILE_3 = 0xFFFF03;
                const BAD_TILE_4 = 0xFFFF04;
                
                const getTileAt = (can, x, y) => {
                    if (x >= 0 && x < wt && y >= 0 && y < ht) {
                        const tM = can.desc.tilesetMap;
                        const idx = tM[x + y * wt];
                        return idx === BAD_TILE ? undefined : tS.tiles.find(tile => tile.idx === idx);
                    }
                }
                const foundHas = (tile) => {
                    i = 0;
                    while (i < found._size) {
                        if (found[i++] === tile) { return true; }
                    }
                    return false;
                }
                var above, below, right, left;
                const isCandidateTile = (a0, found, a1, a2, a3) => {
                    var aBits = (a1 ? 1: 0) + (a2 ? 2: 0) + (a3 ? 4: 0);
                    a0.forEach(tile => {
                        if (!foundHas(tile)) { 
                            const idx = tile.idx;
                            var f = 0;
                            if (a1 && a1.some(t => t.idx === idx)) { f |= 1 }
                            if (a2 && a2.some(t => t.idx === idx)) { f |= 2 }
                            if (a3 && a3.some(t => t.idx === idx)) { f |= 4 }
                            if (f === aBits) {
                                found[found._size++] = tile; 
                            }
                        }
                    });
                }
                var badTileQueue = [];
                var queue2 = [];
                const fixTiles = (can) => {
                    var i = 0;
                    var col = 2;
                    can.ctx.fillStyle = "#C00" + col;
                    const tM = can.desc.tilesetMap;
                    var fixing = true;
                    while (fixing) {
                        while (badTileQueue.length) {
                            i = badTileQueue.pop();
                            const idx = tM[i];
                            const cc = BAD_TILE_4 - idx;
                            const x = (i % wt); 
                            const y = (i / wt | 0);
                            getTilePx(x * tS.tMPxW, y * tS.tMPxH, mapPx);
                            
                            above = getTileAt(can, x,     y - 1);
                            below = getTileAt(can, x,     y + 1);
                            right = getTileAt(can, x + 1, y);
                            left  = getTileAt(can, x - 1, y);
                            var c = (above ? 1 : 0) + (below ? 1 : 0) + (right ? 1 : 0) + (left ? 1 : 0);
                           // if (c <= cc) {
                            //    if (idx <= BAD_TILE_4) {
                            //        tM[i] += 1;
                             //       queue2.push(i);
                            //    } else {
                                    
                                   // can.ctx.fillRect(x * tS.tW, y * tS.tH, tS.tW, tS.tH);
                             //   }
                            //} else {
                                found._size = 0;
                                if (above) { isCandidateTile(above.below, found, below?.above, left?.right, right?.left); }
                                if (below) { isCandidateTile(below.above, found, above?.below, left?.right, right?.left); }
                                if (right) { isCandidateTile(right.left, found, above?.below, below?.above, left?.right); }
                                if (left)  { isCandidateTile(left.right, found, above?.below, below?.above, right?.left); }
                                if (found._size) {
                                    //can.ctx.fillRect(x * tS.tW, y * tS.tH, tS.tW, tS.tH);
                                    //can.ctx.globalAlpha = col / 16;
                                    const tile = found[Math.random() * found._size | 0];
                                    
                                    tM[i] = tile.idx;     
                                    //can.ctx.globalAlpha = 1; 
                                    can.ctx.clearRect(x * tS.tW, y * tS.tH, tS.tW, tS.tH);
                                    can.ctx.drawImage(tile.spr.image, x * tS.tW, y * tS.tH, tS.tW, tS.tH);
                                    //can.ctx.globalAlpha = 0.3;  
                                    if(tile.idx) {
                                        setTilePx(can.ctx, x, y, tile.px);
                                    }
                                    //can.ctx.globalAlpha = 1;
                                }
                            //  }
                        }
                        if (queue2.length) {
                            [badTileQueue, queue2] = [queue2, badTileQueue];
                            col += 1;
                            //can.ctx.fillStyle = "#C00" + col.toString(16);
                        } else {
                            fixing = false;
                        }
                    }
                }
                const drawTiles = (can) => {
                    can.ctx.save();
                    var x, y = 0;
                    const tM = can.desc.tilesetMap;
                    while (y < ht) {
                        x = 0;
                        const yy = y * tS.tMPxH;
              
                        while (x < wt) {
                            getTilePx(x * tS.tMPxW, yy, mapPx);
                            if (!isZero) {
                                API.tileSets.getTileMatches(mapPx, found);
                                const idx = x + y * wt;
                                if (found._size) {
                                    const tile = found[Math.random() * found._size | 0];
                                    can.ctx.drawImage(tile.spr.image, x * tS.tW, y * tS.tH, tS.tW, tS.tH);
                                    tM[idx] = tile.idx;
                                } else {
                                    tM[idx] = BAD_TILE;
                                    badTileQueue.push(idx);
                                }
                            } else {
                                const idx = x + y * wt;
                                const tile = tS.tiles[0];
                                can.ctx.drawImage(tile.spr.image, x * tS.tW, y * tS.tH, tS.tW, tS.tH);
                                tM[idx] = tile.idx;  
                            }
                            x ++;
                        }
                        y ++;
                    }
                    fixTiles(can);
                    can.ctx.restore();
                    can.processed = true;
                    can.lastAction = "TileMap";
                    can.update();
                    img.ctx.putImageData(imgData, 0, 0);
                    img.processed = true;
                    img.lastAction = "TileGrid";
                    img.update();
                    
                    
                }
                badTileQueue.length = 0;
                if (spr.tileSetSpr) {
                    spr.tileSetSpr.image.ctx.clearRect(0, 0, spr.tileSetSpr.image.w, spr.tileSetSpr.image.h);
                    spr.tileSetSpr.image.desc.tilesetMap.fill(-1);
                    drawTiles(spr.tileSetSpr.image);
                    tS.addedSpr.push(spr);
                } else {
                    media.createImage(wt * tS.tW, ht * tS.tH, "tileMap_" + img.desc.name, can => {
                        can.desc.tilesetMap = new Array(ht * wt);
                        can.desc.tilesetMap.fill(-1);
                        drawTiles(can);
                        var nSpr = new Sprite(0, 0, can.w, can.h);
                        spr.tileSetSpr = nSpr;
                        nSpr.changeImage(can);
                        sprites.add(nSpr);
                        tS.addedSpr.push(nSpr);
                        can.desc.tileMapRender = true;
                        tS.createMapDependency(nSpr, spr)
                        
                    });        
                }
                return true;    
            }
        },
        tileSets: {
            ready: false,
            busy: false,
            tW: 0,   // tile w, h px
            tH: 0,
            tCX: 1,  // tile area
            tCY: 1,
            tMPxW: 1,  // tile map px width and height
            tMPxH: 1,
            addedSpr: [],

            getTileMatches(px, found = []) {
                var i = 0;
                const match = (a, i) => a === px[i];
                for (const tile of API.tileSets.tiles) {
                    if (tile.px.every(match)) {
                        found[i++] = tile;
                    } 
                }   
                found._size = i;                
                return found;
            },
            getTilesExtent(tiles) {
                const tS = API.tileSets;
                var tW = 512 * 8;
                var tH = 512 * 8;
                var x = tS.tiles[0].spr.x - tS.tiles[0].spr.cx, mX = x;
                var y = tS.tiles[0].spr.y - tS.tiles[0].spr.cy, mY = y;
                for (const tile of tiles) {
                    const spr = tile.spr;
                    tW = Math.min(spr.image.w, tW);
                    tH = Math.min(spr.image.h, tH);
                    
                    x = Math.min(spr.x - spr.cx, x);
                    y = Math.min(spr.y - spr.cy, y);
                    mX = Math.max(spr.x - spr.cx, mX);
                    mY = Math.max(spr.y - spr.cy, mY);                    
                }   
                var tCX = ((mX - x) / tW | 0) + 1;
                var tCY = ((mY - y) / tH | 0) + 1;
                return {tW, tH, tCX, tCY, x, y, mX, mY};             
            },
            createTileMappings() {
                if (API.tileSets.mapping.length === 0) { log("No mapping tiles processed"); return }
                const locs = [
                    {x:  0, y: -1, aName: "above", bName: "below"},
                    {x:  1, y:  0, aName: "right", bName: "left"},
                    {x:  0, y:  1, aName: "below", bName: "above"},
                    {x: -1, y:  0, aName: "left", bName: "right"},
                    {x:  0, y:  0, aName: "same", bName: "same"},
                ];
                const ABOVE = 0;
                const RIGHT = 1;
                const BELOW = 2;
                const LEFT = 3;
                const SAME = 4;
                const tS = API.tileSets;
                var eXm = tS.getTilesExtent(API.tileSets.mapping);
                var x = eXm.x, mX = eXm.mX;
                var y = eXm.y, mY = eXm.mY;           
                var t, xx, yy;
                const tileByTileSpr = (t) => tS.tiles.find(tile => tile.spr.image === t.spr.image);                   
                const tileAtLoc = (xx, yy, tile, mt, loc) => {
                    const l = locs[loc];
                    addTileLocs(tile, tileAt(xx + l.x, yy + l.y), loc)
                }
                const addTileLocs = (tA, tB, loc, reverse = true) => {
                    if (tB) { 
                        const l = locs[loc];
                        const a = tA[l.aName];
                        const b = tB[l.bName];
                        if (a.indexOf(tB) === -1) { a.push(tB); /*log(tB.idx + " " + l.aName + " " + tA.idx) */}
                        if (reverse && b.indexOf(tA) === -1) { b.push(tA);/* log(tA.idx + " " + l.bName + " " + tB.idx) */}
                    }
                }            
                const tileAt = (xx, yy) => {
                    for (const mt of API.tileSets.mapping) {
                        const spr = mt.spr;
                        let tx = ((spr.x - spr.cx) - x) / tS.tW | 0;
                        let ty = ((spr.y - spr.cy) - y) / tS.tH | 0; 
                        if (tx === xx && ty === yy) {
                            const tile = tileByTileSpr(mt);
                            return tile;    
                        }
                    }                            
                }
                
                var i = 0;
                while (i < tS.mapping.length) {
                    const spra = tS.mapping[i].spr;
                    const xa = ((spra.x - spra.cx) - x) / tS.tW | 0;
                    const ya = ((spra.y - spra.cy) - y) / tS.tH | 0;                      
                    let j = i +  1;
                    while (j < tS.mapping.length) {
                        const sprb = tS.mapping[j].spr;
                        const xb = ((sprb.x - sprb.cx) - x) / tS.tW | 0;
                        const yb = ((sprb.y - sprb.cy) - y) / tS.tH | 0;                      
                        if (xb === xa && ya === yb) {
                            const atA = tileByTileSpr(tS.mapping[i]);
                            const atB = tileByTileSpr(tS.mapping[j]);
                            if (atA.idx !== atB.idx) {
                                if (atA.same.indexOf(atB) === -1) { atA.same.push(atB); /*log("Same " + atA.idx + " as " + atB.idx);*/ }
                                if (atB.same.indexOf(atA) === -1) { atB.same.push(atA); /*log("Same " + atB.idx + " as " + atA.idx); */}                                
                            }
                        }
                        j++;
                    }
                    i++;
                }
                    
                    
                for (const tile of API.tileSets.tiles) {
                    tile.same.push(tile);    
                    for (const mt of API.tileSets.mapping) {
                        const spr = mt.spr;
                        const at = tileByTileSpr(mt);
                        const xx = ((spr.x - spr.cx) - x) / tS.tW | 0;
                        const yy = ((spr.y - spr.cy) - y) / tS.tH | 0;                            
                        if (tile.spr.image === mt.spr.image) {
                            tileAtLoc(xx, yy, tile, mt, ABOVE);
                            tileAtLoc(xx, yy, tile, mt, RIGHT);
                            tileAtLoc(xx, yy, tile, mt, BELOW);
                            tileAtLoc(xx, yy, tile, mt, LEFT);
                        }
                        
                    }                        
                }
                log("Find infered");

                
                for (const tile of API.tileSets.tiles) {
                    for (const tileR of tile.right) {
                        if (tile.idx === tileR.idx) {
                            for (const sTile of tile.same) {
                                for (const tileRR of sTile.right) { 
                                    for (const tileL of sTile.left) { 
                                        addTileLocs(tileRR, tileL, LEFT); 
                                    }
                                    for (const tileL of tileRR.left) { 
                                        addTileLocs(sTile, tileL, LEFT); 
                                    }
                                }
                                for (const tileLL of sTile.left) { 
                                    for (const tileR of tileLL.right) { 
                                        addTileLocs(sTile, tileR, RIGHT); 
                                    }
                                }
                            }
                        }
                    }     
                    for (const tileB of tile.below) {
                        if (tile.idx === tileB.idx) {
                            for (const sTile of tile.same) {
                                for (const tileBB of sTile.below) { 
                                    for (const tileA of sTile.above) { 
                                        addTileLocs(tileBB, tileA, ABOVE); 
                                    }
                                    for (const tileA of tileBB.above) { 
                                        addTileLocs(sTile, tileA, ABOVE); 
                                    }                               
                                }
                                for (const tileAA of sTile.above) { 
                                    for (const tileB of tileAA.below) { 
                                        addTileLocs(sTile, tileB, BELOW); 
                                    }
                                }      
                            }                            
                        }
                    }                       
                }
            },
            createTiles() {
                if (API.tileSets.tiles.length === 0) { log.info("No tile sprites have been defined"); return; }
                if (!API.tileSets.tilePx) { log.info("Tile pixels image has not been defined"); return; }
                if (!API.tileSets.mapping) { API.tileSets.mapping = []; }
                
                for (const spr of sprites) {
                    if (spr.tileSetSpr) {
                        spr.image.removeDependent(spr.tileSetSpr, updateTileMap);
                        spr.tileSetSpr = undefined;                        
                    }
                }

                const tS = API.tileSets;
                const px = new Uint32Array(tS.tilePx.ctx.getImageData(0, 0, tS.tilePx.w, tS.tilePx.h).data.buffer);
                var eXt = tS.getTilesExtent(API.tileSets.tiles);
                tS.tW = eXt.tW;
                tS.tH = eXt.tH;
                var x = eXt.x, mX = eXt.mX;
                var y = eXt.y, mY = eXt.mY;
  
                var tCX = tS.tCX = eXt.tCX;
                var tCY = tS.tCY = eXt.tCY;
                var tMPxW = tS.tMPxW = tS.tilePx.w / tCX | 0;
                var tMPxH = tS.tMPxH = tS.tilePx.h / tCY | 0;
                
                log("--------------------------------------");
                log("Starting tile create");                
                log("Using " + tS.tiles.length + " tiles");
                log("Tile Size: " + tS.tW + " by "  + tS.tH + "px");
                log("Tiles area: " + tCX + " by "  + tCY + "tiles");
                log("Tile px: " + tMPxW + " by "  + tMPxH + "px");
                
                
                
                for (const tile of API.tileSets.tiles) {
                    const spr = tile.spr;
                    tile.x = ((spr.x - spr.cx) - x) / tS.tW | 0;
                    tile.y = ((spr.y - spr.cy) - y) / tS.tH | 0;
                    tile.idx = tile.x + (tile.y * tCX);
                    spr.image.desc.name = "T" + tile.idx; 
                    const ppx = tile.x * tMPxW;
                    const ppy = tile.y * tMPxH;
                    
                    let yy = 0;
                    while (yy < tMPxH) {
                        let xx = 0;
                        while (xx < tMPxW) {
                            tile.px[xx + yy * tMPxW] = px[ppx + xx + (ppy + yy) * tS.tilePx.w];
                            xx ++;
                        }
                        yy++;
                    }
                    //log("Tile pos: " + tile.x  + ", "  + tile.y + " [" + tile.px.map(px=> px === 0 ? "_" : px === 4284440415 ? "#" : "^").join("") + "]");
                            
                }
                tS.tiles.sort((a, b) => a.idx - b.idx);
                mediaList.selected.clear();
                tS.tiles.forEach(tile => mediaList.selected.add(tile.spr.image));
                tS.createTileMappings();
                tS.ready = true;
                queueCommand(commands.edSprUpdateUI, 100);
                queueCommand(commands.mediaReorder, 100);
                queueCommand(commands.sysCommandManagerQueueCallback, 100, () => {
                    mediaList.selected.clear();
                    tS.tiles.forEach(tile => mediaList.selected.add(tile.spr.image));                    
                    queueCommand(commands.edSprUpdateUI, 100);
                });

                
            },
            createMapDependency(tileSetSpr, tileMap) {
                const updateTileMap = () => {         
                    if (!API.tileSets.busy) {
                        API.tileSets.busy = true;
                        API.mapTileSet(tileMap);
                        API.tileSets.busy = false;
                    }
                };
                tileMap.image.addDependent(tileSetSpr.image, updateTileMap);

                tileSetSpr.addEvent("ondeleting", () => {
                    tileMap.image.removeDependent(tileSetSpr.image, updateTileMap);
                    tileMap.tileSetSpr = undefined;
                    tileSetSpr = undefined;
                    log.info("Removed dependency"); 
                });
                log.info("Added dependency");           
            },
        },        
        get extras() {
            function createSprites(markType) {
                if(selection.length > 0){
                    var drawableCount = 0;
                    var imageCount = 0;
                    selection.eachOfType(spr => {
                        drawableCount += spr.image.isDrawable ? 1 : 0;
                        imageCount += 1;
                    },"image");
                    if(imageCount === 0) {
                        log.warn("None of the selected sprites are images");
                        return;
                    }
                    if(drawableCount !== imageCount) {
                        const dialogs = {
                            convert: "30 Convert to drawable|Convert,Cancel|text Some or all selected image are not drawable,text Do you wish to convert images to drawable\\?,text Note that converting media to drawable will update selected media. ",
                        }
                        buttons.dialogTree(dialogs, {convert: "" })
                            .then(() => {
                                mediaList.selected.clear();
                                selection.eachOfType(spr => !spr.image.isDrawable && mediaList.selected.add(spr.image) ,"image");
                                issueCommand(commands.spritesToDrawable);
                                setTimeout(() => createSprites(markType), 1000);
                            })
                            .catch(() => log.warn("Sprite extract canceled by user!"));
                        return;


                    }
                    const setupPackSprites = {
                        locateOnly: true,
                        markType: "",
                        spacing: 1,
                        save: false,
                        extract: false,
                        addToWorkspace: false,
                        fromSprite: null,
                    };
                    const dialogs = {
                        locateOnly: "Extract Sprites method|Locate,Repack,Mark,Cancel|text Select exract method,",
                        addToWorkspace: "20 Add to workspace?|Don't add,Add|text Add found sprites to workspace\\?",
                        dontAddEmpty: "20 Add empty tiles?|AddEmpty,IgnoreEmpty|text Add or not empty tiles to workspace\\?",
                        addUniqueOnly: "20 Add unique only?|AddAny,AddUnique|text Add any tile or only tiles with the same pxs once\\?",
                        save: "20 Save sprites list?|Don't save,Save|text Do you wish to save the created sprite list\\?",
                        joiner: "20 Use joiner?|No joiner,Joiner|text Use top left pixel to join sprites\\?",
                        spacing: "20 Pad packed sprites?|No padding,Pad|text Seperate packed sprites with 1 pixel padding\\?",
                        gridSize: "20 Select size method|Pixels,Counts|text Pixels set grid size in pixels,text Count set grid size in row ans columns,",
                        xSize: "Select X axis size Px|OK,Cancel|{,1,2,3,4,5,6,7,8,},{,9,10,11,12,13,14,15,16,},{,18,20,22,24,28,30,32,48,},{,64,96,128,160,192,224,256,512,},",
                        ySize: "Select Y axis size Px|OK,Cancel|{,1,2,3,4,5,6,7,8,},{,9,10,11,12,13,14,15,16,},{,18,20,22,24,28,30,32,48,},{,64,96,128,160,192,224,256,512,},{,Square,Half,Quater,}",
                        xCount: "Select horizontal count|OK,Cancel|{,1,2,3,4,5,6,7,8,},{,9,10,11,12,13,14,15,16,},{,17,18,19,20,21,22,23,24,},{,25,26,27,28,29,30,31,32,33,}",
                        yCount: "Select vertical count|OK,Cancel|{,1,2,3,4,5,6,7,8,},{,9,10,11,12,13,14,15,16,},{,17,18,19,20,21,22,23,24,},{,25,26,27,28,29,30,31,32,33,},{,Square,Half,Quater,},"
                    }

                    if(markType === "grid" || markType === "gridoverlay") {
                        setupPackSprites.markType = markType;
                        const dialogTree = {
                            gridSize: {
                                Pixels: { 
									xSize: "option", 
									ySize: "option", 
									addToWorkspace: {
										Add: { dontAddEmpty: "", addUniqueOnly: "", },
										//["Don't add"]: {}
										
									}
								},
                                Counts: { 
									xCount: "option", 
									yCount: "option",
									addToWorkspace: {
										Add: { dontAddEmpty: "", addUniqueOnly: "",  },
										//["Don't add"]: {}
										
									}
								},
								
                            },
                        };
                        /*markType !== "gridoverlay" && (
							//dialogTree.gridSize.Pixels.addToWorkspace = dialogTree.gridSize.Counts.addToWorkspace = "",
							//dialogTree.gridSize.Pixels.addToWorkspace.Add.addToWorkspace = "",
							//dialogTree.gridSize.Pixels.addToWorkspace["Don't add"].addToWorkspace = ""
							//dialogTree.addToWorkspace.Add.addToWorkspace = "",
							//dialogTree.addToWorkspace["Don't add"].addToWorkspace = ""
						);*/
                        buttons.dialogTree(dialogs, dialogTree).then(res => {
                            var {xSize, ySize, xCount, yCount, dontAddEmpty, addUniqueOnly} = res;
                            const addToWorkspace = res.addToWorkspace === "Add";
                            log.info("Sprite extract dialog results");
                            log.obj(res);
                            log.info("Extracting sprites...........");
                            const newSprites = []

                            selection.processImages((img, i) => {
                                var ys, _xCount;
                                if (xCount === undefined) {
                                    _xCount = img.w / xSize | 0;
                                    if (ySize === "Square") { ys = img.h / xSize | 0}
                                    else if (ySize === "Half") { ys = img.h / (xSize * 2) | 0 }
                                    else if (ySize === "Quater") { ys = img.h / (xSize * 4) | 0  }
                                    else { ys = img.h / ySize | 0 }
                                } else {
									_xCount = xCount;
                                    if (yCount === "Square") { ys = img.h / (img.w / _xCount) | 0 }
                                    else if (yCount === "Half") { ys = img.h / (img.w / (_xCount * 2)) | 0 }
                                    else if (yCount === "Quater") { ys = img.h / (img.w / (_xCount * 4)) | 0 }
                                    else { ys = Number(yCount) }
                                }
                                if(markType === "gridoverlay") {
                                    API.addGridNumberOverlay(img, _xCount, ys);
                                } else {
									log.info("Extracted Grid sprites: " + _xCount + " by " + ys);
                                    newSprites.push(...API.extractGridSprites(img, _xCount, ys, selection[i], addToWorkspace, dontAddEmpty === "IgnoreEmpty", addUniqueOnly === "AddUnique"));
                                }
                            });
                            if(markType === "gridoverlay") {
                            } else {
                                if (addToWorkspace) {
                                    selection.clear();
                                    selection.add(newSprites);
                                }
                                utils.tidyWorkspace();
								newSprites.length > 0 && log("Extracted "+newSprites.length+" sprites");
                            }
                        }).catch(()=> log.warn("Sprite extract dialog terminated by user"));
                        return;

                        return;
                    }



                    const dialogTree = {
                        locateOnly: {
                            Locate: {addToWorkspace: "", save: ""},
                            Repack: {addToWorkspace: "", save: "", joiner: "", spacing: ""},
							Mark: {},
                        },
                    };
                    buttons.dialogTree(dialogs, dialogTree).then(res => {
                        log.info("Sprite extract dialog results");
                        log.obj(res);
                        log.info("Extracting sprites...........");
						const markLocs = res.locateOnly === "Mark";
						if (markLocs) {
							const addedSprites = [];
							selection.eachOfType(fromSprite => {
								if (fromSprite.image.desc.sprites) {
									let idx = 0;
									for(const rect of fromSprite.image.desc.sprites){
										const topLeft = fromSprite.key.toWorldPoint(rect.x, rect.y);
										const botRight = fromSprite.key.toWorldPoint(rect.x + rect.w, rect.y + rect.h);
										var spr = new Sprite((topLeft.x + botRight.x) / 2 , (topLeft.y + botRight.y) / 2, rect.w, rect.h);
										spr.changeImage(fromSprite.image);
										spr.changeToSubSprite(idx);
										spr.sx = fromSprite.sx;
										spr.sy = fromSprite.sy;
										spr.rx = fromSprite.rx;
										spr.ry = fromSprite.ry;
										spr.key.update();
										sprites.add(spr);
										addedSprites.push(spr);
										idx++;
									}
								}									
							}, "image");
                            selection.clear();
                            selection.add(addedSprites);
							utils.tidyWorkspace();
							return;
 							
						}
                        const locateOnly = res.locateOnly === "Locate";
                        const spacing = res.spacing === "Pad" ? 1 : 0;
                        const addToWorkspace = res.addToWorkspace === "Add";
                        const save = res.save === "Save";
                        const joiner = res.joiner === "Joiner";
                        const newSprites = [];
                        var processCount = selection.length;
                        function onDone(added){
                            if (addToWorkspace) {
                                newSprites.push(...added);
                            }
                            processCount --;
                            if(processCount === 0) {
                                selection.clear();
                                selection.add(newSprites);
                                utils.tidyWorkspace();
                            }
                        }
                        selection.processImages((img, i) => {
                            Object.assign(setupPackSprites ,{
                                locateOnly,
                                save,
                                addToWorkspace,
                                markType,
                                joiner,
                                onDone,
                                spacing,
                                extract: undefined,
                                fromSprite:  selection[i],
                            });
                            API.packSprites(img, setupPackSprites);
                        });
                    }).catch(()=> log.warn("Sprite extract canceled by user"));
                }else{
                    log.warn("No images selected");
                }
            }
            function pads(color,t,r,b,l) {
                selection.processImages((img, i) => {
					if (!img.desc.sprites) {
                        img.restore(false);
						const processed = localProcessImage.pad(img, color, t, r, b, l);
						sprites.eachOfType(spr => { if(spr.image === img && !spr.type.subSprite){  spr.imageResized(true) } },"image");
						return processed === true;
						}
					return true;
                });
				const subSprites = new Set();
				selection.eachOfType(spr => {
						if(spr.type.subSprite) {
							const id = spr.image.desc.guid + "_" + spr.subSpriteIdx;
							if(!subSprites.has(spr.subSprite)) {
								const s = spr.image.desc.sprites[spr.subSpriteIdx];

								s.y -= t;
								s.x -= l;
								s.w += l + r;
								s.h += t + b;
								subSprites.add(spr.subSprite);
							}

						}
					},"image"
				);
				sprites.eachOfType(spr => {
						if (spr.type.subSprite && subSprites.has(spr.subSprite)) {
							spr.imageResized();
						}
					},"image"
				);
                sprites.cleanup();
                widget.update();
                spriteList.updateInfo();
                guides.update();
            }

			function callHelp(name, helpFor) {
				log.info("==================================================");
				log("Help: '" + name + "'");
				helpFor();
				log.info("--------------------------------------------------");
				
			}
            var randomPackBusy = false;
            function randomPack(rotate, scale, failLimit, method) {

                if (randomPackBusy) { log.warn("Image packing is busy"); return }

                if (selection.length === 2) {
                    const spr1 = selection[0];
                    const spr2 = selection[1];
                    if (spr1.type.image && spr2.type.image) {
                        const scan = method === "scan";
                        API.imgPackScan.reset();
                        API.imgPackScan.pastBottom = false;
                        const [sprA, sprB] = spr1.image.w * spr1.image.h > spr2.image.w * spr2.image.h ?  [spr1, spr2] : [spr2, spr1];
                        sprA.image.restore(false);

                        var count = 120;
                        var stopped = false;
                        const id = Math.random() * 100000 + 10000 | 0;
                        randomPackBusy = true;
                        heartBeat.registerBusyProcess(id, true, "Scatter");
                        system.addEvent("globalescape", stop);
                        timed();
                        function stop() {
                            stopped = true;
                            log.warn("Scatter filter stopped by global eascape");
                        }
                        function completed() {
                            heartBeat.registerBusyProcess(id, false);
                            API.imgPackScan.pastBottom = randomPackBusy = false;
                            sprA.image.processed = true;
                            sprA.image.lastAction = "Added image";
                            sprA.image.update();
                            system.removeEvent("globalescape", stop);

                        }
                        function timed() {
                            !stopped && API.spacedImages(sprA, sprB, rotate, 1 / scale, scale, failLimit, scan);
                            if (scan) {
                                busy.progress = API.imgPackScan.progress;
                                if (!API.imgPackScan.pastBottom && !stopped)  { setTimeout(timed, 4) }
                                else { completed() }
                            } else {
                                count --;
                                busy.progress = (120 - count) / 120;
                                if (count > 0 && !stopped) { setTimeout(timed, 4) }
                                else { completed() }
                            }
                        }
                    }
                }
            }


            
            var wfc;
            const extras = {
				foldInfo: {
					help: "All things image processing. Filters, Gif, Image Animation, Sprite sheets, WebGl filters",
					foldClass: "extrasImageProcessing",
				},
                
                tileExperiments: {
                    autoDefine: {
                        help : "Uses sprite names to automate tile sets.\nTile sprites are named 'Tiles'\nand tile px named `Tiles_px`",
                        call() {
                            API.tileSets.tiles = [...sprites]
                                .filter(spr => spr.type.image && spr.name === "Tiles")
                                .map((spr, idx) => ({
                                    spr,
                                    idx,
                                    above: [],
                                    right: [],
                                    below: [],
                                    left: [],
                                    same: [],
                                    px: [],
                                    
                                }));
                            if (API.tileSets.tiles.length === 0) { log.warn("Could not locate tiles"); return; }
                            API.tileSets.tilePx = undefined;
                            sprites.each(spr => {
                                if (spr.name === "Tiles_px" && spr.type.image && spr.image.isDrawable) {
                                    API.tileSets.tilePx = spr.image;
                                    return true;
                                }
                            });      
                            if (!API.tileSets.tilePx) { log.warn("Could not locate tile px set"); return; }
                            API.tileSets.mapping = [...sprites].filter(spr => spr.type.image && spr.name === "Mapping").map(spr => ({spr}));
                            API.tileSets.createTiles();   
                            log.info("Tile setter ready.");    
                            if (API.tileSets.mapping.length > 0) {
                                const collection = collections.getByName("TileSet_Mapping");
                                if (collection) { collections.delete(collection) }
                                collections.create(API.tileSets.mapping.map(({spr}) => spr), undefined, "TileSet_Mapping")
                                log.info("Created collection to hold tile relative mapping 'TileSet_Mapping'");    
                            }
                            if (API.tileSets.tiles.length) {
                                const collection = collections.getByName("TileSet_Tiles");
                                if (collection) { collections.delete(collection) }
                                collections.create(API.tileSets.tiles.map(({spr}) => spr), undefined, "TileSet_Tiles")                                
                                log.info("Created collection to hold tiles sprites 'TileSet_Tiles'");    
                            }
                        }
                    },
                    /*defineTilePixels: {
                        help : "Select image to represent pixels per tile",
                        call() {
                            if (selection.length > 1 || selection.length === 0) { log.warn("Select a drawable sprite"); return; }
                            const spr = selection[0];
                            if (!spr.type.image || !spr.image.isDrawable) {  log.warn("Selected spr must have a drawble image"); return; }
                            API.tileSets.tilePx = spr.image;
                            API.tileSets.createTiles();  
                        }
                    },
                    defineTiles: {
                        help : "Select all sprites that define the tile set",
                        call() {
                            API.tileSets.tiles = [...selection]
                                .filter(spr => spr.type.image)
                                .map(spr => ({
                                    spr,
                                    above: [],
                                    right: [],
                                    below: [],
                                    left: [],
                                    px: [],
                                    
                                }));
                             API.tileSets.createTiles();   
                        }
                    },
                    defineTileMapping: {
                        help : "Select tiles positioned to represent links",
                        call() {
                            API.tileSets.mapping = [...selection].filter(spr => spr.type.image).map(spr => ({spr}));
                            API.tileSets.createTiles();  
                        }
                    },  */
                    createTileView: {
                        help : "",
                        call() {
                            var count = 0, tries = 0;
                            if (API.tileSets.ready) {
                                if (!API.tileSets.busy) {
                                    API.tileSets.busy = true;
                                    API.tileSets.addedSpr.length = 0;
                                    if (API.tileSets.mapping === undefined) { API.tileSets.mapping = []; }
                                    selection.eachOfType(spr => {
                                        if (spr.image.isDrawable) {
                                            count ++;
                                            API.mapTileSet(spr);
                                        }
                                    }, "image");
                                    const isDone = () => {
                                        if (API.tileSets.addedSpr.length >= count) {
                                            selection.clear();
                                            selection.add(API.tileSets.addedSpr);
                                            API.tileSets.addedSpr.length = 0;
                                            API.tileSets.busy = false;
                                        } else if (tries++ < 1000) {
                                            setTimeout(isDone, 100);
                                        } else {
                                            log.warn("Tiles setter timed out");
                                            API.tileSets.busy = false;
                                        }
                                    
                                    }
                                    isDone();
                                } else {
                                    log.warn("TileSets busy.");
                                }
                            } else {
                                log.warn("Tile sets definision is not complete.");
                            }

                        }
                    },                        
                },   
                render : {
                    /*pixelArtLines : {
                        help : "Removes doubled pixels from pixel art lines",
                        call(){   utils.processSelectedImages(API.fixPixelArtLines )    }
                    },*/
                    fillTransparent : {
                        help : "Fills all transparent pixels with current main color for selected drawable images.",
                        call(){  utils.processSelectedImages(API.fillTransparentWithColor, colours.current)   },
                    },
                    fillWithColor : {
                        help : "Fills all pixels with current main color for selected drawable images.",
                        call(){  utils.processSelectedImages(API.fillWithColor, colours.current)   },
                    },
                    randomImagePack: {
                        showUsageHelp: {
                            help: "Displays usage help in log display",
                            call() {
                                log("-------------------------------------");
                                log("- Random Image Pack                 -");
                                log("-------------------------------------");
                                log("> Attach sprites to draw to a drawable sprite");
                                log("> Select the drawable sprite and a second ");
                                log("> drawable sprite. Then click one of ");
                                log(">");
                                log("> [Random Images No Rotate No Scale]");
                                log("> [Random Images Rotate No Scale]");
                                log("> [Random Images No Rotate Scale]");
                                log("> [Random Images Rotate Scale]");
                                log(">");
                                log("> The smaller of the two will be used as the");
                                log("> overlap mask. Higher resolution will will");
                                log("> result in closer better fits. The mask sprite");
                                log("> image content will be lost.");
                                log(">");
                                log("> To stop the process hit [ESCAPE] ");
                                log("-------------------------------------");
                            }

                        },
                        randomImagesNoRotateNoScale: {
                            help: "Fills selected image with images. Uses image linked to selected\nNo rotation, no scaling",
                            call() { randomPack(false, 1, 32, false) }
                        },
                        randomImagesRotateNoScale: {
                            help: "Fills selected image with images. Uses image linked to selected\nRotation, no scaling",
                            call() { randomPack(true, 1, 32, false) }
                        },
                        randomImagesNoRotateScale: {
                            help: "Fills selected image with images. Uses image linked to selected\nNo rotation, add Scaling",
                            call() { randomPack(false, 1.5, 32, false) }
                        },
                        randomImagesRotateScale: {
                            help: "Fills selected image with images. Uses image linked to selected\nRotation and scaling",
                            call() { randomPack(true, 1.5, 32, false) }
                        },
                        randomImagesNoRotateNoScaleScan: {
                            help: "Fills selected image with images. Uses image linked to selected\nNo rotation, no scaling",
                            call() { randomPack(false, 1, 32,"scan") }
                        },
                        randomImagesRotateNoScaleScan: {
                            help: "Fills selected image with images. Uses image linked to selected\nRotation, no scaling",
                            call() { randomPack(true, 1, 32, "scan") }
                        },
                        randomImagesNoRotateScaleScan: {
                            help: "Fills selected image with images. Uses image linked to selected\nNo rotation, add Scaling",
                            call() { randomPack(false, 1.5, 32, "scan") }
                        },

                        randomImagesRotateScaleScan: {
                            help: "Fills selected image with images. Uses image linked to selected\nRotation and scaling",
                            call() { randomPack(true, 1.5, 32, "scan") }
                        },
                    },
                    circleStyle: {
                        help : "Experiment fills image with circles",
                        call(){
                            var count = 0;
                            selection.eachImage((spr, img) => {
                                if (img.isDrawable) {
                                    API.createJob("circleStyle", img);
                                    count++;

                                }
                            });
                            if (count === 0) { log.warn("No drawable images selected") }
                        }

                    },
                    /*greenScreen: {
                        help : "Experiment with greem screen",
                        call(){  utils.processSelectedImages(API.greenScreen, false)   },
                    },*/
                    countPixels : {
                        help : "Count number of non transparent pixels in an image.",
                        call(){  utils.processSelectedImages(API.countPixels)   },
                    },                    
                    centerOfMass : {
                        help : "Locates and marks visual center of mass",
                        call(){  utils.processSelectedImages(API.centerOfMass)   },
                    },
                    mapImageToSphere : {
                        help : "Maps flat image to a sphere\nWill openo ptions dialog",
                        call(){
                            setTimeout(()=>commandLine("run safe sphereMap",true),0);
                        },
                    },
                    maximize: {
                        help : "Stretches values to full range",
                        call() {
                            var count = 0;
                            selection.eachImage((spr, img) => {
                                if (img.isDrawable) {
                                    API.createJob("applyStretchValue", img);
                                    count++;

                                }
                            });
                            if (count === 0) { log.warn("No drawable images selected") }
                        }
                    },
					gridOverlay: {
						help: "Adds numbers to on selected drawable grid sprite sheet.",
						call() { createSprites("gridoverlay") },
					},
                    tileSheets: {
                        exportTileMap: {
                            help: "If selected sprites contain any tile map sprites (TMS) this will export tile map",
                            call() {
								var count = 0;
								selection.eachOfType(spr => {
									if (spr.tileMap) {
										count ++;
										const map = spr.tileMap;
										var l = map.length;
										const bytes = new ArrayBuffer(l * 2 + 10)
										const byteBuf = new Uint8Array(bytes);
										const shortBuf = new Uint16Array(bytes);
										
										byteBuf[0] = "GMap".charCodeAt(0);
										byteBuf[1] = "GMap".charCodeAt(1);
										byteBuf[2] = "GMap".charCodeAt(2);
										byteBuf[3] = "GMap".charCodeAt(3);
										shortBuf[2] = map.cols;
										shortBuf[3] = map.rows;
										shortBuf[4] = 16;
										var i = 0;
										while (i < l) {
											shortBuf[5 + i] = map[i];
											i++;
										}
												 
										const anchor = document.createElement('a');
										const url = anchor.href = URL.createObjectURL(new Blob([bytes] ,{type: "application/octet-stream"}));
										anchor.download = spr.name + "_TileMap.bin";
										anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
										setTimeout(() => URL.revokeObjectURL(url) , 1000);
										log("Saving map '" + (spr.name + "_TileMap.bin") + "' " + map.cols + " by " + map.rows + " " + (map.cols * map.rows * 2 + 10) + " bytes");
									}
								}, "image");
								if (count === 0) {
									log.warn("No tile maps found in selected sprites");
								}

                            }

                        },
						dependentTileMapV2: {
                            help: "Same as next renderer [Tile Mapper] but keeps tile generation dependancy active",
                            call() {
                                extras.render.pixels.tileMapperV2.call(true);
                            }
                        },
                        tileMapperV2: {
                            help : "Creates tile map from pixel map\nFor more help see ref ImageProcessing.Render.Pixels.TileMapper",
                            call(dependency = false) {
							    const tiles = [];
							    selection.forEach(spr => {
								    if (!spr.type.image || !spr.image.desc.sprites) { log.warn("Selected sprite does not contaile sub/tile sprites"); return }
								    if (spr.attachers?.size !== 1) { log.warn("Can only use one attached tile color map sprite"); return }
								    const colMap = ([...spr.attachers.values()])[0];
								    if (!colMap.type.image || !colMap.image.isDrawable) { log.warn("First attached sprite is not a drawable image"); return }
								    if (colMap.attachers?.size !== 1) { log.warn("Color map does not have attached map sprite"); return }
								    const mapSpr = ([...colMap.attachers.values()])[0];
								    if (!mapSpr.type.image || !mapSpr.image.isDrawable) { log.warn("Map sprite is not a drawable image"); return }
									var mapped;
									if (mapSpr.attachers?.size === 1) {
										 mapped = ([...mapSpr.attachers.values()])[0];
										 if (!mapped.type.image || !mapped.image.isDrawable) { mapped = undefined }
										 else { mapped = mapped.image }
									}
									const tiled = API.tileMapperV2(spr, colMap, mapSpr, mapped)[0];
								    tiles.push(tiled);
									if (dependency) {
										const tiledImage = mapped ?? tiled.image;
										const updateTileMap = () => API.tileMapperV2(spr, colMap, mapSpr, mapped);
										mapSpr.image.addDependent(tiledImage, updateTileMap);
										colMap.image.addDependent(tiledImage, updateTileMap);
										spr.image.addDependent(tiledImage, updateTileMap);									
										log.info("Added dependency");
									}
							    });
							    if (tiles.length) {
								    selection.clear();
								    selection.add(tiles);
								    utils.tidyWorkspace();								  
									log("Tile mapper completed task");
							    } else {
									log.warn("No mapping sprites selected");
								}
								   
							}
						},
						/*tileConnectMap: {
							help: "Creates a tile connection map based on join colors",
							call() {
								const maps = [];
								selection.eachOfType(spr => {
									if (spr.image.isDrawable) { maps.push(spr) }
								},"image");
								if (maps.length > 0) {
									var idx = 0;
									if (maps.some((spr, i) => {
										if (spr.image.desc.gridSubSprites) {
											idx = i;
											return true;
										}
									})) {
										maps.unshift(maps.splice(idx, 1)[0]);
										API.createTileConnectMap.sets = API.createTileConnectMap(maps);


										log.info("Created connect map");
											
									} else { log.warn("Select at least one image must be a tile sheet") }
								} else { log.warn("Select at least one drawable image sprite") }
								
							}
						},*/
						HelpForMapppingHelpAndBuildTileMap: {
							help: "Click to get help on 'Tile mapping' and 'Build tile map'",
							call() {
								log.info(".");
								log.info(".");
								log("=================================================");
								log("- Help for 'Tile mapping' and 'Build tile map'");
								log("-------------------------------------------------");
								log("- ");
								log("- Tile mapping: Defines a 'tile mapping sprite' (TMgS)");
								log("- Selecte a drawable sprite matching a scaled");
								log("- pixel size of the tile sheet you want to map");
								log("- Eg a tile sheet 8 by 8 32px (256 by 256) tiles");
								log("-    can be mapped as a 8 by 8 4px (32 by 32");
								log("-    image where 4 by 4 pixel represents each");
								log("-    tile.");
								log("- ");
								log("- Use 'Image processing->Extract->Tile sheet'");
								log("- to define the selected sprite as a tile sheet");
								log("- Click '->Render->Tile sheets->Tile Mapping'");
								log("- to define the selected sprite as the TMgS.");
								log("- ");
								log("-------------------------------------------------");
								log("- ");
								log("- Build Tile Map: Creates a 'tile map sprite' (TMS)");
								log("- Selected a drawable sprite matching the size");
								log("- of the tile map to create times the size of the");
								log("- TMgS you want to map");
								log("- Eg If TMgS is 4 by 4 px and your map wants to ");
								log("-   be 16 by 8 tiles then the TMS should ");
								log("-   be 16 * 4 by 8 * 4 (64 by 32px) ");
								log("- ");
								log("- Use 'Image processing->Extract->Tile sheet'");
								log("- to define the TMS as a 4 by 4 tile sheet.");
								log("- (matching the currently defined 'TMgS'.");
								log("- ");
								log("- Link a tile sheet to the TMS.");
								log("- ");
								log("- Click '->Render->Tile sheets->Build tile map'");
								log("- A new sprite and media entry is created showing the ");
								log("- tile map containg pixels from the tile sheet");
								log("- for each tile that best match the TMgS tiles.");
								log("- ");
								log("- The tile map pxs are dependent on the TMS image");
								log("- and will update automaticly when the TMS image is");
								log("- changed (Eg drawing on it)");
								log("- ");
								log("-------------------------------------------------");
								log("- Note 1: The TMgS and TMS mapping and map settup are");
								log("-          not saved in PainterV3 downloads ");
								log("- Note 2: The built tile map can be exported as a binary");
								log("-         From '->Tile sheets->Export tile map' while the");
								log("-         TMS sprite is selected.");
								log("- Note 3: Map tile max unique tiles is 16bit ");
								log("=================================================");
							}
							
						},
						tileMappping: {
							help: "Creates a tile shapes map",
							call() {
								const map = selection[0];
								if (map && map.type.image && map.image.isDrawable) {
									if (map.image.desc.gridSubSprites) {

										API.createTileConnectMap.mapping = API.createTileMapping(map);
										log.info("Created mapping");
									} else { log.warn("Select at least one image must be a tile sheet") }
								} else { log.warn("Select at least one drawable image sprite") }
								
							}
						},
						buildTileMap: {
							help: "Builds a tile grid from created tile mapping.`	`",
							call() {
								if (API.createTileConnectMap.mapping) {
									if (selection.length === 1) {
										const map = selection[0];
										if (map.image.isDrawable) {
											if (map.image.desc.gridSubSprites) {
												if (map.linkers?.size === 1) {
													const sheet = ([...map.linkers.values()])[0];
													if (sheet.image?.desc?.gridSubSprites) {
														const mappedImgSpr = sheet.linkers?.size === 1 ? ([...sheet.linkers.values()])[0] : undefined
														const m = API.buildConnectedMap(map, sheet, API.createTileConnectMap.mapping, mappedImgSpr)[0];
														
														
														
														const updateTileMap = () => API.buildConnectedMap(map, sheet, API.createTileConnectMap.mapping, m);
														const tiledImage = m.image;
														map.image.addDependent(tiledImage, updateTileMap);
														sheet.image.addDependent(tiledImage, updateTileMap);
																							
														log.info("Added dependency");														
														
														
													} else { log.warn("Attached tile sheet must have grid defined.") }
												} else { log.warn("Map must have attached tile sheet image.") }
											} else { log.warn("Map must be tile sheet.") }
										} else { log.warn("Map must be drawable.") }
									} else { log.warn("Select one map at a time.") }
								} else { log.warn("No set defined. Use tileMappping to define tile mapping") }
								
							}
						},							
                        removeIdenticalTiles : {
                            help : "Removes duplicated tiles",
                            call(){   utils.processSelectedImages(API.removeIdenticalTiles)    }
                        },
						/*dependentTileMap: {
                            help: "Same as next renderer [Tile Mapper] but keeps tile generation dependancy active",
                            call() {
                                extras.render.pixels.tileMapper.call(true);
                            }
                        },
                        tileMapper: {
                           help : "Creates tile map from pixel map\nFor more help see ref ImageProcessing.Render.Pixels.TileMapper",
                           call(dependent = false) {
                                if (selection.length === 1) {
                                    const spr = selection[0];
                                    if (spr.type.image && spr.image.desc.sprites) {
                                        if (spr.attachers?.size === 1) {
                                            const colMap = ([...spr.attachers.values()])[0];
                                            if (colMap.type.image && colMap.image.isDrawable) {
                                                if (colMap.attachers?.size === 1) {
                                                    const mapSpr = ([...colMap.attachers.values()])[0];
                                                    if (mapSpr.type.image && mapSpr.image.isDrawable) {
                                                        if (mapSpr.attachers?.size > 0) {
                                                            const warn = new Set();
                                                            const layouts = [...mapSpr.attachers.values()].filter(s => {
                                                                    if (s.type.image && s.image.isDrawable) {
                                                                        if (s.attachers?.size) {
                                                                            var c = 0;
                                                                            for (const mapping of s.attachers.values()) {
                                                                                if (mapping.type.image && mapping.image.isDrawable) { c ++ }
                                                                            }
                                                                            if (c) { return true }
                                                                            else { warn.add("Some mappings sprites  are not drawable images") }
                                                                        } else { warn.add("Some layout do not have attached tile mappings") }
                                                                    } else { warn.add("Some layout sprites are not drawable images") }
                                                                });
                                                            if (layouts.length) {
                                                                warn.clear();
                                                                const tiles = API.tileMapper(spr, colMap, mapSpr, layouts);
                                                                if (dependent) {
                                                                    const tiledImage = tiles[0].image;
                                                                    const updateTileMap = () => API.tileMapper(spr, colMap, mapSpr, layouts, true, tiles[0].image, true);
                                                                    mapSpr.image.addDependent(tiledImage, updateTileMap);
                                                                    colMap.image.addDependent(tiledImage, updateTileMap);
                                                                    spr.image.addDependent(tiledImage, updateTileMap);
																	log("Tile dependency updated");


                                                                } else {


                                                                    if (tiles.length) {
                                                                        selection.clear();
                                                                        selection.add(tiles);
                                                                        utils.tidyWorkspace();
                                                                        log("Tile mapper completed task");
                                                                    } else {
                                                                        log.warn("Tile mapper completed task but did not add tiles to workspace");
                                                                    }
                                                                }
                                                            } else {
                                                                log.warn("No layout sprite could be found. Reasons...");
                                                                for (const w of warn.values()) { log.warn(w) }
                                                            }
                                                        } else { log.warn("Map sprite has no attached layout sprites") }
                                                    } else { log.warn("Map sprite is not a drawable image") }
                                                } else { log.warn("Color map does not have attached map sprite") }
                                            } else { log.warn("First attached sprite is not a drawable image") }
                                        } else { log.warn("Can only use one attached tile color map sprite") }
                                    } else { log.warn("Selected sprite does not contaile sub/tile sprites") }
                                } else { log.warn("Select one sprite") }
                           }
                        },*/
					},
					pixels: {
					   pixelArtFindReplaceSubImage: {
                            help : "finds sub images and replaces with new sub image",
                            call() {
                                if (selection.length === 1) {
                                    let update = false;
                                    const spr = selection[0];
                                    if (spr.type.image) {
                                        spr.image.restore(false);
                                        if (spr.attachers) {
                                            let messages = [];
                                            for (const find of spr.attachers.values()) {
                                                if (find.type.image) {
                                                    if (find.attachers) {
                                                        const replace = [...find.attachers.values()].filter(spr => spr.type.image && spr.image.isDrawable);
                                                        if (replace.length) {
                                                            API.pixelArtSubImageAlignment = 1;
                                                            utils.processImageNoUpdate(API.pixelArtSubImageReplace, spr, true, true, find, ...replace);
                                                            update = true;
                                                        } else { messages.push("No Attached replacements ") }

                                                    } else { messages.push("Attached missing attached replacement spr") }

                                                } else { messages.push("Attached not an image") }

                                            }
                                            if (messages.length) {
                                                while (messages.length) {
                                                    log.warn(messages.shift());
                                                }
                                            }
                                            if (update) {
                                                spr.image.processed = true;
                                                spr.image.lastAction = "Img find replace";
                                                spr.image.update();
                                                sprites.each(s => { if(s.type.image && s.image === spr.image) { s.imageResized(true) } });
                                                utils.tidyWorkspace();
                                            }
                                        } else { log.warn("Selected sprite does have attached sprites") }
                                    } else { log.warn("Selected sprite does not contain an image") }
                                } else if (selection.length > 1) {
                                    log.warn("Find replace only 1 selected sprite at a time");
                                } else {
                                    log.warn("Can not find replace nothing selected");
                                }
                            }
                        },
					   pixelArtFindReplaceImageAlign4: {
                            help : "Finds sub images and replaces with new sub image. Aligns to 4 by 4 pixel grid",
                            call() {
                                if (selection.length === 1) {
                                    let update = false;
                                    const spr = selection[0];
                                    if (spr.type.image) {
                                        spr.image.restore(false);
                                        if (spr.attachers) {
                                            let messages = [];
                                            for (const find of spr.attachers.values()) {
                                                if (find.type.image) {
                                                    if (find.attachers) {
                                                        const replace = [...find.attachers.values()].filter(spr => spr.type.image && spr.image.isDrawable);
                                                        if (replace.length) {
                                                            API.pixelArtSubImageAlignment = 4;
                                                            utils.processImageNoUpdate(API.pixelArtSubImageReplace, spr, true, true, find, ...replace);
                                                            update = true;
                                                        } else { messages.push("No Attached replacements ") }

                                                    } else { messages.push("Attached missing attached replacement spr") }

                                                } else { messages.push("Attached not an image") }

                                            }
                                            if (messages.length) {
                                                while (messages.length) {
                                                    log.warn(messages.shift());
                                                }
                                            }
                                            if (update) {
                                                spr.image.processed = true;
                                                spr.image.lastAction = "Img find replace";
                                                spr.image.update();
                                                sprites.each(s => { if(s.type.image && s.image === spr.image) { s.imageResized(true) } });
                                                utils.tidyWorkspace();
                                            }
                                        } else { log.warn("Selected sprite does have attached sprites") }
                                    } else { log.warn("Selected sprite does not contain an image") }
                                } else if (selection.length > 1) {
                                    log.warn("Find replace only 1 selected sprite at a time");
                                } else {
                                    log.warn("Can not find replace nothing selected");
                                }
                            }
                        },                        
                        pixelArtLines : {
                            help : "Reduces low color transparent images to single pixel lines",
                            call(){   utils.processSelectedImages(API.fixPixelArtLinesV2 )    }
                        },
                        pixelPlugHolesLevel1 : {
                            help : "Closes holes in pixel art lines up to 1 pixel wide",
                            call(){   utils.processSelectedImages(API.pixelPlugHoles, 1)    }
                        },
                        pixelPlugHolesLevel2 : {
                            help : "Closes holes in pixel art lines up to 2 pixels wide",
                            call(){   utils.processSelectedImages(API.pixelPlugHoles, 2)    }
                        },
                        pixelPlugHolesLevel3 : {
                            help : "Closes holes in pixel art lines up to 3 pixel wide",
                            call(){   utils.processSelectedImages(API.pixelPlugHoles, 3)    }
                        },
                        pixelShuffle : {
                            help : "Randomly shuffles pixels",
                            call(){   utils.processSelectedImages(API.pixelShuffle)    }
                        },
                        pixelMap : {
                            help : "Map pixels",
                            call(){   utils.processSelectedImages(API.pixelMap, selection[1].image)    }
                        },
                    },
                    RGBA_Functions: {
                        channels : {
                            help : "Runs a batch that lets you modify channels of selected images",
                            call(){ setTimeout(()=>commandLine("run safe imageProcessing",true),0) }
                        },
                        rgbToAlpha : {
                            help : "Sets alpha to mean of RGB channel for selected drawable images",
                            call(){  utils.processSelectedImages(API.channelCopy, API.pixelFunctions.meanRGB, API.pixelFunctions.moveR2A )   },
                        },
                        RGB_2_HSL : {
                            help : "Converts pixels to HSL and pputs values in RGB channels",
                            call(){  utils.processSelectedImages(API.RGB2HSL)   },
                        },
                        invert_RGB : {
                            help : "Inverts RGB channels for selected drawable images",
                            call(){  utils.processSelectedImages(API.invertRGB )   },
                        },
                        invertAlpha : {
                            help : "Inverts Alpha channel for selected drawable images",
                            call(){  utils.processSelectedImages(API.invertAlpha )   },
                        },
                        alphaCutSmooth : {
                            help : "Use main alpha value to zero alpha below that value\nBlends alphas below cutoff to maintain antialias",
                            call(){  utils.processSelectedImages(API.alphaCutOff )   },
                        },
                        alphaCutTop: {
                            help : "Use main alpha value to zero alpha below that value\nand values above set to 1",
                            call(){  utils.processSelectedImages(API.alphaCutOff, false, true)   },
                        },
                        alphaCut: {
                            help : "Use main alpha value to zero alpha below that value",
                            call(){  utils.processSelectedImages(API.alphaCutOff, false)   },
                        },
                    },
                    heightMaps: {
                        heightToNormalMap: {
                            help : "Converts height map to normal map",
                            call(){  utils.processSelectedImages(API.normalMap)   },
                        },
                        normal_Map_From_HSL: {
                            help : "Creates HSL normal map. Red 45deg up 60CW 90deg steps. Lum 30-50, 90deg to  45Deg, Lum 50-70 45deg to flat",
                            call() {  utils.processSelectedImages(API.normalMap, "HSL")   },
                        },

                        heightToNormalMapSmooth: {
                            help : "Converts height map to normal map\nNormal computed from 2 pixel square",
                            call(){  utils.processSelectedImages(API.normalMap, "smooth")   },
                        },
                    },
                    I_S_O_experiments: {
                        defineISOPlan: {
                            help : "Set image that defines the 6 faces of the box\nRed is x, Green is y, and blue is z.",
                            call() {
                                utils.processSelectedImages(API.defineISOPlan);
                                API.ISO.plan.spr = selection[0];
                            }
                        },
                        defineISOView: {
                            help : "Set image that defines the 6 faces as projected view",
                            call() {
                                utils.processSelectedImages(API.defineISOView );
                                API.ISO.view.spr = selection[0];
                            }
                        },  
                        createISOView: {
                            help : "Creates view from sprite over iso plan",
                            call() {
                                if (API.ISO.busy) { log.warn("ISOView is busy"); return; }
                                API.ISO.busy = true;
                                if (API.ISO.addedSpr === undefined) { API.ISO.addedSpr = []; }
                                var count = 0;
                                for (const spr of selection) {
                                    if (spr.type.image) {
                                        API.createISOView(spr);
                                        count ++;
                                    }
                                    
                                }
                                const cleanUp = () => {
                                    if (API.ISO.addedSpr.length >= count) {
                                        selection.clear(true);
                                        selection.add(API.ISO.addedSpr);
                                        API.ISO.addedSpr.length = 0;
                                        issueCommand(commands.edSprClip);
                                        API.ISO.busy = false;
                                        
                                        
                                        return;
                                    }
                                    log("!");
                                    setTimeout(cleanUp, 100);
                                }
                                setTimeout(cleanUp, 100);
                            }
                        },                        
                    },
                 
                    
                    applyPallets : {
                        applyPallet : {
                            help : "Applys pallet to image not dithering. Must have a drawable image and pallet selected.",
                            call(){
                                localProcessImage.palletApplyValues = "No Dither";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                        palletPixelCounts : {
                            help : "Sorts pallet by closest pixel color counts.",
                            call(){
                                const pIdx = selection.eachOfType(spr => true, "pallet");
                                if (pIdx !== undefined) {
                                    const pallet = selection[pIdx].pallet;
                                    const iIdx = selection.eachOfType(spr => spr.image.isDrawable, "image");
                                    if (iIdx !== undefined) {
                                        const image = selection[iIdx];
                                        const palletLookup = pallet.getLookup();
                                        function done(owner, eName, data) {
                                            if(data[0] === id) {
                                                if (data[1]) {
                                                    pallet.sortUsing(data[1]);
                                                    log.info("Counting complete");

                                                } else {
                                                    log.warn("Pallet pixel count failed");
                                                }
                                                localProcessImage.removeEvent("workercomplete", done);
                                            }

                                        }

                                        localProcessImage.addEvent("workercomplete", done);
                                        const id = localProcessImage.createJobInspect("countPalletPixels", image.image, "RGB linear No Dither", palletLookup, "");
                                        log.info("Counting colors");
                                    }  else { log.warn("No drawable image selected") }
                                } else { log.warn("No pallet selected") }

                            }
                        },
 /*                       applyPalletHue : {
                            help : "Experimental, attempts to limit hue bleeding.",
                            call(){
                                localProcessImage.palletApplyValues = "No Dither Match Hue";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },*/
                        useYIQColorLookup: {
                            help : "Uses YIQ NTSC color model to lookup colors",
                            call(){
                                localProcessImage._palletModel = "YIQ ";
                                log("Pallet lookup set to YIQ.");
                            }
                        },
                        useRGBsColorLookup: {
                            help : "Uses RGBs (approx) color model to lookup colors",
                            call(){
                                localProcessImage._palletModel = "RGB linear ";
                                log("Pallet lookup set to RGBs linear.");
                            }
                        },
                        applyPalletRandomDither : {
                            help : "Applys pallet to image with random dithering. Must have a drawable image and pallet selected.",
                            call(){
                                localProcessImage.palletApplyValues = "random dither";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                        applyPalletOrderedDither2 : {
                            help : "Applys pallet to image with ordered dither 2 by 2",
                            call(){
                                localProcessImage.palletApplyValues = "ordered dither 2";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                        applyPalletOrderedDither3 : {
                            help : "Applys pallet to image with ordered dither 3 by 3",
                            call(){
                                localProcessImage.palletApplyValues = "ordered dither 3";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                        applyPalletOrderedDither4 : {
                            help : "Applys pallet to image with ordered dither 4 by 4",
                            call(){
                                localProcessImage.palletApplyValues = "ordered dither 4";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                        applyPalletOrderedDither5 : {
                            help : "Applys pallet to image with with repeated 5 by 5 dither pattern. Dither is randomized at startup",
                            call(){
                                localProcessImage.palletApplyValues = "ordered dither 5";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                        applyPalletErrorDiffusion : {
                            help : "Applys pallet to image using modified Floyd Steinberg error diffusion",
                            call(){
                                localProcessImage.palletApplyValues = "FloydSteinberg";
                                setTimeout(()=>commandLine("run safe applyPalletToImage",true),0)
                            }
                        },
                    },
                },
                Web_GL_Filters : webGLFilterMenus.extras,
                resize : {
                    clipTransparent : {
                        help : "Resizes image removing transparent edges to selected drawable images",
                        call(){ issueCommand(commands.edSprClip) },
                    },
					padColor: {
                        padPixel : {
                            help : "Adds 1 pixel to each side of selected drawable images\nPad color from main color",
                            call(){ pads(colours.mainColor.css,1,1,1,1) },
                        },
                        padPixelTop : {
                            help : "Adds 1 pixel to each side of selected drawable images\nPad color from main color",
                            call(){ pads(colours.mainColor.css,1,0,0,0) },
                        },
                        padPixelBottom : {
                            help : "Adds 1 pixel to each side of selected drawable images\nPad color from main color",
                            call(){  pads(colours.mainColor.css,0,0,1,0)  },
                        },
                        padPixelLeft : {
                            help : "Adds 1 pixel to each side of selected drawable images\nPad color from main color",
                            call(){  pads(colours.mainColor.css,0,0,0,1) },
                        },
                        padPixelRight : {
                            help : "Adds 1 pixel to each side of selected drawable images\nPad color from main color",
                            call(){ pads(colours.mainColor.css,0,1,0,0) },
                        },
					},
                    padTransparent : {
                        padTransparent : {
                            help : "Adds 25% to height and width as transparent pixels to selected drawable images",
                            call(){ issueCommand(commands.edSprPad)  },
                        },
                        padPixelTransparent : {
                            help : "Adds 1 transparent pixel to each side of selected drawable images",
                            call(){ pads(0,1,1,1,1) },
                        },
                        padPixelTop : {
                            help : "Adds 1 transparent pixel to each side of selected drawable images",
                            call(){ pads(0,1,0,0,0) },
                        },
                        padPixelBottom : {
                            help : "Adds 1 transparent pixel to each side of selected drawable images",
                            call(){  pads(0,0,0,1,0)  },
                        },
                        padPixelLeft : {
                            help : "Adds 1 transparent pixel to each side of selected drawable images",
                            call(){  pads(0,0,0,0,1) },
                        },
                        padPixelRight : {
                            help : "Adds 1 transparent pixel to each side of selected drawable images",
                            call(){ pads(0,0,1,0,0) },
                        },
                    },
                    Double_EPX : {
                        help : "Doubles image size via EPX method\nFor use with pixel art images.",
                        call(){  utils.processSelectedImages(API.doubleBitmapEPX)   },
                    },
                    Double_EPX_soft : {
                        help : "Doubles image size via modified EPX method\nFor use with pixel art images.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, false)   },
                    },
                    Load_EPS_mapped_data : {
                        help : "Doubles image size via mapped EPS (modified EPX) \nFor use with pixel art images.",
                        call(listItem){  
                            utils.processSelectedImages(API.EPSMapped, listItem.element);   
                            
                        },
                    },                   
                   Double_EPX_soft_color_64 : {
                        help : "Doubles image size via modified EPX method\nFor use  photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, false, 64)   },
                    },
                   Double_EPX_soft_color_128 : {
                        help : "Doubles image size via modified EPX method\nFor use  photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, false, 128)   },
                    },
                   Double_EPX_soft_color_148 : {
                        help : "Doubles image size via modified EPX method\nFor use  photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, false, 148)   },
                    },
                   Double_EPX_soft_color_196 : {
                        help : "Doubles image size via modified EPX method\nFor use  photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, false, 196 )   },
                    },
                    Double_EPX_soft_fix : {
                        help : "Doubles image size via modified EPX method\nWith post process to remove artifacts\nFor use with pixel art images.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, true)   },
                    },
                    Double_EPX_soft_fix_color_64 : {
                        help : "Doubles image size via modified EPX method\nWith post process to remove artifacts\nFor use with photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, true, 64)   },
                    },
                    Double_EPX_soft_fix_color_128 : {
                        help : "Doubles image size via modified EPX method\nWith post process to remove artifacts\nFor use with photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, true, 128)   },
                    },
                    Double_EPX_soft_fix_color_148 : {
                        help : "Doubles image size via modified EPX method\nWith post process to remove artifacts\nFor use with photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, true, 148)   },
                    },
                    Double_EPX_soft_fix_color_196 : {
                        help : "Doubles image size via modified EPX method\nWith post process to remove artifacts\nFor use with photo like image.",
                        call(){  utils.processSelectedImages(API.doubleBitmapSoft, true, 196)   },
                    },
                    highQualityDownSample : {
                        help : "Down samples image to match the resolution with its display size. Recomended for reduction 1/2 or greater ",
                        call(){
                            if (selection.length === 1) {
                                if (selection[0].type.image) {
                                    let spr = selection[0];
                                    const w = spr.w * spr.sx | 0;
                                    const h = spr.h * spr.sy | 0;
                                    if (w > 0 && h > 0) {
                                        if (w <= spr.image.w * 0.5 && h <= spr.image.h * 0.5) {
                                            selection.clear();
                                            selection.add(spr);

                                            editSprites.copySelectedSprites(false, false, false);
                                            spr = selection[0];
                                            spr.sx  = 1;
                                            spr.sy  = 1;
                                            spr.key.update();
                                            utils.processSelectedImages(API.downSampleBitmap,w,h);
                                        } else {
                                            log.warn("Down sample sprite must be at least 1/2 the size of the image resolution");
                                        }

                                    } else {
                                        log.warn("Sprite is too small to fit any pixels");
                                    }
                                } else {
                                    log.warn("first selected sprite is not an image");
                                }
                            } else {
                                log.warn("Currently this action can only be performed on one sprite at a time");
                            }
                        }
                    },
                    highQualityReduce : {
                        help : "Halves the image size using high quality algorthm of selected drawable images",
                        call(){ utils.processSelectedImages(API.halfSizeBitmap) }
                    },
                    highQualityDouble : {
                        help : "Doubles image size using high quality algorthm of selected drawable images",
                        call(){ utils.processSelectedImages(API.doubleBitmapQuality) }
                    },
                    /*pixelArtHalfSizeDarkVertical : {
                        help : "Halves selected image verticaly selecting darkest color",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearestDom, true, true) }
                    },
                    pixelArtHalfSizeDarkHorizontal : {
                        help : "Halves selected image horizontaly selecting darkest color",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearestDom, false, true) }
                    },
                    pixelArtHalfSizeLightVertical : {
                        help : "Halves selected images horizontaly selecting lightest color",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearestDom, true, false) }
                    },
                    pixelArtHalfSizeLightHorizontal : {
                        help : "Halves selected images horizontaly selecting lightest color",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearestDom, false, false) }
                    },
                    pixelHalfHorizontal : {
                        help : "Halves selected images width selecting nearest pixel",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearest, false, true) }
                    },
                    pixelHalfVert : {
                        help : "Halves selected images height selecting nearest pixel",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearest, true, false) }
                    },*/
                    pixelHalfDark : {
                        help : "Halves selected images selecting nearest pixel keeping darkest lines",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearest, true) }
                    },
                    pixelHalfLight : {
                        help : "Halves selected images selecting nearest pixel keeping lightest lines",
                        call(){ utils.processSelectedImages(API.halfSizeBitmapNearest, false) }
                    },
                    pixelCutReduce : {
                        help : "Reduces selected image width by 1 pixel by removing a line of least change",
                        call(){ utils.processSelectedImages(API.pixelCut, 1) }
                    },
                    /*carve : {
                        help : "Experimental image reducer",
                        call(){
                            utils.processSelectedImages(API.carve, 1,1);
                            return;
                            if (selection.length === 1) {
                                if (selection[0].type.image) {
                                    let spr = selection[0];
                                    const w = spr.w * spr.sx | 0;
                                    const h = spr.h * spr.sy | 0;
                                    if (w > 0 && h > 0) {
                                        if (w < spr.image.w || h < spr.image.h) {
                                            spr.sx  = 1;
                                            spr.sy  = 1;
                                            spr.key.update();
                                            utils.processSelectedImages(API.carve, w, h);
                                        } else { log.warn("Sprite must be at least 1 pixel smaller than image") }
                                    } else { log.warn("Sprite is too small to fit any pixels")  }
                                } else { log.warn("first selected sprite is not an image") }
                            } else { log.warn("Currently Carve is limited to one sprite at a time") }

                        }
                    },*/
                },
                extract : {
                    pallet : {
                        help : "Runs batch to creates a pallet sprite from selected image",
                        call(){ setTimeout(()=>commandLine("run safe quantImage",true),0) }
                    },
                    pixelArtPallet : {
                        help : "For use on images with 256 or less colors",
                        call(){
                            const pallets = [];
                            utils.processSelectedImagesCallback(API.getPxArtColors, pallet => {
                                pallets.push(pallet);
                            });
                            selection.setSilent(true);
                            for (const pallet of pallets) {
                                issueCommand(commands.edSprCreatePallet);
                                selection[0].pallet = pallet;
                                selection[0].pallet.clean();
                                selection[0].setScale(8,8);
                            }
                            selection.setSilent(false);
                            issueCommand(commands.edSprUpdateAll);
                        }
                    },
                   /* vectors : {
                        help : "Create a vector image from selected\nUses main colour as pixel source\nVector props in Sprites>Properties>Vector",
                        call(){
                            const paths = utils.processSelectedImagesCallback(API.imageToVectorPaths, (pathStr, img) => {
                                const shape = new Sprite(0,0,img.w,img.h,"Vector");
                                shape.color = colours.mainColor.css;
                                sprites.add(shape);
                                media.create({ type : "vector", width : img.w, height : img.h, pathStr, fromImage : img },
                                    (vec) => {
                                        shape.changeToShape("Shape","vector", vec);
                                        //shape.changeToVector("Vector",vector);
                                        setTimeout(() => {
                                            selection.clear();
                                            selection.add(shape);
                                        },0);
                                    }
                                );
                                return true;
                            },colours.mainColor, 32);
                        }
                    },*/
                   /* corners : {
                        help : "Detects features in the image that resemble corners",
                        call() { utils.processSelectedImages(API.harrisCornerDetect)  }
                    },*/
					spriteCollisionBounds : {
						help: "Create a radial collision map of sprites and download it as JS",
						call(){
						    var allGood = false;
							selection.each(spr => {
								if(spr.type.image && spr.image.desc.sprites) { allGood = true }
							});
							if (!allGood) { log.warn("No images selected contain sprites!"); return; }
							var options = buttons.quickMenu( "Select number of steps|OK,Cancel|{,8,12,16,24,32,48,64,}");
							options.onclosed = () => {
								if(options.exitClicked !== "Cancel"){
									setTimeout(() => {
										const steps = Number(options.optionClicked);
										options = buttons.quickMenu( "Show result in image|Yes,No,Cancel|text Adds white pixel at found points\\?");
										options.onclosed = () => {
											if(options.exitClicked !== "Cancel"){
												const showResults = options.exitClicked === "Yes";
												setTimeout(() => {
													options = buttons.quickMenu( "Save data when done|Save,No,Cancel|text Do you wish to save the created sprite list\\?");
													options.onclosed = () => {
														if(options.exitClicked !== "Cancel"){
															const saveResults = options.exitClicked === "Save";
															utils.processSelectedImages(API.subSpriteRadialCollisionMap, {steps, showResults, saveResults});
														}
													};
												},0);
											}
										};
									},0);
								}
							};
						}
					},
                    /*spritesBoxed : {
                        help : "Create a packed sprite sheat from selected images\nSprites are marked by bounding box",
                        call(){ createSprites("box") }
                    },
                    spritesSideMarked : {
                        help : "Create a packed sprite sheat from selected images\nTop and/or left edge is marked with sprite right and bottom",
                        call(){ createSprites("sides") }
                    },*/
                    spriteSheet : {
                        help : "Create Sprite sheet from selected images\nSprite are defined by connected pixels",
                        call(){ createSprites("free") }
                    },
                    spritesSheetBoxed : {
                        help : "Create Sprite sheets from selected images\nSprites are marked by bounding box",
                        call(){ createSprites("box") }
                    },
                    tileSheet : {
                        help : "Creates a tile sheet from selected images\nTiles are added to workspace when done",
                        call(){ createSprites("grid") }
                    },

                    imageValue : {
                        help : "Logs a metric of image brightness",
                        call(){
                            selection.eachOfType(spr => {
                                if(spr.image.isDrawable){
                                    log("Bright = " + API.calcImageValueMetric(spr.image));
                                }
                            },"image");

                        }
                    }
                },
                utilities : {
                    GIF_Creator : {
                        help : "Opens dialog used to create and save animated GIFs",
                        call(){ setTimeout(()=>commandLine("run safe GifCreatorDialog",true),0) }
                    },
                    animationCapture : {
                        help : "Opens dialog used to capture animations as a set of still frames",
                        call(){ setTimeout(()=>commandLine("run safe AnimationCapture",true),0) }
                    },
                    ProfileShader: {
                        help : "Create a shading map from an image representing profile",
                        call()  {                               
                            selection.eachOfType(spr => {
                                if(spr.image.isDrawable){
                                    API.shadeProfile(spr);
                                }
                            }, "image");  
                        }                        
                        
                    },
                    Image_To_JS_Map : {
                        help : "Converts image to Javascript character map object (like tile map)",
                        call(){   utils.processSelectedImages(API.imageToCharMap)    }
                    },
					Image_To_Bin16_file: {
						help: "Save selected as unsigned 16bit bin file\nRight click to see detailed help!",
						call() {
							if ((mouse.oldButton & 4) === 4) {
								callHelp("Image To Bin16 file", API.imageToBin16Help);
							} else {
								if (selection.length > 0) {
									selection.eachOfType(spr => { API.imageToBin16(spr) }, "image");
								} else {
									log.warn("Select at least 1 drawable sprite");
								}
							}
						}
					},
                    Image_To_JS_Binary_Map : {
                        help : "Converts image to Javascript binary map for 1 color images",
                        call(){   utils.processSelectedImages(API.imageToBinary)    }
                    },
                    Save_Sprite_Coords : {
                        help : "Saves an array of selected sprite positions",
                        call(){
                            if(selection.length > 0){
                                var str = "const sprites = [\n";
                                selection.each(spr => {
                                    str += `    {x: ${spr.x - spr.w * spr.sx / 2},y: ${spr.y - spr.h * spr.sy / 2},w: ${spr.w * spr.sx},h: ${spr.h * spr.sy}},  // ${spr.type.image ? spr.image.desc.name : ""}\n`;
                                });
                                str += "]\n";
                                downloadText(str,"spriteMap.js");

                            }else{
                                log.info("No sprites selected");
                            }
                        }
                    },
                    Save_Selected_Sprites : {
                        help : "Basic save of sprites",
                        call(){
                            if(selection.length > 0){
                                const spriteArr = [];

                                selection.each(spr => {
                                    var type = spr.type.image ? "image" : "";
                                    type = spr.type.cutter ? "cutter" : type;
                                    const s = {
                                        type,
                                        x : spr.x,
                                        y : spr.y,
                                        w : spr.w,
                                        h : spr.h,
                                        sx : spr.sx,
                                        sy : spr.sy,
                                        rx : spr.rx,
                                        ry : spr.ry,
                                    };
                                    if(spr.type.image){
                                        s.src = spr.image.src;
                                    }
                                    spriteArr.push(s);
                                });
                                const ss = {
                                    sprites : spriteArr,
                                };
                                storage.saveJSON(ss,"p3Sprites", "sprites");


                            }else{
                                log.info("No sprites selected");
                            }
                        }
                    },
                    Export_VOX_Stack : {
                        help : "Exports a set of images as a 3d VOX file\nMust include a 256 pallet",
                        call(){
                            if(selection.length > 0){
                                const imageStack = [];
                                var pallet;
                                var w = 0, h = 0, d;

                                selection.each(spr => {
                                    if (spr.type.image && spr.image.isDrawable) {
                                        imageStack.push(spr);
                                        w = Math.max(w, spr.image.w);
                                        h = Math.max(h, spr.image.h);
                                    } else if (spr.type.pallet) {
                                        if (pallet === undefined) {
                                            pallet = spr.pallet;
                                        } else {
                                            log.warn("Only first selected pallet used");
                                        }
                                    }
                                });
                                if (imageStack.length === 0) { log.warn("No selected drawable images found"); return; }
                                if (!pallet) { log.warn("No pallet selected. A pallet is requiered"); return; }
                                if (w > 256 || h > 256) { log.warn("No image can be larger than 256 by 256 pixels"); return; }
                                d = imageStack.length;
                                // VOX file format see https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt
                                const RIFF = createRiffBuffer(2048 * 8);
                                RIFF.blockType("withChildren");
                                RIFF.writeHeaderName("VOX ");
                                RIFF.writeInts(150);
                                RIFF.addBlock("MAIN");
                                RIFF.addBlock("SIZE");
                                RIFF.writeInts(w, h, d);
                                RIFF.closeBlock();
                                RIFF.addBlock("XYZI");
                                const xyziPos = RIFF.pos;
                                RIFF.seek(4);
                                var voxCount = 0;
                                var z = 0;
                                for (const spr of imageStack) {
                                    const pxs = getSprPixelData8Bit(spr).data;
                                    var x, y;
                                    y = 0;
                                    const hh = spr.image.h;
                                    const ww = spr.image.w;
                                    while (y < hh) {                                        
                                        x = 0;
                                        while (x < ww) {
                                            const idx = (x + y * w) * 4;
                                            if (pxs[idx + 3] > 0) {
                                                const cIdx = pallet.closestColorIdx(pxs[idx], pxs[idx + 1], pxs[idx + 2]) + 1;
                                                RIFF.writeBytes(x, y, z, cIdx);
                                                voxCount ++;
                                            }
                                            x ++;
                                        }
                                        y++;
                                    }
                                    z++;
                                }
                                RIFF.closeBlock();
                                RIFF.setPos(xyziPos);
                                RIFF.writeInts(voxCount);
                                RIFF.popPos();
                                
                                RIFF.addBlock("RGBA");
                                var i = 0;
                                const RGB = utils.rgba;
                                const len = pallet.length;
                                while (i < len) {
                                    pallet.getRGB(i++, RGB);
                                    RIFF.writeBytes(RGB.r, RGB.g, RGB.b, 255);
                                }
                                while (i < 256) {
                                    RIFF.writeBytes(0, 0, 0, 0);
                                    i++;
                                }
                                RIFF.closeBlock();
                                RIFF.closeBlock();
                                const fileSize = RIFF.close(0);
                                RIFF.downloadBuf("VOXpixels_" + getGUID() + ".vox");
                            }else{
                                log.info("No sprites selected");
                            }
                        }
                    }
                },
                tensorFlow: {                    
                    bodyParts: {
                        load: {
                            help: "Load tensorFlow body detect scripts and models",
                            call(item) {
                                if (!ScriptLoader.canRun("bodyParts")) {
                                    item.element.textContent = "Installing BodyParts. This will take a moment...";
                                    ScriptLoader.addScript("bodyParts", "./tensorFlow/BodyParts.js" , () => typeof BodyParts !== "undefined").then(()=>{

                                        BodyParts.install(() => {
                                            API.bodyParts = BodyParts();
                                            API.bodyParts.loadModel(() => {
                                                API.bodyParts.ready = true;
                                                log.sys("Body Parts is ready");
                                                const fold = extras.tensorFlow.bodyParts.load.owner.listItem.item.owner;
                                                const loadItem = extras.tensorFlow.bodyParts.load.owner.listItem;
                                                fold.close();

                                                fold.addFoldObject({
                                                    removeBackground: {
                                                        help: "Remove non human parts from image",
                                                        call() { utils.processSelectedImages(API.bodyPartsAPI, "removeBackground") }
                                                    },
                                                    removeBody: {
                                                        help: "Remove human parts from image",
                                                        call() { utils.processSelectedImages(API.bodyPartsAPI, "removeBody") }
                                                    },
                                                    findFaces: {
                                                        help: "Remove all but human faces from selected images",
                                                        call() { utils.processSelectedImages(API.bodyPartsAPI, "findFaces") }
                                                    },
                                                    markBody: {
                                                         help: "Mark human parts on image",
                                                        call() { utils.processSelectedImages(API.bodyPartsAPI, "mark") }
                                                    },
                                                });

                                                fold.removeItem(loadItem);
                                                fold.toggle();
                                            });
                                        });
                                    });
                                    log.sys("Loading resources for Body Parts");
                                }
                            }
                        },
                    },
                },
            };
            return extras
        },
    };
    Object.assign(API, Events(API));
    return API;
})();