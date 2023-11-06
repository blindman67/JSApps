"use strict";
/*

    MAJOR PROBLEM in this code regarding selections

    Sprites, groups, collections are maintaining a selection state. When sprites are copied on the workspace using right click drag
    the selection states in this code is not updating correctly causing the newly created sprites to unselect.

    Temp fix in place does not update selection state to mirror list state. Marked  BM67 A

    The temp fix breaks the group state which now has the buggy behavioure inside groups.



    */


const spriteList = (()=>{
    const INDENT = 11;
    const id = UID ++;
    var lastClickedIdx = -1;
    var holdUpdates = false;
    var showType, debounceUpdateHandle, lastUpdateFrame = 0;
    var keepOpenButton = localStorage[APPNAME + "_lastLoadedSprites"] !== undefined;
    var selectedCallback, editingNameListItem, editingName,listElement, tabElement, flasher, index = 0;
    var autoScrollSprite;
    function getSettings(){
        autoScrollSprite = settings.autoScrollSprite;
    }
    getSettings();
    settingsHandler.onchange = getSettings;    
    const editNameList = [];
    const buttonMap = new Map();
    var topFold;
    var showIdx = 0;
    const foldTypes = {
        sprites : 1,
        group : 2,
        collection: 3,
        layers: 4,
        topLevel: 5,
    };
    const updateFlags = {
        hasSelected: false,
        canOpen: false,
        canUncollect: false,
        canUngroup: false,
		canMove: false,
        hasDrawable: false,
        clear() {
            updateFlags.canOpen = false;
            updateFlags.hasSelected = false;
            updateFlags.canUncollect = false;
            updateFlags.canUngroup = false;
            updateFlags.canMove = false;
            updateFlags.hasDrawable = false;
        },
    };
    const showTypes = {
        sprites: {
            id: commands.spritesShowSprites,
            name : "sprites",
            fold : undefined,
            holdState: undefined,
            drag(mouse,event) { // drag handler used to reorder sprites Z position
                var oldX,oldY;
                var newPos, currentPos;
                var selEntries, dragging = false, dragTarget, dragTop, dragParent, listContainer, listScrollable;
                var dragSpr;
                var itemH = 0;  // pixel height of item
                var itemY = 0;  // position of item in list
                var itemStartY = 0;
                var itemTopOffset = 0; // in items. Dist from drag start target to top selected item
                var screenBottom = screen.height - 1;
                var mouseAtEdge = 0;

                var listH = 0;  // in items; Total numer of items
                const spacing = [];

                function reorder(entries) { // override for default folder order call
                    const order = $setOf(entries.length,()=>null);
                    $R(listScrollable, listContainer);
                    entries.forEach(entry => {
                        order[entry.item.index] = entry;
                        $R(listContainer, entry.element);
                    });
                    order.forEach(entry => { $$(listContainer, entry.element); });
                    $$(listScrollable, listContainer);
                    //dragTarget.scrollIntoView();
                }
                function releaseDrag(event) {
                    dragTarget = undefined;
                    listScrollable = undefined;
                    mouse.onmove = undefined;
                    for(const entry of selEntries) { entry.element.classList.remove("dragSpriteEntry") }
                    dragging = false;
                    dragParent.onReorder = undefined;
                    dragParent = undefined;
                    dragTop = undefined;
                    dragSpr = undefined;
                    listContainer = undefined;
                    selEntries = undefined;
                    mouse.release(id);
                    setTimeout(()=>API.rebuildLists(),0);
                    return true;

                }
                function drag(mouse,event){
                    if (mouse.captured === id) {
                        var toIdx, fromIdx, moveBy;
                        if(event.type === "mouseup"){
                            dragTarget = undefined;
                            dragParent = undefined;
                            mouse.onmove = undefined;
                            mouse.onbutton = undefined;
                            selEntries = undefined;
                            mouse.release(id);
                        }else{
                            if (!dragging && event.target !== dragTarget) {
                                mouse.releaseOnClickFunction(id, releaseDrag);
                                mouse.onbutton = undefined;
                                sprites.cleanIndexs();
                                dragging = true;
                                dragTop = selEntries[0].element;
                                dragSpr = selEntries[0].item;
                                itemTopOffset = dragTarget.entry.item.index - dragSpr.index;
                                oldY += itemTopOffset * itemH;
                                listContainer = dragParent.element.parentElement;
                                listScrollable = listContainer.parentElement;
                                dragTarget.entry.parent.onReorder = reorder;
                                let start = dragSpr.index;
                                for(const entry of selEntries) {
                                    spacing.push(entry.item.index - start);
                                    entry.element.classList.add("dragSpriteEntry")
                                }
                            }
                            if (dragging ) {
                                const mSy = event.screenY;
                                if ((mSy === 0 || mSy === screenBottom)) {
                                    if (mouseAtEdge >= 4) {
                                        oldY += (mSy ? -1 : 1) * itemH;
                                        mouseAtEdge = 0;
                                    } else if (mouse.x !== oldX) { mouseAtEdge ++ }
                                } else { mouseAtEdge = 0 }
                                fromIdx = dragSpr.index;
                                const distFromStartY = Math.floor(( mouse.y - oldY) / itemH);
                                if (itemStartY + distFromStartY !== fromIdx) {
                                    moveBy = itemStartY + distFromStartY;
                                    sprites.moveSelectedZDist((moveBy-fromIdx), spacing);  // this will trigger reorder
                                }
                                oldX = mouse.x;
                            }
                        }
                    }
                }
                if (event.target.entry.item.selected && selection.length < sprites.length && selection.length > 0) {
                    mouse.requestCapture(id);
                    if (mouse.captured === id) {
                        selEntries = API.selectedItemEntries;
                        oldX = mouse.x;
                        dragTarget = event.target;
                        dragParent = dragTarget.entry.parent;
                        const b = dragTarget.getBoundingClientRect();
                        const bp = dragParent.element.parentElement.getBoundingClientRect();
                        itemH = b.height;
                        oldY = (mouse.y / itemH | 0) * itemH;
                        listH = bp.height / itemH;
                        itemStartY = itemY = (b.top - dragParent.element.parentElement.scrollTop - bp.top) / itemH;
                        var itemViewY = itemY - (dragParent.element.parentElement.parentElement.scrollTop)  / itemH;
                        mouse.onmove = drag;
                        mouse.onbutton = drag;
                        mouseAtEdge = 0;
                        dragging = false;
                    }
                }
            },
            getState(){
                /*if (!this.holdState) { this.holdState = new Map() }
                else { this.holdState.clear() }
                const hs = this.holdState;
                if(this.fold) {
                    this.fold.each(entry => {
                        const spr = entry.item;
                        const selected = spr.selected;
                        hs.set(spr.guid,{guid: spr.guid, selected});
                    });
                }*/
            },
            setState(){
                /*holdUpdates = true;
                if(this.fold && this.holdState){
                    const hs = this.holdState;
                    //selection.clear();  // BM67 A
                    this.fold.each(entry => {
                        const spr = entry.item;
                        if(hs.has(spr.guid)) {
                            const state = hs.get(spr.guid);
                            //if(state.selected) {  selection.add(spr) } // BM67 A
                        }
                    });
                    hs.clear();
                }
                holdUpdates = false;*/
                widget.update()
                API.updateInfo();
            },
            selectAdd(item) {
                if (item.selected) { selection.remove(item); }
                else { selection.add(item); }
            },
            select(item) {
                if(item.selected) {
                    selection.clear(true);
                } else {
                    selection.clear(true);
                    selection.add(item);
                }
            },
            showItem(entry) {
                var item = entry.item;
                const element = entry.element;
                const parent = entry.parent ? entry.parent : entry.item.parent;
                const parentItem = parent.item;
                element.scrollIntoView();
                
            },
            updateItem(entry, index = entry.element.listPosition) {
                var item = entry.item;
                const element = entry.element;
                const parent = entry.parent ? entry.parent : entry.item.parent;
                const parentItem = parent.item;
                var text;
                if (entry.isFold) { return }
                else { text = item.toString(); }
                if (item.type.group) { updateFlags.canUngroup = true;  }

                element.listPosition = index;
                if (!item.type.hidden) {
                    element.classList.remove("itemHidden") ;
                    var icons = " " + (item.locks && item.locks.UI ? textIcons.locked : "");
                    element.textContent = text + icons;
                    if (item.helpString) { element.title = item.helpString() }
                    else { element.title = "[LEFT] click selects sprite\n[RIGHT] click adds removes sprite from selection\n[DRAG] selected to change Z order\n[CTRL][LEFT] click to rename sprite.\n[ALT][LEFT] click toggles paint, [RIGHT] paint only on selected\n[SHIFT] click special function (if avalible)\nelse [SHIFT] selects unselects from last  selected possition if possible" }
                    if (item.selected) {
                        updateFlags.hasSelected = true;
                        updateFlags.hasDrawable = (item.type.image && item.image.isDrawable) ? true : updateFlags.hasDrawable;
                        element.classList.add("itemSelected")
                        element.classList.add("draggable");
                    } else {
                        element.classList.remove("itemSelected");
                        element.classList.remove("draggable");
                    }
                    if (item.type && item.type.flagged) { element.classList.add("itemFlagged") }
                    else{ element.classList.remove("itemFlagged") }
                } else {
                    element.classList.add("itemHidden") ;
                }
            },
            build() {
                sprites.each(spr => { if(!spr.type.shadow){ this.fold.add(spr) }} );
                setTimeout(()=>this.setState(), 50);
            },
            unbuild(){
                this.fold.clear();
            },
            add(item) {
                var entry;
                 this.entries.push(entry = {
                     item, select: false,
                     guid: getUID(),
                     parent: this,
                     element : this.list.addItem(commands.spritesItem, item.toString(),showTypes.sprites.drag),
                });

                entry.element.style.textIndent = this.indent+"px";
                entry.element.title = null;
                entry.element.entry = entry;
                if (this.isOpen) {entry.element.classList.remove("hideItem") }
                else { entry.element.classList.add("hideItem") }
                flasher("newItem");
                return entry;
            },
            remove(item) {
                for(var i = 0; i < this.entries.length; i++){
                    const entry = this.entries[i];
                    if(entry.item.guid === item.guid) {
                        this.list.remove(entry.element);
                        this.entries.splice(i--,1)
                    }
                }
            },
        },
        collections: {
            id: commands.spritesShowCollections,
            name : "collections",
            fold : undefined,
            holdState: undefined,
            order() {
                this.eachOnlyOfFold(entry => {
                    if(entry.isFold) { entry.order() }
                });
            },
            getState(){},
            setState(){
                holdUpdates = false;
                widget.update()
                API.updateInfo();
            },
            showItem(entry) {
            },
            selectAdd(item) {
                if(item.isCollection) {
                    if (item.areAllSelected()) { item.unselect() }
                    else { item.select() }
                } else {
                    if (item.selected) { selection.remove(item) }
                    else { selection.add(item) }
                }
            },
            select(item, collectionOnly = false) {
                if(item.isCollection) {
                    if(!collectionOnly) { selection.clear(true) }
                    if(!item.selected) { collections.select(item, true) }
                    else { collections.select(undefined, true) }
                } else {
                    if(!collectionOnly) { selection.clear(true) }
                    if (item.selected) {
                        selection.remove(item);
                    } else {
                        selection.add(item);
                    }
                }
            },
            updateItem(entry, index = entry.element.listPosition) {
                var item = entry.item;
                const element = entry.element;
                var text;
                var selected;
                if(entry.isFold) {
                    selected = item.selected;
                    if(entry.entries.length === 0) {
                        entry.hide();
                        return;
                    } else if(entry.isHidden){ entry.show() }
                    text = entry.toString(entry.item.name);
                } else {
                    selected = item.selected;
                    text = item.toString();
                }
                element.listPosition = index;
                var icons = " " + (item.locks && item.locks.UI ? textIcons.locked : "");
                element.textContent = text + icons;
                if (item.helpString) { element.title = item.helpString() }
                else { element.title = "" }
                if (selected) {
                    updateFlags.hasSelected = true;
					updateFlags.canMove = (item.moveUp !== undefined || item.moveDown !== undefined);
                    element.classList.add("itemSelected")
                } else { element.classList.remove("itemSelected") }
                if(item.type && item.type.flagged) { element.classList.add("itemFlagged") }
                else{ element.classList.remove("itemFlagged") }
                if (item.isColorCollection) {
                    element.classList.add("showColor");
                    element.style.borderRightColor = item.colorCSS;
                }
            },
            update() {
                this.each(entry => {
                    if (entry.isFold) {
                        const col = entry.item;
                        if (col.dirty) {
                            for (const spr of col.deleted.values()) { entry.remove(spr) }
                            for (const spr of col.added.values()) { entry.add(spr) }
                            col.clean();
                        }
                    }
                });
            },
            add(item) {
                if (item.isCollection) {
                    const fold = createFold(this, item.name, showTypes.collections, item);
                    fold.ids = new Set();
                    item.each(col => fold.add(col));
                    item.clean();
                    showTypes.collections.updateItem(fold);
                    flasher("newItem");
                } else {
                    if(!this.isTop && this.item.ids.has(item.guid)) {
                        if(!this.hasItem(item)) {
                            var entry;
                            this.entries.push(entry = {
                                 item : item,
                                 select: false,
                                 guid: getUID(),
                                 parent: this,
                                 element : this.list.addItem(commands.spritesItem, item.toString()),
                            });
                            this.ids.add(item.guid);
                            entry.element.style.textIndent = this.indent+"px";
                            entry.element.title = null;
                            entry.element.entry = entry;
                            if (this.isOpen) {
                                entry.element.classList.remove("hideItem");
                                showTypes.collections.updateItem(entry);
                            } else { entry.element.classList.add("hideItem") }
                            flasher("newItem");
                            showTypes.collections.updateItem(this);
                        }
                    }
                    this.each(entry => {
                        if(entry.isFold) {
                            if(entry.item.ids.has(item.guid)) {
                                entry.add(item);
                            }
                        }
                    });
                }
            },
            remove(item) {
                for(var i = 0; i < this.entries.length; i++){
                    const entry = this.entries[i];
                    const it = entry.item;
                    if(entry.isFold) {
                        if(it.guid === item.guid) {
                            this.list.remove(entry.list);
                            this.entries.splice(i--, 1);
                            this.ids.delete(item.guid);
                        } else {
                            entry.remove(item);
                        }
                    } else if(it.guid === item.guid) {
                        this.list.remove(entry.element);
                        this.entries.splice(i--,1)
                        this.ids.delete(item.guid);
                    }
                }
                if (!this.isTop) {
                    showTypes.collections.updateItem(this);
                }
            },
            build() {
                collections.each(col => { this.fold.add(col) });
                setTimeout(()=>this.setState(), 50);
            },
            unbuild(){ this.fold.clear()  },
        },
        groups: {
            holdState: undefined,
            getState() {
                if (!this.holdState) { this.holdState = new Map() }
                else { this.holdState.clear() }
                const hs = this.holdState;
                if(this.fold) {
                    this.fold.each(entry => {
                        if(entry.isFold) {
                            const fold = entry;
                            const spr = entry.item;
                            hs.set(spr.guid, {guid: spr.guid, open: fold.isOpen});
                        } else {
                            const spr = entry.item;
                            hs.set(spr.guid,{guid: spr.guid});
                        }
                    });
                }
            },
            setStateBM67A() {
                holdUpdates = true;
                if(this.fold && this.holdState){
                    const hs = this.holdState;
                    this.fold.each(entry => {
                        if(entry.isFold) {
                            const fold = entry;
                            const spr = entry.item;
                            if(hs.has(spr.guid)) {
                                const state = hs.get(spr.guid);
                                if(state.selected && entry.parent && !entry.parent.isTop && !entry.parent.isOpen){
                                    entry.parent.open();
                                } else if(fold.isOpen !== state.open) {
                                    if(state.open) { fold.open() }
                                    else { fold.close() }
                                }
                            }
                        } else {
                            const spr = entry.item;
                            if(hs.has(spr.guid)) {
                                const state = hs.get(spr.guid);
                                if(state.selected) {
                                    if(entry.parent && !entry.parent.isTop && !entry.parent.isOpen){
                                        entry.parent.open();
                                    }
                                }
                            }
                        }
                    });

                    //selection.clear(); /* BM67 A */
                    this.fold.each(entry => {
                        if(entry.isFold) {
                            const fold = entry;
                            const spr = entry.item;
                            if(hs.has(spr.guid)) {
                                const state = hs.get(spr.guid);
                                if(fold.isOpen && state.selected) {
                                    if(spr.shadowedBy){
                                        //selection.add(spr.shadowedBy); /* BM67 A */
                                    }else{
                                        //selection.add(spr); /* BM67 A */
                                    }
                                }
                            }
                        } else {
                            const spr = entry.item;
                            if(hs.has(spr.guid)) {
                                const state = hs.get(spr.guid);
                                if(state.selected) {
                                    if(spr.shadowedBy){
                                       //selection.add(spr.shadowedBy); /* BM67 A */
                                    }else{
                                        //selection.add(spr); /* BM67 A */
                                    }
                                }
                            }
                        }
                    });
                    hs.clear();
                }
                holdUpdates = false;
                widget.update()
                API.updateInfo();
            },
            setState() {
                holdUpdates = true;
                if(this.fold && this.holdState){
                    const hs = this.holdState;
                    this.fold.each(entry => {
                        if(entry.isFold) {
                            const fold = entry;
                            const spr = entry.item;
                            if(hs.has(spr.guid)) {
                                const state = hs.get(spr.guid);
                                if(spr.selected && entry.parent && !entry.parent.isTop && !entry.parent.isOpen){
                                    entry.parent.open();
                                } else if(fold.isOpen !== state.open) {
                                    if(state.open) { fold.open() }
                                    else { fold.close() }
                                }
                            }
                        } else {
                            const spr = entry.item;
                            if(hs.has(spr.guid)) {
                                const state = hs.get(spr.guid);
                                if(spr.selected) {
                                    if(entry.parent && !entry.parent.isTop && !entry.parent.isOpen){
                                        entry.parent.open();
                                    }
                                }
                            }
                        }
                    });


                    hs.clear();
                }
                holdUpdates = false;
                widget.update()
                API.updateInfo();
            },
            id: commands.spritesShowGroups,
            name : "groups",
            fold : undefined,
            open() {
                if(!this.item.group.open) {
                    holdUpdates = true;
                    selection.clear(true);
                    selection.add(this.item);
                    issueCommand(commands.edSprOpenSelectedGroup);
                    holdUpdates = false;
                    selection.clear();
                    this._open();
                }
            },
            close() {
                log("Select len: " + selection.length );
                selection.clear(true);
                selection.add(this.item);
                issueCommand(commands.edSprGroupClose);
                selection.clear();

               // this._close();
                widget.update();
                log("Groups closed");
            },
            showItem(entry) {},
            selectAdd(item) {
                log("Groups select Add");
                if(item.shadowedBy) {
                    item = item.shadowedBy;
                }
                if(item.selected) {
                     log("Groups item selected ");
                    if(this.isTop) {
                        selection.remove(item);
                        log("Groups item selected remove");
                    } else if(this.item.type.openGroup) {
                        selection.remove(item);
                        log("Groups item selected remove open");
                    }
                } else {
                    if(this.isTop) {
                        selection.add(item);
                        log("Groups item select top");
                    } else if(this.item.type.openGroup) {
                        selection.add(item);
                        log("Groups item select ipen group");
                    }
                }
            },
            select(item) {

                if(item.shadowedBy) {
                    item = item.shadowedBy;
                }
                if(item.selected) {
                    selection.clear(true);
                } else {
                    selection.clear(true);
                    if(this.isTop) {
                        selection.add(item);
                    } else if(this.item.type.openGroup) {
                        selection.add(item);
                    }
                }

            },
            updateItem(entry, index = entry.element.listPosition) {
                var item = entry.item;
                const element = entry.element;
                var parent, parentItem;
                var text;
                if(entry.isFold) {
                    parent = entry.parent;
                    parentItem = parent.item;
                    text = entry.toString(item.toString()) ;
                    if(item.type.openGroup) {
                        element.classList.add("foldItemSpriteGroupOpen");
                    }else{
                        element.classList.remove("foldItemSpriteGroupOpen");
                    }
                    if(parentItem && parentItem.type.openGroup) {
                        element.classList.add("foldSpriteInGroupOpen");
                    }else {
                         if(!parent.isTop && parent.isOpen){parent._close()}
                        element.classList.remove("foldSpriteInGroupOpen");
                    }
                    updateFlags.canUngroup = true;
                } else {
                    text = item.toString();
                    parent = entry.parent;
                    parentItem = parent.item;
                    if (parentItem && parentItem.type.openGroup) {
                        element.classList.add("itemSpriteInGroupOpen");
                    }else{
                        if(!parent.isTop && parent.isOpen){parent._close()}
                        element.classList.remove("itemSpriteInGroupOpen");
                    }
                }
                if(item.shadowedBy) {item = item.shadowedBy }
                element.listPosition = index;
                var icons = " " + (item.locks && item.locks.UI ? textIcons.locked : "");
                element.textContent = text + icons;
                if (item.helpString) { element.title = item.helpString() }
                else { element.title = "" }
                if (item.selected) {
                    updateFlags.hasSelected = true;
                    element.classList.add("itemSelected");

                } else { element.classList.remove("itemSelected") }
                if(item.type && item.type.flagged) { element.classList.add("itemFlagged") }
                else{ element.classList.remove("itemFlagged") }
            },
            build() {
                sprites.each(spr => { this.fold.add(spr) } );
                setTimeout(()=>this.setState(), 50);
            },
            unbuild(){
                var closingGroups = true;
                groups.closeAll();
                //selection.clear();
                this.fold.clear();
            },
            add(item) {
                if (item.type && item.type.shadow) {
                    if(this.isTop || this.item.guid !== item.cast.guid) {
                        for(const entry of this.entries) {
                            if(entry.isFold){
                                entry.add(item);
                            }
                        }
                        return;
                    } else {
                        for(const entry of this.entries) {
                            if(entry.isFold && entry.item.guid === item.shadow.guid) {
                                return;
                            }
                        }
                        item = item.shadow;
                    }
                }
                if (item.type && item.type.group) {
                    const fold = createFold(this, item.name, showTypes.groups, item);
                    item.group.each(spr => fold.add(spr));
                } else {
                    var entry;
                     this.entries.push(entry = {
                         item, select: false,
                         guid: getUID(),
                         parent: this,
                         element : this.list.addItem(commands.spritesItem, item.toString()),
                    });
                    entry.element.style.textIndent = this.indent+"px";
                    entry.element.title = null;
                    entry.element.entry = entry;
                    if (this.isOpen) {entry.element.classList.remove("hideItem") }
                    else { entry.element.classList.add("hideItem") }
                    flasher("newItem");
                    return entry;
                }
            },
            remove(item) {
                for(var i = 0; i < this.entries.length; i++){
                    const entry = this.entries[i];
                    const it = entry.item;
                    if(entry.isFold) {
                        if(it.guid === item.guid) {
                            this.list.remove(entry.list);
                            this.entries.splice(i--, 1);
                        } else {
                            entry.remove(item);
                        }
                    } else if(it.guid === item.guid || (item.shadow && item.shadow.guid === it.guid)) {
                        this.list.remove(entry.element);
                        this.entries.splice(i--,1)
                    }
                }
            },
        },
        layers: {
            id: commands.spritesShowLayers,
            name : "layers",
            fold : undefined,
            getState(){},
            setState(){
                holdUpdates = false;
                widget.update()
                API.updateInfo();
            },
            showItem(entry) {},
            add(item) {
            },
            remove(item) {
            },
        },
    };
    showType = showTypes.sprites;
    function mouseInOut(event) {
        if (mouse.captured !== 0 && event.type === "mouseover") { return }
        var highlight;
        var update = false;
        var entry = event.target.entry;
        if (entry && entry.item) {
            highlight = event.type === "mouseover";
            let item = entry.item;
            if (entry.isFold) {
                if(entry.type === showTypes.collections) {
                    if (sprites.selectingSprite) {
                        item.each(spr => { !update && spr.highlightSelecting !== highlight && (update = true); spr.highlightSelecting = highlight });
                    } else {
                        item.each(spr => { !update && spr.highlight !== highlight && (update = true); spr.highlight = highlight });
                    }
                } else if(entry.type === showTypes.groups) {
                    if(item.shadowedBy) { item = item.shadowedBy }
                    if (sprites.selectingSprite) {
                        !update && item.highlightSelecting !== highlight && (update = true);
                        item.highlightSelecting = highlight
                    } else {
                        !update && item.highlight !== highlight && (update = true);
                        item.highlight = highlight
                     }
                }
            } else {
                if(item.shadowedBy) { item = item.shadowedBy }
                if (sprites.selectingSprite) { !update && item.highlightSelecting !== highlight && (update = true); item.highlightSelecting = highlight }
                else { !update && item.highlight !== highlight && (update = true); item.highlight = highlight }
                if (highlight) {  infoPannel.show(infoPannel.displayTypes.sprite, item) }
                else { infoPannel.hide(); }
            }
        }
        if (update && timeline.active) { timeline.highlightFrameNum = frameCount }
    }
    function createFold(parent, name, type, item){
        var indent;
        var open = false;
        var id;
        if (parent === undefined) {
            indent = 0;
            open = true;
            id = getUID();
        } else if(item.isCollection) {
            indent = parent.indent + INDENT;
            id = item.guid;
        } else if(item) {
            open = item.type.groupOpen;
            indent = parent.indent + INDENT;
            id = getUID();
        } else {
            indent = parent.indent + INDENT;
            id = getUID();
        }
        const fold = {
            type,
            parent,
            indent,
            select: false,
            isFold : true,
            isHidden: false,
            hide() {
                if(!this.isHidden) {
                    this.isHidden = true;
                    this.element.classList.add("hideItem");
                }
            },
            show() {
                if(this.isHidden) {
                    this.isHidden = false;
                    this.element.classList.remove("hideItem");
                }
            },
            get isOpen() { return open },
            open() {
                open = true;
                for (const entry of this.entries) { entry.element.classList.remove("hideItem") }
            },
            close() {
                open = false;
                for (const entry of this.entries) { entry.element.classList.add("hideItem") }
            },
            toggleOpen() {
                if (!open) {
                    this.open();
                } else {
                    this.close();
                }
                this.element.textContent = this.toString();
            },
            get name() { return name },
            set name(str) { name = str },
            id,
            item,
            entries : [],
            order() {
                if (this.onReorder) {
                    this.onReorder(this.entries);
                } else {
                    const oldList = [];
                    this.entries.forEach(entry => oldList.push(entry.item));
                    this.clear();
                    oldList.sort((a, b)=> a.index - b.index);
                    oldList.forEach(item => this.add(item));
                }
            },
            clear() {
                this.entries.forEach(entry => {
                    //this.list.remove(entry.element);
                    this.list.remove(entry.isFold ? entry.list : entry.element);
                });
                this.entries.length = 0;
            },
            hasItem(item) {
                return this.entries.some(entry => {
                    if(entry.item.guid === item.guid) { return true }
                    if(entry.isFold) { return entry.hasItem(item) }
                    return false;
                });
            },
            eachOpen(cb) {
                for (const entry of this.entries) {
                    if (entry.isFold && entry.isOpen) { entry.eachOpen(cb) }
                    else { cb(entry) }
                }
            },
            findItems(cb, list) {
                if(list.includes(this.item)) { cb(this) }
                for (const entry of this.entries) {
                    if (entry.isFold) { entry.findItems(cb, list) }
                    else if(list.includes(entry.item)){ cb(entry) }
                }
            },
            eachItem(cb) {
                for (const entry of this.entries) {
                    if (entry.isFold) { entry.eachItem(cb) }
                    else { cb(entry.item) }
                }
            },
            eachItemEntry(cb) {
                for (const entry of this.entries) {
                    if (entry.isFold) { entry.eachItemEntry(cb) }
                    else { cb(entry) }
                }
            },
            eachOnlyOfFold(cb) {
                var index = 0;
                for(const entry of this.entries){ cb(entry, index++) }
            },
            each(cb, i = 0) {
                var index = i;
                for(const entry of this.entries){
                    if(entry.isFold) {
                        if( cb(entry, index++) === true ) { return --index }
                        entry.each(cb);
                    }else if( cb(entry, index++) === true ) { return --index }
                }
            },

            toString(named = name) {
                return (open ? textIcons.triangleDown : textIcons.triangleRight +" ") + named + " " + this.entries.length + " items";
            },
            commandId: commands.spritesItem,
        };
        fold.add = type.add ? type.add.bind(fold) : showTypes.sprites.add.bind(fold);
        fold.remove = type.remove ? type.remove.bind(fold) : showTypes.sprites.remove.bind(fold);
        fold.select = type.select ? type.select.bind(fold) : showTypes.sprites.select.bind(fold);
        fold.selectAdd = type.selectAdd ? type.selectAdd.bind(fold) : showTypes.sprites.selectAdd.bind(fold);
        fold.open = type.open ? (fold._open = fold.open, type.open.bind(fold)) : fold.open;
        fold.close = type.close ? (fold._close = fold.close, type.close.bind(fold)) : fold.close;
        fold.update = type.update ? type.update.bind(fold) : undefined;
        fold.element = parent === undefined ? listElement.addFoldItem(fold) : parent.list.addFoldItem(fold);
        fold.element.entry = fold;
        fold.element.textContent = fold.toString();
        if(parent) {
            parent.entries.push(fold);
            fold.element.style.textIndent = parent.indent+"px";
            if(fold.item.protected) { fold.element.classList.add("protected") }
            else { fold.element.classList.remove("protected") }
            if (parent.isOpen) { fold.element.classList.remove("hideItem") }
            else { fold.element.classList.add("hideItem") }
        }
        return fold;
    }
    var saveToLocal = false, savePending = false, saveSelected = false, saveToClipboard = false;
    function canSave() {
         if (sprites.length > 0) {
            if (savePending) { log.warn("Previouse save is still pending") }
            else if (!settings.includeUnsavedImagesWhenSaving && sprites.hasDirtyImage()) {  log.warn("Sprites use 1 or more unsaved images.") }
            else { return true }
        } else { log.info("No sprites selected") }
        return false;
    }
    function animTimeSaveCallback() {
        animation.removeEvent("change", animTimeSaveCallback);
        extraRenders.addOneTimeReady(()=> {API.saveAll()}, 0);

    }
    function saveDialog() {
        return new Promise(ok => {
            if (media.hasUnused()) {
                if (commandLine.quickMenuOpen()) { log.warn("Save canceled. Close active dialogs first"); ok("Cancel"); return   }
                const saveUnused = buttons.quickMenu( "30 Save option?|Cancel,All,Used only|textCenter Media contains unused images!,textCenter Select All to save all media.,textCenter Select Used only to save only used media,textCenter Or cancel save.");
                saveUnused.onclosed = () => {
                    if(saveUnused.exitClicked === "All") {
                         ok("All");
                    } else if(saveUnused.exitClicked === "Used only") {
                        ok("Used only");
                    }else{
                        ok("Cancel");
                    }
                }
            } else {
                ok("All");
            }
        });

    }

    const API = {
        updateItemNameComplete(status) {
            if(!editingNameListItem){ return }
            var restoreOld = false;
            var itemToName = editingNameListItem.item;
            var newName;
            if(status === "rejected" || status === "aborted") {
                restoreOld = true;
            }else if(editingNameListItem.item.name.trim() === ""){
                restoreOld = true;
                setTimeout(()=>log.warn("Blank name rejected."), 0);
            } else if(itemToName.type && itemToName.type.functionLink) {
                newName = itemToName.name.trim();
                if (newName[0] === "#") { newName = newName.slice(1) }
                newName = textIcons.strToMath(itemToName.name.trim());
            }else{
                newName = itemToName.name.trim();
                if (newName[0] === "#") {
                    newName = newName.slice(1);
                    newName = textIcons.strToMath(newName);
                } else if (newName[newName.length - 1] === "#") {
                    newName = newName.slice(0, newName.length - 1);
                    newName = textIcons.strToMath(newName);
                }
            }
            for(const entry of editNameList) {
                if (restoreOld) {
                    entry.item.name = entry.oldName;
                    entry.oldName = undefined;
                } else {
                    entry.item.name = NAMES.register(newName);
                }

                showType.updateItem(entry);
                entry.element.classList.remove("itemEditingText")
            }
            editingNameListItem = undefined;
            editNameList.length = 0;
            !restoreOld && API.fireEvent("itemrenamed", itemToName);
            itemToName = undefined;
        },
        updateItemName() {
            if(!editingNameListItem || !editingNameListItem.item){ return } // sometimes browser hangs and this gets set to undefined due to callback order
            const itemToName = editingNameListItem.item;
            const baseName = itemToName.name = commandLine();

            for(const entry of editNameList) {
                if(entry.item && entry.item.isFold){
                    showType.updateItem(entry.item);
                }else{
                    entry.item.name = baseName;
                    showType.updateItem(entry);
                }
            }
            editingNameListItem.element.classList.add("itemEditingText");
        },
        renameItem(...items) { // first item is used for name
            if (editNameList.length) {
                API.updateItemNameComplete("aborted");
            }
            editNameList.length = 0;
            for (const item of items) {
                topFold.findItems(entry => { editNameList.push(entry) }, [item]);
            }
            const item = items[0];
            if(editNameList.length) {
                if (editNameList[0].item === undefined) {
                    log.warn("Bad item reference renaming sprite.");
                    editNameList.length = 0;
                } else {
                    editingNameListItem = editNameList[0];
                    editingName = editNameList[0].item.name;
                    for(const entry of editNameList) {
                        entry.oldName = entry.item.name;
                        entry.element.classList.add("itemEditingText")
                    }
                    commandLine(API.updateItemName, API.updateItemNameComplete);
                    commandLine(item.name, false, true, true);
                }
            }
        },
        findItems(cb, list, ifOpen = false) { topFold.findItems(cb, list) },
        eachOpen(cb) { topFold.eachOpen(cb) },
        eachItem(cb) { topFold.eachItem(cb) },
        eachItemEntry(cb) { topFold.eachItemEntry(cb) },
        each(cb, i = 0){ topFold.each(cb, i) },
        get selectedItemEntries() {
            var sel = [];
            API.eachItemEntry(entry => entry.item.selected && sel.push(entry));
            return sel;
        },
        set holdUpdates(val) { holdUpdates = val },
        get holdUpdates() { return holdUpdates },
        rebuildLists(){
            if(holdUpdates){ return }
            topFold.clear();
            showType.unbuild();
            showType.build();
            API.update();
        },
        add(item) {
            if(holdUpdates){ return }
            return topFold.add(item)
        },
        remove(item) {
            if(holdUpdates){ return }
            return topFold.remove(item)
        },
        listType: null,
        order(){ topFold.order() },
        clear(){ topFold.clear() },
        getButton(commandId) { return buttonMap.get(commandId) },
        ready(pannel) {
            tabElement = pannel.titleElement;
            flasher = elementFlasher(tabElement, {newItem : "tabFlashNew"});
            listElement = buttonMap.get(commands.sprites).element;
            showTypes.collections.fold = topFold = createFold(undefined, "Top fold", showTypes.collections);
            topFold.element.classList.add("hideItem");
            topFold.element.classList.add("top");
            topFold.element.style.height = "0px";
            topFold.element.textContent = null;
            topFold.order = showTypes.collections.order.bind(topFold);
            topFold.indent = 0;
            topFold.isTop = true;
            showTypes.groups.fold = topFold = createFold(undefined, "Top fold", showTypes.groups);
            topFold.element.classList.add("hideItem");
            topFold.element.classList.add("top");
            topFold.element.style.height = "0px";
            topFold.element.textContent = null;
            topFold.indent = 0;
            topFold.isTop = true;
            showTypes.sprites.fold = topFold = createFold(undefined, "Top fold", showTypes.sprites);
            topFold.element.style.height = "0px";
            topFold.element.classList.add("top");
            topFold.element.textContent = null;
            topFold.indent = 0;
            topFold.isTop = true;
            API.listType = showTypes.sprites.id;
            ["mouseover","mouseout"].forEach(name => buttonMap.get(commands.sprites).element.addEventListener(name,mouseInOut,{passive:true}))
            API.updateInfo();
			collections.addEvent("selectionchanged",(owner,eventName,data) => {
				if(showType === showTypes.collections) {
					API.findItems(entry => { showType.updateItem(entry) },[data]);
				}

			});
			collections.addEvent("created",() => {
				flasher("newItem")
				if(showType === showTypes.collections && !holdUpdates) {
					topFold.clear();
					showType.unbuild();
					showType.build();
					API.update();
				}
			});
			collections.addEvent("collectiondeleted",() => {
				flasher("newItem")
				if(showType === showTypes.collections && !holdUpdates) {
					topFold.clear();
					showType.unbuild();
					showType.build();
					API.update();
				}
			});
        },
        selectionCallback(cb) { selectedCallback = cb },
        saveUndo(id) {
            log("Saving undo point: " + id);
            /*const name = storage.saveJSON( {
                sprites: sprites.serialize(),
                //vectors: sprites.serialize("vectors"),
                //groups: groups.serialize(),
                //collections: collections.serialize(),
                //timeline: timeline.serialize(),
                //animation: animation.serialize(),
                //kinematics: kinematics.serialize(),
                //media: media.serialiseSprites(true), // true to check usage
            },storage.localStorageNames[id+1], "scene");*/
        },
        saveAll_saveImages: true,
        async saveAll(backup = false) {
            buttonMap.get(commands.spritesSaveAll).disable();
            buttonMap.get(commands.spritesSaveAllLocal).disable();
            buttonMap.get(commands.spritesLoadFromLocal).disable();
            savePending = false;
            var saveUsedMedia = "Used only";
            if (!saveSelected) {
                saveUsedMedia = await saveDialog();
                if (saveUsedMedia === "Cancel") {
                    log.warn("Save aborted by user!");
                    buttonMap.get(commands.spritesSaveAll).enable();
                    buttonMap.get(commands.spritesSaveAllLocal).enable();
                    buttonMap.get(commands.spritesLoadFromLocal).enable();
                    sprites.restoreSceneName();
                    return;
                }
            }
            const imageData = API.saveAll_saveImages ? await media.serialiseImages(saveUsedMedia === "Used only", saveSelected) : undefined;
            const subSprites = media.serialiseSprites(true, saveSelected);
            var workspace = {};
            if (settings.saveGridState === true && !saveSelected) {
                workspace.showGrid = editSprites.showGrid;
                workspace.snapMode = editSprites.snapMode;
                workspace.pixelSnap = settings.pixelSnap;
            }
            groups.closeAll();
            if (saveToLocal || backup || saveToClipboard) {
                const name = storage.saveJSON( {
                    workspace: !(saveSelected || saveToClipboard) ? editSprites.serializeWorkspace() : undefined,
                    sprites: sprites.serialize(...(saveSelected ? [undefined, true] : [])),
                    vectors: sprites.serialize("vectors", saveSelected),
                    groups: saveSelected ? undefined : groups.serialize(),
                    collections: collections.serialize(saveSelected),
                    timeline: timeline.serialize(saveSelected),
                    animation: animation.serialize(),
                    kinematics: saveSelected ? undefined : kinematics.serialize(),
                    text: spriteText.serialize(saveSelected),
                    media: subSprites,
                    images: imageData,
                }, storage.localStorageNames[backup ? 1 : saveToClipboard ? 2 : 0], "scene", undefined, !(saveSelected || saveToClipboard));
                if (backup) {
                    localStorage[APPNAME+"_BackupSessionId"] = APP_SESSION_ID;
                }
                if (name !== undefined) {
                    log.info(backup ? "Scene saved as backup" : "Sprites saving in local storage.");
                }
            } else {
                const name = storage.saveJSON( {
                    workspace: editSprites.serializeWorkspace(),
                    sprites: sprites.serialize(...(saveSelected ? [undefined, true] : [])),
                    vectors: sprites.serialize("vectors", saveSelected),
                    groups: saveSelected ? undefined : groups.serialize(),
                    collections: collections.serialize(saveSelected),
                    timeline: timeline.serialize(saveSelected),
                    animation: animation.serialize(),
                    kinematics: saveSelected ? undefined : kinematics.serialize(),
                    text: spriteText.serialize(saveSelected),
                    media: subSprites,
                    images: imageData,
                }, sprites.sceneName, "scene", undefined, true);
                log.info("Downloading scene as '" + name + "'");
            }
            keepOpenButton = true;
            buttonMap.get(commands.spritesSaveAll).enable();
            buttonMap.get(commands.spritesSaveAllLocal).enable();
            buttonMap.get(commands.spritesLoadFromLocal).enable();
            sprites.restoreSceneName();
        },
        commands: {
            [commands.saveForUndo]() { API.saveUndo(undos.undoId) },
            [commands.spritesSelectedToClipboard]() {
                if (!CanDo.clipboard) { log.warn("You dont have permision to access clipboard"); return false; }  
                if (selection.length) {
                    if (canSave()){      
                        saveToLocal = false;
                        saveSelected = true;
                        saveToClipboard = true;
                        if (animation.time !== animation.startTime) {
                            savePending = true;
                            animation.addEvent("change", animTimeSaveCallback);
                            animation.time = animation.startTime;
                        } else {
                            savePending = true;
                            animTimeSaveCallback();
                        }
                    }
                } else {
                    log.warn("Nothing is selected to save!");
                }
                return false;                  
                
            },
            [commands.spritesSaveSelected]() {
                if (selection.length) {
                    if (canSave()){
                        saveToLocal = false;
                        saveSelected = true;
                        saveToClipboard = false;
                        if (animation.time !== animation.startTime) {
                            savePending = true;
                            animation.addEvent("change", animTimeSaveCallback);
                            animation.time = animation.startTime;
                        } else {
                            savePending = true;
                            animTimeSaveCallback();
                        }
                    }
                } else {
                    log.warn("Nothing is selected to save!");
                }
                return false;                
            },
            [commands.spritesSaveSelectedLocal]() {
                if (canSave()) {
                    saveToLocal = true;
                    saveSelected = true;
                    saveToClipboard = false;
                    if (animation.time !== animation.startTime) {
                        savePending = true;
                        animation.addEvent("change", animTimeSaveCallback);
                        animation.time = animation.startTime;
                    } else {
                        savePending = true;
                        animTimeSaveCallback();
                    }
                }
                return false;
            },            
            [commands.spritesSaveAll]() {
                if (mouse.ctrl) { return API.commands[commands.spritesSaveSelected](); }
                if (canSave()){
                    saveSelected = false;
                    saveToLocal = false;
                    saveToClipboard = false;
                    if (animation.time !== animation.startTime) {
                        savePending = true;
                        animation.addEvent("change", animTimeSaveCallback);
                        animation.time = animation.startTime;
                    } else {
                        savePending = true;
                        animTimeSaveCallback();
                    }
                    unloadWarning = false;
                }
                return false;
            },
            [commands.spritesLoadFromLocal]() {
                if (localStorage[storage.localStorageNames[0]]) {
                    storage.loadJSON(storage.localStorageNames[0]);
                    log.info("Loaded local storage");
                } else {
                    log.info("No sprites found in local storage");
                }
                return false;
            },
            [commands.spritesSaveAllLocal]() {
                if (canSave()) {
                    saveToLocal = true;
                    saveSelected = false;
                    if (animation.time !== animation.startTime) {
                        savePending = true;
                        animation.addEvent("change", animTimeSaveCallback);
                        animation.time = animation.startTime;
                    } else {
                        savePending = true;
                        animTimeSaveCallback();
                    }
                    unloadWarning = false;
                }
                return false;
            },            
            [commands.spritesUnselectAll](){ selection.clear() },
            [commands.spritesSelectAll](){ selection.add(sprites.map(spr=>spr)) },
            [commands.spritesShowSelected](event, left, right){ 
                if (right) {
                    autoScrollSprite = !autoScrollSprite;
                    log.info("Toggled auto show to " + (autoScrollSprite ? "On" : "Off"));
                    return false;
                } else {
                    const sel = API.selectedItemEntries;
                    showType.showItem(sel[showIdx % sel.length]);
                    showIdx ++;
                    return false;
                }
                
            },
            [commands.spritesSelectInvert](){
                const inv = sprites.filter(spr => !spr.selected);
                selection.clear();
                selection.add(inv);
            },
            [commands.spritesShowGroups](){
                showType.getState();
                topFold.clear();
                showType.unbuild();
                showType.fold.element.classList.add("hideItem");
                showType = showTypes.groups;
                lastClickedIdx = -1;
                showType.build();
                showType.fold.element.classList.remove("hideItem");
                topFold = showType.fold;
                API.listType = showType.id;
                API.commands.updateMenu = true;
            },
            [commands.spritesShowCollections](){
                showType.close && showType.close();
				selection.save();
                showType.getState();
                topFold.clear();
                showType.unbuild();
                showType.fold.element.classList.add("hideItem");
                showType = showTypes.collections;
                lastClickedIdx = -1;
				holdUpdates = true;
				//log("Build colletions from show command @"+performance.now().toFixed(3));
                showType.build();
                showType.fold.element.classList.remove("hideItem");
                topFold = showType.fold;
				selection.restore();
                API.listType = showType.id;
                API.commands.updateMenu = true;
            },
            [commands.spritesShowLayers](){
                log.warn("layers sub pannel is yet to be implemented");
                return false;
            },
            [commands.spritesShowSprites](){
                showType.close && showType.close();
				selection.save();
                showType.getState();
                topFold.clear();
                showType.unbuild();
                showType.fold.element.classList.add("hideItem");
                if (showType !== showTypes.sprites) { lastClickedIdx = -1; }
                showType = showTypes.sprites;
                showType.build();
                showType.fold.element.classList.remove("hideItem");
                topFold = showType.fold;
				selection.restore();
                API.commands.updateMenu = true;
                API.listType = showType.id;
            },
            [commands.spritesGroup](event, left, right) {
                holdUpdates = true;
                if (right) {
                    issueCommand(commands.edSprOpenCopyGroup);
                } else {
                    if (showType.id === commands.spritesShowGroups) { showType.getState() }
                    holdUpdates = true;
                    issueCommand(commands.edSprGroupSelected);
                }
                showType.unbuild();
                showType.build();
                API.commands.updateMenu = API.commands.rebuild = true;
            },
            [commands.spritesOrderUp]() {
				var rebuild = false;
				if (showType === showTypes.collections) {
					API.each(fold => {
						if(fold.isFold && fold.item.selected) {
							if(fold.item.moveUp) {
								fold.item.moveUp();
								rebuild = true;
							}
						}
					});
					if (rebuild) {
						showType.unbuild();
						showType.build();
						API.commands.updateMenu = API.commands.rebuild = true;
					}
				}
			},
            [commands.spritesOrderDown]() {
				var rebuild = false;
				if (showType === showTypes.collections) {
					API.each(fold => {
						if(fold.isFold && fold.item.selected) {
							if(fold.item.moveDown) {
								fold.item.moveDown();
								rebuild = true;
							}
						}
					});
					if (rebuild) {
						showType.unbuild();
						showType.build();
						API.commands.updateMenu = API.commands.rebuild = true;
					}
				}
			},
            [commands.spritesToggleToDraw]() {
                if (!buttonMap.get(commands.spritesToggleToDraw).disabled) {
                    var countToggled = 0;
                    selection.eachOfType(spr => {
                        if (spr.canDrawOn()) {
                            countToggled ++;
                            if (spr.drawOn) {
                                spr.setDrawOn(false);
                            } else {
                                spr.setDrawOn(true);
                            }
                        }
                    }, "image");
                    if (countToggled) {
                        setTimeout(()=>spriteList.update(),0);
                        API.commands.updateList = true;
                        //API.commands.updateMenu = true;
                    } else {
                        log.warn("None of the selected sprites could be toggled");
                    }
                }
            }
        },
        command(commandId,button,event) {
            var rightClicked = (mouse.oldButton & 4) === 4;
            var leftClicked = (mouse.oldButton & 1) === 1;
            var updateList = false;
            var updateMenu = false;
            var rebuild = false;
            if(API.commands[commandId]) {
                API.commands.updateList = false;
                API.commands.updateMenu = false;
                API.commands.rebuild = false;
                if (API.commands[commandId](event, leftClicked, rightClicked) === false) { return  }
                if(API.commands.updateGuides) { updateGuides = true }
                if(API.commands.updateMenu) { updateMenu = true }
                if(API.commands.rebuild) { rebuild = true }
                if(!updateMenu && !updateList && !rebuild) { return }

            }
            if(commandId === commands.spritesUngroup){
                holdUpdates = true;
                issueCommand(commands.edSprUngroupSelected);
                showType.unbuild();
                showType.build();
                updateList = true;
                rebuild = true;
            }else  if(commandId === commands.spritesCollect){
                if(selection.length > 0) {
                    if(showType === showTypes.collections) {

                        if (mouse.ctrl) {
                            if(!collections.current.protected && collections.current.selected) {
                                const cCol = collections.current;
                                selection.each(spr => cCol.add(spr));
                                showType.fold.update();
                                return;

                            }

                        }else  if (rightClicked) {
                            if(!collections.current.protected && collections.current.selected) {
                                const cCol = collections.current;
                                selection.each(spr => {cCol.delete(spr)});
                                showType.fold.update();
                                return;
                            }
                        } else {
                            const col = collections.current;
                            if(col.selected && !col.protected) {
                                selection.each(spr => { col.add(spr) });
                                showType.fold.update();
                                return;
                            }
                        }
                    }
                    if (mouse.ctrl) {
                        log.warn("Must have sub tab Collections open and")
                        log.warn("a user collection selected");

                    }else if(!rightClicked) {
                        const col = collections.create(selection.asArray(), undefined, "User selection");
                        if(showType === showTypes.collections) {
                            //API.add(col);
                            setTimeout(() => {API.renameItem(col)}, 100);
                        }
                    }
                    updateList = true;
                }
            }else  if(commandId === commands.spritesUncollect){
                updateList = true;
            }else  if(commandId === commands.spritesRecall){
                log.info("Currently not working")
            }else  if(commandId === commands.spritesRemember){
                log.info("Currently not working")

            }else  if(commandId === commands.spritesItem){
                const entry = event.target.entry;
                const item = entry.item;
                const parent = entry.parent;
                if(mouse.alt && (leftClicked || rightClicked)) {
                    if (item.isSprite) {
                        if (editSprites.drawingModeOn) {
                            if (item.canDrawOn()) {
                                if (leftClicked) { item.setDrawOn(item.drawOn ? false : true) } 
                                else {
                                    if (!item.drawOn) {
                                        sprites.forEach(spr => {
                                            if (spr.type.image && spr.image.isDrawable) {
                                                if (spr === item) { item.setDrawOn(true); }
                                                else if (spr.drawOn) { spr.setDrawOn(false); }
                                            }                                    
                                        });
                                    } else { item.setDrawOn(false) }
                                }
                                setTimeout(()=>spriteList.update(),0);
                                API.commands.updateList = true;                            
                            } else {
                                log.warn("Sprite must be an unlocked visible drawable image to draw on.");
                            }
                        } else {
                            log.warn("Can not draw on sprite as not in drawing mode");
                        }
                    } else {
                        log.warn("Alt click function only for sprites");
                    }
                    return;
                }

                if(mouse.shift && leftClicked) {
                    if(item.type.shiftClickSetting) {
                        if(item.shiftClick.help) { log.info(item.shiftClick.help) }
                        commandLine(item.shiftClick.commandLine(item), false,true, true, true);
                        commandLine.clearOnBlur = true;
                        return;
                    } else {
                        if(showType === showTypes.sprites) {
                            if (lastClickedIdx > -1) {
                                let i = lastClickedIdx;
                                let j = item.index;
                                
                                let removeSel = item.selected;
                                if (i !== j) {
                                    API.each(it => {
                                        if ((it.item.index >= i && it.item.index <= j) || (it.item.index <= i && it.item.index >= j)) {
                                            if (removeSel) {
                                                if (it.item.selected) { selection.remove(it.item); }
                                            } else if (!it.item.selected) { selection.add(it.item); }
                                        }
                                    });
                                    lastClickedIdx = j;
                                    API.update();
                                    API.updateFlags();
                                    editSprites.update();
                                    widget.update();
                                    return;
                                }
                            }
                        } else {
                            log.info("This item has no shift click properties");
                            return;
                        }
                    }
                    
                }
                if(mouse.ctrl && leftClicked) {
                    if(item.isCollection && item.protected) {
                        log.warn("This collection can not be renamed");
                        return;
                    }
                    const sel = [item];
                    API.each(it => {
                        if (it.item.selected === true && it.item !== item) {
                            sel.push(it.item);
                        }
                    });

                    API.renameItem(...sel);
                    log.command("Click for text modifer help","text ?" );
                    return;
                }
                if(entry.isFold && event.offsetX < entry.indent + 16) {
                    entry.toggleOpen();
                    updateMenu = true;
                } else {
                    if(sprites.selectingSprite) { //selectedCallback){
                        selection.silent = true;
                        selection.clear()
                        selection.add(item);
                        selection.silent = false;
                        widget.specialSelectionSelect(false);
                        return;
                    }
                    if(showType === showTypes.collections) {
                        if(entry.isFold) {
                            if(rightClicked) {
                                parent.selectAdd(item);
                                updateMenu = true;
                                showType.updateItem(entry);
                            } else {
                                parent.select(item, true);
                                updateMenu = true;
                                showType.updateItem(entry);
                            }
                        } else {
                            if(rightClicked) {
                                parent.selectAdd(item);
                                updateMenu = true;
                                showType.updateItem(entry);
                            } else if(leftClicked) {
                                parent.select(item);
                                updateMenu = true;
                                showType.updateItem(entry);
                            }
                        }
                    } else {
                        if(rightClicked) {
                            parent.selectAdd(item);
                            updateMenu = true;
                            showType.updateItem(entry);
                            lastClickedIdx = item.index;
                            API.update();
                        } else if(leftClicked) {                            
                            parent.select(item);
                            updateMenu = true;
                            showType.updateItem(entry);
                            lastClickedIdx = item.index;
                            API.update();
                        }
                    }
                }
            }
            if(updateMenu){
				API.updateFlags();
                editSprites.update();
                widget.update();
            }else if(updateList) {
                API.update();
            }
        },
        globalAction(actionId) {
            if (showType === showTypes.sprites && selection.length === 1) {
                var idx = selection[0].index;
                idx = actionId === commands.sysUp ? idx - 1 : actionId === commands.sysDown ? idx + 1 : idx;
                idx = idx < 0 ? sprites.length - 1 : idx >= sprites.length ? sprites.length - 1 : idx;
                selection.clear();
                selection.add(sprites[idx]);
            }

        },
        updateInfo(){
            API.listType = showType.id;
            clearTimeout(debounceUpdateHandle);
            if (holdUpdates) { return }
            debounceUpdateHandle = setTimeout(()=>API.update(),50);
        },
        update() {
            API.listType = showType.id;
            if (holdUpdates) { return }
            if (lastUpdateFrame === frameCount) { API.updateInfo(); return; }
            lastUpdateFrame = frameCount;
            clearTimeout(debounceUpdateHandle);
            if (showType.fold.update) { showType.fold.update() }
            updateFlags.clear();
            API.each(showType.updateItem);
			API.updateFlags();

            if (selection.length) { buttonMap.get(commands.spritesCollect).enable() }
            else { buttonMap.get(commands.spritesCollect).disable() }
            buttons.groups.setRadio("spriteListShowType", showType.id, true);
            mediaList.update();
            if (autoScrollSprite && selection.length > 0) { issueCommand(commands.spritesShowSelected); }
        },
		updateFlags() {
            showIdx = 0;
            if (updateFlags.hasSelected) {
                if (showType === showTypes.sprites) { buttonMap.get(commands.spritesShowSelected).enable(); } 
                else { buttonMap.get(commands.spritesShowSelected).disable(); }
                buttonMap.get(commands.spritesGroup).enable();
                buttonMap.get(commands.spritesCollect).enable();
                if (updateFlags.canUncollect) { buttonMap.get(commands.spritesUncollect).enable(); }
                else { buttonMap.get(commands.spritesUncollect).disable(); }
                if (updateFlags.canUngroup) { buttonMap.get(commands.spritesUngroup).enable(); }
                else { buttonMap.get(commands.spritesUngroup).disable(); }
                if (editSprites.drawingModeOn) {
                    if (updateFlags.hasDrawable) { buttonMap.get(commands.spritesToggleToDraw).enable(); }
                    else { buttonMap.get(commands.spritesToggleToDraw).disable(); }
                } else { buttonMap.get(commands.spritesToggleToDraw).disable(); }
            } else {
                buttonMap.get(commands.spritesShowSelected).disable();
                buttonMap.get(commands.spritesToggleToDraw).disable();
                buttonMap.get(commands.spritesCollect).disable();
                buttonMap.get(commands.spritesUncollect).disable();
                buttonMap.get(commands.spritesGroup).disable();
                buttonMap.get(commands.spritesUngroup).disable();
            }
            if (sprites.length) {
                buttonMap.get(commands.spritesSaveAll).enable();
                buttonMap.get(commands.spritesSaveAllLocal).enable();
                buttonMap.get(commands.spritesSelectAll).enable();
                buttonMap.get(commands.spritesSelectInvert).enable();
                
            } else {
                buttonMap.get(commands.spritesSelectAll).disable(undefined, true);
                buttonMap.get(commands.spritesSelectInvert).disable(undefined, true);
                buttonMap.get(commands.spritesSaveAll).disable(undefined, true);
                buttonMap.get(commands.spritesSaveAllLocal).disable(undefined, true);
                
            }
		},
        setButtons(buttons) {
            for (const but of buttons) { buttonMap.set(but.command, but) }
            return buttons;
        }
    };
    Object.assign(API, Events(API));
    return API;
})();