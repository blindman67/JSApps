import "../../src/utils/MathExtensions.js";
import {Vec2} from "../../src/Vec2.js";
import {Physics2D, Shapes2D} from "../../src/Physics2D.js";
import {data} from "./data.js";
import {Aoids} from "./Aoids.js";
import {buffers, BUFFER_POSITIONS} from "./Buffers.js";
import {Hull} from "./Ship/Hull.js";
import {Power} from "./Ship/Power.js";
import {Thruster} from "./Ship/Thruster.js";
import {Gun} from "./Ship/Gun.js";
import {Shield} from "./Ship/Shield.js";
export {Alien};
const MOUNTS = {
    hull: Hull,
    power: Power,
    shield: Shield,
    gun: Gun,
    thruster: Thruster,
};


function Alien() {


}
Alien.prototype = {



}

import "../../src/utils/MathExtensions.js";
import {Vec2} from "../../src/Vec2.js";
import {Physics2D, Shapes2D} from "../../src/Physics2D.js";
import {data} from "./data.js";
import {Aoids} from "./Aoids.js";
import {buffers, BUFFER_POSITIONS} from "./buffers.js";
import {HullSimple} from "./Ship/Hull.js";
import {PowerSimple} from "./Ship/Power.js";
import {ThrusterSimple} from "./Ship/Thruster.js";
import {GunSimple} from "./Ship/Gun.js";
import {ShieldSimple} from "./Ship/Shield.js";
export {Alien};
const MOUNTS = {
    hull: HullSimple,
    power: PowerSimple,
    shield: ShieldSimple,
    gun: GunSimple,
    thruster: ThrusterSimple,
};

const SUN_MASS = data.background.sunMass;
const GRAV_CONST = data.background.gravConstant;

const SPRITES = data.spriteSheet.sprites;
const wV1 = new Vec2(), wV2 = new Vec2(), wV3 = new Vec2(), wV4 = new Vec2(), wZ1  = new Vec2(0,0);
var FXs, renderer,  rocks;

function Alien(type, configuration) {
	this.type = data.ships[type];
    this.config = this.type.configurations[configuration];
    this.bufPos = {...BUFFER_POSITIONS};
	this.tick = 0;
	this.explode = 0;
	this.damage = 0;
	this.maxDamage = 0;
    this.mass = 0;
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.dx = 0;
    this.dy = 0;
    this.dr = 0;
    this.visible = true;
    this.alive = true;
	this.mounts = {};
	this.controls = {};
	this.mountArray = [];
	this.visibleMounts = [];
	for(const mountDesc of this.config.mounts) {
        const [mountName, mountOptionName] = mountDesc.split(",");
		const mount = this.type.mounts[mountName];
		const {tech, display} = data.shipTech.getByMount(mount, mountOptionName);
        const m = this.mounts[mountName] = new MOUNTS[mount.type](this, mount, tech, display)
		this.mountArray.push(m);
		m.visible && this.visibleMounts.push(m);
	}
	for (const [name, mounts] of Object.entries(this.type.controls)) {
		const cont = this.controls[name] = [];
		for (const mountName of mounts) {
			this.mounts[mountName] && cont.push(this.mounts[mountName]);
		}
	}
	this.power = this.mounts.power;
    for(const mount of this.mountArray) { mount.update(this) }
    this.useTargeting = this.controls.fireMain.some(gun => gun.tech.useTargetingComputer === true);
}
Alien.prototype = {
    delete() {
        this.release();
        this.mountArray.forEach(mount => mount.delete());
        this.mountArray.length = 0;
        this.visibleMounts.length = 0;
        this.mounts = undefined;
        this.controls = undefined;
        this.power = undefined;
		FXs = undefined;
        rocks = undefined;
        this.bullet = undefined;
        this.physics = undefined;
    },
    release() {
        buffers.draw.shader.release(0, this.bufPos.drawRollback);
        buffers.fx.shader.release(0, this.bufPos.fxRollback);
        buffers.overlay.shader.release(0, this.bufPos.overlayRollback);
        buffers.draw.shader.clear();
        buffers.fx.shader.clear();
        buffers.overlay.shader.clear();
    },
	setup(fxs, _rocks, bullets) {
		FXs = fxs;
        rocks = _rocks;
        this.bullets = bullets;
        this.bufPos.setupShipMountSprites(this);
        for(const mount of this.mountArray) { mount.ready() }
		return this;
	},
	updateSprites() {
        if (!this.alive ) { return }
		const B = buffers;
        const Bp = this.bufPos;
		const b = B.draw.data, bL = B.fx.data, bI = B.draw.UI32, bLI = B.fx.UI32;
		const o = B.offsets;
		var i = Bp.drawStart, ii = Bp.fxStart, j = Math.min(Bp.drawCount, Bp.fxCount), jj = Math.max(Bp.drawCount, Bp.fxCount) - j;
		const moreFX = Bp.drawCount < Bp.fxCount;
		const ang = this.r + Math.PI / 2, x = this.x, y = this.y;
        if (this.visible) {
            while (j--) {
                bL[ii + o.x] = b[i + o.x] = x;
                bL[ii + o.y] = b[i + o.y] = y;
                bL[ii + o.r] = b[i + o.r] = ang;
                i += o.stride;
                ii += o.stride;
            }
            if (jj) {
                if (moreFX) {
                    while (jj--) {
                        bL[ii + o.x] = x;
                        bL[ii + o.y] = y;
                        bL[ii + o.r] = ang;
                        ii += o.stride;
                    }
                } else {
                    while (jj--) {
                        b[i + o.x] = this.x;
                        b[i + o.y] = this.y;
                        b[i + o.r] = ang;
                        i += o.stride;
                    }
                }
            }
            for(const mount of this.visibleMounts) { mount.spritesUpdate(this)  }
        }
	},

	fire(gunSet) {

		if(gunSet.length && (!this.mounts.shield || (!this.mounts.shield.activated))) {
			for(const gun of gunSet) {
				gun.fire(0, 10000, 10000) && (fired += 1);
			}
		}
	},
    update() {
		if(this.explode) {
            if(this.alive) {
                this.release();
                this.alive = false;
            }
		} else {
            this.mounts.hull.animatePilot = Aoids.viewScale > 1;
			this.tick += 1;
			this.mass = 0
			for(const mount of this.mountArray) { mount.update(this) }

			this.x = this.dx;
			this.y = this.dy;
			this.r = this.dr;


		}
	},
}