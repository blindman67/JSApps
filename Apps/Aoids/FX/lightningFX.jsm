import "../../../src/utils/MathExtensions.jsm";
import {V2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {SubFX} from "./SubFX.jsm";
import {FXPool} from "./FXPool.jsm";

const DEFAULT_BUFFER_IDX = 1;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const BOLT_SPRITE_IDX = data.spriteSheet.names.lightning;
const BOLT_SPRITE_IDX_COUNT = BOLT_SPRITE_IDX.length;
const GLOW_SPRITE_IDX = data.spriteSheet.names.FXGlow | BIT_DEFAULT_Z_INDEX;
const BOLT_COUNT = 4;
const R_PATH_COUNT = 1024;
const R_PATH = Math.randSSeq(0, BOLT_SPRITE_IDX_COUNT, R_PATH_COUNT, Math.random() * 1024 | 0);

const B = (x, y, dir, dRange) => ({
	x: x - lastBDesc.x, y: y - lastBDesc.y, dir: (dir - dRange / 2) * Math.PI90, dRange: dRange * Math.PI90,
	len: (lastBDesc.x - x) ** 2 + (lastBDesc.y - y) ** 2,
}); // dir as 0 - 4
var lastBDesc;
const Bs = (idx, x, y) => (lastBDesc = {
	x, y,
	sprIdx: BOLT_SPRITE_IDX[idx] | 0,
	cx: x / data.spriteSheet.sprites[BOLT_SPRITE_IDX[idx]].w,
	cy: y / data.spriteSheet.sprites[BOLT_SPRITE_IDX[idx]].h,
})
const boltDesc = [{ // one for each sprite IDX
		start: Bs(0, 19, 0),
		branches: [B(41,47, 0.5, 1), B(18,33, 1.5, 1)],
	}, {
		start: Bs(1, 21, 0),
		branches: [B(36, 33, 0, 1), B(43, 43, 0.5, 1), B(27, 61, 1.5, 1)],
	}, {
		start: Bs(2, 67, 4),
		branches: [ B(100, 80, -0.25, 1), B(116, 74, 0.5, 1), B(100, 80, 0.85, 1), B(73, 47, 1.25, 1), B(31, 21, 2, 1)],
	}, {
		start: Bs(3, 31, 4),
		branches: [ B(36, 6, 0, 1), B(49, 47, 0.6, 1), B(43, 90, 1, 1), B(25, 91, 1.4, 1),],
	}, {
		start: Bs(4, 16, 0),
		branches: [ B(36, 60, 0, 1), B(42, 108, 1, 1), B(12, 42, 1.7, 1), B(15, 18, 2, 1),   ],
	},
];
lastBDesc = undefined;

var buffers, stride;
const lightningFX = new FXPool(Lightning, _bufs => {
		buffers = _bufs;
		stride = buffers[0].stride;
	},
	DEFAULT_BUFFER_IDX
);
export {lightningFX};

function Lightning() {
	this.time = 0;
	this.maxTime = 0;
	this.alpha = 1;
	this.color = 0xFFFFFFFF;
	this.dir = 0;
	this.speed = 0;
	this.size = 0;
	this.pathPos = 0;
	this.spr = 0;
	this.lScale = 1
	this.fx = undefined;
};
Lightning.prototype = {
	init(fx, dx, dy, color, size) {
		this.dir =  Math.atan2(dy,dx) + (Math.random()-0.5) * Math.PI;
		this.speed = (dx * dx + dy * dy) * 5;
		this.size = size * 1.5;
		this.spr = Math.random() * boltDesc.length | 0;
		this.pathPos = Math.random() * R_PATH_COUNT | 0;
		this.time = 0;
		this.maxTime = 2 + Math.random() * 8;
		this.color = color;
		this.lScale = Math.rand(2,4);
		this.alpha =  255;
		this.fx = fx;
	},
	update(fx) {
		this.time ++;
		if (this.time <= this.maxTime) { return true }
		this.fx = undefined;
		return false;
	},
	updateSprite() {
		const B = buffers[this.fx.bufferIdx];
		const bF = B.data, bI = B.UI32, bI8 = B.UI8;
		const bd = boltDesc;
		const u = this.time / this.maxTime
		const su = (u * this.size) ** 1.5;
		const col = this.color, alpha = this.alpha;
		var i = B.length * stride;
		var x = this.fx.x, y = this.fx.y;
		var s = su / 4, sp, p, r;
		var ls = this.lScale;
		this.lScale += (1 - ls) * 0.2;
		r = this.dir;
		sp = this.speed;
		p = this.pathPos++;
		var bSpr = this.spr;
		const bl = bd[bSpr], bls = bl.start;
		bF[i] = x;
		bF[i+1] = y;
		bF[i+2] = su;
		bF[i+3] = su;
		bF[i+4] = 0.5;
		bF[i+5] = 0.5;
		bF[i+6] = r ;
		bI[i+8] = col;
		bI8[(i+8) * 4 + 3] = (1 - u) * 255;
		bI[i + 9] = GLOW_SPRITE_IDX;
		i += stride;
		B.length ++;
		bF[i] = x;
		bF[i+1] = y;
		bF[i+2] = s;
		bF[i+3] = s*ls;
		bF[i+4] = bls.cx;
		bF[i+5] = bls.cy;
		bF[i+6] = r ;
		bI[i+8] = col;
		bI8[(i+8) * 4 + 3] = alpha;
		bI[i + 9] = bls.sprIdx | BIT_DEFAULT_Z_INDEX;
		i += stride;
		B.length ++;
		var cc = 40;
		while (sp > 0 && cc--) {
			const br = bd[bSpr].branches[R_PATH[(p ++) % R_PATH_COUNT] % bd[bSpr].branches.length];
			sp -= br.len;
			const xAx = Math.cos(r) * s;
			const xAy = Math.sin(r) * s;
			x += br.x * xAx - br.y * xAy;
			y += (br.x * xAy + br.y * xAx) * ls;
			r += (R_PATH[(p ++) % R_PATH_COUNT] / 1024) * br.dRange + br.dir - Math.PI90;
			bSpr = R_PATH[(p ++) % R_PATH_COUNT];
			const bl = bd[bSpr], bls = bl.start;
			s *= 0.90;
			bF[i] = x;
			bF[i+1] = y;
			bF[i+2] = s;
			bF[i+3] = s*ls;
			bF[i+4] = bls.cx;
			bF[i+5] = bls.cy;
			bF[i+6] = r ;
			bI[i+8] = col;
			bI8[(i+8) * 4 + 3] = alpha * s;
			bI[i + 9] = bls.sprIdx | BIT_DEFAULT_Z_INDEX;
			i += stride;
			B.length ++;



		}
	},
}


