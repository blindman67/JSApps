import {} from "../../src/utils/MathExtensions.jsm";
import {$, $$} from "../../src/DOM/geeQry.jsm";
import {} from "../../src/DOM/errorReporter.jsm";
import {media} from "../../src/utils/media.jsm";
import {startMouse} from "../../src/DOM/mouse.jsm";
import {glUtils} from "../../src/webGL/glUtils.jsm";
import {Texture} from "../../src/webGL/texture.jsm";
import {frameRate} from "../../src/utils/frameRate.jsm";
import {boxedSpriteSheet} from "../../src/utils/boxedSpriteSheet.jsm";
import {renderer} from "../../src/webGL/renderer.jsm";
import {spriteShader} from "../../src/webGL/shaders/spriteShader.jsm";
//import {sphereShader} from "../../src/webGL/shaders/sphereShader.jsm";
import {flatShader} from "../../src/webGL/shaders/flatShader.jsm";
import {rocks} from "./rocks.jsm";
import {playfield} from "./playfield.jsm";
import {displayNumber} from "./displayNumber.jsm";
import {planet} from "./planet.jsm";




const SCORE_X = 40; // from right edge in pixels
const SCORE_Y = 40; // from top edge in pixels
const space = {
	name: "space",
	URL: "SpaceSpritesPlanet.png",
	media: [["rockSprites", "RockFXSprites.png"],["planetImage","RockFXSprites.png"]],
	playfield,
	shaders: {},
	sheets: {},
};
const maxSprites = 256*256;
const itemAddCount = 100;
var frameLimit = false, limitCount = 0, itemCount = 0, rockSet;

const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "Running mean Frames per second\nPercent of frame running code.\nTotal number of sprites"}); 
var loader = $("h1",{className: "loader"}); 
$$(document.body, canvas, info, loader); 

space.mouse = startMouse(true);

renderer.create(canvas); 
renderer.backgroundColor = {r: 0.02, g: 0.06, b: 0.1, a: 1};
renderer.fullPage();
playfield.game = space;
playfield.canvas = canvas;
playfield.score = 0;
playfield.startView();


media.oncomplete = () => { }
media.loadImages(space.media)
    .then(() => { 
		
	    const unboxed = boxedSpriteSheet(media.getByName("rockSprites"));
		space.shaders.sprites = renderer.addShader(spriteShader({batchSize: maxSprites, maxSpritesPerSheet: unboxed.sprites.length})); 
		space.sheets.rockFX = space.shaders.sprites.addSheet("rockSprites", unboxed, unboxed.sprites);
		space.sheets.rockFX.spriteRef = unboxed.sprites;
		
		space.destTexture = Texture(renderer.context, {width: 1024, height: 1024}).fromArray(null);
		renderer.createDest("test", space.destTexture);
		
		space.shaders.flat = renderer.addShader(flatShader({}));
		space.sheets.test = space.shaders.flat.addSheet("test", space.destTexture);
		space.sheets.test.scaleY = 1;
		
		media.remove("rockSprites");
		media.remove("planetImage");
		space.planet = planet(space);
		playfield.mass = space.planet.mass;
		rockSet = rocks(space);
		addSprites();
		loader.textContent = "Right click to add 100 Rocks";
	});	
requestAnimationFrame(mainLoop);
function mainLoop(time) {
	renderer.fullPage();
	if (space.mouse.button === 4) {
		space.mouse.button = 0;
		addSprites(); 
		loader.style.display = "none";
	}
	if (space.shaders.sprites && space.shaders.sprites.use()) { 
	    const now = performance.now();
	    playfield.updateView(space.sheets.rockFX);
		renderer.dest = "test";
		renderer.clear();
	    rockSet.update();
		space.planet.update();
		space.scoreDisplay.update(Math.round(playfield.score), SCORE_X, SCORE_Y);
		space.popDisplay.update(Math.round(space.planet.population), SCORE_X, SCORE_Y);
		renderer.blendModes.standard(); 
		space.sheets.rockFX.flush(true);
		
		renderer.dest = undefined;
		renderer.clear();
		
		space.shaders.flat.use();
		renderer.blendModes.lighten(); 
		space.sheets.test.zIndex = 0;
		space.sheets.test.draw();
		frameRate(info, time, performance.now() - now);

	} else if(loader) {
		renderer.clear();
		loader.textContent = "Loading media... " + media.progress + "%";
	}
	requestAnimationFrame(mainLoop);
}
function addSprites() {
	itemCount += itemAddCount;
	space.sheets.rockFX.clear();	
	rockSet.create(itemCount);
	space.planet.create();
	space.scoreDisplay = displayNumber("0,000,000,00",0, space, playfield.topRight, -1 );
	space.popDisplay = displayNumber("0,000,000,000",0, space, playfield.topLeft, 1 );
	

}





