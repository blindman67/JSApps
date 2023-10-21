 /* renderer Static V0.91.1 Beta */
 // V0.9 -> V0.91 removed dependency on glUtils
 // V0.91 -> V0.91.1 Updated for standalone moduals
 
const renderer = (()=> {
	const shaders = {};
	const frames = {};
	var clearFlags, dest, dirty, gl, canvas, bgRGBA = {r: 0, g: 0, b: 0, a: 0};
	const OPTIONS = {premultipliedAlpha: false, antialias: false, alpha: false }
	function cleanViewport() {
		if (dest) {
			API.width = gl.viewport.width = dest.texture.width;
			API.height = gl.viewport.height = dest.texture.height;
		} else {
			API.width = gl.viewport.width = canvas.width;
			API.height = gl.viewport.height = canvas.height;
		}
		gl.viewport(0, 0, API.width, API.height);			
		API.aspect = gl.viewport.aspect = API.height / API.width;
		API.diagonal = (API.width * API.width + API.height * API.height) ** 0.5;
		dirty = false;
	}
	const API = {
		canvas: null,
		create(canvasElement, options = {}) {
			options = {...OPTIONS, ...options};
			API.canvas = canvas = canvasElement;
			gl = canvas.getContext("webgl2", options);
			dirty = true;
			clearFlags = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
		},
		addShader(shader) {
			shader.init(gl, API);
			return shader;
		},
		get context() { return gl },
		get backgroundColor() { return bgRGBA },
		set backgroundColor(rgba) {
			bgRGBA = rgba;
			gl.clearColor(bgRGBA.r, bgRGBA.g, bgRGBA.b, bgRGBA.a);
		},
		fullPage() { // canvas should be position absolute and top left at 0px
			if (innerWidth !== canvas.width || innerHeight !== canvas.height) {
				API.width = canvas.width = innerWidth;
				API.height = canvas.height = innerHeight;
				dirty = true;
			}		
			return dirty;
		},
		resized() {
			cleanViewport();
			gl.clearColor(bgRGBA.r, bgRGBA.g, bgRGBA.b, bgRGBA.a);
		},
		getDestByName(name) { return frames[name] },		
		createDest(name, texture, idx = 0) { return frames[name] = { name, texture, attach: isNaN(idx) ? gl[idx.toUpperCase() + "_ATTACHMENT"] : gl["COLOR_ATTACHMENT" + idx], buf: gl.createFramebuffer() } }, // idx 0 - 15 or DEPTH, STENCIL, DEPTH_STENCIL
		attachTexture() { gl.framebufferTexture2D(gl.FRAMEBUFFER, dest.attach, dest.texture.target, dest.texture.tex, dest.texture.level) },
		get dest() { return dest },
		set dest(name) {
			dest = frames[name];			
			if (dest) { 
				gl.bindFramebuffer(gl.FRAMEBUFFER, dest.buf); 
				dest.texture.isGlTexture && API.attachTexture();
			} else { gl.bindFramebuffer(gl.FRAMEBUFFER, null) }
			dirty = true;
		},
		clear() { 
		    if (dirty) { cleanViewport() }
			gl.clear(clearFlags);
		},
		clearDepth() { 
            if (dirty) { cleanViewport() }
			gl.clear(gl.DEPTH_BUFFER_BIT);
		},
		clearColor() { 
            if (dirty) { cleanViewport() }
			gl.clear(gl.COLOR_BUFFER_BIT);
		},
		blendModes: {
			off() { gl.disable(gl.BLEND)  },
			lighten() { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE) },
			standard() { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA) },
		},
		depthModes: {
			off() { gl.disable(gl.DEPTH_TEST); clearFlags &= ~gl.DEPTH_BUFFER_BIT  },
			lessEqual() { (gl.enable(gl.DEPTH_TEST), gl.depthFunc(gl.LEQUAL)); clearFlags |= gl.DEPTH_BUFFER_BIT },
		},		
	};
	return API;
})();
export {renderer};



