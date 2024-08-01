
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
    function debugAdd(text, count = 1160) {
        debugStack.push({text, count});
    }
    //debugAdd("Touch debug on!");
    var primaryTouch;
    const touching = new Array(20).fill(undefined);
    var touchingSize = 0;
    function updateChanges_touch(tEvent, touches, id) {
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
    function updateChanges_pointer(pEvent, soak,  id) {


        if (pEvent.isPrimary) {
            if (pEvent.type === "pointerdown") {
                primaryTouch = pEvent;
            }
            touching[0] = pEvent;            
            touchingSize = 1;
        }
        return id === -1 || primaryTouch !== undefined;
    }
    
    function dispatchMouse_touch(mouseEvent, tEvent, touch, timeOffset = 0) {
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
    function dispatchMouse_pointer(mouseEvent, pEvent, soak, timeOffset = 0) {
        if (pEvent) {
            mouseEvent.altKey = pEvent.altKey;
            mouseEvent.shiftKey = pEvent.shiftKey;
            mouseEvent.ctrlKey = pEvent.ctrlKey;
            mouseEvent.pageX = Math.round(pEvent.pageX);
            mouseEvent.pageY = Math.round(pEvent.pageY);
            mouseEvent.target = pEvent.target;
            mouseEvent.timeStamp = pEvent.timeStamp + timeOffset;
            //mouseEvent.force = touch.force;

            mouseEvents(mouseEvent);
            //debugAdd("" + pEvent.type + " " + touchInfo_touch(mouseEvent));
        }
      
    }
    function touchInfo_touch(mouseEvent) {
        var str = "";
        str += "X: " + Math.round(mouseEvent.pageX) + " : ";
        str += "Y: " + Math.round(mouseEvent.pageY) + " ";
        str += "ID: " + mouseEvent.target.id + " ";
        str += "Type: " + mouseEvent.type;
        return str;
    }
    function showInfo(e) {
        debugAdd("" + e.target.id + " : " + e.type);
    }
    var dispatchMouse, updateChanges, touchInfo, pointerAPI = false;
    const API = {
        listeners: {
            start(e) { 
                //e.preventDefault();
                if (updateChanges(e, e?.touches, -1)) {
                    //showInfo(e);
                    if (pointerAPI) {
                        //document.body.setPointerCapture(primaryTouch.pointerId);
                    }
                    //dispatchMouse(mEvents.moveTo, e, primaryTouch, -1);
                    
                    dispatchMouse(mEvents.down, e, primaryTouch);
                }
                
            },
            end(e) { 
                //e.preventDefault();            
                if (primaryTouch) {

                    if (updateChanges(e, e?.changedTouches, primaryTouch.identifier ?? primaryTouch.pointerId)) {
                        //showInfo(e);
                        dispatchMouse(mEvents.up,  e, primaryTouch);
                        dispatchMouse(mEvents.moveTo, e, primaryTouch, 1);
                        if (pointerAPI) {
                            //document.body.releasePointerCapture(primaryTouch.pointerId);
                        }
                        primaryTouch = undefined;
                    }
                }
            },
            cancel(e) { 
                debugAdd( touchInfo_touch(e));
            /*
                e.preventDefault();
                if (updateChanges(e, e?.changedTouches, primaryTouch.identifier ?? primaryTouch.pointerId)) {
                    dispatchMouse(mEvents.up, e, primaryTouch);
                    dispatchMouse(mEvents.moveTo, e, primaryTouch, 1);
                    primaryTouch = undefined;
                }*/
            },
            move(e) { 
                e.preventDefault();
                if (!primaryTouch) {
                    if (updateChanges(e, e?.touches, -1)) {
                        dispatchMouse(mEvents.move, e, primaryTouch);
                    }
                    
                } else {
                    if (updateChanges(e, e?.touches, primaryTouch.identifier)) {
                        dispatchMouse(mEvents.move, e, primaryTouch);
                    }
                }
                
            },
            enter(e) { 
                //e.preventDefault();
                if (updateChanges(e, e?.touches, -1)) {
                    //showInfo(e);
                    dispatchMouse(mEvents.move, e, primaryTouch);
                    mainCanvas.ctx.viewUpdate();
                }
                
            },
            captured(e) {
                //debugAdd( touchInfo_touch(e));
                
            },
            debug(e) {
                
                //debugAdd( touchInfo_touch(e));
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
        setAPIType(isPointer) {
            pointerAPI = isPointer;
            if (isPointer) {

                dispatchMouse = dispatchMouse_pointer;
                updateChanges = updateChanges_pointer;
                touchInfo = touchInfo_touch;
            } else {
                dispatchMouse = dispatchMouse_touch;
                updateChanges = updateChanges_touch;
                touchInfo = touchInfo_touch;
            }
        },
        debugAdd,
    };

    
    return API;
})();
function startTouch() {
    Touch.setAPIType(settings.usePointer);
    if (settings.usePointer) {
        const opts = {passive: true};
        log.info("Starting touch via pointer.");
        document.addEventListener("pointerdown",         Touch.listeners.start, opts);
        document.addEventListener("pointermove",         Touch.listeners.move, {passive: false});
        document.addEventListener("pointerup",           Touch.listeners.end, opts );
        document.addEventListener("pointercancel",       Touch.listeners.cancel, opts );
        //document.addEventListener("pointerover",         Touch.listeners.debug );
        document.addEventListener("pointerenter",        Touch.listeners.enter, opts );
        //document.addEventListener("pointerrawupdate",    Touch.listeners.debug );
        //document.addEventListener("pointerout",          Touch.listeners.debug );
        //document.addEventListener("pointerleave",        Touch.listeners.debug );
        document.addEventListener("gotpointercapture",   Touch.listeners.captured, opts );
        document.addEventListener("lostpointercapture",  Touch.listeners.debug, opts );       
    } else {
        log.info("Starting touch.");
        document.addEventListener("touchstart", Touch.listeners.start, {passive: false});
        document.addEventListener("touchmove", Touch.listeners.move, {passive: false});    
        document.addEventListener("touchend", Touch.listeners.end);
        document.addEventListener("touchcancel", Touch.listeners.cancel);
    }
    mainCanvas.ctx.setInfoCall(Touch.info);
}


