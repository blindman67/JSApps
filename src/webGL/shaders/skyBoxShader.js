import {} from "../../utils/MathExtensions.js";
import {glUtils} from "../glUtils.js";
import {TextureCube} from "../Texture.js";

export {skyBoxShader};

function skyBoxShader(options = {}){
	options = {name: "SkyBox", ...options};
	const vertexSrc = `#version 300 es
		in vec3 verts;
		uniform vec2 fov;
		uniform vec2 forward;
		out vec3 texCoord;
		void main() {
            vec2 yaw = vec2(cos(forward.x), sin(forward.x));
            vec2 pitch = vec2(cos(forward.y), sin(forward.y));
			float z = verts.x * yaw.y + verts.z * yaw.x;
			float zz = (verts.y * pitch.y + z * pitch.x) * 0.5;
			gl_Position = vec4((verts.x * yaw.x - verts.z * yaw.y) * fov.x, (verts.y * pitch.x - z * pitch.y) * fov.y, zz, zz);			
		    texCoord = verts;
		}`;
	const fragmentSrc = `#version 300 es
		precision mediump float;
		uniform samplerCube tex;
		uniform vec4 color;
		in vec3 texCoord;
		out vec4 pixel;
		void main() {
			pixel = texture(tex, texCoord) * color;
		}`;	
 
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3,  1, 4, 7, 1, 7, 2,  4, 5, 6, 4, 6, 7,  5, 0, 3, 5, 3, 6,  0, 1, 4, 0, 4, 5,  3, 2, 7, 3, 7, 6]); 
	const verts = () => new Float32Array([ -1, -1,  1, 1, -1,  1, 1,  1,  1, -1,  1,  1, 1, -1, -1, -1, -1, -1, -1,  1, -1, 1,  1, -1]);
	const sheets = {};
	var gl, renderer, program, vertexBuffer;
	
	function setup() {
		program = glUtils.createProgram(gl, vertexSrc, fragmentSrc, options.name);		
		gl.bindVertexArray(vertexBuffer = gl.createVertexArray());
		glUtils.setupAttributes(gl, [
				glUtils.attBuf(gl.ELEMENT_ARRAY_BUFFER, indices(),    gl.STATIC_DRAW),
				glUtils.attBuf(gl.ARRAY_BUFFER,         verts(),      gl.STATIC_DRAW),
				glUtils.attArray("verts",  3, gl.FLOAT, false),
			], program, 0, {}
		);
		program.locations = glUtils.getLocations(gl, program,  "tex", "fov", "forward", "color");   
	}
	function Sheet(name, cube) {
		this.name = name;
		if (cube.isTextureCube) { this.tex = cube }
		else { this.tex = TextureCube(gl, cube) }
		this.forward = new Float32Array([0, 0]);
		this._fov = new Float32Array(2);
		this.fov = Math.PI45;
		this.color = new Float32Array([1,1,1,1]);
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
			this._fov[0] = this._fov[1] * gl.viewport.aspect;
			gl.uniform4fv(program.locations.color, this.color);			
			gl.uniform2fv(program.locations.forward, this.forward);			
			gl.uniform2fv(program.locations.fov, this._fov);	
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
		addSheet(name, cube) { return sheets[name] = new Sheet(name, cube) },
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
