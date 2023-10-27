
var gravityIn, render, particle, emiter, rateLife;
var rate = 0, life = 1;
var emiters = [];
var particleSprites = [];
var particles = [];
var pCount = 0;
var mustReset = false;
var ctx, ctxM, m = [1,0,0,1,0,0], sm = [1,0,0,1,0,0];

var gravity = utils.point;
const spriteIDS = [348723, 348724, 348730, 348736, 251289];
const spriteList = sprites.createIdMapOf(spriteIDS);
function update() {
    var dx,dy,closest,hx,hy,oy,ox;
    if (mustReset) { setSprites() }
    if (!API.active) { return }
    const options = rateLife.textInfo.text.toLowerCase();
    const rl = options.split(",");
    rate = Number(rl[0].trim());
    life = Number(rl[1].trim());
    const follow = options.includes("follow")
    rate = isNaN(rate) ? 0.1 : rate;
    life = isNaN(life) ?  10 : life;
    const g = (gravityIn.h * gravityIn.sy) / (30 * 30);
    gravity.x = Math.cos(gravityIn.ry) * g;
    gravity.y = Math.sin(gravityIn.ry) * g;
    var e1x = emiters[0].x;
    var e1y = emiters[0].y;
    var e1Sp = (emiters[0].h * emiters[0].sy) / 15;
    var e1r = emiters[0].ry - Math.PI;
    var e2x = emiters[1].x;
    var e2y = emiters[1].y;
    var e2Sp = (emiters[1].h * emiters[1].sy) / 15;
    var e2r = emiters[1].ry - Math.PI;

    var i = 0, tail = 0;
    while(i < pCount) {
        const p = particles[i];
        p.life -= 1;
        if(p.life <= 0) {
            p.spr = undefined;
            i++;

        } else {
            p.dx += gravity.x;
            p.dy += gravity.y;
            p.x += p.dx;
            p.y += p.dy;
            p.follow = follow ? Math.atan2(p.dy, p.dx) : undefined;
            particles[i] = particles[tail];
            particles[tail] = p;
            i++;
            tail++;
        }
    }
    var newP;
    pCount = tail;
    var rat = rate | 0;
    rat += Math.random() < (rate % 1) ? 1 : 0;
    while(rat-- > 0) {
        if(particles.length > pCount) {
            newP = particles[pCount++];
        } else {
            particles.push(newP = {x:0,y:0,dx:0,dy:0, life: 0, part: null});
            pCount ++;
        }
        const pos = Math.random();

        var r = (e2r - e1r) * pos + e1r;
        var s = (e2Sp - e1Sp) * pos + e1Sp;
        newP.x = (e2x - e1x) * pos + e1x;
        newP.y = (e2y - e1y) * pos + e1y;
        newP.dx = Math.cos(r) * s;
        newP.dy = Math.sin(r) * s;
        newP.follow = follow ? r : undefined;
        newP.life = life;
        newP.part = particleSprites[Math.random() * particleSprites.length | 0];
    }

    if (!render.type.captureFeedback){
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    }
    render.key.toLocal(0,0);
    m[0] = ctxM[0];
    m[1] = ctxM[1];
    m[2] = ctxM[2];
    m[3] = ctxM[3];
    m[4] = render.key.lx;
    m[5] = render.key.ly;
    spriteRender.setRenderDestination(ctx, m)
    var i = 0;
    for(const p of particles) {
        if(i < pCount) {
            const spr = p.part.spr;
            const tracks = p.part.tracks;
            const oldA = spr.a, oldCss =  spr.rgb.css

            if(tracks) {
                const t = life - p.life;
                var rx = follow ? p.follow : spr.rx;
                var ry = follow ? p.follow + Math.PI90 : spr.ry;
                var sx = spr.sx;
                var sy = spr.sy;
                if (tracks.rgb.length) { spr.rgb.css = tracks.rgb[t % tracks.rgb.length] }
                if (tracks.a.length) { spr.a = tracks.a[t % tracks.a.length] }
                if (tracks.rx.length) { rx = tracks.rx[t % tracks.rx.length] }
                if (tracks.ry.length) { ry = tracks.ry[t % tracks.ry.length] }
                if (tracks.sx.length) { sx = tracks.sx[t % tracks.sx.length] }
                if (tracks.sy.length) { sy = tracks.sy[t % tracks.sy.length] }

                sm[0] = Math.cos(rx) * sx;
                sm[1] = Math.sin(rx) * sx;
                sm[2] = Math.cos(ry) * sy;
                sm[3] = Math.sin(ry) * sy;
            }else {
                if(follow) {
                    sm[0] = Math.cos(p.follow) * spr.sx;
                    sm[1] = Math.sin(p.follow) * spr.sx;
                    sm[2] = Math.cos(p.follow + Math.PI90) * spr.sy;
                    sm[3] = Math.sin(p.follow + Math.PI90) * spr.sy;

                }else{
                    sm[0] = spr.key.m[0];
                    sm[1] = spr.key.m[1];
                    sm[2] = spr.key.m[2];
                    sm[3] = spr.key.m[3];
                }
            }
            sm[4] = p.x;
            sm[5] = p.y;
            const osm = spr.key.m;
            spr.key.m = sm;
            spriteRender.drawSriteTo(spr)
            spr.key.m = osm;
            spr.a = oldA;
            spr.rgb.css = oldCss;
        } else { break }
        i++;
    }
    spriteRender.restoreRenderdestination()
//    sprites.mustUpdate = true;
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
    mustReset = false;
    linksCount = linkCount = 0
    render = getSprite(348724);
    if(render && render.type.image) {
        if (!render.image.isDrawable) {
            mediaList.mediaSelected.clear();
            mediaList.mediaSelected.add(render.image);
            issueCommand(commands.spritesToDrawable);
        }
        if (render.image.ctx) {
            ctx = render.image.ctx;
            ctxM = render.key.im;
            render.type.captureFeedback  = false;
        }

    }else {
        ctx = undefined;
        ctxM = undefined;
        API.active = false;
        gravityIn = particle = emiter;
        particles.length = 0;
        pCount = 0;
        return;
    }
    gravityIn = getSprite(348723);
    particle = getSprite(348730);
    emiter = getSprite(348736);
    rateLife = getSprite(251289);
    API.active = linksCount === linkCount;
    reset();
}
function removeSprite(spr) {
    var idx = emiters.findIndex(s => s.guid === spr.guid);
    if(idx > -1) { emiters.splice(idx,1)}
    idx = particleSprites.findIndex(s => s.spr.guid === spr.guid);
    if(idx > -1) { particleSprites.splice(idx,1)}
    mustReset = true;
}
function reset() {

    if (!API.active) { return }
    particles.length = 0;
    pCount = 0;
    sprites.each(spr => {
        if (spr.name.startsWith(particle.name)) {
            var part = particleSprites.find(s => s.spr.guid === spr.guid);
            if(!part) {
                particleSprites.push(part = {spr});
                spr.addEvent("ondeleting",removeSprite);
            }
            if(spr.type.animated) {
                if(part.tracks === undefined) {
                    part.tracks = {
                        a: [],
                        rx: [],
                        ry: [],
                        sx: [],
                        sy: [],
                        rgb: [],
                        //image: [],
                    };
                }
                for(let t = 0; t < animation.length; t++) {
                    spr.setAnimFrame(t);
                    spr.animation.eachTrackName(name => {
                        if (part.tracks[name]) {
                            if (name === "rgb") { part.tracks.rgb[t] = spr.rgb.css }
                            else { part.tracks[name][t] = spr[name] }
                        }
                    });
                }
                part.tracks.rgb.length = part.tracks.rgb.length ? animation.length : 0;
                part.tracks.a.length = part.tracks.a.length ? animation.length : 0;
                part.tracks.rx.length = part.tracks.rx.length ? animation.length : 0;
                part.tracks.ry.length = part.tracks.ry.length ? animation.length : 0;
                part.tracks.sx.length = part.tracks.sx.length ? animation.length : 0;
                part.tracks.sy.length = part.tracks.sy.length ? animation.length : 0;
                spr.setAnimFrame(animation.time);
            } else {
                if(part.tracks) { part.tracks = undefined }
            }

       }
        if (spr.name.startsWith(emiter.name)) {
            if(!emiters.find(s => s.guid === spr.guid)) {
                emiters.push(spr);
                spr.addEvent("ondeleting",removeSprite);
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
    inputs: [["Gravity", 348723], ["Render", 348724], ["Particle", 348730], ["Emiter", 348736],["Rate Life", 251289]],
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