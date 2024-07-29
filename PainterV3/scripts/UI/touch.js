
const Touch = (() => {
    const mEventCommon = {
        altKey: false,
        shiftKey: false,
        ctrlKey: false,

        pageX: 0,
        pageY: 0,
        target: document,
        timeStamp: 0,
        force: 0.0,
    };
    const mEvents = {
        down: {
            which: 1,
            type: "mousedown",
            ...mEventCommon,
        },
        moveTo: {
            which: 0,
            type: "mousemove",
            ...mEventCommon,            
        },
        move: {
            which: 1,
            type: "mousemove",
            ...mEventCommon,
        },
        up: {
            which: 1,
            type: "mouseup",
            ...mEventCommon,
        },
        wheel: {
            which: 0,
            type: "wheel",
            ...mEventCommon,
        },
        
    };
    const debugStack = [];
    const debugInfo = [];
    function debugAdd(text, count = 160) {
        debugStack.push({text, count});
    }
    //debugAdd("Touch debug on!");
    var primaryTouch;
    const touching = new Array(20).fill(undefined);
    var touchingSize = 0;
    function updateChanges(tEvent, touches, id) {
        primaryTouch = undefined;

        var idx = 0;
        for (const touch of touches) {
            //debugAdd("T: " + touch.identifier + " idx: " + idx);
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
    function dispatchMouse(mouseEvent, tEvent, touch, timeOffset = 0) {
        if (touch) {
            mouseEvent.altKey = tEvent.altKey;
            mouseEvent.shiftKey = tEvent.shiftKey;
            mouseEvent.ctrlKey = tEvent.ctrlKey;
            mouseEvent.pageX = Math.round(touch.pageX);
            mouseEvent.pageY = Math.round(touch.pageY);
            mouseEvent.target = touch.target;
            mouseEvent.timeStamp = touch.timeStamp + timeOffset;
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
                if (updateChanges(e, e.touches, -1)) {
                    primaryTouch =  touching[0];
                    dispatchMouse(mEvents.moveTo, e, primaryTouch, -1);
                    mainCanvas.ctx.viewUpdate();
                    dispatchMouse(mEvents.down, e, primaryTouch);
                    //debugAdd("Down " + touchInfo(mEvents.down));
                } else {
                    //debugAdd("Start touch event missing primary");
                }
                
            },
            end(e) { 
                e.preventDefault();            
                if (updateChanges(e, e.changedTouches, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.up,  e,primaryTouch);
                    dispatchMouse(mEvents.moveTo, e, primaryTouch, 1);
                    primaryTouch = undefined;
                    //debugAdd("End " + touchInfo(mEvents.up));
                } else {
                    //debugAdd("End touch event missing primary");
                }
            },
            cancel(e) { 
                e.preventDefault();
                if (updateChanges(e, e.changedTouches, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.up, e, primaryTouch);
                    dispatchMouse(mEvents.moveTo, e, primaryTouch, 1);
                    primaryTouch = undefined;
                   // debugAdd("Cancel " + touchInfo(mEvents.up));
                } else {
                   // debugAdd("Cancel touch event missing primary");
                }
            },
            move(e) { 
                e.preventDefault();
                if (updateChanges(e, e.touches, primaryTouch.identifier)) {
                    dispatchMouse(mEvents.move, e, primaryTouch);
                    //debugAdd("Move " + touchInfo(mEvents.move), 5);
                } else {
                   // debugAdd("Move touch event missing primary");
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
    document.addEventListener("touchmove", Touch.listeners.move, {passive: false});    
    document.addEventListener("touchend", Touch.listeners.end);
    document.addEventListener("touchcancel", Touch.listeners.cancel);
    mainCanvas.ctx.setInfoCall(Touch.info);
    } catch(e) {
        Touch.debugAdd(e.message, 10000);
        
    }
    
}