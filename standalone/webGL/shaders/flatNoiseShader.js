import {glUtils} from "../glUtils.js";
export {flatNoiseShader};
function flatNoiseShader(opts = {}) {
	Object.assign(opts, {color: [1,1,1,1], ...opts});
    const src = {
		get vert() { return `#version 300 es
			in vec2 verts;
			uniform sampler2D tex;
			uniform float noiseZ;
			out vec2 texCoord;
			out vec3 noiseCoord;
			out vec2 pixelScale;
			void main() { 
				vec2 tc = vec2(textureSize(tex,0));
				texCoord = verts * 0.5 + 0.5;
				pixelScale = vec2(0.5, 0.5) / tc;
				noiseCoord = vec3(verts * (10.5, 10.5 * (tc.y / tc.x)) + 10.02, noiseZ);
				gl_Position =  vec4(verts, 0, 1); 
			}`;
		},
		get frag() { return  `#version 300 es
			precision mediump float;
			uniform sampler2D tex;
			uniform vec4 color;
			uniform float pixelMove;
			in vec2 texCoord;
			in vec3 noiseCoord;
			in vec2 pixelScale;
			out vec4 pixel;
			
			#define taylorBase 1.79284291400159
			#define taylorScale 0.85373472095314
			#define unitX 7.0
			#define unitY 7.0
			#define modX 289.0
			#define modXX 34.0
			#define modY 289.0
			#define modYY 289.0
			#define unitScale 2.2
			#define unitScalePI 6.9115038379
			#define unitScalePI2 13.823
			
			vec4 permuteX(vec4 x) {return mod(((x * modXX) + 1.0) * x, modX);}
			vec4 permuteY(vec4 x) {return mod(((x * modYY) + 1.0) * x, modY);}
			vec3 fade(vec3 t) {return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);}
			


			float cnoise(vec3 P){
				vec3 Pi0 = floor(P);
				vec3 Pi1 = Pi0 + vec3(1.0);
				Pi0 = mod(Pi0, modX);
				Pi1 = mod(Pi1, modY);
				vec3 Pf0 = fract(P); 
				vec3 Pf1 = Pf0 - vec3(1.0);
				vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
				vec4 iy = vec4(Pi0.yy, Pi1.yy);
				vec4 iz0 = Pi0.zzzz;
				vec4 iz1 = Pi1.zzzz;

				vec4 ixy = permuteY(permuteX(ix) + iy);
				vec4 ixy0 = permuteX(ixy + iz0);
				vec4 ixy1 = permuteY(ixy + iz1);

				vec4 gx0 = ixy0 / unitX;
				vec4 gy0 = fract(floor(gx0) / unitX) - 0.5;
				gx0 = fract(gx0);
				vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
				vec4 sz0 = step(gz0, vec4(0.0));
				gx0 -= sz0 * (step(0.0, gx0) - 0.5);
				gy0 -= sz0 * (step(0.0, gy0) - 0.5);

				vec4 gx1 = ixy1 / unitY;
				vec4 gy1 = fract(floor(gx1) / unitY) - 0.5;
				gx1 = fract(gx1);
				vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
				vec4 sz1 = step(gz1, vec4(0.0));
				gx1 -= sz1 * (step(0.0, gx1) - 0.5);
				gy1 -= sz1 * (step(0.0, gy1) - 0.5);

				vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
				vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
				vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
				vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
				
				vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
				vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
				vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
				vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
				


				vec4 norm0 = taylorBase - vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)) * taylorScale;
				g000 *= norm0.x;
				g010 *= norm0.y;
				g100 *= norm0.z;
				g110 *= norm0.w;
				vec4 norm1 = taylorBase - vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)) * taylorScale;
				g001 *= norm1.x;
				g011 *= norm1.y;
				g101 *= norm1.z;
				g111 *= norm1.w;

				float n000 = dot(g000, Pf0);
				float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
				float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
				float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
				float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
				float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
				float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
				float n111 = dot(g111, Pf1);

				vec3 fade_xyz = fade(Pf0);
				vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
				vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
				float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
				return unitScalePI2 * n_xyz;
			}			
			
			
			
			
			void main() {
				vec4 c1 = texture(tex, texCoord );
				float d = 3.0 - (c1.x + c1.y + c1.z);
				float z = cnoise(noiseCoord * c1.rgb * d);
				vec2 o = texCoord + vec2(cos(z), sin(z)) * pixelScale * pixelMove * (d + 0.5);
				pixel = mix(c1, texture(tex, o), d / 3.2) * color;
			}`; 
		}
	};
    opts.color = new Float32Array(opts.color);
    var gl, program, locations, buffers, dirty, texture, noiseZ = 0, pixelMove = 2;
    const locationDesc = ["A_verts", "U_color","U_noiseZ", "U_pixelMove"];
    const bufferDesc = () => ({indices: {...glUtils.buffers.indices}, verts: {...glUtils.buffers.verts}});
    const API = {
		compile() { 
			if (gl) {
				glUtils.delete({program});
				[program, locations] = glUtils.createProgram(src.vert, src.frag, locationDesc);
			}
			this.soil();
		},		
        init(gl_context, tex) {
            gl = gl_context;
            this.compile();
			texture = tex;
            glUtils.initBuffers(buffers = bufferDesc(), locations);
        },
		set texture(tex) { texture = tex },
		get texture() { return texture },
        set colorRGBA(rgba) { glUtils.colors.RGBAOffset(opts.color, rgba, 0.1); dirty = true },
		set noiseZ(v) { noiseZ = v; dirty = true },
		set pixelMove(v) { pixelMove = v; dirty = true },
        soil() { dirty = true },
        wash() { dirty = false },
        get isDirty() { dirty },
        draw(_dirty) {
			texture.bind();
			if (_dirty || dirty) {
				gl.uniform1f(locations.noiseZ, noiseZ);
				gl.uniform1f(locations.pixelMove, pixelMove);
				gl.uniform4fv(locations.color, opts.color);
				this.wash();
			}
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);				
        },      
        use() { 
            if (gl) {
                gl.disable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.bindVertexArray(buffers.vertexBuffer);
                gl.useProgram(program);
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
    return API;
};

/*
const StarrySkyShader = {

  vertexShader: `
    varying vec3 vPos;

    void main() {
      vPos = position;
      vec4 mvPosition = modelViewMatrix * vec4( vPos, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
    }

  `,

  fragmentShader: `
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

    float cnoise(vec3 P){
      vec3 Pi0 = floor(P); // Integer part for indexing
      vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
      Pi0 = mod(Pi0, 289.0);
      Pi1 = mod(Pi1, 289.0);
      vec3 Pf0 = fract(P); // Fractional part for interpolation
      vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;

      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);

      vec4 gx0 = ixy0 / 7.0;
      vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);

      vec4 gx1 = ixy1 / 7.0;
      vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);

      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;

      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);

      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }

    varying vec3 vPos;
    uniform float skyRadius; // 500.01
    uniform vec3 noiseOffset; // vec3(100.01, 100.01, 100.01)

    uniform vec3 env_c1;
    uniform vec3 env_c2;

    uniform float clusterSize;
    uniform float clusterStrength;

    uniform float starSize;
    uniform float starDensity;

    void main() {
      float freq = 1.1/skyRadius;
      float noise = cnoise(vPos * freq);
      vec4 backgroundColor = vec4(mix(env_c1, env_c2, noise), 1.0);

      float scaledClusterSize = (1.0/clusterSize)/skyRadius;
      float scaledStarSize = (1.0/starSize)/skyRadius;

      float cs = pow(cnoise(scaledClusterSize*vPos+noiseOffset),1.0/clusterStrength) + cnoise(scaledStarSize*vPos);

      float c =clamp(pow(cs, 1.0/starDensity),0.0,1.0);
      vec4 starColor = 0.5*vec4(c, c, c, 1.0);

      gl_FragColor = backgroundColor;
      gl_FragColor += starColor;
    }
  `,

};
*/

