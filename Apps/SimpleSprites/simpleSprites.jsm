import {} from "../../src/utils/MathExtensions.jsm";
import {$, $$} from "../../src/DOM/geeQry.jsm";
import {media} from "../../src/utils/media.jsm";
import {startMouse} from "../../src/DOM/mouse.jsm";
import {glUtils} from "../../src/webGL/glUtils.jsm";
import {frameRate} from "../../src/utils/frameRate.jsm";
import {boxedSpriteSheet} from "../../src/utils/boxedSpriteSheet.jsm";
import {renderer} from "../../src/webGL/renderer.jsm";
import {spriteShader} from "../../src/webGL/shaders/spriteShader.jsm";
import {rocks} from "./rocks.jsm";
import {playfield} from "./playfield.jsm";
import {displayNumber} from "./displayNumber.jsm";
import {planet} from "./planet.jsm";




const SCORE_X = 40; // from right edge in pixels
const SCORE_Y = 40; // from top edge in pixels
const space = {
	name: "space",
	URL: "SpaceSpritesPlanet.png",
	shader: null,
	sheet: null,
};
const maxSprites = 256*256;
const itemAddCount = 100;
var frameLimit = false, limitCount = 0, itemCount = 0, rockSet;

const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "Running mean Frames per second\nPercent of frame running code.\nTotal number of sprites"}); 
var loader = $("h1",{className: "loader"}); 
$$(document.body, canvas, info, loader); 

const mouse = startMouse(true);

renderer.create(canvas); 
renderer.backgroundColor = {r: 0.02, g: 0.06, b: 0.1, a: 1};
renderer.fullPage();
playfield.mouse = mouse;
playfield.canvas = canvas;
playfield.score = 0;
playfield.startView();


media.oncomplete = () => { }
media.loadImage(space.name, space.URL)
    .then(image => { 
	    const unboxed = boxedSpriteSheet(image);
		space.shader = renderer.addShader(spriteShader({batchSize: maxSprites, maxSpritesPerSheet: unboxed.sprites.length})); 
		space.sheet = space.shader.addSheet(space.name, unboxed, unboxed.sprites);
		space.sheet.spriteRef = unboxed.sprites;
		media.remove(space.name);
		space.planet = planet(space.sheet, playfield);
		playfield.mass = space.planet.mass;
		rockSet = rocks(mouse, playfield, space.sheet, space);
		addSprites();
		loader.textContent = "Right click to add 100 Rocks";
	});	
requestAnimationFrame(mainLoop);
function mainLoop(time) {
	renderer.fullPage();
	if (mouse.button === 4) {
		mouse.button = 0;
		addSprites(); 
		loader.style.display = "none";
	}
	if (space.shader && space.shader.use()) { 
	    const now = performance.now();
	    playfield.updateView(space.sheet);
		renderer.clear();
	    rockSet.update();
		space.planet.update();
		space.scoreDisplay.update(playfield.score | 0, SCORE_X, SCORE_Y);
		renderer.blendModes.standard(); 
		space.sheet.flush(true);
		frameRate(info, time, performance.now() - now);

	} else if(loader) {
		renderer.clear();
		loader.textContent = "Loading media... " + media.progress + "%";
	}
	requestAnimationFrame(mainLoop);
}
function addSprites() {
	itemCount += itemAddCount;
	space.sheet.clear();	
	rockSet.create(itemCount);
	space.planet.create();
	space.scoreDisplay = displayNumber("000,000,000",0, space.sheet, playfield );
	

}





