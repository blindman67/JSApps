import "../../../src/utils/MathExtensions.jsm";
import {data} from "../data.jsm";
import {SubFX} from "./SubFX.jsm";
import {FXPool} from "./FXPool.jsm";

const SMOKE_SPRITE_IDX = data.spriteSheet.names.smoke;
const SPRITES = data.spriteSheet.sprites;
const SMOKE_COUNT = 4;
const DEFAULT_BUFFER_IDX = 0;
const COLOR = [0xFFFFFFFF | 0];
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
var buffers, stride, cStride;
const smokeFX = new FXPool(Smoke, _bufs => {
		buffers = _bufs;
		cStride = (stride = buffers[0].stride) * 4;
	},
	DEFAULT_BUFFER_IDX
);
export {smokeFX};

function Smoke() {
	this.time = 0;
	this.maxTime = 0;
	this.color = 0
	this.colorArray = COLOR;
	this.count = SMOKE_COUNT;
	this.smokes = [new SubFX(), new SubFX(), new SubFX(), new SubFX()];
	this.fx = undefined;
};
Smoke.prototype = {
	init(fx, color, size, dir, colorArray, sprites = SMOKE_SPRITE_IDX, time = 36, spread = size) {
		for (const s of this.smokes) {
			const spr = sprites[Math.random() * sprites.length | 0] ;
            s.speed = (size*8) / SPRITES[spr].diag;  // end scale
            s.spr = spr | BIT_DEFAULT_Z_INDEX;

			const dir1 = dir === undefined ? Math.random() * Math.TAU : dir + (Math.random() - 0.5) * spread;
			const dist = dir === undefined ? 0 : Math.random() *  size * 4;
			s.x = Math.cos(dir1) * dist;
			s.y = Math.sin(dir1) * dist;
			//s.dir = (Math.random() - 0.5) * 0.3;
			s.r = Math.random() * Math.TAU;
		}
		this.time = 0;
		this.maxTime = time / 2 + Math.random() * time / 2;
		if (colorArray) {
			this.colorArray = colorArray;
		} else {
			this.color = color | 0;
			this.colorArray = undefined;
		}
		this.fx = fx;
	},
	update(fx) {
		this.time += 1;
		if (this.time < this.maxTime) { return true }
		this.fx = undefined;
		this.color = COLOR;
		return false;
	},
	updateSprite() {
        var sc, i, ica;
		const u = this.time / this.maxTime;
		const alpha = ((1 - u) ** 1 / 2);
        if (alpha > 0.002) {
            const B = buffers[this.fx.bufferIdx];
            const bF = B.data, bI = B.UI32, bI8 = B.UI8;
            i = B.length * stride;
            ica = (i + 8) * 4 + 3;
            const move = u ** 0.5;
            const scale = u ** 2 * 0.75 + 0.25;
            const col = this.colorArray ? this.colorArray[u * (this.colorArray.length - 1) | 0] : this.color;
            for (const s of this.smokes) {
                bI[i+8] = col;
                if ((bI8[ica] = bI8[ica] * alpha) > 0) {
                    bF[i] = this.fx.x + s.x * move;
                    bF[i+1] = this.fx.y + s.y * move;
                    bF[i+2] = sc = s.speed * scale;
                    bF[i+3] = sc;
                    bF[i+4] = 0.5;
                    bF[i+5] = 0.5;
                    bF[i+6] = s.r;// += s.dir;
                    bI[i + 9] = s.spr;
                    i += stride;
                    ica += cStride;
                    B.length ++;
                }
            }
        } else {
            this.time = this.maxTime;
        }
	},
}


