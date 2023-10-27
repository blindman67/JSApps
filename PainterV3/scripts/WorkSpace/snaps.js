"use strict";
// Snap mouse ui is handled by guides.js
const snaps = (()=> {
    var snapOpenColor, snapLockedColor, snapCrossSize;
    function getSettings(){
        snapOpenColor = settings.snapOpenColor;
        snapLockedColor = settings.snapLockedColor;
        snapCrossSize = settings.snapCrossSize;
    }
    getSettings();
    settingsHandler.onchange = getSettings;


    const lines = [];
    const rectangles = [];
    const circles = [];
    const points = [];
    const workPoint = utils.point;
    const workPoint1 = utils.point;
    const wp1 = workPoint;
    const wp2 = workPoint1;
    var minDist = 0;
    function circleCircleIntercept(c1,c2,p1,p2){
        const as = c1.aspect;
        var v1x = (c2.p1.x - c1.p1.x) / as;
        var v1y = c2.p1.y - c1.p1.y;
        const dist = Math.sqrt(v1x * v1x + v1y * v1y);
        if(dist < 0.01 || dist > c1.radius + c2.radius || dist < Math.abs(c1.radius - c2.radius)){ return false }

        const len = (dist * dist - c1.radius * c1.radius + c2.radius * c2.radius) / ( 2 * dist);
        const off = Math.sqrt(c2.radius*c2.radius - len * len) / dist;
        const scLen = len / dist;
        const cx = c2.p1.x - v1x * scLen;
        const cy = c2.p1.y - v1y * scLen;
        p1.x = cx + (v1y = v1y * off) *as;
        p1.y = cy - (v1x = v1x * off);
        p2.x = cx - v1y * as;
        p2.y = cy + v1x;
        return true;
    }
    function circleLineIntercept(c1,line,p1,p2){
        var count = 0; // bit 1 flags first point, bit 2 flags second point
        const as = c1.aspect;
        const v1x = (line.p2.x - line.p1.x) / as;
        const v1y = line.p2.y - line.p1.y;
        const v2x = (line.p1.x - c1.p1.x) / as;
        const v2y = line.p1.y - c1.p1.y;
        const dot = (v1x * v2x + v1y * v2y) * -2;
        const lenSq2 = 2 * (v1x * v1x + v1y * v1y);
        const d = Math.sqrt(dot * dot - 2 * lenSq2 * (v2x * v2x + v2y * v2y - c1.radius * c1.radius));
        if (isNaN(d)) { return count } // no intercept

        // get unit dist along line to both intercepts
        const u1 = (dot - d) / lenSq2;  // first point from line start
        const u2 = (dot + d) / lenSq2;

        if(u1 >= 0 && u1 <= 1){
            p1.x = line.p1.x + (v1x * u1) * as;
            p1.y = line.p1.y + v1y * u1;
            count = 1;
        }
        if(u2 >= 0 && u2 <= 1){
            p2.x = line.p1.x + (v1x * u2) * as;
            p2.y = line.p1.y + v1y * u2;
            count += 2;
        }
        return count;
    }
    function lineLineIntercept(l1,l2,p1){
        const v1x = l1.p2.x - l1.p1.x;
        const v1y = l1.p2.y - l1.p1.y;
        const v2x = l2.p2.x - l2.p1.x;
        const v2y = l2.p2.y - l2.p1.y;
        const cross = v1x * v2y - v1y * v2x;
        if(cross !== 0){
            const v3x = l1.p1.x - l2.p1.x;
            const v3y = l1.p1.y - l2.p1.y;
            const u1 = (v1x * v3y - v1y * v3x) / cross;
            if(u1 >= 0 && u1 <= 1){
                const u2 = (v2x * v3y - v2y * v3x) / cross;
                if(u2 >= 0 && u2 <= 1){
                    p1.x = l1.p1.x + v1x * u2;
                    p1.y = l1.p1.y + v1y * u2;
                    return true;
                }
            }
        }
        return false;

    }
    function closestPointOnLine(line,px,py){
        const v1x = line.p2.x - line.p1.x;
        const v1y = line.p2.y - line.p1.y;
        const u = ((px - line.p1.x) * v1x + (py - line.p1.y) * v1y) / (v1y * v1y + v1x * v1x);
        if(u > 0 && u < 1){
            workPoint.x = line.p1.x + v1x * u;// - px;
            workPoint.y = line.p1.y + v1y * u;// - py;
            return workPoint;
        }
    }
    function findLine(x,y,dist){
        var foundPoint;
        var foundLine;
        for(const l of lines){
            if(closestPointOnLine(l,x,y)){
                const dx = workPoint.x - x;
                const dy = workPoint.y - y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if(d < dist){
                    workPoint1.x = workPoint.x;
                    workPoint1.y = workPoint.y;
                    foundPoint = workPoint1;
                    foundLine = l;
                    dist = d;
                    if(dist === 0){
                        minDist = 0;
                        API.foundLine = foundLine;
                        return foundPoint;
                    }
                }
            }
        }
        minDist = dist;
        API.foundLine = foundLine;
        return foundPoint;
    }
    function findCircle(x,y,dist){
        var foundPoint;
        var foundCircle;
        for(const c of circles){
            const as = c.aspect;
            var ang = Math.atan2(y - c.p1.y, (x / as - c.p1.x / as) );
            var dx = (workPoint.x = (Math.cos(ang) * c.radius * as + c.p1.x)) - x;
            var dy = (workPoint.y = (Math.sin(ang) * c.radius + c.p1.y)) - y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if(d < dist){
                workPoint1.x = workPoint.x;
                workPoint1.y = workPoint.y;
                foundPoint = workPoint1;
                foundCircle = c;
                dist = d;
                if(dist === 0){
                    minDist = 0;
                    API.foundCircle = foundCircle;
                    return foundPoint;
                }
            }
        }
        minDist = dist;
        API.foundCircle = foundCircle;
        return foundPoint;
    }
    function findPoint(x,y,dist){
        var foundPoint;
        for(const p of points){
            const dx = p.x - x;
            const dy = p.y - y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if(d < dist){
                foundPoint = p;
                dist = d;
                if(dist === 0){
                    API.foundPoint = foundPoint;
                    return foundPoint;
                }
            }
        }
        API.foundPoint = foundPoint;
        return foundPoint;
    }

    function addPoint(x,y){
        x = Math.floor(x) + 0.5;
        y = Math.floor(y) + 0.5;
        var p = findPoint(x, y, 1);
        if(p === undefined) {
            p = utils.point.as(x,y);
            points.push(p);
        }
        return p;

    }
    const API = {
        foundPoint : undefined,
        foundLine : undefined,
        foundCircle : undefined,
        foundRectangle : undefined,
        lock: false,
        hasSnaps() {
            if (rectangles.length || circles.length || lines.length || points.length) {
                return true;
            }
            return false;
        },
        clearAll(){
            rectangles.length = 0;
            circles.length = 0;
            lines.length = 0;
            points.length = 0;
            API.foundPoint = undefined;
            API.foundLine = undefined;
            API.foundCircle = undefined;
            API.foundRectangle = undefined;
            API.lock = false;
        },
        addPoint(x, y) { if(!API.lock) { addPoint(x, y) } },
        addLine(x1,y1,x2,y2){
            if (API.lock) { return }
            const p1 = addPoint(x1,y1);
            const p2 = addPoint(x2,y2);
            const line = {p1,p2};
            for(const line1 of lines){
                if(lineLineIntercept(line, line1, wp1)) { addPoint(wp1.x, wp1.y) }
            }
            for(const circle of circles){
                const found = circleLineIntercept(circle,line,wp1,wp2);
                if(found & 1){ addPoint(wp1.x, wp1.y) }
                if(found & 2){ addPoint(wp2.x, wp2.y) }
            }
            lines.push(line);
        },
        addRectangle(x1,y1,x2,y2){
            if (API.lock) { return }
            API.addLine(x1,y1,x2,y1);
            API.addLine(x2,y1,x2,y2);
            API.addLine(x2,y2,x1,y2);
            API.addLine(x1,y2,x1,y1);

            //const p1 = addPoint(x1,y1);
            //const p2 = addPoint(x2,y2);
            //rectangles.push({p1,p2});
        },
        addCircle(x1,y1,radius,aspect,alias = false){
            if (API.lock) { return }
            const p1 = addPoint(x1,y1);
            const c1 = {p1,radius,aspect};
            if (alias) { p1.alias = true }
            for (const c2 of circles) {
                if (circleCircleIntercept(c1,c2,wp1,wp2)) {
                    addPoint(wp1.x, wp1.y);
                    addPoint(wp2.x, wp2.y);
                }
            }
            for (const line of lines) {
                const found = circleLineIntercept(c1,line,wp1,wp2);
                if (found & 1) { addPoint(wp1.x, wp1.y) }
                if (found & 2) { addPoint(wp2.x, wp2.y) }
            }
            addPoint(x1,y1 + radius);
            addPoint(x1,y1 - radius);
            addPoint(x1 + radius * aspect, y1);
            addPoint(x1 - radius * aspect, y1);

            // Removed as not sure why this is here????
            //const f = (((radius * aspect) ** 2) - (radius ** 2)) ** 0.5;
            //addPoint(x1 + f,y1);
            //addPoint(x1 - f,y1);
            circles.push(c1);
        },
        findSnap(x,y,dist){
            API.foundPoint = undefined;
            API.foundLine = undefined;
            API.foundCircle = undefined;
            API.foundRectangle = undefined;
            var p = findPoint(x,y,dist);
            if(p === undefined){
                p = findLine(x,y,dist);
                if(minDist > 0){
                    var p1 = findCircle(x,y,minDist);
                    if(p1) {
                        p = p1;
                    }
                }
            }
            return p;
        },
        draw() { // for debug, maybe as part of feedback UI
            const ctx = view.context;
            const size = snapCrossSize / view.scale;
            view.apply();
            ctx.strokeStyle = API.lock ?  snapLockedColor : snapOpenColor;
            ctx.beginPath();
            for(const point of points){
                ctx.moveTo(point.x - size, point.y);
                ctx.lineTo(point.x + size, point.y);
                ctx.moveTo(point.x, point.y - size);
                ctx.lineTo(point.x, point.y + size);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    return API;
})();