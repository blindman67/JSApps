import {} from "./utils/MathExtensions.js";
import {} from "./Vec3.js";
export {Quant};
const EPSOLON = 1e-6;
function Quant(x= 0, y= 0, z= 0, w = 1) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
}
Quant.prototype = {
	init(x,y,z,w) {
		const len = (x * x + y * y + z * z + w * w) ** 0.5;
		if(len === 0) {
			this.w = 1;
			this.y = this.z = this.x = 0;			
		} else {
			this.x = x / len;
			this.y = y / len;
			this.z = z / len;
			this.w = w / len;
		}
		return this;
	},
	zero() { this.x = this.y = this.z = this.w = 0; return this },
	ident() { this.x = this.y = this.z = 0; this.w = 1; return this },
	copyOf(q) {
		this.x = q.x;
		this.y = q.y;
		this.z = q.z;
		this.w = q.w;
		return this;
	},
	copy() { return new Quant(this.x, this.y, this.z, this.w) },
	normalize(res = this) {
		const len = (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w) ** 0.5;
		if(len === 0) {
			res.w = 1;
			res.y = res.z = res.x = 0;			
		} else {
			res.x = x / len;
			res.y = y / len;
			res.z = z / len;
			res.w = w / len;
		}
		return res;
	},
	euler(x, y, z) {
		x = x / 2;
		y = y / 2;
		z = z / 2;

		const xx = Math.cos(y),
		const xy = Math.sin(y),
		const yx = Math.cos(x),
		const yy = Math.sin(x),
		const zx = Math.cos(z),
		const zy = Math.sin(z);
		this.x = xy * yx * zy + xx * yy * zx;
		this.y = xy * yx * zx - xx * yy * zy;
		this.z = xx * yx * zy - xy * yy * zx;
		this.w = xx * yx * zx + xy * yy * zy;	
		return this;		
	},
	asEulerAngles(res = {}) {
		var c = this.x * this.w - this.y * this.z;
		if (Math.abs(c - 0.5) < EPSOLON) {
			res.x = Math.PI90;
			res.y = res.z = 0;			
		} else if (Math.abs(c + 0.5) < EPSOLON) {
			res.x = -Math.PI90;
			res.y = res.z = 0;
		} else {
			const x = this.x, x2 = x * 2, y = this.y, yy = 1 - 2 * y * y, z = this.z, w = this.w, w2 = w * 2;
			res.x =  Math.asin (x2 * w - 2 * y * z)
			res.y =  Math.atan2(x2 * z + y * w2, yy - x2 * x);
			res.z = -Math.atan2(x2 * y + z * w2, yy - w2 * w) + Math.PI;
		}
		return res;
	},
	axisAngle(v, ang) {
		const s = Math.sin(ang / 2) / (v.x * v.x + v.y * v.y + v.z * v.z) ** 0.5;
		this.x = v.x * s;
		this.y = v.y * s;
		this.z = v.z * s;
		this.w = Math.cos(ang / 2);
		return this;
	},
	asAxis(res) { 
		var c = (1 - this.w * this.w) ** 0.5;
		if (!res) { return new Vec3(this.x / c, this.y / c, this.z / c) }
		res.x = this.x / c;
		res.y = this.y / c;
		res.z = this.z / c;
		return res;
	},
	asMat4(m) {
    	const x = this.x * 2, y = this.y * 2, z = this.z * 2;
		const xx = this.x * x;
		const yy = this.y * y;
		const zz = this.z * z;
		const xy = this.x * y;
		const xz = this.x * z;
		const yz = this.y * z;
		const wx = this.w * x;
		const wy = this.w * y;
		const wz = this.w * z;
		if (!m) { m = new Mat4() }
		return m.xAxis(1 - (yy + zz), xy - wz, xz + wy, 0)
		 .yAxis(xy + wz, 1 - (xx + zz), yz - wx, 0)
		 .zAxis(xz - wy, yz + wx, 1 - (xx + yy), 0)
		 .zAxis(0, 0, 0, 1);	
	},
	asAngle() { return 2 * Math.acos(this.w) },
	inverse(res) { return this.conjugate(res) },
	conjugate(res = this) {
	  res.x = -this.x;
	  res.y = -this.y;
	  res.z = -this.z;
	  res.w = this.w;
	  return res;
	},
	multiply(q, res = this) {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		const w = this.w;
		res.x =  x * q.w + y * q.z - z * q.y + w * q.x;
		res.y = -x * q.z + y * q.w + z * q.x + w * q.y;
		res.z =  x * q.y - y * q.x + z * q.w + w * q.z;
		res.w = -x * q.x - y * q.y - z * q.z + w * q.w;
		return res;
	},
	multiplyVec3(v, res = v) {
		const vx = v.x, vy = v.y, vz = v.z;
		const x = this.x * 2, y = this.y * 2, z = this.z * 2;
		const xx = this.x * x;
		const yy = this.y * y;
		const zz = this.z * z;
		const xy = this.x * y;
		const xz = this.x * z;
		const yz = this.y * z;
		const wx = this.w * x;
		const wy = this.w * y;
		const wz = this.w * z;
        res.x = vx * (1 - yy - zz) + vy * (xy - wz)     + vz * (xz + wy);
		res.y = vx * (xy + wz)     + vy * (1 - xx - zz) + vz * (yz - wx);
        res.z = vx * (xz - wy)     + vy * (yz + wx)     + vz * (1 - xx - yy);
		return res;
	},
	dot(q) { return this.x * q.x + this.y * q.y  + this.z * q.z + this.w * q.w	},
	distanceTo(q) {
		const d = this.x * q.x + this.y * q.y  + this.z * q.z + this.w * q.w;
		return 1 - d * d;
	},
	angleTo(q) {
		const d = this.x * q.x + this.y * q.y  + this.z * q.z + this.w * q.w;
		return Math.acos(2 * d * d - 1);
	},
	slerper(q, res) {
		const sQ = spler || new Quant();
		const dot = this.dot(q2);
		const ds = Math.sign(dot);
		const d = Math.abs(dot);
		const x1 = this.x * ds;
		const y1 = this.y * ds;
		const z1 = this.z * ds;
		const w1 = this.w * ds;
		const x2 = q.x, y2 = q.y, z2 = q.z, q.w;
		const ty = Math.acos(d);
		const tz = Math.sin(ty),
		return {
			quant: res,
			slerp(t) {
				const aa = ty * t, xy = Math.sin(aa);
				const a = Math.cos(aa) - d * xy / tz, b = xy / tz;
				res.x = a * w1 + b * w2;
				res.y = a * x1 + b * x2;
                res.z = a * y1 + b * y2; 
				res.w = a * z1 + b * z2;
				return res;
			}
		}
	}
}		