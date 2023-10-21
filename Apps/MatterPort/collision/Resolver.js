var Resolver = {};
export {Resolver};
import {Vertices} from "../geometry/Vertices.js";
import {Bounds} from "../geometry/Bounds.js";
(function() {
    Resolver._restingThresh = 4;
    Resolver._restingThreshTangent = 6;
    Resolver._PosDampen = 0.9;
    Resolver._PosWarming = 0.8;
    Resolver._frictionNormalMultiplier = 50;
    Resolver.preSolvePos = function(pairs) {
        var i, pair, activeCount, pairsLength = pairs.length;
        for (i = 0; i < pairsLength; i++) {
            pair = pairs[i];
            if (!pair.isActive) { continue; }
            activeCount = pair.activeContacts.length;
            pair.collision.parentA.totalContacts += activeCount;
            pair.collision.parentB.totalContacts += activeCount;
        }
    };
    Resolver.solvePos = function(pairs, timeScale) {
        var i, posImp;
        const posDampen = Resolver._PosDampen;
        const pairsLen = pairs.length;
        for (i = 0; i < pairsLen; i++) {
            const pair = pairs[i];
            if (!pair.isActive || pair.isSensor) { continue; }
            const col = pair.collision;
            const bA = col.parentA;
            const bB = col.parentB;
            const normal = col.normal;
            pair.separation =
                normal.x * (bB.posImpulse.x + col.penetration.x - bA.posImpulse.x) +
                normal.y * (bB.posImpulse.y + col.penetration.y - bA.posImpulse.y);
        }
        for (i = 0; i < pairsLen; i++) {
            const pair = pairs[i];
            if (!pair.isActive || pair.isSensor) { continue; }
            const col = pair.collision;
            const bA = col.parentA;
            const bB = col.parentB;
            const normal = col.normal;
            posImp = (pair.separation - pair.slop) * timeScale;
            if (bA.isStatic || bB.isStatic) { posImp *= 2; }
            if (!(bA.isStatic || bA.isSleeping)) {
                const contactShare = posDampen / bA.totalContacts;
                bA.posImpulse.x += normal.x * posImp * contactShare;
                bA.posImpulse.y += normal.y * posImp * contactShare;
            }
            if (!(bB.isStatic || bB.isSleeping)) {
                const contactShare = posDampen / bB.totalContacts;
                bB.posImpulse.x -= normal.x * posImp * contactShare;
                bB.posImpulse.y -= normal.y * posImp * contactShare;
            }
        }
    };
    Resolver.postSolvePos = function(bodies) {
        var i, j;
        const posWarming = Resolver._PosWarming;
        const bodiesLen = bodies.length;
        //const verticesTranslate = Vertices.translate;
        const boundsUpdate = Bounds.update;
        for (i = 0; i < bodiesLen; i++) {
            const body = bodies[i];
            const posImp = body.posImpulse;
            const posImpX = posImp.x;
            const posImpY = posImp.y;
            const vel = body.velocity;
            body.totalContacts = 0;
            if (posImpX !== 0 || posImpY !== 0) {
                for (j = 0; j < body.parts.length; j++) {
                    const part = body.parts[j];
                    part.vertices.translate(posImp);
                    boundsUpdate(part.bounds, part.vertices, vel);
                    part.pos.x += posImpX;
                    part.pos.y += posImpY;
                }
                body.posPrev.x += posImpX;
                body.posPrev.y += posImpY;
                if (posImpX * vel.x + posImpY * vel.y < 0) {
                    posImp.x = 0;
                    posImp.y = 0;
                } else {
                    posImp.x *= posWarming;
                    posImp.y *= posWarming;
                }
            }
        }
    };
    Resolver.preSolveVelocity = function(pairs) {
        const pairsLen = pairs.length;
        var i, j;
        for (i = 0; i < pairsLen; i++) {
            const pair = pairs[i];
            if (!pair.isActive || pair.isSensor) { continue; }
            const contacts = pair.activeContacts;
            const contactsLen = contacts.length;
            const collision = pair.collision;
            const bA = collision.parentA;
            const bB = collision.parentB;
            const updateA = !(bA.isStatic || bA.isSleeping);
            const updateB = !(bB.isStatic || bB.isSleeping);           
            const normal = collision.normal;
            const tangent = collision.tangent;
            for (j = 0; j < contactsLen; j++) {
                const contact = contacts[j];
                const contactVertex = contact.vertex;
                const normalImp = contact.normalImpulse;
                const tangentImp = contact.tangentImpulse;
                if (normalImp !== 0 || tangentImp !== 0) {
                    const impulseX = normal.x * normalImp + tangent.x * tangentImp;
                    const impulseY = normal.y * normalImp + tangent.y * tangentImp;
                    if (updateA) {
                        bA.posPrev.x += impulseX * bA.invMass;
                        bA.posPrev.y += impulseY * bA.invMass;
                        bA.anglePrev += bA.invInertia * ((contactVertex.x - bA.pos.x) * impulseY - (contactVertex.y - bA.pos.y) * impulseX);
                    }
                    if (updateB) {
                        bB.posPrev.x -= impulseX * bB.invMass;
                        bB.posPrev.y -= impulseY * bB.invMass;
                        bB.anglePrev -= bB.invInertia * ((contactVertex.x - bB.pos.x) * impulseY - (contactVertex.y - bB.pos.y) * impulseX);
                    }
                }
            }
        }
    };
    Resolver.solveVelocity = function(pairs, timeScale) {
        const timeScaleSquared = timeScale * timeScale;
        const restingThresh = Resolver._restingThresh * timeScaleSquared;
        const frictionNormalMultiplier = Resolver._frictionNormalMultiplier;
        const restingThreshTangent = Resolver._restingThreshTangent * timeScaleSquared;
        const NMV = Number.MAX_VALUE;
        const pairsLen = pairs.length;
        var tangentImp, maxFriction, i, j;
        for (i = 0; i < pairsLen; i++) {
            var pair = pairs[i];
            if (!pair.isActive || pair.isSensor) { continue; }
            const collision = pair.collision;
            const bA = collision.parentA;
            const bB = collision.parentB;
            const updateA = !(bA.isStatic || bA.isSleeping);
            const updateB = !(bB.isStatic || bB.isSleeping);
            const bodyAVel = bA.velocity;
            const bodyBVel = bB.velocity;
            const normalX = collision.normal.x;
            const normalY = collision.normal.y;
            const tangentX = collision.tangent.x;
            const tangentY = collision.tangent.y;
            const contacts = pair.activeContacts;
            const contactsLen = contacts.length;
            const contactShare = 1 / contactsLen;
            const inverseMassTotal = bA.invMass + bB.invMass;
            const friction = pair.friction * pair.frictionStatic * frictionNormalMultiplier * timeScaleSquared;
            bodyAVel.x = bA.pos.x - bA.posPrev.x;
            bodyAVel.y = bA.pos.y - bA.posPrev.y;
            bodyBVel.x = bB.pos.x - bB.posPrev.x;
            bodyBVel.y = bB.pos.y - bB.posPrev.y;
            bA.angularVelocity = bA.angle - bA.anglePrev;
            bB.angularVelocity = bB.angle - bB.anglePrev;
            for (j = 0; j < contactsLen; j++) {
                const contact = contacts[j];
                const contactVert = contact.vertex;
                const offsetAX = contactVert.x - bA.pos.x;
                const offsetAY = contactVert.y - bA.pos.y;
                const offsetBX = contactVert.x - bB.pos.x;
                const offsetBY = contactVert.y - bB.pos.y;

                const relativeVelX = (bodyAVel.x - offsetAY * bA.angularVelocity) - (bodyBVel.x - offsetBY * bB.angularVelocity);
                const relativeVelY = (bodyAVel.y + offsetAX * bA.angularVelocity) - (bodyBVel.y + offsetBX * bB.angularVelocity);
                const normalVel = normalX * relativeVelX + normalY * relativeVelY;
                const tangentVel = tangentX * relativeVelX + tangentY * relativeVelY;
                const normalOverlap = pair.separation + normalVel;
                const normalForce = Math.max(0, Math.min(normalOverlap, 1));
                const frictionLimit = normalForce * friction;
                if (tangentVel > frictionLimit || -tangentVel > frictionLimit) {
                    
                    maxFriction = tangentVel > 0 ? tangentVel : -tangentVel;
                    tangentImp = pair.friction * (tangentVel > 0 ? 1 : -1) * timeScaleSquared;
                    if (tangentImp < -maxFriction) { tangentImp = -maxFriction; }
                    else if (tangentImp > maxFriction) { tangentImp = maxFriction; }
                } else {
                    tangentImp = tangentVel;
                    maxFriction = NMV;
                }
                const oAcN = offsetAX * normalY - offsetAY * normalX;
                const oBcN = offsetBX * normalY - offsetBY * normalX;
                const share = contactShare / (inverseMassTotal + bA.invInertia * oAcN * oAcN + bB.invInertia * oBcN * oBcN);
                var normalImp = (1 + pair.restitution) * normalVel * share;
                tangentImp *= share;
                if (normalVel * normalVel > restingThresh && normalVel < 0) {
                    contact.normalImpulse = 0;
                } else {
                    const contactNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse += normalImp;
                    contact.normalImpulse = Math.min(contact.normalImpulse, 0);
                    normalImp = contact.normalImpulse - contactNormalImpulse;
                }
                if (tangentVel * tangentVel > restingThreshTangent) {
                    contact.tangentImpulse = 0;
                } else {
                    const contactTangentImpulse = contact.tangentImpulse;
                    contact.tangentImpulse += tangentImp;
                    if (contact.tangentImpulse < -maxFriction) { contact.tangentImpulse = -maxFriction; }
                    if (contact.tangentImpulse > maxFriction) { contact.tangentImpulse = maxFriction; }
                    tangentImp = contact.tangentImpulse - contactTangentImpulse;
                }
                const impX = normalX * normalImp + tangentX * tangentImp;
                const impY = normalY * normalImp + tangentY * tangentImp;
                if (updateA) {
                    bA.posPrev.x += impX * bA.invMass;
                    bA.posPrev.y += impY * bA.invMass;
                    bA.anglePrev += (offsetAX * impY - offsetAY * impX) * bA.invInertia;
                }
                if (updateB) {
                    bB.posPrev.x -= impX * bB.invMass;
                    bB.posPrev.y -= impY * bB.invMass;
                    bB.anglePrev -= (offsetBX * impY - offsetBY * impX) * bB.invInertia;
                }
            }
        }
    };
})();