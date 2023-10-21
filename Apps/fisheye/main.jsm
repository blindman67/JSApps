import {} from "../../src/utils/MathExtensions.jsm";
import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {} from "../../src/DOM/errorReporter.jsm";
import {media} from "../../src/utils/media.jsm";
import {startMouse} from "../../src/DOM/mouse.jsm";
import {glUtils} from "../../src/webGL/glUtils.jsm";
import {Texture} from "../../src/webGL/texture.jsm";
import {frameRate} from "../../src/utils/frameRate.jsm";
import {renderer} from "../../src/webGL/renderer.jsm";
import {fisheyeShader} from "../../standalone/webGL/shaders/fisheyeShader.jsm";



var flashing = true;
var handle
function flashInfo(text, time = 4000, color = "white") {
	if(!flashing) {
		$$(document.body, loader);
		flashing = true;
		loader.style.color = color;
		loader.textContent = text;
		handle = setTimeout(() => {
			$R(document.body, loader);
			flashing = false;
		}, time);
	} else {
		$R(document.body, loader);
		flashing = false;
		clearTimeout(handle);
		flashInfo(text, time, color);
	}
}


const images = "fishEye.jpg,fishEye_2.jpg,fishEye_3.jpg".split(",");
var currentImage = 0;
const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "FPS: Running mean Frames per second\nLoad: Percentage of frame in main loop"}); 
var loader = $("h1",{className: "loader", textContent: "loading"}); 
$$(document.body, canvas, info, loader); 
media.loadImage("fisheye", "fisheye.jpg");
const mouse = startMouse(true, true);
renderer.create(canvas); 
renderer.backgroundColor = {r: 0.02, g: 0.06, b: 0.1, a: 1};
//renderer.fullPage();
const fishEye = fisheyeShader();


var animLoopFunction = loadingLoop;	
media.oncomplete = () => {
	fishEye.init(renderer.context, Texture(renderer.context).fromImage(media.getByName("fisheye")));
	$R(document.body, loader);
	flashing = false;
	animLoopFunction = mainLoop;	
}
 


var animLoopFunction = loadingLoop;	
requestAnimationFrame(animLoopFunction);
function loadingLoop(time) {
	
	
	requestAnimationFrame(animLoopFunction);
}
	
function mainLoop(time) {
	if(mouse.button === 4) {
		currentImage += 1;
		mouse.button = 0;
		flashInfo("Loading", 2000);
		media.loadImage("fishEye",images[currentImage % images.length])
			.then(img => {
				fishEye.scale = 1;
				fishEye.texture = Texture(renderer.context).fromImage(media.getByName("fishEye"));
			})
			.catch(() => {
				flashInfo("Image load failed!!!", 2000, "red");
			});
		
	}
	renderer.fullPage();
	const now = performance.now();
	renderer.clear();
	if(fishEye.use) {
		if(mouse.wheel) {
			fishEye.scale += mouse.wheel / 100;
			flashInfo("Scaled", 200, "yellow");
			mouse.wheel = 0;
		}
		const yaw = (mouse.x / canvas.width + 0.5) * Math.PI;
		const pitch = ((1-mouse.y / canvas.height) + 0.5) * Math.PI;
		fishEye.yaw = yaw;
		fishEye.pitch = pitch;
		
		fishEye.draw();
	}
	frameRate(info, time, performance.now() - now);
	requestAnimationFrame(animLoopFunction);
}






