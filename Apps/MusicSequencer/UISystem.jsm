import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {saveJSON, loadJSON, DropManager} from "./FileIO.jsm";
import {MIDILoader} from "./MIDILoader.jsm";
import {NOTE_IDX, guitar} from "./music.jsm";
import {NoteEvent} from "./sequencer.jsm";
function UISystem(commands, Buttons, sequencer, synth, piano) {
    const DM = new DropManager(document.body, fileDropped, ["json","mid","midi","wav","mp3","ogg"]);
    var mouse, id, keyboard, cmdSets, helpDisplayed = false, helpFloater;
    var dropId = 10;
    const fileTypes = {
        music(pack) {
            pack.music.sounds && synth.deserializeSounds(pack.music.sounds);
            synth.deserializeSetup(pack.music.synth);
            sequencer.deserialize(pack.music.sequence);
            Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
        },
        sequence(pack) {
            sequencer.deserialize(pack.sequence);
            Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
        },
        sounds(pack) {
            synth.deserialize(pack.sounds);
            Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
        },
        CMDSequence(pack) {
            commandLine(pack.cmds);
            Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
        }
    };
    function fileDropped(file) {
        if (file.mimeType === "wav" || file.mimeType === "mp3" || file.mimeType === "ogg") {
            
             
            const filename = "https://localhost/Downloads/" + file.name;
            //synth.loadSoundWave("Dropped_" + dropId, 17, filename, true);
            synth.addSoundWave(filename, true);
            log.sys("Added: '" + filename + "' to  'Dropped_Wavs'");
            

            
        } else if (file.mimeType === "midi" || file.mimeType === "mid") {
            Buttons.byCmd.get(commands.sysLoad).element.classList.add("highlight");
            const filename = "https://localhost/Downloads/" + file.name;
			const midi = MIDILoader();
			midi.load(filename)
				.then(() => {
			        Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
            		console.log("MIDI loaded");
					sequencer.interpMidi(midi);
					console.log(midi.midi);
					synth.infoElement.textContent = file.name.replace(/_/g," ");
				})
				.catch(() => {
			        Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
					Buttons.byCmd.get(commands.sysLoad).element.style.backgroundColor = "red";
					synth.infoElement.textContent = "Error loading " + file.name;
            		console.log("MIDI load error")
					setTimeout(() => {
						Buttons.byCmd.get(commands.sysLoad).element.style.backgroundColor = null;
					}, 2000);
				});
		} else  if (file.mimeType === "json") {
            //const filename = "http://localhost/canvasTemplate/Apps/MusicSequencer/sequences/" + file.name;
            Buttons.byCmd.get(commands.sysLoad).element.classList.add("highlight");
            const filename = "https://localhost/Downloads/" + file.name;
            loadJSON(filename, pack => {
                    if (pack.info) {
                        if (pack.info.app.includes("GrooverMusic")) {
                            if (fileTypes[pack.info.type]) {
                                setTimeout(() => fileTypes[pack.info.type](pack), 200);
                            } else {
                                throw new error("Unknown content type: '" + pack.info.type + "'");
                            }
                        } else {
                            throw new error("Unknown application content");
                        }
                    } else {
                        sequencer.deserialize(pack); // DEV needs to load older format JSONs
                        Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
                    }
                }, error => {
                    Buttons.byCmd.get(commands.sysLoad).element.classList.remove("highlight");
                    console.log(error);
                });
        }
    }
    var moduleLoaded;
    function CloseModule() {
        if (moduleLoaded) {
            log.sys("Module: " + moduleLoaded.name + " destroided");
            delete moduleLoaded.API;
            moduleLoaded = undefined;
        }
    }
    async function RunModule(moduleName) {
        if (moduleLoaded?.name === moduleName) { return; }
        if (moduleLoaded !== undefined) { moduleLoaded.API.destroy(); } 

        const fmod = await import('./Modules/FloatingModule.jsm');
        const mod = await import('./Modules/' + moduleName + '.jsm');
        const mAPI = mod[moduleName](cmdSets.commons);

        moduleLoaded = {
            name: moduleName,
            API: fmod.FloatingModule(cmdSets.commons, moduleName, mAPI),
            
        };
        moduleLoaded.API.create();
        moduleLoaded.API.update();
        log.sys("Module: " + moduleLoaded.name + " created");  
    }
    function commandLine(cmds) {
        const error = (e) => { hasError = true; SystemLogPanel.children[0].textContent = e }
        var cBar = 0;
        var cBeat = 0;
        var hasError = false;
        var gCordTimes = [
            0 / 8, 8 / 8,
            1 / 8, 7 / 8,
            2 / 8, 6 / 8,
            3 / 8, 5 / 8,
            4 / 8, 4 / 8,
            5 / 8, 3 / 8,
            6 / 8, 2 / 8,
            7 / 8, 1 / 8
        ];
        const types = {
            "@"(str) {
                var pos = 0;
                var bar = "";
                var beat = "0";
                while (pos < str.length && str[pos] !== " " && str[pos] !== "#" && str[pos] !== "|" && str[pos] !== ":") {
                    bar += str[pos++];
                }
                cBar = Number(bar);
                if (str[pos] === ":") {
                    beat = "";
                    pos ++;
                    while (pos < str.length && str[pos] !== " " && str[pos] !== "#" && str[pos] !== "|" ) {
                        beat += str[pos++];
                    }
                }
                cBeat = Number(beat);
            },
            "["(str) {
            },
            "|"(str) {
                const active = sequencer.activeTrack;
                if (!active) { error("No track defined!!!"); return }
                const newNotes = [];
                var pos = 0;
                var i = 0;
                while (i < 6) {
                    if (str[pos + i] !== "x" && str[pos + i] !== ".") {
                        if (str[pos + i] === "o" || str[pos + i] === "0") { newNotes.push(guitar.strings[i][0]) }
                        else { newNotes.push(guitar.strings[i][Number(str[pos + i])]); }
                    } else {
                        newNotes.push(-1);
                    }
                    i += 1;
                }
                const nNotes = newNotes.map((n, i) => {
                    if (n > -1) {
                        return new NoteEvent(NOTE_IDX[n], 100, cBar, cBeat + gCordTimes[i * 2] , gCordTimes[i * 2 + 1], 0);
                    }
                }).filter(n => n !== undefined);;
                sequencer.setBar(Number(cBar))
                sequencer.addNotes(active.idx, ...nNotes);
                sequencer.clean();
            },
        };
        for (const cmdLine of cmds) {
            for (const cmdRaw of cmdLine.split(",")) {
                const cmd = cmdRaw.trim().slice(1);
                const cmdType = cmdRaw.trim()[0];
                console.log(cmdType + cmd);
                if (types[cmdType]) {
                    types[cmdType](cmd);
                }
                if (hasError) { return; }
            }
        }
    }
    var APPNAME = "";
    const storeCMDS = {
        hdl: undefined,
        currentIdx: 0,
        lines:[],
        next() {
            if(storeCMDS.lines.length) {
                if (storeCMDS.currentIdx >= storeCMDS.lines.length) {
                    storeCMDS.currentIdx = 0;
                } else {
                    storeCMDS.currentIdx += 1;
                }
                if (storeCMDS.currentIdx >= storeCMDS.lines.length) {
                    storeCMDS.currentIdx = 0;
                }
                return storeCMDS.lines[storeCMDS.currentIdx];
            }
        },
        prev() {
            if(storeCMDS.lines.length) {
                if (storeCMDS.lines.length <= storeCMDS.currentIdx) {
                    storeCMDS.currentIdx = storeCMDS.lines.length - 1;
                } else {
                    storeCMDS.currentIdx -= 1;
                }
                if (storeCMDS.currentIdx < 0) {
                    storeCMDS.currentIdx = storeCMDS.lines.length - 1;
                }
                return storeCMDS.lines[storeCMDS.currentIdx];
            }
        },
        add(line) {
            if (storeCMDS.lines.length === 0 || storeCMDS.lines[storeCMDS.lines.length - 1] !== line) {
                storeCMDS.lines.push(line);
                storeCMDS.hdl = setTimeout(storeCMDS.save_S, 1000);
                storeCMDS.currentIdx = storeCMDS.lines.length;
            } else {
                storeCMDS.currentIdx++;
            }
        },
        save_S() {
            clearTimeout(storeCMDS.hdl);
            storeCMDS.save();
        },
        save() {
            localStorage[APPNAME + "_CMDS"] = JSON.stringify({lines: storeCMDS.lines});
        },
        load() {
            const json = localStorage[APPNAME + "_CMDS"];
            if (json) {
                const len = storeCMDS.lines.length;
                storeCMDS.lines = JSON.parse(json).lines;
                if (len === 0) {
                    while (storeCMDS.lines.length > 20) { storeCMDS.lines.shift(); }
                    console.log("storeCMDS.lines.length: " + storeCMDS.lines.length);
                }
                storeCMDS.currentIdx = storeCMDS.lines.length;
            }
        },
    };
    const SynthCMDS = (()=> {
        const API = {
            clr(...args) { log.clear(); },
            Arpegiator(...args) { RunModule("Arpegiator"); },
            WavEdit(...args) { RunModule("WavEdit"); },
            Waves(...args) { RunModule("Waves"); },
                
            MODE1() {
                localStorage.synthInMode = "MODE1";
                log.sys("MODE1 set");
                log.sys("You must restart the app to MODE1 to take full efect");
            },
            MODE2() {
                localStorage.synthInMode = "MODE2";
                log.sys("MODE2 set");
                log.sys("You must restart the app to MODE2 to take full efect");
            },
            add(...args) {
                const all = synth.getInstruments();
                if (args.length === 0) {
                    log.line("=");
                    var prevStyle;
                    for (const name of Object.keys(all)) {
                        if (!synth.hasInstrument(name)) {
                            const style = synth.getInstrumentStyleStr(name);
                            if (prevStyle && prevStyle !== style) {
                                log.line(" ");
                            }
                            prevStyle = style;
                            log.infoBtn([name.replace(/_smp/g,""), "add "+ name, style]);
                        }
                    }
                    log.line("-");
                } else {
                    if (localStorage.synthInMode === "MODE2") {
                        if (all[args[0]]) {
                            if (synth.hasInstrument(args[0])) {
                                log.warn("Instrument '" + args[0] + "' already loaded");
                            } else {
                                if (synth.addSoundChannel(args[0])) {
                                    log.sys("Added instrument '" + args[0] + "' to synth.");
                                } else {
                                    log.warn("Synth could not add instrument '" + args[0] + "'.");
                                }
                                //synth.setInstrument(args[0]);
                                //synth.resetChannels();
                            }
                        } else {
                            if (args.length === 1) {
                                log.warn("No instrument name given");
                            } else {
                                log.warn("Could not locate instrument named '" + args[0] + "'");
                            }
                        }
                    } else {
                        log.warn("SYNTH not in MODE2. Must be in mode 2 to use advanced features");
                        log.info("MODE2");
                    }
                }
            },
            inst(...args) {
                const all = synth.getInstruments();
                if (args[0] === "all" || args.length === 0) {
                    log.line("=");
                    for (const name of Object.keys(all)) {
                        log.info("inst "+ name);
                    }
                    log.line("-");
                } else if (args[0] === "add") {
                    if (localStorage.synthInMode === "MODE2") {
                        if (all[args[1]]) {
                            log.line("=");
                            if (synth.hasInstrument(args[1])) {
                                log.warn("Instrument '" + args[1] + "' already loaded");
                            } else {
                                synth.setInstrument(args[1]);
                                synth.resetChannels();
                                log.sys("Added instrument '" + args[1] + "' to synth.");
                            }
                            log.line("-");
                        } else {
                            if (args.length === 1) {
                                log.warn("No instrument name given");
                            } else {
                                log.warn("Could not locate instrument named '" + args[1] + "'");
                            }
                        }
                    } else {
                        log.warn("SYNTH not in MODE2. Must be in mode 2 to use advanced features");
                        log.info("MODE2");
                    }
                } else if (all[args[0]]) {
                    log.line("=");
                    log.info("inst "+ all[args[0]]);
                    log.line("-");
                } else {
                    log.warn("Could not locate instrument named '" + args[0] + "'");
                }
            },
            "?"(...args) {
                if (args.length === 0) {
                    log.sys("List of CMDs");
                    for (const a of Object.keys(API)) {
                        log.info(a);
                    }
                    log.sys("For help on a CMD use ? cmdName");
                } else {
                    for (const a of args) {
                        if (API[a]) {
                            log("Help for '" + a + "'", ...API[a]["?"]);
                        } else {
                            log.sys("No help for '" + a + "' as its not a CMD");
                        }
                    }
                    log.sys("For list of CMD enter ?");
                }
            },
            addChord(...args) {
                if (args.length === 4) {
                   cmdSets.issueCommand(commands.prAddChord, {note: args[0], chord: args[1], bar: Number(args[2]), beat: Number(args[3])});
                } else if (args.length === 5) {
                    cmdSets.issueCommand(commands.prAddChord, {note: args[0], chord: args[1], bar: Number(args[2]), beat: Number(args[3]), length: Number(args[4])});
                } else {
                   log.info("? addChord");
                }
                
                
                
            },
            addNote(...args) {
                if (args.length === 3) {
                   cmdSets.issueCommand(commands.prAddNote, {note: args[0], bar: Number(args[1]), beat: Number(args[2])});
                } else if (args.length === 4) {
                    cmdSets.issueCommand(commands.prAddNote, {note: args[0], bar: Number(args[1]), beat: Number(args[2]), length: Number(args[3])});
                } else {
                   log.info("? addNote");
                }
                
            },
            select(...args) {
                if (args.length === 0 || (args.length === 1 && !args[0].includes(":")) || (args.length === 2 && (args[0] !== "-" || args[0] !== "+") && !args[1].includes(":"))) {
                    log.warn("Unknown  select command.");
                } else if (!sequencer.activeTrack) {
                    log.warn("No track selected!!!");
                } else {
                    var addToSelect = false;
                    var removeFromSelect = false;
                    if (args.length === 2) {
                        if (args[0] === "-") {
                            removeFromSelect = true;
                            args.shift();
                        } else if (args[0] === "+") {
                            addToSelect = true;
                            args.shift();
                        } else {
                            log.warn("Unknown select command.");
                            return;
                        }
                    }
                    var selType = "Selecting";
                    if (args[0][0] === "-") {
                        args[0] = args[0].slice(1);
                        removeFromSelect = true;
                        selType = "Removing";
                    } else if (args[0][0] === "+") {
                        args[0] = args[0].slice(1);
                        addToSelect = true;
                        selType = "Adding";
                    }
                    
                    const bb = args[0].split(":");
                    var bar = isNaN(bb[0]) || bb[0] === "" ? -1 : Number(bb[0]);
                    var beat = isNaN(bb[1]) || bb[1] === "" ? -1 : Number(bb[1]);
                    var len = bb.length < 2 || isNaN(bb[2]) || bb[2] === "" ? -1 : Number(bb[2]);
                    const t = piano.getTimeSignature();
                    if (sequencer.activeTrack) {
                        log.line("=");                       
                        if (!addToSelect && !removeFromSelect) {
                            piano.selection.clear();
                        }
                        if (bar === -1 && beat === -1 && len === -1) {
                            log.warn("Unknown position.");
                        } else if (bar >= 0 && beat >= 0) {
                            log.sys(selType + " any notes at bar:beat " + bar + ":" + beat );
                            log.line("-");                            
                            const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                            if (removeFromSelect) {
                                piano.selection.unselectNotes(bar, notes, true);
                            } else {
                                piano.selection.selectNotes(bar, notes, true);
                            }
                            for (const n of notes) {
                                log.sys(args[0] + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                            }
                        } else if (bar === -1 && beat === -1 && len >= 0) {
                            log.sys(selType + " all bars & beats notes of length: " + len);
                            log.line("-");
                            bar = 0;
                            const subBeatsPerBar = sequencer.BPB * sequencer.SBPB;
                            while (bar < sequencer.length) {
                                beat = 0;
                                while (beat < subBeatsPerBar) {                                
                                    const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                                    if (removeFromSelect) {
                                        piano.selection.unselectNotes(bar, notes, true);
                                    } else {
                                        piano.selection.selectNotes(bar, notes, true);
                                    }

                                     for (const n of notes) {
                                        log.sys(args[0] + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                    }        
                                    beat++;
                                }                                    
                                bar ++;
                            }                         
                        } else if (bar === -1 && beat >= 0) {
                            log.sys(selType + " all bars at beat: " + beat);
                            log.line("-");
                            bar = 0;
                            while (bar < sequencer.length) {
                                const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                                
                                if (removeFromSelect) {
                                    piano.selection.unselectNotes(bar, notes, true);
                                } else {
                                    piano.selection.selectNotes(bar, notes, true);
                                }
                                
                                 for (const n of notes) {
                                    log.sys(args[0] + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                }                               
                                bar ++;
                            }
                        } else if (bar >= 0 && beat === -1) {
                            log.sys(selType + " all beats at bar: " + bar);
                            log.line("-");
                            const subBeatsPerBar = sequencer.BPB * sequencer.SBPB;
                            beat = 0;
                            while (beat < subBeatsPerBar) {
                                const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                                if (removeFromSelect) {
                                    piano.selection.unselectNotes(bar, notes, true);
                                } else {
                                    piano.selection.selectNotes(bar, notes, true);
                                }
                                
                                if (notes.length) {
                                    for (const n of notes) {
                                        log.sys(bar + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                    }
                                } 
                                beat ++;
                            }                
                        }
                        log.line("-");  
                        piano.soil();
                        piano.draw();                       
                    }
                }
            },
            at(...args) {
                if (args.length === 0 || !args[0].includes(":")) {
                    log.warn("Unknown position.");
                } else {
                    const bb = args[0].split(":");
                    
                    var bar = isNaN(bb[0]) || bb[0] === "" ? -1 : Number(bb[0]);
                    var beat = isNaN(bb[1]) || bb[1] === "" ? -1 : Number(bb[1]);
                    var len = bb.length < 2 || isNaN(bb[2]) || bb[2] === "" ? -1 : Number(bb[2]);
                    
                    const t = piano.getTimeSignature();
                    if (sequencer.activeTrack) {
                        if (bar === -1 && beat === -1) {
                            log.warn("Unknown position.");
                            
                            
                        } else if (bar === -1 && beat === -1 && len >= 0) {
                            log.line("=");
                            log.sys("For all bars & beats notes of length: " + len);
                            bar = 0;
                            const subBeatsPerBar = sequencer.BPB * sequencer.SBPB;
                            while (bar < sequencer.length) {
                                beat = 0;
                                while (beat < subBeatsPerBar) {                                
                                    const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                                     for (const n of notes) {
                                        log.sys(args[0] + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                    }        
                                    beat++;
                                }                                    
                                bar ++;
                            }
                            log.line("-");   
                        } else if (bar >= 0 && beat >= 0) {
                            
                            const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                            if (notes.length) {
                                for (const n of notes) {
                                    log.sys(args[0] + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                }
                            } else {
                                //log.sys(args[0] + ":" + beat * t.subBeats + " empty");
                            }
                        } else if (bar === -1 && beat >= 0) {
                            log.line("=");
                            log.sys("For all bars. at beat: " + beat);
                            log.line("-");
                            bar = 0;
                            while (bar < sequencer.length) {
                                const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                                if (notes.length) {
                                    for (const n of notes) {
                                        log.sys(bar + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                    }
                                } else {
                                    //log.sys(bar + ":" + beat * t.subBeats + " empty");
                                }
                                bar ++;
                            }
                            log.line("-");
                            
                        } else if (bar >= 0 && beat === -1) {
                            log.line("=");
                            log.sys("For all beats at bar: " + bar);
                            log.line("-");
                            const subBeatsPerBar = sequencer.BPB * sequencer.SBPB;
                            beat = 0;
                            while (beat < subBeatsPerBar) {
                                const notes = sequencer.activeTrack.notesAt(bar, beat / t.subBeats, len);
                                if (notes.length) {
                                    for (const n of notes) {
                                        log.sys(bar + ":" + beat * t.subBeats + " " + n.note.name.padStart(3," ") + ":" + n.length * t.subBeats + " V:" + n.vol);
                                    }
                                } 
                                beat ++;
                            }
                            log.line("-");
                        }
                    }
                }
                
            },
            play(...args) {
                if (args.length > 1) {
                    if (args[0][0] === "[" || args[0] === "[") {
                        if (args[0][0] === "[") { args[0] = args[0].slice(1); }
                        else { args.shift(); }
                        const l = args.length - 1;
                        if (args[l] === "]") { args.pop(); }
                        else if (args[l][args[l].length -1] === "]") { args[l] = args[l].slice(0, -1); } 
                        cmdSets.issueCommand(commands.prPlayNote, {notes: args, now: true});
                        log.sys("play [" + args.join(" ") + "]");
                    } else {
                        cmdSets.issueCommand(commands.prPlayNote, {notes: args});
                        log.sys("play " + args);
                    }
                    
                } else {
                    cmdSets.issueCommand(commands.prPlayNote,{note: args[0]});
                    log.sys("play note: " + args[0]);
                }
            },
            setting(...args) {
                if (args.length === 0) {
                    log.line("=");
                    const d = cmdSets.commons.settings.description;
                    for (const [name, desc] of Object.entries(d)) {
                        log.info("setting " + name);
                    }
                    log.line("-");
                } else if (args.length === 1 || args.length === 2) {
                    const d = cmdSets.commons.settings.description[args[0]];
                    if (d !== undefined) {
                        log.info(args[0] + " = " + cmdSets.commons.settings.byName(args[0]));
                        if (args.length === 2) {
                            cmdSets.commons.settings.update(args[0], args[1]);
                            log.sys("Setting '" + args[0] + "'updated...");
                            log.info(args[0] + " = " + cmdSets.commons.settings.byName(args[0]));
                        }
                        log.sys("Description: " + d);                            
                            
                    } else {
                        log.warn("Unknown setting '" + args[0] + "'");
                    }
                    
                } else {
                    log.warn("Invalid settings command");
                }
            },
            swing(...args) {
                if (sequencer.activeTrack) {
                    const at = sequencer.activeTrack;
                    const BPB = sequencer.BPB;
                    const SBPB = sequencer.SBPB;
                    const nSteps = BPB * SBPB;                    
                    if (args.length === 0) {
                        log.line("=");
                        var i = 0;
                        while (i < nSteps) {
                            log("@" + (i / SBPB | 0) + ":" + (i % SBPB) + " = " + at.swing[i]);
                            i++;
                        }
                        log.line("-");
                    } else if (args.length === 1) {
                        if (args[0][0] === "@") {
                            const beat = Number(args[0][1]);
                            const pos  = Number(args[0][3]);
                            if (isNaN(beat) || isNaN(pos)) {
                                log.warning("Bad position value: '" + args[0]+ "' Example @1:2 is 2nd beat 3rd pos");
                            } else {
                                const swingIdx = beat * BPB + pos;
                                if (swingIdx >= 0 && swingIdx < nSteps) {
                                    log(args[0] + " = " + at.swing[beat * BPB + pos]);
                                } else {
                                    log.warning("Position out of range: '" + args[0]+ "'");
                                }
                            }
                        } else {
                            log.warn("Invalid swing command");
                        }
                    } else if (args.length > 1) {
                        if (args[0][0] === "@") {
                            const beat = Number(args[0][1]);
                            const pos  = Number(args[0][3]);
                            if (isNaN(beat) || isNaN(pos)) {
                                log.warning("Bad position value: '" + args[0]+ "' Example @1:2 is 2nd beat 3rd pos");
                            } else {
                                var swingIdx = beat * BPB + pos;
                                if (swingIdx >= 0 && swingIdx < nSteps) {
                                    log.line("=");
                                    var i = 1;
                                    while (i < args.length) {
                                        const ii = swingIdx + (i - 1);
                                        const nVal = isNaN(args[i]) ? 0 : Number(args[i]);
                                        if (ii < nSteps) {
                                            log("@" + (ii / SBPB | 0) + ":" + (ii % SBPB) + " = " + at.swing[ii] + " to " + (at.swing[ii] = nVal));
                                        }
                                        i++;
                                    }
                                    log.line("-");
                                } else {
                                    log.warning("Position out of range: '" + args[0]+ "'");
                                }
                            }
                        } else {
                            log.warn("Invalid swing command");
                        }
                        
                    } else {
                        log.warn("Invalid swing command");
                    }                
                } else {
                    log.warn("Note active track found");
                }
            },
        };
        API["@"] = API.at;
        API.sel = API.select;
        API.swing["?"] = ["'swing' shows swing offsets of current track\n'swing @1:2' shows swing for 2nd beat, 3rd pos\n'swing @0:1 -2 2 3' sets 3 swing offset from position 0:1 (1st beat 2nd pos)"];
        API.select["?"] = ["Alias for sel"];
        API.sel["?"] = ["'sel [- | +] bar:beat:len' select notes at bar beat and has length len\nOptional - remove from selection + add to selection, default clears selection befor selecting\n'sel bar:beat' select notes at bar beat\n'sel :beat' select notes at beat on all bars\n'sel :beat:len' select notes at beat on all bars with length len"];
        API.at["?"] = ["'At bar:beat' shows notes at bar and beat\n 'At :beat' shows notes at beat for all bars"];
        API["@"]["?"] = ["Alias for at"];
        API.Arpegiator["?"] = ["Module to play with arpeggios"];
        API.WavEdit["?"] = ["View and edit waveforms"];
        API.Waves["?"] = ["Utilities for wave renderer"];
        API.addChord["?"] = ["'addChord noteName chordType bar beat [len]` Adds notes of chord to current track at bar/beat and len. Len is optional \nExample addChord A2 maj 1 4 adds notes A2 Cs2 E2 bar 1 4th beat"];
        API.addNote["?"] = ["'addNote noteName bar beat [len]` Adds note to current track at bar/beat and len. Len is optional \nExample addNote C2 1 4 adds C2 bar 1 4th beat"];
        API.play["?"] = ["'play noteName` Plays note on current track. eg play B2\n'play A2 C2 E2' plays notes consecutively\n'play [A2 C2 E2]' play notes concurrently"];
        API.clr["?"] = ["Clears logs."];
        API.add["?"] = [ "`add` List all addable instruments by name..",  "`add name` adds named instrument"];
        API.inst["?"] = [
            "`inst [all]` List all instruments by name. all is optional.",
            "`inst name` logs details of named instrument",
            "`inst add name` adds named instrument to synth instrument list"
        ];
        API.setting["?"] = ["'setting' lists settings and value\n'setting name' show setting name\n'setting name value' sets setting name to value"];
        API.MODE2["?"] = ["Enter synth mode 2"];
        API.MODE1["?"] = ["Enter synth mode 1"];
        API["?"]["?"] = ["Shows help for CMDs in the log."];
        return API;
    })();
    
    
    
    var synthLogHasContent = false;
    var log;
    function Logger(btn) {
        const element = btn.element;
        var indentCount = 0;
        var col = "", dents =  "";
        var lastLog;
        var lastEl;
        const logClick = {commandId: commands.sysLogClick, title: "Left click to add to CMD input\n[RIGHT] click to execute" };
        function l(...args) { API.log(...args) };
        function dent() {
            indentCount += 1;
            dents = ("").padStart(indentCount * 4, " ");
        }
        function undent() {
            indentCount = Math.max(0, indentCount - 1);
            dents = ("").padStart(indentCount * 4, " ");
        }
        function addLine(data, props = {}) {
            if (data !== "" && lastLog !== undefined && dents + data === lastLog) {
                lastEl.textContent = "[" + ((++lastEl._count)+1) + "] " + lastLog;
            } else {
                var el;
                $$(element, el = $("div", {textContent: dents + data, className: "logLine " + col, ...props}));
                el.scrollIntoView();
                lastLog = dents + data;
                lastEl = el;
                el._count = 0;
            }
        }
        function addBtn(text, cmdText, style = "", props = {}) {
            lastLog = undefined;
            lastEl = undefined;
            var el;
            $$(element, el = $("span", {textContent: text, _cmdText: cmdText, className: "logBtn " + col + " " + style, ...props}));
            el.scrollIntoView();
            el._count = 0;

        }        
        function log(color, ...args) {
            col = color;
            for (const a of args) {
                if (a !== null && a !== undefined) {
                    if (typeof a === "object" && !Array.isArray(a)) {
                        addLine("Obj: {");
                        dent();
                        for (const [key, val] of Object.entries(a)) {
                            if (typeof val === "function") {
                                addLine(key + "()");
                            } else {
                                addLine(key + ": " + val);
                            }
                        }
                        undent();
                        addLine("}");
                    } else if (Array.isArray(a)) {
                        addLine("Arr: [");
                        dent();
                        for (const [key, val] of Object.entries(a)) {
                            addLine("[" + key + "]: " + val);
                        }
                        undent();
                        addLine("]");
                    } else {
                        addLine(a);
                    }
                }
            }
        }
        const API = {
            clear() {
                element.innerHTML = "";
                lastLog = undefined;
                lastEl = undefined;                
            },
            infoBtn(...args) {
                col = "blue";
                for (const a of args) {
                    addBtn(a[0], a[1], a[2], logClick);
                }
            },                
            info(...args) {
                col = "blue";
                for (const a of args) {
                    addLine(a, logClick);
                }
            },
            syslog(col,  ...args) { 
                for (var a of args) {
                    if (a !== "" && lastLog !== undefined  && a === lastLog) {
                        lastEl.textContent = "[" + (++lastEl._count) + "] " + lastLog;
                    } else {
                        a = a === "" ? " " : a;
                        lastLog = a;
                        var el;
                        $$(element, el = $("div", {textContent: dents + a , className: "logLine", style:{color: col}}));
                        el.scrollIntoView();                    
                        el._count = 0;
                        lastEl = el;
                    }
                }
            },
            error(...args) { log("red", ...args); },
            warn(...args) { log("yellow", ...args); },
            sys(...args) { log("white", ...args); },
            log(...args) { log(""     , ...args); },
            
            line(char) { API.sys(("").padStart(45, char)); }
        };
        return Object.assign(l, {...API});
    }
    function showHelp() {
		if (mouse.requestCapture(id)) {
			keyboard.saveMode();
			keyboard.mode = "help";
			helpFloater = Buttons.createFloating("Sequencer Help", 50,50, cmdSets.commons);
			Buttons.add(helpFloater.element, [
				{x: 0, y: 0, command: commands.sysCloseHelp,captureId: id,  type: "buttonNew", help: "Close help popup", posRef: "topRight", size: 24, sizeName: "icon24", sprite: 33}
			]);
			helpFloater.addInfo(...keyboard.getKeyDescription());
			helpDisplayed = true;
		}
	}
	const API = {
        create(container, commandSets) {
            mouse = commandSets.mouse;
			id = mouse.getId();
            keyboard = commandSets.mouse.keyboard;
            cmdSets = commandSets;
            APPNAME = cmdSets.commons.APPNAME;
            var X = 0, Y = 0;
            const buttonsA = [
                {type: "subContain", pxScale: 1, x: 5, y: 5, id: "SystemPanel"},
                {x: X,      y: Y, command: commands.sysSave, type: "button", size: 40, help: "Save sequence", sprite: 12},
                {x: X += 5, y: Y, command: commands.sysLoad, type: "button", size: 40, help: "Save sequence", sprite: 13},
                {x: X += 5, y: Y, command: commands.sysUndo, type: "button", size: 32, help: "Undo", sprite: 26, disable: true},
                {x: X += 4, y: Y, command: commands.sysRedo, type: "button", size: 32, help: "Redo", sprite: 27, disable: true},
			];
			const buttonsB = [
				{type: "subContain", pxScale: 1, x: 172, y: 5, id: "SystemLogPanel"},
                {x: 0, y: 0,      command: commands.sysStatus1,     type: "text", cssClass: "lineLog", text: "", size: 266, sizeH: 14,  help: "", pxScale: 1},
                {x: 0, y: 14,     command: commands.sysStatus2,     type: "text", cssClass: "lineLog", text: "", size: 266, sizeH: 14,  help: "", pxScale: 1},
                {x: 0, y: 14 * 2, command: commands.sysStatus3,     type: "text", cssClass: "lineLog", text: "", size: 266, sizeH: 14,  help: "", pxScale: 1},
            ];
			const buttonsC = [
				{type: "subContain", pxScale: 1, x: innerWidth - 320, y: 5, id: "SynthLogPanel"},
                {x: 0, y: 0,     command: commands.synthCMDLog, type: "text",   text: "", sizeW: 300, sizeH: 14 * 15,  help: "", cssClass: "logs", pxScale: 1, scrolling: true},
                {x: 0, y: 14 * 16, command: commands.synthCMD , keyCMDs: {up: commands.synthCMD_up, down: commands.synthCMD_down, focus: commands.synthCMD_focus}, blurOnEnter: false, type: "textCMDInput",  group: "synthCMD", value: "", sizeW: 300, sizeH: 18, help: "Enter synth cmds",  mouse, keyboard, pxScale: 1},
            ];
            Buttons.add(container, buttonsA);
            Buttons.add(container, buttonsB);
            Buttons.add(container, buttonsC);
            commandSets.registerSet(commands.SYSTEM , commands.SYSTEM_END, API);
            synth.infoElement = Buttons.byCmd.get(commands.sysStatus1).element;
        },
        synthCMD: undefined,
        synthCMDLog:  undefined,
        clearSynthLog() {
            if (synthLogHasContent) {
                synthLogHasContent = false;
                Buttons.byCmd.get(commands.sysStatus1).element.textContent = "";
                Buttons.byCmd.get(commands.sysStatus2).element.textContent = "";
                Buttons.byCmd.get(commands.sysStatus3).element.textContent = "";
            }
        },
        updateSynthLog(idx, message) {
            if (idx === 2) {
                Buttons.byCmd.get(commands.sysStatus3).element.textContent = message;
                synthLogHasContent = true;
            } else if (idx === 1) {
                Buttons.byCmd.get(commands.sysStatus2).element.textContent = message;
                synthLogHasContent = true;
            } else {
                Buttons.byCmd.get(commands.sysStatus1).element.textContent = message;
                synthLogHasContent = true;
            }
        },
        ready() {
            storeCMDS.load();
            keyboard.debug = commands.sysUpdate;
            sequencer.addEvent("updated", API.update);
            keyboard.addKeyCommand("Escape", commands.sysEscape, "default");
            keyboard.addKeyCommand("z_Ctrl", commands.sysUndo, "default");
            keyboard.addKeyCommand("y_Ctrl", commands.sysRedo, "default");
			keyboard.addKeyCommand("/", commands.sysHelp, "default");
			keyboard.addKeyCommand("/", commands.sysCloseHelp, "help");
            log = Logger(API.synthCMDLog = Buttons.byCmd.get(commands.synthCMDLog));
            if (localStorage.synthInMode === "MODE2") {
                synth.addLogger(log);
                log("Added logger to synth");
            }
            API.synthCMD = Buttons.byCmd.get(commands.synthCMD);
            API.synthCMD.element.addEventListener("keydown",e => { if (e.key === "Tab") { e.preventDefault() }});
        },
        commands: {
            [commands.sysModuleDestroy](cmd, left, right, e) {
                CloseModule();
                return true;
            },
            [commands.sysLog](cmd, left, right, e) {
                if (log) {
                    if (e.col) {
                        log.syslog(e.col, e.message);
                    } else {
                        log.sys(e.message);
                    }
                }
            },
            [commands.sysLogClick](cmd, left, right, e) {
                const textCMD = e.target._cmdText ? e.target._cmdText : e.target.textContent;
                if (left) {
                    API.synthCMD.element.value = textCMD;
                    API.synthCMD.element._focus();
                } else {
                    API.synthCMD.element.API.value = textCMD;
                }
            },
            [commands.synthCMD_up](cmd, left, right) {
                const c = storeCMDS.prev();
                if (c !== undefined) { API.synthCMD.element.value = c; }
            },
            [commands.synthCMD_down](cmd, left, right) {
                const c = storeCMDS.next();
                if (c !== undefined) { API.synthCMD.element.value = c; }
            },
            [commands.synthCMD_focus](cmd, left, right) {
                API.synthCMD.element.focus();
            },
            [commands.synthCMD](cmd, left, right) {
                var synthCMD = API.synthCMD.element.API.value.trim();
                if(synthCMD.length > 0) {
                    const sCMDs = synthCMD.split(" ").filter(str => str !== "");
                    API.synthCMD.element.value = "";
                    if (SynthCMDS[sCMDs[0]]) {
                        storeCMDS.add(synthCMD);
                        const sName = sCMDs.shift();
                        SynthCMDS[sName](...sCMDs);
                    } else {
                        log.warn("CMD error? Unknown CMD str '" + synthCMD + "'");
                    }
                }
            },
            [commands.sysSave](cmd, left, right) {
                if (mouse.ctrl) {
                    API.commands[commands.sysSaveLocal]();
                } else {
                    const sequenceName = sequencer.sequenceName + "_Seq_" + cmdSets.commons.getUID();
                    const sounds = {};
                    sequencer.tracks.forEach(t => { sounds[t.channelName] = synth.getSoundDescription(t.channelName) });
                    saveJSON({sounds, sequence: sequencer.serialize(), synth: synth.serializeSetup()}, sequenceName, "music", {});
                }
            },
            [commands.sysLoadLocal]() {
                const pack = JSON.parse(localStorage["MusicGrooverV1_seq"]);
                fileTypes[pack.info.type](pack);
            },
            [commands.sysSaveLocal]() {
                const sequenceName = "localStorage";
                saveJSON(sequencer.serialize(), sequenceName, "sequence", {});
            },
            [commands.sysLoad](cmd, left, right) {
                if (mouse.ctrl) {
                    API.commands[commands.sysLoadLocal]();
                }
            },
            [commands.sysCmdStr](cmd, left, right) {
            },
            [commands.sysUndo](cmd, left, right) {
                sequencer.undos.canUndo && sequencer.undo();
            },
            [commands.sysRedo](cmd, left, right) {
                sequencer.undos.canRedo && sequencer.redo();
            },
            [commands.sysUpdateSynth](cmd, left, right) {
                /*Buttons.byCmd.get(commands.sysStatus1).element.textContent = synth.status[0];
                Buttons.byCmd.get(commands.sysStatus2).element.textContent = synth.status[1];
                Buttons.byCmd.get(commands.sysStatus3).element.textContent = synth.status[2];*/
            },
            [commands.sysEscape](cmd, left, right) {
                sequencer.stop();
            },
            [commands.sysUpdate](cmd, left, right) {
                /*Buttons.byCmd.get(commands.sysStatus1).element.textContent = keyboard.status1;
                Buttons.byCmd.get(commands.sysStatus2).element.textContent = keyboard.status2;*/
            },
			[commands.sysCloseHelp](cmd, left, right) {
				if (helpDisplayed) {
					mouse.releaseCapture(id);
					keyboard.restoreMode();
					helpDisplayed = false;
					helpFloater.close();
					helpFloater = undefined;
				}
			},
			[commands.sysHelp](cmd, left, right) {
				if (helpDisplayed) {
					mouse.releaseCapture(id);
					keyboard.restoreMode();
					helpDisplayed = false;
					helpFloater.close();
					helpFloater = undefined;
				} else {
					showHelp();
				}
			},
        },
        commandRange(cmd, left, right) { return false },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right, event) === true) { return } }
            else { if (API.commandRange(cmd, left, right) === true) { return } }
            API.update();
        },
        update() {
            const canUndo = sequencer.undos.canUndo;
            const canRedo = sequencer.undos.canRedo;
            const uAPI = Buttons.byCmd.get(commands.sysUndo).element.API;
            const rAPI = Buttons.byCmd.get(commands.sysRedo).element.API;
            canRedo ? rAPI.enable() : rAPI.disable();
            canUndo ? uAPI.enable() : uAPI.disable();
        },
    };
    return API;
}
export {UISystem};