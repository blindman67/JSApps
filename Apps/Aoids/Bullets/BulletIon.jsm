import "../../../src/utils/MathExtensions.jsm";
import {colors} from "../../../src/utils/colors.jsm";
import {Vec2} from "../../../src/Vec2.jsm";
import {Aoids} from "./../Aoids.jsm";
import {data} from "./../data.jsm";
import {bulletCommon} from "./bulletCommon.jsm";
export {BulletIon};

const SPRITES = data.spriteSheet.sprites;
const G = data.background.gravConstant;
const MASS = data.background.sunMass;

const CYAN_TO_MAGENTA = colors.Gradient
	.addStopRGBA(0,    colors.createRGBA(67,255,255,1))
	.addStopRGBA(1,     colors.createRGBA(255,67, 255,1))
	.asUInt32Array(32);
CYAN_TO_MAGENTA.pos = 0;
const MAX_GUN_POWER = 50;
var FXs;
function BulletIon() { this.owner = undefined }
BulletIon.initGlobals = function(globals) {
    FXs = globals.FXs;
}
BulletIon.SPRITES = data.spriteSheet.names.gunIon.bullets;
BulletIon.FLASH_SPR_IDX = data.fx.bulletMuzzelFlash.ion;
BulletIon.prototype = {
	...bulletCommon,
	hitSomething(objHit, hitPower){
		const O = this.owner;
		O.lastContact = 0;
		const x = O.hx, y = O.hy;
		var ff = hitPower;
        const ang = Math.atan2(y - objHit.y, x - objHit.x), ang1 = ang + Math.PI90 ;
        const smashedIt = objHit.damage > objHit.hp;
		if(smashedIt) {
            if (objHit.size < 2) {
                FXs.newItem(FXs.types.shockwave).init(x, y, ff / 2 + ff * Math.random(), CYAN_TO_MAGENTA[(CYAN_TO_MAGENTA.pos+=7 )% CYAN_TO_MAGENTA.length]);
                FXs.newItem(FXs.types.lightning).init(x, y, O.dx * 300, O.dy * 300,0xFFDD8833,ff ** 0.25);
                FXs.newItem(FXs.types.smoke).init(O.x, O.y, objHit.color, ff, ang, undefined, undefined, 50);
             } else if (objHit.size < 4) {
                FXs.newItem(FXs.types.shockwave).init(x, y, ff / 2 + ff * Math.random(), CYAN_TO_MAGENTA[(CYAN_TO_MAGENTA.pos+=7 )% CYAN_TO_MAGENTA.length], 2);
                Math.random() < 0.1 && FXs.newItem(FXs.types.lightning).init(x, y, O.dx * 300, O.dy * 300,0xFFDD8833,ff ** 0.25);
                FXs.newItem(FXs.types.smoke).init(O.x, O.y, objHit.color, ff, ang, undefined, undefined, 20);
            } else {
                //FXs.newItem(FXs.types.shockwave).init(x, y, ff / 2 + ff * Math.random(), CYAN_TO_MAGENTA[(CYAN_TO_MAGENTA.pos+=7 )% CYAN_TO_MAGENTA.length], 1);
                FXs.newItem(FXs.types.smoke).init(O.x, O.y, objHit.color, ff, ang, undefined, undefined, 10)
            }

		} else {
            const off = Math.random() ** (1/4);
            const ex = off*(x - O.x) + O.x, ey = off * (y - O.y) + O.y;
            const odds = O.visible ? 1 : 0.2;
            Math.random() < 0.9 * odds && FXs.newItem(FXs.types.sparks, 1).init(ex, ey, ff  * Math.random(), ang1 + (Math.random() - 0.5) * 0.5, CYAN_TO_MAGENTA[(CYAN_TO_MAGENTA.pos+=7 )% CYAN_TO_MAGENTA.length], 3, false, objHit, ff * 4 * odds);
            Math.random() < 0.5 * odds && FXs.newItem(FXs.types.sparks, 1).init(x, y, ff  * Math.random(), ang1  + (Math.random() - 0.5) * 0.5,  CYAN_TO_MAGENTA[(CYAN_TO_MAGENTA.pos+=7 )% CYAN_TO_MAGENTA.length], 3, false, objHit, ff * 2 * odds);
            Math.random() < 0.5 * odds && FXs.newItem(FXs.types.sparks, 1).init(O.x, O.y, ff  * Math.random(), ang1  + (Math.random() - 0.5) * 0.5, CYAN_TO_MAGENTA[(CYAN_TO_MAGENTA.pos+=7 ) % CYAN_TO_MAGENTA.length], 3, false, objHit, ff * 2 * odds);
            Math.random() < 0.9 * odds && FXs.newItem(FXs.types.smoke).init(ex, ey, objHit.color & 0x3FFFFFFF, ff, ang, undefined, undefined, 50 * odds);
            Math.random() < 0.9 * odds && FXs.newItem(FXs.types.smoke, 1).init(x, y, Math.random() < 0.5 ? 0xFFFF8800 : 0xFFFFFFFF, ff * Math.random(), ang, undefined, undefined, Math.random() * 20  * odds+ 4);
            Math.random() < 0.1 * odds &&FXs.newItem(FXs.types.smoke, 1).init(x, y, Math.random() < 0.5 ? 0xFFFF8800 : 0xFFF55FFF, ff, ang, undefined, undefined, Math.random()  * 10 * odds + 4);
            Math.random() < 0.01 * odds && FXs.newItem(FXs.types.lightning).init(x, y, O.dx * 300, O.dy * 300,0xFFFFFFFF,Math.max(0.1, hitPower / MAX_GUN_POWER) * Math.random() );
		}
		O.lance -= (O.powerR / ff) * 0.1;
		if(O.lance <= 0) {
			O.powerR2 = O.powerR = O.powerC = O.power = 0;
			O.life = 0;
			O.visible = false;
		} else {
			O.power *= (0.9 + Math.random() * 0.1);
			O.powerR *= 0.7+ 0.2 * Math.random();
			O.visible = false;
			O.dir += Math.random() ** 4 * (Math.random() < 0.5 ? -0.4 : 0.4);
			O.dy = -Math.cos(O.dir);
			O.dx = Math.sin(O.dir);
		}
        return smashedIt;
	}
};
