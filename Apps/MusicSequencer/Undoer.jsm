function Undoer(maxUndos = 100) {
    const undos = [];
    var top = 0, current = 0;
    const API = {
        get canUndo() { return top > 0 },
        get canRedo() { return top < undos.length - 1},
        addState(state) {
            if (top >= maxUndos) { undos.shift() }
            if (top < undos.length) { undos.length = top }
            undos.push(state);
            top = undos.length;
            current = top;
        },
        undo() {
            if (top === current && top) { top -- }
            if (top) {
                top --;
                if (top < undos.length) { return undos[top] }
            }
        },
        redo() {
            if (top < undos.length - 1) {
                top++;
                return undos[top];
            }
        },
        reset(keep = 0) {
            while (undos.length > keep) {
                undos.splice(0, undos.length - keep);
            }
            top = keep;
            current = top;
        }
    };
    return API;
}

export {Undoer};

