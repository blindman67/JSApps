"use strict";
const groups = (()=>{
    function Group(owner) {
        this.guid = getGUID();
        this.owner = owner;
        this.sprites = [];
        this.ids = new Set();
        this.matrix = [1,0,0,1,0,0];
        this.animated = false;
        this.isOpen = false;
        Object.assign(this, Events(this));
    }
    Group.prototype = {
        serial(){
            return {
                type: "group",
                id: this.guid,
                children: this.sprites.map(spr => spr.guid),
            };
        },
        set open(state) { this.isOpen = state === true },
        get open() { return this.isOpen === true },
        all(cb, gSpr) {
            var i = 0;
            for(const spr of this.sprites) {
                cb(spr, gSpr, i++);
                if(spr.type.group) { spr.group.all(cb, spr) }
            }
        },
        hasSprite(spr) { return this.ids.has(spr.guid) },
        each(cb) {
            var i = 0;
            for(const spr of this.sprites) { cb(spr, i++) }
        },
        hasAnimated() {
            for(const spr of this.sprites) { if(spr.type.animated || spr.type.animate) { return this.animated = true } }
            return this.animated = false;
        },
        eachAnimated(cb) {
            var i = 0;
            for(const spr of this.sprites) {
                if (spr.type.animated || spr.type.animate) { cb(spr,i) }
                i++;
            }
        },
        addSprites(sprites) {
            sprites.forEach(spr => this.add(spr));
        },
        add(spr) {
            if(this.ids.has(spr.guid)) {
                this.remove(spr, true);
            } else {
                if(this.owner.type.openGroup) {
                    const shadow = spr.copy(true, true, true);
                    const owner = this.owner;
                    shadow.shadowOf(owner.shadowedBy ? owner.shadowedBy : owner, spr, true);
                    sprites.add(shadow);
                    owner.groupShadow.push(shadow);
                    spr.key.matchShadow(shadow);
                    spr.type.inGroup = true;
                    spr.type.normalisable = false;
                    this.sprites.push(spr);
                    this.ids.add(spr.guid);
                    this.fireEvent("onadded", spr);
                    return shadow;
                } else {
                    spr.type.inGroup = true;
                    spr.type.normalisable = false;
                    this.sprites.push(spr);
                    this.ids.add(spr.guid);
                    this.fireEvent("onadded", spr);
                }
            }
            return spr;
        },
        remove(spr, safe = false) {
            if(safe || this.ids.has(spr.guid)) {
                spr.type.inGroup = false;  // Warning this may not be true. Sprites.cleanup() will fix
                const idx = this.sprites.indexOf(spr);
                this.sprites.splice(idx,1);
                this.ids.delete(spr.guid);
                this.owner.reboundGroup();
                this.fireEvent("onremoved", spr);
            }
        }
    };
    function Grouper(grp, owner) {
        this.owners = new Set();
        this.owners.add(owner);
        this.group = grp;
    }
    Grouper.prototype = {
        add(owner) { this.owners.add(owner) },
        remove(owner) {
            this.owners.delete(owner)
        },
    }
    function reboundGroups(group) {
        if(!processed.has(group)) {
            group.each(spr => {
                if(spr.type.group && !processed.has(group.guid) && spr.type.openGroup) {
                    reboundGroups(spr.group)
                }
            });
            group.owner.reboundGroup();
            processed.add(group);
            reprocess[reprocessCount++] = group;
        }
    }
    const processed = new Set();
    const reprocess = [];
    var reprocessCount = 0, deleting = false;
    const groups = new Map();
    const API = {
        serialize() {
            const groupArr = [];
            for(const grper of groups.values()) {
                groupArr.push(grper.group.serial());
            }
            return groupArr;
        },
        serial() {
            const spriteArr = [];
            for(const grper of groups.values()) {
                grper.group.each(spr => spriteArr.push(spr.serial()));
            }
            return spriteArr;
        },
        createGroup(owner) {
            const grp = new Group(owner);
            groups.set(grp.guid, new Grouper(grp, owner));
            return grp;
        },
        each(cb) {
            for (const grp of groups.values()) {
                cb(grp);
            }

        },
        set deleting(val) {
            deleting = val;
            if(!deleting) { API.clean() }
        },
        get deleting() { return deleting },
        removeOwner(owner) {
            if(deleting) {
                for(const grper of groups.values()) {
                    grper.remove(owner);
                    if (grper.owners.size === 0) {
                        groups.delete(grper.group.guid);
                        grper.group.each(spr => {
                            if(spr.type.group) { API.removeOwner( spr) }
                        });
                    }
                }
            }
        },
        clean() {
            for(const grper of groups.values()) {
                let keep = false;
                if(grper.group.sprites.length === 0) {
                    groups.delete(grper.group.guid);
                }
            }
        },
        ungroup(spr) {
            if(spr.type.group) {
                const grper = groups.get(spr.group.guid);
                if(grper) {
                    const sprs = [];
                    spr.group.each(s => {
                        const copyOf = s.copy(true, true, true);
                        copyOf.transform(spr.key.m, spr.a, s.key.m);
                        sprs.push(copyOf);
                    });
                    API.deleting = true;
                    API.removeOwner(spr);
                    API.deleting = false;
                    return sprs;
                }
            }
            return [];
        },
        addOwner(grp, owner) {
            const grper = groups.get(grp.guid);
            if(grper) { grper.add(owner) }
        },
        eachOwnerOf(cb, grp) {
            var index = 0;
            const grper = groups.get(grp.guid);
            if (grper){
                for(const owner of grper.owners.values()) {
                    if(cb(owner, index) === true) { return index }
                    index ++;
                }
            }
        },
        closeAll() {
            for(const grper of groups.values()) {
                if(grper.group.isOpen) {
                    grper.group.owner.closeGroup();
                }
            }
        },
        reboundGroups() {
            processed.clear();
            reprocessCount = 0;
            if (groups.size > 0) {
                for(const grper of groups.values()) {
                    reboundGroups(grper.group);
                }
                while(reprocessCount--) {
                    reprocess[reprocessCount].owner.updateGroupShadows();
                    reprocess[reprocessCount] = undefined;
                }
            }
        },
    }
    return API;
})();