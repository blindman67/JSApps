"use strict";
/* For use with EZWebWorkers.js the use strict above is not needed but there as a matter of standards */
function worker_ImageFindReplace() {
    var progressVal = 0;
    /* BM67 this is a copy of original main thread code
       and as a worker the replace images are rendered by the code rather than GPU (simplifies the image transfer).
       As such there could be a lot of room to optimise this code.
    */
    function findReplace(data, mirror, rotate, randReplace, dataF, ...replaceImgD8) {
        const w = data.width, h = data.height;
        const wf = dataF.width, hf = dataF.height;

        const d32  = new Uint32Array(data.data.buffer);
        const df32 = new Uint32Array(dataF.data.buffer);
        var found = 0;
        const normal       = (x, y, w, h) =>  x + y * w;
        const mirrorW      = (x, y, w, h) => (w - 1 - x) + y * w;
        const mirrorH      = (x, y, w, h) =>  x + (h - 1 - y) * w;
        const mirrorWH     = (x, y, w, h) => (w - 1 - x) + (h - 1 - y) * w;
        const rot90        = (x, y, w, h) =>  y + (h - 1 - x) * w;
        const rot90MirrorW = (x, y, w, h) =>  y + x * w;
        const rot270       = (x, y, w, h) => (w - 1 - y) + x * w;
        const rot90MirrorH = (x, y, w, h) => (w - 1 - y) + (h - 1 - x) * w;
        normal.m       = [ 1,  0,  0,  1, 0, 0];
        mirrorW.m      = [-1,  0,  0,  1, 1, 0];
        mirrorH.m      = [ 1,  0,  0, -1, 0, 1];
        mirrorWH.m     = [-1,  0,  0, -1, 1, 1];
        rot90.m        = [ 0,  1, -1,  0, 1, 0];
        rot270.m       = [ 0, -1,  1,  0, 0, 1];
        rot90MirrorW.m = [ 0,  1,  1,  0, 0, 0];
        rot90MirrorH.m = [ 0, -1, -1,  0, 1, 1];
        rot90.rot        = true;
        rot270.rot       = true;
        rot90MirrorW.rot = true;
        rot90MirrorH.rot = true;
        const transforms = [
            ...(() => (!rotate && !mirror) ? [normal] : [])(),
            ...(() => (!rotate &&  mirror) ? [normal, mirrorW, mirrorH,  mirrorWH] : [])(),
            ...(() => ( rotate && !mirror) ? [normal, rot90,   mirrorWH, rot270] : [])(),
            ...(() => ( rotate &&  mirror) ? [normal, mirrorW, mirrorH,  mirrorWH,  rot90, rot90MirrorW, rot270, rot90MirrorH] : [])(),
        ];
        const idxCache = [];
        var idxCacheSize = 0;
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
            idxCacheSize = 0;
            if (transform.rot) {
                if (canFit(x, y, hf, wf)) {
                    for (yy = 0; yy < wf; yy  ++) {
                        const yy1 = (y + yy) * w + x;
                        for (xx = 0; xx < hf; xx  ++) {
                            const idx = idxCache[idxCacheSize++] = transform(xx, yy, wf, hf);
                            if (d32[xx + yy1] !== df32[idx]) { return false }
                        }
                    }
                } else { return false }
            } else {
                if (canFit(x, y, wf, hf)) {
                    for (yy = 0; yy < hf; yy  ++) {
                        const yy1 = (y + yy) * w + x;
                        for (xx = 0; xx < wf; xx  ++) {
                            const idx = idxCache[idxCacheSize++] = transform(xx, yy, wf, hf);
                            if (d32[xx + yy1] !== df32[idx]) { return false }
                        }
                    }
                } else { return false }
            }
            return true;
        }
        const replace = (x, y, transform) => {
            const rD8 = replaceImgD8[(randReplace ? Math.random() * replaceImgD8.length | 0 : replaceIdx ++) % replaceImgD8.length];
            const rw = rD8.width;
            const rh = rD8.height;
            const dd32 = new Uint32Array(rD8.data.buffer);
            var xx, yy;
            var i = 0;
            if (transform.rot) {
                for (yy = 0; yy < wf; yy  ++) {
                    const yy1 = (y + yy) * w + x;
                    for (xx = 0; xx < hf; xx  ++) { d32[xx + yy1] = dd32[idxCache[i++]]; } 
                }
                used(x, y, rh, rw);
                x += rh - 1;
            } else {
                for (yy = 0; yy < hf; yy  ++) {
                    const yy1 = (y + yy) * w + x;
                    for (xx = 0; xx < wf; xx  ++) { d32[xx + yy1] = dd32[idxCache[i++]]; }
                }
                used(x, y, rw, rh);
                x += rw - 1;
            }
            found ++;
            return x;
        }
        var x, y;
        const alignment = 1;
        const edge = Math.min(hf, wf) - 1;
        const hEdge = mirror || rotate ? edge : hf - 1;
        const wEdge = mirror || rotate ? edge : wf - 1;
        const total = (h - hEdge) * (w - wEdge) / alignment;
        const progUpdate = Math.max(2048, total / (w * 0.5)) | 0;
        var replaceIdx = Math.random() * replaceImgD8.length | 0;
        var progressCount = 0;
        for (y = 0; y < h - hEdge; y  += alignment) {
            for (x = 0; x < w - wEdge; x  += alignment) {
                let i = Math.random() * transforms.length | 0
                for (const tran of transforms) {
                    const t = transforms[(i++) % transforms.length];
                    if (isSame(x, y, t)) { x = replace(x, y, t); break }
                }
                progressCount++;
                if ((progressCount % progUpdate) === 0) { API.progress = progressCount / total; }
            }
        }
        return data;
    };
    const API = {
        replaceSubImages(imgD8, mir, rot, randReplace, subImgD8, ...replaceImgsD8) {
            return findReplace(imgD8, mir, rot, randReplace, subImgD8, ...replaceImgsD8);
        },
        set progress(value) {
            progressVal = value;
            progressMessage(value);
        },        
    };
    function workerFunction(data){
        var result;
        if (typeof API[data.call] === "function") { result = API[data.call](...data.args); }
        return result;
    }
}
localProcessImage.registerWorker(
    worker_ImageFindReplace,
    "replaceSubImages"
);