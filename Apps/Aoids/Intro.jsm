import "../../src/utils/MathExtensions.jsm";
import {Vec2} from "../../src/Vec2.jsm";
import {View} from "../../src/View.jsm";
import {Timed} from "../../src/utils/Timed.jsm";
import {Aoids} from "./Aoids.jsm";
import {data} from "./data.jsm";
import {buffers} from "./buffers.jsm";
var flasher, renderer, sprites, keys, mouse, background, overlay;

const view = new View();
const overlayView = new View();
const title = {x: 0, y: 0, sx: 1, sy: 1, cx: 0.5, cy: 0.5, r: 0, z: 0, color: 0xFFFFFFFF, idx: data.overlaySpriteSheet.names.title, fade: 1};

const instructs = new Timed();
const getReady = new Timed();
const wV1 = new Vec2(), wV2 = new Vec2();
var currentTimed = instructs;
var origin, punchIt = false,exitHyper = false, hyperSpeed = 0, usingHyperSpace = false;
var dir = 0, dirR = 0, dirC = 0, changeDir = 5 * 60;
var speed = 0, speedR = 0, speedC = 0;
var end = false;
const text = data.game.introText;
const textGetReady = data.game.hyperspaceText;
var currentText = text;
var textPos = 0;
function showInstruct() { flasher(currentText[textPos++ % currentText.length]) }
getReady.addEvent(0, showInstruct);
getReady.addEvent(1000, showInstruct);
getReady.addEvent(2000, showInstruct);
getReady.addEvent(2100, ()=> {exitHyper = true; speed = speedR; changeDir = 1900 / (1000 / 60); wV1.copyOf(origin)} );
getReady.addEvent(3000, showInstruct);
getReady.addEvent(4000, ()=> Aoids.state = "play");
instructs.addEvent(0, showInstruct);
instructs.addRepeat(2000);

function updateTimed(time) {
	currentTimed.time = time;
}


const intro = {
	setup() {
		flasher = Aoids.flasher;
		renderer = Aoids.renderer;
		sprites = buffers.draw.shader;
		mouse = Aoids.mouse;
		keys = Aoids.keys;
		background = Aoids.background;
		overlay = buffers.overlay.shader;
	},
	end() {
        background.normalSpace()
        return usingHyperSpace ? {view, speed: speedR} : undefined;
    },
	start() {
		end = false;
		currentTimed = instructs;
		currentText = text;
		textPos = 0;
        punchIt = false;
        speedR = speed = 50;
        speedC = 0;
        changeDir = 60;
        exitHyper = false;
		background.populate();
        background.normalSpace();
		currentTimed.start = Aoids.time;
		view.init(view.origin.zero().addPolar(Math.rand(0, Math.TAU),2200000),data.playfield.minZoom, 0, data.playfield.scale);
		origin = view.origin;
		overlayView.init();
		buffers.overlay.unlock();
		buffers.overlay.shader.soilTexture(); // makes it dirty so that it gets bound

	},
	resized() {
		overlayView.update(renderer.width, renderer.height);;
	},
	update(time) {
		if ((/*keys.anyKey || */mouse.button) && currentTimed !== getReady) {
            punchIt = true;
            changeDir = 4000 / (1000 / 60);
            speedR = 0;
            speedC = 0;

			keys.anyKey = false;
            if(mouse.button === 4) {
                usingHyperSpace = false;
                view.origin.zero()
                Aoids.state = "play";
                mouse.button = 0;
            } else {
                usingHyperSpace = true;
                mouse.button = 0;
                currentText = textGetReady;
                currentTimed = getReady;
                textPos = 0;
                currentTimed.start = time;
            }

		}


		sprites.clear();
		overlay.clear();
		title.x = 0;
		title.y = -renderer.height * 0.35;
        title.color = 0xFFFFFF + (((title.fade ** 0.75) * 255 | 0) << 24);
		overlay.add(title);
        if (punchIt) {
            if (exitHyper) {
                speed *= 0.95;
                speedR += (speedC = (speedC += (speed - speedR) * 0.1) * 0.5);
                hyperSpeed = speedR > 200 ? 200 : speedR;
                changeDir -= changeDir > 0 ? 1 : 0;
                const u = (changeDir / (1900 / (1000 / 60))) ** 2;
                origin.copyOf(wV1.scale(u, wV2).addPolar(dirR + Math.PI, 15000));
            } else {
                changeDir -= changeDir > 1 ? 1 : 0;
                speed = origin.length / changeDir;
                speedR += (speedC = (speedC += (speed - speedR) * 0.001) * 0.01);
                hyperSpeed = speedR > 200 ? 200 : speedR;
                dirR += wV1.zero().addPolar(dirR, speed).angleTo(wV2.zero().sub(origin)) / 150;
                origin.addPolar(dirR, speed);
            }
            if (title.fade > 0) { title.fade -= 0.01 }
            else { title.fade = 0 }
            background.hyperSpace(hyperSpeed / 5, dirR);

        } else {
            if(changeDir > 0) { changeDir -= 1 }
            else {
                dir = Math.rand(-Math.PI, Math.PI);
                speed = Math.rand(40, 50);
                changeDir = Math.randI(5 * 60, 20 * 60);
            }
            dirR += (dirC = (dirC += (dir - dirR) * 0.01) * 0.1);
            speedR += (speedC = (speedC += (speed - speedR) * 0.01) * 0.1);
            origin.addPolar(dirR, speedR);
        }
		view.update(renderer.width, renderer.height);
		setTimeout(updateTimed, 0, time);
	},
	render() {
		background.draw(renderer, view);
		overlay.use(overlayView) && overlay.draw();
	},

}

export {intro};