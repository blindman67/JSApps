"use strict";
/* For use with EZWebWorkers.js the use strict above is not needed but there as a matter of standards */
function worker_ImageMorpher() {
    var progressVal = 0;
    var pLookup;
    const PI = Math.PI;
    const PI2 = PI * 2;
    const PI90 = PI / 2;
    const PI45 = PI / 4;
    const PI270 = PI + PI90;
    const p3 = {x:0,y:0,z:0,lon:0,lat:0};
    const mat = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const randShuffle = (a, l = a.length) => {
        while (l) {
            const i = Math.random() * (l--) | 0;
            const A = a[i];
            a[i] = a[l];
            a[l] = A;
        }
        return a;
    };

    const createRotateX = angle => {
        createIdent();

        mat[4] = Math.cos(angle);
        mat[5] = Math.sin(angle);
        mat[7] = -Math.sin(angle);
        mat[8] = Math.cos(angle);
    }
    const createIdent = () => {
        mat[0] = mat[4] = mat[8] = 1;
        mat[1] = mat[2] = mat[3] = mat[5] = mat[6] = mat[7] = 0;
    }
    const to3D = () => {
        const out =  Math.sin(p3.lat);
        p3.x = Math.cos(p3.lon) * out;
        p3.y = Math.sin(p3.lon) * out;
        p3.z = Math.cos(p3.lat);
    }
    const toLonLat = () => {
        p3.lon = Math.atan2(p3.y, p3.x);
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
    var w,w1,w2,h,h1,h2;
    const indexFromCylinderProjection = (lon, lat) => {
        return (
            (w1 - Math.floor(lon * w2 / PI + w) % w) +
            (h1 - Math.floor(lat * h / PI + h) % h) * w
        ) * 4;
    }
    const lonLatFromCylinderXY = (x,y) => {
        p3.lon = (((x / w1) * 2 - 1) * PI + PI2) % PI2;
        p3.lat = (((y / h1) * 2 - 1) * PI90 + PI2) % PI2;
    }
    const API = {
        mapDayNightToCylinderProjection(data,cX, cY) {
            const d32 = new Uint32Array(data.data.buffer);
            w = data.width; w2 = w / 2; w1 = w - 1;
            h = data.height; h2 = h / 2; h1 = h - 1;
            const cPX = ((cX  / 180) *  PI + PI2) % PI2;
            const cPY = ((-cY / 180) * PI + PI2) % PI2;
            var x,y;

            for(y = 0; y < h; y += 1){
                for(x = 0; x < w; x += 1) {
                    lonLatFromCylinderXY(x,y);
                    //const lon = (p3.lon + cPX + PI2) % PI2;
                    //const lat = (p3.lat + cPY + PI2) % PI2;

                    const dx = (cPX - p3.lon);
                    const dy = (cPY - p3.lat);
                    const dist = ((dx * dx + dy * dy) ** 0.5) % PI;
                    /*if((lon > ((p3.lon + PI90) % PI2) && lon < ((p3.lon + PI270) % PI2))){// || (lat > ((p3.lat + PI90) % PI2) && lat < ((p3.lat + PI270) % PI2))) {
                        d32[x + y * w] = 0xFF000000;
                    }else{
                        d32[x + y * w] = 0;
                    }*/
                    d32[x + y * w]  = 0xFF000000 + ((dist / PI) * 255 | 0);// + (((lat / PI2) * 255 | 0) << 8);
                }
                if(y  % 10 === 0) {
                    API.progress = y / h;
                }
            }
             return data;
        },
        mapImageToSphere(data,cX, cY, alias){
            const d32 = new Uint32Array(data.data.buffer);
            const d = data.data;
            const d32Res = new Uint32Array(d32.length);
            const dRes = new Uint8ClampedArray(d32Res.buffer);
            w = data.width; w2 = w / 2; w1 = w - 1;
            h = data.height; h1 = h - 1;
            const cPX = ((cX + 90) / 180) *  Math.PI;
            cX = ((cX + 90) / 360) * w;
            const cPY = (-cY / 180) * Math.PI;
            const cols = new Float64Array(w * 5)
            const alias2 = alias * alias;
            createRotateX(cPY);
            var x,y,ay,ix,idxs,idxd;


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

                        idxs =  indexFromCylinderProjection(p3.lon + cPX , p3.lat);
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
                if(y  % 10 === 0) {
                    API.progress = y / h;
                }
            }
            d32.set(d32Res);

             return data;
        },
		circleStyle(data) {
            const colAt = (x, y, radIn, rad) => {
                radIn |= 0;
                rad |= 0;
                var rs = radSpread * 2;
                x += Math.round((Math.random() - 0.5) * rs);
                y += Math.round((Math.random() - 0.5) * rs);
                const sx = Math.max(0, x - rad), ex = Math.min(w, x + rad + 1);
                const sy = Math.max(0, y - rad), ey = Math.min(h, y + rad + 1);
                var xx, yy, c = 1, c1 = 1;
                const radA = radIn * radIn;
                const radB = rad * rad;
                const idx = (y * w + x) * 4;
                const rr = d[idx] ** 2.2;
                const gg = d[idx + 1] ** 2.2;
                const bb = d[idx + 2] ** 2.2;
                const aa = d[idx + 3];
                r = rr; g = gg; b = bb; a = aa;
                r1 = rr; g1 = gg; b1 = bb; a1 = aa;

                for (yy = sy; yy < ey; yy ++) {
                    for (xx = sx; xx < ex; xx ++) {
                        if (Math.random() < sampleOdds) {
                            const dx = xx - x, dy = yy- y, dist = dx * dx + dy * dy;
                            if (dist <= radB) {
                                const am = dist / radB, amIn = 1 - dist / radA;
                                const idx = (yy * w + xx) * 4;
                                const rr = d[idx] ** 2.2;
                                const gg = d[idx + 1] ** 2.2;
                                const bb = d[idx + 2] ** 2.2;
                                const aa = d[idx + 3];
                                if (dist <= radA) {
                                    r += rr * amIn;
                                    g += gg * amIn;
                                    b += bb * amIn;
                                    a += aa * amIn;
                                    c += amIn;
                                }
                                r1 += rr * am;
                                g1 += gg * am;
                                b1 += bb * am;
                                a1 += aa * am;
                                c1 += am;
                            }
                        }
                    }
                }
                if (c > 0) {
                    r /= c;
                    g /= c;
                    b /= c;
                    a /= c;
                }
                if (c1 > 0) {
                    r1 /= c1;
                    g1 /= c1;
                    b1 /= c1;
                    a1 /= c1;
                }
            }
            const circleAt = (x, y, rad) => {
                rad += Math.round((Math.random() - 0.5) * (rad / 2));
                rad |= 0;
                rad = rad < 1 ? 1 : rad;
                var rs = radSpread * 2;
                rs = rs < 1 ? 1 : rs;
                x += Math.round((Math.random() - 0.5) * rs);
                y += Math.round((Math.random() - 0.5) * rs);
                const sx = Math.max(0, x - rad), ex = Math.min(w, x + rad + 1);
                const sy = Math.max(0, y - rad), ey = Math.min(h, y + rad + 1);
                var xx, yy, c = 0;
                const rad2 = rad * rad;
                for (yy = sy; yy < ey; yy ++) {
                    for (xx = sx; xx < ex; xx ++) {
                        const dx = xx - x, dy = yy- y, dist = dx * dx + dy * dy;
                        if (dist <= rad2) {
                            const idx = (yy * w + xx) * 4;
                            d[idx] = r;
                            d[idx + 1] = g;
                            d[idx + 2] = b;
                            d[idx + 3] = a;
                        }
                    }
                }
            }
            const A = 1;
            const B = 3;
            var r = 0, g = 0, b = 0, a = 0, x, y;
            var r1 = 0, g1 = 0, b1 = 0, a1 = 0;
            var r2 = 0, g2 = 0, b2 = 0, a2 = 0;
            const d32 = new Uint32Array(data.data.buffer);
            const d = data.data;
            var w = data.width;
            var h = data.height;
            const cols = new Uint8ClampedArray(w * h * 4);
            const cols1 = new Uint8ClampedArray(w * h * 4);
            const circles = new Uint16Array(w * h);
            const idxs = [];
            const max = (255 ** 2.2 ** 2 * 3) ** 0.5;
            const max16 = 2 ** 16 - 1;
            const invR = 1 / 2.2;
            const sampleOdds = 1 / 4;
            const radStep = 4;
            const radDraw = 3;
            const radSpread = 3;
            const radIn = 2;
            const radMax = 12;
            const tProg = w * h * 2 * 4, size = w * h * 4;
            var pCount = 0;
            var min = Infinity;

            for (y = 0; y < h; y += radStep) {
                for (x = 0; x < w; x += radStep) {
                    colAt(x,y,radIn, radMax);


                    r2 = r1 - r; g2 = g1 - g; b2 = b1 - b;
                    const dist = 1 - (r2 * r2 + g2 * g2 + b2 * b2) ** 0.5 / max;
                    var rd = max16 * (dist < 0 ? 0 : dist) ;
                    min = rd < min ? rd : min;
                    var idx = x + y * w;
                    idxs.push(idx);
                    idx *= 4;
                    cols[idx] = r ** invR;
                    cols[idx+1] = g ** invR;
                    cols[idx+2] = b ** invR;
                    cols[idx+3] = a;
                    cols1[idx++] = r1 ** invR;
                    cols1[idx++] = g1 ** invR;
                    cols1[idx++] = b1 ** invR;
                    cols1[idx] = a1;
                    circles[x + y * w] = rd;
                    if(pCount++ % 256 === 0) {
                        API.progress = idx / tProg;
                    }
                }
            }
            randShuffle(idxs);
            idxs.sort((a,b) => circles[b] - circles[a]);
            d.fill(0);

            min |= 0;
            const ran = max16 - min;
            min += 8;
            var i = 0;
            const reps = 16;
            const reps1 = reps + 2;
            var rps = 0;
            while (i < idxs.length) {
                var idx = idxs[i++];
                if (cols[idx * 4 + 3] > 0) {
                    x = idx % w;
                    y = (idx / w) | 0;
                    const rd = ((circles[idx] - min) / ran) ** (8.5);
                    idx *= 4;
                    //r = cols[idx++];
                    //g = cols[idx++];
                    //b = cols[idx++];
                    a = cols[idx+3];
                    const rrd = rd * radDraw * 2 + 1;
                    rps = ((1-rd) * reps  | 0) + 2;
                    while(rps-- > 0) {
                        const m1 = rps / reps1, m2 = 1-m1;
                        r = (m2 * cols[idx+0] * cols[idx+0] + m1 * cols1[idx+0] * cols1[idx+0]) ** 0.5;
                        g = (m2 * cols[idx+1] * cols[idx+1] + m1 * cols1[idx+1] * cols1[idx+1]) ** 0.5;
                        b = (m2 * cols[idx+2] * cols[idx+2] + m1 * cols1[idx+2] * cols1[idx+2]) ** 0.5;


                        circleAt(x, y, rrd);
                    }
                }
                if(pCount++ % 256 === 0) {
                    API.progress = (size + (size / idxs.length) * i) / tProg;
                }
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
localProcessImage.registerWorker(
    worker_ImageMorpher,
    "mapDayNightToCylinderProjection",
    "mapImageToSphere",
    "circleStyle",
);
