import {glUtils} from "../glUtils.js";
export {geom3DShader, geom3DInstShader};

function MeshBuffer() {
	var gl;
	const fields = [];
	const geom = {};
	const meshes = {
		indices: [],
		get geom() { return geom },
		set context(context) { gl = context },
		close() {
			meshes.indices = undefined;
			for(const f of fields) { meshes[f.name] = undefined }
			fields.length = 0;
			gl = undefined;
		},			
		add(name, mesh) {
			
			const firstInd = meshes.indices.length;
			var idx = 0;//, idx2 = 0;
			for(const f of mesh.fields) {
				f.idx = 0;
				!meshes[f.name] && (fields.push(f), meshes[f.name] = []);
			}
			const start = meshes.verts.length / 3;
			while (idx < mesh.verts.length) {
				for(const f of mesh.fields) {
					let i = f.size;
					while(i--) { meshes[f.name].push(mesh[f.name][f.idx++]) }
				}
				idx += 3;
			}
			idx = 0;
			while (idx < mesh.indices.length) {
				meshes.indices.push(start + mesh.indices[idx++], start + mesh.indices[idx++], start + mesh.indices[idx++]);
			}
			geom[name] = {
				firstInd,
				offset: firstInd,
				length: mesh.indices.length,
			};
			
		},
		buffers: { // this shader must have webGL2 context befor accessing buffers
			indexType: null,
			get indices() {
				var dataType, data, indSize;
				if (meshes.indices.length < 256) {
					data = new Uint8Array(meshes.indices)
					dataType = gl.UNSIGNED_BYTE;
					indSize = 1;
				} else if (meshes.indices.length < (2 ** 16) - 1) {
					data = new Uint16Array(meshes.indices)
					dataType = gl.UNSIGNED_SHORT;
					indSize = 2;
				} else {
					data = new Uint32Array(meshes.indices)
					dataType = gl.UNSIGNED_INT;
					indSize = 4;

				}
				for(const g of Object.values(geom)) { g.offset = g.firstInd * indSize }
				meshes.buffers.indexType = dataType;
				return {type: gl.ELEMENT_ARRAY_BUFFER, use: gl.STATIC_DRAW, dataType, data};
			},
			get fields() {
				const bufs = [];
				for(const f of fields) {
					const data = new Float32Array(meshes[f.name]);
					bufs[f.name] = {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW, size: f.size, data};
				}
				return bufs;
			},
		}
		
	}
	return meshes;
}



function geom3DShader(opts = {}) {
	Object.assign(opts, {
			color: [1,1,1,1], 
			alphaCut: 0.1,
			...opts
		}
	);
    const shaders = {
		vert: {		
			default() { return `#version 300 es
				precision highp float;
				in vec3 verts;
				in vec3 normals;
				uniform mat4 view;
				uniform mat4 local;
				out vec3 norm;
				out vec3 vert; 
				void main() {
					vec4 v = local * vec4(verts, 1);
					norm = normalize(mat3(
						local[0][0], local[0][1], local[0][2],
						local[1][0], local[1][1], local[1][2],
						local[2][0], local[2][1], local[2][2]) * 
						normals);						
					vert = v.xyz;
					gl_Position = view *  v;
				}`;
			},
			textured() { return `#version 300 es
				precision highp float;
				in vec3 verts;
				in vec3 normals;
				in vec2 maps;
				uniform mat4 view;
				uniform mat4 local;
				out vec3 norm;
				out vec3 vert; 
				centroid out vec2 map;
				void main() {
					vec4 v = local * vec4(verts, 1);
					norm = normalize(mat3(
						local[0][0], local[0][1], local[0][2],
						local[1][0], local[1][1], local[1][2],
						local[2][0], local[2][1], local[2][2]) * 
						normals);						
					vert = v.xyz;
					map = maps;
					gl_Position = view *  v;
				}`;
			},
			texturedTile() { return `#version 300 es
				precision highp float;
				#define texWidth ##TEX_WIDTH##u
				#define texHeight ##TEX_HEIGHT##u
				#define tileWidth ##TILE_WIDTH##u
				#define tileHeight ##TILE_HEIGHT##u
				#define tileCols ##TILE_COLS##u
				#define tileRows ##TILE_ROWS##u

				in vec3 verts;
				in vec3 normals;
				in vec3 maps; //uv and z is tile idx
				uniform mat4 view;
				uniform mat4 local;
				out vec3 norm;
				out vec3 vert; 
				centroid out vec4 map;
				void main() {
					vec4 v = local * vec4(verts, 1);
					norm = normalize(mat3(
						local[0][0], local[0][1], local[0][2],
						local[1][0], local[1][1], local[1][2],
						local[2][0], local[2][1], local[2][2]) * 
						normals);						
					vert = v.xyz;
					uint idx = uint(maps.z);
					map = vec4(maps.xy, vec2(idx % tileCols * tileWidth, (idx / tileCols) * tileHeight) / vec2(texWidth, texHeight)) ;
					gl_Position = view *  v;
				}`;
			},			
			texturedNormMask() { return `#version 300 es
				precision highp float;
				in vec3 verts;
				in vec3 normals;
				in vec2 maps;
				uniform mat4 view;
				uniform mat4 local;
				out vec3 norm;
				out vec3 normX;
				out vec3 normY;
				out vec3 vert; 
				centroid out vec2 map;
				void main() {
					vec4 v = local * vec4(verts, 1);
					mat3 locRot = mat3(local[0][0], local[0][1], local[0][2], local[1][0], local[1][1], local[1][2], local[2][0], local[2][1], local[2][2]);
					vec3 nX = cross(normals, vec3(0,1,0));
					vec3 nY = cross(normals, nX);
					norm = normalize(locRot *  normals);						
					normX = normalize(locRot *  nX);
					normY = normalize(locRot *  nY);
					vert = v.xyz;
					map = maps;
					gl_Position = view *  v;
				}`;
			},			
			unlight() { return `#version 300 es
				precision highp float;
				in vec3 verts;
				in vec3 normals;
				uniform mat4 view;
				uniform mat4 local;
				void main() {
					gl_Position = view * local * verts;
				}`;
			},
		},
		frag: {
			default() { return `#version 300 es
				precision highp float;
				#define lightCount ${opts.lights.count}
				in vec3 norm;
				in vec3 vert;
				uniform vec3 eye;
				uniform vec3 color;
				uniform vec2 specular; // power and intensity
				uniform vec3 ambient;
				uniform vec3 lights[lightCount];  // pos
				uniform vec3 lightCols[lightCount]; // r,g,b
				out vec4 pixel;
				void main() {
					vec3 toEye = normalize(eye - vert);
					vec3 lightSum = ambient;
					vec3 spec = vec3(0);
					for(int i = 0; i < lightCount; i ++) {
						vec3 lightCol = lightCols[i];
						vec3 toLight = normalize(vert - lights[i]);
						lightSum += lightCol * max(dot(toLight, norm), 0.0);
						if (specular.y > 0.0) {
							spec += lightCol * pow(max(dot(reflect(toLight, norm), toEye), 0.0), specular.x) * specular.y;
						}
					}
					pixel = vec4(color * lightSum + spec, 1.0);
				}`;
			},			
			textured() { return `#version 300 es
				precision highp float;
				#define lightCount ${opts.lights.count}
				#define alphaCut ${opts.alphaCut.toFixed(3)}
				in vec3 norm;
				in vec3 vert;
				centroid in vec2 map;
				uniform sampler2D colorTex;
				uniform vec3 eye;
				uniform vec3 color;
				uniform vec2 specular; // power and intensity
				uniform vec3 ambient;
				uniform vec3 lights[lightCount];  // pos
				uniform vec3 lightCols[lightCount]; // r,g,b
				out vec4 pixel;
				void main() {
					vec4 pCol = texture(colorTex, map);
					if (pCol.a <= alphaCut) {
						discard;
					} else {
						vec3 toEye = normalize(eye - vert);
						vec3 lightSum = ambient;
						vec3 spec = vec3(0);
						for(int i = 0; i < lightCount; i ++) {
							vec3 lightCol = lightCols[i];
							vec3 toLight = normalize(vert - lights[i]);
							lightSum += lightCol * max(dot(toLight, norm), 0.0);
							if (specular.y > 0.0) {
								spec += lightCol * pow(max(dot(reflect(toLight, norm), toEye), 0.0), specular.x) * specular.y;
							}
						}
						pixel = vec4(pCol.rgb * color * lightSum + spec, pCol.a);
					}
				}`;
			},			
			texturedTile() { return `#version 300 es
				precision highp float;
				precision highp int;
				#define lightCount ${opts.lights.count}
				#define alphaCut ${opts.alphaCut.toFixed(3)}		
				#define hPixel ##HALF_PIXEL_SIZE##
				#define tile ##TILE_UNIT_SIZE##
				in vec3 norm;
				in vec3 vert;
				centroid in vec4 map;
				uniform sampler2D colorTex;
				uniform vec3 eye;
				uniform vec3 color;
				uniform vec2 specular; // power and intensity
				uniform vec3 ambient;
				uniform vec3 lights[lightCount];  // pos
				uniform vec3 lightCols[lightCount]; // r,g,b
				out vec4 pixel;
				void main() {
					
					// Custom link to provide following two variables
					// vec2 hPixel = vec2(0.5 / float(tileSize.z * tileSize.x), 0.5 / float(tileSize.w * tileSize.y));
					// vec2 tile = vec2(1.0 / float(tileSize.z), 1.0 / float(tileSize.w));
					
					vec2 m = clamp(mod(map.xy, tile), hPixel, tile - hPixel) + map.zw;
					vec4 pCol = texture(colorTex, m);
					if (pCol.a <= alphaCut) {
						discard;
					} else {
						vec3 lightSum = ambient;
						vec3 spec = vec3(0);
						vec3 toEye = normalize(eye - vert);
						for(int i = 0; i < lightCount; i ++) {
							vec3 lightCol = lightCols[i];
							vec3 toLight = normalize(vert - lights[i]);
							lightSum += lightCol * max(dot(toLight, norm), 0.0);
							if (specular.y > 0.0) {
								spec += lightCol * pow(max(dot(reflect(toLight, norm), toEye), 0.0), specular.x) * specular.y;
							}
						}
						pixel = vec4(pCol.rgb * color * lightSum + spec, pCol.a);
					}
				}`;
			},				
			texturedNormMask() { return `#version 300 es
				precision highp float;
				#define lightCount ${opts.lights.count}
				#define alphaCut ${opts.alphaCut.toFixed(3)}						
				in vec3 norm;
				in vec3 normX;
				in vec3 normY;
				in vec3 vert;
				centroid in vec2 map;
				uniform sampler2D colorTex;
				uniform sampler2D normalTex;
				uniform sampler2D maskTex;
				uniform vec3 eye;
				uniform vec3 color;
				uniform vec2 specular; // power and intensity
				uniform vec3 ambient;
				uniform vec3 lights[lightCount];  // pos
				uniform vec3 lightCols[lightCount]; // r,g,b
				out vec4 pixel;
				void main() {
					vec4 pCol = texture(colorTex, map);
					if (pCol.a <= alphaCut) {
						discard;
					} else {
						if (texture(maskTex, map).a < 0.2) {
							vec3 toEye = normalize(eye - vert);
							vec3 nt = normalize(texture(normalTex, map).xyz - 0.5);
							vec3 n = normalize(norm * nt.b + normX * nt.r + normY * nt.g);
							vec3 lightSum = ambient;
							vec3 spec = vec3(0);
							for(int i = 0; i < lightCount; i ++) {
								vec3 lightCol = lightCols[i];
								vec3 toLight = normalize(vert - lights[i]);
								lightSum += lightCol * max(dot(toLight, n), 0.0);
								if (specular.y > 0.0) {
									spec += lightCol * pow(max(dot(reflect(toLight, n), toEye), 0.0), specular.x) * specular.y;
								}
							}
							pixel = vec4(pCol.rgb * color * lightSum + spec, pCol.a);
						} else {
							pixel = pCol;
						}
					}
					
				}`;
			},				
			unlight() { return `#version 300 es
				precision highp float;
				uniform vec4 color;
				out vec4 pixel;
				void main() {
					pixel = vec4(color.rgb, 1.0);
				}`;
			},			
		},
		locations: {
			default() { return ["A_verts", "A_normals", "U_view", "U_local", "U_eye", "U_color", "U_specular", "U_lights", "U_lightCols", "U_ambient"] },
			textured() { return ["A_verts", "A_normals", "A_maps", "T_colorTex", "U_view", "U_local", "U_eye", "U_color", "U_specular", "U_lights", "U_lightCols", "U_ambient"] },
			texturedTile() { return ["A_verts", "A_normals", "A_maps", "T_colorTex", "U_view", "U_local", "U_eye", "U_color", "U_specular", "U_lights", "U_lightCols", "U_ambient"] },
			texturedNormMask() { return ["A_verts", "A_normals", "A_maps", "T_colorTex", "T_normalTex", "T_maskTex", "U_view", "U_local", "U_eye", "U_color", "U_specular", "U_lights", "U_lightCols", "U_ambient"] },
			unlight() { return ["A_verts", "A_normals", "U_view", "U_local", "U_eye", "U_color", "U_specular"] },
		},
		draw: {
			default() {},
			textured(g, desc) {
				if(desc.textures && samplers.length) {
					for (const s of samplers) { desc.textures[s.name] && desc.textures[s.name].bind(s.binding) }
				}
			},				
			texturedTile(g, desc) {
				if(desc.textures && samplers.length) {
					for (const s of samplers) { desc.textures[s.name] && desc.textures[s.name].bind(s.binding) }
				}		
			},
			texturedNormMask(g, desc) {
				if(desc.textures && samplers.length) {
					for (const s of samplers) { desc.textures[s.name] && desc.textures[s.name].bind(s.binding) }
				}				
			},
		}
			
	};
	const src = {vert: null, frag: null}, meshes = MeshBuffer(), geom = meshes.geom;
    var gl, program, locations, buffers, dirty, method, locationDesc, samplers = [];
    const bufferDesc = () => ({indices: meshes.buffers.indices, ...meshes.buffers.fields});
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
			meshes.context = gl;
            this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
			for(const key of Object.keys(buffers)) { key !== "vertexBuffer" && (buffers[key] = undefined) }
			meshes.close();
			var i = 0;
			for(const locName of Object.keys(locations)) {
				if(locations[locName] && locations[locName].isSampler) {
					gl.uniform1i(locations[locName].loc, i)
					samplers.push({name: locName, binding: i++});
					delete locations[locName];
				}
			}
						
        },
		link(including) {
			for (const inc of Object.keys(including)) {
				const reg = new RegExp("##" + inc + "##","g");
				src.vert = src.vert.replace(reg, including[inc]);
				src.frag = src.frag.replace(reg, including[inc]);
			}			
		},
		get methods() { return ["default", "textured", "texturedNormMask", "unlight"] },
		get method() { return method },
		set method(name) {
			if(name != method) {
				locationDesc = shaders.locations[name] ? shaders.locations[name]() : locationDesc;
				src.vert = shaders.vert[name] ? shaders.vert[name]() : src.vert;
				src.frag = shaders.frag[name] ? shaders.frag[name]() : src.frag;
				(opts.include && opts.include[name]) && this.link(opts.include[name]);
				this.drawExtra = shaders.draw[name] ? shaders.draw[name].bind(this) : shaders.draw.default.bind(this);
				method = name;
				gl && API.init();
			}
		},
		addGeom(name, mesh) { !geom[name] && meshes.add(name, mesh) },
		set lights(lights) { opts.lights = lights },
        draw(geomName, desc) {			
			const g = geom[geomName];
			if (g) {
				this.drawExtra(g, desc);
				gl.uniformMatrix4fv(locations.local, false, desc.matrix.m);
				gl.uniform3fv(locations.color, desc.color);
				gl.uniform2fv(locations.specular, desc.specular);
				desc.cullBackface ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
				gl.drawElements(gl.TRIANGLES, g.length, meshes.buffers.indexType, g.offset);				
			}
        },      
        use(view) { 
            if (gl) {
                gl.enable(gl.DEPTH_TEST);
				gl.enable(gl.BLEND);
				gl.enable(gl.CULL_FACE);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				gl.cullFace(gl.BACK);
				gl.frontFace(gl.CW); 				
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
				gl.uniformMatrix4fv(locations.view, false, view.viewMatrix);
				gl.uniform3fv(locations.eye, view.camera.eye);
				if (locations.lights  && opts.lights.dirty) {
					gl.uniform3fv(locations.lights, opts.lights.pos, 0, opts.lights.pos.length);
					gl.uniform3fv(locations.lightCols, opts.lights.colors, 0, opts.lights.colors.length);				
					gl.uniform3fv(locations.ambient, opts.lights.ambient);				
				}
                return true;
            }
        },
		close() {  // todo  finish cleanup
			if (gl) {
				glUtils.delete({program, buffers});
				gl = locations  = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}
    };
	API.method = "default";
    return API;
};


function geom3DInstShader(opts = {}) {
	Object.assign(opts, {
		maxLength: 256 * 256,
		alphaCut: 0.1,		
		...opts
	});
    const shaders = {
		vert: {		
			default() { return `#version 300 es
				precision highp float;
				in vec3 verts;
				in vec3 normals;
				in vec3 dir;  // x = yaw ,y = pitch ,z  scale
				in vec3 pos; 
				in vec3 color;  
				uniform mat4 view;
				out vec3 norm;
				out vec3 vert; 
				out vec3 col;
				void main() {
					col = color;
					float yx = cos(dir.x);
					float yz = sin(dir.x);
					float px = cos(dir.y);
					vec4 xA = vec4(yx * px, sin(dir.y), yz * px, 0);
					vec4 zA = vec4(-yz, 0, yx, 0);
					vec4 yA = vec4(-xA.y * yx, (xA.z * yz + xA.x * yx), -xA.y * yz, 0);
				    norm = normalize(mat3(xA.xyz, yA.xyz, zA.xyz) * normals);
					vec4 v = mat4(xA * dir.z, yA * dir.z, zA * dir.z, vec4(pos, 1)) * vec4(verts, 1);
					vert = v.xyz;
					gl_Position = view *  v;
				}`;
			},
			textured() { return `#version 300 es
				precision highp float;
				in vec3 verts;
				in vec3 normals;
				in vec2 maps
				in vec3 dir;  // x = yaw ,y = pitch ,z  scale
				in vec3 pos; 
				in vec3 color;  
				uniform mat4 view;
				out vec3 norm;
				out vec3 vert; 
				out vec3 col;
				out vec2 map;
				void main() {
					col = color;
					float yx = cos(dir.x);
					float yz = sin(dir.x);
					float px = cos(dir.y);
					vec4 xA = vec4(yx * px, sin(dir.y), yz * px, 0);
					vec4 zA = vec4(-yz, 0, yx, 0);
					vec4 yA = vec4(-xA.y * yx, (xA.z * yz + xA.x * yx), -xA.y * yz, 0);
				    norm = normalize(mat3(xA.xyz, yA.xyz, zA.xyz) * normals);
					vec4 v = mat4(xA * dir.z, yA * dir.z, zA * dir.z, vec4(pos, 1)) * vec4(verts, 1);
					vert = v.xyz;
					map = maps;
					gl_Position = view *  v;
				}`;
			},			
		},
		frag: {
			default() { return `#version 300 es
				precision highp float;
				#define lightCount ${opts.lights.count}
				in vec3 norm;
				in vec3 vert;
				in vec3 col;
				uniform vec3 eye;
				uniform vec2 specular; // power and intensity
				uniform vec3 ambient;
				uniform vec3 lights[lightCount];  // pos
				uniform vec3 lightCols[lightCount]; // r,g,b
				out vec4 pixel;
				void main() {
					vec3 toEye = normalize(eye - vert);
					vec3 lightSum = ambient;
					vec3 spec = vec3(0);
					for(int i = 0; i < lightCount; i ++) {
						vec3 lightCol = lightCols[i];
						vec3 toLight = normalize(vert - lights[i]);
						lightSum += lightCol * max(dot(toLight, norm), 0.0);
						if (specular.y > 0.0) {
							spec += lightCol * pow(max(dot(reflect(toLight, norm), toEye), 0.0), specular.x) * specular.y;
						}
					}
					pixel = vec4(col * lightSum + spec, 1.0);
				}`;
			},
			textured() { return `#version 300 es
				precision highp float;
				#define lightCount ${opts.lights.count}
				#define alphaCut ${opts.alphaCut.toFixed(3)}	
				in vec3 norm;
				in vec3 vert;
				in vec2 map;
				uniform sampler2D colorTex;
				uniform vec3 eye;
				uniform vec3 color;
				uniform vec2 specular; // power and intensity
				uniform vec3 ambient;
				uniform vec3 lights[lightCount];  // pos
				uniform vec3 lightCols[lightCount]; // r,g,b
				out vec4 pixel;
				void main() {
					vec4 pCol = texture(colorTex, map);
					if (pCol.a <= alphaCut) {
						discard;
					} else {					
						vec3 toEye = normalize(eye - vert);
						vec3 lightSum = ambient;
						vec3 spec = vec3(0);
						for(int i = 0; i < lightCount; i ++) {
							vec3 lightCol = lightCols[i];
							vec3 toLight = normalize(vert - lights[i]);
							lightSum += lightCol * max(dot(toLight, norm), 0.0);
							if (specular.y > 0.0) {
								spec += lightCol * pow(max(dot(reflect(toLight, norm), toEye), 0.0), specular.x) * specular.y;
							}
						}
						pixel = vec4(pCol.rgb * color * lightSum + spec, pCol.a);
					}
				}`;
			},				
		},
		locations: {
			default() { return ["A_verts","A_normals", "A_dir", "A_pos", "A_color", "U_view", "U_eye", "U_specular", "U_lights", "U_lightCols", "U_ambient"] },
			textured() { return ["A_verts", "A_normals", "A_maps", "A_dir", "A_pos", "A_color", "T_colorTex", "U_view", "U_local", "U_eye", "U_color", "U_specular", "U_lights", "U_lightCols", "U_ambient"] },
		},
		draw: {
			default(){},
			textured(g, desc) {
				if(desc.textures && samplers.length) {
					for (const s of samplers) { desc.textures[s.name] && desc.textures[s.name].bind(s.binding) }
				}
			},
		}
			
	};
	const src = {vert: null, frag: null}, meshes = MeshBuffer(), geom = meshes.geom;
    var gl, program, locations, buffers, dirty, method, locationDesc, length = 0, bufStore = [], samplers = [];
	const STRIDE = 3 + 3 + 3, STRIDE4 = STRIDE * 4;   // dir, pos, col
    const instanceBuffer = () => new ArrayBuffer(opts.maxLength * STRIDE4);
    const bufferDesc = () => {
		const desc = {
			indices: meshes.buffers.indices,
			...meshes.buffers.fields,
			instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer()},
			dir: {size: 3, stride: STRIDE4, divisor: 1},
			pos: {size: 3, offset: 3 * 4, stride: STRIDE4, divisor: 1},			
			color: {size: 3, offset: 6 * 4, stride: STRIDE4, divisor: 1},	
		};
		return desc;		
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
			meshes.context = gl;
            this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
			for(const key of Object.keys(buffers)) { (key !== "vertexBuffer" && key !== "instanceBuffer") && (buffers[key] = undefined) }
			buffers.instanceBuffer = buffers.instanceBuffer.glBuffer;	
			meshes.close();
			var i = 0;
			for(const locName of Object.keys(locations)) {
				if(locations[locName].isSampler) {
					gl.uniform1i(locations[locName].loc, i)
					samplers.push({name: locName, binding: i++});
					delete locations[locName];
				}
			}			
        },
        add(dir, pos, color, buf = 0) {
			const bs = bufStore[buf];
            if(bs.length < opts.maxLength) {
                var i = bs.length++ * STRIDE;
				const b = bs.data;
                b[i++] = dir.x;
                b[i++] = dir.y;
                b[i++] = dir.z;
                b[i++] = pos.x;
                b[i++] = pos.y;
                b[i++] = pos.z;
				if (color) {
					b[i++] = color[0];
					b[i++] = color[1];
					b[i++] = color[2];
				}
            }
        },  	
		clear(buf = 0) { 
			if (!bufStore[buf]) { bufStore[buf] = { length: 0, data: new Float32Array(new ArrayBuffer(opts.maxLength * STRIDE4)) } }
			else { bufStore[buf].length = 0 }
		},
		bufferCopy(buf = 0) {
			const bs = bufStore[buf];
			if (bs) { return { length: bs.length, data: new Float32Array(bs.data.subarray(0, bs.length * STRIDE)) } }
		},
		get methods() { return ["default", "textured"] },
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
		addGeom(name, mesh) { !geom[name] && meshes.add(name, mesh) },
		set lights(lights) { opts.lights = lights },
        draw(geomName, buf, desc) {			
			const g = geom[geomName];
			if (g) {
				const b = desc.buffer ? desc.buffer : bufStore[buf];
				if (b) {
					desc.cullBackface ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
					this.drawExtra(g, desc);
					gl.uniform2fv(locations.specular, desc.specular);
					gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.instanceBuffer);
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.data.subarray(0, b.length * STRIDE));
					gl.drawElementsInstanced(gl.TRIANGLES,  g.length, meshes.buffers.indexType, g.offset, b.length);   
				}
			}
        },      
        use(view) { 
            if (gl) {
                gl.enable(gl.DEPTH_TEST);
				gl.enable(gl.BLEND);
				gl.enable(gl.CULL_FACE);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				gl.cullFace(gl.BACK);
				gl.frontFace(gl.CW); 				
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
				gl.uniformMatrix4fv(locations.view, false, view.viewMatrix);
				gl.uniform3fv(locations.eye, view.camera.eye);
				if (locations.lights && opts.lights.dirty) {
					gl.uniform3fv(locations.lights, opts.lights.pos, 0, opts.lights.pos.length);
					gl.uniform3fv(locations.lightCols, opts.lights.colors, 0, opts.lights.colors.length);				
					gl.uniform3fv(locations.ambient, opts.lights.ambient);				
				}
                return true;
            }
        },
		close() { // todo finish cleanup
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
