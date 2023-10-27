/*
When writing this library I found my self writing the same shader source over and over so I came up with this filter.
The filter takes up to 3 input textures and a short hand fragment shader source string that is linked and compiled into
a fragment shader

The linker will only link in what is needed and also provides a short hand notation for many standard sharder functions

The basics.

Input textures `A`, `B`, `C`

The 3 input textures are referred to as A,B,C that represent the vec4 sampled pixel from texture sources 0,1,2

Their sub values can be accessed via posfix notation (I dropped using dot notation as it seemed pointless)
A = vec4 src2Color = texture2D(texture, texCoord)
Each channels is Ar, Ag, Ab, and Aa. You can access the vec3 Argb (and I am sure when time permits I will add the Arg, Agb, ... and othe combos
B is pixel from texture1
C is pixel from texture2
If there is no texture1 texture then B will refer to A, For C it will refer to B and if no B then A


Result `R`
The final output is R = gl_FragColor

For a simple example, mix texture with texture1 will have the shorthand shader notation offscreenBuffering
R = (A + B) / 2;

To move alpha from texture1 to texture keeping texture's rgb

R = A; 
Ra = Ba;
or
Rrgb = Argb;
Ra = Ba;

HSL colour model

pixel values A,B,C can also be referenced via the HSL colour model. The conversion is done automatic. 

Ahsl, Bhsl, Chsl hold the hsl pixel channels. Also valid as the postfix h,s,l such as Ah, As, Al
The values for h,s,l as from 0 to one as with the rgba channels.
To set the return value you need to explicitly set call the conversion.

Example removing saturation from all pixels.
As=0;  // Texture A saturation to zero
Rrgb=hsl2RGB(Ahsl);  // Convert A as HSL to RGB and asign to result
Ra=1;

Note that the HSL colour variables do not hold alpha.

Example of shifting the hue of all pixels up by 

Registers

General Floats

There are 4 float variables Fa,Fb,Fc,Fd If you use them they will be automatic declared and initialised to 0

Note numbers are all floats. You no not need to add the decimal point it is done for you.

Uniforms 

Uniform inputs. There are 4 uniform values set when the procedure filter is called. these are floats and named

Va,Vb,Vc,Vd and will automatic be defined as uniforms if you use them. Because the range of the uniforms is important you will need to define the range in the shader shorthand. If you do not then the value of Va,vb,Vc,Vd can be -256 <= V <= 256

To set the range you must add at the end of the shorthand shader # then the variable identifier, then the min value then the max separated by commas.

For example to hue shift the pixels in texture by a filter input a

Ah += Va;
Rrgb = hsl2RGB(Ahsl);
Ra = 1;
#Va,0,1       // Defines the uniform variable Va to have a range of 0 to 1

Sets the range of Va from 0 to 1 inclusive. To set the range for all

#Va,0,1
#Vb,-10,10
#Va,6,8
#Va,-100,20

# is a generic linker directive and are always at the end of the shorthand shader.

Another example of a linker directive is

#HueClamp,Off

Turns hue clamping off allowing to rotate the hue. Note that linker directive are set at linking time and cannot be changed in the shader.

Other inputs available are

Coordinate `XY`, `XY1`, `XY2`, `XY3`

XY as vec2 holding the unit coordinate of the current pixel. X and Y hold the separate x and y values.

example to create a HSL colour swatch with the input Va representing the HUE

Rrgb = hsl2RGB(v3(Va,X,Y));  // set sat and lum to X and Y
Ra=1; // Set alpha to 1
#Va,0,1  // Define Variable Va range 

There is alse XY1,XY2,XY3 for the pixel coordinates which start at 0,0 and end at the texture pixel size -1 also avalible seperately as X1,Y1,X2,Y2,X3,Y3

Vector types 

v2,v3,v4 for vec2, vec3, vec4,

use as 
Rrgb = v3(1,0,0);
R = v4(v3(A.r,B.g,C.b)*Va,1);

You have access to a random float and a random vec3 rF,rV3

example to set the output to a random colour

R = v4(rV3,1)

Note that a new seed is automatic generated each time the shader is called.

I have most of the functions done
clamp,step,max,min,smoothstep,mix,sin,cos,pow and so on.

I have abbreviated distance to dist, normalise to norm, and smoothStep to sStep

You can access the samplers with SA,SB,SC for textures 0,1,2. Unlike normal samplers these reference the pixels relative to the current pixel and the value that the take are in pixels not normalise texture cordinates.

D = SA(v2(-1,-1)); // gets the one pixel up and one pixel left of the current pixel.

I have also extended max min with maxv3,maxv4 and minv3,minv4 and minf4, minf3 same for max
Added meanv2,meanv3,meanv4 find the mean of the vector
Added sumv2,sumv3,sumv4 find the sum of a vector

The filter also has a point argument that can be accessed as a vec2 PXY and separately as PX, PY and are normalised to texture one but not clamped to 0,1










*/
if(typeof filterGL !== "undefined"){ 
    (function(){
        var filterCommon; // to access common properties for associated filters
        filterGL.filters.register( "procedural", filterCommon = { 
            name :"procedural",
            description : "This filter uses procedural strings to apply filters",
            webGLFilters : null,  
            shader : null,  
            shaderPhoton : null,
            functions : [],
            lastFunction : { val : null, shader : null },
            callback(source2, source3, filterFunction, valueA, valueB, valueC, valueD, point, mix, channels,data = {}) {
                var glF = this.webGLFilters;
                var mods;
                var usingTextures = { t : true, t1 : false, t2 : false, };
                var filterHash = this.utilities.hashString(filterFunction);
                if (filterHash === this.lastFunction.filterHash) {
                    this.shader = this.lastFunction.shader;
                    usingTextures.t1 = this.lastFunction.textures1;
                    usingTextures.t1 = this.lastFunction.textures1;
                    mods = this.lastFunction.mods;
                } else {
                    var func = this.functions.find(f => f.filterHash === filterHash);
                    if (func !== undefined) {
                        this.shader = func.shader;
                        usingTextures.t1 = func.textures1;
                        usingTextures.t2 = func.textures2;
                        mods = func.mods;
                    } else {
                        this.lastFunction.filterHash = filterHash;
                        this.lastFunction.val = filterFunction;
                        var source = this.utilities.evaluateFilterFunction(filterFunction);
                        this.shader = this.lastFunction.shader = glF.Shader(null, null).useLinker();
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
                        this.functions.push({
                            val : filterFunction,
                            filterHash : filterHash,
                            shader : this.lastFunction.shader,
                            textures1 : usingTextures.t1,
                            textures2 : usingTextures.t2,
                            mods
                        });
                    }
                }
                this.lastFunction.filterHash = filterHash;
                this.lastFunction.val = filterFunction;
                this.lastFunction.shader = this.shader;
                this.lastFunction.textures1 = usingTextures.t1;
                this.lastFunction.textures2 = usingTextures.t2;
                this.lastFunction.mods = mods;
                const colorData = {};
                if(data.hue !== undefined){
                    Object.assign(colorData, this.shader.getLinkedInUniforms("colorsHSL",[data]));
                }else{
                    Object.assign(colorData, this.shader.getLinkedInUniforms("colors",[data]));
                }
                var uniformObj = Object.assign({
                        valueA, valueB, valueC, valueD,point,
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
                            uniformObj.clampResult = mods[name];
                        }else if(name !== undefined && uniformObj[name] !== undefined){
                            var arg = this.arguments.find(arg=> arg.name === name);
                            if(arg && arg.type === "Number" && arg.range){
                                var range = arg.range;
                                var v = uniformObj[name];
                                var tr = (range.max-range.min);
                                v -= range.min;
                                v /= tr;                                    
                                if(mods[name].min==="pNorm"){      
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
                    description : "What the filter will do with the difference.R is the result. A is the source image. B is source 2",
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
                    description : "A 2D point coordinate",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },{
                    name : "mix",
                    description : "The amount to mix the convolution array result with the original image, 1 is full result, 0 is original image.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "channels",
                    description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                }/*,{
                    name : "usePhotonCount",
                    description : "Some filters such as blur will produce dark color where hue contrast is high resulting in an artificial looking blur. If this is true the filter applies the photon count of each channel rather than the intensity. ",
                    type : "Boolean",
                    range : {def : false},
                }*/,{
                    name : "data",
                    description : "Object contain procedure specific uniforms",
                    type : "Object",
                    range : {def : {}},
                }
            ],
            utilities : { // functions associated with this filter
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
                    const fields = {
                        c1rgb : "color1.rgb",
                        c2rgb : "color2.rgb",
                        c3rgb : "color3.rgb",
                        c4rgb : "color4.rgb",
                        c5rgb : "color5.rgb", 
                        c1hsl : "color1.rgb",
                        c2hsl : "color2.rgb",
                        c3hsl : "color3.rgb",
                        c4hsl : "color4.rgb",
                        c5hsl : "color5.rgb",
                        Ahsl : "src1ColorHSL",
                        Bhsl : "src2ColorHSL",
                        Argb : "src1Color.rgb",
                        Brgb : "src2Color.rgb",
                        Crgb : "src3Color.rgb",
                        Drgb : "colorTemp2.rgb",
                        Ergb : "colorTemp3.rgb",
                        Rrgb : "color.rgb",
                        rV3 : "randomV3()",  
                        Pxy : "point",
                        XY1 : "coord1",
                        XY2 : "coord2",
                        XY3 : "coord3",
                        WH1 : "texSize",
                        WH2 : "texSize2",
                        WH3 : "texSize3",
                        c1r : "color1.r",
                        c2r : "color2.r",
                        c3r : "color3.r",
                        c4r : "color4.r",
                        c5r : "color5.r",
                        c1g : "color1.g",
                        c2g : "color2.g",
                        c3g : "color3.g",
                        c4g : "color4.g",
                        c5g : "color5.g",
                        c1b : "color1.b",
                        c2b : "color2.b",
                        c3b : "color3.b",
                        c4b : "color4.b",
                        c5b : "color5.b",
                        c1a : "color1.a",
                        c2a : "color2.a",
                        c3a : "color3.a",
                        c4a : "color4.a",
                        c5a : "color5.a",                        
                        c1h : "color1.r",
                        c2h : "color2.r",
                        c3h : "color3.r",
                        c4h : "color4.r",
                        c5h : "color5.r",
                        c1s : "color1.g",
                        c2s : "color2.g",
                        c3s : "color3.g",
                        c4s : "color4.g",
                        c5s : "color5.g",
                        c1l : "color1.b",
                        c2l : "color2.b",
                        c3l : "color3.b",
                        c4l : "color4.b",
                        c5l : "color5.b",
                        c1  : "color1",
                        c2  : "color2",
                        c3  : "color3",
                        c4  : "color4",
                        c5  : "color5",
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
                        X : "texCoord.x",
                        Y : "texCoord.y",
                        A : "src1Color",
                        B : "src2Color",
                        R : "color",
                        C : "src3Color",
                        D : "colorTemp2",
                        E : "colorTemp3",
                    }
                    var funcs = {
                        length : "length",
                        hsl2RGB : "hsl2RGB",
                        rgb2H  : "rgb2H",
                        rgb2S  : "rgb2S",
                        rgb2L  : "rgb2L",
                        clamp  : "clamp",
                        sStep  : "smoothstep",
                        meanv4 : "meanv4",
                        meanv3 : "meanv3",
                        meanv2 : "meanv2",
                        cross  : "cross",
                        maxv4  : "maxv4",
                        maxv3  : "maxv3",
                        maxf4  : "maxf4",
                        maxf3  : "maxf3",
                        minv4  : "minv4",
                        minv3  : "minv3",
                        minf4  : "minf4",
                        minf3  : "minf3",
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
                        coord1 : "vec2 coord1 = textCoord * texSize;",
                        coord2 : "vec2 coord2 = textCoord * texSize2;",
                        coord3 : "vec2 coord3 = textCoord * texSize3;",
                        src1ColorHSL : "vec3 src1ColorHSL = rgb2HSL(src1Color.rgb);",
                        src2ColorHSL : "vec3 src2ColorHSL = rgb2HSL(src2Color.rgb);",
                        src3ColorHSL : "vec3 src3ColorHSL = rgb2HSL(src3Color.rgb);",
                        randomV3 : "seedV3 = randomizerV3;",
                        randomF : "seedF = randomizerF;",
                    }
                    const includes = {
                        ColorHSL  : "##rgb2HSL##",
                        hsl2RGB   : "##hsl2RGB##",
                        rgb2H     : "##rgb2H##",
                        rgb2S     : "##rgb2S##",
                        rgb2L     : "##rgb2L##",
                        easeInOut : "##easeInOut##",
                        randomV3  : "uniform float randomizerV3;\n##randomV3##",
                        randomF  : "uniform float randomizerF;\n##randomF##",
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
                    }
                    function Token(str){
                        this.is = (val)=>{return val===str;}
                        this.isFunction = ()=>{ return funcs[str] !== undefined}
                        this.isNumber =   ()=>{ return !isNaN(str)}
                        this.isVar =      ()=>{ return fields[str] !== undefined}
                        this.isOperator = ()=>{ return "+-/*=>=<=(),".indexOf(str) > -1}
                        this.isNewLine =  ()=>{ return str === ";"}
                        this.asFunction = ()=>{ return funcs[str]}                            
                        this.asVar =      ()=>{ return fields[str]}                            
                        this.asFloat =    ()=>{
                            if(str.indexOf(".") === -1){
                                return str + ".0";
                            }
                            return str;
                        }
                    }
                    var newLine = ";\n"; 
                    // Create source code via simple find and replace method. This means the order of 
                    // the above info is important, longer strings first
                    var shaderSource = "";
                    var regString = Object.keys(funcs).join("|");
                    regString += "|" + Object.keys(fields).join("|");
                    regString += "|==|<=|>=\\=|\\+|\\-|\\*|\\/|\/|<|>|;|\\(|\\)"
                    regString += "|[0-9]*\\.*[0-9]*|\\.";
                    
                    var reg = new RegExp(regString,"g");
                    shaderSource = func.replace(reg,(str) => {
                        var t = new Token(str);
                        if (t.isFunction()) {return t.asFunction()}
                        if (t.isVar())      {return t.asVar()}
                        if (t.isOperator()) {return str}
                        if (t.isNumber())   {return t.asFloat()}
                        if (t.isNewLine())  {return newLine}
                        return "";
                    });
                    var defined = "";
                    Object.keys(defines).forEach(name=>{
                        if(shaderSource.indexOf(name) > -1){
                            defined += defines[name] + "\n";
                        }                            
                    });
                    var included = "";
                    Object.keys(includes).forEach(name=>{
                        if(shaderSource.indexOf(name) > -1){
                            included += includes[name] + "\n";
                        }                            
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
                    console.log("Compiled difference filter source.");
                    console.log(shaderSource);
                    shaderSource.split("\n").forEach(line => {
                        //groover.tester.cSprites[0].systemReporter.warn(line);
                    });
                    return {
                        shaderSource,
                        defined,
                        included,
                        mods,
                    };
                        
                }
            }
        });
        var sArgs = {};
        filterCommon.arguments.forEach(arg => sArgs[arg.name] = arg); 
        //==============================================================================================================
        const vals = "#Va,pNorm,4#Vb,0,2#Vc,-1,1";
        filterGL.filters.register("curves",filter =  { 
            name : "curves",
            description : "brightness contrast adjustments using powers ",
            webGLFilters : null, 
            curves : {
                contrast : "D=pow(clamp(A*Vb+Vc,0,1),v4(Va));R=D/(D+pow(1-clamp(A*Vb+Vc,0,1),v4(Va)))" + vals,
                darken : "R=pow(clamp(A*Vb+Vc,0,1),v4(Va))" + vals,
                lighten : "R=1-pow(1-clamp(A*Vb+Vc,0,1),v4(Va))" + vals,
                
                contrastLum : "Al=clamp(Al*Vb+Vc,0,1);Fa=pow(Al,Va);Al=Fa/(Fa+pow(1-Al,Va));Rrgb=hsl2RGB(Ahsl)" + vals,
                darkenLum : "Al=clamp(Al*Vb+Vc,0,1);Al=pow(Al,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
                lightenLum : "Al=clamp(Al*Vb+Vc,0,1);Al=1-pow(1-Al,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
                
                contrastSat : "As=clamp(As*Vb+Vc,0,1);Fa=pow(As,Va);As=Fa/(Fa+pow(1-As,Va));Rrgb=hsl2RGB(Ahsl)" + vals,
                darkenSat : "As=clamp(As*Vb+Vc,0,1);As=pow(As,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
                lightenSat : "As=clamp(As*Vb+Vc,0,1);As=1-pow(1-As,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
                
                darkenSatLum : "Fa=Ah;Ahsl=clamp(Ahsl*Vb+Vc,0,1);Drgb=pow(Ahsl,v3(Va));Rrgb=hsl2RGB(v3(Fa,Dg,Db))" + vals,
                lightenSatLum : "Fa=Ah;Ahsl=clamp(Ahsl*Vb+Vc,0,1);Drgb=1-pow(1-Ahsl,v3(Va));Rrgb=hsl2RGB(v3(Fa,Dg,Db))" + vals,
                contrastSatLum : "Fa=Ah;Ahsl=clamp(Ahsl*Vb+Vc,0,1);Drgb=pow(Ahsl,v3(Va));Drgb=Drgb/(Drgb+pow(1-Ahsl,v3(Va)));Rrgb=hsl2RGB(v3(Fa,Dg,Db))" + vals,

                darkenISatLum : "As=clamp(As*Vb+Vc,0,1);Al=clamp(Al*Vb+Vc,0,1);Dg=pow(As,Va);Db=1-pow(1-Al,Va);Rrgb=hsl2RGB(v3(Ah,Dg,Db))" + vals,
                lightenISatLum : "As=clamp(As*Vb+Vc,0,1);Al=clamp(Al*Vb+Vc,0,1);Dg=1-pow(1-As,Va);Db=pow(Al,Va);Rrgb=hsl2RGB(v3(Ah,Dg,Db))" + vals,
            },
            callback(power,scaling,level,type,channels) {  
                var glF = this.webGLFilters; 
                var pUtil = glF.filters.getFilter("procedural").utilities;
                var pString = this.curves[type];
                glF.procedural(undefined, undefined, pString, power-256,scaling,level,0, [0.5,0.5], 1, channels);
                return glF;  
            },
            arguments : [{
                    name : "power",
                    description : "Amount of curve to apply. This is the exponential ",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },{
                    name : "scaling",
                    description : "Amount of scaling to apply to input. eg  (in * scaling) ^ power",
                    type : "Number",
                    range : {min : -256, max : 256, step : 8, def : 0},
                },{
                    name : "level",
                    description : "Amount of scaling to apply to input. eg  (in * scaling + level) ^ power",
                    type : "Number",
                    range : {min : -256, max : 256, step : 8, def : 0},
                },{
                    name : "type",
                    description : "Types of adjustments",
                    type : "String",
                    range : ["contrast","lighten","darken","contrastLum","lightenLum","darkenLum","contrastSat","lightenSat","darkenSat","contrastSatLum","lightenSatLum","darkenSatLum","lightenISatLum","darkenISatLum"],
                },sArgs.channels
            ],
        }); 
        //==============================================================================================================
        filterGL.filters.register(  "contrast",filter =  { 
            name : "contrast",
            description : "brightness contrast adjustments using powers ",
            webGLFilters : null, 
            curves : {
                contrast : "D=pow(A,v4(Va));R=D/(D+pow(1-A,v4(Va)))#Va,pNorm,4",
                darken : "R=pow(A,v4(Va))#Va,pNorm,4",
                lighten : "R=1-pow(1-A,v4(Va))#Va,pNorm,4",
            },
            callback(power,type,channels) {  
                this.webGLFilters.procedural(undefined, undefined,this.curves[type], power-256,0,0,0, [0.5,0.5], 1, channels);
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "power",
                    description : "Low reduces contrast and high more contrast",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },{
                    name : "type",
                    description : "Types of adjustments",
                    type : "String",
                    range : ["contrast","lighten","darken"],
                },sArgs.channels
            ],
        }); 
        //==============================================================================================================
        filterGL.filters.register( "clamp",filter =  { 
            name : "clamp",
            description : "clamp channels",
            webGLFilters : null, 
            callback(level,channels) {  
                this.webGLFilters.procedural(undefined, undefined,"R=v4(Va)#Va,0,1", level,0,0,0, [0.5,0.5], 1, channels);
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "level",
                    description : "What to put in the channel",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },sArgs.channels
            ],
        }); 
        //==============================================================================================================
        filterGL.filters.register( "Invert",filter =  { 
            name : "Invert",
            description : "Invert one or more channels",
            webGLFilters : null, 
            callback(mix,channels) {  
                this.webGLFilters.procedural(undefined, undefined,"R=1-v4(A)", 0,0,0,0, [0.5,0.5], mix, channels);
                return this.webGLFilters;  
            },
            arguments : [sArgs.mix,sArgs.channels],
        }); 
        //==============================================================================================================
        filterGL.filters.register( "WhiteBalance",filter =  { 
            name : "WhiteBalance",
            description : "White balance the image depending on the distance the colour under the selection point is from white",
            webGLFilters : null, 
            callback(point,mix,channels) {  
                var points = [
                    -1,-1, 0,-1, 1,-1,
                    -1, 0,       1, 0,
                    -1, 1, 0, 1, 1, 1,
                ];
                var i;
                var str = "";
                var count = points.length /2;
                for(i = 0; i < points.length; i+= 2){
                    str += "+Sa(Pxy+v2("+points[i]+","+points[i+1]+")/WH1)";
                }
                var pString = `
                    D = (Sa(Pxy)${str})/${count+1};
                    Fa = meanv3(Drgb);
                    Ergb = Fa/v3(Dr,Dg,Db);
                    R = v4(v3(Ergb*Argb),Aa);                
                `
                this.webGLFilters.procedural(undefined, undefined,pString, 0,0,0,0, point, mix, channels);
                return this.webGLFilters;  
            },
            arguments : [sArgs.point,sArgs.mix,sArgs.channels],
        }); 
        //==============================================================================================================
        filterGL.filters.register( "Temperature",filter =  { 
            name : "Temperature",
            description : "Change the image temperature from warm to cool.",
            webGLFilters : null, 
            callback(temperature) {  
                var pString = "R=v4(v3(1-Va,1,1+Va)*Argb,Aa)#Va,-0.2,0.2";
                this.webGLFilters.procedural(undefined, undefined,pString, temperature,0,0,0, [0.5,0.5], 1,"RGB");
                return this.webGLFilters;  
            },
            arguments : [{
                name : "Temperature",
                description : "Temperature adjust from warm to cool",
                type : "Number",
                range : {min : -256, max : 256, step : 1, def :0},
            }]
        }); 
        //==============================================================================================================
        filterGL.filters.register( "BlackAndWhite",filter =  { 
            name : "BlackAndWhite",
            description : "Convert images to black and white",
            webGLFilters : null, 
            namedFilters : {
                BWStepMean :"R=v4(step(Va,v3(meanv3(Brgb))),Ba)#Va,0,1",
                BWStepMax : "R=v4(step(Va,v3(maxv3(Brgb))),Ba)#Va,0,1",
                BWStepMin : "R=v4(step(Va,v3(minv3(Brgb))),Ba)#Va,0,1",
                BWStepPerceptual : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4(Fa,Fa,Fa,Ba)#Va,0,1",
                BWStepPhoton : "D=B*256;D*=D;Drgb=step(Va,v3(pow((Dr+Dg+Db)/3,0.5)/256));R=v4(Drgb,Ba)#Va,0,1",
                BW3StepMean :"Drgb = v3(meanv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
                BW3StepMax : "Drgb = v3(maxv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
                BW3StepMin : "Drgb = v3(minv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",                    
                BW3StepMean :"Drgb = v3(meanv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
                BW3StepRed : "Drgb = v3(Br);R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
                BW3StepGreen : "Drgb = v3(Bg);R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
                BW3StepBlue : "Drgb = v3(Bb);R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
                BW3StepPerceptual : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4((step(Vb,v3(Fa))+step(Va,v3(Fa)))/2,Ba)#Va,0,1#Vb,0,1",
                BWMean : "R=v4(v3(meanv3(Brgb)),Ba)",
                BWMax : "R=v4(v3(maxv3(Brgb)),Ba)",
                BWMin : "R=v4(v3(minv3(Brgb)),Ba)",
                BWPerceptual : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(Fa,Fa,Fa,Ba)",
                BWPhoton : "D=B*256;D*=D;Drgb=v3(pow((Dr+Dg+Db)/3,0.5)/256);R=v4(Drgb,Ba)",
                BWFromRed : "R=v4(v3(Br),Ba)",
                BWFromGreen : "R=v4(v3(Bg),Ba)",
                BWFromBlue : "R=v4(v3(Bb),Ba)",
                BWFromAlpha : "R=v4(v3(Ba),Ba)",
            },
            callback(filterType,threshold,threshold2,mix,channels) {  
                var pString = this.namedFilters[filterType];
                this.webGLFilters.procedural(undefined, undefined,pString, threshold,threshold2,0,0, [0.5,0.5], mix, channels);
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "filterType",                        
                    description : "Select which black and white filter to use.",
                    type : "String",
                    range : null,
                },{
                    name : "threshold",
                    description : "Sets the threshold.",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },{
                    name : "threshold2",
                    description : "Sets the low threshold for 3 step filters threshold.",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },sArgs.mix,sArgs.channels
            ],
        }); 
        filter.arguments[0].range = Object.keys(filter.namedFilters); 
        //==============================================================================================================        
        filterGL.filters.register( "twoTone",filter =  { 
            name : "twoTone",
            description : "Two colour images, like Black and white but the colours are selecteable",
            webGLFilters : null, 
            namedFilters : {
                Mean            : "R=v4(mix(c3rgb,c1rgb,meanv3(Brgb)),Ba)",
                Max             : "R=v4(mix(c3rgb,c1rgb,maxv3(Brgb)),Ba)",
                Min             : "R=v4(mix(c3rgb,c1rgb,minv3(Brgb)),Ba)",
                Perceptual      : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(mix(c3rgb,c1rgb,Fa),Ba)",
                Photon          : "D=B*256;D*=D;Fa=pow((Dr+Dg+Db)/3,0.5)/256;R=v4(mix(c3rgb,c1rgb,Fa),Ba)",
                FromRed         : "R=v4(mix(c3rgb,c1rgb,Br),Ba)",
                FromGreen       : "R=v4(mix(c3rgb,c1rgb,Bg),Ba)",
                FromBlue        : "R=v4(mix(c3rgb,c1rgb,Bb),Ba)",
                FromAlpha       : "R=v4(mix(c3rgb,c1rgb,Ba),Ba)",
                StepMean        : "R=v4(mix(c3rgb,c1rgb,step(Va,meanv3(Brgb))),Ba)#Va,0,1",
                StepMax         : "R=v4(mix(c3rgb,c1rgb,step(Va,maxv3(Brgb))),Ba)#Va,0,1",
                StepMin         : "R=v4(mix(c3rgb,c1rgb,step(Va,minv3(Brgb))),Ba)#Va,0,1",
                StepPerceptual  : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4(mix(c3rgb,c1rgb,Fa),Ba)#Va,0,1",
                StepPhoton      : "D=B*256;D*=D;Fa=step(Va,pow((Dr+Dg+Db)/3,0.5)/256);R=v4(mix(c3rgb,c1rgb,Fa),Ba)#Va,0,1",
                Step3Mean       : "Fa=meanv3(Brgb);R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                Step3Max        : "Fa=meanv3(Brgb);R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                Step3Min        : "Fa=meanv3(Brgb);R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",                   
                Step3Red        : "Fa=Br;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                Step3Green      : "Fa=Bg;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                Step3Blue       : "Fa=Bb;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                Step3Alpha      : "Fa=Ba;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                Step3Perceptual : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
                
            },
            callback(filterType,topColor, threshold,midColor, threshold2,bottomColor, mix, channels){
                var colours = {color1 : topColor, color2 : midColor,color3 : bottomColor};
                var pString = this.namedFilters[filterType];
                this.webGLFilters.procedural(undefined, undefined,pString, threshold,threshold2,0,0, [0.5,0.5], mix, channels,colours);
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "filterType",                        
                    description : "Select which 2 tone filter to use.",
                    type : "String",
                    range :null,
                },{
                    name : "topColor",
                    description : "Set the colour for brightest pixel.",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },{
                    name : "threshold",
                    description : "Sets the threshold.",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },{
                    name : "midColor",
                    description : "Set the colour for midRange pixels.",
                    type : "HexColor",
                    range : {def : "#888888"},
                },{
                    name : "threshold2",
                    description : "Sets the low threshold for 3 step filters threshold.",
                    type : "Number",
                    range : {min : -256, max : 256, step : 4, def : 0},
                },{
                    name : "bottomColor",
                    description : "Set the colour for darkest pixel.",
                    type : "HexColor",
                    range : {def : "#000000"},
                },sArgs.mix,sArgs.channels
            ],
        }); 
        filter.arguments[0].range = Object.keys(filter.namedFilters);         
        //==============================================================================================================
        filterGL.filters.register( "channelCopy",filter =  { 
            name : "channelCopy",
            description : "Copies channels between images",
            webGLFilters : null, 
            fromCode :{
                RGB : "D=B;E=v4(meanv3(Brgb));",
                RGBA : "D=B;E=v4(meanv4(B));",
                Red : "D=v4(Br);E=D;",
                Green : "D=v4(Bg);E=D;",
                Blue : "D=v4(Bb);E=D;",
                Alpha : "D=v4(Ba);E=D;",
                RG : "Fa=(Br+Bg)/2;D=v4(Fa);E=D;",
                GB : "Fa=(Bb+Bg)/2;D=v4(Fa);E=D;",
                RB : "Fa=(Br+Bb)/2;D=v4(Fa);E=D;",
                RGA : "Fa=(Br+Bg+Ba)/3;D=v4(Fa);E=D;",
                GBA : "Fa=(Bg+Bb+Ba)/3;D=v4(Fa);E=D;",
                RBA : "Fa=(Br+Bb+Ba)/3;D=v4(Fa);E=D;",
            },
            actions : {
                replace  : "",
                add      : "D=D+A;E=E+A;",
                subtract : "D=A-D;E=A-E;",
                lighter  : "D=v4(max(Ar,Dr),max(Ag,Dg),max(Ab,Db),max(Aa,Da));D=v4(max(Ar,Er),max(Ag,Eg),max(Ab,Eb),max(Aa,Ea));",                    
                darker   : "D=v4(min(Ar,Dr),min(Ag,Dg),min(Ab,Db),min(Aa,Da));D=v4(min(Ar,Er),min(Ag,Eg),min(Ab,Eb),min(Aa,Ea));",
                multiply : "D=A*D;E=A*E;",
                inverseMultiply :"D=A*(1-D);E=A*(1-E);" ,                   
                mix      : "D=(A+D)/2;E=(A+E)/2;",
            },
            toCode :{
                RGB   : "R=mix(A,D,v4(Va,Va,Va,0));",
                RGBA  : "R=D*Va;",               
                Red   : "R=mix(A,E,v4(Va,0,0,0));",
                Green : "R=mix(A,E,v4(0,Va,0,0));",
                Blue  : "R=mix(A,E,v4(0,0,Va,0));",
                Alpha : "R=mix(A,E,v4(0,0,0,Va));",
                RG    : "R=mix(A,D,v4(Va,Va,0,0));",
                GB    : "R=mix(A,D,v4(0,Va,Va,0));",
                RB    : "R=mix(A,D,v4(Va,0,Va,0));",
                RGA   : "R=mix(A,D,v4(Va,Va,0,Va));",
                GBA   : "R=mix(A,D,v4(0,Va,Va,Va));",
                RBA   : "R=mix(A,D,v4(Va,0,Va,Va));",
            },
            callback(action,fromc,source,toc,amount) {  
                var pString = ""
                pString += this.fromCode[fromc];
                pString += this.actions[action];
                pString += this.toCode[toc];
                pString  += "#Va,0,1",
                this.webGLFilters.procedural(source, undefined,pString,amount,0,0,0, [0.5,0.5], 1, "RGBA");
                return this.webGLFilters;  
            },
            arguments : [{                    
                    name : "action",
                    description : "Type of copy to perform",
                    type : "String",
                    range : ["replace","add","subtract","lighter","darker","multiply","inverseMultiply","mix"]
                },{                    
                    name : "from",
                    description : "Channels copy from.",
                    type : "String",
                    range : ["RGB","RGBA","Red","Green","Blue","Alpha","RG","GB","RB","RGA","GBA","RBA"]
                },{                    
                    name : "source",
                    description : "source of copy.",
                    type : "Image",
                    range : null
                },{
                    name : "to",
                    description : "Channels to copy to.",
                    type : "String",
                    range : ["RGB","RGBA","Red","Green","Blue","Alpha","RG","GB","RB","RGA","GBA","RBA"],
                },{
                    name : "amount",
                    description : "level to copy.",
                   type : "Number",
                    range : {min : -256, max : 256, step : 1, def : 256},
                }
            ],
        });         
        //==============================================================================================================
        filterGL.filters.register("alphaFilters",filter =  { 
            name : "alphaFilters",
            description : "Procedural filters that apply alpha to the image",
            webGLFilters : null, 
            namedProcedures : {
                RGBMean2Alpha : "R=v4(Argb,#op#bump(meanv3(Argb),Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                RGBMax2Alpha : "R=v4(Argb,#op#bump(maxv3(Argb),Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                RGBMin2Alpha : "R=v4(Argb,#op#bump(minv3(Argb),Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                Hue2Alpha : "R=v4(Argb,#op#(bump(Ah,Fa,Vb,Vc)*bump(As,Fb,Vd,0)))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                Sat2Alpha : "R=v4(Argb,#op#(bump(As,Fa,Vb,Vc)*bump(Ah,Fb,Vd,0)))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                Lum2Alpha : "R=v4(Argb,#op#bump(Al,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                Red2Alpha : "R=v4(Argb,#op#bump(Ar,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                Green2Alpha : "R=v4(Argb,#op#bump(Ag,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
                Blue2Alpha : "R=v4(Argb,#op#bump(Ab,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
            },
            usePointCode : {
                RGBMean2Alpha : "D=Sa(Pxy);Fa=meanv3(Drgb);",
                RGBMax2Alpha : "D=Sa(Pxy);Fa=maxv3(Drgb);",
                RGBMin2Alpha : "D=Sa(Pxy);Fa=minv3(Drgb);",
                Hue2Alpha : "D=Sa(Pxy);Fa=rgb2H(Drgb);Fb=rgb2S(Drgb);",
                Sat2Alpha : "D=Sa(Pxy);Fa=rgb2S(Drgb);Fb=rgb2H(Drgb);",
                Lum2Alpha : "D=Sa(Pxy);Fa=rgb2L(Drgb);",
                Red2Alpha : "D=Sa(Pxy);Fa=Dr;",
                Green2Alpha : "D=Sa(Pxy);Fa=Dg;",
                Blue2Alpha : "D=Sa(Pxy);Fa=Db;",
            },
            namedAlphaOps : {
                replace : "",
                add : "Aa+",
                subtract : "Aa-",
                multiply : "Aa*",
            },
            callback(procedureName,alphaOp,source2,level,range,falloff,secondaryRange,usePoint,point, mix, channels) {  
                var glF = this.webGLFilters; 
                var pString = this.namedProcedures[procedureName];
                if(pString !== undefined){
                    pString = pString.replace("#op#",this.namedAlphaOps[alphaOp]);
                    if(usePoint){
                        pString = this.usePointCode[procedureName] + pString;
                    }else{
                        pString = "Fa=Va;Fb=0.5;"+pString;
                    }
                    glF.procedural(source2, undefined, pString, level,range,falloff,secondaryRange,point, mix, "Alpha");
                }
                return glF;  
            },
            arguments : [{
                    name : "name",
                    description : "Name of procedural filter to apply",
                    type : "String",
                    range : null,
                },{
                    name : "alphaOp",
                    description : "Operation to apply to the existing alpha value",
                    type : "String",
                    range : null,
                },{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                },{
                    name : "level",
                    description : "Center of selected range",
                    type : "Number",
                    range : {min : -256, max : 256, step : 1, def : 0},
                },{
                    name : "Range",
                    description : "distance from level to make selection ",
                    type : "Number",
                    range : {min : -256, max : 256, step : 1, def : 0},
                },{
                    name : "falloff",
                    description : "Distance off selection falloff",
                    type : "Number",
                    range : {min : -256, max : 256, step : 1, def : 0},
                },{
                    name : "secondaryRange",
                    description : "For hue/Saturation this  set the luminance and other value as a range",
                    type : "Number",
                    range : {min : -256, max : 256, step : 1, def : 0},
                },{
                    name : "usePoint",
                    description : "If true then the pixels at the point are used to select the level",
                    type : "Boolean",
                    range : {def : false},
                },sArgs.point, sArgs.mix
            ],
        }); 
        // Set the filter procedure name argument range
        filter.arguments[0].range = Object.keys(filter.namedProcedures);    
        filter.arguments[1].range = Object.keys(filter.namedAlphaOps);    
        //==============================================================================================================
        filterGL.filters.register(  "HSLFilters",filter =  { 
            name : "HSLFilters",
            description : "Procedural filters that use Hue Saturation and luminance to filter the image",
            webGLFilters : null, 
            namedProcedures : {
                hslInvert : "Ahsl=1-Bhsl*v3(Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
                
                hueFromLum  : "Ah=Bl;Rrgb=hsl2RGB(Ahsl)",
                hueFromSat  : "Ah=Bs;Rrgb=hsl2RGB(Ahsl)",
                hueFromMeanSatLum : "Ah=(Bs+Bl)/2;Rrgb=hsl2RGB(Ahsl)",
                SatFromHue  : "As=Bh;Rrgb=hsl2RGB(Ahsl)",
                SatFromLum  : "As=Bl;Rrgb=hsl2RGB(Ahsl)",
                SatFromMeanHueLum : "As=(Bh+Bl)/2;Rrgb=hsl2RGB(Ahsl)",
                LumFromHue  : "Al=Bh;Rrgb=hsl2RGB(Ahsl)",
                LumFromSat  : "Al=Bs;Rrgb=hsl2RGB(Ahsl)",
                LumFromMeanHueSat : "Al=(Bh+Bs)/2;Rrgb=hsl2RGB(Ahsl)",
                
                hueFromMeanHueSatLum : "Ah=(Bh+Bs+Bl)/3;Rrgb=hsl2RGB(Ahsl)",
                SatFromMeanHueSatLum : "As=(Bh+Bs+Bl)/3;Rrgb=hsl2RGB(Ahsl)",
                LumFromMeanHueSatLum : "Al=(Bh+Bs+Bl)/3;Rrgb=hsl2RGB(Ahsl)",

                
                hueShift    : "Ah=Bh+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1#HueClamp,Off",
                hueMultiply : "Ah=(Bh-Vb)*Va+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1#HueClamp,Off",
                hueSet      : "Ah=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                hueInvert   : "Ah=1-Bh;Rrgb=hsl2RGB(Ahsl)",
                hueThreshold: "Ah=bump(Bh,Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-0.5,1.5#Vb,0,1,#Vc,0,1",
                
                satShift    : "As=Bs+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                satMultiply : "As=(Bs-Vb)*Va+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1",
                satSet      : "As=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                satInvert   : "As=1-Bs;Rrgb=hsl2RGB(Ahsl)",
                satThreshold: "As=bump(Bs,Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-0.5,1.5#Vb,0,1,#Vc,0,1",
                
                lumShift    : "Al=Bl+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                lumMultiply : "Al=(Bl-Vb)*Va+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1",
                lumSet      : "Al=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",                    
                lumInvert   : "Al=1-Bl;Rrgb=hsl2RGB(Ahsl)",
                
                lumThreshold: "Al=bump(Bl,Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-0.5,1.5#Vb,0,1,#Vc,0,1",
            },
            callback(procedureName,source2,valueA, valueB, valueC, valueD,point, mix) {  
                if(this.namedProcedures[procedureName] !== undefined){
                    this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName], valueA, valueB, valueC, valueD, point, mix, "RGB");
                }
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "name",
                    description : "Name of procedural filter to apply",
                    type : "String",
                    range : null,
                },{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                }, sArgs.valueA, sArgs.valueB, sArgs.valueC, sArgs.valueD,sArgs.point, sArgs.mix
            ],
        }); 
        // Set the filter procedure name argument range
        filter.arguments[0].range = Object.keys(filter.namedProcedures);    
        //==============================================================================================================

        filterGL.filters.register(  "HSLTargeted",filter =  { 
            name : "HSLTargeted",
            description : "Target specific HSL values and modify them",
            webGLFilters : null, 
            namedProcedures : {

                select : [
                "Fa = (bump(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                "Fa = (bump(Bh, Er,c2h,c3h) * bump(Bs ,Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                
                ],
                selectInv : [
                "Fa = 1-(bump(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                "Fa = 1-(bump(Bh, Er,c2h,c3h) * bump(Bs, Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                ]

            },
            callback(procedureName,source2,pivitHue,hue1,hue2,hue3,pivitSat,sat1,sat2,sat3,pivitLum,lum1,lum2,lum3,hue,sat,lum,mask, point, mix) {  
                if(this.namedProcedures[procedureName] !== undefined){
                    var colours = {
                        hue: true, 
                        color1 : [hue1,sat1,lum1,1],
                        color2 : [hue2,sat2,lum2,1],
                        color3 : [hue3,sat3,lum3,1],
                        color4 : [hue,sat,lum,1]
                    };
                    if(pivitHue || pivitSat || pivitLum){

                        var pString = `
                            D=Sa(Pxy);
                            Ergb = v3(${pivitHue?"rgb2H(Drgb)":"c1h"}, ${pivitSat?"rgb2S(Drgb)":"c1s"}, ${pivitLum?"rgb2L(Drgb)":"c1l"});
                            ${this.namedProcedures[procedureName][1]}
                        `;
                        this.webGLFilters.procedural(source2, undefined,pString, 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
                    }else{
                        this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName][0], 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
                    }
                        
                }
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "name",
                    description : "Name of procedural filter to apply",
                    type : "String",
                    range : null,
                },{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                },{
                    name : "PivitHue",
                    description : "Hue is centered on the pixel's hue under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "Hue1",
                    description : "Hue mid point",
                    type : "Number",
                    range : {min : -1, max : 2, step : 0.01, def :1},
                },{
                    name : "Hue2",
                    description : "Hue range",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def :0},
                },{
                    name : "Hue3",
                    description : "Hue falloff",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def :0},
                },{
                    name : "PivitSat",
                    description : "Saturation is centered on the pixel's saturation under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                }, {
                    name : "Sat1",
                    description : "Sat mid point",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def :1},
                },{
                    name : "Sat2",
                    description : "Sat range",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def :1},
                },{
                    name : "Sat3",
                    description : "Sat falloff",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def :0},
                },{
                    name : "PivitLum",
                    description : "Luminance is centered on the pixel's luminance under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                }, {
                    name : "Lum1",
                    description : "Lum mid point",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def :1},
                },{
                    name : "Lum2",
                    description : "Lum range",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def :1},
                },{
                    name : "Lum3",
                    description : "Lum falloff",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def :0},
                },{
                    name : "Hue",
                    description : "Scale Hue",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "Sat",
                    description : "Scale Saturation",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "Lum",
                    description : "Scale Lumination",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "Mask",
                    description : "Mask alpha moves range results to alpha channel",
                    type : "Boolean",
                    range : {def : false},
                }/*,{
                    name : "FromPoint",
                    description : "Hue sat and lum is set to the pixel under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                }*/,    
                sArgs.point,sArgs.mix, 
            ],
        }); 
        // Set the filter procedure name argument range
        filter.arguments[0].range = Object.keys(filter.namedProcedures);    

        filterGL.filters.register(  "HSLCycTargeted",filter =  { 
            name : "HSLCycTargeted",
            description : "Target specific HSL values and modify them",
            webGLFilters : null, 
            namedProcedures : {

                select : [
                "Fa = (bCyc(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                "Fa = (bCyc(Bh, Er,c2h,c3h) * bump(Bs ,Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                
                ],
                selectInv : [
                "Fa = 1-(bCyc(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                "Fa = 1-(bCyc(Bh, Er,c2h,c3h) * bump(Bs, Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
                ]

            },
            callback(procedureName,source2,pivitHue,hue1,hue2,hue3,pivitSat,sat1,sat2,sat3,pivitLum,lum1,lum2,lum3,hue,sat,lum,mask, point, mix) {  
                if(this.namedProcedures[procedureName] !== undefined){
                    var colours = {
                        hue: true, 
                        color1 : [hue1,sat1,lum1,1],
                        color2 : [Math.log2(hue2/2.2)**4,sat2,lum2,1],
                        color3 : [hue3,sat3,lum3,1],
                        color4 : [hue,sat,lum,1]
                    };
                    if(pivitHue || pivitSat || pivitLum){

                        var pString = `
                            D=Sa(Pxy);
                            Ergb = v3(${pivitHue?"rgb2H(Drgb)":"c1h"}, ${pivitSat?"rgb2S(Drgb)":"c1s"}, ${pivitLum?"rgb2L(Drgb)":"c1l"});
                            ${this.namedProcedures[procedureName][1]}
                        `;
                        this.webGLFilters.procedural(source2, undefined,pString, 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
                    }else{
                        this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName][0], 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
                    }
                        
                }
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "name",
                    description : "Name of procedural filter to apply",
                    type : "String",
                    range : null,
                },{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                },{
                    name : "PivitHue",
                    description : "Hue is centered on the pixel's hue under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "Hue1",
                    description : "Hue mid point",
                    type : "Number",
                    range : {min : -1, max : 2, step : 0.002, def :0},
                },{
                    name : "Hue2",
                    description : "Hue width",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.002, def :0},
                },{
                    name : "Hue3",
                    description : "Hue falloff",
                    type : "Number",
                    range : {min : 0.5, max : 1, step : 0.002, def :0.5},
                },{
                    name : "PivitSat",
                    description : "Saturation is centered on the pixel's saturation under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                }, {
                    name : "Sat1",
                    description : "Sat mid point",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.002, def :1},
                },{
                    name : "Sat2",
                    description : "Sat range",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.002, def :1},
                },{
                    name : "Sat3",
                    description : "Sat falloff",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.002, def :0},
                },{
                    name : "PivitLum",
                    description : "Luminance is centered on the pixel's luminance under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                }, {
                    name : "Lum1",
                    description : "Lum mid point",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.002, def :1},
                },{
                    name : "Lum2",
                    description : "Lum range",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.002, def :1},
                },{
                    name : "Lum3",
                    description : "Lum falloff",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.002, def :0},
                },{
                    name : "Hue",
                    description : "Scale Hue",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.002, def : 1},
                },{
                    name : "Sat",
                    description : "Scale Saturation",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.002, def : 1},
                },{
                    name : "Lum",
                    description : "Scale Lumination",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.002, def : 1},
                },{
                    name : "Mask",
                    description : "Mask alpha moves range results to alpha channel",
                    type : "Boolean",
                    range : {def : false},
                }/*,{
                    name : "FromPoint",
                    description : "Hue sat and lum is set to the pixel under the pivit point",
                    type : "Boolean",
                    range : {def : false},
                }*/,    
                sArgs.point,sArgs.mix, 
            ],
        }); 
        // Set the filter procedure name argument range
        filter.arguments[0].range = Object.keys(filter.namedProcedures);    

        
        //==============================================================================================================
        filterGL.filters.register( "patterns",filter =  { 
            name : "patterns",
            description : "Renders various patters ",
            webGLFilters : null,                 
            namedProcedures : {
                gradient2Hor : "Fa=(Vb-Va)*X+Va;#op##Va,0,1#Vb,0,1",
                gradient3Hor : "Fa=(Va-Vc)*clamp((Px-X)/Px,0,1)+Vc+(Vb-Vc)*clamp((X-Px)/(1-Px),0,1);#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",
                gradient2Vert : "Fa=(Vb-Va)*Y+Va;#op##Va,0,1#Vb,0,1",
                gradient3Vert : "Fa=(Va-Vc)*clamp((Py-Y)/Py,0,1)+Vc+(Vb-Vc)*clamp((Y-Py)/(1-Py),0,1);#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",
                circular: "Fa=(Vb-Va)*clamp(dist(XY,Pxy)*Vc,0,1)+Va;#op##Va,0,1#Vb,0,1#Vc,-2,8#Vd,-2,2",
                circularPow: "Fa=(Vb-Va)*pow(clamp(dist(XY,Pxy)*Vc,0,1),Vd)+Va;#op##Va,0,1#Vb,0,1#Vc,-2,8#Vd,0,12",
                corners: "Fa=(Vb-Va)*X+Va;Fb=(Vd-Vc)*X+Vc;Fa=(Fb-Fa)*Y+Fa;#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",
                cornersPow: "Fa=(Vb-Va)*X+Va;Fb=(Vd-Vc)*X+Vc;Fa=(Fb-Fa)*Y+Fa;Fa=pow(Fa,2);#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",

            },
            namedMixingOps : {
                replace : "R=mix(A,B,Fa)",
                add : "R=A+B*Fa",
                subtract : "R=A-B*Fa",
                multiply : "R=A*B*Fa",
                mix : "R=(A+B*Fa)/2",                    
                difference : "R=abs(A-B*Fa)",
                screen : "R=1-((1-A)*(1-B*Fa))",
                overlay : "R=1-((1-A)*(1-B*Fa))+(A*B*Fa)",
                lighter : "R=max(A,B*Fa)",
                darker : "R=min(A,B*Fa)",
                Hue : "Ah=mix(Ah,Bh,Fa);Rrgb=hsl2RGB(Ahsl)",
                Sat : "As=mix(As,Bs,Fa);Rrgb=hsl2RGB(Ahsl)",
                Lum : "Al=mix(Al,Bl,Fa);Rrgb=hsl2RGB(Ahsl)",
            },
            namedBlendingOps : {
                replace : "R=v4(Fa)",
                add : "R=A+Fa",
                subtract : "R=A-Fa",
                multiply : "R=A*Fa",
                mix : "R=(A+Fa)/2",
                difference : "R=abs(A-Fa)",
                screen : "R=1-((1-A)*(1-Fa))",
                overlay : "R=1-((1-A)*(1-Fa))+(A*Fa)",
                lighter : "R=max(A,v4(Fa))",
                darker : "R=min(A,v4(Fa))",
                Hue : "Ah=Fa;Rrgb=hsl2RGB(Ahsl)",
                Sat : "As=Fa;Rrgb=hsl2RGB(Ahsl)",
                Lum : "Al=Fa;Rrgb=hsl2RGB(Ahsl)",
            },                
            callback(procedureName,blendingOp,source2,valueA, valueB, valueC, valueD,point, mix, channels) {  
                var glF = this.webGLFilters; 
                var pString = this.namedProcedures[procedureName];
                if(pString !== undefined){
                    if(source2 !== undefined){
                        pString = pString.replace("#op#",this.namedMixingOps[blendingOp]);
                    }else{
                        pString = pString.replace("#op#",this.namedBlendingOps[blendingOp]);
                    }
                    glF.procedural(source2, undefined, pString, valueA, valueB, valueC, valueD,point, mix, "RGB");
                }
                return glF;  
            },
            arguments : [{
                    name : "name",
                    description : "Name of procedural filter to apply",
                    type : "String",
                    range : null,
                },{
                    name : "blendingOp",
                    description : "Blending operations",
                    type : "String",
                    range : null,
                },{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                }, sArgs.valueA, sArgs.valueB, sArgs.valueC, sArgs.valueD,sArgs.point, sArgs.mix, sArgs.channels
            ],
        }); 
        // Set the filter procedure name argument range
        filter.arguments[0].range = Object.keys(filter.namedProcedures);    
        filter.arguments[1].range = Object.keys(filter.namedBlendingOps);    
        //==============================================================================================================
        filterGL.filters.register( "simpleFilters",filter =  { 
            name : "simpleFilters",
            description : "Simple single image filters, This is current home for experimental procedure filters",
            webGLFilters : null, 
            namedProcedures : {
                multiply : "R=A*B*Va#Va,1,2",
                screen : "R=1-(1-A)*(1-B)",
                dif : "R=(A-B)*1000",
                difInvert : "R=(1-(A-B))*1000",
                
                hueInvert : "Ah=1-Bh;Rrgb=hsl2RGB(Ahsl)",
                satInvert : "As=1-Bs;Rrgb=hsl2RGB(Ahsl)",
                lumInvert : "Al=1-Bl;Rrgb=hsl2RGB(Ahsl)",
                hslInvert : "Ahsl=1-Bhsl*v3(Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
                rgbaInvert : "R=1-B*v4(Va,Vb,Vc,Vd)#Va,-1,1#Vb,-1,1#Vc,-1,1#Vd,-1,1",
                BWStepMean :"R=v4(step(Va,v3(meanv3(Brgb))),Ba)#Va,0,1",
                BWStepMax : "R=v4(step(Va,v3(maxv3(Brgb))),Ba)#Va,0,1",
                BWStepMin : "R=v4(step(Va,v3(minv3(Brgb))),Ba)#Va,0,1",
                BWStepPerceptual : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4(Fa,Fa,Fa,Ba)#Va,0,1",
                BWStepPhoton : "D=B*256;D*=D;Drgb=step(Va,v3(pow((Dr+Dg+Db)/3,0.5)/256));R=v4(Drgb,Ba)#Va,0,1",
                BWMean : "R=v4(v3(meanv3(Brgb)),Ba)",
                BWMax : "R=v4(v3(maxv3(Brgb)),Ba)",
                BWMin : "R=v4(v3(minv3(Brgb)),Ba)",
                BWPerceptual : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(Fa,Fa,Fa,Ba)",
                BWPhoton : "D=B*256;D*=D;Drgb=v3(pow((Dr+Dg+Db)/3,0.5)/256);R=v4(Drgb,Ba)",
                DotRgbHSl : "Rrgb=v3(dot(Brgb*Va,Bhsl*Vb));Ra=Ba#Va,0,1#Vb,0,1",
                CrossRgbHSl : "Rrgb=cross(Brgb*Va,Bhsl*Vb);Ra=Ba#Va,0,1#Vb,0,1",
                NormRgb : "Rrgb=norm(Brgb-v3(Va,Vb,Vc));Ra=Ba#Va,-1,1#Vb,-1,1#Vc,-1,1",
                NormHsl : "Ahsl=norm(Bhsl-Ahsl*v3(Va,Vb,Vc));Ra=Ba;Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
                NormHslAB : "Ahsl=norm(Bhsl-Ahsl);Ra=Ba;Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
                NormRgbAB : "Rrgb=norm(Brgb-Argb);Ra=Ba;",
                randMix : "R=mix(A,B,rF);",
                randColLev : "Rrgb=mix(Brgb*rV3,Brgb,Va);Ra=Ba#Va,0,1",
                randTest : "Rrgb=rV3*Va;Ra=rF*Va#Va,0,2",
                randScat : "R=mix(B,A,step(Va,rF))#Va,0,1",
                
                movePixMeanRGB: "Fa=((Br+Bg+Bb)/3)*pi2;R=mix(A,SA(v2(cos(Fa),sin(Fa))*Va),Vb)#Va,-10,10#Vb,0,1",
                movePixMeanRGBMore: "Fa=((Br+Bg+Bb)/3)*pi2*Vc;R=mix(A,SA(v2(cos(Fa),sin(Fa))*Va),Vb)#Va,-10,10#Vb,0,1#Vc,-10,10",
                movePixRGB: `
                    Fa=((Br+Bg+Bb)/3)*pi2*Vc;
                    Fb=cos(Fa);
                    Fc=sin(Fa);
                    D=mix(SA(v2(Fb,Fc)*Va),B,Vb);
                    Fa=meanv3(Drgb)*pi2*Va;
                    R=mix(SA(v2(cos(Fa)+Fc,sin(Fa)+Fb)*Va),A,Vb);
                    #Va,-10,10#Vb,0,1#Vc,-10,10`,
                pixelGrow : `
                    Fc = cos(Ar*pi*2+Vb) * Va;
                    Fd = sin(Ar*pi*2+Vb) * Va;
                    D = SA(v2(-Fc,-Fd));
                    E = SA(v2(Fc,Fd));
                    Fa = meanv4(D)-meanv4(E) + 0.5;
                    R = mix(D,E,step(0.5,Fa));
                    Fc = cos(Ag*pi*2+Vc) * Va;
                    Fd = sin(Ag*pi*2+Vc) * Va;
                    D = SA(v2(-Fc,-Fd));
                    E = SA(v2(Fc,Fd));
                    Fb = meanv4(D)-meanv4(E) + 0.5;
                    D = mix(D,E,step(0.5,Fb));
                    R = mix(R,D,step(0.5,Fa-Fb+0.5));
                    #Va,-10,10#Vb,-10,10#Vc,-10,10`,
                movePixHueLum : "R=mix(SA(v2(cos(Bh*pi2*Vc),sin(Bh*pi2*Vc))*Bl*Va),A,Vb)#Va-10,10#Vb,0,1#Vc,-10,10",
                
                posMixVert : "R=mix(A,B,Y);",
                posMixHor : "R=mix(A,B,X);",
                posMixVertSet : "R=mix(A,B,clamp(abs(Y-Va)*Vb+Vc,0,1));#Va,0,1#Vb,-2,2#Vc,-2,2",
                posMixHorSet : "R=mix(A,B,clamp(abs(X-Va)*Vb+Vc,0,1));#Va,0,1#Vb,-2,2#Vc,-2,2",
                posMixCircle : "R=mix(A,B,clamp(dist(XY,v2(Vc,Vd))*Va + Vb);#Va,0,1#Vb,-2,2#Vc,0,1#Vd,0,1",
                
                hueShift : "Ah=Bh+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1#HueClamp,Off",
                hueMultiply : "Ah=Bh*Va+Vb;Rrgb=hsl2RGB(Bhsl)#Va,-4,4#Vb,-1,1#HueClamp,Off",
                hueContrast :"Ah=(Bh-0.5)*(Va-1)+0.5+Vb;Rrgb=hsl2RGB(Ahsl)#Va,pNorm,10#Vb,0,1#HueClamp,Off",
                lumContrast :"Al=(Bl-0.5)*(Va-1)+0.5+Vb;Rrgb=hsl2RGB(Ahsl)#Va,pNorm,10#Vb,-3,3",
                satContrast :"As=(Bs-0.5)*(Va-1)+0.5+Vb;Rrgb=hsl2RGB(Ahsl)#Va,pNorm,10#Vb,-3,3",
                hueSet : "Ah=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                satSet : "As=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                lumSet : "Al=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                hueRangeRemove : "R=A;Ra=bump(Bh,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                satRangeRemove : "R=A;Ra=bump(Bs,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                lumRangeRemove : "R=A;Ra=bump(Bl,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                redRangeRemove : "R=A;Ra=bump(Br,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                greenRangeRemove : "R=A;Ra=bump(Bg,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                blueRangeRemove : "R=A;Ra=bump(Bb,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                alphaRangeRemove : "R=A;Ra=bump(Ba,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
                hueRangeSat : "As=mix(Bs*Vd,Bs,bump(Bh,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
                hueRangeLum : "Al=mix(Bl*Vd,Bs,bump(Bh,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
                hueRangeHue : "Ah=mix(Bh+Vd,Bs,bump(Bh,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                satRangeSat : "As=mix(Bs*Vd,Bs,bump(Bs,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
                satRangeLum : "Al=mix(Bl*Vd,Bs,bump(Bs,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
                satRangeHue : "Ah=mix(Bh+Vd,Bs,bump(Bs,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                lumRangeSat : "As=mix(Bs*Vd,Bs,bump(Bl,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
                lumRangeLum : "Al=mix(Bl*Vd,Bs,bump(Bl,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
                lumRangeHue : "Ah=mix(Bh+Vd,Bs,bump(Bl,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                distanceRemove : "R=A;Ra=step(Vd,dist(Ahsl,v3(Va,Vb,Vc)));#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                distanceHue : "Ah=dist(Ahsl,v3(Va,Vb,Vc))*Vd;Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                distanceSat : "As=dist(Ahsl,v3(Va,Vb,Vc))*Vd;Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                distanceLum : "Al=dist(Ahsl,v3(Va,Vb,Vc))*Vd;Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
                distanceRemoveAB : "R=A;Ra=step(Va,dist(Ahsl,Bhsl)*Vb);#Vb,-2,2#Va,0,1",
                distanceHueAB : "Ah=dist(Ahsl,Bhsl)*Va;Rrgb=hsl2RGB(Ahsl)#Va,-1,1",
                distanceSatAB : "As=dist(Ahsl,Bhsl)*Va;Rrgb=hsl2RGB(Ahsl)#Va,-1,1",
                distanceLumAB : "Al=dist(Ahsl,Bhsl)*Va;Rrgb=hsl2RGB(Ahsl)#Va,-1,1",
                
                hueExpand : "Ah=clamp((Ah-Va)/Vb+Va,0,1);Rrgb=hsl2RGB(Ahsl)#Va,0,1#Vb,0,1#HueClamp,Off",
                hueBox : "Ah=X;As=1;Al=Y;Rrgb=hsl2RGB(Ahsl)",
                hueCircle : "Ah=dist(XY,v2(0.5,0.5))*Va + Vb;Rrgb=hsl2RGB(Ahsl)#Va,-6,6#Vb,0,2#HueClamp,Off",
                colorBox :"Fa=(Vb-Va)*X+Va;Fb=(Vd-Vc)*X+Vc;Ah=(Fb-Fa)*Y+Fa;Rrgb=hsl2RGB(v3(Ah,1,0.5))#Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",
                satLumBox : "Ah=Va;As=X;Al=Y;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
                luminance : "Al=Bl;Rrgb=hsl2RGB(Ahsl)",
                lum2Sat : "As=Bl;Rrgb=hsl2RGB(Ahsl)",
                lum2Hue : "Ah=Bl;Rrgb=hsl2RGB(Ahsl)",
                lumFromHS : "Al=Bh*Bs;Rrgb=hsl2RGB(Ahsl)",
                saturation : "As=Bs;Rrgb=hsl2RGB(Ahsl)",
                power : "R=pow(A,v4(Va))#Va,pNorm,10",
                powerAdd : "R=A+pow(A,v4(Va))#Va,pNorm,10",
                powerSub : "R=A-pow(A,v4(Va))#Va,pNorm,10",
                powerDown : "R=0.5+((1-pow(A,v4(Vb)))-pow(A,v4(Va)))#Va,pNorm,10#Vb,pNorm,10",
                contrast : "R=(A-0.5)*(Va-1)+0.5#Va,pNorm,10",
                contrastChannels : "R=(A-0.5)*v4(Va-1,Vb-1,Vc-1,Vd-1)+0.5#Va,pNorm,10#Vb,pNorm,10#Vc,pNorm,10#Vd,pNorm,10",
            },
            callback(procedureName,source2,valueA, valueB, valueC, valueD, point, mix, channels) {  
                if(this.namedProcedures[procedureName] !== undefined){
                    this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName], valueA, valueB, valueC, valueD,point, mix, channels);
                }
                return this.webGLFilters;  
            },
            arguments : [{
                    name : "name",
                    description : "Name of procedural filter to apply",
                    type : "String",
                    range : null,
                },{
                    name : "source2",
                    description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
                    type : "Image",
                    range : null,
                }, sArgs.valueA, sArgs.valueB, sArgs.valueC, sArgs.valueD,sArgs.point, sArgs.mix, sArgs.channels
            ],
        }); 
        filter.arguments[0].range = Object.keys(filter.namedProcedures);    
        //==============================================================================================================
        filterGL.filters.register("Unsharpen",filter =  { 
            name : "Unsharpen",
            description : "Unsharpen mask sharpens the image by blurring the image and creating a mask from the difference to sharpen the image",
            webGLFilters : null, 
            callback(radius,scale,offset,invert,useMean,iterations, mix, channels) {  
                var glF = this.webGLFilters; 
                radius = radius < 3 ? 3 : radius;
                glF.gBlur(radius, scale, 0 ,iterations,1, channels);
                var pString = "R=B+(B-A)*Va#Va,0,8";
                if(useMean){
                    pString = "D=B-A;Fa=1+((Dr+Db+Dg)/3)*Va;R=B*Fa#Va,0,8";
                    if(invert){
                        pString = "D=B-A;Fa=1-((Dr+Db+Dg)/3)*Va;R=B*Fa#Va,0,8";
                    }
                }else{
                    if(invert){
                        pString = "R=B+(A-B)*Va#Va,0,8";
                    }
                }
                glF.procedural(glF.sourceTexture, undefined, pString, offset, 0, 0, 0, [0.5,0.5], mix, channels);
                return glF;  
            },
            arguments : [{
                    name : "Radius",
                    description : "How wide the effect is",
                    type : "Number",
                    range : {min : 3, max : 31, step : 1, def : 3},
                },{
                    name : "scale",
                    description : "Additional scale",
                    type : "Number",
                    range : {min : -1, max : 1, step : 0.02, def : 0},
                },{
                    name : "offset",
                    description : "determines how the black and white is split",
                    type : "Number",
                    range : {min : -256, max : 256, step : 1, def : 128},
                },{
                    name : "Invert",
                    description : "Inverts the result",
                    type : "Boolean",
                    range : {def : false},
                },{
                    name : "UseMean",
                    description : "Uses the mean of the difference for each channel",
                    type : "Boolean",
                    range : {def : false},
                }, {
                    name : "iterations",
                    description : "Number of times to apply the filter before returning the result. Be careful some machines will crash the GPU if you use large matrix with many iteration. Iteration is done in JavaScript.",
                    type : "Number",
                    range : {min : 1, max : 32, step : 1, def : 1},
                }, sArgs.mix, sArgs.channels
            ],
        }); 
                
        
    }());     
}
     
     
     
     
     
     
     
     
     
 
 
 
 