var Detector = {};
export {Detector};
import {Common} from "../core/Common.js";
import {Collision} from "./Collision.js";
(function() {
    Detector.create = function(options) {
        return { bodies: [], pairs: null, ...options };
    };
    Detector.setBodies = function(detector, bodies) {
        detector.bodies = bodies.slice(0);
    };
    Detector.clear = function(detector) {
        detector.bodies.length = 0;
    };
    Detector.collisions = function(detector) {
        const collisions = [];
        const pairs = detector.pairs;
        const bodies = detector.bodies;
        const bodiesLength = bodies.length;
        const canCollide = Detector.canCollide;
        const collides = Collision.collides;
        var i, j;
        bodies.sort(Detector._compareBoundsX);
        for (i = 0; i < bodiesLength; i++) {
            const bodyA = bodies[i];
            const boundsA = bodyA.bounds;
            const boundXMax = bodyA.bounds.max.x;
            const boundYMax = bodyA.bounds.max.y;
            const boundYMin = bodyA.bounds.min.y;
            const bodyAStatic = bodyA.isStatic || bodyA.isSleeping;
            const partsALength = bodyA.parts.length;
            const partsASingle = partsALength === 1;
            for (j = i + 1; j < bodiesLength; j++) {
                const bodyB = bodies[j];
                var boundsB = bodyB.bounds;
                if (boundsB.min.x > boundXMax) { break; }
                if (boundYMax < boundsB.min.y || boundYMin > boundsB.max.y) { continue; }
                if (bodyAStatic && (bodyB.isStatic || bodyB.isSleeping)) { continue; }
                if (!canCollide(bodyA.collisionFilter, bodyB.collisionFilter)) { continue; }

                const partsBLength = bodyB.parts.length;
                if (partsASingle && partsBLength === 1) {
                    const collision = collides(bodyA, bodyB, pairs);
                    if (collision) { collisions.push(collision); }
                } else {
                    const partsAStart = partsALength > 1 ? 1 : 0;
                    const partsBStart = partsBLength > 1 ? 1 : 0;
                    for (var k = partsAStart; k < partsALength; k++) {
                        const partA = bodyA.parts[k];
                        const boundsA = partA.bounds;
                        for (var z = partsBStart; z < partsBLength; z++) {
                            const partB = bodyB.parts[z];
                            const boundsB = partB.bounds;
                            if (boundsA.min.x > boundsB.max.x || boundsA.max.x < boundsB.min.x || boundsA.max.y < boundsB.min.y || boundsA.min.y > boundsB.max.y) { continue; }
                            const collision = collides(partA, partB, pairs);
                            if (collision) {
                                collisions.push(collision);
                            }
                        }
                    }
                }
            }
        }
        return collisions;
    };
    Detector.canCollide = function(filterA, filterB) {
        if (filterA.group === filterB.group && filterA.group !== 0) {
            return filterA.group > 0;
        }
        return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    };
    Detector._compareBoundsX = function(bodyA, bodyB) {
        return bodyA.bounds.min.x - bodyB.bounds.min.x;
    };
})();