import {} from "../../code/MathExtensions.jsm";
import {display} from "../../code/display.jsm";
import {d2Overlay} from "../../code/d2Overlay.jsm";
import {mouse} from "../../code/mouse.jsm";
import {keyboard} from "../../code/keyboard.jsm";
import {gradientShader} from "../../code/gradientShader.jsm";
import {spriteShader} from "../../code/spriteShader.jsm";
import {pointShader} from "../../code/pointShader.jsm";
import {tileShader} from "../../code/tileShader.jsm";
import {glUtils} from "../../code/glUtils.jsm";
import {media} from "../../code/media.jsm";
import {linkedSprites} from "../../code/linkedSprites.jsm";
import {painterSceneReader} from "../../code/painterSceneReader.jsm";
import {structure} from "../../code/structure.jsm";
import {mapBuilder} from "../../code/structure.jsm";



function initGameKeys() {
	const k = keyboard;
	k.mode = "default";
	k.event(toggleHelp,"shift",["Slash"]);
	k.event(goHome,"",["Home"]);
	
	k.mode = "paused";
	k.action("resume","",["KeyP"]);
	k.action("exit","",["Escape"]);
	
	k.mode = "inplay";
	k.action("pause","",["KeyP"]);
	k.action("up","",["ArrowUp","KeyW"])
	k.action("down","",["ArrowDown","KeyS"])
	k.action("left","",["ArrowLeft","KeyA"])
	k.action("right","",["ArrowRight","KeyD"])
	k.action("triggerA","",["KeyZ","Space"]);
	k.action("triggerB","",["KeyX"]);
	k.action("triggerB","ctrl",["Space"]);
	k.action("deleteShaders","",["Escape"]);
}
initGameKeys();
keyboard.start();
keyboard.mode = "inplay";
var helpOn = false;
function toggleHelp() { helpOn = !helpOn };
function goHome() { location.href = "../../index.html" };
	



const TILE_ADD_COUNT = 3000;
const MAX_STARS = 1024;
const MAX_CLOUDS = 204;
const MAX_SPRITES = 124;
const cloudType = "threeTone";
var renderTime = 0;
var ready = false;
var blendModeTest = 0;
var loadProgress = 0;
var tileBackground, ground, gradient;
var maps = [];
var clouds,cloudSetup, stars, sprites,spriteSheet;
var x,y,xx = 0, yy=0,gyy=0, zoom = 1, angle = 0;
const wPos = {};
const angleRate = 0.001;
const moveRate = 0.005;
var innerX = 0;
var innerY = 0;
var innerStep = 1 / 32;
const minZoom = 0.02, maxZoom = 64, zoomRate = 1.1;
var nav = true;
var pitch = 0;
var lightDirection = Math.PI * 2;
var bgAtten = 100;
var lAttan = 6400;
var mainGLRender;
const bgColor = {r:0,g:0,b:0,a:0};
const workColor = {r:0,g:0,b:0,a:0};


var hopper;
function createScene() {
	
	hopper = linkedSprites();
	spriteSheet.clear();
	hopper.sheet = spriteSheet;
	painterSceneReader.load("../../media/HopperAnimTest.json", "Hopper.png", hopper)
		.then(()=>{
			hopper.createChain("all", hopper.namedSprites.Head);
			ready = true
		});

}

function updateHopper() {
	
	
	
	hopper.namedSprites.Head.x = xx;
	hopper.namedSprites.Head.y = yy;
	hopper.namedSprites.Head.update();
	
	
	
	
}




display.addRender(mainGLRender = ctx => {	
	if(ready && keyboard.actions.deleteShaders) {
		keyboard.actions.deleteShaders = false;
		gradient = display.renderer.removeShader("gradient");
		tileBackground = display.renderer.removeShader("background");
		stars = display.renderer.removeShader("stars");	
		clouds = display.renderer.removeShader("clouds");	
		sprites = display.renderer.removeShader("sprites");		
		helpOn = true;
		ready = false;
		display.renderer.clearColorDepth();
	}
	if(ready) {

	
		x = mouse.x / display.width;
		y = mouse.y / display.height;
		if(mouse.wheel > 0) {
			mouse.wheel -= 1;
			//zoom *= zoomRate;
			if(mouse.alt) {
				bgAtten*= 1.1;
			} else if(mouse.shift) {
				lAttan *= 1.1;
			} else if(mouse.ctrl) {
				lightDirection += 0.2;
			} else {
				pitch += 0.2;
			}
				
		} else if (mouse.wheel < 0) {
			mouse.wheel += 1;
			//zoom *= 1 / zoomRate;
			if(mouse.alt) {
				bgAtten /= 1.1;
			} else if(mouse.shift) {
				lAttan /= 1.1;
			} else if(mouse.ctrl) {
				lightDirection -= 0.2;
			} else {
				pitch -= 0.2;
			}
			
		}		
        zoom = zoom < minZoom ? minZoom : zoom > maxZoom ? maxZoom : zoom;		
		
	
		if(nav) {
			xx += ((x * ground.mapWidth)  - xx) * moveRate;
			yy += ((y * ground.mapHeight)  - yy) * moveRate;
		}
		updateHopper();
		
		const t = display.globalTime / 1000;
		if(mouse.right){
			nav = !nav;
			mouse.right = false;
			mouse.buttons = mouse.stickyButtons = 0;
		}		


		angle += angleRate;
	
		stars.sheet.setTransform(xx,yy,1,0);
		// Note that the clouds will glitch every ground.mapWidth * 20 seconds (128*256*20secs)
		clouds.sheet.setTransform((xx / 4 + ground.mapWidth / 2 + (display.globalTime / 20)) % (ground.mapWidth * 100), yy/4+ground.mapHeight/2,1,0);
		ground.setTransform(xx,gyy,zoom,0);
		spriteSheet.setTransform(xx,yy,zoom,0);
		//gradient.sheet.setCurves(x*2-1,y*2-1);
		gradient.sheet.setTransform(xx / ground.mapWidth, yy / ground.mapHeight,zoom,0);
		gradient.sheet.getColor(xx / ground.mapWidth, yy / ground.mapHeight, bgColor);
		
		if(cloudType === "scater") {
			clouds.sheet.cloudColours(2,bgColor);
			clouds.sheet.setCloudLight(lightDirection, pitch);
			clouds.sheet.setMainLightAttenuation(lAttan);
			clouds.sheet.setBackgroundAttenuation(bgAtten);
			clouds.sheet.setScaterAttenuation(bgAtten);
		} else if(cloudType === "threeTone") {
			//clouds.sheet.cloudColours(2,glUtils.RGBA.scaleRGB(0.8, bgColor, workColor));
			//clouds.sheet.cloudColours(1,glUtils.RGBA.scaleRGB(0.9, bgColor, workColor));
			//clouds.sheet.cloudColours(0,bgColor);
			
			clouds.sheet.setCloudLight(lightDirection, pitch, Math.PI/2);
		} else if(cloudType === "twoTone") {
			
		}


		
		const now = performance.now();
		display.renderer.clearDepth();
		if (gradient.use()) { gradient.sheet.draw() }
		//if (stars.use()) { stars.sheet.draw() }
		if (clouds.use()) { clouds.sheet.drawClouds(); display.renderer.clearDepth() }
		if (tileBackground.use()) { 
			ground.setMap(maps[1]);
			ground.setDepth((zoom / 0.5 - minZoom) / (maxZoom - minZoom));
			ground.setTransform(xx/2+ground.mapWidth/2,yy/2+ground.mapHeight/2,zoom/0.5,0);
			ground.setColor(64,167,255,Math.max((zoom  - minZoom) / (maxZoom - minZoom),0.4));
			ground.draw() 
			
			ground.setMap(maps[0]);
			ground.setDepth((zoom - minZoom) / (maxZoom - minZoom));			
			ground.setTransform(xx,yy,zoom,0);
			ground.setColorMix(0);
			ground.draw() 				
		
		}
		//if (sprites.use()) { spriteSheet.draw(true) }
		renderTime = performance.now() - now;

		if(mouse.stickyButtons || keyboard.actions.pause) {
			keyboard.actions.pause = false;
			keyboard.mode = "paused";
			mouse.stickyButtons = 0;
			display.stop();
			
		}


	}
});
var mainCanRender;
display.addRender(mainCanRender = c => {

	const ctx = overlay.ctx;
	const w = ctx.canvas.width;
	const h = ctx.canvas.height;
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0,0, w, h);
	
	if(helpOn) {
		
		ctx.font = "12px Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "left";
		let ly = 12;
		const step = 14;
		ctx.fillText("Time: " + renderTime.toFixed(3) + "ms", 10, ly += step);
		ctx.fillText(`Display: {W: ${display.width}, H: ${display.height}}`, 10, ly += step);
		ctx.fillText(`Mouse: {x: ${mouse.x}, y: ${mouse.y}}`, 10, ly += step);
		ctx.fillText(`Keyboard: Mode: ${keyboard.mode}, Last: ${keyboard.lastKey}`, 10, ly += step);

		


	} else if(ready) {	
		//ctx.fillRect(w / 2 | 0, 0, 1, h);
	    //ctx.fillRect(0, h / 2 | 0, w, 1);
		if (!display.isRunning) {
			ctx.font = "24px Arial";
			ctx.strokeStyle = ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText("Paused", w / 2, h / 2 -10);
		}
	} else if(!ready)  {
		ctx.font = "24px Arial";
		ctx.strokeStyle = ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Loading", w / 2, h / 2 -10);
		const t = display.globalTime / 300;
		let i = 0, x = w / 2, y = h / 2 + 20;
		ctx.beginPath();
		while (i < 5) {
			const size = (Math.sin(t + i) * 0.5 + 0.5) ** 0.75 * 5 * loadProgress;
			
			ctx.arc(x + (i - 2) * (20 + 10 * loadProgress), y, size, 0, Math.TAU);
			i++;
		}
		ctx.fill();
		i = 0;
		ctx.beginPath();
		while (i < 5) {
			const size = (Math.sin(t * 2 + i - (1-loadProgress) * Math.PI90) * 0.5 + 0.5) ** 0.75 * 5;
			ctx.moveTo(x + (i - 2) * (20 + 10 * loadProgress) + size, y);
			ctx.arc(x + (i - 2) * (20 + 10 * loadProgress), y, size, 0, Math.TAU);
			i++;
		}
		ctx.stroke();
		loadProgress += 0.001;
		if(loadProgress >= 1) { ready = true }
	}

});
display.addMonitor(() => {
	if(mouse.stickyButtons === 4){
		mouse.buttons = mouse.stickyButtons = 0;
		mouse.right = false;
		blendModeTest ++;
		mainGLRender();
		mainCanRender();
		console.log(glUtils.currentBlendModeStr);
	}
	if(mouse.stickyButtons === 2){
		mouse.buttons = mouse.stickyButtons = 0;
		mouse.center = false;
		blendModeTest && (blendModeTest --);
		mainGLRender();
		mainCanRender();
		console.log(glUtils.currentBlendModeStr);
	}	
	if(mouse.stickyButtons || keyboard.actions.resume) {
		keyboard.actions.resume = false;
		mouse.stickyButtons = 0;
		keyboard.mode = "inplay";

		display.start();
		
	}
	
});
display.init();
const overlay = d2Overlay.create("test",1);
display.fullPage();
mouse.setElement(display.canvas);
display.start();



media.load("tiles", "../../media/RockTileSet.png");
media.loadSpriteSheet("hopper", "../../media/hopper.png");
media.addEvent("loadingComplete", ()=> {
	gradient = display.renderer.addShader("gradient", gradientShader({}));
	tileBackground = display.renderer.addShader("background", tileShader({
		alphaCut: 0,
		useColor: true,
		useColor: true,
		mapBits: 8,  
		useDepth: true,
		fxTiles: false, 
		moveBits: 0, 
		indexBits: 0, 
		nullTileIdx: 18,
	}));
	stars = display.renderer.addShader("stars", pointShader({
		pointType: "stars",
		useColor: true,
		useDepth: true,
		fixColor: {r:255,g:255,b:1255,a:255}, // null or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		distanceColor: true,
		colorNear: {r:1255,g:1255,b:1255,a:1255},    // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		colorFar: {r:0,g:127,b:255,a:255},		
		distanceFade: true,
		customDistanceFade: true, // overrides distanceFade when true
		distanceFadeNear: 2, // needs  customDistanceFade = true && useDepth = true
		distanceFadeFar: 0.5, // needs  customDistanceFade = true && useDepth = true
		customDistanceScale: true,
		distanceScaleNear : 2,  // needs  customDistanceScale = true && useDepth = true
		distanceScaleFar : 1,   // needs  customDistanceScale = true && useDepth = true
		alphaCut: 0,  // range 0 - 255
		batchSize: MAX_STARS,
		falloff: 0.0,     // < 0 ease to alpha 1 , > 0 ease from alpha 0
	}));	
	clouds = display.renderer.addShader("clouds", pointShader({
		pointType: "clouds",
		cloudLightModel: cloudType,
		useColor: true,
		useDepth: true,
		fixColor: null, // null or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		near: 0.001,
		far: 0.2,
		distanceColor: true,
		colorNear: {r:255,g:255,b:255,a:255},    // or {r,g,b,a} each 0-255 can be out of range. Results are clamped
		colorFar: {r:192,g:240,b:255,a:255},	
		distanceFade: false,
		customDistanceFade: false, // overrides distanceFade when true
		distanceFadeNear: 1, // needs  customDistanceFade = true && useDepth = true
		distanceFadeFar: 0.5, // needs  customDistanceFade = true && useDepth = true
		customDistanceScale: false,
		distanceScaleNear : 20,  // needs  customDistanceScale = true && useDepth = true
		distanceScaleFar : 10,   // needs  customDistanceScale = true && useDepth = true
		alphaCut: 0,  // range 0 - 255
		batchSize: MAX_CLOUDS,
		falloff: 0.0,     // < 0 ease to alpha 1 , > 0 ease from alpha 0
	}));	
	sprites = display.renderer.addShader("sprites", spriteShader({
		useColor: true,
		useDepth: true,
		useRotate: true,
		useOffset: true,
		fixColor: null, // or {r,g,b,a} each 0-255
		alphaCut: 1.5,
		batchSize: MAX_SPRITES,

	}));
	
	gradient.sheet.setColor(0,100,196,255,255,0.8);
	gradient.sheet.setColor(1,100,196,255,255,0.8);
	gradient.sheet.setColor(2, 50, 70,255,255,0.8);
	gradient.sheet.setColor(3, 50, 70,255,255,0.8);
	
	const m = tileBackground.addMap("groundMap", 256, 256);
	const m1 = tileBackground.addMap("bgMap", 256+128, 256+128);
	const grass = [0,3,12,13,14,15,16,17];
	const fixerFilters = {
		any() {return true},
		notEmpty(v) { return v !== 18 },
		empty(v) {  return  v === 18 },
		isGrass(v) { return grass.includes(v) },
	};
	const a = fixerFilters.any;
	const E = fixerFilters.notEmpty;
	const e = fixerFilters.empty;
	const g = fixerFilters.isGrass;
	const groundFix = ["ground",
		[e,e,a,e,[12]], 
		[a,e,e,e,[15]], 
		[e,E,E,e,[8]], 
		[E,E,e,e,[11]],
		[g,E,E,E,[1]], 
		[E,E,g,E,[2]],
		[E,e,E,E,[13,14]], 
		[e,e,E,E,[0]], 
		[e,E,e,E,[28]], 
		[E,e,e,E,[3]], 
		[E,E,e,E,[7]], 
		[e,E,E,E,[4]], 
		[E,E,g,e,[19]],
		[g,E,E,e,[26]],				
		[E,a,E,e,[9,10]], 
		[E,e,E,e,[17,16]],
		[g,E,g,E,[32]],
		[e,E,g,E,[34]],
		[g,E,e,E,[35]],
		[e,E,g,e,[30]],
		[g,E,e,e,[31]],
		[g,E,g,e,[27]],
		[e,e,e,E,[24]],
		[e,E,e,e,[33]],
	];
	
	m1.tiles = m.tiles = {
		
		fixer: [
			["",        ],//0
			["corner", [g,E,g,E,[32]]],//1
			["",        ],//2
			["",        ],//3
			["corner",  [e,E,g,E,[34]]],//4
			groundFix,
			groundFix,
			["corner", [g,E,e,E,[35]]],//7
			["corner", [e,E,g,E,[34]]],//8
			["base",  [E,e,E,e,[17,16]],[E,E,g,e,[19]],[g,E,E,e,[26]]  ], //9
			["base",  [E,e,E,e,[17,16]],[E,E,g,e,[19]],[g,E,E,e,[26]]  ], // 10
			["",        ], //11
			["",        ], //12
			["",        ], //13
			["",        ], //14
			["",        ], //15
			["",        ], //16
			["",        ], //17
			["",		], //18
			["",        ], //19,
			["",        ], //20
			["",        ], //21
			["",        ], //22
			["",        ], //23
			["",        ], //24
			["",        ], //25
			["",        ], //26
			["",        ], //27
			["",		], //28
			["",        ], //29,
			["",        ], //30
			["",        ], //31
			["",        ], //32
			["",        ], //33
			["",        ], //34
			["",        ], //35
			["",        ], //36
			["",        ], //37
			groundFix, //38
			groundFix, //39,
			["",        ], //40
			["",        ], //41
			["",        ], //42
			["",        ], //43			
		
		],			
		empty: {
			tiles: [18],
		},
		ground: {
			tiles: [5,6,38,39],
		},

	};		
		
	
	const pathIn = [0,1,2,16,17,18,32,33,34];
	const pathOut = [48,33,49,18,177,16,64,1,65]
	m.fillRectRandom(m.tiles.empty.tiles);
	m1.fillRectRandom(m.tiles.empty.tiles);
	for(let i = 0; i < TILE_ADD_COUNT; i++) {
		const w = Math.randI(1,8);
		const h = Math.randI(1,8);
		const x = Math.randI(1,254 - w);
		const y = Math.randI(1,254 - h);
		m.fillRectRandom(m.tiles.ground.tiles,x,y,w,h);
		m1.fillRectRandom(m.tiles.ground.tiles,Math.randI(5,110+256),Math.randI(5,118+256),Math.randI(1,15),Math.randI(1,15));
	}
	for(let i = 0; i < TILE_ADD_COUNT >> 3; i++) {
		const w = Math.randI(1,8);
		const h = Math.randI(1,8);
		const x = Math.randI(1,254 - w);
		const y = Math.randI(1,254 - h);
		m.fillRectRandom(m.tiles.ground.tiles,x,y,w,h);		
		m.fillRectRandom(m.tiles.empty.tiles,Math.randI(10,228),Math.randI(10,228),Math.randI(1,8),Math.randI(1,8));
		m1.fillRectRandom(m.tiles.empty.tiles,Math.randI(5,110+256),Math.randI(5,118+256),Math.randI(1,15),Math.randI(1,15));
	}	
	mapBuilder(m);
	mapBuilder(m);
	mapBuilder(m);
	
	mapBuilder(m1);
	mapBuilder(m1);
	mapBuilder(m1);
	
	
	maps.push(m, m1);

	
		
	
	ground = tileBackground.addSheet("ground", media.named.tiles, 128, 128, "groundMap");
	ground.setMap(m1);

	spriteSheet = sprites.addSheet("hopper", media.named.hopper, media.named.hopper.sprites);
	media.remove("tiles");
	media.remove("hopper");
	for(let i = 0; i < MAX_SPRITES; i++) {
		//spriteSheet.addSprite(i, Math.randI(-256 * 64, 256 * 64), Math.randI(-256 * 64, 256 * 64), Math.rand(0.5,3),0.5,0.5,Math.rand(0,Math.TAU));
		spriteSheet.addSprite(i, Math.randI(0, 256 * 128), Math.randI(0, 256 * 128), Math.rand(1,13),0.5,0.5,Math.rand(0,Math.TAU));
	}
	
	
	stars.utils.createStarField(2024, 1, 2, 0.0, 0.4, 12, 4);
	cloudSetup = clouds.utils.createCloudySky(2024, 30, 45, 5, 10,0.001, 0.2, glUtils.toRGBA8Clamp(255,255,255,255), 1, -0.5);
	clouds.sheet.cloudColours(0,glUtils.toRGBA(255,255,255,255));
	clouds.sheet.cloudColours(1,glUtils.toRGBA(245,250,255));
	clouds.sheet.cloudColours(2,glUtils.toRGBA(220,230,240));

	
	createScene();
	
});




