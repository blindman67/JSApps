"use strict";
/*
Shorthand filter shader language


Defined variables

This is a list of pre defined variables that provide acess to data

Vector types

   v2() as vec2
   v3() as vec3
   v4() as vec4

Example

    v2(1) creates vec2(1.0, 1.0)
    v4(v3(1), 0) create vec4(1.0, 1.0, 1.0, 0.0)

Color inputs as vec4, Read only

HSL values are automatic

    A src texture 0 as vec4
	B src texture 1 as vec4
	C src texture 2 as vec4

Access channels

	Argb, Ar, Ag, Ab, Aa  for red green blue and alpha channels
	Ahsl, Ah, As, Al  for hue saturation and luminance.

Output color (result). Read write, initial value vec4(0,0,0,0)

    R, Rrgb, Rr, Rg, Rb, Ra

Only has RGBA values. Example of converting from HSL to result

    C1hsl = v4(0,1,0.5); // red
	R = v4(C1rgb, 1);    // outputs vec4(1,0,0,1)

Texture input coordinates range 0-1. Read only

    XY1, X1, Y1, as texture 0 coordinate as vec2
	XY2, X2, Y2,  as texture 1 coordinate as vec2
	XY3, X3, Y3,  as texture 2 coordinate as vec2

Pixel output coordinate	range 0-1. Top left is v2(0,0)

    XY, X, Y as output coodinate

Text width and height input as absolute pixel value

    WH1 width and height of texture 0 in pixels
    WH2 width and height of texture 1 in pixels
    WH3 width and height of texture 2 in pixels


General purpose color registers have same extension names as input colors. HSL <> RGB conversion is automatic

    D, E, c1, c2, c3, c4, c5




rgba for channels red, green, blue, alpha.
hsl for hue, saturation, luminance

The HSL and RGB colour models are automaticly converted as needed.

    c1 = vec4(0,0,1,1);
	c1hsl will return the value vec3(0.75, 1, 0.5)





                rV3 : "randomV3()",
                Pxy : "point",

                WH1 : "texSize",
                WH2 : "texSize2",
                WH3 : "texSize3",

                rF  : "randomF()",



                Fa : "floatA",
                Fb : "floatB",
                Fc : "floatC",
                Fd : "floatD",
                Px : "point.x",
                Py : "point.y",
                Va : "valueA",
                Vb : "valueB",
                Vc : "valueC",
                Vd : "valueD",

                R : "color",
                SA  : "tex1",
                SB  : "tex2",
                SC  : "tex3",
                Sa  : "texA1",
                Sb  : "texA2",
                Sc  : "texA3",






*/




const proceduralFilter = {
    name :"procedural",
    description : "This filter uses procedural strings to apply filters",
    webGLFilters : null,
    shader : null,
    shaderPhoton : null,
    functions : [],
    lastFunction : { val : null, shader : null },
    callback(source2, source3, filterFunction, valueA, valueB, valueC, valueD, point, mix, channels,data = {}) {
        var glF = this.webGLFilters;
        const lastFunction = proceduralFilter.lastFunction;

        var mods;
        var usingTextures = { t : true, t1 : false, t2 : false, };
        var filterHash = this.utilities.hashString(filterFunction);
        if (filterHash === lastFunction.filterHash) {
            this.shader = lastFunction.shader;
            usingTextures.t1 = lastFunction.textures1;
            usingTextures.t1 = lastFunction.textures1;
            mods = lastFunction.mods;
        } else {
            var func = proceduralFilter.functions.find(f => f.filterHash === filterHash);
            if (func !== undefined) {
                this.shader = func.shader;
                usingTextures.t1 = func.textures1;
                usingTextures.t2 = func.textures2;
                mods = func.mods;
            } else {
                lastFunction.filterHash = filterHash;
                lastFunction.val = filterFunction;
                var source = this.utilities.evaluateFilterFunction(filterFunction);
                this.shader = lastFunction.shader = glF.Shader(null, null).useLinker();
                usingTextures.t1 = source.included.indexOf("texture1") > -1;
                usingTextures.t2 = source.included.indexOf("texture2") > -1;
                mods = source.mods;
                var commonDecs = `
                    uniform sampler2D texture;
                    varying vec2 texCoord;
                    ##standardMixUniforms##
                    ${source.included}
                `;
                var commonMain = `
                        vec4 src1Color = texture2D(texture, texCoord);
                        vec4 color;
                        ${source.defined}
                `;


                this.shader.setFragmentSource(`
                    ${commonDecs}
                    void main() {
                        ${commonMain}
                        ${source.shaderSource}
                        ##standardMixResult##
                    }
                `);
                console.log("saved new shader as '" + filterHash + "'");
                proceduralFilter.functions.push({
                    val : filterFunction,
                    filterHash : filterHash,
                    shader : lastFunction.shader,
                    textures1 : usingTextures.t1,
                    textures2 : usingTextures.t2,
                    mods
                });
            }
        }
        lastFunction.filterHash = filterHash;
        lastFunction.val = filterFunction;
        lastFunction.shader = this.shader;
        lastFunction.textures1 = usingTextures.t1;
        lastFunction.textures2 = usingTextures.t2;
        lastFunction.mods = mods;
        const colorData = {};
        if(data.hue !== undefined){
            Object.assign(colorData, this.shader.getLinkedInUniforms("colorsHSL",[data]));
        }else{
            Object.assign(colorData, this.shader.getLinkedInUniforms("colors",[data]));
        }
        var uniformObj = Object.assign({
                valueA, valueB, valueC, valueD,
                point: point ? [point[0], point[1]] : undefined,
                texSize2 : [
                    source2 ? source2.width : glF.width,
                    source2 ? source2.height : glF.height,
                ],
                texSize3 : [
                    source3 ? source3.width : glF.width,
                    source3 ? source3.height : glF.height,
                ]

            },
            this.shader.getLinkedInUniforms("standardMixUniforms", [  mix, channels, glF.width, glF.height ]),
            colorData,
        );
        if (point && point.length >= 3) {
            uniformObj.axis = point.length === 3 ? [point[2], point[2] + Math.PI / 2] : [point[2], point[3]];
        }
        if (usingTextures.t1) {
            if (source2) {
                source2.bind(1);
                uniformObj.texture1 = { type : "uniform1i", value : 1 };
            } else {
                uniformObj.texture1 = { type : "uniform1i", value : 0 };
            }
        }
        if (usingTextures.t2) {
            if (source3) {
                source3.bind(2);
                uniformObj.texture2 = { type : "uniform1i", value : 2 };
            } else {
                uniformObj.texture1 = { type : "uniform1i", value : 0 };
            }
        }
        if(mods !== undefined){
            Object.keys(mods).forEach(name => {
                if(name === "HueClamp"){
                    uniformObj.clampResult = { type : "uniform1i", value : mods[name] };//mods[name];
                }else if(name !== undefined && uniformObj[name] !== undefined){
                    var arg = proceduralFilter.arguments.find(arg=> arg.name === name);
                    if(arg && arg.type === "Number" && arg.range){
                        var range = arg.range;
                        var v = uniformObj[name];
                        var tr = (range.max-range.min);
                        v -= range.min;
                        v /= tr;
                        if(mods[name].min==="pEase"){
                            var max  = Number(mods[name].max) - 1;
                            uniformObj[name] = v < 0.5 ? 1 / ((0.5 - v) * max + 1) : (v - 0.5) * max + 1;

                        } else if(mods[name].min==="pNorm"){
                            var max  = Number(mods[name].max);
                            if(Number(mods[name].max) === -1){
                                uniformObj[name] = this.utilities.curvePowerNorm(1-v);
                            }else if(Number(mods[name].max) > 0){
                                uniformObj[name] = this.utilities.curvePowerNorm(v, Number(mods[name].max));
                            }else{
                                uniformObj[name] = this.utilities.curvePowerNorm(v);
                            }
                        }else{
                            v *= (Number(mods[name].max) - Number(mods[name].min));
                            v += Number(mods[name].min);
                            uniformObj[name] = v;
                        }

                    }
                }
            });
        }
        // random uniforms may or may not be present
        // If random is used these will set a fresh seed
        uniformObj.randomizerV3 = Math.random();
        uniformObj.randomizerF = Math.random();



        glF.filter(this.shader, uniformObj);
        return glF; // Not a must but allows users to chain filters
    },
    arguments : [{
            name : "source2",
            description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
            type : "Image",
            range : null,
        },{
            name : "source3",
            description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
            type : "Image",
            range : null,
        },{
            name : "filterFunction",
            description : "filterFunction",
            type : "String",
            range : ["R=A-B",]
        },{
            name : "valueA",
            description : "The value of a variable that can be used in the filters procedure",
            type : "Number",
            range : {min : -256, max : 256, step : 1, def : 256},
        },{
            name : "valueB",
            description : "The value of a variable that can be used in the filters procedure",
            type : "Number",
            range : {min : -256, max : 256, step : 1, def : 256},
        },{
            name : "valueC",
            description : "The value of a variable that can be used in the filters procedure",
            type : "Number",
            range : {min : -256, max : 256, step : 1, def : 256},
        },{
            name : "valueD",
            description : "The value of a variable that can be used in the filters procedure",
            type : "Number",
            range : {min : -256, max : 256, step : 1, def : 256},
        },{
            name : "point",
            description : "A 2D point and X and Y, 3D point x, y and rotate, 4D x, y and rotate axis x, y",
            type : "Vec4",
            range : {def : [0.5, 0.5, 0, Math.PI / 2]},
        },{
            name : "mix",
            description : "The amount to mix the convolution array result with the original image, 1 is full result, 0 is original image.",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "channels",
            description : "R,G,B,A channels, BW mean RGB as black and white. Apply to all pixels or L lighter, D darker",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,AL,BWL,RGBD,RGBAD,AD,BWD".split(","),
            itemHelp : [
                "Apply to red, green, and blue, channels",
                "Apply to red, green, blue, and alpha channels",
                "Treat pixels as if gray scale",
                "Apply to alpha channel only",
                "Apply to red channel only",
                "Apply to green channel only",
                "Apply to blue channel only",
                "Apply to red and green channels only",
                "Apply to red and blue channels only",
                "Apply to blue and green channels only",
                "Apply to red, green, and blue, channels\nResult only if value is lighter",
                "Apply to red, green, blue, and alpha channels\nResult only if value is lighter",
                "Alpha and only if result is lighter (higher)",
                "Treat pixels as if gray scale\nResult only if value is lighter",
                "Apply to red, green, and blue, channels\nResult only if value is darkerer",
                "Apply to red, green, blue, and alpha channels\nResult only if value is darkerer",
                "Alpha and only if result is darker (lower)",
                "Treat pixels as if gray scale\nResult only if value is darkerer",
            ]

        }/*,{
            name : "usePhotonCount",
            description : "Some filters such as blur will produce dark color where hue contrast is high resulting in an artificial looking blur. If this is true the filter applies the photon count of each channel rather than the intensity. ",
            type : "Boolean",
            range : {def : false},
        }*/,{
            name : "data",
            description : "Objects contain procedure specific uniforms",
            type : "Object",
            range : {def : {}},
        }
    ],
    utilities : {
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
        createMatrixFromRGBPixels(b8, size, pixelSize, min, max){ // creates a matrix from pixel data in format RGBA 8bits, stride = size * pixelSize * 4
            if (size % 2 !== 1) { log.warn("Matrix image size must be ODD"); return [0,0,0,0,1,0,0,0,0]; }
            const stride = size * pixelSize;
            const subPx = 1 / (pixelSize * pixelSize);
            const len = size * size;
            const radius = size / 2;
            const array = [];      
            var total = 0, x, y, xx, yy;
            for (y = 0; y < size; y ++) {
                const py = y * pixelSize;
                for (x = 0; x < size; x ++) {
                    const px = x * pixelSize;
                    let sum = 0;
                    for (yy = 0; yy < pixelSize; yy ++) {
                        for (xx = 0; xx < pixelSize; xx ++) {
                            const idx = (px + xx + (py + yy) * stride) * 4;
                            sum += (b8[idx + 0] + b8[idx + 1] + b8[idx + 2]) /  765;
                        }
                    }
                    array.push(sum * subPx);
                }
            }
            var i = array.length;
            const range = max - min;
            while(i-- > 0){
                array[i] = array[i] * range + min;
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
        createSobelMatrix(size, width, curve, strength, wCurve){
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
                    var w = dist ** curve;
                    var wW =dist ** wCurve;
                    var d = (w / (w + Math.pow(1 - dist, curve))) * strength;
                    d *= (wW / (wW + Math.pow(1 - distW, wCurve))) * 2;
                    d = y === mid ? 0 : (y < mid ? d : -d);
                    array.push(d);
                }
            }
            //array[mid + mid * width] = 1;
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
        },
        curvePowerNorm(val,amount){ // very simple attempt to normalised the amount of movement on a slider when using exponential functions
            if(amount === undefined){
                amount = 3;
            }else{
                amount = -((0.4*amount + 5) / (0.4*amount + (5/6)))+6;
            }
            return Math.pow(((val * amount) + 5)/5,Math.log2(10));
        },
        hashString(str){
            var i, hval;
            hval = 0x811c9dc5;
            for (i = 0 ; i < str.length; i += 1) {
                hval ^= str.charCodeAt(i);
                hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
            }
            return ("0000000" + hval.toString(32)).substr(-4);
        },
        evaluateFilterFunction(func){
            func = func.replace(/ /g,""); // remove spaces
            func = func.replace(/\n|\r|\t/g,""); // remove line feed return and tabs
            var modifiers = func.split("#");
            func = modifiers.shift();
            if(func[func.length-1] !== ";"){
                func += ";";
            }
            function addFields(obj,namePre, names, refPre,refs,propNames, propRefs = propNames) {
                names = names.split(",");
                refs = refs.split(",");
                propNames = propNames.split(",");
                propRefs= propRefs.split(",");
                var c = propNames.length;
                var len = c ** c;
                var idx = 0, i,pos,pn,pr;
                while (idx < len) {
                    i = 0;
                    pos = 1;
                    pn = "";
                    pr = "";
                    while(i < c) {
                        const pi = (idx / pos | 0) % c
                        pn += propNames[pi];
                        pr += propRefs[pi];
                        i++;
                        pos *= c;
                    }
                    idx++
                    i = 0;
                    while (i < names.length) {
                        obj[namePre + names[i] + pn] = refPre + refs[i] + pr;

                        i++;
                    }
                }
                return obj;
            }
            const fields = {
                Ahsl : "src1ColorHSL",
                Bhsl : "src2ColorHSL",
                ...addFields({},"","A,B,C","src","1Color.,2Color.,3Color.","r,g,b"),
                ...addFields({},"","B,C","src","2Color.,3Color.","r,g,b"),
                ...addFields({},"","D,E","colorTemp","2.,3.","r,g,b"),
                ...addFields({},"","R", "","color.","r,g,b"),
                rV3 : "randomV3()",
                Pxy : "point",
                Aij : "axis",
                XY1 : "coord1",
                XY2 : "coord2",
                XY3 : "coord3",
                WH1 : "texSize",
                WH2 : "texSize2",
                WH3 : "texSize3",
                rF  : "randomF()",
                Ar : "src1Color.r",
                Ag : "src1Color.g",
                Ab : "src1Color.b",
                Aa : "src1Color.a",
                Ah : "src1ColorHSL.r",
                As : "src1ColorHSL.g",
                Al : "src1ColorHSL.b",
                Br : "src2Color.r",
                Bg : "src2Color.g",
                Bb : "src2Color.b",
                Ba : "src2Color.a",
                Bh : "src2ColorHSL.r",
                Bs : "src2ColorHSL.g",
                Bl : "src2ColorHSL.b",
                Rr : "color.r",
                Rg : "color.g",
                Rb : "color.b",
                Ra : "color.a",
                Cr : "src3Color.r",
                Cg : "src3Color.g",
                Cb : "src3Color.b",
                Ca : "src3Color.a",
                Dr : "colorTemp2.r",
                Dg : "colorTemp2.g",
                Db : "colorTemp2.b",
                Da : "colorTemp2.a",
                Er : "colorTemp3.r",
                Eg : "colorTemp3.g",
                Eb : "colorTemp3.b",
                Ea : "colorTemp3.a",
                Fa : "floatA",
                Fb : "floatB",
                Fc : "floatC",
                Fd : "floatD",
                Px : "point.x",
                Py : "point.y",
                Ai : "axis.x",
                Aj : "axis.y",
                XY : "texCoord",
                X1 : "coord1.x",
                Y1 : "coord1.y",
                X2 : "coord2.x",
                Y2 : "coord2.y",
                X3 : "coord3.x",
                Y3 : "coord3.y",
                Va : "valueA",
                Vb : "valueB",
                Vc : "valueC",
                Vd : "valueD",
                W1 : "texSize.x",
                W2 : "texSize2.x",
                W3 : "texSize3.x",
                H1 : "texSize.y",
                H2 : "texSize2.y",
                H3 : "texSize3.y",
                X : "texCoord.x",
                Y : "texCoord.y",
                A : "src1Color",
                B : "src2Color",
                R : "color",
                C : "src3Color",
                D : "colorTemp2",
                E : "colorTemp3",
            };
            const compoundFields = {
                V2: [{ name: "vecV2", props: "xy", regStr: "V2[xy]{0,2}"  }],
                V3: [{ name: "vecV3", props: "xyz", regStr: "V3[xyz]{0,3}"  }],
                V4: [{ name: "vecV4", props: "xyzw", regStr: "V4[xyzw]{0,4}"  }],
                /*R: { props: "rgba", name: "color", regStr: "R[rgba]{0,4}"   },
                A: { props: "rgba", name: "src1Color", regStr: "A[rgba]{0,4}"   },
                B: { props: "rgba", name: "src2Color", regStr: "B[rgba]{0,4}"   },
                C: { props: "rgba", name: "src3Color", regStr: "C[rgba]{0,4}"   },
                D: { props: "rgba", name: "colorTemp2", regStr: "D[rgba]{0,4}"   },
                E: { props: "rgba", name: "colorTemp3", regStr: "E[rgba]{0,4}"   },*/
                c: [{ name: "color", props: "rgbahsl", refs: "rgbargb", postFix: "12345", namePostFix: [..."12345"], regStr: "c[12345][rgbahsl]{0,4}" } ],

            }

            var funcs = {
                length : "length",
                select4: "selectRange4",
                hsl2RGB : "hsl2RGB",
                select1: "selectRange1",
                rgb2H  : "rgb2H",
                rgb2S  : "rgb2S",
                rgb2L  : "rgb2L",
                clamp  : "clamp",
                sStep  : "smoothstep",
                meanv4 : "meanv4",
                meanv3 : "meanv3",
                meanv2 : "meanv2",
				negInv : "negInv",
                cross  : "cross",
                maxv4  : "maxv4",
                maxv3  : "maxv3",
                maxf4  : "maxf4",
                maxf3  : "maxf3",
                minv4  : "minv4",
                minv3  : "minv3",
                minf4  : "minf4",
                minf3  : "minf3",
                ease4 : "easeInOut4",
                ease3 : "easeInOut3",
                dist  : "distance",
                norm  : "normalize",
                bCyc  : "bCyc",
                bump : "bump",
                step : "step",
                ease : "easeInOut",
                min : "min",
                max : "max",
                pow : "pow",
                dot : "dot",
                abs : "abs",
                sin : "sin",
                cos : "cos",
                min : "min",
                max : "max",
                mix : "mix",
                all: "all",
                any: "any",
                gte: "greaterThanEqual",
                lte: "lessThanEqual",
                not: "not",
                pi2 : (Math.PI * 2).toFixed(6),
                pi : Math.PI.toFixed(6),
                SA  : "tex1",
                SB  : "tex2",
                SC  : "tex3",
                Sa  : "texA1",
                Sb  : "texA2",
                Sc  : "texA3",

                v2 : "vec2",
                v3 : "vec3",
                v4 : "vec4",
                gt : "greaterThan",
                lt : "lessThan",
                ne : "notEqual",
                e  : "equal",
            }
            const defines = {
                colorTemp2 : "vec4 colorTemp2 = vec4(0.0);",
                colorTemp3 : "vec4 colorTemp3 = vec4(0.0);",
                src2Color : "vec4 src2Color = texture2D(texture1, texCoord);",
                src3Color : "vec4 src3Color = texture2D(texture2, texCoord);",
                floatA : "float floatA = 0.0;",
                floatB : "float floatB = 0.0;",
                floatC : "float floatC = 0.0;",
                floatD : "float floatD = 0.0;",
                vecV2 : "vec2 vecV2 = vec2(0.0);",
                vecV3 : "vec3 vecV3 = vec3(0.0);",
                vecV4 : "vec4 vecV4 = vec4(0.0);",
                coord1 : "vec2 coord1 = texCoord * texSize;",
                coord2 : "vec2 coord2 = texCoord * texSize2;",
                coord3 : "vec2 coord3 = texCoord * texSize3;",
                src1ColorHSL : "vec3 src1ColorHSL = rgb2HSL(src1Color.rgb);",
                src2ColorHSL : "vec3 src2ColorHSL = rgb2HSL(src2Color.rgb);",
                src3ColorHSL : "vec3 src3ColorHSL = rgb2HSL(src3Color.rgb);",
                randomV3 : "seedV3 = randomizerV3;",
                randomF : "seedF = randomizerF;",
            };
            const includes = {
                ColorHSL  : "##rgb2HSL##",
                hsl2RGB   : "##hsl2RGB##",
                rgb2H     : "##rgb2H##",
                rgb2S     : "##rgb2S##",
                rgb2L     : "##rgb2L##",
                selectRange4: "##selectRange4##",
                selectRange1: "##selectRange1##",
                easeInOut4 : "##easeInOut4##",
                easeInOut3 : "##easeInOut3##",
                easeInOut : "##easeInOut##",
                randomV3  : "uniform float randomizerV3;\n##randomV3##",
                randomF  : "uniform float randomizerF;\n##randomF##",
				negInv    : "##negInv##",
                meanv4    : "##meanv4##",
                meanv3    : "##meanv3##",
                meanv2    : "##meanv2##",
                bCyc      : "##bCyc##",
                bump      : "##bump##",
                maxv4     : "##maxv4##",
                maxv3     : "##maxv3##",
                maxf4     : "##maxf4##",
                maxf3     : "##maxf3##",
                minv4     : "##minv4##",
                minv3     : "##minv3##",
                minf4     : "##minf4##",
                minf3     : "##minf3##",
                color1    : "uniform vec4 color1;",
                color2    : "uniform vec4 color2;",
                color3    : "uniform vec4 color3;",
                color4    : "uniform vec4 color4;",
                color5    : "uniform vec4 color5;",
                coord2    : "uniform vec2 texSize2;",
                coord3    : "uniform vec2 texSize3;",
                valueA    : "uniform float valueA;",
                valueB    : "uniform float valueB;",
                valueC    : "uniform float valueC;",
                valueD    : "uniform float valueD;",
                src2Color : "uniform sampler2D texture1;",
                src3Color : "uniform sampler2D texture2;",
                tex1      : "##sampleTexture1##",
                tex2      : "##sampleTexture2##",
                tex3      : "##sampleTexture3##",
                texA1      : "##sampleTextureAbsolute1##",
                texA2      : "##sampleTextureAbsolute2##",
                texA3      : "##sampleTextureAbsolute3##",
                point     : "uniform vec2 point;",
                axis     : "uniform vec2 axis;",
            };

            function getCompoundField(str) {
                var l = str.length;
                while (l-- > 0) {
                    const p = str.slice(l + 1);
                    const f = str.slice(0,l+1);
                    const cfa = compoundFields[f];
                    if (cfa) {
                        let ci = cfa.length;
                        while (ci--) {
                            const cf = cfa[ci];
                            if (cf.postFix) {
                                if (cf.postFix.includes(p[0])) {
                                    const pp = p.slice(1);
                                    const pidx = cf.postFix.indexOf(p[0]);
                                    if (pp.length === 0) { return cf.name + cf.namePostFix[pidx] }
                                    if ([...pp].every(p=>cf.props.includes(p))) {
                                        if (cf.refs) {
                                            const rpp = [...pp].map(p => cf.refs[cf.props.indexOf(p)]).join("");
                                            return cf.name + cf.namePostFix[pidx] + "." + rpp;
                                        }
                                        return cf.name + cf.namePostFix[pidx] + "." + pp;
                                    }
                                }

                            } else {
                                if (p.length === 0) { return cf.name }
                                if ([...p].every(p=>cf.props.includes(p))) {
                                    if (cf.refs) {
                                        const rp = [...p].map(p => cf.refs[cf.refs.indexOf(p)]).join("");
                                        return cf.name  + "." + rp;
                                    }
                                    return cf.name + "." + p;
                                }
                            }
                        }
                    }
                }
                return undefined;

            }
            function toToken(str) {
                if (str === "") { return str }
                if (funcs[str] !== undefined) { return funcs[str] }
                if (fields[str] !== undefined) { return fields[str] }
                const isCompoundField = getCompoundField(str);
                if (isCompoundField !== undefined) {
                    log("VAR: " + str + " to: " + isCompoundField);
                    return isCompoundField
                }
                if ("+-/*=>=<=(),".indexOf(str) > -1) { return str }
                if (!isNaN(str)) { return str.indexOf(".") === -1 ? str + ".0" : str }
                if (str === ";") { return newLine }
                return "";
            }
            var newLine = ";\n";
            // Create source code via simple find and replace method. This means the order of
            // the above info is important, longer strings first
            var shaderSource = "";
            var regString = Object.keys(funcs).join("|");
            regString += "|" + Object.keys(fields).join("|");
            regString += "|" + Object.keys(compoundFields).reduce((reg,key) => reg + compoundFields[key].map(cf=>cf.regStr).join("|") + "|","");
            regString += "==|<=|>=\\=|\\+|\\-|\\*|\\/|\/|<|>|;|\\(|\\)";
            regString += "|[0-9]*\\.*[0-9]*|\\.";

            var reg = new RegExp(regString,"g");
            log("Compiling FLV1.1: " + func);
            shaderSource = func.replace(reg, toToken);
            var defined = "";
            Object.keys(defines).forEach(name=>{
                if(shaderSource.indexOf(name) > -1) { defined += defines[name] + "\n"; }
            });
            var included = "";
            Object.keys(includes).forEach(name=>{
                if(shaderSource.indexOf(name) > -1){  included += includes[name] + "\n"; }
            });
            var mods = {};
            modifiers.forEach(val => {
                var vmm = val.split(",");
                if(vmm[0]==="HueClamp"){
                    mods["HueClamp"] = vmm[1]=="On"?1:0;
                }else{
                    if(vmm[0][0] === "V"){
                        vmm[0] = "value"+vmm[0][1].toUpperCase();
                    }
                    mods[vmm[0]] = {min : vmm[1], max : vmm[2]};
                }
            })
            return {
                shaderSource,
                defined,
                included,
                mods,
            };

        }
    }
};
(()=>{
    filterGL.filters.register(proceduralFilter.name, proceduralFilter);
    const registeredFilter = filterGL.filters.getFilter(proceduralFilter.name);
    registeredFilter.webGLFilters[proceduralFilter.name] = registeredFilter.callback;
    registeredFilter.webGLFilters.utilities = proceduralFilter.utilities;
})();


 const convolutionFilter = {
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
                this.customSource.uniform = custom.uniform;  // This line throws can not create property uniform on String (Have not looked into it yet)
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
        const filt = convolutionFilter;
        var filtA, filtB, tripple = false,lenT;
        if(convolutionMatrix.isTripple) {
            tripple = true;
            filtA = convolutionMatrix.channelA;
            filtB = convolutionMatrix.channelB;
            convolutionMatrix = convolutionMatrix.main;
        }
        var len = convolutionMatrix.length;
        if(matrixHasOffsets){
            var filtArray = convolutionMatrix;
            len /= 3;
        }else{
            var filtArray = filt.utilities.optimiseSpacialArray(filt.utilities.matrix2Spacial(convolutionMatrix));
            len = filtArray.length / 3;
        }
        var commonDecs = `
            uniform sampler2D texture;
            uniform vec3 filter[${len}];
            ${tripple ? "uniform vec2 filterA["+len+"];":""}
            ${tripple ? "uniform vec2 filterB["+len+"];":""}
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
        if(!this.shader || !filt.shaderPhoton || !filt.shaderPhotonSub){
            this.shader           = glF.Shader(null, null).useLinker(); // create filter source later
            filt.shaderSub        = glF.Shader(null, null).useLinker(); // create filter source later
            filt.shaderPhoton     = glF.Shader(null, null).useLinker(); // create filter source later
            filt.shaderPhotonSub  = glF.Shader(null, null).useLinker(); // create filter source later
            filt.shaderCustom     = glF.Shader(null, null).useLinker(); // has custom weighting function
            filt.shaderTripple    = glF.Shader(null, null).useLinker(); // has seperate spacial for rgb channels
            filt.shaderTrippleSub = glF.Shader(null, null).useLinker(); // has seperate spacial for rgb channels
        }
        if(filt.matrixSize !== len || filt.isNewCustomSource(custom)){
            filt.customSource = custom;
            filt.shaderCustom.setFragmentSource( `
                ${commonDecs}
                ${filt.customSource.uniform}
                void main() {
                    ${commonMain}
                    ${filt.customSource.prep}
                    for (int i = 0; i < ${len}; i += 1) {
                        vec4 sample = texture2D(texture, texCoord + vec2(filter[i].x, filter[i].y) / texSize);
                        ${filt.customSource.loop}
                    }
                    ${filt.customSource.result}
                    ##standardMixResult##
                }
            `);
        }
        if(filt.matrixSize !== len){
            this.shaderTripple.setFragmentSource( `
                ${commonDecs}
                void main() {
                    ${commonMain}
                    for (int i = 0; i < ${len}; i += 1) {
                        vec4 sample = texture2D(texture, texCoord + vec2(filter[i].x, filter[i].y) / texSize);
                        vec4 sampleA = texture2D(texture, texCoord + filterA[i] / texSize);
                        vec4 sampleB = texture2D(texture, texCoord + filterB[i] / texSize);
                        float wA = filter[i].z / 3.0;
                        color += vec4((sample.r + sample.g + sample.b) * wA, (sampleA.r + sampleA.g + sampleA.b)  * wA, (sampleB.r + sampleB.g + sampleB.b) * wA, 1.0);
                    }
                    ##standardMixResult##
                }
            `);
            this.shaderTrippleSub.setFragmentSource( `
                ${commonDecs}
                vec3 subMatrix[5];
                void main() {
                    ${commonMain}
                    ${commonSubSetup}
                        for (int i = 0; i < ${len}; i += 1) {
                            vec4 sample = texture2D(texture, texCoord + (vec2(filter[i].x, filter[i].y) + offset.xy) / texSize);
                            vec4 sampleA = texture2D(texture, texCoord + (filterA[i] + offset.xy) / texSize);
                            vec4 sampleB = texture2D(texture, texCoord + (filterB[i] + offset.xy) / texSize);
                            float wA = filter[i].z / 3.0;
                            subSamp += vec4((sample.r + sample.g + sample.b) * wA, (sampleA.r + sampleA.g + sampleA.b) * wA, (sampleB.r + sampleB.g + sampleB.b) * wA, 1.0);

                        }
                        color += subSamp * offset.z;
                        weight += offset.z;
                    }
                    color /= weight;
                    ##standardMixResult##
                }
            `);
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
            filt.shaderSub.setFragmentSource( `
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
            filt.shaderPhoton.setFragmentSource( `
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
            filt.shaderPhotonSub.setFragmentSource( `
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
        filt.matrixSize = len;
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
        if(tripple) {
            shaderToUse = noiseReduce ? filt.shaderTrippleSub : filt.shaderTripple;
            uniformObj = Object.assign(uniformObj, {
                filterA : {type : "uniform2fv", value : filtA},
                filterB : {type : "uniform2fv", value : filtB},
            });

        }else if(custom){
            shaderToUse = filt.shaderCustom;
            uniformObj = Object.assign(uniformObj,custom.uniforms);
        }else{
            shaderToUse = usePhotonCount ? ( noiseReduce ? filt.shaderPhotonSub : filt.shaderPhoton) : (noiseReduce ? filt.shaderSub : this.shader);
        }

        glF.filter(shaderToUse,uniformObj);
        for(var i = 1; i < iterations; i ++){
            glF.filter(shaderToUse,null); // no need to set uniforms again.
        }
        return glF;  // Not a must but allows users to chain filters
    },
    arguments : [{
            name : "convolutionMatrix",
            description : "Array containing the convolution matrix. Can also be a object with a property isTripple = true and has 1 spacial convolution matrix main, and two spacial matrix (x,y) named channelA, channelB. This applys the convolution using 3 spacial matrix for G, R, and B ",
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
            description : "R,G,B,A channels, BW mean RGB as black and white. Apply to all pixels or L lighter, D darker",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,AL,BWL,RGBD,RGBAD,AD,BWD".split(","),
            itemHelp : [
                "Apply to red, green, and blue, channels",
                "Apply to red, green, blue, and alpha channels",
                "Treat pixels as if gray scale",
                "Apply to alpha channel only",
                "Apply to red channel only",
                "Apply to green channel only",
                "Apply to blue channel only",
                "Apply to red and green channels only",
                "Apply to red and blue channels only",
                "Apply to blue and green channels only",
                "Apply to red, green, and blue, channels\nResult only if value is lighter",
                "Apply to red, green, blue, and alpha channels\nResult only if value is lighter",
                "Alpha and only if result is lighter (higher)",
                "Treat pixels as if gray scale\nResult only if value is lighter",
                "Apply to red, green, and blue, channels\nResult only if value is darkerer",
                "Apply to red, green, blue, and alpha channels\nResult only if value is darkerer",
                "Alpha and only if result is darker (lower)",
                "Treat pixels as if gray scale\nResult only if value is darkerer",
            ]

        },{
            name : "usePhotonCount",
            description : "Some filters such as blur will produce dark color where hue contrast is high resulting in an artificial looking blur. If this is true the filter applies the photon count of each channel rather than the intensity. ",
            type : "Boolean",
            range : {def : false},
        },{
            name : "matrixHasOffsets",
            description : "If true then the matrix passed as the first argument should include the x,y position of each weight. Should be in the order x,y,weight, ..., x,y,weight. When in this form the matrix is not bound to any defined size ",
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
            size = (size -(size % 2)) + 1;
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
        createGBlurMatrix(size, weightCof){ // create a sort of Gaussian blur
            size = this.valideBoxSize(size);

            const radius = size / 2;
            const array = [];
            var total = 0, x, y;
            for(y = 0; y < size; y ++){
                for(x = 0; x < size; x ++){
                    const dx = (radius - (x + 0.5));
                    const dy = (radius - (y + 0.5));
                    const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                    if(dist > 1){
                        array.push(0);
                    } else {
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
        createMatrixFromRGBPixels(b8, size, pixelSize, min, max){ // creates a matrix from pixel data in format RGBA 8bits, stride = size * pixelSize * 4
            if (size % 2 !== 1) { log.warn("Matrix image size must be ODD"); return [0,0,0,0,1,0,0,0,0]; }
            const stride = size * pixelSize * 4;
            const subPx = 1 / (pixelSize * pixelSize);
            const len = size * size;
            const radius = size / 2;
            const array = [];      
            var total = 0, x, y, xx, yy;
            for (y = 0; y < size; y ++) {
                const py = y * pixelSize;
                for (x = 0; x < size; x ++) {
                    const px = x * pixelSize;
                    let sum = 0;
                    for (yy = 0; yy < pixelSize; yy ++) {
                        for (xx = 0; xx < pixelSize; xx ++) {
                            const idx = px + xx + (py + yy) * stride;
                            sum = (b8[idx + 0] + b8[idx + 1] + b8[idx + 2]) /  765;
                        }
                    }
                    array.push(sum * subPx);
                }
            }
            var i = array.length;
            const range = max - min;
            while(i-- > 0){
                array[i] = array[i] * range + i;
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
        embossMatrixExpand(matrix, curve, amount){
            var ydis  = Math.abs(matrix[1]);
            for(var i = 0; i < matrix.length; i += 3){
                var y = (Math.abs(matrix[i + 1]) / ydis) / 2;
                var w = y ** curve;
                matrix[i + 1] = (w / (w + (1 - y) ** curve)) * 2 * amount * Math.sign(matrix[i + 1] ) ;
            }
            return matrix;
        },
        createEdgeMatrix(size, width, curve, strength, wCurve, type){
            size = this.valideBoxSize(size);
            var mid = (size - 1) / 2;
            var midW = (width - 1) / 2;
            var array = [];
            var x,y,d,wW,w,dist,distW;
            var total = 0;
            const types = {
                Sobel() {return y === mid ? 0 : (y < mid ? d : -d) },
                Edge() {return y === mid ? d : -d },
                EdgeInv() {return y === mid ? -d : d },
            }
            const tFunc = types[type];
            for(y = 0; y < size; y++){
                for(x = 0; x < width; x++){
                    dist = Math.abs((mid-y)/mid);
                    distW = Math.abs((midW-x)/midW)/2;
                    w = dist ** curve;
                    wW =dist ** wCurve;
                    d = (w / (w + (1 - dist) ** curve)) * strength;
                    d *= (wW / (wW + (1 - distW) ** wCurve)) * 2;
                    array.push(tFunc());
                }
            }
            //array[mid + mid * width] = 1;
            return array;


        },
        createSobelMatrix(size, width, curve, strength, wCurve){
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
                    var w = dist ** curve;
                    var wW =dist ** wCurve;
                    var d = (w / (w + Math.pow(1 - dist, curve))) * strength;
                    d *= (wW / (wW + Math.pow(1 - distW, wCurve))) * 2;
                    d = y === mid ? 0 : (y < mid ? d : -d);
                    array.push(d);
                }
            }
            //array[mid + mid * width] = 1;
            return array;


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
            if(matrix.length === 0) { matrix.push(0,0,0) }
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
        spacialMatricesToTripple(matrix, rotateA, rotateB, tripple) {
            if(tripple === undefined){
                tripple = {
                    isTripple : true,
                    main: matrix,
                    channelA: [],
                    channelB: [],
                };
            }else{
                tripple.main = matrix;
            }
            const dAx = Math.cos(rotateA);
            const dAy = Math.sin(rotateA);
            const dBx = Math.cos(rotateB);
            const dBy = Math.sin(rotateB);
            var ii = 0;
            for(var i = 0; i < matrix.length; i += 3){
                const x = matrix[i];
                const y = matrix[i + 1];
                tripple.channelA[ii    ] = x * dAx - y * dAy;
                tripple.channelA[ii + 1] = x * dAy + y * dAx;
                tripple.channelB[ii    ] = x * dBx - y * dBy;
                tripple.channelB[ii + 1] = x * dBy + y * dBx;
                ii += 2;
            }
            tripple.channelA.length = ii;
            tripple.channelB.length = ii;
            return tripple
        },
        normalizeMatrix(matrix, isSpacial, amount){
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
};

(()=>{
    filterGL.filters.register(convolutionFilter.name, convolutionFilter);
    const registeredFilter = filterGL.filters.getFilter(convolutionFilter.name);
    registeredFilter.webGLFilters[convolutionFilter.name] = registeredFilter.callback;

})();

//        var sArgs = {};
//        filterCommon.arguments.forEach(arg => sArgs[arg.name] = arg);