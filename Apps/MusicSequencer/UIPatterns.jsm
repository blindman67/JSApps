function UIPatterns(commands, Buttons, sequencer, synth, piano) {
    var mouse, id , allButtons, keyboard, subContainer, overPattern, silent = false, cmdSet, clearSelected, noteColButtons;
    var swingEditMode = false;
    var timeHdl;
    const noteColGrp = "noteColorGrp";
    const workPoint = {X:0, y:0}, wp = workPoint;
    const PATTERN_SPACING = 10; // in px (half actual spacing)
    const MAX_COLS = 48;  // columns
    const patternSpaces = [];
    (() => {
        var i = MAX_COLS, b = 0;
        while (i--) { patternSpaces.push((b++ / 4 | 0) * 0.25); }
    })();
        
    
    const patternNames = "123456789abcdefghijklmnopqrstuvwxyz0";
    const swingKeyNames = "012345678";
    const rows = [{
            baseCmd: commands.patRow1,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd: commands.patRow2,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd: commands.patRow3,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd:  commands.patRow4,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd:  commands.patRow5,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd:  commands.patRow6,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd:  commands.patRow7,
            patterns: MAX_COLS,
            highlighted: null,
        }, {
            baseCmd:  commands.patRow8,
            patterns: MAX_COLS,
            highlighted: null,
        },
    ];
    const firstCmd = commands.patRow1;
    const rowCount = commands.patRow2 - commands.patRow1;
    var focusedBar, focused;
    var copyiedPatternNotes;
    const swingPosIdx = [81, 80, 79, 78, 77, 76, 75, 74, 0, 1, 2, 3, 4, 5, 6, 7, 8];
    function trackChangeEvent(event) {
        if (event.data.type === "mute" || event.data.type === "active") {
            API.update();
        }
    }
    function rollPosUpdate(event) {
        if (silent) { return }
        if (!swingEditMode) {
            const bar = event.data.bar;
            var i = 0, btnIdx = 0;
            for (const ta of sequencer.tracks) {
                const row = rows[i++];

                if (row.prevPos !== undefined) {
                    allButtons[btnIdx + row.prevPos].classList.remove("barPosHighlight");
                    row.prevPos = undefined;
                }
                allButtons[btnIdx + bar].classList.add("barPosHighlight");
                row.prevPos = bar;
                btnIdx += row.patterns;
            }
        } else {
            var i = 0, btnIdx = 0;
            for (const ta of sequencer.tracks) {
                const row = rows[i++];
                if (row.prevPos !== undefined) {
                    allButtons[btnIdx + row.prevPos].classList.remove("barPosHighlight");
                    row.prevPos = undefined;
                }
                btnIdx += row.patterns;
            }
        }
    }
    function beatHighlight(event) {
        var i = 0;
        if (swingEditMode) {
            const SBPB = sequencer.SBPB;
            const beatPos = event.data.note?.beat * SBPB ?? -1;
            
            if (beatPos >= 0 && beatPos <= 32) {
                focusedBar = beatPos;
                for (const row of rows) {
                    const track = sequencer.tracks[i];
                    if (track && track.swingOn) {          
                        const idx = row.baseCmd + beatPos;
                        const btn = Buttons.byCmd.get(row.baseCmd + beatPos);
                        btn.element.classList.add("barPatternHighlight");
                        row.highlighted && row.highlighted.element.classList.remove("barPatternHighlight");
                        row.highlighted = btn;                    
                    } else {
                        row.highlighted && row.highlighted.element.classList.remove("barPatternHighlight");
                        row.highlighted = null;                        
                    }
                    i ++;
                }
                
            } else {
                for (const row of rows) {
                    row.highlighted && row.highlighted.element.classList.remove("barPatternHighlight");
                    row.highlighted = null;                    
                }
                focusedBar = undefined;
            }
        }
    }            
    function barHighlight(event) {
        var i = 0;
        if (!swingEditMode) {
            const bar = event.data.note?.bar ?? -1;
            if (bar >= 0 && bar <= rowCount) {
                focusedBar = bar;
                for (const row of rows) {
                    const enabled = sequencer.tracks[i];
                    if (enabled) {
                        const idx = row.baseCmd + bar;
                        const btn = Buttons.byCmd.get(row.baseCmd + bar);
                        btn.element.classList.add("barPatternHighlight");
                        row.highlighted && row.highlighted.element.classList.remove("barPatternHighlight");
                        row.highlighted = btn;
                    } else {
                        row.highlighted && row.highlighted.element.classList.remove("barPatternHighlight");
                        row.highlighted = null;
                    }
                    i ++;
                }
            } else {
                for (const row of rows) {
                    row.highlighted && row.highlighted.element.classList.remove("barPatternHighlight");
                    row.highlighted = null;
                }
                focusedBar = undefined;
            }
        }
     }
   
    const selected = {
        unique: new Set(),
        active: false,
        starts: { col: -1, row: -1 },
        ends: { col: 0, row: 0 },
        start(d) {
            selected.starts.row = d.row;
             if (swingEditMode) {
                selected.starts.col = Math.min(d.col, sequencer.BPB * sequencer.SBPB - 1);
            } else {
                selected.starts.col = d.col;
                if (selected.starts.col !==  selected.ends.col || selected.starts.row !==  selected.ends.row) {
                    sequencer.setBarRange(selected.starts.col, selected.ends.col + 1);      
                }                    
            }           
        },
        end(d) {
            selected.ends.row = d.row;
            if (swingEditMode) {
                selected.ends.col = Math.min(d.col, sequencer.BPB * sequencer.SBPB - 1);
            } else {
                selected.ends.col = d.col;
                if (selected.starts.col !==  selected.ends.col || selected.starts.row !==  selected.ends.row) {
                    sequencer.setBarRange(selected.starts.col, selected.ends.col + 1);        
                }                    
            }
            if (!selected.active) {
                if (selected.starts.col !==  selected.ends.col || selected.starts.row !==  selected.ends.row) {
                    selected.active = true;
                    
                }
            }
        },
        clear() {
            for (const el of allButtons) { el.classList.remove("selected") }
            selected.active = false;
            if (!swingEditMode) {
                sequencer.setBarRange();
            }
        },
        eachUniquePattern(track, cb) {
            if (selected.active) {
                selected.unique.clear();
                selected.each((el, sel, col, row) => {
                    if (row === track.idx) {
                        const p = track.patterns[col];
                        if (p >= 0 && !selected.unique.has(p)) {
                            selected.unique.add(p);
                            cb(el, col, row);
                        }
                    }
                });
            }
        },
        each(cb, selectedItems = true, unselectedItems = false) {
            if (selected.active) {
                const rowCount = sequencer.tracks.length- 1;
                const S = selected
                const sc = Math.min(S.starts.col, S.ends.col);
                const sr = Math.min(S.starts.row, S.ends.row);
                const ec = Math.max(S.starts.col, S.ends.col);
                const er = Math.min(Math.max(S.starts.row, S.ends.row), rowCount);
                for (const el of allButtons) {
                    const {col, row} = el._data;
                    col >= sc && col <= ec && row >= sr && row <= er ?
                        selectedItems && cb(el, true, col, row) :
                        unselectedItems && cb(el, false, col, row);
                }
            }
        },
        show() {
            if (selected.active) {
                selected.each((el, selected) => {
                    selected && el.classList.add("selected");
                    !selected && el.classList.remove("selected");
                }, true, true);
            }
        },
        buffer: [],
        swingBuffer: [],
        delete() {
            var dirty = false;
            if (swingEditMode) {
                selected.each((el, sel, x, y) => {
                    const t = sequencer.tracks[y];
                    t && t.swingOn && (dirty = true, t.dirty = true, t.setSwingOffset(x, 0));
                }, true, false);
            } else {
                selected.each((el, sel, x, y) => {
                    const t = sequencer.tracks[y];
                    t && (dirty = true, t.dirty = true, t.setPattern(x, -1));
                }, true, false);
                if (selected.starts.col > 0) {
                    const er = selected.ends.row;
                    const sr = selected.starts.row;
                    const sc = selected.starts.col - 1;
                    setTimeout(() => {
                        selected.start({col: 0, row: sr});
                        selected.end({col: sc, row: er});
                        selected.show();
                    }, 500);
                }
            }
            dirty && (sequencer.soil());

        },
        copy() {
            if (selected.active) {
                if (swingEditMode) {
                    selected.swingBuffer.stride = Math.abs(selected.starts.col - selected.ends.col) + 1;
                    selected.swingBuffer.length = 0;                    
                    selected.each((el, sel, x, y) => {
                        const t = sequencer.tracks[y];
                        t && t.swingOn ? selected.swingBuffer.push(t.swing[x]) : selected.swingBuffer.push(undefined);
                    }, true, false);
                    
                } else {
                    selected.buffer.stride = Math.abs(selected.starts.col - selected.ends.col) + 1;
                    selected.buffer.length = 0;
                    selected.each((el, sel, x, y) => {
                        const t = sequencer.tracks[y];
                        t ? selected.buffer.push(t.patterns[x]) : selected.buffer.push(undefined);
                    }, true, false);
                }
            }
        },
        paste() {
            if (selected.active) {
                const xx = Math.min(selected.starts.col, selected.ends.col);
                const yy = Math.min(selected.starts.row, selected.ends.row);
                if (swingEditMode && selected.swingBuffer.length) {
                    const buf = selected.swingBuffer;
                    const bw = buf.stride;
                    const bh = buf.length / bw | 0;                       
                    selected.each((el, sel, x, y) => {
                        const idx = (x - xx) % bw + ((y - yy) % bh) * bw;
                        const t = sequencer.tracks[y];
                        if (t && t.swingOn) {
                            t.setSwingOffset(x, buf[idx]);
                            el.API.setSprite(swingPosIdx[t.swing[x] + 8]);
                        }
                    }, true, false);
                    
                } else if (!swingEditMode && selected.buffer.length) {

                    const buf = selected.buffer;
                    const bw = buf.stride;
                    const bh = buf.length / bw | 0;                   
                    selected.each((el, sel, x, y) => {
                        const idx = (x - xx) % bw + ((y - yy) % bh) * bw;
                        const t = sequencer.tracks[y];
                        if (t) {
                            t.setPattern(x, buf[idx]);
                            el.API.setSprite(t.patterns[x] + 1);
                        }
                    }, true, false);
                }
                selected.clear();
            }
        }
    };
    function keyboardAction(e, key) {
        
        if (selected.active) {
            if (swingEditMode) {
                const idx = swingKeyNames.indexOf(key);
                if (idx > -1) {
                    selected.each(el => {
                        const {col, row} = el._data;
                        const t = sequencer.tracks[row];
                        if (t && t.swingOn) {
                            t.setSwingOffset(col, idx);
                            el.API.setSprite(swingPosIdx[t.swing[col] + 8]);
                        }
                    }, true, false);                
                }
            } else {
                const idx = patternNames.indexOf(key);
                selected.each(el => {
                    const {col, row} = el._data;
                    const t = sequencer.tracks[row];
                    if (t) {
                        t.setPattern(col, idx);
                        el.API.setSprite(t.patterns[col] + 1);
                    }
                }, true, false);
            }
            selected.clear();
        } else {
            if (overPattern) {
                const data = overPattern._data;
                if (data) {
                    if (swingEditMode) {
                        const idx = swingKeyNames.indexOf(key);
                        if (idx > -1) {
                            const t = sequencer.tracks[data.row];
                            if (t && t.swingOn) {
                                t.setSwingOffset(data.col, idx);
                                el.API.setSprite(swingPosIdx[t.swing[data.col] + 8]);           
                            }
                        }
                    } else {
                        const idx = patternNames.indexOf(key);
                        const t = sequencer.tracks[data.row];
                        if (t) {
                            t.setPattern(data.col, idx);
                            overPattern.API.setSprite(t.patterns[data.col] + 1);
                        }
                    }
                }
            }
        }
    }
    function barCommand(name, ...args) {
   	    if (focused !== undefined) {
			const ta = sequencer.activeTrack;
			if (ta) {
				if (selected.active && keyboard.modeName === "patterns") {
					selected.eachUniquePattern(ta, (el, c) => { ta[name](c, ...args) });
				} else { ta[name](focused, ...args) }
			}
		}		
		return true;		
	}
	function mouseOver(event) {
        piano.highlightBar = event.target._data.col;
    }
    function mouseOverMode(){
        (mouse.captured === id || mouse.captured === 0) && (keyboard.mode = "patterns");
    }
    function mouseOutMode(e){
        if (mouse.captured === id || mouse.captured === 0) {
            e.target._onMouseOver !== mouseOver && (keyboard.mode = "all");
            piano.highlightBar = -1;
        }
    }
    function mouseOut() {
        (mouse.captured === id || mouse.captured === 0) && ( 
            piano.highlightBeat = piano.highlightBar = -1 
        );
    }
    function mouseOver(e) {
        if (mouse.captured === id || mouse.captured === 0) {
            keyboard.mode = "patterns";
            overPattern = e.target;
            piano.highlightBar = !swingEditMode ? e.target._data.col : -1;
            const swingSteps = sequencer.BPB * sequencer.SBPB;
            piano.highlightBeat = swingEditMode ? (e.target._data.col < swingSteps ? e.target._data.col / sequencer.SBPB : -1) : -1;
        }
    }
    function mouseDown(e) {
        if (mouse.captured === 0) {
            if (mouse.requestCapture(id, mouseDrag)) {
                clearSelected = false;
                if (selected.active) {
                    clearSelected = true;
                    selected.clear();
                }
                wp.x = mouse.x;
                wp.y = mouse.y;
                selected.start(e.target._data);
            }
        }
    }
    function mouseDrag(event) {
        if (event.type === "mouseup") {
            if (mouse.captured === id) {
                if (!selected.active) {
                   if (overPattern && !clearSelected) { API.command(overPattern.commandId ,undefined,mouse) }
                }
                mouse.releaseCapture(id);
                /*if (!selected.active) {
                    sequencer.setBarRange();
                } else {                    
                    sequencer.setBarRange(selected.starts.col, selected.ends.col + 1);
                }*/
            }
        } else if (event.type === "mousemove") {
            if (event.target._data) {
                selected.end(event.target._data);
                selected.show();
            } else {
                const offX = (mouse.x - wp.x) / (PATTERN_SPACING * 2)
                const offY = (mouse.y - wp.y) / (PATTERN_SPACING * 2)
                const col = (selected.starts.col + offX | 0);
                const row = (selected.starts.row + offY | 0);
                const data = {
                    col: col < 0 ? 0 : col >= MAX_COLS ? MAX_COLS -1 : col,
                    row: row < 0 ? 0 : row >= rows.length ? rows.length  : row,
                };
                selected.end(data);
                selected.show();
            }
        }
    }
    
    const API = {
        create(container, commandSets) {
            cmdSet = commandSets;
            mouse = commandSets.mouse;
            keyboard = commandSets.mouse.keyboard;
            keyboard.addMode("patterns");
            keyboard.mode = "patterns";
            id = mouse.getId();
            var X = 0, Y = 0, y = 0;
            const styles = ["patRow1", "patRow2", "patRow3", "patRow4", "patRow5", "patRow6", "patRow7", "patRow8"];
            const sprites =  [
				7,8,9,10,11, 12,13,14,15, 16,17,18,19, 20,21,22,23, 24,25,26,27, 28,29,30,31, 32,33,34,35 ,36,37,38,39, 40,41,42,43,
				44,45,46,47, 48,49,50,51, 52,53,54,55 ,56,57,58,59, 60,61,62,63, 64,65,66,67, 68,69,70,71, 72,73,74,75 ,76,77,78,79, 
                80, 81, 82, 83, 84, 85, 86, 87, 88, 89
			];
            
            const btn = {type: "button", size: 16, help: "", sprite: 0, sprites, pxScale: PATTERN_SPACING};
            const buttons = [{type: "subContain", pxScale: 1, x: 486, y: 60, id: "PatternsPanel"}];
            for (const row of rows) {
                var xx = 0;
                while (xx < row.patterns) {
                    buttons.push({
                        ...btn,
                        x: X + xx * 2 + patternSpaces[xx],
                        y: Y + y * 2,
                        data:{col: xx, row: y},
                        cssClass: styles[y],
                        command: row.baseCmd + xx,
                    });
                    xx++;
                }
                y++;
            }
            allButtons = Buttons.add(container, buttons);
            subContainer = allButtons.shift();
            allButtons.forEach(el => {
                el._onMouseOut = mouseOut;
                el._onMouseOver = mouseOver;
                el._onMouseDown = mouseDown;
            });
            Buttons.add(container,[
                    {type: "subContain", pxScale: 1, x: 360 + 3 * 28, y: 222, id: "PatternNoteSelectPanel"},

                    {x: X    ,	y: Y, command: commands.patBarNotesVolDown,type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Decrease selected note volume", sprite: 12 * 4 + 2},
                    {x: X += 3,	y: Y, command: commands.patBarNotesVolUp,  type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Increase selected note volume", sprite: 12 * 4},
                    {x: X += 3,	y: Y, command: commands.patShowNoteVolume,  type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Toggle show volumn bars on notes in piano roll", sprite: 12 * 4 + 1},
                    {x: X += 3,	y: Y, command: commands.patToggleSwingMode,  type: "buttonNew", size: 24, sizeName: "icon24", help: "Toogle pattern edit and swing edit modes", sprite: 12 * 4 + 3},
                ]
            );

            var help = "Toggle show / hide notes in piano roll when track note selected";
            noteColButtons = Buttons.add(container,[
                {type: "subContain", pxScale: 1, x: 269, y: 220, id: "NoteColorPanel"},
                {x: 0,      y: 0,  type: "button", command: commands.patNoteCol1,  group: noteColGrp, sizeName: "icon12", help, sprite: 0,  pxScale: 1},
                {x: 15 * 1, y: 0,  type: "button", command: commands.patNoteCol2,  group: noteColGrp, sizeName: "icon12", help, sprite: 1,  pxScale: 1},
                {x: 15 * 2, y: 0,  type: "button", command: commands.patNoteCol3,  group: noteColGrp, sizeName: "icon12", help, sprite: 2,  pxScale: 1},
                {x: 15 * 3, y: 0,  type: "button", command: commands.patNoteCol4,  group: noteColGrp, sizeName: "icon12", help, sprite: 3,  pxScale: 1},
                {x: 15 * 4, y: 0,  type: "button", command: commands.patNoteCol5,  group: noteColGrp, sizeName: "icon12", help, sprite: 5,  pxScale: 1},
                {x: 15 * 5, y: 0,  type: "button", command: commands.patNoteCol6,  group: noteColGrp, sizeName: "icon12", help, sprite: 6,  pxScale: 1},
                {x: 0    ,  y: 15, type: "button", command: commands.patNoteCol7,  group: noteColGrp, sizeName: "icon12", help, sprite: 7,  pxScale: 1},
                {x: 15 * 1, y: 15, type: "button", command: commands.patNoteCol8,  group: noteColGrp, sizeName: "icon12", help, sprite: 8,  pxScale: 1},
                {x: 15 * 2, y: 15, type: "button", command: commands.patNoteCol9,  group: noteColGrp, sizeName: "icon12", help, sprite: 10, pxScale: 1},
                {x: 15 * 3, y: 15, type: "button", command: commands.patNoteCol10, group: noteColGrp, sizeName: "icon12", help, sprite: 11, pxScale: 1},
                {x: 15 * 4, y: 15, type: "button", command: commands.patNoteCol11, group: noteColGrp, sizeName: "icon12", help, sprite: 12, pxScale: 1},
                {x: 15 * 5, y: 15, type: "button", command: commands.patNoteCol12, group: noteColGrp, sizeName: "icon12", help, sprite: 13, pxScale: 1},
            ]);

            subContainer._onMouseOver = mouseOverMode;
            subContainer._onMouseOut = mouseOutMode;
            commandSets.registerSet(commands.PATTERNS , commands.PATTERNS_END, API);
            keyboardAction.helpStr = "In pattern mode set pattern [1-9,a-z,0]. In swing mode set swing [shift][8-1] [0-8]";
            for (const key of patternNames) {
                keyboard.addKeyEvent(key, keyboardAction);
            }
            keyboard.addKeyCommand("c_Ctrl", commands.patCopy);
            keyboard.addKeyCommand("v_Ctrl", commands.patPaste);
			
            keyboard.addKeyCommand("Delete", commands.deletePatterns);
            keyboard.addMode("pianoRoll");
            keyboard.mode = "pianoRoll";
			
            keyboard.addKeyCommand("a_Ctrl", commands.patSelAllNotes);
            keyboard.addKeyCommand("Delete", commands.deleteNotes);
            keyboard.addKeyCommand("c", commands.patBarCopy);
            keyboard.addKeyCommand("v", commands.patBarPaste);
            keyboard.addKeyCommand("b", commands.patBarCloneNew);
            keyboard.addKeyCommand("x", commands.patBarClear);
            keyboard.addKeyCommand("=", commands.patBarNotesUp);
            keyboard.addKeyCommand("-", commands.patBarNotesDown);
            keyboard.addKeyCommand(",", commands.patBarNotesLeft);
            keyboard.addKeyCommand(".", commands.patBarNotesRight);
            keyboard.addKeyCommand("[", commands.patBarNotesLengthShorter);
            keyboard.addKeyCommand("]", commands.patBarNotesLengthLonger);
            keyboard.addKeyCommand("9", commands.patBarNotesVolDown);
            keyboard.addKeyCommand("0", commands.patBarNotesVolUp);            
        },
        ready() {
            sequencer.addEvent("deserializeStart", () => silent = true);
            sequencer.addEvent("addedTrack", API.update);
            sequencer.addEvent("removedTrack", API.update);
            sequencer.addEvent("deserialize", () => {silent = false; API.update()});
            sequencer.addEvent("trackChange", trackChangeEvent);
            sequencer.addEvent("updated", API.update);
            piano.addEvent("mouseOverBar", barHighlight);
            piano.addEvent("mouseOverBeat", beatHighlight);
            piano.addEvent("barChange", rollPosUpdate);
            API.update();
        },
        commands: {
            [commands.patCopy](cmd, left, right) {
                selected.copy();
                return true;
            },
            [commands.patPaste](cmd, left, right) {
                selected.paste();
                return true;
            },
            [commands.patSelAllNotes](cmd, left, right) {
				piano.selection.selectAll();
				return true;
			},
            [commands.patBarCloneNew](cmd, left, right) {
                if (focused !== undefined) {
                    const t = sequencer.activeTrack;
                    if (t) {
                        t.duplicatePattern(focused);
                        return false;
                    }
                }
                return true;
            },
            [commands.patBarCopy](cmd, left, right) {
                if (focused !== undefined) {
                    const t = sequencer.activeTrack;
                    if (t) { copyiedPatternNotes = t.copyPattern(focused) }
                }
                return true;
            },
            [commands.patBarPaste](cmd, left, right) {
                if (copyiedPatternNotes && focused !== undefined) {
                    const t = sequencer.activeTrack;
                    if (t) { t.pastePattern(focused, copyiedPatternNotes) }
                }
                return true;
            },
            [commands.deletePatterns](cmd, left, right) {
                selected.delete();
                return false;
            },
            [commands.deleteNotes](cmd, left, right) {
                if (focused !== undefined) {
                    const t = sequencer.activeTrack;
                    if (t) { t.deletePattern(focused) }
                }
                return true;
            },
            [commands.patBarClear](cmd, left, right) {
                if (focused !== undefined) {
                    const t = sequencer.activeTrack;
                    if (t) { t.deletePattern(focused) }
                }
                return true;
            },
            [commands.patBarNotesUp](cmd, left, right) { return barCommand("patternMoveNotes", 1) },
            [commands.patBarNotesDown](cmd, left, right) { return barCommand("patternMoveNotes", -1) },
            [commands.patBarNotesLeft](cmd, left, right) { return barCommand("patternMoveTime", -1) },
            [commands.patBarNotesRight](cmd, left, right) {return barCommand("patternMoveTime", 1) },
            [commands.patBarNotesLengthShorter](cmd, left, right) { return barCommand("patternNoteTime", -1) },
            [commands.patBarNotesLengthLonger](cmd, left, right) { return barCommand("patternNoteTime", 1) },
            [commands.patBarNotesVolDown](cmd, left, right) { 
                const res = barCommand("patternMoveNoteVolumes", -0.05);
                if (!piano.getShowVolume()) {                    
                    cmdSet.issueCommand(commands.patShowNoteVolume);                    
                    timeHdl = setTimeout(() => cmdSet.issueCommand(commands.patShowNoteVolume), 2000);
                }
                return res;
            },
            [commands.patBarNotesVolUp](cmd, left, right) { 
                const res = barCommand("patternMoveNoteVolumes", 0.05);
                if (!piano.getShowVolume()) {
                    cmdSet.issueCommand(commands.patShowNoteVolume);
                    timeHdl = setTimeout(() => cmdSet.issueCommand(commands.patShowNoteVolume), 2000);
                }
                
                return res;
            },
            [commands.patShowNoteVolume](cmd, left, right) { piano.setShowVolume(!piano.getShowVolume()); },
            [commands.patToggleSwingMode](cmd, left, right) {
                swingEditMode = !swingEditMode; 
                selected.clear();
            },
        },
        commandRange(cmd, left, right, mid) {
            if (cmd >= commands.patNoteCol1 && cmd <= commands.patNoteCol12) {
                sequencer.activeTrack.setNoteColorIdx(cmd - commands.patNoteCol1);
                piano.noteColorIdx = cmd - commands.patNoteCol1;
                return;
            }
            var i = 0;
            if (swingEditMode) {
                const swingSteps = sequencer.BPB * sequencer.SBPB;
                for (const row of rows) {
                    if (cmd >= row.baseCmd && cmd < row.baseCmd + row.patterns) {
                        const t = sequencer.tracks[i];
                        if (t && t.swingOn) {
                            const idx = cmd - row.baseCmd;
                            if (idx < swingSteps) {
                                const p = Math.max(-8, Math.min(8, t.swing[idx] + (left ? 1 : right ? -1 : -t.swing[idx])));
                                t.setSwingOffset(idx, p);
                                const btn = Buttons.byCmd.get(cmd);
                                btn.element.API.setSprite(swingPosIdx[t.swing[idx] + 8]);
                            }
                        }
                        return true;
                    }
                    i++;
                }
                
            } else {
                for (const row of rows) {
                    const t = sequencer.tracks[i];
                    const enabled = sequencer.tracks[i];
                    if (cmd >= row.baseCmd && cmd < row.baseCmd + row.patterns) {
                        if (t.active) {
                            const idx = cmd - row.baseCmd;
                            const p = t.patterns[idx] !== undefined ? t.patterns[idx] + (left ? 1 : -1) : 0;
                            t.setPattern(idx, p);
                            if (t.patterns[idx] !== undefined) {
                                const btn = Buttons.byCmd.get(cmd);
                                btn.element.API.setSprite(t.patterns[idx] + 1);
                            }
                            return true;
                        } else {
                            cmdSet.issueCommand(commands.mainTrack0 + t.idx, undefined, {oldButton: 1});
                            return true;
                        }

                    }
                    i++;
                }
            }
            return true;
        },
        command(cmd, event, mouse) {
            focused = piano.selection.selected ? -1 : piano.mouseOverBar;// focusedBar;
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            const mid = mouse ? (mouse.oldButton & 2) === 2 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right, mid) === true) { return } }
            else { if (API.commandRange(cmd, left, right, mid) === true) { return } }
            API.update();
        },
        update() {
            var i = 0, j;
            if (silent) { return }
            if (sequencer.tracks.length) {
                Buttons.byCmd.get(commands.patShowNoteVolume).element.API.setChecked(piano.getShowVolume());
            }
            if (swingEditMode) {
                Buttons.byCmd.get(commands.patToggleSwingMode).element.API.setChecked(true);
                const swingSteps = sequencer.BPB * sequencer.SBPB;
                i = 0;
                for (const row of rows) {
                    
                    const track = sequencer.tracks[i];
                    if (track && track.swingOn) {
                        const swing = track.swing;
                        j = 0;
                        while (j < swing.length && j < swingSteps) {
                            const btn = Buttons.byCmd.get(row.baseCmd + j);
                            const bApi = btn.element.API;

                            bApi.enable();
                            bApi.setSprite(swingPosIdx[swing[j] + 8]);
                            btn.element.classList.remove("patterActive")
                            
                        
                            j ++;
                        }
                        while (j < row.patterns) {     
                            const btn = Buttons.byCmd.get(row.baseCmd + j);
                            const bApi = btn.element.API;
                            bApi.disable();
                            bApi.setSprite(0);
                            j ++;                        
                        }                        
                    } else {
                         j = 0;
                        while (j < row.patterns) {
                            const btn = Buttons.byCmd.get(row.baseCmd + j);
                            const bApi = btn.element.API;
                            bApi.disable();
                            bApi.setSprite(0);
                            j ++;
                        }                       
                    }
                    i++;
                }                
            } else {
                Buttons.byCmd.get(commands.patToggleSwingMode).element.API.setChecked(false);
                Buttons.Groups.radio(noteColGrp, commands.patNoteCol1 + piano.noteColorIdx, true,  "active");
                
                for (const row of rows) {
                    const t = sequencer.tracks[i];
                    const enabled = sequencer.tracks[i];
                    j = 0;
                    while (j < row.patterns) {
                        const btn = Buttons.byCmd.get(row.baseCmd + j);
                        const bApi = btn.element.API;
                        if (enabled) {
                            bApi.enable();
                            if (t.patterns[j] !== undefined) { bApi.setSprite(t.patterns[j] + 1) }
                            else { bApi.setSprite(0) }
                            if (t.active) { btn.element.classList.add("patterActive") }
                            else { btn.element.classList.remove("patterActive") }
                        } else {
                             bApi.disable();
                             bApi.setSprite(0);
                        }
                        j ++;
                    }
                    i++;
                }
            }
        },
    };
    return API;
}
export {UIPatterns};