import "../../../src/utils/MathExtensions.js";
import {Vec2} from "../../../src/Vec2.js";
import {data} from "./../data.js";
export {Bullet};

const MUZZEL_FLASH_TIME = data.fx.muzzelFlashTime;
const SPRITES =  data.spriteSheet.sprites;

function Blank() {};
Blank.prototype = { returnItem(){} };
const BLANK = new Blank();
function Bullet() {
	this.typePool = BLANK;
	this.type = BLANK;
	this.p1 = new Vec2();
	this.p2 = new Vec2();
    this.startPos = new Vec2();
    this.id = 0;
	this.x = 0;
	this.y = 0;
	this.dx = 0;
	this.dy = 0;
    this.dr = 0;
	this.dx1 = 0;
	this.dy1 = 0;
	this.hx = 0;
	this.hy = 0;
	this.hAng = 0;
	this.dir = 0;
	this.scaleW = 1;
	this.scaleH = 1;
	this.lance = 1;
    this.damage = 1;
	this.power = 1;
	this.powerR = 1;
	this.powerC = 1;
	this.life = 1;
	this.visible = false;
	this.spr = undefined;
    this.hitType = 0;
	this.lastContact = 0;
    this.muzzelFlash = 0;
    this.flashScale = 0;
    this.usersBullet = false;
    this.gun = undefined;
    this.teamIdx = -1;
}
Bullet.prototype = {
    delete() {
        this.type && this.type.delete && this.type.delete();
        this.type && (this.type.owner = undefined);
        this.typePool = undefined;
        this.type = undefined;
        this.spr = undefined;
    },
	die() {
        if (this.type && this.type.die) { return this.type.die() }
		this.type && (this.type.owner = undefined);
		this.life = 0;
		return false;
	},
	init(power, lance, arg1) { // rather than ...args using named args as ...args and then the call this.type.init(...args) is VERY SLOOOOWWWW...
		this.type.owner = this;
		this.life = 100;
		//this.dist = 100;
		this.visible = true;
		this.lance = lance;
		this.power = power;
		this.powerC = 0;
		this.powerR = 0;
		this.spr =  SPRITES[this.typePool.Type.SPRITES[Math.random() * this.typePool.Type.SPRITES.length | 0]];
		this.dir += Math.PI90;
        this.x -= this.dx1 * 0.99;
        this.y -= this.dy1 * 0.99;
        this.startPos.x = this.x;
        this.startPos.y = this.y;
        this.muzzelFlash = MUZZEL_FLASH_TIME;
        this.usersBullet = false;
        this.hitType = this.typePool.Type.hitType;
        this.type.init(arg1);
	},
    updateImortal() {  // call this when updating bullet from outside standard Bullets.update function
		if (this.life > 0) {
			this.life -= 1;
			if (this.dist <= 0 || this.life <= 0) { return false }
			this.dist -= this.powerR;

            if (!this.visible && this.lastContact ++ > 1) {
                if (this.power < 3) {
                    this.life = 0;
                    return false
                } else {
                    this.visible = true;
                    this.power = this.powerR;
                }
            }
            this.powerC += (this.power - this.powerR) * 0.1;
            this.powerC *= 0.4;
            this.powerR += this.powerC;
            const p = this.powerR < 32 && this.visible ? 32 : this.powerR;
            this.p1.x = this.x;
            this.p1.y = this.y;
            this.x += (this.p2.x = this.dx * p + (this.dx1 *= 0.99));
            this.y += (this.p2.y = this.dy * p + (this.dy1 *= 0.99));
            this.scaleH = this.powerR * 2 / this.spr.h;
            this.scaleW = 1 + this.lance ** 0.5;
            this.scaleH < 1 && (this.scaleH = 1);

			return this.life > 0;
		}
		return false;
	},
	update() {
		if (this.life > 0) {
			this.life -= 1;
			if (this.dist <= 0 || this.life <= 0) { return this.die() }
			this.dist -= this.powerR;
            if(this.type.update) { this.type.update() }
            else {
                if (!this.visible && this.lastContact ++ > 1) {
                    if (this.power < 3) { return this.die() }
                    else {
                        this.visible = true;
                        this.power = this.powerR;
                    }
                }
                this.powerC += (this.power - this.powerR) * 0.1;
                this.powerC *= 0.4;
                this.powerR += this.powerC;
                const p = this.powerR < 32 && this.visible ? 32 : this.powerR;
                this.p1.x = this.x;
                this.p1.y = this.y;
                this.x += (this.p2.x = this.dx * p + (this.dx1 *= 0.99));
                this.y += (this.p2.y = this.dy * p + (this.dy1 *= 0.99));
                this.scaleH = this.powerR * 2 / this.spr.h;
                this.scaleW = 1 + this.lance ** 0.5;
                this.scaleH < 1 && (this.scaleH = 1);
                this.flashScale = this.power < 1 ? 1 : this.power > 3 ? 3 : this.power;
                if (this.muzzelFlash > 0) {
                    this.muzzelFlash --;
                    this.startPos.x += this.dx1;
                    this.startPos.y += this.dy1;
                }
            }
			return this.life > 0;
		}
		return this.die();
	}
};
