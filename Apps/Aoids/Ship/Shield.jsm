import "../../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {buffers} from "../buffers.jsm";
import {MountCommon, MountSimpleCommon} from "./MountCommon.jsm";
export {Shield, ShieldSimple};
function Shield(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.activated = false;
	this.output = 0; // 0 no power, 1+ full power,

}
Shield.prototype = {
	...MountCommon,
     deleteSelf() {},
	spritesAddFX(buf, z) {
        if (this.holdFx) { return }
		this.fxStart = buf.length * buffers.stride;
		const dis = this.display
		const idxs = dis.FXSprites, hp = this.hardPoint, tech = this.tech;
		var i = 0;
		for (const pl of tech.powerLevels) {
			buf.shader.addPart({idx: idxs[0], px: hp.y, py: -hp.x, sy: pl * dis.scale, sx: pl * dis.scale, color: dis.colors[i], z}, buf.bufIdx);
			i ++;
		}
        this.fxEnd = buf.length * buffers.stride;
        this.fxSave(buf);

	},
	spritesUpdate(x, y, r) {
        this.restoreVisible(x, y, r);
		var i, op;
		op = this.output ** 0.33;


        const F = buffers.fx.data;
        const B = buffers.fx.UI32;
        const B8 = buffers.fx.UI8;
        const stride = buffers.stride;
        const sc = this.display.scale;
        i = this.fxStart;
        for (const pl of this.tech.powerLevels) {
            F[i + 2] = pl * sc + (Math.random() - 0.5) * 2 * op;
            F[i + 3] = pl * sc + (Math.random() - 0.5) * 2 * op;
            F[i + 6] = Math.random() * Math.TAU;
            //B[i + 8] = 0xFFFFFF;
            B8[(i + 8) * 4 + 3] = op * 64;
            i+= stride;
            op **= 1.2;
        }

	},
	defend(amount) {
		amount = amount < this.tech.maxPower ? amount : this.tech.maxPower;
		amount = this.ship.power.requestPower(amount * this.tech.PER) /  this.tech.PER;
		this.output = amount / this.tech.maxPower;

		return amount * (1 - this.tech.damageFactor);
	},
	update() {
		const t = this.tech;
		this.ship.mass += t.mass;
		this.upgraded && (this.upgraded = false);
		this.output *= t.ringDown;
		if(this.output < 0.01) {
			this.output = 0;
			this.activated = false;
		} else {
            if(this.output < t.ionizingInterupt) {
                this.activated = false;
            } else {
                this.activated = true;
            }
		}
	},
};

function ShieldSimple(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.activated = false;
	this.output = 0; // 0 no power, 1+ full power,
	this.prevOutput = -1;
}
ShieldSimple.prototype = {
    ...MountSimpleCommon,
    spritesAddFX: Shield.prototype.spritesAddFX,
    spritesUpdate: Shield.prototype.spritesUpdate,
	defend(amount) {
		const max = this.tech.maxLevel * this.tech.maxPower * this.tech.PER;
		amount = amount < max ? amount : max;
		this.output = amount / (this.tech.maxPower * this.tech.PER);
		return amount;
	},
	update() {
		const t = this.tech;
		this.ship.mass += this.tech.mass;
		this.output *= 0.5;
		if(this.output < 0.01) {
			this.output = 0;
			this.activated = false;
		} else {
			this.activated = true;
		}
	},
};