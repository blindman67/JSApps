
// experimental fun filter
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; 
        filterGL.filters.register("warp", filter = {
                name : "warp",
                description : "This filter is a source code template that can be used to create new filters ",
                webGLFilters : null,
                shader : null,
                filterTypes : ["luminance","luminance a","luminance b","luminance c","rg=dir b=dist","r=dir g=dist"],
                callback(source2,amount, angle, angleMod,sampleSize,  iterations, type, mix) {
                    var glF = this.webGLFilters;
                    if (this.shader === null) {
                        this.shader = glF.Shader(null, null).useLinker();
                        this.shader.setFragmentSource(`
                            uniform sampler2D texture;
                            uniform sampler2D texture1;
                            uniform vec2 texSize;                    
                            uniform vec2 texSize1;                    
                            uniform float sampleSize;
                            uniform float amount;
                            uniform float angle;
                            uniform float angleMod;                            
                            uniform float mixAmount;
                            uniform int useSource;
                            uniform int type;
                            varying vec2 texCoord;
                            const float pi2 = 6.28318531;
                            const float pi = 3.141592654;
                            const float pi0p5 = 1.5707963;
                            float dist = 0.0;
                            vec2 dir = vec2(0,0);
                            
                            void getDirSample( float centSum, vec4 centPixel){
                                float ang1;
                                if(type == 0){
                                    for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.35) {
                                        vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                        vec4 sample = texture2D(texture1, texCoord + pos);
                                        float sum = sample.r + sample.g + sample.b;
                                        float sum1 = distance(sample.xyz,centPixel.xyz);
                                        dir += (amount * vec2(cos(i + angle),sin(i + angle)) / texSize ) * (sum - centSum);
                                        //dist += 1.0;
                                        dist += pow(sum,sum1);
                                    }
                                } else if(type == 1){
                                    for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.785398) {
                                        vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                        vec4 sample = texture2D(texture1, texCoord + pos);
                                        float sum = distance(sample.xyz,centPixel.xyz);
                                        dir += (amount * vec2(cos((i + angle)* centSum),sin((i + angle)* centSum)) / texSize ) * sum * centSum;
                                        dist += 1.0;
                                    }
                                } else if(type == 2){
                                    for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.05) {
                                        vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                        vec4 sample = texture2D(texture1, texCoord + pos);
                                        float sum = distance(sample.xyz,centPixel.xyz);
                                        dir += (amount * vec2(cos(i + angle* centSum),sin(i + angle* centSum)) / texSize ) * sum * centSum;
                                        dist += 1.0;
                                    }
                                } else if(type == 3){
                                    for (float i = 0.0; i <= ${(Math.PI * 2).toFixed(6)}; i += 0.35) {
                                        vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                        vec4 sample = texture2D(texture1, texCoord + pos);
                                        float sum = distance(sample.xyz,centPixel.xyz);
                                        dir += (amount * vec2(cos(i + angle),sin(i + angle)) / texSize ) * (sum - centSum);
                                        dist += 1.0;
                                    }
                                } else if(type == 4){
                                    vec4 sample = texture2D(texture1, texCoord);
                                    vec2 ang = normalize(sample.rg - vec2(0.5));
                                    if(ang.x == 0.0){
                                        ang1 = pi0p5 * sign(ang.y);
                                    }else if(ang.x > 0.0){
                                        ang1 = atan(ang.y/ang.x);
                                    }else{
                                        ang1 = pi - atan(ang.y/abs(ang.x));
                                    }
                                    ang1 *= (sampleSize / 10.0);
                                    dir = (amount * vec2(cos(angle * 2.0 + ang1),sin(angle * 2.0 + ang1)) / texSize ) * sample.b;
                                    dist = 1.0;
                                } else {
                                    vec4 sample = texture2D(texture1, texCoord);
                                    float a = sample.r - centSum / 3.0;
                                    a *= (sampleSize / 10.0) * pi2;
                                    a += angle;
                                    dir = (amount * vec2(cos(a),sin(a)) / texSize ) * (sample.g - centSum / 3.0);
                                    dist = 1.0;
                                }
                            }
                            void main() {

                                vec4 color = vec4(0.0);  
                                vec4 centPixel = texture2D(texture, texCoord);
                                float centSum = centPixel.r + centPixel.g + centPixel.b;

                                getDirSample(centSum,centPixel);
                                    
                                gl_FragColor = mix(centPixel,texture2D(texture, texCoord + dir / dist),mixAmount);
                            }
                        `);
                    }
                    var uniformObj = {
                           texSize : [glF.width, glF.height],
                           texSize1 : [
                                source2 ? source2.width : glF.width,
                                source2 ? source2.height : glF.height,                           
                           ],                           
                           sampleSize, amount, type, angleMod,
                           angle : angle * (Math.PI / 180), 
                           mixAmount : mix,
                           type : {type : "uniform1i", value : this.filterTypes.indexOf(type)},
                    };
                    if (source2) {
                        source2.bind(1);
                        uniformObj.texture1 = {type : "uniform1i",value : 1};
                    } else {
                        uniformObj.texture1 = {type : "uniform1i",value : 0};
                    }
                    for(var i = 0; i < iterations; i+=1){
                        glF.filter(this.shader, uniformObj);
                    }
                    return glF; // Not a must but allows users to chain filters
                },
                arguments : [{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                },{
                    name : "amount",
                    description : "Distance pixels are moved",
                    type : "Number",
                    range : {min : -32, max : 32, step : 0.5, def : 1},
                },{
                    name : "angle",
                    description : "Angle adjust at 0 flows from light to dark @ 90 flows along light dark boundaries",
                    type : "Number",
                    range : {min : -180, max : 180, step : 1, def : 0},
                },{
                    name : "angleMod",
                    description : "Modifies the angle",
                    type : "Number",
                    range : {min : -8, max : 8, step : 0.1, def : 1},
                },{
                    name : "sampleSize",
                    description : "Distance from sample pixel to find direction",
                    type : "Number",
                    range : {min : -62, max : 62, step : 0.25, def : 1},
                },{
                    name : "iterations",
                    description : "Number of times to process the image for a result",
                    type : "Number",
                    range : {min : 1, max : 32, step : 1, def : 1},
                },{
                    name : "type",
                    description : "Variations of the filter",
                    type : "String",
                    range : ["luminance","luminance a","luminance b","luminance c","rg=dir b=dist","r=dir g=dist"],
                },{
                    name : "mix",
                    description : "",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                }], 
            }
        );
    }());
}

