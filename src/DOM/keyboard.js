
import {events} from "../utils/events.js";
const keyboard = (()=>{
	const modeStack = [];
	const modes = {};
	const modekeys = {};
	var mode, modeName, active = false, keyElement;
	const modifiers = ["","c","a","s"];
	const modStr = mods => {
		mods = mods.toLowerCase();
		return modifiers[mods.includes("c") * 1] + modifiers[mods.includes("a") * 2] + modifiers[mods.includes("s") * 3];
	};

	function keyEvent(event) {
		const code = modifiers[event.ctrlKey * 1] + modifiers[event.altKey * 2] + modifiers[event.shiftKey * 3] + event.code;
		const isDown = event.type === "keydown";
		const processKey = mode => {
			const action = mode[code];
			if (action) {
				if(action.keyEvent) {
					isDown && action.listener(code);
					event.preventDefault();
				} else {
					mode[action.name] = isDown;
					event.preventDefault();
				}
			}
		}
		isDown && (API.keyPressed = true);
		processKey(modes.default);
		processKey(mode);

		API.lastKey = code + " " + event.type;
	}
	function clear() {
		for(const action of modekeys[modeName]) { mode[action] = false }
		API.lastKey = "";
	}
	function getMode(modeName) {
		if (!modes[modeName]) {
			modes[modeName] = {};
			modekeys[modeName] = [];
		}
		return modes[modeName];
	}
	const API = {
		keyPressed: false,
		lastKey: "",
		actions: null,
		saveMode() { modeStack.push(modeName) },
		restoreMode() { API.mode = modeStack.pop() },

		get mode() { return modeName },
		set mode(name) {
			if (modeName !== name) {
				if (!modes[name]) {
					modes[name] = {};
					modekeys[name] = [];
				}
				API.actions = mode = modes[modeName = name];
				clear();
			}
		},
		event(listener, mods, keys, mName = modeName) {
			mods = mods || "";
		    const k = Array.isArray(keys) ? [...keys] : [keys];
			const mode = getMode(mName);
			const event = {listener, keyEvent: true};
			for (const code of k) { mode[modStr(mods) + code] = event }
		},
		removeEvent(mods, keys, mName = modeName) {
		    const k = Array.isArray(keys) ? [...keys] : [keys];
			mods = mods || "";
			const mode = getMode(mName);
			for (const code of k) { delete mode[modStr(mods) + code] }
		},
		action(name, mods, keys, help) {

			mode[name] === undefined && modekeys[modeName].push(name);
			mode[name] = false;
			const action = {name, help};
			for(const code of keys) { mode[modStr(mods)  + code] = action }
		},
		get active() { return active },
		start(element = document) {
			if (!active) {
				active = true;
				keyElement = element;
				element.addEventListener("keydown", keyEvent);
				element.addEventListener("keyup", keyEvent);
				API.fireEvent("keyboardstarted");
			}
		},
		stop() {
			if (active) {
				clear();
				active = false;
				keyElement.removeEventListener("keydown", keyEvent);
				keyElement.removeEventListener("keyup", keyEvent);
				API.fireEvent("keyboardstopped");
			}
		}
	};
	API.mode = "default";
	Object.assign(API, events(API));
	return API;
})();
function simpleKeyboard() {
	const keys = {};
	var downCount = 0;
    var onKeyCB;
	function keyEvent(e) {
		const keyDown = e.type === "keydown";
        var isDefinedKey = false;
		if(keys[e.code] !== undefined) {
			keys[e.code] = keyDown;
			e.preventDefault();
            isDefinedKey = true;
		}
		if(keys.anyKey !== undefined) {
			downCount += keyDown ? 1 : -1;
			keys.anyKey = keyDown > 0;
            keyDown && onKeyCB && onKeyCB(e.code);
            
		} else if (isDefinedKey) { keyDown && onKeyCB && onKeyCB(e.code); }
	}
	const API = {
		keys,
		clear() {
			for(const name of Object.keys(keys)) { keys[name] = false }
		},
		addKey(...names) { for(const name of names) { keys[name] = false }; return keys },
        set onKey(callback) { callback && callback instanceof Function && (onKeyCB = callback); }
	};
	document.addEventListener("keydown", keyEvent);
	document.addEventListener("keyup", keyEvent);
	return API;
}
export {keyboard, simpleKeyboard};