import {$,$$,$R} from "../geeQry.js";
import {getUID} from "../../utils/getUID.js";


export {Spacer};
Spacer.canPack = true; // must implement API.width
Spacer.style = `
.frame .spacerV {
	position: absolute;
	left: 0px;
	right: 0px;
	height: 8px;
	background-color: #UI_BG_COLOR#;
}
.frame .spacerV.large {
	height: 16px;
}
.frame .spacerV.x-large {
	height: 32px;
}
.frame .spacerV.small {
	height: 4px;
}
.frame .spacerH {
	position: absolute;
	width: 7px;
	background-color: #UI_BG_COLOR#;
}
.frame .spacerH.large {
	width: 15px;
}
.frame .spacerH.x-large {
	width: 31px;
}
.frame .spacerH.small {
	width: 3px;
}
`
function Spacer(dialog, mouse, options = {}) {
	const opts = {
		name: options.name || ("spacer" + getUID()),
		size: "",
		direction: "down",
		...options,
	}
	
	var element = $("div", {className: "spacer" + (opts.direction === "down" ? "V" : "H") + (opts.size ? " " + opts.size : "")});
	
	const API = {
		get name() { return opts.name },
		disable() { },
		enable() { },
		fromState() { },
		stateObj() { },
		get height() { return element.getBoundingClientRect().height },
		get width() { return element.getBoundingClientRect().width },
		get dialog() { return dialog },
		update() { 
			element.style.top = opts.y + "px";		
			if(opts.direction === "down") {
				element.style.left = opts.x + "px";
			} else {
				element.style.left = (opts.x + 1) + "px";
				element.style.height = (opts.h - 1) + "px";
			}
		},
		action(type) { opts[type] instanceof Function && opts[type](API, type) },
		close() {
			$R(dialog.frame, element);
			element = undefined;			
			delete API.element;		
		},		
		element,
	}
	$$(dialog.frame, element);
	API.update();
	return API;
}
