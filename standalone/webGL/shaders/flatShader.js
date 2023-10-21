import {glUtils} from "../glUtils.js";
export {flatShader};
function flatShader(opts = {}) {
	Object.assign(opts, {color: [1,1,1,1], ...opts});
    const shaders = {
		vert: {
			normal() { return `#version 300 es
				in vec2 verts;
				out vec2 texCoord;
				void main() { 
					texCoord = verts * 0.5 + 0.5;
					gl_Position =  vec4(verts, 0, 1); 
				}`;
			},
		},
		frag: {
			normal() { return  `#version 300 es
				precision mediump float;
				uniform sampler2D tex;
				uniform vec4 color;
				uniform float time;
				in vec2 texCoord;
				out vec4 pixel;
				void main() {
					vec4 p = texture(tex, texCoord);
					pixel = vec4(p.rgb, p.a * color.a);
				}`; 
			},
			push() { return  `#version 300 es
				precision mediump float;
				uniform sampler2D tex;
				uniform vec4 color;
				uniform float time;
				in vec2 texCoord;
				out vec4 pixel;
				void main() {

					vec2 tx = vec2(8.8 * color.b) / vec2(textureSize(tex,0));
					vec2 tt = texCoord;
					vec4 p = texture(tex, tt);
					vec2 tcc = vec2(cos(time + p.x - 0.5),sin(time+ p.y - 0.5));
					vec2 tc = tcc * tx;
					float a = (p.x - 0.5) * 6.4 + time;
					tt +=  vec2(cos(a - 0.5), sin(a - 0.5+p.z)) * p.y * tx + tc;
					vec3 p1 = texture(tex, tt).rgb;
					a = (p1.y - 0.5) * -8.4  + time;
					tt += vec2(cos(a*p1.x), sin(a)) * p1.z * tx + tc;
					vec3 pp = texture(tex, tt).rgb;
					//pixel = vec4(mix(mix(pp, p1, color.g), p.rgb, color.r), p.a * color.a);					
					pixel = vec4(
						mix(
							mix(p.rgb, p1, abs(tcc.x) * color.b), 
							mix(p.rgb, pp, abs(tcc.y) * color.g), 
						    color.r
						), p.a * color.a
					);					
				}`; 
			},
			pushMore() { return  `#version 300 es
				precision mediump float;
				uniform sampler2D tex;
				uniform vec4 color;
				uniform float time;
				in vec2 texCoord;
				out vec4 pixel;
				void main() {
					vec2 tx = vec2(10.8 * color.b) / vec2(textureSize(tex,0));
					vec2 tcc = vec2(cos(time),sin(time));
					vec2 tc = tcc * tx;
					vec2 tt = texCoord;
					vec4 p = texture(tex, tt);
					float a = (p.x + tt.x + tt.y)* 24.4* p.y;
					tt +=  vec2(cos(a), sin(a*p.z)) * tx + tc;
					vec3 p1 = texture(tex, tt).rgb;
					a = (p1.y + tt.x + tt.y) * 15.4* p1.z;
					tt += vec2(cos(a*p1.x), sin(a))  * tx + tc;
					vec3 pp = texture(tex, tt).rgb;
					a = (pp.z + tt.x + tt.y) * 36.4* pp.y;
					tt += vec2(cos(a*pp.y), sin(a*pp.z))  * tx + tc;
					vec3 pp1 = texture(tex, tt).rgb;					
					pixel = vec4(mix(mix(mix(pp, p1, color.g), pp1, color.b), p.rgb, color.r), p.a * color.a);					
				}`; 
			},			
		},
		locations: {
			normal() { return ["A_verts", "U_color", "U_time"] },
		},
	};
	const src = {
		vert: null,
		frag: null,
	};

    opts.color = new Float32Array(opts.color);
    var gl, program, locations, buffers, dirty, texture, method, locationDesc,time;
    const bufferDesc = () => ({indices: {...glUtils.buffers.indices}, verts: {...glUtils.buffers.verts}});
    const API = {
		compile() { 
			if (gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},		
        init(gl_context = gl, tex = texture) {
            gl = gl_context;
            this.compile();
			texture = tex;
            glUtils.initBuffers(buffers = bufferDesc(), locations);
        },
		get methods() { return ["normal", "push", "pushMore"] },
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
		set texture(tex) { texture = tex },
		get texture() { return texture },
        set colorInt32(int32) { glUtils.colors.int32(opts.color, int32); dirty = true },
        set colorRGBA(rgba) { glUtils.colors.RGBA(opts.color, rgba); dirty = true },
		set time(t) { time = t; dirty = true },
        soil() { dirty = true },
        wash() { dirty = false },
        get isDirty() { dirty },
        draw(_dirty) {
			texture.bind();
			if (_dirty || dirty) {
				gl.uniform1f(locations.time, time);
				gl.uniform4fv(locations.color, opts.color);
				this.wash();
			}
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);				
        },      
        use(noBlend = false) { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
				if(noBlend) {
					gl.disable(gl.BLEND);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
					
				} else {
					gl.enable(gl.BLEND);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				}
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
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
	API.method = "normal";
    return API;
};

