import {$,$$,$R} from "../geeQry.jsm";
import {getUID} from "../../utils/getUID.jsm";
import {commands} from "../../utils/commands.jsm";


export {Button};
Button.style = `
.frame .button {
	position: absolute;
	border: 1px solid black;
	background-color: #UI_BG_COLOR#;
	color: #UI_TEXT_COLOR#;
	cursor: pointer;	
	padding-left: 5px;
	font-size: x-small;	
}
.frame .button.downOn {
	color: white;
}
.frame .button.over {
	border: 1px solid white;
	background-color: UI_HOVER_BG_COLOR;
	
}
.frame .button.disabled {
	pointer-events: none;
	background-color: #DISABLED_BG_COLOR#;
}
`
function Button(dialog, mouse, options = {}) {
	const opts = {
		text: "Button",
		name: options.name || ("button" + getUID()),
		disabled: false,
		...options,
	}
	var state, over = false, text = opts.text;
	opts.text = undefined;
	function mouseEvent(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }	
		if ((mouse.button & 1) === 0) {
			mouse.releaseCapture(button.command_Id);
			if(event.target === mouse.downOn) { API.action("click") }
			button.classList.remove("downOn");
			mouse.downOn = undefined;
			updateOverState();
		}
	}
	var button = $("div", {className: "button", command_Id: getUID()});
	commands.add(button.command_Id, {
		mouseEvent(e, type) {
			if(type === mouse.events.mouseover) { over = true }
			if(type === mouse.events.mouseout) {  over = false }	
			if(mouse.captureId === 0 && type === mouse.events.mousedown) {
				if(mouse.capture(button.command_Id, mouseEvent)) {
					API.dialog.focus();
					mouse.downOn = e.target;
					button.classList.add("downOn");
				}
			} 
			if(mouse.captureId === 0) { updateOverState() }
		}
	});	
	function updateOverState() {
		over ? button.classList.add("over") : button.classList.remove("over");
	}	
	const API = {
		get name() { return opts.name },
		disable() { if (!opts.disabled) { opts.disabled = true; API.update() } },
		enable() {  if (opts.disabled) { opts.disabled = false; API.update() } },
		set text(t) { 
			if (opts.text !== t) {
				opts.text = t;
				state && (state[opts.name] = t);
				API.action("changed");
				API.update();
			}
		},
		get text() { return opts.text },
		get height() { return button.getBoundingClientRect().height },
		get dialog() { return dialog },
		fromState() { state && (API.text = state[opts.name]) },
		stateObj(_state) { (state = _state)[opts.name] = API.text },
		update() {
			button.textContent = opts.text;
			button.style.left = opts.x + "px";
			button.style.right = opts.right  + "px";
			button.style.top = opts.y + "px";
			opts.disabled ? button.classList.add("disabled") : button.classList.remove("disabled");
		},
		action(type) { opts[type] instanceof Function && opts[type](API, type) },
		close() {
			opts.key && mouse.keyboard.removeEvent(opts.key.mods, opts.key.keys, opts.key.modeName);
			commands.remove(button.command_Id);
			$R(dialog.frame, button);
			state = button = undefined;			
			delete API.button;		
		},		
		button,
	}
	opts.key && mouse.keyboard.event(()=> API.action("click"), opts.key.mods, opts.key.keys, opts.key.modeName);
	$$(dialog.frame, button);
	API.text = text;
	return API;
}
