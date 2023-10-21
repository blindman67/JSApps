import {Vec2} from "../../src/Vec2.js";
import {data} from "./data.js";
import {buffers} from "./buffers.js";
import {Aoids} from "./Aoids.js";
export {Pickups};
//var sprites,spritesFX, spritesOffsets, sprStride, spritesBuf, spritesFXBuf;
function Pickups(type, maxPickups = 1e5) {
	const items = [];
	const pickupType = type;
	var size = 0;
	var returnSize = 0;
	var inPlayDist = 0;
    const stride = buffers.stride;
	const API = {
		set FXs(fxs) { FXs = fxs },
		set inPlayDistance(v) { inPlayDist = v },
		set target(t) { pickupType.setTarget(t) },
		/*set sprites(s) { // the sprites shader
			sprites = s.sprites;
			spritesFX = s.spritesFX;
			spritesOffsets = s.sprites.offsets;
			spritesBuf = s.sprites.getBuffer(0);
			spritesFXBuf = s.spritesFX.getBuffer(0);
			sprStride = spritesOffsets.stride;
		},*/
		reset() { size = items.length = 0 },
		newItem() {
			var pickup;
			returnSize = size;
			if (size < maxPickups) {
				if (items.length > size) { pickup = items[size++] }
				else { items[size ++] = pickup = new pickupType() }
				pickup.playDist = inPlayDist;
				return pickup;
			}
			return pickupType.DUD
		},
		returnItem() { size = returnSize },
		update() {
			var tail = 0, head = 0, i = buffers.draw.length * stride, j = buffers.fx.length * stride;
			const t = Aoids.time / 500;
			const bF = buffers.draw.data;
			const bI = buffers.draw.UI32;
			const bFF = buffers.fx.data;
			const bFI = buffers.fx.UI32;
            buffers.draw.scale = 1 / Aoids.viewScale;
            buffers.fx.scale = 1 / Aoids.viewScale;
			const len = size;
			while (head < len) {
				const p = items[head];
				if (p.alive > 0 && p.update()) {
					if (p.targetDist < inPlayDist) {
						i = p.updateSprite(buffers.draw, bF, bI, stride, i, t);
						if(p.highlight) { j = p.updateSpriteHighlight(buffers.fx, bFF, bFI, stride, j, t) }
					}
					if (head > tail) {
						items[head] = items[tail];
						items[tail] = p;
					}
					tail++;
				}
				head++;
			}
			size = tail;
			return size;
		},
		each(cb) {
			var i = 0;
			while (i < size) {
				const p = items[i++];
				if (p.alive && !cb(p)) { return }
			}
		},
	};
	return API;
};