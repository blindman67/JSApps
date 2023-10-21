

const {Vector, Vec2} = (() => {
    class Vec2 {
        constructor(x = 0, y = 0) { this.x = x; this.y = y; }
        clone() { return new Vector(this.x, this.y); }
        set(x, y) { this.x = x; this.y = y; return this; }
        setVec(v) { this.x = v.x; this.y = v.y; return this; }
        zero() { this.x = 0; this.y = 0; return this; }       
        magnitude() { return Math.sqrt((this.x * this.x) + (this.y * this.y)) }
        magnitudeSquared() { return (this.x * this.x) + (this.y * this.y) }
        distSqrTo(p) {
            const dx = this.x - p.x, dy = this.y - p.y;
            return dx * dx + dy * dy;
        }
        rotateVec(angle, vec = this) {
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const x = this.x * cos - this.y * sin;
            vec.y = this.x * sin + this.y * cos;
            vec.x = x;
            return vec;
        }        
        rotate(angle) {
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const x = this.x * cos - this.y * sin;
            this.y = this.x * sin + this.y * cos;
            this.x = x;
            return this; 
        }
        rotateAboutVec(angle, point, vec = this) {
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const xx = this.x - point.x;
            const yy = this.y - point.y;
            const x = point.x + xx * cos - yy * sin;
            vec.y = point.y + xx * sin + yy * cos;
            vec.x = x;
            return vec;
        }        
        rotateAbout(angle, point) {
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const xx = this.x - point.x;
            const yy = this.y - point.y;
            const x = point.x + xx * cos - yy * sin;
            this.y = point.y + xx * sin + yy * cos;
            this.x = x;
            return this; 
        }
        normaliseVec(vec = this) {
            var mag = this.magnitude();
            if (mag === 0) { return vec.zero(); }
            mag = 1 / mag;
            return vec.set(this.x * mag, this.y * mag);
        }
        normalise() {
            var mag = this.magnitude();
            if (mag === 0) { this.zero(); }
            else {
                mag = 1 / mag;
                this.x *= mag;
                this.y *= mag;
            }
            return this; 
        }
        normalizeVec(vec = this) {
            var mag = this.magnitude();
            if (mag === 0) { return vec.zero(); }
            mag = 1 / mag;
            return vec.set(this.x * mag, this.y * mag);
        }        
        normalize() {
            var mag = this.magnitude();
            if (mag === 0) { this.zero(); }
            else {
                mag = 1 / mag;
                this.x *= mag;
                this.y *= mag;
            }
            return this; 
        }        
        dot(b) { return this.x * b.x + this.y * b.y }
        dot3(b) { return b.x * b.x + b.y * b.y + b.x * this.x + b.y * this.y + this.x * this.x + this.y * this.y }
        cross(b) { return this.x * b.y - this.y * b.x }
        cross3(b, c) { return (b.x - this.x) * (c.y - this.y) - (b.y - this.y) * (c.x - this.x) }
        addVec(b, vec = this) { return vec.set(this.x + b.x, this.y + b.y)  }
        add(b) { this.x += b.x; this.y += b.y; return this }
        addScaled(b, s) { this.x += b.x * s; this.y += b.y * s; return this }
        subVec(b, vec = this) { return vec.set(this.x - b.x, this.y - b.y)  }
        sub(b) { this.x -= b.x; this.y -= b.y; return this }
        multVec(scalar, vec = this) { return vec.set(this.x * scalar, this.y * scalar) }
        mult(scalar) { this.x *= scalar; this.y *= scalar; return this }
        divVec(scalar, vec = this) { scalar = 1 / scalar; return vec.set(this.x * scalar, this.y * scalar) }
        div(scalar) { scalar = 1 / scalar; this.x *= scalar; this.y *= scalar; return this; }
        perpVec(negate, vec = this) {
            negate = negate === true ? -1 : 1;
            return vec.set(negate * -this.y, negate * this.x);
        }
        perp(negate) {
            negate = negate === true ? -1 : 1;
            this.x = negate * -this.y; this.y *= negate;
            return this; 
        }
        negVec(vec = this) { return vec.set(-this.x, -this.y); }
        neg() { this.x = -this.x; this.y = -this.y; return this; }
        min(x, y) { x < this.x && (this.x = x); y < this.y && (this.y = y); return this; }
        max(x, y) { x > this.x && (this.x = x); y > this.y && (this.y = y); return this; }
        minVec(v) { v.x < this.x && (this.x = v.x); v.y < this.y && (this.y = v.y); return this; }
        maxVec(v) { v.x > this.x && (this.x = v.x); v.y > this.y && (this.y = v.y); return this; }
        rot90() {
            const xx = this.x;
            this.x = -this.y;
            this.y = xx;
            return this;
        }
        angle(b) { return Math.atan2(b.y - this.y, b.x - this.x) }
    }
    class Vector {
        constructor(x, y) { this.x = x; this.y = y; }
        static create(x = 0, y = 0) { return new Vec2(x, y); }
        static Point() { return new Vec2(); }
        static clone(vec) { return new Vec2(vec.x, vec.y); }
        static magnitude(vec) { return Math.sqrt((vec.x * vec.x) + (vec.y * vec.y)); }
        static magnitudeSquared(vec) { return (vec.x * vec.x) + (vec.y * vec.y); }
        static rotate(vec, angle, out = {}) {
            var cos = Math.cos(angle), sin = Math.sin(angle);
            var x = vec.x * cos - vec.y * sin;
            out.y = vec.x * sin + vec.y * cos;
            out.x = x;
            return out;
        }
        static rotateAbout(vec, angle, point, out = {}) {
            var cos = Math.cos(angle), sin = Math.sin(angle);
            var x = point.x + ((vec.x - point.x) * cos - (vec.y - point.y) * sin);
            out.y = point.y + ((vec.x - point.x) * sin + (vec.y - point.y) * cos);
            out.x = x;
            return out;
        }
        static normalise(vec) {
            var magnitude = Vector.magnitude(vec);
            if (magnitude === 0) { return { x: 0, y: 0 }; }
            return { x: vec.x / magnitude, y: vec.y / magnitude };
        }
        static dot(vecA, vecB) { return (vecA.x * vecB.x) + (vecA.y * vecB.y); }
        static cross(vecA, vecB) { return (vecA.x * vecB.y) - (vecA.y * vecB.x); }
        static cross3(vecA, vecB, vecC) { return (vecB.x - vecA.x) * (vecC.y - vecA.y) - (vecB.y - vecA.y) * (vecC.x - vecA.x); }
        static add(vecA, vecB, out = {}) {
            out.x = vecA.x + vecB.x;
            out.y = vecA.y + vecB.y;
            return out;
        }
        static sub(vecA, vecB, out = {}) {
            out.x = vecA.x - vecB.x;
            out.y = vecA.y - vecB.y;
            return out;
        }
        static mult(vec, scalar) {  return { x: vec.x * scalar, y: vec.y * scalar }; }
        static div(vec, scalar) { return { x: vec.x / scalar, y: vec.y / scalar }; }
        static perp(vec, negate) {
            negate = negate === true ? -1 : 1;
            return { x: negate * -vec.y, y: negate * vec.x };
        }
        static neg(vec) { return { x: -vec.x, y: -vec.y }; }
        static angle(vecA, vecB) {  return Math.atan2(vecB.y - vecA.y, vecB.x - vecA.x); }     
        static vec2Pool = [new Vec2()];
    }
 
    return {Vector, Vec2};    
})();

export {Vector, Vec2};