import {glUtils} from "../glUtils.js";
export {skyShader};
function skyShader(opts = {}) {
	Object.assign(opts, {
		...opts
	});
    const shaders = {
		vert: {
			default() { return `#version 300 es
				in vec2 verts;
				uniform vec2 aspect;
				uniform float fov;
				uniform mat4 camera;
				out vec3 coords;
				void main() { 
					coords = (camera * vec4(verts  * vec2(0.5, -0.5) / aspect, 1, 0)).xyz * fov;
					gl_Position =  vec4(verts, 0, 1); 
				}`;
			},
			sun() { return `#version 300 es
				in vec2 verts;
				uniform vec2 aspect;
				//uniform float fov;
				uniform mat4 camera;
				out vec3 coords;
				void main() { 
					//coords = (camera * vec4(verts  * vec2(0.5, -0.5) * aspect, 1, 0)).xyz * fov;
					//coords = (camera * vec4(verts  * vec2(0.5, -0.5) / aspect, 1, 0)).xyz;
					coords = (camera * vec4(verts / aspect, 1, 0)).xyz;
					gl_Position =  vec4(verts, 0, 1); 
				}`;
			},
		},
		frag: {
			default() { return  `#version 300 es
				precision mediump float;

				uniform vec4 colorEast;
				uniform vec4 colorWest;
				uniform vec4 colorDown;
				in vec3 coords;
				out vec4 pixel;
				void main() {
					pixel = mix(colorEast, colorWest, coords.x);
				}`; 
			},		
	//const float i_MAXD = 15000.0;


/*	#define CLOUD_STEPS 10
	#define RAYMARCH_STEPS 10
	vec3 eps = vec3(0.02, 0, 0);
	vec3 sunColor = vec3(0.99, 0.94, 0.9);
	vec3 attenuation = vec3(0.3, 0.03, 0.01);
	vec3 sun = vec3(0.38, 0.531, -0.758);
	vec2 cloud = vec2(2501, 3400);
	float globalDistance = 0.0;
	vec3 sunAmount = vec3(0.0);
	bool above = false;
	mat3 m = mat3(0.0,  0.8,  0.6, -0.8,  0.3, -0.4, -0.6, -0.4,  0.6);			
	float sunSpecular = max(0.,dot(sun, rd));
	sunAmount = sunColor * min(4.0 * pow(sunSpecular, 2048.0) + pow(sunSpecular, 32.0), 1.0);
		tr = traceClouds(cp, rd);
		color = tr.xyz;

	if (above && sunSpecular > 0.0) {
		vec2 sunPos = vec2(dot(sun, side), sun.y);
		vec2 pos = uv - sunPos;
		pos = pos * length(pos);
		sunColor *= .1 * pow(sunSpecular, 6.0);
		color += sunColor * 25.0 * pow(max(0., 1.0-2.0*length(sunPos*2.0 + pos)), 10.0) * vec3(1.0, .4, .2);
		color += sunColor * 10.0 * pow(max(0., 1.0-length(sunPos*5.0 + mix(pos, uv, -2.1))), 4.0);
	}
	color = above ? color + sunAmount * (1.-tr.a) : color * exp(-attenuation*(wh - cp.y)) * min(1.+ rd.y, 1.);	
	color +=    smoothstep(0., 1., 1.-.1*iTime);		// FADE IN
	color *= 1.-smoothstep(0., 1., .2*iTime-12.3);	// FADE OUT
	color = pow( min(color, 1.), vec3(0.44) );
	fragColor = vec4(color*color*(3.0-2.0*color), 1.);			*/
			
			sun() { return  `#version 300 es
				precision mediump float;
				//#define sunPos vec3(0,0,1)
				//#define sunPos1 vec3(0,0,1)
				#define sunPow 10.0
				uniform vec3 sunPos;
				uniform vec4 colorEast;
				uniform vec4 colorWest;
				uniform vec4 colorDown;
				uniform vec4 colorSun;
				in vec3 coords;
				out vec4 pixel;
				void main() {
					
					vec3 s = normalize(coords);
					//vec3 sp = normalize(sunPos1);
					//vec4 sd = pow(max(dot(coords, sp),0.0),1032.0) * sunPow * colorSun;
					vec4 sd = pow(max(dot(s, sunPos),0.0),1032.0) * sunPow * colorSun;
					//sd += pow(max(dot(s , sunPos1 - coords),0.0),3.0) * vec4(1,0,0,1);
					
					pixel = sd + mix(colorEast, colorWest, coords.x);
				}`; 
			},						
		},
		draw: {
			default() {
				gl.uniform4fv(locations.colorEast, opts.colors.east);
				gl.uniform4fv(locations.colorWest, opts.colors.west);
				gl.uniform4fv(locations.colorDown, opts.colors.down);			
			},
			sun() {
				gl.uniform4fv(locations.colorEast, opts.colors.east);
				gl.uniform4fv(locations.colorWest, opts.colors.west);
				gl.uniform4fv(locations.colorDown, opts.colors.down);			
				gl.uniform4fv(locations.colorSun, opts.colors.sun);			
			},
		},		
		locations: {
			default() { return ["A_verts", "U_aspect", "U_camera", "U_colorEast", "U_colorWest", "U_colorDown"] },
			sun() { return ["A_verts", "U_aspect", "U_camera", "U_colorEast", "U_colorWest", "U_colorDown", "U_colorSun", "U_sunPos"] },
		},
	};
	const src = {vert: null, frag: null};
    var gl, program, locations, buffers, dirty, method, locationDesc,time;
    const bufferDesc = () => ({indices: {...glUtils.buffers.indices}, verts: {...glUtils.buffers.verts}});
    const API = {
		compile() { 
			if (gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},		
        init(gl_context = gl) {
            gl = gl_context;
            this.compile();
            glUtils.initBuffers(buffers = bufferDesc(), locations);
        },
		get methods() { return ["default", "sun"] },
		get method() { return method },
		set method(name) {
			if(name != method) {
				locationDesc = shaders.locations[name] ? shaders.locations[name]() : locationDesc;
				src.vert = shaders.vert[name] ? shaders.vert[name]() : src.vert;
				src.frag = shaders.frag[name] ? shaders.frag[name]() : src.frag;
				this.drawExtra = shaders.draw[name] ? shaders.draw[name].bind(this) : shaders.draw.default.bind(this);
				method = name;
				gl && API.init();
			}
		},
        setColorInt32(idx, int32) { glUtils.colors.int32(cols[idx], int32); dirty = true },
        setColorRGBA(idx, rgba) { glUtils.colors.RGBA(cols[idx], rgba); dirty = true },
		setColor(name, color) { opts.colors[name] && (dirty = true) && isNaN(color) ? glUtils.colors.RGBA(opts.colors[name], color) : glUtils.colors.int32(opts.colors[name], color) },
        soil() { dirty = true },
        wash() { dirty = false },
        get isDirty() { dirty },
		setUniform(name, data) { locations[name] && (gl["uniform" +  data.length + "fv"](locations[name], data)) },
        draw(_dirty) {
			if (_dirty || dirty) {
				this.drawExtra();
				this.wash();
			}
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);				
        },      
        use(view) { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
				gl.disable(gl.BLEND);
				gl.disable(gl.CULL_FACE);
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
				gl.uniform2fv(locations.aspect, view.aspect);
				//gl.uniform1f(locations.fov, view.fov);
				gl.uniformMatrix4fv(locations.camera, false, view.camera.mat4Inv.m);
                return true;
            }
        },
		close() {
			if (gl) {
				glUtils.delete({program, buffers});
				gl = locations = opts.color = undefined;
				this.close = this.init = this.add = this.draw = this.use = undefined;
			}
		}
    };
	API.method = "default";
    return API;
};

