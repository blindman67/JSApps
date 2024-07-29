const logger = (()=>{
    const WHEEL = {wheelNextTarget: true};
    function showError(e){
        if(e === undefined){
            e = parsingERROR;
        }
        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n');
        API.error(e.stack.split('\n'));
        var trace = e.stack.split("\n");
        if (trace[1].indexOf(".js") === -1) {
            var loc = trace[1].split(")")[0].split(":")
            var p = loc.length -2;
            editor.focus();
            editor.selection.moveCursorTo(Number(loc[p])-1,Number(loc[p+1]),false);
            editor.scrollToLine(Math.max(0,Number(loc[p])-10));
            editor.selection.clearSelection();
            editor.session.setAnnotations([{row : Number(loc[p])-1, text : e.message, type : "error"}]);
        }
        prevDiv = undefined;
    }
    const fixedLogs = new Map();
    const dontRepeatInfo = new Set();
    var rootObj = undefined;
    const pathToRoot = [];
    const restrictions = {
        Sprite: ["state","previouseState","extent","shapeState","shapePath","key","index"],
        Shape: ["names","SVGType","extra"],
        sprites: "hasGuides,hasVideo,hasFunctionLinks,functionLinksAnimated,functionLinksOn,mustUpdate,time,hasAttached".split(","),
        selection: "extras".split(","),
        animation: -1,
        Pallet(obj) { const cols = {}; obj.eachCSS((col,i) => cols[i] = col); return cols },
        attachment: "owner,rotOffset,inheritRotate,inheritScaleX,inheritScaleY,scaleAttachX,scaleAttachY,computed".split(","),
        image: ["ctx"],
        textInfo: "owners,textEvent,content,size,fontStr,lineWidth,dirty,prevText,width,id,textData".split(","),
        desc: ["undoCan","mirror"],
        rgb: ["r2","g2","b2"],
    };
    var prevDiv;
    function addStyleLog(text, className) {
        const d = text.split("\n");
        for (let line of d) {
            if(line) {
                let eclass = "";
                if (line[0] === "#" && line[1] === "#") {
                    line = line.slice(2);
                    const idx = line.indexOf("#");
                    if (idx > -1) {
                        eclass = line.split("#")[0];
                        line = line.slice(idx + 1);
                    }
                }


                const parts = line.split("##");
                const div = $("div", {className});
                for (const p of parts) {
                    const sp = p.split("#");
                    if (sp.length > 1) {
                        $$(div, $("span",{textContent: sp[1], ...WHEEL, className: sp[0] ? sp[0] : eclass}));
                    } else {
                        $$(div, $("span",{textContent: sp[0], ...WHEEL, className: eclass}));
                    }
                }
                $$(logs, div);
            }

        }
        prevDiv = undefined;
        logs.scrollTop = logs.scrollHeight;
        return prevDiv;


    }
    function addLog(textContent,className,extra = null, executeOnClick = false){
        if (Array.isArray(textContent)) {
            if (executeOnClick) { textContent.forEach(textContent => { $$(logs,$("div",{textContent, className, ...WHEEL, logExtra : extra, executeOnClick})) }) }
            else { textContent.forEach(textContent => { $$(logs,$("div",{textContent, className, ...WHEEL, logExtra : extra})) }) }
            prevDiv = undefined;
        } else {
            var text;
            if (textContent === undefined) { text === "undefined" }
            else if (textContent === null) { text === "null" }
            else { text = textContent.toString() }
            if (prevDiv) {
                if (prevDiv.logText === text) {
                    prevDiv.counting += 1;
                    prevDiv.textContent = prevDiv.counting + ": " + text;
                    return;
                }
            }
            if (executeOnClick) { $$(logs,prevDiv = $("div",{textContent : text, className, ...WHEEL, logExtra : extra, executeOnClick, logText : text, counting : 1})) }
            else { 
                if (Touch) {
                    if (className === "loggerError") {
                        Touch.debugAdd(text, 10000);                        
                    }                    
                }
                $$(logs,prevDiv = $("div",{textContent : text, className, ...WHEEL, logExtra : extra, logText : text, counting : 1})) ;
            }
        }
        logs.scrollTop = logs.scrollHeight;
        return prevDiv;
    }
    function logObj(obj, depth = 1, maxDepth = 1, inEl = logs, simple = true, trueFalseObj = false){ // trueFalseObj is true only shows truthy properties
        var div;
        if (restrictions[rootObj.APIName] && restrictions[rootObj.APIName] === -1) {
            div = $("div", {className : "loggerObj", ...WHEEL, style : {paddingLeft :  (depth > 1 ? (16 * 2) : 0) + "px"}});
            $$(div,[
                $("span", {textContent : rootObj.APIName + ": ", ...WHEEL, className : "loggerObjKey"}),
                $("span", {textContent : "Is a protected Object", ...WHEEL, className : "loggerObjObject"})
            ]);
            $$(inEl,div);
            logs.scrollTop = logs.scrollHeight;
            prevDiv = undefined;
            return
        }
        if (restrictions[rootObj.APIName] && typeof restrictions[rootObj.APIName] === "function") {
            obj = restrictions[rootObj.APIName](obj);
        }
        for(const key in obj){
            if(simple){
                if(obj[key] === "" || obj[key] === null || obj[key] === undefined || typeof obj[key] === "function"){
                    continue;
                }
            }
            let kobj = obj[key];
            if (restrictions[kobj.APIName] && typeof restrictions[kobj.APIName] === "function") {
                kobj = restrictions[kobj.APIName](kobj);
            }
            if ((restrictions[rootObj.APIName] && restrictions[rootObj.APIName].includes && restrictions[rootObj.APIName].includes(key)) ||
                (restrictions[obj.APIName] && restrictions[obj.APIName].includes && restrictions[obj.APIName].includes(key))) {
                continue;
            }
            if (pathToRoot.some(name => restrictions[name] && restrictions[name].includes && restrictions[name].includes(key))) { continue }

            if (key === undefined || key === null ) { continue }

            const indent = {paddingLeft :  (depth > 1 ? (16 * 2) : 0) + "px"};
            if(kobj === null || typeof kobj !== "object"){
                let addKey = true;
                div = $("div", {className : "loggerObj", ...WHEEL, style : indent});
                var value;
                if(typeof kobj === "function"){
                    var functionVal = kobj.toString().split("{")[0].replace(key,"");
                     value = $("span", {textContent : functionVal, ...WHEEL, className : "loggerObjFunction"})
                } else if(typeof kobj === "string"){
                    if(kobj.length > 128){
                        value = $("span", {textContent : '"' +  kobj.substr(0,128) + '..."', ...WHEEL, className : "loggerObjString", logExtra : kobj});
                    }else{
                        value = $("span", {textContent : '"' +  kobj + '"', ...WHEEL, className : "loggerObjString loggerClickable", logExtra : kobj});
                    }
                } else if(kobj === null){
                    value = $("span", {textContent : "null", ...WHEEL, className : "loggerObjValue"})
                } else if(kobj === undefined){
                    value = $("span", {textContent : "null", ...WHEEL, className : "loggerObjUndefined"})
                } else {
                    if (trueFalseObj) {
                        if (!kobj) {
                            addKey = false;
                        }
                    }
                    if (addKey) {
                        const type = (typeof kobj)[0].toUpperCase() + (typeof kobj).substr(1);
                        value = $("span", {textContent : kobj, ...WHEEL, className : "loggerObj" + type + " loggerClickable", logExtra : kobj.toString()})
                    }
                }
                if (addKey) {
                    $$(div,[$("span", {textContent : key + " : ", ...WHEEL, className : "loggerObjKey"}), value]);
                }
            } else if (kobj instanceof Set) {
                for (const item of kobj.values()) {
                    if (item.toString) {
                         if(depth < maxDepth){
                            div = $("div", {className : "loggerObj loggerFolded", ...WHEEL, style : indent});
                            var str = "" + item;
                            if (str.length > 40) { str = str.substr(0,40) + "..." }
                            $$(div,[
                                $("span", {textContent : key + " : " + str + " {...}", ...WHEEL, logExtra : {fold : div}, className : "loggerObjKey loggerFold"}),
                            ]);
                            $$(inEl,div);
                            pathToRoot.push(key);
                            logObj(item, depth + 1, maxDepth,div,simple);
                            pathToRoot.pop();
                            $$(div,[
                                $("span", {textContent : "}", ...WHEEL, className : "loggerObjKey"}),
                            ]);
                            div = undefined;
                        }else{
                            div = $("div", {className : "loggerObj", ...WHEEL, style : indent});
                            var str = item.toString();
                            if (str.length > 40) { str = str.substr(0,40) + "..." }
                            $$(div,[
                                $("span", {textContent : key + " : ", ...WHEEL, className : "loggerObjKey"}),
                                $("span", {textContent : str, ...WHEEL, className : "loggerObjObject"})
                            ]);
                        }
                    }
                }

            } else if (Array.isArray(kobj) && kobj.length >= 10 && depth >= maxDepth) {
                if(kobj.length < 10){
                    div = $("div",{className : "loggerObj", ...WHEEL, style : indent});
                    $$(div,[
                        $("span", {textContent : key + ": ", ...WHEEL, className : "loggerObjKey"}),
                        $("span", {textContent : kobj, ...WHEEL, className : "loggerObjArray"})
                    ]);
                }else{
                    div = $("div",{className : "loggerObj", ...WHEEL, style : indent});
                    $$(div,[
                        $("span", {textContent : key + " : ", ...WHEEL, className : "loggerObjKey"}),
                        $("span", {textContent : "[ ... ] " + kobj.length + " items", ...WHEEL, className : "loggerObjArray"})
                    ]);
                }
            } else {
                if (kobj.toString) {
                    if(depth < maxDepth){
                        div = $("div", {className : "loggerObj loggerFolded", ...WHEEL, style : indent});
                        var str = "" + kobj;
                        if (str.length > 40) { str = str.substr(0,40) + "..." }
                        $$(div,[
                            $("span", {textContent : key + " : " + str + " {...}", ...WHEEL, logExtra : {fold : div}, className : "loggerObjKey loggerFold"}),
                        ]);
                        $$(inEl,div);
                        pathToRoot.push(key);
                        if (obj.APIName === "Sprite" && (key === "type" || key === "locks")) {
                            logObj(kobj,depth + 1, maxDepth,div,simple, true);
                        } else {
                            logObj(kobj,depth + 1, maxDepth,div,simple);
                        }
                        pathToRoot.pop();
                        $$(div,[
                            $("span", {textContent : "}", ...WHEEL, className : "loggerObjKey"}),
                        ]);
                        div = undefined;
                    }else{
                        div = $("div", {className : "loggerObj", ...WHEEL, style : indent});
                        var str = kobj.toString();
                        if (str.length > 40) { str = str.substr(0,40) + "..." }
                        $$(div,[
                            $("span", {textContent : key + " : ", ...WHEEL, className : "loggerObjKey"}),
                            $("span", {textContent : str, ...WHEEL, className : "loggerObjObject"})
                        ]);
                    }
                }
            }
            if (div !== undefined) { $$(inEl,div) }

        }
        logs.scrollTop = logs.scrollHeight;
        prevDiv = undefined;
    }
    var flashTimer;
    var lastFlash;
    const removeFlashClass = () => {
        if(lastFlash) {
            logs.classList.remove(lastFlash);
            lastFlash = undefined;
        }
    };
    var errorLockoutPassId;
    var clipLines = [];
    /* The following two function are hacks so I can get past this task and go back in time and spit blue murder at the dicks that wrote netscape. No it will never be fixed. */
    function scroller() {
        var dist = scroller.dist;
        var sc = dist;
        var st = logs.scrollTop;
        if (dist < -3) { 
            if (dist < -12) { sc = -12 }
            else if (dist < -6) { sc = -6 }
            else { sc = -3 }
            dist -= sc;
        } else if (dist > 3) {
            if (dist > 12) { sc = 12 }
            else if (dist > 6) { sc = 6 }
            else { sc = 3 }
            dist -= sc;        
        } else { dist = 0 }
        st -= sc;
        if (sc < 0) { // downward
            const sh = logs.scrollHeight - logs.clientHeight;
            if (st > sh) {
                dist = 0;
                logs.scrollTop = sh;
            } else { logs.scrollTop = st }            
        } else { logs.scrollTop = sc < 0 ? dist = 0 : st }
        scroller.dist = dist;
        if (dist) { setTimeout(scroller, 16) }
        else { scroller.scrolling = false }
    }
    function wheelScroll(mouse) {
        if (scroller.scrolling) { scroller.dist += mouse.wheel; }
        else {
            scroller.scrolling = true;
            scroller.dist = mouse.wheel;
            scroller();
        }
        mouse.wheel = 0;
    }
    logs.updateWheel = wheelScroll;
    const API = {
        flashTypes : {
            error : "loggerFlashError",
            warn : "loggerFlashWarn",
            note : "loggerFlashNote",
            info : "loggerFlashInfo",
        },
        flash(type){
            removeFlashClass();
            clearTimeout(flashTimer);
            setTimeout(removeFlashClass,settings.flashTime);
            logs.classList.add(type);
            lastFlash = type;

        },
        update(element,data){
            if($(logs,"#"+element.id,0)){
                element.textContent = data.toString();
                return element;
            }
            prevDiv = undefined;
            return API.sys(data);
        },
        sysForceLine(data) {
            prevDiv = undefined;
            return   API.sys(data);
        },
        sys(data) {
            const element = addLog(data, "loggerSys") ;
            if(element){ element.id = "systemLog" + (UID ++) }
            return element;
        },
        sysStyle(data) {
            const element = addStyleLog(data, "loggerSys") ;
            if(element){ element.id = "systemLog" + (UID ++) }
            return element;
        },
        clipboardLine(line) {
            clipLines.push(line)
            log("clip: " + (clipLines.length -1) + line);
        },
        copyToClipboard() {
            if (clipLines.length > 0)  {
                navigator.clipboard.writeText(clipLines.join("\n"))
                    .then(() => {
                        log("Text sent to clip buffer");
                        clipLines.length = 0;
                    },
                    () => log.warn("Text failed to write to buffer")
                );
            } else {
                log.warn("Nothing to copy to clipboard");
            }
        },
        warn(data) { API.flash(API.flashTypes.warn); heartBeat.addAlert("warn"); return addLog(data, "loggerWarn") },
        errorLockout(id) { errorLockoutPassId = id },
        clearErrorLockout(id) { errorLockoutPassId = undefined },
        error(data, id) {
            if(errorLockoutPassId === undefined || id === errorLockoutPassId) {
                API.flash(API.flashTypes.error); 
                heartBeat.addAlert("error"); 
                addLog(data, "loggerError");
            }
        },
        info(...data) { 
            API.flash(API.flashTypes.info);
            heartBeat.addAlert("info"); 
            for (const line of data) { addLog(line, "loggerInfo") }
        },
        infoOnce(data) {
            if(dontRepeatInfo.has(data)) { return };
            dontRepeatInfo.add(data);
            API.flash(API.flashTypes.info);; heartBeat.addAlert("info"); addLog(data, "loggerInfo")
        },
        trace(error) {
            API.error("Code Error...");
            setTimeout(()=>showError(error),100);
        },
        obj(obj,complex = false, depth = 1) {
            rootObj = obj;
            if(isNaN(depth) || depth < 1){ depth = 1 }
            if(depth > 10) {
                log.error("Logger Object display max depth is 10.");
                depth = 10;
            }
            if (obj.APIName === undefined) {
                rootObj = undefined;
                    
            } else {            
                logObj(obj, 1, depth, logs, !complex);
                rootObj = undefined;
            }
        },
        clickable(data,extra) { addLog(data, "loggerClickable", extra) },
        command(data,extra) { addLog(data, "loggerNorm", ""+extra, true) },
        fixed(name, data, action = "show") {
            if(fixedLogs.has(name)) {
                const fixed = fixedLogs.get(name);

                if(action === "commandExe") {
                    fixed.element.logExtra = data;
                    fixed.element.classList.add("loggerClicker");
                    fixed.element.executeOnClick = true;
                }else if(action === "command") {
                    fixed.element.logExtra = data;
                    fixed.element.classList.add("loggerClicker");
                    ixed.element.executeOnClick = false;
                } else if(action === "remove") {
                    $R(logs,fixedLogs.element);
                    fixedLogs.delete(name);
                }else{
                    fixed.element.textContent = data;
                }

            } else {
                fixedLogs.set(name, { element: addLog(data, "loggerFixed") });
            }
        },

        clear(what){
            if(what !== undefined) {
                what = (""+what).toLowerCase();
                if(what === "error" || what === "errors") { $R(logs, $(logs,".loggerError")) }
                else if(what === "warn" || what === "warnings") { $R(logs, $(logs,".loggerWarn")) }
                else if(what === "info" || what === "infomation") { $R(logs, $(logs,".loggerInfo")) }
                else if(what === "sys" || what === "system") { $R(logs, $(logs,".loggerSys")) }
                else if(what === "mes" || what === "mess" || what === "messages") { $R(logs, $(logs,".loggerNorm")) }
                else if(what === "fix" || what === "fixed" ) { $R(logs, $(logs,".loggerFixed")); fixedLogs.clear();}
                else if(what.trim() === "") {
                    logs.innerHTML = ""
                    fixedLogs.clear();
                }
                prevDiv = undefined;

            }else{
                logs.innerHTML = "";
                fixedLogs.clear();
                prevDiv = undefined;
            }
        },
    }
    function log(data){ addLog(data, "loggerNorm",""+data) }
    Object.assign(log, API);
    return log;
})();
const log = logger;