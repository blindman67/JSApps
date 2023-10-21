import "../../../src/utils/MathExtensions.js";
import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";
import {buffers} from "../buffers.js";
import {MountCommon, MountSimpleCommon} from "./MountCommon.js";
export {Thruster, ThrusterSimple};
const THRUST_EPSOLON = 0.001;
function Thruster(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.outputWidth = data.spriteSheet.sprites[display.FXSprites[0]].w;
	this.direction = (display && display.direction !== undefined) ? display.direction : 0;
	this.activated = false;
	this.showOnly = false;
	this.injector = 0;
	this.injectorC = 0;
	this.injectorR = 0;
	this.reaction = 0
	this.reactionC = 0
	this.reactionR = 0
    this.PER = tech.PER;
	this.output = 0; // 0 no power, 1 full power

}
Thruster.prototype = {
	...MountCommon,
    deleteSelf() { },
	spritesAddFX(buf, z) {
        if (this.holdFx) { return }
		this.fxStart = buf.length * buffers.stride;
		const dis = this.display;
		const idxs = dis.FXSprites, hp = this.hardPoint;
		buf.shader.addPart({idx: idxs[0], px: hp.y, py: -hp.x, cx: 0.5, cy: dis.cx,    sy: 1,   z}, buf.bufIdx);
		buf.shader.addPart({idx: idxs[0], px: hp.y, py: -hp.x, cx: 0.5, cy: dis.cx, sy: 1.5, z}, buf.bufIdx);
		buf.shader.addPart({idx: idxs[0], px: hp.y, py: -hp.x, cx: 0.5, cy: dis.cx, sy: 2.2, z}, buf.bufIdx);
        this.fxEnd = buf.length * buffers.stride;
        this.fxSave(buf);

	},
	spritesUpdate(x, y, r) {
        const op = this.output;
        const B = buffers.fx.UI32;
        const B8 = buffers.fx.UI8;
        const stride = buffers.stride;
        this.restoreVisible(x, y, r);
		var i;
        i = this.fxStart;
        if (op === 0) {
            B[i + 8] = 0xFFFFFF;
            B[i + stride + 8] = 0xFFFFFF;
            B[i + stride + stride + 8] = 0xFFFFFF;
        } else {
            B8[(i + 8) * 4 + 3] = (op ** 1.4 + Math.random() * 0.1 * op) * 255;
            B8[(i + stride + 8) * 4 + 3] = (op ** 2 + Math.random() * 0.2 * op) * 255;
            B8[(i + stride + stride + 8) * 4 + 3] = (op ** 3 + Math.random() * 0.4 * op) * 255;
        }
	},
	update() {
		const t = this.tech;
		this.ship.mass += t.mass;
		this.upgraded && (this.upgraded = false);
		if(this.activated) {
			this.injector += t.injectorRamp;
			this.injector = this.injectorR >= 1 ? 1: this.injector;
			this.activated = false;
		} else {
			this.injector = this.injector <= 0.002 ? 0 : this.injector * t.injectorCool;
		}
		this.injectorR += (this.injectorC = ( this.injectorC += (this.injector - this.injectorR) * t.injectorA) *  t.injectorD);
		this.reaction = this.injectorR;
		this.reactionR += (this.reactionC = ( this.reactionC += (this.reaction - this.reactionR) * t.reactionA) *  t.reactionD);
		if (this.reactionR > THRUST_EPSOLON ) {
			this.reactionR = this.ship.power.requestPower(this.reactionR * this.PER) /  this.PER;
			this.output = this.reactionR;
			if (!this.showOnly) { this.ship.physics.addForce(this.hardPoint,  this.direction,  t.thrust * this.reactionR) }
		} else {
			this.output = 0;
		}
	},
};

function ThrusterSimple(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.outputWidth = data.spriteSheet.sprites[display.FXSprites[0]].w;
	this.direction = (display && display.direction !== undefined) ? display.direction : 0;
	this.activated = false;
	this.showOnly = false;
	this.injector = 0;
	this.injectorC = 0;
	this.injectorR = 0;
	this.reaction = 0
	this.reactionC = 0
	this.reactionR = 0
	this.output = 0; // 0 no power, 1 full power
	this.prevOutput = -1;
}
ThrusterSimple.prototype = {
	...MountSimpleCommon,
    spritesAddFX: Thruster.prototype.spritesAddFX,
    spritesUpdate: Thruster.prototype.spritesUpdate,
	update() {
		const t = this.tech;
		this.ship.mass += t.mass;
		this.upgraded && (this.upgraded = false);
		if(this.activated) {
			this.injector += t.injectorRamp;
			this.injector = this.injectorR >= 1 ? 1: this.injector;
			this.activated = false;
		} else {
			this.injector = this.injector <= 0.002 ? 0 : this.injector * t.injectorCool;
		}
		this.injectorR += (this.injectorC = ( this.injectorC += (this.injector - this.injectorR) * t.injectorA) *  t.injectorD);
		this.reaction = this.injectorR;
		this.reactionR += (this.reactionC = ( this.reactionC += (this.reaction - this.reactionR) * t.reactionA) *  t.reactionD);
		if (this.reactionR > THRUST_EPSOLON ) {
			this.output = this.reactionR;
		} else {
            this.reactionR = 0;
			this.output = 0;
		}
	},
};