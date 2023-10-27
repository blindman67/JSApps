"use strict";
const spriteText = (()=>{
    const text = new Map();
    function SpriteText(text) {
        this.init(text);
    }
    SpriteText.prototype = {
        serial(){
            const text = {
                font: this.font === settings.textSpriteFont ? undefined : this.font,
                size: this.size === settings.textSpriteFontSize ? undefined : this.size,
                text: this.text,
                id: this.id,
                local: this.local ? true : undefined,
            };
            if (this.strokeStyle) {
                text.strokeStyle = this.strokeStyle;
                text.lineWidth = this.linewidth !== 1 ? this.lineWidth : undefined;
            }
            return text;
        },
        deserial(text) {
            this.old_id = text.id;
            this.font = text.font ?? this.font;
            this.size = text.size ?? this.size;
            this.strokeStyle = text.strokeStyle ?? this.strokeStyle;
            this.lineWidth = text.lineWidth ?? this.linewidth;
            this.text = text.text;
            this.local = text.local === true;
        },
        init(text) {
            this.owners = new Set();
            this.textEvent = {text : ""};
            this.content = { text: "" };
            this.font = settings.textSpriteFont;
            this.size = settings.textSpriteFontSize;
            this.fontStr = this.size + "px " + this.font;
            this.strokeStyle = null;
            this.lineWidth = 1;
            this.local = true;
            this.dirty = true;
            this.prevText = undefined;
            this.text = text;
            this.id = getGUID();

        },
        addOwner(owner) { this.owners.add(owner) },
        removeOwner(owner) {
            this.owners.delete(owner);
            if (this.owners.size === 0) {
                text.delete(this.id);
            }

        },
        get text() { return this.content.text },
        set text(val) { this.change(val) },
        set textData(data) {
            this.textEvent.text = data;
            for (const owner of this.owners.values()) { owner.fireEvent("settext",this.textEvent) }
            this.content.text  = this.textEvent.text ;
        },
        get textData() {
            this.textEvent.text = this.content.text ;
            for (const owner of this.owners.values()) { owner.fireEvent("gettext",this.textEvent) }
            return this.textEvent.text ;
        },
        setFont(name, size = this.size) {  /* ONLY USE FOR LOCAL */
            this.font = name;
            this.size = size;
            const fontEvent = {font: name, size};
            this.dirty = true;
            this.local = true;
            this.update(view.context);
            for (const owner of this.owners.values()) { owner.fireEvent("setfont", fontEvent) }
        },
        change(text) {
            if (this.content.text !== text) {
                this.content.text = "" + text;
                this.prevText = "" + text;
                this.update();
            }
        },
        update(ctx = view.context){
            ctx.font = this.fontStr = this.size + "px " + this.font;
            this.width = ctx.measureText(this.content.text).width;
            for (const owner of this.owners.values()) {
                owner.w = this.width;
                owner.cx = this.width * 0.5;
                owner.h = this.size * 1.2;
                owner.cy = this.size * 1.2 * 0.5;
                owner.key.update();
            }
            this.prevText = this.content.text;
            this.dirty = false;
        },
        setState(ctx, owner){
            if(this.prevText !== this.content.text) { this.update() }
            ctx.font = this.fontStr;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            if(this.strokeStyle !== null){
                ctx.strokeStyle = this.strokeStyle;
                ctx.lineWidth = this.lineWidth;
            }
            ctx.fillStyle = owner.rgb.css;
        },
    }
    const API = {
        create(textContent) {
            const st = new SpriteText(textContent);
            text.set(st.id, st);
            return st;
        },
        copy(sprText) {
            const st = new SpriteText(sprText.text);
            text.set(st.id, st);
            st.font         = sprText.font;
            st.size         = sprText.size;
            st.fontStr      = sprText.fontStr;
            st.strokeStyle  = sprText.strokeStyle;
            st.lineWidth    = sprText.lineWidth;
            st.local        = sprText.local;
            st.dirty        = sprText.dirty;
            st.prevText     = sprText.prevText;
            return st;
        },
        getByOldId(oldId) {
            for (const t of text.values()) {
                if (t.old_id === oldId) { return t }
            }
        },
        removeImportGUID() {
            for (const t of text.values()) {
                delete t.old_id;
            }
        },
        deserialize(textArray) {
            textArray && textArray.forEach(t => API.create(t.text).deserial(t));
        },
        serialize(selectedOnly = false) {
            const s = [];
            if (selectedOnly) {
                for (const t of text.values()) { 
                    let save = false;
                    sprites.eachOfType(spr => {
                        if (spr.textInfo === t && spr.selected) { return save = true; }                        
                    }, "text");
                    if (save) {
                        s.push(t.serial())
                    }
                }
            } else {
                for (const t of text.values()) { s.push(t.serial()) }
            }
            return s;
        },
        update() {
            text.update();
        },
        setFont(name, size = this.size) {
            text.setFont(name, size);
        },    
    };



    return API;
})();