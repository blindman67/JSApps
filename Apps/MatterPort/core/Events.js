
const Events = (() => {
    class Event {
        data;
        #listeners = [];
        #hasListeners = false;
        #firing = false;
        #dirty = false;
        #disabled = false;
        constructor(data) { this.data = data; }
        disable() { this.#disabled = true }
        enable() { this.#disabled = false }
        addListener(call) {
            this.#listeners.push(call);
            this.#hasListeners = true;
        }
        removeListener(call) {
            var h = 0, t = 0;
            const listeners = this.#listeners;
            if (this.#firing) {
                while (h < listeners.length) { listeners[h++] === call && (listeners[h - 1] = undefined, this.#dirty = true); }
            } else {
                while (h < listeners.length) { listeners[h++] !== call && (listeners[t++] = listeners[h - 1]); }
                listeners.length = t;
                this.#hasListeners = listeners.length > 0;
            }
        }
        #clean() {
            var h = 0, t = 0;
            const listeners = this.#listeners;
            while (h < listeners.length) {
                if (listeners[h] !== undefined) { listeners[t++] = listeners[h]; }
                h ++;
            }      
            this.#dirty = false; 
            listeners.length = t;
            this.#hasListeners = listeners.length > 0;            
        }
        fire(info) {
            if (this.#hasListeners && !this.disabled) {
                const listeners = this.#listeners;
                this.#firing = true;
                this.data.info = info;
                this.data.time = performance.now();
                for (let i = 0; i < listeners.length && !this.disabled; i++) { (this.data.listener = listeners[i++])?.(this.data) }
                this.#firing = false;
                this.data.info = undefined;
                this.#dirty && this.#clean();
            }
        }
    };
    class Events {
        #byType = new Map();
        target = undefined;
        register(type) {
            const data = {
                data: {}, 
                target: this.target, 
                type, 
                event: undefined,
                listener: undefined,
                time: 0,
            };
            const event = new Event(data);
            Object.defineProperty(data, "event",  {value: event});
            Object.defineProperty(this, "on" + type[0].toUpperCase() + type.slice(1), {value: event});
            this.#byType.set(type, event);
        }
        eventByType(type) { return this.#byType.get(type); }
        removeListener(type, call) { call && this.#byType.get(type).removeListener(call) }
        addListener(type, call) { call && this.#byType.get(type)?.addListener(call) }
        static for(object, types) {
            object.events = new Events();
            object.events.target = object;
            if (types) {
                for (const type of types.split(",")) { object.events.register(type.trim()); }
            }
            return object.events;
        }
    }

    return Events; 
})();
export {Events};
