var bone, IK_Start, IK_End;
var linkCount = 0, linksCount = 0, restart;
const srcIds = [451_515, 451_516, 451_519];  // Use of underscore is to prevent these numbers from being replaced in compile stage 
const spriteIDS = [451515, 451516, 451519], spriteList = sprites.createIdMapOf(spriteIDS);
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }

    var w = bone.w;
    var h = bone.h;
    const x = IK_Start.x;
    const y = IK_Start.y;
    const dx = IK_End.x - x;
    const dy = IK_End.y - y;
    const ang = Math.atan2(dy, dx);
    const dist2 = dx * dx + dy * dy;
    if (dist2 > 64) {
        const dist = dist2 ** 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        IK_Start.setPosRot(x, y, ang);
        bone.setPosRot(x + nx * w * 0.5, y + ny * w * 0.5, ang);
        IK_End.setPosRot(x + nx * w, y + ny * w, IK_End.rx);
    }
    
    IK_Start.key.update();
    IK_End.key.update();
    bone.key.update();
    API.updateWidget = bone.selected || IK_Start.selected ||  IK_End.selected || API.updateWidget;
    restart = false;
}
function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    reset();
    IK_Start    = getSprite(0);
    bone        = getSprite(1);
    IK_End      = getSprite(2);
    API.active = linksCount === linkCount;
    restart = false;
}
function reset() {
}
var opts = functionLinkBuilder.functionObjs;
const API = { 
    reset, 
    spriteIDS, 
    spriteList,
    setSprites,
    srcIds,
    update,
    ...opts.APICommon,    
    values: {},
    inputs: [["IK_Start", spriteIDS[0]], ["IK_End", spriteIDS[2]]],
    outputs: [["IK_End", spriteIDS[2]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: { },
    },
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("IK_Arm_NJ", API);
return API;