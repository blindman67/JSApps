import {Events} from "../core/Events.js";
const Selection = (()=> {
    const eventInfo = { obj: undefined };
    class Selection {
        selected = [];
        hash = new WeakSet();
        events;
        constructor() {
            Events.for(this, "selected,unselected");
        }
        #unselectEvent(sel) {
            eventInfo.obj = sel;
            this.events.onUnselected.fire(eventInfo);
            eventInfo.obj = undefined;
        }
        #selectEvent(sel) {
            eventInfo.obj = sel;
            this.events.onSelected.fire(eventInfo);
            eventInfo.obj = undefined;
        }
        clear() { 
            var i = 0;
            while (i < this.selected.length) {
                this.#unselectEvent(this.selected[i]);
                this.selected[i].selected = false;
                this.hash.delete(this.selected[i++]);
            }
            this.selected.length = 0;
        }
        has(body) { return this.hash.has(body) }
        remove(body) {
            if (!this.hash.has(body)) {
                let i = 0;
                while (i < this.selected.length) {
                    if (this.selected[i] === body) {
                        this.#unselectEvent(this.selected[i]);
                        this.selected.slice(i, 1);
                        this.hash.delete(body);
                        break;
                    }
                    i++;
                }
                body.selected = false;
            }            
        }
        add(body) {
            if (!this.hash.has(body)) {
                this.#selectEvent(body);
                this.selected.push(body);
                this.hash.add(body);
                body.selected = true;
            }
        }
        each(cb) {
            var i;
            for (i = 0; i < this.selected.length; i++) { cb(this.selected[i], i); }
        }
    }
    return Selection;
})();
export {Selection};