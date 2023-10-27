"use strict";
const curved = (()=>{
    // To prevent GC hits arrays grow only, there length does not indicate the useable content.
    // For content lengths use count for points, simpleCount for simple and smoothCount for smoothed
    // Call API.release to free up arrays
    const points = [[0,0,false],[0,0,false],[0,0,false]];
    const simple = [[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]];
    const smoothed = [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]];
    var simpleProcessed = 0;
    var processedPoints = 0;
    var count = 0;
    var simpleCount = 0;
    var smoothCount = 0;
    var smoothOn = false;
    var circularedOn = true;
    var haveNormals = false;
    var strokeLen = 0;
    /* Constants index into point array */
    const X = 0;
    const Y = 1;
    const NX = 2;
    const NY = 3;
    const LEN = 4;
    const ULEN = 5;
    // const FIX = 2; not used
    var lastX = 0; // this is last point of mouse. Smooth will catch up to this point when cleaned
    var lastY = 0;
    const PI2 = Math.PI2;
    const fitArcResult = {
        x : 0,  // the center of the arc
        y : 0,
        r : 0,  // radius of arc. If negative then winding is anticlockwise
        start : 0,  // angle first point p1
        mid : 0,  // angle to mid point p2
        end : 0, // angle to last point p3
        use : false,  // if angle change (dot product of (p1,p2) dot (p2,p3)) is below threashold then curve is flagged not to use
    };
    function fitArc(p1x, p1y, p2x, p2y, p3x, p3y){ // find center, radius and start end angles to fit all 3 points on arc perimiter if possible. If not returns undefined
        var x, y, a, b, c; // center point and a,b,c angle from center to points p1,p2,p3
        fitArcResult.use = false;
        const dif1 = p1y - p2y;
        const dif2 = p2y - p3y;
        if (dif1 === 0 && dif2 === 0) { return } // no computable slope for both means all 3 points on same horizontal line
        if(dif1 !== 0 && dif2 !== 0){
            const s21 = (p2x - p1x) / dif1;  // get slope of p2 to p1
            const s23 = (p3x - p2x) / dif2;   // get slope of p2 to p3
            if (s21 === s23)  { return } // slopes from same point p2. If same slopes then all 3 points are on the same line
            const u = (p1y + p2y - (p1x + p2x) * s21) * 0.5;
            x = ((p2y + p3y - (p2x + p3x) * s23) * 0.5  - u) / (s21 - s23);
            y = s21 * x + u;
        } else if(dif1 === 0){
            const s23 = (p3x - p2x) / dif2; // get slope of p2 to p3
            x = (p1x + p2x) * 0.5;
            y = (p2y + p3y - (p2x + p3x) * s23) * 0.5 + x * s23;
        } else {
            const s21 = (p2x - p1x) / dif1;  // get slope of p2 to p1
            x = (p2x + p3x) * 0.5;
            y = (p1y + p2y - (p1x + p2x) * s21) * 0.5 + x * s21;
        }
        const dx = p1x - (fitArcResult.x = x);
        const dy = p1y - (fitArcResult.y = y);
        fitArcResult.r = Math.sqrt(dx * dx + dy * dy);
       // fitArcResult.r = fitArcResult.r < 4096 ? fitArcResult.r : 4096;
        var d1x = (p2x - p1x);
        var d1y = (p2y - p1y);
        var d2x = (p3x - p2x);
        var d2y = (p3y - p2y);
        const cross = d1x * d2y - d1y * d2x;
        var len1 = Math.sqrt(d1x * d1x + d1y * d1y);
        d1x /= len1;
        d1y /= len1;
        len1 = Math.sqrt(d2x * d2x + d2y * d2y);
        d2x /= len1;
        d2y /= len1;
        if(d1x * d2x + d1y * d2y < 1 - paint.curveStep/ 30) { return };
        fitArcResult.start =  Math.atan2(dy, dx);
        fitArcResult.mid  = Math.atan2(p2y - y, p2x - x);
        fitArcResult.end  = Math.atan2(p3y - y, p3x - x);
        if(cross < 0){
            fitArcResult.r = -fitArcResult.r;
            fitArcResult.mid -= fitArcResult.mid > fitArcResult.start ? PI2 : 0;
            fitArcResult.end -= fitArcResult.end > fitArcResult.start ? PI2 : 0;
        }else{
            fitArcResult.mid += fitArcResult.mid < fitArcResult.start ? PI2 : 0;
            fitArcResult.end += fitArcResult.end < fitArcResult.start ? PI2 : 0;
        }
        fitArcResult.use = true;
    }
    function fitCircle(p1, p2, p3, result = {}){ // find center and radius to fit all 3 points on perimiter if possible. If not returns undefined
        var x, y; // center point
        const p1x = p1.x, p1y = p1.y;
        const p2x = p2.x, p2y = p2.y;
        const p3x = p3.x, p3y = p3.y;
        const dif1 = p1y - p2y;
        const dif2 = p2y - p3y;
        if (dif1 === 0 && dif2 === 0) { return } // no computable slope for both means all 3 points on same horizontal line
        if(dif1 !== 0 && dif2 !== 0){
            const s21 = (p2x - p1x) / dif1;  // get slope of p2 to p1
            const s23 = (p3x - p2x) / dif2;   // get slope of p2 to p3
            if (s21 === s23)  { return } // slopes from same point p2. If same slopes then all 3 points are on the same line
            const u = (p1y + p2y - (p1x + p2x) * s21) * 0.5;
            x = ((p2y + p3y - (p2x + p3x) * s23) * 0.5  - u) / (s21 - s23);
            y = s21 * x + u;
        } else if(dif1 === 0){
            const s23 = (p3x - p2x) / dif2; // get slope of p2 to p3
            x = (p1x + p2x) * 0.5;
            y = (p2y + p3y - (p2x + p3x) * s23) * 0.5 + x * s23;
        } else {
            const s21 = (p2x - p1x) / dif1;  // get slope of p2 to p1
            x = (p2x + p3x) * 0.5;
            y = (p1y + p2y - (p1x + p2x) * s21) * 0.5 + x * s21;
        }
        const dx = p1x - (result.x = x);
        const dy = p1y - (result.y = y);
        result.r = Math.sqrt(dx * dx + dy * dy);
        return result;
    }
    //RDP
    function simplify(tolerance) {  // This function will always result in less points than the source set
        var simplify = function(start, end) {
            var maxDist, index, i, xx , yy, dx, dy, ddx, ddy, p1, p2, p, t, dist, dist1,pxx,pyy;
            p1 = pp[start];
            p2 = pp[end];
            xx = p1[0];
            yy = p1[1];
            ddx = p2[0] - xx;
            ddy = p2[1] - yy;
            dist1 = (ddx * ddx + ddy * ddy);
            maxDist = tolerance;
            for (var i = start + 1; i < end; i++) {
                p = pp[i];
                if (ddx !== 0 || ddy !== 0) {
                    dx = p[0] - xx;
                    dy = p[1] - yy;
                    t = (dx * ddx + dy * ddy) / dist1;
                    if (t > 1) {
                        dx = p[0] - p2[0];
                        dy = p[1] - p2[1];
                    } else if (t > 0) {
                        dx -= ddx * t;
                        dy -= ddy * t;
                    }
                } else {
                    dx = p[0] - xx;
                    dy = p[1] - yy;
                }
                dist = dx * dx + dy * dy
                if (dist > maxDist) {
                    index = i;
                    maxDist = dist;
                }
            }
            if (maxDist > tolerance) {
                if (index - start > 1) { simplify(start, index) }
                tp[simpleCount][0] = pp[index][0];
                tp[simpleCount++][1] = pp[index][1];
                if (end - index > 1) { simplify(index, end) }
            }
        }
        const tp = simple;
        const pp = points;
        simpleCount = simpleProcessed;
        var end = count - 1;
        tp[simpleCount][0] = pp[processedPoints][0];
        tp[simpleCount++][1] = pp[processedPoints][1];
        simplify(processedPoints, end);
        tp[simpleCount][0] = pp[end][0];
        tp[simpleCount++][1] = pp[end][1];
        if (paint.widthFade > 4) {
            if (end - processedPoints > paint.widthFade ) {
                processedPoints = end ;
                simpleProcessed = simpleCount - 1;
            }
        }
    }
    function simplifyArray(tolerance, points) {  // This function will always result in less points than the source set

        const simplify = function(start, end) {
            var maxDist, index, i, xx , yy, dx, dy, ddx, ddy, p1, p2, p, t, dist, dist1,pxx,pyy;
            p1 = pp[start];
            p2 = pp[end];
            xx = p1[0];
            yy = p1[1];
            ddx = p2[0] - xx;
            ddy = p2[1] - yy;
            dist1 = (ddx * ddx + ddy * ddy);
            maxDist = tolerance;
            for (var i = start + 1; i < end; i++) {
                p = pp[i];
                if (ddx !== 0 || ddy !== 0) {
                    dx = p[0] - xx;
                    dy = p[1] - yy;
                    t = (dx * ddx + dy * ddy) / dist1;
                    if (t > 1) {
                        dx = p[0] - p2[0];
                        dy = p[1] - p2[1];
                    } else if (t > 0) {
                        dx -= ddx * t;
                        dy -= ddy * t;
                    }
                } else {
                    dx = p[0] - xx;
                    dy = p[1] - yy;
                }
                dist = dx * dx + dy * dy
                if (dist > maxDist) {
                    index = i;
                    maxDist = dist;
                }
            }
            if (maxDist > tolerance) {
                if (index - start > 1) { simplify(start, index) }
                tp[simpleCount++] = [pp[index][0], pp[index][1], index];
                if (end - index > 1) { simplify(index, end) }
            }
        }
        const closest = (x,y,start,end) => {
            var i,xx,yy,dist,idx,min = Infinity;
            for(i = start; i < end; i ++){
                xx = x - pp[i][0];
                yy = y - pp[i][1];
                dist = (xx * xx + yy * yy);
                if(dist === 0){
                    return i;
                }else if(dist < min){
                    min = dist;
                    idx = i;
                }
            }
            return idx;


        }
        const tp = [];
        const tp1 = [];
        const pp = points;
        var simpleCount = 0;
        var end = points.length - 1;
        tp[simpleCount++] = [pp[0][0], pp[0][1], 0];
        simplify(0, end);
        tp[simpleCount++] = [pp[end][0], pp[end][1], end];
        var i = 0;
        var ds,x,y,dist,p2,p1 = tp[i];
        tp1.push([p1[0],p1[1]]);
        for(i = 1; i < simpleCount; i ++ ){
            p2 = tp[i];
            x = p2[0] - p1[0];
            y = p2[1] - p1[1];
            dist = (x * x + y * y) ** 0.5;
            if(dist > tolerance * 2) {
                x /= dist;
                y /= dist;
                const steps = dist / Math.ceil(dist / (tolerance * 2));
                ds = steps;
                while(ds < dist){
                    const dx = p1[0] + x * ds;
                    const dy = p1[1] + y * ds;
                    const ci = closest(dx,dy,p1[2], p2[2]);
                    tp1.push([pp[ci][0],pp[ci][1]]);
                    ds+=steps;
                }
            }
            tp1.push([p2[0],p2[1]]);
            p1 = p2;

        }

        return tp1;
    }
   // canonical spline
    function smooth() {
        const tension = paint.curveStep / 60;
        const isClosed = paint.fillMode === 1 || paint.fillMode === 4;
        var segments = paint.widthFade / (paint.lengthFade < 1 ? 1 : paint.lengthFade);
        segments = segments < 1 ? 1 : segments;
        const adaptiveSegmentation = paint.useAlphaDist;
        const segLen = paint.widthFade;
        const s = smoothed;
        const p = simple;
        smoothCount = 0;
        var sc = 0;
        const tensionCurve = curves.sprayColor;
        const spacingCurve = curves.spraySize;
        var p1,p2,p3,p4,i,t, step, end, t2,t3,t3_2,t2_3,c1,c2,c3,c4,x,y,dx,dy;
        step = 1 / segments;
        end = 1 - step * 0.5; // to stop floating point error missing last iteration
        const last = simpleCount - (isClosed ? 0 : 1)
        const secondLast = simpleCount - (isClosed ? 1 : 2);
        var x1,y1,x2,y2; // the start and end of the line segment being smoothed
        var xa,ya,xb,yb; // outside points a befor b after
        for (i = 0; i < last; i += 1) {
            if(isClosed){
                p1 = p[i ? i -1 : last]
                p2 = p[i];
                p3 = p[(i + 1) % last];
                p4 = p[(i + 2) % last];
            }else{
                p1 = p[i ? i -1 : 0]
                p2 = p[i];
                p3 = p[i + 1];
                p4 = p[i + (i===secondLast ? 1 : 2)];
            }
            x1 = p2[X]
            y1 = p2[Y]
            x2 = p3[X]
            y2 = p3[Y]
            xa = x1 - p1[X];
            ya = y1 - p1[Y];
            xb = p1[X] - x2;
            yb = p1[Y] - y2;
            dx = x2 - x1;
            dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy) + 0.0001;
            const la = Math.sqrt(xa * xa + ya * ya) + 0.0001;
            const lb = Math.sqrt(xb * xb + yb * yb) + 0.0001;
            dx /= len;
            dy /= len;
            xa /= la;
            ya /= la;
            xb /= lb;
            yb /= lb;
            const t1x = (x2 - p1[X]) * tension;
            const t1y = (y2 - p1[Y]) * tension;
            const t2x = (p4[X] - x1) * tension;
            const t2y = (p4[Y] - y1) * tension;
            if(s[sc] === undefined){
                s[sc] = [x1,y1,0,0,0, 0,0,0,0,0, 0,0,0];
            }else{
                s[sc][0] = x1;
                s[sc][1] = y1;
            }
            sc ++;
            if(adaptiveSegmentation){
                segments = len / (paint.lengthFade < 1 ? 1 : paint.lengthFade)
                if(segments <= 1){
                    step = end = 1;
                }else{
                    step = 1 / (segments + 1 | 0);
                    end = 1;
                }
            }
            var ti;
            for (ti = step; ti < end; ti+= step) {
                t = spacingCurve(ti);
                t2_3 = (t2 = t * t) * 3;
                t3_2 = (t3 = t2 * t) * 2;
                c1 = t3_2 - t2_3 + 1;
                c2 = t2_3 - t3_2;
                c3 = t3 - 2 * t2 + t;
                c4 = t3 - t2;
                x = c1 * x1 + c2 * x2 + c3 * t1x + c4 * t2x;
                y = c1 * y1 + c2 * y2 + c3 * t1y + c4 * t2y;
                if(s[sc] === undefined){
                    s[sc] = [x,y,0,0,0, 0,0,0,0,0, 0,0,0];
                }else{
                    s[sc][0] = x;
                    s[sc][1] = y;
                }
                sc ++;
            }
        }
        if(s[sc] === undefined){
            s[sc] = [x2,y2,0,0,0, 0,0,0,0,0, 0,0,0];
        }else{
            s[sc][0] = x2;
            s[sc][1] = y2;
        }
        sc ++;
        smoothCount = sc;
        smoothOn = true;
    }
    function smoothArray(simple,segments, cornerAngle = 0.7) {
        var count =  simple.length;
        if(count < 4) {
            simple.pop();
            return simple;
        }
        var tension = 0.5;
        const isClosed = true
        segments = segments < 1 ? 1 : segments;
        const s = [];
        const p = simple;
        var sc = 0;
        var p1,p2,p3,p4,i,t, step, end, t2,t3,t3_2,t2_3,c1,c2,c3,c4,x,y,dx,dy,cx,cy;
        step = 1 / segments;
        end = 1 - step * 0.5;
        const last = count - (isClosed ? 1 : 0)
        const secondLast = count - (isClosed ? 1 : 2);
        var x1,y1,x2,y2,x11,y11,x4,y4;
        var xa,ya,xb,yb;
        for (i = 0; i < last; i += 1) {
            if(isClosed){
                if(i === 0){
                    p1 = p[last-1]
                    p2 = p[i];
                    p3 = p[i + 1];
                    p4 = p[i + 2];
                }else{
                    p1 = p[i- 1]
                    p2 = p[i];
                    p3 = p[(i + 1) % last];
                    p4 = p[(i + 2) % last];
                }
            }else{
                p1 = p[i ? i -1 : 0]
                p2 = p[i];
                p3 = p[(i + 1) % count];
                p4 = p[(i + (i===secondLast ? 1 : 2)) % count];
            }
            x1 = p2[X]
            y1 = p2[Y]
            x2 = p3[X]
            y2 = p3[Y]
            x11 = p1[X]
            y11 = p1[Y]
            x4 = p4[X]
            y4 = p4[Y]
            xa = x1 - x11;
            ya = y1 - y11;
            xb = x11 - x2;
            yb = y11 - y2;
            dx = x2 - x1;
            dy = y2 - y1;
            cx = x4 - x2;
            cy = y4 - y2;
            var len = Math.sqrt(dx * dx + dy * dy) + 0.000001;
            var la = Math.sqrt(xa * xa + ya * ya) + 0.000001;
            var lc = Math.sqrt(cx * cx + cy * cy) + 0.000001;
            dx /= len;
            dy /= len;
            xa /= la;
            ya /= la;
            cx /= lc;
            cy /= lc;
            s[sc] = [x1, y1];
            sc ++;
            const cB = Math.abs(cx * dy - cy * dx);
            const cA = Math.abs(dx * ya - dy * xa);
            if(cB <= cornerAngle || cA <= cornerAngle) { // only segment curved
                if(cB > cornerAngle) {
                    x4 = x2 + dx * len;
                    y4 = y2 + dy * len;
                }
                if(cA > cornerAngle) {
                    x11 = x1 - dx * len;
                    y11 = y1 - dy * len;
                }
                tension = (1-Math.min(cA,cB) / cornerAngle) * 0.25 + 0.3;
                const t1x = (x2 - x11) * tension;
                const t1y = (y2 - y11) * tension;
                const t2x = (x4 - x1) * tension;
                const t2y = (y4 - y1) * tension;
                var ti;
                for (ti = step; ti < end; ti+= step) {
                    t = ti;
                    t2_3 = (t2 = t * t) * 3;
                    t3_2 = (t3 = t2 * t) * 2;
                    c1 = t3_2 - t2_3 + 1;
                    c2 = t2_3 - t3_2;
                    c3 = t3 - 2 * t2 + t;
                    c4 = t3 - t2;
                    x = c1 * x1 + c2 * x2 + c3 * t1x + c4 * t2x;
                    y = c1 * y1 + c2 * y2 + c3 * t1y + c4 * t2y;
                    s[sc] = [x, y];
                    sc ++;
                }
            }
        }
        s[sc]=[x2, y2]
        return s;
    }
    function noSmooth(){
        smoothCount = 0;
        const isClosed = paint.fillMode === 1 || paint.fillMode === 4;
        const s = smoothed;
        const p = simple;
        var sc = 0;
        var x1,y1,x2,y2,p1,p2,i,x,y,dx,dy,ti;
        const last = simpleCount - (isClosed ? 0 : 1)
        for (i = 0; i < last; i += 1) {
            if(isClosed){
                p1 = p[i]
                p2 = p[i + 1 === last ? 0 : i + 1];
            }else{
                p1 = p[i]
                p2 = p[i+1];
            }
            x1 = p1[X]
            y1 = p1[Y]
            x2 = p2[X]
            y2 = p2[Y]
            dx = x2 - x1;
            dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy) + 0.0000001;
            dx /= len;
            dy /= len;
            if(s[sc] === undefined){
                s[sc] = [x1,y1,0,0,0, 0,0,0,0,0, 0,0,0];
            }else{
                s[sc][0] = x1;
                s[sc][1] = y1;
            }
            sc ++;
            for (ti = 1; ti < len; ti+= 1) {
                x = x1 + dx * ti;
                y = y1 + dy * ti;
                if(s[sc] === undefined){
                    s[sc] = [x,y,0,0,0, 0,0,0,0,0, 0,0,0];
                }else{
                    s[sc][0] = x;
                    s[sc][1] = y;
                }
                sc ++;
            }
        }
        if(s[sc] === undefined){
            s[sc] = [x2,y2,0,0,0, 0,0,0,0,0, 0,0,0];
        }else{
            s[sc][0] = x2;
            s[sc][1] = y2;
        }
        sc ++;
        smoothCount = sc;
        smoothOn = true;
    }
    function circulared(){
        const s = smoothed;
        var sc = 0;
        const p = paint.useDirection ? smoothed : simple;
        const last =  paint.useDirection ?smoothCount -1: simpleCount- 1;

        var dist = 0;
        var p1,p2,p3,p4,i,dx,dy,len;
        for (i = 0; i < last; i += 1) {
            p1 = p[i]
            p2 = p[i+1];
            if(i + 2 >= last + 1){
                p3 = p[i + 1];
            }else{
                p3 = p[i + 2];
            }
            if(i > 0){
                p4 = p[i-1];  //7 -8
                dx = p1[0] - p4[0];
                dy = p1[1] - p4[1];
                len = Math.sqrt(dx*dx+dy*dy);
                dist += len;
            }
            if(s[sc] === undefined){
                s[sc] = [p1[0],p1[1],0,0,0, 0,0,0,0,0 ,0,0,dist];
            }else{
                s[sc][0] = p1[0];
                s[sc][1] = p1[1];
                s[sc][12] = dist;
            }
            fitArc(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1]);
            if(fitArcResult.use){
                s[sc][2] = fitArcResult.x;
                s[sc][3] = fitArcResult.y;
                s[sc][4] = fitArcResult.r;
                s[sc][5] = fitArcResult.start;
                s[sc][6] = fitArcResult.end;
                s[sc][11] = fitArcResult.mid;
				/*const cLen = Math.abs((fitArcResult.start - fitArcResult.mid) * fitArcResult.r);
				if (i > 0) {
					dist -= len;
					dist += cLen;
				}
				s[sc][12] = dist;*/


            }else{
                s[sc][2] = 0;
                s[sc][3] = 0;
                s[sc][4] = 0;
                s[sc][5] = 0;
                s[sc][6] = 0;
                s[sc][11] = 0;
            }
            sc ++;
        }
        p1 = p[i]; //9
         if(i >= 1){
            p4 = p[i-1]; //8-9
            dx = p1[0] - p4[0];
            dy = p1[1] - p4[1];
            len = Math.sqrt(dx*dx+dy*dy);
            dist += len;
        }
        if(s[sc] === undefined){
            s[sc] = [p1[0],p1[1],0,0,0, 0,0,0,0,0, 0,0,dist];
        }else{
            s[sc][0] = p1[0];
            s[sc][1] = p1[1];
            s[sc][12] = dist;
        }
        s[sc][2] = 0;
        s[sc][3] = 0;
        s[sc][4] = 0;
        s[sc][5] = 0;
        s[sc][6] = 0;
        s[sc][11] = 0;
        sc ++;
        smoothCount = sc;
        smoothOn = true;
        strokeLen = dist;
    }
    function setNormals(points,count){
        var len,dx,dy,i,p;
        const isClosed = paint.fillMode === 1 || paint.fillMode === 4;
        const end = count  + (isClosed ? 1 : 0);
        var length = 0;
        p = points[0];
        p[LEN] = 0;
        for(i = 1; i < end; i++){
            const p1 = points[i % count];
            dx = p1[X] - p[X];
            dy = p1[Y] - p[Y];
            len = Math.sqrt(dx * dx + dy * dy);
            p[NX] = dx / len;
            p[NY] = dy / len;
            length += len;
            p1[LEN] = length;
            p = p1;
        }
        if(!isClosed){
            p[NX] = dx / len;
            p[NY] = dx / len;
        }
         haveNormals = true;
         strokeLen = length;
    }
    var dist1,dist2,nx1,ny1,nx2,ny2;
    function dotAngle(x, y, xx, yy) {
        dist1 = Math.sqrt(x * x + y * y);
        nx1 = x / dist1;
        ny1 = y / dist1;
        dist2  = Math.sqrt(xx * xx + yy * yy);
        nx2 = xx / dist2;
        ny2 = yy / dist2;
        return Math.acos(nx1 * nx2 + ny1 * ny2);
    }
    function smoothShape (cornerThres,amount,balance,match,dontClose){  // adds bezier control points at points if lines have angle less than thres
        // points: list of points
        // cornerThres: when to smooth corners and represents the angle between to lines.
        //     When the angle is smaller than the cornerThres then smooth.
        // amount: the distance the bezier control points move out from the end point.
        //     It represents the preportion of the line length.
        // match: if true then the control points will be balanced.
        //     The distance away from the end point is amount of the shortest line
        // balance: 0-1 Only smooth lines with balanced line lengths. 0 lines must have
        //     equal distance. 0.5 one line must be at least half as long. 1 don care what length
        var dir1,dir2,p1,p2,p3,x,y,endP,len,tau,angle,i,newPoints,aLen,closed,bal,cont1;
        if (amount < 0.001) { return points }
        if (amount > 0.5) { amount = 0.5 }
        aLen = count;
        p1 = points[0];
        p2 = points[count-1];
        if(aLen <= 2){
           p1[BEZ] = p1[0];
           p1[BEZ+1] = p1[1];
           p1[BEZ+2] = p2[0];
           p1[BEZ+3] = p2[1];
            return
        }
        balance = 1-balance;
        p1 = points[0];
        p2 = points[1];
        endP =points[aLen-1];
        i = 1;  // start from second poitn if line not closed
        closed = false;
        if(dontClose !== true){
        }else{
           p1[BEZ] = p1[0];
           p1[BEZ+1] = p1[1];
           p1[BEZ+2] = p2[0];
           p1[BEZ+3] = p2[1];
            i = 0;
        }
        for(; i < aLen-1; i++){
            p2 = points[i];
            p3 = points[i + 1];
            angle = Math.abs(dotAngle(p2[0] - p1[0], p2[1] - p1[1], p3[0] - p2[0], p3[1] - p2[1]));
            if(dist1 !== 0){
                if(dist2 === 0){
                    bal =-1;
                }else{
                    bal = dist1 > dist2 ? dist2 / dist1 : dist1 / dist2;
                }
                if( angle < cornerThres*3.14 && bal >= balance){
                      if(match){
                          dist1 = Math.min(dist1,dist2);
                          dist2 = dist1;
                      }
                      x = (nx1 + nx2) / 2;
                      y = (ny1 + ny2) / 2;
                      len = Math.sqrt(x * x + y * y);  // normalise the tangent
                      if(len === 0){
                          p2[BEZ] = NaN;
                      }else{
                          x /= len;
                          y /= len;
                          p2[NX] = x;
                          p2[NY] = y;
                          if(i > 0){
                              p1[BEZ + 2] = p2[0] - x * dist1 * amount;
                              p1[BEZ + 3] = p2[1] - y * dist1 * amount;
                          }
                          p2[BEZ + 0] = p2[0] + x * dist2 * amount;
                          p2[BEZ + 1] = p2[1] + y * dist2 * amount;
                      }
                }else{
                    p2[NX] = nx2;
                    p2[NY] = ny2;
                    p1[BEZ + 2] = p2[0];
                    p1[BEZ + 3] = p2[1];
                    p2[BEZ + 0] = p2[0];
                    p2[BEZ + 1] = p2[1];
                }
            }
            p1 = p2;
        }
        if(closed){
        }else{
            p2[BEZ + 2] = p3[0];
            p2[BEZ + 3] = p3[1];
            //newPoints.push([points[points.length-1][0],points[points.length-1][1]]);
        }
        //return newPoints;
    }
    function simplifyFixedLength(){  // This function is from older version of code, and I have left here in case I want to use a it as an aulturnative to simplify
                                    // It does not work in this (curved) context so dont use.
        var tail = 0
        var i;
        var lx,ly;
        var dist = 0;
        const minLen = paint.lengthFade;
        for(i = 0; i < count; i ++){
            var t = points[tail];
            var p = points[i]
            if(p[X] !== lx || p[Y] !== ly){
                if(lx !== undefined){
                    var nx = p[X] - lx;
                    var ny = p[Y] - ly;
                    const d = ((nx ** 2) + (ny ** 2)) ** 0.5;
                    if(d >= minLen || i === count-1){
                        dist += d;
                        points[tail-1][NX] = nx / d;
                        points[tail-1][NY] = ny / d;
                        t[LEN] = dist;
                        lx = t[X] = p[X];
                        ly = t[Y] = p[Y];
                        tail ++;
                    }
                }else{
                    t[LEN] = dist;
                    lx = t[X] = p[X];
                    ly = t[Y] = p[Y];
                    tail ++;
                }
            }
        }
        if(tail < 2){
            points[1][NX] = 1;
            points[1][NY] = 0;
            points[1][X] = points[0][X];
            points[1][Y] = points[0][Y];
            points[1][LEN] = 1;
            points[1][ULEN] = 1;
            tail = 2;
            dist = 1;
        }else{
            points[tail - 1][NX] = points[tail - 2][NX];
            points[tail - 1][NY] = points[tail - 2][NY];
        }
        strokeLen = dist;
        count = tail;
        for(i = 0; i < count; i ++){
            points[i][ULEN] = points[i][LEN] / strokeLen;
            pointsTemp[i][X] = points[i][X]
            pointsTemp[i][Y] = points[i][Y]
        }
        if(count >= 4){
            API.smooth();
            smoothOn = true;
        }else{
           smoothOn = false;
        }
    }
    function startPoint(x,y){
        const p = points[0];
        const s = simple[0];
        p[X] = s[0] = x;
        p[Y] = s[1] = y;
        count = 1;
        simpleCount = 1;
        if(API.pointMode){
            const s1 = simple[1];
            const p1 = points[1];
            p1[X] = s1[0] = x;
            p1[Y] = s1[1] = y;
            const s2 = simple[2];
            const p2 = points[2];
            p2[X] = s2[0] = x;
            p2[Y] = s2[1] = y;
            count = 2;
            simpleCount = 2;
        }
    }
    function nextPoint(x,y,index){
        const p1 = points[index - 1]
        const p2 = points[index]
        var dx = x - p1[X];
        var dy = y - p1[Y];
        const len = Math.sqrt(dx * dx + dy * dy);
        if(!API.pointMode && len === 0){ return index }
        p2[X]     = x;
        p2[Y]     = y;
        if(API.pointMode){
            const s = simple[index];
            s[0] = x;
            s[1] = y;
            simpleCount = index + 1;
        }
        index += 1;
        return index;
    }
    function addBlankPoint(pos){
        if(points[pos] === undefined) { points[pos] = [0,0,false] }
        if(simple[pos] === undefined) {simple[pos] = [0,0,0,0,0,0,0,0] }
    }
    var mouseButtonStart = 0;
    const API = {
        simplifyPathArray : simplifyArray,
        smoothPathArray : smoothArray,
        pointMode : false,
        get line() {
            return {
                points : smoothOn ? smoothed : simple,
                count : smoothOn ? smoothCount : simpleCount,
            }
        },
        each(cb) { for(var i = 0; i < count; i ++) { cb(points[i],i) } },
        eachLocal(cb){
            var i;
            const points = smoothOn ? smoothed : simple;
            const count = smoothOn ? smoothCount : simpleCount;
            for (i = 0; i < count; i++) { cb(points[i], i) }
        },
        eachReverse(cb) {
            var i,ii;
            for(i = 0; i < count; i ++){
                ii = count - i - 1;
                cb(points[ii], ii);
            }
        },
        pointsToLocal(spr) {
            var i,dx,dy,p;
            const points = smoothOn ? smoothed : simple;
            const count = smoothOn ? smoothCount : simpleCount;
            if(circularedOn){
                for (i = 0; i < count; i++) { spr.key.arrayCircleToLocal(points[i]) }
            }else{
                for (i = 0; i < count; i++) { spr.key.arrayPointToLocal(points[i]) }
            }
        },
        addPoint(x,y) {
            if(API.pointMode){
                if (count === 0) {
                    processedPoints = 0;
                    simpleProcessed = 0;
                    startPoint(x, y);
                    mouseButtonStart = mouse.button;
                    API.clean()
                }else{
                    //processedPoints = 0;
                    //simpleProcessed = 0;
                    if((mouse.button & 0b101) === 0b101) {
                        if(count === 2){
                            const p1 = points[count-1];
                            const s1 = simple[count-1];
                            const p2 = points[count];
                            const s2 = simple[count];
                            s1[0] = p1[0] = p2[X];
                            s1[1] = p1[1] = p2[Y];
                        }
                        count = nextPoint(x,y,count);
                        addBlankPoint(count);
                        mouse.button = mouseButtonStart;
                    }
                    const p1 = points[count-1];
                    const s1 = simple[count-1];
                    const p2 = points[count];
                    const s2 = simple[count];
                    //if(count === 2){
                    //    s1[0] = p1[X] = x - (x - points[0][X]) * 0.001;
                    //    s1[1] = p1[Y] = y - (y - points[0][Y]) * 0.001;
                   // }else{
                        s1[0] = p1[X] = x;
                        s1[1] = p1[Y] = y;
                   // }
                    s2[0] = p2[X] = x;
                    s2[1] = p2[Y] = y;
                    if (count > 2) {
                        const p = points[count-2];
                        const dx = p1[X] - p[X];
                        const dy = p1[Y] - p[Y];
                        const len = (dx * dx + dy * dy) ** 0.5;

                        if(len >= 0.1){
                            API.clean();
                        }else{
                            const pn = points[count-3];
                            const dx = p[X] - pn[X];
                            const dy = p[Y] - pn[Y];
                            const len = (dx * dx + dy * dy) ** 0.5;
                            s1[0] = p1[X] = s2[0] = p2[X] = p[X] + (dx / len);
                            s1[1] = p1[Y] = s2[1] = p2[Y] = p[Y] + (dy / len);
                            API.clean();
                        }
                    } else {
                        API.clean();
                    }
                }
            } else {
                addBlankPoint(count);
                if (count === 0) {
                    simpleProcessed = 0;
                    processedPoints = 0;
                    startPoint(x,y);
                } else {
                    var nextCount = nextPoint(x,y,count);
                    if (nextCount !== count) {
                        count = nextCount;
                        if (count > 3) { API.clean() }
                    }
                }
            }
        },
        release() {
            API.reset();
            points.length = 3;
            simple.length = 3;
            smoothed.length = 3;
        },
        reset() {
            count = 0;
            simpleCount = 0;
            smoothOn = false;
            smoothCount = 0;
            haveNormals = false;
            circularedOn = paint.useSizeDist;
            strokeLen = 0;
        },
        clean() {
            haveNormals = false;
            if(paint.widthFade <= 3){
                simplify(0.01)
                noSmooth();
                setNormals(smoothed,smoothCount);
            } else {
                if (! API.pointMode ) { simplify(((paint.widthFade - 3) / 4) ** 1.25) }
                if (circularedOn) {
                    if (paint.useDirection) { smooth() }
                    circulared();
                } else { smooth() }
                if (smoothOn) {
                    if (!circularedOn) { setNormals(smoothed,smoothCount) }
                } else { setNormals(simple,simpleCount) }
            }
            haveNormals = false;
        },
        isSmoothed() { return smoothOn },
        get length() {return strokeLen},
    }
    return API;
})();