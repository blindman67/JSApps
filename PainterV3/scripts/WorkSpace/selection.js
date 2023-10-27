"use strict";
const selection = (()=>{
    const workPointA = {x : 0, y : 0};
    var index = -1;
    var addCount = 0;
    var dirty = false;
    var waitForEvent = false;
    const workingExtent = Extent();
    const stateStack = [];
    var markedForAnimChange;

    function changedOn() {
        if (! waitForEvent) {
            undos.undoable = true;
            if (eventCallbacks.change) { API.fireEventFast(eventCallbacks.change, API) }
            API.update();
            dirty = false;
        }
    };
    function changedSilent() {  };
    var changed = changedOn;
    const API = Object.assign([],{
        update() {
            if (timeline.active) { timeline.highlightFrameNum = frameCount }
            /*extrasList.callByCommand(extrasList.paths.sprites.properties.feedbackToggle, true);*/
            extrasList.callByCommand(extrasList.paths.sprites.setFont, true);
        },
        APIName : "selection",
        each(cb) { index = 0; for (const spr of API) { if( cb(spr, index++) === true ) { return --index  } } },
        eachUpdate(cb) { index = 0; for (const spr of API) { cb(spr, index++); spr.key.update() } },
        call(functionName, ...args) { for (const spr of API) { spr[functionName](...args) }  },
        callIf(predicate, functionName, ...args) { index = 0; for (const spr of API) { if (predicate(spr,index)) { spr[functionName](...args) } index++ } },
        processImages(cb) {
            index = 0;
            for (const spr of API) { if(spr.type.image) { spr.image.marked = false } }
            for (const spr of API) {
                if(spr.type.image && spr.image.marked === false) {
                    spr.image.processed = cb(spr.image, index, spr);
                    spr.image.marked = true;
                }
                index += 1;
            }
        },
        restoreDrawable(markRestored = true){
            for(const spr of this) {
                if(spr.drawOn) {
                    spr.image.restore(markRestored);
                    if(spr.type.animated && spr.animation.tracks.image) {
                        for(const key of spr.animation.tracks.image.keys) {
                            if (key.value.processed) {
                                key.value.restore(markRestored);
                            }
                        }
                    }
                }
            }
        },        
        processAnimatedImages(cb) {
            index = 0;
            for (const spr of API) {
                if(spr.type.image) {
                    spr.image.marked = false
                    if (spr.type.animated && spr.animation.tracks.image && !spr.type.subSprite) {
                        spr.animation.tracks.image.eachKey(key => { key.value.marked = false});
                    }
                }
            }
            for (const spr of API) {
                if(spr.type.image) {
                    if(spr.image.marked === false) {
                        spr.image.processed = cb(spr.image, index, spr);
                        spr.image.marked = true;

                    }
                    if (spr.type.animated && spr.animation.tracks.image  && !spr.type.subSprite) {
                        spr.animation.tracks.image.eachKey(key => {
                            if (key.value.marked === false) {
                                key.value.processed = cb(key.value, index, spr);
                                key.value.marked = true;
                            }

                        });
                    }
                }
                index += 1;
            }
        },
        eachImage(cb){
            index = 0;
            for (const spr of API) { if(spr.type.image) { spr.image.marked = false } }
            for (const spr of API) {
                if(spr.type.image && spr.image.marked === false) {
                    cb(spr, spr.image, index);
                    spr.image.marked = true;
                }
                index += 1;
            }
        },
        eachVector(cb){
            index = 0;
            for (const spr of API) { if(spr.type.vector) { spr.vector.marked = false } }
            for (const spr of API) {
                if(spr.type.vector && spr.vector.marked === false) {
                    cb(spr,spr.vector,index);
                    spr.vector.marked = true;
                }
                index += 1;
            }
        },
        eachOfType(cb, typeName, typeValue = true) {
            index = 0;
            for (const spr of this) {
                if ( spr.type[typeName] === typeValue) {
                    if (cb(spr,index) === true) {
                        return index
                    }
                }
                index ++;
            }
        },
        countOfType(typeName, typeValue = true) {
            var c = 0;
            for (const spr of this) {
                if ( spr.type[typeName] === typeValue) { c++ }
            }
			return c++;
        },		
        hasType(typeName, typeValue = true) {
            for (const spr of this) {
                if ( spr.type[typeName] === typeValue) { return true }
            }
			return false;            
        },
        eachOfTypes(cb, ...typeNames) {
            var typeName, typeValue;
            for (const type of typeNames) {
                if (Array.isArray(type)) {
                    typeName = type[0];
                    typeValue = type[1];
                }else {
                    typeName = type;
                    typeValue = true;
                }
                index = 0;
                for (const spr of this) {
                    if ( spr.type[typeName] === typeValue) {
                        if (cb(spr,index) === true) {
                            return index
                        }
                    }
                    index ++;
                }
            }
        },
        arrayOfType(typeName, typeValue = true) {
            const a = [];
            for (const spr of this) {
                if ( spr.type[typeName] === typeValue) { a.push(spr) }
            }
            return a;
        },
        setSilent(value) {
            changed = value ? changedSilent : changedOn;
            if(! value && dirty) {
                changed();
                if(dirty) {log.error("Selection unclean. Who is playing dirty with selection. Coder MUST FIX THIS.")}
            }
        },
        getSilent() { changed === changedSilent },
        set silent(value) {
            changed = value ? changedSilent : changedOn;
            if(! value && dirty) {
                changed();
                if(dirty) {log.error("Selection unclean. Who is playing dirty with selection. Coder MUST FIX THIS.")}
            }
        },
        get silent() { changed === changedSilent },
        isSelected(spr) { return API.some(s => spr === s) },
        setValue(prop,value) {
            if(timeline.animatableKeySet.has(prop)) {
                API.markAnimatedForChange();
                for (const spr of API) {
                    if (spr.type.group && !spr.type.shape) { spr.group.each(spr => spr[prop] = value) }
                    if (spr.type.shadow) { spr.shadow[prop] = value }
                    spr[prop] = value;
                }
                API.checkForAnimatedChanges();
            }else {
                for (const spr of API) {
                    if (spr.type.group && !spr.type.shape) { spr.group.each(spr => spr[prop] = value) }
                    if (spr.type.shadow) { spr.shadow[prop] = value }
                    spr[prop] = value;
                }
            }
        },
        setType(typeName,value) { for (const spr of API) { spr.type[typeName] = value === true } },
        setValueIf(predicate,prop,value) { index = 0; for (const spr of API) { if(predicate(spr,index++)){ spr[prop] = value } } },
        contains(spr) { return API.each(s => spr.guid === s.guid) !== undefined },
        sortByIndex() { API.sort((a,b)=>a.index - b.index) },
        sortByAttached() {
            if(!sprites.attachedOrder) {
                throw new Error("selection.sortByAttached is returning an array????? WHY!!!1");
                return API.asArray();
            }
            const ao = sprites.attachedOrder;
            API.sort((a,b) => {
                const aIdx = ao.indexOf(a);
                const bIdx = ao.indexOf(b);
                if(aIdx === -1 && bIdx === -1) {
                    return a.index - b.index;
                }
                if(aIdx === -1) { return 1 }
                if(bIdx === -1) {return -1 }
                return aIdx - bIdx;
            })
        },
        asArrayOfType(type) {
            return this.filter(spr => spr.type[type]);
        },
        asArray() {
            API.sortByIndex();
            return [...API]
        },
        save() { stateStack.push([...API]) },
        restore() {
            if(stateStack.length > 0) {
                API.clear();
                API.add(stateStack.pop());
            }
        },
        asGUIDArray() {
            var ids = [];
            API.each(spr=> ids.push(spr.guid));
            return ids;
        },
        addByGUIDArray(ids){
            addCount = 0;
            waitForEvent = true;
            for(const guid of ids){
                const spr = sprites.getByGUID(guid);
                if(spr) { API.add(spr) }
            }
            waitForEvent = false;
            if(addCount > 0) { changed() }
        },
        clear(silent = false) {
            if (API.length > 0) {
                API.each(spr => {
                    spr.selected = false
                    if (!silent) {
                        if (eventCallbacks.onspriteremoved) { API.fireEventFast(eventCallbacks.onspriteremoved, spr) }
                    }
                } );
                API.length = 0;
                if (!silent) { changed() }
                else { dirty = true }
            }
            return API;
        },
        removeByType(typeName, typeValue, silent = false, cb) {
            const sprToRemove = this.arrayOfType(typeName, typeValue);
            if (cb) {
                let count = 0;
                sprToRemove.forEach(spr => {if (cb(spr) === true) { this.remove(spr, silent); count ++ }});
                return count;
            }
            sprToRemove.forEach(spr => this.remove(spr, silent));
            return sprToRemove.length;
        },
        remove(spr, silent = false) {
            if(API.contains(spr)){
                API.splice(index,1);
                spr.selected = false;
                if (!silent) {
                    if (eventCallbacks.onspriteremoved) { API.fireEventFast(eventCallbacks.onspriteremoved, spr) }
                    changed();
                }
                else { dirty = true }
            }
            return API;
        },
        align(how, alt = false, add = false, extent, min = false){
            timeline.canUpdate = true;
            selection.markAnimatedForChange();
            if (sprites.attachedOrder) { API.sortByAttached() }

            //const extent = API.getExtent();
            extent = extent === undefined ? API.getExtent() : extent;
            const [ecx, ecy] = extent.center();
            const center = {x: ecx, y: ecy};
            var axis = how === "verSpace" || how === "verBox" || how === "top" || how === "bottom" || how === "middle"  ? "y" : "x";
            var axisOff = axis === "y" ? "x" : "y";
            var dim = how === "verSpace" || how === "verBox" || how === "top" || how === "bottom" || how === "middle" ? "h" : "w";
            var dimOff = dim === "h" ? "w" : "h";
            if (alt && (how === "top" || how === "left"))  {
                if (min) {
                    var minV = -Infinity;
                    API.each(spr => { minV = Math.max(minV, spr.key.extent[axis]) });
                    API.eachUpdate(spr => {
                        const hh = (spr.key.extent[axis] + spr.key.extent[dim]) - minV;
                        spr["s" + axis] *= hh / (spr[dim] * spr["s" + axis]);
                        spr[axis] += (minV + hh / 2) - (spr.key.extent[axis] + spr.key.extent[dim] / 2) ;
                    });
                } else {
                    API.eachUpdate(spr => {
                        const hh = (spr.key.extent[axis] + spr.key.extent[dim]) - extent[axis];
                        spr["s" + axis] *= hh / (spr[dim] * spr["s" + axis]);
                        spr[axis] += (extent[axis] + hh / 2) - (spr.key.extent[axis] + spr.key.extent[dim] / 2) ;
                    });
                }
            } else if (alt && (how === "bottom" || how === "right")) {
                if (min) {
                    var minV = Infinity;
                    API.each(spr => { minV = Math.min(minV, spr.key.extent[axis] + spr.key.extent[dim]) });
                    API.eachUpdate(spr => {
                        const hh = minV - spr.key.extent[axis];
                        spr["s" + axis] *= hh / (spr[dim] * spr["s" + axis]);
                        spr[axis] += (minV - hh / 2) - (spr.key.extent[axis] + spr.key.extent[dim] / 2) ;
                    });
                } else {
                    API.eachUpdate(spr => {
                        const hh = (extent[axis] + extent[dim]) - spr.key.extent[axis];
                        spr["s" + axis] *= hh / (spr[dim] * spr["s" + axis]);
                        spr[axis] += (extent[axis] +  extent[dim] - hh / 2) - (spr.key.extent[axis] + spr.key.extent[dim] / 2) ;
                    });
                }
            } else if (how === "top" || how === "left") {
                API.eachUpdate(spr => {
                    spr[axis] = extent[axis] + spr.key.extent[dim] / 2
                })
            } else if (how === "bottom" || how === "right") {
                API.eachUpdate(spr =>  {
                    spr[axis] = extent[axis] + extent[dim] - spr.key.extent[dim] / 2;
                    //spr[axis] += (extent[axis] + extent[dim]) - (spr.key.extent[axis] + spr.key.extent[dim])
                })
            } else if (how === "middle" || how === "center") {
                API.eachUpdate(spr =>  {
                    spr[axis] = center[axis];
                   // spr[axis] += (extent[axis] + extent[dim] / 2) - (spr.key.extent[axis] + spr.key.extent[dim] / 2)
                });
            } else if (how === "verBox" || how === "horBox") {
                if(API.length > 1) {
                    var sortedB = [...API].sort((a,b)=>a.key.extent[axisOff] - b.key.extent[axisOff]);
                    const columns = [];
                    var topSpr;
                    while(sortedB.length) {
                        const column = [topSpr = sortedB.shift()];
                        columns.push(column);
                        const edge = topSpr[axisOff] - (topSpr[dimOff] * topSpr["s" + axisOff]) / 2;
                        const ex = topSpr.key.extent;
                        var i = 0;
                        while(i < sortedB.length) {
                            const spr = sortedB[i];
                            const e = spr.key.extent;
                            const center = e[axisOff] + e[dimOff] / 2;
                            if (center > ex[axisOff] && center < ex[axisOff] + ex[dimOff]) {
                                column.push(sortedB.splice(i,1)[0]);

                            } else { i++ }
                        }
                        column.sort((a,b)=>a.key.extent[axis] - b.key.extent[axis]);
                    }
                    for(const sorted of columns) {
                        if(sorted.length > 1) {
                            sorted[0][axis] -= sorted[0].key.extent[axis] - extent[axis];
                            sorted[0].key.update();
                            sorted[0].key.calcExtent();

                            if (alt) {
                                let space = add ? 1 : 0;
                                if (alt && axis === "y" && !sorted.some(spr => !spr.type.functionLink)) { space = 4 }
                                for(var i = 1; i < sorted.length; i++){
                                    var spr1 = sorted[i-1];
                                    var spr = sorted[i];
                                    var x = spr1.key.extent[axis] + spr1.key.extent[dim] + space;
                                    spr[axis] += x - spr.key.extent[axis];
                                    spr.key.update();
                                    spr.key.calcExtent();
                                }
                            } else {
                                const bot = sorted[sorted.length - 1];
                                bot[axis] += (extent[axis] + extent[dim]) - (bot.key.extent[axis] +  bot.key.extent[dim]);
                                bot.key.update();
                                bot.key.calcExtent();
                                let dist = extent[dim] - bot.key.extent[dim] - sorted[0].key.extent[dim];

                                let size = sorted.reduce((size,spr) => size + spr.key.extent[dim], 0);
                                size -= sorted[sorted.length-1].key.extent[dim] + sorted[0].key.extent[dim];
                                let space = (dist- size) / (sorted.length-1)  + (add ? 1 : 0);
                                const itemLen = add ? sorted.length : sorted.length-1;
                                let max = extent[axis] + extent[dim];
                                for(var i = 1; i < itemLen; i++){
                                    var spr1 = sorted[i-1];
                                    var spr = sorted[i];
                                    var x = spr1.key.extent[axis] + spr1.key.extent[dim] + space;
                                    spr[axis] += x - spr.key.extent[axis];
                                    spr.key.update();
                                    spr.key.calcExtent();
                                    max = Math.max(spr.key.extent[axis] + spr.key.extent[dim], max);
                                }
                            }
                        } else {

                        }
                    }
                }
            } else if (how === "horSpace" || how === "verSpace" ) {
                if(API.length > 1) {
                    var sorted = [...API].sort((a,b)=>a.key.extent[axis] - b.key.extent[axis]);
                    if (alt) {
                        let space = add ? 1 : 0;
                        if (alt && axis === "y" && !sorted.some(spr => !spr.type.functionLink)) { space = 4 }
                        for(var i = 1; i < sorted.length; i++){
                            var spr1 = sorted[i-1];
                            var spr = sorted[i];
                            var x = spr1.key.extent[axis] + spr1.key.extent[dim] + space;
                            spr[axis] += x - spr.key.extent[axis];
                            spr.key.update();
                            spr.key.calcExtent();
                        }
                    } else {
                        let dist = extent[dim] - sorted[sorted.length-1].key.extent[dim] - sorted[0].key.extent[dim];

                        let size = sorted.reduce((size,spr) => size + spr.key.extent[dim], 0);
                        size -= sorted[sorted.length-1].key.extent[dim] + sorted[0].key.extent[dim];
                        let space = ((dist- size) / (sorted.length-1)) + (add ? 1 : 0);
                        let max = extent[axis] + extent[dim];
                        const itemLen = add ? sorted.length : sorted.length-1;
                        for(var i = 1; i < itemLen; i++){
                            var spr1 = sorted[i-1];
                            var spr = sorted[i];
                            var x = spr1.key.extent[axis] + spr1.key.extent[dim] + space;
                            spr[axis] += x - spr.key.extent[axis];
                            spr.key.update();
                            spr.key.calcExtent();
                            max = Math.max(spr.key.extent[axis] + spr.key.extent[dim], max);
                        }
                    }
                }
            }else if(how === "packedBoxes" || how === "packedSortedBoxes" || how === "packedSortedBoxesSmallFirst"){
                if(API.length > 1) {
                    if (how === "packedSortedBoxes") { API.sort((a,b)=> b.key.extent.w  *  b.key.extent.h - a.key.extent.w  *  a.key.extent.h) }
                    if (how === "packedSortedBoxesSmallFirst") { API.sort((a,b)=> a.key.extent.w  *  a.key.extent.h - b.key.extent.w  *  b.key.extent.h) }
                    if (how === "packedBoxes") { $randShuffle(API) }
                    var area = 0;
                    var maxWidth = 0;
                    var x = Infinity, y = Infinity;
                    API.each(spr => {
                        maxWidth = Math.max(maxWidth, spr.key.extent.w + 2);
                        area += (spr.key.extent.w + 2) * (spr.key.extent.h + 2);
                        x = Math.min(spr.key.extent.x,x);
                        y = Math.min(spr.key.extent.y,y);
                    });
                    x -= 1;
                    y -= 1;
                    var width = Math.ceil(Math.max(Math.sqrt(area), maxWidth));
                    var height = Math.ceil(area / width);
                    width -= maxWidth / 2 | 0;  // start a little under sized
                    height -= maxWidth / 2 | 0;
                    //log("Packing " + API.length + " sprites to fit  " + width + " by " + height + " : " + area.toFixed(0)+ "px sqr");
                    var packer = utils.boxPacker;
                    packer.init(width, height, 1);
                    var packing = true;
                    const next = (sprIdx) => {
                        while(sprIdx < API.length) {
                            var spr = API[sprIdx++];
                            var pos = packer.addBox(0,0,spr.key.extent.w, spr.key.extent.h);
                            if(packer.didFit) {
                                spr.x = (pos.x + pos.w / 2 + x);
                                spr.y = (pos.y + pos.h / 2 + y);
                                spr.key.update();
                            }else {
                                packer.grow(Math.ceil(spr.key.extent.w / 2),Math.ceil(spr.key.extent.h / 2));
                                packer.reset();
                                setTimeout(() => next(0),0);
                                return true;
                            }
                        }
                        packer.close();
                        packer = undefined;
                        selection.callIf(spr => spr.type.normalisable, "normalize");
                        utils.tidyWorkspace();
                        const resExt = API.getExtent();

                        selection.checkForAnimatedChanges();
                        log.info("Packing result " + ((area / (resExt.w * resExt.h)) * 100).toFixed(1) + "%");
                    }
                    setTimeout(() => next(0),2);
                    return;
                }
            }else if(how === "square"){
                if(API.length > 1){
                    var side = Math.sqrt(API.length);
                    var maxX = 0;
                    var maxY = 0;
                    API.each(spr => {
                        maxX = Math.max(spr.key.extent.w,maxX);
                        maxY = Math.max(spr.key.extent.h,maxY);
                    });
                    var [cx,cy] = extent.center();
                    cx -= (side / 2) * maxX;
                    cy -= (side / 2) * maxY;
                    cx += maxX / 2;
                    cy += maxY / 2;
                    var ccx = cx;
                    var i = 0;
                    side = (side + 0.5) | 0;
                    while(i < API.length){
                        for(var x = 0; x < side && i < API.length; x ++){
                            const spr = API[i++];
                            spr.x = cx;
                            spr.y = cy;
                            spr.key.update();
                            cx += maxX;
                        }
                        cx = ccx;
                        cy += maxY;
                    }
                }
            }
            selection.callIf(spr => spr.type.normalisable, "normalize");
            selection.checkForAnimatedChanges();
        },
        addByName(name){
            var found = false;
            addCount = 0;
            waitForEvent = true;
            sprites.each(spr=>{ if(spr.name === name){ selection.add(spr); found = true }});
            waitForEvent = false;
            if(addCount > 0 ||dirty) { changed() }
            return found;
        },
        addByImageName(name){
            var found = false;
            addCount = 0;
            waitForEvent = true;
            sprites.each(spr=>{ if(spr.type.image && spr.image.desc.name === name){ selection.add(spr); found = true   }});
            waitForEvent = false;
            if(addCount > 0 || dirty) { changed() }
            return found;
        },
        add(spr) {
            if (spr === undefined) { return API }
            if (Array.isArray(spr)) {
                addCount = 0;
                waitForEvent = true;
                spr.forEach(spr => API.add(spr) );
                waitForEvent = false;
                if(addCount > 0 || dirty) { changed() }
                return API;
            }
            if(spr.isCollection) {
                API.add(spr.asArray());
                return API;

            }
            if(spr.isSprite && !API.contains(spr)){
                spr.selected = true;
                API.push(spr);
                addCount ++;
                changed();
            }
            return API;
        },
        markAnimatedForChange(arr) {
            const frame = animation.time;
            if(arr) {
                if(markedForAnimChange) {
                    log.error("Bad call to markAnimatedForChange. Previouse marked set not processed");
                }
                markedForAnimChange = arr;
                for(const spr of arr) {
                    spr.key.hasAnimatablePropertyChanged(frame, true);
                }
            } else {
                for(const spr of this) {
                    spr.key.hasAnimatablePropertyChanged(frame, true);
                }
            }
        },
        checkForAnimatedChanges() {

            const frame = animation.time;
            if (markedForAnimChange) {
                for(const spr of markedForAnimChange) {
                    spr.key.hasAnimatablePropertyChanged(frame);
                }
                markedForAnimChange = undefined;
            } else {
                for(const spr of this) {
                    spr.key.hasAnimatablePropertyChanged(frame);
                }
            }
        },
        changeShape(shapeName, force = false) {

            for(const spr of this) {
                if(spr.type.shape && (spr.shapeName !== shapeName || force)) {
                    spr.changeToShape(undefined,shapeName);
                }
            }
        },
        moveAttachOrder(dir, refSpr) { // up is towards 1 down towards last, top is 1 bottom is last
                                       // if refSpr then up means all selected lower zorder than ref spr down all selected higher than refSpr
            const roots = new Set();
            const top = dir === "top";
            const bottom = dir === "bottom";
            const up = dir === "up";
            const down = dir === "down";
            const refIdx = refSpr?.attachment?.zorder;
            const useRef = refSpr !== undefined;
            for (const spr of this) {
                if ((refSpr?.type.attached && refSpr.attachedTo === spr.attachedTo) || (!refSpr && spr.type.attached)) {
                    !roots.has(spr.attachedTo) && roots.add(spr.attachedTo);
                }
            }
            var t, o , i, topBot = [], other = [];
            for (const root of roots) {
                i  = 0;
                other.length = topBot.length = 0;
                const attached = [...root.attachers.values()];
                while (i < attached.length) {
                    const a = attached[i];
                    if (a.selected) {
                        if (top || bottom) {
                            topBot.push(a);
                        } else if (up || down) {
                            const idx = useRef ? (up ? refIdx - 1 : refIdx + 1) : (up ? i - 1 : i + 1);
                            topBot.push({idx, attached: a});
                        }

                    } else {
                        if (top || bottom) {
                            other.push(a);
                        } else if (up || down) {
                            other.push({idx: i, attached: a});

                        }
                    }
                    i++
                }
                if (top) {
                    root.attachers.clear();
                    for (const spr of topBot) { root.attachers.add(spr) }
                    for (const spr of other) { root.attachers.add(spr) }
                } else if (bottom) {
                    root.attachers.clear();
                    for (const spr of other) { root.attachers.add(spr) }
                    for (const spr of topBot) { root.attachers.add(spr) }
                } else if (up) {
                    root.attachers.clear();
                    while (other.length && topBot.length) {
                        o = other[0].idx;
                        t = topBot[0].idx - 1;
                        if (o < t) {
                            root.attachers.add(other.shift().attached);
                        } else {
                            root.attachers.add(topBot.shift().attached);
                            o === t && other[0].idx ++;
                        }
                    }
                    const remaining = topBot.length ? topBot : other;
                    for (const a of remaining) { root.attachers.add(a.attached) }

                } else if (down) {
                    root.attachers.clear();
                    while (other.length && topBot.length) {
                        o = other[other.length - 1].idx;
                        t = topBot[topBot.length - 1].idx + 1;
                        if (o > t) {
                            root.attachers.add(other.pop().attached);
                        } else {
                            root.attachers.add(topBot.pop().attached);
                            o === t && (other[other.length - 1].idx --);
                        }
                    }
                    const remaining = (topBot.length ? topBot : other).reverse();
                    for (const a of remaining) { root.attachers.add(a.attached) }
                    const reverable = [...root.attachers.values()].reverse();
                    root.attachers.clear();
                    for (const a of reverable) { root.attachers.add(a) }

                }
                i = 0;
                for (const spr of root.attachers.values()) { spr.attachment.zorder = i++  }


            }
        },
        move(mx,my) {
            API.eachUpdate(spr => {
                if(!spr.type.hasLocators){
                    spr.x += mx;
                    spr.y += my;
                }
            });
            return API;
        },
        ikSolver(spr, mx, my) {
            const a = spr.attachment;
            if(spr.type.attached && !spr.attachedTo.selected) {
                const s1 = spr.attachedTo;
                if(s1.type.attached && !s1.attachedTo.selected) {
                    const s2 = s1.attachedTo;
                    var xB = spr.x -s1.x;
                    var yB = spr.y -s1.y;
                    var xA = s1.x - s2.x;
                    var yA = s1.y - s2.y;
                    var xC = spr.x -s2.x;
                    var yC = spr.y -s2.y;
                    var xC1 = (spr.x + mx) -s2.x;
                    var yC1 = (spr.y + my) -s2.y;
                    var B = (xB * xB + yB * yB) ** 0.5;
                    var A = (xA * xA + yA * yA) ** 0.5;
                    var C = (xC * xC + yC * yC) ** 0.5;
                    var C1 = (xC1 * xC1 + yC1 * yC1) ** 0.5;
                    const max = (A + B) * 0.995;
                    const min  = Math.abs(A-B) * (1/0.995)
                    C1 = C1 > max ? max : C1 < min ? min : C1;
                    var ab = Math.acos((C1 * C1 - (A * A + B * B)) / (-2 * A * B));
                    var ca = Math.acos((B * B - (C1 * C1 + A * A)) / (-2 * C1 * A));
                    if(C > 0 && C1 > 0) {
                        var AS2_Spr = Math.atan2(yC1, xC1);
                        var AS2_S1 = AS2_Spr - ca;
                        var AS1_Spr = AS2_S1 + Math.PI - ab;
                        var oa = s2.ry - s2.rx
                        var oa1 = s1.ry - s1.rx
                        s1.rx = AS1_Spr;
                        s1.ry = AS1_Spr + oa1;
                        s1.key.update();
                        s2.rx = AS2_S1;
                        s2.ry = AS2_S1 + oa;
                        s2.key.update();
                        spriteRender.utils.start()
                        spriteRender.utils.line(
                            s2.x, s2.y,
                            s2.x + Math.cos(AS2_S1) * A,
                            s2.y + Math.sin(AS2_S1) * A
                        );
                        spriteRender.utils.line(
                            s1.x, s1.y,
                            s1.x + Math.cos(AS1_Spr) * B,
                            s1.y + Math.sin(AS1_Spr) * B
                        );
                        spriteRender.utils.stroke(2,"#FF0");
                        return true;
                    }
                }else{
                    var x1 = spr.x -s1.x;
                    var y1 = spr.y -s1.y;
                    var x2 = (spr.x + mx) -s1.x;
                    var y2 = (spr.y + my) -s1.y;
                    var dist1 = (x1 * x1 + y1 * y1) ** 0.5;
                    var dist2 = (x2 * x2 + y2 * y2) ** 0.5;
                    if(dist1 > 0 && dist2 > 0) {
                        var nx1 = x1 / dist1;
                        var ny1 = y1 / dist1;
                        var nx2 = x2 / dist2;
                        var ny2 = y2 / dist2;
                        var crossAng = Math.sin(Math.asin(nx1 * ny2 - ny1 * nx2));
                        s1.rx += crossAng;
                        s1.ry += crossAng;
                        s1.key.update();
                        var xdx = Math.cos(s1.rx);
                        var xdy = Math.sin(s1.rx);
                        var ydx = Math.cos(s1.ry);
                        var ydy = Math.sin(s1.ry);
                       // spr.x = s1.x + xdx * a.x + ydx * a.y;
                      //  spr.y = s1.y + xdy * a.x + ydy * a.y;
                       // spr.x = s1.x + xdx * nx1 * dist1 + ydx * ny1 * dist1;
                       // spr.y = s1.y + xdy * nx1 * dist1 + ydy * ny1 * dist1;
                    }
                    spriteRender.utils.start()
                    spriteRender.utils.line(s1.x, s1.y, spr.x, spr.y);
                    spriteRender.utils.stroke(2,"#FF0");
                     return true;
                }
            }
            return false;
        },
        widgetMove(mx,my, relocate) {
            API.eachUpdate(spr => {
                if(!spr.locks.position) {
                    const x = spr.locks.positionX ? 0 : mx;
                    const y = spr.locks.positionY ? 0 : my;
                    if(!spr.type.hasLocators || (spr.type.hasLocators && spr.locators.length === 1)){
                        if (!spr.type.attached) {
                            spr.x += x;
                            spr.y += y;
                       // } else if(API.ikSolver(spr,mx,my)) {
                        } else if (spr.type.attached && !spr.attachedTo.selected) {
                            if(spr.attachedTo.type.attached) {
                                var s = spr.attachedTo;
                                var count = API.length+1;
                                var canNotMove = false;
                                while(s.type.attached && count --) {
                                    if(s.attachedTo.selected) {
                                        canNotMove = true;
                                        break;
                                    }
                                    s = s.attachedTo;
                                }
                                if( !canNotMove) {
                                    spr.x += x;
                                    spr.y += y;
                                }
                            }else{
                                spr.x += x;
                                spr.y += y;
                            }
                        }
                        if((spr.locks.locX || spr.locks.locY) && (spr.type.hasLocators && spr.locators.length === 1)) {
                            spr.key.keyPos(spr.x,spr.y)
                        }
                        if(relocate && spr.locates) {
                            for(const s of spr.locates) {
                                s.locators.moveLocator(spr)
                            }
                        }
                    }
                }
            });
            return API;
        },
        moveLocalUnit(ux, uy, wx, wy){
            API.eachUpdate(spr=>{
                if(!spr.type.hasLocators){
                    spr.key.toWorld(ux * spr.w,uy * spr.h);
                    spr.x += wx - spr.key.wx;
                    spr.y += wy - spr.key.wy;
                }
            });
            return API;
        },
        moveLocal(lx, ly, wx, wy){
            API.eachUpdate(spr=>{
                if(!spr.type.hasLocators){
                    spr.key.toWorld(lx,ly);
                    spr.x += wx - spr.key.wx;
                    spr.y += wy - spr.key.wy;
                }
            });
            return API;
        },
        scale(x, y, sx, sy) {
            if(API.length === 1){
                API[0].scaleAt(x,y,sx,sy);
            } else {
                API.eachUpdate(spr=>{
                    spr.key.toLocal(x,y);
                    spr.scaleAt(spr.key.lx, spr.key.ly, sx, sy);
                });
            }
            return API;
        },
        scaleLocal(sx, sy) {
            API.eachUpdate(spr=>{
                spr.sx *= sx;
                spr.sy *= sy;
            });
            return API;
        },
        rotate(x, y, angX, angY = angX) {
            API.eachUpdate(spr => { spr.rx += angX; spr.ry += angY });
            return API;
        },
        widgetRotate(x, y, angX, angY = angX, skew = false, rotAll = false) {

            const ax = Math.cos(angX);
            const ay = Math.sin(angY);
            API.eachUpdate(spr => {
                if (rotAll) {
                    if(!spr.locks.position) {
                        const xx = spr.x - x;
                        const yy = spr.y - y;
                        const nx = xx * ax - yy * ay + x;
                        const ny = xx * ay + yy * ax + y;
                        const mx = spr.locks.positionX ? spr.x : nx;
                        const my = spr.locks.positionY ? spr.y : ny;
                        if(!spr.type.hasLocators || (spr.type.hasLocators && spr.locators.length === 1)){
                            if (!spr.type.attached) {
                                spr.x = mx;
                                spr.y = my;
                            } else if (spr.type.attached && !spr.attachedTo.selected) {
                                if(spr.attachedTo.type.attached) {
                                    var s = spr.attachedTo;
                                    var count = API.length + 1;
                                    var canNotMove = false;
                                    while(s.type.attached && count --) {
                                        if(s.attachedTo.selected) {
                                            canNotMove = true;
                                            break;
                                        }
                                        s = s.attachedTo;
                                    }
                                    if( !canNotMove) {
                                        spr.x = mx;
                                        spr.y = my;
                                    }
                                }else{
                                    spr.x = mx;
                                    spr.y = my;
                                }
                            }
                            if((spr.locks.locX || spr.locks.locY) && (spr.type.hasLocators && spr.locators.length === 1)) {
                                spr.key.keyPos(spr.x, spr.y)
                            }
                            if(spr.locates) {
                                for(const s of spr.locates) {
                                    s.locators.moveLocator(spr)
                                }
                            }
                        }
                    }
                }
                var apply = true;
                if (!spr.locks.rotate) {
                    const rx = spr.locks.rotateX ? 0 : angX;
                    const ry = spr.locks.rotateY ? 0 : angY;
                    if (spr.type.lookat) {
                        if(skew) {
                            spr.ry += ry;
                        }else{
                            spr.lookat.offsetX +=  rx;
                        }
                        apply = false;
                    }
                    if (spr.type.attached && spr.attachment.inheritRotate) {
                        spr.attachment.rx += rx;
                        spr.attachment.ry += ry;
                        spr.attachedTo.key.update();
                        apply = false;
                    }
                    if (apply) {
                        spr.rx += rx;
                        spr.ry += ry;
                    }
                }
            });
            return API;

        },
        getExtent(extent, animated = false, inner = false) {
            if (extent === undefined) {extent = Extent() }
            else { extent.irate() }
            if(animated) {
                const currentTime = animation.time;
                const start = animation.startTime;
                const end = animation.endTime;
                for (var t = start; t <= end; t++) {
                    animation.fastSeek = t;
                    API.each(spr => { spr.key.calcExtent(extent) });
                }
                animation.time = currentTime;
            } else {
                API.each(spr => { spr.key.calcExtent(extent) });
            }
            if(inner) { extent.inner() }
            return extent;
        },
        getLocksAndExtent(extent, locks) {
            if (extent === undefined) {extent = Extent() }
            else { extent.irate() }
            locks.on();
            API.each(spr => {
                spr.key.calcExtent(extent);
                locks.rotateX = locks.rotateX && (spr.locks.rotate || spr.locks.rotateX);
                locks.rotateY = locks.rotateY && (spr.locks.rotate || spr.locks.rotateY);
                locks.scaleX = locks.scaleX && (spr.locks.scale || spr.locks.scaleX);
                locks.scaleY = locks.scaleY && (spr.locks.scale || spr.locks.scaleY);
                locks.positionX = locks.positionX && (spr.locks.position || spr.locks.positionX);
                locks.positionY = locks.positionY && (spr.locks.position || spr.locks.positionY);
            });
            return extent;
        },
        setView(view){
            workingExtent.irate();
            API.each(spr => { spr.key.calcExtent(workingExtent) });
            view.centerOn(...workingExtent.center());
        },
        unShadow() {
            var i;
            for(i = 0; i < API.length; i++){
                if(API[i].shadow) {
                    API[i].selected = false;
                    API[i] = API[i].shadow;
                    API[i].selected = true;
                }
            }
        },
        getCommonGroup() {
            const parents = new Set();
            var noCommonParent = false;
            this.each(spr => {
                if(!spr.type.inGroup) {
                    noCommonParent = true;
                    return true;
                }
            });
            if(noCommonParent) {
                return [];
            }
            this.each(spr => {
                sprites.getParentGroupsFor(spr, parents);
            });
            return [...parents.values()];
        },
        hasKey(key) {
            var found = false;
            API.each(spr => {
                if (spr.type.animated) {
                    spr.animation.eachTrack(t => {
                        t.eachKey(k => {
                            if (k === key) { found = true }
                            return found;
                        });
                        return found;
                    });
                }
                return found;
            });
            return found;

        },
        hasMedia(media) {
            var found = false;
            API.each(spr => { if(spr.image === media) { return found = true } } );
            return found;
        },
        hasMediaForSave(media) {
            var found = false;
            this.each(spr => {
                if(spr.image === media) { return found = true }
                if(spr.type.animated) {
                    if(spr.animation.tracks.image) {
                        spr.animation.tracks.image.eachKey(key => {
                            if(key.value === media) { return found = true }
                        });
                    }
                }
                if(spr.type.shape && spr.shape.name === "vector") {
                    if(spr.shape.data.desc.fromImage === media) { return found = true }
                }
                return found;
            });
            return found;
        },        
        fix() {
            const safeNum = (v, rep = 0) => (isNaN(v) || v < -(2 ** 31) || v > ((2 ** 31) -1)) ? rep : v;
            const needFix = v => isNaN(v) || v < -(2 ** 31) || v > ((2 ** 31) -1);

            API.each(s => {
                s.x = safeNum(s.x);
                s.y = safeNum(s.y);
                s.sx = safeNum(s.sx,1);
                s.sy = safeNum(s.sy,1);
                if(needFix(s.rx) || needFix(s.ry)) {
                    s.rx = 0;
                    s.ry = Math.PI / 2;

                }
                if(needFix(s.w) || needFix(s.h)) {
                    if(s.type.image) {
                        if(s.type.vector) {
                            s.w = s.vector.w;
                            s.h = s.vector.h;
                        } else {
                            s.w = s.image.w;
                            s.h = s.image.h;
                        }
                    }else {
                        s.w = settings.cutterSize;
                        s.h = settings.cutterSize;
                    }
                }
                s.cx = safeNum(s.cx, s.w * s.sx);
                s.cy = safeNum(s.cy, s.h * s.sy);
                s.a = safeNum(s.a, 1)
                s.a = s.a < 0 || s.a > 1 ? 1 : s.a;
                if(s.type.attached) {
                    s.attachment.locate();
                    s.attachment.x = safeNum(s.attachment.x);
                    s.attachment.y = safeNum(s.attachment.y);
                    if(needFix(s.attachment.rx) || needFix(s.attachment.ry)) {
                        s.attachment.rx = 0;
                        s.attachment.ry = Math.PI / 2;
                    }
                    s.attachment.rotOffset = Math.PI / 2;
                    s.attachment.sx = safeNum(s.attachment.sx,1);
                    s.attachment.sy = safeNum(s.attachment.sy,1);
                }


            });
            sprites.update();
        },
        spritePannel: null,
        get extras() {
            function filterSprites(predicate, all){
                const sprIn = sprites.filter(spr => {
                    var found = false;
                    if(!spr.selected) {
                        if(all){
                            found = true;
                            selection.each(selSpr => {
                                if(!predicate(selSpr,spr)) { found = false }
                            })
                        }else{
                            selection.each(selSpr => (found = predicate(selSpr,spr)))
                        }
                    }
                    return found;
                });
                API.clear();
                API.add(sprIn);
                utils.tidyWorkspace();
            }
            const extras = {
                foldInfo: {
                    help: "All things sprites, shapes, layouts and more",
                    foldClass: "extrasSprites",
                },
                spriteDialog: {
                     help : "Open general purpose sprite dialog",
                    call() {
                         setTimeout(()=>commandLine("run safe spritePositionDialog",true),0)
                    },
                },
                saveShapeAsJavascript: {
                    help: "Saves a javascript file containing function to create selected paths as a Path2D",
                    call() {
                        const utils = `
const createPathDraw = (path, fill, stroke, fillOver) => (ctx, x, y, sx = 1, sy = sx, rx = 0, ry = rx + Math.PI / 2) => {
        ctx.setTransform(Math.cos(rx) * sx, Math.sin(rx) * sx, Math.cos(ry) * sy, Math.sin(ry) * sy, x, y);
        fill && (ctx.fill(path),stroke && ctx.stroke(path), true) || stroke && (ctx.stroke(path), fillOver && ctx.fill(path));
    }
const createPainterV3Path = (path, width, height) => Object.freeze(Object.assign(path, {
        width, height,
        fill: createPathDraw(path, true, false,  false),
        stroke: createPathDraw(path, false, true,  false),
        strokeFill: createPathDraw(path, false, true,  true),
        fillStroke: createPathDraw(path, true, true,  false),
    }));
`;
                        const sprJS = "const ##NAME## = createPainterV3Path(new Path2D(\"##PATH##\"), ##W##, ##H##);";
                        if (selection.length) {
                            const strs = [];
                            var name = "";
                            API.eachOfType(spr => {
                                const sp2D = ShadowPath2D();
                                if (!name) { name = spr.name + "_Shape2D.js" }
                                spr.shape.create(sp2D, spr);
                                strs.push(
                                    sprJS.replace("##NAME##",  spr.name)
                                        .replace("##PATH##",  sp2D.toString())
                                        .replace("##W##",  "" + (Math.round(spr.w * 1000) / 1000))
                                        .replace("##H##",  "" + (Math.round(spr.h * 1000) / 1000))
                                );
                            }, "shape");
                            if (strs.length) {
                                downloadData(
                                    storage.jsInfoHeader(name) + "\n"+utils+"\n\n" +  strs.join("\n"),
                                    name,
                                    "text/javascript"
                                );
                            } else {
                                log.warn("None of the selected sprites contain paths");
                            }

                        } else { log.warn("No shapes selected") }
                    },
                },
                spritePannel: {
                    help: "Opens a floating pannel containing the first selected sprite",
                    call() {
                        if (selection.length) {
                            let found;
                            selection.each(spr => {
                                if (spr.type.image) {
                                    found = spr;
                                    return true;
                                }
                            });
                            if (found) {
                                SpritePannel(found);
                            }
                        }

                    }
                },
                setProperty : {
                    help : "Set variouse sprite properties not directly avalible via the UI",
                    call() { setTimeout(()=>commandLine("run safe setSpriteProperties",true),0) }
                },
                /*feedbackToggle : {
                    help : "Toggle capture sprite feed back",
                    call(item, state) {
                        if(state !== undefined) {
                            var on = false,off = false
                            selection.eachOfType(spr => {
                                if(spr.type.captureFeedback) {
                                    on = true;
                                } else {
                                    off = true;
                                }
                            },"image");
                            if(on && off) {
                                item.element.textContent = "Feedback On && Off";
                            }else if(on){
                                item.element.textContent = "Feedback On";
                            }else{
                                item.element.textContent = "Feedback Off";
                            }
                        }else{
                            var count = 0, val;
                            selection.eachOfType(spr => {
                                    if (val === undefined) { val = ! spr.type.captureFeedback}
                                    spr.type.captureFeedback = val;
                                    count ++;
                                },"image");
                            if(val) {
                                item.element.textContent = "Feedback On";
                            }else {
                                item.element.textContent = "Feedback Off";
                            }
                        }
                    }
                },*/
                setFont : {
                    help : "Shows a menu to set current selected text sprite's font/nOnly for text sprites",
                    call(item, update){
                        if(update !== undefined) {
                            var font;
                            selection.eachOfType(spr => {
                                if(font === undefined) {
                                    font = spr.textInfo.font;
                                } else if(font !== spr.textInfo.font){
                                    font = "Multiple fonts";
                                }
                            },"text");
                            if(font){
                                item.element.textContent = "Set Font ["+font+"]";
                            }else {
                                item.element.textContent = "Set Font";
                            }
                        } else {
                            setTimeout(()=>commandLine("run safe setFont",true),0) ;
                        }
                    }
                },
                as_ISO: {
                    help: "Toggles selected sprites as ISOmetric changing how it is transformed",
                    call() {
                        var asIso;
                        selection.each(spr => {
                            if(asIso === undefined) {
                                asIso = !spr.type.ISO;
                            }

                            if (asIso) { spr.makeIso() }
                            else { spr.removeIso() }
                        });
                        if(asIso){
                            log.info(selection.length +" set as isometic");
                        }else{
                            log.info(selection.length +" set as normal");

                        }
                    }

                },
                fixSprite: {
                    help: "Restores corrupted values of selected as best possible",
                    call() { selection.fix() },
                },
                resize : {
                    addLeft : { help : "Add 1 pixel to left of selected sprites", call() { selection.call("grow", 1, 0, 0, 0); utils.tidyWorkspace(); }, },
                    addTop : { help : "Add 1 pixel to top of selected sprites", call() { selection.call("grow", 0, 1, 0, 0); utils.tidyWorkspace(); }, },
                    addRight : { help : "Add 1 pixel to right of selected sprites", call() { selection.call("grow", 0, 0, 1, 0); utils.tidyWorkspace(); }, },
                    addbottom : { help : "Add 1 pixel to bottom of selected sprites", call() { selection.call("grow", 0, 0, 0, 1); utils.tidyWorkspace(); }, },
                    addAll : { help : "Add 1 pixel to all sides of selected sprites", call() { selection.call("grow", 1, 1, 1, 1); utils.tidyWorkspace(); }, },
                    removeLeft : { help : "Remove 1 pixel from left of selected sprites", call() { selection.call("grow", -1, 0, 0, 0); utils.tidyWorkspace(); }, },
                    removeTop : { help : "Remove 1 pixel from top of selected sprites", call() { selection.call("grow", 0, -1, 0, 0); utils.tidyWorkspace(); }, },
                    removeRight : { help : "Remove 1 pixel from right of selected sprites", call() { selection.call("grow", 0, 0, -1, 0); utils.tidyWorkspace(); }, },
                    removebottom : { help : "Remove 1 pixel from bottom of selected sprites", call() { selection.call("grow", 0, 0, 0, -1); utils.tidyWorkspace(); }, },
                    removeAll : { help : "Remove 1 pixel from all sides of selected sprites", call() { selection.call("grow", -1, -1, -1, -1); utils.tidyWorkspace(); }, },
                },
                arrange : {
                    asSquare : {
                        help : "Moves selected sprites to best fit square.",
                        call() { selection.align("square"); utils.tidyWorkspace() },
                    },
                    packToMinSpace : {
                        help : "Moves selected sprites to best fit square.",
                        call() { selection.align("packedBoxes"); utils.tidyWorkspace() },
                    },
                    packSorted : {
                        help : "Moves selected sprites to best fit square.\nSprites are sorted by size first",
                        call() { selection.align("packedSortedBoxes"); utils.tidyWorkspace() },
                    },
                    packSortedSmall : {
                        help : "Moves selected sprites to best fit square.\nSprites are sorted by size first from small to large",
                        call() { selection.align("packedSortedBoxesSmallFirst"); utils.tidyWorkspace() },
                    },
                    fitToView : {
                        help : "Moves, scales, and rotates selected sprites to fit the current view",
                        call() { selection.call("fitToView",view); utils.tidyWorkspace() },
                    },
                    alignByPixelCount: {
                        help : "Arranges selected sprites in a row sorted by pixel count\nWill compute pixel counts if not already computed",
                        call() {
                            timeline.canUpdate = true;
                            selection.markAnimatedForChange();                            
                            const imgSprs = selection.arrayOfType("image");
                            imgSprs.forEach(spr => spr.image?.desc?.pixelCount === undefined && localProcessImage.countPixels(spr.image) );
                            imgSprs.sort((a, b) => (b.image?.desc?.pixelCount ?? 0) - (a.image?.desc?.pixelCount ?? 0));
                            const minX = Math.min(...(imgSprs.map(spr => spr.x - spr.cx)));
                            const minY = Math.min(...(imgSprs.map(spr => spr.y - spr.cy)));
                            var x = minX;
                            imgSprs.forEach(spr => {
                                spr.x = x + spr.cx;
                                spr.y = minY;
                                x += spr.w;
                                spr.key.update();
                            });
                            selection.checkForAnimatedChanges();
                            utils.tidyWorkspace()
                            
                        }
                    },
                    asLineBetween : {
                        help : "First two selected end points of line from select sprite",
                        call() {
                            if(sprites.selectingSprite && editSprites.selectingUtilName === "Sprite as line") {
                                widget.specialSelectionSelect(true);
                            }else if(sprites.selectingSprite) {
                                log.info("Complete current selection first");
                            }else{
                                const selectLineSprite = (between) => {
                                    const x1 = between[0].x;
                                    const y1 = between[0].y;
                                    const x2 = between[1].x;
                                    const y2 = between[1].y;
                                    const dist = Math.hypot(x1-x2,y1-y2);
                                    const ang = Math.atan2(y2-y1,x2-x1);
                                    const cx = (x1 + x2) / 2;
                                    const cy = (y1 + y2) / 2;
                                    if(selection.length > 0){
                                        selection.each(spr => {
                                            spr.x = cx;
                                            spr.y = cy;
                                            const dif = spr.ry - spr.rx;
                                            spr.rx = ang;
                                            spr.ry = ang + dif;
                                            spr.setSize(dist, spr.h * spr.sy, false); // false is to mute depreciated call warning that may still lurk in some code
                                        });

                                    }
                                    editSprites.spriteSelectUtilDone(between,"Sprite as line");
                                    return true;
                                }
                                if(selection.length === 2) {
                                    if(!editSprites.spriteSelectUtil(selectLineSprite,"Sprite as line","red")) {
                                        log.warn("Could not complete workspace is busy");
                                    } else {
                                        setTimeout(()=>issueCommand(commands.edSprUpdateAll),0);
                                    }

                                }else {
                                    log.warn("Select 2 sprites to define end points");
                                }
                            }
                        }
                    },
                    /*copyToOutline : {
                        help : "Creates 4 copies of selected sprites and as outline\nDoes not copy animation",
                        call() {
                            const sprs = selection.asArray();
                            const newSpr = [];
                            selection.clear();
                            selection.silent = true;
                            for(const spr of sprs) {
                                var s = sprites.add(spr.copy(false, false, true));
                                s.x -= 1;
                                s.key.update();
                                selection.add(s);
                                s = sprites.add(spr.copy(false, false, true));
                                s.x += 1;
                                s.key.update();
                                selection.add(s);
                                s = sprites.add(spr.copy(false, false, true));
                                s.y -= 1;
                                s.key.update();
                                selection.add(s);
                                s = sprites.add(spr.copy(false, false, true));
                                s.y += 1;
                                s.key.update();
                                selection.add(s);
                                sprites.moveZ("down");
                                sprites.moveZ("down");
                                sprites.moveZ("down");
                                sprites.moveZ("down");
                                newSpr.push(...selection.asArray());
                                selection.clear();
                            }
                            selection.add(sprs);
                            selection.silent = false;
                            utils.tidyWorkspace();
                        }
                    },
                    copyToOutlineRound : {
                        help : "Creates 8 copies of selected sprites and as outline\nDoes not copy animation",
                        call() {
                            const sprs = selection.asArray();
                            const newSpr = [];
                            selection.clear();
                            selection.silent = true;
                            const offs = [[-1,-1],[1,-1],[1,1],[-1,1],[0,1],[0,-1],[1,0],[-1,0]];
                            for(const spr of sprs) {
                                for(const [x,y] of offs) {
                                    var s = sprites.add(spr.copy(false, false, true));
                                    s.x += x;
                                    s.y += y;
                                    s.key.update();
                                    selection.add(s);
                                }
                                for(const o of offs) {
                                    sprites.moveZ("down");
                                }
                                newSpr.push(...selection.asArray());
                                selection.clear();
                            }
                            selection.add(sprs);
                            selection.silent = false;
                            utils.tidyWorkspace();
                        }
                    },*/
                    random: {
                        scale: {
                            help: "Scales selected randomly\n[LEFT] click for X Y\n[RIGHT] click for X\n[CTRL] click for Y",
                            call() {
                                const axis = (mouse.oldButton & 4) === 4 ? [1,0] : mouse.ctrl ? [0,1] : [1,1];
                                var mx = Infinity, Mx = -Infinity;
                                var my = Infinity, My = -Infinity;
                                selection.each(spr => {
                                    mx = Math.min(spr.sx * spr.w, mx);
                                    my = Math.min(spr.sy * spr.h, my);
                                    Mx = Math.max(spr.sx * spr.w, Mx);
                                    My = Math.max(spr.sy * spr.h, My);
                                });
                                const mm = Math.min(mx, my);
                                const MM = Math.min(Mx, My);
                                selection.each(spr => {
                                    const sc = (Math.rand(MM - mm) + mm);
                                    spr.setScale(
                                        axis[0] ? sc / spr.w : spr.sx,
                                        axis[1] ? sc / spr.h : spr.sy
                                    );

                                });
                                setTimeout(()=>issueCommand(commands.edSprUpdateAll),0);
                            }
                        },
                        rotate: {
                            help: "Rotate selected randomly",
                            call() {
                                const axis = (mouse.oldButton & 4) === 4 ? [1,0] : mouse.ctrl ? [0,1] : [1,1];
                                var m = Infinity, M = -Infinity;
                                selection.each(spr => { m = Math.min(spr.rx, m); M = Math.max(spr.rx, M); });
                                selection.each(spr => {
                                    const amount = Math.randOP(M - m, 2), s = (amount ** 2) * Math.sign(amount);
                                    spr.setRotateFix(Math.randOP(M - m, 2) / 2 + m);
                                });
                                setTimeout(()=>issueCommand(commands.edSprUpdateAll),0);
                            }
                        },
                        position: {
                            help: "Move selected randomly\n[LEFT] click for X Y\n[RIGHT] click for X\n[CTRL] click for Y",
                            call() {
                                const axis = (mouse.oldButton & 4) === 4 ? [1,0] : mouse.ctrl ? [0,1] : [1,1];
                                const e = selection.getExtent();
                                selection.each(spr => {spr.setPos((axis[0] ? Math.rand(e.w) : 0) + e.x, (axis[1] ? Math.rand(e.h) : 0) + e.y); });
                                setTimeout(()=>issueCommand(commands.edSprUpdateAll),0);
                            }
                        },
                        scaleFromMean: {
                            help: "Scales selected randomly within 50% of mean scale\n[LEFT] click for X Y\n[RIGHT] click for X\n[CTRL] click for Y",
                            call() {
                                if (selection.length) {
                                    const axis = (mouse.oldButton & 4) === 4 ? [1,0] : mouse.ctrl ? [0,1] : [1,1];
                                    var mx = 0;
                                    var my = 0;
                                    selection.each(spr => {
                                        mx += spr.sx * spr.w;
                                        my += spr.sy * spr.h;
                                    });
                                    mx /= selection.length;
                                    my /= selection.length;
                                    const mm = ((mx + my) / 2) * 0.5;
                                    const MM = ((mx + my) / 2) * 1.5;
                                    selection.each(spr => {
                                        const sc = (Math.rand(MM - mm) + mm);
                                        spr.setScale(
                                            axis[0] ? sc / spr.w : spr.sx,
                                            axis[1] ? sc / spr.h : spr.sy
                                        );

                                    });
                                    setTimeout(()=>issueCommand(commands.edSprUpdateAll),0);
                                } else {
                                    log.warn("Nothing selected");
                                }
                            }
                        },
                        rotateRandom: {
                            help: "Rotate selected randomly 360deg",
                            call() {
                                if (selection.length) {
                                    selection.each(spr => { spr.setRotateFix(Math.rand(-Math.PI, Math.PI)) });
                                    setTimeout(()=>issueCommand(commands.edSprUpdateAll),0);
                                } else {
                                    log.warn("Nothing selected");
                                }
                            }
                        },
                    }
                },
                info : {
                    clearLog : {
                        help : "Clears the log display.",
                        call() { log.clear() },
                    },
                    location : {
                        help : "Add information about sprite location to the display log.",
                        call() { selection.each(spr=>log(`X: ${(spr.x - spr.w * spr.sx * 0.5).toFixed(2)}, Y:  ${(spr.y - spr.h * spr.sy * 0.5).toFixed(2)}, W: ${(spr.w * spr.sx).toFixed(2)}, H:  ${(spr.h * spr.sy).toFixed(2)}`)) },
                    },
                    size : {
                        help : "Add information about sprite size to the display log.",
                        call() {
                            selection.each(spr => {
                                var str = "";
                                if (spr.type.image) {
                                    str += `imgW: ${spr.image.w.toFixed(0)}px, imgH: ${spr.image.h.toFixed(0)}px, `;
                                    str += `scaleX: ${spr.sx.toFixed(3)}, scaleY: ${spr.sy.toFixed(3)}, `;
                                    str += `W: ${(spr.sx * spr.image.w).toFixed(0)}px, H: ${(spr.sy * spr.image.h).toFixed(0)}px `;
                                } else {
                                    str += `W: ${spr.w.toFixed(2)}px, H: ${spr.h.toFixed(2)}px`;
                                }
                                log(str);
                            })
                        },
                    },
                    details : {
                        help : "Add information about sprite display log.",
                        call() {
                            selection.each(spr => {
                                var str = "";
                                str += "id : " + spr.guid + ", ";
                                str += "z-idx : " + spr.index + ", ";
                                str += "name : " + spr.name + ", ";
                                if (spr.type.image) {
                                    str += "Image "+spr.image.desc.toString() + ", ";
                                }
                                if(spr.type.attached) {
                                    str += "Attached to " + spr.attachedTo.guid + ", ";
                                }
                                if(spr.attachers) {
                                    str += "Has " + spr.attachers.size + " attached sprites.";
                                }
                                log(str);
                            })
                        },
                    },
                    numbers : {
                        help : "Displays the number of selected sprites and number of sprites",
                        call() { log(`Selected count : ${selection.length}`); log(`Sprite count : ${sprites.length}`)  },
                    },
                },
                /*properties : {

                },*/
                select : {
                    //byType : { },
                    byLocation : {
                        isInside : {
                            help : "Selects sprites that are inside selected sprites",
                            call() { filterSprites((selSpr,spr) => selSpr.isSpriteInside(spr)) }
                        },
                        isOutside : {
                            help : "Selects sprites that are outside selected sprites",
                            call() { filterSprites((selSpr,spr) => !selSpr.isSpriteTouching(spr),true) }
                        },
                        isTouching : {
                            help : "Selects sprites that are touching any selected sprites",
                            call() { filterSprites((selSpr,spr) => selSpr.isSpriteTouching(spr)) }
                        },
                        inView : {
                            help : "Select sprites that are in the current view",
                            call() { selection.clear(true).add(new Sprite(0,0,128,128,"*temp").fitToView(view)); extras.select.byLocation.isTouching.call() },
                        },
                        offView : {
                             help : "Select sprites that are not in the current view",
                            call() { selection.clear(true).add(new Sprite(0,0,128,128,"*temp").fitToView(view)); extras.select.byLocation.isOutside.call() },
                        },
                    },
                    byLinks : {
                        lookingAt : {
                            help : "Selects sprites that are looking at the selected sprite",
                            call() { filterSprites((selSpr,spr) => spr.lookers && spr.lookers.has(selSpr)) }
                        },
                        attachedTo : {
                            help : "Selects sprites that are attached to selected sprite",
                            call() { filterSprites((selSpr,spr) => spr.attachers && spr.attachers.has(selSpr)) }
                        }
                    }
                },
            };
            /*"cutter,image,grid,vanish,normalisable,snapTo,liveCapture,text,renderable,animated,locked,lookat,attached".split(",").forEach(type => {
                extras.select.byType[type] = {
                    help : "Select all +" + type + " sprites",
                    call() { API.clear(true); sprites.eachOfType(API.add,type); utils.tidyWorkspace() },
                };
            });*/
            return extras;
        },
        hasDirtyImage() {
            var dirty = false;
            selection.eachImage((spr, img) => {
                if(!img.desc.capturing && img.desc.dirty){
                    dirty = true;
                }
            });
            return dirty;
        },
        hasMounts() {
            var mountedItems = false;
            selection.each(spr => {
                if(mounted.hasItem(spr.guid)) {
                    mountedItems = true;
                }
            });
            return mountedItems;
        },
        serialize() {
            const spriteArr = [];
            sprites.each(spr => {
                if(selection.isSelected(spr)) { spriteArr.push(spr.serial()) }
            });
            return spriteArr;
        },
    });
    Object.assign(API, Events(API));
    const eventCallbacks = API.getEventCallbacks();
    API.addEvent("change",()=>spriteList.update());
    return API;
})();