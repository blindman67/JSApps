/*Convolution filter and associated filters

This is not a traditional convolution filter. The convolution matrix rather than being a regular grid is an array
of vec3's where each item holds the relative pixel coordinate (to the processed pixel) of the weighted sample and the
that pixels contribution weight.
eg the standard 3By3 box blur convolution matrixs looks like
[
    [-1, -1, 1 / 9],[0, -1, 1 / 9],[1, -1, 1 / 9]
    [-1,  0, 1 / 9],[0,  0, 1 / 9],[1,  0, 1 / 9]
    [-1,  1, 1 / 9],[0,  1, 1 / 9],[1,  1, 1 / 9]
]

There are several advantages to doing it this way.

- grids location that have a weight of zero (or close) can be removed and do incuer a processing over head (particularly handy when using larger matrix
- Sampling density can controlled, and concentrated where needed.
- Not limited to a square grid providing a host of new convolution filter types

The filter also has an option to use logarithmic pixel values (to avoid dark banding where Hue contrast is high in blurs)

Custom fragment shader source can be provide for the inner iteration of weighted samples. See denoise filter as an example

The utilities object provides various methods for creating matrices, for converting from traditional grid matrix,
optimising the matrix and more

As the render can do sub pixel sampling (linear) I have also allowed for the matrix to be scaled. This can give quality
fast with the fraction of the weighted samples require for traditional convolution filters. Or very high fine detail for
filters like sharpen, and outline

Currently changing the matrix size will incur a new shader compile overhead but will take the aproch I used in procedural
filters and use a hash to save each compiled shader to avoid having to recompile

There is also a sub convolution shader that performs a nested convolution pass on each weighted sample. I have found that this type of pre processing can reduce a lot of the noise that can be amplified by many convolution filters. Thought there is a penalty in turns of performance.

*/


if(typeof filterGL !== "undefined"){
    (function(){
        var filterCommon; // to access common properties for associated filters
        //==============================================================================================================
        filterGL.filters.register("convolution", filterCommon = {
            name :"convolution",
            description : "This filter applies a convolution filter using the supplied matrix.",
            webGLFilters : null,
            shader : null,
            shaderPhoton : null,
            shaderPhotonSub : null,
            shaderCustom : null,
            customSource : {uniform : "" ,prep : "", loop : "", result : ""},
            isNewCustomSource(custom){
                if(custom){
                    if(this.customSource.uniform  !== custom.uniform ||
                    this.customSource.prep  !== custom.prep ||
                    this.customSource.loop  !== custom.loop ||
                    this.customSource.result  !== custom.result){
                        this.customSource.uniform = custom.uniform;
                        this.customSource.prep = custom.prep;
                        this.customSource.loop = custom.loop;
                        this.customSource.result = custom.result;
                        return true;
                    }
                }
                return false;
            },
            matrixSize : 0,
            callback(convolutionMatrix, mix, scale, iterations, channels, usePhotonCount = true, matrixHasOffsets = false, noiseReduce = false, custom = "") {
                var glF = this.webGLFilters;
                var len = convolutionMatrix.length;
                if(matrixHasOffsets){
                    var filtArray = convolutionMatrix;
                    len /= 3;
                }else{
                    var filtArray = this.utilities.optimiseSpacialArray(this.utilities.matrix2Spacial(convolutionMatrix));
                    len = filtArray.length / 3;
                }
                var commonDecs = `
                    uniform sampler2D texture;
                    uniform vec3 filter[${len}];
                    ##standardMixUniforms##
                    varying vec2 texCoord;
                `;
                var commonMain = `
                        vec4 src1Color = texture2D(texture, texCoord);
                        vec4 color = vec4(0.0);
                `;
                var commonSubSetup =`
                        subMatrix[0] = vec3(0.0,-0.5,0.5);
                        subMatrix[1] = vec3(0.0,0.5,0.5);
                        subMatrix[2] = vec3(-0.5,0.0,0.5);
                        subMatrix[3] = vec3(0.5,0.0,0.5);
                        subMatrix[4] = vec3(0.0,0.0,1.0);
                        float weight = 0.0;
                        for(int j = 0; j < 5; j += 1){
                            vec3 offset = subMatrix[j];
                            vec4 subSamp = vec4(0.0);
                `;
                // if the matrix size is changed then recreate the shaders
                if(!this.shader || !this.shaderPhoton || !this.shaderPhotonSub){
                    this.shader = glF.Shader(null, null).useLinker(); // create filter source later
                    this.shaderSub = glF.Shader(null, null).useLinker(); // create filter source later
                    this.shaderPhoton = glF.Shader(null, null).useLinker(); // create filter source later
                    this.shaderPhotonSub = glF.Shader(null, null).useLinker(); // create filter source later
                    this.shaderCustom =  glF.Shader(null, null).useLinker(); // has custom weighting function
                }
                if(this.matrixSize !== len || this.isNewCustomSource(custom)){
                    this.customSource = custom;
                    this.shaderCustom.setFragmentSource( `
                        ${commonDecs}
                        ${this.customSource.uniform}
                        void main() {
                            ${commonMain}
                            ${this.customSource.prep}
                            for (int i = 0; i < ${len}; i += 1) {
                                vec4 sample = texture2D(texture, texCoord + vec2(filter[i].x, filter[i].y) / texSize);
                                ${this.customSource.loop}
                            }
                            ${this.customSource.result}
                            ##standardMixResult##
                        }
                    `);
                }
                if(this.matrixSize !== len){
                    this.shader.setFragmentSource( `
                        ${commonDecs}
                        void main() {
                            ${commonMain}
                            for (int i = 0; i < ${len}; i += 1) {
                                vec4 sample = texture2D(texture, texCoord + vec2(filter[i].x, filter[i].y) / texSize);
                                color += sample * filter[i].z;
                            }
                            ##standardMixResult##
                        }
                    `);
                    this.shaderSub.setFragmentSource( `
                        ${commonDecs}
                        vec3 subMatrix[5];
                        void main() {
                            ${commonMain}
                            ${commonSubSetup}
                                for (int i = 0; i < ${len}; i += 1) {
                                    vec4 sample = texture2D(texture, texCoord + (vec2(filter[i].x, filter[i].y) + offset.xy) / texSize);
                                    subSamp += sample * filter[i].z;
                                }
                                color += subSamp * offset.z;
                                weight += offset.z;
                            }
                            color /= weight;
                            ##standardMixResult##
                        }
                    `);
                    this.shaderPhoton.setFragmentSource( `
                        ${commonDecs}
                        void main() {
                            ${commonMain}
                            for (int i = 0; i < ${len}; i += 1) {
                                vec4 sample = texture2D(texture, texCoord + vec2(filter[i].x, filter[i].y) / texSize);
                                sample = sample * 255.0;
                                color += sample * sample * filter[i].z;
                            }
                            color =  sqrt(color) / 255.0;
                            ##standardMixResult##
                        }
                    `);
                    this.shaderPhotonSub.setFragmentSource( `
                        ${commonDecs}
                        vec3 subMatrix[5];
                        void main() {
                            ${commonMain}
                            ${commonSubSetup}
                                for (int i = 0; i < ${len}; i += 1) {
                                    vec4 sample = texture2D(texture, texCoord + (vec2(filter[i].x, filter[i].y) + offset.xy) / texSize);
                                    sample = sample * 255.0;
                                    subSamp += sample * sample * filter[i].z;
                                }
                                color += subSamp * offset.z;
                                weight += offset.z;
                            }
                            color =  sqrt(color/weight) / 255.0;
                            ##standardMixResult##
                        }
                    `);
                }
                this.matrixSize = len;
                scale = 3 / (scale * scale);

                var uniformObj = Object.assign({
                        filter: {type : "uniform3fv", value : filtArray},
                    },
                    this.shader.getLinkedInUniforms(
                        "standardMixUniforms",[
                            mix,
                            channels,
                            glF.width * scale,
                            glF.height *  scale
                        ]
                    )
                );
                var shaderToUse;
                if(custom){
                    shaderToUse = this.shaderCustom;
                    uniformObj = Object.assign(uniformObj,custom.uniforms);
                }else{
                    shaderToUse = usePhotonCount ? ( noiseReduce ? this.shaderPhotonSub : this.shaderPhoton) : (noiseReduce ? this.shaderSub : this.shader);
                }

                glF.filter(shaderToUse,uniformObj);
                for(var i = 1; i < iterations; i ++){
                    glF.filter(shaderToUse,null); // no need to set uniforms again.
                }
                return glF;  // Not a must but allows users to chain filters
            },
            arguments : [{
                    name : "convolutionMatrix",
                    description : "Array containing the convolution matrix ",
                    type : "Array",
                    range : null,
                },{
                    name : "mix",
                    description : "The amount to mix the convolution array result with the original image, 1 is full result, 0 is original image.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "scale",
                    description : "Scales the area of the convolution array, this allows for fine detail using a high quality large matrix, or quick large detail using a low quality small matrix. The scale is logarithmic.",
                    type : "Number",
                    range : {min : 0.01, max : 3, step : 0.01, def : 1},
                },{
                    name : "iterations",
                    description : "Number of times to apply the filter before returning the result. Be careful some machines will crash the GPU if you use large matrix with many iteration. Iteration is done in JavaScript.",
                    type : "Number",
                    range : {min : 1, max : 32, step : 1, def : 1},
                },{
                    name : "channels",
                    description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                },{
                    name : "usePhotonCount",
                    description : "Some filters such as blur will produce dark color where hue contrast is high resulting in an artificial looking blur. If this is true the filter applies the photon count of each channel rather than the intensity. ",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "matrixHasOffsets",
                    description : "If true then the matrix passed as the first argument should include the x,y position of each weight. Should be in the order x,y,Weight,x,y,weight. When in this form the matrix is not bound to any defined size ",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "noiseReduce",
                    description : "Reduces the amount of noise that sharpen, outline and other detail extraction filters can create.",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "custom",
                    description : "Provides a way of adding custom source code to the convolution iteration. You provide prep, loop, and result fragment shader snippets",
                    type : "object",
                    range : {def : {prep : "", loop: "", result : ""}},
                }

            ],
            utilities : { // functions associated with this filter
                curvePowerNorm(val){return Math.pow(((val * 3) + 5)/5,Math.log2(10));},
                valideBoxSize(size){
                    size = Math.round(Math.abs(size));
                    size = (size -(size%2))+1;
                    return size;
                },
                createBoxBlurMatrix(size){
                    size = this.valideBoxSize(size);
                    var len = size * size;
                    var fillVal = 1 / len;
                    var array = [];
                    for(var i = 0; i < len; i ++){
                        array.push(fillVal);
                    }
                    return array;
                },
                createGBlurMatrix(size,weightCof){ // create a sort of Gaussian blur
                    size = this.valideBoxSize(size);
                    var len = size * size;
                    var radius = size / 2;
                    var fillVal = 1 / len;
                    var array = [];
                    var total = 0;
                    for(var y = 0; y < size; y ++){
                        for(var x = 0; x < size; x ++){
                            var dx = (radius - (x + 0.5));
                            var dy = (radius - (y + 0.5));
                            var dist = Math.sqrt(dx * dx + dy * dy) / radius;
                            if(dist > 1){
                                array.push(0);
                            }else{
                                var w = (1-dist);
                                var s = Math.pow(w,weightCof);
                                w = s / (s + Math.pow((1-w),weightCof));
                                total += w;
                                array.push(w);
                            }
                        }
                    }
                    var i = array.length;
                    while(i-- > 0){
                        array[i] /= total;
                    }
                    return array;
                },
                createSharpenMatrix(size,weightCof){
                    size = this.valideBoxSize(size);
                    var array = this.createGBlurMatrix(size,weightCof);
                    var i = array.length;
                    var total = 0;
                    while(i-- > 0){
                        total += array[i];
                        array[i] = -array[i];
                    }
                    var mid = (size - 1) / 2;
                    array[mid + mid * size] = total + array[mid + mid * size] + 1;
                    return array;
                },
                createOutlineMatrix(size,weightCof){
                    size = this.valideBoxSize(size);
                    var mid = (size - 1) / 2;
                    var array = [];
                    var x,y;
                    var total = 0;
                    for(y = 0; y < size; y++){
                        for(x = 0; x < size; x++){
                            var dist = Math.min(Math.abs(mid-x),Math.abs(mid-y)) + 1;
                            dist *= dist;
                            array.push(1 / dist);
                            total += 1 / dist;
                        }
                    }
                    array[mid + mid * size] = -(total - array[mid + mid * size]);
                    return array;
                },
                createEmbossMatrix(size,width,curve,strength,wCurve){
                    size = this.valideBoxSize(size);
                    var mid = (size - 1) / 2;
                    var midW = (width - 1) / 2;
                    var array = [];
                    var x,y;
                    var total = 0;
                    for(y = 0; y < size; y++){
                        for(x = 0; x < width; x++){
                            var dist = Math.abs((mid-y)/mid);
                            var distW = Math.abs((midW-x)/midW)/2;
                            var w = Math.pow(dist,curve);
                            var wW = Math.pow(dist,wCurve);
                            var d = (w / (w + Math.pow(1-dist,curve)))*strength;
                            d *= (wW / (wW + Math.pow(1-distW,wCurve)))*2;
                            d = y > mid ? -d : d;
                            array.push(d);
                        }
                    }
                    array[mid + mid * width] = 1;
                    return array;


                },
                embossMatrixExpand(matrix,curve,amount){
                    var ydis  = Math.abs(matrix[1]);
                    for(var i = 0; i < matrix.length; i += 3){
                        var y = (Math.abs(matrix[i+1]) / ydis) / 2;
                        var w = Math.pow(y , curve);
                        matrix[i+1] = (w / (w+Math.pow(1-y,curve)))*2*amount * Math.sign(matrix[i+1] ) ;
                    }
                    return matrix;
                },
                matrix2Spacial(matrix){ // adds coordinates to the convolution array
                    var side = Math.sqrt(matrix.length);
                    var size = (side - 1) / 2;
                    var sArray = [];
                    var count = 0;
                    for(var y = 0; y < side; y += 1){
                        for(var x = 0; x < side; x += 1){
                            sArray.push(x - size, y - size, matrix[count ++]);
                        }
                    }
                    return sArray;
                },
                optimiseSpacialMatrix(matrix){ // removes array items that do not contribute to the pixel. ie have a weight of zero
                    var len = matrix.length;
                    for(var i = 0; i < len; i += 3){
                        if(Math.floor(Math.abs(matrix[i+2]) * 1000) / 1000 < 0.001){ // is zero weight
                            matrix.splice(i,3);
                            i-= 3;
                        }
                    }
                    return matrix;
                },
                transformSpacialMatrix(matrix,tranform){
                    var t = transform;
                    var i;
                    for(var i = 0; i < matrix.length; i += 3){
                        var x = matrix[i];
                        var y = matrix[i+1];
                        matrix[i    ] = x * t.a + y * t.c + t.e;
                        matrix[i + 1] = x * t.b + y * t.d + t.f;
                    }
                    return matrix;
                },
                rotateSpacialMatrix(matrix,rotate){
                    var dx = Math.cos(rotate);
                    var dy = Math.sin(rotate);
                    for(var i = 0; i < matrix.length; i += 3){
                        var x = matrix[i];
                        var y = matrix[i+1];
                        matrix[i    ] = x * dx - y * dy;
                        matrix[i + 1] = x * dy + y * dx;
                    }
                    return matrix;
                },
                normalizeMatrix(matrix,isSpacial,amount){
                    var total = 0;
                    var step = isSpacial ? 3 : 1;
                    var side = Math.sqrt(matrix.length/step);
                    var mid = (side - 1) / 2;                        
                    var midIndex = (mid * side + mid) * step;
                    for(var i = 0; i < matrix.length; i += step){
                        if(i !== midIndex){
                            total += matrix[i];
                        }
                    }
                    matrix[midIndex] = Math.abs(total) + amount;
                    return matrix;
                }
            }
        });
        /* get common arguments to use in filters using convolution filter */
        var sArgs = {};
        filterCommon.arguments.forEach(arg => sArgs[arg.name] = arg);
        sArgs.scale = {
            name : "scale",
            description : "Amount of additional scaling. < 0 reduces scale of filter. >1 increases scale of filter",
            type : "Number",
            range : {min : -1, max : 1, step : 0.02, def : 0},
        };
        sArgs.size = {
            name : "size",
            description : "Pixel size of the matrix used by the convolution filter",
            type : "Number",
            range : {min : 3, max : 31, step : 1, def : 3},
        };
        sArgs.weightScale = {
            name : "weightScale",
            description : "Determines how the weighting is distributed over the matrix",
            type : "Number",
            range : {min : -1, max : 1, step : 0.02, def : 0},
        };
        //==============================================================================================================
        filterGL.filters.register("pinSharp",  {
            name : "pinSharp",
            description : "High quality sharpen filter",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(size, scale, weightScale,iterations,noiseReduce, mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);
                var maxIterations  = Math.ceil((21*21*4*2048*1360)/(size*size*glF.width * glF.height * (noiseReduce ? 5 : 1)));
                iterations = iterations > maxIterations ? maxIterations : iterations;
                this.convolutionMatrix = util.optimiseSpacialMatrix(
                    util.matrix2Spacial(
                        util.createSharpenMatrix(
                            size,
                            util.curvePowerNorm(weightScale)
                )));
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true,noiseReduce);
                return glF;
            },
            arguments : [
                sArgs.size, sArgs.scale, sArgs.weightScale, sArgs.iterations, sArgs.noiseReduce, sArgs.mix, sArgs.channels
            ],
        });
        //==============================================================================================================
        filterGL.filters.register("boxBlur",  {
            name : "boxBlur",
            webGLFilters : null,
            description : "Simple Box blur filter",
            callback(size, scale,iterations,mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);
                var maxIterations  = Math.ceil((21*21*4*2048*1360)/(size*size*glF.width * glF.height));
                iterations = iterations > maxIterations ? maxIterations : iterations;
                this.sharpenMatrix = util.matrix2Spacial(
                        util.createBoxBlurMatrix(size)
                );
                glF.convolution(this.sharpenMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true);
                return glF;
            },
            arguments : [ sArgs.size, sArgs.scale,  sArgs.iterations, sArgs.mix, sArgs.channels],
        });
        //==============================================================================================================
        filterGL.filters.register("gBlur",  {
            name : "gBlur",
            description : "Blur filter similar to a Gaussian blur. Iteration limited to prevent WebGL crashing on some systems",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(size, scale, weightScale,iterations,mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);
                var maxIterations  = Math.ceil((21*21*4*2048*1360)/(size*size*glF.width * glF.height));
                iterations = iterations > maxIterations ? maxIterations : iterations;
                this.convolutionMatrix = util.optimiseSpacialMatrix(util.matrix2Spacial(util.createGBlurMatrix(size,util.curvePowerNorm(weightScale))));
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true,false);
                return glF;
            },
            arguments : [ sArgs.size, sArgs.scale, sArgs.weightScale, sArgs.iterations, sArgs.mix, sArgs.channels ],
        });
        //==============================================================================================================
        filterGL.filters.register("outline",  {
            name : "outline",
            description : "Outline filter",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(size, scale,invert,noiseReduce,mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);
                this.convolutionMatrix = util.optimiseSpacialMatrix(util.matrix2Spacial(
                    util.createOutlineMatrix(size,util.curvePowerNorm(0))
                ));
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,noiseReduce);
                if(invert){
                    glF.procedural(undefined,undefined,"R=1-A",0,0,0,0,[0.5,0.5],1,channels);
                }
                return glF;
            },
            arguments : [
                sArgs.size, sArgs.scale,
                {
                    name : "invert",
                    description : "Inverts the colours",
                    type : "Boolean",
                    range: {def : false},
                },
                sArgs.noiseReduce, sArgs.mix, sArgs.channels
            ],
        });
        //==============================================================================================================
        // This filter uses convolution custom shader to process the convolution matrix.
        filterGL.filters.register("denoise",  {
            name : "denoise",
            description : "denoise filter removes noise from low contrast parts of the image.",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(exponent,/*dotBase,*/ hueSat, size, scale,iterations,mix, channels) {
                const dotBase = 0.25;
                exponent = exponent ** 1.5;
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);
                this.convolutionMatrix = util.optimiseSpacialMatrix(util.matrix2Spacial(
                    util.createGBlurMatrix(size,1)
                ));
               
                var custom = {
                    uniform : `
                        uniform float exponent;
                        uniform float dotBase;
                    `,
                    prep : `
                        vec4 col = vec4(0.0);
                        float total = 0.0;
                    `,
                    loop : `
                        float weight = 1.0 - abs(dot(sample.rgb - src1Color.rgb, vec3(dotBase)));
                        weight = pow(weight, exponent);
                        color += sample * weight;
                        total += weight;
                    `,
                    result : `
                        color /= total;
                    `,
                    uniforms : {
                        exponent : exponent,
                        dotBase : dotBase,
                    }
                }
                
                if(hueSat){
                    custom.uniform = `
                        ##rgb2HSL##
                        ##hsl2RGB##
                        uniform float exponent;
                        uniform float dotBase;
                    `;
                    custom.result = `
                        color /= total;
                        vec3 sHSL = rgb2HSL(src1Color.rgb);
                        vec3 rHSL = rgb2HSL(color.rgb);
                        color = vec4(hsl2RGB(vec3(rHSL.x,rHSL.y,sHSL.z)),color.w);
                    `;
                    
                }
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, false, true,false,custom);
                return glF;
            },
            arguments : [{
                    name : "exponent",
                    description : "Does stuff its a number dont you know.",
                    type : "Number",
                    range : {min : 0, max : 100, step : 0.1, def : 9},
                },{
                    name : "HueSat",
                    description : "Filter is applied only to the hue and saturation",
                    type : "Boolean",
                    range : {def : false},
                },
                sArgs.size, sArgs.scale,sArgs.iterations, sArgs.mix, sArgs.channels
            ],
        });
        //==============================================================================================================
        /*filterGL.filters.register("smoothAndSharp",  {
            name : "smoothAndSharp",
            description : "Applies a denoise and sharpen filter",
            webGLFilters : null,
            callback(smooth,sharp,scale,smoothIterate,sharpIterate,wetDryMix, mix, channels) {
                var glF = this.webGLFilters;
                var smoothMix = ((1-Math.sin(wetDryMix * Math.PI/2))/2);
                var sharpMix = ((1-Math.sin(-wetDryMix * Math.PI/2))/2);
                var len = Math.max(smoothMix,sharpMix);
                smoothMix /= len;
                sharpMix /= len;
                glF.denoise(Math.pow((1-smooth)*10,2),0.3,1+5*smooth,0,0,smoothIterate,smoothMix,channels);
                glF.pinSharp(3 + 5*sharp,scale,0,sharpIterate,true,sharpMix,channels);
                return glF;
            },
            arguments : [{
                    name : "smooth",
                    description : "Amount of sharpening.",
                    type : "Number",
                    range : {min :0, max : 1, step : 0.01, def : 0.5},
                },{
                    name : "sharp",
                    description : "Amount of sharpening.",
                    type : "Number",
                    range : {min :0, max : 1, step : 0.01, def : 1},
                },{
                    name : "scale",
                    description : "Scale of sharpening.",
                    type : "Number",
                    range : {min :-1, max : 1, step : 0.01, def : 0},
                },{
                    name : "smoothIterate",
                    description : "number of smooth iterations.",
                    type : "Number",
                    range : {min :1, max : 10, step : 1, def : 1},
                },{
                    name : "sharpIterate",
                    description : "number of sharp iterations.",
                    type : "Number",
                    range : {min :1, max : 10, step : 1, def : 1},
                },{
                    name : "wetDryMix",
                    description : "low values for more smooth, 0 for even mixe high values for more sharp.",
                    type : "Number",
                    range : {min :-1, max : 1, step : 0.01, def : 0},
                },
                 sArgs.mix, sArgs.channels
            ],
        });*/
        //==============================================================================================================
        filterGL.filters.register("emboss",  {
            name : "emboss",
            description : "Emboss filter",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(size, scale,angle,strength, mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                var width = size * 1;
                width = util.valideBoxSize(width);
                size = util.valideBoxSize(size);
                angle *= Math.PI/180;
                strength *= 3;
                this.convolutionMatrix = util.rotateSpacialMatrix(
                    util.optimiseSpacialMatrix(
                        util.embossMatrixExpand(
                            util.matrix2Spacial(
                                util.createEmbossMatrix(
                                    size,
                                    width,
                                    util.curvePowerNorm(0),
                                    strength,
                                    util.curvePowerNorm(0)
                                )
                            ),
                            util.curvePowerNorm(0),
                            3
                        )
                    ),
                    angle
                );
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false);
                return glF;
            },
            arguments : [
                sArgs.size,
                sArgs.scale, 
                {
                    name : "angle",
                    description : "The angle of the embossing (90 deg to the apparent light)",
                    type : "Number",
                    range : {min : 0, max : 360, step : 1, def : 0},
                },{
                    name : "strength",
                    description : "How strong the embossing is.",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.05, def : 1},
                },
                sArgs.mix, sArgs.channels
            ],
        });
        //==============================================================================================================
        filterGL.filters.register("outline2",  {
            name : "outline2",
            description : "Experimental filter uses an accumulating texture to sum one sided edge detection",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(size, scale,angle,iterations, mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);
                var mid = (size - 1) / 2;
                angle *= Math.PI/180;
                var m = this.convolutionMatrix = util.createBoxBlurMatrix(size);
                for(var i = 0; i < m.length; i++){
                    var x = i % size;
                    var y = Math.floor(i / size);
                    if(x === mid){
                        m[i] = -1;
                    }else{
                        m[i] = x-mid;
                    }
                }                 
                this.convolutionMatrix = util.rotateSpacialMatrix(
                    util.optimiseSpacialMatrix(util.matrix2Spacial(util.normalizeMatrix(m,false,-1))),
                    angle
                );
                var tempText = glF.createTexture();
                glF.fromSource(); // forces this filter to start from the source image
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false);
                glF.procedural(undefined,undefined,"Rrgb=v3(meanv3(Argb))",0,0,0,0,[0.5,0.5],1,channels);
                glF.copyBufferTo(tempText);
                for(var i = 1; i < iterations; i+= 1){
                    this.convolutionMatrix = util.rotateSpacialMatrix(this.convolutionMatrix,(2*Math.PI) / (iterations-1));
                    glF.fromSource();
                    glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false);
                    glF.procedural(tempText,undefined,"Rrgb=Brgb+v3(meanv3(Argb))",0,0,0,0,[0.5,0.5],1,channels);
                    glF.copyBufferTo(tempText);
                }
                tempText.destroy();
                return glF;
            },
            arguments : [
                sArgs.size,
                sArgs.scale,{
                    name : "angle",
                    description : "The angle of the embossing (90 deg to the apparent light)",
                    type : "Number",
                    range : {min : 0, max : 360, step : 1, def : 0},
                },{
                    name : "iterations",
                    description : "Number of iterations to rotate the filter 360deg. If set at 1 then only one sample is made.",
                    type : "Number",
                    range : {min : 1, max : 16, step : 1, def : 1},
                },
                sArgs.mix, sArgs.channels
            ],
        });
        //==============================================================================================================        
        filterGL.filters.register("Sobel",  {
                name : "Sobel",
                description : "Sobel filter plus some experiments in regard to how it adapts to the modified convolution method",
                webGLFilters : null,
                convolutionMatrix : null,
                callback(test) {
                    var glF = this.webGLFilters;
                    var util = glF.filters.getFilter("convolution").utilities;

                    //var gradients can use 3 and 10
                    var g1 = 3; // 
                    var g2 = 10;  // 
                    var Gx = [-g1,0,g1,-g2,0,g2,-g1,0,g1];
                    var Gy = [-g1,-g2,-g1,0,0,0,g1,g2,g1];
                    var GSx = util.optimiseSpacialMatrix(util.matrix2Spacial(Gx));
                    var GSy = util.optimiseSpacialMatrix(util.matrix2Spacial(Gx));
                    if(this.shader === undefined){
                        this.sharder  =  glF.Shader(null, null).useLinker();
                    }
                    var cFilter = [...GSx,...GSy];
                    var subFilterLen = cFilter.length/3;
                    var subFilterCount = 2;
                    this.sharder.setFragmentSource(`
                        uniform sampler2D texture;
                        uniform vec3 filter[${cFilter.length}];     
                        uniform vec2 texSize;                    
                        varying vec2 texCoord;
                        const float pi2 = ${(Math.PI*2).toFixed(6)};
                        const float pi = ${Math.PI.toFixed(6)};
                        const float pi0p5 = ${(Math.PI/2).toFixed(6)};
                        ##direction##
                        void main() {
                            vec4 centPixel = texture2D(texture, texCoord);
                            vec4 res = vec4(0.0);
                            vec4 result[${subFilterCount}];
                            vec4 dir;;
                            int k = 0;
                            for (int j = 0; j < ${subFilterCount}; j+= 1) {
                                vec4 color = vec4(0.0);
                                for (int i = 0; i < ${subFilterLen}; i += 1) {
                                    vec4 sample = texture2D(texture, texCoord + vec2(filter[j*${subFilterLen} + i].x,filter[j*${subFilterLen} + i].y) / texSize);            
                                    color += sample * filter[j*${subFilterLen} + i].z;
                                }
                                result[j] = color;
                                res += color*color;
                            }
                            res = sqrt(res);
                            dir = atan(result[1]/result[0]);
                            vec2 vDir = vec2(cos(dir.x),sin(dir.x)) ;
                            vDir += vec2(cos(dir.y),sin(dir.y)) ;
                            vDir += vec2(cos(dir.z),sin(dir.z)) ;
                            float strength = res.x + res.y + res.z;
                            strength /= 3.0;
                            float d = direction(vDir) /pi2;                           
                            gl_FragColor = vec4(vec3(strength),1);
                        }                    
                    `);
                    var uniformObj = {
                        filter: {type : "uniform3fv", value : cFilter},
                        texSize : [glF.width,glF.height],
                    };
                    glF.filter(this.sharder,uniformObj);
                    return glF;
                },
                arguments : [
                    {
                        name : "test",
                        description : "BS data as my UI needs a arg or it spits it",
                        type : "Number",
                        range : {min : 0.05, max : 2, step : 0.05, def : 1},
                    },
                ],
            }
        );
        //==============================================================================================================
        filterGL.filters.register("reduceNoise",  {
            name : "reduceNoise",
            description : "Various filters that can remove different types of noise from BW scanned images (also images from outline filters) ",
            webGLFilters : null,
            convolutionMatrix : null,
            customProcessing : {
                uniform : `
                    uniform float threshold;
                    uniform int outputType;
                    uniform int blackToAlpha;
                `,
                prep : `
                    float total1 = 0.0;
                    float total = 0.0;
                    float count = 0.0;
                `,
                loop : `
                    float val = (sample.r + sample.g + sample.b) / 3.0;
                    total += abs(val - filter[i].z);
                    total1 += abs(val - (1.0-filter[i].z));
                    count += 1.0;
                `,
                result : `
                    total /= count;
                    total1 /= count;
                    if(total < threshold && total1 > 1.0-threshold){
                        total = 0.0;
                    }else{
                        total = 1.0;
                    }
                    if(outputType == 2){
                        color = vec4(vec3(total),src1Color.a);
                    }else if(outputType == 1){
                        if(total > 0.5){
                            color = vec4(vec3(1.0), src1Color.a);
                        }else{
                            color = src1Color;
                        }
                    }else if(outputType == 0){
                        if(total < 0.5){
                            color = vec4(vec3(0.0), src1Color.a);
                        }else{
                            color = src1Color;
                        }
                    }
                    if(blackToAlpha == 1){
                        color.a *= total;
                    }
                `,
                uniforms : {
                    threshold : 0.5,
                    outputType : { type : "uniform1i", value : 1 },
                    blackToAlpha : { type : "uniform1i", value : 0 },
                }
            },         
            callback( type,invert,blackToAlpha,keep,threshold,size, scale, angle,mix, channels) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;
                size = util.valideBoxSize(size);

                var mat = util.createBoxBlurMatrix(size);
                var mid = (size - 1) / 2;    
                var index = 0;
                for(var y = 0; y < size; y ++){
                    for(var x = 0; x < size; x ++){
                        mat[index++] = 0;
                    }
                }
                index = 0;
                halfMid = Math.floor(mid / 2);
                for(var y = 0; y < size; y ++){
                    for(var x = 0; x < size; x ++){
                        if(type === "KeepLines"){
                            if(Math.abs(x-mid)<= halfMid){
                                mat[index] = 1;
                            }
                        }else if(type === "checker"){
                            if(((x % 2) + y) % 2 === 1){
                                mat[index] = 1;
                            }
                            
                        }else if(type === "checker2"){
                            if(((Math.floor(x/2) % 2) + Math.floor(y/2)) % 2 === 1){
                                mat[index] = 1;
                            }
                            
                        }else if(type === "box"){
                            if(x > halfMid && x < size-1-halfMid && y > halfMid && y < size-1-halfMid){
                                mat[index] = 1;
                            }
                            
                        }else if(type === "KeepEdges"){
                            if(x === mid){
                                mat[index] = 0.5;
                            }else if(x > mid){
                                mat[index] = 1;
                            }
                        }else if(type === "KeepMarks"){
                            if(x > mid || y > mid){
                                mat[index] = 1;
                            }
                        }else if(type === "KeepLines2"){
                            if(Math.sqrt((x-mid) * (x-mid) + (y-mid) * (y-mid)) <= halfMid){
                                mat[index] = 1;
                            }
                        }
                        if(invert){
                            mat[index] = 1-mat[index];
                        }
                        index += 1;
                    }
                }
                this.convolutionMatrix = util.rotateSpacialMatrix(util.matrix2Spacial(mat),angle * (Math.PI/180 ));
                
                this.customProcessing.uniforms.threshold = threshold;
                this.customProcessing.uniforms.outputType.value = ["Black","White","Black&White","Original"].indexOf(keep);
                this.customProcessing.uniforms.blackToAlpha.value = blackToAlpha ? 1 : 0;
                
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false,this.customProcessing);
                return glF;
            },
            arguments : [{
                    name: "Type",
                    description : "Type of detail to keep",
                    type : "String",
                    range : ["KeepLines","KeepLines2","KeepEdges","KeepMarks","checker","checker2","box"]
                },{
                    name: "invert",
                    description : "Inverts the test shape intensity",
                    type : "Boolean",
                    range : {def : false}
                },{
                    name: "BlackToAlpha",
                    description : "If on then black is sent to the alpha channel as transparent",
                    type : "Boolean",
                    range : {def : false}
                },{
                    name: "Keep",
                    description : "What part of the result to keep.",
                    type : "String",
                    range : ["Black","White","Black&White","Original"],
                },{
                    name: "threshold",
                    description : "Sensitivity of the test",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.001, def : 1}
                },
                
                sArgs.size, sArgs.scale, 
                {
                    name: "angle",
                    description : "Angle that matrix is applied",
                    type : "Number",
                    range : {min : 0, max : 360, step : 1, def : 0},
                }
                , sArgs.mix, sArgs.channels
            ],
        });
        

    }());
}









