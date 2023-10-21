import {Vec3} from "./Vec3.js";
export {Plane, PlanePath};

function Plane(origin = new Vec3(0,0,0), xAxis = new Vec3(1,0,0), zAxis = new Vec3(0,0,1)) {
	this.normal = new Vec3();
	this.yAxis = new Vec3();
	this.init(origin, xAxis, zAxis);
}
Plane.prototype = {
	init(origin, xAxis, zAxis) {	
		this.origin = origin;
		this.xAxis = xAxis;
		this.zAxis = zAxis;
		this.zAxis.cross(this.xAxis, this.normal).normalize();
		this.xAxis.cross(this.normal, this.yAxis);
	},
	asArray() { return [this.origin, this.xAxis, this.zAxis] },
	fromVerts(v1, v2, v3) {
		this.origin.copyOf(v1);
		this.xAxis.copyOf(v2).sub(v1);
		this.zAxis.copyOf(v3).sub(v1);
	},
};

function PlanePath(plane, path2D) {
	this.path = [];
	this.isClosed = path2D.length >  4;
	this.init(plane, path2D)
}
PlanePath.prototype = {
	init(plane, path2D = []) {
		this.plane = plane;
		this.path.length = 0;
		var i = 0;
		while (i < path2D.length) {
			const x = path2D[i++];
			const y = path2D[i++];
			this.path.push(new Vec3(
				this.plane.xAxis.x * x + this.plane.yAxis.x * y + this.plane.origin.x,
				this.plane.xAxis.y * x + this.plane.yAxis.y * y + this.plane.origin.y, 
				this.plane.xAxis.z * x + this.plane.yAxis.z * y + this.plane.origin.z
			));
		}
	},
	set path2D(path2D) { this.init(this.plane, path2D) },
	planes(below, above) {
		const p = new Plane();
		const o = new Vec3(), x = new Vec3(0), z = new Vec3();
		const len = this.path.length + (this.isClosed ? 0 : -1);
		const self = this;
		return function * () {
			var i = 0;
			while(i < len) {
				o.copyOf(self.path[i]).addScaled(-below, self.plane.normal);
				x.copyOf(self.plane.normal).scale(below + above);
				z.copyOf(self.path[(i + 1) % len]).sub(self.path[i]);
				p.init(o, x, z);
				yield p;
				i++;
			}
		}
	}
}

