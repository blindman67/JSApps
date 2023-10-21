import {glUtils} from "../glUtils.js";
export {pointShader};
function pointShader(opts = {}) {
	Object.assign(opts, {
		alphaCut: 0,
		maxLength: 1024,
		...opts
	});
    const shaders = {
		vert: {
			default() { return `#version 300 es
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 verts;
				in vec4 posScaleZ;  // sprite position, scale, and z dist
				in vec4 color;     // RGBA to tint sprite and fade Alpha 0 and sprite is not rendered
				uniform mat2 view;  // View 2D scale rotate matrix
				uniform vec2 origin;
				uniform vec2 screen; //
				out vec2 sprUV;
				flat out vec4 col;
				flat out float falloffPower;
				void main() {
					if (color.a <= alphaCut) {
						gl_Position = vec4(vec3(-2), 1);
					} else {
						col = color;
						sprUV = verts;
						float distScale = 1.0 - (posScaleZ.w - 0.4) * 2.0;
						vec2 size = vec2(posScaleZ.z);
						falloffPower = 8.0 - posScaleZ.w * 3.75;
						vec2 loc = mod((posScaleZ.xy - origin) * distScale + size, screen + size * 2.0) - (screen / 2.0) - size;
						loc = view * (loc  + verts * posScaleZ.z);
						gl_Position =  vec4(loc, posScaleZ.w, 1);
					}
				}`;
			},
			noPointScale() { return `#version 300 es
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 verts;
				in vec4 posScaleZ;  // sprite position, scale, and z dist
				in vec4 color;      // RGBA to tint sprite and fade Alpha 0 and sprite is not rendered
				uniform mat2 view;  // View 2D scale rotate matrix
				uniform vec2 origin;
				uniform vec2 screen; //
				uniform float zoom;
				out vec2 sprUV;
				flat out vec4 col;
				flat out float falloffPower;
				void main() {
					if (color.a <= alphaCut) {
						gl_Position = vec4(vec3(-2), 1);
					} else {
                        col = color;
						sprUV = verts;
						falloffPower = 8.0 - posScaleZ.w * 3.75;
						float distScale = 1.0 - (posScaleZ.w - 0.4) * 2.0;
						vec2 loc = mod((posScaleZ.xy - origin) * distScale + posScaleZ.z, screen + posScaleZ.z * 2.0) - (screen / 2.0) - posScaleZ.z;
						loc = view * (loc + verts * (posScaleZ.z  / zoom));
						gl_Position =  vec4(loc, 0.3, 1);
					}
				}`;
			},
			nebular() { return `#version 300 es
				precision mediump float;
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 verts;
				in vec4 posScaleZ;  // sprite position and scale
				in vec4 color;     // RGBA to tint sprite and fade Alpha 0 and sprite is not rendered
				uniform mat2 view;  // View 2D scale rotate matrix
				uniform vec2 origin;
				uniform vec2 screen;
				uniform float alpha;
				out vec2 sprUV;
				out vec2 pos;
				flat out vec4 col;
				out float ss;
				void main() {
					if (color.a <= alphaCut) {
						gl_Position = vec4(vec3(-2), 1);
					} else {
						col = color * 2.0 - 1.0;
						sprUV = verts;

						float distScale = 1.0 - posScaleZ.w;
						float distScale1 = 1.0 - (posScaleZ.w - 0.85) * 10.0;
						vec2 size = vec2(posScaleZ.z);
						vec2 loc = mod((posScaleZ.xy - origin) * distScale + size, screen + size * 2.0) - (screen / 2.0) - size;
						pos = posScaleZ.xy + loc;
						ss = (distScale1 * 15.0 * alpha * verts.x * verts.y + 1.0) * (col.r + col.g + col.b);
						loc = view * (loc  + verts * posScaleZ.z);
						gl_Position =  vec4(loc, posScaleZ.w, 1);
					}
				}`;
			},
			hyperSpace() { return `#version 300 es
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 verts;
				in vec4 posScaleZ;  // sprite position, scale, and z dist
				in vec4 color;     // RGBA to tint sprite and fade Alpha 0 and sprite is not rendered
				uniform mat2 view;  // View 2D scale rotate matrix
				uniform vec2 origin;
				uniform vec2 screen; //
                uniform vec2 direction;  // axis in direction of travel
                uniform float speed;
				uniform float zoom;
				out vec2 sprUV;
				flat out vec4 col;
				flat out float falloffPower;
				void main() {
					if (color.a <= alphaCut) {
						gl_Position = vec4(vec3(-2), 1);
					} else {
                        col = color;
						sprUV = verts;
						float inverseScale = posScaleZ.z  / zoom;
						float distScale = 1.0 - (posScaleZ.w - 0.4) * 2.0;
						vec2 size = vec2(inverseScale * direction.x * speed, inverseScale * direction.y * speed);
						falloffPower = 8.0 - posScaleZ.w * 3.75;
						vec2 loc = mod((posScaleZ.xy - origin) * distScale + size, screen + size * 2.0) - (screen / 2.0) - size;
                        vec2 v = vec2(
                            verts.x * direction.x * speed * inverseScale - verts.y * direction.y,
                            verts.x * direction.y * speed * inverseScale + verts.y * direction.x
                        );
						loc = view * (loc  + v * inverseScale);
						gl_Position =  vec4(loc, posScaleZ.w, 1);
					}
				}`;
			},
		},
		frag: {
			default() { return  `#version 300 es
				precision mediump float;
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 sprUV;
				flat in vec4 col;
				flat in float falloffPower;
				out vec4 pixel;
				void main() {
					pixel = vec4(col.rgb, col.a * pow(1.0 - length(sprUV), falloffPower));
					if (pixel.a <= alphaCut) { discard; }
				}`;
			},
            hyperSpace() { return  `#version 300 es
				precision mediump float;
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 sprUV;
				flat in vec4 col;
				flat in float falloffPower;
				out vec4 pixel;
				void main() {
					pixel = vec4(col.rgb, col.a * pow(1.0 - length(sprUV), falloffPower));
					if (pixel.a <= alphaCut) { discard; }
				}`;
			},
			nebular() { return  `#version 300 es
				precision mediump float;
				uniform float alpha;
				#define alphaCut ${("" + opts.alphaCut).padEnd(3, ".0")}
				in vec2 sprUV;
				in vec2 pos;
				flat in vec4 col;
				in float ss;
				out vec4 pixel;
				void main() {
					float l = 1.0 - length(sprUV);;
					float a = sin(dot(normalize(pos * (sprUV + 1.0)), sprUV) * ss * l) * 0.5 + 0.5;
					pixel = vec4(mix(col.rgb, col.brg, a), col.a * a * l * alpha);
					if (pixel.a <= alphaCut) { discard; }
				}`;
			},
		},
		draw: {
			default() {	},
			nebular() { gl.uniform1f(locations.alpha, API.alpha) },
            hyperSpace() {
                gl.uniform1f(locations.speed, hyperSpeed);
                gl.uniform2fv(locations.direction, hyperDir);
            },
		},
		locations: {
			default() { return ["A_verts", "A_posScaleZ", "A_color", "U_view", "U_origin", "U_screen" ] },
			noPointScale() { return ["A_verts", "A_posScaleZ", "A_color", "U_view", "U_origin", "U_screen", "U_zoom" ] },
			hyperSpace() { return ["A_verts", "A_posScaleZ", "A_color", "U_view", "U_origin", "U_screen", "U_zoom", "U_direction", "U_speed" ] },
			nebular() { return ["A_verts", "A_posScaleZ", "A_color", "U_view", "U_origin", "U_screen", "U_alpha" ] },
		},
	}
	shaders.frag.noPointScale = shaders.frag.default;
    const bufferFunctions = {
        clear() { this.length = this.lockPos; return this },
        lock() { this.lockPos = this.length; return this },
        unlock() { this.lockPos = 0; return this },
        release(pos) { this.lockPos = pos; return this },
    };
	const src = {vert: null, frag: null};
	const STRIDE = 4 + 1, STRIDE4 = STRIDE * 4;
    const MAX_LENGTH = opts.maxLength;
    const instanceBuffer = () => new ArrayBuffer(MAX_LENGTH * STRIDE4);
    var gl, program, locations, buffers, dirty, method, locationDesc, texture, bufStore = [], hyperSpeed, hyperDir;
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},
		verts: {...glUtils.buffers.verts},
		instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer()},
		posScaleZ: {size: 4, stride: STRIDE4, divisor: 1},
		color:    {size: 4, offset: 4 * 4, stride: STRIDE4, divisor: 1, dataType: gl.UNSIGNED_BYTE, normalize: true},
	});
    const API = {
        alpha: 1,
        set hyperSpeed(s) { hyperSpeed = s },
        set hyperDirection(dir) {
            if (hyperDir === undefined) { hyperDir = new Float32Array(2) }
            hyperDir[0] = Math.cos(dir);
            hyperDir[1] = Math.sin(dir);
        },
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
            for(const key of Object.keys(buffers)) {  (key !== "vertexBuffer" && key !== "instanceBuffer") && (buffers[key] = undefined) }
            buffers.instanceBuffer = buffers.instanceBuffer.glBuffer;
        },
		get methods() { return ["default", "noPointScale", "nebular", "hyperSpace"] },
		get method() { return method },
		set method(name) {
			if(name != method) {
				locationDesc = shaders.locations[name] ? shaders.locations[name]() : locationDesc;
				src.vert = shaders.vert[name] ? shaders.vert[name]() : src.vert;
				src.frag = shaders.frag[name] ? shaders.frag[name]() : src.frag;
				this.drawExtra = shaders.draw[name] ? shaders.draw[name].bind(this) : shaders.draw.default.bind(this);
				method = name;
				gl && API.init();
			}
		},
		setUniform(name, data) { locations[name] && (gl["uniform" +  data.length + "fv"](locations[name], data)) },
        add(point, bufIdx = 0) {
			const bs = bufStore[bufIdx];
            if(bs.length < MAX_LENGTH) {
                var i = bs.length++ * STRIDE;
				const b = bs.data;
				const bI = bs.UI32
                b[i++] = point.x;
                b[i++] = point.y;
                b[i++] = point.s;
                b[i++] = point.z;
                bI[i++] = point.color;
				dirty = true;
            }
        },
		get offsets() { return {x: 0, y: 1, s: 2, z: 3, color: 4, stride: STRIDE} },
		get defaultPoint() { return {x: 0, y: 0, s: 1, z: 0, color: 0xFFFFFFFF} },
		getBuffer(bufIdx) { return bufStore[bufIdx] },
        setBuffer(bufIdx, buffer) { bufStore[bufIdx] = buffer; dirty = true },
		lock(bufIdx = 0) { bufStore[bufIdx].lockPos = bufStore[bufIdx].length; return this },
		unlock(bufIdx = 0) { bufStore[bufIdx].lockPos = 0;  return this },
        release(bufIdx, pos) { bufStore[bufIdx].lockPos = pos; return this },
        createBuffer(bufIdx, defPoint = {}) {
            const dPnt = {...this.defaultPoint, ...defPoint};
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
            while (bufStore[bufIdx].length < MAX_LENGTH) { this.add(dPnt, bufIdx) }
			bufStore[bufIdx].length = 0;
            return bufStore[bufIdx];
        },
		clear(bufIdx = 0) {
			bufStore[bufIdx].length = bufStore[bufIdx].lockPos;
			dirty = true;
            return this;
		},
        draw(bufIdx = 0, points = 1) {  // points as a fraction of buffer.length. All points are moved to GPU
			const b = bufStore[bufIdx];
            if (dirty) {
				dirty = false;
				this.drawExtra();
                gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.data.subarray(0, b.length * STRIDE));
			} else { this.drawExtra() }
            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, b.length * points | 0);
        },
        use(view, blend) {
            if (gl) {
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
				gl.uniform2fv(locations.screen, view.screenArray);
				gl.uniform2fv(locations.origin, view.originArray);
				gl.uniformMatrix2fv(locations.view, false, view.matrix);
				locations.zoom && gl.uniform1f(locations.zoom, view.zoom);
                return true;
            }
        },
		close() {
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

