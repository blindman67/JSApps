if(typeof filterGL !== "undefined"){ 
    filterGL.filters.register(     
        "threshold",   {              
            webGLFilters : null,  // required 
            shader : null,        
            description : "Threshold filter set a threshold for each RGBA channel. Pixels channels below the threshold are set to 0 (black) and above the threshold are set to 1 (white). Channels is a string that represents the channels to apply the thresholds too.",
            callback(red, green, blue, alpha, smoothStep, channels) {  // required
                var glF = this.webGLFilters; // alias for lazy programmers
                if(!this.shader){
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;
                        uniform float sStep;
                        uniform float Red;  // uppercase is channel to use
                        uniform float Green;
                        uniform float Blue;
                        uniform float Alpha;
                        uniform float red;  // lowercase is channel thresholds
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;                
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            gl_FragColor = smoothstep(
                                    vec4(red, green, blue, alpha) - vec4(sStep / 2.0), 
                                    vec4(red, green, blue, alpha) + vec4(sStep / 2.0), 
                                    color);
                            gl_FragColor = mix(color, gl_FragColor, vec4(Red, Green, Blue, Alpha)); 
                        }
                   `);
                }
                glF.filter(this.shader, {
                    red , green, blue, alpha,sStep : smoothStep,
                    Red : channels.indexOf("R") > -1 ? 1 : 0,
                    Green : channels.indexOf("G") > -1 ? 1 : 0,
                    Blue : channels.indexOf("B") > -1 ? 1 : 0,
                    Alpha : channels.indexOf("A") > -1 ? 1 : 0,                                         
                }); 
                return glF; 
            },
            arguments : [{
                    name : "red",
                    description : "Threshold for red channel.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.5}, // def is default 
                },{
                    name : "green",
                    description : "Threshold for green channel.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.5},
                },{
                    name : "blue",
                    description : "Threshold for blue channel.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.5},
                },{
                    name : "alpha",
                    description : "Threshold for alpha channel.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.5},
                },{
                    name : "Smooth step",
                    description : "Distance between top and bottom of thresholds.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 0.5},
                },{
                    name : "channels",
                    description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),

                },
            ],
        }   
    );
}
 

if(typeof filterGL !== "undefined"){ 
    filterGL.filters.register(     
        "tintFilter",   {              
            webGLFilters : null,  // required 
            shader : null,        
            description : "Apply a colour to the image being filtered",
            callback(colorHex,alpha,mix,channels) {  // required
                var glF = this.webGLFilters; // alias for lazy programmers
                if(!this.shader){
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;
                        ##standardMixUniforms##                  
                        uniform vec4 colorIn;
                        varying vec2 texCoord;
                        void main() {
                            vec4 src1Color = texture2D(texture, texCoord);
                            color = colorIn;                                    
                            ##standardMixResult##
                        }
                   `);
                }
                var colorIn = glF.hex2RGB(colorHex);
                colorIn[3] = alpha;
                colorIn[0] /= 255;
                colorIn[1] /= 255;
                colorIn[2] /= 255;
                var uniformObj = Object.assign({ colorIn },
                    this.shader.getLinkedInUniforms(
                        "standardMixUniforms",[
                            mix,
                            channels,
                            glF.width,
                            glF.height
                        ]
                    )
                );                
                glF.filter(this.shader, uniformObj); 
                return glF; 
            },
            arguments : [{
                    name : "color",
                    description : "The rgb hex color to tint the image as a 7 char string eg #FFFFFF",
                    type : "HexColor",
                    range : {def : "#FFFFFF"}, // def is default 
                },{
                    name : "alpha",
                    description : "The amount of alpha to mix in.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "mix",
                    description : "The amount to mix the convolution array result with the original image, 1 is full result, 0 is original image.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "channels",
                    description : "Which channels to set. Note that if not using all the channels the result will be the desired color minus the missing channels.",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                },
            ],
        }   
    );
}
 



