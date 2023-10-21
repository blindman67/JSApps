import {glUtils} from "../glUtils.jsm";


export {joinShader};
function joinShader(opts = {}) {
	Object.assign(opts, {
        colorA: [1,1,1,1], 
        colorB: [1,1,1,1], 
        maxLength: 256 * 256,  // max number of lines
        lighten: true,         // if true blend mode is lighten else source over
        joinMaxLength: 100,    // max length of line in pixels (approx)
        joinMaxWidth: 3,       // half width in pixel
        joinMinWidth: 2,        // half width in pixel use in calcs does not represent visual size
        joinCurve: 4,          // the exponent of the curve. Must be > 0
        blur: 0.01,            // blurs edges
		...opts,
    });
	
    const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			in vec4 fromToPos;  // position From x, y to z w 
			in vec2 fromToSize;
			uniform mat2 view;   
			uniform vec3 jMinMaxArea;
			out vec2 map;
			out float len;
			out float size;
			void main() {
				
				float s = verts.x > 0.0 ? fromToSize.x : fromToSize.y;
				vec2 dir = fromToPos.xy - fromToPos.zw;
				float dist = length(dir) / 2.0;
				if (jMinMaxArea.z / (dist - jMinMaxArea.y) < jMinMaxArea.x) {
					map = verts;
					gl_Position = vec4(vec3(2),1);
				} else {
					len = dist;
					s = s * (jMinMaxArea.y - jMinMaxArea.x) + jMinMaxArea.x; 
					size = s;
					map = verts * vec2(dist, s);
					vec2 loc = (fromToPos.xy + fromToPos.zw) / 2.0;
					dir = normalize(dir);
					vec2 p = mat2(dir.x * dist, dir.y * dist, - dir.y * s, dir.x * s) * verts;
					gl_Position = vec4(view * (p + loc), 0, 1);
				}
			}`;
		},
		get frag() { return  `#version 300 es
			precision mediump float;
			in vec2 map;
			in float len;
			in float size; 
			uniform vec4 colorA;
			uniform vec4 colorB;
			uniform vec4 blurCurveJoinLen;
			out vec4 pixel;
			void main() {
				float w = sqrt(size * size - (map.y * map.y));
				if (len - abs(map.x) > w) {
					float l = (len - w) / blurCurveJoinLen.w;
					float mx = pow(abs(map.x) / (len - w), blurCurveJoinLen.y) * l + (1.0 - l);
					float vx = smoothstep(mx -blurCurveJoinLen.x, mx, abs(map.y / size));
					if (vx > 0.99) { discard; }
					else {
						vec4 col = mix(colorA, colorB, mx);
						pixel = vec4(col.rgb, col.a * (1.0 - vx) );
					}
				} else { discard; }
			}`; 
		}
	};
        

		

    opts.colorA = new Float32Array(opts.colorA);
    opts.colorB = new Float32Array(opts.colorB);
    var gl, program, locations, buffers, bufDirty, viewDirty, view, colorDirty, length = 0, maxJoinSqr;
    const STRIDE = 2 + 2 + 2, STRIDE4 = STRIDE * 4;
    var instanceBuffer = new ArrayBuffer(opts.maxLength * STRIDE4);  
    const locationDesc = ["A_fromToPos", "A_fromToSize", "A_verts", "U_view", "U_colorA", "U_colorB", "U_blurCurveJoinLen", "U_jMinMaxArea"];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},  
		verts: {...glUtils.buffers.verts},
        instanceBuffer: {type: gl.ARRAY_BUFFER,  use: gl.DYNAMIC_DRAW, data: instanceBuffer},
        fromToPos: {size: 4, stride: STRIDE4, divisor: 1},
        fromToSize: {size: 2, offset: 4 * 4, stride: STRIDE4, divisor: 1},
    });
    const API = {
		compile() { 
			this.maxJoinSqr = (opts.joinMaxLength + opts.joinMaxWidth * 2) ** 2;
			if (gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},		
        init(gl_context, _view) {
            [gl, view] = [gl_context, _view];
            this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
            this.bufF32 = new Float32Array(instanceBuffer);
            this.blurCurveJoinLen = new Float32Array([opts.blur, opts.joinCurve, opts.joinMaxWidth, opts.joinMaxLength * 0.5]);
            this.jMinMaxArea = new Float32Array([opts.joinMinWidth, opts.joinMaxWidth, opts.joinMaxLength * opts.joinMinWidth * 0.5]);
            this.blur = opts.blur;
			this.curve = opts.joinCurve;
			this.minWidth = opts.joinMinWidth;
			this.width = opts.joinMaxWidth;
			this.joinLength = opts.joinMaxLength;
			this.lighten = opts.lighten;
        },
        add(join) {
            if (join.distSqr < this. maxJoinSqr && length < opts.maxLength) {
                var i = length++ * STRIDE;
                this.bufF32[i++] = join.pA.x;
                this.bufF32[i++] = join.pA.y;
                this.bufF32[i++] = join.pB.x;
                this.bufF32[i++] = join.pB.y;
                this.bufF32[i++] = join.pA.scaleR;
                this.bufF32[i++] = join.pB.scaleR;
                bufDirty = true;
            }
        },      
        set colorA_Int32(int32) { glUtils.colors.int32(opts.colorA, int32); colorDirty = true },
        set colorA_RGBA(rgba) { glUtils.colors.RGBA(opts.colorA, rgba); colorDirty = true },
        set colorB_Int32(int32) { glUtils.colors.int32(opts.colorB, int32); colorDirty = true },
        set colorB_RGBA(rgba) { glUtils.colors.RGBA(opts.colorB, rgba); colorDirty = true },
        soil() { bufDirty = viewDirty = colorDirty = view.soil() },
        wash() { bufDirty = viewDirty = colorDirty = false },
        get isDirty() { return bufDirty || viewDirty || colorDirty },
        clear() { length = 0 },
        draw(dirty) {
			const b = this.blurCurveJoinLen, j = this.jMinMaxArea;
			this.maxJoinSqr = (this.joinLength + this.width * 2) ** 2;
			b[0] = this.blur;
			b[1] = this.curve
			b[2] = this.width;
			b[3] = this.joinLength * 0.5;
			j[0] = this.minWidth
			j[1] = this.width;
			j[2] = this.minWidth * this.joinLength * 0.5;
			gl.uniform4fv(locations.blurCurveJoinLen, b);
			gl.uniform3fv(locations.jMinMaxArea, j);
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
				gl = locations = opts.colorA = opts.colorB = instanceBuffer = this.bufF32 = view = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}
    };
    return API;
};
