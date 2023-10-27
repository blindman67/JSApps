var HandleLeft, HandleRight, CircleCenter, AngleShape, ArrowLeft, ArrowRight, angleText, angleTextStyle, angTextDist = 30;
const HIDE_ANG_TEXT = 0;
const CENTER_ANG_TEXT = 1;
const NORM_ANG_TEXT = 2;
var linkCount = 0, linksCount = 0;
const srcIds =    [443_385, 443_387, 443_389, 443_391, 443_393, 443_394, 443_381]; 
const spriteIDS = [443385,  443387,  443389,  443391,  443393,  443394,  443381], spriteList = sprites.createIdMapOf(spriteIDS);
const vals = [];
function update() {
    if (!API.active) { return }
    const dx = HandleRight.x - CircleCenter.x;
    const dy = HandleRight.y - CircleCenter.y;
    const ddxy = dx * dx + dy * dy;
    const dlx = HandleLeft.x - CircleCenter.x;
    const dly = HandleLeft.y - CircleCenter.y;    
    const ddlxy = dlx * dlx + dly * dly;
    if (ddxy > 784 && ddlxy > 784) {
        const len = ddxy ** 0.5;    
        const lenl = ddlxy ** 0.5;    
        const toRight = Math.atan2(dy, dx);
        const toLeft = Math.atan2(dly, dlx);
        const nrx = dx / len;
        const nry = dy / len;
        const nlx = dlx / lenl;
        const nly = dly / lenl;
        const lineSize = Math.max(30, lenl);
        const angSize = Math.min(65, len);
        
        AngleShape.shape.valA = ((((ArrowRight.rx - ArrowLeft.rx) - Math.PI ) * 2) / Math.TAU) * 4;
        
        AngleShape.h = AngleShape.w = angSize * 2.0;
        AngleShape.setPosRot (CircleCenter.x, CircleCenter.y, toLeft);
        AngleShape.normalize();

        ArrowLeft.setPosRot (CircleCenter.x + nlx * lineSize * 0.5, CircleCenter.y + nly * lineSize * 0.5, toLeft);
        ArrowRight.setPosRot(CircleCenter.x + nrx * lineSize * 0.5, CircleCenter.y + nry * lineSize * 0.5, toRight)                
        ArrowRight.w = ArrowLeft.w = lineSize;
        CircleCenter.setPosRot(AngleShape.x, AngleShape.y, 0);
        
        
        CircleCenter.normalize();
        ArrowLeft.normalize();
        ArrowRight.normalize();
        
        
        
        if (angleText && angleTextStyle !== HIDE_ANG_TEXT) {
            if (angleText.selected) {
                const dx = (angleText.x - AngleShape.x);
                const dy = (angleText.y - AngleShape.y);        
                const ddxy = dx * dx + dy * dy;
                if (ddxy > 65) {
                    const len = ddxy ** 0.5;                    
                    angTextDist = len;
                }               
            }
                
                
            const angle = ((ArrowRight.rx - ArrowLeft.rx) * (180 / Math.PI)).toFixed(0) + "°";
            const hA = (ArrowRight.rx + ArrowLeft.rx) * 0.5;
            const x = AngleShape.x + Math.cos(hA) * angTextDist;
            const y = AngleShape.y + Math.sin(hA) * angTextDist;

            if (angleTextStyle === CENTER_ANG_TEXT) {
                angleText.setPosRot(x, y, hA  + (x < 0 ? Math.PI : 0.0));
            } else if (angleTextStyle === NORM_ANG_TEXT) {
                angleText.setPosRot(x, y, 0);
            }
            
            angleText.textInfo.change(angle);
            angleText.key.update();
         
        }
        API.updateWidget = ArrowLeft.selected || ArrowRight.selected  || AngleShape.selected || (angleText ? angleText.selected : false);
    }
}

function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    CircleCenter  = getSprite(0);
    AngleShape    = getSprite(1);
    ArrowLeft   = getSprite(2);
    ArrowRight  = getSprite(3);
    HandleLeft     = getSprite(4);
    HandleRight    = getSprite(5);
    angleText        = getSprite(6);
    API.active = linksCount === linkCount;
    reset();
}
function reset() {

    AngleShape.shape.inner = ArrowRight.shape.inner = ArrowLeft.shape.inner = API.values.lineWidth * 4;
    angleTextStyle = API.values.angleText === "Normal" ? NORM_ANG_TEXT : API.values.angleText === "None" ? HIDE_ANG_TEXT : CENTER_ANG_TEXT;
    angleText.type.hidden = angleTextStyle === HIDE_ANG_TEXT;
    const endStyle = API.values.endStyle;
    if (endStyle === "Circles") {
         AngleShape.shape.sides = 1;
    } else {
        if (endStyle === "Arrows") { AngleShape.shape.sides = 4 }
        else if (endStyle === "LeftArrow") { AngleShape.shape.sides = 2 }
        else if (endStyle === "RightArrow") { AngleShape.shape.sides = 3 }
        else if (endStyle === "None") { AngleShape.shape.sides = 1 }
    } 
    const arrowStyles = API.values.lineStyle;
    if (arrowStyles === "Arrows") { ArrowLeft.shape.sides = ArrowRight.shape.sides = 3; }
    else if (arrowStyles === "Buts") { ArrowLeft.shape.sides = ArrowRight.shape.sides = 1; }
    else if (arrowStyles === "LeftArrow") { ArrowLeft.shape.sides = 3; ArrowRight.shape.sides = 1; }
    else { ArrowLeft.shape.sides = 1; ArrowRight.shape.sides = 3; }

    
    
}



var opts = functionLinkBuilder.functionObjs;
const API = { 
    reset, spriteIDS, spriteList, setSprites, srcIds, update,
    ...opts.APICommon,    
    values: {endStyle: "Arrows", lineWidth: 2, angleText: "TooCenter", lineStyle: "Arrows"},
    inputs: [["Start", spriteIDS[0]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            lineWidth: {UI: "slider ##NAME## 0.25 40 0.25 2 #000,"},
            endStyle: {UI: "End style%Circles%None%Arrows%LeftArrow%RightArrow,", spacers: "", ...opts.vets.selection },   
            angleText: {UI: "Angle text%None%TooCenter%Normal,", spacers: "", ...opts.vets.selection },   
            lineStyle: {UI: "Line style%Arrows%LeftArrow%RightArrow%Buts,", spacers: "", ...opts.vets.selection },   
        },
    },
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("AngleGizmo", API);
return API;