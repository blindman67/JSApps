import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";


export {Astronaut};

const LIFE = 1e9;
const SPRITES = data.spriteSheet.names.astronautParts;
const ARM = [
	{spr: 4, x: -15, y: 16},
	{spr: 5, x: -15, y: 18},
	{spr: 6, x: -15, y: 9},
	{spr: 7, x: -10, y: 3},
	{spr: 8, x: -7, y: 3},
	{spr: 7, x: -10, y: 3},
	{spr: 6, x: -15, y: 9},
	{spr: 7, x: -10, y: 3},
	{spr: 8, x: -7, y: 3},
	{spr: 7, x: -10, y: 3},
	{spr: 6, x: -15, y: 9},
	{spr: 5, x: -15, y: 18},
];
const ARM_COUNT = ARM.length;
const BODY = [
	{spr: 2, x: 0, y: 3}, // bum
	{spr: 3, x: 0, y: 11}, // chest
	{spr: 9, x: 0, y: 13}, // head
];
const LEG = [
	{spr: 0, x: -6, y: - 9},
	{spr: 1, x: -5, y: - 6},
];
const LEG_COUNT = LEG.length;
const TARGET_MAX = (data.playfield.width ** 2 + data.playfield.height ** 2) ** 0.5 * data.playfield.spawnScale;
var target, targetSize, targetPickupDist, targetPickupDrag;




function Astronaut() {
	this.playDist = 0;
	this.x = this.y = this.r = this.dx = this.dy = this.dr = 0;
	this.highlight = false;
	this.targetDist = 0;
	this.alive = true;
	this.life = LIFE;
	this.color = 0xFFFFFFFF;
	this.arm1 = 0;
	this.arm2 = 0;
	this.leg1 = 0;
	this.leg2 = 0;

	this.timeOffset = 0;
}
Astronaut.DUD = {init() { return false }};
Astronaut.setTarget = function(t) {
	target = t
	targetSize = data.spriteSheet.sprites[t.sprIdx].diag;
	targetPickupDist = targetSize / 2;
	targetPickupDrag = targetSize * 4;
}
Astronaut.prototype = {
	init(x, y) {
		this.x = x;
		this.y = y;
		this.r = Math.random() * Math.PI * 2;
		this.dr = (Math.random() - 0.5) * 0.1;
		const speed = Math.random() * 0.01;
		this.timeOffset = Math.random() * 400;
		this.dx = Math.cos(this.r) * speed;
		this.dy = Math.sin(this.r) * speed;
		this.arm1 = Math.random() * 100 | 0;
		this.arm2 = Math.random() * 100 | 0;
		this.leg1 = Math.random() * 100 | 0;
		this.leg2 = Math.random() * 100 | 0;
		return this.alive = true;

	},
    kill() {
        this.alive = false;
    },
	isNear(point, distance) {
		const dx = this.x - point.x;
		const dy = this.y - point.y;
		const dist = (dx * dx + dy * dy) ** 0.5;
		return dist <= distance;
	},
	update() {
		if (!this.alive) { return false }
		this.x += this.dx;
		this.y += this.dy;
		this.r += this.dr;
		const dx = this.x - target.x;
		const dy = this.y - target.y;
		const dist = this.targetDist = (dx * dx + dy * dy) ** 0.5;
		const g = target.pickupPower / (dist ** 2);
		this.arm1 += Math.random() < 0.02 ? 1 : Math.random() < 0.02 ? ARM_COUNT - 1 : 0;
		this.arm2 += Math.random() < 0.02 ? 1 : Math.random() < 0.02 ? ARM_COUNT - 1 : 0;
		this.leg1 += Math.random() < 0.01 ? 1 : 0;
		this.leg2 += Math.random() < 0.01 ? 1 : 0;
		//this.dx -= (dx / dist) * g;
		//this.dy -= (dy / dist) * g;
		if (dist < targetPickupDrag) {
			if (dist < targetPickupDist) {
				this.alive = false;
				return false;
			}
			const drag = 0.9 + dist / targetPickupDrag * 0.1;
			this.dx *= drag;
			this.dy *= drag;
		}
		return true;
	},
	updateSprite(buf, bF, bI, stride, i, time) {
		const a = this;
		const c = a.color
		const r = a.r;
		const dx = Math.cos(r);
		const dy = Math.sin(r);

		const addSprite = (part, mirror)=> {
			bF[i    ] = a.x + dx * part.x * mirror - dy * part.y;
			bF[i + 1] = a.y + dy * part.x * mirror + dx * part.y;
			bF[i + 2] = mirror;
			bF[i + 3] = 1;
			bF[i + 4] = bF[i + 5] = 0.5;
			bF[i + 6] = r;
			bI[i + 8] = c;
			bI[i + 9] = SPRITES[part.spr];
			i += stride;
			buf.length ++;
		}

		addSprite(LEG[a.leg1 % LEG_COUNT],  1);
		addSprite(LEG[a.leg2 % LEG_COUNT], -1);
		addSprite(BODY[0], 1);
		addSprite(BODY[1], 1);
		addSprite( ARM[a.arm1 % ARM_COUNT], 1);
		addSprite( ARM[a.arm2 % ARM_COUNT], -1);
		addSprite( BODY[2], 1);
		return i;
	},

}