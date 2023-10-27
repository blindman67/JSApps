"use strict";
/*const grid1 = (() => {  // The backgroud checker board is called the grid.
    var v, c;
    var patterns = [], ready = false;
    var gc1,gc2,gc3,gc4;
    const P_SIZE = 2;
    const P_SIZE_SCALE = 1;
    function createPatterns(){
        if(gc1 !== settings.gridColor1 ||gc2 !== settings.gridColor2 ||gc3 !== settings.gridColor3 ||gc4 !== settings.gridColor4){
            const ctx = $("canvas", {width : P_SIZE, height : P_SIZE}).getContext("2d");
            ctx.globalAlpha = settings.useGridWorkaround ? 0.2 : 1;
            ctx.fillStyle = settings.gridColor1;
            ctx.fillRect(0,0,P_SIZE,P_SIZE);
            ctx.fillStyle = settings.gridColor2;
            ctx.fillRect(0,0,P_SIZE/2,P_SIZE/2);
            ctx.fillRect(P_SIZE/2,P_SIZE/2,P_SIZE/2,P_SIZE/2);
            patterns[0] = ctx.createPattern(ctx.canvas, "repeat");
            ctx.fillStyle = settings.gridColor3;
            ctx.fillRect(0,0,P_SIZE,P_SIZE);
            ctx.fillStyle = settings.gridColor4;
            ctx.fillRect(0,0,P_SIZE/2,P_SIZE/2);
            ctx.fillRect(P_SIZE/2,P_SIZE/2,P_SIZE/2,P_SIZE/2);
            patterns[1] = ctx.createPattern(ctx.canvas, "repeat");
            gc1 = settings.gridColor1;
            gc2 = settings.gridColor2;
            gc3 = settings.gridColor3;
            gc4 = settings.gridColor4;
        }
    }
    settingsHandler.onchange = createPatterns;
    const API = {
        ready() {},
        setView(view) {
            v = view;
            c = view.context;
        },
        drawScaleBar() {
            const size = 2 ** Math.ceil(Math.log(512 * v.invScale));
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.globalAlpha = 1;
            c.strokeStyle = c.fillStyle = "black";
            c.lineWidth = 1.5;
            const len = (size * v.scale + 0.5) | 0
            c.fillRect(3, c.canvas.height - 6, len + 2, 3);
            c.font = "12px arial";
            c.textAlign = "left";
            c.strokeText(size + "px", 4, c.canvas.height - 11);
            c.fillStyle = "white";
            c.fillRect(4, c.canvas.height - 5, len , 1);
            c.fillText(size + "px", 4, c.canvas.height - 12);
        },
        draw() {
            createPatterns(c);
            API.draw = API.drawReady;
        },
        drawReady() {
            var lStart, size, fade, patternIndex,  scale = v.scale,ss=1;
            size = Math.log(8 * scale);
            lStart = Math.ceil(size / 3) * 3;
            patternIndex = Math.abs(lStart / 3)
            fade = 1 - ((lStart - size) / 3);
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.imageSmoothingEnabled = false;
            c.beginPath();
            c.rect(0, 0, c.canvas.width, c.canvas.height);
            v.apply();
            if (lStart > 6) { ss = 1 / 8; patternIndex = 0 }
            else if (lStart > 3) { ss = 1}
            else if (lStart > 0) { ss = 8}
            else if (lStart > -3) { ss = 64}
            c.scale(ss, ss);
            if (settings.useGridWorkaround) {
                c.globalAlpha = 1;
                c.fillStyle = patterns[(patternIndex++) % 2];
                c.fill()
                c.scale(8, 8);
                c.fillStyle = patterns[(patternIndex++) % 2];
                c.fill();
                c.scale(8, 8);
                c.fillStyle = patterns[(patternIndex++) % 2];
                c.fill();
            } else {
                c.globalAlpha = fade * (1 / 3);
                c.fillStyle = patterns[(patternIndex++) % 2];
                c.fill()
                c.scale(8, 8);
                c.fillStyle = patterns[(patternIndex++) % 2];
                c.globalAlpha = (1 / 3);
                c.fill();
                c.scale(8, 8);
                c.fillStyle = patterns[(patternIndex++) % 2];
                c.globalAlpha =(1 - fade) * (1 / 3);
                c.fill();
            }
            ss *= 1;
            v.apply();
            c.globalAlpha = 1;
            c.beginPath();
            c.strokeStyle = "#FFF8";
            c.lineWidth = 1 / scale;
            c.lineTo(0, -1000000);
            c.lineTo(0, 1000000);
            c.moveTo(-1000000, 0);
            c.lineTo(1000000, 0);
            c.stroke();
            c.scale(ss / 4, ss / 4);
            c.fillStyle = "#FFF3";
            c.font = "12px arial";
            c.textAlign = "left";
            c.fillText((8 * ss) + "px", 2, 10);
        },
        hasError: false,
    };
    return API;
}) ();
*/


const grid = (()=> {
    const SHADERS = {
        grid: {
            vertex: `#version 300 es
precision highp float; 
in vec2 position;
uniform vec4 desc;          // inv size, alpha fades, invScale, invGridSize
uniform vec2 origin;
//uniform float rotate;
uniform vec2 screen;
const vec2 one = vec2(1, -1);
out vec2 tex;
void main() {
    gl_Position = vec4(position, 1, 1);
    //float aspect = screen.y / screen.x;
    //mat2 rot = mat2(cos(rotate), sin(rotate), -sin(rotate) * aspect, cos(rotate) * aspect);
    //tex = (one * desc.z * ((rot * (position / vec2(1, aspect))) * 0.5 + 0.5) + origin) * screen;
    tex = (one * desc.z * (position * 0.5 + 0.5) + origin) * screen;
}
`,
            fragment: `#version 300 es
precision highp float;
uniform vec4 desc;          // inv size, alpha fades, invScale, invGridSize
const float oneThird = 1.0 / 3.0;
const vec4 colA = vec4(vec3(0.7), 1);
const vec4 colB = vec4(vec3(0), 1);  
const vec4 lineCol = vec4(1);
in vec2 tex;  
out vec4 col;
void main() {
    vec2 pixLoc = tex;
    vec2 aPix = abs(pixLoc);
    if (aPix.x >= desc.z && aPix.y >= desc.z) {   
        pixLoc *= desc.x; 
        vec2 gr1 = floor(pixLoc);
        vec2 gr2 = floor(pixLoc * desc.w);   
        vec2 gr3 = floor(pixLoc * desc.w * desc.w);  
        float fade = desc.y * oneThird;
        col =  mix(colA, colB, mod(gr1.x + gr1.y, 2.0)) * fade;
        col += mix(colA, colB, mod(gr2.x + gr2.y, 2.0)) * oneThird;
        col += mix(colA, colB, mod(gr3.x + gr3.y, 2.0)) * (oneThird - fade);    
    } else {
        col = lineCol;
    }
}
`,
        }
    };
    
    var gl, webGL, view, ctx, error = false, vertBuf, positionLocation, program;
    var posX = 0, posY = 0, scale = 1, invScale = 1/*, rotate = 0*/, update = true, gridMix = 0.3, gridSize = 8, invGridSize = 1 / gridSize, steps = 1, viewStateReady = false;    
    const Floats = data => new Float32Array(data);
    const uniforms = {screen: null, origin: null, desc: null/*, rotate: null*/};
    const data = {
        screen: Floats([100, 100]),
        origin: Floats([posX, posY]),
        desc: Floats([0.8, 0.8, 1, invGridSize]),
        /*rotate: Floats([0]),*/
    };
    const buffers = {vertex: null, attribute: null};
    const attributes = {position: null};    
    function getSettings() {
        gridMix = Math.max(0, Math.min(1, Number(settings.gridMix)));
        gridSize = Math.max(4, Math.min(32, Number(settings.gridSize)))
        invGridSize = 1 / gridSize;
        update = true;
    }
    settingsHandler.onchange = getSettings;   
    getSettings();    
    function showError(info) { log.error(info); API.hasError = error = true; return }
    /*function checkError(loc) {  // debug code
        const e = gl.getError();
        error = true;
        if (loc) { log(loc); }
        if      (e === gl.INVALID_ENUM) {                  log.warn("WebGL An unacceptable value has been specified for an enumerated argument. The command is ignored and the error flag is set.") }
        else if (e === gl.INVALID_VALUE) {                 log.warn("WebGL A numeric argument is out of range. The command is ignored and the error flag is set.") }
        else if (e === gl.INVALID_OPERATION) {             log.warn("WebGL The specified command is not allowed for the current state. The command is ignored and the error flag is set.") }
        else if (e === gl.INVALID_FRAMEBUFFER_OPERATION) { log.warn("WebGL The currently bound framebuffer is not framebuffer complete when trying to render to or to read from it.") }
        else if (e === gl.OUT_OF_MEMORY) {                 log.warn("WebGL Not enough memory is left to execute the command.") }
        else if (e === gl.CONTEXT_LOST_WEBGL) {            log.warn("WebGL If the WebGL context is lost, this error is returned on the first call to getError. Afterwards and until the context has been restored, it returns gl.NO_ERROR.        ") }
        else { error = false; }
    }*/
    function render() {
        const size = Math.log(gridSize * scale);
        const lStart = Math.ceil(size / 3) * 3;
        const fade = 1 - ((lStart - size) / 3);
        data.desc[0] = 1 / steps;
        data.desc[1] = fade ** 4;
        data.desc[2] = invScale;
        data.desc[3] = invGridSize;
        /*data.rotate[0] = rotate;*/
        data.origin[0] = -posX / data.screen[0] * invScale;
        data.origin[1] = (ctx.canvas.height - posY) / data.screen[1] * invScale;
        gl.uniform2fv(uniforms.origin, data.origin);
        gl.uniform4fv(uniforms.desc, data.desc);
        /*gl.uniform1fv(uniforms.rotate, data.rotate);*/
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.vertexAttribPointer(buffers.attribute, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
    }    
    function checkShaderStatus(shader, source) {
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.log(source); showError(gl.getShaderInfoLog(shader)) }
        return error;
    }
    function checkProgramStatus(program) {
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { showError("WebGL Error linking grid program") }
        return error;
    }
    function createShaders(source) {
        var vShader = gl.createShader(gl.VERTEX_SHADER);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vShader, source.vertex);
        gl.shaderSource(fShader, source.fragment);
        gl.compileShader(vShader);
        if (checkShaderStatus(vShader, source.vertex)) { return }
        gl.compileShader(fShader);
        if (checkShaderStatus(fShader, source.fragment)) { return }
        var program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        if (checkProgramStatus(program)) { return };
        return program;    
    }
    function resize() {
        if (webGL.width !== ctx.canvas.width || webGL.height !== ctx.canvas.height) {
            webGL.width = ctx.canvas.width;
            webGL.height = ctx.canvas.height;
            data.screen[0] = ctx.canvas.width;
            data.screen[1] = ctx.canvas.height;            
            gl.viewport(0, 0, webGL.width, webGL.height);
            update = true;
        }
    }
    function updateUniforms() {
        resize();
        if (update) {
            gl.uniform2fv(uniforms.screen, data.screen);
            update = false;
        }
    }
    function start(w, h) {
        webGL = $("canvas", {width: w, height: h});
        gl = webGL.gl = webGL.getContext("webgl2");
        if (gl === null) { return showError("Could not create webGL2 context for grid.") }
        program = createShaders(SHADERS.grid);
        if (error) { return }
        gl.useProgram(program);
        attributes.position = gl.getAttribLocation(program, "position");
        buffers.vertex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.bufferData(gl.ARRAY_BUFFER, Floats([-1,-1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
        for (const [key, val] of Object.entries(uniforms)) {
            uniforms[key] = gl.getUniformLocation(program, key);
            if (uniforms[key] === null) { return showError("Grid unable to locate uniform: " + key) }
        }
        buffers.attribute = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.attribute);
        gl.enableVertexAttribArray(attributes.position);
        gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 0, 0);
        gl.useProgram(null);
    }

    const API = {
        ready() { },
        setViewState() { 
            if (!viewStateReady) {
                invScale = 1 / (scale = view.scale);
                posX = view.x;
                posY = view.y;   
                /*rotate = view.rotation;  */  
                const fade = Math.ceil(Math.log(gridSize * scale) / 3);
                steps = 1;
                if (fade > 2) { steps = invGridSize; }
                else if (fade > 1) { steps = 1 }
                else if (fade > 0) { steps = gridSize }
                else if (fade > -1) { steps = gridSize * gridSize }    
                viewStateReady = true;
            }
        },
        setView(view_) {
            view = view_;
            ctx = view.context;
            start(ctx.canvas.width, ctx.canvas.height);
            if (error) {
                gl = undefined;
                webGL = undefined;
                program = undefined;
                API.draw = API.ready;
                log.warn("Painter will continue to function with visual grid options disabled until next restart.");
            }
        },
        drawScaleBar() {
            API.setViewState();
            const size = steps * gridSize;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = ctx.fillStyle = "black";
            ctx.lineWidth = 1.5;
            const len = (size * scale + 0.5) | 0
            ctx.fillRect(3, ctx.canvas.height - 6, len + 2, 3);
            ctx.font = "12px arial";
            ctx.textAlign = "left";
            const text = size + "px";
            ctx.strokeText(text, 4, ctx.canvas.height - 11);
            ctx.fillStyle = "white";
            ctx.fillRect(4, ctx.canvas.height - 5, len , 1);
            ctx.fillText(text, 4, ctx.canvas.height - 12);
            viewStateReady = false
        },
        draw() {
            if (error) { return }
            API.draw = API.drawReady;
            API.draw();
        },
        drawReady() {
            API.setViewState();
            if (gridMix < 0.01) { return; }
            gl.useProgram(program); 
            updateUniforms();
            render();
            gl.useProgram(null);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = "copy";
            ctx.globalAlpha = gridMix;
            ctx.drawImage(webGL, 0, 0, ctx.canvas.width, ctx.canvas.height);      
ctx.globalCompositeOperation = "source-over";            
            view.apply();
            ctx.scale(steps * 0.25, steps * 0.25);
            ctx.globalAlpha = gridMix;
            ctx.fillStyle = "#FFF";
            ctx.font = "12px arial";
            ctx.textAlign = "left";
            ctx.fillText((gridSize * steps) + "px", 2, 10);  
            ctx.globalAlpha = 1;            
        },
        hasError: false,
    };  
    return API;
})();