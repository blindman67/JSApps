import {} from "../../utils/MathExtensions.jsm";
import {glUtils} from "../glUtils.jsm";
import {Texture} from "../texture.jsm";

export {sphereShader};

function sphereShader(options = {}){
	options = {
		alphaCut: 0,
		name: "Sphere",
		...options,
	};

	const vertexSrc = `#version 300 es
		in vec2 vert;
		uniform mat2 view;  // View 2D scale rotate matrix			
		uniform vec2 origin; 
		uniform float zIdx;
		void main() {
			loc = view * (vert - origin);
			gl_Position =  vec4(loc, zIdx, 1);
		}`;
	const fragmentSrc = `#version 300 es
		precision mediump float;
		#define alphaCut ${("" + options.alphaCut).padEnd(3, "0.0")}
		uniform sampler2D tex;
		uniform vec4 color;
		uniform float zRotate;
		uniform vec2 textSize;			
		out vec4 pixel;
		void main() {
			pixel = texture(tex, spr) * col;
			if (pixel.a <= alphaCut) { discard; }
		}`;	

 
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]); 
	const verts = () => new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
	const sheets = {}, sheetArray = [], buffers = {};
	var gl, renderer, program, vertexBuffer, id = 0;
	function cleanView(sheet) { sheet.dirtyView && (Math.mat2x2Inv(sheet.view, sheet.invView), sheet.dirtyView = false) };
	
	function setup() {
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		glUtils.setupAttributes(gl, [
				glUtils.attBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
				glUtils.attBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
			],
			program, 0, buffers
		);
		program.locations = glUtils.getLocations(gl, program, "tex", "textSize", "zRotate", "view", "origin");   
		program.dirtySheet = true;
	}
	function Sheet(name, img, sharedView, sharedOrigin) {
		this.id = id++;
		this.name = name;
		this.tex = Texture(gl);
		this.tex.fromImage(img);
		this.sheetSize = new Float32Array([img.width, img.height]);
		this.view = sharedView ? sharedView : new Float32Array([1, 0, 0, 1]);
		this.origin = sharedOrigin ? sharedOrigin : new Float32Array([0, 0]);		
	}
	Sheet.prototype = {
		draw(dirty) {
			if (this.batchCount) {
				this.tex.bind();
				gl.uniformMatrix2fv(program.locations.view, false, this.view);			
				gl.uniform2fv(program.locations.origin, this.origin);
				gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE);							
			}
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
