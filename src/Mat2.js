import {} from "./utils/MathExtensions.js";
import {Vec2} from "./Vec2.js";
export {Mat2};


// Working vectors (rather than create new ones each time) to reduce GC and allocation/heap overheads
const wp1 = new Vec2();
const wAxisX = new Vec2(1,0);
const wAxisY = new Vec2(0,1);

const IDENT = [1,0, 0,1];
const XAX = 0, XAY = 1, YAX = 2, YAY = 3;

function Mat2() {
	this.m = [...IDENT];
}
Mat2.prototype = {
	ident() {
		this.m[0] = 1;
		this.m[1] = 0;
		this.m[2] = 0;
		this.m[3] = 1;
		return this;
	},
	init(a,b,c,d) {
		this.m[0] = a;
		this.m[1] = b;
		this.m[2] = c;
		this.m[3] = d;
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
	copyFrom(B) {
		if(this !== B) {
			const m = this.m, b = B.m;
			m[0] = b[0];
			m[1] = b[1];
			m[2] = b[2];
			m[3] = b[3];
		}
		return this;
	},
	lookAt(pos) {
		const m = this.m;
		const x = pos.x;
		const y = pos.y;
		const len = (x * x + y * y) ** 0.5;
		if(len > 0) {
			m[YAY] = m[XAX] = x / len;
			m[YAX] = -(m[XAY] = y / len);
		} else {
			m[XAX] = m[YAY] = 1;
			m[XAY] = m[YAX] = 0;
		}
		return this;
	},
	transformPoint(p, res = p) {
		const x = p.x;
		const y = p.y;
		res.x = x * m[XAX] + y * m[YAX];
		res.y = x * m[XAY] + y * m[YAY];
		return res;
	},
	multiply(B, res = this) {
		const m = this.m, b = B.m, r = res.m;
		const x0 = m[XAX], x1 = m[XAY], y0 = m[YAX], y1 = m[YAY];;
		const xb0 = b[XAX], xb1 = b[XAY], yb0 = b[YAX], yb1 = b[YAY];;
		
		r[XAX] = x0 * xb0 + y0 * xb1;
		r[XAY] = x1 * xb0 + y1 * xb1;
		r[YAX] = x0 * yb0 + y0 * yb1;
		r[YAY] = x1 * yb0 + y1 * yb1;
		return res;
	},
	scale(x,y,res = this) {
		const m = this.m, r = res.m;
		r[XAX] = m[XAX] * x;
		r[XAY] = m[XAY] * x;
		r[YAX] = m[YAX] * y;
		r[YAY] = m[YAY] * y;
		return res;
	},
	determinant() { return this.m[0]  * this.m[3]  - this.m[1]  * this.m[2] },
	invert(res = this) {
		const m = this.m, im = res.m;
		const x0 = m[XAX], x1 = m[XAY], y0 = m[YAX], y1 = m[YAY];
		const det =  x0  * y1  - x1  * y0;
		im[0] =  y1 / det;
		im[1] = -x1 / det;
		im[2] = -y0 / det;
		im[3] =  x0 / det;
		return res;
	},
	rotate(ang, res = this) {
		const m = this.m, r = res.m;
		const xax = Math.cos(ang);
		const yax = Math.sin(ang);
		const x0 = m[XAX], x1 = m[XAY], y0 = m[YAX], y1 = m[YAY];
		r[XAX] = x0 * xax - x1 * xay;
		r[XAY] = x0 * xay + x1 * xax;
		r[YAX] = y0 * xax - y1 * xay;
		r[YAY] = y0 * xay + y1 * xax;
		return res;
	},
};





