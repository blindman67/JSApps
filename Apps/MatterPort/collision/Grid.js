var Grid = {};
export {Grid};
import {Pair} from "./Pair.js";
import {Common} from "../core/Common.js";
//import {deprecated} from "precat.js";
(function() {
    Grid.create = function(options) {
        var defaults = {
            buckets: {},
            pairs: {},
            pairsList: [],
            bucketWidth: 48,
            bucketHeight: 48
        };
        return Common.extend(defaults, options);
    };
    /*
    Grid.update = function(grid, bodies, engine, forceUpdate) {
        var i, col, row,
            world = engine.world,
            buckets = grid.buckets,
            bucket,
            bucketId,
            gridChanged = false;
        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if (body.isSleeping && !forceUpdate)
                continue;
            
            if (world.bounds && (body.bounds.max.x < world.bounds.min.x || body.bounds.min.x > world.bounds.max.x
                || body.bounds.max.y < world.bounds.min.y || body.bounds.min.y > world.bounds.max.y))
                continue;
            var newRegion = Grid._getRegion(grid, body);
            
            if (!body.region || newRegion.id !== body.region.id || forceUpdate) {
                if (!body.region || forceUpdate)
                    body.region = newRegion;
                var union = Grid._regionUnion(newRegion, body.region);
                
                
                for (col = union.startCol; col <= union.endCol; col++) {
                    for (row = union.startRow; row <= union.endRow; row++) {
                        bucketId = Grid._getBucketId(col, row);
                        bucket = buckets[bucketId];
                        var isInsideNewRegion = (col >= newRegion.startCol && col <= newRegion.endCol
                                                && row >= newRegion.startRow && row <= newRegion.endRow);
                        var isInsideOldRegion = (col >= body.region.startCol && col <= body.region.endCol
                                                && row >= body.region.startRow && row <= body.region.endRow);
                        
                        if (!isInsideNewRegion && isInsideOldRegion) {
                            if (isInsideOldRegion) {
                                if (bucket)
                                    Grid._bucketRemoveBody(grid, bucket, body);
                            }
                        }
                        
                        if (body.region === newRegion || (isInsideNewRegion && !isInsideOldRegion) || forceUpdate) {
                            if (!bucket)
                                bucket = Grid._createBucket(buckets, bucketId);
                            Grid._bucketAddBody(grid, bucket, body);
                        }
                    }
                }
                
                body.region = newRegion;
                
                gridChanged = true;
            }
        }
        
        if (gridChanged)
            grid.pairsList = Grid._createActivePairsList(grid);
    };
    deprecated(Grid, 'update', 'Grid.update ➤ replaced by Matter.Detector');
    Grid.clear = function(grid) {
        grid.buckets = {};
        grid.pairs = {};
        grid.pairsList = [];
    };
    deprecated(Grid, 'clear', 'Grid.clear ➤ replaced by Matter.Detector');
    */
    Grid._regionUnion = function(regionA, regionB) {
        var startCol = Math.min(regionA.startCol, regionB.startCol),
            endCol = Math.max(regionA.endCol, regionB.endCol),
            startRow = Math.min(regionA.startRow, regionB.startRow),
            endRow = Math.max(regionA.endRow, regionB.endRow);
        return Grid._createRegion(startCol, endCol, startRow, endRow);
    };
    Grid._getRegion = function(grid, body) {
        var bounds = body.bounds,
            startCol = Math.floor(bounds.min.x / grid.bucketWidth),
            endCol = Math.floor(bounds.max.x / grid.bucketWidth),
            startRow = Math.floor(bounds.min.y / grid.bucketHeight),
            endRow = Math.floor(bounds.max.y / grid.bucketHeight);
        return Grid._createRegion(startCol, endCol, startRow, endRow);
    };
    Grid._createRegion = function(startCol, endCol, startRow, endRow) {
        return {
            id: startCol + ',' + endCol + ',' + startRow + ',' + endRow,
            startCol: startCol,
            endCol: endCol,
            startRow: startRow,
            endRow: endRow
        };
    };
    Grid._getBucketId = function(column, row) {
        return 'C' + column + 'R' + row;
    };
    Grid._createBucket = function(buckets, bucketId) {
        var bucket = buckets[bucketId] = [];
        return bucket;
    };
    Grid._bucketAddBody = function(grid, bucket, body) {
        var gridPairs = grid.pairs,
            pairId = Pair.id,
            bucketLength = bucket.length,
            i;
        
        for (i = 0; i < bucketLength; i++) {
            var bodyB = bucket[i];
            if (body.id === bodyB.id || (body.isStatic && bodyB.isStatic))
                continue;
            
            
            var id = pairId(body, bodyB),
                pair = gridPairs[id];
            if (pair) {
                pair[2] += 1;
            } else {
                gridPairs[id] = [body, bodyB, 1];
            }
        }
        
        bucket.push(body);
    };
    Grid._bucketRemoveBody = function(grid, bucket, body) {
        var gridPairs = grid.pairs,
            pairId = Pair.id,
            i;
        
        bucket.splice(Common.indexOf(bucket, body), 1);
        var bucketLength = bucket.length;
        
        for (i = 0; i < bucketLength; i++) {
            
            
            var pair = gridPairs[pairId(body, bucket[i])];
            if (pair)
                pair[2] -= 1;
        }
    };
    Grid._createActivePairsList = function(grid) {
        var pair,
            gridPairs = grid.pairs,
            pairKeys = Common.keys(gridPairs),
            pairKeysLength = pairKeys.length,
            pairs = [],
            k;
        
        for (k = 0; k < pairKeysLength; k++) {
            pair = gridPairs[pairKeys[k]];
            
            
            if (pair[2] > 0) {
                pairs.push(pair);
            } else {
                delete gridPairs[pairKeys[k]];
            }
        }
        return pairs;
    };
})();