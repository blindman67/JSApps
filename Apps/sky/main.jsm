import {} from "../../src/utils/MathExtensions.jsm";
import {$, $$} from "../../src/DOM/geeQry.jsm";
import {} from "../../src/DOM/errorReporter.jsm";
import {media} from "../../src/utils/media.jsm";
import {subImageFromMedia} from "../../src/utils/subImageFromMedia.jsm";
import {startMouse} from "../../src/DOM/mouse.jsm";
import {glUtils} from "../../src/webGL/glUtils.jsm";
import {Canvas2DUtils} from "../../src/utils/canvas2DUtils.jsm";
import {Texture} from "../../src/webGL/texture.jsm";
import {frameRate} from "../../src/utils/frameRate.jsm";
import {renderer} from "../../src/webGL/renderer.jsm";
import {skyShader} from "../../src/webGL/shaders/skyShader.jsm";







const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "FPS: Running mean Frames per second\nLoad: Percentage of frame in main loop"}); 
$$(document.body, canvas, info); 

const mouse = startMouse(true);
renderer.create(canvas); 
renderer.backgroundColor = {r: 0.02, g: 0.06, b: 0.1, a: 1};
renderer.fullPage();

const sky = {
	shader: null,
	sheet: null, 
	pos: {yaw: 0, pitch: 0},
	fov: {
		real: Math.PI90,
		pos: Math.PI90,
		chase: 0,
		drag: 0.4,
		acc: 0.2,
	},	
};
 sky.shader = renderer.addShader(skyShader()); 
 sky.sheet = sky.shader.addSheet("sky");
 //sky.sheet.setVertColorsI32([0xFF88FFAA,0xFF88FF55,0xFFFF8800,0xFFFF8800,0xFF884400,0xFF884400,0xFF448866,0xFF448866]);
 
sky.sheet.setVertColorsI32([0,0,0,0,0,0,0,0]);
sky.sheet.setVertColorI32(0xFF00AA00, sky.sheet.BOTTOM.FRONT.LEFT);
sky.sheet.setVertColorI32(0xFF00FF00, sky.sheet.BOTTOM.FRONT.RIGHT);
sky.sheet.setVertColorI32(0xFF00AA00, sky.sheet.BOTTOM.BACK.LEFT);
sky.sheet.setVertColorI32(0xFF00FF00, sky.sheet.BOTTOM.BACK.RIGHT);
sky.sheet.setVertColorI32(0xFFAA8800, sky.sheet.TOP.FRONT.LEFT);
sky.sheet.setVertColorI32(0xFFFFAA00, sky.sheet.TOP.FRONT.RIGHT);
sky.sheet.setVertColorI32(0xFFAA8800, sky.sheet.TOP.BACK.LEFT);
sky.sheet.setVertColorI32(0xFF884400, sky.sheet.TOP.BACK.RIGHT);
sky.sheet.curvePower = 64;

var animLoopFunction = mainLoop;	
requestAnimationFrame(animLoopFunction);
	
function mainLoop(time) {
	renderer.fullPage();
	const now = performance.now();
	if(sky.shader.use()) {
		renderer.clear();
		sky.sheet.colorI32 = 0xFFFFFFFF;
		if (mouse.button === 1) {
			if(mouse.dragging) {
				const f = sky.sheet.fov;
				sky.pos.yaw -= (mouse.x - mouse.oldX) / (canvas.width * (1/f));// Math.TAU;
				sky.pos.pitch += (mouse.y - mouse.oldY) / (canvas.height * (1/f));// Math.TAU;
				sky.pos.pitch = sky.pos.pitch < -Math.PI90 ? -Math.PI90 : sky.pos.pitch > Math.PI90 ?  Math.PI90 : sky.pos.pitch;
			} else {
				mouse.dragging = true;
			}
			mouse.oldX = mouse.x;
			mouse.oldY = mouse.y;
			
		} else {
			mouse.dragging = false;
		}
		const fov = sky.fov;
		if (mouse.wheel !== 0) {
			fov.pos -= Math.sign(mouse.wheel) / (Math.PI * 4);
			mouse.wheel -= Math.sign(mouse.wheel);
		}
		fov.real += (fov.chase = (fov.chase += (fov.pos - fov.real) * fov.acc) * fov.drag);
		sky.sheet.fov = fov.real;
		sky.sheet.direction(sky.pos.yaw, sky.pos.pitch);
		sky.sheet.draw();		
	}	
	frameRate(info, time, performance.now() - now);
	requestAnimationFrame(animLoopFunction);
}






