import {glUtils} from "../glUtils.jsm";

export {particleShader};
function particleShader(opts = {}) {
	Object.assign(opts, {
		maxLength: 256 * 256, 
		...opts,
	});
	
	const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			in vec3 posScale;  
			uniform mat2 view; 
			out vec2 map;
			void main() {
				map = verts;
				gl_Position = vec4(view * ((verts * posScale.z) + posScale.xy), 0, 1);
			}`;
		},
		get frag() { return `#version 300 es
			precision mediump float;
			in vec2 map;
			uniform vec4 color;
			out vec4 pixel;
			void main() {
				float val = smoothstep(0.0, blur, 1.0 - length(map));
				if (val <= 0.0) { discard; }
				pixel = color;
			}`; 
		}
	}

    var gl, program, locations, buffers, bufDirty, viewDirty, view, colorDirty, length = 0;
    const STRIDE = 2 + 1, STRIDE4 = STRIDE * 4;   // pos x y, scale   
    const instanceBuffer = new ArrayBuffer(opts.maxLength * STRIDE4);  
    const locationDesc = ["A_posScale", "A_verts", "U_view"];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},  
		verts: {...glUtils.buffers.verts},
        instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer},
        posScale: {size: 3, stride: STRIDE4, divisor: 1},
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
        },
        add(particle) {
            if(length < opts.maxLength) {
                var i = length++ * STRIDE;
                this.bufF32[i++] = particle.x;
                this.bufF32[i++] = particle.y;
                this.bufF32[i++] = particle.scale;
                bufDirty = true;
            }
        },     

        soil() { bufDirty = viewDirty = colorDirty = view.soil() },
        wash() { bufDirty = viewDirty = colorDirty = false },
        get isDirty() { return bufDirty || viewDirty || colorDirty },
        clear() { length = 0 },
        draw(dirty) {
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
				gl = locations  = instanceBuffer = this.bufF32 = view = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}		
    };
    return API;
};
