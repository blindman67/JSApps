import "../../src/utils/MathExtensions.js";
import {arrayUtils} from "../../src/utils/arrayUtils.js";
import {data} from "./data.js";
import {buffers} from "./buffers.js"
import {Aoids} from "./Aoids.js";
export {NumberDisplay};
function NumberDisplay(size, x, y, colA, colB) {
	this.val = 0;
	this.size = size;
	this.idxs = [];
	this.colorA = colA;
	this.colorB = colB;
	this.leadingZeros = false;
	const buf = this.buffer = buffers.overlay;
	const stride = buf.stride;
	const n = data.overlaySpriteSheet.names;
	const s = data.overlaySpriteSheet.sprites;
	this.bufStart = buf.length * stride;
	var i = 0, xx = x;
	while (i < size) {
		buf.shader.addPart({idx: n.numbers[0], cx: 0, cy: 0, x: xx, y, color: colA}, buf.bufIdx);
		xx += s[n.numbers[0]].w - 2;
		this.idxs.push(0);
		i ++;
	}
	this.bufStartH = buf.length * stride;
	i = 0, xx = x;
	while (i < size) {
		buf.shader.addPart({idx: n.numbersHighlight[0], cx: 0, cy: 0, x: xx, y, color: colB}, buf.bufIdx);
		xx += s[n.numbers[0]].w - 2;
		i ++;
	}
	buf.lock();
}
NumberDisplay.prototype = {
	get value() { return this.val },
	set value(v) {
		this.val = v = v | 0;
		var i = this.size;
		while(i--) {
			this.idxs[i] = v % 10 | 0;
			v = v / 10 | 0;
		}
	},
	delete() { },
    update(x,y) {
		var i = this.size, j = 0;
		const b = this.buffer.data;
		const bI = this.buffer.UI32;
		const stride = buffers.stride;
		var bs = this.bufStart;
		var bsh = this.bufStartH;
		const nIdxs = data.overlaySpriteSheet.names.numbers;
		const nhIdxs = data.overlaySpriteSheet.names.numbersHighlight;
		const sprites = data.overlaySpriteSheet.sprites;
		var xx = x;
		if (this.leadingZeros) {
			while(i--) {
				const idx = this.idxs[j];
				b[bs] = xx;
				b[bs + 1] = y;
				bI[bs + 9] = nIdxs[idx];
				b[bsh] = xx;
				b[bsh + 1] = y;
				bI[bsh + 9] = nhIdxs[idx];
				xx += sprites[nIdxs[idx]].w - 5;
				bs += stride;
				bsh += stride;
				j++;
			}
		} else {
			const colA = this.colorA;
			const colB = this.colorB;
			let zeros = true;
			while(i--) {
				const idx = this.idxs[j];
				if(idx || !zeros) {
					zeros = false;
					b[bs] = xx;
					b[bs + 1] = y;
					bI[bs + 8] = colA;
					bI[bs + 9] = nIdxs[idx];
					b[bsh] = xx;
					b[bsh + 1] = y;
					bI[bsh + 8] = colB;
					bI[bsh + 9] = nhIdxs[idx];
					xx += sprites[nIdxs[idx]].w - 5;
				} else {
					bI[bs + 8] = 0;
					bI[bsh + 8] = 0;
				}
				bs += stride;
				bsh += stride;
				j++;
			}
		}
	}
};
