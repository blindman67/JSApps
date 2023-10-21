var Pairs = {};
export {Pairs};
import {Pair} from "./Pair.js";
import {Common} from "../core/Common.js";
(function() {
    Pairs.create = function(options) {
        return Common.extend({
            table: {},
            list: [],
            collisionStart: [],
            collisionActive: [],
            collisionEnd: []
        }, options);
    };
    Pairs.update = function(pairs, collisions, timestamp) {
        var pairsList = pairs.list,
            pairsListLength = pairsList.length,
            pairsTable = pairs.table,
            collisionsLength = collisions.length,
            collisionStart = pairs.collisionStart,
            collisionEnd = pairs.collisionEnd,
            collisionActive = pairs.collisionActive,
            collision,
            pairIndex,
            pair,
            i;
        collisionStart.length = 0;
        collisionEnd.length = 0;
        collisionActive.length = 0;
        for (i = 0; i < pairsListLength; i++) {
            pairsList[i].confirmedActive = false;
        }
        for (i = 0; i < collisionsLength; i++) {
            collision = collisions[i];
            pair = collision.pair;
            if (pair) {
                if (pair.isActive) {
                    collisionActive.push(pair);
                } else {
                    collisionStart.push(pair);
                }
                Pair.update(pair, collision, timestamp);
                pair.confirmedActive = true;
            } else {
                pair = Pair.create(collision, timestamp);
                pairsTable[pair.id] = pair;
                collisionStart.push(pair);
                pairsList.push(pair);
            }
        }
        var removePairIndex = [];
        pairsListLength = pairsList.length;
        for (i = 0; i < pairsListLength; i++) {
            pair = pairsList[i];
            if (!pair.confirmedActive) {
                Pair.setActive(pair, false, timestamp);
                collisionEnd.push(pair);
                if (!pair.collision.bodyA.isSleeping && !pair.collision.bodyB.isSleeping) {
                    removePairIndex.push(i);
                }
            }
        }
        for (i = 0; i < removePairIndex.length; i++) {
            pairIndex = removePairIndex[i] - i;
            pair = pairsList[pairIndex];
            pairsList.splice(pairIndex, 1);
            delete pairsTable[pair.id];
        }
    };
    Pairs.clear = function(pairs) {
        pairs.table = {};
        pairs.list.length = 0;
        pairs.collisionStart.length = 0;
        pairs.collisionActive.length = 0;
        pairs.collisionEnd.length = 0;
        return pairs;
    };
})();