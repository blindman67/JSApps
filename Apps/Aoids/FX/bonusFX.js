import {data} from "../data.js";
import {FXPool} from "./FXPool.js";
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const BONUS_SPRITE_IDX = data.overlaySpriteSheet.names.bonusWords;
const BONUS_SPRITE_IDX_COUNT = BONUS_SPRITE_IDX.length;
const BONUS_COLORS = data.prizes.bonusColors;
const DEFAULT_BUFFER_IDX = 3;

var buffers, stride;
const bonusFX = new FXPool(Bonus, _bufs => {
		buffers = _bufs;
		stride = buffers[0].stride;
	},
	DEFAULT_BUFFER_IDX
);

export {bonusFX};

function Bonus() {
	this.time = 0;
	this.maxTime = 0;
	this.dx = 0;
	this.dy = 0;
	this.color = 0xFFFFFFFF;
	this.sprIdx = 0;
	this.fx = undefined;
};
Bonus.prototype = {
	init(fx, dx, dy, sprIdx) {
		this.time = 0;
		this.maxTime = 530;
		this.color = BONUS_COLORS[sprIdx  % BONUS_SPRITE_IDX_COUNT | 0];
		this.dx = dx;
		this.dy = dy;
		this.sprIdx = BONUS_SPRITE_IDX[sprIdx % BONUS_SPRITE_IDX_COUNT | 0] | BIT_DEFAULT_Z_INDEX;
		this.fx = fx;
	},
	update(fx) {
		this.time += 1;
		if (this.time < this.maxTime) {
			this.fx.x += (this.dx *= 0.8);
			this.fx.y += (this.dy += (-1 - this.dy) * 0.8);
			return true;
		}
		this.fx = undefined;
		return false;
	},
	updateSprite() {
		const B = buffers[this.fx.bufferIdx];
		const bF = B.data, bI = B.UI32, bI8 = B.UI8;
		var i = B.length * stride;
		bF[i]   = this.fx.x;
		bF[i+1] = this.fx.y;;
		bF[i+2] = 1;
		bF[i+3] = 1;
		bF[i+4] = 0.5;
		bF[i+5] = 0.5;
		bF[i+6] = 0;
		bF[i+7] = 0;
		bI[i+8] = this.color;
		bI8[(i+8) * 4 + 3] = (1-this.time / this.maxTime) ** (1/2) * 255;;
		bI[i + 9] = this.sprIdx;
		B.length ++;
	},
}