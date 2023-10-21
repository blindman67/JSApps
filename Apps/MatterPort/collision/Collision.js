

import {Vertices} from "../geometry/Vertices.js";
import {Vec2} from "../geometry/Vector.js";
import {Pair} from "./Pair.js";
const Collision = (() => {
    var workSupportsA = [];
    var workSupportsB = [];
    var workOverlapAB = {overlap: 0, axis: null};
    var workOverlapBA = {overlap: 0, axis: null};
    class Collision {
        pair;
        collided = false;
        bodyA;
        bodyB;
        parentA;
        parentB;
        depth = 0;
        normal;
        tangent;
        penetration;
        supports = [];
        constructor(bodyA, bodyB) {
            this.bodyA = bodyA;
            this.bodyB = bodyB;
            this.parentA = bodyA.parent;
            this.parentB = bodyB.parent;   
            this.normal = new Vec2();
            this.tangent = new Vec2();
            this.penetration = new Vec2();
                
        }
      
        
        /*static create(bodyA, bodyB) {

            return {
                pair: null,
                collided: false,
                bodyA: bodyA,
                bodyB: bodyB,
                parentA: bodyA.parent,
                parentB: bodyB.parent,
                depth: 0,
                normal: { x: 0, y: 0 },
                tangent: { x: 0, y: 0 },
                penetration: { x: 0, y: 0 },
                supports: []
            };
        }*/
        static collides(bodyA, bodyB, pairs) {
            Collision.overlapAxes(workOverlapAB, bodyA.vertices, bodyB.vertices, bodyA.axes);
            if (workOverlapAB.overlap <= 0) { return null; }
            Collision.overlapAxes(workOverlapBA, bodyB.vertices, bodyA.vertices, bodyB.axes);
            if (workOverlapBA.overlap <= 0) { return null; }
            var pair /*= pairs && pairs.table[Pair.id(bodyA, bodyB)],*/, co;
            if (!pair) {
                co = new Collision(bodyA, bodyB);
                co.collided = true;
                co.bodyA = bodyA.id < bodyB.id ? bodyA : bodyB;
                co.bodyB = bodyA.id < bodyB.id ? bodyB : bodyA;
                co.parentA = co.bodyA.parent;
                co.parentB = co.bodyB.parent;
            } else {
                co = pair.collision;
            }
            bodyA = co.bodyA;
            bodyB = co.bodyB;
            const vtA = bodyA.vertices;
            const minOverlap = workOverlapAB.overlap < workOverlapBA.overlap ? workOverlapAB : workOverlapBA;

            const normal = co.normal;
            const supports = co.supports;
            const minAxis = minOverlap.axis;
            const minAxisX = minAxis.x;
            const minAxisY = minAxis.y;
            if (minAxisX * (bodyB.pos.x - bodyA.pos.x) + minAxisY * (bodyB.pos.y - bodyA.pos.y) < 0) {
                normal.x = minAxisX;
                normal.y = minAxisY;
            } else {
                normal.x = -minAxisX;
                normal.y = -minAxisY;
            }
            co.tangent.x = -normal.y;
            co.tangent.y = normal.x;
            co.depth = minOverlap.overlap;
            co.penetration.x = normal.x * co.depth;
            co.penetration.y = normal.y * co.depth;
            var supportsB = Collision.findSupports(bodyA, bodyB, normal, 1, workSupportsB), sIdx = 0;
            if (vtA.contains(supportsB[0])) { supports[sIdx++] = supportsB[0] }
            if (vtA.contains(supportsB[1])) { supports[sIdx++] = supportsB[1] }
            if (sIdx < 2) {
                const vtB = bodyB.vertices;
                var supportsA = Collision.findSupports(bodyB, bodyA, normal, -1, workSupportsA);
                if (vtB.contains(supportsA[0])) { supports[sIdx++] = supportsA[0]; }
                if (sIdx < 2 && vtB.contains(supportsA[1])) { supports[sIdx++] = supportsA[1]; }
                if (sIdx === 0) { supports[sIdx++] = supportsA[0]; }
            }
            
            supports.length = sIdx;
            return co;

        }
        static overlapAxes(result, verticesA, verticesB, axes) {
            const verticesALength = verticesA.length;
            const verticesBLength = verticesB.length;
            const verticesAX = verticesA[0].x;
            const verticesAY = verticesA[0].y;
            const verticesBX = verticesB[0].x;
            const verticesBY = verticesB[0].y;
            const axesLength = axes.length;
            var minA, minB, maxA, maxB;
            var overlapMin = Number.MAX_VALUE, overlapAxisNumber = 0, overlap, overlapAB, overlapBA, dot, i, j;
            for (i = 0; i < axesLength; i++) {
                const axis = axes[i];
                const axisX = axis.x;
                const axisY = axis.y;
                minA = verticesAX * axisX + verticesAY * axisY;
                minB = verticesBX * axisX + verticesBY * axisY;
                maxA = minA;
                maxB = minB;
                for (j = 1; j < verticesALength; j += 1) {
                    dot = verticesA[j].x * axisX + verticesA[j].y * axisY;
                    if (dot > maxA) {  maxA = dot }
                    else if (dot < minA) {  minA = dot }
                    
                }
                for (j = 1; j < verticesBLength; j += 1) {
                    dot = verticesB[j].x * axisX + verticesB[j].y * axisY;
                    if (dot > maxB) { maxB = dot; }
                    else if (dot < minB) { minB = dot; }
                }
                overlapAB = maxA - minB;
                overlapBA = maxB - minA;
                overlap = overlapAB < overlapBA ? overlapAB : overlapBA;
                if (overlap < overlapMin) {
                    overlapMin = overlap;
                    overlapAxisNumber = i;
                    if (overlap <= 0) {  break;  }
                }
            }
            result.axis = axes[overlapAxisNumber];
            result.overlap = overlapMin;
        }
        static projectToAxis(projection, vertices, axis) {
            var min = vertices[0].x * axis.x + vertices[0].y * axis.y, max = min;
            for (var i = 1; i < vertices.length; i += 1) {
                var dot = vertices[i].x * axis.x + vertices[i].y * axis.y;
                if (dot > max) { max = dot }
                else if (dot < min) { min = dot }
            }
            projection.min = min;
            projection.max = max;
        }
        static findSupports(bodyA, bodyB, normal, direction, supports) {
            const vertices = bodyB.vertices;
            const verticesLength = vertices.length;
            const bodyAPosX = bodyA.pos.x;
            const bodyAPosY = bodyA.pos.y;
            const normalX = normal.x * direction;
            const normalY = normal.y * direction;
                
            var nearestDistance = Number.MAX_VALUE;
            var vertexA, vertexB, vertexC, distance, j;
            for (j = 0; j < verticesLength; j += 1) {
                vertexB = vertices[j];
                distance = normalX * (bodyAPosX - vertexB.x) + normalY * (bodyAPosY - vertexB.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    vertexA = vertexB;
                }
            }
            vertexC = vertices[(verticesLength + vertexA.idx - 1) % verticesLength];
            const distanceC = normalX * (bodyAPosX - vertexC.x) + normalY * (bodyAPosY - vertexC.y);
            vertexB = vertices[(vertexA.idx + 1) % verticesLength];
            const distanceB = normalX * (bodyAPosX - vertexB.x) + normalY * (bodyAPosY - vertexB.y)
            if (distanceB < distanceC) {
                supports[0] = vertexA;
                supports[1] = vertexB;
                return supports;
            }
            supports[0] = vertexA;
            supports[1] = vertexC;
            return supports;
        }
    };
    return Collision;
})();
export {Collision};