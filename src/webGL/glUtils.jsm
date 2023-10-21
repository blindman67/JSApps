/* GL utils */

import {} from "../utils/MathExtensions.jsm";

const byteClamp4 = new Uint8ClampedArray(4);
const byte4 = new Uint8Array(4);
const int32_byteClamp4 = new Uint32Array(byteClamp4.buffer);
const int32_byte4 = new Uint32Array(byte4.buffer);
function cleanSource(gl,name, source, type) {
	var show = false;
	name = name.replace(/fragment|vertex/gi,"").trim() + " " + (type === gl.VERTEX_SHADER ? "Vertex" : "Fragment") + " Shader";
	source = source.replace(/^(\s*)#NAME;.*?\n/m, "$1/* " + name[0].toUpperCase() + name.slice(1) + " */\n");
	source = source.replace(/\t/g, "    ")
		.replace(/^    /gm, "")
		.replace(/\s*$/gm, "");
	if(/^\s*#SHOW_IN_CONSOLE;.*?\n/m.test(source)) {
		source = source.replace(/^\s*#SHOW_IN_CONSOLE;.*?\n/m, "");
		show = true;
	}
	return [source, show];
}
const glUtils = {
	randRGBAInt32(r= 0, g = 0, b = 0, a = 0, R = 255, G = 255, B = 255, A = 255) {
		byteClamp4[0] = Math.randI(r, R);
		byteClamp4[1] = Math.randI(g, G);
		byteClamp4[2] = Math.randI(b, B);
		byteClamp4[3] = Math.randI(a, A);
		return int32_byteClamp4[0];
	},		
	randRGBInt32(r= 0, g = 0, b = 0, R = 255, G = 255, B = 255, a = 255) {
		byteClamp4[0] = Math.randI(r, R);
		byteClamp4[1] = Math.randI(g, G);
		byteClamp4[2] = Math.randI(b, B);
		byteClamp4[3] = a;
		return int32_byteClamp4[0];
	},		
	RGBA2Int32Clamped(...channels) {
		byteClamp4[0] = channels[0];
		byteClamp4[1] = channels[1];
		byteClamp4[2] = channels[2];
		byteClamp4[3] = channels[3];
		return int32_byteClamp4[0];
	},
	RGBA2Int32(...channels) {
		byteClamp4[0] = channels[0];
		byteClamp4[1] = channels[1];
		byteClamp4[2] = channels[2];
		byteClamp4[3] = channels[3];
		return int32_byte4[0];
	},
	showSrc: false,
	showSrcOnError: true,   
	showErrorLine(errors, source) { 
		errors = errors.split("\n");
		var lines = "";
		for (const error of errors) {
			const  dat = error.split(":");
			if (typeof dat[2] === "string") {
				const line = dat[2].trim();
				const column = dat[1].trim();
				if (!isNaN(line) && !isNaN(column)) {
					lines += "\n" + source.split("\n") [Number(line) -1] + "\n";
					lines += "^".padStart(Number(column), " ") + " " + error;
					console.warn(line);
					lines += "\n";
				}
			}
		}
		return lines;
	},
	compileShader(gl, name, source, type) { 
	    var show;
		[source, show] = cleanSource(gl, name, source, type);
		if (show || glUtils.showSrc){ console.log(("\n\n// " + name + " ").padEnd(100,"=") + "\n" + source) }
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			if (glUtils.showSrcOnError && (!glUtils.showSrc && !show)) { console.log(source) }
			const error = gl.getShaderInfoLog(shader);
			throw new Error(name + " shader:\n" + glUtils.showErrorLine(error, source));
		}	
		return shader;
	},  
	linkProgram(gl, name, program) {
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { throw new Error(name + " link error: " + gl.getProgramInfoLog(program)) }	
	},
	createProgram(gl, vSrc, fSrc, name = "") {
		const program = gl.createProgram();
		gl.attachShader(program, glUtils.compileShader(gl, name + " vertex", vSrc, gl.VERTEX_SHADER));
		gl.attachShader(program, glUtils.compileShader(gl, name + " fragment", fSrc, gl.FRAGMENT_SHADER));
		glUtils.linkProgram(gl, name, program);	
		return program;
	},
	attBuf(type, data, use, name) { return {type, data, use, name, isBuf: true} },
	attArrayPtr(name, length, type, normalized = false, stride, divisor = 1) { return {name, length, type, normalized, stride, divisor, isArr: true, isPtr: true} },
	attArray(name, length, type = "FLOAT", normalized = false) { return {name, length, type, normalized, isArr: true} },
	setupAttributes(gl, attributes, program, stride, buffers){
		const sizes = {
			[gl.FLOAT]: 4, [gl.INT]: 4, [gl.UNSIGNED_INT]: 4,
			[gl.BYTE]: 1, [gl.UNSIGNED_BYTE]: 1,
			[gl.SHORT]: 2, [gl.UNSIGNED_SHORT]: 2,
		};			
		var offset = 0;
		const named = {};
		for (const att of attributes) {
			if (att.isArr) {
				if (att.type && typeof att.type === "string" && gl[att.type]) { att.type = gl[att.type] }
				named[att.name] = att;
				const loc = att.location = gl.getAttribLocation(program, att.name);
				gl.enableVertexAttribArray(loc);
				if (att.isPtr) {
					att.offset = offset;
					att.stride = att.stride ? att.stride : stride;
					if (att.type === gl.FLOAT || att.normalized) {
						gl.vertexAttribPointer(loc, att.length, att.type, att.normalized, att.stride, offset);
					} else {
						gl.vertexAttribIPointer(loc, att.length, att.type, att.stride, offset);
					}
					gl.vertexAttribDivisor(loc, att.divisor);
					offset += att.length * sizes[att.type];
				} else {
					gl.vertexAttribPointer(loc, att.length, att.type, att.normalized, 0, 0);
				}
			} else if (att.isBuf) {
				if (att.name) {gl.bindBuffer(att.type, buffers[att.name] = gl.createBuffer()) }
				else { gl.bindBuffer(att.type,  gl.createBuffer()) }
				gl.bufferData(att.type, att.data, att.use);		
			}				
		}
		return named;
	},	
	getLocations(gl, program, ...names) {
		const locations = {};
		for(const name of names) { 
			locations[name] = gl.getUniformLocation(program, name);
			if (locations[name] === null) { console.warn("Failed to locate uniform `" + name + "`") }
		}	
		return locations;
	},
};


export {glUtils};





