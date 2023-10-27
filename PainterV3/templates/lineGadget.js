var line, lineStart, lineEnd, cirStart, cirEnd, updateAll;
var linkCount = 0, linksCount = 0, restart;
const srcIds = [55_20, 55_22, 55_21, 481_582, 481_584]; 
const spriteIDS = [5520, 5522, 5521, 481582, 481584], spriteList = sprites.createIdMapOf(spriteIDS);
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }
    
    const dx = (lineEnd.x - lineStart.x) * 0.5;
    const dy = (lineEnd.y - lineStart.y) * 0.5;
    const len = Math.hypot(dx, dy)  * 2;
    const dir = Math.atan2(dy, dx);
    
    cirStart.setPos(lineStart.x, lineStart.y);   
    cirEnd.setPos(lineEnd.x, lineEnd.y);   
    
    line.w = len;
    line.setPosRot(lineStart.x + dx, lineStart.y + dy, dir);    
    line.normalize();
 

    API.updateWidget =  line.selected || lineStart.selected || lineEnd.selected  || cirStart.selected || cirEnd.selected || API.updateWidget;        
    updateAll = false;
    restart = false;
}
function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    lineStart  = getSprite(0);
    line       = getSprite(1);
    lineEnd    = getSprite(2);
    cirStart   = getSprite(3);
    cirEnd     = getSprite(4);
    reset();
    API.active = linksCount === linkCount;
    restart = false;
}
function reset() {
    line.shape.inner = API.values.lineWidth * 4;
    const endStyle = API.values.endStyle;
    if (endStyle === "Circles") {
        cirEnd.type.hidden = cirStart.type.hidden = false;
        line.shape.sides = 1;
    } else {
        cirStart.type.hidden = true;
        cirEnd.type.hidden = true;
        if (endStyle === "Arrows") { line.shape.sides = 4 }
        else if (endStyle === "LeftArrow") { line.shape.sides = 2 }
        else if (endStyle === "RightArrow") { line.shape.sides = 3 }
        else if (endStyle === "None") { line.shape.sides = 1 }
    }
    updateAll = true;
}
var opts = functionLinkBuilder.functionObjs;
const API = { 
    reset, spriteIDS, spriteList, setSprites, srcIds, update,
    ...opts.APICommon,    
    values: {lineWidth: 4, endStyle: "Arrows"},
    inputs: [["Line", spriteIDS[0]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            endStyle: {UI: "End style%Circles%None%Arrows%LeftArrow%RightArrow,", spacers: ",,,", ...opts.vets.selection },
            lineWidth: {UI: "slider ##NAME## 0.25 40 0.25 4 #000,"}
        },
    },
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("LineGadget", API);
return API;