import {Plugin} from "./Plugin.js";
import {Common} from "./Common.js";
const Matter = (() => {
    class Matter {
        name = 'matter-js';
        version = typeof __MATTER_VERSION__ !== 'undefined' ? __MATTER_VERSION__ : '*';
        uses = [];
        used = [];
        use() {
            Plugin.use(Matter, Array.prototype.slice.call(arguments));
        }
        before(path, func) {
            path = path.replace(/^Matter./, '');
            return Common.chainPathBefore(Matter, path, func);
        }
        after(path, func) {
            path = path.replace(/^Matter./, '');
            return Common.chainPathAfter(Matter, path, func);
        }
    };
    return new Matter();
})();
export {Matter};