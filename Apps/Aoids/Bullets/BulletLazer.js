import "../../../src/utils/MathExtensions.js";
import {colors} from "../../../src/utils/colors.js";
import {Vec2} from "../../../src/Vec2.js";
import {Aoids} from "./../Aoids.js";
import {data} from "./../data.js";
import {bulletCommon} from "./bulletCommon.js";
export {BulletLazer};

const SPRITES = data.spriteSheet.sprites;
const G = data.background.gravConstant;
const MASS = data.background.sunMass;
const WHITE_SPARKS_IDXS = data.spriteSheet.names.whiteSparks;
const WHITE_SPARKS_IDXS_COUNT = data.spriteSheet.names.whiteSparks.length;
const MUZZEL_FLASH_TIME = data.fx.muzzelFlashTime;
const GREEN_TO_LIME = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(67,255,45,1))
	.addStopRGBA(1,    colors.createRGBA(180,208,28,1))
    .asUInt32Array(32);
GREEN_TO_LIME.pos = 0;



var FXs;
function BulletLazer() {
    this.owner = undefined;
    this.gun = undefined;  // Object that fires lazer
    this.rock = undefined;  // hits this object. Set by outside function
    this.u = 2;  // hit unit distance. Set by outside function
    this.approxDist = 0; // approx distance of hit from object center. Used to refine a better approx
}
BulletLazer.initGlobals = function(globals) {
    FXs = globals.FXs;
}
BulletLazer.SPRITES = data.spriteSheet.names.gunLaz.bullets;
BulletLazer.FLASH_SPR_IDX = data.fx.bulletMuzzelFlash.lazer;
BulletLazer.prototype = {
	...bulletCommon,
    delete() {
        this.gun = undefined;
        this.rock = undefined;
    },
    update() {
        const O = this.owner;
        this.gun.getMuzzel(O);
        O.startPos.x = O.p1.x = O.x;
        O.startPos.y = O.p1.y = O.y;
        O.p2.x = O.dx * this.range;
        O.p2.y = O.dy * this.range;
        O.scaleH = this.range / (O.spr.h - 2);
        O.scaleW = (1 + Math.random() ** 3) * (O.life / 15) ** 0.5;
        if (O.life > O.muzzelFlash) { O.muzzelFlash = Math.random() * MUZZEL_FLASH_TIME / 2 + 1 + MUZZEL_FLASH_TIME / 2 | 0 }
        else { O.muzzelFlash > 0 && (O.muzzelFlash--) }
        O.flashScale = (1 + Math.random()) * 48;
    },
    init(gun) {
        const O = this.owner;
        this.gun = gun;
        this.range = O.dist;
        O.life = 16;
        O.powerC = 0;
        O.power /= O.life;
        O.powerR = O.power;
        O.dist *= 200;
    },
    hitSomething(objHit, hitPower){
		const O = this.owner;
        O.scaleH = (this.range * this.u) / (O.spr.h - 2);
		O.lastContact = 0;
		const x = O.hx, y = O.hy;
		var ff = hitPower;
        const dx = x - objHit.x;
        const dy = y - objHit.y;
        const ang = Math.atan2(dy, dx), ang1 = ang + Math.PI90 ;

        const depth = Math.random() ** 2 * ff;
        const ex = x + O.dx * depth;
        const ey = y + O.dy * depth;
        const off = Math.random() ** (1/4);
        FXs.newItem(FXs.types.sparks, 1).init(
            ex, ey,
            ff  * Math.random(),
            ang1 + (Math.random() - 0.5) * 0.1,
            GREEN_TO_LIME[(GREEN_TO_LIME.pos+=13 )% GREEN_TO_LIME.length],
            Math.random() < 0.5 ? 3 : 5,
            false,
            objHit,
            ff * 4
        );
        // color, size, fragIdx, scale, sprayDir, spread, alpha, curve
        Math.random() < 0.25 && FXs.newItem(FXs.types.frags, 1).initDelta(
            x, y,
            objHit.dx, objHit.dy,
            GREEN_TO_LIME[(GREEN_TO_LIME.pos += 13) % GREEN_TO_LIME.length],
            (ff  + ff  * Math.random()) * Math.random(),
            WHITE_SPARKS_IDXS,
            Math.random() * 4 + 1,
            ang + (Math.random() - 0.5),
            (Math.random() ** 2) * 6,
            128,
            1
        );
        Math.random() < 0.25 && FXs.newItem(FXs.types.frags, 1).initDelta(
            ex, ey,
            objHit.dx, objHit.dy,
            GREEN_TO_LIME[(GREEN_TO_LIME.pos += 13) % GREEN_TO_LIME.length],
            (ff  + ff  * Math.random()) * Math.random(),
            WHITE_SPARKS_IDXS,
            Math.random() * 4 + 1,
            ang + (Math.random() - 0.5),
            (Math.random() ** 2) * 6,
            128,
            1
        );

        return objHit.damage > objHit.hp;
	},
};