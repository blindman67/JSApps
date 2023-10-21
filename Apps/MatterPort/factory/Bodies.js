var Bodies = {};
export {Bodies };
import {Vertices} from "../geometry/Vertices.js";
import {Common} from "../core/Common.js";
import {Body, BodyShapes} from "../body/Body.js";
import {Bounds} from "../geometry/Bounds.js";
import {Vector, Vec2} from "../geometry/Vector.js";
import {decomp, quickDecomp, isSimple, removeCollinearPoints, removeDuplicatePoints, makeCCW} from  "../factory/PolygonDecomp.jsm";
(function() {
    Bodies.rectangle = function(x, y, width, height, options) {
        options = options || {};
        
        var rectangle = {
            label: 'Rectangle Body',
            pos: {x, y},
            vertices: Vertices.fromPoints([0, 0, width, 0, width, height, 0, height])
        };
        if (options.chamfer) {
            var chamfer = options.chamfer;
            rectangle.vertices = rectangle.vertices.chamfer(chamfer.radius, chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }
        return Body.create(Common.extend({}, rectangle, options));
    };
    Bodies.rectangleEdged = function(x, y, width, height, startIdx, endIdx, offsets,  options) {
        options = options || {};
        
        var rectangle = {
            label: 'Rectangle Edged Body',
            pos: {x, y},
            vertices: Vertices.fromPoints([0, 0, width, 0, width, height, 0, height])
        };
        rectangle.vertices.makeEdge(startIdx, endIdx, offsets);
        rectangle.vertices.makeEdge(startIdx + 3, endIdx + 3, offsets.map(()=>0));
        
        if (options.chamfer) {
            var chamfer = options.chamfer;
            rectangle.vertices = rectangle.vertices.chamfer(chamfer.radius, chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }
        return Bodies.fromVertices(x, y, rectangle.vertices, options, false, 0);
        //return Body.create(Common.extend({}, rectangle, options));
    };    
    Bodies.trapezoid = function(x, y, width, height, slope, options) {
        options = options || {};
        slope *= 0.5;
        var roof = (1 - (slope * 2)) * width;
        var x1 = width * slope,
            x2 = x1 + roof,
            x3 = x2 + x1,
            verticesPath;
        if (slope < 0.5) {
            verticesPath = [0, 0, x1, -height, x2, -height, x3, 0];
        } else {
            verticesPath = [0, 0, x2, -heiight, x3, 0];

        }
        var trapezoid = {
            label: 'Trapezoid Body',
            pos: { x: x, y: y },
            vertices: Vertices.fromPoints(verticesPath)
        };
        if (options.chamfer) {
            var chamfer = options.chamfer;
            trapezoid.vertices = Vertices.chamfer(trapezoid.vertices, chamfer.radius,
                chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }
        return Body.create(Common.extend({}, trapezoid, options));
    };
    Bodies.circle = function(x, y, radius, options, maxSides) {
        options = options || {};
        var circle = {
            label: 'Circle Body',
            circleRadius: radius,
            shapeType: BodyShapes.circle
        };
        maxSides = 6;//maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));
        if (sides % 2 === 1) { sides += 1; }
        return Bodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
    };
    Bodies.ellipse = function(x, y, radiusA, radiusB, options, maxSides) {
        options = options || {};
        var circle = {
            label: 'Ellipse Body',
            circleRadius: radiusA,
            shapeType: BodyShapes.vertices
        };
        maxSides = maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, radiusA)));
        if (sides % 2 === 1) { sides += 1; }
        return Bodies.polygon(x, y, sides, radiusA, Common.extend({}, circle, options), radiusB);
    };    
    Bodies.egg = function(x, y, rA, rB, rC,  options, maxSides) {
        options = options || {};
        var circle = { label: 'Egg Body', shapeType: BodyShapes.vertices };
        maxSides = maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, Math.max(rA, rB, rC))));
        if (sides % 2 === 1) { sides += 1; }
        const rads = [rB, rC];
        const invTAU = 1 / (2 * Math.PI);
        var i, theta = 2 * Math.PI / sides, path = [], offset = theta * 0.5;
        for (i = 0; i < sides; i += 1) {
            const angle = offset + (i * theta);
            const r = rads[angle * invTAU * 2 | 0];
            const xx = Math.cos(angle) * rA;
            const yy = Math.sin(angle) * r;
            path.push(xx, yy);
        }
        var polygon = {label: 'Polygon Body',  pos: { x: x, y: y }, vertices: Vertices.fromPoints(path) };

        return Body.create(Common.extend({}, polygon, options));
    };    
    Bodies.polygon = function(x, y, sides, radius, options, radiusB = radius) {
        options = options || {};
        if (sides < 3) { return Bodies.circle(x, y, radius, options); }
        var theta = 2 * Math.PI / sides, path = [], offset = theta * 0.5;
        for (var i = 0; i < sides; i += 1) {
            const angle = offset + (i * theta);
            const xx = Math.cos(angle) * radius;
            const yy = Math.sin(angle) * radiusB;
            path.push(xx, yy);
        }
        var polygon = {label: 'Polygon Body',  pos: { x: x, y: y }, vertices: Vertices.fromPoints(path) };
        if (options.chamfer) {
            var chamfer = options.chamfer;
            polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius, chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }
        return Body.create(Common.extend({}, polygon, options));
    };
    Bodies.fromVertices = function(x, y, vertexSets, options = {}, flagInternal = false, removeCollinear = 0.01, minimumArea = 10, removeDuplicates = 0.01) {
        //var decomp = Common.getDecomp();
        var canDecomp;
        var body;
        var parts;
        var isConvex;
        var isConcave;
        var vertices;
        var i;
        var j;
        var k;
        var v;
        var z;
        canDecomp = Boolean(quickDecomp);
        parts = [];
        if (!Array.isArray(vertexSets[0])) {
            vertexSets = [vertexSets];
        }
        for (v = 0; v < vertexSets.length; v += 1) {
            vertices = vertexSets[v];
            isConvex = vertices.isConvex();
            isConcave = !isConvex;
            if (isConcave && !canDecomp) {
                Common.warnOnce('Bodies.fromVertices: Install the \'poly-decomp\' library and use Common.setDecomp or provide \'decomp\' as a global to decompose concave vertices.' );
            }
            if (isConvex || !canDecomp) {
                if (isConvex) {
                    vertices = vertices.clockwiseSort();
                } else {
                    vertices = vertices.hull();
                }
                parts.push({
                    pos: { x: x, y: y },
                    vertices: vertices
                });
            } else {
                var concave = vertices.map(function(vertex) {
                    return [vertex.x, vertex.y];
                });
                makeCCW(concave);
                if (removeCollinear) {
                    removeCollinearPoints(concave, removeCollinear);
                }
                if (removeDuplicates) {
                    removeDuplicatePoints(concave, removeDuplicatePoints);
                }
                var decomposed = quickDecomp(concave);
                for (i = 0; i < decomposed.length; i++) {
                    var chunk = decomposed[i];
                    var chunkVertices = Vertices.fromVectors(chunk.map(verts => new Vec2(verts[0], verts[1])));
                    if (minimumArea > 0 && chunkVertices.area() < minimumArea) {
                        continue;
                    }
                    parts.push({
                        pos: chunkVertices.center(),
                        vertices: chunkVertices
                    });
                }
            }
        }
        for (i = 0; i < parts.length; i++) {
            parts[i] = Body.create(Common.extend(parts[i], options));
            
        }
        if (flagInternal) {
            var coincident_max_dist = 5;
            for (i = 0; i < parts.length; i++) {
                var partA = parts[i];
                for (j = i + 1; j < parts.length; j++) {
                    var partB = parts[j];
                    if (Bounds.overlaps(partA.bounds, partB.bounds)) {
                        var pav = partA.vertices,
                            pbv = partB.vertices;
                        for (k = 0; k < partA.vertices.length; k++) {
                            for (z = 0; z < partB.vertices.length; z++) {
                                var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])),
                                    db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));
                                if (da < coincident_max_dist && db < coincident_max_dist) {
                                    pav[k].isInternal = true;
                                    pbv[z].isInternal = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (parts.length > 1) {
            //options.parts = parts;
           
            //body = Body.create(Common.extend({}, {pos:{x, y}},  options));
            //body.setPos(new Vec2(x, y));
            const p = new Vec2(x, y);
            p.sub(parts[0].pos);
            for (i = 0; i < parts.length; i++) {
                parts[i].translate(p);
            }
            return parts;
            return body;
        } else {
            return parts[0];
        }
    };
})();