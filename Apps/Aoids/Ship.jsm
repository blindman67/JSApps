import "../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../src/Vec2.jsm";
import {Physics2D, Shapes2D} from "../../src/Physics2D.jsm";
import {data} from "./data.jsm";
import {Aoids} from "./Aoids.jsm";
import {buffers} from "./buffers.jsm";
import {Hull} from "./Ship/Hull.jsm";
import {Power} from "./Ship/Power.jsm";
import {Thruster} from "./Ship/Thruster.jsm";
import {Gun} from "./Ship/Gun.jsm";
import {Shield} from "./Ship/Shield.jsm";
export {Ship};
const MOUNTS = {
    hull: Hull,
    power: Power,
    shield: Shield,
    gun: Gun,
    thruster: Thruster,
};

const DANGER_DISTANCE_SCALE = 8;
const DANGER_DISTANCE = data.background.sunRadius * DANGER_DISTANCE_SCALE;
const SHIP_SMOKE_COLORS = data.fx.shipDamageSmokeColors;
const SHIP_SHOCKWAVE_COLORS = data.fx.shipExplodeShockwaveColors;
const SHIP_SPARK_COLORS = data.fx.shipExplodeSparkColors;
const DAMAGE_SPARKS_IDXS = data.overlaySpriteSheet.names.whiteSparks;
const GRAV_CONST = data.background.gravConstant;
const MAX_METAL_BONUS = 20;

const OVERLAY_LOCATOR_RING_IDX = data.overlaySpriteSheet.names.locatorRing;
const OVERLAY_POINTER_SPR_IDX = data.overlaySpriteSheet.names.pointer;
const OVERLAY_POINTER_FULL_SPR_IDX = data.overlaySpriteSheet.names.pointerFull;
const OVERLAY_WHITE_SPR_IDX = data.overlaySpriteSheet.names.whiteSquare;
const OVERLAY_ORBIT_INDICATOR_SPR_IDX = data.overlaySpriteSheet.names.orbitIndicator;
const OVERLAY_HOME_POINTER_SPR_IDX = data.overlaySpriteSheet.names.homePointer;
const OVERLAY_ROCK_POINTER_SPR_IDX = data.overlaySpriteSheet.names.rockPointer;
const METAL_SYMBOL_SPR_IDX = data.overlaySpriteSheet.names.metalSymbols;
const FUEL_SYMBOL_SPR_IDX = data.overlaySpriteSheet.names.fuelSymbol;
const SPRITES = data.spriteSheet.sprites;
const wV1 = new Vec2(), wV2 = new Vec2(), wV3 = new Vec2(), wV4 = new Vec2(), wZ1  = new Vec2(0,0);


var mouse, keys, sprites, spritesFX, FXs, overlay, renderer, view, rocks;

function Ship(type, configuration, teamIdx, bullets) {
	this.type = data.ships[type];
    this.config = this.type.configurations[configuration];
    this.bullets = bullets;
    this.teamIdx = teamIdx;
	Aoids.message = "You have arrived";


	this.tick = 0;
	this.massTare = 0
	this.mass = 0
	this.points = 0; // scoring
	this.explode = 0;
    this.damageVal = 0;
    this.damageDir = 0;
    this.screenPos = new Vec2();
    this.statusPos = new Vec2();
    this.orbitVector = new Vec2();
    this.dockingNav = false;
    this.inOrbitIndicator = 0;
	/* The following are for rock collisions */
	this.x = Math.cos(0) * 4000;
	this.y = Math.sin(0) * 4000;
	this.r = 0;
	const vel = ((GRAV_CONST * (3000**3)) / 4000) ** 0.5;
	this.dx = -Math.sin(0) * vel;
	this.dy = Math.cos(0) * vel;
	this.dr = 0;
	/* end rock collision props */
	/* For simulated turn to mouse */
	this.rC = 0;
	this.rCO = 0;
	this.rR = 0;
	/* end */
	//this.pickupValue = 1;
	this.screenRatio = 1;
	this.isShip = true;
	/* Next values to make the ship have same props as rock. These values are not used by the Ship object */
	this.size = 0;
	this.strength = 10000000000;
	/* End of rock like props */

    this.visible = true;
    this.alive = true;
	this.speed = 0;
	this.pickupPower =0;
	this.turnAccel = 0;
	this.turnDrag = 0;
	this.spaceDrag = 0;
    this.useRadar = false;
	this.landed = false;  // true if touching home rock
    this.metals = Object.values(data.rocks.metalTypes).map((type,i) => {
        return {
            ...type,
            count: 0,
            oldCount: 0,
            maxCount: this.type.maxMetals[i],
            flash: 0,
        };
    });
    this.hullDamagedFlash = false;
    //this.metalBonus = 0;
   // this.metalBonusFlash = 0;
    this.closestRockDist = Infinity;
    this.closestRock = undefined;
    this.closestAttachedDist = Infinity;
    this.closestAttached = undefined;
    this.onPad = undefined;
    this.padDist = 0;
    this.homePad = undefined;
    this.dockingInProgress = false;
    this.docked = false;
    this.inspecting = undefined; // When docked and in some memus this is the rock the view is locked to. If glancing then view is temp
    this.glancing = true; // when true inspecting is lose
    this.autoPilot = false;
    this.mainThrustOn = false;
    this.engineShutDown = false; // set to true at docking. Turns off main thrusters and waits for injectors and reactor to vent. Prevents quirky docking behavioure if mouse is click quickly at docking
    this.targetingPos = new Vec2();
    this.targetingDist = Infinity;
    this.targeting = undefined;
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
	this.mass = 0;  // calculated per frame via mounts
    for(const mount of this.mountArray) { mount.update(this) }
	this.physics = new Physics2D(this.x, this.y, this.dx, this.dy,  this.mass, Shapes2D.Disk, this.turnDrag, 0);//this.spaceDrag);
    this.useTargeting = this.controls.fireMain.some(gun => gun.tech.useTargetingComputer === true);
    this.targetingDist = this.useTargeting ? Infinity : -1;
    this.lockingOnTarget = false;
    this.lockingOnTargetTimer = 0;
}
Ship.prototype = {
	inPlayDistance: 0,
    delete() {
        //this.release();
        this.mountArray.forEach(mount => mount.delete());
        this.mountArray.length = 0;
        this.visibleMounts.length = 0;
        this.mounts = undefined;
        this.controls = undefined;

        this.power = undefined;
        this.onPad = undefined;
        this.homePad = undefined;
        this.targeting = undefined;
        this.closestRock = undefined;
 		mouse = undefined;
		keys = undefined;
		view = undefined;
		FXs = undefined;
		renderer = undefined;
        rocks = undefined;
		spritesFX = undefined;
		sprites =  undefined;
		overlay = undefined;
        this.bullet = undefined;
        this.physics = undefined;
    },
    setupShipMountSprites() {
        const O = buffers.offsets;
        const z = 0.09;
        this.visibleMounts.sort((a, b) => a.renderOrder - b.renderOrder);
        for(const mount of this.visibleMounts) { mount.spritesAdd(buffers.draw, z) }
        for(const mount of this.visibleMounts) { mount.spritesAddFX(buffers.fx, z) }
        for(const mount of this.mountArray) { mount.ready() }

    },
	setup(_renderer, fxs, _mouse, _keys, _view, _rocks) {
		mouse = _mouse;
		keys = _keys;
		view = _view;
		FXs = fxs;
		renderer = _renderer;
        rocks = _rocks;
		sprites =  buffers.draw.shader;
		spritesFX =  buffers.fx.shader;
		overlay =  buffers.overlay.shader;
        this.setupShipMountSprites();


		return this;
	},
    addMounts(sprIdx, ...mounts) {
        Aoids.addEvent(Aoids.eventTypes.frameEnd, this.resetMounts.bind(this), mounts);
    },
    resetMounts(mounts){
        for(const mountDesc of mounts) {
            const [mountName, mountOptionName] = mountDesc.split(",");
            const mount = this.type.mounts[mountName];
            const {tech, display} = data.shipTech.getByMount(mount, mountOptionName);
            if (this.mounts[mountName]) {
                const oldMount = this.mounts[mountName];
                const mArrayIdx = this.mountArray.indexOf(oldMount);
                const visArrayIdx = oldMount.visible ? this.visibleMounts.indexOf(oldMount) : -1;
                const m = this.mounts[mountName] = new MOUNTS[mount.type](this, mount, tech, display)
                this.mountArray[mArrayIdx] = m;
                m.visible && (this.visibleMounts[visArrayIdx] = m);
               oldMount.delete()
            } else {
                const m = this.mounts[mountName] = new MOUNTS[mount.type](this, mount, tech, display)
                this.mountArray.push(m);
                m.visible && this.visibleMounts.push(m);
            }
        }
        for (const [name, mounts] of Object.entries(this.type.controls)) {
            const cont = this.controls[name] = [];
            for (const mountName of mounts) {
                this.mounts[mountName] && cont.push(this.mounts[mountName]);
            }
        }
        this.power = this.mounts.power;
        this.mass = 0;  // calculated per frame via mounts
        for(const mount of this.mountArray) { mount.update(this) }
        this.useTargeting = this.controls.fireMain.some(gun => gun.tech.useTargetingComputer === true);
        this.targetingDist = this.useTargeting ? Infinity : -1;
        this.setupShipMountSprites();
    },
    inspect(rock, glancing = false) {
        this.inspectingNext = this.inspecting !== rock;
        this.inspecting = rock;
        this.glancing = glancing;

    },
    set land(landingPad) {
        if(landingPad !== undefined && !this.docked) {
            if(landingPad.attached.behaviour && landingPad.attached.behaviour.dockTarget){
                landingPad.attached.behaviour.dockTarget();
                this.onPad = landingPad;
                this.homePad = this.onPad;
                this.tick = 0;
            }
        } else if(this.docked) {
            this.homePad = this.onPad;
            this.onPad = undefined;
            this.padDist = 1;
            this.docked = false;
            this.dockingDist = 1;
        }

    },
	updateSprites() {
        if (!this.alive ) { return }
        if (this.visible) {
            const ang = this.r + Math.PI / 2, x = this.x, y = this.y;
            for(const mount of this.visibleMounts) { mount.spritesUpdate(x, y, ang)  }
        }
        return;
    },
    oldUpdateSprites() {
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
            for(const mount of this.visibleMounts) { mount.spritesUpdate()  }
        } else {
            while (j--) {
                bLI[ii + o.color] = bI[i + o.color] = 0
                i += o.stride;
                ii += o.stride;
            }
            if (jj) {
                if (moreFX) {
                    while (jj--) {
                        bLI[ii + o.color] = 0;
                        ii += o.stride;
                    }
                } else {
                    while (jj--) {
                        bI[i + o.color] = 0;
                        i += o.stride;
                    }
                }
            }
        }
	},
	rockContact(rock, impactPower) {
        if (!rock.attached && rock.fixed) {
            Aoids.bases.createPad(rock, this);
            return


        }
        if (!this.explode) {
            var damage = 0;
            if(this.mounts.shield){
                const shieldAmount = this.mounts.shield.defend(impactPower * 10);
                damage = impactPower * 10 - shieldAmount;
                //Aoids.logger.log("S: " + (impactPower*10).toFixed(2) + " SA: " + shieldAmount.toFixed(2) + " D: " + damage.toFixed(2));
            } else {
                damage = impactPower;
            }
            this.damageDir = Math.atan2(rock.y - this.y, rock.x - this.x);

            this.damageVal += damage;
        }
		return true;
    },
    addDamage() {
        const damage = this.damageVal * 0.2;
        this.mounts.hull.addDamage(damage);
        this.hullDamagedFlash = true;
       // Aoids.logger.log("Damage: " + damage);

        if (this.damageVal > 0.1) {
            // color, size, fragIdxs = FRAG_SPRITE_IDXS, scale = 0, sprayDir = 0, spread = Math.TAU, alpha = 0, curve = 0.2)
            const ds = (damage / (this.mounts.hull.tech.maxDamage * 0.2)), dss = ds ** 0.333;
            Math.random() < ds && FXs.newItem(FXs.types.frags,1).init(
                this.x,
                this.y,
                SHIP_SPARK_COLORS[Math.random() * SHIP_SPARK_COLORS.length | 0],
                dss * 60,
                DAMAGE_SPARKS_IDXS,
                (Math.random() + 12.1) * dss,
                this.damageDir + (Math.PI90 * (Math.random() < 0.5 ? -1 : 1)),
                Math.PI90,
                255
            );
            this.damageVal *= 0.8

        } else {
            this.damageVal = 0;
        }

	},
	bonusPickup(bonus) {
        this.metalPickup(4, 1);
	},
	metalPickup(typeIdx, count) {
        const m = this.metals[typeIdx];
        if (m && m.count < m.maxCount) {
            if (m.count + count < m.maxCount) {
                m.count += count;
            } else {
                m.count = m.maxCount;
            }
            m.flash = 1;
            this.score ++;
        }
	},
	destroy() {
        this.tick = 200;
        this.explode = true;
	},
	damagedFX() {
        if (this.mounts.hull.smoke > 0) {
            const smoke = this.mounts.hull.smoke;
            const spread =  (Math.random() - 0.5) * 2;
            const scaleSpread = 1.1 - Math.abs(spread)
            const size = Math.random() * 1 * scaleSpread * 255 * 3;
            Math.random() < smoke && FXs.newItem(FXs.types.smoke).init(
                this.x,
                this.y,
                SHIP_SMOKE_COLORS[Math.random() * SHIP_SMOKE_COLORS.length | 0],
                (size * 0.05 + 0.1 * size * Math.random()) * smoke,
                this.r + (Math.random() - 0.5),
                undefined, undefined,
                (30 + Math.random() * 160) * smoke
            );
        }
    },
	destroyFX() {
        for(const mount of this.mountArray) { mount.update(this) }
        this.physics.applyGravity(0, 0, rocks.homeRock.mass, GRAV_CONST);
        this.physics.dragToOrbit(0,0, rocks.homeRock.mass, GRAV_CONST, this.spaceDrag);
        this.physics.resolveForces();
        this.speed = this.physics.speed;
        this.x = this.physics.p.x;
        this.y = this.physics.p.y;
        this.dx = this.physics.delta.x;
        this.dy = this.physics.delta.y;
        this.r = this.physics.angle;
        const spread =  (Math.random() - 0.5) * 2;
        const scaleSpread = 1.1 - Math.abs(spread)
        const spread1 =  (Math.random() - 0.5) * 2;
        var r = Math.random() * Math.TAU;
        const x = Math.cos(r);
        const y = Math.sin(r);
        const cols = [0xFF00FF00,0xFF44FF88,0xFF00AA00];
        const colLen = 3;
        const xx = this.x + x * 20;
        const yy = this.y + y * 20;
        const wPos = (Math.random() - 0.5) * 20;
        const xx1 = xx - y * 40;
        const yy1 = yy + x * 40;
        const size = Math.random() * 1 * scaleSpread * 255 * 3;
        FXs.newItem(FXs.types.sparks).init(
            xx,
            yy,
            size,
            this.r  + 0.5 * spread,
            SHIP_SPARK_COLORS[Math.random() * SHIP_SPARK_COLORS.length | 0],
            4, true, this
        );
        FXs.newItem(FXs.types.frags,1).init(
            xx1,
            yy1,
            Math.random() < 0.5 ? 0xFF0000FF : 0xFF00FFFF,
            10,
            2,
            (Math.random() + 0.1),
            r + (Math.random() - 0.5),
            Math.random()
        );
        FXs.newItem(FXs.types.frags).init(
            xx1,
            yy1,
            Math.random() < 0.5 ? 0xFF0000FF : 0xFF00FFFF,
            10,
            data.spriteSheet.names.shipFrags,
            (Math.random() + 1),
            r + (Math.random() - 0.5),
            Math.random()
        );
        FXs.newItem(FXs.types.smoke).init(
            xx1,
            yy1,
            SHIP_SMOKE_COLORS[Math.random() * SHIP_SMOKE_COLORS.length | 0],
            size * 0.05 + 0.1 * size * Math.random(),
            r + (Math.random() - 0.5),
            undefined, undefined,
            30 + Math.random() * 160
        );
        FXs.newItem(FXs.types.smoke, 2).init(
            xx1,
            yy1,
            SHIP_SMOKE_COLORS[Math.random() * SHIP_SMOKE_COLORS.length | 0],
            size * 0.05 + 0.1 * size * Math.random(),
            r + (Math.random() - 0.5),
            undefined, undefined,
            30 + Math.random() * 160
        );
        if (Math.random() < ((1 - this.tick / 200) ** 2)) {
            FXs.newItem(FXs.types.shockwave).init(
                xx1, yy1,
                64 + 1256 * (Math.random() ** 3),
                SHIP_SHOCKWAVE_COLORS[Math.random() * SHIP_SHOCKWAVE_COLORS.length | 0],
            );
            FXs.newItem(FXs.types.lightning).init(
                xx,
                yy,
                Math.cos(this.tick / 5) * 300,
                Math.sin(this.tick / 5) * 300,
                0xFF66FFAA,
                1 + Math.random() * 4
            );
            FXs.newItem(FXs.types.smoke, 2).init(
                xx1,
                yy1,
                SHIP_SMOKE_COLORS[Math.random() * SHIP_SMOKE_COLORS.length | 0],
                size * 0.5 + 0.5 * size * Math.random(),
                r + (Math.random() - 0.5),
                undefined, undefined,
                30 + Math.random() * 160
            );
            this.physics.delta.scale(0.9);
        }
	},
	fire(gunSet) {
        if (this.useTargeting && this.targeting) {
            if (this.lockingOnTarget && this.lockingOnTargetTimer > 0) { return }
        }
		if(gunSet.length && (!this.mounts.shield || (!this.mounts.shield.activated))) {
			const dist = mouse.shipDist ** 2;
			const sDist = this.inPlayDistance * this.screenRatio;
			const bDist = this.inPlayDistance - sDist;
			var fired = 0;
			for(const gun of gunSet) {
                const ang = gun.tech.converg ? Math.asin(gun.hardPoint.y / ((gun.hardPoint.y * gun.hardPoint.y + dist) ** 0.5)) : 0;
				gun.fire(ang, sDist, bDist) && (fired += 1);
			}
		}
	},
	mouseControl() {
        this.engineShutDown && this.controls.forwardMain[0].output === 0 && (this.engineShutDown = false);
        if(this.autoPilot) { return }
        const thrusting = !this.engineShutDown && ((mouse.button & 4) === 4 || keys.KeyW || keys.ArrowUp);
        this.targetingPos.init(mouse.wx, mouse.wy);
        if(!this.mounts.shield || (!this.mounts.shield.activated))  {
            if(thrusting) {
                this.mainThrustOn = true;
                for(const t of this.controls.forwardMain) { t.activated = true }

            } else {
                this.mainThrustOn = false;
            }
            if(keys.KeyS || keys.ArrowDown) {
                for(const t of this.controls.backward) { t.activated = true }
            }
            if(keys.KeyA || keys.ArrowLeft) {
                for(const t of this.controls.left) { t.activated = true }
            }
            if(keys.KeyD || keys.ArrowRight) {
                for(const t of this.controls.right) { t.activated = true }
            }
        } else {
            this.mainThrustOn = false;
        }

        if (keys.KeyE) {
            //Aoids.flasher("Home mass: " + rocks.homeRock.mass.toFixed(0) + " Radius: " + rocks.homeRock.radius.toFixed(3));
            this.physics.dragToOrbit(0,0, rocks.homeRock.mass, GRAV_CONST, 0.5);
        }
        var turnAccel = 0;
        wV1.initPolar(this.r, 1);
        const angle = wV1.angleTo(wV2.init(mouse.wx, mouse.wy).sub(wV3.init(this.x, this.y)));
        mouse.shipDist = Math.max(wV2.length, 1600);
        this.rR = this.r + angle;
        this.rC += (this.rR - this.r) * 0.5;
        this.rC *= 0.1;
        if(!this.docked) { this.physics.w = this.rC }
        let fireL = false;
        let fireR = false;
        if (this.rCO - this.rC > 0.001) { fireL = true }
        if (this.rCO - this.rC < -0.001) { fireR = true }
        this.rCO = this.rC;
        if(!this.docked) {
            if (fireL) { for(const t of this.controls.left) { t.activated = true; t.showOnly = true } }
            if (fireR) { for(const t of this.controls.right) { t.activated = true; t.showOnly = true } }
        }
        turnAccel = this.rC;
        this.rC += ((this.rR += angle) - this.r) * this.turnAccel;
        this.rC *= this.turnDrag;
        turnAccel -= this.rC;
        this.r += this.rC;

        this.mounts.hull.pilot(angle, thrusting, fireL, fireR)

	},
    docking() {

        if (this.homePad && this.homePad.attached.behaviour === undefined) {
            this.onPad = undefined;
            this.land = undefined;
            return;
        }
        if(this.docked) {

            if ((Aoids.frame / 15 | 0) !== ((Aoids.frame-1) / 15 | 0)) {
                this.mounts.hull.docked();
                this.power.docked();
            }
        }

    },
    radar() {
        const SWATCH = 14;
        const sx = renderer.width / 2 | 0;
        const sy = renderer.height / 2 | 0;
        const cx = this.screenPos.x;
        const cy = this.screenPos.y;
        const rad = Math.min(sx, sy) * 0.3 | 0;
        const B = buffers;
        const b = B.overlayB.data, bI = B.overlayB.UI32;
        const o = B.offsets;
        const stride = o.stride;
        const incomingCount = rocks.incomingCount;
        var i = B.overlayB.length * stride, c = 0;;
        const Z = view.zoom;
        if (this.useRadar && rocks.incoming) {
            const blink = Aoids.frame / 20 | 0;  // Counts 1/3 seconds
            const aSc = ((DANGER_DISTANCE_SCALE - 1) / DANGER_DISTANCE_SCALE) ;
            const aFr = 1 / DANGER_DISTANCE_SCALE;
            for(const rock of rocks.incomingRocks) {
                if (c === incomingCount) { break }
                if (rock.size < 3) {
                    const dx = rock.x - this.x;
                    const dy = rock.y - this.y;
                    const dist = (dx * dx + dy * dy) ** 0.5;
                    if (dist * Z > rad) {
                        const alpha = ((1 - (rock.distance - aFr) * aSc) * 255) << 24
                        const ang = Math.atan2(dy, dx);
                        b[i  ] = cx + dx / dist * rad;
                        b[i+1] = cy + dy / dist * rad;
                        b[i+2] = 1;
                        b[i+3] = 1;
                        b[i+4] = 0.5;
                        b[i+5] = 0.5;
                        b[i+6] = ang;
                        bI[i+8] = 0x00AAAAFF | alpha; // red
                        bI[i+9] = (rock.distance < 0.5 && blink % 2) ? OVERLAY_POINTER_FULL_SPR_IDX : OVERLAY_POINTER_SPR_IDX;
                        i += stride;
                        B.overlayB.length++;
                    }
                }
            }
        }
        if (this.useTargeting && this.targeting) {
            view.worldToScreen(this.targeting, wV1);
            if (this.lockingOnTarget) {
                const t = (this.lockingOnTargetTimer = this.lockingOnTargetTimer > 0 ? this.lockingOnTargetTimer - 0.5 : 0) ** 2;
                const sc = 1 - t * 0.5;
                b[i+3] = sc;
                b[i+2] = sc;
                b[i+6] = Math.PI * t;
                bI[i+8] = t === 0 ? 0xFF0000FF : 0x00FFFFFF + (((1-t) * 255) << 24); //
                this.targetingDist = -1;
            } else {
                b[i+3] = 0.5;
                b[i+2] = 0.5;
                b[i+6] = 0;
                bI[i+8] = 0x3FFFFFFF; //
                this.targetingDist = this.inPlayDistance * this.inPlayDistance;
            }
            b[i  ] = wV1.x;
            b[i+1] = wV1.y;
            b[i+4] = 0.5;
            b[i+5] = 0.5;
            bI[i+9] = OVERLAY_LOCATOR_RING_IDX;
            i += stride;
            B.overlayB.length++;
            //this.targeting = null;
        }
        if (this.closestRock) {
            const dx = this.closestRock.x - this.x;
            const dy = this.closestRock.y - this.y;
            const dist = (dx * dx + dy * dy) ** 0.5;
            const radius = this.closestRock.radius;
            if ((dist - radius * 2) * Z > rad) {
                const angleSize = radius / dist;
                const ang = Math.atan2(dy, dx);
                const r = rad + 40, dr = r / dist;
                b[i  ] = cx + dx * dr;
                b[i+1] = cy + dy * dr;
                b[i+2] = 1;
                b[i+3] = 1;
                b[i+4] = 0.5;
                b[i+5] = 0.5;
                b[i+6] = ang;
                bI[i+8] = 0xFFAAAAFF; //
                bI[i+9] = OVERLAY_ROCK_POINTER_SPR_IDX;
                i += stride;
                B.overlayB.length++;
                if (angleSize > 0.04) {

                    b[i  ] = cx + Math.cos(ang + angleSize) * r;
                    b[i+1] = cy + Math.sin(ang + angleSize) * r;
                    b[i+2] = 1;
                    b[i+3] = 1 / SWATCH;
                    b[i+4] = 0.5;
                    b[i+5] = 0.5;
                    b[i+6] = ang + angleSize;
                    bI[i+8] = 0x7FAAAAFF; //
                    bI[i+9] = OVERLAY_WHITE_SPR_IDX;
                    i += stride;
                    b[i  ] = cx + Math.cos(ang - angleSize) * r;
                    b[i+1] = cy + Math.sin(ang - angleSize) * r;
                    b[i+2] = 1;
                    b[i+3] = 1 / SWATCH;
                    b[i+4] = 0.5;
                    b[i+5] = 0.5;
                    b[i+6] = ang - angleSize;
                    bI[i+8] = 0x7FAAAAFF; //
                    bI[i+9] = OVERLAY_WHITE_SPR_IDX;
                    i += stride;
                    B.overlayB.length += 2;


                }
            }
            this.closestRock = undefined;
            this.closestRockDist = Infinity;

            this.closestAttachedDist = Infinity;
            this.closestAttached = undefined;
        }
        if (this.homePad && !this.docked && this.dockingNav) {
            const hp = this.homePad
            const be = hp.attached.behaviour;
            let dx = this.homePad.x - this.x;
            let dy = this.homePad.y - this.y;
            view.worldToScreen(hp, wV1);
            let dist = (dx * dx + dy * dy) ** 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            const ax = Math.cos(hp.r) * Z;
            const ay = Math.sin(hp.r)* Z;

            b[i  ] = wV1.x - ay * -330;
            b[i+1] = wV1.y + ax * -330;
            b[i+2] = 1 / SWATCH;
            b[i+3] = 10 * Z;
            b[i+4] = 0.5;
            b[i+5] = 1;
            b[i+6] = hp.r;
            bI[i+8] = 0xFFAAFFAA; //
            bI[i+9] = OVERLAY_WHITE_SPR_IDX;
            i += stride;



            B.overlayB.length += 1;



        } else  if (this.homePad && !this.docked) {
            const rad1 = rad - 20;
            let dx = this.homePad.x - this.x;
            let dy = this.homePad.y - this.y;
            let dist = (dx * dx + dy * dy) ** 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            let ang = Math.atan2(dy, dx);
            b[i  ] = cx + nx * rad1;
            b[i+1] = cy + ny * rad1;
            b[i+2] = 1;
            b[i+3] = 1;
            b[i+4] = 0.5;
            b[i+5] = 0.5;
            b[i+6] = ang;
            bI[i+8] = 0xFFAAFFAA;
            bI[i+9] = OVERLAY_HOME_POINTER_SPR_IDX;
            i += stride;
            B.overlayB.length++;

            dx = this.homePad.attached.attachedTo.x - this.x;
            dy = this.homePad.attached.attachedTo.y - this.y;
            const px = this.homePad.attached.attachedTo.x - this.homePad.x;
            const py = this.homePad.attached.attachedTo.y - this.homePad.y;
            const distP = (px * px + py * py) ** 0.5;
            const fb = (-ny * py - nx * px) / distP * 40; // front or behind center line

            dist = (dx * dx + dy * dy) ** 0.5;
            ang = Math.atan2(dy, dx);
            const radius = this.homePad.attached.attachedTo.radius;
            const angleSize = radius / dist;
            const r = rad1 - fb, dr = r / dist;
            if (angleSize > 0.04) {

                b[i  ] = cx + Math.cos(ang + angleSize) * r;
                b[i+1] = cy + Math.sin(ang + angleSize) * r;
                b[i+2] = 1;
                b[i+3] = 1 / SWATCH;
                b[i+4] = 0.5;
                b[i+5] = 0.5;
                b[i+6] = ang + angleSize;
                bI[i+8] = 0xFFAAFFAA; //
                bI[i+9] = OVERLAY_WHITE_SPR_IDX;
                i += stride;
                b[i  ] = cx + Math.cos(ang - angleSize) * r;
                b[i+1] = cy + Math.sin(ang - angleSize) * r;
                b[i+2] = 1;
                b[i+3] = 1 / SWATCH;
                b[i+4] = 0.5;
                b[i+5] = 0.5;
                b[i+6] = ang - angleSize;
                bI[i+8] = 0xFFAAFFAA; //
                bI[i+9] = OVERLAY_WHITE_SPR_IDX;
                i += stride;
                B.overlayB.length += 2;
            }

            const ovl = this.orbitVector.length;
            const dvl = this.physics.delta.length;
            const deltaScale = (dvl / ovl);
            if (deltaScale > 0.2 && deltaScale < 3) {
                const alp = deltaScale > 2 ? ((1 - (deltaScale - 2)) * 255) << 24 : 0xFF000000;
                const onx = this.orbitVector.x / ovl;
                const ony = this.orbitVector.y / ovl;
                const dnx = this.physics.delta.x / ovl;
                const dny = this.physics.delta.y / ovl;

                const dfx = onx - dnx;
                const dfy = ony - dny;
                const df = Math.abs(dfx * dfx + dfy * dfy);
                if (df < 0.001) {
                    if (this.inOrbitIndicator === 0) {
                        this.inOrbitIndicator = 1;
                    } else {
                        this.inOrbitIndicator ++;
                    }

                } else { this.inOrbitIndicator = 0 }
                if (this.inOrbitIndicator < 300) {
                    b[i  ] = cx + onx * 100;
                    b[i+1] = cy + ony * 100;
                    b[i+2] = 1;
                    b[i+3] = 1 / SWATCH;
                    b[i+4] = 0.5;
                    b[i+5] = 0.5;
                    b[i+6] = this.orbitVector.direction;
                    bI[i+8] = 0xFF | alp; //
                    bI[i+9] = OVERLAY_WHITE_SPR_IDX;
                    i += stride;

                    b[i  ] = cx + dnx * 100;
                    b[i+1] = cy + dny * 100;
                    b[i+4] = 0.5;
                    b[i+5] = 0.5;
                    b[i+6] = this.physics.delta.direction;
                    bI[i+8] = 0xFFFF | alp; //
                    if (this.inOrbitIndicator > 1 && (this.inOrbitIndicator / 20 | 0) % 2 === 1) {
                        b[i+2] = 1;
                        b[i+3] = 1;
                        bI[i+9] = OVERLAY_ORBIT_INDICATOR_SPR_IDX;
                    } else {
                        b[i+2] = deltaScale;
                        b[i+3] = 1 / SWATCH;
                        bI[i+9] = OVERLAY_WHITE_SPR_IDX;
                    }
                    i += stride;
                    B.overlayB.length += 2;
                }
            }
        }
    },
    status() {
        const SWATCH = 14;
        const blink = Aoids.frame / 20 | 0;  // Counts 1/3 seconds
        const iZ = view.invZoom;
        const B = buffers;
        const b = B.overlay.data, bI = B.overlay.UI32;
        const o = B.offsets;
        const stride = o.stride;
        var i = B.overlay.length * stride, idx = 0;
        var x = 10, y = 40;
        b[i  ] = x + 10;
        b[i+1] = y;
        b[i+2] = 128 / SWATCH;
        b[i+3] = 12/ SWATCH;
        b[i+4] = 0;
        b[i+5] = 0;
        b[i+6] = 0;
        bI[i+8] = this.power.reserve < 0.1 && blink % 2 ? 0xFF0000FF : 0xFF000000; // black
        bI[i+9] = OVERLAY_WHITE_SPR_IDX;
        i += stride;
        B.overlay.length++;
        const full = this.power.reserve * 126;
        if (full > 0.001) {
            b[i  ] = x + 11;
            b[i+1] = y + 1;
            b[i+2] = full / SWATCH;
            b[i+3] = 10 / SWATCH;
            b[i+4] = 0;
            b[i+5] = 0;
            b[i+6] = 0;

            bI[i+8] = this.power.chargingFlash > 0 ? 0xFFAA66AA : 0xFF66FF66; //
            bI[i+9] = OVERLAY_WHITE_SPR_IDX;
            i += stride;
            B.overlay.length++;
        }
        this.power.chargingFlash  > 0 && (this.power.chargingFlash -= 1);
        b[i  ] = x -10;
        b[i+1] = y - 2;
        b[i+2] = 1;
        b[i+3] = 1;
        b[i+4] = 0;
        b[i+5] = 0;
        b[i+6] = 0;
        bI[i+8] = 0xFFFFFFFF; //
        bI[i+9] = FUEL_SYMBOL_SPR_IDX;
        i += stride;
        B.overlay.length++;
        y+= 15;

        const hull = this.mounts.hull;
        b[i  ] = x + 10;
        b[i+1] = y;
        b[i+2] = 128 / SWATCH;
        b[i+3] = 12/ SWATCH;
        b[i+4] = 0;
        b[i+5] = 0;
        b[i+6] = 0;
        bI[i+8] = this.hullDamagedFlash || (hull.smoke > 0.5 && (blink % 2)) ? 0xFF0000FF : 0xFF000000; // black
        bI[i+9] = OVERLAY_WHITE_SPR_IDX;
        this.hullDamagedFlash = false;
        i += stride;
        B.overlay.length++;
        const dam = hull.damage / hull.tech.maxDamage * 126;
        if (dam > 0.001) {
            b[i  ] = x + 11;
            b[i+1] = y + 1;
            b[i+2] = dam / SWATCH;
            b[i+3] = 10 / SWATCH;
            b[i+4] = 0;
            b[i+5] = 0;
            b[i+6] = 0;
            bI[i+8] = hull.fixingFlash > 0? 0xFF00AAAA: 0xFFFF6666; //
            bI[i+9] = OVERLAY_WHITE_SPR_IDX;
            i += stride;
            B.overlay.length++;
        }
        hull.fixingFlash > 0 && (hull.fixingFlash -= 1);

        y+= 15;


        this.metalBonusFlash *= 0.95;
        for (const m of this.metals) {
            const po = m.oldCount;
            m.oldCount = m.count;
            const flash = m.flash = m.count !== po ? 1 : m.flash * 0.9;
            b[i  ] = x;
            b[i+1] = y;
            b[i+2] = 64 / SWATCH;
            b[i+3] = 8 / SWATCH;
            b[i+4] = 0;
            b[i+5] = 0;
            b[i+6] = 0;
            bI[i+8] = 0xFF000000 + flash * 255; // black
            bI[i+9] = OVERLAY_WHITE_SPR_IDX;
            i += stride;
            B.overlay.length++;
            const full = m.count / m.maxCount * 62;
            b[i  ] = x + 1;
            b[i+1] = y + 1;
            b[i+2] = full / SWATCH;
            b[i+3] = 6 / SWATCH;
            b[i+4] = 0;
            b[i+5] = 0;
            b[i+6] = 0;
            bI[i+8] = m.colMask; // black
            bI[i+9] = OVERLAY_WHITE_SPR_IDX;
            i += stride;
            B.overlay.length++;
            if (METAL_SYMBOL_SPR_IDX[idx] !== undefined) {
                b[i  ] = x - 8;
                b[i+1] = y + 1;
                b[i+2] = 1;
                b[i+3] = 1;
                b[i+4] = 0;
                b[i+5] = 0;
                b[i+6] = 0;
                bI[i+8] = 0xFFFFFFFF; // black
                bI[i+9] = METAL_SYMBOL_SPR_IDX[idx];
                i += stride;
                B.overlay.length++;
            }
            idx++;
            y+= 10;
        }
       /* b[i  ] = x;
        b[i+1] = y;
        b[i+2] = 64 / SWATCH;
        b[i+3] = 8/ SWATCH;
        b[i+4] = 0;
        b[i+5] = 0;
        b[i+6] = 0;
        bI[i+8] = 0xFF000000 + this.metalBonusFlash * 255; // black
        bI[i+9] = OVERLAY_WHITE_SPR_IDX;
        i += stride;
        B.overlay.length++;
        this.metalBonusFlash *= 0.95;
        const fullM = (this.metalBonus / MAX_METAL_BONUS) * 62;
        if (fullM > 0.001) {
            b[i  ] = x + 1;
            b[i+1] = y + 1;
            b[i+2] = fullM / SWATCH;
            b[i+3] = 6 / SWATCH;
            b[i+4] = 0;
            b[i+5] = 0;
            b[i+6] = 0;
            bI[i+8] = 0xFFFFFFAA; //
            bI[i+9] = OVERLAY_WHITE_SPR_IDX;
            i += stride;
            B.overlay.length++;
        }*/
    },
    processMetals() {

    },
    update() {
		if(keys.KeyX) {
            keys.KeyX = false
            if (this.closestRock) {
                if (this.closestRock.siblings) {
                    this.closestRock.siblings.hidden ? this.closestRock.showSiblings() : this.closestRock.hideSiblings();
                } else if (this.closestRock.parent && this.closestRock.parent.siblings) {
                    this.closestRock.parent.siblings.hidden ? this.closestRock.parent.showSiblings() : this.closestRock.parent.hideSiblings();
                }
            }

            //this.destroy();
        }
		if(this.explode) {
            if (this.tick) {
                this.tick--;
                if (this.tick < 40) {
                    this.visible = false;
                }
                this.destroyFX();
            } else {
                if(this.alive) {
                   // this.release();
                    this.alive = false;
                }
            }
		} else {
            this.mounts.hull.animatePilot = Aoids.viewScale > 1;
            if (this.power.reserve < 0.01) {
                this.damageVal += 2;
            }
            if (this.damageVal) { this.addDamage() }

            this.status();
            this.docking();
            this.mouseControl();
            if (keys.KeyR) {
                keys.KeyR = false;
                this.useRadar = !this.useRadar;
            }
			this.tick += 1;
			this.mass = 0
			for(const mount of this.mountArray) { mount.update(this) }
            this.physics.applyGravity(0, 0, rocks.homeRock.mass, GRAV_CONST);
            if ((!this.homePad && !this.landed) || (this.homePad && this.homePad.targetDist > 1000)) {
                if (!this.docked && !this.dockingInProgress){
                    this.physics.orbitVector(0,0, rocks.homeRock.mass, GRAV_CONST, this.orbitVector);
                    this.physics.dragToOrbit(0,0, rocks.homeRock.mass, GRAV_CONST, this.spaceDrag);
                }
            }
            if (this.homePad && this.homePad.targetDist < 1000) {
                this.dockingNav = true;
            } else {
                this.dockingNav = false;
            }
			this.physics.resolveForces();
			this.speed = this.physics.speed;
			this.x = this.physics.p.x;
			this.y = this.physics.p.y;
			this.dx = this.physics.delta.x;
			this.dy = this.physics.delta.y;
			this.r = this.physics.angle;
			if (!this.docked && ((mouse.button & 1) === 1 || keys.LeftShift)) {
                if (!this.lockingOnTarget) {
                    this.lockingOnTarget = true;
                    this.lockingOnTargetTimer = 1;
                } else {
                    if (this.targeting && this.targeting.changed > 0) {
                        if (!this.targeting.alive || this.targeting.countDown > 0) {
                            this.targeting = undefined;
                            this.lockingOnTarget  = false;
                            this.targetingDist = this.inPlayDistance * this.inPlayDistance;
                        }
                    }
                }
				if(mouse.ctrl) { this.fire(this.controls.fireSecond) }
				if(!mouse.ctrl) { this.fire(this.controls.fireMain) }
			} else {
                this.lockingOnTarget = false;
            }
			this.landed = false;
            view.worldToScreen(this,this.screenPos);
            view.screenPixelToWorld(wV1.init(0, 80), this.statusPos);
            this.radar();

            this.damagedFX();

		}
		if(keys.Space) {
			keys.Space = false;
			this.physics.stop();
		}
	},
}