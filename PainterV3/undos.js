"use strict";
const undos = (() => {
    var undoId = 1;
    var undoIdMax = settings.undoLevels;
    var undoable = false
    var debounceHdl;
    const undoStack = [];
    const redoStack = [];
    /*editSprites.addEvent("undoable", undoableEvent);
    selection.addEvent("change", undoableEvent);
    sprites.addEvent("spriteadded", undoableEvent);
    sprites.addEvent("spriteremoved", undoableEvent);*/


    function undoableEvent() {
        clearTimeout(debounceHdl);
        debounceHdl = setTimeout(API.saveUndo, 500);
    }

    const API = {
        get isUndoable() { return undoable },
        set undoable(v) { undoable = true },
        get undoId() { return (undoId++) %  undoIdMax },
        saveUndo() {
            if (mouse.button) {
                undoableEvent();
            } else {
                const id = API.undoId
                spriteList.saveUndo(id);
                undoStack.push(id);
                if (undoStack.length >= undoIdMax) {
                    undoStack.shift();
                }
            }
        },
        loadUndo() {
            const undoId = undoStack.pop();
            redoStack.push(undoId);
            log("undos: " + undoStack.join(","));
            log("redos: " + redoStack.join(","));
        },
        loadRedo() {
            if (redoStack.length) {
                const redoId = redoStack.pop();
                undoStack.push(redoId);
                log("undos: " + undoStack.join(","));
                log("redos: " + redoStack.join(","));

            }
        }
    }
    return API;
})();