import {} from "./utils/MathExtensions.jsm";
const V2 = (x = 0, y = 0) => ({x, y}); // best to avoid creating these in performant code
export {Vec2, V2};
function Vec2(x = 1, y = 0) {
	this.x = x;
	this.y = y;
}
Vec2.distanceSqrA = 0;
Vec2.distanceSqrB = 0;
Vec2.angleBetween = function (xa,ya,xb,yb) {
    const l = Math.sqrt((Vec2.distanceSqrA = xa * xa + ya * ya) * (Vec2.distanceSqrB = xb * xb + yb * yb));
    var ang = 0;
    if (l !== 0) {
        ang = Math.asin((xa  * yb  - ya * xb) / l);
        if (xa  * xb  + ya * yb < 0) { ang = (ang < 0 ? -Math.PI: Math.PI) - ang }
    }
    return ang;
}
Vec2.prototype = {
	init(x, y) {
		this.x = x;
		this.y = y;
		return this;
	},
	initPolar(ang, dist = 1) {
		this.x = Math.cos(ang) * dist;
		this.y = Math.sin(ang) * dist;
        return this;
	},
    copyOf(vec2) {
		this.x = vec2.x;
		this.y = vec2.y;
		return this;
	},
	zero() { this.x = this.y = 0; return this },
	clone() { return new Vec2(this.x, this.y) },
	fromArray(arr, idx) {
		this.x = arr[idx];
		this.y = arr[idx+1];
		return this;
	},
    setArray(arr, idx) {
		arr[idx] = this.x;
		arr[idx+1] = this.y;
		return this;
	},
	scale(s, res = this) {
		res.x = this.x * s;
		res.y = this.y * s;
		return res;
	},
	divide(v, res = this) {  // dont let v be zero
		res.x = this.x / v;
		res.y = this.y / v;
		return res;
	},
	addPolar(ang, dist, res = this) {
		res.x = this.x + Math.cos(ang) * dist;
		res.y = this.y + Math.sin(ang) * dist;
		return res;
	},
	addPolarVec(ang, dist, res = this) {  // dist is Vec2
		res.x = this.x + Math.cos(ang) * dist.x;
		res.y = this.y + Math.sin(ang) * dist.y;
		return res;
	},
	add(B, res = this) {
		res.x = this.x + B.x;
		res.y = this.y + B.y;
		return res;
	},
	addScaled(scale, B, res = this) {
	    res.x = this.x + B.x * scale;
	    res.y = this.y + B.y * scale;
	    return res;
	},
	sub(B, res = this) {
		res.x = this.x - B.x;
		res.y = this.y - B.y;
		return res;
	},
	transform(t, o, res = this) {
		var x = this.x;
		var y = this.y;
		res.x = x * t.x - y * t.y + o.x;
		res.y = x * t.y + y * t.x + o.y;
		return res;
	},
	transformRot(t, res = this) {
		var x = this.x;
		var y = this.y;
		res.x = x * t.x - y * t.y;
		res.y = x * t.y + y * t.x;
		return res;
	},
	toAxisX() {
		this.x = this.length;
		this.y = 0;
		return this;
	},
	toAxisY() {
		this.y = this.length;
		this.x = 0;
		return this;
	},
	toUnitAxisX() {
		this.x = 1;
		this.y = 0;
		return this;
	},
	toUnitAxisY() {
		this.x = 0;
		this.y = 1;
		return this;
	},
	normalize(res = this) {
		const len = this.length;
		if (len === 0) {
			res.toUnitAxisX();
		} else {
			res.x = this.x / len;
			res.y = this.y / len;
		}
		return res;
	},
	distanceFrom(v) {
		const x = this.x - v.x;
		const y = this.y - v.y;
		return (x * x + y * y) ** 0.5;
	},
	get lengthSqr() { return this.x * this.x + this.y * this.y },
	get length() { return (this.x * this.x + this.y * this.y) ** 0.5 },
	set length(len) {
		const scale = (len * len) / this.lengthSqr;
		this.x *= scale;
		this.y *= scale;
	},
    get direction() { return Math.atan2(this.y, this.x) },
	chase(v, C, accel = 0.5, drag = 0.5) {
		this.x += (C.x = (C.x += (v.x - this.x) * accel) * drag);
		this.y += (C.y = (C.y += (v.y - this.y) * accel) * drag);
		return this;
	},
	dot(B) { return this.x * B.x + this.y * B.y },
	cross(B) { return this.x * B.y - this.y * B.x },
	reverse(res = this) {
		res.x = -this.x;
		res.y = -this.y;
		return res;
	},
	rotate90(res = this) {
		const x = this.x;
		res.x = -this.y;
		res.y = x;
		return res;
	},
	rotateNeg90(res = this) {
		const x = this.x;
		res.x = this.y;
		res.y = -x;
		return res;
	},
	angleTo(B) {
		const xa = this.x, ya = this.y;
		const xb = B.x, yb = B.y;
		const l = Math.sqrt((xa * xa + ya * ya) * (xb * xb + yb * yb));
		var ang = 0;
		if (l !== 0) {
			ang = Math.asin((xa  * yb  - ya * xb) / l);
			if (xa  * xb  + ya * yb < 0) { ang = (ang < 0 ? -Math.PI: Math.PI) - ang }
		}
		return ang;
	},
	unitDistanceAlongLineSeg(A, B) {
		const vx = B.x - A.x;
		const vy = B.y - A.y;
		return ((this.x - A.x) * vx + (this.y - A.y) * vy) / (vy * vy + vx * vx);
	},
	distanceFromLineSeg(A, B, res){  // Line A B. If res given then will be set to point on line closest to this if point on line segment
		var x = this.x;
		var y = this.y;
		const vx = B.x - A.x;
		const vy = B.y - A.y;
		var u = Vec2.u = ((x - A.x) * vx + (y - A.y) * vy) / (vy * vy + vx * vx);
		if (res) {
			if (u <= 0) {
				x -= (res.x = A.x);
				y -= (res.y = A.y);
			} else if (u >= 1) {
				x -= (res.x = B.x);
				y -= (res.y = B.y);
			} else {
				x -= (res.x = A.x + vx * u);
				y -= (res.y = A.y + vy * u);
			}
		} else {
			if (u <= 0) {
				x -= A.x;
				y -= A.y;
			} else if (u >= 1) {
				x -= B.x;
				y -= B.y;
			} else {
				x -= A.x + vx * u;
				y -= A.y + vy * u;
			}
		}
		return (x * x + y * y) ** 0.5;
	},
    toString(d = 4) { return `{x: ${this.x.toFixed(d)}, y: ${this.y.toFixed(d)}}` },
    *[Symbol.iterator] () {
		yield this.x;
		yield this.y;
	}
}