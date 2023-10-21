import "../../../src/utils/MathExtensions.jsm";
import {data} from "../data.jsm";
import {SubFX} from "./SubFX.jsm";
import {FXPool} from "./FXPool.jsm";

const FRAG_SPRITE_IDXS = data.spriteSheet.names.rocks[4];
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;

const FRAG_COUNT = 8;
const DEFAULT_BUFFER_IDX = 0;

var buffers, stride, cStride;
const fragsFX = new FXPool(Frags, _bufs => {
		buffers = _bufs;
		cStride = (stride = buffers[0].stride) * 4;
	},
	DEFAULT_BUFFER_IDX
);
export {fragsFX};

function Frags() {
	this.radius = 8;
	this.radiusGrow = 4;
	this.maxRadius = 16;
	this.r = 0;
	this.r1 = 0;
	this.color = 0xFFFFFFFF;
	this.scale = 0;
    this.curve = 0.2;
	this.count = FRAG_COUNT;
	this.frags = [new SubFX(), new SubFX(), new SubFX(), new SubFX(), new SubFX(), new SubFX(), new SubFX(), new SubFX()];
	this.fx = undefined;
}
Frags.prototype = {
	init(fx, color, size, fragIdxs = FRAG_SPRITE_IDXS, scale = 0, sprayDir = 0, spread = Math.TAU, alpha = 0, curve = 0.2) {
		this.count = FRAG_COUNT * (size / 20) | 0;
        this.radius = 1;
		this.maxRadius = (40 + Math.random() * 40) * size;
		this.radiusGrow = this.maxRadius / (Math.random() * 8 + 16);
        this.radius = -this.radiusGrow / 1.2;
		var c = this.count = this.count < 1 ? 1 : 0;
		for(const f of this.frags) {
			f.r = Math.random() * Math.TAU;;
			f.spr = fragIdxs[Math.random() * fragIdxs.length | 0] | BIT_DEFAULT_Z_INDEX;
			const speed = Math.cos(Math.random() * Math.PI / 2) / 3;
            const dir = sprayDir + (Math.random() - 0.5) * spread;
            f.x = Math.cos(dir) * this.maxRadius * speed;
            f.y = Math.sin(dir) * this.maxRadius * speed;
            f.dir = alpha;
			if (! (--c)) { break }
		}
        this.curve = curve;
		this.color = color;
		this.scale = scale;
		this.fx = fx;
	},
	update(fx) {
		this.radius += this.radiusGrow;
		this.r1 = this.radius / this.maxRadius;
		this.r = this.r1 ** this.curve;
		if (this.radius < this.maxRadius) { return true }
		this.fx = undefined;
		return false;
	},
	updateSprite() {
		const B = buffers[this.fx.bufferIdx];
		const bF = B.data, bI = B.UI32, bI8 = B.UI8;
		var i = B.length * stride, ica = (i + 8) * 4 + 3;;
		const scale = this.scale ? ((1 - this.r1) * 0.5 + 0.1) * this.scale : (1 - this.r1) * 0.5 + 0.1;
		var c = this.count;
		for (const f of this.frags) {
			//const dist = f.speed * this.r * this.maxRadius;
			bF[i] = this.fx.x + f.x * this.r;
			bF[i+1] = this.fx.y + f.y * this.r;
			bF[i+4] = 0.5;
			bF[i+5] = 0.5;
			bF[i+6] = f.r + this.r * 8;
			bI[i+8] = this.color;
            bI8[ica] = 255 - f.dir * this.r1;
			bI[i + 9] = f.spr;
			bF[i+2] = scale;
			bF[i+3] = scale;
			B.length++;
			i += stride;
            ica += cStride;
			if (! (--c)) { return }
		}
	},
}

