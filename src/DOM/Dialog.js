import {$,$$,$R} from "./geeQry.js";
import {Docker} from "./Docker.js";
import {customCursors} from "./customCursors.js";
import {} from "../utils/MathExtensions.js";
import {getUID} from "../utils/getUID.js";
import {commands} from "../utils/commands.js";
import {keyboard} from "./keyboard.js";
import {HSLA} from "../utils/HSLA.js";
import {Button} from "./UI/Button.js";
import {CheckBox} from "./UI/CheckBox.js";
import {Slider} from "./UI/Slider.js";
import {List} from "./UI/List.js";
import {Spacer} from "./UI/Spacer.js";
import {SpriteButton} from "./UI/SpriteButton.js";

const ACTION_CLICK_TIME = 250; // in ms Max length of time for secondary mouse click
const FIRST_UI_Y = 17;
const ANIM_FRAMES = 20;  // number of frames for animnations (eg fold and unfold animation)
const UI_SPACING = 1;  // in px. Gap between UI elements
const BORDER = 4;  // in px, Size of dialog border
const SQUEAZE_POP = 20; // in px; When docked stack has a height greater than innerHeight, docked dialogs are automaticly undocked. To stop them from being hidden they move left or right by this value
const UI_TYPES = {
	Button,
	CheckBox,
	List,
	Slider,
	Spacer,
	SpriteButton,
	Icon: SpriteButton, // alias
};




const style = `
.frame {
	position: absolute;
	background-color: #FRAME_BG_COLOR#;
	border: 2px solid black;
	overflow: hidden;
}
.frame .title {
	position: absolute;
	top: 2px;
	left: 2px;
	right: 2px;
	background-color: #FRAME_TITLE_COLOR#;
	cursor: move;
	border: 1px solid black;
}
.frame .title.focused {
	border: 1px solid white;
}

.frame .title:hover {
	background-color: #FRAME_TITLE_HIGHLIGHT_COLOR#;
}
.frame .title .text {
	pointer-events: none;
	padding-left: 5px;
	font-size: x-small;
}
.frame .title .text.center {
	text-align: center;
	padding-left: 0px;
}
.frame .title .close {
	position: absolute;
	top: 1px;
	right: 1px;
    bottom: 1px;
	cursor: pointer;
	background-color: #FRAME_CLOSE_COLOR#;
	padding-left: 4px;
    padding-right: 4px;
	font-size: xx-small;
	
}
.frame .title .close:hover {
	background-color: #FRAME_CLOSE_HIGHLIGHT_COLOR#;
	color: white;
}
.frame.disabled {
}
.frame.disabled .title {
	opacity: #DISABLED_OPACITY#;
}
.spriteButton {
	background-image: url(#SPRITE_SHEET_URL#);
}
`;
const styleDefines = {
	FRAME_BG_COLOR: "#999",
	UI_BG_COLOR: "#333",
	UI_BG_COLOR_ITEM: "#444",
	UI_HOVER_BG_COLOR: "#555",
	UI_TEXT_COLOR: "#EEE",
	UI_TEXT_COLOR_ITEM: "#FFF",
	FRAME_TITLE_COLOR: "#8C8",
	FRAME_TITLE_HIGHLIGHT_COLOR: "#AFA",
	FRAME_CLOSE_COLOR: "#A00",
	FRAME_CLOSE_HIGHLIGHT_COLOR: "#A00",
	DISABLED_BG_COLOR: "#333",
	DISABLED_OPACITY: "0.4",
	NUMBER_TEXT_BG_COLOR: "#060",
	NUMBER_TEXT_COLOR: "#CFC",
	CHECK_SLIDE_BG_COLOR: "#046",
	CHECK_SLIDE_OUTLINE_COLOR: "#57A",
	CHECK_SLIDE_OUTLINE_HIGHLIGHT_COLOR: "#ABF",
	LIST_ITEM_EVEN_COLOR: "#333",
	LIST_ITEM_ODD_COLOR: "#444",
	LIST_ITEM_HOVER_BG_COLOR: "#8BF",
	LIST_ITEM_HOVER_COLOR: "#642",
	LIST_ITEM_SELECTED_BG_COLOR: "#88F",
	LIST_ITEM_SELECTED_COLOR: "#622",
	ICON_BUTTON_CHECKED_BG_COLOR: "#CCC",
	SPRITE_SHEET_URL: "",

	
}
function compileDefines(str, defs) {
	const names = Object.keys(defs);
	var changed = true, cycles = 100; // to protect agains cyclic defines
	while(changed) {
		if (cycles-- <= 0) { throw Error("Cyclic overflow compiling string") }
		changed = false;
		for (const name of names) {
			str = str.replace(new RegExp("#" + name + "#", "g"), str => {
				changed = true;
				return defs[name];
			});
		}
	}
	return str;
}


function createUIMouse(mouse) {
	var capListener;
	function UIMouse(event) {	
		if (capListener) { capListener(event, mouse.events[event.type]) }
		else if (event.target.command_Id && commands.has(event.target.command_Id)) {
			const command = commands.get(event.target.command_Id);
			if (command.mouseEvent) { command.mouseEvent(event, mouse.events[event.type]) }
		}
		
	}
	mouse.events = {
		mouseover: 1,
		mouseout: 2,
		mousemove: 3,
		mousedown: 4,
		mouseup: 5,
		wheel: 6,
	};
		
	mouse.extHandler = UIMouse;
	mouse.captureId = 0;
	mouse.savePos = function(id) {
		if(mouse.captureId === id) {
			mouse.cx = mouse.x;
			mouse.cy = mouse.y;
			mouse.cWheel = mouse.wheel;
		}
	}
	mouse.capture = function(id, listener) {		
		if(id !== 0 && (mouse.captureId === 0 || mouse.captureId === id)) {
			mouse.captureId = id;
			capListener = listener;
			return true;
		}
	}
	mouse.releaseCapture = function(id) {
		if(id !== 0 && mouse.captureId === id) {
			mouse.captureId = 0;
			capListener = undefined;
			
		}
	}

}

const TOP_Z_INDEX = 1000;
var started = false;
var docker;
var dialogFocusStack = Object.assign([], {
	isFocused(dialog) { return this[0] === dialog },
	add(dialog) { 
		this.push(dialog) 
		this.update();		
	},
	remove(dialog) {
		const idx = this.indexOf(dialog);
		this.splice(idx,1);
	},
	focus(dialog) {
		const idx = this.indexOf(dialog);
		this.splice(idx,1);
		this.unshift(dialog);
		this.update();
	},
	update() {
		var zIndex = TOP_Z_INDEX;
		const inStack = docker.dialogsInStack(this[0].id);
		this[0].focus();
		for(const d of inStack) {
			d.frame.style.zIndex = zIndex;
			if (d !== this[0]) { d.blur() }
		}
		zIndex --;
		for(const d of this) {
			if (!inStack.includes(d)) {
				d.frame.style.zIndex = zIndex;
				d.blur();
			}
			zIndex --;
		}
	},
	updateResized() {
		for(const d of this) { d.fixPos() }
	}
});
	
	
function start(mouse, spriteSheet = "") {
	if (!started) {
		styleDefines.SPRITE_SHEET_URL = spriteSheet;
		docker = new Docker();
		var styleStr = style;
		for (const ui of Object.values(UI_TYPES)) { styleStr += ui.style }
		styleStr = compileDefines(styleStr, styleDefines);
			
		$$(document.head, $("style", {innerHTML: styleStr}));
		if (mouse.extHandler === undefined) { createUIMouse(mouse) }
		mouse.keyboard = keyboard;
		mouse.keyboard.start();
		addEventListener("resize",()=>{dialogFocusStack.updateResized()});
	}
	started = true;
}
var animations = new Map();
var animated = false;
function addAnimation(cb, id = AID++) {
	if(animations.has(id)) { return }
	animations.set(id, {id, cb});
	if (!animated) {
		animated = true;
		requestAnimationFrame(animate);
	}
	return id;
}
function animate() {
	for(const a of animations.values()) {
		if (a.cb() === false) { animations.delete(a.id) }
	}
	if (animations.size) { requestAnimationFrame(animate) }
	else { animated = false }
}


	

	
function Dialog(container, mouse, options = {}) {
	start(mouse, options.spriteSheetURL);
	const opts = {
		title: "dialog",
		width: 200,
		height: 20,
		x: 50,
		y: 50,
		titleColor: {h: 120, s: 50, l: 40},
		fitContent: true,
		canClose: false,
		centerTitle: true,
		animate: true,
		canDock: true,
		disabled: false,
		minimisOnDisabled: true,
		keyMode: "testing",
		keys: options.keys ? {...options.keys} : {},
		...options,
	};
	const events = {
		focusOpenToggle() {
			API.focus();
			API.toggleMinimised();
		}
	};
	function addKeyEvents() {
		if(opts.keys) {
			for(const keyName of Object.keys(opts.keys)) {	
				if(events[keyName]) {
					const {mods, keys, modeName = opts.keyMode} = opts.keys[keyName];
					mouse.keyboard.event(events[keyName], mods, keys, modeName);
				}
			}
		}		
	}
	function removeKeyEvents() {
		if(opts.keys) {
			for(const keyName of Object.keys(opts.keys)) {	
				if(events[keyName]) {
					const {mods, keys, modeName = opts.keyMode} = opts.keys[keyName];
					mouse.keyboard.removeEvent(mods, keys, modeName);
				}
			}
		}		
	}
	
	if (!(opts.titleColor instanceof HSLA)) { opts.titleColor = new HSLA(opts.titleColor.h, opts.titleColor.s, opts.titleColor.l, opts.titleColor.a) }
	opts.titleHighlight = new HSLA(opts.titleColor.h, opts.titleColor.s + 40, opts.titleColor.l + 15, opts.titleColor.a);
	var UIPos = {x: 0, y: FIRST_UI_Y}; // relative position of UI objects as they are added
	const UI = [], UIState = {}, namedUI = {};
	var id = getUID(), height = opts.height, top = opts.y, left = opts.x, width = opts.width, over = false;
	const packing = {x: 0, y: 0};
	const anim = {time: 0, from: 0, to: 0, update: null, onComplete: null};
	function closeAfterAnim() { API.close(false) }
	function setAnimHeight(v) {
		height = v;
		vetPos();
		setPos();
		if (opts.canDock) {
			if (docker.isDocked(id)) { docker.updateAbove(id) }
			if (docker.hasDocked(id)) { docker.updateBelow(id) }
		}
		if (anim.time === 1) {
			fixPos();
			anim.update = null;
		}
	}
	function animateDialog() {
		if(anim.time < 1) {
			var h = Math.sig(anim.time, 2) * (anim.to -anim.from) + anim.from | 0;
			anim.update && anim.update(h);
			anim.time += 1 / ANIM_FRAMES;
		} else {
			anim.time = 1;
			anim.update && anim.update(anim.to);
			if(anim.onComplete) { setTimeout(() =>{anim.onComplete(); anim.onComplete = null},0) }
			return false;
		}		
	}
	function vetPos() {
		var h = height;
		if(opts.canDock) {
			const th = docker.getTotalStackHeight(id);
			if(th !== undefined && th > innerHeight) {
				if(docker.isDocked(id)) {
					const above = docker.undock(id);
					if (above) { above.x -= SQUEAZE_POP; above.fixPos() }
					const th = docker.getStackHeight(id);
					if(th !== undefined && th > innerHeight) {
						if(docker.hasDocked(id)) {
							const below = docker.undockBelow(id);
							if (below) { below.x += SQUEAZE_POP; below.fixPos() }
						}
					}
				} else if(docker.hasDocked(id)) {
					const below = docker.undockBelow(id);
					if (below) { below.x += SQUEAZE_POP; below.fixPos() }
				}
			}			
			
			if (docker.hasDocked(id)) { h = docker.getStackHeight(id) }

		}
		top = top < 0 ? 0 : top + h + BORDER > innerHeight ? innerHeight - (h + BORDER) : top;
		left = left < 0 ? 0 : left + width + BORDER > innerWidth ? innerWidth - (width + BORDER) : left;
	}
	function setPos(l = left, t = top, w = width, h = height) {
		var hh = h;
		if(opts.canDock && docker.hasDocked(id)) {
			hh = docker.getStackHeight(id);
		}
		t = t < 0 ? 0 : t + hh + BORDER > innerHeight ? innerHeight - (hh + BORDER) : t;
		l = l < 0 ? 0 : l + w + BORDER > innerWidth ? innerWidth - (w + BORDER) : l;
		frame.style.top = t + "px";
		frame.style.left = l + "px";
		frame.style.width = w + "px";
		frame.style.height = h + "px";
	}
	function fixPos() {
		opts.x = left;
		opts.y = top;
		opts.width = width;
		opts.height = height;
	}
		
	var frame = $("div", {className: "frame", command_Id: getUID(), style: {height: height + "px"}});
	var title = $("div", {className: "title", command_Id: getUID(), style: {background: opts.titleColor.CSS}});
	var titleText = $("div", {className: "text" + (opts.centerTitle ? " center" : ""), textContent: opts.title, style: {color: opts.titleColor.contrastBW}});
	var close = $("div", {className: "close", textContent: "X", command_Id: getUID()});
	!opts.canClose && close.classList.add("hide");
	function closeDialog(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }		
		if ((mouse.button & 1) === 0) {
			mouse.releaseCapture(close.command_Id);
			if(event.target === mouse.downOn) { API.close() }
			mouse.downOn = undefined;
			updateOverState();
		}
	}
	function moveDialog(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }
		if ((mouse.button & 1) === 0) {
			const actionTime = performance.now() - mouse.downTime;
			if (actionTime < ACTION_CLICK_TIME) { API.toggleMinimised() }
			mouse.releaseCapture(title.command_Id);
			updateOverState();
		} else {
			const dx = mouse.x - mouse.cx;
			const dy = mouse.y - mouse.cy;
			if(dx || dy) {
				opts.y = top;
				opts.x = left;
				if (opts.canDock && docker.isDocked(id)) {
					if(Math.abs(dx) > 16) {
						docker.undock(id);
						dialogFocusStack.focus(API);
						mouse.savePos(title.command_Id);
						opts.x += dx;
						opts.y += dy;
						top = opts.y;
						left = opts.x;		
						vetPos();						
						setPos(left, top, width, height);
						fixPos();
						if(opts.canDock && docker.hasDocked(id)){ docker.updateBelow(id) }
						API.update();						
					}
				} else {
					mouse.savePos(title.command_Id);
					opts.x += dx;
					opts.y += dy;
					top = opts.y;
					left = opts.x;
					if(opts.canDock) {
						const dockWithId = docker.canDock(id)
						if(dockWithId !== undefined) { 
							docker.dock(id, dockWithId);
							!opts.disabled && dialogFocusStack.focus(API);
						}
					}
					vetPos();
					setPos(left, top, width, height);
					fixPos();
					if(opts.canDock && docker.hasDocked(id)){ docker.updateBelow(id) }
					API.update();
				}
			}
		}
	}
	commands.add(title.command_Id, {
		mouseEvent(e, type) {
			if(type === mouse.events.mouseover) { over = true }
			if(type === mouse.events.mouseout) {  over = false }
			if (mouse.captureId === 0 && type === mouse.events.mousedown) {
				mouse.capture(title.command_Id, moveDialog);
				mouse.savePos(title.command_Id);
				if ((opts.canDock && docker.isDocked(id)) || dialogFocusStack.isFocused(API)) { mouse.downTime = performance.now() }
				else { mouse.downTime = -1 }
				!opts.disabled && dialogFocusStack.focus(API);
			} 
			if(mouse.captureId === 0) { updateOverState() }
		}
	});
	if (opts.canClose) {
		commands.add(close.command_Id, {
			mouseEvent(e) {
				if(type === mouse.events.mouseover) { over = true }
				if(type === mouse.events.mouseout) {  over = false }
				if (mouse.captureId === 0 && type === mouse.events.mousedown) {				
					mouse.capture(close.command_Id, closeDialog);
					mouse.downOn = e.target;
					dialogFocusStack.focus(API);
				} 
				if(mouse.captureId === 0) { updateOverState() }
			}
		});
	}

	function updateOverState() {
		title.style.background = over ? opts.titleHighlight.CSS : opts.titleColor.CSS;
		titleText.style.color = over ? opts.titleHighlight.contrastBW :  opts.titleColor.contrastBW;
	}
	const API = {
		disable() { 
			if (!opts.disabled) { 
				opts.disabled = true; 
				API.blur();
				API.callEachUI("disable");
				if(opts.minimisOnDisabled && !API.minimised) {
					API.toggleMinimised();
				} else {
					API.update();
				}
			} 
		},
		enable() {  
			if (opts.disabled) { 
				opts.disabled = false; 
				API.callEachUI("enable");
				API.update() 
			}
		},
		get title() { return titleText.textContent },
		set title(text) { titleText.textContent = text },
		get canDock() { return opts.canDock },
		get container() { return container },
		get id() { return id },
		get x() { return left },
		get y() { return top },
		get width() { return width },
		get height() { return height },
		set x(v) { left = v; vetPos() },
		set y(v) { top = v; vetPos() },
		set width(v) { width = v; vetPos() },
		set height(v) { height = v; vetPos() },	
		eachUI(cb) { for (const ui of UI) { cb(ui) } },
		callEachUI(functionName, ...args) { 
			for (const ui of UI) { 
				const func = ui[functionName];
				func instanceof Function  && func(...args) 
			} 
		},
		get UIState() { return UIState },
		getUIByName(name) { return namedUI[name] },
		updateState() { API.callEachUI("fromState") }, //for (const ui of UI) { ui.fromState() } },
		updateNamedStates(...names) {
			for (const name of names) {
				if (namedUI[name]) { namedUI[name].fromState() }
			}
		},
		fixPos(){
			vetPos();
			setPos();
			fixPos();
		},
		focus() {
			if (!opts.disabled && !opts.focused) {
				opts.focused = true;
				title.classList.add("focused");
				if(opts.keyMode) { mouse.keyboard.mode = opts.keyMode }	
				dialogFocusStack.focus(API);
				return true;
			}
		},
		blur() { title.classList.remove("focused"); opts.focused = false; },
		minimised: false,
		toggleMinimised(state = !API.minimised) {
			API.minimised = state;
			if (API.minimised) { height = FIRST_UI_Y }
			else { height = UIPos.y }
			!opts.animate && (opts.height = height);
			API.update();
		},
		addUI(...uiOptions) {
			if(opts.keyMode) { 
				mouse.keyboard.saveMode();
				mouse.keyboard.mode = opts.keyMode; 
			}	
			var update = false;
			for(const uiOpt of uiOptions) {
				if(UI_TYPES[uiOpt.type]){
					let ui;
					if (uiOpt.type === "Spacer" && uiOpt.direction === "right" && uiOpt.pack === undefined) { uiOpt.pack = "right" }
					if(uiOpt.pack === "right" && UI_TYPES[uiOpt.type].canPack) {
						packing.x = UIPos.x + packing.x + UI_SPACING >= opts.width - UI_SPACING ? 0 : packing.x;
						if (packing.x === 0) { packing.y = 0 }
						uiOpt.x = UIPos.x + packing.x;
						uiOpt.y = UIPos.y + packing.y;
						if (packing.y !== 0) { uiOpt.h = -packing.y }
						UI.push(ui = UI_TYPES[uiOpt.type](API, mouse, uiOpt));
						const h = ui.height + UI_SPACING
						if (packing.x === 0) {
							packing.y = -h;
							UIPos.y += h
							packing.x += ui.width + UI_SPACING;
						} else {
							packing.x += ui.width + UI_SPACING;
						}
						
					} else {
						if (packing.x > 0 && uiOpt.pack !== "newLine") {
							uiOpt.x = UIPos.x + packing.x;
							UIPos.y += packing.y;
							packing.y = packing.x = 0;
						} else {
							uiOpt.x = UIPos.x;
						}
						uiOpt.y = UIPos.y ;
						uiOpt.right = UIPos.x;

						UI.push(ui = UI_TYPES[uiOpt.type](API, mouse, uiOpt));
						UIPos.y += ui.height + UI_SPACING;
					}
					namedUI[ui.name] = ui;
					ui.stateObj(UIState);
					if (opts.fitContent) {
						height = UIPos.y;
						update = true;
					}
				}
			}
			if(update) {
				!opts.animate && (opts.height = height);
				API.update();
			}
			if	(opts.keyMode) { mouse.keyboard.restoreMode() }
				
			return API;
		},
		dock(toDialog) {
			if(opts.canDock && toDialog.canDock) {
				docker.dock(id, toDialog.id);
				docker.updateBelow(toDialog.id);
			}
			return API;
		},
		update(animate = opts.animate) {
			if(animate) {
				if(opts.height !== height) {
					anim.time = 0;
					anim.to = height;
					anim.from = opts.height;	
					anim.update = setAnimHeight;
					addAnimation(animateDialog, id);
				}
			} else {
				height = opts.height;
				width = opts.width;
				left = opts.x;
				top = opts.y;
				API.fixPos();
				opts.canDock && docker.update(id);
			}
			opts.disabled ? frame.classList.add("disabled") : frame.classList.remove("disabled");
		},
		close(animate = opts.animate) {
			if(animate) {
				anim.time = 0;
				anim.to = 0;
				anim.from = height;
				anim.update = setAnimHeight;
				anim.onComplete = closeAfterAnim;
				addAnimation(animateDialog, id);
			} else {
				removeKeyEvents();
				if(opts.onclose) { opts.onclose() }
				for(const ui of UI) { ui.close() }
				docker.remove(id);
				dialogFocusStack.remove(API)
				commands.remove(title.command_Id, close.command_Id);
				$R(container, frame);
				frame = title = close = titleText = undefined;			
				delete API.frame;
			}
		},
		frame,
	};
	addKeyEvents();

	$$(container, $$(frame, $$(title, titleText, close)));
	API.update(false);
	opts.canDock && docker.add(id, API);
	dialogFocusStack.add(API);
	return API;
}


export {Dialog, dialogFocusStack};