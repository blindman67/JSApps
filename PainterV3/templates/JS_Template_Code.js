var ;
var linkCount = 0, linksCount = 0, restart;
const spriteIDS = [451516, 451518, 451517, 451515, 451519, 451520], spriteList = sprites.createIdMapOf(spriteIDS);
const vals = [];
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }

    n.spr.key.update();
    API.updateWidget = n.spr.selected || API.updateWidget;

    restart = false;
}
function getSprite(id) { const spr = spriteList.get(id); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    reset();
    topBone = getSprite(spriteIDS[0]);
    bottomBone = getSprite(spriteIDS[1]);
    join = getSprite(spriteIDS[2]);
    IK_Start = getSprite(spriteIDS[3]);
    IK_Arm = getSprite(spriteIDS[4]);
    IK_End = getSprite(spriteIDS[5]);
    
    API.active = linksCount === linkCount;
    restart = false;
}
function reset() {

}
const API = { updateWidget:false, active: false, reset, spriteIDS, spriteList,
    inputs: [],
    outputs: [],
    bind(spr, id) { if(spriteList.has(id)) { spriteList.set(id,spr); setSprites(); } }, getById(id) { return spriteList.get(id) }, update,
};
setSprites();
return API;