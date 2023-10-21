
import {$, $$, $R} from "../../../src/DOM/geeQry.jsm";
function Arpegiator(common) {
    var i = common.commands.CMD_TAIL + 4;
    const cmds = {
        
        speed: i++,
        ap_len_sub: i++,
        ap_len: i++,
        ap_len_add: i++,
        ap_step_sub: i++,
        ap_step: i++,
        ap_step_add: i++,
        ap_create2: i++,
        ap_create3: i++,
        ap_create4: i++,
        ap_create5: i++,
        ap_create6: i++,
        ap_create7: i++,
        ap_create8: i++,
        ap_create9: i++,
        ap_create: i++,
        ap_addPattern: i++,
        ap_removePattern: i++,
        ap_chord: ++i,
        ap_chord_end: i += 120,
        ap_baseNote: ++i,
        //ap_baseNote_end: i += 120,
        
        CMD_END: i,
    };
    var floating;
    const chords = Object.keys(common.music.chords);
    const noteNames = common.music.NOTE_IDX.map(n => n.name);
    var noteIdx = 0;
    var noteLen = 1;
    var chord = common.music.chords[chords[0]];
    var cSqu = [];
    var pNote;
    var nextNote = 0;
    var noteStepIdx = 3;
    var noteLenIdx = 3;
    var noteSizes;
    var noteIcons;
    const noteSizes44 = [ 0.125,  0.25,   0.5,   1,   2,    4,  8];
    const noteIcons44 = [    48,    46,    44,   8,   9,   11, 15];
                                                      
    const noteSizes43 = [ 0.125,  0.25,   0.5,   1,   3,    6, 12];
    const noteIcons43 = [    48,    46,    44,   8,   10,  13, 52];    
    
    const noteSizes34 = [1 / 12, 1 / 6, 1 / 3,   1,   2,    4,  8];
    const noteIcons34 = [    49,    47,    45,   8,   9,   11, 15];    
    
                                                      
    const noteSizes33 = [1 / 12, 1 / 6, 1 / 3,   1,   3,    6, 12];
    const noteIcons33 = [    49,    47,    45,   8,   10,  13, 52];
    
    

    
    var noteLen = 1;
    var noteStep = 1;
    var change = false;
    var patId = 0;
    var noteCount = 4;
 	const id = common.commandSets.mouse.getId();
    const mouse = common.commandSets.mouse;    
    const keyboard = common.commandSets.mouse.keyboard;    
    const {commandSets, commands, Buttons, piano, sequencer, synth}  = common;
    
    function noteEvent(data) {
        noteIdx = data.data.note.idx;
        pNote.length = data.data.length;
        const noteBtn = Buttons.byCmd.get(cmds.ap_baseNote);
        noteBtn.element.API.index = noteIdx;
        baseNoteChange();
    }
    function baseNoteChange() {
        change = true;
        if (!playIt || cSqu.length === 0) {
            nextNote = noteIdx;
            setNotes();
        }
    }

    function setNotes() {
        change = false;
        var nc = 0, nn;
        cSqu.length = 0;
        if (playType === 1 || playType === 2) {
            nn = nextNote;
            while (nc < noteCount) {
                for (const idx of chord) {
                    cSqu.push(nn + idx);
                    nc ++;
                    if (nc >= noteCount) { break; }                
                }
                nn += 12;
            }
            if (playType === 2) {
                cSqu.reverse();
            }
        } else if (playType === 3 || playType === 4) {
            nn = nextNote;
            while (nc < noteCount * 2) {
                for (const idx of chord) {
                    cSqu.push(nn + idx);
                    nc ++;
                    if (nc >= noteCount * 2) { break; }                
                }
                nn += 12;
            }
            if (playType === 4) {
                cSqu.reverse();
            }
        }
    
    
    }
    var playType = 0;
    var playIt = false;
    var nextTime = 0;
    var nIdx = 0;
    var addAtTime = 0;
    var addAtBar = 0;

    function play() {

        if (playIt) {
            if (change && nIdx === 0) {
                nextNote = noteIdx;
                setNotes();
            }               
            var t = synth.atx.currentTime;
            const n = pNote.cloneNew();
            if (nextTime === 0) {
                nextTime = t + noteStep / sequencer.timeScale;
            } else {
                nextTime += noteStep / sequencer.timeScale;
            }
            
            n.setNoteByIdx(cSqu[nIdx % cSqu.length]);
            nIdx = (nIdx + 1) % cSqu.length;
            piano.playANote(n, t, t + noteLen / sequencer.timeScale);
            setTimeout(play, (nextTime - t) * 1000);

        }
    }
    function timeSignatureChange(event) {
        if (event) {
            if (event.data.BPB === 3 || event.data.BPB === 6) {
                if (event.data.SBPB === 3 || event.data.SBPB === 6 || event.data.SBPB === 12) {
                    noteCount = 3;
                    noteSizes = noteSizes33;
                    noteIcons = noteIcons33;
                    noteStep = noteSizes[noteStepIdx];
                    noteLen = noteSizes[noteLenIdx];                     
                } else {
                    noteCount = 3;
                    noteSizes = noteSizes43;
                    noteIcons = noteIcons43;
                    noteStep = noteSizes[noteStepIdx];
                    noteLen = noteSizes[noteLenIdx];                     
                }
            } else if (event.data.BPB === 4 || event.data.BPB === 8) {
                if (event.data.SBPB === 3 || event.data.SBPB === 6 || event.data.SBPB === 12) {
                    noteCount = 4;
                    noteSizes = noteSizes34;
                    noteIcons = noteIcons34;
                    noteStep = noteSizes[noteStepIdx];
                    noteLen = noteSizes[noteLenIdx];                     
                } else {
                    noteCount = 4;
                    noteSizes = noteSizes44;
                    noteIcons = noteIcons44;
                    noteStep = noteSizes[noteStepIdx];
                    noteLen = noteSizes[noteLenIdx];                     
                }
            }
       
        } else {
            noteCount = 4;
            noteSizes = noteSizes44;
            noteIcons = noteIcons44;
            noteStep = noteSizes[noteStepIdx];
            noteLen = noteSizes[noteLenIdx];
        }
        baseNoteChange();
        API.update();

    }
    function startStop(type) {
        if (type === playType && playIt) { 
            playIt = false; 
            //patId = 0;
            return;
        }
        playType = type;
        baseNoteChange();
        if (!playIt) {
            playIt = true;
            nextTime = 0;
            play();
        }       
    }
    
    const API = {
        cmds() { return cmds; },
        create(container) {
            var X = 0, Y = 10, xs = 2.25, ys = 2;
            const buttonsA = [
                {type: "subContain", pxScale: 1, x: 5, y: 5, id: "Arpegiator"},

                {x: X + 0,      y: 8, command: cmds.ap_len_sub, type: "buttonNew", size: 16, help: "Decrease note length", sprite: 1},
                {x: X + 1 * xs, y: 8, command: cmds.ap_len    , type: "buttonNew", size: 16, help: "Curent note lengthg", sprite: 8},
                {x: X + 2 * xs, y: 8, command: cmds.ap_len_add, type: "buttonNew", size: 16, help: "Increase note length", sprite: 0},
                
                //{x: X + 7 * xs, y: 8, command: cmds.ap_removePattern, type: "buttonNew", size: 16, help: "Remove pattern from roll", sprite: 1},
                {x: X + 8 * xs, y: 8, command: cmds.ap_addPattern,    type: "buttonNew", size: 16, help: "Add pattern to roll at marked", sprite: 0},
                
                {x: X + 3.5 * xs, y: 8, command: cmds.ap_step_sub, type: "buttonNew", size: 16, help: "Decrease step dist", sprite: 1},
                {x: X + 4.5 * xs, y: 8, command: cmds.ap_step    , type: "buttonNew", size: 16, help: "Curent step dist", sprite: 8},
                {x: X + 5.5 * xs, y: 8, command: cmds.ap_step_add, type: "buttonNew", size: 16, help: "Increase step dist", sprite: 0},                
                
                
                
                {x: X + 0,       y: Y + ys, command: cmds.ap_create, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 54},
                {x: X + 1 * xs,  y: Y + ys, command: cmds.ap_create2, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 55},
                {x: X + 2 * xs,  y: Y + ys, command: cmds.ap_create3, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 56},
                {x: X + 3 * xs,  y: Y + ys, command: cmds.ap_create4, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 57},
                {x: X + 4 * xs,  y: Y + ys, command: cmds.ap_create5, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 58},
                {x: X + 5 * xs,  y: Y + ys, command: cmds.ap_create6, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 59},
                {x: X + 6 * xs,  y: Y + ys, command: cmds.ap_create7, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 60},
                {x: X + 7 * xs,  y: Y + ys, command: cmds.ap_create8, type: "buttonNew", group: "patGroup", size: 16, help: "", sprite: 61},
                

                {x: 0, y: 26, command: cmds.ap_chord , type: "selection", group: "chrodGroup",  	sizeW: 128, sizeH: 18, items: chords, help: "Select the type of auto chord\nto select next prev",  mouse, keyboard, pxScale: 1},
                //{x: 0, y: 46, command: cmds.ap_baseNote , type: "selection", group: "chrodGroup",  	sizeW: 128, sizeH: 18, items: noteNames, help: "Select chord location",  mouse, keyboard, pxScale: 1},
                {x: 0, y: 46, command: cmds.ap_baseNote , type: "noteSel", group: "chrodGroup",  	sizeW: 28, sizeH: 18, help: "Select chord location",  mouse, keyboard, pxScale: 1},


			];
            

            
            Buttons.add(container, buttonsA);
            piano.addEvent("playnote", noteEvent);
            sequencer.addEvent("timeSignature", timeSignatureChange);
            pNote = piano.getNote();
            timeSignatureChange();    
            
        },     
        destroy() {
            playIt = false;
            sequencer.removeEvent("timeSignature", timeSignatureChange);
            piano.removeEvent("playnote", noteEvent);
        },
        
        commands: {
            [cmds.speed](cmd, l, r, e) {
  

            },
            [cmds.ap_addPattern](cmd, l, r, e) { 
                setNotes(); 
                const {bar, beat} = piano.getMark();
                addAtBar = bar;
                addAtTime = beat * sequencer.SBPB
                var i = 0;
                while (i < cSqu.length) {
                    const n = pNote.cloneNew();
                    n.setNoteByIdx(cSqu[i]);
                    commandSets.issueCommand(commands.prAddNote, {note: n.note.name, bar: addAtBar, beat: addAtTime, length: noteLen * sequencer.SBPB});   
                    
                    addAtTime += noteStep * sequencer.SBPB;
                    if (addAtTime >= sequencer.BPB * sequencer.SBPB) {
                        addAtTime %= sequencer.BPB * sequencer.SBPB;
                        addAtBar += 1;
                    }
                    i++;
                }                    
                piano.setMark(addAtBar, addAtTime / sequencer.SBPB);
            
            },
            [cmds.ap_step_sub](cmd, l, r, e) {  
                noteStepIdx = Math.max(0, noteStepIdx - 1);
                noteStep = noteSizes[noteStepIdx];
            },
            [cmds.ap_step_add](cmd, l, r, e) {  
                noteStepIdx = Math.min(6, noteStepIdx + 1);
                noteStep = noteSizes[noteStepIdx];
            },
            [cmds.ap_len_sub](cmd, l, r, e) {  
                noteLenIdx = Math.max(0, noteLenIdx - 1);
                noteLen = noteSizes[noteLenIdx];
            },
            [cmds.ap_len_add](cmd, l, r, e) {  
                noteLenIdx = Math.min(6, noteLenIdx + 1);
                noteLen = noteSizes[noteLenIdx];
            },
            [cmds.ap_create8](cmd, l, r, e) { patId = cmds.ap_create8; startStop(8) },
            [cmds.ap_create7](cmd, l, r, e) { patId = cmds.ap_create7; startStop(7) },
            [cmds.ap_create6](cmd, l, r, e) { patId = cmds.ap_create6; startStop(6) },
            [cmds.ap_create5](cmd, l, r, e) { patId = cmds.ap_create5; startStop(5) },
            [cmds.ap_create4](cmd, l, r, e) { patId = cmds.ap_create4; startStop(4) },
            [cmds.ap_create3](cmd, l, r, e) { patId = cmds.ap_create3; startStop(3) },
            [cmds.ap_create2](cmd, l, r, e) { patId = cmds.ap_create2; startStop(2) },
            [cmds.ap_create](cmd, l, r, e)  { patId = cmds.ap_create; startStop(1) },
            [cmds.ap_baseNote](cmd, l, r, e)  { 
                const noteBtn = Buttons.byCmd.get(cmds.ap_baseNote);
                noteIdx = noteBtn.element.API.getNote().idx;    
                baseNoteChange();    
            },

        }, 
        commandRange(cmd, left, right) { 

            /*if (cmd >= cmds.ap_baseNote && cmd <= cmds.ap_baseNote_end) {

                noteIdx = cmd - cmds.ap_baseNote;
                baseNoteChange();
				
			} else */if (cmd >= cmds.ap_chord && cmd <= cmds.ap_chord_end) {
                
                chord = common.music.chords[chords[cmd - cmds.ap_chord]];
                baseNoteChange();

			}
		},        
        update() {
            
            Buttons.byCmd.get(cmds.ap_len).element.API.setSprite(noteIcons[noteLenIdx]);
            Buttons.byCmd.get(cmds.ap_step).element.API.setSprite(noteIcons[noteStepIdx]);
            
    

            
            
            const noteBtn = Buttons.byCmd.get(cmds.ap_baseNote);
            noteBtn.element.API.index = noteIdx;        
            if (patId !== 0) {
                if (playIt) {
                    Buttons.Groups.radio("patGroup", patId, playIt);
                } else {
                    Buttons.Groups.checkAll("patGroup", false);
                }
            } 
            
            
  
        }            
        
    }
    return API;
}

export {Arpegiator};