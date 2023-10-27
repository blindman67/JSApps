"use strict";
function functionLinkOptimiser(code, options) {

    const optBakePies = options.postCompileBakePies;
    const optVarUse = options.postCompileReuseVars;
    const nameList = [];
    function addNames() {
        const names = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var j = 0, i;
        while (j < 3) {
            i = 0;
            while (i < names.length) {
                nameList.push("V".padEnd(j+2,names[i]));
                i++;
            }
            j++;
        }
    }
    addNames();
    const details = [
        "-----------------------------------------------------------",
        "Post compile optimiser details",
    ]
    const assignSplitter = / [+\-\*\/%\|\&]= | = /g;
    const operators = "+,-,/,*,%,?,:,Math,Math".split(",");
    const bracketOperators = /\+|\-|\*|\/| /;
    const replacePie = (line) => line.replace(/3\.141/g, "Math.PI");
    const replace2Pies = (line) => line.replace(/6\.282/g, "Math.TAU");
    const replaceHalfPie = (line) => line.replace(/1\.570/g, "Math.PI90");
    const replacePies = line => replaceHalfPie(replace2Pies(replacePie(line)));
    const countMatches = (str, reg) => str.match(reg)?.length ?? 0;
    const createAssignRegExp = name => new RegExp(name + " [+\\-\\*\\/%\\|\\&]=|" + name + " =","");

    code = code.replace(/\/\*(.|\n)*\*\/\n/m,"");
    const vars = /(.|\n)*?\n\n/.exec(code)[0].replace(/var /g,"").replace(/;\n/g,",").split(",").map(name => name.trim()).filter(name => name !== "");
    const updateRaw = /function update(.|\n)*?\}\n\n/.exec(code)[0].replace(/;/g,"").split("\n");
    const resetRaw = /function reset(.|\n)*?\}\n\n/.exec(code)[0].replace(/;/g,"").split("\n");
    code = code.replace(/(.|\n)*?\n\n/, "###VARS###");
    code = code.replace(/function update(.|\n)*?\}\n\n/, "###UPDATE###");
    code = code.replace(/function reset(.|\n)*?\}\n\n/, "###RESET###");
    code = code.replace(/const flData = functionLinkBuilder\.data;\n/, "###FLDATA###");
    code = code.replace(/const vals = \[\];\n/, "###VALS###");

    const protectedVarNames = ["#","speed"];


    const updateDec = updateRaw.shift();
    const updateActTest = updateRaw.shift();
    const updateVars = updateRaw.shift().replace("var ", "").split(",").map(name => name.trim());
    vars.push(...updateVars, "flData", "vals");
    updateRaw.pop();
    updateRaw.pop();
    const updateLast = updateRaw.pop();
    const update = updateRaw.map(line => line.trim());
    resetRaw.pop();
    resetRaw.pop();
    resetRaw.pop();
    resetRaw.shift();
    resetRaw.shift();
    const reset = resetRaw.map(line => line.trim()).filter(line=> line !== "");
    const allLines = [update, reset]
    function countUse(name, allLines) {
        var count = 0, idx = 0;
        for (const lines of allLines) {
            for (const line of lines) {
                idx = line.indexOf(name, idx);
                while (idx > -1) {
                    count ++;
                    idx = line.indexOf(name, idx + name.length);
                }
            }
        }
        return count;
    }
    function countUseReg(reg, allLines) {
        var count = 0, idx = 0;
        for (const lines of allLines) {
            for (const line of lines) {
                count += countMatches(line, reg);
            }
        }
        return count;
    }
    function countRefs(name, allLines) {
        return countUse(name + ".", allLines);
    }
    function countAssigned(name, allLines) {
        return countUseReg(createAssignRegExp(name), allLines);
    }
    function findReferenced(vars, allLines) {
        const refed = [], nonRefed = [];
        for (const name of vars) {
            const refCount = countRefs(name, allLines);
            if (refCount) {
                refed.push(name)
            } else {
                nonRefed.push(name);
            }
        }
        return [refed, nonRefed];
    }
    function findAssignment(name, allLines, vars) {
        const aName = createAssignRegExp(name);
        var idx;
        for (const lines of allLines) {
            idx = 0;
            for (const line of lines) {
                if (aName.test(line)) {
                    const ased = line.split("= ");
                    ased.shift();
                    const as = ased.join("= ");
                    return {lines, idx, as, varsInAs: varsInCode(as, vars)};
                }
                idx++
            }
        }
    }
    function varsInCode(code, vars) { return vars.filter(name => code.includes(name)) }
    function findSimpleAssignment(name, allLines, vars) {
        const aName = name + " = ";
        var idx;
        for (const lines of allLines) {
            idx = 0;
            for (const line of lines) {
                if (line.includes(aName)) {
                    const ased = line.split("= ");
                    ased.shift();
                    const as = ased.join("= ");
                    return {lines, idx, as, varsInAs: varsInCode(as, vars)};
                }
                idx++
            }
        }
    }
    function findSimpleAssignmentPos(name, allLines) {
        const aName = name + " = ";
        var idx;
        for (const lines of allLines) {
            idx = 0;
            for (const line of lines) {
                if (line.includes(aName)) {
                    const count = countMatches(line, new RegExp(name));
                    if (count === 1) {
                        return {lines, idx};
                    }
                    return;
                }
                idx++
            }
        }
    }
    function areVarsUsedInLinesWith(ignorLineIdx, name, vars, lines) {
        var i = 0;
        while (i < lines.length) {
            if (i !== ignorLineIdx) {
                if (lines[i].includes(name)) {
                    if(doesCodeHaveAny(lines[i], vars)) { return true }
                }
            }
            i++;
        }
    }
    function findVarUseRange(name, lines) {
        var first, last;
        var idx = 0;
        while (idx < lines.length) {
            if (lines[idx].includes(name)) {
                if (first === undefined) { last = first = idx }
                else { last = idx }
            }
            idx++
        }
        return [first, last];
    }
    function isAssignmentConstant(name, allLines, vars) {
        const assigned = findAssignment(name, allLines, vars);
        if (assigned) {
            if (!/[a-z]/gi.test(assigned.as)) {
                try {
                    const as = eval(assigned.as);
                    if (!isNaN(as)) {
                        assigned.cVal = "" + as;
                        return assigned;
                    }
                } catch (e) { }
            }
        }
    }
    function doesCodeHaveAny(code, vars) {
        for (const name of vars) {
            if (code.includes(name)) { return true }
        }
    }
    function isVarReset(name, resetLines) { return resetLines.some(line => line.includes(name)) }
    function removeResetVars(vars, resetLines) {
        var i = 0;
        while (i < vars.length) {
            if (isVarReset(vars[i], resetLines)) { vars.splice(i--, 1) }
            i++;
        }
    }
    function removeProtectedVars(vars) {
        var i = 0;
        while (i < vars.length) {
            if (isProtectedVar(vars[i])) { vars.splice(i--, 1) }
            i++;
        }
    }
    function optimiseVarsUseRange(vars, allLines) {
        const [ref, nRef] = findReferenced(vars, allLines);
        removeResetVars(nRef, allLines[1]);
        removeProtectedVars(nRef);
        const useMap = new Map();
        for (const name of nRef) {
            const sAssign = findSimpleAssignmentPos(name, [allLines[0]]);
            if (sAssign) {
                const [first, last] = findVarUseRange(name, allLines[0]);
                if (first === sAssign.idx) {
                    useMap.set(name, {first, last, name});
                }
            }
        }
        const use = [...useMap.values()].sort((a,b) => a.first - b.first);
        var i, j = 0, first;
        const nonOverlap = [];
        while (j < use.length) {
            const non = [];
            first = use[j];
            non.push(first);
            i = j + 1;
            while (i < use.length) {
                const check = use[i];
                if (check.first > first.last) {
                    non.push(check);
                    first = check;
                }
                i++;
            }
            nonOverlap.push(non);
            j++;
        }
        nonOverlap.sort((a,b) => b.length - a.length);
        const bestVars = nonOverlap[0];
        if (bestVars?.length > 1) {
            const newName = bestVars[0].name;

            i = 1;
            while (i < bestVars.length) {
                renameVar(bestVars[i].name, newName, [allLines[0]]);
                log("Var " + bestVars[i].name + " to: " + newName);
                i++;
            }

            removeUnusedVars(vars, allLines);
            renameVars(vars, allLines);
            return true;
        }
    }
    function optimiseUseRangePasses(vars, allLines) {
        var count = 0;
        while (count < 1000 && optimiseVarsUseRange(vars, allLines)) {
            count++;
        }
        count ? details.push("Var use optimised passes: " + count) : details.push("Var use optimise: None found!") ;

    }
    function replaceVarWithConst(name, constant, lines) {
        const r = new RegExp(name, "g");
        if (constant.match(bracketOperators)) {
            constant = "("+constant+")";
        }
        var i = 0;
        while (i < lines.length) {
            lines[i] = lines[i].replace(r, constant);
            i++;
        }
    }
    function countOperatorsInLine(line, ops) {
        var count = 0, idx;
        for (const name of ops) {
            idx = line.indexOf(name);
            while (idx > -1) {
                count ++;
                idx = line.indexOf(name, idx + name.length);
            }

        }
        return count;

    }
    function countVarsInLine(line, vars) {
        var count = 0;
        for (const name of vars) {
            line.includes(name) && (count ++);
        }
        return count;

    }
    function isProtectedVar(name, protectedNames = protectedVarNames) {
        return protectedNames.some(n => name.includes(n));
    }
    function renameVar(name, newName, allLines, protect = true) {
        if (protect) {
            if (isProtectedVar(name)) { newName += "#" }
        }
        const r = new RegExp(name, "g");
        for (const lines of allLines) {
            var i = 0;
            while (i < lines.length) {
                lines[i] = lines[i].replace(r, newName);
                i++;
            }
        }
        return newName;
    }
    function renameVars(vars, allLines, protect = true) {
        var i = 0;
        while (i < vars.length) {
            const name = vars[i];
            if (countRefs(name, allLines) === 0 && name !== nameList[i]) {
                vars[i] = renameVar(name, nameList[i], allLines, protect);

            }
            i++;
        }
    }
    function removeVarProtection(allLines) {
        var i = 0;
        for (const lines of allLines) {
            var i = 0;
            while (i < lines.length) {
                lines[i] = lines[i].replace(/#/g, "");
                i++;
            }
        }
    }
    function removeUnusedVars(vars, allLines) {
        var i = 0;
        while (i < vars.length) {
            const usedCount = countUse(vars[i], allLines);
            if (usedCount === 0) { vars.splice(i--, 1) }
            else if (usedCount === 1) {
                const assigned = findAssignment(vars[i], allLines, vars);
                if (assigned) {
                    assigned.lines.splice(assigned.idx);
                    vars.splice(i--, 1);
                }
            }
            i++;
        }
    }
    function checkVars(vars, allLines, counted) {
        removeUnusedVars(vars, allLines);
        renameVars(vars, allLines)
        for (const name of vars) {
            const usedCount = countUse(name, allLines);
            const refCount = countRefs(name, allLines);
            const assignmentCount = countAssigned(name, allLines);
            const uAssignmentCount = countAssigned(name, [allLines[0]]);
            if (refCount === 0 && uAssignmentCount === 1) {
                const isConstAssigned = isAssignmentConstant(name, [allLines[0]], vars);
                if (isConstAssigned) {
                    isConstAssigned.lines.splice(isConstAssigned.idx, 1);
                    replaceVarWithConst(name, isConstAssigned.cVal, isConstAssigned.lines);
                    const assigned = findAssignment(name, [allLines[1]], vars);
                    if (assigned) {
                        assigned.lines.splice(assigned.idx, 1);
                    }
                    return true;
                }
            }
            const used = counted === 1 ? usedCount === 2 : usedCount >= 2 && usedCount < 2 + counted;
            if (refCount === 0 && used && assignmentCount === 1) {
                const assigned = findAssignment(name, allLines, vars);
                if (!doesCodeHaveAny(assigned.as, vars)) {
                    try {
                        const as = eval(assigned.as);
                        if (as === undefined) {
                            log.warn("ERROR!! " + assigned.as + " at line " + assigned.idx);
                            log.warn(assigned.lines[assigned.idx]);
                            details.push("Eval undefined skipping result. Line: " + assigned.idx + " \n      " + assigned.lines[assigned.idx]);
                            throw new Error();

                        }
                        assigned.as = "" + as;
                        assigned.lines.splice(assigned.idx, 1);
                        replaceVarWithConst(name, assigned.as, assigned.lines);
                        return true;
                    } catch(e) {
                        if (counted === 1) {
                            assigned.lines.splice(assigned.idx, 1);
                            replaceVarWithConst(name, assigned.as, assigned.lines);
                            return true;
                        }

                    }

                } else if (!areVarsUsedInLinesWith(assigned.idx, name, assigned.varsInAs, assigned.lines)) {
                    const cVol = countOperatorsInLine(assigned.as, operators)
                    if (cVol === 1 || cVol === 0 || (cVol === 2 && usedCount === 2 && assignmentCount == 1)) {
                        assigned.lines.splice(assigned.idx, 1);
                        replaceVarWithConst(name, assigned.as, assigned.lines);
                        return true;
                    }
                }

            }
        }
    }
    function evalVars(vars, lines, counted) {
        for (const name of vars) {
            const usedCount = countUse(name, [lines]);
            const refCount = countRefs(name, [lines]);
            const assignmentCount = countAssigned(name, [lines]);
            const used = counted === 1 ? usedCount === 2 : usedCount >= 2 && usedCount < 2 + counted;
            if (refCount === 0 && used && assignmentCount === 1) {
                const assigned = findAssignment(name, [lines], vars);
                if (!doesCodeHaveAny(assigned.as, vars)) {
                    try {
                        const as = eval(assigned.as);
                        if (as === undefined) {
                            log.warn("WTF " + assigned.as + " at line " + assigned.idx);
                            log.warn(assigned.lines[assigned.idx])
                            details.push("Eval undefined skipping result. Line: " + assigned.idx + " \n      " + assigned.lines[assigned.idx]);
                            throw new Error()
                        }
                        assigned.as = "" + as;
                        assigned.lines[assigned.idx] = name + " = " + assigned.as;
                    } catch(e) { }
                }
            }
        }
    }
    function findDups(vars, allLines, counted = 1) {
        var count = 0;
        while (count < 1000 && checkVars(vars, allLines, counted)) {
            count ++;
        }
        count && details.push("Optimise level: " + counted + " passes: " + count);
        removeBrackets(vars, allLines);
        evalVars(vars, allLines[0], 1)
    }
    function removeBrackets(vars, allLines) {
        var i = 0;
        for (const lines of allLines) {
            for (const name of vars) {
                const r = new RegExp(" \\(" + name + "\\)", "g");
                i = 0;
                while (i < lines.length) {
                    lines[i] = lines[i].replace(r, " " + name);
                    i++;
                }
            }
        }
    }
    function bakePies(allLines) {
        var i = 0;
        for (const lines of allLines) {
            i = 0;
            while (i < lines.length) {
                lines[i] = replacePies(lines[i]);
                i++;

            }
        }


    }
    function pickVar(name, vars) {
        var i = 0;
        while (i < vars.length) {
            if (vars[i] === name) {
                vars.splice(i, 1);
                return true;
            }
            i++;
        }
    }
    function addSemicolons(lines) {
        var i = 0;
        while (i < lines.length) {
            if (!lines[i].endsWith("}")) { lines[i] += ";" }
            i++;
        }
    }




    const beforeVar = vars.length;
    const beforeUpdate = allLines[0].length;
    const [refed] = findReferenced(vars, allLines);

    optBakePies && bakePies(allLines);
    removeBrackets(vars, allLines);
    renameVars(vars, allLines);
    removeUnusedVars(vars, allLines);
    findDups(vars, allLines);
    findDups(vars, allLines, 2);
    optVarUse && optimiseUseRangePasses(vars, allLines);

    const afterVar = vars.length;
    const afterUpdate = allLines[0].length;
    removeVarProtection(allLines);
    removeVarProtection([vars]);
    addSemicolons(allLines[0]);

    const updateFunc = "function update() {\n\t"+ updateActTest.trim() + "\n\t"+ update.join("\n\t") + "\n}\n";
    const resetFunc = "function reset() {\n\t" + reset.join(";\n\t") + ";\n}\n";
    const varListRes = "var " + vars.join(", ") + ";\n"
    code = code.replace("###UPDATE###", updateFunc);
    code = code.replace("###RESET###", reset.length ? resetFunc : "function reset() {} \n\n");
    code = code.replace("###VARS###", varListRes);
    details.push("Optimised Vars: " + beforeVar + " >> " + afterVar + " " + ((afterVar / beforeVar)* 100).toFixed(0) + "%");
    details.push("Optimised Code lines: " + beforeUpdate + " >> " + afterUpdate + " " + ((afterUpdate / beforeUpdate) * 100).toFixed(0) + "%");
    code = code.replace("###FLDATA###", pickVar("flData", vars) ? "const flData = functionLinkBuilder.data;\n" : "");
    code = code.replace("###VALS###", pickVar("vals", vars) ? "const vals = [];\n" : "");


    return [code, " " + details.join("\n ") + "\n"];




}


const functionLinkCompiler = (() => {
    var warnings = 0, errors = 0;
    const widgetUpdate = "API.updateWidget = spr#0.selected ? true : API.updateWidget;";
    const varMap = new Map();
    const sprMap = new Map();
    const names = new Set();
    const varslist = [];
    const inputIds = new Map();
    const outputIds = new Map();
    const sprIds = [];
    function addSpriteId(id, name,type) {
        if (type === "input") {
            if(!inputIds.has(name)) {
                inputIds.set(name, {id,name});
            }
        } else {
            if(!outputIds.has(name)) {
                outputIds.set(name, {id,name});
            }
        }
        if(!sprIds.includes(id)) {
            sprIds.push(id);
        }
    }
    var lines = [];
    function addVar(name, id) {
        varMap.set(name + id,{name,id})
        //varslist.push("var " + name + id + ";");
    }
    function addLineS(line) { lines.push(line) }
    function addLine(line, ...ids) {
        var idx = 0;
        for(const id of ids) {
            line = line.replace(new RegExp("#" + idx + "(?![0-9])","g"),id);
            idx ++;
        }
        lines.push(line);
    }
    function addInit(name, id, value) {
        if(!varMap.has(name + id)){
            addVar(name,id)
        }
        const v = varMap.get(name+id);
        if((v.name === "offset" || v.name === "scale") && !isNaN(value)) {
            v.init = Number(Number(value).toFixed(3));
        }else {
            v.init = value;
        }
    }
    function setResetVal(name, id, resetVal) {
        const v = varMap.get(name+id);
        if(v) {
            v.resetVal = resetVal;
        }
    }
    function addSprInit(name, id, value) {
        if(!sprMap.has(name + id)){
            sprMap.set(name + id,{name,id})
        }
        const v = sprMap.get(name+id);
        v.init = value;
    }
    function varsToCode() {
        names.clear();
        var str = "", s = "";
        var cc = 0;
        for(const v of varMap.values()) {
            names.add(v.name);
            if(!v.isConst) {
                if(cc%8 === 0) {
                    if(str !== "") {str += ";\n"};
                    str += "var ";
                    s = "";
                }
                str += s + v.name + v.id + "";
                s = ", ";
                cc++;
            }
        }
        if (API.options.zeroUninit) {
            if(str !== "") {str += ";\n\n"};
            s = "";
            cc = 1;
            for(const v of varMap.values()) {
                if(v.name !== "spr") {
                    if(!v.isConst && v.init === undefined) {
                        if(cc%8 === 0) {
                            if(str !== "") { str += " = 0;\n" }
                            str += "";
                            s = "";
                        }
                        str += s + v.name + v.id + "";
                        s = " = ";
                        cc++;
                    }
                }
            }
            if(s === " = ") { str += " = 0;\n" }
        }
        if(str !== "") {str += ";\n\n"};
        for(const v of varMap.values()) {
            if(v.init !== undefined) {
                if(v.isConst) {
                    str += "const " + v.name + v.id + " = "+v.init+";\n";
                } else if(v.resetVal !== undefined && v.resetVal !== v.init){
                    str += v.name + v.id + " = "+v.init+";\n";
                }
            }
        }
        return str;
    }
    function resetToCode() {
        var str = "", s = "";
        for(const v of varMap.values()) {
            if(v.name !== "spr" && v.name !== "spriteIDS" && v.name !== "spriteList") {
                if(v.resetVal !== undefined) {
                    str += s + v.name + v.id + " = "+v.resetVal+";";
                } else if(v.init !== undefined) {
                    str += s + v.name + v.id + " = "+v.init+";";
                }
                s = "\n";
            }

        }
        return str;
    }
    function sprsToCode() {
        var str = "",s = "";
        for(const v of sprMap.values()) {
            if(v.init !== undefined) {
                str += s + v.name + v.id + " = "+v.init+";";
                s = "\n";
            }
        }
        return str;
    }
    function addConstInit(name,id, value, keep = false) {
        addVarInit(name,id, value, keep);
        varMap.get(name + id).isConst = true;
    }
    function addVarInit(name,id, value, keep = false) {
        addVar(name,id);
        addInit(name,id,value);
        if(keep) {
            varMap.get(name + id).keep = true;
        }
    }
    function doNotOptimiseVar(name, id, value = true) {
        varMap.get(name + id).doNotOptimise = value;
    }
    function setResetValueVar(name,id,value) {
        varMap.get(name + id).resetVal = value;
    }
    function addVarInitSpr(name,id, value, keep = false) {
        addVar(name,id);
        addSprInit(name,id,value);
        if(keep) {
            varMap.get(name + id).keep = true;
        }
    }
    function vars(id){ ["value", "scale", "offset"].forEach(name => addVar(name, id)) };
    function init(id, scale, offset) { addInit("scale", id, scale); addInit("offset", id, offset) };
    const read =  { sprite: "spr##.$$", fLink: "value##" };
    function start(id){ addLine("val#0 = 0;", id) };
    function startUn(id){ addLine("val#0 = undefined;", id) };
    function groupOperatorAssign(parts,ids,scale,off,op,assign) {
        if(scale !== 1) {
            if(off !== 0) {
                addLine(assign + " = (" + parts.join(op) + ") * scale#0 + offset#0;",...ids);
            }else{
                addLine(assign + " = (" + parts.join(op) + ") * scale#0;",...ids);
            }
        }else{
            if(off !== 0) {
                addLine(assign + " = (" + parts.join(op) + ") + offset#0;",...ids);
            }else{
                addLine(assign + " = " + parts.join(op) + ";",...ids);
            }
        }
    }
    function groupOperator(parts,ids,scale,off,op) {
        if(scale !== 1) {
            if(off !== 0) {
                addLine("value#0 = (" + parts.join(op) + ") * scale#0 + offset#0;",...ids);
            }else{
                addLine("value#0 = (" + parts.join(op) + ") * scale#0;",...ids);
            }
        }else{
            if(off !== 0) {
                addLine("value#0 = (" + parts.join(op) + ") + offset#0;",...ids);
            }else{
                addLine("value#0 = " + parts.join(op) + ";",...ids);
            }
        }
    }
    function groupOperatorFunc(parts,ids,scale,off,op, func, modify = "") {
        if(scale !== 1) {
            if(off !== 0) {
                addLine("value#0 = "+ func + "(" + parts.join(op) + ") " + modify + " * scale#0 + offset#0;",...ids);
            }else{
                addLine("value#0 = "+ func + "(" + parts.join(op) + ") " + modify + " * scale#0;",...ids);
            }
        }else{
            if(off !== 0) {
                addLine("value#0 = "+ func + "(" + parts.join(op) + ")" + modify + " + offset#0;",...ids);
            }else{
                addLine("value#0 = "+ func + "(" + parts.join(op) + ")" + modify + ";",...ids);
            }
        }
    }
    function simpleFunction(id,scale,off,func) {
        if(scale !== 1) {
            if(off !== 0) {
                addLine("value#0 = "+ func + " * scale#0 + offset#0;",id);
            }else{
                addLine("value#0 = "+ func + " * scale#0;",id);
            }
        }else{
            if(off !== 0) {
                addLine("value#0 = "+ func + " + offset#0;",id);
            }else{
                addLine("value#0 = "+ func + ";",id);
            }
        }
    }
     const functionLink = {
        functions: {
            system: {
                rand: {
                    vars(id){
                        ["value", "scale", "offset"].forEach(name => addVar(name, id));
                    },
                    init(id, scale, offset) {
                        addInit("scale", id, scale);
                        addInit("offset", id, offset);
                    },
                    read(id,scale,off) {
                        simpleFunction(id,scale,off,"Math.random()")
                    },
                },
                acc: {
                    vars(id){
                        ["value",  "offset"].forEach(name => addVar(name, id));
                    },
                    init(id, scale, offset) {
                        addInit("value", id, 0);
                        addInit("offset", id, offset);
                        setResetVal("value", id, 0);
                    },
                    read(id) { addLine("value#0 += offset#0;", id) },
                },
                default: {
                    vars(id){
                        ["value"].forEach(name => addVar(name, id));
                    },
                    init(id, scale, offset) {
                        addInit("value", id, 0);
                    },
                    read(){},
                }
            },
            sum: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperator(parts,ids,scale,off," + ") },
            },
            dif: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperator(parts,ids,scale,off," - ") },
            },
            chase:{
                vars (id){ ["acc","lead","value", "scale", "offset"].forEach(name => addVar(name, id)) },
                init(id, scale, offset) { addInit("acc", id, 0);addInit("scale", id, scale); addInit("offset", id, offset) },
                start(){},
                read,
                end(parts,ids,scale,off) {
                    setResetVal("value", ids[0], "undefined");
                    setResetVal("acc", ids[0], 0);
                    addLine("lead#0 = (" + parts.join(" + ") + ");",...ids);
                    addLine("value#0 === undefined && (value#0 = lead#0);",...ids);
                    addLine("value#0 += (acc#0 = (acc#0 += (lead#0 - value#0) * scale#0) * offset#0);",...ids);
                },
            },
            spring:{
                vars (id){ ["speed","lead","value", "scale", "offset"].forEach(name => addVar(name, id)) },
                init(id, scale, offset) { addInit("acc", id, 0);addInit("scale", id, scale); addInit("offset", id, offset) },
                start(){},
                read,
                end(parts,ids,scale,off) {
                    setResetVal("value", ids[0], "undefined");
                    addLine("lead#0 = (" + parts.join(" + ") + ");",...ids);
                    addLine("value#0 === undefined && (value#0 = lead#0, speed#0 = 0);",...ids);
                    addLine("dif = Math.abs(lead#0 - value#0);",...ids);
                    addLine("value#0 += (speed#0 = (speed#0 += Math.sign(lead#0 - value#0) * (dif < 10 ? scale#0 * (dif / 10) : scale#0)) * (1 - offset#0));",...ids);
                },
            },
           /* select: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    var count = parts.length - 1;
                    addVar("idx","",undefined,true);
                    addLine("idx = Math.floor(" + parts[0] + " * " + count + ");",...ids);
                    addLine("if(idx < 1) {",...ids);
                    addLine("    value#0 = " + parts[1] + ";",...ids);
                    addLine("} else if(idx >= "+(count - 1)+") {",...ids);
                    addLine("    value#0 = " + parts[count] + ";",...ids);
                    addLineS("}");
                    if(count > 2) {
                        let i = 2;
                        while(i < count - 1) {
                            addLine("else if(idx < "+i+") {",...ids);
                            addLine("    value#0 = " + parts[i] + ";",...ids);
                            addLineS("}");
                            i ++;
                        }
                        addLineS("else {");
                        addLine("    value#0 = " + parts[i] + ";",...ids);
                        addLineS("}");
                    }
                }
            },*/
            select: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    var count = parts.length - 1;
                    addVar("idx","",undefined,true);
                    addLine("idx = Math.floor(" + parts[0] + " * " + count + ");", ...ids);
                    addLine("if (idx < 1) { value#0 = " + parts[1] + " }", ...ids);
                    addLine("else if (idx >= " + (count - 1) +") { value#0 = " + parts[count] + " }", ...ids);
                    if(count > 2) {
                        let i = 2;
                        while(i < count - 1) {
                            addLine("else if (idx < " + i + ") { value#0 = " + parts[i] + " }", ...ids);
                            i ++;
                        }
                        addLine("else { value#0 = " + parts[i] + " }", ...ids);
                    }
                }
            },
            /*swch: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    addVar("swch", ids[0], undefined, true);
                    addVar("idx", ids[0], undefined, true);
                    addVar("val", ids[0], undefined, true);
                    addLine("swch#0 === undefined && (swch#0 = Math.floor(" + parts[0] + ") + 1, idx#0 = val#0 = 0);", ...ids);
                    addLine("(" + parts[0] + " > 1 || " + parts[0] + " < 0) && (", ...ids);
                    addLine("    idx#0 = (idx#0 + (" + parts[0] + "< 0 ? " + (parts.length - 2) + ": 1)) % " + (parts.length - 1) + ",", ...ids);
                    addLine("    swch#0 = Math.floor(" + parts[0] + ") + 1,", ...ids);
                    const pp = [...parts];
                    pp.shift();
                    addLine("    val#0 = Math.select(idx#0, " + pp.join(", ") + ") * scale#0 + offset#0", ...ids);
                    addLineS(");");
                    addLine("value#0 = val#0;", ...ids);
                }
            },*/
            swch: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    const p = parts[0];
                    const pp = [...parts];
                    pp.shift();
                    addVar("swch", ids[0], undefined, true);
                    addVar("idx", ids[0], undefined, true);
                    addVar("val", ids[0], undefined, true);
                    addLine("swch#0 === undefined && (swch#0 = Math.floor(" + p + ") + 1, idx#0 = val#0 = 0);", ...ids);
                    addLine(
                        "(" + p + " > 1 || " + p + " < 0) && (" +
                        " idx#0 = (idx#0 + (" + p + "< 0 ? " + (parts.length - 2) + ": 1)) % " + (parts.length - 1) + "," +
                        " swch#0 = Math.floor(" + p + ") + 1," +
                        " val#0 = Math.select(idx#0, " + pp.join(", ") + ") * scale#0 + offset#0 );"
                        , ...ids);
                    addLine("value#0 = val#0;", ...ids);
                }
            },
            /*trig: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    addLine("if(" + parts[0] + " < 0) {",...ids)
                    const pp = [...parts];
                    pp.shift();
                    addLine("    value#0 = (" + pp.join(" + ") + ") * scale#0 + offset#0;",...ids);
                    addLineS("} else {");
                    addLine("    value#0 = undefined;",...ids);
                    addLineS("}")
                }
            },*/
            trig: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    const pp = [...parts];
                    pp.shift();
                    addLine("if (" + parts[0] + " < 0) { value#0 = (" + pp.join(" + ") + ") * scale#0 + offset#0 }", ...ids);
                    addLine("else { value#0 = undefined }", ...ids);
                }
            },
            vClamp: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    if(parts.length === 1) {
                        var first = parts[0];
                        addLine("value#0 = "+first+" < scale#0 ? scale#0 : "+first+" > offset#0 ? offset#0 : "+first+";",...ids);
                    } else if(parts.length === 2) {
                        addLine("if ("+parts[1]+" < 0) {", ids)
                        addLine("    value#0 = (" + parts[0] + " < " + parts[1] + " ? " + parts[1] + " : " + parts[0] + " > 0 ? 0 : " + parts[0] + ") * scale#0 + offset#0;", ids);
                        addLineS("} else {")
                        addLine("    value#0 = (" + parts[0] + " < 0 ? 0 : " + parts[0] + " > " + parts[1] + " ? " + parts[1] + " : " + parts[0] + ") * scale#0 + offset#0;", ids);
                        addLineS("}")
                    } else {
                        addLine("value#0 = (" + parts[0] + " < " + parts[1] + " ? " + parts[1] + " : " + parts[0] + " > " + parts[2] + " ? " + parts[2] + " : " + parts[0] + ") * scale#0 + offset#0;", ids);
                    }
                }
            },
            vMod: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    if(parts.length === 1) {
                        var first = parts[0];
                        addLine("value#0 = ("+first+" % offset#0 + offset#0) % offset#0;",...ids);
                    } else {
                        const pp = [...parts];
                        var first = pp.shift();
                        addLine("value#0 = (((" + pp.join(" + ") + ") * scale#0 + offset#0) % "+first+" + "+first+") % "+first+";",...ids);
                    }
                }
            },
            vMod: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    if(parts.length === 1) {
                        var first = parts[0];
                        addLine("value#0 = Math.cMod("+first+", offset#0);",...ids);
                    } else {
                        const pp = [...parts];
                        var first = pp.shift();
                        addLine("value#0 = Math.cMod(" + pp.join(" + ") + "," + first + ");", ...ids);
                    }
                }
            },
            toUnit: {
                vars, init, start(){}, read,
                end(parts,ids, scale, off) {
                    if(parts.length === 1) {
                        if(Math.abs(scale) < 0.01) {scale = scale < 0 ? -0.01 : 0.01; }
                        var first = parts[0];
                        addLine("value#0 = ("+first+" - offset#0) / scale#0;",...ids);
                    } else {
                        const pp = [...parts];
                        var first = pp.shift();
                        addLine("value#0 = ((" + pp.join(" + ") + ") * scale#0 + offset#0) / Math.notZero("+first+");",...ids);
                    }
                    addLine("value#0 = value#0 < 0 || value#0 === NaN ? 0 : value#0 > 1 ? 1 : value#0;",...ids);
                }
            },
            clamp:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    addLine("value#0 = (" + parts.join(" + ") + ");",...ids);
                    addLine("value#0 = value#0 < 0 ? 0 : value#0 > 1 ? 1 : value#0;;",...ids);
                },
            },
            mean:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off," + ","", " / " + parts.length) },
            },
            hypot:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.hypot") },
            },
            vdot:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.vecDot2d") },
            },
            vcross:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.vecCross2d") },
            },
            uvdot:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.uVecDot2d") },
            },
            uvcross:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.uVecCross2d") },
            },
            svdot:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.sVecDot2d") },
            },
            svcross:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.sVecCross2d") },
            },
            vAng:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts,ids,scale,off,", ","Math.angleVec2d") },
            },
            min:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    groupOperatorFunc(parts,ids,scale,off,", ","Math.min");
                },
            },
            max:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    groupOperatorFunc(parts,ids,scale,off,", ","Math.max");
                },
            },
            tan2:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    if(parts.length < 2) { throw new Error("Function link tan2 requiers 2 inputs, only " + parts.length + " set" ) }
                    if(parts.length > 2) { addLine("/* WARNING " + (parts.length - 2) + " inputs ignored */") }
                    groupOperatorFunc([parts[1],parts[0]],ids,scale,off,", ","Math.atan2");
                },
            },
            flr:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.floor") },
            },
            rnd:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.round") },
            },
            abs:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.abs") },
            },
            sqrt:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.sqrt") },
            },
            sqr:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.sqr") },
            },
            pow:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    const pp = [...parts];
                    const last = pp.pop();
                    addLine("value#0 = Math.abs(" + pp.join(" + ") + ") ** " + last + " * scale#0 + offset#0;",...ids) ;
                },
            },
            ecurve:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { addLine("value#0 = eCurve(" + parts.join(" + ") + ", scale#0) + offset#0;",...ids) },
            },
            scurve:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { addLine("value#0 = sCurve(" + parts.join(" + ") + ", scale#0) + offset#0;",...ids) },
            },
            sqrWave:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { addLine("value#0 = sqrWave((" + parts.join(" + ") + ") * scale#0 + offset#0);",...ids) },
            },
            pulseWave: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    if(parts.length === 0) {
                        addLine("value#0 = 0;", ...ids);
                    } else if(parts.length === 1) {
                        addLine("value#0 = sqrWave((" + parts.join(" + ") + ") * scale#0 + offset#0);",...ids);
                    } else {
                        const pp = [...parts], first = pp.shift();
                        addLine("value#0 = (Math.abs(" + first + " * scale#0 + offset#0) % 1) < Math.abs((" + pp.join(" + ") + ") % 1) ? 1 : 0;", ...ids);
                    }
                },
            },
            triangleWave: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    if(parts.length === 0) {
                        addLine("value#0 = 0;", ...ids);
                    } else if(parts.length === 1) {
                        addLine("value#0 = (Math.abs((" + parts.join(" + ") + ") * scale#0 + offset#0) % 1) * 2;",...ids);
                        addLine("value#0 = value#0 <= 1 ? value#0 : 2 - value#0;", ...ids);
                    } else {
                        const pp = [...parts], first = pp.shift();
                        addLine("dif = Math.abs(" + pp.join(" + ") + ") % 1;", ...ids);
                        addLine("val = Math.abs(" + first + " * scale#0 + offset#0) % 1", ...ids);
                        addLine("value#0 =  val < dif ? val / dif : val > dif ? 1 - (val - dif) / (1 - dif) : 0;", ...ids);
                    }
                },
            },
            cmpEq: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    if(parts.length > 1) {
                        const pp = [...parts], joiner = " === " + pp.shift();
                        addLine("value#0 = (" + pp.join(joiner + " && ") + joiner + ") ? 1 : 0;", ...ids);
                    } else if(parts.length === 1) {
                        addLine("value#0 = 1;", ...ids);
                    } else {
                        addLine("value#0 = 0;", ...ids);
                    }

                }
            },
            cmpGtLt: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {
                    if(parts.length < 2) {
                        addLine("value#0 = 0;", ...ids);
                    } else {
                        const pp = [...parts];
                        const joiner = (scale > 0 ? " > " : " < ") + pp.shift();
                        addLine("value#0 = (" + pp.join(joiner + " || ") + joiner + ") ? 1 : 0;", ...ids);
                    }
                }
            },
            sign:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.sign") },
            },
            sin:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.sin") },
            },
            cos:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.cos") },
            },
            asin:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.asinc") },
            },
            acos:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.acosc") },
            },
            tan:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.tan") },
            },
            div: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) { groupOperator(parts.map((part, i) => i > 0 ? "("+part+" ? "+part+" : 1)" : part),ids,scale,off," / ") },
            },
            mult: {
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperator(parts,ids,scale,off," * ") },
            },
            mod:{
                vars, init, start(){}, read,
                end(parts,ids,scale,off) {  groupOperatorFunc(parts,ids,scale,off," + ","Math.mod") },
            },
            acc: {
                vars, init, start(){},read,
                end(parts,ids,scale,off) {
                    setResetVal("value", ids[0], "0");
                    /*addLine("if (value#0 === undefined) {",...ids);
                    addLine("    value#0 = 0;",...ids);
                    addLineS("}");*/
                    if(scale !== 1) {
                        addLine("value#0 += (" + parts.join(" + ") + ") * scale#0 + offset#0;",...ids);
                    }else {
                        addLine("value#0 += (" + parts.join(" + ") + ") + offset#0",...ids);
                    }
                },
            },
            delay: {
                vars, init, start(){},read,
                end(parts,ids,scale,off) {
                    addVarInit("delay",ids[0],"undefined",);
                    doNotOptimiseVar("delay",ids[0]);
                    setResetVal("delay",ids[0],"undefined");
                    groupOperatorAssign(parts,ids,scale,off," + ","val");
                    addLine("if (delay#0 === undefined) {",...ids);
                    addLine("    delay#0 = value#0 = val;",...ids);
                    addLineS("}");
                    addLine("value#0 = delay#0;",...ids);
                    addLine("delay#0 = val;",...ids);
                }
            },
            rand: {
                vars, init, start(){},read,
                end(parts,ids,scale,off) { groupOperatorFunc(parts, ids, scale, off, " + ", "Math.rand") },
            },
            spr: {
                vars(id){ ["spSet", "cap"].forEach(name => addVar(name, id)) },
                init(id, scale, offset) {
                    addInit("cap", id, "true");
                    setResetVal("cap", id, "true");
                    setResetVal("spSet", id,"new Set()")
                },
                start(){},
                read:{ sprite: "spr##.$$", fLink: "value##" },
                end(parts,ids,scale,off) {
                    if(parts.length >= 2) {
                        addLine("if(cap#0) {",...ids);
                        addLine("    spSet#0.clear();",...ids);
                        let idx = 0;
                        for(const part of parts) {
                            if(idx > 0) {
                                addLine("    spSet#0.add(spr#"+idx+");",...ids);
                            }
                            idx ++;
                        }
                        addLine("    spSet#0.asArray = [...spSet#0.values()];",...ids);
                        addLine("    cap#0 = false;",...ids);
                        addLineS("};");
                    }
                }
            }
        },
        input: {
            system: {
                f:"animation.frame",
                t:"animation.seconds",
                gt:"globalTime / 1000",
                al:"animation.length",
                asf:"animation.startTime",
                aef:"animation.endTime",
                R:"colours.mainColor.r * colours.mainColor.r / Math.W16",
                G:"colours.mainColor.g * colours.mainColor.g / Math.W16",
                B:"colours.mainColor.b * colours.mainColor.b / Math.W16",
                RGB:"colours.mainColor",
                v:"0",
                default:"0",
                pi:"Math.PI",
                vX: "flData.viewTopLeft.x",
                vY: "flData.viewTopLeft.y",
                vCX:"flData.viewCenter.x",
                vCY:"flData.viewCenter.y",
                vW: "flData.viewSize.x",
                vH: "flData.viewSize.y",
                vS: "flData.viewScale",
            },
            sprite: { // ## represents right side of expression reference id. The str in appened to `spr##.`
                v: "fLink.value",
                x: "x",
                y: "y",
                rx: "rx",
                ry: "ry",
                sx: "sx",
                sy: "sy",
                w: "type.normalisable ? spr##.w : spr##.w * spr##.sx",
                h: "type.normalisable ? spr##.h : spr##.h * spr##.sy",
                iW: "type.image ? (spr##.type.subSprite ? spr##.subSprite.w : spr##.image.w) : spr##.w",
                iH: "type.image ? (spr##.type.subSprite ? spr##.subSprite.h : spr##.image.h) : spr##.h",
                a: "a",
                R: "rgb.r2 / Math.W16",
                G: "rgb.g2 / Math.W16",
                B: "rgb.b2 / Math.W16",
                RGB: "rgb",
                palC: "type.pallet ? spr##.pallet.length : 0",
                ax: "attachment.x",
                ay: "attachment.y",
                mx: "key.lx",
                my: "key.ly",
                fo: "fLink.offset",
                fs: "fLink.scale",
                shpI: "type.shape ? spr##.shape.inner : 0",
                shpR: "type.shape ? spr##.shape.radius: 0",
                shpC: "type.shape ? spr##.shape.sides: 1",
                shpA: "type.shape ? spr##.shape.valB * 4 / Math.TAU : 0",
                shpB: "type.shape ? spr##.shape.valB * 4 / Math.TAU : 0",
                mOver: "key.over ? 1 : 0",
                text: "type.text ? (isNaN(spr##.textInfo.text) ? 0 : Number(spr##.textInfo.text)) : 0",
                img: "type.imgSequence ? spr##.imageIdx : 0",
                subSpr: "type.subSprite ? spr##.subSpriteIdx : 0",
                sel: "selected ? 1 : 0",
                spr: "isSprite ? 0 : 0",
            },
            brace: {  // if on this list input must be enclosed in () to work
                mOver: true,
                w: true,
                h: true,
                iW: true,
                iH: true,
                text: true,
                subSpr: true,
                img: true,
                shpI: true,
                shpR: true,
                shpC: true,
                shpA: true,
                shpB: true,
                R: true,
                G: true,
                B: true,
                sel: true,
                spr: true,
                palC: true,
            },
        },
        output: {
            funcLink: {
                v(...ids) { addLine("if(value#1 !== undefined) { value#0 = value#1 }",...ids) },
            },
            sprite: {
                v(){ return ["if(value#1 !== undefined) { value#0 = value#1 }"]},
                x() { return ["spr#0.x = value#1;","spr#0.key.update();",widgetUpdate]},
                y() { return ["spr#0.y = value#1;","spr#0.key.update();",widgetUpdate]},
                r() { addVarInit("roff","");return ["roff = spr#0.ry - spr#0.rx;", "spr#0.rx = value#1;", "spr#0.ry = value#1 + roff;",  "spr#0.key.update();",widgetUpdate ]},
                r() { return ["spr#0.key.rotate(value#1)",  "spr#0.key.update();",widgetUpdate ]},
                rx(){ return ["spr#0.rx = value#1;","spr#0.key.update();",widgetUpdate]},
                ry(){ return ["spr#0.ry = value#1;","spr#0.key.update();",widgetUpdate]},
                s() { return ["spr#0.setScale(value#1, value#1);",widgetUpdate]},
                sx(){ return ["spr#0.setScale(value#1, spr#0.sy);",widgetUpdate]},
                sy(){ return ["spr#0.setScale(spr#0.sx, value#1);",widgetUpdate]},
                w() { return ["spr#0.setScale(value#1 / spr#0.w, spr#0.sy);",widgetUpdate]},
                h() { return ["spr#0.setScale(spr#0.sx, value#1 / spr#0.h);",widgetUpdate]},
                swh() { return ["spr#0.setScale(value#1 / spr#0.w, value#1 / spr#0.h);",widgetUpdate]},
                a() { return ["spr#0.a = value#1 < 0 ? 0 : value#1 > 1 ? 1 : value#1;"]},
                R() { return ["spr#0.rgb.r = (spr#0.rgb.r2 = Math.unit((value#1.r !== undefined ? value#1.r * value#1.r / Math.W16 : value#1)) * Math.W16) ** 0.5 | 0;", "spr#0.rgb.update();"] },
                G() { return ["spr#0.rgb.g = (spr#0.rgb.g2 = Math.unit((value#1.g !== undefined ? value#1.g * value#1.g / Math.W16 : value#1)) * Math.W16) ** 0.5 | 0;", "spr#0.rgb.update();"] },
                B() { return ["spr#0.rgb.b = (spr#0.rgb.b2 = Math.unit((value#1.b !== undefined ? value#1.b * value#1.b / Math.W16 : value#1)) * Math.W16) ** 0.5 | 0;", "spr#0.rgb.update();"] },
                RGB() {
                    return [
                        "if(value#1.g !== undefined) { ",
                        "    spr#0.rgb.fromRGB(value#1);",
                        "} else {",
                        "    spr#0.rgb.r = spr#0.rgb.g = spr#0.rgb.b = (spr#0.rgb.r2 = spr#0.rgb.g2 = spr#0.rgb.b2 = Math.unit(value#1) * Math.W16) ** 0.5 | 0;",
                        "    spr#0.rgb.update();",
                        "}"
                    ];
                },
                mx(){ return ["spr#0.key.funcLinkLock |= 1;","spr#0.key.flx = value#1;"]},
                my(){ return ["spr#0.key.funcLinkLock |= 2;","spr#0.key.fly = value#1;"]},
                fs(){ return ["spr#0.type.functionLink && (spr#0.fLink.scale = value#1);"]},
                fo(){ return ["spr#0.type.functionLink && (spr#0.fLink.offset = value#1);"]},
                shpR(){ return ["spr#0.type.shape && (spr#0.shape.radius = value#1);"]},
                shpI(){ return ["spr#0.type.shape && (spr#0.shape.inner = value#1);"]},
                shpC(){ return ["spr#0.type.shape && (spr#0.shape.sides = Math.round(value#1));"]},
                shpA(){ return ["spr#0.type.shape && (spr#0.shape.valA = value#1 / Math.TAU * 4);"]},
                shpB(){ return ["spr#0.type.shape && (spr#0.shape.valB = value#1 / Math.TAU * 4);"]},
                ax(){ return ["spr#0.type.attached && (spr#0.attachment.x = value#1, spr#0.attachment.position());","spr#0.key.update();",widgetUpdate]},
                ay(){ return ["spr#0.type.attached && (spr#0.attachment.y = value#1, spr#0.attachment.position());","spr#0.key.update();",widgetUpdate]},
                text(){ return [
                    "spr#0.type.text && ((spr#0.textInfo.text = value#1.toFixed(4)),spr#0.key.update());",
                    //"spr#0.type.text && (spr#0.textInfo.text = spr#0.textInfo.content.text.replace(/(#+\.#*)|(#+)|(^$)/, (str,f,i) => f?value#1.toFixed(f.split(.)[0].length):(i?value#1.toFixed(0):value#1.toFixed(6))),spr#0.key.update());",
                    widgetUpdate
                ]},
				subSpr() { return ["spr#0.type.subSprite && (spr#0.changeToSubSprite(value#1 < 0 ? 0 : value#1 | 0));"]},
                img() { return [
                    "spr#0.type.imgSequence && (spr#0.image = spr#0.imgSequence[spr#0.imageIdx = ((v % spr#0.imgSequence.length + spr#0.imgSequence.length) % spr#0.imgSequence.length) | 0]);",
                    widgetUpdate
                ]},
                spr(){ return ["spr#0.type.functionLink && (spSet#0 = spr#1.spSet);"]},
            },
        },
    };
    function create(spr){
        addLine("//-------------------------------")
        addLine("// sprite '"+ spr.name+"` #0",spr.guid)
        addConstInit("spriteIDS","","##SPR_IDS##",true);
        const f = spr.fLink;
        const i = f.inputs;
        const o = f.outputs;
        const id = spr.guid;
        if (i.length) {
            const func = functionLink.functions[f.type];
            func.vars(id);
            func.init(id, f.scale, f.offset);
            addLine("// Read function `"+f.type+"` with "+i.length+" inputs")
            const ids = i.map(spr => spr.guid);
            ids.unshift(id);
            const parts = [];
            var idx = 1;
            for (const s of i) {
                const brace = functionLink.input.brace[f.inFrom] ? ["(",")"] : ["",""];
                if (s.type.functionLink) {
                    parts.push( brace[0]+ func.read.fLink.replace("##", "#" + idx) + brace[1] );
                    if(s.isNamedInLink) { cInput.add(s.guid) }
                } else {
                    addConstInit("spriteList","","sprites.createIdMapOf(spriteIDS)",true);
                    addVarInitSpr("spr",ids[idx],"getSprite(" + ids[idx] + ")", true);
                    addSpriteId(ids[idx],spr.name,"input");

                    if(s.isNamedInLink) { cInput.add(s.guid) }
                    parts.push( brace[0]+  func.read.sprite.replace("$$", functionLink.input.sprite[f.inFrom]).replace(/##/g, "#" + idx) + brace[1] );
                }
                idx ++;
            }
            func.end(parts,ids,f.scale, f.offset);
        }else {
            const input = functionLink.input.system[f.inFrom];
            if(input) {
                const func = functionLink.functions[f.type];
                addLine("// No inputs for '"+f.inFrom+"' binding to self ")
                func.vars(id);
                func.init(id, f.scale, f.offset);
                func.end([input],[id],f.scale, f.offset);
            }else{
                log.warn("Unbound sprite requires "+f.inFrom+" binding.");
                spr.type.flagged = true;
                spr.flag = "Unbound! Requires "+f.inFrom+" binding.";
                warnings ++;

                const func = functionLink.functions.system[f.type] ?  functionLink.functions.system[f.type] :  functionLink.functions.system.default;
                func.vars(id);
                func.init(id, f.scale, f.offset);
                func.read(id, f.scale, f.offset);
            }
        }
        if(o.length) {
            addLine("// write func")
            const out = functionLink.output.sprite[f.outTo]();
            const fout = functionLink.output.funcLink[f.outTo];
            for (const s of o) {
                if (s.type.functionLink || !out) {
                    if(fout){
                        fout(s.guid, id);
                    }else{
                        addVar("value", s.guid)
                        addLine("value#0 += value#1;",s.guid, id);
                    }
                }else{
                    for(const oo of out) {
                        addConstInit("spriteList","","sprites.createIdMapOf(spriteIDS)",true);
                        addVarInitSpr("spr",s.guid,"getSprite(" + s.guid + ")", true);
                        addSpriteId(s.guid ,spr.name,"output");
                        if(s.isNamedOutLink) { cOutput.add(s.guid) }
                        addLine(oo,s.guid,id);
                    }
                }
            }
        }
    };
    const functionMap = {
        update: [[
            "const flData = functionLinkBuilder.data;",
            "const vals = [];",
            "function update() {",
            "    if (!API.active) { return }",
            "    var val, dif;",
            ""
        ],["}",""]],
        reset: [[
            "function reset() {",
            "",
        ],["}",""]],
        setSprites: [[
                "var linkCount = 0;",
                "var linksCount = 0;",
                "function getSprite(id) {",
                "    const spr = spriteList.get(id);",
                "    linksCount ++;",
                "    spr && (linkCount ++);",
                "    return spr;",
                "}",
                "function setSprites() {",
                "    linksCount = linkCount = 0",
                ""
            ],[
                "    API.active = linksCount === linkCount;",
                "    reset();",
                "}",
                ""
            ]],
        API: [[
                "const API = {",
                "    updateWidget: false,",
                "    active: false,",
                "    reset,",
                "    spriteIDS,",
                "    spriteList,",
                "    inputs: [##inputNames##],",
                "    outputs: [##outputNames##],",
                "    bind(spr, id) {",
                "        if (spriteList.has(id)) {",
                "            spriteList.set(id,spr);",
                "            setSprites();",
                "        }",
                "    },",
                "    getById(id) { return spriteList.get(id) },",
                "",
            ],[
                "};",
                "setSprites();",
                "",
            ]
        ],
        create(name, code, indent = "") {
            var str = functionMap[name][0].join("\n");
            str += typeof code === "string" ? (indent + code.replace(/\n/g,"\n"+indent) + "\n") : code.map(l => indent + l).join("\n");
            str += functionMap[name][1].join("\n");
            return str;
        },
    };

    const cInput = new Set();
    const cOutput = new Set();

    const API = {
        compiledOK: false,
        funcs: [],
        applyTo(spr) {
            if(spr.type.functionLink && API.compiledOK) {
                API.compiledOK = false;
                spr.fLink.funcObj = API.func;
                [...inputIds.values()].forEach(id => {
                    const s = sprites.getByGUID(id.id);
                    spr.fLink.inputs.push(s);
                });
                [...outputIds.values()].forEach(id => {
                    const s = sprites.getByGUID(id.id);
                    spr.fLink.outputs.push(s);
                });
                spr.fLink.type = "Compiled";
                inputIds.clear();
                outputIds.clear();
                cInput.clear();
                cOutput.clear();
                varMap.clear();
                sprMap.clear();
                sprIds.length = 0;
                API.func = undefined;
            }
        },
        options:{
            removeUnusedVars: true,
            removeComments: true,
            removeEmptyLines: false,
            constNumbersToLiteral: true,
            optimiseVars: true,
            optimiseSpriteUpdate: true,
            optimiseClean: false,
            doNotMount: false,
            orderByInput: false,
            zeroUninit: true,
            optimisePostCompile: true,
            postCompileBakePies: true,
            //postCompileRotateSquares: true,
            postCompileReuseVars: true,

            save: true,
            filename:"TestFuncLinkCompile.js",
        },
        linkCode(options){
            options = {
                ...API.options,
                mime:"text/javascript",
                ...options
            };
            var code = lines.join("\n");
            if(options.removeUnusedVars) {
                for(const v of varMap.values()) {
                    if(!v.keep) {
                        if(!code.includes(v.name + v.id)){
                            varMap.delete(v.name + v.id);
                        }
                    }
                }
            }
            if(options.removeComments) {
                lines = lines.filter(line => !(line[0] === "/" && line[1] === "/"));
            }
            if(options.removeEmptyLines) {
                lines = lines.filter(line => !line.trim() === "");
            }
            for (const v of varMap.values()) {
                if(v.name !== "spr" && v.resetVal === undefined) {
                    const right = lines.findIndex(line => line.indexOf(v.name + v.id) > -1);
                    const left = lines.findIndex(line => line.indexOf(v.name + v.id + " = ") > -1);
                    if(right > -1 && left > -1 && right < left) {
                        v.resetVal = 0;
                    }
                }
            }


            code = lines.join("\n");
            if(options.constNumbersToLiteral) {
                for(const v of varMap.values()) {
                    if(!v.keep) {
                        if(v.init !== undefined && !code.includes(v.name + v.id + " =")){
                            const r = new RegExp(v.name + v.id,"g");
                            code = code.replace(r,v.init);
                            varMap.delete(v.name + v.id);
                        }
                    }
                }
                code.replace(/\(([0-9]*?)\)/g,"$1");
                code.replace(/\((-[0-9]*?)\)/g,"$1");
                code.replace(/\((-[0-9]*?.[0-9]*?)\)/g,"$1");
            }
            var clean = false;
            const exp = {
                assignment: /(?<prop>[a-z]+[0-9]+(\.[a-z]+)+(?= = ))|(?<var>[a-z]+[0-9]+(?= = ))|(?<localVar>[a-z]+(?= = ))/gi,
                allVars: /(?<prop>[a-z]+[0-9]+(\.[a-z]+)+)|(?<var>[a-z]+[0-9]+)|(?<localVar>[a-z]+)/gi,
                number: /(\b-{0,1}[0-9]+\.*[0-9]*)/g,
                tokens: /\bwhile \(|\bif \(|\{|\}|\belse\b|\)|\b{\b|===|!==|<=|>=|<|>|\?|:|;/g

            }
            const lineBreakDown = (line) => {
                var f, vars = [];
                while((f = exp.allVars.exec(line)) !== null) {
                }
            }
            if (options.optimiseVars) {
                clean = true;
                code = code.split("\n");
                const canRemove = [];
                for (const v of varMap.values()) {
                    if (!v.doNotOptimise) {
                        var varState = undefined;
                        var idx = 0, atLine = undefined, toLines = [], ignore = false;
                        var isComplex;
                        for(const line of code) {
                            var line1 = line.trim();
                            if(!line1.includes("/*")){
                                if(line1.indexOf(v.name + v.id + " = ") === 0) {
                                    if(!varState) {
                                        varState = "("+line1.split(v.name + v.id + " = ")[1].split(";")[0] +")";
                                        isComplex = /[+-\/*%|&=]/.test(varState);
                                        atLine = idx;
                                    }else {
                                        ignore = true;
                                        break;
                                    }
                                }else if(varState && line1.includes(v.name + v.id)) {
                                    const eqidx = line1.indexOf("=");
                                    const vidx = line1.indexOf(v.name + v.id, eqidx);
                                    if(vidx > eqidx) {
                                        if (isComplex && toLines.length > 0) {
                                            ignore = true;
                                            break;
                                        }else{
                                            toLines.push(idx);
                                        }

                                    }else {
                                        ignore = true;
                                        break;
                                    }

                                }
                            }
                            idx++;
                        }
                        if(!ignore && atLine !== undefined && toLines.length) {
                            for(const lidx of toLines) {
                                code[lidx] = code[lidx].replace(new RegExp(v.name + v.id,"g"), varState);
                            }
                            code.splice(atLine,1);
                            canRemove.push(v);
                        }
                    }
                }
                code = code.join("\n");
                for(const v of canRemove) {
                    if(!code.includes(v.name + v.id)) {
                        varMap.delete(v.name + v.id);
                    }
                }
            }
            if (options.optimiseSpriteUpdate) {
                clean = true;

                code = code.split("\n");
                let selectedSpr = new Set();
                for (const v of sprMap.values()) {
                    let prevLine = -1;
                    let idx = 0;
                    let removeLines = [];
                    for(const line of code) {
                        const line1 = line.trim();
                        if(line1.indexOf(v.name + v.id + ".key.update();") === 0) {
                            if(prevLine !== -1) {
                                removeLines.push(prevLine);
                            }
                            prevLine = idx;
                        }else if(line1.indexOf("API.updateWidget = " + v.name + v.id + ".selected") === 0) {
                            removeLines.push(idx);
                            selectedSpr.add(v)
                        }
                        idx ++;
                    }
                    let i = code.length;
                    while(i--) {
                        if(removeLines.includes(i)) {
                            code.splice(i,1);
                        }
                    }
                }
                if( selectedSpr.size ) {
                    code.push("API.updateWidget = "+[...selectedSpr.values()].map(v => v.name + v.id+".selected").join(" || ") + ";");
                }
                code = code.join("\n");
            }
            var varsC = varsToCode();
            var varsS = sprsToCode();
            if(clean && API.options.optimiseClean) {
                let pLen;
                let cleaned = 0;
                for(const name of names.values()) {
                    const reg = new RegExp("\\(("+name + "[0-9]+?)\\)","g");
                    do {
                        pLen = code.length;
                        code = code.replace(reg,"$1");
                        cleaned += pLen !== code.length ? 1 : 0;
                    } while(pLen !== code.length);
                    code += "/* cleaned () from "+ name + " " + cleaned + " times */\n";
                    cleaned = 0;
                }
            }
            var varsR = resetToCode();
            varsC = varsC.replace("##SPR_IDS##","[" + sprIds.join(", ") + "]");
            var linked = [
                varsC,
                functionMap.create("update",code,"    "),
                functionMap.create("setSprites",varsS,"    "),
                functionMap.create("reset",varsR,"    "),
                functionMap.create("API","    update,"),
                "return API;",
            ].join("\n");
            var inNames = [];
            var outNames = [];
            var sprNames = new Map();
            for(const inp of cInput.values()) {
                const ss = sprites.getById(inp);
                if(ss && ss.isNamedInLink) {
                    inNames.push("['" + ss.name + "'," + ss.guid + "]");
                    if(!sprNames.has(inp)) {
                        if (ss.isNamedOutLink) {
                            sprNames.set(inp,ss.name + "InOut");
                        } else {
                            sprNames.set(inp,ss.name + "In");
                        }
                    }
                }
            }
            for(const outp of cOutput.values()) {
                const ss = sprites.getById(outp);
                if(ss && ss.isNamedOutLink) {
                    outNames.push("['" + ss.name + "'," + ss.guid + "]")
                    if(!sprNames.has(outp)) {
                        if (!ss.isNamedInLink) {
                            sprNames.set(outp,ss.name + "Out");
                        }
                    }
                }
            }
            var nIdx = 1;
            var usedNames = new Set();
            for(const [id, name] of sprNames.entries()) {
                if(usedNames.has(name)) {
                    usedNames.add(name + nIdx);
                    sprNames.set(id, name + (nIdx++))
                } else {
                    usedNames.add(name);
                }
            }

            const inputNames = inNames.join(", ");
            const outputNames = outNames.join(", ");
            linked = linked.replace(/##outputNames##/g, outputNames).replace(/##inputNames##/g, inputNames);

            for(const [id, name] of sprNames.entries()) {
                linked = linked.replace(new RegExp("spr" + id,"g"), name[0].toLowerCase() + name.substring(1));
            }
            var postLinkDetails = "";
            if (API.options.optimisePostCompile) {
                [linked, postLinkDetails] = functionLinkOptimiser(linked, API.options);
            }
            var opts = "/*******************************************************************************\n";
            for(const opt of Object.keys(API.options)) {
               opts += " " + opt + ": " + API.options[opt]+ ",\n"
            }
            opts += postLinkDetails;
            opts += " *******************************************************************************/\n";
            return opts + linked;
        },
        linkCompiledAndApply(spr, funcSource, ids, inputs = [], outputs = [], jSprite) {
            var errors = 0, func;
            for (const id of ids) {
                if (id[2] > -1) {
                    funcSource = funcSource
                        .replace(new RegExp("" + id[2], "g"), "" + id[0])
                        .replace(new RegExp("" + id[0], "g"), "" + id[1]);
                } else {
                    funcSource = funcSource.replace(new RegExp("" + id[0], "g"), "" + id[1]);
                }
                inputs.forEach((s, i) => {
                    if(s === id[0]) { inputs[i] = id[1] }
                });
                outputs.forEach((s, i) => {
                    if(s === id[0]) { outputs[i] = id[1] }
                });
            }
            API.func = undefined;
            try {
                func = new Function(funcSource);
            } catch(e) {
                errors ++;
                log.error(e);
            }
            if (errors) {
                log.warn("Compiled function links with " + errors + " errors");
                return false;
            } else {
                API.compiledOK = true;
                API.func = func();
                if (jSprite?.fLink?.values) {  API.func.values = {...jSprite.fLink.values}; }
                API.func.setSprites?.();
                API.func.source = funcSource;
            }
            API.compiledOK = false;
            spr.fLink.funcObj = API.func;
            spr.fLink.funcObj.fileSource = jSprite?.fLink?.fileSource ? jSprite?.fLink?.fileSource : undefined;
            inputs.forEach(id => spr.fLink.inputs.push(sprites.getByGUID(id)));
            outputs.forEach(id => spr.fLink.outputs.push(sprites.getByGUID(id)));
            spr.fLink.type = "Compiled";
            API.func = undefined;
            return true;
        },
        compileSelected() {
            if(!sprites.hasFunctionLinks) {
                log.warn("There is nothing to compile");
                API.compiledOK = true;
                return;
            }
            errors = 0;
            warnings = 0;
            cInput.clear();
            cOutput.clear();
            varMap.clear();
            sprMap.clear();
            inputIds.clear();
            outputIds.clear();
            sprIds.length = 0;
            API.compiledOK = false;
            lines.length = 0;
            const added = new Set();
            const fLinks = [];
            sprites.eachFunctionLink(spr => { if(!spr.fLink.funcObj && functionLink.functions[spr.fLink.type]) { fLinks.push(spr) } })
            if(!fLinks.length) {
                log.warn("There is nothing to compile");
                API.compiledOK = true;
                return;
            }
            //fLinks.reverse();
            fLinks.forEach(spr => {
                try{
                    if(!API.options.orderByInput || (spr.fLink.inputs.length === 0 || spr.fLink.inputs.some(spr => !spr.type.functionLink))) {
                        spr.type.flagged = false;
                        spr.flag = "";
                        added.add(spr.guid);
                        create(spr);
                    }
                }catch(e) {
                    spr.type.flagged = true;
                    spr.flag = "Error compiling function link";
                    addLine("/* ====================================================================================")
                    addLine("   Exception : "+e.message+"\n   Compiling sprite "+ spr.guid + " '" + spr.name+"' \n   Function '" + spr.fLink.type +"'")
                    addLine("   ====================================================================================*/")
                    errors ++;
                }
            });
            if(API.options.orderByInput){
                fLinks.forEach(spr => {
                    try{
                        if(spr.fLink.inputs.some(spr => spr.type.functionLink) && !added.has(spr.guid)) {
                            spr.type.flagged = false;
                            spr.flag = "";
                            create(spr);
                        }
                    }catch(e) {
                        spr.type.flagged = true;
                        spr.flag = "Error compiling function link";
                        addLine("/* ====================================================================================")
                        addLine("   Exception : "+e.message+"\n   Compiling sprite "+ spr.guid + " '" + spr.name+"' \n   Function '" + spr.fLink.type +"'")
                        addLine("   ====================================================================================*/")
                        errors ++;
                    }
                });
            }
            API.func = undefined;
            var funcSource = API.linkCode({});

            var func;
            try {
                func = new Function(funcSource);
            } catch(e) {
                errors ++;
                log.error(e);
            }
            if(errors || warnings) {
                if(warnings) {
                    log.warn("Compiled function links with " + warnings + " warnings");
                    funcSource = "/* Compiled function links with " + warnings + " warnings */\n" + funcSource;
                }
                if(errors) {
                    log.warn("Compiled function links with " + errors + " errors");
                    funcSource = "/* Compiled function links with " + errors + " errors */\n" + funcSource;
                }
            }else if(!API.doNotMount)  {

                try {
                    API.func = func();
                    API.func.source = funcSource;
                    API.compiledOK = true;
                } catch(e) {
                    API.func = undefined;
                    log.error("Mounting error: " + e.message);
                    funcSource = "/* Compiled function failed to mount. Error: `" + e.message + "`*/\n" + funcSource;

                }
            }else {
                API.compiledOK = true;
            }
            if (API.options.save){
                downloadData(funcSource,API.options.filename,API.options.mime);
            }
        }
    };
    return API;
})();