



if (typeof filterGL !== "undefined") { // experiment and not used omniLight
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLight", filter = {
            name : "omniLight",
            description : "Lights the image using a single point like light source",
            webGLFilters : null,
            shader : null,
            callback(height,power,falloff,directional,falloffAmount,point,color) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float height;
                        uniform float power;
                        uniform vec2 light;
                        uniform int falloff;
                        uniform int directional;
                        uniform vec4 color1;
                        uniform float falloffAmount;
                        vec3 toLight;
                        void main() {
                            vec3 l = vec3(light,height);
                            if(directional == 1){
                                toLight = l-vec3(0.5,0.5,0.0);
                            }else{
                                toLight = l-vec3(texCoord,0.0);
                            }
                            float val = dot(normalize(toLight),vec3(0.0,0.0,1.0)) * power;
                            if(falloff == 1){
                                float len = length(toLight);
                                val /= (len * len) * falloffAmount;

                            }

                            vec4 samp = texture2D(texture, texCoord);
                            gl_FragColor = vec4(samp.rgb * color1.rgb * val,samp.a);
                        }
                    `);
                }
                var uniformObj = {
                    light : point,
                    height,
                    power,
                    falloffAmount,
                    color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                    falloff : {type:"uniform1i",value : falloff ? 1 : 0},
                    directional : {type:"uniform1i",value : directional ? 1 : 0}
                 };
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 3, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : -5, max : 5, step : 0.1, def : 1},
                },{
                    name : "falloff",
                    description : "If true then light will reduce depending on the distance",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "directional",
                    description : "If true light rays will be from directional source",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "Light",
                    description : "The location of the light relative to the image",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "color",
                    description : "The colour of he light",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // experiment and not used  directionalPixelLight
    (function () {
        const R2 = 2 ** 0.5 * 0.5;
        var filter;
        filterGL.filters.register("directionalPixelLight", filter = {
            name : "directionalPixelLight",
            description : "Diectional infinite light for pixel relief",
            webGLFilters : null,
            shader : null,
            lightDirections: {
                TopLeft: [-R2,-R2],
                Top: [0,-1],
                TopRight: [R2,-R2],
                Right: [1,0],
                BottomRight: [R2,R2],
                Bottom: [0,1],
                BottomLeft: [-R2,R2],
                Left: [1,0],
                Above: [-0.01,-0.01],
            },
            uniforms : {},
            callback(height, power, lightDir, light, dark, useImage) {
                const glF = this.webGLFilters;
                const U = this.uniforms;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform float height;
                        uniform float power;
                        uniform vec2 lightDir;
                        uniform vec4 light;
                        uniform vec4 dark;
                        uniform int useImage;
                        uniform int useDiagonal;

                        void main() {
                            vec4 samp = texture2D(texture, texCoord);
                            vec4 sampU = texture2D(texture, texCoord + vec2( 0.0,-1.0) / texSize);
                            vec4 sampD = texture2D(texture, texCoord + vec2( 0.0, 1.0) / texSize);
                            vec4 sampL = texture2D(texture, texCoord + vec2(-1.0, 0.0) / texSize);
                            vec4 sampR = texture2D(texture, texCoord + vec2( 1.0, 0.0) / texSize);
                            vec3 v1 = vec3( 0.0, -1.0, (sampU.r + sampU.g + sampU.b) -(sampD.r + sampD.g + sampD.b));
                            vec3 v2 = vec3(-1.0,  0.0, (sampL.r + sampL.g + sampL.b) -(sampR.r + sampR.g + sampR.b));
                            vec3 norm = normalize(cross(v2, v1));
                            vec3 lightPos = normalize(vec3(lightDir, height));
                            vec3 col = vec3(0.6);
                            if (useImage == 1) { col = samp.rgb; }
                            float reflected = clamp(dot(lightPos, normalize(norm)) * power, 0.0, 1.0);
                            if (reflected < 0.5) {
                                reflected = pow((0.5 - reflected) * 2.0, 2.0);  // non linear to reduce saturation loss
                                col = clamp(col.rgb - dark.rgb * reflected, 0.0, 1.0);
                            } else {
                                reflected = pow((reflected - 0.5) * 2.0, 2.0); // non linear
                                col = clamp(col.rgb + light.rgb * reflected, 0.0, 1.0);
                            }
                            gl_FragColor = vec4(col.rgb, samp.a);
                        }
                    `);
                    U.texSize = [glF.width, glF.height];
                    U.lightDir = [...this.lightDirections[lightDir]];
                    U.height = height;
                    U.power = power;
                    U.light = [light[0] / 255, light[1] / 255, light[2] / 255, light[3] / 255];
                    U.dark = [dark[0] / 255, dark[1] / 255, dark[2] / 255, dark[3] / 255];
                    U.useImage = {type:"uniform1i",value : useImage ? 1 : 0};
                } else {
                    U.texSize[0] = glF.width;
                    U.texSize[1] = glF.height;
                    U.lightDir[0] = this.lightDirections[lightDir][0];
                    U.lightDir[1] = this.lightDirections[lightDir][1];
                    U.height = height;
                    U.power = power;
                    U.light[0] = light[0] / 255;
                    U.light[1] = light[1] / 255;
                    U.light[2] = light[2] / 255;
                    U.light[3] = light[3] / 255;
                    U.dark[0] = dark[0] / 255;
                    U.dark[1] = dark[1] / 255;
                    U.dark[2] = dark[2] / 255;
                    U.dark[3] = dark[3] / 255;
                    U.useImage.value = useImage ? 1 : 0;
                }

                glF.filter(this.shader, U);
                return glF;
            },
            arguments : [{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 3, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : -5, max : 5, step : 0.1, def : 1},
                },{
                    name : "LightDir",
                    description : "Direction of light",
                    type : "String",
                    range : "TopLeft,Top,TopRight,Right,BottomRight,Bottom,BottomLeft,Left,Above".split(","),
                },{
                    name : "Light",
                    description : "The amount of light. This is a additive value",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "Dark",
                    description : "The amount of dark. This is a subtractive value",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "UseImage",
                    description : "Use image pixel colors",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "UseDiagonal",
                    description : "includes diagonal pixel height",
                    type : "Boolean",
                    range : {def : true},
                }
            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { //  experiment and not used omniLightHeight
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightHeight", filter = {
            name : "omniLightHeight",
            description : "Omni light with height map",
            webGLFilters : null,
            shader : null,
            callback(height,power,falloff,falloffAmount,point,color) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform float height;
                        uniform float power;
                        uniform vec2 light;
                        uniform int falloff;
                        uniform vec4 color1;
                        uniform float falloffAmount;
                        void main() {
                            vec4 samp = texture2D(texture, texCoord);
                            vec4 samp1 = texture2D(texture, texCoord + vec2(0.0,-1.0) / texSize);
                            vec4 samp2 = texture2D(texture, texCoord + vec2(-1.0,0.0) / texSize);
                            vec3 v1 = vec3(0.0,-1.0,(samp1.r + samp1.g + samp1.b) -(samp.r + samp.g + samp.b));
                            vec3 v2 = vec3(-1.0,0.0,(samp2.r + samp2.g + samp2.b) -(samp.r + samp.g + samp.b));
                            vec3 norm = cross(v2,v1);
                            vec3 l = vec3(light,height);
                            vec3 toLight = l-vec3(texCoord,0.0);
                            float val = clamp(dot(normalize(toLight),norm) * power,0.0,1.0);
                            if(falloff == 1){
                                float len = length(toLight);
                                val /= (len * len) * falloffAmount;
                            }
                            gl_FragColor = vec4(samp.rgb * color1.rgb * val,samp.a);
                        }
                    `);
                }
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : point,
                    height,
                    power,
                    falloffAmount,
                    color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                    falloff : {type:"uniform1i",value : falloff ? 1 : 0}
                 };
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 3, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : -5, max : 5, step : 0.1, def : 1},
                },{
                    name : "falloff",
                    description : "If true then light will reduce depending on the distance",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "Light",
                    description : "The location of the light relative to the image",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "Color",
                    description : "The colour of he light",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // heightErode
    (function () {
		const shaderTypes = {
			"Directions 4": null,
			"Directions 6": null,
			"Directions 8": null,
			"Directions 10": null,
			"Directions 12": null,
			"Directions 16": null,
		};
        var filter; // to access common properties for associated filters
        filterGL.filters.register("heightErode", filter = {
            name : "heightErode",
            description : "Erodes height map",
            webGLFilters : null,
            shader : null,
            callback(reduce,distance,sampleDist,scale,reduceB, directions) {
                var glF = this.webGLFilters;
				const steps = Number(directions.split(" ")[1]);
				if(shaderTypes[directions] !== null) {
					this.shader = shaderTypes[directions];
				}else {
                //if (this.shader === undefined || this.shader === null){
                    shaderTypes[directions] = this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform float reduce;
                        uniform float reduceB;
                        uniform float distance;
                        uniform float sampleDist;
                        uniform float scale;
                        uniform float turn;
                        const float pi = 3.141592654;
                        const float pi0p5 = 1.5707963;
                        const float tau = 3.141592654 * 2.0;

                        void main() {
                            vec4 samp = texture2D(texture, texCoord);
                            float sum = samp.x + samp.y + samp.z;
                            vec2 dir = vec2(0.0, 0.0);
							float dif = 0.0;
                            for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += ${(Math.PI * 2 / steps).toFixed(6)} ) {
								vec2 d = vec2(cos(i), sin(i));
                                vec4 samp1 = texture2D(texture, texCoord + vec2(texSize.x, texSize.y) * d  * sampleDist);
								float df = (samp1.x + samp1.y + samp1.z) - sum ;
								dir += d * df;
							}

                            float flow = 1.0 - length(dir) / scale;
                            dir = normalize(dir);
                            float ang;
                            if(dir.x == 0.0){
                                ang = pi0p5 * sign(dir.y);
                            }else if(dir.x > 0.0){
                                ang = atan(dir.y/dir.x);
                            }else{
                                ang = pi - atan(dir.y/abs(dir.x));
                            }
                            dir = vec2(cos(ang),sin(ang)) * distance;

                            dir *= texSize;
                            vec4 samp1 = texture2D(texture, texCoord + dir);
                            gl_FragColor = vec4(samp.rgb  * flow * reduceB + (samp1.rgb * (1.0 -flow)) * reduce, samp.a);
                        }
                    `);
                }
                var uniformObj = {
                    texSize : [1 / glF.width, 1 / glF.height],
                    reduce,
					sampleDist,
                    distance,
                    scale: scale * scale * Math.sign(scale),
                    reduceB,
                 };
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "reduce",
                    description : "Amount of uphill pixel to copy",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.1, def : 1},
                },{
                    name : "distance",
                    description : "Distance to pick uphill pixel",
                    type : "Number",
                    range : {min : -32, max : 32, step : 0.1, def : 1},
                },{
                    name : "sampleDist",
                    description : "Distance to measure slope",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.025, def : 0},
                },{
                    name : "scale",
                    description : "scale the flow",
                    type : "Number",
                    range : {min : -3, max : 3, step : 0.01, def : 1},
                },{
                    name : "reduceB",
                    description : "complement reduce A",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.1, def : 1},
                },{
                    name : "directions",
                    description : "Number of directions to process",
                    type : "String",
                    range : ["Directions 4", "Directions 6", "Directions 8", "Directions 10", "Directions 12","Directions 16"],
                },

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // heightErodeRiver Experimenatal
    (function () {
		const shaderTypes = {
			"Directions 4": null,
			"Directions 6": null,
			"Directions 8": null,
			"Directions 10": null,
			"Directions 12": null,
			"Directions 16": null,
		};
        var filter; // to access common properties for associated filters
        filterGL.filters.register("heightErodeRiver", filter = {
            name : "heightErodeRiver",
            description : "Erodes height map",
            webGLFilters : null,
            shader : null,
            callback(sampleDist,sampleDist1,scale, iterations, directions) {
                var glF = this.webGLFilters;
				const steps = Number(directions.split(" ")[1]);
				if(shaderTypes[directions] !== null) {
					this.shader = shaderTypes[directions].A;
					this.shaderB = shaderTypes[directions].B;
				}else {
					shaderTypes[directions] = {A: null, B: null};
					shaderTypes[directions].B = this.shaderB = this.shader = glF.Shader(null, null).useLinker();
					this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
						uniform float sampleDist1;
						bool isAxisOwned(float dir, float samp) {
							if(dir > 0.0 && samp < 0.45) { return true; }
							if(dir < 0.0 && samp > 0.55) { return true; }
							if(dir == 0.0 && samp >= 0.45 && samp <= 0.55) { return true; }
							return false;
						}
						vec4 samp;
						float move;
						float count;
						void isPixelOwned(vec2 dir) {
							samp = texture2D(texture, texCoord + texSize * dir * sampleDist1);
							if (samp.x >= 0.45 && samp.x <= 0.55 && samp.y >= 0.45 && samp.y <= 0.55 ) {
								move += samp.z - 0.5;
								count += 1.0;
							} else  if (isAxisOwned(dir.x, samp.x) && isAxisOwned(dir.y, samp.y)) {
							   move += samp.z - 0.5;
								count += 1.0;
							}
						}
						void getMovement() {
							move = 0.0;
							count = 0.0;
							isPixelOwned(vec2(-1.0, -1.0));
							isPixelOwned(vec2(0.0, -1.0));
							isPixelOwned(vec2(1.0, -1.0));
							isPixelOwned(vec2(1.0, 0.0));
							isPixelOwned(vec2(1.0, 1.0));
							isPixelOwned(vec2(0.0, 1.0));
							isPixelOwned(vec2(-1.0, 1.0));
							isPixelOwned(vec2(-1.0, 0.0));
							if(count > 0.0) {
								move /= count;
							}
						}
                        void main() {
                            getMovement();
							vec4 samp = texture2D(texture, texCoord);
							samp.rgb = vec3(samp.a + move);
							gl_FragColor = vec4(samp.rgb, 1.0);
						}
					`);
                    shaderTypes[directions].A = this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform float sampleDist;
                        uniform float scale;

                        const float pi = 3.141592654;
                        const float pi0p5 = 1.5707963;
                        const float tau = 3.141592654 * 2.0;
						float getDirection(vec2 dir) {
                            if(dir.x == 0.0){
                                return pi0p5 * sign(dir.y);
                            }
							if(dir.x > 0.0){
                                return atan(dir.y/dir.x);
                            }
                            return pi - atan(dir.y/abs(dir.x));
						}

                        void main() {
                            vec4 samp = texture2D(texture, texCoord);
                            float sum = (samp.x + samp.y + samp.z) / 3.0;
                            vec2 dirUp = vec2(0.0, 0.0);
                            vec2 dirDown = vec2(0.0, 0.0);

                            for (float i = 0.0; i < tau; i += ${(Math.PI * 2 / steps).toFixed(6)} ) {
								vec2 d = vec2(cos(i), sin(i));
                                vec4 samp1 = texture2D(texture, texCoord + vec2(texSize.x, texSize.y) * d  * sampleDist);
								float df = (samp1.x + samp1.y + samp1.z) / 3.0;

								df -= sum;

								if (df < 0.0) { dirDown += d * -df; }
								else { dirUp += d * df; }
							}
							float flowDown = length(dirDown) * scale;
							float flowUp = length(dirUp) * scale;


							if(flowDown == 0.0) {
								if(flowUp > 0.0) {
									float am = flowUp / 2.0;
									gl_FragColor = vec4(0.5, 0.5, 0.5 - am, sum + am);
								} else {
									gl_FragColor = vec4(0.5, 0.5, 0.5, sum );
								}
							}  else {
								float d = getDirection(normalize(-dirDown));
								float am = (flowDown + flowUp) / 2.0;
								gl_FragColor = vec4(cos(d) * 0.5 + 0.5, sin(d) * 0.5 + 0.5, 0.5 + am , sum - am);
							}
                        }
                    `);
                }
                var uniformObjA = {
                    texSize : [1 / glF.width, 1 / glF.height],
					sampleDist,
                    scale: scale * scale * Math.sign(scale),
                 };
                var uniformObjB = {
					sampleDist1,
                    texSize : [1 / glF.width, 1 / glF.height],
                 };
				 for(var i = 0; i < iterations; i++) {
					glF.filter(this.shader, uniformObjA);
					glF.filter(this.shaderB, uniformObjB);
				 }
                return glF;
            },
            arguments : [{
                    name : "sampleDist",
                    description : "Distance to measure slope",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.025, def : 0},
                },{
                    name : "sampleDist1",
                    description : "Distance to measure slope",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.025, def : 0},
                },{
                    name : "scale",
                    description : "scale the flow",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "iterations",
                    description : "Number of time to apply errod",
                    type : "Number",
                    range : {min : 1, max : 8, step : 1, def : 1},
                },{
                    name : "directions",
                    description : "Number of directions to process",
                    type : "String",
                    range : ["Directions 4", "Directions 6", "Directions 8", "Directions 10", "Directions 12","Directions 16"],
                },

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // heightErodeRiver Experimenatal Not happening and removed from filter list
    (function () {

        var filter; // to access common properties for associated filters
        filterGL.filters.register("heightErodeRiver2", filter = {
            name : "heightErodeRiver2",
            description : "Erodes height map X2",
            webGLFilters : null,
            shader : null,
            callback(sampleDist, iterations, flowMapA, flowMapB, flowMapC) {
                var glF = this.webGLFilters;
				if(!flowMapA || !flowMapB || !flowMapC) {
					log.warn("Requiers all maps to process");
				} else {
					if(this.shader === null) {
						this.shader = glF.Shader(null, null).useLinker();
						this.shaderF = glF.Shader(null, null).useLinker();
						this.shader.setFragmentSource(`
							uniform sampler2D texture;
							uniform sampler2D texture1;
							uniform sampler2D texture2;
							uniform sampler2D texture3;
							varying vec2 texCoord;
							uniform float sampDist;
							uniform vec2 texSize;
							void main() {
								float r = texture2D(texture1, texCoord).r;
								float g = texture2D(texture2, texCoord).g;
								float b = texture2D(texture3, texCoord).b;
								gl_FragColor = vec4(r,g,b,1.0);
							}
						`);
						this.shaderF.setFragmentSource(`
							uniform sampler2D texture;
							//uniform sampler2D texture1; // flow
							varying vec2 texCoord;
							uniform vec2 texSize;
							uniform float sampDist;
							uniform vec2 toA;
							uniform vec2 toB;
							uniform vec2 toC;
							void main() {
								vec4 a = texture2D(texture, texCoord + toA * texSize * sampDist);
								vec4 b = texture2D(texture, texCoord + toB * texSize * sampDist);
								vec4 c = texture2D(texture, texCoord + toC * texSize * sampDist);
								vec4 n = texture2D(texture, texCoord);
								float aa = (a.x + a.y + a.z) / 6.0;
								float bb = (b.x + b.y + b.z) / 6.0;
								float cc = (c.x + c.y + c.z) / 6.0;
								float nn = (n.x + n.y + n.z) / 6.0;
								gl_FragColor = vec4(nn - aa + 0.5, nn - bb + 0.5, nn - cc + 0.5, 1.0);
							}
						`);

					}

					var uniformsFA = {
						texSize : [1 / glF.width, 1 / glF.height],
						sampleDist,
						toA: [-1, -1],
						toA: [-1, 0],
						toC: [-1, 1],
						//texture1 : {type :"uniform1i",value: 1 },
					}
					var uniformsFB = {
						texSize : [1 / glF.width, 1 / glF.height],
						sampleDist,
						toA: [0, -1],
						toA: [0, 0],
						toC: [0, 1],
						//texture1 : {type :"uniform1i",value: 1 },
					}
					var uniformsFC = {
						texSize : [1 / glF.width, 1 / glF.height],
						sampleDist,
						toA: [1, -1],
						toA: [1, 0],
						toC: [1, 1],
						//texture1 : {type :"uniform1i",value: 1 },
					}
					glF.filter(this.shaderF, uniformsFA);
					glF.copyBufferTo(flowMapA);
					glF.filter(this.shaderF, uniformsFB);
					glF.copyBufferTo(flowMapB);
					glF.filter(this.shaderF, uniformsFC);
					glF.copyBufferTo(flowMapC);

					var uniforms = {
						texSize : [1 / glF.width, 1 / glF.height],
						sampleDist,
						texture1 : {type :"uniform1i",value: 1},
						texture2 : {type :"uniform1i",value: 2},
						texture3 : {type :"uniform1i",value: 3},
					 };
					flowMapA.bind(1)
					flowMapB.bind(2)
					flowMapC.bind(3)
					 for(var i = 0; i < iterations; i++) {
						glF.filter(this.shader, uniforms);
					 }
				}
                return glF;
            },
            arguments : [{
                    name : "sampleDist",
                    description : "Distance to measure slope",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.1, def : 1},
                },	{
                    name : "iterations",
                    description : "Number of passes",
                    type : "Number",
                    range : {min : 1, max : 4, step : 1, def : 1},
                },	{
                    name : "FlowMapA",
                    description : "Fluid direction 0,1,2 of 8",
                    type : "Image",
                    range : {def : null},
                },	{
                    name : "FlowMapB",
                    description : "Fluid direction 3,4,5 of 8",
                    type : "Image",
                    range : {def : null},
                },	{
                    name : "FlowMapC",
                    description : "Fluid direction 6,7 of 8",
                    type : "Image",
                    range : {def : null},
                }

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // omniLightNormMap
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightNormMap", filter = {
            name : "omniLightNormMap",
            description : "Lights the image with omni directional light. Same as omniLight flat but the image is a normal map",
            webGLFilters : null,
            shader : null,
            callback(colorMap,/*envMap,*/directional,height,power,specular,specAmount,invert,flip,falloff,falloffAmount,point,color,specColor,colorAmbient) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        varying vec2 texCoord;
						uniform vec2 texSize;
                        uniform float height;
                        uniform float power;
                        uniform float specular;
                        uniform float specAmount;
                        uniform float invert;
                        uniform float flip;
                        uniform int colorMap;
                        uniform vec3 light;
                        uniform int falloff;
						uniform int directional;
                        uniform vec4 color1;
                        uniform vec4 specColor;
                        uniform vec4 colorAmbient;
                        uniform float falloffAmount;
                        const float pi = ${Math.PI.toFixed(6)};
                        void main() {

                            vec4 samp = texture2D(texture, texCoord);
							vec3 norm = normalize(vec3((samp.x - 0.5) * invert,-(samp.y - 0.5) * invert, (samp.z - 0.5) * flip)) ;

                            vec3 pos = vec3(texCoord.x, texCoord.y,0.0);
                            vec3 toLight;// = light * height;
							vec3 toCamera = vec3(0.5, 0.5, 10);
							float lightDist = 1.0;
							if (directional == 1) {
								toLight = normalize(light);
								toCamera = normalize(toCamera);
							} else {
								toLight = light * height + vec3(0.5, 0.5, 0) - pos;
								lightDist = length(toLight);
                                toLight = normalize(toLight);
								toCamera = normalize(toCamera - pos);
							}

                            vec3 lRef = normalize(2.0 * dot(norm, toLight) * norm - toLight);
                            float spec = dot(lRef, toCamera);
                            spec = clamp(spec, 0.0, 1.0);

                            spec = pow(spec, specular * specular) * power;
                            float val = clamp(dot(normalize(toLight), norm) , 0.0, 1.0)* power;
                            if (falloff == 1){
								float fo = lightDist * falloffAmount;
                                val /= fo;
								spec /= fo;
                            }

                            vec3 col = colorMap == 1 ? texture2D(texture1, texCoord).rgb : vec3(1.0);
                            col *= 256.0;
                            col *= col;
                            vec3 col1 = specColor.rgb * 256.0;
                            col1 *= col1;
                            vec3 colA = colorAmbient.rgb;

                            vec3 mix = (col * color1.rgb * val) + col * colA + (col1 * spec) * specAmount;
                            mix = sqrt(mix) / 256.0;

                            gl_FragColor = vec4(mix,samp.a);

                        }

                    `);
                }

                const lDir = Math.atan2(point[1] - 0.5, point[0] - 0.5);
                const lElv = (((point[1] - 0.5) ** 2 + (point[0] - 0.5) ** 2) ** 0.5) * Math.PI;
                const lx = Math.cos(lDir) * Math.sin(lElv);
                const ly = Math.sin(lDir) * Math.sin(lElv);
                const lz = Math.cos(lElv)

                var uniformObj = {
                    texSize : [glF.width, glF.height],
                    light : [lx, ly, lz],
                    height,
                    power: power * power,
                    specular: specular * specular  * specular,
                    specAmount,
					invert: invert ? -1 : 1,
					flip: flip ? -1 : 1,
					directional: {type:"uniform1i",value : directional ? 1 : 0},
                    falloffAmount: falloffAmount ** 3,
					colorMap : {type:"uniform1i",value : colorMap ? 1 : 0},
                    texture1 : {type :"uniform1i",value : colorMap ? 1 : 0},
                    color1 : [color[0]/255, color[1]/255, color[2]/255, 1],
                    specColor : [specColor[0]/255, specColor[1]/255, specColor[2]/255, 1],
                    colorAmbient : [colorAmbient[0]/255, colorAmbient[1]/255, colorAmbient[2]/255, 1],
                    falloff : {type:"uniform1i",value : falloff ? 1 : 0},
                };
                if (colorMap) { colorMap.bind(1) }
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "ColorMap",
                    description : "Colour texture map",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "Directional",
                    description : "Use a directional light source rather than point source",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : 0, max : 5, step : 0.1, def : 1},
                },{
                    name : "specular",
                    description : "Surface specular power (shininess)",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "specAmount",
                    description : "Surface reflectivity",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "invert",
                    description : "Inverts the x and y normals",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "flip",
                    description : "Flips z",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "falloff",
                    description : "If true then light will reduce depending on the distance",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "Light",
                    description : "The location of the light relative to the image",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "color",
                    description : "The colour of he light",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "specularColor",
                    description : "Specular highlight color",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "colorAmbient",
                    description : "The amount of ambient light",
                    type : "HexColor",
                    range : {def : "#223344"},
                }

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // normMapReflect
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("normMapReflect", filter = {
            name : "normMapReflect",
            description : "This filter needs work as does not do what is says on da box. Applys reflection map",
            webGLFilters : null,
            shader : null,
            callback(reflectMap,refractMap,invert,scale, power,tint,invert1,scale1, power1,tint1,mix,offsetRot) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        uniform sampler2D texture2;
                        varying vec2 texCoord;
						uniform vec2 texSize;
						uniform vec3 offsetRot;
                        uniform float invert;
                        uniform float invert1;
                        uniform float scale;
                        uniform float scale1;
                        uniform float power;
                        uniform float power1;
                        uniform int reflectMap;
                        uniform int refractMap;
                        uniform vec4 tint;
                        uniform vec4 tint1;
						uniform float rrMix;
                        void main() {
						    float xax = cos(offsetRot.z);
							float xay = sin(offsetRot.z);

                            vec4 samp = texture2D(texture, texCoord);
							vec2 tOff = vec2(1) / texSize;
							vec4 samp1 = texture2D(texture, texCoord + vec2(tOff.x, 0));
							samp1 += texture2D(texture, texCoord + vec2(-tOff.x, 0));
							samp1 += texture2D(texture, texCoord + vec2(0, tOff.y));
							samp1 += texture2D(texture, texCoord + vec2(0, -tOff.y));
							samp1 /= 4.0;
							samp = (samp + samp1) / 2.0;

							if (reflectMap == 1 && refractMap == 1) {
								vec3 norm = normalize(vec3((samp.x - 0.5) * invert, -(samp.y - 0.5) * invert, samp.z - 0.5));
								float zm = norm.z;
								norm = norm * scale * ((1.0 + (norm.z - 0.5) * 2.0) * power);
								vec2 pixLoc = texCoord - offsetRot.xy + norm.xy;
								vec4 mix1 = texture2D(texture1, mod(vec2(pixLoc.x * xax - pixLoc.y * xay, pixLoc.x * xay + pixLoc.y * xax), vec2(1.0))) * tint;

								vec3 norm1 = normalize(vec3((samp.x - 0.5) * invert1, -(samp.y - 0.5) * invert1, samp.z - 0.5));
								norm1 = norm1 * scale1 * ((1.0 + (norm1.z - 0.5) * 2.0) * power1);
								vec2 pixLoc1 = texCoord - offsetRot.xy - norm1.xy;
								vec4 mix2 = texture2D(texture2, mod(vec2(pixLoc1.x * xax - pixLoc1.y * xay, pixLoc1.x * xay + pixLoc1.y * xax), vec2(1.0))) * tint1;
								gl_FragColor = mix(mix1, mix2, pow(zm, rrMix));
							} else if (reflectMap == 1) {
								vec3 norm = normalize(vec3((samp.x - 0.5) * invert,-(samp.y - 0.5) * invert, samp.z - 0.5));
								float zm = norm.z;
								norm = norm * scale * ((1.0 + (norm.z - 0.5) * 2.0) * power);
								vec2 pixLoc = texCoord - offsetRot.xy + norm.xy;
								vec4 mix1 = texture2D(texture1, mod(vec2(pixLoc.x * xax - pixLoc.y * xay, pixLoc.x * xay + pixLoc.y * xax), vec2(1.0))) * tint;
								gl_FragColor =  mix(mix1, tint1,  pow(zm, rrMix));
							} else if (refractMap == 1) {
								vec3 norm1 = normalize(vec3((samp.x - 0.5) * invert1,-(samp.y - 0.5) * invert1, samp.z - 0.5));
								float zm = norm1.z;
								norm1 = norm1 * scale1 * ((1.0 + (norm1.z - 0.5) * 2.0) * power1);
								vec2 pixLoc1 = texCoord - offsetRot.xy - norm1.xy;
								vec4 mix2 = texture2D(texture2, mod(vec2(pixLoc1.x * xax - pixLoc1.y * xay, pixLoc1.x * xay + pixLoc1.y * xax), vec2(1.0))) * tint1;
								gl_FragColor =  mix(tint, mix2,  pow(zm, rrMix));
							} else {
								vec3 norm = normalize(vec3((samp.x - 0.5) * invert, -(samp.y - 0.5) * invert, samp.z - 0.5));
								gl_FragColor =  mix(tint, tint1,  pow(norm.z, rrMix));
							}
                        }

                    `);
                }

                var uniformObj = {
                    texSize : [glF.width, glF.height],
                    power,
                    power1,
					offsetRot,
					invert: invert ? -1 : 1,
					invert1: invert1 ? -1 : 1,
                    scale: scale / 25,
                    scale1: scale1 / 25,
                    rrMix: mix === 0 ? 1 : mix < 0 ? (1 / (Math.abs(mix) * 4 + 1)) : mix * 4 + 1,
					reflectMap : {type:"uniform1i",value : reflectMap ? 1 : 0},
					refractMap : {type:"uniform1i",value : refractMap ? 1 : 0},
                    texture1 : {type :"uniform1i",value : reflectMap ? 1 : 0},
                    texture2 : {type :"uniform1i",value : refractMap ? 2 : 0},
                    tint : [tint[0]/255, tint[1]/255, tint[2]/255, 1],
                    tint1 : [tint1[0]/255, tint1[1]/255, tint1[2]/255, 1],
                };

                if (reflectMap) { reflectMap.bind(1) }
                if (refractMap) { refractMap.bind(2) }
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "ReflectMap",
                    description : "Reflection texture",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "RefractMap",
                    description : "Refraction texture map",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "invert",
                    description : "Inverts the x and y normals",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "scale",
                    description : "Reflection scale",
                    type : "Number",
                    range : {min : 0, max : 4, step : 0.01, def : 1},
                },{
                    name : "power",
                    description : "Reflection power",
                    type : "Number",
                    range : {min : 0, max : 4, step : 0.01, def : 1},
                },{
                    name : "tint",
                    description : "The colour of surface",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "invert1",
                    description : "Inverts refraction the x and y normals",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "scale1",
                    description : "Refraction  scale",
                    type : "Number",
                    range : {min : 0, max : 4, step : 0.01, def : 1},
                },{
                    name : "power1",
                    description : "Refraction  power",
                    type : "Number",
                    range : {min : 0, max : 4, step : 0.01, def : 1},
                },{
                    name : "tint1",
                    description : "The colour of refraction surface",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "mix",
                    description : "Relection Refraction mix",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "offsetRot",
                    description : "reflect offset",
                    type : "Vec3",
                    range : {def : [0.5,0.5,0.0]},
                }

            ],
        });
    }());
}

if (typeof filterGL !== "undefined") { // stratify
    (function () {
		const selectMethods = {
			Width: 0,
			Sin: 1,
			Random: 2,
			SinCos: 3,
		};
        var filter; // to access common properties for associated filters
        filterGL.filters.register("stratify", filter = {
            name : "stratify",
            description : "Adds color to height map depending on height",
            webGLFilters : null,
            shader : null,

            callback(colorMap,fromS, toS, fromH, toH, scale, select) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        //uniform sampler2D texture2;
                        varying vec2 texCoord;
						uniform vec2 texSize;
                        uniform float from;
                        uniform float fromS;
                        uniform float to;
                        uniform float toS;
                        uniform float scale;
						uniform int selectMethod;
						float seedF = 0.0;
						const float randC1 = 0.5453;
						const vec3 randC2 = vec3(0.9898, 0.233, 0.7182);
                        void main() {
                            vec4 samp = texture2D(texture, texCoord);
							float h = (samp.x + samp.y + samp.z) / 3.0;
							float h1 = ((h - from) / (to - from)) * (toS - fromS) + fromS;

							float x = texCoord.x;
							if (selectMethod == 1) { // sin
							    x = sin(texCoord.x * scale) * 0.5 + 0.5;

							} else if (selectMethod == 3) { // sin cos
							    x = sin((texCoord.x - 0.5) * scale * 10.0 * cos((texCoord.y - 0.5) * scale * 10.0)) * 0.5 + 0.5;

							} else if (selectMethod == 2) { // random
								seedF = fract(sin(dot(gl_FragCoord.xyz * scale + seedF * scale, randC2 * scale)) * randC1 * scale + seedF * scale);
								x = seedF;
							} else {
								x = mod(x * scale, 1.0);
							}
                            vec4 samp1 = (h >= from && h <= to) ? texture2D(texture1, vec2(x, h1)) : samp;
                            gl_FragColor = vec4(samp1.rgb,samp.a);

                        }

                    `);
                }
                var uniformObj = {
                    texSize : [glF.width,glF.height],
					from: fromH,
					to: toH,
					fromS: fromS,
					toS: toS,
					scale,
					selectMethod: {type:"uniform1i",value : selectMethods[select]},
                    texture1 : {type :"uniform1i",value : colorMap ? 1 : 0},

                };

                if (colorMap) {colorMap.bind(1)}
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "ColorMap",
                    description : "Colour texture map",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "FromLow",
                    description : "Height to start on sample map",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.025, def : 0},
                },{
                    name : "FromHigh",
                    description : "Height to end on sample map",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.025, def : 1},
                },{
                    name : "low",
                    description : "height to start",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0},
                },{
                    name : "high",
                    description : "height to end",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
					name : "X Scale",
					description : "Amount to scale selected x pixel",
                    type : "Number",
                    range : {min : 0, max : 8, step : 0.01, def : 1},
				},{
					name : "X Select",
					description : "Method used to select x coord",
					type : "String",
					range : ["Width","Sin","SinCos","Random"]
				}

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // occlutionHeight
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("occlutionHeight", filter = {
            name : "occlutionHeight",
            description : "Creates occlution map of height mapped texture",
            webGLFilters : null,
            shader : null,
            callback(heightMap, heightScale, spread, itterations, stepSpread, difuse, lightAngle, curve, level) {
                var glF = this.webGLFilters;
				const steps = 8;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        varying vec2 texCoord;
						uniform vec2 texSize;
                        uniform float heightScale;
						uniform float spread;
						uniform float angle;
						uniform float difuse;
						uniform float level;
						uniform float curve;
						const float tau = ${(Math.PI * 2).toFixed(6)};
                        void main() {
                            vec4 samp = texture2D(texture1, texCoord);
							float h = (samp.x + samp.y + samp.z) / 3.0;
							float shadow = 0.0;
							for (float i = 0.0; i < tau; i += ${(Math.PI / 4).toFixed(6)}) {
								vec3 rayDelta = vec3(cos((i * difuse) + angle) * texSize.x * spread, sin((i * difuse) + angle) * texSize.y * spread, heightScale);
								vec3 ray = vec3(texCoord, h) + rayDelta;
								float shadow1 = 0.0;
								for (int j = 0; j < ${steps}; j++) {
									if (shadow1 == 0.0) {
										vec4 samp1 = texture2D(texture1, ray.xy);
										float hh = (samp1.x + samp1.y + samp1.z) / 3.0;
										if (ray.z < hh) {
											shadow1 += float(${steps + 1} - j) / ${(steps + 1) + ".0"} / 9.0;
										}
										ray += rayDelta;
									}
								}

								shadow += shadow1;
							}
							shadow *= level;
							shadow = pow(shadow > 1.0 ? 0.0 : 1.0 - shadow, curve);
                            vec4 col = texture2D(texture, texCoord);
							gl_FragColor = vec4(col.rgb * shadow,col.a);
						}

                    `);
                }
                var uniformObj = {
                    texSize : [1 / glF.width, 1 / glF.height],
                    heightScale: (16 / 255) * heightScale,
					spread,
					difuse,
					level: level*level,
					angle: 0,
					curve: curve < 0 ? (curve * 10 - 1) ** 2 : 1 / (curve * 10 + 1) ** 2,
                    texture1 : {type :"uniform1i",value : heightMap ? 1 : 0},
                };
                if (heightMap) {heightMap.bind(1)}
				for(var j = 0; j < itterations; j++) {
					uniformObj.angle = (Math.PI / 4 * difuse) * (j /itterations) + lightAngle * (Math.PI / 180);
					uniformObj.spread *= stepSpread;
					glF.filter(this.shader, uniformObj);
				}
                return glF;
            },
            arguments : [{
                    name : "heightMap",
                    description : "Height map",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "heightScale",
                    description : "Controls darkness of corners",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.5},
                },{
                    name : "spread",
                    description : "How far the occlution will test in pixels",
                    type : "Number",
                    range : {min : 0.2, max : 8, step : 0.1, def : 1},
                },{
                    name : "steps",
                    description : "Number of itterations",
                    type : "Number",
                    range : {min : 1, max : 6, step : 1, def : 1},
                },{
                    name : "stepSpread",
                    description : "Modifies spread per step",
                    type : "Number",
                    range : {min : 0.5, max : 1.5, step : 0.025, def : 1},
                },{
					name : "difuse",
                    description : "To create shadow like FX",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.1},
                },{
					name : "angle",
                    description : "Light angle if difuse not 1 or -1",
                    type : "Number",
                    range : {min : 0, max : 360, step : 1, def : 1},
                },{
                    name : "curve",
                    description : "Falloff curve",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.01, def : 0},
                },{
					name : "level",
                    description : "The amount of shadow",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },


            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // omniLightFlat
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightFlat", filter = {
            name : "omniLightFlat",
            description : "Lights the image with omni directional light. Includes ambient and light colour, specular lighting, and simple bump mapping (height map)",
            webGLFilters : null,
            shader : null,
            callback(bumpMap,height,power,specular,specAmount,falloff,useImage,bumpAmount,falloffAmount,point,color,colorAmbient) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform vec2 texSize2;
                        uniform float height;
                        uniform float power;
                        uniform float specular;
                        uniform float specAmount;
                        uniform vec3 light;
                        uniform int falloff;
                        uniform int useImage;
                        uniform vec4 color1;
                        uniform vec4 colorAmbient;
                        uniform float bumpAmount;
                        uniform float falloffAmount;
                        const float pi = ${Math.PI.toFixed(6)};
                        void main() {
                            vec4 samp = texture2D(texture, texCoord);
                            vec4 sampa = texture2D(texture1, texCoord);
                            vec4 samp1 = texture2D(texture1, texCoord + vec2(0.0, -1.0) / texSize2);
                            vec4 samp2 = texture2D(texture1, texCoord + vec2(-1.0, 0.0) / texSize2);
                            float h = sampa.r + sampa.g + sampa.b;
                            float h1 = (((samp1.r + samp1.g + samp1.b) - h) / 3.0 )  * bumpAmount;
                            float h2 = (((samp2.r + samp2.g + samp2.b) - h) / 3.0 )  * bumpAmount;
                            float ang1 = 0.5 * pi - h1 * pi;
                            float ang2 = (0.5 + h2) * pi;
                            vec3 norm = normalize(vec3(-cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                            vec3 pos = vec3(texCoord.x, texCoord.y,0.0);
                            vec3 l = light * height + vec3(0.5, 0.5, 0);
                            vec3 toLight = normalize(l - pos);
                            vec3 toCamera = normalize(vec3(0.5, 0.5, 10) - pos);
                            vec3 lRef = normalize(2.0 * dot(norm, toLight) * norm - toLight);
                            float spec = dot(lRef, toCamera);
                            spec = clamp(spec, 0.0, 1.0);
                            spec = pow(spec, specular * specular) * power;
                            float val = clamp(dot(normalize(toLight), norm) , 0.0, 1.0)* power;
                            if(falloff == 1){
                                float len = length(toLight);
                                val /= (len * len) * falloffAmount;
                            }
                            vec3 col = vec3(1.0);
                            if(useImage == 1){
                                col = samp.rgb;
                            }
                            col *= 256.0;
                            col *= col;
                            vec3 col1 = color1.rgb * 256.0;
                            col1 *= col1;
                            vec3 colA = colorAmbient.rgb;

                            vec3 mix = (col * color1.rgb * val) + col * colA + (col1 * spec) * specAmount;
                            mix = sqrt(mix) / 256.0;
                            gl_FragColor = vec4(mix,samp.a);
                        }
                    `);
                }
                const lDir = Math.atan2(point[1] - 0.5, point[0] - 0.5);
                const lElv = (((point[1] - 0.5) ** 2 + (point[0] - 0.5) ** 2) ** 0.5) * Math.PI;
                const lx = Math.cos(lDir) * Math.sin(lElv);
                const ly = Math.sin(lDir) * Math.sin(lElv);
                const lz = Math.cos(lElv)
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : [lx,ly,lz],
                    height,
                    power,
                    specular: specular * specular * specular,
                    specAmount,
                    bumpAmount,
                    falloffAmount,
                    texture1 : {type :"uniform1i",value : bumpMap ? 1 : 0},
                    texSize2 : [
                        bumpMap ? bumpMap.width : glF.width,
                        bumpMap ? bumpMap.height : glF.height,
                    ],
                    color1 : [color[0]/255,color[1]/255,color[2]/255,1],
                    colorAmbient : [colorAmbient[0]/255,colorAmbient[1]/255,colorAmbient[2]/255,1],
                    falloff : {type:"uniform1i",value : falloff ? 1 : 0},
                    useImage : {type:"uniform1i",value : useImage ? 1 : 0}
                };
                if (bumpMap) {bumpMap.bind(1)}
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "BumpMap",
                    description : "Bump map image source",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : 0, max : 3, step : 0.1, def : 1},
                },{
                    name : "specular",
                    description : "Surface specular power (shininess)",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "specAmount",
                    description : "Surface reflectivity",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "falloff",
                    description : "If true then light will reduce depending on the distance",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "UseImage",
                    description : "If true then image is used to colour the surface",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "bumpAmount",
                    description : "The amount of bump mapping to apply",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.01, def : 1},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "Light",
                    description : "The location of the light relative to the image",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "color",
                    description : "The colour of he light",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "colorAmbient",
                    description : "The amount of ambient light",
                    type : "HexColor",
                    range : {def : "#223344"},
                },

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // omniLightTube
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightTube", filter = {
            name : "omniLightTube",
            description : "Maps image to tube and adds light",
            webGLFilters : null,
            shader : null,
            callback(bumpMapSource,height,power,specular,specAmount,falloff,useImage,bumpAmount,falloffAmount,point,color,colorAmbient) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform vec2 texSize2;
                        uniform float height;
                        uniform float power;
                        uniform float specular;
                        uniform float specAmount;
                        uniform vec3 light;
                        uniform int falloff;
                        uniform int useImage;
                        uniform vec4 color1;
                        uniform vec4 colorAmbient;
                        uniform float falloffAmount;
                        uniform float bumpAmount;
                        const float pi = ${Math.PI.toFixed(6)};
                        const float pi0p5 = ${(Math.PI/2).toFixed(6)};
                        void main() {

                            vec2 textPos = vec2(texCoord.x,(asin((texCoord.y - 0.5)*2.0)/pi0p5) * 0.5 + 0.5);
                            vec4 samp = texture2D(texture, textPos);
                            vec4 sampa = texture2D(texture1, textPos);
                            vec4 samp1 = texture2D(texture1, textPos + vec2(0.0,-1.0) / texSize2);
                            vec4 samp2 = texture2D(texture1, textPos + vec2(-1.0,0.0) / texSize2);
                            float h = sampa.r + sampa.g + sampa.b;
                            float h1 = (((samp1.r + samp1.g + samp1.b) - h) / 3.0)* bumpAmount;
                            float h2 = (((samp2.r + samp2.g + samp2.b) - h) / 3.0)* bumpAmount;
                            float ang = (1.0-texCoord.y) * pi;
                            float ang1 = ang - h1 * pi;
                            float ang2 = (0.5 + h2) * pi;
                            vec3 norm = normalize(vec3(-cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                            vec3 pos = vec3(texCoord.x, texCoord.y, sin(ang));
                            vec3 l = light * height + vec3(0.5, 0.5, 0);
                            vec3 toLight = normalize(l - pos);
                            vec3 toCamera = normalize(vec3(0.5, 0.5, 100) - pos);
                            vec3 lRef = normalize(2.0 * dot(norm, toLight) * norm - toLight);
                            float spec = dot(lRef, toCamera);
                            spec = clamp(spec, 0.0, 1.0);
                            spec = pow(spec, specular * specular) * power;
                            float val = clamp(dot(normalize(toLight), norm) , 0.0, 1.0)* power;
                            if(falloff == 1){
                                float len = length(toLight);
                                val /= (len * len) * falloffAmount;
                            }
                            vec3 col = vec3(1.0);
                            if(useImage == 1){
                                col = samp.rgb;
                            }
                            col *= 256.0;
                            col *= col;
                            vec3 col1 = color1.rgb * 256.0;
                            col1 *= col1;
                            vec3 colA = colorAmbient.rgb;

                            vec3 mix = (col * color1.rgb * val) + col * colA + (col1 * spec) * specAmount;
                            mix = sqrt(mix) / 256.0;
                            gl_FragColor = vec4(mix,samp.a);
                        }

                    `);
                }

                const lDir = Math.atan2(point[1] - 0.5, point[0] - 0.5);
                const lElv = (((point[1] - 0.5) ** 2 + (point[0] - 0.5) ** 2) ** 0.5) * Math.PI;
                const lx = Math.cos(lDir) * Math.sin(lElv);
                const ly = Math.sin(lDir) * Math.sin(lElv);
                const lz = Math.cos(lElv)

                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : [lx,ly,lz],
                    height: height * height,
                    power,
                    specular: specular * specular * specular,
                    specAmount,
                    falloffAmount,
                    bumpAmount,
                    texture1 : {type :"uniform1i",value : bumpMapSource ? 1 : 0},
                    texSize2 : [
                        bumpMapSource ? bumpMapSource.width : glF.width,
                        bumpMapSource ? bumpMapSource.height : glF.height,
                    ],
                    color1 : [color[0]/255,color[1]/255,color[2]/255,1],
                    colorAmbient : [colorAmbient[0]/255,colorAmbient[1]/255,colorAmbient[2]/255,1],
                    falloff : {type:"uniform1i",value : falloff ? 1 : 0},
                    useImage : {type:"uniform1i",value : useImage ? 1 : 0}
                };
                if (bumpMapSource) {bumpMapSource.bind(1)}
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "BumpMap",
                    description : "Bump map image source",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.1, def : 1},
                },{
                    name : "specular",
                    description : "Surface specular power (shininess)",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "specAmount",
                    description : "Surface reflectivity",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "falloff",
                    description : "If true then light will reduce depending on the distance",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "UseImage",
                    description : "If true then image is used to colour the surface",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "bumpAmount",
                    description : "The amount of bump mapping to apply",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.01, def : 1},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "Light",
                    description : "The location of the light relative to the image",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "color",
                    description : "The colour of he light",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "colorAmbient",
                    description : "The amount of ambient light",
                    type : "HexColor",
                    range : {def : "#223344"},
                },

            ],
        });
    }());
}
if (typeof filterGL !== "undefined") { // omniLightSphere
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightSphere", filter = {
            name : "omniLightSphere",
            description : "Maps square to sphere and adds light",
            webGLFilters : null,
            shader : null,
            callback(bumpMapSource,height,power,specular,specAmount,bumpMap,useImage,bumpAmount,point,color,colorAmbient) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform sampler2D texture1;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform vec2 texSize2;
                        uniform float height;
                        uniform float power;
                        uniform float specular;
                        uniform float specAmount;
                        uniform vec3 light;
                        uniform int bumpMap;
                        uniform int useImage;
                        uniform vec4 color1;
                        uniform vec4 colorAmbient;
                        uniform float bumpAmount;
                        const float pi = ${Math.PI.toFixed(6)};
                        const float pi0p5 = ${(Math.PI/2).toFixed(6)};
                        void main() {
                            vec2 toCent = texCoord-vec2(0.5);
                            float dist = length(toCent);
                            if(dist < 0.5){
                                float angA = atan(toCent.y, toCent.x);
                                float angB = dist  * pi;
                                float lat = asin(toCent.y*2.0);
                                vec2 textPos = vec2(asin(toCent.x*2.0 * (1.0/cos(lat)))/pi0p5,lat/pi0p5) * 0.5 + 0.5;
                                vec4 samp = texture2D(texture, textPos);
                                float ang1 = angA;
                                float ang2 = angB;
                                vec3 pos = normalize(vec3(vec2(cos(angA), sin(angA)) * sin(angB), cos(angB)));
                                vec3 norm;
                                if(bumpMap == 1){
                                    vec4 sampa = texture2D(texture1, textPos);
                                    vec4 samp1 = texture2D(texture1, textPos + vec2(0.0,-1.0) / texSize2);
                                    vec4 samp2 = texture2D(texture1, textPos + vec2(-1.0,0.0) / texSize2);
                                    float h = sampa.r + sampa.g + sampa.b;
                                    float h1 = (((samp1.r + samp1.g + samp1.b) - h) / 3.0) * bumpAmount;
                                    float h2 = (((samp2.r + samp2.g + samp2.b) - h) / 3.0) * bumpAmount;
                                    ang1 -= h1 * pi;
                                    ang2 += h2 * pi;
                                    norm = normalize(vec3(vec2(cos(ang1), sin(ang1)) * sin(ang2),cos(ang2)));
                                    //norm = normalize(vec3(-cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                                }else{
                                    norm = pos;
                                }
                                vec3 l = light * height + vec3(0.5, 0.5, 0);
                                vec3 toLight = normalize(l - pos);
                                vec3 toCamera = normalize(vec3(0.5, 0.5, 100) - pos);
                                vec3 lRef = normalize(2.0 * dot(norm, toLight) * norm - toLight);
                                float spec = dot(lRef, toCamera);
                                spec = clamp(spec, 0.0, 1.0);
                                spec = pow(spec, specular * specular) * power;
                                float val = clamp(dot(normalize(toLight), norm) , 0.0, 1.0)* power;
                                vec3 col = vec3(1.0);
                                if(useImage == 1){
                                    col = samp.rgb;
                                }
                                col *= 256.0;
                                col *= col;
                                vec3 col1 = color1.rgb * 256.0;
                                col1 *= col1;
                                vec3 colA = colorAmbient.rgb;

                                vec3 mix = (col * color1.rgb * val) + col * colA + (col1 * spec) * specAmount;
                                mix = sqrt(mix) / 256.0;
                                gl_FragColor = vec4(mix,samp.a);
                            }else{
                                gl_FragColor = vec4(0.0);
                            }
                        }

                    `);
                }
                const lDir = Math.atan2(point[1] - 0.5, point[0] - 0.5);
                const lElv = (((point[1] - 0.5) ** 2 + (point[0] - 0.5) ** 2) ** 0.5) * Math.PI;
                const lx = Math.cos(lDir) * Math.sin(lElv);
                const ly = Math.sin(lDir) * Math.sin(lElv);
                const lz = Math.cos(lElv)


                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : [lx,ly,lz],
                    height: height * height,
                    power,
                    specular: specular * specular * specular,
                    specAmount,
                    bumpAmount,
                    texture1 : {type :"uniform1i",value : bumpMapSource ? 1 : 0},
                    texSize2 : [
                        bumpMapSource ? bumpMapSource.width : glF.width,
                        bumpMapSource ? bumpMapSource.height : glF.height,
                    ],
                    color1 : [color[0]/255,color[1]/255,color[2]/255,1],
                    colorAmbient : [colorAmbient[0]/255,colorAmbient[1]/255,colorAmbient[2]/255,1],
                    bumpMap : {type:"uniform1i",value : bumpMap ? 1 : 0},
                    useImage : {type:"uniform1i",value : useImage ? 1 : 0}
                };
                if (bumpMapSource) {bumpMapSource.bind(1)}
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "BumpMapSource",
                    description : "Bump map image source",
                    type : "Image",
                    range : {def : null},
                },{
                    name : "height",
                    description : "Distance of light above the image",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "power",
                    description : "Light power",
                    type : "Number",
                    range : {min : 0, max : 3, step : 0.1, def : 1},
                },{
                    name : "specular",
                    description : "Surface specular power (shininess)",
                    type : "Number",
                    range : {min : 0, max : 10, step : 0.1, def : 1},
                },{
                    name : "specAmount",
                    description : "Surface reflectivity",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "bumpMap",
                    description : "If true then luminance is used to add a bumpmap",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "UseImage",
                    description : "If true then image is used to colour the surface",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "bumpAmount",
                    description : "The amount of bump mapping to apply",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.01, def : 1},
                },{
                    name : "Light",
                    description : "The location of the light relative to the image",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "color",
                    description : "The colour of he light",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "colorAmbient",
                    description : "The amount of ambient light",
                    type : "HexColor",
                    range : {def : "#223344"},
                },

            ],
        });
    }());
}

