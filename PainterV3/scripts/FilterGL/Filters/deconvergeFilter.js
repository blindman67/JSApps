if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("ComputerphileMazeSolver", filter = {
            name : "ComputerphileMazeSolver",
            description : "A time waster after watching Computerphile MazeSolver",
            webGLFilters : null,
            shader : null,
            callback(iter) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;
                        varying vec2 texCoord;
                        
                        uniform vec2 origin;
                        void main() {      
                            vec2 pixSize = vec2(1.0) / texSize; // size of a pixel
                            vec4 samp;
                            vec2 pos = texCoord;
                            vec3 black = vec3(0.2,0.2,0.2);
                            bool noChange = true;
                            vec4 changeTo;
                            int blackCount = 0;
                            int bits = 0;
                            bool lastBlack = false;
                            int blackRow = 0;
                            if(texCoord.x > pixSize.x && texCoord.x < 1.0-pixSize.x && texCoord.y > pixSize.y && texCoord.y < 1.0-pixSize.y){
                                samp = texture2D(texture, pos);
                                if(!all(lessThan(samp.rgb,black))){ // only if pixel is not black
                                    samp = texture2D(texture, pos - pixSize);
                                    if(all(lessThan(samp.rgb,black))) {
                                        blackCount += 1;
                                        bits += 128;
                                    }
                                    samp = texture2D(texture, pos + vec2(0.0,-pixSize.y));
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 64;
                                    }
                                    samp = texture2D(texture, pos + vec2(pixSize.x,-pixSize.y));
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 32;
                                    }
                                    samp = texture2D(texture, pos + vec2(pixSize.x,0.0));
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 16;
                                    }
                                    samp = texture2D(texture, pos + pixSize);
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 8;
                                    }
                                    samp = texture2D(texture, pos + vec2(0.0,pixSize.y));
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 4;
                                    }
                                    samp = texture2D(texture, pos + vec2(-pixSize.x,pixSize.y));
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 2;
                                    }
                                    samp = texture2D(texture, pos + vec2(-pixSize.x,0.0));
                                    if(all(lessThan(samp.rgb,black))){
                                        blackCount += 1;
                                        bits += 1;
                                    }
                                    if(blackCount >= 7){
                                        noChange = false;
                                        changeTo = vec4(0.0, 0.0, 0.0,1.0);
                                    }else if(blackCount == 5 &&
                                        (bits== ${0b11110001} ||
                                        bits== ${0b01111100} ||
                                        bits== ${0b00011111} ||
                                        bits== ${0b11000111} ||
                                        bits== ${0b11000111})
                                    ){
                                        noChange = false;
                                        changeTo = vec4(0.0, 0.0, 0.0,1.0);
                                    }else if(blackCount == 6 && (
                                        bits== ${0b10011111} ||
                                        bits== ${0b00111111} ||
                                        bits== ${0b11110011} ||
                                        bits== ${0b11111001} ||
                                        bits== ${0b11100111} ||
                                        bits== ${0b11001111} ||
                                        bits== ${0b01111110} ||
                                        bits== ${0b11111100})
                                    ){
                                        noChange = false;
                                        changeTo = vec4(0.0, 0.0, 0.0,1.0);
                                    }else if(blackCount == 6 && (
                                        bits== ${0b11101110} ||
                                        bits== ${0b10111011})
                                    ){
                                        noChange = false;
                                        changeTo = vec4(0.0, 1.0, 0.0,1.0);
                                    }else if(blackCount == 5 && (
                                        bits== ${0b10101110} ||
                                        bits== ${0b10101011} ||
                                        bits== ${0b11101010} ||
                                        bits== ${0b10111010} )
                                    ){
                                        noChange = false;
                                        changeTo = vec4(1.0, 0.0, 0.0,1.0);
                                        
                                    }else if(blackCount == 4 && bits == ${0b10101010}){
                                        noChange = false;
                                        changeTo = vec4(1.0, 1.0, 0.0,1.0);
                                        
                                    }else if(blackCount == 4){
                                        noChange = false;
                                        changeTo = vec4(0.0, 1.0, 1.0,1.0);
                                        
                                    }
                                }
                            }else{
                                samp = texture2D(texture, pos);
                                if(!any(lessThan(samp.rgb,black))){
                                    noChange = false;
                                    changeTo = vec4(1.0, 0.0, 0.0,1.0);
                                }
                            }
                            if(noChange){
                                gl_FragColor = texture2D(texture, texCoord); 
                            }else{
                                gl_FragColor = changeTo;
                            }
                        }                    
                    `);
                }
                var uniformObj = {
                    texSize : [glF.width,glF.height],
                }
                for(var i = 0; i < iter; i ++){
                    glF.filter(this.shader, uniformObj);          
                }
                return glF; 
            },            
            arguments : [{
                    name : "iter",
                    description : "number of iterations",
                    type : "Number",
                    range : {min : 1, max : 20, step : 1, def : 1},
                }
                
            ], 
        });
    }());
}




if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("deconvergeLinear", filter = {
            name : "deconvergeLinear",
            description : "Attempts to remove converging lines using a linear function. This will add curves to images with perspective",
            webGLFilters : null,
            shader : null,
            callback(amount,xAmount,xBallance,xScale,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float amount;
                        uniform float xAmount;
                        uniform float xBallance;
                        uniform float xScale;
                        
                        uniform vec2 origin;
                        void main() {      
                            float x = texCoord.x -origin.x;
                            float y = texCoord.y - origin.y;
                            float xx = abs(x);
                            x /= (1.0+y * amount + xx * xAmount + x * xBallance) ;
                            x *= xScale;
                            vec2 pos = vec2(x,y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }                    
                    `);
                }
                var uniformObj = {amount,xAmount,xScale,xBallance,origin : point};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "Amount",
                    description : "The overall amount of the fx",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "xAmount",
                    description : "The change of the fx as x distance from the origin point increases",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "xBallance",
                    description : "The balance of the xAmount from left to right",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "xScale",
                    description : "Uniform scale in the x direction ",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "point",
                    description : "The location of the nearest point on the structure to correct",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },
                
            ], 
        });
    }());
}
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("deconverge", filter = {
            name : "deconverge",
            description : "Attempts to remove converging lines",
            webGLFilters : null,
            shader : null,
            callback(amount,xAmount,xBallance,xScale,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float amount;
                        uniform float xAmount;
                        uniform float xBallance;
                        uniform float xScale;
                        
                        uniform vec2 origin;
                        void main() {      
                            float x = texCoord.x -origin.x;
                            float y = texCoord.y - origin.y;
                            float xx = abs(x);
                            x *= (1.0+y * amount + xx * xAmount + x * xBallance) ;
                            x *= xScale;
                            vec2 pos = vec2(x,y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }                    
                    `);
                }
                var uniformObj = {amount,xAmount,xScale,xBallance,origin : point};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "Amount",
                    description : "The overall amount of the fx",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "xAmount",
                    description : "The change of the fx as x distance from the origin point increases",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "xBallance",
                    description : "The balance of the xAmount from left to right",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "xScale",
                    description : "Uniform scale in the x direction ",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "point",
                    description : "The location of the nearest point on the structure to correct",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },
                
            ], 
        });
    }());
}
