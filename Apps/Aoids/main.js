const DEBUG = false;
DEBUG && import("../../src/DebugCanvas.js")
	.then(module => debugCanvas = module.DebugCanvas)
	.catch((e)=>{console.error(e)});
import "../../src/utils/MathExtensions.js";
import {$, $$, $R} from "../../src/DOM/geeQry.js";
import "../../src/DOM/errorReporter.js";
import {Flasher} from "../../src/DOM/Flasher.js";
import {media} from "../../src/utils/media.js";
import {startMouse} from "../../src/DOM/mouse.js";
import {simpleKeyboard} from "../../src/DOM/keyboard.js";
import {glUtils} from "../../src/webGL/glUtils.js";
import {Texture, SpriteSheet} from "../../src/webGL/Texture.js";
import {View} from "../../src/View.js";
import {simpleFrameRate} from "../../src/utils/frameRate.js";
import {renderer} from "../../src/webGL/renderer.js";
import {spriteShader} from "../../standalone/webGL/shaders/spriteShader.js";
import {pointShader} from "../../standalone/webGL/shaders/pointShader.js";
import {buffers} from "./buffers.js";
import {Aoids} from "./Aoids.js";
import {data} from "./data.js";
import {Ship} from "./Ship.js";
import {Rocks} from "./Rocks.js";
import {FXs} from "./FX/FXs.js";
import {Background} from "./Background.js";
import {Text} from "./Text.js";
var debugCanvas;








const canvas = $("canvas",{className: "mainCanvas"});
const infoSlide = $("div",{className: "info slide"}), info = $$($("div",{className: "info hide"}), infoSlide);
Aoids.gamesComs = $("div",{className: "gamesComs"});
var loader = $("h1",{className: "loader", textContent: "loading"});

const logLines = [
    $("div", {className: "logLine"}),
    $("div", {className: "logLine"}),
    $("div", {className: "logLine"}),
    $("div", {className: "logLine"}),
    $("div", {className: "logLine"}),
    $("div", {className: "logLine"}),


]
const log = $$($("div", {className: "logger"}), ...logLines);
const logger = {
    lastLine : "",
    lastLineCount : 0,
    error(data) {
        const str = data.toString();
        if (str === logger.lastLine) {
            logLines[0].textContent = "[" + (++logger.lastLineCount) + "]: " + str;
        } else {
            logger.lastLine = str;
            logger.lastLineCount = 0;
            const line = logLines.pop();
            logLines.unshift(line);
            $R(log, line);
            line.textContent = str;
            line.className = "logError";
            $$(log, $$.INSERT, line);
        }
    },
    log(data) {
        const str = data.toString();
        if (str === logger.lastLine) {
            logLines[0].textContent = "[" + (++logger.lastLineCount) + "]: " + str;
        } else {
            logger.lastLine = str;
            logger.lastLineCount = 0;
            const line = logLines.pop();
            logLines.unshift(line);
            $R(log, line);
            line.textContent = str;
            line.className = "logLine";
            $$(log, $$.INSERT, line);
        }
    },
    clear() {
        logger.lastLine = "";
        logger.lastLineCount = 0;
        logLines.forEach(line => {line.textContent = ""; line.className = "logLine";});
    },
};
Aoids.logger = logger;

logger.log("Started log");
logger.log("Started log and testing a long line to make sure that cow come home");



$$(document.body, canvas, info, loader, Aoids.gamesComs, log);




const flashInfo = Flasher(loader)("loading...");
const rates = simpleFrameRate(info, infoSlide, "slow");
const mouse = Aoids.mouse = startMouse(true, true);
const keys = Aoids.keys = (Aoids.keyboard = simpleKeyboard()).addKey(...data.keyboardKeys);
const bgRGBA = {r: 0.02, g: 0.06, b: 0.1, a: 1};
var animLoopFunction = loadingLoop;
var pause = false;
var imageCount = 3;
requestAnimationFrame(animLoopFunction);

media.loadImage("",data.spriteSheet.image)
	.then(image => {
		data.spriteSheet.texture = Texture(renderer.context, {image, min: "NEAREST", max: "NEAREST"});
		(--imageCount) === 0 && (animLoopFunction = mainLoop);
	});
media.loadImage("",data.overlaySpriteSheet.image)
	.then(image => {
		data.overlaySpriteSheet.texture = Texture(renderer.context, {image, min: "NEAREST", max: "NEAREST"});
		(--imageCount) === 0 && (animLoopFunction = mainLoop);
	});
media.loadImage("",data.background.skyImage)
	.then(image => {
		data.background.image = image;
		(--imageCount) === 0 && (animLoopFunction = mainLoop);
	});


Aoids.renderer = renderer;
Aoids.flasher = flashInfo;
renderer.create(canvas);
renderer.backgroundColor = bgRGBA;
renderer.fullPage();
Aoids.shaders = {
	bgPoints: pointShader({}),
    bgHyper: pointShader({}),
	bgColors: pointShader({}),
	sprites: spriteShader({maxLength: data.spriteSheet.maxSpriteCount, defaultSprite: {z: 0.1}}),
	spritesOverlay: spriteShader({maxLength: 1024, defaultSprite: {z: 0.02}}),
};
function loadingComplete() {
	new SpriteSheet(data.spriteSheet.sprites, data.spriteSheet.texture);
	new SpriteSheet(data.overlaySpriteSheet.sprites, data.overlaySpriteSheet.texture);
	flashInfo("Ready.");

	Aoids.shaders.bgPoints.method = "noPointScale";
	Aoids.shaders.bgPoints.init(renderer.context);
	Aoids.shaders.bgHyper.method = "hyperSpace";
	Aoids.shaders.bgHyper.init(renderer.context);
	Aoids.shaders.bgColors.method = "nebular";
	Aoids.shaders.bgColors.init(renderer.context);

	Aoids.shaders.sprites.init(renderer.context);
	Aoids.shaders.spritesOverlay.init(renderer.context);
	Aoids.shaders.sprites.spriteSheet = data.spriteSheet.texture;
	Aoids.shaders.spritesOverlay.spriteSheet = data.overlaySpriteSheet.texture;

    buffers.draw     = Aoids.shaders.sprites.createBuffer(0);
    buffers.fx       = Aoids.shaders.sprites.createBuffer(1);
    buffers.drawB    = Aoids.shaders.sprites.createBuffer(2, {z: 0.01});
    buffers.overlay  = Aoids.shaders.spritesOverlay.createBuffer(0);
    buffers.overlayB = Aoids.shaders.spritesOverlay.createBuffer(1);
    buffers.offsets  = {...Aoids.shaders.sprites.offsets};
    buffers.stride   = buffers.offsets.stride;
    Aoids.buffers = buffers;

	Aoids.shaders.bgPoints.createBuffer(0);
	Aoids.shaders.bgColors.createBuffer(0);

	Aoids.FXs = new FXs();
    Aoids.text = Text();
	Aoids.background = Background(Aoids.shaders.bgPoints, Aoids.shaders.bgColors, Aoids.shaders.bgHyper, Math.random() * 10000 | 0, data.background.image);
	data.background.image = undefined;
	Aoids.setup();
	Aoids.state = "intro";
}
function loadingLoop(time) {
	if (debugCanvas) {
		if(debugCanvas instanceof Function) { debugCanvas = debugCanvas() }
		debugCanvas.update();
		Aoids.debugCanvas = debugCanvas;
	}
	Aoids.time = time;
	if(animLoopFunction !== loadingLoop) { loadingComplete() }
	requestAnimationFrame(animLoopFunction);
}

function mainLoop(time) {
	Aoids.frameStart(time);
	var ticked = false;
	if (debugCanvas) {
		if(keys.Home) {
			keys.Home = false;
			debugCanvas.toggleShow();
		}
		debugCanvas.update()
	}
	if(keys.Escape) {
		keys.Escape = false;
		setTimeout(() => Aoids.state = "intro", 0);
	}
	if(keys.KeyP) {
		keys.KeyP = false;
		pause = !pause;
		debugCanvas && (debugCanvas.paused = pause);
		pause && flashInfo("PAUSE!");
	}

	if (renderer.fullPage()) { Aoids.resized() }
	const now = performance.now();
	mouse.sx = mouse.rx = (mouse.x / canvas.width - 0.5) * 2;
	mouse.sy = mouse.ry = -(mouse.y / canvas.height - 0.5) * 2;
	if (pause && keys.KeyF) {
		keys.KeyF = false;
		ticked = true;
		Aoids.update(time);
	} else if (!pause) { Aoids.update(time) }
	else { Aoids.updatePaused(time) }
	Aoids.render();
	rates(time, performance.now() - now);
	if (debugCanvas) {
		if (ticked) {
			debugCanvas.paused = false;
			debugCanvas.endOfFrame();
			debugCanvas.paused = true;
		} else { debugCanvas.endOfFrame() }
	}
	requestAnimationFrame(animLoopFunction);
	Aoids.frameEnd();
}





