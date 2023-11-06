"use strict";
//======================================================================================================================
// Math
Math.EPSILON = 0.001; // for pixels ops
Math.EPSILON_PI = Math.PI / 1000;
Math.PI2 = Math.TAU = Math.PI * 2;
Math.PI90 = Math.PI * 0.5;
Math.PI270 = Math.PI90 * 3;
Math.W16 = 255 * 255;  // Dynamic range of color channels
Math.normAngle = a => ((a % Math.PI2) + Math.PI2) % Math.PI2;
Math.fEqual = (f1,f2) => Math.abs(f1 - f2) < Math.EPSILON;
Math.unit = n => Math.max(0, Math.min(1, n));
Math.sqr = n => n * n;
Math.mod = n => (n % 1 + 1) % 1;
Math.cmod = (val, mod) => {
    var n = mod * 2;
    val = (val % n + n) %  n;
    return  val > mod ? n - val : val;
}
Math.roots = {count: 0, a:undefined, b:undefined};
Math.quadRoots = (a, b, c) => { // find roots for quadratic. Return number of roots found
    if (Math.abs(a) < 1e-6) {
        Math.roots.a = b != 0 ? 0.5 * (-c / b) : undefined;
        return Math.roots.count = (b != 0 ? 1 : 0);
    }
    b /= a;
    var d = b * b - 4 * (c / a);
    if (d > 0) {
        d = d ** 0.5;
        Math.roots.a = 0.5 * (-b + d);
        Math.roots.b = 0.5 * (-b - d);
        return Math.roots.count = 2;
    }
    Math.roots.a = d === 0 ? 0.5 * (-b + d) : undefined;
    return Math.roots.count = (d === 0 ? 1 : 0);
}
Math.polyArea = p => {
    var i = 0, a = 0, l = p.length;
    while (i < l) { a += p[i++] * p[(i + 2) % l] - p[i++] * p[i % l] }
    return Math.abs(0.5 * a);
}
Math.sqrtAbs = v => Math.sqrt(Math.abs(v));
Math.floorAbs = v => Math.floor(Math.abs(v));
Math.resolution = (v, res = 0.1) => res === 0 ? v : Math.round(v * (1 / res)) * res;
Math.rand = n => Math.random() * n;
Math.randO = n => (Math.random() - 0.5) * n;
Math.randOP = (n, p = 2) => (Math.random() ** p * n) * (Math.random() < 0.5 ? 1 : -1);
Math.randP = (n, p = 2) => Math.random() ** p * n;
Math.randPn = (n, p = 2) => Math.random() ** p * n * Math.sign(Math.random() - 0.5);
Math.randR = (m, M) => Math.random() * (M - m) + m;
Math.notZero = (n, dist = 0.01) => Math.abs(n) < dist ? (n < 0 ? -dist : dist) : n;
Math.vecDot2d = (xa, ya, xb, yb) => xa * xb + ya * yb;
Math.vecCross2d = (xa, ya, xb, yb) => xa * yb - ya * xb;
Math.uVecCross2d = (xa, ya, xb, yb) => {
    const l = Math.sqrt((xa * xa + ya * ya) * (xb * xb + yb * yb));
    return l !== 0 ? (xa  * yb  - ya * xb) / l : 0;
}
Math.uVecDot2d = (xa, ya, xb, yb) => {
    const l = Math.sqrt((xa * xa + ya * ya) * (xb * xb + yb * yb));
    return l !== 0 ? (xa  * xb  + ya * yb) / l : 1;
}
Math.sVecCross2d = (xa, ya, xb, yb) => {
    const l = xa * xa + ya * ya;
    return l !== 0 ? (xa  * yb  - ya * xb) / l : 0;
}
Math.sVecDot2d = (xa, ya, xb, yb) => {
    const l = xa * xa + ya * ya;
    return l !== 0 ? (xa  * xb  + ya * yb) / l : 0;
}
Math.angleVec2d = (xa, ya, xb, yb) => {
    const l = Math.sqrt((xa * xa + ya * ya) * (xb * xb + yb * yb));
    var ang = 0;
    if (l !== 0) {
        ang = Math.asin((xa  * yb  - ya * xb) / l);
        if (xa  * xb  + ya * yb < 0) { ang = (ang < 0 ? -Math.PI: Math.PI) - ang }
    }
    return ang;
}
Math.polar2d = (ang, dist) => [Math.cos(ang) * dist, Math.sin(ang) * dist];
Math.asinc = n => Math.asin(Math.max(-1, Math.min(1, n)));
Math.acosc = n => Math.acos(Math.max(-1, Math.min(1, n)));
Math.polarEllipse2d = (ang, w, h, dir) => {
    const x = Math.cos(ang) *  w, y = Math.sin(ang) * h, ax = Math.cos(dir), ay = Math.sin(dir);
    return [x * ax - y * ay, x * ay + y * ax];
}
Math.select = (idx, ...items) => {var l = items.length; return items[((idx % l + l) % l) | 0]};
Math.angEqual = (a1, a2) => { const dif = Math.abs(Math.normAngle(a1) - Math.normAngle(a2)); return dif < Math.EPSILON_PI || dif > Math.PI2-Math.EPSILON_PI }
Math.axisEqual = (a1, a2) => { const dif = Math.abs((Math.normAngle(a1) % Math.PI) - (Math.normAngle(a2)  % Math.PI)); return dif < Math.EPSILON_PI || dif > Math.PI-Math.EPSILON_PI }
Math.uClamp = v => v  < 0 ? 0 : v > 1 ? 1 : v;
Math.triAngle = (a, b, c) => {
    const res = (a * a + b * b - c * c) / (2 * a * b);
    return Math.acos(res > 1 ? 1 : res < 0 ? 0 : res);
}
Math.triLength = (ang, a, b) => (a * a + b * b - 2 * a * b * Math.cos(ang)) ** 0.5; 


function easeBell(v, p = 2){
    if (v <= 0 || v >= 1) { return 0 }
    const vv = (v = v > 0.5 ? 2 - v * 2 : v * 2) ** p;
    return vv / (vv + ((1 - v) ** p));
}
const sCurve   = (v, p = 2) => (2 / (1 + (p**-v))) -1;
const eCurve   = (v, p = 2, vp) =>  v < 0 ? 0 : v > 1 ? 1 : (vp = v ** p) / (vp + (1 - v) ** p);

/*
const cirCurve  = (v, r = 0.5) => {
    if (v <= 0) { return 0 }
    if (v >= 1) { return 1 }
    if (r <= 0) { return v }
    r = r > 0.5 ? 0.5 : r;
    const rr = r * r;
    const v1 = 1 - v;
    if (r === 0.5) {
        if (v <= 0.5) { return r - (rr -  v * v) ** 0.5 }
        return 1 - (r - (rr -  v1 * v1) ** 0.5);
    }

    const d = (0.25 + (0.5 - r) ** 2) ** 0.5;
    const w = Math.cos(Math.acos(0.5 / d) - Math.acos(r / d)) * r;


    if (v <= w) { return r - (rr -  v * v) ** 0.5 }
    if (v1 <= w) { return 1 - (r - (rr -  v1 * v1) ** 0.5) }
    const rrww = r - (rr - w * w) ** 0.5;
    return (v - w) * (0.5 - rrww) / (0.5 - w) + rrww;

}
const eCirCurve = (v, r, p) => eCurve(cirCurve(v,r),p);
const cirRForWCurve  = (() => {
    const wForR = (r) => {
        if (r <= 0) { return 0 }
        if (r >= 0.5) { return 1 }
        r = r > 0.5 ? 0.5 : r;
        const rr = r * r;
        const d = (0.25 + (0.5 - r) ** 2) ** 0.5;
        const w = Math.cos(Math.acos(0.5 / d) - Math.acos(r / d)) * r;
        return w ;
    }
    const R = [];
    const steps = 300;
    var i = 0;
    while (i <= steps) {
        const r = (i / steps) / 2;
        const w = wForR(r);
        var idx = w * steps | 0;
        if (R[idx] === undefined) { R[idx] = r }
        i += 1;
    }
    return (w) => {
        if (w <= 0) { return 0 }
        if (w >= 0.5) { return 0.5 }
        const idx = (w * steps);
        const r1 = R[idx | 0];
        const r2 = R[idx + 1 | 0];
        return (r2 - r1) * (idx % 1) + r1;
    };
})();
*/

const sqrWave  = v => Math.abs(v) % 1 < 0.5 ? 0 : 1;
const sortAscending = (a, b) => a - b;
const sortDescending = (a, b) => b - a;

//const eCurve   = (num, pow = 2) =>  num < 0 ? 0 : num > 1 ? 1 : num ** pow / (num ** pow + (1 - num) ** pow);
function fitArc(p1x, p1y, p2x, p2y, p3x, p3y, fitArcResult = {}, maxRadius = Infinity, minAngle = 0, minBalance = 0){ // find center, radius and start end angles to fit all 3 points on arc perimiter if possible. If not returns undefined
    var x, y, a, b, c;
    fitArcResult.use = false;
    const dif1 = p1y - p2y;
    const dif2 = p2y - p3y;
    if (dif1 === 0 && dif2 === 0) { return fitArcResult }
    if (dif1 !== 0 && dif2 !== 0) {
        const s21 = (p2x - p1x) / dif1;
        const s23 = (p3x - p2x) / dif2;
        if (s21 === s23)  { return fitArcResult }
        const u = (p1y + p2y - (p1x + p2x) * s21) * 0.5;
        x = ((p2y + p3y - (p2x + p3x) * s23) * 0.5  - u) / (s21 - s23);
        y = s21 * x + u;
    } else if (dif1 === 0){
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
    var d1x = p2x - p1x;
    var d1y = p2y - p1y;
    var d2x = p3x - p2x;
    var d2y = p3y - p2y;
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    d1x /= len1;
    d1y /= len1;
    fitArcResult.lineLen = len1;
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
    d2x /= len2;
    d2y /= len2;
    fitArcResult.lineLen += len2;
	fitArcResult.balance = Math.min(len1, len2) / Math.max(len1, len2);
	if (fitArcResult.balance < minBalance) { return fitArcResult }
	const dot = d1x * d2x + d1y * d2y;
	if (fitArcResult.r > maxRadius || dot < -0.9 || len1 < 2 || len2 < 2) { return fitArcResult }
    fitArcResult.start =  Math.atan2(dy, dx);
    fitArcResult.mid  = Math.atan2(p2y - y, p2x - x);
    fitArcResult.end  = Math.atan2(p3y - y, p3x - x);
    const cross = d1x * d2y - d1y * d2x;
	fitArcResult.angle = dot > 0 ? Math.PI - Math.abs(Math.asin(cross)) : Math.abs(Math.asin(cross));
	if(fitArcResult.angle < minAngle) { return fitArcResult }
    if (cross < 0){
        fitArcResult.r = -fitArcResult.r;
        fitArcResult.mid -= fitArcResult.mid > fitArcResult.start ? Math.PI2 : 0;
        fitArcResult.end -= fitArcResult.end > fitArcResult.start ? Math.PI2 : 0;
    } else {
        fitArcResult.mid += fitArcResult.mid < fitArcResult.start ? Math.PI2 : 0;
        fitArcResult.end += fitArcResult.end < fitArcResult.start ? Math.PI2 : 0;
    }
    fitArcResult.len = (fitArcResult.end - fitArcResult.start) * fitArcResult.r;
    fitArcResult.use = true;
    return fitArcResult;
}
/*
function springFunction(mass, stiffness, damping, initialVelocity) { //0-15, 0 200, 0-40, < 0 )
    const w0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        const B = (zeta * w0 + -initialVelocity) / wd;
        return Function("t", `return 1 - (Math.exp(-t * ${zeta} * ${w0}) * (Math.cos(${wd} * t) + ${B} * Math.sin(${wd} * t)))`);
    }
    const B = -initialVelocity + w0;
    return Function("t", `return 1 - (1 + ${B} * t) * Math.exp(-t * ${w0})`);

}*/

function frameToStr(frame){
    return (Math.floor(frame / (60 *60)) % 60) + ":" + (Math.floor(frame / 60) % 60).toFixed(0).padStart(2,"0") +":"+ (frame % 60).toFixed(0).padStart(2,"0");
}
function timeToStr(time){
    return (Math.floor(time / (60*60)) % 60) + ":" + (Math.floor(time / 60) % 60).toFixed(0).padStart(2,"0") +":"+ (time % 60).toFixed(0).padStart(2,"0");
}
function radianToStr(rad) {
    return (rad * 180 / Math.PI).toFixed(2);
}
// Argument
//    buf : An array
// Code.
// The variables w and r represent the write and read positions of the buffer
// Functions
//    empty() clears the buffer
//    push(val) adds value to the top (write position)
//    shift() removes value from bottom (read position)
//    pushArray(array) Adds values from array to the top.
//    getAt (pos) Returns an item at read + pos. Return undefined if pos is past write position
//    length () Returns the number of items in the Queue
//
// Limits.
//    To keep the performance high the circleBuffer does not bounds check the push. Adding to many items
//    will overflow the buffer and result in an empty queue.
//    To use you MUST know that you will not overflow, or incorporate overflow as part of the functionality.
//
// Performance.
//    The performance will depend on usage but this buffer offers a significant speed benefit over a conventional
//    queue using Array with push and pull.
//    circle buffer is 1.56 to 1.67 times faster (strict mode).
//
/*const circleBuffer = (buf) => {
    var w = 0;
    var r = 0;
	const size = buf.length;
    return {
        empty () { w = r = 0 },
        push (val) { buf[(w ++) % size] = val },
        shift () { if(r < w) { return buf[(r ++) % size] } },
        pushArray (arr) { for (var i = 0; i < arr.length; i ++) { buf[(w ++) % size] = arr[i] } },
        getAt (pos) { if(r + pos < w) { return buf[(r + pos) % size] } },
        length () { return w - r },
    }
};*/

function SmootherFollow(rate){
    var l; // last value
    var rateB = 1 - rate;
    const API = {
        set rate(value) { rateB = 1- (rate = value) },
        get rate() { return rate },
        add(value) { return l = l * rateB + value * rate }
    }
    return API;
}
function SmootherFollow2D(rate){
    var rateB = 1 - rate;
    const API = {
        x : 0,
        y : 0,
        set rate(value) { rateB = 1- (rate = value) },
        get rate() { return rate },
        start(x,y) {
            this.x = x;
            this.y = y;
        },
        add(x, y) {
            this.x = this.x * rateB + x * rate;
            this.y = this.y * rateB + y * rate;
        }
    }
    return API;
}
function Smoother(accel, drag){
    var c = 0;  // chasing speed
    var v = 0;  // value to smooth
    const API = {
        r : 0,
        get drag() {return drag },
        get accel() {return accel },
        set drag(value){ drag = value },
        set accel(value){ accel = value },
        update(){ return this.r += (c = (c += (v - this.r) * accel) * drag) },
        start(value){
            this.r = v = value;
            c = 0;
            return this.r;
        },
        add(value){
            v = value;
            return this.r += (c = (c += (v - this.r) * accel) * drag);
        }
    }
    return API;
}
function Smoother2D(accel, drag){
    var cx = 0;  // chasing speed
    var cy = 0;  // chasing speed
    var vx = 0;  // value to smooth
    var vy = 0;  // value to smooth
    const API = {
        x : 0,
        y : 0,
        get drag() {return drag },
        get accel() {return accel },
        set drag(value){ drag = value },
        set accel(value){ accel = value },
        update(){
            this.x += (cx = (cx += (vx - this.x) * accel) * drag);
            this.y += (cy = (cy += (vy - this.y) * accel) * drag);
        },
        start(x, y){
            this.x = vx = x;
            this.y = vy = y;
            cy = cx = 0;
        },
        add(x, y){
            vx = x;
            vy = y;
            this.x += (cx = (cx += (vx - this.x) * accel) * drag);
            this.y += (cy = (cy += (vy - this.y) * accel) * drag);
        }
    }
    return API;
}
function Extent(){
    var mx,my,Mx,My,xxa,xya,xxb,xyb,yxa,yya,yxb,yyb;
    var imx, imy, iMx, iMy;
    function complete(){
        API.l = API.x = mx;
        API.t = API.y = my;
        API.w = Mx - mx;
        API.h = My - my;
        API.b = API.t + API.h;
        API.r = API.l + API.w;
        return API;
    }

    const API = {
        x : 0, y : 0, w : 0, h : 0,  // [w]idth, [h]eight
        t : 0, b : 0, l : 0, r : 0,  // [t]op, [b]ottom, [l]eft, [r]ight
        complete,
        irate(){
            iMx = iMy = Mx = My = -(imx = imy = mx = my = Infinity);
            API.x = API.y = API.w = API.h = 0;
            API.t = API.b = API.l = API.r = 0;
            return API;
        },
        inner() {
            mx = imx;
            my = imy;
            Mx = iMx;
            My = iMy;
            complete();
            return API;
        },
        floor(){
            API.x = Math.floor(API.x);
            API.y = Math.floor(API.y);
            API.w = Math.floor(API.w);
            API.h = Math.floor(API.h);
            return API;
        },
        transform(matrix) {
            const m = matrix;
            const e = API;
            var x1 = (xxa = e.l * m[0]) + (yxa = e.t * m[2])
            var y1 = (xya = e.l * m[1]) + (yya = e.t * m[3])
            var x3 = (xxb = e.r * m[0]) + (yxb = e.b * m[2])
            var y3 = (xyb = e.r * m[1]) + (yyb = e.b * m[3])
            var x2 =  xxb + yxa;
            var y2 =  xyb + yya;
            var x4 =  xxa + yxb;
            var y4 =  xya + yyb;
            imx = Math.max(imx, mx = Math.min(x1, x2, x3, x4) + m[4]);
            imy = Math.max(imy, my = Math.min(y1, y2, y3, y4) + m[5]);
            iMx = Math.min(iMx, Mx = Math.max(x1, x2, x3, x4) + m[4]);
            iMy = Math.min(iMy, My = Math.max(y1, y2, y3, y4) + m[5]);
            return API;
        },
        point(x, y) {
            imx = Math.max(imx, mx = Math.min(mx, x));
            imy = Math.max(imy, my = Math.min(my, y));
            iMx = Math.min(iMx, Mx = Math.max(Mx, x));
            iMy = Math.min(iMy, My = Math.max(My, y));

        },
        add(x, y) {
            imx = Math.max(imx, mx = Math.min(mx, x));
            imy = Math.max(imy, my = Math.min(my, y));
            iMx = Math.min(iMx, Mx = Math.max(Mx, x));
            iMy = Math.min(iMy, My = Math.max(My, y));
            complete();
            return API;
        },
        center() { return [API.x + API.w / 2, API.y + API.h / 2] },
        combine(extent) {
            imx = Math.max(imx, mx = Math.min(mx, extent.x, extent.r));
            imy = Math.max(imy, my = Math.min(my, extent.y, extent.b));
            iMx = Math.min(iMx, Mx = Math.max(Mx, extent.x, extent.r));
            iMy = Math.min(iMy, My = Math.max(My, extent.y, extent.b));
            complete();
            return API;
        },
        toSheetSpriteString() {
            complete();
            API.floor();
            return "{x: " + API.x + ", y: " + API.y + ", w: " + API.w + ", h: " + API.h + "},";
        },
        toString() {
            complete();
            return "Left: " + API.l.toFixed(3) + " Right: " + API.r.toFixed(3) +
                " Top: " + API.t.toFixed(3) + " Bottom: " + API.b.toFixed(3) +
                " Width: " + API.w.toFixed(3) + " Height: " + API.h.toFixed(3);

        },
    }
    API.irate();
    return API;
}
//Common functions
const utils = (()=>{
    var lastProcessingCall;
    const spriteTypes = {
        text : {text: "text", font: "arial", size: 32, strokeStyle: null, lineWidth: 1} ,
    }

    function SpriteCreator(type, name = type, x = 0, y = 0, w = 128, h = 128) {

        return {type, name, id: getGUID(), x, y, w, h,  ...(spriteTypes[type] || {}) };

    }

    function boxPacker() {
        const createBoxer = (width, height) => new BoxArea({
            x: 0,  // x,y,width height of area
            y: 0,
            width: width + spacing * 2,
            height : height + spacing * 2,
            space : spacing, // optional default = 1 sets the spacing between boxes
            minW : 1, // optional default = 0 sets the in width of expected box. Note this is for optimisation you can add smaller but it may fail
            minH : 1, // optional default = 0 sets the in height of expected box. Note this is for optimisation you can add smaller but it may fail
        });
        var boxes,spacing,didFit = false;
        const API = {
            init(W,H, spacer = 0) {
                spacing = spacer;
                boxes = createBoxer(W,H);
                didFit = false;
            },
            get didFit() { return didFit },
            addBox(x,y,w,h) {
                if(boxes) {
                    didFit = boxes.fitBox({x,y,w,h});
                    return boxes.boxes[boxes.boxes.length - 1];
                }
                didFit = false;
            },
            reset() { if(boxes) { boxes.reset(); didFit = false;} },
            grow(wAdd, hAdd) { if(boxes) { boxes.grow(wAdd, hAdd) } },
            close(){
                boxes = undefined;
            }


        };
        return API;
    }

    function Matrix(){
        this.m = [1,0,0,1,0,0];
        this.axisXLen = 1; // these two only have meaning after Matrix.axisFromLine is called
        this.axisYLen = 1; // ...
    }
    Matrix.prototype = {
        apply(ctx) {
            const m = this.m;
            ctx.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
        },
        applyMultiply(ctx) {
            const m = this.m;
            ctx.transform(m[0],m[1],m[2],m[3],m[4],m[5]);
        },
        ident() {
            const m = this.m;
            m[3] = m[0] = 1;
            m[1] = m[2] = m[4] = m[5] = 0;

        },
        position(x,y){
            this.m[4] = x;
            this.m[5] = y;
        },
        axisFromLine(x1,y1,x2,y2,axis = 0){
            const dx = x2-x1;
            const dy = y2-y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if(len > 0){
                if(axis === 0){
                    this.m[0] = dx / len;
                    this.m[1] = dy / len;
                    this.axisXLen = len;
                }else{
                    this.m[2] = dx / len;
                    this.m[3] = dy / len;
                    this.axisYLen = len;
                }

            }else{
                if(axis === 0){
                    this.m[0] = 1;
                    this.m[1] = 0;
                    this.axisXLen = 1;

                }else{
                    this.m[2] = 0;
                    this.m[3] = 1;
                    this.axisYLen = 1;
                }
            }
        },
    };

    function Point(x = 0, y = 0){  this.x = x; this.y = y }
    Point.prototype = { as(x, y = x.y + (x = x.x, 0)) { this.x = x; this.y = y; return this }, }
    function Size(w = 0, h = 0){ this.w = w; this.h = h }
    Size.prototype = {
        as(w,h) { this.w = w; this.h = h; return this },
    }

    /* NOTE ON the following code related to colours
       This is writen for performance. At times the can be thousands of colours needed per frame and the previouse easy to read and use did not cut it.
       There is a minimum of vetting


       The vars r,g,b have two rolls as rgb and as hsl. Confussing yes but the code just gets larger and large if each model that willl eventulay be used need another set of names
       when in hsl mode the ranges will be (0-360 + this value is cyclic) 0-100 and 0-100
    */
    const Model_HSL = 1;
    const Model_RGB = 2;
    const hexLookup = $setOf(256,i => i.toString(16).padStart(2,"0"));
    const quickHex = (r,g,b,a) => "#"+hexLookup[r] + hexLookup[g] + hexLookup[b] + hexLookup[a];
    const quickHexObj = (c) => "#"+hexLookup[c.r | 0] + hexLookup[c.g | 0] + hexLookup[c.b | 0] + hexLookup[c.a | 0];

    const clipTri = (x, phase, amp, dcOff) => {
        x = 3 * Math.abs(2 * (x + phase / 3 - (x + (phase + 1.5) / 3 | 0))) - 1.5;
        return ((x < -0.5 ? -0.5 : x > 0.5 ? 0.5 : x) * amp + dcOff) * 255 | 0;
    }
    function HSLToRGBA(hsl, rgba){ // Note that this must be able to work even if rgb and hsl reference the same object
        const lum = ((hsl.b / 100) - 0.5) * 2;
        var scale = (1 - Math.abs(lum));
        const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
        scale *= (hsl.g / 100);
        const hue = (hsl.r % 360) / 360;
        rgba.r = clipTri(hue, 1.5, scale, offset);
        rgba.g = clipTri(hue, 3.5, scale, offset);
        rgba.b = clipTri(hue, 5.5, scale, offset);
        rgba.a =  1;
        rgba.model = Model_RGB;
        return rgba;
    }
    function RGBToHSL(rgb,hsl){ // Note that this must be able to work even if rgb and hsl reference the same object
        var dif, h, l, s,min, max, r, g, b;
        hsl.a = 1;
        hsl.model = Model_HSL;
        h = l = s = 0;
        r = rgb.r / 255;  // normalize channels
        g = rgb.g / 255;
        b = rgb.b / 255;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){  // no colour so early exit
            hsl.r = 0;
            hsl.g = 0;
            hsl.b = min * 100 | 0;
            return hsl;
        }
        dif = max - min;
        l = (max + min) / 2;
        if (l > 0.5) { s = dif / (2 - max - min) }
        else { s = dif / (max + min) }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6.0 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2.0 }
        else { h = (r - g) / dif + 4.0 }
        hsl.r  = (h * 60 + 0.5);
        hsl.g = (s * 100 + 0.5);
        hsl.b = (l * 100 + 0.5);
        return hsl;
    }
    function RGBToHSLQuick(r, g, b, hsl = {}){ // Note that this must be able to work even if rgb and hsl reference the same object
        var minC, maxC, dif, h, l, s,min, max;
        h = l = s = 0;
        r /= 255;  // normalize channels
        g /= 255;
        b /= 255;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){  // no colour so early exit
            hsl.h = 0;
            hsl.s = 0;
            hsl.l = min * 100 | 0;
            return hsl;
        }
        dif = max - min;
        l = (max + min) / 2;
        if (l > 0.5) { s = dif / (2 - max - min) }
        else { s = dif / (max + min) }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6.0 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2.0 }
        else { h = (r - g) / dif + 4.0 }
        hsl.h  = (h * 60 + 0.5);
        hsl.s = (s * 100 + 0.5);
        hsl.l = (l * 100 + 0.5);
        return hsl;
    }
  /*  function RGBToHSL_Quick(rgb,hsl){ // Note that this must be able to work even if rgb and hsl reference the same object
        var minC, maxC, dif, h, l, s,min, max, r, g, b;
        hsl.a = 1;
        h = l = s = 0;
        r = rgb.r;  // normalize channels
        g = rgb.g;
        b = rgb.b;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){  // no colour so early exit
            hsl.r = 0;
            hsl.g = 0;
            hsl.b = min;
            return hsl;
        }
        dif = max - min;
        l = max + min;
        s =  l > 255 ? dif / (510 - max - min) }
        else { s = dif / l }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6.0 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2.0 }
        else { h = (r - g) / dif + 4.0 }
        hsl.r  = (h * 60 + 0.5);
        hsl.g = (s * 100 + 0.5);
        hsl.b = (l * 100 + 0.5);
        return hsl;
    }      */

    function RGBA(r = 0,g = 0,b = 0,a = 1){
        this.as(r,g,b,a);
    }
    RGBA.prototype = {
        get cssRGBA() { return this.cssStr = `rgba(${this.r},${this.g},${this.b},${this.a})` },
        get cssHSLA() { return this.cssStr = `hsla(${(this.r % 360 + 360) % 360},${this.g}%,${this.b}%,${this.a})` },
        get css() { return this.model === Model_RGB ? `rgb(${this.r},${this.g},${this.b})` :  `hsl(${(this.r % 360 + 360) % 360},${this.g}%,${this.b}%)` },
        as(r,g,b,a=1,m=Model_RGB){
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
            this.model = m;
            return this;
        },
        fromPixel(idx,data,bigAlpha = 255){  // If the colour model is not RGB this will not work
            this.r = data[idx++];
            this.g = data[idx++];
            this.b = data[idx++];
            this.a = data[idx] / bigAlpha;
            if(this.model === Model_HSL){
                 RGBToHSL(this,this);
            }
            return this;
        },
        copyOf(RGBA){
            this.r = RGBA.r;
            this.g = RGBA.g;
            this.b = RGBA.b;
            this.a = RGBA.a;
            this.model = RGBA.model ? RGBA.model : Model_RGB;
            return this;
        },
        asHSL(hsl = utils.RGBA) {
            if(this.model === Model_RGB) { RGBToHSL(this,hsl) }
            else { hsl.copyOf(this) }
            return hsl;
        },
        toHSL(){
            if(this.model === Model_RGB) { RGBToHSL(this,this) }
            return this;
        },
        toRGB(){
            if(this.model === Model_HSL) { HSLToRGB(this,this) }
            return this;
        },
        captureHSL(){
            if(this.model === Model_RGB) {
                var dif, h, l, s,min, max, r, g, b;
                this.h = this.l = this.s = 0;
                r = this.r; g = this.g; b = this.b;
                min = Math.min(r, g, b);
                max = Math.max(r, g, b);
                if(min === max){
                    this.l = min / 2.55;
                }else{
                    dif = max - min;
                    l = max + min;
                    this.s =  (l > 255 ? dif / (510 - max - min) :  dif / l) * 100;
                    this.l = l / 5.1;
                    if (max === r) {
                        this.h = ((g - b) / dif + (g < b ? 6  : 0)) * 60;
                    } else if (max === g) {
                        this.h = ((b - r) / dif + 2) * 60 ;
                    } else {
                        this.h = ((r - g) / dif + 4) * 60;
                    }
                }
            }else{
                this.h = this.r;
                this.s = this.g;
                this.l = this.b;
            }
        },


        normalise(){
            this.a /= 255;
            if(this.model === Model_HSL){
                this.r = (this.r % 360 + 360) % 360;
            }
            return this;
        },
        difFrom( RGBA){ // NOTE that argument RGBA must use the same model as this, or result will be strange
            if(this.model === Model_HSL){
                var dist = RGBA.r - this.r;
                this.r = dist + (dist > 180 ? -360 : dist < -180 ? 360 : 0);
            }else{
                this.r = RGBA.r - this.r;
            }
            this.g = RGBA.g - this.g;
            this.b = RGBA.b - this.b;
            this.a = RGBA.a - this.a;
            return this;
        },
        transparent(){
            this.r = this.g = this.b = this.a = 0;
        },
    }
    // Will use the colour model of the first argument. If no colour model in  the object defaults to rgb
    function ColorRange(rgba1, rgba2){
        this.rgba1 = new RGBA().copyOf(rgba1);
        this.rgba2 = new RGBA().copyOf(rgba2);
        if(this.rgba1.model !== this.rgba2.model){
            if(this.rgba1.model === Model_RGB){
                this.rgba2.toHSL();
            }else{
                this.rgba2.toHSL();
            }
        }

        this.dif = new  RGBA().copyOf(this.rgba1).difFrom(rgba2);
        this.result = new  RGBA().copyOf(this.rgba1);
        this._model = this.rgba1.model;
        this.model = this.rgba1.model;
        this.lookup = [];
        this.lookupVal = [];
        this.lookupLen = 0;
        this.useLookup = false;
    };
    ColorRange.prototype = {
        init(rgba1, rgba2){ // NOTE both must be same colour model to work correctly
            this.rgba1.copyOf(rgba1).normalise();
            this.rgba2.copyOf(rgba2).normalise();
            this.dif.copyOf(this.rgba1).difFrom(rgba2);
            this._model = this.rgba1.model;
            this.model = this.rgba1.model;

        },
        initHSLFromRGB(colRange) { // This assumes that this.model is HSL and the colRange is RGB
            RGBToHSL(colRange.rgba1, this.rgba1);
            RGBToHSL(colRange.rgba2, this.rgba2);
            this.dif.copyOf(this.rgba1).difFrom(this.rgba2);
        },


        setSecond(rgba){ // Must match colour model
            this.rgba2.copyOf(rgba);
            this.dif.copyOf(this.rgba1).difFrom(rgba);
        },
        models : { RGB : Model_RGB, HSL : Model_HSL},
        useHSL() {
            if(this._model === Model_RGB){
                this.rgba1.toHSL();
                this.rgba2.toHSL();
                this.dif.model = Model_HSL;
                this.dif.copyOf(this.rgba1).difFrom(this.rgba2);
                this.model = Model_HSL;
            }
            return this;

        },
        useRGB() {
            if(this._model === Model_HSL){
                this.rgba1.toRGB();
                this.rgba2.toRGB();
                this.dif.model = Model_RGB;
                this.dif.copyOf(this.rgba1).difFrom(rgba2);

                this.model = Model_RGB;
            }
            return this;

        },
        isLoaded(){
            return (this.useLookup && this.lookupLen > 0) || this.useLookup;;
        },
        rgbaAt(pos, result){ // model independent. pos is in the range 0 to 1 inclusive
            if(this.useLookup){
                if(this.lookupLen > 0){
                    pos = (this.lookupLen-1) * pos | 0;
                    result.r = this.lookupVal[pos][0];
                    result.g = this.lookupVal[pos][1];
                    result.b = this.lookupVal[pos][2];
                    result.a = this.lookupVal[pos][3];
                }else{
                    result.b = 0;
                    result.r = 0;
                    result.g = 0;
                    result.a = 0;

                }
            }else{
                result.r = this.rgba1.r + this.dif.r * pos | 0;
                result.g = this.rgba1.g + this.dif.g * pos | 0;
                result.b = this.rgba1.b + this.dif.b * pos | 0;
                result.a = this.rgba1.a + this.dif.a * pos | 0;
            }
            return result;

        },
        rgbAt(pos, result){ // model independent. pos is in the range 0 to 1 inclusive
            if(this.useLookup){
                if(this.lookupLen > 0){
                    pos = (this.lookupLen-1) * pos | 0;
                    result.r = this.lookupVal[pos][0];
                    result.g = this.lookupVal[pos][1];
                    result.b = this.lookupVal[pos][2];
                    result.a = 255;
                }else{
                    result.b = 0;
                    result.r = 0;
                    result.g = 0;
                    result.a = 0;

                }
            }else{
                result.r = this.rgba1.r + this.dif.r * pos | 0;
                result.g = this.rgba1.g + this.dif.g * pos | 0;
                result.b = this.rgba1.b + this.dif.b * pos | 0;
                result.a = 255;
            }
            return result;

        },
        cssRGBAt(pos) {
            return pos < 0 ? `rgba(${this.rgba1.r},${this.rgba1.g},${this.rgba1.b},${this.rgba1.a})` :
                   pos > 1 ? `rgba(${this.rgba2.r},${this.rgba2.g},${this.rgba2.b},${this.rgba2.a})` :
                    `rgba(${this.rgba1.r + this.dif.r * pos | 0},${this.rgba1.g + this.dif.g * pos | 0},${this.rgba1.b + this.dif.b * pos | 0},${this.rgba1.a + this.dif.a * pos})`;


        },
        cssHSLAt(pos) {
            return pos < 0 ? `hsla(${(this.rgba1.r % 360 + 360) % 360},${this.rgba1.g}%,${this.rgba1.b}%,${this.rgba1.a})` :
                   pos > 1 ? `hsla(${(this.rgba1.r % 360 + 360) % 360},${this.rgba2.g}%,${this.rgba2.b}%,${this.rgba2.a})` :
                    `hsla(${((this.rgba1.r + this.dif.r * pos) % 360 + 360) % 360},${this.rgba1.g + this.dif.g * pos}%,${this.rgba1.b + this.dif.b * pos}%,${this.rgba1.a + this.dif.a * pos})`;

        },
        cssHSLAtFixedAlpha(pos,alpha) {
            return pos < 0 ? `hsla(${(this.rgba1.r % 360 + 360) % 360},${this.rgba1.g}%,${this.rgba1.b}%,${alpha})` :
                   pos > 1 ? `hsla(${(this.rgba2.r % 360 + 360) % 360},${this.rgba2.g}%,${this.rgba2.b}%,${alpha})` :
                    `hsla(${((this.rgba1.r + this.dif.r * pos) % 360 + 360) % 360},${this.rgba1.g + this.dif.g * pos}%,${this.rgba1.b + this.dif.b * pos}%,${alpha})`;


        },
        cssRGBAtFixedAlpha(pos,alpha) {
            return  pos < 0 ? `rgba(${this.rgba1.r},${this.rgba1.g},${this.rgba1.b},${alpha})` :
                    pos > 1 ? `rgba(${this.rgba2.r},${this.rgba2.g},${this.rgba2.b},${alpha})` :
                    `rgba(${this.rgba1.r + this.dif.r * pos | 0},${this.rgba1.g + this.dif.g * pos | 0},${this.rgba1.b + this.dif.b * pos | 0},${alpha})`;

        },
        get model() { return this._model },
        set model(model){
            if(model === Model_RGB){ this.cssAt = this.cssRGBAt; this.cssAtFixA = this.cssRGBAtFixedAlpha; }
            if(model === Model_HSL){ this.cssAt = this.cssHSLAt; this.cssAtFixA = this.cssHSLAtFixedAlpha }
            this._model = model;
        },
        cssAt(pos){},
        cssAtFixA(pos){},
    }

    const API = {
        Sprite: SpriteCreator,
        get boxPacker() { return boxPacker() },
        get matrix() { return new Matrix() },
        get point() { return new Point() },
        getPoint(x, y) { return new Point(x, y) },
        get size() { return new Size() },
        get rgba() { return new RGBA() },
        get colorRange() { return new ColorRange(API.rgba,API.rgba) },
        hexCol : quickHex,
        hexColObj : quickHexObj,
		RGBToHSL: RGBToHSLQuick,
        HSL2RGB(h,s,l, rgb = {}) {
            const lum = ((l / 100) - 0.5) * 2;
            var scale = (1 - Math.abs(lum));
            const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
            scale *= (s / 100);
            const hue = (h % 360) / 360;
            rgb.r = clipTri(hue, 1.5, scale, offset);
            rgb.g = clipTri(hue, 3.5, scale, offset);
            rgb.b = clipTri(hue, 5.5, scale, offset);
            return rgb;
        },
        RGB2CSSHex(rgb) {
            return "#" + (rgb.r | 0).toString(16).padStart(2,"0")+ (rgb.g | 0).toString(16).padStart(2,"0") + (rgb.b | 0).toString(16).padStart(2,"0");
        },
        CSS2RGB(css, rgb = {}) {
            if(css[0] !== "#") {
                if(css.length <= 4) {
                    rgb.r = parseInt(css[0] + css[0], 16);
                    rgb.g = parseInt(css[1] + css[1], 16);
                    rgb.b = parseInt(css[2] + css[2], 16);
                } else {
                    rgb.r = parseInt(css[0] + css[1], 16);
                    rgb.g = parseInt(css[2] + css[3], 16);
                    rgb.b = parseInt(css[4] + css[4], 16);
                }
                if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) { throw new Error("Utils.CSS2RGB could not parse the color value '" + css + "'") }
            } else  if(css[0] === "#") {
                if(css.length <= 5) {
                    rgb.r = parseInt(css[1] + css[1], 16);
                    rgb.g = parseInt(css[2] + css[2], 16);
                    rgb.b = parseInt(css[3] + css[3], 16);
                } else {
                    rgb.r = parseInt(css[1] + css[2], 16);
                    rgb.g = parseInt(css[3] + css[4], 16);
                    rgb.b = parseInt(css[5] + css[6], 16);
                }
            }else { throw new Error("Utils.CSS2RGB does not support this colour type yet!!!!") }
            return rgb;
        },
		numToRAM(num) {
			var dig = Math.log10(num);
			if (dig < 3) { return num + "b" }
			if (dig < 4) { return (num / 1000 | 0) + "," + (num % 1000).toFixed(0).padStart(3,"0") + "b" }
			if (dig < 5.5) { return (num / 1024 | 0) + "." + ((num % 1024) / 1024 * 10 | 0) + "Kb" }
			if (dig < 7) { return (num / (1024 * 1024) | 0) + "." + ((num % (1024 * 1024)) / (1024 * 1024) * 1000 | 0).toFixed(0).padStart(3,"0") + "Mb" }
			if (dig < 8.5) { return (num / (1024 * 1024) | 0) + "Mb" }
			return (num / (1024 * 1024 * 1024) | 0) + "." + ((num % (1024 * 1024 * 1024)) / (1024 * 1024 * 1024) * 1000 | 0).toFixed(0).padStart(3,"0") + "Gb";

		},
        animKey(name, time, value, curve = 0) { return {name, dontUpdate : true, isNew : true, time, value, curve} },
        get viewCenter() {
            view.toWorld(mainCanvas.width, mainCanvas.height, viewPointA);
            view.toWorld(0,0,viewPointB);
            return [Math.round((viewPointB.x + viewPointA.x) / 2), Math.round((viewPointB.y + viewPointA.y) / 2) ];
        },
        canvas(w,h) {
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.ctx = canvas.getContext("2d");
            return canvas;
        },
        tidyWorkspace(){
            sprites.cleanup();
            spriteList.update();
            widget.update();
        },
        repeatProcessSelectedImages(){
            if(lastProcessingCall !== undefined){
                API.processSelectedImages(lastProcessingCall.shift(),...lastProcessingCall);
            }else{
                log.warn("Last processing call is empty.");
            }
        },
        processSelectedImagesCallback(call,callback, ...args){
            const idx = args.indexOf("IncludeSprite");
            lastProcessingCall = [call,...args];
            var count = 0;

            selection.processImages((img, i, spr) => {
                if (idx > -1) { args[idx] = spr }
                img.restore(false);
                const processed = callback(call(img,...args), img, spr); //localProcessImage.halfSizeBitmap(img);
                sprites.each(spr => { if(spr.type.image && spr.image === img){  spr.imageResized(true) } });
                count += processed ? 1 : 0;
                return processed === true;
            });
            if(count === 0){
                log.info("There were no selected or drawable images to process");
            }
            API.tidyWorkspace();
        },
        async processImageNoUpdateAsync(call, image, ...args) {
            return new Promise(done => { setTimeout(()=> done(call(image,...args)), 0) });
        },
        processImageNoUpdate(call, image, ...args){
            call(image,...args);
        },
        processImage(call, image, ...args){
            lastProcessingCall = [call,...args];

            image.restore(false);
            const processed = call(image,...args);
            sprites.each(spr => { if(spr.type.image && spr.image === image) {  spr.imageResized(true) } });
            API.tidyWorkspace();

        },
        processSelectedImages(call, ...args){
            lastProcessingCall = [call,...args];
            var count = 0;
            log.info("Processing");
            selection.processImages((img, i, spr) => {
                spr.prepDrawOn();
                img.restore(false);
                const processed = call(img,...args); //localProcessImage.halfSizeBitmap(img);
                sprites.each(spr => { if(spr.type.image && spr.image === img) {  spr.imageResized(true) } });
                count += processed ? 1 : 0;
                return processed === true;
            });
            if(count === 0){
                log.info("There were no selected or drawable images to process");
            }
            API.tidyWorkspace();
        },
        arrayRemove(arr, ...arrays){
            var idx;
            if(arr === undefined) { arr = []; return arr }
            for(const a of arrays){
                for(const item of a){
                    idx = arr.indexOf(item);
                    if(idx > -1){
                        arr.splice(idx,1);
                    }
                }
            }
            return arr;
        },
        arrayMerge(arr, ...arrays){
            if(arr === undefined) { arr = [] }
            for(const a of arrays){
                for(const item of a){
                    if(arr.indexOf(item) === -1){
                        arr.push(item);
                    }
                }
            }
            return arr;
        },
        str16PathToDir(pathStr) {
            const pathBitPos = [14,12,10,8,6,4,2,0];
            const chars = "wxyz";
            const paths = [];
            for(const path of pathStr.paths){
                var nstr = "";
                var i = 0, j = 0, pDir, dir;
                while(i < path.length) {
                    var val = path.path.charCodeAt(i / 8 | 0);
                    j = 0;
                    while (j < 8 && i++ < path.length) {
                        nstr += chars[(val >> pathBitPos[j++]) & 0b11];
                    }
                }


                path.str = nstr.replace(/(.)\1+/g,str => {
                    const s = str[0].toUpperCase() + (str.length.toString(16).toUpperCase());
                    return s.length < str.length ? s : str;
                });;
            }
        },
        pathPatterns: {
            [0x0000](pos, scale) { pos.x += scale.x * 8; return 0 },
            [0x5555](pos, scale) { pos.y += scale.y * 8; return 1 },
            [0xAAAA](pos, scale) { pos.x -= scale.x * 8; return 2 },
            [0xFFFF](pos, scale) { pos.y -= scale.y * 8; return 3 },
            [0x4444 /*0100*/](pos, scale) { pos.x += scale.x * 4; pos.y += scale.y * 4; return 1 },
            [0xCCCC /*1100*/](pos, scale) { pos.x += scale.x * 4; pos.y -= scale.y * 4; return 3 },
            [0x9999 /*1001*/](pos, scale) { pos.x -= scale.x * 4; pos.y += scale.y * 4; return 2 },
            [0x1111 /*0001*/](pos, scale) { pos.x += scale.x * 4; pos.y += scale.y * 4; return 0 },
            [0xEEEE /*1110*/](pos, scale) { pos.x -= scale.x * 4; pos.y -= scale.y * 4; return 3 },
            [0x6666 /*0110*/](pos, scale) { pos.x -= scale.x * 4; pos.y += scale.y * 4; return 1 },
            [0x3333 /*0011*/](pos, scale) { pos.x += scale.x * 4; pos.y -= scale.y * 4; return 0 },
            [0x7777 /*1011*/](pos, scale) { pos.x -= scale.x * 4; pos.y -= scale.y * 4; return 2 },
        },
        pathPatternSet: new Set([0, 0x5555,0xAAAA,0xFFFF,0x4444,0xCCCC,0x9999,0x1111,0xEEEE,0x6666,0x3333,0x7777]),
        pathStrToPoints(pathStr) {
            const sx = pathStr.scaleX, sy = pathStr.scaleY;
            const dirs = [{x:sx,y:0}, {x:0,y:sy}, {x:-sx,y:0}, {x:0,y:-sy}];
            const paths = [];
            var x, y, i, j, dir, val, d, ld, segLen,count = 0;
            const pos = {x:0, y: 0};
            const scale = {x: sx, y: sy};
            const past = []
            var turnCount = 0;
            const pP = API.pathPatterns;
            const pPSet = API.pathPatternSet;
            for(const path of pathStr.paths){
                const points = [];
                pos.x = path.x * sx;
                pos.y = path.y * sy;
                i = 0;
                ld = -1;
                const len = path.length, lenS = len - 8
                while(i < len) {
                    j = 14;
                    val = path.path.charCodeAt(i / 8 | 0);
                    if (i < lenS && pPSet.has(val)) {
                        points.push([pos.x,pos.y]);
                        ld = pP[val](pos, scale);
                        i += 8;
                        segLen = 0;
                    } else {
                        while (j >= 0 && i < len) {
                            d = (val >> j) & 0b11;
                            dir = dirs[d];
                            if (d === ld) {
                                if (segLen < 8) {
                                    segLen ++
                                } else {
                                    points.push([pos.x, pos.y]);
                                    segLen = 0;
                                }
                            } else {
                                points.push([pos.x,pos.y]);
                                segLen = 0;
                            }
                            pos.x += dir.x;
                            pos.y += dir.y;
                            ld = d
                            j -= 2;
                            i++;
                        }
                    }
                }
                points.push([pos.x,pos.y]);
                if(pathStr.smooth) {
                    pathStr.segs = (pathStr.segs < 1 ? 1 : pathStr.segs > 5 ? 5 : pathStr.segs) | 0;
                    paths.push(curved.smoothPathArray(curved.simplifyPathArray(pathStr.detail, points), pathStr.segs, pathStr.cornerAngle));
                }else {
                    paths.push(curved.simplifyPathArray(pathStr.detail,points));
                }
                count += paths[paths.length -1].length;
            }
            utils.lastVectorPointCount = count;
            return paths;
        },
        pathStrToPointsXA(pathStr) {
            const sx = pathStr.scaleX, sy = pathStr.scaleY;
            const dirs = [{x:sx,y:0}, {x:0,y:sy}, {x:-sx,y:0}, {x:0,y:-sy}];
            const paths = [];
            var x, y, i, j, dir, val, d, ld, segLen, rFlag = 0,count = 0, cornerSpecial;
            const pos = {x:0, y: 0};
            const scale = {x: sx, y: sy};
            const past = []
            var turnCount = 0;
            const pP = API.pathPatterns;
            const pPSet = API.pathPatternSet;
            for(const path of pathStr.paths){
                const points = [];
                pos.x = path.x * sx;
                pos.y = path.y * sy;
                i = 0;
                ld = -1;
                rFlag = 0;
                const len = path.length, lenS = len - 8
                while(i < len) {
                    j = 14;
                    val = path.path.charCodeAt(i / 8 | 0);
                    if (!rFlag && i < lenS && pPSet.has(val)) {
                        points.push([pos.x,pos.y]);
                        ld = pP[val](pos, scale);
                        i += 8;
                        segLen = 0;
                    } else {
                        while (j >= 0 && i < len) {
                            d = (val >> j) & 0b11;
                            dir = dirs[d];
                            if (ld > -1 && d === ((ld + 2) % 4)) {
                                rFlag = 2;
                                points.push([pos.x,pos.y]);
                                segLen = 0;
                                //cornerSpecial = points[points.length - 1]
                            } else {
                                if (!rFlag && d === ld) {
                                    if (segLen < 8) {
                                        segLen ++
                                    } else {
                                        points.push([pos.x, pos.y]);
                                        segLen = 0;
                                    }
                                } else {
                                    if (rFlag) {
                                        if(rFlag === 2) {
                                            points.push(cornerSpecial = [pos.x, pos.y]);
                                            rFlag = 1;
                                        } else {
                                            points.push([
                                                (pos.x + (cornerSpecial[0] + pos.x + dir.x) / 2) / 2,
                                                (pos.y + (cornerSpecial[1] + pos.y + dir.y) / 2) / 2
                                            ]);
                                            rFlag = 0
                                        }
                                    } else {
                                        points.push([pos.x,pos.y]);
                                    }
                                    segLen = 0;
                                }
                                pos.x += dir.x;
                                pos.y += dir.y;
                                ld = d
                            }
                            j -= 2;
                            i++;
                        }
                    }
                }
                points.push([pos.x,pos.y]);
                if(pathStr.smooth) {
                    pathStr.segs = (pathStr.segs < 1 ? 1 : pathStr.segs > 5 ? 5 : pathStr.segs) | 0;
                    paths.push(curved.smoothPathArray(curved.simplifyPathArray(pathStr.detail, points), pathStr.segs, pathStr.cornerAngle));
                }else {
                    paths.push(curved.simplifyPathArray(pathStr.detail,points));
                }
                count += paths[paths.length -1].length;
            }
            utils.lastVectorPointCount = count;
            return paths;
        },
        pathStrToPointsV2(pathStr) {
            const pathBitPos = [14,12,10,8,6,4,2,0];
            const sx = pathStr.scaleX, sy = pathStr.scaleY;
            const dirs = [{x:sx,y:0}, {x:0,y:sy}, {x:-sx,y:0}, {x:0,y:-sy}];

            const rep = {
                tl : {t:{x:-1,y:0}, },
                rt : {r:{x:0 ,y:-1},},
                br : {b:{x:1 ,y:0}, },
                lb : {l:{x:0 ,y:1}, },
                ttl : {r:{x:-1,y:0},  t:{x:-2,y:0}, l:{x:-2,y:0 }},
                rrt : {b:{x:0 ,y:-1}, r:{x:0 ,y:-2},t:{x:0 ,y:-2}},
                bbr : {l:{x:1 ,y:0},  b:{x:2 ,y:0}, r:{x:2 ,y:0 }},
                llb : {t:{x:0 ,y:1},  l:{x:0 ,y:2}, b:{x:0 ,y:2 }},
            };
            const R = 0, D = 1, L = 2, U = 3;
            const patterns = {
                F: [1,0, R],
                L: [0,-1, U],
                R: [0,1, D],
                LFRLRRLRRLRL: [2,2,-0.5,1.5,-1.5,0.5,-2,-2,L],
                FFFRRFFF: [3,0,0,1,-3,0,L],
                FFFRFRFFF: [3,0,0,2,-3,0,L],
                FFFRFFRFFF: [3,0,0,3,-3,0,L],
                FFFFFFFF: [8,0, R],
                FFFFFFF: [7,0, R],
                FFFFFF: [6,0, R],
                FFFFF: [5,0, R],
                FFFF: [4,0, R],
                FFRLFFFRLF: [8,2, R],
                RFLRLFLRLF: [-2,0.5, -1,1.5, 1,1.5, 2,0.5, U],
                FLRLRFLR: [5,-3, R],
                FRFRFRFR: [1,0, 0,2, -2, 0, 0, -2,1,0, R],
                FRLRFRLR: [ 1, 0, 1,1,0,2,-1,1,-1,0, L],
                //FRLFFRLFFRLFFRLF: [12,4, R],
               // FRLFFRLFFRLF: [9,3, R],
                FRLFFRLF: [6,2, R],
                //FRLFRLFRLFRL: [8,4, R],
                FRLFRLFRL: [6,3, R],
                //RLRLRLRL: [4,4, R],
                RLRLRL: [3,3, R],
                RLRL: [2,2, R],
            }
            var stepX = 0, stepY = 0;
            function rot(dir, x, y) {
                if (dir === 0) { stepX = x * sx; stepY = y * sy; return }
                if (dir === 1) { stepX = -y * sx; stepY = x * sy; return }
                if (dir === 2) { stepX = -x * sx; stepY = -y * sy; return }
                stepX = y * sx;
                stepY = -x * sy;
            }
            const MAX_PATTERN = 9;
            var foundPat, foundSize;
            function findPat(pos) {
                var idx = 0
                var len = pLens[idx];
                do {
                    const pat = patterns[pattern.slice(pos, pos + len)];
                    if (pat) {
                        foundPat = pat;
                        foundSize = len;
                        return;
                    }
                    len = pLens[++idx];
                } while (idx < pLens.length)
            }

            var pattern, patternPos, curDir;;

            const lens = new Set();
            for (const p of Object.keys(patterns)) {
                lens.add(p.length);
            }
            const pLens = [...lens.values()].sort((a,b)=>b-a);



            const turns = ["FR L", "LFR ", " LFR", "R LF"]
            const paths = [];
            var count = 0;

            var x,y,rr,i,j,dir,val,d,pd, first, idx;
            const turn = []
            var turnCount = 0;
            for(const path of pathStr.paths){
                const points = [];
                turn.length = 0;
                turnCount = 0;
                turn[turnCount++] = "F";

                pd = -1;

                x = path.x *  sx;
                y = path.y * sy;
                i = 0;
                j = 0;
                while(i < path.length) {
                    j = 0;
                    val = path.path.charCodeAt(i / 8 | 0);
                    while (j < 8 && i < path.length) {
                        d = (val >> pathBitPos[j]) & 0b11;
                        if (pd > -1) { turn[turnCount++] = turns[pd][d] }
                        else { first = d }
                        pd = d;
                        //dir = dirs[d];
                        //points.push([x,y]);
                        //x += dir.x;
                        //y += dir.y;
                        j++;
                        i++;
                    }
                }
                turn[turnCount] = turns[first][d];
                points.push([x,y]);
                pattern = turn.join("");
                patternPos = 0;
                curDir = first
                while(patternPos < turnCount - 1) {
                    findPat(patternPos);
                    idx = 0;
                    const fpl = foundPat.length - 1
                    while(idx < fpl) {
                        rot(curDir, foundPat[idx++], foundPat[idx++]);
                        x += stepX;
                        y += stepY;
                        points.push([x,y]);
                    }
                    curDir = (curDir + foundPat[idx]) % 4;
                    patternPos += foundSize;
                }




                if(pathStr.smooth) {
                    pathStr.segs = (pathStr.segs < 1 ? 1 : pathStr.segs > 5 ? 5 : pathStr.segs) | 0;
                    paths.push(curved.smoothPathArray(curved.simplifyPathArray(pathStr.detail, points), pathStr.segs, pathStr.cornerAngle));
                }else {
                    paths.push(curved.simplifyPathArray(pathStr.detail,points));
                }
                count += paths[paths.length -1].length;
            }
            utils.lastVectorPointCount = count;
            return paths;



        }
    };
    const viewPointA = API.point;
    const viewPointB = API.point;

    return API;

})();
function toSerial(obj,props){
    var ser = [];
    for(const path of props){
        var i = 0;
        var val = obj;
        while (i < path.length) { val = obj[path[i++]] }
        ser.push(val);
    }
    return ser;
}
function fromSerial(obj,serial,props){
    var ser = [];
    var index = 0;
    for(const path of props){
        var i = 0;
        var val = obj;
        while (i < path.length - 1) { val = obj[path[i++]] }
        val[path[i]] = serial.shift();
    }
    return obj;
}
function elementFlasher(element, names, time = settings.flashTime){
    var timer;
    var lastName;
    const removeClass = () => {
        if(lastName) {
            element.classList.remove(lastName);
            lastName = undefined;
        }
    };
    return function (name){
        removeClass();
        clearTimeout(timer);
        timer = setTimeout(removeClass, time);
        element.classList.add(names[name]);
        lastName = names[name];
    };
}
function getColorSet(hue){
    hue = ((hue % 360) + 360) % 360;
    const h = "hsl("+hue + ",";
    return {
        dark : h + "80%,20%)",
        medium : h + "60%,50%)",
        light : h + "40%,70%)",
        bright : h + "20%,85%)",
        brightest : h + "20%,95%)",
    };
}
function getColorSat(hue,sat){
    hue = ((hue % 360) + 360) % 360;
    const h = "hsl("+hue + ",";
    return {
        dark : h + ((80 * sat) | 0) +"%,20%)",
        medium : h + ((60 * sat) | 0) +"%,50%)",
        light : h + ((40 * sat) | 0) +"%,70%)",
        bright : h + ((20 * sat) | 0) +"%,85%)",
        brightest : h + ((20 * sat) | 0) +"%,95%)",
    };
}

function YUV2CSSHex(y,u,v){
    const clamp = val => (val < 0 ? 0 : val > 255 ? 255 : val) | 0;
    const hex = val => val.toString(16).padStart(2,"0");
    const m = [1.140, -0.395, -0.581, 2.032]
    v -= 128;
    u -= 128;
    return `#${hex(clamp(y + m[i++] * v))}${hex(clamp(y + m[i++] * u - m[i++] * v))}${hex(clamp(y + m[i++] * u))}`;
}
function YUV2RGB(y,u,v, RGB = {}){
    const clamp = val => (val < 0 ? 0 : val > 255 ? 255 : val);
    const m = [1.140, -0.395, -0.581, 2.032];
    v -= 128;
    u -= 128;
    RGB.r = clamp(y + m[i++] * v) | 0;
    RGB.g = clamp(y + m[i++] * u - m[i++] * v) | 0;
    RGB.b = clamp(y + m[i++] * u) | 0;

}
function RGB2YUV(r, g, b, YUV = {}) {
    const m =  [0.299, 0.587, 0.114, 0, -0.147, -0.289, 0.436, 128, 0.615, -0.515, -0.1, 128];
    var i = 0;
    YUV.y = (r * m[i++] + g * m[i++] + b * m[i++] + m[i++]) | 0;
    YUV.u = (r * m[i++] + g * m[i++] + b * m[i++] + m[i++]) | 0;
    YUV.v = (r * m[i++] + g * m[i++] + b * m[i++] + m[i]) | 0;
    return YUV;
}



function assignFull(obj, ...fromObjs){
    for(const from of fromObjs){
        for(const key of Object.keys(from)){
            Object.defineProperty(obj, key, Object.getOwnPropertyDescriptor(from, key));
        }
    }
    return obj;
}
const NAMES = (()=>{
    const registry = {};
    const API = {
        clean(name) { return name.replace(/[0-9]+$/, "") },
        isRegisteredAs(name) {
			if (settings.autoSpriteNamePrefix) {
				name = name.replace(/[0-9]+$/, "");
				if(registry[name] === undefined){ return false }
				return name
			}
			return false;

        },
        register(name){
			if (settings.autoSpriteNamePrefix) {
				name = name.trim();
				if (name[name.length-1] === "*") { return name.slice(0,name.length-1).replace(/[0-9]+$/,"") }
				if (name[0] === "*") { return name.substr(1).replace(/[0-9]+$/,"") }
				name = name.replace(/[0-9]+$/,"");
				if(registry[name] === undefined){
					registry[name] = 0;
					return name;
				}
				return name + (++registry[name]).toString().padStart(settings.namePostFixDigits,"0");
			} else {
				return name;
			}
        },
    };
    return API;
})();
function objNameToHuman(name){
    if(name.indexOf("_") > -1){ return name.replace(/_/g," ") }
    name = name[0].toLowerCase() + name.substring(1);
    return name.replace(/[A-Z]/g,str=>" " + str.toLowerCase()).replace(/^[a-z]/,str=>str.toUpperCase());
}
const CodeWriter = (()=>{
    const source = {
        arrayCallFunction : `
        #    for (const item of this) {
        #        if (#condition#) { $M_condition
        #            #callPath#(#arguments#); $M_call
        #            #process# $M_process
        #        } $M_condition
        #    }
        #`,
    };
    const API = {
        comment : "JIT source code",
        addHeaderComment(lines){
            if(API.comment !== ""){ lines.unshift("    // " + API.comment) }
            return lines;
        },
        removeMarks : [],
        debug : false,
        set removeLine(name) {
            if (name === "") { API.removeMarks.length = 0 }
            else { API.removeMarks.push(name) }
        },
        cleandMarkedLines(lines){
            var j,i,removeMark;
            for(i = 0; i < lines.length; i ++){
                if(lines[i].indexOf("$M_") > -1){
                    removeMark = true;
                    for(const mark of API.removeMarks){
                        if(lines[i].indexOf("$M_" + mark) > -1){
                            lines.splice(i--,1);
                            removeMark = false;
                            break;
                        }
                    }
                    if(removeMark) { lines[i] = lines[i].replace(/\$M_[A-Z]+/gi,"") }
                }
            }
            return lines;
        },
        createSettings(call = "", condition = "", callArgs = "", args = "") {
            return {call , condition, callArgs, args};
        },
        arrayCallItemFunction(settings){
            settings.call = "item." + settings.call;
            return API.arrayProcess(settings);
        },
        arrayProcess({call = "", condition = "", callArgs = "", args = "", process = ""}){
            API.removeLine = "";
            var lines = source.arrayCallFunction
                .replace(/#callPath#/g, call)
                .replace(/#condition#/g, condition)
                .replace(/#arguments#/g, callArgs)
                .replace(/#process#/g, process)
                .replace(/\r\n/g,"\n")
                .replace(/^ *#/gm,"")
                .split("\n")
                .filter(line => line.trim() !== "");
            if (call === "") { API.removeLine = "call"  }
            if (process === "") { API.removeLine = "process"  }
            if (condition === "") { API.removeLine = "condition"  }
            lines = API.cleandMarkedLines(lines);
            lines = API.addHeaderComment(lines);
            args = args.split(",");
            args.push(lines.join("\n"));
            if(API.debug) { console.log(args) }
            return new Function(...args);
        }
    }
    return API;
})();



const D2PointRes = {x : 0, y : 0, u : 0};
function distPointFromLine(x1,y1,x2,y2,px,py){
    var x,y;
    const v1x = x2 - x1;
    const v1y = y2 - y1;
    const u = ((px - x1) * v1x + (py - y1) * v1y) / (v1y * v1y + v1x * v1x);
    x = (D2PointRes.x = x1 + v1x * u) - px;
    y = (D2PointRes.y = y1 + v1y * u) - py;
    return Math.sqrt(x * x + y * y);
}
function distPointFromLineseg(x1,y1,x2,y2,px,py){
    var x,y;
    const v1x = x2 - x1;
    const v1y = y2 - y1;
    const u = D2PointRes.u = ((px - x1) * v1x + (py - y1) * v1y) / (v1y * v1y + v1x * v1x);
    if (u < 0) {
        x = (D2PointRes.x = x1) - px;
        y = (D2PointRes.y = y1) - py;
    } else if (u > 1) {
        x = (D2PointRes.x = x2) - px;
        y = (D2PointRes.y = y2) - py;
    } else {
        x = (D2PointRes.x = x1 + v1x * u) - px;
        y = (D2PointRes.y = y1 + v1y * u) - py;
    }
    return Math.sqrt(x * x + y * y);
}

function getClosestPointOnLine(x1,y1,x2,y2,px,py,res = D2PointRes){
    const v1x = x2 - x1;
    const v1y = y2 - y1;
    const u = ((px - x1) * v1x + (py - y1) * v1y) / (v1y * v1y + v1x * v1x);
    res.x = x1 + v1x * u;
    res.y = y1 + v1y * u;
    return res;
}
function getLineIntercept(l1, l2, point){
    const v1x = l1.p2.x - l1.p1.x;
    const v1y = l1.p2.y - l1.p1.y;
    const v2x = l2.p2.x - l2.p1.x;
    const v2y = l2.p2.y - l2.p1.y;
    const c = v1x * v2y - v1y * v2x;
    if(c !== 0){
        const u = (v2x * (l1.p1.y - l2.p1.y) - v2y * (l1.p1.x - l2.p1.x)) / c;
        point.x = l1.p1.x + v1x * u;
        point.y = l1.p1.y + v1y * u;
    }else{
        point.x = l1.p1.x;
        point.y = l1.p1.y;
    }
    return point;
}
function getPointLinesIntercept(p1, p2, p3, p4, point){
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p4.x - p3.x;
    const v2y = p4.y - p3.y;
    const c = v1x * v2y - v1y * v2x;
    if(c !== 0){
        const u = (v2x * (p1.y - p3.y) - v2y * (p1.x - p3.x)) / c;
        point.x = p1.x + v1x * u;
        point.y = p1.y + v1y * u;
    }else{
        point.x = p1.x;
        point.y = p1.y;
    }
    return point;
}
function doLineSegsIntercept(l1, l2){
    const v1x = l1.p2.x - l1.p1.x;
    const v1y = l1.p2.y - l1.p1.y;
    const v2x = l2.p2.x - l2.p1.x;
    const v2y = l2.p2.y - l2.p1.y;
    const c = v1x * v2y - v1y * v2x;
    if(c !== 0){
        const u = (v2x * (l1.p1.y - l2.p1.y) - v2y * (l1.p1.x - l2.p1.x)) / c;
        if(u >= 0 && u <= 1){
            const u = (v1x * (l1.p1.y - l2.p1.y) - v1y * (l1.p1.x - l2.p1.x)) / c;
            return  u >= 0 && u <= 1;
        }
    }
    return false;
}
function doPointsAsLineIntercept(pa1, pa2, pb1, pb2) {
    const v1x = pa2.x - pa1.x;
    const v1y = pa2.y - pa1.y;
    const v2x = pb2.x - pb1.x;
    const v2y = pb2.y - pb1.y;
    const c = v1x * v2y - v1y * v2x;
    if(c !== 0){
        const u = (v2x * (pa1.y - pb1.y) - v2y * (pa1.x - pb1.x)) / c;
        if(u > 0.001 && u < 0.999){
            const u = (v1x * (pa1.y - pb1.y) - v1y * (pa1.x - pb1.x)) / c;
            return  u > 0.001 && u < 0.999;
        }
    }
    return false;
}
// CW rectangle Vecs b1 to b4 and line from p1 to p2 (Must test if works without at least one point inside)
function unitDistToBoxLineIntercept(b1, b2, b3, b4, p1, p2) {
    var u1,u2,u3,u4,u;
    u1 = u2 = u3 = u4 = Infinity;
    const p1p2x = p2.x - p1.x;
    const p1p2y = p2.y - p1.y;
    const b1b2x = b2.x - b1.x;
    const b1b2y = b2.y - b1.y;
    const b2b3x = b3.x - b2.x;
    const b2b3y = b3.y - b2.y;
    const c1 = p1p2x * b1b2y - p1p2y * b1b2x;
    const c2 = p1p2x * b2b3y - p1p2y * b2b3x;
    const b1p1x = p1.x - b1.x;
    const b1p1y = p1.y - b1.y;
    const uu = p1p2x * b1p1y - p1p2y * b1p1x;
    if(c1 !== 0){
        u = uu / c1;
        u1 = u >= 0 && u <= 1 ? (b1b2x * b1p1y - b1b2y * b1p1x) / c1 : u1;
        const b4p1y = p1.y - b4.y;
        const b4p1x = p1.x - b4.x;
        u = (p1p2x * b4p1y - p1p2y * b4p1x) / c1;
        u2 = u >= 0 && u <= 1 ? (b1b2x * b4p1y - b1b2y * b4p1x) / c1 : u2;
    }
    if(c2 !== 0){
        u = uu / c2;
        u4 = u >= 0 && u <= 1 ? (b2b3x * b1p1y - b2b3y * b1p1x) / c2 : u4;
        const b2p1y = p1.y - b2.y;
        const b2p1x = p1.x - b2.x;
        u = (p1p2x * b2p1y - p1p2y * b2p1x) / c2;
        u3 = u >= 0 && u <= 1 ? (b2b3x * b2p1y - b2b3y * b2p1x) / c2 : u3;
    }
    return Math.min(u1, u2, u3, u4);
}
function angleBetween(a1, a2){
    var a3;
    const x2 = Math.cos(a1);
    const y2 = Math.sin(a1);
    const x1 = Math.cos(a2);
    const y1 = Math.sin(a2);

    const dot = x2 * x1 + y2 * y1;
    if (dot < 0) {
        const cross = x2 * y1 - y2 * x1;
        return cross < 0 ? -Math.PI - Math.asin(cross) : Math.PI - Math.asin(cross);
    }

    return Math.asin(x2 * y1 - y2 * x1);

}
const workingCache = (()=> {
    const points = [];
    var pFree = 0;
    const lines = [];
    var lFree = 0;
    return {
        release() {
            lFree = 0;
            pFree = 0;
        },
        point(x = 0, y = 0) {
            if(pFree >= points.length){
                points.push(utils.point.as(x,y));
                return points[pFree++];
            }
            const p = points[pFree++];
            p.x = x;
            p.y = y;
            return p;
        },
        line(p1 = this.point(), p2 = this.point()) {
            if(lFree >= lines.length){
                lines.push({p1, p2});
                return lines[lFree++];
            }
            const l = lines[lFree++];
            l.p1 = p1;
            l.p2 = p2;
            return l;
        },
    }
})();


var extrasRegistery = (()=>{

    const register = new Map();
    return {
        register(path, extras) {
            register.set(path, {path, extras})
        },
        appendTo(obj){
            for(const {path, extras} of register.values()){
                const pathNames = path.split(".");
                var objPath = obj;
                while(pathNames.length){
                    const name = pathNames.shift();
                    if(objPath[name] === undefined){
                        objPath[name] = {};
                    }
                    objPath = objPath[name];
                }
                Object.assign(objPath,extras);
            }
            extrasRegistery = undefined;
        }
    }
})();




// BoxArea object
// usage
//  var area = new BoxArea({
//      x: ?,  // x,y,width height of area
//      y: ?,
//      width: ?,
//      height : ?.
//      space : ?, // optional default = 1 sets the spacing between boxes
//      minW : ?, // optional default = 0 sets the in width of expected box. Note this is for optimisation you can add smaller but it may fail
//      minH : ?, // optional default = 0 sets the in height of expected box. Note this is for optimisation you can add smaller but it may fail
//  });
//
//  Add a box at a location. Not checked for fit or overlap
//  area.placeBox({x : 100, y : 100, w ; 100, h :100});
//
//  Tries to fit a box. If the box does not fit returns false
//  if(area.fitBox({x : 100, y : 100, w ; 100, h :100})){ // box added
//
//  Resets the BoxArea removing all boxes
//  area.reset()
//
//  To check if the area is full
//  area.isFull();  // returns true if there is no room of any more boxes.
//
//  You can check if a box can fit at a specific location with
//  area.isBoxTouching({x : 100, y : 100, w ; 100, h :100}, area.boxes)){ // box is touching another box
//
//  To get a list of spacer boxes. Note this is a copy of the array, changing it will not effect the functionality of BoxArea
//  const spacerArray = area.getSpacers();
//
//  Use it to get the max min box size that will fit
//
//  const maxWidthThatFits = spacerArray.sort((a,b) => b.w - a.w)[0];
//  const minHeightThatFits = spacerArray.sort((a,b) => a.h - b.h)[0];
//  const minAreaThatFits = spacerArray.sort((a,b) => (a.w * a.h) - (b.w * b.h))[0];
//
//  The following properties are available
//  area.boxes  // an array of boxes that have been added
//  x,y,width,height  // the area that boxes are fitted to
const BoxArea = (()=>{
    const defaultSettings = {
        minW : 0, // min expected size of a box
        minH : 0,
        space : 1, // spacing between boxes
    };
    const eachOf = (array, cb) => { var i = 0; const len = array.length; while (i < len && cb(array[i], i++, len) !== true ); };

    function BoxArea (settings) {
        settings = Object.assign({}, defaultSettings,settings);

        this.width = settings.width;
        this.height = settings.height;
        this.x = settings.x;
        this.y = settings.y;
        const space = settings.space;
        const minW = settings.minW;
        const minH = settings.minH;
        const boxes = [];  // added boxes
        const spaceBoxes = []; // contains boxes the represent available space
        this.boxes = boxes;
        const Box = (x, y, w, h) => ({x, y, w, h});

        function cutBox (box, cutter) { // cuts box into parts outside cutter returning array of boxes
            var b = [];
            const bx = box.x, by = box.y, bw = box.w, bh = box.h;
            const cx = cutter.x, cy = cutter.y, cw = cutter.w, ch = cutter.h;
            if (cx - bx - space >= minW) { b.push(Box(bx, by, cx - bx - space, bh)) }
            if (cy - by - space >= minH) { b.push(Box(bx, by, bw, cy - by - space)) }
            if ((bx + bw) - (cx + cw + space) >= space + minW) { b.push(Box(cx + cw + space, by, (bx + bw) - (cx + cw + space), bh)) }
            if ((by + bh) - (cy + ch + space) >= space + minH) { b.push(Box(bx, cy + ch + space, bw, (by + bh) - (cy + ch + space))) }
            return b;
        }
        function findBestFitBox (box, array = spaceBoxes) {
            var smallest, boxFound, aspect;
            smallest = Infinity;
            aspect = box.w / box.h;
            eachOf(array, (sbox, index) => {
                var area;
                if (sbox.w >= box.w && sbox.h >= box.h) {
                    area = ( sbox.w * sbox.h) * (1 + Math.abs(aspect - (sbox.w / sbox.h)));
                    if (area < smallest) {
                        smallest = area;
                        boxFound = index;
                        if (sbox.w === box.w && sbox.h === box.h) { return true } // if boxes same size then found what we are looking for
                    }
                }
            });
            return boxFound;
        }

        this.isBoxTouching = function (box, boxes = []) { // true if box is in contact with any box in boxes
            const x = box.x, y = box.y, w = x + box.w + space, h = y + box.h + space;
            for (const b of boxes) {
                if (!(b.x > w || b.x + b.w < x - space || b.y > h || b.y + b.h < y - space )) { return true }
            }
            return false;
        }
        function getTouching(box, boxes = spaceBoxes){  // returns boxes removed from boxes touching box
            var i, sbox, touching = [];
            for(i = 0; i < boxes.length; i++){
                sbox = boxes[i];
                if(!(sbox.x > box.x + box.w + space || sbox.x + sbox.w < box.x - space ||
                   sbox.y > box.y + box.h + space || sbox.y + sbox.h < box.y - space )){
                    touching.push(boxes.splice(i--,1)[0])
                }
            }
            return touching;
        }
        function addSpacerBox (box, array = spaceBoxes) {
            var join, dontAdd = false;
            // is box too small?
            if (box.w < minW || box.h < minH) { return }
            eachOf(array, sbox => {
                if(box.x >= sbox.x && box.x + box.w <= sbox.x + sbox.w &&
                    box.y >= sbox.y && box.y + box.h <= sbox.y + sbox.h ){
                    dontAdd = true;
                    return true;
                }
            });
            if (!dontAdd) {
                join = false;
                eachOf(array, sbox => {  // if boxes have same width or height and are overlapping join them
                    var x, y;
                    if (box.x === sbox.x && box.w === sbox.w && !(box.y > sbox.y + sbox.h || box.y + box.h < sbox.y)) {
                        join = true;
                        y = Math.min(sbox.y,box.y);
                        sbox.h = Math.max(sbox.y + sbox.h, box.y + box.h) - y;
                        sbox.y = y;
                        return true;
                    }
                    if (box.y === sbox.y && box.h === sbox.h && !(box.x > sbox.x + sbox.w || box.x + box.w < sbox.x)) {
                        join = true;
                        x = Math.min(sbox.x,box.x);
                        sbox.w = Math.max(sbox.x + sbox.w,box.x + box.w) - x;
                        sbox.x = x;
                        return true;
                    }
                });
                if (!join) { array.push(box) }// add to spacer array
            }
        }
        this.fitBox = function (box) {
            var sb, tb, bf;
            if (boxes.length === 0) {
                box.x = space;
                box.y = space;
                boxes.push(box);
                sb = spaceBoxes.pop();
                spaceBoxes.push(...cutBox(sb, box));
            } else {
                var bf = findBestFitBox(box);
                if (bf !== undefined) {
                    sb = spaceBoxes.splice(bf,1)[0];
                    box.x = sb.x;
                    box.y = sb.y;
                    spaceBoxes.push(...cutBox(sb,box));
                    boxes.push(box);
                    tb = getTouching(box);
                    while (tb.length > 0) { eachOf(cutBox(tb.pop(),box),b => addSpacerBox(b)) }
                } else { return false }
            }
            return true;
        }
        this.placebox = function (box) {
            boxes.push(box);
            var tb = getTouching(box);
            while (tb.length > 0) { eachOf(cutBox(tb.pop(), box),b => addSpacerBox(b)) }
        }
        this.size = function() {
            var w = 0,h = 0;
            for(const box of boxes){
                w = Math.max(w, box.x + box.w);
                h = Math.max(h, box.y + box.h);
            }
            return {w,h};
        }
        this.getSpacers = function(){ return [...spaceBoxes] }
        this.isFull = function(){ return spaceBoxes.length === 0 }
        this.grow = function(wAdd, hAdd) {
            this.width += wAdd;
            this.height += hAdd;
        }
        this.reset = function(){
            boxes.length = 0;
            spaceBoxes.length = 0;
            spaceBoxes.push(Box(this.x + space, this.y + space, this.width - space * 2, this.height - space * 2));
        }
        this.reset();
    }
    return BoxArea;
})();
