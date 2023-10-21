import {} from "./utils/MathExtensions.js";

const vec3Ident = {x: 1, y: 0, z: 0};
const V3 = (x=0,y=0,z=0) => ({x,y,z});

function Vec3(x = 1, y = 0, z = 0) {
	this.x = x;
	this.y = y;
	this.z = z;	
}
Vec3.prototype = {
	toString() {  return `{x: ${this.x.toFixed(2)}, y: ${this.y.toFixed(2)}, z: ${this.z.toFixed(2)}}` },
	init(x, y, z) { this.x = x; this.y = y; this.z = z; return this },
	zero() { this.z = this.y = this.x = 0; return this },
    copyOf(vec3 = vec3Ident) { this.x = vec3.x; this.y = vec3.y; this.z = vec3.z; return this },
	clone() { return new Vec3(this.x, this.y, this.z) },
	fromArray(arr, idx) {
		this.x = arr[idx];
		this.y = arr[idx+1];
		this.z = arr[idx+2];
		return this;
	},
    setArray(arr, idx) {
		arr[idx] = this.x;
		arr[idx+1] = this.y;
		arr[idx+2] = this.z;
		return this;
	},
	scale(scale, res = this) {
	    res.x = this.x * scale;  
	    res.y = this.y * scale;  
	    res.z = this.z * scale;  
	    return res;
	},
	multiply(v, res = this) {
		res.x = this.x * v.x;
		res.y = this.y * v.y;
		res.z = this.z * v.z;
		return res;
	},
	scaleFrom(v, scale, res = this) {
		res.x = (this.x - v.x) * scale + v.x;
		res.y = (this.y - v.y) * scale + v.y;
		res.z = (this.z - v.z) * scale + v.z;
		return res;
	},
	normalFrom(v, res = this) {
		res.x = this.x - v.x;
		res.y = this.y - v.y;
		res.z = this.z - v.z;
		return res.normalize();
	},		
	add(v, res = this) {
	    res.x = this.x + v.x;
	    res.y = this.y + v.y;
	    res.z = this.z + v.z;
	    return res;
	},
	sub(v, res = this) {
	    res.x = this.x - v.x;
	    res.y = this.y - v.y;
	    res.z = this.z - v.z;
	    return res;
	},	
	addScaled(scale, v, res = this) {
	    res.x = this.x + v.x * scale;
	    res.y = this.y + v.y * scale;
	    res.z = this.z + v.z * scale;
	    return res;
	},
	subScaled(scale, v, res = this) {  // DONT USE only here as legacy
		console.warn("Dont use legacy Vec3.subScaled Use Vec3.addScaled")
	    res.x = this.x - v.x * scale;
	    res.y = this.y - v.y * scale;
	    res.z = this.z - v.z * scale;
	    return res;
	},	
	get asArray() { return [this.x, this.y, this.z] },
	toAxisX() { this.x = this.length; this.y = this.z = 0; return this },
	toAxisY() { this.y = this.length; this.x = this.z = 0; return this },
	toAxisZ() { this.z = this.length; this.x = this.y = 0; return this },
	toUintAxisX() { this.x = 1; this.y = this.z = 0; return this },
	toUintAxisY() { this.y = 1; this.x = this.z = 0; return this },
	toUintAxisZ() { this.z = 1; this.x = this.y = 0; return this },
	distanceFrom(v) {
		const x = this.x - v.x;
		const y = this.y - v.y;
		const z = this.z - v.z;
		return (x * x + y * y + z * z) ** 0.5;
	},
	rotate90XZ(res = this) {
		const x = -this.z;
		const z = this.x;
		res.x = x;
		res.z = z;
		return res;
	},
	rotate270XZ(res = this) {
		const x = this.z;
		const z = -this.x;
		res.x = x;
		res.z = z;
		return res;
	},
	set yawPitchScale(v) {
		const px = Math.cos(v.y) * v.z;
		this.x = Math.cos(v.x) * px;
		this.y = Math.sin(v.y) * v.z;
		this.z = Math.sin(v.x) * px;
	},		
	set yawPitchScaleUp(v) {
		const yx = Math.cos(v.x);
		const yz = Math.sin(v.x);
		const pz = -Math.sin(v.y) * v.z;

		this.x = pz * yx;
		this.y = (yz * yz + yx * yx) * Math.cos(v.y) * v.z;
		this.z = pz * yz;	
	},
	normalize(res = this) {
		const len = this.length;
		if (len !== 0) {
			res.x = this.x / len;
			res.y = this.y / len;
			res.z = this.z / len;
		}
		return res;
	},
	get lengthSqr() { return this.x * this.x + this.y * this.y + this.z * this.z },
	get length() { return (this.x * this.x + this.y * this.y + this.z * this.z) ** 0.5 },
	set length(len) {
		const scale = (len * len) / this.lengthSqr;
		this.x *= scale;
		this.y *= scale;
		this.z *= scale;
	},
	project(a,b,c, res = this) { // moves this to res to the plane described by poly a,b,c
		const x1 = a.x - b.x;
		const y1 = a.y - b.y;
		const z1 = a.z - b.z;
		const x2 = c.x - b.x;
		const y2 = c.y - b.y;
		const z2 = c.z - b.z;
		const x = this.x - b.x;
		const y = this.y - b.y;
		const z = this.z - b.z;
		const u1 = (x1 * x + y1 * y + z1 * z) / (x1 * x1 + y1 * y1 + z1 * z1);
		const u2 = (x2 * x + y2 * y + z2 * z) / (x2 * x2 + y2 * y2 + z2 * z2);
		res.x = b.x + x1 * u1 + x2 * u2;
		res.y = b.y + y1 * u1 + y2 * u2;
		res.z = b.z + z1 * u1 + z2 * u2;
		return res;
	},
	projectUnit(a,b,c, res = this) { // moves this to res to the plane described by poly a,b,c with res holding unit distance along ba, and bc
		const x1 = a.x - b.x;
		const y1 = a.y - b.y;
		const z1 = a.z - b.z;
		const x2 = c.x - b.x;
		const y2 = c.y - b.y;
		const z2 = c.z - b.z;
		const x = this.x - b.x;
		const y = this.y - b.y;
		const z = this.z - b.z;
		res.x = (x1 * x + y1 * y + z1 * z) / (x1 * x1 + y1 * y1 + z1 * z1);
		res.y = (x2 * x + y2 * y + z2 * z) / (x2 * x2 + y2 * y2 + z2 * z2);
		res.z = 0;
		return res;
	},	
	rayPolyIntercept(ray, p1, p2, p3, res = new Vec3()) { // this is origin, ray has length
		p1.sub(p2, v4);
		p3.sub(p2, v5);
		const a = v4.dot(ray.cross(v5, v1));
		//if (a > -Math.EPSILON && a < Math.EPSILON) { return }   
		if (!a) { return }   
		const f = 1 / a;
		const u = f * this.sub(p2, v2).dot(v1);
		if (u < 0 || u > 1) { return  }
		const v = f * ray.dot(v2.cross(v4, v3));
		if (v < 0 || u + v > 1) { return }
		const t = f * v5.dot(v3);
		if (t >= 0  && t <= 1) { return this.addScaled(t, ray, res) }
	},	
	rayPoly4Intercept(ray, p1, p2, p3, res = new Vec3()) { // this is origin. Ray has length. Poly 4 is 4 points as  p1, p2, p3, p3 + (p1 - p2)
		p1.sub(p2, v4);
		p3.sub(p2, v5);
		const a = v4.dot(ray.cross(v5, v1));
		//if (a > -Math.EPSILON && a < Math.EPSILON) { return }   
		if (!a) { return }   
		const f = 1.0 / a;
		const u = f * this.sub(p2, v2).dot(v1);
		if (u < 0 || u > 1) { return  }
		const v = f * ray.dot(v2.cross(v4, v3));
		if (v < 0 || v > 1) { return }
		const t = f * v5.dot(v3);
		if (t >= 0 && t <= 1) { return this.addScaled(t, ray, res) }
	},
	rayPlaneIntercept(ray, p1, p2, p3, res = new Vec3()) { // this is origin. Ray is infine back and forward Plane is infinite 
		const a = p1.sub(p2, v4).dot(ray.cross(p3.sub(p2, v5), v1));
		if (a > -Math.EPSILON && a < Math.EPSILON) { return }   
		return this.addScaled(1 / a * v5.dot(this.sub(p2, v2).cross(v4, v3)), ray, res);
	},		
	cross(B, res = this) {
		const x = this.y * B.z - this.z * B.y;
		const y = this.z * B.x - this.x * B.z;
		const z = this.x * B.y - this.y * B.x;
		res.x = x;
		res.y = y;
		res.z = z;
		return res;
	},
	crossXZ(B) { return this.x * B.z - this.z * B.x },
	crossXY(B) { return this.x * B.y - this.y * B.x },
	crossYZ(B) { return this.y * B.z - this.z * B.y },
	dot(B) { return this.x * B.x + this.y * B.y + this.z * B.z },
}
const v1 = new Vec3(), v2 = new Vec3(), v3 = new Vec3(), v4 = new Vec3(), v5 = new Vec3(), v6 = new Vec3(); // working vectors
export {Vec3, V3};