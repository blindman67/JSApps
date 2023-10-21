import {Texture} from "../code/texture.jsm";
import {glUtils} from "../code/glUtils.jsm";

function spriteShader(options = {}){
	options = {
		useColor: true,
		useDepth: true,
		useRotate: true,
		useOffset: true,
		fixColor: null, // or {r,g,b,a} each 0-255
		alphaCut: 1.5,
		batchSize: 1024 * 8,
		...options,
	}
	function createShaders() {
		const alphaCut = (options.alphaCut / 255).toFixed(3);
		var vertexRot = options.useRotate ? `
        vec2 loc = (verts - ${options.useOffset ? "offset" : "0.5"})  * scale;
		float xdx = cos(rotate);
		float xdy = sin(rotate);
		loc = view * (vec2(loc.x * xdx - loc.y * xdy, loc.x * xdy + loc.y * xdx) + pos - origin);` :
		`vec2 loc = view * ((verts - ${options.useOffset ? "offset" : "0.5"})  * scale  + pos - origin);`;
		var fragmentColor = options.fixColor === null ? 
		`pixelCol = texture(tex, spr)${options.useColor ? "* col" : ""};` :
		`pixelCol = vec4(vec3(
			${(options.fixColor.r/255).toFixed(3)}, 
			${(options.fixColor.g/255).toFixed(3)}, 
			${(options.fixColor.b/255).toFixed(3)}), 
			texture(tex, spr).a * ${(options.fixColor.a/255).toFixed(3)}) ${options.useColor ? "* col" : ""};`
			
		const vertex = 
	`#version 300 es
	#NAME;
	//#SHOW_IN_CONSOLE;

	in vec2 verts;
	in vec2 pos;
	in vec2 scale;
	in vec4 sprite;
	${options.useOffset ? "in vec2 offset;" : ""}
	${options.useRotate ? "in float rotate;" : ""}
	${options.useDepth ? "in float zIdx;" : ""}
	${options.useColor ? "in vec4 color;" : ""}
	uniform mat2 view;
	uniform vec2 origin;
	out vec2 spr;
	${options.useColor ? "out vec4 col;" : ""}
	void main() {
		spr = sprite.xy + verts * sprite.zw;
		${options.useColor ? "if(color.a == 0.0) { gl_Position = vec4(0); return; } col = color.rgba;" : ""}
		${vertexRot}
		gl_Position =  vec4(loc, ${options.useDepth ? "zIdx" : "1"}, 1);
	}`;

		const fragment =  
	`#version 300 es
	#NAME;
	//#SHOW_IN_CONSOLE;
	precision mediump float;
	uniform sampler2D tex;
	in vec2 spr;
	${options.useColor ? "in vec4 col;" : ""}
	out vec4 pixelCol;
	void main() {
		${fragmentColor}
		${options.alphaCut !== 0 ? "if (pixelCol.a < "+alphaCut+") { discard; }" : "if (pixelCol.a == 0.0) { discard; }"}
	}`;	


		return [vertex, fragment];
	}
	
	const [vertex, fragment] = createShaders();	
	const STRIDE = 
		2 +  						   // x,y  float
		2 +  						   // scale  float
		4 +  						   // sprite x,y,w,h ??
		(options.useOffset ? 2 : 0) +  // offset  x,y
		(options.useRotate ? 1 : 0) +  // rotate  float
		(options.useDepth ? 1 : 0) +   // z index  float
		(options.useColor ? 1 : 0) +   // color  4 bytes
		0;


	const MAX_BATCH = options.batchSize;//65535; 	
	const dynamicBuf = () => new ArrayBuffer(MAX_BATCH * STRIDE * 4);
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]);
	const verts = () => new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
	const sheets = {}, sheetArray = [];
	
		
	
	var gl, renderer, program, hasContent = false, vertexBuffer, buffers = [], spriteBufDirty = true;
	
	function setup() {
		vertexBuffer = gl.createVertexArray();
		gl.bindVertexArray(vertexBuffer);
		const attributes = [
		    glUtils.attributeBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
			glUtils.attributeBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
			glUtils.attributeArray("verts",  2, gl.FLOAT, false),
			glUtils.attributeBuf(gl.ARRAY_BUFFER,         dynamicBuf(), gl.DYNAMIC_DRAW, "sprites", false),
			glUtils.attributeArrayPtr("pos",    2, gl.FLOAT, false),
			glUtils.attributeArrayPtr("scale",  2, gl.FLOAT, false),
			glUtils.attributeArrayPtr("sprite", 4, gl.FLOAT, false),
			(options.useOffset ? glUtils.attributeArrayPtr("offset", 2, gl.FLOAT, false) : undefined),
			(options.useRotate ? glUtils.attributeArrayPtr("rotate", 1, gl.FLOAT, false) : undefined),
			(options.useDepth ? glUtils.attributeArrayPtr("zIdx",   1, gl.FLOAT, false) : undefined),
			(options.useColor ? glUtils.attributeArrayPtr("color",  4, gl.UNSIGNED_BYTE, true) : undefined),
		].filter(a => a !== undefined);
		glUtils.setupAttributes(gl, attributes, program, STRIDE * 4, buffers);
		program.locations = glUtils.getLocations(gl, program, "tex", "view", "origin"); 
	}
	function close() {
		buffers.forEach(buf => gl.deleteBuffer(buf.glBuffer));
		buffers.length = 0;
		gl.deleteVertexArray(vertexBuffer);
		vertexBuffer = undefined;
		
	}
	
	function Sheet(name, img, sprites) {
		this.name = name;
		const batchSize = MAX_BATCH;
		this.tex = Texture(gl);
		this.tex.fromImage(img);
		this.batch = new ArrayBuffer(batchSize * STRIDE * 4);
		this.batchF32 = new Float32Array(this.batch);
		this.batchI32 = new Uint32Array(this.batch);
		this.batchI8 = new Uint8ClampedArray(this.batch);
		this.batchCount = 0;
		this.batchSize = batchSize;
		this.view = new Float32Array([1,0,0,1]);
		this.origin = new Float32Array([0,0]);		
		this.sprites = [];
		for(const spr of sprites) { this.sprites.push({x: spr.x / img.width, y: spr.y / img.height, W: spr.w, H: spr.h, w: spr.w / img.width, h: spr.h / img.height}) }
	}
	Sheet.prototype = {
		close() {
			this.tex.destroy();
			delete this.tex;
			delete this.batch;
			delete this.batchF32;
			delete this.batchI32;
			delete this.batchI8;
			delete this.view;
			delete this.origin;	
			delete this.sprites;
		},
		firstFree: 0,
		direction: 1,
		get stride() { return STRIDE },
		get buffers() { return [this.batchF32, this.batchI32] },		
		clear() { 
			this.batchCount = this.firstFree; 
			hasContent = this.firstFree !== 0;
			spriteBufDirty = true;
		},
		flush() {
			this.draw();
			this.batchCount = this.firstFree;
			hasContent = this.firstFree !== 0;
			spriteBufDirty = true;
		},
		draw(update) {
			if (this.batchCount) {
				this.tex.bind();
				gl.uniformMatrix2fv(program.locations.view, false, this.view);			
				gl.uniform2fv(program.locations.origin, this.origin);	
				if (spriteBufDirty || update) {
					gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.named.sprites);
					if (this.direction < 0) { gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchF32.subarray((this.batchSize - 1 - this.batchCount) * STRIDE , (this.batchSize - 1) * STRIDE)) }
					else { gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchF32.subarray(0, this.batchCount * STRIDE)) }
				}
				spriteBufDirty = false;
				gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this.batchCount);							
			}
		},
		reverse() {
			if (hasContent) { console.error("Can not set sprite batch direction while there are buffered sprites."); return }			
			if (this.firstFree === 0) { console.error("Can not set sprite batch direction while sprites have been captured."); return }			
			this.direction = this.direction< 0 ? 1 : -1;
		},
		addSprite(sprIdx, x, y, scale, ofx, ofy, rotate, color, z) {
			if(this.batchCount < this.batchSize) {
				var i = this.direction < 0 ? (this.batchSize - 1 - this.batchCount) * STRIDE : this.batchCount * STRIDE;
				const bF = this.batchF32;
				const bI = this.batchI32;
				const s = this.sprites[sprIdx % this.sprites.length];
				bF[i++] = x;
				bF[i++] = y;
				bF[i++] = scale * s.W;
				bF[i++] = scale * s.H;
				bF[i++] = s.x;
				bF[i++] = s.y;
				bF[i++] = s.w;
				bF[i++] = s.h;
				options.useOffset && (bF[i++] = ofx, bF[i++] = ofy);
				options.useRotate && (bF[i++] = rotate);
				options.useDepth && (bF[i++] = z);
				options.useColor && (bI[i++] = color);
				this.batchCount ++;
				hasContent = true;
				spriteBufDirty = true;
				return this.batchCount - 1;
			}
		},
		setTransform(ox,oy,scale,angle) {
			const v = this.view;
			const w = 2 / renderer.canvas.width;
			const h = -2 / renderer.canvas.height;
			const xdx = Math.cos(angle) * (1/scale);
			const xdy = Math.sin(angle) * (1/scale);
			this.origin[0] = ox;
			this.origin[1] = oy;
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
		},
		get stride() { return STRIDE },
		getSheet(name) { return sheets[name] },
		addSheet(name, image, sprites) {
			const sheet = sheets[name] = new Sheet(name, image, sprites);
			sheetArray.length = 0;
			sheetArray.push(...Object.values(sheets));
			return sheet;
		},
		close() {
			sheetArray.forEach(sheet => {
				delete sheets[sheet.name];
				sheet.close();
			});
			sheetArray.length = 0;
			gl.deleteProgram(program);
			API.source = {};
			program = undefined;
			renderer = undefined;
			close();
			gl = undefined;
			hasContent = false;
		},
		use() { 
			if(hasContent) {
				glUtils.depthModes.setState(gl, options.useDepth);
				glUtils.blendModes.standard(gl);
				gl.useProgram(program);
				gl.bindVertexArray(vertexBuffer);
				return true;
			}
		},
		flush() { for(const sheet of sheetArray) { sheet.flush() } },
		clear() { for(const sheet of sheetArray) { sheet.clear() } },
	};
	return API;
};

export {spriteShader};
