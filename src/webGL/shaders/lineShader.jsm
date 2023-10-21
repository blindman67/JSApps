import {} from "../../utils/MathExtensions.jsm";
import {glUtils} from "../glUtils.jsm";
import {Vec2} from "../../Vec2.jsm";
import {Mat2} from "../../Mat2.jsm";


export {lineShader};

function lineShader(options = {}){
	options = {name: "Lines", maxSegments: 256 * 256, ...options};
	const vertexSrc = `#version 300 es
		in vec2 points;
		in vec2 pA;
		in uint colorA;
		in vec2 pB;
		in uint colorB;
		
		uniform vec2 display; // width height
		out vec4 color;
		void main() {
			uint c = points.x == 0.0 ? colorA : colorB;
			color = vec4(float(c & uint(255)) / 255.0, float((c >> 8) & uint(255)) / 255.0, float((c >> 16) & uint(255)) / 255.0, float((c >> 24) & uint(255)) / 255.0);
			gl_Position = points.x == 0.0 ? vec4(pA.xy / display, 1, 1) : vec4(pB.xy  / display, 1, 1);				
		}`;
	const fragmentSrc = `#version 300 es
		precision mediump float;
		#define minAlpha 1.0 / 255.0
		out vec4 pixel;
		in vec4 color;
		void main() {
			if (color.a < minAlpha) { discard; }
			else { pixel = color; }
		}`;	
 
	const STRIDE = 2 + 1;
	const points = () => new Float32Array(options.maxSegments * STRIDE);
	//const indices = () => new Uint8Array([0,1,2,0,2,3]); 
	const indices = () => new Uint8Array([0, 1]); 
	//const verts = () => new Float32Array([0, 0.5, 1, 0.5, 1, -0.5, 0, -0.5]);
	const verts = () => new Float32Array([0, 0, 1, 1]);
	
	const sheets = {};
	const wV2 = new Vec2(); // working vector 2
	var gl, renderer, program, vertexBuffer, buffers = {};
	
	
	function setup() {
		program = glUtils.createProgram(gl, vertexSrc, fragmentSrc, options.name);		
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		glUtils.setupAttributes(gl, [
				glUtils.attBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
				glUtils.attBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
				glUtils.attArray("points",  2, gl.FLOAT),
				glUtils.attBuf(gl.ARRAY_BUFFER, points(), gl.DYNAMIC_DRAW, "points"), 
				glUtils.attArrayPtr("pA",       2, gl.FLOAT),
				glUtils.attArrayPtr("colorA",   1, gl.UNSIGNED_INT, false),
				glUtils.attArrayPtr("pB",       2, gl.FLOAT),
				glUtils.attArrayPtr("colorB",   1, gl.UNSIGNED_INT, false),
				//glUtils.attArrayPtr("pTo",       2, gl.FLOAT),
			],
			program, STRIDE * 4, buffers		
		);
		program.locations = glUtils.getLocations(gl, program, "display");   
	}
	function Sheet(name, color = 0xFFFFFFFF) {
		this.name = name;
		this.points = new Float32Array(options.maxSegments * STRIDE);
		this.pointsI32 = new Uint32Array(this.points.buffer);
		this.display = new Float32Array([gl.viewport.width / 2, gl.viewport.height]);
		this.pointCount = 0;
		this.prevBufPos = 0;
		this.closed = true;
		this.ended = true;
		this.lineStart = 0;
		this.lineDirty = false;
		this.currentTransform = new Mat2();
	}
	Sheet.prototype = {
		clear() {
			this.pointCount = 0;
			this.ended = this.closed = true;
			this.lineStart = 0;
			this.prevBufPos = 0;
		},
		close() {
			if(this.pointCount && !this.closed) {
				const idx = this.lineStart * STRIDE;
				this.lineTo(this.points[idx], this.points[idx + 1], this.pointsI32[idx + 2]);
				this.closed = true;
				this.lineDirty = true;

			}
		},

		circle(x, y, r, color) {
			r = Math.abs(r);
			const step = 1 / (r / 2);
			const end = Math.TAU - step / 2;
			var a;
			this.moveTo(x + r, y, color);
			for(a = step; a < end; a += step) {
				this.lineTo(Math.cos(a) * r + x, Math.sin(a) * r + y, color);
			}
			this.close();
			
		},
		rect(x, y, w, h, color) {
			this.moveTo(x, y, color);
			this.lineTo(x + w, y, color);
			this.lineTo(x + w, y + h, color);
			this.lineTo(x, y + h, color);
			this.close()
		},
		end(x, y, color) {
			if(this.pointCount && !this.ended) {
				var idx = this.pointCount * STRIDE;
				this.points[idx] = this.points[idx - 3];
				this.points[idx + 1] = this.points[idx - 2];
				this.pointsI32[idx + 2] = this.pointsI32[idx - 1] & 0x00FFFFFF;
				this.pointCount += 1;
				this.currentTransform.transformVec2(wV2.init(x,y), wV2);
				idx = this.pointCount * STRIDE;
				this.points[idx ] = wV2.x;
				this.points[idx + 1] = wV2.y;
				this.pointsI32[idx + 2] = color & 0x00FFFFFF;
				this.pointCount += 1;
				this.ended = true;
				this.prevBufPos -= STRIDE * 4;
				this.lineDirty = true;
			}			
		},
		moveTo(x, y, color) {
			this.end(x, y, color);
			this.lineStart = this.pointCount;
			this.lineTo(x, y, color);
		},
		lineTo(x, y, color) {
			this.currentTransform.transformVec2(wV2.init(x,y), wV2);
			const idx = this.pointCount * STRIDE;
			this.points[idx] = wV2.x;
			this.points[idx + 1] = wV2.y;
			this.pointsI32[idx + 2] = color;
			this.points[idx + 3] = wV2.x;
			this.points[idx + 4] = wV2.y;
			this.pointsI32[idx + 5] = color;
		
			this.pointCount += 1;
			this.closed = false;
			this.ended = false;
			this.lineDirty = true;
		},
			
		
		draw(dirty) {
			if (this.pointCount) {
				//this.aspect[0] = gl.viewport.aspect;
				//gl.uniform1fv(program.locations.aspect, this.aspect);			
				this.display[0] = gl.viewport.width / 2;
				this.display[1] = -gl.viewport.height / 2;
				gl.uniform2fv(program.locations.display, this.display);			
				if (this.lineDirty || dirty) {
					gl.bindBuffer(gl.ARRAY_BUFFER,  buffers.points);
					gl.bufferSubData(gl.ARRAY_BUFFER, this.prevBufPos * 4, this.points.subarray(this.prevBufPos, (this.pointCount + 1) * STRIDE));
					this.lineDirty = false;
					this.prevBufPos = (this.pointCount + 1) * STRIDE;
				}				
				gl.drawElementsInstanced(gl.LINES, 2, gl.UNSIGNED_BYTE, 0, this.pointCount);							
			}
		},	
	};
	const API = {
		init(gl_context, gl_renderer) {
			gl = gl_context;
			renderer = gl_renderer;
			setup();
		},
		getSheet(name) { return sheets[name] },
		addSheet(name, cube) { return sheets[name] = new Sheet(name, cube) },
		use() { 
			renderer.depthModes.off()
			renderer.blendModes.standard();
			gl.useProgram(program);
			gl.bindVertexArray(vertexBuffer);
			return true;
		},
	};
	return API;
};
