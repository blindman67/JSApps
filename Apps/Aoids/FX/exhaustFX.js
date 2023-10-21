import {data} from "../data.js";
import {FXPool} from "./FXPool.js";
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const EXHAUST_SPRITE_IDX = data.spriteSheet.names.plasmaSparks;
const EXHAUST_SPRITE_IDX_COUNT = EXHAUST_SPRITE_IDX.length;
const DEFAULT_BUFFER_IDX = 1;

var buffers, stride;
const exhaustFX = new FXPool(Exhaust, _bufs => {
		buffers = _bufs;
		stride = buffers[0].stride;
	},
	DEFAULT_BUFFER_IDX
);
export {exhaustFX};

function Exhaust() {
	this.time = 0;
	this.maxTime = 0;
	this.color = 0xFFFFFFFF;
	this.sprIdx = 0;
	this.dx = 0;
	this.dy = 0;
	this.fx = undefined;
};
Exhaust.prototype = {
	init(fx, sprIdx, dx, dy, col = 0xFFFFFFFF) {
		this.time = 0;
		this.maxTime = 30 + Math.random() * 60;
		this.color = col;
		this.dx = dx;
		this.dy = dy;
		this.sprIdx = 0;
		this.fx = fx;
	},
	update(fx) {
		this.time += 1;
		if (this.time < this.maxTime) {
			this.fx.x += (this.dx *= 0.9) + (Math.random() - 0.5) * 2;
			this.fx.y += (this.dy *= 0.9) + (Math.random() - 0.5) * 2;
			return true
		}
		this.fx = undefined;
		return false;
	},
	updateSprite() {
		const u = 1 - this.time / this.maxTime;
		if (Math.random() < u /3) {
			const B = buffers[this.fx.bufferIdx];
			const bF = B.data, bI = B.UI32, bI8 = B.UI8;
			var i = B.length * stride;
			const scale = (2 - u) * Math.random() + 0.5;
			const alpha = (u * Math.random())** (1/2) * 255;
			bF[i] = this.fx.x;
			bF[i+1] = this.fx.y;;
			bF[i+4] = 0.5;
			bF[i+5] = 0.5;
			bF[i+6] = Math.random() * Math.PI;
			bI[i+8] = this.color;
			bI8[(i+8) * 4 + 3] = alpha;
			bI[i + 9] = EXHAUST_SPRITE_IDX[Math.random() * EXHAUST_SPRITE_IDX_COUNT | 0] | BIT_DEFAULT_Z_INDEX;
			bF[i+2] = scale;
			bF[i+3] = scale;
			B.length ++;
		}
	},
}