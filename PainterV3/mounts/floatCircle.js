return (()=>{
    function deleted(item) {
        if(item === A || item === B) {
            A.type.hideOutline = oldOutline;
            log("FloatCircle deleting");
            A = B = undefined;
            dismount(UID,true);
            return "closed";
        }
    }
    var items = selection.loanOfType(UID, deleted,["cutter","sprite"],true,"Requiers at least 2 spritesto be selected",2)
    if(items === undefined){ return false  }

    var A = items[0], B = items[1];
    var oldOutline = A.type.hideOutline;
    A.type.hideOutline = true;
    
    A.addEvent("onUpdate",onUpdate,UID);
    A.addEvent("onrender",onRender,UID);
    B.addEvent("onUpdate",onUpdate,UID);
    function onUpdate(spr) {
        var dif = B.ry - B.rx;
        var dx = (B.x - A.x);
        var dy = (B.y - A.y);
        var dir = Math.atan2(dy,dx);
        var dist = Math.max(A.w, A.h) / 2;
        dist += B.cx* B.sx;
        B.x = A.x + Math.cos(dir) * dist;
        B.y = A.y + Math.sin(dir) * dist;
        B.ry = (B.rx = dir) + dif;

        if(spr === A){
            B.key.update();
        } else {
            B.key.quickUpdate();
        }

    };
    var frameCount;
    function onRender(spr,type,data) {
        if(data.frameCount !== frameCount) {
            var c = data.c;
            c.globalAlpha = spr.a;
            c.strokeStyle = "blue";
            c.lineWidth = 2 ;
            const m = data.m;
            c.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
            const mat = spr.key.m;
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.beginPath();
            var dist = Math.max(A.w, A.h) / 2;
            c.arc(0,0,dist,0,Math.PI * 2);
            c.moveTo(0,0);
            var dx = (B.x - A.x);
            var dy = (B.y - A.y);
            var dir = Math.atan2(dy,dx)-A.rx;            
            c.lineTo(Math.cos(dir) * dist * 1.1, Math.sin(dir) * dist * 1.1)
            c.setTransform(1,0,0,1,0,0);
            c.stroke();
        }
        frameCount = data.frameCount;
    };
    onUpdate();
    return {dismount: deleted};
})();