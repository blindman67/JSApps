

function paintFilterGlobalSetup() {
	
	filterGL2.addShaderLinkables({
		mouse: 
`uniform vec2 mouse;
uniform vec2 mouseOld;
uniform int mouseButton;
uniform float mouseSpeed;
uniform float mouseDir;`,
        mouseTex0: `mouse / tSize0`,
		paint_tSize0: `vec2 tSize0 = ##texSize0##`,
	});
}
paintFilterGlobalSetup();
function paintFilterCommon(shader,paintSource, uniforms) {
	if(paintSource.sprite.type.subSprite) {
		const subSprite = paintSource.sprite.subSprite
		shader.clip(subSprite.x, subSprite.y, subSprite.w, subSprite.h);
	} else {
		shader.clip(0, 0, paintSource.sprite.image.w,  paintSource.sprite.image.h);
	}
	if (uniforms.mouse) {
		uniforms.mouse[0] = paintSource.sprite.key.lx;
		uniforms.mouse[1] = paintSource.sprite.key.ly;		
		uniforms.mouseOld[0] = paintSource.sprite.key._lx;
		uniforms.mouseOld[1] = paintSource.sprite.key._ly;		
		uniforms.mouseDir = mouseBrush.direction;
		uniforms.mouseSpeed = mouseBrush.speed;
		uniforms.mouseButton.value = mouse.button;
		
	} else {
		uniforms.mouse = [paintSource.sprite.key.lx, paintSource.sprite.key.ly];
		uniforms.mouseOld = [paintSource.sprite.key._lx, paintSource.sprite.key._ly];
		uniforms.mouseButton = { type : "uniform1i", value : mouse.button };
		uniforms.mouseDir = mouseBrush.direction;
		uniforms.mouseSpeed = mouseBrush.speed;
	}
	paintSource.texture1.bind(1);

	
}
function paintUpdate(image, glF) {
	image.ctx.globalAlpha = 1;
	image.ctx.setTransform(1,0,0,1,0,0);
	image.ctx.globalCompositeOperation = "copy";
	image.ctx.drawImage(glF.canvas, 0, 0);
}


filterGL2.filters.register("paintFilter", {
	name: "paintFilter",
	description : "Experiment",
	webGLFilters : null,
	shader : null,
	uniforms: {},
	callback(source, size, curve, scale, rotateScale, rotateOffset) {
		var glF = this.webGLFilters;
		if (this.shader === undefined || this.shader === null){
			this.shader = glF.Shader(null, null).useLinker().setUniformNames("mouse", "brushSize","rotateOffset","rotateScale");
			this.shader.setFragmentSource(
			   `##v3ES##
				precision mediump float;
				uniform sampler2D tex0;
				uniform sampler2D tex1;
				in vec2 coord;
				##mouse##
				uniform float brushSize;
				uniform float rotateOffset;
				uniform float rotateScale;
				uniform float scale;
				uniform float curve;
				out vec4 pixel;
				
				float ss, sro, srs;

				void main() {    
				    ##paint_tSize0##;
					vec2 toMouse = (##mouseTex0## - coord);
					float dist = length(toMouse);
					vec4 b = texture(tex0, coord);
					if (dist < brushSize) {
						if (mouseButton == 1) {
							ss = (b.b * b.r) + 0.1;
							sro = (b.r * b.g) + 0.1;
							srs = (b.b * b.g) + 0.1;
						} else {
							ss =  -(1.1 - (b.b * b.r));
							sro = -(1.1 - (b.r * b.g));
							srs = -(1.1 - (b.b * b.g));
						}							
						float m = pow((1.0 - dist / brushSize), curve);
						float r = (m * ##PI## + rotateOffset * sro) * rotateScale * srs;
						vec2 rot = vec2(cos(r), -sin(r));
						toMouse = normalize(mat2(rot, rot.yx * vec2(-1,1)) * toMouse) / tSize0;
						vec4 e = texture(tex0, coord);
						vec4 a = texture(tex0, coord + toMouse * scale * m * ss);
						vec4 c = mix(e, a, m) * vec4(1,1,1,m);
						
						float aa = b.a * (1.0 - c.a);
						b = vec4((c.rgb * c.a + b.rgb * aa) / (c.a + aa), c.a + aa);						
					}						
					pixel =  b;
				}
				
			`);
		}
		const uObj = this.uniforms;
		uObj.scale = scale;
		uObj.rotateScale = rotateScale;
		uObj.rotateOffset = rotateOffset;
		uObj.curve = curve < 0 ? 1 / ((1-curve) ** 2) : (1 + curve) ** 2;
		uObj.brushSize = size / Math.max(glF.width,glF.height);
		if(!uObj.tex1) { uObj.tex1 = {type :"uniform1i",value : 1} }
		paintFilterCommon(this.shader,source, uObj);
		glF.filter(this.shader, uObj);     
		paintUpdate(source.sprite.image, glF);
		return glF; 
	},            
	arguments : [{
			name : "sprite",
			description : "",
			type : "Sprite",
			range : {def : null},
		}, {
			name : "size",
			description: "Size of brush",
			type: "Number",
			range: {min: 1, max: 512, step: 1, def: 16},
		}, {
			name : "Curve",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -4, max: 4, step: 0.1, def: 1},
		}, {
			name : "scale",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -18, max: 18, step: 0.1, def: 1},
		}, {
			name : "rotScale",
			description: "Amount of rotation",
			type: "Number",
			range: {min: -12, max: 12, step: 0.1, def: 1},
		}, {
			name : "rotOffset",
			description: "Rotation offset",
			type: "Number",
			range: {min: -Math.PI, max: Math.PI, step: 0.1, def: 0},
		}

	], 
});
filterGL2.filters.register("paintFilterA", {
	name: "paintFilterA",
	description : "Experiment",
	webGLFilters : null,
	shader : null,
	uniforms: {},
	callback(source, size, curve, scale, rotateScale, rotateOffset) {
		var glF = this.webGLFilters;
		if (this.shader === undefined || this.shader === null){
			this.shader = glF.Shader(null, null).useLinker().setUniformNames("mouse", "brushSize","rotateOffset","rotateScale");
			this.shader.setFragmentSource(
			   `##v3ES##
				precision mediump float;
				uniform sampler2D tex0;
				uniform sampler2D tex1;
				in vec2 coord;
				##mouse##
				uniform float brushSize;
				uniform float rotateOffset;
				uniform float rotateScale;
				uniform float scale;
				uniform float curve;
				out vec4 pixel;
				
				float ss, sro, srs;

				void main() {    
				    ##paint_tSize0##;
					vec2 toMouse = (##mouseTex0## - coord);
					
					float dist = length(toMouse);
					vec4 b = texture(tex0, coord);
					if (dist < brushSize) {
						if (mouseButton == 1) {
							ss = (b.b * b.r) + 0.1;
							sro = (b.r * b.g) + 0.1;
							srs = (b.b * b.g) + 0.1;
						} else {
							ss =  -(1.1 - (b.b * b.r));
							sro = -(1.1 - (b.r * b.g));
							srs = -(1.1 - (b.b * b.g));
						}							
						float m = pow((1.0 - dist / brushSize), curve);
						float r = (m * ##PI## + rotateOffset * sro) * rotateScale * srs;
						toMouse = vec2(-cos(mouseDir), -sin(mouseDir));
						vec2 rot = vec2(cos(r), -sin(r));
						toMouse = normalize(mat2(rot, rot.yx * vec2(-1,1)) * toMouse)  * mouseSpeed / tSize0;
						vec4 e = texture(tex0, coord);
						vec4 a = texture(tex0, coord + toMouse * scale * m * ss);
						vec4 c = mix(e, a, m) * vec4(1,1,1,m);
						
						float aa = b.a * (1.0 - c.a);
						b = vec4((c.rgb * c.a + b.rgb * aa) / (c.a + aa), c.a + aa);						
					}						
					pixel =  b;
				}
				
			`);
		}
		const uObj = this.uniforms;
		uObj.scale = scale;
		uObj.rotateScale = rotateScale;
		uObj.rotateOffset = rotateOffset;
		uObj.curve = curve < 0 ? 1 / ((1-curve) ** 2) : (1 + curve) ** 2;
		uObj.brushSize = size / Math.max(glF.width,glF.height);
		if(!uObj.tex1) { uObj.tex1 = {type :"uniform1i",value : 1} }
		paintFilterCommon(this.shader,source, uObj);
		glF.filter(this.shader, uObj);     
		paintUpdate(source.sprite.image, glF);
		return glF; 
	},            
	arguments : [{
			name : "sprite",
			description : "",
			type : "Sprite",
			range : {def : null},
		}, {
			name : "size",
			description: "Size of brush",
			type: "Number",
			range: {min: 1, max: 512, step: 1, def: 16},
		}, {
			name : "Curve",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -4, max: 4, step: 0.1, def: 1},
		}, {
			name : "scale",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -18, max: 18, step: 0.1, def: 1},
		}, {
			name : "rotScale",
			description: "Amount of rotation",
			type: "Number",
			range: {min: -12, max: 12, step: 0.1, def: 1},
		}, {
			name : "rotOffset",
			description: "Rotation offset",
			type: "Number",
			range: {min: -Math.PI, max: Math.PI, step: 0.1, def: 0},
		}

	], 
});

filterGL2.filters.register("paintFilter1", {
	name: "paintFilter1",
	description : "Experiment",
	webGLFilters : null,
	shader : null,
	uniforms: {},
	callback(source, size, curve, scale, rotateScale, rotateOffset) {
		var glF = this.webGLFilters;
		if (this.shader === undefined || this.shader === null){
			this.shader = glF.Shader(null, null).useLinker().setUniformNames("mouse", "brushSize","rotateOffset","rotateScale");
			this.shader.setFragmentSource(
			   `##v3ES##
				precision mediump float;
				uniform sampler2D tex0;
				uniform sampler2D tex1;
				in vec2 coord;
				##mouse##
				uniform float brushSize;
				uniform float rotateOffset;
				uniform float rotateScale;
				uniform float scale;
				uniform float curve;
				out vec4 pixel;
				
				float ss, sro, srs;

				void main() {    
				    ##paint_tSize0##;
					vec2 toMouse = (##mouseTex0## - coord);
					float dist = length(toMouse);
					vec4 b = texture(tex0, coord);
					if (dist < brushSize) {
						if (mouseButton == 1) {
							ss = (b.b * b.r) + 0.1;
							sro = (b.r * b.g) + 0.1;
							srs = (b.b * b.g) + 0.1;
						} else {
							ss =  -(1.1 - (b.b * b.r));
							sro = -(1.1 - (b.r * b.g));
							srs = -(1.1 - (b.b * b.g));
						}							
						float m = pow((1.0 - dist / brushSize), curve);
						float at = atan(toMouse.x, toMouse.y)  + sin(mouseDir) * ##PI##;
						float r = (m * ##PI## + at + rotateOffset * sro) * rotateScale * srs;
						vec2 rot = vec2(cos(r), -sin(r));
						toMouse = normalize(mat2(rot, rot.yx * vec2(-1,1)) * toMouse) / tSize0;
						vec4 e = texture(tex0, coord);
						vec4 a = texture(tex0, coord + toMouse * scale * m * ss);
						vec4 c = mix(e, a, m) * vec4(1,1,1,m);
						
						float aa = b.a * (1.0 - c.a);
						b = vec4((c.rgb * c.a + b.rgb * aa) / (c.a + aa), c.a + aa);						
					}						
					pixel =  b;
				}
				
			`);
		}
		const uObj = this.uniforms;
		uObj.scale = scale;
		uObj.rotateScale = rotateScale;
		uObj.rotateOffset = rotateOffset;
		uObj.curve = curve < 0 ? 1 / ((1-curve) ** 2) : (1 + curve) ** 2;
		uObj.brushSize = size / Math.max(glF.width,glF.height);
		if(!uObj.tex1) { uObj.tex1 = {type :"uniform1i",value : 1} }
		paintFilterCommon(this.shader,source, uObj);
		glF.filter(this.shader, uObj);     
		paintUpdate(source.sprite.image,glF);
		return glF; 
	},            
	arguments : [{
			name : "sprite",
			description : "",
			type : "Sprite",
			range : {def : null},
		}, {
			name : "size",
			description: "Size of brush",
			type: "Number",
			range: {min: 1, max: 512, step: 1, def: 16},
		}, {
			name : "Curve",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -4, max: 4, step: 0.1, def: 1},
		}, {
			name : "scale",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -18, max: 18, step: 0.1, def: 1},
		}, {
			name : "rotScale",
			description: "Amount of rotation",
			type: "Number",
			range: {min: -12, max: 12, step: 0.1, def: 1},
		}, {
			name : "rotOffset",
			description: "Rotation offset",
			type: "Number",
			range: {min: -Math.PI, max: Math.PI, step: 0.1, def: 0},
		}

	], 
});

filterGL2.filters.register("paintFX", {
	name: "paintFX",
	description : "Experiment",
	webGLFilters : null,
	shader : null,
	uniforms: {},
	callback(source, size, scale, rotateScale, rotateOffset) {
		var glF = this.webGLFilters;
		if (this.shader === undefined || this.shader === null){
			this.shader = glF.Shader(null, null).useLinker().setUniformNames("mouse");
			this.shader.setFragmentSource(
			   `##v3ES##
				precision mediump float;
				uniform sampler2D tex0;
				uniform sampler2D tex1;
				in vec2 coord;
				##mouse##
				uniform float rAngle;
				uniform float rDown;
				vec4 a,e;
				float pixCount;
				out vec4 pixel;

				void main() {    
				    ##paint_tSize0##;
					vec2 p = 1.0 / tSize0;
					vec2 toMouse = (##mouseTex0## - coord);
					float dist = length(toMouse);
					vec4 b = texture(tex1, coord);
					float rd = rDown * (cos((b.a + b.b + b.g + b.r) * 10.0) * 0.1 + 1.0);
					vec4 c = texture(tex0, coord);
					vec2 pp = vec2(cos(rAngle), sin(rAngle)) * p * rd;
					c += texture(tex0, coord + vec2(pp.x, pp.y));
					c += texture(tex0, coord + vec2(-pp.x, -pp.y));
					c += texture(tex0, coord + vec2(-pp.y, pp.x));
					c += texture(tex0, coord + vec2(pp.y, -pp.x));

					c /= 5.0;
		
					float aa = b.a * (1.0 - c.a);
					b = vec4((c.rgb * c.a + b.rgb * aa) / (c.a + aa), c.a + aa);

					if(b.a > 0.0) {
						pixel = b;
					} else {
						discard;
					}

				}
				
			`);
		}
		const uObj = this.uniforms;
		//uObj.scale = scale;
		//uObj.rotateScale = rotateScale;
		//uObj.rotateOffset = rotateOffset;
		//uObj.brushSize = size / Math.max(glF.width,glF.height);
		if(!uObj.tex1) { uObj.tex1 = {type :"uniform1i",value : 1} }
		uObj.rAngle = Math.random() * 0.1 - 0.05 - Math.PI / 2;
		uObj.rDown = Math.random() * 0.4 + 0.5;
		paintFilterCommon(this.shader, source, uObj);
		glF.filter(this.shader, uObj);  
		paintUpdate(source.sprite.image,glF);
		
		return glF; 
	},            
	arguments : [{
			name : "sprite",
			description : "",
			type : "Sprite",
			range : {def : null},
		}, 

	], 
});
filterGL2.filters.register("paintFilter2", {
	name: "paintFilter2",
	description : "Experiment",
	webGLFilters : null,
	shader : null,
	uniforms: {},
	callback(source, size, scale, rotateScale, rotateOffset) {
		var glF = this.webGLFilters;
		if (this.shader === undefined || this.shader === null){
			this.shader = glF.Shader(null, null).useLinker().setUniformNames("mouse", "brushSize","rotateOffset","rotateScale");
			this.shader.setFragmentSource(
			   `##v3ES##
				precision mediump float;
				uniform sampler2D tex0;
				uniform sampler2D tex1;
				in vec2 coord;
				##mouse##
				uniform float brushSize;
				uniform float rotateOffset;
				uniform float rotateScale;
				uniform float scale;
				out vec4 pixel;

				void main() {    
				    ##paint_tSize0##;
					vec2 toMouse = (##mouseTex0## - coord);
					vec4 cc = vec4(0);
					int count = 0;
					vec4 B = texture(tex0, coord);
					vec4 A = texture(tex1, coord);
					if (any(notEqual(B,A))) { 
						//cc += (;
						B -= (B - A) * 0.25;
						count = 1;
					}
					
					vec2 offx = vec2(tSize0.x, 0);
					vec2 offy = vec2(0, tSize0.y);
					vec2 dir = vec2(0);
					
					
					vec4 B1 = texture(tex0, coord + offx);
					vec4 A1 = texture(tex1, coord + offx);
					if (any(notEqual(B1,A1))) { 
						dir += offx;
						cc += (B1 - A1) * 0.25;
						count += 1;
					}
					
					vec4 B2 = texture(tex0, coord + offy);
					vec4 A2 = texture(tex1, coord + offy);
					if (any(notEqual(B2,A2))) { 
						dir += offy; 
						cc += (B2 - A2) * 0.25;
						count += 1;
					}

					vec4 B3 = texture(tex0, coord - offx);
					vec4 A3 = texture(tex1, coord - offx);	
					if (any(notEqual(B3,A3))) { 
						dir -= offx;
						cc += (B3 - A3) * 0.25;						
						count += 1;
					}

					vec4 B4 = texture(tex0, coord - offy);
					vec4 A4 = texture(tex1, coord - offy);					
					if (any(notEqual(B4,A4))) { 
						dir -= offy; 
						cc += (B4 - A4) * 0.25;	
						count += 1;
					}
					if ( count > 0){
						B += cc / float(count);


		
						float aa = A.a * (1.0 - B.a);
						B = vec4((B.rgb * B.a + A.rgb * aa) / (B.a + aa), B.a + aa);
					}
						
					pixel =  B;
				}
				
			`);
		}
		const uObj = this.uniforms;
		uObj.scale = scale;
		uObj.rotateScale = rotateScale;
		uObj.rotateOffset = rotateOffset;
		uObj.brushSize = size / Math.max(glF.width,glF.height);
		if(!uObj.tex1) { uObj.tex1 = {type :"uniform1i",value : 1} }
		paintFilterCommon(this.shader,source, uObj);
		glF.filter(this.shader, uObj);     
		paintUpdate(source.sprite.image,glF);
		return glF; 
	},            
	arguments : [{
			name : "sprite",
			description : "",
			type : "Sprite",
			range : {def : null},
		}, {
			name : "size",
			description: "Size of brush",
			type: "Number",
			range: {min: 1, max: 512, step: 1, def: 16},
		}, {
			name : "scale",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -18, max: 18, step: 0.01, def: 1},
		}, {
			name : "rotScale",
			description: "Amount of rotation",
			type: "Number",
			range: {min: -12, max: 12, step: 0.01, def: 1},
		}, {
			name : "rotOffset",
			description: "Rotation offset",
			type: "Number",
			range: {min: -Math.PI, max: Math.PI, step: 0.01, def: 0},
		}

	], 
});		


/* Standalone webGL utilities copyright 2020 blindmanmag4@gmail.com */
const glUtils = (()=>{
    var gl;
    const glConst = name => isNaN(name) ? gl[name] : name;
	const locTypes = {
		U(prg, name) { return gl.getUniformLocation(prg, name) },
		A(prg, name) { return gl.getAttribLocation(prg, name) },
	};
	
	
    const utils = {
        texture(gl, image, {targetType = gl.TEXTURE_2D, min = gl.LINEAR, mag = gl.LINEAR, wrapX = gl.REPEAT, wrapY = gl.REPEAT, wrapZ = gl.REPEAT} = {}) {
            const texture = gl.createTexture();
            texture.target_type = target = glConst(targetType);
            gl.bindTexture(target, texture);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, glConst(min));
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, glConst(mag));
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, glConst(wrapX));
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, glConst(wrapY)); 
            gl.texParameteri(target, gl.TEXTURE_WRAP_R, glConst(wrapZ)); 
            image && gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            return texture;
        },
        bindTexture(texture, unit) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(texture.target_type, texture);
        },
		delete({program, buffers, textures}) {
			if (program) {
				gl.getAttachedShaders(program).forEach(shader => gl.deleteShader(shader));
				gl.deleteProgram(program);
			}
			if (buffers) {
				gl.deleteVertexArray(buffers.vertexBuffer);
				delete buffers.vertexBuffer;
				for (const buf of Object.values(buffers)) { 
					buf.glBuffer && gl.deleteBuffer(buf.glBuffer);
					buf.data && (buf.data = undefined);
				}
			}
			if (textures) {
				for (const texture of textures) { gl.deleteTexture(texture) }
			}
		},
        getLocations(prg, ...names) {
            const locs = {};
            for (const desc of names) {
                const [type, name] = desc.split("_");
                locs[name] = locTypes[type](prg, name);    
            }
            return locs;
        },
        compileShader(src, type, shader = gl.createShader(type)) {
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { throw new Error("WebGL shader compile error\n" + gl.getShaderInfoLog(shader)) }    
            return shader;
        },
        createProgram(vSrc, fSrc, locDesc, program = gl.createProgram()) {
            gl.attachShader(program, API.compileShader(vSrc, gl.VERTEX_SHADER));
            gl.attachShader(program, API.compileShader(fSrc, gl.FRAGMENT_SHADER));
            gl.linkProgram(program);   
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { throw new Error("WebGL program link error\n" + gl.getProgramInfoLog(program)) }	
            gl.useProgram(program);         
            const locations =  API.getLocations(program, ...locDesc);    
            return [program, locations];
        },
        initBuffers(bufferDesc, locations, vertexBuffer = gl.createVertexArray()) {
            gl.bindVertexArray(vertexBuffer);
            for (const [name, d] of Object.entries(bufferDesc)) {
                if (d.data) {
					gl.bindBuffer(d.type = glConst(d.type), d.glBuffer = gl.createBuffer());
					gl.bufferData(d.type, d.data, d.use = glConst(d.use));  
                }
                if (locations[name] !== undefined) { API.initVertexAttribute(locations[name], d) }
            }
            bufferDesc.vertexBuffer = vertexBuffer;
            return bufferDesc;
        },
        initVertexAttribute(loc, {size, offset = 0, stride = 0, dataType = gl.FLOAT, divisor}) {
            gl.enableVertexAttribArray(loc);
            if (dataType === gl.UNSIGNED_INT) { gl.vertexAttribIPointer(loc, size, dataType, stride, offset) }
            else { gl.vertexAttribPointer(loc, size, dataType, false, stride, offset) }
            divisor && gl.vertexAttribDivisor(loc, 1);
        },
        updateCanvasSize(useFixed = true) {
            if (useFixed) {
                if (gl.canvas.width !== API.width || canvas.height !== API.height) {
                    gl.canvas.width = API.width;
                    gl.canvas.height = API.height;			
                    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); 
                    return true;
                }
            } else if (gl.canvas.width !== innerWidth || gl.canvas.height !== innerHeight) {
                API.width = gl.canvas.width = innerWidth;
                API.height = gl.canvas.height = innerHeight;
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                return true;
            }
        },
        /* NOTE these become standard properties (Not getters) when copied to API */
        get bufferDescDefault() { return {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW} },
        get width() { return gl.canvas.width },
        get height() { return gl.canvas.height },
		get buffers() { return {
				indices: { type: gl.ELEMENT_ARRAY_BUFFER, use: gl.STATIC_DRAW, dataType: gl.UNSIGNED_BYTE, data: API.quadIndices},
				verts: {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW, size: 2, data: API.quadVerts},
			};
		},			
    };
    const API = {
        set context(context) { 
			if (gl) { gl = context }
			else {
				gl = context;
				Object.assign(API, utils);
			}
        },
        get context() { return gl },
		createContext(canvas, options = {}) { return this.context = canvas.getContext("webgl2", {premultipliedAlpha: false, antialias: false, alpha: false, ...options}) },
		quadIndices: new Uint8Array([0, 1, 2, 0, 2, 3]),
		quadVerts: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
        colors: {
            int32(cArr, int32) {
                cArr[0] = ((int32 >> 24) & 0xFF) / 255;
                cArr[1] = ((int32 >> 16) & 0xFF) / 255;
                cArr[2] = ((int32 >> 8 ) & 0xFF) / 255;
                cArr[3] = (int32 & 0xFF) / 255;
            },
            RGBA(cArr, rgba) {
                cArr[0] = rgba.r !== undefined ? rgba.r : cArr[0];
                cArr[1] = rgba.g !== undefined ? rgba.g : cArr[1];
                cArr[2] = rgba.b !== undefined ? rgba.b : cArr[2];
                cArr[3] = rgba.a !== undefined ? rgba.a : cArr[3];
            },    
        },
    };
    return API;
})();

function particleShader(opts = {}) {
	Object.assign(opts, {
		maxLength: 256, 
		...opts,
	});
	
	const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			in vec2 pos;  
			in vec2 scale;  
			in vec2 rot;
			in vec4 color;
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

    var gl, program, locations, buffers, bufDirty, viewDirty, colorDirty, length = 0;
    const STRIDE = 2 + 1, STRIDE4 = STRIDE * 4;   // pos x y, scale   
    const instanceBuffer = new ArrayBuffer(opts.maxLength * STRIDE4);  
    const view = new Float32Array([1,0,0,1]);  
    const locationDesc = ["A_pos", "A_scale", "A_rot","A_color", "A_verts", "U_view"];
    const bufferDesc = () => ({
		indices: {...glUtils.buffers.indices},  
		verts: {...glUtils.buffers.verts},
        instanceBuffer: {type: gl.ARRAY_BUFFER, use: gl.DYNAMIC_DRAW, data: instanceBuffer},
        posScale: {size: 3, stride: STRIDE4, divisor: 1},
    });
    const API = {
		compile(vSrc = src.vert, fSrc = src.frag, locDesc = locationDesc) { 
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
            if (viewDirty || dirty) {
				view[0] =  2 / gl.canvas.width;
				view[1] = 0;
				view[2] = 0;
				view[3] = -2 / gl,canvas.height;
				gl.uniformMatrix2fv(locations.view, false, view.matrix) 
			}
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


filterGL2.filters.register("paintPolys", {
	name: "paintPolys",
	description : "Experiment",
	webGLFilters : null,
	shader : null,
	uniforms: {},
	callback(source, size, scale, rotateScale, rotateOffset) {
		var glF = this.webGLFilters;
		if (this.shader === undefined || this.shader === null){
			this.shader = glF.Shader(null, null).useLinker().setUniformNames("mouse", "brushSize","rotateOffset","rotateScale");
			this.shader.setFragmentSource(
			   `##v3ES##
				precision mediump float;
				uniform sampler2D tex0;
				uniform sampler2D tex1;
				in vec2 coord;
				##mouse##
				uniform float brushSize;
				uniform float rotateOffset;
				uniform float rotateScale;
				uniform float scale;
				out vec4 pixel;

				void main() {    
				    ##paint_tSize0##;
					vec2 toMouse = (##mouseTex0## - coord);
					vec4 cc = vec4(0);
					int count = 0;
					vec4 B = texture(tex0, coord);
					vec4 A = texture(tex1, coord);
					if (any(notEqual(B,A))) { 
						//cc += (;
						B -= (B - A) * 0.25;
						count = 1;
					}
					
					vec2 offx = vec2(tSize0.x, 0);
					vec2 offy = vec2(0, tSize0.y);
					vec2 dir = vec2(0);
					
					
					vec4 B1 = texture(tex0, coord + offx);
					vec4 A1 = texture(tex1, coord + offx);
					if (any(notEqual(B1,A1))) { 
						dir += offx;
						cc += (B1 - A1) * 0.25;
						count += 1;
					}
					
					vec4 B2 = texture(tex0, coord + offy);
					vec4 A2 = texture(tex1, coord + offy);
					if (any(notEqual(B2,A2))) { 
						dir += offy; 
						cc += (B2 - A2) * 0.25;
						count += 1;
					}

					vec4 B3 = texture(tex0, coord - offx);
					vec4 A3 = texture(tex1, coord - offx);	
					if (any(notEqual(B3,A3))) { 
						dir -= offx;
						cc += (B3 - A3) * 0.25;						
						count += 1;
					}

					vec4 B4 = texture(tex0, coord - offy);
					vec4 A4 = texture(tex1, coord - offy);					
					if (any(notEqual(B4,A4))) { 
						dir -= offy; 
						cc += (B4 - A4) * 0.25;	
						count += 1;
					}
					if ( count > 0){
						B += cc / float(count);


		
						float aa = A.a * (1.0 - B.a);
						B = vec4((B.rgb * B.a + A.rgb * aa) / (B.a + aa), B.a + aa);
					}
						
					pixel =  B;
				}
				
			`);
		}
		const uObj = this.uniforms;
		uObj.scale = scale;
		uObj.rotateScale = rotateScale;
		uObj.rotateOffset = rotateOffset;
		uObj.brushSize = size / Math.max(glF.width,glF.height);
		if(!uObj.tex1) { uObj.tex1 = {type :"uniform1i",value : 1} }
		paintFilterCommon(this.shader,source, uObj);
		glF.filter(this.shader, uObj);     
		paintUpdate(source.sprite.image,glF);
		return glF; 
	},            
	arguments : [{
			name : "sprite",
			description : "",
			type : "Sprite",
			range : {def : null},
		}, {
			name : "size",
			description: "Size of brush",
			type: "Number",
			range: {min: 1, max: 512, step: 1, def: 16},
		}, {
			name : "scale",
			description: "Scale pixel move",
			type: "Number",
			range: {min: -18, max: 18, step: 0.01, def: 1},
		}, {
			name : "rotScale",
			description: "Amount of rotation",
			type: "Number",
			range: {min: -12, max: 12, step: 0.01, def: 1},
		}, {
			name : "rotOffset",
			description: "Rotation offset",
			type: "Number",
			range: {min: -Math.PI, max: Math.PI, step: 0.01, def: 0},
		}

	], 
});		