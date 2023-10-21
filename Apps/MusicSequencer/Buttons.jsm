import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {Extent} from "./Extent.jsm";
import {sprites, createBgURL} from "./ButtonSprites.jsm";
import {SliderAPI} from "./SliderAPI.jsm";
import {DrawableAPI} from "./DrawableAPI.jsm";
import {SelectorAPI} from "./SelectorAPI.jsm";
import {TextInputAPI} from "./TextInputAPI.jsm";
import {NoteSelAPI} from "./NoteSelAPI.jsm";
Math.sig = (v, p = 2) =>  v <= 0 ? 0 : v >= 1 ? 1 : v ** p / (v ** p + (1 - v) ** p);
const buttonAPI = {
    
    enabled: true,
    enable(enable = true) {
        if (!enable) {
            this.element.classList.add("disabled");
        } else {
            this.element.classList.remove("disabled");
        }
        this.enabled = enable;
    },
    disable() {
        this.element.classList.add("disabled");
        this.enabled = false;
    },
    hide(force = false) {
        if (!this.hidden || force) {
            this.element.classList.add("hide");
            this.hidden = true;
        }
    },
    show(force = false) {
        if (this.hidden || force) {
            this.element.classList.remove("hide");
            this.hidden = false;
        }
    },
    setHelp(text) { this.element.title = text },
    setChecked(checked, extraClass) {
        const cl = this.element.classList;
        const name = extraClass ? extraClass : "checked";
        cl.toggle(name, checked);
        this[name] = checked;
    },
};
var popup;
function popupAPI(el, btn) {
    const m = btn.mouse;
    var popupText = "";
    var showing = false;
    const show = (e) => {
        popup.textContent = popupText;

        popup.style.top = (m.y - 5) + "px";
        popup.style.left = (m.x + 15) + "px";   
        showing = true;

    }
    const oldMouseOut = el._onMouseOut;
    const oldMouseOver = el._onMouseOver;
    el._onMouseOut = (event) => {
        oldMouseOut(event);
        if (showing && m.captured === 0) {

                API.hidePopup();

        }        
    }
    el._onMouseOver = (event) => {
        console.log("Mouse over");
        oldMouseOver(event);
        if (m.captured === el.API.id || m.captured === 0) {
            if (!showing) {
                API.showPopup();
            }
        }
    }
    const API = {
        setPopupText(t) { popupText = t; },
        showPopup() {
            popup.classList.remove("hide");
            m && (m.addTask(show), show());

        },
        hidePopup() {
            popup.textContent = "";
            popup.classList.add("hide");
            m && m.removeTask(show);
            showing = false;
        }
    };
    return API;
    
}
const dialogDrag = (element, dragsEl) => (e, mouse) => {
    if (element._dragId === undefined) { element._dragId = mouse.getId() }
    if (e.type === "mousedown") {
        if (mouse.requestCapture(element._dragId, element._onDrag)) {
            const b = dragsEl.getBoundingClientRect();
            dragsEl._x = b.left;
            dragsEl._y = b.top;
            element._x = mouse.x;
            element._y = mouse.y;
            return true;
        }
    } else if (e.type === "mousemove" || e.type === "mouseup") {
        if (mouse.captured === element._dragId) {
            dragsEl._x = (mouse.x - element._x) + dragsEl._x;
            dragsEl._y = (mouse.y - element._y) + dragsEl._y;
            dragsEl.style.left = dragsEl._x + "px";
            dragsEl.style.top = dragsEl._y + "px";
            element._x = mouse.x;
            element._y = mouse.y;
            if (e.type === "mouseup") {  
                mouse.releaseCapture(element._dragId); 
                if (element.commandId) {
                    mouse.commandSets.issueCommand(element.commandId, e, mouse);
                }                    
            }
            return true;
        }
    } 
}
const textScroll = (element) => (e, mouse) => {
    var sp = element.scrollTop - (mouse.wheel / 2.1 | 0);
    mouse.wheel = 0;
    element.scrollTop = sp;
        
}
const Buttons = {
	createFloating(title, w, h, commons) {
		var element, titleEl, scrollBox;
		var scrollTo = 0, scrollFrom = 0, scroll = 0;
		var yPos = 0;
		$$(document.body, element = $("div", {
			className: "floatingBox", style: {
				width: w + "%",
				height: h + "%",
				left: (50 - w / 2) + "%",
				top: (50 - h / 2) + "%",
			}
		}));
		$$(element, titleEl = $("div", {
				className: "floatingBoxTitle",
				textContent: title,
				style: {
					left: "10px",
					top: "2px",
					width: "80%"
				}
			}),
			scrollBox = $("div", {
				className: "floatingBoxScrollBox",
				_onWheel: onWheel,
			}),
		);
		function wheelScroll() {
			if (commons) {
				const pos = scrollBox.scrollTop;
				scroll = scroll < 1 ? scroll += 0.1 : 1;
				const cPos = (scrollTo - scrollFrom) * Math.sig(scroll) + scrollFrom;
				scrollBox.scroll(0, cPos);
				const newPos = scrollBox.scrollTop;
				if (scroll >= 1) {
					scroll = 1;
					scrollFrom = scrollTo = newPos;
					return false;
				}
				return true;
			}
			scrollBox.scroll(0, scrollPos);
		}
		function onWheel(e, mouse) {
			scrollTo = scrollFrom  - ((mouse.wheel ** 2) * Math.sign(mouse.wheel) / 64);
			scrollFrom = scrollBox.scrollTop;
			if (scroll === 0 || scroll === 1) { commons.render.once = wheelScroll }
			scroll = 0;
			mouse.wheel = 0;
		}
		return {
			element,
			addInfo(...info) {
				$$(scrollBox, ...info.map(text => {
					const info = $("div", {
						className: "infoItem",
						textContent: text,
						style: {top: yPos + "px"}
					});
					yPos += 16;
					return info;
				}));
			},
			close() { $R(document.body, element) },
		};
	},
    byCmd: new Map(),
    Groups: Object.assign(new Map(), {
        addButton(btn) { btn.group && (Buttons.Groups.get(btn.group)?.push(btn) ?? Buttons.Groups.set(btn.group, [btn])) },
        checkAll(group, check, extraClass) {
            const btns = Buttons.Groups.get(group);
            if (btns) {
                for (const b of btns) { b.element.API.setChecked(check, extraClass) }
            }
        },
        hide(group, cmd, hide) { },
        check(group, cmd, check, extraClass) {
            
            const btns = Buttons.Groups.get(group);
            if (btns) {
                for (const b of btns) { b.element.commandId === cmd && b.element.API.setChecked(check, extraClass) }
            }
        },
        radio(group, cmd, check, extraClass) {
            const btns = Buttons.Groups.get(group);
            if (btns) {
                for (const b of btns) { b.element.API.setChecked((b.element.commandId === cmd ? check : !check), extraClass) }
            }
        },
        enable(group, enable = true) {
            const btns = Buttons.Groups.get(group);
            if (btns) {
                for (const b of btns) { enable ? b.element.API.enable() : b.element.API.disable() }
            }
        },
    }),
    BGSpriteStyle(name, idx) {
        const set = sprites[name];
        const x = set.size.x + (idx % set.cols) * set.size.w;
        const y = set.size.y + (idx / set.cols | 0) * set.size.h;
        return (-x) + "px " + (-y) + "px";
    },
    getButtonSize(name) {
        const set = sprites[name];
        return [set.size.w, set.size.h];
    },
    add(container, list){
		const addEl = (el, x, y, w = 0, h = 0) => {
			newEls.push(el);
			if (extent) {
				extent.point(x, y);
				extent.point(x + w, y + h);
			}
		}
		const position = (x, y, w, h) => ({left: x + "px", top: y + "px", width: w + "px", height: h + "px"});
		const positionH = (x, y, r, h) => ({left: x + "px", top: y + "px", right: r + "px", height: h + "px"});
		const positionCr = (x, y) => ({left: x + "px", top: y + "px"});
		const placements = {
			topLeft: (x, y) => ({left: x + "px", top: y + "px"}),
			topRight: (x, y) => ({right: x + "px", top: y + "px"}),
			bottomRight: (x, y) => ({right: x + "px", bottom: y + "px"}),
			bottomLeft: (x, y) => ({right: x + "px", bottom: y + "px"}),
		};
		const positionAb = (l, t, r, b) => ({left: l + "px", top: t + "px", right: r + "px", bottom: b + "px"});

        const newEls = [];
        var bCont, extent;
        for (const btn of list) {
            const {x, y, command, type, size, help, sprite, sprites, group} = btn;
            let el;
            const pxScale = btn.pxScale ?? 9;
            const xx = x * pxScale;
            const yy = y * pxScale;
            var m_Id;
            if (btn.mouse) { m_Id = btn.mouse.getId(); }
                
            if (type === "subContain") {
                el = bCont = $("div", {
                    className: "buttonContainer" + (btn.cssClass ? " " + btn.cssClass : ""),
                    id: btn.id,
                    _id: m_Id,
                    title: help ? help : "",
                    commandId: command,
                    API: { ...buttonAPI, fitContent: btn.fitContent},
                    style: { ...positionCr(xx, yy) },
                    
                });
                btn.padX !== undefined  && (bCont._padX = btn.padX);
                btn.padY !== undefined  && (bCont._padY = btn.padY);
                extent = Extent();
            } else if (type === "existingContainer") {
                el = bCont = $("?#"+btn.id)[0];
                extent = Extent();
                bCont.innerHTML = "";
            } else if (type === "textInput" || type === "textCMDInput") {
                el = $("input", {
                    className: type + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
					captureId: btn.captureId,
                    commandId: command,
                    _id: m_Id,
                    style: { ...position(xx, yy, btn.sizeW, btn.sizeH) }
                });
				el.API = TextInputAPI(el, btn, buttonAPI);
				addEl(el, xx, yy, btn.sizeW, btn.sizeH);
            }  else if (type === "button") {
                el = $("div", {
                    className: "button " + (size ? "icon" + size : btn.sizeName) + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
                    commandId: command,
                    _id: m_Id,
                    API: { ...buttonAPI,},
                    style: { ...positionCr(xx, yy) }
                });
				addEl(el, xx, yy, ...Buttons.getButtonSize(size ? "icon" + size : btn.sizeName));
			} else if (type === "buttonRendered") {
                
                el = $("div", {
                    className: "button rendered" + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
					captureId: btn.captureId,
                    commandId: command,
                    _id: m_Id,
                    API: { ...buttonAPI,},
                    style: { ...position(xx, yy, btn.w, btn.h), background: "url(" + createBgURL(btn.w, btn.h, btn.draw) + ")"}
                });
				
				addEl(el, xx, yy, btn.w, btn.h);  
                
			} else if (type === "buttonNew") {
                btn.sizeName = btn.sizeName ? btn.sizeName : "icon" + size;
                el = $("div", {
                    className: "button " + btn.sizeName + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
					captureId: btn.captureId,
                    commandId: command,
                    _id: m_Id,
                    API: { ...buttonAPI,},
                    style: { ...(btn.posRef && placements[btn.posRef] ? placements[btn.posRef](xx, yy) : positionCr(xx, yy)) }
                });
				
				addEl(el, xx, yy, ...Buttons.getButtonSize(btn.sizeName));

			} else if (type === "selection") {
                el = $("div", {
                        className: "selectionContainer",
                        title: help ? help : "",
                        commandId: command,
                        _id: m_Id,
                        style: { ...position(xx, yy, btn.sizeW, btn.sizeH) }
                    });
                el.API = SelectorAPI(el, btn, buttonAPI);
				const bounds = $("?@", el);
				addEl(el, xx, yy, btn.sizeW, btn.sizeH);
            } else if (type === "slide") {
                const slideBar = $("div", {
                    className: "slideBar",
                    style: {
                        background: btn.color ?? "#0F0",
						...positionAb(0, 0, 0, 0),
                    }
                });
                el = $$($("div", {
                        className: "slide",
                        title: help ? help : "",
                        commandId: command,
                        _id: m_Id,
                        style: { ...position(xx, yy, btn.sizeW, btn.sizeH) }
                    }), slideBar);
				addEl(el, xx, yy, btn.sizeW, btn.sizeH + 1);
                el.API = SliderAPI(el, slideBar, btn, buttonAPI);
                el.API.value = btn.value;
            } else if (type === "text" || type === "noteSel") {
                
                el = $("div", {
                    className: "text" + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
                    textContent: btn.text ?? "",
                    commandId: command,
                    _id: m_Id,
                    API: { ...buttonAPI,},
                    style: {
						...position(xx, yy, btn.sizeW ?? size, btn.sizeH ?? size),
                        ...(btn.fontSize ? {fontSize: btn.fontSize = "px"} : {})
                    }
                });
				addEl(el, xx, yy, size, (btn.sizeH ?? size) + 1);
                if (!btn.onWheel && btn.scrolling) {
                    btn.onWheel = textScroll(el);
                }
                if (type === "noteSel") {
                    el.API.xx = xx;
                    el.API.yy = yy;
                    NoteSelAPI(el, btn);
                } else {
                    Object.assign(el.API, {
                        setText(text) { el.textContent = text }, 
                        getText() { return el.textContent }                    
                    });
                }
            } else if (type === "dragger") {
                el = $("div", {
                    className: "dragger" + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
                    textContent: btn.text ?? "",
                    commandId: command,
                    _id: m_Id,
                    API: { ...buttonAPI,},
                });
				addEl(el, xx, yy, size, (btn.sizeH ?? size) + 1);
                if (!btn.onDrag) {
                    btn.onDrag = dialogDrag(el, btn.drags);
                    
                }
            } else if (type === "drawable") {
                el = $("canvas", {
                    className: "drawable" + (btn.cssClass ? " " + btn.cssClass : ""),
                    title: help ? help : "",
                    commandId: command,
                    _id: m_Id,
                    width: btn.sizeW ?? size,
                    height: btn.sizeH ?? size,
                    style: {top: yy + "px", left: xx + "px"},
                });
				addEl(el, xx, yy, btn.sizeW ?? size, btn.sizeH ?? size);
                el.API = DrawableAPI(el, btn, buttonAPI);
                el.API.resize(btn.sizeW ?? size, btn.sizeH ?? size);
            }
            if (btn.mouse) {
                el.API.id = m_Id;
                
            }
            if (btn.data) {
                el._data = btn.data;
                btn.data = undefined;
            }
            if (btn.onWheel) {
                el._onWheel = btn.onWheel;
                btn.onWheel = undefined;
            }
            if (btn.onDrag) {
                el._onDrag = btn.onDrag;
                btn.onDrag = undefined;
            }           
            if (btn.onMouseOut) {
                el._onMouseOut = btn.onMouseOut;
                btn.onMouseOut = undefined;
            }
            if (btn.onMouseOver) {
                el._onMouseOver = btn.onMouseOver;
                btn.onMouseOver = undefined;
            }              
            if (group) { Buttons.Groups.addButton(btn) }
            if (btn.popupText) {
                if (!popup) {
                    $$(content, popup = $("div", {id: "popupElement", className: "popup hide"}));
                }
                Object.assign(el.API, popupAPI(el, btn));                
            }
            if (type === "buttonNew") {
                if (sprite !== undefined && sprites === undefined) {                   
                    el.API.setSprite = idx => { el.style.backgroundPosition = Buttons.BGSpriteStyle(btn.sizeName, idx); }
                } 
                if (sprites) {
                    el.API.setSprite = idx => {
                        el.style.backgroundPosition = Buttons.BGSpriteStyle(btn.sizeName, sprites[idx % sprites.length]);
                    }
                    el.API.setSprite(sprite);
                } else {  el.style.backgroundPosition = Buttons.BGSpriteStyle(btn.sizeName, sprite) }
            }
            if (type === "button") {
                if (sprites !== undefined) {
                    el.API.setSprite = idx => {
                        el.style.backgroundPosition = Buttons.BGSpriteStyle(size ? "icon" + size : btn.sizeName, sprites[idx % sprites.length]);
                    }
                    el.API.setSprite(sprite);
                } else {
                    el.style.backgroundPosition = Buttons.BGSpriteStyle(size ? "icon" + size : btn.sizeName, sprite);
                }
            }
            Buttons.byCmd.set(command, btn);
            el.API.element = el;
            btn.element = el;
            btn.disable && (el.API.disable(true), delete btn.disable);
            btn.hidden && el.API.hide(true);
        }
        if (bCont) {
            $$(container, $$(bCont, ... newEls));
            if (!bCont.API || bCont.API.fitContent === undefined || bCont.API.fitContent === true) {
                extent.complete();
                bCont.style.width = extent.w + "px";
                bCont.style.height = extent.h + "px";
            } else {
                extent.complete();
                container.style.width = (extent.w + (bCont?._padX ?? 0)) +"px";
                container.style.height = (extent.h + (bCont?._padY ?? 0)) + "px";                
            }
            newEls.unshift(bCont);
        } else {
            $$(container, ... newEls);
        }
        return newEls;
    },
};
export {Buttons};