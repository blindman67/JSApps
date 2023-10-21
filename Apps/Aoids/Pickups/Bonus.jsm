import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";


export {Bonus};
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const LIFE = data.rocks.bonusLife;
const BONUS_SPRITES = data.spriteSheet.names.bonusGem;
const RANDOM_SPARKLE = data.spriteSheet.names.randSparks;
const BONUS_COLOR = data.rocks.bonusColor, BONUS_COLOR_ALPHA = BONUS_COLOR & 0xFFFFFF;
const BONUS_COLOR_AC = data.rocks.bonusColorAccent, BONUS_COLOR_AC_ALPHA = BONUS_COLOR_AC & 0xFFFFFF;
const RANDOM_SPARKLE_ALPHA_SEQ = [(48 << 24) | BONUS_COLOR_ALPHA, (90 << 24) | BONUS_COLOR_ALPHA, (132 << 24) | BONUS_COLOR_ALPHA, (200 << 24) | BONUS_COLOR_ALPHA, (240 << 24) | BONUS_COLOR_ALPHA, (255 << 24) | BONUS_COLOR_AC_ALPHA, (196 << 24) | BONUS_COLOR_AC_ALPHA, (64 << 24) | BONUS_COLOR_AC_ALPHA];
//const BONUS_SPRITES_LAYOUTS = BONUS_SPRITES.map(idx => data.spriteSheet.sprites[idx]);
const TARGET_MAX = (data.playfield.width ** 2 + data.playfield.height ** 2) ** 0.5 * data.playfield.spawnScale;
var target, targetSize, targetPickupDist, targetPickupDrag;




function Bonus() {
	this.playDist = 0;
	this.x = this.y = this.r = this.dx = this.dy = this.dr = 0;

	this.targetDist = 0;
	this.alive = true;
	this.life = LIFE;
	this.highlight = true;
	this.highlightA = 0;
	this.timeOffset = 0;
}
Bonus.DUD = {init() { return false }};
Bonus.setTarget = function(t) {
	target = t
	targetSize = data.spriteSheet.sprites[t.sprIdx].diag;
	targetPickupDist = targetSize / 2;
	targetPickupDrag = targetSize * 4;
}
Bonus.prototype = {
	init(x, y, dx, dy) {
		this.x = x;
		this.y = y;
		this.r = Math.random() * Math.PI * 2;
		this.dr = Math.random() < 0.5 ? 0.1 : -0.1;
		const speed = Math.random() * 4 + 1;
		this.timeOffset = Math.random() * 400;
		this.dx = dx + Math.cos(this.r) * speed;
		this.dy = dy + Math.sin(this.r) * speed;
		this.alive = 1;
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
		const g = target.pickupPower / (dist ** 2);
		this.dx -= (dx / dist) * g;
		this.dy -= (dy / dist) * g;
		if (this.highlightA === 0 && Math.random() < 1 / 70) { this.highlightA = RANDOM_SPARKLE_ALPHA_SEQ.length }
		if (this.highlightA) { this.highlightA-- }

		if (dist < targetPickupDrag) {
			const drag = 0.9 + dist / targetPickupDrag * 0.1;
			this.dx *= drag;
			this.dy *= drag;
			if (dist < targetPickupDist) { return this.pickedUp() }
		}
		return true;
	},
    pickedUp() {
        target.bonusPickup(this);
        this.alive = 0;
        return false;
    },
    /*updateToMenu() {
        if(this.life >= 1) {
            target.bonusPickup(this);
            this.alive = 0;
            return false;
        }
        this.life += 0.01;
        const u = this.life ** 0.5;
        this.scale = u * 0.2 + 0.1;
        var dx = target.statusPos.x - this.dx;
        var dy = target.statusPos.y - this.dy;
		this.x = this.dx + dx * u;
		this.y = this.dy + dy * u;
		this.r += this.dr;
        return true;

    },*/
	updateSprite(buf, bF, bI, stride, i, time) {
        const sc = this.alive === 1 ? 1.5 : buf.scale * this.scale;
		const p = this;
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 2] = sc;
		bF[i + 3] = sc;
		bF[i + 4] = bF[i + 5] = 0.5;
		bF[i + 6] = p.r;
		bI[i + 8] = BONUS_COLOR;
		bI[i + 9] = BONUS_SPRITES[1] | BIT_DEFAULT_Z_INDEX;
		buf.length ++;
		i += stride;
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 2] = sc;
		bF[i + 3] = sc;
        bF[i + 4] = bF[i + 5] = 0.5;
		bF[i + 6] = -p.r * 2;
		bI[i + 8] = BONUS_COLOR_AC && 0x7FFFFFFF;
		bI[i + 9] = BONUS_SPRITES[1] | BIT_DEFAULT_Z_INDEX;
		buf.length ++;
		i += stride;
		return i;
	},
	updateSpriteHighlight(buf, bF, bI, stride, i, time) {
		const p = this;
        const sc = this.alive === 1 ? 1 : buf.scale * this.scale;
		time += this.timeOffset;
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 2] = 1.5 * sc;
		bF[i + 3] = 1.5 * sc;
		bF[i + 4] = 0.5;
		bF[i + 5] = 0.5;
		bF[i + 6] = p.r;
		bI[i + 8] = BONUS_COLOR && 0x3FFFFFFF;
		bI[i + 9] = BONUS_SPRITES[0] | BIT_DEFAULT_Z_INDEX;
		i += stride;
		buf.length ++;
		const t = time;
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 2] = ((t / 2) % 2 ? 1.5 : -1.5) * sc;
		bF[i + 3] = (t % 2 ? 1.5 : -1.5) * sc;
		bF[i + 4] = 0.5;
		bF[i + 5] = 0.5;
		bF[i + 6] = -p.r;
		bI[i + 8] = BONUS_COLOR_AC;
		bI[i + 9] = BONUS_SPRITES[1] | BIT_DEFAULT_Z_INDEX;
		i += stride;
		buf.length ++;
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 2] = (Math.sin(time * 2) * 0.65)  * sc;
		bF[i + 3] =  0.65 * sc;
		bF[i + 4] = 0.5;
		bF[i + 5] = 0.5;
		bF[i + 6] = -p.r * 3;
		bI[i + 8] = BONUS_COLOR;
		bI[i + 9] = BONUS_SPRITES[2] | BIT_DEFAULT_Z_INDEX;
		i += stride;
		buf.length ++;
		bF[i    ] = p.x;
		bF[i + 1] = p.y;
		bF[i + 3] = Math.cos(time* 1.4) * 0.76 * sc;
		bF[i + 2] =  0.76 * sc;
		bF[i + 4] = 0.5;
		bF[i + 5] = 0.5;
		bF[i + 6] = p.r * 1.5;
		bI[i + 8] = BONUS_COLOR;
		bI[i + 9] = BONUS_SPRITES[2] | BIT_DEFAULT_Z_INDEX;
		i += stride;
		buf.length ++;
		if(p.highlightA) {
			bF[i    ] = p.x - 30;
			bF[i + 1] = p.y - 30;
			bF[i + 2] = 8 * sc;
			bF[i + 3] = 8 * sc;
			bF[i + 4] = 0.5;
			bF[i + 5] = 0.5;
			bF[i + 6] = time;  // rotation
			bI[i + 8] = RANDOM_SPARKLE_ALPHA_SEQ[p.highlightA];
			bI[i + 9] = RANDOM_SPARKLE[0] | BIT_DEFAULT_Z_INDEX;
			i += stride;
			buf.length ++;
			bF[i    ] = p.x - 30;
			bF[i + 1] = p.y - 30;
			bF[i + 2] = 6 * sc;
			bF[i + 3] = 6 * sc;
			bF[i + 4] = 0.5;
			bF[i + 5] = 0.5;
			bF[i + 6] = time / 2;  // rotation
			bI[i + 8] = RANDOM_SPARKLE_ALPHA_SEQ[p.highlightA];
			bI[i + 9] = RANDOM_SPARKLE[0]| BIT_DEFAULT_Z_INDEX;
			i += stride;
			buf.length ++;
		}
		return i;
	}
}