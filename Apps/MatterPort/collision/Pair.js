



import {Contact} from "./Contact.js";
const Pair = (() => {
    class Pair {
        static create(collision, timestamp) {
            var bodyA = collision.bodyA,
                bodyB = collision.bodyB;
            var pair = {
                id: Pair.id(bodyA, bodyB),
                bodyA: bodyA,
                bodyB: bodyB,
                collision: collision,
                contacts: [],
                activeContacts: [],
                separation: 0,
                isActive: true,
                confirmedActive: true,
                isSensor: bodyA.isSensor || bodyB.isSensor,
                timeCreated: timestamp,
                timeUpdated: timestamp,
                invMass: 0,
                friction: 0,
                frictionStatic: 0,
                restitution: 0,
                slop: 0
            };
            Pair.update(pair, collision, timestamp);
            return pair;
        }
        static update(pair, collision, timestamp) {
            var contacts = pair.contacts,
                supports = collision.supports,
                activeContacts = pair.activeContacts,
                parentA = collision.parentA,
                parentB = collision.parentB,
                parentAVerticesLength = parentA.vertices.length;
            pair.isActive = true;
            pair.timeUpdated = timestamp;
            pair.collision = collision;
            pair.separation = collision.depth;
            pair.invMass = parentA.invMass + parentB.invMass;
            pair.friction = parentA.friction < parentB.friction ? parentA.friction : parentB.friction;
            pair.frictionStatic = parentA.frictionStatic > parentB.frictionStatic ? parentA.frictionStatic : parentB.frictionStatic;
            pair.restitution = parentA.restitution > parentB.restitution ? parentA.restitution : parentB.restitution;
            pair.slop = parentA.slop > parentB.slop ? parentA.slop : parentB.slop;
            collision.pair = pair;
            activeContacts.length = 0;
            for (var i = 0; i < supports.length; i++) {
                var support = supports[i],
                    contactId = support.parent === parentA ? support.idx : parentAVerticesLength + support.idx,
                    contact = contacts[contactId];
                if (contact) {
                    activeContacts.push(contact);
                } else {
                    activeContacts.push(contacts[contactId] = Contact.create(support));
                }
            }
        }
        static setActive(pair, isActive, timestamp) {
            if (isActive) {
                pair.isActive = true;
                pair.timeUpdated = timestamp;
            } else {
                pair.isActive = false;
                pair.activeContacts.length = 0;
            }
        }
        static id(bodyA, bodyB) {
            if (bodyA.id < bodyB.id) {
                return 'A' + bodyA.id + 'B' + bodyB.id;
            } else {
                return 'A' + bodyB.id + 'B' + bodyA.id;
            }
        }
    }
    return Pair;
})();

export {Pair};






/*

var Pair = {};
export {Pair};
import {Contact} from "./Contact.js";
(function() {
    Pair.create = function(collision, timestamp) {
        var bodyA = collision.bodyA,
            bodyB = collision.bodyB;
        var pair = {
            id: Pair.id(bodyA, bodyB),
            bodyA: bodyA,
            bodyB: bodyB,
            collision: collision,
            contacts: [],
            activeContacts: [],
            separation: 0,
            isActive: true,
            confirmedActive: true,
            isSensor: bodyA.isSensor || bodyB.isSensor,
            timeCreated: timestamp,
            timeUpdated: timestamp,
            invMass: 0,
            friction: 0,
            frictionStatic: 0,
            restitution: 0,
            slop: 0
        };
        Pair.update(pair, collision, timestamp);
        return pair;
    };
    Pair.update = function(pair, collision, timestamp) {
        var contacts = pair.contacts,
            supports = collision.supports,
            activeContacts = pair.activeContacts,
            parentA = collision.parentA,
            parentB = collision.parentB,
            parentAVerticesLength = parentA.vertices.length;
        pair.isActive = true;
        pair.timeUpdated = timestamp;
        pair.collision = collision;
        pair.separation = collision.depth;
        pair.invMass = parentA.invMass + parentB.invMass;
        pair.friction = parentA.friction < parentB.friction ? parentA.friction : parentB.friction;
        pair.frictionStatic = parentA.frictionStatic > parentB.frictionStatic ? parentA.frictionStatic : parentB.frictionStatic;
        pair.restitution = parentA.restitution > parentB.restitution ? parentA.restitution : parentB.restitution;
        pair.slop = parentA.slop > parentB.slop ? parentA.slop : parentB.slop;
        collision.pair = pair;
        activeContacts.length = 0;
        for (var i = 0; i < supports.length; i++) {
            var support = supports[i],
                contactId = support.parent === parentA ? support.idx : parentAVerticesLength + support.idx,
                contact = contacts[contactId];
            if (contact) {
                activeContacts.push(contact);
            } else {
                activeContacts.push(contacts[contactId] = Contact.create(support));
            }
        }
    };
    Pair.setActive = function(pair, isActive, timestamp) {
        if (isActive) {
            pair.isActive = true;
            pair.timeUpdated = timestamp;
        } else {
            pair.isActive = false;
            pair.activeContacts.length = 0;
        }
    };
    Pair.id = function(bodyA, bodyB) {
        if (bodyA.id < bodyB.id) {
            return 'A' + bodyA.id + 'B' + bodyB.id;
        } else {
            return 'A' + bodyB.id + 'B' + bodyA.id;
        }
    };
})();*/