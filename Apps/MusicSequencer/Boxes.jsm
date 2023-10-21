const Pad = (left = 0, top = 0, right = 0, bottom = 0) => ({left, top, right, bottom});
function ScreenBox() {
    const box = Box(null, null, 0, 0, innerWidth, innerHeight);
    const resized = () => {
       box.width = innerWidth;
       box.height = innerHeight;
       box.update();
    };
    box.resize = resized;
    addEventListener("resize", resized)
    return box;
}

function Box(parent, margin, x, y, width, height, maxWidth, maxHeight) {
    const children = [];
    margin = margin ?? Pad();
    var element;
    const API = {
        x, y,
        width,
        height,
        top: y ?? 0,
        bottom: (y ?? 0) + (height ?? maxHeight ?? 1),
        left: x ?? 0,
        right: (x ?? 0) + (width ?? maxWidth ?? 1),
        addChild(child) { children.push(child) },
        set element(el) { el !== element && (element = el) },
        get element() { return element },
        onUpdate: null,
        update(silent = false) {
            if (parent) {
                API.x = (x === undefined ? parent.right - margin.right - (maxWidth ?? 0): parent.x + margin.left) | 0;
                API.y = (y === undefined ? parent.bottom - margin.bottom - (maxHeight ?? 0) : parent.y + margin.top) | 0;
                API.width = maxWidth ?? ((parent.x + parent.width) - API.x - margin.right) | 0;
                API.height = maxHeight ?? ((parent.y + parent.height) - API.y - margin.bottom) | 0;
            }
            API.left = API.x;
            API.right = API.x + API.width;
            API.top = API.y;
            API.bottom = API.y + API.height;
            if (! silent) {
                for (const child of children) { child.update() }
                API.onUpdate && API.onUpdate(API);
                element && API.apply(element);
            }
        },
        apply(el = element) {
            el.style.left = API.x + "px";
            el.style.top = API.y + "px";
            el.style.width = API.width + "px";
            el.style.height = API.height + "px";
            if (el.ctx) {
                if (API.width !== el.width || API.height !== el.height) {
                    el.width = API.width;
                    el.height = API.height;
                }
            }
            el.onResized && element.onResized();
        },
    };
    parent && parent.addChild(API);
    API.update(true);
    return API;
}

export {Pad, ScreenBox, Box};