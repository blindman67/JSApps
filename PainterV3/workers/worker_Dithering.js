"use strict";
/* For use with EZWebWorkers.js the use strict above is not needed but there as a matter of standards */
function worker_Dithering() {
    var progressVal = 0;
    var pLookup;
    var closestColor, lookupFunction;
    var currentMap,currentSize,spread = [0,0,0];
    var dither, ditherHalf, randomDither = false, colorLog = false, matchHue = false;
    const ditherMap = {
        map2 : [0/4, 2/4, 3/4, 1/4],
        map3 : [0/9, 7/9, 3/9, 6/9, 5/9, 2/9, 4/9, 1/9, 8/9],
        map4 : [
             0/16,  8/16,  2/16, 10/16,
            12/16,  4/16, 14/16,  6/16,
             3/16, 11/16,  1/16,  9/16,
            15/16,  7/16, 13/16,  5/16
        ],
        map5 : [
             0/25,  1/25,  2/25,  3/25,  4/25,
             5/25,  6/25,  7/25,  8/25,  9/25,
            10/25, 11/25, 12/25, 13/25, 14/25,
            15/25, 16/25, 17/25, 18/25, 19/25,
            20/25, 21/25, 22/25, 23/25, 24/25,
        ],
    };
    const seeded = (() => {
        var seed = 1;
        const m = 2576436549074795;
        const API = {
            reseed (s) { seed = Math.floor(s) },
            random ()  { return (seed = ((8765432352450986 * seed) + 8507698654323524) % m) / m  },
            shuffle(a, l = a.length) { while (l) { a.push(a.splice(API.random() * l-- | 0, 1)[0]) } return a },
        };
        return API;
    })();
    seeded.shuffle(ditherMap.map5);
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
    function closestColorLinear(fr,fg,fb){
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
    function closestColorLinearClip(fr,fg,fb){
        var len = pLookup.length;
        var i = 0,dist, min = Infinity, idx = -1, r,g,b;
        fr = (fr <= 0 ? 0 : fr >= 1 ? 1 : fr) * 255;
        fg = (fg <= 0 ? 0 : fg >= 1 ? 1 : fg) * 255;
        fb = (fb <= 0 ? 0 : fb >= 1 ? 1 : fb) * 255;
        while(i < len){
            const p = pLookup[i];
            r = fr - p[0];
            g = fg - p[1];
            b = fb - p[2];
            dist = (r * r + g * g + b * b);
            if(dist === 0) { return i }
            if(dist < min){
                min = dist;
                idx = i;
            }
            i ++;
        }
        return idx;
    }
       
    function closestColorYIQ_NTSC(fr,fg,fb){
        if(randomDither) {
            fr += seeded.random() * dither - ditherHalf;
            fg += seeded.random() * dither - ditherHalf;
            fb += seeded.random() * dither - ditherHalf;
        }        
        const r = fr * 0.29889531 + fg * 0.58662247 + fb * 0.11448223;
        const g = fr * 0.59597799 - fg * 0.27417610 - fb * 0.32180189;
        const b = fr * 0.21147017 - fg * 0.52261711 + fb * 0.31114694;        
        var len = pLookup.length;
        var i = 0,dist, min = Infinity, idx = -1;
        while(i < len){
            var p = pLookup[i];
            dist = (p[0] - r) ** 2 * 0.5053 + (p[1] - g) ** 2 * 0.2990 + (p[2] - b) ** 2 * 0.1957;
            if(dist === 0) { return i }
            if(dist < min){
                min = dist;
                idx = i;
            }
            i ++;
        }
        return idx;
    }    
    function closestColorLog(fr,fg,fb){
        fr *= fr; fg *= fg; fb *= fb;
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
    function closestColorSimple(r, g, b){
        var i = 0;
        var p, distSqr, index, dr, dg, db;
        var minDif = Infinity;
        if(randomDither) {
            r += seeded.random() * dither - ditherHalf;
            g += seeded.random() * dither - ditherHalf;
            b += seeded.random() * dither - ditherHalf;
        }
        if(colorLog) {
            r *= r; g *= g; b *= b;
        }
        for( ; i < pLookup.length; i++){
            p = pLookup[i];
            dr = p[0] - r;
            dg = p[1] - g;
            db = p[2] - b;
            distSqr = dr * dr + dg * dg + db * db;
            if(distSqr === 0) { return i } // if matching then we found the colour
            if(distSqr < minDif){
                minDif = distSqr;
                index = i;
            }
        }
        return index;
    }
    function closestColorHue(r, g, b){
        var i = 0;
        var p, distSqr, index, dr, dg, db, dh, dl, ds;
        var minDif = Infinity;
        if(randomDither) {
            r += seeded.random() * dither - ditherHalf;
            g += seeded.random() * dither - ditherHalf;
            b += seeded.random() * dither - ditherHalf;
        }
        var [h,s,l] = RGBToHSLQuick(r,g,b);
        if(colorLog) {
            r *= r; g *= g; b *= b;
            h *= h; s *= s; ; l *= l;
        }
        const hh = h + 255;
        for( ; i < pLookup.length; i++){
            p = pLookup[i];
            dr = p[0] - r;
            dg = p[1] - g;
            db = p[2] - b;
            dh = Math.min(Math.abs(p[3] - h), Math.abs(p[3] - hh));
            ds = p[4] - s;
            dl = p[5] - l;

            distSqr = dr * dr + dg * dg + db * db + dh * dh * dh
            if(distSqr === 0) { return i } // if matching then we found the colour
            if(distSqr < minDif){
                minDif = distSqr;
                index = i;
            }
        }
        return index;
    }
    function paletteToPhoton(palette){
        var i = 0;
        const palP = [];
        for( ; i < palette.length; i++){
            palP.push([
                palette[i][0] * palette[i][0],
                palette[i][1] * palette[i][1],
                palette[i][2] * palette[i][2]
            ]);
        }
        return palP;
    }
    function paletteToYIQ_NTSC(palette){
        var i = 0;
        const palP = [];
        for( ; i < palette.length; i++){
            const r = palette[i][0];
            const g = palette[i][1];
            const b = palette[i][2];
            palP.push([
                r * 0.29889531 + g * 0.58662247 + b * 0.11448223,
                r * 0.59597799 - g * 0.27417610 - b * 0.32180189,
                r * 0.21147017 - g * 0.52261711 + b * 0.31114694
            ]);
        }
        return palP;
    }    
    
    function RGBToHSLQuick(r, g, b){
        var dif, h,s,l, min, max;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){

            return [0, 0, min];
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
        return [(h * 42.5) % 255, s * 255, l / 2];
    }
    function paletteAddHSL(palette) {
        const palP = [];
        for (const rgb of palette){
            palP.push([
                rgb[0],
                rgb[1],
                rgb[2],
                ...RGBToHSLQuick(rgb[0],rgb[1],rgb[2]),
            ]);
        }
        return palP;

    }
    function setColorSpace(type, pallet, spreadMethod) {
        type = type.toLowerCase().trim();
        lookupFunction = closestColorSimple;
        dither = (256 / Math.max(2,Math.sqrt(pallet.length)));
        ditherHalf = dither / 2;
        if(type.includes("random dither")) {
            seeded.reseed(Math.floor(performance.now()));
            randomDither = true;
            lookupFunction = closestColorSimple;

        } else if(type.includes("ordered dither")) {
            spreadMethod !== undefined && findSpread(pallet,spreadMethod);
            if (type.includes("ordered dither 4")) {
                currentMap = ditherMap.map4;
                currentSize = 4;
            }else if (type.includes("ordered dither 3")) {
                currentMap = ditherMap.map3;
                currentSize = 3;
            } else if (type.includes("ordered dither 2")) {
                currentMap = ditherMap.map2;
                currentSize = 2;
            } else {
                seeded.reseed(Math.floor(performance.now()));
                seeded.shuffle(ditherMap.map5);
                currentMap = ditherMap.map5;
                currentSize = 5;
            }
            lookupFunction = findOrderedDither;
        } else {
            randomDither = false;

        }

        if (type.includes("match hue")) { // no longer used via extras menu
            colorLog = false;
            pLookup = paletteAddHSL(pallet);
            lookupFunction = closestColorHue;
        } else if(type.includes("linear")) {
            closestColor = closestColorLinear;
            colorLog = false;
            pLookup = pallet;
        } else if(type.includes("yiq")){
            closestColor = closestColorYIQ_NTSC;
            if (lookupFunction !== findOrderedDither) {
                lookupFunction = closestColorYIQ_NTSC;
            }
            colorLog = false;
            pLookup = paletteToYIQ_NTSC(pallet);       
        }else if(type.includes("sRGB")){
            closestColor = closestColorLog;
            colorLog = true;
            pLookup = paletteToPhoton(pallet);
        } else {
            pLookup = pallet;
            lookupFunction = closestColorSimple;
            colorLog = false;
        }

    }
    function findOrderedDither(r,g,b,x,y){
        const offset = (currentMap[(x%currentSize) + (y%currentSize) * currentSize] - 0.5);
        return closestColor(r + offset * spread[0],g + offset * spread[1],b + offset * spread[2])
    }
    function findSpread(pallet, spreadMethod){
        spreadMethod = spreadMethod.toLowerCase().trim();
        if(spreadMethod === "mono fixed"){
            spread[0] = spread[1] = spread[2] = 256 / (pallet.length -1);
            return;
        }else if(spreadMethod === "color fixed"){
            spread[0] = spread[1] = spread[2] = 256 / ((pallet.length -1) / 3);
            return;
        }
        var minR,minG,minB,sumR,sumG,sumB,cR,cG,cB;
        minR = minG = minB = 256;
        cR = cG = cB = sumR = sumG = sumB = 0;
        for(var i = 0; i < pallet.length; i++){
            const p = pallet[i];
            for(var j = i+1; j < pallet.length; j++){
                const dr = Math.abs(p[0] - pallet[j][0]);
                const dg = Math.abs(p[1] - pallet[j][1]);
                const db = Math.abs(p[2] - pallet[j][2]);
                if(dr !== 0){
                    minR = dr < minR ? dr : minR;
                    sumR += dr;
                    cR ++;
                }
                if(dg !== 0){
                    minG = dg < minG ? dg : minG;
                    sumG += dg;
                    cG ++;
                }
                if(db !== 0){
                    minB = db < minB ? db : minB;
                    sumB += db;
                    cB ++;
                }
            }
        }
        if(spreadMethod === "minimum"){
            spread[0] = minR;
            spread[1] = minG;
            spread[2] = minB;
        }else{
            spread[0] = ((sumR / cR) + minR * 3) / 4;
            spread[1] = ((sumG / cG) + minG * 3) / 4;
            spread[2] = ((sumB / cB) + minB * 3) / 4;
        }
    }
    const API = {
        applyPalletToImageFloydSteinberg(data, pallet){
            pLookup = pallet;
            const d = data.data;
            const w = data.width;
            const er7 = 7 / 16;
            const er3 = 3 / 16;
            const er5 = 5 / 16;
            const er1 = 1 / 16;
            const len = d.length / 4;
            var idx = 0;
            var line = new Array(w), nextLine = new Array(w);
            line.fill(0);
            nextLine.fill(0);

            var whiteIdx, blackIdx;
            const black = pallet[blackIdx = closestColorLinearClip(0, 0, 0)];
            const white = pallet[whiteIdx = closestColorLinearClip(255, 255, 255)];
            if (black[0] !== 0 || black[1] !== 0 ||black[2] !== 0) {
                pLookup.push([0,0,0]);
                blackIdx = pLookup.length - 1;
            }
            if (white[0] !== 255 || white[1] !== 255 || white[2] !== 255) {
                pLookup.push([255,255,255]);
                whiteIdx = pLookup.length - 1;
            }
            function processPixels(){
                var count = w;
                var c1,c2;
                var i1, ci, r, g, b, i = idx * 4, x = 0, xi = 0, dif, pIdx, pL;
                while (count--) {
                    dif = line[xi];
                    r = (d[i + 0] / 255) + dif;
                    g = (d[i + 1] / 255) + dif;
                    b = (d[i + 2] / 255) + dif;
                    pIdx = closestColorLinearClip(r, g, b);
                    if (pIdx === whiteIdx) { pL = white }
                    else if(pIdx === blackIdx) { pL = black }
                    else {  pL = pallet[pIdx] }
                    d[i++] = pL[0];
                    d[i++] = pL[1];
                    d[i++] = pL[2];
                    pL = pallet[pIdx];
                    r -= (pL[0] / 255);
                    g -= (pL[1] / 255);
                    b -= (pL[2] / 255);
                    dif = (r  + g  + b) / 3;
                    if (x  && x < w -1) {
                        line[xi + 1]     += dif * er7;
                        nextLine[xi - 1] += dif * er3;
                        nextLine[xi    ] += dif * er5;
                        nextLine[xi + 1] += dif * er1;
                    } else if (x >= w -1) {
                        c2 = dif * er7;
                        nextLine[xi - 1] += dif * er3;
                        nextLine[xi    ] += dif * er5;
                        c1 = dif * er1;
                    } else {
                        line[xi + 1]     += dif * er7;
                        line[w  - 1]     += dif * er3;
                        nextLine[xi    ] += dif * er5;
                        nextLine[xi + 1] += dif * er1;
                    }
                    x += 1;
                    idx += 1;
                    xi += 1;
                    i += 1;
                }
                const t = line;
                line = nextLine;
                nextLine = t;
                t.fill(0);
                nextLine[0] = c1;
                line[0] += c2;
            }
            while(idx < len){
                processPixels();
                API.progress = idx / len
            }
            return data;
        },
        applyStretchValue(data){
            const d = data.data;
            const w = data.width;
            const len = d.length / 4;
            var min = 3 * 255;
            var max = 0;
            var idx = 0;
            var  r,g,b;
            var chunkSize = 64 * 64;
            function getMimMax(idx){
                var count = chunkSize;
                var r,g,b,i = idx * 4;
                while (count && idx < len) {
                    r = d[i];
                    g = d[i+1];
                    b = d[i+2];
                    if (d[i + 3] > 0) {
                        const val = r + g + b;
                        min = Math.min(min, val);
                        max = Math.max(max, val);
                    }
                    i += 4;
                    idx += 1;
                    count --;
                }
                return idx;
            }
            function stretch(idx, base, scale){
                var count = chunkSize;
                var r,g,b,i = idx * 4;
                while (count && idx < len) {
                    if (d[i + 3] > 0) {
                        d[i    ] = (d[i    ] - base) * scale;
                        d[i + 1] = (d[i + 1] - base) * scale;
                        d[i + 2] = (d[i + 2] - base) * scale;
                    }
                    i += 4;
                    idx += 1;
                    count --;
                }
                return idx;
            }
            while(idx < len){
                idx = getMimMax(idx);
                API.progress = idx / (len * 2);
            }
            const range = max - min;
            if (range > 0 && range < 255 * 3) {
                const scale = (255 * 3) / range;
                const base = min / 3;

                while(idx < len * 2){
                    idx = stretch(idx - len, base, scale) + len;
                    API.progress = idx / (len * 2);
                }
            }
            return data;
        },
        countPalletPixels(data, colorSpace, pallet){
            setColorSpace(colorSpace, pallet);
            const counts = new Array(pallet.length);
            counts.fill(0);

            const d = data.data;
            const w = data.width;
            const len = d.length / 4;
            var idx = 0;
            var chunkSize = 64 * 64;
            function processPixels(){
                var count = chunkSize;
                var i1,ci,r,g,b,i = idx * 4;
                while(count && idx < len){
                    counts[lookupFunction(d[i],d[i+1],d[i+2])] ++;
                    i+= 4;
                    idx += 1;
                    count --;
                }
            }
            while(idx < len){
                processPixels();
                API.progress = idx / len
            }
            return counts;

        },
        applyPalletToImage(data, colorSpace, pallet, spreadMethod){

            setColorSpace(colorSpace, pallet, spreadMethod);

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
                    const pL = pallet[lookupFunction(d[i],d[i+1],d[i+2],x,y)];
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
        createIndexedLookup(data, previouse, colorSpace, pallet, spreadMethod, transparent = false, transThreshold, transIndex) {
            setColorSpace(colorSpace, pallet, spreadMethod);


            const d = data.data, w = data.width, len = d.length / 4;
            const indexed = new Uint8ClampedArray(len)
            var idx = 0, x = 0, y = 0, chunkSize = 64 * 64;
            var minX = -1 ,maxX,minY = -1 ,maxY;
            function checkBounds(x,y) {
                if(minX === -1) { maxX = minX = x }
                if(minY === -1) { maxY = minY = y }
                maxX = x > maxX ? x : maxX;
                maxY = y > maxY ? y : maxY;
            }

            function processPixelsTrans(){
                var count = chunkSize;
                var i1,ci,r,g,b,i = idx * 4;
                while(count && idx < len){
                    const index = d[i + 3] < transThreshold ? transIndex : lookupFunction(d[i], d[i + 1], d[i + 2], x, y);
                    if(previouse && index !== previouse[idx]){ checkBounds(x,y)}
                    indexed[idx] = index;
                    x += 1;
                    if(x === w){
                        x = 0;
                        y ++;
                    }
                    i += 4;
                    idx += 1;
                    count --;
                }
            }
            function processPixels(){
                var count = chunkSize;
                var i1,ci,r,g,b,i = idx * 4;
                while(count && idx < len){
                    const index = lookupFunction(d[i], d[i + 1], d[i + 2], x, y);
                    if(previouse && index !== previouse[idx]){ checkBounds(x,y)}
                    indexed[idx] = index;
                    x += 1;
                    if(x === w){
                        x = 0;
                        y ++;
                    }
                    i+=4;
                    idx += 1;
                    count --;
                }
            }
            while(idx < len){
                transparent ? processPixelsTrans() : processPixels();
                API.progress = idx / len
            }
            if(previouse) {
                if(minX === -1 || minY === -1){
                    return {
                        x : 0,
                        y : 0,
                        w : 0,
                        h : 0,
                        mod : w,
                        idxPix : indexed,
                    };

                }else{
                    return {
                        x : minX,
                        y : minY,
                        w : maxX - minX + 1,
                        h : maxY - minY + 1,
                        mod : w,
                        idxPix : indexed,
                    };
                }
            }

            return {
                x : 0,
                y : 0,
                w : w,
                h : data.height,
                mod : w,
                idxPix : indexed,
            };


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
localProcessImage.registerWorker(
    worker_Dithering,
    "applyPalletToImage",
    "applyPalletToImageFloydSteinberg",
    "applyStretchValue",
    "createIndexedLookup|dataOnly",
    "countPalletPixels",
);