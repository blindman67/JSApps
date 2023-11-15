import {} from "../../utils/MathExtensions.js";
import {glUtils} from "../glUtils.js";
import {Texture} from "../Texture.js";

export {flatShader};

function flatShader(options = {}){
	options = {
		alphaCut: 0,
		name: "Flat",
		...options,
	};

	const vertexSrc = `#version 300 es
		in vec2 verts;
		uniform float zIdx;
		uniform vec2 scale;
		out vec2 texCoord;
		void main() { 
			texCoord = verts * scale + 0.5;
			gl_Position =  vec4(verts, zIdx, 1); 
		}`;
	const fragmentSrc = `#version 300 es
		precision mediump float;
		#define alphaCut ${("" + options.alphaCut).padEnd(3, ".0")}
		uniform sampler2D tex;
		uniform vec4 color;
		in vec2 texCoord;
		out vec4 pixel;
		void main() {
			pixel = texture(tex, texCoord) * color;
			if (pixel.a <= alphaCut) { discard; }
		}`;	

 
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]); 
	const verts = () => new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
	
	
	const sheets = {};
	var gl, renderer, program, vertexBuffer;
	
	function setup() {
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		glUtils.setupAttributes(gl, [
				glUtils.attBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
				glUtils.attBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
				glUtils.attArray("verts",  2, gl.FLOAT, false),
			],
			program, 0, {}
		);
		program.locations = glUtils.getLocations(gl, program,  "tex", "zIdx", "scale", "color");   
	}
	function Sheet(name, img) {
		this.name = name;
		if (img.isGlTexture) { this.tex = img }
		else {
			this.tex = Texture(gl);
			this.tex.fromImage(img);
		}
		this.scale = new Float32Array([0.5, -0.5]);
		this.zIdx = new Float32Array([1]);
		this.color = new Float32Array([1,1,1,1]);
	}
	Sheet.prototype = {
		set scaleX(sx) { this.scale[0] = sx / 2 },
		set scaleY(sy) { this.scale[1] = sy / 2 },
		get scaleX() { return this.scale[0] * 2 },
		get scaleY() { return this.scale[1] * 2 },
		set zIndex(v) { this.zIdx[0] = v },
		get zIndex() { return this.zIdx[0] },
		set colorRGBA(RGBA) {
			this.color[0] = RGBA.r !== undefined ? RGBA.r : this.color[0];
			this.color[1] = RGBA.g !== undefined ? RGBA.g : this.color[1];
			this.color[2] = RGBA.b !== undefined ? RGBA.b : this.color[2];
			this.color[3] = RGBA.a !== undefined ? RGBA.a : this.color[3];
		},
		set colorI32(vI32) {
			this.color[0] = (vI32 & 0xFF) / 0xFF;
			this.color[1] = ((vI32 >> 8) & 0xFF) / 0xFF;
			this.color[2] = ((vI32 >> 16) & 0xFF) / 0xFF;
			this.color[3] = ((vI32 >> 24) & 0xFF) / 0xFF;
		},
		draw() {
			this.tex.bind();
			gl.uniform4fv(program.locations.color, this.color);			
			gl.uniform2fv(program.locations.scale, this.scale);			
			gl.uniform1fv(program.locations.zIdx, this.zIdx);
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);							
		},		
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
		addSheet(name, image) { return sheets[name] = new Sheet(name, image) },
		use() { 
			renderer.depthModes.lessEqual()
			renderer.blendModes.standard();
			gl.useProgram(program);
			gl.bindVertexArray(vertexBuffer);
			return true;
		},
	};
	return API;
};
