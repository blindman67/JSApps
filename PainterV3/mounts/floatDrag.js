return (()=>{
    function deleted(item) {
        if(drags["uid" + item.guid]){
            delete drags["uid" + item.guid];
            count --;
        }

        if(count ===  0){
            dismount(UID,true);
            return "closed";
        }
    }
    var items = selection.loanOfType(UID, deleted,"sprite",true,"Requiers at least 1 spritesto be selected",1)
    if(items === undefined){ return false  }
    var drags = {};
    var count = 0;
    for(const item of items) {
        item.addEvent("onBeforeUpdate",onUpdate,UID);
        drags["uid"+item.guid] = {x:0,y:0};
        count ++;
    }

    function onUpdate(spr) {
        const d = drags["uid"+spr.guid];
        d.x += (spr.x - spr.key.x) * 0.5;
        d.y += (spr.y - spr.key.y) * 0.5;
        d.x *= 0.5;
        d.y *= 0.5;
        spr.x = spr.key.x + d.x;
        spr.y = spr.key.y + d.y;


    };
    var frameCount;
    function onRender(spr,type,data) {

    };

    return {dismount: deleted};
})();