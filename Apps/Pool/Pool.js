/*
Version 1.01
17-9-2023
    1. Added bad bounce indication when guides interact with pockets. Bounce is way too chaotic and incorrect guide prediction will frustrate player so now shows red fan off pocket edges rather than line.
       Added BAD_BOUNCE_SIZE and  BAD_BOUNCE_SPREAD constants 
       
    2. Extended guide distance and added constant GUIDE_DISTANCE
    


*/
import {$, $$, $R} from "../../src/DOM/geeQry.js";
import {startMouse} from "../../src/DOM/mouse.js";
import {simpleKeyboard} from "../../src/DOM/keyboard.js";
import {StartAudio} from "./Synth.js";

const playerAName = "Mark";
const playerBName = "Gaye";
const keyboard = simpleKeyboard();
keyboard.addKey("KeyA", "KeyS", "KeyD", "KeyW", "KeyN", "KeyP", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit0");
const keys = keyboard.keys;
mathExt(); // creates some additional math functions
const setup = location.href.split("?")[1]?.toLowerCase() ?? "";
var allowSpinControl = true;//setup.includes("spin");//true;//false;
var slowDevice = false;
const renderSetup = setup.split("render[")[1]?.split("]")[0].split("_") ?? [];
const RENDER_COMPLEX_BALLS = !renderSetup.includes("noshade");
const HAS_GAME_PLAY_API = false;
const RENDER_REFLEX = !renderSetup.includes("noreflect");//true && RENDER_COMPLEX_BALLS; // if true render aproximation of ball ball reflections

const [tableName, sGuides, sGuideComplex] = [setup.split("_")[0], setup.includes("guides"), setup.includes("complex") ];
const SHOW_GUIDES = sGuides;  // Show detailed guide
const SHOW_FIRST_CONTACT_ONLY = !sGuideComplex; // if SHOW_GUIDS then only to first contact ball. Else traces first ball as well
const POCKET_ROLL_IN_HELP = 0.2;   

/*
console.log("URL options: underscore seperated options.");
console.log("Table size one of 'small, medium, standard, large, huge, super'");
console.log("Options `guides_complex`");
console.log("Render options `render[noshade_noreflect]`");
*/

const tables = {
    small: {w: 38, h: 19}, 		// 7ft
    medium: {w: 44, h: 22}, 		// 8ft
    standard: {w: 47, h: 23.5}, 	// 8.5ft
    large: {w: 49, h: 24.5}, 	// 9ft
    huge: {w: 64, h: 32}, 		// 11ft
	super: {w: 88, h: 44}, 		// 16FT
}

const CUSH_W = tables[tableName]?.w ?? tables.standard.w;
const CUSH_H = tables[tableName]?.h ?? tables.standard.h;
const CUSH_REFERENCE_SIZE = 24;
const CUSH_SIZE_X = 20;
const CUSH_SIZE_Y = 20;
const INSET = CUSH_SIZE_X * 3.5;
const TABLE_DIMOND_SIZE = CUSH_SIZE_X * 0.2;
const TABLE_CANVAS_SIZE = {width: CUSH_SIZE_X * CUSH_W + INSET * 2, height: CUSH_SIZE_Y * CUSH_H + INSET * 2}
const TABLE_SCALE = (innerWidth * (2/3)) / TABLE_CANVAS_SIZE.width;
const BALL_BALL_COEF_RESTITUTION = 0.92; // 0.92 old dead balls 0.98 new springy balls
const BALL_RAIL_COEF_RESTITUTION = 0.6; // 0.6 old dead table 0.9 new springy table
const BALL_CLOTH_COEF_OF_ROLL = 0.0125; // between 0.005 and 0.015. This is an estimate full sim of ball roll not implemented
const BALL_CLOTH_COEF_OF_ROLL_A = 1 - BALL_CLOTH_COEF_OF_ROLL;
const BALL_SIZE = CUSH_SIZE_X ;
const BALL_SIZE_SQR = BALL_SIZE * BALL_SIZE;
const MASS_SCALE =  CUSH_REFERENCE_SIZE / CUSH_SIZE_X;
const BALL_MASS_SCALE = 1;
const BALL_MASS =  4 / 3 * Math.PI * (BALL_SIZE ** 3) * MASS_SCALE;
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
const GUIDE_DISTANCE = 3000;  // When guides on approx length of guides
const BAD_BOUNCE_SIZE = BALL_SIZE * 5;  // Size of bad bounce guide
const BAD_BOUNCE_SPREAD = BALL_SIZE * 1;  // Angle width in pixels of bad bounce guide

const TABLE_COLOR = "#080";  // Must short CSS hash color.
const TABLE_COLORS = ["#2A3","#293","#283","#273", "#263"];
//const WHITE_BALL = "#D8D6D4";
const WHITE_BALL = "#D8D6D4";
const WHITE_BALL_SCUFF = "#D4D6D8";
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
const SHADE_X = Math.cos(-Math.PI * 0.25) * BALL_SIZE;
const SHADE_Y = Math.sin(-Math.PI * 0.25) * BALL_SIZE;
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
const BALL_COUNT = colors.length;
const PW = POCKET_SIZE * 1.4, PW1 = POCKET_SIZE * 1.2, PW11 = POCKET_SIZE * 1.1, PW2 = POCKET_SIZE;
const PC = CUSH_W / 2, PI = 0.1, PI1 = 0.3, PI11 = 0.45, PI3 = 0.6;
const cush = [ // cushion pairs of coordinates forming top left corner (top left pocket and half top center pocket
    [0,      PW], [-PI,      PW1], [-PI1,      PW11],  [-PI11, PW2],      [-PI3 * 3, 0.5],  [-3 ,-1],
    [-1,    -3],  [0.5, -PI3 * 3], [PW2,       -PI11], [PW11, -PI1],      [PW1, -PI],       [PW, 0],
    [PC - PW, 0], [PC - PW1, -PI], [PC - PW11, -PI1],  [PC - PW2, -PI11], [PC - PW2, -PI3], [PC - PW2, -PI3 * 3], [PC - PW2, -4],
];
cush.push(... cush.map(xy => [CUSH_W - xy[0], xy[1]]).reverse());
cush.push(... cush.map(xy => [xy[0], CUSH_H - xy[1]]).reverse());
const MAX_RESOLUTION_CYCLES = 1200;  // debug inifinit loop protection
const SHOW_COLLISION_TIME = 30;      // debug
const TABLE_TOP = 0;
const TABLE_LEFT =  0;
const TABLE_BOTTOM = CUSH_SIZE_Y * (CUSH_H);
const TABLE_RIGHT = CUSH_SIZE_X * (CUSH_W);

const soundSettings = {
	pocketSpeedNorm: 15,
	pocketMinVol: 0.2,
	pocketFreqSpread: 0.2,
	collideSpeedNorm: 60,  // normalize speed volume range from minVol to 1 
	collideVolCurve: 1.5,  // normalized speed volume curve. f(v) = v ** volCurve
	collideMinVol: 0.02,
	collideFreqSpread: 0.2,
	masterVol: 1,
	sounds: [
	  ["cueHit","CueHitLowQ.ogg"],
	  ["pocket","PocketLowQ.ogg"], 
	  ["pocket2","PocketLowQ2.ogg"],
	],
	instancedSounds: [
	  ["baLLCollide","BaLLCollideLowQ.ogg"],
	],
	soundsHigh: [
	  ["cueHit","CueHitMono1.ogg"],
	  ["pocket","Pocket.ogg"],
	  ["pocket2","Pocket2.ogg"],
	],
	instancedSoundsHigh: [
	  ["baLLCollide","BaLLCollideMono1.ogg"],
	],
}
soundSettings.COLLISION_FREQ_SPREAD = colors.map(()=> Math.random() * soundSettings.collideFreqSpread + 1 - soundSettings.collideFreqSpread * 0.5);
var soundPlayCount = 0
var soundsReady = false, channelReadyCount = 0;
var synth, soundIFX, soundFX;
function DelayAudioStart() {
    synth = StartAudio(soundSettings.masterVol);
    synth.volume = soundSettings.masterVol;
    soundIFX = synth.loadSounds("InstancedSoundFX",() => {
        console.log("InstancedSoundFX ready");
        channelReadyCount++;
        soundsReady = channelReadyCount === 2;
        soundIFX.init(balls.length);
        
    }, ...soundSettings.instancedSounds);
    soundFX = synth.loadSounds("SoundFX",() => {
        console.log("SoundFX ready");
        channelReadyCount++;
        soundsReady = channelReadyCount === 2;
        soundFX.init();
    }, ... soundSettings.sounds);
}

var ctx;
const canvas = $("canvas", {className: "mainCanvas", width: innerWidth, height: innerHeight});
const gameCanvas = $("canvas", TABLE_CANVAS_SIZE);
const overlay = $("canvas", TABLE_CANVAS_SIZE);
const sprites = $("canvas", {width: BALL_SIZE * 8, height: BALL_SIZE * 3});
const pocketed = $("canvas", {width: BALL_SIZE * 16 * 2, height: BALL_SIZE * 3});
const ctxMain = canvas.getContext("2d");
const ctxGame = ctx = gameCanvas.getContext("2d");
const spriteCtx = sprites.getContext("2d");
const pCtx = pocketed.getContext("2d");
const badBounceFill = ctx.createRadialGradient(0,0, 0, 0,0, BAD_BOUNCE_SIZE);
badBounceFill.addColorStop(0,  "#F00F");
badBounceFill.addColorStop(0.7,"#8008");
badBounceFill.addColorStop(1,  "#8000");

var pocketPos = 0;
var pocketedBalls = [];
sprites.layout = {};
if  (HAS_GAME_PLAY_API) {
    const gameInfo = $$(
        $("div", {id: "infoContainer", className: "info"}),
            $("div", {id: "playerAName", className: "playerName left"}),
            $("div", {id: "gameStatus", textContent: "V", className: "gameStatus center"}),
            $("div", {id: "playerBName", className: "playerName right"}),
            $$(
                $("div", {id: "statusContainer", className: "status line1"}),
                    $("div", {id: "playerAInfo", className: "playerInfo left"}),
                    $("div", {id: "playerBInfo", className: "playerInfo right"}),
            ),
            $$(
                $("div", {id: "statusContainer", className: "status line2"}),
                    $("div", {id: "playerASide", className: "side left"}),
                    $("div", {id: "playerBSide", className: "side right"}),
            ),

    );
    const ballContainer = $$(
        $("div", {id: "ballContainer", className: "bottomLine",style: {
            left: ((innerWidth - BALL_SIZE * (14 * 2 + 1) * TABLE_SCALE) / 2) + "px",
            right: innerWidth - (innerWidth - (BALL_SIZE * (14 * 2 + 1) * TABLE_SCALE) / 2) + "px",
        }}),
            $("canvas", {
                id: "pocketedBalls",
                width: BALL_SIZE * (14 * 2 + 1) * TABLE_SCALE,
                height: BALL_SIZE * 4 * TABLE_SCALE,

            })
    );
    $$(document.body, canvas, gameInfo, ballContainer)
    pocketedBalls.getContext("2d");
} else { $$(document.body, canvas) }
const defaultPlayer = {
    CUE_DARK_COLOR: "#842",
    CUE_LIGHT_COLOR: "#CB6",
    CUE_JOIN_COLOR: "#CA2",
};


document.addEventListener('mousedown', DelayAudioStart, {once: true});

/*var firstHit = 0;
const game = {
    smalls: [2,3,4,5,6,7,8],
    bigs: [9,10,11,12,13,14,15],
    playerA: {
        name: "Champ",
        side: "Nothing down",
        status: "Waiting to play",
        nameEl: playerAName,
        infoEl : playerAInfo,
        sideEl : playerASide,
        pocketed: [],
        isBigs: false,
        isSmalls: false,
        left: true,
        turns: 0,
        CUE_DARK_COLOR: "#842",
        CUE_LIGHT_COLOR: "#CB6",
        CUE_JOIN_COLOR: "#CA2",
        foul() {
            this.turns = 0;
            this.status = "Fouls";
        },
        award() {
            this.turns = !game.onBreak  && (this.isBigs || this.isSmalls) ? 2 : 1;
            this.status = this.turns === 2 ? "Awarded 2 shots" : "1 shot";
        },
        update(status) {
            this.nameEl.textContent = this.name;
            this.infoEl.textContent = (this.status ? this.status + " " : "")+ status;
            this.status = "";
            this.sideEl.textContent =  this.isBigs ? "Bigs" : this.isSmalls ? "Smalls" : "";
        },
    },
    playerB: {
        name: "Chalanger",
        side: "Nothing down",
        status: "Waiting to play",
        nameEl: playerBName,
        infoEl : playerBInfo,
        sideEl : playerBSide,
        pocketed: [],
        isBigs: false,
        isSmalls: false,
        left: false,
        turns: 0,
        CUE_DARK_COLOR: "#200",
        CUE_LIGHT_COLOR: "#BA5",
        CUE_JOIN_COLOR: "#CCC",
        foul() {
            this.turns = 0;
            game.playerA.turns = 2;
            this.status = "Fouls";
        },
        award() {
            this.turns = !game.onBreak  && (this.isBigs || this.isSmalls) ? 2 : 1;
            this.status = this.turns === 2 ? "Awarded 2 shots" : "1 shot";
        },
        update(status) {
            this.nameEl.textContent = this.name;
            this.infoEl.textContent = (this.status ? this.status + " " : "")+ status;
            this.status = "";
            this.sideEl.textContent = this.isBigs ? "Bigs" : this.isSmalls ? "Smalls" : "";
        },
    },
    current: null,
    nextUp: null,
    ctx: pocketedBalls.getContext("2d"),
    gameOver: false,
    onBreak: true,
    foul: false,
    cueFoul: false,
    set pocketed(ball) {
        const c = this.current;
        const nu = this.nextUp;
        if (ball.id === 0) {
            this.status = c.name + " downs Cue ball";
            this.cueFoul = true;
            this.foul = true;
            c.foul();
            c.status = "Pockets que ball";
            nu.award();
        } else if (ball.id === 1) {  // 8 ball
            sunk.addBall(ball, 0);
            if (c.pocketed.length === 7) {
                if (this.foul) {
                    c.status = "Fouls on 8 Ball!";
                    nu.status = "Winner by technicalaty";
                } else {
                    c.status = "Winner!!"
                    nu.status = "Defeated";

                }
                this.status = "Game Over";
            } else if (!c.isBigs && !c.isSmalls) {
                c.status = "Pockets 8 Ball!";
                nu.status = "To break";
                this.status = "DRAW";

            } else {
                c.status = "Pockets 8 Ball FOUL";
                nu.status = "Winner by technicalaty";
                this.status = "Game Over";
            }
            this.gameOver = true;

        } else if (ball.id > 1) {
            const bigs = this.bigs.includes(ball.id);
            if (!c.isBigs && !c.isSmalls) {
                c.isBigs = bigs;
                c.isSmalls = !bigs;
                firstHit = ball.id;
                nu.isBigs = !bigs;
                nu.isSmalls = bigs;
                c.pocketed.push(ball.id);
                sunk.addBall(ball, 0);
                if (!this.foul) { c.turns += 1 }
                this.status = (c.left ? "< " + c.name : "") + " " + (bigs ? " BIGS" : " SMALLS") + (c.left ? "" : " " + c.name + " >");
                this.updateStatus();
            } else {
                var side;
                if (c.isBigs) {
                    if (bigs) {
                        c.turns += this.foul ? 0 : 1;
                        c.status = "Pockets " + (ball.id - 1) + " ball";
                        c.pocketed.push(ball.id);
                        side = c;
                    } else {
                        c.foul();
                        c.status = "Foul pockets Small";
                        nu.award();
                        this.foul = true;
                        nu.pocketed.push(ball.id);
                        side = nu;
                    }
                } else {
                    if (bigs) {
                        c.foul();
                        c.status = "Foul pockets Big";
                        nu.award();
                        this.foul = true;
                        nu.pocketed.push(ball.id);
                        side = nu;
                    } else {
                        c.status = "Pockets " + (ball.id - 1) + " ball";
                        c.turns += this.foul ? 0 : 1;
                        side = c;
                        c.pocketed.push(ball.id);
                    }
                }
                if (side.left) {
                    sunk.addBall(ball, 0);
                } else {
                    sunk.addBall(ball, 1);
                }
            }
        }

    },
    status: "",
    update() {
        var cS = "", nuS = ""; // ply current and next up status
        if (!this.current) {
            this.current = this.playerA;
            this.nextUp = this.playerB;
        }
        if (this.awaitingShotResult) {
            this.awaitingShotResult = false;
            let c = this.current;
            let nu = this.nextUp;
            if (c.isSmalls || c.isBigs) {
                if (firstHit > 1) {
                    const bigs = this.bigs.includes(firstHit);
                    const smalls = this.smalls.includes(firstHit);
                    if ((bigs && c.isSmalls) || (smalls && c.isBigs)) {
                        if(!this.cueFoul) {
                            c.foul();
                            c.status = "Foul contacts " + (bigs ? "Bigs" : "Smalls");
                            nu.award();
                        }
                    }
                } else if (firstHit === 1 && c.pocketed.length < 7 && !this.cueFoul) {
                    c.foul();
                    c.status = "Foul contacts 8 Ball";
                    nu.award();
                }  else if (firstHit === 0 && !this.cueFoul) {
                    c.foul();
                    c.status = "Foul no contact";
                    nu.award();
                }
            } else if(firstHit === 0 && !this.cueFoul) {
                c.foul();
                c.status = "Foul no contact";
                nu.award();
            } else if(firstHit === 1) {}

            if (!this.gameOver) {
                if (c.turns === 0) {
                    nuS = "Awaiting turn";
                    cS = "To play";
                    [this.nextUp, this.current] = [c, nu];
                    c = this.current;
                    c.turns = c.turns ? c.turns : 1;
                } else {
                    cS = "To shoot";
                    nuS = "Awaiting turn";
                }
                const status = c.isBigs || c.isSmalls ? c.name + (c.pocketed.length === 7 ? " on 8Ball " : " "): "Nothing Down";
                this.status = (c.left ? (c.turns > 1 ? "<<" : "<") :"") + " " + status + (c.left ? "" :(c.turns > 1 ? " >>" : " >"));
            }
            this.onBreak = false;
        }
        this.current.update(cS);
        this.nextUp.update(nuS);
        gameStatus.textContent = this.status;
        this.cueFoul = false;
        this.foul = false;
    },
    updateStatus() { gameStatus.textContent = this.status },
    startGame() {
        this.onBreak = true;
        this.current.status = "To break";
        this.current.turns = 1;
        this.current.pocketed.length = 0;
        this.current.isBigs = false;
        this.current.isSmalls = false;
        this.nextUp.status = "Awaiting turn";
        this.nextUp.turns = 0;
        this.nextUp.pocketed.length = 0;
        this.nextUp.isBigs = false;
        this.nextUp.isSmalls = false;
        this.status = "Nothing down";
        this.update();
    },
    awaitingShotResult: false,
    set firstHit(ball) { firstHit = ball.id },
    shoots() {
        this.current.turns -= 1;
        firstHit = 0;
        this.awaitingShotResult = true;
    },
};
*/
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
	spinMode: false,
    mass: (MOUSE_TIP + MOUSE_END) * 0.5  * Math.PI * MOUSE_LENGTH * MASS_SCALE
});
var maxPull = BALL_SIZE * BALL_MASS / mouse.mass;
var wait = 0, tableEdge, tempQueBall, tempBall, tableClear = false, placeBalls = false, ballToPlace;
var message = "Welcome to POOL SIM.";
const messages = [
    "Left click & drag que for power, release to shoot.",
    //"While dragging press and hold W,A,S,or D to add spin.",
    "While lining shot hold [S] to setup cue ball spin.",
    "Before taking a shot, right click to enter placement mode",

]
var messageTime = 220;
var lockAngle = false;
var lockAngleLocked = false;
var lockDistTemp = 1;
var lockAngleAt = 0;
var fineAngleStart = 0;
var fineAngle = 0;
var runToStop = 1;
var frameCount = 0;
const allBalls = new Array(BALL_COUNT).fill(), balls = new Array(BALL_COUNT).fill();
const lines = [], pockets = [], contacts = [], positionSaves = [[],[],[],[]];
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

function Line(x1, y1, x2, y2, isPocket) {
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
    this.isPocket = isPocket;
}
Line.prototype = {
    intercept(ball) { // only if ball approching from right side (as if standing on start looking to end). Undefined if no intercept
        const x = this.vx, y = this.vy;
        const d = ball.vx * y - ball.vy * x;
        if (d > 0) {  // only if moving towards the line
            const rScale = BALL_SIZE * this.lenInv;
            const nx = ball.y - (this.y1 + x * rScale);
            const ny = ball.x - (this.x1 - y * rScale);
            const u1 = this.u = (ball.vx * nx - ball.vy * ny) / d;
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
            if (xe!== undefined) { // if near ends of line check end point as vector intercept circle
                const vx = ball.vx, vy = ball.vy, v1Sqr = vx * vx + vy * vy;
                const xx = ball.x - this.x1, yy = ball.y - this.y1, blSqr = xx * xx + yy * yy;
                var b = -2 * (xx * vx + yy * vy);
                const c = 2 * v1Sqr;
                const d = (b * b - 2 * c * (blSqr - BALL_SIZE_SQR)) ** 0.5;
                if (isNaN(d)) { return }
                return (b - d) / c;
            }
        }
    }
}
/*class SubPos {
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    time = 0;
    constructor(x, y, vx, vy, time) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.time = time;
    }
    
};*/
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
    this.roll = {x:0, y: Math.rand(0,Math.TAU), z: Math.rand(0,Math.TAU)};
    this.applyRoll();
    this.dead = false;
    this.hold = false;
	this.dark = 0;
    this.alpha = 1;
    /*this.movement = [];*/
	if (RENDER_REFLEX) {
		this.closeIdx = [];
		this.closeCount = 0;
		this.addClose = false;
	}
    if (this.id === 0) {
        this.startX = this.x;
        this.startY = this.y;
        this.spin = 0;
        this.spinDirection = 0;
    }
}
Ball.prototype = {
    update() {
        var da, roll, spx = this.vx, spy = this.vy;
        if (allowSpinControl && this.id === 0 && Math.abs(this.spin) > 0) {
            const amount = this.spin * BALL_SIZE;
            this.spin *= 0.96;
            this.vx += (spx = Math.cos(this.spinDirection)) * amount *0.01
            this.vy += (spy = Math.sin(this.spinDirection)) * amount *0.01
        }
        const vx = this.vx;
        const vy = this.vy;
        const sSqr = vx * vx + vy * vy, speed = sSqr ** 0.5;
        const tSqr = sSqr / TABLE_SCALE, tSpeed = speed / TABLE_SCALE;
        if (tSpeed > 0.1) {
            if (tSpeed < 4) {
                da = (tSqr * (4.5 + 9 * 4 - tSqr)) / (BALL_MASS * BALL_MASS_SCALE);
            } else {
                da = (tSqr * 4.5) / (BALL_MASS * BALL_MASS_SCALE);  // accel due to drag
            }
            const nx = vx / speed;
            const ny = vy / speed;
            this.vx -= nx * da;
            this.vy -= ny * da;
            //this.vx *= 0.985;
            //this.vy *= 0.985;
            
            this.vx *= BALL_CLOTH_COEF_OF_ROLL_A;
            this.vy *= BALL_CLOTH_COEF_OF_ROLL_A;
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
        this.speed = (this.vx * this.vx + this.vy * this.vy) ** 0.5;
        const dir = Math.atan2(this.vy, this.vx);		
        this.testPockets();
        if (allowSpinControl && this.id === 0 && this.speed > 0) {
            if(Math.abs(this.spin) < 2) {
                const f = Math.abs(this.spin) / 2;
                this.roll.y =  this.spin * f + (this.speed / BALL_SIZE) * (1-f);
                this.roll.z =  this.spinDirection  * f  + dir * (1-f);
            } else {
                const off = Math.angleBetween(this.vx, this.vy, spx, spy);
                this.roll.z = this.spinDirection = this.spinDirection - dir * Math.sin(off) * 0.01;
                this.roll.y =  this.spin + (this.speed / BALL_SIZE) * Math.cos(off);
            }
        } else {
            this.roll.z = dir;
            this.roll.y =  this.speed / BALL_SIZE;
        }
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
				const pScale = POCKET_ROLL_IN_SCALE + (this.id > 1 ? POCKET_ROLL_IN_HELP : 0);
                if (dist < POCKET_SIZE_PX * pScale) {
                    const a = (1 - dist / (POCKET_SIZE_PX* pScale)) ** 1.2;
                    this.vx = this.vx * (1 - (a * 0.2)) + px / dist * a;
                    this.vy = this.vy * (1 - (a * 0.2)) + py / dist * a;
					const zz = this.z;
                    this.z = a ** 5;
					this.speed = ((zz - this.z) ** 2 + this.vx * this.vx + this.vy * this.vy) ** 0.5;
					this.dark = Math.min(1, Math.max(0, Math.max(this.dark, this.z)));
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
		const soundPan =  ((this.x - TABLE_LEFT) / (TABLE_RIGHT - TABLE_LEFT)) * 2 - 1;
        this.x = this.startX - 10000;
        this.y = this.startY - 10000;
        game && (game.pocketed = this);
        this.vx = 0;
        this.vy = 0;
        if (this.id === 0) {
			!this.hold && soundsReady && soundFX(
				(Math.random() < 0.5 ? "pocket" : "pocket2"), 
				0, 0, 
				Math.max(soundSettings.pocketMinVol, Math.min(0.5, this.speed / soundSettings.pocketSpeedNorm)),  
				Math.random() * soundSettings.pocketFreqSpread + 1 - soundSettings.pocketFreqSpread / 2,
				soundPan,
			);
            this.hold = true;
            this.vx = 0;
            this.vy = 0;
            this.z = 0;
            this.spin = 0;
        } else  {
            this.dead = true;
			const pCtx = pocketed.getContext("2d");
			this.addClose = false;
			pocketedBalls.push(this);
			drawPocketed();
			soundsReady && soundFX(
				(Math.random() < 0.5 ? "pocket" : "pocket2"), 
				0, 0, 
				Math.max(soundSettings.pocketMinVol, Math.min(1, this.speed / soundSettings.pocketSpeedNorm)), 
				Math.random() * soundSettings.pocketFreqSpread + 1 - soundSettings.pocketFreqSpread / 2,
				soundPan,
			);
        }
		this.dark = 0;
    },
    applyRoll() { // rotate in direction of movement for visuals only
        var c = this.center;
        var xd = Math.cos(this.roll.z);
        var yd = Math.sin(this.roll.z);
        const cpy = Math.cos(this.roll.y);
        const spy = Math.sin(this.roll.y);
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
    applyRotate() { // rotates only about Z axis
        var c = this.center;
        const ax = Math.cos(this.roll.z);
        const ay = Math.sin(this.roll.z);
        var x = c.x, y = c.y;
        c.x = x * ax - y * ay;
        c.y = x * ay + y * ax;
        if (this.id > 8 || !this.id) {
            c = this.centerS;
            x = c.x;
            y = c.y;
            c.x = x * ax - y * ay;
            c.y = x * ay + y * ax;
        }
    },
    drawSprite(spr, offX, offY, scale = 1) {
        const w = spr.w, h = spr.w;
        ctx.setTransform(scale,0,0,scale, this.x + offX,  this.y + offY);
        ctx.drawImage(sprites, spr.x, spr.y, w, h, - w / 2,  - h / 2, w, h);
    },
    /*drawSpriteBlur(spr, offX, offY, scale = 1) {
        var x = this.x;
        var y = this.y;

        var vx = this.vx;
        var vy = this.vy;       

        this.alpha = 0.07;
        var t = 0;
        
        this.x = x - vx;
        this.y = y - vy;

        
        this.render()
        while (t <= 1.05) {
            t += 0.1;
            this.x = x - vx + vx * t;
            this.y = y - vy + vy * t;      
            ctx.globalAlpha = this.alpha;            
            this.drawSprite(spr, offX, offY, scale)
            
        }
        
        this.alpha = 1;
        this.x = x;
        this.y = y;
        ctx.globalAlpha = this.alpha;

    },    
    renderBlur() {
        var x = this.x;
        var y = this.y;
        var z = this.z;
        var vx = this.vx;
        var vy = this.vy;       

        this.alpha = 0.2;
        var t = 0;
        
        this.x = x - vx;
        this.y = y - vy;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        
        this.render()
        while (t <= 1.05) {
            t += 0.1;
            this.x = x - vx + vx * t;
            this.y = y - vy + vy * t;            
            this.render()
            
        }
        
        this.alpha = 1;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        
    },*/
    render(scale = 1) {
        var cx, cy, cz;
        ctx.globalAlpha = this.alpha;
        if (this.id === 0) {
            ctx.fillStyle = this.col;
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }
        const c = this.center;
        const cS = this.centerS;
        ctx.setTransform(scale, 0, 0, scale, this.x, this.y);
        ctx.fillStyle = this.col;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        if (this.id) {
            if (this.id > 8) {
                this.drawSection(c.x,c.y,c.z, MARK_SIZE)
                this.drawSection(cS.x,cS.y,cS.z, MARK_SIZE_S)
            } else {
                this.drawSection(c.x,c.y,c.z, MARK_SIZE_S)
            }
        } else if (allowSpinControl){
            this.drawSection(c.x,c.y,c.z, BALL_SIZE * 0.2, WHITE_BALL_SCUFF);
            this.drawSection(cS.x,cS.y,cS.z, BALL_SIZE * 0.2, WHITE_BALL_SCUFF);
        }
		
		const OVER_SCALE = 1.1;
		if (RENDER_COMPLEX_BALLS) {
            ctx.globalAlpha = this.alpha;
			ctx.globalCompositeOperation = "multiply";
			this.drawSprite(sprites.layout.shade, 0, 0, scale * OVER_SCALE * 0.9);
			ctx.globalCompositeOperation = "lighter";
			ctx.globalAlpha = 1/3 * this.alpha;
			this.drawSprite(sprites.layout.light, 0, 0, scale * OVER_SCALE);
			ctx.globalAlpha = this.alpha;
			this.drawSprite(sprites.layout.spec, 0, 0, scale * OVER_SCALE);
		}
		
		ctx.globalCompositeOperation = "source-over";		
        if (this.z > 0) {
            ctx.fillStyle = "#000";
            ctx.globalAlpha =  this.dark * this.alpha;//(this.z < 0 ? 0 : this.z> 1 ? 1 : this.z);
            ctx.beginPath();
            ctx.arc(0, 0, BALL_SIZE, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = this.alpha;
        }
		if (RENDER_REFLEX) {
			var i = this.closeCount;
			ctx.setTransform(scale, 0, 0, scale, 0,0);
			const near = 0.615, far = 0.250
			//ctx.globalCompositeOperation = "lighter";
			ctx.globalCompositeOperation = "screen";
			while (i-- > 0) {
				
				const t = allBalls[this.closeIdx[i]];
				const dx = t.x - this.x;
				const dy = t.y - this.y;
				const dist = (dy * dy + dx * dx) ** 0.5;
				const dir = Math.atan2(dy, dx);
				if (dist >= BALL_SIZE && dist < BALL_SIZE * 4) {
					const zz = (dist - (BALL_SIZE)) / (BALL_SIZE * 3);
					const a = (far - near) * zz + near;
					const offDx = Math.cos(a);
					const offDy = Math.sin(a);
					const nx = dx / dist;
					const ny = dy / dist;
					ctx.globalAlpha = ((1 - ((dist-BALL_SIZE * 2) / (BALL_SIZE * 4))) ** 2 * 0.4)  * this.alpha;
					ctx.fillStyle = t.col;
					ctx.beginPath();				
					ctx.ellipse(
						this.x + nx * BALL_SIZE * offDx, 
						this.y + ny * BALL_SIZE * offDx, 
						BALL_SIZE * 0.5 * offDy, 
						BALL_SIZE * offDy,
						dir, 
						Math.PI * 0.5,  
						Math.PI * 1.5
					);
					ctx.arc(this.x, this.y, BALL_SIZE, dir - a, dir + a);
					ctx.fill();
				}
			}
			ctx.globalCompositeOperation = "source-over";	
			ctx.globalAlpha = this.alpha;
			this.closeCount = 0;
		}
    },
    drawSection(cx, cy, cz, sr, col = WHITE_BALL) { // sr section radius
        const R = BALL_SIZE / sr;
        var len = (cx * cx + cy * cy) ** 0.5;
        len = len < -1 ? -1 : len > 1 ? 1 : len;
        const eDir = Math.atan2(cy, cx), rDir = eDir + Math.PI;
        const pheta = Math.asin(len);
        var A = Math.cos(Math.asin(1 / R)) * R;
        var tx = Infinity;
        const c1 = Math.sin(pheta) * A;
        const c2 = 1 / (Math.cos(pheta) ** 2);
        const roots = Math.quadRoots(c2 - 1, -2 * c1 * c2, c1 * c1 * c2 + R * R - 1.001);
        roots.length > 0 && (tx = (roots.length === 1 ? roots[0]: (roots[0] + roots[1]) * 0.5) * sr);
        const exr = Math.abs(Math.cos(pheta)) * sr;
        A *= sr;
        const x = cx * A, y = cy * A;
        ctx.fillStyle = col;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        if (tx >= BALL_SIZE) {
            cz < 0 ?
                ctx.ellipse( x,  y, exr, sr, eDir, 0, Math.TAU):
                ctx.ellipse(-x, -y, exr, sr, eDir, 0, Math.TAU);
        } else {
            const ab = Math.acos(tx / BALL_SIZE);
            const bb = Math.acos((tx - len * A) / exr);
            if (cz < 0) {
                ctx.arc(0, 0,  BALL_SIZE, eDir - ab, eDir + ab);
                ctx.ellipse( x,  y, exr, sr, eDir, bb, -bb + Math.TAU);
            } else {
                ctx.arc(0, 0,  BALL_SIZE, rDir - ab, rDir + ab);
                ctx.ellipse(-x, -y, exr, sr, rDir, bb, - bb);
            }
            ctx.fill();
            ctx.beginPath();
            if (cz > 0) {
                ctx.arc(0, 0, BALL_SIZE, eDir - ab, eDir + ab);
                ctx.ellipse( x,  y, exr, sr, eDir, bb, -bb + Math.TAU, true);
            } else {
                ctx.arc(0, 0,  BALL_SIZE, rDir - ab, rDir + ab);
                ctx.ellipse(-x, -y, exr, sr, rDir, bb, -bb, true);
            }
        }
        ctx.fill();
		
    },
	interceptBallTimeNorm(b, time) {
        const x = b.x - this.x;
        const y = b.y - this.y;
        const dist = (x * x + y * y) ** 0.5;
        if (dist > BALL_SIZE * 2) {
            const t = Math.circlesInterceptUnitTime(
                this.x, this.y, this.vx, this.vy,
                b.x, b.y, b.vx, b.vy,
				dist, x, y,
                BALL_SIZE, BALL_SIZE
            );
            if (t >= time && t <= 1) { return t }
        }
    },   
	interceptBallTimeRefl(b, time, idx, idx1) {
        const x = b.x - this.x;
        const y = b.y - this.y;
        const dist = (x * x + y * y) ** 0.5;
		if (this.addClose && dist < BALL_SIZE * 4 && !this.dead && !b.dead) {
			this.closeIdx[this.closeCount++] = b.id;
			b.closeIdx[b.closeCount++] = this.id;			
		}
        if (dist > BALL_SIZE * 2) {
            const t = Math.circlesInterceptUnitTime(
                this.x, this.y, this.vx, this.vy,
                b.x, b.y, b.vx, b.vy,
				dist, x, y,
                BALL_SIZE, BALL_SIZE
            );
            if (t >= time && t <= 1) { return t }
        }
    },   
    collideLine(l, time, lineU, notInPlay = false) {  // lineU is unit position on line. If outside 0-1 then has hit end points of line
        var x1, y1;
        this.x += this.vx * time;
        this.y += this.vy * time;
        if (lineU < 0 || lineU > 1) { // if end point use line to end point rotated 90deg as line
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
        this.vx = (nx * u - this.vx) * BALL_RAIL_COEF_RESTITUTION;
        this.vy = (ny * u - this.vy) * BALL_RAIL_COEF_RESTITUTION;
        this.x -= this.vx * time;
        this.y -= this.vy * time;
		this.speed = (this.vx * this.vx + this.vy * this.vy) ** 0.5;
        if (l.isBehindPocket && !notInPlay) { this.downPocket() }
		
    },
    collide(b, time) {  // Ball hits ball at time. ( time == 0 == previouse frame, time == 1 == this frame )
        const a = this;
        a.x = a.x + a.vx * time;
        a.y = a.y + a.vy * time;
        b.x = b.x + b.vx * time;
        b.y = b.y + b.vy * time;
        const x = a.x - b.x, y = a.y - b.y;
        const d = (x * x + y * y);
        const u1 = a.vx * x + a.vy * y;
        const u2 = a.vy * x - a.vx * y;
        const u3 = b.vx * x + b.vy * y;
        const u4 = b.vy * x - b.vx * y;
        b.vx = ((x * u1 - y * u4) / d) * BALL_BALL_COEF_RESTITUTION;
        b.vy = ((y * u1 + x * u4) / d) * BALL_BALL_COEF_RESTITUTION;
        a.vx = ((x * u3 - y * u2) / d) * BALL_BALL_COEF_RESTITUTION;
        a.vy = ((y * u3 + x * u2) / d) * BALL_BALL_COEF_RESTITUTION;
        a.x = a.x - a.vx * time;
        a.y = a.y - a.vy * time;
        b.x = b.x - b.vx * time;
        b.y = b.y - b.vy * time;
		b.speed = (b.vx * b.vx + b.vy * b.vy) ** 0.5;
		a.speed = (a.vx * a.vx + a.vy * a.vy) ** 0.5;
    },
    advancePos(time, speed) {
        this.x = this.x + this.vx * time;
        this.y = this.y + this.vy * time;
        if (speed > 0) {
            const s = (this.vx * this.vx + this.vy * this.vy) ** 0.5;
            if (s > 0) {
                this.vx = (this.vx / s) * speed;
                this.vy = (this.vy / s) * speed;
            }
        }
    },
    shadowOf() { return {id: this.id, x: this.x, y: this.y, dead: this.dead} },
    fromShadow(shadow) { Object.assign(this, {...shadow, vx: 0, vy: 0, z:0}) }

}
Ball.prototype.interceptBallTime = RENDER_REFLEX ? Ball.prototype.interceptBallTimeRefl : Ball.prototype.interceptBallTimeNorm; 
function canAdd(ball) { // test if safe to add ball (no overlap)
    if (ball.x < TABLE_LEFT + INSET + BALL_SIZE || ball.y < TABLE_TOP + INSET + BALL_SIZE ||
        ball.y > TABLE_BOTTOM + INSET - BALL_SIZE || ball.x > TABLE_RIGHT+ INSET - BALL_SIZE) {
        return false;
    }

    for (const b of balls) {
        if (b && ball !== b && ((b.x - ball.x) ** 2 + (b.y - ball.y) ** 2) < (BALL_SIZE_SQR * 4)) { return false }
    }
    return true;
}
function isInD(ball) {
    if (ball.x <= head.x) {
        const dx = ball.x - head.x;
        const dy = ball.y - head.y;
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
function drawPocketed() {
	
	const pb = pocketedBalls;
	var i = 0;
	for (; i < pb.length; i++) {
		const b = pb[i];
		b.closeCount =  0;
		b.x = (i + 1) * BALL_SIZE * 2.001;
		b.y = BALL_SIZE;
        if (RENDER_REFLEX) {
            if (i > 0) { b.closeIdx[b.closeCount++] = pb[i - 1].id } 
            if (i + 1 < pb.length) { b.closeIdx[b.closeCount++] = pb[i + 1].id }
        }
		
	}
	pCtx.clearRect(0, 0, pocketed.width, pocketed.height);
	for (const b of pb) {
	    renderBall(pCtx, b.x, b.y, b, 1);
	}
}			
function renderBall(ctxDest, x, y, ball, scale = TABLE_SCALE) {
    const c = ctx;
    ctx = ctxDest;
    const bx = ball.x;
    const by = ball.y;
    ball.x = x;
    ball.y = y;
    ball.z = 0;
    ball.render(scale);
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
    for (const b of balls) { (!b.dead || b.id === 0) && b.render() }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
	var h = 0, t = 0;
	while (h < balls.length) {
		if (balls[h].dead) { h ++ }
		else { balls[t++] = balls[h++] }
	}
	balls.length = t;
			
}
const sunk = HAS_GAME_PLAY_API ? {} : {}
/*    balls: [],
    left: 0,
    addBall(ball, side) {
        if (this.left ===  0) {
            this.left = ctxMain.canvas.width / 2 + (BALL_SIZE  * 14 * TABLE_SCALE);// - BALL_SIZE;
            this.leftStart = this.left - BALL_SIZE * 2 * 14 * TABLE_SCALE;
            this.startY = ctxMain.canvas.height  - BALL_SIZE * 3 * TABLE_SCALE;
            this.sx = (this.left - this.leftStart) / TABLE_SCALE;
            this.sy = BALL_SIZE * 2;
            const distSqr = (this.sx * this.sx + this.sy * this.sy), dist = distSqr ** 0.5;
            this.nx = this.sx / dist;
            this.ny = this.sy / dist;
            this.dir = Math.atan2(this.sy, this.sx);
        }
        ball.x = 0;
        ball.y = 0;
        ball.vx = 0;
        ball.vy = 0;
        ball.speed = 0;
        ball.side = 0;//side;
        this.balls.push(ball);
    },

    animate() {
        const ctx = ctxMain;
        var idx = 0, idx1;
        ctx.setTransform(TABLE_SCALE,0,0,TABLE_SCALE,this.leftStart*TABLE_SCALE,this.startY*TABLE_SCALE);
        while(idx < this.balls.length) {
            const ball = this.balls[idx];
            const ball1 = this.balls[idx-1];
            ball.speed += 0.1;
            ball.x += this.nx * ball.speed;
            ball.y += this.ny * ball.speed;

            ball.roll.z = ball.speed / BALL_SIZE;
            if (ball1) {
                if (ball1.x - BALL_SIZE < ball.x + BALL_SIZE) {
                    const s = ball1.speed;
                    ball1.speed = ball.speed * 0.8;
                    ball.speed = s * 0.8;
                    ball.x = ball1.x - this.nx * BALL_SIZE * 2.01;
                    ball.y = ball1.y - this.ny * BALL_SIZE * 2.01;
                }
            }
            ball.applyRotate();
            if(ball.x > this.sx) {
                ball.x = this.sx;
                if (ball.speed < 1) {
                    renderBall(game.ctx, this.sx * TABLE_SCALE , (this.sy + BALL_SIZE) * TABLE_SCALE, ball);
                    this.sx -= this.nx * BALL_SIZE * 2;
                    this.sy -= this.ny * BALL_SIZE * 2;
                    this.balls.splice(idx,1);
                    continue;
                } else {
                    ball.speed = -Math.abs(ball.speed) * 0.5;
                }

            }
            renderBall(ctx, this.leftStart + (ball.x)*TABLE_SCALE-9,  this.startY + (ball.y)*TABLE_SCALE-7, ball);

            idx++;
        }

    }
}
*/


function renderQue(ball) {  // ball is the que target
    const B = ball;
    const cp = game ? game.current : defaultPlayer;
	var dx, dy, dd;
	if (mouse.spinMode) {
		dx = Math.cos(mouse.angleSet);
		dy = Math.sin(mouse.angleSet);
		dd = mouse.pos;
	} else {
		dx = Math.cos(mouse.angle);
		dy = Math.sin(mouse.angle);
		dd = mouse.pos;
	}
    const y = -dx;
    const x =  dy;
    const xx = x * BALL_SIZE;
    const yy = y * BALL_SIZE;
    const tt = MOUSE_TIP, te = MOUSE_END, tm = (tt + te) / 2; // taper tip, end, mid
    const joint = 5 / TABLE_SCALE;
    
    var tip = (BALL_SIZE * 1.4 + dd);
    var mid = (MOUSE_LENGTH / 2 + dd);
    var end = (MOUSE_LENGTH + dd);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.lineTo(dx * end + B.x + BALL_SIZE * 2 +  x * tm  * 0.7, dy * end + B.y + BALL_SIZE * 2 + y * tm * 0.7);
    ctx.lineTo(dx * tip + B.x + BALL_SIZE / 2, dy * tip + B.y + BALL_SIZE / 2);
    ctx.lineTo(dx * end + B.x + BALL_SIZE * 2 -  x * tm * 0.7, dy * end + B.y + BALL_SIZE * 2 - y * tm * 0.7);
    ctx.closePath();
    ctx.strokeStyle = "#0002";
    ctx.lineWidth = tm * 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#05A";
    ctx.moveTo(dx * (tip - 1) + B.x, dy * (tip - 1) + B.y);
    ctx.lineTo(dx * (tip) + B.x, dy * (tip) + B.y);
    ctx.lineWidth = MOUSE_TIP * 2.5;
    ctx.stroke();
    ctx.strokeStyle = "#07D";
    ctx.lineWidth = MOUSE_TIP * 2;
    ctx.stroke();

    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.lineWidth = 1/ TABLE_SCALE;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = cp.CUE_LIGHT_COLOR
    ctx.moveTo(dx * tip + B.x + x * tt, dy * tip + B.y + y * tt);
    ctx.lineTo(dx * (mid - joint) + B.x + x * tm, dy * (mid - joint) + B.y + y * tm);
    ctx.lineTo(dx * (mid - joint) + B.x - x * tm, dy * (mid - joint) + B.y - y * tm);
    ctx.lineTo(dx * tip + B.x - x * tt, dy * tip + B.y - y * tt);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.strokeStyle = "#0003";
    ctx.lineWidth = 5 / TABLE_SCALE;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.fillStyle = cp.CUE_DARK_COLOR;
    ctx.lineWidth = 2 / TABLE_SCALE;
    ctx.moveTo(dx * (mid + joint) + B.x + x * tm, dy * (mid + joint) + B.y + y * tm);
    ctx.lineTo(dx * end + B.x + x * te, dy * end + B.y + y * te);
    ctx.lineTo(dx * end + B.x - x * te, dy * end + B.y - y * te);
    ctx.lineTo(dx * (mid + joint) + B.x - x * tm, dy * (mid + joint) + B.y - y * tm);
    ctx.stroke();
    ctx.fill();
    ctx.strokeStyle = "#0003";
    ctx.lineWidth = 5 / TABLE_SCALE;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = cp.CUE_JOIN_COLOR;
    ctx.moveTo(dx * (mid - joint) + B.x, dy * (mid - joint) + B.y);
    ctx.lineTo(dx * (mid + joint) + B.x, dy * (mid + joint) + B.y);
    ctx.lineWidth = tm * 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dx * tip + B.x + x * tt * dx * 0.5, dy * tip + B.y + y * tt * dx * 0.5);
    ctx.lineTo(dx * end + B.x + x * te * dx * 0.5, dy * end + B.y + y * te * dx * 0.5);
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle =  LIGHT_COLOR_LOW;
    ctx.lineWidth = tt * 2;
    ctx.stroke();

    ctx.lineWidth = tt ;
    ctx.stroke();
     ctx.strokeStyle = LIGHT_COLOR;
    ctx.lineWidth = tt / 2;
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over"
    if(allowSpinControl && mouse.spinMode) {
        const spin = Math.max(15, mouse.spinPower);
        const sax = Math.cos(mouse.spin);
        const say = Math.sin(mouse.spin);
        ctx.setTransform(sax, say, -say, sax, B.x * TABLE_SCALE + GAME_LEFT, B.y * TABLE_SCALE + GAME_TOP);
        ctx.fillStyle = "#F777";
        ctx.strokeStyle = "#A44A";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.lineTo(0, -5);
        ctx.lineTo(spin, -5);
        ctx.lineTo(spin, -15);
        ctx.lineTo(spin + 15,0);
        ctx.lineTo(spin, 15);
        ctx.lineTo(spin, 5);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    if (lockAngle && !lockAngleLocked) {
        const A = mouse.angle;
        const D = 50 / TABLE_SCALE;
        const DS = 10 / TABLE_SCALE;
        const DSa = DS / D;
        ctx.fillStyle = "#F777";
        ctx.strokeStyle = "#AAAA";
        ctx.lineWidth = 2 / TABLE_SCALE;
        ctx.beginPath();
        ctx.arc(B.x, B.y, D + DS, A + DSa, A + DSa * 10)
        ctx.lineTo(...Math.polarArray(A + DSa * 10, D + DS * 2, B.x, B.y))
        ctx.lineTo(...Math.polarArray(A + DSa * 12, D + DS * 0, B.x, B.y))
        ctx.lineTo(...Math.polarArray(A + DSa * 10, D + DS * -2, B.x, B.y))
        ctx.arc(B.x, B.y, D - DS, A + DSa * 10,  A + DSa, true)
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(B.x, B.y, D + DS, A - DSa, A - DSa * 10, true)
        ctx.lineTo(...Math.polarArray(A - DSa * 10, D + DS * 2, B.x, B.y))
        ctx.lineTo(...Math.polarArray(A - DSa * 12, D + DS * 0, B.x, B.y))
        ctx.lineTo(...Math.polarArray(A - DSa * 10, D + DS * -2, B.x, B.y))
        ctx.arc(B.x, B.y, D - DS, A - DSa * 10,  A - DSa)
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    if (lockAngle && lockAngleLocked && lockDistTemp < -BALL_SIZE * 2) {
        ctx.fillStyle = "#F777";
        ctx.strokeStyle = "#AAAA";
        ctx.lineWidth = 2 / TABLE_SCALE;
        ctx.beginPath();
        const D = 50 / TABLE_SCALE;
        const DS = 10 / TABLE_SCALE;
        const DSa = (DS / (D - DS)) * 0.5;
        ctx.arc(B.x, B.y, D, 0, Math.TAU)
        ctx.moveTo(...Math.polarArray(Math.PI * 0.75 + DSa, D - DS, B.x, B.y))
        ctx.arc(B.x, B.y, D- DS, Math.PI * 0.75 + DSa, Math.PI * 1.75 - DSa);
        ctx.closePath();
        ctx.moveTo(...Math.polarArray(Math.PI * 1.75 + DSa, D - DS, B.x, B.y))
        ctx.arc(B.x, B.y, D- DS, Math.PI * 1.75 + DSa, Math.PI * 2.75 - DSa);
        ctx.closePath();
        ctx.fill("evenodd");
        ctx.stroke();
    }
}
function simpleGuide(ball) {
    const B = ball;
    var bx, by;
	ctx.setTransform(TABLE_SCALE,0,0,TABLE_SCALE,GAME_LEFT, GAME_TOP);
	if( mouse.spinMode) {
		bx = Math.cos(mouse.angleSet) * BALL_SIZE;
		by = Math.sin(mouse.angleSet) * BALL_SIZE;
	} else {
		bx = Math.cos(mouse.angle) * BALL_SIZE;
		by = Math.sin(mouse.angle) * BALL_SIZE;
	}
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
    const ballShadowGrad = ctx.createRadialGradient(0,0, BALL_SIZE * 0.1, 0,0, BALL_SIZE * 1.2);
    ballShadowGrad.addColorStop(0,"#0008");
    ballShadowGrad.addColorStop(0.1,"#000A");
    ballShadowGrad.addColorStop(0.4,"#0008");
    ballShadowGrad.addColorStop(0.9,"#0002");
    ballShadowGrad.addColorStop(1,"#0000");
    ctx.fillStyle = ballShadowGrad;
    ctx.setTransform(1,0,0,1, BALL_SIZE * 1.5, BALL_SIZE * 1.5);
    ctx.beginPath();
    ctx.arc(0, 0, BALL_SIZE * 2, 0, Math.TAU);
    ctx.fill();
    sprites.layout.shadow = {x:0, y:0, w: BALL_SIZE * 3, h: BALL_SIZE * 3};

    const ballShadeGrad = ctx.createRadialGradient(-BALL_SIZE * 0.2, -BALL_SIZE * 0.2, BALL_SIZE * 0.1, -BALL_SIZE * 0.7, -BALL_SIZE * 0.7, BALL_SIZE * 2.4);
    ballShadeGrad.addColorStop(0,"#FFF0");
    ballShadeGrad.addColorStop(0.1,"#FFF1");
    ballShadeGrad.addColorStop(0.4,"#0002");
    ballShadeGrad.addColorStop(0.8,"#000C");
    ballShadeGrad.addColorStop(0.95,"#0004");
    ctx.fillStyle = ballShadeGrad;
    ctx.setTransform(1,0,0,1, BALL_SIZE * 4, BALL_SIZE);
    ctx.beginPath();
    ctx.arc(0, 0, BALL_SIZE, 0, Math.TAU);
    ctx.fill();
    sprites.layout.shade = {x: BALL_SIZE * 3, y:0, w: BALL_SIZE * 2, h: BALL_SIZE * 2};


/*    const ballSkyGrad = ctx.createRadialGradient(BALL_SIZE * 0.7, BALL_SIZE * 0.7, 0, 0, 0, BALL_SIZE * 2.4);
    ballSkyGrad.addColorStop(0,"#FFF0");
    //ballSkyGrad.addColorStop(0.3,"#FFF0");
    ballSkyGrad.addColorStop(0.4,"#EEF3");
    ballSkyGrad.addColorStop(0.6,"#DEF6");
    ballSkyGrad.addColorStop(0.7,"#CDF8");
    ballSkyGrad.addColorStop(0.8,"#FFF0");
    ballSkyGrad.addColorStop(1,"#FFF0");*/
	
    const ballSkyGrad = ctx.createRadialGradient(BALL_SIZE * 0.0, BALL_SIZE * 0.0, 0, 0, 0, BALL_SIZE * 1);
    ballSkyGrad.addColorStop(0,"#FFF0");
    ballSkyGrad.addColorStop(0.20,"#FFF1");
    ballSkyGrad.addColorStop(0.70, "#FFF4");
    ballSkyGrad.addColorStop(0.8,TABLE_COLOR + "8");
    ballSkyGrad.addColorStop(1,TABLE_COLOR + "1");
   // ballSkyGrad.addColorStop(1, TABLE_COLOR + "0");
	
	
    ctx.fillStyle = ballSkyGrad;
    ctx.setTransform(1,0,0,1, BALL_SIZE * 6, BALL_SIZE);
    ctx.beginPath();
    ctx.arc(0, 0, BALL_SIZE * 0.92, 0, Math.TAU);
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
        ctx.ellipse(-R, -R, R * 0.6 * size, R * 0.9 * size, Math.PI / 4, 0 , Math.TAU);
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
            ctx.arc(x, -offsetY + INSET, size, 0, Math.TAU);
            ctx.moveTo(x + size, CUSH_SIZE_Y * CUSH_H + INSET + offsetY);
            ctx.arc(x, CUSH_SIZE_Y * CUSH_H + INSET + offsetY, size, 0, Math.TAU);
            if (i < 4) {
                const y = INSET + (i * yStep);
                ctx.moveTo(-offsetX + size + INSET, y);
                ctx.arc(-offsetX + INSET, y, size, 0, Math.TAU);
                ctx.moveTo(CUSH_SIZE_X * CUSH_W + offsetX + size + INSET, y);
                ctx.arc(CUSH_SIZE_X * CUSH_W + offsetX + INSET, y, size, 0, Math.TAU);
            }

            i ++;
        }

        ctx.stroke();
        ctx.fill();
        head.path = new Path2D;
        head.path.lineTo(head.x, INSET);
        head.path.lineTo(head.x, CUSH_H * CUSH_SIZE_Y + INSET);
        head.path.moveTo(head.x, head.y + head.Dr);
        head.path.arc(head.x, head.y, head.Dr, Math.PI * 0.5, Math.PI * 1.5);
        head.path.moveTo(rackCenter.x + TABLE_MARK_LINE_WIDTH/2, rackCenter.y);
        head.path.arc(rackCenter.x , rackCenter.y, TABLE_MARK_LINE_WIDTH/2, 0, Math.TAU);

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
        ctx.arc(x, y, cx * 1.7, 0, Math.TAU);
        ctx.fill();
        pockets.push({x,y,r: cx * 1.7})

        const C = 0.3; // chamfer
        const B = 2.6; // back
        const PCI = pocketCoverIn * cx;
        const ax = Math.cos(dir), ay = Math.sin(dir);
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
        ctx.arc(0, -cy * (PCI ? 0.0 : 0.25), cx * 1.5, Math.TAU - (PCI ? 0.0 : 0.25), Math.PI + (PCI ? 0.0 : 0.25), true);
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
        lines.push( new Line(x1 , y1, x2 , y2, ![12,26,38,50,64,76].includes(i)));
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
    drawPocket(-pI,         -pI,            -Math.PI * 0.25, 1);
    drawPocket(CUSH_H,      -1.2,           0, 0);
    drawPocket(CUSH_W + pI, -pI,            Math.PI * 0.25, 1);
    drawPocket(-pI,         CUSH_H + pI,    Math.PI * 1.25, 1);
    drawPocket(CUSH_H,      CUSH_H + 1.2,   Math.PI, 0);
    drawPocket(CUSH_W + pI, CUSH_H + pI,    Math.PI * 0.75,1);

    const edge = new Path2D;
    tableEdge(edge);
    return edge;
}
function rackBalls() {
	pCtx.clearRect(0, 0, pocketed.width, pocketed.height);
    const w = ctx.canvas.width, w2 = w / 2;
    const h = ctx.canvas.height;
    const p = BALL_SIZE * 2;
    var i = 0, j = 0, ball, add, e;
    pocketedBalls.length = 0;
	balls.length =  BALL_COUNT;
	allBalls.length = BALL_COUNT;
	balls.fill(undefined);
    while (i < rack.length) {
        add = false;
        e = 100;
        while (!add && e--) {
            ball = new Ball(
                i ? rack[i] * BALL_SIZE * (0.90 + ((Math.random()**2 - 0.5) * 0.04)) + rackCenter.x : rack[i] * BALL_SIZE,
                rack[i + 1] * BALL_SIZE * (1.02 + ((Math.random()**2 - 0.5) * 0.04)) + rackCenter.y,
                rack[i + 2],
            );
            add = canAdd(ball);
        }
        balls[ball.id] = ball;
		allBalls[ball.id] = ball;
        i += 3;
    }
    tempQueBall = new Ball(0,0,0);
    tempBall = new Ball(0,0,1);
    tableClear = false;
}
function findPath(ball, balls, contacts, firstIntercept = false) {
    var minTime = 0, minObj, resolving = true, idx = 0, idx1, after = 0, minU = 0, hits = 0;
    const T = tempBall, B = ball;
    const C = contacts;
    C.length = 0;
    C.push(B.x, B.y, 0);
    while (resolving) {
        resolving = false;
        minObj = undefined;
        minTime = 1;
        for (const b of balls) {
            if (b.id !== B.id && b.id !== 0) {
                const time = B.interceptBallTime(b, after);
                if (time !== undefined) {
                    if (time <= minTime) {
                        minTime = time;
                        minObj = b;
                        resolving = true;
                    }
                }
            }
        }
        for (const line of lines) {
            const u = line.intercept(B);
            const time = u >= after && u <= 1 ? u : undefined;
            if (time !== undefined) {
                if (time <= minTime) {
                    minTime = time;
                    minObj = line;
                    minU = line.u;
                    resolving = true;
                }
            }
        }
        if (resolving) {
            if (minObj instanceof Ball) {
                C.push(B.x + B.vx * minTime, B.y + B.vy * minTime, 2);
                hits++;
                if (hits < 2) {
                    tempBall.x = minObj.x;
                    tempBall.y = minObj.y;
                    tempBall.vx = minObj.vx;
                    tempBall.vy = minObj.vy;
                    tempBall.id = minObj.id;
                    tempBall.col = minObj.col;
                    B.collide(tempBall, minTime);
                    tempBall.advancePos(minTime, 0);
                    B.advancePos(minTime, 0);
                    minTime = 0;
                }
                resolving = hits < 2;
            } else {
                C.push(B.x + B.vx * minTime, B.y + B.vy * minTime);
                B.collideLine(minObj, minTime, minU, true);
                resolving = !isOffTable(B.x + B.vx * minTime, B.y + B.vy * minTime) && hits < 1;               
                if (minObj.isPocket && resolving && !firstIntercept) {
                    C.push(3);
                } else {
                    C.push(1);
                }
            }
            if (firstIntercept) { resolving = false }
            after = minTime;
        } else {
            C.push(B.x + B.vx, B.y + B.vy, 0);
        }
    }
    return C;

}
function fanLine(x1,y1,x2,y2) {

    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = badBounceFill;
    ctx.globalCompositeOperation = "lighten";
    var vx = x2 - x1;
    var vy = y2 - y1;
    var dist = (vx * vx + vy * vy) ** 0.5;
    vx /= dist;
    vy /= dist;
    ctx.setTransform(vx * TABLE_SCALE, vy * TABLE_SCALE, -vy * TABLE_SCALE, vx * TABLE_SCALE, GAME_LEFT +x1 * TABLE_SCALE, GAME_TOP + y1 * TABLE_SCALE);

    ctx.moveTo(0, 0);
    ctx.lineTo(BAD_BOUNCE_SIZE, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(BAD_BOUNCE_SIZE, - BAD_BOUNCE_SPREAD);
    ctx.moveTo(0, 0);
    ctx.lineTo(BAD_BOUNCE_SIZE,  BAD_BOUNCE_SPREAD);    
    ctx.stroke();   
    ctx.beginPath();
    ctx.restore();
}
function findFirstHit(ball, ang, balls, firstIntercept = false) {
    function drawPath(C, lineWidth, col) {
        var next = false, idx = 0,x1,x2,y1,y2;
        const bs = BALL_SIZE - lineWidth/2;
        var badBounce = 0;
        ctx.strokeStyle = "#DDD8";
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        if (C.length > 0) {
            idx = 0;
            while(idx <  C.length) {
                
                x1 = C[idx];
                y1 = C[idx + 1];
                x2 = C[idx + 3];
                y2 = C[idx + 4];
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = (dx * dx + dy * dy) ** 0.5;
                const nx = dx / dist;
                const ny = dy / dist;
                if (idx === 0) {
                    x1 += nx * BALL_SIZE;
                    y1 += ny * BALL_SIZE;
                } else if (C[idx+2] === 2) {
                    x1 += nx * bs;
                    y1 += ny * bs;
                }  else if(C[idx+2] === 3) {
                    fanLine(x1,y1, x2,y2);    
                    return next;
                }
                if(C[idx+5] === 2) {
                    ctx.moveTo(x2 + bs, y2);
                    ctx.arc(x2 , y2, bs, 0, Math.TAU);
                    next = true;
                    x2 -= nx * bs;
                    y2 -= ny * bs;
					
                }
                if (dist > bs) {
                    ctx.moveTo(x1,y1);
                    ctx.lineTo(x2,y2);
					if (next && SHOW_FIRST_CONTACT_ONLY) { break }
                }
                idx += 3;
            }
        }
        ctx.fill();
        ctx.stroke();
        return next;
    }
    const Q = tempQueBall, T = tempBall;
    Q.x = ball.x;
    Q.y = ball.y;
    Q.vx = -Math.cos(ang) * GUIDE_DISTANCE;
    Q.vy = -Math.sin(ang) * GUIDE_DISTANCE;
    Q.id = ball.id;
    const lineWidth = (SHOW_FIRST_CONTACT_ONLY ? 3 : 6) / TABLE_SCALE;
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    if (drawPath(findPath(Q, balls, contacts, firstIntercept), lineWidth, "#DDD4")) {
		if (!firstIntercept && !SHOW_FIRST_CONTACT_ONLY)  {
			Q.x = T.x;
			Q.y = T.y;
			Q.vx = T.vx;
			Q.vy = T.vy;
			Q.id = T.id;
			Q.col = T.col;
			drawPath(findPath(Q, balls, contacts), lineWidth, Q.col + "6");
		}
    }
}
function resolveCollisions(balls) {
    var minTime = 0, minObj, minBall, resolving = true, idx = 0, idx1, after = 0, e = 0, minU = 0;
	if (RENDER_REFLEX) {
		for (const b of balls) {
			b.addClose = true;
			b.closeCount = 0;
		}
	}
		
    while (resolving && e++ < MAX_RESOLUTION_CYCLES) {
        resolving = false;
        minBall = minObj = undefined;
        minTime = 1;
        idx = 0;
        for (const b of balls) {
            idx1 = idx + 1;
            while (idx1 < balls.length) {
                const b1 = balls[idx1++];
                const time = RENDER_REFLEX ? b.interceptBallTime(b1, after) : b.interceptBallTime(b1, after);
                if (time !== undefined) {
                    if (time <= minTime) {
                        minTime = time;
                        minObj = b1;
                        minBall = b;
                        resolving = true;
                    }
                }
            }
			RENDER_REFLEX && (b.addClose = false);
            for (const line of lines) {
                const u = line.intercept(b);
                const time = u >= after && u <= 1 ? u : undefined;
                if (time !== undefined) {
                    if (time <= minTime) {
                        minTime = time;
                        minObj = line;
                        minU = line.u;
                        minBall = b;
                        resolving = true;
                    }
                }
            }
            idx ++;
        }
		
        if (resolving) {
            if (minObj instanceof Ball) {
                (game && !firstHit) && (game.firstHit = minObj);
                minBall.collide(minObj, minTime);
				if (soundPlayCount === 0 && soundsReady) {
					const vol = ((minObj.speed + minBall.speed) / soundSettings.collideSpeedNorm) ** soundSettings.collideVolCurve;
					const soundPan =  (((minObj.x + minBall.x) * 0.5 - TABLE_LEFT) / (TABLE_RIGHT - TABLE_LEFT)) * 2 - 1;
					soundIFX.stop(minObj.id);
					soundIFX(
					    minBall.id,
						"baLLCollide", 
						0, 0, 
						Math.max(soundSettings.collideMinVol, Math.min(1, vol)), 
						(soundSettings.COLLISION_FREQ_SPREAD[minBall.id] + soundSettings.COLLISION_FREQ_SPREAD[minObj.id]) * 0.5,
						//Math.random() * soundSettings.collideFreqSpread + 1 - soundSettings.collideFreqSpread * 0.5,
						soundPan,
					);				
					soundPlayCount += 4;
				}				
            } else { minBall.collideLine(minObj, minTime, minU) }

            after = minTime;
        }
    }
    if (e >= MAX_RESOLUTION_CYCLES) {
        // this is bad news as can result in cats and dogs sleeping together.
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

				if (b.speed > 0.1) { allStopped = false }
				i++;
            }
        }
        if (balls.length === 1 && allStopped) {
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
function loadSaveBallPositions() {
    var save = 0;
    var load = 0;
    if (keys.Digit1) {
        keys.Digit1 = false;
        save = 1;
    } else if (keys.Digit2) {
        keys.Digit2 = false;
        save = 2;
    } else if (keys.Digit3) {
        keys.Digit3 = false;
        save = 3;
    } else if (keys.Digit4) {
        keys.Digit4 = false;
        save = 4;
    }
    if (save) {
        positionSaves[save] = balls.map(ball => ball.shadowOf());
        message = "Ball positions saved to slot " + save + ". Press " +(save + 4) + " to recall.";
        messageTime = 220;
    }

    if (keys.Digit5) {
        keys.Digit5 = false;
        load = 1;
    } else if (keys.Digit6) {
        keys.Digit6 = false;
        load = 2;
    } else if (keys.Digit7) {
        keys.Digit7 = false;
        load = 3;
    } else if (keys.Digit8) {
        keys.Digit8 = false;
        load = 4;
    } else  if (keys.Digit0) {
        keys.Digit0 = false;
        rackBalls();
    }
    if (load) {
        if (positionSaves[load].length) {
            rackBalls();
            balls.forEach(ball => ball.dead = true);
            positionSaves[load].forEach(shadow => {
                const ball = balls.find(ball => ball.id === shadow.id);
                ball && ball.fromShadow(shadow);
            });
            message = "Balls loaded from slot " + load;
            messageTime = 120;
        } else {
            message = "Slot " + load + " is empty";
            messageTime = 120;
        }

    }
}
function doMouseInterface() {
    const B = balls[0];
    runToStop = 1;
    if (game && game.awaitingShotResult) {
        game.update();
        mouse.button = 0;
    }
    if (game && game.gameOver) {
    } else if (placeBalls) {
        ballToPlace && ballToPlace.dead && (ballToPlace = undefined);
        if (ballToPlace) {
            ballToPlace.hold = true;
            const oldx = ballToPlace.x;
            const oldy = ballToPlace.y;
			const offsetDist = BALL_SIZE * 2.00001;
            let cx = ballToPlace.x = mouse.tx;
            let cy = ballToPlace.y = mouse.ty;
            let ok = canAdd(ballToPlace), maxIt = 10, count = 1;
			/*while (!ok && maxIt--) {
				ok = true;
                const over = ballNearMouse();
                if (over && over !== ballToPlace) {
					cx += over.x;
					cy += over.y;
					count ++;
                    //const x = ballToPlace.x - cx / count;
                    //const y = ballToPlace.y - cy / count;
                    const x = mouse.tx - cx / count;
                    const y = mouse.ty - cy / count;
                    const d = (x * x + y * y) ** 0.5;
                    ballToPlace.x = over.x + (x / d) * offsetDist;
                    ballToPlace.y = over.y + (x / d) * offsetDist;
                    ok = canAdd(ballToPlace);
				}
			}
			if (!ok) {
			    ballToPlace.x = oldx;
                ballToPlace.y = oldy;
				
			}*/
            if (!ok) {
                ballToPlace.x = oldx;
                ballToPlace.y = oldy;
                const over = ballNearMouse();
                if (over && over !== ballToPlace) {
                    const x = mouse.tx - over.x;
                    const y = mouse.ty - over.y;
                    const d = (x * x + y * y) ** 0.5;
					const nx = (x / d) * (BALL_SIZE * 2.001);
					const ny = (y / d) * (BALL_SIZE * 2.001);
                    ballToPlace.x = over.x + nx;
                    ballToPlace.y = over.y + ny;
                    ok = canAdd(ballToPlace);
					if (!ok) {
						ballToPlace.x = over.x - nx;
						ballToPlace.y = over.y - ny;
						ok = canAdd(ballToPlace);
					}
                }
                if (!ok){
                   //ballToPlace.x = oldx;
                    //ballToPlace.y = oldy;
                }
            }
            if (mouse.button === 1) {
                if (ballToPlace.id === 0) {
                    placeBalls = false;
                    message = "Play mode.";
                    messageTime = 120;
                }
                ballToPlace.hold = false;
                ballToPlace = undefined;
                mouse.button = 0;
            }
        } else if ((mouse.button & 1) === 1) {
            ballToPlace = ballNearMouse();
            mouse.button = 0;
        }
    } else if (B.hold) {
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
                const vx = Math.cos(fineAngle);
                const vy = Math.sin(fineAngle);
                dx =  mouse.tx - B.x;
                dy =  mouse.ty - B.y;
                an = Math.angleBetween(vx, vy, dx, dy)
                dist = lockDistTemp;
            } else {
                const vx = Math.cos(lockAngleAt);
                const vy = Math.sin(lockAngleAt);
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
            an  = mouse.angle = Math.atan2(dy , dx);
            dist = (dx * dx + dy * dy) ** 0.5;
        }
        if ((mouse.button & 1) === 1) {
            mouse.pull = Math.min(maxPull / 2.5, (dist  - mouse.spring) / (10));
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
            if (allowSpinControl) {
				if (mouse.spinMode) {
					mouse.spinPower += mouse.pull;
					mouse.spinPower *= 0.95;
					mouse.spin =  mouse.angleToHit;
					mouse.pull = mouse.pullSet;
					mouse.spring = mouse.springSet;
					if(!keys.KeyS) { 
						mouse.spinMode = false;
						mouse.spin = 0;
						mouse.spinPower = 0;
						mouse.angleToHit = mouse.angleSet;
						mouse.spring = mouse.springSet;
						mouse.pos = mouse.posSet;
					}
				} else {
					mouse.angleToHit = an;
					mouse.pos = mouse.spring;
					mouse.spring += mouse.pull;
					mouse.spring *= 0.95;
					SHOW_GUIDES && !mouse.spinMode && findFirstHit(B, an, balls)	;
					if(allowSpinControl && keys.KeyS) { 
						mouse.spinMode = true;
						mouse.spin = -Math.PI;
						mouse.spinPower = mouse.spring;
						lockAngleAt = mouse.angleSet = mouse.angleToHit;
						mouse.pullSet = mouse.pull;
						mouse.springSet = mouse.spring;
						mouse.posSet = mouse.pos;
					}
					
				}
            }
			
				/*
                if (mouse.spin === 0) {
                    if(keys.KeyD) {
                        mouse.spin = -Math.PI / 2;
                        mouse.spinPower = mouse.spring;
                    }
                    if(keys.KeyA) {
                        mouse.spin = Math.PI / 2;
                        mouse.spinPower = mouse.spring;
                    }
                    if(keys.KeyS) {
                        mouse.spin = Math.TAU;
                        mouse.spinPower = mouse.spring;
                    }
                    if(keys.KeyW) {
                        mouse.spin = -Math.PI;
                        mouse.spinPower = mouse.spring;
                    }
                } else {
                    mouse.spin = 0;
                    if(keys.KeyD) {
                        mouse.spin = -Math.PI / 2;
                    }
                    if(keys.KeyA) {
                        mouse.spin = Math.PI / 2;
                    }
                    if(keys.KeyS) {
                        mouse.spin = Math.TAU;
                    }
                    if(keys.KeyW) {
                        mouse.spin = -Math.PI;
                    }
                }
				*/

        } else {

			if (allowSpinControl) {
				if (mouse.spinMode) { 
					mouse.angleToHit = mouse.angleSet;
					mouse.pull = mouse.pullSet;
					mouse.spring = mouse.springSet;	
					mouse.pos = mouse.posSet;					
					mouse.spinMode = false;	
					lockAngle = true;
					
				}
			}
            if(lockAngle) {
                mouse.angle = lockAngleAt
            }
            if (mouse.pull) {
                if (allowSpinControl && mouse.spin) {
                    const sp = Math.max(15,mouse.spring - mouse.spinPower);
                   // mouse.spring = mouse.spinPower;
                    mouse.spinPower = mouse.spinPower;
                }
				mouse.button = 0;
                mouse.pos = mouse.spring;
                mouse.speed = 0;
            }			
            if (mouse.speed === 0) {
                if (!placeBalls && (mouse.button & 4) === 4) {
                    message = "Place mode. Left click ball to move, left click again to place.";
                    messages.length = 0;
                    messages.push("To exit place mode, selected the white ball and place it.",
                        "While in place mode, press 1,2,3, or 4 to save ball positions.",
                        "When on play mode, press 5,6,7, or 8 to recall ball positions."
                    );
                    messageTime = 220;
                    placeBalls = true;
                    mouse.button = 0;
                } else {
                    SHOW_GUIDES && findFirstHit(B, an, balls, true);
                }
            }

            mouse.pull = 0;
            mouse.spring *= 0.5;
            mouse.speed += mouse.spring * (keys.KeyW ? 1.5 : 1);
            mouse.pos -= mouse.speed * (keys.KeyW ?0.75 : 1);
            if (mouse.pos < 0) {
				
				const hitPower = Math.min(1, (((mouse.speed * mouse.mass) / BALL_MASS) / 120) ** 1.6) * 120;
                B.vx = Math.cos(mouse.angleToHit + Math.PI) * hitPower;
                B.vy = Math.sin(mouse.angleToHit + Math.PI) * hitPower;
                if (allowSpinControl && mouse.spin) {
                    B.spin = (mouse.spinPower * 0.2 / BALL_SIZE);
                    B.spinDirection = mouse.spin;
                    mouse.spin = 0;
                }
				soundsReady && soundFX("cueHit", 0, 0, Math.max(0.1,Math.min(1, (mouse.speed / 170) ** 2)),  Math.random() * 0.2 + 0.9);
                mouse.pull = 0;
                mouse.spring = 0;
                mouse.speed = 0;
                mouse.pos = 0;
                mouse.spin = 0;
                lockAngleLocked = lockAngle = false;
                game && game.shoots();
            }
        }
        renderQue(B);
    }
}
var paused = false;



function mainLoop() {
    var allStopped;
	if (keys.KeyP) {
		paused = !paused;
		keys.KeyP = false;
		if (paused) {
			messageTime = 30;
			message = "[P] to resume. [N] step (next frame)";
		} else {
		}
			
			
	} else if (paused) {
		if (keys.KeyN) {
			keys.KeyN = false;
		} else {
			requestAnimationFrame(mainLoop);		
			return;
		}
	}
	soundPlayCount > 0 && soundPlayCount--;
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
    mouse.tx = (mouse.x - GAME_LEFT) / TABLE_SCALE;
    mouse.ty = (mouse.y - GAME_TOP) / TABLE_SCALE;	
    
    renderBalls();


    if (!allStopped && (mouse.button & 4) === 4) {
        runToStop += 5;
        mouse.button = 0;
    }
    ctx = ctxMain;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(TABLE_SCALE,0,0,TABLE_SCALE, GAME_LEFT, GAME_TOP);
    ctxMain.drawImage(gameCanvas, 0,0);
    ctxMain.setTransform(1,0,0,1,0,0);
	ctxMain.drawImage(pocketed,   ctx.canvas.width / 2 - pocketed.width / 2, ctx.canvas.height - pocketed.height );
	ctx.setTransform(TABLE_SCALE,0,0,TABLE_SCALE, GAME_LEFT, GAME_TOP);
    if (allStopped) {
        doMouseInterface();

    }
    if(HAS_GAME_PLAY_API && sunk.balls.length) { sunk.animate() }
	(!SHOW_GUIDES || mouse.spinMode) && allStopped && !placeBalls && !balls[0].hold && simpleGuide(balls[0]);
    if (message) {
        ctx.setTransform(1,0,0,1,ctx.canvas.width / 2, GAME_TOP - 32);
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 6;
        ctx.lineJoin = "round";
        if (messageTime) {
            if (messageTime < 30) { ctx.globalAlpha = (messageTime / 30) ** 0.5  }
            messageTime --;
            ctx.strokeText(message, 0, 0);
            ctx.fillText(message, 0, 0);
            ctx.globalAlpha = 1;
        } else {
            if (messages.length)  {
                message = messages.shift();
                messageTime = 320;

            } else {
                message = undefined;
            }

        }
    }
    mouse.oldX = mouse.tx;
    mouse.oldY = mouse.ty;
    requestAnimationFrame(mainLoop);
}


//var lineU;
function mathExt() {
    Math.TAU = Math.PI * 2;
    Math.PI90 = Math.PI * 0.5;
    Math.rand = (min, max) => Math.random() * (max - min) + min;
    Math.randP = (min, max, pow = 2) => Math.random() ** pow * (max - min) + min;
    Math.randI = (min, max) => Math.random() * (max - min) + min | 0; // only for positive numbers 32bit signed int
    Math.randItem = arr => arr[Math.random() * arr.length | 0]; // only for arrays with length < 2 ** 31 - 1
    Math.polarArray = (ang, dist, ox = 0, oy = 0) => [ox + Math.cos(ang) * dist, oy + Math.sin(ang) * dist];
    Math.angleBetween = (xa, ya, xb, yb) => {
		const l = ((xa * xa + ya * ya) * (xb * xb + yb * yb)) ** 0.5;
		var ang = 0;
		if (l !== 0) {
			ang = Math.asin((xa  * yb  - ya * xb) / l);
			if (xa  * xb  + ya * yb < 0) { return (ang < 0 ? -Math.PI: Math.PI) - ang }
		}
		return ang;
    }

    Math.circlesInterceptUnitTime = (x1, y1, vx1, vy1, x2, y2, vx2, vy2, dist, px, py,  r1, r2) => {
        const rr = r1 + r2;
        const vx = vx1 - vx2;
        const vy = vy1 - vy2;
        var l = (vx * vx + vy * vy) ** 0.5;
        if (l + rr < dist) { return 2 }
        const u = (px * vx + py * vy) / (l * l);
        var x = x1 + vx * u - x2;
        var y = y1 + vy * u - y2;
        const distSqr = x * x + y * y;
        return (u * l - (rr * rr - distSqr) ** 0.5) / l;
    }   	
	
	
    /*Math.circlesInterceptUnitTime = (a, e, b, f, c, g, d, h, r1, r2) => { // args (x1, y1, x2, y2, x3, y3, x4, y4, r1, r2)
        const A = a * a, B = b * b, C = c * c, D = d * d;
        const E = e * e, F = f * f, G = g * g, H = h * h;
        var R = (r1 + r2) ** 2;
        const AA = A + B + C + F + G + H + D + E + b * c + c * b + f * g + g * f + 2 * (a * d - a * b - a * c - b * d - c * d - e * f + e * h - e * g - f * h - g * h);
        const BB = 2 * (-A + a * b + 2 * a * c - a * d - c * b - C + c * d - E + e * f + 2 * e * g - e * h - g * f - G + g * h);
        const CC = A - 2 * a * c + C + E - 2 * e * g + G - R;
        return Math.quadRoots(AA, BB, CC);
    }*/
    Math.quadRoots = (a, b, c) => { // find roots for quadratic
        if (Math.abs(a) < 1e-6) { return b != 0 ? [-c / b] : []  }
        b /= a;
        var d = b * b - 4 * (c / a);
        if (d > 0) {
            d = d ** 0.5;
            return  [0.5 * (-b + d), 0.5 * (-b - d)]
        }
        return d === 0 ? [0.5 * -b] : [];
    }

}
