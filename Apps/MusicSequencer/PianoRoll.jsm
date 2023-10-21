
import {TextRender} from "./render.jsm";
import {createCanvas} from "./createCanvas.jsm";
import {NoteEvent} from "./Sequencer.jsm";
import {Events} from "./Events.jsm";
import {getSpriteSet, spriteLocs} from "./ButtonSprites.jsm";
import {NOTE_NAME, NOTE_FREQ, NOTE_IDX, NOTE_NUMBERS, createKey, NamedScales, chords, chordsNamed, guitar, noteDesc} from "./music.jsm";

//const version = "standard";
/*const COLORS = [];
["#3f3f8e,#004c8e,#00678e,#008686,#008e00,#628e00,#757500,#8e7251,#8e0000,#8e004c,#792b8e,#4c008e",
"#4d4dad,#005cad,#007dad,#00a3a3,#00ad00,#77ad00,#8e8e00,#ad8a62,#ad0000,#ad005c,#9334ad,#5c00ad",
"#5d5dd2,#0070d2,#0098d2,#00c6c6,#00d200,#91d200,#adad00,#d2a777,#d20000,#d20070,#b23fd2,#7000d2",
"#7171ff,#0088ff,#00b8ff,#00f0f0,#00ff00,#b0ff00,#d2d200,#ffcb91,#ff0000,#ff0088,#d84dff,#8800ff",
"#9a9aff,#4aabff,#4acdff,#4af4f4,#4aff4a,#c7ff4a,#dfdf4a,#ffdab1,#ff4a4a,#ff4aab,#e381ff,#ab4aff",
"#b7b7ff,#7fc3ff,#7fdcff,#7ff7f7,#7fff7f,#d7ff7f,#e8e87f,#ffe5c8,#ff7f7f,#ff7fc3,#eba6ff,#c37fff",
"#ccccff,#a4d4ff,#a4e6ff,#a4f9f9,#a4ffa4,#e3ffa4,#efefa4,#ffedd8,#ffa4a4,#ffa4d4,#f1c0ff,#d4a4ff",
].map(cols => cols.split(","))[0].map((c,i,a) => COLORS.push([a[0][i], a[1][i], a[2][i], a[3][i], a[4][i], a[5][i], a[6][i]]));
*/

const version = "alt";
const versions = {
    standard: {
        imageURL: "./Images/PianoRollSprites.png",
        rollY: -4,
        noteY: 4,
        sprites: {
            A: {x: 33, y: 77, w: 30, h: 11},
            As:{x: 0,  y: 72, w: 17, h: 8},
            B: {x: 33, y: 65, w: 30, h: 11},
            C: {x: 33, y: 53, w: 30, h: 11},
            Cs:{x: 0,  y: 48, w: 17, h: 8},
            D: {x: 33, y: 41, w: 30, h: 11},
            Ds:{x: 0,  y: 36, w: 17, h: 8},
            E: {x: 33, y: 29, w: 30, h: 11},
            F: {x: 33, y: 17, w: 30, h: 11},
            Fs:{x: 0,  y: 12, w: 17, h: 8},
            G: {x: 33, y: 5,  w: 30, h: 11},
            Gs:{x: 0,  y: 0,  w: 17, h: 8},
            keysSpr: {x: 66, y: 4, w: 31, h: 84},
            rollSpr33: {x: 332, y: 1, w: 73,  h: 84},
            rollSpr43: {x: 98,  y: 1, w: 97,  h: 84},
            rollSpr63: {x: 430, y: 1, w: 145, h: 84},
            rollSpr83: {x: 624, y: 1, w: 193, h: 84},
            rollSpr34: {x: 332, y: 1, w: 97,  h: 84},
            rollSpr44: {x: 98,  y: 1, w: 128, h: 84},
            rollSpr64: {x: 430, y: 1, w: 193, h: 84},
            rollSpr84: {x: 624, y: 1, w: 257, h: 84},
            noteA:  {x: 228, y: 79, w: 7, h: 6},
            noteAs: {x: 228, y: 73, w: 7, h: 5},
            noteB:  {x: 228, y: 65, w: 7, h: 7},
            noteC:  {x: 228, y: 57, w: 7, h: 7},
            noteCs: {x: 228, y: 51, w: 7, h: 5},
            noteD:  {x: 228, y: 43, w: 7, h: 7},
            noteDs: {x: 228, y: 37, w: 7, h: 5},
            noteE:  {x: 228, y: 29, w: 7, h: 7},
            noteF:  {x: 228, y: 21, w: 7, h: 7},
            noteFs: {x: 228, y: 15, w: 7, h: 5},
            noteG:  {x: 228, y: 8,  w: 7, h: 6},
            noteGs: {x: 228, y: 2,  w: 7, h: 5},
            darkSwatch: {x: 66, y: 13, w: 16, h: 6},
        }
    },
    alt: {
        imageURL: "./Images/PianoRollSpritesAlt.png",
        rollY: 0,
        noteY: 0,
        sprites: {
            keysSpr: {x: 33, y: 0, w: 31, h: 96},
            A:  {x: 0, y: 89, w: 30, h: 7},
            As: {x: 0, y: 81, w: 30, h: 7},
            B:  {x: 0, y: 73, w: 30, h: 7},
            C:  {x: 0, y: 65, w: 30, h: 7},
            Cs: {x: 0, y: 57, w: 30, h: 7},
            D:  {x: 0, y: 49, w: 30, h: 7},
            Ds: {x: 0, y: 41, w: 30, h: 7},
            E:  {x: 0, y: 33, w: 30, h: 7},
            F:  {x: 0, y: 25, w: 30, h: 7},
            Fs: {x: 0, y: 17, w: 30, h: 7},
            G:  {x: 0, y: 9, w: 30, h: 7},
            Gs: {x: 0, y: 1, w: 30, h: 7},
            vol: {x: 191, y: 2, w: 3, h: 3},
            noteA:  {x: 195, y: 89, w: 7, h: 7},
            noteAs: {x: 195, y: 81, w: 7, h: 7},
            noteB:  {x: 195, y: 73, w: 7, h: 7},
            noteC:  {x: 195, y: 65, w: 7, h: 7},
            noteCs: {x: 195, y: 57, w: 7, h: 7},
            noteD:  {x: 195, y: 49, w: 7, h: 7},
            noteDs: {x: 195, y: 41, w: 7, h: 7},
            noteE:  {x: 195, y: 33, w: 7, h: 7},
            noteF:  {x: 195, y: 25, w: 7, h: 7},
            noteFs: {x: 195, y: 17, w: 7, h: 7},
            noteG:  {x: 195, y: 9, w: 7, h: 7},
            noteGs: {x: 195, y: 1, w: 7, h: 7},
            barMark: {x: 179, y: 0, w: 3, h: 96},
            darkSwatch: {x: 183, y: 1, w: 7, h: 7},
			rollSpr2A: {x: 130, y: 0, w: 16, h: 96},
			rollSpr2B: {x: 154, y: 0, w: 16, h: 96},
            rollSpr3A: {x: 130, y: 0, w: 24, h: 96},
            rollSpr3B: {x: 154, y: 0, w: 24, h: 96},
            rollSpr4A: {x: 65, y: 0, w: 32, h: 96},
            rollSpr4B: {x: 97, y: 0, w: 32, h: 96},
            rollSpr6A: {x: 299, y: 0, w: 48, h: 96},
            rollSpr6B: {x: 347, y: 0, w: 48, h: 96},
            rollSpr8A: {x: 396, y: 0, w: 64, h: 96},
            rollSpr8B: {x: 460, y: 0, w: 64, h: 96},
            rollSpr22:  {w: 16 * 2, h: 96},
            rollSpr32:  {w: 24 * 2, h: 96},
            rollSpr42:  {w: 32 * 2, h: 96},
            rollSpr62:  {w: 48 * 2, h: 96},
            rollSpr82:  {w: 64 * 2, h: 96},
            rollSpr23:  {w: 16 * 3, h: 96},
            rollSpr33:  {w: 24 * 3, h: 96},
            rollSpr43:  {w: 32 * 3, h: 96},
            rollSpr63:  {w: 48 * 3, h: 96},
            rollSpr83:  {w: 64 * 3, h: 96},
            rollSpr24:  {w: 16 * 4, h: 96},
            rollSpr34:  {w: 24 * 4, h: 96},
            rollSpr44:  {w: 32 * 4, h: 96},
            rollSpr64:  {w: 48 * 4, h: 96},
            rollSpr84:  {w: 64 * 4, h: 96},
        }
    },
    altBig: {
        imageURL: "./Images/PianoRollSpritesAlt.png",
        imageSize: {w: 524,  h: 96},
        rollY: 0,
        noteY: 0,
        scaLe: 4,
        sprites: {
            keysSpr: {x: 33, y: 0, w: 31, h: 96},
            A:  {x: 0, y: 89, w: 30, h: 7},
            As: {x: 0, y: 81, w: 30, h: 7},
            B:  {x: 0, y: 73, w: 30, h: 7},
            C:  {x: 0, y: 65, w: 30, h: 7},
            Cs: {x: 0, y: 57, w: 30, h: 7},
            D:  {x: 0, y: 49, w: 30, h: 7},
            Ds: {x: 0, y: 41, w: 30, h: 7},
            E:  {x: 0, y: 33, w: 30, h: 7},
            F:  {x: 0, y: 25, w: 30, h: 7},
            Fs: {x: 0, y: 17, w: 30, h: 7},
            G:  {x: 0, y: 9, w: 30, h: 7},
            Gs: {x: 0, y: 1, w: 30, h: 7},
            noteA:  {x: 195, y: 89, w: 7, h: 7},
            noteAs: {x: 195, y: 81, w: 7, h: 7},
            noteB:  {x: 195, y: 73, w: 7, h: 7},
            noteC:  {x: 195, y: 65, w: 7, h: 7},
            noteCs: {x: 195, y: 57, w: 7, h: 7},
            noteD:  {x: 195, y: 49, w: 7, h: 7},
            noteDs: {x: 195, y: 41, w: 7, h: 7},
            noteE:  {x: 195, y: 33, w: 7, h: 7},
            noteF:  {x: 195, y: 25, w: 7, h: 7},
            noteFs: {x: 195, y: 17, w: 7, h: 7},
            noteG:  {x: 195, y: 9, w: 7, h: 7},
            noteGs: {x: 195, y: 1, w: 7, h: 7},
            barMark: {x: 179, y: 0, w: 3, h: 96},
            darkSwatch: {x: 183, y: 1, w: 7, h: 7},
			rollSpr2A: {x: 130, y: 0, w: 16, h: 96},
			rollSpr2B: {x: 154, y: 0, w: 16, h: 96},
            rollSpr3A: {x: 130, y: 0, w: 24, h: 96},
            rollSpr3B: {x: 154, y: 0, w: 24, h: 96},
            rollSpr4A: {x: 65, y: 0, w: 32, h: 96},
            rollSpr4B: {x: 97, y: 0, w: 32, h: 96},
            rollSpr6A: {x: 299, y: 0, w: 48, h: 96},
            rollSpr6B: {x: 347, y: 0, w: 48, h: 96},
            rollSpr8A: {x: 396, y: 0, w: 64, h: 96},
            rollSpr8B: {x: 460, y: 0, w: 64, h: 96},
            rollSpr22:  {w: 16 * 2, h: 96},
            rollSpr32:  {w: 24 * 2, h: 96},
            rollSpr42:  {w: 32 * 2, h: 96},
            rollSpr62:  {w: 48 * 2, h: 96},
            rollSpr82:  {w: 64 * 2, h: 96},
            rollSpr23:  {w: 16 * 3, h: 96},
            rollSpr33:  {w: 24 * 3, h: 96},
            rollSpr43:  {w: 32 * 3, h: 96},
            rollSpr63:  {w: 48 * 3, h: 96},
            rollSpr83:  {w: 64 * 3, h: 96},
            rollSpr24:  {w: 16 * 4, h: 96},
            rollSpr34:  {w: 24 * 4, h: 96},
            rollSpr44:  {w: 32 * 4, h: 96},
            rollSpr64:  {w: 48 * 4, h: 96},
            rollSpr84:  {w: 64 * 4, h: 96},
        }
    }    
};

const V = versions[version];

var pianoImage;
/*if (V.imageSize) {
    for (const spr of Object.values(V.sprites)) {
        spr.x !== undefined && (spr.x *= V.scale);
        spr.y !== undefined && (spr.y *= V.scale);
        spr.w !== undefined && (spr.w *= V.scale);
        spr.h !== undefined && (spr.h *= V.scale);
    }    
    const draw = (name, col) => {
        const c = pianoImage.ctx;
        const spr = V.sprites[name];
        const color = COLORS[col];
        c.fillStyle = color[0];
        c.fillRect(spr.x + 1, spr.y + 1, 1, 1);
        c.fillStyle = color[0];
        c.fillRect(spr.x + 1, spr.y + 1, 1, 1);
        
        c.fillStyle = color[6];
        c.fillRect(spr.x + spr.w - 2, spr.y + spr.h - 2, 1, 1);
        c.fillStyle = color[3];
        c.fillRect(spr.x + 1, spr.y + 1, spr.w - 2, spr.h - 2);
    }
    V.imageSize.w *= V.scale;
    V.imageSize.h *= V.scale;
    pianoImage = Object.assign(document.createElement("canvas"), {width: V.imageSize.w, height: V.imageSize.h});
    pianoImage.ctx = pianoImage.getContext("2d");
} else {*/
    pianoImage = new Image;
    pianoImage.src = V.imageURL;
/*}*/
const sprites = V.sprites;
const S = sprites;
sprites.keys = [S.A, S.As, S.B, S.C, S.Cs, S.D, S.Ds, S.E, S.F, S.Fs, S.G, S.Gs];
sprites.notes = [S.noteA, S.noteAs, S.noteB, S.noteC, S.noteCs, S.noteD, S.noteDs, S.noteE, S.noteF, S.noteFs, S.noteG, S.noteGs];
const volSpr = S.vol;
var showVolume = false;
const [noteYPos, noteYSize, keyYPos, keyYSize, sharpKeys] = (() => {
    const nSize = [], nPos = [], kPos = [], kSize = [], sharps = [];
    var o = 8, n = 12, y = 0;
    while (o --) {
        n = 12;
        while (n--) {
            nPos.push(S.notes[n].y + y);
            nSize.push(S.notes[n].h);
            kPos.push(S.keys[n].y + y);
            kSize.push(S.keys[n].h);
            if (n === 11 || n === 9 || n === 6 || n ===  4 || n === 1) {
                sharps.push(1);
            } else {
                sharps.push(0);
            }
        }
        y += S.keysSpr.h;
    }
    nPos.reverse();
    nSize.reverse();
    kPos.reverse();
    kSize.reverse();
    sharps.reverse();
    return [nPos, nSize, kPos, kSize, sharps];
})();
const ROLL_Y = V.rollY;
const NOTE_Y = V.noteY;
const icons = new Image;
icons.src = "./Images/icons.png";
icons.barSprites = getSpriteSet("icon16");
pianoImage.sprites = sprites;
pianoImage.drawSprSrt = function(ctx, spr, x, y) {
    
    ctx.drawImage(this, spr.x, spr.y, spr.w - 4, spr.h, x, y, spr.w - 4, spr.h);
}
pianoImage.drawSpr = function(ctx, spr, x, y) {
    ctx.drawImage(this, spr.x, spr.y, spr.w, spr.h, x, y, spr.w, spr.h);
}
pianoImage.drawNoteRect = function(ctx, spr, x, y, w = spr.w - 2, h = spr.h) {
    ctx.drawImage(this, spr.x + 1, spr.y, spr.w - 2, spr.h, x, y, w, h);
}
const NoteColOffSets = [4,5,6,8,11,1,2,12,3,7,9,10];
const PosLineBeatCols = ["#F006","#F806","#FF06","#0F06"];
pianoImage.drawNoteSpr = function(ctx, spr, x, y, beats, col = 0, vol = 0.5) {
    const xOff = col * (spr.w + 1);
    const w = spr.w, h = spr.h, h2 = (h - 2) * vol;
    const bw = (w + 1) * beats;
    const xx = xOff + spr.x;
    ctx.drawImage(this, xx,         spr.y, 2,     h, x,          y, 2,      h);
    ctx.drawImage(this, xx + w - 2, spr.y, 2,     h, x + bw - 2, y, 2,      h);
    ctx.drawImage(this, xx + 2,     spr.y, w - 4, h, x + 2,      y, bw - 4, h);
    showVolume && ctx.drawImage(this, volSpr.x, volSpr.y, volSpr.w, volSpr.h, x + 2, y + h - 1 - h2, vol <= 0.99 ? 2 : 4, h2);
}
function createStripImage(srcSpr, octs, can, invert = false) {
    can = can ?? createCanvas(srcSpr.w, srcSpr.h * octs, null, true);
    const w = can.width = srcSpr.w;
    const h = can.height = srcSpr.h * octs;
    const ctx = can.ctx;
    ctx.clearRect(0, 0, w, h);
    var i = 0;
    while (i < octs) {
        pianoImage.drawSpr(ctx, srcSpr, 0, i * srcSpr.h);
        i++;
    }
    if (invert) {
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
    }
    return can;
}
function createStripImageAlt(srcSprA, srcSprB, octs, can, invert = false, BPB) {
    const sW = srcSprA.w * BPB;
    can = can ?? createCanvas(sW, srcSprB.h * octs, null, true);
    const w = can.width = sW;
    const h = can.height = srcSprA.h * octs;
    const ctx = can.ctx;
    ctx.clearRect(0, 0, w, h);
    var i = 0;
    const off = 11;
    while (i < octs) {
        pianoImage.drawSpr(ctx, srcSprA, 0, i * srcSprA.h+off);
        pianoImage.drawSpr(ctx, srcSprB, srcSprA.w, i * srcSprB.h+off);
        if (BPB === 3) {
            pianoImage.drawSpr(ctx, srcSprA, srcSprA.w * 2, i * srcSprA.h+off);
        } else {
            pianoImage.drawSpr(ctx, srcSprA, srcSprA.w * 2, i * srcSprA.h+off);
            pianoImage.drawSpr(ctx, srcSprB, srcSprA.w * 3, i * srcSprB.h+off);
        }
        pianoImage.drawSpr(ctx, S.barMark, -1, i * srcSprA.h+off);
        pianoImage.drawSpr(ctx, S.barMark, w-1, i * srcSprA.h+off);
        i++;
    }
    if (invert) {
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
    }
    return can;
}
function muteStripNotes(can, keysCan, notes, yPosArr, ySizeArr, yOff = 0, dimOffKey = false) {
	const keyNotes = key.getNotes(notes);
	const ySize = noteYSize[0] / 6;
	const rootIdx = key.keyOffset;
    const ctx = can.ctx;
    const nCtx = keysCan.ctx;
	nCtx.font = "10px arial";
	nCtx.textAlign = "left";
	nCtx.textBaseline = "middle";
	var noteNum = 0;
    const w = can.width;
    
    var i = 0;
    while (i < yPosArr.length) {
        if (notes && !notes[i]) {
            const pos = yPosArr[i];
            ctx.clearRect(0, yPosArr[i]-1 + yOff, w, ySizeArr[i]);
            dimOffKey = false;
        }
        i++;
    }
    var i = 0, j = 0;
    if (dimOffKey) {
        while (i < noteYPos.length) {
            if (keyNotes && keyNotes[i] > 0) {
                nCtx.fillStyle = "#F006";
                const pp = keyNotes[i], pos = noteYPos[i], isRoot = i % 12 === rootIdx;
                if ((i / 12 | 0) === 4 && (i % 12 === 0)) {
                    const pos = yPosArr[i];
                    ctx.fillStyle = "#FA03";
                    ctx.fillRect(0, yPosArr[i]-1 + yOff, w, ySizeArr[i]);                
                    
                }
                if (pp === 1) {
                    noteNum = isRoot ? 0 : noteNum;
                    nCtx.fillRect(0, pos, (isRoot ? 8: 4), noteYSize[i]);    
                    spriteLocs.drawSprite(nCtx, 10, (pos - 6) | 0, spriteLocs.NoteNums[noteNum++]);		
                } else {
                    const str = (pp - 2) >> 4, f = (pp-2) & 0b1111, h = noteYSize[i];				
                    nCtx.fillRect(0, pos + str * ySize, (isRoot ? 18:12), ySize);
                    j = 1;
                    while (j < f) { nCtx.fillRect((j++) * 3 - 2, pos, 1 , h) }
                    nCtx.fillRect(f * 3 - 2, pos, 2 , h);

                }
            }
            i++;
        }
    
        var i = 0;
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#000A";
        ctx.beginPath();
        while (i < yPosArr.length) {
            if (!(keyNotes && keyNotes[i] > 0)) {
                const pos = yPosArr[i];
                ctx.rect(0, yPosArr[i]-1 + yOff, w, ySizeArr[i]);
            }
            i++;
        }
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
    }
    return can;
}
/* From BeepBox
A A# B C C# D D# E F F#  G  G# A
A Bb B C Db D Eb E F Gb  G  Ab A
0  1 2 3  4 5  6 7 8  9 10 11 12
                                     A   B C   D E F   G                      A   B C   D   E F   G  
easy         in A [A B C# E  F#    ] 0   2   4   7   9      [A C D E G      ] 0     3   5   7     10
island       in A [A C# D E G#     ] 0       4 5 7       11 [A Bb C E F     ] 0 1   3       7 8
blues        in A [A B C C# E F#   ] 0   2 3 4   7   9      [A C D D# E G   ] 0     3   5 6 7     10
normal       in A [A B C# D E F# G#] 0   2   4 5 7   9   11 [A B C D E F G  ] 0   2 3   5   7 8   10
dbl harmonic in A [A A# C# D E F G#] 0 1     4 5 7 8     11 [A B C D# E F G#] 0   2 3     6 7 8      11


E  F  F# G  G# A |  |  |  |  |  |
B  C  C# D  D# E |  |  |  |  |  |
G  G# A  A# B  C |  |  |  |  |  |
D  D# E  F  F# G |  |  |  |  |  |
A  A# B  C  C# D |  |  |  |  |  |
E  F  F# G  G# A |  |  |  |  |  |


A  -     |oo222o|
B  -     |x24442|
C  -     |o32o1o|
D  -     |xxo232|
E  -     |o221oo|
F  -     |133211|
F#-      |244322|
G -      |32ooo3| Nashville style |3×oo33|
Bm -     |224432| or |xx4432|  
D7 -     |xxo212|  
B7 -     |x212o2|
Em -     |o22ooo|          
B7sus4 - |x2425x|



*/

var key = createKey("A", NamedScales.major);
function getChordForKey(idx, type) {
    return key.chordAt(idx, type) ??
        key.chordAt(idx, "major") ??
        key.chordAt(idx, "minor") ?? 
        key.chordAt(idx, "minor6") ?? 
        key.chordAt(idx, "minor7") ?? 
        key.chordAt(idx, "major6") ??
        key.chordAt(idx, "major7") ?? 
        key.chordAt(idx, "minor_major7") ?? 
        key.chordAt(idx, "dominant7") ?? 
        key.chordAt(idx, "augmented") ?? 
        key.chordAt(idx, "augmented7") ?? 
        key.chordAt(idx, "diminished") ?? 
        key.chordAt(idx, "diminished7");     
}
//const keyList = [
//    createKey("A", NamedScales.major),
//    createKey("A", NamedScales.minor)
//];
function PianoRoll(ctx, sequencer, mouse, synth, commons) {
    const log = message => { commons.commandSets.issueCommand(commons.commands.sysLog, {message, col: "GREEN"}); }
    const logErr = message => { commons.commandSets.issueCommand(commons.commands.sysLog, {message, col: "RED"}); }    
    
    var setting_dimOutOfKey = false;
    function settingUpdate() {
        setting_dimOutOfKey = commons.settings.byName("dimOutOfKey");
        dirty = redraw = true;
    }
    commons.settings.addEvent("update", settingUpdate);
    
    const validateNoteLen = len => !isNaN(len) && len > 0 && len < 256;
    const keyboard = mouse.keyboard;
    var seq = sequencer;
    const IMG = pianoImage;
    var scaleX = 2;
    var scaleY = 2;
    var noteColorIndex = -1;
    const octSpr = S.keysSpr;
    var rSpr = S.rollSpr44;
    var rSprA = S.rollSpr4A, rSprB = S.rollSpr4B;
    const octH = octSpr.h;
    const bgCan = createCanvas();
    const bgCanBar = [];
    const MAX_OCTAVES = seq.MAX_OCTAVES, MAX_NOTES = MAX_OCTAVES * 12;
    const keysCan = createStripImage(S.keysSpr, MAX_OCTAVES);
    const notesCan = version === "standard" ?
        muteStripNotes(createStripImage(rSpr, MAX_OCTAVES, undefined, true), keysCan, [], noteYPos, noteYSize, 0, setting_dimOutOfKey) :
        muteStripNotes(createStripImageAlt(rSprA, rSprB, MAX_OCTAVES, undefined, true, 4), keysCan, [], noteYPos, noteYSize, -11, setting_dimOutOfKey);
	function updateRoll() {
		createStripImage(S.keysSpr, MAX_OCTAVES, keysCan);
		if (version === "standard") {
			rSpr = S["rollSpr" + subBeats + BPB];
			muteStripNotes(createStripImage(rSpr, MAX_OCTAVES, notesCan, true), keysCan, seq.activeTrack?.play?.hasNotes ?? [], noteYPos, noteYSize, 0, setting_dimOutOfKey);
		} else {
			rSpr = S["rollSpr" + subBeats + BPB];
			rSprA = S["rollSpr" + subBeats + "A"];
			rSprB = S["rollSpr" + subBeats + "A"];
			muteStripNotes(createStripImageAlt(rSprA, rSprB, MAX_OCTAVES, notesCan, true, BPB), keysCan, seq.activeTrack?.play?.hasNotes ?? [], noteYPos, noteYSize, 4, setting_dimOutOfKey);
		}
		dirty = true;
		redrawAll = true;
	}
    var subBeats = 4, bars = 0, beats = 0, BPB, BPM, followPlay = true;
	const view = {bar: 0, beat: 0};
	const play = {bar: 0, beat: 0};
    const marked = {bar: 0, beat: 0};
    var highlightBar = -1;
    var highlightBeat = -1;
    var posStack = [];
    const keysPlay = [];
    const keysPool = [];
    function PlayKey() {}
    PlayKey.prototype = {
        on: 0,
        off: 0,
        idx: 0,
        note: 0,
        len: 0,
        init(n, on, off) {
            this.note = n.note.note;
            this.idx = n.note.idx;
            this.on = on;
            this.off = off;
            this.len = off - on;
            return this;
        }
    };
    keysPlay.size = 0;
    var dirty = true, redrawAll = true, redraw = true;
    const workNote = new NoteEvent(NOTE_IDX[0], 0.7, 0, 1, 1);
    const workNote1 = new NoteEvent(NOTE_IDX[0], 0.7, 0, 1, 1);
    const workNote2 = new NoteEvent(NOTE_IDX[0], 0.7, 0, 1, 1);
    const workNote3 = new NoteEvent(NOTE_IDX[0], 0.7, 0, 1, 1);
    const wN = workNote, wN1 = workNote1, wN2 = workNote2, wN3 = workNote3;
    const can = ctx.canvas
    var dragBar = false, dragDir = 0, id= mouse.getId(), dragOffset = 0, mouseOver = false;
    var activeTrack, lineDashOffset = 0, currentDisplayTrack, currentChordType;
    var beatPxW = rSpr.w / 4;
    var leftOffset = view.bar * rSpr.w + view.beat * beatPxW;
    var leftBeatOffset =  view.beat * beatPxW;
    var W = ctx.canvas.width, H = ctx.canvas.height;
    var left = octSpr.w;
    var octaveH = rSpr.h;
    var topIdx = MAX_NOTES - 96 - 1;
    var overNote, unSelectClick = false, addToSelect = false, noteDrag = false, ignoreMouseMove = false, draggingNote, dragNoteOffset;
    const selected = {
        notes: [],
        fromKeyboard: false,
        selecting: false,
        selected: false,
        startPos: {x: 0, y: 0},
        endPos: {x: 0, y: 0},
        clear() {
            selected.selected = selected.selecting = false;
            selected.notes.forEach(selNote => selNote.note.selected = false);
            selected.notes.length = 0;
        },
        eachOnce(cb) {
            const s= selected, ns = s.notes;
            var i = 0;
            while (i < ns.length) {
                if (ns[i].note.selected) {
                    cb(ns[i].note);
                    ns[i].note.selected = false;
                }
                i++;
            }
            while (i-- > 0) { ns[i].note.selected = true }
        },
        each(cb) {
            const s= selected, ns = s.notes;
            var i = 0;
            while (i < ns.length) { cb(ns[i++]) }
        },
        start(note) {
            if (note.onKeyboard) {
                selected.startPos.x = 0;
                selected.endPos.x = seq.length * BPB;
                selected.endPos.y = selected.startPos.y = note.note.idx;
                selected.fromKeyboard = true;
            } else {
                selected.endPos.x = selected.startPos.x = note.bar * BPB + note.beat;
                selected.endPos.y = selected.startPos.y = note.note.idx;
                selected.fromKeyboard = false;
            }
            selected.selecting = true;
        },
        end(note) {
            if (selected.fromKeyboard) {
                selected.endPos.y = note.note.idx;
            } else {
                selected.endPos.x = note.bar * BPB + note.beat;
                selected.endPos.y = note.note.idx;
            }
            selected.selecting = true;
        },
        selectAll() {
            const at = seq.activeTrack;
			if (!at) { return }
            const s= selected;
            s.clear();
            const ns = s.notes;
            const pats = at.patterns;
            const bPats = at.bars;
            var bar = 0;
            while (bar < pats.length) {
                const pat = bPats[pats[bar]] ?? [];
                for (const n of pat) {
					ns.push({bar, note: n});
                }
                bar++;
            }
            ns.forEach(sn => sn.note.selected = true);
            s.removeDuplicates();
            s.sort();
            s.updateExtent();
            s.selecting = false;
            s.selected = true;
			dirty = true;
		},
		select(add = false) {  // add if true adds to selection
            const s= selected;
            !add && s.clear();
            const ns = s.notes;
            const st = s.startPos, ed = s.endPos;
            const x1 = Math.min(st.x, ed.x) + 0.5 / subBeats;
            const y1 = Math.min(st.y, ed.y);
            const x2 = Math.max(st.x, ed.x) + 0.5 / subBeats;
            const y2 = Math.max(st.y, ed.y);
            const at = seq.activeTrack;
            const pats = at.patterns;
            const bPats = at.bars;
            var bar = x1 / BPB | 0
            const endBar = Math.min(x2 / BPB +1 | 0, pats.length);
            var idx = 0, bar, beat;
            while (bar < endBar) {
                const pat = bPats[pats[bar]] ?? [];
                for (const n of pat) {
                    if (n.note.idx >= y1 && n.note.idx <= y2) {
                        const nx = n.beat + bar * BPB;
                        const nx1 = nx + n.length;
                        if ((nx < x1 && nx1 > x1) || (nx < x2 && nx1 > x2) || (nx > x1 && nx1 < x2)) {
                            ns.push({bar, note: n});
                        }
                    }
                }
                bar++;
            }
            ns.forEach(sn => sn.note.selected = true);
            s.removeDuplicates();
            s.sort();
            s.updateExtent();
            s.selecting = false;
            s.selected = true;
        },
		unselectNotes(bar, notes) {  // add if true adds to selection
            const s= selected;
            for (const n of s.notes) {
                if (notes.some(nn => n.bar === bar && n.note === nn)) {
                    n.note.selected = false;
                }
            }
            s.notes = s.notes.filter(n => n.note.selected);
            s.removeDuplicates();
            s.sort();
            s.updateExtent();
            s.selecting = false;
            s.selected = true;
        },        
		selectNotes(bar, notes, add = false) {  // add if true adds to selection
            const s= selected;
            !add && s.clear();
            for (const note of notes) {
                s.notes.push({bar, note});
            }
            
            
            s.notes.forEach(sn => sn.note.selected = true);
            s.removeDuplicates();
            s.sort();
            s.updateExtent();
            s.selecting = false;
            s.selected = true;
        },        
        updateExtent() {
            const s = selected;
            const ns = s.notes;
            var minB = 1000000, maxB = -1000000, maxC = -1000000;
            ns.forEach(sn => {
                const a = sn.bar * BPB + sn.note.beat;
                const b = a + 1 / subBeats;
                const c = a + sn.note.length;
                minB = Math.min(minB, a);
                maxB = Math.max(maxB, b);
                maxC = Math.max(maxC, c);
            });
            s.posMin = minB;
            s.posMax = maxB;
            s.posMaxLen = maxC;
        },
        sort() {
            selected.notes.sort((a, b) => {
                const aPos = a.bar * BPB + a.note.beat;
                const bPos = b.bar * BPB + b.note.beat;
                return aPos === bPos ? a.note.note.idx - b.note.note.idx : aPos - bPos;
            });
        },
        removeDuplicates() {
            const s= selected, ns = s.notes;
            var i = 0, j;
            while (i < ns.length) {
                const sn = ns[i++], n = sn.note;
                j = i;
                while (j < ns.length) {
                    const sn1 = ns[j], n1 = sn1.note;
                    if (sn.bar === sn1.bar && n.note.idx === n1.note.idx && n.beat === n1.beat && n.length === n1.length) {
                        ns.splice(j--, 1);
                    }
                    j++;
                }
            }
        },
        show() {
            for (const {bar, note} of selected.notes) {
                const nIdx = note.note.note;
                const ny = -noteYPos[topIdx];
                const x = bar * rSpr.w + note.beat * beatPxW - leftOffset;
                const y = ny + noteYPos[note.note.idx] + ROLL_Y;
                const spr = S.notes[nIdx];
                const vol = note.vol;
                pianoImage.drawNoteSpr(ctx, spr, left + x, y, note.length * subBeats, NoteColOffSets[lineDashOffset % 12], vol);
            }
            lineDashOffset++;
        },
        showBox() {
            const s= selected;
            const st = s.startPos, ed = s.endPos;
            const x1 = Math.min(st.x, ed.x) / BPB;
            const y1 = Math.min(st.y, ed.y);
            const x2 = Math.max(st.x, ed.x) / BPB;
            const y2 = Math.max(st.y, ed.y);
            const ny = -noteYPos[topIdx];
            const xL = x1 * rSpr.w - leftOffset + (beatPxW / BPB) * 0.5;
            const xR = x2 * rSpr.w - leftOffset + (beatPxW / BPB) * 0.5;
            const yT = ny + noteYPos[y1] + noteYSize[y1] * 0.5;
            const yB = ny + noteYPos[y2] + noteYSize[y2] * 0.5;
            const spr = S.notes[y2 % 12]
            ctx.fillStyle = "#59D6";
            ctx.strokeStyle = "#CDF";
            ctx.setLineDash([4,4]);
            ctx.lineDashOffset = lineDashOffset++;
            ctx.beginPath();
            ctx.rect(left + xL, yT + ROLL_Y, xR - xL, yB- yT);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
        },
    }
    function rollCanvasToPos(x, y, note = wN) {
        const leftOffset = (view.bar * rSpr.w + view.beat * rSpr.w / BPB) * scaleX;
        const mx = (x + leftOffset - octSpr.w * scaleX) / scaleX;
        const my = y / scaleY;
        note.idx = topIdx - ((my + NOTE_Y) / (rSpr.h / 12) | 0);
        note.setNoteByIdx(note.idx);
        var b = Math.min(activeTrack.patterns.length, Math.max(0, mx / rSpr.w | 0));
        note.beat = Math.max(0, (((mx % rSpr.w) / rSpr.w)  * BPB * subBeats | 0) / subBeats);
		note.overBar = true;
        while ((activeTrack.patterns[b] < 0 || activeTrack.patterns.length <= b) && b >= 0) {
            b -= 1;
            note.beat = BPB - note.length;
			note.overBar = false;
        }
        note.bar = b
        note.beatPos = note.bar * BPB + note.beat;
        note.onKeyboard = x < left * scaleX;
        note.colIdx = noteColorIndex;
        return note;
    }
    can._onWheel = () => {
        API.noteScrollBar.value += mouse.wheel < 0 ? 6 : -6;
        redraw = true;
        mouse.wheel = 0;
        API.notePosChanged()
    }
    can._onMouseOut = () => {
        if (mouse.captured === id || mouse.captured === 0) {
            can.style.cursor = "default";
            mouseOver = false;
            redraw = true;
            activeTrack = undefined;
            keyboard.mode = "all";
            API.fireEvent("mouseOverBar", {note: undefined});
            API.fireEvent("mouseOverBeat", {note: undefined});
        }
    }
    can._onMouseOver = () => {  // also move events
        overNote = undefined;
        if (mouse.captured === id || mouse.captured === 0) {
            if (!mouseOver) {
                mouseOver = true;
                activeTrack = seq.activeTrack;
                if (!activeTrack) {
                    return;
                }
            }
            if (!activeTrack) { return }
            if (ignoreMouseMove) {
                ignoreMouseMove = false;
                return;
            }
            keyboard.mode = "pianoRoll";
            mouse.forElement(can);
            const prevBar = wN.bar, prevBeat = wN.beat, prevIdx = wN.idx, prevLen = wN.length, prevOverBar = wN.overBar, prevOver = wN.over, prevOnKeyboard = wN.onKeyboard;
            rollCanvasToPos(mouse.fx, mouse.fy);
            var cursorName = (wN.overBar ? "pointer" : "default") , customCursor = false;
            if ((mouse.button & 2) === 2) {
                API.setMark(wN.bar, wN.beat);
                return;
            }
            if (wN.bar !== prevBar) { API.fireEvent("mouseOverBar", {note: wN}); }
            if (wN.beat !== prevBeat) { API.fireEvent("mouseOverBeat", {note: wN}); }
                
			if (!wN.onKeyboard && !selected.selected && mouse.ctrl && !followPlay) {
				API.setPos(wN.bar, wN.beat, false);
				return;
			}
            wN.modLength = false;
            wN.over = -1;
            if (activeTrack) {
				if (wN.onKeyboard) {
					customCursor = true;
					cursorName = "pointer_play_note";

				} else {
                    
					const over = activeTrack.noteIdxAt(wN.bar, wN.beat , wN.idx);
					if (over === false) {
						mouseOver = false;
					} else if (over !== undefined) {
						wN.over = over;
						overNote = activeTrack.getNoteByIdx(wN.bar, over);
						if (mouse.ctrl) {
							customCursor = true;
							cursorName = "pointer_delete";
						} else {
							cursorName =  "move";
						}
					}
				}
                if (prevIdx !== wN.idx || (!wN.onKeyboard && (prevBar !== wN.bar || prevBeat !== wN.beat))) {
                    const noteInfo = seq.activeTrack?.play?.getNoteInfo(wN);
                    if (!noteInfo.empty) {
                        const chord = getChordForKey(wN.note.idx, currentChordType);
                        if (wN.onKeyboard) {
                            commons.system.updateSynthLog(1, "Note: " + wN.note.name + (key.chordType ? " " + key.chordType : ""));
                        } else {
                            commons.system.updateSynthLog(1, "Note: " + wN.note.name + (key.chordType ? " " + key.chordType : "") + " @" + wN.bar + ":" + (wN.beat * subBeats));
                        }
                        if (noteInfo.empty === undefined) {
                            commons.system.updateSynthLog(2, noteInfo.sample);
                            const beats = noteInfo.duration * seq.beatScale * subBeats;
                            
                            commons.system.updateSynthLog(3, noteInfo.duration.toFixed(2) + " sec " + beats.toFixed(1) + "* " + (noteInfo.loops ? " loops" : "") + ".");
                        }
                    } else {
                        commons.system.clearSynthLog();
                        
                    }
                }                
            }
            customCursor ? mouse.requestCustomCursor(0, cursorName, can) : (can.style.cursor = cursorName);
            
            (prevOver !== wN.over || prevBar !== wN.bar || prevBeat !== wN.beat || prevIdx !== wN.idx || prevLen !== wN.length || prevOverBar !== wN.overBar || prevOnKeyboard !== wN.onKeyboard) && (redraw = true);
        }
    }
    can._onMouseDown = () => {
        if (!activeTrack) { return }
        if (mouse.captured === 0) {
            const captured = mouse.requestCapture(id, mouseDrag);
            if (captured) {
                unSelectClick = false;
                addToSelect = false;
                noteDrag = false;
				if (wN.onKeyboard && (mouse.button & 4) === 0) {
					if (activeTrack) {
						if ((mouse.shift) && !selected.selected) {
							const [bar, beat] = API.getPlayPos();
							wN.bar = bar;
							wN.beat = beat;
							activeTrack.insertNotes(wN.clone(BPB, BPB));
							activeTrack.play(wN.clone(), synth.atx.currentTime, synth.atx.currentTime + wN.length / seq.timeScale, activeTrack.envelopeIdx);
							if (mouse.ctrl) {
								setTimeout(() => {
									const pos= bar * BPB + beat + wN.length;
									API.setPos(pos / BPB | 0, pos % BPB);
								}, (wN.length / seq.timeScale) * 1000);
							}
							dirty = true;
							redrawAll = true;
						} else {
                            const n = wN.clone();
                            API.fireEvent("playnote", n);
							activeTrack.play(n, synth.atx.currentTime, synth.atx.currentTime + n.length / seq.timeScale, activeTrack.envelopeIdx);
						}
					}
					mouse.releaseCapture(id);
					return;
				}
                if ((mouse.button & 4)  === 4) {
                    addToSelect = mouse.ctrl;
                    !addToSelect && selected.clear();
                    selected.start(wN);
                    API.setMark(wN.bar, wN.beat);
                } else if ((mouse.button & 1)  === 1) {
                    if (selected.selected) {
                        const over = activeTrack.noteIdxAt(wN.bar, wN.beat, wN.note.idx );
                        if (over !== undefined && over !== false) {
                            overNote = activeTrack.getNoteByIdx(wN.bar, over);
                            if (overNote?.selected) {
                                if (mouse.ctrl) {
                                    activeTrack.deletePattern(-1);
                                    unSelectClick = true;
                                } else {
                                    if (mouse.shift) {
                                        activeTrack.cloneSelectedNotes();
                                    }
                                    selected.updateExtent();
                                    noteDrag = true;
                                    draggingNote = overNote;
                                    dragNoteOffset = wN.beatPos - (draggingNote.bar * BPB + draggingNote.beat)
                                    dirty = true;
                                    redrawAll = true;
                                    wN.over = -1;
                                    overNote = undefined;
                                    return;
                                }
                            } else {
                                unSelectClick = true;
                            }
                        } else {
                            unSelectClick = true;
                        }
                        unSelectClick && selected.clear();
                        overNote = undefined;
                    } else if (activeTrack) {
                        const over = activeTrack.noteIdxAt(wN.bar, wN.beat, wN.note.idx );
                        if (over !== undefined && over !== false) {
                            if (mouse.ctrl) {
                                activeTrack.removeByIdx(wN.bar, over);
                                mouse.releaseCapture(id);
                            } else {
                                draggingNote = activeTrack.getNoteByIdx(wN.bar, over);
                                dragNoteOffset = wN.beatPos - (draggingNote.bar * BPB + draggingNote.beat)
                                wN.length = draggingNote.length;
                                noteDrag = true;
                            }
                            overNote = undefined;
                            dirty = true;
                            redrawAll = true;
                            wN.over = -1;
                            return;
                        }
                    }
                    if (!unSelectClick && activeTrack && !seq.playing) {
                        const play = activeTrack?.play ?? synth.w1;
                        play(wN.clone(), synth.atx.currentTime, synth.atx.currentTime + wN.length / seq.timeScale, activeTrack.envelopeIdx);
                    }
                }
            }
            can.style.cursor = "pointer";
            redraw = true;
        }
    }
    can._onMouseUp = () => {    }
    function mouseUp() {
        if (mouse.captured === id) {
            if (selected.selecting) {
                mouse.forElement(can);
                rollCanvasToPos(mouse.fx, mouse.fy, wN1);
                selected.end(wN1);
                selected.select(addToSelect);
                addToSelect = false;
            } else if (noteDrag) {
                noteDrag = false;
                if (activeTrack) {
                    draggingNote = undefined;
                    seq.soil();
                    activeTrack.dirty = true;
                    wN.over = -1;
                    dirty = true;
                    redrawAll = true;
                }
            } else if (!unSelectClick) {
                if (activeTrack) {
                    if (mouse.shift) {                
                        const chord = getChordForKey(wN.note.idx, currentChordType); //key.chordAt(wN.note.idx, currentChordType) ?? [];
                        const rootIdx = chord.fixedPos ? 0 : wN.note.idx;
                        for (const cn of chord) {
                            wN.setNoteByIdx(cn + rootIdx);
                            const n = wN.cloneNew();
                            activeTrack.insertNotes(n);
                        }
                    } else {
                        activeTrack.insertNotes(wN.cloneNew());
                    }
                    dirty = true;
                    redrawAll = true;
                }
            }
            unSelectClick = false;
            mouse.releaseCapture(id);
            overNote = undefined;
            redraw = true;
            ignoreMouseMove = true;  // after the mouse up there is a mouse move. This prevents the mouse move action which is already in the event stack from doing anything befor everything has updated
        }
    }
    function doNoteDrag() {
        const prevBar = draggingNote.bar, prevBeat = draggingNote.beat, prevIdx = draggingNote.note.idx;
        rollCanvasToPos(mouse.fx, mouse.fy, wN);
        const prevBeatBar = prevBar * BPB + prevBeat;
        var beatBarMove = (wN.bar * BPB + wN.beat) - prevBeatBar;
        const prevBeatBarOff = prevBeatBar - dragNoteOffset;
        if (selected.selected) {
            const idxMove = wN.idx - prevIdx;
            beatBarMove = beatBarMove - dragNoteOffset;
            if (idxMove !== 0 || beatBarMove !== 0) {
                if (beatBarMove < 0) {
                    if (selected.posMin + beatBarMove < 0) { beatBarMove = -selected.posMin }
                } else if (beatBarMove > 0) {
                    if (selected.posMax + beatBarMove >= activeTrack.patterns.length * BPB) {
                        beatBarMove = activeTrack.patterns.length * BPB - selected.posMax;
                    }
                }
                if (beatBarMove !== 0 || idxMove !== 0) {
                    selected.each(selNote => {
                        activeTrack.moveNote(selNote.note, beatBarMove, idxMove);
                        selNote.bar = selNote.note.bar;
                    });
                    selected.posMax += beatBarMove;
                    selected.posMin += beatBarMove;
                    dirty = true;
                    redrawAll = true;
                }
            }
        } else {
            const idxMove = wN.idx - prevIdx;
            beatBarMove = beatBarMove - dragNoteOffset;
            if (idxMove !== 0 || beatBarMove !== 0) {
                if (beatBarMove < 0) {
                    if (prevBeatBar + beatBarMove < 0) { beatBarMove = -prevBeatBar }
                } else if (beatBarMove > 0) {
                    if (prevBeatBar + beatBarMove > activeTrack.patterns.length * BPB) {
                        beatBarMove = (prevBeatBar + beatBarMove) - (activeTrack.patterns.length * BPB - dragNoteOffset);
                    }
                }
                if (idxMove !== 0 || beatBarMove !== 0) {
                    if (activeTrack.moveNote(draggingNote, beatBarMove, idxMove)) {
                        dirty = true;
                        redrawAll = true;
                    }
                }
            }
        }
        mouseOver = true;
        var cursorName = "none";
        can.style.cursor = cursorName;
        redraw = true;
    }
    function doNoteAdd() {
        const prevBar = wN.bar, prevBeat = wN.beat, prevIdx = wN.idx, prevLen = wN.length;
        rollCanvasToPos(mouse.fx, mouse.fy, wN1);
        if (wN1.beatPos < wN.beatPos - 1) {
            wN.bar = wN1.bar;
            wN.beat = wN1.beat;
            wN.beatPos = wN1.beatPos;
            wN.length = 1 / subBeats;
            wN.modLength = true;
        } else if (wN1.beatPos > wN.beatPos + wN.length && !wN.modLength) {
            wN.modLength = true;
        } else if (wN.modLength === true) {
            wN.length = Math.max(1 / subBeats, wN1.beatPos - wN.beatPos);
        }
        var cursorName = "pointer";
        can.style.cursor = cursorName;
        mouseOver = true;
        (prevBar !== wN.bar || prevBeat !== wN.beat || prevIdx !== wN.idx || prevLen !== wN.length) && (redraw = true);
    }
    function mouseDrag(event) {
        if (event.type === "mouseup") { mouseUp() }
        else if (event.type === "mousemove" && !unSelectClick) {
            mouse.forElement(can);
            if(noteDrag) {
                doNoteDrag();
            } else if (selected.selecting) {
                rollCanvasToPos(mouse.fx, mouse.fy, wN1);
                selected.end(wN1);
                redraw = true;
            } else { doNoteAdd() }
        }
    }
    const API = {
        id: mouse.getId(),
        noteIdx: 32,
        get noteColorIdx() { return noteColorIndex },
        set noteColorIdx(val) { noteColorIndex = val },
        selection: selected,
		get mouseOverBar() { return wN.overBar ? wN.bar : undefined },
		get key() { return key },
        set highlightBar(val) {
            if (highlightBar !== val) {
                highlightBar = val
                redraw = true;
            }
        },
        set highlightBeat(val) {
            if (highlightBeat !== val) {
                highlightBeat = val
                redraw = true;
            }            
            
        },
        scaleZoom(sx, sy) {
            scaleX *= sx;
            scaleY *= sy;
            dirty = true;
            redrawAll = true;
        },
        setZoom(zoomX, zoomY) {
            scaleX = zoomX;
            scaleY = zoomY;
            dirty = true;
            redrawAll = true;
        },
        getZoom() {return [scaleX, scaleY]},
        notePosChanged() {
            const idx = API.noteScrollBar.value < 0 ? 0 : API.noteScrollBar.value;
            if (idx !== API.noteIdx) {
                API.noteIdx = idx | 0;
                dirty = true;
                redrawAll = true;
            }
        },
        playKeyboardPos(noteIdx) {
            const rootIdx = ((wN.idx - 3)/ 12 | 0) * 12 + 3;
            wN3.setNoteByIdx(rootIdx + noteIdx);
            const on = synth.atx.currentTime;
            const off = on + wN.length / seq.timeScale
            const n = wN3.clone();
            activeTrack?.play(n, on, off, activeTrack.envelopeIdx);
            API.addNote(n, on, off);
        },
        addKeyboardPos(noteIdx) {
			if (activeTrack) {
				const rootIdx = ((wN.idx - 3)/ 12 | 0) * 12 + 3;
				const [bar, beat] = API.getPlayPos();
				wN.setNoteByIdx(rootIdx + noteIdx);
				wN.bar = bar;
				wN.beat = beat;
				const on = synth.atx.currentTime;
				const off = on + wN.length / seq.timeScale
				const n = wN.clone();
				activeTrack.play(n, on, off, activeTrack.envelopeIdx);
				API.addNote(n, on, off);
				activeTrack.insertNotes(wN.clone(BPB, BPB));
				dirty = true;
				redrawAll = true;
			}
        },
        playNote() {
            if (activeTrack) {
                const on = synth.atx.currentTime;
                const off = on + wN.length / seq.timeScale
                const n = wN.clone();
                //n.vol = 0;//activeTrack.vol;
                n.vol = seq.activeTrack.vol;
                activeTrack.play.pan(activeTrack.pan * 2 - 1);
                activeTrack.play(n, on, off, activeTrack.envelopeIdx);
                API.addNote(n, on, off);
                API.fireEvent("playnote", n);

            }
        },
        getNote() {
            return wN.cloneNew();
        },
        noteAt(bar, beat) {
            
        },
        playANote(note, on, off) {
            if (seq.activeTrack) {
                note.vol = seq.activeTrack.vol;
                seq.activeTrack.play.pan(seq.activeTrack.pan * 2 - 1);
                seq.activeTrack.play(note, on, off, seq.activeTrack.envelopeIdx);
                API.addNote(note, on, off);
                API.fireEvent("playnote", note);


            }
        },        
        playChord() {
            if (activeTrack) {
                const on = synth.atx.currentTime;
                const off = on + wN.length / seq.timeScale
                const chord = getChordForKey(wN.note.idx, currentChordType) ?? [];//key.chordAt(wN.note.idx, currentChordType) ?? [];
                const rootIdx = chord.fixedPos ? 0 : wN.note.idx;
                var i = 0, offset = chord.fixedPos ? (1/subBeats) / seq.timeScale : 0;
                activeTrack.play.pan(activeTrack.pan * 2 - 1);
                var str = "play [", s = "";

                for (const cn of chord) {
                    wN.setNoteByIdx(cn + rootIdx);
                    const n = wN.clone();
                    
                    n.vol = activeTrack.vol;
                    activeTrack.play(n, on + i * offset, off + i * offset, activeTrack.envelopeIdx);
                    API.addNote(n, on + 0 * offset, off + 0 * offset);
                    str += s + n.note.name;
                    s = " ";
                    const pos = n.bar * subBeats + n.beat/BPB + 0 * 1/subBeats;
                    i++;
                }
                str += "]";
                wN.setNoteByIdx(rootIdx);

            }
        },
        playPos() {
            if (activeTrack) {
                const bar = activeTrack.bars[activeTrack.patterns[wN.bar]];
                const b = wN.beat;
                if (bar) {
                    const play = [];
                    for (const n of bar) {
                        if (n.beat <= b && n.beat + n.length > b) {
                            const nn = n.clone();
                            nn.vol = activeTrack.vol;
                            play.push(nn);
                        }
                    }
                    const start = synth.atx.currentTime + 0.1;
                    const end = start + wN.length / seq.timeScale;
                    const eIdx = activeTrack.envelopeIdx;
                    for (const n of play) {
                        activeTrack.play(n, start, end, eIdx);
                        API.addNote(n, start, end);
                    }
                }
            }
        },
        savePos() { posStack.push([view.bar, view.beat]) },
        recallPos() { posStack.length && API.setPos(...posStack.pop()) },
        getPos() { return [view.bar, view.beat] },
        getPlayPos() { return [play.bar, play.beat] },
        getCursorPos() { return [wN.bar, wN.beat, wN.idx] },
		set followPlay(state) { followPlay = state },
		get followPlay() { return followPlay },
        setPos(nBar, nBeat, viewPos = false) {
			const v = viewPos ? view : play;
            if (nBar !== v.bar) {
                v.bar = nBar;
                API.fireEvent("barChange",{bar: v.bar});
                dirty = true;
            }
            if (nBeat !== v.beat) {
                v.beat = nBeat;
                redraw = true;
            }
			if (!viewPos && followPlay) {
				view.bar = v.bar;
				view.beat = v.beat;
			}
        },
        barPosChanged() {
            const range = Math.min(bars * BPB, ((W - octSpr.w * scaleX) / (rSpr.w * scaleX))  * BPB);
            const max = bars * BPB
            var val = API.barScrollBar.value;
            val = val < 0 ? 0 : val > max - range ? max - range : val;
            API.setPos(val / BPB | 0, val % BPB, true);
        },
        posBarFromScrollBar() {
            posStack.length && API.recallPos();
            return [ view.bar, view.beat];
        },
        highlightNote(note) {
            const noteLen = note.length * beatPxW;
            const nIdx = note.note.note;
            const x = note.bar * rSpr.w + note.beat * beatPxW - leftOffset;
            const y = -noteYPos[topIdx] + noteYPos[note.note.idx] + ROLL_Y;
            const h = noteYSize[note.note.idx];
            ctx.lineWidth = 3;
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = "#CDF";
            ctx.setLineDash([1,2]);
            ctx.lineDashOffset = (lineDashOffset++) / 6;
            ctx.beginPath();
            ctx.rect(left + x, y, noteLen, h);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.globalCompositeOperation = "source-over";
            ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        },
        drawMouseNote(top, note) {
			const spr = S.keys[noteColorIndex];
			ctx.globalAlpha = 0.75;
			pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[note.idx]);
			ctx.globalAlpha = 1;
		},
        drawNote(note, showRow = true, posOnly = false, force = false) {
           
            const noteLen = note.length;
            if (note.over === -1 || force) {
                const nIdx = note.note.note;
                const ny = -noteYPos[topIdx];
                const x = note.bar * rSpr.w + note.beat * beatPxW - leftOffset;
                const y = ny + noteYPos[note.note.idx] + ROLL_Y;
                const yy = ny + keyYPos[note.note.idx];
                const spr = S.notes[nIdx];
                const noteMarkW = Math.min((bars - view.bar) * rSpr.w - leftBeatOffset, W - left)
                ctx.globalAlpha = 0.4;
                pianoImage.drawNoteRect(ctx, spr, left, y, noteMarkW);
                if (!note.onKeyboard) {
                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = "lighter";
                    pianoImage.drawNoteRect(ctx, S.darkSwatch, left + x, 0, 4, H);
                    pianoImage.drawNoteRect(ctx, S.darkSwatch, left + x + note.length * beatPxW - 4, 0, 4, H);
                    ctx.globalCompositeOperation = "source-over";
                }
                ctx.globalAlpha = 0.2;
                pianoImage.drawNoteRect(ctx, spr, left, y - octaveH - rSpr.h, noteMarkW);
                pianoImage.drawNoteRect(ctx, spr, left, y - octaveH, noteMarkW);
                pianoImage.drawNoteRect(ctx, spr, left, y + octaveH, noteMarkW);
                pianoImage.drawNoteRect(ctx, spr, left, y + octaveH + rSpr.h, noteMarkW);
                ctx.globalAlpha = 1;
                const vol = note.vol;
                !posOnly && !note.onKeyboard && pianoImage.drawNoteSpr(ctx, spr, left + x, y, note.length * subBeats, (note.colIdx  % 12) + 1, vol);//NoteColOffSets[note.colIdx  % 12]);
                const desc = noteDesc(note);
                commons.currentNoteDetails && (commons.currentNoteDetails.element.textContent = desc);
            }
            note.length = noteLen;
        },
        addNote(note, on, off) {
            keysPlay[keysPlay.size++] = (keysPool.length ? keysPool.pop() : new PlayKey()).init(note, on, off);
            
            
        },
        drawChord(top, type = "") {
			if (mouseOver && activeTrack) {
				const chord = getChordForKey(wN.note.idx, type);

                    
                if (chord) {    
                    ctx.globalAlpha = 0.5;
                    if (chord.fixedPos) {
                        for (const cn of chord) {
                            const spr = S.keys[wN.colIdx];
                            pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[cn]);
                        }
                    } else {
                        if (wN.colIdx !== undefined) {
                            for (const cn of chord) {
                                const spr = S.keys[wN.colIdx];
                                pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[cn + wN.note.idx]);
                            }
                        }
                    }
                    ctx.globalAlpha = 1;
                }
			}
		},
		drawKeysMarks(top) {
            if (mouseOver) {
                const t1 = seq.tracks[0];
                if (t1 && t1.mute) {
                    const patIdx = t1.patterns[wN.bar];
                    const pat = t1.bars[patIdx];
                    for (const n of pat) {
                        const spr = S.keys[n.colIdx];
                        pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[n.note.idx]);
                        pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[n.note.idx - 24]);
                        pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[n.note.idx - 12]);
                        pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[n.note.idx + 12]);
                        pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[n.note.idx + 24]);
                    }
                }
            }
        },
        drawKeys(top) {
            const t = synth.atx.currentTime;
            var tail = 0, head = 0;
            const size = keysPlay.size;
            const spr = S.keys[noteColorIndex];
            while (head < size) {
                const note = keysPlay[head];
                if (note.off <= t) {
                    keysPool.push(note);
                    keysPlay[head] = undefined;
                    head ++;
                } else {
                    if (note.on <= t) {
                        ctx.globalAlpha = 1 - Math.min(1, Math.max(0, (t - note.on) / (note.len))) ** 2;
                        if (sharpKeys[note.idx]) {
                            pianoImage.drawSprSrt(ctx, spr, 0, top + keyYPos[note.idx]);
                        } else {
                            pianoImage.drawSpr(ctx, spr, 0, top + keyYPos[note.idx]);
                        }
                    }
                    if (head !== tail) {
                        keysPlay[tail] = keysPlay[head];
                    }
                    tail ++;
                    head ++;
                }
            }
            keysPlay.size = tail;
            ctx.globalAlpha = 1;
        },
        squencerStoppedPlay() {
            keysPlay.length = keysPlay.size;
            keysPool.push(...keysPlay);
            keysPlay.size = 0;
        },
        update() {
            BPM = seq.BPM;
            API.setPos(...(seq.playing ? [...seq.pos, false] : [...API.posBarFromScrollBar(), true]));
            bars = Math.max(seq.length , 1);
            beats = bars * BPB;
            leftOffset = view.bar * rSpr.w + view.beat * beatPxW;
            leftBeatOffset =  view.beat * beatPxW;
            API.noteScrollBar.min = 0;
            API.noteScrollBar.max = MAX_NOTES;
            API.noteScrollBar.range = (ctx.canvas.height / (octSpr.h * scaleY)) * 12;
            API.noteScrollBar.value = API.noteIdx;
            API.barScrollBar.min = 0;
            const max = API.barScrollBar.max =  bars * BPB;
            const range = API.barScrollBar.range = Math.min(bars * BPB, ((W - octSpr.w * scaleX) / (rSpr.w * scaleX))  * BPB);
            const v1 =  view.bar * BPB + view.beat;
            const val = API.barScrollBar.value = view.bar * BPB + view.beat;
            if (keysPlay.length) { redraw = true }
        },
        resized() {
            dirty = true;
        },
        musicChange(event) {
			if (event.data.chord) {
				currentChordType = event.data.chord;
                log("Chord type: " + event.data.chord);
				dirty = true;
			} else {
				key = createKey(event.data.key, NamedScales[event.data.scale]);
                //keyList[0] = createKey(event.data.key, NamedScales.major);
                //keyList[1] = createKey(event.data.key, NamedScales.minor)
				updateRoll();
				return key;
			}
		},
		trackChange(event) {
            if (event.data.type === "active" || event.data.type === "channel" || event.data.type === "pattern" || event.data.type === "show"  || event.data.type === "color") {
                if (event.data.track?.active) {                    
                    currentDisplayTrack = activeTrack = event.data.track;
					updateRoll();
                    noteColorIndex = activeTrack.noteColorIdx;
                } else if (event.data.type === "show") {
                    const cDT = currentDisplayTrack, aT = activeTrack;
                    currentDisplayTrack = activeTrack = event.data.track;
					updateRoll();
                    currentDisplayTrack = cDT;
                    activeTrack = aT;
                    
                } else {
					currentDisplayTrack = activeTrack = undefined;
					dirty = true;
				}
                if(event.data.type === "active" || event.data.type === "pattern") {
                    event.data.type === "active" && selected.clear();
                    //dirty = true;
                    //redrawAll = true;
                }
            }
        },
        getTimeSignature() {
            return {BPB, subBeats};
        },
        timeSignatureChange(event) {
            if (subBeats !== event.data.SBPB || BPB !== event.data.BPB) {
                
                log("Ticks per beat: " + event.data.SBPB);
                log("Beats per bar: " + event.data.BPB);
                subBeats = event.data.SBPB;
                BPB = event.data.BPB;
				updateRoll();
                wN.length = 1 / subBeats;
            }
        },
        redrawBg() {
            if (!dirty) { return }
            W = ctx.canvas.width;
            H = ctx.canvas.height;
            beatPxW = rSpr.w / BPB;
            left = octSpr.w;
            octaveH = rSpr.h;
            topIdx = MAX_NOTES - API.noteIdx - 1;
            if (redrawAll) {
                API.redrawAllBg();
                return;
            }
            dirty = false;
            var i = 0;
            const bgBars = Math.ceil(W / (rSpr.w * scaleX));
            const bgs = [...bgCanBar];
            bgCanBar.fill(null);
            while (i < bgBars && i < bgs.length) {
                const bIdx = bgs[i].bar;
                if (bIdx >= view.bar && bIdx < view.bar + bgBars) {
                    bgCanBar[bIdx - view.bar] = bgs[i];
                    bgs[i] = null;
                }
                i++;
            }
            const bgs1 = bgs.filter(b => b !== null);
            i = 0;
            while (i < bgBars) {
                if (!bgCanBar[i]) {
                    if (bgs1.length) {
                        bgCanBar[i] = bgs1.pop();
                    } else {
                        bgCanBar[i] = createCanvas();
                    }
                    bgCanBar[i].width = rSpr.w;
                    bgCanBar[i].height = ctx.canvas.height;
                    bgCanBar[i].bar = view.bar + i;
                    bgCanBar[i].empty = true;
                    bgCanBar[i].redraw = true;
                }
                i ++;
            }
            bgCanBar.length = i;
            API.drawSeqTrack(false, true);
        },
        redrawAllBg() {
            if (!dirty) { return }
            dirty = false;
            redrawAll = false;
            var i = 0;
            const bgBars = Math.ceil(W / (rSpr.w * scaleX));
            while (i < bgBars) {
                if (!bgCanBar[i]) {
                    bgCanBar[i] = createCanvas();
                }
                bgCanBar[i].width = rSpr.w;
                bgCanBar[i].height = ctx.canvas.height;
                bgCanBar[i].bar = view.bar + i;
                bgCanBar[i].empty = true;
                bgCanBar[i].redraw = true;
                i ++;
            }
            bgCanBar.length = i;
            API.drawSeqTrack(false, true);
        },
        drawSeqTrack(activeOnly = false, clear = true) {
            const ny = -noteYPos[topIdx];
            var tIdx = 0,  at;
            const aa = seq.activeTrack;
            const bgCount = bgCanBar.length
            const barPxW = rSpr.w;
            const beatPxW = barPxW / BPB;
            var alpha = 1;
            var cc = 0;
            if (!activeOnly || clear) {
                for (const bcan of bgCanBar) {
                    if (bcan.redraw) {
                        bcan.ctx.clearRect(0, 0, bcan.ctx.canvas.width, bcan.ctx.canvas.height);
                    }
                }
            }
            while (tIdx < seq.tracks.length) {
                if (activeOnly) {
                    at = aa;
                } else {
                    alpha = 0.7;
                    at = seq.tracks[tIdx];
                    at = aa === at ? undefined : (at.show ? at : undefined);
                }
                var bi = 0, i, sbi = view.bar;
                if (at) {
                    const noteCol = NoteColOffSets[at.idx % 12];
                    bi = 0;
                    while (bi < bgCount) {
                        const bNotes = at.getNotesForBar(sbi);
                        if (bNotes) {
                            i = 0;
                            const bCan = bgCanBar[bi], bCtx = bCan.ctx;
                            if (bCan.redraw) {
                                bCtx.globalAlpha = alpha;
                                cc ++;
                                while (i < bNotes.length) {
                                    const note = bNotes[i];
                                    const x = note.beat  * beatPxW;
                                    const y = ny + noteYPos[note.note.idx] + ROLL_Y;
                                    const nIdx = note.note.note;
                                    const vol = note.vol;
                                    pianoImage.drawNoteSpr(bCtx, S.notes[nIdx], x, y, note.length * subBeats, note.colIdx + 1, vol);
                                    bCan.empty = false;
                                    i ++;
                                }
                                bCtx.globalAlpha = 1;
                            }
                        }
                        sbi ++;
                        bi++;
                    }
                }
                if (activeOnly) {
                    break;
                }
                tIdx ++;
            }
            if (cc > 0) { trackDraws = 0 }
            else { trackDraws += 1 }
            if (!activeOnly) { API.drawSeqTrack(true, false) }
        },
        getMark() {
            return marked;
        },
        setMark(bar, beat)  {
            marked.bar = bar + (beat / BPB | 0);
            marked.beat = beat % BPB;
            //commons.pianoRollMarkerPosition && (commons.pianoRollMarkerPosition.element.textContent = (marked.bar + 1) + "/" + (marked.beat + 1).toFixed(2));
            redraw = true;
        },
        moveMark(bars, beats) {
            bars += beats / BPB | 0;
            marked.bar += bars;
            marked.beat += (beats % BPB);
            //commons.pianoRollMarkerPosition && (commons.pianoRollMarkerPosition.element.textContent = (marked.bar + 1) + "/" + (marked.beat + 1).toFixed(2));
            redraw = true;
        },
        getShowVolume() { return showVolume; },
        setShowVolume(val) { 
            if (val !== showVolume) {
                showVolume = val; 
                API.soil();
            }
        },
        soil() {
            dirty = redraw = redrawAll = true;
        },
        draw() {
            API.update();
            if (!dirty && !redraw) { return }
            dirty && API.redrawBg();
            commons.pianoRollPosition && (commons.pianoRollPosition.element.textContent = (play.bar + 1) + "/" + (play.beat + 1).toFixed(2));
            commons.pianoRollMarkerPosition && (commons.pianoRollMarkerPosition.element.textContent = (marked.bar + 1) + "/" + (marked.beat + 1).toFixed(2));
			var posBarCol;
            if (seq.playing) {
                const onFor = Math.min(0.5, (BPM * BPB) / 3600);
				let al;
                const a = (al = Math.min(1, ((1 - play.beat % 1) + onFor)) ** 2 * 255 | 0).toString(16). padStart(2,"00");
                const b = play.beat | 0;
                const c = b === 0 ? "#FF0000" : "#00FF00";
                commons.playButton.element.style.backgroundColor = posBarCol = c + a;
            }
            ctx.imageSmoothingEnabled = false;
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
            const top = -noteYPos[MAX_NOTES - API.noteIdx - 1]
            const topF = top - 3;
            var left = (octSpr.w - (view.bar * rSpr.w + view.beat * rSpr.w / BPB));
            var b = view.bar, i = 0, resetAlpha = false, pBar;

                
            const barCount = currentDisplayTrack?.patterns.length ?? 0;
			if (currentDisplayTrack) {
				while (b < barCount) {
					const bx = left + b * rSpr.w;
					if (bx + rSpr.w > octSpr.w) {
						if (currentDisplayTrack.patterns[b] > -1)  { ctx.drawImage(notesCan, bx, topF) }
						if (highlightBar === b) {
							ctx.globalCompositeOperation = "screen";
							ctx.globalAlpha = 0.5;
							ctx.drawImage(notesCan, bx, topF);
							ctx.globalAlpha = 1;
							ctx.globalCompositeOperation = "source-over";
						}
                        if (highlightBeat > -1) {
                            //const markerPos = b * rSpr.w + highlightBeat * rSpr.w / BPB;
                            //ctx.fillRect(markerPos + left, 0 , (1 / subBeats) *  rSpr.w / BPB , ctx.canvas.height);                               
                            if (currentDisplayTrack.swingOn) {
                                ctx.fillStyle = "#0E06";
                                const offset = currentDisplayTrack.swing[highlightBeat * subBeats] * sequencer.SWING_RESOLUTION;
                                const markerPos = b * rSpr.w + (highlightBeat + offset) * rSpr.w / BPB;
                                ctx.fillRect(markerPos + left, 0 , (1 / subBeats) *  rSpr.w / BPB , ctx.canvas.height);  
                                
                            }
                            
                        }
						if (bx > ctx.canvas.width) { break }
					}
					b++;
				}
			}
			if (!(selected.selected || selected.selecting)) {
				mouseOver && currentDisplayTrack && (
					!noteDrag ?
						(wN.overBar && API.drawNote(wN, true, mouse.ctrl && !noteDrag, true)) :
						API.drawNote(draggingNote, true, mouse.ctrl && !noteDrag, true));
				redraw = false;
			}
			ctx.drawImage(keysCan, 0, top);
            
            
            if (!seq.playing) {
				const markerPos = marked.bar * rSpr.w + marked.beat * rSpr.w / BPB;
				ctx.fillStyle = "#00F9";
				ctx.fillRect(markerPos + left, 0 , (1 / subBeats) *  rSpr.w / BPB , ctx.canvas.height);   
            }            
            
			mouseOver && currentDisplayTrack && pianoImage.drawSpr(ctx, S.keys[wN.note.note], 0, top + keyYPos[wN.note.idx] + ROLL_Y);
            if (currentDisplayTrack) {
                b = view.bar;
				pBar = play.bar;
				const pPIdx = currentDisplayTrack.patterns[pBar];
				const pPos = play.beat * rSpr.w / BPB;
                const barCount = currentDisplayTrack.patterns.length;
                while (b < barCount) {
                    const bx = left + b * rSpr.w;
                    if (bx + rSpr.w > octSpr.w) {
                        if (bgCanBar[i]) {
                            const bCan = bgCanBar[i];
                            bCan.redraw = false;
                            const patIdx = currentDisplayTrack.patterns[b];
                            if (patIdx > -1) {
                                ctx.drawImage(bCan, bx, 0);
                                if (icons.complete) {
                                    const spr = icons.barSprites[(currentDisplayTrack.patterns[b] + 8) % icons.barSprites.length];
                                    ctx.drawImage(icons, spr.x + 1, spr.y + 1, spr.w - 2, spr.h - 2, bx + 2, 1, spr.w - 2, spr.h - 2);
                                }
								if (patIdx === pPIdx) {
									ctx.fillStyle = "#FFF";
									ctx.fillRect(bx - 1 + pPos, 0 , 1, ctx.canvas.height);
								}
                            }
                            i ++;
                        }
                        if (bx > ctx.canvas.width) { break }
                    }
                    b++;
                }
            }
            if (selected.selected || selected.selecting) {
                selected.selected && selected.show();
                selected.selecting && selected.showBox();
                redraw = true;
            }
            if (overNote && mouseOver && currentDisplayTrack) {
                API.highlightNote(overNote);
                redraw = true;
            }
            ctx.drawImage(keysCan, 0, top);
            if (seq.playing) {
				const playPos = play.bar * rSpr.w + play.beat * rSpr.w / BPB;
				ctx.fillStyle = posBarCol;
				ctx.fillRect(playPos +left, 0 , 3, ctx.canvas.height);
                API.drawKeys(top + ROLL_Y);
            } else {
				API.drawChord(top + ROLL_Y, currentChordType);
				//const playPos = play.bar * rSpr.w + play.beat * rSpr.w / BPB;
				//ctx.fillStyle = PosLineBeatCols[play.beat | 0];
				//ctx.fillRect(playPos +left, 0 , wN.length * rSpr.w / BPB, ctx.canvas.height);
                
            
                
                API.drawKeys(top + ROLL_Y);
                API.drawKeysMarks(top + ROLL_Y);
				wN.onKeyboard && API.drawMouseNote(top, wN);
            }
        },
        create() {
            commons.commandSets.registerSet(commons.commands.PIANO_ROLL , commons.commands.PIANO_ROLL_END, API);
            
            return API;
        },
        commands: {
            [commons.commands.prAddChord](cmd, left, right, e) {
                if (e && seq.activeTrack) {
                    if (NOTE_NAME.has(e.note)) {
                        if (e.chord !== undefined && chordsNamed[e.chord]) {
                            if (e.bar !== undefined && !isNaN(e.bar) && e.bar >= 0) {
                                if (e.beat !== undefined && !isNaN(e.beat) && e.beat >= 0) {
                                    e.beat /= subBeats;
                                    e.beat %= BPB;
                                    e.bar += (e.beat / BPB | 0);
                                    const chord = chordsNamed[e.chord];
                                    const nRef = NOTE_NAME.get(e.note);
                                    const at = seq.activeTrack;
                                    wN.bar = e.bar;
                                    wN.beat = e.beat;
                                    for (const off of chord) {
                                        wN.setNoteByIdx(nRef.idx + off);
                                        const newNote = wN.cloneNew();
                                        newNote.length = validateNoteLen(e.length) ?  e.length / subBeats : wN.length;
                                        at.insertNotes(newNote);
                                    }
                                    dirty = true;
                                    redrawAll = true;                        
                                } else { logErr("Added note requiers a beat to add to?"); }
                            } else { logErr("Added note requiers a bar to add to?");  }
                        } else { logErr("Unknown chord: " + e.chord); }
                    } else { logErr("Unknown note: " + e.note); }
                } else { e ? logErr("Bad Cmd") : logErr("No active track available."); }                
                
            },
            [commons.commands.prAddNote](cmd, left, right, e) {
                if (e && seq.activeTrack) {
                    if (NOTE_NAME.has(e.note)) {
                        if (e.bar !== undefined && !isNaN(e.bar) && e.bar >= 0) {
                            if (e.beat !== undefined && !isNaN(e.beat) && e.beat >= 0) {
                                e.beat /= subBeats;
                                e.beat %= BPB;
                                e.bar += (e.beat / BPB | 0);
                                const nRef = NOTE_NAME.get(e.note);
                                wN.setNoteByIdx(nRef.idx);
                                const at = seq.activeTrack;
                                wN.bar = e.bar;
                                wN.beat = e.beat;
                                const newNote = wN.cloneNew();
                                newNote.length = validateNoteLen(e.length) ?  e.length / subBeats : wN.length;
                                
                                at.insertNotes(newNote);
                                dirty = true;
                                redrawAll = true;                        
                            } else { logErr("Added note requiers a beat to add to?"); }
                        } else { logErr("Added note requiers a bar to add to?");  }
                    } else { logErr("Unknown note: " + e.note); }
                } else { e ? logErr("Bad Cmd") : logErr("No active track available."); }
            },
            [commons.commands.prPlayNote](cmd, left, right, e) {
                if (e && seq.activeTrack) {
                    if (e.note) {
                        if (NOTE_NAME.has(e.note)) {
                            const nRef = NOTE_NAME.get(e.note);
                            wN.setNoteByIdx(nRef.idx);
                            const at = seq.activeTrack;
                            const on = synth.atx.currentTime;
                            const off = on + wN.length / seq.timeScale
                            const n = wN.clone();
                            n.vol = at.vol;
                            at.play.pan(at.pan * 2 - 1);
                            at.play(n, on, off, at.envelopeIdx);
                            API.addNote(n, on, off);    
                        } else {
                            logErr("Unknown note: " + e.note);
                        }
                    } else if (e.notes) {
                        var t = synth.atx.currentTime;
                        var l = wN.length / seq.timeScale
                        if (e.now) { t += 0.1; }
                        const at = seq.activeTrack;
                        for (const note of e.notes) {
                            if (NOTE_NAME.has(note)) {
                                const nRef = NOTE_NAME.get(note);
                                wN.setNoteByIdx(nRef.idx);
                                const on = t;
                                const off = on + l
                                const n = wN.clone();
                                n.vol = at.vol;
                                at.play.pan(at.pan * 2 - 1);
                                at.play(n, on, off, at.envelopeIdx);
                                API.addNote(n, on, off); 
                                if (!e.now) {
                                    t += l;    
                                }
                            } else {
                                logErr("Unknown note: " + note);
                            }
                        }
                    }
                } else {
                    logErr("No active track available to play.");
                }
            },
        },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right, event) === true) { return } }            
            API.update();
        },        

    };
    seq.addEvent("trackChange", API.trackChange);
    seq.addEvent("timeSignature", API.timeSignatureChange);
    seq.addEvent("stop", API.squencerStoppedPlay);
    
    Object.assign(API, Events(API));
    var trackDraws = 0;
    return API;
}
export {PianoRoll, pianoImage};















