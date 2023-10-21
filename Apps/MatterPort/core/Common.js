const Common = (() => {
    var seed = 0;
    function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    var nowStartTime = +(new Date());
    const warnedOnce = new Set();
    var nextId = 0;
    class Common {
        #decomp = null;
        logLevel = 1;
        curves = {
            sCurve(v, p = 2) { return  (2 / (1 + (p ** -v))) -1; },
            eCurve(v, p = 2, vp) { return v < 0 ? 0 : v > 1 ? 1 : (vp = v ** p) / (vp + (1 - v) ** p); },     
            eOut(v, p = 2) { return v < 0 ? 0 : v > 1 ? 1 : v ** p },
            eIn(v, p = 2) { return v < 0 ? 0 : v > 1 ? 1 : v ** (1/p) },
        };        
        extend(obj, deep) {

            var argsStart, args, deepClone;
            if (deep instanceof Boolean) {
                argsStart = 2;
                deepClone = deep;
            } else {
                argsStart = 1;
                deepClone = true;
            }
            for (var i = argsStart; i < arguments.length; i++) {
                var source = arguments[i];
                if (source) {
                    for (var prop in source) {
                        if (deepClone && source[prop] && source[prop].constructor === Object) {
                            if (!obj[prop] || obj[prop].constructor === Object) {
                                obj[prop] = obj[prop] || {};
                                this.extend(obj[prop], deepClone, source[prop]);
                            } else {
                                obj[prop] = source[prop];
                            }
                        } else {
                            obj[prop] = source[prop];
                        }
                    }
                }
            }
            return obj;
        }
        clone(obj, deep) {
            return this.extend({}, deep, obj);
        }
        keys(obj) { return Object.keys(obj); }
        values(obj) { return Object.values(obj); } 
        get(obj, path, begin, end) {
            path = path.split('.').slice(begin, end);
            for (var i = 0; i < path.length; i += 1) {
                obj = obj[path[i]];
            }
            return obj;
        }
        set(obj, path, val, begin, end) {
            var parts = path.split('.').slice(begin, end);
            this.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
            return val;
        }
        shuffle(array) {
            var i;
            for (i = array.length - 1; i > 0; i--) {
                const j = this.random() * (i + 1) | 0;
                temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }

        choose(choices) { return choices[this.random() * choices.length | 0] }
        isElement(obj) { return obj instanceof HTMLElement }
        isArray(obj) { return Array.isArray(obj) }
        isFunction(obj) { return obj instanceof Function }
        isPlainObject(obj) { return typeof obj === 'object' && obj.constructor === Object }
        isString(obj) {
            return toString.call(obj) === '[object String]';
        }
        clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
        sign(value) { return value < 0 ? -1 : 1; }
        now() {
            if (performance) { return performance.now(); }
            if (Date.now) { return Date.now(); }
            return (new Date()) - nowStartTime;
        }
        random(min = 0, max = 1) { return min + seededRandom() * (max - min); }
        colorToNumber(color) {
            if (color[0] === "#") {
                if (color.length === 4) {
                    return parseInt(color[1] + color[1] + color[2] + color[2] + color[3] + color[3], 16);
                }
                return parseInt(color.slice(1), 16);
            } 
            if (color.length === 3) {
                return parseInt(color[0] + color[0] + color[1] + color[1] + color[2] + color[2], 16);
            }
            return parseInt(color, 16);
        }
       
        log() {
            if (console && this.logLevel > 0 && this.logLevel <= 3) {
                console.log.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
            }
        }
        info() {
            if (console && this.logLevel > 0 && this.logLevel <= 2) {
                console.info.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
            }
        }
        warn() {
            if (console && this.logLevel > 0 && this.logLevel <= 3) {
                console.warn.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
            }
        }
        warnOnce(...args) {
            const message = args.join(' ');
            !warnedOnce.has(message) && (this.warn(message), warnedOnce.add(message));
        }
        nextId() { return nextId++; }
        indexOf(haystack, needle) {
            if (haystack.indexOf) { return haystack.indexOf(needle); }
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] === needle) { return i; }
            }
            return -1;
        }
        map(list, func) { return list.map(func); }
        topologicalSort(graph) {
            const result = [];
            const visited = [];
            const temp = [];
            // for (var node in graph) {
            for (const node of Object.keys(graph)) {
                if (!visited[node] && !temp[node]) {
                    this.#topologicalSort(node, visited, temp, graph, result);
                }
            }
            return result;
        }
        #topologicalSort(node, visited, temp, graph, result) {
            var neighbors = graph[node] || [];
            temp[node] = true;
            for (var i = 0; i < neighbors.length; i += 1) {
                var neighbor = neighbors[i];
                if (temp[neighbor]) {
                    continue;
                }
                if (!visited[neighbor]) {
                    this.#topologicalSort(neighbor, visited, temp, graph, result);
                }
            }
            temp[node] = false;
            visited[node] = true;
            result.push(node);
        }
        chain() {  /** WTF */
            var funcs = [];
            for (const func of arguments) {
                if (func._chained) {
                    funcs.push.apply(funcs, func._chained);
                } else {
                    funcs.push(func);
                }
            }
           function chain() {
                var lastResult, args = new Array(arguments.length);
                for (var i = 0, l = arguments.length; i < l; i++) {
                    args[i] = arguments[i];
                }
                for (i = 0; i < funcs.length; i += 1) {
                    var result = funcs[i].apply(lastResult, args);
                    if (typeof result !== 'undefined') {
                        lastResult = result;
                    }
                }
                return lastResult;
            };
            chain._chained = funcs;
            return chain;
        }
        chainPathBefore(base, path, func) { return this.set(base, path, this.chain( func, this.get(base, path))) }
        chainPathAfter(base, path, func) { return this.set(base, path, this.chain(this.get(base, path), func)) }
        setDecomp(decomp) { this.#decomp = decomp; }
        getDecomp() {
            var decomp = this.#decomp;
            try {
                if (!decomp && typeof window !== 'undefined') {
                    decomp = window.decomp;
                }
                if (!decomp && typeof global !== 'undefined') {
                    decomp = global.decomp;
                }
            } catch (e) {
                decomp = null;
            }
            return decomp;
        }
    };
    return new Common();
})();
export {Common};
