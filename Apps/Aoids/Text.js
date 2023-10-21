import "../../src/utils/MathExtensions.js";
import {arrayUtils} from "../../src/utils/arrayUtils.js";
import {data} from "./data.js";
import {buffers} from "./buffers.js"
import {Aoids} from "./Aoids.js";
export {Text};

function Text() {
    const align = {
        left: 0,
        center: 1,
        right: 2,
        startY: -20,
        offsetY: 14,
        posY: 0,
    };
    const buf = buffers.overlay;
	const stride = buf.stride;
	const stride4 = buf.stride * 4;
    const bF = buf.data;
	const bI = buf.UI32;
	const bI8 = buf.UI8;
	const sprIdxFirst = data.overlaySpriteSheet.names.fontStart;
	const SPRITES = data.overlaySpriteSheet.sprites;
    const CHAR_HEIGHT = SPRITES[sprIdxFirst].h
    var chars = data.overlaySpriteSheet.names.fontCharacters
    const charSprs = arrayUtils.setOf(128, (i) => {
        if (i < 32) { return undefined }
        const c = String.fromCharCode(i);
        const idx = chars.indexOf(c);
        if (idx > -1) { return SPRITES[sprIdxFirst + idx] }
        return undefined;
    });
    const infoStrings = [];
    const infoPool = [];
    function getNewInfoStr() {
        var info;
        if (infoPool.length) { info = infoPool.pop() }
        else { info = new InfoStr() }
        infoStrings.push(info)
        return info;
    }
    function infoStrToPool(idx) {
        infoPool.push(infoStrings.splice(idx, 1)[0]);
    }
    function InfoStr() {
        this.chars = [];
        this.w = 0;
        this.posX = 0;
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.col = 0xFFFFFFFF;
        this.frames = 0;
        this.frame = 0;
        this.fade = 0;
    }
    InfoStr.prototype = {
        init(str, x, y, scale = 1, col = 0xFFFFFFFF, frames = 120) {
            var code;
            this.w = 0;
            this.x = this.posX = x;
            this.y = y;
            this.scale = scale;
            this.col = col & 0xFFFFFF;
            this.chars.length = 0;
            this.fade = 30 | 0;
            this.frames = (frames + 2 * this.fade) | 0;
            this.frame = 0;

            for (const c of str) {
                this.chars.push(code = c.charCodeAt(0))
                const spr = charSprs[code];
                if (spr) {
                    this.w += spr.w - 3;
                } else {
                    this.w += 7;
                }
            }
            return this;
        },
        align(a) {
            if (a === align.center) {
                this.x = (this.posX - (this.w / 2) * this.scale) | 0;
            } else if (a === align.right) {
                this.x = (this.posX - this.w * this.scale) | 0;
            } else if (a === align.left) {
                this.x = this.posX;
            }
        },
        update() {
            var i = buf.length * stride, ii = (i + 8) * 4 + 3, x = this.x, sc = this.scale, y =  this.y;
            var alpha = 255;
            if (this.frame < this.fade) {
                alpha = (this.frame / this.fade) ** 2 * 255
            } else if (this.frame > this.frames - this.fade) {
                const u = (1 - ((this.frame - (this.frames - this.fade)) / this.fade)) ** 0.5;
                y = y * u | 0;
                alpha = u * 255;
            }
            for (const c of this.chars) {
                const spr = charSprs[c];
                if (spr) {
					bF[i    ] = x;
					bF[i + 1] = y + align.posY * sc + align.offsetY;
					bF[i + 3] = bF[i + 2] = sc;
					bF[i + 4] = 0;
					bF[i + 5] = 0;
					bF[i + 6] = 0;
					bI[i + 8] = this.col;
					bI8[ii] = alpha;
					bI[i + 9] = spr.idx;
                    i += stride;
                    ii += stride4;
                    buf.length ++;
                    x += (spr.w - 3) * sc;
                } else {
                    x += 7 * sc;
                }
            }
            this.frame ++;
            if (this.frame >= this.frames) {
                return false
            }
            align.posY += y ;
            return true;
        },
    }
    const API = {
        align,
        info(str, x, y, scale, col, align, frames) {
            const info = getNewInfoStr().init(str, x, y, scale, col, frames);
            info.align(align);
        },
        flasher() {
            const renderer = Aoids.renderer;
            return function(text, time = 4000, scale = 1, color = 0xFFFFFF) {
                Aoids.logger.log("F> " + text);
                API.info(text, renderer.width / 2 | 0, CHAR_HEIGHT + 1, scale, color, align.center, time / 17 | 0);
            };
        },

        update() {
            var i = 0;
            align.posY = align.startY;
            while (i < infoStrings.length) {
                if (!infoStrings[i].update()) { infoStrToPool(i) }
                else { i ++ }
            }
        },
        measure(str, scale) {
            var width = 0;
            for (const c of str) {
                const spr = charSprs[c.charCodeAt(0)];
                if (spr) {
                    width += spr.w - 3;
                } else {
                    width += 7;
                }
            }
            return width * scale;
        },

        drawString(str, x, y, scale = 1, col = 0xFFFFFFFF) {
            var i = buf.length * stride;
            for (const c of str) {
                const spr = charSprs[c.charCodeAt(0)];
                if (spr) {
					bF[i    ] = x;
					bF[i + 1] = y;
					bF[i + 2] = scale;
					bF[i + 3] = scale;
					bF[i + 4] = 0;
					bF[i + 5] = 0;
					bF[i + 6] = 0;
					bI[i + 8] = col;
					bI[i + 9] = spr.idx;
                    i += stride;
                    buf.length ++;
                    x += (spr.w -3) * scale;
                } else {
                    x += 7 * scale;
                }
            }
        }
    };
    return API;
}