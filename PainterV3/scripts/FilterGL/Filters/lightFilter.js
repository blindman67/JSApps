if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLight", filter = {
            name : "omniLight",
            description : "Corrects the image for to keep vertical parallel lines from converging",
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
                    name : "point",
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
if (typeof filterGL !== "undefined") {
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
                    name : "point",
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
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("heightTester", filter = {
            name : "heightTester",
            description : "Experiment",
            webGLFilters : null,
            shader : null,
            callback(reduce,distance,scale,turn) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform vec2 texSize;
                        uniform float reduce;
                        uniform float distance;
                        uniform float scale;
                        uniform float turn;
                        const float pi = 3.141592654;
                        const float pi0p5 = 1.5707963;
                        void main() {      
                            vec4 samp = texture2D(texture, texCoord);
                            float sum = samp.x + samp.y + samp.z;
                            vec2 dir = vec2(0.0,0.0);
                            
                            vec4 samp1 = texture2D(texture, texCoord + vec2(-1.0,-1.0) / texSize);
                            dir += vec2(-1.0,-1.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(0.0,-1.0) / texSize);
                            dir += vec2(0.0,-1.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(1.0,-1.0) / texSize);
                            dir += vec2(1.0,-1.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(-1.0,0.0) / texSize);
                            dir += vec2(-1.0,0.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(1.0,0.0) / texSize);
                            dir += vec2(1.0,0.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(-1.0,1.0) / texSize);
                            dir += vec2(-1.0,1.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(0.0,1.0) / texSize);
                            dir += vec2(0.0,1.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            samp1 = texture2D(texture, texCoord + vec2(1.0,1.0) / texSize);
                            dir += vec2(1.0,1.0) * ( (samp1.x + samp1.y + samp1.z) - sum );
                            float flow = 1.0-length(dir)/scale;
                            dir = normalize(dir);
                            float ang;
                            if(dir.x == 0.0){
                                ang = pi0p5 * sign(dir.y);
                            }else if(dir.x > 0.0){
                                ang = atan(dir.y/dir.x);
                            }else{
                                ang = pi - atan(dir.y/abs(dir.x));
                            }                            
                            dir = vec2(cos(ang + turn*flow),sin(ang + turn*flow)) * distance;

                            dir /= texSize;
                            samp1 = texture2D(texture, texCoord + dir);
                            gl_FragColor = vec4(samp.rgb * flow + (samp1.rgb * (1.0 -flow))*reduce,samp.a);
                        }                    
                    `);
                }
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    reduce,
                    distance,
                    scale,
                    turn : turn * Math.PI,
                 };
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "reduce",
                    description : "Amount of uphill pixel to copy",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.1, def : 1},
                },{
                    name : "distance",
                    description : "Distance to pick uphill pixel",
                    type : "Number",
                    range : {min : -4, max : 4, step : 0.1, def : 1},
                },{
                    name : "scale",
                    description : "scale the flow",
                    type : "Number",
                    range : {min : -8, max : 8, step : 0.1, def : 1},
                },{
                    name : "turn",
                    description : "turns away from uphill",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.1, def : 0},
                },
                
            ], 
        });
    }());
}

if (typeof filterGL !== "undefined") {
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
                        uniform vec2 light;
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
                            vec4 samp1 = texture2D(texture1, texCoord + vec2(0.0,-1.0) / texSize2);
                            vec4 samp2 = texture2D(texture1, texCoord + vec2(-1.0,0.0) / texSize2);
                            float h = sampa.r + sampa.g + sampa.b;
                            float h1 = (((samp1.r + samp1.g + samp1.b) - h) / 3.0 )  * bumpAmount;
                            float h2 = (((samp2.r + samp2.g + samp2.b) - h) / 3.0 )  * bumpAmount;
                            float ang1 = 0.5 * pi - h1 * pi;
                            float ang2 = (0.5 + h2) * pi;
                            vec3 norm = normalize(vec3(-cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                            vec3 pos = vec3(texCoord.x, texCoord.y,0.0);
                            vec3 l = vec3(light, height);
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
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : point, 
                    height,
                    power,
                    specular,
                    specAmount,
                    bumpAmount,
                    falloffAmount,
                    texture1 : {type :"uniform1i",value : bumpMap ? 1 : 0},
                    texSize2 : [
                        bumpMap ? bumpMap.width : glF.width,
                        bumpMap ? bumpMap.height : glF.height,
                    ],                    
                    color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                    colorAmbient : [colorAmbient[0]/255,colorAmbient[1]/255,colorAmbient[2]/255,colorAmbient[3]/255],
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
                    range : null,
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
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "point",
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
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightTube", filter = {
            name : "omniLightTube",
            description : "Corrects the image for to keep vertical parallel lines from converging",
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
                        uniform vec2 light;
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
                            //vec3 norm = normalize(vec3(cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                            vec3 norm = normalize(vec3(-cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                            vec3 pos = vec3(texCoord.x, texCoord.y, sin(ang));
                            float lightAng = (1.0-light.y) * pi;
                            vec3 l = vec3(light.x,vec2(cos(lightAng),sin(lightAng))* height * height);
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
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : point, 
                    height,
                    power,
                    specular,
                    specAmount,
                    falloffAmount,
                    bumpAmount,
                    texture1 : {type :"uniform1i",value : bumpMapSource ? 1 : 0},
                    texSize2 : [
                        bumpMapSource ? bumpMapSource.width : glF.width,
                        bumpMapSource ? bumpMapSource.height : glF.height,
                    ],                     
                    color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                    colorAmbient : [colorAmbient[0]/255,colorAmbient[1]/255,colorAmbient[2]/255,colorAmbient[3]/255],
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
                    range : null,
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
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "falloffAmount",
                    description : "The amount of falloff",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "point",
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


if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("omniLightSphere", filter = {
            name : "omniLightSphere",
            description : "Corrects the image for to keep vertical parallel lines from converging",
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
                        uniform vec2 light;
                        uniform int bumpMap;
                        uniform int useImage;
                        uniform vec4 color1;
                        uniform vec4 colorAmbient;
                        uniform float bumpAmount;                        
                        const float pi = ${Math.PI.toFixed(6)};
                        const float pi0p5 = ${(Math.PI/2).toFixed(6)};
                        ##direction## // uses filterGL library shader function direction
                        void main() {      
                            vec2 toCent = texCoord-vec2(0.5);
                            float dist = length(toCent);
                            if(dist < 0.5){
                                float angA = direction(toCent);
                                float angB = dist  * pi;
                                float lat = asin(toCent.y*2.0);
                                vec2 textPos = vec2(asin(toCent.x*2.0 * (1.0/cos(lat)))/pi0p5,lat/pi0p5) * 0.5 + 0.5;
                                vec4 samp = texture2D(texture, textPos);                                
                                float ang1 = angA;
                                float ang2 = angB;
                                vec3 pos = normalize(vec3(vec2(cos(angA), sin(angA)) * sin(angB),-cos(angB)));
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
                                    norm = normalize(vec3(vec2(cos(ang1), sin(ang1)) * sin(ang2),-cos(ang2)));
                                    //norm = normalize(vec3(-cos(ang2), vec2(cos(ang1), sin(ang1)) * sin(ang2)));
                                }else{
                                    norm = pos;
                                }
                                toCent = light-vec2(0.5);
                                dist = length(toCent);
                                float angLA = direction(toCent);
                                float angLB = dist  * pi;
                                vec3 l = normalize(vec3(vec2(cos(angLA), sin(angLA)) * sin(angLB),-cos(angLB)))*height*height;
                                vec3 toLight = normalize(l - pos);
                                vec3 toCamera = normalize(vec3(0.5, 0.5, -100) - pos);
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
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                    light : point, 
                    height,
                    power,
                    specular,
                    specAmount,
                    bumpAmount,
                    texture1 : {type :"uniform1i",value : bumpMapSource ? 1 : 0},
                    texSize2 : [
                        bumpMapSource ? bumpMapSource.width : glF.width,
                        bumpMapSource ? bumpMapSource.height : glF.height,
                    ],                     
                    color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                    colorAmbient : [colorAmbient[0]/255,colorAmbient[1]/255,colorAmbient[2]/255,colorAmbient[3]/255],
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
                    range : null,
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
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "point",
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