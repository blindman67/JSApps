var Axes = {};
export {Axes};
import {Vector} from "../geometry/Vector.js";
import {Common} from "../core/Common.js";
(function() {
    Axes.fromVertices = function(vertices) {
        var axes = {};
        for (var i = 0; i < vertices.length; i++) {
            var j = (i + 1) % vertices.length;
            var normal = Vector.normalise({x: vertices[j].y - vertices[i].y, y: vertices[i].x - vertices[j].x });
            var gradient = (normal.y === 0) ? Infinity : (normal.x / normal.y);
            gradient = gradient.toFixed(3).toString();
            axes[gradient] = normal;
        }
        return Common.values(axes);
    };
    Axes.rotate = function(axes, angle) {
        var i;
        if (angle !== 0) { 
            const xAx = Math.cos(angle), xAy = Math.sin(angle);
            for (i = 0; i < axes.length; i++) {
                const axis = axes[i];
                const xx = axis.x * xAx - axis.y * xAy;
                axis.y   = axis.x * xAy + axis.y * xAx;
                axis.x   = xx;
            }
        }
    };
})();