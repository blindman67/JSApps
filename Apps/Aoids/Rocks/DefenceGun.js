import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";
import {habitatCommon} from "./habitatCommon.js";
export {DefenceGun};

const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const RANGE_TABLE_SIZE = 128;
const MAX_SHOOTS_PER_GUN = 8;
const MAX_SHOOTS_PER_GUN_ARRAY_SIZE = MAX_SHOOTS_PER_GUN * 2;
const rangeTable = Object.assign([], {
    minRange: 300,
    outerRange: 300,
    range: 400,
    timer: 0,
    leadTimer() {
        this.timer += 0.2;
        return this.timer;
    },
    maxRange(r) {
        var i = RANGE_TABLE_SIZE;
        while(i --) {
            this.push({
                count: 0,
                lead: 0,
                leadTotal: 0,
                minLead: Infinity,
                maxLead: 0,
                leadRange: 0,
                subRange: 0.5,
            });
        }
        this.range = r - this.minRange;
        this.outerRange = r;
    },
    getLeadFor(range) {
        if (range < this.minRange || range >= this.outerRange) { return undefined }
        const r = ((range - this.minRange) / this.range) * (RANGE_TABLE_SIZE-1);
        const o = r % 1;
        const l = this[r | 0];
        if (l.count > 5) {
            l.subRange = o;
            return l;
        }

        return undefined;
    },
    addRange(range, lead) {
        const r = ((range - this.minRange) / this.range) * (RANGE_TABLE_SIZE-1) | 0;
        const l = this[r];
        if (l) {
            l.count ++;
            l.leadTotal += lead;
            l.lead = l.leadTotal / l.count;
            l.minLead = lead < l.minLead ? lead : l.minLead;
            l.maxLead = lead > l.maxLead ? lead : l.maxLead;
            if (l.count > 5) {
                l.minLead =  l.lead + (l.minLead - l.lead) * 0.8;
                l.maxLead =  l.lead + (l.maxLead - l.lead) * 0.8;
            }
            l.leadRange = l.maxLead - l.minLead;
        }
    }

});
var bullets;
function DefenceGun(owner, desc) {


    if (typeof desc.parts === "string") {
        desc.parts = data.spriteSheet.names[desc.parts];


    }
    bullets = Aoids.bullets;
    this.gunType = bullets.types[desc.gunType];
    this.owner = owner;
    this.desc = desc;
    this.fireCost = {...desc.fireCost};
    this.target = undefined;
    this.initPersonal();
    this.initPower();
    this.aimAngle = 0;
    this.aimAngleR = 0;
    this.aimAngleC = 0;
    this.left = Math.asin(-desc.angleRange);
    this.right = Math.asin(desc.angleRange);
    this.gunCharge = 0
    this.targetHold = 0;
    this.gunOut = 0;
    this.fireControlLeadTimer = rangeTable.leadTimer();
    this.fireControlLead = 0;
    this.fireControlRange = 0;
    this.recoil = 0;
    this.rechage = desc.coilRecharge;
    this.power = desc.gunPower;
    this.lance = desc.lance;
    this.rangingId = 0;
    this.ranging = new Array(MAX_SHOOTS_PER_GUN_ARRAY_SIZE);
    this.ranging.fill(0);
    this.needWorkers = false;
    this.shutDown = false;
    owner.selfRender = true;
}
DefenceGun.prototype = {
    delete() {
        this.owner = undefined;
        this.target = undefined;
        //bullets = undefined;
    },
    ...habitatCommon.status,
    ...habitatCommon.personalManager,
    ...habitatCommon.power,
    ...habitatCommon.fireArc,
    ...habitatCommon.debug,
    kill() {
        this.deaths();
        this.base.remove(this.owner.rock);
        this.owner.selfRender = false;
        this.owner.rocks = undefined;
        this.owner.behaviour = undefined;
        this.target = undefined;
        this.owner = undefined;
        this.desc =undefined;
    },
    findTarget() {
        const o = this.owner;  // attachment object
        const r = o.rock;      // rock object
        const d = this.desc;
        if (!this.range ) {
            this.range = this.desc.range ? this.desc.range : this.base.radarRange;
            rangeTable.maxRange(this.range);
        }

        if (this.gunOut === 0 && (!this.target || !this.target.alive)) {
            if (this.target && !this.target.alive && this.target.otherHalf && this.target.otherHalf.alive) {
                this.target = this.target.otherHalf;
            } else {
                this.target = undefined;
                if (this.targetHold > 0) {
                    this.targetHold--;
                    this.aimAngleR += (this.aimAngleC = (this.aimAngleC += (this.aimAngle - this.aimAngleR) * 0.1) * 0.3);
                    return;
                } else {
                    this.targetHold = 0;
                    let rockSize = 0;
                    let i = d.scanCount;
                    while (i--) {
                        const rock = this.base.radarTrack;
                        if (rock && rock.size <= rockSize && rock.alive) {
                            const dx = rock.x - r.x;
                            const dy = rock.y - r.y;
                            const dist = (dx * dx + dy * dy) ** 0.5;
                            if (dist < this.range && dist > rangeTable.minRange) {
                                const nx = dx / dist;
                                const ny = dy / dist;
                                if (o.xAx * nx + o.xAy * ny > 0) {
                                    const cross = o.xAx * ny - o.xAy * nx;
                                    if (cross >= this.left && cross <= this.right) {
                                        this.target = rock;
                                        this.targetHold = 15 + Math.random() * 5 | 0;
                                        this.aimAngleC = 0;
                                        this.aimAngle = this.aimAngleR = r.r + Math.asin(cross)
                                        break;
                                    }
                                }
                            }
                        }
                        rockSize ++;
                    }
                }
            }
        }
    },
    fire(range, lead) {
        const r = this.owner.rock;
        this.gunCharge = 0;
        this.recoil = 1;
        const blt = bullets.newItem(this.gunType);
        const xAx = blt.dx = Math.cos(this.aimAngleR - Math.PI90);
        const xAy = blt.dy = Math.sin(this.aimAngleR - Math.PI90);
        blt.x = r.x + xAx * 240;
        blt.y = r.y + xAy * 240;
        blt.teamIdx = r.teamIdx;
        const gunOutput = 80;
        blt.dir = this.aimAngleR - Math.PI90;
        blt.dist = this.range * 3;
        blt.damage = this.desc.damage;
        blt.dx1 = r.dx;
        blt.dy1 = r.dy;
        blt.init(this.power , this.lance, this);
        const rangeId = (this.rangingId % MAX_SHOOTS_PER_GUN) * 2;
        this.rangingId += 1;
        blt.id = rangeId;
        this.ranging[rangeId] = range;
        this.ranging[rangeId + 1] = lead;
        this.fireControlLeadTimer += 0.25;
    },
    update() {
        var currentLead = 0, currentRange = 0;
        const d = this.desc;
        const o = this.owner;  // attachment object
        const r = o.rock;      // rock object
        if (r.size > 0) { // gun is dead. Remove this object and cleanup
            this.kill();
            return;
        }
        this.shutDown = this.base.radarTracks === 0;
        this.checkWorkTime();
        this.getWorkers();
        this.powerSupply();

        if (this.recoil === 0) {

            this.findTarget();
            let rock = this.target;
            let angleRange = 0.5;
            let aimA = 0.1, aimD = 0.3;
            if(rock !== undefined) {
                if (rock.alive) {
                    let dx = rock.x - r.x;
                    let dy = rock.y - r.y;
                    let dist = (dx * dx + dy * dy) ** 0.5;
                    if (dist < this.range && dist > rangeTable.minRange) {
                        const tLead = rangeTable.getLeadFor(dist);
                        if (!tLead) {
                            const leading = Math.sin(this.fireControlLeadTimer) * 3 + 3.4;
                            const lead = (dist / this.range) * (leading);
                            currentLead = this.power * ((2 + lead) / 6);
                        } else {
                            currentLead = tLead.minLead + tLead.subRange * tLead.leadRange;
                            angleRange = (tLead.leadRange * 2 / dist) * 2;
                            aimA = 0.4;
                            aimD = 0.5;
                        }
                        dx = (rock.x + rock.dx * (dist / currentLead)) - r.x;
                        dy = (rock.y + rock.dy * (dist / currentLead)) - r.y;
                        dist = (dx * dx + dy * dy) ** 0.5;
                        currentRange = dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const cross = o.xAx * ny - o.xAy * nx;
                        const dot = o.xAx * nx + o.xAy * ny
                        if (dot > 0 && cross >= this.left && cross <= this.right) {
                            this.aimAngle = r.r + Math.asin(cross);
                        } else { rock = undefined }
                    } else { rock = undefined }
                } else { rock = undefined }
                if (rock === undefined) {
                    this.target = undefined;
                    this.targetHold = 0;
                }


            }
            if ( this.gunCharge < this.rechage) {
                this.gunCharge += (1 + Math.random()) * this.productivity;
            }
            if (rock === undefined) {
                this.target = undefined;
                this.aimAngle = r.r;
                const out = 0.01 * this.productivity + 0.01;
                this.gunOut = this.gunOut > out ? this.gunOut - out : 0;
            }
            this.aimAngleR += (this.aimAngleC = (this.aimAngleC += (this.aimAngle - this.aimAngleR) * aimA) * aimD);
            let aDist = Math.abs(this.aimAngle - this.aimAngleR);
            if (this.target) {
                const out = 0.01 * this.productivity + 0.001;
                this.gunOut = this.gunOut  < 1 - out ? this.gunOut + out : 1;
                if (this.gunOut === 1 && aDist < angleRange && this.gunCharge >= this.rechage) {
                    if (this.base.metalExchange(this.fireCost, -1) === this.fireCost.amount) {

                        this.fire(currentRange, currentLead);
                    }
                }
            }
        } else {
            this.recoil = this.recoil > 0.1 ? this.recoil - 0.1 : 0;
        }

    },
    hitCallback(bullet, hitObj) { // this is called when bullet hits something
        if (this.target && this.target === hitObj) {
            if (bullet.id < MAX_SHOOTS_PER_GUN_ARRAY_SIZE && this.ranging[bullet.id] > 0) {
                rangeTable.addRange(this.ranging[bullet.id], this.ranging[bullet.id + 1])
                this.ranging[bullet.id] = 0;
            }
        }
    },

	updateSprite(buf, bF, bI, stride, i) {
		const t = this;
        const o = this.owner;
        const r = o.rock;
        const p = t.desc.parts;
        const sc = r.scale;
        const x = r.x, y = r.y;
        const A = this.aimAngleR;

        bF[i    ] = x;
        bF[i + 1] = y;
        bF[i + 3] = bF[i + 2] = sc;
        bF[i + 4] = 0.5;
        bF[i + 5] = 1.85;
        bF[i + 6] = r.r;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[0] | BIT_DEFAULT_Z_INDEX;
        i += stride;
        buf.length += 1;

        if (this.gunOut <= 0.6) {

            bF[i    ] = x;
            bF[i + 1] = y;
            bF[i + 3] = bF[i + 2] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = 1.9 * (1 - this.gunOut /  0.6) ** 2;
            bF[i + 6] = r.r;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = p[1] | BIT_DEFAULT_Z_INDEX;
            i += stride;
            buf.length += 1;

        }

        if (this.gunOut > 0.2) {
            const go = this.gunOut ;
            bF[i    ] = x;
            bF[i + 1] = y;
            bF[i + 3] = bF[i + 2] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = 2.3 * go - this.recoil ** 1.5;
            bF[i + 6] = A;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = p[2] | BIT_DEFAULT_Z_INDEX;
            i += stride;

            bF[i    ] = x;
            bF[i + 1] = y;
            bF[i + 3] = bF[i + 2] = sc;
            bF[i + 4] = 0.5;
            bF[i + 5] = 1 * go;
            bF[i + 6] = A;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = p[3] | BIT_DEFAULT_Z_INDEX;
            i += stride;
            buf.length += 2;


        }

        bF[i    ] = x;
        bF[i + 1] = y;
        bF[i + 3] = bF[i + 2] = sc;
        bF[i + 4] = 0.5;
        bF[i + 5] = 0.47;
        bF[i + 6] = r.r;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[4] | BIT_DEFAULT_Z_INDEX;
        i += stride;

        buf.length += 1;
		return i;
	},
}