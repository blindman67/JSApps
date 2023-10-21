import {} from "../../src/utils/MathExtensions.jsm";
import {$, $$} from "../../src/DOM/geeQry.jsm";
import {startMouse} from "../../src/DOM/mouse.jsm";
import {Dialog, dialogFocusStack} from "../../src/DOM/Dialog.jsm";
import {Groups} from "../../src/DOM/UI/Groups.jsm";
import {SpriteSheet} from "../../src/DOM/SpriteSheet.jsm";
import {glUtils} from "../../standalone/webGL/glUtils.jsm";
import {Texture} from "../../src/webGL/texture.jsm";
import {frameRate} from "../../src/utils/frameRate.jsm";
import {Vec3} from "../../src/Vec3.jsm";
import {View2D} from "../../standalone/View2D.jsm";
import {particleShader,particleFeedbackCShader, particleFeedbackShader} from "../../standalone/webGL/shaders/particleShader.jsm";
import {joinShader} from "../../standalone/webGL/shaders/joinShader.jsm";
import {flatShader} from "../../standalone/webGL/shaders/flatShader.jsm";
//import {flatNoiseShader} from "../../standalone/webGL/shaders/flatNoiseShader.jsm";





const particleArray = [];
const joinArray = [];
const options = {
	objAddCount: 200,
	warpBuffer: 80,
	backgroundColor: [0, 0,0,1],
	joinOptions: {
		use: false,
		colorA: [0.01,0.02,2,0.5],
		colorB: [0.8,0.5,0,0.41],

		joinMinWidth: 0,
		joinMaxWidth: 16,
		joinMaxLength: 160,
		blur: 0.05,
		lighten: false,
		joinCurve: 4,
	},
	particleOptions: {
		use: true,
		colorA: [3,0.6,0,1],
		colorB: [0,0.5,1.1,1],
		pushCurve: 4,
		pushStrength: -0.03,
		tangentPushCurve: 4,
		tangentPushStrength: 0.02,
		pushDistance: 20,
		maxSpeed: 30, // pixels per second
		minSpeed: 10, // pixels per second
		minRadius: 16,
		maxRadius: 16,
		blur: 0,
		lighten: false,
		falloffAlphaOnly: true,
	},
}

var fire;
var particleType = "Particle";
var cellSize = 128;

const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "FPS: Running mean Frames per second\nLoad: Percentage of frame in main loop"});
$$(document.body, canvas, info);
const mouse = startMouse(true);


const gl = glUtils.createContext(canvas, {alpha: false});
if (gl === null) {
    $$(document.body, $("div",{className: "WebGLError", textContent: "This browser does not support WebGL2"}));

    throw new Error("No webGL2 support");

}
glUtils.updateCanvasSize(false);

/*
const buf1 = Texture(gl,{width:canvas.width, height:canvas.height}).fromArray(null);
buf1.fb = gl.createFramebuffer();
const buf2 = Texture(gl,{width:canvas.width, height:canvas.height}).fromArray(null);
buf2.fb = gl.createFramebuffer();	*/


const buf1 = Texture(gl,{width:canvas.width, height:canvas.height}).toFrame();
const buf2 = Texture(gl,{width:canvas.width, height:canvas.height}).toFrame();
const buf3 = Texture(gl,{width:canvas.width, height:canvas.height}).toFrame();

const particlesFB = particleFeedbackShader(options.particleOptions);
const particlesFBC = particleFeedbackCShader(options.particleOptions);
const particlesS = particleShader(options.particleOptions);
var particles;
const joins = joinShader(options.joinOptions);
const flat = flatShader({});
const flatN = flatShader({});
const flatDisplay = flatShader({});

var dialogHue = 20;
const dialogHueStep = 30;
const spriteSetA = [0,1,2,3,4,5,6];
const spriteSetB = [0];
const dialogWidth = 12 * 17 + 2;
const uiSprites = SpriteSheet("UIIcons.png").defineSheet("small",0,0,70,28).defineSize("small", 14, 14);
const smallSprites = uiSprites.sheet;
const optionsDialog = Dialog(document.body, mouse, {
	title: "Particle options",
	titleColor: {h: dialogHue, s: 50, l: 40},
	width: dialogWidth,
	spriteSheetURL: uiSprites.URL,
	keyMode: "mainMenu",
	keys: {
		focusOpenToggle: {mods:"", keys: ["KeyP"], modeName: "default"}
	},
}).addUI(
	{type: "Button", text: "Add 100 points", key: {mods:"c", keys: "KeyA", modeName: "default"}, click() {
			const c = particleArray.length + options.objAddCount;
			particleArray.length = 0;
			joinArray.length = 0;
			if(uiState.particleType === "Particle") {
				addObjects(c, particleArray, "Particle");
				/*if (options.joinOptions.use && c <= 200) {
					addJoins(particleArray);
				}*/
			}else if(uiState.particleType === "Fire") {
				addObjects(c, particleArray, "Fire");
			}else if(uiState.particleType === "Feedback") {
				addObjects(c, particleArray, "Feedback");
			}


		}
	},
	{type: "Button", text: "Restart points", key: {keys: "KeyR", modeName: "default"}, click() {restartPoints()}},
	{type: "List",   name: "particleType",     text: "Particle type",       items: ["Particle", "Fire", "Feedback"], changed() {restartPoints() }},
	{type: "CheckBox", name: "pause", text: "Pause", group: "rendering", key: {mods:"c", keys: "KeyP", modeName: "default"}, checked: false},
	{type: "CheckBox", name: "freeze", text: "Freeze", group: "rendering", key: {keys: "Enter", modeName: "default"}, checked: false},
	{type: "CheckBox", name: "feedback", text: "Pixel feedback", key: {keys: "KeyF", modeName: "default"}, checked: true},
	{type: "List", name: "feedbackMethod", text: "Feedback method", items: flat.methods, changed() {
			if(gTime) {
				flat.method = uiState.feedbackMethod;
				flatN.method = uiState.feedbackMethod;
			}
		}
	},
	{type: "CheckBox", name: "glass", text: "Use glass", key: {keys: "KeyG", modeName: "default"}, checked: false},
	{type: "CheckBox", name: "showFrameRate", text: "Show Frame rate", key: {keys: "KeyF", modeName: "default"}, checked: true,  changed(ui) {
			uiState.showFrameRate ? info.classList.remove("hide") : info.classList.add("hide");
		}
	},
	/*{type: "CheckBox", name: "showJoins", text: "Show joins", checked: true,
		changed(ui) {
			options.joinOptions.use = uiState.showJoins;
			if(uiState.showJoins) {
				colorADialog.enable();
				colorBDialog.enable();
			} else {
				colorADialog.disable();
				colorBDialog.disable();

			}
		}
	},	*/
	{type: "Slider", name: "time",        text: "Time",   color: {h:0, s:0, l: 40},   digits: 2, min: -10, max: 13, step: 0, value: 1},
	{type: "Spacer"},
	{type: "Slider", name: "pBlur",        text: "Particle blur",   color: {h:0, s:0, l: 40},   digits: 2, min: -3, max: 3, step: 0, value: options.particleOptions.blur},
	{type: "Slider", name: "pMinSize",        text: "Particle min size",   color: {h:0, s:0, l: 40},   min: 1, max: 255, step: 1, value: options.particleOptions.maxRadius},
	{type: "Slider", name: "pMaxSize",        text: "Particle max size",   color: {h:0, s:0, l: 40},   min: 1, max: 255, step: 1, value: options.particleOptions.maxRadius},
	//{type: "Slider", name: "pixelMove",   text: "Feedback pixel move",   color: {h:0, s:0, l: 40},   min: -32, max: 32, step: 1, value: 2},
	//{type: "Slider", name: "pixelMoveRate",   text: "Feedback pixel rate",   color: {h:0, s:0, l: 40},  digits: 2, min: -6, max: 6, value: 2},
	//{type: "CheckBox", name: "lighten", text: "Lignten blend", checked: options.joinOptions.lighten},
	//{type: "Slider", name: "lightenA",         text: "Lop1",   			color: {h:0, s:0, l: 70}, min: 0, max: 15, step: 1, value: 0},
	//{type: "Slider", name: "lightenB",         text: "Lop1",   			color: {h:0, s:0, l: 70}, min: 0, max: 15, step: 1, value: 1},
	{type: "Spacer"},
	//{type: "Slider", name: "blur",         text: "Blur",   			color: {h:300, s:70, l: 70},   digits: 2, min: 0, max: 1, step: 0, value: options.joinOptions.blur},
	//{type: "Slider", name: "curve",        text: "Curve",   		color: {h:300, s:70, l: 70},   digits: 1, min: 0.1, max: 8, step: 0.1, value: options.joinOptions.joinCurve},
	//{type: "Slider", name: "minWidth",     text: "Min width",   	color: {h:300, s:70, l: 70},   min: 0, max: 255, step: 1, value: options.joinOptions.joinMinWidth},
	//{type: "Slider", name: "width",        text: "Width",   		color: {h:300, s:70, l: 70},   min: 1, max: 255, step: 1, value: options.joinOptions.joinMaxWidth},
	//{type: "Slider", name: "joinLength",   text: "Join length",   	color: {h:300, s:70, l: 70},   min: 1, max: 255, step: 1, value: options.joinOptions.joinMaxLength / 3},

	{type: "Slider", name: "mix",          text: "Mix",   		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "push",         text: "push",   		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "pushA",         text: "push A",   		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "turn",         text: "Turn",   		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "turnA",         text: "Turn A",   		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "size",         text: "Size",   		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "movA",         text: "Move X", 		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "movB",         text: "Move Y", 		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "speedA",         text: "Speed A", 		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "speedB",         text: "Speed B", 		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "alphaA",         text: "Alpha A", 		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},
	{type: "Slider", name: "alphaB",         text: "Alpha B", 		    color: {h:300, s:70, l: 70},   min: -100, max: 100, step: 1, value: 0},



);

const mouseDialog = Dialog(document.body, mouse, {
	title: "Mouse options",
	width: dialogWidth,
	titleColor: {h: dialogHue, s: 50, l: 40},
	keyMode: "mainMenu",
	keys: {
		focusOpenToggle: {mods:"", keys: ["KeyM"], modeName: "default"}
	},
}).addUI(
	{type: "Slider", name: "mouseDist",        text: "Mouse FX dist",   color: {h:0, s:0, l: 70},   digits: 0, min: 0, max: 100, step: 1, value: options.particleOptions.blur},
	{type: "CheckBox", name: "repel", text: "Repel particles", checked: false,
		changed(ui) {
			options.particleOptions.pushStrength = Math.abs(mouseState.pushStrength) * (mouseState.repel ? 1 : -1);
		}
	},
	{type: "Slider", name: "pushCurve",         text: "Curve",   			color: {h:80, s:60, l: 40},   digits: 1, min: -4, max: 4, step: 0.1, value: 1},
	{type: "Slider", name: "pushStrength",        text: "Strength",   		color: {h:80, s:60, l: 40},   digits: 2, min: -1, max: 1, step: 0.01, value: 0.2},
	{type: "Slider", name: "tangentPushCurve",     text: "Tangent Curve",   	color: {h:90, s:60, l: 40}, digits: 1,   min: -4, max: 4, step: 0.1, value: 4},
	{type: "Slider", name: "tangentPushStrength",        text: "Tangent strength",   		color: {h:90, s:60, l: 40}, digits: 2,   min: -1, max: 1, step: 0.01, value: 0.2},
//	{type: "Slider", name: "joinLength",   text: "Join length",   	color: {h:0, s:0, l: 70},   min: 1, max: 255, step: 1, value: options.joinOptions.joinMaxLength / 3},
).dock(optionsDialog);


const slideKeys = {
	scale: {down: {keys: "KeyE"}, up: {keys: "KeyR"}},
	red:   {down: {keys: "KeyQ"}, up: {keys: "KeyW"}},
	green: {down: {keys: "KeyA"}, up: {keys: "KeyS"}},
	blue:  {down: {keys: "KeyZ"}, up: {keys: "KeyX"}},
	alpha:  {down: {keys: "KeyC"}, up: {keys: "KeyV"}},
};
function onchecked(b) {
	const state = b.dialog.UIState;
	const sName = b.name.replace("Animate", "");
	state["animRange" + sName] = state[sName + "Slide"];
}
const colorSliders = [
	{type: "Icon", name: "scaleAnimate", sprite: 0, sprites: spriteSetA, sheet: smallSprites, pack: "right", checked: false},
	{type: "Slider", name: "scaleSlide", text: "Color scale", digits: 1,  min: -6, max: 6, step: 0.1, value: 1, keys: slideKeys.scale},
	{type: "Icon", name: "redAnimate", sprite: 0, sprites: spriteSetA, sheet: smallSprites, pack: "right", checked: false},
	{type: "Slider", name: "redSlide",   text: "Red",   color: {h:0, s:100, l: 50},   min: 0, max: 255, step: 1, value: options.particleOptions.colorA[0] * 255 | 0, keyStep: 8, keys: slideKeys.red},
	{type: "Icon", name: "greenAnimate", sprite: 0, sprites: spriteSetA, sheet: smallSprites, pack: "right", checked: false},
	{type: "Slider", name: "greenSlide", text: "Green", color: {h:120, s:100, l: 50}, min: 0, max: 255, step: 1, value: options.particleOptions.colorA[1] * 255 | 0, keyStep: 8, keys: slideKeys.green},
	{type: "Icon", name: "blueAnimate", sprite: 0, sprites: spriteSetA, sheet: smallSprites, pack: "right", checked: false},
	{type: "Slider", name: "blueSlide",  text: "Blue",  color: {h:240, s:100, l: 50}, min: 0, max: 255, step: 1, value: options.particleOptions.colorA[2] * 255 | 0, keyStep: 8, keys: slideKeys.blue},
	{type: "Icon", name: "alphaAnimate", sprite: 0, sprites: spriteSetA, sheet: smallSprites, pack: "right", checked: false},
	{type: "Slider", name: "alphaSlide", text: "Alpha", color: {h:0, s:0, l: 50},     min: 0, max: 255, step: 1, value: options.particleOptions.colorA[3] * 255 | 0, keyStep: 8, keys: slideKeys.alpha},
];
const colorSlidersAlphaDisable = [...colorSliders];

const colorABallDialog = Dialog(document.body, mouse, {
	title: "Ball colorA",
	titleColor: {h: dialogHue += dialogHueStep, s: 50, l: 40},
	keyMode: "ballColorA",
	width: dialogWidth,
	keys: {focusOpenToggle: {mods:"", keys: ["Digit1"], modeName: "default"}},
}).addUI(...colorSliders).dock(mouseDialog);
const colorBBallDialog = Dialog(document.body, mouse, {
	title: "Ball colorB",
	titleColor: {h: dialogHue += dialogHueStep, s: 50, l: 40},
	keyMode: "ballColorB",
	width: dialogWidth,
	keys: {focusOpenToggle: {mods:"", keys: ["Digit2"], modeName: "default"}},
}).addUI(...colorSliders).dock(colorABallDialog);

/*const colorADialog = Dialog(document.body, mouse, {
	title: "Center color",
	titleColor: {h: dialogHue += dialogHueStep, s: 50, l: 40},
	keyMode: "joinColorA",
	width: dialogWidth,
	keys: {focusOpenToggle: {mods:"", keys: ["Digit3"], modeName: "default"}},
}).addUI(...colorSlidersAlphaDisable).dock(colorBBallDialog);
const colorBDialog = Dialog(document.body, mouse, {
	title: "Outer color",
	titleColor: {h: dialogHue += dialogHueStep, s: 50, l: 40},
	keyMode: "joinColorB",
	width: dialogWidth,
	keys: {focusOpenToggle: {mods:"", keys: ["Digit4"], modeName: "default"}},
}).addUI(...colorSlidersAlphaDisable).dock(colorADialog);*/
const colorBg = Dialog(document.body, mouse, {
	title: "Background color",
	titleColor: {h: dialogHue += dialogHueStep, s: 50, l: 40},
	keyMode: "backgroundColor",
	width: dialogWidth,
	keys: {focusOpenToggle: {mods:"", keys: ["Digit5"], modeName: "default"}},
}).addUI(...colorSliders).dock(colorBBallDialog);


var uiState = optionsDialog.UIState;
var mouseState = mouseDialog.UIState;
colorABallDialog.UIState.ball = 1;
colorBBallDialog.UIState.ball = 2;

const colors = {
	ballA: colorABallDialog.UIState,
	ballB: colorBBallDialog.UIState,
	//A: colorADialog.UIState,
	//B: colorBDialog.UIState,
	BG: colorBg.UIState,
	setRGBA(dialog, scale, r,g,b,a) {
		const state = dialog.UIState;
		state.scaleSlide = scale;
		state.redSlide = r * 255;
		state.greenSlide = g * 255;
		state.blueSlide = b * 255;
		state.alphaSlide = a * 255;
		dialog.updateState();
	},
	getRGBA(colState, rgba = {}) {
		var scale = 1;
		if (colState.primeOffset === undefined) { colState.primeOffset = Math.randI(0,50) }

		const po = colState.primeOffset;
		if (colState.scaleAnimate) {
			if(colState.ball) {
				if(colState.ball === 1) {
					scale = Math.sin(gTimeA / Math.PRIMES_1000[28]) * colState.scaleSlide;
				} else {
					scale = Math.cos(gTimeA / Math.PRIMES_1000[28]) * colState.scaleSlide;
				}
			} else {
				scale = Math.sin(gTimeA / Math.PRIMES_1000[po+4]) * colState.scaleSlide;
			}
		} else {
			scale = colState.scaleSlide;
		}

		if(colState.redAnimate) {
			rgba.r = ((Math.sin(gTimeA / Math.PRIMES_1000[po+10]) * 0.5 + 0.5) * colState.redSlide) / 255 * scale;
		} else {
			rgba.r = colState.redSlide / 255 * scale;
		}
		if(colState.greenAnimate) {
			rgba.g = ((Math.sin(gTimeA / Math.PRIMES_1000[po+20]) * 0.5 + 0.5) * colState.greenSlide) / 255 * scale;
		} else {
			rgba.g = colState.greenSlide / 255 * scale;
		}
		if(colState.blueAnimate) {
			rgba.b = ((Math.sin(gTimeA /  Math.PRIMES_1000[po+34]) * 0.5 + 0.5) * colState.blueSlide) / 255 * scale;
		} else {
			rgba.b = colState.blueSlide / 255 * scale;
		}
		if(colState.alphaAnimate) {
			rgba.a = ((Math.sin(gTimeA /  Math.PRIMES_1000[po+40]) * 0.5 + 0.5) * colState.alphaSlide) / 255 * scale;
		} else {
			rgba.a = colState.alphaSlide / 255 * scale;
		}
		return rgba;
	}
}
colors.setRGBA(colorABallDialog, 1, ...options.particleOptions.colorA);
colors.setRGBA(colorBBallDialog, 1, ...options.particleOptions.colorB);
//colors.setRGBA(colorADialog, 1, ...options.joinOptions.colorA);
//colors.setRGBA(colorBDialog, 1, ...options.joinOptions.colorB);
colors.setRGBA(colorBg, 1,0,0,0,64);
const rgba = {r:0,g:0,b:0,a:0};




const view2D = View2D(canvas);
const mp = new Vec3();
var animLoopFunction = loadLoop;
var repel = false, gTime, gTimeA = 0,gTimeWave, gTimeWave1, gTimeWave2, gTimeWave3, gTimeWave4, gTimeWave1A, gTimeWave1B, gTimeWave1C, mouseDist;


function updateMouseState() {

	mouseState.pushC = mouseState.pushCurve < 0 ? 1 / (1 + (-mouseState.pushCurve) ** 2) : mouseState.pushCurve > 0 ? 1 + mouseState.pushCurve ** 2 : 1;
	mouseState.pushTC = mouseState.tangentPushCurve < 0 ? 1 / (1 + (-mouseState.tangentPushCurve) ** 2) : mouseState.tangentPushCurve > 0 ? 1 + mouseState.tangentPushCurve ** 2 : 1;
	mouseDist = Math.max(canvas.width, canvas.height) * (mouseState.mouseDist / 100);
}
function restartPoints() {
	if(uiState === undefined) { return }
	const c = options.objAddCount;
	particleArray.length = 0;
	joinArray.length = 0;
	if(uiState.particleType === "Particle") {
		addObjects(c, particleArray, "Particle");
		/*if (options.joinOptions.use && c <= 200) {
			addJoins(particleArray);
		}*/
	}else if(uiState.particleType === "Fire") {
		//fire = new FluidMap(canvas.width, canvas.height, cellSize)
		addObjects(c, particleArray, "Fire");
	} else if( uiState.particleType === "Feedback") {
		addObjects(c, particleArray, "Feedback");

	}


}

requestAnimationFrame(animLoopFunction);
function loadLoop(time) {
	if (options.joinOptions.use || options.particleOptions.use) {
		particlesFBC.init(gl, view2D, buf2);
		particlesFB.init(gl, view2D, buf2);
		particlesS.init(gl, view2D);
		addObjects(options.objAddCount,particleArray, "Particle");
		/*if (options.joinOptions.use) {
			joins.init(gl, view2D);
			addJoins(particleArray);
		}*/
		flat.init(gl, buf2);
		flatN.init(gl, buf1);
		flatDisplay.init(gl,buf2);
		flatDisplay.colorRGBA = {r:1, g:1, b:1, a:1};
	}
	animLoopFunction = mainLoop;
	requestAnimationFrame(animLoopFunction);
}
var diagonal = 1;
var CW,CH;
var clearFeedback = true;
var fbId = 0;
var inBuf = buf2, outBuf = buf1;
function mainLoop(time) {
	const now = performance.now();
	if (uiState.feedback) {
		particles = uiState.glass ? particlesFBC : particlesFB;
		//currentFB_Buf ++;

		if(clearFeedback) {
			//gl.bindFramebuffer(gl.FRAMEBUFFER, cuFB1[1]);
			//gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cuFB2[0].target, cuFB2[0].tex, 0);
			//gl.clear(gl.COLOR_BUFFER_BIT) ;
		}
		particles.texture = inBuf;
		outBuf.bindFrame(0, glUtils.sizeView);
	} else {
		particles = particlesS;
	}
    if (glUtils.updateCanvasSize(false)) { view2D.soil() }

	const ttime = time;
	time *= uiState.time;
	gTimeA = time /13 + 100000;
	gTime = time / 200;
	gTimeWave = Math.sin(time / 5200) * 0.49 + 0.505;
	gTimeWave1 = Math.sin(time / (1111 * 17)) * 0.49 + 0.505;
	gTimeWave2 = Math.sin(time / (1325 * 31)) * 0.49 + 0.505;
	gTimeWave3 = Math.sin(time / (1525 * 61)) * 0.49 + 0.505;
	gTimeWave4 = Math.sin(time / (1623 * 131)) * 0.49 + 0.505;
	gTimeWave1A = Math.sin(time / (135 * 7));
	gTimeWave1B = Math.sin(time / (135 * 17) * gTimeWave1A );
	gTimeWave1C = Math.sin(time / (135 * 217) * gTimeWave1B );
    view2D.toWorld(mouse, mp);
    mouse.gx = mp.x;
    mouse.gy = mp.y;

	updateMouseState();
	diagonal = Math.hypot(canvas.width, canvas.height);
	CW = canvas.width;
	CH = canvas.height;

    if(uiState.animateSlide) {
		uiState.colorScale = Math.sin(time/ 1000) * 3 + 1;
		optionsDialog.updateNamedStates("colorScale");
	}
	colors.getRGBA(colors.BG, rgba);
	if (uiState.feedback) {
		gl.clearColor(0,0,0,1);
	} else {
		gl.clearColor(rgba.r, rgba.g, rgba.b, rgba.a);
	}
	flatN.colorRGBA = rgba;
	//rgba.a = 1;
	flat.colorRGBA = rgba;

    if (particles && joins && !uiState.pause) {
		if (clearFeedback) {
			gl.clear(gl.COLOR_BUFFER_BIT)
		}
        particles.clear();
        //joins.clear();
		//joins.lighten = particles.lighten = uiState.lighten;
		//joins.blur = uiState.blur;
		//joins.curve = uiState.curve;
		//joins.minWidth = uiState.minWidth;
		//joins.width = uiState.width;
		//joins.joinLength = uiState.joinLength*3;
		particles.blur = uiState.pBlur;

		if (options.particleOptions.use) {
			if(uiState.freeze) {
				for (const p of particleArray) { p.scale =uiState.pSize; particles.add(p) }
			} else {
				for (const p of particleArray) { p.update(); particles.add(p) }
			}
		} else {
			if(!uiState.freeze) {
				for (const p of particleArray) { p.update(); }
			}
		}
		/*if (options.joinOptions.use) {
			let useJoins = 0;
			joins.colorA_RGBA = colors.getRGBA(colors.A, rgba);
			useJoins += rgba.a > 0 ? 1 : 0;
			joins.colorB_RGBA = colors.getRGBA(colors.B, rgba);
			useJoins += rgba.a > 0 ? 1 : 0;
			if (useJoins> 0) {
				if(uiState.freeze) {
					for (const j of joinArray) {  joins.add(j) }
				} else {
					for (const j of joinArray) {  j.update(); joins.add(j) }
				}
				joins.use() && joins.draw(true);
			}
		}*/
		if (options.particleOptions.use) {
			particles.colorA_RGBA = colors.getRGBA(colors.ballA, rgba);
			particles.colorB_RGBA = colors.getRGBA(colors.ballB, rgba);
			particles.use() && particles.draw(true);
		}
		if (uiState.feedback) {

			    flatN.time = time / 100000;
                [inBuf, outBuf] = [outBuf, inBuf];
				flatN.texture = inBuf;
				outBuf.bindFrame(0,  glUtils.sizeView);
				flatN.use(true) && flatN.draw(true);

               // [inBuf, outBuf] = [outBuf, inBuf];


				clearFeedback = false;


				//buf1.unbindFrame();
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				flatDisplay.texture = outBuf;
				glUtils.sizeView();
				gl.clear(gl.COLOR_BUFFER_BIT)
				flatDisplay.time = time / 100000;;
				flatDisplay.use() && flatDisplay.draw(true);

		} else {
			clearFeedback = true;
		}
    }







	uiState.showFrameRate && frameRate(info, ttime, performance.now() - now);
	requestAnimationFrame(animLoopFunction);
}



function addObjects(count, arr = objs, type) {
    while (count-- > 0) { arr.push(new Sprite(type, arr.length - 1, arr)) }
	if(type ===  "Feedback") {
		for (const p of particleArray) { p.update(); p.update() }
		particleArray.sort((a,b) => a.vx1 - b.vx1);
	}
}
function addJoins(arr) {
    var i = 0, j;
    while (i < arr.length) {
        j = i + 1;
        const pA = arr[i++];
        while (j < arr.length) {
            const pB = arr[j++];
            const dx = pA.x - pB.x;
            const dy = pA.y - pB.y;
            const dist = (dx * dx + dy * dy) ** 0.5;
                //if (dist < 50) {
                    joinArray.push(new Join(pA, pB))
                //}
        }
    }

}
function Join(pA, pB) {
    this.pA = pA;
    this.pB = pB;
    this.update();
}
Join.prototype = {
    asJoin() {},
    update() {
        const dx = this.pA.x - this.pB.x;
        const dy = this.pA.y - this.pB.y;
        this.distSqr = dx * dx + dy * dy;

    },
};

const BORDER = 100;
const DIR = 0;
const SPEED = 1;
const TEMP = 2;
const AIR = 3;
const SPIN = 4;
const FLAME_TEMP_CONDUCT_COF = 0.2;
const FLAME_SPEED_COF = 0.2;
const FLAME_AIR_COF = 0.2;
const TEMP_CONDUCT_COF = 0.2;
const TEMP_BOUE_COF = 0.1;
const AIR_FLOW_COF = 0.1;

const ITEM_SIZE = 5;
const MAX_AIR = 20;
var FW,FH;
function FluidMap(width, height, cellSize) {
	FW = width / 2 + BORDER;
	FH = height / 2 + BORDER;
	this.w = width + BORDER * 2;
	this.h = height + BORDER * 2;
	this.cw = this.w / cellSize | 0;
	this.ch = this.h / cellSize | 0;
	this.dw = this.w / this.cw;
	this.dh = this.h / this.ch;
	var size = this.cw  * this.ch;
	const A = [], B = [];
	for(let i = 0; i < size; i++) {
		A.push(0,0,0,10,0);
		B.push(0,0,0,10,0);
	}
	this.bufS = [A,B]

	this.cBuf = 0;

}
FluidMap.prototype = {
	flame(p) {
		const A = this.bufS[this.cBuf];
		var x = p.x + FW;
		var y = p.y + FH;
		var cx = x / this.dw | 0;
		var cy = y / this.dh | 0;
		var idx = (cx + cy * this.cw) * ITEM_SIZE;
		A[idx + TEMP] += p.temp * FLAME_TEMP_CONDUCT_COF;
		const air = A[idx + AIR] * FLAME_AIR_COF * p.airB;
		p.air += air;
		A[idx + AIR] -= air;
		const d = A[idx + DIR];
		const s = A[idx + SPEED] * FLAME_SPEED_COF;
		p.spin += A[idx + SPIN] * 0.2;
		A[idx + SPIN] *= 0.8;
		p.vx = Math.cos(d) * s;
		p.vy = Math.sin(d) * s;


	},
	update() {
		const A = this.bufS[this.cBuf];
		const B = this.bufS[(this.cBuf + 1) % 2];
		this.cBuf = (this.cBuf + 1) % 2;
		const W4 = this.cw * ITEM_SIZE;
		const w = this.cw - 2;
		const h = this.ch - 2;
		var i = 1, idx, idxU, idxL, idxR, idxD, s,d,a,aa;
		var j = 0, tt, t, t1, x, y, xx, yy,xxL, xxR, yyL, yyR, xx1,yy1;
		while(j++ < h) {
			i = 0;
			idx = ITEM_SIZE + j * W4;
			idxU = idx - W4;
			idxD = idx + W4;
			idxL = idx - ITEM_SIZE;
			idxR = idx + ITEM_SIZE;

			s = A[idxL+SPEED];
			d = A[idxL+DIR];
			xxL = Math.cos(d) * s;
			yyL = Math.sin(d) * s;
			s = A[idx+SPEED];
			d = A[idx+DIR];
			xx = Math.cos(d) * s;
			yy = Math.sin(d) * s;
			while(i++ < w) {
				x = 0;
				y = 0;
				s = A[idx+SPEED];
				d = A[idx+DIR];
				B[idx+TEMP] = t = A[idx+TEMP];
				B[idx+AIR] = a = A[idx+AIR];
				B[idx+SPIN]  = A[idx+SPIN];
				tt = A[idxL+TEMP] - t;
				B[idxL + TEMP] -= tt * TEMP_CONDUCT_COF;
				B[idx + TEMP] += tt * TEMP_CONDUCT_COF;
				x += tt * TEMP_BOUE_COF;
				y += tt * TEMP_BOUE_COF;

				aa = (A[idxL+AIR] - a) * AIR_FLOW_COF;
				B[idx + AIR] +=  aa;
				B[idxL + AIR] -=  aa;



				tt = A[idxR+TEMP] - t;
				B[idxR + TEMP] -= tt * TEMP_CONDUCT_COF;
				B[idx + TEMP] += tt * TEMP_CONDUCT_COF;
				x += tt * TEMP_BOUE_COF;
				y -= tt * TEMP_BOUE_COF;

				aa = (A[idxR+AIR] - a) * AIR_FLOW_COF;
				B[idx + AIR] +=  aa;
				B[idxR + AIR] -=  aa;

				tt = A[idxU+TEMP] - t;
				B[idxU + TEMP] -= tt * TEMP_CONDUCT_COF;
				B[idx + TEMP] += tt * TEMP_CONDUCT_COF;
				x += tt * TEMP_BOUE_COF;

				aa = (A[idxU+AIR] - a) * AIR_FLOW_COF;
				B[idx + AIR] +=  aa;
				B[idxU + AIR] -=  aa;

				tt = A[idxD+TEMP] - t;
				B[idxD + TEMP] -= tt * TEMP_CONDUCT_COF;
				B[idx + TEMP] += tt * TEMP_CONDUCT_COF;
				x += tt * TEMP_BOUE_COF;

				aa = (A[idxD+AIR] - a) * AIR_FLOW_COF;
				B[idx + AIR] +=  aa;
				B[idxD + AIR] -=  aa;

				xx1 = xx + x;
				yy1 = yy + y;

				B[idx + SPEED] = (xx1 * xx1 + yy1 * yy1) ** 0.5;
				B[idx + DIR] = Math.atan2(yy1,xx1);

				s = A[idxR+SPEED];
				d = A[idxR+DIR];
				xxR = Math.cos(d) * s;
				yyR = Math.sin(d) * s;

				B[idx+SPIN] += (xxR * yyL - yyR * xxL) / 100;

				xxL = xx;
				yyL = yy;
				xx = xxR;
				yy = yyR;

				if(isNaN(B[idx]) || isNaN(B[idx+1]) ||isNaN(B[idx+2]) ||isNaN(B[idx+3]) ||isNaN(B[idx+4])) {
					debugger
				}

				idx += ITEM_SIZE;
				idxL += ITEM_SIZE;
				idxR += ITEM_SIZE;
				idxU += ITEM_SIZE;
				idxD += ITEM_SIZE;
			}
		}
	},


}

const target = {
	x: 0,
	y: -1000,
}
function updateTarget() {


}

function Sprite(type = "Sprite", idx, arr) {
    this.x = Math.rand(-canvas.width / 2, canvas.width / 2);
    this.y = Math.rand(-canvas.height / 2, canvas.height / 2);
    const dir = Math.rand(0, Math.PI * 2);
    const speed = Math.rand(options.particleOptions.minSpeed, options.particleOptions.maxSpeed) / 60;
    this.vx = Math.cos(dir) * speed;
    this.vy = Math.sin(dir) * speed;
	this.cMix =1;
    this.z = 0;
    this.alpha = 1;

    this["as" + type](idx, arr);
}
Sprite.prototype = {
	asFire() {
		const b = BORDER, w = canvas.width / 2 + b, h = canvas.height / 2 + b;
		this.age =  Math.rand(0, 1);
		this.ageA =  0;
		this.scaleR = Math.rand(0.5, 1);
		this.scale = Math.clamp(this.scaleR * (uiState.pMaxSize - uiState.pMinSize) + uiState.pMinSize, uiState.pMinSize, uiState.pMaxSize);
		 this.x = Math.rand(-canvas.width / 4, canvas.width / 4);
		this.y = Math.rand(canvas.height / 2 , canvas.height / 2+this.scale/4)+ Math.abs(this.x);
		//this.y = Math.rand(canvas.height / 2 + BORDER+this.scale, canvas.height / 2 + BORDER+this.scale* 2);
		//this.x = Math.rand(-w, w);
		//this.y = Math.rand(h -b, h);
		//this.y = Math.rand(0, h);
		this.vx = 0;
		this.vy = -0.2;
		this.vx1 = 0;
		this.vy1 = -0.2;
		this.dir = Math.atan2(Math.rand(target.y,this.y)-this.y, target.x-this.x);
		this.dirV = Math.rand(-0.1, 0.1);
		this.dirVr = this.dirV;
		this.dirVc = 0;
		this.accel = 0.01;
		this.spin = 0;
		this.spinR = 0;
		this.spinC = 0;
		this.cMix  = 0;
		this.cMixB  = 0;
		this.cMixA  = 0;
		this.push = 0;
        this.update = this.fireUpdate;


	},
	fireUpdate() {
		const b = BORDER, w = canvas.width / 2 + b, h = canvas.height / 2 + b;
		if (this.x < -w || this.y < -h || this.x > w) {
			this.asFire();
		}
		///fire.flame(this);
		if(this.age < 40 && this.cMixB < 0.60) {
			this.age += Math.random() ** 3 / 5;
			this.cMixB += this.accel / 10;
			this.scaleR -= Math.random() / 50;
			this.vx1 = this.vx;
			this.vy1 = this.vy;
			this.ageA = this.age;

		}else if(this.age < 80) {
			this.age += Math.random()*Math.random();
			this.scaleR += Math.random() / 19;
			this.cMixB += 0.0063;
			this.cMixA = -Math.cos((this.age -this.ageA)/ 1 ) * (1 - this.cMixB) / 4 +  (1 - this.cMixB) / 4;
			this.x += this.vx1;
			this.y += this.vy1;
			this.y -= Math.abs(this.spin)* 100;
		} else {
			this.vx1 *= 0.9;
			this.vy1 *= 0.9;
			this.x += this.vx1;
			this.y += this.vy1;
			this.scaleR -= Math.random() / 5;
			if(this.scaleR < 0.01) { this.asFire() }
		}

		this.scaleR = Math.unitClamp(this.scaleR);
		var x = target.x - this.x;
		var y =  target.y - this.y;
		const d = (x * x + y * y) ** 0.5;
		var nx = x / d;
		var ny = y / d;

		var dx = this.vx;//Math.cos(this.dir);
		var dy = this.vy;//Math.sin(this.dir);
		const dd = (dx * dx + dy * dy) ** 0.5;
		if(this.age > 6 && this.age < 40 && dd < 8) { this.age = 40 }
		dx /= dd;
		dy /= dd;
		var dot = nx * dx + ny * dy;
		var ang = Math.asin(dx * ny - dy * nx);
		if(dot > 0) {
			this.dirV +=  ang / 108;
			this.accel = dot * 0.1;
			//this.cMix = 0;
		} else {
			this.dirV += ((Math.PI - Math.abs(ang)) / 14) * Math.sign(ang);
			this.dirV += Math.rand(-0.01, 0.01)
			//this.accel *= 0.7;
			//this.cMix = 1;
		}
		//this.dirV += Math.sin((this.x * this.age) / w * gTimeWave1C) * 0.01;
		this.dirVc += (this.dirV - this.dirVr) * 0.9;
		this.dirVc *= 0.2;
		this.dirVr += this.dirVc;
		this.dir += this.dirVr;
		this.spinR = this.dirVc/8;
		this.spinC += (this.spinR - this.spin) * 0.1;
		this.spinC *= 0.2;
		this.spin += this.spinC;
		this.cMix = Math.unitClamp(this.cMixB +  this.cMixA);
		this.push = this.cMix * 3 ;

		var xx = 1 - Math.abs(this.x / w);
		var yy = this.y / h;
		if(yy > 0) {
			this.vx -= (xx * Math.sign(this.x) * yy) * 0.053;
			this.vy -= (xx ** 3 * yy) * 0.1;
		} else {
			this.vx *= 0.95;
			this.vx += (xx * Math.sign(this.x) * yy) * 0.053;
		}
		//this.dirV *= 0.999;
		this.vx += Math.cos(this.dir) * this.accel;
		this.vy += Math.sin(this.dir) * this.accel;


		//this.cMix = Math.unitClamp(this.cMixB);
		this.scale = Math.clamp(this.scaleR * (uiState.pMaxSize - uiState.pMinSize) + uiState.pMinSize, uiState.pMinSize, uiState.pMaxSize);
		this.x += this.vx;
		this.y += this.vy;
		this.vx *= 0.99;
		this.vy *= 0.99;



	},

	asFeedback(idx, arr) {
		this.idx = idx;
		var s = (arr.length ** 0.5) + 1 | 0;
		var mx = canvas.width / s | 0;
		var my = canvas.height / s | 0;
		this.x = (idx % s) * mx
		this.y = (idx / s | 0) * my
		this.cMix =1;
		this.z = 0;
		this.vx1 = 0;
		this.vy1 = 0;
		this.vz1 = 0;
        this.scaleR = Math.random();//Math.rand(options.particleOptions.minRadius, options.particleOptions.maxRadius);
		this.scale = this.scaleR * (uiState.pMaxSize - uiState.pMinSize) + uiState.pMinSize;
		this.cMix = 0.5;
		this.spin = 0;
		 this.update = this.feedbackUpdate;
	},
	feedbackUpdate() {
        var o = (this.idx / particleArray.length + 0.5) * gTimeWave4;
		var s = (particleArray.length ** 0.5) + 1 | 0;
		var mx = (CW +256)/ s + 1| 0;
		var my = (CH +256)/ s  + 1| 0;
		const a = ((mx % 2) + (my % 2)) % 2;
		var ll = ((this.x * this.x + this.y * this.y) ** 0.5) / (diagonal / 2);
		this.vx1 = ll;
		var l = ll * uiState.movA - 0.05;
		this.x = (this.idx % s) * mx - (CW+256) / 2  + Math.cos(gTimeWave1 * ll*uiState.movB * 10) * mx;
		this.y = (this.idx / s | 0) * my - (CH +256)/ 2 + my * 1.4 + Math.sin(gTimeWave2 * ll*uiState.movA * 10) * my;
		var ss = Math.sin(gTimeWave * 12 * o) * 0.1 + 1;
		this.x += this.x * uiState.movA * ss;
		this.y += this.y *  uiState.movA  * ss;
		this.spin = (Math.sin(gTimeWave3 * 100 * (o+l) + gTimeWave1 * (o+ll*10)) * 2 * uiState.turn/25) * (a ? -1 : 1);
		this.scaleR = Math.cos(gTimeWave2*6*(ll+o))* Math.cos(gTimeWave3 * (uiState.size/100) * (o+l));
		this.scale = this.scaleR * (uiState.pMaxSize - uiState.pMinSize) + uiState.pMinSize;
		this.cMix =  Math.cos(gTimeWave1 + gTimeWave4 * uiState.mix * (o+l))* 0.5 + 0.5;
		this.push =  Math.sin(gTimeWave2 + gTimeWave3  * (o-ll))* uiState.push*0.1;

	},





    asParticle(idx) {
		this.idx = idx;
		this.cMix =1;
		this.z = 0;
		this.vx1 = 0;
		this.vy1 = 0;
		this.vz1 = 0;
        this.scaleR = Math.random();//Math.rand(options.particleOptions.minRadius, options.particleOptions.maxRadius);
		this.scale = this.scaleR * (uiState.pMaxSize - uiState.pMinSize) + uiState.pMinSize;
		this.cMix = 0.5;
		this.spin = 0;
        this.update = this.particleUpdate;


    },
    particleUpdate() {
		var o = (this.idx / particleArray.length + 0.5);
		const mx = uiState.movA / 59;
		const my = uiState.movB / 40;
		const rx =  mx*this.cMix *(this.x + gTime) / (110 * (gTimeWave1 + 0.5));
		const ry =  my*this.cMix *(this.y - gTime) / (70 * (gTimeWave1 * gTimeWave+ 0.7));
		const rz = this.cMix *(this.y + this.x + gTime) / (130 * (gTimeWave + 0.3));
		const sx = uiState.speedA / 1000;
		const sy = uiState.speedB / 1000;
		const xdx = Math.cos(rx);
		const xdy = Math.sin(rx);
		const ydx = Math.cos(ry);
		const ydy = Math.sin(ry);
		const zdx = Math.cos(rz);
		const zdy = Math.sin(rz);

		const xx  = Math.cos((this.x * gTime) / 1220) * sx;
		const yy  = Math.sin((this.y * gTime) / 1131) * sy;
		const xx1  = Math.cos(((this.y + this.x) * gTime)  / 1321) * sx;
		const yy1  = Math.sin(((this.y - this.x) * gTime)  / 1241) * sy;

		this.vx1 += (xdx * xx - ydx * yy + zdx * xx1);
		this.vy1 += (xdy * xx + ydy * yy + zdy * xx1);
		this.vz1 += (zdx * yy1);


		const va = this.vx + this.vx1;
		const vb = this.vy + this.vy1;
		this.x += va;
        this.y += vb;
        this.z += this.vz1;
		const vv = (this.x * this.vy1 - this.y * this.vx1) * this.vz1;
        this.cMix = Math.sin((this.x+this.y)*gTimeWave3*o * (uiState.mix / 160)) * 0.5 + 0.5;
		this.alpha = Math.abs(Math.sin((vb*va)*o*gTimeWave4 * uiState.alphaA/170) * (uiState.alphaB / 20));

		this.push = Math.cos((vb+va)*gTimeWave2 *  (uiState.push / 118))  * (uiState.pushA / 26);
		this.spin = this.idx % 2 ?
			Math.cos((this.x*vb/va)*gTimeWave *  (uiState.turn / 119))  * (uiState.turnA / 50) :
			Math.sin((this.y*vb/va)*gTimeWave *  (uiState.turn / 129))  * (uiState.turnA / 50);
		this.scaleR =  Math.cos(uiState.size/ 12*gTimeWave3 * o*rx)*0.5+0.5;
		this.scale = this.scaleR  * (uiState.pMaxSize - uiState.pMinSize) + uiState.pMinSize;
		this.vx1 *= 0.99;
		this.vy1 *= 0.99;
		this.vz1 *= 0.99;

		if (mouse.button === 4 ) {
			const dx = this.x - mouse.gx;
			const dy = this.y - mouse.gy;
			const dist = (dx * dx + dy * dy) ** 0.5;
			const push = 1 - dist / mouseDist;



			const p = Math.ease(push, mouseState.pushC) * mouseState.pushStrength * Math.rand(0.9,1.1);
			const t = Math.ease(push, mouseState.pushTC) * mouseState.tangentPushStrength * Math.rand(0.9,1.1);
			this.vx1 += (dx * p - dy * t) / 100;
			this.vy1 += (dy * p + dx * t) / 100;
        }

        const b = options.warpBuffer, w = canvas.width / 2 + b, h = canvas.height / 2 + b;
        this.x = this.x < -w ? w : this.x > w ? -w : this.x;
        this.y = this.y < -h ? h : this.y > h ? -h : this.y;
    },

}



