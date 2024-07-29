
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
    }
    function dispatchMouse(mouseEvent, touch) {
        if (touch) {
            const mE = mEvents.down;
            mouseEvent.pageX = touch.pageX;
            mouseEvent.pageY = touch.pageY;
            mouseEvent.target = touchtarget;
            mouseEvent.timeStamp = touch.timeStamp;

            mouseEvents(mouseEvent);
        }
      
    }
    const API = {
        listeners: {
            start(e) { 
                updateChanges(e, -1);
                primaryTouch =  touching[0];
                dispatchMouse(mEvents.down, primaryTouch);

                
            },
            end(e) { 
                updateChanges(e, primaryTouch.identifier);
                dispatchMouse(mEvents.up, primaryTouch);
            },
            cancel(e) { 
                updateChanges(e, primaryTouch.identifier);
                dispatchMouse(mEvents.up, primaryTouch);
            },
            move(e) { 
                updateChanges(e, primaryTouch.identifier);
                dispatchMouse(mEvents.move, primaryTouch);
                
            },
            
        },
    };
    
    return API;
})();
function startTouch() {
    
    
    log.info("Starting touch.");
    

    document.addEventListener("touchstart", Touch.listeners.start);
    document.addEventListener("touchend", Touch.listeners.end);
    document.addEventListener("touchcancel", Touch.listeners.cancel);
    document.addEventListener("touchmove", Touch.listeners.move);    
    
}