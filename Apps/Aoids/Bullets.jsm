import "../../src/utils/MathExtensions.jsm";
import {Pool} from "./Pool.jsm";
import {data} from "./data.jsm";
import {buffers} from "./buffers.jsm";
import {Bullet} from "./Bullets/Bullet.jsm";
import {BulletPlasma} from "./Bullets/BulletPlasma.jsm";
import {BulletIon} from "./Bullets/BulletIon.jsm";
import {BulletLazer} from "./Bullets/BulletLazer.jsm";
import {BulletMissile} from "./Bullets/BulletMissile.jsm";

const bulletHitTypes = {
    lazer: 1,
    projectile: 2,
    smart: 3,
};
export {Bullets, bulletHitTypes};

var FXs;

const MUZZEL_FLASH_TIME = data.fx.muzzelFlashTime;
const FLASH_SCALE_SEQ = data.fx.bulletMuzzelFlash.scaleSeq;
const FLASH_SCALE_COUNT = data.fx.bulletMuzzelFlash.scaleSeq.length;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;

const bulletTypePools = {
	pools: {},
	addType(name, Type) { return this.pools[name] = new Pool(Type) },
	empty() {
		for(const pool of Object.values(this.pools)) { pool.empty() }
	},
    eachType(cb) {
        for(const pool of Object.values(this.pools)) { cb(pool.Type) }
    }
};

BulletPlasma.hitType = bulletHitTypes.projectile;
BulletIon.hitType = bulletHitTypes.projectile;
BulletLazer.hitType = bulletHitTypes.lazer;
BulletMissile.hitType = bulletHitTypes.smart;

bulletTypePools.addType("plasma", BulletPlasma);
bulletTypePools.addType("ion", BulletIon);
bulletTypePools.addType("lazer", BulletLazer);
bulletTypePools.addType("Missile", BulletMissile);



function Bullets() {
	const items = [];
	var size = 0, id = 1024;
    var shootsFired = 0;
    const recoilFlash = {dir: 0, x: 0, y: 0};
	const API = {
		types: bulletTypePools.pools,
        hitTypes: bulletHitTypes,
		set FXs(fxs) {
            FXs = fxs;
            const globals = {FXs};
            bulletTypePools.eachType(Type => Type.initGlobals(globals));
        },
        get shootsFired() { return id - 1024 },
        delete(bullet) {
            if (bullet) {
                const idx = items.indexOf(bullet);
                bullet.delete();
                if (idx > -1) {
                    items.splice(idx, 1);
                    if (idx < size) { size-- }
                }
                return;
            }
            this.reset();
            bulletTypePools.empty();
        },
		reset() {
            items.forEach(item => item.delete());
            size = items.length = 0;
        },
		newItem(Type) {
			var bullet;
			if (items.length > size) { bullet = items[size++] }
			else { items[size ++] = bullet = new Bullet() }
			if (bullet.typePool !== Type) {
				bullet.typePool.returnItem(bullet.type);
				bullet.type = (bullet.typePool = Type).getItem()
			}
            bullet.gun = undefined;
            bullet.id = id++;
			return bullet;
		},
		update() {
			var tail = 0, head = 0;
			const len = size;
			while (head < len) {
				const b = items[head];
				if (b.life > 0 && b.update()) {
					if (head > tail) {
						items[head] = items[tail];
						items[tail] = b;
					}
					tail++;
				}
				head++;
			}
			size = tail;
		},
		updateSprites() {
            const stride = buffers.offsets.stride;
            const draw = buffers.draw, fx = buffers.fx;
			var idx = 0, i = fx.length * stride, alpha, c, j = draw.length * stride;
			const bF = draw.data;
			const bI = draw.UI32;
			const bFXF = fx.data;
			const bFXI = fx.UI32;
			while (idx < size) {
				const b = items[idx];
                if (b.visible) {
                    bFXF[i    ] = b.p1.x;
                    bFXF[i + 1] = b.p1.y;
                    bFXF[i + 2] = b.scaleW;
                    bFXF[i + 3] = b.scaleH;
                    bFXF[i + 4] = 0.5;
                    bFXF[i + 5] = 1;
                    bFXF[i + 6] = b.dir;
                    bFXI[i + 8] = 0xFFFFFFFF;
                    bFXI[i + 9] = b.spr.idx  | BIT_DEFAULT_Z_INDEX;
                    fx.length ++;
                    i += stride;
                } else if (b.type.selfRender === true) {
                    j = b.type.updateSprites(j, stride, draw, bF, bI);
                    i = b.type.updateFXSprites(i, stride, fx, bFXF, bFXI);
                }
                if (b.muzzelFlash > 0) {
                    alpha = (b.muzzelFlash / (MUZZEL_FLASH_TIME - 1));
                    c = FLASH_SCALE_COUNT;

                    const sprIdx = b.typePool.Type.FLASH_SPR_IDX  | BIT_DEFAULT_Z_INDEX;
                    const pScale = b.flashScale;
                    if (b.gun && b.gun.getMuzzelFlash) {
                        b.gun.getMuzzelFlash(recoilFlash)
                        while (c > 0 && alpha > 0.1) {
                            bFXF[i    ] = recoilFlash.x;
                            bFXF[i + 1] = recoilFlash.y;
                            bFXF[i + 3] = pScale * FLASH_SCALE_SEQ[--c];
                            bFXF[i + 2] = pScale * FLASH_SCALE_SEQ[--c];
                            bFXF[i + 4] = 0.5;
                            bFXF[i + 5] = 1;
                            bFXF[i + 6] = recoilFlash.dir;
                            bFXI[i + 8] = 0x00FFFFFF + ((alpha * 255) << 24);
                            bFXI[i + 9] = sprIdx;
                            fx.length ++;
                            i += stride;
                            alpha *= 0.5;
                        }

                    } else {
                        const x = b.startPos.x;
                        const y = b.startPos.y;
                        while (c > 0 && alpha > 0.1) {
                            bFXF[i    ] = x;
                            bFXF[i + 1] = y;
                            bFXF[i + 3] = pScale * FLASH_SCALE_SEQ[--c];
                            bFXF[i + 2] = pScale * FLASH_SCALE_SEQ[--c];
                            bFXF[i + 4] = 0.5;
                            bFXF[i + 5] = 1;
                            bFXF[i + 6] = b.dir;
                            bFXI[i + 8] = 0x00FFFFFF + ((alpha * 255) << 24);
                            bFXI[i + 9] = sprIdx;
                            fx.length ++;
                            i += stride;
                            alpha *= 0.5;
                        }
                    }
                }
				idx++;
			}
		},
		each(cb) {
			const len = size;
			var i = 0;
			while (i < len) {
				const b = items[i++];
                if (b.life > 0 && !cb(b)) { return }
			}
		},
	};
	return API;
};