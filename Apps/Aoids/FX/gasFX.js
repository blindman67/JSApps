import {data} from "../data.js";
import {FXPool} from "./FXPool.js";

const SMOKE_SPRITE_IDX = data.spriteSheet.names.smoke;
const SMOKE_SPRITE_IDX_COUNT = SMOKE_SPRITE_IDX.length;
const DEFAULT_BUFFER_IDX = 2;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
var buffers, stride;
const gasFX = new FXPool(Gas, _bufs => {
		buffers = _bufs;
		stride = buffers[0].stride;
	},
	DEFAULT_BUFFER_IDX
);
export {gasFX};

function Gas() {
	this.time = 0;
	this.maxTime = 0;
	this.step = 0;
	this.uTime = 0;
	this.dx = 0;
	this.dy = 0;
	this.size = 2;
	this.r = 0;
	this.dr = 0;
	this.maxAlpha = 64;
	this.color = 0xFFFFFFFF;
	this.spr = 0;
	this.fx = undefined;
};
Gas.prototype = {
	init(fx, color, smokeSpriteId, dx, dy, maxAlpha, maxSize) {
		this.time = 0;
		this.maxTime = 20 + Math.random() * 60;
		this.color = color;
		this.size = Math.random() * maxSize;
		this.maxAlpha = Math.random() * maxAlpha;
		this.dx = dx;
		this.dy = dy;
		this.r = Math.random() * Math.PI * 2;
		this.dr = (Math.random() - 0.5) * 0.2;
		this.step = 0.1 + Math.random();
		this.spr = SMOKE_SPRITE_IDX[smokeSpriteId % SMOKE_SPRITE_IDX_COUNT | 0] | BIT_DEFAULT_Z_INDEX;
		this.fx = fx;
	},
	update(fx) {
		this.time += this.step;
		if (this.time < this.maxTime) {
			this.fx.x += this.dx;
			this.fx.y += this.dy;
			this.dx *= 0.9;
			this.dy *= 0.9;
			this.uTime = this.time / this.maxTime;
			this.r += this.dr;
			return true;
		}
		this.fx = undefined;
		return false;
	},
	updateSprite() {
		const B = buffers[this.fx.bufferIdx];
		const bF = B.data, bI = B.UI32, bI8 = B.UI8;
		var i = B.length * stride;
		const scale = (0.1 + this.uTime * this.size)**1.4 * 5;
		const alpha = (1- this.uTime) ** 2 * this.maxAlpha;
		if (alpha < 1) { this.time = this.maxTime }
		bF[i] = this.fx.x;
		bF[i+1] = this.fx.y;;
		bF[i+4] = 0.5;
		bF[i+5] = 0.5;
		bF[i+6] = this.r;
		bF[i+7] = 0;
		bI[i+8] = this.color;
		bI8[(i+8) * 4 + 3] = alpha;
		bI[i + 9] = this.spr;
		bF[i+2] = scale;
		bF[i+3] = scale;
		B.length ++;
	},
}