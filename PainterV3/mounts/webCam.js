
log("WebCam function loaded");

args =args.join(",")
if(args.includes("busyId")){
    busy.end(Number(args.split("busyId:")[1].trim().split(",")[0].trim()))
}
var options;
const NAME = "MediaConstrain";
function help() {

};
function dialog() {
    commandLine({
        args : [],
        name: ""+NAME+"Dialog",
        batch :`##mountDialogBatch ${UID}
#toggleOption if $opt === "%0UI" {;$%0 = !$%0;}
// Macros must be defined befor any batch code
$res = ""  // this line ends macro defining and is needed
#start 
debug on

${dialog.init.join("\n")}


$title = "Float center options"
$options = ""
${dialog.options.join("\n")}
$options = $options + "1280 by 800,"
$options = $options + "640 by 480,"
$options = $options + "640 by 480,"
$options = $options + "320 by 240,"
$options = $options + "160 by 120,"
$options = $options + "80 by 60,"
$options = $options + "40 by 30,"
$options = $options + "20 by 15,"
$options = $options + ",Stop and close,,"
$options = $options + "Apply settings"

#menu 

if $opt === "Stop and close" {
    $m.stop = true  
}
if $opt === "Apply settings" {
    $m.apply = true
    log Aplly    
}
$res = $opt.includes(" by ")
if $res === true {
    $width = Number($opt.split(" ")[0].trim())
    $height = Number($opt.split(" ")[2].trim())
    $m.width = $width 
    $m.height = $height 
    $m.apply = true
}
${dialog.process.join("\n")}

#endMenu
// menu update variable
   
    ${dialog.update.join("\n")}

    #setMenuLong
        ${dialog.menu.join("\n")}
    #setMenuLongEnd
    
event onmountmessage {
    ${dialog.init.join("\n")}
    ${dialog.menu.join("\n")}
    log dialog message
}    
`});
}    
if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") { help() }
else if(args[0] === "Dialog" || args[0] === "dialog") { dialog() } 
else { return mount() }
function mount(){
    const webCam = media.byName("WebCam");
    if (webCam.desc.status !== "OK") {
        log.info("Can not mount webcam functions. WebCam is Off");
        return;
    }
    const videoTracks = [...webCam.srcObject.getVideoTracks()];
    if(videoTracks.length === 0) {
        webCam.desc.status = "Missing video track";
        log.info("Can not mount webcam functions. Missing access to video track");
        return;
    }

    mounted.addListOfItems([webCam], UID);
    const supports = Object.keys(webCam.desc.supports);
    const currentSettings = videoTracks[0].getSettings();
    var caps;
    if(videoTracks[0].getCapabilities === undefined) {
        caps = {};
        caps.frameRate = {min : 0, max : 30}
        caps.width = {min : 0, max : currentSettings.width}
        caps.height = {min : 0, max : currentSettings.height}
    }else {
        caps = videoTracks[0].getCapabilities();     
    }
    dialog.init = [];
    dialog.update = [];
    dialog.process = [];
    dialog.options = [];
    dialog.menu = [];
    options = {};
    const mount = {
        help,
        dialog,
        get UID() { return UID },
        type : "media",
        set dialogOpen(val) {
            if(val === true) {
                spriteList.update();
                mounted.messageMount(UID);
            }
        },
        set stop(val) {
            if (val === true && webCam.desc.status !== "Stopped") {
                videoTracks[0].stop();
                webCam.desc.status = "Stopped";
                mount.dismount();
            }
        },
        set apply(val){
            if (val === true) {
                const newSet = {
                    frameRate : options.frameRate,
                    width : options.width,
                    height : options.height,
                    
                };
                videoTracks[0].applyConstraints(newSet).then(()=> {
                   const res = videoTracks[0].getSettings();
                    options.width = webCam.w = webCam.width = res.width;
                    options.height = webCam.h = webCam.height = res.height;
                    options.frameRate = webCam.desc.frameRate =  res.frameRate;
                    
                   
                    sprites.eachOfType(spr => {
                            if (spr.image.guid === webCam.guid) { spr.imageResized() }
                        },
                        "image"
                    );
                    widget.update();
                    spriteList.update();
                    mounted.messageMount(UID);
                }).catch(()=> {log.warn("Error applying settings")});              
            }
        },

        dismount(item) {
            mount.stop = true;
            dismount(UID, true);
            return "closed";
        },
    }    
    function rangeOption(name) { settings.defineOption(name,"range",{min : caps[name].min, max : caps[name].max, step :1, val: currentSettings[name]}) };
    function rangeOptionSmall(name) { settings.defineOption(name,"range",{min : caps[name].min, max : caps[name].max, step :0.01, val: currentSettings[name]}) };
    const settings = {
        defineOption(name, type, desc) {
            var setter;
            dialog.init.push("$"+name+" = $m."+name);
            if(type === "boolean") {
                dialog.update.push("$"+name+"UI = $"+name + " ? \"On\" : \"Off\"");
                dialog.options.push("$options = $options + \"$"+name+"Ui, "+name+",\"");
                setter = function(v) { options[name] = v };
            }else if(type === "range") {
                dialog.options.push(`$options = $options + "\$${name},slider ${name[0].toUpperCase() + name.substring(1)} ${desc.min} ${desc.max} ${desc.step} ${desc.val} #000 ,"`);
                setter = function(v) { (v = v < desc.min ? desc.min : v > desc.max ? desc.max : v) !== options[name] && (options[name] = v) };
            }
            
            dialog.update.push("$m."+name+" = $"+name);
            dialog.menu.push("menuUpdate $"+name);
            options[name] = desc.val;
            Object.defineProperty(mount, name, {get() { return options[name] }, set : setter });
        },
        width : rangeOption,
        height :  rangeOption,
        frameRate : rangeOption,
    }
    
    for(const support of supports) {
        if(settings[support] && currentSettings[support]) { settings[support](support) }
    }
    
    setTimeout(()=>spriteList.update(),100);
    return mount;
};