import "./utils/MathExtensions.jsm";
import {Vec2} from "./Vec2.jsm";

export {Physics2D, Shapes2D};
const Shapes2D = {
	HollowCylinder: 1,
	HollowSphere: 2 / 3,
	Disk: 1 / 2,
	Rectangle: 1 / 12,
	Lever: 1 / 3,
};
function Force() {
	this.pos = new Vec2();
	this.forceV = new Vec2();
	this.dist2 = 0;
	this.dist = 0;
	this.force = 0;
}
Force.prototype = {
	init(pos, direction, force) {
		this.pos.x = pos.x;
		this.pos.y = pos.y;
		this.dist = (this.dist2 = pos.x * pos.x + pos.y * pos.y) ** 0.5;
		this.force = force;
		this.forceV.x =  Math.cos(direction) * force;
		this.forceV.y =  Math.sin(direction) * force;
	},
	update(v, invMass) {
		const x = this.forceV.x, y = this.forceV.y;
		const px = this.pos.x, py = this.pos.y;
		const uV = (x * px + y * py) / this.dist2;
		const uW = (y * px - x * py) / this.dist2;
		v.x += this.pos.x * uV * invMass;
		v.y += this.pos.y * uV * invMass;
		const u = (Math.abs(uW)  * this.dist) / this.force;
		this.force *= u;
		this.forceV.x *= u;
		this.forceV.y *= u;
	},
	wAccel(mean, mass) {
		const uW = ((this.forceV.y - mean.y) * this.pos.x - (this.forceV.x - mean.x) * this.pos.y) / this.dist2;
		return (this.force * uW) / (mass * this.dist2);
	},
}
const wV1 = new Vec2(), wV2 = new Vec2(); // working vectors
function Physics2D(posX, posY, dx, dy, mass, shape, wDrag, vDrag) {
	this.forces = [];
	this.forceCount = 0;
	this.m = mass;
	this.im = mass * shape;
	this.invMass = 1 / mass;
	this.p = new Vec2(posX, posY);
	this.shape = shape;
	this.wDrag = 1 - wDrag;
	this.vDrag = 1 - vDrag;
	this.w = 0;
	this.delta = new Vec2(dx,dy);
	this.angle = 0;
	this.speed = 0;
	this.transform = new Vec2(Math.cos(this.angle), Math.sin(this.angle));
    this.orbitFit = 0; // metrix to give feedback on how close to a circular orbit

}
Physics2D.prototype = {
	addForce(pos, direction, force) {  // relative force
		var f = this.forces[this.forceCount];
		f === undefined && this.forces.push(f = new Force());
		f.init(pos.transformRot(this.transform, wV1), direction + this.angle, force);
		this.forceCount ++;
	},
	addDelta(dx, dy) {
		this.delta.x += dx;
		this.delta.y += dy;
	},
	applyGravity(massX, massY, mass, G) {
		var nx = massX - this.p.x;
		var ny = massY - this.p.y;
		const distSqr = nx * nx + ny * ny, dist = distSqr ** 0.5;
		nx /= dist;
		ny /= dist;
		const accel = G * (mass / distSqr);
		this.delta.x += nx * accel;
		this.delta.y += ny * accel;

	},
    orbitVector(massX, massY, mass, G, res = {}) { // massX, massY line to mass center
		var nx = this.p.x - massX;
		var ny = this.p.y - massY;
		const distSqr = nx * nx + ny * ny, dist = distSqr ** 0.5;
		const velSqr = (G * mass) / dist, vel = velSqr ** 0.5;
		nx /= dist;
		ny /= dist;
        const c = nx * this.delta.y - ny * this.delta.x;
        if (c < 0) {
            res.x = ny * vel;
            res.y = -nx * vel;
        } else {
            res.x = -ny * vel;
            res.y = nx * vel;
        }

        return res;
    },
	dragToOrbit(massX, massY, mass, G, drag) {
		var nx = this.p.x - massX;
		var ny = this.p.y - massY;
		const distSqr = nx * nx + ny * ny, dist = distSqr ** 0.5;
		const velSqr = (G * mass) / dist, vel = velSqr ** 0.5;
		nx /= dist;
		ny /= dist;
        const c = nx * this.delta.y - ny * this.delta.x;
        if (c < 0) {
            this.delta.x += ((ny * vel) - this.delta.x) * drag;
            this.delta.y += ((-nx * vel) - this.delta.y) * drag;
        } else {
            this.delta.x += ((-ny * vel) - this.delta.x) * drag;
            this.delta.y += ((nx * vel) - this.delta.y) * drag;
        }

        this.orbitFit = (-ny * vel * this.delta.y - nx * vel * this.delta.x) / velSqr;
	},

	stop() {
		this.delta.zero();
		this.forceCount = 0;
		this.w = 0;
	},
	from(obj) {
		this.p.x = obj.x;
		this.p.y = obj.y;
		this.angle = obj.r;
		this.delta.x = obj.dx;
		this.delta.y = obj.dy;
		this.w = obj.dr;
	},
	apply(obj) {
		obj.x = this.p.x;
		obj.y = this.p.y;
		obj.r = this.angle;
		obj.dx = this.delta.x;
		obj.dy = this.delta.y;
		obj.dr = this.w;
	},
	resolveForces() {
		const count = this.forceCount;
		this.w *= this.wDrag;
		this.delta.x *= this.vDrag;
		this.delta.y *= this.vDrag;
		if (count) {
			let i = 0, w = 0;
			wV1.zero();
			wV2.zero();
			while (i < count) {
				const f = this.forces[i++];
				f.update(wV1, this.invMass);
				wV2.add(f.forceV);
			}
			wV2.divide(count);
			wV1.addScaled(this.invMass, wV2);
			i = 0;
			while (i < count) {
				w += this.forces[i++].wAccel(wV2, this.im);
			}
			this.w += w;
			this.delta.add(wV1);
		}
		this.forceCount = 0;
		this.speed = this.v = this.delta.length;
		this.p.add(this.delta);
		this.angle += this.w;
		this.transform.init(Math.cos(this.angle), Math.sin(this.angle));

	},

}



/*
unit approx
20px = 1meter
8 cubic px  2px by 2 px by 2 px  water is 1kg
1frame is 1/60th second
velocity is in pixels per frame
acceleration is in pixels per second per second
Shape constant is a value that scales the moment of inertia
   Hollow cylinder = 1
   Disk, rod = 1/2
   Hollow sphere = 2/3
   Rectangle, rod on side = 1/12
   Rectangle, rod rotated at end = 1/3

t is time
w is angular velocity in radians
angle is orientation of object
v is velocity
m is mass
p {x,y} is mass center
r is radius in pixels, distance from mass center
I moment of inertia
F is force
T is torque
a is acceleration in pixels
aw is angular acceleration in radians
sc is shape constant.

I = m * r * r * sc
Hollow cylinder I = m * r * r
Disk I = 0.5 * m * r * r
Hollow sphere I = (2/3) * m * r * r

a = aw * r
v = w * r
T = I * aw
F = m * v * v / r

F * r = T



v * v / r = F / m
v * v = r * (F / m)
v = sqrt(r * (F / m))


*/



