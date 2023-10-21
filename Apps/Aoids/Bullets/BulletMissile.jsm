import "../../../src/utils/MathExtensions.jsm";
import {colors} from "../../../src/utils/colors.jsm";
import {Vec2} from "../../../src/Vec2.jsm";
import {Aoids} from "./../Aoids.jsm";
import {data} from "./../data.jsm";
import {bulletCommon} from "./bulletCommon.jsm";
export {BulletMissile};

const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const WHITE_SPARKS_IDXS = data.spriteSheet.names.whiteSparks;
const WHITE_SPARKS_IDXS_COUNT = data.spriteSheet.names.whiteSparks.length;
const ROCKET_SMOKE_COLORS = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(255,255,0,1))
	.addStopRGBA(0.2,    colors.createRGBA(255,0,0,1))
	.addStopRGBA(0.3,    colors.createRGBA(100,100,100,1))
	.addStopRGBA(0.5,    colors.createRGBA(100,100,100,1))
	.addStopRGBA(1,    colors.createRGBA(255,255,255,1))
    .asUInt32Array(32);

var targetRadar = 0; // Used to search rock siblings for live target when current target not alive
var FXs;
function BulletMissile() {
    this.gun = undefined;
    this.powerType = undefined;
    this.locked = true; // if this is true then armed will be forced to false;
    this.armed = false;
    this.thrusting = false;
    this.fuel  = 0;
    this.mass  = 0;
    this.thrust = 0;
    this.target = undefined;
    this.targetDelay = 0;
    this.dirR = 0;
    this.dirC = 0;
    this.targetMinDist = 0;
    this.targetMaxDist = 0;
    this.scale = 1;
    this.buster = true;
    this.speed = true;
    this.useSimple = false;
    this.hide = false;
}
BulletMissile.initGlobals = function(globals) {
    FXs = globals.FXs;
}
BulletMissile.SPRITES = data.spriteSheet.names.gunMis.bullets;
BulletMissile.SMOKE = data.spriteSheet.names.gunMis.smoke;
BulletMissile.THRUST = data.spriteSheet.names.gunMis.sparks;
BulletMissile.TYPES = data.shipTech.guns.missile.powerTypes;
BulletMissile.prototype = {
    ...bulletCommon,
    selfRender: true,
    delete() {
        this.target = undefined;
        this.gun = undefined;
        this.owner = undefined;
        this.spr = undefined;
    },
    die() {
        this.owner.life = 0;
        this.target = undefined;
        this.gun = undefined;
        return false;
    },
    reset() {
        if (this.gun === undefined) { this.life = 0 }
        else {
            this.owner.lance = this.magIdx;
            this.target = undefined;
            this.init(this.gun);
            this.update();
        }
    },
    hitSomething(objHit, hitPower, orbitMassConst){
		const O = this.owner, x = O.hx, y = O.hy;
		const orbitDist = (x * x + y * y) ** 0.5;
		const orbitVel = (orbitMassConst / orbitDist) ** 0.5 / orbitDist;
        const size = (O.damage  ** (1/2))  ;
        const size1 = (O.damage  ** (1/3))  ;
        const dx = -y * orbitVel;
        const dy = x * orbitVel;
        FXs.newItem(FXs.types.shockwave).initDelta(x, y, dx, dy,  (25 + 30 * Math.random()) * size ,0xFF88AAFF);
        FXs.newItem(FXs.types.smoke).initDelta(x, y, dx, dy,  0xFFFFFFFF, 164 * size1, 0, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, (20 + Math.random() * 20) * size1);
        FXs.newItem(FXs.types.smoke).initDelta(x, y, dx, dy,  0xFFFFFFFF, 64 * size1, 0, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, (10 + Math.random() * 10) * size1);
        FXs.newItem(FXs.types.smoke, 1).initDelta(x, y, dx, dy,  0xFFFFFFFF, 34 * size, 0, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, (5 + Math.random() * 5) * size1);
        FXs.newItem(FXs.types.frags, 1).initDelta(x, y, dx, dy, ROCKET_SMOKE_COLORS[Math.random() * 10 | 0], 18 * size1, WHITE_SPARKS_IDXS, 3 + 10 * size1, 0, 6.4, 128, 0.2);
        FXs.newItem(FXs.types.frags, 1).initDelta(x, y, dx, dy, ROCKET_SMOKE_COLORS[Math.random() * 10 | 0], 6 * size1, WHITE_SPARKS_IDXS, 2 + 5 * size1, 0, 6.4, 128, 1);
        FXs.newItem(FXs.types.frags, 1).initDelta(x, y, dx, dy, ROCKET_SMOKE_COLORS[Math.random() * 10 | 0], 4 * size1, WHITE_SPARKS_IDXS, 1 + 2 * size1, 0, 6.4, 128, 2);
        O.smashedIt = false;
		O.lastContact = 0;
        O.smashedIt = false;
        this.reset();
        return objHit.damage > objHit.hp;
	},
    init(gun) {
        const O = this.owner;
        this.locked = true;
        this.thrusting = this.armed = false;
        if (!this.powerType) {
            this.gun = gun;
            this.powerType = BulletMissile.TYPES[(O.power / 200) | 0];
            this.mass = this.powerType.mass;
            this.thrust = this.powerType.thrust;
            O.spr = SPRITES[BulletMissile.SPRITES[this.powerType.spriteIdxs[0]]];
            O.muzzelFlash = 0;
            O.visible = false;
            this.magIdx = O.lance;
        }
        this.fuel = this.powerType.fuel;
        this.thrustOutput = 0;
        O.dist = O.life = 1600000;
        O.powerC = 0;
        O.powerR = 70;
        O.dist = 1000000;
        this.useSimple = false;
        this.scale = 1;

    },
    update() {
        const O = this.owner;
        var tMass = 0;
        if (!this.locked) {
            if (this.target) {
                if (!this.target.alive || (this.target.changed > 0 && this.target.countDown > 0)) {
                     if (this.gun.ship && this.gun.ship.target && this.gun.ship.target !== this.target) {
                        this.target = this.gun.ship.target;
                    } else if (this.target.otherHalf && this.target.otherHalf.countDown === 0 && this.target.otherHalf.alive) {
                        this.target = this.target.otherHalf;
                    } else if (this.target.parent && this.target.parent.countDown === 0 && this.target.parent.alive) {
                        this.target = this.target.parent;
                    } else {
                        this.target = undefined;
                    }
                    if  (this.target) {
                        this.targetMaxDist = this.targetMinDist = ((this.target.x - O.x) ** 2 + (this.target.y - O.y) ** 2) ** 0.5;
                    }
                }
            } else if (this.gun.ship && this.gun.ship.target) {
                this.target = this.gun.ship.target;
                this.targetMaxDist = this.targetMinDist = ((this.target.x - O.x) ** 2 + (this.target.y - O.y) ** 2) ** 0.5;
            }
        }

        if (this.locked || !this.armed) {
            this.armed = false;
            this.gun.getMag(O);
            O.startPos.x = O.p1.x = O.x;
            O.startPos.y = O.p1.y = O.y;
            if (!this.locked && this.armed) { this.update() }
        } else if (O.life === 1) {
            this.reset()
        }else{
            O.dir += O.dr;
            var dx, dy;
            if (this.fuel > 0) {
                if (!this.thrusting) {
                    this.thrusting = true;
                    this.scale = 4;
                    if (this.target) {
                        this.dirC = 0;
                        this.dirR = O.dir - Math.PI90 ;
                        this.targetDelay = 12;
                        this.targetMaxDist = this.targetMinDist = ((this.target.x - O.x) ** 2 + (this.target.y - O.y) ** 2) ** 0.5;
                    }
                    O.lance = 1;
                    O.dr = 0;
                    O.dx = O.dx1;
                    O.dy = O.dy1;
                    O.life = this.fuel + 100;
                    this.thrustOutput = 0;
                }
                this.fuel -= 1;
                const unitFuel = this.fuel / this.powerType.fuel;
                this.thrustOutput = this.thrustOutput < 0.8 ? this.thrustOutput + (Math.random() ** 2) * 0.2 : 1;
                tMass = (this.thrust * this.thrustOutput) / (this.mass + this.fuel);
                let homing = false;
                if (this.target) {

                    if (this.targetDelay) { this.targetDelay-- }
                    else {
                        const dirTo = Vec2.angleBetween(O.p2.x, O.p2.y, this.target.x - O.x, this.target.y  - O.y) * 4;
                        const dist =  Vec2.distanceSqrB ** 0.5;
                        if (dist < this.targetMinDist || dist > this.targetMaxDist / 4) {
                            if (dist > this.targetMaxDist) { this.targetMaxDist = dist }
                            this.targetMinDist = dist;
                            const u = Math.min(1,dist / this.targetMaxDist) ** (0.5 + this.magIdx / 10 + 1 - unitFuel);
                            const u1 = 1- u;
                            this.dirR += (this.dirC = (this.dirC += ((O.dir-Math.PI90) + dirTo - this.dirR) * u1 * 0.1) * u1 * 0.9);
                            O.dir = this.dirR+Math.PI90;
                            homing = true;
                            dx = Math.sin(O.dir);
                            dy = -Math.cos(O.dir);
                            O.dx += dx * tMass;
                            O.dy += dy * tMass;
                            const uu = u * 0.95 + 0.05, uu1 = 1 - uu;
                            const speed = (O.dx * O.dx + O.dy * O.dy) ** 0.5;
                            O.dx = uu1 * speed * dx + uu * O.dx;
                            O.dy = uu1 * speed * dy + uu * O.dy;
                        } else { this.target = undefined }
                    }

                }
                if (!homing) {
                    dx = Math.sin(O.dir);
                    dy = -Math.cos(O.dir);
                    O.dx += dx * tMass;
                    O.dy += dy * tMass;
                }
            } else {
                this.thrusting = false;
                dx = Math.sin(O.dir);
                dy = -Math.cos(O.dir);
            }
            O.p1.x = O.x += O.dx;
            O.p1.y = O.y += O.dy;
            const speed = (O.dx * O.dx + O.dy * O.dy) ** 0.5;
            const len = Math.max(O.spr.h * 4, speed);
            O.p2.x = dx * len;
            O.p2.y = dy * len;
            if (this.thrusting) {
                if(!this.useSimple) {
                    var tMass1 = tMass * (28* Math.random() + 28);
                    var dust = Math.random();
                    FXs.newItem(FXs.types.smoke).initDelta( O.x - O.dx * dust, O.y - O.dy * dust, O.dx - dx * tMass1, O.dy - dy * tMass1, 0xFFFFFFFF, 15 * Math.random()+ 15, O.dir + Math.PI90, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, 50 * Math.random()+ 20, 1);
                    tMass1 = tMass * (14* Math.random() + 14);
                    dust = Math.random();
                    FXs.newItem(FXs.types.smoke).initDelta(O.x - O.dx * dust, O.y - O.dy * dust, O.dx  - dx * tMass1, O.dy  - dy * tMass1, 0xFFFFFFFF, 10 * Math.random()+ 10, O.dir + Math.PI90, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, 20 * Math.random()+ 10, 1);
                    tMass1 = tMass * (8* Math.random() + 8);
                    dust = Math.random();
                    FXs.newItem(FXs.types.smoke,1).initDelta(O.x - O.dx * dust, O.y - O.dy * dust, O.dx  - dx * tMass1, O.dy  - dy * tMass1, 0xFFFFFFFF, 5 * Math.random()+ 5, O.dir + Math.PI90, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, 10 * Math.random()+ 10, 1);
                } else {
                    var tMass1 = tMass * (28* Math.random() + 28);
                    var dust = Math.random();
                    FXs.newItem(FXs.types.smoke).initDelta( O.x - O.dx * dust, O.y - O.dy * dust, O.dx - dx * tMass1, O.dy - dy * tMass1, 0xFFFFFFFF, 15 * Math.random()+ 15, O.dir + Math.PI90, ROCKET_SMOKE_COLORS, BulletMissile.SMOKE, 20 * Math.random()+ 10, 1);
                }
            }
        }
    },
    updateSprites (i, stride, buf, bF, bI) {
        if (!this.hide) {
            const type = this.powerType;
            const O = this.owner;
            const sc = this.scale;
            bF[i    ] = O.p1.x;
            bF[i + 1] = O.p1.y;
            bF[i + 2] = sc;
            bF[i + 3] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = 1;
            bF[i + 6] = O.dir;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = O.spr.idx | BIT_DEFAULT_Z_INDEX;
            i += stride;
            buf.length += 1;
        }
        return i;
    },
    updateFXSprites (i, stride, buf, bF, bI) {
        if (!this.hide) {
            if (this.thrusting) {
                const sc = this.scale;
                const pt = this.powerType;
                const sprIdx = BulletMissile.THRUST[pt.spriteIdxs[1]] | BIT_DEFAULT_Z_INDEX;
                const O = this.owner;
                bF[i    ] = O.p1.x;
                bF[i + 1] = O.p1.y;
                bF[i + 2] = sc;
                bF[i + 3] = sc * Math.random() + 8;
                bF[i + 4] = 0.5;
                bF[i + 5] = 0;
                bF[i + 6] = O.dir;
                bI[i + 8] = 0xFFFFFFFF;
                bI[i + 9] = sprIdx;
                i += stride;
                bF[i    ] = O.p1.x;
                bF[i + 1] = O.p1.y;
                bF[i + 2] = sc + Math.random() * 1;
                bF[i + 3] = sc * 1.7 * Math.random() + 5;
                bF[i + 4] = 0.5;
                bF[i + 5] = 0;
                bF[i + 6] = O.dir;
                bI[i + 8] = 0xFFFFFFFF;
                bI[i + 9] = sprIdx;
                i += stride;
                bF[i    ] = O.p1.x;
                bF[i + 1] = O.p1.y;
                bF[i + 2] = sc + Math.random() * 2;
                bF[i + 3] = sc * 2 * Math.random() + 5;
                bF[i + 4] = 0.5;
                bF[i + 5] = 0;
                bF[i + 6] = O.dir;
                bI[i + 8] = 0xFFFFFFFF;
                bI[i + 9] = sprIdx;
                i += stride;
                buf.length += 3;
            }
        }
        return i;
    },
};