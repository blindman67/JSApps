import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {habitatCommon} from "./habitatCommon.jsm";
export {Power};
const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;

function Power(owner, desc) {
    if (typeof desc.parts === "string") { desc.parts = data.spriteSheet.names[desc.parts] }
    this.initPersonal();
    this.owner = owner;
    this.desc = desc;
    owner.selfRender = true;
    this.glowTimer = 0;
    this.glowA = 0;
    this.glowB = 0;
    this.sparkTimer = 0;
    this.spark = 0;
    this.shutDown = false;

    this.sparkMirror = 1;

}
Power.prototype = {
    ...habitatCommon.personalManager,
    ...habitatCommon.status,
    kill() {
        this.deaths();
        this.base.remove(this.owner.rock);
        this.owner.behaviour = undefined;
        this.owner = undefined;
        return;
    },
    update() {
        if (this.owner.rock.size !== 0) {
            this.kill();
            return;
        }

        this.updateWorkers();
        if (this.productivity > 0) {
            const p = this.productivity;
            this.base.powerSupply += this.desc.generatesPower * p;
            this.glowTimer += 0.1 * p;
            this.glowA = p + Math.sin(this.glowTimer) * p;
            this.glowB = p + Math.sin(this.glowTimer * 2.34) * p;
            this.glowA = this.glowA < 0 ? 0 : this.glowA > 1 ? 1 : this.glowA;
            this.glowB = this.glowB < 0 ? 0 : this.glowB > 1 ? 1 : this.glowB;
            this.sparkTimer += 0.2 * p;
            if (this.sparkTimer > 1) {
                this.sparkTimer = 0;
                this.spark = Math.random() * 9 | 0;
                this.sparkMirror = Math.random() < 0.5 ? -1 : 1;
            }
        }

    },
    updateSprite(buf, bF, bI, stride, i) {
        const o = this.owner;
        const r = this.owner.rock;
        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = r.scale;
        bF[i + 3] = r.scale;
        bF[i + 4] = 0.5;
        bF[i + 5] = 0.5;
        bF[i + 6] = r.r;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = o.desc.parts[0] | BIT_DEFAULT_Z_INDEX;
        i += stride;
        buf.length += 1;
        return i;
    },
	updateFXSprite(buf, bF, bI, stride, i) {
        if (this.productivity > 0) {
            const t = this;
            const o = this.owner;
            const r = o.rock;
            const p = o.desc.parts
            const rot = r.r;
            const sc = r.scale;
            bF[i    ] = r.x;
            bF[i + 1] = r.y;
            bF[i + 2] = sc;
            bF[i + 3] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = 44 / 71;
            bF[i + 6] = rot;
            bI[i + 8] = ((this.glowA * 255) << 24) + 0xFF00;
            bI[i + 9] = p[2];
            buf.length ++;
            i += stride;

            bF[i    ] = r.x;
            bF[i + 1] = r.y;
            bF[i + 2] = sc;
            bF[i + 3] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = 41 / 65;
            bF[i + 6] = rot;
            bI[i + 8] = ((this.glowB * 255) << 24) + 0xFF;
            bI[i + 9] = p[1];
            buf.length ++;
            i += stride;

            bF[i    ] = r.x;
            bF[i + 1] = r.y;
            bF[i + 2] = this.sparkMirror * sc;
            bF[i + 3] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = -41 / 10;
            bF[i + 6] = rot;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = p[3 + this.spark];
            buf.length ++;
            i += stride;
        }
		return i;
	},
};