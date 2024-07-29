
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
    function debugAdd(text, count = 70) {
        debugStack.push({text, count});
    }
    debugAdd("Touch debug on!", 1000);
    var primaryTouch;
    const touching = new Array(20).fill(undefined);
    var touchingSize = 0;
    function updateChanges(e, id) {
        primaryTouch = undefined;
        e.preventDefault();
        const idx = 0;
        for (const touch of e.changedTouches) {
            if (touch.identifier === id) {
                primaryTouch = touch;
            }
            touching[idx++] = touch;            
        }
        touchingSize = idx;
        return primaryTouch !== undefined;
    }
    function dispatchMouse(mouseEvent, touch) {
        if (touch) {

            mouseEvent.pageX = touch.pageX;
            mouseEvent.pageY = touch.pageY;
            mouseEvent.target = touchtarget;
            mouseEvent.timeStamp = touch.timeStamp;

            mouseEvents(mouseEvent);
        }
      
    }
    function touchInfo(mouseEvent) {
        var str = "";
        str += "X: " + mouseEvent.pageX + " : ";
        str += "Y: " + mouseEvent.pageY + " ";
        str += "Target.id: " + mouseEvent.target.id + " ";
        str += "Type: " + mouseEvent.type;
        return string;
    }
    const API = {
        listeners: {
            start(e) { 
                updateChanges(e, -1);
                primaryTouch =  touching[0];
                dispatchMouse(mEvents.down, primaryTouch);
                debugAdd("Down " + touchInfo(mEvents.down));
                
            },
            end(e) { 
                if (updateChanges(e, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.up, primaryTouch);
                    debugAdd("End " + touchInfo(mEvents.up));
                } else {
                    debugAdd("End touch event missing primary", 2000);
                }
            },
            cancel(e) { 
                if (updateChanges(e, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.up, primaryTouch);
                    debugAdd("Cancel " + touchInfo(mEvents.up));
                } else {
                    debugAdd("Cancel touch event missing primary", 2000);
                }
            },
            move(e) { 
                if (updateChanges(e, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.move, primaryTouch);
                    debugAdd("Move " + touchInfo(mEvents.move), 2);
                } else {
                    debugAdd("Move touch event missing primary", 2000);
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
        }
    };
    
    return API;
})();
function startTouch() {
    
    
    log.info("Starting touch.");
    

    document.addEventListener("touchstart", Touch.listeners.start);
    document.addEventListener("touchend", Touch.listeners.end);
    document.addEventListener("touchcancel", Touch.listeners.cancel);
    document.addEventListener("touchmove", Touch.listeners.move);    
    mainCanvas.ctx.setInfoCall(Touch.info);
    
}