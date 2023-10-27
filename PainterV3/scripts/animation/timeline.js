"use strict";
const timeline = (()=> {
    var flasher;
    var flasherActive;
    var waitingOnReady = false;
	var stepRecording = false;
    var flashChange = false;
    const lightBoxLayers = [];
    var lightBoxLayerCount;
    var lastFrameId = 0; // debug helper
    var sameFrameCount = 0;
    var timelineFrameStep = 1;
    var timelineEditMode;
    var keyTrackCount = -1;;
    var keySelectLastRightButtonKeyTime = -1;
    var keySelectStore = {
        idx: 0,
        named: [],
        store: new Map(),
        addStore(name, keyIds) {
            if(!keySelectStore.store.has(name)){
                log("Adding key store "+name)
                keySelectStore.named.push(name);
                const idx = keySelectStore.named.length - 1;
                buttonMap.get(commands.animRecallKeySelection).selection.updateItem(idx, name,"Select stored " + SKF.length + " key frames");
            }
            keySelectStore.store.set(name, keyIds);
        },
        removeNamed(name) {
            const idx = keySelectStore.named.indexOf(name);
            if(keySelectStore.store.has(name) || idx > -1){
                keySelectStore.store.delete(name);
                keySelectStore.named.splice(idx,1);
                buttonMap.get(commands.animRecallKeySelection).selection.removeItem(idx);
            }
        },
        clean(){
            const allKeyIds = new Set();
            sprites.allAnimKeys((spr, track, key) => { allKeyIds.add(key.id) });
            SKF.removeReleasedKeys(allKeyIds);
            for(const [name,ids] of keySelectStore.store.entries()) {
                let i = 0;
                while (i < ids.length) {
                    if(!allKeyIds.has(ids[i])) {
                        ids.splice(i,1);
                    } else {
                        i++;
                    }
                }
            }
            for(const [name,ids] of keySelectStore.store.entries()) {
                if(ids.length === 0) { keySelectStore.removeNamed(name) }
            }
        },
        getNamed(name) { return keySelectStore.store.get(name) },
        postFix: 1,
        deserial(keySelects, UIDOffset) {
            var idx = 0;
            var posfixUsed = false;
            for(const name of keySelects.names) {
                let newName = name;
                while(keySelectStore.named.includes(newName)) {
                    newName = name + keySelectStore.postFix;
                    posfixUsed = true;
                    if(keySelectStore.named.includes(newName)) { keySelectStore.postFix ++ }
                }
                const ids =keySelects.keyIds[idx++];
                keySelectStore.addStore(newName, ids.map(id => (maxUID = Math.max(maxUID, id + UIDOffset), id + UIDOffset)));
            }
            if(posfixUsed) { keySelectStore.postFix ++ }
        },
        serial() {
            const keySelect = {
                names: [...keySelectStore.named],
                keyIds: [],
            }
            for(const name of keySelectStore.named) {
                keySelect.keyIds.push([...keySelectStore.store.get(name)]);
            }
            return keySelect;
        }
    };
    const TOTAL_SLIDE_HEIGHT = 8;
    const id = UID ++;
    const idTotalTime = UID ++;
    const buttonMap = new Map();
    var commandKeyFrameNames;
    const workPoint = utils.point;
    const animTracks = [];
    const spriteKeyCompact = [];
    const status = {
        clear : 1,
        hasKeys : 2,
    }
    const rowStatus = [];
    const keyDrag = {
        start : utils.point,
        scaling : false,
        scaleTime : 0,
        scalePos : 0,
    }
    const SAT = Object.assign([], {  // SAT for selectedAnimationTracks
        clear() {
            for(const track of SAT) { track.selected = false }
            SAT.length = 0;
        },
    });
    const SKF = Object.assign([], {  // SKF for selectedKeyFrames
        dirty: false,
        removeReleasedKeys(keepOnlyIdSet) {
            var idx = 0;
            while(idx < SKF.length) {
                if(!keepOnlyIdSet.has(SKF[idx])) {
                    SKF.remove(SKF[idx]);
                }else {
                    idx ++;
                }
            }
        },
        clear() {
            for(const key of SKF) { key.selected = false }
            SKF.length = 0;
            SKF.dirty = true;
        },
        removeHiddenKeys() {  // hidden keys are keys selected but the sprite or track is unselected or hidden and the key can not be seen
                              // also new Anim object will deselect when deleteing tracks and keys. So remove any keys that are unselected
            var count = 0;
            for(var i = 0; i < this.length; i++){
                if(this[i].selected === false) {
                    count ++;
                    this.splice(i--,1);
                }else if(!sprites.isKeyOfSelectedSprite(this[i])) {
                    this[i].selected = false;
                    count ++;
                    this.splice(i--,1);
                }
            }
            for (var i = 0; i < this.length; i++) {
                const key = this[i];
                selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => {
                            if (!keyTypeFilters[track.name] && track.keys.includes(key)) {
                                key.selected = false;
                                this.splice(i--,1);
                                count ++;
                                return true;
                            }
                        });
                        if (!key.selected) { return true }
                    },
                    "animated"
                );
            }
            if (count > 0) { this.dirty = true; }
        },
        add(key) {
            if(!SKF.includes(key)) {
                key.selected = true;
                SKF.push(key);
            }
            SKF.dirty = true;
        },
        rememberKeys(name, keySet = []) {
            var idx = 0;
            while (idx < SKF.length) {
                const key = SKF[idx++];
                if (!keySet.includes(key.id)) { keySet.push(key.id) }
            }
            keySelectStore.addStore(name, keySet);
        },
        remove(key) {
            key.selected = false;
            const idx = SKF.findIndex(k => k === key);
            if (idx > -1) { SKF.splice(idx,1) }
            SKF.dirty = true;
        },
        unselectSprite(spr) {
            if(spr.type.animated) {
                spr.animation.eachTrack(track => {
                    track.eachKey(key => {
                        if (key.selected) { SKF.remove(key) }
                    });
                });
            }
        },
        copyKeys() {
            selection.eachOfType(spr => { spr.copySelectedKeys() },"animated");
            animation.forceUpdate();
            SKF.dirty = true;
        },
        held:[],
        holdSelected() { SKF.held = [...this] },
        releaseHeld() { SKF.held.length = 0 },
        deleteKeys(frame) {
            var idx = 0;
            var count = 0;
            while(idx < SKF.length) {
                const key = SKF[idx];
                if(frame === undefined || key.time === frame) {
                    selection.eachOfType(spr => {
                        if(spr.removeKeyFrame(key,false)) {
                            SKF.splice(idx--, 1);
                            count ++;
                            return true;
                        }
                    },"animated");
                }
                idx++;
            }
            if(count) { updateSelectedSpriteAnimationLookups() }
            SKF.dirty = true;
        },
        minMaxTime() {
            SKF.max = animation.startTime;
            SKF.min = animation.endTime;
            for(const key of SKF) {
                SKF.min = Math.min(SKF.min, key.time);
                SKF.max = Math.max(SKF.max, key.time);
            }
            SKF.range = SKF.max - SKF.min;
        },
        saveKeyTime() {
            for(const key of SKF) { key.t = key.time }
        },
        deleteSavedKeyTime() {
            for(const key of SKF) { delete key.t }
        },
        timeMove(move) {
            var max, min;
            var scale, start;
            if(keyDrag.scaling) {
                keyDrag.scalePos += move;
                keyDrag.scalePos = keyDrag.scalePos < animation.startTime ? animation.startTime  : (keyDrag.scalePos > animation.endTime ? animation.endTime : keyDrag.scalePos);
                if(keyDrag.scaleTime === SKF.min) {
                    start = SKF.min;
                    scale = (keyDrag.scalePos - SKF.min) / SKF.range;
                }else if(keyDrag.scaleTime === SKF.max) {
                    start = SKF.max;
                    scale = (SKF.max - keyDrag.scalePos) / SKF.range;
                }
                for(const key of SKF) {
                    key.time = (key.t - start) * scale + start | 0;
                    if(max === undefined) { min = max = key.time }
                    else {
                        min = Math.min(key.time,min);
                        max = Math.max(key.time,max);
                    }
                }
            }else{
                for(const key of SKF) {
                    key.time += move;
                    if(max === undefined) { min = max = key.time }
                    else {
                        min = Math.min(key.time,min);
                        max = Math.max(key.time,max);
                    }
                }
            }
            SKF.minMoved = min;
            SKF.maxMoved = max;
        },
        copyToBuffer() {
            if(this.length) {
                copyPasteBuffer.length = 0;
                copyPasteBuffer.minTime = Infinity;
                var hasDuplicates = false;
                selection.eachOfType(spr => {
                    spr.animation.eachTrack(track => {
                        track.eachKey(key => {
                            if(key.selected) {
                                if (copyPasteBuffer.find(k => key.time === k.time && track.type === k.type)) { hasDuplicates = true; }
                                else {
                                    copyPasteBuffer.push({time: key.time, value: key.value, curve: key.curve, type: track.type});
                                    copyPasteBuffer.minTime = Math.min(key.time, copyPasteBuffer.minTime);
                                }
                            }
                        });
                    });
                }, "animated");
                log.info(copyPasteBuffer.length + " keys copied to buffer.");
                if (hasDuplicates) { log.warn("Selected keys contained duplicates which have be ingnored") }
            }
        },
        getSelectedKeys() {
            SKF.clear();
            selection.eachOfType(spr => {
                spr.animation.eachTrack(track => {
                    track.eachKey(key => {
                        if(key.selected) { SKF.add(key) }
                    });
                });
            }, "animated");
        },
        pasteBuffer(fromTime){
            if (copyPasteBuffer.length) {
                SKF.clear();
                var wKey = { name : "", dontUpdate : true, isNew : true, time : 0, value : 0, curve : 0 ,id: undefined };
                var timeOffset = 0;
                if (fromTime !== undefined) { timeOffset = -copyPasteBuffer.minTime + fromTime  }
                selection.each(spr => {
                    copyPasteBuffer.forEach(key => {
                        const existingKey = spr.getAnimKey(key.time + timeOffset, key.type);
                        if(existingKey === undefined) {
                            wKey.name = undefined;
                            wKey.type = key.type;
                            wKey.value = key.value;
                            wKey.time = key.time + timeOffset;
                            wKey.curve = key.curve;
                            wKey.remember = true;
                            spr.addAnimKey(wKey);
                            if(wKey.created) {
                                wKey.created.selected = true;
                                wKey.created = undefined;
                            }
                        } else {
                            existingKey.value = key.value;
                            existingKey.curve = key.curve;
                            existingKey.selected = true;
                        }
                    });
                });
                SKF.getSelectedKeys();
            }
        },
        maxMoved : 0,
        minMoved : 0,
        selector : {
            start : 0,
            end : 0,
            top : 0,
            bottom : 0,
            l : 0, r : 0, t : 0 , b: 0, // left right top bottom vetted
            vetBounds() {
                if(this.start < this.end) {
                    this.l = this.start;
                    this.r = this.end;
                }else{
                    this.r = this.start;
                    this.l = this.end;
                }
                if(this.top < this.bottom) {
                    this.t = this.top;
                    this.b = this.bottom;
                }else{
                    this.b = this.top;
                    this.t = this.bottom;
                }
            },
            active : false,
        },
        updateCurves(){
            if(SKF.dirty){
                SKF.dirty = false;
                curvesSet.clear();
                buttonMap.get(commands.animKeyCurveEaseOut).setSprite(1);
                buttonMap.get(commands.animKeyCurveEaseInOut).setSprite(1);
                buttonMap.get(commands.animKeyCurveEaseIn).setSprite(1);
                buttons.groups.clearGroup("animKeyCurves")
                for(const key of this) { curvesSet.add(curveTypes[key.curve]) }
                for(const curve of curvesSet.values()) {
                    buttonMap.get(curve[0]).setSprite(curve[1])
                    buttons.groups.setCheck("animKeyCurves",curve[0],true)
                }
            }
        },
        setCurve(val)  {
            var sCount = 0, count = 0;
            if(val === 0 || val === 4){
                for(const key of this) {
                    if (selection.hasKey(key)) {
                        key.curve = val === 4 ? 19: 0;
                        sCount ++;
                    }
                    count ++;
                }
            } else {
                var next;
                var type = (val - 1) * 6 + 1;
                for(const key of this) {
                    if (selection.hasKey(key)) {
                        if(next === undefined) {
                            if(key.curve >= type && key.curve < type + 6){
                                next = key.curve + 1
                                if ( next >= type + 6) {
                                    next = type;
                                }
                            }else {
                                next = type;
                            }
                        }
                        key.curve = next;
                        sCount ++;
                    }
                    count ++;
                }
            }
            if (count) {
                if (sCount) {
                    SKF.dirty = true;
                    this.updateCurves();
                }
                if (sCount !== count) {
                    log.warn("Did not change selected keys of unselected sprites.");
                }
            }
        },
    });
    const copyPasteBuffer = [];
    const curvesSet = new Set();
    const curveTypes = [
        [commands.animKeyCurveLinear,0],
        [commands.animKeyCurveEaseOut,0],
        [commands.animKeyCurveEaseOut,1],
        [commands.animKeyCurveEaseOut,2],
        [commands.animKeyCurveEaseOut,3],
        [commands.animKeyCurveEaseOut,4],
        [commands.animKeyCurveEaseOut,5],
        [commands.animKeyCurveEaseInOut,0],
        [commands.animKeyCurveEaseInOut,1],
        [commands.animKeyCurveEaseInOut,2],
        [commands.animKeyCurveEaseInOut,3],
        [commands.animKeyCurveEaseInOut,4],
        [commands.animKeyCurveEaseInOut,5],
        [commands.animKeyCurveEaseIn,0],
        [commands.animKeyCurveEaseIn,1],
        [commands.animKeyCurveEaseIn,2],
        [commands.animKeyCurveEaseIn,3],
        [commands.animKeyCurveEaseIn,4],
        [commands.animKeyCurveEaseIn,5],
        [commands.animKeyCurveStep,0],
    ];
    const animKeyCurveType2CSSIdx = [0,2,2,2,2,2,2,4,4,4,4,4,4,3,3,3,3,3,3,1];
    const animKeyCSSIdx2CSSName = ["cvLi", "cvSt", "cvIn", "cvOt", "cvIO"];
    const animTrackPingPongTypeHelp = ["Loop Forward", "Loop Reverse", "Loop Ping Pong", "Lead In Out"];
    var selectedKeyFrames = SKF;
    var timePosSize;
    var dontUpdateSecond = true; // second timeline slider
    const update = {
        editMode : 1,
        updateDisplayedKeys : 2, // to save CPU cycles and DOM interaction this updates only displayed keys
        keyTypeFilters : 3, // to save CPU cycles and DOM interaction this updates only displayed keys
    };
    const keyNames = "x,y,sx,sy,rx,ry,a,image,rgb".split(",")
    const keyTypeFilters = {} // true means show keys of that type
    $eachOf(keyNames, name => {keyTypeFilters[name] = true});
    const animTrackNameCellClass = {
        x: "X",
        y: "Y",
        sx: "SX",
        sy: "SY",
        rx: "RX",
        ry: "RY",
        a: "A",
        image: "IMG",
        rgb: "RGB",
    };
    const animTrackDesc = {
        x(spr) { return "x:" + spr.x.toFixed(0) },
        y(spr) { return "y:" + spr.y.toFixed(0) },
        sx(spr) { return "sx:" + (spr.type.normalisable? spr.w.toFixed(0) :spr.sx.toFixed(2)) },
        sy(spr) { return "sy:" + (spr.type.normalisable? spr.h.toFixed(0) :spr.sy.toFixed(2)) },
        rx(spr) { return "rx:" + (spr.rx * 180 / Math.PI).toFixed(0) },
        ry(spr) { return "ry:" + (spr.ry * 180 / Math.PI).toFixed(0) },
        a(spr) { return "a:" + spr.a.toFixed(2) },
        image(spr, name = spr.image.desc.name) {
			if(spr.type.subSprite) { return "Sub Idx: " + spr.subSpriteIdx }
			return name.length > 8 ? name.slice(0,8) + "..." : name;
		},
        rgb(spr) { return spr.rgb.css },
    };
    function updateFilters() {
        //buttons.groups.setCheck(animFilterTypesGroup, commands.animFilterKeyPos, keyTypeFilters.x & keyTypeFilters.y);
        //buttons.groups.setCheck(animFilterTypesGroup, commands.animFilterKeyScale, keyTypeFilters.sx & keyTypeFilters.sy);
       // buttons.groups.setCheck(animFilterTypesGroup, commands.animFilterKeyRotate, keyTypeFilters.rx & keyTypeFilters.ry);
        for (const kName of keyNames) {
            //buttons.groups.setCheck(animFilterTypesGroup, commands["animFilterKey_" + kName], keyTypeFilters[kName]);
            const keyButton = buttonMap.get(commands["animSetKey_" + kName]);
            if (keyTypeFilters[kName] ){
                keyButton.element.defaultClassNames = "buttons buttonSprite keyFilterKeyHighlight";
                keyButton.element.classList.add("keyFilterKeyHighlight");
            }else{
                keyButton.element.defaultClassNames = "buttons buttonSprite";
                keyButton.element.classList.remove("keyFilterKeyHighlight");
            }
        }
        sprites.eachOfType(spr => {
                spr.animation.eachTrack(track => {
                    if(track.selected) {
                        var filterName = track.name;
                        if(name === "y") { filterName = "x" }
                        if(name === "sy") { filterName = "sx" }
                        if(name === "ry") { filterName = "rx" }
                        if(keyTypeFilters[filterName] === false) { track.selected = false }
                    }
                });
            },"animated"
        );
    }
    var waitingForTempoInput = false;
    var waitingForTempoInputTimer;
    function waitForTempoInput() {
        const waiting = () => {
            times.aem.element.classList.toggle("animWaitFlash")
            if(waitingForTempoInput) {
                waitingForTempoInputTimer = setTimeout(waiting, 250);
            }
        };
        if(waitingForTempoInput) {
            times.aem.element.classList.remove("animWaitFlash")
            clearTimeout(waitingForTempoInputTimer);
            waitingForTempoInput = false;
        } else {
            waitingForTempoInput = true;
            clearTimeout(waitingForTempoInputTimer);
            waitingForTempoInputTimer = setTimeout(waiting, 0);
        }
    }

    const editModes = {
        place : 1,
        modify : 2,
        record : 3,
        styles : ["","animPlaceMode","animModifyMode","animRecordMode"],
        stylesShort : ["","PlaceMode","ModifyMode","RecordMode"],
        colorSecond : ["","#0F0","#FF0","#F00"], // for second slider on edSprites menu
        colorSecondTotalA : ["","#080","#880","#800"], // for total time slider
        colorSecondTotalB : ["","#0C0","#CC0","#C00"], // for total time slider
        colorSecondTotalC : ["","#5F5","#FF5","#F55"], // for total time slider
        named : ["","","M","R"],
        firstCall : false,
        canUpdate() {
            if((API.animationChanged || API.updateKeyframes) && (API.canUpdate  || (mouse.captured === 0 && mouse.button === 0)) || (mouse.captured === API.id && API.dragging)) {
                return true;
            }
            if((mouse.button & 1) === 1 && mouse.downOn && mouse.downOn.commandId === commands.animAddMark) { return true }
            return false;
        },
        updateFunctions : ["",
            () => {
                editModes.firstCall = false;
                if (!API.active && flashChange){
                    flashChange = false;
                    flasher("keyFrameAddSec");
                }
                if(editModes.canUpdate()) {
                    if (API.updateKeyframes) {
                        API.updateKeyframes = false;
                        updateSelectedSpriteAnimationLookups();
                    }
                    //if (API.active) { API.update() }
                    API.update();
                    API.canUpdate = false;
                } else { API.updateSecondSlider() }
            },
            () => {
                if(editModes.firstCall) {
                    editModes.firstCall = false;
                    API.updateModifyMode();
                }
                if (!API.active && flashChange){
                    flashChange = false;
                    flasher("keyFrameAddSec");
                }
                API.updateModifyMode(false);
                if(editModes.canUpdate()) {
                    if (API.updateKeyframes) {
                        API.updateKeyframes = false;
                        updateSelectedSpriteAnimationLookups();
                    }
                    API.update();
                    API.canUpdate = false;
                } else { API.updateSecondSlider() }
                API.updateModifyMode();
            },
            () => {
                if(editModes.firstCall) {
                    editModes.firstCall = false;
                    API.updateRecordMode();
                }
                if (!API.active && flashChange){
                    flashChange = false;
                    flasher("keyFrameAddSec");
                }
                API.updateRecordMode(false);
                if(editModes.canUpdate()) {
                    if (API.updateKeyframes) {
                        API.updateKeyframes = false;
                        updateSelectedSpriteAnimationLookups();
                    }
                    API.update();
                    API.canUpdate = false;
                } else { API.updateSecondSlider() }
                API.updateRecordMode();
            },
        ],
    }
    const timeMarks = Object.assign([],{
        get(timeOrName, defs = false) {
            if(isNaN(timeOrName)) {
               const m = this.find(mark => mark.name === timeOrName);
               if(m === undefined && defs) {
                    if(timeOrName === "end") {
                        return {time: animation.endTime, name: "end"}
                    }
                    if(timeOrName === "start") {
                        return {time: animation.startTime, name: "start"}
                    }

               } else { return m }
            }else {
                const m = this.find(mark => mark.time === timeOrName);
                if(m === undefined && defs) {
                    if(timeOrName >= animation.endTime) {
                        return {time: animation.endTime, name: "end"}
                    }
                    if(timeOrName <= animation.startTime) {
                        return {time: animation.startTime, name: "start"}
                    }
                } else { return m }
            }
        },
        has(timeOrName) {
            if(isNaN(timeOrName)) {
               return this.some(mark => mark.name === timeOrName);
            }else {
                return this.some(mark => mark.time === timeOrName);
            }
            return false;
        },
        add(name,time = animation.time) {
            var mark;
            if(this.has(name)) {
                mark = this.get(name);
                mark.time = time;
            }else{
                this.push(mark = {name, time});
                this.sort((a,b) => a.time - b.time);
            }
            return mark;
        },
        clearAll(){
            this.length = 0;
            API.active = true;
            API.forceAnimUpdate = true;
            API.update();


        },
        sectionCommand(commandId, fromTimeOrName, toTimeOrName) {
            const update = () => {
                API.active = true;
                API.forceAnimUpdate = true;
                API.update();
            }
            var i;
            this.sort((a,b) => a.time - b.time);
            const ma = this.get(fromTimeOrName, true);
            const mb = this.get(toTimeOrName, true);
            if(ma && mb) {
                if (commands.animMarksClearSection === commandId) {
                    sprites.time.clearSection(ma.time, mb.time);
                    update();
                    return true;
                }
                if (commands.animMarksDeleteSection === commandId) {
                    sprites.time.removeSection(ma.time, mb.time);
                    const framesRemoved = (mb.time - ma.time) + 1
                    for(i = 0; i < this.length; i++) {
                        const m = this[i];
                        if(m.time > ma.time && m.time <= mb.time) {
                            this.splice(i--,1);
                        } else if (m.time > mb.time) {
                            m.time -= framesRemoved;
                        }
                    }
                    animation.endTime -= framesRemoved;
                    update();
                    return true;
                }
                if (commands.animMarksTrimSection === commandId) {
                    sprites.time.trimSection(ma.time, mb.time);
                    const shiftTime = ma.time;
                    for(i = 0; i < this.length; i++) {
                        const m = this[i];
                        if(m.time > mb.time || m.time < ma.time) {
                            this.splice(i--,1);
                        }else {
                            m.time -= shiftTime;
                        }
                    }
                    animation.startTime = 0
                    animation.endTime = mb.time;
                    update();
                    return true;
                }
                if (commands.animMarksExpandSection === commandId) {
                    sprites.time.expandSection(ma.time, mb.time);
                    const a = ma.time, b = mb.time;
                    for(i = 0; i < this.length; i++) {
                        const m = this[i];
                        if(m.time > a || m.time <= b) {
                            m.time = (m.time - a) * 2 + a
                        }else if(m.time > b){
                            m.time += b - a + 1;
                        }
                    }
                    const end = animation.endTime + (b - a + 1);
                    const endMax = Math.max(end, animation.maxLength)
                    animation.maxLength = endMax;
                    animation.length = animation.maxLengthQuick;
                    animation.endTime = end;
                    update();
                    return true;
                }
                if (commands.animMarksContractSection === commandId) {
                    sprites.time.contractSection(ma.time, mb.time);
                    const a = ma.time, b = mb.time;
                    for(i = 0; i < this.length; i++) {
                        const m = this[i];
                        if(m.time > a || m.time <= b) {
                            m.time = (m.time - a) / 2 + a;
                        }else if(m.time > b){
                            m.time = (m.time - (b - a + 1) / 2) | 0;
                        }
                    }
                    animation.endTime -= (b - a + 1) / 2 | 0;
                    update();
                    return true;
                }
                if (commands.animMarksReverseSection === commandId) {
                    sprites.time.reverseSection(ma.time, mb.time);
                    const a = ma.time, b = mb.time, range = b - a;

                    for(i = 0; i < this.length; i++) {
                        const m = this[i];
                        if(m.time >= a || m.time <= b) {
                            m.time = (range - (m.time - a)) + a;
                        }
                    }
                    update();
                    return true;
                }
            }
            return false;
        },
        findNext(time) {
            return this.find(mark => mark.time > time) || this.get("end", true);;
        },
        findPrev(time) {
            var i;
            for(i = 0; i < this.length; i ++){
                if(this[i].time < time && (i + 1 >= this.length || this[i+1].time >= time)){
                    return this[i];
                }
            }
            return this.get("start", true);
        },
        remove(timeOrName) {
            const idx = this.findIndex(mark => mark.time === timeOrName || mark.name == timeOrName);
            if(idx > -1) {
                this.splice(idx,1);
            }
        },
        deserial(tm) {
            var i = 0, warnName = false, warnTime = false;
            while (i < tm.length) {
                const name = tm[i++], time = Number(tm[i++]);
                if (timeMarks.has(name)) { warnName = true }
                else if (timeMarks.has(time)) { warnTime = true }
                else { timeMarks.add(name, time) }
            }
            if (warnName || warnTime) { log.warn("Timemarks with same name or time have been ignored") }
        },
        serial() {
            const tm = [];
            this.forEach(timeMark => tm.push(timeMark.name, timeMark.time));
            return tm;
        }
    });
     var prevMode = editModes.place;
    function updateSelectedSpriteAnimationLookups() {
        selection.eachOfType(spr => spr.updateKeyFrameLookup(),"animated");
    }
    const times = {
        end : null,
        start :  null,
        slide : null,
    }
    function timePosDrag(mouse, event) {
        if (mouse.captured === id) {
            if (mouse.button === 0) {
                mouse.release(id);
                mouse.onbutton = null;
                mouse.onmove = null;
                API.dragging = false;
            } else {
                var timePosX, start, end, time;
                if(!timePosSize || timePosSize.width === 0) { timePosSize = times.pos.getBoundingClientRect();}
                start = animation.startTime;
                end = animation.endTime;
                const slideBounds = times.slide.element.getBoundingClientRect();
                animation.time = Math.floor(((mouse.x - timePosSize.width/2) / (slideBounds.width - timePosSize.width)) * (end - start)) + start;
            }
        } else {
            if (mouse.requestCapture(id, times.slide.element)) {
                mouse.onbutton = timePosDrag;
                mouse.onmove = timePosDrag;
                API.dragging = true;
                timePosDrag(mouse, event);
            }
        }
    }
    function totalTimePosDrag(mouse, event) {
        if (mouse.captured === id) {
            if (mouse.button === 0) {
                mouse.release(id);
                mouse.onbutton = null;
                mouse.onmove = null;
                API.dragging = false;
                document.body.style.cursor = "default";
                times.totalSlide.sectionOffset = undefined;
                times.totalSlide.mouseOver = false;
            } else {
                 mouse.requestCursor(id, "none", undefined)
                const can = times.totalSlide.element;
                times.totalSlide.mouseOver = true;
                //var start, end, time, totalTime, mT;
                var totalTime, mTime;
                totalTime = animation.maxLengthQuick+ 1;
                const timeScale = can.width / totalTime;
                //const frameSize = Math.ceil(timeScale)
                //start = animation.startTime;
                //end = animation.endTime;
                //time = animation.time;
                mTime = mouse.x / timeScale | 0;
                if (times.totalSlide.element.overMark === "outside") {
                    if(times.totalSlide.sectionOffset === undefined) {
                        times.totalSlide.sectionOffset = mTime - animation.startTime;
                    }else {
                        animation.sectionStart = mTime - times.totalSlide.sectionOffset;
                    }
                } else if (times.totalSlide.element.overMark === "startTime") {
                    animation.startTime = mTime;
                } else if (times.totalSlide.element.overMark === "endTime") {
                    let maxLen  = animation.maxLengthQuick;
                    if(mTime > maxLen) {
                        if(mTime - maxLen > 40) {
                            maxLen += 4
                        }else if(mTime - maxLen > 20) {
                            maxLen += 2
                        }else if(mTime - maxLen >= 10) {
                            maxLen += 1
                        }
                        animation.maxLength = maxLen;
                    }
                    animation.endTime = mTime;
                } else if (times.totalSlide.element.overMark) {
                    times.totalSlide.element.overMark.time = mTime;
                } else {
                    animation.time = mTime;
                }
                mouse.updateCursor(document.body);
            }
        } else {
            if (mouse.requestCapture(id, times.totalSlide.element)) {
                animation.pause();
                times.totalSlide.mouseOver = true;
                times.totalSlide.sectionOffset = undefined;
                mouse.onbutton = totalTimePosDrag;
                mouse.onmove = totalTimePosDrag;
                API.dragging = true;
                totalTimePosDrag(mouse, event);
            }
        }
    }
    const errors = new Set();
    errors.show = function() {
        for(const error of errors) {log.warn(error)}
        errors.clear();
    }
    function addKeyToSpr(spr, supressError, ...names) {
        const time = Math.floor(animation.time);
		var key;
        for(const name of names) {
            if (keyTypeFilters[name] === true) {
                key = undefined;
                if ((name === "sx" || name === "sy")) {
                    if (spr.type.normalisable) {
                        spr.addAnimKey(key = {name, time, remember: true, value : name === "sx" ? spr.w : spr.h});
                    } else if (spr.type.attached) {
                        if (name === "sx"){
                            if (spr.attachment.inheritScaleX) {
                                spr.addAnimKey(key = {name, time, remember: true, value : spr.sx / spr.attachedTo.sx});
                            } else {
                                spr.addAnimKey(key = {name, time, remember: true, value : spr[name]})
                            }
                        } else {
                            if (spr.attachment.inheritScaleY) {
                                spr.addAnimKey(key = {name, time, remember: true, value : spr.sy / spr.attachedTo.sy});
                            } else {
                                spr.addAnimKey(key = {name, time, remember: true, value : spr[name]})
                            }
                        }
                    } else { spr.addAnimKey(key = {name, time, remember: true, value : spr[name]}) }
                    API.animationChanged = true;
                } else if (spr.type.attached && (name === "rx" || name === "ry")) {
                    if(spr.attachment.inheritRotate) {
                        spr.addAnimKey(key = {name, time, remember: true, value : spr.attachment[name]});
                    } else {
                        spr.addAnimKey(key = {name, time, remember: true, value : spr[name]});
                    }
                    API.animationChanged = true;
                } else if (spr.type.attached && (name === "x" || name === "y")) {
                    spr.attachedTo.key.scaleSelToLocalP(spr.x, spr.y, spr.attachment.scaleAttachX, spr.attachment.scaleAttachY, workPoint);
                    spr.addAnimKey(key = {name, time, remember: true, value : workPoint[name]});
                    API.animationChanged = true;
                } else if (name === "image") {
                    if(spr.type.subSprite) {
                        spr.addAnimKey(key = {name, time, remember: true, value : spr.subSpriteIdx})
                        API.animationChanged = true;
                    } else if (spr.addAnimKey(key = {name, time, remember: true, value : spr[name]})) {
                        API.animationChanged = true;
                    }

                } else if (name === "rgb") {
                    spr.addAnimKey(key = {name, time, remember: true, value : spr.rgb.copy()})
                     API.animationChanged = true;
                } else {
                    if (spr.addAnimKey(key = {name, time, remember: true, value : spr[name]})) {
                        API.animationChanged = true;
                    } else {
                        key = undefined;
                        errors.add("Could not add key '"+name+"' Sprite wrong type");
                    }
                }
                if(key && key.created) {
                    SKF.add(key.created);
                }
            }
        }
        if (!supressError) { errors.show()  }
        if (API.animationChanged) {
            flashChange = true;
            spr.setAnimFrame(time);
        }
    }
    const spriteState = {}
    const spriteModifyState = {
        clear() { this.subSpriteIdx = this.x = this.y = this.rx = this.ry = this.sx = this.a = this.sy = this.w = this.h = 0 }
    }
    function modifyKeyOfSpr(spr, supressError,...names) {
        if(spr.type.animated) {
            const time = Math.floor(animation.time);
            spr.getAnimatableState(spriteState);
			if (spr.type.subSprite) { spriteState.subSpriteIdx = spr.subSpriteIdx }
            spriteModifyState.clear();
            spr.setAnimFrame(time);
            for (const name of names) {
                if (keyTypeFilters[name] === true) {
                    if(spriteState[name] !== undefined) {
                        if(name === "sx" || name === "sy") {
                            let ok = false;
                            if (spr.type.attached) {
                                if (spr.attachment.inheritScaleX && name === "sx") {
                                    ok = true;
                                    // todo
                                } else if (spr.attachment.inheritScaleY && name === "sy") {
                                    ok = true;
                                    // todo

                                }
                            }
                            if (!ok) {
                                if(spr.type.normalisable) {
                                    if (name === "sx") {
                                        spriteModifyState[name] = spriteState.w / spr.w;
                                    } else {
                                        spriteModifyState[name] = spriteState.h / spr.h;
                                    }
                                } else {
                                    spriteModifyState[name] = spriteState[name] / spr[name];
                                }
                            }
                        } else if(name === "image") {
                            if (spr.type.subSprite) {
                                spriteModifyState.subSpriteIdx = spriteState.subSpriteIdx - spr.subSpriteIdx;
                            } else {
                                spriteModifyState[name] = spriteState[name] - spr[name];
                            }
                        } else if(name === "rgb") {
                            // TO DO
                        }else if((name === "x" || name === "y") && spr.type.attached) {
                            spriteModifyState[name] = spriteState.attachment[name] - spr.attachment[name];
                        }else if((name === "rx" || name === "ry") && spr.type.attached && spr.attachment.inheritRotate) {
                            spriteModifyState[name] = spriteState.attachment[name] - spr.attachment[name];
                        }else{
                            spriteModifyState[name] = spriteState[name] - spr[name];
                        }
                    }
                }
            }
            const a = spr.animation;
            const modSelectedOnly = SKF.length > 0;
            for(const name of names) {
                if (keyTypeFilters[name] === true) {
                    if(spriteState[name] !== undefined) {
                        const track = a.tracks[name];
                        if (track) {
                            const ks = track.keys;
                            const change = name !== "image" ? spriteModifyState[name] : (spr.type.subSprite ? spriteModifyState.subSpriteIdx :  spriteModifyState[name])
                            if(change !== 0) {
                                for (const k of ks) {
                                    if((modSelectedOnly && k.selected) || !modSelectedOnly){
                                        if (name === "rx" || name === "ry") {
                                            if (spr.type.attached && spr.attachment.inheritRotate) {
                                                k.value += change;
                                            }else{
                                                k.value += change;
                                            }


                                        } else if (name === "sx" || name === "sy") {
                                            if (spr.type.normalisable) {
                                                k.value *= change;
                                            } else if (spr.type.attached) {
                                                if (name === "sx") {
                                                    if (spr.attachment.inheritScaleX) {
                                                        k.value = (k.value * change)  / spr.attachedTo.sx;
                                                    } else {
                                                        k.value *= change;
                                                    }
                                                } else {
                                                    if (spr.attachment.inheritScaleY) {
                                                        k.value = (k.value * change)  / spr.attachedTo.sy;
                                                    } else {
                                                        k.value *= change;
                                                    }
                                                }
                                            } else {
                                                k.value *= change;
                                            }
                                        } else if (name === "rgb") { // todo
                                        } else if (name === "a") {
                                            k.value += change;
                                            k.value = k.value < 0 ? 0 : k.value > 1 ? 1 : k.value;
                                        } else {
                                            k.value += change;
                                        }
                                    }
                                    API.animationChanged = true;
                                    spr.updateKeyFrameLookup(name);
                                }
                            }
                        }
                    }
                }
            }
            if (!supressError) { errors.show()  }
            if(API.animationChanged) {
                flashChange = true;
                spr.setAnimFrame(time);
            }
        }
    }
    function addKeyToSelectedSpr(...names) {
        selection.each(spr => { addKeyToSpr(spr, true, ...names) });
        errors.show();
        if(API.animationChanged) {
            flashChange = true;
            animation.forceUpdate();
        }
    }
    function modifyKeysOfSelectedSpr(...names) {
        selection.each(spr => {
            if(spr.type.animated) { modifyKeyOfSpr(spr,true,...names)  }
        });
        errors.show();
        if(API.animationChanged) {
            flashChange = true;
            animation.forceUpdate();
        }
    }
    function removeKeyFromSelectedSpr(...names) {
        const time = Math.floor(animation.time);
        selection.each(spr => {
            for(const name of names) {spr.removeKeyFrame({name, time}) }
            spr.setAnimFrame(time);
        });
        flashChange = true;
        animation.forceUpdate();
    }
    function mouseInOut(event) {
        var target = event.target;
        if(target.animSpr) {
            if(event.type === "mouseout") {
                target.animSpr.highlight = false;
            }  else if(event.type === "mouseover") {
                target.animSpr.highlight = true;
            }
        }
    }
    const disableNoSelected = [
        commands.animSelectAllKeys,
        commands.animRemoveAllKeys,
        //commands.animRemoveCurrentKeys,
        commands.animRemoveSelectedTracks,
        commands.animSetKeyPos,
        commands.animSetKeyScale,
        commands.animSetKeyRotate,
        //commands.animFilterKeys,
        //commands.animFilterKeyPos,
        //commands.animFilterKeyScale,
        //commands.animFilterKeyRotate,
        commands.animGotoPrevKey,
        commands.animGotoNextKey,
        commands.animSetTrackLoop,
        commands.animSetTrackPingPong,
        commands.animKeyCurveLinear,
        commands.animKeyCurveEaseOut,
        commands.animKeyCurveEaseInOut,
        commands.animKeyCurveEaseIn,
        commands.animKeyCurveStep,
        commands.animSelectAllTracks,
        commands.animSelectInvertTracks,
    ];
    $eachOf(keyNames, name => {
        //disableNoSelected.push(commands["animFilterKey_"+name]);
        disableNoSelected.push(commands["animSetKey_"+name]);
    });
    const disableNoSelectedKeys = [
        commands.animRemoveAllKeys,
        //commands.animRemoveCurrentKeys,
        commands.animKeyCurveLinear,
        commands.animKeyCurveEaseOut,
        commands.animKeyCurveEaseInOut,
        commands.animKeyCurveEaseIn,
        commands.animKeyCurveStep,
    ];
    const disableNoSelectedTracks = [
        commands.animRemoveSelectedTracks,
        commands.animSetTrackLoop,
        commands.animSetTrackPingPong,
    ];
    const animKeyTypesGroup = "animKeyTypes";
    const animFilterTypesGroup = "animKeyFilters";
    function noneSelected() {
        buttons.groups.clearGroup(animKeyTypesGroup);
        if(selection.length === 0){
            for(const cId of disableNoSelected){
                buttonMap.get(cId).disable();
            }
        }else {
            for(const cId of disableNoSelected){
                buttonMap.get(cId).enable();
            }
            if(SKF.length === 0){
                for(const cId of disableNoSelectedKeys){
                    buttonMap.get(cId).disable();
                }
            }
        }
    }
    function noneSelectedTracks(hasSelected) {
        for(const cId of disableNoSelectedTracks){
            buttonMap.get(cId)[hasSelected ? "enable" : "disable"]();
        }
    }
    const API = {
        id,
        dragging : false,
        frames : 100,
        currentFrame : 0,
        deserialize(data, UIDOffset) {
            if(data){
                if (data.keyStore) { keySelectStore.deserial(data.keyStore, UIDOffset) }
                if (data.timeMarks) { timeMarks.deserial(data.timeMarks) }
                API.animationChanged = true;
                API.update();
            }
        },
        serialize(selectedOnly = false) {
            return  {
                keyStore: selectedOnly ? undefined : keySelectStore.serial(),
                timeMarks: timeMarks.serial(),
            };
        },
        cleanKeySelections: keySelectStore.clean,
        animatableKeySet: new Set(keyNames),
        compactTimeline : false,
        get marks() { return timeMarks },
        get editMode() { return timelineEditMode },
        set editMode(val) {
            if (val !== timelineEditMode) {
                timelineEditMode = val;
                extraRenders.DOMRenderingFunction("timelineModeUpdate", editModes.updateFunctions[timelineEditMode]);
                editModes.firstCall = true;
                API.update(update.editMode);
            }
        },
        cleanSelectedKeys() {
            SKF.removeHiddenKeys();
            SKF.updateCurves();
        },
        editModes,
        getButton(commandId) { return buttonMap.get(commandId) },
        active : false,
        get frameStep() { return timelineFrameStep },
        set frameStep(value) {
            value = value < 0 ? 0 : value;
            if(value !== timelineFrameStep) {
                timelineFrameStep = value;
                buttonMap.get(commands.animFrameStep).element.textContent = timelineFrameStep;
            }
        },
        activate(on) {
            if(on) {
                if(!displaySizer({isTimelineOpen : true})) { displaySizer({toggleTimeline : true}); }
                API.active = true;
                API.update(0);
            }else {
                if(displaySizer({isTimelineOpen : true})) { displaySizer({toggleTimeline : true}); }
                API.active = false;
            }
            setKeyboardMode();
        },
        activateToggle() {
            displaySizer({toggleTimeline : true});
            API.activate(displaySizer({isTimelineOpen : true}))
        },
        ready() {
			if(API.commands[undefined] !== undefined) { log.error("Timeline commands containes undefined commands.") }
            commandKeyFrameNames = new Map([
                [commands.animSetKeyAll , { keyNames : ["x","y","sx","sy","rx","ry"] }],
                [commands.animSetKeyPosScale , { keyNames : ["x","y","sx","sy"] }],
                [commands.animSetKeyPos , { keyNames : ["x","y"] }],
                [commands.animSetKeyScale , { keyNames : ["sx","sy"] }],
                [commands.animSetKeyRotate , { keyNames : ["rx","ry"] }],
                [commands.animSetKey_x , { keyNames : ["x"] }],
                [commands.animSetKey_y , { keyNames : ["y"] }],
                [commands.animSetKey_sx, { keyNames : ["sx"] }],
                [commands.animSetKey_sy, { keyNames : ["sy"] }],
                [commands.animSetKey_rx, { keyNames : ["rx"] }],
                [commands.animSetKey_ry, { keyNames : ["ry"] }],
                [commands.animSetKey_a , { keyNames : ["a"] }],
                [commands.animSetKey_image , { keyNames : ["image"] }],
                [commands.animSetKey_rgb , { keyNames : ["rgb"] }],
            ]);
            flasherActive = elementFlasher(buttonMap.get(commands.animTimeSlide).element, {keyFrameAdd: "keyFrameAdded"});
            flasher = elementFlasher(editSprites.getButton(commands.animTimeSecondSlider).element, {keyFrameAddSec: "sliderFlash"});
            const fsi  = buttonMap.get(commands.animIncreaseFrameStep);
            const fsd  = buttonMap.get(commands.animDecreaseFrameStep);
            fsi.element.repeater = true;
            fsd.element.repeater = true;
            fsi.element.repeatRate = 500;
            fsd.element.repeatRate = 500;
            buttonMap.get(commands.animRecallKeySelection).disable();
            buttonMap.get(commands.animStoreKeySelection).disable();
            times.end = buttonMap.get(commands.animEndTime);
            times.start = buttonMap.get(commands.animStartTime);
            times.totalSlide = buttonMap.get(commands.animTotalTimeSlide);
            times.totalSlide.element.className = "animTotalSlider";
            times.totalSlide.element.onMove = API.mouseOverTotalTime;
            times.slide = buttonMap.get(commands.animTimeSlide);
            times.slideSecond = editSprites.getButton(commands.animTimeSecondSlider);
            times.editSpriteRGB = editSprites.getButton(commands.edSprFill);
            times.editSpriteAlpha = editSprites.getButton(commands.edSprAlpha);
            times.aem = buttonMap.get(commands.animEditMode);
            times.tabContain = buttonMap.get(commands.animTracks);
            times.tracks = $("table", {className:"tracksTable"});
            times.tracks.updateWheel = times.slide.element.updateWheel;
            for (var i = 0; i < timelineMaxTracks; i ++) {
                const row = times.tracks.insertRow()
                row.updateWheel = times.slide.element.updateWheel;
                row.className = "trackRow0";
                const nameCell = row.insertCell();
                nameCell.className = "trackName";
                ["mouseover", "mouseout"].forEach(name => nameCell.addEventListener(name, mouseInOut, {passive: true}))
                const cellCount = (innerWidth - 558) / 9 | 0;
                for (var j =0; j < cellCount; j ++) {
                    Object.assign(row.insertCell(), {className: "trackKey", wheelNextTarget: true});
                }
            }
            $$(times.tabContain.element, [times.tracks]);
            times.tabContain.element.updateWheel = times.slide.element.updateWheel;
            times.pos                       = $("div", {className: "animSliderPos", textContent: "0:0:0"});
            times.pos.updateWheel           = times.slide.element.updateWheel;
            times.slide.element.onDrag      = times.pos.onDrag = timePosDrag;
            times.totalSlide.element.onDrag = totalTimePosDrag;
            $$(times.slide.element, [times.pos]);
            API.editMode = editModes.place;
            if (displaySizer({isTimelineOpen: true})) { API.activate(true); }
            selection.addEvent("onspriteremoved", (sel, type,spr) => (SKF.unselectSprite(spr)));
            selection.addEvent("change", () => (API.animationChanged = true, API.selectionChanged = true));
            animation.addEvent("change", () => API.animationChanged = true );
            animation.addEvent("playpause", () => {
                if (media.videoCapture && media.videoCapture.canRecord) { editSprites.getButton(commands.edSprBigPlayPause).setSprite(animation.playing ? 1 : 2); }
                else { editSprites.getButton(commands.edSprBigPlayPause).setSprite(animation.playing ? 1 : 0); }
            })
        },
        selectionChanged : false,
        animationChanged : false,
        updateKeyframes : false,
        forceAnimUpdate : false,
        canUpdate : false,
		get keyTypeFilters() { return {...keyTypeFilters} },
        mouseOverTotalTime(mouse, event, out) {
            if(mouse.captured === 0 && mouse.button === 0) {
                times.totalSlide.mx = event.offsetX;
                times.totalSlide.my = event.offsetY;
                times.totalSlide.mouseOver = out ? false : true;
                if(times.totalSlide.lastFrame !== frameCount) {
                    API.updateTotalTimeSlider();
                }
                times.totalSlide.lastFrame = frameCount;
                return true;
            }
        },
        updateRecordMode(mark = true) {
            if(API.editMode === editModes.record) {
                if(widget.modifing) {
                    if(mark) { selection.markAnimatedForChange() }
                    else {
                        selection.checkForAnimatedChanges();
                        widget.modifing = false;
                    }
                }
            }
        },
        updateModifyMode(mark = true) {
            if(API.editMode === editModes.modify) {
                if(widget.modifing) {
                    if(mark) { selection.markAnimatedForChange() }
                    else {
                        selection.checkForAnimatedChanges();
                        widget.modifing = false;
                    }
                }
            }
        },
        addKeyToSpr(spr,commandId) {
            if(commandKeyFrameNames.has(commandId)) {
                 addKeyToSpr(spr,false, ...commandKeyFrameNames.get(commandId).keyNames)
            }
        },
        modifyKeyOfSpr(spr,commandId) {
            if(commandKeyFrameNames.has(commandId)) {
                 modifyKeyOfSpr(spr,false, ...commandKeyFrameNames.get(commandId).keyNames)
            }
        },
        keyUpdate(spr, commandId) {
            if(timelineEditMode === editModes.record) {
                if(commandKeyFrameNames.has(commandId)) {
                     addKeyToSpr(spr, false, ...commandKeyFrameNames.get(commandId).keyNames)
                }
            }else if(timelineEditMode === editModes.modify) {
                if(commandKeyFrameNames.has(commandId)) {
                     modifyKeyOfSpr(spr, false, ...commandKeyFrameNames.get(commandId).keyNames)
                }
            }
        },
        addKeyToSelectedSpr(commandId) {
            if(commandKeyFrameNames.has(commandId)) { addKeyToSelectedSpr(...commandKeyFrameNames.get(commandId).keyNames) }
        },
        modifyKeysOfSelectedSpr(commandId){
            if(commandKeyFrameNames.has(commandId)) { modifyKeysOfSelectedSpr(...commandKeyFrameNames.get(commandId).keyNames) }
        },
        commands: {
            forceAnimUpdate: false,
            [commands.animEditMode](event, left, right) {
                if(right){
                    let mode = API.editMode - 1;
                    mode = (mode + 1) % 3;
                    API.editMode = mode + 1;
                    return false
                }
                return API.commands[commands.animPlayPause](event, left, right);
            },
            [commands.animPlayPause]( ) {
				if (media.videoCapture && !mouse.ctrl && media.videoCapture.status === "Recording") {
					if (stepRecording === false) {
						var lastFrameStep = 0;
						const stop = () => {
							waitingOnReady = false;
							stepRecording = false;
							media.videoCapture.canvas.desc.recording = false;
							buttonMap.get(commands.animGotoNextFrame).enable();
							buttonMap.get(commands.animGotoPrevFrame).enable();
							buttonMap.get(commands.animPlayPause).enable();
							timeline.getButton(commands.animStop).setSprite(0);
							media.videoCapture.busy = false;

						}
						const frameReady = () => {
							if (stepRecording) {
								media.videoCapture.step(timelineFrameStep, result => {
									if(result) {
										if(animation.time < animation.endTime) {
											waitingOnReady = true;
											log("Next at: "+ (animation.time+timelineFrameStep));
											extraRenders.addOneTimeReady(frameReady);
											animation.time += timelineFrameStep;
											return;
										} else {
											media.videoCapture.step(timelineFrameStep);
											stop();
										}
									} else {
										log.error("Video capture failed to capture a frame");
										stop();
									}
								});
							} else { stop() }

						}
						timeline.getButton(commands.animGotoPrevFrame).setSprite(1);
						timeline.getButton(commands.animGotoNextFrame).setSprite(1);
						timeline.getButton(commands.animPlayPause).setSprite(1);
						timeline.getButton(commands.animStop).setSprite(1);
						buttonMap.get(commands.animGotoNextFrame).disable();
						buttonMap.get(commands.animGotoPrevFrame).disable();
						buttonMap.get(commands.animPlayPause).disable();
						extraRenders.addOneTimeReady(frameReady);
						animation.time = animation.startTime;
						waitingOnReady = true;
						stepRecording = true;
						media.videoCapture.canvas.desc.recording = true;
						media.videoCapture.busy = true;
					} else {
						log.warn("Could not start video capture recoding.");
					}


				} else {
					if (animation.playing) { animation.pause() }
					else { animation.play() }
					API.animationChanged = true;
				}
				return false;
            },
            [commands.animStop]() {
				if (media.videoCapture) {
					if (media.videoCapture) {
						if(media.videoCapture.status === "Recording" && stepRecording) {
							stepRecording = false;

						} else {
							log.warn("Video capture is not in recording mode.");
						}

					} else {
						log.warn("There is no video capture source to stop");
					}
				} else {
					if (animation.playing) { animation.pause() }
					animation.time = animation.startTime;
				}
                return false;
            },
            [commands.animGotoStart]() {
                if (animation.playing) {
                    animation.speed = animation.speed / 2;//playSpeed
                    API.update(update.editMode);
                } else { animation.startFrame() }
            },
            [commands.animUpdateUI]() {},
            [commands.animCutSelectedKeys]() {
                log.warn("Cut selected keyframes is currently not avialable in PainterV3");
                return false;
            },
            [commands.animCopySelectedKeys]() {
                SKF.copyToBuffer();
                flashChange = false;
                flasherActive("keyFrameAdd");  // no point creating new flashers so just borrow main and second slider flashers
                flasher("keyFrameAddSec");

                return false;
            },
            [commands.animPasteSelectedKeys]() { SKF.pasteBuffer(); log("Pasted keys to selected"); },
            [commands.animPasteSelectedKeysAtTime]() { SKF.pasteBuffer(animation.time) },
            [commands.animRemoveSelectedTracks]() {
                selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => {
                            if(track.selected) {
                                spr.removeAnimTrack(track.name, true); // true means remove keyframes
                            }
                        });
                    },"animated"
                );
            },
            [commands.animSetTrackLoop]() {
                var loopType;
                selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => {
                            if(track.selected) {
                                if(loopType === undefined) { loopType = track.timing.type === utils.animPlayTypes.normal ? utils.animPlayTypes.loop : utils.animPlayTypes.normal}
                                track.timing.type = loopType;
                                if (loopType === utils.animPlayTypes.loop) {
                                    track.dirty = true;
                                    track.timing.speed = 1;
                                } else if (loopType === utils.animPlayTypes.normal) { track.timing.speed = 1 }
                            }
                        })
                    },"animated"
                );
                buttonMap.get(commands.animSetTrackLoop).setSprite(loopType ? 1 : 0);
            },
            [commands.animSetTrackPingPong]() {
                var playType;
                selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => {
                            if(track.selected) {
                                if(playType === undefined) {
                                    playType = track.timing.play;
                                    if(playType === utils.animPlayTypes.forward){
                                        playType = utils.animPlayTypes.reverse;
                                    }else if(playType === utils.animPlayTypes.reverse){
                                        playType = utils.animPlayTypes.pingPong;
                                    }else if(playType === utils.animPlayTypes.pingPong){
                                        playType = utils.animPlayTypes.leadOn
                                    }else if(playType === utils.animPlayTypes.leadOn){
                                        playType = utils.animPlayTypes.forward
                                    }
                                }
                                track.timing.play = playType;
                                track.dirty = true;
                            }
                        });
                    },"animated"
                );

                buttonMap.get(commands.animSetTrackPingPong).setSprite(playType - utils.animPlayTypes.forward);
                buttonMap.get(commands.animSetTrackPingPong).setHelp(animTrackPingPongTypeHelp[playType - utils.animPlayTypes.forward] + "\nCycle loop type for selected tracks");
            },
            [commands.animRemoveCurrentKeys]() { SKF.deleteKeys(animation.time) },
            [commands.animRemoveAllKeys]() { SKF.deleteKeys() },
            [commands.animMoveKeysLeft]() { SKF.timeMove(-1) },
            [commands.animMoveKeysRight]() { SKF.timeMove(1) },
            [commands.animGotoPrevMark]() {
                const mark = timeMarks.findPrev(animation.time);
                if(mark) { animation.time = mark.time }
            },
            [commands.animGotoNextMark]() {
                const mark = timeMarks.findNext(animation.time);
                if(mark) { animation.time = mark.time }
            },
            [commands.animStartTime](event, left, right) {
                if (right) { animation.startTime = animation.time }
                else { animation.startTime = 0 }
            },
            [commands.animEndTime](event, left, right) {
                if (right) { animation.endTime = animation.time }
                else { animation.endTime = animation.maxLength }
            },
            [commands.animRecallKeySelection]() {
                const idx = buttonMap.get(commands.animRecallKeySelection).selection.index
                const name = keySelectStore.named[idx];
                const keySet = keySelectStore.getNamed(name);
                if(keySet) {
                    SKF.clear();
                    selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => {
                            if(keyTypeFilters[track.name]) {
                                for(const key of track.keys){
                                    if(keySet.includes(key.id)) {
                                        key.selected = true;
                                        SKF.add(key);
                                    }
                                }
                            }
                        })
                    }, "animated");
                    API.animationChanged = true;
                } else { log("No key selection avaliable") }
            },
            [commands.animStoreKeySelection](event, left, right) {
                if(SKF.length > 0){
                    const kss = buttonMap.get(commands.animRecallKeySelection);
                    if(right) {
                        if(keySelectStore.named[kss.selection.index]) {
                            SKF.rememberKeys(keySelectStore.named[kss.selection.index], keySelectStore.store.get(keySelectStore.named[kss.selection.index]));
                            log.info("Updated key selection set");
                        } else {
                            log.warn("Can not update empty set");
                        }
                    }else{
                        SKF.rememberKeys("K" + getGUID());
                        log.info("created new key set");
                        const idx = keySelectStore.named.length - 1;
                    }
                    API.animationChanged = true;
                }
            },
            [commands.animSelectAllTracks]() {
                selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => { track.selected = keyTypeFilters[track.name] ? true : false })
                    },"animated"
                );
                API.update(update.updateDisplayedKeys);
                return false;
            },
            [commands.animGotoEnd]() {
                if(animation.playing) {
                    animation.speed = animation.speed * 2;
                    API.update(update.editMode);
                } else { animation.endFrame()  }
                return false;
            },
            [commands.animIncreaseFrameStep]() {
                API.frameStep += 1;
                return false;
            },
            [commands.animDecreaseFrameStep]() {
                API.frameStep -= 1;
                return false;
            },
            //[commands.animFilterKeys]() {
            //    updateFilters();
            //    return false;
            //},
            [commands.animFilterKeyPos]() {
                keyTypeFilters.y = keyTypeFilters.x = !(keyTypeFilters.x || keyTypeFilters.y);
                API.update(update.keyFilters);
                return false;
            },
            [commands.animFilterKeyScale]() {
                keyTypeFilters.sy = keyTypeFilters.sx = !(keyTypeFilters.sx || keyTypeFilters.sy);
                API.update(update.keyFilters);
                return false;
            },
            [commands.animFilterKeyRotate]() {
                keyTypeFilters.ry = keyTypeFilters.rx = !(keyTypeFilters.rx || keyTypeFilters.ry);
                API.update(update.keyFilters);
                return false;
            },
            [commands.animFilterKey_x]()     { keyTypeFilters.x     = !keyTypeFilters.x; API.update(update.keyFilters); return false },
            [commands.animFilterKey_y]()     { keyTypeFilters.y     = !keyTypeFilters.y; API.update(update.keyFilters); return false },
            [commands.animFilterKey_sx]()    { keyTypeFilters.sx    = !keyTypeFilters.sx; API.update(update.keyFilters); return false },
            [commands.animFilterKey_sy]()    { keyTypeFilters.sy    = !keyTypeFilters.sy; API.update(update.keyFilters); return false },
            [commands.animFilterKey_rx]()    { keyTypeFilters.rx    = !keyTypeFilters.rx; API.update(update.keyFilters); return false },
            [commands.animFilterKey_ry]()    { keyTypeFilters.ry    = !keyTypeFilters.ry; API.update(update.keyFilters); return false },
            [commands.animFilterKey_a]()     { keyTypeFilters.a     = !keyTypeFilters.a; API.update(update.keyFilters); return false },
            [commands.animFilterKey_image]() { keyTypeFilters.image = !keyTypeFilters.image; API.update(update.keyFilters); return false },
            [commands.animFilterKey_rgb]()   { keyTypeFilters.rgb   = !keyTypeFilters.rgb; API.update(update.keyFilters); return false },
            [commands.animFrameStep](e, left, right) {
                if(right) { API.frameStep = 1 }
                return false;
            },
            [commands.animGotoPrevKey]() {
                var t,mTime = -Infinity;
                selection.each(spr => {
                    if (spr.type.animated) { mTime = (t = spr.prevFrameTime()) > mTime ? t : mTime }
                });
                if (mTime < animation.time) { animation.time = mTime }
                return false;
            },
            [commands.animGotoNextKey]() {
                var t,mTime = Infinity;
                selection.each(spr => {
                    if (spr.type.animated) {  mTime = (t = spr.nextFrameTime()) < mTime ? t : mTime }
                });
                if (mTime > animation.time) { animation.time = mTime }
                return false;
            },
            [commands.animGotoNextFrameLoop](event, left, right) {
                API.canUpdate = true;
                animation.addTimeLoop = timelineFrameStep;
                return false;
            },
            [commands.animGotoPrevFrameLoop](event, left, right) {
                API.canUpdate = true;
                animation.addTimeLoop = -timelineFrameStep;
                return false;
            },
            [commands.animGotoNextFrame](event, left, right) {
                if (right) {
					if (animation.speed === 1 && media.videoCapture) {
						log.warn("Max frame rate is 60FPS while capturing video");
					} else {
						animation.speed = animation.speed * 2;
						API.update(update.editMode);
					}
                } else {
                    API.canUpdate = true;
                    //if(mouse.ctrl) {
					if(media.videoCapture && media.videoCapture.status === "Recording" && !mouse.ctrl) {
						if(!media.videoCapture.busy) {
							if(media.videoCapture.frames === 0) {
								media.videoCapture.step(0, result => {
									if (result === false) { log.error("Failed to capture frame") }
								});
							} else {
								extraRenders.addOneTimeReady(() => {
									media.videoCapture.step(timelineFrameStep, result => {
										if (result === false) {
											log.error("Failed to capture frame");
										}
										waitingOnReady = false;
										media.videoCapture.busy = false;
										media.videoCapture.canvas.desc.recording = false;
										buttonMap.get(commands.animGotoNextFrame).enable();
										buttonMap.get(commands.animGotoPrevFrame).enable();
										buttonMap.get(commands.animPlayPause).enable();
									});


								});
								buttonMap.get(commands.animGotoNextFrame).disable();
								buttonMap.get(commands.animGotoPrevFrame).disable();
								buttonMap.get(commands.animPlayPause).disable();
								animation.addTime = timelineFrameStep;
								waitingOnReady = true;
								media.videoCapture.busy = true;
								media.videoCapture.canvas.desc.recording = true;
							}
						} else {
							log.warn("Recoder is busy");
						}


                    } else { animation.addTime = timelineFrameStep }
                }
                return false;
            },
            [commands.animGotoPrevFrame](event, left, right) {
                if(right) {
					if (animation.speed === 1 / 4 && media.videoCapture) {
						log.warn("Min frame rate is 15FPS while capturing video");
					} else {
						animation.speed = animation.speed / 2;
						API.update(update.editMode);
					}
                }else{
                    API.canUpdate = true;
                    //if (mouse.ctrl) {
					if(media.videoCapture && media.videoCapture.status === "Recording" && !mouse.ctrl) {

						if(!media.videoCapture.busy) {
							if(media.videoCapture.frames === 0) {
								media.videoCapture.step(0, result => {
									if (result === false) {
										log.error("Failed to capture frame");
									}
								});

							} else {

								extraRenders.addOneTimeReady(() => {
									media.videoCapture.step(timelineFrameStep, result => {
										if (result === false) {
											log.error("Failed to capture frame");
										}
										waitingOnReady = false;
										media.videoCapture.busy = false;
										media.videoCapture.canvas.desc.recording = false;
										buttonMap.get(commands.animGotoNextFrame).enable();
										buttonMap.get(commands.animGotoPrevFrame).enable();
										buttonMap.get(commands.animPlayPause).enable();
									});


								});
								buttonMap.get(commands.animGotoNextFrame).disable();
								buttonMap.get(commands.animGotoPrevFrame).disable();
								buttonMap.get(commands.animPlayPause).disable();
								animation.addTime = -timelineFrameStep;
								waitingOnReady = true;
								media.videoCapture.busy = true;
								media.videoCapture.canvas.desc.recording = true;
							}
						} else {
							log.warn("Recoder is busy");
						}

                    } else { animation.addTime = -timelineFrameStep }
                }
                return false;
            },
            [commands.animTimeSecondSlider]() {
                animation.time = Number(times.slideSecond.slider.value);
                dontUpdateSecond = true;
                return false;
            },
            [commands.animTrackCompactToggle]() {
                API.compactTimeline = !API.compactTimeline;
                API.animationChanged = true;
                return false;
            },
            [commands.animTrackKeySelect](event, left, right) {
                const target = event ? event.target : undefined;
                if(!target.animKey) {
                    SKF.clear();
                    API.animationChanged = true;
                }else {
                    if(!right) { SKF.clear() }
                    if (!target.animKey.selected) { SKF.add(target.animKey) }
                    else { SKF.remove(target.animKey) }
                    if (API.compactTimeline) {
                        const select = target.animKey.selected;
                        const time = target.animKey.time;
                        target.animSpr.animation.eachTrack(track => {
                            if (keyTypeFilters[track.name]) {
                                track.eachKey(key => {
                                    if(key.time === time) {
                                        if(select) { SKF.add(key) }
                                        else {SKF.remove(key) }
                                    }
                                })
                            }
                        });
                    }
                    target.className = target.animKey.selected ? "trackKeySelected" : "trackKey";
                    target.onDrag = API.onKeyFrameDragStart;
                }
                return false;
            },
            [commands.animSelectInvertTracks]() {
                selection.eachOfType(spr => {
                        spr.animation.eachTrack(track => {
                            if(keyTypeFilters[track.name]) { track.selected = !track.selected }
                             else { track.selected = false }
                        })
                    },"animated"
                );
                API.update(update.updateDisplayedKeys);
                return false;
            },
        },
        command(commandId, _empty, event){  // _empty is mouse Not used in this function (using global mouse)
            var forceAnimUpdate = false
            const rightClicked = (mouse.oldButton & 4) === 4;
            const target = event ? event.target : undefined;
            const keyFrameFunc = rightClicked /*|| mouse.shift*/ ? removeKeyFromSelectedSpr : addKeyToSelectedSpr;
            if (waitingForTempoInput && commandId !== commands.animAddMark && commandId !== commands.animRemoveMark ) {
                waitForTempoInput();
            }
            if (commandKeyFrameNames.has(commandId)) {

                keyFrameFunc(...commandKeyFrameNames.get(commandId).keyNames);
                issueCommand(commands.edSprUpdateAll);
                return;
            }
            if(API.commands[commandId]) {
                if (API.commands[commandId](event, (mouse.oldButton & 1) === 1, (mouse.oldButton & 4) === 4) === false) { return  }
                forceAnimUpdate = true;

            }


            if (commandId === commands.animAddMark || commandId === commands.animRemoveMark ) {
                if(rightClicked || commandId === commands.animRemoveMark ){
                    if(mouse.shift) {
                        if(waitingForTempoInput) {
                            waitForTempoInput();
                        }
                        timeMarks.length = 0;
                        forceAnimUpdate = true;
                        buttonMap.get(commands.animAddMark).element.textContent = "Add";
                    } else {
                        if(timeMarks.has(animation.time)) {
                            timeMarks.remove(animation.time);
                            buttonMap.get(commands.animAddMark).element.textContent = "Add";
                        }else{
                            log.warn("Must be at mark to remove it");
                        }
                    }
                }else{
                    if(!animation.playing && mouse.ctrl) {
                        waitForTempoInput();
                        buttonMap.get(commands.animAddMark).element.textContent = "Tap";
                        return;
                    }else if(waitingForTempoInput) {
                        waitForTempoInput();
                        animation.play()
                        API.animationChanged = true;
                    }
                    if(!mouse.shift && !mouse.ctrl) {
                        if(animation.playing) {
                            const start = animation.startTime;
                            const end = animation.endTime;
                            var time = Math.round((mouse.buttonDownAt - animation.startTick) / (1000/(60 * animation.speed)));
                            time = ((time - start) % (end - start + 1)) + start;
                            let mark;
                            if(timeMarks.has(time)) {
                                mark = timeMarks.get(time);
                            }else{
                                mark = timeMarks.add("Mark "+ String.fromCharCode(("A").charCodeAt(0)+timeMarks.length));
                            }
                            //const but = buttonMap.get(commands.animAddMark).element;
                            //but.textContent = mark.name;
                        } else {
                            let mark;
                            if(timeMarks.has(animation.time)) {
                                mark = timeMarks.get(animation.time);
                            }else{
                                mark = timeMarks.add("Mark "+ String.fromCharCode(("A").charCodeAt(0)+timeMarks.length));
                            }
                            const but = buttonMap.get(commands.animAddMark).element;
                            but.textContent = mark.name;
                            log.warn("Set timeline Mark name. Hit enter or click away when done");
                            setTimeout(()=>{
                                commandLine(()=>{
                                    mark.name = commandLine();
                                    but.textContent = mark.name;
                                });
                                commandLine(mark.name, false, true, true); // last to focus and select
                                },17
                            );
                        }
                    }
                }
            } else if (commandId === commands.animSelectAllKeys ) {
                if ((mouse.oldButton & 4) === 4) {
                    if(mouse.shift && keySelectLastRightButtonKeyTime > - 1) {
                         if (!mouse.ctrl) {
                            SKF.clear();
                        }
                        const f = Math.min(keySelectLastRightButtonKeyTime, animation.time);
                        const t = Math.max(keySelectLastRightButtonKeyTime, animation.time);
                         selection.eachOfType(spr => {
                                spr.animation.eachTrack(track => {
                                    if(keyTypeFilters[track.name]) {
                                        for(const key of track.keys){
                                            if(key.time >= f && key.time <= t && !key.selected) { SKF.add(key) }
                                        }
                                    }
                                })
                            },
                            "animated"
                        );
                    } else {
                        if (!mouse.ctrl) {
                            SKF.clear();
                        }
                        const t = animation.time;
                        keySelectLastRightButtonKeyTime = t;
                        const keysAtTime = [];
                         selection.eachOfType(spr => {
                                spr.animation.eachTrack(track => {
                                    if(keyTypeFilters[track.name]) {
                                        for(const key of track.keys){
                                            if(key.time === t) { keysAtTime.push(key) }
                                        }
                                    }
                                })
                            },
                            "animated"
                        );
                        if(mouse.ctrl) {
                            if (keysAtTime.some(key => !key.selected)) {
                                keysAtTime.forEach(key => !key.selected && ( SKF.add(key) ));
                            } else {
                                keysAtTime.forEach(key => key.selected && ( SKF.remove(key) ));
                            }
                        } else {
                            if (keysAtTime.every(key => key.selected)) {
                                keysAtTime.forEach(key => key.selected && ( SKF.remove(key) ));
                            } else {
                                keysAtTime.forEach(key => !key.selected && ( SKF.add(key) ));
                            }
                        }
                    }
                } else {
                    if (mouse.ctrl) {
                        SKF.removeHiddenKeys();
                        selection.eachOfType(spr => {
                                spr.animation.eachTrack(track => {
                                    if(keyTypeFilters[track.name]) {
                                        for(const key of track.keys){
                                            if (!key.selected) { SKF.add(key) }
                                            else {  SKF.remove(key) }
                                        }
                                    }
                                })
                            },
                            "animated"
                        );
                    }else if (mouse.shift) {
                        SKF.clear();
                    }else{
                        SKF.clear();
                        selection.eachOfType(spr => {
                                spr.animation.eachTrack(track => {
                                    if(keyTypeFilters[track.name]) {
                                        for(const key of track.keys){
                                            if(!key.selected) { SKF.add(key) }
                                        }
                                    }
                                })
                            },
                            "animated"
                        );
                    }
                }
                API.animationChanged = true;
            } else if(commandId >= commands.animKeyCurveLinear && commandId <= commands.animKeyCurveStep) {
                const curveId = commandId - commands.animKeyCurveLinear;
                SKF.setCurve(curveId);
                API.update(0);
            }  else if (commandId >= commands.animFilterKey_x && commandId <= commands.animFilterKeyEnd ) {
                const name = keyNames[commandId - commands.animFilterKey_x];
                keyTypeFilters[name] = !keyTypeFilters[name];
                API.update(update.keyFilters);
            } else if (commandId === commands.animTrackRowSelect ) {
                if (API.compactTimeline) {
                    var select = false;
                    target.animSpr.animation.eachTrack(track => {
                        if (keyTypeFilters[track.name] && !track.selected) { return select = true }
                    });
                    target.animSpr.animation.eachTrack(track => {
                        if (keyTypeFilters[track.name]) {
                            track.selected = select;
                        }
                    });
                }else{
                    const isSelected = target.animSpr.animation.tracks[target.animTrackName].selected = !target.animSpr.animation.tracks[target.animTrackName].selected;
                    if(rightClicked){
                        SKF.removeHiddenKeys();
                        if(isSelected) {
                            for (const key of target.animTrack) { SKF.add(key) }
                        } else {
                            for (const key of target.animTrack) { SKF.remove(key) }
                        }
                    }
                }
                API.animationChanged = true;
            }
            if(forceAnimUpdate) { animation.forceUpdate() }
        },
        animTimeStepsWheel(steps) {
            animation.addTime = steps;
        },
        onKeyFrameDrag() {
            if(mouse.captured === id) {
                var start = animation.startTime;
                var end = animation.endTime;
                var time = animation.time;
                const displayKeyCount = times.tracks.rows[0].cells.length - 2;
                var displayStart, displayEnd;
                const getDisplayRange = (t = time ) => {
                    displayStart = t - displayKeyCount / 2 | 0;
                    displayStart = displayStart + displayKeyCount >= end ? end - displayKeyCount : displayStart;
                    displayStart = displayStart < 0 ? 0 : displayStart;
                    displayEnd = displayStart + displayKeyCount;
                }
                getDisplayRange();
                var pos = keyDrag.dragKeyTime;
                const dist = (mouse.x - keyDrag.start.x) / 9 | 0;
                const mPos = pos + dist;
                const minOffset = start - SKF.min;
                const maxOffset = end - SKF.max;
                var frameSteps = dist < minOffset ? minOffset : dist > maxOffset ? maxOffset : dist;
                if(keyDrag.scaling) { frameSteps = dist }
                pos += frameSteps;
                keyDrag.mouseFrameTime = pos;
                const keyFrameMove = frameSteps - keyDrag.keyOffset;
                if(keyFrameMove !== 0) {
                    keyDrag.keyOffset += keyFrameMove;
                    SKF.timeMove(keyFrameMove);
                    API.animationChanged = true;
                    API.updateKeyframes = true;
                    API.forceAnimUpdate = true;
                    if(pos > displayEnd) {
                        animation.time += pos - displayEnd;
                         keyDrag.start.x -= (pos - displayEnd) * 9;
                    }else  if(pos < displayStart) {
                        animation.time -= displayStart - pos
                         keyDrag.start.x += (displayStart - pos) * 9;
                    }
                }else {
                    if(mPos > displayEnd) {
                        if(SKF.maxMoved >= displayEnd){
                            var move = mPos - displayEnd;
                            if(time + move >= end) { move = end - time }
                            const oldDisEnd = displayEnd
                            getDisplayRange(time + move);
                            if(oldDisEnd < displayEnd) {
                                animation.time += displayEnd - oldDisEnd;
                                keyDrag.start.x -= (displayEnd - oldDisEnd) * 9;
                            }
                        }
                    }else  if(mPos < displayStart) {
                        if(SKF.minMoved <= displayStart){
                            var move = displayStart - mPos;
                            if(time - move <= start) { move = time - start }
                            const oldDisStart = displayStart
                            getDisplayRange(time - move);
                            if(oldDisStart > displayStart) {
                                animation.time -= oldDisStart - displayStart;
                                keyDrag.start.x += (oldDisStart - displayStart) * 9;
                            }
                        }
                    }
                }
            }
        },
        onOutOfKeyFrameDragStart(mouse,event) {
            if (mouse.captured === 0) {
                if (mouse.requestCapture(id)) {
                    if(!mouse.ctrl) {
                        SKF.clear();
                    }else {
                        SKF.holdSelected();
                    }
                    mouse.onmove = API.onOutOfKeyFrameDragStart;
                    mouse.releaseClick = e => {
                        SKF.releaseHeld();
                        mouse.onmove = undefined;
                        mouse.releaseClick = undefined;
                        mouse.release(id);
                        SKF.selector.active = false;
                        API.dragging = false;
                        API.updateKeyframes = true;
                        return true;
                    }
                    SKF.selector.end = SKF.selector.start = event.target.frameTime;
                    SKF.selector.top = SKF.selector.bottom = event.target.frameRow;
                    SKF.selector.mouseX = (mouse.x / 9 | 0) - event.target.frameTime;
                    SKF.selector.mouseY = (mouse.y / 14 | 0) - event.target.frameRow;
                    SKF.selector.active = true;
                    API.dragging = true;
                }
            }else if (mouse.captured === id) {
                var start = animation.startTime;
                var end = animation.endTime;
                var time = animation.time;
                const displayKeyCount = times.tracks.rows[0].cells.length - 2;
                var displayStart, displayEnd;
                const getDisplayRange = (t = time ) => {
                    displayStart = t - displayKeyCount / 2 | 0;
                    displayStart = displayStart + displayKeyCount >= end ? end - displayKeyCount : displayStart;
                    displayStart = displayStart < 0 ? 0 : displayStart;
                    displayEnd = displayStart + displayKeyCount;
                }
                getDisplayRange();
                if (event.target.frameTime === undefined) {
                    SKF.selector.end =  (mouse.x / 9 | 0) - SKF.selector.mouseX;
                } else {
                    SKF.selector.end =  event.target.frameTime;
                }
                if (event.target.frameRow === undefined) {
                    SKF.selector.bottom =  (mouse.y / 14 | 0)  - SKF.selector.mouseY;
                } else {
                    SKF.selector.bottom =  event.target.frameRow;
                }
            }
            API.updateKeyframes = true;
        },
        onKeyFrameDragStart(mouse,event) {
            if (mouse.captured === 0) {
                if (mouse.requestCapture(id)) {
                    keyDrag.scaling = false;
                    SKF.minMaxTime();
                    if(mouse.ctrl || (event.target.animKey.selected && (mouse.button & 4) === 4)){
                        SKF.copyKeys();
                    }else if(mouse.shift) {
                        keyDrag.scaling = true;
                        if(SKF.max - SKF.min < 4) {
                            log.warn("Time range too small to scale")
                            keyDrag.scaling = false;
                        }else {
                            SKF.saveKeyTime();
                            if (event.target.animKey.time > (SKF.min + SKF.max) / 2) {
                                keyDrag.scaleTime = SKF.min;
                                keyDrag.scalePos = SKF.max;
                            } else {
                                keyDrag.scaleTime = SKF.max;
                                keyDrag.scalePos = SKF.min;
                            }
                        }
                    }
                    keyDrag.start.x = mouse.x;
                    keyDrag.start.y = mouse.y;
                    keyDrag.keyOffset = 0;
                    keyDrag.dragKeyTime = event.target.animKey.time;
                    keyDrag.showPos = true;
                    API.dragging = true;
                    times.start.element.classList.add("draggingKeyShowTime");
                    times.end.element.classList.add("draggingKeyShowTime");
                    if(event.target.animKey.selected === false){// && event.target.commandId === commands.animTrackKeySelect) {
                        mouse.oldButton = mouse.button; // Make sure correct button is used
                        API.command(commands.animTrackKeySelect,undefined,event);
                    }
                    mouse.onmove = API.onKeyFrameDrag;
                    mouse.releaseClick = e => {
                        mouse.onmove = undefined;
                        mouse.releaseClick = undefined;
                        mouse.release(id);
                        if(keyDrag.scaling) {
                            SKF.deleteSavedKeyTime();
                            keyDrag.scaling = false;
                        }
                        API.dragging = false;
                        keyDrag.showPos = false;
                        times.start.element.classList.remove("draggingKeyShowTime");
                        times.end.element.classList.remove("draggingKeyShowTime");
                        times.start.element.textContent = timeToStr(animation.startTime);
                        times.end.element.textContent = timeToStr(animation.endTime);
                        return true;
                    }
                }
            }
        },
        updateSecondSlider() {
            if(uiPannelList.sprite.open) {
                const start = animation.startTime;
                const end = animation.endTime;
                const time = animation.time;
                times.slideSecond.slider.max = end-start;
                const oldVal = times.slideSecond.slider.value;
                times.slideSecond.slider.value = Math.round(((time - start) / (end-start)) * (end-start));
                if(oldVal !== times.slideSecond.slider.value) {
                    times.slideSecond.slider.silent = true;  // stops slider issuing command
                    times.slideSecond.element.updateValue();
                    times.slideSecond.slider.silent = false;
                }
            }
        },
        highlightFrameNum: 0,
        updateHighlightSprite() {
            var idx = 0, j, spr1,spr;
            var rows = times.tracks.rows;
            let hasSelectedTracks = false;
            var row = rows[idx++];
            if (mouse.cMouse.over) {
                while (row){
                    spr1 = spr = row.cells[0].animSpr;
                    if (!spr) { break }
                    const highlight = spr.key.over || spr.highlight === true || (spr.shadowedBy && spr.shadowedBy.highlight && spr.shadowedBy.cast.type.openGroup) === true;
                    while (spr === spr1) {
                        if (highlight) { row.classList.add("highlight") }
                        else { row.classList.remove("highlight") }
                        row = rows[idx++];
                        if (!row) {break}
                        spr = row.cells[0].animSpr;
                    }
                }
            } else {
                while (row){
                    spr1 = spr = row.cells[0].animSpr;
                    if (!spr) { break }
                    while (spr === spr1) {
                        row.classList.remove("highlight");
                        row = rows[idx++];
                        if (!row) {break}
                        spr = row.cells[0].animSpr;
                    }
                }
            }
            API.highlightFrameNum = 0;
        },
        showDOMRenderWarning: false,
        update(updateWhat) {
            if(lastFrameId !== frameCount) {
                lastFrameId = frameCount;
                sameFrameCount = 0;
            }
            if(lastFrameId === frameCount) {  // debugging. Timeline can be slow. To make sure this does not get called more than once a frame
                sameFrameCount += 1;
                if(sameFrameCount > 1 && API.showDOMRenderWarning) { log.warn("Timeline update DOM rendering too often : " + sameFrameCount) }

            }
            if(isNaN(updateWhat)) {
                if(updateWhat) {
                    if (updateWhat.APIName === "animation") {
                    } else if (updateWhat.APIName === "selection") {
                        SKF.clear();
                    }
                } else {
                    updateWhat = 0;
                }
            }
            if(API.forceAnimUpdate ) { animation.forceUpdate() }
            API.forceAnimUpdate = false;
            API.animationChanged = false;
            var timePosX, aStart,aEnd ,start, end, time;
            aStart = start = animation.startTime;
            aEnd = end = animation.endTime;
            time = animation.time;
            var showLoopButton = false;
            var loopButtonType;
            var showLoopSetButton = false;
            var loopSetButtonType;
			var loopSetMulti = false;
			var loopMulti = false;
            if(uiPannelList.sprite.open) {
                if(!API.active){
                    editSprites.getButton(commands.edSpriteToggleTimeline).setSprite(timeline.editMode-1);
                }
                if(updateWhat === update.editMode || updateWhat === 0) {
                    times.slideSecond.element.changeColor(editModes.colorSecond[API.editMode]);
                }
                times.slideSecond.slider.max = end-start;
                const oldVal = times.slideSecond.slider.value;
                times.slideSecond.slider.value = ((time - start) / (end-start)) * (end-start) | 0;
                if(oldVal !== times.slideSecond.slider.value) {
                    times.slideSecond.slider.silent = true;  // stops slider issuing command
                    times.slideSecond.element.updateValue();
                    times.slideSecond.slider.silent = false;
                }
                if(selection.length === 1) {
                    const spr = selection[0];
                    const a = spr.a * 255 | 0;
                    times.editSpriteRGB.element.style.background = spr.rgb.css;
                    if(a !== times.editSpriteAlpha.slider.value) {
                        times.editSpriteAlpha.slider.silent = true;  // stops slider issuing command
                        times.editSpriteAlpha.slider.value = a;
                        times.editSpriteAlpha.element.updateValue();
                        times.editSpriteAlpha.slider.silent = false;
                    }
                }
                dontUpdateSecond = false;
            }
            if(selection.length === 1 && selection[0].type.showAnimPath) {
                if(updateWhat === update.updateDisplayedKeys) { animation.animStateUpdate(); }
            }
                 
            if(API.active){
                if(flashChange) {
                    flashChange = false;
                    flasherActive("keyFrameAdd");
                }
                if(selection.length > 0 && keySelectStore.named.length > 0) { buttonMap.get(commands.animRecallKeySelection).enable(); }
                else { buttonMap.get(commands.animRecallKeySelection).disable(); }
                if (selection.length > 0 && SKF.length > 0) { buttonMap.get(commands.animStoreKeySelection).enable(); }
                else { buttonMap.get(commands.animStoreKeySelection).disable(); }
                if(updateWhat === update.updateDisplayedKeys && !API.compactTimeline) {
                    var idx = 0;
                    var row = times.tracks.rows[idx++];
                    let hasSelectedTracks = false;
                    while (row) {
                        j = 1;
                        if (row.cells[0].animTrackName) {
                            const trackSelected = row.cells[0].animSpr.animation.tracks[row.cells[0].animTrackName].selected;
                            row.classList[trackSelected ? "add" : "remove"]("animTrackSelected");
                            if (trackSelected) {
                                if (!hasSelectedTracks) {
                                    showLoopButton = row.cells[0].animSpr.animation.tracks[row.cells[0].animTrackName].timing.type ===  utils.animPlayTypes.loop;
                                }
                                hasSelectedTracks = true
                            }
                            while (j < row.cells.length) {
                                const cell = row.cells[j++];
                                if (cell.animKey) {
                                    cell.className = cell.animKey.selected ? "trackKeySelected" : "trackKey";
                                    cell.onDrag = API.onKeyFrameDragStart;
                                }
                            }
                        } else { break }
                        row = times.tracks.rows[idx++];
                    }
                    noneSelectedTracks(hasSelectedTracks);
                    if(showLoopButton) {
                        buttonMap.get(commands.animSetTrackPingPong).enable();
                    }else {
                        buttonMap.get(commands.animSetTrackPingPong).disable();
                    }
                    SKF.updateCurves();
                    return;
                }
                if(updateWhat === update.keyFilters || updateWhat === 0) {
                    updateFilters();
                    if(updateWhat) { return }
                }
                if(updateWhat === update.editMode || updateWhat === 0) {
                    if(prevMode !== API.editMode){
                        times.pos.classList.remove(editModes.styles[prevMode]);
                        times.pos.classList.add(editModes.styles[API.editMode]);
                        times.pos.classList.add(editModes.styles[API.editMode]);
                        times.aem.element.classList.remove(editModes.styles[prevMode]);
                        times.aem.element.classList.add(editModes.styles[API.editMode]);
                        prevMode = API.editMode;
                    }
                    const speed = animation.speed;
                    var sStr = "";
                    if(speed < 1){
                        sStr = " / " + (1/speed);
                    }else if(speed > 1){
                        sStr = " * " + speed;
                    }
                    times.aem.element.textContent = (animation.playing ? "Pause " : "Play ") + editModes.named[API.editMode] + sStr ;
                    //if(updateWhat) { return }
                }
                if(!timePosSize || timePosSize.width === 0) { timePosSize = times.pos.getBoundingClientRect() }
                if(API.dragging && keyDrag.showPos) {
                    const timeDif =keyDrag.mouseFrameTime-keyDrag.dragKeyTime;
                    times.start.element.textContent = (timeDif < 0 ? "-" : "") + timeToStr(timeDif < 0 ? -timeDif : timeDif );
                    times.end.element.textContent = timeToStr(keyDrag.mouseFrameTime);
                }else{
                    times.start.element.textContent = timeToStr(start);
                    times.end.element.textContent = timeToStr(end);
                }
                times.pos.textContent = timeToStr(time);
                const slideBounds = times.slide.element.getBoundingClientRect();
                if(times.totalSlide.element.width !== slideBounds.width) {
                    times.totalSlide.element.width = slideBounds.width;
                    times.totalSlide.element.style.width = slideBounds.width+"px";
                    times.totalSlide.element.height = TOTAL_SLIDE_HEIGHT;
                    times.totalSlide.element.style.height = TOTAL_SLIDE_HEIGHT+"px";
                }
                var mark = timeMarks.get(animation.time);
                if(mark) {
                    buttonMap.get(commands.animAddMark).element.textContent = mark.name;
                } else {
                    buttonMap.get(commands.animAddMark).element.textContent = "Add";
                }
                timePosX = ((time - start) / (end-start)) * (slideBounds.width - timePosSize.width);
                times.pos.style.left = timePosX + "px";
                var idx = 0;
                noneSelected();
                var track = ("").padStart(animation.endTime - animation.startTime, " ");
                const keyStr = textIcons.keyBoxBig;
                var startK,loopStart, j = 0;
                startK = start;
                var displayKeyCount = times.tracks.rows[idx].cells.length - 2;
                var displayStart = time - displayKeyCount / 2 | 0;
                displayStart = displayStart + displayKeyCount >= end ? end - displayKeyCount : displayStart;
                displayStart = displayStart < 0 ? 0 : displayStart;
                //displayStart = displayStart < start ? start : displayStart;
                var maxTracksDisplayed = false;
                const sel = SKF.selector;
                if(sel.active) { SKF.selector.vetBounds() }
                var atTime  = time - startK + 1 - displayStart;
                const atTimeCSS = " AtTime " + editModes.stylesShort[API.editMode];
                let hasSelectedTracks = false;
                SKF.updateCurves();
                buttonMap.get(commands.animTrackCompactToggle).setSprite(API.compactTimeline ? 1 : 0);

                selection.each(spr => {
                    if (spr.type.animated) {
                        if (API.compactTimeline) {
                            var rowOdd = idx % 2;
                            if(!times.tracks.rows[idx]) { maxTracksDisplayed = true }
                            else {
                                displayStart = displayStart < startK ? startK : displayStart;
                                let keyCount = 0;
                                let trackSelectedCount = 0;
                                let trackCount = 0;
                                spr.animation.eachTrack(track => {
                                    if (keyTypeFilters[track.name]) {
                                        trackSelectedCount += track.selected ? 1 : 0;
                                        trackCount += 1;
                                        if (track.selected) {
											showLoopSetButton = true;
											if (loopSetButtonType !== undefined) {
												if (loopSetButtonType !== track.timing.type) { loopSetMulti = true }
											} else { loopSetButtonType = track.timing.type; }
											if (track.timing.type === utils.animPlayTypes.loop) {
											    showLoopButton = true
												if (loopButtonType !== undefined) {
													if (loopButtonType !== track.timing.play) { loopMulti = true }
												} else { loopButtonType = track.timing.play; }
											}
										}
                                        for (const k of track.keys) {
                                            if (sel.active) {
                                                if (k.time  >= sel.l && k.time  <= sel.r && idx >= sel.t && idx <= sel.b) {
                                                    if (!k.selected) {SKF.add(k) }
                                                } else {
                                                    if (k.selected) {
                                                        if (!(SKF.held.length && SKF.held.includes(k))) { SKF.remove(k) }
                                                    }
                                                }
                                            }
                                            if (k.time >= displayStart && k.time <= displayStart + displayKeyCount) { spriteKeyCompact[keyCount ++] = k; }
                                        }
                                    } else { track.selected = false; }
                                });

                                atTime  = time  + 1 - displayStart;
                                start = startK;
                                j = start;
                                rowStatus[idx] = status.hasKeys;
                                const row = times.tracks.rows[idx];
                                const cell0 = row.cells[0];
                                rowOdd = 0;
                                let trackClass = "trackRow" + rowOdd;
                                let hasSelected = false;
                                if (trackSelectedCount && trackSelectedCount === trackCount) {
                                    trackClass += " animTrackSelected";
                                    hasSelected = true;
                                } else if (trackSelectedCount) { trackClass += " animTrackSomeSelected" }
                                row.className = trackClass + " compact";
                                cell0.className = "trackName compact";
                                cell0.textContent = spr.name;
                                cell0.hasSelected = hasSelected;
                                cell0.commandId = commands.animTrackRowSelect;
                                cell0.animSpr = spr;
                                while (j - displayStart <= displayKeyCount){
                                    const cellIdx = j - displayStart + 1;
                                    const cell = row.cells[cellIdx];
                                    if (j - displayStart >= 0){
                                        cell.animKey = undefined;
                                        cell.animSpr = undefined;
                                        cell.commandID = undefined;
                                        if (start > end){
                                            cell.className = "trackEmptyKey";
                                            cell.onDrag = undefined;
                                        } else {
                                            if (sel.active && j >= sel.l && j <= sel.r && idx >= sel.t && idx <= sel.b) {
                                                cell.className = "trackKey Selecting"+ (cellIdx === atTime ? atTimeCSS : "");
                                            } else {
                                                cell.className = "trackNoKey"+ (cellIdx === atTime ? atTimeCSS: "")+" trackNoKey" + rowOdd + (((j) / 60 | 0) % 2) + (j%2);
                                            }
                                            cell.onDrag = API.onOutOfKeyFrameDragStart;
                                            cell.frameTime = j;
                                            cell.frameRow = idx;
                                            cell.title = (j/60|0)+":"+(j%60);
                                        }
                                    }
                                    j ++;
                                    start++;
                                }
                                for (let i = 0; i < keyCount; i++) {
                                    const k = spriteKeyCompact[i];
                                    const cellIdx = k.time-displayStart+1;
                                    const cell = row.cells[cellIdx];
                                    cell.commandId = commands.animTrackKeySelect;
                                    if (k.selected) { cell.animKey = cell.animKey ? (cell.animKey.selected ? cell.animKey : k) : k; }
                                    else { cell.animKey = cell.animKey ? cell.animKey : k; }
                                    cell.animSpr = spr;
                                    if (cell.animKey.selected) {
                                        cell.className = "trackKey Selected"+ (cellIdx === atTime ? atTimeCSS : "");
                                        cell.onDrag = API.onKeyFrameDragStart;
                                    } else {
                                        cell.className = "trackKey"+ (cellIdx === atTime ? atTimeCSS : "");
                                        cell.onDrag = API.onKeyFrameDragStart;
                                    }
                                }
                            }
                            var b = buttonMap.get(commands.animTrackSelectStart + idx);
                            var t = buttonMap.get(commands.animTrackStart + (idx++));
                            if (b) {
                                b.enable();
                                t.enable();
                            }
                        } else {
                            for (const name of spr.animation.named) {
                                const track = spr.animation.tracks[name];
                                displayStart = displayStart < startK ? startK : displayStart;
                                atTime  = time + 1 - displayStart;
                                if (!keyTypeFilters[name]) { continue }
                                start = startK;
                                j = start;
                                const row = times.tracks.rows[idx];
                                var rowOdd = idx % 2;
                                if (!row) { maxTracksDisplayed = true; break }
                                const cell0 = row.cells[0];
                                rowStatus[idx] = status.hasKeys;
                                if (track.selected) {
                                    showLoopSetButton = true;
                                    if (loopSetButtonType !== undefined) {
                                        if (loopSetButtonType !== track.timing.type) { loopSetMulti = true }
                                    } else {
                                        loopSetButtonType = track.timing.type;
                                    }
                                    if (track.timing.type === utils.animPlayTypes.loop) {
                                        showLoopButton = true
                                        if (loopButtonType !== undefined) {
                                            if (loopButtonType !== track.timing.play) { loopMulti = true }
                                        } else {
                                            loopButtonType = track.timing.play;
                                        }
                                    }
                                    hasSelectedTracks = true;
                                }

                                row.className = "trackRow" + rowOdd + " " + animTrackNameCellClass[name] + (track.selected ? " animTrackSelected" : "");
                                rowOdd = 0;
                                if (name === "image") {
                                    cell0.textContent = animTrackDesc[name](spr);
                                } else {
                                    cell0.textContent = spr.name + ":"+animTrackDesc[name](spr);
                                }
                                cell0.className = "trackName " + animTrackNameCellClass[name];
                                cell0.commandId = commands.animTrackRowSelect;
                                cell0.animTrack = track.keys;
                                cell0.animTrackName = name;
                                cell0.animSpr = spr;
                                const trackTiming = track.timing;
                                var timeBefor = false, timeAfter = false;
                                if (trackTiming.type === utils.animPlayTypes.loop) {
                                    timeBefor = time < trackTiming.start;
                                    timeAfter = time > trackTiming.end;
                                    loopStart = trackTiming.start;
                                    atTime = trackTiming.getTime(time) + 1 - displayStart;
                                    end = trackTiming.end;
                                } else {
                                    loopStart = startK;
                                    end = aEnd;
                                }
                                for (const k of track.keys) {
                                    const cellStart = k.time;
                                    if (start > end) { break }
                                    if (start > cellStart) { continue }
                                    if (sel.active) {
                                        if (cellStart >= sel.l && cellStart <= sel.r && idx >= sel.t && idx <= sel.b) {
                                            if (!k.selected) {SKF.add(k) }
                                        } else {
                                            if (k.selected) {
                                                if (!(SKF.held.length && SKF.held.includes(k))) { SKF.remove(k) }
                                            }
                                        }
                                    }
                                    while (start < cellStart && start <= end) {
                                        const cellIdx = j-displayStart+1;
                                        const cell = row.cells[cellIdx];
                                        if (j - displayStart >= 0) {
                                            cell.animKey = undefined;
                                            cell.animSpr = undefined;
                                            if (start < loopStart) {
                                                cell.className = timeBefor ? "trackEmptyKeyOutside" : "trackEmptyKey";
                                                cell.commandID = undefined;
                                                cell.onDrag = API.onOutOfKeyFrameDragStart;
                                                cell.frameTime = j;
                                                cell.frameRow = idx;
                                                cell.title = (j/60|0)+":"+(j%60);
                                            } else {
                                                if (sel.active && j >= sel.l && j <= sel.r && idx >= sel.t && idx <= sel.b) {
                                                    cell.className = "trackKey Selecting" + (cellIdx === atTime ? atTimeCSS : "");
                                                } else {
                                                    cell.className = "trackNoKey"+ (cellIdx === atTime ? atTimeCSS : "")+" trackNoKey" + rowOdd + (((j) / 60 | 0) % 2) + (j%2);
                                                }
                                                cell.title = (j/60|0)+":"+(j%60);
                                                cell.onDrag = API.onOutOfKeyFrameDragStart;
                                                cell.frameTime = j;
                                                cell.frameRow = idx;
                                            }
                                        }
                                        j++;
                                        start++;
                                        if (j - displayStart  > displayKeyCount) { break }
                                    }
                                    if (start <= end){
                                        if (j - displayStart  > displayKeyCount) { break }
                                        if (j - displayStart >= 0){
                                            const cellIdx = j-displayStart+1;
                                            const cell = row.cells[cellIdx];

                                            if (k.selected) {
                                                cell.className = "trackKey Selected" + (cellIdx === atTime ? atTimeCSS : "") + " " + animKeyCSSIdx2CSSName[animKeyCurveType2CSSIdx[k.curve]];
                                                cell.onDrag = API.onKeyFrameDragStart;
                                            } else {
                                                cell.className = "trackKey " + (cellIdx === atTime ? atTimeCSS : "") + " " + animKeyCSSIdx2CSSName[animKeyCurveType2CSSIdx[k.curve]];
                                                cell.onDrag = API.onKeyFrameDragStart;
                                            }
                                            cell.commandId = commands.animTrackKeySelect;
                                            cell.animKey = k;
                                            cell.animSpr = spr;
                                            cell.title = animTrackDesc[name](spr)
                                        }
                                        j ++;
                                        start += 1
                                        if (j - displayStart  > displayKeyCount) { break }
                                    }
                                }
                                while (j - displayStart  <= displayKeyCount) {
                                    const cellIdx = j-displayStart+1;
                                    const cell = row.cells[cellIdx];
                                    if (j - displayStart >= 0) {
                                        cell.animKey = undefined;
                                        cell.animSpr = undefined;
                                        cell.commandID = undefined;
                                        if (start > end) {
                                            cell.className = timeAfter ? "trackEmptyKeyOutside" : "trackEmptyKey";
                                            cell.onDrag = undefined;
                                                cell.onDrag = API.onOutOfKeyFrameDragStart;
                                                cell.frameTime = j;
                                                cell.frameRow = idx;
                                                cell.title = (j/60|0)+":"+(j%60);
                                        } else {
                                            if (sel.active && j >= sel.l && j <= sel.r && idx >= sel.t && idx <= sel.b) {
                                                cell.className = "trackKey Selecting"+ (cellIdx === atTime ? atTimeCSS : "");
                                            } else {
                                                cell.className = "trackNoKey"+ (cellIdx === atTime ? atTimeCSS: "")+" trackNoKey" + rowOdd + (((j) / 60 | 0) % 2) + (j%2);
                                            }
                                            cell.onDrag = API.onOutOfKeyFrameDragStart;
                                            cell.frameTime = j;
                                            cell.frameRow = idx;
                                            cell.title = (j/60|0)+":"+(j%60);
                                        }
                                    }
                                    j ++;
                                    start++;
                                }
                                var b = buttonMap.get(commands.animTrackSelectStart + idx);
                                var t = buttonMap.get(commands.animTrackStart + (idx++));
                                if (b) {
                                    b.enable();
                                    t.enable();
                                }
                            }
                        }
                    }
                    if (spr.type.animated && spr.animation.atKey) {
                        if (spr.animation.tracks.x && spr.animation.tracks.x.atKey && spr.animation.tracks.y && spr.animation.tracks.y.atKey) { buttons.groups.setCheck(animKeyTypesGroup, commands.animSetKeyPos, true) }
                        if (spr.animation.tracks.sx && spr.animation.tracks.sx.atKey && spr.animation.tracks.sy && spr.animation.tracks.sy.atKey) { buttons.groups.setCheck(animKeyTypesGroup, commands.animSetKeyScale, true) }
                        if (spr.animation.tracks.rx && spr.animation.tracks.rx.atKey && spr.animation.tracks.ry && spr.animation.tracks.ry.atKey) { buttons.groups.setCheck(animKeyTypesGroup, commands.animSetKeyRotate, true) }
                        for (const kName of keyNames) {
                            if (spr.animation.tracks[kName] && spr.animation.tracks[kName].atKey ) { buttons.groups.setCheck(animKeyTypesGroup, commands["animSetKey_"+ kName], true) }
                        }
                    }
                    if (maxTracksDisplayed) { return true } // exit the selection each itteration
                });
                if (API.selectionChanged || keyTrackCount !== idx) {
                    keySelectLastRightButtonKeyTime = -1;
                    keyTrackCount = idx;
                    if (settings.autoSizeTimeline) {
                        displaySizer({horTimeSplit: 24 + 21 + 10 + idx* 15});
                    }
                    API.selectionChanged = false;
                }
                var row = times.tracks.rows[idx++];
                while(row){
                    j = 1;
                    if(rowStatus[idx-1] !== status.clear){
                        rowStatus[idx-1] = status.clear;
                        row.onDrag = undefined;
                        row.className = "trackRow trackRowEmpty";
                        row.cells[0].textContent = "";
                        row.cells[0].animTrack = undefined;
                        row.cells[0].animSpr = undefined;
                        row.cells[0].animTrackName = undefined;
                        row.cells[0].commandID = undefined;
                        while(j < row.cells.length){
                            const cell = row.cells[j++];
                            cell.className = "trackNoKey";
                            cell.title = "";
                            cell.animKey = undefined;
                            cell.animSpr = undefined;
                            cell.commandID = undefined;
                            cell.onDrag = undefined;
                            cell.frameTime = undefined;
                            cell.frameRow = undefined;
                        }
                    }
                    row = times.tracks.rows[idx++];
                }
                noneSelectedTracks(hasSelectedTracks);

				if(showLoopSetButton) {
					buttonMap.get(commands.animSetTrackLoop).enable();
					buttonMap.get(commands.animSetTrackLoop).setSprite((loopSetButtonType === utils.animPlayTypes.loop ? 1 : 0)+(loopSetMulti?2:0));
				} else {
					buttonMap.get(commands.animSetTrackLoop).disable();
				}
                if(showLoopButton) {
                    buttonMap.get(commands.animSetTrackPingPong).enable();
					if(loopButtonType) {
						buttonMap.get(commands.animSetTrackPingPong).setSprite((loopButtonType - utils.animPlayTypes.forward)+(loopSetMulti||loopMulti?4:0));
					}
                }else {
                    buttonMap.get(commands.animSetTrackPingPong).disable();
                }
                //API.updateTotalTimeSlider(displayStart + startK,displayKeyCount);
                API.updateTotalTimeSlider(displayStart,displayKeyCount);
            }
        },
        updateTotalTimeSlider(displayStart = times.totalSlide.displayStart, displayKeyCount = times.totalSlide.displayKeyCount) {
            const mouseOver = times.totalSlide.mouseOver && !API.dragging;
            var over;
            //times.totalSlide.mouseOver = false;
            const EXPAND_L = 2;
            const EXPAND_R = 4;
            const can = times.totalSlide.element;
            const ctx = can.ctx;////////
            ctx.clearRect(0,0,can.width,can.height);
            var start, end, time, totalTime, mT;
            totalTime = animation.maxLengthQuick+ 1;
            const timeScale = can.width / totalTime;
            const frameSize = Math.ceil(timeScale)
            if(mouseOver) {
                var mx = times.totalSlide.mx;
            }else {
                var mx = -1000;
            }
            start = animation.startTime;
            end = animation.endTime;
            time = animation.time;
            displayStart = displayStart < start ? start : displayStart;
            displayKeyCount = end - start + 1 < displayKeyCount ? end - start + 1 : displayKeyCount;
            times.totalSlide.displayStart = displayStart;
            times.totalSlide.displayKeyCount = displayKeyCount;
            const startPos = start * timeScale | 0;
            const endPos = end * timeScale | 0;
            ctx.fillStyle = editModes.colorSecondTotalB[timelineEditMode];
            ctx.fillRect(startPos, 2, Math.ceil((end-start+1)*timeScale), TOTAL_SLIDE_HEIGHT - 4);
            if (mouseOver && mx >= startPos-EXPAND_L && mx <= startPos + frameSize + EXPAND_L) {
                over = "startTime";
            } else if(mouseOver && mx >= endPos-EXPAND_L && mx <= endPos + frameSize + EXPAND_L) {
                over = "endTime";
            }
            ctx.fillStyle = editModes.colorSecondTotalA[timelineEditMode];
            ctx.fillRect(displayStart * timeScale | 0 + 2, 3, Math.ceil(displayKeyCount*timeScale)-4, TOTAL_SLIDE_HEIGHT-6);
            ctx.fillStyle = "#aaF";
            ctx.beginPath();
            for(const mark of timeMarks) {
                const x = mark.time * timeScale | 0;
                if(!over && mouseOver && mx >= x-EXPAND_L && mx <= x + frameSize + EXPAND_L) {
                    over = mark;
                }else{
                    ctx.fillRect(x-EXPAND_L, 1, frameSize+EXPAND_R, TOTAL_SLIDE_HEIGHT-2);
                }
            }
            if(!over && mouseOver && (mx > endPos || mx < startPos)) {
                over = "outside"
            }
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.fillRect(time * timeScale | 0, 0, frameSize, TOTAL_SLIDE_HEIGHT );
            if(mouseOver){
                if (over === "outside") {
                    ctx.strokeStyle = editModes.colorSecondTotalC[timelineEditMode];;
                    ctx.strokeRect(startPos-EXPAND_L + 0.5, 0.5, endPos-startPos+frameSize +EXPAND_L-0.5, TOTAL_SLIDE_HEIGHT-1);
                    mouse.requestCursor(id,"time_seg_ew");
                    can.overMark = over;
                }else if (over === "startTime") {
                    ctx.fillStyle = editModes.colorSecondTotalC[timelineEditMode];;
                    mouse.requestCursor(id,"time_start_ew");
                    ctx.fillRect(startPos-EXPAND_L, 0, frameSize+EXPAND_R, TOTAL_SLIDE_HEIGHT);
                    can.overMark = over;
                 } else if(over === "endTime") {
                    ctx.fillStyle = editModes.colorSecondTotalC[timelineEditMode];;
                    ctx.fillRect(endPos-EXPAND_L, 0, frameSize+EXPAND_R, TOTAL_SLIDE_HEIGHT);
                    mouse.requestCursor(id,"time_end_ew");
                    can.overMark = over;
                } else if(over) {
                    ctx.fillStyle = "cyan";
                    const x = over.time * timeScale | 0;
                    ctx.fillRect(x-EXPAND_L, 0, frameSize+EXPAND_R, TOTAL_SLIDE_HEIGHT);
                    can.title = over.name + " " + frameToStr(over.time);
                    can.overMark = over;
                    mouse.requestCursor(id,"time_mark_ew");
                }else{
                    ctx.fillStyle = "black";
                    const x = (mT = mx / timeScale | 0) * timeScale | 0;
                    ctx.fillRect(x-EXPAND_L, 0, frameSize+EXPAND_R, TOTAL_SLIDE_HEIGHT);
                    can.title = frameToStr(mT);
                    can.overMark = undefined;
                    mouse.requestCursor(id,"time_slide_ew");
                }
                mouse.updateCursor(can);
            }else if(!API.dragging) {
               can.overMark = undefined;
                mouse.requestCursor(id,"pointer");
                mouse.updateCursor(can);
            }
        },
        setButtons(buttons){
            for (const but of buttons) { buttonMap.set(but.command, but) }
            return buttons;
        },
    };
    Object.assign(API, Events(API));
    function getSettings(){
        if (timelineMaxTracks !== settings.timelineMaxTracks) {
            log.warn("Max tracks requiers restart to update.");
        }
        timelineMaxTracks = settings.timelineMaxTracks;
    }
    var timelineMaxTracks = settings.timelineMaxTracks;
    getSettings();
    settingsHandler.onchange = getSettings;    
    
    return API;
})();
