import "../../../src/utils/MathExtensions.js";
import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";
import {buffers} from "../buffers.js";
import {MountCommon, MountSimpleCommon} from "./MountCommon.js";
export {Gun, GunSimple};
const wV1 = new Vec2();
function Gun(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.tech.bulletType = ship.bullets.types[this.tech.bulletType];
    this.hasRecoil = false;
    this.hasBarrel = false;
    this.hasBody = false;
    this.hasFX = false;
	this.gunIn = new Vec2();
	this.gunOut = new Vec2();
	this.side = Math.sign(this.hardPoint.y);
    this.muzzelEndOffset = display && display.muzzelOffset !== undefined ? display.muzzelOffset : 0;
	this.coilCharge = 0;
	this.coilMax = this.tech.coilMax;
	this.rechargeRate = this.tech.rechargeRate;
    this.PER = this.tech.PER;
    this.lance = this.tech.lance;

    if(this.tech.hasAmo) {
        this.magMax = this.tech.magSize;
        this.magDisplayed = 0;

        this.mag = 0;
        this.fireMag = false;
        this.firePos = 0;
        this.magHardPoints = [];
        this.magBullets = [];
    }
}
Gun.prototype = {
	...MountCommon,
    deleteSelf() {
        if (this.tech.hasAmo) {
            this.magBullets.forEach(bullet => this.ship.bullets.delete(bullet));
            this.magBullets.length = 0;
            this.magHardPoints.length = 0;
        }
    },
    ready() {
        if (this.display) {
            this.hardPoint.x += this.display.muzzelOffsetX !== undefined ? this.display.muzzelOffsetX : 0;
            this.hardPoint.y += this.display.muzzelOffsetY !== undefined ? this.display.muzzelOffsetY : 0;
            this.display = undefined;
            if (this.tech.hasAmo) {
                while(this.mag < this.magMax) {
                    if (this.mag < this.tech.magVisible) {
                        this.magHardPoints.push((new Vec2()).copyOf(this.hardPoint).addScaled(this.mag, wV1.init(this.tech.magOffsetX, this.tech.magOffsetY * this.side)))
                    }
                    this.loadMag();
                }
            }
        }
    },
	//dir(a) { return -a * this.side }, // no longer used
	spritesAdd(buf, z) {
        if (this.holdDraw) { return }
		this.drawStart = buf.length * buffers.stride;
		const dis = this.display;
		const idxs = dis.sprites, hp = this.hardPoint;
		if (dis.barrelIdx !== undefined) {
            let py = -(hp.x + (dis.barrelX !== undefined ?  dis.barrelX : 0));
            let px =  (hp.y + (dis.barrelY !== undefined ? dis.barrelY * this.side : 0)) - this.side;
            buf.shader.addPart({idx: idxs[dis.barrelIdx], cx: 0.5, cy: 0.5, px, py, z: dis.barrelZoffset !== undefined ? z + dis.barrelZoffset : z}, buf.bufIdx);
            if (dis.recoil !== undefined) {
                this.recoilDist = dis.recoilFlash;
                buf.shader.spriteOffset(idxs[0], 0.5, 0.5, px, py, 1, 1, this.gunOut, z);
                buf.shader.spriteOffset(idxs[0], 0.5, 0.5, px, py + dis.recoil, 1, 1, this.gunIn, z);
                this.hasRecoil = true;
            }
            this.hasBarrel = true;
        }
		if (dis.bodyIdx !== undefined) {
            let py = -(hp.x + (dis.bodyX !== undefined ?  dis.bodyX : 0));
            let px =  (hp.y + (dis.bodyY !== undefined ? dis.bodyY * this.side : 0)) - this.side;
			buf.shader.addPart({idx: idxs[dis.bodyIdx], cx: 0.5, cy: 0.5, px, py, z}, buf.bufIdx);
			this.hasBody = true;
		}
        this.drawEnd = buf.length * buffers.stride;
        this.drawSave(buf);

	},
	spritesAddFX(buf, z) {
        if (this.holdFx) { return }

		this.fxStart = buf.length * buffers.stride;
		const dis = this.display;
        if (dis.FXSprites.length > 0) {
            this.hasFX = true;
            const idxs = dis.FXSprites;
            const hp = this.hardPoint;
            const bLen = data.spriteSheet.sprites[idxs[0]].w / 2;
            if (this.hasBody) {
                let px = hp.y + (dis.disChargeVentY !== undefined ? dis.disChargeVentY * this.side : 0);
                buf.shader.addPart({idx: idxs[1], px: px - this.side * 0.5,  py: -(hp.x + dis.dischargeVentX), cx: 0.5, cy: 0.5, color: 0xFFFFFFFF, z}, buf.bufIdx);
                px = hp.y + (dis.chargeVentY !== undefined ? dis.chargeVentY * this.side : 0);
                buf.shader.addPart({idx: idxs[0], px: px - this.side * 0.5 , py: -(hp.x + dis.chargeVentX),    cx: 0.5, cy: 0.5, color: 0xFFFFFFFF, z}, buf.bufIdx);
            }
        }
        this.fxEnd = buf.length * buffers.stride;
        this.fxSave(buf);

	},
	spritesUpdate(x, y, r) {
		var i;
        this.restoreVisible(x, y, r);
        const gunInU = this.coilCharge / this.coilMax;
		if (this.hasFX){
            const B8 = buffers.fx.UI8;
            i = this.fxStart
            B8[(i + 8) * 4 + 3] = (1-gunInU) * 255;
            i +=  buffers.stride;
			B8[(i + 8) * 4 + 3] = gunInU * 255;
        }
        if (this.hasRecoil) {
            const D = buffers.draw.data;
            i = this.drawStart;

            D[i+4] = this.gunIn.x + gunInU * (this.gunOut.x - this.gunIn.x);
            D[i+5] = this.gunIn.y + gunInU * (this.gunOut.y - this.gunIn.y);
        }
	},
    loadMag() {
        const blt = this.ship.bullets.newItem(this.tech.bulletType);
        const p = this.ship.physics;
        blt.x = p.p.x;
        blt.y = p.p.y;
        blt.visible = false;
        blt.teamIdx = this.ship.teamIdx;
        this.magBullets.push(blt);
        blt.dir = p.angle;
        blt.dx = Math.cos(blt.dir);
        blt.dy = Math.sin(blt.dir);
        blt.dx1 = p.delta.x;
        blt.dy1 = p.delta.y;
        blt.init(this.tech.coilMax, this.mag, this);
        blt.usersBullet = true;
        this.mag ++;
    },
    fire(converg, sDist, bDist) {
        const t = this.tech;
        if(t.hasAmo) {
            if(this.coilCharge >= this.coilMax ) { // used only as a timer
                if (this.mag > 0 && !this.fireMag) {
                    this.coilCharge = 0;
                    this.fireMag = true;
                    this.firePos = (this.firePos + 1) % t.magVisible;
                    return true;
                }
            }
        } else if(this.coilCharge >= this.coilMax ){
			const blt = this.ship.bullets.newItem(t.bulletType);
			const p = this.ship.physics;
			this.hardPoint.transform(p.transform, p.p, blt);
			const gunOutput = this.coilCharge / (this.lance ** 2);
			this.coilCharge = 0;
            blt.teamIdx = this.ship.teamIdx;
			blt.dir = p.angle - converg;
			blt.dx = Math.cos(blt.dir);
			blt.dy = Math.sin(blt.dir);
			blt.dist = sDist + bDist * Math.abs(blt.dx);
			blt.dx1 = p.delta.x;
			blt.dy1 = p.delta.y;
            this.hasRecoil && (blt.gun = this);
			blt.damage = t.damage;
			blt.init(gunOutput, this.lance, this);
            blt.usersBullet = true;
			return true;
		}
		return false;
	},
    getMag(forBullet) {
        const p = this.ship.physics;
        const t = p.transform;
        if (this.magDisplayed < this.tech.magVisible) {
            this.magHardPoints[this.magDisplayed].transform(t, p.p, forBullet);
            if (this.fireMag && this.firePos === this.magDisplayed) {
                forBullet.damage = this.tech.damage;
                forBullet.type.locked = false;
                forBullet.type.armed = true;
                forBullet.type.target = this.ship.targeting;
                forBullet.dx1 = p.delta.x;
                forBullet.dy1 =  p.delta.y;
                forBullet.type.hide = false;
                this.fireMag = false;
            } else {
                forBullet.type.hide = Aoids.viewScale < 0.5;
            }
            this.magDisplayed++;

        } else {
            forBullet.x = p.p.x;
            forBullet.y = p.p.y;
            forBullet.type.hide = true;
        }
        forBullet.dx = t.x;
        forBullet.dy = t.y;
        forBullet.dir = p.angle + Math.PI90;

    },
    getMuzzel(forBullet) {
        const p = this.ship.physics;
        const t = p.transform;
        this.hardPoint.transform(t, p.p, forBullet);
        forBullet.dx = t.x;
        forBullet.dy = t.y;
        forBullet.dir = p.angle + Math.PI90;
    },
    getMuzzelFlash(flashPos) {
        const p = this.ship.physics;
        const t = p.transform;
        wV1.x = this.hardPoint.x - (1 - this.coilCharge / this.coilMax) * this.recoilDist;
        wV1.y = this.hardPoint.y;
        wV1.transform(t, p.p, flashPos);
        flashPos.dir = p.angle + Math.PI90;
    },
    specialUpgrade: {
        lance(self, amount) {
            if (self.lance + amount < self.tech.lanceMax) {
                const c = (self.coilMax / self.lance) * amount;
                self.lance += amount;
                self.coilMax += c;
                self.upgradeResult = self.lance + " coil max " + self.coilMax;
                return true;
            }
            return false;
        },
        rechargeRate(self, amount) {
            if (self.rechargeRate + amount < 15) {
                self.rechargeRate += amount;
                self.upgradeResult = self.rechargeRate;
                return true;
            }
            return false;
        },
        PER(self, amount){
            self.PER -= self.PER / amount;
            self.upgradeResult = self.PER;
            return true;
        },

    },
	update() {
        if (this.tech.hasAmo) {
            this.magDisplayed = 0;
        }
		this.ship.mass += this.tech.mass;
		this.upgraded && (this.upgraded = false);
		if (this.coilCharge < this.coilMax) {
			const rate = this.coilMax / Math.max(1, 18 - this.rechargeRate);
			this.coilCharge += this.ship.power.requestPower(rate * this.PER) / this.PER;
            this.fireMag = false;
		} else {
			this.coilCharge = this.coilMax;
		}
	}
};
function GunSimple(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.tech.bulletType = ship.bullets.types[this.tech.bulletType];
    this.hasRecoil = false;
    this.hasBarrel = false;
    this.hasBody = false;
    this.hasFX = false;
	this.gunIn = new Vec2();
	this.gunOut = new Vec2();
	this.side = Math.sign(this.hardPoint.y);
    this.muzzelEndOffset = display && display.muzzelOffset !== undefined ? display.muzzelOffset : 0;
	this.coilCharge = 0;
	this.coilMax = this.tech.coilMax;
	this.rechargeRate = this.tech.rechargeRate;
    if(this.tech.hasAmo) {
        this.magMax = this.tech.magSize;
        this.magDisplayed = 0;

        this.mag = 0;
        this.fireMag = false;
        this.firePos = 0;
        this.magHardPoints = [];
        this.magBullets = [];
    }
}
GunSimple.prototype = {
	...MountSimpleCommon,
    deleteSelf: Gun.prototype.deleteSelf,
    ready: Gun.prototype.ready,
    dir: Gun.prototype.dir,
    spritesAdd: Gun.prototype.spritesAdd,
    spritesAddFX: Gun.prototype.spritesAddFX,
    spritesUpdate: Gun.prototype.spritesUpdate,
    loadMag: Gun.prototype.loadMag,
    fire: Gun.prototype.fire,
    getMag: Gun.prototype.getMag,
    getMuzzel: Gun.prototype.getMuzzel,
	update() {
        if (this.tech.hasAmo) { this.magDisplayed = 0 }
		this.ship.mass += this.tech.mass;
		if (this.coilCharge < this.coilMax) {
			const rate = this.coilMax / (18 - this.rechargeRate);
			this.coilCharge += rate;
            this.fireMag = false;
		} else {
			this.coilCharge = this.coilMax;
		}
	}
};