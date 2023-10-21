/* Render */

const TextRender = {
    font(ctx, font = "24px Arial", align = "center", base = "middle") {
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = base;
        return ctx;
    },
    outlineText(ctx, text, x, y, outCol, inCol) {
        ctx.fillStyle = outCol;
        ctx.fillText(text, x, y - 1);
        ctx.fillText(text, x, y + 1);
        ctx.fillText(text, x + 1, y);
        ctx.fillText(text, x - 1, y);
        ctx.fillStyle = inCol;
        ctx.fillText(text, x, y);
        return ctx;
    },
}


function Render() {
    var stop = true, stopped = true;
	const beforeRender = [];
    const renderStack = [];
    const tempStack = [];
    function loop(time) {
        var tail, head;
		for (const br of beforeRender) { br(time) }
		beforeRender.length && (beforeRender.length = 0);
        if (stop) {
            stopped = true;
            API.onStopped && API.onStopped(API);
            return;
        } else {
            API.frame += 1;
            requestAnimationFrame(loop);
        }
        for (const t of renderStack) { t(time) }
        tail = 0, head = 0;
        while (head < tempStack.length) {
            if (!tempStack[head](time)) {
                head ++
            } else {
                tail !== head && (tempStack[tail] = tempStack[head]);
                head ++;
                tail ++;
            }
        }
        tempStack.length = tail;

    }

    const API = {
        frame: 0,
        start() {
            if (!stopped) {
                stop = false;
            } else {
                stop = false;
                stopped = false;

                requestAnimationFrame(loop);
            }
        },
        stop() {
            stop = true;
        },
        reset() {
            stop = true;
            const os = API.onStopped;
            API.onStopped = () => {
                renderStack.length = 0;
                API.onStopped = os;
                API.onStopped(API);
            }
        },
		set onceBefore(task) { beforeRender.push(task) },
        set once(render) { tempStack.push(render) },
        set task(render) {
            renderStack.push(render);
        },
    };
    return API;
}
export {Render, TextRender};