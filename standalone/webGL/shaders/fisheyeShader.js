import {glUtils} from "../glUtils.js";
export {fisheyeShader};
function fisheyeShader(opts = {}) {
	Object.assign(opts, { ...opts});
    const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			uniform vec2 FOV;
			out vec2 UV;
			void main() {
				gl_Position = vec4(verts, 1, 1);
				UV = verts * FOV;
			}`;
		},
		get frag() { return  `#version 300 es
			precision mediump float;
            #define PI ${Math.PI.toFixed(6)} /* 180 deg */
            uniform sampler2D tex;
			uniform vec4 forward; 
			uniform float fishScale;  // image may have unused edge pixels. this scales UV  to the fisheye circle
			in vec2 UV;
			out vec4 pixel;
			void main() {
				float z = UV.y * forward.w + forward.z;
				vec2 uv = vec2(
					UV.y * forward.z - forward.w,
					UV.x * forward.x - z * forward.y
				);	   
				z = UV.x * forward.y + z * forward.x; 
				float sz = sign(z);
				float s = atan(length(uv), abs(z)) / PI;
				float t = atan(uv.x, uv.y * sz);
				pixel = texture(tex, vec2(cos(t) * -sz * fishScale, sin(t)) * s + vec2(0.5));
			}`; 
		}
	};
    opts.color = new Float32Array(opts.color);
    var gl, program, locations, buffers, dirty, texture, scale;
    const locationDesc = ["A_verts", "U_FOV", "U_forward", "U_fishScale"];
    const bufferDesc = () => ({indices: {...glUtils.buffers.indices}, verts: {...glUtils.buffers.verts}});
    const API = {
		compile() { 
			if (gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},		
        init(gl_context, tex) {
            gl = gl_context;
			if (!glUtils.ready) { glUtils.context = gl_context }
            this.compile();
			texture = tex;
            glUtils.initBuffers(buffers = bufferDesc(), locations);
			this.FOV = new Float32Array([1,1]);
			this.forward = new Float32Array([1,0,1,0]);
			scale = 1;
        },
		set texture(tex) { texture = tex },
		get texture() { return texture },
		get scale() { return scale },
		set scale(v) {
			scale = v;
			dirty = true;
		},
		set yaw(v) {
			this.forward[0] = Math.cos(v);
			this.forward[1] = Math.sin(v);
			dirty = true;
		},
		set pitch(v) {
			this.forward[2] = Math.cos(v);
			this.forward[3] = Math.sin(v);
			dirty = true;
		},
        soil() { dirty = true },
        wash() { dirty = false },
        get isDirty() { dirty },
        draw(_dirty) {
			texture.bind();
			if (_dirty || dirty) {
				gl.uniform4fv(locations.forward, this.forward);
				this.wash();
			}
			const W = gl.canvas.width;
			const H = gl.canvas.height;
			if (W > H ) {
				this.FOV[0] = -1;
				this.FOV[1] = H / W; 
			}else {
				this.FOV[0] = -W / H;
				this.FOV[1] = 1; 
			}
			gl.uniform1f(locations.fishScale, scale);
			gl.uniform2fv(locations.FOV, this.FOV);
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);				
        },      
        use() { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
                gl.disable(gl.BLEND);
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
    return API;
};

