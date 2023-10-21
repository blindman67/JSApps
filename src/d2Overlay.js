import {$,$$} from "../code/geeQry.js";
import {display} from "../code/display.js";
const overlays = {};
function Overlay(resolutionScale) {
	const canvas = $("canvas",{className: "canvasOverlay"});
	$$(document.body, canvas);
	const API = {
		ctx: canvas.getContext("2d"),
		resize(e) {
			canvas.width = e.data.width / resolutionScale;
			canvas.height = e.data.height / resolutionScale;
		},
	};
	
	display.addEvent("canvasResized", API.resize);
	return API;
	
}
const d2Overlay = {
	create(name, resolutionScale = 1) { return overlays[name] = Overlay(resolutionScale) }
};
export {d2Overlay};