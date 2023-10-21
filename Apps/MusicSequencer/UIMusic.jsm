

/*
E  F  F# G  G# A |  |  |  |  |  |
B  C  C# D  D# E |  |  |  |  |  |
G  G# A  A# B  C |  |  |  |  |  |
D  D# E  F  F# G |  |  |  |  |  |
A  A# B  C  C# D |  |  |  |  |  |
E  F  F# G  G# A |  |  |  |  |  |


A  -     |oo222o|


guitar.strings
*/
import {NOTE_IDX, guitar} from "./music.jsm";
import {NoteEvent} from "./sequencer.jsm";

function UIMusic(commands, Buttons, sequencer, piano) {
	var mouse, keyboard, cmdSets, music, scaleBtn, keyBtn, chordBtn, nameInput;
	const keyGrp = "keyGroup";
	const scaleGrp = "scaleGroup";
	const chordGrp = "scaleGroup";
	var currentScale = "major";
	var currentKey = "A";
	var currentChord = "major";
	
	function transformKeyName(name) { return name.replace("s", " Sharp") }
	function transformScaleName(name) { return name[0].toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1") }
    


    const API = {
        create(container, commandSets) {
			mouse = commandSets.mouse;
            keyboard = commandSets.mouse.keyboard;
            cmdSets = commandSets;
			music = cmdSets.commons.music;
            const buttons = [
				{type: "subContain", pxScale: 1, x: 4, y: 51, id: "MusicPannel"},
				{x: 0, y: 0, command: commands.musicName , type: "textInput", group: "musicName", value: sequencer.sequenceName, sizeW: 124, sizeH: 18, help: "Name the current sequence\nThe name will be used when saving",  mouse, keyboard, pxScale: 1},
				{x: 0, y: 22, command: commands.musicScaleFirst  , type: "selection", group: scaleGrp,	sizeW: 128, sizeH: 18, items: Object.keys(music.NamedScales), help: "Select the scale type",  mouse, keyboard, pxScale: 1, nameTransform: transformScaleName},
				{x: 0, y: 44, command: commands.musicKeyFirst    , type: "selection", group: keyGrp,  	sizeW: 128, sizeH: 18, items: [...music.noteNames].reverse(), help: "Select the scale",  mouse, keyboard, pxScale: 1, nameTransform: transformKeyName},
				{x: 0, y: 66, command: commands.musicChordsFirst , type: "selection", group: chordGrp,  	sizeW: 128, sizeH: 18, items: Object.keys(music.chords), help: "Select the type of auto chord\n[Z] or [A] to select next prev",  mouse, keyboard, pxScale: 1},

            ];
            Buttons.add(container, buttons);
			scaleBtn = Buttons.byCmd.get(commands.musicScaleFirst);
			keyBtn = Buttons.byCmd.get(commands.musicKeyFirst);
			chordBtn = Buttons.byCmd.get(commands.musicChordsFirst);
			nameInput = Buttons.byCmd.get(commands.musicName);
            commandSets.registerSet(commands.MUSIC , commands.MUSIC_END, API);
            keyboard.addKeyCommand("a", commands.musicPrevChordType, "default");
			keyboard.addKeyCommand("z", commands.musicNextChordType, "default");
        },
        ready() {
			sequencer.addEvent("deserialize", () => {
				API.scale = sequencer.scale;
				API.key = sequencer.key;
				API.update();
			});
			sequencer.addEvent("scaleChanged", () => {
				API.scale = sequencer.scale;
				API.key = sequencer.key;
				API.update();
			});
			piano.musicChange({data:{key: currentKey, scale: currentScale}});
			piano.musicChange({data:{chord: currentChord}});
			scaleBtn.element.API.value = currentScale;
			keyBtn.element.API.value = currentKey;
			chordBtn.element.API.value = currentChord;			
			//API.update();
			
		},
        commands: {
            [commands.MUSIC](cmd, left, right) { selMode = selMode === cmd ? -1 : cmd },
            [commands.musicPrevChordType](cmd, left, right) { 
				chordBtn.element.API.index -= 1;
				currentChord = chordBtn.element.API.value;
				piano.musicChange({data:{chord: currentChord}});
			},
            [commands.musicNextChordType](cmd, left, right) { 
				chordBtn.element.API.index += 1;
				currentChord = chordBtn.element.API.value;
				piano.musicChange({data:{chord: currentChord}});
			},
			[commands.musicName](cmd) {

                sequencer.sequenceName = nameInput.element.API.value;
                return true;
			},

        },
        commandRange(cmd, left, right) { 
			if (cmd >= commands.musicScaleFirst && cmd <= commands.musicScaleLast) {
				API.scale = scaleBtn.element.API.value;
				return true;
				
			} else if (cmd >= commands.musicKeyFirst && cmd <= commands.musicKeyLast) {
				API.key = keyBtn.element.API.value;
				return true;
				
			} else if (cmd >= commands.musicChordsFirst && cmd <= commands.musicChordsLast) {
				currentChord = chordBtn.element.API.value;
				piano.musicChange({data:{chord: currentChord}});
			}
		},
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right) === true) { return } }
            else { if (API.commandRange(cmd, left, right) === true) { return } }
            API.update();
        },
		get scale() { return currentScale },
		get key() { return currentKey },
		set scale(name) {
			currentScale = name;
			piano.musicChange({data:{key: currentKey, scale: currentScale}});
		},
		set key(name) {
			currentKey = name;
			piano.musicChange({data:{key: currentKey, scale: currentScale}});
		},
        update() {
			scaleBtn.element.API.value = currentScale = piano.key.scaleName;
			keyBtn.element.API.value = currentKey = piano.key.keyName;
			chordBtn.element.API.value = currentChord;
			nameInput.element.value = sequencer.sequenceName;
            
        },
    };
    return API;
}
export {UIMusic};



