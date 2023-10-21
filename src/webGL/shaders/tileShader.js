import {Texture} from "../code/texture.js";
import {glUtils} from "../code/glUtils.js";

const BIT_VALS = [
	[[0xFF,0x00,0],[0xFFFF,0x0000,0], [0xFFFFFFFF,0x000000,0]],
	[[0x7F,0x80,7],[0x7FFF,0x8000,15],[0x7FFFFFFF,0x800000,31]],
	[[0x3F,0xC0,6],[0x3FFF,0xC000,14],[0x3FFFFFFF,0xC00000,30]],
	[[0x1F,0xE0,5],[0x1FFF,0xE000,13],[0x1FFFFFFF,0xE00000,29]],
	[[0x0F,0xF0,5],[0x0FFF,0xF000,13],[0x0FFFFFFF,0xF00000,28]],
	[[],		   [0x07FF,0xF800,12],[0x07FFFFFF,0xF80000,27]],
	[[],           [0x03FF,0xFC00,11],[0x03FFFFFF,0xFC0000,26]],
	[[],           [0x01FF,0xFE00,10],[0x01FFFFFF,0xFE0000,25]],
	[[],           [0x00FF,0xFF00, 9],[0x00FFFFFF,0xFF0000,24]],		
];
const FX_SLOTS = [0,2,4,8,16,32,64]; // count of FX uniform array slots

const intPrecision = {
	"8": {qualifier : "lowp", bitVal: 0,},
	"16": {qualifier : "mediump", bitVal: 1},
	"32": {qualifier : "highp",bitVal: 2},
};

function tileShader(options = {}){
	options = {
		alphaCut: 0,
		useDepth: false,
		useColor: false,
		mapBits: 8,  // valid sizes 8,16,32
		fxTiles: false, 
		moveBits: 0, // number of bits used for inner move FX
		indexBits: 0, // sets bits of map to change tile index offset FX
		nullTileIdx: 0, // set tile index that is empty
		...options,
	};
	const FX_BITS_COUNT = options.fxTiles ? options.moveBits + options.indexBits : 0;
	if(!(options.mapBits === 8 || options.mapBits === 16 || options.mapBits === 32)) {
		console.warn("Bad mapBits value `" + options.mapBits + "' using default value '16'");
		options.mapBits = 16;
	}
	const MAX_TILES = 2 ** options.mapBits;

	const prec = intPrecision[options.mapBits];
	const FX_MASK = BIT_VALS[prec.bitVal][FX_BITS_COUNT][0];
	const FX_BITS = BIT_VALS[prec.bitVal][FX_BITS_COUNT][1]
	const FX_SHIFT = BIT_VALS[prec.bitVal][FX_BITS_COUNT][2];
	const FX_INDEX_MASK = BIT_VALS[prec.bitVal][options.indexBits][1] >> options.moveBits;
	const FX_MOVE_MASK = BIT_VALS[prec.bitVal][options.moveBits][1];
	const MOVE_SLOTS = FX_SLOTS[options.moveBits];
	const INDEX_SLOTS = FX_SLOTS[options.indexBits];
	
	
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]);
	const verts = () => new Float32Array([1, -1, -1, -1, -1, 1, 1, 1]);
	const sheets = {}, sheetArray = [];
	const maps = {}, mapArray = [];
	var gl, renderer, program, hasContent = false, vertexBuffer, buffers = [];
	
	function createShaders() {
	
		var fxMoveUniform = options.moveBits ? `uniform vec2 moveFX[${MOVE_SLOTS}];` : "";
		var fxIndexUniform = options.indexBits ? `uniform int indexFX[${INDEX_SLOTS}];` : "";
		const alphaCut = options.alphaCut ? `if (pixelCol.a < ${(options.alphaCut / 255).toFixed(3)}) { discard; }` : "";
		const vertex = 
`    #version 300 es
	#NAME;
	#SHOW_IN_CONSOLE;
	precision mediump float;	
	in vec2 verts;            // coords in as corners -1-1, to 1,1.
	uniform mat2 view;        // if rotate and scale
	uniform vec4 originSize;  // map x, y;  display width, height [x,y,width,height] in pixels
	uniform vec4 sizeMapTile; // map width, height, tile w, h [width,height,w,h] [in tiles, in pixels]
	${options.useDepth ? "uniform float zIdx;" : ""}
	out vec2 mapPos;
	void main() {
		vec2 mapScale = (originSize.zw / sizeMapTile.zw) * 0.5;  // in tiles
		vec2 mapOrigin = originSize.xy / sizeMapTile.zw;         // in tiles
		mapPos = view * (verts * mapScale) + mapOrigin;          // in tiles
		gl_Position =  vec4(verts.xy, ${options.useDepth ? "zIdx" : "1"}, 1);                     // display corners		
	}`;

		var fragment;
		if(!options.fxTiles) {
			fragment =
	`#version 300 es
	#NAME;	
	#SHOW_IN_CONSOLE;
	precision mediump float;
	precision ${prec.qualifier} int;
	precision ${prec.qualifier} usampler2D;

	uniform sampler2D sheet2D;
	uniform usampler2D map2D;
	uniform vec4 sizeMapTile; // map width, height, tile w, h [width,height,w,h] [in tiles, in pixels]
	uniform vec4 sheet;       // sheet2D width, height, w, h [width,height,w,h] [in tiles, in pixels]
	${options.useColor ? "uniform vec4 col;" : ""}

	const uint nullTile = uint(${options.nullTileIdx});
	in vec2 mapPos;
	out vec4 pixelCol;
	void main() {
		uint tileIdx = texture(map2D, floor(mapPos) / sizeMapTile.xy).r;
		if (tileIdx == nullTile) { discard; return; }
		uint stride = uint(sheet.x);
		vec2 tilePos = vec2(tileIdx % stride, tileIdx / stride) + fract(mapPos);
		pixelCol = texture(sheet2D, tilePos / sheet.xy);
		${options.useColor ? 
		    "if (col.a != 0.0) { pixelCol = vec4(mix(pixelCol.rgb,col.rgb,col.a), pixelCol.a); }" : 
			""
		}
		${alphaCut}
	}`;			
		
		} else {
			fragment =  
	`#version 300 es
	#NAME;	
	#SHOW_IN_CONSOLE;
	precision mediump float;
	precision ${prec.qualifier} int;
	precision ${prec.qualifier} usampler2D;
	uniform sampler2D sheet2D;
	uniform usampler2D map2D;
	uniform vec4 sizeMapTile; // map width, height, tile w, h [width,height,w,h] [in tiles, in pixels]
	uniform vec4 sheet;       // sheet2D width, height, w, h [width,height,w,h] [in tiles, in pixels]
	${options.useColor ? "uniform vec4 col;" : ""}
	const uint mask = uint(${FX_MASK});
	${fxMoveUniform}
	${fxIndexUniform}
	const uint fxShiftB = uint(${options.fxIndexBits});
	const uint fxShiftA = uint(${FX_SHIFT});
	const uint fxMask = uint(${FX_SLOTS[options.indexBits]});
	const uint nullTile = uint(${options.nullTileIdx});
	in vec2 mapPos;
	out vec4 pixelCol;
	void main() {
		uint tileIdx = texture(map2D, floor(mapPos) / sizeMapTile.xy).r;
		uint fx = tileIdx >> fxShiftA;
		tileIdx = (tileIdx & mask) + indexFX[fx & fxMask];
		if (tileIdx == nullTile) { discard; return; }
		uint stride = uint(sheet.x);
		vec2 tilePos = vec2(tileIdx % stride, tileIdx / stride) + fract(mapPos + moveFX[fx >> fxShiftB]);
		pixelCol = texture(sheet2D, tilePos / sheet.xy);
		${options.useColor ? 
		    "if (col.a != 0.0) { pixelCol = vec4(mix(pixelCol.rgb,col.rgb,col.a), pixelCol.a); }" : 
			""
		}	
		${alphaCut}
	}`;	
		}
		return [vertex, fragment];
	}
	
	const [vertex, fragment] = createShaders();

	function setup() {
		vertexBuffer = gl.createVertexArray();
		gl.bindVertexArray(vertexBuffer);
		const attributes = [
		    glUtils.attributeBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
			glUtils.attributeBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
			glUtils.attributeArray("verts",  2, gl.FLOAT, false),
		];
		glUtils.setupAttributes(gl, attributes, program, 0, buffers);
		program.locations = glUtils.getLocations(gl, program, "map2D", "sheet2D", "view", "originSize", "sizeMapTile","sheet","moveFX","indexFX","zIdx","col"); 
	}
	function close() {
		buffers.forEach(buf => gl.deleteBuffer(buf.glBuffer));
		buffers.length = 0;
		gl.deleteVertexArray(vertexBuffer);
		vertexBuffer = undefined;
		
	}

    function TileMap(name, width, height) {
		this.name = name;
		this.width = Math.floor(width);
		this.height = Math.floor(height);
		this.bitSize = options.mapBits;
		if (options.mapBits === 32) {
			this.buffer = new Uint32Array(width * height);
			this.types = [gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT];
		} else if (options.mapBits === 16) {
			this.buffer = new Uint16Array(width * height);
			this.types = [gl.R16UI, gl.RED_INTEGER, gl.UNSIGNED_SHORT];
		} else {			
			this.buffer = new Uint8Array(width * height);
			this.types = [gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE];
		}
	}
	TileMap.prototype = {
		close() {
			if(this.texture) {
				this.texture.destroy();	
				delete this.texture;
			}				
			delete this.buffer;
			this.types = undefined;
		},		
		eachRect(cb, x = 0, y = 0, w = this.width, h = this.height) {
			var iy,ix;
			x = x < 0 ? 0 : x >= this.width ? this.width : x;
			y = y < 0 ? 0 : y >= this.height ? this.height : y;
			w = x + w > this.width ? this.width - x : w;
			h = y + h > this.height ? this.height - y : h;
			for (iy = 0; iy < h; iy++) {
				const idx = (y + iy) * this.width;
				for (ix = 0; ix < w; ix++) {
					var i = idx + ix + x;
					const tVal =this.buffer[i] & FX_MASK;
					const tFX = this.buffer[i] & (FX_MOVE_MASK + FX_INDEX_MASK);
					const fxM = (this.buffer[i] & FX_MOVE_MASK) >> (FX_BITS_COUNT + options.indexBits);
					const fxI = (this.buffer[i] & FX_INDEX_MASK) >> FX_BITS_COUNT;
					const val = cb(this.buffer[i], i, ix, iy, x + ix, y + iy, fxM, fxI);
					this.buffer[i] = val < 0 ? this.buffer[i] : (val & FX_MASK) + tFX;
				}
			}			
		},
		getTile(x,y,desc = {}) {
			if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
				desc.out = true;
				return;
			}
			desc.out = false;
			const idx = desc.idx = x + y * this.width;
			const raw = desc.raw = this.buffer[idx];
			desc.tile = raw & FX_MASK;
			desc.moveFX = (raw & FX_MOVE_MASK) >> (FX_BITS_COUNT + options.indexBits);
			desc.indexFX = (raw & FX_INDEX_MASK) >> FX_BITS_COUNT;
			
		},
		setMoveFXIdx(x,y,idx)  {
			const bIdx = x + y * this.width;
			const val = this.buffer[bIdx] & (FX_INDEX_MASK | FX_MASK);
			this.buffer[bIdx] = val | ((idx << (FX_BITS_COUNT + options.indexBits)) & FX_MOVE_MASK);
		},
		setIndexFXIdx(x,y,idx)  {
			const bIdx = x + y * this.width;
			const val = this.buffer[bIdx] & (FX_MOVE_MASK | FX_MASK);
			this.buffer[bIdx] = val | ((idx << FX_BITS_COUNT) & FX_INDEX_MASK);
		},
		randomize( min = 0, max = MAX_TILES, x, y, w , h) { this.eachRect(() => Math.rand(min, max), x, y, w, h) },
		test() { this.eachRect((val,idx) => idx % MAX_TILES) },
		fillRectRandom(tiles, x, y, w, h, tileOffset = 0) {
			this.eachRect((val, idx, ix, iy, xx, yy) => {
				return Math.randItem(tiles)+ tileOffset;
			}, x, y, w, h);
		},
			
		fillRect(tiles, x, y, w, h, tileOffset = 0) {
			if(Array.isArray(tiles)) {
				this.eachRect((val, idx, ix, iy, xx, yy) => {
					if (xx === x) {
						if (yy === y) { return tiles[0] + tileOffset }
						if (yy === y + h - 1) { return tiles[6] + tileOffset }
						return tiles[3] + tileOffset;
					}
					if (y === yy) {
						if (xx === x + w - 1) { return tiles[2] + tileOffset }
						return tiles[1] + tileOffset;
					}
					if (yy === y + h - 1) {
						if (xx === x + w - 1) { return tiles[8] + tileOffset }
						return tiles[7] + tileOffset;
					}
					if (xx === x + w - 1) { return tiles[5] + tileOffset }
					return tiles[4] + tileOffset;
					
				}, x, y, w, h);
				return;
			} 
			this.eachRect((val,idx) => tiles);
		},	
	};	
	function Sheet(name, tileImage, tileWidth, tileHeight, map) {
		this.name = name;
		this.tileTex = Texture(gl, "linearRepeat");//"nearestRepeat");//"linearNearest");
		this.tileTex.fromImage(tileImage);
		this.sizeMapTile = new Float32Array([ map.width, map.height, tileWidth, tileHeight]);
		this.sheet = new Float32Array([tileImage.width / tileWidth, tileImage.height / tileHeight, tileImage.width, tileImage.height]);
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		if(options.fxTiles) {
			if (options.moveBits) {
				this.moveFX = new Float32Array(MOVE_SLOTS * 2);
			}
			if (options.indexBits) {
				if (options.mapBits === 32) { this.indexFX = new Int32Array(INDEX_SLOTS) }
				else if (options.mapBits === 16) { this.indexFX = new Int16Array(INDEX_SLOTS) }
				else { this.indexFX = new Int8Array(INDEX_SLOTS) }			
			}
		}
		this.view = new Float32Array([1,0,0,1]);
		this.originSize = new Float32Array([0,0,300,150]);
		this.zIdx = new Float32Array([0]);
		this.color = new Float32Array([0,0,0,0]);
		
		this.setMap(map);
	}
	Sheet.prototype = {
		close() {
			this.tileTex.destroy();
			delete this.tileTex;
			delete this.sizeMapTile;
			delete this.sheet;
			delete this.color;
			delete this.moveFX;
			delete this.indexFX;
			delete this.view;
			delete this.originSize;	
			delete this.zIdx;
			this.map = undefined;
		},
		setMap(map) {
			this.map = map;
			this.sizeMapTile[0] = map.width;
			this.sizeMapTile[1] = map.height;
			this.mapWidth = map.width * this.tileWidth;
			this.mapHeight = map.height * this.tileHeight;	
			if(!map.texture) {
				map.texture = Texture(gl);
				map.texture.fromArray(map.buffer, map.width, map.height, ...map.types);
			}				
		},
		draw() {
			this.tileTex.bind(0);
			this.map.texture.bind(1);
			gl.uniformMatrix2fv(program.locations.view, false, this.view);			
			gl.uniform4fv(program.locations.originSize, this.originSize);	
			gl.uniform4fv(program.locations.sizeMapTile, this.sizeMapTile);
			gl.uniform4fv(program.locations.sheet, this.sheet);
			options.useDepth && gl.uniform1fv(program.locations.zIdx, this.zIdx);
			options.useColor && gl.uniform4fv(program.locations.col, this.color);
			if (options.fxTiles) {
				options.moveBits && gl.uniform2fv(program.locations.moveFX, this.moveFX, 0, MOVE_SLOTS * 2);
				options.moveBits && gl.uniform1iv(program.locations.indexFX, this.indexFX, 0, INDEX_SLOTS);
			}
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);					
		},
		setMoveFX(idx, x, y) {
			idx = (idx % MOVE_SLOTS) << 1;
			this.moveFX[idx] = x;
			this.moveFX[idx+1] = y;
		},
		setIndexFX(idx, offset) {
			idx %= INDEX_SLOTS;
			this.indexFX[idx] = offset;
		},		
		setColorMix(mix) { this.color[3] = mix < 0 ? 0 : mix > 1 ? 1 : mix },
		setColor(r,g,b, mix) {
			this.color[0] = r / 255;
			this.color[1] = g / 255;
			this.color[2] = b / 255;
			this.color[3] = mix < 0 ? 0 : mix > 1 ? 1 : mix;
		},
		setDepth(depth) { this.zIdx[0] = depth },
		setTransform(ox, oy, scale, angle) {
			const v = this.view;
			const o = this.originSize;

			o[2] = renderer.canvas.width;
			o[3] = renderer.canvas.height;
			if(angle === 0 && scale % 1 === 0) {  // attempt to remove artifacts due to neighboring tiles bleading 
				o[0] = Math.floor(ox) + ((renderer.canvas.width / scale)  % 2 ? 0.5 : 0);
				o[1] = Math.floor(oy) + ((renderer.canvas.height / scale) % 2 ? 0.5 : 0);			
				v[3] = -(v[0] = scale);
				v[2] = v[1] = 0;
				
			} else {
				o[0] = Math.floor(ox);
				o[1] = Math.floor(oy);			
				v[3] = -(v[0] = Math.cos(angle) * scale);
				v[2] = (v[1] = Math.sin(angle) * scale);
			}
		},
	};
	if(!options.fxTiles) {
		Sheet.prototype.setMoveFX = function(){};
		Sheet.prototype.setIndexFX = function(){};
	}
	const API = {
		source: {fragment,vertex},
		init(gl_context, gl_renderer, shadersProgram) {
			gl = gl_context;
			renderer = gl_renderer;
			program = shadersProgram;
			setup();
		},
		getSheet(name) { return sheets[name] },
		getMap(name) { return maps[name] },
		addMap(name, mapWidth, mapHeight) {
			const tileMap = maps[name] = new TileMap(name, mapWidth, mapHeight);
			mapArray.length = 0;
			mapArray.push(...Object.values(maps));
			return tileMap;
		},
		addSheet(name, tileImage, tileWidth, tileHeight, map) {
			map = typeof map !== "string" ? map : maps[map];
			if (map instanceof TileMap) {
				const sheet = sheets[name] = new Sheet(name, tileImage, tileWidth, tileHeight, map);
				sheetArray.length = 0;
				sheetArray.push(...Object.values(sheets));
				hasContent = true;
				return sheet;
			}
			console.error("Could not create tile sheet `" + name + "` as map is not a tileMap");
		},
		close() {
			sheetArray.forEach(sheet => {
				delete sheets[sheet.name];
				sheet.close();
			});			
			mapArray.forEach(map => {
				delete maps[map.name];
				map.close();
			});
			mapArray.length = sheetArray.length = 0;
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
				gl.useProgram(program);
				glUtils.depthModes.setState(gl, options.useDepth);
				glUtils.blendModes.standard(gl);
				gl.bindVertexArray(vertexBuffer);
				gl.uniform1i(program.locations.sheet2D, 0);
				gl.uniform1i(program.locations.map2D, 1);					
				return true;
			}
		},
	};
	return API;
};

export {tileShader};
