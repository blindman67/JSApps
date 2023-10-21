import {} from "../code/MathExtensions.js";
import {glUtils} from "../code/glUtils.js";

function gradientShader(options = {}){
	options = {
		tlColor: null, // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		trColor: null, // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		blColor: null, // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		brColor: null, // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		precision: "medium", // precision levels low medium or high. Defaults to medium
		...options,
	}
	var vertex = 
	`#version 300 es
	#NAME;
	//#SHOW_IN_CONSOLE;
	${glUtils.precision(options.precision)};	
	in vec2 verts;
	uniform mat2 view;        // is rotate and scale
	uniform vec2 origin;        // x,y
	out vec2 pos;
	void main() {
		pos = view * (verts * 0.5 - origin)  + 0.5;
		gl_Position =  vec4(verts, 1, 1);
	}`;
	const fragment =  
	`#version 300 es
	#NAME;
	//#SHOW_IN_CONSOLE;
	precision mediump float;
    uniform vec4 colors[4];
	uniform vec2 curves;
	in vec2 pos;
	out vec4 pixelCol;
	void main() {
		vec2 p = pow(clamp(pos, 0.0, 1.0), curves);
		pixelCol = mix(
			mix(colors[2], colors[3], p.x),
			mix(colors[0], colors[1], p.x),
			p.y);

	}`;	

	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]);
	const verts = () => new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
	var vertexBuffer, buffers = [], hasContent = false;


	function setup() {
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		const attributes = [
		    glUtils.attributeBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
			glUtils.attributeBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
			glUtils.attributeArray("verts",  2, gl.FLOAT, false),
		];
		glUtils.setupAttributes(gl, attributes, program, 0, buffers)
		program.locations = glUtils.getLocations(gl, program, "colors", "curves", "view","origin"); 
	}
	function close() {
		buffers.forEach(buf => gl.deleteBuffer(buf.glBuffer));
		buffers.length = 0;
		gl.deleteVertexArray(vertexBuffer);
		vertexBuffer = undefined;
	}	

	var gl, renderer, program;	
	function Sheet() {
		this.colors = new Float32Array([0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255]);
		this.curves = new Float32Array([1,1]);
		this.view = new Float32Array([1,0,0,1]);
		this.invView = [1,0,0,1];
		this.origin = new Float32Array([1,0]);
	}
	
	Sheet.prototype = {
		close() {
			delete this.colors;
			delete this.curves;
			delete this.view;
			delete this.origin;	
			delete this.invView;
			this.map = undefined;
		},		
		draw() {
			gl.uniform4fv(program.locations.colors, this.colors, 0, 16);
			gl.uniform2fv(program.locations.curves, this.curves);
			gl.uniform2fv(program.locations.origin, this.origin);
			gl.uniformMatrix2fv(program.locations.view, false, this.view);	
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);	
		},	
		setCurves(x,y) {
			this.curves[0] = x === 0 ? 1 : x < 0 ? (1 / ((-x) ** 2 + 1)) : (x ** 2 + 1);
			this.curves[1] = y === 0 ? 1 : y < 0 ? (1 / ((-y) ** 2 + 1)) : (y ** 2 + 1);
		},
		setColor(cornerIdx, r, g, b, a = 255, scale = 1) {
			cornerIdx <<= 2;
			this.colors[cornerIdx++] = r / 255 * scale;
			this.colors[cornerIdx++] = g / 255 * scale;
			this.colors[cornerIdx++] = b / 255 * scale;
			this.colors[cornerIdx  ] = a / 255;
		},
		getColor(x = this.origin[0], y = this.origin[1], rgba = {}) {  // xy normalised
			var xx = x ** this.curves[0];
			var yy = (1 - y)** this.curves[1];
			xx = xx < 0 ? 0 : xx > 1 ? 1 : xx;
			yy = yy < 0 ? 0 : yy > 1 ? 1 : yy;
			
			
			
			const c = this.colors;
			const r1 = c[0] + (c[4] - c[0]) * xx;
			const g1 = c[1] + (c[5] - c[1]) * xx;
			const b1 = c[2] + (c[6] - c[2]) * xx;
			const a1 = c[3] + (c[7] - c[3]) * xx;
			const r2 = c[8]  + (c[12] - c[8]) * xx;
			const g2 = c[9]  + (c[13] - c[9]) * xx;
			const b2 = c[10] + (c[14] - c[10]) * xx;
			const a2 = c[11] + (c[15] - c[11]) * xx;
			rgba.r = (r1 + (r2 - r1) * yy) * 255 | 0;
			rgba.g = (g1 + (g2 - g1) * yy) * 255 | 0;
			rgba.b = (b1 + (b2 - b1) * yy) * 255 | 0;
			rgba.a = (a1 + (a2 - a1) * yy) * 255 | 0;
			return rgba;
			

			
		},
		setTransform(x,y,scale,angle) {
			const v = this.view, iv = this.invView;
			this.origin[0] = x / scale;
			this.origin[1] = y / scale;
			v[3] = -(v[0] = Math.cos(angle) * scale);
			v[2] = (v[1] = Math.sin(angle) * scale);
			/*const det =  v[0] * v[3] - v[1] * v[2];
			iv[0] =  v[3] / det;
			iv[1] = -v[1] / det;
			iv[2] = -v[2] / det;
			iv[3] =  v[0] / det;	*/		
			
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
			hasContent = true;
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
		close() {
			API.sheet.close()
			gl.deleteProgram(program);
			API.source = {};
			program = undefined;
			renderer = undefined;
			close();
			gl = undefined;
			hasContent = false;
		},		
		utils: {

		},
	};
	return API;
};

export {gradientShader};
