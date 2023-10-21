import "../../../src/utils/MathExtensions.js";
import {colors} from "../../../src/utils/colors.js";
import {Vec2} from "../../../src/Vec2.js";
import {Aoids} from "./../Aoids.js";
import {data} from "./../data.js";
import {bulletCommon} from "./bulletCommon.js";
export {BulletPlasma};

const SPRITES = data.spriteSheet.sprites;
const ROCK_SMOKE = data.fx.rockSmoke;
var FXs;

function BulletPlasma() {
    this.owner = undefined;
    this.shooter = undefined;
}
BulletPlasma.initGlobals = function(globals) {
    FXs = globals.FXs;
}
BulletPlasma.SPRITES = data.spriteSheet.names.gunPlasma.bullets;
BulletPlasma.HIT_COLORS =  data.fx.plasmaBulletHitSmokeColors;
BulletPlasma.SMOKE_SPRITES = data.spriteSheet.names.plasmaSmoke;
BulletPlasma.FLASH_SPR_IDX = data.fx.bulletMuzzelFlash.plasma;
BulletPlasma.prototype = {
	...bulletCommon,
    init(shooter) {
        this.shooter = shooter && shooter.hitCallback ? shooter : undefined;
    },
	hitSomething(objHit, hitPower){
		const O = this.owner;
		O.lastContact = 0;
        while(O.lance > 0) {
            if (this.shooter && this.shooter.hitCallback) {
                this.shooter.hitCallback(O, objHit);
                this.shooter = undefined;
            }
            const x = O.hx, y = O.hy;
            var ff = hitPower ** 1;
            const ang = Math.atan2(y - objHit.y, x - objHit.x), ang1 = ang + Math.PI90 ;
            const smashedIt = objHit.damage > objHit.hp;
            if(smashedIt) {
                FXs.newItem(FXs.types.shockwave).init(O.x, O.y,ff / 2 + ff * Math.random() , BulletPlasma.HIT_COLORS[Math.random() * 4 | 0]);
                FXs.newItem(FXs.types.smoke).init(O.x, O.y, ROCK_SMOKE[Math.random() * ROCK_SMOKE.length | 0], ff * 2, ang, undefined, BulletPlasma.SMOKE_SPRITES, 30 + Math.random() * 30);
                FXs.newItem(FXs.types.smoke).init(O.x, O.y, ROCK_SMOKE[Math.random() * ROCK_SMOKE.length | 0], ff, ang, undefined, BulletPlasma.SMOKE_SPRITES, 10 + Math.random() * 30);
                FXs.newItem(FXs.types.smoke, 1).init(O.x, O.y, BulletPlasma.HIT_COLORS[Math.random() * 4 | 0], ff / 2, ang, undefined, BulletPlasma.SMOKE_SPRITES, 16+ Math.random() * 8);
                FXs.newItem(FXs.types.frags, 1).init(x, y, BulletPlasma.HIT_COLORS[Math.random() * 4 | 0], ff, 2, 0.16);
                O.lance = 0;
            } else {
                const off = Math.random() ** (1/4);
                const ex = off*(x - O.x) + O.x, ey = off * (y - O.y) + O.y;
                const odds = O.visible ? 1 : 0.4;
                FXs.newItem(FXs.types.sparks).init(O.x, O.y,ff  * Math.random() * 5, ang1 + (Math.random() - 0.5) * 0.5, 0xFFFF44FF, 4, true, objHit, ff * 4 * odds);
                Math.random() < 0.7 * odds && FXs.newItem(FXs.types.sparks).init(ex, ey, ff  * Math.random() * 5, ang1 + (Math.random() - 0.5) * 0.5, 0xFFFFFFFF, 4, true, objHit, ff * 2 * odds);
                Math.random() < 0.6 * odds && FXs.newItem(FXs.types.smoke).init(ex, ey, ROCK_SMOKE[Math.random() * ROCK_SMOKE.length | 0] & 0x7FFFFFFF, ff, ang, undefined, undefined, 50 * odds);
                Math.random() < 0.5 * odds && FXs.newItem(FXs.types.smoke, 1).init(O.x, O.y, BulletPlasma.HIT_COLORS[Math.random() * 4 | 0], ff , ang, undefined, BulletPlasma.SMOKE_SPRITES, Math.random()  * 10 * odds + 4);

            }
            O.lance -= O.powerR / ff;
            if(O.lance <= 0 || O.life < 0) {
                O.powerR2 = O.powerR = O.powerC = O.power = 0;
                O.life = 0;
                O.visible = false;
                break;
            }
			O.power *= (0.8 + Math.random() * 0.1);
			O.powerR *= 0.7+ 0.2 * Math.random();
			O.powerC = -O.powerR;
			O.visible = false;
            if(!O.updateImortal()) {
                O.powerR2 = O.powerR = O.powerC = O.power = 0;
                O.life = 0;
                break;
            }
            hitPower = objHit.bulletRehit(O);
        }
        return objHit.damage > objHit.hp;
	}
}

