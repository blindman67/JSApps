var options;
const NAME = "SpriteInfo";
const help = () => { 
    log.info("Help for Sprite info function.");
    
    [
        "Set text sprite text as normal, include the",
        "following in the text body to have them replace",
        "with the sprites acociated property.",
        "[x] [y] x,y position",
        "[w] [h] width and height",
        "[r] [R] rotation [r] radians and [R] deg",
        "[a] Sprite alpha",
        "[o] [mx] [my] mouse over and mouse x y position on sprite",
        "[A] Sprite pixel area",
        "[a] Sprite alpha",
        "[z] Sprite Z Index",
        "[n] Sprite name",
        "[in] Sprite Image name",
        "Attachments only if present else blank",
        "[Ax] [Ay] attached position",        
    ].forEach(t => log(t))
    log.info("End of help.");
 };
 const dialog = help;

args = args.join(" ");
if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") { help()  }
else if(args[0] === "Dialog" || args[0] === "dialog") { help() } 
else { return mount() }
function mount(){
    var needMouse = false;
    var textIdx = 1;
    var textItem;
    var fromItem;   
    
    
    const mount = {
        help,
        dialog : undefined,
        type: "text",
        get UID() { return UID },
        set format(val) {
            checkEventsRequiered();
            options.format = val; 
            update();
        },
        get format() {return options.format},
        dismount(item) {
            fromItem.removeEvent("onUpdate", update);
            sprites.removeEvent("mouseupdate", update);
            textItem.removeEvent("settext", getText);
            textItem.removeEvent("gettext", getText);
            textItem = fromItem = undefined;
            dismount(UID,true);
            return "closed";               
        }
    }

    function checkEventsRequiered() {
        if(/\[(o|mx|my)\]/g.test(options.format)){
            if(!needMouse){
                sprites.addEvent("mouseupdate",update,UID);
                needMouse = true;
            }
        }else{
            if(needMouse){
                sprites.removeEvent("mouseupdate",update);
                needMouse = false;
            }
        }
    }

    const formater = {
        "[x]"() { return fromItem.x.toFixed(1) },
        "[y]"() { return fromItem.y.toFixed(1) },
        "[w]"() { return (fromItem.w * fromItem.sx).toFixed(1) },
        "[h]"() { return (fromItem.h * fromItem.sy).toFixed(1) },
        "[r]"() { return fromItem.rx.toFixed(2) },
        "[R]"() { return (fromItem.rx * (180/Math.PI)).toFixed(1) },
        "[o]"() { return fromItem.key.over ? "Over" : "Out"  },
        "[mx]"() { return fromItem.key.lx.toFixed(0)  },
        "[my]"() { return fromItem.key.ly.toFixed(0) },
        "[A]"() { return (fromItem.w*fromItem.h).toFixed(0) },
        "[a]"() { return fromItem.a.toFixed(3) },
        "[z]"() { return "" + fromItem.index },
        "[n]"() { return fromItem.name  },
        "[in]"() { return fromItem.type.image ? fromItem.image.desc.name : ""  },
        "[Ax]"() { return fromItem.type.attached ? fromItem.attachment.x.toFixed(1) : "" },
        "[Ay]"() { return fromItem.type.attached ? fromItem.attachment.y.toFixed(1) : "" },
    }
    const reg = /\[(x|y|w|h|r|R|o|mx|my|A|z|n|in|Ax|Ay)\]/g;
    function getFormatedText() { return options.format.replace(reg, str => formater[str]()) }
    function update() { textItem.textInfo.change(getFormatedText()) }    
    function getText(spr, type, text) {
        if (type === "gettext") { text.text = options.format }
        else {
            options.format = text.text;
            text.text = getFormatedText();
        }
    }

    selection.each(spr => { if(spr.type.text) { textItem = spr; return true} });
    selection.each(spr => { if(!spr.type.text) { fromItem = spr; return true} });
    if(!fromItem) {
        log.warn("No sprite selected to display properties of.");
        return;
    }
    if(!textItem) {
        log.warn("No text sprites selected.");
        return;
        
    }
    mounted.addListOfItems([fromItem, textItem], UID);
    options = {format : textItem.textInfo.text};           
    fromItem.addEvent("onUpdate", update, UID);
    textItem.addEvent("gettext", getText, UID);
    textItem.addEvent("settext", getText, UID);
    mount.format = options.format;

    return mount;

};