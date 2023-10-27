"use strict";

// experimental fun filter
if (typeof filterGL !== "undefined") {
    (function () {

        const filter = {
            name : "warp",
            description : "This filter is an experimental fun filter and is ment to be used to animate a texture ",
            webGLFilters : null,
            shader : null,
            filterTypes : ["luminance","luminance a","luminance b","luminance c","rg=dir b=dist","r=dir g=dist"],
            callback(
                source2 = filter.arguments[0].range.def,
                amount = filter.arguments[1].range.def,
                angle = filter.arguments[2].range.def,
                angleMod = filter.arguments[3].range.def,
                sampleSize = filter.arguments[4].range.def,
                iterations = filter.arguments[5].range.def,
                type = filter.arguments[6].range[0],
                mix = filter.arguments[7].range.def
                ) {
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
                                    dist += pow(sum,sum1);
                                }
                            } else if(type == 1){
                                for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.35) {
                                    vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                    vec4 sample = texture2D(texture1, texCoord + pos);
                                    float sum = sample.r * sample.b + sample.g * sample.g + sample.b * sample.r;
                                    float sum1 = distance(sample.xyz,centPixel.xyz);
                                    dir += (amount * vec2(cos(i + angle),sin(i + angle)) / texSize ) * (sum - centSum);
                                    dist += pow(sum,sum1);
                                }
                            } else if(type == 2){
                                for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.785398) {
                                    vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                    vec4 sample = texture2D(texture1, texCoord + pos);
                                    float sum = distance(sample.xyz,centPixel.xyz);
                                    dir += (amount * vec2(cos((i + angle)* centSum),sin((i + angle)* centSum)) / texSize ) * sum * centSum;
                                    dist += 1.0;
                                }
                            } else if(type == 3){
                                for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.05) {
                                    vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                    vec4 sample = texture2D(texture1, texCoord + pos);
                                    float sum = distance(sample.xyz,centPixel.xyz);
                                    dir += (amount * vec2(cos(i + angle* centSum),sin(i + angle* centSum)) / texSize ) * sum * centSum;
                                    dist += 1.0;
                                }
                            } else if(type == 4){
                                for (float i = 0.0; i <= ${(Math.PI * 2).toFixed(6)}; i += 0.35) {
                                    vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                    vec4 sample = texture2D(texture1, texCoord + pos);
                                    float sum = distance(sample.xyz,centPixel.xyz);
                                    dir += (amount * vec2(cos(i + angle),sin(i + angle)) / texSize ) * (sum - centSum);
                                    dist += 1.0;
                                }
                            } else if(type == 5){
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
                            } else if(type == 56){
                                vec4 sample = texture2D(texture1, texCoord);
                                float a = sample.r - centSum / 3.0;
                                a *= (sampleSize / 10.0) * pi2;
                                a += angle;
                                dir = (amount * vec2(cos(a),sin(a)) / texSize ) * (sample.g - centSum / 3.0);
                                dist = 1.0;
                            } else {
                                for (float i = 0.0; i < ${(Math.PI * 2).toFixed(6)}; i += 0.35) {
                                    vec2 pos = sampleSize * vec2(cos(i),sin(i)) / texSize;
                                    vec4 sample = texture2D(texture1, texCoord + pos);
                                    float sum = sample.r * sample.b + sample.g * sample.g + sample.b * sample.r;
                                    float sum1 = distance(sample.xyz,centPixel.xyz) * sum;
                                    dir += (amount * vec2(cos(i + sum + angle),sin(i + angle)) / texSize ) * (sum - centSum);
                                    dist += pow(sum, sum1);
                                }
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
                range : {def : null},
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
                range : ["luminance","New Lum","luminance a","luminance b","luminance c","rg=dir b=dist","r=dir g=dist","New pow"],
            },{
                name : "mix",
                description : "",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            }],
        };
        filterGL.filters.register(filter.name, filter);
    }());
}

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
        filterGL.filters.register("kalidascope", filter = {
            name : "kalidascope",
            description : "What is says on the pack",
            webGLFilters : null,
            shader : null,
            shaders : {

            },
            mirrorTypes : {
                Simple : `float a = mod(atan(texCoord.x - 0.5, texCoord.y - 0.5), angMod) + angOff;
                          float d = mod(mod(distance(texCoord, vec2(0.5, 0.5)) * distRep, distMod) + distOff, 1.414);
                          vec2 pos = vec2(cos(a), sin(a)) * d + vec2(0.5);
                `,
                Mirror : `float a = mod(atan(texCoord.x - 0.5, texCoord.y - 0.5), angMod);
                          a = (a > halfMod ? angMod - a : a) + angOff;
                          float d = mod(distance(texCoord, vec2(0.5, 0.5)) * distRep, distMod);
                          d = mod((d > halfDistMod ? distMod - d : d) + distOff, 1.414);
                          vec2 pos = vec2(cos(a), sin(a)) * d + vec2(0.5);
                `,
                SinMirror : `float a = atan(texCoord.x - 0.5, texCoord.y - 0.5) * rep;
                          a = sin(a* scaler) * ${Math.PI/ 4} + ${Math.PI/4} + angOff;
                          float d = distance(texCoord, vec2(0.5, 0.5)) * distRep;
                          d = sin(d) * 0.707 + 0.707 + distOff;
                          vec2 pos = vec2(cos(a), sin(a)) * d + vec2(0.5);
                `,
                SimpleTwist : `float d = mod(mod(distance(texCoord, vec2(0.5, 0.5)) * distRep, distMod) + distOff, 1.414);
                          float a = mod(atan(texCoord.x - 0.5, texCoord.y - 0.5) * scaler * d, angMod) + angOff + d;
                          vec2 pos = vec2(cos(a), sin(a)) * d + vec2(0.5);
                `,
                MirrorTwist : `float d = mod(distance(texCoord, vec2(0.5, 0.5)) * distRep, distMod);
                          float d1 = mod((d > halfDistMod ? distMod - d : d) + distOff, 1.414);
                          float a = mod(atan(texCoord.x - 0.5, texCoord.y - 0.5) * (scaler * d / 1.141) , angMod);
                          a = (a > halfMod ? angMod - a : a) + angOff + d1 * 3.14;
                          vec2 pos = vec2(cos(a), sin(a)) * d1 + vec2(0.5);
                `,
                SinMirrorTwist : `float d = distance(texCoord, vec2(0.5, 0.5));
                          float d1 = (sin(d * distOff) * 0.707 + 0.707) * distRep;
                          float a = atan(texCoord.x - 0.5, texCoord.y - 0.5) * rep;
                          a = cos(d / 0.707  * scaler * ${Math.PI}) * rep + sin(a) * ${Math.PI} + ${Math.PI} + angOff;

                          vec2 pos = vec2(cos(a), sin(a)) * d1 + vec2(0.5);
                `,

            },

            callback(reflections, refD, angOff, distOff, scaler, type) {
                var glF = this.webGLFilters;
                if (this.shaders[type] === undefined){
                    this.shaders[type] = glF.Shader(null, null).useLinker();
                    this.shaders[type].setFragmentSource(`
                        uniform sampler2D texture;
                        uniform float rep;
                        uniform float angMod;
                        uniform float halfMod;
                        uniform float distRep;
                        uniform float distMod;
                        uniform float halfDistMod;
                        uniform float angOff;
                        uniform float distOff;
                        uniform float scaler;
                        varying vec2 texCoord;
                        void main() {
                            ${this.mirrorTypes[type]}
                            gl_FragColor = texture2D(texture, pos);
                        }
                    `);
                }
                const halfUnitHypot = (0.5 * 0.5 + 0.5 * 0.5) ** 0.5;
                var uniformObj = {
                    rep: reflections,
                    angMod: (Math.PI * 2) / reflections ,
                    halfMod: (Math.PI) / reflections ,
                    distRep: refD,
                    distMod: halfUnitHypot * refD,
                    halfDistMod: halfUnitHypot * refD / 2,
                    angOff,
                    distOff,
                    scaler
                };
                glF.clearBufferBeforDraw();
                glF.filter(this.shaders[type], uniformObj);
                return glF;
            },
            arguments : [{
                    name : "reflections",
                    description : "Number of mirrors",
                    type : "Number",
                    range : {min : 2, max : 64, step : 1, def : 3},
                },{
                    name : "Dist reflections",
                    description : "Number of mirrors along length",
                    type : "Number",
                    range : {min : -6, max : 6, step : 0.01, def : 1},
                },{
                    name : "AngleOffset",
                    description : "Offset of reflection angle",
                    type : "Number",
                    range : {min : 0, max : Math.PI * 2, step : Math.PI / 1024 , def : 0},
                },{
                    name : "DistOffset",
                    description : "Offset of reflection to center",
                    type : "Number",
                    range : {min : -2, max : 2, step : 2 / 1024 , def : 0},
                },{
                    name : "Scale",
                    description : "Does stuff depending on type",
                    type : "Number",
                    range : {min : -4, max : 4, step : 2 / 1024 , def : 0},
                },{
                    name : "type",
                    description : "Type of unwrap to perform",
                    type : "String",
                    range : ["Simple","Mirror","SinMirror","SimpleTwist","MirrorTwist","SinMirrorTwist",],
                }

            ],
        });
    }());
}

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("unwrapCylinder", filter = {
            name : "unwrapCylinder",
            description : "Flattens image from cyclinder",
            webGLFilters : null,
            shader : null,
            callback(type,startAngle,endAngle) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();

                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform float startAngle;
                        uniform float endAngle;
                        uniform float type;
                        varying vec2 texCoord;
                        void main() {
                            vec2 pos = vec2(texCoord);
                            float s1 = cos(startAngle);
                            float s2 = cos(endAngle);
                            float range = s2 - s1;
                            float angRange = (endAngle - startAngle);
                            if(type == 0.0){
                                float ang = angRange * pos.x + startAngle;
                                pos.x = (cos(ang) - s1) / range;
                            } else if(type == 1.0){
                                float ang = angRange * pos.y + startAngle;
                                pos.y = (cos(ang) - s1) / range;

                            }
                            gl_FragColor = texture2D(texture, pos);
                        }
                    `);
                }
                switch(type){
                    case "Horizontal":
                        type = 0;
                        break;
                    case "Vertical":
                        type = 1;
                        break;
                }

                var uniformObj = {startAngle,endAngle,type};
                glF.clearBufferBeforDraw();
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "type",
                    description : "Type of unwrap to perform",
                    type : "String",
                    range : ["Horizontal","Vertical"],
                },{
                    name : "startAngle",
                    description : "Start angle of wrap (left side)",
                    type : "Number",
                    range : {min : -3.16, max : 0.02, step : 0.01, def : -3.14},
                },{
                    name : "endAngle",
                    description : "End angle of wrap (right size)",
                    type : "Number",
                    range : {min : -3.16, max : 0.02, step : 0.01, def : 0.0},
                },

            ],
        });
    }());
}

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("spheroid", filter = {
            name : "spheroid",
            description : "deforms stuff",
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
                        const float pi = ${Math.PI.toFixed(6)};
                        uniform vec2 origin;
                        void main() {
                            float x = (texCoord.x -origin.x) * pi * xScale + amount;
                            float y = (texCoord.y - origin.y) * pi * xAmount + xBallance;
                            vec2 pos = vec2(cos(x),sin(x)) * cos(y);
                            pos += origin;
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

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("lensUndistortPlane", filter = {
            name : "lensUndistortPlane",
            description : "Corrects the image for to keep vertical parallel lines from converging",
            webGLFilters : null,
            shader : null,
            callback(fov,scale,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float fov;
                        uniform float scale;

                        //uniform float outer
                        uniform vec2 origin;
                        void main() {
                            float x = texCoord.x -origin.x;
                            float y = texCoord.y - origin.y;
                            float xx = abs(x);
                            x *= 1.0/sqrt(1.0+pow(y * fov + xx * scale,2.0));
                            vec2 pos = vec2(x,y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }
                    `);
                }
                var uniformObj = {scale:scale,origin : point, fov : Math.sqrt(fov) / Math.sqrt(20)};
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "fov",
                    description : "Value to represent the relative focal length of the camera",
                    type : "Number",
                    range : {min : 0.1, max : 60, step : 0.1, def : 1},
                },{
                    name : "scale",
                    description : "Scale the FX to compensate for any cropping that may have occured to the image",
                    type : "Number",
                    range : {min : 0.001, max : 3, step : 0.001, def : 1},
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
        filterGL.filters.register("lensUndistort", filter = {
            name : "lensUndistort",
            description : "Corrects the image for to keep vertical parallel lines from converging",
            webGLFilters : null,
            shader : null,
            callback(fov,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float fov;
                        //uniform float outer
                        uniform vec2 origin;
                        void main() {
                            float x = texCoord.x -origin.x;
                            float y = texCoord.y - origin.y;
                            float xx = abs(x);
                            x *= 1.0/sqrt((xx)*(xx)+pow((y + (fov-1.0)/fov)*fov,2.0));
                            vec2 pos = vec2(x,y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }
                    `);
                }
                var uniformObj = {origin : point, fov : Math.sqrt(fov) / Math.sqrt(20)};
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "fov",
                    description : "Value to represent the relative focal length of the camera",
                    type : "Number",
                    range : {min : 0.01, max : 3, step : 0.01, def : 1},
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

/*
if (typeof filterGL !== "undefined") {
    (function () {
        var filter;
        filterGL.filters.register("track", filter = {
            name : "track",
            description : "Evaluates candidate tracking positions",
            webGLFilters : null,
            shader : null,




            callback(size, position, rotation, scaling, minRange, maxRange, gain, model) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();

                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        const float range[] = [16.0, 8.0, 4.0, 2.0, 1.0, 0.5, 0.25, 1.0 / 4.0, 1.0 / 8.0];
                        uniform vec2 pos[5];
                        uniform float rot[3];  //[0.0, 0.1, -0.1]
                        uniform float scaleU[3]; // [1.0, 1.1, 1.0 / 1.1]
                        uniform vec2 center;
                        varying vec2 texCoord;
                        void main() {
                            vec2 p = vec2(texCoord) * 1024.0;
                            int cell = floor(mod(p.x, 32.0)) + floor(p.y / 32.0) * 32.0);
                            float ra = range[mod(cell / 45, 9)];
                            float ang = rot[mod(cell / 5, 3)] * ra;
                            float s = scaleU[mod(cell / 15, 3)] * ra;
                            vec2 r = vec2(cos(ang) * s, sin(ang) * s);

                            vec2 from = pos[mod(cell, 5)];
                            from = vec2(from.x * r.x - from.y * r.y, from.x * r.y + from.y * r.x) + center;

                            float s1 = cos(startAngle);
                            float s2 = cos(endAngle);
                            float range = s2 - s1;
                            float angRange = (endAngle - startAngle);
                            if(type == 0.0){
                                float ang = angRange * pos.x + startAngle;
                                pos.x = (cos(ang) - s1) / range;
                            } else if(type == 1.0){
                                float ang = angRange * pos.y + startAngle;
                                pos.y = (cos(ang) - s1) / range;

                            }
                            gl_FragColor = texture2D(texture, pos);
                        }
                    `);
                }
                switch(type){
                    case "Horizontal":
                        type = 0;
                        break;
                    case "Vertical":
                        type = 1;
                        break;
                }

                var uniformObj = {startAngle,endAngle,type};
                glF.clearBufferBeforDraw();
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "size",
                    description : "Size of metric",
                    type : "String",
                    range : [32, 16],
                },{
                    name : "position",
                    description : "If on tracks position",
                    type : "String",
                    range : ["on","off"],
                },{
                    name : "rotation",
                    description : "If on tracks rotation",
                    type : "String",
                    range : ["on","off"],
                },{
                    name : "scaling",
                    description : "If on tracks scaling. on uniform tracks uniform scaling",
                    type : "String",
                    range : ["on","on uniform","off"],
                },{
                    name : "minRange",
                    description : "Smallest distance to test",
                    type : "String",
                    range : ["1/16","1/9","1/4","1/2",1,2,4,8,16,32],
                },{
                    name : "maxRange",
                    description : "Largest distance to test",
                    type : "String",
                    range : ["1/16","1/9","1/4","1/2",1,2,4,8,16,32],
                },{
                    name : "gain",
                    description : "Amplifies differences",
                    type : "Number",
                    range : {min : 0.5, max : 4, step : 0.5, def : 1},
                },{
                    name : "model",
                    description : "Colour model used",
                    type : "String",
                    range : ["Linear RGB","Log RGB","Linear Value","Log Value"],
                },

            ],
        });
    }());
}*/
