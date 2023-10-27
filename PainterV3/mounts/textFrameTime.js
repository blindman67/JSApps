var options;
const NAME = "FrameTime";
function dialog() {
    commandLine({args : [], name: ""+NAME+"Dialog",
        batch :`##mountDialogBatch ${UID}
$res = ""
#start
info Help for frame time mount
log [FF] or [ff] for frame
log [F] or [f] for frame without leading zero
log [SS] or [S] for seconds
log [ss] or [s] for sub second
log [M] for minutes
log Example 'Time:[M]:[SS]:[FF]' displays 'Time:2:04:59'  


`});
}    
args = args.join(" ");
if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") { return  }
else if(args[0] === "Dialog" || args[0] === "dialog") { dialog() } 
else { return mount() }


function mount(){
    const mount = {
        help(){},
        dialog,
        type: "text",
        get UID() { return UID },
        set format(val) {options.format = val; update() },
        get format() {return options.format},
        dismount(itemUID) {
            if(itemUID) {
                var item = items.find(i => i.guid === itemUID);
                if(item) {
                    removeSprite(item);
                    for(let i = 0; i < items.length; i ++) {
                        if(items[i] === undefined) {
                            items.splice(i--,1);
                        }
                    }
                    if(items.length !== 0) { return }
                } else {
                    return;
                }
            }
            for(const item of items) { 
                removeSprite(item);
            }
            items = undefined;
            dismount(UID, true);
            animation.removeEvent("change", update);
            return "closed";          
        }
    }
    function getText(spr, type, text) {
        if (type === "gettext") { text.text = options.format }
        else {
            options.format = text.text;
            text.text = getTimeStr();
        }
    }
    function getTimeStr() {
        var time = ""+(animation.time % 60);
        var seconds = ""+(animation.time / 60 | 0) % 60;
        var subSec = ((animation.time / 60) % 1).toFixed(2).substring(2);
        var min = ""+(animation.time / (60 * 60) | 0);
        time = options.format.replace(/\[FF\]/gi, time.padStart(2,"0"));
        time = time.replace(/\[F\]/gi, time);
        time = time.replace(/\[ss\]/g, subSec);
        time = time.replace(/\[SS\]/g, seconds.padStart(2, "0"));
        time = time.replace(/\[S\]/g, seconds);
        return time.replace(/\[M\]/gi, min);
    }
    function update() { 
        for(const text of items) {
            text.textInfo.change(getTimeStr()) ;
        }
    }    
    
    function addSprite(spr, opts = options) {
        items.push(spr);
        spr.addEvent("gettext", getText, UID);
        spr.addEvent("settext", getText, UID);
        mounted.add(spr.guid,UID);
    }
    function removeSprite(spr) {
        const idx = items.indexOf(spr);
        if (idx > -1) {
            spr.removeEvent("settext", getText);
            spr.removeEvent("settext", getText);
            mounted.removeMountFromItem(spr.guid,UID);
            items[idx] = undefined;
        }
    }
    function copiedItem(spr, type, data) {
        addSprite(data.copy, data.copy.shapeRender);
    };
    var items = [];
    if(selection.length > 0) {
        const loaned = [];
        selection.each(spr => { if(spr.type.text) { loaned.push(spr) } });
        if (loaned.length > 0) {  
            mounted.addMount(mount);
            for(const item of loaned) {  addSprite(item)  }
            
            options = {format : loaned[0].textInfo.text};           
            if(options.format === "") {
                options.format = "Time: [M]:[SS]:[FF]";
            }
            mount.format = options.format;
            animation.addEvent("change", update, UID);         
            log.info("Help for frame time mount");
            log("[FF] or [ff] for frame");
            log("[F] or [f] for frame without leading zero");
            log("[SS] or [S] for seconds");
            log("[ss] or [s] for sub second");
            log("[M] for minutes");
            log("Example 'Time:[M]:[SS]:[FF]' displays 'Time:2:04:59'");
            return mount;
        } else {
            log.warn("This function can only mount text sprites");
            return
        }
    }
    log.warn("Mount requiers 1 selected sprites");    
};