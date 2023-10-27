var line, cirStart, handleStart, handleEnd, cirEnd, labelLineLeft, labelLineRight, rightEdge, leftEdge, label, labelType, labelDist = 20, labelWidth, updateAll, lineWidth = 1;
var linkCount = 0, linksCount = 0, restart;
const srcIds = [481_580, 55_20, 55_21, 481_582, 481_584, 481_585, 481_587, 481_589, 481_591, 481_592]; 
const spriteIDS = [481580, 5520, 5521, 481582, 481584, 481585, 481587, 481589, 481591, 481592], spriteList = sprites.createIdMapOf(spriteIDS);
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }
    var sx = handleStart.x;
    var sy = handleStart.y;
    var ex = handleEnd.x;
    var ey = handleEnd.y;
    if (label.selected || updateAll) {
        var lx = label.x;
        var ly = label.y;        
        labelDist = distPointFromLineseg(sx, sy, ex, ey, lx, ly);
        labelWidth  = label.w * label.sx + 8;
        updateAll = true;
    }
    if (handleEnd.selected || handleEnd.selected || updateAll) {
        updateAll = true;
    }
    if (update) {
        var dx = ex - sx;    
        var dy = ey - sy;
        var len = Math.max(64, dx * dx + dy * dy) ** 0.5;
        var dir = Math.atan2(dy, dx);
        var nx = dx / len;
        var ny = dy / len;
        var cx = sx + dx * 0.5;
        var cy = sy + dy * 0.5;
        
        line.w = len;
        line.sx = 1;
        line.setPosRot(cx, cy, dir);
        label.setPosRot(cx - ny * labelDist, cy + nx * labelDist, dir + (labelType === "KeepUp" && nx < 0 ? Math.PI : 0));
        leftEdge.w = rightEdge.w = labelDist + 8;

        rightEdge.setPosRot(ex - ny * (labelDist * 0.5 + 4), ey + nx * (labelDist * 0.5 + 4), dir + Math.PI90);
        leftEdge.setPosRot(sx - ny * (labelDist * 0.5 + 4), sy + nx * (labelDist * 0.5 + 4), dir + Math.PI90);

        llw = labelLineRight.w = labelLineLeft.w = (len - labelWidth) * 0.5;
        labelLineLeft.setPosRot( sx - ny * labelDist + nx * llw * 0.5, sy + nx * labelDist + ny * llw * 0.5, dir);
        labelLineRight.setPosRot(ex - ny * labelDist - nx * llw * 0.5, ey + nx * labelDist - ny * llw * 0.5, dir);
        
        line.normalize();   

        
        
        cirStart.setPos(sx, sy);
        cirEnd.setPos(ex, ey);
        
        labelLineLeft.normalize();
        labelLineRight.normalize();
        rightEdge.normalize();
        leftEdge.normalize();
        label.key.update();        
        API.updateWidget =  line.selected || handleEnd.selected || handleEnd.selected || labelLineLeft.selected || labelLineRight.selected || rightEdge.selected || leftEdge.selected || label.selected || API.updateWidget;        
    }
    updateAll = false;
    restart = false;
}
function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    line           = getSprite(0);
    handleStart    = getSprite(1);
    handleEnd      = getSprite(2);
    cirStart      = getSprite(3);
    cirEnd        = getSprite(4);
    labelLineLeft  = getSprite(5);
    labelLineRight = getSprite(6);
    rightEdge      = getSprite(7);
    leftEdge       = getSprite(8);
    label          = getSprite(9);
    reset();
    labelWidth     = label.w * label.sx;
    API.active = linksCount === linkCount;
    restart = false;
}
function reset() {
    labelType = API.values.labelType;
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
        else if (endStyle === "CircleArrow") { line.shape.sides = 3; cirStart.type.hidden = false; }
        else if (endStyle === "ArrowCircle") { line.shape.sides = 2; cirEnd.type.hidden = false;}
        else if (endStyle === "None") { line.shape.sides = 1 }
    }    
    if (API.values.labelArms === "On") {
        rightEdge.type.hidden = false;
        leftEdge.type.hidden = false;
        labelLineLeft.type.hidden = false;
        labelLineRight.type.hidden = false;
    } else {
        rightEdge.type.hidden = true;
        leftEdge.type.hidden = true;
        labelLineLeft.type.hidden = true;
        labelLineRight.type.hidden = true;
    }
    
    updateAll = true;
}
var opts = functionLinkBuilder.functionObjs;
const API = { 
    reset, spriteIDS, spriteList, setSprites, srcIds, update,
    ...opts.APICommon,    
    values: {labelType: "Normal", labelArms: "On", endStyle: "Circles", lineWidth: 4},
    inputs: [["Start", spriteIDS[0]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            labelType: {UI: "Label type%Normal%KeepUp,", spacers: "", ...opts.vets.selection },
            labelArms: {UI: "Label arms%On%Off,", spacers: "", ...opts.vets.selection },
            endStyle: {UI: "End style%Circles%None%Arrows%LeftArrow%RightArrow%CircleArrow%ArrowCircle,", spacers: "", ...opts.vets.selection },
            lineWidth: {UI: "slider ##NAME## 0.25 40 0.25 4 #000,"}
        },
    },
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("LabelLine", API);
return API;