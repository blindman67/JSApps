import {glUtils} from "../glUtils.js";
export {spriteShader};
function spriteShader(opts = {}) {
	Object.assign(opts, {
		alphaCut: 0,
		maxSpritesPerSheet: 512,
		maxLength: 1024,
		...opts
	});
    const shaders = {
		vert: {
			default() { return `#version 300 es
				precision highp float;
				precision highp int;
                #define alphaCut ${(opts.alphaCut * 255).toFixed(0) + "u"}
                #define defaultZIndex ${defaultSprite.z.toFixed(6)}
				in vec2 verts;
				in vec4 posScale;    	// sprite position and scale
				in vec4 offRotZ;     	// offset x, y (AKA center, anchor), rotation, ( z index if bit 30 of spriteIdx is on)                
				in uint color;       	// RGBA
                
                //-------------------------------------------------------------------------------------------------
                // bit fields for spriteIdx. Lowest order to highest
                // bit mask  |  bits  | desc
                //-------------------------------------------------------------------------------------------------
                //      1FF     0 - 8     layout idx selects sprite 0 - 511
                // 40000000    30         Depth source  0 use given z index, 1 use default z index
                // BFFFFE00    9 - 29     reserved should be zero
                // 80000000    31         reserved should be zero
                //-------------------------------------------------------------------------------------------------
				in uint spriteIdx;   	  // Index of sprite on sheet
                //-------------------------------------------------------------------------------------------------
                
				uniform vec2 sheetSize;	// Image pixel size
				uniform uvec2 sheetLayout[${opts.maxSpritesPerSheet}];
				uniform mat2 view;      // 2D global scale rotate matrix
				uniform vec2 origin;    // global origin
				out vec2 sprUV;
				out vec4 col;
				void main() {
					if ((color & uint(0xff000000)) <= alphaCut) {
						gl_Position = vec4(vec3(-2), 1);
					} else {
						col = vec4(color & uint(0xFF), (color >> 8) & uint(0xFF), (color >> 16) & uint(0xFF), color >> 24) / 255.0;
						uvec2 spr = sheetLayout[spriteIdx & uint(0x1FF)];;
                        float z = (spriteIdx & uint(0x40000000)) == 0u ? offRotZ.w : defaultZIndex;
						vec2 sprSize = vec2(spr.y & uint(0xFFFF), spr.y >> 16);
						sprUV = (vec2(spr.x & uint(0xFFFF), spr.x >> 16)  + verts * sprSize) / sheetSize;
						vec2 loc = (verts - offRotZ.xy) * (posScale.zw * sprSize);
						float xdx = cos(offRotZ.z), xdy = sin(offRotZ.z);
						loc = view * (vec2(loc.x * xdx - loc.y * xdy, loc.x * xdy + loc.y * xdx) + posScale.xy - origin);
						gl_Position =  vec4(loc, z, 1);
					}
				}`;
			},
			subSprite() { return `#version 300 es
				precision highp float;
				precision highp int;
                #define alphaCut ${(opts.alphaCut * 255).toFixed(0) + "u"}
				in vec2 verts;
				in vec4 posScale;    	// sprite position and scale
				in vec4 offRotZ;     	// offset x, y (AKA center, anchor), rotation, ( z index if bit 30 of spriteIdx is on)
				in uint color;       	// RGBA
                                
                //-------------------------------------------------------------------------------------------------
                // Bit fields for spriteIdx. Lowest order to highest
                // bit mask  |  bits   | desc
                //-----------+---------+---------------------------------------------------------------------------
                //      1FF  |  0 - 8  | Layout index. Selects sprite 0 - 511
                //      200  |  9      | Sub sprite On   0 Not a sub sprite. If zero then all bits above 9 are ignored
                //           |         |                 1 Use sub sprites
                //     3C00  | 10 - 13 | Sub sprite x. Number of horizontal sub sprites. 1 - 16
                //    3C000  | 14 - 17 | Sub sprite y. Number of vertical sub sprites. 1 - 16
                //  3FC0000  | 18 - 25 | Sub sprite idx 0 - 255. Note idx in y is not bounds checked and can result in sprites outside
                //           |         |                         the current layout idx being displayed
                // BC000000  | 26 - 29 | Reserved should be zero
                // 40000000  | 30      | Depth source  0 use given z index, 1 use default z index
                // 80000000  | 31      | Reserved should be zero
                //-----------^---------^---------------------------------------------------------------------------
				in uint spriteIdx;   	// Index of sprite on sheet
                //-------------------------------------------------------------------------------------------------
                
                
				uniform vec2 sheetSize;	// Image pixel size
				uniform uvec2 sheetLayout[${opts.maxSpritesPerSheet}];
				uniform mat2 view;      // 2D global scale rotate matrix
				uniform vec2 origin;    // global origin
				out vec2 sprUV;
				out vec4 col;
				void main() {
					if ((color & uint(0xff000000)) <= alphaCut) {
						gl_Position = vec4(vec3(-2), 1);
					} else {
						col = vec4(color & uint(0xFF), (color >> 8) & uint(0xFF), (color >> 16) & uint(0xFF), color >> 24) / 255.0;
						uvec2 spr = sheetLayout[spriteIdx];
						vec2 sprSize = vec2(spr.y & uint(0xFFFF), spr.y >> 16);
						vec2 sprPos = vec2(spr.x & uint(0xFFFF), spr.x >> 16);
                        if ((spriteIdx & uint(0x200)) != uint(0)) {
                            vec2 subCounts = vec2((spriteIdx & uint(0x3C00)) >> 10, (spriteIdx & uint(0x3C000)) >> 14);
                            uint subIdx = spriteIdx >> 18;
                            sprSize /= subCounts + 1.0;
                            sprPos += sprSize * vec2(subIdx % uint(subCounts.x), subIdx / uint(subCounts.x));
                        }

						sprUV = (sprPos + verts * sprSize) / sheetSize;
						vec2 loc = (verts - offRotZ.xy) * (posScale.zw * sprSize);
						float xdx = cos(offRotZ.z), xdy = sin(offRotZ.z);
						loc = view * (vec2(loc.x * xdx - loc.y * xdy, loc.x * xdy + loc.y * xdx) + posScale.xy - origin);
						gl_Position =  vec4(loc, offRotZ.w, 1);
					}
				}`;
			},
		},
		frag: {
			default() { return  `#version 300 es
				precision mediump float;
				uniform sampler2D tex;
				#define alphaCut ${opts.alphaCut.toFixed(4)}
				in vec2 sprUV;
				in vec4 col;
				out vec4 pixel;
				void main() {
					pixel = texture(tex, sprUV) * col;
					if (pixel.a <= alphaCut) { discard; }
				}`;
			},
		},
		locations: {
			default() { return ["A_verts", "A_posScale", "A_offRotZ", "A_color", "A_spriteIdx", "U_sheetLayout", "U_sheetSize", "U_view", "U_origin" ] },
		},
	};
    const defaultSprite = {
        x: 0, y: 0, sx: 1, sy: 1, cx: 0.5, cy: 0.5, r: 0, z: 0.1, color: 0xFFFFFFFF, idx: 0,
        ...(opts.defaultSprite ? opts.defaultSprite : {})
    }
    const bufferFunctions = {
        clear() { this.length = this.lockPos; return this },
        lock() { this.lockPos = this.length; return this },
        unlock() { this.lockPos = 0; return this },
        release(pos) { this.lockPos = pos; return this },
    };
	const src = {vert: null, frag: null};
	const STRIDE = 4 + 4 + 1 + 1, STRIDE4 = STRIDE * 4;
	const MAX_LENGTH = opts.maxLength;
    const instanceBuffer = () => new ArrayBuffer(MAX_LENGTH * STRIDE4);
    var gl, program, locations, buffers, dirtyTexture, dirtyLayout, method, locationDesc, time, texture, bufStore = [];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},
		verts: {...glUtils.buffers.sprVerts},
		instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer()},
		posScale: {size: 4, stride: STRIDE4, divisor: 1},
		offRotZ:  {size: 4, offset: 4 * 4, stride: STRIDE4, divisor: 1},
		color:    {size: 1, offset: 8 * 4, stride: STRIDE4, divisor: 1, dataType: gl.UNSIGNED_INT},
		spriteIdx:{size: 1, offset: 9 * 4, stride: STRIDE4, divisor: 1, dataType: gl.UNSIGNED_INT},
	});
    const API = {
		compile() {
			if (gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
		},
        init(gl_context = gl) {
            gl = gl_context;
			if (!glUtils.ready) { glUtils.context = gl_context }
            this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
            for(const key of Object.keys(buffers)) { (key !== "vertexBuffer" && key !== "instanceBuffer") && (buffers[key] = undefined) }
            buffers.instanceBuffer = buffers.instanceBuffer.glBuffer;
        },
		get methods() { return ["default"] },
		get method() { return method },
		set method(name) {
			if(name != method) {
				locationDesc = shaders.locations[name] ? shaders.locations[name]() : locationDesc;
				src.vert = shaders.vert[name] ? shaders.vert[name]() : src.vert;
				src.frag = shaders.frag[name] ? shaders.frag[name]() : src.frag;
				method = name;
				gl && API.init();
			}
		},
		set spriteSheet(t) { texture = t; dirtyLayout = dirtyTexture = true },
		soilTexture() { dirtyTexture = true },
		setUniform(name, data) { locations[name] && (gl["uniform" +  data.length + "fv"](locations[name], data)) },
        addBasic(sprite, bufIdx = 0) {
			const bs = bufStore[bufIdx];
            if(bs.length < MAX_LENGTH) {
                var i = bs.length++ * STRIDE;
				const b = bs.data;
				const bI = bs.UI32
                b[i] = sprite.x;
                b[i + 1] = sprite.y;
                bI[i + 9] = sprite.idx;
            }
		},
        add(sprite, bufIdx = 0) {
			const bs = bufStore[bufIdx];
            if(bs.length < MAX_LENGTH) {
                var i = bs.length++ * STRIDE;
				const b = bs.data;
				const bI = bs.UI32
                b[i] = sprite.x;
                b[i + 1] = sprite.y;
                b[i + 2] = sprite.sx;
                b[i + 3] = sprite.sy;
                b[i + 4] = sprite.cx;
                b[i + 5] = sprite.cy;
                b[i + 6] = sprite.r;
                b[i + 7] = sprite.z;
                bI[i + 8] = sprite.color;
                bI[i + 9] = sprite.idx;
            }
        },
		spriteOffset(idx, cx, cy, px, py, sx, sy, res = {}) {
			const lo = texture.spriteSheet.layout;
			res.x = -((0.5 - cx) + px / (lo[idx * 4 + 2] * sx) - 0.5);
			res.y = -((0.5 - cy) + py / (lo[idx * 4 + 3] * sy) - 0.5);
			return res;
		},
        addPart(sprite, bufIdx = 0) { // Do not use in performance code
			const bs = bufStore[bufIdx];
            if(bs.length < MAX_LENGTH) {
				const lo = texture.spriteSheet.layout;
                var i = bs.length++ * STRIDE;
				const b = bs.data;
				const bI = bs.UI32
				const idx = sprite.idx !== undefined ? sprite.idx  : (sprite.sprIdx !== undefined ? sprite.sprIdx : 0);
                sprite.x  !== undefined ? b[i++] = sprite.x  : i++;
                sprite.y  !== undefined ? b[i++] = sprite.y  : i++;
                const sx = b[i++] = sprite.sx !== undefined ? sprite.sx  : 1;
                const sy = b[i++] = sprite.sy !== undefined ? sprite.sy  : 1;
				var cx = sprite.cx !== undefined ? sprite.cx  : 0.5;
				var cy = sprite.cy !== undefined ? sprite.cy  : 0.5;
				if(sprite.px !== undefined) { cx = -((0.5 - cx) + sprite.px / (lo[idx * 4 + 2] * sx) - 0.5) }
				if(sprite.py !== undefined) { cy = -((0.5 - cy) + sprite.py / (lo[idx * 4 + 3] * sy) - 0.5) }
				b[i++] = cx;
				b[i++] = cy;
                b[i++] = sprite.r  !== undefined ? sprite.r  : 0;
                b[i++] = sprite.z  !== undefined ? sprite.z  : 0.1;
                bI[i++] = sprite.color !== undefined ? sprite.color  : 0xFFFFFFFF;
                bI[i++] = idx;
            }
        },
		get offsets() { return {x: 0, y: 1, sx: 2, sy: 3, cx: 4, cy: 5, r: 6, z: 7, color: 8, idx: 9, stride: STRIDE} },
		get defaultSprite() { return defaultSprite },
		getBuffer(bufIdx) { return bufStore[bufIdx] },
        setBuffer(bufIdx, buffer) { bufStore[bufIdx] = buffer },
		lock(bufIdx = 0) { bufStore[bufIdx] !== undefined && (bufStore[bufIdx].lockPos = bufStore[bufIdx].length); return this },
		unlock(bufIdx = 0) { bufStore[bufIdx] !== undefined && (bufStore[bufIdx].lockPos = 0); return this },
        release(bufIdx = 0, pos) { bufStore[bufIdx] !== undefined && (bufStore[bufIdx].lockPos = pos); return this },
        createBuffer(bufIdx, defSprite = {}) {
            const dSpr = {...this.defaultSprite, ...defSprite};
			const b = new ArrayBuffer(MAX_LENGTH * STRIDE4);
            bufStore[bufIdx] = {
                shader: this,
                stride: STRIDE,
                length: 0,
                lockPos: 0,
                bufIdx,
                data: new Float32Array(b),
                UI32: new Uint32Array(b),
                UI8: new Uint8ClampedArray(b),
                ...bufferFunctions,
            };
            while (bufStore[bufIdx].length < MAX_LENGTH) { this.add(dSpr, bufIdx) }
			bufStore[bufIdx].length = 0;
            return bufStore[bufIdx];
        },
		clear(bufIdx = 0) {
			bufStore[bufIdx].length = bufStore[bufIdx].lockPos;
			return this;
		},
        draw(bufIdx = 0) {
			if (dirtyLayout) {
				gl.uniform2fv(locations.sheetSize, texture.spriteSheet.size);
                gl.uniform2uiv(locations.sheetLayout, texture.spriteSheet.layout32, 0, texture.spriteSheet.spriteCount * 2);
				dirtyLayout = false;
			}
			if (dirtyTexture) {
				texture.bind();
				dirtyTexture = false;
			}
			const b = bufStore[bufIdx];
			if (b && b.length) {
                gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer);
				const len = b.length > MAX_LENGTH ? MAX_LENGTH : b.length;
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.data.subarray(0, len * STRIDE));
                gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, len);
			}
        },
        use(view) {
            if (gl) {
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
				gl.uniform2fv(locations.origin, view.originArray);
				gl.uniformMatrix2fv(locations.view, false, view.matrix);
                return true;
            }
        },
		close() { // todo  need to finnish this function
			if (gl) {
				glUtils.delete({program, buffers});
				gl = locations = opts.color = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}
    };
	API.method = "default";
    return API;
};

