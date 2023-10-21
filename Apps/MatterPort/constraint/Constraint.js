var Constraint = {};
export {Constraint};
import {Vertices} from "../geometry/Vertices.js";
import {Vector} from "../geometry/Vector.js";
import {Sleeping} from "../core/Sleeping.js";
import {Bounds} from "../geometry/Bounds.js";
import {Axes} from "../geometry/Axes.js";
import {Common} from "../core/Common.js";
(function() {
    Constraint._warming = 0.4;
    Constraint._torqueDampen = 1;
    Constraint._minLength = 0.000001;
    Constraint.create = function(options) {
        var constraint = options;
        if (constraint.bodyA && !constraint.pointA)
            constraint.pointA = { x: 0, y: 0 };
        if (constraint.bodyB && !constraint.pointB)
            constraint.pointB = { x: 0, y: 0 };
        var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.pos, constraint.pointA) : constraint.pointA,
            initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.pos, constraint.pointB) : constraint.pointB,
            length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
        constraint.length = typeof constraint.length !== 'undefined' ? constraint.length : length;
        constraint.id = constraint.id || Common.nextId();
        constraint.label = constraint.label || 'Constraint';
        constraint.type = 'constraint';
        constraint.stiffness = constraint.stiffness || (constraint.length > 0 ? 1 : 0.7);
        constraint.damping = constraint.damping || 0;
        constraint.angularStiffness = constraint.angularStiffness || 0;
        constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
        constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;
        constraint.plugin = {};
        var render = {
            visible: true,
            lineWidth: 2,
            strokeStyle: '#ffffff',
            type: 'line',
            anchors: true
        };
        if (constraint.length === 0 && constraint.stiffness > 0.1) {
            render.type = 'pin';
            render.anchors = false;
        } else if (constraint.stiffness < 0.9) {
            render.type = 'spring';
        }
        constraint.render = Common.extend(render, constraint.render);
        return constraint;
    };
    Constraint.preSolveAll = function(bodies) {
        for (var i = 0; i < bodies.length; i += 1) {
            var body = bodies[i],
                impulse = body.constraintImpulse;
            if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
                continue;
            }
            body.pos.x += impulse.x;
            body.pos.y += impulse.y;
            body.angle += impulse.angle;
        }
    };
    Constraint.solveAll = function(constraints, timeScale) {
        for (var i = 0; i < constraints.length; i += 1) {
            var constraint = constraints[i],
                fixedA = !constraint.bodyA || (constraint.bodyA && constraint.bodyA.isStatic),
                fixedB = !constraint.bodyB || (constraint.bodyB && constraint.bodyB.isStatic);
            if (fixedA || fixedB) {
                Constraint.solve(constraints[i], timeScale);
            }
        }
        for (i = 0; i < constraints.length; i += 1) {
            constraint = constraints[i];
            fixedA = !constraint.bodyA || (constraint.bodyA && constraint.bodyA.isStatic);
            fixedB = !constraint.bodyB || (constraint.bodyB && constraint.bodyB.isStatic);
            if (!fixedA && !fixedB) {
                Constraint.solve(constraints[i], timeScale);
            }
        }
    };
    Constraint.solve = function(constraint, timeScale) {
        var bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB;
        if (!bodyA && !bodyB) { return; }
        if (bodyA && !bodyA.isStatic) {
            Vector.rotate(pointA, bodyA.angle - constraint.angleA, pointA);
            constraint.angleA = bodyA.angle;
        }
        if (bodyB && !bodyB.isStatic) {
            Vector.rotate(pointB, bodyB.angle - constraint.angleB, pointB);
            constraint.angleB = bodyB.angle;
        }
        var pointAWorld = pointA,  pointBWorld = pointB;
        if (bodyA) { pointAWorld = Vector.add(bodyA.pos, pointA); }
        if (bodyB) { pointBWorld = Vector.add(bodyB.pos, pointB); }
        if (!pointAWorld || !pointBWorld) { return; }
        var delta = Vector.sub(pointAWorld, pointBWorld),  currentLength = Vector.magnitude(delta);
        if (currentLength < Constraint._minLength) { currentLength = Constraint._minLength; }
        var difference = (currentLength - constraint.length) / currentLength,
            stiffness = constraint.stiffness < 1 ? constraint.stiffness * timeScale : constraint.stiffness,
            force = Vector.mult(delta, difference * stiffness),
            massTotal = (bodyA ? bodyA.invMass : 0) + (bodyB ? bodyB.invMass : 0),
            inertiaTotal = (bodyA ? bodyA.invInertia : 0) + (bodyB ? bodyB.invInertia : 0),
            resistanceTotal = massTotal + inertiaTotal,
            torque,
            share,
            normal,
            normalVelocity,
            relativeVelocity;
        if (constraint.damping) {
            var zero = Vector.create();
            normal = Vector.div(delta, currentLength);
            relativeVelocity = Vector.sub( bodyB && Vector.sub(bodyB.pos, bodyB.posPrev) || zero, bodyA && Vector.sub(bodyA.pos, bodyA.posPrev) || zero );
            normalVelocity = Vector.dot(normal, relativeVelocity);
        }
        if (bodyA && !bodyA.isStatic) {
            share = bodyA.invMass / massTotal;
            bodyA.constraintImpulse.x -= force.x * share;
            bodyA.constraintImpulse.y -= force.y * share;
            bodyA.pos.x -= force.x * share;
            bodyA.pos.y -= force.y * share;
            if (constraint.damping) {
                bodyA.posPrev.x -= constraint.damping * normal.x * normalVelocity * share;
                bodyA.posPrev.y -= constraint.damping * normal.y * normalVelocity * share;
            }
            torque = (Vector.cross(pointA, force) / resistanceTotal) * Constraint._torqueDampen * bodyA.invInertia * (1 - constraint.angularStiffness);
            bodyA.constraintImpulse.angle -= torque;
            bodyA.angle -= torque;
        }
        if (bodyB && !bodyB.isStatic) {
            share = bodyB.invMass / massTotal;
            bodyB.constraintImpulse.x += force.x * share;
            bodyB.constraintImpulse.y += force.y * share;
            bodyB.pos.x += force.x * share;
            bodyB.pos.y += force.y * share;
            if (constraint.damping) {
                bodyB.posPrev.x += constraint.damping * normal.x * normalVelocity * share;
                bodyB.posPrev.y += constraint.damping * normal.y * normalVelocity * share;
            }
            torque = (Vector.cross(pointB, force) / resistanceTotal) * Constraint._torqueDampen * bodyB.invInertia * (1 - constraint.angularStiffness);
            bodyB.constraintImpulse.angle += torque;
            bodyB.angle += torque;
        }
    };
    Constraint.postSolveAll = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                impulse = body.constraintImpulse;
            if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
                continue;
            }
            Sleeping.set(body, false);
            for (var j = 0; j < body.parts.length; j++) {
                var part = body.parts[j];
                part.vertices.translate(impulse);
                if (j > 0) {
                    part.pos.x += impulse.x;
                    part.pos.y += impulse.y;
                }
                if (impulse.angle !== 0) {
                    part.vertices.rotate(impulse.angle, body.pos);
                    Axes.rotate(part.axes, impulse.angle);
                    if (j > 0) {
                        Vector.rotateAbout(part.pos, impulse.angle, body.pos, part.pos);
                    }
                }
                Bounds.update(part.bounds, part.vertices, body.velocity);
            }
            impulse.angle *= Constraint._warming;
            impulse.x *= Constraint._warming;
            impulse.y *= Constraint._warming;
        }
    };
    Constraint.pointAWorld = function(constraint) {
        return constraint.bodyA ? (
                constraint.pointA ? 
                    {x: constraint.bodyA.pos.x + constraint.pointA.x, y: constraint.bodyA.pos.y + constraint.pointA.y} :
                    {x: constraint.bodyA.pos.x, y: constraint.bodyA.pos.y}
            ) : (
                constraint.pointA ? 
                    {x: constraint.pointA.x, y: constraint.pointA.y} :
                    {x: 0, y: 0}
            );          
    };
    Constraint.pointBWorld = function(constraint) {
        return constraint.bodyB ? (
                constraint.pointB ? 
                    {x: constraint.bodyB.pos.x + constraint.pointB.x, y: constraint.bodyB.pos.y + constraint.pointB.y} :
                    {x: constraint.bodyB.pos.x, y: constraint.bodyB.pos.y}
            ) : (
                constraint.pointB ? 
                    {x: constraint.pointB.x, y: constraint.pointB.y} :
                    {x: 0, y: 0}
            );         
    };
    /*
    *
    *  Properties Documentation
    *
    */
})();