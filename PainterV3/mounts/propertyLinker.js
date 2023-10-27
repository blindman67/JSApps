var options;
const NAME = "PropertyLinker";
const help = () => { 
    log.info("Help for Property Linker function.");
    
    [
        "Links the properties of a sprite to another.",
    ].forEach(t => log(t))
    log.info("End of help.");
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

$showLinks = $m.showLinks

$title = "Property linker"
$options = $options + "$showLinksUI,Show links ,"
$options = $options + "Selected as source,"
$options = $options + "Selected as destination,"

#menu // Directive ##mountDialogBatch macro "#menu" must be included. Requiers variables $title and $options

 
 
if $opt === "selected as destination" {
    $m.dialogMessage = "Selected as destination"
}
if $opt === "selected as source" {
    $m.dialogMessage = "Selected as source"
}    
#toggleOption showLinks



#endMenu // Directive ##mountDialogBatch macro "#endMenu" must be included. menu loop ends here
// menu update variable
    $showLinksUI = $showLinks === true ? "On" : "Off"
   
    
    $m.showLinks = $showLinks

    // Directive ##mountDialogBatch macro "#setMenu" optional 
    #setMenu $showLinksUI
`});
}    
args = args.join(" ");
if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") { help()  }
else if(args[0] === "Dialog" || args[0] === "dialog") {} 
else { return mount() }
function mount(){
    const options = {
        showLinks: false,
    };
    var dialogMessage = "";
    const mount = {
        help,
        dialog,
        type: "modify",
        get UID() { return UID },
        get showLinks() { return options.showLinks },
        set showLinks(value) { 
            if(value !== options.showLinks) {
            }
        },
        get dialogMessage() {
        set dialogMessage(value) {
            if(value === "Selected as source") {
                addSelected("src");
            } else if(value === "Selected as destination") {
                addSelected("dest");
            }
            
        }
        
        
        dismount(item) {
            selection.removeEvent("change",selectionChanged);
            src.clear();
            dest.clear();
            for(const spr of srcItems) { spr.removeEvent("change",srcChanged) }
            srcItems.length = 0;
            destItems.length = 0;
            
            dismount(UID,true);
            return "closed";               
        }
    }
    function addSelected(type) {
        var count = 0;
        if(type === "src") {
            selection.each(spr => {
                if(!src.has(spr)) {
                    src.add(spr);
                    srcItems.push(spr);
                    spr.addEvent("change",srcChanged,UID);
                    count ++;
                }
            }
            if(count > 0){  log.info("Added " + count+ " source sprites.") }
            else {log.info("Did not add source sprites.") }
            
        }else  if(type === "dest") {
            selection.each(spr => {
                if(!dest.has(spr)) {
                    dest.add(spr);
                    destItems.push(spr);
                    count ++;
                }
            }
            if(count > 0){  log.info("Added " + count+ " destination sprites.") }
            else {log.info("Did not add destination sprites.") }            
        }
    }
    function srcChanged() {
        
    }
    function selectionChanged() {
        
        
    }
    var src = new Set();
    var dest = new Set();
    var srcItems = [];
    var destItems = [];
    mounted.addListOfItems(srcItems, UID);
    selection.addEvent("change",selectionChanged,UID);
    return mount;
};