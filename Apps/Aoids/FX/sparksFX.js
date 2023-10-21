import "../../../src/utils/MathExtensions.js";
import {data} from "../data.js";
import {SubFX} from "./SubFX.js";
import {FXPool} from "./FXPool.js";
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const SPRITE_LIST = data.spriteSheet.sprites;
const SPARK_SPRITE_IDXS = [
	data.spriteSheet.names.plasmaSparks,
	data.spriteSheet.names.ionSparks,
	data.spriteSheet.names.lightning,
	data.spriteSheet.names.lightningSparks,
	data.spriteSheet.names.plasmaSurfaceSparks,
	data.spriteSheet.names.gunLaz.sparks,
]

const DEFAULT_COLOR = 0xFFFFFFFF;
const DEFAULT_BUFFER_IDX = 1;


var buffers, stride, cStride;
const sparksFX = new FXPool(Sparks, _bufs => {
		buffers = _bufs;
		cStride = (stride = buffers[0].stride) * 4;
	},
	DEFAULT_BUFFER_IDX
);
export {sparksFX};

function Sparks() {
	this.time = 0;
	this.maxTime = 0;
	this.color = DEFAULT_COLOR;
	this.speed = 0.9;
	this.attachedTo = undefined;
	this.sprites = SPARK_SPRITE_IDXS[0];
	this.seq = false;
	this.items = [new SubFX(), new SubFX(), new SubFX(), new SubFX()];
	this.fx = undefined;
}
Sparks.prototype = {
	init(fx, size, ang, col = DEFAULT_COLOR, sparkSpriteSet = 0, spriteSeq, attachedTo, time = 0) {
		this.speed = 1 -( (Math.random() ** 2) * 0.3 + 0.05);
		this.seq = spriteSeq === true;
		this.sprites = SPARK_SPRITE_IDXS[sparkSpriteSet % SPARK_SPRITE_IDXS.length];
		this.attachedTo = attachedTo;
		if (attachedTo) {
			const a = attachedTo;
			const ax = fx.x - a.x;
			const ay = fx.y - a.y;
			const r = Math.atan2(ay, ax) - a.r;
			const d = (ay * ay + ax * ax) ** 0.5;
			//const m = (size / (d * Math.TAU)) * Math.TAU;
			const m = (size / 5) / d ;
			for(const s of this.items) {
				s.speed = Math.random() * 0.8 + 0.2;
				s.dir = ang +  (Math.random() - 0.5) * 0.3;
				s.r = r + (Math.random() - 0.5) * m; // attached angle
				s.x = d;							 // distance
				s.spr = Math.random() * this.sprites.length | 0;
                s.y = Math.max(0.5, Math.random() * (size / SPRITE_LIST[this.sprites[s.spr]].diag));
			}
		} else {
			for(const s of this.items) {
				s.speed = Math.random() * 0.8 + 0.2;
				s.dir = ang +  (Math.random() - 0.5) * 0.3;
				s.r = Math.random() * size;
				s.x = Math.cos(s.dir) * size;
				s.y = Math.sin(s.dir) * size;
				s.spr = Math.random() * this.sprites.length | 0;
			}
		}
		this.radius = (16 + Math.random() * 32) * size;
		this.maxTime = (Math.random() * time + size) * 16;
		this.time = 0;
		this.color = col;
		this.fx = fx;
	},
	update(fx) {
		this.time += 1;
		if ((this.attachedTo && this.attachedTo.changed === 0 && this.time <= this.maxTime) || (!this.attachedTo && this.time <= this.maxTime)) { return true }
		this.fx = undefined;
		this.attachedTo = undefined;
		return false;
	},
	updateSprite() {
		const B = buffers[this.fx.bufferIdx];
		const bF = B.data, bI = B.UI32, bI8 = B.UI8;
		var i = B.length * stride, ica = (i + 8) * 4 + 3;;
		const u = this.time / this.maxTime;
		const sp = this.speed, sp4 = sp / 4;
		const sLen = this.sprites.length;
		const sprSeqIdx = u * (sLen - 1) | 0;
		const seq = this.seq;
		var count = 0;

		if (this.attachedTo) {
			const a = this.attachedTo;
			for(const s of this.items) {
				if (s.speed > 0.1) {
					const sprIdx = this.sprites[seq ? sprSeqIdx : (s.spr | 0) % sLen] ;
					const spr = SPRITE_LIST[sprIdx];
					const ang = s.r + a.r;
					bF[i] = a.x + Math.cos(ang) * s.x;
					bF[i + 1] = a.y + Math.sin(ang) * s.x;
					bF[i + 2] = s.y * (count % 2 ? -1 : 1);
					bF[i + 3] = s.y;
					bF[i + 4] = spr.cx;
					bF[i + 5] = spr.cy;
					bF[i + 6] = s.dir;
					bI[i + 8] = this.color;
					bI8[ica] = bI8[ica] * s.speed * (seq ? 1-u : (Math.random() * 2));
					bI[i + 9] = sprIdx | BIT_DEFAULT_Z_INDEX;
					if ((s.speed *= sp) > 0.1) { count ++ }
					s.spr += sp4;
					B.length++;
					i += stride;
					ica += cStride;
				}
			}

		} else {
			for(const s of this.items) {
				if (s.speed > 0.1) {
					const sprIdx = this.sprites[(s.spr | 0) % sLen];
					const spr = SPRITE_LIST[sprIdx];
					bF[i] = this.fx.x + s.x;
					bF[i + 1] = this.fx.y + s.y;
					bF[i + 2] = s.r;
					bF[i + 3] = s.y * (count % 2 ? -1 : 1);
					bF[i + 4] = spr.cx;
					bF[i + 5] = spr.cy;
					bF[i + 6] = s.dir;
					bI[i + 8] = this.color;
					bI8[ica] = bI8[ica] * s.speed * (Math.random() * 2);
					bI[i + 9] = sprIdx;
					if ((s.speed *= sp) > 0.1) { count ++ }
					s.spr += sp4;
					B.length++;
					i += stride;
					ica += cStride;
				}
			}
		}
		if (count === 0) { this.time = this.maxTime + 1 }

	},
};
