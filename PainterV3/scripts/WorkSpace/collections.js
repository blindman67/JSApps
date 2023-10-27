"use strict";
const collections = (() => {
    const collections = new Map();
    var current;
    function Collection(children, parent, name, protectedCol, guid = getGUID()) {
        this.name = name;
        this.children = [];
        this.guid = guid;
        this.ids = new Set();
        this.deleted = new Set();
        this.added = new Set();
        this.parent = parent;
        this.selected = false;
        this.protected = protectedCol;
        Object.assign(this, Events(this));
        children.forEach(child => this.add(child));
        this.isEmpty = children.length === 0;
        this.dirty = true;  // This flag is used to clean collection from outside. It does not indicated a systmatic clean cycle
    }
    Collection.prototype = {
        clean() {
            if(this.dirty) {
                this.deleted.clear();
                this.added.clear();
                this.dirty = false;
                if(this.children.length === 0 && !this.protected) {
                    API.delete(this);
                }
            }
        },
        deserial(col) {
            //this.parent_I = col.parent;
            this.name = col.name;
            this.guid_I = col.guid;
            //this.childrenIds = col.children;
        },
        serial(selectedOnly) {
            const col = {
                //parent: this.parent ? this.parent.guid : undefined,
                name: this.name,
                guid: this.guid,
                children: [],
            };
            if (selectedOnly) {
                for(const child of this.children) { 
                    if (sprites.isGUIDSelected(child.guid)) {
                        col.children.push(child.guid); 
                    }
                }
            } else {
                for(const child of this.children) { col.children.push(child.guid); }
            }
            return col;
        },
        get isTop() { return this.parent === undefined },
        isCollection: true,
        hasId(id) { return this.ids.has(id) },
        getById(id) { return this.children.find(item => item.guid === id) },
        getCollectionContaining(item) {
            var colFound;
            this.eachCollection(col => {
                if (col.hasId(item.guid)) {
                    colFound = col;
                    return true;
                }
            });
            return colFound;
        },
        add(child) {
            if (!this.ids.has(child.guid)) {
                if (!this.isTop) { this.parent.delete(child) }
                this.children.push(child);
                this.ids.add(child.guid);
                this.added.add(child);
                this.dirty = true;
                this.fireEvent("childadded", this, child);
            }
            if(this.children.length === 0) { this.isEmpty = true }
            else { this.isEmpty = false }
        },
        close() {
            for(const child of [...this.children]) { this.remove(child) }
            this.fireEvent("closing",this);
        },
        delete(child) {
            if (this.ids.has(child.guid)) {
                this.children.splice(this.children.findIndex(item => item.guid === child.guid), 1);
                this.ids.delete(child.guid);
                this.deleted.add(child);
                this.dirty = true;
            }
            if (this.children.length === 0) { this.isEmpty = true }
            else { this.isEmpty = false }
        },
        remove(child) {
            if (this.ids.has(child.guid)) {
                this.children.splice(this.children.findIndex(item => item.guid === child.guid), 1);
                this.ids.delete(child.guid);
                if (!this.isTop) { this.parent.add(child) }
                this.fireEvent("childremoved", this, child);
            }
        },
        asArray() { return [...this.children] },
        eachCollection(cb) {
            for(const child of this.children) {
                 if (child.isCollection) {
                     if (cb(child) === true) { return true }
                }
            }
        },
        each(cb) {
            for(const child of this.children) {
                if (cb(child) === true) { return true }
                if (child.isCollection) {
                    if(child.each(cb) === true) { return true }
                }
            }
        },
        reset() {
            while(this.children.length) {
                this.delete(this.children[0]);
            }

        },
        areAllSelected () {
            for(const child of this.children) {
                if(!child.selected) { return false }
            }
            return true;
        },
        select() {
            //this.selected = true;
            for(const child of this.children) {
                if(child.isCollection) {
                    child.select();
                } else if (child.isPseudoSprite) {
                    child.select(true);
                } else {
                    selection.add(child);
                }
            }
        },
        unselect() {
            //this.selected = false;
            for(const child of this.children) {
                if(child.isCollection) {
                    child.unselect();
                } else if (child.isPseudoSprite) {
                    child.select(false);
                }else {
                    selection.remove(child);
                }
            }
        },
    };
    const API = {
        deserial(cols) {
            cols.forEach(col => {
                const newCol = API.create(col.children.map(guid => {
                        const spr =  sprites.getByGUID_I(guid);
                        if(spr) { return spr }
                    }).filter(spr => spr !== undefined),
                    undefined, col.name
                );
				newCol.guid_I = col.guid;
            });
        },
        serialize(selectedOnly = false) {
            const cols = [];
            API.each(col => {
                if (!col.protected) { 
                    const colS = col.serial(selectedOnly);
                    if (colS.children.length) { cols.push(colS); }
                };
            });
            return cols;
        },
        create(items, parentCollection, name, protectedCol = false, guid) {
            if (!protectedCol || (parentCollection && ! parentCollection.protected)) {name = NAMES.register(name) }
            const col = new Collection(items, parentCollection, name, protectedCol, guid);
            collections.set(col.guid, col);
            API.fireEvent("created", col);
            return col;
        },
        each(cb) {
            for(const col of collections.values()) { if(cb(col) === true) { return } };
        },
		order(col, direction) {
			var changed = false;
			const map = [...collections.values()];
			direction = direction.toLowerCase();
			var i = 0;
			while (i < map.length) {
				if(!map[i].protected) {
					if(col === map[i]) {
						if(direction === "up" && i > 0 && !map[i-1].protected) {
							map[i] = map[i-1];
							map[i-1] = col;
							changed = true;
							break;
						} else if(direction === "down" && i < map.length - 1) {
							map[i] = map[i+1];
							map[i+1] = col;
							changed = true;
							i++;
							break;
						}
					}
				}
				i++;
			}
			if(changed) {
				collections.clear();
				for(const col of map) { collections.set(col.guid, col) }
				API.fireEvent("selectionchanged",current);
			}
		},
        getByName(name) {
			for(const col of collections.values()) {
				if (col.name === name) { return col }
			}
        },
		getByGUID_I(guid) {
			for(const col of collections.values()) {
				if (col.guid_I === guid) { return col }
			}
		},
		removeImportGUID() {
			for(const col of collections.values()) {  delete col.guid_I }
		},
        delete(col) {
           // if(!col.isTop && collections.has(col.guid)) {
            //if(!col.isTop &&
			if(collections.has(col.guid)) {
                log("Delete collection: '" + col.name + "'");
                col.close();
                collections.delete(col.guid);
                API.fireEvent("collectiondeleted", col);
            }
        },
        get current() { return current },
        getCollectionsContaining(item, protectedCol = false) {
            const cols = [];
            API.each(col => {
                if ((protectedCol === false && col.protected === false) || protectedCol) {
                    if (col.hasId(item.guid)) {
                        cols.push(col);
                    }
                }
            });
            return cols;
        },
        reset() {
            const deleteList = [];
            API.each(col => {
                col.reset();
                if (!col.protected) { deleteList.push(col) }

            });
            deleteList.forEach(col => API.delete(col));

        },
        select(col, collectionOnly = false) {
            if(col === undefined) {
                if(collectionOnly) {
                    if(current && current.selected) {
                        current.selected = false;
                        API.fireEvent("selectionchanged",current);
                    }
                } else {
                    current.selected = false;
                    current.unselect();
                    API.fireEvent("selectionchanged",current);
                }
            }else  if(collections.has(col.guid)) {
                if(collectionOnly) {
                    if(current) {
						current.selected = false;
                        API.fireEvent("selectionchanged",current);
					}
                    current = col;
                    if(!col.protected) {
                        current.selected = true;
                        API.fireEvent("selectionchanged",current);
                    }
                } else {
                    if(current) {
						current.selected = false;
                        API.fireEvent("selectionchanged",current);
					}
                    current = col;
                    current.select();
                    current.selected = true;
                    API.fireEvent("selectionchanged",current);
                }
            }
        }
    };
    Object.assign(API, Events(API));
    const  customCollections = {
        color(collection) {
            const _API = {

                collection,
                add(spr) {
                    if (spr.type.animated && spr.animation.tracks.rgb) {
                        if (collection.hasId(spr.guid) ) { _API.remove(spr) }
                        return;
                    }
                    const rgb = spr.rgb.css;
                    const existingCollection = collection.getCollectionContaining(spr);
                    if (existingCollection) {
                        if(existingCollection.guid === rgb) {
                            return;
                        }
                        existingCollection.delete(spr);
                        if (existingCollection.isEmpty) {
                            collection.delete(existingCollection);
                        }
                    }
                    var colCollection = collection.getById(rgb);
                    if (!colCollection) {
                        colCollection = new Collection([], collection, "Color '" + rgb.toUpperCase() + "'", false, rgb);
                        API.fireEvent("created", colCollection);
                        collection.add(colCollection);
                        colCollection.isColorCollection = true;
                        colCollection.colorCSS = rgb;
                    }
                    colCollection.add(spr);
                },
                update(spr) { API.add(spr) },
                remove(spr) {
                    const existingCollection = collection.getCollectionContaining(spr);
                    if (existingCollection) {
                        existingCollection.delete(spr);
                        if (existingCollection.isEmpty) {
                            collection.delete(existingCollection);
                        }
                    }
                },
            };
            return _API;
        },
    };
    sprites.addEvent("spritetypechange", (sprs, eName, spr) => {
        for(const type of byType.types) {
            const col = byType[type];
            if (col.ids.has(spr.guid)) {
                if (!spr.type[type]) { col.delete(spr) }
            } else if(spr.type[type]) { col.add(spr) }
        }
        for(const type of byType.custom) {
            byType[type].add(spr);
        }
    });
    sprites.addEvent("spriteadded", (sprs, eName, spr) => {
        top.add(spr);
        for(const type of byType.types) {
            if(spr.type[type]) {
                byType[type].add(spr);
            }
        }
        for(const type of byType.custom) {
            byType[type].add(spr);
        }
        if(!current.protected && current.selected) {
            current.add(spr);
        }
    });
    sprites.addEvent("spriteremoved", (sprs, eName, spr) => {

        API.each(col => col.remove(spr))
        for(const type of byType.custom) {
            byType[type].remove(spr);
        }
    });
    const top = API.create([],  undefined, "All sprites", true);
    const byType = {
        types: ["animated", "cutter", "flagged", "functionLink", "grid", "group", "image", "liveCapture", "marker", "pallet", "pattern", "shape", "text", "hidden", "vanish"],
        custom: ["colors"],
        animated: API.create([],  undefined, "Animated", true),
        colors: customCollections.color(API.create([], undefined, "Colors", true)),
        cutter: API.create([],  undefined, "Cutters", true),
        flagged: API.create([],  undefined, "Flagged", true),
        functionLink: API.create([],  undefined, "Funtion links", true),
        grid: API.create([],  undefined, "Grids", true),
        group: API.create([],  undefined, "Groups", true),
        hidden: API.create([],  undefined, "Hidden", true),
        image: API.create([],  undefined, "Images", true),
        liveCapture: API.create([],  undefined, "Live capture", true),
        marker: API.create([],  undefined, "Markers", true),
        pallet: API.create([],  undefined, "Pallets", true),
        pattern: API.create([],  undefined, "Patterns", true),
        shape: API.create([],  undefined, "Shapes", true),
        text: API.create([],  undefined, "Text", true),
    };
    byType.vanish = byType.grid;
    current = top;
    return API;
})();