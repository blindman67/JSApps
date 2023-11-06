if(typeof filterGL !== "undefined" && false){   // legacy from webGL filters. The hue and saturation match the hue saturation filter from webGL filters but are way out so you can add this if you wish to match the old filters
    filterGL.filters.register(     
        "hueSatLum",   {              
            webGLFilters : null,  // required 
            shader : null,        
            callback(hue, sat, lum) {  // required
                if(this.webGLFilters === null){
                    throw new ReferenceError("Filter 'hueSatLum' is not ready to be used. Use registerFilter to activate the filter");
                }
                var glF = this.webGLFilters; // alias for lazy programmers
                if(!this.shader){
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;
                        uniform float hue;  
                        uniform float sat;
                        uniform float lum;
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            if(hue != 0.0){
                                float angle = hue * 3.14159265;
                                float s = sin(angle);
                                float c = cos(angle);
                                vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
                                float len = length(color.rgb);
                                color.rgb = vec3(
                                    dot(color.rgb, weights.xyz),
                                    dot(color.rgb, weights.zxy),
                                    dot(color.rgb, weights.yzx)
                                );
                            }
                            if(sat != 0.0){
                                float average = (color.r + color.g + color.b) / 3.0;
                                if (sat > 0.0) {
                                    color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - sat));
                                } else {
                                    color.rgb += (average - color.rgb) * (-sat);
                                }
                            }    
                            if(lum != 0.0){
                                color.rgb *= 1.0 + lum;
                            }
                            gl_FragColor = color; 
                        }
                   `);
                }
                glF.filter(this.shader, {hue , sat, lum}); 
                return glF; 
            },
            description : {
                text : "Filter adjusts the Hue Saturation and Luminance of the image.",
                author : "BM67",
                contact : "markspronck@gmail.com",
                notes : ""
            },
            arguments : [{
                    name : "Hue",
                    description : "Hue adjustment < 0 rotates down in frequency > 0 rotates up (up to blue end) ",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.02, def : 0.0},
                },{
                    name : "Saturation",
                    description : "Saturation adjustment.",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.02, def : 0.0},
                },{
                    name : "Luminance",
                    description : "Luminance adjustment.",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.02, def : 0.0},
                }
            ],
            presets : { // preset names are capitalised as they are meant to be human readable options.
                Defaults : {args : [0,0,0], description : "Default and does nothing."},
                BlackWhite : {args : [0,-1,0], description : "Removes all color by reducing saturation by 1 step"},
            }
        }   
    );
}
if(typeof filterGL !== "undefined"){  
    filterGL.filters.register(     
        "hueSatLumV2",   {              
            description : {
                text :"Filter adjusts the Hue Saturation and Luminance of the image.",
                author : "BM67",
                contact : "markspronck@gmail.com",
            },
            webGLFilters : null,  // required 
            shader : null,        
            callback(hue, sat, lum) {  // required
                var glF = this.webGLFilters; // alias for lazy programmers
                if(!this.shader){
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;
                        uniform float hue;  
                        uniform float sat;
                        uniform float lum;
                        varying vec2 texCoord;
                        ##rgb2HSL##
                        ##hsl2RGB##
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            gl_FragColor = vec4(hsl2RGB((rgb2HSL(color.rgb) + vec3(hue, 0.0, lum)) * vec3(1.0, sat, 1.0)), color.a);
                        }
                   `).useLinker();
                }
                glF.filter(this.shader, {hue , sat : 1.0 + sat, lum}); 
                return glF; 
            },
            arguments : [{
                    name : "hue",
                    description : "Hue adjustment < 0 rotates down in frequency > 0 rotates up (up to blue end) ",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.01, def : 0.0},
                },{
                    name : "saturation",
                    description : "Saturation adjustment.",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.01, def : 0.0},
                },{
                    name : "luminance",
                    description : "Luminance adjustment.",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.01, def : 0.0},
                }
            ],
        }   
    );
}
if(typeof filterGL !== "undefined"){ 
    filterGL.filters.register(     
        "HSLCurves",   {              
            description : {
                text : "Apply contrast, level and trim on Saturation and Luminance channels. Apply push and pull on the Hue channel.",
                author : "BM67",
                contact : "markspronck@gmail.com",
            },
            
            webGLFilters : null,  // required 
            shader : null,   
            curvePowerNorm(val){return Math.pow(((val * 3) + 5)/5,Math.log2(10));},            
            callback(hue, hueCenter, satContrast, satLevel, satTrim, lumContrast,lumLevel,lumTrim,mix,clampResult) {  // required
                var glF = this.webGLFilters; // alias for lazy programmers
                if(!this.shader){
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;
                        uniform float hue;  // contrast curves
                        uniform float hueCenter;
                        uniform float satContrast;
                        uniform float satLevel;  // Saturation Level
                        uniform float satTrim;  // Saturation trim
                        uniform float lumContrast;
                        uniform float lumLevel;  // luminance level
                        uniform float lumTrim;  // luminance trim
                        uniform float mixin; // how much of the effect to mix with the source
                        
                        varying vec2 texCoord;
                        ##easeInOut##
                        ##rgb2HSL##
                        ##hsl2RGB##
                        void main() {
                            vec4 srcColor = texture2D(texture, texCoord);
                            vec3 hsl = rgb2HSL(srcColor.rgb);
                            float h = mod(hsl.r + hueCenter, 1.0);
                            hsl = vec3(
                                easeInOut(h,hue) - hueCenter,
                                easeInOut(hsl.g, satContrast) * satLevel + satTrim,
                                easeInOut(hsl.b, lumContrast) * lumLevel + lumTrim
                            );
                            //gl_FragColor = vec4(hsl2RGB(hsl), srcColor.a);
                            gl_FragColor = mix(srcColor,vec4(hsl2RGB(hsl), srcColor.a),mixin);
                            
                        }
                   `).useLinker();
                   
                }
                hue = this.curvePowerNorm(hue);
                satContrast = this.curvePowerNorm(satContrast);
                lumContrast = this.curvePowerNorm(lumContrast);
                glF.filter(this.shader, {
                    hue , hueCenter : 0.5 - hueCenter,
                    satContrast, satLevel, satTrim,
                    lumContrast,lumLevel , lumTrim,
                    mixin : mix,
                    clampResult : {type : "uniform1i", value : clampResult ? 1 : 0},
                }); 
                return glF; 
            },
            arguments : [{
                    name : "hue",
                    description : "Values less than one pull the hues to the hue center, greater than one pushes the hue out from center",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.05, def : 0 },
                },{
                    name : "hueCenter",
                    description : "The center of the hue curve. The hue at this point will not change ",
                    type : "Number",
                    range : {min : -0.5, max : 1.5, step : 0.1, def : 0.5},
                },{
                    name : "satContrast",
                    description : "Increase or decrease saturation contrast",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.02, def : 0 },
                },{
                    name : "satLevel",
                    description : "Increases or decrease saturation level",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.02, def : 1},
                },{
                    name : "satTrim",
                    description : "Trims saturation up or down",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.02, def : 0 },
                },{
                    name : "lumContrast",
                    description : "Increase or decrease luminance contrast",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.02, def : 0 },
                },{
                    name : "lumLevel",
                    description : "Increases or decrease luminance level",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1 },
                },{
                    name : "lumTrim",
                    description : "Trims luminance up or down",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0 },
                },{
                    name : "mix",
                    description : "Trims luminance up or down",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.01, def : 1 },
                },{
                    name : "clampResult",
                    description : "If true then conversion from HSL to RGB is clamped, else the values are free to go out of range.",
                    type : "Boolean",
                    range : {def : true },
                }
            ],
        }   
    );
}
