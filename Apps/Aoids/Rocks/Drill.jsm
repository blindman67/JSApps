import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {habitatCommon} from "./habitatCommon.jsm";
export {Drill};
const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const DRILL_PHASE_LENGTH = 300; // in frames
const PUMP_PHASE_LENGTH = 300; // in frames
const PHASE_LENGTH = PUMP_PHASE_LENGTH + DRILL_PHASE_LENGTH;
const DRILL_TOP = 0, DRILL_BOTTOM = 17;
const METAL_ODDS = data.rocks.metalOdds;
const BONUS_ODDS = data.rocks.bonusOdds;
const METAL_TYPE_SEL = data.rocks.metalTypeSel;

function Drill(owner, desc) {
    if (typeof desc.parts === "string") { desc.parts = data.spriteSheet.names[desc.parts] }
    this.owner = owner;
    this.phase = 0;
    this.pumpPos = 0;
    this.pumpSpeed = 0;
    this.drillPos = 3;
    this.drillDir = 0.25;
    this.base = undefined;
    this.desc = desc;
    this.initPersonal();
    this.initPower();
    this.shutDown = false;

    owner.selfRender = true;

}
Drill.prototype = {
    delete() { this.owner = undefined },
    ...habitatCommon.status,
    ...habitatCommon.personalManager,
    ...habitatCommon.power,
    update() {
        if (this.owner.rock.size < 1) {
            this.updateWorkers();
            this.powerSupply();
            if (this.productivity > 0) {

                this.phase = (this.phase + 1) % PHASE_LENGTH;
                if (this.drillPos > DRILL_BOTTOM || this.drillPos < DRILL_TOP) {
                    this.drillDir = -this.drillDir;
                }
                this.drillPos += this.drillDir * this.productivity;
                if (this.phase < DRILL_PHASE_LENGTH) {

                    this.pumpSpeed > 0 && (this.pumpSpeed -= 0.02 * this.productivity);
                } else {
                    if (this.pumpSpeed < 1) { this.pumpSpeed += 0.02 * this.productivity}
                    else { this.pumpSpeed = 1 }
                    if (this.pumpSpeed === 1 && this.phase % this.desc.metalRate === 0) {

                        if (Math.random() < this.productivity ) {
                            if (Math.random() < BONUS_ODDS) {
                                this.base.metals[4].count += this.base.metals[4].count < this.base.metals[4].maxCount ? 1 : 0;
                            } else {
                                const type = METAL_TYPE_SEL[Math.random() * METAL_TYPE_SEL.length | 0];
                                this.base.metals[type].count += this.base.metals[type].count < this.base.metals[type].maxCount ? 1 : 0;
                            }
                        }
                    }

                }
            }
            this.pumpPos += this.pumpSpeed;
        } else { this.kill() }
    },
    kill() {
        this.deaths();
        this.base.remove(this.owner.rock);
        this.owner.selfRender = true;
        this.owner.behaviour = undefined;
        this.owner = undefined;
    },
    updateSprite(buf, bF, bI, stride, i) {
		const t = this;
        const o = this.owner;
        const p = o.desc.parts
        const r = o.rock;
        const sc = r.scale;
        const rot = r.r;
        const pumpSprIdxs = p[3]
        const ppA = (this.pumpPos % pumpSprIdxs.length) | 0;
        const ppB = pumpSprIdxs.length - 1 - ppA;
        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = sc;
        bF[i + 3] = sc;
        bF[i + 4] = 16.5 / 12;
        bF[i + 5] = -7 / 3;
        bF[i + 6] = rot;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = pumpSprIdxs[ppB] | BIT_DEFAULT_Z_INDEX;
        i += stride;

        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = sc;
        bF[i + 3] = sc;
        bF[i + 4] = 23.5 / 22;
        bF[i + 5] = (44 - this.drillPos) / 30;
        bF[i + 6] = rot;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[1] | BIT_DEFAULT_Z_INDEX;
        i += stride;

        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = sc;
        bF[i + 3] = sc;
        bF[i + 4] = 0.5;
        bF[i + 5] = 0.5;
        bF[i + 6] = rot;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[0] | BIT_DEFAULT_Z_INDEX;
        i += stride;

        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = sc;
        bF[i + 3] = sc;
        bF[i + 4] = 16.5 / 12;
        bF[i + 5] = -7 / 3;
        bF[i + 6] = rot;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = pumpSprIdxs[ppA] | BIT_DEFAULT_Z_INDEX;
        i += stride;

        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = sc;
        bF[i + 3] = sc;
        bF[i + 4] = 33.5 / 11;
        bF[i + 5] = (43 - this.drillPos) / 9;
        bF[i + 6] = rot;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[2] | BIT_DEFAULT_Z_INDEX;
        i += stride;

        buf.length += 5;

        return i;
    },
};
