/* texture V0.93 Beta */
function textureSetup(gl, texture, target, min, mag, wraps, wrapt = wraps) {
	gl.bindTexture(target, texture);
	gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, min);
	gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, mag);
	gl.texParameteri(target, gl.TEXTURE_WRAP_S, wraps);
	gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrapt);	
};
function Texture(gl, {
		width = null,
		height = null,
	    type = "TEXTURE_2D",
		data = "UNSIGNED_BYTE",
	    format = "RGBA",
		min = "LINEAR", 
		max = "LINEAR", 
		wrapX = "CLAMP_TO_EDGE", 
		wrapY = "CLAMP_TO_EDGE",
		level = 0,
		border = 0,
		image = null,
		mipMap = false,
	} = {}) {
	var target = gl[type], texture = gl.createTexture(), hasPixels = false;
	textureSetup(gl, texture, target, gl[min], gl[max], gl[wrapX], gl[wrapY]);
	const API = {
		width,
		height,
		format: gl[format],
		target,
		type: gl[data],
		level,
		internalFormat: gl[format],		
		tex: texture,
		isGlTexture: true,
		fromImage(element, subTarget = target) {
			API.width = element.naturalWidth || element.width || element.videoWidth;
			API.height = element.naturalHeight || element.height || element.videoHeight;
			gl.bindTexture(target, texture);
			gl.texImage2D(subTarget, API.level, API.format, API.format, API.type, element);
			mipMap && gl.generateMipmap(subTarget);
			hasPixels = true;
			return API;
		},
		fromArray(data) {
			gl.bindTexture(target, texture);
			gl.texImage2D(target, API.level, API.internalFormat, API.width ? API.width : gl.canvas.width, API.height ? API.height : gl.canvas.height, border, API.format, API.type, data);
			mipMap && gl.generateMipmap(target);
			hasPixels = true;
			return API;
		},
		copyFrame() {},
		toFrame() {
			!hasPixels && API.fromArray(null);
			!API.frameBuffer && (API.frameBuffer = gl.createFramebuffer());	
			return API;
		},
		bindFrame(unit = 0, sizer) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, API.frameBuffer); 
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + unit, target, texture, API.level);	
			sizer && sizer(API);
			return API;
		},
		bind (unit = 0) {
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(target, texture);
			return API;
		},
		unbindFrame() { gl.bindFramebuffer(gl.FRAMEBUFFER, null) },
		unbind(unit) {
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(target, null);
			return API;
		},
		destroy() {
			API.frameBuffer && gl.deleteFrameBuffer(API.frameBuffer);
			gl.deleteTexture(texture);
			API.frameBuffer = API.tex = texture = undefined;
		},
		isDestroied() { return texture === null },
	}
	if (image) { API.fromImage(image) }
	return API;
}

function TextureCube(gl, faces) {
	const texture = Texture(gl, {type: "TEXTURE_CUBE_MAP"})
		.fromImage(faces.front, gl.TEXTURE_CUBE_MAP_POSITIVE_Z)
		.fromImage(faces.back, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z)
		.fromImage(faces.right, gl.TEXTURE_CUBE_MAP_POSITIVE_X)
		.fromImage(faces.left,  gl.TEXTURE_CUBE_MAP_NEGATIVE_X)
		.fromImage(faces.above, gl.TEXTURE_CUBE_MAP_POSITIVE_Y)
		.fromImage(faces.under,  gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
    texture.isTextureCube = true;
	return texture;
}


function SpriteSheet(sprites, texture, isPadded = true) {
	this.spriteCount = sprites.length;
	this.size = new Float32Array([texture.width, texture.height]);
	const l = this.layout = new Uint16Array(this.spriteCount * 4);
	const posPad = isPadded ? 1 : 0;
	const sizePad = isPadded ? 2 : 0;
	var maxW = 0, maxH = 0, i = 0;
    for (const spr of sprites) { 
        l[i++] = spr.x + posPad;
        l[i++] = spr.y + posPad;
        maxW = Math.max(maxW, l[i++] = (spr.w - sizePad));
        maxH = Math.max(maxH, l[i++] = (spr.h - sizePad));
    }
    this.layout32 = new Uint32Array(this.layout.buffer);
	this.maxDiagonal = (maxW * maxW + maxH * maxH) ** 0.5; 	
	texture.spriteSheet = this;
	return this;
}


export {Texture, TextureCube, SpriteSheet};
