function $(com, props) {
	const elementAssign = (el, props) => {
		if (props.style) {
			const style = props.style;
			delete props.style;
			Object.assign(el, props);
			Object.assign(el.style, style);
			props.style = style;
			return el;
		}
		return Object.assign(el, props);
	}
	if ($.isStr(com)) {
		if (com[0] === "?") { // query
		    const qry = document.querySelectorAll(com.slice(1).trim());
			if (isNaN(props)) { return [...qry] }
			props = Number(props);
			if (Number(props) < 0) { props = qry.length - props }
			props = props < 0 ? 0 : props > qry.length - 1 ? qry.length - 1 : props;
			return qry[prop]
		}
		com = com.toLowerCase();
		com = com === "text" ? document.createTextNode(props) : document.createElement(com);
	}
	return $.isObj(props) ? elementAssign(com, props) : com;
}
function $$(el, ...sibs) {
	var idx = 0, where = 1;
	while (idx < sibs.length) {
		const sib = sibs[idx++];
		if ($.isNum(sib)) { where = Number(sib) }
		else if ($.isStr(sib)) { sibs[--idx] = $("text", sib) }
		else if (where <= 0) { el.insertBefore(sib, el.firstChild) }
		else { el.appendChild(sib) }
	}
	return el;
}
$.isObj = val => typeof val === "object" && !Array.isArray(val) && val !== null;
$.isNum = val => !isNaN(val);
$.isStr = val => typeof val === "string";
$$.INSERT = 0;
$$.APPEND = 1;




function gemShader(options){
    const vertSrc = `#version 300 es
        in vec3 verts;
		in vec3 faceNormal;
        uniform mat4 view;   
        uniform mat4 world;
		out vec3 eye;  
		out vec3 norm;
        void main() {
			norm = world * faceNormal;
			eye = world * verts;
            gl_Position =  view *  world * vec4(verts, 0.2);
           
        }`;
    const fragSrc = `#version 300 es
        precision mediump float;
		uniform samplerCube refl
		uniform samplerCube refr;
        uniform vec3 colorSurface;
        uniform vec3 color;
        in vec3 eye;
        in vec3 norm;
        out vec4 pixel;
        void main() {
			pixel = texture(refr, refract()) * vec4(color, 1) + texture(refl, reflect(eye, norm)) * vec4(colorSurface, 1);
        }`; 

    const locationDescriptions = ["A_verts", "A_faceNormal", "U_color", "U_colorSurface", "U_view", "U_world", "U_refl", "U_refr"];
    const locs = {};
    const reflectCol = new Float32Array([1,1,1]);
    const refractCol = new Float32Array([1,1,1]);
    var gl, program, vertexBuffer, bufferReference, dirty, colDirty elementCount, elementDataType;
    const API = {
        init(gl_context, textures, mesh, projection, camera) {
            gl = gl_context;
            program = createProgram(vertSrc, fragSrc);
            Object.assign(locs, getLocations(program, ...locationDescriptions));
            vertexBuffer = gl.createVertexArray();
            initBuffers(mesh, locs, vertexBuffer);
            elementCount = mesh.indices.data.length;
            elementDataType = isNaN(mesh.indices.dataType) ? gl[mesh.indices.dataType] : mesh.indices.dataType;
            this.projection = projection;
            this.camera = camera;
			this.reflectCol = new Float32Array([1,1,1]);
			this.refractCol = new Float32Array([1,1,1]);
            if (!options.fixed) {  this.world = new Mat4().useFloat32Array()  }
            this.soil();
        },
        soil() { dirty = colDirty = true },
        wash() { dirty = colDirty = false },
        get isDirty() { return dirty || colDirty  },
		set reflectColor(rgb) {
			reflectCol[0] = rgb.r;
			reflectCol[1] = rgb.g;
			reflectCol[2] = rgb.b;
			colDirty = true;
		},
		set refractColor(rgb) {
			refractCol[0] = rgb.r;
			refractCol[1] = rgb.g;
			refractCol[2] = rgb.b;
			colDirty = true;
		},
        draw(dirty) {
            if (this.isDirty || dirty) {
				textures.reflect.bind(0);
				textures.refract.bind(1);
                gl.uniformMatrix4fv(locs.view, false, this.projection.viewMatrix);
                gl.uniformMatrix4fv(locs.world, false, this.world.m);
				if (colDirty) {
					 gl.uniformMatrix4fv(locs.color, false, refractCol);
					 gl.uniformMatrix4fv(locs.colorSurface, false, reflectCol);
				}					
                this.wash();
            }
            gl.drawElements(gl.TRIANGLES, elementCount, elementDataType, 0);   
        },      
        use() { 
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL)
            gl.bindVertexArray(vertexBuffer);
            gl.useProgram(program);
        },
    };
    return API;
};













function createSkyBox(gl, size, skyStyle, groundStyle, textureSettings = {}) {
	const tex = texture(gl, null, {targetType: "TEXTURE_CUBE_MAP", ...textureSettings});
	const face = $("canvas",{});
	const fCtx = face.getContext("2d",{alpha: false});
	face.width = face.height = size;	
	const can = $("canvas",{});
	const ctx = can.getContext("2d",{alpha: false});
	can.width = size * 4;
	can.height = size * 3;
	ctx.fillStyle = skyStyle;
	ctx.fillRect(0,0,can.width, can.height);
	ctx.fillStyle = groundStyle;
	ctx.fillRect(0,can.height / 2,can.width, can.height / 2);
	gl.bindTexture(texture.target_type, texture);
	fCtx.drawImage(can, -size, -size);		 // front
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
	fCtx.drawImage(can, -size * 3, -size); 	// back
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
	fCtx.drawImage(can, -size * 2, -size); 	// right
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
	fCtx.drawImage(can, 0, -size);			 // left
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
	fCtx.drawImage(can, -size, 0);			 // top
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
	fCtx.drawImage(can, -size, -size * 2);	 // bottom
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
	return texture;
}

const gl = canvas.getContext("webgl2", {premultipliedAlpha: false, antialias: false, alpha: false});
gl.events = { fire(type, data = {}) { this[type] && this[type].forEach(cb => cb({type, ...data})) }};
setTimeout(()=> {requestAnimationFrame(loop)}, 0);

var W = canvas.width, H = canvas.height;

function updateCanvasSize(useFixed = true) {
    if (useFixed) {
        if (canvas.width !== W && canvas.height !== H) {
            canvas.width = W;
            canvas.height = H;			
            gl.viewport(0, 0, canvas.width, canvas.height); 
			gl.events.fire("onresize");
        }
    } else if (canvas.width !== innerWidth && canvas.height !== innerHeight) {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
		gl.events.fire("onresize");
    }
}
function texture(gl, image, {targetType = "TeXTURE_2D", min = "LINEAR", mag = "LINEAR", wrapX = "REPEAT", wrapY = "REPEAT"} = {}) {
    const texture = gl.createTexture();
    texture.target_type = target = gl[targetType];
    gl.bindTexture(target, texture);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl[min]);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl[mag]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl[wrapX]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl[wrapY]); 
    image && gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
}
function bindTexture(texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(texture.target_type, texture);
}
function compileShader(src, type, shader = gl.createShader(type)) {
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(shader)) }    
    return shader;
}
function createProgram(vSrc, fSrc, program = gl.createProgram()) {
    gl.attachShader(program, compileShader(vSrc, gl.VERTEX_SHADER));
    gl.attachShader(program, compileShader(fSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);   
    gl.useProgram(program);         
    return program;
}
function initBuffers(bufferDesc, locations, vertexBuffer = gl.createVertexArray()) {
    const glConst = name => isNaN(name) ? gl[name] : name;
    gl.bindVertexArray(vertexBuffer);
    for (const [name, d] of Object.entries(bufferDesc)) {
        gl.bindBuffer(d.type = glConst(d.type), d.glBuffer = gl.createBuffer());
        gl.bufferData(d.type, d.data, d.use = glConst(d.use));  
        if (locations[name] !== undefined) { initVertexAttribute(locations[name], d.size, d.normalize, d.offset, d.stride, d.dataType) }
    }
    bufferDesc.vertexBuffer = vertexBuffer;
}
function initVertexAttribute(loc, size, norm, offset, stride, type = gl.FLOAT, divisor) {
    gl.enableVertexAttribArray(loc);
    if (type === gl.UNSIGNED_INT) { gl.vertexAttribIPointer(loc, size, type, stride, offset) }
    else { gl.vertexAttribPointer(loc, size, type, false, stride, offset) }
    divisor && gl.vertexAttribDivisor(loc, 1);
}
function getLocations(prg, ...names) {
    const locs = {};
    for (const desc of names) {
        const [type, name] = desc.split("_");
        locs[name] = gl[`get${type === "U" ? "Uniform" : "Attrib"}Location`](prg, name);    
    }
    return locs;
}






