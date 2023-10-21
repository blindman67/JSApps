import {$,$$,$R} from "../geeQry.jsm";
import {customCursors} from "../customCursors.jsm";
import {} from "../../utils/MathExtensions.jsm";
import {getUID} from "../../utils/getUID.jsm";
import {HSLA} from "../../utils/HSLA.jsm";
import {commands} from "../../utils/commands.jsm";


export {Slider};
Slider.style = `
.frame .slider {
	position: absolute;
	border: 1px solid black;
	background-color: #UI_BG_COLOR#;
	padding-left: 5px;
	font-size: x-small;	
	height: 12px;
	cursor: ${customCursors.wheel_step};
}
.frame .slider.downOn {
	color: #FFF7;
}
.frame .slider.disabled {
	pointer-events: none;
	background-color: #DISABLED_BG_COLOR#;
}
.frame .slider .text {
	pointer-events: none;
	position: absolute;
	left: 6px;
	top: 1px;
	bottom: 0px; 
	color: #UI_TEXT_COLOR#
}

.frame .slider .value {
	pointer-events: none;
	position: absolute;
	right: 1px;
    top: 0px;
    bottom: 0px;
    background: #NUMBER_TEXT_BG_COLOR#;
    text-align: right;
    color: #NUMBER_TEXT_COLOR#;
}
.frame .slider.disabled .value  {
	opacity: #DISABLED_OPACITY#;
}
.frame .slider.disabled .text  {
	opacity: #DISABLED_OPACITY#;
}
.frame .slider .slide {
	pointer-events: none;
	position: absolute;
	left: 0px;
	top: 0px;
	bottom: 0px; 	
}
.frame .slider.disabled .slide  {
	opacity: #DISABLED_OPACITY#;
}
`
function Slider(dialog, mouse, options = {}) {
	const opts = {
		text: "Option",
		min: 0,
		max: 100,
		step: 0,
		value: 50,
		digits: 0,
		keyStep: 1,
		color: {h:30, s:50, v:60}, 
		name: options.name || ("slider" + getUID()),
		disabled: false,
		...options,
		
	};
	if (!(opts.color instanceof HSLA)) { opts.color = new HSLA(opts.color.h, opts.color.s, opts.color.l, opts.color.a) }
	opts.colorHighlight = new HSLA(opts.color.h, opts.color.s + 40, opts.color.l + 15, opts.color.a);
	var valueWidth = 30, state, bounds, over;
	var slideValue = opts.value;
	opts.value = undefined;
	
	function mouseEvent(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }
		if (mouse.downTime && (performance.now() - mouse.downTime) > 100) {
			mouse.downTime = 0;
			slider.classList.add("downOn");
		}
		if ((mouse.button & 1) === 0) {
			if ((mouse.oldButton & 1) === 1) { fromPageCoords(mouse) }
			slider.classList.remove("downOn");
			mouse.releaseCapture(slider.command_Id);
			updateOverState();
		} else if((mouse.button & 1) === 1) {
			fromPageCoords(mouse);
		}
	}
	var slider = $("div", {className: "slider",  command_Id: getUID()});
	var text = $("div", {className: "text", textContent: opts.text});
	var value = $("div", {className: "value", style: {width: valueWidth + "px"}});
	var slide = $("div", {className: "slide", style: {background: opts.color.CSS}});
	commands.add(slider.command_Id, {
		mouseEvent(e, type) {
			if(type === mouse.events.mouseover) { over = true }
			if(type === mouse.events.mouseout) {  over = false }	
			if(type === mouse.events.wheel) {  moveStep(Math.sign(-e.deltaY)); 	API.dialog.focus() }
			if(mouse.captureId === 0 && type === mouse.events.mousedown && (mouse.button & 1) === 1) {
				if (mouse.capture(slider.command_Id, mouseEvent)) {
					API.dialog.focus();
					mouse.downTime = performance.now();
					mouseEvent(e);
				}
			} 
			if(mouse.captureId === 0) { updateOverState() }
		}
	});	
	function updateOverState() {
		slide.style.background = over ? opts.colorHighlight.CSS: opts.color.CSS;
	}
	function moveStep(dir) {
		if (opts.step === 0) {
			bounds = bounds || slider.getBoundingClientRect();
			API.value = API.value + (opts.max - opts.min) / (bounds.width - valueWidth) * dir;
		} else {
			API.value = API.value + opts.step * dir;
		}
	}
	function fromPageCoords(coords) {
		bounds = bounds || slider.getBoundingClientRect();
		API.value =  Math.unitClamp((coords.x - bounds.left) / (bounds.width - valueWidth)) * (opts.max - opts.min) + opts.min;
	}
	function update() {
		bounds = bounds || slider.getBoundingClientRect();
		slide.style.right = (bounds.width - ((opts.value - opts.min) / (opts.max - opts.min)) * (bounds.width - valueWidth) | 0) + "px"
		value.textContent = opts.value.toFixed(opts.digits);
	}
	const API = {
		get name() { return opts.name },
		disable() { if (!opts.disabled) { opts.disabled = true; API.update() } },
		enable() {  if (opts.disabled) { opts.disabled = false; API.update() } },
		set text(t) { text.textContent = opts.text = t },
		get text() { opts.text },
		get height() { return slider.getBoundingClientRect().height },
		get value() { return opts.value },
		set value(v) {
			v = Math.clamp(Math.roundTo(v, opts.step), opts.min, opts.max);
			if (v !== opts.value) {
				opts.value = v;
				state && (state[opts.name] = v);
				API.action("changed");	
				API.update();	
			}
		},
		fromState() { state && (API.value = state[opts.name]) },
		stateObj(_state) { (state = _state)[opts.name] = API.value },
		get dialog() { return dialog },
		update() {
			text.textContent = opts.text;
			slider.style.left = opts.x + "px";
			slider.style.right = opts.right  + "px";
			slider.style.top = opts.y + "px";
			opts.disabled ? slider.classList.add("disabled") : slider.classList.remove("disabled");
			update();
			bounds = undefined;

		},	
		action(type) { opts[type] instanceof Function && opts[type](API, type) },
		close() {
			opts.keys && opts.keys.up && mouse.keyboard.removeEvent(opts.keys.up.mods, opts.keys.up.keys, opts.keys.up.modeName);
			opts.keys && opts.keys.down && mouse.keyboard.removeEvent(opts.keys.down.mods, opts.keys.down.keys, opts.keys.down.modeName);
			commands.remove(slider.command_Id);
			$R(dialog.frame, slider);
			state = slider = text = value = slide = undefined;			
			delete API.slider;
			delete API.update;		
		},		
		slider,
	}
	opts.keys && opts.keys.up && mouse.keyboard.event(()=> moveStep(opts.keyStep), opts.keys.up.mods, opts.keys.up.keys, opts.keys.up.modeName);
	opts.keys && opts.keys.down && mouse.keyboard.event(()=> moveStep(-opts.keyStep), opts.keys.down.mods, opts.keys.down.keys, opts.keys.down.modeName);
	$$(dialog.frame, $$(slider, slide, text, value));
	API.value = slideValue;
	return API;
}