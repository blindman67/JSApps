//import {NOTE_NAME, NOTE_FREQ, NOTE_IDX, createKey, NamedScales, cords, guitar} from "./music.jsm";
import {NamedScales, noteNames} from "./music.jsm";
import {Events} from "./Events.jsm";
import {Recorder} from "./Recorder.jsm";
import {Undoer} from "./Undoer.jsm";
import {WavRender} from "./WavRender.jsm";
const undos = Undoer(20);
var NOTE_IDX;
function NoteEvent(note, vol, bar, beat, length, colIdx) {
    this.note = note;
    this.freq = note.freq;
    this.vol = vol;
    this.selected = false;
    this.bar = bar;
    this.beat = beat;
    this.length = length;
    this.colIdx = colIdx
}
NoteEvent.prototype = {
    cloneNew(bar = this.bar, beat = this.beat) {
        return new NoteEvent(
            this.note,
            this.vol,            
            bar,
            beat,
            this.length,
            this.colIdx,
        )
    },
    clone(subBeats = 1, BPB = 4) {  /* Depreciated do not use. Use cloneNew */
        return new NoteEvent(
            this.note,
            this.vol,
            this.bar,
            (this.beat / subBeats) * BPB,
            this.length,
            this.colIdx,
        )
    },
    setNoteByIdx(idx) {
        if (idx >= 0 && idx < NOTE_IDX.length) {
            this.note = NOTE_IDX[idx | 0];
            this.freq = this.note.freq;
        }
    },
	isSameInBar(n) { return this.note.idx === n.note.idx && this.beat === n.beat && this.length === n.length },
}
const DEFAULT_TRACK_VOLUME = 0.5;
const DEFAULT_PATTERN = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
//const DEFAULT_PATTERN = [0,1,2,3];
const NoteColOffSets = [3,4,5,7,10,0,1,11,2,6,8,9];
const patternIds = [..."1234565789abcdefghijklmnopqrstuvwxyz"];
const SWING_POSITIONS = 32;
const SWING_RESOLUTION = 1 / 48;
const swings = [
    [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0],
    [0,3,0,3,0,3,0,3, 0,3,0,3,0,3,0,3, 0,3,0,3,0,3,0,3,  0,3,0,3,0,3,0,3],
    [0,0,0,3,0,0,0,3, 0,0,0,3,0,0,0,3, 0,0,0,3,0,0,0,3,  0,0,0,3,0,0,0,3],
];
function Sequencer(synth, atx, commons) {
    const commandSets = commons.commandSets
    const commands = commons.commands
    const logC = () => commandSets.issueCommand(commands.sysLog, {message: "", col: "GREEN"});
    const log = (message) => commandSets.issueCommand(commands.sysLog, {message, col: "GREEN"});
    const logA = (message) => commandSets.issueCommand(commands.sysLog, {message, col: "YELLOW"});
    const logB = (message) => commandSets.issueCommand(commands.sysLog, {message, col: "ORANGE"});
    NOTE_IDX = commons.music.NOTE_IDX;
	const BPM_60FPS =     [20, 24, 25, 30, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120, 144, 150, 180, 200, 225, 240];
    const FRAMES_PER_BAR = [180, 150, 144, 120, 100, 90, 80, 75, 72, 60, 50, 48, 45, 40, 36, 30, 25, 24, 20, 18, 16, 15];
	const frameSpeeds = {
		bpb4: [20, 25, 30, 36, 45, 50, 60, 75, 90, 100, 150, 180, 225],
		bpb3: [20, 24, 25, 30, 40, 48, 50, 60, 75, 80, 100, 120, 150, 200, 240],
		bpb2: [20, 24, 25, 30, 36, 40, 45, 50, 60, 72, 75, 90, 100, 120, 150, 180, 200, 225],
		fpn4: [180, 144, 120, 100, 80, 72, 60, 48, 40, 36, 24, 20, 16],
		fpn3: [180, 150, 144, 120, 90, 75, 72, 60, 48, 45, 36, 30, 24, 18, 15],
		fpn2: [180, 150, 144, 120, 100, 90, 80, 72, 60, 50, 48, 40, 36, 30, 24, 20, 18, 16],
		closest(bpm, bpb, dir) {
			var i = 0, maxDist = 10000, closestSpeed = BPM * BPB;
			const set = frameSpeeds["bpb" + bpb];
			if (set) {
				while (i < set.length) {
					const dist = Math.abs(set[i] - bpm);
					if (dist < maxDist) {
						maxDist = dist;
						closestSpeed = i;
					}
					i++;
				}
				closestSpeed = closestSpeed + Math.sign(dir);
				closestSpeed = Math.max(0, Math.min(set.length - 1, closestSpeed));
				SystemLogPanel.children[2].textContent = "Frames per note @60fps: " + frameSpeeds["fpn" + bpb][closestSpeed];
				closestSpeed = set[closestSpeed];
			}
			return closestSpeed / BPB;
		}
	}
	var sequenceName = location.href.split("?")[1] ?? "Unnamed";
    var BPM = 30;  // Bars per minute
    var BPB = 4;
    var SBPB = 0;
    var barScale, beatScale;
    
    function updateSpeed() {
        barScale = BPM / 60;
        beatScale = (BPB * BPM)  / 60;
        API.timeScale = beatScale;
    }
    var timeEventHdl;
    var recorder;
    var recording = false;
	var loop = false;
    var loopBars = {start:0, end: 0};
    var looping = {start:0, end: 0};
    var maxBarCount = 0;
    
    const bars = [];
    const tracks = [];
    var startTime = undefined;
    var firstNoteTime = 0;
    var render;
    var dirty = false;
    var saveUndoState = true;
	var keyName = "A";
	var scaleName = "major";
    var stepSampling = false;
	function eventBeforRender(...args) {
		commons.render.onceBefore = () => API.fireEvent(...args);
	}
    const stepper = {
        trackIdx: 0,
        patternIdx: 0,
        noteIdx: 0,
        renderUID: 0,
        reset() {
            stepper. renderUID = commandSets.commons.getUID();
            stepSampling = true;
            API.playing = true;
            logC();
            logC();
            logB("Created Step render: " + (maxBarCount / barScale) + " sec");
            stepper.trackIdx = 0;
            stepper.nextTrack();         
        },        
        nextTrack() {
            var i = stepper.trackIdx;
            while (i < tracks.length) {
                const t = tracks[i];
                if (!t.mute && t.patterns.length && t.vol > 0) {
                    stepper.renderTrack(i);
                    return;
                }
                i ++;
            }            
            if (WavRender.hasStacked()) {
                WavRender.completed(API.sequenceName + "_" + stepper.renderUID, synth)
                    .then(() => {
                        
                        stepper.getLogs();
                        API.stop();
                        API.fireEvent("renderCompleted");  
                    });
            } else {
                stepper.getLogs();
                API.stop();
                API.fireEvent("renderCompleted");
            }
        },
        getLogs() {
            while (WavRender.info.length) {
                log(WavRender.info.shift());
            }
        },
        saveRender() {
            if (stepSampling) {            
                if (WavRender.hasContent) {
                    const renderName = WavRender.options.mixDown ? "Trk " + stepper.trackIdx + " " + tracks[stepper.trackIdx].channelName :
                        API.sequenceName + "_" + stepper.renderUID + "_Trk_" + stepper.trackIdx + "_" + tracks[stepper.trackIdx].channelName;
                    const trkVol = tracks[stepper.trackIdx].vol;
                    const synthLevel = synth.volume;
                    WavRender.completedTrack(renderName, trkVol, synthLevel)
                        .then(() => {
                            stepper.getLogs();
                            stepper.trackIdx ++;
                            stepper.nextTrack();
                        });
                    
                } else {
                    stepper.trackIdx ++;
                    stepper.nextTrack();                
                }
            }
            
        },
        renderTrack(tIdx) {
            if (stepSampling) {
                const renderName = API.sequenceName + "_Trk_" + stepper.trackIdx;
                logA("Rendering: '" + renderName + "'");
                stepper.trackIdx = tIdx;
                stepper.patternIdx = 0;
                stepper.noteIdx = 0;
                WavRender.createBuf(maxBarCount / barScale, 2, 48000, tracks[stepper.trackIdx].vol); 
                stepper.render();  
            }
        },        
        render() {
            if (stepSampling) {
                var track = tracks[stepper.trackIdx];
                var bar = stepper.patternIdx;
                if (bar < track.patterns.length) {
                    const patIdx = track.patterns[bar];
                    if (patIdx > -1) {
                        const pat = track.bars[patIdx];
                        while (stepper.noteIdx < pat.length) {
                            const n = pat[stepper.noteIdx];
                            const swingOffset = track.swingOn ? track.swing[(n.beat * SBPB | 0) % SWING_POSITIONS] * SWING_RESOLUTION  : 0;
                            const noteOn = (bar * BPB + (n.beat + swingOffset)) / beatScale;
                            const noteOff = noteOn + n.length / beatScale;
                            if (track.play.sampler) {
                                track.play.pan(-(track.pan * 2 - 1));
                                track.play.setVolume(track.vol);
                                const sample = track.play.sampler(n, noteOn, noteOff, track.envelopeIdx);
                                if (sample) {
                                    WavRender.drawSample(sample);
                                }
                            }
                            stepper.noteIdx++;
                        }
                    }
                    stepper.patternIdx ++;
                    stepper.noteIdx = 0;
                    if (stepper.patternIdx < track.patterns.length) {
                        setTimeout(stepper.render, 1);
                        return;
                    }
                    stepper.saveRender();
                }
            }
        }
    };
    const API = {
		NoteColOffSets,
        SWING_RESOLUTION,
        serialize() {
            const at = API.activeTrack;
            const seq = {
                version: 3,
				name: sequenceName,
                SBPB, BPM, BPB,
				scale: scaleName,
				key: keyName,
                activeTrack: at?.idx,
                tracks: [],
            };
            for (const t of tracks) {
                
                const nt = {
                    channel: t.channelName,
                    trackIdx: t.idx,
                    noteColorIdx: t.noteColorIdx,
                    mute: t.mute,
					pan: t.pan,
					show: t.show,
                    vol: Number(t.vol.toFixed(3)),
                    envIdx: t.envelopeIdx,
                    patSeq: t.patterns,
                    patterns: t.bars.map(pat => pat.map(note =>
                        ([note.note.idx, Number(note.vol.toFixed(3)), note.beat, note.length, note.colIdx])
                    )),
                    swing: [...t.swing],
                    swingIdx: t.swingIdx,
                    swingOn: t.swingOn,                   
                };
                seq.tracks.push(nt);
            }
            return seq;
        },
		set scale(scale) { scaleName = scale },
		get scale() { return scaleName },
		set key(key) { keyName = key },
		get key() { return keyName },
        deserialize(seq) {
            saveUndoState = false;
            API.fireEvent("deserializeStart");
            API.clear();
            API.timeSignature = seq.SBPB + "/" + seq.BPB;
            API.BPM = seq.BPM;
			API.sequenceName = seq.name ?? sequenceName;
			API.scale = seq.scale ?? "minor";  // default minor as I was testing with music written in minor scale
			API.key = seq.key ?? "A";
            var correctTrackIdx = true;
            seq.tracks.sort((a, b) => a.trackIdx - b.trackIdx);
            var i = 0;
            for (const t of seq.tracks) {
                const nt = API.addTrack(t.channel);
                if (seq.activeTrack !== undefined && correctTrackIdx && i !== nt.idx) {
                    if (seq.activeTrack === nt.idx) {
                        seq.activeTrack = i;
                        correctTrackIdx = false;
                    }
                }
                nt.mute = t.mute;
				nt.pan = t.pan ?? 0.5;
                nt.vol = t.vol;
				nt.show = t.show === true;
                nt.noteColorIdx = t.noteColorIdx ?? NoteColOffSets[i % NoteColOffSets.length];
                nt.setEnvelope(t.envIdx);
                nt.patterns = t.patSeq;
                nt.bars = t.patterns.map((pat, idx) => {
                    if (seq.version === undefined) {
                        return pat.map(note => new NoteEvent(NOTE_IDX[note[0]], note[1], note[2], note[3], note[4]));
                    }
                    if (seq.version === 2) {
                        return pat.map(note => new NoteEvent(NOTE_IDX[note[0]], note[1], idx, note[2], note[3], nt.noteColorIdx));
                    }
                    if (seq.version === 3) {
                        return pat.map(note => new NoteEvent(NOTE_IDX[note[0]], note[1], idx, note[2], note[3], note[4]));
                    }
                    return [];
                });
                nt.swing = t.swing !== undefined ? [...t.swing] : nt.swing;
                nt.swingOn = t.swingOn !== undefined ? t.swingOn : nt.swingOn;
                nt.swingIdx = t.swingIdx !== undefined ? t.swingIdx : nt.swingIdx;
                nt.dirty = true;
                i++;
            }
            dirty = true;
            API.clean();
            API.fireEvent("deserialize");
            seq.activeTrack !== undefined && tracks[seq.activeTrack].setActive(true);
            saveUndoState = true;
        },
		musicState: null,
		interpMidi(midi) {
            saveUndoState = false;
            API.fireEvent("deserializeStart");
            API.clear();
			const data = midi.midi;
			const ticksPQ = data.ticksPerQuarterNote;
			const sig = midi.findEvent(midi.types.signature);
			if (sig) {
				API.timeSignature = (sig.bpb === 4 || sig.bpb === 3 ? sig.bpb : 4) + "/" + sig.beats ;
				API.BPM = ((ticksPQ / (4 * sig.ticksPerBeat)) * sig.beats) * sig.bpb ;
			} else {
				API.timeSignature = "4/4";
				API.BPM = 120;
			}
			midi.resetTracks();
			const trackCount = midi.trackCount;
			var tCount = 0;
			var i = 0;
			while (i < trackCount && tCount < 7) {
				const track = midi.getTrack(i);
				if (track.hasNotes()) {
					const t = API.addTrack();
					t.mute = false;
					const colIdx = t.noteColorIdx = NoteColOffSets[i % NoteColOffSets.length];
					var nn = track.nextNote();
					while (nn) {
						const nIdx = nn.note - 22;
						if (nIdx >= 0 && nIdx < NOTE_IDX.length && nn.vel > 0) {
							nn.time /= ticksPQ;
							nn.offTime /= ticksPQ;
							const bar = nn.time / BPB | 0;
							if (bar < 48) {
								const beat = nn.time % BPB;
								var len = ((Math.min(BPB, nn.offTime - nn.time) * (BPB * SBPB)) | 0) / (BPB * SBPB);
								t.addNote(new NoteEvent(NOTE_IDX[nIdx], (nn.vel / 127) ** 1.1, bar, beat, len, colIdx))
							} else {
								break;
							}
						}
						nn = track.nextNote();
					}
					API.optimiseTrack(t);
					if (t.patterns.every(p => p < 0)) {
						tracks.pop();
					} else {
						tCount ++;
					}
				}
				i++;
			}
            dirty = true;
            API.clean();
            API.fireEvent("deserialize");
            tCount > 0 && tracks[0].setActive(true);
            saveUndoState = true;
		},
        undos,
        undo(undo = true) {
            var stateChanged = false;
            const activeTrackIdx = API.activeTrack.idx;
            if (undo && undos.canUndo) { API.deserialize(undos.undo()); stateChanged = true }
            else if(!undo && undos.canRedo) { API.deserialize(undos.redo()); stateChanged = true }
            if (stateChanged) {
                const activeTrack = API.activeTrack;
                if (activeTrack.idx !== activeTrackIdx) {
                    activeTrack.setActive(true, true);
                }
            }
        },
        redo() { API.undo(false) },
        timeScale: 120 / 60,
        MAX_OCTAVES: 8,
        set BPMFramed(val) {
			BPM = frameSpeeds.closest(BPM * BPB, BPB, val - BPM);
            if (API.playing) {
                const time = atx.currentTime;
                const fromStart = (time - startTime) * beatScale;
                updateSpeed()
                startTime = time - fromStart / beatScale;
            } else {
                updateSpeed();
            }
            API.fireEvent("timeSignature", {BPM, BPB, SBPB});
		},
        set BPM(val) {
            BPM = val < BPB ? BPB : val > 240 / BPB ? 240 / BPB : val;
            if (API.playing) {
                const time = atx.currentTime;
                const fromStart = (time - startTime) * beatScale;
                updateSpeed()
                startTime = time - fromStart / beatScale;
            } else {
                updateSpeed();
            }
            API.fireEvent("timeSignature", {BPM, BPB, SBPB});
        },
        set BPB(val) { BPB = val; updateSpeed()  },
        get BPM() { return BPM },
        get BPB() { return BPB },
        get SBPB() { return SBPB },
        get beatScale() { return beatScale },
        set noteRender(val) { render = val },
        set timeSignature(val) {
            const [subBeats, beatsPerBar] = val.split("/");
            if (BPB !== Number(beatsPerBar) || SBPB !== Number(subBeats)) {
                BPB = Number(beatsPerBar);
                SBPB = Number(subBeats);
				eventBeforRender("timeSignature", {BPM, BPB, SBPB});
            }
        },
        get pos() {
            if (startTime === undefined) {
                return [0, 0];
            }
            const time = atx.currentTime - startTime;
            if (time < 0) {
                return [0, 0];
            }
            return [
                (time * beatScale) / BPB | 0,
                ((time * beatScale) ) % BPB,
            ];
        },
        get length() { return maxBarCount;/*//bars.length */},
        get activeTrack() { return tracks.find(t => t.active) },
        tracks,
        bars,
        playing: false,
        bufferSize: 0.1, // in seconds
        startTimeOffset: 0.5,
        trackChange(track, type = "pattern") {
            dirty = track.dirty = true;
            API.fireEvent("trackChange", {track, type});
        },
        isDirty() { return dirty },
        soil() { dirty = true },
        instrumentUpdate(event) {
            const track = API.activeTrack;
            if (track?.channelName === event.data) {
                API.fireEvent("trackChange", {track, type: "active"});
            }
        },
        channelsReset() {
            for (const t of tracks) {
                const tName = t.channelName;
                t.channelName = "";
                t.play = null;
                t.setChannel(tName);
            }
        },
        clean(frame) {
            if (dirty) {
                dirty = false;
                for(const t of tracks) { t.dirty && t.clean() }
                if (saveUndoState) {
                    undos.addState(API.serialize())
                };
                API.update();
            }
        },
        clear() {
            if (API.playing) { API.stop() }
            tracks.length = 0;
            bars.length = 0;
			dirty = true;
            API.fireEvent("cleared");
        },
        copyTrack() {
            const at = API.activeTrack;
            if (at) {
                const newTrack = API.addTrack(at.channelName);
                newTrack.patterns.length = 0;
                newTrack.patterns.push(...at.patterns);
                newTrack.bars.length = 0;
                newTrack.bars.push(...at.bars.map(bar=> bar.map(note => {
                    const newNote = note.clone(BPB, BPB);
                    newNote.colIdx = NoteColOffSets[tracks.length - 1];
                    return newNote;
                })));
                newTrack.vol = at.vol;
                dirty = newTrack.dirty = true;
                return newTrack;
            }
            return API.addTrack("");
        },
		removeTrack() {
			var i = 0;
			const at = API.activeTrack;
			if (at) {
    			while (i < tracks.length) {
					if (tracks[i] === at) {
						tracks.splice(i, 1);
						API.fireEvent("removedTrack",{trackIdx: i});
						API.fireEvent("trackChange", {track: tracks[i], type: "active"});
						dirty = true;
						i--;
					} else { tracks[i].idx = i }
					i++;
				}
			}
		},
		showTrack(trackIdx) {
			if (trackIdx >= 0 && trackIdx < tracks.length) {
				tracks[trackIdx].setShow(!tracks[trackIdx].show);
			}
		},
		muteTrack(trackIdx) {
			if (trackIdx >= 0 && trackIdx < tracks.length) {
				tracks[trackIdx].setMute(!tracks[trackIdx].mute);
			}
		},
		setActiveTrack(trackIdx) {
			if (trackIdx >= 0 && trackIdx < tracks.length) {
				const newState = !tracks[trackIdx].active;
				for (const t of tracks) { t.setActive(false) }
				tracks[trackIdx].setActive(newState);
				API.fireEvent("trackChange", {track: tracks[trackIdx], type: "active"});
			}
		},
        addTrack(channelName) {
            var track, patIdx;
            const idx = tracks.length;
            channelName = synth[channelName] ? channelName : synth.defaultChannelName;
            function patternAtBar(bar) {
                if (bar <= track.patterns.length) {
                    patIdx = track.patterns[bar];
                    if (patIdx >= 0 && patIdx < track.bars.length) {
                        return track.bars[patIdx];
                    }
                }
                patIdx = -1;
            }
            tracks.push(track = Object.assign([], {
                bars: patternIds.map(() => []),
                patterns: [...DEFAULT_PATTERN],
                vol: DEFAULT_TRACK_VOLUME,
				key: API.musicState.key,
				scale: API.musicState.scale,
                pos: 0,
                patPos: 0,
                channelName: "",
                envelopeIdx: 0,
                play: null,
                idx,
                active: false,
                mute: true,
				pan: 0.5,
                dirty: false,
				show: false,    // if true visible when not active track
                noteColorIdx: NoteColOffSets[tracks.length],
                swing: [...swings[0]],
                swingIdx: 0,
                swingOn: false,
                setSwingOffset(pos, offset) {
                    if (track.swingOn && pos >= 0 && pos < track.swing.length) {
                        if (track.swing[pos] !== offset) {
                            track.swing[pos] = offset;
                            API.trackChange(this);
                        }
                    }
                },
                setSwing(val) {
                    if (val !== track.swingOn) {
                        track.swingOn = val;
                        API.trackChange(this);
                    }
                },
                setSwingIdx(idx) {
                    idx = ((idx % swings.length) + swings.length) % swings.length;
                    if (track.swingIdx !== idx) {
                        track.swingIdx = idx;
                        track.swing.length = 0;
                        track.swing.push(...swings[idx]);
                        API.trackChange(this);
                    }
                },
                duplicatePattern(bar) {
                    var i = 0;
                    if (bar === -1) {
                    } else {
                        const pat = patternAtBar(bar);
                        if(pat) {
                            const newPatIdx = patternIds.findIndex((v, i) => !this.patterns.includes(i) && this.bars[i].length === 0);
                            if (newPatIdx > -1) {
                                const patCopy = this.copyPattern(bar)
                                this.setPattern(bar, newPatIdx);
                                this.pastePattern(bar, patCopy);
                            }
                        }
                    }
                },
                copyPattern(bar, moveNote = false) {
                    if (bar === -1) {
                        if (render.selection.selected && render.selection.notes.length) {
                            const firstNote = render.selection.notes[0];
                            const firstPos = firstNote.bar * BPB + firstNote.note.beat;
                            const firstIdx = firstNote.note.note.idx;
                            const buffer = render.selection.notes.map(n => {
                                const newNote = n.note.clone(BPB, BPB);
                                const pos = (n.bar * BPB + newNote.beat) - firstPos;
                                newNote.bar = (pos / BPB) | 0;
                                newNote.beat = pos % BPB;
                                newNote.idxOffset = n.note.note.idx - firstIdx;
                                return newNote;
                            });
                            buffer.relativeBuf = true;
                            return buffer;
                        }
                    } else {
                        const pat = patternAtBar(bar);
                        if (pat) { return [...pat.map(n=> n.clone(BPB, BPB))] }
                    }
                },
                pastePattern(bar, notes) {
                    if (bar === -1 || notes.relativeBuf ) {
                        const [cBar, cBeat, cIdx] = render.getCursorPos();
                        const pos = cBar * BPB + cBeat;
                        const notesToAdd = [];
                        var i = 0, update = false;
                        while (i < notes.length) {
                            const n = notes[i++];
                            const nPos = (n.bar * BPB + n.beat) + pos;
                            const nBar = nPos / BPB | 0;
							const nn = n.clone(BPB, BPB);
							nn.setNoteByIdx(cIdx + n.idxOffset);
							nn.bar = nPos / BPB | 0; //cBar;
							nn.beat = nPos % BPB;
							this.addNote(nn);
							update = true;
                        }
                        update && API.trackChange(this);
                    } else {
                        if (patternAtBar(bar)) {
                            this.deletePattern(bar);
                            for (const n of notes) {
                                const newNote = n.clone(BPB, BPB);
                                newNote.bar = bar;
                                this.addNote(newNote);
                            }
                            API.trackChange(this);
                        }
                    }
                },
                moveNote(noteToMove, barBeatMove, noteMove) {
                    const pat = this.bars[this.patterns[noteToMove.bar]];
                    const idx = pat.findIndex(n => n === noteToMove);
                    if (pat[idx] !== undefined) {
                        const note = pat[idx];
                        const nbb = Math.min(this.patterns.length * BPB - 1/ SBPB, note.bar * BPB + note.beat + barBeatMove);
                        const newBar = nbb / BPB | 0;
                        const newBeat = nbb % BPB;
                        if (newBar >= 0 && newBar < this.patterns.length) {
                            pat.splice(idx, 1);
                            note.setNoteByIdx(note.note.idx + noteMove);
                            const barIdx = this.patterns[newBar];
                            if (barIdx >= 0) {
                                const barNotes = this.bars[barIdx];
                                note.beat = newBeat;
                                note.bar = newBar;
                                barNotes.push(note);
                                return true;
                            }
                        }
                    }
                },
                cloneSelectedNotes() {
                    if (render.selection.selected && render.selection.notes.length) {
                        render.selection.eachOnce(nt => {
                            const newNote = nt.clone(BPB, BPB);
                            newNote.bar = nt.bar;
                            this.addNote(newNote);
                        });
                        API.trackChange(this);
                    }
                },
                patternMoveNoteVolumes(bar, dir) {
         
                    if (bar === -1) {
                        if (render.selection.selected) {
                            render.selection.eachOnce(n => {
                                n.vol = Math.min(1, Math.max(0, n.vol + dir));
                            });
                            API.trackChange(this);
                        }
                    } else {
                        const pat = patternAtBar(bar);
                        if (pat) {
                            for (const n of pat) {
                                n.vol = Math.min(1, Math.max(0, n.vol + dir));
                            }
                            API.trackChange(this);
                        }
                    }
                },                
                patternMoveNotes(bar, dir) {
                    if (bar === -1) {
                        if (render.selection.selected) {
                            render.selection.eachOnce(n => n.setNoteByIdx(n.note.idx + dir));
                            API.trackChange(this);
                        }
                    } else {
                        const pat = patternAtBar(bar);
                        if (pat) {
                            for (const n of pat) { n.setNoteByIdx(n.note.idx + dir) }
                            API.trackChange(this);
                        }
                    }
                },
                patternMoveTime(bar, dir) {  // dir in sub bar measure
                    var nt;
                    const subBeats = BPB * SBPB;
                    if (bar === -1) {
                        if (render.selection.selected) {
                            render.selection.eachOnce(n => {
                                var nt = n.beat * SBPB + dir;
                                nt = (nt % subBeats + subBeats) % subBeats | 0;
                                n.beat = nt / SBPB;
                            });
                            API.trackChange(this);
                        }
                    } else {
                        const pat = patternAtBar(bar);
                        if (pat) {
                            for (const n of pat) {
                                nt = n.beat * SBPB + dir;
                                nt = (nt % subBeats + subBeats) % subBeats | 0;
                                n.beat = nt / SBPB;
                            }
                            API.trackChange(this);
                        }
                    }
                },
                patternNoteTime(bar, dir) {
                    var nt;
                    if (bar === -1) {
                        if (render.selection.selected) {
                            render.selection.eachOnce(n => {
                                var nt = n.length + (1 / SBPB) * dir;
                                nt = nt < (1 / SBPB) ? (1 / SBPB) : nt;
                                n.length = nt;
                            });
                            API.trackChange(this);
                        }
                    } else {
                        const pat = patternAtBar(bar);
                        if (pat) {
                            const subBeats = BPB * SBPB;
                            for (const n of pat) {
                                nt = n.length + (1 / SBPB) * dir;
                                nt = nt < (1 / SBPB) ? (1 / SBPB) : nt;
                                n.length = nt;
                            }
                            API.trackChange(this);
                        }
                    }
                },
                deletePattern(bar) {
                    var head, tail;
                    if (bar === -1) {
                        if (render.selection.selected) {
                            for (const pat of this.bars) {
                                head = tail = 0;
                                while (head < pat.length) {
                                    const note = pat[head];
                                    if (note.selected) { head++ }
                                    else {
                                        if (head !== tail) { pat[tail] = pat[head] }
                                        head++;
                                        tail++;
                                    }
                                }
                                pat.length = tail;
                            }
                        }
                        render.selection.clear();
                        API.trackChange(this);
                    } else {
                        const pat = patternAtBar(bar);
                        if (pat) {
                            pat.length = 0;
                            API.trackChange(this);
                        }
                    }
                },
                setPattern(bar, patternIdx) {
                    if (bar === -1) {
                    } else {
                        if (bar <= this.patterns.length) {
                            if (patternIdx < this.bars.length) {
                                this.patterns[bar] = patternIdx;
                                maxBarCount = Math.max(maxBarCount, this.patterns.length);
                                API.fireEvent("trackChange", {track, type: "pattern"});
                            }
                        }
                    }
                },
                setNoteColorIdx(idx) {
                    idx %= NoteColOffSets.length;
                    this.noteColorIdx = idx;//NoteColOffSets[idx];
                    if (render.selection.selected && render.selection.notes.length) {
                        render.selection.eachOnce(nt => nt.colIdx = idx);
                    }
                    API.trackChange(this, "color");
                },
				isBarSameAs(barIdx, bar) {
					var i, result = false;
					if (barIdx < this.bars.length && barIdx >= 0) {
						const b = this.bars[barIdx];
						if (bar.length === b.length) {
							i = 0;
							result = true;
							while (i < bar.length) {
								const n = bar[i++];
								if (!b.some(nn => n.isSameInBar(nn))) {
									result = false;
									break;
								}
							}
						}
					}
					return result;
				},
                reset() { this.patPos = this.pos = 0 },
                getNotesForBar(barIdx) {
                    if (barIdx < this.patterns.length) {
                        return this.bars[this.patterns[barIdx]];
                    }
                },
                uniquePattern() {
					var i = 0;
					while (this.patterns.includes(i)) { i ++ }
					return i;
				},
				addNote(note) {
					var i = 0;
                    const bar = note.bar;
					if (bar >= this.patterns.length) {
						while (this.patterns.length < bar) {
							this.patterns.push(this.uniquePattern());
						}
						this.patterns.push(this.uniquePattern())
					}
                    const barIdx = this.patterns[bar];
					if (barIdx >= 0) {
						if (this.bars[barIdx] === undefined) {
							i = this.bars.length;
							while (i <= barIdx) {
								if (this.bars[i] === undefined) { this.bars[i] = [] }
								i++;
							}
						}
                        const barNotes = this.bars[barIdx];
                        barNotes.push(note.clone(BPB, BPB));
                    }
                },
                setChannel(name) {
                    if (this.channelName !== name && synth[name]) {
                        this.channelName = name;
                        synth[name].init?.();
                        this.play = synth[name];
                        API.fireEvent("trackChange", {track, type: "channel"});
                        this.setEnvelope(this.play.getDefaultEnvelopeIdx());
                    } else if (!synth[name] && synth.defaultChannelName !== name) {
                        this.setChannel(synth.defaultChannelName);
                    }
                },
                setActive(val, force = false) {
                    if (this.active !== val || force) { this.active = val }
                },
                setMute(val) {
                    if (this.mute !== val) {
                        this.mute = val;
                        API.fireEvent("trackChange", {track, type: "mute"});
                    }
                },
                setShow(val) {
                    if (this.show !== val) {
                        this.show = val;
                        API.fireEvent("trackChange", {track, type: "show"});
                    }
                },
                setEnvelope(idx = this.envelopeIdx) {  // warning upper guard on idx removed
                    // idx = idx < 0 ? 0 : idx > 5 ? 5 : idx;
                    idx = idx < 0 ? 0 : idx;
                    if (idx !== this.envelopeIdx) {
                        this.envelopeIdx = idx;
                        API.fireEvent("trackEnvelope", {track, idx});
                    }
                },
                clean() {
                    if (this.dirty) {
                        for (const b of this.bars) { b.sort((a, b) => a.beat - b.beat) }
                        var i = 0, lastPat = 0;
                        while (i < this.patterns.length) {
                            if (this.patterns[i] > -1) { lastPat = i }
                            i++;
                        }
                        if (lastPat + 1 < this.patterns.length) {
                            this.patterns.length = lastPat + 1;
                            API.fireEvent("trackChange", {track, type: "active"});
                        }
                        this.dirty = false;
                    }
                },
                removeByIdx(nBar, idx) {
                    if (nBar < this.patterns.length) {
                        const pat = this.bars[this.patterns[nBar]];
                        if (pat[idx] !== undefined) { pat.splice(idx, 1) }
                    }
                },
                getNoteByIdx(nBar, idx) {
                    if (nBar < this.patterns.length) {
                        const pat = this.bars[this.patterns[nBar]];
                        if (pat[idx] !== undefined) { return pat[idx] }
                    }
                },
                notesAt(nBar, nBeat, noteLen = -1) {
                    var i  = 0;
                    const res = [];
                    if (nBar < this.patterns.length) {
                        const patIdx = this.patterns[nBar];
                        if (patIdx >= 0) {
                            const pat = this.bars[patIdx];
                            const pos = nBeat * SBPB | 0;
                            while (i < pat.length) {
                                const note = pat[i];
                                const start = note.beat * SBPB | 0, end = start + (note.length * SBPB | 0);
                                if (pos >= start && pos < end) {
                                    if (noteLen === -1 || (note.length * SBPB | 0) === noteLen) {
                                        res.push(note);
                                    }
                                }
                                i++;
                            }
                        } else if (patIdx === -1) { return res }
                    }
                    return res;
                },
                noteIdxAt(nBar, nBeat, nIdx) {
                    var i  = 0;
                    if (nBar < this.patterns.length) {
                        const patIdx = this.patterns[nBar];
                        if (patIdx >= 0) {
                            const pat = this.bars[patIdx];
                            const pos = nBeat * SBPB | 0;
                            while (i < pat.length) {
                                const note = pat[i];
                                if (note.note.idx === nIdx) {
                                    const start = note.beat * SBPB | 0, end = start + (note.length * SBPB | 0);
                                    if (pos >= start && pos < end) {
                                        return i;
                                    }
                                }
                                i++;
                            }
                        } else if (patIdx === -1) { return false }
                    }
                },
                insertNotes(...notes) {
                    if (this.active) {
                        API.addNotes(this.idx, ...notes);
                        dirty = this.dirty = true;
                        return true;
                    }
                    return false;
                },
            }));
            if (tracks.length > 1) {
                if (maxBarCount < track.patterns.length) { track.patterns.length = maxBarCount; }
                else if (maxBarCount > track.patterns.length) {
                    const pIdx = track.patterns[track.patterns.length - 1] ?? 0;
                    while (track.patterns.length < maxBarCount) { track.patterns.push(pIdx); }
                }
            }
                
            track.setChannel(channelName);
            dirty = true;
			API.setActiveTrack(tracks.length - 1);
			API.muteTrack(tracks.length - 1);
            API.fireEvent("addedTrack",{track});
            return track;
        },
		transpose() {
			var i = 0, j;
			const oldKeyIdx = noteNames.indexOf(API.key);
			const newKeyIdx = noteNames.indexOf(API.musicState.key);
			const nsNew = NamedScales[API.musicState.scale];
			const nsOld = NamedScales[API.scale];
			if (nsNew.scale.length !== nsOld.scale.length) {
				synth.message = "Can not transform scale " + API.scale + " to " + API.musicState.scale;
				API.scale = API.scale;
				API.key = API.key;
				API.fireEvent("scaleChanged");
				commons.commandSets.issueCommand(commands.sysUpdateSynth);
				return;
			}
			const newScale = commons.music.createKey(API.key, NamedScales[API.musicState.scale]);
			const oldScale = commons.music.createKey(API.key, NamedScales[API.scale]);
			for (const track of tracks) {
				if (!track.play.drums) {
					i = 0;
					const bars = track.bars;
					while (i < bars.length) {
						j = 0;
						const bar = bars[i];
						while (j < bar.length) {
							const n = bar[j];
							const newNote = oldScale.transpose(n.note, newScale);
							n.setNoteByIdx(newNote.idx + (newKeyIdx - oldKeyIdx));
							j++;
						}
						i++;
					}
				}
				API.trackChange(track);
			}
			API.scale = API.musicState.scale;
			API.key = API.musicState.key;
			API.fireEvent("scaleChanged");
		},
		mergeTracks(tA, tB) {
			var i = 0;
			const nBars = [];
			const nPats = [];
			const oPatA = tA.patterns;
			const oPatB = tB.patterns;
			while (i < oPatA.length) {
				const bar = tA.bars[oPatA[i]] ?? [];
				const nBar = [];
				for (const n of bar) { nBar.push(n.cloneNew(i)) }
				nBars.push(nBar);
				nPats.push(i);
				i++;
			}
			i = 0;
			while (i < oPatB.length) {
				const bar = tB.bars[oPatB[i]] ?? [];
				const nBar = nBars[i] ?? [];
				for (const n of bar) { nBar.push(n.cloneNew(i)) }
				if (i >= nBars.length) {
					nBars.push(nBar);
					nPats.push(i);
				}
				i++;
			}
			tA.patterns = nPats;
			tA.bars = nBars;
			tA.dirty = true;
			API.trackChange(tA);
			API.setActiveTrack(tB.idx);
			API.removeTrack();
			API.setActiveTrack(tA.idx);
			API.optimiseTrack(tA);
		},
		optimiseTrack(track) {
			track.clean();
			var i = 0, j, k;
			const changed = new Array(track.patterns.length).fill(false);
			for (const bar of track.bars) {
				if (!changed[i]) {
					j = i + 1;
					while (j < track.bars.length) {
						if (track.isBarSameAs(j, bar)) {
							k = 0;
							while(k < track.patterns.length) {
								if (track.patterns[k] === j && !changed[k]) {
									changed[k] = true;
									track.patterns[k]= i;
									track.dirty = true;
									dirty = true;
								}
								k++;
							}
						}
						j++;
					}
				}
				i ++;
			}
			var removed = 0, nextPos;
			nextPos = i = 0;
			while (i < track.bars.length) {
				if (!track.patterns.includes(i)) {
					removed += track.bars[i].length;
					track.bars[i].length = 0;
					nextPos --;
				} else if (nextPos !== i) {
					track.bars[nextPos].push(...track.bars[i]);
					track.bars[i].length = 0;
					k = 0;
					while (k < track.patterns.length) {
						if (track.patterns[k] === i) { track.patterns[k] = nextPos }
						k++;
					}
					track.dirty = true;
					dirty = true;
				}
				nextPos ++;
				i++;
			}
			i = 0;
			while (i < track.patterns.length) {
				if (track.bars[track.patterns[i]].length === 0) {
					track.patterns[i] = -1;
				}
				i++;
			}
			//console.log("Freeed up "+ removed + " notes");
		},
		resetTracks() { for (const track of tracks) { track.reset() } },
        loopResetTracks() { 
            if (loop && API.playing) {
                for (const track of tracks) {
                    track.patPos = looping.start;
                    track.pos = 0;
                }
            } else {
                API.resetTracks();
            }
        },
        addNotes(trackIdx, ...notes) {
            var i = 0;
            const track = tracks[trackIdx];
            dirty = track.dirty = true;
            while (i < notes.length) {
                const n = notes[i++];
                if (Array.isArray(n)) { API.addNotes(trackIdx, ...n) }
                else { track.addNote(n) }
            }
        },
        update() {
            bars.length = 0;
            maxBarCount = 0;
            var barIdx;
            for (const track of tracks) {
                barIdx = 0;
                maxBarCount = Math.max(maxBarCount, track.patterns.length);
                track.setEnvelope();
            }
            API.fireEvent("updated");
        },
        setBar(bar) {
            for (const t of tracks) {
                t.patPos = bar;
                t.pos = 0;
            }
        },
        get recording() { return recorder?.recording === true },
		loop(state) { 
            loop = state === true;
            if (loop) {
                if (loopBars.start === loopBars.end) {
                    loopBars.start = 0;
                    loopBars.end = maxBarCount;
                }
                looping.start = loopBars.start;
                looping.end = loopBars.end;
            }
        },
        setBarRange(first = 0, last = maxBarCount) {
            loopBars.start = first;
            loopBars.end = last;            
        },
		get looping() { return loop },
		set sequenceName(value) { sequenceName = value },
		get sequenceName() { return sequenceName },
        stop() {
            if (stepSampling) {
                API.stepSample();
            }
            if (recorder && recorder.recording) {
                recorder.stop(true, sequenceName + "_" + (BPM * BPB) + "BPM"  + (synth.volumeWet > 0 && synth.filterName ? "_" + synth.filterName : ""));
            }
            synth.stopSounds();
            API.playing = false;
            startTime = undefined
			loop = false;
            clearTimeout(timeEventHdl);
            API.resetTracks();
            API.fireEvent("stop");
            commandSets.issueCommand(commands.shuttleUpdate);
        },
        start() {
            if (API.playing) { API.stop() }
            synth.stopSounds();
            if (!API.playing) {
                const [bar, beat] = loop ? [looping.start, 0] : render.getPos();
                const time = atx.currentTime;
                if (startTime === undefined) {
                    if (recorder) {
                        startTime = time;
                        firstNoteTime = startTime;
                    } else {
                        startTime = time + API.startTimeOffset - ((bar * BPB) / beatScale);
                        firstNoteTime = startTime + (bar * BPB) / beatScale;
                    }
                }
                API.playing = true;
                API.fireEvent("start");
                if (recorder) {
                    API.play();
                } else {
                    timeEventHdl = setTimeout(() => API.play(), 0);
                }
                commandSets.issueCommand(commands.shuttleUpdate);
            }
        },
        async record() {
            if (API.playing) { API.stop() }
            if (!API.playing) {
                recorder = await Recorder(synth);
                recorder.start();
                API.start();
                return true;
            }
        },
        play() {
            if (!API.playing) { return }
            const time = atx.currentTime;
            const aheadTime = time + API.bufferSize;
            var nextUpdateTime = Infinity;
            var trackBuffered;
            for (const track of tracks) {
                if (!track.mute) {
                    trackBuffered = false;
                    const patCount = loop ? Math.min(looping.end, track.patterns.length) : track.patterns.length;
                    const renderKeys = track.active && render;
                    const eIdx = track.envelopeIdx;
					track.play.pan(-(track.pan * 2 - 1));
					track.play.setVolume(track.vol);
                    while (track.patPos < patCount && !trackBuffered) {
                        const bar = track.patPos;
                        const patIdx = track.patterns[bar];
                        if (patIdx > -1) {
                            const pat = track.bars[patIdx];
                            while (track.pos < pat.length) {
                                const n = pat[track.pos];
                                const swingOffset = track.swingOn ? track.swing[(n.beat * SBPB | 0) % SWING_POSITIONS] * SWING_RESOLUTION  : 0;
                                const noteOn = (bar * BPB + (n.beat + swingOffset)) / beatScale + startTime;
                                if (noteOn <= aheadTime) {
                                    if (noteOn >= firstNoteTime) {
                                        const noteOff = noteOn + n.length / beatScale;
                                        //n.vol = track.vol;
                                        track.play(n, noteOn, noteOff, eIdx);
                                        renderKeys && renderKeys.addNote(n, noteOn, noteOff);
                                    }
                                } else {
                                    trackBuffered = true;
                                    break;
                                }
                                track.pos ++;
                            }
                        }
                        if (!trackBuffered) {
                            track.pos = 0;
                            track.patPos++;
                        }
                    }
                    if (track.patPos < patCount) {
                        const bar = track.patPos;
                        const patIdx = track.patterns[bar];
                        if (patIdx > -1) {
                            const pat = track.bars[track.patterns[bar]];
                            if (track.pos < pat.length) {
                                const n = pat[track.pos];
                                
                                const swingOffset = track.swingOn ? track.swing[(n.beat * SBPB | 0) % SWING_POSITIONS] * SWING_RESOLUTION  : 0;
                                const noteOn = (bar * BPB + (n.beat + swingOffset)) / beatScale + startTime;
                                nextUpdateTime = Math.min(((noteOn - time) - API.startTimeOffset) * 1000, nextUpdateTime);
                            }
                        }
                    }
                }
            }
            if (nextUpdateTime < Infinity) {
                timeEventHdl = setTimeout(() => API.play(), nextUpdateTime);
            } else if(loop && !recorder?.recording) {
				const endTime = (looping.end * BPB) / beatScale + startTime;
				timeEventHdl = setTimeout(() => {
						API.loopResetTracks();
                        const [bar, beat] = [looping.start, 0];
                        firstNoteTime = startTime = atx.currentTime - (looping.start * BPB) / beatScale;
                        startTime;
						API.play()
					},
					((endTime - time)) * 1000);
			} else {
                const endTime = ((API.length ) * BPB) / beatScale + startTime;
                timeEventHdl = setTimeout(() => API.stop(),((endTime - time)) * 1000 + (recorder?.recording ? 100: 500));
            }
        },
        stepSample() {
            if (!stepSampling) {
                if (API.playing) { API.stop() }
                if (!API.playing) {
                    stepSampling = true;
                    API.playing = true;
                    WavRender.createBuf(maxBarCount / barScale, 2, 48000);
                    stepper.reset();
                    setTimeout(stepper.render, 1);
                }
            } else {
                stepSampling = false;
                API.stop();
            }
        },
        getWavRender() { return WavRender; }
    }
    Object.assign(API, Events(API));
    synth.addEvent("channelsReset", API.channelsReset);
    synth.addEvent("instrumentUpdate", API.instrumentUpdate);
    updateSpeed();
    return API;
}
export {Sequencer, NoteEvent};