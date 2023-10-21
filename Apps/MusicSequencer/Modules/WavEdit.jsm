
import {$, $$, $R} from "../../../src/DOM/geeQry.jsm";
import {NOTE_IDX} from "../music.jsm";

function WavEdit(common) {
    var i = common.commands.CMD_TAIL + 4;
    const cmds = {
        
        speed: i++,
        we_InstrumentNoteSelect: i++,
        we_len_sub: i++,
        we_len_zoom1: i++,
        we_len_zoom4: i++,
        we_len_zoom8: i++,
        we_len_zoom16: i++,
        we_len_zoom32: i++,
        we_len_zoom64: i++,
        we_len_zoomAll: i++,
        we_moveLeft: i++,
        we_moveRight: i++,
        we_len_toInstrument: i++,
        we_displayCan: i++,

        CMD_END: i,
    };
    const btns = {};
    var floating;
    const sampleWindowSize = common.settings.byName("wavEditWindowWidth");

 	const id = common.commandSets.mouse.getId();
    const mouse = common.commandSets.mouse;    
    const keyboard = common.commandSets.mouse.keyboard;    
    const {commandSets, commands, Buttons, piano, sequencer, synth}  = common;
    var sampleOffset = 0;
    var sampleMark = {
        start: 0,
        end: 0,
        len: 0,
        startPx: 0,
        endPx: 0,
        offsetPx: 0,
        show: true,
        windowSize: sampleWindowSize,
        bufLen: 0,
        update() {
            if (this.bufLen !== 0 && this.start !== this.end) {
                this.len = this.end - this.start;
                const invZoomLevel = zoomLevel ? 1 / zoomLevel : 1;
                const ww = (1 / (this.windowSize - 1)) * this.bufLen; 
                this.offsetPx = (sampleOffset | 0) * invZoomLevel | 0;               
                this.startPx = ((zoomLevel ? (sampleMark.start * invZoomLevel) : sampleMark.start / ww) | 0) - this.offsetPx;
                this.endPx = ((zoomLevel ? (sampleMark.end * invZoomLevel) : sampleMark.end / ww) | 0) - this.offsetPx;          
                if (this.startPx > sampleWindowSize || this.endPx < 0 || this.startPx === this.endPx) {
                    this.show = false;
                } else {
                    this.show = true;
                }
            } else {
                this.show = false;
            }
        }
    };
    var zoomLevel = 0;
    var prevZoomIdx = 0;
    var zoomIdx = 0;
    var updateWav = true;
    var lastRenderedBuffer;
    var currentNote;
    var containing;
    var dragStart = false;
    function sequencerTrackChannelChange(e) {
        updateWav = true;
        API.update();
    }
    
    function noteEvent(data) {
        const noteIdx = data.data.note.idx;
        btns.noteSel.API.setNoteIdx(noteIdx);
        API.update();
    }
    function onDragRelease(e, m) {
        
        
    }
    function onDragMove(e, m) {
        if (mouse.button === 0) {
            m.releaseCapture(id);
        } else {
            if (m.ctrl || (m.button & 4) === 4) {
                if (sampleMark.bufLen !== 0) {
                    m.forElement(btns.display);
                    let start = sampleMark.start;
                    let end = sampleMark.end;
                    if (zoomLevel === 0) {
                        if (dragStart) {
                            dragStart = false;
                            end = start = (m.fx / sampleMark.windowSize) * sampleMark.bufLen | 0;
                        } else {
                            end = (m.fx / sampleMark.windowSize) * sampleMark.bufLen | 0;
                        }
                    } else {
                        if (dragStart) {
                            dragStart = false;
                            end = start = ((m.fx * zoomLevel) | 0) + (sampleOffset | 0);
                        } else {
                            end = ((m.fx * zoomLevel) | 0) + (sampleOffset | 0);      
                        }                            
                        
                    }
                    if (end < start) {
                        [start, end] = [end, start];
                    }
                    if (end !== sampleMark.end || start !== sampleMark.start) {
                        sampleMark.end = end;
                        sampleMark.start = start;
                        updateWav = true;
                        API.update();
                       
                    }
                    
                    
                }
                
            } else {
                const oldOffset = sampleOffset;
                if (zoomLevel > 0) {
                

                    sampleOffset -= (m.x- m.oldX) * zoomLevel;
                    sampleOffset = Math.max(0, sampleOffset);        
                } else {
                    sampleOffset = 0;
                }
                if (oldOffset !== sampleOffset) {
                    updateWav = true;
                    API.update();
                }       
            }        
        }
    }
    function onDrag(e, m) {
        const oldOffset = sampleOffset;
        if (zoomLevel > 0 || m.ctrl || (m.button & 4) === 4) {
            if (m.requestCapture(id, onDragMove)) {
                dragStart = true;
                
            }  
        } 
    }
    const zoomLevels = [
        {zoom: 0,  cmd: cmds.we_len_zoomAll},
        {zoom: 1,  cmd: cmds.we_len_zoom1},
        {zoom: 4,  cmd: cmds.we_len_zoom4},
        {zoom: 8,  cmd: cmds.we_len_zoom8},
        {zoom: 16, cmd: cmds.we_len_zoom16},
        {zoom: 32, cmd: cmds.we_len_zoom32},
        {zoom: 64, cmd: cmds.we_len_zoom64},
    ];
    const API = {
        cmds() { return cmds; },
        create(container) {
            containing = container;
            var X = 0, Y = 10, xs = 2.5, ys = 2;
            const group = "zGrp";
            const size = 16;
            const buttonsA = [
                {type: "subContain", pxScale: 1, x: 5, y: 5, id: "WavEdit", fitContent: false,  padX: 8, padY: 32},
                {x: (size + 2) * 0,  y: 22, command: cmds.we_InstrumentNoteSelect,   type: "noteSel",   sizeW: 50, size, sizeH: 16, help: "Select note to show",  cssClass: "font14", mouse, keyboard, pxScale: 1},
                {x: (size + 2) * 3,  y: 22, command: cmds.we_len_zoom1,    group, type: "buttonNew", size, help: "", sprite: 8, pxScale: 1},
                {x: (size + 2) * 4,  y: 22, command: cmds.we_len_zoom4,    group, type: "buttonNew", size, help: "", sprite: 11, pxScale: 1},
                {x: (size + 2) * 5,  y: 22, command: cmds.we_len_zoom8,    group, type: "buttonNew", size, help: "", sprite: 15, pxScale: 1},
                {x: (size + 2) * 6,  y: 22, command: cmds.we_len_zoom16,   group, type: "buttonNew", size, help: "", sprite: 13 * 4 + 1, pxScale: 1},
                {x: (size + 2) * 7,  y: 22, command: cmds.we_len_zoom32,   group, type: "buttonNew", size, help: "", sprite: 19 * 4 + 0, pxScale: 1},
                {x: (size + 2) * 8,  y: 22, command: cmds.we_len_zoom64,   group, type: "buttonNew", size, help: "", sprite: 19 * 4 + 1, pxScale: 1},
                {x: (size + 2) * 9,  y: 22, command: cmds.we_len_zoomAll,  group, type: "buttonNew", size, help: "", sprite: 22 * 4 + 2, pxScale: 1},
                {x: (size + 2) * 10.5,  y: 22, command: cmds.we_moveLeft,  group, type: "buttonNew", size, help: "", sprite: 19 * 4 + 2, pxScale: 1},
                {x: (size + 2) * 11.5,  y: 22, command: cmds.we_moveRight,  group, type: "buttonNew", size, help: "", sprite: 19 * 4 + 3, pxScale: 1},
                
                {x: (size + 2) * 19,  y: 22, command: cmds.we_len_toInstrument,  type: "buttonNew", size, help: "", sprite: 22 * 4 + 3, pxScale: 1},
                {x: -2,               y: 22 + size + 4, command: cmds.we_displayCan, type: "drawable", sprite: 1, sizeW: sampleWindowSize, sizeH: 256, onDrag, mouse, help: "", pxScale: 1, cssClass: "dark"},
			];
            Buttons.add(container, buttonsA);

            
            btns.noteSel = Buttons.byCmd.get(cmds.we_InstrumentNoteSelect).element;
            btns.display = Buttons.byCmd.get(cmds.we_displayCan).element;
            btns.left = Buttons.byCmd.get(cmds.we_moveLeft).element;
            btns.right = Buttons.byCmd.get(cmds.we_moveRight).element;

            sequencer.addEvent("trackChange", sequencerTrackChannelChange);
            piano.addEvent("playnote", noteEvent);
            
        },     
        destroy() {
            sequencer.removeEvent("trackChange", sequencerTrackChannelChange);
            piano.removeEvent("playnote", noteEvent);
        },
        
        commands: {
            [cmds.we_displayCan](cmd, l, r, e) { },
            [cmds.we_InstrumentNoteSelect](cmd, l, r, e) { 
                currentNote = btns.noteSel.API.getNote();
            },
            [cmds.we_moveLeft](cmd, l, r, e) { sampleOffset = Math.max(0, (sampleOffset - sampleWindowSize * zoomLevel) | 0); updateWav = true},
            [cmds.we_moveRight](cmd, l, r, e) { sampleOffset = (sampleOffset + sampleWindowSize * zoomLevel) | 0; updateWav = true},
            [cmds.we_len_zoom1](cmd, l, r, e) { zoomIdx = 1; updateWav = true},
            [cmds.we_len_zoom4](cmd, l, r, e) { zoomIdx = 2; updateWav = true },
            [cmds.we_len_zoom8](cmd, l, r, e) { zoomIdx = 3; updateWav = true },
            [cmds.we_len_zoom16](cmd, l, r, e) { zoomIdx = 4; updateWav = true },
            [cmds.we_len_zoom32](cmd, l, r, e) { zoomIdx = 5; updateWav = true },
            [cmds.we_len_zoom64](cmd, l, r, e) { zoomIdx = 6; updateWav = true },
            [cmds.we_len_zoomAll](cmd, l, r, e) { zoomIdx = 0; updateWav = true },
            [cmds.we_len_toInstrument](cmd, l, r, e) { 
                commandSets.issueCommand(commands.sysLog, {message: "Instrument create no longer used.", col: "YELLOW"});
                const track = sequencer.activeTrack;
                if (track && !track.play.building) {
                    if (track.play.isInstrument) {
                        const buf = currentNote ? track.play.getBuffer(currentNote.name) : undefined;
                        console.log(buf._url);

                    }
                }
                
            },
        }, 
        commandRange(cmd, left, right) { 

		},        
        update() {
            var title = "WavEdit";
            if (zoomIdx !== prevZoomIdx) {
                Buttons.Groups.radio("zGrp", zoomLevels[zoomIdx].cmd, true);
                zoomLevel = zoomLevels[zoomIdx].zoom;
                prevZoomIdx = zoomIdx;
            }
            

            const ctx = btns.display.API.ctx;
            var x = 0;
            const track = sequencer.activeTrack;
            if (track && !track.play.building) {
                if (track.play.isInstrument && track.play.loNote !== undefined && track.play.hiNote !== undefined) {
                    btns.noteSel.API.enable();
                    btns.noteSel.API.setLoNote(track.play.loNote.idx);
                    btns.noteSel.API.setHiNote(track.play.hiNote.idx);
                    
                } else {
                    btns.noteSel.API.disable();
                    btns.noteSel.API.setAllNotes();
                }
                
                const buf = track.play.isSound ? track.play.getBuffer("A4") : (currentNote ? track.play.getBuffer(currentNote.name) : undefined);
                if (buf && (lastRenderedBuffer !== buf || updateWav)) {
                    const samples = buf.getChannelData(0);
                    const h = ctx.canvas.height;
                    const w = ctx.canvas.width;
                    const hh = h * 0.5;
                    const ww = (1 / (w - 1)) * samples.length;
                    sampleOffset = zoomLevel === 0 ? 0 : Math.min(buf.length - sampleWindowSize * zoomLevel, sampleOffset);
                    const offset = sampleOffset | 0;                    
                    if (zoomLevel) {
                        sampleOffset === 0 ? btns.left.API.disable() : btns.left.API.enable();
                        offset !== Math.min(buf.length - sampleWindowSize * zoomLevel, sampleOffset) | 0 ? btns.right.API.disable() : btns.right.API.enable();
                    } else {
                        btns.right.API.disable();
                        btns.left.API.disable()
                    }

                    sampleMark.bufLen = buf.length;      
                    sampleMark.update();    
                    const invZoomLevel = zoomLevel ? 1 / zoomLevel : 1;

                    updateWav = false;
                    

                    var ww1 = w;
                    btns.display.API.ctx.clearRect(0 ,0, w, h);
                    var y = samples[0] * hh + hh;
                    var sampMarkTime = 0;
                    if (sampleMark.show) {
                        ctx.beginPath();
                        ctx.fillStyle = "#800";
                        ctx.fillRect(sampleMark.startPx, 0, sampleMark.endPx - sampleMark.startPx, h);
                        sampMarkTime = (sampleMark.len / buf.sampleRate);
                    }
                    ctx.beginPath();
                    ctx.fillStyle = "#0A0";
                    while (x < w) {
                        const sampPos = ((zoomLevel ? (x * zoomLevel) : x * ww) | 0) + offset;
                        if (sampPos < samples.length) {
                            const y1 = (samples[sampPos] * hh + hh) | 0;
                            if (y === y1) { ctx.rect(x, y1, 1, 1); }
                            else if (y > y1) { ctx.rect(x, y1, 1, y - y1); }
                            else if (y < y1) { ctx.rect(x, y,  1, y1 - y); }  
                            y = y1;    
                            x++;
                        } else {
                            ww1 = x;
                            break;
                        }
                    }
                    
                    ctx.fill();
                    lastRenderedBuffer = buf;
                    ctx.beginPath();
                    ctx.fillStyle = "#FA08";
                    var marks = "";
                    if (zoomLevel > 0) {
                        let secSpace = (buf.sampleRate * invZoomLevel) * 0.1;
                        marks = " 1/10 sec";
                        if (secSpace > ww1) {
                            secSpace = (buf.sampleRate * invZoomLevel) * 0.02;
                            marks = " 1/50 sec";
                            if (secSpace > ww1) {
                                secSpace = (buf.sampleRate * invZoomLevel) * 0.01;
                                marks = " 1/100 sec";
                            }
                        }
                        x = -offset * invZoomLevel;
                        x = x % secSpace;
                        while (x < ww1) {
                            ctx.rect(x | 0, 0, 1, h);
                            x += secSpace;
                        }
                    } else {
                        const secSpace = w / (buf.duration * 10);
                        x = 0;
                        while (x < ww1) {
                            ctx.rect(x | 0, 0, 1, h);
                            x += secSpace;
                        }
                        marks = " 1/10 sec";
                    }
                    if (sampMarkTime > 0) {
                        let idx = 0;
                        const approxFreq = 1/sampMarkTime;
                        let minDist = Infinity;
                        let closestNote;
                        while (idx < NOTE_IDX.length) {
                            const note = NOTE_IDX[idx];
                            const d = note.freq - approxFreq;
                            const absD = Math.abs(d);
                            if (absD < minDist) {
                                closestNote = note;
                                minDist = absD;
                            }
                            if (d > minDist) {
                                break;
                            }
                            idx++;
                        }
                            
                        title += marks + " " + buf.duration.toFixed(2) + " sec @: " + (offset / buf.sampleRate).toFixed(3) + " sec Marked: ~" + (1/sampMarkTime).toFixed(0) + " Hz " + (closestNote ? closestNote.name : "") + (track.play.isInstrument ? " '" + buf._url + "'" : "");
                    } else {
                        title += marks + " " + buf.duration.toFixed(2) + " sec @: " + (offset / buf.sampleRate).toFixed(3) + " sec " +  (track.play.isInstrument ? " '" + buf._url + "'" : "");
                    }
                    
                    
                    ctx.rect(0, (0.75 * hh + hh) | 0, w, 1);
                    ctx.rect(0, (-0.75 * hh + hh) | 0, w, 1);
                    
                    
                    ctx.fill();
                    ctx.beginPath();
                    ctx.fillStyle = "#FA0";                   
                    if (zoomLevel === 0) {  
                        const secSpace = w / buf.duration;
                        x = 0;
                        while (x < ww1) {
                            ctx.rect((x | 0) - 0.5, 0, 2, h);
                            x += secSpace;
                        }                        
                        
                    } else {
                        let secSpace = (buf.sampleRate * invZoomLevel);
                        x = -offset * invZoomLevel;
                        x = x % secSpace;
                        while (x < ww1) {
                            ctx.rect((x | 0) - 0.5, 0, 2, h);
                            x += secSpace;
                        }
                    }
                    ctx.rect(0, hh | 0, w, 1);
                    ctx.fill();
                    containing.children[0].textContent = title;
                } else {
                    btns.left.API.disable();
                    btns.right.API.disable();
                    
                }
            }
            
        }            
        
    }
 
    return API;
}

export {WavEdit};