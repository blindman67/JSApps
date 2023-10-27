var bendMin, bendMax, topBone, topLen = -1, bottomBone, botLen = -1, join, IK_Start, IK_End;
var bendMin, bendMax, topBone, topLen = -1, bottomBone, botLen = -1, join, IK_Start, IK_End;
var linkCount = 0, linksCount = 0, restart;
const srcIds = [451_515, 451_516, 451_517, 451_518, 451_519];  // Use of underscore is to prevent these numbers from being replaced in compile stage 
const spriteIDS = [451515, 451516, 451517, 451518, 451519], spriteList = sprites.createIdMapOf(spriteIDS);
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }
    if (topBone.selected || topLen === -1) {
        topLen = topBone.w * topBone.sx;
        topBone.attachment.x = (IK_Start.w * IK_Start.sx + topLen) * 0.5; 
        topBone.attachment.y = IK_Start.h * IK_Start.sy * 0.5;
        topBone.attachment.position();
        API.updateWidget = true;
    }
    if (bottomBone.selected || botLen === -1) {
        botLen = bottomBone.w * bottomBone.sx;
        bottomBone.attachment.x = (join.w * join.sx + botLen) * 0.5; 
        bottomBone.attachment.y = join.h * join.sy * 0.5;
        bottomBone.attachment.position(); 
        API.updateWidget = true;
    }
    IKSolver.solveTripple(IK_Start, join, IK_End, topLen, botLen, bendMin, bendMax);
    topBone.key.update();
    join.key.update();
    bottomBone.key.update();
    IK_End.key.update();
    API.updateWidget = join.selected || IK_Start.selected ||  IK_End.selected || API.updateWidget;
    restart = false;
}
function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    reset();
    botLen = topLen = -1;
    IK_Start    = getSprite(0);
    topBone     = getSprite(1);
    join        = getSprite(2);
    bottomBone  = getSprite(3);
    IK_End      = getSprite(4);
    API.active = linksCount === linkCount;
    restart = false;
}
function reset() {
    const bendLeft = API.values.bendLeft === "Left";
    bendMin = Math.max(0, Math.min(2, API.values.bendMin)) * Math.PI90 * (bendLeft ? 1 : -1);
    bendMax = Math.max(0, Math.min(2, API.values.bendMax)) * Math.PI90 * (bendLeft ? 1 : -1);
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
    values: {bendLeft: "Left", bendMin: 0.2, bendMax: 1.8},
    inputs: [["IK_Start", spriteIDS[0]], ["IK_End", spriteIDS[4]]],
    outputs: [["IK_End", spriteIDS[4]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            bendLeft: {UI: "Bend direction%Left%Right,", spacers: ",,,", ...opts.vets.selection }, 
            bendMin:  {UI: "slider ##NAME## 0 2 0.01 1 #000,"}, 
            bendMax:  {UI: "slider ##NAME## 0 2 0.01 1 #000,"}, 
        },
    },
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("IK_Arm", API);
return API;