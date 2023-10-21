import "../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../src/Vec2.jsm";
import {data} from "./data.jsm";
import {buffers} from "./buffers.jsm";
import {colors} from "../../src/utils/colors.jsm";
import {Aoids} from "./Aoids.jsm";
import {SpriteCollisionMap} from "../../src/SpriteCollisionMap.jsm";

const collisionMap = SpriteCollisionMap(data.spriteSheet.spriteEdges[0].length);
const SPRITES = data.spriteSheet.sprites;


collisionResult = collisionMap.resultObj;
collisionResult.hx = 0;
collisionResult.hy = 0;
collisionMap.addSprites(SPRITES, data.spriteSheet.spriteEdges);


function Rock() {
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.s = 0;

    this.dx = 0;
    this.dy = 0;
    this.dr = 0;

    this.color = 0xFFFFFFFF;
    this.sprIdx = 0;

    this.mass = 0;
    this.radius = 0;

    this.hp = 0;
    this.damage = 0;

    this.viewDistance = 0;

}
Rock.prototype = {
    commonInit() {
    },
    asFreeRock(orbitRock, desc) {

        const dist = Math.rand(desc.dist.min, desc.dist.max);
        const angle = Math.rand(desc.angle.min, desc.angle.max);
        this.r = Math.rand(Math.TAU);
        this.dr = Math.rand(-desc.rotate, desc.rotate);
        this.mass = Math.rand(desc.mass.min, desc.mass.max);
        this.color = Math.randPick(desc.color);

        this.x = orbit.x + Math.cos(angle) * dist;
        this.y = orbit.y + Math.sin(angle) * dist;
        this.dy = this.dx = 0;

        this.sprIdx = Math.randPick(desc.spriteIdxs);
        const spr = SPRITES[this.sprIdx]
        this.s = this.mass / (spr.w * spr.h * spr.d);
        this.radius = spr.max * this.s;
    },
    asOrbitBody(x, y, mass, sprIdx, scale) {
        this.r = 0
        this.dr = 0;
        this.mass = mass;
        this.color = 0xFFFFFFFF;
        this.x = x;
        this.y = y;
        this.dy = this.dx = 0;
        this.sprIdx = sprIdx
        const spr = SPRITES[this.sprIdx];
        this.s = scale;
        this.radius = spr.max * this.s;
    },




    update(orbits) {
        var x, y, distSqr, dist, dx, dy;
        var i =  orbits.size;
        dx = this.dx;
        dy = this.dy;
        while (i--) {
            const O = orbits[i];
            x = O.x - this.x;
            y = O.y - this.y;
            dist = (distSqr = (x * x + y * y)) ** 0.5;
            const accel = GRAV_CONST * (O.mass / distSqr) / dist;

            dx += x * accel;
            dy += y * accel;
            dist < O.radius + this.radius && O.nearRocks[O.nearRocks.size ++] = this;
        }
        this.y += (this.dx = dx);
        this.x += (this.dy = dy);
    }

}


function OrbitBody() {
    const nearRocks = [];
    nearRocks.size = 0;
    const attached = [];
    attached.size = 0;
    const rock = new Rock();


    const API = {
        nearRocks,
        attached,
        radius,
        update() {


        }


    };

    return API;


}

var view, zoom, origin, viewRect = new Rect();
function Rect() {
    this.x = 0;
    this.y = 0;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
}
Rect.prototype = {
    isInView(x, y, radius) {
        return !(x + radius < this.left || x - radius > this.right || y + radius < this.top || y - radius > this.bottom);
    }
};
function Rocks() {

    const orbits = [];
    orbits.size = 0;
    const visible = [];
    var vSize = 0;
    const items = [];
    var size = 0;



    const API = {
        set view(v) {
            view = v
            origin = view.origin;
        },
        update() {
		newItem() {
			var rock;
			if (items.length > size) { rock = items[size++] }
			else { items[size ++] = rock = new Rock() }
			return rock;
		},
		update() {
            view.viewRect(viewRect);
            zoom = view.zoom;
			var tail = 0, head = 0, len = orbits.size, i = 0;
            while (i < orbits.size) {
                const O = orbits[i++];
                O.update();



			const len = size;
			tSize = 0;
			while (head < fixedCount) {
				const r = items[head++];
				r.updateFixed();
				targetNear[tSize++] = r;
                (r.strength <= 0 || r.breakup > 0) && (smashList[sSize++] = r);
			}
			tail = head;
            if(target.useRadar) {
                while (head < len) {
                    const r = items[head];
                    if (r.update()) {
                        if (r.targetDist < inPlayDist) {
                            if (r.strength > 0) {
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
                        if (r.strength <= 0 || r.breakup > 0) { smashList[sSize++] = r }
                    }
                    head++;
                }
            } else {
                while (head < len) {
                    const r = items[head];
                    if (r.update()) {
                        if (r.targetDist < inPlayDist) {
                            r.strength > 0 && (targetNear[tSize++] = r);
                        }
                        if (head > tail) {
                            items[head] = items[tail];
                            items[tail] = r;
                        }
                        tail++;
                        if (r.strength <= 0 || r.breakup > 0) { smashList[sSize++] = r }
                    }
                    head++;
                }
            }
			size = tail;
			rockCount = size;

        }



    };

    return API;



}