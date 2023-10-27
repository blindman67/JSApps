
var marker, ballIn, gravityIn;
const grounds = [];
const balls = [];
var gravity = utils.point;
const spriteIDS = [339304, 339301, 339303];
const spriteList = sprites.createIdMapOf(spriteIDS);
const p = utils.point;
const p1 = utils.point;
const p2 = utils.point;
const off = utils.point;
var u;
function lineIntercept(x1,y1,x2,y2){
    const v1x = x2 - x1; 
    const v1y = y2 - y1;
    const c = v1x * p2.y - v1y * p2.x; 
    if (c !== 0) {   
        u = (p2.x * (y1 - p1.y) - p2.y * (x1 - p1.x)) / c; 
        if (u >= -3 && u <= 1) {
            p.x = x1 + v1x * u;
            p.y = y1 + v1y * u;
            return true
        }
        p.x = x2;
        p.y = y2;            
        return false
    }
    u = 2;
    p.x = x2;
    p.y = y2; 
    return false;
    
};

function update() {
    var dx,dy,closest,hx,hy,oy,ox;
    if (!API.active) { return }
    const g = (gravityIn.h * gravityIn.sy) / (60 * 60);
    gravity.x = Math.cos(gravityIn.ry) * g;
    gravity.y = Math.sin(gravityIn.ry) * g;
    var cc = 0;
    for (const ball of balls) {
        ball.r = Math.min(ball.spr.w * ball.spr.sx, ball.spr.h * ball.spr.sy) / 2;
        ball.dx += gravity.x;
        ball.dy += gravity.y;
        var speed = (ball.dx * ball.dx + ball.dy * ball.dy) ** 0.5;
        var nx = ball.dx / speed;
        var ny = ball.dy / speed;
        var testingIntercepts = true;
        while(testingIntercepts && cc++ < 120) { // very fast balls can bounce so many times that it this function will block all code so cc is to stop excesive bounces,
            testingIntercepts = false;
            closest = 2;
            for (const ground of grounds) {
                p1.x = ground.x;
                p1.y = ground.y;
                off.y = -(p2.x = Math.cos(ground.rx));
                off.x = p2.y = Math.sin(ground.rx);     
                const canHit = p2.x * ny - p2.y * nx;
                if(canHit >= 0) {
                    
                    ball.rx = ball.r * off.x;
                    ball.ry = ball.r * off.y;    
                    if( lineIntercept(ball.spr.x - ball.rx , ball.spr.y - ball.ry, ball.spr.x - ball.rx + ball.dx, ball.spr.y - ball.ry + ball.dy)) {
                        if (u < closest) {
                            closest = u;
                            const dd = (nx * off.x + ny * off.y) * 2;
                            dx = -(off.x * dd - nx) * speed;                            
                            dy = -(off.y * dd - ny) * speed;
                            hx = p.x;
                            hy = p.y;
                            ox = ball.rx;
                            oy = ball.ry;
                            
                        }
                    }
                }
            }
            if(closest < 2) {

                ball.spr.x = hx + ox - dx * closest;
                ball.spr.y = hy + oy - dy * closest;
                if(closest < 0) {
                    dx *= 1 -closest;
                    dy *= 1 -closest;
                }
                    
                speed = (dx * dx + dy * dy) ** 0.5;
                nx = dx / speed;
                ny = dy / speed;                
                ball.dx = dx;
                ball.dy = dy;                
                testingIntercepts = true;
            }
        }
        ball.spr.x += ball.dx;
        ball.spr.y += ball.dy;

    }
        
    sprites.mustUpdate = true;
}

var linkCount = 0;
var linksCount = 0;
function getSprite(id) {
    const spr = spriteList.get(id);
    linksCount ++;
    if(spr) { linkCount ++ }
    return spr;
}
function setSprites() {
    linksCount = linkCount = 0
    marker = getSprite(339304);
    ballIn = getSprite(339301);
    gravityIn = getSprite(339303);
    API.active = linksCount === linkCount;
    reset();
}
function removeSprite(spr) {
    var idx = balls.findIndex(b => b.spr.guid === spr.guid);
    if(idx > -1) { balls.splice(idx,1); log("removed ball")}    
    idx = grounds.findIndex(g => g.guid === spr.guid);
    if(idx > -1) { grounds.splice(idx,1); log("removed ground") }    
}
function reset() {

    if (!API.active) { return }
    if (balls.length > 0) {
        for (const ball of balls) {
            if(sprites.functionLinksOn) {
                ball.spr.x = ball.x;
                ball.spr.y = ball.y;
                log("start pos reset");
            } else {
                ball.x = ball.spr.x;
                ball.y = ball.spr.y;
                log("start pos captured");
            }
                
            ball.dx = 0;
            ball.dy = 0;
        }
    }
    sprites.each(spr => {
        if (spr.name.startsWith(marker.name)) { 
            if(!grounds.find(g => g.guid === spr.guid)) {
                grounds.push(spr);
                spr.addEvent("ondeleting",removeSprite);
            }
       }
        if (spr.name.startsWith(ballIn.name)) { 
            if(!balls.find(b => b.spr.guid === spr.guid)) {
                spr.addEvent("ondeleting",removeSprite);
                balls.push({spr, dx: 0, dy: 0, x: spr.x, y: spr.y}) 
            }
        }
    })
}

const API = {
    updateWidget:false,
    active: false,
    reset,
    spriteIDS,
    spriteList,
    inputs: [['Marker',339304],['Ball',339301],["Gravity",339303]],
    outputs: [],
    bind(spr, id) {
        if(spriteList.has(id)) {
            spriteList.set(id,spr);
            setSprites();
        }
    },
    getById(id) { return spriteList.get(id) },
    update,
};
setSprites();

return API;