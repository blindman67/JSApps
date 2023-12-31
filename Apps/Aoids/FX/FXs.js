
import {buffers} from "../buffers.js";
import {lightningFX} from "./lightningFX.js";
import {shockwaveFX} from "./shockwaveFX.js";
import {exhaustFX} from "./exhaustFX.js";
import {sparksFX} from "./sparksFX.js";
//import {bonusFX} from "./bonusFX.js";
import {fragsFX} from "./fragsFX.js";
import {smokeFX} from "./smokeFX.js";
import {gasFX} from "./gasFX.js";
import {FX} from "./FX.js";
export {FXs};

function FXs() {
	const items = [];
	var size = 0;
	const API = {
		types: {
			lightning: lightningFX,
			shockwave: shockwaveFX,
			exhaust: exhaustFX,
			sparks: sparksFX,
			//bonus: bonusFX,
			frags: fragsFX,
			smoke: smokeFX,
			gas: gasFX,
		},
        set buffers(bufArray) {
            for (const pool of Object.values(API.types)) { pool.buffers = bufArray }
        },
		reset() { size = items.length = 0 },
		newItem(type, bufferIdx) {
			var fx;
			if (items.length > size) { fx = items[size++] }
			else { items[size ++] = fx = new FX() }
			fx.type = type;
			fx.bufferIdx = bufferIdx !== undefined ? bufferIdx : type.bufferIdx;
			return fx;
		},
		update() {
			var tail = 0, head = 0;
			const len = size;
			while (head < len) {
				const fx = items[head];
				if (fx.alive && fx.update()) {
					fx.fxType.updateSprite();
					if (head > tail) {
						items[head] = items[tail];
						items[tail] = fx;
					}
					head++;
					tail++;
				} else { head++ }
			}
			size = tail;
		},

	};
    API.buffers = [buffers.draw, buffers.fx, buffers.drawB, buffers.overlay];
	return API;
};





