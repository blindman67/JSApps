import {} from "../code/MathExtensions.jsm";
import {glUtils} from "../code/glUtils.jsm";

function pointShader(options = {}){
	options = {
		pointType: "clouds", // types round, diamond, star 
		cloudLightModel: "threeTone", // none, twoTone, scatter
		useSimpleCloudLight: false,
		useColor: true,
		useDepth: false,  // sets z buffer
		near: 0.0,  // near plane  (keep near far 0 <= z <= 1)
		far: 1.0,   // far plane 
		distanceColor: false,
		fixColor: null, // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		colorNear: null,    // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		colorFar: null,		
		distanceFade: false,
		customDistanceFade: false, // overrides distanceFade when true
		distanceFadeNear: 1, // needs  customDistanceFade = true && useDepth = true
		distanceFadeFar: 0, // needs  customDistanceFade = true && useDepth = true
		customDistanceScale: false,
		distanceScaleNear : 1,  // needs  customDistanceScale = true && useDepth = true
		distanceScaleFar : 2,   // needs  customDistanceScale = true && useDepth = true
		alphaCut: 1.5,  // range 0 - 255
		batchSize: 1024 * 8,
		falloff: 0,     // < 0 ease to alpha 1 , > 0 ease from alpha 0
		...options,
	}
	options.useClouds = options.pointType === "clouds";
    options.threeTone = options.useClouds && options.cloudLightModel === "threeTone";
	options.twoTone = options.useClouds && options.cloudLightModel === "twoTone";
	options.scatter = options.useClouds && options.cloudLightModel === "scatter";
	const useSettings = options.scatter;	
	if(options.distanceFade && options.useColor === false) {
		console.error("Star shader error. Distance fade requiers useColor === true");
		return;
	}
	if(options.distanceColor && (options.colorNear === null || options.colorFar === null)) {
		console.error("Star shader error. Distance color requiers colorFar and colorNear to be set to {r,g,b,a}");
		return;
	}
	if(options.fixColor !== null && options.useClouds) {
		console.warn("Clouds incompatible with options.fixColor. Colour ignored.");
		options.fixColor = null;
	}	
	function createShaders() {
		const alphaCut = (options.alphaCut / 255).toFixed(3);
		var fColorRGB = options.fixColor !== null ? `${glUtils.float(options.fixColor.r / 255)}, ${glUtils.float(options.fixColor.g / 255)}, ${glUtils.float(options.fixColor.b / 255)}`:"";
		var fColor = options.fixColor !== null ? `vec4(${fColorRGB}, dist * ${glUtils.float(options.fixColor.a / 255)})`: "";
		var fragmentColor = options.fixColor === null ? 
			`${options.useColor ? "pixelCol = col * dist" : "pixelCol = vec4(1.0)"};` :
			`pixelCol = ${fColor} ${options.useColor ? "* col" : ""};`
				
		var mixColors = options.distanceColor ? 
			`mix(vec4(${glUtils.float(options.colorNear.r/255)}, ${glUtils.float(options.colorNear.g/255)}, ${glUtils.float(options.colorNear.b/255)}, ${glUtils.float(options.colorNear.a/255)}),
				vec4(${glUtils.float(options.colorFar.r/255)}, ${glUtils.float(options.colorFar.g/255)}, ${glUtils.float(options.colorFar.b/255)}, ${glUtils.float(options.colorFar.a/255)}), dist)` : ""; 

		var pointType = options.pointType === "round" ?  "float dist = length(spr);" : 
				options.pointType === "diamond" ?  "float dist = abs(spr.x) + abs(spr.y);" :
				"\t\tfloat dist = abs(spr.x) + abs(spr.y);";
				
		var falloffVal = (options.falloff < 0 ?  (1 / ((-options.falloff) ** 2 + 1)).toFixed(5) : (options.falloff ** 2 + 1).toFixed(5));				
		var pointType2Pix = "if (dist <= 1.0) {\n" +( options.falloff !== 0 ? 
				"        dist = pow(1.0 - dist," +  falloffVal +");\n" :
				"        dist = 1.0 - dist;\n" );
		var vertex = 
		`#version 300 es
		#NAME;
		//#SHOW_IN_CONSOLE;
		in vec2 verts;
		in vec2 pos;
		in float zIdx;
		${options.useClouds ? "in vec2 scale;" : "in float scale;" }
		${options.useColor ? "in vec4 color;" : ""}
		${options.useClouds ? "uniform mat2 cloudRot;" : ""}
		uniform mat2 view;
		uniform vec4 originSize;
		out vec2 spr;
		${options.useClouds ? "flat out float size;" : "" }
		${options.threeTone || options.twoTone ? "flat out float z;" : "" }
		${options.useColor ? "flat out vec4 col;" : ""}
		void main() {	
			${options.useClouds ? "spr = cloudRot * verts;": "spr = verts;"}
			${options.useClouds ? "size = scale.x;" : ""}
			${options.threeTone || options.twoTone ? "z = zIdx;" : ""}
			${options.customDistanceScale || options.customDistanceFade || options.distanceColor ? 
				`float dist = (zIdx - ${glUtils.float(options.near)}) * ${glUtils.float(1 / (options.far-options.near))};` : ""}
			${options.useColor ? 
				"if(color.a == 0.0) { gl_Position = vec4(0); return; }\n\t\tcol = color.rgba" + 
				(options.distanceColor ? " * " + mixColors : "") + ";" : ""
			}
			float z = 1.0 - zIdx;
			${options.customDistanceFade ? 
				"col.a *= mix(" + glUtils.float(options.distanceFadeNear) + ", " + glUtils.float(options.distanceFadeFar) + ", dist);" : 
				(options.distanceFade ? "col.a *= z;" : "")
			}
			${options.useClouds ?
				`vec2 loc = view * (verts * scale.x * ${options.customDistanceScale  ? 
						"mix(" + glUtils.float(options.distanceScaleNear) + ", " + glUtils.float(options.distanceScaleFar) + ", dist)" : 
						"z"} + mod((pos - originSize.xy) * z, originSize.zw + scale.y * 2.0) - (originSize.zw / 2.0 + scale.y));`  :
			
				`vec2 loc = view * (verts * scale * ${options.customDistanceScale  ? 
						"mix(" + glUtils.float(options.distanceScaleNear) + ", " + glUtils.float(options.distanceScaleFar) + ", dist)" : 
			"z"} + mod((pos - originSize.xy) * z, originSize.zw + scale * 2.0) - (originSize.zw / 2.0 + scale));`}
			gl_Position =  vec4(loc, ${options.useDepth ? "zIdx" : "1"}, 1);
		}`;
		
		const starFragment = `#version 300 es
		#NAME;
		//#SHOW_IN_CONSOLE;
		precision mediump float;
		in vec2 spr;
		${options.useColor ? "flat in vec4 col;" : ""}
		out vec4 pixelCol;
		void main() {
			${pointType}
			${pointType2Pix}			
				${fragmentColor}
				${options.alphaCut !== 0 ? "if (pixelCol.a < "+alphaCut+") { discard; }" : "if (pixelCol.a == 0.0) { discard; }"}
			} else { discard; }
		}`;	
		
		var cloudFragment = `#version 300 es
		#NAME;
		//#SHOW_IN_CONSOLE;
		precision mediump float;
		uniform vec4 cloudColors[3];
		uniform vec4 light;  // top scale, bottom scale. Normalized vec x,y 90 to dir of light
		${options.useClouds ? "flat in float size;" : "" }
		${options.useColor ? "flat in vec4 col;" : ""}
		${options.threeTone || options.twoTone ? "flat in float z;" : ""}
		in vec2 spr;
		out vec4 pixelCol;
		${options.useClouds && options.cloudLightModel === "scatter" ? `
		uniform float cloudSettings[4];     // Const idx into this array
		const int lightAttenuation = 0; 	// indexs cloudSettings. Value bigger less atenuation		
		const int bgAttenuation = 1;    	// indexs cloudSettings. Value bigger less atenuation		 	
		const int scatterAttenuation = 2;    // indexs cloudSettings. Value bigger less atenuation		 	
		` : ""}
		${options.useClouds && options.cloudLightModel === "twoTone" ?
			`const int colIdx[] = int[](0,1,0,1,0);
			const bool colIdxTest[] = bool[](true,false,false,true);` :
			""}
		void main() {
			float dist = length(spr);
			if(dist <= 1.0) {
				#lightModel
				${options.useColor ? `pixelCol *= col;` : ""}
			} else { discard; }		
		}`;


		if (options.scatter) {
			cloudFragment = cloudFragment.replace("#lightModel", `
			dist = 1.0 - dist * dist;
			float bg = pow((sqrt(dist) * size * 2.0), 2.0)  / (cloudSettings[bgAttenuation] * 2.0);
			vec4 newCol = vec4(0.0,0.0,0.0,1.0)${options.useColor ? " + col":""};
			float chord = spr.y * light.y + dist * light.x;
			float aten = max((pow(chord * 2.0 * size, 2.0) / (cloudSettings[lightAttenuation] * 2.0)) , 0.0);
			float scatter = max((pow((max(1.0-chord,0.0)) * 2.0 * size, 2.0) / (cloudSettings[scatterAttenuation] * 2.0)) , 0.0);
			newCol += vec4(cloudColors[0]) * aten *  -light.x + vec4(cloudColors[0]) * scatter * (1.0-bg);
			pixelCol = vec4(max(newCol.rgb,cloudColors[2].rgb), bg);
			\n`);
			cloudFragment = cloudFragment.replace("pixelCol *= col;","");
		} else if (options.twoTone) {
			cloudFragment = cloudFragment.replace("#lightModel", `bool dt = spr.y < 0.0;
			float len = light.x != 0.0 ? length(spr / vec2(1, abs(light.x))) : dist;
			int qm = (light.x >= 0.0 ? 0 : 1) + (light.y >= 0.0 ? 0 : 2);
			int idx = (colIdxTest[qm] == dt) ? (len <= 1.0 ? colIdx[qm] : colIdx[qm + 1]) : colIdx[qm];
			pixelCol = cloudColors[idx];
			gl_FragDepth = z + 0.01 - (1.0 - (dist * dist)) * 0.00001 * size;

			\n`);
		} else if (options.threeTone) {
			cloudFragment = cloudFragment.replace("#lightModel", `
			if (spr.y < 0.0) {
				pixelCol = length(spr * vec2(1, abs(light.x))) <= 1.0 ? cloudColors[1] : cloudColors[0];
			} else {
				pixelCol = length(spr * vec2(1, abs(light.y))) <= 1.0 ? cloudColors[1] : cloudColors[2];
			}
			gl_FragDepth = z+ 0.01 - (1.0 - (dist * dist)) * 0.00001 * size;
			\n`);
		} else if(options.useClouds) {  // defaults none
			cloudFragment = cloudFragment.replace("#lightModel", ``)
		}
		return [vertex, options.useClouds ? cloudFragment : starFragment];
	}
	

		
	const [vertex, fragment] = createShaders();
	const STRIDE = 
		2 +  						   // x,y  float
		1 +   						   // z index  float
		(options.useClouds ? 2 : 1) +  // scale  float or vec2
		(options.useColor ? 1 : 0) +   // color  4 bytes
		0;
	const MAX_BATCH = options.batchSize;	
	const dynamicBuf = () => new ArrayBuffer(MAX_BATCH * STRIDE * 4);
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]);
	const verts = () => new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
	var hasContent = false, vertexBuffer, buffers = [];


	function setup() {
		vertexBuffer = gl.createVertexArray();
		gl.bindVertexArray(vertexBuffer);
		const attributes = [
		    glUtils.attributeBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
			glUtils.attributeBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
			glUtils.attributeArray("verts",  2, gl.FLOAT, false),
			glUtils.attributeBuf(gl.ARRAY_BUFFER,         dynamicBuf(), gl.DYNAMIC_DRAW, "points", false),
			glUtils.attributeArrayPtr("pos",    2, gl.FLOAT, false),
			glUtils.attributeArrayPtr("zIdx",   1, gl.FLOAT, false),
			(options.useClouds ? 
				glUtils.attributeArrayPtr("scale",  2, gl.FLOAT, false) :
				glUtils.attributeArrayPtr("scale",  1, gl.FLOAT, false)),
			(options.useColor ? glUtils.attributeArrayPtr("color",  4, gl.UNSIGNED_BYTE, true) : undefined),
		].filter(a => a !== undefined);
		glUtils.setupAttributes(gl, attributes, program, STRIDE * 4, buffers)
		program.locations = glUtils.getLocations(gl, program, "view", "originSize", "cloudRot", "cloudColors", "light", "cloudSettings"); 
	}
	function close() {
		buffers.forEach(buf => gl.deleteBuffer(buf.glBuffer));
		buffers.length = 0;
		gl.deleteVertexArray(vertexBuffer);
		vertexBuffer = undefined;
	}	

	var gl, renderer, program;	
	function Sheet() {
		const batchSize = MAX_BATCH;
		this.batch = new ArrayBuffer(batchSize * STRIDE * 4);
		this.batchF32 = new Float32Array(this.batch);
		this.batchI32 = new Uint32Array(this.batch);
		this.batchCount = 0;
		this.batchSize = batchSize;
		this.view = new Float32Array([1,0,0,1]);
		this.originSize = new Float32Array([0,0,300,150]);
		if(options.useClouds) {
			this.clouds = {
				colors: new Float32Array([1, 1, 1, 1, 0.76, 0.9, 1, 1, 0.65, 0.8, 0.9,1 ]),
				light: new Float32Array([1.5, 2, 0, 1]),
				rotate: new Float32Array([1, 0, 0, 1]),
				settings: new Float32Array([0, 0, 0, 0]),

			};
		}
	}
	var first = true;
	Sheet.prototype = {
		close() {
			delete this.batch;
			delete this.batchF32;
			delete this.batchI32;
			delete this.view;
			delete this.originSize;	
			options.useClouds && (delete this.clouds);
		},		
		clear() { this.batchCount = 0;	hasContent = false },
		flush() {
			options.useClouds ? this.drawClouds() : this.draw();
			hasContent = false;
			this.batchCount = 0;
		},
		drawClouds(update) {
			if (this.batchCount) {
				const c = this.clouds;
				
				gl.uniformMatrix2fv(program.locations.view, false, this.view);			
				gl.uniform4fv(program.locations.originSize, this.originSize);					
				gl.uniformMatrix2fv(program.locations.cloudRot, false, c.rotate);					
				gl.uniform4fv(program.locations.cloudColors, c.colors, 0, 12);					
				gl.uniform4fv(program.locations.light, c.light);					
				useSettings && (gl.uniform1fv(program.locations.cloudSettings, c.settings, 0, 4));					
				if(first || update) {
					gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.named.points);	
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchF32.subarray(0, this.batchCount * STRIDE));
				}
				gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this.batchCount);
				first = false;
			}
		},
		draw() {
			if (this.batchCount) {
				gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.named.points);	
				gl.uniformMatrix2fv(program.locations.view, false, this.view);			
				gl.uniform4fv(program.locations.originSize, this.originSize);					
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchF32.subarray(0, this.batchCount * STRIDE));
				gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this.batchCount);
			}
		},	
		sort(direction = 1) {
			if (!hasContent) { console.warn("Can not sort stars. Batch buffer is empty") }
			else {
				const idxs = [], bF = this.batchF32, bI = this.batchI32;
				const bufCopy = new ArrayBuffer(this.batchCount * STRIDE * 4);
				const F32 = new Float32Array(bufCopy), I32 = new Uint32Array(bufCopy);
				var i = 0, j;
				while (i < this.batchCount) { idxs[i] = (i++) * STRIDE + 2 }
				if (options.useClouds){
					idxs.sort((a,b) => {
						const dif = (bF[b] - bF[a]) * direction;
						if(dif === 0) { 
							return (bF[a+1] - bF[b+1])  * direction;
						}
						return dif;
					});
				} else { idxs.sort((a,b) => (bF[b] - bF[a]) * direction) }					
				i = 0;
				while (i < this.batchCount) {
					const idxA = i * STRIDE;
					const idxB = idxs[i++] - 2;
					F32[idxA]     = bF[idxB];
					F32[idxA + 1] = bF[idxB + 1];
					F32[idxA + 2] = bF[idxB + 2];
					F32[idxA + 3] = bF[idxB + 3];
					if(options.useClouds) {
						F32[idxA + 4] = bF[idxB + 4];
						options.useColor && (I32[idxA + 5] = bI[idxB + 5])
					} else {
						options.useColor && (I32[idxA + 4] = bI[idxB + 4])
					}

				}
				i = 0;
				j = 0;
				while(i < F32.length) {
					bF[j++] = F32[i++];
					bF[j++] = F32[i++];
					bF[j++] = F32[i++];
					bF[j++] = F32[i++];
					options.useClouds && (bF[j++] = F32[i++]);
					options.useColor && (bI[j++] = I32[i++]);
				}
			}
		},
		addStar(x, y, size, color, z = 0.5) {
			if(this.batchCount < this.batchSize) {
				var i = this.batchCount * STRIDE;
				const bF = this.batchF32;
				const bI = this.batchI32;
				bF[i++] = x;
				bF[i++] = y;
				bF[i++] = z;
				bF[i++] = size;
				options.useColor && (bI[i++] = color);
				this.batchCount ++;
				hasContent = true;
				return this.batchCount - 1;
			}
		},
		addCloud(x, y, size, groupSize, color, z = 0.5) {
			if(this.batchCount < this.batchSize) {
				var i = this.batchCount * STRIDE;
				const bF = this.batchF32;
				const bI = this.batchI32;
				bF[i++] = x;
				bF[i++] = y;
				bF[i++] = z;
				bF[i++] = size;
				bF[i++] = groupSize;
				options.useColor && (bI[i++] = color);
				this.batchCount ++;
				hasContent = true;
				return this.batchCount - 1;
			}
		},		
		setMainLightAttenuation(atten) {
			if(useSettings && options.scatter) {
				this.clouds.settings[0] = atten;
			}
		},
		setScaterAttenuation(atten) {
			if(useSettings && options.scatter) {
				this.clouds.settings[2] = atten;
			}
		},		
		setBackgroundAttenuation(atten) {
			if(useSettings && options.scatter) {
				this.clouds.settings[1] = atten;
			}
		},		
		setCloudLight(roll, pitch, offset) { // cloud roll then pitch top point at light
			if(options.useClouds) {
				if(options.twoTone || options.threeTone || options.scatter) {
					const xdx = Math.cos(roll);
					const xdy = Math.sin(roll);
					this.clouds.rotate[0] = xdx;
					this.clouds.rotate[1] = xdy;
					this.clouds.rotate[2] = -xdy;
					this.clouds.rotate[3] = xdx;		
					if(options.scatter) {
						this.clouds.light[0] = Math.sin(pitch);
						this.clouds.light[1] = Math.cos(pitch);
					} else if(options.twoTone) {
						this.clouds.light[0] = Math.sin(pitch);
						this.clouds.light[1] = Math.cos(pitch);
					} else {
						this.clouds.light[0] = 1/ (Math.sin(pitch) * 0.25 + 0.25);
						this.clouds.light[1] = 1/ (Math.sin(pitch + offset) * 0.25 + 0.25);
					}
				}
			}
		
		},
		cloudColours(index, rgba) {
			if(options.useClouds) {
				index = (index % 3) << 2;
				this.clouds.colors[index++] = rgba.r / 255;
				this.clouds.colors[index++] = rgba.g / 255;
				this.clouds.colors[index++] = rgba.b / 255;
				this.clouds.colors[index  ] = rgba.a / 255;

			}
		},
		setTransform(ox,oy,scale,angle) {
			const v = this.view;
			const o = this.originSize;
			o[0] = ox;
			o[1] = oy;
			o[2] = renderer.canvas.width;
			o[3] = renderer.canvas.height;
			const w = 2 / renderer.canvas.width;
			const h = -2 / renderer.canvas.height;
			const xdx = Math.cos(angle) * (1/scale);
			const xdy = Math.sin(angle) * (1/scale);
			v[0] = xdx * w;
			v[1] = xdy * h;
			v[2] = -xdy * w;
			v[3] = xdx * h;			
		},		
	};
	

	const API = {
		source: {fragment,vertex},
		init(gl_context, gl_renderer, shadersProgram) {
			gl = gl_context;
			renderer = gl_renderer;
			program = shadersProgram;
			setup();
			API.sheet = new Sheet();
		},
		close() {
			API.sheet.close();
			delete API.sheet;
			gl.deleteProgram(program);
			API.source = {};
			program = undefined;
			renderer = undefined;
			close();
			gl = undefined;
			hasContent = false;
		},		
		use(blendModeName) { 
			if (hasContent) {
				glUtils.depthModes.setState(gl, options.useDepth);
				if (blendModeName) { glUtils.blendMode(gl, blendModeName) }
				else { options.useClouds ? glUtils.blendModes.standard(gl) : glUtils.blendModes.lightest(gl) }
				gl.useProgram(program);			
				gl.bindVertexArray(vertexBuffer);	
				return true;
			}
		},
		utils: {
			createStarField(fieldSize, minSize, maxSize, minDepth, maxDepth, lumPower, easeFarPower, count = MAX_BATCH) {
				var i = 0;
				while(i < MAX_BATCH) {
					const depth =( ((i / (count)) * (maxDepth - minDepth) + minDepth)) ** (1/easeFarPower);
					const depthScale = 1 / (1 - depth);
					API.sheet.addStar(
						Math.rand(-fieldSize,fieldSize) * depthScale,
						Math.rand(-fieldSize,fieldSize) * depthScale,
						Math.max(Math.rand(minSize, maxSize) * (1-depth / 2), 1),
						glUtils.toRGBA8Clamp(Math.rand(0,255 * lumPower),Math.rand(0,255 * lumPower),Math.rand(0,255 * lumPower),255),
						depth
					);
					i++;
				}
				API.sheet.sort();			
			},
			createCloudySky(size, minSize, maxSize, minGroup, maxGroup,minDepth, maxDepth, colorBase, easeFarPower, farScale = 0, count = MAX_BATCH){
				var i = 0,j;
				const group = [];
				minGroup = Math.max(minGroup,1);
				maxGroup = Math.max(minGroup + 1, maxGroup);
				while(i < MAX_BATCH) {
					const depth =( ((i / (count)) * (maxDepth - minDepth) + minDepth)) ** (1/easeFarPower);
					const scale = 1 + ((depth - minDepth) * (1 / (maxDepth - minDepth))) * farScale;
					const depthScale = 1 / (1 - depth);
					j = Math.rand(minGroup, maxGroup);
					const px = Math.rand(-size,size)* depthScale;
					const py = Math.rand(-size,size)* depthScale;
					const spread = maxSize * 2 * scale;
					group.length = 0;
					let tries = 0;
					while(group.length < j && i < MAX_BATCH) {
						const sx = Math.rand(minSize, maxSize) * scale;
						const x = Math.rand(-spread, spread);
						const y = Math.rand(0, spread / 2);						
						if(group.length === 0 || tries >= MAX_BATCH || group.every(circle => {
							if (sx < circle[2]) {
								return !Math.circleInCircle(circle[0],circle[1],circle[2], x, y, sx);
							}
							return !Math.circleInCircle(x,y,sx,circle[0],circle[1],circle[2]);
						})) {
							if(group.length === 0 || tries >= MAX_BATCH || group.some(circle => Math.circlesOverlap(x,y,sx,circle[0],circle[1],circle[2]))) {
								group.push([x,y,sx]);
								i++;
							}
						}
						tries ++;
					}
					group.forEach(circle => {	
						API.sheet.addCloud(
							px + circle[0],
							py + circle[1],
							Math.max(circle[2] * (1-depth / 2), 1),
							Math.max((spread + maxSize * 2) * (1-depth / 2), 1),
							colorBase,
							depth
						);		
					});						

				}
				API.sheet.sort();	
			}
		}
	};
	return API;
};

export {pointShader};
