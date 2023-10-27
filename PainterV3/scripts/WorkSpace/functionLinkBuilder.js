"use strict";
const functionLinkBuilder = (()=> {
    var warnPropertySetDanger = true;
    const wArray2 = [0,0];
    const wArray3 = [0,0,0];
    const wArray4 = [0,0,0,0];
    const getWArray2 = (a, b) => (wArray2[0] = a, wArray2[1] = b, wArray2);
    const getWArray3 = (a, b, c) => (wArray3[0] = a, wArray3[1] = b, wArray3[2] = c, wArray3);
    const getWArray4 = (a, b, c, d) => (wArray4[0] = a, wArray4[1] = b, wArray4[2] = c, wArray4[3] = d, wArray4);
    const CircleBuffer = (size = 0) => {
        var pos = 0;        
        return Object.assign([], {
            getSize() { return size; },
            next() {
                if (size > 0) { pos = (pos + 1) % size }
            },
            at(idx) {
                if (size > 0) { return this[(pos + idx) % size] }
            },
            add(item) {
                if (this.length < size) {
                    pos = this.length;
                    this.push(item);
                } else {
                    this[pos % size] = item;
                    this.next();
                }
            }
        });
    };
    const functionLink = {
        functions: (()=> {
            var val = 0, isArray = false, valLength = 0, str, strJoin = "", count = 0, min, max, vals = [], num,rgb = [],RGB={r:0,g:0,b:0};
            function isCompoundValue(v) { return Array.isArray(v) || isArray; }
            function doCompoundValue(v, start, end, f, setFunc, resultFunc, calc) {
                var i;
                if (end) {
                    isArray = false;
                    return resultFunc(f, calc);
                }
                if (count === 0) {
                    vals.length = 0;
                    vals.push(...v);
                    valLength = vals.length;
                    count++;
                } else {
                    setFunc(v);
                }
                isArray = true;
            }
            const CompoundFunctions = {
                sum(v) {
                    var i = valLength;
                    if (Array.isArray(v)) { while (i--) { vals[i] += v[i] } }
                    else { while (i--) { vals[i] += v } }
                    count++;
                },
                dif(v) {
                    var i = valLength;
                    if (count === 0) {
                        if (Array.isArray(v)) { while (i--) { vals[i] = v[i] } }
                        else { while (i--) { vals[i] = v } }
                    } else {
                        if (Array.isArray(v)) { while (i--) { vals[i] -= v[i] } }
                        else { while (i--) { vals[i] -= v } }
                    }
                    count++;
                },
                div(v) {
                    var i = valLength;
                    if (count === 0) {
                        if (Array.isArray(v)) { while (i--) { vals[i] = v[i] } }
                        else { while (i--) { vals[i] = v } }
                    } else {
                        if (Array.isArray(v)) { while (i--) { vals[i] /= v[i] } }
                        else { while (i--) { vals[i] /= v } }
                    }
                    count++;
                },
                mult(v) {
                    var i = valLength;
                    if (count === 0) {                        
                        if (Array.isArray(v)) { while (i--) { vals[i] = v[i] } }
                        else { while (i--) { vals[i] = v } }
                    } else {
                        if (Array.isArray(v)) { while (i--) { vals[i] *= v[i] } }
                        else { while (i--) { vals[i] *= v } }
                    }
                    count++;
                },
                max(v) {
                    var i = valLength;
                    if (count === 0) {
                        if (Array.isArray(v)) { while (i--) { vals[i] = v[i] } }
                        else { while (i--) { vals[i] = v } }
                    } else {
                        if (Array.isArray(v)) { while (i--) { vals[i] = Math.max(v[i], vals[i]) } }
                        else { while (i--) { vals[i] = Math.max(v, vals[i])} }
                     }
                    count++;
                },
                min(v) {
                    var i = valLength;
                    if (count === 0) {
                        if (Array.isArray(v)) { while (i--) { vals[i] = v[i] } }
                        else { while (i--) { vals[i] = v } }
                    } else {
                        if (Array.isArray(v)) { while (i--) { vals[i] = Math.min(v[i], vals[i]) } }
                        else { while (i--) { vals[i] = Math.min(v, vals[i])} }
                     }
                    count++;
                },
                vecFunctions(func) {
                    return function(v, start, end, f) {
                        if (end) { return f.value = func(vals[0], vals[1], vals[2], vals[3]) * f.scale + f.offset }
                        if (start) { vals.length = 0 }
                        else { Array.isArray(v) ? vals.push(...v) : vals.push(v) }
                    }
                },
                compound(v, start, end, f, size) {
                    if (end) {
                        f.values[0] = vals[0] * f.scale + f.offset;
                        f.values[1] = vals[1] * f.scale + f.offset;
                        size >= 3 && (f.values[2] = vals[2] * f.scale + f.offset);
                        size === 4 && (f.values[3] = vals[3] * f.scale + f.offset);
                        f.values.length = size;
                        return f.value = f.values;
                    }
                    if (start) {
                        vals.length = size;
                        vals[0] = 0;
                        vals[1] = 0;
                        size >= 3 && (vals[2] = 0);
                        size === 4 && (vals[3] = 0);
                        count = 0;
                    } else {
                        if (Array.isArray(v)) {
                            let i = 0;
                            const inSize = Math.min(size, v.length);
                            while (i < inSize) { vals[(count++) % size] += v[i++]; }
                        } else {
                            vals[(count++) % size] += v;
                        }
                    }
                },
                springResult(f) {
                    var i = 0, s = f.scale, o = f.offset;
                    f.scale = s = s < 0 ? 0 : s;
                    f.offset = o = o < 0 ? 0 : o > 1 ? 1 : o;
                    if(f.follow === undefined || !Array.isArray(f.follow)) {
                        f.follow = [];
                        f.values.length = 0;
                        while (i < valLength) {
                            f.follow[i] = 0;
                            f.values[i] = vals[i];
                            i++;
                        }
                    }
                    i = valLength;
                    while (i--) {
                        var dif = Math.abs(vals[i] - f.values[i]);
                        s = dif <= 10 ? s * (dif / 10) : s;
                        f.follow[i] = (f.follow[i] += Math.sign(vals[i] - f.values[i]) * s) * (1 - o);
                        f.values[i] += f.follow[i];
                    }
                    return f.value = f.values;
                },
                chaseResult(f) {
                    var i = 0;
                    var s = f.scale;
                    var o = f.offset;
                    s = s < 0 ? 0 : s > 1 ? 1 : s;
                    o = o < 0 ? 0 : o > 1 ? 1 : o;
                    if(f.follow === undefined || !Array.isArray(f.follow)) {
                        f.follow = [];
                        f.values.length = 0;
                        while (i < valLength) {
                            f.follow[i] = 0;
                            f.values[i] = vals[i];
                            i++;
                        }
                    }
                    i = valLength;
                    while (i--) {
                        f.follow[i] = ((f.follow[i] += (vals[i] - f.values[i]) * s) * o);
                        f.values[i] += f.follow[i];
                    }
                    return f.value = f.values;
                },
                delayResult(f) {
                    var i, size = Math.floorAbs(f.offset) + 1;
                    if(f.follow === undefined || !Array.isArray(f.follow) || size !== f.follow.getSize()) {
                        
                        if (size > 100) {
                            log.warn("Delay function link max delay: " + 100);
                            size = f.offset = 99;
                        }
                        f.follow = CircleBuffer(size);
                        while (f.follow.length < size) { f.follow.add([...vals]); }
                        f.values.length = i = 0;
                        while (i < valLength) {
                            f.values[i] = vals[i];
                            i++;
                        }
                    }
                    const old = f.follow.at(0);
                    f.follow.next();
                    i = valLength;
                    while (i--) {
                        f.values[i] = old[i];
                        old[i] = vals[i];
                    }
                    return f.value = f.values;
                },                
                accResult(f) {
                    var i = valLength;
                    if (f.values.length !== vals.length) {
                        f.values.length = 0;
                        while (i--) { f.values.push(0); }
                    }
                    i = valLength;
                    while (i--) { f.values[i] += vals[i] * f.scale + f.offset  }
                    return f.value = f.values;
                },
                ecurveResult(f) {
                    var i = valLength;
                    while (i--) { vals[i] = eCurve(vals[i], f.offset) + f.scale  }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                scurveResult(f) {
                    var i = valLength;
                    while (i--) { vals[i] = sCurve(vals[i], f.offset) + f.scale  }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                sqrWaveResult(f) {
                    var i = valLength;
                    while (i--) {
                        vals[i] = Math.abs(vals[i] * f.scale + f.offset) % 1;
                        vals[i] = vals[i] < 0.5 ? 0 : 1;
                    }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                meanResult(f) {
                    var i = valLength;
                    while (i--) {  vals[i] = (vals[i] / count) * f.scale + f.offset; }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                powResult(f) {
                    var i = valLength;    
                    while (i--) { vals[i] = (vals[i] === 0 && f.scale < 0 ? 0 : Math.abs(vals[i]) ** f.scale) }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                modResult(f) {
                    var i = valLength;
                    const range = f.scale - f.offset;
                    if (range === 0) { while (i--) { vals[i] = f.offset } }
                    else { while (i--) { vals[i] = (vals[i] % range + range) % range + f.offset } }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                triangleWaveResult(f) {
                    var i = valLength;
                    const range = f.scale - f.offset;                    
                    if (range === 0) { while (i--) { vals[i] = f.offset } }
                    else { 
                        const hRange = range * 0.5;                 
                        while (i--) { 
                            let vv = (vals[i] % range + range) % range;
                            vals[i]  = (vv > hRange ? range - vv : vv) + f.offset;
                        } 
                    }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                clampResult(f) {
                    var i = valLength;
                    while (i--) { vals[i] = vals[i] < f.offset ? f.offset : vals[i] > f.scale ? f.scale : vals[i]; }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                result(f) {
                    var i = valLength;
                    while (i--) { vals[i] = vals[i] * f.scale + f.offset }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                simpleResult(f, func) {
                    var i = valLength;
                    while (i--) { vals[i] = func(vals[i]) * f.scale + f.offset; }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
                simpleResultAll(f, func) {
                    var i = valLength;
                    while (i--) { vals[i] = func(vals[i] * f.scale + f.offset); }
                    f.values.length = 0;
                    f.values.push(...vals);
                    return f.value = f.values;
                },
            };
            return {
                system: {
                    rand(f) { return f.value = Math.random() * f.scale + f.offset },
                    acc(f) { return f.value += f.offset },
                    default(f) { return f.value },
                },
                reset(f) {
                    if (f.follow !== undefined) { f.follow = undefined }
                    //if (f.prev !== undefined) { f.prev = undefined }
                    if (f.acc !== undefined) { f.acc = undefined }
                    if (f.IK !== undefined) { f.IK = undefined; }
                    f.blocks = 0;
                    f.values.length = 0;
                    f.value = 0;
                    if (f.type === "cap") {
                        f.cap = true
                        f.resetOnChange = true;
                    } else {
                        if(f.cap !== undefined) { f.cap = undefined }
                        if(f.resetOnChange !== undefined) { f.resetOnChange = undefined }
                        if(f.captureList !== undefined) {
                            f.captureList = undefined;
                            f.outputs.forEach(spr => {
                                if(spr.captureList !== undefined) { delete spr.captureList }
                            });
                        }
                    }
                },
                rgb(v, start, end, f) { // ?
                     if (end) {
                        if(count === 1) {
                            rgb[2] = rgb[1] = rgb[0];
                            count =1;
                        } else if(count === 2){
                            rgb[0] = rgb[1] = rgb[2] = rgb[0] + rgb[1];
                            count = 2;
                        } else {
                            count = Math.ceil(count / 3);
                        }
                        RGB.r = (Math.unit(rgb[0] / count * f.scale + f.offset) * Math.W16) ** 0.5 | 0;
                        RGB.g = (Math.unit(rgb[1] / count * f.scale + f.offset) * Math.W16) ** 0.5 | 0;
                        RGB.b = (Math.unit(rgb[2] / count * f.scale + f.offset) * Math.W16) ** 0.5 | 0;
                        return f.value = RGB;
                    }
                    if (start) { rgb[0] = rgb[1] = rgb[2] = 0, count = 0 }
                    else {
                        if(v.g !== undefined) {
                            rgb[(count++) % 3] += v.r * v.r / Math.W16;
                            rgb[(count++) % 3] += v.g * v.g / Math.W16;
                            rgb[(count++) % 3] += v.b * v.b / Math.W16;
                        } else {
                            rgb[(count++) % 3] += v;
                        }
                    }
                },
				A(v, start, end, f) { if (end) { return 0 } },
                IK(v,start,end,f) {
                    if(end) {
                        if (f.IK) {
                            if (f.IK.canSolve) { IKSolver.solve(f.IK, f.offset, f.scale); }
                            return f.IK;
                        }
                        return;
                    }
                    if(start) {
                        IKSolver.createVerlet(f);
                        var i = 0;
                        var canSolve = true;
                        while (i < f.IK.nodes.length) {
                            const n = f.IK.nodes[i];
                            n.outSpr = f.outputs[i];
                            if (!(n.inSpr && n.outSpr && ((i < f.IK.nodes.length -1 && n.line) || (i === f.IK.nodes.length -1)))) {
                                canSolve = false;
                            }
                            i++;
                        }
                        f.IK.canSolve = canSolve;
                        count = 0;
                    } else {
                        if (f.IK && f.IK.canSolve) {
                            const spr = v;
                            const n = f.IK.nodes[count];
                            if (n) {
                                if (n.x !== spr.x || n.y !== spr.y || (n.line && n.length !== n.line.w * n.line.sx)) {
                                    if (n.line) {  n.length = n.line.w * n.line.sx; }
                                    n.x = spr.x;
                                    n.y = spr.y;
                                    f.IK.update = true;
                                }
                            }
                        }
                        count++;
                    }
                },
                Vrl(v, start, end, f) {
                    if(end) {
                        if (f.IK) {
                            if (f.IK.canSolve) { IKSolver.solveVerlet(f.IK); }
                            return f.IK;
                        }
                        return;
                    }
                    if(start) {
                        IKSolver.createVerlet(f);
                        var i = 0;
                        var canSolve = true;
                        while (i < f.IK.nodes.length) {
                            const n = f.IK.nodes[i];
                            n.outSpr = f.outputs[i];
                            if (!(n.inSpr && n.outSpr && ((i < f.IK.nodes.length -1 && n.line) || (i === f.IK.nodes.length -1)))) {
                                canSolve = false;
                            }
                            i++;
                        }
                        f.IK.canSolve = canSolve;
                        count = 0;
                    } else {
                        if (f.IK && f.IK.canSolve) {
                            const spr = v;
                            const n = f.IK.nodes[count];
                            if (n) {
                                if (n.x !== spr.x || n.y !== spr.y || (n.line && n.length !== n.line.w * n.line.sx)) {
                                    if (n.line) {  n.length = n.line.w * n.line.sx; }
                                    n.x = spr.x;
                                    n.y = spr.y;
                                    f.IK.update = true;
                                }
                            }
                        }
                        count++;
                    }
                },
                acc(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.accResult);
                    } else {
                        if (end) { return f.value += val * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },
                sum(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.result);
                    } else {
                        if (end) { return f.value = val * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },
                dif(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.dif, CompoundFunctions.result);
                    } else {
                        if (end) { return f.value = val * f.scale + f.offset; }
                        if (start) { val = count = 0 }
                        else { val =  count === 0 ? v : val - v; count++ }
                    }
                },
                div(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.div, CompoundFunctions.result);
                    } else {
                        if (end) {
                            return f.value = val  * f.scale + f.offset
                        }
                        if (start) { val = count = 0 }
                        else { val = count === 0 ? v : val / v; count++ }
                    }
                },
                mult(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.mult, CompoundFunctions.result);
                    } else {
                        if (end) {  return f.value = val  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val = count === 0 ? v : val * v; count++ }
                    }
                },
                flr(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResultAll, Math.floor);
                    } else {
                        if (end) { return f.value = Math.floor(val * f.scale + f.offset) }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                rnd(v, start, end, f) {
                     if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResultAll, Math.round);
                    } else {
                        if (end) { return f.value =  Math.round(val * f.scale + f.offset) }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                chase(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.chaseResult);
                    } else {
                        if (end) {
                            if(f.follow === undefined) {
                                f.follow = 0;
                                f.value = val;
                            }
                            var s = f.scale;
                            var o = f.offset;
                            s = s < 0 ? 0 : s > 1 ? 1 : s;
                            o = o < 0 ? 0 : o > 1 ? 1 : o;
                            f.follow = ((f.follow += (val - f.value) * s) * o);
                            f.value += f.follow
                            return f.value;
                        }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                spring(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.springResult);
                    } else {
                        if (end) {
                            if(f.follow === undefined) {
                                f.follow = 0;
                                f.value = val;
                            }
                            var s = f.scale;
                            var o = f.offset;
                            f.scale = s = s < 0 ? 0 : s;
                            f.offset = o = o < 0 ? 0 : o > 1 ? 1 : o;
                            var dif = Math.abs(val - f.value);
                            s = dif <= 10 ? s * (dif / 10) : s;
                            f.follow = (f.follow += Math.sign(val - f.value) * s) * (1 - o);
                            f.value += f.follow
                            return f.value;
                        }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                ecurve(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.ecurveResult);
                    } else {
                        if (end) { return f.value = eCurve(val, f.offset) + f.scale }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                scurve(v, start, end, f) {
                     if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.scurveResult);
                    } else {
                        if (end) { return f.value = sCurve(val, f.offset) + f.scale }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                sqrWave(v, start, end, f) {
                     if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.sqrWaveResult);
                    } else {
                        if (end) {
                            val = Math.abs(val * f.scale + f.offset) % 1;
                            return f.value = val < 0.5 ? 0 : 1;
                        }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                pulseWave(v, start, end, f) { // ?
                    if (end) {
                        if (count === 1) {
                            val = Math.abs(val * f.scale + f.offset) % 1;
                            return f.value = val < 0.5 ? 0 : 1;
                        }
                        num = Math.abs(vals[0] * f.scale + f.offset) % 1;
                        return f.value = num < Math.abs(val % 1) ? 1 : 0;
                    }
                    if(start) { count = 0; return }
                    if(count === 0) {
                        val = v;
                        vals[0] = 0;
                        count = 1;
                    } else { vals[0] += v }
                    count++;
                },
                delay(v, start, end, f) { 
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.delayResult);
                    } else {     
                        if (end) {
                            let size = Math.floorAbs(f.offset) + 1;
                            if (f.follow === undefined || !Array.isArray(f.follow) || size !== f.follow.getSize()) {
                                if (size > 100) {
                                    log.warn("Delay function link max delay: " + 100);
                                    size = f.offset = 99;
                                }
                                f.follow = CircleBuffer(size);
                                while (f.follow.length < size) { f.follow.add([val]); }
                                f.values.length = 0;
                                vals[0] = val;
                            }
                            const old = f.follow.at(0);
                            f.follow.next();
                            f.values[0] = old[0];
                            old[0] = val;
                            return f.value = f.values[0];
                        }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },
                cmpEq(v, start, end, f) {
                    if (end) { 
                        isArray = false;
                        return f.value = count === 1 ? 1 : 0 
                    }
                    if (start) { count = 0 }
                    else if(count === 0) {
                        count = 1;
                        if (isCompoundValue(v)) {
                            vals.length = 0;
                            vals.push(...v);
                            valLength = vals.length;
                            isArray = true;
                        } else { val = v; }
                    } else if(count === 1) {
                        if (isArray) {
                            let i = valLength;
                            const arr = Array.isArray(v);
                            while (i--) {
                                if (vals[i] !== (arr ? v[i] : v)) { count = 2; break }
                            }
                        } else { count = val === v ? 1 : 2; }
                    }
                },
                cmpGtLt(v, start, end, f) { // ?
                    if (end) { return f.value = count === 1 ? 1 : 0 }
                    if (start) { count = 0 }
                    else if(count === 0) {
                        count = 2;
                        val = v;
                    } else if(count > 0) {
                        count = (f.scale > 0 && val < v) || (f.scale < 0 && val > v) ? 1 : count;
                    }
                },
                pow(v, start, end, f) { 
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.powResult);
                    }  else {
                        if (end) { return f.value = val === 0 && f.scale < 0 ? 0 : Math.abs(val) ** f.scale } 
                        if (start) { val = count = 0 }
                        else { val += v; count ++ }
                    }
                },                
                mean(v, start, end, f) {
                     if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.meanResult);
                    } else {
                        if (end) { return f.value = (val / count) * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },
                abs(v, start, end, f) {
                     if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.abs);
                    } else {
                        if (end) { return f.value = Math.abs(val) * f.scale + f.offset }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                min(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.min, CompoundFunctions.result);
                    } else {
                        if (end) { return f.value = min  * f.scale + f.offset }
                        if (start) {  min = Infinity; val = count = 0  }
                        else { min = Math.min(v, min) }
                    }
                },
                max(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.max, CompoundFunctions.result);
                    } else {
                        if (end) { return f.value = max  * f.scale + f.offset }
                        if (start) {  max = -Infinity; val = count = 0  }
                        else { max = Math.max(v, max) }
                    }
                },
                sqr(v, start, end, f) {
                     if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.sqr);
                    } else {
                        if (end) { return f.value = Math.abs(val * val) * f.scale + f.offset }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                sqrt(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.sqrtAbs);
                    } else {
                        if (end) { return f.value = Math.sqrt(Math.abs(val)) * f.scale + f.offset }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                sin(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.sin);
                    } else {
                        if (end) { return f.value = Math.sin(val)  * f.scale + f.offset }
                        if (start) { val = 0; count = 0 }
                        else { val += v;  }
                    }
                },
                cos(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.cos);
                    } else {
                        if (end) { return f.value = Math.cos(val)  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                asin(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.asinc);
                    } else {
                        if (end) { return f.value = Math.asinc(val)  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                acos(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.acosc);
                    } else {
                        if (end) { return f.value = Math.acosc(val)  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                sign(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.sign);
                    } else {
                        if (end) { return f.value = Math.sign(val)  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                tan(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.tan);
                    } else {
                        if (end) { return f.value = Math.tan(val)  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                tan2(v, start, end, f) { // AKA direction
                    if (end) {
                        if(vals.length < 2) { return 0 + f.offset }
                        return f.value = Math.atan2(vals[1], vals[0])  * f.scale + f.offset;
                    }
                    if (start) { vals.length = 0 }
                    else { Array.isArray(v) ? vals.push(...v) : vals.push(v); }
                },
                hypot(v, start, end, f) {
                    if (end) { return f.value = Math.hypot(...vals)  * f.scale + f.offset }
                    if (start) { vals.length = 0 }
                    else { Array.isArray(v) ? vals.push(...v) : vals.push(v) }
                },
                normalize(v, start, end, f) {
                    if (end) {
                        var i = 0;
                        const invLen = f.scale / Math.hypot(...vals);
                        f.values.length = vals.length;
                        while (i < vals.length) { f.values[i] = vals[i] * invLen + f.offset;  i++;  }
                        return f.value = f.values;
                    }
                    if (start) { vals.length = 0 }
                    else { Array.isArray(v) ? vals.push(...v) : vals.push(v); }
                },
                polar(v, start, end, f) {
                    if (end) {
                        f.values.length = 2;
                        f.values[0] = Math.cos(val) * f.scale + f.offset;
                        f.values[1] = Math.sin(val) * f.scale + f.offset;
                        return f.value = f.values;
                    }
                    if (start) { val = count = 0 }
                    else { val += v;  }
                },
                pair(v, start, end, f) { return CompoundFunctions.compound(v, start, end, f, 2); },
                trip(v, start, end, f) { return CompoundFunctions.compound(v, start, end, f, 3); },
                quad(v, start, end, f) { return CompoundFunctions.compound(v, start, end, f, 4); },
                vdot: CompoundFunctions.vecFunctions(Math.vecDot2d),
                vcross: CompoundFunctions.vecFunctions(Math.vecCross2d),
                uvdot: CompoundFunctions.vecFunctions(Math.uVecDot2d),
                uvcross: CompoundFunctions.vecFunctions(Math.uVecCross2d),
                svdot: CompoundFunctions.vecFunctions(Math.sVecDot2d),
                svcross: CompoundFunctions.vecFunctions(Math.sVecCross2d),
                vAng: CompoundFunctions.vecFunctions(Math.angleVec2d),
                clamp(v,start,end,f) { 
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.clampResult);
                    } else {
                        if (end) { return f.value = val < f.offset ? f.offset : val > f.scale ? f.scale : val; }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },
                mod(v,start,end,f) { 
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.modResult);
                    } else {
                        if (end) { 
                            const range = f.scale - f.offset;
                            return f.value = range !== 0 ? (val % range + range) % range + f.offset: f.offset; }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },
                triangleWave(v, start, end, f) { 
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.triangleWaveResult);
                    } else {
                        if (end) { 
                            const range = f.scale - f.offset;
                            if (range === 0) { return f.value = f.offset; }
                            const hRange = range * 0.5;
                            val = (val % range + range) % range;
                            val = val > hRange ? range - val : val;
                            return f.value = val + f.offset; 
                        }
                        if (start) { val = count = 0 }
                        else { val += v }
                    }
                },               
                toUnit(v,start,end,f) { // ?
                    if (end) {
                        if(num === undefined) {
                            if(Math.abs(f.scale) < 0.01) {
                                val = (val - f.offset) /  (f.scale < 0 ? -0.01 : 0.01);
                            } else {
                                val = (val - f.offset) /  f.scale;
                            }
                            return f.value = val  < 0 ? 0 : num > 1 ? 1 : val;
                        }
                        if(Math.abs(val) < 0.01) {
                            num = (num * f.scale + f.offset) / (val < 0 ? -0.01 : 0.01);
                        } else {
                            num = (num * f.scale + f.offset) / val;
                        }
                        return f.value = num  < 0 ? 0 : num > 1 ? 1 : num;
                    }
                    if (start) { val = 0; num = undefined; count = 0 }
                    else if(count === 0) {
                        count = 1;
                        val = v;
                    } else {
                        (num === undefined && (num = v)) || (num += v);
                    }
                },
                rand(v, start, end, f) {
                    if (isCompoundValue(v)) {
                        return doCompoundValue(v, start, end, f, CompoundFunctions.sum, CompoundFunctions.simpleResult, Math.rand);
                    } else {
                        if (end) { return f.value = Math.rand(val)  * f.scale + f.offset }
                        if (start) { val = count = 0 }
                        else { val += v;  }
                    }
                },
                select(v,start,end,f) { // ?
                    if(end) { return f.value = val * f.scale + f.offset }
                    if(start) { count = 0 ; return }
                    if(count === 0) {
                        num = Math.floor(v * (f.inputs.length - 1)) + 1;
                    } else if(count === num || (count === 1 && num < count) || num > count) {
                        val = v;
                    }
                    count++;
                },
                swch(v,start,end,f) { // ?
                    if(end) {
                        if (val > 1 || val <0) {
                            f.acc = 1;//Math.floor(val);
                            f.idx = (f.idx + (val > 1 ? 1 : count - 2)) % (count - 1);
                            f.val = vals[f.idx];
                        }
                        return f.value = f.val * f.scale + f.offset;
                    }
                    if(start) {
                        count = 0;
                        return;
                    }
                    if(count === 0) {
                        if(f.acc === undefined) { f.acc = Math.floor(v); f.idx = 0; f.val = 0 }
                        val = v;
                    } else {
                        vals[count - 1] = v;
                    }
                    count++;
                },
                trig(v,start,end,f) { // ?
                    if(end) {
                        if (val < 0) { return f.value = num * f.scale  + f.offset }
                        return f.value =  undefined;
                    }
                    if(start) {
                        count = 0;
                        val = 0;
                        num = 0;
                        return;
                    } else if(count === 0) {
                        val = v;
                        count = 1;
                    } else { num += v }
                },
                name(v,start,end,f) { // ?
                    if (warnPropertySetDanger) {
                        warnPropertySetDanger = false;
                        log.warn("The Named property function link 'Name' can crash painter if misused.");
                        log.warn("Only use this function link type if you know what you are doing!");
                    }
                    if(end) { return f.value = val; }
                    if(start) {
                        count = 0;
                        if (!f.value.text) { f.value = {} }
                        val = f.value;
                        return;
                    }
                    if(count === 0) {
                        count = 1;
                        val.text = v.text;
                    } else if (count === 1) {
                        count = 2;
                        val.value = v;
                    }
                },
                cap(v,start,end,f) { // ?
                    if(end) {
                        if(f.cap === true) {
                            f.resetOnChange = true;
                            f.cap = false;
                            f.value = f.captureList.size;
                            return f.captureList;
                        }
                        return f.value = f.captureList ?  f.captureList.size : 0;
                        return f.value;
                    }
                    if(start && f.cap === true) {
                        if(f.captureList === undefined) {
                            f.captureList = new Set(f.inputs);
                        } else {
                            f.captureList.clear();
                            for(const spr of f.inputs) { f.captureList.add(spr) }
                        }
                    }
                },
                map(v,start,end,f) { // ?
                    if(end) {
                        return f.value =  val * f.scale  + f.offset;
                    }
                    if (start) {
                        count = 0;
                        val = 0;
                        return;
                    }
                    if (count === 0) {
                        if (v.text !== undefined) {
                            if (!f.map) {
                                f.map = new Map();
                            }
                            if (f.map && f.map.text !== v.text) {
                                f.map.clear();
                                f.map.text = v.text;
                                f.map.lastValue = 0;
                                const t = v.text.replace(/\].*?\[/g,",").split("[")[1].split("]")[0];
                                t.split(",").forEach(str => {
                                    const [key, val] = str.split(":");
                                    f.map.set(Math.floor(Number(key)), Number(val));
                                });
                            }
                        }
                        count = 1;
                        return;
                    }
                    if (f.map) {
                        v = Math.floor(v);
                        if (f.map.has(v)) {
                            val += f.map.lastValue = f.map.get(v);
                        } else if (count === 1) {
                            val += f.map.lastValue;
                        }
                        count ++;
                    }
                },
                obj(v,start,end,f) { // ?
                    if (end) { return f.value = val }
                    if (start) { }
                    else { val = v }
                },
                spr(v,start,end,f) { // ?
                    if(end) {
                        if(f.cap === true) {
                            f.resetOnChange = true;
                            f.cap = false;
                            f.value = f.spriteSet.size;
                            f.value.asArray = [...f.spriteSet.values()];
                            return f.spriteSet;
                        }
                        return f.value = f.spriteSet ?  f.spriteSet.size : 0;
                        return f.value;
                    }
                    if(start && f.cap === true) {
                        if(f.spriteSet === undefined) {
                            f.spriteSet = new Set(f.inputs);
                        } else {
                            f.spriteSet.clear();
                            for(const spr of f.inputs) { f.spriteSet.add(spr) }
                        }
                    }
                },
            };
        })(),
        input: {
            names : {
                none:[""],
                v:["Val"],
                v2:["Pair"],
                v3:["Tri"],
                v4:["Quad"],
                xy:["XY"],
                x:["X"],
                y:["Y"],
                rxy:["Rot XY"],
                rx:["Rot X"],
                ry:["Rot Y"],
                sxy:["Scale XY"],
                sx:["Scale X"],
                sy:["Scale Y"],
                swh:["Size WH"],
                w:["Width"],
                h:["Height"],
                iWH:["Image width height"], 
                iW:["Image width"],
                iH:["Image height"],
                a:["Alpha"],
                R:["Red"],
                G:["Green"],
                B:["Blue"],
                RGB:["Color"],
                axy:["Atch XY"],
                ax:["Atch X"],
                ay:["Atch Y"],
                txtN:["TextName"],
                text:["Text"],
                subSpr:["Sub sprite idx"],
                img:["Img Seq"],
                mxy:["Mouse XY"],
                mx:["Mouse X"],
                my:["Mouse Y"],
                mOver:["M Ovr"],
                f:["A Frame"],
                t:["A Time"],
                gt:["G Time"],
                fo:["fL Offset"],
                fs:["fL Scale"],
                pi:["PI"],
                al:["Anim Len"],
                /*first:["first"],
                second:["second"],
                third:["third"],
                forth:["forth"],*/
                shpR:["Radius"],
                shpI:["Inner"],
                shpS:["Count"],
                shpA:["Val A"],
                shpB:["Val B"],
                shpC:["Val C"],
                shpD:["Val D"],
                asf:["Anim Start"],
                aef:["Anim End"],
                spr:["Capture"],
                sel:["IsSelected"],
                pixel:["Pixel"],
                vXY:["View XY"],
                vX:["View X"],
                vY:["View Y"],
                vCXY:["View center XY"],
                vCX:["View center X"],
                vCY:["View center Y"],
                vWH:["View WH"],
                vW:["View W"],
                vH:["View H"],
                vS:["View Scale"],
                palC:["Pallet Count"],
                /*SVol:["Sound Volume"],
                SOff:["Sound Play Offset"],
                SRate:["Sound rate Scale"],
                SLev:["Sound level"],
                SLevM:["Sound level mean"],*/
				An:["Sprite anim list"],
                Vrl:["Verlets"],
            },
            system: {
                v2() { return getWArray2(0, 0) },
                v3() { return getWArray3(0, 0, 0) },
                v4() { return getWArray4(0, 0, 0, 0) },
                f() { return animation.frame },
                al() { return animation.length + 1 },
                asf() { return animation.startTime },
                aef() { return animation.endTime },
                t() { return animation.seconds },
                gt() { return globalTime / 1000 },
                v() { return 0 },
                pi() { return Math.PI },
                R() { return colours.mainColor.r * colours.mainColor.r / Math.W16 },
                G() { return colours.mainColor.g * colours.mainColor.g  / Math.W16 },
                B() { return colours.mainColor.b * colours.mainColor.b  / Math.W16 },
                RGB() { return colours.mainColor },
                vXY() {  return getWArray2(viewTopLeft.x, viewTopLeft.y) },
                vX() {  return viewTopLeft.x },
                vY() {  return viewTopLeft.y },
                vCXY() {  return getWArray2(viewCenter.x, viewCenter.y) },
                vCX() {  return viewCenter.x },
                vCY() {  return viewCenter.y },
                vWH() {  return getWArray2(viewSize.x, viewSize.y) },
                vW() {  return viewSize.x },
                vH() {  return viewSize.y },
                vS() {  return viewScale },
            },
            sprite: {
                v:  Object.assign(f => f.type.functionLink ? f.fLink.value : 0, {_fLinkSafe: true}),
                v2: Object.assign(f => f.type.functionLink ? 
                    (f.fLink.values.length ? 
                        getWArray2(f.fLink.values[0] ?? 0, f.fLink.values[1] ?? 0) : 
                        getWArray2(f.fLink.value, f.fLink.value)
                    ) : getWArray2(0, 0)
                , {_fLinkSafe: true}),
                v3: Object.assign(f => f.type.functionLink ? 
                    (f.fLink.values.length ? 
                        getWArray3(f.fLink.values[0] ?? 0, f.fLink.values[1] ?? 0, f.fLink.values[2] ?? 0) : 
                        getWArray3(f.fLink.value, f.fLink.value, f.fLink.value)
                    ) : getWArray3(0, 0, 0)
                , {_fLinkSafe: true}),
                v4: Object.assign(f => f.type.functionLink ? 
                    (f.fLink.values.length ? 
                        getWArray4(f.fLink.values[0] ?? 0, f.fLink.values[1] ?? 0, f.fLink.values[2] ?? 0, f.fLink.values[3] ?? 0) : 
                        getWArray4(f.fLink.value, f.fLink.value, f.fLink.value, f.fLink.value)
                    ) : getWArray4(0, 0, 0, 0)
                , {_fLinkSafe: true}),
                xy(f) { return getWArray2(f.x, f.y) },
                x(f) { return f.x },
                y(f) { return f.y },
                rxy(f) { return getWArray2(f.rx,f.ry) },
                rx(f) { return f.rx },
                ry(f) { return f.ry},
                sxy(from) { return getWArray2(from.sx, from.sy) },
                sx(from) { return from.sx },
                sy(from) { return from.sy },
                swh(from) { return getWArray2(from.w *from.sx, from.h *from.sy) },
                w(from) { return from.w * from.sx },
                h(from) { return from.h * from.sy },
                iWH(from){ return (from.type.image ? (from.type.subSprite ? getWArray2(from.subSprite.w, from.subSprite.h) : getWArray2(from.image.w, from.image.h)) : getWArray2(from.w, from.h)) },
                iW(from) { return (from.type.image ? (from.type.subSprite ? from.subSprite.w : from.image.w) : from.w) },
                iH(from) { return (from.type.image ? (from.type.subSprite ? from.subSprite.h : from.image.h) : from.h) },
                a(from) { return from.a },
                R(from) { return from.rgb.r2 / Math.W16 },
                G(from) { return from.rgb.g2 / Math.W16 },
                B(from) { return from.rgb.b2 / Math.W16 },
                RGB(from) { return from.rgb },
                axy(from) { return from.type.attached ? getWArray2(from.attachment.x, from.attachment.y) : getWArray2(0, 0) },
                ax(from) { return from.type.attached ? from.attachment.x : 0},
                ay(from) { return from.type.attached ? from.attachment.y : 0},
                mxy(from) { return getWArray2(from.key.lx, from.key.ly) },
                mx(from) { return from.key.lx },
                my(from) { return from.key.ly },
                pixel(from) {
                    if (from.type.image && from.image.isDrawable && from.key.over) {
                        const dat = from.image.ctx.getImageData(from.key.lx | 0, from.key.ly | 0, 1, 1).data;
                        return new Sprite.RGB(dat[0],dat[1],dat[2]);
                    }
                    return new Sprite.RGB(0,0,0);
                },
                palC(from) { return from.pallet?.length ?? 0 },
                mOver(from) { return from.key.over ? 1 : 0 },
                shpR(from) { return from.type.shape ? from.shape.radius : 0 },
                shpI(from) { return from.type.shape ? from.shape.inner : 0 },
                shpS(from) { return from.type.shape ? from.shape.sides : 1 },
                shpA(from) { return from.type.shape ? from.shape.valA / 4 * Math.TAU : 0 },
                shpB(from) { return from.type.shape ? from.shape.valB / 4 *  Math.TAU : 0 },
                shpC(from) { return from.type.shape ? from.shape.valC : 0 },
                shpD(from) { return from.type.shape ? from.shape.valD : 0 },
                txtN(from) {
                    if (from.type.text === true) {
                        const  n = new Number(NaN);
                        n.text = from.textInfo.text;
                        return n;
                    }
                    const  n = new Number(NaN);
                    n.text = "";
                    return n;
                   
                },
                text(from) {
                    if (from.type.text === true) {
                        const textNum = new Number(from.textInfo.text);
                        textNum.text = from.textInfo.text;
                        return textNum;
                    } else {
                        const textNum = new Number(0);
                        textNum.text = "0";
                        return textNum;
                    }
                },
				subSpr(from) {return from.type.subSprite ? from.subSpriteIdx : 0 },
                img(from) { return from.type.imgSequence ? from.imageIdx : 0 },
                fo(from) { return from.type.functionLink ? from.fLink.offset : 0 },
                fs(from) { return from.type.functionLink ? from.fLink.scale : 1 },
                spr(from) { return 0 },
                sel(from) { return from.selected ? 1 : 0 },
				/*SVol(from) { return from.type.sound ? from.sound.volume : 0 },
				SOff(from) { return from.type.sound ? from.sound.startOffset : 0 },
				SRate(from) { return from.type.sound ? from.sound.rateScale : 0 },
				SLev(from) { return from.type.sound && from.sound.pos >= 0 ? from.image.desc.vBuf[from.sound.pos * 2] : 0 },
				SLevM(from) { return from.type.sound && from.sound.pos >= 0 ? from.image.desc.vBuf[from.sound.pos * 2 + 1] : 0 },*/
				An(from) { return 0 },
                Vrl(from) { return from },
            }
        },
        output: {
            names : {
                none:[""],
                v:["Val"],
                xy:["XY"],
                x:["X"],
                y:["Y"],
                r:["Rot"],
                rxy:["Rot XY"],
                rx:["Rot X"],
                ry:["Rot Y"],
                sxy:["Scale XY"],
                sx:["Scale X"],
                sy:["Scale Y"],
                swh:["Size WH"],
                w:["Width"],
                h:["Height"],
                //swh:["Size"],
                a:["Alpha"],
                R:["Red"],
                G:["Green"],
                B:["Blue"],
                RGB:["Color"],
                axy:["Atch XY"],
                ax:["Atch X"],
                ay:["Atch Y"],
                text:["Text"],
                txtN:["TextName"],
                img:["Img seq"],
                subSpr:["Sub sprite idx"],
                fo:["fL Offset"],
                fs:["fL Scale"],
                fbO:["fL Block Out"],
                fbI:["fL Block In"],
                mxy:["Mouse XY"],
                mx:["Mouse X"],
                my:["Mouse Y"],
                shpR:["Radius"],
                shpI:["Inner"],
                shpS:["Count"],
                shpA:["Val A"],
                shpB:["Val B"],
                shpC:["Val C"],
                shpD:["Val D"],
                spr:["SprList"],
                cap:["CapList"],
				/*SVol:["Sound Volume"],
                SOff:["Sound Play Offset"],
                SRate:["Sound rate Scale"],*/
                Vrl:["Verlets"],
            },
            system: { },
            sprite: {
                v(v, to) { return false },
                xy(v, to) { to.x = v[0]; to.y = v[1]; return true},
                x(v, to) { to.x = Array.isArray(v) ? v[0] : v; return true},
                y(v, to) { to.y = Array.isArray(v) ? v[1] : v; return true},
                r(v, to) { const roff = to.ry - to.rx; to.rx = v; to.ry = v + roff; return true;},
                rxy(v, to) { Array.isArray(v) ? (to.rx = v[0], to.ry = v[1]) : functionLink.output.sprite.r(v, to); return true},
                rx(v, to) { to.rx = Array.isArray(v) ? v[0] : v; return true},
                ry(v, to) { to.ry = Array.isArray(v) ? v[1] : v; return true},
                sxy(v, to) { Array.isArray(v) ? to.setScale(v[0], v[1]) : to.setScale(v, v); return false},
                sx(v, to) { to.setScale(Array.isArray(v) ? v[0] : v, to.sy); return false},
                sy(v, to) { to.setScale(to.sx, Array.isArray(v) ? v[1] : v); return false},
                swh(v, to) { to.key.deferUpdates(true); !to.type.normalisable ? 
                            ((Array.isArray(v) ? to.setScale(v[0] / to.w * Math.sign(to.sx), v[1] / to.h * Math.sign(to.sy)) : to.setScale(v / to.w * Math.sign(to.sx), v / to.h * Math.sign(to.sy)))) :
                            (to.setScale(1,1), (Array.isArray(v) ? (to.w = v[0], to.h = v[1]) : (to.w = to.h = v))); to.key.deferUpdates(false); return false},
                w(v,to) { to.setScale((Array.isArray(v) ? v[0] : v) / to.w, to.sy); return false},
                h(v,to) { to.setScale(to.sx, (Array.isArray(v) ? v[1] : v) / to.h); return false},
				/*SVol(v, to) { to.type.sound && (to.sound.volume = v); return false},
				SOff(v, to) { to.type.sound && (to.sound.startOffset = v); return false },
				SRate(v, to) { to.type.sound && (to.sound.rateScale = v); return false },*/
                a(v, to) { to.a = v < 0 ? 0 : v > 1 ? 1 : v; return false},
                R(v, to) { to.rgb.r = (to.rgb.r2 = Math.unit((v.r !== undefined ? v.r * v.r / Math.W16 : v)) * Math.W16) ** 0.5 | 0; to.rgb.update(); return false},
                G(v, to) { to.rgb.g = (to.rgb.g2 = Math.unit((v.g !== undefined ? v.g * v.g / Math.W16 : v)) * Math.W16) ** 0.5 | 0; to.rgb.update(); return false},
                B(v, to) { to.rgb.b = (to.rgb.b2 = Math.unit((v.g !== undefined ? v.b * v.b / Math.W16 : v)) * Math.W16) ** 0.5 | 0; to.rgb.update(); return false},
                RGB(v, to) {
                    if(v.g !== undefined) {
                        if (!to.rgb.isSame(v)) {
                            to.rgb.fromRGB(v)
                            if (to.type.shape && to.shape.colorChanged) { to.shape.colorChanged(true) }
                        }
                    } else {
                        to.rgb.r = to.rgb.g = to.rgb.b = (to.rgb.r2 = to.rgb.g2 = to.rgb.b2 = Math.unit(v) * Math.W16) ** 0.5 | 0;
                        to.rgb.update();
                    }
                    return false
                },
                axy(v, to) {if (to.type.attached) { ((Array.isArray(v) ? (to.attachment.x = v[0], to.attachment.y = v[1]) : (to.attachment.x = v, to.attachment.y = v)), to.attachment.position()); return true } },
                ax(v, to) { to.type.attached && (to.attachment.x = Array.isArray(v) ? v[0] : v, to.attachment.position()); return true },
                ay(v, to) { to.type.attached && (to.attachment.y = Array.isArray(v) ? v[1] : v, to.attachment.position()); return true },
                shpR(v, to) { to.type.shape && (to.shape.radius = Array.isArray(v) ? v[0] : v); return false },
                shpI(v, to) { to.type.shape && (to.shape.inner = Array.isArray(v) ? v[0] : v); return false },
                shpS(v, to) { to.type.shape && (to.shape.sides = Math.round(Array.isArray(v) ? v[0] : v)); return false },
                shpA(v, to) { to.type.shape && (to.shape.valA = ((Array.isArray(v) ? v[0] : v) / Math.TAU) * 4); return false },
                shpB(v, to) { to.type.shape && (to.shape.valB = ((Array.isArray(v) ? v[0] : v) / Math.TAU) * 4); return false },
                shpC(v, to) { to.type.shape && (to.shape.valC = Array.isArray(v) ? v[0] : v); return false },
                shpD(v, to) { to.type.shape && (to.shape.valD = Array.isArray(v) ? v[0] : v); return false },
                text(v,to) {
                    if(to.type.text) {
                        to.textInfo.text = v && v.text ? v.text : (Array.isArray(v) ? "[" + v.map(v=>v.toFixed(3)).join(", ") + "]" : v.toFixed(3));
                        //to.textInfo.text = to.textInfo.fLinkText.replace(/(#+\.#*)|(#+)|(^$)/, (str,f,i) => f?v.toFixed(f.split(.)[1].length):(i?v.toFixed(0):v.toFixed(6)));
                        return true;
                    }
                    return false;
                },
                txtN(v, to) {
                    if (v.text && v.value !== undefined) { 
                        if (v.text.includes(".")) {
                            const path = v.text.split(".").reverse();
                            var obj = to[path.pop()];
                            while (obj !== undefined && path.length > 1) { obj = obj[path.pop()] }
                            if (path.length === 1 && obj !== undefined && obj[path[0]]) {
                                obj[[0]] = v.value;
                                return true;
                            }
                        } else {
                            if (to[v.text] !== undefined) {
                                to[v.text] = v.value;
                                return true;
                            }
                        }
                    }
                    return false;
                },
			    subSpr(v,to) { to.type.subSprite && ((v = Array.isArray(v) ? v[0] : v), to.changeToSubSprite(v = v < 0 ? 0 : v | 0)); return false },
                img(v,to) {
                    if(to.type.image && to.type.imgSequence) {
                        to.imageIdx = (((Array.isArray(v) ? v[0] : v) % to.imgSequence.length + to.imgSequence.length) % to.imgSequence.length) | 0;
                        to.image = to.imgSequence[to.imageIdx];
                        if(to.image.w !== to.w || to.image.h !== to.h) {
                            to.cx = (to.w = to.image.w) / 2;
                            to.cy = (to.h = to.image.h) / 2;
                            return true;
                        }
                        return false;
                    }
                },
                fo: (() => { const func = (v, to) => { to.type.functionLink && (to.fLink.offset = Array.isArray(v) ? v[0] : v); return false }; func.flProp = true; return func })(),
                fs: (() => { const func = (v, to) => { to.type.functionLink && (to.fLink.scale = Array.isArray(v) ? v[0] : v); return false }; func.flProp = true; return func; })(),
                fbO: (() => { const func = (v, to) => { to.type.functionLink && ((Array.isArray(v) ? v[0] : v) > 0 ? to.fLink.blocks |= 2 : to.fLink.blocks &= 1); return false }; func.flProp = true; return func; })(),
                fbI: (() => { const func = (v, to) => { to.type.functionLink && ((Array.isArray(v) ? v[0] : v) > 0 ? to.fLink.blocks |= 1 : to.fLink.blocks &= 2); return false }; func.flProp = true; return func; })(),
                mxy(v, to) { to.key.funcLinkLock |= 3; (Array.isArray(v) ? (to.key.flx = v[0], to.key.fly = v[1]): (to.key.flx =  to.key.fly = v)); return false },
                mx(v, to) { to.key.funcLinkLock |= 1; to.key.flx = Array.isArray(v) ? v[0] : v; return false },
                my(v, to) { to.key.funcLinkLock |= 2; to.key.fly = Array.isArray(v) ? v[2] : v; return false },
                spr(v, to) { to.type.functionLink && v instanceof Set && (to.spriteList = v.asArray); return false },
                cap(v, to) { to.type.liveCapture && v instanceof Set && (to.captureList = [...v.values()]); return false },
                Vrl(v, to) { return IKSolver.update(v, to); },
            },
        },
    };
    const names = {
        inputType: [
            "v",
            "v2",
            "v3",
            "v4",
            "gt",
            "t",
            "f",
            "al",
            "asf",
            "aef",
            "xy",
            "x",
            "y",
            "rxy",
            "rx",
            "ry",
            "sxy",
            "sx",
            "sy",
            "swh",
            "w",
            "h",
            "iWH",
            "iW",
            "iH",
            "axy",
            "ax",
            "ay",
            "vXY",
            "vX",
            "vY",
            "vCXY",
            "vCX",
            "vCY",
            "vWH",
            "vW",
            "vH",
            "vS",
            "a",
            "R",
            "G",
            "B",
            "RGB",
            "palC",
            "subSpr",
            "img",
            "mOver",
            "mxy",
            "mx",
            "my",
            "text",
            "txtN",
            "shpI",
            "shpR",
            "shpS",
            "shpA",
            "shpB",
            "shpC",
            "shpD",
            "fs",
            "fo",
            "pi",
            "spr",
            "sel",
            "pixel",
            /*"SVol",
            "SOff",
            "SRate",
            "SLev",
            "SLevM",
            */"An",
            "Vrl"
        ],
        inputTypeLong: [ 
            "Value",
            "Value Pair?A set of 2 values",
            "Value Tri?A set of 3 values",
            "Value Quad?A set of 4 values",
            "GlobalTime?Time since page load in seconds",
            "Time?Cyrrent animation time in seconds",
            "Frame?Current animation frame number 60th second per frame",
            "Anim length?Animation length in frames",
            "Anim start?Start time of animation",
            "Anim end?End time of animation",
            "Position?World position of input sprite",
            "Position X?World x position of input sprite",
            "Position Y?World y position of input sprite",
            "Rotate XY Axis",
            "Rotate X Axis?Direction in radians of input sprite x axis",
            "Rotate Y Axis?Direction in radians of input sprite x axis",
            "Scale XY?X and Y axis scale of input sprite",
            "Scale X?X axis scale of input sprite",
            "Scale Y?Y axis scale of input sprite",
            "Size WH?Width and height of input",
            "Width?World width of input sprite in pixels",
            "Height?World width of input sprite in pixels",
            "Image width height",
            "Image width?Image or sub sprite width in pixels",
            "Image height?Image or subSprite height in pixels",
            "Attached XY",
            "Attached X?Local X attached position relative top left depending on attachment type",
            "Attached Y?Local Y attached position relative top left depending on attachment type",
            "View XY?Workspace XY coordinate of top left corner",
            "View X?Workspace X coordinate of top left corner",
            "View Y?Workspace Y coordinate of top left corner",
            "View center XY?Workspace center XY",
            "View center X?Workspace center X",
            "View center Y?Workspace center Y",
            "View WH?Workspace width height in pixels",
            "View W?Workspace width in pixels",
            "View H?Workspace height in pixels",
            "View Scale?Workspace scale",
            "Alpha?Alpha value of input sprite range 0 to 1",
            "Red?Input sprite red value range 0 to 1",
            "Green?Input sprite Green value range 0 to 1",
            "Blue?Input sprite Blue value range 0 to 1",
            "Color?Color of input sprite",
            "Pallet count?Number of color contained in pallet",
            "Sub sprite index?Sub Sprite index",
            "Image Seq Idx?Idx of current image if input sprite is an image sequence",
            "Mouse Over?Value of 1 if mouse over input sprite else 0",
            "Mouse XY",
            "Mouse X?Relative x position of mouse to input sprite",
            "Mouse Y?Relative y position of mouse to input sprite",
            "Text?Reads input text sprites text as number",
            "TextName?Reads input as text name",
            "Shape Inner?Shape inner property value",
            "Shape radius?Shape radius property value",
            "Shape count?Shape count property value",
            "Shape A?Shape A property value",
            "Shape B?Shape B property value",
            "Shape C?Shape C property value",
            "Shape D?Shape D property value",
            "Func link Scale?Scale value of input sprite if function link",
            "Func link Offset?Offset value of input sprite if function link",
            "PI",
            "Sprite List",
            "Is selected?If input sprite is selected value is 1 else 0",
            "Pixel?gets RGB of pixel under mouse of input sprite (MUST BE Drawable)",
            /*"Sound volume?Gets the current volume of input sounds",
            "Sound offset?Gets the sound play offset in seconds of input sounds",
            "Sound Rate scale?Gets the playback rate scale of input sounds",
            "Sound level?Level of sound at current time",
            "Sound mean level?Mean sound level at current time",
            */"Spr anim?Links sprites in animation order",
            "IK node?Input node for IK intergration."
        ],
        outputType: [
            "v",
            "xy",
            "x",
            "y",
            "r",
            "rxy",
            "rx",
            "ry",
            "s",
            "sx",
            "sy",
            "swh",
            "w",
            "h",
            "axy",
            "ax",
            "ay",
            "a",
            "R",
            "G",
            "B",
            "RGB",
            "subSpr",
            "img",
            "mOver",
            "mxy",
            "mx",
            "my",
            "text",
            "txtN",
            "shpI",
            "shpR",
            "shpS",
            "shpA",
            "shpB",
            "shpC",
            "shpD",
            "fs",
            "fo",
            "fbO",
            "fbI",
            "spr",
            "cap",
            /*"SVol",
            "SOff",
            "SRate",
            */"Vrl"
        ],		
        outputTypeLong: [ 
            "Value",
            "Position",
            "Position X",
            "Position Y",
            "Rotation?Combined x and y uniform rotation",
            "Rotate XY Axis",
            "Rotate X Axis",
            "Rotate Y Axis",
            "Scale XY?Combinded X and Y axis scale of output sprite",
            "Scale X",
            "Scale Y",
            "Size WH",
            "Width",
            "Height",
            "Attached XY",
            "Attached X",
            "Attached Y",
            "Alpha",
            "Red",
            "Green",
            "Blue",
            "Color",
            "Sub sprite index?Selects sub sprite if sprite has sub sprite",
            "Image Seq Frame?Selects image if sprite has a image sequence",
            "Mouse Over?Overwrites mouse over on linked sprite",
            "Mouse XY",
            "Mouse X?Overwrites mouse x on linked sprite",
            "Mouse Y?Overwrites mouse y on linked sprite",
            "Text?Outputs result as text if linked to a text sprite",
            "Text Name?Set property name (first input) to value (2nd input) dot seperated property path",
            "Shape Inner?Set the inner value of a shape",
            "Shape radius?Set the radius value of a shape",
            "Shape count?Set the count value of a shape",
            "Shape A?Set shape A property",
            "Shape B?Set shape B property",
            "Shape C?Set shape C property",
            "Shape D?Set shape D property",
            "Funclink Scale?Set scale value of a function line",
            "Funclink Offset?Set offset value of a function line",
            "Funclink Block OUT?Blocks output of linked function link when value > 0",
            "Funclink Block IN?Blocks input of linked function link when value > 0",
            "Sprite List",
            "Capture List",
            /*"Sound volume?Sets the current volume of input sounds",
            "Sound offset?Sets the sound play offset in seconds of input sounds",
            "Sound Rate scale?Sets the playback rate scale of input sounds",
            */"IK node?Result of IK applied to node"
        ],		
        functionType: [
            "sum",
            "dif",
            "acc",
            "mult",
            "div",
            "chase",
            "spring",
            "delay",
            "ecurve",
            "scurve",
            "sqrWave",
            "pulseWave",
            "triangleWave",
            "cmpEq",
            "cmpGtLt",
            "mean",
            "abs",
            "flr",
            "rnd",
            "sign",
            "clamp",
            "mod",
            "toUnit",
            "max",
            "min",
            "sqr",
            "sqrt",
            "pow",
            "sin",
            "cos",
            "asin",
            "acos",
            "tan",
            "vdot",
            "vcross",
            "uvdot",
            "uvcross",
            "svdot",
            "svcross",
            "vAng",
            "normalize",
            "polar" ,
            "pair",
            "trip",
            "quad",
            "select",
            "swch",
            "trig",
            "tan2",
            "rgb",
            "hypot",
            "rand",
            "map",
            "name",
            "obj",
            "spr",
            "cap",
            "A",
            "IK",
            "Vrl" 
        ],		
        functionTypeLong: [ 
            "Sum?Sums all input values",
            "Diference?Subtract inputs after the first from the first",
            "Accumulater?Adds summed inputs or offset once every fram",
            "Multiply?Multiplies all inputes",
            "Divide?Divides first input by all other inputs",
            "Chaser?Simulates a value chasing the sum of all inputs\nScale sets the acceleration 0-1\nOffset sets the inverse drag 0-1",
            "Spring?Simulates a spring (like) moving to sum of all inputs\n Scale set the max velocity as fraction of difference\nOffset sets drag 0 no drag 1 no movement",
            "Delay?Sum of all inputs is held for abs(floor(offset)) frames (Max delay 100)",
            "Ease In Out?Applies curve to input sum\n Offset is the power of the curve\nOutput 0 to 1",
            "Sigmoid?Applies sigmod curve to input sum\nOffset is exponent\nOutput -1 to 1",
            "Square wave?Using sum of input as time\n Output 0 or 1\n Offset is phase Scale is frequencey",
            "Pulse wave?Same as Square wave if 1 input else\n1st in is pulse width and time is sum of remaining inputs\nOutput 0 or 1\nOffset is phase\nScale is frequencey",
            "Triangle wave?If 1 input then Offset is phase Scale is frequencey else\n1st input is peek center and time is sum of remaining inputs\nOutput 0 or 1\nOffset is phase\nScale is frequencey",
            "Equal?Outputs 1 if all inputs are the same",
            "Greater Less Than?Outputs 1 when true\nTrue if scale positive and inputs greater than first\nTrue if scale negative and inputs less than first",
            "Mean?Sets output as mean of inputs",
            "Abs?Sum of inputs is made positive",
            "Floor?Floors sum of inputs to nearest integer value",
            "Round?Rounds sum of inputs to nearest integer value",
            "Sign?Outs is -1 for neg number 1 for positive and 0 for zero",
            "Clamp?For 1 input then offset <= in0 <= scale\n else if 2 inputs then if in1 < 0 in1 <= in0 <= 0 or if in1 > 0 0 <= in0 <= in1\n or in1 <= in0 <= in2",
            "Mod?Result is (sum mod (scale - offset)) + scale",
            "To unit?Divide sum of input values by first input value",
            "Max?Outputs max value of inputs",
            "Min?Outputs min value of inputs",
            "Square?Squares the sum of inputs",
            "Square Root?Outputs square root of sum of inputs",
            "Power?Sum inputs to power of scale",
            "Sin?Outputs the sin of the sum of inputs\nUnits radians",
            "Cos?Outputs the cos of the sum of inputs\nUnits radians",
            "aSin?Outputs radians for sum of inputs\nInput is clamped to prevent out of range value",
            "aCos?Outputs radians for sum of inputs\nInput is clamped to prevent out of range value",
            "Tan?Outputs the tan of the sum of inputs\nUnits radians",
            "VDot?Outputs dot product of input vectors\nInput 1 and 2 is first vector x y\nInput 3 and 4 is first vector x y\nAddition inputs are ignored",
            "VCross?Outputs cross product of input vectors",
            "U-VDot?Outputs dot product of normalised input vectors",
            "U-VCross?Outputs cross product of normalised input vectors",
            "S-VDot?Outputs dot product of input vectors divided by length of first vect squared",
            "S-VCross?Outputs cross product of input vectors divided by length of first vect squared",
            "Angle between Vectors?Outputs the angle between input vectors",
            "Normalize",
            "Polar? Offset and scale set length of vector",
            "Pair",
            "Trip",
            "Quad",
            "Input Select?Use first input in range 0 1 to select as output one of remaining inputs",
            "Input Switch?Uses first input to switch betwwen remaining inputs\nSwitches down we first input neg up when first input is greater than 1",
            "Trigger < 0?Output 1 if sum off input is negative or 0",
            "Direction?Outputs direction of first input vector",
            "RGB?Converts inputs to rgb value\nOne input is gray scale\nMore than one will sum RGB as encountered",
            "Hypot?Outputs the root of the sum of the squares of the inputs",
            "Random?Outputs random value",
            "Data map?First input is text representation of map [int: value] [int: value] and Outputs the sum of remaining mapped inputs",
            "Name?A property name used to set the property value if and when possible",
            "Object?To pass inputs that are not numbers",
            "Sprite list?Outputs a list of input sprites",
            "Capture List?Outputs a list of renderable input sprites",
            "Game Sprites?Does nothing",
            "IK solver?3 Point IK solver. Sign of offset sets left or right bend. Offset 0 and bend is auto",
            "Verlet solver?Verlet intergrator"
        ],
        vetName(type, name) {
            const shortName = names[type + "Type"];
            if (shortName.includes(name)) { return name }
            const longName = names[type + "TypeLong"];
            if (longName.includes(name)) {
                return shortName.inputType[longName.indexOf(name)];
            }
        },
        vetIn(name) { return names.vetName("input", name) },
        vetOut(name) { return names.vetName("output", name) },
        vetFunc(name) { return names.vetName("function", name) },
    };
    const viewTopLeft = utils.point;
    const viewSize = utils.point;
    const viewCenter = utils.point;
    var viewScale;
    const API = {
        data: {
            viewTopLeft,
            viewCenter,
            viewSize,
            viewScale: 1,
        },
        updateFrameData() {
            view.toWorld(0,0,viewTopLeft);
            view.toWorld(mainCanvas.width, mainCanvas.height, viewSize);
            viewSize.x -= viewTopLeft.x;
            viewSize.y -= viewTopLeft.y;
            viewCenter.x = viewSize.x * 0.5 + viewTopLeft.x;
            viewCenter.y = viewSize.y * 0.5 + viewTopLeft.y;
            functionLinkBuilder.data.viewScale = viewScale = view.scale;
        },
        names,
        functionLink,
        functionObjs: {
            APICommon: {
                updateWidget:false, 
                active: false, 
                getById(id) { return this.spriteList.get(id) }, 
                bind(spr, id) { 
                    if(this.spriteList.has(id)) { this.spriteList.set(id,spr); this.setSprites(); } 
                }, 
                get inputs() { return []; },
                get outputs() { return []; },                
            },
            vets: {
                selection: { vet(value) {return value.split(" ").pop()} },
            },
            optionsMenu: {
                owner: null,
                batchReady(spr) {
                    log("Batch called compiled extension." + spr.name);
                },
                setValue(name, value) {
                    if (this.owner.values[name] !== undefined) { 
                        this.owner.values[name] = this.values[name].vet !== undefined ? this.values[name].vet(value) : value; 
                        this.owner.reset(); 
                    }            
                },
                getValue(name) { 
                    return this.owner.values[name]; 
                },
                hasValue(name) { return this.owner.values[name] !== undefined; },
                values: [ ],
                pScript:''
            }
        },
        start() { AddExtension(); }
    };
    function AddExtension() {
        const fAPI = system.addExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext;
        fAPI.known = new Map();
        fAPI.namedValues = new Set();
        fAPI.reset = () => {
            fAPI.namedValues.clear();
            fAPI.known.clear();
        };
        fAPI.add = (name, fLink) => {
            if (!fAPI.known.has(name)) {
                fAPI.known.set(name, {
                    name,
                    fLink,
                });
            }
            fLink.optionsMenu.owner = fLink;
        };
        fAPI.runExtension = (batch) => {
            fAPI.namedValues.clear();
            const n = "##" + FUNCTION_LINK_OBJECT_EXTENSION + " ";
            const lineHas = (line, name) => line.includes(n + name + "##");
            var modAIdx = -1;
            var nLines, i;
            for (const [name, fLinkAPI] of fAPI.known) {
                var idx  = 0;
                while (idx  < batch.lines.length) {
                    if (lineHas(batch.lines[idx], "START")) {                        
                        modAIdx = idx;
                    } else if (lineHas(batch.lines[idx], "END")) {                        
                        if (modAIdx > -1) {
                            i = modAIdx + 1;
                            nLines = [];
                            while (i < idx) { nLines.push(batch.lines[i++].replace(/\/\//gi, "")); }
                            for (const [name, value] of Object.entries(fLinkAPI.fLink.optionsMenu.values)) {
                                if (!fAPI.namedValues.has(name)) {
                                    const lines = nLines.join("\n")
                                        .replace(/##SPACERS##/gi, value.spacers ? value.spacers : "")
                                        .replace(/##UI##/gi, value.UI)
                                        .replace(/##NAME##/gi, name).split("\n");
                                    batch.lines.splice(modAIdx, 0, ...lines);
                                    modAIdx += lines.length;
                                    idx += lines.length;
                                    lines.length = 0;
                                }
                            }
                        }
                        modAIdx = -1;
                    }                    
                    idx ++;
                }
                for (const name of Object.keys(fLinkAPI.fLink.optionsMenu.values)) {
                    fAPI.namedValues.add(name);
                }
                
            }
            return batch;
            
        };
        API.start = undefined;
    }
    return API;
})();