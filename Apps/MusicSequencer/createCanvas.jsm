import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
function createCanvas(width = 100, height = 150, className = "", noClass = false, opts = {}) {
    const can = noClass ?
        $("canvas", {width, height}) :
        $("canvas", {className: "UICanvas " + className, width, height});
    can.ctx = can.getContext("2d", opts);
    return can;
}

export {createCanvas};