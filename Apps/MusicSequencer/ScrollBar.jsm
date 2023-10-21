const sprites = {

    ArrowLight: {x: 0, y: 0, w: 17, h: 17},
    ArrowDark:  {x: 0, y: 18, w: 17, h: 17},
    BarBack:    {x: 0, y: 36, w: 17, h: 6},
    BarLight:   {x: 1, y: 43, w: 15, h: 7},
    BarDark:    {x: 1, y: 51, w: 15, h: 7},
};
const SCROLL_BAR_WIDTH = sprites.ArrowLight.w;
const SCROLL_BAR_BUTTON_SIZE = sprites.ArrowLight.h;
const img = new Image;
img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAA6CAYAAABWBrIPAAAAAXNSR0IArs4c6QAAAeNJREFUWEfdlz1rwlAUhk8mJyF7wSlkdNLVgi7i0FHM3sm5oEuH0sVAZ6fugj/ATaGuZnIUyeAvEJwEJc2JveK9ud9mKB5wMNzz5LmvyUl0ACBJP3eVg5DRaGQNGQ6HoIRUKhXY7XbCkygh5XIZ+v0+jMdjOBwOXJAUUiqVoFqtQrPZhMViAev1Go7HYw4kheA2giC4Nk0mE+62pJBWqwW1Wu0KiaII5vO5vgnJgu3gZSM0qdfrWRZsYTar1Yo6zIWILEgna8OFiCwIhLXJQVQWPJscRGXBs6EguhasDQXRtWBtKMhgMDC+k8MwBOUNqEMlEJ210jXZPLmXohxKqhNoZbLdbsHzPPvJtt/vAecvns11XfPJhh3L5RJmsxl0Oh1oNBrmEGJBOkU20kyIBYGIbIQQ1kJmI4SwFjIbLkRkIbLhQkQWIpscRGXBs8lBVBY8Gwqia8HaUBBdC9aGguAX0yL3VWGjwFQgt764yfb6+WVt8/3+dnlnQ8iT51uBPoKX/wax2sdNE2Zyd2WQJK3z+WwMi+MYfN93MsjpdErwgGlhT7vdfkjIZrOxygQHWa/Xu2SS1rNpqDfrf4q7TtLXhwTVTAt/4m63e9lO+g/CKhOEpGP1ISHT6dQqk78HXjHXyS8Npq0izN8ppgAAAABJRU5ErkJggg==";
img.sprites = sprites;
const highlights = {  // values are bit positions
    none: 0,
    top: 1,
    left: 1,
    bottom: 2,
    right: 2,
    buttonMask: 3,
    bar: 4,
};
const dir = {
    upDown: 1,
    leftRight: 2,
};
function ScrollBar(ctx, mouse, wheelDirection = 1) {
    const can = ctx.canvas;
    var dragBar = false, dragDir = 0, dirty = true, id= mouse.getId(), dragOffset = 0;

    can._onMouseOut = () => {
        if (mouse.captured === id || mouse.captured === 0) {
            can.style.cursor = "default";
             API.highlight = highlights.none;
        }
    }
    can._onWheel = () => {
        var val = API.value;
        val += (mouse.wheel < 0 ? 1 : -1) * wheelDirection;
        API.value = val;
        mouse.wheel = 0;
        API.update();
    }
    can._onMouseOver = () => {
        if (mouse.captured === id || mouse.captured === 0) {
            mouse.wheel = 0;
            mouse.forElement(can);
            const w = can.width, h = can.height, bh = API.buttonSize, size = API.size;
            var cursorName = API.dir === dir.upDown ? "row-resize" : "col-resize";
            var pos = API.dir === dir.upDown ? mouse.fy : mouse.fx;
            if (pos < bh) {
                API.highlight = highlights.bottom;
                cursorName = "pointer";
            } else if (pos > size + SCROLL_BAR_BUTTON_SIZE) {
                API.highlight = highlights.top;
                cursorName = "pointer";
            } else if (pos > API.pos && pos < API.pos + API.barSize) {
                API.highlight = highlights.bar;
            } else {
                API.highlight = highlights.none;
            }
            can.style.cursor = cursorName;

        }
    }
    can._onMouseDown = () => {
        var repeat;
        if (mouse.captured === 0) {

            if (state.highlight & highlights.buttonMask) { repeat = 100 }
            if (mouse.requestCapture(id, mouseDrag, repeat)) {
                if (state.highlight === highlights.top) {
                    dragBar = true;
                    dragDir = 1;

                } else if (state.highlight === highlights.bottom) {
                    dragBar = true;
                    dragDir = -1;

                } else if (state.highlight === highlights.bar) {
                    dragBar = true;
                    dragDir = 0;
                    mouse.forElement(can);
                    dragOffset = API.pos - (API.dir === dir.upDown ? mouse.fy : mouse.fx);

                }
            }
            can.style.cursor = "pointer";
        }
    }
    can._onMouseUp = () => {

    }
    function mouseDrag(event) {
        if (event.type === "mouseup") {
            if (mouse.captured === id) {
                mouse.releaseCapture(id);
            }
        } else if (event.type === "repeat") {
            API.value += dragDir;
            API.update();
        } else if (event.type === "mousemove") {
            if (state.highlight === highlights.bar) {
                mouse.forElement(can);
                API.value = (((API.dir === dir.upDown ? mouse.fy : mouse.fx) + dragOffset) / API.size) * (state.max - state.min);
                API.update();
            }
        }
    }
    const state = {
        vets: {
            value() {
                state.value = state.value < 0 ? 0 : state.value + state.range > state.max ? state.max - state.range : state.value;
            },
            min() {
                state.min < 0 && (state.min = 0);
            },
            range() {
            },
            max() {
            },
        },
        value: 0,
        min: 0,
        max: 100,
        range: 50,
        highlight: highlights.none,
        set(name, val) {
            if (state[name] !== val) {
                const oldVal = state[name];
                state[name] = val;
                state.vets[name]?.();
                oldVal !== state[name] && (dirty = true);

            }
        }
    };


    const transforms = {
        upDown: {
            bot: [1,0,0,-1,0,1],
            top: [1,0,0,1,0,0],
        },
        leftRight: {
            bot: [0,1,-1,0,1,0],
            top: [0,1,1,0,0,0],
        },
    };
    const API = {

        highlights,

        get isDirty() { return dirty },
        get value() { return state.value },
        get min() { return state.min },
        get max() { return state.max },
        get range() { return state.range },
        set value(val) { state.set("value", val) },
        set min(val) { state.set("min", val) },
        set max(val) { state.set("max", val) },
        set range(val) { state.set("range", val) },
        set highlight(val) { state.set("highlight", val) },
        pos: 0,
        barSize: 0,
        buttonSize: SCROLL_BAR_BUTTON_SIZE,
        size: 0,
        update() {
            API.onInput && API.onInput();
        },
        draw(force) {
            if (!dirty && !force) { return }
            dirty = false;
            //const min = this.min, max = this.max, value = this.value, subRange = this.range;
            const {min, max, value, range, highlight} = state;
            const totalRange = max - min;
            const w = can.width, h = can.height;
            const down = highlight === highlights.top ? sprites.ArrowLight : sprites.ArrowDark;
            const up = highlight === highlights.bottom ? sprites.ArrowLight : sprites.ArrowDark;
            const bar = highlight === highlights.bar ? sprites.BarLight : sprites.BarDark;
            const back = sprites.BarBack;
            const bh = this.buttonSize = up.h;
            if (w < h) {
                API.dir = dir.upDown;
                this.size = h - bh * 2;
            } else {
                API.dir = dir.leftRight;
                this.size = w - bh * 2;
            }
            const {top, bot} = API.dir === dir.upDown ? transforms.upDown : transforms.leftRight;
            const size = this.size;
            const barSize = this.barSize = Math.round((range / totalRange) * size);
            const pos = this.pos = Math.round((value / totalRange) * size) + bh;
            ctx.setTransform(bot[0], bot[1], bot[2], bot[3], bot[4] * w, bot[5] * h);
            ctx.drawImage(img, down.x, down.y, down.w, down.h, 0, 0, down.w, down.h);
            ctx.setTransform(...top);
            ctx.drawImage(img, up.x,   up.y,       up.w, up.h,  0, 0,                 up.w,   up.h);

            ctx.drawImage(img, back.x, back.y,     back.w,  4,  0, bh,                back.w, 4);
            ctx.drawImage(img, back.x, back.y + 2, back.w,  2,  0, bh + 4,            back.w, size -8);
            ctx.drawImage(img, back.x, back.y + 2, back.w,  4,  0, bh + size - 4,        back.w, 4);

            ctx.drawImage(img, bar.x,  bar.y,      bar.w,   2,  1, pos,               bar.w,  2);
            ctx.drawImage(img, bar.x,  bar.y + 4,  bar.w,   2,  1, pos + barSize - 2, bar.w,  2);
            ctx.drawImage(img, bar.x,  bar.y + 2,  bar.w,   2,  1, pos + 2,           bar.w,  barSize - 4);
        }
    };
    return API;
};
export {ScrollBar, SCROLL_BAR_WIDTH};