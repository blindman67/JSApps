var nodes = [], fixEnds, countVal, gravity, gravityVal, dragValue, restart, vNodes = [];
var linkCount = 0, linksCount = 0;
const srcIds = [4_4_4_5_4_0, 4_4_4_5_2_1, 4_4_4_5_2_2]; // Use of underscore is to prevent these numbers from being replaced in compile stage 
const spriteIDS = [444540, 444521, 444522], spriteList = sprites.createIdMapOf(spriteIDS);
function update() {
    if (restart) { setSprites(); if (restart) { return; } }
    if (!API.active) { return }
    var gx, gy;
    if (gravity) {
        if (gravity.deleted) {
            API.values.Gravity = "Off";
            gravityVal = gy = gx = 0;
            gravity = undefined;
            if (API.inputs.length === 2) { API.inputs.length = 1; }
        } else {
            gravityVal = Math.max(0, (gravity.w * gravity.sx) / 60);
            gx = Math.cos(gravity.rx) * gravityVal;
            gy = Math.sin(gravity.rx) * gravityVal;
        }
    } else {
        gravityVal = gy = gx = 0;
        
    }
    const nodeCount = vNodes.length;
    const lastNode = nodeCount - (fixEnds & 1);
    const firstNode = fixEnds & 0b10 ? 1 : 0;
    
    var i = 10, j = 0, n1, n2, dx, dy, nx, ny, dist, len;
    for (const n of vNodes) {
        if (j >= firstNode && j < lastNode) {
            n.dx = (n.spr.x - n.px) * dragValue + gx;
            n.dy = (n.spr.y - n.py) * dragValue + gy;     
            n.px = n.spr.x;
            n.py = n.spr.y;
            n.x += n.dx;
            n.y += n.dy;            
        } else {
            n.dx = n.spr.x - n.px;
            n.dy = n.spr.y - n.py;       
            n.x = n.px = n.spr.x;
            n.y = n.py = n.spr.y;            
        }

        n.len = n.aSpr ? n.aSpr.sx * n.aSpr.w : 0;
        j++;
    }
    while (i--) {
        j = 0;
        n1 = vNodes[j++];
        while (j < vNodes.length) {
            n2 = vNodes[j++];
            dx = n2.x - n1.x;
            dy = n2.y - n1.y;
            dist = (dx * dx + dy * dy) ** 0.5;
            nx = dx / dist;
            ny = dy / dist;
            len = n1.len;
            if (j > 1 + firstNode && j <= lastNode) {
                len *= 0.5;
                dx = (n1.x + n2.x) * 0.5;
                dy = (n1.y + n2.y) * 0.5;
                n1.x = dx - nx * len;
                n1.y = dy - ny * len;
                n2.x = dx + nx * len;
                n2.y = dy + ny * len;                
            } else if (j === 2) {
                n2.x = n1.x + nx * len;
                n2.y = n1.y + ny * len;
            } else {
                n1.x = n2.x - nx * len;
                n1.y = n2.y - ny * len;
            }
            n1 = n2;
        }
    }
    for (const n of vNodes) {
        n.spr.x = n.x;
        n.spr.y = n.y;
        n.spr.key.update();
        API.updateWidget = n.spr.selected || API.updateWidget;
    }
    restart = false;
}
function getSprite(id) { const spr = spriteList.get(id); linksCount ++; if(spr) { linkCount ++; }  return spr; }
function setSprites() {
    linksCount = linkCount = 0;
    const col = collections.getCollectionsContaining(getSprite(spriteIDS[0])).pop();
    if (col === undefined) {  restart = true; return; }
    const oldSel = selection.asArray();
    var i = 1;
    if (nodes.length > 0) {
        const rem = [];
        while (i < nodes.length) {
            rem.push(nodes[i]);
            if (nodes[i].attachers) { rem.push([...nodes[i].attachers][0]); }
            i++;
        }
        sprites.remove(rem);
    }
    vNodes.length = nodes.length = 0;
    reset();
    var node = getSprite(spriteIDS[1]);
    var link = getSprite(spriteIDS[2]);
    
    i = 1;
    var n = node, l = link;
    nodes.push(node);
    while (i < countVal - 1) {
        const nNode = new Sprite(l.x + l.w * 0.5, l.y, n.w, n.h, 'Node');
        const nLink = new Sprite(nNode.x + l.w * 0.5, l.y, l.w, l.h,'Link');
        nLink.locks.scale = nLink.locks.rotate = true;
        nNode.locks.scale = nNode.locks.rotate = true;
        nLink.gridSpecial = 2;
        nNode.gridSpecial = 3;
        editSprites.addCreatedSprites(nNode, nLink);
        nLink.attachSprite(nNode, {x: (l.w + n.w) * 0.5, y: n.h * 0.5});
        n.setLookatSprite(nNode, 0);
        nNode.type.hidden = true;
        nLink.type.hideOutline = true;
        nLink.attachment.rotateType = 'inherit';
        nodes.push(nNode);
        if (col) {
            col.add(nNode);
            col.add(nLink);
        }
        n = nNode;
        l = nLink;
        i++;
    }

    const nNode = new Sprite(l.x + l.w * 0.5, l.y, n.w, n.h, 'Node');
    nNode.locks.scale = nNode.locks.rotate = true;
    nNode.gridSpecial = 3;
    editSprites.addCreatedSprites(nNode);
    nNode.type.hidden = !fixEnds;
    n.setLookatSprite(nNode, 0);
    nodes.push(nNode);
    if (col) { col.add(nNode); }

    for (const n of nodes) {
        if (n.attachers) {
            const aSpr = ([...n.attachers])[0];
            vNodes.push({spr: n, x: n.x, y: n.y, px: n.x, py: n.y, dx: 0, dy: 0, len:  aSpr.sx * aSpr.w, aSpr});
        } else { vNodes.push({spr: n, x: n.x, y: n.y, px: n.x, py: n.y, dx: 0, dy: 0}); }
    }
    API.active = linksCount === linkCount;
    selection.clear();
    selection.add(oldSel.filter(spr => !spr.deleted));
    restart = false;
}
function reset() {
    const gState = API.values.Gravity;
    if (gState === "Sprite" || gState === "Global") {
        gravity = getSprite(444540);
        gravityVal = 0;    
        if (API.inputs.length === 1) { 
            API.inputs.push(["Gravity", gravity.guid]); 
            if (gravity.deleted) {
                sprites.add(gravity);
                gravity.deleted = false;
            }
        }
    } else {
        gravity = undefined;
        gravityVal = 0;    
        if (API.inputs.length === 2) { API.inputs.length = 1; }
    }
 
    fixEnds = API.values.FixEnds === "Both" ? 0b11 : API.values.FixEnds === "End" ? 0b01 : 0b10;
    const oldCount = countVal;
    countVal = API.values.LinkCount;
    if (oldCount != countVal) { restart = true; }
    dragValue = API.values.DragValue > 0 ? API.values.DragValue ** 0.2 : 0 ;

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
    values: {LinkCount: 12, DragValue: 0.92, FixEnds: "Both", Gravity: "Sprite"},
    inputs: [['Start', 444521], ['Gravity',444540]],
    outputs: [],
    optionsMenu: {
        ...opts.optionsMenu,
        values: {
            FixEnds: {UI: "Fix ends%Both?Both ends fixed in place%Start?Only start fixed%End?Only end fixed,", spacers: ",,,", ...opts.vets.selection}, 
            Gravity: {UI: "Gravity%Sprite?Use direction and length of linked sprite%Off?Do not apply gravity%Global?Use global gravity if set,", ...opts.vets.selection}, 
            LinkCount:  {UI: "slider ##NAME## 0 50 1 12 #000,"}, 
            DragValue:  {UI: "slider ##NAME## 0 1 0.001 1 #000,"},

        },
    }
};
system.getExtension(FUNCTION_LINK_OBJECT_EXTENSION).ext.add("GravChain", API);
//setSprites();
return API;