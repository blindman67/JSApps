
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("perspectiveTaper", filter = {
            name : "perspectiveTaper",
            description : "tapers the image in x and y directions with perspective correction",
            webGLFilters : null,
            shader : null,
            callback(topAmount,topOffset,bottomAmount,bottomOffset) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setVertextSource(`
                        attribute vec2 vertex;
                        attribute vec2 textureCoordinates;
                        uniform float topAmount;
                        uniform float bottomAmount;
                        uniform float topOffset;
                        uniform float bottomOffset;                          
                        varying vec2 texCoord;
                        void main() {
                            texCoord = textureCoordinates;
                            float m = (1.0-bottomAmount) - (1.0-topAmount);
                            float mO = (bottomOffset - topOffset);                            
                            vec2 pos = vec2(vertex * 2.0 - 1.0);
                            float w = (pos.y * m + (1.0-topAmount));
                            pos.x -= 1.0;
                            pos.x += (pos.y * mO + topOffset);
                           // pos = vec2((pos.x + (pos.y * mO + topOffset)) / w, pos.y);
                            gl_Position = vec4(pos+vec2(0.0,(1.0-w) * -sign(pos.y)), 0.0, w);
                        }
                    `);
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        void main() {      
                            gl_FragColor = texture2D(texture, texCoord);
                        }                    
                    `);
                }
                topOffset = 1-topOffset;
                bottomOffset = 1-bottomOffset;
                var uniformObj = {topAmount,topOffset,bottomAmount,bottomOffset};
                glF.clearBufferBeforDraw();
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "topAmount",
                    description : "Amount to taper on top",
                    type : "Number",
                    range : {min : -2, max : 0.5, step : 0.001, def : 0},
                },{
                    name : "topOffset",
                    description : "Amount top move top left or right",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.001, def : 0},
                },{
                    name : "bottomAmount",
                    description : "Amount to taper on bottom",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.001, def : 0},
                },{
                    name : "bottomOffset",
                    description : "Amount top move bottom left or right",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.001, def : 0},
                }
                
            ], 
        });
    }());
}

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("linearTaper", filter = {
            name : "linearTaper",
            description : "tapers the image in x and y directions",
            webGLFilters : null,
            shader : null,
            callback(topAmount,topOffset,bottomAmount,bottomOffset) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform float topAmount;
                        uniform float topOffset;
                        uniform float bottomAmount;
                        uniform float bottomOffset;                        
                        varying vec2 texCoord;
                        void main() {      
                            float m = (1.0-bottomAmount) - (1.0-topAmount);
                            float mO = (bottomOffset - topOffset);
                            vec2 pos = texCoord -vec2(0.5,0.0);                            
                            pos = vec2((pos.x + (pos.y * mO + topOffset)) / (pos.y * m + (1.0-topAmount)), pos.y);
                            pos += vec2(0.5,0.0);
                            if(pos.y < 0.0 || pos.x < 0.0 || pos.y > 1.0 || pos.x > 1.0){
                                gl_FragColor = vec4(0.0);
                            }else{
                                gl_FragColor = texture2D(texture, pos);
                            }
                        }                    
                    `);
                }
                topOffset = 1-topOffset;
                bottomOffset = 1-bottomOffset;
                var uniformObj = {topAmount,topOffset,bottomAmount,bottomOffset};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "topAmount",
                    description : "Amount to taper on top",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.001, def : 0},
                },{
                    name : "topOffset",
                    description : "Amount top move top left or right",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.001, def : 1},
                },{
                    name : "bottomAmount",
                    description : "Amount to taper on bottom",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.001, def : 0},
                },{
                    name : "bottomOffset",
                    description : "Amount top move bottom left or right",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.001, def : 1},
                }
                
            ], 
        });
    }());
}
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("skew", filter = {
            name : "skew",
            description : "Skews image",
            webGLFilters : null,
            shader : null,
            callback(xAmount,xOffset,yAmount,yOffset) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform float xAmount;
                        uniform float xOffset;
                        uniform float yAmount;
                        uniform float yOffset;                        
                        varying vec2 texCoord;
                        void main() {      
                            vec2 pos = texCoord -vec2(0.5);//+ vec2(xOffset,yOffset);                            
                            pos = vec2(pos.x + pos.y * xAmount, pos.y);
                            pos = vec2(pos.x, pos.y + pos.x * yAmount);
                            pos += vec2(0.5) + vec2(xOffset,yOffset);
                            if(pos.y < 0.0 || pos.x < 0.0 || pos.y > 1.0 || pos.x > 1.0){
                                gl_FragColor = vec4(0.0);
                            }else{
                                gl_FragColor = texture2D(texture, pos);
                            }
                        }                    
                    `);
                }
                var uniformObj = {xAmount,xOffset,yAmount,yOffset,texSize: [glF.width, glF.height]};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "xAmount",
                    description : "Amount to skew in the x direction",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.001, def : 0},
                },{
                    name : "xOffset",
                    description : "Amount to offset pixels in the x direction",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.001, def : 0},
                },{
                    name : "yAmount",
                    description : "Amount to skew in the y direction",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.001, def : 0},
                },{
                    name : "yOffset",
                    description : "Amount to offset pixels in the y direction",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.001, def : 0},
                }
            ], 
        });
    }());
}

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("displaceRepeat", filter = {
            name : "displaceRepeat",
            description : "Applies distortions across the image",
            webGLFilters : null,
            shader : null,
            shaders : {
                
            },
            displaceTypes : {
                waveyVertical : `
                         vec2 distortPos = (texCoord + origin)* vec2(1.0,aspect) * repeat * pi2;
                         vec2 offset = vec2(cos(modifyA),sin(modifyA)) * sin(distortPos.x);
                         offset *= amount;
                         pos  = texCoord+offset;
                `,
                waveyHorizontal : `
                         vec2 distortPos = (texCoord + origin)* vec2(1.0,aspect) * repeat * pi2;
                         vec2 offset = vec2(cos(modifyA + pi0p5),sin(modifyA + pi0p5)) * sin(distortPos.y);
                         offset *= amount;
                         pos  = texCoord+offset;
                `,
                waveyAngled : `
                         mat2 m;
                         m[0] = vec2(cos(-modifyA),sin(-modifyA));
                         m[1] = vec2(-sin(-modifyA),cos(-modifyA));
                         vec2 distortPos = (texCoord + origin)* vec2(1.0,aspect) * repeat * pi2;
                         distortPos *= m;
                         vec2 offset = vec2(cos(modifyA),sin(modifyA)) * sin(distortPos.x);
                         offset *= amount;                       
                         pos  = texCoord+offset;
                `,
                cells : `
                         mat2 m;
                         m[0] = vec2(cos(-modifyA),sin(-modifyA));
                         m[1] = vec2(-sin(-modifyA),cos(-modifyA));
                         vec2 distortPos = (texCoord + origin)* vec2(1.0,aspect) * repeat * pi2;
                         vec2 offset = vec2(sin(distortPos.x+modifyA),cos(distortPos.x+modifyA));
                         distortPos *= m;
                         offset += vec2(sin(distortPos.y+modifyB),cos(distortPos.y+modifyB));
                         offset *= amount;                        
                         pos  = texCoord+offset;
                `,
                cells2 : `
                         mat2 m;
                         m[0] = vec2(cos(-modifyA),sin(-modifyA));
                         m[1] = vec2(-sin(-modifyA),cos(-modifyA));
                
                         vec2 distortPos = (texCoord + origin)* vec2(1.0,aspect) * repeat * pi2;
                         vec2 offset = vec2(sin(distortPos.x*modifyA),cos(distortPos.x*modifyA));
                         distortPos *= m;
                         offset += vec2(sin(distortPos.y*modifyB),cos(distortPos.y*modifyB));
                         offset *= amount;                        
                         pos  = texCoord+offset;
                         distortPos = (texCoord + origin)* vec2(1.0,aspect) * repeat * pi2 * modifyC;
                         offset = vec2(sin(distortPos.x+modifyA),cos((distortPos.x+modifyA)*modifyC));
                         distortPos *= m;
                         offset += vec2(sin((distortPos.y+modifyB)*modifyC),cos(distortPos.y+modifyB));
                         offset *= amount;        
                         pos  += offset;
                `,
            },
            
            callback(type,repeat,amount,modifyA,modifyB,modifyC,easing,point,mixin,color) {
                var glF = this.webGLFilters;
                if (this.shaders[type] === undefined){
                    this.shaders[type] = glF.Shader(null, null).useLinker();
                    this.shaders[type].setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float mixin;
                        uniform float amount;
                        uniform float repeat;
                        uniform float modifyA;
                        uniform float modifyB;
                        uniform float modifyC;
                        uniform float power;
                        uniform vec2 origin;
                        
                        varying vec2 texCoord;
                        
                        const float pi2 = 6.28318531;
                        const float pi = 3.141592654;
                        const float pi0p5 = 1.5707963;  
                        ##easeInOut##
                        ##direction##

                        void main() {      
                            vec2 pos;
                            float aspect = texSize.x / texSize.y;
                            vec4 color = texture2D(texture, texCoord);                        
                            ${this.displaceTypes[type]}
                        
                            gl_FragColor = texture2D(texture, pos);
                            gl_FragColor = mix(color, gl_FragColor, mixin);               
                        }                    

                    `);
                }

                var uniformObj = Object.assign({
                        type,repeat,mixin,
                        modifyA : modifyA * Math.PI ,
                        modifyB : modifyB * Math.PI ,
                        modifyC : modifyC * Math.PI ,
                        power : easing,
                        origin : point,
                        amount : Math.sign(amount) * Math.pow(amount,3),
                        texSize: [glF.width, glF.height] , 
                        
                    },
                );
                glF.filter(this.shaders[type], uniformObj);
          
                return glF; 
            },
            
            arguments : [{
                    name : "type",
                    description : "Type of displacement applied",
                    type : "String",
                    range : null,
                },{
                    name : "repeat",
                    description : "the size of the repeating FX",
                    type : "Number",
                    range : {min : -16, max : 16, step : 0.01, def : 0.01},
                },{
                    name : "Amount",
                    description : "The amount of the FX",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.01, def : 0.01},
                },{
                    name : "modifyA",
                    description : "FX modifier A",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "modifyB",
                    description : "FX modifier B",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "modifyC",
                    description : "FX modifier C",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "easing",
                    description : "If there is an easing calculation this is the amount",
                    type : "Number",
                    range : {min : 0.01, max : 8, step : 0.01, def : 1},
                },{
                    name : "point",
                    description : "A 2D point coordinate",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                }
            ], 
        });
        filter.arguments[0].range = Object.keys(filter.displaceTypes);
    }());
}




if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("displace", filter = {
            name : "displace",
            description : "Applys bulges, twists, pinches and more",
            webGLFilters : null,
            shader : null,
            shaders : {
                
            },
            displaceTypes : {
                pinch : `float dist = 1.0 - clamp(distance(texCoord,origin) / amount,0.0,1.0);
                         dist = easeInOut(dist,power);
                         float zoom = 1.0 + dist * zoomAmount;
                         pos  = origin + (texCoord - origin) * zoom ;
                `,
                bulge :`float dist = 1.0 - clamp(distance(texCoord,origin) / amount,0.0,1.0);
                         dist = pow(easeInOut(dist,power),power);
                         float zoom = 1.0 - dist * zoomAmount;
                         pos  = origin + (texCoord - origin) * zoom ;            
                `,
                twist : `float distA = distance(texCoord,origin);
                         float dist = 1.0 - clamp(distA / amount,0.0,1.0);
                         float dir = direction(texCoord - origin);
                         dist = easeInOut(dist,power);
                         dir += dist * twist * pi2 * 2.0;
                         //float zoom = 1.0 - dist * zoomAmount;
                         pos  = origin + vec2(cos(dir),sin(dir)) * distA ;
                `,
                distroto : `float distA = distance(texCoord,origin);
                         float dir = direction(texCoord - origin);
                         float dist = 1.0 - clamp(distA / amount,0.0,1.0);
                         float zoom = 1.0 - dist * zoomAmount * sin(dir*2.0);
                         pos  = origin + (texCoord - origin) * zoom * vec2(cos(dir*twist),sin(dir));;            
                         
                         
                         
                 `,
                twistpinch : `float distA = distance(texCoord,origin);
                         float dist = 1.0 - clamp(distA / amount,0.0,1.0);
                         float dir = direction(texCoord - origin);
                         dist = easeInOut(dist,power);
                         dir += dist * twist * pi2 * 2.0;
                         float zoom = 1.0 + dist * zoomAmount;
                         pos  = origin + vec2(cos(dir),sin(dir)) * distA * zoom ;
                `,
                twistbulge : `float distA = distance(texCoord,origin);
                         float dist = 1.0 - clamp(distA / amount,0.0,1.0);
                         float dir = direction(texCoord - origin);
                         dist = easeInOut(dist,power);
                         dir += dist * twist * pi2 * 2.0;
                         float zoom = 1.0 - dist * zoomAmount;
                         pos  = origin + vec2(cos(dir),sin(dir)) * distA * zoom ;
                `,            
            },
            
            callback(type,amount,easing,twist,zoomAmount,point,mixin,color) {
                var glF = this.webGLFilters;
                if (this.shaders[type] === undefined){
                    this.shaders[type] = glF.Shader(null, null).useLinker();
                    this.shaders[type].setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float mixin;
                        uniform float amount;
                        uniform float power;
                        uniform float twist;
                        uniform float zoomAmount;
                        uniform vec2 origin;
                        
                        varying vec2 texCoord;
                        
                        const float pi2 = 6.28318531;
                        const float pi = 3.141592654;
                        const float pi0p5 = 1.5707963;  
                        ##easeInOut##
                        ##direction##

                        void main() {      
                            vec2 pos;
                            vec4 color = texture2D(texture, texCoord);                        
                            ${this.displaceTypes[type]}
                        
                            gl_FragColor = texture2D(texture, pos);
                            gl_FragColor = mix(color, gl_FragColor, mixin);               
                        }                    

                    `);
                }

                var uniformObj = Object.assign({
                        type,amount,twist,zoomAmount,mixin,
                        power : easing,
                        origin : point,
                        texSize: [glF.width, glF.height] , 
                        
                    },
                );
                glF.filter(this.shaders[type], uniformObj);
          
                return glF; 
            },
            
            arguments : [{
                    name : "type",
                    description : "Type of displacement applied",
                    type : "String",
                    range : null,
                },{
                    name : "amount",
                    description : "??",
                    type : "Number",
                    range : {min : -2, max : 3, step : 0.01, def : 0.01},
                },{
                    name : "easing",
                    description : "How quickly the effect starts and ends",
                    type : "Number",
                    range : {min : 0.001, max : 4, step : 0.01, def : 1},
                },{
                    name : "twist",
                    description : "amount of twist",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "zoomAmount",
                    description : "The amount of zoom",
                    type : "Number",
                    range : {min : -3, max : 3, step : 0.01, def : 0},
                },{
                    name : "point",
                    description : "A 2D point coordinate",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                }
            ], 
        });
        filter.arguments[0].range = Object.keys(filter.displaceTypes);
    }());
}

