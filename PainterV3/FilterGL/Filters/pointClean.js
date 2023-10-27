



if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("variance", filter = {
            name : "variance",
            description : "Removes points",
            webGLFilters : null,
            shader : null,
            callback(cutoff, sCutoff, size ,type, mixin, channels) {
                var glF = this.webGLFilters;
                var angC = 6;
                if (this.shader === null || this.shaderSmall === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float cutoff;
                        uniform float sCutoff;
                        uniform float size;
                        uniform float mixin;
                        uniform float red;  
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;       
     
                        uniform int type;
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            vec4 newCol = vec4(0.0);
                            float vc = color.r + color.g + color.b + color.a;
                            float ux = 1.0 / texSize.x;
                            float uy = 1.0 / texSize.y;
                            float ang = 0.0;
                            mat2 m;
                            float mm=0.0;
                            float scale = 1.0;
                            for(int i = 0; i < 1; i ++){
                                m[0] = vec2(cos(ang),sin(ang)) * (scale + size);
                                m[1] = vec2(-sin(ang),cos(ang)) * (scale + size);
                                ang += cutoff;
                                scale += 0.1;
                                vec4 t = texture2D(texture, texCoord + vec2(0,-uy) * m)*(1.0/8.0);
                                vec4 b = texture2D(texture, texCoord + vec2(0,uy) * m)*(1.0/8.0);
                                vec4 l = texture2D(texture, texCoord + vec2(-ux,0 )* m)*(1.0/8.0);
                                vec4 r = texture2D(texture, texCoord + vec2(ux,0) * m)*(1.0/8.0);
                                vec4 T = texture2D(texture, texCoord + vec2(-ux,-uy) * m) * 0.70710678*(1.0/8.0);
                                vec4 B = texture2D(texture, texCoord + vec2(ux,uy) * m) * 0.70710678*(1.0/8.0);;
                                vec4 L = texture2D(texture, texCoord + vec2(-ux,uy )* m) * 0.70710678*(1.0/8.0);;
                                vec4 R = texture2D(texture, texCoord + vec2(ux,-uy) * m) * 0.70710678*(1.0/8.0);;
                                vec4 sums = vec4(t.r+b.r+l.r+r.r + T.r+B.r+L.r+R.r, 
                                    t.g+b.g+l.g+r.g+ T.g+B.g+L.g+R.g,
                                    t.b+b.b+l.b+r.b+ T.b+B.b+L.b+R.b,
                                    t.a+b.a+l.a+r.a+ T.a+B.a+L.a+R.a );
                               // sums *= 1//sCutoff/scale;
                                float mSum = (sums.r + sums.g + sums.b + sums.a);
                                vec4 dev = pow((sums-mSum)/4.0,vec4(2.0));
                                float variance = (dev.r + dev.g + dev.b + dev.a)/4.0;
                                vec4 dif = abs(color - sums);
                                float mDif = (dif.r + dif.g + dif.b + dif.a)/4.0;
                               // if(mDif > variance){
                                    //color += sign(sums-color) * variance * sums;
                                    color += sign(sums-color) * variance * (sums-mSum);
                               // }
                            }
                            
                            //if(mDif > variance){
                                color.a = 1.0;
                                gl_FragColor = color;
                                gl_FragColor = mix(color, gl_FragColor, mixin);
                                gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha)); 
                            //}else{
                            //    gl_FragColor = color;
                            //}
                        }
                    `);
                }

                var uniformObj = {
                    cutoff, size, mixin, sCutoff,
                    type : {type : "uniform1i", value : type},
                    red : channels.has("R") ? 1 : 0,
                    green : channels.has("G") ? 1 : 0,
                    blue : channels.has("B") ? 1 : 0,
                    alpha : channels.has("A") ? 1 : 0,                    
                    texSize: [glF.width, glF.height] ,                      
                    type : {type : "uniform1i", value : type},                

                };
                glF.filter(this.shader, uniformObj);
          
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                    name : "cutoff",
                    description : "Noise level cutoff smaller values remove more noise",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.1, def : 1},
                },{
                    name : "symmetryCutoff",
                    description : "Symmetry cutoff check that the area around the dirty point is symmetrical",
                    type : "Number",
                    range : {min : -8, max : 8, step : 0.1, def : 1},
                },{
                    name : "size",
                    description : "Pixel test radius in pixels",
                    type : "Number",
                    range : {min :-43, max : 32, step : 0.01, def : 1},
                },{
                    name : "type of noise to remove",
                    description : "Pixel test radius",
                    type : "String",
                    range : ["Lighter","Darker","All"]
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                },{
                    name : "channels",
                    description : "which channels to put back to the result",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                }
            ], 
        });
    }());
}

if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("monoPixelRemove", filter = {
            name : "monoPixelRemove",
            description : "Removes pixels sourounded by same color",
            webGLFilters : null,
            shader : null,
            callback(type, dist, mixin, channels) {
                var glF = this.webGLFilters;
                var angC = 6;
                if (this.shader === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float dist;
                        uniform float mixin;
                        uniform float red;  
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;       
                        uniform int type;
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            gl_FragColor = color;
                            float ux = (1.0 / texSize.x) * dist;
                            float uy = (1.0 / texSize.y) * dist;
                            float vc = color.r + color.g + color.b + color.a;
                            vec4 t = texture2D(texture, texCoord + vec2(0,-uy));
                            vec4 b = texture2D(texture, texCoord + vec2(0,uy));
                            vec4 l = texture2D(texture, texCoord + vec2(-ux,0));
                            vec4 r = texture2D(texture, texCoord + vec2(ux,0));
                            vec4 tl = texture2D(texture, texCoord + vec2(-ux,-uy));
                            vec4 tr = texture2D(texture, texCoord + vec2(ux,-uy));
                            vec4 br = texture2D(texture, texCoord + vec2(ux,uy));
                            vec4 bl = texture2D(texture, texCoord + vec2(-ux,uy));
                            
                            if(!all(equal(color,r)) && all(equal(l,r)) && all(equal(l,t)) && all(equal(l,b)) && 
                                all(equal(bl,br)) && all(equal(bl,tr)) && all(equal(bl,tl)) && all(equal(bl,r))){
                                float sum = t.r + t.g + t.b + t.a;
                                if((type == 0 && sum > vc) || (type == 1 && sum < vc) || (type == 2)){
                                    gl_FragColor = mix(color, t, mixin);
                                    gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha)); 
                                }
                            }

                        }
                    `);
                }

                var uniformObj = {
                    dist,mixin,                  
                    type : {type : "uniform1i", value :  ["Lighter","Darker","All"].indexOf(type)},                
                    red : channels.has("R") ? 1 : 0,
                    green : channels.has("G") ? 1 : 0,
                    blue : channels.has("B") ? 1 : 0,
                    alpha : channels.has("A") ? 1 : 0,                    
                    texSize: [glF.width, glF.height] ,                      

                };
                glF.filter(this.shader, uniformObj);
          
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                    name : "type",
                    description : "Removes pixels that are lighter/darker/both",
                    type : "String",
                    range : ["Lighter","Darker","All"]
                },{
                    name : "dist",
                    description : "Size of pixel test zone",
                    type : "Number",
                    range : {min : 1, max : 12, step : 0.5, def : 1},
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                },{
                    name : "channels",
                    description : "which channels to put back to the result",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                }
            ], 
        });
    }());
}
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("monoTailRemove", filter = {
            name : "monoTailRemove",
            description : "Removes pixel tails and points sourounded by same color",
            webGLFilters : null,
            shader : null,
            callback(type, dist, pixels, tails, mixin, channels) {
                var glF = this.webGLFilters;
                var angC = 6;
                if (this.shader === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float dist;
                        uniform float mixin;
                        uniform float red;  
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;       
                        uniform int type;
                        uniform int pixels;
                        uniform int tails;
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            gl_FragColor = color;
                            vec4 newCol = color;
                            bool change = false;
                            float ux = (1.0 / texSize.x) * dist;
                            float uy = (1.0 / texSize.y) * dist;
                            float vc = color.r + color.g + color.b + color.a;
                            vec4 t = texture2D(texture, texCoord + vec2(0,-uy));
                            vec4 b = texture2D(texture, texCoord + vec2(0,uy));
                            vec4 l = texture2D(texture, texCoord + vec2(-ux,0));
                            vec4 r = texture2D(texture, texCoord + vec2(ux,0));
                            
                            if(pixels == 1 && all(equal(l,r)) && all(equal(l,t)) && all(equal(l,b)) && !all(equal(color,r))){
                                newCol = t;
                                change = true;
                            }else if(tails == 1){      
                                if(all(equal(color,t)) && all(equal(b,l)) && all(equal(b,r)) && !all(equal(b,t))){
                                    change = true;
                                    newCol = b;                                      
                                }else if(all(equal(color,b)) && all(equal(t,l)) && all(equal(t,r)) && !all(equal(b,t))){
                                    newCol = t;
                                    change = true;                                      
                                }else if(all(equal(color,l)) && all(equal(r,t)) && all(equal(r,b)) && !all(equal(l,r))){
                                    newCol = t;
                                    change = true;
                                }else if(all(equal(color,r)) && all(equal(l,t)) && all(equal(l,b)) && !all(equal(l,r))){
                                    newCol = t;
                                    change = true;
                                }                         
                            }
                            if(change){
                                float sum = newCol.r + newCol.g + newCol.b + newCol.a;
                                if((type == 0 && sum > vc) || (type == 1 && sum < vc) || (type == 2)){
                                    gl_FragColor = mix(color, newCol, mixin);
                                    gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha)); 
                                }
                            }

                        }
                    `);
                }

                var uniformObj = {
                    dist,mixin,
                    pixels : {type : "uniform1i", value : pixels ? 1 : 0},                    
                    tails : {type : "uniform1i", value : tails ? 1 : 0},                    
                    type : {type : "uniform1i", value :  ["Lighter","Darker","All"].indexOf(type)},                
                    red : channels.has("R") ? 1 : 0,
                    green : channels.has("G") ? 1 : 0,
                    blue : channels.has("B") ? 1 : 0,
                    alpha : channels.has("A") ? 1 : 0,                    
                    texSize: [glF.width, glF.height] ,                      

                };
                glF.filter(this.shader, uniformObj);
          
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                    name : "type",
                    description : "Removes pixels that are lighter/darker/both",
                    type : "String",
                    range : ["Lighter","Darker","All"]
                },{
                    name : "dist",
                    description : "Size of pixel test zone",
                    type : "Number",
                    range : {min : 1, max : 12, step : 0.5, def : 1},
                },{
                    name : "pixels",
                    description : "If ticked removes issolated pixels ",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "tails",
                    description : "If ticked removes pixel tails",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                },{
                    name : "channels",
                    description : "which channels to put back to the result",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                }
            ], 
        });
    }());
}


if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("pointClean", filter = {
            name : "pointClean",
            description : "Removes symmetrical points",
            webGLFilters : null,
            shader : null,
            shaderSmall : null,
            smallData : [[], [0,-1,1,-1], [0,-2,2,-2], [0,-3,1,-3,3,-1], [0,-4,2,-4,3,-3,4,-2], [0,-5,1,-5,3,-5,5,-3,5,-1]],

            callback(cutoff, symmetryCutoff, size ,type, mixin, channels) {
                var glF = this.webGLFilters;
                var angC = 6;
                if (this.shader === null || this.shaderSmall === null) {
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shaderSmall = glF.Shader(null, null).useLinker();
                    this.shaderSmall.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float cutoff;
                        uniform float symmetryCutoff;
                        uniform float size;
                        uniform float mixin;
                        uniform float red;  
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;       
     
                        uniform vec2 directions[5];
                        uniform int numberTests;
                        uniform int type;
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            vec4 newCol = vec4(0.0);
                            float count = 0.0;
                            int nextAngle = 0;
                            int okWrite = 0;
                            for(int i = 0; i < ${angC}; i ++){
                                vec2 dir = directions[i] / texSize;
                                vec2 dir1 = vec2(-dir.y,dir.x);             
                                nextAngle += 1;
                                vec4 top = texture2D(texture, texCoord + dir);
                                vec4 bot = texture2D(texture, texCoord - dir);
                                vec4 lef = texture2D(texture, texCoord + dir1);
                                vec4 rih = texture2D(texture, texCoord - dir1);
                                vec4 vC = (top + bot) / 2.0; 
                                vec4 hC = (lef + rih) / 2.0; 
                                float eDist = distance(vC,hC);
                                if(eDist < cutoff*2.0){
                                    float disV = distance(vC,color);
                                    float disH = distance(hC,color);
                                    if(disV > cutoff && disH > cutoff){ 
                                        float distV1 = distance(top,bot);
                                        float distV2 = distance(lef,rih);                            
                                        if(distV1 <= symmetryCutoff && distV2 <= symmetryCutoff){
                                            newCol += vC + hC;
                                            count += 2.0;
                                            if(i == numberTests-1){
                                                okWrite = 1;
                                                break;
                                            }
                                        } else { break;}
                                    } else { break;}                                        
                                } else { break;}
                            }
                            if(okWrite == 1){
                                gl_FragColor = newCol / count;
                                gl_FragColor = mix(color, gl_FragColor, mixin);
                                gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha)); 
                            }else{
                                gl_FragColor = color;
                            }
                        }
                    `);
                    var angC = 8;
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec2 texSize;                    
                        uniform float cutoff;
                        uniform float symmetryCutoff;
                        uniform float size;
                        uniform float mixin;
                        uniform float red;  
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;       
                        uniform float crossDif;       
                        uniform float radialDif;       
                        uniform int type;
                        float seedF = 0.0;
                        const float randC1 = 43758.5453;
                        const vec3 randC2 = vec3(12.9898, 78.233, 151.7182);
                        float randomF() {
                            seedF = fract(sin(dot(gl_FragCoord.xyz + seedF, randC2)) * randC1 + seedF); 
                            return seedF;
                        }                      
                        varying vec2 texCoord;
                        void main() {
                            vec4 color = texture2D(texture, texCoord);
                            float ang = randomF() * ${(Math.PI*2).toFixed(6)}; // get semi random angle
                            vec4 newCol = vec4(0.0);
                            float count = 0.0;
                            float xU = size / texSize.x;
                            float yU = size / texSize.y;
                            for(int i = 0; i < ${angC}; i ++){
                                vec2 dir = vec2(sin(ang) * xU,cos(ang) * yU);                            
                                vec2 dir1 = vec2(-dir.y,dir.x);
                                vec4 top = texture2D(texture, texCoord + dir) ; // vert line
                                vec4 bot = texture2D(texture, texCoord - dir);
                                vec4 lef = texture2D(texture, texCoord + dir1); // hor line
                                vec4 rih = texture2D(texture, texCoord - dir1);
                                vec4 vC = (top + bot) / 2.0;  // vertical
                                vec4 hC = (lef + rih) / 2.0;  // horzontal colour
                                float eDist = distance(vC,hC);
                                if(eDist < cutoff * 2.0){
                                    vec4 hCc = (vC+hC)/2.0;
                                    float disV = distance(hCc,color);
                                    if(disV > cutoff){ 
                                        float distV1 = distance(top,bot);
                                        float distV2 = distance(lef,rih);                            
                                        if(distV1 <= symmetryCutoff && distV2 <= symmetryCutoff){
                                            newCol += hCc;
                                            count += 1.0;
                                        } else { break; }
                                    } else { break; }                                        
                                } else { break; }
                                ang += ${(Math.PI/(angC*2)).toFixed(6)};
                            }
                            if(count >= ${(angC).toFixed(1)}){
                                gl_FragColor = newCol / count;
                                gl_FragColor = mix(color, gl_FragColor, mixin);
                                gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha)); 
                            }else{
                                gl_FragColor = color;
                            }
                        }
                    `);
                }
                if(size < 5){
                    if(size < 1){
                        size = 1;
                    }else{
                        size = Math.ceil(size);
                    }
                }
                var sMax = size;
                var uniformObj = {
                    cutoff, size, mixin, symmetryCutoff,//radialDif,crossDif,
                    type : {type : "uniform1i", value : type},
                    red : channels.has("R") ? 1 : 0,
                    green : channels.has("G") ? 1 : 0,
                    blue : channels.has("B") ? 1 : 0,
                    alpha : channels.has("A") ? 1 : 0,                    
                    texSize: [glF.width, glF.height] ,                      
                    type : {type : "uniform1i", value : type},                

                };
                uniformObj.size = size;
                if(size <= 5){
                    uniformObj.directions = {type : "uniform2fv", value : this.smallData[size]};
                    uniformObj.numberTests = {type : "uniform1i", value : this.smallData[size].length/2};
                    glF.filter(this.shaderSmall, uniformObj);
                }else{
                    glF.filter(this.shader, uniformObj);
                }
                return glF; // Not a must but allows users to chain filters
            },
            arguments : [{
                    name : "cutoff",
                    description : "Noise level cutoff smaller values remove more noise",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.1, def : 1},
                },{
                    name : "symmetryCutoff",
                    description : "Symmetry cutoff check that the area around the dirty point is symmetrical",
                    type : "Number",
                    range : {min : 0, max : 8, step : 0.1, def : 1},
                },{
                    name : "size",
                    description : "Pixel test radius in pixels",
                    type : "Number",
                    range : {min : 1, max : 32, step : 1, def : 1},
                },{
                    name : "type of noise to remove",
                    description : "Pixel test radius",
                    type : "String",
                    range : ["Lighter","Darker","All"]
                },{
                    name : "mixin",
                    description : "Standard mix of result and original",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},                    
                },{
                    name : "channels",
                    description : "which channels to put back to the result",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                }
            ], 
        });
    }());
}


