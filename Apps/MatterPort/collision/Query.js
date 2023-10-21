var Query = {};
export {Query};
import {Vector} from "../geometry/Vector.js";
import {Collision} from "./Collision.js";
import {Bounds} from "../geometry/Bounds.js";
import {Bodies} from "../factory/Bodies.js";
import {Vertices} from "../geometry/Vertices.js";
(function() {
    Query.collides = function(body, bodies) {
        var collisions = [],
            bodiesLength = bodies.length,
            bounds = body.bounds,
            collides = Collision.collides,
            overlaps = Bounds.overlaps;
        for (var i = 0; i < bodiesLength; i++) {
            var bodyA = bodies[i],
                partsALength = bodyA.parts.length,
                partsAStart = partsALength === 1 ? 0 : 1;
            if (overlaps(bodyA.bounds, bounds)) {
                for (var j = partsAStart; j < partsALength; j++) {
                    var part = bodyA.parts[j];
                    if (overlaps(part.bounds, bounds)) {
                        var collision = collides(part, body);
                        if (collision) {
                            collisions.push(collision);
                            break;
                        }
                    }
                }
            }
        }
        return collisions;
    };
    Query.ray = function(bodies, startPoint, endPoint, rayWidth) {
        rayWidth = rayWidth || 1e-100;
        var rayAngle = Vector.angle(startPoint, endPoint),
            rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)),
            rayX = (endPoint.x + startPoint.x) * 0.5,
            rayY = (endPoint.y + startPoint.y) * 0.5,
            ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }),
            collisions = Query.collides(ray, bodies);
        for (var i = 0; i < collisions.length; i += 1) {
            var collision = collisions[i];
            collision.body = collision.bodyB = collision.bodyA;
        }
        return collisions;
    };
    Query.region = function(bodies, bounds, outside) {
        var result = [];
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                overlaps = Bounds.overlaps(body.bounds, bounds);
            if ((overlaps && !outside) || (!overlaps && outside))
                result.push(body);
        }
        return result;
    };
    Query.point = function(bodies, point) {
        var result = [];
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if (Bounds.contains(body.bounds, point)) {
                for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                    var part = body.parts[j];
                    if (Bounds.contains(part.bounds, point)
                        && Vertices.contains(part.vertices, point)) {
                        result.push(body);
                        break;
                    }
                }
            }
        }
        return result;
    };
})();