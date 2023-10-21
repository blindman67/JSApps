import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";
import {habitatCommon} from "./habitatCommon.js";
export {MissileLauncher};
const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
var bullets;
var ANIM_LEN = 120;
function Key(time, value) {
    this.time = time;
    this.value = value;
}
function key(time, value) { return new Key(time, value) };
function keyValue(scale, value) { return scale * value }
function keys(scale, leadIn, ...frames) {
    var time = 0, fIdx = 0;
    const keys = [];
    while (keys.length < ANIM_LEN) {
        keys.push(leadIn * scale);
    }
    if(frames.length === 0) { return keys }
    var keyB = frames.pop();
    time = keyB.time | 0;
    while (time < ANIM_LEN) {
        keys[time++] = keyB.value  * scale;
    }
    var keyA = frames.pop();
    while (keyA) {
        time = keyA.time | 0;
        if (keyA.time < keyB.time) {
            while (time < keyB.time) {
                const f = (time - keyA.time) / (keyB.time - keyA.time);
                keys[time++] = ((keyB.value - keyA.value) * f + keyA.value)  * scale;
            }
        }
        keyB = keyA;
        if (frames.length === 0) { break }
        keyA = frames.pop();
    }
    return keys;
}
  // parts: [224, 225, 226, 227, 228, 221], // silo cover, swingArm, missile clasper, upper piston, lower piston, foreground habitat
var anim, missileAnim, timeCenter, timeEnd;
function createAnimation(scale, desc) {
    const SCALE = scale;
    const Grab = 30;
    const TopA = 52;
    const Top = 56;
    const UP_TIME = 20;
    const PAUSE = 15;
    const S = 10;
    const SU = S + UP_TIME;     // move up
    const S1 = SU + PAUSE;      // pause
    const DW = S1 + UP_TIME;    // down to grab
    const D  = DW + PAUSE;      // pause
    const C1 = D + UP_TIME;     // grab missile and moved up
    const C1A = C1 +   PAUSE;   // center
    const C2 = C1A + 1;         // center
    const EL = C2 + UP_TIME;    // start return
    const EA = EL + UP_TIME;    // pack swing arm
    const EB = EA + UP_TIME;    // retract
    const ED = EB + 10;         // start doors
    const E = ED + 10;          // Close doors end
    const maxTime = ANIM_LEN = E;
    const zero = keys(SCALE, 0);
    const ROT = keys(1,Math.PI90,
        key(SU, Math.PI90),
        key(S1, 0),
        key(EL, 0),
        key(EA, Math.PI90));
    const MIS_Y = keys(SCALE, 3,
        key(S, 3),
        key(DW, 39),
        key(D , 39),
        key(C1, 39+(Top-Grab)),
        key(C1A, 39+(Top-Grab)),
        key(C2, Top));
    const MIS_SHOW =  keys(1,0, key(S,1), key(C2,1), key(C2+1,0));
    anim = [{
            idx: 0, // silo cover
            maxTime,
            keys: {
                x: zero,
                r: zero,
                y: keys(SCALE, 29,
                    key(0, 25),
                    key(S, 19),
                    key(C1, 19),
                    key(C1A, 25),
                ),
            }
        },{
            idx: 1, // swingArm
            maxTime,
            aim: true,
            cx: 0.5,
            cy: 0.5,
            keys: {
                x: zero,
                y: keys(SCALE, 0,
                    key(S, 0),
                    key(SU, TopA),
                    key(S1, TopA),
                    key(DW, Grab),
                    key(D , Grab),
                    key(C1, Top),
                    key(C1A, Top),
                    key(C2, Top),
                    key(EA, Top),
                    key(ED, 0),
                    key(E, 0),
                ),
                r: ROT,
            }
        },{
            idx: 6, // missile
            aim: true,
            cx: keyValue(1, (11 - 16.5) / 11),
            cy: keyValue(1, 30 / 43),
            maxTime: C2,
            fireA: true,
            keys: {
                x: keys(SCALE, 11, key(C2, 0)),
                y: MIS_Y,
                r: zero,
                //show: MIS_SHOW,
            }
        },{
            idx: 6, // missile
            aim: true,
            fireB: true,
            cx: keyValue(1, 16.5 / 11),
            cy: keyValue(1, 30 / 43),
            maxTime: C2,
            keys: {
                x: keys(SCALE, -11, key(C2, 0)),
                y: MIS_Y,
                r: zero,
                //show: MIS_SHOW,
            }
        },{
            idx: 2, // missile clasper
            maxTime,
            aim: true,
            cx: 0.5,
            cy: 0.5,
            keys: {
                x: zero,
                y: keys(SCALE, 0,
                    key(S,  0),
                    key(SU, TopA),
                    key(S1, TopA),
                    key(DW, Grab),
                    key(D , Grab),
                    key(C1, Top),
                    key(C1A, Top),
                    key(C2, Top),
                    key(EA, Top),
                    key(ED, 0),
                    key(E,  0),
                ),
                r: ROT,
            }
        },{
            idx: 3, // upper piston
            maxTime,
            keys: {
                x: zero,
                r: zero,
                y: keys(SCALE, -8,
                    key(S, -8),
                    key(SU, TopA - 7),
                    key(S1, TopA - 7),
                    key(DW, 23),
                    key(D , 23),
                    key(C1, 23 + (Top-Grab)),
                    key(C1A, 23 + (Top-Grab)),
                    key(C2, 23 + (Top-Grab)),
                    key(EA, 23 + (Top-Grab)),
                    key(ED, -8),
                    key(E, -8),
                ),
            }
        },{
            idx: 4, // lower piston
            maxTime,
            keys: {
                x: zero,
                r: zero,
                y: keys(SCALE, -13,
                    key(S, -13),
                    key(SU, 30),
                    key(S1, 30),
                    key(DW, 18),
                    key(D , 18),
                    key(C1, 18 + (Top-Grab)/2),
                    key(C1A, 18 + (Top-Grab)/2),
                    key(C2, 18 + (Top-Grab)/2),
                    key(EA, 18 + (Top-Grab)/2),
                    key(ED, -13),
                    key(E, -13),
                ),
            }
        }
    ];
    missileAnim = [{
            cx: keyValue(SCALE, (0.5 - (11 - 16.5) / 11) * 11),
            cy: keyValue(SCALE, (1 - 30 / 43) * 43),
            idx: 6,
            missile: 0,
            x: keyValue(SCALE, 0),
            y: keyValue(SCALE, Top),
        },{
            cx: keyValue(SCALE, (0.5 - 16.5 / 11) * 11),
            cy: keyValue(SCALE, (1 - 30 / 43) * 43),
            idx: 6,
            missile: 2,
            x: keyValue(SCALE, 0),
            y: keyValue(SCALE, Top),
        },
    ];
    timeCenter = C2;
    timeEnd = E - 1;
}
function MissileLauncher(owner, desc) {
    if (typeof desc.parts === "string") {
        desc.parts = data.spriteSheet.names[desc.parts];
        createAnimation(4, desc);
    }
    bullets = Aoids.bullets;
    this.owner = owner;
    this.desc = desc;
    this.fireCost = {...desc.fireCost};

    this.target = undefined;
    this.readyToFire = false;
    this.countDown = 0;
    this.fire = false;
    this.fireA = false;
    this.fireB = false;
    this.aimAngle = 0;
    this.aimAngleR = 0;
    this.aimAngleC = 0;
    this.targetHold = 0;
    this.time = 0;
    this.missleA = this.loadMag(0);
    this.missleB = this.loadMag(1);
    this.returnMissile = false;
    this.left = Math.asin(-desc.angleRange);
    this.right = Math.asin(desc.angleRange);
    this.initPersonal();
    this.initPower();
    this.shutDown = false;

    owner.selfRender = true;
}
MissileLauncher.prototype = {
    delete() {
        this.kill();
        bullets = undefined;
    },
    ...habitatCommon.status,
    ...habitatCommon.power,
    ...habitatCommon.personalManager,
    ...habitatCommon.fireArc,
    ...habitatCommon.debug,
    kill() {
        this.deaths();
        this.base.remove(this.owner.rock);
        const o = this.owner;  // attachment object
        const r = o.rock;      // rock object
        o.selfRender = false;
        o.rocks = undefined;
        o.behaviour = undefined;
        this.target = undefined;
        this.owner = undefined;
        this.desc =undefined;
        this.missleA.die();
        this.missleB.die();
        this.missleA = undefined;
        this.missleB = undefined;
        return;
    },
    loadMag(idx) {
        const blt = bullets.newItem(bullets.types.Missile);
        blt.teamIdx = this.owner.rock.teamIdx;
        blt.init(this.desc.misslePower, idx, this);
        blt.usersBullet = false;
        return blt;
    },
    getMag(missle) {
        if (this.time < timeCenter) {
            if (!missle.type.armed) { missle.type.hide = true }
            return;
        }
        if (missle.type.locked && this.fire) {
            missle.type.hide = true;
            return;
        }
        if (this.fire && ((this.fireA && missle.lance === 0) || (this.fireB && missle.lance === 1))) {
            const o = this.owner;
            const r = o.rock;
            const d = this.desc;
            const x = r.x, y = r.y;
            const xAx = o.xAy, xAy = -o.xAx;
            const anim = missileAnim[missle.lance];
            const t = this.time | 0;
            missle.type.hide = false;
            const a = r.r + this.aimAngleR
            const xA = Math.cos(a), yA = Math.sin(a);
            missle.x = x + anim.x * xAx - anim.y * xAy + anim.cx * xA - anim.cy * yA;
            missle.y = y + anim.x * xAy + anim.y * xAx + anim.cx * yA + anim.cy * xA;
            missle.type.useSimple = true;
            missle.dx = missle.dy = 0;
            missle.type.scale = r.scale;
            missle.dir = r.r + this.aimAngleR;
            missle.type.armed = true;
            missle.type.target = this.target;
            missle.damage = this.desc.damage;
            missle.dx1 = -missle.y * r.dr;
            missle.dy1 =  missle.x * r.dr;
        } else {
            if (!missle.type.armed) {
                missle.type.hide = true;
            }
        }
    },
    findTarget() {
        if (!this.range ) {
            this.range = this.desc.range ? this.desc.range : this.base.radarRange;
        }
        if (!this.target || !this.target.alive) {
            const d = this.desc;
            const o = this.owner;  // attachment object
            const r = o.rock;      // rock object
            this.target = undefined;
            let i = d.scanCount;
            while (i--) {
                const rock = this.base.radarTrack;
                if (rock && rock.alive) {
                    const dx = rock.x - r.x;
                    const dy = rock.y - r.y;
                    const dist = (dx * dx + dy * dy) ** 0.5;
                    if (dist < this.range) {
                        const nx = dx / dist;
                        const ny = dy / dist;
                        if (o.xAx * nx + o.xAy * ny > 0) {
                            const cross = o.xAx * ny - o.xAy * nx;
                            if (cross >= this.left && cross <= this.right) {
                                if (this.base.metalExchange(this.fireCost, -1) === this.fireCost.amount) {

                                    this.target = rock;
                                    this.missleA.type.target = this.target;
                                    this.missleB.type.target = this.target;
                                    this.targetHold = 30 + Math.random() * 30 | 0;
                                    this.aimAngleC = 0;
                                    this.aimAngle = this.aimAngleR = 0;
                                    return true;
                                }
                                return false;
                            }
                        }
                    }
                }
            }
            return false;
        }
        return true;
    },
    aim() {
        const d = this.desc;
        const o = this.owner;  // attachment object
        const r = o.rock;
        this.readyToFire = false;
        var rock = this.target;
        if(rock !== undefined) {
            if (rock.alive) {
                let dx = rock.x - r.x;
                let dy = rock.y - r.y;
                let dist = (dx * dx + dy * dy) ** 0.5;
                if (dist < this.range) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const cross = o.xAx * ny - o.xAy * nx;
                    const dot = o.xAx * nx + o.xAy * ny
                    if (dot > 0 && cross >= this.left && cross <= this.right) {
                        this.aimAngle =  Math.asin(cross);
                        if(this.contDown > 0) {
                            this.contDown --;
                        } else {
                            this.readyToFire = true;
                        }
                        if (this.time === timeCenter && this.returnMissile) {
                            this.returnMissile = false;
                        }
                    } else { rock = undefined }
                } else { rock = undefined }
            } else {
                if (this.missleA.target !== undefined)  {
                    rock = this.missleB.target = this.target = this.missleA.target;
                } else if (this.missleB.target !== undefined) {
                    rock = this.missleA.target = this.target = this.missleB.target;
                } else {
                    this.target = rock = undefined;
                }
            }
            if (rock === undefined) {
                if (this.target === undefined) {
                    this.returnMissile = true;
                } else if (this.targetHold > 0) {
                    this.targetHold --;
                    if (this.targetHold <= 0) {
                        this.returnMissile = true;
                        this.target = undefined;
                    }
                }
            }
        }
    },
    update() {
        var i;
        const o = this.owner;  // attachment object
        const r = o.rock;      // rock object
        if (r.size > 0) { // gun is dead. Remove this object and cleanup
            this.kill()
            return;
        }
        this.shutDown = this.base.radarTracks === 0;
        this.checkWorkTime();
        this.getWorkers();
        this.powerSupply();
        if (this.time === 0) {
            if (this.returnMissile) { this.base.metalExchange(this.fireCost) }
            this.returnMissile = false;
            if (this.missleA.type.armed || this.missleB.type.armed) {
            } else  if (this.findTarget()) {

                this.time += 1;
                this.contDown = 30 + Math.random() * 30 | 0;

            }
        } else if (this.clock <= this.personal) {

            if (this.time < timeCenter) {
                this.time += this.returnMissile ? -1 : 1;
            } else if (this.time === timeCenter) {
                if (this.returnMissile) {
                    this.aimAngle = 0;
                    if(Math.abs(this.aimAngleR) < 0.02) {
                        this.aimAngleR = 0;
                        this.aimAngleC = 0;
                        this.time -= 1;
                    }
                } else if(this.fire) {
                    if (!(this.fireA && this.fireB)) {
                        if (this.fireA) {
                            Math.random() < 0.01 * this.productivity && (this.fireB = true);
                        } else if(this.fireB) {
                            Math.random() < 0.01 * this.productivity && (this.fireA = true);
                        } else {
                            Math.random() < 0.2 * this.productivity && (this.fireA = true);
                            Math.random() < 0.2 * this.productivity && (this.fireB = true);
                        }
                    } else {
                        this.aimAngle = 0;
                        this.aimAngleR += (this.aimAngleC = (this.aimAngleC += (this.aimAngle - this.aimAngleR) * 0.2) * 0.2);
                        if(Math.abs(this.aimAngleR) < 0.02) {
                            this.aimAngleR = 0;
                            this.aimAngleC = 0;
                            this.time += 1;
                        }
                    }
                } else {
                    this.aim();
                    if(this.readyToFire && Math.abs(this.aimAngleC) < this.desc.onTarget) {
                        this.fire = true;//this.fireA = this.fireB = true;
                        this.missleA.type.locked = false;
                        this.missleB.type.locked = false;
                    }
                }
                this.aimAngleR += (this.aimAngleC = (this.aimAngleC += (this.aimAngle - this.aimAngleR) * 0.2) * 0.2);
            } else if (this.time < timeEnd) {
                this.fire = false;
                this.time += 1;
            } else {
                this.fire = this.fireA = this.fireB = false;
                this.target = undefined;
                this.time = 0;
            }
        }
    },
	updateSprite(buf, bF, bI, stride, i) {
        const o = this.owner;
        const r = o.rock;
        const d = this.desc;
        const p = this.desc.parts;
        const sc = r.scale;
        const x = r.x, y = r.y;
        const xAx = o.xAy, xAy = -o.xAx;
        const t = this.time | 0;
        for (const part of anim) {
            if ((this.fireA && part.fireA) ||  (this.fireB && part.fireB ) ) { continue }
            const keys = part.keys;
            const xx = keys.x[t], yy = keys.y[t];
            if (!keys.show || keys.show[t] > 0) {
                bF[i    ] = x + xx * xAx - yy * xAy;
                bF[i + 1] = y + xx * xAy + yy * xAx;
                bF[i + 3] = bF[i + 2] = sc;
                if (part.aim && t === timeCenter) {
                    bF[i + 4] = part.cx;
                    bF[i + 5] = part.cy;
                    bF[i + 6] = r.r + this.aimAngleR;
                } else {
                    bF[i + 4] = 0.5;
                    bF[i + 5] = 0.5;
                    bF[i + 6] = r.r + keys.r[t];
                }
                bI[i + 8] = 0xFFFFFFFF;
                bI[i + 9] = p[part.idx] | BIT_DEFAULT_Z_INDEX;
                i += stride;
                buf.length += 1;
            }
        }
        bF[i    ] = x;
        bF[i + 1] = y;
        bF[i + 3] = bF[i + 2] = sc;
        bF[i + 4] = 0.5;
        bF[i + 5] = 0.5;
        bF[i + 6] = r.r;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[5] | BIT_DEFAULT_Z_INDEX;
        i += stride;
        buf.length += 1;
        //}
		return i;
	},
}