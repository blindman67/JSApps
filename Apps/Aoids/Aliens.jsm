import "../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../src/Vec2.jsm";
import {data} from "./data.jsm";
import {buffers} from "./buffers.jsm";
export {Aliens};

function Aliens() {
    const items = [];
    var size = 0;

    const API = {
		set FXs(fxs) { FXs = fxs },
        delete() {
            this.reset();
            rocks = undefined;
        },
		reset() {
            items.forEach(item => item.delete());
            size = items.length = 0
        },
		newItem(type, config) {
			const alien = new Alien(type, config);
			items[size ++] = alien;
			return alien;
		},
		update() {
			var tail = 0, head = 0;
            while (head < size) {
                const a = items[head];
                if (a.update()) {
                    if (head > tail) {
                        items[head] = items[tail];
                        items[tail] = a;
                    }
                    tail++;
                }
                head++;
            }
            size = tail;
        },


    }
    return API;

};
