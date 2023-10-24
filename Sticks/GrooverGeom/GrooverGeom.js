"use strict";

/* to do.
 Groover.Geom.extension is temp fix for legacy code. The spelling has been fixed. September 2016

*/
/**
 *   Some notes on naming conventions
 * Length is leng
 * Length squared os leng2
 * Distance is dist
 * Direction is dir and in radians
 * Normal is norm
 *   dimensioned objects norm means vector perpendicular and normalised
 * Multiply mult
 * Subtract is sub
 * Vector is vec
 *    Vector is also a point. They are interchangeable and always referenced as a vec
 * LineSegment is a line, lineSeg, or seg, and represents a line with a start and end point
 * Unit refers to a unit dimension
 * Id for identifier. I have done my best to be consistent but sometimes late at night I do ID If you see that consider it a bug that will be fixed when I find it.
 */

 /**
    List of primitives
    Vec     two dimensioned point as a verity of abstracts, vector, point
    Line    two vecs representing a line, lineSeg
    Rectangle A line defining the top and an aspect defining depth
    Box     Axis aligned box
    Circle  Center as vec and radius
    Arc     A circle with a start and end angle and a direction flag
    Bezier  3 or 4 vec representing the start and end and control point/s of a cubic and quadratic bezier curve
    Triangle 3 vec representing the corners of a triangle

    Lists like
    VecArray a list of vectors
    PrimitiveArray a list of primitives

    Additional types
    Matrix  a 2D matrix as 2 vectors representing the x and y axies and an vec as a point representing the origin.

 */

 /**
    common properties. All object must have these properties
    type : A string of the type eg Line.type = "Line"
    toString(precision) : converts the primitive to a string. Precision is the number of decimal places.
    copy() : Creates a new copy of the primitive
    setAs(prim) : Sets the primitive to the same as the supplied primitive prim must be the same type.
    getHash() : Returns a unique has for the primitive in its current state. Note the has is dependent on the primitives state and will return a different hash if there are any changes.
    isEmpty() : Returns true if the primitives current state does not represent any of its possible abstract types
    empty() : forces the primitive into an empty state
    hasId() : returns true if the primitive has been given an Id.
    asSimple() : returns a new object that is just a representation of the objects state
    fromSimple(obj) : creates a new primitive from a simple obj. Missing poverties will be set to the primitive defaults
    makeUnique() : Adds a new and unique to groover.geom current instance. (Note if you have workers each worker is a new instance of groover.geom. Ids between workers are not unique.
    asJSON() : returns a JSON string representing the primitive's state as returned by the primitives asSimple function
    ... this list is incomplete
 */


var groover = {};
groover.geom = (function (){
    const MPI2 = Math.PI * 2;
    const MPI = Math.PI ;
    const MPI90 = Math.PI / 2;
    const MPI180 = Math.PI;
    const MPI270 = Math.PI * ( 3 / 2);
    const MPI360 = Math.PI * 2;
    const MR2D = 180 / MPI;
    const EPSILON = 1E-6; // this is still undecided Could use Number.EPSILON but I feel that is a little small for graphics based metrics
    const EPSILON1 = 1-EPSILON;
    const BEZ3_CIR = 0.55191502449; // Bezier3 circle fit from "Approximate a circle with cubic Bézier curves", lnk http://spencermortensen.com/articles/bezier-circle/
    var UID = 1; // Unique identifier for primitives
    const  triPh = function (a,b,c){    // return the angle pheta of a triangle given length of sides a,b,c. Pheta is the angle opisite the length c
        return Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
    }
    const unitDistOnVec = function (px,py,v1x,v1y){
        return (px * v1x + py * v1y)/(v1y * v1y + v1x * v1x);
    }
    const dist2Vector = function (px,py,v1x,v1y){
        var c;
        c = (px * v1x + py * v1y)/(v1y * v1y + v1x * v1x);
        return Math.hypot(v1x * c - px, v1y * c - py);
    }
    const direction = function (x,y){ // math function returns normalised direction
        return ((Math.atan2(y,x) % MPI2) + MPI2) % MPI2;

    }
    const isSmallestAngleClockwise = function (ang1,ang2){
        if(ang1 < 0){
            if( (ang2 < 0 && ang1> ang2) ||  (ang2 >= 0 && ang1 + MPI < ang2) ){
                return false;
            }
        }else{
            if( (ang2 > 0 && ang1 > ang2) ||  (ang2 <= 0 && ang1 - MPI < ang2) ){
                return false;
            }
        }
        return true;
    }
    const smallestAngleBetween = function (ang1,ang2){
        var cw = true; // clockwise
        var ang;
        if(ang1 < 0){
            if( (ang2 < 0 && ang1> ang2) ||  (ang2 >= 0 && ang1 + MPI < ang2) ){
                cw = false;
            }
        }else{
            if( (ang2 > 0 && ang1 > ang2) ||  (ang2 <= 0 && ang1 - MPI < ang2) ){
                cw = false;
            }
        }
        if(cw){
            var ang = ang2- ang1;
            if(ang < 0){
                ang = ang2 + MPI2 - ang1;
            }
            return ang;
        }
        var ang = ang1 - ang2 ;
        if(ang < 0){
            ang = ang1 + MPI2- ang2;
        }
        return -ang;
    }


    if(typeof GROOVER_GEOM_INCLUDE_MATH !== "undefined" && GROOVER_GEOM_INCLUDE_MATH === true){
        // some math extensions
        Math.triPh = triPh;
        Math.triCosPh = function (a,b,c){ // return the cosine of the angle pheta of a triangle given length of sides a,b,c. Pheta is the angle opposite the length c
            return (c * c - (a * a + b * b)) / (-2 * a * b);
        }
        Math.triLenC = function (a,b,pheta){ // return the length of side C given the length of two sides a,b and the angle opposite the edge C
            return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(pheta));
        }
        Math.triLenC2 = function (a,b,pheta){ // return the length squared of side C given the length of two sides a,b and the angle opposite the edge C
            return a*a + b*b - 2*a*b*Math.cos(pheta);
        }
        Math.smallestAngleBetween = smallestAngleBetween;
        Math.angleBetween = function (x,y,x1,y1){
            var l = Math.hypot(x,y);
            x /= l;
            y /= l;
            l = Math.hypot(x1,y1);
            x1 /= l;
            y1 /= l;
            if(x * -x1 - y * y1 < 0){
                l = x * y1 - y * x1;
                if(l < 0){
                    return -(Math.PI + Math.asin(l));
                }
                return (Math.PI - Math.asin(l));

            }
            return Math.asin(x * y1 - y * x1);
        }
        Math.unitDistOnLine = function (px,py,l1x,l1y,l2x,l2y){
            var v1x,v1y,v2x,v2y,l;
            v1x = l2x - l1x;
            v1y = l2y - l1y;
            l = Math.hypot(v1y,v1x);
            v2x = px - l1x;
            v2y = py - l1y;
            return (v2x * v1x + v2y * v1y)/(l * l);
        }
        Math.unitDistOnVec = unitDistOnVec;
        Math.dist2Line = function (px,py,l1x,l1y,l2x,l2y){
            var v1x,v1y,v2x,v2y,l,c;
            v1x = l2x - l1x;
            v1y = l2y - l1y;
            l = Math.hypot(v1y,v1x);
            v2x = px - l1x;
            v2y = py - l1y;
            c = (v2x * v1x + v2y * v1y)/(l * l);
            return Math.hypot(v1x * c - v2x, v1y * c - v2y);
        }
        Math.dist2Vector = dist2Vector;
        Math.circle = {};
        Math.sphere = {};
        Math.cylinder = {};
        Math.inertia = {};
        Math.inertia.moment = {};
        Math.inertia.moment.hoopZ = function (radius,length,density){
            return MPI2 * length * density * Math.pow(radius,3);
        }
        Math.inertia.moment.hoopX = function (radius,length,density){
            return (1 / 2) * MPI2 * length * density * Math.pow(radius,3);
        }
        Math.inertia.moment.discZ = Math.inertia.moment.HoopX;
        Math.inertia.moment.cylinderZ = Math.inertia.moment.HoopX;
        Math.inertia.moment.cylinderShellZ = Math.inertia.moment.HoopZ;
        Math.inertia.moment.discX = function (radius,length,density){
            return (1 / 4) * MPI2 * length * density * Math.pow(radius,3);
        }
        Math.inertia.moment.cylinderX = function (radius,length,density){
            return ((radius * MPI2 * length) / 12) * (3 * radius * radius + length * length);
        }
        Math.inertia.moment.rod = function (radius,length,density){
            return (1 / 12) * radius * MPI2 * Math.pow(length, 3) * density;
        }
        Math.inertia.moment.tubeZ = function (radiusInside, radiusOutside, length, density){
           var t = (radiusOutside - radiusInside) / radiusOutside;
           var lp = MPI2 * length;
           return (radiusOutside * lp - radiusInside * lp) *  density * radiusOutside * radiusOutside *(1- t + (t * t) / 2);
        }
        Math.inertia.moment.tubeX = function (radiusInside, radiusOutside, length, density){
            var lp = MPI2 * length;
            return (1 / 12) * (radiusOutside * lp - radiusInside * lp) *  density * (3 * (radiusOutside * radiusOutside + radiusInside * radiusInside ) + length * length);
        }
        Math.inertia.moment.sphere = function (radius,length,density){
            return (8 / 15)  * Math.pow(radius, 5) *  Math.PI * density;
        }
        Math.inertia.moment.cuboidH = function (width, height, depth, density){
            return width * height * depth * density * (1 / 12) * (width * width + depth * depth);
        }
        Math.inertia.moment.cuboidW = function (width, height, depth, density){
            return width * height * depth * density * (1 / 12) * (height * height + depth * depth);
        }
        Math.inertia.moment.cuboidD = function (width, height, depth, density){
            return width * height * depth * density * (1 / 12) * (height * height + width * width);
        }
        Math.inertia.moment.cube = function (size,density){
            return Math.pow(size, 6) * density * (1/ 6);
        }
        Math.cylinder.area = function (radius, length){  // surface
            return radius * radius * Math.PI + radius * MPI2 * length;
        }
        Math.cylinder.volume = function (radius, length){
            return radius * MPI2 * length;
        }
        Math.cylinder.radius = function (volume, length){
            return volume / (MPI2 * length);
        }
        Math.cylinder.length = function (radius, volume){
            return volume / (MPI2 * radius);
        }
        Math.circle.area = function (radius){
            return radius * radius * MPI2;
        }
        Math.circle.circumferance = function (radius){
            return radius * MPI2;
        }
        Math.circle.radiusFromArea = function (area){
            return Math.sqrt(area / MPI2);
        }
        Math.circle.radiusFromCircumferance = function (circumferance){
            return circumferance / MPI2;
        }
        Math.sphere.area = function (radius){
            return radius * radius * 2 * MPI2;
        }
        Math.sphere.radiusFromArea = function (area){
            return Math.sqrt(area / (2 * MPI2));
        }
        Math.sphere.volume = function (radius){
            return radius * radius * radius * (4/3) * Math.PI;
        }
        Math.sphere.radiusFromVolume = function (volume){
            return Math.pow(volume / ((4/3) * Math.PI), 1 / 3);
        }

        Math.easeInOut = function (x, pow) {
            var xx = Math.pow(Math.min(1, Math.max(0, x)), pow);
            return (xx / (xx + Math.pow(1 - x, pow)))
        }
        Math.easeIn = function (x, pow) {
            x /= 2;
            var xx = Math.pow(x, pow);
            return (xx / (xx + Math.pow(1 - x, pow))) * 2;
        }
        Math.rushIn = function (x, pow) {
            x = Math.min(1, Math.max(0, x));
            x = x / 2 + 0.5;
            var xx = Math.pow(x, pow);
            return ((xx / (xx + Math.pow(1 - x, pow))) - 0.5) * 2;
        }
        Math.dir = direction;
    }
    if(typeof Math.hypot !== "function"){ // polyfill for math hypot function.
        Math.hypot = function (x, y){ return Math.sqrt(x * x + y * y);};
    }

    var solveBezier3 = function (A,B,C,D){ // solves the 3rd order (cubic) bezier first derivative. See Bezier functions for the derivative
        // Warning this function uses the geom registers via closure
        // geom registers used a,b,c,a1,b1,u,u1
        // results in u and u1. Returns first result
        a = 3 * (-A + 3 * B - 3 * C + D);
        b = 6 * (A - 2 * B + C);
        c = -3 * (A - B);
        a1 = 2 * a;
        c = b * b - 4 * a * c;
        if(c < 0){ // not sure what this means but works when I fix it????
            b1 = Math.sqrt(-c);
        }else{
            b1 = Math.sqrt(c);
        }
        u = (-b + b1) / a1;
        u1 = (-b - b1) / a1;
        return u;
    }
    var solveBezier2 = function (A, B, C){// solves the 2nd order bezier first derivative. See Bezier functions for the derivative
        // Warning this function uses the geom registers via closure
        // geom registers used a,u
        // results in u
        a = B - A;
        u = a / (a- (C - B));
        return u;
    }
    var solveBezierA2 = function (A, B, C){ // solve the 2nd order bezier equation. Need to rename the above two functions
        // 2nd order function a+2(-a+b)x+(a-2b+c)x^2
        a = (A - 2 * B + C);
        b = 2 * ( - A + B);
        c = A;
        a1 = 2 * a;
        c = b * b - 4 * a * c;
        if(c < 0){ // not sure what this means but works when I fix it????
            u = Infinity;
            u1 = Infinity;
            return u;
        }else{
            b1 = Math.sqrt(c);
        }
        u = (-b + b1) / a1;
        u1 = (-b - b1) / a1;
        return u;

    }
    var solveBezierA3 = function (A, B, C, D){  // There can be 3 roots, u,u1,u2 geom registers return the results;
        // Solves 3rd order a+(-2a+3b)t+(2a-6b+3c)t^2+(-a+3b-3c+d)t^3 Cardano method for finding roots
        // this function was derived from http://pomax.github.io/bezierinfo/#intersections cube root solver
        // Also see https://en.wikipedia.org/wiki/Cubic_function#Cardano.27s_method
        // Considering Vieta's substitution instead of this one.. I need to learn a little more
        function crt(v) {
          if(v<0) return -Math.pow(-v,1/3);
          return Math.pow(v,1/3);
        }
        function sqrt(v) {
          if(v<0) return -Math.sqrt(-v);
          return Math.sqrt(v);
        }
        var a, b, c, d, p, p3, q, q2, discriminant, U, v1, r, t, mp3, cosphi,phi, t1, sd;
        u2 = u1 = u = -Infinity;
        d = (-A + 3 * B - 3 * C + D);
        a = (3 * A - 6 * B + 3 * C) / d;
        b = (-3 * A + 3 * B) / d;
        c = A / d;
        p = (3 * b - a * a) / 3;
        p3 = p / 3;
        q = (2 * a * a * a - 9 * a * b + 27 * c) / 27;
        q2 = q / 2;
        a /= 3;
        discriminant = q2 * q2 + p3 * p3 * p3;
        if (discriminant < 0) {
            mp3 = -p / 3;
            r = sqrt(mp3 * mp3 * mp3);
            t = -q / (2 * r);
            cosphi = t < -1 ? -1 : t > 1 ? 1 : t;
            phi = Math.acos(cosphi);
            t1 = 2 * crt(r);
            u = t1 * Math.cos(phi / 3) - a;
            u1 = t1 * Math.cos((phi + 2 * Math.PI) / 3) - a;
            u2 = t1 * Math.cos((phi + 4 * Math.PI) / 3) - a;
            return u;
        }
        if(discriminant === 0) {
            U = q2 < 0 ? crt(-q2) : -crt(q2);
            u = 2 * U - a;
            u1 = -U - a;
            return u;
        }
        sd = sqrt(discriminant);
        u = crt(sd - q2) - crt(sd + q2) - a;
        return u;
    }
    //==============================================================================================
    // polynomial solvers  in the forms.
    // getRoots4 ax^4 + bx^3 + cx^2 + dx + e
    // getRoots3 ax^3 + bx^2 + cx + d
    // getRoots2 ax^2 + bx + c
    // getRoots1 ax + b
    // results in register rArray with rArrayLen holding the count
    //==============================================================================================
    // WARNING WARNING
    // The following functions use the rArray register to store results. The rArrayLen has the length
    // rArrayLen is not reset in these function. You must set the start location of the results
    // by setting rArrayLen >= 0
    //==============================================================================================
    // WARNING
    // Looking at this code 27/3/2017 and it does not look right. I can not find any testing
    // log so there is a good chance that none of these functions have been tested.
    //==============================================================================================
    var getRoots1 = function (a,b) {
        if (a != 0){
            rArray[rArrayLen++] = -b / a;
            return;
        }
    };
    var getRoots2 = function (a,b,c) {
        var d;
        if(Math.abs(a) < EPSILON){
            getRoots1(b,c);
        }
        b /= a;
        c /= a;
        var d = b * b - 4 * c;
        if (d > 0) {
            d = Math.sqrt(d);
            rArray[rArrayLen++] = 0.5 * (-b + d);
            rArray[rArrayLen++] = 0.5 * (-b - d);
        } else if (d === 0) {
            rArray[rArrayLen++] = 0.5 * -b;
        }
    };
    var getRoots3 = function (a,b,c,d) {
        var o,dcr,h,e,t,r,dis,ang,co,si,q3;
        if(Math.abs(a) < EPSILON){
            getRoots2(b,c,d);
        }
        b /= a;
        c /= a;
        d /= a;
        o = b / 3;
        a = (3 * c - b * b) / 3;
        b = (2 * b * b * b - 9 * c * b + 27 * d) / 27;
        h = b / 2;
        dcr = b * b / 4 + a * a * a / 27;
        if (dcr > 0) {
            e = Math.sqrt(dcr);
            t = -h + e;
            r = (t >= 0) ? Math.pow(t, 1 / 3) : - Math.pow(-t, 1 / 3);
            t = -h - e;
            r += (t >= 0) ? Math.pow(t, 1 / 3) : - Math.pow(-t, 1 / 3);
            rArray[rArrayLen++] = r - o;
            return;
        }
        if (dcr < 0) {
            dis = Math.sqrt(-a / 3);
            ang = Math.atan2(Math.sqrt(-dcr), -h) / 3;
            co = Math.cos(ang);
            si = Math.sin(ang);
            q3  = Math.sqrt(3);
            rArray[rArrayLen++] = 2 * dis * cos - o;
            rArray[rArrayLen++] = -dis * (co + q3 * si) - o;
            rArray[rArrayLen++] = -dis * (co - q3 * si) - o;
            return;
        }
        t =  (h >= 0) ? -Math.pow(h, 1 / 3) : Math.pow(-h, 1 / 3);
        rArray[rArrayLen++] = 2 * t - o;
        rArray[rArrayLen++] = -t - o;
    };
    var getRoots3First = function (a,b,c,d) { // Returns only the first root to save time
        var o,dcr,h,e,t,r;
        b /= a;
        c /= a;
        d /= a;
        o = b / 3;
        a = (3 * c - b * b) / 3;
        b = (2 * b * b * b - 9 * c * b + 27 * d) / 27;
        dcr = b * b / 4 + a * a * a / 27;
        h = b / 2;
        if (dcr > 0) {
            e = Math.sqrt(dcr);
            t = -h + e;
            r = (t >= 0) ? Math.pow(t, 1 / 3) : - Math.pow(-t, 1 / 3);
            t = -h - e;
            r += (t >= 0) ? Math.pow(t, 1 / 3) : - Math.pow(-t, 1 / 3);
            return r - o;
        }
        if (dcr < 0) {
            return 2 * Math.sqrt(-a / 3) * Math.cos(Math.atan2(Math.sqrt(-dcr), -h) / 3) - o;
        }
        t =  (h >= 0) ? -Math.pow(h, 1 / 3) : Math.pow(-h, 1 / 3);
        return 2 * t - o;
    };
    var getRoots4 = function (a,b,c,d,e) {
        var y,dcr,s,t1,t2,y,p,m,f
        if(Math.abs(a) < EPSILON){
            getRoots3(b,c,d,e);
        }
        b /= a;
        c /= a;
        d /= a;
        e /= a;
        y = getRoots3First(1,-c, b * d - 4 * e, -b * b * e + 4 * c * e - d * d);
        dcr = b * b / 4 - c + y;
        if (Math.abs(dcr) <= EPSILON){
            dcr = 0;
        }
        if (dcr > 0) {
            s = Math.sqrt(dcr);
            t1 = 3 * b * b / 4 - s * s - 2 * c;
            t2 = (4 * b * c - 8 * d - b * b * b) / (4 * s);
            p = t1 + t2;
            m = t1 - t2;
            p = Math.abs(p) <= EPSILON ? 0 : p;
            m = Math.abs(m) <= EPSILON ? 0 : m;
            b = -(b / 4);
            if (p >= 0) {
                p = Math.sqrt(p);
                rArray[rArrayLen++] = b + (s + p) / 2;
                rArray[rArrayLen++] = b + (s - p) / 2;
            }
            if (m >= 0) {
                m = Math.sqrt(m);
                rArray[rArrayLen++] = b + (m - s) / 2;
                rArray[rArrayLen++] = b - (m + s) / 2;
            }
        } else if (dcr === 0) {
            t2 = y * y - 4 * e;
            if (t2 >= -EPSILON) {
                t2 = t2 < 0 ? 0 : 2 * Math.sqrt(t2);
                t1 = 3 * b * b / 4 - 2 * c;
                b = -b / 4;
                if (t1 + t2 >= EPSILON) {
                    p = Math.sqrt(t1 + t2) / 2;
                    rArray[rArrayLen++] = b + p;
                    rArray[rArrayLen++] = b - p;
                }
                if (t1 - t2 >= EPSILON) {
                    p = Math.sqrt(t1 - t2) / 2;
                    rArray[rArrayLen++] = b + p;
                    rArray[rArrayLen++] = b - p;
                }
            }
        }
    };


    var sharedFunctions = {
        setLabel(label){
            this.labelStr = label;
            return this;
        },
        getLabel(){
            return this.labelStr;
        },
        makeUnique(){
            this.id = UID;
            UID += 1;
            return this;
        },
        copyFull(arg1,arg2){
            var newMe = this.copy(arg1,arg2);
            newMe.id = this.id;
            newMe.labelStr = this.labelStr;
            if(this.constructedWith !== undefined){


            }
            return newMe;
        },
        asSimpleTyped(obj){ // returns the simple object representing this primitive including the type property
            if(typeof this.asSimple === "function"){
                obj = this.asSimple(obj);
            }else{
                if(obj === undefined){
                    obj = {};
                }
            }
            obj.type = this.type;
            obj.id = this.id;
            obj.labelStr = this.labelStr;
            return this;
        },
        asJSON(){
            var obj;
            obj = this.asSimpleTyped();
            return JSON.stringify(obj);
        },
        getAllIdsAsArray(array){
            if(array === undefined){
                array = [];
            }
            if(array.indexOf(this.id) === -1){
                array.push(this.id);
            }
            var pt = geom.primitiveSubPrimitives[this.type];

            if(pt !== undefined){
                var i;
                for(i = 0; i < pt.length; i ++){
                    this[pt[i]].getAllIdsAsArray(array);
                }
            }
            return array;
        },
        /*hasConstructor(){
            if(this.constructedWith !== undefined){
                return true;
            }
            return false;
        },
        addConstructor(construction){
            this.constructedWith = construction;
            construction.hasId = this.hasId.bind(this);
            construction.create = construction.create.bind(this);
            this.hasId = utilityFunctions.hasIdConstruction.bind(this);
            return this;
        },
        recreate(){
            if(this.constructedWith !== undefined && typeof this.constructedWith.create === "function"){
                this.constructedWith.create();
            }
            return this;
        },
        removeConstructor(){
            var cw = this.constructedWith;
            this.hasId = cw.hasId.bind(this);
            this.constructedWith = undefined;
            return this;
        }*/

    }
    var sharedProperties = {
		labelStr : undefined,
        id : undefined,
    }

    // Closure Vars for internal optimisation and now public under the term registers
    // Geom.registers has v1 to v5 and the function get(name) to get a,b,c,u,c1,u1
    // The meaning of register values is dependent on the last call to any of Geom within this scope
    // DO NOT rely on these registers after you have relinquished your current JavasSript context execution
    // the following are to aid in optimisation. Rather than create new primitives when needed these should be used instead
    // Do not return them.
    var v1,v2,v3,v4,v5,va,vb,vc,vd,ve,vr1,vr2; // Vec registers
    var vx,vy,v1x,v1y,u,u1,u2,c,c1,a,a1,b,b1,d,d1,e,e1;
    var l1,l2,l3,l4,l5;//,la,lb,lc,ld,le,lr1,lr2;  //  have not found these useful as yet may return them but want to keep the number of closure variable as low as possible
    var box1;
	var bez; // a bezier that is used to a temp for some bezier functions.
    var rArray; // an internal register array
    var rArrayLen;
    const namedRegisters = {
        u(){return u;},
        u1(){return u1;},
        a(){return a;},
        b(){return b;},
        c(){return c;},
        d(){return d;},
        e(){return e;},
        arraylen(){return arrayLen;},
        a1(){return a1;},
        b1(){return b1;},
        c1(){return c1;},
        d1(){return d1;},
        e1(){return e1;},
    };

    function Geom(){
        v1 = new Vec();
        v2 = new Vec();
        v3 = new Vec();
        v4 = new Vec();
        v5 = new Vec();
        va = new Vec();
        vb = new Vec();
        vc = new Vec();
        vd = new Vec();
        ve = new Vec();
        vr1 = new Vec();
        vr2 = new Vec();
        l1 = new Line();
        l2 = new Line();
        l3 = new Line();
        l4 = new Line();
        l5 = new Line();
		box1 = new Box();
        bez = new Bezier("cubic");
        rArray = [0,0,0,0,0,0,0,0,0,0];

        this.registers = { // for access to geom registers.
            v1 : v1,
            v2 : v2,
            v3 : v3,
            v4 : v4,
            v5 : v5,
            l1 : l1,
            array : rArray,
            getNamedRegList() {  return namedRegisters },
            get(name) { if(namedRegisters[name] !== undefined){ return namedRegisters[name]() } }
        };
        this.primitiveTypes = [ // list of primitives
            "PrimitiveArray",
            "Vec",
            "VecArray",
            "Line",
            "Triangle",
            "Rectangle",
            "Circle",
            "Arc",
            "Box",
            "Empty",
            "Bezier",
            "Transform",
        ];
        this.objectNames = [ // a list of object names. This will include additional extension objects if they are added
            "PrimitiveArray",
            "Vec",
            "VecArray",
            "Line",
            "Triangle",
            "Rectangle",
            "Circle",
            "Arc",
            "Box",
            "Empty",
            "Bezier",
            "Transform",
        ];
        this.extensions = {}; // extensions registered by adding to this object
        this.properties = { // this will be removed soon
            Vec : ["x","y","type"],
            Box : ["t","l","b","r","type"],
            Line: ["p1","p1","type"],
            Arc: ["c","s","e","type"],
            Circle: ["p","r","type"],
            Rectangle: ["t","a","type"],
            VecArray: ["vecs","length","type"],
            PrimitiveArray: ["primitives","length","type"],
            Transform: ["xa","ya","o","type"],
            Triangle : ["p1","p2","p3","type"],
            Bezier : ["p1","p2","cp1","cp2","type"],
            Empty : ["type"],
        };
        this.primitiveSubPrimitives = { // was called primitiveProperties
            Vec : [],
            Box : [],
            Line: ["p1","p2"],
            Arc: ["circle"],
            Circle: ["center"],
            Rectangle: ["top"],
            VecArray: [],
            PrimitiveArray: [],
            Transform: ["xAxis","yAxis","origin"],
            Triangle : ["p1","p2","p3"],
            Bezier : ["p1","p2","cp1","cp2"],
            Empty : [],
        };
        this.Vec = Vec;
        this.Line = Line;
        this.Circle = Circle;
        this.Arc = Arc;
        this.Triangle = Triangle;
        this.Rectangle = Rectangle;
        this.Box = Box;
        this.Transform = Transform;
        this.Bezier = Bezier;
        this.VecArray = VecArray;
        this.PrimitiveArray = PrimitiveArray;
        this.Geom = Geom;
        this.Empty = Empty;
        this.extentions = this.extensions;  // Bug quick fix. Needs to be fixed everywhere!! dang it... :(

    }
    Geom.prototype = {
        //extensions : {},  // needs to be fixed
        extensions : null,
        safePrimitiveArray : true, // if true pushing a primitiveArray onto a primitiveArray will throw an error. If false then there is no restriction. This is to stop infinite recursion that can happen when you push a primitive array onto its self or create a cyclic reference
        defaultPrecision : 4, // precision of toString numbers
        lineFeedDefault : "<br>", // toString linefeed default
        setDefaultLineFeed(str){
            lineFeedDefault = str;
        },
        setDefaultPrecision(value){
            this.defaultPrecision = value;
        },
        init(){
            var me = this;
            this.objectNames.forEach(function (primitive){
                var i;
                var prim = me[primitive];
                for(i in sharedFunctions){
                    if(typeof prim.prototype[i] !== "function"){
                         Object.defineProperty(prim.prototype, i, {
                            writable : true,
                            enumerable : true,
                            configurable : false,
                            value : sharedFunctions[i]
                         });
                    }
                    //console.log("adding to "+primitive+".prototype."+i+"()");
                }
                for(i in sharedProperties){
                     Object.defineProperty(prim.prototype, i, {
                        writable : true,
                        enumerable : true,
                        configurable : false,
                        value : sharedProperties[i]
                     });
                }
            });
        },
        isEmpty(obj){
            if(this.isPrimitive(obj)){
                if(typeof obj.isEmpty === "function"){
                    return obj.isEmpty();
                }
            }
            return undefined;
        },
        validatePrimitive(obj){
            if(typeof obj === "object"){
                if(typeof obj.type === "string"){
                    if(this.primitiveTypes.indexOf(obj.type) > -1){
                        var temp = new Geom[obj.type];
                        for(var i in temp){
                            if(typeof temp[i] !== typeof obj[i]){
                                if(typeof temp[i] === "number" && typeof obj[i] === "string"){
                                    if(isNaN(obj[i])){
                                        return false;
                                    }
                                    obj[i] = Number(ob[i]);
                                }else
                                if(typeof temp[i] === "string" && typeof obj[i] !== "function"  && typeof obj[i].toString === "function"){
                                    obj[i] = obj[i].toString();
                                }else{
                                    return false;
                                }
                            }
                        }
                        return true;
                    }
                }
            }
            return false;
        },
        isPrimitive(obj){
            if(obj !== undefined && typeof obj.type === "string"){
                if(this.primitiveTypes.indexOf(obj.type) > -1){
                    return true;
                }
            }
            return false;
        },
        isType(prim,type){
            if(Array.isArray(type)){
                if(type.indexOf(prim.type) >-1){
                    return true;
                }
                return false;
            }
            if(prim.type === type){
                return true;
            }
            return false;
        },
        createFromSimple(obj){ // creates a primitive from a simple obj representation of the primitive
            if(obj === undefined || obj.type === undefined){
                throw new ReferanceError("Geom.createFromSimple can not create a primitive as the argument 'obj.type' is missing or undefined.");
            }else
            if(this.primitiveTypes[obj.type] === undefined){
                throw new RangeError("Geom.createFromSimple can not create a primitive as the argument 'obj.type' does not represent a known primitive type");
            }
            if(typeof this[obj.type].prototype.fromSimple === "function"){
                return new this[obj.type]().fromSimple(obj);
            }
            return undefined;
        },
        getDetails(){ // helper function for documentation. Will not remain when done
            var newLine = "\r\n";
            function getComments(lines,currentObj){
                var cLines = [];
                lines.forEach(function (line){
                    if(line.indexOf("//") > -1){
                        var l = (line.split("//").pop().trim());
                        if(l !== ""){
                            l = l.replace( /\{a(.*?)\}/g, "requiered argument $1");
                            l = l.replace( /\{o(.*?)\}/g, "optional argument $1");
                            s.objectNames.forEach(function (n){
                                l = l.replace(new RegExp("("+n+")","gi"),"[$1](#"+n.toLowerCase()+")");
                            })
                            l = l.replace( /(`this`)/g, "[this](#"+currentObj.toLowerCase()+")");
                            l = l[0].toUpperCase() + l.substr(1);
                            cLines.push("\t" +l);
                        }

                    }
                });
                return cLines;
            }
            var s = this;
            var str = "";
            var data = [];

            this.objectNames.forEach(function (n){
                var st,f,ii;
                var desc = "## " + n + newLine;
                var methods = "Functions."+newLine;
                var propDesc = "Properties."+newLine;
                var pr = s.properties[n];
                var extensions = {};
                var dat = {};
                dat.name = n;
                dat.properties = [];
                dat.methods = [];
                dat.extensions = [];


                for(var i in s[n].prototype){

                    if(typeof s[n].prototype[i] === "function"){
                        var ce = "";
                        var ext;
                        for(var k in s.extensions){
                            if(s.extensions[k].functions.indexOf(i) > -1){
                                if(extensions[k] === undefined){
                                    extensions[k] = k + " extention."+newLine;
                                    dat.extensions.push({
                                        name : k,
                                        methods : []
                                    });
                                }
                                for(ii = 0; ii < dat.extensions.length; ii ++){
                                    if(dat.extensions[ii].name === k){
                                        ext = dat.extensions[ii];
                                        break;

                                    }
                                }
                                ce = k;
                                break;
                            }
                        }
                        st = s[n].prototype[i].toString();
                        f = st.replace(/\r/g,"").split("\n");
                        var com = getComments(f,n);
                        f = f.shift();
                        f = f.replace("function ","").replace("{","") ;
                        f = f.replace(/\/\/.*/g,"").trim();

                        if(ce !== ""){
                            extensions[ce] += "- **"+n + "." + i+f + "**  " + newLine;
                            ext.methods.push(i + f);
                            if(com.length > 0){
                                extensions[ce] += com.join("  "+newLine)+newLine;
                            }
                        }else{
                            methods += "- **"+n + "." + i+f + "**  " + newLine;
                            dat.methods.push(i + f);
                            if(com.length > 0){
                                methods += com.join("  "+newLine)+newLine;
                            }
                        }
                    }else
                    if(typeof s[n].prototype[i] === "string"){
                        st = s[n].prototype[i].toString();
                        propDesc += "- **"+n + "." + i+"** = '" +st+"'"+"  " + newLine;
                        dat.properties.push(i);
                    }else{
                        st = typeof s[n].prototype[i];
                        dat.properties.push(i);
                        propDesc += "- **"+n + "." + i+"** = " +st+"  " + newLine;
                    }
                }
                str += desc + newLine;
                str += propDesc + newLine;
                str += methods + newLine;
                for(var k in extensions){
                    str += extensions[k] + newLine;
                }
                data.push(dat);
                str += "[Back to top.](#contents)"+newLine+newLine
            });
            console.log(str)
            data.string = str;
            return data;
        }

    }


    function Empty(){};
    function PrimitiveArray(array){ // array can be an array of primitives. No vetting is done so you must ensure that the array only contains geom primitives compatible objects
        if(array === undefined){
            this.primitives = [];
        }else
        if(Array.isArray(array)){
            this.primitives = array;
            this.normalise();
        }else{
            this.primitives = [];
        }
    };
    function Vec(x,y){ // creates a vector x and y are both optional and can be various types
        // if x and y are undefined then an empty vec is created
        // if x is a vec and y is undefined then the vector x is copied
        // if x and y are vecs then the vec x.sub(x) is created
        // if y is undefined and none of the above then vec has both x,y set to the argument x
        // if x is undefined and none of the above then vec is set to the unit vec at angle y in radians
        // else vec is set tp x, and y
        if(x === undefined && y === undefined){
            this.x = this.y = Infinity;

        }else
        if(y === undefined && x !== undefined && x.x !== undefined ){
            this.x = x.x;
            this.y = x.y;
        }else
        if(x !== undefined && x.x !== undefined && y !== undefined && y.y !== undefined){
            this.x = y.x - x.x;
            this.y = y.y - x.y;
        }else
        if(y === undefined){
            this.x = x;
            this.y = x;
        }else
        if(x === undefined ){
            this.x = Math.cos(y);
            this.y = Math.sin(y);
        }else{
            this.x = x;
            this.y = y;
        }
    };
    function VecArray(array){ // array can be an array of vectors. No vetting is done so you must ensure that the array only contains vec compatible objects
        if(array === undefined){
            this.vecs = [];
        }else
        if(Array.isArray(array)){
            this.vecs = array;
            this.normalise();
        }else
        if(geom.isPrimitive(array)){
            if(array.type === "VecArray"){
                this.vecs = [];
                this.append(array);
            }else{
                this.vecs = [];
                if(array.asVecArray !== undefined){
                    this.append(array.asVecArray());
                }else{
                    throw new TypeError("new VecArray can not be created from "+array.type);
                }
            }
        }else{
            this.vecs = [];
        }
    };
    function Triangle(p1,p2,p3){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    };
    function Line(vec1,vec2){
        if(vec1 === undefined && vec2 === undefined){
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec
        }else
        if(vec1 !== undefined && vec1.type === "Vec" && vec2 !== undefined && vec2.type === "Vec"){
            this.p1 = vec1;
            this.p2 = vec2;
        }else{
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec
        }
    };
    function Circle(vec,num){ // if no arguments then creates unit circle at 0,0
        if((vec === undefined || vec === null) && (num === undefined || num === null)){
            this.center = new Vec(0,0);
            this.radius = 1;
        }else
        if(vec.type !== undefined && vec.type === "Vec" && typeof num === "number"){
            this.center = vec;
            this.radius = num;
        }else{
            this.center = new Vec(0,0);
            this.radius = 1;
        }
    };
    function Arc(circle,start,end,direction){
        this.circle = circle === undefined || circle === null ? new Circle() : circle;
        if(start === undefined && end === undefined){
            start = 0;
            end = Math.PI * 2;
        }else
        if(end === undefined){
            end = start + Math.PI;
        }else
        if(start.type === "Vec"){
            this.startFromVec(start);
            if(end.type === "Vec"){
                this.endFromVec(end);
            }else{
                this.end = end;
            }
        }else{
            this.start = start;
            this.end = end;
        }
        this.direction = direction;
    };
    function Rectangle(top,v2Aspect,aspect){
        if(top !== undefined && v2Aspect !== undefined && aspect !== undefined){
            if(top.type === "Vec" && top.v2Aspect.type === "Vec"){
                top = new Line(top,v2Aspect);
                v2Aspect = aspect;
            }
        }

        this.top = top === undefined || top === null ? new Line() : top;
        this.aspect = v2Aspect === undefined || v2Aspect === null ? 1 : v2Aspect;
    };
    function Box(left,top,right,bottom){ //axis aligned box
        if((left === undefined || left === null) && (top === undefined || top === null)  && (right === undefined || right === null) && (bottom === undefined || bottom === null)){
            this.irrate();
            return;
        }
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    };
    function Bezier(p1,p2,cp1,cp2){
        if(typeof p1 === "string"){
            this.p1 = new Vec()
            this.p2 = new Vec()
            this.cp1 = new Vec()
            if(p1.toLowerCase() === "cubic"){
                this.cp2 = new Vec()
            }else{
                this.cp2 = undefined;
            }
        }else{
            if(p1 !== undefined && p1.type === "Bezier"){
                this.p1 = p1.p1;
                this.p2 = p1.p2;
                this.cp1 = p1.cp1;
                this.cp2 = p1.cp2;
            }else{
                this.p1 = p1 === undefined ? new Vec() : p1;
                this.p2 = p2 === undefined ? new Vec() : p2;
                this.cp1 = cp1 === undefined ? new Vec() : cp1;
                this.cp2 = cp2 === undefined ? undefined : cp2 === null ? undefined : cp2;
            }
        }
    }
    function Transform(xAxis,yAxis,origin){
        this.xAxis = xAxis === undefined?new Vec(1,0) : xAxis;
        this.yAxis = yAxis === undefined?new Vec(0,1) : yAxis;
        this.origin = origin === undefined?new Vec(0,0) : origin;
    };

    Empty.prototype = { // this look more and more like it is not needed. I will be removing all instances of this as I go. When and if possible I have removed all references then I will remove empty as a primitive type.
        type : "Empty",
        copy(){  //Makes a copy of this
            return new Empty();  // returns a new Empty
        },
        asBox(box){  // this is always empty and thus has no size. Will create a new box if {obox} is not supplied
            if(box === undefined){
                box = new Box();
            }
            return box; // Returns new box or the {obox}
        },
        setAs(){ // does nothing.
            return this; // returns this.
        },
        isEmpty(){ // always returns true.
            return true; // returns true.
        },
    },
    PrimitiveArray.prototype = {
        primitives : [],
        type : "PrimitiveArray",
        length : 0,
        current : undefined,
        toString(precision,lineFeed){  // returns a string representing this object
                                // the precision can also be changed. The default is 6;
            var str;
            if(lineFeed === undefined){
                lineFeed = geom.lineFeedDefault;
            }
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            var id = this.id === undefined ? "": "'"+this.id+"' ";
            if(this.isEmpty()){
                return "PrimitiveArray : '"+l+"' id : "+id+" ( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;
            }
            str = "PrimitiveArray : '"+l+"' id : "+id+" ("+ this.primitives.length+" primitives" + lineFeed
            this.each(function (prim,i){
                str += "index "+i+" : "+prim.toString(precision)+lineFeed;
            });
            str += ")";
            return str;
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            return this.isIdInArray(id);
        },
        push(primitive){
            if(primitive.type === "PrimitiveArray" && geom.safePrimitiveArray){
                throw Error("Can not push a PrimitiveArray onto the PrimitiveArray.\nThis is to prevent infinite recursion. Use pushUnsafe if you are feeling lucky.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length;
            return this;
        },
        pushUnsafe(primitive){
            if(primitive.type === "PrimitiveArray"){
                console.log("Warning pushing PrimitiveArray onto the PrimitiveArray may create infinite loops.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length;
            return this;
        },
        pushI(primitive){
            if(primitive.type === "PrimitiveArray" && geom.safePrimitiveArray){
                throw Error("Can not pushI a PrimitiveArray onto the PrimitiveArray.\nThis is to prevent infinite recursion. Use pushIUnsafe if you are feeling lucky.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length;
            return this.length - 1;
        },
        pushIUnsafe(primitive){
            if(primitive.type === "PrimitiveArray"){
                console.log("Warning pushing PrimitiveArray onto the PrimitiveArray may create infinite loops.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length;
            return this.length - 1;
        },
        clear(){  // removes all primitives from the list
            this.length = this.primitives.length = 0;
            return this;  // returns this
        },
        reset(){  // I know a little crazzzzy clear,empty, and reset all doing the same but I have yet to decied which it will be and will keep empty, but reset or clear may go.
            this.length = this.primitives.length = 0;
            return this;
        },
        empty(){ // removes all primitives from list
            this.length = this.primitives.length = 0;
            return this;
        },
        isEmpty(){ // returns true if no objects in the array
            return this.primitives.length === 0;
        },
        normalise(){  // set everything correctly. use after manually manipulating this object
          this.length = this.primitives.length;
          return this;
        },
        transform(transform){
            this.each(function (prim){
                transform["applyTo"+prim.type](prim);
            });
            return this;
        },
        asSimple(obj){
             if(obj === undefined){
                 obj = {};
             }
             obj.primitives = [];
             this.each(function (prim){
                 obj.primitives.push(prim.asSimpleTyped());
             });
             return obj;
        },
        fromSimple(obj){
            var i,len;
            this.reset();
            if(obj.primitives === undefined || !Array.isArray(obj.primitives)){
                return this;
            }
            len = obj.primitives.length;
            for(i = 0; i < len; i++){
                this.push(geom.createFromSimple(obj.primitives[i]));
            }
            this.normalise();
            return this;
        },
        replace(id, prim){  // replaces vec with id == id with the supplied vec
            if(id !== undefined){
                this.each(function (p){
                    if(p.replace !== undefined){
                        p.replace(id,prim);
                    }
                });
            }
            return this;
        },
        asBox(box){
            if(box === undefined){
                box = new Box();
            }
            this.each(function (prim){
                prim.asBox(box);
            });
            return box;
        },
        asVecArray(vecArray, instance){
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            this.each(function (prim){
                prim.asVecArray(vecArray, instance);
            });
            return vecArray;
        },
        eachAs(type,callback,dir,start){  // iterates each primitive calling callback only if it of type type
            var i;
            var l = this.primitives.length;
            if(start === undefined || start === null){
                start = 0;
            }
            if(dir){
                l -= 1;
                l -= start;
                for(i = l; i >= 0; i --){
                    if(this.primitives[i].type === type){
                        if(callback(this.primitives[i],i) === false){
                            break;
                        }
                    }
                }
            }else{
                for(i = start; i < l; i ++){
                    if(this.primitives[i].type === type){
                        if(callback(this.primitives[i],i) === false){
                            break;
                        }
                    }
                }
            }
            return this; // returns this
        },
        each(callback,dir,start){
            var i;
            var l = this.primitives.length;
            if(start === undefined || start === null){
                start = 0;
            }
            if(dir){
                l -= 1;
                l -= start;
                for(i = l; i >= 0; i --){
                    if(callback(this.primitives[i],i) === false){
                        break;
                    }
                }
            }else{
                for(i = start; i < l; i ++){
                    if(callback(this.primitives[i],i) === false){
                        break;
                    }
                }
            }
            return this; // returns this
        },
        first(){
            if(this.length === 0){
                return undefined;
            }
            this.current = 0;
            return this.primitives[this.current]; // returns Vec
        },
        next(){
            if(this.length === 0){
                return undefined;
            }
            if(this.current === undefined){
                this.current = 0;
            }else{
                this.current += 1;
            }
            if(this.current >= this.length){
                this.current = 0;
                return undefined;
            }
            return this.primitives[this.current];
        },
        previouse(){
            if(this.length === 0){
                return undefined;
            }
            if(this.current === undefined){
                this.current = this.length - 1;
            }else{
                this.current -= 1;
            }
            if(this.current < 0){
                this.current = 0;
                return undefined;
            }
            if(this.current >= this.length){
                this.current = this.length - 1;
            }
            return this.primitives[this.current];
        },
        last(){
            if(this.length === 0){
                return undefined;
            }
            this.current = this.length -1;
            return this.primitives[this.length-1]; // returns Vec
        },
        firstAs(type){
            if(this.length === 0){
                return undefined;
            }
            this.current = 0;
            while(this.current < this.length && this.primitives[this.current].type !== type){
                this.current += 1;
            }
            if(this.current === this.length){
                this.current = undefined
                return undefined;
            }
            return this.primitives[this.current]; // returns Vec
        },
        nextAs(type){
            if(this.length === 0){
                return undefined;
            }
            if(this.current === undefined){
                this.current = 0;
            }else{
                this.current += 1;
            }
            while(this.current < this.length && this.primitives[this.current].type !== type){
                this.current += 1;
            }
            if(this.current === this.length){
                this.current = undefined
                return undefined;
            }
            return this.primitives[this.current];
        },
        previouseAs(type){
            if(this.length === 0){
                return undefined;
            }
            if(this.current === undefined){
                this.current = this.length - 1;
            }else{
                this.current -= 1;
            }
            if(this.current < 0){
                this.current = undefined;
                return undefined;
            }
            if(this.current >= this.length){
                this.current = this.length - 1;
            }
            while(this.current >= 0 && this.primitives[this.current].type !== type){
                this.current -= 1;
            }
            if(this.current < 0){
                this.current = undefined
                return undefined;
            }
            return this.primitives[this.current];
        },
        lastAs(type){
            if(this.length === 0){
                return undefined;
            }
            this.current = this.length -1;
            while(this.current >= 0 && this.primitives[this.current].type !== type){
                this.current -= 1;
            }
            if(this.current < 0){
                this.current = undefined
                return undefined;
            }
            return this.primitives[this.current];
        },
        getById(id){ // returns first primitive to match the id, else returns undefined
            var retP = undefined;
            this.each(function (prim){
                if(prim.id === id){
                    retP = prim;
                    return false;
                }
            });
            return retP;

        },
        getClosestIndexToVec(vec,type){
            var dist = Infinity;
            var ind = -1;
            if(type !== undefined){
                var types = [].concat(type);
                this.each(function (prim,i){
                    if(types.indexOf(prim.type) > -1){
                        if(prim.distFrom !== undefined){
                            c = prim.distFrom(vec);
                            if(c < dist){
                                ind = i;
                                dist = c;
                            }
                        }
                    }
                });

            }else{
                this.each(function (prim,i){
                    if(prim.distFrom !== undefined){
                        c = prim.distFrom(vec);
                        if(c < dist){
                            ind = i;
                            dist = c;
                        }
                    }
                });
            }
            u = dist;
            return ind;

        },
        getClosestPrimitiveToVec(vec,type){ // returns the primitive with its path closest to vec.  Type is optional if given then will only match primitives of type
            var ind = this.getClosestIndexToVec(vec, type);
            if(ind !== -1){
                return this.primitives[ind];
            }
            return undefined;

        },
        collectIdsAsPrimitiveArray(ids,primArray){ // returns a primitive array contains all primitives that have ids
            var i;
            if(primArray === undefined){
                primArray = new PrimitiveArray();
            }
            if(Array.isArray(ids)){
                var me = this;
                for(i = 0; i < ids.length; i ++){
                    this.each(function (prim){
                        if(prim.hasId(ids[i])){
                            if(!primArray.isIdInArray(prim.id,false,true)){
                                primArray.push(prim);
                           }
                        }
                    });
                }
            }else{
                this.each(function (prim){
                    if(prim.hasId(ids)){
                        primArray.push(prim);
                    }
                });
            }
            return primArray;
        },
        getAllIdsAsArray(array){ // returns an array of ids for the primitives in this.
            if(array === undefined){
                array = [];
            }
            this.each(function (prim,i){
                prim.getAllIdsAsArray(array);
            });
            return array;
        },
        isIdInArray(id,all,shallow){ // id can be a number of string or array. if id is an array it is an array of ids and then will use optional argument `all` if true then this will return true if all ids are in this. If all is not true then will return true if any of the ids are in the this.
            // uses register c  will be the first id match or this.length if this function return false.
            // if id is an array and all === true then c will be the last index found
            // if shallow is true then only check each primitive's ID dont check it for other ids
            var i;
            if(Array.isArray(id)){
                if(all){
                    var idc = [].concat(id);
                    for(c = 0; c < this.length; c ++){
                       if(idc.indexOf(this.primitives[c].id) > -1){
                           while((c1 = idc.indexOf(this.primitives[c].id))  > -1){
                               idc.splice(c1,1);
                           }
                           if(idc.length === 0){
                               return true;
                           }
                       }
                    }
                }else{
                    for(c = 0; c < this.length; c += 1){
                        for(c1 = 0; c1 < id.length; c1 += 1){
                            if(this.primitives[c].hasId(id[c1])){
                                return true;
                            }
                        }
                    }
                }

            }else{
                if(shallow === true){
                    for(i = 0; i < this.length; i ++){
                        if(this.primitives[i].id == id){  // truthy compare == intended
                            return true;
                        }
                    }
                }else{
                    for(i = 0; i < this.length; i ++){
                        if(this.primitives[i].hasId(id)){  // truthy compare == intended
                            return true;
                        }
                    }
                }
            }
            return false;
        },
    }
    VecArray.prototype =  {
        vecs : [],
        items : undefined,
        type :"VecArray",
        current : undefined,
        length : 0,
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            return this.isIdInArray(id);
        },
        each(callback,dir,start = 0){ // Itterates the vecs in this. The itterater can break if the {acallback} returns false. The {odir} if true itterates the vecs in the reverse direction. The {ostart} as Number is the index of the start of itteration.
                                 // if the {odir} is true then {ostart} if passed will be the number of vec from the end to start itteration at
                                 // The {acallback} in the form
                                 // ```JavaScript
                                 // var callback = function (vec, i){
                                 // return boolean
                                 // }
                                 // ```
            var i;
            var l = this.vecs.length;
            if(dir){
                l -= 1;
                l -= start;
                for(i = l; i >= 0; i --){
                    if(callback(this.vecs[i],i) === false){
                        break;
                    }
                }
            }else{
                for(i = start; i < l; i ++){
                    if(callback(this.vecs[i],i) === false){
                        break;
                    }
                }
            }
            return this; // returns this
        },
        cull(callback){  // Itterate all vecs culling those vecs that the {acallback} returns false for.
                                 // Callback {acallback} in the form
                                 // ```JavaScript
                                 // var callback = function (vec, i){
                                 // return boolean
                                 // }
                                 // ```
            var i;
            var l = this.vecs.length;
            for(i =0; i < l; i ++){
                if(callback(this.vecs[i],i) === false){
                    this.vecs.splice(i,1);
                    i -= 1;
                    l -= 1;
                    this.length = this.vecs.length;
                }
            }
            this.length = this.vecs.length;
            return this;  // returns this
        },
        toString(precision, lineFeed){ // return a string representing this object.
                                       // The {olineFeed} can insert a lineFeed after each vec. For example for console output add call with lineFeed = "\n".
                                       // the {oprecision} can also be changed. The default is 6;
            var str;
            if(lineFeed === undefined){
                lineFeed = geom.lineFeedDefault;
            }
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            if(this.isEmpty()){
                return "VecArray: "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "VecArray : "+l+"("+ this.vecs.length+" vecs" + lineFeed
            this.each(function (vec,i){
                str += "index "+i+" : "+vec.toString(precision)+lineFeed;
            });
            str += ")";
            return str; // returns String
        },
        lerp(from,dest,amount){
            var i,len = Math.min(from.vecs.length, dest.vecs.length);
            var v = this.vecs;
            var d = dest.vecs;
            var f = from.vecs;
            for(i = 0; i < len; i++){
                v[i].x = (d[i].x - f[i].x) * amount + f[i].x;
                v[i].y = (d[i].y - f[i].y) * amount + f[i].y;
            }
            return this;
        },
        clear(){  // removes all vecs from the list
            this.length = this.vecs.length = 0;
            return this;  // returns this
        },
        reset(){  // I know a little crazzzzy clear,empty, and reset all doing the same but I have yet to decied which it will be and will keep empty, but reset or clear may go.
            this.length = this.vecs.length = 0;
            return this;
        },
        empty(){ // removes all vecs from list
            this.length = this.vecs.length = 0;
            return this;
        },
        isEmpty(){
            return this.vecs.length === 0;
        },
        normalise(){  // set everything correctly. use after manualy manipulating this object
          this.length = this.vecs.length;
          return this;
        },
        asSimple(obj){
             if(obj === undefined){
                 obj = {};
             }
             obj.vecs = [];
             this.each(function (vec){
                 obj.vecs.push({x : vec.x, y : vec.y});
             });
             return obj;
        },
        fromSimple(obj){
            var i,len;
            this.reset();
            if(obj.vecs === undefined || !Array.isArray(obj.vecs)){
                return this;
            }
            len = obj.vecs.length;
            for(i = 0; i < len; i++){
                this.push(new Vec(obj.vecs[i].x,obj.vecs[i].y));
            }
            this.normalise();
            return this;
        },
        setLength(len){  // sets the length of the vecs array. If greater than this.length then removes any extras and then creates new Vecs to make up the number
            if(len < 0){
                throw RangeError("VecArray.setLength : invalid length < 0.");
            }
            if(len < this.length){
                this.length = len;
                this.vecs.length = len;
                return this;
            }
            this.vecs.length = this.length;
            while(len > this.length){
                this.push(new Vec());
            }
            return this;
        },
        reverse(){
            this.vecs.reverse();
            return this; // returns this
        },
        remove(index){
            if(index >= 0 && index < this.vecs.length){
                this.vecs.splice(index,1);
            }
            this.length = this.vecs.length;
            return this;
        },
        removeById(id){ // remove the vert with id. ID should be unique but I will assume that people will incorrectly use ids so to keep the structure consistant and not effect correct use (appart from cpu load) this function will look through all items. id can be a single number or an array of numbers
            if(this.vecs.length > 0){
                if(Array.isArray(id)){
                    for(c = 0; c < this.vecs.length; c ++){
                        if(id.indexOf(this.vecs[c].id) > -1){
                            this.vecs.splice(c,1);
                            c -= 1;
                        }
                    }
                }else{
                    for(c = 0; c < this.vecs.length; c ++){
                        if(this.vecs[c].id === id){
                            this.vecs.splice(c,1);
                            c -= 1;
                        }
                    }
                }
                this.length = this.vecs.length;
            }
            return this;
        },
        isIdInArray(id,all){ // id can be a number of string or array. if id is an array it is an array of ids and then will use optional argument `all` if true then this will return true if all ids are in this. If all is not true then will return true if any of the ids are in the this.
            // uses register c  will be the first id match or this.length if this function return false.
            // if id is an array and all === true then c will be the last index found
            var i,j;
            if(Array.isArray(id)){
                if(all){
                    var idc = [].concat(id);
                    for(c = 0; c < this.length; c ++){
                       if(idc.indexOf(this.vecs[c].id) > -1){
                           while((c1 = idc.indexOf(this.vecs[c].id))  > -1){
                               idc.splice(c1,1);
                           }
                           if(idc.length === 0){
                               return true;
                           }
                       }
                    }
                }else{
                    for(i = 0; i < this.length; i ++){
                        for(j = 0; j < id.length; j ++){
                            if(this.vecs[i].hasId(id[j])){
                                return true;
                            }
                        }
                    }
                }
            }else{
                for(i = 0; i < this.length; i ++){
                    if(this.vecs[i].hasId(id)){  // truthy compare == intended
                        return true;
                    }
                }
            }
            return false;
        },
        getVecById(id,index){ // returns the first vec that matches the Id, if not found return undefined. If index is pased then starts searching at index, else starts at the first item.
            if(index !== undefined){
                c = Math.max(index,0);
            }else{
                c = 0;
            }
            while(c < this.length){
                if(this.vecs[c].id === id){
                    this.current = c;
                    return this.vecs[c];
                }
                c += 1;
            }
            this.current = c;
            return undefined;
        },
        getAllIdsAsArray(array){ // returns an array of ids for the primitives in this.
            if(array === undefined){
                array = [];
            }
            this.each(function (vec){
                vec.getAllIdsAsArray(array);
            });
            return array;
        },
        getHash(){ // creates a 32bit hashID of the current state. Use this to determine if there has been a change
            var i, v;
            var hash = this.length;
            for(i = 0; i < this.length; i ++){
				v = this.vecs[i];
				if (!isNaN(v.id)) {
					hash += v.id + v.x * v.x + v.y * v.y + Math.atan2(v.y, v.x) * 0xFFFF;
				} else {
					hash += v.x * v.x + v.y * v.y + Math.atan2(v.y, v.x) * 0xFFFF;
				}
            }
            hash = Math.floor(hash % 0xFFFFFFFF);
            return hash;
        },
        getById(id){ // returns first primitive to match the id, else returns undefined
            var vec = undefined;
            this.each(function (v){
                if(v.id === id){
                    vec = v;
                    return false;
                }
            });
            return vec;

        },
        copy(from, to){  // Creates a new VecArray with a copy of the vecs in this.
                                     // if {ofrom} and {oto} are passed then create a copy of the points from {ofrom} to but not including {oto}.
            var to2, count;
            var va = new VecArray();
            if(from !== undefined && from !== null){
                if(to === undefined){
                    to = this.getCount();
                }
            }else
            if(to !== undefined && to !== null){
                from = 0;
            }
            if(from !== undefined){
                count = this.getCount();
                to2 = to;
                if(to > count){
                    this.each(function (vec,ind){
                        va.push(vec.copy());
                    },false,from);
                    to -= count;
                    this.each(function (vec,ind){
                        if(ind < to){
                            va.push(vec.copy());
                        }else{
                            return false;
                        }
                    },false,0);
                    return va;
                }else{
                    this.each(function (vec,ind){
                        if(ind < to){
                            va.push(vec.copy());
                        }else{
                            return false;
                        }
                    },false,from);
                    return va;
                }
            }
            this.each(function (vec){
                va.push(vec.copy());
            });
            return va;  // returns new VecArray
        },
        setAs :function (vecArray){  // sets the array of vecs to that of the {vecArray} will only set existing vecs in this Extra items in the {avecArray} are ignored. If the {avecArray} is smaller than this items then
            this.each(function (vec,i){
                vec.x = vecArray.vecs[i].x;
                vec.y = vecArray.vecs[i].y;
            });
            return this; // returns this
        },
        isEmpty(){ // Returns whether this is empty (has items)
            if(this.vecs.length === 0){
                return true;  // returns true if there are one or more vecs in this
            }
            return false;  // returns false if there are no vecs in this
        },
        push(vec){ // Push the {vec} onto the array of vecs
            this.vecs[this.vecs.length] = vec;
            this.length = this.vecs.length;
            return this;  // returns this
        },
        pushI(vec){ // Push the {vec} onto the array of vecs returning the index of the vec
            this.vecs[this.vecs.length] = vec;
            this.length = this.vecs.length;
            return this.vecs.length-1;  // returns the index of the pushed vec
        },
        append(vecArray){  // append the {vecArray} to the end of the list of vecs
		    if(vecArray && vecArray.type === "VecArray"){
				vecArray.each(vec => this.push(vec));
			}else{
				vecArray.forEach(vec => this.push(vec));
			}
            this.length = this.vecs.length;
            return this;  // returns this
        },
        asBox(box){ // gets the bounding box that envelops all the vecs in the list. The {obox} is used or a new Box is created. Box may be irrational if there are no items in vecArray.
            if(box === undefined){
                var box = new Box();
            }
            this.each(function (vec){
               box.env(vec.x,vec.y);
            });
            return box; // returns the {obox} or a new box.
        },
        mult(number){  // Multiply each vec in the list by the {anumber}
            this.each(function (vec){
               vec.mult(number);
            });
            return this; // returns this.
        },
        add(vec){ // add the {avec} to each vec in the list
            this.each(function (vec1){
               vec1.add(vec);
            });
            return this; // returns this
        },
        sum(){ // returns a vec that is the sum of all vecs
            var vec1 = new Vec(0,0);
            this.each(function (v){
               vec1.add(v);
            });
            return vec1; // returns this
        },
        mean(){
            var count = this.getCount();
            if(count > 0){
                return this.sum().div(count);
            }
            return new Empty();
        },
        rotate(number){  // rotates each vec bu {anumber}
            this.each(function (vec){
               vec.rotate(number);
            });
            return this; //returns this.
        },
        findClosestIndex(vec, limit, rectangular){ // returns the index of the point closest to the {vec}{limit} defines the threshold if defined. Points further away than {limit} are ignored
                                                             // For want of a better name rectangular if true uses the largest x or y difference to determine distance. This in effect makes selection of a point by a box of 2*lime size around the vec
            if(this.vecs.length === 0){
                return -1;
            }
            var minDist = limit = undefined ? Infinity : limit;
            var index = -1;
            var dist = 0;
            if(rectangular){
                this.each(function (vec1,ind){
                    dist = Math.max(Math.abs(vec1.x-vec.x),Math.abs(vec1.y-vec.y));
                    if(dist < minDist){
                        minDist = dist;
                        index = ind;
                    }
                });
            }else{
                this.each(function (vec1,ind){
					v1.x = vec.x - vec1.x;
					v1.y = vec.y - vec1.y;
					dist = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                    if(dist < minDist){
                        minDist = dist;
                        index = ind;
                    }
                });
            }
            return index;
        },
        findClosest(vec,limit = Infinity, rectangular = false){ // returns the reference to the point closest to the {vec} {limit} defines the threshold if defined. Points further away than {limit} are ignored
            if(this.vecs.length === 0){
                return new Empty();
            }
            var ind = this.findClosestIndex(vec,limit, rectangular);
            if(ind === -1){
                return new Empty();
            }
            return this.vecs[ind];
        },
        findInsideBox(box, vecArray, invVecArray){ // returns a vecArray containing points inside the box. Creates a new vecArray if not supplied or empties the supplied one and fills it. If invVecArray is given and is a VecArray then this is emptied and filled with the vecs that are outside the box
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            a = box.left;
            b = box.right;
            u = box.top;
            u1 = box.bottom;
            vx = vecArray.vecs;
            vx.length = 0;
            if(invVecArray !== undefined && invVecArray.type === "VecArray"){
                vy = invVecArray.vecs;
                vy.length = 0;
                for(c = 0; c < this.vecs.length; c ++){
                    c1 = this.vecs[c];
                    if(c1.x >= a && c1.x <= b && c1.y >= u && c1.y <= u1){
                        vx[vx.length] = c1;
                    }else{
                        vy[vy.length] = c1;
                    }
                }
                invVecArray.normalise();
            }else{
                for(c = 0; c < this.vecs.length; c ++){
                    c1 = this.vecs[c];
                    if(c1.x >= a && c1.x <= b && c1.y >= u && c1.y <= u1){
                        vx[vx.length] = c1;
                    }
                }
            }
            vecArray.normalise();
            return vecArray;
        },
        getLast(){ // returns the last vec on the list  .. here for legacy use this.last
            return this.vecs[this.vecs.length-1]; // returns Vec
        },
        last(){
            if(this.length === 0){
                return undefined;
            }
            this.current = this.length -1;
            return this.vecs[this.length-1]; // returns Vec
        },
        first(){
            if(this.length === 0){
                return undefined;
            }
            this.current = 0;
            return this.vecs[this.current]; // returns Vec
        },
        next(){
            if(this.length === 0){
                return undefined;
            }
            if(this.current === undefined){
                this.current = 0;
            }else{
                this.current += 1;
            }
            if(this.current >= this.length){
                this.current = 0;
                return undefined;
            }
            return this.vecs[this.current];
        },
        previouse(){
            if(this.length === 0){
                return undefined;
            }
            if(this.current === undefined){
                this.current = this.length - 1;
            }else{
                this.current -= 1;
            }
            if(this.current < 0){
                this.current = 0;
                return undefined;
            }
            if(this.current >= this.length){
                this.current = this.length - 1;
            }
            return this.vecs[this.current];
        },
        remaining(){ // for use with next, previous start methods
            if(this.current === undefined){
                return this.length;
            }
            return this.length-this.current;
        },
        getCount(){
            return this.vecs.length; // Returns the number of vecs in the list
        },
        sumCross(){ // returns the sum of the cross product of all the vecs as if they are a set of lines. This includes the line that joins the last vec with the first.
            var i,v1,v2;
            var l = this.vecs.length;
            if(l === 0){
                return 0;
            }
            var xc = 0;
            var yc = 0;
            v1 = this.vecs[0]
            for( i = 0; i < l; i ++){
                v2 = this.vecs[(i+1)%l];
                xc += v1.x * v2.y;
                yc += v1.y * v2.x;
                v1 = v2;
            }
            return xc - yc; // Returns Number as the summed cross product
        },
        area(){ // gets the area of the polygon created by the set of points. I am using an old school method and do not know if the is a better way. The verts must be in counter clockwise order.
            return Math.abs(this.sumCross()/2); // Returns Number as the area
        },
        perimiter(){ // gets the length of the perimiter of the polygon created by the set of points.
            var i,v1,v2;
            var l = this.vecs.length;
            if(l === 0){
                return 0;
            }
            var len = 0;
            v1 = this.vecs[0]
            for( i = 0; i < l; i ++){
                v2 = this.vecs[(i+1)%l];
                len += Math.hypot(v1.x - v2.x, v1.y - v2.y);
                v1 = v2;
            }
            return len; // Returns Number as length
        },
        indexOf(vec, start){ // finds the index of the first vec that is the same as {aVec}. If the {ostart} is passed then the search starts at that index
            var index = -1;
            this.each(function (vec1,i){
                if(vec.isSame(vec1)){
                    index = i;
                    return false; // break from each
                }
            },false,start);
            return index; // Returns index as Number of first matching vec or -1
        },
    }
    Triangle.prototype = {
        p1 : undefined,
        p2 : undefined,
        p3 : undefined,
        type : "Triangle",
        copy(){
            return new Triangle(this.p1.copy(),this.p2.copy(),this.p3.copy());
        },
        asBox(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.p1.x, this.p1.y);
            box.env ( this.p2.x, this.p2.y);
            box.env ( this.p3.x, this.p3.y);
            return box;
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.p1.id === id || this.p2.id === id || this.p3.id === id){
                return true;
            }
            return false;
        },
        isEmpty(){
            if(this._empty || this.p1 === undefined || this.p2 === undefined || this.p2 === undefined){
                return true;
            }
            if(this.p1.isEmpty() || this.p1.isEmpty() || this.p1.isEmpty()){
                return true;
            }
            return false;
        },
        empty(){ //
            this.p1.x = this.p1.y = this.p2.x = this.p2.y = this.p3.x = this.p3.y = Infinity;
            return this;
        },
        toString(precision){
            var str;
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            if(this.isEmpty()){
                return "Triangle: "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Triangle : "+l+"(";
            str += "Point 1 : "+ this.p1.toString(precision) + ", ";
            str += "Point 2 : "+ this.p2.toString(precision) + ", ";
            str += "Point 3 : "+ this.p3.toString(precision) ;
            str += ")";
            return str; // returns String
        },
        getHash(){ // returns a unique hash value for the lines current state
            var hash = 0;
            if(!isNaN(this.id)){
                hash += this.id;
            }
            hash += this.p1.getHash();
            hash += this.p2.getHash();
            hash += this.p3.getHash();
            return Math.round(hash  % 0xFFFFFFFF);
        },
        replace(id, prim){  // replaces vec with id == id with the supplied vec
            if(id !== undefined){
                if(prim !== undefined && prim.type === "Vec"){
                    if(this.p1.id === id){
                        this.p1 = prim;
                    }else
                    if(this.p2.id === id){
                        this.p2 = prim;
                    }else
                    if(this.p3.id === id){
                        this.p3 = prim;
                    }
                }
            }
            return this;
        },
        area(){
            return Math.abs( this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1) );
        },
        perimiter(){
            this.lengthAllQuick();
            return a + b + c;
        },
        semiperimiter(){
            return this.perimiter / 2;
        },
        distFrom(vec){  // distance from lines of the triangle
            l1.p1.setAs(this.p1);
            l1.p2.setAs(this.p2);
            c1 = l1.distFrom(vec);
            l1.p1.setAs(this.p2);
            l1.p2.setAs(this.p3);
            c1 = Math.min(c1,l1.distFrom(vec));
            l1.p1.setAs(this.p3);
            l1.p2.setAs(this.p1);
            return Math.min(c1,l1.distFrom(vec));

        },
        snapTo(xGrid, yGrid, rule){
             if(xGrid === undefined){
                xGrid = 1 ;
             }
             if(yGrid === undefined){
                 yGrid = xGrid;
             }
             if(rule !== undefined){
                 rule = Math[rule];
                 if(rule === undefined){
                     rule = Math.round;
                 }
             }else{
                 rule = Math.round;
             }
             if(xGrid === 1 && yGrid === 1){
                this.p1.x = rule(this.p1.x);
                this.p2.x = rule(this.p2.x);
                this.p3.x = rule(this.p3.x);
                this.p1.y = rule(this.p1.y);
                this.p2.y = rule(this.p2.y);
                this.p3.y = rule(this.p3.y);
             }
             this.p1.x = rule(this.p1.x / xGrid) * xGrid;
             this.p2.x = rule(this.p2.x / xGrid) * xGrid;
             this.p3.x = rule(this.p3.x / xGrid) * xGrid;
             this.p1.y = rule(this.p1.y / yGrid) * yGrid;
             this.p2.y = rule(this.p2.y / yGrid) * yGrid;
             this.p3.y = rule(this.p3.y / yGrid) * yGrid;
             return this;
        },
        lerp(from, dest, amount){
            this.p1.x = (dest.p1.x - from.p1.x) * amount + from.p1.x;
            this.p1.y = (dest.p1.y - from.p1.y) * amount + from.p1.y;
            this.p2.x = (dest.p2.x - from.p2.x) * amount + from.p2.x;
            this.p2.y = (dest.p2.y - from.p2.y) * amount + from.p2.y;
            this.p3.x = (dest.p3.x - from.p3.x) * amount + from.p3.x;
            this.p3.y = (dest.p3.y - from.p3.y) * amount + from.p3.y;
            return this;
        },
        asVecArray(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.p1).push(this.p2).push(this.p3);
                return vecArray;
            }
            vecArray.push(this.p1.copy()).push(this.p2.copy()).push(this.p3.copy());
            return vecArray;
        },
        asLines(array){
            if(array === undefined){
                return [
                    new Line(this.p1.copy(),this.p2.copy()),
                    new Line(this.p2.copy(),this.p3.copy()),
                    new Line(this.p3.copy(),this.p1.copy())
                ]
            }
            c = 0;
            if(geom.isPrimitive(array[c]) && array[c].type === "line"){
                array[c].p1.x = this.p1.x;
                array[c].p1.y = this.p1.y;
                array[c].p2.x = this.p2.x;
                array[c].p2.y = this.p2.y;
            }else{
                array[c] = new Line(this.p1.copy(),this.p2.copy());
            }
            c = 1;
            if(geom.isPrimitive(array[c]) && array[c].type === "line"){
                array[c].p1.x = this.p2.x;
                array[c].p1.y = this.p2.y;
                array[c].p2.x = this.p3.x;
                array[c].p2.y = this.p3.y;
            }else{
                array[c] = new Line(this.p2.copy(),this.p3.copy());
            }
            c = 2;
            if(geom.isPrimitive(array[c]) && array[c].type === "line"){
                array[c].p1.x = this.p3.x;
                array[c].p1.y = this.p3.y;
                array[c].p2.x = this.p1.x;
                array[c].p2.y = this.p1.y;
            }else{
                array[c] = new Line(this.p3.copy(),this.p1.copy());
            }

            return array;
        },
        asBoundingCircle(circle){ // circle is bounding but not perfect. On the todos
            if(circle === undefined){
                circle = new Circle();
            }
            this.center(circle.center);
            this.distFromAll(circle.center,rArray);
            var a = Math.max(rArray[0],rArray[1],rArray[2]);
            circle.radius = a;
            return circle;
        },
        asCircle(circle){
            if(circle === undefined){
                circle = new Circle();
            }
            circle.fromVec3(this.p1,this.p2,this.p3);
            return circle;
        },
        asRectangle(sideIndex,retRect){ // returns a rectangle whos top is the sideIndex and whos height bound the triangle
            if(retRect === undefined){
               retRect = new Rectangle();
            }
            if(sideIndex === undefined){
                sideIndex = 0;
            }else{
                sideIndex = Math.min(2, Math.max(0, sideIndex));
            }
            if(sideIndex === 0){
                retRect.top.p1.x = this.p1.x;
                retRect.top.p1.y = this.p1.y;
                retRect.top.p2.x = this.p2.x;
                retRect.top.p2.y = this.p2.y;
                v4.x = this.p3.x;
                v4.y = this.p3.y;
            }else
            if(sideIndex === 1){
                retRect.top.p1.x = this.p2.x;
                retRect.top.p1.y = this.p2.y;
                retRect.top.p2.x = this.p3.x;
                retRect.top.p2.y = this.p3.y;
                v4.x = this.p1.x;
                v4.y = this.p1.y;
            }else{
                retRect.top.p1.x = this.p3.x;
                retRect.top.p1.y = this.p3.y;
                retRect.top.p2.x = this.p1.x;
                retRect.top.p2.y = this.p1.y;
                v4.x = this.p2.x;
                v4.y = this.p2.y;
            }
            b = retRect.top.distFromDir(v4); // The code that forlows uses the registers set here u for unit dist, and _leng for length ont the line retrect.top and v1 as the vector of the line
            if(b < 0){  // if the dist is negative then triangle is anticlockwise so swap top line and ajust unit and vec
                retRect.top.swap();
                b = -b;
                u = 1 - u;
                v1.x = - v1.x;
                v1.y = - v1.y;
            }
            if(u < 0){  // if the closest point is befor the line start move the start of the top back
                retRect.top.p1.x += v1.x * u;
                retRect.top.p1.y += v1.y * u;
                u = 1 - u;
                a = retRect.top._leng * u;
            }else
            if(u > 1){  // if the closest point is after the end move the end forward
                retRect.top.p2.x += v1.x * (u-1);
                retRect.top.p2.y += v1.y * (u-1);
                a = retRect.top._leng * u;
            }else{
                a = retRect.top._leng;
            }
            retRect.aspect = b/a;
            return retRect;
        },
        asArc(arc){
            if(arc === undefined){
                arc = new Arc();
            }
            return arc.fromVec3(this.p1,this.p2,this.p3);
        },
        asInnerCircle(circle){
            if(circle === undefined){
                circle = new Circle();
            }
            this.centerByBisectingAngles(circle.center);
            l1.p1.x = this.p1.x;
            l1.p1.y = this.p1.y;
            l1.p2.x = this.p2.x;
            l1.p2.y = this.p2.y;
            circle.radius = l1.distFrom(circle.center);
            return circle;
        },
        asSimple(obj){ // returns the box as a simple object with left,right,bottom,top,width,height
            if(obj === undefined){
                obj = {};
            }
            obj.x1 = this.p1.x;
            obj.y1 = this.p1.y;
            obj.x2 = this.p2.x;
            obj.y2 = this.p2.y;
            obj.x3 = this.p3.x;
            obj.y3 = this.p3.y;
            return obj;
        },
        fromSimple(obj){ // set this to the simple representation of the primitive. Any missing data will be added
            this.p1.x = obj.x1 === undefined ? 0 : obj.x1;
            this.p1.y = obj.y1 === undefined ? 0 : obj.y1;
            this.p2.x = obj.x2 === undefined ? 0 : obj.x2;
            this.p2.y = obj.y2 === undefined ? 0 : obj.y2;
            this.p3.x = obj.x3 === undefined ? 0 : obj.x3;
            this.p3.y = obj.y3 === undefined ? 0 : obj.y3;
            return this;
        },
        lines(){ // legacy Must remove when sure no dependencies exist
            return [
                new Line(this.p1,this.p2),
                new Line(this.p2,this.p3),
                new Line(this.p3,this.p1)
            ]
        },
        angles(array){
            this.lengthAllQuick();
            if(array === undefined){
                return [
                    triPh(a,c,b),
                    triPh(b,a,c),
                    triPh(c,b,a)
                ];
            }
            array[0] = triPh(a,c,b);
            array[1] = triPh(b,a,c);
            array[2] = triPh(c,b,a);
            return array;
        },
        getSideBisectorAsLine(line, sideIndex){ // gets the unit line bisecting the side. line if supplied is the line to set, else creates a new line. sideIndex is the side 0 to 2 or the closest side index or 0
            if(line === undefined){
                line = new Line();
            }
            if(sideIndex === undefined){
                sideIndex = 0;
            }else{
                sideIndex = Math.min(2, Math.max(0, sideIndex));
            }
            if(sideIndex === 0){
                 v1.x = this.p1.x;
                 v1.y = this.p1.y;
                 v2.x = this.p2.x;
                 v2.y = this.p2.y;
            }else
            if(sideIndex === 1){
                 v1.x = this.p2.x;
                 v1.y = this.p2.y;
                 v2.x = this.p3.x;
                 v2.y = this.p3.y;
            }else{
                 v1.x = this.p3.x;
                 v1.y = this.p3.y;
                 v2.x = this.p1.x;
                 v2.y = this.p1.y;
            }
            line.p1.x = v1.x += (v3.x = v2.x - v1.x)/2;
            line.p1.y = v1.y += (v3.y = v2.y - v1.y)/2;
            u = Math.hypot(v3.x,v3.y);
            v3.x /= u;
            v3.y /= u;
            line.p2.x = v1.x - v3.y;
            line.p2.y = v1.y + v3.x;
            return line;
        },
        getCornerBisectorAsLine(line, cornerIndex){ // gets the unit line bisecting the corner. line if supplied is the line to set, else creates a new line. cornerIndex is the corner 0 to 2 or the closest corner index or 0
            if(line === undefined){
                line = new Line();
            }
            if(cornerIndex === undefined){
                cornerIndex = 0;
            }else{
                cornerIndex = Math.min(2, Math.max(0, cornerIndex));
            }
            if(cornerIndex === 0){
                v1.x = this.p1.x;
                v1.y = this.p1.y;
                v2.x = this.p2.x - v1.x;
                v2.y = this.p2.y - v1.y;
                v3.x = this.p3.x - v1.x;
                v3.y = this.p3.y - v1.y;
            }else
            if(cornerIndex === 1){
                v1.x = this.p2.x;
                v1.y = this.p2.y;
                v2.x = this.p3.x - v1.x;
                v2.y = this.p3.y - v1.y;
                v3.x = this.p1.x - v1.x;
                v3.y = this.p1.y - v1.y;
            }else{
                v1.x = this.p3.x;
                v1.y = this.p3.y;
                v2.x = this.p1.x - v1.x;
                v2.y = this.p1.y - v1.y;
                v3.x = this.p2.x - v1.x;
                v3.y = this.p2.y - v1.y;
            }
            a = Math.atan2(v2.y,v2.x);
            b = Math.atan2(v3.y,v3.x);
            if(b < a){
                b += MPI2;
            }
            c = (a+b)/2;
            line.p1.x = v1.x;
            line.p1.y = v1.y;
            line.p2.x = v1.x + Math.cos(c);
            line.p2.y = v1.y + Math.sin(c);
            return line;
        },
        getSideBisectedAngleIntercept(retVec,cornerIndex){
            this.getCornerBisectorAsLine(l1,cornerIndex);
            if(cornerIndex === undefined){
                cornerIndex = 0;
            }else{
                cornerIndex = Math.min(2, Math.max(0, cornerIndex));
            }
            if(cornerIndex === 0){
                l2.p1.x = this.p2.x;
                l2.p1.y = this.p2.y;
                l2.p2.x = this.p3.x;
                l2.p2.y = this.p3.y;
            }else
            if(cornerIndex === 1){
                l2.p1.x = this.p3.x;
                l2.p1.y = this.p3.y;
                l2.p2.x = this.p1.x;
                l2.p2.y = this.p1.y;
            }else{
                l2.p1.x = this.p1.x;
                l2.p1.y = this.p1.y;
                l2.p2.x = this.p2.x;
                l2.p2.y = this.p2.y;
            }
            return l1.intercept(l2,retVec);
        },
        centerByBisectingAngles(retVec){
            this.getCornerBisectorAsLine(l1,0);
            return l1.intercept(this.getCornerBisectorAsLine(l2,1),retVec);
        },
        center(retVec){
            v1.x = (this.p1.x + this.p2.x + this.p3.x ) / 3;
            v1.y = (this.p1.y + this.p2.y + this.p3.y ) / 3;
            if(retVec === undefined){
                return new Vec(v1);
            }
            retVec.x = v1.x;
            retVec.y = v1.y;
            return retVec;
        },
        sumCross(){
            return  this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1);
        },
        isVecInside(vec){
            var x,y,x1,y1,c; // use the cross product of the vec and each line to find it the point is left off all lines
            v1.x = vec.x - this.p1.x;
            v1.y = vec.y - this.p1.y;
            v2.x = this.p2.x-this.p1.x;
            v2.y = this.p2.y-this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0){
                return false;
            }
            v1.x = vec.x - this.p2.x;
            v1.y = vec.y - this.p2.y;
            v3.x = this.p3.x-this.p2.x;
            v3.y = this.p3.y-this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0){
                return false;
            }
            v1.x = vec.x - this.p3.x;
            v1.y = vec.y - this.p3.y;
            v4.x = this.p1.x-this.p3.x;
            v4.y = this.p1.y-this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0){
                return false;
            }
            return true;
        },
        isLineInside(line){
            if(!this.isVecInside(line.p1)){
                return false;
            }
            return this.isVecInside(line.p2)
        },
        isCircleInside(circle){ // return true is circle is inside triangle. Only valid for clockwise triangles
            if(!this.isVecInside(circle.center)){
                return false;
            }
            v1.x = circle.center.x;
            v1.y = circle.center.y;
            a = circle.radius;
            if(a > dist2Vector(v1.x - this.p1.x, v1.y - this.p1.y, v2.x, v2.y)){
                return false;
            }
            if(a > dist2Vector(v1.x - this.p2.x, v1.y - this.p2.y, v3.x, v3.y)){
                return false;
            }
            if(a > dist2Vector(v1.x - this.p3.x, v1.y - this.p3.y, v4.x, v4.y)){
                return false;
            }
            return true;
        },
        isArcInside(arc){ // not finnished
            if(!this.isVecInside(arc.circle.center)){
                return false;
            }

            return undefined;
        },
        isRectangleInside(rectangle){ // returns true is the rectangle touches the triangle; currently only valid for clockwise triangles
            if(!this.isVecInside(rectangle.top.p1)) { return false }
            if(!this.isVecInside(rectangle.top.p2)) { return false }
            rectangle.heightVec(v5);
            va.x = rectangle.top.p1.x + v5.x;
            va.y = rectangle.top.p1.y + v5.y;
            if(!this.isVecInside(va)) { return false }
            va.x = rectangle.top.p2.x + v5.x;
            va.y = rectangle.top.p2.y + v5.y;
            if(!this.isVecInside(va)) { return false }
            return true;
        },
        isBoxInside(box){
            v1.x = box.left - this.p1.x;
            v1.y = box.top - this.p1.y;
            v2.x = this.p2.x-this.p1.x;
            v2.y = this.p2.y-this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0) { return false }
            v1.x = box.left - this.p2.x;
            v1.y = box.top - this.p2.y;
            v3.x = this.p3.x-this.p2.x;
            v3.y = this.p3.y-this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0) { return false }
            v1.x = box.left - this.p3.x;
            v1.y = box.top - this.p3.y;
            v4.x = this.p1.x-this.p3.x;
            v4.y = this.p1.y-this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0) { return false }
            v1.x = box.right - this.p1.x;
            v1.y = box.top - this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0) { return false }
            v1.x = box.right - this.p2.x;
            v1.y = box.top - this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0) { return false }
            v1.x = box.right - this.p3.x;
            v1.y = box.top - this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0) { return false }
            v1.x = box.right - this.p1.x;
            v1.y = box.bottom - this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0) { return false }
            v1.x = box.right - this.p2.x;
            v1.y = box.bottom - this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0) { return false }
            v1.x = box.right - this.p3.x;
            v1.y = box.bottom - this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0) { return false }
            v1.x = box.left - this.p1.x;
            v1.y = box.bottom - this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0) { return false }
            v1.x = box.left - this.p2.x;
            v1.y = box.bottom - this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0) { return false }
            v1.x = box.left - this.p3.x;
            v1.y = box.bottom - this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0) { return false }
            return true;
        },
        isTriangleInside(triangle){
            if(!this.isVecInside(triangle.p1)){
                return false;
            }
            if(!this.isVecInside(triangle.p2)){
                return false;
            }
            return this.isVecInside(triangle.p3)
        },
        isLineTouching(line){
            if(this.isVecInside(line.p1) || this.isVecInside(line.p2)){
                return true;
            }
            l1.p1.x = this.p1.x;
            l1.p1.y = this.p1.y;
            l1.p2.x = this.p2.x;
            l1.p2.y = this.p2.y;
            if(line.isLineSegIntercepting(l1)){
                return true;
            }
            l1.p1.x = this.p3.x;
            l1.p1.y = this.p3.y;
            if(line.isLineSegIntercepting(l1)){
                return true;
            }
            l1.p2.x = this.p1.x;
            l1.p2.y = this.p1.y;
            if(line.isLineSegIntercepting(l1)){
                return true;
            }
            return false;
        },
        isCircleTouching(circle){ // returns true is the circle touches the triangle; currently only valid for clockwise triangles
            if(this.isVecInside(circle.center)){ // is center inside
                return true;
            }
            // create short quick acess
            v1.x = circle.center.x;
            v1.y = circle.center.y;
            u1 = circle.radius;
            // are any triangle vertex inside circle
            if(u1 > Math.hypot(v1.x - this.p1.x, v1.y - this.p1.y)){
                return true;
            }
            if(u1 > Math.hypot(v1.x - this.p2.x, v1.y - this.p2.y)){
                return true;
            }
            if(u1 > Math.hypot(v1.x - this.p3.x, v1.y - this.p3.y)){
                return true;
            }
            // is circle within radius of each line
            v2.x = this.p2.x - this.p1.x;
            v2.y = this.p2.y - this.p1.y;
            a = unitDistOnVec(v1.x - this.p1.x, v1.y - this.p1.y, v2.x, v2.y);
            if(a >= 0 && a <= 1){
                if(u1 > dist2Vector(v1.x - this.p1.x, v1.y - this.p1.y, v2.x, v2.y)){
                    return true;
                }
            }
            v2.x = this.p3.x - this.p2.x;
            v2.y = this.p3.y - this.p2.y;
            a = unitDistOnVec(v1.x - this.p2.x, v1.y - this.p2.y, v2.x, v2.y);
            if(a >= 0 && a <= 1){
                if(u1 > dist2Vector(v1.x - this.p2.x, v1.y - this.p2.y, v2.x, v2.y)){
                    return true;
                }
            }
            v2.x = this.p1.x - this.p3.x;
            v2.y = this.p1.y - this.p3.y;
            a = unitDistOnVec(v1.x - this.p3.x, v1.y - this.p3.y, v2.x, v2.y);
            if(a >= 0 && a <= 1){
                if(u1 > dist2Vector(v1.x - this.p3.x, v1.y - this.p3.y, v2.x, v2.y)){
                    return true;
                }
            }
            return false;
        },
        isArcTouching(arc){
            return undefined;
        },
        isBoxTouching(box){
            return undefined;
        },
        isRectangleTouching(rectangle){
            return undefined;
        },
        isTriangleTouching(triangle){
            return undefined;
        },
        isClockwise(){
            return  this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1)> 0 ? true : false;
        },
        isRight(){ // returns true if this is a right triangle. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(c > a && c > b){
                if(Math.abs(a + b - c) < EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(Math.abs(c + b - a) < EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(Math.abs(c + a - b) < EPSILON){
                    return true;
                }
            }
            if(Math.abs(a) < EPSILON || Math.abs(b) < EPSILON || Math.abs(c) < EPSILON){ // degenerate right triangle
                return true;
            }
            return false; // not a right triangle
        },
        isOblique(){ // returns true if this triangle is Oblique. This function uses EPSILON to filter out any floating point error.
            return ! this.isRight();
        },
        isDegenerate(){
            this.lengthAllQuick2();
            if(Math.abs(a) < EPSILON || Math.abs(b) < EPSILON || Math.abs(c) < EPSILON){ // degenerate right triangle
                 return true;
            }else
            if(c > a && c > b){
                if(Math.abs(-1 - (c - (a + b) / (-2 * Math.sqrt(a) * Math.sqrt(b)))) < EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(Math.abs(-1 - (a - (c + b) / (-2 * Math.sqrt(c) * Math.sqrt(b)))) < EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(Math.abs(-1 - (b - (a + c) / (-2 * Math.sqrt(a) * Math.sqrt(c)))) < EPSILON){
                    return true;
                }
            }
            return false;
        },
        isObtuse(){ // returns true if this is a obtuse triangle. Has a corner greater than 90deg. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(c > a && c > b){
                if(c - (a + b) > EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(a - (c + b) > EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(b - (a + c) > EPSILON){
                    return true;
                }
            }
            return false; // not a Obtuse triangle
        },
        isAcute(){ // returns true if this is a acute triangle. Has all corners less than 90deg. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(c > a && c > b){
                if(a + b - c > EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(c + b - a > EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(a + c - b > EPSILON){
                    return true;
                }
            }
            return false; // not a acute triangle
        },
        isEquilateral(){ // returns true is this is an equilateral triangle all angle and length are equal. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(Math.abs(a - b) < EPSILON && Math.abs(b - c) < EPSILON && Math.abs(c - a) < EPSILON){
                return true;
            }
            return false;
        },
        isIsosceles(){ // returns true is this is an isosceles triangle two sides and two angles are equal. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(Math.abs(a - b) < EPSILON || Math.abs(b - c) < EPSILON || Math.abs(c - a) < EPSILON){
                return true;
            }
            return false;
        },
        isScalene(){ // returns true is this is a scalene triangle all sides and all angles are not equal. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(Math.abs(a - b) > EPSILON && Math.abs(b - c) > EPSILON && Math.abs(c - a) > EPSILON){
                return true;
            }
            return false;
        },
        description(){  // returns a simple text description of the triangle with any of the following words if applicable right,obtuse,acute,equilateral,isosceles,scalene,degenerate,oblique
            this.lengthAllQuick2();
            var tf = this.lengthAllQuick2;
            this.lengthAllQuick2 = function (){}; // temp replace this function. MUST FIND OUT HOW THIS EFFECT OPTIMISATION on different browsers
            var name = [];
            this.isRight() ? name.push("right") : name.push("oblique");
            this.isDegenerate() ? name.push("degenerate") :"" ;
            this.isObtuse() ? name.push("obtuse") : "";
            this.isAcute() ? name.push("acute") : "";
            this.isEquilateral() ? name.push("equilateral") : "";
            this.isIsosceles() ? name.push("isosceles") :"";
            this.isScalene() ? name.push("scalene") :"";
            this.isEquilateral() ? name.push("Equilateral") :"";
            this.isClockwise() ? name.push("Clockwise") : name.push("Anti-clockwise");
            this.lengthAllQuick2 = tf;
            var label = this.labelStr !== undefined ? "'"+this.labelStr+"'" : "";
            var id = this.id !== undefined ? "id : "+this.id : "";
            var desc =  "Triangle "+label+" " + id + " properties : ["+name.join(",") + "] ";
            desc += "Area : " + this.area().toFixed(1) + " ";
            desc += "Perimiter : " + this.perimiter().toFixed(1) + " "; // this must be flowed by length as it uses the registers
            desc += "Lengths a : " + a.toFixed(1) + " b : " + b.toFixed(1) + " c : " + c.toFixed(1) + " ";
            this.angles(rArray);
            desc += "Angles A : " + (rArray[0] * MR2D).toFixed(1) + " B : " + (rArray[1] * MR2D).toFixed(1) + " C : " + (rArray[2] * MR2D).toFixed(1) + " ";
            return desc;
        },
        isInside(primitive){ // returns true if this is inside the primitive primitive
            var call = this["is"+primitive.type+"Inside"];
            if(call !== undefined){
                return call(primitive);
            }
            return false;
        },
        sliceLineRemove(line,triArray){ // slices triangle with line removing anything right of the line
            if(triArray === undefined){
                triArray = [];
            }

            var pe1 = line.isVecLeft(this.p1);
            var pe2 = line.isVecLeft(this.p2);
            var pe3 = line.isVecLeft(this.p3);
            if(pe1 && pe2 && pe3){
                return triArray.push(this.copy());
            }
            if(!pe1 && !pe2 && !pe3){
                return triArray;
            }


            var l1 = new Line(this.p1,this.p2);
            var l2 = new Line(this.p2,this.p3);
            var l3 = new Line(this.p3,this.p1);
            var v1 = l1.interceptSeg(line);
            var v2 = l2.interceptSeg(line);
            var v3 = l3.interceptSeg(line);
            var e1 = ! v1.isEmpty(); // if not empty
            var e2 = ! v2.isEmpty();
            var e3 = ! v3.isEmpty();

            if(e1 && (v1.isSameE(this.p1) || v1.isSameE(this.p2))){
                e1 = false;
            }
            if(e2 && (v2.isSameE(this.p2) || v2.isSameE(this.p3))){
                e2 = false;
            }
            if(e3 && (v3.isSameE(this.p3) || v3.isSameE(this.p1))){
                e3 = false;
            }
            var tri;
            if(!e1 && ! e2 && !e3){
                tri = [this.copy()];
            }else
            if(e1 && e2 && !e3){
                if(pe2){
                    triArray.push(new Triangle(v1.copy(),this.p2.copy(),v2.copy()));
                }else{
                    triArray.push(   new Triangle(this.p1.copy(),v1,this.p3.copy()));
                    triArray.push(   new Triangle(v1.copy(),v2,this.p3.copy()));
                }
            }else
            if(!e1 && e2 && e3){
                if(pe3){
                    triArray.push(  new Triangle(v2.copy(),this.p3.copy(),v3.copy()));
                }else{
                    triArray.push(  new Triangle(this.p1.copy(),this.p2.copy(),v3));
                    triArray.push(  new Triangle(this.p2.copy(),v2,v3.copy()));
                }

            }else
            if(e1 && !e2 && e3){
                if(pe1){
                    triArray.push(  new Triangle(this.p1.copy(),v1,v3));
                }else{
                    triArray.push(  new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()));
                    triArray.push(  new Triangle(v1.copy(),this.p3.copy(),v3.copy()));
                }
            }else
            if(e1 && !e2 && !e3){
                if(pe1){
                     triArray.push( new Triangle(v1,this.p3.copy(),this.p1.copy()));
                }else{
                     triArray.push( new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()));
                }
            }else
            if(!e1 && e2 && !e3){
                if(pe2){
                    triArray.push( new Triangle(v2.copy(),this.p1.copy(),this.p2.copy()));
                }else{
                    triArray.push( new Triangle(v2,this.p3.copy(),this.p1.copy()));
                }
            }else
            if(!e1 && !e2 && e3){
                if (pe3) {
                    triArray.push(new Triangle(v3, this.p2.copy(), this.p3.copy()));
                } else {
                    triArray.push(new Triangle(v3.copy(), this.p1.copy(), this.p2.copy()));
                }
            }else {
                //triArray = [];
            }
            return triArray;
        },
        sliceLine(line){
            var l1 = new Line(this.p1,this.p2);
            var l2 = new Line(this.p2,this.p3);
            var l3 = new Line(this.p3,this.p1);
            var v1 = l1.interceptSeg(line);
            var v2 = l2.interceptSeg(line);
            var v3 = l3.interceptSeg(line);
            var e1 = ! v1.isEmpty(); // if not empty
            var e2 = ! v2.isEmpty();
            var e3 = ! v3.isEmpty();

            if(e1 && (v1.isSameE(this.p1) || v1.isSameE(this.p2))){
                e1 = false;
            }
            if(e2 && (v2.isSameE(this.p2) || v2.isSameE(this.p3))){
                e2 = false;
            }
            if(e3 && (v3.isSameE(this.p3) || v3.isSameE(this.p1))){
                e3 = false;
            }
            var tri;
            if(!e1 && ! e2 && !e3){
                tri = [this.copy()];
            }else
            if(e1 && e2 && !e3){
                tris = [
                    new Triangle(this.p1.copy(),v1,this.p3.copy()),
                    new Triangle(v1.copy(),v2,this.p3.copy()),
                    new Triangle(v1.copy(),this.p2.copy(),v2.copy())
                 ];
            }else
            if(!e1 && e2 && e3){
                tris = [
                    new Triangle(this.p1.copy(),this.p2.copy(),v3),
                    new Triangle(this.p2.copy(),v2,v3.copy()),
                    new Triangle(v2.copy(),this.p3.copy(),v3.copy())
                 ];

            }else
            if(e1 && !e2 && e3){
                tris = [
                    new Triangle(this.p1.copy(),v1,v3),
                    new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()),
                    new Triangle(v1.copy(),this.p3.copy(),v3.copy())
                 ];
            }else
            if(e1 && !e2 && !e3){
                tris = [
                    new Triangle(v1,this.p3.copy(),this.p1.copy()),
                    new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()),
                ];
            }else
            if(!e1 && e2 && !e3){
                tris = [
                    new Triangle(v2,this.p3.copy(),this.p1.copy()),
                    new Triangle(v2.copy(),this.p1.copy(),this.p2.copy()),
                ];
            }else
            if(!e1 && !e2 && e3){
                tris = [
                    new Triangle(v3,this.p2.copy(),this.p3.copy()),
                    new Triangle(v3.copy(),this.p1.copy(),this.p2.copy()),
                ];
            }else{
                tris = [];
            }
            return tris;
        },
        slice(obj){
            return undefined;


        },
        unitDistOfClosestPoint(vec){ // returns the unit distance of the closest point on the line from the point vec
            l1.p1.setAs(this.p1);
            l1.p2.setAs(this.p2);
            e = l1.distFrom(vec);
            a = u;
            a1 = Math.hypot(v1.x,v1.y);

            l1.p1.setAs(this.p2);
            l1.p2.setAs(this.p3);
            e1 = l1.distFrom(vec);
            b = u;
            b1 = Math.hypot(v1.x,v1.y);

            l1.p1.setAs(this.p3);
            l1.p2.setAs(this.p1);
            c = l1.distFrom(vec);
            c1 = Math.hypot(v1.x,v1.y);
            if(e < e1 && e < c){
                return (a1 * a) / (a1 + b1 + c1);
            }else
            if(e1 < e && e1 < c){
                return (a1 + b1 * b) / (a1 + b1 + c1);
            }
            return (a1 + b1 + c1 * u) / (a1 + b1 + c1);
        },
        unitAlong( unitDist , rVec){   // returns a point unitDist on the triangle. 1 unit is equal to the perimeter of the triangle
            if(rVec === undefined){
                rVec = new Vec();
            }
            this.lengthAll(rArray);
            // the following code uses the registers v1,v2,v3 holding the vectors for lines p1-p2, p2-p3, and p3-p1 created by the function length all
            a = rArray[0] + rArray[1] + rArray[2];
            b = a * unitDist;
            if(b < rArray[0]){
                b /= rArray[0];
                rVec.x = this.p1.x + v1.x * b;
                rVec.y = this.p1.y + v1.y * b;
            }else
            if(b < rArray[1] + rArray[0]){
                b -= rArray[0];
                b /= rArray[1];
                rVec.x = this.p2.x + v2.x * b;
                rVec.y = this.p2.y + v2.y * b;
            }else{
                b -= rArray[0] + rArray[1];
                b /= rArray[2];
                rVec.x = this.p3.x + v3.x * b;
                rVec.y = this.p3.y + v3.y * b;
            }
            return rVec;
        },
        circumcenter(vec){ //returns the circumcenter as a vec of this triangle or an empty vec if the triangle is collinear. vec is optional and if supplied will be set to the cirumcenter else a new vec will be returned. This function uses Circle.fromVec3
           // This function uses the registers b and v1
           // b is the circle that fits the three points on the triangle if any
           // v1 is the center
           // set Circle.fromVec3 for deatail on more registers being used.
           b = new Circle().fromVec3(this.p1, this.p2, this.p3);
           if(vec === undefined){
               vec = new Vec();
           }
           if(b.center.x === Infinity){
               return vec.empty();
           }
           vec.x = v1.x;
           vec.y = v1.y;
           return vec;
        },
        meanCenter(vec){ // the center of mass (Though I could be wrong as I can not find this formula to confirm it to be but I need this and as I am at a loss as what to call it for now it is the mean center)
            if(vec === undefined){
                vec = new Vec();
            }
            vec.x = (this.p1.x + this.p2.x + this.p3.x) / 3;
            vec.y = (this.p1.y + this.p2.y + this.p3.y) / 3;
            return vec;
        },
        isSimilar(triangle){// returns true if supplied triangle is a similar to this triangle. A similar triangle has the same ratio between the sides though the sides may be rotated within the point p1,p2,p3
            u = this.angleAll();
            u1 = triangle.angleAll();
            c1 = function (a,b){return a-b;};
            u.sort(c1);
            u1.sort(c1);
            if(Math.abs(u[0] - u1[0]) <= EPSILON && Math.abs(u[1] - u1[1]) <= EPSILON && Math.abs(u[2] - u1[2]) <= EPSILON){
                return true;
            }
            return false;
        },
        reverse(swap){ // if swap is supplied then swaps that point and the next. Defaults to 0 if not given. swap === 0 then swap p1,p2 swap === 1 swaps p2,p3 and swap === 3 swaps p3,p1
            if(swap === undefined || swap === 0){
                v1.x  = this.p1.x;
                v1.y  = this.p1.y;
                this.p1.x = this.p2.x,
                this.p1.y = this.p2.y,
                this.p2.x = v1.x;
                this.p2.y = v1.y;
            }else
            if(swap === 1){
                v1.x  = this.p2.x;
                v1.y  = this.p2.y;
                this.p2.x = this.p3.x,
                this.p2.y = this.p3.y,
                this.p3.x = v1.x;
                this.p3.y = v1.y;
            }else{
                v1.x  = this.p3.x;
                v1.y  = this.p3.y;
                this.p3.x = this.p1.x,
                this.p3.y = this.p1.y,
                this.p1.x = v1.x;
                this.p1.y = v1.y;
            }
            return this;
        },
        makeClockwise(swap){ // ensures the triangle is clockwise. if swap is supplied then swaps that point and the next swap === 0 then swap p1,p2 swap === 1 swaps p2,p3 and swap === 3 swaps p3,p1
            if(this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1) < 0){
                this.reverse(swap);
            }
            return this;
        },
        lengthAllQuick2(){ // sets registers a,b,c to the square length of the sides. Returns this;
            a = Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2);
            b = Math.pow(this.p3.x - this.p2.x, 2) + Math.pow(this.p3.y - this.p2.y, 2);
            c = Math.pow(this.p1.x - this.p3.x, 2) + Math.pow(this.p1.y - this.p3.y, 2);
            return this;
        },
        lengthAllQuick(){ // sets registers a,b,c to the length of the sides. Returns this;
            a = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
            b = Math.hypot(this.p3.x - this.p2.x, this.p3.y - this.p2.y);
            c = Math.hypot(this.p1.x - this.p3.x, this.p1.y - this.p3.y);
            return this;
        },
        distFromAll(vec,array){ // returns the distance from all the points of a point at vec
            if(array === undefined){
                array = [];
            };
            array[0] = Math.hypot(vec.x - this.p1.x, vec.y - this.p1.y);
            array[1] = Math.hypot(vec.x - this.p2.x, vec.y - this.p2.y);
            array[2] = Math.hypot(vec.x - this.p3.x, vec.y - this.p3.y);
            return array;
        },
        lengthAll(array){ // returns an array containing the length of each side if array supplied the first three items are set
            if(array === undefined){
                array = [];
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p3.x - this.p2.x;
            v2.y = this.p3.y - this.p2.y;
            v3.x = this.p1.x - this.p3.x;
            v3.y = this.p1.y - this.p3.y;
            array[0] = Math.hypot(v1.x,v1.y);
            array[1] = Math.hypot(v2.x,v2.y);
            array[2] = Math.hypot(v3.x,v3.y);
            return array;
        },
        angleAll(array){ // returns an array containing the angles at each pount if array supplied the first three items are set
            if(array === undefined){
                array = [];
            }
            this.lengthAllQuick();
            array[0] = triPh(a,c,b)
            array[1] = triPh(a,b,c)
            array[2] = triPh(b,c,a)
            return array;
        },
        longestLength(){ // returns the length of the longest side
            this.lengthAllQuick2();
            if(a >= c && a >= b){
                return Math.sqrt(a);
            }
            if(c >= a && c >= b){
                return Math.sqrt(c);
            }
            return Math.sqrt(b);
        },
        shortestLength(){ // returns the length of the shortest side
            this.lengthAllQuick2();
            if(a >= c && a >= b){
                return Math.sqrt(a);
            }
            if(c >= a && c >= b){
                return Math.sqrt(c);
            }
            return Math.sqrt(b);
        },
        inflate(amount){ // only currently for for clockwise triangles need to use a different approach to correctly miter and should be quicker
            // create vectors for each side
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p3.x - this.p2.x;
            v2.y = this.p3.y - this.p2.y;
            v3.x = this.p1.x - this.p3.x;
            v3.y = this.p1.y - this.p3.y;
            c1 = amount
            if(v1.x * - v3.y - v1.y * - v3.x < 0){
                v1.x = - v1.x;
                v1.y = - v1.y;
                v2.x = - v2.x;
                v2.y = - v2.y;
                v3.x = - v3.x;
                v3.y = - v3.y;
                c1 = - amount;
            }

            // find length of each side
            a = Math.hypot(v1.x,v1.y);
            b = Math.hypot(v2.x,v2.y);
            c = Math.hypot(v3.x,v3.y);
            // normalise each side
            v1.x /= a;
            v1.y /= a;
            v2.x /= b;
            v2.y /= b;
            v3.x /= c;
            v3.y /= c;
            // one at time get the angle starting at point p1 and caculate the mitter
            u = triPh(a,c,b) / 2; // need half the angle
            u1 = Math.cos(u) * amount / Math.sin(u); // the length to add to the line to get to the miter point
            this.p1.x -= v1.x * u1;  // move the point
            this.p1.y -= v1.y * u1;
            u = triPh(b,a,c) / 2; // need half the angle
            u1 = Math.cos(u) * amount / Math.sin(u); // the length to add to the line to get to the miter point
            this.p2.x -= v2.x * u1;  // move the point
            this.p2.y -= v2.y * u1;
            u = triPh(b,c,a) / 2; // need half the angle
            u1 = Math.cos(u) * amount / Math.sin(u); // the length to add to the line to get to the miter point
            this.p3.x -= v3.x * u1;  // move the point
            this.p3.y -= v3.y * u1;
            // now move the points alone the line norm to offset by amount
            this.p1.x += v1.y * c1;
            this.p1.y -= v1.x * c1;
            this.p2.x += v2.y * c1;
            this.p2.y -= v2.x * c1;
            this.p3.x += v3.y * c1;
            this.p3.y -= v3.x * c1;
            // all done
            return this;
        },
        setAs(triangle){
            this.p1.x = triangle.p1.x;
            this.p1.y = triangle.p1.y;
            this.p2.x = triangle.p2.x;
            this.p2.y = triangle.p2.y;
            this.p3.x = triangle.p3.x;
            this.p3.y = triangle.p3.y;
            return this;
        },
        scale(scale){
            this.p1.x *= scale;
            this.p1.y *= scale;
            this.p2.x *= scale;
            this.p2.y *= scale;
            this.p3.x *= scale;
            this.p3.y *= scale;
            return this; // returns this
        },
        translate(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            this.p3.x += vec.x;
            this.p3.y += vec.y;
            return this; // returns this
        },
        rotate(rotation){
            var dx = Math.cos(rotation);
            var dy = Math.sin(rotation);
            var x = this.p1.x;
            var y = this.p1.y;
            this.p1.x = x * dx + y * -dy;
            this.p1.y = x * dy + y * dx;
            x = this.p2.x;
            y = this.p2.y;
            this.p2.x = x * dx + y * -dy;
            this.p2.y = x * dy + y * dx;
            x = this.p3.x;
            y = this.p3.y;
            this.p3.x = x * dx + y * -dy;
            this.p3.y = x * dy + y * dx;
            return this; // returns this
        },
        transform(transform){
            transform.applyToTriangle(this)
            return this; // returns this
        },
    },
    Vec.prototype = {
        x : 1,
        y : 0,
        _leng : null,  // optimising result for length
        _dir : null,  // optimising result for direction
        type : "Vec",
        copy(){  return new Vec(this.x, this.y) }, // Creates a copy of this
        asSimple(obj  = {}){ // returns the vec as a simple object with left,right,bottom,top,width,height
            obj.x = this.x;
            obj.y = this.y;
            return obj;
        },
        fromSimple(obj){ // set this to the simple representation of the primitive. Any missing data will be added
            this.x = obj.x === undefined ? 1 : obj.x;
            this.y = obj.y === undefined ? 0 : obj.y;
            return this;
        },
        toString(precision){  // returns a string representing this object
                                // the precision can also be changed. The default is 6;
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            var id = this.id === undefined ? "": "'"+this.id+"' ";
            if(this.isEmpty()) { return "Vec : '"+l+"' id : "+id+" ( Empty )" }
            if(precision === undefined || precision === null) { precision = geom.defaultPrecision }
            return "Vec: '"+l+"' id : "+id+" ("+ this.x.toFixed(precision) + ", "+this.y.toFixed(precision) + ")"; // returns String
        },
        getHash(){ // creates a 32bit hashID of the current state. Use this to determine if there has been a change
            if(!isNaN(this.id)){
                return Math.floor((this.id + this.x * this.x + this.y * this.y + Math.atan2(this.y,this.x)*0xFFFFFFF) % 0xFFFFFFFF);
            }
            return Math.floor((this.x*this.x + this.y * this.y + Math.atan2(this.y,this.x)*0xFFFFFFF) % 0xFFFFFFFF);
        },
        setAs(vec,num){  // Sets this vec to the values in the {avec} or if two args then assumed to be numbers x and y
            if(num === undefined){
                this.x = vec.x;
                this.y = vec.y;
            }else{
                this.x = vec;
                this.y = num;
            }
            return this;  // Returns the existing this
        },
        hasId(id){ return this.id === id }, // returns true if this, or any of the points has the id,
        getAllIdsAsArray(array  = []){ // returns an array with this id
            if(array.indexOf(this.id) === -1) { array.push(this.id) }
            return array;
        },
        asVecArray(vecArray  =  new VecArray(), instance = false){ // returns a vec array containing a copy of this. If instance is true then the reference to this is added
            if (instance) { vecArray.push(this) }
            else { vecArray.push(this.copy()) }
            return vecArray;
        },
        asBox(box = new Box()){  // returns the bounding box that envelops this vec
            box.env (this.x, this.y);
            return box;  // returns box
        },
        isEmpty(){  // returns true if undefined or infinite
            if(this.x === undefined || this.y === undefined ||
                this.x === Infinity || this.y === Infinity ||
                this.x === -Infinity || this.y === -Infinity ||
                isNaN(this.x) || isNaN(this.y)){
                    return true;
            }
            return false;
        },
        isZero(){ return (this.x === 0 && this.y === 0) },
        empty(){  // empties the vec by setting x and y to infinity
            this.y = this.x = Infinity;
            return this;
        },
        isSame(vec){ return (vec.x === this.x && vec.y === this.y) }, // Returns true if the {avec} is the same as this
        isSameE(vec){ return Math.sqrt((vec.x-this.x) ** 2,(vec.y-this.y) ** 2) < EPSILON },// Returns true if the {avec} is the same as this. Uses EPSILON
        lerp(from, dest,amount){
            this.x = (dest.x-from.x) * amount + from.x;
            this.y = (dest.y-from.y) * amount + from.y;
            return this;
        },
        vectorToPolar(){ // converts the this to a polar vector. Warning there is no flag to indicate this is a pokar. It is up to the API code to track what the vec represents
            v1.x = this.x;
            v1.y = this.y;
            this.x = Math.hypot(v1.x * v1.x + v1.y * v1.y);
            this.y = Math.atan2(v1.y, v1.x);
            return this;
        },
        polarToVector(){ // converts from polar to a vector
            v1.x = this.x;
            v1.y = this.y;
            this.x = Math.cos(v1.y) * v1.x;
            this.y = Math.sin(v1.y) * v1.x;
            return this;
        },
        add(vec){ // adds {avec} to this
            this.x += vec.x;
            this.y += vec.y;
            return this;    // returns this
        },
        addLeng(length){
            u = length / Math.sqrt(this.x * this.x + this.y * this.y);
            this.x += this.x * u;
            this.y += this.y * u;
            return this;
        },
        sub(vec){  // subtracts {avec} from this
            this.x -= vec.x;
            this.y -= vec.y;
            return this; // returns this
        },
        mult(number){
            this.x *= number;
            this.y *= number;
            return this; // returns this
        },
        div(number){
            this.x /= number;
            this.y /= number;
            return this; // returns this
        },
        rev() {
            this.x = - this.x;
            this.y = - this.y;
            return this; // returns this
        },
        r90() {
            var x = this.x;
            this.x = - this.y;
            this.y = x;
            return this; // returns this
        },
        rN90() {
            var x = this.x;
            this.x = this.y;
            this.y = -x;
            return this; // returns this
        },
        r180() {
            this.x = - this.x;
            this.y = - this.y;
            return this; // returns this
        },
        fromPolar(dir, distance) { // set the vec from polar coordinates
            this.x = Math.cos(dir) * distance;
            this.y = Math.sin(dir) * distance;
            return this;
        },
        addPolar(dir, distance) { // adds polar coords to the vec
            this.x += Math.cos(dir) * distance;
            this.y += Math.sin(dir) * distance;
            return this;
        },
        half() {
            this.x /= 2;
            this.y /= 2;
            return this; // returns this
        },
        setLeng(number) {  // Sets the length (magnitude) of this vec to the {number}.
            u = number / Math.sqrt(this.x * this.x + this.y * this.y);
            this.x = this.x * u;
            this.y = this.y * u;
            this._leng = number;
            return this; // returns this
        },
		setDistFrom(distance,vec) { // moves this along line from this to vec so that  it is  distance  from vec
			v1.x = this.x - vec.x;
			v1.y = this.y - vec.y;
			u = distance / Math.sqrt(v1.x * v1.x + v1.y * v1.y);
			this.x = vec.x + v1.x * u;
			this.y = vec.y + v1.y * u;
		},
        setDir(radians) { // Sets the direction of this by {radians} in radians. This function does not change the magnitude of this vec.
            u = this._leng  = Math.sqrt(this.x * this.x + this.y * this.y);
            this.x = Math.cos(radians) * u;
            this.y = Math.sin(radians) * u;
            return this;  // returns this
        },
        rotate(radians) { // Rotates around (0,0) this by {radians}
            u = this._leng  = Math.sqrt(this.x * this.x + this.y * this.y);
            this._dir = (radians += Math.atan2(this.y,this.x));
            this.x = Math.cos(radians) * u;
            this.y = Math.sin(radians) * u;
            return this;  // returns this
        },
        magnitude() { return this._leng  = Math.sqrt(this.x * this.x + this.y * this.y) },  // returns the magnitude of this as a Number
        leng() { return this._leng  = Math.sqrt(this.x * this.x + this.y * this.y) },
        leng2() { return this.x * this.x + this.y * this.y },
        dir() { return this._dir = Math.atan2(this.y, this.x) },
        mid() { // sets the vector to the mid point, eg divide by 2
            this.x /= 2;
            this.y /= 2;
            return this;
        },
        norm() { // normalises this to be a unit length.
            u =  Math.sqrt(this.x * this.x + this.y * this.y);
            this.x /= u;
            this.y /= u;
            this._leng = 1;
            return this; // returns this
        },
        dot(vec) { return this.x * vec.x + this.y * vec.y },  // get the dot product of this and {avec}
        dotUnit(vec) { return (this.x * vec.x + this.y * vec.y) / (this.x * this.x + this.y * this.y) }, // returns the dot product of this and vec divided by the magnitude of this
        cross(vec) { return this.x * vec.y - this.y * vec.x }, // get the cross product of this and the {avec}
        crossUnit(vec) { return (this.x * vec.y - this.y * vec.x) / (this.x * this.x + this.y * this.y) },  // returns the dot product of this and vec divided by the magnitude of this
        dotNorm(vec) { // get the dot product of the normalised this and {avec}
            u = Math.sqrt(this.x * this.x + this.y * this.y);;
            u1 = Math.sqrt(vec.x * vec.x + vec.y * vec.y);;
            return (this.x / u) * (vec.x / u1) + (this.y / u) * (vec.y / u1);
        },
        crossNorm(vec) { // get the cross product of the normalised this and the {avec}
            u = Math.sqrt(this.x * this.x + this.y * this.y);;
            u1 = Math.sqrt(vec.x * vec.x + vec.y * vec.y);;
            return (this.x / u) * (vec.y / u1) - (this.y / u) * (vec.x / u1);
        },
        angleBetween(vec) { // get the angle between this and the {avec}
            u = Math.sqrt(this.x * this.x + this.y * this.y);
            u1 = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
            v1.x = this.x / u;
            v1.y = this.y / u;
            v2.x = vec.x / u1;
            v2.y = vec.y / u1;
            c = Math.asin(v1.x * v2.y - v1.y * v2.x);
            d = -v1.y * v2.y - v1.x * v2.x;
            if(d > 0){
                if(c > 0){
                    return Math.PI - c;
                }
                return -Math.PI - c;
            }
            return c;
        },
        distFrom(vec) { // get the distance from this to the vec
            v1.x = this.x-vec.x;
            v1.y = this.y-vec.y;
            return Math.sqrt(v1.x * v1.x + v1.y * v1.y); // returns number
        },
        distTo(vec) { // get the distance from this to the vec
            v1.x = this.x-vec.x;
            v1.y = this.y-vec.y;
            return Math.sqrt(v1.x * v1.x + v1.y * v1.y); // returns number
        },
        distAlongNorm(vec) { // similar to Line.distFrom buut this assumes that the vec is the line from (0,0) and the argument vec is the point
            u = (vec.x * this.x + vec.y * this.y)/(this.y * this.y + this.x * this.x);
            return Math.sqrt((this.x * u - vec.x) ** 2, (this.y * u - vec.y) ** 2);
        },
        angleTo(vec) { return Math.atan2(vec.y - this.y, vec.x-this.x) }, // Get the direction from this to the vec
        scale(scale) {
            this.x *= scale;
            this.y *= scale;
        },
        interceptX(X){  // the y coordinates the vector intercepts the x coordinate X
            if(this.x === 0){ return Infinity }
            return (this.y / this.x) * X;
        },
        interceptY(Y){  // the x coordinates the vector intercepts the y coordinate Y
            if(this.y === 0){ return Infinity }
            return (this.x / this.y) * Y;
        },

        translate(vec) {
            this.x += vec.x;
            this.y += vec.y;
        },
        transform(transform) {
            vx = this.x * transform.xAxis.x + this.y * transform.yAxis.x + transform.origin.x;
            this.y = this.x * transform.xAxis.y + this.y * transform.yAxis.y + transform.origin.y;
            this.x = vx;
            return this;
        },
    }
    Arc.prototype = {
        circle : undefined,
        start : 0,
        end : 0,
        direction : undefined, // defaults to undefined which is the same as false and means clockwise, if true makes the are anticlockwise. This is an late addition and thus makes all of arc a little obsolete but for rendering this is needed.
        type : "Arc",
        copy(){
            return new Arc(this.circle.copy(), this.start, this.end, this.direction);
        },
        setAs(arc){
            this.circle.setAs(arc.circle);
            this.start = arc.start;
            this.end = arc.end;
            this.direction = arc.direction;
            return this;         // returns this.
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.circle.center.id === id){
                return true;
            }
            return false;
        },

        distFrom(vec){ // returns the distance from the vec of the arc
            a1 = this.circle.center.angleTo(vec);
            a1 = ((a1 % MPI2) + MPI2) % MPI2;
            if(this.direction === true){
                if( a1 >=  ((this.end % MPI2) + MPI2) % MPI2){
                    if( a1 <= ((this.start % MPI2) + MPI2) % MPI2){
                        return this.circle.distFrom(vec);
                    }
                }
            }else{
                if( a1 >=  ((this.start % MPI2) + MPI2) % MPI2){
                    if( a1 <= ((this.end % MPI2) + MPI2) % MPI2){
                        return this.circle.distFrom(vec);
                    }
                }
            }
            c1 = this.startAsVec(v1).distFrom(vec);
            return Math.min(c1, this.endAsVec(v1).distFrom(vec));

        },
        asBox(box  = new Box()){

            this.normalise();
            box.env (
                this.circle.center.x + Math.cos(this.start) * this.circle.radius,
                this.circle.center.y + Math.sin(this.start) * this.circle.radius
            );
            box.env (
                this.circle.center.x + Math.cos(this.end) * this.circle.radius,
                this.circle.center.y + Math.sin(this.end) * this.circle.radius
            );
            var s = this.start;
            var e = this.end;
            if(s > e){ s -= MPI2 }
            if(s <= 0 && e >= 0) { box.env ( this.circle.center.x + this.circle.radius) }
            if((s <= -MPI && e >= -MPI) || (s <= MPI && e >= MPI)) { box.env ( this.circle.center.x - this.circle.radius) }
            if(s <= MPI90 && e >= MPI90 || (s <= -MPI270 && e >= -MPI270)) { box.env (undefined, this.circle.center.y + this.circle.radius) }
            if((s <= MPI270 && e >= MPI270) || (s <= -MPI90 && e >= -MPI90)) { box.env (undefined, this.circle.center.y - this.circle.radius) }
            return box;
        },
        asVecArray(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.circle.center);
                return vecArray;
            }
            vecArray.push(this.circle.center.copy());
            return vecArray;
        },
        isEmpty(){
            if(this.start === this.end ||
                    this.start === Infinity || this.end === Infinity ||
                    this.start === -Infinity || this.end === -Infinity ||
                    this.start === undefined || this.end === undefined ||
                    isNaN(this.start) || isNaN(this.end) ||
                    this.circle.isEmpty()){
                return true;
            }
            return false;
        },
        empty(){
            this.start = Infinity;
            this.end = Infinity;
        },
        isZero(){
            if(this.start === this.end){
                return true;
            }
            return false;
        },
        toString(precision){
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            var id = this.id === undefined ? "": "'"+this.id+"' ";
            if(this.isEmpty()){
                return "Arc : '"+l+"' id : "+id+" ( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;
            }
            var str =  "Arc : '"+l+"' id : "+id+" ( "+this.circle.toString(precision)+", ";
            str += "Start : " + this.start.toFixed(precision) + ", "
            str += "End : " + this.end.toFixed(precision) + ", "
            str += this.direction ? "Clockwise" : "Anticlockwise";
            str += ")";
            return str;

        },
        getHash(){ // returns a unique hash value for the lines current state
            var hash = 0;
            if(!isNaN(this.id)){
                hash += this.id;
            }
            hash += this.circle.getHash() + this.start * this.start + this.end * this.end + (this.direction ? 13 : 17);
            return Math.round(hash  % 0xFFFFFFFF);
        },
        replace(id, prim){  // replaces vec with id == id with the supplied vec
            if(id !== undefined){
                if(prim !== undefined){
                    if(prim.type === "Vec"){
                        if(this.circle.center.id === id){
                            this.circle.center = prim;
                        }
                    }else
                    if(prim.type === "Circle"){
                        if(this.circle.id === id){
                            this.circle = prim;
                        }
                    }
                }
            }
            return this;
        },
        asCircle(){
            return this.circle.copy();
        },
        asTriangles(sides,sector,array){
            sides = sides === undefined || sides === null ? 8 : Math.max(4,Math.floor(sides));
            var steps = (this.end - this.start)/sides;
            var i,cx,cy,x,y,xx,yy,c,a,px,py,r;
            px = cx = this.circle.center.x;
            py = cy = this.circle.center.y;
            r = this.circle.radius;
            x = cx + Math.cos(this.start) * r;
            y = cy + Math.sin(this.start) * r;
            if(sector !== true){
                px = (x + cx + Math.cos(this.end) * r) /2;
                py = (y + cy + Math.sin(this.end) * r) /2;
            }
            if(array === undefined){
                array = [];
            }
            c = 0;
            x = cx + Math.cos(this.start) * r;
            y = cy + Math.sin(this.start) * r;
            for(i = this.start + steps; i < this.end + steps/2; i += steps,c++){
                xx = cx + Math.cos(i) * r;
                yy = cy + Math.sin(i) * r;
                a = array[c];
                if(a === undefined){
                    array[c] = new Triangle(new Vec(px,py),new Vec(x,y),new Vec(xx,yy));
                }else{
                    a.p1.x = px;
                    a.p1.y = py;
                    a.p2.x = x;
                    a.p2.y = y;
                    a.p3.x = xx;
                    a.p3.y = yy;
                }
                x = xx;
                y = yy;
            }
            return array;


        },
        asSimple(obj){ // returns a object or adds to obj the current state of this primitive. The obj will not contain the prototype chain of this primitive
            if(obj === undefined){
                obj = {};
            }
            obj.x = this.circle.center.x;
            obj.y = this.circle.center.y;
            obj.radius = this.circle.center.radius;
            obj.start = this.start;
            obj.end = this.end;
            obj.direction = this.direction;
            return obj;
        },
        fromSimple(obj){ // set this to the simple representation of the primitive. Any missing data will be added
            this.circle.center.x = obj.x === undefined ? 0 : obj.x;
            this.circle.center.y = obj.y === undefined ? 0 : obj.y;
            this.circle.center.radius = obj.radius === undefined ? 0 : obj.radius;
            this.start = obj.start === undefined ? 0 : obj.start;
            this.end = obj.end === undefined ? MPI : obj.end;
            this.direction = obj.direction === undefined ? false : obj.direction;
            return this;
        },
        lerp(from, dest, amount){
            this.circle.center.x = (dest.circle.center.x - from.circle.center.x) * amount + from.circle.center.x;
            this.circle.center.y = (dest.circle.center.y - from.circle.center.y) * amount + from.circle.center.y;
            this.circle.radius = (dest.circle.radius - from.circle.radius) * amount + from.circle.radius;
            this.start = (dest.start - from.start) * amount + from.start;
            this.end = (dest.end - from.end) * amount + from.end;
            return this;
        },
        sweap(){
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if( s > e){
                s -= MPI2;
            }
            return (e-s);
        },
        arcLength(){  // returns the arc length of this arc
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if( s > e){
                s -= MPI2;
            }
            return (e-s); // returns a number
        },
        fromCircleIntercept(circle){
            var pa = this.circle.intercept(circle);
            if(pa.vecs.length > 0){
                this.fromPoints(pa.vecs[0],pa.vecs[1]);
            }else{
                this.start = 0;
                this.end = 0;
            }
            return this; // returns this.
        },
        areaOfSector(){
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if( s > e){
                s -= MPI2;
            }
            return this.circle.radius * this.circle.radius * (e-s);
        },
        areaOfSegment(){
            var swap = false;
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if( s > e){
                s -= MPI2;
            }
            var a = (e-s); // angle
            if(a > MPI){
                a = MPI2-a;
                swap = true;
            }
            var p =  this.circle.radius * this.circle.radius * a; // area of the pie shape
            var c = Math.sin(a/2) * this.circle.radius; // lenght of half the cord;
            var d = Math.sqrt(this.circle.radius * this.circle.radius - c * c); // length of line from center to cord
            if(swap){
                return  (this.circle.radius * this.circle.radius * MPI2 ) - (p - c * d); // area is Pie area - triangle *2
            }else{
                return  p - c * d; // area is Pie area - triangle *2
            }
        },
        normaliseDirection() { // set direction flag if arc is anti clockwise
            this.direction = false;
            v1.x = Math.cos(this.start);
            v1.y = Math.sin(this.start);
            v2.x = Math.cos((this.start + this.ens)/2)-v1.x;
            v2.y = Math.sin((this.start + this.ens)/2)-v1.y;
            v1.x -= Math.cos(this.end);
            v1.y -= Math.sin(this.end);
            if(v1.x * v2.y - v1.y * v2.x > 0){
                this.direction = true;
            }
            return this;
        },
        fromVec3(vec1, vec2, vec3){ // creates an arc that fits the three vectors if possible If points are on a line then an empty arc is returned
            // This function uses Geom registers v1
            // v1 is the center of the circle if return is not empty
            this.circle.fromVec3(vec1, vec2, vec3);
            if(this.circle.radius !== Infinity){
                this.start = a = ((Math.atan2(vec1.y - v1.y, vec1.x - v1.x) % MPI2) + MPI2) % MPI2;  // start
                b = ((Math.atan2(vec2.y - v1.y, vec2.x - v1.x) % MPI2) + MPI2) % MPI2;
                this.end = c = ((Math.atan2(vec3.y - v1.y, vec3.x - v1.x) % MPI2) + MPI2) % MPI2;  // end
                this.direction = false;
                if(a > c){
                    a -= MPI2;
                }
                if(b > a && b < c){
                }else{
                    b -= MPI2;
                    if(b > a && b < c){
                    }else{
                        this.direction = true;
                    }
                }
                //this.normalise()
               // this.towards(vec2)
             //   this.normaliseDirection()
            }else{
                this.start = Infinity;
                this.end = Infinity;
            }
            return this;
        },
        fromTriangle(triangle){// positions and sets radius to fit all 3 points of the triangle if possible. If not returns empty circle
            return this.fromVec3(triangle.p1,triangle.p2,triangle.p3);
        },
        fromTangentAt(where, tangentVec){ // fits the arc so that it has the tangent at start or end depending on arg where. The start and end points are not move only the circle center and radius are moved to fit
            a = Math.hypot(v1.x = tangentVec.x,v1.y = tangentVec.y);

            v1.x /= a;
            v1.y /= a;
            if(where === "start" || where === "Start"){
                this.startAsVec(v2);
                this.endAsVec(v3);
                b = Math.hypot(v4.x = v2.x - v3.x,v4.y = v2.y - v3.y);
                v4.x /= b;
                v4.y /= b;
                c = v1.x * -v4.y + v1.y * v4.x;
                this.circle.radius = c1 = (b / 2) / c;

                this.circle.center.x = v2.x - v1.y * c1;
                this.circle.center.y = v2.y + v1.x * c1;
                this.start = Math.atan2(v2.y - this.circle.center.y,v2.x - this.circle.center.x);
                this.end = Math.atan2(v3.y - this.circle.center.y,v3.x - this.circle.center.x);
            }else{
                this.endAsVec(v2);
                this.startAsVec(v3);

                b = Math.hypot(v4.x = v2.x - v3.x,v4.y = v2.y - v3.y);
                v4.x /= b;
                v4.y /= b;
                c = v1.x * -v4.y + v1.y * v4.x;
                this.circle.radius = c1 = (b / 2) / c;

                this.circle.center.x = v2.x - v1.y * c1;
                this.circle.center.y = v2.y + v1.x * c1;
                this.end = Math.atan2(v2.y - this.circle.center.y,v2.x - this.circle.center.x);
                this.start = Math.atan2(v3.y - this.circle.center.y,v3.x - this.circle.center.x);
            }
           // return this.normaliseDirection();
        },
        fitToCircles(cir1,cir2,rule){ // fits this arc to the two circle
            this.circle.fitToCircles(cir1,cir2,rule);
            if(!this.circle.isEmpty()){
                this.startFromVec(cir1.center).endFromVec(cir2.center);
            }
            return this;
        },
        swap(direction){ // start and end points, or is direction is true then swaps the direction between clockwise and anti clockwise
            if(direction){
                this.direction = ! this.direction;
                return this;
            }
            c = this.start;
            this.start = this.end;
            this.end = c;
            return this; // returns this.
        },
        reverse(){ // switch start and end angles
            c = this.start;
            this.start = this.end;
            this.end = c;
            return this; // returns this.
        },
        fromPoints(p1,p2,p3){
            if(p3 === undefined){
                this.start = this.circle.angleOfPoint(p1);
                this.end = this.circle.angleOfPoint(p2);
                return this; // returns this.
            }
            var a1 = ((this.circle.angleOfPoint(p1) % MPI2) + MPI2) % MPI2;
            var a2 = ((this.circle.angleOfPoint(p2) % MPI2) + MPI2) % MPI2;
            var a3 = ((this.circle.angleOfPoint(p3) % MPI2) + MPI2) % MPI2;
            this.start = Math.min(a1,a2,a3);
            this.end = Math.max(a1,a2,a3);
            return this;
        },
        setRadius(number){ // set the radius of this to the {number}
            this.circle.radius = number;
            return this; // returns this.
        },
        addToRadius( number ){
            this.circle.radius += number;
            return this; // returns this.
        },
        multiplyRadius( number ){
            this.circle.radius *= number;
            return this; // returns this.
        },
        setCenter(vec){  // sets the center of this to the {vec}
            this.circle.center.x = vec.x;
            this.circle.center.y = vec.y;
            return this; // returns this.
        },
        setCircle(circle){  // set this.circle to the {acircle}
            this.circle.center.x = circle.center.x;
            this.circle.center.y = circle.center.y;
            this.circle.radius = circle.radius;
            return this; // returns this.
        },
        normalise(){ // Changes the start and end angle to within the range 0 - Math.PI * 2
            this.start = ((this.start % MPI2) + MPI2) % MPI2;
            this.end = ((this.end % MPI2) + MPI2) % MPI2;
            return this; // returns this.
        },
        towards(vec){ // Changes the arc if needed to bend towards the {vec}
            a = ((this.circle.angleOfPoint(vec) % MPI2) + MPI2) % MPI2;
            b = ((this.start % MPI2) + MPI2) % MPI2;
            e = ((this.end % MPI2) + MPI2) % MPI2;
            if(b > e){
                b -= MPI2;
            }
            if(a > b && a < e){
                return this;
            }
            a -= MPI2;
            if(a > b && a < e){
                return this;
            }
            c = this.start;
            this.start = this.end;
            this.end = c;
            return this; // returns this.
        },
        away(vec){ // Changes the arc if needed to bend away from the {vec}
            a = ((this.circle.angleOfPoint(vec) % MPI2) + MPI2) % MPI2;
            b = ((this.start % MPI2) + MPI2) % MPI2;
            e = ((this.end % MPI2) + MPI2) % MPI2;
            if(b > e){
                b -= MPI2;
            }
            if(a > b && a < e){
                return this.swap();
            }
            a -= MPI2;
            if(a > b && a < e){
                return this.swap();
            }
            c = this.start;
            this.start = this.end;
            this.end = c;
            return this; // returns this.
        },
        endsAsVec(vecArray, vecEnd) {  // if vecArray is array then vecEnd is ignored if vecArray is a vec then vecEnd must be included or only start vec is returned
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            if(vecArray.type === "VecArray"){
                vecArray.push(new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius))
                        .push(new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius))
                return vecArray;
            }
            vecArray.x = this.circle.center.x + Math.cos(this.start) * this.circle.radius;
            vecArray.y = this.circle.center.y + Math.sin(this.start) * this.circle.radius;
            if(vecEnd !== undefined){
                vecEnd.x = this.circle.center.x + Math.cos(this.end) * this.circle.radius;
                vecEnd.y = this.circle.center.y + Math.sin(this.end) * this.circle.radius;
            }
            return  vecArray;
        },
        startAsVec(vec) {
            c = this.start;
            if(vec === undefined){
                return new Vec(this.circle.center.x + Math.cos(c) * this.circle.radius,this.circle.center.y + Math.sin(c) * this.circle.radius);;
            }
            vec.x = this.circle.center.x + Math.cos(c) * this.circle.radius;
            vec.y = this.circle.center.y + Math.sin(c) * this.circle.radius;
            return vec;
        },
        endAsVec(vec) {
            c = this.end;
            if(vec === undefined){
                return new Vec(this.circle.center.x + Math.cos(c) * this.circle.radius,this.circle.center.y + Math.sin(c) * this.circle.radius);
            }
            vec.x = this.circle.center.x + Math.cos(c) * this.circle.radius;
            vec.y = this.circle.center.y + Math.sin(c) * this.circle.radius;
            return vec
        },
        unitPosAsVec(unit,vec){ // legacy  don't use
            console.warning("Geom.Arc.unitPosAsVec has depreciated use unitAlong instead.");
            return this.unitAlong(unit, vec);
        },
        unitAlong(unit,vec){
            this.normalise();

            if(this.direction){
                if(this.end < this.start){
                    c = this.start - (this.start-this.end) * unit;
                }else{
                    c = this.start - (this.start + MPI2-this.end) * unit;
                }
            }else{
                if(this.end < this.start){
                    c = (this.end + MPI2-this.start) * unit + this.start;
                }else{
                    c = (this.end-this.start) * unit + this.start;
                }
            }
            if(vec === undefined){
                return new Vec(this.circle.center.x + Math.cos(c) * this.circle.radius,this.circle.center.y + Math.sin(c) * this.circle.radius);
            }
            vec.x = this.circle.center.x + Math.cos(c) * this.circle.radius;
            vec.y = this.circle.center.y + Math.sin(c) * this.circle.radius;
            return vec
        },
        unitDistOfClosestPoint(vec) { // returns the unit distance on the perimeter for the point closest to ve
            this.normalise();
            u = direction(vec.x - this.circle.center.x, vec.y - this.circle.center.y);
            u = (u - this.start) / (this.end - this.start);
            return u;
        },
        tangentAtStart(retLine){  // returns a line of the tangent at the start of the arc
            retLine = this.circle.tangentAtAngle(this.start,retLine);
            if(this.direction){
                return retLine.reverse();
            }
            return retLine
        },
        tangentAtEnd(retLine){ // returns a line that starts at the end of this arc along the tangent at end
            retLine = this.circle.tangentAtAngle(this.end,retLine);
            if(this.direction){
                return retLine.reverse();
            }
            return retLine
        },
        startFromVec(vec){ // sets the start as the angle from this arcs center to the point described by vec
            this.start = Math.atan2(vec.y - this.circle.center.y,vec.x - this.circle.center.x);
            return this;
        },
        endFromVec(vec){ // sets the start as the angle from this arcs center to the point described by  vec
            this.end = Math.atan2(vec.y - this.circle.center.y,vec.x - this.circle.center.x);
            return this;
        },
        endsFromVecs(vec1, vec2){ // sets the start and end angle to be on the line from the center to the two vecs vec1,vec2
            this.startFromVec(vec1).endFromVec(vec2);
            return this;
        },
        isAngleToPointBetween(point){ // if the angle from arc center to point is between the start and end angles or the arc
			a = (Math.atan2(point.y - this.circle.center.y, point.x - this.circle.center.x) + MPI2) % MPI2;
			b = ((this.start % MPI2) + MPI2 ) % MPI2;
			c = ((this.end % MPI2) + MPI2 ) % MPI2;
			if(b > c) { c += MPI2 }
			if(b > a) { a += MPI2 }
			if(this.direction){ return !(a >= b && a <= c) }
			return a >= b && a <= c;
		},
		interceptLineSeg(line,retV1,retV2){ // returns 0,1 or 2 intercept points of line seg and this. Points are empty if no intercept
			this.circle.interceptLineSeg(line,l1);
			retV1.x = retV2.x = retV1.y = retV2.y = undefined;
			if(!l1.p1.isEmpty() && this.isAngleToPointBetween(l1.p1)){
				retV1.x = l1.p1.x;
				retV1.y = l1.p1.y;
			}
			if(!l1.p2.isEmpty() && this.isAngleToPointBetween(l1.p2)){
				retV2.x = l1.p2.x;
				retV2.y = l1.p2.y;
			}
			return retV1;

		},
		sweapLeng(){
            a = ((this.start % MPI2) + MPI2) % MPI2;
            e = ((this.end % MPI2) + MPI2) % MPI2;
            if(a > e){
                a -= MPI2;
            }
            return Math.abs(e - a) * this.circle.radius;
        },
        setCircumference(leng){
            this.end = this.start  + (leng / (this.circle.radius ));
            return this; // returns this.
        },
        cordLeng(){
            return Math.hypot(
                (this.circle.center.x + Math.cos(this.start) * this.circle.radius) - (this.circle.center.x + Math.cos(this.end) * this.circle.radius),
                (this.circle.center.y + Math.sin(this.start) * this.circle.radius) - (this.circle.center.y + Math.sin(this.end) * this.circle.radius)
            );
        },
        cordAsLine(retLine){
            if(retLine === undefined){
                if(this.start === this.end){
                    return new Empty();
                }
                return new Line(
                    new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius),
                    new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius)
                );
            }
            if(this.start === this.end){
                return retLine.empty();
            }
            retLine.p1.x = this.circle.center.x + Math.cos(this.start) * this.circle.radius;
            retLine.p1.y = this.circle.center.y + Math.sin(this.start) * this.circle.radius;
            retLine.p2.x = this.circle.center.x + Math.cos(this.end) * this.circle.radius;
            retLine.p2.y = this.circle.center.y + Math.sin(this.end) * this.circle.radius;
            return retLine;

        },
        clockwise(){
            this.direction = false;
            return this;
        },
        anticlockwise(){
            this.direction = true;
            return this;
        },
        great(){
            b = ((this.start % MPI2) + MPI2) % MPI2;
            e = ((this.end % MPI2) + MPI2) % MPI2;
            if(b > e){
                if(b - e  < MPI){
                    this.start = b;
                    this.end = e;
                }else{
                    this.start = e;
                    this.end = b;
                }
            }else{
                if(e - b  < MPI){
                    this.start = e;
                    this.end = b;
                }else{
                    this.start = b;
                    this.end = e;
                }
            }
            return this; // returns this.
        },
        minor(){
            this.great();
            a = this.start;
            this.start = this.end;
            this.end = a;
            return this; // returns this.
        },
        isPointOn(p){
            a = this.circle.angleOfPoint(p1);
            if(a >= this.start && a <= this.end) { return true }
            return false;
        },
        fromTangentsToPoint(vec){
            var tp = this.circle.tangentsPointsForPoint(vec);
            if(tp.vecs.length === 0) { return this }
            this.fromPoints(tp.vecs[0],tp.vecs[1]);
            return this;    // returns this.
        },
		fitCircleToLine(arcCircle,line,left = true, outside = true){  // {arcCircle} is moved to fit the corner made by the intercept of the {line} and this circle if possible. if left === true then circle is fitted to the left else to the right. {outside} if true then circle is fitted outside this circle else it is inside if it can fit. (if no fit can be found then an empty circle or arc is set
			var circle = arcCircle.circle ? arcCircle.circle : arcCircle;
			a = line.distFromPointDir(this.circle.center); // Uses registers from this call v1 is line as vec, v3 is point on line closest to circle center line._leng is length of line
			v1.x /= line._leng;
			v1.y /= line._leng;
			if(outside){
				b = this.circle.radius + circle.radius;
				if(left){
					c = circle.radius - a;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x - circle.radius * v1.y;
					circle.center.y = v3.y + circle.radius * v1.x;
					this.start =  ((Math.atan2(circle.center.y-this.circle.center.y,circle.center.x-this.circle.center.x) % MPI2) + MPI2) % MPI2;
					if(arcCircle.circle){
						arcCircle.end = ((Math.atan2(-v1.x,v1.y) % MPI2) + MPI2) % MPI2;
						arcCircle.start = (((this.start  + Math.PI) % MPI2) + MPI2) % MPI2;
					}
				}else{
					c = circle.radius + a;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x + circle.radius * v1.y;
					circle.center.y = v3.y - circle.radius * v1.x;
					this.end = ((Math.atan2(circle.center.y-this.circle.center.y,circle.center.x-this.circle.center.x) % MPI2) + MPI2) % MPI2;
					if(arcCircle.circle){
						arcCircle.start = ((Math.atan2(v1.x,-v1.y) % MPI2) + MPI2) % MPI2;
						arcCircle.end = (((this.end  + Math.PI) % MPI2) + MPI2) % MPI2;
					}
				}
			} else {
				b = this.circle.radius - circle.radius;
				if(left){
					c = a - circle.radius;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x - circle.radius * v1.y;
					circle.center.y = v3.y + circle.radius * v1.x;
					this.start =  ((Math.atan2(circle.center.y-this.circle.center.y,circle.center.x-this.circle.center.x) % MPI2) + MPI2) % MPI2;
					if(arcCircle.circle){
						arcCircle.start = ((Math.atan2(-v1.x,v1.y) % MPI2) + MPI2) % MPI2;
						arcCircle.end = ((this.start % MPI2) + MPI2) % MPI2;
					}
				}else{
					c = a + circle.radius;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x + circle.radius * v1.y;
					circle.center.y = v3.y - circle.radius * v1.x;
					this.end = ((Math.atan2(circle.center.y-this.circle.center.y,circle.center.x-this.circle.center.x) % MPI2) + MPI2) % MPI2;
					if(arcCircle.circle){
						arcCircle.end = ((Math.atan2(v1.x,-v1.y) % MPI2) + MPI2) % MPI2;
						arcCircle.start = ((this.end % MPI2) + MPI2) % MPI2;
					}
				}
			}
			return this;
		},
		fitCircleToCircles(arcCircle1,arcCircle2, left = true){ // circle1 is inside this circle. Fit circle 2 so to touch both at the tangents. If left is true then circle2 is placed left of the line from this circle to circle1. else to the right
			var circle1 = arcCircle1.circle ? arcCircle1.circle : arcCircle1;
			var circle2 = arcCircle2.circle ? arcCircle2.circle : arcCircle2;
			v1.x = circle1.center.x - this.circle.center.x;
			v1.y = circle1.center.y - this.circle.center.y;
			a = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
			b = this.circle.radius - circle2.radius;
			c = circle1.radius + circle2.radius;
			c1 = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
			d = Math.atan2(v1.y,v1.x); // angle to circle1
			d += left ? c1 : -c1; // move to direction of circle2
			circle2.center.x = this.circle.center.x + Math.cos(d) * b;
			circle2.center.y = this.circle.center.y + Math.sin(d) * b;
			v2.x = circle1.center.x - circle2.center.x;
			v2.y = circle1.center.y - circle2.center.y;
			if(left){
				this.start = ((d % MPI2) + MPI2) % MPI2;
				if(arcCircle2.circle){
					arcCircle2.end = this.start;
					arcCircle2.start = d1 = ((Math.atan2(v2.y,v2.x) % MPI2) + MPI2) % MPI2;
				}else{
					d1 = ((Math.atan2(v2.y,v2.x) % MPI2) + MPI2) % MPI2;
				}
				if(arcCircle1.circle){
					arcCircle1.end = (d1 + MPI)% MPI2;
				}
			}else{
				this.end = ((d % MPI2) + MPI2) % MPI2;
				if(arcCircle2.circle){
					arcCircle2.start = this.end;
					arcCircle2.end = d1 = ((Math.atan2(v2.y,v2.x) % MPI2) + MPI2) % MPI2;
				}else{
					d1 = ((Math.atan2(v2.y,v2.x) % MPI2) + MPI2) % MPI2;
				}
				if(arcCircle1.circle){
					arcCircle1.start = (d1 + MPI)% MPI2;
				}
			}

			return this;

		},
		getTangentsToCircle(arcCircle,retLineR,retLineL){ // Sets the lines and end points to the tangent joining the two circles that make the arcs
			var circle = arcCircle.circle ? arcCircle.circle : arcCircle;
			v1.x = circle.center.x - this.circle.center.x;
			v1.y = circle.center.y - this.circle.center.y;
			u = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
			if(u < Math.max(circle.radius,this.circle.radius) - Math.min(circle.radius,this.circle.radius)){
				return this;
			}
			u1 = this.circle.radius - circle.radius;
			a = Math.asin(u1/u);
			a1 = Math.atan2(v1.y,v1.x); // direction to circle
			b = a1-(Math.PI / 2) + a;  // direction to tangent point left
			c = a1+(Math.PI / 2) - a;  // direction to tangent point right
            b = ((b % MPI2) + MPI2) % MPI2;
            c = ((c % MPI2) + MPI2) % MPI2;
			if(retLineR){
				v2.x = Math.cos(c);
				v2.y = Math.sin(c);
				retLineR.p1.x = this.circle.center.x + v2.x * this.circle.radius;
				retLineR.p1.y = this.circle.center.y + v2.y * this.circle.radius;
				retLineR.p2.x = circle.center.x + v2.x * circle.radius;
				retLineR.p2.y = circle.center.y + v2.y * circle.radius;
				this.start = c;
				if(arcCircle.end) { arcCircle.end = c }
			}
			if(retLineL){
				v3.x = Math.cos(b);
				v3.y = Math.sin(b);
				retLineL.p1.x = circle.center.x + v3.x * circle.radius;
				retLineL.p1.y = circle.center.y + v3.y * circle.radius;
				retLineL.p2.x = this.circle.center.x + v3.x * this.circle.radius;
				retLineL.p2.y = this.circle.center.y + v3.y * this.circle.radius;
				this.end = b;
				if(arcCircle.start) { arcCircle.start = b }
			}
			return this;

		},
        fitCornerConstrain(line1,line2,cornerUnknown,constraint,data){ // set Circle.fitCornerConstrain for full details as this function calls that function
            this.circle.fitCornerConstrain(line1,line2,cornerUnknown,constraint,data);
            if(this.circle.center.x !== Infinity){ // if the solution is found
                v4.x = v3.x + v1.x * c1; // contact point on line1
                v4.y = v3.y + v1.y * c1;
                v5.x = v3.x + v2.x * c1; // contact point on line2
                v5.y = v3.y + v2.y * c1;
                if(b < 0){  // swap start and end depending corner is left inside or right inside
                    this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                    this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                    this.direction = true; // make this anti-clockwise
                    //this.swap(true).swap();
                }else{
                    this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                    this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                    this.direction = false; // make this clockwise
                }

            }
            return this;
        },
        fitCorner(line1,line2,cornerUnknown){ // set Circle.fitCorner for full details as this function calls that function
            // This uses Geom.registers v1,v2,v3,v4,v5,a,b,c1,c
            // v1,v2,v3 if cornerUnknown is true may be invalid if return circle is empty, all other cases they will be valid
            // v1 is the vector of line1 in the directio away from the corner
            // v2 is the vector of line2 in the directio away from the corner
            // v3 is the corner location
            // v4 and v5 are set only if the is a valid solution is found for this.circle.fitCorner
            // v4 is contact point on line1;
            // v5 is contact point on line2;
            // if result is not empty or cornerUnknow is undefined or false then a,b,c,c1 will be valid
            // a distance along the normal from line2 to center of circle (can be + or -)
            // b the cross product of the outgoing and incoming lines
            // c half the the angle in radians between the incoming and out going lines
            // c1 distance from the corner point v3 along the vectors V1,v2 to the tangent points
            this.circle.fitCorner(line1,line2,cornerUnknown);
            if(this.circle.center.x !== Infinity){ // if the solution is found
                v4.x = v3.x + v1.x * c1; // contact point on line1
                v4.y = v3.y + v1.y * c1;
                v5.x = v3.x + v2.x * c1; // contact point on line2
                v5.y = v3.y + v2.y * c1;
                this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                this.direction = b < 0 ? true : false;
            }
            return this; // returns this.
        },
        scale(scale){
            this.circle.radius * scale;
            return this; // returns this
        },
        translate(vec){
            this.circle.center.translate(vec);
            return this; // returns this
        },
        rotate(rotation){
            this.start += rotation;
            this.end += rotation;
            return this; // returns this
        },
        transform(transform){ // this is just a stub for now and does not transfor the arc
            return this; // returns this
        },
    }
    Circle.prototype = {
        center : undefined,
        radius : 0,
        type : "Circle",
        copy(){
            return new Circle(this.center.copy(),this.radius)
        },
        setAs(circle){  // Sets this circle to the argument {circle}.
                                    // Return `this`
            this.center.setAs(circle.center);
            this.radius = circle.radius;
            return this;
        },
        asVecArray(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.center);
                return vecArray;
            }
            vecArray.push(this.center.copy());
            return vecArray;
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.center.id === id){
                return true;
            }
            return false;
        },
        asBox(box){     // Returns the bounding box
                                   // {abox} is option
                                   // Returns `Box`
            if(box === undefined){
                var box = new Box();
            }
            box.env (this.center.x - this.radius,this.center.y - this.radius);
            box.env (this.center.x + this.radius,this.center.y + this.radius);
            return box;
        },
        toString(precision){
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            var id = this.id === undefined ? "": "'"+this.id+"' ";
            if(this.isEmpty()){
                return "Circle: '"+l+"' id : "+id+" ( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            return "Circle: '"+l+"' id : "+id+" Center ("+this.center.toString(precision)+") Radius "+this.radius.toFixed(precision);
        },
        asSimple(obj){ // returns a object or adds to obj the current state of this primitive. The obj will not contain the prototype chain of this primitive
            if(obj === undefined){
                obj = {};
            }
            obj.x = this.center.x;
            obj.y = this.center.y;
            obj.radius = this.circle.center.radius;
            return obj;
        },
        fromSimple(obj){
            this.center.x = obj.x === undefined ? 0 : obj.x;
            this.center.y = obj.y === undefined ? 0 : obj.y;
            this.radius = obj.radius === undefined ? 1 : obj.radius;
            return this;
        },
        getHash(){ // returns a unquie hash value for the lines current state
            var hash = 0;
            if(!isNaN(this.id)){
                hash += this.id;
            }
            hash += this.center.getHash() + this.radius;
            return Math.round(hash  % 0xFFFFFFFF);
        },
        replace(id, prim){  // replaces vec with id == id with the supplied vec
            if(id !== undefined){
                if(prim !== undefined){
                    if(prim.type === "Vec"){
                        if(this.center.id === id){
                            this.center = prim;
                        }
                    }
                }
            }
            return this;
        },
        asTriangles(sides,array){
            sides = sides === undefined || sides === null ? 8 : Math.max(4,Math.floor(sides));
            var steps = MPI2/sides;
            var i,cx,cy,x,y,xx,yy,c,a;
            x = (cx = this.center.x) + this.radius;
            y = cy = this.center.y;
            if(array === undefined){
                array = [];
            }
            c = 0;
            for(i = steps; i < MPI2 + steps/2; i += steps,c++){
                xx = cx + Math.cos(i) * this.radius;
                yy = cy + Math.sin(i) * this.radius;
                a = array[c];
                if(a === undefined){
                    array[c] = new Triangle(new Vec(cx,cy),new Vec(x,y),new Vec(xx,yy));
                }else{
                    a.p1.x = cx;
                    a.p1.y = cy;
                    a.p2.x = x;
                    a.p2.y = y;
                    a.p3.x = xx;
                    a.p3.y = yy;
                }
                x = xx;
                y = yy;
            }
            return array;
        },
        lerp(from, dest, amount){
            this.center.x = (dest.center.x - from.center.x) * amount + from.center.x;
            this.center.y = (dest.center.y - from.center.y) * amount + from.center.y;
            this.radius = (dest.radius - from.radius) * amount + from.radius;
            return this;
        },
        isEmpty(){  // returns true for empty circle
            if( this.center.x === Infinity || // many cases see a divid by zero the result will have both x and y as Infinity. This assumes this empty circle is more common than a radius === infinity. It also alows better performance and conveniance by having the function Circle.empty set this.center.x to infinity rather than radius which many times is requiered to be preserved despite the circle center being unknown
                    this.radius === 0 ||
                    this.radius === Infinity ||
                    this.radius === -Infinity ||
                    isNaN(this.radius) ||
                    this.center === undefined ||
                    this.center.isEmpty()){
                return true;
            }
            return false;
        },
        empty(){
            this.center.x = Infinity;
            return this;
        },
        setRadius(r){
            this.radius = r;
            return this;
        },
        addToRadius( number ){
            this.radius += number;
            return this; // returns this.
        },
        multiplyRadius( number ){
            this.radius *= number;
            return this; // returns this.
        },
        circumference(){
            return this.radius * Math.PI * 2;
        },
        area(){
            return this.radius * this.radius * Math.PI * 2;
        },
        fromLine(line){
            this.fromVec2(line.p1,line.p2);
            return this
        },
        fromVec2(vec1, vec2, method){
            if(method === "radius"){
                this.center.x = vec1.x;
                this.center.y = vec1.y;
                this.radius = Math.hypot(vec1.x - vec2.x,vec1.y - vec2.y);
                return this;
            }
            this.center.x = (vec1.x + vec2.x) / 2;
            this.center.y = (vec1.y + vec2.y) / 2;
            this.radius = Math.hypot(vec1.x - vec2.x,vec1.y - vec2.y)/2;
            return this;
        },
        fromVec3(vec1, vec2, vec3){ // positions and sets radius to fit all 3 points if possible. If not returns empty circle
            // This function uses Geom registers v1,c,c1u
            // v1 is the center of the circle if not empty
            // Code Notes
            // Other functions rely on v1 being the circle center if return is not empty

            c = (vec2.x - vec1.x) / (vec1.y - vec2.y); // slope of vector from vec 1 to vec 2
            c1 = (vec3.x - vec2.x) / (vec2.y - vec3.y); // slope of vector from vec 2 to vec 3
            if (c === c1)  { // Both are vector  so if slope is the same they must be on the same line
                return this.empty();  // points are in a line
            }
            // locate the center
            if(vec1.y === vec2.y){   // special case with vec1 and 2 have same y
                v1.x = ((vec1.x + vec2.x) / 2);
                v1.y = c1 * v1.x + (((vec2.y + vec3.y) / 2) - c1 * ((vec2.x + vec3.x) / 2));
            }else
            if(vec2.y === vec3.y){ // special case with vec2 and 3 have same y
                v1.x = ((vec2.x + vec3.x) / 2);
                v1.y = c * v1.x + (((vec1.y + vec2.y) / 2) - c * ((vec1.x + vec2.x) / 2));
            } else{
                v1.x = ((((vec2.y + vec3.y) / 2) - c1 * ((vec2.x + vec3.x) / 2)) - (u = ((vec1.y + vec2.y) / 2) - c * ((vec1.x + vec2.x) / 2))) / (c - c1);
                v1.y = c * v1.x + u;
            }
            this.radius = Math.hypot(vec1.x - (this.center.x = v1.x), vec1.y - (this.center.y = v1.y));
            return this;
        },
        fromArea(area){
            this.radius = Math.sqrt(area / (Math.PI * 2));
        },
        fromTriangle(triangle){// positions and sets radius to fit all 3 points of the triangle if possible. If not returns empty circle
            return this.fromVec3(triangle.p1,triangle.p2,triangle.p3);
        },
        fromCircumference (leng){
            this.radius = leng / (Math.PI * 2);
        },
        isTouching(circle){ // returns true if this circle is in contact with circle false if not
            if(this.center.copy().sub(circle.center).leng() > this.radius + circle.radius){
                return false;
            }
            return true;
        },
        isTouchingLine(line){ // returns true is this circle is in contact with the line false if not
            if(line.distFrom(this.center) > this.radius){
                return false
            }
            return true;
        },
        isLineTouching(line){ // returns true is this circle is in contact with the line false if not
            if(line.distFrom(this.center) > this.radius){
                return false
            }
            return true;
        },
        isRectangleInside(rectangle){ // return true if rectangle is inside the circle false if not
            // This function uses V1 and v2
            // Only if this function can v1 and v2 be considered valid
            // v1 is the bottom lefy corner of the rectangle only if true returned
            // v2 is the bottom right corner of the rectangle only if true returned
            // Note though it is posible for v2 to hold the correct value it can not be termined from this function alone,
            // but v2 will be writen to thus looking for a change can be used at your own risk
            if(Math.hypot(rectangle.top.p1.x - this.center.x, rectangle.top.p1.y - this.center.y) < this.radius &&
                    Math.hypot(rectangle.top.p2.x - this.center.x, rectangle.top.p2.y - this.center.y) < this.radius){
                 v1.x = rectangle.top.p2.x - (v2.x = rectangle.top.p1.x);
                 v1.y = rectangle.top.p2.y - (v2.y = rectangle.top.p1.y);
                 v2.x += -v1.y * rectangle.aspect;
                 v2.y += v1.x * rectangle.aspect;
                 if(Math.hypot(v2.x - this.center.x, v2.y - this.center.y) < this.radius &&
                        Math.hypot((v1.x += v2.x) - this.center.x,(v1.y += v2.y) - this.center.y) < this.radius){
                       return true;
                 }
            }
            return false;
        },
        isCircleInside(circle){ // returns true is circle is inside this circle
            return (Math.hypot(this.center.x - circle.center.x,this.center.y - circle.center.y)-this.radius + circle.radius < 0);
        },
        isLineInside(line){ // returns true is the line segment line is inside the circle
            // using the ? is a little quicker then returning the contional result as ? will return if the first point fails while the conditional method always does both tests
            return (
                Math.hypot(this.center.x - line.p1.x,this.center.y - line.p1.y) < this.radius &&
                Math.hypot(this.center.x - line.p2.x,this.center.y - line.p2.y) < this.radius ) ? true : false;

        },
        isVecInside(vec){
            return  Math.hypot(this.center.x - vec.x,this.center.y - vec.y) < this.radius;
        },
        isPointInside(vec){
            return  Math.hypot(this.center.x - vec.x,this.center.y - vec.y) < this.radius;
        },
        unitAlong( unitDist , rVec){ // returns a Vec unitDist around the circle. 1 unit is 360 starting from 0 deg
            var c = MPI2 * unitDist;
            if(rVec === undefined){
                return new Vec(
                    this.center.x +  Math.cos(c) * this.radius,
                    this.center.y +  Math.sin(c) * this.radius
                );
            }
            rVec.x = this.center.x +  Math.cos(c) * this.radius;
            rVec.y = this.center.y +  Math.sin(c) * this.radius;
            return rVec;
        },
        unitDistOfClosestPoint(vec) { // returns the unit distance on the perimeter for the point closest to ve
            return direction(vec.x - this.center.x, vec.y - this.center.y) / MPI2;
        },
        distFrom(vec){ // returns the distance from the circle circumference to the point vec
            return  Math.abs(Math.hypot(this.center.x - vec.x,this.center.y - vec.y) - this.radius);
        },
        fitToCircles(circle1, circle2, rule){ // fits this circle so that it touches circle1 and circle2 using the rules in rule
            // rule = "left"  will fit this circle to the left of the line from circle1 to circle 2
            // rule = "limit" will limit the circle to not cross the line between circle1 and circle 2
            // rule = "grow" if included will grow the radius of to fit if needed
            if(rule === undefined){
                rule = "";
            }else{
                rule = rule.toLowerCase();
            }
            v1.x = circle2.center.x - circle1.center.x;
            v1.y = circle2.center.y - circle1.center.y;
            a = Math.hypot(v1.x,v1.y);  // get the length of the lines between all three
            b = circle1.radius + this.radius;  // must touch so add radiuss
            c = circle2.radius + this.radius;
            if(rule.indexOf("limit") > -1){
                // need to find a solution that limits te circle to the left or Right of the center line
                var B = circle2.radius
                var A = circle1.radius
                var C = a;
                // Need to find radius of this circle. but first where on the line between cir1 and cir2 the circle touches
                // u1 + u2 = C  where C is the length of the line between circles u1 is from fisrt u2 for second to the point where this circle will touch
                // r = (u1 * u1 - A * A) / (2 * A) first cir
                // r = (u2 * u2 - B * B) / (2 * B) second cir
                // r = ((u1 * u1) - (A * A)) / (2 * A) = ((u2 * u2) - (B * B))/ (2 * B)
                // Two unknowns u1 and u2 so in terms of u2 = C - u1 to give one unknown thus solve the following
                // I know u2 = C - u1 to give one unknown thus solve the following
                // 0 = ((u1 * u1) - (A * A)) / (2 * A) - ((C - u1) * (C - u1)) - (B * B)) / (2 * B)
                // Is quadratic so use quadratic rule to solve positive solution only and get radius using first circle
                var r = (Math.pow( (-((2 * C * A) / B) + Math.sqrt(((2 * C * A) / B) * ((2 * C * A) / B) - (4 - 4 * A / B) * -(- B * A + A * A + (C * C * A) / B))) / -(2 -  2 * A / B), 2) - A * A) / (2 * A);
                this.radius = r;
                b = circle1.radius + r;
                c = circle2.radius + r;

            }else
            if(a > b + c){ // gap is too large can not fit
                if(rule.indexOf("grow") > -1){
                    this.radius += u = (a - (b+c))/2;
                    b += u;
                    c += u;
                }else{
                    this.empty();
                    return this;
                }
            }
            u = Math.sin(u1 = triPh(a,b,c));
            // u1 is dist from c1 to point on line then out from there at norm  u to line to find center
            v2.x = v1.x / a; // normalise line between
            v2.y = v1.y / a;
            u1 = Math.cos(u1);
            v3.x = v2.x * b * u1;
            v3.y = v2.y * b * u1;
            if(rule.indexOf("left") > -1){
                v3.y -= v2.x * b * u;
                v3.x += v2.y * b * u;
            }else{
                v3.y += v2.x * b * u;
                v3.x -= v2.y * b * u;
            }
            this.center.x = circle1.center.x + v3.x;
            this.center.y = circle1.center.y + v3.y;
            return this;
        },
        closestPoint(vec,retVec){  // legacy calls closestPointToVec
            return this.closestPointToVec(vec,retVec);
        },
        closestPointToLine(line,retVec){ // only valid if the line is not touching the circle
            return this.closestPointToVec(line.closestPoint(this.center,va),retVec);
        },
        closestPointToVec(vec,retVec){ // returns the closest point on the circle to the point vec
            v1.x = vec.x - this.center.x;
            v1.y = vec.y - this.center.y;
            var u = this.radius / Math.hypot(v1.x,v1.y);
            if(retVec === undefined){
                retVec = new Vec();
            }
            retVec.x = this.center.x + (v1.x *= u);
            retVec.y = this.center.y + (v1.y *= u);
            return  retVec;
        },
        clipLine(line,retLine){ // returns a new line that is clipped to inside the circle.
            // returns a line. If retLine is given then that line is set with the result and returned. If retLine is not given then a new Line is created.
            // If no intercepts are found then an empty line is returned. Use Line.isEmpty to determin if a line is empty
            // If one or more intercepts are found then the line is returned in the same direction as the input line.
            // The returned line may have zero length

            // this function uses v1, v2, v3, v4
            // v1 is the line as a vector
            // v2 is the vector from the line start to the circle center
            // v3.x is the unit distance from the line start to the first intercept point
            // v3.y is this unit distance from the line start to the second intercept point
            // v3 Both x, and y  may === Infinity or both !== Infinity
            // v4.x distance squared from circle center of line start
            // v4.y distance from circle center of line end

            if(retLine === undefined){
                retLine = line.copy();
            }
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            v2.x = line.p1.x - this.center.x;
            v2.y = line.p1.y - this.center.y;
            v4.y = Math.hypot(line.p2.x - this.center.x, line.p2.y - this.center.y);
            v4.x = v2.x * v2.x + v2.y * v2.y;
            if(Math.sqrt(v4.x) < this.radius){
                retLine.p1.x = line.p1.x;
                retLine.p1.y = line.p1.y;
                if(v4.y < this.radius){
                    retLine.p2.x = line.p2.x;
                    retLine.p2.y = line.p2.y;
                    return retLine;
                }else{
                    retLine.p2.empty();
                }
            }else{
                retLine.p1.empty();
                if(v4.y < this.radius){
                    retLine.p2.x = line.p2.x;
                    retLine.p2.y = line.p2.y;
                }else{
                    retLine.p2.empty();
                }
            }


            c = 2 * (v1.x * v1.x + v1.y * v1.y);
            var b = -2 * (v1.x * v2.x + v1.y * v2.y);
            var d = Math.sqrt(b * b - 2 * c * (v4.x  - this.radius * this.radius));
            if(isNaN(d)){ // no intercept
                v3.x = v3.y = Infinity;
            }else{
                v3.x = (b - d) / c;
                v3.y = (b + d) / c;
                // Add second point first incase the line being set is the same line pased as first argument
                if(v3.y <= 1 && v3.y >= 0){
                    retLine.p2.x = line.p1.x + v1.x * v3.y;
                    retLine.p2.y = line.p1.y + v1.y * v3.y;
                }
                if(v3.x <= 1 && v3.x >= 0){
                    retLine.p1.x = line.p1.x + v1.x * v3.x;
                    retLine.p1.y = line.p1.y + v1.y * v3.x;
                }
                return retLine;
            }
            return retLine.empty();


        },
        interceptLineSeg(line, retLine){ // Finds if they exist the intercepts of a line segment and this circle
            // returns a line. If retLine is given then that line is set with the result and returned. If retLine is not given then a new Line is created.
            // If no intercepts are found then an empty line is returned. Use Line.isEmpty to determine if a line is empty
            // If one or more intercepts are found then the line is returned in the same direction as the input line.
            // The returned line may have zero length

            // this function uses v1, v2, v3
            // v1 is the line as a vector
            // v2 is the vector from the line start to the circle center
            // v3.x is the unit distance from the line start to the first intercept point
            // v3.y is this unit distance from the line start to the second intercept point
            // v3 Both x, and y  may === Infinity or both !== Infinity

            if(retLine === undefined){
                retLine = line.copy();
            }
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            v2.x = line.p1.x - this.center.x;
            v2.y = line.p1.y - this.center.y;
            var b = (v1.x * v2.x + v1.y * v2.y);


            c = 2 * (v1.x * v1.x + v1.y * v1.y);
            b *= -2;
            var d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - this.radius * this.radius));
            if(isNaN(d)){ // no intercept
                v3.x = v3.y = Infinity;
            }else{
                v3.x = (b - d) / c;
                v3.y = (b + d) / c;
                // Add second point first incase the line being set is the same line passed as first argument
                if(v3.y <= 1 && v3.y >= 0){
                    retLine.p2.x = line.p1.x + v1.x * v3.y;
                    retLine.p2.y = line.p1.y + v1.y * v3.y;
                }else{
                    retLine.p2.x = retLine.p2.y = undefined;
                }
                if(v3.x <= 1 && v3.x >= 0){
                    retLine.p1.x = line.p1.x + v1.x * v3.x;
                    retLine.p1.y = line.p1.y + v1.y * v3.x;
                }else{
                    retLine.p1.x = retLine.p1.y = undefined;
                }
                return retLine;
            }
            return retLine.empty();
        },
        interceptLine(line, retLine){// find the points if any where this circle intercepts the line
            // returns a line. If retLine is given then that line is set with the result and returned. If retLine is not given then a new Line is created.
            // If no intercepts are found then an empty line is returned. Use Line.isEmpty to determin if a line is empty
            // If intercepts are found then the line is returned in the same direction as the input line.
            // The returned line may have zero length

            // This function uses v1,v2,v3,v4;  NOTE that this function differs from interceptLineSeg
            // v1 will hold the vector from the center the cord between the intercepts to the furthest intercept or if no intercept see line.distFrom for value of v2
            // v2 will hold the center of the cord between the intercepts or if no intercept see line.distFrom for value of v2
            // v3 Unchanged from line.distFrom(this.center) see that function for details
            // v4.x is the distance from the center to the line
            if(retLine === undefined){
                retLine = line.copy();
            }

            var d;
            v4.x =  line.distFrom(this.center); // dist from line
            if(v4.x <= this.radius){
                v2.x = v3.x + line.p1.x; // v3 is from function line.distFrom
                v2.y = v3.y + line.p1.y;
                var d = Math.sqrt(this.radius*this.radius- v4.x * v4.x) / line._leng;
                v1.x *= d;
                v1.y *= d;

                retLine.p1.x = v2.x - v1.x;
                retLine.p1.y = v2.y - v1.y;
                retLine.p2.x = v2.x + v1.x;
                retLine.p2.y = v2.y + v1.y;
                return retLine;
            }
            return retLine.empty();
        },
        interceptLineSelect(line,which,limit, retVec){// find a point if any where the line intercepts the circle. which indicates which point, limit tells what to do when intercept is outside the line seg
            // which === 0 [defualt] means the closest point from the start (for limit 0,1) and end (for limit -1)
            // which === 1 means the furerest point from the line start  (for limit 0,1) and end (for limit -1)
            // limit === 0 [defualt] means only points on the line segment
            // limit === 1 means only points infront of and including start
            // limit === -1 means only points behind of and including end


            // This function uses v1,v2;
            // v1 is the line as a vector
            // v2 is the vector from the line start to the circle center


            if(retVec === undefined){
                retVec = new Vec();
            }

            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            v2.x = line.p1.x - this.center.x;
            v2.y = line.p1.y - this.center.y;
            var b = (v1.x * v2.x + v1.y * v2.y);


            c = 2 * (v1.x * v1.x + v1.y * v1.y);
            b *= -2;
            var d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - this.radius * this.radius));
            if(isNaN(d)){ // no intercept
                v3.x = v3.y = Infinity;
            }else{
                u = (b - d) / c;
                u1 = (b + d) / c;
                // Add second point first incase the line being set is the same line pased as first argument
                if(which === 0 || which === undefined){
                    if(limit === 0 || limit === undefined){
                        if(u >= 0 && u1 >= 0 && u<= 1 && u1 <= 1){
                            c = Math.min(u,u1);
                        }else
                        if(u >= 0 && u<= 1){
                            c = u;
                        }else
                        if(u1 >= 0 && u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                    }else
                    if(limit === 1){
                        if( u >= 0 && u1 >= 0){
                            c = Math.min(u,u1);
                        }else
                        if( u >= 0 ){
                            c = u;
                        }else
                        if( u1 >= 0){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                     }else{
                        if( u <= 1 && u1 <= 1){
                            c = Math.max(u,u1);
                        }else
                        if( u <= 1 ){
                            c = u;
                        }else
                        if( u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                     }
                }else{
                    if(limit === 0 || limit === undefined){
                        if(u >= 0 && u1 >= 0 && u<= 1 && u1 <= 1){
                            c = Math.max(u,u1);
                        }else
                        if(u >= 0 && u<= 1){
                            c = u;
                        }else
                        if(u1 >= 0 && u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                    }else
                    if(limit === 1){
                        if( u >= 0 && u1 >= 0){
                            c = Math.max(u,u1);
                        }else
                        if( u >= 0 ){
                            c = u;
                        }else
                        if( u1 >= 0){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                     }else{
                        if( u <= 1 && u1 <= 1){
                            c = Math.min(u,u1);
                        }else
                        if( u <= 1 ){
                            c = u;
                        }else
                        if( u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                     }
                }
                retVec.x = line.p1.x + v1.x * c;
                retVec.y = line.p1.y + v1.y * c;
                return retVec;
            }
            return retVec.empty();
        },
        intercept(circle){ // find the points if any where this circle and circle intercept
            var va = new VecArray();
            var l = circle.center.copy().sub(this.center);
            var d = l.leng();
            if(d > this.radius + circle.radius || d < Math.abs(this.radius - circle.radius)){
                return va;
            }

            var x = (d * d - this.radius * this.radius + circle.radius * circle.radius) / ( 2 * d);
            var a = Math.sqrt(circle.radius*circle.radius - x * x);
            l.setLeng(x);

            var mid = circle.center.copy().sub(l);
            l.r90().setLeng(a);
            va.push(mid.copy().add(l))
            va.push(mid.sub(l));

            return va
        },
        tangentLineAtVec(vec,retLine ){
            this.closestPointToVec(vec, va);
            if(retLine === undefined){
                return new Line(va.copy(),new Vec(va.x - v1.y, va.y + v1.x));
            }
            retLine.p1.x = va.x;
            retLine.p1.y = va.y;
            retLine.p2.x = va.x - v1.y;
            retLine.p2.y = va.y + v1.x;
            return retLine;
        },
        tangentAtAngle(angle,retLine){
            c = this.start;
            if(retLine === undefined){
                retLine = new Line();
            }
            retLine.p1.x = this.center.x + Math.cos(angle) * this.radius;
            retLine.p1.y = this.center.y + Math.sin(angle) * this.radius;
            retLine.p2.x = retLine.p1.x - Math.sin(angle) * this.radius;
            retLine.p2.y = retLine.p1.y + Math.cos(angle) * this.radius;
            return retLine;
        },
        angleOfPoint(p){
			v1.x = p.x - this.center.x;
			v1.y = p.y - this.center.y;
			return Math.atan2(v1.y,v1.x);
        },
        tangentsPointsForPoint(vec){  // finds where on the circle the tangents are for the point vec. Invalid if point is inside the circle
            var va = new VecArray();
            var d = this.center.distFrom(vec);
            if(d <= this.radius){  return va }   // point is inside so no tangents exist
            var a = Math.acos(this.radius / d);
            var a1 = this.center.angleTo(vec);
            return va
                .push(new Vec(undefined,a1-a).mult(this.radius).add(this.center))
                .push(new Vec(undefined,a1+a).mult(this.radius).add(this.center))
        },
		getTangentsToCircle(circle,retLineR,retLineL){ // sets the lines {retLineR} and {retLineL} to the tangent lines joining this circle to {circle}. Will only set {retLineR} or {retLineL} if given
			v1.x = circle.center.x - this.center.x;
			v1.y = circle.center.y - this.center.y;
			u = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
			a = Infinity; // flags no result
			if(u < Math.max(circle.radius,this.radius) - Math.min(circle.radius,this.radius)) { return this }
			u1 = this.radius - circle.radius;
			a = Math.asin(u1/u);
			a1 = Math.atan2(v1.y,v1.x); // direction to circle
			b = a1-(Math.PI / 2) + a;  // direction to tangent point left
			c = a1+(Math.PI / 2) - a;  // direction to tangent point right
			if(retLineR){
				v2.x = Math.cos(c);
				v2.y = Math.sin(c);
				retLineR.p1.x = this.center.x + v2.x * this.radius;
				retLineR.p1.y = this.center.y + v2.y * this.radius;
				retLineR.p2.x = circle.center.x + v2.x * circle.radius;
				retLineR.p2.y = circle.center.y + v2.y * circle.radius;
			}
			if(retLineL){
				v3.x = Math.cos(b);
				v3.y = Math.sin(b);
				retLineL.p1.x = circle.center.x + v3.x * circle.radius;
				retLineL.p1.y = circle.center.y + v3.y * circle.radius;
				retLineL.p2.x = this.center.x + v3.x * this.radius;
				retLineL.p2.y = this.center.y + v3.y * this.radius;
			}
			return this;
		},
		fitCircleToLine(circle,line,left = true,outside = true){  // {circle} is moved to fit the corner made by the intercept of the {line} and this circle if possible. if left === true then circle is fitted to the left else to the right.
			a = line.distFromPointDir(this.center); // Uses registers from this call v1 is line as vec, v3 is point on line closest to circle center line._leng is length of line
			v1.x /= line._leng;
			v1.y /= line._leng;
			if(outside){
				b = this.radius + circle.radius;
				if(left){
					c = circle.radius - a;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x - circle.radius * v1.y;
					circle.center.y = v3.y + circle.radius * v1.x;
				}else{
					c = a + circle.radius;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x + circle.radius * v1.y;
					circle.center.y = v3.y - circle.radius * v1.x;
				}
			}else{
				b = this.circle.radius - circle.radius;
				if(left){
					c = a - circle.radius;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x - circle.radius * v1.y;
					circle.center.y = v3.y + circle.radius * v1.x;
				}else{
					c = a + circle.radius;
					a1 = Math.sqrt(b * b - c * c);
					v3.x += a1 * v1.x;
					v3.y += a1 * v1.y;
					circle.center.x = v3.x + circle.radius * v1.y;
					circle.center.y = v3.y - circle.radius * v1.x;
				}
			}
			return this;
		},
        reflectLine(line){ // WTF sorry will fix in time
            var va = new VecArray();
            var pa = this.interceptLine(line);
            if(pa.vecs.length > 0){
                return va
                    .push(this.tangentAtPoint(pa.vecs[0]).reflectLine(line))
                    .push(this.tangentAtPoint(pa.vecs[1]).reflectLine(line))


            }
            return va;
        },
        fitCornerConstrain(line1,line2,cornerUnknown,constraint,data){ // fits the corner with constraints
            // set this.fitCorner for details
            // constraint is optional and of not defined returns the same as fitCorner
            // constraint is a command string,
            // data is extra data requiered to complet the commands
            // data is optional and dependent on the command string
            // commands are case insensitive
            // "limit" Limits the distance from the corner that the circle can be. It will reduce or increase the radius to fit this limit
            //    if
            //       "max" limit is on the max line length
            //       "min" limit is on the min line length
            //    else
            //        the limit is on the average line length
            //
            //    if
            //       "half" is halves the limit length
            //       "quarter" quarters the limit
            //    else
            //       if data then use data as a scale
            //       else do not change the line length;
            //    The circle is now changed to fit the corner with limit
            //
            this.fitCorner(line1,line2,cornerUnknown);
            if(this.center.x === Infinity){
                return this;
            }
            if(constraint === undefined){
                return this;
            }else{
                constraint = constraint.toLowerCase();
            }
            if(constraint.indexOf("limit") >= -1){
                if(constraint.indexOf("max") >= -1){
                    d = Math.max(u1,u);
                }else
                if(constraint.indexOf("min") >= -1){
                    d = Math.min(u1,u);
                }else{
                    d = (u1 + u)/2;
                }

                if(constraint.indexOf("half") >= -1){
                    d /= 2;
                }else
                if(constraint.indexOf("quarter") >= -1){
                    d /= 4;
                }else{
                    if(data !== undefined){
                        d *= data;
                    }
                }
                // move the circle and adjust center to not go past the limit
                if( c1 > d){
                    a *= d/c1;
                    this.radius *= d/c1;
                    c1 = d;
                    this.center.x = v3.x + v2.x * c1 - v2.y * a;
                    this.center.y = v3.y + v2.y * c1 + v2.x * a;
                }
            }

            return this;

        },
        fitCorner(line1,line2,cornerUnknown){ // fits this circle, keeping its radius to the corner made by the two lines where the end of l1 is the start of line2
                                            // it is made to fit so that the lines become tagents at the ponits of contact
                                            // The optional argument. cornerUnknown if set true means that it is unknown which point is the corner
                                            // thus this function will find it for you. If cornerUnknown and no points are within EPSILON to each other then this can not resolve the problem and will return this as an empty circle;

            // this function uses registers v1,v2,v3,u,u1,c,c1,b
            // if cornerUnknown and the corner is not found returning empty circle then no registers can be relied onLine
            // v1 is the normalised vector of line2 from corner point
            // v2 is the normalised vector of line2 from corner point
            // v3 is the corner points takend from line2 if cornerUnknown is true then this will be the corner if falsy then the corner may not be the true corner but the start of line2
            // u is the length of line 1
            // u1 is the length of line 2
            // c is half the angle between the lines
            // c1 is the distance from the corner to where the circle touches
            // a is the magnitude of the normal from line2 to the circle center
            // b is the cross product of the vectors v1 and v2 and its sign indicates the side (+left -right) of the line the circle is
            if(cornerUnknown){ // find corner can be one of four cases
                // line1 end and line2 start
                c = Math.hypot(line1.p2.x - line2.p1.x,line1.p2.y - line2.p1.y); // dist
                if(c <= EPSILON){
                    v1.x = line1.p1.x - line1.p2.x; // reverse incoming line
                    v1.y = line1.p1.y - line1.p2.y;
                    v2.x = line2.p2.x - (v3.x = line2.p1.x);
                    v2.y = line2.p2.y - (v3.y = line2.p1.y);
                }else{
                    // line1 end and line2 end
                    c = Math.hypot(line1.p2.x - line2.p2.x,line1.p2.y - line2.p2.y); // dist
                    if(c <= EPSILON){
                        v1.x = line1.p1.x - line1.p2.x; // reverse incoming line
                        v1.y = line1.p1.y - line1.p2.y;
                        v2.x = line2.p1.x - (v3.x = line2.p2.x);
                        v2.y = line2.p1.y - (v3.y = line2.p2.y);
                    }else{
                        // line1 start and line2 start
                        c = Math.hypot(line1.p1.x - line2.p1.x,line1.p1.y - line2.p1.y); // dist
                        if(c <= EPSILON){
                            v1.x = line1.p2.x - line1.p1.x; // reverse incoming line
                            v1.y = line1.p2.y - line1.p1.y;
                            v2.x = line2.p2.x - (v3.x = line2.p1.x);
                            v2.y = line2.p2.y - (v3.y = line2.p1.y);
                        }else{
                            // line1 start and line2 end
                            c = Math.hypot(line1.p1.x - line2.p2.x,line1.p1.y - line2.p2.y); // dist
                            if(c <= EPSILON){
                                v1.x = line1.p2.x - line1.p1.x; // reverse incoming line
                                v1.y = line1.p2.y - line1.p1.y;
                                v2.x = line2.p1.x - (v3.x = line2.p2.x);
                                v2.y = line2.p1.y - (v3.y = line2.p2.y);
                            }else{
                                // can not resolve corner so return empty circle
                                this.center.x = Infinity;
                            }
                        }
                    }
                }
            } else {
                v1.x = line1.p1.x - line1.p2.x; // reverse incoming line
                v1.y = line1.p1.y - line1.p2.y;
                v2.x = line2.p2.x - (v3.x = line2.p1.x);
                v2.y = line2.p2.y - (v3.y = line2.p1.y);
            }
            // normalise both vectors
            u = Math.hypot(v1.x,v1.y);
            u1 = Math.hypot(v2.x,v2.y);
            v1.x /= u;
            v1.y /= u;
            v2.x /= u1;
            v2.y /= u1;
            c = Math.asin(b=(v2.x * v1.y - v2.y * v1.x)); // cross product as angle
            c1 = v2.y * v1.y - -v2.x * v1.x;  //
            if(c1 < 0){ // is the angle greater the -90 or 90
                if(c < 0){  // is negative?
                    c = MPI + c;
                    a = -this.radius; // move left of line2
                }else{
                    c = MPI - c;
                    a = this.radius; // // move right of line2
                }
            }else{
                if(c < 0){
                    a = -this.radius; // move left of line2
                    c = -c;
                }else{
                    a = this.radius; // move right of line2
                }
            }
            // the circle is on the line midway between both lines so div angle by two
            c = c/2;
            // find dist from line2 start to point of circle touching
            c1 = this.radius * Math.cos(c) / Math.sin(c);
            // move center along line2 and then away along the normal of line two
            this.center.x = v3.x + v2.x * c1 - v2.y * a;
            this.center.y = v3.y + v2.y * c1 + v2.x * a;
            return this;
        },
        scale(scale){
            this.radius * scale;
            return this; // returns this
        },
        translate(vec){
            this.center.translate(vec);
            return this; // returns this
        },
        rotate(rotation){
            return this; // returns this
        },
        transform(transform){
            return this; // returns this
        },
    }
    Line.prototype = {
        p1 : undefined,
        p2 : undefined,
        type : "Line",
        _leng : null,
        _dir : null,
        copy(){
            return new Line(this.p1.copy(),this.p2.copy());
        },
        setAs(line){
            this.p1.x = line.p1.x;
            this.p1.y = line.p1.y;
            this.p2.x = line.p2.x;
            this.p2.y = line.p2.y;
            return this;
        },
        setEnds(vec1, vec2){
            this.p1.x = vec1.x;
            this.p1.y = vec1.y;
            this.p2.x = vec2.x;
            this.p2.y = vec2.y;
            return this;
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.p1.id === id || this.p2.id === id){
                return true;
            }
            return false;
        },
        /*getAllIdsAsArray(array){
            if(array === undefined){
                array = [];
            }
            if(array.indexOf(this.id)=== -1){
                array.push(this.id);
            }
            if(array.indexOf(this.p1.id)=== -1){
                array.push(this.p1.id);
            }
            if(array.indexOf(this.p2.id)=== -1){
                array.push(this.p1.id);
            }
            return array;
        },*/
        asSimple(obj){ // returns the vec as a simple object x1,y1,x2,y2 are ends, length and direction
            if(obj === undefined){
                obj = {};
            }
            obj.x1 = this.p1.x;
            obj.y1 = this.p1.y;
            obj.x2 = this.p2.x;
            obj.y2 = this.p2.y;
            return obj;
        },
        fromSimple(obj){
            this.p1.x = obj.x1 === undefined ? 0 : obj.x1;
            this.p1.y = obj.y1 === undefined ? 0 : obj.y1;
            this.p2.x = obj.x2 === undefined ? 1 : obj.x2;
            this.p2.y = obj.y2 === undefined ? 0 : obj.y2;
            return this;
        },
        isEmpty(){ // line is empty if either points are undefined or the length is 0 or any point has Infinity or any point has NaN
            var t;
            if(this.p1 === undefined ||  this.p2 === undefined ||
                    this.p1.x === undefined || this.p1.y === undefined || this.p2.x === undefined || this.p2.y === undefined ||
                    ((this.p1.x - this.p2.x) === 0 &&  (this.p1.y - this.p2.y) === 0) ||
                    (t = Math.abs(this.p1.x + this.p1.y + this.p2.x + this.p2.y)) === Infinity ||
                    isNaN(t)){
                return true;
            }
            return false;
        },
        empty(){
            this.p1.x = this.p1.y = this.p2.x = this.p2.y = Infinity;
            return this;
        },
        isZero(){ // returns true if the line has no length
            if(this.p1.x === this.p2.x && this.p1.y === this.p2.y){
                return true;
            }
            return false;
        },
        toString(precision){
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            var id = this.id === undefined ? "": "'"+this.id+"' ";
            if(this.isEmpty()){
                return "Line: '"+l+"' id : "+id+" ( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            return "Line: '"+l+"' id : "+id+" ( "+this.p1.toString(precision)+", "+this.p2.toString(precision)+" )";
        },
        getHash(){ // returns a unquie hash value for the lines current state
            var hash = 0;
            if(!isNaN(this.id)){
                hash += this.id;
            }
            hash += this.p1.getHash();
            hash += this.p2.getHash();
            return Math.round(hash  % 0xFFFFFFFF);
        },
        replace(id, prim){  // replaces vec with id == id with the supplied vec
            if(id !== undefined){
                if(prim !== undefined && prim.type === "Vec"){
                    if(this.p1.id === id){
                        this.p1 = prim;
                    }else
                    if(this.p2.id === id){
                        this.p2 = prim;
                    }
                }
            }
            return this;
        },
        swap(){
            u1 = this.p1;
            this.p1 = this.p2;
            this.p2 = u1;
            return this;  // returns this
        },
        reverse(){ // changes the direction of the line by swapping the end points
            return this.swap(); // returns this.
        },
        lerp(from, dest, amount){
            this.p1.x = (dest.p1.x - from.p1.x) * amount + from.p1.x;
            this.p1.y = (dest.p1.y - from.p1.y) * amount + from.p1.y;
            this.p2.x = (dest.p2.x - from.p2.x) * amount + from.p2.x;
            this.p2.y = (dest.p2.y - from.p2.y) * amount + from.p2.y;
            return this;
        },
        asVec(vec){  // creates a new vec or uses the supplied ref vec to return the vector representation of line
            if(vec === undefined){
                return new Vec(this.p1,this.p2);
            }
            vec.x = this.p2.x - this.p1.x;
            vec.y = this.p2.y - this.p1.y;
            return vec;
        },
        asVecArray(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.p1).push(this.p2);
                return vecArray;
            }
            vecArray.push(this.p1.copy()).push(this.p2.copy());
            return vecArray;
        },
        asBox(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.p1.x, this.p1.y);
            box.env ( this.p2.x, this.p2.y);
            return box;
        },
        asCircle(circle){ // creates a circle the bounds this line/ {ocircle) if supplied is set to the circle else a new circle is created
            if(circle === undefined){
                circle = new Circle();
            }
            circle.center.x = (this.p1.x + this.p2.x)/2;
            circle.center.y = (this.p1.y + this.p2.y)/2;
            circle.radius = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y) / 2;
            return circle;
        },
        asRectangle(height,rect){ // creates a rectangle with the center aligned to this line and width equal to the length of this line and the aspect set to give the requested height
            if(rect === undefined){
                rect = new Rectangle();
            }
            var w;
            w = Math.hypot(v1.y = this.p2.y - this.p1.y, v1.x = this.p2.x - this.p1.x);

            v1.x /= w;
            v1.y /= w;
            rect.top.p1.x = this.p1.x + v1.y * (height / 2);
            rect.top.p1.y = this.p1.y - v1.x * (height / 2);
            rect.top.p2.x = rect.top.p1.x + v1.x * w;
            rect.top.p2.y = rect.top.p1.y + v1.y * w;
            rect.aspect = height / w;
            return rect;

        },
        isVecLeft(vec){ // Is the {vec} to the left of this line.Left is left of screen when looking at it and the line moves down.
            if((this.p2.x - this.p1.x) * (vec.y - this.p1.y) - (this.p2.y - this.p1.y) * (vec.x - this.p1.x) <= 0){
                return true;
            }
            return false;
        },
        isLineLeft(line){ // Is the {aline} to the left of this line.  Left is left of screen when looking at it and the line moves down.
            v1.x = this.p2.x - (vx = this.p1.x);
            v1.y = this.p2.y - (vy = this.p1.y);
            v2.x = line.p1.x - vx;
            v2.y = line.p1.y - vy;
            if(v1.x * v2.y - v1.y * v2.y < 0){
                v2.x = line.p2.x - vx;
                v2.y = line.p2.y - vy;
                if(v1.x * v2.y - v1.y * v2.y < 0){
                    return true;
                }
            }
            return false; // returns boolean
        },
        isCircleLeft(circle){ // is the circle {acircle} left of this line. Left is left of screen when line moves from top to bottom
            if(this.isVecLeft(circle.center)){
                if(this.distFrom(circle.center) > circle.radius){
                    return true;
                }
            }
            return false; // returns boolean
        },
        isVecWithinSeg(vec){ // returns true if the vec is within the line segment.
            a = Math.hypot(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            b = Math.hypot(vec.y - this.p1.y, vec.x - this.p1.x);
            c = Math.hypot(vec.y - this.p2.y, vec.x - this.p2.x);
            if(b <= a && c <= a){
                return true;
            }
            return false;
        },
        isVecOnSeg(vec, threshold){ // returns true if the vec is within the line segment. [threshold] is optional if not given then geom EPSILON is used
            if(threshold === undefined){
                threshold = EPSILON;
            }
            a = Math.hypot(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            b = Math.hypot(vec.y - this.p1.y, vec.x - this.p1.x);
            c = Math.hypot(vec.y - this.p2.y, vec.x - this.p2.x);
            if(b + c <= a + threshold){
                return true;
            }
            return false;
        },
        isLineOnLine(line,threshold){ // returns true if the line is on this line
            if(threshold === undefined){
                threshold = EPSILON;
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            u = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            u1 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            a = (v1.x * v2.y) / (u * u1) - (v1.y * v2.x) / (u * u1);
            if(Math.abs(a) < EPSILON){ // parallel
                v3.x = line.p2.x - this.p1.x;
                v3.y = line.p2.y - this.p1.y;
                u = (v3.x * v1.x + v3.y * v1.y)/(u * u);
                v3.x = this.p1.x + v1.x * u;
                v3.y = this.p1.y + v1.y * u;
                b = Math.hypot(v3.y - line.p2.x, v3.x - line.p2.y);
                if(b < threshold){
                    return true;
                }
            }
            return false;
        },
        isLineParallelToLine(line,threshold){ // returns true if the line is parallel to this line
            if(threshold === undefined){
                threshold = EPSILON;
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            u = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            u1 = u * Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            a = (v1.x * v2.y) / u1 - (v1.y * v2.x) / u1;
            if(Math.abs(a) < EPSILON){ // parallel
                return true;
            }
            return false;
        },
        isLineOnSeg(line,threshold){ // returns true if the line starts or ends on this line seg and is parallel to this line seg
            if(threshold === undefined){
                threshold = EPSILON;
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            u = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            u1 = u * Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            a = (v1.x * v2.y) / u1 - (v1.y * v2.x) / u1;
            if(Math.abs(a) < EPSILON){ // parallel
                v3.x = line.p2.x - this.p1.x;
                v3.y = line.p2.y - this.p1.y;
                u1 = (v3.x * v1.x + v3.y * v1.y)/(u * u);
                if(u1 >= 0 && u1 <= 1){
                    v3.x = this.p1.x + v1.x * u1;
                    v3.y = this.p1.y + v1.y * u1;
                    b = Math.hypot(v3.y - line.p2.x, v3.x - line.p2.y);
                    if(b < threshold){
                        return true;
                    }
                }
                v3.x = line.p1.x - this.p1.x;
                v3.y = line.p1.y - this.p1.y;
                u1 = (v3.x * v1.x + v3.y * v1.y)/(u * u);
                if(u1 >= 0 && u1 <= 1){
                    v3.x = this.p1.x + v1.x * u1;
                    v3.y = this.p1.y + v1.y * u1;
                    b = Math.hypot(v3.y - line.p1.x, v3.x - line.p1.y);
                    if(b < threshold){
                        return true;
                    }
                }
            }
            return false;
        },
        isLineInSeg(line,threshold){ // returns true if the line starts and ends on this line seg and is parallel to this line seg
            if(threshold === undefined){
                threshold = EPSILON;
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            u = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            u1 = u * Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            a = (v1.x * v2.y) / u1 - (v1.y * v2.x) / u1;
            if(Math.abs(a) < EPSILON){ // parallel
                v3.x = line.p2.x - this.p1.x;
                v3.y = line.p2.y - this.p1.y;
                u1 = (v3.x * v1.x + v3.y * v1.y)/(u * u);
                if(u1 >= 0 && u1 <= 1){
                    v3.x = this.p1.x + v1.x * u1;
                    v3.y = this.p1.y + v1.y * u1;
                    b = Math.hypot(v3.y - line.p2.x, v3.x - line.p2.y);
                    if(b < threshold){
                        v3.x = line.p1.x - this.p1.x;
                        v3.y = line.p1.y - this.p1.y;
                        u1 = (v3.x * v1.x + v3.y * v1.y)/(u * u);
                        if(u1 >= 0 && u1 <= 1){
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        leng(){
            return ((this.p2.y - this.p1.y) ** 2 +  (this.p2.x - this.p1.x) ** 2) ** 0.5;
        },
        leng2(){ // length squared
            return Math.pow(this.p2.x-this.p1.x,2) + Math.pow(this.p2.y-this.p1.y,2);
        },
        dir(){ // returns direction in radians in the range -pi to pi
            return Math.atan2(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
        },
        norm(rVec){ // returns the line normal (perpendicular to the line) as a vec
            if(rVec === undefined){
                rVec = new Vec();
            }
            rVec.y = this.p2.x - this.p1.x;
            rVec.x = -(this.p2.y - this.p1.y);
            d = Math.hypot(rVec.x,rVec.y);
            rVec.x /= d;
            rVec.y /= d;
            return rVec;

        },
        normDir(){ // returns the line normal as a direction in radians in the range -pi to pi
            return Math.atan2(-(this.p2.x - this.p1.x),(this.p2.y - this.p1.y)) ;
        },
        extend(percentage){  // grows or shrinks the line towards or away from its center
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = (Math.hypot(v1.x,v1.y) * 2) / percentage;
            v1.x /= l;
            v1.y /= l;
            this.p1.x -= v1.x;
            this.p1.y -= v1.y;
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this; // returns this.
        },
        setLeng(len){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = Math.hypot(v1.x,v1.y);
            this.p2.x = this.p1.x + v1.x * len / l;
            this.p2.y = this.p1.y + v1.y * len / l;
            return this; // returns this.
        },
        setDir(num){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = Math.hypot(v1.x,v1,y);
            v1.x = Math.cos(num) * l;
            v1.y = Math.sin(num) * l;
            this.p2.x = this.p1.x + v1.x;
            this.p2.y = this.p1.y + v1.y;
            return this; // returns this.
        },
        cross(){
            return this.p1.x * this.p2.y - this.p1.y * this.p2.x;
        },
        crossBack(){
            return this.p2.x * this.p1.y - this.p2.y * this.p1.x;
        },
        crossLine(line){  // cross product of vector representing this line and vector representing line
            return  (this.p2.x - this.p1.x) * (line.p2.y - line.p1.y) - (this.p2.y - this.p1.y) * (line.p2.x - line.p1.x);
        },
        crossLineNorm(line){  // cross product of vector representing this line and vector representing line
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            d = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            d1 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            v1.x /= d;
            v1.y /= d;
            v2.x /= d1;
            v2.y /= d1;
            return v1.x * v2.y - v1.y * v2.x;
        },
        mult(num){
            this.p1.x *= num;
            this.p1.y *= num;
            this.p2.x *= num;
            this.p2.y *= num;
            return this; // returns this.
        },
        add(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this; // returns this.
        },
        midPoint(rVec){  // returns the vec as mid point of line
            if(rVec === undefined){
                return new Vec((this.p1.x + this.p2.x)/2,(this.p1.y + this.p2.y)/2);
            }
            rVec.x = (this.p1.x + this.p2.x)/2;
            rVec.y = (this.p1.y + this.p2.y)/2;
            return rVec;
        },
        unitAlong( unitDist , rVec){ // returns a Vec unitDist (0 is start 1 is end) along the line
            if(rVec === undefined){
                return new Vec(
                    (this.p2.x - this.p1.x) * unitDist + this.p1.x,
                    (this.p2.y - this.p1.y) * unitDist + this.p1.y
                );
            }
            rVec.x = (this.p2.x - this.p1.x) * unitDist + this.p1.x;
            rVec.y = (this.p2.y - this.p1.y) * unitDist + this.p1.y;
            return rVec;
        },
        distanceAlong( dist, rVec) { // Depreciated Use distAlong
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = dist / Math.hypot(v1.x,v1.y);
            if(rVec === undefined){
                return new Vec(
                    v1.x * l + this.p1.x,
                    v1.y * l + this.p1.y
                );
            }
            rVec.x = v1.x * l + this.p1.x;
            rVec.y = v1.y * l + this.p1.y;
            return rVec;
        },
        distAlong( dist, rVec) { // returns a Vec that is dist along the line 0 = start and line length is the end
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = dist / Math.hypot(v1.x,v1.y);
            if(rVec === undefined){
                return new Vec(
                    v1.x * l + this.p1.x,
                    v1.y * l + this.p1.y
                );
            }
            rVec.x = v1.x * l + this.p1.x;
            rVec.y = v1.y * l + this.p1.y;
            return rVec;
        },
        angleBetween(line){     // returns angle between two lines in radians. To the right positive  0 to PI and to the left 0 to - PI. The angle is of the 2 vectors from p1 to p2 of each line. They do not have to be at the same location
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            a = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            b = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            v1.x /= a;
            v1.y /= a;
            v2.x /= b;
            v2.y /= b;
            c = Math.asin (v1.x * v2.y - v1.y * v2.x);
            d = -v1.y * v2.y - v1.x * v2.x;
            if(d > 0){
                if(c > 0){
                    return Math.PI - c;
                }
                return -Math.PI - c;
            }
            return c;
        },
        angleFromNormal(line){
            v1.x = -(this.p2.y - this.p1.y);
            v1.y = this.p2.x - this.p1.x;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;

            a = Math.hypot(v1.x,v1.y);
            b = Math.hypot(v2.x,v2.y);
            return Math.asin ((v1.x / a) * (v2.y / b) - (v1.y / a) * (v2.x / b));
        },
        setTransformToLine :function (ctx){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = d = Math.hypot(v1.y,v1.x);
            v1.x /= d;
            v1.y /= d;
            ctx.setTransform(v1.x, v1.y, -v1.y, v1.x, this.p1.x, this.p1.y)
            return this;
        },
        sliceOffEnd( line ){
            this.intercept(line,va);
            u = this.getUnitDistOfPoint(va);
            if(u > 0 && u < 1){
                u1 = line.getUnitDistOfPoint(va);
                if(u1 >= 0 && u1 <= 1){
                    this.p2.x = va.x;
                    this.p2.y = va.y;
                }
            }
            return this;  // returns this.
        },
        sliceOffStart( line ){
            this.intercept(line,va);
            u = this.getUnitDistOfPoint(va);
            if(u > 0 && u < 1){
                u1 = line.getUnitDistOfPoint(va);
                if(u1 >= 0 && u1 <= 1){
                    this.p1.x = va.x;
                    this.p1.y = va.y;
                }
            }
            return this; // returns this.
        },
        sliceToPoints(p1,p2){
            var pp1 = this.closestPoint(p1);
            var pp2 = this.closestPoint(p2);
            u = this.getUnitDistOfPoint(pp1);
            u1 = this.getUnitDistOfPoint(pp2);
            if(u1 < u){
                var t = pp1;
                pp2 = pp1;
                pp1 = t;
                t = u;
                u = u1;
                u1 = t;
            }
            if((u <= 0 && u1 < 0) || (u > 1 && u1 > 1)){
                this.p2 = this.p1.copy();
                return this;
            }
            if(u >= 0 && u <= 1){
                this.p1 = pp1;
            }
            if(u1 >= 0 && u1 <= 1){
                this.p2 = pp2;
            }
            return this; // returns this.

        },
        intercept(line,rVec){  // find the point of intercept between this line and line
            // this function uses V1,V2,V3,V4.y where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x Unit dist on line
            // v4.y is unit distance on this line to intercept. Will be undefined if not relevant
            if(rVec === undefined){
                rVec = new Vec();
            }
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than us EPSILON let small values through the result may be infinit but that is more true then no intercept
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.x = (v1.x * v3.y - v1.y * v3.x) / c;
                v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on this line
                rVec.x = this.p1.x + v1.x * u;
                rVec.y = this.p1.y + v1.y * u;
            }else{
                v4.x = v4.y = rVec.y = rVec.x = undefined;  // create an empty vector
            }
            return rVec;
        },
        interceptSeg(line,rVec){ // find the point of intercept between this line segment  and line
            // this function uses V1,V2,V3,V4.y where
            // v1 is the vector of this line,
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is not used by this function and will have a random
            // v4.y is unit distance on this line to intercept. Will be undefined if not relevant
            if(rVec === undefined){
                rVec = new Vec();
            }
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than use EPSILON let small values through
                v3.x = this.p1.x - line.p1.x; // vector of the difference between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.x = (v1.x * v3.y - v1.y * v3.x) / c;
                v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on line
                if(u >= 0 && u <= 1){
                    rVec.x = this.p1.x + v1.x * u;
                    rVec.y = this.p1.y + v1.y * u;
                }else{
                    rVec.y = rVec.x = undefined;  // make an empty vector                         }
                }
            }else{
                rVec.y = rVec.x = v4.x = v4.y = undefined; // incase V4 is needed && make an empty vector
            }
            return rVec;
        },
        interceptSegs(line,rVec){ // find the point of intercept between this line segment and and the line as a line segment
            // this function uses V1,V2,V3,V4 where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is unit distance on line to intercept.  Will be undefined if not relevant
            // v4.y is unit distance on this line to intercept. Will be undefined if not relevant

            if(rVec === undefined){
                rVec = new Vec();
            }
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than us EPSILON let small values through
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.x = u = (v1.x * v3.y - v1.y * v3.x) / c; // unit distance of intercept point on line
                v4.y = u1 = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on this line
                if(u >= 0 && u <= 1){
                    if(u1 >= 0 && u1 <= 1){
                        rVec.x = this.p1.x + v1.x * u1;
                        rVec.y = this.p1.y + v1.y * u1;
                    }else{
                        rVec.y = rVec.x = undefined;  // make an empty vector
                    }
                }else{
                   rVec.y = rVec.x = undefined;  // make an empty vector                         }
                }
            }else{
                rVec.y = rVec.x = v4.x = v4.y = undefined; // incase V4 is needed && make an empty vector
            }
            return rVec;

        },
        isLineSegIntercepting(line){ // Returns true if the line intercepts this line segment
            // this function uses V1,V2,V3,V4 where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is unit distance on line to intercept.  Will be undefined if not relevant
            // v4.y is unit distance on this line to intercept. May be random if not relevant only us if return is true
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than use EPSILON let small values through
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.x = u = (v1.x * v3.y - v1.y * v3.x) / c; // unit distance of intercept point on line
                if(u >= 0 && u <= 1){
                    v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on this line
                    if(u >= 0 && u <= 1){
                        v4.x = u;  // in case needed for calculating the position of the intercept
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false
                }
            }
            v4.x = undefined;
            return false;
        },
        distFrom(point){   // returns the distance from the line segment a point is
            // this function uses v1, v2, v3, u is the closest point /*WTF and sets this._leng*/
            // v1 is the vector of this line
            // v2 is the vector from this line start to point
            // v3 is the vector from the line start to the closes point. To get the coordinates add the start of the line to this vec;
            // WTF ???? this._leng is the length of this line;
            // u is unit dist along this line for close point. That means v4.x <0 or v4.y > 0 and the point is not on this line segment
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = point.x - this.p1.x;
            v2.y = point.y - this.p1.y;
            u = (v2.x * v1.x + v2.y * v1.y)/(v1.y * v1.y + v1.x * v1.x);
            if(u >= 0 && u <= 1){
                v3.x = this.p1.x + v1.x * u;
                v3.y = this.p1.y + v1.y * u;
                return Math.sqrt((v3.y - point.y) ** 2 +  (v3.x - point.x) ** 2);
            }
            return Math.min(
                Math.sqrt((this.p2.x - point.x) ** 2 + (this.p2.y - point.y) ** 2),
                Math.sqrt((this.p1.x - point.x) ** 2 + (this.p1.y - point.y) ** 2)
            );
        },
        distFromPoint(point){   // returns the distance from the line a point is
            // this function uses v1, v2, v3, u is the closest point and sets this._leng
            // v1 is the vector of this line
            // v2 is the vector from this line start to point
            // v3 is the vector from the line start to the closes point. To get the coordinates add the start of the line to this vec;
            // this._leng is the length of this line;
            // u is unit dist along this line for close point. That means v4.x <0 or v4.y > 0 and the point is not on this line segment
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = u = Math.sqrt(v1.y * v1.y + v1.x * v1.x);
            v2.x = point.x - this.p1.x;
            v2.y = point.y - this.p1.y;
            u = (v2.x * v1.x + v2.y * v1.y)/(u * u);
            v3.x = this.p1.x + v1.x * u;
            v3.y = this.p1.y + v1.y * u;
            a = v3.x - point.x;
            b = v3.y - point.y;
            return Math.sqrt(a * a + b * b);
        },
        distFromDir(point){ // same as distFrom but adds a sign to indicate if the line is left (negative) or right (positive)
            // this call fromDist Refer to that function for calc vars used.
            d = this.distFrom(point);
            // WARNING this depends on vars set in distFrom
            c = v1.x * v2.y - v1.y * v2.x;
            return c < 0 ? -d : d;
        },
        distFromPointDir(point){ // same as distFromPoiny but adds a sign to indicate if the line is left (negative) or right (positive)
            // this call fromDist Refer to that function for calc vars used.
            d = this.distFromPoint(point);
            // WARNING this depends on vars set in distFrom
            c = v1.x * v2.y - v1.y * v2.x;
            return c < 0 ? -d : d;
        },
        lineToVec(vec, rLine){  // returns the line from vec p to the closest point on the line
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = u = Math.sqrt(v1.y * v1.y + v1.x * v1.x);
            v2.x = vec.x - this.p1.x;
            v2.y = vec.y - this.p1.y;
            u = (v2.x * v1.x + v2.y * v1.y)/(u * u);
            if(rLine === undefined){
                return new Line(
                    vec.copy(),
                    new Vec(
                        v1.x * u + this.p1.x,
                        v1.y * u + this.p1.y
                    )
                );
            }
            rLine.p1.x = vec.x;
            rLine.p1.y = vec.y;
            rLine.p2.x = v1.x * u + this.p1.x;
            rLine.p2.y = v1.y * u + this.p1.y;
            return rLine;
        },
        getDistOfPoint(vec){ // returns the distance of a point on the line from the start. If the point is not on the line then the distance is the distance with the line roated to align to the point.
                                        // Use getDistOfPointSafe if the distance needs to be without the rotation. Ie the cosine(angle between point and line) * distance to point
            var l = Math.hypot(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            var la = Math.hypot(vec.y - this.p1.y, vec.x - this.p1.x);
            var lb = Math.hypot(vec.y - this.p2.y, vec.x - this.p2.x);
            if ((la <= l && lb <= l) || la > lb) {
                return la;
            }
            return -la;
        },
        getUnitDistOfPoint(vec){ // returns the unit distance of a point on the line from the start. If the point is not on the line then the distance is the distance with the line rotated to align to the point.
                                        // Use getDistOfPointSafe if the distance needs to be without the rotation. Ie the cosine(angle between point and line) * distance to point
            var l = Math.hypot(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            var la = Math.hypot(vec.y - this.p1.y, vec.x - this.p1.x) / l;
            var lb = Math.hypot(vec.y - this.p2.y, vec.x - this.p2.x) / l;
            if ((la <= 1 && lb <= 1) || la > lb) {
                return la;
            }
            return -la;
        },
        getDistOfPointSafe(vec){ // returns the unit distance of a point on the line from the start.
            this.closestPoint(vec,v3);
            // WARNING uses results and optimisations vars from closestPoint
            var la = Math.hypot(v3.y - this.p1.y, v3.x - this.p1.x);
            var lb = Math.hypot(v3.y - this.p2.y, v3.x - this.p2.x);
            if ((la <= this._leng && lb <= this._leng) || la > lb) {
                return la;
            }
            return -la;
        },
        getUnitDistOfPointSafe(vec){ // returns the unit distance of a point on the line from the start.
            this.closestPoint(vec,v3);
            // WARNING uses results and optimisations vars from closestPoint
            var la = Math.hypot(v3.y - this.p1.y, v3.x - this.p1.x) / this._leng;
            var lb = Math.hypot(v3.y - this.p2.y, v3.x - this.p2.x) / this._leng;
            if ((la <= 1 && lb <= 1) || la > lb) {
                return la;
            }
            return -la;
        },
        unitDistOfClosestPoint(vec){ // returns the unit distance of the closest point on the line from the point vec
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = vec.x - this.p1.x;
            v2.y = vec.y - this.p1.y;
            return (v2.x * v1.x + v2.y * v1.y) / (v1.y * v1.y + v1.x * v1.x);
        },
        closestPoint(vec, rVec){ // returns the point on the line that is closest to the point vec
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = u = Math.sqrt(v1.y * v1.y + v1.x * v1.x);
            v2.x = vec.x - this.p1.x;
            v2.y = vec.y - this.p1.y;
            u = (v2.x * v1.x + v2.y * v1.y)/(u * u);
            if(rVec === undefined){
                return new Vec(
                    v1.x * u + this.p1.x,
                    v1.y * u + this.p1.y
                );
            }
            rVec.x = v1.x * u + this.p1.x;
            rVec.y = v1.y * u + this.p1.y;
            return rVec;

        },
        closestPointOnSeg(vec, rVec){ // returns the point on the line that is closest to the point vec
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = u = Math.sqrt(v1.y * v1.y + v1.x * v1.x);
            if(u <= 0){
                if (rVec === undefined) { return new Vec(this.p1) }
                rVec.x = this.p1.x;
                rVec.y = this.p1.y;
                return rVec;
            }
            if(u >= 1){
                if (rVec === undefined) { return new Vec(this.p2) }
                rVec.x = this.p2.x;
                rVec.y = this.p2.y;
                return rVec;
            }
            v2.x = vec.x - this.p1.x;
            v2.y = vec.y - this.p1.y;
            u = (v2.x * v1.x + v2.y * v1.y)/(u * u);
            if(rVec === undefined){
                return new Vec(
                    v1.x * u + this.p1.x,
                    v1.y * u + this.p1.y
                );
            }
            rVec.x = v1.x * u + this.p1.x;
            rVec.y = v1.y * u + this.p1.y;
            return rVec;

        },
        /*refractLine(line,n1,n2){ // error in logic. do not use
            n1 = 1.2
            var p1 = this.intercept(line);
            var l  = Math.hypot(line.p2.y-line.p1.y,line.p2.x-line.p1.x);
            var a  = Math.atan2(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
            var a1 = this.asVec().crossNorm(line.asVec().rev());
            var a2 = Math.asin((n1 * a1)/n2);
            return new Line(p1,new Vec(null,a-MPI+a2).mult(l).add(p1));
        },*/
        reflect(l){  // Depreciated use reflectAsVec
            this.asVec(v2);
            l.asVec(v1);
            var len = v1.dot(v2.norm())*2;
            return v2.mult(len).sub(v1)
        },
        reflectAsVec(line,retVec){  // returns a vector...
            if(retVec === undefined){
                retVec = new Vec();
            }
            v2.x = this.p2.x - this.p1.x;
            v2.y = this.p2.y - this.p1.y;
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            var len = v1.dot(v2.norm())*2;
            retVec.x = v2.x * len - v1.x;
            retVec.y = v2.y * len - v1.y;
            return retVec;
        },
        reflectLine(line, retLine){   // reflects line from this returning the new line. retLine if given is set to the reflected line
            if(retLine === undefined){
                v5 = this.intercept(line,v5);
                return new Line(v5.copy(),v5.copy().add(this.reflectAsVec(line,v4)));
            }
            this.intercept(line,v5);
            retLine.p1.x = v5.x
            retLine.p1.y = v5.y;

            this.reflectAsVec(line,v4);
            retLine.p2.x = v5.x + v4.x ;
            retLine.p2.y = v5.y + v4.y;
            return retLine;
        },
        getNormalAsLine(retLine){ // returns a unit line perpendicular and to the right from the midpoint
            if(retLine === undefined){
                retLine = new Line();
            }
            v1.x = this.p2.x - this.p1.x; // get the vector of the line
            v1.y = this.p2.y - this.p1.y;
            retLine.p2.x = retLine.p1.x = this.p1.x + v1.x / 2; // get the center as start of returned line
            retLine.p2.y = retLine.p1.y = this.p1.y + v1.y / 2; // get the center
            u = Math.hypot(v1.x,v1.y); // normalise the ve by geting length
            v1.x /= u;
            v1.y /= u;
            retLine.p2.x -= v1.y; // set the end point to the normalised distance from the line
            retLine.p2.y += v1.x;
            return retLine;
        },
        mirrorLine(line,retLine){ // returns the line mirrored around this line. rLine is set to the mirror if given else a new line is created
            this.closestPoint(line.p1,v3);
            this.closestPoint(line.p2,v4);
            if(retLine === undefined){
                return new Line(
                    new Vec(
                        v3.x - (line.p1.x - v3.x),
                        v3.y - (line.p1.y - v3.y)
                    ),
                    new Vec(
                        v4.x - (line.p2.x - v4.x),
                        v4.y - (line.p2.y - v4.y)
                    )
                );
            }
            retLine.p1.x = v3.x - (line.p1.x - v3.x);
            retLine.p1.y = v3.y - (line.p1.y - v3.y);
            retLine.p2.x = v4.x - (line.p2.x - v4.x);
            retLine.p2.y = v4.y - (line.p2.y - v4.y);
            return retLine;
        },
        mirrorVec(vec,retVec){ // returns the vec mirrored around this line. rLine is set to the mirror if given else a new line is created
            this.closestPoint(vec,v3);
            if (retVec === undefined) { return new Vec( v3.x - (vec.x - v3.x),  v3.y - (vec.y - v3.y) )  }
            retVec.x = v3.x - (vec.x - v3.x);
            retVec.y = v3.y - (vec.y - v3.y);
            return retVec;
        },
        setStartEndUnit(start,end){ // this function moves the end points to start and end keeping the direction. start and end are in unit lengths where 0 is the start and 1 is the end call this function with 0,1 makes not change 1,0 reverses the line
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this.p2.x = this.p1.x + v1.x * end;
            this.p2.y = this.p1.y + v1.y * end;
            this.p1.x += v1.x * start;
            this.p1.y += v1.y * start;
            return this;
        },
        centerOnStart(){ // moves the line back so that it is centered on its start
            // this function uses Geom registers v1
            // v1 is the vector of this line
            this.p2.x = (this.p1.x += (v1.x = this.p2.x - this.p1.x)/2) + v1.x;
            this.p2.y = (this.p1.x += (v1.y = this.p2.y - this.p1.y)/2) + v1.y;
            return this; // returns this.
        },
        centerOnEnd(){ // moves the line forward so that it is centered where its end is now
            // this function uses Geom registers v1
            // v1 is the vector of this line
            this.p1.x = (this.p2.x += (v1.x = this.p1.x - this.p2.x)/2) + v1.x;
            this.p1.y = (this.p2.x += (v1.y = this.p1.y - this.p2.y)/2) + v1.y;
            return this; // returns this.
        },
        centerOnVec(vec){ // moves the line  so that it is centered on vec
            // this function uses Geom registers v1
            // v1 is the vector of this line
            this.p1.x = (this.p2.x = vec.x + (v1.x = this.p1.x - this.p2.x)/2) - v1.x;
            this.p1.y = (this.p2.x = vec.y + (v1.y = this.p1.y - this.p2.y)/2) - v1.y;
            return this; // returns this.
        },
        rotate180OnStart(){
            this.p2.x = this.p1.x - (this.p2.x - this.p1.x);
            this.p2.y = this.p1.y - (this.p2.y - this.p1.y);
            return this;
        },
        rotate180OnEnd(){
            this.p1.x = this.p2.x + (this.p2.x - this.p1.x);
            this.p1.y = this.p2.y + (this.p2.y - this.p1.y);
            return this;
        },
        rotate90OnCenter(){ // rotates 90 deg clockwise on the center
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p1.x + v1.x / 2;
            v2.y = this.p1.y + v1.y / 2;
            this.p2.x = (this.p1.x = v2.x + v1.y / 2) - v1.y;
            this.p2.y = (this.p1.y = v2.y - v1.x / 2) + v1.x;
            return this;
        },
        rotate90OnStart(){ // rotates 90 deg clockwise on its start point
            v1.x = this.p2.x - this.p1.x;
            this.p2.x = this.p1.x - (this.p2.y - this.p1.y);
            this.p2.y = this.p1.y + v1.x;
            return this;
        },
        rotate90OnEnd(){ // rotates 90 deg clockwise on its end point
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this.p1.x = this.p2.x + v1.y;
            this.p1.y = this.p2.y - v1.x;
            return this;
        },
        rotate90OnUnit(unit){ // rotates 90 deg clockwise on the unit dist from start
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p1.x + v1.x * unit;
            v2.y = this.p1.y + v1.y * unit;
            this.p2.x = (this.p1.x = v2.x + v1.y * unit) - v1.y;
            this.p2.y = (this.p1.y = v2.y - v1.x * unit) + v1.x;
            return this;
        },
        rotateOnStart(rotation){  // rotates line around start
            v2.x = Math.cos(rotation);
            v2.y = Math.sin(rotation);
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this.p2.x = this.p1.x + v1.x * v2.x - v1.y * v2.y;
            this.p2.y = this.p1.y + v1.x * v2.y + v1.y * v2.x;
            return this;
        },
        rotateOnEnd(rotation){  // rotates lines around end
            v2.x = Math.cos(rotation);
            v2.y = Math.sin(rotation);
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this.p1.x = this.p2.x - v1.x * v2.x - v1.y * v2.y;
            this.p1.y = this.p2.y - v1.x * v2.y + v1.y * v2.x;
            return this;
        },
        rotateOnCenter(rotation){ // rotates line around center
            v2.x = Math.cos(rotation) * 0.5;
            v2.y = Math.sin(rotation) * 0.5;
            v3.x = (this.p2.x + this.p1.x) * 0.5;
            v3.y = (this.p2.y + this.p1.y) * 0.5;
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this.p1.x = v3.x - v1.x * v2.x - v1.y * v2.y;
            this.p1.y = v3.y - v1.x * v2.y + v1.y * v2.x;
            this.p2.x = v3.x + v1.x * v2.x - v1.y * v2.y;
            this.p2.y = v3.y + v1.x * v2.y + v1.y * v2.x;
            return this;
        },
        rotateOnUnit(rotation,unit){ // rotates line around unit dist from start point
            v4.x = (v2.x = Math.cos(rotation)) * unit;
            v4.y = (v2.y = Math.sin(rotation)) * unit;
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v3.x = this.p1.x + v1.x * unit;
            v3.y = this.p1.y + v1.y * unit;
            this.p1.x = v3.x - v1.x * v4.x - v1.y * v4.y;
            this.p1.y = v3.y - v1.x * v4.y + v1.y * v4.x;
            v2.x *= (1-unit);
            v2.y *= (1-unit);
            this.p2.x = v3.x + v1.x * v2.x - v1.y * v2.y;
            this.p2.y = v3.y + v1.x * v2.y + v1.y * v2.x;
            return this;
        },
        rotateOnDist(rotation,dist){ // rotates line around dist from start point
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            d = dist / Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            v4.x = (v2.x = Math.cos(rotation)) * d;
            v4.y = (v2.y = Math.sin(rotation)) * d;
            v3.x = this.p1.x + v1.x * d;
            v3.y = this.p1.y + v1.y * d;
            this.p1.x = v3.x - v1.x * v4.x - v1.y * v4.y;
            this.p1.y = v3.y - v1.x * v4.y + v1.y * v4.x;
            v2.x *= (1-d);
            v2.y *= (1-d);
            this.p2.x = v3.x + v1.x * v2.x - v1.y * v2.y;
            this.p2.y = v3.y + v1.x * v2.y + v1.y * v2.x;
            return this;
        },
        slide(distance){ // moves the line segment backwards (- distance) or forward (+distance)
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            if(distance === 0){ // to avoid infinite move
                v1.x = v1.y = 0; // to give the register use consistance;
                return this;
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = distance / Math.hypot(v1.x,v2.y);
            this.p1.x += (v1.x /= v2.x);
            this.p1.y += (v1.y /= v2.x);
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        slideUnit(unitDistance){ // moves the line segment a unit distance backwards (- distance) or forward (+distance). The unit is the lines length, thus to move the line half its length forward pass a value of 0.5
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            v1.x = (this.p2.x - this.p1.x) * unitDistance;
            v1.y = (this.p2.y - this.p1.y) * unitDistance;
            this.p1.x += v1.x;
            this.p1.y += v1.y;
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        offset( distance ){ // moves the line along its normal (to the line's right) by distance
            // this function uses Geom registers v1, v2
            // v1 is the vector of the distance moved;
            // v2.x is scaled normal distance to move
            if(distance === 0){ // to avoid infinite move
                v1.x = v1.y = 0; // to give the register use consistence;
                return this;
            }
            v1.y = this.p2.x - this.p1.x;
            v1.x = -(this.p2.y - this.p1.y);
            v2.x = distance / Math.hypot(v1.x,v1.y);
            this.p1.x += (v1.x *= v2.x);
            this.p1.y += (v1.y *= v2.x);
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        offsetUnit( unitDistance ){ // moves the line along its normal (to the line's right) by unitDistance. A unit is the length of the line
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            v1.y = (this.p2.x - this.p1.x) * unitDist;
            v1.x = (-this.p2.y - this.p1.y) * unitDist;
            this.p1.x += v1.x;
            this.p1.y += v1.y;
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        /*midLine(l1){ // this is bad must find a better way
            var len;
            var p = this.intercept(l1);
            var v1 = l1.asVec().setLeng(len = this.leng());
            var v1 = l1.asVec().setLeng(len = 100);
            var v2 = this.asVec().setLeng(len);
            v1  = p.copy().add(v1);
            v2 = p.copy().sub(v2);
            var v3 = v1.copy().sub(v2).half().add(v2);
            return new Line(p, p.copy().add(v3.sub(p).setLeng(len)));

        },*/
        scale(scale){
            this.p1.x *= scale;
            this.p1.y *= scale;
            this.p2.x *= scale;
            this.p2.y *= scale;
            return this; // returns this
        },
        translate(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this; // returns this
        },
        rotate(rotation){ // rotate line around origin
            v1.x = Math.cos(rotation);
            v1.y = Math.sin(rotation);
            v2.x = this.p1.x;
            v2.y = this.p1.y;
            this.p1.x = v2.x * v1.x + v2.y * -v1,y;
            this.p1.y = v2.x * v1.y + v2.y * v1.x;
            v2.x = this.p2.x;
            v2.y = this.p2.y;
            this.p2.x = v2.x * v1.x + v2.y * -v1,y;
            this.p2.y = v2.x * v1.y + v2.y * v1.x;
            return this; // returns this
        },
        transform(transform){
            return this; // returns this
        },
    }
    Rectangle.prototype = {
        top : undefined,
        aspect : 1,
        type : "Rectangle",
        _width : 0,
        _height : 0,
        copy() {
            return new Rectangle(this.top.copy(),this.aspect);
        },
        setAs(rectange){
            this.top.setAs(rectange.top);
            this.aspect = rectange.aspect;
            return this; // returns this.
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.top.p1.id === id || this.top.p2.id === id){
                return true;
            }
            return false;
        },
        isEmpty(){
            if(this.aspect <= 0 || this.aspect === Infinity || this.aspect === -Infinity || isNaN(this.aspect) || this.top === undefined || this.top.isEmpty()){
                return true;
            }
            return false;
        },
        toString(precision){
            var str;
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            if(this.isEmpty()){
                return "Rectangle : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Rectangle : "+l+"(";
            str += "Top : "+ this.top.toString(precision) + ", ";
            str += "Aspect : "+ this.aspect;
            str += ")";
            return str; // returns String
        },
        empty(){
            this.aspect = Infinity;
            return this;
        },
        replace(id, prim){  // replaces vec with id == id with the supplied vec
            if(id !== undefined){
                if(prim !== undefined){
                    if(prim.type === "Vec"){
                        if(this.top.p1.id === id){
                            this.top.p1 = prim;
                        }else
                        if(this.top.p2.id === id){
                            this.top.p2 = prim;
                        }
                    }else
                    if(prim.type === "Line"){
                        if(this.top.id === id){
                            this.top = prim;
                        }
                    }
                }
            }
            return this;
        },
        width(){
            return  Math.hypot(this.top.p2.y - this.top.p1.y, this.top.p2.x - this.top.p1.x);
        },
        height() {
            return Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x) * this.aspect;
        },
        setWidth(num){
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            var l = Math.hypot(v1.x,v1,y);
            this.top.p2.x = this.top.p1.x + v1.x * num / l;
            this.top.p2.y = this.top.p1.y + v1.y * num / l;
            this.aspect = (l * this.aspect) / num;
            return this;
        },
        lerp(from, dest, amount){
            this.top.p1.x = (dest.top.p1.x-from.top.p1.x) * amount + from.top.p1.x;
            this.top.p1.y = (dest.top.p1.y-from.top.p1.y) * amount + from.top.p1.y;
            this.top.p2.x = (dest.top.p2.x-from.top.p2.x) * amount + from.top.p2.x;
            this.top.p2.y = (dest.top.p2.y-from.top.p2.y) * amount + from.top.p2.y;
            this.aspect = (dest.aspect - from.aspect) * amount + from.aspect;
            return this;
        },
        setHeight(num){
            this.aspect = num / Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x)
            return this;
        },
        topLine(line){
            if(line === undefined){
                return this.top.copy();
            }
            line.p1.x = this.top.p1.x;
            line.p1.y = this.top.p1.y;
            line.p2.x = this.top.p2.x;
            line.p2.y = this.top.p2.y;
            return line;
        },
        leftLine(line){
            if(line === undefined){
                line = new Line();
            }
            line.p2.x = this.top.p1.x;
            line.p2.y = this.top.p1.y;
            line.p1.x = line.p2.x - (this.top.p2.y - this.top.p1.y) * this.aspect;
            line.p1.y = line.p2.y + (this.top.p2.x - this.top.p1.x) * this.aspect;
            return line;
        },
        rightLine(line){
            if(line === undefined){
                line = new Line();
            }
            line.p1.x = this.top.p2.x;
            line.p1.y = this.top.p2.y;
            line.p2.x = line.p1.x - (this.top.p2.y - this.top.p1.y) * this.aspect;
            line.p2.y = line.p1.y + (this.top.p2.x - this.top.p1.x) * this.aspect;
            return line;
        },
        bottomLine(line){
            if(line === undefined){
                line = new Line();
            }
            line.p1.x = this.top.p2.x - (v1.y = this.top.p2.y - this.top.p1.y) * this.aspect;
            line.p1.y = this.top.p2.y + (v1.x = this.top.p2.x - this.top.p1.x) * this.aspect;
            line.p2.x = line.p1.x - v1.x;
            line.p2.y = line.p1.y - v1.y;
            return line;
        },
        heightVec(vec){ // returns the vector from top to bottom. If vec is undefined a new vec is created else the supplied vec is used
            if(vec === undefined){
                vec = new Vec();
            }
            vec.x = -(this.top.p2.y - this.top.p1.y) * this.aspect;
            vec.y = (this.top.p2.x - this.top.p1.x) * this.aspect;
            return vec;
        },
        corners(vecArray) { // returns an vec array containing the corners from top left top right bottom roght bottom left. If vecArray is passed then the first 4 vecs are set to the new points
            // this function uses the Geom registers v1
            // v1 is the vector representing the side (height) from top to bottom
            if(vecArray === undefined){
                c = (vecArray = new VecArray()).vecs;
                c[0] = new Vec(this.top.p1);
                c[1] = new Vec(this.top.p2);
                v1.y = (c[1].x - c[0].x) * this.aspect;
                v1.x = -(c[1].y - c[0].y) * this.aspect;
                c[2] = new Vec(this.top.p2);
                c[3] = new Vec(this.top.p1);
            }else{
                c = vecArray.vecs;
                v1.y = ((c[2].x = c[1].x = this.top.p2.x) - (c[3].x = c[0].x = this.top.p1.x)) * this.aspect;
                v1.x = -((c[2].y = c[1].y = this.top.p2.y) - (c[3].y = c[0].y = this.top.p1.y)) * this.aspect;
            }
            c[2].x += v1.x;
            c[2].y += v1.y;
            c[3].x += v1.x;
            c[3].y += v1.y;
            return vecArray;
        },
        asVecArray(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.top.p1).push(this.top.p2);
                return vecArray;
            }

            vecArray.push(this.top.p1.copy()).push(this.top.p2.copy());
            return vecArray;
        },
        asBox(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.top.p1.x, this.top.p1.y);
            box.env ( this.top.p2.x, this.top.p2.y);
            var v = this.top.asVec().r90().mult(this.aspect);
            box.env ( this.top.p1.x + v.x, this.top.p1.y + v.y);
            box.env ( this.top.p2.x + v.x, this.top.p2.y + v.y);
            return box;
        },
        asCircle(circle){ // returns a bounding circle
            var l;
            if(circle === undefined){
                circle = new Circle();
            }
            circle.center.x = this.top.p1.x;
            circle.center.y = this.top.p1.y;
            circle.center.x += (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            circle.center.y += (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            circle.center.x += -v1.y * this.aspect;
            circle.center.y += v1.x * this.aspect;
            l = Math.hypot(v1.x,v1.y);
            circle.radius = Math.hypot(l,l * this.aspect);
            return circle;
        },
        asInnerCircle(circle){  // returns the largest circle that can fit inside
            var l;
            if(circle === undefined){
                circle = new Circle();
            }
            circle.center.x = this.top.p1.x;
            circle.center.y = this.top.p1.y;
            circle.center.x += (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            circle.center.y += (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            circle.center.x += -v1.y * this.aspect;
            circle.center.y += v1.x * this.aspect;
            l = Math.hypot(v1.x,v1.y);
            circle.radius = Math.min(l,l * this.aspect);
            return circle;
        },
        asTriangles(diagonal,array){ // if diagonal is false then the triangles meet at the line from top right to bottom left, else its top left to bottom right
            var newP = false; // flag to indicate if points need to be copied
            var c = this.corners();
            if(array === undefined){
                array = [];
            }
            var p0 = 0;
            var p1 = 1;
            var p2 = 2;
            if(diagonal === false){
                p2 = 3;
            }
            if(array[0] !== undefined){
                array[0].p1.x = c.vecs[p0].x;
                array[0].p1.y = c.vecs[p0].y;
                array[0].p2.x = c.vecs[p1].x;
                array[0].p2.y = c.vecs[p1].y;
                array[0].p3.x = c.vecs[p2].x;
                array[0].p3.y = c.vecs[p2].y;
            }else{
                array[0] = new Triangle(c.vecs[p0],c.vecs[p1],c.vecs[p2]);
                newP = true;
            }
            p0 = 2;
            p1 = 3;
            p2 = 0;
            if(diagonal === false){
                p0 = 1;
                p1 = 2;
                p2 = 3;
            }
            if(array[1] !== undefined){
                array[1].p1.x = c.vecs[p0].x;
                array[1].p1.y = c.vecs[p0].y;
                array[1].p2.x = c.vecs[p1].x;
                array[1].p2.y = c.vecs[p1].y;
                array[1].p3.x = c.vecs[p2].x;
                array[1].p3.y = c.vecs[p2].y;
            }else{
                if(newP){
                    array[1] = new Triangle(c.vecs[p0].copy(),c.vecs[p1],c.vecs[p2].copy());
                }else{
                    array[1] = new Triangle(c.vecs[p0],c.vecs[p1],c.vecs[p2]);
                }
            }
            return array;
        },
        asSimple(obj){ // returns a object or adds to obj the current state of this primitive. The obj will not contain the prototype chain of this primitive
            if(obj === undefined){
                obj = {};
            }
            obj.x1 = this.top.p1.x;
            obj.y1 = this.top.p1.y;
            obj.x2 = this.top.p2.x;
            obj.y2 = this.top.p2.y;
            obj.aspect = this.aspect;
            return obj;
        },
        fromSimple(obj){
            this.top.p1.x = obj.x1 === undefined ? 0 : obj.x1;
            this.top.p1.y = obj.y1 === undefined ? 0 : obj.y1;
            this.top.p2.x = obj.x2 === undefined ? 1 : obj.x2;
            this.top.p2.y = obj.y2 === undefined ? 0 : obj.y2;
            this.aspect = obj.aspect === undefined ? 1 : obj.aspect;
            return this;
        },
        slice(x, y, rect){
                // uses v1,v2,v3,v4
            var lw,lh;
            if(rect === undefined){
                rect = new Rectangle();
            }



            x = x < EPSILON ? 0 : x > EPSILON1 ? 1 : x;
            y = y < EPSILON ? 0 : y > EPSILON1 ? 1 : y;
            if(x === 0 && y === 0){
                rect.top.p1.x = this.top.p1.x;
                rect.top.p1.y = this.top.p1.y;
                rect.top.p2.x = this.top.p2.x;
                rect.top.p2.y = this.top.p2.y;
                rect.aspect = this.aspect;
                return rect;
            }
            if(x === 1 || y === 1){
                v3.x = x;
                v3.y = y;
                rect.top.p1.setAs(this.pointAt(v3,v4));
                rect.top.p2.setAs(rect.top.p1);
                rect.aspect = 0;
                return rect;
            }

            //Get top vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            // Get top length (width)
            lw = Math.hypot(v1.x,v1.y);
            lh = lw * this.aspect
            v1.x /= lw;
            v1.y /= lw;
            rect.top.p2.x = rect.top.p1.x = this.top.p1.x + v1.x * lw * x - v1.y * lh * y;
            rect.top.p2.y = rect.top.p1.y = this.top.p1.y + v1.y * lw * x + v1.x * lh * y;
            rect.top.p2.x += v1.x * lw * (1 - x);
            rect.top.p2.y += v1.y * lw * (1 - x);
            rect.aspect = (lh * (1 - y)) / (lw * (1 - x)) ;
            return rect;

        },
        asArc(where,radius,arc){
            var lw,lh,a,r,b,l;
            where = where.toLowerCase();
            if(arc === undefined){
                arc = new Arc();
            }

            //Get top vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            // Get top length (width)
            lw = (l = Math.hypot(v1.x,v1.y)) / 2;
            lh = lw * this.aspect;
            // get top direction
            a = direction(v1.x,v1.y);
            // normalise
            r = l ;
            b = lh * 2 ;

            v1.x /= l;
            v1.y /= l;

            l = Math.min(lw,lh);
            if(radius === undefined || radius === null){
                radius = l;
            }
            // for request get the arc
            if(where.indexOf("cap") > -1){
                if(where.indexOf("top") > -1){
                    arc.circle.radius = lw;
                    arc.circle.center.x = this.top.p1.x + v1.x * lw;
                    arc.circle.center.y = this.top.p1.y + v1.y * lw;
                    arc.start = a + MPI;
                    arc.end = arc.start + MPI;
                    return arc;
                }
                if(where.indexOf("bot") > -1){
                    arc.circle.radius = lw;
                    arc.circle.center.x = this.top.p1.x + v1.x * lw - v1.y * b;
                    arc.circle.center.y = this.top.p1.y + v1.y * lw + v1.x * b;
                    arc.start = a;
                    arc.end = arc.start + MPI;
                    return arc;
                }
                if(where.indexOf("left") > -1){
                    arc.circle.radius = lh;
                    arc.circle.center.x = this.top.p1.x - v1.y * lh;
                    arc.circle.center.y = this.top.p1.y + v1.x * lh;
                    arc.start = a + MPI90;
                    arc.end = arc.start + MPI;
                    return arc;
                }
                if(where.indexOf("right") > -1){
                    arc.circle.radius = lh;
                    arc.circle.center.x = this.top.p2.x - v1.y * lh;
                    arc.circle.center.y = this.top.p2.y + v1.x * lh;
                    arc.start = a + MPI270;
                    arc.end = arc.start + MPI;
                    return arc;
                }
            }
            if(where.indexOf("inner") > -1){
                if(where.indexOf("top") > -1){
                    if(where.indexOf("left") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * radius - v1.y * radius;
                        arc.circle.center.y = this.top.p1.y + v1.y * radius + v1.x * radius;
                        arc.start = a + MPI;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                    if(where.indexOf("right") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * (r - radius) - v1.y * radius;
                        arc.circle.center.y = this.top.p1.y + v1.y * (r - radius) + v1.x * radius;
                        arc.start = a + MPI270;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                }
                if(where.indexOf("bot") > -1){
                    if(where.indexOf("left") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * radius - v1.y * (b - radius);
                        arc.circle.center.y = this.top.p1.y + v1.y * radius + v1.x * (b - radius);
                        arc.start = a + MPI90;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                    if(where.indexOf("right") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * (r - radius) - v1.y * (b - radius);
                        arc.circle.center.y = this.top.p1.y + v1.y * (r - radius) + v1.x * (b - radius);
                        arc.start = a;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                }
            }
            return arc;

        },
        area() {
            var l = Math.hypot(this.top.p2.y - this.top.p1.y, this.top.p2.x - this.top.p1.x);
            return l * l * this.aspect;
        },
        inflate(units){ // Increases or decreases the rectange size keeping the same center so that all sides are moved units in or out. For rectangles that have a aspect !== 1 the aspect will change
            var w,h,ww,hh;
            h = (w = Math.hypot(v1.y = this.top.p2.y - this.top.p1.y, v1.x = this.top.p2.x - this.top.p1.x)) * this.aspect;
            v1.x /= w;
            v1.y /= w;
            ww = w + units * 2;
            hh = h + units * 2;
            this.top.p1.x -= v1.x * units - v1.y * units;
            this.top.p1.y -= v1.y * units + v1.x * units;
            this.top.p2.x = this.top.p1.x + ww * v1.x;
            this.top.p2.y = this.top.p1.y + ww * v1.y;
            this.aspect = hh / ww;
            return this;

        },
        heightFromArea(area){
            var l = Math.hypot(this.top.p2.y - this.top.p1.y, this.top.p2.x - this.top.p1.x);
            this.aspect  = (area / l) / l;
            return this; // returns this.
        },
        widthFromArea(area){
            var l = Math.hypot(v1.y = this.top.p2.y - this.top.p1.y, v1.x = this.top.p2.x - this.top.p1.x) ;
            var la = l * this.aspect;
            this.aspect = la / (lb =  area / la);
            this.top.p2.x = this.top.p1.x + v1.x * (l = lb/l);
            this.top.p2.y = this.top.p1.y + v1.y * (l);
            return this; // returns this.
        },
        perimiter() {
            var l = Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x);
            return l * 2 + l* this.aspect * 2;
        },
        diagonalLength() {
            var l = Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x);
            return Math.hypot(l,l* this.aspect);
        },
        center(vec) {
            if(vec === undefined){
                vec = this.top.p1.copy();
            }else{
                vec.x = this.top.p1.x;
                vec.y = this.top.p1.y;
            }
            vec.x += (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            vec.y += (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            vec.x += -v1.y * this.aspect;
            vec.y += v1.x * this.aspect;
            return vec;
        },
        setCenter(vec){ // moves rectangle to place its center at vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            v2.x = (-v1.y * this.aspect + v1.x)/2;
            v2.y = (v1.x * this.aspect + v1.y)/2;
            this.top.p2.x = this.top.p1.x = vec.x - v2.x;
            this.top.p2.y = this.top.p1.y = vec.y - v2.y;
            this.top.p2.x += v1.x;
            this.top.p2.y += v1.y;
            return this;
        },
        diagonalLine(line){
            if(line === undefined){
                line = new Line();
            }
            line.p1.x = this.top.p1.x;
            line.p1.y = this.top.p1.y;
            line.p2.y = this.top.p2.y + (this.top.p2.x - this.top.p1.x) * this.aspect;
            line.p2.x = this.top.p2.x - (this.top.p2.y - this.top.p1.y) * this.aspect;
            return line;
        },
        setDiagonalLine(line){
            // I do not like this solution as it seams a little to long. Need to find a better method
            var len = Math.hypot(v1.y = line.p2.y - line.p1.y, v1.x = line.p2.x - line.p1.x);
            v1.x /= len;
            v1.y /= len;
            var h = Math.sqrt( 1 + this.aspect * this.aspect);
            var ph = Math.atan(this.aspect);
            h = (1/h) * len;
            v2.x = Math.cos(-ph) * h;
            v2.y = Math.sin(-ph) * h;
            v3.x = v1.x * v2.x + v1.y * -v2.y;
            v3.y = v1.x * v2.y + v1.y * v2.x;

            this.top.p1.x = line.p1.x;
            this.top.p1.y = line.p1.y;
            this.top.p2.x = line.p1.x + v3.x;
            this.top.p2.y = line.p1.y + v3.y;
            return this;
        },
        bottomRight(vec) {
            if(vec === undefined){
                vec = this.top.p2.copy();
            }else{
                vec.x = this.top.p2.x;
                vec.y = this.top.p2.y;
            }
            vec.y += (this.top.p2.x - this.top.p1.x) * this.aspect;
            vec.x -= (this.top.p2.y - this.top.p1.y) * this.aspect;

            return vec;
        },
        setBottomRight(vec){ // moves rectangle to place its Bottom Right at vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            v2.x = (-v1.y * this.aspect + v1.x);
            v2.y = (v1.x * this.aspect + v1.y);
            this.top.p2.x = this.top.p1.x = vec.x - v2.x;
            this.top.p2.y = this.top.p1.y = vec.y - v2.y;
            this.top.p2.x += v1.x;
            this.top.p2.y += v1.y;
            return this;
        },
        setTopRight(vec){ // moves rectangle to place its Bottom Right at vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            this.top.p2.x = this.top.p1.x = vec.x;
            this.top.p2.y = this.top.p1.y = vec.y;
            this.top.p2.x += v1.x;
            this.top.p2.y += v1.y;
            return this;
        },
        isRectangleTouching(rectangle){
            if(! this.asCircle().touching(rectangle.asCircle())){
                return false;
            }
            if(this.top.isLineSegIntercepting(rectangle.top)){
                return true;
            }
            var rll,rlb,rlr;
            if(this.top.isLineSegIntercepting(rll = rectangle.leftLine()) ||
                this.top.isLineSegIntercepting(rlb = rectangle.bottomLine()) ||
                this.top.isLineSegIntercepting(rlr = rectangle.rightLine())){
                return true;
            }
            var ll = this.leftLine();
            if(ll.isLineSegIntercepting(rectangle.top) ||
                ll.isLineSegIntercepting(rll) ||
                ll.isLineSegIntercepting(rlb) ||
                ll.isLineSegIntercepting(rlr) ){
                return true;
            }
            var ll = this.bottomLine();
            if(ll.isLineSegIntercepting(rectangle.top) ||
                ll.isLineSegIntercepting(rll) ||
                ll.isLineSegIntercepting(rlb) ||
                ll.isLineSegIntercepting(rlr) ){
                return true;
            }
            var ll = this.rightLine();
            if(ll.isLineSegIntercepting(rectangle.top) ||
                ll.isLineSegIntercepting(rll) ||
                ll.isLineSegIntercepting(rlb) ||
                ll.isLineSegIntercepting(rlr) ){
                return true;
            }
            if(this.isRectangleInside(rectangle) || rectangle.isRectangleInside(this)){
                return true;
            }
            return false;
        },
        isRectangleInside(rectangle){ // there is room for more optimisation.
            var x1,y1,x2,y2,x3,y3,x4,y4;
            v1.x = x2 = this.top.p2.x - this.top.p1.x;
            v1.y = y2 = this.top.p2.y - this.top.p1.y;
            x1 = rectangle.top.p1.x - this.top.p1.x
            y1 = rectangle.top.p1.y - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            x1 = rectangle.top.p2.x - this.top.p1.x
            y1 = rectangle.top.p2.y - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            x1 = rectangle.top.p1.x - (x3 = this.top.p2.x - y2 * this.aspect);
            y1 = rectangle.top.p1.y - (y3 = this.top.p2.y + x2 * this.aspect);
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x1 = rectangle.top.p2.x - x3;
            y1 = rectangle.top.p2.y - y3;
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x4 = (rectangle.top.p2.x - rectangle.top.p1.x) * rectangle.aspect;
            y4 = (rectangle.top.p2.y - rectangle.top.p1.y) * rectangle.aspect;

            x1 = rectangle.top.p1.x - y4 - this.top.p1.x
            y1 = rectangle.top.p1.y + x4 - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            x1 = rectangle.top.p2.x - y4 - this.top.p1.x
            y1 = rectangle.top.p2.y + x4 - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }

            x1 = rectangle.top.p1.x - y4 - x3;
            y1 = rectangle.top.p1.y + x4 - y3;
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x1 = rectangle.top.p2.x - y4 - x3;
            y1 = rectangle.top.p2.y + x4 - y3;
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            return true;
        },
        isBoxInside(box){ // 7/17 working
			v3.x = box.left;
			v3.y = box.top;
			if(this.isPointInside(v3)){
				v1.x = box.right - this.top.p1.x
				v1.y = box.top - this.top.p1.y
				if(v2.x * v1.y - v2.y * v1.x < 0 || -v2.y * v1.y - v2.x * v1.x > 0){return false }
				v1.x = box.right - (this.top.p2.x - v2.y * this.aspect);
				v1.y = box.top - (this.top.p2.y + v2.x * this.aspect);
				if(v2.x * v1.y - v2.y * v1.x > 0 || -v2.y * v1.y - v2.x * v1.x < 0){ return false }
				v1.x = box.right - this.top.p1.x
				v1.y = box.bottom - this.top.p1.y
				if(v2.x * v1.y - v2.y * v1.x < 0 || -v2.y * v1.y - v2.x * v1.x > 0){return false }
				v1.x = box.right - (this.top.p2.x - v2.y * this.aspect);
				v1.y = box.bottom - (this.top.p2.y + v2.x * this.aspect);
				if(v2.x * v1.y - v2.y * v1.x > 0 || -v2.y * v1.y - v2.x * v1.x < 0){ return false }
				v1.x = box.left - this.top.p1.x
				v1.y = box.bottom - this.top.p1.y
				if(v2.x * v1.y - v2.y * v1.x < 0 || -v2.y * v1.y - v2.x * v1.x > 0){return false }
				v1.x = box.left - (this.top.p2.x - v2.y * this.aspect);
				v1.y = box.bottom - (this.top.p2.y + v2.x * this.aspect);
				if(v2.x * v1.y - v2.y * v1.x > 0 || -v2.y * v1.y - v2.x * v1.x < 0){ return false }
				return true;

			}
			return false;
        },
		isBoxTouching(box){  // 7/17 working
			if(box.isPointInside(this.top.p1)) { return true }
			if(box.isPointInside(this.top.p2)) { return true }
			v3.x = box.left;
			v3.y = box.top;
			if(this.isPointInside(v3)) { return true }
            l2.p2.x = this.top.p1.x - v2.y * this.aspect;
            l2.p2.y = this.top.p1.y + v2.x * this.aspect;
			if(box.isPointInside(l2.p2)) { return true }
            l2.p1.x = l2.p2.x + v2.x;
            l2.p1.y = l2.p2.y + v2.y;
			if(box.isPointInside(l2.p1)) { return true }
			v3.x = box.right;
			if(this.isPointInside(v3)) { return true }
			v3.y = box.bottom;
			if(this.isPointInside(v3)) { return true }
			v3.x = box.left;
			if(this.isPointInside(v3)) { return true }
			// box may not have been normalized hence the Math.min(box.top,box.bottom)
			if(Math.min(box.top,box.bottom) > Math.max(this.top.p1.y, this.top.p2.y, l2.p1.y, l2.p2.y)) { return false }
			if(Math.max(box.top,box.bottom) < Math.min(this.top.p1.y, this.top.p2.y, l2.p1.y, l2.p2.y)) { return false }
			if(Math.min(box.left,box.right) > Math.max(this.top.p1.x, this.top.p2.x, l2.p1.x, l2.p2.x)) { return false }
			if(Math.max(box.left,box.right) < Math.min(this.top.p1.x, this.top.p2.x, l2.p1.x, l2.p2.x)) { return false }
			l1.p1.x = box.left;
			l1.p1.y = box.top;
			l1.p2.x = box.right;
			l1.p2.y = box.top;
			l3.p1.x = this.top.p1.x;
			l3.p1.y = this.top.p1.y;
			l3.p2.x = l2.p2.x;
			l3.p2.y = l2.p2.y;
			l4.p1.x = this.top.p2.x;
			l4.p1.y = this.top.p2.y;
			l4.p2.x = l2.p1.x;
			l4.p2.y = l2.p1.y;

			if(this.top.isLineSegIntercepting(l1) || l2.isLineSegIntercepting(l1) ) { return true }
			if(l3.isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l1) ) { return true }
			l1.p1.x = box.left;
			l1.p1.y = box.bottom;
			l1.p2.x = box.right;
			l1.p2.y = box.bottom;
            if(this.top.isLineSegIntercepting(l1) || l2.isLineSegIntercepting(l1) ) { return true }
			if(l3.isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l1) ) { return true }
			l1.p1.x = box.left;
			l1.p1.y = box.top;
			l1.p2.x = box.left;
			l1.p2.y = box.bottom;
			if(this.top.isLineSegIntercepting(l1) || l2.isLineSegIntercepting(l1) ) { return true }
			if(l3.isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l1) ) { return true }
			l1.p1.x = box.right;
			l1.p1.y = box.top;
			l1.p2.x = box.right;
			l1.p2.y = box.bottom;
			if(this.top.isLineSegIntercepting(l1) || l2.isLineSegIntercepting(l1) ) { return true }
			if(l3.isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l1) ) { return true }
			return false;
		},
        isCircleInside(circle){  // Tested working 7/17
		    if(this.isCircleTouching(circle)){
				if(a < u - circle.radius && b < u1 - circle.radius){ return true }
			}
			return false;
        },
        isCircleTouching(circle){ // Tested working 7/17
            vc.x = this.top.p1.x + (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            vc.y = this.top.p1.y + (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            v3.x = -v1.y * this.aspect;
            v3.y = v1.x * this.aspect;
            u1 = (u = Math.hypot(v1.x,v1.y)) * this.aspect;
            v2.x = circle.center.x - (vc.x + v3.x);
            v2.y = circle.center.y - (vc.y + v3.y);
            if((a = Math.abs((v2.x * v1.x + v2.y * v1.y) / u )) > circle.radius + u){ return false }
            if((b = Math.abs((v2.x * v3.x + v2.y * v3.y) / u1 )) > circle.radius + u1){ return false }
			if( a > u && b > u1){
				a1 = a - u;
				b1 = b - u1;
				if(Math.sqrt(a1 * a1 + b1 * b1) > circle.radius){ return false }
			}
            return true;
        },
        isArcTouching(arc){ // Not complete Not tested
			if(this.isPointInside(arc.startAsVec(va)) || this.isPointInside(arc.endAsVec(va))){ return true }
		    if(this.isCircleTouching(arc.circle)) {
				arc.interceptLineSeg(this.top,va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return true }
				arc.interceptLineSeg(this.bottomLine(l2),va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return true }
				arc.interceptLineSeg(this.leftLine(l2),va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return true }
				arc.interceptLineSeg(this.rightLine(l2),va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return true }
			}

            return false;
        },
        isArcInside(arc){ // Not complete Not tested
		    if(this.isCircleInside(arc.circle)) { return true }
			arc.endsAsVec(l1.p1,l1.p2);
			if(this.isLineInside(l1)){
				arc.interceptLineSeg(this.top,va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return false }
				arc.interceptLineSeg(this.bottomLine(l2),va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return false }
				arc.interceptLineSeg(this.leftLine(l2),va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return false }
				arc.interceptLineSeg(this.rightLine(l2),va,vb);
				if(!va.isEmpty() || ! vb.isEmpty()){ return false }
				return true;
			}
            return false;
        },
        isPointInside(vec){ // Tested working 7/17
            v1.x = vec.x - this.top.p1.x
            v1.y = vec.y - this.top.p1.y
            v2.x = this.top.p2.x - this.top.p1.x;
            v2.y = this.top.p2.y - this.top.p1.y;
            if(v2.x * v1.y - v2.y * v1.x < 0 || -v2.y * v1.y - v2.x * v1.x > 0){return false }
            v1.x = vec.x - (this.top.p2.x - v2.y * this.aspect);
            v1.y = vec.y - (this.top.p2.y + v2.x * this.aspect);
            if(v2.x * v1.y - v2.y * v1.x > 0 || -v2.y * v1.y - v2.x * v1.x < 0){ return false }
            return true;

        },
		isPointTouching(vec){ // Tested working 7/17
			return this.isPointInside(vec);
		},
        isLineInside(line){ // Tested working 7/17
			if(this.isPointInside(line.p1)){
				v1.x = line.p2.x - this.top.p1.x
				v1.y = line.p2.y - this.top.p1.y
				if(v2.x * v1.y - v2.y * v1.x < 0 || -v2.y * v1.y - v2.x * v1.x > 0){return false }
				v1.x = line.p2.x - (this.top.p2.x - v2.y * this.aspect);
				v1.y = line.p2.y - (this.top.p2.y + v2.x * this.aspect);
				if(v2.x * v1.y - v2.y * v1.x > 0 || -v2.y * v1.y - v2.x * v1.x < 0){ return false }
				return true;
			}
			return false;
        },
        isLineTouching(line){  // Tested working 7/17
			if(this.top.isLineSegIntercepting(line) ||
              this.leftLine().isLineSegIntercepting(line) ||
			  this.bottomLine().isLineSegIntercepting(line) ||
			  this.rightLine().isLineSegIntercepting(line) ) {
                return true;
            }
            return this.isLineInside(line);
        },
		isTriangleInside(triangle){
			if(this.isPointInside(triangle.p1) && this.isPointInside(triangle.p2) && this.isPointInside(triangle.p3)){
				return true;
			}
		},
        isTriangleTouching(triangle){  // Tested working 7/17
			if(this.isPointInside(triangle.p1) || this.isPointInside(triangle.p2) || this.isPointInside(triangle.p3)) { return true }
			if(triangle.isRectangleInside(this)){ return true }
			l1.p1.x = triangle.p1.x;
			l1.p1.y = triangle.p1.y;
			l1.p2.x = triangle.p2.x;
			l1.p2.y = triangle.p2.y;
			if(this.top.isLineSegIntercepting(l1)) { return true }
			l2.p1.x = triangle.p2.x;
			l2.p1.y = triangle.p2.y;
			l2.p2.x = triangle.p3.x;
			l2.p2.y = triangle.p3.y;
			if(this.top.isLineSegIntercepting(l2)) { return true }
			l3.p1.x = triangle.p3.x;
			l3.p1.y = triangle.p3.y;
			l3.p2.x = triangle.p1.x;
			l3.p2.y = triangle.p1.y;
			if(this.top.isLineSegIntercepting(l3)) { return true }
			if(this.leftLine(l4).isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l2) || l4.isLineSegIntercepting(l3)) { return true }
			if(this.rightLine(l4).isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l2) || l4.isLineSegIntercepting(l3)) { return true }
			if(this.bottomLine(l4).isLineSegIntercepting(l1) || l4.isLineSegIntercepting(l2) || l4.isLineSegIntercepting(l3)) { return true }
			return false;

        },
        setTransform :function (ctx){   // temp location of this function
            if(ctx === undefined || ctx === null){
                if(typeof this.getCTX === "function"){
                    ctx = this.getCTX()
                }else{
                    return this;
                }
            }
            var xa = new Vec(null,this.top.dir());
            ctx.setTransform(xa.x, xa.y, -xa.y * this.aspect, xa.x * this.aspect, this.top.p1.x, this.top.p1.y);
            return this;  // returns this.
        },
        setTransformArea(ctx, width, height){ // temp location of this function
            if(ctx === undefined || ctx === null){
                if(typeof this.getCTX === "function"){
                    ctx = this.getCTX()
                }else{
                    return this;
                }
            }            var l = this.top.leng();
            var xa = new Vec(null,this.top.dir()).mult(l/width);
            var ya = new Vec(null,this.top.dir()).mult((l* this.aspect)/width);
            ctx.setTransform(xa.x, xa.y, -ya.y, ya.x, this.top.p1.x, this.top.p1.y);
            return this;  // returns this.
        },
        interceptingLineSeg(line, retLineSeg){ // returns the line segment that intercepts therectange
            var l,radius, dist, l1, vx,vy,cx,cy,foundStart, done;

            // get center of rect  (cx,cy), top as vec (v1) and side as vec (v3)
            cx = this.top.p1.x + (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            cy = this.top.p1.y + (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            cx += v3.x = -v1.y * this.aspect;
            cy += v3.y = v1.x * this.aspect;
            // get bounding circle radius
            this._width = (l = Math.hypot(v1.x,v1.y)) * 2;
            radius = Math.hypot(l,l * this.aspect);

            // get line as vec (v4)
            v4.x = line.p2.x - line.p1.x;
            v4.y = line.p2.y - line.p1.y;
            // get line length l1 and stash _leng for optimisation
            line._leng = l1 = Math.hypot(v4.y, v4.x);
            // get the distance from rect center to closest point on the line
            v5.x = cx - line.p1.x;
            v5.y = cy - line.p1.y;
            l = (v5.x * v4.x + v5.y * v4.y) / (l1 * l1);
            dist = Math.hypot(v4.x * l + line.p1.x - cx, v4.y * l + line.p1.y - cy);

            if(retLineSeg === undefined){
                retLineSeg = line.copy();
            }
            if(dist > radius){  // if the distance from bounding circle to line is greater than the circle radis then no intercep
                // return an empty line by setting the start to equal the end
                retLineSeg.p2.x = retLineSeg.p1.x;
                retLineSeg.p2.y = retLineSeg.p1.y;
                return retLineSeg
            }

            // the line may cross the rectange

            // flag if first point found
            foundStart = false;

            // flag for all poits found
            done = false;

            // return the vecs for top and left to full lengths
            v3.x *= 2;
            v3.y *= 2;
            v1.x *= 2;
            v1.y *= 2;

            // copy the top line to reduce code complexity
            v2.x = this.top.p1.x;
            v2.y = this.top.p1.y;
            v5.x = this.top.p2.x;
            v5.y = this.top.p2.y;

            // get cross products
            var cross = v1.x * v4.y - v1.y * v4.x;
            var crossLine  = line.p1.x * line.p2.y - line.p1.y * line.p2.x;
            var cross1  = v2.x * v5.y - v2.y * v5.x;

            // get intercept of line with tp[
            va.x = ((vx = crossLine * v1.x) - cross1 * v4.x) / cross;
            va.y = ((vy = crossLine * v1.y) - cross1 * v4.y) / cross;

            // get distance of intercept from rect center
            if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                foundStart = true;
                retLineSeg.p1.x = va.x;
                retLineSeg.p1.y = va.y;
            };


            // move top line to bottom
            v2.x += v3.x;
            v2.y += v3.y;
            v5.x += v3.x;
            v5.y += v3.y;

            // get bottom line cross product

            cross1  = v2.x * v5.y - v2.y * v5.x;

            // get intercept of line with bottom
            va.x = (vx - cross1 * v4.x) / cross;
            va.y = (vy - cross1 * v4.y) / cross;

            // get distance of intercept from rect center  and add point is on rect permiter
            if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                if(foundStart){
                    retLineSeg.p2.x = va.x;
                    retLineSeg.p2.y = va.y;
                    done = true;
                }else{
                    foundStart = true;
                    retLineSeg.p1.x = va.x;
                    retLineSeg.p1.y = va.y;
                }
            };

            // dont test any more if two points found
            if (!done) {
                // get left line
                v2.x = this.top.p1.x;
                v2.y = this.top.p1.y;
                v5.x = v2.x + v3.x;
                v5.y = v2.y + v3.y;

                // caculate cross
                cross = v3.x * v4.y - v3.y * v4.x;
                cross1  = v2.x * v5.y - v2.y * v5.x;

                // get intercept of line with left
                va.x = ((vx = crossLine * v3.x) - cross1 * v4.x) / cross;
                va.y = ((vy = crossLine * v3.y) - cross1 * v4.y) / cross;

                // get distance of intercept from rect center  and add point is on rect permiter
                if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                    if(foundStart){
                        retLineSeg.p2.x = va.x;
                        retLineSeg.p2.y = va.y;
                        done = true;
                    }else{
                        foundStart = true;
                        retLineSeg.p1.x = va.x;
                        retLineSeg.p1.y = va.y;
                    }
                }

                // dont test any more if two points found
                if (!done) {

                    // get right line
                    v2.x += v1.x;
                    v2.y += v1.y;
                    v5.x += v1.x;
                    v5.y += v1.y;

                    // caculate cross
                    cross1  = v2.x * v5.y - v2.y * v5.x;

                    // get intercept of line with left
                    va.x = (vx - cross1 * v4.x) / cross;
                    va.y = (vy - cross1 * v4.y) / cross;

                    // get distance of intercept from rect center  and add point is on rect permiter
                    if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                        if(foundStart){
                            retLineSeg.p2.x = va.x;
                            retLineSeg.p2.y = va.y;
                            done = true;
                        }else{
                            foundStart = true;
                            retLineSeg.p1.x = va.x;
                            retLineSeg.p1.y = va.y;
                        }
                    }
                }
            }

            if(!done){
                // line does not cross rect perimiter so return empty line
                retLineSeg.p2.x = retLineSeg.p1.x;
                retLineSeg.p2.y = retLineSeg.p1.y;
                return retLineSeg;
            }

            // now just need to make sure the new line is in the correct direction
            v2.x = retLineSeg.p2.x - retLineSeg.p1.x;
            v2.y = retLineSeg.p2.y - retLineSeg.p1.y;

            if(v2.x * v4.x - v2.y * - v4.y < 0){
                // line seg is the wrong way around so swap
                cx = retLineSeg.p1;
                retLineSeg.p1 = retLineSeg.p2;
                retLineSeg.p2 = cx;
            }

            // all done return the line segment
            return retLineSeg;

        },
        pointAt(point,vec){  // point is a relative unit coordinate on the rectangle
                                    // uses v1,v2
            if(vec === undefined){
                vec = new Vec(this.top.p1);
            }else{
                vec.x = this.top.p1.x;
                vec.y = this.top.p1.y;
            }
            v2.y = (v1.x = this.top.p2.x - this.top.p1.x) * this.aspect * point.y;
            v2.x = -(v1.y = this.top.p2.y - this.top.p1.y) * this.aspect * point.y;
            vec.x += v1.x * point.x + v2.x;
            vec.y += v1.y * point.x + v2.y;
            return vec;
        },
        localPoint(vec,rVec){ // returns a vec that is the unit coordinates on the rectangle
            var dy = this.top.distFromDir(vec);
            var dx = this.leftLine().distFromDir(vec);
            u = this.top.leng();
            u1 = u * this.aspect;
            if(rVec === undefined){
                return new Vec(dx/u,dy/u1);
            }
            rVec.x = dx / u;
            rVec.y = dy / u1;
            return rVec;
        },
        scaleToFitIn(obj){
            if(obj.type === "rectangel"){
                return this;
            }
            if(obj.type === "box"){
                return this;
            }
            if(obj.type === "circle"){
                return this;
            }
        },
        scale(scale){
            this.top.p1.x *= scale;
            this.top.p1.y *= scale;
            this.top.p2.x *= scale;
            this.top.p2.y *= scale;
            return this; // returns this
        },
        translate(vec){
            this.top.p1.x += vec.x;
            this.top.p1.y += vec.y;
            this.top.p2.x += vec.x;
            this.top.p2.y += vec.y;
            return this; // returns this
        },
        rotate(rotation){
            var dx = Math.cos(rotation);
            var dy = Math.sin(rotation);
            var x = this.top.p1.x;
            var y = this.top.p1.y;
            this.top.p1.x = x * dx + y * -dy;
            this.top.p1.y = x * dy + y * dx;
            x = this.top.p2.x;
            y = this.top.p2.y;
            this.top.p2.x = x * dx + y * -dy;
            this.top.p2.y = x * dy + y * dx;
            return this; // returns this
        },
        transform(transform){
            return this; // returns this
        },
    }
    Box.prototype = {
        top : 0,
        bottom : 0,
        left : 0,
        right : 0,
        type : "Box",
        copy(){
            return new Box (this.left,this.top,this.right,this.bottom);
        },
        setAs(box){
            this.top = box.top;
            this.left = box.left;
            this.right = box.right;
            this.bottom = box.bottom;
            return this; // returns this.
        },
        asBox(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env(this.left,this.top);
            box.env(this.right,this.bottom);
            return box;
        },
        asSimple(obj){ // returns the box as a simple object with left,right,bottom,top,width,height
            if(obj === undefined){
                obj = {};
            }
            obj.width = this.right - this.left;
            obj.height = this.bottom - this.top;
            obj.top = this.top;
            obj.right = this.right;
            obj.left = this.left;
            obj.bottom = this.bottom;
            return obj;
        },
        fromSimple(obj){
             this.top = obj.top === undefined ? 0 : obj.top;
             this.right = obj.right === undefined ? 0 : obj.right;
             this.bottom = obj.bottom === undefined ? 0 : obj.bottom;
             this.left = obj.left === undefined ? 0 : obj.left;
             return this;
        },
        asVecArray(vecArray){ // nothing to add to the vecArray
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            return vecArray;
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            return false;
        },
        lerp(from, dest, amount){
           this.top = (dest.top - from.top) * amount + from.top;
           this.right = (dest.right - from.right) * amount + from.right;
           this.left = (dest.left - from.left) * amount + from.left;
           this.bottom = (dest.bottom - from.bottom) * amount + from.bottom;
           return this;
        },
        isVecInside(vec){
            if(vec.x >= this.left && vec.x <= this.right && vec.y >= this.top && vec.y <= this.bottom){ return true }
            return false;
        },
        isPointInside(point){
            if(point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom){ return true }
            return false;
        },
        isVecArrayInside(vecArray){
            var inside = true;
            var me = this;

            vec.each(function (vec){
                if(!me.isVecInside(vec)){
                    inside = false;
                    return false;  // break from itteration
                }
            });
            return inside;
        },
        isLineInside(line){
            return (this.isVecInside(line.p1) && this.isVecInside(line.p2));
            return false;
        },
        isRectangleInside(rectange){
            return this.isVectArrayInside(rectangle.getCorners());
        },
        isCircleInside(circle){
            var vec = circle.center;
            var r = circle.radius;
            if(vec.x >= this.left + r && vec.x <= this.right - r && vec.y >= this.top + r && vec.y <= this.bottom - r){
                return true;
            }
            return false;
        },
        isBoxInside(box){
            if(box.left >= this.left && box.right <= this.right && box.top >= this.top && box.bottom <= this.bottom){
                return true;
            }
            return false;
        },
        isBoxTouching(box){ // returns true if this box is touching the given box. Warning both boxes are normalised
            this.normalise();
            box.normalise();
            if(this.top > box.bottom || this.bottom < box.top || this.left > box.right || this.right < box.left){
                return false;
            }
            return true;
        },
        isBoxOverlapping(box){ // returns true if boxes overlap. This is different from touching as boxes can touch yet not over lap
            this.normalise();
            box.normalise();
            if(this.top >= box.bottom || this.bottom <= box.top || this.left >= box.right || this.right <= box.left){
                return false;
            }
            return true;

        },
        isLineTouching(Line){ // stub
            return undefined;
        },
        isArcTouching(arc){ // stub
            return undefined;
        },
        isRectangleTouching(Rectange){ // stub
            return undefined;
        },
        isTriangleTouching(Triangle){ // stub
            return undefined;
        },
        isBezierTouching(bezier){ // stub
            return undefined;
        },
        isInside(primitive){
            var call = this["is"+primitive.type+"Inside"];
            if(call !== undefined){
                return call(primitive);
            }
            return false;
        },
        isEmpty(){
            if(this.top >= this.bottom || this.left >= this.right){
                return true;
            }
            if(isNaN(this.top) || isNaN(this.left) || isNaN(this.right) || isNaN(this.bottom)){
                return true;
            }
            return false;
        },
        empty(){
            return this.irrate();
        },
        toString(precision){
            var str;
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            if(this.isEmpty()){
                return "Box : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Box : "+l+"(";
            str += "Top : "+ this.top + ", ";
            str += "Left : "+ this.left + ", ";
            str += "Right : "+ this.right + ", ";
            str += "Bottom : "+ this.bottom ;
            str += ")";
            return str; // returns String
        },
        add(vec){
            this.top += vec.y;
            this.bottom += vec.y;
            this.left += vec.x;
            this.right += vec.x;
            return this;
        },
        pad(amount){  // pads the box by amount. Amount can be negative.The box may be irrate meaningless as a result of negative amount
            this.top -= amount;
            this.bottom += amount;
            this.left -= amount;
            this.right += amount;
            return this;
        },
        padWidth(amount){ // pads the box width by amount, negative values shrink the box
            this.left -= amount;
            this.right += amount;
        },
        padHeight(amount){ // pads the box height by amount, negative values shrink the box
            this.top -= amount;
            this.bottom += amount;
        },
        min(width, height){ // pads the box if height and/or width is under the min
            if((a = this.right - this.left) < width){
                a = (width - a) / 2;
                this.left -= a;
                this.right += a;
            }
            if((b = this.bottom - this.top) < height){
                b = (height - b) / 2;
                this.top -= b;
                this.bottom += b;
            }
        },
        asRectangle(retRect) {  // returns a rectangle. If retRect is supplied then sets that else creates a new rectangle
            a = (this.bottom- this.top)  / (this.right- this.left);
            if(retRect === undefined){
                return new Rectangle ( new Line( new Vec(this.left,this.top),new Vec(this.right,this.top)), a)
            }
            retRect.p1.x = this.left;
            retRect.p2.y = retRect.p1.y = this.top;
            retRect.p2.x = this.right;
            retRect.aspect = a;
            return retRect;
        },
        center(vec){ // returns the center as a vec. If vec supplied then use that, else creates a new vec
            if(vec === undefined){
                vec = new Vec();
            }
            vec.x = (this.left + this.right)/2;
            vec.y = (this.top + this.bottom)/2;
            return vec;

        },
        normalise(){ // ensures that all values are correct
            a = this.top < this.bottom ? this.top : this.bottom; // quicker than using Math.min
            b = this.top >= this.bottom ? this.top : this.bottom; // quicker than using Math.max
            c = this.left < this.right ? this.left : this.right; // quicker than using Math.min
            d = this.left >= this.right ? this.left : this.right; // quicker than using Math.max
            this.top = a;
            this.bottom = b;
            this.left = c;
            this.right = d;
            return this; // returns this.
        },
        max(){ // max the box Infinitely large
            this.top = -Infinity;
            this.bottom = Infinity;
            this.left = -Infinity;
            this.right = Infinity;
            return this; // returns this.
        },
        width(){  // returns the width of the box
            return this.right-this.left;
        },
        height(){ // returns the height of the box
            return this.bottom - this.top;
        },
        irrate(){
            this.top = Infinity;
            this.bottom = -Infinity;
            this.left = Infinity;
            this.right = -Infinity;
            return this; // returns this.
        },
		env(x, y){
            if(y !== undefined && y !== null){
                this.top = Math.min(y,this.top);
                this.bottom = Math.max(y,this.bottom);
            }
            if(x !== undefined && x !== null){
				if(x.type === "Vec"){
					this.left = Math.min(x.x,this.left);
					this.right = Math.max(x.x,this.right);
					this.top = Math.min(x.y,this.top);
					this.bottom = Math.max(x.y,this.bottom);
				}else{
					this.left = Math.min(x,this.left);
					this.right = Math.max(x,this.right);
				}
            }
            return this; // returns this.
        },
        envBox(box){
            this.top = Math.min(box.top,this.top);
            this.bottom = Math.max(box.bottom,this.bottom);
            this.left = Math.min(box.left,this.left);
            this.right = Math.max(box.right,this.right);
            return this; // returns this.
        },
        envelop(obj){
            if(geomInfo.isPrimitive(obj)){
                this.envBox(obj.asBox());
            }
            return this; // returns this.
        }
    }
    Bezier.prototype = {
        p1 : undefined,
        p2 : undefined,
        cp1 : undefined,
        cp2 : undefined,
        type : "Bezier",
        _subStart : undefined, // these are the start and end positions if the bezier is derived from a another bezier using functions such as splitAt
        _subEnd : undefined,
        //======================================================================================
        // single dimension polys for 2nd (a,b,c) and 3rd (a,b,c,d) order bezier
        //======================================================================================
        // for quadratic F(t) = a(1-t)^2+2b(1-t)t+ct^2 = a+2(-a+b)t+(a-2b+c)t^2
        // The derivative  =  2(1-t)(b-a)+2(c-b)t
        //======================================================================================
        // for cubic F(t) = a(1-t)^3 + 3bt(1-t)^2 + 3c(1-t)t^2 + dt^3 = a+(-2a+3b)t+(2a-6b+3c)t^2+(-a+3b-3c+d)t^3
        // The derivative  = -3a(1-t)^2+b(3(1-t)^2-6(1-t)t)+c(6(1-t)t-3t^2) +3dt^2
        // The 2nd derivative = 6*(1-t)*(c - 2*b + a) + 6*t*(d - 2*c + b)
        // From Math.js next two lines are first and second derivatives (have not checked if this is correct)
        // 3(d-3)t^2 - 3a(1-t)^2 + -(6bt(1-t)) + 3b(1-t)^2 + 6c(1-t)t
        // 6(a+6)(1-t) - (6b(1-t)-6bt) + 6(d-9)t + -(6b(1-t))
        //======================================================================================
        // Note: The behaviour of the second control point is as yet not determined. It may change as test presents the functionality required

        copy(){
            return (new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), this.cp2 === undefined ? null : this.cp2.copy()))._setSpan(this._subStart,this._subEnd);
        },
        setAs(bezier){
            this.p1.x = bezier.p1.x;
            this.p1.y = bezier.p1.y;
            this.p2.x = bezier.p2.x;
            this.p2.y = bezier.p2.y;
            this.cp1.x = bezier.cp1.x;
            this.cp1.y = bezier.cp1.y;
            this._subStart = bezier._subStart;
            this._subEnd = bezier._subEnd;
            if(bezier.cp2 === undefined){
                this.cp2 = undefined;
            }else{
                if(this.cp2 === undefined){
                    this.cp2 = new Vec(bezier.cp2);
                }else{
                    this.cp2.x = bezier.cp2.x;
                    this.cp2.y = bezier.cp2.y;
                }
            }
            return this;
        },
        _setSpan(f,t){ // Span is used when a bezier is sliced or cut. This allows calculations to still be relative to the origin bezier. The span is the start and end position of this bezier on the original bezier it was derived from.
            this._subStart = f;
            this._subEnd = t;
            return this;
        },
        toString(precision){
            var str;
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            if(this.isEmpty()){
                return "Bezier : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Bezier : "+l+"(";
            str += " API incomplete )";
            return str; // returns String
        },
        getHash(){ // returns a unique hash value for the lines current state
            var hash = 0;
            if(!isNaN(this.id)){
                hash += this.id;
            }
            hash += this.p1.getHash();
            hash += this.p2.getHash();
            hash += this.cp1.getHash();
            if(this.cp2 !== undefined){
                hash += this.cp2.getHash();
            }
            return Math.round(hash  % 0xFFFFFFFF);
        },
        replace(id, prim){  // replaces vec with id === id with the supplied vec
            if(id !== undefined){
                if(prim !== undefined && prim.type === "Vec"){
                    if(this.p1.id === id){
                        this.p1 = prim;
                    }else
                    if(this.p2.id === id){
                        this.p2 = prim;
                    }else
                    if(this.cp1.id === id){
                        this.cp1 = prim;
                    }else
                    if(this.cp2 !== undefined && this.cp2.id === id){
                        this.cp2 = prim;
                    }
                }
            }
            return this;
        },
        getAllIdsAsArray(array){
            if(array === undefined){
                array = [];
            }
            if(array.indexOf(this.id) === -1){
                array.push(this.id);
            }

            this.p1.getAllIdsAsArray(array);
            this.p2.getAllIdsAsArray(array);
            this.cp1.getAllIdsAsArray(array);
            if(this.cp2 !== undefined){
                this.cp2.getAllIdsAsArray(array);
            }
            return array;
        },
        empty(){
            this.p1.x = this.p1.y = this.p2.x = this.p2.y = Infinity;
            return this;
        },
        isEmpty(){
            if(this.p1 === undefined || this.p2 === undefined || this.cp1 === undefined){
                return true;
            }
            if(this.p1.isEmpty() || this.p2.isEmpty() || this.cp1.isEmpty()){
                return true;
            }
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.p1.id === id || this.p2.id === id || this.cp1.id === id || (this.cp2 !== undefined && this.cp2.id === id)){
                return true;
            }
            return false;
        },
        lerp(from, dest, amount){
            this.p1.x = (dest.p1.x - from.p1.x) * amount + from.p1.x;
            this.p1.y = (dest.p1.y - from.p1.y) * amount + from.p1.y;
            this.p2.x = (dest.p2.x - from.p2.x) * amount + from.p2.x;
            this.p2.y = (dest.p2.y - from.p2.y) * amount + from.p2.y;
            this.cp1.x = (dest.cp1.x - from.cp1.x) * amount + from.cp1.x;
            this.cp1.y = (dest.cp1.y - from.cp1.y) * amount + from.cp1.y;
            if(this.cp2 !== undefined){
                this.cp2.x = (dest.cp2.x - from.cp2.x) * amount + from.cp2.x;
                this.cp2.y = (dest.cp2.y - from.cp2.y) * amount + from.cp2.y;
            }
            return this;
        },
        isQuadratic(){  // returns true if this is a quadratic
            if(this.cp2 === undefined && !this.isEmpty()){
                return true;
            }
            return false;
        },
        isCubic(){ // returns true if this is a cubic
            if(this.cp2 !== undefined && !this.cp2.isEmpty() && !this.isEmpty()){
                return true;
            }
            return false;
        },
        description(){
            var label = this.labelStr !== undefined ? "'"+this.labelStr+"'" : "";
            var id = this.id !== undefined ? "id : "+this.id : "";
            var desc =  "Bezier "+label+" " + id + " properties : ["+(this.isCubic()?"Cubic":"Quadratic") + "] ";
            desc += "Length (approx) : " + this.approxLength();
            return desc;
        },
        leng(){
            if(this.cp2 === undefined){
                return this.getLength()
            }
            return this.approxLength();

        },
        asVecArray(vecArray, instance){ // if instance === true then an instance of each vec is created, else a copy of each vec is created
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.p1).push(this.p2).push(this.cp1);
                if(this.cp2 !== undefined){
                    vecArray.push(this.cp2);
                }
                return vecArray;
            }

            vecArray.push(this.p1.copy()).push(this.p2.copy()).push(this.cp1.copy());
            if(this.cp2 !== undefined){
                vecArray.push(this.cp2.copy());
            }
            return vecArray;
        },
        asBox(box){  // returns the bounding box. If box is defined then will add to the bounds of box
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.p1.x, this.p1.y);
            box.env ( this.p2.x, this.p2.y);
            if(this.cp2 !== undefined){
                solveBezier3(this.p1.x, this.cp1.x, this.cp2.x, this.p2.x); // results in u,u1 geom registers
                if(u >= 0 && u <= 1){
                    this.vecAt(u,false,v5);
                    box.env(v5.x,v5.y);
                }
                if(u1 >= 0 && u1 <= 1){
                    this.vecAt(u1,false,v5);
                    box.env(v5.x,v5.y);
                }
                solveBezier3(this.p1.y, this.cp1.y, this.cp2.y, this.p2.y); // results in u,u1 geom registers
                if(u >= 0 && u <= 1){
                    this.vecAt(u,false,v5);
                    box.env(v5.x,v5.y);
                }
                if(u1 >= 0 && u1 <= 1){
                    this.vecAt(u1,false,v5);
                    box.env(v5.x,v5.y);
                }
            }else{

                // Improved method for quadratic. Sorry untested so I have left tested code below
                /*v1.x = this.p2.x - this.p1.x; // get x range
                v1.y = this.p2.y - this.p1.y; // get y range
                v2.x = this.cp1.x - this.p1.x; // get x control point offset
                v2.y = this.cp1.y - this.p1.y; // get x control point offset
                u = v2.x / v1.x; // normalise control point which is used to check if maxima is in range
                u1 = v2.y / v1.y;

                v3.x = this.p1.x; // set defaults in case maximas outside range
                v3.y = this.p1.y;
                if (u < 0 || u > 1) { // check if x maxima is on the curve
                    v3.x = v2.x * v2.x / (2 * v2.x - v1.x) + this.p1.x; // get the x maxima
                }
                if (u1 < 0 || u1 > 1) { // same as x
                    v3.y = v2.y * v2.y / (2 * v2.y - v1.y) + this.p1.y; // get the x maxima
                }*/

                // Known OK tested code in case code above fails and need quick fix.
                solveBezier2(this.p1.x, this.cp1.x, this.p2.x);
                if(u >= 0 && u <= 1){
                    this.vecAt(u,false,v3);
                    box.env(v3.x,v3.y);
                }
                solveBezier2(this.p1.y, this.cp1.y, this.p2.y);
                if(u >= 0 && u <= 1){
                    this.vecAt(u,false,v4);
                    box.env(v4.x,v4.y);
                }
            }
            return box;
        },
        asSimple(obj){ // returns the box as a simple object with left,right,bottom,top,width,height
            if(obj === undefined){
                obj = {};
            }
            obj.x1 = this.p1.x;
            obj.y1 = this.p1.y;
            obj.x2 = this.cp1.x;
            obj.y2 = this.cp1.y;
            if(this.cp2 === undefined){
                obj.x3 = this.p2.x;
                obj.y3 = this.p2.y;
            }else{
                obj.x3 = this.cp2.x;
                obj.y3 = this.cp2.y;
                obj.x4 = this.p2.x;
                obj.y4 = this.p2.y;
            }
            return obj;
        },
        fromSimple(obj){
            this.p1.x = obj.x1 === undefined ? 0 : obj.x1;
            this.p1.y = obj.y1 === undefined ? 0 : obj.y1;
            this.cp1.x = obj.x2 === undefined ? 1 : obj.x2;
            this.cp1.y = obj.y2 === undefined ? 0 : obj.y2;
            if(obj.x4 === undefined){
                this.p2.x = obj.x3 === undefined ? 1 : obj.x3;
                this.p2.y = obj.y3 === undefined ? 0 : obj.y3;
            }else{
                this.cp2.x = obj.x3 === undefined ? 0 : obj.x3;
                this.cp2.y = obj.y3 === undefined ? 0 : obj.y3;
                this.p2.x = obj.x4
                this.p2.y = obj.y4 === undefined ? 0 : obj.y4;

            }
            return this;
        },
        interceptsAsVecArray(bezier,threshold,vecArray){ // warning this function is computationally and memory intensive. Finds the intercept points if any of this bezier and the given
                                                         // [threshold] optional and is the the rectangular limit of the test. Intercepts will within this horizontal and vertical distance apart.
                                                         //     Note: threshold does not apply to quad on quad intercepts. Its perfect
                                                         // [vecArray] the VecArray to hold the results. Creates a new VecArray if not supplied
                                                         // calling this function on two bezier that are the same or have larger areas of points within a pixel will return many interception points
            if(this.cp2 === undefined || bezier.cp2 === undefined){
                return this.interceptBezier_QonQ(bezier,vecArray);
            }
            var results = this.interceptsAsPositions(bezier,threshold);
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            for(a = 0; a < results.length; a ++){
                vecArray.push(this.vecAt(results[a]));
            }
            return vecArray;
        },
        interceptBezier_QonQ(bez1,vecArray){ // Quadratic to quadratic bezier intercepts
            // rArray
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            if(this.cp2 !== undefined || bez1.cp2 !== undefined){ // currently only quadratics
                return vecArray; // return empty vec array
            }
            v3.x = this.p1.x + this.cp1.x * -2 + this.p2.x;
            v3.y = this.p1.y + this.cp1.y * -2 + this.p2.y;
            v2.x = this.p1.x * -2 + this.cp1.x * 2;
            v2.y = this.p1.y * -2 + this.cp1.y * 2;
            v1.x = this.p1.x;
            v1.y = this.p1.y;

            vc.x = bez1.p1.x + bez1.cp1.x * -2 + bez1.p2.x;
            vc.y = bez1.p1.y + bez1.cp1.y * -2 + bez1.p2.y;
            vb.x = bez1.p1.x * -2 + bez1.cp1.x * 2;
            vb.y = bez1.p1.y * -2 + bez1.cp1.y * 2;
            va.x = bez1.p1.x;
            va.y = bez1.p1.y;
            rArrayLen = 0; // reset array results count
            if ( v3.y == 0 ) {
                a = v3.x * (v1.y - va.y);
                b = a - v2.x * v2.y;
                c = v2.y * v2.y;
                getRoots4(
                    v3.x * vc.y * vc.y,
                    2 * v3.x * vb.y * vc.y,
                    v3.x * vb.y * vb.y - vc.x * c - vc.y * a - vc.y * b,
                    -vb.x * c - vb.y * a - vb.y * b,
                    (v1.x - va.x) * c + (v1.y - va.y) * b
                );
            } else {
                a = v3.x * vc.y - v3.y * vc.x;
                b = v3.x * vb.y - v3.y * vb.x;
                c = v2.x * v3.y - v2.y * v3.x;
                d = v1.y - va.y;
                e = v3.y * (v1.x - va.x) - v3.x * d;
                u = -v2.y * c + v3.y * e;
                u1 = c * c;
                getRoots4(
                    a * a,
                    2 * a * b,
                    (-vc.y * u1 + v3.y * b * b + v3.y * a * e + a * u) / v3.y,
                    (-vb.y * u1 + v3.y * b * e + b * u) / v3.y,
                    (d * u1 + e * u) / v3.y
                );
            }
            a = rArrayLen;
            e1 = 0;
            for (c1 = 0; c1 < a; c1++ ) {
                u = rArray[c1];
                e = 0; // flags if point is used
                if ( u >= 0 && u <= 1 ) {
                    u1 = u * u;
                    rArrayLen = a;
                    getRoots2(v3.x, v2.x, v1.x - va.x - u * vb.x - u1 * vc.x);
                    b = rArrayLen;
                    getRoots2(v3.y, v2.y, v1.y - va.y - u * vb.y - u1 * vc.y);
                    c = rArrayLen;
                    if ( b > a && c > b ) {
                        foundRoot:
                        for (a1 = a; a1 < b; a1++ ) {
                            d1 = rArray[a1];
                            if ( 0 <= d1 && d1 <= 1 ) {
                                for ( b1 = b; b1 < c; b1++ ) {
                                    if ( Math.abs( d1 - rArray[b1] ) < 1e-4 ) {
                                        vecArray.push( new Vec(
                                            vc.x * u1 + vb.x * u + va.x,
                                            vc.y * u1 + vb.y * u + va.y
                                        )) ;
                                        e = 1;
                                        break foundRoot;
                                    }
                                }
                            }
                        }

                    }
                }
                if(e === 1){
                    rArray[e1++] = u;
                }
            }
            rArrayLen = e1;

            return vecArray;
        },
        interceptsAsPositions(bezier,threshold,array,array1){ // Finds the intercept points between this bezier and the given bezier. this is an approximate solution only
                                                         // warning this function is computationally and memory intensive. Finds the intercept points if any of this bezier and the given
                                                         // [threshold] optional and is the the rectangular limit of the test. Intercepts will within this horizontal and vertical distance apart.
                                                         // [array] the array to hold the results. Creates a new array if not supplied
                                                         // [array1] optional holds the positions on the given bezier. if not supplied then the geom register array is used. (rArray) if array1 is null then it is ignored (this give a slight performance boost (very slight));
                                                         // calling this function on two bezier that are the same or have larger areas of points within a pixel will return many interception points
            var b1,b2,b3,b4,bx1,bx2;
            if(array === undefined){
                array = [];
            }
            if(array1 === undefined){
                array1 = rArray;
                rArray.length = 0;
            }
            if(threshold === undefined || threshold === null){
                threshold = 0.5;
            }

            if(!(bx1 = this.asBox()).isBoxOverlapping(bx2 = bezier.asBox())){
                return array;
            }
            if(bx1.width() < threshold && bx2.width() < threshold && bx1.height() < threshold && bx2.height() < threshold){
                c = (this._subStart + this._subEnd)/2;
                d = threshold / 10;
                e = 0; // avoiding type change (performance hit) so rather than a boolean 0 and 1
                for(a = 0; a < array.length; a ++){
                    if(Math.abs(array[a] - c) <= d){
                        array[a] = (array[a] + c)/2;
                        e = 1;
                        break;
                    }
                }
                if(e === 0){
                    array.push(c);
                }
                if(array1 !== null){
                    c = (bezier._subStart + bezier._subEnd)/2;
                    e = 0; // avoiding type change (performance hit) so rather than a boolean 0 and 1
                    for(a = 0; a < array1.length; a ++){
                        if(Math.abs(array1[a] - c) <= d){
                            array1[a] = (array1[a] + c)/2;
                            e = 1;
                            break;
                        }
                    }
                    if(e === 0){
                        array1.push(c);
                    }
                }
                return array;
            }
            b1 = this.splitAt(0.5,true);
            b2 = this.splitAt(0.5,false);
            b3 = bezier.splitAt(0.5,true);
            b4 = bezier.splitAt(0.5,false);
            b1.interceptsAsPositions(b3, threshold, array);
            b1.interceptsAsPositions(b4, threshold, array);
            b2.interceptsAsPositions(b3, threshold, array);
            b2.interceptsAsPositions(b4, threshold, array);
            return array;
        },
        lineInterceptPos(line){ // find position of intercept point and puts them in u,u1,u2 geom registers
            var dir = line.dir();
            bez.setAs(this);
            v1.setAs(line.p1).mult(-1);
            bez.translate(v1).rotate(-dir);
            if(this.cp2 !== undefined){
                solveBezierA3(bez.p1.y, bez.cp1.y, bez.cp2.y,bez.p2.y);
                return this;
            }
            solveBezierA2(bez.p1.y, bez.cp1.y, bez.p2.y);
            u2 = -Infinity;
            return this;
        },
        interceptLine(line,vecArray){  // finds the interception points of the line and the bezier. vecArray is optional and will contain the points
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            this.__lineInterceptPos(line);
            if(u  >= 0 && u  <= 1){ vecArray.push(this.vecAt(u));}
            if(u1 >= 0 && u1 <= 1){ vecArray.push(this.vecAt(u1));}
            if(u2 >= 0 && u2 <= 1){ vecArray.push(this.vecAt(u2));}
            return vecArray
        },
        interceptLineSeg(line,vecArray){ // finds the interception points of the line segment and the bezier. vecAttay is optional. If given then the points are added to it. if not then a new vec array is created. Returns VecArray
            var p;
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            this.__lineInterceptPos(line);
            if(u  >= 0 && u  <= 1){
                p = this.vecAt(u);
                if(line.isVecWithinSeg(p)){
                    vecArray.push(p);
                }
            }
            if(u1  >= 0 && u1  <= 1){
                p = this.vecAt(u1);
                if(line.isVecWithinSeg(p)){
                    vecArray.push(p);
                }
            }
            if(u2  >= 0 && u2  <= 1){
                p = this.vecAt(u2);
                if(line.isVecWithinSeg(p)){
                    vecArray.push(p);
                }
            }
            return vecArray;
        },
        sliceWithLine(line,right,primArray){ // returns the primitive array containing segments left or right of the line. if right is true then returns segments right of the line. if false then segments left of the line. [primArray] optional if given the segments are push onto it. else a new primitive array is created. Returns PrimitiveArray
            var me,p;
            function getLeft(start,end){
                if(start === 0){ return a; }
                if(end === 1){ return b; }
                return line.isVecLeft(me.vecAt((start+end)/2));
            }
            this.__lineInterceptPos(line);
            if(primArray === undefined){
                primArray = new PrimitiveArray();
            }
            me = this;
            p = [0];
            if(u >= 0 && u <= 1){ p[p.length] = u; }
            if(u1 >= 0 && u1 <= 1){ p[p.length] = u1; }
            if(u2 >= 0 && u2 <= 1){ p[p.length] = u2; }
            p[p.length] = 1;
            p.sort();
            a = line.isVecLeft(this.p1);
            b = line.isVecLeft(this.p2);
            e = 0;
            e1 = p.length;
            while( e < e1-1){
                if(getLeft(p[e],p[e+1])!== right){ primArray.push(this.segment(p[e],p[e+1]))}
                e += 1;
            }
            return primArray;
        },
        asQuadratic(){
            if(this.cp2 === undefined){
                return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy());
            }
            v1.x = (this.cp1.x + this.cp2.x)/2;
            v1.y = (this.cp1.y + this.cp2.y)/2;
            return new Bezier(this.p1.copy(), this.p2.copy(), v1.copy());
        },
        asCubic(extraVec){ // this is just a stub for now until I workout the best solution for the missing point
            if(this.cp2 === undefined){
                if(extraVec === undefined){
                    var v = this.p2.copy().sub(this.p1).mult(1/3);
                    v = this.p2.copy().sub(v).sub(v.r90());
                    return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), v);
                }
                return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), extraVec);
            }
             return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), this.cp2.copy());
        },
        translate(vec){ // moves the bezier
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            this.cp1.x += vec.x;
            this.cp1.y += vec.y;
            if(this.cp2 !== undefined){
                this.cp2.x += vec.x;
                this.cp2.y += vec.y;
            }
            return this;
        },
        scale(scale){
            this.p1.x  *= scale;
            this.p1.y  *= scale;
            this.p2.x  *= scale;
            this.p2.y  *= scale;
            this.cp1.x *= scale;
            this.cp1.y *= scale;
            if(this.cp2 !== undefined){
                this.cp2.x *= scale;
                this.cp2.y *= scale;
            }
            return this;

        },
        rotate(rotation){ // rotates the bezier
            a = Math.cos(rotation);
            b = Math.sin(rotation);
            c = this.p1.x;
            d = this.p1.y;
            this.p1.x = c * a + d * -b;
            this.p1.y = c * b + d * a;
            c = this.p2.x;
            d = this.p2.y;
            this.p2.x = c * a + d * -b;
            this.p2.y = c * b + d * a;
            c = this.cp1.x;
            d = this.cp1.y;
            this.cp1.x = c * a + d * -b;
            this.cp1.y = c * b + d * a;
            if(this.cp2 !== undefined){
                c = this.cp2.x;
                d = this.cp2.y;
                this.cp2.x = c * a + d * -b;
                this.cp2.y = c * b + d * a;

            }
            return this; // returns this
        },
        fromCircle(circle,quadrant){ // matches the circle's quadrant 0,1,2,3 Quadrant 0 is bottom right then clockwise around
            if(quadrant === undefined){
                quadrant = 0;
            }else{
                quadrant = Math.abs(quadrant % 4);
            }
            if(quadrant === 0){
                this.p1.x = circle.center.x + circle.center.radius;
                this.p1.y = circle.center.y
                this.p2.x = circle.center.x
                this.p2.y = circle.center.y + circle.center.radius;
                this.cp1.x = this.p1.x;
                this.cp1.y = this.p1.y + circle.radius * BEZ3_CIR;
                this.cp2.x = this.p2.x + circle.radius * BEZ3_CIR;
                this.cp2.y = this.p2.y;
            }else
            if(quadrant === 2){
                this.p1.x = circle.center.x - circle.center.radius;
                this.p1.y = circle.center.y
                this.p2.x = circle.center.x
                this.p2.y = circle.center.y - circle.center.radius;
                this.cp1.x = this.p1.x;
                this.cp1.y = this.p1.y - circle.radius * BEZ3_CIR;
                this.cp2.x = this.p2.x - circle.radius * BEZ3_CIR;
                this.cp2.y = this.p2.y;
            }else
            if(quadrant === 1){
                this.p1.x = circle.center.x
                this.p1.y = circle.center.y + circle.center.radius;
                this.p2.x = circle.center.x - circle.center.radius;
                this.p2.y = circle.center.y
                this.cp1.x = this.p1.x - circle.radius * BEZ3_CIR;
                this.cp1.y = this.p1.y;
                this.cp2.x = this.p2.x;
                this.cp2.y = this.p2.y + circle.radius * BEZ3_CIR;
            }else{
                this.p1.x = circle.center.x
                this.p1.y = circle.center.y - circle.center.radius;
                this.p2.x = circle.center.x + circle.center.radius;
                this.p2.y = circle.center.y
                this.cp1.x = this.p1.x + circle.radius * BEZ3_CIR;
                this.cp1.y = this.p1.y;
                this.cp2.x = this.p2.x;
                this.cp2.y = this.p2.y - circle.radius * BEZ3_CIR;
            }
            return this;
        },
        fromArc(arc){ // stub
            return this;
        },
        fromVecArray(type,vecArray,instance){ // type = "cubic" or "quadratic". Point order is start control points then end. Creates from current position in vecArray and only if there are enough vecs. Instance if true uses the reference to vecs, if false makes a copy of vecs
            if(type === "quadratic"){
                if(vecArray.remaining() >= 3){
                    if(instance){
                        this.p1 = vecArray.next();
                        this.cp1 = vecArray.next();
                        this.p2 = vecArray.next();
                    }else{
                        this.p1 = vecArray.next().copy();
                        this.cp1 = vecArray.next().copy();
                        this.p2 = vecArray.next().copy();
                    }
                    this.cp2 = undefined;
                }
            }else{
                if(vecArray.remaining() >= 4){
                    if(instance){
                        this.p1 = vecArray.next();
                        this.cp1 = vecArray.next();
                        this.cp2 = vecArray.next();
                        this.p2 = vecArray.next();
                    }else{
                        this.p1 = vecArray.next().copy();
                        this.cp1 = vecArray.next().copy();
                        this.cp2 = vecArray.next().copy();
                        this.p2 = vecArray.next().copy();
                    }
                }
            }
            return this;
        },
        fromTriangle(triangle){ // stub
            return this;
        },
        asRectangle(rectangle){ // returns a rectangle that is aligned to the line between the end points and contains the whole bezier
            if(rectangle === undefined){
                rectangle = new Rectangle();
            }
            rectangle.top.p1.x = this.p1.x;
            rectangle.top.p1.y = this.p1.y;
            rectangle.top.p2.x = this.p2.x;
            rectangle.top.p2.y = this.p2.y;
            // rotate and translate a copy of the bezier to line up with the line between p1,p2 and move to the origin
            // so that correct extrema can be found
            var dir = rectangle.top.dir();
            bez.setAs(this);
            v1.setAs(bez.p1).mult(-1);
            bez.rotate(-dir).translate(v1);

            if(this.cp2 !== undefined){
                solveBezier3(bez.p1.x, bez.cp1.x, bez.cp2.x, bez.p2.x);
                this.vecAt(u,true,v4);
                this.vecAt(u1,true,va);
                solveBezier3(bez.p1.y, bez.cp1.y, bez.cp2.y,bez.p2.y);
                this.vecAt(u,true,v5);
                this.vecAt(u1,true,vb);
                var dist1 = rectangle.top.distFromDir(v4);
                e = u; // dist from function sets u register to hold unit distance
                var dist2 = rectangle.top.distFromDir(va);
                e1 = u; // dist from function sets u register to hold unit distance
                var dist3 = rectangle.top.distFromDir(v5);
                u1 = u;
                var dist4 = rectangle.top.distFromDir(vb);
                rectangle.top.setStartEndUnit(Math.min(0, u, u1, e, e1), Math.max(1, u, u1, e, e1));
                e = rectangle.top.leng();
                a = Math.min(0, dist1, dist2, dist3, dist4);
                rectangle.top.offset(a);
                rectangle.aspect = (Math.max(0, dist1, dist2, dist3, dist4) - a) / e;
            }else{
                solveBezier2(bez.p1.x, bez.cp1.x, bez.p2.x);
                this.vecAt(u,true,v4);
                solveBezier2(bez.p1.y, bez.cp1.y, bez.p2.y);
                this.vecAt(u,true,v5);
                var dist1 = rectangle.top.distFromDir(v4);
                u1 = u; // dist from function sets u register to hold unit distance
                var dist2 = rectangle.top.distFromDir(v5);
                rectangle.top.setStartEndUnit(Math.min(0, u, u1), Math.max(1, u, u1));
                log(Math.min(0, u, u1)); log(Math.max(1, u, u1));
                e = rectangle.top.leng();
                a = Math.min(0, dist1, dist2);
                rectangle.top.offset(a);
                rectangle.aspect = (Math.max(0, dist1, dist2) - a) / e;
            }
            return rectangle;
        },
        fromBox(box){ // stub
            return this;
        },
        segment(fromPos,toPos,retBezier){
            if(fromPos === 0 && toPos === 1){
                if(retBezier === undefined){
                    return this.copy();
                }
                return reBezier.setAs(this);
            }
            retBezier = this.splitAt(fromPos,false,retBezier);
            return retBezier.splitAt((toPos-fromPos) / (1 - fromPos),true,retBezier);

        },
        splitAt(position,start,retBezier){ // splits the bezier returning a new bezier starting or ending at position. If start is true then return the first section from p1 to position else returns the end section from position to p2
            if(retBezier === undefined){
                if(this.cp2 !== undefined){ retBezier = new Bezier("cubic"); }
                else{ retBezier = new Bezier("quadratic"); }
            }
            v1.x = this.p1.x;
            v1.y = this.p1.y;
            v4.x = this.p2.x;
            v4.y = this.p2.y;
            c = position;
            if(this._subStart === undefined){
                this._subStart = 0;
                this._subEnd = 1;
            }
            if(start === true){
                retBezier.p1.x = this.p1.x;
                retBezier.p1.y = this.p1.y;
                retBezier._subStart = this._subStart;
                retBezier._subEnd = (this._subEnd - this._subStart) * position + this._subStart;
            }else{
                retBezier.p2.x = this.p2.x;
                retBezier.p2.y = this.p2.y;
                retBezier._subEnd = this._subEnd;
                retBezier._subStart = (this._subEnd - this._subStart) * position + this._subStart;
            }
            if(this.cp2 === undefined){
                v2.x = this.cp1.x;
                v2.y = this.cp1.y;
                if(start){
                    retBezier.cp1.x = (v1.x += (v2.x - v1.x) * c);
                    retBezier.cp1.y = (v1.y += (v2.y - v1.y) * c);
                    v2.x += (v4.x - v2.x) * c;
                    v2.y += (v4.y - v2.y) * c;
                    retBezier.p2.x = v1.x + (v2.x - v1.x) * c;
                    retBezier.p2.y = v1.y + (v2.y - v1.y) * c;
                    retBezier.cp2 = undefined;
                }else{
                    v1.x += (v2.x - v1.x) * c;
                    v1.y += (v2.y - v1.y) * c;
                    retBezier.cp1.x = (v2.x += (v4.x - v2.x) * c);
                    retBezier.cp1.y = (v2.y += (v4.y - v2.y) * c);
                    retBezier.p1.x = v1.x + (v2.x - v1.x) * c;
                    retBezier.p1.y = v1.y + (v2.y - v1.y) * c;
                    retBezier.cp2 = undefined;
                }
                return retBezier;
            }
            v2.x = this.cp1.x;
            v2.y = this.cp1.y;
            v3.x = this.cp2.x;
            v3.y = this.cp2.y;
            if(start){
                retBezier.cp1.x = (v1.x += (v2.x - v1.x) * c);
                retBezier.cp1.y = (v1.y += (v2.y - v1.y) * c);
                v2.x += (v3.x - v2.x) * c;
                v2.y += (v3.y - v2.y) * c;
                v3.x += (v4.x - v3.x) * c;
                v3.y += (v4.y - v3.y) * c;
                retBezier.cp2.x = (v1.x += (v2.x - v1.x) * c);
                retBezier.cp2.y = (v1.y += (v2.y - v1.y) * c);
                v2.x += (v3.x - v2.x) * c;
                v2.y += (v3.y - v2.y) * c;
                retBezier.p2.x = v1.x + (v2.x - v1.x) * c;
                retBezier.p2.y = v1.y + (v2.y - v1.y) * c;
            }else{
                v1.x += (v2.x - v1.x) * c;
                v1.y += (v2.y - v1.y) * c;
                v2.x += (v3.x - v2.x) * c;
                v2.y += (v3.y - v2.y) * c;
                retBezier.cp2.x = (v3.x += (v4.x - v3.x) * c);
                retBezier.cp2.y = (v3.y += (v4.y - v3.y) * c);
                v1.x += (v2.x - v1.x) * c;
                v1.y += (v2.y - v1.y) * c;
                retBezier.cp1.x = (v2.x += (v3.x - v2.x) * c);
                retBezier.cp1.y = (v2.y += (v3.y - v2.y) * c);
                retBezier.p1.x = v1.x + (v2.x - v1.x) * c;
                retBezier.p1.y = v1.y + (v2.y - v1.y) * c;
            }
            return retBezier;
        },
        normalise(){ // normalises the bezier.
            this._subStart = 0;
            this._subEnd = 1;
            return this;
        },
        reverse() { // reverses the direction of the bezier (Untested and not sure if this has the correct logic)
            var temp;
            if(this.cp2 === undefined){
                temp = this.p1;
                this.p1 = this.p2;
                this.p2 = temp;
                return this;
            }
            temp = this.p1;
            this.p1 = this.p2;
            this.p2 = temp;
            temp = this.cp1;
            this.cp1 = this.cp2;
            this.cp2 = temp;
            return this;

        },
        getLocalExtrema(axisX, solution){ // gets the local extrema (max and min for axis) if they exist within the domain 0 <= p <= 1
                                                     // axisX is true return the xAxis results else the Y axis
                                                     // solution if true returns the 2nd solution There can be 2 solutions for 3rd order. Does not apply to 2nd order and will return the same result
                                                     // the first and second results can also be found in geom  registers u,u1
            if(this.cp2 !== undefined){
                if(axisX === true){
                    solveBezier3(this.p1.x, this.cp1.x, this.cp2.x, this.p2.x); // results in u,u1 geom registers
                }else{
                    solveBezier3(this.p1.y, this.cp1.y, this.cp2.y, this.p2.y); // results in u,u1 geom registers
                }
                if(solution === true){
                    return u;
                }
                return u1;
            }
            if(axisX === true){
                solveBezier2(this.p1.x, this.cp1.x, this.p2.x);
                u1 = u;
            }else{
                solveBezier2(this.p1.y, this.cp1.y, this.p2.y);
                u1 = u;
            }
            return u;
        },
        getLength(){    // returns a calculated length rather than approx length, only for 2nd order bezier
              if(this.cp2 !== undefined){ // currently does not support 3rd order cubic
                  return undefined;
              }
              v1x = this.cp1.x * 2;
              v1y = this.cp1.y * 2;
              d = this.p1.x - v1x + this.p2.x;
              d1 = this.p1.y - v1y + this.p2.y;
              e = v1x - 2 * this.p1.x;
              e1 = v1y - 2 * this.p1.y;
              c1= (a = 4 * (d * d + d1 * d1));
              c1 += (b = 4 * (d * e + d1 * e1));
              c1 += (c = e * e + e1 * e1);
              c1 = 2 * Math.sqrt(c1);
              a1 = 2 * a * (u = Math.sqrt(a));
              u1 = b / u;
              a = 4 * c * a - b * b;
              c = 2 * Math.sqrt(c);
              return (a1 * c1 + u * b * (c1 - c) + a * Math.log((2 * u + u1 + c1) / (u1 + c))) / (4 * a1);
        },
        getControlPoint(which){ // returns the control point for "start" or "end" defaults to end
            if(which === "start"){
                return this.cp1;
            }
            if(this.cp2 === undefined){
                return this.cp1;
            }
            return this.cp2;
        },
        findPositionOfVec(vec,resolution,pos){  // temp stub until I decide on the best way to do this. Finds position on curve in terms of uint dist, if pos is given then that point is used to search around at (resolution/4) ^ 2
            // translate curve to make vec the origin
            v1.x = this.p1.x - vec.x;
            v1.y = this.p1.y - vec.y;
            v2.x = this.p2.x - vec.x;
            v2.y = this.p2.y - vec.y;
            v3.x = this.cp1.x - vec.x;
            v3.y = this.cp1.y - vec.y;
            if(this.cp2 !== undefined){
                v4.x = this.cp2.x - vec.x;
                v4.y = this.cp2.y - vec.y;
            }
            if(resolution === undefined){
                resolution = 100;
            }
            c1 = 1/resolution;
            u1 = 1 + c1/2;
            var s = 0;
            if(pos !== undefined){
                s = pos - c1 * 2;
                u1 = pos + c1 * 2;
                c1 = (c1 * 4) / resolution;
            }
            d = Infinity;
            if(this.cp2 === undefined){
                for(var i = s; i <= u1; i += c1){
                    a = (1 - i);
                    c = i * i;
                    b = a*2*i;
                    a *= a;
                    vx = v1.x * a + v3.x * b + v2.x * c;
                    vy = v1.y * a + v3.y * b + v2.y * c;
                    e = Math.sqrt(vx * vx + vy * vy);
                    if(e < d ){
                        pos = i;
                        d = e;

                    }
                }
            }else{
                for(var i = s; i <= u1; i += c1){
                    a = (1 - i);
                    c = i * i;
                    b = 3 * a * a * i;
                    b1 = 3 * c * a;
                    a = a*a*a;
                    c *= i;
                    vx = v1.x * a + v3.x * b + v4.x * b1 + v2.x * c;
                    vy = v1.y * a + v3.y * b + v4.y * b1 + v2.y * c;
                    e = Math.sqrt(vx * vx + vy * vy);
                    if(e < d ){
                        pos = i;
                        d = e;

                    }
                }
            }
            return pos;
        },
        distFrom(vec){
            u = this.findPositionOfVec(vec); // this function sets d as the distance from the bezier or infinity id not found
            c1 = d;
            if(c1 === Infinity){
                c1 = this.p1.distFrom(vec);
                if((c = this.p2.distFrom(vec)) < c1){
                    u = 1;
                    v5.setAs(this.p2);
                    return c;
                }
                u = 0;
                v5.setAs(this.p1);
                return c1;
            }
            return c1;
        },
        fitPointCenter(vec){  // adjusts the control point to fit the vec on the curve. Only works for quadratic curves for the time being
            if(this.cp2 === undefined){
                v1.x = (this.p2.x + this.p1.x) / 2;
                v1.y = (this.p2.y + this.p1.y) / 2;
                this.cp1.x = (vec.x - v1.x) * 2 + v1.x;
                this.cp1.y = (vec.y - v1.y) * 2 + v1.y;
            }
            return this;
        },
        fitPointAt(pos,vec){  // WARNING THIS IS NOT WORKING and a mess dont use// adjusts the control point to fit the vec on the curve at position pos. 0 <= Pos <= 1 on the curve else outside the curve . Only works for quadratic curves for the time being
            if(this.cp2 === undefined){
                v1.x = (this.p2.x - this.p1.x) * pos + this.p1.x;
                v1.y = (this.p2.y - this.p1.y) * pos + this.p1.y;
                this.cp1.x = (vec.x - v1.x) * (1/(1-pos)) + v1.x;
                this.cp1.y = (vec.y - v1.y) * (1/(1-pos)) + v1.y;
            }
            return this;
/*
                v1.x = (this.p2.x - this.p1.x) * pos;
                v1.y = (this.p2.y - this.p1.y) * pos;
                v2.x = vec.x - this.p1.x;
                v2.y = vec.y - this.p1.y;
                a = 1-pos;
                b = v1.distAlongNorm(v2)  * a;
                v3.x = (v1.x * u) *  pos;  // u from distAlongNorm is unit dist on vec
                v3.y = (v1.y * u) *  pos;
                u1 = Math.hypot(v1.x,v1.y);
                v1.x /= u1;
                v1.y /= u1;
                v3.x -= v1.y * b;
                v3.y += v1.x * b;
                this.cp1.x = v3.x  * (1 / pos) + this.p1.x;
                this.cp1.y = v3.y * (1 / pos) + this.p1.y;
            }
            return this;*/
        },
        vecAt(position,limit,vec){ // returns the location on the curve at position. if limit true then position is clamped 0<=p<=1
            if(vec === undefined){
                vec = new Vec();
            }
            if(limit){
                if(position <= 0){
                    vec.x = this.p1.x;
                    vec.y = this.p1.y;
                    return vec;
                }else
                if(position >= 1){
                    vec.x = this.p2.x;
                    vec.y = this.p2.y;
                    return vec;
                }
            }else{
                if(position === 0){
                    vec.x = this.p1.x;
                    vec.y = this.p1.y;
                    return vec;
                }else
                if(position === 1){
                    vec.x = this.p2.x;
                    vec.y = this.p2.y;
                    return vec;
                }
            }
            v1.x = this.p1.x;
            v1.y = this.p1.y;
            c = position;
            if(this.cp2 === undefined){
                v2.x = this.cp1.x;
                v2.y = this.cp1.y;
                v1.x += (v2.x - v1.x) * c;
                v1.y += (v2.y - v1.y) * c;
                v2.x += (this.p2.x - v2.x) * c;
                v2.y += (this.p2.y - v2.y) * c;
                vec.x = v1.x + (v2.x - v1.x) * c;
                vec.y = v1.y + (v2.y - v1.y) * c;
                return vec;
            }
            v2.x = this.cp1.x;
            v2.y = this.cp1.y;
            v3.x = this.cp2.x;
            v3.y = this.cp2.y;
            v1.x += (v2.x - v1.x) * c;
            v1.y += (v2.y - v1.y) * c;
            v2.x += (v3.x - v2.x) * c;
            v2.y += (v3.y - v2.y) * c;
            v3.x += (this.p2.x - v3.x) * c;
            v3.y += (this.p2.y - v3.y) * c;
            v1.x += (v2.x - v1.x) * c;
            v1.y += (v2.y - v1.y) * c;
            v2.x += (v3.x - v2.x) * c;
            v2.y += (v3.y - v2.y) * c;
            vec.x = v1.x + (v2.x - v1.x) * c;
            vec.y = v1.y + (v2.y - v1.y) * c;
            return vec;
        },
        unitAlong(unit,vec){
            return this.vecAt(unit,false,vec);
        },
        length(){ // Accurate length for quadratic curves. Approximation for cubic
                             // Cubics call this.approxLength and uses a resolution of 1000
                             // if you wish higher resolution call approxLength directly
            if(this.cp2 === undefined){
                v1.x = this.cp1.x * 2;
                v1.y = this.cp1.y * 2;
                d = this.p1.x - v1.x + this.p2.x;
                d1 = this.p1.y - v1.y + this.p2.y;
                e = v1.x - 2 * this.p1.x;
                e1 = v1.y - 2 * this.p1.y;
                c1 = (a = 4 * (d * d + d1 * d1));
                c1 += (b = 4 * (d * e + d1 * e1));
                c1 += (c = e * e + e1 * e1);
                c1 = 2 * Math.sqrt(c1);
                a1 = 2 * a * (u = Math.sqrt(a));
                u1 = b / u;
                a = 4 * c * a - b * b;
                c = 2 * Math.sqrt(c);
                return (a1 * c1 + u * b * (c1 - c) + a * Math.log((2 * u + u1 + c1) / (u1 + c))) / (4 * a1);
            }
            return this.approxLength(1000);
        },
        unitDistOfClosestPoint(vec){
            return this.findPositionOfVec(vec);//,Math.floor(a/10));
        },
        tangentAsVec( position,limit, retVec ) {  // returns the normalised tangent at position
            if(retVec === undefined){ retVec = new Vec(); }
            if(limit){ position = Math.min(1, Math.max(0, position)); }
            if(this.cp2 === undefined){
                a = (1-position) * 2;
                b = position * 2;
                retVec.x = a * (this.cp1.x - this.p1.x) + b * (this.p2.x - this.cp1.x);
                retVec.y = a * (this.cp1.y - this.p1.y) + b * (this.p2.y - this.cp1.y);
            }else{
                a  = (1-position)
                b  = 6 * a * position;        // (6*(1-t)*t)
                a *= 3 * a;                  // 3 * ( 1 - t) ^ 2
                c  = 3 * position * position; // 3 * t ^ 2
                retVec.x  = -this.p1.x * a + this.cp1.x * (a - b) + this.cp2.x * (b - c) + this.p2.x * c;
                retVec.y  = -this.p1.y * a + this.cp1.y * (a - b) + this.cp2.y * (b - c) + this.p2.y * c;
            }
            u = Math.hypot(retVec.x, retVec.y);
            retVec.x /= u;
            retVec.y /= u;
            return retVec;
        },
        normalAsVec(position, limit, retVec) { // returns the normalise norm at position
             retVec = this.tangentAsVec(position, retVec);
             a = retVec.x;
             retVec.x = -retVec.y;
             retVec.y = a;
             return retVec;
        },
        normalAsLine(position, limit, retLine) { // return the normal at position as a unit line. limit if true limits the position to 0<=p<=1
            if(retLine === undefined){
                retLine = new Line();
            }
            this.vecAt(position, limit, retLine.p1);
            this.normalAsVec(position, limit, retLine.p2);
            retLine.p2.x += retLine.p1.x;
            retLine.p2.y += retLine.p1.y;
            return retLine;
        },
        tangentAsLine(position, limit, retLine) {// return the tangent at position as a unit line. limit if true limits the position to 0<=p<=1
            if(retLine === undefined){
                retLine = new Line();
            }
            this.vecAt(position, limit, retLine.p1);
            this.tangentAsVec(position, limit, retLine.p2);
            retLine.p2.x += retLine.p1.x;
            retLine.p2.y += retLine.p1.y;
            return retLine;
        },
        snapToBezier(bez, fromStart, toStart , coplanar, equalScale) { // snaps the end/start of this bezier to another. from = true then snaps to the start of the bez, else snaps the end, to === true snaps this start, else snaps end if coplanar = true moves the appropreat control point so that it is co linear with the othe bezier control point, equalScale, moves the appropreate control point so that it equal length
            if(fromStart){
                v1.x = bez.p1.x;
                v1.y = bez.p1.y;
                v2.x = bez.cp1.x;
                v2.y = bez.cp1.y;
            }else{
                v1.x = bez.p2.x;
                v1.y = bez.p2.y;
                if(bez.cp2 !== undefined){
                    v2.x = bez.cp2.x;
                    v2.y = bez.cp2.y;
                }else{
                    v2.x = bez.cp1.x;
                    v2.y = bez.cp1.y;
                }
            }
            if(coplanar || equalScale){
                v3.x = v2.x - v1.x;
                v3.y = v2.y - v1.y;
                u = Math.hypot(v3.x,v3.y);
                v3.x /= u;
                v3.y /= u;
            }
            if(toStart){
                c = this.p1;
                c1 = this.cp1;
            }else{
                c = this.p2;
                if(this.cp2 !== undefined){
                    c1 = this.cp2;
                }else{
                    c1 = this.cp1;
                }
            }
            c.x = v1.x;
            c.y = v1.y;
            v4.x = c1.x - c.x;
            v4.y = c1.y - c.y;
            u1 = Math.hypot(v4.x,v4.y);
            if(coplanar && equalScale){
                c1.x = c.x - v3.x * u;
                c1.y = c.y - v3.y * u;
            }else
            if(coplanar){
                c1.x = c.x - v3.x * u1;
                c1.y = c.y - v3.y * u1;
            }else
            if(equalScale){
                v4.x /= u1;
                v4.y /= u1;
                c1.x = c.x + v4.x * u;
                c1.y = c.y + v4.y * u;
            }
            c = 0; // release reference to avoid any problems
            c1 = 0;

            return this;
        },
        snapToBezierPos(bez, pos , tangentAmount) { // snaps the at pos to bez if tangent !== 0 then that is multipled to get the control point
            bez.vecAt(pos,true,v1);
            this.p1.x = v1.x;
            this.p1.y = v1.y;
            if(tangentAmount !== undefined && Math.abs(tangentAmount) > EPSILON){
                bez.tangentAsVec(pos,true,v2);
                v2.x *= tangentAmount;
                v2.y *= tangentAmount;
                this.cp1.x = v1.x + v2.x;
                this.cp1.y = v1.y + v2.y;
            }
            return this;
        },
        getInterpolationArray(resolution,array){ // get Interpolation Array. This returns an array of curve positions separated by a distance of one pixel
                                                      // this is an approximation and dependent on the value of resolution
                                                      // solution is optional and if omitted will default of 100. It represents one 8th of the sampling size to find the pixel distance values
                                                      // array is optional and is the array that will hold the result
                                                      // the last item in the array is the approx length of the curve
            if(array === undefined){
                array = [];
            }
            if(resolution === undefined || resolution === null || resolution === Infinity){
                resolution  = 100;
            }
            a = 1/ (resolution * 8);
            c1 = 1 + a/2;
            u1 = 0; // calculated approx distance
            u = 1; // next distance that is being looked for
            v4.x = this.p1.x;
            v4.y = this.p1.y;
            e = 0;
            array[e++] = 0;
            for(b = 0; b <= c1; b += a){
                this.vecAt(b,false,v5);
                u1 += Math.hypot(v5.x - v4.x, v5.y - v4.y);
                if(u1 >= u){
                    array[e++] = b;
                    u += 1;
                }
                v4.x = v5.x;
                v4.y = v5.y;
            }
            array[e++] = 1;
            array[e++] = u1;
            array.length = e;
            return array;
        },
        approxLength(resolution){
            if(resolution === undefined || resolution === Infinity){
                resolution = 100;
            }
            u = 1/Math.abs(resolution);
            u1 = 0;
            a = 1 + u/2; // to ensure that the for loop  does not miss 1 because of floating point error
            v4.x = this.p1.x;
            v4.y = this.p1.y;
            for(c1 = u; c1 <= a; c1 += u){
                this.vecAt(c1,true,v5);
                b = v5.x - v4.x;
                e = v5.y - v4.y;
                u1 += Math.sqrt(b * b + e * e);
                v4.x = v5.x;
                v4.y = v5.y;
            }
            return u1;
        },


    }
    Transform.prototype = {
        xAxis : undefined,
        yAxis : undefined,
        origin : undefined,
        type:"Transform",
        copy(){
            return new Transform(this.xAxis.copy(),this.yAxis.copy(),this.origin.copy());
        },
        reset(){  // sets the matrix to the identity matrix
            this.xAxis.x = this.yAxis.y = 1;
            this.xAxis.y = this.yAxis.x = this.origin.x = this.origin.y = 0;
            return this;
        },
        toString(precision){
            var str;
            var l = this.labelStr === undefined ? "": "'"+this.labelStr+"' ";
            if(this.isEmpty()){
                return "Transform : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Transform : "+l+"(";
            str += "X axis : "+ this.xAxis.toString() + ", ";
            str += "Y axis : "+ this.yAxis.toString() + ", ";
            str += "Origin : "+ this.origin.toString() + ", ";
            str += ")";
            return str; // returns String
        },
        setIdentity(){  // sets the matrix to the identity matrix
            this.xAxis.x = this.yAxis.y = 1;
            this.xAxis.y = this.yAxis.x = this.origin.x = this.origin.y = 0;
            return this;
        },
        hasId(id){ // returns true if this, or any of the points has the id,
            if(this.id === id){
                return true;
            }
            if(this.xAxis.id === id || this.yAxis.id === id || this.origin.id === id){
                return true;
            }
            return false;
        },
        isEmpty(){
            if(this.xAxis === undefined || this.yAxis === undefined || this.origin === undefined){
                return true;
            }
            if(this.xAxis.isEmpty() || this.yAxis.isEmpty() || this.origin.isEmpty()){
                return true;
            }
            return false;
        },
        empty(){
            this.xAxis.empty();
            this.yAxis.empty();
            this.origin.empty();
            return this;
        },
        asVecArray(va, instance) { // currently this just returns a new or passed vecArray with the origin only. Though may consider passing the axis
            if(va === undefined){
                va = new VecArray();
            }
            if(instance){
                va.push(this.origin);
                return va;
            }
            va.push(this.origin.copy());
            return va;
        },
        asArray(array){ // returns an array containing the matrix. array is optional if not included the array will be created
            if(array === undefined){
                array = [];
            }
            array[0] = this.xAxis.x;
            array[1] = this.xAxis.y;
            array[2] = this.yAxis.x;
            array[3] = this.yAxis.y;
            array[4] = this.origin.x;
            array[5] = this.origin.y;
            return array;
        },
        asSimple(obj){ // returns an object using the alphabet naming convention a,b,c,d,e,f. Obj is optional if supplied will be used else a new one is created.
            if(obj === undefined){
                obj = {};
            }
            obj.a = this.xAxis.x;
            obj.b = this.xAxis.y;
            obj.c = this.yAxis.x;
            obj.d = this.yAxis.y;
            obj.e = this.origin.x;
            obj.f = this.origin.y;
            return obj;
        },
        fromSimple(obj){
            this.xAxis.x  = obj.a === undefined ? 1 : obj.a;
            this.xAxis.y  = obj.b === undefined ? 0 : obj.b;
            this.yAxis.x  = obj.c === undefined ? 0 : obj.c;
            this.yAxis.y  = obj.d === undefined ? 1 : obj.d;
            this.origin.x = obj.e === undefined ? 0 : obj.e;
            this.origin.y = obj.f === undefined ? 0 : obj.f;
            return this;
        },
        applyToCoordinate(x, y, point){
            if(point !== undefined){
                point.x = x * this.xAxis.x + y * this.yAxis.x + this.origin.x;
                point.y = x * this.xAxis.y + y * this.yAxis.y + this.origin.y;
                return point;
            }
            return {
                x : x * this.xAxis.x + y * this.yAxis.x + this.origin.x,
                y : x * this.xAxis.y + y * this.yAxis.y + this.origin.y
            };
        },
        applyToVec(vec){
            vx = vec.x * this.xAxis.x + vec.y * this.yAxis.x + this.origin.x;
            vec.y = vec.x * this.xAxis.y + vec.y * this.yAxis.y + this.origin.y;
            vec.x = vx;
            return vec;
        },
        applyToLine(line){
            v1x = line.p1;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = line.p2;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return line;
        },
        applyToRectangle(rectangle){
            v1x = rectangle.line.p1;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = rectangle.line.p2;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return rectangle;
        },
        applyToCircle(circle){
            v1x = circle.center;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return circle;
        },
        applyToArc(arc){ // need to define what this should do. So does nothing ATM
            return arc;
        },
        applyToTriangle(triangle){
            v1x = triangle.p1;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = triangle.p2;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = triangle.p3;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return triangle;
        },
        applyToVecArray(vecArray){
            var i,len = vecArray.length;
            var xdx,xdy,ydx,ydy,ox,oy;
            xdx = this.xAxis.x;
            xdy = this.xAxis.y;
            ydx = this.yAxis.x;
            ydy = this.yAxis.y;
            ox = this.origin.x;
            oy = this.origin.y;
            for(i = 0; i < len; i ++){
                v1x = vecArray.vecs[i];
                vx = v1x.x * xdx + v1x.y * ydx + ox;
                v1x.y = v1x.x * xdy + v1x.y * ydy + oy;
                v1x.x = vx;
            }

            return vecArray;
        },
        applyToPrimitiveArray(primitiveArray){ // Not yet implemented. returns the primitive array
            return primitiveArray;
        },
        fitRectange(rectangle,width,height){ // create a transform that will fit width and height
                                                        // within the rectangle so that transformed 0,0 is rectangle top left
                                                        // and width, height is at rectangle bottom right
            v1.x = rectangle.top.p2.x - rectangle.top.p1.x;
            v1.y = rectangle.top.p2.y - rectangle.top.p1.y;
            this.xAxis.x = v1.x / width;
            this.xAxis.y = v1.y / width;
            this.yAxis.x = (-v1.y * rectangle.aspect) / height;
            this.yAxis.y = (v1.x * rectangle.aspect) / height;
            this.origin.x = rectangle.top.p1.x;
            this.origin.y = rectangle.top.p1.y;
            return this;
        },
        fitLine(line,length,height){ // create a transform that fits length to a line where
                                                // the origin (0,0) is at the line start and (length,0) is
                                                // at the line end.
                                                // -height/2 is above the line and height/2 is below
                                                // Can be used to fit an image to a line.
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            this.xAxis.x = v1.x / length;
            this.xAxis.y = v1.y / length;
            this.yAxis.x = (-v1.y / 2) / height;
            this.yAxis.y = (v1.x / 2) / height;
            this.origin.x = line.p1.x;
            this.origin.y = line.p1.y;
        },
        mirrorX(){ // mirror the transform along its xAxis.
            this.xAxis.x = -this.xAxis.x;
            this.xAxis.y = -this.xAxis.y;
            return this;
        },
        mirrorY(){ // mirror the transform along its yAxis.
            this.yAxis.x = -this.yAxis.x;
            this.yAxis.y = -this.yAxis.y;
            return this;
        },
        mirrorXY(){ // mirror the transform along its x and y Axis.
            this.xAxis.x = -this.xAxis.x;
            this.xAxis.y = -this.xAxis.y;
            this.yAxis.x = -this.yAxis.x;
            this.yAxis.y = -this.yAxis.y;
            return this;
        },
        rotate90 :function (){ // rotates the transform 90 deg clockwise
            v1.x = this.xAxis.x;
            v1.y = this.xAxis.y;
            this.xAxis.x = -this.yAxis.y;
            this.xAxis.y = this.yAxis.x;
            this.yAxis.x = -v1.y;
            this.yAxis.y = v1.x;
            return this;
        },
        isometric(){  // creates an isometric projection keeps the origin
            this.xAxis.x = 1;
            this.xAxis.y = 0.5;
            this.yAxis.x = -1;
            this.yAxis.y = 0.5;
            return this;
        },
        normalisePixelArea(){ // scales the transformation so that the area of a pixel
                                         // is 1
            var scale = 1 / Math.sqrt(
                 (xAxis.x * ( xAxis.y + yAxis.y ) + ( xAxis.x + yAxis.x ) * yAxis.y) -
                 (xAxis.y * ( xAxis.x + yAxis.x ) + ( xAxis.y + yAxis.y ) * yAxis.x)
            );
            xAxis.x *= scale;
            xAxis.y *= scale;
            yAxis.x *= scale;
            yAxis.y *= scale;
            return this;

        },
        isIdentity(){
            if(Math.abs(this.origin.x) > EPSILON){ return false; }
            if(Math.abs(this.origin.y) > EPSILON){ return false; }
            if(Math.abs(this.xAxis.y) > EPSILON){ return false; }
            if(Math.abs(this.yAxis.x) > EPSILON){ return false; }
            if(Math.abs(this.xAxis.x - 1) > EPSILON){ return false; }
            if(Math.abs(this.yAxis.y - 1) > EPSILON){ return false; }
            return true;
        },
        setFastlerp(from, dest){ // sets up fast lerp by pre decomposing from and destination transforms.
            var fl = this.fastLerp = [];
            fl[0] = Math.atan2(from.xAxis.y,from.xAxis.x)
            fl[1] = Math.atan2(-from.yAxis.x,from.yAxis.y) - fl[0];
            fl[2] = Math.hypot(from.xAxis.y,from.xAxis.x);
            fl[3] = Math.hypot(from.yAxis.y,from.yAxis.x);
            fl[4] = from.origin.x;
            fl[5] = from.origin.y;
            fl[6] = Math.atan2(dest.xAxis.y,dest.xAxis.x)
            fl[7] = (Math.atan2(-dest.yAxis.x,dest.yAxis.y) - fl[6]) - fl[1];
            fl[6] -= fl[0];
            fl[8] = Math.hypot(dest.xAxis.y,dest.xAxis.x)- fl[2];
            fl[9] = Math.hypot(dest.yAxis.y,dest.yAxis.x) - fl[3];
            fl[10] = dest.origin.x - fl[4];
            fl[11] = dest.origin.y - fl[5];
            return this;
        },
        fastLerp(amount){
            var fl = this.fastLerp;
            if(fl === undefined){
                return this;
            }
            v1.x = fl[0] + fl[6] * amount;
            v1.y = v1.x + fl[1] + fl[7] * amount;
            v2.x = fl[2] + fl[8] * amount;
            v2.x = fl[3] + fl[9] * amount;
            this.xAxis.x = Math.cos(v1.x) * v2.x;
            this.xAxis.y = Math.sin(v1.x) * v2.x;
            this.yAxis.x = -Math.sin(v1.y) * v2.y;
            this.yAxis.y = Math.cos(v1.y) * v2.y;
            this.origin.x = fl[4] + fl[10] * amount;
            this.origin.y = fl[4] + fl[11] * amount;
            return this;
        },
        lerp(from, dest, amount){
            var fromComp = from.decompose();
            var destComp = dest.decompose();
            this.recompose( {
                rotation : fromComp.rotation + (destComp.rotation - fromComp.rotation) * amount,
                skew : fromComp.skew + (destComp.skew - fromComp.skew) * amount,
                scaleX : fromComp.scaleX + (destComp.scaleX - fromComp.scaleX) * amount,
                scaleY : fromComp.scaleY + (destComp.scaleY - fromComp.scaleY) * amount,
                originX : fromComp.originX + (destComp.originX - fromComp.originX) * amount,
                originY : fromComp.originY + (destComp.originY - fromComp.originY) * amount
            });
            return this;
        },
        asInverseTransform(transform){  // creates a new or uses supplied transform to return the inverse of this matrix
            if(transform === undefined){
                transform = new Transform();
            }
            if (this.xAxis.y === 0 && this.yAxis.x === 0 && this.xAxis.x !== 0 && this.yAxis.y !== 0) {
                transform.xAxis.x = 1 / this.xAxis.x;
                transform.xAxis.y = 0;
                transform.yAxis.x = 0;
                transform.yAxis.y = 1 / this.yAxis.y;
                transform.origin.x = -transform.xAxis.x * this.origin.x;
                transform.origin.y = -transform.yAxis.y * this.origin.y;
                return transform;
            }
            var cross =  this.xAxis.x * this.yAxis.y - this.xAxis.y * this.yAxis.x;
            transform.xAxis.x  = this.yAxis.y / cross;
            transform.xAxis.y  = -this.xAxis.y / cross;
            transform.yAxis.x  = -this.yAxis.x / cross;
            transform.yAxis.y  = this.xAxis.x / cross;
            transform.origin.x = (this.yAxis.x * this.origin.y - this.yAxis.y * this.origin.x) / cross;
            transform.origin.y = -(this.xAxis.x * this.origin.y - this.xAxis.y * this.origin.x) / cross;
            return transform;

        },
        invert: function () { // inverts the transform
            if (this.xAxis.y === 0 && this.yAxis.x === 0 && this.xAxis.x !== 0 && this.yAxis.y !== 0) {
                this.xAxis.x = 1 / this.xAxis.x;
                this.xAxis.y = 0;
                this.yAxis.x = 0;
                this.yAxis.y = 1 / this.yAxis.y;
                this.origin.x = -this.xAxis.x * this.origin.x;
                this.origin.y = -this.yAxis.y * this.origin.y;
                return this;
            }
            var cross =  this.xAxis.x * this.yAxis.y - this.xAxis.y * this.yAxis.x;
            v1.x = this.yAxis.y / cross;
            v1.y = -this.xAxis.y / cross;
            v2.x = -this.yAxis.x / cross;
            v2.y = this.xAxis.x / cross;
            v3.x = (this.yAxis.x * this.origin.y - this.yAxis.y * this.origin.x) / cross;
            v3.y = -(this.xAxis.x * this.origin.y - this.xAxis.y * this.origin.x) / cross;
            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            this.origin.x = v3.x;
            this.origin.y = v3.y;
            return this;
        },
        determinant(){ // returns the determinant of the matrix. I like to call it the axis cross product as it is identical to the cross product of x, and y axis
            return this.xAxis.x * this.yAxis.y - this.xAxis.y * this.yAxis.x;
        },
        mult(transform){
            var tt = transform;
            var t = this;
            v1.x = tt.xAxis.x * t.xAxis.x + tt.yAxis.x * t.xAxis.y;
            v1.y = tt.xAxis.y * t.xAxis.x + tt.yAxis.y * t.xAxis.y;
            v2.x = tt.xAxis.x * t.yAxis.x + tt.yAxis.x * t.yAxis.y;
            v2.y = tt.xAxis.y * t.yAxis.x + tt.yAxis.y * t.yAxis.y;
            v3.x = tt.xAxis.x * t.origin.x + tt.yAxis.x * t.origin.y + tt.origin.x;
            v3.y = tt.xAxis.y * t.origin.x + tt.yAxis.y * t.origin.y + tt.origin.y;
            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            this.origin.x = v3.x;
            this.origin.y = v3.y;
            return this;
        },
        rotate(angle){
            var xdx = Math.cos(angle);
            var xdy = Math.sin(angle);

            v1.x = xdx * this.xAxis.x + (-xdy) * this.xAxis.y;
            v1.y = xdy * this.xAxis.x +  xdx * this.xAxis.y;
            v2.x = xdx * this.yAxis.x + (-xdy) * this.yAxis.y;
            v2.y = xdy * this.yAxis.x +  xdx * this.yAxis.y;
            v3.x = xdx * this.origin.x + (-xdy) * this.origin.y;
            v3.y = xdy * this.origin.x +  xdx * this.origin.y;

            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            this.origin.x = v3.x;
            this.origin.y = v3.y;
            return this;
        },
        scaleUniform(scale){
            this.xAxis.x *= scale;
            this.xAxis.y *= scale;
            this.yAxis.x *= scale;
            this.yAxis.y *= scale;
            this.origin.x *= scale;
            this.origin.y *= scale;
            return this;
        },
        scaleAtPoint (scale,vec){ //scales the transform keeping the location argument vec at the same  screen pos
            v1.x = (vec.x * this.xAxis.x + vec.y * this.yAxis.x + this.origin.x);
            v1.y = (vec.x * this.xAxis.y + vec.y * this.yAxis.y + this.origin.y);
            this.xAxis.x *= scale;
            this.xAxis.y *= scale;
            this.yAxis.x *= scale;
            this.yAxis.y *= scale;
            this.origin.x *= scale;
            this.origin.y *= scale;
            v2.x = (vec.x * this.xAxis.x + vec.y * this.yAxis.x + this.origin.x);
            v2.y = (vec.x * this.xAxis.y + vec.y * this.yAxis.y + this.origin.y);
            this.origin.x -= v2.x - v1.x;
            this.origin.y -= v2.y - v1.y;
            return this;
        },
        scale(scaleX,scaleY){
            this.xAxis.x *= scaleX;
            this.xAxis.y *= scaleY;
            this.yAxis.x *= scaleX;
            this.yAxis.y *= scaleY;
            this.origin.x *= scaleX;
            this.origin.y *= scaleY;
            return this;
        },
        scaleX(scaleX){
            this.xAxis.x *= scaleX;
            this.yAxis.x *= scaleX;
            this.origin.x *= scaleX;
            return this;
        },
        scaleY(scaleY){
            this.xAxis.y *= scaleY;
            this.yAxis.y *= scaleY;
            this.origin.y *= scaleY;
            return this;
        },
        shear(sx, sy){
            v1.x = this.xAxis.x + this.yAxis.x * sy;
            v1.y = this.xAxis.y + this.yAxis.y * sy;
            v2.x = this.xAxis.x * sx + this.yAxis.x;
            v2.y = this.xAxis.y * sx + this.yAxis.y;
            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            return this;
        },
        shearX(sx){
            this.yAxis.x += this.xAxis.x * sx;
            this.yAxis.y += this.xAxis.y * sx;
            return this;
        },
        shearY(sy){
            this.xAxis.x += this.yAxis.x * sy;
            this.xAxis.y += this.yAxis.y * sy;
            return this;
        },
        translate(x,y){
            this.origin.x +=  x;
            this.origin.y +=  y;
            return this;
        },
        translateX(x){
            this.origin.x += x;
            return this;
        },
        translateY(y){
            this.origin.y += y;
            return this;
        },
        setAs(transform) {
            this.xAxis.x = transform.xAxis.x;
            this.xAxis.y = transform.xAxis.y;
            this.yAxis.x = transform.yAxis.x;
            this.yAxis.y = transform.yAxis.y;
            this.origin.x = transform.origin.x;
            this.origin.y = transform.origin.y;
            return this;
        },
        setContextTransform(ctx){
            ctx.setTransform(this.xAxis.x,this.xAxis.y,this.yAxis.x,this.yAxis.y,this.origin.x,this.origin.y);
            return this;
        },
        multiplyContextTransform(ctx){
            ctx.transform(this.xAxis.x,this.xAxis.y,this.yAxis.x,this.yAxis.y,this.origin.x,this.origin.y);
            return this;
        },
        setOrigin(vec){
            this.origin.x = vec.x;
            this.origin.y = vec.y;
            return this;
        },
        negateOrigin(){
            this.origin.x = -this.origin.x;
            this.origin.y = -this.origin.y;
            return this;
        },
        setXAxis(vec){
            this.xAxis.x = vec.x;
            this.xAxis.y = vec.y;
            return this;
        },
        setYAxis(vec){
            this.yAxis.x = vec.x;
            this.yAxis.y = vec.y;
            return this;
        },
        setAxisAngles(angleX, angleY){
            vx = Math.hypot(this.xAxis.x, this.xAxis.y);
            vy = Math.hypot(this.yAxis.x, this.yAxis.y);
            this.xAxis.x = Math.cos(angleX) * vx;
            this.xAxis.y = Math.sin(angleX) * vx;
            this.yAxis.x = Math.cos(angleY) * vy;
            this.yAxis.y = Math.sin(angleY) * vy;
            return this;
        },
        setXAxisAngle(angle){
            vx = Math.hypot(this.xAxis.x, this.xAxis.y);
            this.xAxis.x = Math.cos(angle) * vx;
            this.xAxis.y = Math.sin(angle) * vx;
            return this;
        },
        setYAxisAngle(angle){
            vy = Math.hypot(this.yAxis.x, this.yAxis.y);
            this.yAxis.x = Math.cos(angle) * vy;
            this.yAxis.y = Math.sin(angle) * vy;
            return this;
        },
        skew(){ // returns the skew angle
            return Math.atan2(-this.yAxis.x,this.yAxis.y) -  Math.atan2(this.xAxis.y,this.xAxis.x) ;
        },
        setSkew(angle){ // sets the skew angle
            var scaleY = Math.hypot(this.yAxis.y, this.yAxis.x);
            var rot = Math.atan2(this.xAxis.y, this.xAxis.x) + MPI90 + angle;
            this.yAxis.x = Math.cos(rot) * scaleY;
            this.yAxis.y = Math.sin(rot) * scaleY;
            return this;
        },
        recompose(composit){ // creates a matrix from a decomposed matrix
                                        // rotation (direction of xAxis)
                                        // skew (offset from +90deg of yAxis. ie skew = 0 then yAxis is 90deg from xAxis)
                                        // scaleX scale of xAxis
                                        // scaleY scale oy yAxis
                                        // originX,originY
            this.xAxis.x = Math.cos(composit.rotation) * composit.scaleX;
            this.xAxis.y = Math.sin(composit.rotation) * composit.scaleX;
            this.yAxis.x = -Math.sin(composit.rotation + composit.skew) * composit.scaleY;
            this.yAxis.y = Math.cos(composit.rotation + composit.skew) * composit.scaleY;
            this.origin.x = composit.originX;
            this.origin.y = composit.originY;
            return this;
        },
        decomposeScale(){ //returns the current scale of the transform. This assumes the scale is uniform
            return Math.hypot(this.xAxis.y,this.xAxis.x);
        },
        decomposeType(type){ // returns the decomposed item dependent on type. ["rotation","scale","scalex","scaley","skew"]);
            type = type.toLowerCase();
            switch(type){
                case "rotation":
                    return Math.atan2(this.xAxis.y, this.xAxis.x);
                case "scale":
                case "scalex":
                    return Math.hypot(this.xAxis.y, this.xAxis.x);
                case "scaley":
                    return Math.hypot(this.yAxis.y, this.yAxis.x);
                case "skew":
                    return Math.atan2(-this.yAxis.x, this.yAxis.y) - Math.atan2(this.xAxis.y, this.xAxis.x)
            }
            return this.decompose();
        },
        decompose(){
            var r;
            return {
                rotation : (r = Math.atan2(this.xAxis.y, this.xAxis.x)),
                skew : Math.atan2(-this.yAxis.x, this.yAxis.y) - r,
                scaleX : Math.hypot(this.xAxis.y, this.xAxis.x),
                scaleY : Math.hypot(this.yAxis.y, this.yAxis.x),
                originX : this.origin.x,
                originY : this.origin.y
            };
        },
        asSVG(svgMatrix){
            if(svgMatrix === undefined){
                if( ! ( svgMatrix = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix() )){
                    return undefined;
                }
            }else{
                // reset to identity.
                svgMatrix.b = svgMatrix.c = svgMatrix.e = svgMatrix.f = 0;
                svgMatrix.a = svgMatrix.d = 1;
            }
            svgMatrix = svgMatrix.translate(this.origin.x, this.origin.y);
            svgMatrix = svgMatrix.rotate(Math.atan2(this.xAxis.y,this.xAxis.x) * MR2D);		// inDegress degrees
            svgMatrix = svgMatrix.scaleNonUniform(
                    Math.hypot(this.xAxis.y,this.xAxis.x),
                    Math.hypot(this.yAxis.y,this.yAxis.x)
            );
            var skew = Math.atan2(-this.yAxis.x,this.yAxis.y);
            if(Math.abs(skew) > EPSILON){
                svgMatrix = svgMatrix.skewY(skew * MR2D); // in degrees
            }
            return svgMatrix;
        }
    }


    var geom = new Geom();
    geom.Geom = Geom;  // add geom to geom object for use by extensions or anything that needs to
                       // extend the prototype of Geom.
    geom.init();
    geom.debugArray = [];  // for debug stuff. ONLY use for debug, this var can be removed at any time.
    return geom
})();



