import {$,$$} from "../code/geeQry.jsm";
import {events} from "../code/events.jsm";
import {renderer} from "../code/renderer.jsm";

const display = (() => {
	const PAUSE_MONITOR_TIME = 100;
	var canvas, ctx, running = false, stop = false;
	
	const renders = [], monitors = [];	
	function fullPage() {
		if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
			API.width = canvas.width = innerWidth;
			API.height = canvas.height = innerHeight;
			renderer.resized();
			API.fireEvent("canvasResized", { width: canvas.width, height: canvas.height });
		}
	}		
	function pausedLoop() {
		for (const monitor of monitors) { monitor() }
		if (!running) { setTimeout(pausedLoop, PAUSE_MONITOR_TIME) }
	}
	function mainLoop(time) {
		fullPage();
		API.globalTime = time;
		API.frameCount ++;
		for (const renderer of renders) { renderer(ctx) }
		if (!stop) { requestAnimationFrame(mainLoop) }
		else { 
			stop = running = false;
			pausedLoop();
		}
	}
	

	const API = {
		width: 0,
		height: 0,
		fullPage,
		get canvas() { return canvas },
		globalTime: 0,
		frameCount: 0,
		get isRunning() { return !stop && running },
		renderer,
		addRender(render) { renders.push(render) },
		removeRender(render) {
			var i = renders.length;
			while (i--) {
				if (renders[i] === render) {
					renders.splice(i, 1);
					break;
				}				
			}
		},			
		addMonitor(monitor) { monitors.push(monitor) },
		removeMonitor(monitor) {
			var i = monitors.length;
			while (i--) {
				if (monitors[i] === monitor) {
					monitors.splice(i, 1);
					break;
				}				
			}
		},			
		init() {
			canvas = $("?#mainCanvas");
			renderer.createContext(canvas);
		},
		start() {
			if (!running) {
				running = true;
				requestAnimationFrame(mainLoop);
			} else if(stop) { stop = false }
		},
		stop() {
			if (running) { stop = true }
		},
		
		
	};
	Object.assign(API, events(API));
	return API;
})();



export {display};