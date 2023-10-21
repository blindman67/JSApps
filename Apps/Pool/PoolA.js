

const $ = (c, p = {}, s = {}) => Object.assign(c, p),Object.assign(c.style, s), c);
const $$ = (e, ...sibs) => sibs.reduce((e,sib) => (e.appendChild(sib), e), e);
const $E = (cb, n) => n.forEach(n=>document.addEventListener(n,cb));
const U = undefined, T = true, F = false;
const asin = Math.asin, acos = Math.acos, sin = Math.sin, cos = Math.cos, PI = Math.PI, TAU = PI * 2;
const random = Math.random, atan2 = Math.atan2, abs = Math.abs, min = Math.min, rand = (min, max) => random() * (max - min) + min;
function Mouse() {
    const m = {x: 0, y: 0, b: 0};
	const E(e) =>{
        m.x = e.pageX;
        m.y = e.pageY;
		if (e.type === n[0]) { m.b |= 1 << (e.which - 1) }
		else if(e.type === n[1]) { m.b &= ~(1 << (e.which - 1)) }
	}
	const n=["mousedown","mouseup","mousemove"];
    $E(E,n);
	return m;
}
function simpleKeyboard() {
	const k = {}, n = ["keydown","keyup"],c;
	const E(e) {
		if(k[c=e.code] !== U) {
			k[c] = e.type === n[0];
			e.preventDefault();
		}
	}
    $E(E,n);
	return  { keys, add(...names) { for(const name of names) { keys[name] = false }; return keys } };
}


const keyboard = simpleKeyboard();
keyboard.add();
const keys = keyboard.keys;


const CUSH_W = 49, CUSH_H = 24.5;
const CUSH_REFERENCE_SIZE = 24;
const CUSH_SIZE_X = 20;
const CUSH_SIZE_Y = 20;
const INSET = CUSH_SIZE_X * 3.5;
const TABLE_DIMOND_SIZE = CUSH_SIZE_X * 0.2;
const TABLE_CANVAS_SIZE = {width: CUSH_SIZE_X * CUSH_W + INSET * 2, height: CUSH_SIZE_Y * CUSH_H + INSET * 2}
const TABLE_SCALE = (innerWidth * (2/3)) / TABLE_CANVAS_SIZE.width;

const BALL_SIZE = CUSH_SIZE_X ;
const BALL_SIZE_SQR = BALL_SIZE * BALL_SIZE;
const MASS_SCALE =  CUSH_REFERENCE_SIZE / CUSH_SIZE_X;
const BALL_MASS =  4 / 3 * PI * (BALL_SIZE ** 3) * MASS_SCALE;
const POCKET_SIZE = 1.76;   // in cush units
const POCKET_ROLL_IN_SCALE = 1.3;  // scales size of pocket roll
const POCKET_SIZE_PX = POCKET_SIZE * BALL_SIZE;
const MARK_SIZE = BALL_SIZE * (200 / 256);  // radius of white part of ball
const MARK_SIZE_S = BALL_SIZE * (105 / 256);  // radius of white part of ball
const MOUSE_LENGTH = BALL_SIZE * (CUSH_H + 4); // the pool que
const MOUSE_TIP = BALL_SIZE / 6;
const MOUSE_END = BALL_SIZE / 3;
const TABLE_MARK_COLOR = "#ADB8";
const TABLE_MARK_LINE_WIDTH = 3;
const SHOW_GUIDES = false;  // Do not set to true as function have been removed from code pen version
const TABLE_COLOR = "#080";
const TABLE_COLORS = ["#2A3","#293","#283","#273", "#263"];
const WHITE_BALL = "#D8D6D4";
const SHADOW_COLOR = "#0004";
const LIGHT_COLOR_LOW = "#FFF4";
const LIGHT_COLOR = "#FFF6";
const CUE_DARK_COLOR = "#842";
const CUE_LIGHT_COLOR = "#CB6";
const CUE_JOIN_COLOR = "#CA2";
const DIMOND_COLOR =  "#CB9";
const DIMOND_COLOR_OUTLINE = "#642";
const VEL_MIN = 1;
const VEL_MAX = 5;
const SHADE_X = cos(-PI * 0.25) * BALL_SIZE;
const SHADE_Y = sin(-PI * 0.25) * BALL_SIZE;
const rack = [  //  x, y, id start positions and id (id AKA type)
   10, 1, 0,
   -4, 0, 2,
   -2, 1, 9,  -2,-1, 3,
   0, 2, 4,   0, 0, 1,   0,-2, 10,
   2, 3, 11,  2, 1, 5,   2,-1, 12,   2, -3, 8,
   4, 4, 7,   4, 2, 14,  4, 0, 13,   4, -2, 6,  4,-4,15,
];
const rackCenter = {x: 0, y: 0}; // value is set when table is created
const head = {x: 0, y: 0, Dr: 0}; // value is set when table is created. Dr is D radius
const BALL_COLORS = {
    white:  WHITE_BALL,
    yellow: "#CC2",
    blue:   "#12D",
    red:    "#E31",
    purple: "#A2D",
    green:  "#3B1",
    brown:  "#962",
    orange: "#D73",
    black:  "#000",
};
const colors = [ // by ball idx in rack order
   WHITE_BALL,
   BALL_COLORS.black,
   BALL_COLORS.yellow, BALL_COLORS.blue, BALL_COLORS.red, BALL_COLORS.purple,  BALL_COLORS.green, BALL_COLORS.brown,   BALL_COLORS.orange,
   BALL_COLORS.yellow, BALL_COLORS.blue, BALL_COLORS.red, BALL_COLORS.purple,  BALL_COLORS.green, BALL_COLORS.brown,   BALL_COLORS.orange,
];
const PW = POCKET_SIZE * 1.4, PW1 = POCKET_SIZE * 1.2, PW11 = POCKET_SIZE * 1.1, PW2 = POCKET_SIZE;
const PC = CUSH_W / 2, PI = 0.1, PI1 = 0.3, PI11 = 0.45, PI3 = 0.6;
const cush = [ // cushion pairs of coordinates forming top left corner (top left pocket and half top center pocket
    [0,      PW], [-PI,      PW1], [-PI1,      PW11],  [-PI11, PW2],      [-PI3 * 3, 0.5],  [-3 ,-1],
    [-1,    -3],  [0.5, -PI3 * 3], [PW2,       -PI11], [PW11, -PI1],      [PW1, -PI],       [PW, 0],
    [PC - PW, 0], [PC - PW1, -PI], [PC - PW11, -PI1],  [PC - PW2, -PI11], [PC - PW2, -PI3], [PC - PW2, -PI3 * 3], [PC - PW2, -4],
];
cush.push(... cush.map(xy => [CUSH_W - xy[0], xy[1]]).reverse());
cush.push(... cush.map(xy => [xy[0], CUSH_H - xy[1]]).reverse());

const TABLE_TOP = 0;
const TABLE_LEFT =  0;
const TABLE_BOTTOM = CUSH_SIZE_Y * (CUSH_H);
const TABLE_RIGHT = CUSH_SIZE_X * (CUSH_W);
const n = {
    c:"canvas",
var ctx;
const canvas = $(n.c, {className: "mainCanvas", width: innerWidth, height: innerHeight});
const gameCanvas = $(n.c, TABLE_CANVAS_SIZE);
const overlay = $(n.c, TABLE_CANVAS_SIZE);
const sprites = $(n.c, {width: BALL_SIZE * 8, height: BALL_SIZE * 3});
const ctxMain = canvas.getContext("2d");
const ctxGame = ctx = gameCanvas.getContext("2d");
const spriteCtx = sprites.getContext("2d");
sprites.layout = {};
$$(document.body, canvas);

const game = undefined; // This has be removed from code pen version
const GAME_TOP = (canvas.height - TABLE_CANVAS_SIZE.height * TABLE_SCALE) / 2;
const GAME_LEFT = (canvas.width - TABLE_CANVAS_SIZE.width * TABLE_SCALE) / 2;
// mouse AKA que
const mouse = Object.assign(startMouse(true, true), {
    pull: 0,
    spring: 0,
    speed: 0,
    pos: 0,
    cueHit: 0,
    angle: 0,
    spin: 0,
    spinPower: 0,
    mass: (MOUSE_TIP + MOUSE_END) * 0.5  * PI * MOUSE_LENGTH * MASS_SCALE
});
var maxPull = BALL_SIZE * BALL_MASS / mouse.mass;
var wait = 0, tableEdge, tempQueBall, tempBall, tableClear = false, placeBalls = false, ballToPlace;

var lockAngle = false;
var lockAngleLocked = false;
var lockDistTemp = 1;
var lockAngleAt = 0;
var fineAngleStart = 0;
var fineAngle = 0;
var runToStop = 1;
var frameCount = 0;
const balls = [], lines = [], pockets = [], contacts = [], positionSaves = [[],[],[],[]];
setTimeout(() => {
    createSprites();
    tableEdge = createTable();  // returned is path2d so corners can be transparent
    rackBalls();
    requestAnimationFrame(mainLoop);
    if (game) {
        game.update();
        game.startGame();
    }
}, 0);

function Line(x1,y1,x2,y2) {
    this.isBehindPocket =
        (x1 < TABLE_LEFT - CUSH_SIZE_X * 1 || y1 < TABLE_TOP - CUSH_SIZE_Y * 1 || y1 > TABLE_BOTTOM + CUSH_SIZE_Y * 1 || x1 > TABLE_RIGHT + CUSH_SIZE_X * 1) &&
        (x2 < TABLE_LEFT - CUSH_SIZE_X * 1|| y2 < TABLE_TOP - CUSH_SIZE_Y * 1|| y2 > TABLE_BOTTOM + CUSH_SIZE_Y * 1 || x2 > TABLE_RIGHT + CUSH_SIZE_X * 1);
    x1 += INSET;
    y1 += INSET;
    x2 += INSET;
    y2 += INSET;

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.vx = this.x2 - this.x1;
    this.vy = this.y2 - this.y1;
    this.lenInv = 1 / (this.vx * this.vx + this.vy * this.vy) ** 0.5;
    this.u = 0;
}
Line.prototype = {
    intercept(B) {
        const x = this.vx, y = this.vy;
        const d = B.vx * y - B.vy * x;
        if (d > 0) {  // only if moving towards the line
            const rScale = BALL_SIZE * this.lenInv;
            const nx = B.y - (this.y1 + x * rScale);
            const ny = B.x - (this.x1 - y * rScale);
            const u1 = this.u = (B.vx * nx - B.vy * ny) / d;
            if (u1 >= 0 && u1 <= 1) {  return (x * nx - y * ny) / d }
            let xe, ye;
            if (u1 > -rScale && u1 < 0) {
                xe = this.x1;
                ye = this.y1;
            }
            if (u1 > 1 && u1 < 1 + rScale) {
                xe = this.x2;
                ye = this.y2;
            }
            if (xe !== U) { // if near ends of line check end point as vector intercept circle
                const vx = B.vx, vy = B.vy, v1Sqr = vx * vx + vy * vy;
                const xx = B.x - this.x1, yy = B.y - this.y1, blSqr = xx * xx + yy * yy;
                var b = -2 * (xx * vx + yy * vy);
                const c = 2 * v1Sqr;
                const d = (b * b - 2 * c * (blSqr - BALL_SIZE_SQR)) ** 0.5;
                return isNaN(d) ? U : (b - d) / c;
            }
        }
    }
}
function Ball(x, y, id) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.id = id;
    this.col = colors[id];
    this.center = {x:0, y:0, z:1};  // center of stripe
    this.centerS = {x:1, y:0, z:0}; // center of circle
    this.roll = {x:0, y: rand(0,TAU), z: rand(0,TAU)};
    this.applyRoll();
    this.dead = false;
    this.hold = false;
}
Ball.prototype = {
    update() {
        var da, roll, spx = this.vx, spy = this.vy;
        const vx = this.vx;
        const vy = this.vy;
        const sSqr = vx * vx + vy * vy, speed = sSqr ** 0.5;
        const tSqr = sSqr / TABLE_SCALE, tSpeed = speed / TABLE_SCALE;
        if (tSpeed > 0.1) {
            if (tSpeed < 4) {
                da = (tSqr * (4.5 + 9 * 4 - tSqr)) / BALL_MASS;
            } else {
                da = (tSqr * 4.5) / BALL_MASS;  // accel due to drag
            }
            const nx = vx / speed;
            const ny = vy / speed;
            this.vx -= nx * da;
            this.vy -= ny * da;
            this.vx *= 0.993;
            this.vy *= 0.993;
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
        this.testPockets();
        this.speed = (this.vx * this.vx + this.vy * this.vy) ** 0.5;
        const dir = atan2(this.vy, this.vx);
        this.roll.z = dir;
        this.roll.y =  this.speed / BALL_SIZE;
        this.x += this.vx;
        this.y += this.vy;
        this.applyRoll();
    },
    testPockets() {
        var nearPocket = false, idx= 0, pIdx;
        if (this.z > 0.8 && ( this.x < TABLE_LEFT || this.y < TABLE_TOP || this.y > TABLE_BOTTOM || this.x > TABLE_RIGHT)) {
            nearPocket = true;
            this.z = 1;
        } else {
            for (const p of pockets) {
                const px = p.x - this.x;
                const py = p.y - this.y;
                const dist = (px * px + py * py) ** 0.5;
                if (dist < POCKET_SIZE_PX * POCKET_ROLL_IN_SCALE) {
                    const a = (1 - dist / (POCKET_SIZE_PX* POCKET_ROLL_IN_SCALE)) ** 1.2;
                    this.vx = this.vx * (1 - (a * 0.2)) + px / dist * a;
                    this.vy = this.vy * (1 - (a * 0.2)) + py / dist * a;
                    this.z = a ** 3;
                    nearPocket = true;
                    pIdx = idx;
                    break;
                }
                idx ++;
            }
        }
        if (nearPocket) {
            if (this.z > 0.8) { this.downPocket() }
        } else { this.z = 0 }
    },
    downPocket() {
        this.vx = 0;
        this.vy = 0;
        this.x = this.startX - 10000;
        this.y = this.startY;
        game && (game.pocketed = this);
        if (this.id === 0) {
            this.hold = true;
            this.vx = 0;
            this.vy = 0;
            this.z = 0;
            this.spin = 0;
        } else  {
            this.dead = true;
        }
    },
    applyRoll() { // rotate in direction of movement for visuals only
        var c = this.center;
        var xd = cos(this.roll.z);
        var yd = sin(this.roll.z);
        const cpy = cos(this.roll.y);
        const spy = sin(this.roll.y);
        var x = xd * c.x + yd * c.y;    // in roll direction space
        var y = xd * c.y - yd * c.x;
        var xx = x * cpy - c.z * spy;   // rotate
        c.z = x * spy + c.z * cpy;
        c.x = xd * xx - yd * y;         // back to world space
        c.y = xd * y  + yd * xx;
        if (this.id > 8 || !this.id) {  // rotate inner circle
            c = this.centerS;
            x = xd * c.x + yd * c.y;
            y = xd * c.y - yd * c.x;
            xx = x * cpy - c.z * spy
            c.z = x * spy + c.z * cpy;
            c.x = xd * xx - yd * y
            c.y = xd * y  + yd * xx;
        }
    },

    drawSprite(spr, offX, offY, scale = 1) {
        const w = spr.w, h = spr.w;
        ctx.setTransform(scale,0,0,scale, this.x + offX,  this.y + offY);
        ctx.drawImage(sprites, spr.x, spr.y, w, h, - w / 2,  - h / 2, w, h);
    },
    render(scale = 1) {
        var cx, cy, cz;
        if (this.id === 0) {
            ctx.fillStyle = this.col;
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_SIZE, 0, PI * 2);
            ctx.fill();
        }
        const c = this.center;
        const cS = this.centerS;
        ctx.setTransform(scale, 0, 0, scale, this.x, this.y);
        ctx.fillStyle = this.col;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_SIZE, 0, PI * 2);
        ctx.fill();
        if (this.id) {
            if (this.id > 8) {
                this.drawSection(c.x,c.y,c.z, MARK_SIZE)
                this.drawSection(cS.x,cS.y,cS.z, MARK_SIZE_S)
            } else {
                this.drawSection(c.x,c.y,c.z, MARK_SIZE_S)
            }
        } 
        if (this.z > 0) {
            ctx.fillStyle = "#000";
            ctx.globalAlpha =  (this.z < 0 ? 0 : this.z> 1 ? 1 : this.z);
            ctx.beginPath();
            ctx.arc(0, 0, BALL_SIZE, 0, PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    },
    drawSection(cx, cy, cz, sr, col = WHITE_BALL) { // sr section radius
        const R = BALL_SIZE / sr;
        var len = (cx * cx + cy * cy) ** 0.5;
        len = len < -1 ? -1 : len > 1 ? 1 : len;
        const eDir = atan2(cy, cx), rDir = eDir + PI;
        const pheta = asin(len);
        var A = cos(asin(1 / R)) * R;
        var tx = Infinity;
        const c1 = sin(pheta) * A;
        const c2 = 1 / (cos(pheta) ** 2);
        const roots = quadRoots(c2 - 1, -2 * c1 * c2, c1 * c1 * c2 + R * R - 1.001);
        roots.length > 0 && (tx = (roots.length === 1 ? roots[0]: (roots[0] + roots[1]) * 0.5) * sr);
        const exr = abs(cos(pheta)) * sr;
        A *= sr;
        const x = cx * A, y = cy * A;
        ctx.fillStyle = col;
        ctx.beginPath();
        if (tx >= BALL_SIZE) {
            cz < 0 ?
                ctx.ellipse( x,  y, exr, sr, eDir, 0, TAU):
                ctx.ellipse(-x, -y, exr, sr, eDir, 0, TAU);
        } else {
            const ab = acos(tx / BALL_SIZE);
            const bb = acos((tx - len * A) / exr);
            if (cz < 0) {
                ctx.arc(0, 0,  BALL_SIZE, eDir - ab, eDir + ab);
                ctx.ellipse( x,  y, exr, sr, eDir, bb, -bb + TAU);
            } else {
                ctx.arc(0, 0,  BALL_SIZE, rDir - ab, rDir + ab);
                ctx.ellipse(-x, -y, exr, sr, rDir, bb, - bb);
            }
            ctx.fill();
            ctx.beginPath();
            if (cz > 0) {
                ctx.arc(0, 0, BALL_SIZE, eDir - ab, eDir + ab);
                ctx.ellipse( x,  y, exr, sr, eDir, bb, -bb + TAU, true);
            } else {
                ctx.arc(0, 0,  BALL_SIZE, rDir - ab, rDir + ab);
                ctx.ellipse(-x, -y, exr, sr, rDir, bb, - bb, true);
            }
        }
        ctx.fill();
    },
    interceptBallTime(B, t) {
        const x = this.x - B.x, y = this.y - B.y, d = (x * x + y * y) ** 0.5;
        if (d > BALL_SIZE * 2) {
            const ts = circlesInterceptUnitTime(
                this.x, this.y, this.x + this.vx, this.y + this.vy,
                B.x, B.y, B.x + B.vx, B.y + B.vy,
                BALL_SIZE, BALL_SIZE
            );
            if (ts.length) {
                const ta = ts[0], tb = ts[1];
                if (ts.length === 1) {
                    if (ta >= t && ta <= 1) { return ta }
                } else if (ta <= tb) {
                    if (ta >= t && ta <= 1) { return ta }
                    if (tb >= t && tb <= 1) { return tb }
                } else {
                    if (tb >= t && tb <= 1) { return tb }
                    if (ta >= t && ta <= 1) { return ta }
                }
            }
        }
    },
    collideLine(l, t, lineU) { 
        var x1, y1;
        this.x += this.vx * t;
        this.y += this.vy * t;
        if (lineU < 0 || lineU > 1) {
            if (lineU < 0) {
                x1 = -(l.y1 - this.y);
                y1 = l.x1 - this.x;
            } else {
                x1 = -(l.y2 - this.y);
                y1 = l.x2 - this.x;
            }
        } else {
            x1 = l.x2 - l.x1;
            y1 = l.y2 - l.y1;
        }
        const d = (x1 * x1 + y1 * y1) ** 0.5;
        const nx = x1 / d;
        const ny = y1 / d;
        const u = (this.vx  * nx + this.vy  * ny) * 2;
        this.vx = (nx * u - this.vx);
        this.vy = (ny * u - this.vy);
        this.x -= this.vx * t;
        this.y -= this.vy * t;
        if (l.isBehindPocket ) { this.downPocket() }
    },
    collide(B, t) {  // Ball hits ball at time. ( time == 0 == previouse frame, time == 1 == this frame )
        const a = this;
        a.x = a.x + a.vx * t;
        a.y = a.y + a.vy * t;
        B.x = B.x + B.vx * t;
        B.y = B.y + B.vy * t;
        const x = a.x - B.x, y = a.y - B.y;
        const d = (x * x + y * y);
        const u1 = a.vx * x + a.vy * y;
        const u2 = a.vy * x - a.vx * y;
        const u3 = B.vx * x + B.vy * y;
        const u4 = B.vy * x - B.vx * y;
        B.vx = (x * u1 - y * u4) / d;
        B.vy = (y * u1 + x * u4) / d;
        a.vx = (x * u3 - y * u2) / d;
        a.vy = (y * u3 + x * u2) / d;
        a.x = a.x - a.vx * t;
        a.y = a.y - a.vy * t;
        B.x = B.x - B.vx * t;
        B.y = B.y - B.vy * t;
    },
}

function canAdd(B) { // test if safe to add ball (no overlap)
    if (B.x < TABLE_LEFT + INSET + BALL_SIZE || B.y < TABLE_TOP + INSET + BALL_SIZE ||
        B.y > TABLE_BOTTOM + INSET - BALL_SIZE || B.x > TABLE_RIGHT+ INSET - BALL_SIZE) {
        return false;
    }

    for (const b of balls) {
        if (B !== b && ((b.x - B.x) ** 2 + (b.y - B.y) ** 2) < (BALL_SIZE_SQR * 4)) { return false }
    }
    return true;
}
function isInD(B) {
    if (B.x <= head.x) {
        const dx = B.x - head.x;
        const dy = B.y - head.y;
        if (dx * dx + dy * dy < head.Dr * head.Dr) {return true}
    }
    return false;
}
function isOffTable(x, y) {
    if (x < TABLE_LEFT + INSET || y < TABLE_TOP + INSET ||
        y > TABLE_BOTTOM + INSET || x > TABLE_RIGHT+ INSET) {
        return true;
    }
    return false;
}
function renderBall(ctxDest, x, y, ball) {
    const c = ctx;
    ctx = ctxDest;
    const bx = ball.x;
    const by = ball.y;
    ball.x = x;
    ball.y = y;
    ball.z = 0;
    ball.render(TABLE_SCALE);
    ball.drawSprite(sprites.layout.shade, 0, 0, TABLE_SCALE);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1/1.5;
    ball.drawSprite(sprites.layout.light, 0, 0, TABLE_SCALE);
    ctx.globalAlpha = 1;
    ball.drawSprite(sprites.layout.spec, 0, 0, TABLE_SCALE);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx = c;
    ball.x = bx;
    ball.y = by;

}
function renderBalls() {
    for (const b of balls) {
        if (b.hold && b.id !== 0) {
            b.drawSprite(sprites.layout.shadow, BALL_SIZE * 0.8, BALL_SIZE * 0.8);
        } else {
            b.drawSprite(sprites.layout.shadow, BALL_SIZE * 0.4, BALL_SIZE * 0.4);
        }
    }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(overlay, 0, 0);
    for (const b of balls) { b.render() }
    for (const b of balls) { b.drawSprite(sprites.layout.shade, 0, 0) }
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1/1.5;
    for (const b of balls) { b.drawSprite(sprites.layout.light, 0, 0) }
    ctx.globalAlpha = 1;
    for (const b of balls) { b.drawSprite(sprites.layout.spec, 0, 0) }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
}
function renderQue(B) {  // ball is the que target
    var dx = cos(mouse.angle);
    var dy = sin(mouse.angle);
    var s = mouse.pos, e = s + 100;
    ctx.beginPath();
    ctx.lineTo(dx * s + B.x + BALL_SIZE * 2, dy * s + B.y + BALL_SIZE * 2);
    ctx.lineTo(dx * e + B.x + BALL_SIZE * 2, dy * e + B.y + BALL_SIZE * 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.stroke();


}
function simpleGuide(ball) {
    const B = ball;
    var bx = cos(mouse.angle) * BALL_SIZE;
    var by = sin(mouse.angle) * BALL_SIZE;
    ctx.save()
    ctx.beginPath();
    ctx.rect(INSET, INSET, TABLE_RIGHT, TABLE_BOTTOM);
    ctx.clip();
    ctx.beginPath();
    ctx.strokeStyle = "#fff4";
    ctx.lineWidth = 1 / TABLE_SCALE;
    ctx.beginPath();
    ctx.lineTo(B.x - bx, B.y - by);
    ctx.lineTo(B.x - 2000 * bx, B.y - 2000 * by);
    ctx.moveTo(B.x - bx * 0.5 - by, B.y - by * 0.5 + bx);
    ctx.lineTo(B.x - 2000 * bx - by, B.y - 2000 * by + bx);
    ctx.moveTo(B.x - bx * 0.5 + by, B.y - by * 0.5 - bx);
    ctx.lineTo(B.x - 2000 * bx + by, B.y - 2000 * by - bx);
    ctx.stroke();
    ctx.restore();
}
function createSprites() {
    const ctx = spriteCtx;
    const ballShadowGrad = ctx.createRadialGradient(0,0, BALL_SIZE * 0.4, 0,0, BALL_SIZE * 1.2);
    ballShadowGrad.addColorStop(0,"#0006");
    ballShadowGrad.addColorStop(0.1,"#0006");
    ballShadowGrad.addColorStop(0.5,"#0005");
    ballShadowGrad.addColorStop(0.8,"#0003");
    ballShadowGrad.addColorStop(1,"#0000");
    ctx.fillStyle = ballShadowGrad;
    ctx.setTransform(1,0,0,1, BALL_SIZE * 1.5, BALL_SIZE * 1.5);
    ctx.beginPath();
    ctx.arc(0, 0, BALL_SIZE * 1.2, 0, TAU);
    ctx.fill();
    sprites.layout.shadow = {x:0, y:0, w: BALL_SIZE * 3, h: BALL_SIZE * 3};

    const ballShadeGrad = ctx.createRadialGradient(-BALL_SIZE * 0.2, -BALL_SIZE * 0.2, BALL_SIZE * 0.8, -BALL_SIZE * 0.7, -BALL_SIZE * 0.7, BALL_SIZE * 2);
    ballShadeGrad.addColorStop(0,"#0000");
    ballShadeGrad.addColorStop(0.1,"#0000");
    ballShadeGrad.addColorStop(0.7,"#0005");
    ballShadeGrad.addColorStop(0.95,"#0004");
    ctx.fillStyle = ballShadeGrad;
    ctx.setTransform(1,0,0,1, BALL_SIZE * 4, BALL_SIZE);
    ctx.beginPath();
    ctx.arc(0, 0, BALL_SIZE, 0, TAU);
    ctx.fill();
    sprites.layout.shade = {x: BALL_SIZE * 3, y:0, w: BALL_SIZE * 2, h: BALL_SIZE * 2};
    const ballSkyGrad = ctx.createRadialGradient(BALL_SIZE * 0.7, BALL_SIZE * 0.7, 0, 0, 0, BALL_SIZE * 2.4);
    ballSkyGrad.addColorStop(0,"#FFF0");
    //ballSkyGrad.addColorStop(0.3,"#FFF0");
    ballSkyGrad.addColorStop(0.4,"#EEF3");
    ballSkyGrad.addColorStop(0.6,"#DEF6");
    ballSkyGrad.addColorStop(0.7,"#CDF8");
    ballSkyGrad.addColorStop(0.8,"#FFF0");
    ballSkyGrad.addColorStop(1,"#FFF0");
    ctx.fillStyle = ballSkyGrad;
    ctx.setTransform(1,0,0,1, BALL_SIZE * 6, BALL_SIZE);
    ctx.beginPath();
    ctx.arc(0, 0, BALL_SIZE * 0.92, 0, TAU);
    ctx.fill();
    sprites.layout.light = {x: BALL_SIZE * 5, y:0, w: BALL_SIZE * 2, h: BALL_SIZE * 2};

    ctx.setTransform(1,0,0,1, BALL_SIZE * 8, BALL_SIZE);
    const R = BALL_SIZE * 0.4
    ctx.fillStyle = LIGHT_COLOR_LOW;
    ctx.globalAlpha = 1/2;
    var i = 0.1;
    while (i < 1)  {
        const size = (1 - i ** 4) * 0.5 + 0.2
        ctx.beginPath();
        ctx.ellipse(-R, -R, R * 0.6 * size, R * 0.9 * size, PI / 4, 0 , TAU);
        ctx.fill();
        i += 0.2;
    }
    sprites.layout.spec = {x: BALL_SIZE * 7, y:0, w: BALL_SIZE * 2, h: BALL_SIZE * 2};
}
function createTable() {  // renders table overlay and creates edge lines and pockets
    function drawDimonds(size, col, colS) {
        var i = 1;
        const xStep = (CUSH_W / 8) * CUSH_SIZE_X;
        const yStep = (CUSH_H / 4) * CUSH_SIZE_Y;
        const offsetY = CUSH_SIZE_Y * 2.0;
        const offsetX = CUSH_SIZE_X * 2.0;
        rackCenter.x = 6 * xStep + INSET;
        rackCenter.y = 2 * yStep + INSET;
        head.x = 2 * xStep + INSET;
        head.y = 2 * yStep + INSET;
        head.Dr =  yStep;
        ctx.fillStyle = col;
        ctx.strokeStyle = colS;
        ctx.lineWidth = 2;
        ctx.beginPath();
        while (i < 8) {
            const x = INSET + (i * xStep);
            ctx.moveTo(x + size, -offsetY + INSET);
            ctx.arc(x, -offsetY + INSET, size, 0, TAU);
            ctx.moveTo(x + size, CUSH_SIZE_Y * CUSH_H + INSET + offsetY);
            ctx.arc(x, CUSH_SIZE_Y * CUSH_H + INSET + offsetY, size, 0, TAU);
            if (i < 4) {
                const y = INSET + (i * yStep);
                ctx.moveTo(-offsetX + size + INSET, y);
                ctx.arc(-offsetX + INSET, y, size, 0, TAU);
                ctx.moveTo(CUSH_SIZE_X * CUSH_W + offsetX + size + INSET, y);
                ctx.arc(CUSH_SIZE_X * CUSH_W + offsetX + INSET, y, size, 0, TAU);
            }

            i ++;
        }

        ctx.stroke();
        ctx.fill();
        head.path = new Path2D;
        head.path.lineTo(head.x, INSET);
        head.path.lineTo(head.x, CUSH_H * CUSH_SIZE_Y + INSET);
        head.path.moveTo(head.x, head.y + head.Dr);
        head.path.arc(head.x, head.y, head.Dr, PI * 0.5, PI * 1.5);
        head.path.moveTo(rackCenter.x + TABLE_MARK_LINE_WIDTH/2, rackCenter.y);
        head.path.arc(rackCenter.x , rackCenter.y, TABLE_MARK_LINE_WIDTH/2, 0, TAU);

    }
    function drawPocket(x, y, dir, pocketCoverIn) {
        const cx = CUSH_SIZE_X, cy = CUSH_SIZE_Y;
        x = x * cy + INSET;
        y = y * cx + INSET;
        const g = ctx.createRadialGradient(x, y, cx / 2, x, y, cx * 1.7);
        g.addColorStop(0, "#000");
        g.addColorStop(0.2, "#000C");
        g.addColorStop(0.4, "#000B");
        g.addColorStop(0.97, TABLE_COLORS[4] + "9");
        g.addColorStop(0.98, TABLE_COLORS[3] + "6");
        g.addColorStop(0.99, TABLE_COLORS[2] + "0");
        g.addColorStop(1, TABLE_COLORS[0] + "0");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, cx * 1.7, 0, TAU);
        ctx.fill();
        pockets.push({x,y,r: cx * 1.7})

        const C = 0.3; // chamfer
        const B = 2.6; // back
        const PCI = pocketCoverIn * cx;
        const ax = cos(dir), ay = sin(dir);
        ctx.setTransform(ax, ay, -ay, ax, x, y);
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "#0004"
        ctx.fillStyle = "#444";
        ctx.strokeStyle = "#888";

        ctx.beginPath();
        ctx.lineTo(-cx * (3.0 - C), PCI);
        ctx.lineTo(-cx * 3.0, PCI - cy * C);
        if (PCI === 0) {
            ctx.lineTo(-cx * 3.0,  - cy * B + cy * C);
            ctx.lineTo(-cx * (3.0 - C),  - cy * B);
            ctx.lineTo( cx * (3.0 - C),  - cy * B);
            ctx.lineTo( cx * 3.0,  - cy * B + cy * C);
        } else {
            ctx.lineTo(-cx * 3.0,  - cy * B + cy * C * 2.5);
            ctx.lineTo(-cx * (3.0 - C * 2.5),  - cy * B);
            ctx.lineTo( cx * (3.0 - C * 2.5),  - cy * B);
            ctx.lineTo( cx * 3.0,  - cy * B + cy * C * 2.5);
        }
        ctx.lineTo( cx * 3.0, PCI - cy * C);
        ctx.lineTo( cx * (3.0 - C), PCI);
        ctx.lineTo( cx * (1.5 + C), PCI);
        ctx.lineTo( cx * 1.5, PCI - cy * C);
        ctx.arc(0, -cy * (PCI ? 0.0 : 0.25), cx * 1.5, TAU - (PCI ? 0.0 : 0.25), PI + (PCI ? 0.0 : 0.25), true);
        ctx.lineTo(-cx * 1.5, PCI - cy * C);
        ctx.lineTo(-cx * (1.5 + C), PCI);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.setTransform(1,0,0,1,0,0);

    }
    function tableEdge(ctx) {
        ctx.lineTo(    CSx * 0.5, CSy * 3.2);
        ctx.lineTo(    CSx * 3.2, CSy * 0.5);
        ctx.lineTo(w - CSx * 3.2, CSy * 0.5);
        ctx.lineTo(w - CSx * 0.5, CSy * 3.2);
        ctx.lineTo(w - CSx * 0.5, h - CSy * 3.2);
        ctx.lineTo(w - CSx * 3.2, h - CSy * 0.5);
        ctx.lineTo(CSx * 3.2,     h - CSy * 0.5);
        ctx.lineTo(CSx * 0.5,     h - CSy * 3.2);
    }
    function createOutline() {
        var i = 0, outline = new Path2D();
        while (i < cush.length) { outline.lineTo(INSET + cush[i][0] * CUSH_SIZE_X, INSET + cush[i++][1] * CUSH_SIZE_Y) }
        outline.closePath();
        outline.rect(- 200, -100, w + 400, h + 400);
        return outline;
    }

    var i = 0, j = 0;
    const ctx = overlay.getContext("2d");
    const w = ctx.canvas.width, w2 = w / 2;
    const h = ctx.canvas.height;
    const p = BALL_SIZE * 2; // pocket size
    const I = INSET;
    const outline = createOutline();
    while(i < cush.length) {
        const x1 = cush[i][0] * CUSH_SIZE_X, y1 = cush[i++][1] * CUSH_SIZE_Y;
        const x2 = cush[i % cush.length][0] * CUSH_SIZE_X, y2 = cush[i % cush.length][1] * CUSH_SIZE_Y;
        lines.push( new Line(x1 , y1, x2 , y2));
   }


    ctx.save();
    ctx.beginPath();
    ctx.rect(0,0,w, h);
    ctx.clip();
    ctx.fillStyle = TABLE_COLORS[0];
    ctx.fill(outline, "evenodd");
    ctx.globalCompositeOperation = "source-atop";
    ctx.lineJoin = "round";
    ctx.strokeStyle = TABLE_COLORS[1];
    ctx.lineWidth = 16;
    ctx.stroke(outline);
    ctx.strokeStyle = TABLE_COLORS[2];
    ctx.lineWidth = 12;
    ctx.stroke(outline);
    ctx.strokeStyle = TABLE_COLORS[3];
    ctx.lineWidth = 8;
    ctx.stroke(outline);
    ctx.strokeStyle = TABLE_COLORS[4];
    ctx.lineWidth = 4;
    ctx.stroke(outline);
    ctx.strokeStyle = TABLE_COLORS[1];
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#CFC";
    ctx.globalAlpha = 1/16;
    ctx.setTransform(1,0,0,1,4,4);
    ctx.stroke(outline);
    ctx.lineWidth = 6;
    ctx.stroke(outline);
    ctx.globalAlpha = 1;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.fill(outline, "evenodd");
    ctx.globalCompositeOperation = "destination-over";
    ctx.shadowColor = SHADOW_COLOR;
    ctx.shadowOffsetX = BALL_SIZE * 0.5;
    ctx.shadowOffsetY = BALL_SIZE * 0.5;
    ctx.shadowBlur = BALL_SIZE * 0.5;
    ctx.fill(outline, "evenodd");
    ctx.shadowColor = "#0000";

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#a74"
    const CSx = CUSH_SIZE_X
    const CSy = CUSH_SIZE_Y
    ctx.beginPath();
    tableEdge(ctx)
    ctx.rect(-CSx * 2, -CSy * 2, w + CSx * 4, h + CSy * 4);
    ctx.fill("evenodd");

    ctx.globalCompositeOperation = "source-atop";
    ctx.beginPath();
    tableEdge(ctx)
    ctx.rect(CSx * 2, CSy * 2, w - CSx * 4, h - CSy * 4);
    ctx.fill("evenodd");


    ctx.globalCompositeOperation = "source-atop";
    ctx.beginPath();
    tableEdge(ctx)
    ctx.closePath()
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#863";
    ctx.stroke();
    ctx.strokeStyle = "#532";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#4448";
    ctx.fillRect(w - CSx * 2, CSy * 2, 2, h - CSy * 4);
    ctx.fillRect(CSx * 2, h - CSy * 2, w - CSy * 4, 2);
     ctx.globalCompositeOperation = "multiply";
     ctx.fillStyle = "#AAA6";
    ctx.fillRect(CSx * 2-2, CSy * 2, 2, h - CSy * 4);
    ctx.fillRect(CSx * 2, CSy * 2-2, w - CSy * 4, 2);

     ctx.restore();
    drawDimonds(TABLE_DIMOND_SIZE, DIMOND_COLOR, DIMOND_COLOR_OUTLINE);

    const pI = 0.707 * 0.5;
    drawPocket(-pI,         -pI,            -PI * 0.25, 1);
    drawPocket(CUSH_H,      -1.2,           0, 0);
    drawPocket(CUSH_W + pI, -pI,            PI * 0.25, 1);
    drawPocket(-pI,         CUSH_H + pI,    PI * 1.25, 1);
    drawPocket(CUSH_H,      CUSH_H + 1.2,   PI, 0);
    drawPocket(CUSH_W + pI, CUSH_H + pI,    PI * 0.75,1);

    const edge = new Path2D;
    tableEdge(edge);
    return edge;
}
function rackBalls() {
    const w = ctx.canvas.width, w2 = w / 2;
    const h = ctx.canvas.height;
    const p = BALL_SIZE * 2;
    var i = 0, j = 0, ball, add, e;
    balls.length = 0;
    while (i < rack.length) {
        add = false;
        e = 100;
        while (!add && e--) {
            ball = new Ball(
                i ? rack[i] * BALL_SIZE * (0.90 + ((random()**2 - 0.5) * 0.04)) + rackCenter.x : rack[i] * BALL_SIZE,
                rack[i + 1] * BALL_SIZE * (1.02 + ((random()**2 - 0.5) * 0.04)) + rackCenter.y,
                rack[i + 2],
            );
            add = canAdd(ball);
        }
        balls.push(ball);
        i += 3;
    }
    tableClear = false;
}
function resolveCollisions(balls) {
    var minTime = 0, minObj, mb, resolving = T, idx = 0, idx1, after = 0, e = 0, minU = 0;
    while (resolving && e++ < MAX_RESOLUTION_CYCLES) {
        resolving = F;
        mb = minObj = U;
        minTime = 1;
        idx = 0;
        for (const b of balls) {
            idx1 = idx + 1;
            while (idx1 < balls.length) {
                const b1 = balls[idx1++];
                const t = b.interceptBallTime(b1, after);
                if (t !== U) {
                    if (t <= minTime) {
                        minTime = t;
                        minObj = b1;
                        mb = b;
                        resolving = T;
                    }
                }
            }
            for (const l of lines) {
                const u = l.intercept(b), t = u >= after && u <= 1 ? u : U;
                if (t !== U) {
                    if (t <= minTime) {
                        minTime = t;
                        minObj = l;
                        minU = l.u;
                        mb = b;
                        resolving = T;
                    }
                }
            }
            idx ++;
        }
        if (resolving) {
            if (minObj instanceof Ball) { mb.collide(minObj, minTime) }
            else { mb.collideLine(minObj, minTime, minU) }
            after = minTime;
        }
    }

}
function runSim(steps) {
    var i,allStopped = true;
    if (!tableClear) {
        while (steps--) {
            resolveCollisions(balls);
            i = 0;
            while (i < balls.length) {
                const b = balls[i];
                b.update();
                if (b.dead) { balls.splice(i, 1) }
                else {
                    if (b.speed > 0.1) { allStopped = false }
                    i++
                }
            }
        }
        if (balls.length === 1) {
            tableClear = true;
            setTimeout(rackBalls, 1000)
            return false;
        }
        return allStopped;
    }
    return !tableClear;
}
function ballNearMouse() {
    return balls.find(ball => (ball.x - mouse.tx) ** 2 + (ball.y - mouse.ty) ** 2 < BALL_SIZE_SQR );
}

function doMouseInterface() {
    const B = balls[0];
    runToStop = 1;
    if (game && game.awaitingShotResult) {
        game.update();
        mouse.button = 0;
    }

    if (B.hold) {
        B.x = mouse.tx;
        B.y = mouse.ty;
        if(isInD(B) && canAdd(B)) {
            if (mouse.button === 1) {
                mouse.button = 0;
                B.hold = false
                wait = 20;
            }
        } else {
            B.x = (frameCount / 30 | 0) % 2 ? head.x : - 100000;
            B.y = head.y;
        }
    } else {
        var dx, dy, an, dist;
        if (lockAngle) {
            if (!lockAngleLocked) {
                const vx = cos(fineAngle);
                const vy = sin(fineAngle);
                dx =  mouse.tx - B.x;
                dy =  mouse.ty - B.y;
                an = angleBetween(vx, vy, dx, dy)
                dist = lockDistTemp;
            } else {
                const vx = cos(lockAngleAt);
                const vy = sin(lockAngleAt);
                dx =  mouse.tx - B.x;
                dy =  mouse.ty - B.y;
                dist = vx * dx + vy * dy;
                lockDistTemp = dist;
                if (dist < -BALL_SIZE && mouse.button === 0) {
                    mouse.pull = 0;
                    mouse.spring = 0;
                    mouse.speed = 0;
                    mouse.pos = 0;
                    mouse.spin = 0;
                    lockAngleLocked = lockAngle = false;
                    mouse.button = 0;
                }
            }
        } else {
            dx =  mouse.tx - B.x;
            dy =  mouse.ty - B.y;
            an  = mouse.angle = atan2(dy , dx);
            dist = (dx * dx + dy * dy) ** 0.5;
        }
        if ((mouse.button & 1) === 1) {
            mouse.pull = min(maxPull / 2.5, (dist  - mouse.spring) / (10));
            message = undefined;
            messageTime = 0;
            if (messages.length) { messages.length = 0 }
            if ((mouse.button & 4) === 4) {
                if (lockAngleLocked) {
                    lockAngle = false;
                    an = lockAngleAt;
                }
                if (!lockAngle) {
                    lockAngleAt = fineAngleStart = fineAngle = an;
                    lockAngle = true;
                    lockAngleLocked = false;
                    lockDistTemp = dist;
                } else {
                    fineAngle += an
                    an = mouse.angleToHit = mouse.angle = lockAngleAt = fineAngleStart + (fineAngle - fineAngleStart) / 100;
                }
            } else if(lockAngle) {
                lockAngleLocked = true;
                an = mouse.angleToHit = mouse.angle = lockAngleAt
            } else { mouse.angleToHit = an }

            mouse.angleToHit = an;
            mouse.pos = mouse.spring;
            mouse.spring += mouse.pull;
            mouse.spring *= 0.95;
            SHOW_GUIDES && findFirstHit(B, an, balls)
        } else {
            if(lockAngle) {
                mouse.angle = lockAngleAt
            }
            if (mouse.speed === 0) {

                SHOW_GUIDES && findFirstHit(B, an, balls, true);

            }
            if (mouse.pull) {
                mouse.pos = mouse.spring;
                mouse.speed = 0;
            }
            mouse.pull = 0;
            mouse.spring *= 0.5;
            mouse.speed += mouse.spring
            mouse.pos -= mouse.speed;
            if (mouse.pos < 0) {
                B.vx = (cos(mouse.angleToHit + PI) * mouse.speed * mouse.mass) / BALL_MASS;
                B.vy = (sin(mouse.angleToHit + PI) * mouse.speed * mouse.mass) / BALL_MASS;
                mouse.pull = 0;
                mouse.spring = 0;
                mouse.speed = 0;
                mouse.pos = 0;
                mouse.spin = 0;
                lockAngleLocked = lockAngle = false;
            }
        }
        renderQue(B);
    }
}

function mainLoop() {
    var allStopped;
    wait && (wait--);
    frameCount ++;
    ctx = ctxGame;
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = TABLE_COLOR;
    ctx.strokeStyle = TABLE_MARK_COLOR;
    ctx.lineWidth = TABLE_MARK_LINE_WIDTH;
    ctx.fill(tableEdge);
    ctx.stroke(head.path);
    loadSaveBallPositions();

    allStopped = runSim(slowDevice ? 2 * runToStop : runToStop);
    wait > 0 && (allStopped = false);
    if (allStopped && !placeBalls && !balls[0].hold) { simpleGuide(balls[0]) }
    renderBalls();
    mouse.tx = (mouse.x - GAME_LEFT) / TABLE_SCALE;
    mouse.ty = (mouse.y - GAME_TOP) / TABLE_SCALE;

    if (!allStopped && (mouse.button & 4) === 4) {
        runToStop += 5;
        mouse.button = 0;
    }
    ctx = ctxMain;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(TABLE_SCALE,0,0,TABLE_SCALE,GAME_LEFT, GAME_TOP);
    ctxMain.drawImage(gameCanvas, 0,0);

    if (allStopped) {
        doMouseInterface();

    }



    mouse.oldX = mouse.tx;
    mouse.oldY = mouse.ty;
    requestAnimationFrame(mainLoop);
}


    

    angleBetween = (xa, ya, xb, yb) => {
		const l = ((xa * xa + ya * ya) * (xb * xb + yb * yb)) ** 0.5;
		var ang = 0;
		if (l !== 0) {
			ang = Math.asin((xa  * yb  - ya * xb) / l);
			if (xa  * xb  + ya * yb < 0) { return (ang < 0 ? -Math.PI: Math.PI) - ang }
		}
		return ang;
    }
    circlesInterceptUnitTime = (a, e, b, f, c, g, d, h, r1, r2) => { 
        const A = a * a, B = b * b, C = c * c, D = d * d;
        const E = e * e, F = f * f, G = g * g, H = h * h;
        var R = (r1 + r2) ** 2;
        const AA = A + B + C + F + G + H + D + E + b * c + c * b + f * g + g * f + 2 * (a * d - a * b - a * c - b * d - c * d - e * f + e * h - e * g - f * h - g * h);
        const BB = 2 * (-A + a * b + 2 * a * c - a * d - c * b - C + c * d - E + e * f + 2 * e * g - e * h - g * f - G + g * h);
        const CC = A - 2 * a * c + C + E - 2 * e * g + G - R;
        return Math.quadRoots(AA, BB, CC);
    }
    quadRoots = (a, b, c) => { // find roots for quadratic
        if (Math.abs(a) < 1e-6) { return b != 0 ? [-c / b] : []  }
        b /= a;
        var d = b * b - 4 * (c / a);
        if (d > 0) {
            d = d ** 0.5;
            return  [0.5 * (-b + d), 0.5 * (-b - d)]
        }
        return d === 0 ? [0.5 * -b] : [];
    }