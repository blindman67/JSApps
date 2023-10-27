
// experimental fun filter
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; 
        filterGL.filters.register("oneBitNoise", filter = {
            name : "oneBitNoise",
            description : "Dithers image to 1 bit (black white) using random noise ",
            webGLFilters : null,
            shader : null,
            callback(seedVal, mix, channels) {
                var glF = this.webGLFilters;
                if (this.shader === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float seedVal;
                        ##standardMixUniforms##                        
                        ##randomF##
                        void main() {
                            seedF = seedVal;
                            float sum;

                            vec4 color;  
                            vec4 src1Color = texture2D(texture, texCoord);
                            float minC = min(min(src1Color.r, src1Color.g), src1Color.b);
                            float maxC = max(max(src1Color.r, src1Color.g), src1Color.b);
                            if(minC == maxC) sum = minC;
                            else sum = (maxC + minC) / 2.0;
                            if(sum < randomF()){
                                color = vec4(0.0,0.0,0.0,src1Color.a);
                            }else{
                                color = vec4(1.0,1.0,1.0,src1Color.a);
                            }
                            ##standardMixResult##   
                        }
                    `);
                }
                var uniformObj = Object.assign({
                        seedVal: seedVal / 32,
                    },
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
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                name : "seed",
                description : "Random seed value.",
                type : "Number",
                range : {min : 0, max : 32, step : 0.001, def : 1},
            },{
                name : "mix",
                description : "",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }], 
        });
    }());
}

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; 
        filterGL.filters.register("addNoise", filter = {
            name : "addNoise",
            description : "adds noise to the image ",
            webGLFilters : null,
            shader : null,
            callback(seedVal, amount, offset,distribution,cover, mix, channels) {
                var glF = this.webGLFilters;
                if (this.shader === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float seedVal;
                        uniform float amount;
                        uniform float offset;
                        uniform float cover;
                        uniform float distribution;
                        ##standardMixUniforms##                        
                        ##randomF##
                        void main() {
                            seedF = seedVal;
                            vec4 color;
                            vec4 src1Color = texture2D(texture, texCoord);
                            float rand = pow(randomF()*0.8,distribution)*(1.0/0.8);
                            if(randomF() < offset){
                                rand = -rand;
                            }
                            if(randomF() < cover){
                                color = src1Color + vec4(rand * amount);      
                            }else{
                                color = src1Color;
                            }
                            ##standardMixResult##   
                        }
                    `);
                }
                var uniformObj = Object.assign({
                        seedVal: seedVal / 32,
                        amount,
                        offset,
                        distribution,
                        cover,
                    },
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
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                name : "seed",
                description : "Random seed value.",
                type : "Number",
                range : {min : 0, max : 32, step : 0.001, def : 1},
            },{
                name : "amount",
                description : "The amount of noise to add",
                type : "Number",
                range : {min : 0, max : 2, step : 0.01, def : 1},
            },{
                name : "offset",
                description : "Add or subtract ratio 0.5 equally distributed. 0 All added 1 all subtracted",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 0.5},
            },{
                name : "distribution",
                description : "Tendency for noise to be distributed towards zero. 1 for even distribution, > 1 noise is grouped near to 0",
                type : "Number",
                range : {min : 1, max : 5, step : 0.2, def : 1},
            },{
                name : "cover",
                description : "Amount of pixels effected by noise filter. 0 no pixels are effected, 1 all pixels",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "mix",
                description : "",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }], 
        });
    }());
}
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; 
        filterGL.filters.register("multiplyNoise", filter = {
            name : "multiplyNoise",
            description : "adds noise to the image by multiplication ",
            webGLFilters : null,
            shader : null,
            callback(seedVal, amount, offset,distribution,cover, mix, channels) {
                var glF = this.webGLFilters;
                if (this.shader === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float seedVal;
                        uniform float amount;
                        uniform float offset;
                        uniform float cover;
                        uniform float distribution;
                        ##standardMixUniforms##                        
                        ##randomF##
                        void main() {
                            seedF = seedVal;
                            vec4 color;
                            vec4 src1Color = texture2D(texture, texCoord);
                            float rand = pow(randomF()*0.8,distribution)*(1.0/0.8);
                            if(randomF() < offset){
                                rand = 1.0-rand* amount;
                            }else{
                                rand = 1.0 + rand* amount;
                            }
                            if(randomF() < cover){
                                color = src1Color * vec4(rand);      
                            }else{
                                color = src1Color;
                            }
                            ##standardMixResult##   
                        }
                    `);
                }
                var uniformObj = Object.assign({
                        seedVal: seedVal / 32,
                        amount,
                        offset,
                        distribution,
                        cover,
                    },
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
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                name : "seed",
                description : "Random seed value.",
                type : "Number",
                range : {min : 0, max : 32, step : 0.001, def : 1},
            },{
                name : "amount",
                description : "The amount of noise to add",
                type : "Number",
                range : {min : 0, max : 2, step : 0.01, def : 1},
            },{
                name : "offset",
                description : "Add or subtract ratio 0.5 equally distributed. 0 All added 1 all subtracted",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 0.5},
            },{
                name : "distribution",
                description : "Tendency for noise to be distributed towards zero. 1 for even distribution, > 1 noise is grouped near to 0",
                type : "Number",
                range : {min : 1, max : 5, step : 0.2, def : 1},
            },{
                name : "cover",
                description : "Amount of pixels effected by noise filter. 0 no pixels are effected, 1 all pixels",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "mix",
                description : "",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }], 
        });
    }());
}
