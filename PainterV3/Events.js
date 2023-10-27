"use strict";
const Events = (owner) => {
    const events = {};
    const names = new Set();

    const API = {
        eventOwner(_owner) { if (_owner !== undefined) { owner = _owner } return owner },
        addEvent(name, handler, UID = ++AID) {
            name = name.toLowerCase();
            if (names.has(name)) { events[name].push({UID, handler}) }
            else {
                names.add(name);
                events[name] = [{UID, handler}];
                events[name].name = name;
            }
            return UID;
        },
        removeEvent(name, handler) {
            name = name.toLowerCase()
            if (names.has(name)) {
                const handlers = events[name];
                const idx = handlers.findIndex(h => h.handler === handler);
                if (idx > -1) { handlers.splice(idx, 1)  }
                if (handlers.length === 0) {
                    names.delete(name);
                    delete events[name]
                }
                return true;
            }
            return true;
        },
        removeAllEventsByUID(UID) {
            var i;
            for(const key of Object.keys(events)) {
                for (i = 0; i < events[key].length; i++) {
                    if (events[key][i].UID === UID) {
                        events[key].splice(i--, 1);
                    }
                }
            }
            for(const name of Object.keys(events)) {
                if (events[name].length === 0) {
                    delete events[name];
                    names.delete(name);
                }
            }
        },
        fireEvent (name, data) {
            if (events[name]) { for (const event of events[name]) { event.handler(owner, name, data, event.UID) } }
        },
        fireEventFast(eventList, data) {
            for (const event of eventList) { event.handler(owner, eventList.name, data, event.UID) }
        },
        getEventCallbacks() { return events },
        hasEvent(name) { return events[name] !== undefined },

    }
    return API;
}

