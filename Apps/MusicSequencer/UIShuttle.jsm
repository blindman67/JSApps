

function UIShuttle(commands, Buttons, sequencer, piano) {

    var playBtn, forwardBtn, backBtn, mouse, keyboard, cmdSets, id;

    const API = {
        create(container, commandSets) {
            mouse = commandSets.mouse;
            keyboard = commandSets.mouse.keyboard;
            cmdSets = commandSets;
			id = mouse.getId();			
            var X = 10, Y = 22;
            const buttons = [
                {x: 0.1,  y: Y + 0.35, command: commands.mainBackOne,     cssClass: "hiZ", type: "button", size: 48, help: "Back one bar\n[Left Arrow]\n[R Clk] back one sub beat\n[Ctrl][Left Arrow] or [Ctrl][L Clk] back to start", sprite: 0},
                {x: 6.1, y: Y + 0.35, command: commands.mainForwardOne,  cssClass: "hiZ", type: "button", size: 48, help: "Forward one bar\n[Right Arrow]\n[R Clk] forward one sub beat", sprite: 1},
                {x: 12.1, y: Y + 0.35, command: commands.mainPlay,        cssClass: "hiZ", type: "button", size: 48, sprite: 0, sprites: [2,3,4,5], help: "Play / Loop / Stop / Record\n\n[Left Btn] Play\n[Right Btn] Play loop\n[Enter] play/stop\n[Ctrl][r]Record/stop\n[Ctrl][Shift]Step sampler start"},

                {x: 168,  y: 200, command: commands.rollPosition  , type: "text", text: "Bar:", size: 81, sizeH: 20,  help: "", pxScale: 1},
                {x: 168,  y: 226, command: commands.rollMarkerPosition  , type: "text", cssClass: "blue", text: "Bar:", size: 81, sizeH: 20,  help: "Blue marked position", pxScale: 1},

            ];
            Buttons.add(container, buttons);
            commandSets.registerSet(commands.SHUTTLE , commands.SHUTTLE_END, API);
            playBtn = Buttons.byCmd.get(commands.mainPlay);
            backBtn = Buttons.byCmd.get(commands.mainBackOne);
            forwardBtn = Buttons.byCmd.get(commands.mainForwardOne);
			backBtn.element._firstRepeat = 250;
			backBtn.element._repeats = 100;
			backBtn.element._repeatMask = 5;
			forwardBtn.element._firstRepeat = 250;
			forwardBtn.element._repeats = 100;
			forwardBtn.element._repeatMask = 5;
            keyboard.addKeyCommand("ArrowLeft_Ctrl", commands.mainSeekStart, "default");
            keyboard.addKeyCommand("r_Ctrl", commands.mainRecord, "default");
            keyboard.addKeyCommand("ArrowLeft", commands.mainBackOne, "default");
            keyboard.addKeyCommand("ArrowRight", commands.mainForwardOne, "default");
            keyboard.addKeyCommand("Enter", commands.mainPlay, "default");
        },
        ready() {
            sequencer.addEvent("start", API.update)
            sequencer.addEvent("stop", API.update)
            sequencer.addEvent("addedTrack", API.update)

        },
        commands: {
            [commands.mainSeekStart](cmd, left, right) {
                piano.setPos(0, 0, true);
                return true
            },
            [commands.mainBackOne](cmd, left, right) {
				if (mouse.ctrl) { 
					return API.commands[commands.mainSeekStart](cmd, left, right);
				} else {
					if (!sequencer.recording) {
						if (sequencer.playing) { sequencer.stop() }
						else {
							if (right) {
								const [bar, beat] = piano.getPlayPos();
								const pos = bar * sequencer.BPB + beat - 1 / sequencer.SBPB;
								piano.setPos(pos / sequencer.BPB | 0, pos % sequencer.BPB, false);
							} else if(left) {
								const [bar, beat] = piano.getPos();
								bar <= 1 ? piano.setPos(0, 0, true) : piano.setPos(bar - 1, beat, true);
								
							}
						}
					}
				}
                return true;
            },
            [commands.mainForwardOne ](cmd, left, right) {
				if (!sequencer.recording) {
					if (sequencer.playing) { sequencer.stop() }
					if (right) {
						const [bar, beat] = piano.getPlayPos();
						const pos = bar * sequencer.BPB + beat + 1 / sequencer.SBPB;
						piano.setPos(pos / sequencer.BPB | 0, pos % sequencer.BPB, false);
					} else if (left) {
						const [bar, beat] = piano.getPos();
						piano.setPos(bar + 1, beat, true);
					}

				}
                return true
            },
            [commands.shuttleUpdate ](cmd, left, right) { return false },
            [commands.mainRecord](cmd, left, right) {
                if (sequencer.playing) {
                    sequencer.stop();
                } else {
                    piano.savePos();
                    sequencer.record();
                }
            },
            [commands.mainPlay ](cmd, left, right) {
                if (mouse.ctrl) {
                    if (mouse.shift) {
                        sequencer.stepSample();
                    } else {
                        return API.commands[commands.mainRecord](cmd, left, right);
                    }
                } else {
					if (right) {
						if (sequencer.playing) {
							if (!sequencer.looping) {
								sequencer.loop(true);
							} else {
								sequencer.loop(false);
							}
						} else {
							piano.savePos();
							sequencer.loop(true);
							sequencer.start();
						}
						
					} else {
						if (sequencer.playing) {
							sequencer.stop();
						} else {
							piano.savePos();
							sequencer.start();
						}
					}
                }
            },
        },
        commandRange(cmd, left, right) { return false },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right) === true) { return } }
            else { if (API.commandRange(cmd, left, right) === true) { return } }
            API.update();
        },
        update() {
			const rec = sequencer.recording;
			const play = sequencer.playing;
			const loop = sequencer.looping;
            if (sequencer.tracks.length === 0) {
                playBtn.element.API.disable();
                backBtn.element.API.disable();
                forwardBtn.element.API.disable();
            } else {
                playBtn.element.API.enable();
                !rec ? backBtn.element.API.enable() : backBtn.element.API.disable();
                !rec ? forwardBtn.element.API.enable() : forwardBtn.element.API.disable();
                playBtn.sprite = play ? (rec ? 2 : (loop ? 3 : 1)) : 0;
                !play && (playBtn.element.style.backgroundColor = null);
                playBtn.element.API.setSprite(playBtn.sprite);
            }
        },
    };
    return API;
}
export {UIShuttle};

