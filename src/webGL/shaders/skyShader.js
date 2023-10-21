import {} from "../../utils/MathExtensions.js";
import {glUtils} from "../glUtils.js";
import {TextureCube} from "../texture.js";

export {skyShader};

function skyShader(options = {}){
	options = {name: "SkyBox", ...options};
	const vertexSrc = `#version 300 es
		in vec3 verts;
		uniform vec2 fov;
		uniform vec2 forward;
		out vec3 colPos;
		void main() {
            vec2 yaw = vec2(cos(forward.x), sin(forward.x));
            vec2 pitch = vec2(cos(forward.y), sin(forward.y));
			float z = verts.x * yaw.y + verts.z * yaw.x;
			float zz = (verts.y * pitch.y + z * pitch.x) * 0.5;
			gl_Position = vec4((verts.x * yaw.x - verts.z * yaw.y) * fov.x, (verts.y * pitch.x - z * pitch.y) * fov.y, zz, zz);			
		    colPos = verts;
		}`;
	const fragmentSrc = `#version 300 es
		precision mediump float;
		uniform float curvePower;
		uniform vec4 colors[8];
		in vec3 colPos;
		out vec4 pixel;
		void main() {
			vec3 c = normalize(colPos) * 0.5 + 0.5;
			float y = pow(c.y , curvePower);
			y = y / (y + pow((1.0 - c.y), curvePower));
			vec4 col = mix(
				mix(mix(colors[0], colors[1], c.x), mix(colors[3], colors[2], c.x), y),
				mix(mix(colors[4], colors[5], c.x), mix(colors[7], colors[6], c.x), y),
				c.z
			);
			pixel = vec4(sqrt(vec3(col.rgb)) / 255.0, col.a);
		}`;	
 
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3,  1, 4, 7, 1, 7, 2,  4, 5, 6, 4, 6, 7,  5, 0, 3, 5, 3, 6,  0, 1, 4, 0, 4, 5,  3, 2, 7, 3, 7, 6]); 
	const verts = () => new Float32Array([ -1,-1,1,  1,-1,1,  1,1,1,  -1,1,1,  1,-1,-1,  -1,-1,-1, -1,1,-1,  1, 1, -1]);
	const vertCount = 8;
	const sheets = {};
	var gl, renderer, program, vertexBuffer;
	
	function setColorI32(I32, buf, idx = 0) {
		idx <<= 2;
		buf[idx    ] = (I32 & 0xFF) ** 2;
		buf[idx + 1] = ((I32 >> 8) & 0xFF) ** 2;
		buf[idx + 2] = ((I32 >> 16) & 0xFF) ** 2;
		buf[idx + 3] = ((I32 >> 24) & 0xFF) / 0xFF;
	}
	function setColorRGBA(RGBA, buf, idx = 0) {
		idx <<= 2;
		buf[idx    ] = ((RGBA.r !== undefined ? RGBA.r : buf[idx]) * 0xFF) ** 2;
		buf[idx + 1] = ((RGBA.g !== undefined ? RGBA.g : buf[idx + 1]) * 0xFF) ** 2;
		buf[idx + 2] = ((RGBA.b !== undefined ? RGBA.b : buf[idx + 2]) * 0xFF) ** 2;
		buf[idx + 3] = RGBA.a !== undefined ? RGBA.a : buf[idx + 3];
	}
	function setup() {
		program = glUtils.createProgram(gl, vertexSrc, fragmentSrc, options.name);		
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		glUtils.setupAttributes(gl, [
				glUtils.attBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
				glUtils.attBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
				glUtils.attArray("verts",  3, gl.FLOAT, false),
			], program, 0, {}
		);
		program.locations = glUtils.getLocations(gl, program, "fov", "forward", "curvePower", "colors");   
	}
	function Sheet(name) {
		this.name = name;
		this.forward = new Float32Array([0, 0]);
		this._fov = new Float32Array(2);
		this.fov = Math.PI45;
		this.power = 8;
		this.colors = new Float32Array([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, ]);
		this.dirtyColors = true;
	}
		
	Sheet.prototype = {
		set fov(ang) { 
		    this._fovAngle = ang;
			this._fov[1] =  Math.tan(Math.PI90 - 0.5 * ang);
		},		
		set yaw(y) { this.forward[0] = y },
		set pitch(p) { this.forward[1] = p },
		get fov() { return this._fovAngle },
		get yaw() { return this.forward[0] },
		get pitch() { return this.forward[1] },
		set curvePower(pow) { this.power = pow },
		get curvePower() { return this.power },
		setVertColorsI32(I32Array) { 
		    var i = 0;
			while (i < vertCount && i < I32Array.length) {
				setColorI32(I32Array[i], this.colors, i ++);
			}
			this.dirtyColors = true;
		},
		setVertColorI32(I32, idx) { setColorI32(I32, this.colors, idx); this.dirtyColors = true },
		setVertColorRGBA(RGBA, idx) { setColorRGBA(RGBA, this.colors, idx); this.dirtyColors = true },
		BOTTOM: {
			FRONT: {
				LEFT: 0,
				RIGHT: 1,
			},
			BACK: {
				LEFT: 4,
				RIGHT: 5,
			},
		},
		TOP:  {
			FRONT: {
				LEFT: 3,
				RIGHT: 2,
			},
			BACK: {
				LEFT: 7,
				RIGHT: 6,
			},
		},
		draw() {
			this._fov[0] = this._fov[1] * gl.viewport.aspect;
			gl.uniform1f(program.locations.curvePower, this.power);			
			gl.uniform2fv(program.locations.forward, this.forward);			
			gl.uniform2fv(program.locations.fov, this._fov);	
			if (this.dirtyColors) {
				this.dirtyColors = false;
				gl.uniform4fv(program.locations.colors, this.colors);	
			}
			gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);							
		},	
		direction(yaw, pitch) {			
			this.forward[0] = yaw;
			this.forward[1] = pitch;			
		},
	};
	const API = {
		init(gl_context, gl_renderer) {
			gl = gl_context;
			renderer = gl_renderer;
			setup();
		},
		getSheet(name) { return sheets[name] },
		addSheet(name) { return sheets[name] = new Sheet(name) },
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
