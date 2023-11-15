import {} from "../../utils/MathExtensions.js";
import {glUtils} from "../glUtils.js";
import {Texture} from "../Texture.js";

export {spriteShader};

function spriteShader(options = {}){
	options = {
		batchSize: 256 * 256, // number of sprites.
		alphaCut: 0,
		name: "Sprites",
		...options,
	};
	if(isNaN(options.maxSpritesPerSheet) || options.maxSpritesPerSheet <= 0) {
		throw new RangeError("spriteShader option.maxSpritesPerSheet requiered and value gerter than zero.");
	}
	const vertexSrc = `#version 300 es
		#define alphaCut ${("" + options.alphaCut).padEnd(3, ".0")}
		in vec2 verts;
		in vec2 pos;       // sprite position
		in vec2 scale;     // scale x, y
		in vec2 offset;    // origin of sprite from top left 0.5, 0.5 is center
		in float rotate;   // rotation in radians
		in float zIdx;     // z index 0 near to 1 far
		in vec4 color;     // RGBA to tint sprite and fade Alpha 0 and sprite is not rendered			
		in uint spriteIdx; // Index of sprite on sheet
		uniform vec4 sheetLayout[${options.maxSpritesPerSheet}];
		uniform vec2 sheetSize;		
		uniform mat2 view;  // View 2D scale rotate matrix			
		uniform vec2 origin; // 
		out vec2 spr;
		out vec4 col;
		void main() {
			if (color.a <= alphaCut) { 
				gl_Position = vec4(vec3(-2), 1);
			} else {
				col = color;
				vec4 sprite = sheetLayout[spriteIdx];
				spr = sprite.xy + verts * (sprite.zw / sheetSize);
				vec2 loc = (verts - offset) * (scale * sprite.zw);
				float xdx = cos(rotate);
				float xdy = sin(rotate);
				loc = view * (vec2(loc.x * xdx - loc.y * xdy, loc.x * xdy + loc.y * xdx) + pos - origin);
				gl_Position =  vec4(loc, zIdx, 1);
			}
		}`;
	const fragmentSrc = `#version 300 es
		precision mediump float;
		uniform sampler2D tex;
		#define alphaCut ${("" + options.alphaCut).padEnd(3, ".0")}
		in vec2 spr;
		in vec4 col;
		out vec4 pixel;
		void main() {
			pixel = texture(tex, spr) * col;
			if (pixel.a <= alphaCut) { discard; }
		}`;	

	const STRIDE = 2 + 2 + 2 + 1 + 1 + 1 + 1;   // pos, scale, offset, rotate, zTdx, color (Uint32), spriteIdx (Uint32)
	const dynamicBuf = () => new ArrayBuffer(options.batchSize * STRIDE * 4);  
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]); 
	const verts = () => new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
	const layout = size => new Float32Array(Math.min(options.maxSpritesPerSheet, size) * 4);
	const sheets = {}, sheetArray = [], buffers = {};
	var gl, renderer, program, vertexBuffer, id = 0;
	function cleanView(sheet) { sheet.dirtyView && (Math.mat2x2Inv(sheet.view, sheet.invView), sheet.dirtyView = false) };
	
	function setup() {
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		glUtils.setupAttributes(gl, [
				glUtils.attBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
				glUtils.attBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
				glUtils.attArray("verts",  2, gl.FLOAT),
				glUtils.attBuf(gl.ARRAY_BUFFER, dynamicBuf(), gl.DYNAMIC_DRAW, "sprites"), 
				glUtils.attArrayPtr("pos",       2, gl.FLOAT),
				glUtils.attArrayPtr("scale",     2, gl.FLOAT),
				glUtils.attArrayPtr("offset",    2, gl.FLOAT),
				glUtils.attArrayPtr("rotate",    1, gl.FLOAT),
				glUtils.attArrayPtr("zIdx",      1, gl.FLOAT),
				glUtils.attArrayPtr("color",     4, gl.UNSIGNED_BYTE, true),
				glUtils.attArrayPtr("spriteIdx", 1, gl.UNSIGNED_INT),
			],
			program, STRIDE * 4, buffers
		);
		program.locations = glUtils.getLocations(gl, program, "tex", "sheetLayout", "sheetSize", "view", "origin");   
		program.dirtySheet = true;
	}
	function Sheet(name, img, sprites) {
		this.id = id++;
		this.name = name;
		const batchSize = options.batchSize;
		if (img.isGlTexture) { this.tex = img }
		else {
			this.tex = Texture(gl);
			this.tex.fromImage(img);
		}
		this.batch = new ArrayBuffer(batchSize * STRIDE * 4);
		this.batchF32 = new Float32Array(this.batch);
		this.batchI32 = new Uint32Array(this.batch);
		this.batchI8 = new Uint8ClampedArray(this.batch);
		this.batchCount = 0;
		this.lockedCount = 0;
		this.spriteBufDirty = true;
		this.batchSize = batchSize;
		this.sheetSize = new Float32Array([img.width, img.height]);
		this.view = new Float32Array([1, 0, 0, 1]);
		this.origin = new Float32Array([0, 0]);		
		this.invView = [1,0,0,1];
		this.dirtyView = false;
		this.sheetSpriteCount = sprites.length;
		var maxW = 0, maxH = 0, i = 0;
		if (typeof sprites[0] === "object") {
			const l = this.sheetLayout = layout(sprites.length);
			for (const spr of sprites) { 
				l[i++] = spr.x / img.width;
				l[i++] = spr.y / img.height;
				maxW = Math.max(maxW, l[i++] = spr.w);
				maxH = Math.max(maxH, l[i++] = spr.h);
			}
		} else { 
		    const s = sprites;
			this.sheetSpriteCount >>= 2;
			const l = this.sheetLayout = layout(sprites.length >> 2);
			while (i < s.length) {
				l[i] = s[i++] / img.width;
				l[i] = s[i++] / img.height;
				maxW = Math.max(maxW, l[i] = s[i++]);
				maxH = Math.max(maxH, l[i] = s[i++]);
			}
		}
		this.maxSpriteDiagonal = (maxW * maxW + maxH * maxH) ** 0.5; 
	}
	Sheet.prototype = {
		pos(idx, x, y) { this.batchF32[idx *= STRIDE] = x; this.batchF32[idx + 1] = y },
		scale(idx, sx, sy = sx) { this.batchF32[(idx *= STRIDE) + 2] = sx; this.batchF32[idx + 3] = sy },
		offset(idx, ox, oy = ox) { this.batchF32[(idx *= STRIDE) + 4] = ox; this.batchF32[idx + 5] = oy },
		rotate(idx, r) { this.batchF32[idx * STRIDE + 6] = r },
		zIndex(idx, z) { this.batchF32[idx * STRIDE + 7] = z < 0 ? 0 : z > 1 ? 1 : z },
		colorRGBA32(idx, RGBA) { this.batchI32[idx * STRIDE + 8] = RGBA },
		red(idx, r) { this.batchI8[(idx * STRIDE + 8) * 4] = r },
		green(idx, r) { this.batchI8[(idx * STRIDE + 8) * 4 + 1] = g },
		blue(idx, r) { this.batchI8[(idx * STRIDE + 8) * 4 + 2] = b },
		alpha(idx, r) { this.batchI8[(idx * STRIDE + 8) * 4 + 3] = a },
		spriteIndex(idx, sprIdx) { this.batchI32[idx * STRIDE + 9] = sprIdx % this.sheetSpriteCount },
		get stride() { return STRIDE },
		get buffers() { return [this.batchF32, this.batchI32, this.batchI8] },	
        lockBuffered() { this.lockedCount = this.batchCount },			
		clear() { 
			this.spriteBufDirty = true;
			this.batchCount = this.lockedCount = 0; 
			this.hasContent = false;
		},
		flush(dirty) {
			this.draw(dirty);
			if (this.batchCount !== this.lockedCount) { this.spriteBufDirty = true }
			this.batchCount = this.lockedCount;
			this.hasContent = this.lockedCount > 0;
		},
		draw(dirty) {
			if (this.batchCount) {
				this.tex.bind();
				gl.uniformMatrix2fv(program.locations.view, false, this.view);			
				gl.uniform2fv(program.locations.origin, this.origin);
				if (program.dirtySheet || program.prevId !== this.id) {
					gl.uniform2fv(program.locations.sheetSize, this.sheetSize);
					gl.uniform4fv(program.locations.sheetLayout, this.sheetLayout, 0, this.sheetSpriteCount * 4);
					program.dirtySheet = false;
					program.prevId = this.id;
				}
				if (this.spriteBufDirty || dirty) {
					gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.sprites);
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchF32.subarray(0, this.batchCount * STRIDE));
					this.spriteBufDirty = false;
				}
				gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this.batchCount);							
			}
		},
		setSprite(bufPos, sprIdx, x, y, scale, offsetX, offsetY, rotate, colorInt32, zIdx) {
			var i = bufPos;
			const bF = this.batchF32, bI = this.batchI32;
			bF[i++] = x;
			bF[i++] = y;
			bF[i++] = scale;
			bF[i++] = scale;
			bF[i++] = offsetX, 
			bF[i++] = offsetY;
			bF[i++] = rotate;
			bF[i++] = zIdx;
			bI[i++] = colorInt32;
			bI[i] = sprIdx % this.sheetSpriteCount;
			this.spriteBufDirty = true;
		},
		addSprite(sprIdx, x, y, scale, offsetX, offsetY, rotate, colorInt32, zIdx) {
			if(this.batchCount < this.batchSize) {
				var i = this.batchCount * STRIDE;
				const bF = this.batchF32, bI = this.batchI32;
				bF[i++] = x;
				bF[i++] = y;
				bF[i++] = scale;
				bF[i++] = scale;
				bF[i++] = offsetX, 
				bF[i++] = offsetY;
				bF[i++] = rotate;
				bF[i++] = zIdx;
				bI[i++] = colorInt32;
				bI[i] = sprIdx % this.sheetSpriteCount;
				this.batchCount ++;
				this.hasContent = true;
				this.spriteBufDirty = true;
				return (this.batchCount - 1) * STRIDE;
			}
		},
		setDefaultView() {
			const v = this.view;
			v[2] = v[1] = this.origin[1] = this.origin[0] = 0;
			v[0] = 2 / renderer.canvas.width;
			v[3] = -2 / renderer.canvas.height;		
			this.dirtyView = true;
		},
		setView(originX, originY, zoom, angle) {
			const v = this.view;
			const w = 2 / renderer.canvas.width;
			const h = -2 / renderer.canvas.height;
			const xdx = Math.cos(angle) * (1 / zoom);
			const xdy = Math.sin(angle) * (1 / zoom);
			this.origin[0] = originX;
			this.origin[1] = originY;
			v[0] = xdx * w;
			v[1] = xdy * h;
			v[2] = -xdy * w;
			v[3] = xdx * h;
			this.dirtyView = true;
		},
		view2World(v, w = {}) {  // v {x y} in px
		    cleanView(this);
			const m = this.view, im = this.invView;
			const w2 = renderer.canvas.width / 2, h2 = renderer.canvas.height / 2;     		
			const x = (v.x - w2) / w2, y = -(v.y - h2) / h2;
			w.x = x * im[0] + y * im[2] + this.origin[0];
		    w.y = x * im[1] + y * im[3] + this.origin[1];	
			return w;
		}			
	};
	const API = {
		init(gl_context, gl_renderer) {
			gl = gl_context;
			renderer = gl_renderer;
			program = gl.createProgram();
			gl.attachShader(program, glUtils.compileShader(gl, options.name + " vertex", vertexSrc, gl.VERTEX_SHADER));
			gl.attachShader(program, glUtils.compileShader(gl, options.name + " fragment", fragmentSrc, gl.FRAGMENT_SHADER));
			glUtils.linkProgram(gl, options.name, program);
			setup();
		},
		getSheet(name) { return sheets[name] },
		addSheet(name, image, sprites) {
			const sheet = sheets[name] = new Sheet(name, image, sprites);
			sheetArray.length = 0;
			sheetArray.push(...Object.values(sheets));
			return sheet;
		},
		use() { 
			if (sheetArray.some(sheet => sheet.hasContent)) {
				renderer.depthModes.lessEqual()
				renderer.blendModes.standard();
				gl.bindVertexArray(vertexBuffer);
				gl.useProgram(program);
				return true;
			}
		},
	};
	return API;
};
