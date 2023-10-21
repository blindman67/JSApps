
function Keyboard() {
    var onCount = {  };
    var keys = {  };
    var currentMode;
	var onMetaChange;
	const metaNames = {
		Control: true,
		Shift: true,
		Alt: true, 
	};
    const modes = {
        all: {
            name: "all",
            keys:{},
        },
        default: {
            name: "default",
            keys:{},
        }
    }
    var currentMode = modes.all;
	var savedMode;
	var lockHandler;
    var debugCmd;
    const API = {
        set debug(val) { debugCmd = val },
        captured: 0,
		lockId: 0,
		lock(id, handler) {
			if (API.captured === 0 && API.lockId === 0) {
				API.lockId = API.captured = id;
				lockHandler = handler;
				return true;
			}
		},
		unlock(id) {
			if (API.captured === id && API.lockId === id) {
				API.lockId = API.captured = 0;
				lockHandler = undefined;
			}
		},
        requestCapture(id) {
            if (API.captured === 0) {
                API.captured = id;
                !keySets[id] && (keySets[id] = {});
                keys = keySets[id];
                return true;
            }
        },
        releaseCapture(id) {
            if (API.captured === id) {
                API.captured = 0;
                keys = keySets[0];
            }
        },
        get modeName() { return currentMode.name },
        set mode(name) { currentMode = modes[name] ? modes[name] : modes.all },
		saveMode() {savedMode = currentMode },
		restoreMode() { currentMode = savedMode },
        addMode(name) { !modes[name] && (modes[name] = {name, keys: {}}) },
        addKeyCommand(key, command, modeName =  currentMode.name) {
            modes[modeName] === undefined && API.addMode(modeName);
            const m = modes[modeName];
            m.keys[formatKey(key)] = {command};
        },
		getKeyDescription() {
			const desc = [];
			for (const mode of Object.keys(modes)) {
				desc.push("=============================================");
				desc.push("Keyboard mode: \"" + mode + "\"");
				
				for (const [k, v] of Object.entries(modes[mode].keys)) {
					const p = k.split("_");
					const kk = p.shift();
					const mod = p.join("");
					const key =(mod.replace("C","[Ctrl] ").replace("S","[Shift] ").replace("A","[Alt] ")) + "[" + (kk === " " ? "Space" : kk) + "]";
					if (isNaN(v.command)) {
                        if (v.cb.helpStr) {
                            desc.push(key + " " + v.cb.helpStr);
                        } else {
                            desc.push(key + " um");
                        }
                    } else {
						const commandName = 
							(API.commandSets.commandNameById(v.command) ?? "")
								.replace(/mainKeyboardAddKey/, "Add note ")
								.replace(/mainKeyboardKey/, "Play note ")
								.replace(/sys/,"")
								.replace(/mainTrack/,"Select track")
								.replace(/main/,"")
								.replace(/pat/,"")
								.replace(/([a-z])([A-Z])/g, "$1 $2")
								
								
						desc.push(key.padEnd(30,".") + ": " + commandName[0].toUpperCase() + commandName.slice(1));
					}
				}
			}
			return desc;
		},
        addKeyEvent(key, cb, modeName = currentMode.name) {
            modes[modeName] === undefined && API.addMode(modeName);
            const m = modes[modeName];
            m.keys[formatKey(key)] = {cb};
        },
        get keys() { return keys },
		set onMetaChange(cb) { onMetaChange = cb },
		get onMetaChange() { return onMetaChange },
        oldButton: 0,
    }
    function formatKey(key) {
        var [kName, meta] = key.split("_");
        if (meta) { kName += "_" + (meta.includes("S") ? "S" : "") + (meta.includes("C") ? "C" : "") + (meta.includes("A") ? "A" : "") }
        return kName;
    }

    function getMeta(e) {
        const any = e.shiftKey || e.ctrlKey || e.altKey;
		return (any ? "_" : "") + (e.shiftKey ? "S" : "") + (e.ctrlKey ? "C" : "") + (e.altKey ? "A" : "");
    }
    function keyEvent(e) {
		if (API.lockId !== 0) { 
			lockHandler?.(e);
			return;
		}
        const isDown = e.type === "keydown";
        API.downCount = onCount[e.key] = (isDown ? (!onCount[e.key] ? 1 : onCount[e.key] + 1) : 0);
        const key = (isDown ? e.key : e.key + "up") + getMeta(e);
        var keyCall;
        API.oldButton = 1;
        if (currentMode.keys[key]) { keyCall = currentMode.keys[key] }
        else if (modes.default.keys[key]) { keyCall = modes.default.keys[key] }
        keyCall && ((keyCall.command ? API.commandSets.issueCommand(keyCall.command, e, API) : keyCall.cb(e, key)), e.preventDefault());
        API.oldButton = 0;

        keys[e.key] = isDown;
        keys.shift = e.shiftKey;
        keys.ctrl = e.ctrlKey;
        keys.alt = e.altKey;
		if (onMetaChange && metaNames[e.key]) {
			onMetaChange(e.key, isDown);
			e.preventDefault();
		}
        if (keyCall) {
            API.status1 = " Cmd: " +
                (API.commandSets.commandNameById(keyCall.command) ?? "callBack") +
                " mode: " + (currentMode.keys[key] ? currentMode.name : "Default");
        } else {
        }
        API.status2 = "Event key: " + e.key + " " +  e.type;
        API.commandSets.issueCommand(debugCmd, event);
    }
    addEventListener("keydown", keyEvent);
    addEventListener("keyup", keyEvent);

    return API;
}
const customCursors = {
    pointer_delete: {
        center : " 6 1",
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAfCAYAAAD5h919AAAAAXNSR0IArs4c6QAAAsVJREFUSEull01v00AQhtcJIgG1UEWKo/Ah5YJyRkKCRBy4c+Jn8Iv4Obmg5MgNUYmCxFcUW0ppoUD6EfO+Zses1+PGTiu9srNez7MzOzPeBkb/C8IwXPNRFEW3cPkNXUBJyfyNw4E2A5BksVikj3q9HmFd3H6HzjdaLFu5Mt4A6MIDPcS8A+gESj2t+6d5pIGewPA+9MOGsC7HVAKJVYTwNu5/bbNflUDKfh1ZWOUw1gZt611t0LbeXQlUxzsX1LAvsljP3ZVXud9UawT5XWAF0KqKcaXWPsDeT63WCPG7AIbCSIyUFcx6nU+4fr/PDtLD/KXWQXIgaTm8loEIaDabBX632zVxHD/Cg/e2sHMrYeh24cGxa5j9zQclSWIajX/b+FVx8+7/sfu4jaAzKGvCBF2D9gCLy7wQiAtwDOfAdpwhPLQhTGFpMhAG0KkG8iECmEwmptVqmSAIzGg0ynlq54QYlI6fSHozJjuAHfkwGvJDRUPT6dQMBgPTbrdNp9NR52Ba9nlx64henbkg2XiCaNwP3Xw+N8w2f1zm4xV+XtKU9ws255XrjYRMMyp54M9x9mvpt6DMK98b2ZPxeHxZ1j0HlJ39tefVgQ/K9ophYb3IC7In9FILF4y/gL5Bn6C5A3qM3/taU0298kGz2cwMh0N14xk6G6YBbmPoxAHx6/xO7d6SgWgpWZiusEelHnGBLOIO9MCNt1KwL/H81SVZ98zuWWGPJIHoKRvaLrTU6gjj3Hieithu3pbMYSUzvQtZJyC50rMd6FAMOa3nKcY/QscQT0d+mMWbQh35EBe2hx9xjV5HCOHMwLQNqSdVj5g1XhumTd1bIJ8FgmvW68q8kXGB8Vx3D3qjvEDACvoDfYFYuDxCZ917E8SFMUFuQm3oDnQd4iJo7BRiwRJUOGRWCZ2/EHYP6oa9ynN+UflfB6+Fg+Vf3fdvgkpgZc8AAAAASUVORK5CYII=",
    },
	pointer_play_note: {
		center: " 6 16",
		url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAYAAACZOmSXAAAAAXNSR0IArs4c6QAAAvJJREFUSEvFVl1vDUEYfrZa34IguHYhFcqFRkTwCxCJ+EiQcEPigkT8CldukRApFzRx4UeIutFDaBMXGlIpFUTQL13PM/vOdnbPnu6ecxomeTOzszPzPO/nTIS5FqEfF7AFHRjm5FaKejU/Ponb/PpDmaXEwd6WhpHtivCSwDtwl99dlEUU/88fHOMpzmIvbnJieiEICCDR+BjuOOBXeEKd8sAgscNO6z6cx2lHYKZdAtL4omnc6YC34ygPXUbpDLSP8QIPsAuHnNbPSGAPbpkF5IaWWkR97+McLhH4sQF34Q0+ZU7rxian6SDX7KQF+nCG2stFk0agJf9HeE6NenGFFnhIC5wi8Ci6sZGHrjT/g3NDbq6GR+jBCfr+OH1/j/9/l4DPS0q+lYkFJB9qPEVZmjOpAlCBOGH9L/Y6WN+K/LLmXZMhI3D5VtHbTFtnwD8rbFpra0XAg7txCh4PFB8z+DaZH/mY9Eeuum4b5XUcl7s6iuoSR2Scu/RHJl1F+apTh/vnSAyNzI0NVBP7KD8otZBuFSJab2Q2Cy/Jc2AxRYw25A8NAA5wrOgW61pVsJBgAN7D8Xtvkw5+KKBWUBR0H65fTrZdu+E6AUvbcQMfbxN8N895FzrEu0Ak1lBGjfV+A1buf6couqV92pohYmbvzYM7q5gsYb+ast4QvrD/RlFWTDcDFpJ0AEkAFoL7tXKD4mC5TSifVQe0c+JfgFeq2c0SKdNc2s02e2jevI2+y8CV9zP/EzwtOlU18uvKSJvmdanm9+eLjgKv/nGRZaX/AxWBlbpK2bTI5BX0RUcFp+hJVbR+rBF4UN99zRjjAa68NowNAy6zvM6YKgIOQMPSrCqpmjFZZs7QFY1IyDKZwlMAqjqhQqXKqGvYPUCrgs9nnUxaGvBBbhBgCKoHiApVeq+3C55JSwP2l9Bn0zQElRLpI2AhwMO0DC8hfxcUPqHEol3wMC31tFKTb5VKuvulZcPnTrvgAgvTUt/+RVv6sPwLia337TPQJhsAAAAASUVORK5CYII=",
	},
	pointer_track_select: {
		center: " 7 1",
		url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAeCAYAAADdGWXmAAAAAXNSR0IArs4c6QAAAsxJREFUSEu1lkluFDEUhnsAEQQSCkM3G1CUA3AEsoVIIObATTgCN0FBSCDWSFwBWIQVEbBI002YExJI0s3/lf2qXe6qllMBS7/s8vB+v8n1mo3q1up0OnssDwaD0+o2hT/CcMqZqUvNqlURjfr9frbc7XYhnNOQid/CqA7hfsgWRLAifBN2/zfZZRG8Fj4LO3XMmayZ911mVeFHHf8lk5X475MnJIiSfFiLzPyloOlo/DNVy1pkpmWzmR0nSpO0PBAZKVGhJWadMG1IxrhtYR3nWeizqrHPRbQkWkOyzK9GFr4WZ7SwJbKNFILIpGXph7wN/JqRlbwW85pbNUFlEsK5zHcPKgLy/tivE2RZInlfpJBNJbIbeUIz4ylpsh4Kh7AWmRNc1NTNLRjZDAqJ8F0KQaUJndC7wi/hWW5aN38pDxB9zIhsc79kSPH5Zne4osFbYSUiWwzJDmvDrAh7ByBckoyB8KIQMJFmeSiJLNlXo9E4Ar12VwvmQ1dHdJtLMBo1vgZemM1SYSphJpgz2muEuSnDFBgTfcG0ZkZHqMNqSyJbxpTD4bDRarXCeMjGSWSOCLOuC6umGZMh2TV9P0W7Xq/XaLfbk7fnxPhydpl7GjyMggKzvhHWhO0yzYqCQqFmbixg8+P1or+cZovCS6/d7iRZLLxcsCOjedNrRLnwPM4tzb1KIcPeywWh0zW7oP0UQx/8NW6p5w+QF0mmGXUhC9eFJ8INgTqDnKHIod0RHkVjBD4WMOFH4b1wTDjn9/Gdl3/hcwXhWYFi9Ljf9F09huIwewnhk14QZkMwZQE9ZKxznjYvsIfvrNiNX5CjmqMmPCRsC/wEeVkQxl4K1CNeGOusscf2b0U+m9PahGZGTFLxLCCYMtvG/MFpzFniMXaPguvBTkR2UXPmsz3TzMs6UId2JwSSmHZTCAPkn5JxcUxMFXTeExKZuRn/AgJqcNgocM+3AAAAAElFTkSuQmCC",
	},
}

function MouseKeyboard(blockContextMenu = false) {
    var id = 100;
    var repeatEvent = {type: "repeat"};
    var repeaterHdl, repeating;
	const repeatInfo = {
		cmd:0, 
		target: null, 
		rate: 0,
		on: false,
		hdl: null,
		clear() {
			clearTimeout(repeatInfo.hdl);
			repeatInfo.target = null;
			repeatInfo.on = false;
		},
		start(t) {
			repeatInfo.cmd = t.commandId;
			repeatInfo.target = t;
			repeatInfo.rate = t._firstRepeat ?? t._repeats;
			repeatInfo.on = true;
			API.cmdRepeater();
			repeatInfo.rate = t._repeats
		}			
	};
	const metaEvent = {
		altKey: false,
		ctrltKey: false,
		shifttKey: false,
		target: document,
		pageX: 0,
		pageY: 0,
		type: "mousemove",
	};
		
    const API = {
        x: 0,
        y: 0,
        fx: 0,
        fy: 0,
        oldX: 0,
        oldY: 0,
        scaleX: 1,
        scaleY: 1,
        alt: false,
        ctrl: false,
        shift: false,
        button : 0,
        oldButton : 0,
        buttonMask : 0b111,
        buttons : [1, 2, 4, 0b110, 0b101, 0b011, 0],
        wheel : 0,
        captured: 0,
        overElement: false,
        downOn: null,
        upOn: null,
        onMove: null,
		onCapturedUp: null,
        over: null,
        cursor: "default",
        title: null,
        element: null,
        getId() { return id++ },
		getCustomCursorStyle(name) {
            const c = customCursors[name];
            return c ? `url('${c.url}')${c.center}, pointer` : null;			
		},
        tasks: [],
        addTask(call) {
            API.tasks.push(call);
        },
        removeTask(call) {
            var h = 0, t = 0;
            while (h < API.tasks.length) {
                if (API.tasks[h] === call) { h ++; }
                else {
                    if (h !== t) { API.tasks[t] = API.tasks[h]; }
                    t++;
                    h++;
                }
            }
            API.tasks.length = t;
        },
        requestCapture(id, onMove, repeats, onCapturedUp = null) {
            if (API.captured === 0) {
                API.captured = id;
                API.onMove = onMove;
                API.onCapturedUp = onCapturedUp;
                if (repeats) {
                    repeating = repeats;
                    API.repeater();
                }
                return true;
            }
        },
        releaseCapture(id) {
            if (API.captured === id) {
                if (repeating) {
                    clearTimeout(repeaterHdl);
                    repeating = 0;
                }
                API.captured = 0;
                API.onMove = null;
				API.onCapturedUp - null;
                if (API.element !== null) {
                    API.element.title = API.title = "";
                    API.element.style.cursor = API.cursor = "default";
                    API.element = null;

                }
            }
        },
        repeater() {
            clearTimeout(repeaterHdl);
            if (API.captured !== 0) {
                API.onMove && API.onMove(repeatEvent);
                repeating > 0 && (repeaterHdl = setTimeout(API.repeater, repeating));
            }
        },
        cmdRepeater() {
            clearTimeout(repeaterHdl);	
			mouse.oldButton = mouse.button;			
            mouse.commandSets.issueCommand(repeatInfo.cmd, repeatEvent, mouse);
            repeatInfo.rate > 0 && (repeatInfo.hdl = repeaterHdl = setTimeout(API.cmdRepeater, repeatInfo.rate));
            
        },
        canUse(id) { return API.captured === 0 || API.captured === id },
        requestCustomCursor(id, cursorName, element) {
            if (API.captured === 0 || API.captured === id) {
                const c = customCursors[cursorName];
                c && (element.style.cursor = `url('${c.url}')${c.center}, pointer`);
            }
        },
        requestCursor(id, cursor, title, element) {
            if (API.captured === id) {
                API.element = element;
                element.style.cursor = API.cursor = cursor;
                element.title = API.title = title;
            }
        },
        forElement(el = mouse.element){
            mouse.bounds = el.getBoundingClientRect();
            mouse.fx = mouse.x - mouse.bounds.left - scrollX;
            mouse.fy = mouse.y - mouse.bounds.top - scrollY;
            if(mouse.fx < 0 || mouse.fx >= mouse.bounds.width || mouse.fy < 0 || mouse.fy >= mouse.bounds.height){
                mouse.overElement = false;
            } else { mouse.overElement = true }
        },
        scaleTo(resW, resH) {
            mouse.oldX /= mouse.scaleX;
            mouse.oldY /= mouse.scaleY;
            mouse.x /= mouse.scaleX;
            mouse.y /= mouse.scaleY;
            mouse.scaleX =  resW / innerWidth;
            mouse.scaleY = resH / innerHeight;
            mouse.oldX *= mouse.scaleX;
            mouse.oldY *= mouse.scaleY;
            mouse.x *= mouse.scaleX;
            mouse.y *= mouse.scaleY;
        },
		onMetaChange(key, down) {
			metaEvent.ctrlKey = key === "Control" && down;
			metaEvent.shiftKey = key === "Shift" && down;
			metaEvent.altKey = key === "Alt" && down;
			metaEvent.pageX = mouse.x / mouse.scaleX;
			metaEvent.pageY = mouse.y / mouse.scaleY;
			metaEvent.target = mouse.over;
			mouseEvent(metaEvent);
		},
		listenForMeta(keyboard, on = true) { keyboard.onMetaChange = on ? API.onMetaChange : undefined }
    };
    const mouse = API;
    function mouseEvent(e) {
        const t = e.target;
        mouse.oldX = mouse.x;
        mouse.oldY = mouse.y;
        mouse.x = e.pageX * mouse.scaleX;
        mouse.y = e.pageY * mouse.scaleY;
        mouse.alt = e.altKey;
        mouse.shift = e.shiftKey;
        mouse.ctrl = e.ctrlKey;
        for (const call of mouse.tasks) { call(e, mouse); }
        if (e.type === "mousedown") {
            mouse.oldButton = mouse.button;
            mouse.button |= mouse.buttons[e.which-1];
            mouse.downOn = t;
            if (t._onDrag) {
                if (t._onDrag(e, mouse)) { return; }
            } 
            if (!mouse.onMove) {
                if (t._repeats && mouse.captured === 0 && t.commandId && (mouse.button & t._repeatMask)) {
					repeatInfo.cmd = t.commandId;
					repeatInfo.target = t;
					repeatInfo.rate = t._repeats;
					repeatInfo.start(t);
					repeatInfo.on = true;
				} else {
					t._onMouseDown && t._onMouseDown(e, mouse);
				}
            }
        }  else if (e.type === "mouseup") {
            mouse.oldButton = mouse.button;
            mouse.button &= mouse.buttons[e.which + 2];
            mouse.upOn = t;
			if (repeatInfo.on) { 
				repeatInfo.clear()
				return;
			}       
            if (!mouse.onMove) {
                mouse.upOn === mouse.downOn && (
                    t._onMouseUp ?
                        t._onMouseUp(e, mouse) :
                        (((mouse.captured === 0 || mouse.captured === t.captureId) && t.commandId) ? 
							mouse.commandSets.issueCommand(t.commandId, e, mouse) :
							mouse.onCapturedUp?.(e, mouse)
						)
                );
            }
        } else {
			if (repeatInfo.on) { 
				if (t !== repeatInfo.target) { repeatInfo.clear() }
				return;
			}
            if (!mouse.onMove) {
                if (!t) { return }
                mouse.over && mouse.over !== t && mouse.over._onMouseOut && mouse.over._onMouseOut(e, mouse);
                mouse.over = t;
                t._onMouseOver && t._onMouseOver(e, mouse);
            }
        }
        mouse.onMove && mouse.onMove(e, mouse);
    }
    function cancelableWheel(e) {
        e.preventDefault();
        const t = e.target;
        mouse.over !== t && (mouse.wheel = 0);
        mouse.alt = e.altKey;
        mouse.shift = e.shiftKey;
        mouse.ctrl = e.ctrlKey;
        mouse.wheel += -e.deltaY;
        t._onWheel && t._onWheel(e, mouse);
    }
    document.addEventListener("mousemove", mouseEvent, {passive: true});
    document.addEventListener("mousedown", mouseEvent, {passive: false});
    document.addEventListener("mouseup", mouseEvent, {passive: true});
    document.addEventListener("wheel", cancelableWheel, {passive: false});
    blockContextMenu && document.addEventListener("contextmenu", (e) => { e.preventDefault() });
    API.keyboard = Keyboard();
    return API;
}
export {Keyboard, MouseKeyboard};