/* Standalone webGL utilities copyright 2020 blindmanmag4@gmail.com */
const F32Array = data => new Float32Array(data);
const UI16Array = data => new Uint16Array(data);
const UI8Array = data => new Uint8Array(data);
const glUtils = (()=>{
    var gl;
    const glConst = name => isNaN(name) ? gl[name] : name;
	const locTypes = {
		U(prg, name) { return gl.getUniformLocation(prg, name) },
		T(prg, name) { return {loc: gl.getUniformLocation(prg, name), isSampler: true} },
		A(prg, name) { return gl.getAttribLocation(prg, name) },
	};
    const utils = {
        texture(gl, image, {targetType = gl.TEXTURE_2D, min = gl.LINEAR, mag = gl.LINEAR, wrapX = gl.REPEAT, wrapY = gl.REPEAT, wrapZ = gl.REPEAT} = {}) {
            const texture = gl.createTexture();
            texture.target_type = target = glConst(targetType);
            gl.bindTexture(target, texture);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, glConst(min));
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, glConst(mag));
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, glConst(wrapX));
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, glConst(wrapY));
            gl.texParameteri(target, gl.TEXTURE_WRAP_R, glConst(wrapZ));
            image && gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            return texture;
        },
        bindTexture(texture, unit) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(texture.target_type, texture);
        },
		delete({program, buffers, textures}) {
			if (program) {
				gl.getAttachedShaders(program).forEach(shader => gl.deleteShader(shader));
				gl.deleteProgram(program);
			}
			if (buffers) {
				gl.deleteVertexArray(buffers.vertexBuffer);
				delete buffers.vertexBuffer;
				for (const buf of Object.values(buffers)) {
					buf.glBuffer && gl.deleteBuffer(buf.glBuffer);
					buf.data && (buf.data = undefined);
				}
			}
			if (textures) {
				for (const texture of textures) { gl.deleteTexture(texture) }
			}
		},
        getLocations(prg, ...names) {
            const locs = {};
            for (const desc of names) {
                const [type, name] = desc.split("_");
                locs[name] = locTypes[type](prg, name);
            }
            return locs;
        },
    	showErrorLine(errors, src) {
            console.log(src)
            errors = errors.split("\n");
            var lines = "";
            for (const error of errors) {
                const  dat = error.split(":");
                if (typeof dat[2] === "string") {
                    const line = dat[2].trim();
                    const column = dat[1].trim();
                    if (!isNaN(line) && !isNaN(column)) {
                        lines += "\n" + src.split("\n") [Number(line) -1] + "\n";
                        lines += "^".padStart(Number(column), " ") + " " + error;
                        console.warn(line);
                        lines += "\n";
                    }
                } else if(dat.length === 2) { lines += dat[1] + "\n" }
            }
            return lines;
        },
        compileShader(src, type, shader = gl.createShader(type)) {
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  throw new Error("WebGL shader compile error\n" + glUtils.showErrorLine(gl.getShaderInfoLog(shader), src) ) }
            return shader;
        },
        createProgram(vSrc, fSrc, locDesc, program = gl.createProgram()) {
            gl.attachShader(program, API.compileShader(vSrc, gl.VERTEX_SHADER));
            gl.attachShader(program, API.compileShader(fSrc, gl.FRAGMENT_SHADER));
            gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { throw new Error("WebGL program link error\n" + gl.getProgramInfoLog(program)) }
            gl.useProgram(program);
            const locations =  API.getLocations(program, ...locDesc);
            return [program, locations];
        },
        initBuffers(bufferDesc, locations, vertexBuffer = gl.createVertexArray()) {
            gl.bindVertexArray(bufferDesc.vertexBuffer = vertexBuffer);
            for (const [name, d] of Object.entries(bufferDesc)) {
                if (d.data) {
					gl.bindBuffer(d.type = glConst(d.type), d.glBuffer = gl.createBuffer());
					gl.bufferData(d.type, d.data, d.use = glConst(d.use));
                }
                if (locations[name] !== undefined) { API.initVertexAttribute(locations[name], d) }
            }
            return bufferDesc;
        },
        initVertexAttribute(loc, {size, offset = 0, stride = 0, dataType = gl.FLOAT, divisor, normalize = false}) {
			if (loc === -1) { return }
            gl.enableVertexAttribArray(loc);
            if (dataType === gl.UNSIGNED_INT) { gl.vertexAttribIPointer(loc, size, dataType, stride, offset) }
            else { gl.vertexAttribPointer(loc, size, dataType, normalize, stride, offset) }
            divisor && gl.vertexAttribDivisor(loc, divisor);
        },
        updateCanvasSize(useFixed_OR_width = true, height) {
			if (useFixed_OR_width === true) {
                if (gl.canvas.width !== API.width || canvas.height !== API.height) {
                    gl.canvas.width = API.width;
                    gl.canvas.height = API.height;
					gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
                    return true;
                }
            } else if (!useFixed_OR_width && (gl.canvas.width !== innerWidth || gl.canvas.height !== innerHeight)) {
                API.width = gl.canvas.width = innerWidth;
                API.height = gl.canvas.height = innerHeight;
				gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
                return true;
            } else if (useFixed_OR_width !== false && (useFixed_OR_width !== API.width || (height !== undefined && height !== API.height))) {
                API.width = gl.canvas.width = useFixed_OR_width;
                API.height = gl.canvas.height = height;
				 gl.viewport(0, 0, useFixed_OR_width, height)
				return true;
			}
        },
		sizeView(size = gl.canvas) { gl.viewport(0, 0, size.width, size.height) },
		ready: true,
        /* NOTE these become standard properties (Not getters) when copied to API */
        get bufferDescDefault() { return {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW} },
        get width() { return gl.canvas.width },
        get height() { return gl.canvas.height },
		get buffers() { return {
				indices: { type: gl.ELEMENT_ARRAY_BUFFER, use: gl.STATIC_DRAW, dataType: gl.UNSIGNED_BYTE, data: API.quadIndices},
				verts: {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW, size: 2, data: API.quadVerts},
				sprVerts: {type: gl.ARRAY_BUFFER, use: gl.STATIC_DRAW, size: 2, data: API.sprVerts},

			};
		},
        get blendFlags() { return [gl.ZERO, gl.ONE, gl.SRC_COLOR, gl.DST_COLOR, gl.SRC_ALPHA, gl.DST_ALPHA, gl.CONSTANT_COLOR, gl.CONSTANT_ALPHA, gl.SRC_ALPHA_SATURATE, gl.ONE_MINUS_SRC_COLOR, gl.ONE_MINUS_DST_COLOR,  gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE_MINUS_CONSTANT_COLOR, gl.ONE_MINUS_CONSTANT_ALPHA] },
    };
    const API = {
        set context(context) {
			if (gl) { gl = context }
			else {
				gl = context;
				Object.assign(API, utils);
			}
        },
        get context() { return gl },
		createContext(canvas, options = {}) {
            const context = canvas.getContext("webgl2", {premultipliedAlpha: false, antialias: false, alpha: false, ...options})
            return context ? this.context = context : null;
        },
		quadIndices: UI8Array([0, 1, 2, 0, 2, 3]),
		quadVerts: F32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
		sprVerts: F32Array([0,0, 1,0, 1,1, 0,1]),
        colors: {
            int32(cArr, int32) {
                cArr[0] = ((int32 >> 24) & 0xFF) / 255;
                cArr[1] = ((int32 >> 16) & 0xFF) / 255;
                cArr[2] = ((int32 >> 8 ) & 0xFF) / 255;
                cArr[3] = (int32 & 0xFF) / 255;
				return cArr;
            },
            RGBA(cArr, rgba) {
                cArr[0] = rgba.r !== undefined ? rgba.r : cArr[0];
                cArr[1] = rgba.g !== undefined ? rgba.g : cArr[1];
                cArr[2] = rgba.b !== undefined ? rgba.b : cArr[2];
                cArr[3] = rgba.a !== undefined ? rgba.a : cArr[3];
				return cArr;
            },
            RGBAOffset(cArr, rgba, scale) {
                cArr[0] = rgba.r !== undefined ? (rgba.r - 0.5) * scale + 1 : cArr[0];
                cArr[1] = rgba.g !== undefined ? (rgba.g - 0.5) * scale + 1 : cArr[1];
                cArr[2] = rgba.b !== undefined ? (rgba.b - 0.5) * scale + 1 : cArr[2];
                cArr[3] = rgba.a !== undefined ? (rgba.a - 0.5) * scale + 1 : cArr[3];
				return cArr;
            },
        },
    };
    return API;
})();

function Colors() {
	const named = {};
	const API = {
		named,
		add(name, color) { return named[name] = isNaN(color) ? glUtils.colors.RGBA(F32Array(4), color) : glUtils.colors.int32(F32Array(4), color) },
		delete(name) { delete named[name] },
		get names() { return Object.keys(named) },

	};
	return API;
}


export {glUtils, Colors, F32Array, UI8Array}

