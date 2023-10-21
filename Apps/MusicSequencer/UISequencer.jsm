
function UISequencer(commands, Buttons, sequencer) {
    var prevTime, tempoBtn, seqOptimiseTrackBtn, seqUpdateScaleKeyBtn;
    const timeGrp = "timeSignature";
    function onTempoWheel(e, mouse) {
        sequencer.BPM += mouse.wheel > 0 ? 1 : -1;
        mouse.wheel = 0;
    }
    const API = {
        create(container, commandSets) {
            var X = 0, Y = 0;
            const buttons = [
                {type: "subContain", pxScale: 1, x: 141, y: 51, id: "SequencerPanel"},
                {x: X     , y: Y,      command: commands.seqTime22,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 2/2", sprite: 9},
                {x: X += 4, y: Y,      command: commands.seqTime32,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 3/2", sprite: 0},
                {x: X += 4, y: Y,      command: commands.seqTime42,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 4/2", sprite: 1},
                {x: X += 4, y: Y,      command: commands.seqTime62,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 6/2", sprite: 4},
                {x: X += 4, y: Y,      command: commands.seqTime82,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 8/2", sprite: 5},
                {x: X = 0 , y: Y += 4, command: commands.seqTime23,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 2/3", sprite: 8},
                {x: X += 4, y: Y,      command: commands.seqTime33,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 3/3", sprite: 12},
                {x: X += 4, y: Y,      command: commands.seqTime43,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 4/3", sprite: 13},
                {x: X += 4, y: Y,      command: commands.seqTime63,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 6/3", sprite: 16},
                {x: X += 4, y: Y,      command: commands.seqTime83,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 8/3", sprite: 17},
                {x: X = 0 , y: Y += 4, command: commands.seqTime24,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 2/4", sprite: 10},
                {x: X += 4, y: Y,      command: commands.seqTime34,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 3/4", sprite: 14},
                {x: X += 4, y: Y,      command: commands.seqTime44,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 4/4", sprite: 15},
                {x: X += 4, y: Y,      command: commands.seqTime64,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 6/4", sprite: 18},
                {x: X += 4, y: Y,      command: commands.seqTime84,  	   type: "buttonNew", size: 32, sizeName: "icon32", group: timeGrp, help: "Set time to 8/4", sprite: 19},
                {x: 0,   y: 114,  	   command: commands.seqTempoDown,     type: "button", size: 16, group: timeGrp, help: "Decrease tempo\n{CTRL] click to snap to frame rate (60fps)", sprite: 1, pxScale: 1},
                {x: 19,  y: 112, 	   command: commands.seqTempo,         type: "text",   text: "120", size: 66, sizeH: 18,  help: "", pxScale: 1, onWheel: onTempoWheel},
                {x: 88,  y: 114, 	   command: commands.seqTempoUp,       type: "button", size: 16, group: timeGrp, help: "Increase tempo\n{CTRL] click to snap to frame rate (60fps)", sprite: 0, pxScale: 1},
                {x: 108, y: 114, 	   command: commands.seqOptimiseTrack, type: "buttonNew", size: 16, sizeName: "icon16", group: "seqOptimiseTrack", help: "Optimise current track", sprite: 6, pxScale: 1},
                {x: 128, y: 114, 	   command: commands.seqUpdateScaleKey,type: "buttonNew", size: 16, sizeName: "icon16", group: "seqUpdateScaleKey", help: "Transforms all notes to new scale and key\nOnly if possible", sprite: 6, pxScale: 1},

            ];
            Buttons.add(container, buttons);
            commandSets.registerSet(commands.SEQUENCER , commands.SEQUENCER_END, API);
			seqOptimiseTrackBtn = Buttons.byCmd.get(commands.seqOptimiseTrack);
			seqUpdateScaleKeyBtn = Buttons.byCmd.get(commands.seqUpdateScaleKey);
        },
        ready() {
            tempoBtn = Buttons.byCmd.get(commands.seqTempo);
            sequencer.addEvent("timeSignature", API.update);
			sequencer.addEvent("trackChange", API.update);
        },
        commands: {
            [commands.seqTempoDown](cmd, left, right, ctrl) {
				ctrl ?
					sequencer.BPMFramed = sequencer.BPM - 1 / sequencer.BPB :
					sequencer.BPM -= 1 / sequencer.BPB;
                return true;
            },
            [commands.seqTempoUp](cmd, left, right, ctrl) {
				ctrl ?
					sequencer.BPMFramed = sequencer.BPM +1 / sequencer.BPB :
					sequencer.BPM += 1 / sequencer.BPB;
                return true;
            },
            [commands.seqTime22](cmd, left, right) {
                sequencer.timeSignature = "2/2";
                return true;
            },
            [commands.seqTime32](cmd, left, right) {
                sequencer.timeSignature = "3/2";
                return true;
            },
            [commands.seqTime42](cmd, left, right) {
                sequencer.timeSignature ="4/2";
                return true;
            },
            [commands.seqTime62](cmd, left, right) {
                sequencer.timeSignature = "6/2";
                return true;
            },
            [commands.seqTime82](cmd, left, right) {
                sequencer.timeSignature ="8/2";
                return true;
            },
            [commands.seqTime23](cmd, left, right) {
                sequencer.timeSignature = "2/3";
                return true;
            },
            [commands.seqTime33](cmd, left, right) {
                sequencer.timeSignature = "3/3";
                return true;
            },
            [commands.seqTime43](cmd, left, right) {
                sequencer.timeSignature ="4/3";
                return true;
            },
            [commands.seqTime63](cmd, left, right) {
                sequencer.timeSignature = "6/3";
                return true;
            },
            [commands.seqTime83](cmd, left, right) {
                sequencer.timeSignature ="8/3";
                return true;
            },
            [commands.seqTime24](cmd, left, right) {
                sequencer.timeSignature = "2/4";
                return true;
            },
            [commands.seqTime34](cmd, left, right) {
                sequencer.timeSignature = "3/4";
                return true;
            },
            [commands.seqTime44](cmd, left, right) {
                sequencer.timeSignature ="4/4";
                return true;
            },
            [commands.seqTime64](cmd, left, right) {
                sequencer.timeSignature = "6/4";
                return true;
            },
            [commands.seqTime84](cmd, left, right) {
                sequencer.timeSignature ="8/4";
                return true;
            },
            [commands.seqOptimiseTrack](cmd, left, right) {
                const at = sequencer.activeTrack
				at && sequencer.optimiseTrack(at);
                return true;
            },
            [commands.seqUpdateScaleKey](cmd, left, right) {
				sequencer.transpose();
                return true;
            },			
        },
        commandRange(cmd, left, right) { return false },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            const ctrl = mouse ? mouse.ctrl : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right, ctrl) === true) { return } }
            else { if (API.commandRange(cmd, left, right) === true) { return } }
            API.update();
        },
        update() {
            const currentTime = commands["seqTime" + sequencer.SBPB + sequencer.BPB];
            if (currentTime !== prevTime) {
                prevTime = currentTime;
                Buttons.Groups.radio(timeGrp, currentTime, true);
            }
            tempoBtn.element.textContent = Math.round(sequencer.BPM * sequencer.BPB);
			sequencer.activeTrack ? 
				seqOptimiseTrackBtn.element.API.enable() :
				seqOptimiseTrackBtn.element.API.disable();
			
        },
    };
    return API;
}
export {UISequencer};

