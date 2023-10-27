(()=>{
    const filter = {
        name : "HSLCurves",
        description : {
            text : "Apply contrast, level and trim on Saturation and Luminance channels. Apply push and pull on the Hue channel.",
            author : "BM67",
            contact : "markspronck@gmail.com",
        },
        curvePowerNorm(val){ return Math.pow(((val * 3) + 5)/5,Math.log2(10)) },
        callback(
            hue  = filter.arguments[0].range.def,
            hueCenter = filter.arguments[1].range.def,
            satContrast = filter.arguments[2].range.def,
            satLevel = filter.arguments[3].range.def,
            satTrim = filter.arguments[4].range.def,
            lumContrast = filter.arguments[5].range.def,
            lumLevel = filter.arguments[6].range.def,
            lumTrim = filter.arguments[7].range.def,
            mix = filter.arguments[8].range.def,
            clampResult = filter.arguments[9].range.def
        ) {
            var glF = this.webGLFilters; // alias for lazy programmers
            if(!this.shader){
                this.shader = glF.Shader(null, `
                    uniform sampler2D texture;
                    uniform float hue;  // contrast curves
                    uniform float hueCenter;
                    uniform float satContrast;
                    uniform float satLevel;  // Saturation Level
                    uniform float satTrim;  // Saturation trim
                    uniform float lumContrast;
                    uniform float lumLevel;  // luminance level
                    uniform float lumTrim;  // luminance trim
                    uniform float mixin; // how much of the effect to mix with the source

                    varying vec2 texCoord;
                    ##easeInOut##
                    ##rgb2HSL##
                    ##hsl2RGB##
                    void main() {
                        vec4 srcColor = texture2D(texture, texCoord);
                        vec3 hsl = rgb2HSL(srcColor.rgb);
                        float h = mod(hsl.r + hueCenter, 1.0);
                        hsl = vec3(
                            easeInOut(h,hue) - hueCenter,
                            easeInOut(hsl.g, satContrast) * satLevel + satTrim,
                            easeInOut(hsl.b, lumContrast) * lumLevel + lumTrim
                        );
                        //gl_FragColor = vec4(hsl2RGB(hsl), srcColor.a);
                        gl_FragColor = mix(srcColor,vec4(hsl2RGB(hsl), srcColor.a),mixin);

                    }
               `).useLinker();

            }
            hue = this.curvePowerNorm(hue);
            satContrast = this.curvePowerNorm(satContrast);
            lumContrast = this.curvePowerNorm(lumContrast);
            glF.filter(this.shader, {
                hue , hueCenter : 0.5 - hueCenter,
                satContrast, satLevel, satTrim,
                lumContrast,lumLevel , lumTrim,
                mixin : mix,
                clampResult : {type : "uniform1i", value : clampResult ? 1 : 0},
            });
            return glF;
        },
        arguments : [{
                name : "hue pull push",
                description : "Values less than one pull the hues to the hue center, greater than one pushes the hue out from center",
                type : "Number",
                range : {min : -1, max : 1, step : 0.01, def : 0 },
            },{
                name : "hueCenter",
                description : "The center of the hue curve. The hue at this point will not change ",
                type : "Number",
                range : {min : -0.5, max : 1.5, step : 0.01, def : 0.5},
            },{
                name : "satContrast",
                description : "Increase or decrease saturation contrast",
                type : "Number",
                range : {min : -1, max : 1, step : 0.01, def : 0 },
            },{
                name : "satLevel",
                description : "Increases or decrease saturation level",
                type : "Number",
                range : {min : -2, max : 2, step : 0.01, def : 1},
            },{
                name : "satTrim",
                description : "Trims saturation up or down",
                type : "Number",
                range : {min : -2, max : 2, step : 0.01, def : 0 },
            },{
                name : "lumContrast",
                description : "Increase or decrease luminance contrast",
                type : "Number",
                range : {min : -1, max : 1, step : 0.01, def : 0 },
            },{
                name : "lumLevel",
                description : "Increases or decrease luminance level",
                type : "Number",
                range : {min : -2, max : 2, step : 0.01, def : 1 },
            },{
                name : "lumTrim",
                description : "Trims luminance up or down",
                type : "Number",
                range : {min : -2, max : 2, step : 0.01, def : 0 },
            },{
                name : "mix",
                description : "Trims luminance up or down",
                type : "Number",
                range : {min : -1, max : 1, step : 0.01, def : 1 },
            },{
                name : "clampResult",
                description : "If true then conversion from HSL to RGB is clamped, else the values are free to go out of range.",
                type : "Boolean",
                range : {def : true },
            }
        ],
    } ;

    filterGL.filters.register(filter.name, filter);
})();