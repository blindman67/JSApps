import {} from "./utils/MathExtensions.js";
import {Vec3} from "./Vec3.js";
export {Mat4};

// Mat array Index as axis eg XAX is x axis x component
const XAX = 0, XAY = 1, XAZ = 2, XAW = 3;     // xAxis
const YAX = 4, YAY = 5, YAZ = 6, YAW = 7;     // yAxis
const ZAX = 8, ZAY = 9, ZAZ = 10, ZAW = 11;   // zAxis
const WAX = 12, WAY = 13, WAZ = 14, WAW = 15; // wAxis
const OX = WAX, OY = WAY, OZ = WAZ, OW = WAW;  // Origin
const SX = XAX, SY = YAY, SZ = ZAZ, SW = WAW;  // Scale

// Working vectors (rather than create new ones each time) to reduce GC and allocation/heap overheads
const wp1 = new Vec3();
const wp2 = new Vec3();
const wp3 = new Vec3();
const wp4 = new Vec3();
const wAxisX = new Vec3(1,0,0);
const wAxisY = new Vec3(0,1,0);
const wAxisZ = new Vec3(0,0,1);

const IDENT = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
const IDENT4By3 = [1,0,0,0, 0,1,0,0, 0,0,1,0];

function Mat4() {
	this.m = [...IDENT];
	this.s = [...IDENT];
}
Mat4.prototype = {
	ident3() {  
		this.m[0] = this.m[5] = this.m[10] = 1;
		this.m[1] = this.m[2] = this.m[4] = this.m[6] = this.m[8] = this.m[9] = 0;
		return this;
	},
	identOrigin() {
		this.m[OX] = this.m[OY] = this.m[OZ] = 0;
		this.m[OW] = 1;
		return this;
	},
	ident() { 
		this.m.set(IDENT); 
		return this;
	},
	save() {
		if (this.s === undefined) {
			if (this.m instanceof Array) { this.s = [...this.m] }
			else { this.s = new Float32Array(this.m) }
		} else { this.s.set(this.m) }
	},
	restore() { this.m.set(this.s) },
	useFloat32Array() {
		if (this.m instanceof Array) { 
			this.m = new Float32Array(this.m);
			this.s !== undefined && (this.s = new Float32Array(this.s));
		}
		return this;
	},
	useArray() {
		if (!(this.m instanceof Array)) { 
			this.m = new Array(this.m);
			this.s !== undefined && (this.s = [...this.s]);
		}
		return this;
	},
	transformPoint(point, res = point) { // point as Vec3
		const m = this.m;
		const {x, y, z} = point;
		res.x = x * m[XAX] + y * m[YAX] + z * m[ZAX] + m[WAX];
		res.y = x * m[XAY] + y * m[YAY] + z * m[ZAY] + m[WAY];
		res.z = x * m[XAZ] + y * m[YAZ] + z * m[ZAZ] + m[WAZ];
		return res;
	},
	transformPoint4(point, res = point) { // point as Vec3 with w added. Assumes point.w === 1;
		const m = this.m;
		const {x, y, z} = point;
		res.x = x * m[XAX] + y * m[YAX] + z * m[ZAX] + m[WAX];
		res.y = x * m[XAY] + y * m[YAY] + z * m[ZAY] + m[WAY];
		res.z = x * m[XAZ] + y * m[YAZ] + z * m[ZAZ] + m[WAZ];
		res.w = x * m[XAW] + y * m[YAW] + z * m[ZAW] + m[WAW];
		return res;
	},
	direction(bearing, elevation) {
		const m = this.m;
		const ec = Math.cos(elevation);
		const es = Math.sin(elevation);
		const bc = Math.cos(bearing);
		const bs = Math.sin(bearing);
		wp1.init(bc * ec, es, bs * ec);
		wp2.init(-bs, 0, bc);
		wp1.cross(wp2, wp3);
		m[XAX] = wp1.x; m[XAY] = wp1.y; m[XAZ] = wp1.z;
		m[YAX] = wp3.x; m[YAY] = wp3.y; m[YAZ] = wp3.z;
		m[ZAX] = wp2.x; m[ZAY] = wp2.y; m[ZAZ] = wp2.z;
		return this;
	},
	rotateY3(angle) {
		workMat.ident3().yaw = angle;
		return this.multiply3(workMat);		
	},
	rotateX3(angle) {
		workMat.ident3().pitch = angle;
		return this.multiply3(workMat);		
	},
	rotateZ3(angle) {
		workMat.ident3().roll = angle;
		return this.multiply3(workMat);		
	},
    rotateAxis(axis, angle, res = this) {
        const m = this.m, b = res.m;
        const len = (axis.x * axis.x + axis.y * axis.y + axis.z * axis.z) ** 0.5;
        const x = axis.x / len, xs = x * x;
        const y = axis.y / len, ys = y * y;
        const z = axis.z / len, zs = z * z;
        const c = Math.cos(angle), omc = 1 - c;
        const s = Math.sin(angle);

        const xx = (1 - xs) * c + xs;
        const yy = (1 - ys) * c + ys;
        const zz = (1 - zs) * c + zs;
        const xy = x * y * omc + z * s;
        const xz = x * z * omc - y * s;
        const yx = x * y * omc - z * s;
        const yz = y * z * omc + x * s;
        const zx = x * z * omc + y * s;
        const zy = y * z * omc - x * s;

        const m00 = m[XAX], m01 = m[XAY], m02 = m[XAZ], m03 = m[XAW];
        const m10 = m[YAX], m11 = m[YAY], m12 = m[YAZ], m13 = m[YAW];
        const m20 = m[ZAX], m21 = m[ZAY], m22 = m[ZAZ], m23 = m[ZAW];

        b[XAX] = xx * m00 + xy * m10 + xz * m20;
        b[XAY] = xx * m01 + xy * m11 + xz * m21;
        b[XAZ] = xx * m02 + xy * m12 + xz * m22;
        b[XAW] = xx * m03 + xy * m13 + xz * m23;
        b[YAX] = yx * m00 + yy * m10 + yz * m20;
        b[YAY] = yx * m01 + yy * m11 + yz * m21;
        b[YAZ] = yx * m02 + yy * m12 + yz * m22;
        b[YAW] = yx * m03 + yy * m13 + yz * m23;
        b[ZAX] = zx * m00 + zy * m10 + zz * m20;
        b[ZAY] = zx * m01 + zy * m11 + zz * m21;
        b[ZAZ] = zx * m02 + zy * m12 + zz * m22;
        b[ZAW] = zx * m03 + zy * m13 + zz * m23;
        b[WAX] = m[WAX];
        b[WAY] = m[WAY];
        b[WAZ] = m[WAZ];
        b[WAW] = m[WAW];
        return res;
    },
    setRotateAxis(axis, angle, res = this) {
        const m = this.m, b = res.m;
        const len = (axis.x * axis.x + axis.y * axis.y + axis.z * axis.z) ** 0.5;
        const c = Math.cos(angle), c1 = 1 - c;
        const s = Math.sin(angle);
        const x = axis.x / len;
        const y = axis.y / len;
        const z = axis.z / len;
        var cc1, zs, xs, ys;
        b[XAX] = c + x * (cc1 = x * c1);
        b[XAY] = y * cc1 - (zs = z * s);
        b[XAZ] = z * cc1 + (ys = y * s);
        b[XAW] = 0;
        b[YAX] = x * (cc1 = y * c1) + zs;
        b[YAY] = c + y * cc1;
        b[YAZ] = z * cc1 - (xs = x * s);
        b[YAW] = 0;       
        b[ZAX] = x * (cc1 = z * c1) - ys;
        b[ZAY] = y * cc1 + xs;
        b[ZAZ] = c + z * cc1;
        b[ZAW] = 0;       
        b[WAX] = 0;
        b[WAY] = 0;
        b[WAZ] = 0;
        b[WAW] = 1;     
        return res;
    },        
	set yawPitch(v) {
		const m = this.m;		
		const yx = Math.cos(v.x);
		const yz = Math.sin(v.x);
		const px = Math.cos(v.y);
		const pz = Math.sin(v.y);
		const x = m[XAX] = yx * px;
		const z = m[XAZ] = yz * px;
		m[XAY] = pz;
		m[ZAX] = -yz;
		m[ZAY] = 0;
		m[ZAZ] = yx;
		m[YAX] = pz * yx;
		m[YAY] = -z * yz - x * yx;
		m[YAZ] = pz * yz;		
	},
	set yaw(angle) {
		const m = this.m;		
		const x = Math.cos(angle);
		const z = Math.sin(angle);
		m[XAX] = x;
		m[XAZ] = z;
		m[ZAX] = -z;
		m[ZAZ] = x;
	},
	set pitch(angle) {
		const m = this.m;	
		const x = Math.cos(angle);
		const z = Math.sin(angle);
		m[YAY] = x;
		m[YAZ] = z;
		m[ZAY] = -z;
		m[ZAZ] = x;
	},
	set roll(angle) {
		const m = this.m;		
		const x = Math.cos(angle);
		const z = Math.sin(angle);
		m[XAX] = x;
		m[XAY] = z;
		m[YAX] = -z;
		m[YAY] = x;
	},
	set position(point) {
		const m = this.m;
		m[OX] = point.x;
		m[OY] = point.y;
		m[OZ] = point.z;
		m[OW] = 1;
	},
	set origin(point) { this.position = point },	
	set xAxisVec3(v) {
		const m = this.m;
		m[XAX] = v.x; m[XAY] = v.y; m[XAZ] = v.z; m[XAW] = 0;
	},	
	set yAxisVec3(v) {
		const m = this.m;
		m[YAX] = v.x; m[YAY] = v.y; m[YAZ] = v.z; m[YAW] = 0;
	},
	set zAxisVec3(v) {
		const m = this.m;
		m[ZAX] = v.x; m[ZAY] = v.y; m[ZAZ] = v.z; m[ZAW] = 0;
	},	
	set wAxisVec3(v) {
		const m = this.m;
		m[WAX] = v.x; m[WAY] = v.y; m[WAZ] = v.z; m[WAW] = 1;
	},
	set quant(q) {
		const m = this.m;
    	const x = q.x * 2, y = q.y * 2, z = q.z * 2;
		const xx = q.x * x;
		const yy = q.y * y;
		const zz = q.z * z;
		const xy = q.x * y;
		const xz = q.x * z;
		const yz = q.y * z;
		const wx = q.w * x;
		const wy = q.w * y;
		const wz = q.w * z;
		m[XAX] = 1 - (yy + zz),
		m[XAY] = xy - wz,
		m[XAZ] = xz + wy,
		m[YAX] = xy + wz,
		m[YAY] = 1 - (xx + zz),
		m[YAZ] = yz - wx,
		m[ZAX] = xz - wy,
		m[ZAY] = yz + wx,
		m[ZAZ] = 1 - (xx + yy),
		m[WAW] = 1;	
		m[XAW] = m[YAW] = m[ZAW] = m[WAX] = m[WAY] = m[WAZ] = 0;
	},
	xAxis(x, y, z, w = 0) {
		const m = this.m;
		m[XAX] = x; m[XAY] = y; m[XAZ] = z; m[XAW] = w;
		return this;
	},	
	yAxis(x, y, z, w = 0) {
		const m = this.m;
		m[YAX] = x; m[YAY] = y; m[YAZ] = z; m[YAW] = w;
		return this;
	},
	zAxis(x, y, z, w = 0) {
		const m = this.m;
		m[ZAX] = x; m[ZAY] = y; m[ZAZ] = z; m[ZAW] = w;
		return this;
	},		
	wAxis(x, y, z, w = 1) {
		const m = this.m;
		m[WAX] = x; m[WAY] = y; m[WAZ] = z; m[WAW] = w;
		return this;
	},	
	scale(x, y = x, z = y) {
		const m = this.m;
	    m[XAX] *= x;
	    m[XAY] *= x;
	    m[XAZ] *= x;
	    m[YAX] *= y;
	    m[YAY] *= y;
	    m[YAZ] *= y;
	    m[ZAX] *= z;
	    m[ZAY] *= z;
	    m[ZAZ] *= z;
	    return this;
	},
	multiply3(B, res = this) {
		const m = this.m, b = B.m, r = res.m;		
		const x0 = m[XAX], x1 = m[XAY], x2 = m[XAZ],
			  y0 = m[YAX], y1 = m[YAY], y2 = m[YAZ],
			  z0 = m[ZAX], z1 = m[ZAY], z2 = m[ZAZ];
		const xb0 = b[XAX], xb1 = b[XAY], xb2 = b[XAZ],
			  yb0 = b[YAX], yb1 = b[YAY], yb2 = b[YAZ],
			  zb0 = b[ZAX], zb1 = b[ZAY], zb2 = b[ZAZ];
			  
		r[XAX] = x0 * xb0 + y0 * xb1 + z0 * xb2;
		r[XAY] = x1 * xb0 + y1 * xb1 + z1 * xb2;
		r[XAZ] = x2 * xb0 + y2 * xb1 + z2 * xb2;
		r[YAX] = x0 * yb0 + y0 * yb1 + z0 * yb2;
		r[YAY] = x1 * yb0 + y1 * yb1 + z1 * yb2;
		r[YAZ] = x2 * yb0 + y2 * yb1 + z2 * yb2;
		r[ZAX] = x0 * zb0 + y0 * zb1 + z0 * zb2;
		r[ZAY] = x1 * zb0 + y1 * zb1 + z1 * zb2;
		r[ZAZ] = x2 * zb0 + y2 * zb1 + z2 * zb2;
		return res;
	},	
	multiply(B, res = this) {
		const m = this.m, b = B.m, r = res.m;		
		const x0 = m[XAX], x1 = m[XAY], x2 = m[XAZ], x3 = m[XAW],
			  y0 = m[YAX], y1 = m[YAY], y2 = m[YAZ], y3 = m[YAW],
			  z0 = m[ZAX], z1 = m[ZAY], z2 = m[ZAZ], z3 = m[ZAW],
			  w0 = m[WAX], w1 = m[WAY], w2 = m[WAZ], w3 = m[WAW];

		const xb0 = b[XAX], xb1 = b[XAY], xb2 = b[XAZ], xb3 = b[XAW],
			  yb0 = b[YAX], yb1 = b[YAY], yb2 = b[YAZ], yb3 = b[YAW],
			  zb0 = b[ZAX], zb1 = b[ZAY], zb2 = b[ZAZ], zb3 = b[ZAW],
			  wb0 = b[WAX], wb1 = b[WAY], wb2 = b[WAZ], wb3 = b[WAW];
			  
		r[XAX] = x0 * xb0 + y0 * xb1 + z0 * xb2 + w0 * xb3;
		r[XAY] = x1 * xb0 + y1 * xb1 + z1 * xb2 + w1 * xb3;
		r[XAZ] = x2 * xb0 + y2 * xb1 + z2 * xb2 + w2 * xb3;
		r[XAW] = x3 * xb0 + y3 * xb1 + z3 * xb2 + w3 * xb3;
		r[YAX] = x0 * yb0 + y0 * yb1 + z0 * yb2 + w0 * yb3;
		r[YAY] = x1 * yb0 + y1 * yb1 + z1 * yb2 + w1 * yb3;
		r[YAZ] = x2 * yb0 + y2 * yb1 + z2 * yb2 + w2 * yb3;
		r[YAW] = x3 * yb0 + y3 * yb1 + z3 * yb2 + w3 * yb3;
		r[ZAX] = x0 * zb0 + y0 * zb1 + z0 * zb2 + w0 * zb3;
		r[ZAY] = x1 * zb0 + y1 * zb1 + z1 * zb2 + w1 * zb3;
		r[ZAZ] = x2 * zb0 + y2 * zb1 + z2 * zb2 + w2 * zb3;
		r[ZAW] = x3 * zb0 + y3 * zb1 + z3 * zb2 + w3 * zb3;
		r[WAX] = x0 * wb0 + y0 * wb1 + z0 * wb2 + w0 * wb3;
		r[WAY] = x1 * wb0 + y1 * wb1 + z1 * wb2 + w1 * wb3;
		r[WAZ] = x2 * wb0 + y2 * wb1 + z2 * wb2 + w2 * wb3;
		r[WAW] = x3 * wb0 + y3 * wb1 + z3 * wb2 + w3 * wb3;
		return res;
	},
	invert3By3(res = this) {
		const m = this.m, r = res.m;
		const x0 = m[XAX], x1 = m[XAY], x2 = m[XAZ],
			  y0 = m[YAX], y1 = m[YAY], y2 = m[YAZ],
			  z0 = m[ZAX], z1 = m[ZAY], z2 = m[ZAZ];

		const a = z2 * y1 - y2 * z1;
		const b = x2 * z1 - z2 * x1;
		const c = y2 * x1 - x2 * y1;
		const det = a * x0 + b * y0 + c * z0;				
		const y0z1 = y0 * z1;  
		const y1z0 = y1 * z0;
		const x0y1 = x0 * y1;
		const x1y0 = x1 * y0;
		const x0z1 = x0 * z1;  
		const x1z0 = x1 * z0;
		r[XAX] = a / det;
		r[XAY] = b / det;
		r[XAZ] = c / det;
		r[XAW] = 0;			
		r[YAX] = (y2 * z0 - z2 * y0) / det;
		r[YAY] = (z2 * x0 - x2 * z0) / det;
		r[YAZ] = (x2 * y0 - y2 * x0) / det;
		r[YAW] = 0;
		r[ZAX] = (y0z1 - y1z0) / det;
		r[ZAY] = (x1z0 - x0z1) / det;
		r[ZAZ] = (x0y1 - x1y0) / det;
		r[ZAW] = 0;			
		r[WAX] = 0;
		r[WAY] = 0;
		r[WAZ] = 0;
		r[WAW] = ((x0y1 * z2 + y0z1 * x2 + x1z0 * y2) - (x0z1 * y2 + x1y0 * z2 + y1z0 * x2)) / det;		
		return res;
	},
	invert3By4(res = this) {
		const m = this.m, r = res.m;
		const x0 = m[XAX], x1 = m[XAY], x2 = m[XAZ],
			  y0 = m[YAX], y1 = m[YAY], y2 = m[YAZ],
			  z0 = m[ZAX], z1 = m[ZAY], z2 = m[ZAZ],
			  w0 = m[WAX], w1 = m[WAY], w2 = m[WAZ];

		const a = z2 * y1 - y2 * z1;
		const b = x2 * z1 - z2 * x1;
		const c = y2 * x1 - x2 * y1;
		const det = a * x0 + b * y0 + c * z0;				
		const y0z1 = y0 * z1;  
		const y1z0 = y1 * z0;
		const y0w1 = y0 * w1;
		const y1w0 = y1 * w0;
		const x0y1 = x0 * y1;
		const x1y0 = x1 * y0;
		const x0z1 = x0 * z1;  
		const x1z0 = x1 * z0;
		const z0w1 = z0 * w1;  
		const z1w0 = z1 * w0;
		const x1w0 = x1 * w0;
		const x0w1 = x0 * w1;
		r[XAX] = a / det;
		r[XAY] = b / det;
		r[XAZ] = c / det;
		r[XAW] = 0;			
		r[YAX] = (y2 * z0 - z2 * y0) / det;
		r[YAY] = (z2 * x0 - x2 * z0) / det;
		r[YAZ] = (x2 * y0 - y2 * x0) / det;
		r[YAW] = 0;
		r[ZAX] = (y0z1 - y1z0) / det;
		r[ZAY] = (x1z0 - x0z1) / det;
		r[ZAZ] = (x0y1 - x1y0) / det;
		r[ZAW] = 0;			
		r[WAX] = ((y0w1 * z2 + y1z0 * w2 + z1w0 * y2) - (y0z1 * w2 + z0w1 * y2 + y1w0 * z2)) / det;
		r[WAY] = ((x0z1 * w2 + z0w1 * x2 + x1w0 * z2) - (x0w1 * z2 + x1z0 * w2 + z1w0 * x2)) / det;
		r[WAZ] = ((x0w1 * y2 + x1y0 * w2 + y1w0 * x2) - (x0y1 * w2 + y0w1 * x2 + x1w0 * y2)) / det;
		r[WAW] = ((x0y1 * z2 + y0z1 * x2 + x1z0 * y2) - (x0z1 * y2 + x1y0 * z2 + y1z0 * x2)) / det;		
		return res;
	},	
	determinant() {
	    const m = this.m;
        return 	m[XAW] * m[YAZ] * m[ZAY] * m[WAX] - m[XAZ] * m[YAW] * m[ZAY] * m[WAX] -
				m[XAW] * m[YAY] * m[ZAZ] * m[WAX] + m[XAY] * m[YAW] * m[ZAZ] * m[WAX] +
				m[XAZ] * m[YAY] * m[ZAW] * m[WAX] - m[XAY] * m[YAZ] * m[ZAW] * m[WAX] -
				m[XAW] * m[YAZ] * m[ZAX] * m[WAY] + m[XAZ] * m[YAW] * m[ZAX] * m[WAY] +
				m[XAW] * m[YAX] * m[ZAZ] * m[WAY] - m[XAX] * m[YAW] * m[ZAZ] * m[WAY] -
				m[XAZ] * m[YAX] * m[ZAW] * m[WAY] + m[XAX] * m[YAZ] * m[ZAW] * m[WAY] +
				m[XAW] * m[YAY] * m[ZAX] * m[WAZ] - m[XAY] * m[YAW] * m[ZAX] * m[WAZ] -
				m[XAW] * m[YAX] * m[ZAY] * m[WAZ] + m[XAX] * m[YAW] * m[ZAY] * m[WAZ] +
				m[XAY] * m[YAX] * m[ZAW] * m[WAZ] - m[XAX] * m[YAY] * m[ZAW] * m[WAZ] -
				m[XAZ] * m[YAY] * m[ZAX] * m[WAW] + m[XAY] * m[YAZ] * m[ZAX] * m[WAW] +
				m[XAZ] * m[YAX] * m[ZAY] * m[WAW] - m[XAX] * m[YAZ] * m[ZAY] * m[WAW] -
				m[XAY] * m[YAX] * m[ZAZ] * m[WAW] + m[XAX] * m[YAY] * m[ZAZ] * m[WAW];    
	},
	invert(res = this) {
		const m = this.m, r = res.m;
		const x0 = m[XAX], x1 = m[XAY], x2 = m[XAZ], x3 = m[XAW],
			  y0 = m[YAX], y1 = m[YAY], y2 = m[YAZ], y3 = m[YAW],
			  z0 = m[ZAX], z1 = m[ZAY], z2 = m[ZAZ], z3 = m[ZAW],
			  w0 = m[WAX], w1 = m[WAY], w2 = m[WAZ], w3 = m[WAW];
		const z2w3 = z2 * w3;
		const z3w2 = z3 * w2;
		const y2z3 = y2 * z3;
		const y2w3 = y2 * w3;
		const y3z2 = y3 * z2;
		const y3w2 = y3 * w2;
		const x2y3 = x2 * y3;
		const x3y2 = x3 * y2;
		const x2z3 = x2 * z3;
		const x3z2 = x3 * z2;
		const x2w3 = x2 * w3;
		const x3w2 = x3 * w2;
		const a = (z2w3 * y1 + y3w2 * z1 + y2z3 * w1) - (z3w2 * y1 + y2w3 * z1 + y3z2 * w1);
		const b = (z3w2 * x1 + x2w3 * z1 + x3z2 * w1) - (z2w3 * x1 + x3w2 * z1 + x2z3 * w1);
		const c = (y2w3 * x1 + x3w2 * y1 + x2y3 * w1) - (y3w2 * x1 + x2w3 * y1 + x3y2 * w1);
		const d = (y3z2 * x1 + x2z3 * y1 + x3y2 * z1) - (y2z3 * x1 + x3z2 * y1 + x2y3 * z1);
		const det = a * x0 + b * y0 + c * z0 + d * w0;

		const y0z1 = y0 * z1;  
		const y1z0 = y1 * z0;
		const y0w1 = y0 * w1;
		const y1w0 = y1 * w0;
		const x0y1 = x0 * y1;
		const x1y0 = x1 * y0;
		const x0z1 = x0 * z1;  
		const x1z0 = x1 * z0;
		const z0w1 = z0 * w1;  
		const z1w0 = z1 * w0;
		const x1w0 = x1 * w0;
		const x0w1 = x0 * w1;
		r[XAX] = a / det;
		r[XAY] = b / det;
		r[XAZ] = c / det;
		r[XAW] = d / det;			
		r[YAX] = ((z3w2 * y0 + y2w3 * z0 + y3z2 * w0) - (z2w3 * y0 + y3w2 * z0 + y2z3 * w0)) / det;
		r[YAY] = ((z2w3 * x0 + x3w2 * z0 + x2z3 * w0) - (z3w2 * x0 + x2w3 * z0 + x3z2 * w0)) / det;
		r[YAZ] = ((y3w2 * x0 + x2w3 * y0 + x3y2 * w0) - (y2w3 * x0 + x3w2 * y0 + x2y3 * w0)) / det;
		r[YAW] = ((y2z3 * x0 + x3z2 * y0 + x2y3 * z0) - (y3z2 * x0 + x2z3 * y0 + x3y2 * z0)) / det;			
		r[ZAX] = ((z0w1 * y3 + y1w0 * z3 + y0z1 * w3) - (z1w0 * y3 + y0w1 * z3 + y1z0 * w3)) / det;
		r[ZAY] = ((z1w0 * x3 + x0w1 * z3 + x1z0 * w3) - (z0w1 * x3 + x1w0 * z3 + x0z1 * w3)) / det;
		r[ZAZ] = ((y0w1 * x3 + x1w0 * y3 + x0y1 * w3) - (y1w0 * x3 + x0w1 * y3 + x1y0 * w3)) / det;
		r[ZAW] = ((y1z0 * x3 + x0z1 * y3 + x1y0 * z3) - (y0z1 * x3 + x1z0 * y3 + x0y1 * z3)) / det;			
		r[WAX] = ((y0w1 * z2 + y1z0 * w2 + z1w0 * y2) - (y0z1 * w2 + z0w1 * y2 + y1w0 * z2)) / det;
		r[WAY] = ((x0z1 * w2 + z0w1 * x2 + x1w0 * z2) - (x0w1 * z2 + x1z0 * w2 + z1w0 * x2)) / det;
		r[WAZ] = ((x0w1 * y2 + x1y0 * w2 + y1w0 * x2) - (x0y1 * w2 + y0w1 * x2 + x1w0 * y2)) / det;
		r[WAW] = ((x0y1 * z2 + y0z1 * x2 + x1z0 * y2) - (x0z1 * y2 + x1y0 * z2 + y1z0 * x2)) / det;
		return res;
	}
}	
const workMat = new Mat4();	