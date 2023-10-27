"use strict";

/* THIS is a filler as a much better solution is possible and there is some experimentation left to do */

const mouseBrush = (()=>{
    const p = {x : 0, y : 1};
    const points = [{...p},{...p},{...p},{...p},{...p},{...p},{...p},{...p},{...p},{...p},{...p}];
	/*const mouseRecord = [];
	const recLen = 1000;
	var recPos = 0;
	var recDif = 0;
	for(let i = 0; i < recLen; i ++) {
		mouseRecord[i] = utils.point;
	}*/
    const maxLen = points.length;
    const back = maxLen - 1;
    var pos = 0
    var sc = 0;
    var lx = 0,ly = 0;
    var ldx = 0,ldy = 0;
    var prevX, prevY;
    var prevX1, prevY1;

    var lastMouse = 0;
    const dirChange = Smoother(0.6,0.3);
    const dirChangeA = Smoother(0.4,0.3);
    const speed = Smoother(0.6,0.3);
    const posA = Smoother2D(0.6,0.3);
    const posB = Smoother2D(0.6,0.3);
    const posC = Smoother2D(0.6,0.3);
    var x1,y1,x2,y2,x3,y3,l1,l2,l3,c1,c2,d1,d2;  // l for length, c for cross product, d for dot product
    var mx = 0, my = 0;
    var dirC1,dirC2;
    var dirChangeB,dir,s;
    var oneWayBrush = false;

    var brushTrackRate = 0.5;
    const API = {
        set oneWay(val) { oneWayBrush = val },
        get trackRate() { return brushTrackRate },
        set trackRate(value) {
            if(value < 0) {
                brushTrackRate += brushTrackRate * value;
            }else{
                brushTrackRate += (1 - brushTrackRate) * value;
            }
            log("Track rate "+ brushTrackRate.toFixed(3));
        },
        resetDirection(newDir, keep = false){
            API.directionAccum = newDir;
            API.directionChange = 0;
            API.direction = newDir;
            if(!keep) {
                API.speedChange = 0;
                API.speed = 0;
                prevX = undefined;
            }
        },
        add(x,y){
            API.directionPrev = API.direction;
            if(prevX === undefined){
                prevX1 = prevX = x;
                prevY1 = prevY = y;
            }
            x = x * brushTrackRate + (prevX * brushTrackRate + prevX1 * (1-brushTrackRate)) * (1-brushTrackRate);
            y = y * brushTrackRate + (prevY * brushTrackRate + prevY1 * (1-brushTrackRate)) * (1-brushTrackRate);
            if(x === prevX && y === prevY){
                API.directionChange = 0;
                API.speedChange = -API.speed;
                API.speed = 0;
            }else{
                const dx = x - prevX;
                const dy = y - prevY;
                const speed = Math.sqrt(dx * dx + dy * dy);
                API.speedChange = speed - API.speed;
                const dir = Math.atan2(dy, dx);
                this.directionAbsolute = dir;
                x2 = Math.cos(API.direction);
                y2 = Math.sin(API.direction);
                x1 = Math.cos(dir);
                y1 = Math.sin(dir);
                const cross = x2 * y1 - y2 * x1;
                const dot = x2 * x1 + y2 * y1;
                if (dot < 0) { dirChangeB = cross < 0 ? -Math.PI - Math.asin(cross) : Math.PI - Math.asin(cross) }
                else { dirChangeB = Math.asin(cross) }
                if (oneWayBrush) {
                    if (dirChangeB > Math.PI * 0.75) { dirChangeB = 0 }
                    if (dirChangeB < -Math.PI * 0.75) { dirChangeB = 0 }
                }
                API.direction += dirChangeB;
                API.directionAccum += dirChangeB;
                API.directionChange = dirChangeB;

                API.speed = speed;
                API.speedTrack = 0;
            }
            prevX1 = prevX;
            prevY1 = prevY;
            prevX = x;
            prevY = y;
        },
        directionAbsolute : 0,
        directionPrev : 0,
        direction : 0,
        directionChange : 0,
        directionStepChange : 0,
        directionAccum : 0,
        distAccum : 0,
        distAccumSmooth : 0,
        lastDir : {...p},
        speed : 0,
        speedTrack : 0,
        speedSmooth : 0,
        speedChange : 0,
    };

    return API;
})();

