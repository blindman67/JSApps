"use strict";
const IKSolver = (() => { 
    return {
        /*solveForward(src, dst, goal) {
            var i, j
            const len = src.length;
            Object.assign(dst[0], goal);
            for (i = 1, j = 0; i < len; i++, j++) {
                const s = src[i], d = dst[i];
                const x = dst[j].x;
                const y = dst[j].y;
                const vx = s.x - x;
                const vy = s.y - y;
                const invDist = s.length / Math.sqrt(vx * vx + vy * vy);
                Object.assign(d, s);
                d.x = x + vx * invDist;
                d.y = y + vy * invDist;      
            }
        },*/
        /*solveBackward(src, dst, goal) {
            var i, j
            const len = src.length;
            Object.assign(dst[len - 1], goal);
            for (i = len - 2, j = len - 1; i >= 0; i--, j--) {     
                const s = src[i], d = dst[i];            
                const x = dst[j].x;
                const y = dst[j].y;
                
                const vx = s.x - x;
                const vy = s.y - y;
                const invDist = s.length / Math.sqrt(vx * vx + vy * vy);
                Object.assign(d, s);
                d.x = x + vx * invDist;
                d.y = y + vy * invDist;
            }
        },*/
        solveTripple(nA, nB, nC, lenA, lenB, bend, bendMax) {
            var x1 = nA.x;
            var y1 = nA.y;    
            var x3 = nC.x;
            var y3 = nC.y;
            var vx = x3 - x1;
            var vy = y3 - y1;
            var cross = bend === 0 ? vx * (nB.y - y1) - vy *(nB.x - x1) : bend;
            
            var a = lenA;
            var b = lenB;
            var minC = 0, maxC = a + b;
            if (bend !== 0 || bendMax !== 0) {
                const aabb = a * a + b * b;
                const ab2 = 2 * a * b;            
                minC = (aabb - Math.cos(bend) * ab2) ** 0.5;
                maxC = (aabb - Math.cos(bendMax) * ab2) ** 0.5;
                
            }
            var cSqr = vx * vx + vy * vy;
            var c = cSqr ** 0.5;
            vx /= c;
            vy /= c;
            c = Math.max(minC, Math.min(maxC, c));
            var r = (a * a + c * c - b * b) / (2 * a * c);
            r = r < -1.0 ? 1.0 : r > 1.0 ? 1.0 : r;
            var B = Math.acos(r);
            var l1 = Math.cos(B) * a;
            var l2 = Math.sin(B) * a * (cross < 0 ? -1 : 1);
            
            nB.x = x1 + vx * l1 + -vy * l2;
            nB.y = y1 + vy * l1 +  vx * l2;
            a += b;
            c = c < a ? c : a;
            nC.x = x1 + vx * c;
            nC.y = y1 + vy * c;
        },        
        solve(IK, bend, bendMax) {
            if (IK === undefined) {
                return;
            } 
            if (IK.update && IK.canSolve) {                
                if (IK.nodes.length === 3) {
                    IKSolver.solveTripple(IK.nodes[0], IK.nodes[1], IK.nodes[2], IK.nodes[0].length, IK.nodes[1].length, bend, bendMax);
                    IK.update = false;
                }
            }
        }, 
        solveVerlet(IK) {
            if (IK === undefined) {
                return;
            } 
            if (IK.update && IK.canSolve) {            
                var j = 0;
                while (j < 15) {
                    var i = 0;
                    const len1 = IK.nodes.length - 1, len2 = len1 - 1;;
                    while (i < len1) {
                        const n1 = IK.nodes[i];
                        const n2 = IK.nodes[i + 1];
                        var nx = n2.x - n1.x;
                        var ny = n2.y - n1.y;
                        var len = 1 / Math.sqrt(nx * nx + ny * ny);
                        nx *= len;
                        ny *= len;
                        const l = n1.length;
                        if (i === 0) {
                            n2.x = n1.x + nx * l;
                            n2.y = n1.y + ny * l;
                            n1.update = true;
                        } else if (i === len2) {
                            //n2.x = n1.x + nx * l;
                            //n2.y = n1.y + ny * l;
                            n1.x = n2.x - nx * l;
                            n1.y = n2.y - ny * l;
                            n2.update = true;
                        } else {
                            var cx = (n2.x + n1.x) * 0.5;
                            var cy = (n2.y + n1.y) * 0.5;
                            n1.x = cx - nx * l * 0.5;
                            n1.y = cy - ny * l * 0.5;
                            n2.x = cx + nx * l * 0.5;
                            n2.y = cy + ny * l * 0.5;
                        }
                        
                        i++;
                    }
                    j++;
                }
                IK.update = false;
            }
            
            
        },
        createVerlet(funcSpr) {
            const f = funcSpr;
            if (f.IK === undefined) { f.IK = {}; log("Created Verlet solver"); }
            else {
                if (f.IK.nodes.length !== f.inputs.length) { log("Reset IK solver"); f.IK = {}; }
                else {
                    var i = 0;
                    for (const spr of f.inputs) {
                        if (f.IK.nodes[i].inSpr !== spr) {
                            f.IK = undefined;
                            break;
                        }
                        i++;
                    }
                    if (f.IK === undefined) { f.IK = {}; log("Reset IK solver"); }
                    else { return f.IK; }
                }
            }
            
            const IK = f.IK;
            const nodes = [];
            var canSolve = true;
            var i = 0;
            for (const spr of f.inputs) {
                var node = {
                    x: spr.x,
                    y: spr.y,
                    selected: false,
                    inSpr: spr,
                    line: null,
                    outSpr: null,
                    length: 0,
                    update: false,
                };
                if (spr?.attachers) { node.line = [...spr.attachers][0]; }
                else { canSolve = false; }
                if (node.inSpr === undefined) { canSolve = false; }
                nodes.push(node);
                i++;
            }
            i = 0;


            Object.assign(IK, {nodes, update: true, isIK: true, canSolve,});
        },        
        update(IK, spr) {
            if (IK === undefined) {
                return false;
            } 
            if (IK?.isIK && IK.canSolve) {
                var i = 0;
                while (i < IK.nodes.length) { 
                    if (IK.nodes[i].outSpr === spr) {
                        const n = IK.nodes[i];
                        const spriteUpdated = n.update || n.outSpr.x !== n.x || n.outSpr.y !== n.y;
                        n.outSpr.x = n.x;
                        n.outSpr.y = n.y;  
                        n.update = false;
                        return spriteUpdated;
                    }
                    i++;
                }
            }
            return false;
        },                     
    };
})();