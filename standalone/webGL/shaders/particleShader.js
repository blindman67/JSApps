import {glUtils} from "../glUtils.js";

export {particleFeedbackShader, particleFeedbackCShader, particleShader};
function particleFeedbackShader(opts = {}) {
	Object.assign(opts, {
		colorA: [1,1,1,1], 
		colorB: [1,1,1,1], 
		maxLength: 256 * 256, 
		lighten: true, 
		blur: 0.9,
		...opts,
	});
	
	const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			in vec4 posScaleCol;  // sprite position x, y (xy) scale (z) color mix
			in vec4 spinPush;  
			uniform sampler2D tex;
			uniform mat2 view;   // View 2D scale rotate matrix    	
			out vec4 map;
			out vec2 tCoord;
			out vec2 tCoord1;
			void main() {
				vec2 ts = vec2(textureSize(tex,0));
				map = vec4(verts, posScaleCol.w, spinPush.z);
				vec2 t = view * ((verts * posScaleCol.z) + posScaleCol.xy);
				tCoord  = view * (verts * posScaleCol.z + posScaleCol.xy) * 0.5 + 0.5;
				
				float xd = cos(spinPush.x);
				float yd = sin(spinPush.x);
				tCoord1  = view * ((vec2(verts.x * xd - verts.y * yd, verts.x * yd + verts.y * xd) * (posScaleCol.z + spinPush.y)) + posScaleCol.xy) * 0.5 + 0.5;
				gl_Position = vec4(t, 0, 1);
			}`;
		},
		get frag() { return `#version 300 es
			precision mediump float;
			uniform sampler2D tex;
			in vec4 map;
			in vec2 tCoord;
			in vec2 tCoord1;
			uniform vec4 colorA;
			uniform vec4 colorB;
			uniform float blur;
			out vec4 pixel;
			
			void main() {
				float l = length(map.xy);
				if(l < 1.0) {
					float val = smoothstep(0.0, blur, 1.0 - l);
					if (val <= 0.0) { discard; }
					else {
						vec4 color = mix(colorA, colorB, map.z);
						vec4 c1 = texture(tex, tCoord);
						vec4 c2 = texture(tex, tCoord1);
						float cm = smoothstep(0.0, map.w, 1.0-l);
						//pixel = vec4(mix(mix(c2.rgb,c1.rgb, val), color.rgb, smoothstep(0.0, map.w, l) * color.a), val);
						vec4 fb = mix(c2, c1, val);
						pixel = fb + color * (1.0 - val);
						//vec2 aa = map.w < 0.0 ? vec2(-map.w, 1.0) : vec2(0, map.w);
						//pixel = vec4(mix(mix(c2.rgb,c1.rgb, val), color.rgb, val *  color.a * smoothstep(aa.x, aa.y, 1.0-l)), val);
					}
				} else {
					 discard;
				}
			}`; 
		}
	}
	var blends;
    opts.colorA = new Float32Array(opts.colorA);
    opts.colorB = new Float32Array(opts.colorB);
    var gl, program, locations, buffers, bufDirty, viewDirty, view, colorDirty, length = 0;
    const STRIDE = 2 + 1 + 1 + 4, STRIDE4 = STRIDE * 4;   // pos x y, scale   
    const instanceBuffer = new ArrayBuffer(opts.maxLength * STRIDE4);  
    const locationDesc = ["A_posScaleCol","A_spinPush", "A_verts", "U_view", "U_colorA", "U_colorB","U_blur"];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},  
		verts: {...glUtils.buffers.verts},
        instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer},
        posScaleCol: {size: 4, stride: STRIDE4, divisor: 1},
        spinPush: {size: 4, offset: 4 * 4, stride: STRIDE4, divisor: 1},
    });
    const API = {
		compile() { 
			if(gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},
        init(gl_context, _view, tex) {
            gl = gl_context;
            view = _view;
			this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
            this.bufF32 = new Float32Array(instanceBuffer);
			this.lighten = opts.lighten;
			this.blur = opts.blur;
			this.tex = tex;
        },
        add(particle) {
            if(length < opts.maxLength) {
                var i = length++ * STRIDE;
                this.bufF32[i++] = particle.x;
                this.bufF32[i++] = particle.y;
                this.bufF32[i++] = particle.scale;
                this.bufF32[i++] = particle.cMix;
                this.bufF32[i++] = particle.spin;
                this.bufF32[i++] = particle.push;
                this.bufF32[i++] = particle.alpha;
                bufDirty = true;
            }
        },     
		blur: 1,
        set colorA_Int32(int32) { glUtils.colors.int32(opts.colorA, int32); colorDirty = true },
        set colorA_RGBA(rgba) { glUtils.colors.RGBA(opts.colorA, rgba); colorDirty = true },
        set colorB_Int32(int32) { glUtils.colors.int32(opts.colorB, int32); colorDirty = true },
        set colorB_RGBA(rgba) { glUtils.colors.RGBA(opts.colorB, rgba); colorDirty = true },
        soil() { bufDirty = viewDirty = colorDirty = view.soil() },
        wash() { bufDirty = viewDirty = colorDirty = false },
        get isDirty() { return bufDirty || viewDirty || colorDirty },
        clear() { length = 0 },
        draw(dirty) {
			this.tex.bind();
			gl.uniform1f(locations.blur, this.blur);
            if (colorDirty || dirty) { 
				gl.uniform4fv(locations.colorA, opts.colorA);
				gl.uniform4fv(locations.colorB, opts.colorB);
			}
            if (viewDirty || dirty) { gl.uniformMatrix2fv(locations.view, false, view.matrix) }
            if (length) {
                if (bufDirty || dirty) {
                    gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer.glBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufF32.subarray(0, length * STRIDE));
                }
                gl.drawElementsInstanced(gl.TRIANGLES, 6, buffers.indices.dataType, 0, length);   
            }
            this.wash();
        },      
        use() { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
                return true;
            }
        },
		close() {
			if (gl) {
				glUtils.delete({program, buffers});
				gl = locations = opts.color = instanceBuffer = this.bufF32 = view = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}		
    };
    return API;
};
function particleFeedbackCShader(opts = {}) {
	Object.assign(opts, {
		colorA: [1,1,1,1], 
		colorB: [1,1,1,1], 
		maxLength: 256 * 256, 
		lighten: true, 
		blur: 0.9,
		...opts,
	});
	
	const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			in vec4 posScaleCol;  // sprite position x, y (xy) scale (z) color mix
			in vec4 spinPush;  
			uniform sampler2D tex;
			uniform mat2 view;   // View 2D scale rotate matrix    	
			out vec4 map;
			out vec2 tCoord;
			out vec2 tCoord1;
			out float vv1;
			void main() {
				vec2 ts = vec2(textureSize(tex,0));
				map = vec4(verts, posScaleCol.w / ts.y , spinPush.z);
				vec2 t = view * ((verts * posScaleCol.z) + posScaleCol.xy);
				tCoord  = view * (verts * posScaleCol.z + posScaleCol.xy) * 0.5 + 0.5;
				float xd = cos(spinPush.x);
				float yd = sin(spinPush.x);
				tCoord1  = view * ((vec2(verts.x * xd - verts.y * yd, verts.x * yd + verts.y * xd) * (posScaleCol.z + spinPush.y)) + posScaleCol.xy) * 0.5 + 0.5;
				gl_Position = vec4(t, 0, 1);
			}`;
		},
		get frag() { return `#version 300 es
			precision mediump float;
			uniform sampler2D tex;
			in vec4 map;
			in vec2 tCoord;
			in vec2 tCoord1;

			uniform vec4 colorA;
			uniform vec4 colorB;
			uniform float blur;
			out vec4 pixel;
			
			void main() {
				float l = length(map.xy);
				if(l < 1.0) {
					vec3 norm = vec3(map.xy, sin(acos(l)));
					float val = smoothstep(0.0, blur, 1.0 - l);
					vec3 r = reflect(vec3(0,0,-1), norm);
					vec3 f = refract(vec3(0,0,-1), norm, 0.2);
					//float v = dot(normalize(vec3(sin(vv1),cos(vv1),cos(vv1))), norm);
					vec4 c = texture(tex, tCoord);
					vec4 cr = mix(texture(tex, tCoord1 + r.xy  * map.z), colorA, colorA.a);
					vec4 cf = mix(texture(tex, tCoord1 + f.xy  * map.z), colorB, colorB.a);
					//vec2 aa = map.w < 0.0 ? vec2(-map.w, 1.0) : vec2(0, map.w);
					vec4 mixed = mix(cr, cf, val);
					pixel = mix(vec4(mixed.rgb, mixed.a * val), c, map.w); 
				} else {
					 discard;
				}
			}`; 
		}
	}
	var blends;
    opts.colorA = new Float32Array(opts.colorA);
    opts.colorB = new Float32Array(opts.colorB);
    var gl, program, locations, buffers, bufDirty, viewDirty, view, colorDirty, length = 0;
    const STRIDE = 2 + 1 + 1 + 4, STRIDE4 = STRIDE * 4;   // pos x y, scale   
    const instanceBuffer = new ArrayBuffer(opts.maxLength * STRIDE4);  
    const locationDesc = ["A_posScaleCol","A_spinPush", "A_verts", "U_view", "U_colorA", "U_colorB","U_blur"];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},  
		verts: {...glUtils.buffers.verts},
        instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer},
        posScaleCol: {size: 4, stride: STRIDE4, divisor: 1},
        spinPush: {size: 4, offset: 4 * 4, stride: STRIDE4, divisor: 1},
    });
    const API = {
		compile() { 
			if(gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},
        init(gl_context, _view, tex) {
            gl = gl_context;
            view = _view;
			this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
            this.bufF32 = new Float32Array(instanceBuffer);
			this.lighten = opts.lighten;
			this.blur = opts.blur;
			this.tex = tex;
        },
        add(particle) {
            if(length < opts.maxLength) {
                var i = length++ * STRIDE;
                this.bufF32[i++] = particle.x;
                this.bufF32[i++] = particle.y;
                this.bufF32[i++] = particle.scale;
                this.bufF32[i++] = particle.cMix;
                this.bufF32[i++] = particle.spin;
                this.bufF32[i++] = particle.push;
                this.bufF32[i++] = particle.alpha;
                bufDirty = true;
            }
        },     
		blur: 1,
        set colorA_Int32(int32) { glUtils.colors.int32(opts.colorA, int32); colorDirty = true },
        set colorA_RGBA(rgba) { glUtils.colors.RGBA(opts.colorA, rgba); colorDirty = true },
        set colorB_Int32(int32) { glUtils.colors.int32(opts.colorB, int32); colorDirty = true },
        set colorB_RGBA(rgba) { glUtils.colors.RGBA(opts.colorB, rgba); colorDirty = true },
        soil() { bufDirty = viewDirty = colorDirty = view.soil() },
        wash() { bufDirty = viewDirty = colorDirty = false },
        get isDirty() { return bufDirty || viewDirty || colorDirty },
        clear() { length = 0 },
        draw(dirty) {
			this.tex.bind();
			gl.uniform1f(locations.blur, this.blur);
            if (colorDirty || dirty) { 
				gl.uniform4fv(locations.colorA, opts.colorA);
				gl.uniform4fv(locations.colorB, opts.colorB);
			}
            if (viewDirty || dirty) { gl.uniformMatrix2fv(locations.view, false, view.matrix) }
            if (length) {
                if (bufDirty || dirty) {
                    gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer.glBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufF32.subarray(0, length * STRIDE));
                }
                gl.drawElementsInstanced(gl.TRIANGLES, 6, buffers.indices.dataType, 0, length);   
            }
            this.wash();
        },      
        use() { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
                return true;
            }
        },
		close() {
			if (gl) {
				glUtils.delete({program, buffers});
				gl = locations = opts.color = instanceBuffer = this.bufF32 = view = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}		
    };
    return API;
};
function particleShader(opts = {}) {
	Object.assign(opts, {
		colorA: [1,1,1,1], 
		colorB: [1,1,1,1], 
		maxLength: 256 * 256, 
		lighten: true, 
		blur: 0.9,
		...opts,
	});
	
	const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			in vec4 posScaleCol;  // sprite position x, y (xy) scale (z) color mix
			uniform mat2 view;   // View 2D scale rotate matrix    	
			out vec4 map;
			void main() {
				map = vec4(verts, posScaleCol.w, posScaleCol.w);
				vec2 t = view * ((verts * posScaleCol.z) + posScaleCol.xy);
				gl_Position = vec4(t, 0, 1);
			}`;
		},
		get frag() { return `#version 300 es
			precision mediump float;
			in vec4 map;
			uniform vec4 colorA;
			uniform vec4 colorB;
			uniform float blur;
			out vec4 pixel;
			
			void main() {
				float l = length(map.xy);
				if(l < 1.0) {
					float val = smoothstep(0.0, blur * 2.0, 1.0 - l);
					if (val <= 0.0) { discard; }
					else {
						vec4 color = mix(colorA, colorB, map.z);
						vec2 aa = map.w < 0.0 ? vec2(-map.w, 1.0) : vec2(0, map.w);

						pixel = vec4(color.rgb,  color.a * val * smoothstep(aa.x, aa.y, 1.0 - l));
					}
				} else {
					 discard;
				}
			}`; 
		}
	}
	var blends;
    opts.colorA = new Float32Array(opts.colorA);
    opts.colorB = new Float32Array(opts.colorB);
    var gl, program, locations, buffers, bufDirty, viewDirty, view, colorDirty, length = 0;
    const STRIDE = 2 + 1 + 1 + 4, STRIDE4 = STRIDE * 4;   // pos x y, scale   
    const instanceBuffer = new ArrayBuffer(opts.maxLength * STRIDE4);  
    const locationDesc = ["A_posScaleCol","A_spinPush", "A_verts", "U_view", "U_colorA", "U_colorB","U_blur"];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},  
		verts: {...glUtils.buffers.verts},
        instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer},
        posScaleCol: {size: 4, stride: STRIDE4, divisor: 1},
    });
    const API = {
		compile() { 
			if(gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},
        init(gl_context, _view) {
            gl = gl_context;
            view = _view;
			this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
            this.bufF32 = new Float32Array(instanceBuffer);
			this.lighten = opts.lighten;
			this.blur = opts.blur;
        },
        add(particle) {
            if(length < opts.maxLength) {
                var i = length++ * STRIDE;
                this.bufF32[i++] = particle.x;
                this.bufF32[i++] = particle.y;
                this.bufF32[i++] = particle.scale;
                this.bufF32[i++] = particle.cMix;
                bufDirty = true;
            }
        },     
		blur: 1,
        set colorA_Int32(int32) { glUtils.colors.int32(opts.colorA, int32); colorDirty = true },
        set colorA_RGBA(rgba) { glUtils.colors.RGBA(opts.colorA, rgba); colorDirty = true },
        set colorB_Int32(int32) { glUtils.colors.int32(opts.colorB, int32); colorDirty = true },
        set colorB_RGBA(rgba) { glUtils.colors.RGBA(opts.colorB, rgba); colorDirty = true },
        soil() { bufDirty = viewDirty = colorDirty = view.soil() },
        wash() { bufDirty = viewDirty = colorDirty = false },
        get isDirty() { return bufDirty || viewDirty || colorDirty },
        clear() { length = 0 },
        draw(dirty) {
			gl.uniform1f(locations.blur, this.blur);
            if (colorDirty || dirty) { 
				gl.uniform4fv(locations.colorA, opts.colorA);
				gl.uniform4fv(locations.colorB, opts.colorB);
			}
            if (viewDirty || dirty) { gl.uniformMatrix2fv(locations.view, false, view.matrix) }
            if (length) {
                if (bufDirty || dirty) {
                    gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer.glBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufF32.subarray(0, length * STRIDE));
                }
                gl.drawElementsInstanced(gl.TRIANGLES, 6, buffers.indices.dataType, 0, length);   
            }
            this.wash();
        },      
        use() { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, this.lighten ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
                return true;
            }
        },
		close() {
			if (gl) {
				glUtils.delete({program, buffers});
				gl = locations = opts.color = instanceBuffer = this.bufF32 = view = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}		
    };
    return API;
};
