import {Events} from "./Events.js";
const Sleeping = (() => {
    var motionWakeThreshold = 0.18;
    var motionSleepThreshold = 0.08;
    var minBias = 0.9;    
    class Sleeping {

        update(bodies, timeScale) {
            const timeFactor = timeScale * timeScale * timeScale;
            for (const body of bodies) {
                const motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;
                if (body.force.x !== 0 || body.force.y !== 0) {
                    this.set(body, false);
                } else {
                    const minMotion = Math.min(body.motion, motion);
                    const maxMotion = Math.max(body.motion, motion);
                    body.motion = minBias * minMotion + (1 - minBias) * maxMotion;
                    if (body.sleepThreshold > 0 && body.motion < motionSleepThreshold * timeFactor) {
                        body.sleepCounter += 1;
                        if (body.sleepCounter >= body.sleepThreshold) {
                            this.set(body, true);
                        }
                    } else if (body.sleepCounter > 0) {
                        body.sleepCounter -= 1;
                    }
                }
            }
        }
        afterCollisions(pairs, timeScale) {

            var timeFactor = timeScale * timeScale * timeScale;
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                if (pair.isActive) {
                    const collision = pair.collision;
                    const bA = collision.bodyA.parent;
                    const bB = collision.bodyB.parent;
                

                    if ((bA.isSleeping && bB.isSleeping) || bA.isStatic || bB.isStatic) {
                        continue;
                    }
                
                    if (bA.isSleeping || bB.isSleeping) {
                        const sleepingBody = (bA.isSleeping && !bA.isStatic) ? bA : bB;
                        const movingBody = sleepingBody === bA ? bB : bA;

                        if (!sleepingBody.isStatic && movingBody.motion > Sleeping._motionWakeThreshold * timeFactor) {
                            Sleeping.set(sleepingBody, false);
                        }
                    }
                }
            }
        }
        set(body, isSleeping) {
            const wasSleeping = body.isSleeping;
            if (isSleeping) {
                body.isSleeping = true;
                body.sleepCounter = body.sleepThreshold;
                body.posImpulse.x = 0;
                body.posImpulse.y = 0;
                body.posPrev.x = body.pos.x;
                body.posPrev.y = body.pos.y;
                body.anglePrev = body.angle;
                body.speed = 0;
                body.angularSpeed = 0;
                body.motion = 0;
                if (!wasSleeping) { 
                console.log("Sleep");
                    Events.trigger(body, 'sleepStart'); }
            } else {
                body.isSleeping = false;
                body.sleepCounter = 0;
                if (wasSleeping) { 
                                console.log("Wake");

                    Events.trigger(body, 'sleepEnd'); }
            }
        }   
    };
    return new Sleeping();
})()
export {Sleeping};
