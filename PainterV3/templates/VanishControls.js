var vanish, far, near, centLine, showLines = false, colorGrid = false;
const srcIds = [26_220, 26_221, 26_222, 26_223]; 
const spriteIDS = [26220, 26221, 26222, 26223];
const spriteList = sprites.createIdMapOf(spriteIDS);
const vals = [];
function setColors(force = false) {
    var ccs = vanish.rgb.css;
    if (vanish.grid.type === "X") { ccs = "#ff0000" }
    else if (vanish.grid.type === "Y") { ccs = "#00ff00" }
    else if (vanish.grid.type === "Z") { ccs = "#0088ff" }
    if (force || css !== vanish.rgb.css) {
        vanish.rgb.parseCSS(ccs); 
        near.rgb.fromRGB(vanish.rgb); 
        far.rgb.fromRGB(vanish.rgb); 
        centLine.rgb.fromRGB(vanish.rgb);
    }
}
function update() {
    if (!API.active) { return }
    const vx1 = far.x - near.x;
    const vy1 = far.y - near.y;
    const vx2 = centLine.x - vanish.x;
    const vy2 = centLine.y - vanish.y;
    const c = Math.vecCross2d(vx1, vy1, vx2, vy2);
    const cc = Math.vecCross2d(vx1, vy1, near.x - vanish.x, near.y - vanish.y) / (c ? c : 1);
    vanish.setScale(vanish.sx, ((Math.tan(Math.acosc(Math.uVecDot2d(vx1, vy1, vx2, vy2))) * ((vanish.type.normalisable ? vanish.w : vanish.w * vanish.sx)) * 0.5) * 2) / vanish.h);
    vanish.setPosRot(vanish.x + cc * vx2, vanish.y + cc * vy2, Math.atan2(vy2, vx2));
    vanish.normalize();
    if (vanish.grid && colorGrid && vanish.selected) { setColors() }
    if (showLines) {
        const ctx = view.context;
        view.apply();
        
        ctx.strokeStyle = vanish.rgb.css;
        ctx.lineWidth = view.invScale;
        ctx.globalAlpha = vanish.a;
        ctx.beginPath();
        const dx = far.x - vanish.x;
        const dy = far.y - vanish.y;
        ctx.lineTo(vanish.x, vanish.y);
        ctx.lineTo(vanish.x + dx * 10, vanish.y + dy * 10);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
    vanish.key.update();
    API.updateWidget = vanish.selected;
}

var linkCount = 0;
var linksCount = 0;
function getSprite(id) {
    const spr = spriteList.get(id);
    linksCount ++;
    spr && (linkCount ++);
    return spr;
}
function getSprite(idx) { const spr = spriteList.get(spriteIDS[idx]); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0
    vanish = getSprite(0);
    centLine = getSprite(1);
    near = getSprite(2);
    far = getSprite(3);
    API.active = linksCount === linkCount;
    reset();
}
function reset() { 
    showLines = API.values.showLines === "Show";
    colorGrid = API.values.showControls === "On";
    const showControls = API.values.showControls === "Show";
    centLine.type.hidden = !showControls;
    near.type.hidden = !showControls;
    far.type.hidden = !showControls;
    if (showControls) {
        vanish.gridY = API.values.lineCount * 2;
    }
    setColors(true);
}
var opts = functionLinkBuilder.functionObjs;
const API = { 
    reset, spriteIDS, spriteList, setSprites, srcIds, update,
    ...opts.APICommon,    
    values: {showLines: "Show", showControls: "Show", colorGrid: "On", lineCount: 4},
    inputs: [["Grid", spriteIDS[0]]],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            showLines: {UI: "Show Lines%Show%Hide,", ...opts.vets.selection },
            showControls: {UI: "Show Controls?Must be show for line count to be used%Show%Hide,", ...opts.vets.selection },
            colorGrid: {UI: "Color Grid%On%Off,", ...opts.vets.selection },
            lineCount: {UI: "slider ##NAME## 1.0 16 1 4 #000,"},
        },
    },
};
opts = undefined;
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("VanishControl", API);
return API;