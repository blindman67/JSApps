import {$,$$,$R} from "../geeQry.js";
import {getUID} from "../../utils/getUID.js";
import {commands} from "../../utils/commands.js";
import {Groups} from "./Groups.js";


export {CheckBox};
CheckBox.style = `
.frame .checkBox {
	position: absolute;
	border: 1px solid black;
	background-color: #UI_BG_COLOR#;
	cursor: pointer;	
	padding-left: 5px;
	font-size: x-small;	
}
.frame .checkBox.downOn {
	color: white;
}
.frame .checkBox.disabled {
	pointer-events: none;
	background-color: #DISABLED_BG_COLOR#;
}
.frame .checkBox .text {
	pointer-events: none;
	padding-left: 2px;
	font-size: x-small;
	color: #UI_TEXT_COLOR#;
}	
.frame .checkBox .checkMark {
	position: absolute;
	right: 0px;
	top: -1px;
	bottom: -1px;
	width: 30px;
	padding-left: 5px;
	padding-right: 5px;
	border: 1px solid #CHECK_SLIDE_OUTLINE_COLOR#;
	background: #CHECK_SLIDE_BG_COLOR#;
	pointer-events: none;
}
.frame .checkBox .checkMark .checkSlide {
	position: absolute;
	left: 0px;
	top: 0px;
	bottom: 0px;
	width: 15px;
	pointer-events: none;
	background: #F00;	
}
.frame .checkBox .checkMark .checkText {
	position: absolute;
	right: 0px;
	top: 0px;
	bottom: 0px;
	pointer-events: none;
	color: #UI_TEXT_COLOR#;
	font-size: x-small;
}
.frame .checkBox .checkMark.checked .checkText {
	left: 0px;
	right: unset;
	
}
.frame .checkBox .checkMark.checked .checkSlide {
	left: unset;
	right: 0px;
	background: #0F0;	
}
.frame .checkBox .checkMark.over {
	border: 1px solid #CHECK_SLIDE_OUTLINE_HIGHLIGHT_COLOR#;
}
.frame .checkBox.disabled .checkMark  {
	opacity: #DISABLED_OPACITY#;
}
`
function CheckBox(dialog, mouse, options = {}) {
	const opts = {
		text: "Option",
		checked: false,
		onText: "ON",
		offText: "OFF",
		name: options.name || ("checkBox" + getUID()),
		disabled: false,
		...options,
		
	}
	var state, over = false;
	function mouseEvent(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }			
		if ((mouse.button & 1) === 0) {
			mouse.releaseCapture(checkBox.command_Id);
			if(event.target === mouse.downOn) { API.toggleChecked() }
			checkBox.classList.remove("downOn");
			mouse.downOn = undefined;
			updateOverState()
		}
	}
	var checkBox = $("div", {className: "checkBox",  command_Id: getUID()});
	var checkMark = $("div", {className: "checkMark"});
	var checkSlide = $("div", {className: "checkSlide"});
	var checkText = $("div", {className: "checkText"});
	var text = $("div", {className: "text", textContent: opts.text,});
	commands.add(checkBox.command_Id, {
		mouseEvent(e, type) {
			if(type === mouse.events.mouseover) { over = true }
			if(type === mouse.events.mouseout) {  over = false }				
			if(mouse.captureId === 0 && type === mouse.events.mousedown) {
				if (mouse.capture(checkBox.command_Id, mouseEvent)) {
					API.dialog.focus();
					mouse.downOn = e.target;
					checkBox.classList.add("downOn");
				}
			} 
			if(mouse.captureId === 0) { updateOverState() }
		}
	});	

	function updateOverState() {
		over ? checkMark.classList.add("over") : checkMark.classList.remove("over");
	}	
	const API = {
		get name() { return opts.name },
		disable() { if (!opts.disabled) { opts.disabled = true; API.update() } },
		enable() {  if (opts.disabled) { opts.disabled = false; API.update() } },	
		set text(t) { text.textContent = opts.text = t },
		get text() { opts.text },
		get height() { return checkBox.getBoundingClientRect().height },
		get checked() { return opts.checked },
		set checked(val) {
			if (val !== opts.checked) {
				opts.checked = val;
				state && (state[opts.name] = val);
				API.action("changed");
				if (val && opts.group) { Groups.radio(opts.group, API) }
				API.update();
			}
		},
		toggleChecked() { API.checked = !API.checked },
		fromState() { state && (API.checked = state[opts.name]) },
		stateObj(_state) { (state = _state)[opts.name] = API.checked },
		get dialog() { return dialog },
		update() {
			text.textContent = opts.text;
			checkBox.style.left = opts.x + "px";
			checkBox.style.right = opts.right  + "px";
			checkBox.style.top = opts.y + "px";
			if (opts.checked) { 
				checkMark.classList.add("checked");
				checkText.textContent = opts.onText;
			} else { 
				checkMark.classList.remove("checked");
				checkText.textContent = opts.offText;
			}
			opts.disabled ? checkBox.classList.add("disabled") : checkBox.classList.remove("disabled");
		},		
		action(type) { opts[type] instanceof Function && opts[type](API, type) },
		close() {
			if (opts.group) { Groups.renoveUI(opts.group, API) }
			opts.key && mouse.keyboard.removeEvent(API.toggleChecked, opts.key.mods, opts.key.keys, opts.key.modeName);
			commands.remove(checkBox.command_Id);
			$R(dialog.frame, checkBox);
			checkText = checkSlide = state = checkMark = checkBox = text = undefined;			
			delete API.checkBox;	
		},		
		checkBox,
	}
	opts.key && mouse.keyboard.event(API.toggleChecked, opts.key.mods, opts.key.keys, opts.key.modeName);
	$$(dialog.frame, $$(checkBox, text, $$(checkMark, checkText, checkSlide)));
	if (opts.group) { Groups.addUI(opts.group, API) }
	API.update();
	return API;
}