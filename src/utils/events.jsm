
const events = (owner) => {
    const events = {};
    const names = new Set();
    const API = {    
        eventOwner(_owner) { if (_owner !== undefined) { owner = _owner } return owner },
        addEvent(name, handler) {
            if (names.has(name)) { events[name].push(handler) }
            else { 
                names.add(name);
                events[name] = [handler] ;
            }
        },
        removeEvent(name, handler) {
            if (names.has(name)) {
                const handlers = events[name];
                const idx = handlers.indexOf(handler);
                if (idx > -1) { handlers.splice(idx, 1)  }
                if (handlers.length === 0) { 
                    names.delete(name);
                    delete events[name] 
                }
            }                
        },
        fireEvent (type, data) {
            const cbs = events[type];
            if (cbs) { 
                for (const cb of cbs) { cb({type, data}) } 
            }    
        },  
    }
    return API;
}        
export {events};

