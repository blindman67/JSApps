/* !!! WARNING !!! ONLY ONE INSTANCE OF Rocks at a time or this module will not work... */

import "../../src/utils/MathExtensions.js";
import {Vec2} from "../../src/Vec2.js";
import {data} from "./data.js";
import {buffers} from "./buffers.js";
import {colors} from "../../src/utils/colors.js";
import {DockingPad} from "./Rocks/DockingPad.js";
import {Radio, RadioDish} from "./Rocks/Radio.js";
import {DefenceGun} from "./Rocks/DefenceGun.js";
import {MissileLauncher} from "./Rocks/MissileLauncher.js";
import {Drill} from "./Rocks/Drill.js";
import {Housing} from "./Rocks/Housing.js";
import {Power} from "./Rocks/Power.js";
import {Aoids} from "./Aoids.js";
import {SpriteCollisionMap} from "../../src/SpriteCollisionMap.js";
export {Rocks};


const AttachedTypes = {DockingPad, DefenceGun, Radio, RadioDish, MissileLauncher, Drill, Housing, Power};
const ROCK_SPRITES = data.spriteSheet.names.rocks;
const ROCK_GLOW_SPRITES = data.spriteSheet.names.rockGlows;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const MASS_GROW_MULTIPLIER = 50;
const SPRITES = data.spriteSheet.sprites;
const ROCK_MASS_SCALE = data.rocks.massScale;
const HABITAT_MASS_SCALE = data.habitats.massScale;
const ROCK_COOL_RATE = 1;
const ROCK_ORBIT_DRAG = data.rocks.orbitDrag;
const ROCK_ORBIT_DEDRAG = 1 - data.rocks.deorbitDrag;
const ROCK_ORBIT_DEDRAG_SCALE = data.rocks.deorbitDragScale;
const METAL_CLAIM_TIME = data.rocks.metalClaimTime;
const KEEP_ALIVE_DIST = data.rocks.keepAliveDist;
const MIN_RADAR_MASS_DETECT = 40000;
const DAMAGE_MASS_SPEED_COF = 1/1e7;
const TOO_SMALL_SIZE = 64; // small rock size
const TOO_SMALL_COUNTDOWN = 30; // small rock remain for this many frames
const DANGER_DISTANCE = 200 * 8;
const GRAV_CONST = data.background.gravConstant;
//const SIZES = data.rocks.sizes;
const MIN_SCALE = data.rocks.minScale;
const MAX_SCALE = data.rocks.maxScale;
const SCALE_CURVE = data.rocks.scaleCurve;
const SMASH_ANGLES = data.rocks.smashAngles;
const SIZE_TYPES = ROCK_SPRITES.length;
const LAST_SIZE_TYPE = ROCK_SPRITES.length -1;
const MIN_SIZE_FOR_DISTANT_ROCKS = LAST_SIZE_TYPE - data.rocks.keepSizes;
const TARGET_MAX = (data.playfield.width ** 2 + data.playfield.height ** 2) ** 0.5 * data.playfield.spawnScale;
const ROCK_RESPAWN_ODDS = data.rocks.respawnOdds;
const MAX_RESPAWN_COUNT = data.rocks.maxCount;
const METAL_ODDS = data.rocks.metalOdds;
const BONUS_ODDS = data.rocks.bonusOdds;
const WHITE_SPARKS_IDXS = data.spriteSheet.names.whiteSparks;
const WHITE_SPARKS_IDXS_COUNT = data.spriteSheet.names.whiteSparks.length;
const ATTACHED_SMOKE_SPR_IDXS = data.spriteSheet.names.gunMis.smoke;
const B = 250, L = 220, M = 90, D = 8;
const ATTACHED_SMOKE_COLORS = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(L,M,M,1))
	.addStopRGBA(0.25, colors.createRGBA(L,L,M,1))
	.addStopRGBA(0.5,  colors.createRGBA(M,M,D,1))
	.addStopRGBA(0.75, colors.createRGBA(M,D,D,1))
	.addStopRGBA(1,    colors.createRGBA(D,D,D,1))
    .asUInt32Array(32);
const ATTACHED_FIRE_COLORS = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(B,D,D,1))
	.addStopRGBA(0.5, colors.createRGBA(B,L,0,1))
	.addStopRGBA(1,  colors.createRGBA(B,M,D,1))
    .asUInt32Array(32);
const ATTACHED_FIRE_RED_COLORS = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(B,0,0,1))
	.addStopRGBA(0.5, colors.createRGBA(L,45,0,1))
	.addStopRGBA(1,  colors.createRGBA(M,0,0,0.5))
    .asUInt32Array(32);
const ATTACHED_ARC_COLORS = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(D,D,B,1))
	.addStopRGBA(0.5,  colors.createRGBA(M,M,B,1))
	.addStopRGBA(1,    colors.createRGBA(D,L,B,1))
    .asUInt32Array(32);
const COLLISION_STANDOFF_DIST = 0;  // Rock V rock only
const wV1 = new Vec2(), wV2 = new Vec2();  // working vecs
var sprites, spritesOffsets, sprStride, spritesBuf, bufF32, bufI32, rocks, target, collisionResult, FXs, rockCount, pickups, bonuses;
var spritesFX, spritesFXBuf, orbits = [];
var cyclic = 1000; // This modual creates linked object. Rather than lock up on cyclic refereneces this will force an error if it ever gets to zero. This value is reset when a new Rocks object is created
const collisionMap = SpriteCollisionMap(data.spriteSheet.spriteEdges[0].length);
collisionMap.active = false;
collisionResult = collisionMap.resultObj;
collisionResult.hx = 0;
collisionResult.hy = 0;
collisionMap.addSprites(SPRITES, data.spriteSheet.spriteEdges);
const MAX_RADIUS = SPRITES[ROCK_SPRITES[0][0]].max;
function badSiblingArraySize() { bad_Sibling_Array_Size = true } // rather than throw which may force some JS execution context optimiser flags to undesiered values this forces a Refernce Error by assigning to an undeclare variable. Most consoles will show the variable name and thus give instant warning of problem
function badSibling() { bad_Sibling = true } // rather than throw which may force some JS execution context optimiser flags to undesiered values this forces a Refernce Error by assigning to an undeclare variable. Most consoles will show the variable name and thus give instant warning of problem
function badSiblingInPool() { bad_Sibling_In_Pool = true } // rather than throw which may force some JS execution context optimiser flags to undesiered values this forces a Refernce Error by assigning to an undeclare variable. Most consoles will show the variable name and thus give instant warning of problem
function cyclicOverflow() { cyclic_Overflow_In_Module_Rocks = true } // rather than throw which may force some JS execution context optimiser flags to undesiered values this forces a Refernce Error by assigning to an undeclare variable. Most consoles will show the variable name and thus give instant warning of problem
function Attached(attachedTo, rock, ang, type) {
    cyclic ++;
    if (!cyclic--) { cyclicOverflow() } // Forces a Reference Error
    this.attachedTo = attachedTo;
    this.attachment = undefined;  // points to rock that may be attached to rock self
    this.angle = ang;
    this.rock = rock;
    const desc = this.desc = data.habitats.types[type];
    this.breakable = data.spriteSheet.names[desc.breakable];
    this.distX = 0;
    this.distY = 0;
    this.type = type;
    this.selfRender = false;
    this.alive = true;
    this.targetDist = 0;
    this.xAx = 1;
    this.xAy = 0;
    this.burn = 0;
    this.rocks = undefined;
    this.teamIdx = attachedTo.teamIdx;
    this.homeScale = attachedTo.scale;
    this.behaviour = (desc.name !== undefined  && AttachedTypes[desc.name]) ? new AttachedTypes[desc.name](this, desc) : undefined;

}
Attached.prototype = {
    delete() {
        this.behaviour && this.behaviour.delete && this.behaviour.delete();
        this.attachedTo = undefined;
        this.attachment = undefined;
        this.rocks = undefined;
        this.rock = undefined;
    },
    init() {
        this.setPosition();
        this.update(true);
        this.rock.dx = this.rock.dy = this.rock.dr = 0;
    },
    setPosition() {
        const w = SPRITES[this.rock.sprIdx].w;
        const h = SPRITES[this.rock.sprIdx].h;


        this.distX = (this.desc.offsetX !== undefined ? this.desc.offsetX : 0) * this.rock.scale; // + (this.desc.offsetX !== undefined ? w * this.desc.offsetX : 0);
        const distOffset = this.distY = (h - (this.desc.offsetY !== undefined ? this.desc.offsetY : 9) - h * 0.5) * this.rock.scale;// + (this.desc.offsetY !== undefined ? h * this.desc.offsetY : 0);
       // const distOffset = this.distY = h * 0.5 + (this.desc.offsetY !== undefined ? h * this.desc.offsetY : 0);
        const dist = collisionMap.edgeDist(this.attachedTo.sprIdx, this.angle) * this.attachedTo.scale;
        const rw = w / dist;
        const distA = collisionMap.edgeDist(this.attachedTo.sprIdx, this.angle - rw) * this.attachedTo.scale;
        const distB = collisionMap.edgeDist(this.attachedTo.sprIdx, this.angle + rw) * this.attachedTo.scale;
        this.homeScale  = this.attachedTo.scale;
        const xA = Math.cos(this.angle - rw) * distA;
        const yA = Math.sin(this.angle - rw) * distA;
        const xB = Math.cos(this.angle + rw) * distB;
        const yB = Math.sin(this.angle + rw) * distB;
        const x = (xA + xB) / 2;
        const y = (yA + yB) / 2;
        this.dist = (x * x + y * y) ** 0.5;
        this.offsetAngle = (Math.atan2(yB - yA, xB - xA) + Math.PI270 - this.angle) % Math.TAU;
    },
    changedSpriteIdx(newSpr, oldSpr) {
        this.dist -= (oldSpr.h - newSpr.h) * 0.5  * this.rock.scale;
        this.update(true);
        this.update();
    },
    update(firstUpdate) {
        if (Math.random() < 0.005) { this.setPosition() }
        const s = this.rock, a = this.attachedTo;
        const r = s.r, x = s.x, y = s.y;
        s.r = a.r + this.angle;
        const scale = a.scale / this.homeScale;
        const xA = Math.cos(s.r) * this.dist * scale;
        const yA = Math.sin(s.r) * this.dist * scale;
        s.r += this.offsetAngle;
        const xAx = this.xAx = Math.cos(s.r);
        const xAy = this.xAy = Math.sin(s.r);
        s.x = xAx * this.distY - xAy * this.distX + xA + a.x;
        s.y = xAy * this.distY + xAx * this.distX + yA + a.y;
        s.r += Math.PI90;
        s.dr = s.r - r;
        s.dx = s.x - x;
        s.dy = s.y - y;
        (!firstUpdate) && this.behaviour && this.behaviour.update();
    },
}
const siblingPool = Object.assign([],{
    empty() { this.length = 0 },
    push(siblings) {
        Aoids.logger.log("Sibs to pool");
        siblings.hidden = false;
        siblings.radius = 0;
        siblings.sibs.length = 0;
        siblings.size && badSiblingInPool();
        this[this.length] = siblings;
    },
});
function Siblings() {
    this.sibs = [];
    this.size = 0;
    this.pOffsetX = 0;
    this.pOffsetY = 0;
    this.radius = 0;
    this.hidden = false;
    this.hiddenDist = 0;
}
Siblings.prototype = {
    delete() { this.size = this.sibs.length = 0 },
    add(parent, rock) {
        rock.parent = parent;
        rock.color = parent.color;
        this.sibs[this.size++] = rock;

    },
    transfer(oldParent) {
        var head = 0, tail = 0, newParent;
        const sibs = this.sibs, len = this.size;
        while(head < len) {
            const s = sibs[head];
            if (s.parent === oldParent) {
                if (s.alive) {
                    if (newParent) {
                        s.parent = newParent;
                        //s.siblings = undefined;
                        if (head > tail) {
                            sibs[head] = sibs[tail];
                            sibs[tail] = s;
                        }
                        tail++;
                    } else {
                        newParent = s;
                        s.siblings = this;
                        s.parent = undefined;
                    }
                } else {
                    s.parent = undefined;
                }
            }
            head++;
        }
        this.size = tail;


        return newParent;
    },
    restack(parent) {
        var head = 0, tail = 0;
        const sibs = this.sibs, len = this.size;
        while(head < len) {
            const s = sibs[head];
            if (s.parent === parent && s.alive) {
                if (head > tail) {
                    sibs[head] = sibs[tail];
                    sibs[tail] = s;
                }
                tail++;
            }
            head++;
        }
        this.size = tail;
    },
    validate() {
        var i = 0;
        while(i < this.sibs.size) {
            if (this.sibs[i].parent && !this.sibs[i].parent.siblings) { badSibling() }
            if (this.sibs[i].parent &&
                this.sibs[i].parent.siblings &&
                this.sibs[i].parent.siblings === this &&
                this.sibs[i].parent.siblings.size <= i) { badSiblingArraySize() }
            i ++;
        }

    },
    hide(parent) {
        var head = 0, tail = 0, mx = Infinity, Mx = -Infinity, my = Infinity, My = -Infinity;
        const x = parent.x, y = parent.y, sibs = this.sibs, len = this.size;
        var mx = x, my = y;
        while(head < len) {
            const s = sibs[head];
            if (s.parent === parent && s.alive && !s.inParent) {
                s.inParent = true;
                mx += s.x;
                my += s.y;
                Mx = Math.max(Mx, s.x = s.x - x)
                My = Math.max(My, s.y = s.y - y)
                mx = Math.min(mx, s.x);
                my = Math.min(my, s.y);
                if (head > tail) {
                    sibs[head] = sibs[tail];
                    sibs[tail] = s;
                }
                tail++;
            }
            head++;
        }
        mx /= tail + 1;
        my /= tail + 1;

        this.radius = ((Mx - mx) ** 2 + (My - my) ** 2) ** 0.5;
        this.hiddenDist = parent.visualDist;
        this.size = tail;
        this.hidden = true;
        Aoids.logger.log(tail + " sibs hidden");
    },
    show(parent) {
        var i = 0;
        const x = parent.x, y = parent.y, dx = parent.dx, dy = parent.dy, sibs = this.sibs, len = this.size;
        while(i < len) {
            const s = sibs[i];
            s.inParent = false;
            s.x = x + s.x;
            s.y = y + s.y;
            s.dx = dx;
            s.dy = dy;
            i ++;
        }
        this.hiddenDist = 0;
        this.radius /=  2;
        this.hidden = false;
        Aoids.logger.log("Hidden siblings restored");
    },
}
function Rock() {
	this.x = 0;
	this.y = 0;
	this.r = 0;
	this.dx = 0;
	this.dy = 0;
	this.dr = 0;
    this.attached = undefined,
	this.hitCountdown = 0;   // count down. While not zero rock can release bonus and metal
	this.checkTarget = 0;
	this.radius = 128;
	//this.maxRadius = 128;
	//this.strength = 20;
    this.hp = 0;
    this.damage = 0;
	this.breakup = 0;
	this.scale = 1;
	this.size = 0;
	this.rock = 0;
	this.changed = 0;
	this.targetDist = 0;
    this.visualDist = 0;
	this.alive = true;
	this.sprIdx = ROCK_SPRITES[0][0];
	//this.sprGlowIdx = ROCK_GLOW_SPRITES[0][0];
	this.hitTargetCount = 0;
	this.color = 0xFFFFFFFF;
	//this.orbitIdx = -1;
	this.orbit;
    this.countDown = 0;
	this.fixed = false;
    this.isHabitat = false;
    this.distance = 0;
    this.addMassTo = undefined;
    this.siblings = undefined;
    this.parent = undefined;
    this.inParent = false;
    this.aliveFor = 0;
    this.otherHalf = undefined; // WARNING check alive befor using the referenced rock
}
Rock.prototype = {
    delete() {
        this.attached && this.attached.delete();
        this.siblings && this.siblings.delete();
        this.siblings = undefined;
        this.attached = undefined;
        this.parent = undefined;
    },
	init(dontScale = false) {
		if(!this.fixed) {


            this.alive = true;
			this.changed = 2;
            this.otherHalf = undefined;
			this.checkTarget = 20 + Math.random() * 20 | 0;
			if (!dontScale && this.size === 0) {
				this.scale = Math.randItem(this.orbit.scales);
                this.hp = this.orbit.hpScale * this.scale;
                this.damage = 0;
                this.teamIdx = -1;
                if(this.orbit.vectorDir && this.orbit.vectorSpeed) {
                    const vd = this.orbit.vectorDir, vs = this.orbit.vectorSpeed;
                    const a = Math.atan2(this.y, this.x) + Math.random() * (vd[1] - vd[0]) + vd[0];
                    const speed = Math.random() * (vs[1] - vs[0]) + vs[0];
                    this.dx = -Math.cos(a) * speed;
                    this.dy = -Math.sin(a) * speed;
                }
			}
            if (this.orbit.smash && this.size === 3 && Math.random() < 0.75) {
                this.sprIdx =  ROCK_SPRITES[4][Math.random() * 16 | 0];
                this.scale *= 2;
                const spr = SPRITES[this.sprIdx];
                this.radius = spr.max  * this.scale;
                this.mass = spr.w * spr.h * spr.d * this.scale * ROCK_MASS_SCALE;
                this.hitCountdown = 0;
                this.countDown = 0; //this.radius < TOO_SMALL_SIZE ? TOO_SMALL_COUNTDOWN + Math.random() * TOO_SMALL_COUNTDOWN | 0: 0
                this.addMassTo = rocks.homeRock;
                this.color = 0xFFFFFFFF;

            } else {
                this.sprIdx =  ROCK_SPRITES[this.size][this.rock];
                const spr = SPRITES[this.sprIdx];
                this.radius = spr.max  * this.scale;
                this.mass = spr.w * spr.h * spr.d * this.scale * ROCK_MASS_SCALE;
                this.hitCountdown = 0;
                this.countDown = this.radius < TOO_SMALL_SIZE * 0.75 ? TOO_SMALL_COUNTDOWN + Math.random() * TOO_SMALL_COUNTDOWN | 0: 0
                this.addMassTo = rocks.homeRock;
            }
		}
		return this;
	},
    asMemberOfCurrentTeam() {
        this.teamIdx = Aoids.teams.idx;
        return this;
    },
	asOrbitBody(sprIdx, scale, mass, moveFunc) {
		this.fixed = true;
		this.orbit = undefined;
		this.x = 0;
		this.y = 0;
		this.r = 0.01;
		this.dx = 0;
		this.dy = 0;
		this.dr = 0.0;
        if (moveFunc) { this.moveFunc = moveFunc  }
		this.color = 0xFFFFFFFF;
		//this.strength = Infinity;
        this.hp = Infinity;
		this.scale = scale;
		this.changed = 0;
		this.size = 0;
		this.rock = 0;
		this.alive = true;
		this.sprIdx =  sprIdx;
		this.mass = mass;
		this.radius =  SPRITES[sprIdx].max * this.scale;
        this.massScale = mass / (this.radius ** 3);
		this.hitCountdown = 0;
        return this;
	},
    asAttached(attachedTo, angle, scale, typeIdx, rocks) {
        this.attached = new Attached(attachedTo, this, angle % Math.TAU, typeIdx);
		this.size = 0;
        const sprIdx = this.attached.breakable[this.size];
        this.teamIdx = attachedTo.teamIdx;
		this.fixed = true;
		this.orbit = undefined;
		this.x = 0;
		this.y = 0;
		this.r = 0;
		this.dx = 0;
		this.dy = 0;
		this.dr = 0;
		this.color = 0xFFFFFFFF;
		this.scale = scale;
		this.changed = 0;
		this.size = 0;
		this.rock = 0;
		this.alive = true;
		this.sprIdx =  sprIdx;
        this.hp = this.attached.desc.hitPoints;
        const spr = SPRITES[sprIdx];
		this.mass = spr.w * spr.h * spr.d * this.scale * HABITAT_MASS_SCALE;
		//this.strength = this.mass;
		this.radius = SPRITES[sprIdx].max * this.scale;
		this.hitCountdown = 0;
		this.countdown = 0;
		this.damage = 0;
        this.breakup = 0;
        this.isHabitat = true;
        this.attached.init();
        this.attached.rocks = this.attached.desc && this.attached.desc.needRocks ? rocks : undefined;
        if (this.attached.desc.attach) {
            const attach = this.attached.desc.attach;
            const habTypeIdx = data.habitats.namedTypes[attach.habitTypeName];
            if (habTypeIdx !== undefined) {
                this.attached.attachment = rocks.newFixedItem()
                this.attached.attachment.asAttached(this, attach.anglePos, scale * attach.scale, habTypeIdx, rocks);
            }
        }
        return this;
    },
	random(orbitIdx, checkForSpace = false) {
		var i;
		if (!this.orbit) {
			this.orbit = orbits[orbitIdx];
            this.orbit.count ++;
		}
		const orbit = this.orbit;
		this.dr = (Math.random() - 0.5) * 0.02;
		this.r = Math.random() * Math.PI * 2;
		this.color = Math.randItem(orbit.colors);
		this.size = 0;
		this.rock = 0;
		this.alive = true;
        this.countDown = 0;
		const sunDist = Math.random() * (orbit.maxDist - orbit.minDist) + orbit.minDist;
		const ang = (Math.TAU / orbit.maxCount) * orbit.count;
		this.x = Math.cos(ang) * sunDist;
		this.y = Math.sin(ang) * sunDist;
		const vel = ((GRAV_CONST * rocks.homeRock.mass) / sunDist) ** 0.5
		this.dx = -Math.sin(ang) * vel;
		this.dy = Math.cos(ang) * vel;
		return this;
	},
    hideSiblings() {
        if (this.siblings && this.siblings.size && !this.siblings.hidden) { this.siblings.hide(this) }
    },
    showSiblings() {
        if (this.siblings && this.siblings.size && this.siblings.hidden) { this.siblings.show(this) }
    },
    isOnLineSlow(steps, xA, yA, xB, yB) {  // slow in performance terms
		var x = xA, y = yA, i = 0;
		const vx = (xB - xA) / steps,  vy = (yB - yA) / steps;
        while (i < steps) {
            collisionMap.checkSprite(this.sprIdx, this.x, this.y, this.r, this.scale, wV1.init(x, y), collisionResult);
            if (collisionResult.inside) { return true }
            x += vx;
            y += vy;
            i ++;
        }
        return false;
    },
    isOnLine(xA, yA, xB, yB) {
		var x = this.x, y = this.y;
		const vx = xB - xA,  vy = yB - yA;
		var u = ((x - xA) * vx + (y - yA) * vy) / (vy * vy + vx * vx);
		u = u <= 0 ? 0 : u >= 1 ? 1 : u;
		x -= (wV1.x = xA + vx * u);
		y -= (wV1.y = yA + vy * u);
		const dist = (x * x + y * y) ** 0.5;
		if (dist < this.radius) {
            collisionMap.checkSprite(this.sprIdx, this.x, this.y, this.r, this.scale, wV1, collisionResult);
            return collisionResult.inside;
        }
        return false;
    },
	isNearLazer(lazer) {
		var x = this.x, y = this.y;
		const vx = lazer.p2.x - this.dx,  vy = lazer.p2.y - this.dy;
		const A = lazer.p1;
		var u = ((x - A.x) * vx + (y - A.y) * vy) / (vy * vy + vx * vx);
		var uClamped = u <= 0 ? 0 : u >= 1 ? 1 : u;
		x -= (wV1.x = A.x + lazer.p2.x * uClamped);
		y -= (wV1.y = A.y + lazer.p2.y * uClamped);
		const dist = (x * x + y * y) ** 0.5;
		if (dist < this.radius) {
            if (u < lazer.type.u) {
                const approxDist = collisionMap.checkSpriteDistance(this.sprIdx, this.x, this.y, this.r, this.scale, wV1);
                if (dist <= approxDist) {
                    lazer.type.u = u;
                    lazer.type.rock = this;
                    lazer.hx = wV1.x;
                    lazer.hy = wV1.y;
                    lazer.type.approxDist = approxDist;
                }
            }
        }
	},
	lazerHit(lazer) {
        collisionMap.active = true;
        collisionResult.inside = true;
        this.hitCountdown = lazer.usersBullet ? METAL_CLAIM_TIME : 0;
        if (this.countDown) {
            collisionResult.hx = lazer.hx;
            collisionResult.hy = lazer.hy;
        } else {
            // line circle intercept. First point only from p1. Assumes there is an intercept
            wV1.x = lazer.p2.x;
            wV1.y = lazer.p2.y;
            wV2.x = lazer.p1.x - this.x;
            wV2.y = lazer.p1.y - this.y;
            const a = lazer.type.approxDist
            const b = -2 * (wV1.x * wV2.x + wV1.y * wV2.y);
            const c = 2 * (wV1.x * wV1.x + wV1.y * wV1.y);
            const d = (b * b - 2 * c * (wV2.x * wV2.x + wV2.y * wV2.y - a * a)) ** 0.5;
            const u = lazer.type.u = (b - d) / c;
            collisionResult.hx = lazer.hx = wV2.x = lazer.p1.x + wV1.x * u;
            collisionResult.hy = lazer.hy = wV2.y = lazer.p1.y + wV1.y * u;
        }
        return this.bulletHit(lazer);
	},
	isNearFastBullet(bullet) {
		var x = this.x, y = this.y;
		const vx = bullet.p2.x - this.dx,  vy = bullet.p2.y - this.dy;
		const A = bullet.p1;
		var u = ((x - A.x) * vx + (y - A.y) * vy) / (vy * vy + vx * vx);
		u = u <= 0 ? 0 : u >= 1 ? 1 : u;
		x -= (wV1.x = A.x + bullet.p2.x  * u);
		y -= (wV1.y = A.y + bullet.p2.y  * u);
		const dist = (x * x + y * y) ** 0.5;
		if (dist < this.radius) {
            if (this.countDown) {
                collisionMap.active = true;
                collisionResult.inside = true;
                collisionResult.hx = wV1.x;
                collisionResult.hy = wV1.y;
                bullet.hx = wV1.x;
                bullet.hy = wV1.y;
                this.hitCountdown = bullet.usersBullet ? METAL_CLAIM_TIME : 0
                return true;
            } else {
                collisionMap.active = true;
                collisionMap.checkSprite(this.sprIdx, this.x + this.dx * u, this.y + this.dy * u, this.r + this.dr * u, this.scale, wV1, collisionResult);
                if (collisionResult.inside) {
                    if (bullet.type.buster && bullet.teamIdx !== this.teamIdx) { // penetrats
                        const px = this.x + this.dx * u;
                        const py = this.y + this.dy * u;
                        const deep = (this.radius - Math.random() * (bullet.type.speed * 0.5)) / this.radius;
                        collisionResult.hx = bullet.hx = px + (collisionResult.x - px) * deep;
                        collisionResult.hy =  bullet.hy = py + (collisionResult.y - py) * deep;
                        const d = bullet.damage ** 2;
                        this.applyForceAtPoint(bullet.hx, bullet.hy, bullet.dx * d, bullet.dy * d);
                       // collisionResult.hx = wV1.x;
                       // collisionResult.hy = wV1.y;
                    } else {
                        bullet.hx = collisionResult.x;
                        bullet.hy = collisionResult.y;
                        collisionResult.hx = wV1.x;
                        collisionResult.hy = wV1.y;
                    }
                    this.hitCountdown = bullet.usersBullet ? METAL_CLAIM_TIME : 0
                    return true;
                }
            }
		}
		return false;
	},
	isAt(point, pointSpeed) {
		const dx = this.x - point.x;
		const dy = this.y - point.y;
		const dist2 = (dx * dx + dy * dy) ** 0.5;
		if( dist2 < (this.radius + pointSpeed) ) {
			collisionMap.active = true;
			collisionMap.checkSprite(this.sprIdx, this.x, this.y, this.r, this.scale, point, collisionResult);
			return collisionResult.inside;
		}
		return false;
	},
	bulletRehit(bullet) { // used by lancing bullets (penetrate rock)
        if (this.teamIdx !== bullet.teamIdx) {
            this.damage += bullet.damage;
        }
	},
	bulletHit(bullet) {
        var smash = false;
        const hitPower = bullet.powerR * bullet.lance * (bullet.speed !== undefined ? bullet.speed : 1)
        if (this.fixed) {
            if (this.teamIdx !== bullet.teamIdx) { this.damage += bullet.damage }
            var smash =  bullet.type.hitSomething(this, hitPower, GRAV_CONST * rocks.homeRock.mass);
            if (smash) { this.smashHabitat() }
        } else {
            if (this.teamIdx !== bullet.teamIdx) { this.damage += bullet.damage }
            var smash =  bullet.type.hitSomething(this, hitPower, GRAV_CONST * rocks.homeRock.mass);
            if (smash) { this.smash(bullet.usersBullet) }
        }
	},
	applyForceAtPoint(rx,ry, dx, dy) {
		const x = rx - this.x;
		const y = ry - this.y;
		const distSqr = x * x + y * y;
		const dist = distSqr ** 0.5;
		const u1 = (dx * x + dy * y) / distSqr;
		let u2 = (dy * x - dx * y) / distSqr;
		this.dr += u2 / (this.mass / 4);
		this.dx += (x * u1) / (this.mass / 16);
		this.dy += (y * u1) / (this.mass / 16);
	},
	applyTorqueAtPoint(rx,ry, dx, dy) {
		const x = rx - this.x;
		const y = ry - this.y;
		const distSqr = x * x + y * y;
		const dist = distSqr ** 0.5;
		let u2 = (dy * x - dx * y) / distSqr;
		this.dr += u2 / (this.mass * dist);
        this.dr = this.dr > 0.2 ? 0.2 : this.dr < -0.2 ? -0.2 : this.dr;
	},
	applyTorqueAtPointDist(rx,ry, dx, dy, distA, u, distB, rock) {
		const x = rx * distA;
		const y = ry * distA;
        const rotA = this.dr * distA * this.mass;
        const rotB = rock.dr * distB * this.mass * u;
		var u2 = ((dy - rx * rotA + rx * rotB) * x - (dx + ry * rotA - ry * rotB) * y) / (distA * distA);
		this.dr += u2 / (this.mass * distA);
        this.dr = this.dr > 0.2 ? 0.2 : this.dr < -0.2 ? -0.2 : this.dr;
	},
	smashHabitat() {
        var i, ss;
        if (this.countDown) { return }
        const br = this.attached.breakable;

        const sprIdx = br[this.size];
       if (sprIdx !== undefined) {
            //this.size += 1;
            const oldSprIdx = this.sprIdx;
            this.sprIdx =  sprIdx;
            const spr = SPRITES[this.sprIdx];
            this.radius = spr.diag / 2;
            this.mass = spr.w * spr.h * spr.d * this.scale * HABITAT_MASS_SCALE;
            this.strength = this.mass;
            this.radius = spr.max * this.scale;
            //this.attached.distOffset = spr.h / 2 - 16;
            //this.attached.changedSpriteIdx(spr, SPRITES[oldSprIdx]);
            this.otherHalf = undefined;
            this.attached.burn = 1;

            this.attached.setPosition();
        } else {
            this.attached.burn = 0;
            this.size = br.length;
        }
    },
	smash(yieldMetal) {
        var i, ss, sz;
        if (this.isHabitat) {
            this.smashHabitat();
            return;
        }
		this.size += 1;
        const orbit =this.orbit;
		if(this.size < SIZE_TYPES && this.hp >= 1 && this.countDown === 0) {

			const gp = Math.max(1,this.breakup);
			const dist = (SMASH_ANGLES[this.size] === 0 ? SPRITES[this.sprIdx].w : SPRITES[this.sprIdx].w) * 0.25 * this.scale;
			this.dr *= 0.9 - Math.random() * 0.1;
			const speedAdd = dist * 0.5 * this.dr;
            const smashAng = this.r + SMASH_ANGLES[this.size] * Math.PI90;
			const xAx = Math.cos(smashAng);
			const xAy = Math.sin(smashAng);
			const r = rocks.newItem();

            r.parent = undefined;
            r.teamIdx = this.teamIdx;
			if(this.size === 2 && this.scale > 2.0) {
                this.scale *= 0.6;
				this.size = 0;
				r.rock = this.rock = 0;
			} else if(this.size === 3 && this.scale > 1.0) {
                this.scale *= 0.6;
				this.size = 2;
				r.rock = Math.random() * 4 | 0;
				this.rock = Math.random() * 4 | 0;
			} else {
				this.rock = this.rock * 2 | 0;
				r.rock = this.rock + 1;

			}
            if (this.orbit.smash && this.size < SIZE_TYPES - 1)  {
                r.damage = this.damage = 0;
                r.hp = this.hp = this.size === 3 ? 2 : this.hp *  0.8;
                this.breakup = this.size < 3 || Math.random() < 0.5 ? 1 : 0;


            } else {

                this.breakup -= this.breakup > 1 ? 1 : this.breakup;
                r.breakup = this.breakup;
                if (this.damage > this.hp) {
                    this.damage -= this.hp;
                    r.damage = (this.damage *= 0.2);
                    r.hp = (this.hp *= 0.5);
                    this.breakup += 1;
                } else {
                    r.damage = (this.damage *= 0.1);
                    r.hp = (this.hp *= 0.8);
                }
            }
			r.size = this.size;
			r.scale = this.scale;
			r.orbit = this.orbit;
			r.r = this.r
			r.dr = this.dr + (Math.random()- 0.5) * 0.1;
			r.x = this.x + xAx * dist;
			r.y = this.y + xAy * dist;
			r.dx = this.dx - xAy * speedAdd + xAx * gp;
			r.dy = this.dy + xAx * speedAdd + xAy * gp;
			r.color = this.color;
			this.x -= xAx * dist;
			this.y -= xAy * dist;
			this.dx -= -xAy * speedAdd + xAx * gp;
			this.dy -=  xAx * speedAdd + xAy * gp;
			const hcd = this.hitCountdown;
			this.init(true);
			r.init(true);
            if (r.countDown === 0 && orbit.useSiblings === true) {
                if (this.parent) { this.parent.siblings.add(this.parent, r) }
                else if (this.siblings) { this.siblings.add(this, r) }
                else {
                    const ch = Math.randI(0,3)
                    this.color = (ch !== 0 ? Math.randI(128,255) << 16 : 0) + (ch !== 1 ? Math.randI(128,255) << 8 : 0) + (ch !== 2 ? Math.randI(128,255) : 0) + 0xFF000000
                    this.siblings = siblingPool.length ? siblingPool.pop() : new Siblings();
                    this.siblings.add(this, r);
                }
            }

           // r.color = r.countDown ? 0xFF0000FF : r.color;
            //this.color = this.countDown ? 0xFF0000FF : this.color;
            r.breakup = r.countDown > 0 ? 0 : r.breakup;
            this.breakup = this.countDown > 0 ? 0 : this.breakup;
			r.hitCountdown = this.hitCountdown = hcd;
            r.otherHalf = this;
            this.otherHalf = r;
			const cx = (this.x + r.x) / 2;
			const cy = (this.y + r.y) / 2;
            const cdx = (this.dx + r.dx) / 2;
            const cdy = (this.dy + r.dy) / 2;
            const cols = this.orbit.colors;
            const colLen = cols.length;
            if (this.visualDist < GinPlayDist) {
                FXs.newItem(FXs.types.frags).initDelta(cx, cy, cdx, cdy,  cols[Math.random() * colLen | 0], Math.max(this.radius * 0.01, 40), undefined, (LAST_SIZE_TYPE- this.size) * 0.7);
                ss = this.scale;
                sz = this.radius / ss;
                i = 2;
                // color, size, dir, colorArray, sprites = SMOKE_SPRITE_IDX, time = 36, spread = size) {
                while (ss > 0.5 && i--) {
                    FXs.newItem(FXs.types.smoke).initDelta(cx, cy, cdx, cdy, cols[Math.random() * colLen | 0], Math.max((sz * ss) ** 2, 32024) ** 0.5, smashAng + (Math.random() - 0.5) * Math.PI, undefined, undefined, Math.min(50, ss * (Math.random() * 25 + 25)) | 0);
                    ss *= 0.55;
                }
            }
			if (yieldMetal || this.hitCountdown) {
                const bonusOdds = orbit.bonusOdds ? orbit.bonusOdds : BONUS_ODDS;
				Math.random() < BONUS_ODDS && (bonuses.newItem().init(cx, cy, cdx, cdy) === false && bonuses.returnItem());
                const metalOdds = orbit.metalOdds ? orbit.metalOdds : METAL_ODDS;
				while (Math.random() < metalOdds) {
					if (pickups.newItem().init(cx, cy, cdx, cdy) === false) { pickups.returnItem() }
				}
			}
		} else {
			this.breakup = 0;
             if (this.visualDist < GinPlayDist) {
                FXs.newItem(FXs.types.frags).initDelta(this.x, this.y, this.dx, this.dy, this.color, 40, undefined, (LAST_SIZE_TYPE- this.size) * 0.7);
                if (yieldMetal || this.hitCountdown) {
                    const bonusOdds = orbit.bonusOdds ? orbit.bonusOdds : BONUS_ODDS;
                    Math.random() < bonusOdds && (bonuses.newItem().init(this.x, this.y, this.dx, this.dy) === false && bonuses.returnItem());
                    const metalOdds = orbit.metalOdds ? orbit.metalOdds : METAL_ODDS
                    while (Math.random() < metalOdds) {
                        if (pickups.newItem().init(this.x, this.y, this.dx, this.dy) === false) { pickups.returnItem() }
                    }
                }
             }

            this.kill();

            return;
		}
	},
    fixedHitsRock(rock) {
        this.doCollision(rock, collisionResult, true, true);
        const c = collisionResult;
        rock.damage += 1;//rock.breakup += 2;
        if (rock.damage > rock.hp) {
            rock.breakup += 1
        }
        if (rock.visualDist < GinPlayDist * 1.5) {
            const distA = c.distA - Math.random() * c.distA * 0.05;
            const distA1 = c.distA - Math.random() * c.distA * 0.01;
            const distB = c.distA + Math.random() * c.distB * 0.4;
            const dx = this.x + Math.cos(c.ang) * distA1;
            const dy = this.y + Math.sin(c.ang) * distA1;
            const spread =  (Math.random() - 0.5) * 2;
            const scaleSpread = 1.1 - Math.abs(spread)
            const spread1 =  (Math.random() - 0.5) * 2;
            const scaleSpread1 = 1.1 - Math.abs(spread1)
            if (rock.breakup > 0) {
                FXs.newItem(FXs.types.sparks).init(this.x + Math.cos(c.ang) * distA, this.y + Math.sin(c.ang) * distA, (Math.random() * 4 + 4)  * rock.radius, c.ang + Math.PI90 + 0.5 * spread, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], 4, true, this);
                //color, size, fragIdxs = FRAG_SPRITE_IDXS, scale = 0, sprayDir = 0, spread = Math.TAU, alpha = 0, curve = 0.2)
                if (rock.visualDist < GinPlayDist) {
                    // color, size, dir, colorArray, sprites = SMOKE_SPRITE_IDX, time = 36, spread = size)
                    FXs.newItem(FXs.types.smoke, 1).init(dx, dy,0xFFFFFFFF, rock.radius / 2 , c.ang + (Math.random() - 0.5) * Math.PI, ATTACHED_FIRE_RED_COLORS, ATTACHED_SMOKE_SPR_IDXS, Math.random() * 25 + 10, Math.PI90);
                    FXs.newItem(FXs.types.smoke, 1).init(dx, dy,0xFFFFFFFF, rock.radius, c.ang + (Math.random() - 0.5) * Math.PI, ATTACHED_FIRE_COLORS, ATTACHED_SMOKE_SPR_IDXS, Math.random() * 5 + 15, Math.PI90);
                    //FXs.newItem(FXs.types.frags,1).init(dx, dy,  ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], Math.max(rock.radius, 74) WHITE_SPARKS_IDXS, rock.scale ** 0.5);
                    //FXs.newItem(FXs.types.frags,1).init(dx, dy,  ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], Math.max(rock.radius, 2), WHITE_SPARKS_IDXS, rock.scale ** 0.5);
                    FXs.newItem(FXs.types.frags,1).init(dx, dy, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], rock.radius * 0.5, WHITE_SPARKS_IDXS, rock.scale * 20, c.ang, 2, 155 );
                    FXs.newItem(FXs.types.frags,1).init(dx, dy, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], rock.radius * 0.5, WHITE_SPARKS_IDXS, rock.scale * 10,  c.ang, 4, 155  );
                    // size, ang, col = DEFAULT_COLOR, sparkSpriteSet = 0, spriteSeq, attachedTo, time = 0) {
                    Math.random() < 0.5 && FXs.newItem(FXs.types.sparks).init(dx, dy, (Math.random() * 12 + 12)  * scaleSpread1 * rock.radius, c.ang + Math.PI90 +  0.5  * spread1, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], 4, true, this);
                    Math.random() < 0.5 && FXs.newItem(FXs.types.sparks).init(this.x + Math.cos(c.ang) * distB, this.y + Math.sin(c.ang) * distB, Math.random() * 3 * rock.radius, c.ang - Math.PI90 + (Math.random() - 0.5) * 0.5, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], 4, true, rock);
                }
            } else {
                if (rock.visualDist < GinPlayDist) {
                    Math.random() < 0.2 && FXs.newItem(FXs.types.frags,1).init(dx, dy, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], Math.min(rock.radius * 0.1, 2), WHITE_SPARKS_IDXS, rock.scale * 10 );
                    Math.random() < 0.2 && FXs.newItem(FXs.types.frags,1).init(dx, dy, ATTACHED_FIRE_COLORS[Math.random() * 32 | 0], Math.min(rock.radius * 0.1, 2), WHITE_SPARKS_IDXS, rock.scale * 10 );
                }
            }
        }
        if (this.isHabitat) {

            this.damage += rock.scale ** 2;
            if (this.size === 0) {
                if (this.damage > this.hp) {
                    if (this.attached && this.attached.base) {
                        this.attached.base.remove(this);
                        this.attached.base = undefined;
                    }
                    this.size += 1;
                    this.attached.burn = 1;
                    this.damage = 0;
                    this.smashHabitat();
                }

            } else {
                if (this.damage > this.hp) {
                    this.size += 1;
                    this.attached.burn = 1;
                    this.damage = 0;
                    this.smashHabitat();
                }
            }

        } else {
            rock.addMassTo = this;
        }
    },
	rockHitRock(rock) {
		const dx = rock.x - this.x;
		const dy = rock.y - this.y;
		const dist = dx * dx + dy * dy;
		const tDist = dist ** 0.5;
		if (tDist < this.radius + rock.radius) {
            if (this.fixed) {
                if (rock.radius < 364) {
                    collisionMap.checkSpriteFast(this.sprIdx, this.x, this.y, this.r, this.scale, rock, rock.radius, collisionResult);
                    if(collisionResult.dist >= tDist) {
                        this.fixedHitsRock(rock);
                    }
                } else {
                    collisionMap.checkSprites(this.sprIdx, this.x, this.y, this.r, this.scale, rock.sprIdx, rock.x, rock.y, rock.r, rock.scale, collisionResult);
                    if(collisionResult.inside) {
                        this.fixedHitsRock(rock);
                    }
                }
            } else {
                collisionMap.checkSprites(this.sprIdx, this.x, this.y, this.r, this.scale, rock.sprIdx, rock.x, rock.y, rock.r, rock.scale, collisionResult);
                if(collisionResult.inside) {
					this.doCollision(rock, collisionResult, true, true);
                }
			}
		}
	},
     doCollision(rock, collisionResult) {
		const c = collisionResult;
		var nx, ny, u1, x, y, u4, ndx, ndy, res = 0;
		const ddx = Math.cos(c.ang);
		const ddy = Math.sin(c.ang);
		nx = - ddx * c.dist;
		ny = - ddy * c.dist;
		const standoff = this.fixed ? 0 : COLLISION_STANDOFF_DIST;
		const cx = c.cx = (this.x + ddx * c.distA + rock.x - ddx * c.distB) / 2;
		const cy = c.cy = (this.y + ddy * c.distA + rock.y - ddy * c.distB) / 2;
		const massThis = this.fixed ? 1 : this.mass;
		const massRock = this.fixed ? 1 : rock.mass;
        if (!this.fixed) {
            this.x = cx - ddx * (c.distA + standoff);
            this.y = cy - ddy * (c.distA + standoff);
            rock.x = cx + ddx * (c.distB + standoff);
            rock.y = cy + ddy * (c.distB + standoff);
        } else {
            rock.x = this.x + ddx * (c.dist + standoff);
            rock.y = this.y + ddy * (c.dist + standoff);
        }
		const distSqr = c.dist * c.dist;
        var tdxr = this.dx - this.dr * c.distA * ddy;
        var tdyr = this.dy + this.dr * c.distA * ddx;
        var rdxr = rock.dx + rock.dr * c.distB * ddy;
        var rdyr = rock.dy - rock.dr * c.distB * ddx;
		const tdx = (tdxr - rdxr); // this to rock
		const tdy = (tdyr - rdyr);
		const rdx = (rdxr - tdxr);  // rock to this
		const rdy = (rdyr - tdyr);
        const thisSpeed = (tdx * tdx + tdy * tdy) ** 0.5
        const rockSpeed = (rdx * rdx + rdy * rdy) ** 0.5
        const ntdx = tdx / thisSpeed;
        const ntdy = tdy / thisSpeed;
        const nrdx = rdx / rockSpeed;
        const nrdy = rdy / rockSpeed;
		u4 = (tdy * nx - tdx * ny) / distSqr;
        const crossToThis = (rdy * ddx - rdx * ddy) * Math.min(0, nrdx * ddx + nrdy * ddy);
        const crossToRock = (tdy * ddx - tdx * ddy) * Math.max(0, ntdx * ddx + ntdy * ddy);
        const rockToThis = (rdx * ddx + rdy * ddy);
        const thisToRock = (tdx * ddx + tdy * ddy);
        const rockToThisMass = massThis > massRock ? massRock / massThis : 1;
        const thisToRockMass = massRock > massThis ? massThis / massRock : 1;
        var rtt = rockToThis * massRock / massThis;
        var ttr = thisToRock * massThis / massRock;
        if (rtt > thisSpeed && massThis < massRock) { rtt = thisSpeed }
        if (ttr > rockSpeed && massRock < massThis) { ttr = rockSpeed }
		if (!this.fixed) {

            let f = rockToThis * rockToThisMass
			this.dx += ddx * f;
			this.dy += ddy * f;
            this.dr += -(crossToThis / c.distA) / 2;
            const speedChange = ((ddx * f) ** 2 + (ddy * f) ** 2) ** 0.5;
            this.damage += f = (f *= DAMAGE_MASS_SPEED_COF * massRock);
            if (f > this.hp) { this.breakup += (f / this.hp) -1 }
		} else if(this.attached) {
            const ux = this.attached.xAy;
            const uy = -this.attached.xAx;
            const nudgeAngle = ux * rdy - uy * rdx;
            this.attached.offsetAngle += (nudgeAngle / rockSpeed)  / c.distA;
        }
        let f = thisToRock * thisToRockMass;
		rock.dx += ddx * f;
		rock.dy += ddy * f;
        rock.dr += -(crossToRock / c.distB) / 2;
        if (!this.isHabitat) {
            if (!rock.isShip) {
                const drag = 1 - Math.random() * 0.1;
                rock.dx *= drag;
                rock.dy *= drag;
                rock.damage += f = (f *= DAMAGE_MASS_SPEED_COF * massThis) ;
                if (f > rock.hp) { rock.breakup += (f / rock.hp) -1 }
                if (this.fixed)  {
                    ndx = -ny * u4;
                    ndy = nx * u4;;
                    const speed = (ndx * ndx + ndy * ndy) ** 0.5;
                    if (speed > 0) {
                        rock.dr = (speed / c.distB) * Math.sign(u4);
                    }
                }
            } else { return 0;/*(f * DAMAGE_MASS_SPEED_COF * massThis) */ }
        }
        return 0;
	},

    doCollisionA(rock, collisionResult, simpleA, simpleB) {
		const c = collisionResult;
		var nx, ny, u1, x, y, u4, u2, ndx, ndy, res = 0;
		const ddx = Math.cos(c.ang);
		const ddy = Math.sin(c.ang);
		nx = - ddx * c.dist;
		ny = - ddy * c.dist;
		const standoff = this.fixed ? 0 : COLLISION_STANDOFF_DIST;
		const cx = c.cx = (this.x + ddx * c.distA + rock.x - ddx * c.distB) / 2;
		const cy = c.cy = (this.y + ddy * c.distA + rock.y - ddy * c.distB) / 2;
		const m1 = this.fixed && this.attached ? rock.mass : this.mass;
		const m2 = rock.mass;
		const mm = m1 + m2;
        if (!this.fixed) {
            this.x = cx - ddx * (c.distA + standoff);
            this.y = cy - ddy * (c.distA + standoff);
            rock.x = cx + ddx * (c.distB + standoff);
            rock.y = cy + ddy * (c.distB + standoff);
        } else {
            rock.x = this.x + ddx * (c.dist + standoff);
            rock.y = this.y + ddy * (c.dist + standoff);
        }
		const obsorb = simpleB && !simpleA ? 1 : 1;
		const distSqr = c.dist * c.dist;
		const ttdx = this.dx;
		const ttdy = this.dy;
		const trdx = rock.dx;
		const trdy = rock.dy;
		const tdx = rock.dx * obsorb;
		const tdy = rock.dy * obsorb;
		const rdx = this.dx;
		const rdy = this.dy;
		u2 = (rdy * nx - rdx * ny) / distSqr;
		u4 = (tdy * nx - tdx * ny) / distSqr;
		const ru3 = ((m1 - m2) * (rdx * nx + rdy * ny) + 2 * m2 * (tdx * nx + tdy * ny)) / distSqr / mm;
		const tu1 = ((m2 - m1) * (tdx * nx + tdy * ny) + 2 * m1 * (rdx * nx + rdy * ny)) / distSqr / mm;
		if (!this.fixed) {
			this.dx = nx * ru3 - ny * u2;
			this.dy = ny * ru3 + nx * u2;
            //const speedChange = Math.min(this.hp,Math.abs(((this.dx - ttdx) ** 2 + (this.dy - ttdy) ** 2) * this.mass * ru3) * DAMAGE_MASS_SPEED_COF);
            //this.damage += speedChange;
            const damage = Math.abs(((this.dx - trdx) ** 2 + (this.dy - trdy) ** 2) * (this.mass ) * ru3) * DAMAGE_MASS_SPEED_COF;
            this.damage += damage;//Math.min(this.hp - this.damage, damage);
            if (damage > this.hp) { this.breakup += (damage / this.hp) -1 }
            this.applyTorqueAtPointDist(ddy, ddy, -ny * u2, nx * u2, c.distA, -ru3, c.distB, rock);
		}
		rock.dx = (nx * tu1 - ny * u4);
		rock.dy = (ny * tu1 + nx * u4);
        if (!this.isHabitat) {
            if (!rock.isShip) {
                const drag = 1 - Math.random() * 0.1;
                rock.dx *= drag;
                rock.dy *= drag;
                const damage = Math.abs(((rock.dx - trdx) ** 2 + (rock.dy - trdy) ** 2) * ( rock.mass) * tu1) * DAMAGE_MASS_SPEED_COF;
                rock.damage += damage;//Math.min(rock.hp - rock.damage, damage);
                if (damage > rock.hp) { rock.breakup += (damage / rock.hp) -1 }
                if (!this.fixed)  {
                    rock.applyTorqueAtPointDist(-ddy, -ddy, -ny * u4, nx * u4, c.distB, -tu1, c.distA, this);
                } else {
                    ndx = - ny * u4;
                    ndy = nx * u4;;
                    const speed = (ndx * ndx + ndy * ndy) ** 0.5;
                    if (speed > 0) {
                        rock.dr = -(speed / c.distB) * Math.sign(u4);
                    }
                }
            } else {
                res = Math.abs(((rock.dx - trdx) ** 2 + (rock.dy - trdy) ** 2) * ( rock.mass) * tu1) * DAMAGE_MASS_SPEED_COF;
                //res = damage;//Math.min(rock.hp - rock.damage, damage);
               // const speedChange = Math.abs(((rock.dx - trdx) ** 2 + (rock.dy - trdy) ** 2) * this.mass * tu1) * DAMAGE_MASS_SPEED_COF;
                //rock.damage += speedChange;
            }
        } else {
            if (!rock.isShip) {
                const speedChange = Math.abs(((rock.dx - trdx) ** 2 + (rock.dy - trdy) ** 2) * this.mass * tu1) * DAMAGE_MASS_SPEED_COF;
                rock.damage += speedChange;
                rock.applyTorqueAtPointDist(-ddy, -ddy, -ny * u4, nx * u4, c.distB, -tu1, c.distA, this);
            }
        }
        return res;
	},
    doCollisionFixedWithShip(ship, collisionResult) {
		const c = collisionResult;
		const ddx = Math.cos(c.ang);
		const ddy = Math.sin(c.ang);


        const angWidth =  SPRITES[ship.sprIdx].mean / 2 / c.dist;
        const edA =  collisionMap.edgeDist(this.sprIdx, this.r - angWidth);
        const edB =  collisionMap.edgeDist(this.sprIdx, this.r + angWidth);
        //const meanDist = (edA + edB) / 2;
        const tdx = -ddy * this.dr * c.dist + this.dx;
        const tdy = ddx * this.dr * c.dist + this.dy;
        ship.x = this.x + ddx * c.dist;
        ship.y = this.y + ddy * c.dist;
        var v2x = Math.cos(this.r + angWidth) * edB - Math.cos(this.r - angWidth) * edA;
        var v2y = Math.sin(this.r + angWidth) * edB - Math.sin(this.r - angWidth) * edA;
        const dist = (v2x * v2x + v2y * v2y) ** 0.5;
        v2x /= dist;
        v2y /= dist;
        const v1x = ship.dx / 2 - tdx
        const v1y = ship.dy / 2 - tdy
        const cross = (v2x * v1y - v2y * v1x);

        if (cross > 0) {  // if move to the surface
            const dot = (v1x * v2x + v1y * v2y) * 2; // reflect
            ship.dx = (v2x * dot - v1x) + tdx;
            ship.dy = (v2y * dot - v1y) + tdy;
        } else if (cross > -0.1) {
            ship.dx = tdx
            ship.dy = tdy
        }
        ship.r += this.dr;

	},
    targetCheck() {
		const dx = target.x - this.x;
		const dy = target.y - this.y;
		const tDist = (dx * dx + dy * dy) ** 0.5;
        if(tDist < target.closestRockDist) {
            target.closestRockDist = tDist;
            target.closestRock = this;
        }
        ;
        this.targetDist =  Math.min((this.y *  this.y +  this.y *  this.y) ** 0.5, tDist);

        if (this.siblings) {
            if (!this.siblings.hidden &&  this.visualDist > this.siblings.hiddenDist && this.visualDist > GinPlayDist * 2) {
                this.hideSiblings();
                target.closestRock = this;
                target.closestRockDist = 0;
            } else if(this.siblings.hidden) {
                if(this.visualDist < this.siblings.hiddenDist * 2 && this.visualDist <= GinPlayDist ) {
                    this.showSiblings();
                     target.closestRockDist = 0;
                     target.closestRock = this;
                } else {
                    this.targetDist = this.visualDistance = GinPlayDist * 2;
                }
            }
        }

		if (tDist < this.radius + target.radius) {
			target.physics.apply(target);
			collisionMap.checkSprites(this.sprIdx, this.x, this.y, this.r, this.scale, target.sprIdx, target.x, target.y, target.r, 1, collisionResult);
			if (collisionResult.inside ) {
                const dx = target.dx - this.dx;
                const dy = target.dy - this.dy;
				target.dr = 0;
				//target.strength = 0;
				const damage = this.doCollision(target, collisionResult, false, false);
				target.physics.from(target);
				target.rockContact(this, Math.abs(damage));

                this.applyTorqueAtPoint(collisionResult.cx, collisionResult.cy, dx * target.mass, dy *  target.mass);
                this.hitCountdown = METAL_CLAIM_TIME;
			}
		}
        if (target.targetingDist >= 0 && this.countDown === 0) {
            const tx = target.targetingPos.x - this.x;
            const ty = target.targetingPos.y - this.y;
            const distSqr = tx * tx + ty * ty;
            if (distSqr < target.targetingDist) {
                target.targetingDist = distSqr;
                target.targeting = this;
            }
        }
        if (tDist > KEEP_ALIVE_DIST && this.radius < TOO_SMALL_SIZE && this.countDown === 0) {
            this.countDown = 2; //this.kill();
        }
	},
	targetHomeCheck() {
        target.physics.apply(target);
		const dx = target.x - this.x;
		const dy = target.y - this.y;
		const tDist = this.targetDist = (dx * dx + dy * dy) ** 0.5;
        //this.visualDist = tDist - this.radius;

        if (target.docked) {
            if(this.attached) {
                this.attached.targetDist = tDist;
                const tx = target.targetingPos.x - this.x;
                const ty = target.targetingPos.y - this.y;
                const distSqr = tx * tx + ty * ty;
                if (distSqr < target.closestAttachedDist) {
                    target.closestAttachedDist = distSqr;
                    target.closestAttached = this;
                }
            }
            return;
        }
		if (tDist < this.radius + target.radius) {
			if(!this.attached) {


                target.landed = true;

                collisionMap.checkSpriteAndBall(this.sprIdx, this.x, this.y, this.r, this.scale, target.sprIdx, target.x, target.y, 1, collisionResult);
                if(collisionResult.inside ) {

                    this.doCollisionFixedWithShip(target, collisionResult);
                    target.physics.from(target);
                    target.rockContact(this, 1);
                }
            } else {
                this.attached.targetDist = tDist;
                collisionMap.checkSpriteAndBall(this.sprIdx, this.x, this.y, this.r, this.scale, target.sprIdx, target.x, target.y, 1, collisionResult);
                if(collisionResult.inside ) {
                    target.landed = true;
                    this.doCollisionFixedWithShip(target, collisionResult);
                    target.physics.from(target);
                }
            }
		}
	},
	burnFixedHabitat() {
        const burn = this.attached.burn;
        const spread =  (Math.random() - 0.5) * 2;
        const scaleSpread = 1.1 - Math.abs(spread)
        const spread1 =  (Math.random() - 0.5) * 2;
        var r = this.r - Math.PI90;
        const x = this.attached.xAx * this.scale / 2;
        const y = this.attached.xAy * this.scale / 2;
        const cols = orbits[0].colors;
        const colLen = cols.length;
        const spr = SPRITES[this.sprIdx];
        const wPos = (Math.random() - 0.5) * spr.w * burn;
        const hPos = Math.random() ** 0.25 * spr.h;
        const xx = this.x + x * hPos;
        const yy = this.y + y * hPos;
        const xx1 = xx - y * wPos
        const yy1 = yy + x * wPos
        const size = Math.random() * this.scale * scaleSpread * 60 * 3 + 3 ;
        const fxMode = Math.random() < 0.05; // false is fire true is arc
        const sCols = fxMode ? ATTACHED_ARC_COLORS : ATTACHED_FIRE_COLORS;
        // size, ang, col, sparkSpriteSet, spriteSeq, attachedTo, time
        Math.random() < burn && FXs.newItem(FXs.types.sparks).init(
            xx1,
            yy1,
            fxMode ? size / 3 : size,
            this.r  + 0.5 * spread,
            sCols[Math.random() * 32 | 0], fxMode ? 3 : 4, true, this
        );
        Math.random() < 0.1 * burn && FXs.newItem(FXs.types.frags,1).initDelta(
            xx1,
            yy1,
            this.dx,
            this.dy,
            sCols[Math.random() * 32 | 0],
            (Math.random() * 20 + 10) * burn,
            WHITE_SPARKS_IDXS,
            Math.random() * 8 + 8,
            r + (Math.random() - 0.5) * 3,
            Math.random() * 3,
            120,
            0.5
        );
        Math.random() < burn && FXs.newItem(FXs.types.frags,1).initDelta(
            xx1,
            yy1,
            this.dx,
            this.dy,
            sCols[Math.random() * 32 | 0],
            (Math.random() * 20 + 10) * burn,
            WHITE_SPARKS_IDXS,
            Math.random() * 8 + 8,
            r + (Math.random() - 0.5),
            Math.random() * 1,
            255,
            1.5
        );
        // color, size, fragIdxs, scale, sprayDir, spread, alpha, curve
        // color, size, dir, colorArray, sprites, time = 36, spread = size
        Math.random() < 0.5 * burn && FXs.newItem(FXs.types.smoke).initDelta(
            xx1,
            yy1,
            this.dx,
            this.dy,
            0xFFFFFFFF,
            (size * 0.0004 + 0.01) * size * Math.random(),
            r + (Math.random() - 0.5),
            ATTACHED_SMOKE_COLORS, ATTACHED_SMOKE_SPR_IDXS,
            30 + Math.random() * 16,
            2,
        );
        const sm = (size + size * Math.random()) * 0.1;
        Math.random() < 0.1 * burn && FXs.newItem(FXs.types.smoke).initDelta(
            xx1,
            yy1,
            this.dx,
            this.dy,
            0xFFFFFFFF,
            sm,
            r + (Math.random() - 0.5),
            ATTACHED_SMOKE_COLORS, ATTACHED_SMOKE_SPR_IDXS,
            sm * 2,
            2,
        );
        Math.random() < 0.1 * burn && FXs.newItem(FXs.types.smoke, 2).initDelta(
            xx1,
            yy1,
            this.dx,
            this.dy,
            0xFFFFFFFF,
            size * 0.05 + 0.2 * size * Math.random(),
            r + (Math.random() - 0.5),
            ATTACHED_SMOKE_COLORS, ATTACHED_SMOKE_SPR_IDXS,
            15 + Math.random() * 16
        );
        Math.random() < 0.5 * burn && FXs.newItem(FXs.types.smoke, 1).initDelta(
            xx1,
            yy1,
            this.dx,
            this.dy,
            0x0FFFFFFF,
            0.1 * size * Math.random(),
            undefined,
            sCols, ATTACHED_SMOKE_SPR_IDXS,
            5 + Math.random() * 6
        );
    },
    kill() {
        this.changed = 2;
        this.alive = false;
        if (this.siblings) {
            const newParent = this.siblings.transfer(this)
            if (!newParent) { siblingPool.push(this.siblings) }
             else { this.otherHalf = newParent }
            this.siblings = undefined;
        } else { this.otherHalf = undefined }
         this.parent = undefined;
        if (this.addMassTo) {
            if (this.addMassTo.attachedTo) { this.addMassTo.attachedTo.mass += this.mass * MASS_GROW_MULTIPLIER }
            else { this.addMassTo.mass += this.mass * MASS_GROW_MULTIPLIER }
        } else { rocks.homeRock.mass += this.mass * MASS_GROW_MULTIPLIER }
    },
    update() {
        if (!this.alive) { return false }
        /* Todo remove the following line when happy with Sibblings */
        if(this.parent && !this.parent.siblings) {badSibling()}

        if (this.inParent) {
            this.targetDist = this.visualDist = GinPlayDist * 2;
            return true;
        }
		const distSqr = Math.max(rocks.homeRock.radius, this.x * this.x + this.y * this.y), dist = distSqr ** 0.5;
        this.distance = this.mass < MIN_RADAR_MASS_DETECT ? 2 : dist / 200;
		const accel = GRAV_CONST * (rocks.homeRock.mass / distSqr);
		const nx = this.x / dist;
		const ny = this.y / dist;
		this.dx -= nx * accel;
		this.dy -= ny * accel;
        const RODD = this.orbit.deDrag; //ROCK_ORBIT_DEDRAG;
        const ROD = this.orbit.drag;//ROCK_ORBIT_DRAG
        const RODS = this.orbit.dedragScale; //ROCK_ORBIT_DEDRAG_SCALE

      //  const deDrag = target.alive ? (this.distance < 1 ? RODD + (1 - RODD) * (1 -this.distance) * RODS: RODD) : 1;
		const vel = ((GRAV_CONST * rocks.homeRock.mass) / dist) ** 0.5 * (1 - RODD);
		this.dx += ((-ny * vel) - this.dx) * ROD;
		this.dy += ((nx * vel) - this.dy)  * ROD;
		this.x += this.dx;
		this.y += this.dy;
		this.r += this.dr;
        this.visualDist =  gView.worldDistanceFromOrigin(this)  - this.radius;
		target.alive && this.targetCheck();
		this.changed && (this.changed--);
        if (!this.alive) { return false }
		this.hitCountdown && (this.hitCountdown--);
        if (this.countDown) {
            this.scale *= 0.99;
            if (--this.countDown <= 0) {
                this.kill();
                return false
            }
        }
		return true;
	},
	updateFixed() {
        if (this.attached) {
            this.changed && (this.changed--);
            this.checkTarget = 10;
            this.attached.update(false);
            this.visualDist =  gView.worldDistanceFromOrigin(this)  - this.radius;
            target.alive && this.targetHomeCheck();
            if (this.damage > this.hp && this.size !== 0) {
                this.attached.burn *= 0.98;
                if (this.attached.burn < 0.003) {
                    this.attached.burn = 0
                    this.attached.dead = true;
                    this.alive = false;
                    return false;
                }
            }
            return true;
        } else {
            this.changed = 0;
            this.visualDist = 0;
            this.radius = (this.mass / this.massScale) ** (1 / 3);
            this.scale = this.radius / SPRITES[this.sprIdx].max;
            if(this.moveFunc) { this.moveFunc(this) }
            else {
                this.dx = 0;
                this.dy = 0;
            }
            this.r += this.dr;
            target.alive && this.targetHomeCheck();
            return true;
        }
	},
    initFixed() {
        if (this.attached) {
            this.attached.update(false);
        } else {
            this.changed = 0;
            this.visualDist = 0;
            if(this.moveFunc) { this.moveFunc(this) }
        }
    },
}
var GinPlayDist = 0;
var gView;
function Rocks() {
    cyclic = 1000;
	const items = [];
	const targetNear = [];
	const smashList = [];
    const incoming = [];
	var size = 0, tSize = 0, sSize = 0, iSize = 0, fixedCount = 0;
	var inPlayDist = 0;
    var currentWaveName;
    const stride = buffers.stride;
    const spritesBuf = buffers.draw;
	const spritesFXBuf = buffers.fx;
	const API = {
        collisionMap,
        incoming: false,
        incomingRocks: incoming,
        get incomingCount() { return iSize },
		set FXs(fxs) { FXs = fxs },
		set inPlayDistance(v) { GinPlayDist = inPlayDist = v + MAX_RADIUS * MAX_SCALE },
        set view(v) { gView = v },
		set target(t) { this.targetShip = target = t },
		set pickups(p) { pickups = p },
		set bonuses(b) { bonuses = b },
        homeRock: null,
        onRocksCompleted: undefined,
        delete() {
            this.reset();
            this.FXs = undefined;
            this.target = undefined;
            this.pickups = undefined;
            this.bonuses = undefined;
            this.targetShip = undefined;
            gView = undefined;
            rocks = undefined;
        },
		reset() {
            items.forEach(rock => rock.delete());
            targetNear.forEach(rock => rock.delete());
            smashList.forEach(rock => rock.delete());
            incoming.forEach(rock => rock.delete());
            siblingPool.empty;
            sSize = smashList.length = tSize = targetNear.length = size = items.length = 0
        },
		newFixedItem() {
			var rock;
            if (fixedCount < items.length) {
                if (fixedCount >= size) { rock = items[size++] }
                else {
                    rock = this.newItem();
                    items[size - 1] = items[fixedCount];
                    items[fixedCount] = rock;
                }
			} else { items[size ++] = rock = new Rock() }
			fixedCount ++
			return rock;
		},
		newItem() {
			var rock;
			if (items.length > size) { rock = items[size++] }
			else { items[size ++] = rock = new Rock() }
			return rock;
		},
        fillOrbits(name) {
            var idx = 0
            currentWaveName = name;
            orbits.length = 0;
            for(const orbit of data.rocks.orbits[name]) {
                orbits.push({...orbit, count: 0, ang: 0, maxCount: orbit.count});
            }
            while(idx < orbits.length) {
                const o = orbits[idx];
                while(o.count < o.maxCount) {
                    rocks.newItem().random(idx).init().asMemberOfCurrentTeam()
                }
                idx ++;
            }
        },
        tidy() {
            items.length = size;

        },
        update() {
            API.incoming = false;
			var tail = 0, head = 0, j = 0, k;
			while (j < sSize) { smashList[j++].smash(false) }
			sSize = 0;
            iSize = 0;
			const len = size;
			tSize = 0;
			while (head < fixedCount) {
				const r = items[head];
				if(r.updateFixed()) {
                    (r.damage >= r.hp && r.breakup > 0) && (smashList[sSize++] = r);
                    if (head > tail) {
                        items[head] = items[tail];
                        items[tail] = r;
                    }
                    tail++;
                    targetNear[tSize++] = r;
                }
                head++;
			}
            fixedCount = tail;
			//tail = head;
            /*if(target.useRadar) {
                while (head < len) {
                    const r = items[head];
                    if (r.update()) {
                        if (r.targetDist < inPlayDist) {
                            if (r.damage <  r.hp) {
                                targetNear[tSize++] = r
                                if (r.distance < 1 && !r.countDown) {
                                    API.incoming = true;
                                    incoming[iSize++] = r;
                                }
                            }
                        }
                        if (head > tail) {
                            items[head] = items[tail];
                            items[tail] = r;
                        }
                        tail++;
                        if (r.damage >=  r.hp || (r.breakup > 0 &&  Math.random() < r.breakup / 20)) { smashList[sSize++] = r }
                    }
                    head++;
                }
            } else {*/
                while (head < len) {
                    const r = items[head];
                    if (r.update()) {
                        if (r.targetDist < inPlayDist) {
                            r.damage < r.hp && (targetNear[tSize++] = r);
                        }
                        if (head > tail) {
                            items[head] = items[tail];
                            items[tail] = r;
                        }
                        tail++;
                        if (r.damage >= r.hp|| (r.breakup > 0 &&  Math.random() < r.breakup / 20)) { smashList[sSize++] = r }
                    }
                    head++;
                }
           // }
			size = tail;
			rockCount = size;

			const bF = spritesBuf.data, bFXF = spritesFXBuf.data;
			const bI = spritesBuf.UI32, bFXI = spritesFXBuf.UI32;
            var i = spritesBuf.length * stride, ii = spritesFXBuf.length * stride;
            j = 0;
            while(j < tSize) {
                const r = targetNear[j];
                if (j < fixedCount) {
                    k = fixedCount;
                    while( k < tSize) { r.rockHitRock(targetNear[k++]) }
                    if (r.attached && r.attached.selfRender) { j++; continue }
                } else {
                    k = j + 1;
                    while( k < tSize) { r.rockHitRock(targetNear[k++]) }
                }
                if (r.visualDist < inPlayDist) {
                    bF[i    ] = r.x;
                    bF[i + 1] = r.y;
                    bF[i + 2] = r.scale;
                    bF[i + 3] = r.scale;
                    bF[i + 5] = bF[i + 4] = 0.5;
                    bF[i + 6] = r.r;
                    bI[i + 8] = r.color;
                    bI[i + 9] = r.sprIdx | BIT_DEFAULT_Z_INDEX;
                    i += stride;
                    spritesBuf.length ++;
                }
                j++;
            }
            j = 1;
            while (j < fixedCount) {
                const r = items[j++];
                if (r.attached && r.visualDist < inPlayDist) {
                    r.attached.burn > 0 && r.burnFixedHabitat();
                    if(r.attached.behaviour) {
                        const B = r.attached.behaviour
                        B.updateSprite && (i = B.updateSprite(spritesBuf, bF, bI, stride, i));
                        B.updateFXSprite && (ii = B.updateFXSprite(spritesFXBuf, bFXF, bFXI, stride, ii));
                        B.updateSpriteB &&  B.updateSpriteB(buffers.drawB, stride);
                    }
                }
            }
            if (size === fixedCount) {
                this.onRocksCompleted && this.onRocksCompleted(currentWaveName);
            }
		},
        get randomRock() { return items[Math.random() * (size - fixedCount)  + fixedCount | 0] },
		eachInPlay(cb, data) {
			var i = 0;
			while (i < tSize) {
				const r = targetNear[i++];
				if (r.alive && !cb(r, data)) { return }
			}
		},
		each(cb) {
			var i = 0;
			while (i < size) {
				const r = items[i++];
				if (r.alive && !cb(r)) { return }
			}
		},
        nearest(x, y, min, max) {
			var i = 0, found;
            min *= min;
            max *= max;
			while (i < size) {
				const r = items[i++];
				if (r.alive) {
                    const dx = x - r.x, dy = y - r.y;
                    const distSqr = dx * dx + dy * dy;
                    if (distSqr < max && distSqr > min) {
                        max = distSqr
                        found = r;
                    }
                }
            }
            return found;
        },
	};
	rocks = API;
	return API;
};