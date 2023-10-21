import {$, $$, $R} from "../../src/DOM/geeQry.jsm";

function SelectorAPI(el, btn, buttonAPI) {
    const m = btn.mouse;
    //const id = m.getId();
    var mouseOver = false;
	var value = btn.value;
	var open = false;
	var selectedItem, selectedIdx;
	var nameTransform = btn.nameTransform ?? ((n) => n);
	btn.wheelStep = btn.wheelStep ?? -1;
	
	const items = btn.items;
	const selText = $("div",{className: "selectorText", style: {top: "0px",left: "0px",width: btn.sizeW + "px", height: btn.sizeH + "px"}});
	const pannel = $("div",{className: "selectorPannel"});
	const itemEls = items.map((item, idx) => $("div", {textContent: nameTransform(item), className: "selectorItem", _id: el._id, _idx: idx, _onMouseUp: mouseSelect}));	
	$$(pannel, ...itemEls);
    const API = {
        ...buttonAPI,
        set value(val) { 
			selectedItem?.classList.remove("selectorSelectedItem");
			value = val;
			selText.textContent = nameTransform(value);
			selectedIdx = items.indexOf(value);
			selectedItem = itemEls[selectedIdx];
			selectedItem?.classList.add("selectorSelectedItem");
			
		},
        get value() { return value },
		set index(val) {
			API.value = items[(val % items.length + items.length) % items.length];
		}, 
		get index() {
			return items.indexOf(value);			
		},
		updateValue(val) {
			API.value = val;
            el.commandId && m.commandSets.issueCommand(el.commandId + selectedIdx);
			
		},
		open() {
			if (m.captured === 0) {
				if (m.requestCapture(el.API.id, null, undefined, capturedUp)) {
					pannel.classList.add("selectorOpen");
					open = true;
				}
			}			
			return open;
		},
		close() {
			if (m.captured === el.API.id) {
				pannel.classList.remove("selectorOpen");
				m.releaseCapture(el.API.id);
				open = false;
			}
		},
		resetItems(newItems) {
			items.length = 0;
			items.push(...newItems)
			$R(pannel, ...itemEls);
			itemEls.length;
			itemEls.push(
				...items.map((item, idx) => 
					$("div", {textContent: nameTransform(item), className: "selectorItem",_id: el.API.id, _idx: idx, _onMouseUp: mouseSelect})
				)
			);			
			$$(pannel, ...itemEls);
			setTimeout(() => API.value = items[0]);
		},

    };
    el._onWheel = (event) => {
        if (m.captured === el.API.id || m.captured === 0) {
			const idx = items.indexOf(value);			
            API.updateValue(items[((idx + (m.wheel > 0 ? btn.wheelStep : -btn.wheelStep)) + items.length) % items.length]);
            m.wheel = 0;
        }
    }
    el._onMouseOut = (event) => {
        mouseOver = false;
        if (m.captured === 0) { el.classList.remove("overSelector"); }
    }
    el._onMouseOver = (event) => {
        mouseOver = true;
        if (m.captured === el.API.id || m.captured === 0) {
            m.wheel = 0;
            el.classList.add("overSelector");
        }
    }
    el._onMouseDown = (event) => {
        if (m.captured === 0) {
            API.open();
        } else if (m.captured === el.API.id) {
            API.close();			
		}
    }
	function capturedUp(event) {
		if (m.captured === el.API.id) {			
			if (event.target._id !== el.API.id) {
				API.close();
			}				
		}
		
	}
    function mouseSelect(event) {
		if (m.captured === el.API.id) {			
			if (event.type === "mouseup") {
				API.updateValue(items[event.target._idx]);
				API.close();
			}
		}
    }	
    function mouseDrag(event) {
        if (event.type === "mouseup") {
            m.releaseCapture(el.API.id);
        } else if (event.type === "mousemove" || event.type === "mousedown") {
            m.forElement(el);
        }
    }
	API.value = items[0];
	$$(el, selText, pannel);
    return API;
}

export {SelectorAPI};
