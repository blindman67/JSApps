"use strict";

const sprites = (()=>{
    var spriteMemory = {};
    var index = 0;
    var indexOfHighlighted;
    var highlightedSprListItem;
    var videoCount = 0, soundCount = 0;
    var oldSceneName = undefined;
    const onDeleteViewSprite = () => { if (mainCanvas.ctx.useViewSprite()) { issueCommand(commands.edSprToggleViewSprite); } API.unsetViewSprite(); };
    const gridTypes = ["X","Y","Z"];
    const API = Object.assign([],{
        APIName: "Sprites",
        sceneName: "painterV3Scene_" + getGUID(),
        hasGuides: 0,
        hasVideo: false,
		hasSound: false,
        hasFunctionLinks: false,
        functionLinksAnimated : false,
        functionLinksOn: true,
        viewSprite: undefined,
        /* DEBUG CODE */


        /* DEBUG CODE END */
        getByGUID(id){
            for (const spr of this){
                if(spr.guid === id) { return spr }
            }
        },
        isGUIDSelected(id) { return API.getByGUID(id)?.selected; },
        getById(id){
            for (const spr of this){
                if(spr.guid === id) { return spr }
            }
        },
        getByName(name) {
            const found = [];
            for (const spr of this) {
                if (spr.name === name) { found.push(spr) }
            }
            return found;
        },
        getByNamePrefix(prefix) {
            const found = [];
            for (const spr of this) {
                if (spr.name.startsWith(prefix)) { found.push(spr) }
            }
            return found;
        },        
        getByGUID_I(id){
            for (const spr of this){
                if(spr.guid_I !== undefined && spr.guid_I === id) { return spr }
            }
        },
        removeImportGUID() {
            for (const spr of this){
                if(spr.guid_I !== undefined) { delete spr.guid_I }
            }
        },
        mustUpdate: true,
        update() {
            API.mustUpdate = false;
            if(API.hasAttached) { // if the sprites have attachements then update in attachment order not z order
                for (const spr of API.attachedOrder) { spr.key.update() }
            } else {
                API.each(spr => spr.key.update());
            }
            widget.update();
        },
        updateAtTime(time = animation.time) {
            for(const spr of API) {
                if (spr.type.animated || spr.type.animate) { spr.setAnimFrame(time) }
            }
            API.update();
        },
        saveStates() { for(const spr of API) { spr.key.saveState() } },
        restoreStates() { for(const spr of API) { spr.key.restoreState() } },
        saveSceneName(newName) {
            if (oldSceneName === undefined) {
                oldSceneName = this.sceneName;
                if (newName !== undefined) {
                    this.sceneName = newName;
                }
            }
        },
        restoreSceneName() {
            if (oldSceneName !== undefined) {
                this.sceneName = oldSceneName;
                oldSceneName = undefined;
            }
        },
        each(cb) {index = 0; for (const spr of this) { if( cb(spr, index++) === true ) { return --index  } } },
        eachIf(cb, predicate){
            index = 0;
            for (const spr of this) {
                if (predicate(spr, index) === true) {
                    cb(spr, index);
                }
                index ++;
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
        eachOfTypes(cb, ...types) {
            index = 0;
            for (const spr of this) {
                if (types.some(typeName => spr.type[typeName] === true)) {
                    if (cb(spr,index) === true) {
                        return index
                    }
                }
                index ++;
            }
        },
        assArray() { return [...API] }, // WTF ??????
        asArray() { return [...API] }, // added and should be used rather than miss spelt ass Array
        selectAll(includeHidden = false) {
            selection.clear(true);
            if (includeHidden) { selection.add(API.asArray()) }
            else { selection.add(API.asArray().filter(spr => spr.type.hidden === false)) }
        },
        select(predicate) {
            selection.clear(true);
            API.selectAdd(predicate);
        },
        selectAdd(predicate) {
            selection.add(API.filter(predicate));
        },
        selectByType(typeName, typeValue = true, includeHidden = false) {
            selection.clear(true);
            API.selectAddByType(typeName, typeValue, includeHidden);
        },
        selectAddByType(typeName, typeValue = true, includeHidden = false) {
            selection.add(API.filter(spr => (spr.type[typeName] === typeValue && (includeHidden === true || (includeHidden === false && spr.type.hidden === false)))));
        },
        selectTypeUnder(spr, typeName, typeValue = true) {
            selection.clear(true);
            const out = Extent();
            const extent = spr.key.calcExtent(Extent());
            selection.add(API.filter(s => {
                if (s !== spr) {
                    if (typeName === undefined || s.type[typeName] === typeValue) {
                        if (s.key.isUnder(extent.x, extent.y, extent.w, extent.h)) { return true }
                        out.irate();
                        s.key.calcExtent(out);
                        if (spr.key.isUnder(out.x, out.y, out.w, out.h)) { return true }
                    }
                }
                return false;
            }));
        },
        allAnimKeys(cb) {
            for(const spr of this) {
                if (spr.type.animated) {
                    spr.animation.eachTrack(track => {
                        for(const key of track.keys){
                            cb(spr, track, key);
                        }
                    })
                }
            }
        },
        getSpriteStateAtKeys(spr) {
            var t = 0
            const keyStates = [];
            if(spr.type.animated) {
                const timeRange = spr.animKeyTimeRange();
                for (t = timeRange.min; t <= timeRange.max; t++) {
                    API.updateAtTime(t);
                    if(spr.animation.atKey) {
                        const state = spr.getState();
                        state.time = t;
                        keyStates.push(state);
                    }
                }
                API.updateAtTime();
            }
            return keyStates;
        },
        markImages(val) {
            for (const spr of API) { if(spr.type.image) { spr.image.marked = val } }
        },
        processImagesAnimated(cb, drawOnOnly = true) {
            index = 0;
            for (const spr of API) {
                if(spr.type.animated && spr.animation.tracks.image) {
                    for(const key of spr.animation.tracks.image.keys) { key.value.marked = false }
                }else  if(spr.type.image) { spr.image.marked = false }
            }
            if(drawOnOnly){
                for (const spr of API) {
                    if(spr.drawOn) {
                        if(spr.type.animated && spr.animation.tracks.image) {
                            for(const key of spr.animation.tracks.image.keys) {
                                if (key.value.marked === false) {
                                    key.value.processed = cb(key.value,index);
                                    key.value.marked = true;
                                }
                            }
                        } else if(spr.type.image && spr.image.marked === false) {
                            spr.image.processed = cb(spr.image,index);
                            spr.image.marked = true;
                        }
                    }
                    index += 1;
                }

            }else {
                for (const spr of API) {
                    if(spr.type.animated && spr.animation.tracks.image) {
                        for(const key of spr.animation.tracks.image.keys) {
                            if (key.value.marked === false) {
                                key.value.processed = cb(key.value,index);
                                key.value.marked = true;
                            }
                        }
                    } else if(spr.type.image && spr.image.marked === false) {
                        spr.image.processed = cb(spr.image,index);
                        spr.image.marked = true;
                    }
                    index += 1;
                }
            }


        },
        isKeyOfSelectedSprite(key) {
            var result;
            for (const spr of this){
                if(spr.type.animated) {
                    spr.animation.eachTrack(track => {
                        if(track.keys.includes(key)) {
                            if(!spr.selected) {
                                result = false;
                            }else {
                                result = true;
                            }
                            return true;
                        }
                    });
                }
            }
            return result;
        },
        processImages(cb, drawOnOnly = true) {
            index = 0;
            for (const spr of API) { if(spr.type.image) { spr.image.marked = false } }
            if(drawOnOnly){
                for (const spr of API) {
                    if(spr.type.image && spr.image.marked === false && spr.drawOn) {
                        spr.image.processed = cb(spr.image,index);
                        spr.image.marked = true;
                    }
                    index += 1;
                }

            }else {
                for (const spr of API) {
                    if(spr.type.image && spr.image.marked === false) {
                        spr.image.processed = cb(spr.image,index);
                        spr.image.marked = true;
                    }
                    index += 1;
                }
            }
        },
        eachImage(cb){
            index = 0;
            for (const spr of API) { if(spr.type.image) { spr.image.marked = false } }
            for (const spr of API) {
                if(spr.type.image && spr.image.marked === false) {
                    cb(spr,spr.image,index);
                    spr.image.marked = true;
                }
                index += 1;
            }
        },
        eachShape(cb){
            index = 0;
            for (const spr of API) {
                if (spr.type.shape) {
                    cb(spr, spr.shape, index);
                }
                index += 1;
            }
        },
        eachDrawable(cb) {
            var index = 0;
            for (const spr of this) {
                if (spr.drawOn) {
                    if ( cb(spr, index) === true) { return index  }
                }
                index ++;
            }
        },
        eachProcessed(cb){
            var index = this.length;
            while (index--) {
                const spr = this[index];
                if (spr.type.image && spr.image.processed) {
                    if (cb(spr, index) === true) { return index  }
                }
            }
        },
        eachDrawableVisual(cb) {  // Drawable flag on and highest top to bottom visual order
            var index = this.length;
            while (index--) {
                if (this[index].drawOn) {
                    if (cb(this[index], index) === true) { return index  }
                }
            }
        },
        eachFunctionLink(cb) {
            var index = 0;
            while (index < this.length) {
                if (this[index].type.functionLink) {
                    if (cb(this[index], index) === true) { return index  }
                }
                index ++;
            }

        },
        resetFunctionLinks()  {
            for(const spr of this) {
                if (spr.type.functionLink) {
                    if(spr.fLink.funcObj && !API.functionLinksOn) {
                        spr.fLink.funcObj.reset();
                    } else {
                        spr.fLink.reset = true;
                    }
                }
            }
        },
        eachLiveCapture(cb) {
            index = this.length;
            while (index--) {
                if (this[index].type.liveCapture) {
                    if (cb(this[index], index) === true) { return index  }
                }
            }
        },
        eachGridLike(cb) {
            index = this.length;
            while (index--) {
                if (this[index].type.grid || this[index].type.vanish) {
                    if (cb(this[index], index) === true) { return index  }
                }
            }
        },
        spriteTypeChange(spr) { // Rather than add this as a sprite event, the sprite calls this for important type changes
            API.fireEvent("spritetypechange", spr);
        },
        eachProcessedPattern(cb) {
            index = this.length;
            var spr;
            while (index--) {
                spr = this[index];
                if (spr.type.pattern && spr.image.processed ) {
                    if (cb(spr, index) === true) { return index  }
                }
            }
        },
        processDrawable(cb) {
            index = this.length;
            var spr;
            while (index--) {
                if ((spr = this[index]).drawOn) {
                    cb(spr, index);
                    spr.image.processed = true;
                }
            }
        },
        restoreProcessed(){
            for(const spr of this) {
                if(spr.type.image) {
                    if (spr.image.processed) { spr.image.restore() }
                    if(spr.type.animated && spr.animation.tracks.image) {
                        for(const key of spr.animation.tracks.image.keys) {
                            if(key.value.processed) { key.value.restore() }
                        }
                    }
                }
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
        updateProcessed(){
            for(const spr of this) {
                if(spr.type.image) {
                    if (spr.image.processed) { spr.image.update() }
                    if(spr.type.animated && spr.animation.tracks.image) {
                        for(const key of spr.animation.tracks.image.keys) {
                            if(key.value.processed) { key.value.update() }
                        }
                    }

                }
            }

        },
        updateProcessedFrameChange(){
            for(const spr of this) {
                if(spr.type.image && spr.type.animated && spr.animation.tracks.image) {
                    for(const key of spr.animation.tracks.image.keys) {
                        if(key.value.processed) { key.value.update() }
                    }

                }
            }

        },
        updatePatterns(){
            for(const spr of this) {
                if(spr.type.pattern && spr.image.processed) {
                    spr.updatePattern();
                }
            }
         },
        drawCutBuffer(restore = false, addToAnim = false, present = false){
            for(const spr of this) {
                if(spr.drawOn) {
                    if (!spr.image.restored && restore) { spr.image.restore() }
                    if(spr.type.animated && spr.animation.tracks.image) {
                        for(const key of spr.animation.tracks.image.keys) {
                            if (key.value.restored && restore) {
                                key.value.restore();
                            }
                        }
                    }
                    if(addToAnim && animation.playing && spr.type.animated && spr.animation.tracks.image){
                        var ft = animation.startTime;
                        var et = animation.endTime;

                        for(let t = ft; t <= et; t++){
                            spr.setAnimFrame(t);
                            spr.key.update();
                            pens.setupContext(spr);
                            cuttingTools.drawBuffer(spr,spr.image.ctx, t);
                        }
                        spr.setAnimFrame(animation.time);

                    } else {
                        pens.setupContext(spr);
                        cuttingTools.drawBuffer(spr, spr.image.ctx);
                        present && spr.image.presented();
                    }
                }
            }
        },
        unrestore(){
            for(const spr of this) {
                if(spr.drawOn) {
                    spr.image.restored = false;
                    if(spr.type.animated && spr.animation.tracks.image) {
                        for(const key of spr.animation.tracks.image.keys) {
                            key.value.restored = false;
                        }
                    }

                }
            }
        },
        removeAllSpriteEventsByUID(UID) {
            for(const spr of this) { spr.removeAllEventsByUID(UID) }
        },
        setValue(prop,value) { for (const spr of this) { spr[prop] = value } },
        setValueIf(prop,value,cb) { index = 0; for (const spr of this) { if(cb(spr,index++)){ spr[prop] = value } } },
        unrestore() { for (const spr of this) { if(spr.drawOn) { spr.image.restored = false } } },
        updateLists() { for (const spr of this) { spriteList.add(spr) } },
        updateFonts(name, isLocal) {
            log("Loaded " + (isLocal ? "local" : "Google") + " font " + name + "'");
            const ctx = view.context;
            var hasSelected = false;
            API.eachOfType(spr => {
                if (spr.textInfo.font === name) {
                    spr.textInfo.local = isLocal;
                }
                spr.textInfo.update(view.context);
                spr.textInfo.local = isLocal;
                if(spr.selected) { hasSelected = true }
            }, "text");
            if(hasSelected) { widget.update() }
        },
        updateSubSprites() {
            const p = utils.point;
            API.eachOfType(spr => { spr.updateSubSprite() }, "subSprite");

        },
        cleanIndexs() {
            var idx = 0;
            for (const spr of this) { spr.index = idx++ }
        },
        cleanup() {  // to correct any inconsistancies after making changes
            var idx = 0;
            var gridType = 0;
            this.hasGuides = 0;
            this.hasAttached = false;
            this.hasFunctionLinks = false;
            for (const spr of this) {
                if (spr.index !== idx) {  spr.changed = true }
                spr.index = idx ++;
                if (spr.type.group) {
                    spr.group.all((s, gs) => {  s.type.inGroup = true;  });
                }
                if(spr.type.functionLink) {  this.hasFunctionLinks = true }
                if(spr.type.grid || spr.type.vanish){
                    this.hasGuides |= 1 << (gridType % 3);
                    spr.grid.typeBit = 1 << (gridType % 3);
                    spr.grid.type = gridTypes[(gridType++) % 3];
                }
                if(spr.type.text && spr.textInfo.dirty){
                    spr.textInfo.update(view.context);
                }
                if (spr.type.attached || spr.type.hasLocators) { this.hasAttached = true }
                if (spr.type.image && spr.image.desc) {
                    if(spr.image.desc.clippedLeft) { spr.image.desc.clippedLeft = 0 }
                    if(spr.image.desc.clippedTop) { spr.image.desc.clippedTop = 0 }
                }
            }
            if (this.hasAttached) {
                this.sortAttached();
            } else if (this.attachedOrder) {
                this.attachedOrder = undefined;
            }
            if(animation.lightboxOn && this.hasFunctionLinks) {
                log.warn("Lightbox does not support function links!");
                log.warn("Lightbox has been turned off and can not be used");
                log.warn("while the scene contains function links.");
                animation.lightboxOn = false;
            }

        },
        createIdMapOf(ids) {
            const sprMap = new Map();
            API.each(spr => {
                if(ids.includes(spr.guid)) {
                    sprMap.set(spr.guid, spr);
                }
            });
            return sprMap;
        },
        sortFunctionLinks() {
            /*const countParents = link => {
                const explored = new WeakSet();
                var step = 1;
                const stack = [...link.spr.fLink.inputs.map(spr=>({step,spr}))];
                while(stack.length) {
                    const l = stack.shift();
                    if(!explored.has(l.spr)) {
                        explored.add(l.spr);
                        link.sortOrder = Math.max(l.step, link.sortOrder);
                        if (l.spr.type.functionLink && !l.spr.fLink.funcObj) {
                            stack.push(...l.spr.fLink.inputs.map(spr=>({step: l.step + 1,spr})));
                        }
                    }
                }
            }*/
            const flinks = [];
            const slots = [];
            var slot = 0;
            for(const spr of this) {
                if(spr.type.functionLink) {
                    flinks.push({
                        sortOrder: 0,
                        spr,
                    });
                    slots.push(slot);
                }
                slot ++;
            }
            var maxChain = 1;

            for(const f of flinks) {
                if(f.spr.fLink.funcObj) {
                    f.sortOrder = -10;
                }else if(f.spr.fLink.inputs.length > 0) {
                    f.sortOrder = maxChain ++;
                }
            }

            for(const f of flinks) {
                if(f.sortOrder === 0) {
                    if(f.spr.fLink.outputs.length > 0) {
                        f.sortOrder = ++maxChain ;
                    }
                }
            }
            flinks.sort((a,b) => {
                if(a.sortOrder <= 0 || b.sortOrder <= 0 ) { return 0 }
                var aLinksToB = a.spr.fLink.inputs.some(s => s === b.spr) ? 10 : 0;
                var bLinksToA = b.spr.fLink.inputs.some(s => s === a.spr) ? 10 : 0;
                return aLinksToB - bLinksToA;
            });

            while (flinks.length) {
                const s = slots.shift()
                const {spr, sortOrder} = flinks.shift();
                //log("Move spr '" + spr.name + "' from " + spr.index + " to " + s + " Sorted "+sortOrder);
                this[s] = spr;
            }
            this.cleanup();
            spriteList.order();
        },
        sortAttached() {
            var ao = this.attachedOrder;
            if(!ao) { ao = this.attachedOrder = [] }
            ao.length = 0;
            const base = [];
            var first;
            this.each(spr => {
                if (!spr.type.attached && !spr.locates) {
                    spr.type.sorted = true;
                    ao.push(spr)
                    if (spr.attachers || spr.type.hasLocators) {
                        base.push(spr);
                    }
                } else {
                    if(first === undefined) {
                        first = spr;
                    }
                    spr.type.sorted = false;
                }
            });
            if(ao.length === this.length && base.length === 0) {
                return;
            }
            if(base.length === 0 && first) {
                log.warn("Could not find base attachment. Using lowest z sprite ");
                first.type.sorted = true;
                ao.push(first);
                if (first.attachers || first.type.hasLocators) {
                    base.push(first);
                }
            }
            while (base.length) {
                const spr = base.shift();
                if (spr.attachers && spr.attachers.size > 0){
                    for (const aSpr of spr.attachers.values()) {
                        if (!aSpr.type.sorted) {
                            aSpr.type.sorted = true;
                            ao.push(aSpr);
                            if(aSpr.attachers || aSpr.type.hasLocators) {
                                base.push(aSpr);
                            }
                        }
                    }
                }
                if (spr.type.hasLocators) {
                    for (const loc of spr.locators) {
                        const lSpr = loc.spr;
                        if (!lSpr.type.sorted) {
                            lSpr.type.sorted = true;
                            ao.push(lSpr);
                            if (lSpr.attachers || lSpr.type.hasLocators) {
                                base.push(lSpr);
                            }
                        }
                    }
                }
                if (ao.length > this.length) {
                    break;
                }
            }

            if (ao.length !== this.length) {
                if (ao.length > this.length) {
                    log.error("Could not sort attachments To many branches");
                }else{
                    log.error("Could not sort attachments, missing sprites");
                }
            }
        },
        updateLocators() {
            var hasSelected = false;
            this.each(spr => {
                if(spr.type.hasLocators) {
                    spr.key.fitLocators();
                    if(spr.selected) { hasSelected = true}
                }
            });
            if(hasSelected) { widget.update() }
        },
		checkPlayable(sprite) {
			if (sprite.type.image) {
				if (sprite.image.desc.video) {
					videoCount ++;
					this.fireEvent("videoadded", sprite.image);
					this.hasVideo = true;
				} 
				if (sprite.image.desc.isSound) {
					soundCount ++;
					this.fireEvent("soundadded", sprite);
					this.hasSound = true;
				}
			}			
		},
		checkRemovedPlayable(sprite) {
			if (sprite.type.image) {
				if (sprite.image.desc.video) {
					videoCount --;
					if(videoCount <= 0) {
						this.hasVideo = false;
						this.fireEvent("videoremoved",sprite.image);
					} else {
						if (!this.some(s => s.type.image && s.image === sprite.image)) {
							this.fireEvent("videoremoved",sprite.image);
						}
					}
				} 
				if (sprite.image.desc.isSound) {
					soundCount --;
					if(soundCount <= 0) {
						sprite.image.desc.playing && Audio.stop(sprite);
						this.hasSound = false;
						this.fireEvent("soundremoved",sprite);
					} else {
						sprite.image.desc.playing && Audio.stop(sprite);
						this.fireEvent("soundremoved",sprite);
					}
				}
			}			
		},		
        addBottom(sprite){
            if(!sprite.isSprite) { return }
            this.unshift(sprite);
            this.fireEvent("spriteadded", sprite);
            spriteList.add(sprite);
            this.checkPlayable(sprite);

            return sprite;
        },
        replace(sprite, withSprite){
            if (sprite.isSprite || withSprite.isSprite) {
                const idx = this.indexOf(sprite);
                if (idx > -1) {
                    undos.undoable = true;
                    this.remove(sprite);
                    this.splice(idx,0,withSprite);
                    this.fireEvent("spriteadded", withSprite);
                    spriteList.add(withSprite);
					this.checkPlayable(withSprite);
                    this.cleanup();
                    spriteList.order();
                    return withSprite;
                }
            }
        },
        add(sprite){
            if(!sprite.isSprite) { return }
            undos.undoable = true;
            this.push(sprite);
            this.fireEvent("spriteadded", sprite);
            spriteList.add(sprite);
			this.checkPlayable(sprite);

            return sprite;
        },
        remove(spr){
            if (Array.isArray(spr)) { spr.forEach(spr => sprites.remove(spr) ) }
            else {
                spr.preDelete();
                const idx = sprites.each(s => s.guid === spr.guid);
                if (idx !== undefined) {
                    spriteList.remove(sprites.splice(idx, 1)[0]);
                    undos.undoable = true;
                    this.fireEvent("spriteremoved", spr);
					this.checkRemovedPlayable(spr);
                }
            }
        },
        reset() {
            selection.clear();
            collections.reset();
            API.remove([...this]);
            mediaList.deleteAll();
            media.reset();
            API.cleanup();
            issueCommand(commands.edSprUpdateAll);
            issueCommand(commands.edSprUpdateUI);
        },
        getParentGroupsFor(sprite, parents = new Set()) {
            if(sprite.type.inGroup) {
                API.eachOfType(spr => {
                    if(spr !== sprite) {
                        if(spr.group.hasSprite(sprite)) {
                            parents.add(spr.group);
                        }
                    }
                },"group");
            }
            return parents;
        },
        time: {
            removeSection(fromFrame, toFrame) {
                API.eachOfType(spr => {
                    spr.animation.eachTrack(track => {
                        track.clearRange(fromFrame, toFrame);
                        track.timeShift(-(toFrame - fromFrame + 1), toFrame);
                    });
                }, "animated");
            },
            clearSection(fromFrame, toFrame) {
                API.eachOfType(spr => {
                    spr.animation.eachTrack(track => {track.clearRange(fromFrame, toFrame) });
                }, "animated");
            },
            trimSection(fromFrame, toFrame) {
                API.eachOfType(spr => {
                    spr.animation.eachTrack(track => {track.clearRange(toFrame + 1, animation.maxLength) });
                    if (fromFrame > 0) {
                        spr.animation.eachTrack(track => {
                            track.clearRange(0, fromFrame - 1)
                            track.timeShift(-(fromFrame), fromFrame - 1);
                        });
                    }

                }, "animated");
            },
            expandSection(fromFrame, toFrame) {
                API.eachOfType(spr => {
                    spr.animation.eachTrack(track => {

                        track.eachKey(k => {
                            if(k.time > fromFrame && k.time <= toFrame) {
                                k.time = (k.time - fromFrame) * 2 + fromFrame;
                            } else if(k.time > toFrame) {
                                k.time += toFrame - fromFrame + 1;
                            }

                        });
                        track.dirty = true;
                    });
                }, "animated");

            },
            contractSection(fromFrame, toFrame) {
                API.eachOfType(spr => {
                    spr.animation.eachTrack(track => {

                        track.eachKey(k => {
                            if(k.time > fromFrame && k.time <= toFrame) {
                                k.time = (k.time - fromFrame) / 2 + fromFrame;
                            } else if(k.time > toFrame) {
                                k.time -= (toFrame - fromFrame + 1) / 2 | 0;
                            }

                        });
                        const end = (toFrame - fromFrame) / 2 + fromFrame
                        track.filter(k => {
                            if (k.time !== k.time | 0) { return false }
                        }, fromFrame, end);
                        track.dirty = true;
                    });
                }, "animated");

            },
            reverseSection(fromFrame, toFrame) {
                const range = toFrame - fromFrame;
                API.eachOfType(spr => {
                    spr.animation.eachTrack(track => {
                        track.eachKey(k => {
                            if(k.time >= fromFrame && k.time <= toFrame) {
                                k.time = (range - (k.time - fromFrame)) + fromFrame;
                            }
                        });
                        track.dirty = true;
                    });
                }, "animated");

            },
            getKeyTimes(spr, tracks, times = []) {
                if (spr.type.animated) {
                    const a = spr.animation;
                    const t = a.tracks;
                    for (const trackName of tracks) {
                        if (t[trackName]) {
                            t[trackName].eachKey(key => {
                                if (!times.includes(key.time)) {
                                    times.push(key.time);
                                }
                            });
                        }
                    }
                    times.sort(sortAscending);
                }
                return times;
            },
            eachTime(cb, times) {
                const currentTime = animation.time;
                for (const time of times) {
                    animation.fastSeek = time;
                    if (cb(time) === true) { break }
                }
                animation.time = currentTime;
            },




        },
        getUnderSel(sel, deSelect, result = []){
            this.each(spr => {
                if(!(spr.locks.UI || spr.type.hidden) && spr.key.isUnder(sel.tx, sel.ty, sel.w, sel.h)) { result.push(spr) }
                else if (deSelect) { selection.remove(spr, true) }
            });
            return result;
        },
        moveSelectedZDist(dist, spacing) {
            if (dist === 0) { return }
            const sel = [], selNot = [];
            var item, idx = 0, low = 0;
            for (const spr of this) {
                if (spr.selected) { sel.push({spr, idx: spr.index}) }
                else { selNot.push({spr, idx: spr.index}) }
            }
            selNot.reverse();
            low = sel[0].idx + dist;
            idx = 0;
            for (item of sel) { item.idx = low + spacing[idx++] }
            idx = 0;
            low = 0;
            for (item of sel) {
                if (item.idx <= low) {
                    item.idx = idx ++;
                    low = idx;
                }
            }
            sel.reverse();
            this.length = 0;
            while (sel.length || selNot.length) {
                idx = this.length;
                if (sel.length && selNot.length) {
                    if (sel[sel.length - 1].idx === idx) { item = sel.pop() }
                    else { item = selNot.pop() }
                } else if (sel.length) { item = sel.pop() }
                else { item = selNot.pop() }
                item.spr.index = idx;
                this[idx] = item.spr;
            }

            this.cleanup();
            spriteList.order();
        },
        moveZ(dir) {
            var i, needUpdate = false;
            const len = this.length - 1;
            if (dir === "up") {
                for (i = 0; i < len; i ++ ) {
                    const spr = this[len - i];
                    if (!spr.selected) {
                        const spr1 = this[len - i - 1];
                        if (spr1.selected && !spr1.type.shadow) {
                            this[len - i] = spr1;
                            this[len - i - 1] = spr;
                            needUpdate = true;
                        }
                    }
                }
                for(const sprA of this) {
                    if (sprA.type.group && sprA.type.openGroup) {
                        const len1 = sprA.group.sprites.length - 1;
                        for (i = 0; i < len1; i ++ ) {
                            const spr = sprA.group.sprites[len1 - i];
                            if (!spr.shadowedBy.selected) {
                                const spr1 = sprA.group.sprites[len1 - i - 1];
                                if (spr1.shadowedBy.selected) {
                                    sprA.group.sprites[len1 - i] = spr1;
                                    sprA.group.sprites[len1 - i - 1] = spr;
                                    needUpdate = true;
                                }
                            }
                        }
                    }
                }
            } else if (dir === "down") {
                for (var i = 0; i < len; i ++ ) {
                    const spr = this[i];
                    if (!spr.selected) {
                        const spr1 = this[i + 1];
                        if (spr1.selected && !spr1.type.shadow) {
                            this[i] = spr1;
                            this[i + 1] = spr;
                            needUpdate = true;
                        }
                    }
                }
                for(const sprA of this) {
                    if (sprA.type.group && sprA.type.openGroup) {
                        const len1 = sprA.group.sprites.length - 1;
                        for (i = 0; i < len1; i ++ ) {
                            const spr = sprA.group.sprites[i];
                            if (!spr.shadowedBy.selected) {
                                const spr1 = sprA.group.sprites[i + 1];
                                if (spr1.shadowedBy.selected) {
                                    sprA.group.sprites[i] = spr1;
                                    sprA.group.sprites[i + 1] = spr;
                                    needUpdate = true;
                                }
                            }
                        }
                    }
                }
            } else {
                var order = 0;
                if (dir === "swap") {
                    const selected = [];
                    this.each(spr => {
                        spr.order = order;
                        if(spr.selected) { selected.push(order) }
                        order++;
                    });
                    this.each(spr => { if(spr.selected) { spr.order = selected.pop() } });
                } else if (dir === "top")   {
                    this.each(spr => { if (!spr.selected) { spr.order = order ++ } } );
                    this.each(spr => { if (spr.selected) { spr.order = order ++ } } );
                } else if (dir === "bottom") {
                    var order = 0;
                    this.each(spr => { if (spr.selected) { spr.order = order ++ } } );
                    this.each(spr => { if (!spr.selected) { spr.order = order ++ } } );
                }
                this.sort((b, a) =>  b.order - a.order);
                for(const sprA of this) {
                    if (sprA.type.group && sprA.type.openGroup) {
                        const group = sprA.group;
                        var order = 0;
                        if (dir === "swap") {
                            const selected = [];
                            group.each(spr => {
                                spr.order = order;
                                if(spr.shadowedBy.selected) { selected.push(order) }
                                order++;
                            });
                            group.each(spr => { if(spr.shadowedBy.selected) { spr.order = selected.pop() } });
                        } else if (dir === "top")   {
                            group.each(spr => { if (!spr.shadowedBy.selected) { spr.order = order ++ } } );
                            group.each(spr => { if (spr.shadowedBy.selected) { spr.order = order ++ } } );
                        } else if (dir === "bottom") {
                            var order = 0;
                            group.each(spr => { if (spr.shadowedBy.selected) { spr.order = order ++ } } );
                            group.each(spr => { if (!spr.shadowedBy.selected) { spr.order = order ++ } } );
                        }
                        group.sprites.sort((b, a) =>  b.order - a.order);
                    }
                }

                needUpdate = true;
            }
            if(needUpdate) {
                this.cleanup();
                spriteList.order();
            }
        },
        highlighted() { if(indexOfHighlighted !== undefined) { return sprites[indexOfHighlighted] } },
        unsetViewSprite() {
            if (API.viewSprite) {
                API.viewSprite.type.view = false;
                API.viewSprite.gridSpecial = API.viewSprite.type.cutter ? 0 : API.viewSprite.gridSpecial;
                API.viewSprite.removeEvent("ondeleting", onDeleteViewSprite);
            }
            API.viewSprite = undefined;
        },
        setViewSprite(spr) {
            if (API.viewSprite) {
                if (API.viewSprite !== spr) { API.unsetViewSprite(); }
                else { return; }
            }
            API.viewSprite = spr;
            spr.type.view = true;
            spr.gridSpecial = spr.type.cutter ? spriteRender.gridSpecialNames.cameraSpr : spr.gridSpecial;
            spr.addEvent("ondeleting", onDeleteViewSprite);
        },
        doMouse(cMouse, drawingId){
            var i = 0, fl;
            var minDist = Infinity;
            var timelineUpdate = false;
            var closestSprite;
            if (mouse.captured === 0) {
                const prevLen = cMouse.overSpritesLength;
                if (cMouse.over) {
                    if (API.selectingSprite && indexOfHighlighted !== undefined && sprites[indexOfHighlighted]) {  // Sprite may be removed so check index is ok
                        sprites[indexOfHighlighted].highlightSelecting = false;
                        if (highlightedSprListItem) {
                            highlightedSprListItem.element.classList.remove("itemHighlight");
                            highlightedSprListItem = undefined;
                        }
                    }
                    cMouse.overSpritesLength = 0;
                    pens.mousePallets = 0;
                    indexOfHighlighted = undefined;
                    for (const spr of sprites) {
                        if (!(spr.locks.UI || spr.type.hidden) || (mouse.shift && mouse.alt && !spr.type.hidden)) {
                            const wasOver = !cMouse.prevOver ? false : spr.key.over;
                            spr.key.toLocal(cMouse.rx, cMouse.ry);
                            if (spr.type.group && spr.group.isOpen) { spr.key.toLocalGroup(spr.key.lx, spr.key.ly) }
                            !timelineUpdate && wasOver !== spr.key.over && (timelineUpdate = true);
                            if (spr.key.over) {
                                if (editSprites.drawingModeOn) {
                                    if (spr.type.pallet) { pens.mouseOverPallets[pens.mousePallets++] = spr }
                                    else { cMouse.overSprites[cMouse.overSpritesLength++] = i }
                                }else {
                                    cMouse.overSprites[cMouse.overSpritesLength++] = i;
                                    if (API.selectingSprite) {
                                        const dist = (((cMouse.rx - spr.x) ** 2) + ((cMouse.ry - spr.y) ** 2)) ** 0.5;
                                        if(dist < minDist || (minDist - dist >= -0.5)){
                                            closestSprite = spr;
                                            minDist = dist;
                                            indexOfHighlighted = i;
                                        }
                                    }
                                }
                            }
                            fl = spr.key.funcLinkLock;
                            if (fl) {
                                spr.key.lx += (fl & 1) ? spr.key.flx : 0;
                                spr.key.ly += (fl & 2) ? spr.key.fly : 0;
                                spr.key.flox = spr.key.flx;
                                spr.key.floy = spr.key.fly;
                                spr.key.funcLinkLock = 0;
                            }
                        }
                        i++;
                    }
                    if (closestSprite) {
                        closestSprite.highlightSelecting = true;
                        cMouse.overSpritesLength = 1;
                        cMouse.overSprites[0] = indexOfHighlighted;
                        spriteList.findItems(listItem => {
                                highlightedSprListItem = listItem;
                                listItem.element.classList.add("itemHighlight");
                            },
                            [closestSprite], true
                        );
                    }
                } else {
                    cMouse.overSpritesLength = 0;
                    if (indexOfHighlighted !== undefined && sprites[indexOfHighlighted]) {
                        if (highlightedSprListItem) {
                            highlightedSprListItem.element.classList.remove("itemHighlight");
                            highlightedSprListItem = undefined;
                        }
                        sprites[indexOfHighlighted].highlightSelecting = false;
                    }
                    indexOfHighlighted = undefined;
                }
            } else if (mouse.captured === drawingId) {
                cMouse.overSpritesLength = 0;
                for (const spr of sprites) {
                    if (spr.drawOn || spr.type.penColorSrc) {
                        fl = spr.key.funcLinkLock;
                        if (fl) {
                            spr.key.toLocal(cMouse.rox, cMouse.roy);
                            spr.key.lox = spr.key.lx + (fl & 1 ? spr.key.flox : 0);
                            spr.key.loy = spr.key.ly + (fl & 2 ? spr.key.floy : 0);
                            spr.key.toLocal(cMouse.rx, cMouse.ry);
                            spr.key.lx += fl & 1 ? spr.key.flx : 0;
                            spr.key.ly += fl & 2 ? spr.key.fly : 0;
                            spr.key.flox = spr.key.flx;
                            spr.key.floy = spr.key.fly;
                            spr.key.funcLinkLock = 0;
                        } else {
                            spr.key.toLocal(cMouse.rox, cMouse.roy);
                            spr.key.lox = spr.key.lx;
                            spr.key.loy = spr.key.ly;
                            spr.key.toLocal(cMouse.rx, cMouse.ry);
                        }
                    }
                    i++;
                }
            }
            this.fireEvent("mouseupdate");
            if (timelineUpdate && timeline.active) { timeline.highlightFrameNum = frameCount }
        },
        hasMedia(media) {
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
        serialize(type, selectedOnly = false) {
            const spriteArr = [];
            if (type === undefined) {
                sprites.each(spr => { 
                    if ((selectedOnly && spr.selected) || !selectedOnly) {  spriteArr.push(spr.serial()) }
                });
                if (!selectedOnly) { spriteArr.push(...groups.serial()); }
            } else if(type === "vectors") {
                const vectorIds = new Set();
                sprites.each(spr => {
                    if (spr.type.shape && spr.shape.serialVector) {
                        if ((selectedOnly && spr.selected) || !selectedOnly) {
                            if (!vectorIds.has(spr.shape.id)) {
                                vectorIds.add(spr.shape.id);
                                spriteArr.push(spr.shape.serialVector());
                            }
                        }
                    }
                })
            }
            return spriteArr;
        },
        hasDirtyImage() {
            var dirty = false;
            sprites.eachImage((spr, img) => {
                if(!img.desc.capturing && img.desc.dirty){
                    dirty = true;
                }
            });
            return dirty;
        },
        hasMemory() { return spriteMemory.__names !== undefined },
        remember(name) {
            if(spriteMemory.__names === undefined) {
                spriteMemory.__names = new Set();
            }
            const data = JSON.stringify({
                sprites: API.serialize(),
                animation: animation.serialize(),
            });
            zipper().compress(data)
                .then(compressed => {
                    log("Remembering as " + name + " " + (compressed.length * 2) + " / " + data.length);
                    spriteMemory.__names.add(name);
                    spriteMemory[name] = compressed;
                })
                .catch(error => {
                    log.warn("Error remembering sprite state");
                    if (spriteMemory.__names.size === 0) { spriteMemory.__names = undefined }

                });

        },
        recall(name) {
            var data;
            if(name === undefined) {
                name = [...spriteMemory.__names.values()].pop();
                spriteMemory.__names.delete(name);
                log("Recalling " + name);
                if (spriteMemory.__names.size === 0) { spriteMemory.__names = undefined }
                data = spriteMemory[name];
                delete spriteMemory[name];
            }else {
                data = spriteMemory[name];
            }
            zipper().decompress(data)
                .then(uncompressed => {
                    const data = JSON.parse(uncompressed);
                    uncompressed = undefined;
                    storage.openContentOfType("animation",data,() => { log("Recalled animation ") });
                    storage.openContentOfType("sprites",data,() => { log("Recalled sprites ") });
                })
                .catch(error => {
                    log.warn("Failed to recall sprite memory");
                })
        },
    });
    Object.assign(API, Events(API));
    return API;
})();
