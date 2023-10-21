import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {commands} from "./commands.jsm";
import {spriteLocs} from "./ButtonSprites.jsm";
import {NOTE_IDX} from "./music.jsm";

const roll = spriteLocs.PRoll[0];
const rollBlank = spriteLocs.PBlankRoll[0];
const keys = spriteLocs.PKeys;
const noteN = spriteLocs.PNotes;
const keyIdxs = [0,3,1,3,2, 0,3,1,3,1,3,2];
const nameIdxs =  [2,2,3,3,4, 5,5,6,6,0,0,1];
const nameSharp = [0,1,0,1,0, 0,1,0,1,0,1,0];

const noteSelCan = $("canvas", {className: "noteSelectCan hide", width: roll.w, height: roll.h * 2});
$$(document.body, noteSelCan);
const ctx = noteSelCan.getContext("2d");

function NoteSelAPI(el, btn) {
    var rollPos = {x: 0, y: 0};
    const m = btn.mouse;
    //const k = btn.keyboard;
    var mouseOver = false;
    var loNote = NOTE_IDX[0];
    var hiNote = NOTE_IDX[NOTE_IDX.length - 1];
    const botNote = loNote;
    const topNote = hiNote;
    var currentNote = NOTE_IDX[36];
    const API = {
        setNoteIdx(idx) {
            if (idx >= loNote.idx &&  idx <= hiNote.idx) {
                currentNote = NOTE_IDX[idx];
                el.textContent = currentNote.name;
                el.commandId && m.commandSets.issueCommand(el.commandId);
            }
        },
        setLoNote(idx) {
            loNote = NOTE_IDX[Math.max(0, Math.min(NOTE_IDX.length - 1, idx))];
        },
        setHiNote(idx) {
            hiNote = NOTE_IDX[Math.max(0, Math.min(NOTE_IDX.length - 1, idx))];
        },
        setAllNotes() {
            API.setLoNote(0);
            API.setHiNote(NOTE_IDX.length - 1);            
        },
        getNote() {
            return currentNote;
        }
    };
    API.setNoteIdx(36);
    API.setAllNotes();
    Object.assign(el.API, API);
    
    function drawKeys() {
        if (topNote === hiNote && botNote === lowNote) {
            spriteLocs.drawSprite(ctx, 0, roll.h, roll);
        } else {
            spriteLocs.drawSprite(ctx, 0, rollBlank.h, rollBlank);
            const left = roll.marks[0][(loNote.idx - 3) * 2];
            const right = roll.w - roll.marks[0][(hiNote.idx - 2) * 2];
            spriteLocs.drawPartSprite(ctx, 0, rollBlank.h, left, 0, right, 0, roll);
        }
    }

    function mouseMove(e, mouse) {
        
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "#000A";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawKeys();
        //spriteLocs.drawSprite(ctx, 0, roll.h, roll);
        var note = Math.max(0, Math.min(71, ((mouse.x - rollPos.x) / 338) * 72 | 0));
        note = Math.max(loNote.idx - 3, Math.min(hiNote.idx - 3, note));
 
        const key = keys[keyIdxs[note % 12]];
        const nameSpr = noteN[nameIdxs[note % 12]];
        const nameSSpr = nameSharp[note % 12]
        const mIdx = note * 2;
        if (mIdx < roll.marks[0].length) {
            const mx = roll.marks[0][mIdx];
            const my = roll.marks[0][mIdx + 1] + roll.h;
            spriteLocs.drawSprite(ctx, mx, my, key);
            spriteLocs.drawSprite(ctx, mx , my - nameSpr.h * 2 - 2, nameSpr);
            if (nameSharp[note % 12]) {
                spriteLocs.drawSprite(ctx, mx + nameSpr.w, my  - nameSpr.h * 2 - 2, noteN[7]);
            }
        }
        if ((mouse.button & 1) === 0) {
            m.releaseCapture(el.API.id);
            noteSelCan.classList.add("hide");
            API.setNoteIdx(note + 3);
        }
    }
    el._onMouseDown = (event) => {
        if (m.captured !== el.API.id) {
            if (m.requestCapture(el.API.id, mouseMove)) {
                noteSelCan.classList.remove("hide");
                rollPos.x = m.x - (roll.w);
                rollPos.y = m.y - (roll.h);
                noteSelCan.style.left = rollPos.x + "px";
                noteSelCan.style.top =  rollPos.y + "px";
                drawKeys();
                /*if (topNote === hiNote && botNote === lowNote) {
                    spriteLocs.drawSprite(ctx, 0, roll.h, roll);
                } else {
                    spriteLocs.drawSprite(ctx, 0, rollBlank.h, rollBlank);
                    const left = roll.marks[0][(loNote.idx - 3) * 2];
                    const right = roll.w - roll.marks[0][(hiNote.idx - 3) * 2];
                    
                    spriteLocs.drawPartSprite(ctx, 0, rollBlank.h, left, 0, right, 0, roll);
                }*/
            }
        }
    }
    return API;
}
export {NoteSelAPI};