function SliderAPI(el, slideBar, btn, buttonAPI) {
    const m = btn.mouse;
    var mouseOver = false;
    btn.range = btn.max - btn.min;
    btn.size = Math.max(btn.sizeW, btn.sizeH);
    btn.dir = btn.sizeW > btn.sizeH ? 0 : 1;
    btn.wheelStep = btn.wheelStep ?? btn.range / 20;
    const API = {
        ...buttonAPI,
        slideBar,
        set value(val) {
            var v =btn.value = Math.min(btn.max, Math.max(btn.min, val));
            v = ((v - btn.min) / btn.range) * btn.size;
            if (btn.dir) {
                slideBar.style.left = "0px";
                slideBar.style.top = (btn.sizeH - v) + "px";
                slideBar.style.bottom = "0px";
                slideBar.style.right = "0px";
            } else {
                slideBar.style.left = "0px";
                slideBar.style.top = "0px";
                slideBar.style.bottom = "0px";
                slideBar.style.right = (btn.sizeW - v) + "0px";
            }
        },
        get value() { return btn.value },
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
            el.classList.remove("overSlide");
        }
    }
    el._onMouseOver = (event) => {
        mouseOver = true;
        if (m.captured === el.API.id || m.captured === 0) {
            m.wheel = 0;
            el.classList.add("overSlide");
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
            const pos = btn.dir ? 1 - (m.fy / btn.sizeH) : m.fx / btn.sizeW;
            API.value = pos * btn.range + btn.min;
            el.commandId && m.commandSets.issueCommand(el.commandId, event, {oldButton: 1});
        }
    }
    return API;
}

export {SliderAPI};