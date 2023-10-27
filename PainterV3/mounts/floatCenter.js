var options;
const NAME = "Interpalator";
function help() {
    log("Floats sprites between two sprites.");
    log("Requiers 3 selected sprites of any type.");
    log("[showLine] shows line connecting end sprites");
    log("[lineColor: color] If there is a line this is its color, Default blue");
    log("[lineWidth: width] If there is a line this is its width");
    log("Example"),
    log("mount "+NAME+" showLine, lineColor:red, lineWidth:2"),
    log("Enter `run "+NAME+"` in the command prompt.");
}
function dialog() {
    commandLine({
        args : [],
        name: ""+NAME+"Dialog",
        batch :`##mountDialogBatch ${UID}// this directive sets up macros and lead in code for dialog
#toggleOption if $opt === "%0UI" {;$%0 = !$%0;}
// Macros must be defined befor any batch code
$res = ""  // this line ends macro defining and is needed
#start // Directive ##mountDialogBatch macro "#start" must be included

$showLine = $m.showLine
$lineColor = $m.lineColor
$lineWidth = $m.lineWidth
$position = $m.position
$rotation = $m.rotation
$scale = $m.scale
$alpha = $m.alpha

$title = "Float center options"
$options = "$lineWidth,slider Width 1 5 1 1 #000,$showLineUI,Show ,$lineColor,Color ,"
$options = $options + "$positionUI,Interpolate position ,"
$options = $options + "$rotationUI,Interpolate rotation ,"
$options = $options + "$scaleUI,Interpolate  scale ,"
$options = $options + "$alphaUI,Interpolate alpha ,"
#menu // Directive ##mountDialogBatch macro "#menu" must be included. Requiers variables $title and $options

if $opt === "lineColor" {
    $lineColor = colours.mainColor.css
}    
#toggleOption showLine
#toggleOption position
#toggleOption rotation
#toggleOption scale
#toggleOption alpha


#endMenu // Directive ##mountDialogBatch macro "#endMenu" must be included. menu loop ends here
// menu update variable
    $showLineUI = $showLine === true ? "On" : "Off"
    $positionUI = $position === true ? "On" : "Off
    $rotationUI = $rotation === true ? "On" : "Off
    $scaleUI = $scale === true ? "On" : "Off
    $alphaUI = $alpha === true ? "On" : "Off    
    
    $m.showLine = $showLine
    $m.lineColor = $lineColor
    $m.lineWidth = $lineWidth
    $m.position = $position
    $m.rotation = $rotation
    $m.scale = $scale
    $m.alpha = $alpha
    // Directive ##mountDialogBatch macro "#setMenu" optional 
    #setMenu $lineWidth $lineColor $showLineUI $positionUI $rotationUI $scaleUI $alphaUI 
`});
}    
if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") { help() }
else if(args[0] === "Dialog" || args[0] === "dialog") { dialog() } 
else { return mount() }
function mount(){
    options = {
        showLine : args.includes("showLine"),
        lineColor : args.includes("lineColor") ? args.split("lineColor:")[1].trim().split(",")[0].trim() : "blue",
        lineWidth : args.includes("lineWidth") ? args.split("lineWidth:")[1].trim().split(",")[0].trim() : 2,
        position : args.includes("position"),
        rotation : args.includes("rotation"),
        scale : args.includes("scale"),
        alpha : args.includes("alpha"),
    };
        
    const mount = {
        help,
        dialog,
        get UID() { return UID },
        type : "position",
        set showLine(value) {
            if(value !== options.showLine) {
                if (value) { A.addEvent("onrender",onRender, UID) }
                else { A.removeEvent("onrender",onRender) }
                options.showLine = value;
            }
        },
        set lineColor(value) { options.lineColor = value },
        set lineWidth(value) { options.lineWidth = value },
        set position(value) { options.position = value },
        set rotation(value) { options.rotation = value },
        set alpha(value) { options.alpha = value },
        set scale(value) { options.scale = value },
        get position() { return options.position },
        get rotation() { return options.rotation },
        get scale() { return options.scale },
        get alpha() { return options.alpha },
        get showLine() { return options.showLine },
        get lineColor() { return options.lineColor },
        get lineWidth() { return options.lineWidth },
        dismount(item) {
            if (item === A || item === B || item === "dismount") {
                A.removeEvent("onrender", onRender);
                A.removeEvent("onUpdate", onUpdate);
                B.removeEvent("onUpdate", onUpdate);
                A = B = undefined;
                dismount(UID, true);
                log.info("Dismounted "+NAME+"");
                return "closed";
            } else if(item === "selected") {
                if(loans.hasLoan(UID)) {
                    for(const i of items) {
                        if(i.selected) {
                            log("dismount "+i.guid)
                            loans.removeItem(UID, i.guid);
                            
                        }
                    }
                }else {
                    log.warn("Could not find loan for item of function "+NAME+" " + UID);
                    
                }
                
            } else {
                log.info("Removed item from function "+NAME+" " +UID);
                mounted.removeMountFromItem(item.guid, UID);
                onUpdate();
                return "itemRemoved";
            }
        }
    }

    var items = selection.loanOfType(UID, mount.dismount, "sprite",true,""+NAME+" Requiers 3 or more sprites", 3)
    if(items === undefined){ return false  }
    mounted.addListOfItems(items, UID);
    items.sort((a,b) => a.x - b.x);
    var A = items[0], B = items[items.length - 1];
    options.showLine && (A.addEvent("onrender", onRender, UID));
    A.addEvent("onUpdate", onUpdate, UID);
    B.addEvent("onUpdate", onUpdate, UID);
    function onUpdate() {
        var len = items.length - 1
        const dx = (B.x - A.x) / len;
        const dy = (B.y - A.y) / len;
        const dsx = (B.sx - A.sx) / len;
        const dsy = (B.sy - A.sy) / len;
        const drx = (B.rx - A.rx) / len;
        const dry = (B.ry - A.ry) / len;
        const da = (B.a - A.a) / len;
        var i = 0;
        for(const spr of items) {
            if(i>0 && i< len){
                if(options.position) {
                    spr.x = A.x + dx * i;
                    spr.y = A.y + dy * i;
                }
                if(options.scale) {
                    spr.sx = A.sx + dsx * i;
                    spr.sy = A.sy + dsy * i;
                }
                if(options.rotation) {
                    spr.rx = A.rx + drx * i;
                    spr.ry = A.ry + dry * i;
                }
                if(options.alpha) {
                    spr.a = A.a + da * i;
                }
                spr.key.update();
            }
            i++;
        }
    };
    function onRender(spr, type, data) {
        var c = data.c;
        c.globalAlpha = spr.a;
        c.strokeStyle = mount.lineColor;
        c.lineWidth = mount.lineWidth ;
        c.beginPath();
        for(const spr of items) {
            c.lineTo(spr.key.x, spr.key.y);
        }
        //c.lineTo(B.key.x, B.key.y);
        c.setTransform(1,0,0,1,0,0);
        c.stroke();
    };
    onUpdate();
    return mount;
};