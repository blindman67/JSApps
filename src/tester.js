"use strict";


const glUtils = (() => {
	const OPTIONS = {premultipliedAlpha: false, antialias: false, alpha: true };
	const es3Directive = "#version 300 es\n";
	var canvas, gl;
	function compile(source, type) {
		const shader = gl.createShader(type)
		gl.shaderSource(shader, es3Directive + source);
		gl.compileShader(shader);	
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error("glUtils Error compliling shader: \n" + gl.getShaderInfoLog(shader)));
			return;
		}		
		return shader;
	}
	const indices = () => new Uint8Array([0, 1, 2, 0, 2, 3]);
	const verts = () => new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);	
	const API = {
		set canvas(can) { canvas = can },
		createContext(options = {}) {
			if (canvas) {
				gl = API.canvas.getContext("webgl2", {...OPTIONS, ...options);
			} else {
				console.error("glUtils canvas not defined can not create webGL2 context");
			}			
		},
		createProgram({vertex, fragment, attributes, uniforms}){
			if (gl) {
				const program = gl.createProgram();
				const vShader = compile(vertex, gl.VERTEX_SHADER);
				const fShader = compile(fragment, gl.VERTEX_SHADER);
				if (!vShader || !fShader) { return }
				gl.attachShader(program, vShader);
				gl.attachShader(program, fShader);	
				gl.linkProgram(program);
				if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { 
					console.error(n"Link error: " + gl.getProgramInfoLog(program));
					return;
				}	
				for(const name of Object.keys(attributes)) {
					attributes[name] = gl.getAttribLocation(program, name)
				}
				for(const name of Object.keys(uniforms)) {
					uniforms[name] = gl.getUniformLocation(program, name)
				}
				return program;
			}  else {
				console.error("glUtils webGL context requiered to create programs");
			}				
			
		},
		createBuffers(shader) {
			if (gl) {
				gl.bindVertexArray(shader.vertexBuffer = gl.createVertexArray());
				for(const buf of shader.buffers) {
					if(buf.attribute) {
						if(shader.attributes[buf.attribute]){
							gl.vertexAttribPointer(
								shader.attributes[buf.attribute], 
								buf.size, 
								gl[buf.type], 
								buf.normalize !== undefined ? buf.normalize : false, 
								buf.stride !== undefined ? buf.stride : 0, 
								buf.offset !== undefined ? buf.offset : 0, 
							);
						} else {
							console.warn("Vertex attribute '" + buf.attribute + "' has no location!");
						}
					} else if(buf.data) {
						gl.bindBuffer(gl[buf.type],  gl.createBuffer());
						gl.bufferData(gl[buf.type], buf.data, gl[buf.use]);		
					}
				}					
				
			}
			
			
		},
		renderer: {
			frameStart() {
				if (gl) {
					gl.viewport(0, 0, canvas.width, canvas.height);
					gl.clearColor(0, 0, 0, 0);
					gl.clear(gl.COLOR_BUFFER_BIT);	
					return true;
				}
			},
			use(shader){
				if (gl) {
					gl.useProgram(shader.program);
					gl.bindVertexArray(shader.vertexBuffer);
				}
				
			}
		}			

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  // Pass in the canvas resolution so we can convert from
  // pixels to clipspace in the shader
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  // Tell the shader to get the texture from texture unit 0
  gl.uniform1i(imageLocation, 0);

  // Bind the position buffer so gl.bufferData that will be called
  // in setRectangle puts data in the position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, image.width, image.height);

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);				
			}
		},
		
		
	};
	return API;
	
	
})();

const vertex = `
in vec2 position;
out vec2 texCoord;
void main() {
  texCoord = position * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1,1);
}
`;

const fragment = `
precision mediump float;
uniform sampler2D video;
in vec2 texCoord;
out vec4 pixelOut;
void main() {
	vec4 pixel = texture(video, v_texCoord);
	pixelOut = vec4(pixel.rgb, pixel.b);
}
`;

const alphaVideo = {
	shader: {
		vertex,
		fragment,
		uniforms: {
			video: null,
		},
		attributes: {
			position: null,
		},
		buffers: [
			{type: "ELEMENT_ARRAY_BUFFER", use: "STATIC_DRAW", data: new Uint8Array([0, 1, 2, 0, 2, 3])},
			{type: "ARRAY_BUFFER",         use: "STATIC_DRAW", data: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1])},	
			{attribute: "position", size: 2, type: "FLOAT"}
		
		],
		draw(gl){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);		
			
			gl.drawArrays(gl.TRIANGLES, 0, 6);	
			
		}
	},
}
const video = document.createElement("video");
video.src = "???";
video.addEventListener("canPlay",() => {
	vidReady = true;
});
var ready = false;
var vidReady = false;
glUtils.canvas = document.getElementById("webGlCanvas");
glUtils.createContext();
alphaVideo.shader.program = glUtils.createProgram(alphaVideo.shader);
if (alphaVideo.shader.program) {
	glUtils.createBuffers(alphaVideo.shader);
	ready = true;
	requestAnimationFrame(mainLoop);
}
	
function mainLoop(time) {
	
	if (ready && vidReady) {
		if (glUtils.renderer.frameStart()) {
		}
		
	}
	requestAnimationFrame(mainLoop);
}	
	

function render(image) {

  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromSources(gl,
      [vertexShaderSource, fragmentShaderSource]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "pos");
  var texCoordAttributeLocation = gl.getAttribLocation(program, "texCoord");
  var imageLocation = gl.getUniformLocation(program, "video");
  var vertArray = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer and put a single pixel space rectangle in
  // it (2 triangles)
  var positionBuffer = gl.createBuffer();

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // provide texture coordinates for the rectangle.
  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      texCoordAttributeLocation, size, type, normalize, stride, offset);

  // Create a texture.
  var texture = gl.createTexture();

  // make unit 0 the active texture uint
  // (ie, the unit all other texture commands will affect
  gl.activeTexture(gl.TEXTURE0 + 0);

  // Bind it to texture unit 0' 2D bind point
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we don't need mips and so we're not filtering
  // and we don't repeat at the edges
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  var mipLevel = 0;               // the largest mip
  var internalFormat = gl.RGBA;   // format we want in the texture
  var srcFormat = gl.RGBA;        // format of data we are supplying
  var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  // Pass in the canvas resolution so we can convert from
  // pixels to clipspace in the shader
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  // Tell the shader to get the texture from texture unit 0
  gl.uniform1i(imageLocation, 0);

  // Bind the position buffer so gl.bufferData that will be called
  // in setRectangle puts data in the position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, image.width, image.height);

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}