return (()=>{
    function deleted(item) {
        if(item === A) {
            A.removeEvent("onUpdate",onUpdate);
            dismount(UID,true);
            return "closed";
        }
    }
    var items = selection.loanOfType(UID, deleted,"image",true,"Select at least one drawable",1,1)
    if(items === undefined){ return false  }

    var A = items.shift();
    A.addEvent("onUpdate",onUpdate);
    var lastFrameCount;
     var element = log.sysForceLine("Starting")
     var min, max;
    function onUpdate() {
        if(frameCount !== lastFrameCount) {
            lastFrameCount = frameCount;
            var value = localProcessImage.calcImageValueMetric(A.image);
            if(min === undefined) {
                min = value;
                max = value;
            }else{
                min = value < min ? value : min;
                max = value > max ? value : max;
            }
                
            element = log.update(element,value.toFixed(2) + " min: " + min.toFixed(2) + " max: " + max.toFixed(2));
        }
    };
    onUpdate();
    return {dismount: deleted};
})();