/* Render */



function Render() {
    var stop = true, stopped = true;
    const renderStack = [];
    function loop(time) {

        if (stop) {
            stopped = true;
            API.onStopped && API.onStopped(API);
        } else {
            requestAnimationFrame(loop);
        }
    }

    const API = {
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
        set render(render) {
            renderStack.push(render);
        },
    };
    return API;
}
export {Render};