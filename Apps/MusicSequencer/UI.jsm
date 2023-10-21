import {Settings} from "./Settings.jsm";
import {Render} from "./Render.jsm";
import {StartAudio} from "./Synth.jsm";
import {Sequencer, NoteEvent} from "./Sequencer.jsm";
import {PianoRoll} from "./PianoRoll.jsm";
import {ScrollBar, SCROLL_BAR_WIDTH} from "./ScrollBar.jsm";
import {commands, commandSets} from "./commands.jsm";
import {Buttons} from "./Buttons.jsm";
import {Pad, ScreenBox, Box} from "./Boxes.jsm";
import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {Keyboard, MouseKeyboard} from "./MouseKeyboard.jsm";
import {createCanvas} from "./createCanvas.jsm";
import {createControls} from "./Controls.jsm";
import {UIView} from "./UIView.jsm";
import {UIMusic} from "./UIMusic.jsm";
import {UISelecting} from "./UISelecting.jsm";
import {UIShuttle} from "./UIShuttle.jsm";
import {UITrack} from "./UITrack.jsm";
import {UISynth} from "./UISynth.jsm";
import {UIEdit} from "./UIEdit.jsm";
import {UIPatterns} from "./UIPatterns.jsm";
import {UISequencer} from "./UISequencer.jsm";
import {UISystem} from "./UISystem.jsm";
const mouse = MouseKeyboard(true);
mouse.listenForMeta(mouse.keyboard, true);
mouse.keyboard.commandSets = mouse.commandSets = commandSets;
commandSets.mouse = mouse;
var piano, mainBox, roll, scrBox, rollNotePos, rollBarPos, rollCanvas, sequencer, synth, controls;
var debugCan
//$$(document.body,debugCan = $("canvas", {className: "boxed", width: 1224, height: 128, style: {top: "0px", right: "0px", left: (innerWidth - 1224) + "px", pointerEvents: "none"}}));
//debugCan.ctx = debugCan.getContext("2d");
const render = Render();
render.task = () => {
    if (sequencer.isDirty()) {
        piano.drawSeqTrack();
        sequencer.clean(render.frame);
    }
    piano.draw(rollCanvas);
    rollNotePos.scrollBar.draw();
    rollBarPos.scrollBar.draw();
}





const UI = {
    resize() {},
    start(commons) {
        Settings.init(commons.APPNAME);
        commons.settings = Settings;
        commons.commands = commands;
        commons.commandSets = commandSets;
        commandSets.commons = commons;
        commons.render = render;
        synth = StartAudio();
        //synth.debugCan = debugCan;
		
        scrBox = ScreenBox();
        scrBox.onUpdate = UI.resize;
        mainBox 		= Box(scrBox, Pad(0, 0, 0, 0), 0, 0, 100, 100);
        controls 	= Box(mainBox, Pad(0, 0, 0, 0), 0, 0, 100, 100, undefined, 260);
        controls.element = $("div", {className: "boxed"});
        roll 		= Box(mainBox, Pad(SCROLL_BAR_WIDTH + 2, 260, 0, SCROLL_BAR_WIDTH), 0, 0, 100, 100);
        rollNotePos 	= Box(mainBox, Pad(0, 260, 0, SCROLL_BAR_WIDTH), 0, 0, SCROLL_BAR_WIDTH, 100, SCROLL_BAR_WIDTH);
        rollNotePos.element = createCanvas(SCROLL_BAR_WIDTH, 100, "boxed", false, {alpha: false, desynchronized: true});
        rollNotePos.scrollBar = ScrollBar(rollNotePos.element.ctx, mouse);
        rollBarPos 	= Box(mainBox, Pad(SCROLL_BAR_WIDTH, 0, 0, 0), 0, undefined, 100, SCROLL_BAR_WIDTH, undefined, SCROLL_BAR_WIDTH);
        rollBarPos.element = createCanvas(100, 111, "boxed", false, {alpha: false, desynchronized: true});
        rollBarPos.scrollBar = ScrollBar(rollBarPos.element.ctx, mouse, -1);
        rollCanvas = createCanvas(100, 100, "boxed");
        sequencer = Sequencer(synth, synth.atx, commons);
        piano = PianoRoll(rollCanvas.ctx, sequencer, mouse, synth, commons);
        commons.piano = piano;
        commons.sequencer = sequencer;
        commons.synth = synth;
        piano.barScrollBar = rollBarPos.scrollBar;
        piano.barScrollBar.onInput = piano.barPosChanged;
        piano.noteScrollBar = rollNotePos.scrollBar;
        piano.noteScrollBar.onInput = piano.notePosChanged;
        roll.onUpdate = (box) => {
            box.apply(rollCanvas);
            piano.resized();
        };
        createControls(controls, commandSets);
        sequencer.noteRender = piano;



        commandSets.addUI(UIEdit,      controls, Buttons);
        commandSets.addUI(UITrack,     controls, Buttons, sequencer, piano);
        commandSets.addUI(UIShuttle,   controls, Buttons, sequencer, piano);
        commandSets.addUI(UISelecting, controls, Buttons);
        commandSets.addUI(UIView,      controls, Buttons, piano);
        sequencer.musicState = commandSets.addUI(UIMusic,     controls, Buttons, sequencer, piano);
        commandSets.addUI(UISynth,     controls, Buttons, sequencer, synth);
        commandSets.addUI(UIPatterns,  controls, Buttons, sequencer, synth, piano);
        commandSets.addUI(UISequencer, controls, Buttons, sequencer);
        commons.system = commandSets.addUI(UISystem,    controls, Buttons, sequencer, synth, piano);
        commandSets.addCmdHandler(piano.create);

        commons.pianoRollPosition = Buttons.byCmd.get(commands.rollPosition);
        commons.pianoRollMarkerPosition = Buttons.byCmd.get(commands.rollMarkerPosition);
        commons.currentNoteDetails = Buttons.byCmd.get(commands.currentNoteText);
        commons.playButton = Buttons.byCmd.get(commands.mainPlay);
        commons.Buttons = Buttons;

        $$(content, rollNotePos.element, rollBarPos.element, rollCanvas, controls.element);
        scrBox.resize();
        render.start();
        commandSets.ready();
        commandSets.issueCommand(commands.shuttleUpdate);

        sequencer.timeSignature = "4/4";
        commons.settings.update();

    },
}
export {UI};