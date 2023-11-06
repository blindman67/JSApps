/*
   Test draft Beta 0.01 6/2/2017
   Test draft Beta 0.02 28/8/2018  Updated to be used with PainterV3
   This is a webGL filter interface designed to apply filters to 2D images.
   Inspired by https://github.com/evanw/webgl-filter

    Basic use example

    NOTE Sometimes webGL may have crashed due to issues unrelated to filterGL and be unavalible for use until the browser has been restarted or WebGl reset. If filterGL is started when WebGL is unavalible it will be set to undefined

    Register a filter See file filterTemplate.js for example of a filter

        //  myFilter.name = "myFilter"
        filterGL.filters.register(myFilter.name, myFilter);


    Thought not requiered calling filterGL.create() will create more convenient binding for the filter objects and return the `glCanvas` object that provides additional functionality. It will also have the filters as named properties

    const glCanvas = filterGL.create();


    To apply to an image get the filter by name, if you have not created a glCanvas

        const filter = filterGL.filters.getFilter(myFilter.name);

    Create a webGL texture for the render to use. Only need to do this once or when you need a new webGL texture to render to

        if (! filter.webGLFilters.isSourceTextureSet() ) {
            filter.webGLFilters.sourceTexture = filter.webGLFilters.createTexture(image, image.width, image.height);
        }

    If there is a sourceTexture set, copy the image to it. NOTE the size is set from the image.

        filter.webGLFilters.setSource(image);

    Apply the filter by calling its callback function passinig the requiered arguments

        filter.callback(40,2,[0.5,0.5]);

    Rendered images automaticly move to the source for the next render iteration. Calling filter callback will apply the filter to the result of the last filter

    To get a copy of the image draw the resulting canvas to a canvas

        filterGL.show(); // copy result to filterGL.canvas

    Clear your canvas and draw filterGl canvas to that


        ctx.clearRect(0,0,selection[0].image.width, selection[0].image.height);
        ctx.drawImage(filter.webGLFilters.canvas,0,0);


    SHADERS

    Filters are created using shaders. Shaders are writen in a C like language that is  compiled JIT by webGL.

    To provide common functionality across filters filterGL alows for a limited linking system. It is in effect a directive replacement system where the directive is in the shader source code as `##directiveName##`

    An example of using a linked directive to include a function to mean the content of a Vec3

        uniform sampler2D texture;
        varying vec2 texCoord;
        ##meanv3##  // adds the function meanv3
        void main() {
            vec4 color = texture2D(texture, vec2(texCoord.x, texCoord.y));
            gl_FragColor = vec4(color.xyz, meanv3(color.xyz));
        }

    When linked by the filter GL shader it will result in a WebGL shader than looks like


        uniform sampler2D texture;
        varying vec2 texCoord;
        float meanv3(vec3 v) {
            return (v.x + v.y + v.z) / 3.0;
        }
        void main() {
            vec4 color = texture2D(texture, vec2(texCoord.x, texCoord.y));
            gl_FragColor = vec4(color.xyz, meanv3(color.xyz));
        }




*/
var filterGL = (function() {
    var showSourceOnShaderError = true; // If true sends shader source file to console
    var gl;
    var canvas;   		// canvas for webGL context
    var basicShader;  	// Basic shader for general purpose rendering
    var flipShader;   	// Another basic shader this one also flips image upside down.
    var filterCanvas; 	// The interface created by filterGL.create();
    var shown = false; 	// If false filtered texture may not be accessible
    var canUseFloats = false;  // If true then can use floating point textures.
    function isWebGLAvaliable() {
        canvas = document.createElement('canvas');
        try {
			gl = canvas.getContext("webgl2", {premultipliedAlpha: false, antialias: false, alpha: true});
        } catch (e) {
            gl = undefined;
            return false;
        }
        try {
            if (gl.getExtension('OES_texture_float') && gl.getExtension('OES_texture_float_linear')) { canUseFloats = true }
            log("webGL is flagged as canUseFloats: " + canUseFloats);
            
        } catch (e) {
            return false;
        }
        return true;
    }
    if (! isWebGLAvaliable() ) {
        console.warn("filterGL did not detect any webGL support and did not initialise");
        return undefined;
    }
    // this is a named list of shader source code that can be linked into shaders as needed
    const shaderSource = {
        flipShader: `
            uniform sampler2D texture;
            varying vec2 texCoord;
            void main() { gl_FragColor = texture2D(texture, vec2(texCoord.x, 1.0 - texCoord.y)); }`,
        bump: `
            float bump(float val, float center, float width, float falloff) {
                return smoothstep(
                        center - width - falloff,
                        center - width, val) *
                    (1.0 - smoothstep(
                        center + width,
                        center + width + falloff,
                        val
                    ));
            } `,
        bCyc: `
            float bCyc(float val, float center, float width, float falloff) {
                return clamp(pow(cos((val - center) * ${(Math.PI * 2).toFixed(6) }) * falloff + falloff, width), 0.0, 1.0);
            } `,
        meanv4: `float meanv4(vec4 v) { return (v.x + v.y + v.z + v.a) / 4.0; }`,
        meanv3: `float meanv3(vec3 v) { return (v.x + v.y + v.z) / 3.0; }`,
        meanv2: `float meanv2(vec2 v) { return (v.x + v.y) / 2.0; }`,
        maxv4: `float maxv4(vec4 v) { return max(v.x, max(v.y, max(v.z, v.w))); }`,
        maxv3: `float maxv3(vec3 v) { return max(v.x, max(v.y, v.z)); }`,
        maxf4: `float maxf4(float f1, float f2, float f3, float f4) { return max(f1, max(f2, max(f3, f4))); }`,
        maxf3: `float maxf3(float f1, float f2, float f3) { return max(f1, max(f2, f3); }`,
        minv4: `float minv4(vec4 v) { return min(v.x, min(v.y, min(v.z, v.w))); }`,
        minv3: `float minv3(vec3 v) { return min(v.x, min(v.y, v.z)); }`,
        minf4: `float minf4(float f1, float f2, float f3, float f4) { return min(f1, min(f2, min(f3, f4))); }`,
        minf3: `float mimf3(float f1, float f2, float f3) { return min(f1, min(f2, f3)); }`,
		negInv: `float negInv(float val, float scale) { return scale < 0.0 ? (1.0 - val) * -scale : val * scale; }`,
        randomF: `
            float seedF = 0.0;
            const float randC1 = 43758.5453;
            const vec3 randC2 = vec3(12.9898, 78.233, 151.7182);
            float randomF() {
                seedF = fract(sin(dot(gl_FragCoord.xyz + seedF, randC2)) * randC1 + seedF);
                return seedF;
            }`,
        randomV3: `
            float seedV3 = 0.0;
            const float randV1 = 43758.5453;
            const vec3 randV2 = vec3(12.9898, 78.233, 151.7182);
            vec3 randomV3() {
                vec3 rand;
                rand.x = fract(sin(dot(gl_FragCoord.xyz + seedV3, randV2)) * randV1 + seedV3);
                rand.y = fract(sin(dot(gl_FragCoord.xyz + rand.x, randV2)) * randV1 + rand.x);
                rand.z = fract(sin(dot(gl_FragCoord.xyz + rand.y, randV2)) * randV1 + rand.y);
                seedV3 = rand.z;
                return rand;
            }`,
        randomVec2: `float random(vec2 pos, vec2 scale, float seed) { return fract(sin(dot(pos + seed, scale)) * 43758.5453 + seed); }`,
        easeInOut: `
            float easeInOut(float val, float power) {
                 val = clamp(val, 0.0, 1.0);
                 float v1 = pow(val, power);
                 return v1 / (v1 + pow(1.0 - val, power));
            }`,
        easeInOut4: `
            vec4 easeInOut4(vec4 val, vec4 power) {
                 val = clamp(val, 0.0, 1.0);
                 vec4 v1 = pow(val, power);
                 return v1 / (v1 + pow(1.0 - val, power));
            }`,
        easeInOut3: `
            vec3 easeInOut3(vec3 val, vec3 power) {
                 val = clamp(val, 0.0, 1.0);
                 vec3 v1 = pow(val, power);
                 return v1 / (v1 + pow(1.0 - val, power));
            }`,
        selectRange4:`
            vec4 selectRange4(float start, float range, vec4 inV, vec4 op1, vec4 op2) {
                float top = start + range;
                return vec4(
                    (inV.x < start || inV.x > top ? op1.x : op2.x),
                    (inV.y < start || inV.y > top ? op1.y : op2.y),
                    (inV.z < start || inV.z > top ? op1.z : op2.z),
                    (inV.w < start || inV.w > top ? op1.w : op2.w)
                );
            }`,
        selectRange1:`
            float selectRange1(float start, float range, float inV, float op1, float op2) {
                float top = start + range;
                return  inV < start || inV > top ? op1 : op2;
            }`,
        direction: `
            float direction(vec2 vector) {
                vector = normalize(vector);
                float ang;
                if (vector.x > 0.0) { ang = atan(vector.y/vector.x); }
                else if (vector.x < 0.0) { ang = pi - atan(vector.y/abs(vector.x)); }
                else { ang = pi0p5 * sign(vector.y); }
                return ang;
            } `,
        sampleTexture1: `vec4 tex1(vec2 xy) { return texture2D(texture, texCoord + xy / texSize); }\n vec4 tex1(float x, float y) { return texture2D(texture, texCoord + vec2(x,y) / texSize); }`,
        sampleTexture2: `vec4 tex2(vec2 xy) { return texture2D(texture1, texCoord + xy / texSize2); }\n vec4 tex2(float x, float y) { return texture2D(texture1, texCoord + vec2(x,y) / texSize1); }`,
        sampleTexture3: `vec4 tex3(vec2 xy) { return texture2D(texture2, texCoord + xy / texSize3); }\n vec4 tex3(float x, float y) { return texture2D(texture2, texCoord + vec2(x,y) / texSize2); }`,
        sampleTextureAbsolute1: `vec4 texA1(vec2 xy) { return texture2D(texture, xy); }\n vec4 texA1(float x, float y) { return texture2D(texture, vec2(x,y)); }`,
        sampleTextureAbsolute2: `vec4 texA2(vec2 xy) { return texture2D(texture1, xy); }\n vec4 texA2(float x, float y) { return texture2D(texture1, vec2(x,y)); }`,
        sampleTextureAbsolute3: `vec4 texA3(vec2 xy) { return texture2D(texture2, xy); }\n vec4 texA3(float x, float y) { return texture2D(texture2, vec2(x,y)); }`,
        rgb2H: `
            float rgb2H(vec3 rgb) {
                float h = 0.0;
                float minC = min(min(rgb.r, rgb.g), rgb.b);
                float maxC = max(max(rgb.r, rgb.g), rgb.b);
                if (minC == maxC) return h;
                float d = maxC - minC;
                if (maxC == rgb.r) {
                    if (rgb.g < rgb.b) h = (rgb.g - rgb.b) / d + 6.0;
                    else h = (rgb.g - rgb.b) / d;
                } else if (maxC == rgb.g) h = (rgb.b - rgb.r) / d + 2.0;
                else h = (rgb.r - rgb.g) / d + 4.0;
                h /= 6.0;
                return h;
            }`,
        rgb2S: `
            float rgb2S(vec3 rgb) {
                float minC = min(min(rgb.r, rgb.g), rgb.b);
                float maxC = max(max(rgb.r, rgb.g), rgb.b);
                if (minC == maxC) { return 0.0; }
                if ((maxC + minC) / 2.0 > 0.5) { return (maxC - minC) / (2.0 - maxC - minC); }
                return  (maxC - minC) / (maxC + minC);
            }`,
        rgb2L: `
            float rgb2L(vec3 rgb) {
                float minC = min(min(rgb.r, rgb.g), rgb.b);
                float maxC = max(max(rgb.r, rgb.g), rgb.b);
                if (minC == maxC) return minC;
                return (maxC + minC) / 2.0;
            } `,
        rgb2HSL: `
            vec3 rgb2HSL(vec3 rgb) {
                vec3 hsl;
                float minC = min(min(rgb.r, rgb.g), rgb.b);
                float maxC = max(max(rgb.r, rgb.g), rgb.b);
                if (minC == maxC) { return vec3(0.0, 0.0, minC); }
                float d = maxC - minC;
                hsl.z = (maxC + minC) / 2.0;
                if (hsl.z > 0.5) hsl.y = d / (2.0 - maxC - minC);
                else hsl.y = d / (maxC + minC);
                if (maxC == rgb.r) {
                    if (rgb.g < rgb.b) { hsl.x = (rgb.g - rgb.b) / d + 6.0; }
                    else { hsl.x = (rgb.g - rgb.b) / d; }
                } else if (maxC == rgb.g) { hsl.x = (rgb.b - rgb.r) / d + 2.0; }
                else { hsl.x = (rgb.r - rgb.g) / d + 4.0; }
                hsl.r /= 6.0;
                return hsl;
            }`,
        hue2Channel: `
            uniform int clampResult;
            float hue2Channel(float p, float q, float t) {
                if (t < 0.0) { t += 1.0; }
                if (t > 1.0) { t -= 1.0; }
                if (t < 1.0 / 6.0) { return p + (q - p) * 6.0 * t; }
                if (t < 1.0 / 2.0) { return q; }
                if (t < 2.0 / 3.0) { return p + (q - p) * (2.0 / 3.0 - t) * 6.0; }
                return p;
            }`,
        hsl2RGB: `
            ##hue2Channel##
            vec3 hsl2RGB(vec3 hsl) {
                hsl.x = mod(hsl.x, 1.0);
                if (clampResult == 1) { hsl = clamp(hsl, 0.0, 1.0); }
                if (hsl.y == 0.0) { return vec3(hsl.z); }
                float q;
                if (hsl.z < 0.5) { q = hsl.z * (1.0 + hsl.y); }
                else { q = hsl.z + hsl.y - hsl.z * hsl.y; }
                float p = 2.0 * hsl.z - q;
                return vec3( hue2Channel(p, q, hsl.x + 1.0 / 3.0),
                             hue2Channel(p, q, hsl.x),
                             hue2Channel(p, q, hsl.x - 1.0 / 3.0) );
            } `,
        hsl2RGB_M2: `
            vec3 hsl2RGB(vec3 hsl) {
                vec3 rgb;
                hsl.x = mod(hsl.x, 1.0);
                hsl = clamp(hsl, 0.0, 1.0);
                if (hsl.y == 0.0) { return vec3(hsl.z); }
                float h360 = hsl.x * 360.0;
                float C = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
                float X = C * (1.0 - abs(mod((h360 / 60.0), 2.0) - 1.0));
                if (h360 < 60.0) {        rgb = vec3(C , X , 0.);
                } else if (h360 < 120.0) { rgb = vec3(X , C , 0.);
                } else if (h360 < 180.0) { rgb = vec3(0., C , X);
                } else if (h360 < 240.0) { rgb = vec3(0., X , C);
                } else if (h360 < 300.0) { rgb = vec3(X , 0., C);
                } else {                  rgb = vec3(C , 0., X); }
                return rgb + vec3(hsl.z - C / 2.0);
            } `,
        standardMixUniforms: `
            uniform float mixin;
            uniform vec2 texSize;
            uniform float red;
            uniform float green;
            uniform float blue;
            uniform float alpha;
            uniform float bw;
            uniform int lightDark;
        `,
        standardMixResult:`
                if (bw == 1.0) {
					color = mix(src1Color, color, mixin);
                    float cV = color.r + color.g + color.b;
                    color = vec4(vec3(cV / 3.0), color.a);
                    if (lightDark != 0) {
                        float scV = src1Color.r + src1Color.g + src1Color.b;
                        if (lightDark == 1 && cV > scV) {  gl_FragColor = color; }
                        else if (lightDark == 2 && cV < scV) { gl_FragColor = color; }
                        else { gl_FragColor = vec4(vec3(scV / 3.0), src1Color.a); }
                    } else { gl_FragColor = color; }
                } else {
                    color = mix(src1Color, color, vec4(red, green, blue, alpha));
                    if (lightDark != 0) {
                        float cV = color.r * red  + color.g * green + color.b  * blue + color.a * alpha;
                        float scV = src1Color.r * red + src1Color.g * green + src1Color.b * blue + src1Color.a * alpha;
                        if (lightDark == 1 && cV > scV) { gl_FragColor = mix(src1Color, color, mixin); }
                        else if (lightDark == 2 && cV < scV) { gl_FragColor = mix(src1Color, color, mixin); }
                        else { gl_FragColor = src1Color; }
                    } else { gl_FragColor = mix(src1Color, color, mixin); }
                }
        `,
        standardMixUniformsJS(mixAmount, channels, width, height) {
            var lightDark = 0; // for both Light and Dark
            if (channels.includes("L")) { lightDark = 1 }
            else if (channels.includes("D")) { lightDark = 2 }
            return {
                mixin:      mixAmount,
                texSize:    [width, height],
                lightDark:  {type: "uniform1i", value: lightDark},
                bw:         channels.includes("BW") ? 1 : 0,
                red:        channels.includes("R") ? 1 : 0,
                green:      channels.includes("G") ? 1 : 0,
                blue:       channels.includes("B") ? 1 : 0,
                alpha:      channels.includes("A") ? 1 : 0,
            };
        },
        colorsJS(colorsObj) {
            const retData = {};
            for (const c of Object.keys(colorsObj)) {
                if (c.indexOf("color") > -1) {
                    const col = colorsObj[c];
                    retData[c] = [ col[0] / 255, col[1] / 255, col[2] / 255, col[3] / 255 ];
                }
            }
            return retData;
        },
        colorsHSLJS(colorsObj) {
            const retData = {};
            for (const c of Object.keys(colorsObj)) {
                if (c.indexOf("color") > -1) {
                    const col = colorsObj[c];
                    retData[c] = [col[0], col[1], col[2], col[3]];
                }
            }
            return retData;
        },
    }
    const Shader = (function() {
        const defaults = {
            vertex: `
                attribute vec2 vertex;
                attribute vec2 textureCoordinates;
                varying vec2 texCoord;
                void main() {
                    texCoord = textureCoordinates;
                    gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);
                }
            `,
            fragment: `
                uniform sampler2D texture;
                varying vec2 texCoord;
                void main() { gl_FragColor = texture2D(texture, texCoord); }
            `,
        }
        function showErrorLine(error, source) {  // Shows shader error line and column to help in debugging.
            const  dat = error.split(":");
            if (typeof dat[2] === "string") {
                var line = dat[2].trim();
                const column = dat[1].trim();
                if (!isNaN(line) && !isNaN(column)) {
                    line = "\n" + source.split("\n") [Number(line) -1] + "\n";
                    line += "^".padStart(Number(column), ".");
                    console.warn(line);
                    return line + "\n";
                }
            } else if (showSourceOnShaderError) { console.log(source) }
            return "";
        }
        function removeComments(source) { return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*?$/gm, "\n") }
        function linkSource(source) {
            source = removeComments(source);
            var len;
            while (len !== source.length) {
                len = source.length;
                Object.keys(shaderSource).forEach((name) => {
                    if (typeof shaderSource[name] === "string") { source = source.replace(new RegExp("##"+name+"##", "g"), "\n" + shaderSource[name] + "\n") }
                });
            }
            return source;
        }
        function compileSource(type, source) {
            var tName = "Vertex";
            if (type === gl.FRAGMENT_SHADER) {
                tName = "Fragment";
                if (source.indexOf("precision highp float") === -1) { source = 'precision highp float;\n' + source }
            }
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                if (showSourceOnShaderError) { console.log(source) }
                const error = gl.getShaderInfoLog(shader);
                glCanvas.error = true; 
                throw new Error(showErrorLine(error, source) + tName + ' shader : ' + error);
            }
            return shader;
        }
        function compileProgram(vertext, fragment, useLinker) {
            var program = gl.createProgram();
            if (useLinker) {
                vertext = linkSource(vertext);
                fragment = linkSource(fragment);
            }
            gl.attachShader(program, compileSource(gl.VERTEX_SHADER, vertext));
            gl.attachShader(program, compileSource(gl.FRAGMENT_SHADER, fragment));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {  glCanvas.error = true; throw new Error('link error: ' + gl.getProgramInfoLog(program)) }
            return program;
        }
        function Shader(vertexSource, fragmentSource) {
            var vertexAttribute = null;
            var texCoordAttribute = null;
            var program = null;
            vertexSource = vertexSource || defaults.vertex;
            fragmentSource = fragmentSource || defaults.fragment;
			const float32 = new Float32Array([0]);
			const uniformLocations = new Map();
            var dirty = true;
            var useLinker = false;
            const shader = {
                setVertextSource(source) {
                    if (vertexSource !== source) {
                        vertexSource = source;
                        dirty = true;
                    }
                    return this;
                },
                setFragmentSource(source) {
                    if (fragmentSource !== source) {
                        fragmentSource = source;
                        dirty = true;
                    }
                    return this;
                },
                useLinker() {
                    useLinker = true;
                    return this;
                },
                dontUseLinker() {
                    useLinker = false;
                    return this;
                },
                getLinkedInUniforms(name, data) {     // some linked shader source code requires uniforms to be set
                    var func = shaderSource[name + "JS"];
                    if (typeof func === "function") {  return func(...data) }
                    else {  glCanvas.error = true; throw new ReferenceError("Linked in uniform function '"+name+"JS' does not exist.") }
                },
                use(vertext, fragment) {
                    if (typeof vertext === "string") { this.setVertextSource(vertext) }
                    if (typeof fragment === "string") { this.setFragmentSource(fragment) }
                    if (dirty) {
                        if (program !== null) { this.destroy() }
                        program = compileProgram(vertexSource, fragmentSource, useLinker);
                        if (gl.vertexBuffer == null) { gl.vertexBuffer = gl.createBuffer() }
                        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ]), gl.STATIC_DRAW);
                        if (gl.texCoordBuffer == null) { gl.texCoordBuffer = gl.createBuffer() }
                        gl.bindBuffer(gl.ARRAY_BUFFER, gl.texCoordBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0,  0, 1,  1, 0,  1, 1 ]), gl.STATIC_DRAW);
                        if (vertexAttribute === null) {
                            vertexAttribute = gl.getAttribLocation(program, 'vertex');
                            gl.enableVertexAttribArray(vertexAttribute);
                        }
                        if (texCoordAttribute === null) {
                            texCoordAttribute = gl.getAttribLocation(program, 'textureCoordinates');
                            gl.enableVertexAttribArray(texCoordAttribute);
                        }
						uniformLocations.clear()
                        dirty = false;
                    }
                    gl.useProgram(program);
                    return this;
                },
                destroy() {
                    gl.deleteProgram(program);
                    program = null;
                    dirty = true;
                    return this;
                },
                uniforms(uniforms) {
					var location;
                    this.use();
                    if (uniforms === undefined || uniforms === null) { return this}
                    Object.keys(uniforms).forEach(name => {
						location = uniformLocations.get(name);
						if(location === undefined) {
							location = gl.getUniformLocation(program, name);
							uniformLocations.set(name, location);
						}
                        if (location !== null) {
                            var value = uniforms[name];
                            if (typeof value === "string" && value.includes(",")) {
                                value = value.split(",").map(v => Number(v.trim()));
                            }
                            if (Array.isArray(value)) {
                                switch (value.length) {
                                    case 1: gl.uniform1fv(location, new Float32Array(value)); break;
                                    case 2: gl.uniform2fv(location, new Float32Array(value)); break;
                                    case 3: gl.uniform3fv(location, new Float32Array(value)); break;
                                    case 4: gl.uniform4fv(location, new Float32Array(value)); break;
                                    case 9: gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                                    case 16: gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                                    default:
                                         glCanvas.error = true; throw new Error('Can not load uniform array "' + name + '" of length ' + value.length +'. Use typed value {type : "uniform4fv", value : [array]} to define the type of array.');
                                }
                            } else if (!isNaN(value)) { gl.uniform1f(location, value) }
                            else if (typeof value === "object" ) {
                                if (value.type && gl[value.type]) {
                                    if (value.type[value.type.length -1] !== "v") {  gl[value.type](location, value.value) }
                                    else { gl[value.type](location, new Float32Array(value.value)) }
                                } else {   glCanvas.error = true; throw new ReferenceError('Attempted to set uniform "' + name + '" to unknown uniform type ' + value.type ) }
                            } //else {
                                // I used to throw at this point but some times this function is called twice or more
                                // throwing here would stop the second call with a valid uniform value getting set.
                                // So this can be a source of a silent fail for now.
                            //}
                        }
                    });
                    return this;
                },
                draw() {
                    this.use();
                    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
                    gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, false, 0, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, gl.texCoordBuffer);
                    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                    return this;
                },
            }
            return shader;
        }
        return Shader;
    } ());
    const Texture = (function() {
        const textureOptions = {
            linearClamped(id) {
                gl.bindTexture(gl.TEXTURE_2D, id);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            },
            nearestClamped(id) {
                gl.bindTexture(gl.TEXTURE_2D, id);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            },
        };
        function draw(texture) { // this call is unsafe (shader may not be defined)
            texture.use();
            basicShader.draw();
        }
        function Texture() {
            const FB_ERROR_TO_STR = (error) => {
                switch (error) {
                    case(gl.FRAMEBUFFER_COMPLETE):                      return "The framebuffer is ready to display.";
                    case(gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT):         return "The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.";
                    case(gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT): return "There is no attachment.";
                    case(gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS):         return "Height and width of the attachment are not the same.";
                    case(gl.FRAMEBUFFER_UNSUPPORTED):                   return "The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer.";
                    case(gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE):        return "The values of gl.RENDERBUFFER_SAMPLES are different among attached renderbuffers, or are non-zero if the attached images are a mix of renderbuffers and textures.";
                    default:  return "Unknown error value: " + error;
                }
            }
            var type = gl.UNSIGNED_BYTE;
            var format = gl.RGBA;
            var id = gl.createTexture();
            textureOptions.linearClamped(id);
            var dirty = true;
            var isBound = false;
            var boundTo = undefined;
            var width;
            var height;
            const texture = {
                width: null,
                height: null,
                isGlTexture: true,
                frameBufId: null,
                isDirty () { return dirty; },
                info () {  return {type, format, dirty, width, height} },
                quality (quality = "standard") {
                    if (quality.toLowerCase() === "high" && canUseFloats) {
                        if (ttype !== gl.FLOAT) {
                            type = gl.FLOAT;
                            dirty = true;
                        }
                    } else {
                        if (type !== gl.UNSIGNED_BYTE) {
                            type = gl.UNSIGNED_BYTE;
                            dirty = true;
                        }
                    }
                },
                fromElement(element) {
                    width = this.width = element.width || element.videoWidth;
                    height = this.height = element.height || element.videoHeight;
                    gl.bindTexture(gl.TEXTURE_2D, id);
                    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, element);
                    dirty = true;
                },
                fromData(data, width, height) {
                    this.height = height;
                    this.width = width;
                    gl.bindTexture(gl.TEXTURE_2D, id);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
                    dirty = true;
                },
                fromCanvas(canvas) {
                    height = this.height = canvas.height;
                    width = this.width = canvas.width;
                    this.quality("standard");
                    gl.bindTexture(gl.TEXTURE_2D, id);
                    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, canvas);
                    dirty = true;
                },
                getPixelData(array) {
                    this.clean();
                    if (basicShader === undefined) {  glCanvas.error = true; throw ReferenceError("Can not get pixel data as system has not yet properly initialised.") }
                    if (array === undefined) { array = new Uint8Array(width * height * 4) }
                    basicShader.draw();
                    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, array);
                    return array;
                },
                clone(texture) {  // if texture an instance of Texture clone to it
                    if (basicShader === undefined) { throw ReferenceError("Can not clone texture as system has not yet properly initialised.") }
                    if (texture && texture.isGlTexture) { texture.asFrameBuffer() }
                    else {
                        texture = Texture();
                        texture.asFrameBuffer();
                    }
                    draw(this);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    log("Cloned texture");
                    return texture;
                },
                asFrameBuffer() {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
                    this.clean();                                                  
                    if (!gl.isFramebuffer(this.frameBufId)) { this.frameBufId = gl.createFramebuffer(); }
                    if (gl.framebuffer !== this.frameBufId) { gl.framebuffer = this.frameBufId;  }
                    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);                    
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, id, 0);
                    const fbState = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                    //if (fbState !== gl.FRAMEBUFFER_COMPLETE) {  glCanvas.error = true; throw new Error('Can not render filter, framebuffer error: ' + FB_ERROR_TO_STR(fbState)) }
                    gl.viewport(0, 0, this.width, this.height);
                    if (fbState !== gl.FRAMEBUFFER_COMPLETE) {  
                        glCanvas.error = true; 
                        console.warn("Framebuffer error: " + FB_ERROR_TO_STR(fbState));
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);     
                    }
                },
                check() {
                    if (id) {
                        if (gl.isTexture(id)) { return this.frameBufId ? gl.isFramebuffer(this.frameBufId) : true; }
                    }
                    return false;
                },
                destroy () {
                    if (isBound) { log("Unbind before destroy"); this.unbind(boundTo); }
                    if (this.frameBufId) {
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
                        gl.deleteFramebuffer(this.frameBufId);
                        if (this.frameBufId === gl.framebuffer) {
                            gl.framebuffer = null;
                        }
                        gl.frameBufId = null;
                    }
                    gl.deleteTexture(id);
                    id = null;
                    dirty = true;
                    height = width = null;
                },
                isDestroied () { return id === null },
                bind (unit = 0) {
                    this.clean();
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(gl.TEXTURE_2D, id);
                    //if (boundTo !== undefined && boundTo !== unit) { log.warn("Multi bindings of texture"); }
                    //boundTo = unit;
                    //isBound = true;
                },
                unbind (unit) {
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    //isBound = false;
                    //boundTo = undefined;
                },
                clean () {
                    if (dirty || width !== this.width || height !== this.height) {
                        width = this.width;
                        height = this.height;
                        dirty = false;
                    }
                },
            }
            return texture;
        }
        return Texture;
    } ());
    const filters = {
        filterDetails: [],
        filters: {},
        availableFilters () { return this.filterDetails.map(filter => filter.name) },
        getPresetDetails (name, includeDescription) {
            const filter = this.getFilter(name);
            if (filter) {
                if (!filter.presets) { return ["Filter '"+name+"' has no presets defined."] }
                return Object.keys(filter.presets).map(pname => {
                    if (includeDescription) {
                        var desc = filter.presets[pname].description ? filter.presets[pname].description : " No description.";
                        return pname + " : " + desc;
                    }
                    return pname;
                });
            }
            return ["Could not find filter named '"+name+"'"];
        },
        getFilter (name) {
            var filterDetails = this.filterDetails.find(filter => filter.name === name);
            if (filterDetails) { return filterDetails.filter }
        },
        getFilterDefaultsArguments(name) {
            const filter = this.getFilter(name);
			return filter ? filter.arguments.map(arg => arg.range ? arg.range.def : undefined) : [];
        },
        register (name, filter) {
            if (this.filters[name] !== undefined) {  glCanvas.error = true; throw new ReferenceError("Filter already exists, can not add filter '"+name+"'") }
            if (!filter.callback) {  glCanvas.error = true; throw new ReferenceError("Filter '"+name+"' is missing the required render callback ") }
			if (typeof filter.setup === "function") { filter.setup(filter) }
            this.filters[name] = filter.callback;
            if (filter.presets && !filter.presets.Defaults && ! !filter.presets.defaults) {
                console.warn("Filter '"+name+"' requires a defaults preset to allow access to presets.");
                filter.presets = undefined;
            }
            this.filterDetails.push({name, filter});
            filter.webGLFilters = filterCanvas;
        }
    }
    /* helper functions */
    function getObjectTypeString(object) {return object.toString().replace(/\[object |\]/g, "") }
    function isObject(object) {return !(Array.isArray(object) || typeof object !== "object" || object.isGlTexture) }
    function isImage(object) {return isObject(object) && getObjectTypeString(object) === "HTMLImageElement"}
    function isCanvas(object) { return isObject(object) && (getObjectTypeString(object) === "HTMLCanvasElement" || object instanceof OffscreenCanvas) }
    function is2DContext(object) {return isObject(object) && getObjectTypeString(object) === "CanvasRenderingContext2D"}
    function createBasicShader() {var shader = Shader();return shader}
    function attachFilters() {
        filters.availableFilters().forEach(name => {
            var filter = filters.getFilter(name);
            filterCanvas[name] = filters.filters[name].bind(filter);
            if (filter.presets) {
                filterCanvas[name + "Preset"] = (function (presetName) {
                    var preset = this.presets[presetName].args;
                    if (preset === undefined) { preset = this.presets.defaults.args }
                    return this.callback(...preset);
                }).bind(filter);
            }
        });
    }
    const glCanvas = {
        error: false,
        hasError() {
            if (this.error) { this.error = false; return true; }
            return false;
        },
        canDraw() { return !this.error; },        
        frameBufs: [],
        sourceTexture: null,
        nextBuffer: 0,
        iterations: 0,
        canUseFloats: canUseFloats,
        Shader: Shader,
        filters: filters,
        clearNext: false,
        hex2RGB(hexColor, RGBOut = []) {
			if(Array.isArray(hexColor)) {
				RGBOut[0] = hexColor[0];  /* range 0 - 255 */
				RGBOut[1] = hexColor[1];
				RGBOut[2] = hexColor[2];
			} else {
				RGBOut[0] = parseInt(hexColor.substr(1, 2), 16);
				RGBOut[1] = parseInt(hexColor.substr(3, 2), 16);
				RGBOut[2] = parseInt(hexColor.substr(5, 2), 16);
			}
            return RGBOut;
        },
        isSourceTextureSet() { return this.sourceTexture !== null && this.sourceTexture !== undefined && this.sourceTexture.isGlTexture },
        clearSource() {
            if (this.isSourceTextureSet()) {
                if (this.sourceTexture.isDestroied) {
                    this.sourceTexture = null;
                    return;
                }
                console.warn("Source image will need to be deleted");
                this.sourceTexture = null;
            }
        },
        getSource(image) {
            if (this.sourceTexture) {
                if (typeof image === "string") {
                    if (image.toLowerCase() === "texture") { return this.sourceTexture }
                    else if (image.toLowerCase() === "texture copy") { return this.sourceTexture.clone() }
                    else if (image.toLowerCase() === "canvas") {
                        if (this.canDraw()) {
                            this.sourceTexture.bind();
                            flipShader.draw();
                            var can = document.createElement("canvas");
                            can.width = this.width;
                            can.height = this.height;
                            var ctx = can.getContext("2d");
                            ctx.drawImage(this.canvas, 0, 0);
                        }
                        return canvas;
                    } else  if (image.toLowerCase() === "pixeldata") {
                        this.sourceTexture.bind();
                        return this.sourceTexture.getPixelData();
                    }
                    return undefined;
                } else if (image.isGlTexture) { return this.sourceTexture.clone(image) }
                else if (isImage(image)) {
                    console.warn("Unsupported request for source image. Images as data URLs are intended for safe transport over networks, not for use within a system. If you wish to display the image on the DOM use a canvas.");
                    return image;
                } else if (isCanvas(image) || is2DContext(image)) {
                    if (this.canDraw()) {
                        var ctx = image;
                        if (isCanvas(image)) { ctx = image.getContext("2d") }
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        this.sourceTexture.bind();
                        flipShader.draw();
                        if (ctx.globalAlpha != 1 || ctx.globalCompositeOperation !== "source-over") { console.warn("getSource canvas provided may not be in the default state. Result may not be as expected"); }
                        ctx.save();
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        ctx.drawImage(this.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
                        ctx.restore();
                    }
                    return image;
                } else if (Array.isArray(image)) {
                    if (image.length !== this.sourceTexture.width * this.sourceTexture.height * 4) {
                        glCanvas.error = true; 
                        throw new RangeError("getSource can not use the provided array as the size does not match the source image.");
                    }
                    this.sourceTexture.bind();
                    return this.sourceTexture.getPixelData(image);
                }
            } else {  glCanvas.error = true; throw new RefernceError("The source image has not been set and thus not available to get.") }
            console.warn("The call to getSource could not determine the format or the return image and returned undefined.");
        },
        setSource(image) { return this.canDraw() ? this.draw(image) : this; },
        draw(image) {
            if (this.canDraw()) {
                if (!basicShader) {
                    basicShader = Shader();
                    flipShader = Shader().setFragmentSource(shaderSource.flipShader);
                }
                if (image) {
                    if (!image.isGlTexture) { this.sourceTexture.fromCanvas(image) }
                    else {
                        if (this.sourceTexture && this.sourceTexture.isGlTexture) { this.sourceTexture.destroy() }
                        this.sourceTexture = image;
                    }
                }
                if (!this.isSourceTextureSet()) {  glCanvas.error = true; throw new ReferenceError("Can not set source as the sourceTexture is missing or invalid.") }
                this.width = this.canvas.width = this.sourceTexture.width;
                this.height = this.canvas.height = this.sourceTexture.height;
                if (this.frameBufs[0].width !== this.width || this.frameBufs[0].height !== this.height) {
                    this.frameBufs[0].fromCanvas(this.canvas)
                    this.frameBufs[1].fromCanvas(this.canvas)
                }
                gl.viewport(0, 0, this.width, this.height);
                this.sourceTexture.bind();
                basicShader.draw();
                shown = true;
                this.iterations = 0;
            }
            return this;
        },
        clearBufferBeforDraw() { this.clearNext = true },
        filter(shader, uniforms, destination, sources) {
            if (shader === undefined || shader === null) { glCanvas.error = true;  throw new ReferenceError("Filter requires a shader.") }
            if (this.sourceTexture === undefined) { }
            if (shown) { this.iterations = 0 } else { this.iterations += 1 }
            if (destination && destination.isGlTexture) { destination.asFrameBuffer() }
            else {
                this.nextBuffer = (this.nextBuffer + 1) % 2; 
                this.frameBufs[this.nextBuffer].asFrameBuffer();
            }
            if (this.canDraw()) {
                shader.uniforms(uniforms);
                if (sources) {
                    if (Array.isArray(sources)) {
                        sources.forEach((source, i) => { if (source.isGlTexture) { source.bind(i + 1) } });
                    } else if (sources.isGlTexture) { sources.bind(1) }
                }
                if (this.clearNext) {
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.clearColor(0.0, 0.0, 0.0, 0.0);
                    this.clearNext = false;
                }
                shader.draw();
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                this.frameBufs[this.nextBuffer].bind();
            }
            shown = false;
        },
        fromSource() {
            this.nextBuffer = 0;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);  // remove any frame buffer binding that may still be active
            this.sourceTexture.bind();
            return this;
        },
        copyBufferTo(texture) {  // draws the last rendered to frame buffer to texture
            if (this.canDraw()) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); // remove any frame buffer binding that may still be active
                this.frameBufs[this.nextBuffer].bind();
                texture.asFrameBuffer();
                basicShader.draw();
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        },
        show() {
            if (this.canDraw()) {
                flipShader.draw();
                this.nextBuffer = 0;
                this.sourceTexture.bind();
                shown = true;
            }
            return this;
        },
        completed() {
            if (this.canDraw()) {
                if (!shown) {
                    flipShader.draw();
                    shown = true;
                }
                this.draw(this.canvas);
                this.sourceTexture.bind();
            }
            return this;
        },
		createEmptyTexture() { return Texture() },
        createTexture(image, width, height) {
            var texture = Texture();
            if (image === undefined) { texture.fromCanvas(this.canvas) }
            else if (Array.isArray(image)) {
                if (!width || !height) {  glCanvas.error = true; throw new ReferenceError("Can not create texture from array without width and or height") }
                if (width * height * 4 !== image.length && width * height !== image.length) {  glCanvas.error = true; throw new ReferenceError("Can not create texture from array as width and height do not match array size") }
                texture.fromData(image, width, height);
            } else if (image.isGlTexture) { image.clone(texture) }
            else if (isImage(image)) {     texture.fromElement(image) }
            else if (isCanvas(image)) {    texture.fromCanvas(image) }
            else if (is2DContext(image)) { texture.fromCanvas(image.canvas) }
            return texture;
        },
        create() {
            this.canvas = canvas;
            attachFilters();
            this.frameBufs[0] = this.createTexture(canvas);
            this.frameBufs[1] = this.createTexture(canvas);
            return this;
        },
        checkFrameBuffer(idx) {
            if (this.frameBufs[idx]) {
                if (!this.frameBufs[idx].check()) {
                    log.warn("Buf[idx] failed check")
                    this.frameBufs[idx].destroy();
                    this.frameBufs[idx] = undefined;
                }
            } 
            if (!this.frameBufs[idx]) {
                log.warn("Buf[idx] is empty");
                this.frameBufs[idx]  = this.createTexture(canvas);
            }
        }
    }
    filterCanvas = glCanvas.create();
    glCanvas.create = undefined; // only used once so remove it
    return {
        filters: filters,
        create() {
            attachFilters();
            return filterCanvas;
        }
    };
} ());