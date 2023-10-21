import {$,$$,$R} from "../geeQry.jsm";
import {getUID} from "../../utils/getUID.jsm";
import {commands} from "../../utils/commands.jsm";
import {Groups} from "./Groups.jsm";


export {SpriteButton};
SpriteButton.canPack = true;
SpriteButton.style = `
.frame .spriteButton {
	position: absolute;
	background-color: #UI_BG_COLOR#;
	cursor: pointer;	
}
.frame .spriteButton.downOn {
}
.frame .spriteButton.over {
	margin: -1px;
	border: 1px solid white;
	
}
.frame .spriteButton.checked {
	background-color: #ICON_BUTTON_CHECKED_BG_COLOR#;
}
.frame .spriteButton.disabled {
	pointer-events: none;
	cursor: default;	
	opacity: 0.5;
	background-color: #DISABLED_BG_COLOR#;
}
`
function SpriteButton(dialog, mouse, options = {}) {
	const opts = {
		name: options.name || ("spriteButton" + getUID()),
		disabled: false,
		sprite: 0, // index into opts.sprites
		sprites: [0],
		cycle: false,
		...options,
	}
	if (!opts.sheet) { throw new RangeError("SpriteButton UI requiers a sprite sheet reference `options.sheet`") }
	const size = opts.sheet.getSize();
	const location = opts.sheet.locateSprite(opts.sprites[opts.sprite]);
	var state, over = false
	function mouseEvent(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }	
		if (((mouse.buttonDown & 1) === 1 && (mouse.button & 1) === 0) || ((mouse.buttonDown & 4) === 4 && (mouse.button & 4) === 0)) {
			mouse.releaseCapture(element.command_Id);
			if(event.target === mouse.downOn) {
				if (opts.checked !== undefined) { API.toggleChecked() }
				else if(opts.cycle) { (mouse.buttonDown & 1 === 1) ? API.next() : API.previouse() }
				else { API.action("click") }
			}
			
			element.classList.remove("downOn");
			mouse.buttonDown = 0;
			mouse.downOn = undefined;
			updateOverState();
		}
	}
	var element = $("div", {className: "spriteButton", command_Id: getUID()});
	commands.add(element.command_Id, {
		mouseEvent(e, type) {
			if (type === mouse.events.mouseover) { over = true }
			else if (type === mouse.events.mouseout) {  over = false }	
			else if (type === mouse.events.wheel) { API.sprite += mouse.wheel > 0 ? -1 : 1 }
			else if (mouse.captureId === 0 && type === mouse.events.mousedown) {
				if (mouse.capture(element.command_Id, mouseEvent)) {
					API.dialog.focus();
					mouse.downOn = e.target;
					mouse.buttonDown = mouse.button;
					element.classList.add("downOn");
				}
			} 
			if (mouse.captureId === 0) { updateOverState() }
		}
	});	
	function updateOverState() {
		over ? element.classList.add("over") : element.classList.remove("over");
	}	
	const API = {
		get sprite() { return opts.sprite },
		set sprite(v) {
			v = (v % opts.sprites.length + opts.sprites.length) % opts.sprites.length;
			if (v !== opts.sprite) {
				opts.sprite = v;
				opts.sheet.locateSprite(opts.sprites[opts.sprite], location);
				API.action("changed");
				API.update();
			}
		},
		next() { API.sprite += 1 },
		previouse() { API.sprite -= 1 },
		get checked() { return opts.checked === true },
		set checked(val) {			
			if (val !== opts.checked) {
				opts.checked = val;
				state && (state[opts.name] = val);
				val ? API.action("onchecked") : API.action("onunchecked");
				if (val && opts.group) { Groups.radio(opts.group, API) }
				API.update();
			}
		},
		toggleChecked() { API.checked = !API.checked },
		get name() { return opts.name },
		disable() { if (!opts.disabled) { opts.disabled = true; API.update() } },
		enable() {  if (opts.disabled) { opts.disabled = false; API.update() } },
		get height() { return element.getBoundingClientRect().height },
		get width() { return element.getBoundingClientRect().width },
		get dialog() { return dialog },
		fromState() { state && (opts.checked === undefined ? API.sprite = state[opts.name] : API.checked = state[opts.name]) },
		stateObj(_state) { (state = _state)[opts.name] = opts.checked === undefined ? API.sprite : API.checked },
		update() {
			element.style.left = (opts.x+1) + "px";
			element.style.top = opts.y + "px";
			element.style.width = size.w + "px";
			element.style.height = size.h + "px";
			element.style.backgroundPositionX = (-location.x) + "px";
			element.style.backgroundPositionY = (-location.y) + "px";
			if (opts.checked) { 
				element.classList.add("checked");
			} else { 
				element.classList.remove("checked");
			}			
			opts.disabled ? element.classList.add("disabled") : element.classList.remove("disabled");
		},
		action(type) { opts[type] instanceof Function && opts[type](API, type) },
		close() {
			if (opts.group) { Groups.renoveUI(opts.group, API) }
			opts.key && mouse.keyboard.removeEvent(opts.key.mods, opts.key.keys, opts.key.modeName);
			commands.remove(element.command_Id);
			$R(dialog.frame, element);
			state = element = undefined;			
			delete API.element;		
		},		
		element,
	}
	opts.key && mouse.keyboard.event(()=> API.action("click"), opts.key.mods, opts.key.keys, opts.key.modeName);
	$$(dialog.frame, element);
	if (opts.group) { Groups.addUI(opts.group, API) }
	API.update();
	return API;
}
