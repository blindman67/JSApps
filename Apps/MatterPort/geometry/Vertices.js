
import {Vector, Vec2} from "../geometry/Vector.js";
import {Common} from "../core/Common.js";
import {BodyShapes} from "../body/Body.js";
const {Vertices, Vertex} = (() => {
    class Vertex extends Vec2 {
        idx;
        isInternal = false;
        constructor(pos, idx, isInternal = this.isInternal) {
            super(pos.x, pos.y);
            this.idx = idx;
            this.isInternal = isInternal;
        }
    };
    const wv1 = new Vec2();
    const wv2 = new Vec2();
    const wv3 = new Vec2();
    const wv4 = new Vec2();
    function Verts(body) {
        function setShapeCircle() {
            VS.shapeType = BodyShapes.circle;
            VS.radius = VS.parent.circleRadius;
            VS.radiusSqr = VS.radius * VS.radius;
            Object.assign(VS, VSCircle);
            VS.centerPos.setVec(VS.parent.pos);
        }
        function setShapeVertices() {
            Object.assign(VS, VSVertices);
        }
        function setShapeType(shapeType) {
            if (shapeType === BodyShapes.circle) { setShapeCircle() }
            else { setShapeVertices() }
        }

        const VSCircle = {
            shapeType: BodyShapes.circle,
            isConvex() { return true; },
            get centerPos() { return new Vec2(); },
            contains(point) {
                return VS.parent.pos.distSqrTo(point) < VS.radiusSqr;
            }, 
            area(signed) {
                return Math.PI * VS.radiusSqr;
            },
            /*center(res = new Vec2()) {
                res.setVec(VS.centerPos);
                return res;
            },  */
            inertia(mass) {
                const cI = (Math.PI * 0.25 * (VS.radius ** 4) * VS.parent.density);// / VS.parent.density;
                return cI * 2;
            },    
            translate(translation, scalar = 1) {
                const t = wv1.setVec(translation).mult(scalar);
                VS.centerPos.add(t);
                var i;
                for (i = 0; i < VS.length; i++) { VS[i].add(t) }
                return VS;
            },           
            rotate(rot, origin) {
                return VS;
            },               
            translateRotate(translation, rot, origin) {
                VS.translate(translation);
                return VS;
            },           
        };
        const VSVertices = {
            shapeType: BodyShapes.vertices,
           
            contains(point) {
                const len = VS.length;
                var i, vb = VS[len - 1];
                const x = point.x, y = point.y;
                for (i = 0; i < len; i++) {
                    const va = VS[i];
                    if ((x - vb.x) * (va.y - vb.y) + (y - vb.y) * (vb.x - va.x) > 0) { return false }
                    vb = va;
                }
                return true;
            },            
        };       
        
        
        const VS = Object.assign([], {
            parent: undefined,
            shapeType: undefined,
            setParent(pBody) {
                if (pBody) {
                    VS.parent = pBody;
                    setShapeType(VS.parent.shapeType);
                }
            },
            fromPath(path, body) {
                const pattern = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/ig;
                path.replace(pattern, (match, x, y) => {
                    VS.push(new Vertex(wv1.set(Number(x), Number(y)), VS.length, false));
                });
                VS.setParent(body);
                return VS;
            },
            moveVert(idx, v) {
                v.idx = idx;
                VS[idx] = v;
            },
            pushNew(v) {
                VS.push(new Vertex(v, VS.length, false));
            },
            makeEdge(start, end, offsets) {
                var idx;
                if (start >= 0 && start < VS.length) {
                    if (end < start) {
                        
                    } else {
                        const vrts = [...VS];
                        const vS = VS[start];
                        const vE = VS[end];
                        const a = wv2.setVec(vE).sub(vS).normalise().rot90();
                        const d = wv1.setVec(vE).sub(vS).div(offsets.length + 1);
                        
                        VS.length = 0;
                        idx = 0;
                        while (idx <= start) {
                            VS.push(vrts[idx++]);
                        }
                        
                        const c = wv3.setVec(vS).add(d);
                        for (let i = 1; i <= offsets.length; i++) {
                            const c1 = wv4.setVec(c).addScaled(a, offsets[i-1]);
                            VS.pushNew(c1);                            
                            c.add(d);
                        }
                        idx = end;
                        while (idx < vrts.length) {
                            VS.moveVert(VS.length, vrts[idx++]);
                        }
                        
                    }
                }
            },
            mean(res = new Vec2()) {
                var i;
                const sum = wv1.zero();
                for (i = 0; i < VS.length; i++) { sum.add(VS[i]); }
                res.setVec(sum).div(VS.length);
                return res;
            },
            area(signed) {
                var area = 0, i, j = VS.length - 1;
                for (i = 0; i < VS.length; i++) {
                    const v1 = VS[i], v2 = VS[j];
                    area += (v2.x - v1.x) * (v2.y + v1.y);
                    j = i;
                }
                return (signed ? area : Math.abs(area)) / 2;
            },
            center(res = new Vec2()) {
                const area = VS.area(true);
                res.zero();
                const v = wv1, len = VS.length;
                var cross, i;
                for (i = 0; i < len; i++) {
                    const v2 = VS[(i + 1) % len];
                    v.setVec(VS[i]);
                    const cross = v.cross(v2);
                    res.add(v.add(v2).mult(cross));
                }
                res.div(6 * area);
                return res;
            },  
            inertia(mass, offset) {
                var a = 0, b = 0, i;
                const v1 = wv1, len = VS.length;
                if (offset) {
                    const v2 = wv2;
                    for (i = 0; i < len; i++) {
                        v1.setVec(VS[i]).add(offset);
                        v2.setVec(VS[(i + 1) % len]).add(offset);
                        const cross = Math.abs(v1.cross(v2));
                        a += cross * v1.dot3(v2);
                        b += cross;
                    }
                    
                } else {
                    for (i = 0; i < len; i++) {
                        v1.setVec(VS[i]);
                        const v2 = VS[(i + 1) % len];
                        const cross = Math.abs(v1.cross(v2));
                        a += cross * v1.dot3(v2);
                        b += cross;
                    }
                }
                return (mass / 6) * (a / b);
            },   
            isConvex() {
                if (VS.length >= 3) {
                    const len = VS.length;
                    var flags = 0, i, va = VS[len - 2], vb = VS[len - 1];
                    for (i = 0; i < len; i++) {
                        const vc = VS[i];
                        const z = (vb.x - va.x) * (vc.y - vb.y) - (vb.y - va.y) * (vc.x - vb.x);
                        flags |= z < 0 ? 1 : z > 0 ? 2 : 0;
                        if (flags === 3) { return false; }
                        va = vb;
                        vb = vc;
                    }
                    return flags !== 0 ? true : null;
                }
                return null;
            }, 
            translate(translation, scalar = 1) {
                const t = wv1.setVec(translation).mult(scalar);
                var i;
                for (i = 0; i < VS.length; i++) { VS[i].add(t) }
                return VS;
            },
            scale(sx, sy, origin) {
                var i;
                if (sx !== 1 || sy !== 1) { 
                    const o = origin || VS.center(wv2);
                    for (i = 0; i < VS.length; i++) {
                        const v = VS[i];
                        v.x = (v.x - o.x) * sx + o.x;
                        v.y = (v.y - o.y) * sy + o.y;
                    }
                }
                return VS;
            },
            rotate(rot, origin) {
                var i;
                if (rot !== 0) {
                    const xAx = Math.cos(rot), xAy = Math.sin(rot);
                    const ox = origin.x, oy = origin.y;
                    const len = VS.length;
                    for (i = 0; i < len; i++) {
                        const v = VS[i];
                        const x = v.x - ox;
                        const y = v.y - oy;
                        v.x = x * xAx - y * xAy + ox;
                        v.y = x * xAy + y * xAx + oy;
                    }
                }
                return VS;
            },  
            translateRotate(translation, rot, origin) {
                var i;
                const tx = translation.x, ty = translation.y;
                const xAx = Math.cos(rot), xAy = Math.sin(rot);
                const ox = origin.x, oy = origin.y;
                const len = VS.length;
                for (i = 0; i < len; i++) {
                    const v = VS[i];
                    const x = v.x + tx - ox;
                    const y = v.y + ty - oy;
                    v.x = x * xAx - y * xAy + ox;
                    v.y = x * xAy + y * xAx + oy;
                }
                return VS;
            },            
            //isConvex() {},  
            clockwiseSort() {
                const center = VS.mean(wv2);
                VS.sort((a, b) => center.angle(a) - center.angle(b));
                VS.forEach((v, i) => v.idx = i);

                return VS;
            },
            //contains(point) { },

           
            chamfer(radius, quality = -1, qualityMin = 2, qualityMax = 14) {
                radius = radius instanceof Number ? [radius] : radius || [8];
                const oVS = [...VS];
                VS.length = 0;
                const len = oVS.length;
                const va = new Vec2(), vb = new Vec2(), vc = new Vec2();
                var i = 0, precision, j;
                var vp = oVS[len - 1], v = oVS[i++];
                while (i < len) {
                    const rad = radius[i < radius.length ? i : radius.length - 1];
                    const vn = oVS[i++];
                    if (rad === 0) {
                        VS.pushNew(v);
                    } else {
                        const np = wv1.set(v.y - vp.y, vp.x - v.x).normalise();
                        const nn = wv2.set(vn.y - v.y, v.x - vn.x).normalise();
                        va.set(np.x * rad, np.y * rad);
                        vb.setVec(np).add(nn).mult(0.5).normalise().mult((2 * rad * rad) ** 0.5);
                        vc.set(v.x - vb.x, v.y - vb.y);

                        precision = quality === -1 ? (rad ** 0.32) * 1.75 : quality;
                        precision = Common.clamp(precision, qualityMin, qualityMax);
                        if (precision % 2 === 1) { precision += 1; }
                        const a = Math.acos(np.dot(nn)) / precision;
                        
                        for (j = 0; j < precision; j++) { VS.pushNew((new Vec2(va.x, va.y)).rotate(a * j).add(vc)) }
                    }
                    vp = v;
                    v = vn;
                }
                return VS;
            },
            hull() {
                var v, i;
                const oVS = VS.slice(0), upper = [], lower = [];
                oVS.sort((a, b) => {
                    const dx = a.x - b.x;
                    return dx !== 0 ? dx : a.y - b.y;
                });
                for (i = 0; i < oVS.length; i += 1) {
                    v = oVS[i];
                    while (lower.length >= 2 && lower[lower.length - 2].cross3(lower[lower.length - 1], v) <= 0) {
                        lower.pop();
                    }
                    lower.push(v);
                }
                for (i = oVS.length - 1; i >= 0; i -= 1) {
                    v = oVS[i];
                    while (upper.length >= 2 && upper[upper.length - 2].cross3(upper[upper.length - 1], v) <= 0) {
                        upper.pop();
                    }
                    upper.push(v);
                }
                upper.pop();
                lower.pop();
                VS.length = 0;
                VS.push(...upper);
                VS.push(...lower);
                return VS;
            },          
        });
        VS.setParent(body);
        return VS;
    }
    class Vertices {
        static create(points, body) {
            const vs = Verts(body), v = new Vec2();
            var i;
            for (i = 0; i < points.length; i++) {
                vs.push(new Vertex(v.setVec(points[i]), i, false));
            }
            return vs;
        };
        static fromVertices(verts, body) { 
            const vs = Verts(body);
            vs.push(...verts);
            return vs;
        }
        static fromVectors(vectors, body) { 
            const vs = Verts(body);
            var i;
            for (i = 0; i < vectors.length; i += 1) {
                vs.push(new Vertex(vectors[i], i, false));
            }
            return vs;
        };
        static fromPoints(points, body) { 
            const vs = Verts(body), v = new Vec2();
            var i;
            for (i = 0; i < points.length; i += 2) {
                vs.push(new Vertex(v.set(points[i], points[i + 1]), i / 2 | 0, false));
            }
            return vs;
        };
        static fromPath(path, body) { return Verts().fromPath(path, body); };
        static center(vertices) {
            const area = Vertices.area(vertices, true);
            const center = new Vec2();
            var cross, temp, i;
            for (i = 0; i < vertices.length; i++) {
                const j = (i + 1) % vertices.length;
                cross = Vector.cross(vertices[i], vertices[j]);
                temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross);
                center.add(temp);
            }
            return center.div(6 * area);
        }; 
        static mean(vertices) {
            var i, average = Vector.vec2Pool[0].zero();
            for (var i = 0; i < vertices.length; i++) {
                average.add(vertices[i]);
            }
            return Vector.div(average, vertices.length);
        };
        static area(vertices, signed) {
            var area = 0, i, j = vertices.length - 1;
            for (i = 0; i < vertices.length; i++) {
                area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
                j = i;
            }
            if (signed) { return area / 2; }
            return Math.abs(area) / 2;
        };
        /*static inertia(vertices, mass) {
            var numerator = 0, denominator = 0, v = vertices, cross, j, n;
            for (n = 0; n < v.length; n++) {
                j = (n + 1) % v.length;
                cross = Math.abs(Vector.cross(v[j], v[n]));
                numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
                denominator += cross;
            }
            return (mass / 6) * (numerator / denominator);
        };*/
        static translate(vertices, vector, scalar = 1) {

            const verticesLen = vertices.length;
            const transX = vector.x * scalar;
            const transY = vector.y * scalar;
            var i;
            for (i = 0; i < verticesLen; i++) {
                vertices[i].x += transX;
                vertices[i].y += transY;
            }
            return vertices;
        };
        /*static rotate(vertices, angle, point) {
            if (angle === 0) { return; }
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const pointX = point.x;
            const pointY = point.y;
            const verticesLen = vertices.length;
                
            var vertex, dx, dy, i;
            for (i = 0; i < verticesLen; i++) {
                vertex = vertices[i];
                dx = vertex.x - pointX;
                dy = vertex.y - pointY;
                vertex.x = pointX + (dx * cos - dy * sin);
                vertex.y = pointY + (dx * sin + dy * cos);
            }
            return vertices;
        };*/
        /*static contains(vertices, point) {
            const pointX = point.x;
            const pointY = point.y;
            const verticesLen = vertices.length;
            var vertex = vertices[verticesLen - 1], nextVertex;
            for (var i = 0; i < verticesLen; i++) {
                nextVertex = vertices[i];
                if ((pointX - vertex.x) * (nextVertex.y - vertex.y) + (pointY - vertex.y) * (vertex.x - nextVertex.x) > 0) {
                    return false;
                }
                vertex = nextVertex;
            }
            return true;
        };*/
        /*static scale(vertices, scaleX, scaleY, point) {
            if (scaleX === 1 && scaleY === 1) { return vertices; }
            point = point || Vertices.center(vertices);
            var vertex, delta;
            for (var i = 0; i < vertices.length; i++) {
                vertex = vertices[i];
                delta = Vector.sub(vertex, point);
                vertices[i].x = point.x + delta.x * scaleX;
                vertices[i].y = point.y + delta.y * scaleY;
            }
            return vertices;
        };*/
        /*static chamfer(vertices, radius, quality, qualityMin, qualityMax) {
            if (typeof radius === 'number') {
                radius = [radius];
            } else {
                radius = radius || [8];
            }
            quality = (typeof quality !== 'undefined') ? quality : -1;
            qualityMin = qualityMin || 2;
            qualityMax = qualityMax || 14;
            var newVertices = [];
            for (var i = 0; i < vertices.length; i++) {
                var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1],
                    vertex = vertices[i],
                    nextVertex = vertices[(i + 1) % vertices.length],
                    currentRadius = radius[i < radius.length ? i : radius.length - 1];
                if (currentRadius === 0) {
                    newVertices.push(vertex);
                    continue;
                }
                var prevNormal = Vector.normalise({
                    x: vertex.y - prevVertex.y,
                    y: prevVertex.x - vertex.x
                });
                var nextNormal = Vector.normalise({
                    x: nextVertex.y - vertex.y,
                    y: vertex.x - nextVertex.x
                });
                var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)),
                    radiusVector = Vector.mult(Common.clone(prevNormal), currentRadius),
                    midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), 0.5)),
                    scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));
                var precision = quality;
                if (quality === -1) {
                    precision = Math.pow(currentRadius, 0.32) * 1.75;
                }
                precision = Common.clamp(precision, qualityMin, qualityMax);
                if (precision % 2 === 1)
                    precision += 1;
                var alpha = Math.acos(Vector.dot(prevNormal, nextNormal)),
                    theta = alpha / precision;
                for (var j = 0; j < precision; j++) {
                    newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
                }
            }
            return newVertices;
        };*/
        static clockwiseSort(vertices) {
            const center = Vertices.mean(vertices);
            vertices.sort((vA, vB) => {
                return Vector.angle(center, vA) - Vector.angle(center, vB);
            });
            vertices.forEach((v, i) => v.idx = i);
            return vertices;
        };
        /*static isConvex(vertices) {
            var flag = 0, n = vertices.length, i, j, k, z;
            if (n < 3) { return null; }
            for (i = 0; i < n; i++) {
                j = (i + 1) % n;
                k = (i + 2) % n;
                z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
                z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);
                if (z < 0) {
                    flag |= 1;
                } else if (z > 0) {
                    flag |= 2;
                }
                if (flag === 3) { return false;  }
            }
            if (flag !== 0){
                return true;
            } else {
                return null;
            }
        };*/
        static hull(vertices) {
            var upper = [], lower = [], vertex, i;
            vertices = vertices.slice(0);
            vertices.sort((vertexA, vertexB) => {
                var dx = vertexA.x - vertexB.x;
                return dx !== 0 ? dx : vertexA.y - vertexB.y;
            });
            for (i = 0; i < vertices.length; i += 1) {
                vertex = vertices[i];
                while (lower.length >= 2 && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
                    lower.pop();
                }
                lower.push(vertex);
            }
            for (i = vertices.length - 1; i >= 0; i -= 1) {
                vertex = vertices[i];
                while (upper.length >= 2 && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
                    upper.pop();
                }
                upper.push(vertex);
            }
            upper.pop();
            lower.pop();
            return upper.concat(lower);
        };
    };
    return {Vertices, Vertex};
})();

export {Vertices};