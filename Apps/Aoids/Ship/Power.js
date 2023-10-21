import "../../../src/utils/MathExtensions.js";
import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";
import {buffers} from "../buffers.js";
import {MountCommon, MountSimpleCommon} from "./MountCommon.js";
export {Power, PowerSimple};
var lowPowerWarning = 0;
function Power(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.fuel = this.tech.fuel;
    this.FER = this.tech.FER;
	this.reserve = 1;
	this.drain = 0;
	this.drainAmount = 0;
    this.chargingFlash = 0;
}
Power.prototype = {
	...MountCommon,
    deleteSelf() {},
    docked() {
        const t = this.tech;
        const v = this.fuel;
        const max = t.fuel + t.fuelMaxMetalUpgrade;
        if (v < max) {
            const metal = this.ship.bases.buy(t.dockedRefill);
            this.fuel += t.dockedRefill.fuel * metal;
            this.chargingFlash = 4 * metal;
        }
        this.fuel = this.fuel > max ? max : this.fuel;
    },
	requestPower(amount) {
		const avialible = this.tech.output - this.drainAmount;
		amount = amount > avialible ? avialible : amount < 0 ? 0 : amount;
		var av = Math.max(this.fuel * this.FER, this.tech.reservePower);
		amount = amount < av ? amount : av;
		this.drainAmount += amount;
		return amount;
	},
	update() {
		const t = this.tech;
		this.fuel -=  (this.drainAmount / this.FER) / (50);
        this.fuel = this.fuel < 0 ? 0 : this.fuel;
		this.ship.mass += this.fuel + this.tech.mass;
		this.upgraded && (this.upgraded = false);
		this.drain = Math.max(this.drain > 0.01 ?  this.drain * 0.9 : 0, this.drainAmount / this.tech.output);
		this.drainAmount = 0;
		this.reserve = this.fuel / this.tech.fuel;
		if (lowPowerWarning) {
			lowPowerWarning--
			if(this.reserve <= 0.01) { Aoids.error = this.tech.error; lowPowerWarning = 240 }
		} else {
			if(this.reserve <= 0.02) { Aoids.error = this.tech.error; lowPowerWarning = 240 }
			else if(this.reserve < 0.2) {  Aoids.warning = this.tech.warning; lowPowerWarning = 240 }
		}
	},
};
function PowerSimple(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);

}
PowerSimple.prototype = {
	...MountSimpleCommon,
};