var bendMin, bendMax, bendMinB, bendMaxB, midBone, topBone, botBone,maxLen,maxF, minE, maxE, maxD, lenA, lenB, lenC, lenD, lenE, lenF, joinA, joinB, IK_Start, IK_End;
var linkCount = 0, linksCount = 0, restart;
const srcIds = [451_515, 451_516, 300_101, 300_100, 451_517, 451_518, 451_519]; // Use of underscore is to prevent these numbers from being replaced in compile stage 
const spriteIDS = [451515, 451516, 300101, 300100, 451517, 451518, 451519], spriteList = sprites.createIdMapOf(spriteIDS), PI90 = Math.PI90;;

var starting = true;
var dx, dy, dd2, d;
const DIST = (sprA, sprB) => {
    dx = sprB.x - sprA.x;
    dy = sprB.y - sprA.y;
    dd2 = dx * dx + dy * dy;
    return dd2 > 1 ? d = dd2 ** 0.5 : d = 0.0001;
}
const ANG = Math.triAngle;
const ANG_LEN = Math.triLength;
const MAX_BASE_LEN = (maxA, maxB, a, b, c) => { return (a*a + b*b + c*c - 2*b*c*Math.cos(maxB) - 2*a *((b*b + c*c - 2*b*c*Math.cos(maxB)) ** 0.5)* Math.cos(maxA)) ** 0.5; }
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }
    var updateW = false;

    if (starting || topBone.selected ||  midBone.selected || botBone.selected) {
        lenA = topBone.w * topBone.sx;
        lenB = midBone.w * midBone.sx;
        lenC = botBone.w * botBone.sx;
        
        topBone.attachment.x = (IK_Start.w * IK_Start.sx + lenA) * 0.5; 
        topBone.attachment.y = IK_Start.h * IK_Start.sy * 0.5;
        topBone.attachment.position();

        midBone.attachment.x = (joinA.w * joinA.sx + lenB) * 0.5; 
        midBone.attachment.y = joinA.h * joinA.sy * 0.5;
        midBone.attachment.position(); 

        botBone.attachment.x = (joinB.w * joinB.sx + lenC) * 0.5; 
        botBone.attachment.y = joinB.h * joinB.sy * 0.5;
        botBone.attachment.position(); 

        maxLen = lenA + lenB + lenC;
        maxE = lenA + lenB;
        minE = Math.abs(lenA-lenB);
        maxF = lenB + lenC;
        
        maxD = MAX_BASE_LEN(bendMax, bendMax, lenA, lenB, lenC);
        updateW = true;
        starting = false;
    }
    
    
    lenD = DIST(IK_Start, IK_End);
    
    var nx = dx / lenD;
    var ny = dy / lenD;
    var mx = -ny;
    var my = nx;
    
    lenD = Math.min(lenD, maxLen, maxD);
    var dirD = Math.atan2(ny, nx);
    
    IK_End.x = IK_Start.x + nx * lenD;
    IK_End.y = IK_Start.y + ny * lenD;
    IK_End.key.update();        
    

    const minBendE = Math.max(minE, ANG_LEN(bendMin, lenA, lenB));
    const maxBendE = Math.min(ANG_LEN(bendMax, lenA, lenB), maxE);

    lenE = Math.max(minBendE, Math.min(DIST(IK_Start, joinB), maxBendE));
    

    const minBendF = ANG_LEN(bendMin, lenB, lenC);
    const maxBendF = Math.min(ANG_LEN(bendMax, lenB, lenC), maxF);
    
    lenF = Math.max(minBendF, Math.min(DIST(joinA, IK_End), maxBendF));
    
    
    var angF = ANG(lenA, lenE, lenB) + ANG(lenE, lenD, lenC);        
    var angE = ANG(lenC, lenD, lenE);
    
    var lenG = Math.sin(angF) * lenA;
    var lenI = Math.cos(angF) * lenA;
    var lenH = Math.sin(angE) * lenC;
    var lenJ = Math.cos(angE) * lenC;        
    
    joinA.x = IK_Start.x + nx * lenI - mx * lenG;
    joinA.y = IK_Start.y + ny * lenI - my * lenG;
    
    joinB.x = IK_Start.x + nx * (lenD-lenJ) - mx * lenH ;
    joinB.y = IK_Start.y + ny * (lenD-lenJ) - my * lenH ;        
    

    const dirAB = Math.atan2(joinB.y - joinA.y, joinB.x - joinA.x);
    
    IK_Start.rx = dirD - angF;
    IK_Start.ry = IK_Start.rx + Math.PI * 0.5;

    joinB.rx = (dirD + Math.PI) + angE - Math.PI;
    joinB.ry = joinB.rx + Math.PI * 0.5;

    joinA.rx = dirAB;
    joinA.ry = joinA.rx + Math.PI * 0.5;
    
    IK_Start.key.update()        
    topBone.key.update();
    joinA.key.update();
    midBone.key.update();
    joinB.key.update();
    botBone.key.update();
    IK_End.key.update();
    API.updateWidget = updateW ||  joinA.selected ||  joinB.selected || IK_Start.selected ||  IK_End.selected;

    restart = false;
}
function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    reset();
    IK_Start = getSprite(0);
    topBone  = getSprite(1);
    joinA    = getSprite(2);
    midBone  = getSprite(3);
    joinB    = getSprite(4);
    botBone  = getSprite(5);
    IK_End   = getSprite(6);
    API.active = linksCount === linkCount;
    restart = false;
}
function reset() {
    const bendLeft = API.values.bendLeft === "Left";
    bendMin = API.values.bendMin * PI90 * (bendLeft ? 1 : -1);
    bendMax = API.values.bendMax * PI90 * (bendLeft ? 1 : -1);
    const bendLeftB = API.values.bendLeftB === "Left";
    bendMinB = API.values.bendMinB * PI90 * (bendLeftB ? 1 : -1);
    bendMaxB = API.values.bendMaxB * PI90 * (bendLeftB ? 1 : -1);
    starting = true;
}
var opts = functionLinkBuilder.functionObjs;
const API = { 
    reset, spriteIDS, srcIds, spriteList, setSprites, update,
    ...opts.APICommon,
    values: {bendLeft: "Left",bendMin: 0.2, bendMax: 1.8, bendLeftB: "Left", bendMinB: 0.2, bendMaxB: 1.8},
    inputs: [["IK_Start", spriteIDS[0]], ["IK_End", spriteIDS[6]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            bendLeft:  {UI: "Bend direction%Left%Right,", spacers: ",,,", ...opts.vets.selection }, 
            bendMin:   {UI: "slider ##NAME## 0 2 0.01 1 #000,"}, 
            bendMax:   {UI: "slider ##NAME## 0 2 0.01 1 #000,"},
            bendLeftB: {UI: "Bend direction B%Left%Right,", ...opts.vets.selection }, 
            bendMinB:  {UI: "slider ##NAME## 0 2 0.01 1 #000,"},
            bendMaxB:  {UI: "slider ##NAME## 0 2 0.01 1 #000,"}
        },
    }
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("IK_Arm_4j", API);
return API;