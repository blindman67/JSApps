import {Vec2} from "../../../src/Vec2.jsm";
import {arrayUtils} from "../../../src/utils/arrayUtils.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";


export {Metal};
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const GRAV = 1;
const LIFE = data.rocks.metalLife;
const METAL_SPRITES = data.spriteSheet.names.metals;
const RANDOM_SPARKLE = data.spriteSheet.names.randSparks;
const RANDOM_SPARKLE_COUNT = RANDOM_SPARKLE.length;
const RANDOM_SPARKLE_ALPHA_SEQ = [(48 << 24) | 0xFFFFFF, (90 << 24) | 0xFFFFFF, (132 << 24) | 0xFFFFFF, (200 << 24) | 0xFFFFFF, (240 << 24) | 0xFFFFFF, (255 << 24) | 0xFFFFFF, (196 << 24) | 0xFFFFFF, (64 << 24) | 0xFFFFFF];
const METAL_SPRITES_LAYOUTS = METAL_SPRITES.map(idx => data.spriteSheet.sprites[idx]);
const METAL_TYPE_POINTS = data.prizes.metalTypePoints;
const TARGET_MAX = (data.playfield.width ** 2 + data.playfield.height ** 2) ** 0.5 * data.playfield.spawnScale;
var target, targetSize, targetPickupDist, targetPickupDrag;

const types = data.rocks.metalTypes;
const typesSel = (() => {
    const a = [];
    var total = arrayUtils.reduceProps(types, (t, type) => t + type.odds, 0);
    arrayUtils.eachProp(types, type => { a.push(...arrayUtils.setOf(type.odds,()=> type.idx)) })
    return a;
})();
const typesArray = [types.gold, types.green, types.cyan, types.ruby];


function Metal() {
	this.playDist = 0;
	this.x = this.y = this.r = this.dx = this.dy = this.dr = 0;
	this.radius = 28;
	this.scale = 1;
	this.targetDist = 0;
	this.alive = true;
	this.life = LIFE;
	this.type = types.gold;
	this.highlight = 0;
	this.highlightColMask = 0;
	this.sprIdx = METAL_SPRITES[0];
}
Metal.DUD = {init() { return false }};

Metal.setTarget = function(t) {
	target = t
	targetSize = data.spriteSheet.sprites[t.sprIdx].diag;
	targetPickupDist = targetSize / 2;
	targetPickupDrag = targetSize * 4;
}
Metal.prototype = {
	init(x, y, dx, dy) {
		this.x = x;
		this.y = y;
		this.r = Math.random() * Math.PI * 2;
		this.dr = Math.random() - 0.5;
		const speed = Math.random() * 4 + 1;
		this.dx = dx + Math.cos(this.r) * speed;
		this.dy = dy + Math.sin(this.r) * speed;
		this.alive = 1;
		this.life = LIFE;
		const type = this.type = typesArray[typesSel[Math.random() * typesSel.length | 0]];
		this.sprIdx =  METAL_SPRITES[type.idx];
		this.highlightColMask =  type.colMask;
		this.radius = METAL_SPRITES_LAYOUTS[type.idx].size / 2;
		this.scale = 1 + (Math.random() - 0.5) * 0.5;
		return this.update();
	},
    kill() {
        this.alive = 0;
    },
	isNear(point, distance) {
		const dx = this.x - point.x;
		const dy = this.y - point.y;
		const dist = (dx * dx + dy * dy) ** 0.5;
		return dist <= distance;
	},
	update() {
		if (this.alive === 0) { return false }
		if (this.alive === 2) { return this.updateToMenu() }

		this.x += this.dx;
		this.y += this.dy;
		this.r += this.dr;
		const dx = this.x - target.x;
		const dy = this.y - target.y;
		const dist = this.targetDist = (dx * dx + dy * dy) ** 0.5;
		if (this.targetDist > TARGET_MAX) {
			this.alive = 0;
			return false;
		}
		if (this.targetDist  > this.playDist) {
			this.life --;
			if (this.life <= 0) {
				this.alive = 0;
				return false;
			}
		}

		this.life -= 0.5
		const g = target.pickupPower / (dist ** 2);
		this.dx -= (dx / dist) * g;
		this.dy -= (dy / dist) * g;

		if (this.highlight === 0 && Math.random() < 1 / 250) { this.highlight = RANDOM_SPARKLE_ALPHA_SEQ.length }
		if (this.highlight) { this.highlight-- }

		if (dist < targetPickupDrag) {
			if (dist < targetPickupDist) {
				return this.pickedUp();
			}
			const drag = 0.9 + dist / targetPickupDrag * 0.1;
			this.dx *= drag;
			this.dy *= drag;
		}
		return true;
	},
    pickedUp() {
        target.metalPickup(this.type.idx, 1);
        this.alive = 0;
        return false;
    },
	updateSprite(buf, bF, bI, stride, i) {
		const p = this;
		const sc = p.scale * (this.alive === 1 ? 1 : (this.radius = 10 * buf.scale, buf.scale));
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 2] = sc;
		bF[i + 3] = sc;
        bF[i + 4] = bF[i + 5] = 0.5;
		bF[i + 6] = p.r;
		bI[i + 8] = 0xFFFFFFFF;
		bI[i + 9] = p.sprIdx  | BIT_DEFAULT_Z_INDEX;
		buf.length ++;
		i += stride;
		return i;
	},
	updateSpriteHighlight(buf, bF, bI, stride, i, time) {
		const p = this;
		const sc = p.scale * (this.alive === 1 ? 1 : buf.scale);
		bF[i    ] = p.x + sc * 10;
		bF[i + 1] = p.y;
		bF[i + 2] = sc * 2.5;
		bF[i + 3] = sc * 2.5;
		bF[i + 4] = 0.5;
		bF[i + 5] = 0.5;
		bF[i + 6] = time + p.sprIdx;  // rotation
		bI[i + 8] = RANDOM_SPARKLE_ALPHA_SEQ[p.highlight] & p.highlightColMask;
		bI[i + 9] = RANDOM_SPARKLE[0]  | BIT_DEFAULT_Z_INDEX;
		i += stride;
		buf.length ++;

		return i;
	}
}