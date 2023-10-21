function DrawableAPI(el, btn, buttonAPI) {
    const m = btn.mouse;
    var mouseOver = false;
    const API = {
        ...buttonAPI,
        resize(w, h) {
            el.width = w;
            el.height = h;
            el.style.width = w + "px";
            el.style.height = h + "px";           
        },
        ctx: el.getContext("2d"),

    };
    el._onWheel = (event) => {
        if (m.captured === el.API.id || m.captured === 0) {
            API.value = btn.value + (m.wheel > 0 ? btn.wheelStep : -btn.wheelStep);
            m.wheel = 0;
            el.commandId && m.commandSets.issueCommand(el.commandId, event, {oldButton: 1});
        }
    }
    el._onMouseOut = (event) => {
        mouseOver = false;
        if (m.captured === 0) {
            el.classList.remove("overDrawable");
        }
    }
    el._onMouseOver = (event) => {
        mouseOver = true;
        if (m.captured === el.API.id || m.captured === 0) {
            m.wheel = 0;
            el.classList.add("overDrawable");
        }
    }
    el._onMouseDown = (event) => {
        if (m.captured === el.API.id || m.captured === 0) {
            if (m.requestCapture(el.API.id, mouseDrag)) {
                mouseDrag(event);
            }
        }
    }
    function mouseDrag(event) {
        if (event.type === "mouseup") {
            m.releaseCapture(el.API.id);
        } else if (event.type === "mousemove" || event.type === "mousedown") {
            m.forElement(el);
            el.commandId && m.commandSets.issueCommand(el.commandId, event, {oldButton: 1});
        }
    }
    return API;
}

export {DrawableAPI};