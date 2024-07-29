
const Touch = (() => {
    const mEventCommon = {
        altKey: false,
        shiftKey: false,
        ctrlKey: false,
        which: 1,
        pageX: 0,
        pageY: 0,
        target: document,
        timeStamp: 0,
        force: 0.0,
    };
    const mEvents = {
        down: {
            
            type: "mousedown",
            ...mEventCommon,
        },
        move: {
            type: "mousemove",
            ...mEventCommon,
        },
        up: {
            type: "mouseup",
            ...mEventCommon,
        },
        wheel: {
            type: "wheel",
            ...mEventCommon,
        },
        
    };
    const debugStack = [];
    const debugInfo = [];
    function debugAdd(text, count = 10) {
        debugStack.push({text, count});
    }
    debugAdd("Touch debug on!", 10);
    var primaryTouch;
    const touching = new Array(20).fill(undefined);
    var touchingSize = 0;
    function updateChanges(tEvent, id) {
        primaryTouch = undefined;

        var idx = 0;
        for (const touch of tEvent.touches) {
            debugAdd("T: " + touch.identifier + " idx: " + idx, 60);
            if (touch.identifier === id || (id === -1 && !primaryTouch)) {
                primaryTouch = touch;
            }
            touching[idx++] = touch;            
        }
        touchingSize = idx;
        if (idx === 2) {
            //debugAdd("Double touce!", 1000);
        }
        return primaryTouch !== undefined;
    }
    function dispatchMouse(mouseEvent, tEvent, touch) {
        if (touch) {
            mouseEvent.altKey = tEvent.altKey;
            mouseEvent.shiftKey = tEvent.shiftKey;
            mouseEvent.ctrlKey = tEvent.ctrlKey;
            mouseEvent.pageX = Math.round(touch.pageX);
            mouseEvent.pageY = Math.round(touch.pageY);
            mouseEvent.target = touch.target;
            mouseEvent.timeStamp = touch.timeStamp;
            mouseEvent.force = touch.force;

            mouseEvents(mouseEvent);
        }
      
    }
    function touchInfo(mouseEvent) {
        var str = "";
        str += "X: " + mouseEvent.pageX + " : ";
        str += "Y: " + mouseEvent.pageY + " ";
        str += "ID: " + mouseEvent.target.id + " ";
        str += "Type: " + mouseEvent.type;
        return str;
    }
    const API = {
        listeners: {
            start(e) { 
                e.preventDefault();
                if (updateChanges(e, -1)) {
                    primaryTouch =  touching[0];
                    dispatchMouse(mEvents.down, e, primaryTouch);
                    debugAdd("Down " + touchInfo(mEvents.down));
                } else {
                    debugAdd("Start touch event missing primary");
                }
                
            },
            end(e) { 
                e.preventDefault();            
                if (updateChanges(e, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.up, primaryTouch);
                    primaryTouch = undefined;
                    debugAdd("End " + touchInfo(mEvents.up));
                } else {
                    debugAdd("End touch event missing primary");
                }
            },
            cancel(e) { 
                e.preventDefault();
                if (updateChanges(e, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.up, primaryTouch);
                    primaryTouch = undefined;
                    debugAdd("Cancel " + touchInfo(mEvents.up));
                } else {
                    debugAdd("Cancel touch event missing primary");
                }
            },
            move(e) { 
                e.preventDefault();
                if (updateChanges(e, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.move, primaryTouch);
                    debugAdd("Move " + touchInfo(mEvents.move), 2);
                } else {
                    debugAdd("Move touch event missing primary");
                }
                
            },
            
        },
        info() {
            var h = 0, t = 0;
            while (h < debugStack.length) {
                const dText = debugStack[h];
                dText.count--;
                if (dText.count) {
                    debugStack[t] = dText;
                    debugInfo[t] = dText.text;
                    t++;
                }
                h++;
            }
            debugStack.length = t;
            debugInfo.length = t;
            return debugInfo;
        },
        debugAdd,
    };

    
    return API;
})();
function startTouch() {
    
    try {
    log.info("Starting touch.");
    

    document.addEventListener("touchstart", Touch.listeners.start, {passive: false});
    document.addEventListener("touchend", Touch.listeners.end, {passive: false});
    document.addEventListener("touchcancel", Touch.listeners.cancel);
    document.addEventListener("touchmove", Touch.listeners.move);    
    mainCanvas.ctx.setInfoCall(Touch.info);
    } catch(e) {
        Touch.debugAdd(e.message, 10000);
        
    }
    
}