const arrayUtils = {
    setOf(count, cb) {
        const array = [];
        var i = 0;
        while(i < count) { array.push(cb(i++)) }
        return array;
    },
    eachProp(object, cb) {
        var idx = 0;
        for (const [key, value] of Object.entries(object)) { cb(value, key, idx++) }
    },
    reduceProps(object, cb, initVal) {
        var idx = 0;
        for (const [key, value] of Object.entries(object)) { initVal = cb(initVal, value, key, idx++) }
        return initVal;
    }
};
export {arrayUtils};