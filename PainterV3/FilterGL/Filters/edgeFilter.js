
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("shadow", filter = {
            name : "shadow",
            description : "Outlines parts of the image that are next to transparent pixels",
            webGLFilters : null,
            shader : null,
            callback(radius,blur, offset,mixin, color) {
                var glF = this.webGLFilters;
                var perim = Math.max(0.1,Math.PI * radius * 2);
                var maxPerim = Math.ceil(Math.PI * 8 * 2);
                if (this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float mixin;
                        uniform float perim;
                        uniform float radius;
                        uniform vec2 offset;
                        uniform vec4 color1;
                        const float pi2 = ${(Math.PI * 2).toFixed(6)};
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            vec2 pos = vec2(0.0,0.0);
                            float a;
                            float weight = 0.0;
                            if(color.a <1.0){
                                for(float i = 0.0; i < ${maxPerim.toFixed(1)}; i += 1.0){
                                    float a = (i/perim)*pi2;
                                    pos.x = cos(a) * radius / texSize.x;
                                    pos.y = sin(a) * radius / texSize.y;
                                    vec4 samp = texture2D(texture, texCoord + pos - offset);
                                    weight += (samp.a / 8.0);
                                    if(i >= perim-1.0 || weight >= 1.0) break;
                                }
                                if(weight > 0.0){
                                    if(weight > 1.0) weight = 1.0;
                                    weight *= color1.a;
                                    a = color.a + weight * (1.0-color.a);
                                    gl_FragColor = vec4(vec3((color.rgb * color.a + color1.rgb * weight * ( 1.0- color.a))/a),a );                                
                                    gl_FragColor = mix(color, gl_FragColor, mixin);
                                }else{
                                    gl_FragColor = color;
                                }
                            }else{
                                gl_FragColor = color;
                            }
                        }
                    `);
                }
                offset[0] -= 0.5;
                offset[1] -= 0.5;
                

                var uniformObj = Object.assign({
                        mixin,offset,radius,perim,
                        texSize: [glF.width, glF.height] , 
                        color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                        
                    },
                );
                if(blur === 0){
                    glF.filter(this.shader, uniformObj);                    
                }else{
                    var offsetStep = [offset[0]/blur,offset[1]/blur];
                    var radiusStep = radius / blur;
                    for(var i = 0; i < blur; i ++){                    
                        uniformObj.offset[0] = offsetStep[0] * i;
                        uniformObj.offset[1] = offsetStep[1] * i;
                        uniformObj.radius = i * radiusStep;
                        uniformObj.perim =  Math.max(0.1,Math.PI * i * radiusStep * 2);
                        glF.filter(this.shader, uniformObj);
                    }
                }
          
                return glF; 
            },
            arguments : [{
                    name : "radius",
                    description : "Radius of outline",
                    type : "Number",
                    range : {min : 1, max : 8, step : 0.5, def : 1},
                },{
                    name : "blur",
                    description : "amount of blur",
                    type : "Number",
                    range : {min : 0, max : 8, step : 0.5, def : 1},
                },{
                    name : "point",
                    description : "Offset of shadow",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                },{
                    name : "color",
                    description : "Outline color",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                }
            ], 
        });
    }());
}




if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("pixelOutline", filter = {
            name : "pixelOutline",
            description : "Outlines parts of the image that are next to transparent pixels",
            webGLFilters : null,
            shader : null,
            callback(radius, mixin, color) {
                var glF = this.webGLFilters;
                var perim = Math.PI * radius * 2;
                var maxPerim = Math.ceil(Math.PI * 8 * 2);
                if (this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float mixin;
                        uniform float perim;
                        uniform float radius;
                        uniform vec4 color1;
                        const float pi2 = ${(Math.PI * 2).toFixed(6)};
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            vec2 pos = vec2(0.0,0.0);
                            float a;
                            float weight = 0.0;
                            if(color.a <1.0){
                                for(float i = 0.0; i < ${maxPerim.toFixed(1)}; i += 1.0){
                                    float a = (i/perim)*pi2;
                                    pos.x = cos(a) * radius / texSize.x;
                                    pos.y = sin(a) * radius / texSize.y;
                                    vec4 samp = texture2D(texture, texCoord + pos);
                                    weight += samp.a;
                                    if(i >= perim-1.0 || weight >= 1.0) break;
                                }
                                if(weight > 0.0){
                                    if(weight > 1.0) weight = 1.0;
                                    a = color.a + weight * (1.0-color.a);
                                    gl_FragColor = vec4(vec3((color.rgb * color.a + color1.rgb * weight * ( 1.0- color.a))/a),a);                                
                                    gl_FragColor = mix(color, gl_FragColor, mixin);
                                }else{
                                    gl_FragColor = color;
                                }
                            }else{
                                gl_FragColor = color;
                            }
                        }
                    `);
                }

                var uniformObj = Object.assign({
                        mixin,radius,perim,
                        texSize: [glF.width, glF.height] , 
                        color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
                        
                    },
                );
                glF.filter(this.shader, uniformObj);
          
                return glF; 
            },
            arguments : [{
                    name : "radius",
                    description : "Radius of outline",
                    type : "Number",
                    range : {min : 1, max : 8, step : 0.5, def : 1},
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                },{
                    name : "color",
                    description : "Outline color",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                }
            ], 
        });
    }());
}
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("pixelErode", filter = {
            name : "pixelErode",
            description : "Removes pixels near transparent edges",
            webGLFilters : null,
            shader : null,
            callback(radius, erodeSteps,exposure,erodeType,mixin) {
                var glF = this.webGLFilters;

                var maxPerim = Math.ceil(Math.PI * 8 * 2);
                if (this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float mixin;
                        uniform float perim;
                        uniform int erodeType;
                        uniform float radius;
                        uniform float exposure;
                        const float pi2 = ${(Math.PI * 2).toFixed(6)};
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            vec2 pos = vec2(0.0,0.0);
                            float a;
                            float weight = 0.0;
                            if(color.a > 0.0){
                                for(float i = 0.0; i < ${maxPerim.toFixed(1)}; i += 1.0){
                                    float a = (i/perim)*pi2;
                                    pos.x = cos(a) * radius / texSize.x;
                                    pos.y = sin(a) * radius / texSize.y;
                                    vec4 samp = texture2D(texture, texCoord + pos);
                                    if(samp.a < 1.0){
                                        if(erodeType == 0){
                                            weight += 1.0-samp.a;
                                        }else if(erodeType == 2){
                                            weight += 1.0-((samp.r + samp.g + samp.b) / 3.0);
                                        }else if(erodeType == 2){
                                            weight += ((samp.r + samp.g + samp.b) / 3.0);
                                        }
                                    }
                                    if(i >= perim-1.0 || weight >= perim * exposure) break;
                                }
                                if(weight > 0.0){
                                    weight /= perim * exposure;
                                    gl_FragColor = vec4(color.rgb,color.a-weight);
                                    gl_FragColor = mix(color, gl_FragColor, mixin);
                                }else{
                                    gl_FragColor = color;
                                }
                            }else{
                                gl_FragColor = color;
                            }
                        }
                    `);
                }
                erodeType = ["alphaDist","darkFirst","lightFirst"].indexOf(erodeType);
                var perim = Math.PI * erodeSteps * 2;
                var count = radius;
                while(count > 0){
                    if(count < erodeSteps){
                        perim = Math.PI * count * 2;
                    }

                    var uniformObj = {
                        mixin,perim,exposure,
                        erodeType : {type :"uniform1i", value :erodeType},
                        radius : erodeSteps,
                        texSize: [glF.width, glF.height] ,                                   
                    }
                    glF.filter(this.shader, uniformObj);
                    count -= erodeSteps;
                }
          
                return glF; 
            },
            arguments : [{
                    name : "radius",
                    description : "Radius of outline",
                    type : "Number",
                    range : {min : 0.1, max : 8, step : 0.5, def : 1},
                },{
                    name : "erodeSteps",
                    description : "The amount of erode per pass",
                    type : "Number",
                    range : {min : 1, max : 3, step : 0.1, def : 1},
                },{
                    name : "exposure",
                    description : "The amount of erode as a factor of exposed edge. Higher values for slower erosion",
                    type : "Number",
                    range : {min : 0.2, max : 3, step : 0.1, def : 0.6},
                },{
                    name : "erodeType",
                    description : "How erosion is applied",
                    type : "String",
                    range : ["alphaDist","darkFirst","lightFirst"],
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                }
            ], 
        });
    }());
}
