import "../../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {buffers} from "../buffers.jsm";

const MountCommon = {
	ready() { },
    delete() {
        this.deleteSelf && this.deleteSelf()
        this.ship = undefined;
        this.tech = undefined;
        this.display = undefined;
        this.holdDraw = undefined;
        this.holdFx = undefined;
    },
	upgradeBonus(type) {
		this.bonusCount += 1;
		if(this.tech.upgrades &&  this.tech.upgrades[this.bonusCount - 1]) {
			Object.assign(this.tech, this.tech.upgrades[this.bonusCount - 1]);
			this.upgraded = true;
			return true;
		}
	},
	upgrade(name, amount) {
        if (this.specialUpgrade && this.specialUpgrade[name]) {
            return this.specialUpgrade[name](this, amount);
        }
        this[name] += amount;
        this.upgradeResult = this[name];
        return true;
    },
	spritesAdd() {},
	spritesAddFX() { },
    restoreVisible(x,y,r) {
        var i;
        const stride = buffers.stride;

        if (this.holdDraw) {
            const len = this.holdDraw.length;
            const b = this.holdDraw;
            const bI = this.holdDrawUI32;
            i = 0;
            while (i < len) {
                b[i] = x;
                b[i + 1] = y;
                b[i + 6] = r;
                bI[i + 8] = 0xFFFFFFFF;
                i += stride;
            }
            this.drawStart = buffers.draw.length * stride;
            buffers.draw.data.set(b, this.drawStart);
            //this.drawEnd = this.drawStart + hold.length;
            buffers.draw.length += len / stride;
        }
        if (this.holdFx) {
            const len = this.holdFx.length;
            const b = this.holdFx;
            const bI = this.holdFxUI32;
            i = 0;
            while (i < len) {
                b[i] = x;
                b[i + 1] = y;
                b[i + 6] = r;
                bI[i + 8] = 0xFFFFFFFF;
                i += stride;
            }
            this.fxStart = buffers.fx.length * buffers.stride;
            if (this.fxStart < buffers.fx.data.length - b.length) {
                buffers.fx.data.set(b, this.fxStart);
            //this.fxEnd = this.fxStart + hold.length;
                buffers.fx.length += len / stride;
            }
        }
    },
    drawSave(buf) {
        if (this.drawEnd) {
            this.holdDraw = new Float32Array([...buf.data.subarray(this.drawStart, this.drawEnd)]);
            this.holdDrawUI32 = new Uint32Array(this.holdDraw.buffer);
        }
    },
    fxSave(buf) {
        if (this.fxEnd) {
            this.holdFx = new Float32Array([...buf.data.subarray(this.fxStart, this.fxEnd)]);
            this.holdFxUI32 = new Uint32Array(this.holdFx.buffer);
        }
    },

	init(ship, mount, tech, display) {
		if (display) {
			this.hardPoint = new Vec2().copyOf(mount);
            this.renderOrder = mount.z;
			this.display = display;
			this.visible = true;
			this.drawStart = 0;
			this.drawCount = 0;
			this.drawEnd = 0;
			this.fxStart = 0;
			this.fxCount = 0;
			this.fxEnd = 0;
		} else {
			this.display = undefined;
			this.hardPoint = undefined;
			this.visible = false;
		}

        this.drawEnd = 0;
        this.fxEnd = 0;
		this.tech = {...tech};
		this.ship = ship;
		this.bonusCount = 0;
		this.upgraded = true;
	},
};
const MountSimpleCommon = {
	ready() { },
    delete() {
        this.deleteSelf && this.deleteSelf()
        this.ship = undefined;
        this.tech = undefined;
        this.display = undefined;
    },
	spritesAdd() {},
	spritesAddFX() { },
	spritesAddOverlay() { },
	spritesUpdate() { },
	update() {
		this.ship.mass += this.tech.mass;
	},
	init(ship, mount, tech, display) {
		if (display) {
			this.hardPoint = new Vec2().copyOf(mount);
			this.display = display;
			this.visible = true;
			this.drawStart = 0;
			this.drawCount = 0;
			this.fxStart = 0;
			this.fxCount = 0;
		} else {
			this.display = undefined;
			this.hardPoint = undefined;
			this.visible = false;
		}
		this.tech = {...tech};
		this.ship = ship;
	},
}
export {MountCommon, MountSimpleCommon};