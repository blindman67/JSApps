import "../../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {buffers} from "../buffers.jsm";
import {MountCommon, MountSimpleCommon} from "./MountCommon.jsm";
export {Hull, HullSimple};
const animationMethods = {
	randomSprite(pos, tick, anim ) {
        if(tick % anim.rate === 0) { anim.spriteIdx = anim.sprites[Math.random() * anim.sprites.length | 0] }

		const UI32 = anim.buf.UI32;
		const i = anim.bufPos + pos;
		UI32[i + 9] = anim.spriteIdx;
	},
}
function Hull(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	this.animations = [];
    this.procedural = [];
	ship.sprIdx = display.bodySprite;
	ship.radius = data.spriteSheet.sprites[ship.sprIdx].diag / 2;
    this.damage = 0;
    this.fixingFlash = 0
    this.smoke = 0;
    this.animatePilot = true;
    this.pilotDesc = {
        angle: 0, // head turning to this angle
        head: 15,  // pos of pilots head
        left: 0,  // applying left Reaction thruster
        leftR: 0,
        leftC: 0,
        right: 0, // applying right Reaction thruster
        rightR: 0,
        rightC: 0,
    };
}
Hull.prototype = {
	...MountCommon,
    deleteSelf() {
        this.animations.length = 0;
        this.procedural.length = 0;
    },
	spritesAdd(buf, z) {
        if (this.holdDraw) { return }
	    this.drawStart = buf.length * buffers.stride;
		const dis = this.display;
        var idx = 0;
		for (const part of dis.draw) {
			if (part.procedural) {
                this.procedural.push({
					buf: buf,
					bufPos: idx * buffers.offsets.stride,
                });
            }
			if (part.animate) {
				this.animations.push({
					buf: buf,
					bufPos: idx * buffers.offsets.stride,
					sprites: dis.spriteLists[part.animate.sprites],
					method: animationMethods[part.animate.method],
					rate: part.animate.rate,
				});
			}
			buf.shader.addPart(part, buf.bufIdx);
            idx += 1;
		}
		this.drawCount = dis.draw.length;
        this.drawEnd = buf.length * buffers.stride;
        this.drawSave(buf);
	},
	spritesAddFX(buf, z) {
        if (this.holdFx) { return }
	    this.fxStart = buf.length * buffers.stride;
		const dis = this.display;
		for (const part of dis.fx) { buf.shader.addPart(part, buf.bufIdx) }
		this.fxCount = dis.fx.length;
        this.fxEnd = buf.length * buffers.stride;
        this.fxSave(buf);
	},
	spritesUpdate(x, y, r) {
        var proc, D, i;
        const stride = buffers.stride;
        const pos = buffers.draw.length * stride;
        this.restoreVisible(x, y, r);

		for(const anim of this.animations) {
            anim.method(pos, this.ship.tick, anim);
		}
        const xAx = this.ship.physics.transform.x;
        const xAy = this.ship.physics.transform.y;
        if (this.animatePilot) {
            const p = this.pilotDesc;
            const left = (p.leftR += (p.leftC = (p.leftC += (p.left - p.leftR) * 0.3) * 0.6));
            const right = (p.rightR += (p.rightC = (p.rightC += (p.right - p.rightR) * 0.3) * 0.6));
            proc = this.procedural[4]; // head
            D = proc.buf.data;
            i = pos + proc.bufPos;
            D[i + 6] += ((Math.abs(p.angle) ** 0.7) * 0.8) * Math.sign(p.angle);
            D[i    ] += xAx * p.head;
            D[i + 1] += xAy * p.head;
            proc = this.procedural[0]; // forearm left
            D = proc.buf.data;
            i = pos + proc.bufPos;
            D[i    ] += xAx * left;
            D[i + 1] += xAy * left;
            proc = this.procedural[2]; // arm left
            D = proc.buf.data;
            i = pos + proc.bufPos;
            const l = (left / 7);
            D[i    ] += xAx * (left - l * 7);
            D[i + 1] += xAy * (left - l * 7);
            D[i + 3] = 0.69 + l * 0.31;
            proc = this.procedural[1]; // forearm right
            D = proc.buf.data;
            i = pos + proc.bufPos;
            D[i    ] += xAx * right;
            D[i + 1] += xAy * right;
            proc = this.procedural[3]; // arm right
            D = proc.buf.data;
            i = pos + proc.bufPos;
            const r = (right / 7);
            D[i    ] += xAx * (right - r * 7);
            D[i + 1] += xAy * (right - r * 7);
            D[i + 3] = 0.69 + r * 0.31;
        } else {
            proc = this.procedural[4]; // head
            D = proc.buf.data;
            i = pos + proc.bufPos;
            D[i    ] += xAx * 15;
            D[i + 1] += xAy * 15;
        }
	},
    docked() {
        const t = this.tech;
        const v = this.damage;
        if (v > 0) {
            const metal = this.ship.bases.buy(t.dockedRepair);
            this.damage += t.dockedRepair.fix * metal;
            this.fixingFlash = 4;
        }
        this.damage = this.damage < 0 ? 0 : this.damage;
        this.checkDamage();
    },
    checkDamage() {
        if (this.damage > this.tech.maxDamage) {
            this.ship.destroy();
        } else if (this.damage > this.tech.smokeDamage / 2) {
            this.smoke = (this.damage - this.tech.smokeDamage) / (this.tech.maxDamage - this.tech.smokeDamage);
        } else {
            this.smoke = 0;
        }
    },
    addDamage(amount) {
        this.damage += amount > 0 ? amount : 0;
        this.checkDamage();
    },
    pilot(angle, thrust, left, right) {
        if (this.animatePilot) {
            const p = this.pilotDesc;
            p.angle = angle <= -1 ? -1 : angle >= 1 ? 1 : angle;
            p.left = left ? (p.left < 7 ? p.left + 0.5 : 7) : (p.left > 0 ? p.left -= 0.7 : 0);
            p.right = right ? (p.right < 7 ? p.right + 0.5 : 7) : (p.right > 0 ? p.right -= 0.7 : 0);
            if (thrust) {
                p.left = p.left < 5 ? Math.min(5, p.left += 1) : p.left;
                p.right = p.right < 5 ? Math.min(5, p.right += 1) : p.right;
                p.head = p.head > 13.5 ? p.head -= 0.25 : p.head;
            } else {
                p.head = p.head < 15 ? Math.min(p.head += 1, 15) : p.head;
            }
        }
    },
	update() {
		if(this.upgraded) {
			this.upgraded = false;
			const tech = this.tech;
			this.ship.maxDamage = tech.maxDamage;
			this.ship.pickupPower = tech.pickupConstantG;
			this.ship.turnAccel = tech.turnAccel;
			this.ship.turnDrag = tech.turnDrag;
			this.ship.spaceDrag = tech.spaceDrag;
			this.ship.explodeTime = tech.explodeTime;
		};
		this.ship.mass += this.tech.mass;
	},
};

function HullSimple(ship, mount, tech, display) {
	this.init(ship, mount, tech, display);
	ship.sprIdx = display.bodySprite;
	ship.radius = data.spriteSheet.sprites[ship.sprIdx].diag / 2;
}
HullSimple.prototype = {
	...MountSimpleCommon,
	spritesAdd: Hull.prototype.spritesAdd,
	spritesAddFX: Hull.prototype.spritesAddFX,
};
