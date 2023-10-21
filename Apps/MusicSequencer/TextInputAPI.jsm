import {commands} from "./commands.jsm";

function TextInputAPI(el, btn, buttonAPI) {
    const m = btn.mouse;
    const k = btn.keyboard;
    var mouseOver = false;

    const API = {
        ...buttonAPI,
        set value(val) {
			el.value = val;
			k.commandSets.issueCommand(btn.command);
        },
        get value() { return el.value },
    };

    function blur() {
        if (k.lockId === el.API.id) {            
            k.unlock(el.API.id);
        } 
        
    }
    function onInput(e) {
        if (k.lockId === el.API.id) {
            if (e.type === "keyup") {
                if (e.code === "Escape") {
                    el.blur();
                } else if (e.code === "Enter" || e.code === "Tab") {
                    if (e.code === "Enter" && btn.blurOnEnter === false) { e.preventDefault(); }
                    else { el.blur(); }
                    API.value = el.value;
                } else if (e.code === "ArrowUp"  && btn.keyCMDs.up) {
                    k.commandSets.issueCommand(btn.keyCMDs.up);
                } else if (e.code === "ArrowDown"  && btn.keyCMDs.down) {
                    k.commandSets.issueCommand(btn.keyCMDs.down);
                }
                
            }
        }
    }
    el.onblur = blur;

    
    el._focus = () => {
        if (k.lockId !== el.API.id) {
            if (k.lock(el.API.id, onInput)) {
                if (btn.keyCMDs.focus) {
                    k.commandSets.issueCommand(btn.keyCMDs.focus);
                } else {
                    el.focus();
                }
            }       
        }        
    }
    el._onMouseOut = (event) => {
        mouseOver = false;
        m.captured === 0 && el.classList.remove("overTextInput");
    }
    el._onMouseOver = (event) => {
        mouseOver = true;
        (m.captured === el.API.id || m.captured === 0) && el.classList.add("overTextInput");
    }
    el._onMouseUp = (event) => { }
    el._onMouseDown = (event) => {
        if (k.lockId !== el.API.id) {
            if (k.lock(el.API.id, onInput)) {
                if (btn.keyCMDs?.focus) {
                    k.commandSets.issueCommand(btn.keyCMDs.focus);
                } else {
                    el.focus();
                }
            }
        }
    }
	el.value = btn.value;
    return API;
}
export {TextInputAPI};