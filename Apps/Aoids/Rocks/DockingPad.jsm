import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
export {DockingPad};
const LANDING_DISTANCE = data.habitats.landingPadControlDist;
const STATUS = data.habitats.dockingTypes;
const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const DOCKING_RADAR_SPR_IDX = data.spriteSheet.names.dockingGuide;
const DOCKING_LIGHTS_SPR_IDXS = data.spriteSheet.names.habitatLandingLights;
const DOCKING_LIGHTS_FLASH_SPR_IDX = data.spriteSheet.names.FXSmallStar;
const DOCKING_STAR_SPR_IDX = data.spriteSheet.names.FXGlowStar | BIT_DEFAULT_Z_INDEX;
const SPR_SCALE = LANDING_DISTANCE * 2 / data.spriteSheet.sprites[DOCKING_RADAR_SPR_IDX].h;
const DOCK_UNIT_DIST = 0.05;
const AUTO_DOCK_UNIT_DIST = 0.8;
const AUTO_LAND_SPEED = 4;
const clampTop = 8, clampBottom = 30, clampSpeed = 0.25;
const wV1 = new Vec2(), pos = new Vec2(), wV2 = new Vec2(), cV = new Vec2(), left = new Vec2();

function DockingPad(owner, desc) {
    if (typeof desc.parts === "string") {
        desc.parts = data.spriteSheet.names[desc.parts];

    }
    this.owner = owner;
    this.dockingRadar = 0;
    this.desc = desc;
    this.status = STATUS.none;
    this.approchStatus = STATUS.none;
    this.color = desc.dockingColors[this.status];
    this.lightATime = 0;
    this.lightBTime = 0;
    this.lightAFlash = false;
    this.lightBFlash = false;
    this.lightASprIdx = desc.parts[0];
    this.lightBSprIdx = desc.parts[0];
    this.lightASpeed = 0.25 + Math.random() * 0.1;
    this.lightBSpeed = 0.3 + Math.random() * 0.05;
    this.clampPos = 11;
    this.up = new Vec2();
    this.pos = new Vec2();
    this.landingDist = 0;

    this.docked = false;
    owner.selfRender = true;
}
DockingPad.prototype = {
    delete() { this.owner = undefined },
    kill() {
        this.base.remove(this.owner.rock);
        this.owner.selfRender = false;
        this.owner.rocks = undefined;
        this.owner.behaviour = undefined;
        this.owner = undefined;
        this.desc =undefined;
    },
    update() {
        if (this.owner.rock.size > 0) { // gun is dead. Remove this object and cleanup
            this.kill();
            return;
        }
        if (this.owner.teamIdx === this.owner.rocks.targetShip.teamIdx) { this.checkDocking() }
        this.color = 0x00FFFFFF;
        this.updateVisuals();
    },
    checkDocking() {
        const d = this.owner.desc;
        const r = this.owner.rock;
        const t = this.owner.rocks.targetShip;
        this.up.init(this.owner.xAx, this.owner.xAy);
        this.pos.init(r.x, r.y).addScaled(t.radius - (this.clampPos - 18) * r.scale, this.up);
		const dx = t.x - this.pos.x;
		const dy = t.y - this.pos.y;
		const tDist = (dx * dx + dy * dy) ** 0.5;

        if (tDist  < d.dockingDist) {
            if (this.approchStatus === STATUS.inRange || Math.abs(t.physics.delta.cross(this.up)) < 6) {
                this.approchStatus = STATUS.inRange;
                const shipRange  = tDist / d.dockingDist;
                wV2.copyOf(this.pos).addScaled(d.dockingDist, this.up, wV1);
                let distFromCenter = cV.init(t.x, t.y).distanceFromLineSeg(wV2, wV1, cV);
                if (this.status !== STATUS.autoDock) {
                    const dist = Vec2.u * d.dockingDist;
                    this.landingSpeed = dist - this.landingDist;
                    this.landingDist = dist;
                }

                distFromCenter /= (SPRITES[this.owner.desc.parts[0]].w / 2);
                if (this.status === STATUS.none) {
                    if (distFromCenter < 1) { this.status = STATUS.landing }
                } else if (this.status === STATUS.landing || this.status === this.landingAborted) {
                    this.getLandingState(shipRange, distFromCenter);
                } else if (this.status === STATUS.autoDock) {
                    this.landingSpeed += (AUTO_LAND_SPEED - this.landingSpeed) * 0.1;
                    if(this.landingDist > 0) {
                        this.landingDist -= this.landingSpeed;
                        this.positionTarget();
                    } else {
                        this.dockTarget(false);
                    }
                } else if (this.status === STATUS.docked) {
                    this.positionTarget();
                    if (t.mainThrustOn) { this.status = STATUS.undocking }
                } else if (this.status === STATUS.undocking) {
                    this.positionTarget();
                    if (t.mainThrustOn) {
                        if (this.clampPos <= clampTop) { this.status = STATUS.liftOff }
                    } else {
                         this.status = STATUS.docked;
                    }
                } else if (this.status === STATUS.liftOff) {
                    if (shipRange > 0.3) {
                        this.status = STATUS.departed;
                        t.dockingInProgress  = false;
                        t.docked = false;
                        t.onPad = undefined;
                        t.autoPilot = false;
                        this.docked = false;
                    }
                }
            }
        } else if (this.approchStatus === STATUS.inRange) {
            t.dockingInProgress  = false;
            t.docked = false;
            t.onPad = undefined;
            t.autoPilot = false;
            this.status = STATUS.none;
            this.approchStatus = STATUS.none;
            this.dockingRadar = 0;
        }
    },
    dockTarget(retracted = false) {
        const r = this.owner.rocks;
        const t = this.owner.rocks.targetShip;
        if (this.owner.teamIdx === t.teamIdx) {
            this.status = STATUS.docked;
            this.docked = true;
            this.approchStatus = STATUS.inRange;
            t.onPad = this.owner.rock;
            t.engineShutDown = true;
            t.docked = true;
            t.dockingInProgress = false;
            t.autoPilot = false;
            this.positionTarget();
            this.clampPos = retracted ? clampBottom : this.clampPos;
            t.bases.deliver(this.owner.rock, t.metals, 1);
        }
    },
    getLandingState(shipRange, distFromCenter) {
        const r = this.owner.rocks;
        const t = this.owner.rocks.targetShip;
        const p = t.physics;
        const tAngle = this.up.angleTo(p.transform), aAngle = Math.abs(tAngle);;

        left.init(-this.up.y, this.up.x);
        const approch = wV1.copyOf(p.delta).normalize().cross(left);
        if (this.status === STATUS.landing || this.status === this.landingAborted) {
             t.dockingInProgress = true;
            if (aAngle > 3 || p.speed > 100 || approch > 0.3 || distFromCenter > 2) {
                this.status = this.landingAborted;
            } else {
                p.p.x += (cV.x - p.p.x) * (0.4 - aAngle * 0.2);
                p.p.y += (cV.y - p.p.y) * (0.4 - aAngle * 0.2);
                if (distFromCenter < 0.2 && shipRange < AUTO_DOCK_UNIT_DIST) {
                     this.landingSpeed = - this.landingSpeed ;
                     this.status = STATUS.autoDock;
                     t.autoPilot = true;
                } else {
                    this.status = this.landing;
                    if (shipRange < DOCK_UNIT_DIST) { this.dockTarget(false) }
                }
            }
        }
    },
    positionTarget() {
        const r = this.owner.rock;
        const t = this.owner.rocks.targetShip
        const p = t.physics;
        if (this.status === STATUS.autoDock) {
            const tAngle = this.up.angleTo(p.transform);
            wV1.copyOf(p.p);
            wV1.copyOf(wV2.copyOf(this.pos).addScaled(this.landingDist, this.up));
            wV1.sub(p.p, p.delta);
            p.angle -= tAngle * 0.1;
            p.w += (r.dr - p.w) * 0.1;
        } else {
            p.p.copyOf(wV2.init(r.x, r.y).addScaled(t.radius - (this.clampPos - 18) * r.scale, this.up));
            p.delta.init(r.dx, r.dy);
            p.angle = r.r - Math.PI90;
            p.w = r.dr;
        }
    },
    updateVisuals() {
        if ( this.approchStatus === STATUS.inRange) {
            this.dockingRadar = this.dockingRadar < 0.98 ? this.dockingRadar += 0.02 : 1;
            const p = DOCKING_LIGHTS_SPR_IDXS;
            this.lightATime += this.lightASpeed;
            let idx = this.lightATime % p.length | 0;
            this.lightASprIdx = p[idx];
            this.lightAFlash = idx === 3;
            this.lightBTime += this.lightBSpeed;
            idx = this.lightBTime % p.length | 0;
            this.lightBSprIdx = p[idx];
            this.lightBFlash = idx === 3;
            if(this.status === STATUS.docked) {
                this.clampPos = this.clampPos <= clampBottom - clampSpeed ? this.clampPos + clampSpeed : clampBottom;
            } else {
                this.clampPos = this.clampPos >= clampTop + clampSpeed ? this.clampPos - clampSpeed : clampTop;
            }
        } else {
            this.clampPos = this.clampPos <= clampBottom - clampSpeed ? this.clampPos + clampSpeed : clampBottom;
            this.dockingRadar = this.dockingRadar > 0.02 ? this.dockingRadar -= 0.02 : 0;
        }
    },
    updateSprite(buf, bF, bI, stride, i) {
		const t = this;
        const o = this.owner;
        const p= o.desc.parts
        const r = o.rock;
        const sc = r.scale;
        const rot = r.r;
        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = sc;
        bF[i + 3] = sc;
        bF[i + 4] = 0.5;
        bF[i + 5] = (56 - 32.25) / 56;
        bF[i + 6] = rot;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[1];
        i += stride;
        buf.length += 1;
        if (t.dockingRadar > 0) {
            bF[i    ] = this.pos.x;
            bF[i + 1] = this.pos.y;
            bF[i + 2] = 5;
            bF[i + 3] = 5;
            bF[i + 4] = 0.5;
            bF[i + 5] = 0.5;
            bF[i + 6] = 0;
            bI[i + 8] = this.status === this.landingAborted ? 0x7F0000FF: 0x7FFFFFFF;
            bI[i + 9] = DOCKING_STAR_SPR_IDX;
            i += stride;
            bF[i    ] = r.x;
            bF[i + 1] = r.y;
            bF[i + 2] = sc;
            bF[i + 3] = sc;
            bF[i + 4] = 71 / 6;
            bF[i + 5] =  23 / 8;
            bF[i + 6] = rot;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = t.lightASprIdx;
            i += stride;
            bF[i    ] = r.x;
            bF[i + 1] = r.y;
            bF[i + 2] = sc;
            bF[i + 3] = sc;
            bF[i + 4] = (6 - 71) / 6;
            bF[i + 5] =  23 / 8;
            bF[i + 6] = rot;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = t.lightBSprIdx;
            i += stride;
            buf.length += 3;
        }
        return i;
    },
    updateSpriteB(buf, stride) {
        const p = this.owner.desc.parts
        const r = this.owner.rock;
        const bF = buf.data
        const bI = buf.UI32
        var i = buf.length * stride;
        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = r.scale;
        bF[i + 3] = r.scale;
        bF[i + 4] = 0.5;
        bF[i + 5] =  (57 - this.clampPos) / 57;
        bF[i + 6] = r.r;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[2] | BIT_DEFAULT_Z_INDEX;
        i += stride;
        bF[i    ] = r.x;
        bF[i + 1] = r.y;
        bF[i + 2] = r.scale;
        bF[i + 3] = r.scale;
        bF[i + 4] = 0.5;
        bF[i + 5] = 0.5;
        bF[i + 6] = r.r;
        bI[i + 8] = 0xFFFFFFFF;
        bI[i + 9] = p[0] | BIT_DEFAULT_Z_INDEX;
        buf.length += 2;
    },
	updateFXSprite(buf, bF, bI, stride, i) {
		const t = this;
        if (t.dockingRadar > 0) {
            const o = this.owner;
            const r = o.rock;
            const rot = r.r;
            bF[i    ] = r.x;
            bF[i + 1] = r.y;
            bF[i + 2] = SPR_SCALE;
            bF[i + 3] = SPR_SCALE;
            bF[i + 4] = 0.5;
            bF[i + 5] = 1;
            bF[i + 6] = rot;
            bI[i + 8] = this.status === this.landingAborted ? 0x7F0000FF: 0x7FFFFFFF;// | ((t.dockingRadar * 255) << 24);
          //  bI[i + 9] = DOCKING_RADAR_SPR_IDX | BIT_DEFAULT_Z_INDEX;
            bI[i + 9] = DOCKING_STAR_SPR_IDX | BIT_DEFAULT_Z_INDEX;
            buf.length ++;
            i += stride;
            const sc = r.scale * 0.5;
            if (t.lightAFlash) {
                bF[i    ] = r.x;
                bF[i + 1] = r.y;
                bF[i + 2] = sc;
                bF[i + 3] = sc;
                bF[i + 4] = (79 / 45) * sc;
                bF[i + 5] = (30 / 43) * sc;
                bF[i + 6] = rot;
                bI[i + 8] = 0xFF5588FF;
                bI[i + 9] = DOCKING_LIGHTS_FLASH_SPR_IDX | BIT_DEFAULT_Z_INDEX;
                buf.length ++;
                i += stride;
            }
            if (t.lightBFlash) {
                bF[i    ] = r.x;
                bF[i + 1] = r.y;
                bF[i + 2] = sc;
                bF[i + 3] = sc;
                bF[i + 4] = ((45-102) / 45) * sc;
                bF[i + 5] = (30 / 43) * sc;
                bF[i + 6] = rot;
                bI[i + 8] = 0xFF5588FF;
                bI[i + 9] = DOCKING_LIGHTS_FLASH_SPR_IDX | BIT_DEFAULT_Z_INDEX;
                buf.length ++;
                i += stride;
            }
        }
		return i;
	},
}