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
import {skyBoxShader} from "../../src/webGL/shaders/skyBoxShader.jsm";
import {lineShader} from "../../src/webGL/shaders/lineShader.jsm";






const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "FPS: Running mean Frames per second\nLoad: Percentage of frame in main loop"}); 
var loader = $("h1",{className: "loader"}); 
$$(document.body, canvas, info, loader); 

const mouse = startMouse(true);

renderer.create(canvas); 
renderer.backgroundColor = {r: 0.02, g: 0.06, b: 0.1, a: 1};
renderer.fullPage();

const lines = {
	lastPoint: {x:-2, y: -2},
	startPoint: {x:-2, y: -2},
	shader: null,
	sheet: null,
	dragging: false,
	color: null,
	
	
	
};
const skyBox = {
	size: 640,
	fov: {
		real: Math.PI90,
		pos: Math.PI90,
		chase: 0,
		drag: 0.4,
		acc: 0.2,
	},
		
	media: [["skyBox", "./skyboxRed.jpg"]],
	cube: { },
	pos: {
		yaw: 0,
		pitch: 0,
	},
};

media.oncomplete = () => { 
    lines.sheet = (lines.shader = renderer.addShader(lineShader())).addSheet("lines",0xFFFFFFFF);
	loader.style.display = "none";
	animLoopFunction = mainLoop;
}
media.loadImages(skyBox.media)
    .then(() => { 
		const m = media.getByName("skyBox");		
		skyBox.cube.above = subImageFromMedia(m, {width: skyBox.size, height: skyBox.size, tileX: 3, tileY: 0});
		skyBox.cube.front = subImageFromMedia(m, {width: skyBox.size, height: skyBox.size, tileX: 3, tileY: 1});
		skyBox.cube.under = subImageFromMedia(m, {width: skyBox.size, height: skyBox.size, tileX: 3, tileY: 2});
		skyBox.cube.left  = subImageFromMedia(m, {width: skyBox.size, height: skyBox.size, tileX: 2, tileY: 1});
		skyBox.cube.right = subImageFromMedia(m, {width: skyBox.size, height: skyBox.size, tileX: 0, tileY: 1});
		skyBox.cube.back  = subImageFromMedia(m, {width: skyBox.size, height: skyBox.size, tileX: 1, tileY: 1});
		skyBox.shader = renderer.addShader(skyBoxShader()); 
		skyBox.sheet = skyBox.shader.addSheet("clouds", skyBox.cube);
		
		skyBox.cube = undefined;
		media.remove("skyBox");
		
		

	});	

var animLoopFunction = loadLoop;	
	
requestAnimationFrame(animLoopFunction);
function loadLoop(time) {
	renderer.fullPage();
	if(loader) {
		renderer.clear();
		loader.textContent = "Loading media... " + media.progress + "%";
	}
	requestAnimationFrame(animLoopFunction);
}
function mainLoop(time) {
	renderer.fullPage();
	const now = performance.now();
	renderer.clear();
	if(skyBox.shader.use()) {
		skyBox.sheet.colorI32 = 0xFF666666;
		if (mouse.button === 1) {
			if(mouse.dragging) {
				const f = skyBox.sheet.fov;
				skyBox.pos.yaw -= (mouse.x - mouse.oldX) / (canvas.width * (1/f));// Math.TAU;
				skyBox.pos.pitch += (mouse.y - mouse.oldY) / (canvas.height * (1/f));// Math.TAU;
				skyBox.pos.pitch = skyBox.pos.pitch < -Math.PI90 ? -Math.PI90 : skyBox.pos.pitch > Math.PI90 ?  Math.PI90 : skyBox.pos.pitch;
			} else {
				mouse.dragging = true;
			}
			mouse.oldX = mouse.x;
			mouse.oldY = mouse.y;
			
		} else {
			mouse.dragging = false;
		}
		const fov = skyBox.fov;
		if (mouse.wheel !== 0) {
			fov.pos -= Math.sign(mouse.wheel) / (Math.PI * 4);
			mouse.wheel -= Math.sign(mouse.wheel);
		}
		fov.real += (fov.chase = (fov.chase += (fov.pos - fov.real) * fov.acc) * fov.drag);
		skyBox.sheet.fov = fov.real;
		skyBox.sheet.direction(skyBox.pos.yaw, skyBox.pos.pitch);
		skyBox.sheet.draw();		
	}
	if(lines.shader.use()) {
		if (mouse.button === 1) {
			const x = mouse.x - canvas.width * 0.5;
			const y = mouse.y - canvas.height * 0.5;
			if (lines.lastPoint.x !== x || lines.lastPoint !== y || !lines.dragging) {
				if (lines.dragging) {
					//lines.sheet.lineTo(x, y, glUtils.RGBA2Int32Clamped(Math.rByte(), Math.rByte(), Math.rByte(), 255));
					lines.sheet.lineTo(x, y, lines.color);
				} else {
					lines.dragging = true;
					lines.color = glUtils.randRGBInt32();
					lines.sheet.moveTo(x, y, lines.color);
					lines.startPoint.x = x;
					lines.startPoint.y = y;
				}
				lines.lastPoint.x = x;
				lines.lastPoint.y = y;
			}
		} else {
			if(lines.dragging) {
				var radius = Math.max(Math.abs(lines.lastPoint.x - lines.startPoint.x), Math.abs(lines.lastPoint.y - lines.startPoint.y)) / 2;
				lines.sheet.rect(lines.startPoint.x, lines.startPoint.y, lines.lastPoint.x - lines.startPoint.x, lines.lastPoint.y - lines.startPoint.y, glUtils.randRGBInt32());
				lines.sheet.circle(
					(lines.lastPoint.x + lines.startPoint.x) / 2 + radius * 2, 
					(lines.lastPoint.y + lines.startPoint.y) / 2, 
					radius,
					glUtils.randRGBInt32()
				);
				
				lines.dragging = false;
			}
		}
		lines.sheet.draw();
	}
		
		
		
	
	frameRate(info, time, performance.now() - now);
	requestAnimationFrame(animLoopFunction);
}






