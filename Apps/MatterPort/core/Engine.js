import {Sleeping} from "./Sleeping.js";
import {Resolver} from "../collision/Resolver.js";
import {Detector} from "../collision/Detector.js";
import {Pairs} from "../collision/Pairs.js";
import {Events} from "./Events.js";
import {Composite} from "../body/Composite.js";
import {Constraint} from "../constraint/Constraint.js";
import {Common} from "./Common.js";
import {Body} from "../body/Body.js";
const Engine = (() => {
    class Engine {
        static create(options) {
            options = options || {};
            var defaults = {
                posIterations: 16,
                velocityIterations: 14,
                constraintIterations: 12,
                enableSleeping: false,
                events: [],
                plugin: {},
                gravity: { x: 0, y: 1,  scale: 0.001 },
                timing: {
                    timestamp: 0,
                    timeScale: 1,
                    lastDelta: 0,
                    lastElapsed: 0
                }
            };
            var engine = Common.extend(defaults, options);
            engine.world = Composite.create({ label: 'World' });
            engine.pairs = options.pairs || Pairs.create();
            engine.detector = options.detector || Detector.create();
            engine.grid = { buckets: [] };
            engine.world.gravity = engine.gravity;
            engine.broadphase = engine.grid;
            engine.metrics = {};
            Events.for(engine, "beforeUpdate,afterUpdate,collisionStart,collisionActive,collisionEnd");
            return engine;
        }
        static update(engine, delta, correction) {
            var startTime = Common.now();
            delta = delta || 1000 / 60;
            correction = correction || 1;
            var world       = engine.world;
            var detector    = engine.detector;
            var pairs       = engine.pairs;
            var timing      = engine.timing;
            var timestamp   = timing.timestamp;
            var i;
            timing.timestamp += delta * timing.timeScale;
            timing.lastDelta = delta * timing.timeScale;
            var event = { timestamp: timing.timestamp };
            engine.events.onBeforeUpdate.fire(event);
            var allBodies = Composite.allBodies(world);
            var allConstraints = Composite.allConstraints(world);
            if (world.isModified) { Detector.setBodies(detector, allBodies); }
            if (world.isModified) { Composite.setModified(world, false, false, true); }
            if (engine.enableSleeping) { Sleeping.update(allBodies, timing.timeScale); }
            Engine.bodiesApplyGravity(allBodies, engine.gravity);
            Engine.bodiesUpdate(allBodies, delta, timing.timeScale, correction, world.bounds);
            Constraint.preSolveAll(allBodies);
            for (i = 0; i < engine.constraintIterations; i++) { Constraint.solveAll(allConstraints, timing.timeScale); }
            Constraint.postSolveAll(allBodies);
            detector.pairs = engine.pairs;
            var collisions = Detector.collisions(detector);
            Pairs.update(pairs, collisions, timestamp);
            if (engine.enableSleeping) {  Sleeping.afterCollisions(pairs.list, timing.timeScale); }
            if (pairs.collisionStart.length > 0) { engine.events.onCollisionStart.fire({ pairs: pairs.collisionStart }); }
            Resolver.preSolvePos(pairs.list);
            for (i = 0; i < engine.posIterations; i++) { Resolver.solvePos(pairs.list, timing.timeScale); }
            Resolver.postSolvePos(allBodies);
            Constraint.preSolveAll(allBodies);
            for (i = 0; i < engine.constraintIterations; i++) {  Constraint.solveAll(allConstraints, timing.timeScale); }
            Constraint.postSolveAll(allBodies);
            Resolver.preSolveVelocity(pairs.list);
            for (i = 0; i < engine.velocityIterations; i++) { Resolver.solveVelocity(pairs.list, timing.timeScale); }
            if (pairs.collisionActive.length > 0) { engine.events.onCollisionActive.fire({ pairs: pairs.collisionActive }); }
            if (pairs.collisionEnd.length > 0) { engine.events.onCollisionEnd.fire({ pairs: pairs.collisionEnd }); }
            Engine.bodiesClearForces(allBodies);
            engine.events.onAfterUpdate.fire(event);
            engine.timing.lastElapsed = Common.now() - startTime;
            return engine;
        }
        static merge(engineA, engineB) {
            Common.extend(engineA, engineB);
            if (engineB.world) {
                engineA.world = engineB.world;
                Engine.clear(engineA);
                var bodies = Composite.allBodies(engineA.world);
                for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    Sleeping.set(body, false);
                    body.id = Common.nextId();
                }
            }
        }
        static clear(engine) {
            Pairs.clear(engine.pairs);
            Detector.clear(engine.detector);
        }
        static bodiesClearForces(bodies) {
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                body.force.x = 0;
                body.force.y = 0;
                body.torque = 0;
            }
        }
        static bodiesApplyGravity(bodies, gravity) {
            const gravityScale = gravity.scale ?? 0.001;
            if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) { return; }
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body.isStatic || body.isSleeping) { continue; }
                body.force.y += body.mass * gravity.y * gravityScale;
                body.force.x += body.mass * gravity.x * gravityScale;
            }
        }
        static bodiesUpdate(bodies, deltaTime, timeScale, correction, worldBounds) {
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (!body.isStatic && !body.isSleeping) {  
                    body.update(deltaTime, timeScale, correction);
                }
            }
        };
    }
    return Engine;
})();
export {Engine};