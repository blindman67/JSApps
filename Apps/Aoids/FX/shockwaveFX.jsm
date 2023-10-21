import {data} from "../data.jsm";
import {FXPool} from "./FXPool.jsm";

const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const SHOCKWAVE_SPR_COLORS = data.fx.shockwaveColors;
const SHOCKWAVE_SPRITE_IDX = [
    data.spriteSheet.names.FXShock | BIT_DEFAULT_Z_INDEX,
    data.spriteSheet.names.FXGlow | BIT_DEFAULT_Z_INDEX,
    data.spriteSheet.names.FXGlowStar | BIT_DEFAULT_Z_INDEX
];
const SHOCKWAVE_SPRITE_DESC = data.spriteSheet.sprites[data.spriteSheet.names.FXShock];
const DEFAULT_COLOR = SHOCKWAVE_SPR_COLORS;
const DEFAULT_BUFFER_IDX = 1;
var buffers, stride;
const shockwaveFX = new FXPool(Shockwave, _bufs => {
		buffers = _bufs;
		stride = buffers[0].stride;
	},
	DEFAULT_BUFFER_IDX
);
export {shockwaveFX};

function Shockwave() {
	this.radius = 1;
    this.time = 0;
    this.maxTime = 0;
	this.color = DEFAULT_COLOR;
	this.dir = 0;
    this.layers = 3;
	this.fx = undefined;
}
Shockwave.prototype = {
	init(fx, size, col = SHOCKWAVE_SPR_COLORS[DEFAULT_COLOR], layers = 3) {
        const r = (300 + size);
        this.maxTime = 8 + (size / 30) * Math.random();
        this.time = -1;
		this.radius =  (1 / (SHOCKWAVE_SPRITE_DESC.w / 2)) * r;
		this.dir = Math.random() * Math.PI * 2;
		this.color = col;
        this.layers = Math.min(layers,3);
		this.fx = fx;
	},
	update(fx) {
		this.time += 1;
		if (this.time < this.maxTime) { return true }
		this.fx = undefined;
		return false;
	},
	updateSprite() {
		const B = buffers[this.fx.bufferIdx];
		const bF = B.data, bI = B.UI32, bI8 = B.UI8;
		var i = B.length * stride;
        const u = (this.time + Math.random()) / (this.maxTime + 1);
        var alpha = (1 - u) ** 0.75 * 255;
        const r = (u ** 0.75) * this.radius;
        const count = this.layers;
		var j = 0;
		while (j < count) {
			bF[i] = this.fx.x;
			bF[i+1] = this.fx.y;
			bF[i+4] = 0.5;
			bF[i+5] = 0.5;
			bI[i+8] = this.color;
			bI8[(i+8) * 4 + 3] = alpha;
			bI[i + 9] = SHOCKWAVE_SPRITE_IDX[j];
			if(j === 2) {

				bF[i+2] = r * 4;
				bF[i+3] = r * 4;
				bF[i+6] = Math.random() * Math.PI * 2;
			} else {
				bF[i+6] = this.dir;
				bF[i+2] = r;
				bF[i+3] = r;
			}
            alpha *= 0.7;
			B.length++;
			i += stride;
			j++;
		}
	},
}

