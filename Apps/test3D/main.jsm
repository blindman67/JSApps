import {} from "../../src/utils/MathExtensions.jsm";
import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {} from "../../src/DOM/errorReporter.jsm";
import {Flasher} from "../../src/DOM/Flasher.jsm";
import {media} from "../../src/utils/media.jsm";
import {startMouse} from "../../src/DOM/mouse.jsm";
import {simpleKeyboard} from "../../src/DOM/keyboard.jsm";
import {glUtils} from "../../src/webGL/glUtils.jsm";
import {Colors} from "../../standalone/webGL/glUtils.jsm";
import {Vec3} from "../../src/Vec3.jsm";
import {Plane, PlanePath} from "../../src/Plane.jsm";
import {Mat4} from "../../src/Mat4.jsm";
import {Camera} from "../../src/Camera.jsm";
import {Projection} from "../../src/Projection.jsm";
import {Lights} from "../../src/Lights.jsm";
import {Texture} from "../../src/webGL/texture.jsm";
import {geometryPrimitives, geometry} from "../../src/geometryPrimitives.jsm";
import {frameRate} from "../../src/utils/frameRate.jsm";
import {renderer} from "../../src/webGL/renderer.jsm";
import {geom3DShader, geom3DInstShader} from "../../standalone/webGL/shaders/geom3DShader.jsm";
import {lineShader} from "../../standalone/webGL/shaders/lineShader.jsm";
import {skyShader} from "../../standalone/webGL/shaders/skyShader.jsm";


const keyboard = simpleKeyboard();
keyboard.addKey("ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "KeyG", "KeyV");
const keys = keyboard.keys;



const numbers = {
	rows: [56,200,290],
	columns: [50,135,197,260,327,394,450,512,578,648,710,756],
	paths: [[293, 62, 296.1, 62.4, 298, 66, 297.3, 74.9, 296, 86, 295.1, 97.5, 297, 107, 307, 110.1, 317, 112, 319.2, 115.3, 318, 118, 307.1, 116.1, 296, 115, 294.9, 123.3, 295, 132, 291.5, 134.4, 288, 134, 288.5, 125, 288, 116, 277.6, 117, 267, 119, 264.6, 116.9, 265, 113, 268.8, 105.2, 274, 96, 277.9, 87.5, 282, 79, 287.7, 69.1, 293, 62], 
		[428, 63, 435.3, 64.5, 439, 68, 431.5, 69.8, 422, 72, 416.9, 75.6, 413, 81, 409.1, 92.7, 408, 103, 415.7, 101.7, 425, 99, 432.2, 102.2, 438, 107, 440.6, 112.5, 441, 119, 437.2, 129.1, 432, 138, 426.3, 139.5, 420, 138, 412.6, 134.4, 406, 129, 403, 120.3, 402, 111, 403, 103.4, 405, 96, 405.9, 88.1, 409, 80, 418.1, 70.4, 428, 63],
		[495, 64, 502, 65.7, 506, 70, 501.5, 80.8, 494, 94, 487.8, 106.5, 483, 118, 481.9, 127.1, 481, 134, 475.5, 138.9, 471, 140, 474.2, 130.4, 480, 117, 484.5, 105.9, 489, 95, 495.2, 82.5, 498, 73, 492.2, 71.5, 483, 73, 474.2, 73.4, 467, 73, 464.2, 70.1, 464, 67, 470.2, 65.7, 479, 65, 487.3, 64, 495, 64],
		[545, 64, 553.9, 63.8, 562, 66, 566.6, 71.4, 569, 78, 565, 86.1, 561, 94, 564.6, 98.5, 569, 103, 570, 110.3, 569, 118, 563.3, 125.8, 556, 132, 547.3, 132.6, 539, 131, 533.7, 126.6, 530, 121, 529.6, 114.1, 531, 107, 535.5, 101.1, 539, 96, 534.9, 92.5, 530, 89, 528.9, 84.4, 530, 79, 536.7, 70.9, 545, 64],
		[375, 66, 381, 66, 384, 67, 385.4, 70, 385, 73, 378.7, 73.4, 370, 73, 361.2, 71.5, 354, 73, 350.8, 84, 350, 95, 356, 95.5, 364, 94, 371.9, 94.6, 378, 98, 378.7, 109.1, 377, 121, 372.3, 128, 366, 133, 358.2, 136.7, 350, 137, 342.1, 126.7, 336, 116, 339.4, 113.7, 344, 114, 344.4, 119.8, 345, 126, 349.9, 128.2, 356, 128, 364.1, 121.2, 371, 113, 371.8, 105.3, 369, 99, 356.3, 99, 344, 99, 344.3, 92.5, 348, 84, 347.6, 75.2, 350, 68, 362.1, 65.9, 375, 66],
		[684, 66, 690.8, 70.9, 696, 78, 697.4, 86.1, 697, 95, 696.8, 103.8, 695, 113, 690.2, 123.9, 684, 133, 677, 135.4, 670, 135, 664.5, 129.9, 660, 123, 656.3, 117.3, 654, 110, 653.6, 97.6, 655, 85, 659.6, 77, 666, 71, 674.9, 67.2, 684, 66],
		[104, 67, 107.6, 66, 110, 68, 110.3, 76.7, 110, 88, 110.5, 98, 111, 108, 110.3, 119.3, 111, 128, 116.4, 128.5, 122, 128, 124, 132, 124, 136, 117.3, 136.6, 108, 136, 98.3, 136.5, 91, 136, 91, 132.5, 93, 129, 97.6, 129.8, 102, 129, 102.5, 117.4, 102, 102, 103.2, 85.4, 103, 74, 98.2, 78.8, 93, 86, 90.6, 85.6, 90, 83, 96.6, 74.8, 104, 67],
		[221, 67, 232.9, 68.9, 244, 73, 247.4, 81.3, 248, 90, 243.3, 95, 239, 100, 243.5, 108.9, 248, 118, 245, 124.6, 239, 130, 227.5, 133.6, 216, 135, 209.9, 130.2, 206, 124, 205.4, 117, 207, 113, 211.7, 121.6, 218, 131, 226.2, 130.8, 234, 128, 238.7, 124.7, 241, 120, 237.5, 111.2, 232, 103, 223.7, 102, 216, 102, 213.4, 99, 214, 96, 225.6, 95.5, 238, 95, 242.3, 92.6, 244, 89, 243.2, 82.5, 241, 76, 237.4, 72.4, 232, 71, 220.7, 77.1, 210, 83, 208.1, 79.8, 209, 75, 213.9, 70.4, 221, 67],
		[547, 68, 541.4, 70, 537, 74, 534, 81, 534, 88, 545.1, 91.7, 557, 93, 562, 84.5, 564, 75, 556.2, 70.5, 547, 68],
		[607, 67, 616, 68.3, 624, 72, 626.9, 79.3, 628, 88, 630.4, 95.8, 631, 104, 627.7, 113.8, 622, 123, 612.1, 129.3, 602, 133, 595.1, 129.8, 590, 125, 588.7, 120.7, 589, 117, 591.3, 115.8, 594, 116, 595.3, 121.4, 597, 127, 602.1, 129.4, 608, 129, 615.6, 118.2, 622, 106, 623.5, 98.7, 622, 95, 615.5, 100.6, 608, 107, 601.6, 106.9, 596, 105, 592.9, 102.4, 591, 98, 589.9, 88.2, 591, 78, 598.2, 71.4, 607, 67],
		[162, 68, 172.4, 68.5, 182, 71, 186, 76.7, 187, 84, 180.4, 94.4, 171, 106, 160.9, 118.8, 156, 128, 166, 126.9, 179, 124, 186.7, 125.9, 192, 129, 193.2, 133.4, 192, 137, 184.4, 134.3, 174, 131, 159.9, 133.2, 149, 134, 151.7, 125.6, 159, 115, 165.4, 107.4, 172, 100, 178.6, 91.1, 183, 83, 182, 77.8, 179, 74, 173.3, 72.7, 167, 73, 161.5, 76.8, 156, 82, 149.4, 87.5, 144, 91, 142.2, 88.8, 142, 85, 144.6, 80.6, 149, 76, 154.7, 71.3, 162, 68],
		[686, 70, 677.6, 70.7, 669, 74, 663.2, 79.1, 659, 86, 657.3, 97, 658, 109, 663.9, 121.2, 671, 131, 676.1, 132.2, 681, 130, 686.5, 121.7, 691, 112, 692.1, 105.3, 692, 99, 693, 91.6, 693, 84, 690.5, 76, 686, 70],
		[609, 71, 600.8, 75.5, 594, 82, 595.7, 92.7, 600, 102, 609, 99.5, 618, 94, 621.6, 88.1, 623, 82, 621.1, 76.5, 618, 72, 614, 70.5, 609, 71],
		[289, 75, 285, 81.2, 280, 92, 274.9, 102.2, 273, 110, 280.8, 110.4, 289, 108, 289.5, 101, 288, 92, 289, 81.4, 289, 75],
		[551, 97, 544.2, 101.9, 539, 109, 540.4, 119, 544, 128, 550.9, 128.8, 558, 127, 562.2, 122.6, 565, 117, 566.1, 110.3, 565, 104, 558.5, 99.5, 551, 97],
		[429, 106, 418.7, 108.5, 410, 113, 414.2, 121.8, 421, 130, 427.8, 130.9, 434, 129, 436.4, 121.3, 437, 113, 433.9, 108.5, 429, 106],
		[731, 121, 736.6, 121.6, 742, 124, 743, 129.1, 742, 134, 734.9, 134.9, 728, 134, 728.5, 127.4, 731, 121],
		[118, 224, 122.5, 224.6, 125, 226, 125.1, 229, 123, 232, 114.2, 233, 103, 233, 91.5, 233, 83, 232, 83, 229, 86, 226, 93.1, 225.2, 102, 225, 110.6, 224.3, 118, 224]
	],
	getPath(col, row) {
		const x1 = this.columns[col];
		const x2 = this.columns[col + 1];
		const y1 = this.rows[row];
		const y2 = this.rows[row + 1];
		const paths = [];
		for(const p of this.paths) {
			if(p[0] > x1 && p[0] < x2 && p[1] > y1 && p[1] < y2) { 
				paths.push(p);
				p.pop();
				p.pop();
			}
		}
		return paths;
	}
}


const treeSeed = Math.randI(0,100000);
const wV1 = new Vec3(), wV2 = new Vec3(), wV3 = new Vec3(), wV4 = new Vec3(); // working vectors
const images = "fishEye.jpg,fishEye_2.jpg,fishEye_3.jpg".split(",");
var currentImage = 0;
const canvas = $("canvas",{className: "mainCanvas"});
const info = $("div",{className: "info", title: "FPS: Running mean Frames per second\nLoad: Percentage of frame in main loop"}); 
var loader = $("h1",{className: "loader", textContent: "loading"}); 
$$(document.body, canvas, info); 
const flashInfo = Flasher(loader);
const mouse = startMouse(true, true);
renderer.create(canvas, {preserveDrawingBuffer: true, antialias: false}); 
renderer.backgroundColor = {r: 0.0, g: 0.0, b: 0, a: 1};
renderer.fullPage();
const camera = new Camera(new Vec3(0,0,0), new Vec3(0,0,0));
const view = new Projection();
view.init(Math.PI / 3,1,200).update(canvas.width, canvas.height);
const pos = camera.position;
const lookat = camera.lookat;

media.loadImage("", "color.png").then(image => { objTextured.textures.colorTex = Texture(renderer.context, {image, wrapX: "REPEAT", wrapY: "REPEAT", mipMap: true}) });
media.loadImage("", "normal.png").then(image => { objTextured.textures.normalTex = Texture(renderer.context, {image, wrapX: "REPEAT", wrapY: "REPEAT", mipMap: true}) });
media.loadImage("", "mask.png").then(image => { objTextured.textures.maskTex = Texture(renderer.context, {image, wrapX: "REPEAT", wrapY: "REPEAT", mipMap: true}) });
media.loadImage("", "tileMap.png").then(image => { objLand.textures.colorTex = Texture(renderer.context, {image, wrapX: "REPEAT", wrapY: "REPEAT", mipMap: true}) });
const camDir = new Vec3(0,0,0);
camDir.w = 0;
const MOVE_DRAG = 0.95;	
const MOVE_ACC = 0.03;
const MOVE_SPEED = -0.2;


const dbv1 = new Vec3();
const dbv2 = new Vec3();
const dbv3 = new Vec3();
const dbv4 = new Vec3();
const dbv5 = new Vec3();
geometry.setDebugVec(0, dbv1);
geometry.setDebugVec(1, dbv2);
geometry.setDebugVec(2, dbv3);
geometry.setDebugVec(3, dbv4);
geometry.setDebugVec(4, dbv5);



const lights = Lights();
lights.add("main", new Vec3(0, 50,-110), new Vec3(2,2,2));
//lights.add("back", new Vec3(12,-10, 22), new Vec3(0.4,0.8,1));
lights.add("back1", new Vec3(-120,-10, 202), new Vec3(0.1,0.3,0.5));
lights.setAmbient(new Vec3(0.05, 0.12, 0.2));
const box = geometryPrimitives.createSmoothGrouped("box", 0.1, 1); //geometry.addNormals(geometry.seperateFaces(geometryPrimitives.box(1)));
const rect = geometryPrimitives.createSmoothGrouped("rect", 0.1, 2, 0.3, 0.3); //geometry.join(geometry.addNormals(geometry.seperateFaces(geometryPrimitives.rect(1,1,5))), 0.05, 0.1);
const cone = geometry.vetMesh(geometry.addNormals(geometry.seperateFaces(geometryPrimitives.cone(10,3,0.4))));
//const rod = geometry.vetMesh(geometry.addNormals(geometry.seperateFaces(geometryPrimitives.rod(12, 0.5, 0.15, 0.125, false, false))));
const rod = geometry.vetMesh(geometry.addNormals(geometry.translate(geometryPrimitives.rod(8, 0.55, 0.15, 0.125, false, false), 0, -0.01, 0)));
const sphere = geometry.addNormals(geometryPrimitives.sphere(9,0.6));
const disk = geometry.addNormals(geometry.seperateFaces(geometryPrimitives.disk(10,1)));
const circle = geometry.addNormals(geometry.seperateFaces(geometryPrimitives.circle(32,2,1.9)));
const tube = geometry.addNormals(geometry.seperateFaces(geometryPrimitives.tube(24,1,1,0.5)));
const hFunc = (x,y) => -0.1;//(Math.sin(x / 10) * Math.sin(y / 10)) * 5 + (Math.sin(x / 2) * Math.sin(y / 2)) * 1;
const plane = geometryPrimitives.plane(16,16,128,128, hFunc);
//const pp = new Plane(new Vec3(26.2, -2, 10.5), new Vec3(0,5,0), new Vec3(-8, 0, 0) );
//const pp = new Plane(new Vec3(2, -4, 2), new Vec3(0,5,0), new Vec3(8, 0,8.001) );
//const pp1 = new Plane(new Vec3(1,1,1), new Vec3(8,0,0), new Vec3(0,0,8) );
//const pp1Path2D = [];
//for(let i = 0; i < Math.PI * 2; i += 0.5) {
//	pp1Path2D.push(Math.cos(i) * 0.4 + 0.5, Math.sin(i) * 0.4 + 0.5);
//}
//const ppP = new PlanePath(pp1, pp1Path2D);


//var planeSliced = geometry.clone(geometry.slice(plane, pp));
//planeSliced.newFaces = plane.newFaces;
//plane.newFaces = undefined;
 geometry.land.extrude(plane, [48,49,50,51,52,53], new Vec3(0,0.5,0));
 //geometry.land.extrudeByEdge(plane, [136,137,138,139,140, 156,155,154,153,152], new Vec3(0,0.5,0));
 geometry.selectFacesByVert(plane,"up", [136,137,138,139,140, 156,155,154,153,152], true);
 geometry.land.extrudeBySelection(plane,"up", new Vec3(0,0.5,0));
 geometry.mapTileTexture(geometry.addNormals(geometry.seperateFaces(plane)),[33,34]);
 geometry.retileTexture(plane, [0,1,11,12], "up");
 
 const extrude = [-4,4, 0,4, 4,4]
 function createNumberGeom(idx, extrude) {
	const num1 = geometry.reversePath3D(geometry.centerPath3D(geometry.path2DTo3D(numbers.getPath(idx,0)[0], "x", "z")));
	return geometry.mapFaceTexture(geometry.rotate90(geometry.rotate90(geometry.rotate90(geometry.scale(geometry.addNormals(geometry.seperateFaces(geometryPrimitives.meshPathExtrudePath(num1, extrude , true, true))), 0.04), "y", "z"), "x", "z"), "x", "z"),0.7);
 }
//const num1 = geometry.reversePath3D(geometry.centerPath3D(geometry.path2DTo3D(numbers.getPath(0,0)[0], "x", "z")));

const num1 = createNumberGeom(0, extrude);
const num2 = createNumberGeom(1, extrude);
const num3 = createNumberGeom(2, extrude);

//const path = geometry.rotate90(geometry.rotate90(geometry.rotate90(geometry.scale(geometry.addNormals(geometry.seperateFaces(geometryPrimitives.meshPathExtrudePath(num1, extrude , true, true))), 0.04), "y", "z"), "x", "z"), "x", "z");
//[0,10, 10,0, 0,10, 10,10, 10,0, 10,-10, 0,-30]
const shader = geom3DShader({lights});
const shaderTex = geom3DShader({lights});
shaderTex.method = "texturedNormMask";
const texturedTile = {
	TEX_WIDTH: (128 * 11).toFixed(0),
	TEX_HEIGHT: (128 * 4).toFixed(0),
	TILE_WIDTH: (128).toFixed(0),
	TILE_HEIGHT: (128).toFixed(0),
	TILE_COLS: (11).toFixed(0),
	TILE_ROWS: (4).toFixed(0),
	HALF_PIXEL_SIZE: "vec2(0.5 / float(11 * 128), 0.5 / float(4 * 128))",
	TILE_UNIT_SIZE: "vec2(1.0 / 11.0, 1.0 / 4.0)",
};

const shaderLand = geom3DShader({lights, include: {texturedTile}});
shaderLand.method = "texturedTile";

const instShader = geom3DInstShader({lights});
const skyColors = Colors();
skyColors.add("east", 0x5599FFFF);
skyColors.add("west", 0x2277AAFF);
skyColors.add("down", 0x664433FF);
skyColors.add("sun", 0xFFCCAAFF);
const sky = skyShader({colors: skyColors.named});
sky.method = "sun";

const debugLineShader = lineShader({});
shader.addGeom("rod", rod); 
shader.addGeom("sphere", sphere); 
//shader.addGeom("path", path); 
shaderLand.addGeom("plane", plane); 

instShader.addGeom("rod", rod); 
instShader.addGeom("sphere", sphere); 

//shaderTex.addGeom("path", geometry.mapTexture(path, new Vec3(0,0,0), new Vec3(0, 1, 1), new Vec3(1, 1, 0)));
shaderTex.addGeom("num1", num1);
shaderTex.addGeom("num2", num2);
shaderTex.addGeom("num3", num3);
const nums = ["num1", "num2", "num3"];

const obj = {
	matrix: new Mat4().useFloat32Array(),
	color: new Float32Array([1,0.3,0.1]),
	specular: new Float32Array([80,0.7]),
	cullBackface: true,
};
obj.matrix.save();
const obj1 = {
	matrix: new Mat4().useFloat32Array(),
	color: new Float32Array([1,0.3,0.1]),
	specular: new Float32Array([80,0.7]),
	cullBackface: true,
};
const objTextured = {
	matrix: new Mat4().useFloat32Array(),
	color: new Float32Array([1,0.3,0.1]),
	specular: new Float32Array([8,2]),
	cullBackface: true,
	textures: {},
};
const objLand = {
	matrix: new Mat4().useFloat32Array(),
	color: new Float32Array([1,0.3,0.1]),
	specular: new Float32Array([2,0.1]),
	tileSize: new Uint32Array([128,128, 11 , 4]),
	cullBackface: true,
	textures: {},
};
const cols = {
	temp: new Float32Array([1,0.3,0.1]),
	red: new Float32Array([1,0.3,0.1]),
	reds: [new Float32Array([1,0.2,0.1]), new Float32Array([1.5,0.3,0.1]), new Float32Array([1.0,0.1,0.5])],
	greens: [new Float32Array([0.2,1,0.1]), new Float32Array([0.3,0.8, 0.1]), new Float32Array([0.5, 0.85,0.1])],
	green: new Float32Array([0.3,1,0.1]),
	greenDk: new Float32Array([0.5,0.3,0.01]),
	brown: new Float32Array([0.4,0.2,0.1]),
	blue: new Float32Array([0.1,0.3,1]),
	yellow: new Float32Array([1,1,0.2]),
	cyan: new Float32Array([0.2,1,1]),
	magenta: new Float32Array([1,0.2,1]),
	white: new Float32Array([1,1,1]),
	gray: new Float32Array([0.5,0.5,0.5]),
	grayDk: new Float32Array([0.25,0.25,0.25]),
	whiteINT: 0xFFFFFFFF,
	redINT: 0xFF0000FF,
	greenINT: 0xFF00FF00,
	blueINT: 0xFFFF0000,
	cyanINT: 0xFFFFFF00,
	magentaINT: 0xFFFF00FF,
	yellowINT: 0xFF00FFFF,
	blackINT: 0xFF000000,
	grayINT: 0xFF999999,
}
	
const dir = new Vec3(0,0,0);
const pos1 = new Vec3(0,0,0);
var scaleCut = 0.5;
shader.init(renderer.context);
instShader.init(renderer.context);
shaderTex.init(renderer.context);
shaderLand.init(renderer.context);
sky.init(renderer.context);
var sunTime = 0;
sky.setUniform("sunPos",new Float32Array([0,Math.cos(sunTime), Math.sin(sunTime)]));
debugLineShader.init(renderer.context);
debugLineShader.clear(); // creates an instance buffer

debugLineShader.addLine(wV1.init(-100, 0, 0), wV2.init(100, 0, 0), cols.redINT, cols.redINT);
debugLineShader.addLine(wV1.init(0, -100, 0), wV2.init(0, 100, 0), cols.greenINT, cols.greenINT);
debugLineShader.addLine(wV1.init(0, 0, -100), wV2.init(0, 0, 100), cols.blueINT, cols.blueINT);
for(let x = -10; x < 11; x++) {
	if (x) {
		const colR = (cols.redINT & 0xFFFFFF) + 0x88000000;
		const colG = (cols.greenINT & 0xFFFFFF) + 0x88000000;
		const colB = (cols.blueINT & 0xFFFFFF) + 0x88000000;
		debugLineShader.addLine(wV1.init(-10, x, 0), wV2.init(10, x, 0), colG, colG);
		debugLineShader.addLine(wV1.init(-10, 0, x), wV2.init(10, 0, x), colB, colB);
		debugLineShader.addLine(wV1.init(x, -10, 0), wV2.init(x, 10, 0), colR, colR);
		debugLineShader.addLine(wV1.init(0, -10, x), wV2.init(0, 10, x), colB, colB);
		debugLineShader.addLine(wV1.init(x, 0, -10), wV2.init(x, 0, 10), colR, colR);
		debugLineShader.addLine(wV1.init(0, x, -10), wV2.init(0, x, 10), colG, colG);
	}
}
debugLineShader.addBoxMark(lights.named.main.pos, wV1.init(0,0,0.2), cols.whiteINT);
debugLineShader.addBoxMark(lights.named.back1.pos, wV1.init(0,0,0.2), cols.whiteINT);
//debugLineShader.addPlane(pp, cols.redINT, 5);
//debugLineShader.addMeshFaces(planeSliced, planeSliced.newFaces, cols.greenINT);

/*
debugLineShader.addPlane(pp1, cols.cyanINT, 5);
debugLineShader.addPath(ppP.path, ppP.isClosed, cols.cyanINT);
//planeSliced.newFaces.length = 9;
for (const p of ppP.planes(3,3)()) {
	debugLineShader.addPlane(p, cols.magentaINT, 3);
}
	*/

// new Vec3(0,20,0), new Vec3(-10.2, -10, - 20.5) , new Vec3(12, 0, 11)

debugLineShader.lockBuffer();

pos.init(0,1,-1);
lookat.init(0,0,5);
mouse.worldRay = new Vec3();
obj.matrix.position = lookat;

camera.update();
view.toView(camera);
renderer.depthModes.lessEqual();
setTimeout(() => {animLoopFunction = mainLoop;flashInfo("Rendering")}, 200);

flashInfo("App started");
var animLoopFunction = loadingLoop;	
requestAnimationFrame(animLoopFunction);


function createTree(obj, dir, pos, scale, branch = 3, turn = 1) {
		var d1,p1,d2,p2;
		obj.matrix.restore();
		obj.matrix.wAxis(pos.x, pos.y, pos.z);
		obj.matrix.yawPitch = dir;
		obj.matrix.scale(scale, scale, scale);
		cols.temp[0] = scale * (cols.brown[0] - cols.greenDk[0]) + cols.greenDk[0];
		cols.temp[1] = scale * (cols.brown[1] - cols.greenDk[1]) + cols.greenDk[1];
		cols.temp[2] = scale * (cols.brown[2] - cols.greenDk[2]) + cols.greenDk[2];
		obj.color = cols.temp;				
		shader.draw("rod", obj)	
		pos.x += obj.matrix.m[4] * 0.45;
		pos.y += obj.matrix.m[5] * 0.45;
		pos.z += obj.matrix.m[6] * 0.45;
		dir.x += Math.randS(0.8, 1) * scale * Math.sign(turn);
		dir.y += Math.randS(0.1, 0.2);
		scale *= Math.randS(0.8, 0.95);
		if(scale > scaleCut) {
			branch --;
			if(branch === 0) {
				d1 = new Vec3(dir.x, dir.y + Math.randS(0.6, 1.2));
				d2 = new Vec3(dir.x, dir.y - Math.randS(0.6, 1.2));
				p1 = new Vec3(pos.x, pos.y, pos.z);
				p2 = new Vec3(pos.x, pos.y, pos.z);
				dir.y += Math.randS(-1.2, 1.2)
				branch = 3;
			}				
			createTree(obj, dir, pos, scale, branch, turn);
			if(branch === 3) {
				createTree(obj, d1, p1, scale, 3, -turn );
				createTree(obj, d2, p2, scale, 3, -turn );
				
			}
		}else {
			dir.x = Math.randS(0, 6);
			dir.y = Math.randS(0, 6);
			obj.matrix.wAxis(pos.x, pos.y, pos.z);
			obj.matrix.yawPitch = dir;
			scale *= Math.randS(0.9, 1.1);
			obj.matrix.scale(scale, scale, scale);
			obj.color = cols.red;
			shader.draw("sphere", obj)	
		}
	
	
	
}
const TREE_SCALE = 3;
var buildTree = true;
const mover = new Vec3();
function createTreeInst(obj, dir, pos, scale, branch = 3, turn = 1) {
		var d1,p1,d2,p2;
		cols.temp[0] = scale/TREE_SCALE * (cols.brown[0] - cols.greenDk[0]) + cols.greenDk[0];
		cols.temp[1] = scale/TREE_SCALE * (cols.brown[1] - cols.greenDk[1]) + cols.greenDk[1];
		cols.temp[2] = scale/TREE_SCALE * (cols.brown[2] - cols.greenDk[2]) + cols.greenDk[2];
		dir.z = scale;
		instShader.add(dir, pos, cols.temp, 0);
		mover.yawPitchScaleUp = dir;
		pos.addScaled(0.49, mover);
		dir.x += Math.randS(0.8, 1) * (scale/TREE_SCALE) * Math.sign(turn);
		dir.y += Math.randS(0.1, 0.2);
		scale *= Math.randS(0.8, 0.95);
		if(scale > scaleCut * TREE_SCALE) {
			branch --;
			if(branch === 0) {
				d1 = new Vec3(dir.x + Math.randS(-1.2, 1.2), dir.y + Math.randS(0.6, 1.2), scale);
				d2 = new Vec3(dir.x + Math.randS(-1.2, 1.2), dir.y - Math.randS(0.6, 1.2), scale);
				p1 = new Vec3(pos.x, pos.y, pos.z);
				p2 = new Vec3(pos.x, pos.y, pos.z);
				dir.y += Math.randS(-1.2, 1.2)
				branch = 3;
			}				
			createTreeInst(obj, dir, pos, scale, branch, turn);
			if(branch === 3 && d1) {
				createTreeInst(obj, d1, p1, scale * 0.9, 3, -turn );
				createTreeInst(obj, d2, p2, scale * 0.9, 3, -turn );
			}
		}else {
			mover.yawPitchScaleUp = dir
			pos.addScaled(0.5, mover);			
			dir.x =  Math.randS(0, 6);
			dir.y = Math.randS(-0.1, 6);
			scale *= Math.randS(0.9, 2.1);
			instShader.add(dir, pos, Math.randSItem(cols.greens), 1);
			
		}
	
	
	
}

function loadingLoop(time) {
	
	
	requestAnimationFrame(animLoopFunction);
}
var debugGrid = false;
const objList = [
	dbv3.x, dbv3.y + 2, dbv3.z, 0,   
	dbv4.x, dbv4.y + 2, dbv4.z, 1,   
	dbv5.x, dbv5.y + 2, dbv5.z, 2,   
	dbv1.x, dbv1.y + 2, dbv1.z, 0,   
	dbv2.x, dbv2.y + 2, dbv2.z, 1];
function mainLoop(time) {
	if(keys.KeyG) {
		debugGrid = !debugGrid;
		keys.KeyG = false;
		
		flashInfo("Debug view " + (debugGrid ? "On!" : "Off!"), 1000);
	}
	const now = performance.now();
	renderer.fullPage();
	view.update(canvas.width, canvas.height);
	mouse.sx = Math.easeSign(mouse.rx = (mouse.x / canvas.width - 0.5) * 2, 2);
	mouse.sy = Math.easeSign(mouse.ry = -(mouse.y / canvas.height - 0.5) * 2, 2);
	camDir.x += mouse.sx  / 20;
	camDir.y = mouse.sy;


	
	camDir.z *= MOVE_DRAG;
	camDir.w *= MOVE_DRAG;
	if(mouse.button === 1 || keys.ArrowUp || keys.KeyW) {
		if (camDir.z < 0) { camDir.z = 0 }
		else {
			if (camDir.z < 1) { camDir.z += MOVE_ACC }
			else { camDir.z = 1 }
		}
	}
	if(mouse.button === 4 || keys.ArrowDown || keys.KeyS) {
		if (camDir.z > 0) { camDir.z = 0 }
		else {
			if (camDir.z > -1) { camDir.z -= MOVE_ACC }
			else { camDir.z = -1 }
		}
	}
	if (keys.ArrowRight || keys.KeyD) {
		if (camDir.w > 0) { camDir.w = 0 }
		else {
			if (camDir.w > -1) { camDir.w -= MOVE_ACC }
			else { camDir.w = -1 }
		}
	} 
	if (keys.ArrowLeft || keys.KeyA) {
		if (camDir.w < 0) { camDir.w = 0 }
		else {
			if (camDir.w < 1) { camDir.w += MOVE_ACC }
			else { camDir.w = 1 }
		}
		
	} 
	pos.addScaled(camDir.w * MOVE_SPEED, camera.right);
	pos.addScaled(camDir.z * MOVE_SPEED, camera.forward)
	const ptx = Math.cos(camDir.y)
	const pty = Math.sin(camDir.y)
	lookat.x = pos.x + (Math.cos(camDir.x) * ptx) * 4;
	lookat.y = pos.y + pty * 4;
	lookat.z = pos.z + (Math.sin(camDir.x) * ptx) * 4;
	
	
	//camera.yawPitch = camDir;
	renderer.clear();
	debugLineShader.clear()
	
	camera.update();
	view.toView(camera);
	//view.invertView();
	
	if (debugGrid) {
		view.invertView().screenToWorld(wV1.init(mouse.rx, mouse.ry), mouse.worldRay).sub(pos);
		
		pos.rayPoly4Intercept(mouse.worldRay, wV1.init(5,0,0), wV2.init(0,0,0), wV3.init(0,0,5), wV4);
		debugLineShader.addLine(wV4.addScaled(-0.15, camera.right, wV1), wV4.addScaled(0.15, camera.right, wV2), cols.whiteINT);	
		debugLineShader.addLine(wV4.addScaled(-0.15, camera.up, wV1), wV4.addScaled(0.15, camera.up, wV2), cols.whiteINT);	
		if(keys.KeyV) {

		    objList.push(wV4.x, wV4.y + 2, wV4.z);
			keys.KeyV = false;
		}		
	}
	
	if(mouse.wheel) {
		if(mouse.wheel < 0) {
			scaleCut *= 1.01;
			buildTree = true;
		} else {
			scaleCut *= 1/1.01;
			buildTree = true;
		}
		mouse.wheel = 0;
		flashInfo("Tree iteration cut: " + scaleCut.toFixed(4), 1000);
		
	}
		
	if (sky.use(view)) {
sunTime += 1;
if(sunTime % 30 === 0) {
	sky.setUniform("sunPos",new Float32Array([0,Math.cos(sunTime/300), Math.sin(sunTime/300)]));
}		
		sky.draw(true);
		/*This virus is here to stay, its never going to disappear and will always be a threat. At best a vaccine is 12 to 18 months away, if at all. We are social distancing only for one reason, to flatten the curve thus reducing the load on the medical system so that everyone gets equal and fair access to help if needed. I do wonder just how much pressure is our hospital system under. If the curve is too flat then we are condemning our selves to a longer lock down. The reality is this is only over once we have all had it. I for one am happy to volunteer exposing my self to the virus, quarantining my self so I do not spread it to anyone at high risk, so i can be on the recovered list and completely removing my self as a potential vector. If all of us at low risk can do the same we can fatten the curve, keep the medial burden in check and get back to normal as soon as possible.*/
	}
	if(shader.use(view)) {
		obj.cullBackface = true;
		obj.matrix.wAxis(0,0,0);
		obj.matrix.save();
		//obj.matrix.yaw = time / 500;
		obj.color = cols.green;
		//shader.draw("plane", obj)
		
		obj.matrix.restore();
		obj.matrix.wAxis(0,0,8);
		//obj.matrix.yaw = time / 500;
		obj.color = cols.gray;
		//shader.draw("path", obj)		
		
		
		obj.matrix.restore();
		obj.matrix.wAxis(0,0,7);
		//obj.matrix.yaw = time / 500;
		obj.color = cols.gray;
		//shader.draw("rod", obj)		
	}
	
	if(shaderLand.use(view)) {
		objLand.cullBackface = true;
		objLand.matrix.wAxis(0,0,0);
		objLand.matrix.save();
		//obj.matrix.yaw = time / 500;
		objLand.color = cols.white;
		shaderLand.draw("plane", objLand)		
		objLand.matrix.restore();
	}
	if(shaderTex.use(view)) {
		objTextured.cullBackface = true;
		obj.matrix.save();
		obj.matrix.scale(0.2);
		

		objTextured.matrix.yaw = time / 1500;
		objTextured.color = cols.white;
		var i = 0;
		while (i < objList.length) {
			objTextured.matrix.wAxis(objList[i++], objList[i++], objList[i++]);
			
			shaderTex.draw(nums[objList[i++]], objTextured)		
		}
		objTextured.matrix.restore();

	}
		


	if(instShader.use(view)) {
		if(buildTree) {
			instShader.clear(0);
			instShader.clear(1);
			obj.cullBackface = true;		
			obj1.matrix.wAxis(0, 0, 0);
			pos1.init(0,0,0);
			dir.x =  time / 123700;
			dir.y = 0 ;
			Math.randSeed(treeSeed);
			createTreeInst(obj1, dir, pos1, TREE_SCALE, 3, 1);
			buildTree = false;
		}
		instShader.draw("rod", 0, obj);
		instShader.draw("sphere", 1, obj);
		
	}
	if (debugGrid) {
		if (debugLineShader.use(view)) {
			
			debugLineShader.draw();
		}
	}
	lights.dirty = false;
	frameRate(info, time, performance.now() - now);
	requestAnimationFrame(animLoopFunction);
	if (keys.KeyF) {
		animLoopFunction = forestLoop;
		keys.KeyF = false;
	}
}



function forestLoop(time) {

	const now = performance.now();
//	renderer.fullPage();
	//view.update(canvas.width, canvas.height);

	

		



	if(instShader.use(view)) {

		instShader.clear(0);
		instShader.clear(1);
		obj.cullBackface = true;		
		const x= Math.rand(-100, 100);
		const z= Math.rand(-100, 100);
		obj1.matrix.wAxis(x,0,z);
		pos1.init(x,0,z);
		dir.x = Math.rand(0, 7);
		dir.y = Math.rand(-0.5, 0.5);
		Math.randSeed(treeSeed);
		createTreeInst(obj1, dir, pos1, Math.rand(TREE_SCALE * 0.9, TREE_SCALE * 1.1), Math.randI(3,8), 1);
		buildTree = false;

		instShader.draw("rod", 0, obj);
		instShader.draw("sphere", 1, obj);
		
	}
	

	frameRate(info, time, performance.now() - now);
	requestAnimationFrame(animLoopFunction);
	if (keys.KeyF) {
		animLoopFunction = mainLoop;
		keys.KeyF = false;
	}
	
}



