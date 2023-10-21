import {glUtils} from "../glUtils.jsm";

export {lineShader};

function lineShader(opts = {}) {
	Object.assign(opts, {
		maxLength: 256 * 256,
		...opts
	});
    const shaders = {
		vert: {		
			default() { return `#version 300 es
				in vec3 verts;
				in vec3 pA;  // from point
				in uint colorA; // from color
				in vec3 pB;  // to point
				in uint colorB; // to color
				
				uniform mat4 view; 
				out vec4 color;
				
				void main() {
					bool first = verts.x == 0.0;
					uint c = first ? colorA : colorB;
					if (!first && c == 0u && colorA == 0u) { // end of line segment
						color = vec4(0);
						gl_Position = view * vec4(pA, 1);
					} else {
						color = vec4(
							float(c & uint(255)) / 255.0, 
							float((c >> 8) & uint(255)) / 255.0, 
							float((c >> 16) & uint(255)) / 255.0, 
							float((c >> 24) & uint(255)) / 255.0
						);
						gl_Position = view * (first ? vec4(pA, 1) : vec4(pB, 1));				
					}
				}`;
			},
		},
		frag: {
			default() { return `#version 300 es
				precision mediump float;
				#define minAlpha 1.0 / 255.0
				out vec4 pixel;
				in vec4 color;
				void main() {
					if (color.a < minAlpha) { discard; }
					else { pixel = color; }
				}`;
			},		
		},
		locations: {
			default() { return ["A_verts","A_pA", "A_colorA", "A_pB", "A_colorB", "U_view"] },
		},
	};
	const src = {vert: null, frag: null};
    var gl, program, locations, buffers, dirty, method, locationDesc,  bufStore = [];
	const STRIDE = 3 + 1, STRIDE4 = STRIDE * 4;   // pos, col (col is int32 encoded color [RGBA8]
    const instanceBuffer = () => new ArrayBuffer(opts.maxLength * STRIDE4);
    const bufferDesc = () => {
		return {
			indices: { type: gl.ELEMENT_ARRAY_BUFFER, use: gl.STATIC_DRAW, dataType: gl.UNSIGNED_BYTE, data: new Uint8Array([0,1]) },
			verts: {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW, size: 3, data: new Float32Array([0,0,0,1,1,1])},			
			instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer()},
			pA: {size: 3, stride: STRIDE4, divisor: 1},
			colorA: {size: 1, offset: 3 * 4, dataType: gl.UNSIGNED_INT, stride: STRIDE4, divisor: 1},					
			pB: {size: 3, offset: 4 * 4, stride: STRIDE4, divisor: 1},
			colorB: {size: 1, offset: 7 * 4, dataType: gl.UNSIGNED_INT, stride: STRIDE4, divisor: 1},					
		};
	};

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
			buffers.instanceBuffer = buffers.instanceBuffer.glBuffer;		
        },
		endLine(buf = 0) {
			const bs = bufStore[buf];
            if(bs.length + 2 < opts.maxLength) {
                var i = bs.length * STRIDE;
				const bF = bs.dF32;
				const bI = bs.dI32;
				if (i > 0) {
					bF[i + 4] = bF[i + 0] = bF[i - 4];
					bF[i + 5] = bF[i + 1] = bF[i - 3];
					bF[i + 6] = bF[i + 2] = bF[i - 2];
					bI[i + 7] = bI[i + 3] = 0;
					bs.length += 2;
				}
			}
		},
        startLinePos(x,y,z, buf = 0) {
			const bs = bufStore[buf];
			var i = bs.length * STRIDE;
			const bF = bs.dF32;
			if (i > 0) {
				bF[i - 4] = x;
				bF[i - 3] = y;
				bF[i - 2] = z;
			}
		},
        startLine(p, buf = 0) {
			const bs = bufStore[buf];
			var i = bs.length * STRIDE;
			const bF = bs.dF32;
			if (i > 0) {
				if ( p === null) {
					bF[i - 4] = bF[i + 0];
					bF[i - 3] = bF[i + 1];
					bF[i - 2] = bF[i + 2];
				} else {
					bF[i - 4] = p.x;
					bF[i - 3] = p.y;
					bF[i - 2] = p.z;
				}
			}
		},
        addLine(p1, p2, c1, c2 = c1, buf = 0) {
			const bs = bufStore[buf];
            if(bs.length < opts.maxLength) {
                var i = bs.length * STRIDE;
				const bF = bs.dF32;
				const bI = bs.dI32;
				this.startLine(p1, buf);
                bF[i++] = p1.x;
                bF[i++] = p1.y;
                bF[i++] = p1.z;
                bI[i++] = c1;
                bF[i++] = p2.x;
                bF[i++] = p2.y;
                bF[i++] = p2.z;
                bI[i++] = c2;
				bs.length += 2;
				this.endLine(buf);
            }
        },  	
        addBoxMark(p, pD, c, buf = 0) {
			const bs = bufStore[buf];
            if(bs.length < opts.maxLength) {
                var i = bs.length * STRIDE;
				const bF = bs.dF32;
				const bI = bs.dI32;
				
                bF[i++] = p.x - pD.x - pD.y - pD.z;
                bF[i++] = p.y - pD.y - pD.z - pD.x;
                bF[i++] = p.z - pD.z - pD.x - pD.y;
				this.startLine(null, buf);
                bI[i++] = c;
                bF[i++] = p.x + pD.x - pD.y - pD.z;
                bF[i++] = p.y + pD.y - pD.z - pD.x;
                bF[i++] = p.z + pD.z - pD.x - pD.y;
                bI[i++] = c;
                bF[i++] = p.x + pD.x + pD.y - pD.z;
                bF[i++] = p.y + pD.y + pD.z - pD.x;
                bF[i++] = p.z + pD.z + pD.x - pD.y;
                bI[i++] = c;
                bF[i++] = p.x - pD.x + pD.y - pD.z;
                bF[i++] = p.y - pD.y + pD.z - pD.x;
                bF[i++] = p.z - pD.z + pD.x - pD.y;
                bI[i++] = c;
                bF[i++] = p.x - pD.x - pD.y - pD.z;
                bF[i++] = p.y - pD.y - pD.z - pD.x;
                bF[i++] = p.z - pD.z - pD.x - pD.y;
                bI[i++] = c;
                bF[i++] = p.x - pD.x - pD.y + pD.z;
                bF[i++] = p.y - pD.y - pD.z + pD.x;
                bF[i++] = p.z - pD.z - pD.x + pD.y;
                bI[i++] = c;
                bF[i++] = p.x + pD.x - pD.y + pD.z;
                bF[i++] = p.y + pD.y - pD.z + pD.x;
                bF[i++] = p.z + pD.z - pD.x + pD.y;
                bI[i++] = c;
                bF[i++] = p.x + pD.x + pD.y + pD.z;
                bF[i++] = p.y + pD.y + pD.z + pD.x;
                bF[i++] = p.z + pD.z + pD.x + pD.y;
                bI[i++] = c;
                bF[i++] = p.x - pD.x + pD.y + pD.z;
                bF[i++] = p.y - pD.y + pD.z + pD.x;
                bF[i++] = p.z - pD.z + pD.x + pD.y;
                bI[i++] = c;
                bF[i++] = p.x - pD.x - pD.y + pD.z;
                bF[i++] = p.y - pD.y - pD.z + pD.x;
                bF[i++] = p.z - pD.z - pD.x + pD.y;
                bI[i++] = c;

				bs.length += 10;
				this.endLine(buf);				
				i = bs.length * STRIDE;
                bF[i++] = p.x - pD.x + pD.y - pD.z;
                bF[i++] = p.y - pD.y + pD.z - pD.x;
                bF[i++] = p.z - pD.z + pD.x - pD.y;
				this.startLine(null, buf);
                bI[i++] = c;				
                bF[i++] = p.x - pD.x + pD.y + pD.z;
                bF[i++] = p.y - pD.y + pD.z + pD.x;
                bF[i++] = p.z - pD.z + pD.x + pD.y;
                bI[i++] = c;				

				bs.length += 2;
				this.endLine(buf);				
				i = bs.length * STRIDE;
                bF[i++] = p.x + pD.x + pD.y - pD.z;
                bF[i++] = p.y + pD.y + pD.z - pD.x;
                bF[i++] = p.z + pD.z + pD.x - pD.y;
				this.startLine(null, buf);
                bI[i++] = c;				
                bF[i++] = p.x + pD.x + pD.y + pD.z;
                bF[i++] = p.y + pD.y + pD.z + pD.x;
                bF[i++] = p.z + pD.z + pD.x + pD.y;
                bI[i++] = c;				
				
				bs.length += 2;
				this.endLine(buf);				
				i = bs.length * STRIDE;
                bF[i++] = p.x + pD.x - pD.y - pD.z;
                bF[i++] = p.y + pD.y - pD.z - pD.x;
                bF[i++] = p.z + pD.z - pD.x - pD.y;
				this.startLine(null, buf);
                bI[i++] = c;				
                bF[i++] = p.x + pD.x - pD.y + pD.z;
                bF[i++] = p.y + pD.y - pD.z + pD.x;
                bF[i++] = p.z + pD.z - pD.x + pD.y;
                bI[i++] = c;				

				bs.length += 2;
				this.endLine(buf);			
            }
        },  	
		addPlane(plane, c, grid = 10, buf = 0) {		
       		const bs = bufStore[buf];
            if(bs.length < opts.maxLength) {
				const [o, p1, p2] = plane.asArray();
                var i = bs.length * STRIDE;
				const bF = bs.dF32;
				const bI = bs.dI32;
				this.startLine(o, buf);
				
                bF[i++] = o.x;
                bF[i++] = o.y;
                bF[i++] = o.z;
                bI[i++] = c;
				
                bF[i++] = o.x + p1.x;
                bF[i++] = o.y + p1.y;
                bF[i++] = o.z + p1.z;
                bI[i++] = c;
				
                bF[i++] = o.x + p1.x + p2.x;
                bF[i++] = o.y + p1.y + p2.y;
                bF[i++] = o.z + p1.z + p2.z;
                bI[i++] = c;
				
                bF[i++] = o.x + p2.x;
                bF[i++] = o.y + p2.y;
                bF[i++] = o.z + p2.z;
                bI[i++] = c;

                bF[i++] = o.x;
                bF[i++] = o.y;
                bF[i++] = o.z;
                bI[i++] = c;

				
				bs.length += 5;
				this.endLine(buf);
				if (grid) {
					var j = 1;
					const o1 = o.clone();
					const o2 = o.clone().add(p1);
					const o3 = o.clone();
					const o4 = o.clone().add(p2);
					const sp1 = p1.scale(1 / grid, o.clone())
					const sp2 = p2.scale(1 / grid, o.clone())
					while(j < grid) {
						this.addLine(o1.add(sp2), o2.add(sp2), c);
						this.addLine(o3.add(sp1), o4.add(sp1), c, c);
						j ++;
					}
				}
            }
        },  
        addMeshFaces(mesh, faces, color, buf = 0) {
			const bs = bufStore[buf];
            if(bs.length < opts.maxLength) {
                var i = bs.length * STRIDE;
				const bF = bs.dF32;
				const bI = bs.dI32;
				var j = 0;
				while (j < faces.length) {
					let idx1 = faces[j++] * 3;
					this.startLinePos(mesh.verts[idx1], mesh.verts[idx1 + 1], mesh.verts[idx1 + 2], buf);
					bF[i++] = mesh.verts[idx1];
					bF[i++] = mesh.verts[idx1 + 1];
					bF[i++] = mesh.verts[idx1 + 2];
					bI[i++] = color;
					let idx = faces[j++] * 3;
					bF[i++] = mesh.verts[idx];
					bF[i++] = mesh.verts[idx + 1];
					bF[i++] = mesh.verts[idx + 2];
					bI[i++] = color;
					idx = faces[j++] * 3;
					bF[i++] = mesh.verts[idx];
					bF[i++] = mesh.verts[idx + 1];
					bF[i++] = mesh.verts[idx + 2];
					bI[i++] = color;
					
					bF[i++] = mesh.verts[idx1];
					bF[i++] = mesh.verts[idx1 + 1];
					bF[i++] = mesh.verts[idx1 + 2];
					bI[i++] = color;
					bs.length += 4;
					this.endLine(buf);
					i = bs.length * STRIDE;
				}
            }
        },  	
        addPath(path3D, close, color, buf = 0) {
			const bs = bufStore[buf];
            if(bs.length < opts.maxLength) {
                var i = bs.length * STRIDE;
				const bF = bs.dF32;
				const bI = bs.dI32;
				const p = path3D[0];
				this.startLine(p, buf);
				for (const p of path3D) {
					bF[i++] = p.x;
					bF[i++] = p.y;
					bF[i++] = p.z;
					bI[i++] = color;
				}
				if (close) {
					bF[i++] = p.x;
					bF[i++] = p.y;
					bF[i++] = p.z;
					bI[i++] = color;
					bs.length += path3D.length + 1;
				} else {
					bs.length += path3D.length;
				}
				this.endLine(buf);
            }
        },  	
		getBuffer(buf = 0) { return bufStore[buf] },
		lockBuffer(buf = 0) { 
			const bs = bufStore[buf];
			if (bs) { 
				bs.length > 0  && this.endLine(buf);
				bs.lockStart = Math.max(0, bs.length - 2);
				bs.lockPending = true;
			}
		},
		clear(buf = 0, unlock) { 
		    const bs = bufStore[buf];
			if (!bs) { 
				const data = new ArrayBuffer(opts.maxLength * STRIDE4);
				bufStore[buf] =  { 
					length: 0, 
					lockStart: 0,
					lockPending: false,
					dF32: new Float32Array(data),
					dI32: new Uint32Array(data),
				};
			} else if(unlock) { bs.lockStart = bs.length = 0 }
			else { bs.length = bs.lockStart + (bs.lockStart > 0 ? 2 : 0) }
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
        draw(buf = 0) {			
			const b = bufStore[buf];
			if (b) {
				gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer);
				const start = b.lockPending ? 0 : b.lockStart * STRIDE;
				gl.bufferSubData(gl.ARRAY_BUFFER, start * 4, b.dF32.subarray(start, b.length * STRIDE));
				gl.drawElementsInstanced(gl.LINES,  2, gl.UNSIGNED_BYTE, 0, b.length - 1);   
				b.lockPending = false;
			}
        },      
        use(view) { 
            if (gl) {
                gl.enable(gl.DEPTH_TEST);
				gl.enable(gl.BLEND);
				gl.disable(gl.CULL_FACE);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);			
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
				gl.uniformMatrix4fv(locations.view, false, view.viewMatrix);
                return true;
            }
        },
		close() {
			if (gl) {
				glUtils.delete({program, buffers});
				bufStore.length = 0;			
				gl = locations  = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}
    };
	API.method = "default";
    return API;
};


