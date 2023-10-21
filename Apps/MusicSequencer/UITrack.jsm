function UITrack(commands, Buttons, sequencer, piano) {
    const trackGrp = "trackGroup";
    const envelopeGroup = "envGroup";
	const noteColOffsets = sequencer.NoteColOffSets;
	const trackSelects = [];
	const MAX_TRACKS = 8;
    var /*activeIdx,*/ silent = false, removeTrackBtn, mergeTracksBtn, mouse, keyboard, cmdSet, id;
	const merger = {
		waiting: false,
		setup: true,
		hdl: null,
		trackIdx: -1,
	};
    const volSprites = [0,1,2,3, 4,5,6,7, 8,9,10,11, 12, 13];
    const panSprites = [0,1,2,3, 4,5,6,7, 8,9,10,11, 12, 13, 14];
    const colSprites = [0,1,2,3, 4,5,6,7, 8,9,10,11, 12];
    const swingSprites = [64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75];
    function onColWheel(e, mouse) {
	}
    function onVolWheel(e, mouse) {
        const el = e.target;
        const ta = sequencer.tracks[el.commandId - commands.mainTrackVol0];
        ta.vol += mouse.wheel > 0 ? 0.05 : -0.05;
        ta.vol = ta.vol < 0 ? 0 : ta.vol > 1 ? 1 : ta.vol;
        el.API.setSprite(Math.min(ta.vol * volSprites.length | 0, volSprites.length - 1));
        el.API.setHelp("Track volume: " + ta.vol.toFixed(2));
        onMouseOver(e);
        mouse.wheel = 0;
    }
    function onPanWheel(e, mouse) {
        const el = e.target;
        const ta = sequencer.tracks[el.commandId - commands.mainTrackPan0];
        ta.pan += mouse.wheel > 0 ? 0.05 : -0.05;
        ta.pan = ta.pan < 0 ? 0 : ta.pan > 1 ? 1 : ta.pan;
        el.API.setSprite(Math.min(ta.pan * panSprites.length | 0, panSprites.length - 1));
        el.API.setHelp("Pan " + ((ta.pan === 0.5) ? "center" : (ta.pan < 0.5) ? "right: " + (-(ta.pan * 2 - 1)).toFixed(2) : "left: " + (ta.pan * 2 - 1).toFixed(2)));
        onMouseOver(e);
        mouse.wheel = 0;
    }
	function onMergeUp(e) {
		if (e.target.commandId) {
			if (e.target.commandId >= commands.mainTrack0 && e.target.commandId <= commands.mainTrack7) {
				const idx = e.target.commandId - commands.mainTrack0;
				sequencer.mergeTracks(sequencer.tracks[merger.trackIdx], sequencer.tracks[idx]);
			}
		}
		API.updateTrackSelector();
		mouse.releaseCapture(id);
		merger.waiting = false;
	}
    function onTrackChange(event) {
        if (event.data.type === "active" || event.data.type === "mute" || event.data.type === "color" || event.data.type === "channel") {
            API.update();
        }
    }
    function envelopeClicked(idx, left, right) {
        var t = sequencer.activeTrack;
        if (!t)  { return }
        t.setEnvelope(idx);
    }
    function swingClicked(idx, left, right) {
        var t = sequencer.tracks[idx];
        if (!t)  { return }
        if (left && t.swingOn) {
            t.setSwingIdx(t.swingIdx + 1);
        } else if (right){
            t.setSwing(!t.swingOn);
        } 
    }    
    function trackClicked(idx, left, right) {
        var ts = sequencer.tracks, i = 0;
		while (i < ts.length) {
			const t = ts[i];
			if (i === idx) {
				if (left) { t.setActive(!t.active) }
				if (right) { t.setMute(!t.mute) }
			}
			i++;
		}
    }
    /*function onMouseOut() {

    }*/
    function onMouseOver(e) {
        if (mouse.captured === id || mouse.captured === 0) {
            const t = sequencer.tracks[e.target.API._trackIdx];
            if (t) {
                if (t.mute) {
                     cmdSet.commons.system.updateSynthLog(0, "Track: " + (e.target.API._trackIdx + 1) + " Muted");
                } else if (t.active) {
                     cmdSet.commons.system.updateSynthLog(0, "Track: " + (e.target.API._trackIdx + 1) + " Vol: " + t.vol.toFixed(2) + 
                            (" Pan " + ((t.pan === 0.5) ? "center" : (t.pan < 0.5) ? "right: " + (-(t.pan * 2 - 1)).toFixed(2) : "left: " + (t.pan * 2 - 1).toFixed(2))));
                    
                } else {
                    cmdSet.commons.system.updateSynthLog(0, "");
                }
            }
        }
    }    
    
    
    
    const API = {
        create(container, commandSets) {
            cmdSet = commandSets;
            mouse = commandSets.mouse;
            keyboard = commandSets.mouse.keyboard;
			id = mouse.getId();
            var X = 0, Y = 0;
			const px = 32, vx = 20;
			const sx = 44;
            const gx = sx + 12
			var py = 0;
            const buttons = [
				{type: "subContain", pxScale: 1, x: 360, y: 222, id: "TrackSelectPanel"},
                {x: X, 		y: Y, command: commands.addTrack,		 type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Add new track", sprite: 32 },
                {x: X += 3,	y: Y, command: commands.removeTrack, 	 type: "buttonNew",  	size: 24, sizeName: "icon24", help: "Remove track", sprite: 33 },
                {x: X += 3,	y: Y, command: commands.mergeTracks, 	 type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Merge two tracks", sprite: 46 },
                //{x: X += 3,	y: Y, command: commands.trackNoteVolDown,type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Decrease selected note volume", sprite: 12 * 4 + 2},
                //{x: X += 3,	y: Y, command: commands.trackNoteVolUp,  type: "buttonNew", 	size: 24, sizeName: "icon24", help: "Increase selected note volume", sprite: 12 * 4},
			];
			const buttonsB = [
				{type: "subContain", pxScale: 1, x: 390, y: 60, id: "TrackSelectPanel"},
                {x: X =0, y: Y = 0,  	command: commands.mainTrack0 , type: "button", size: 16, group: trackGrp, help: "Track 1", sprite: 8,   hidden: true, pxScale: 10, onMouseOver },
                {x: vx  , y: py, 		command: commands.mainTrackVol0 , type: "button", size: 8, group: trackGrp, help: "Volume Track 1 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton", onMouseOver},
                {x: px  , y: py, 		command: commands.mainTrackPan0 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 1 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow0 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing0 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2, 	command: commands.mainTrack1 , type: "button", size: 16, group: trackGrp, help: "Track 2", sprite: 9,   hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol1 , type: "button", size: 8, group: trackGrp, help: "Volume Track 2 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton", onMouseOver },
                {x: px , y: py, 		command: commands.mainTrackPan1 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 2 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow1 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing1 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2, 	command: commands.mainTrack2 , type: "button", size: 16, group: trackGrp, help: "Track 3", sprite: 10,  hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol2 , type: "button", size: 8, group: trackGrp, help: "Volume Track 3 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton", onMouseOver },
                {x: px , y: py, 		command: commands.mainTrackPan2 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 3 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow2 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing2 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2, 	command: commands.mainTrack3 , type: "button", size: 16, group: trackGrp, help: "Track 4", sprite: 11,  hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol3 , type: "button", size: 8, group: trackGrp, help: "Volume Track 4 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton", onMouseOver },
                {x: px , y: py, 		command: commands.mainTrackPan3 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 4 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow3 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing3 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2, 	command: commands.mainTrack4 , type: "button", size: 16, group: trackGrp, help: "Track 5", sprite: 12,  hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol4 , type: "button", size: 8, group: trackGrp, help: "Volume Track 5 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton" , onMouseOver},
                {x: px , y: py, 		command: commands.mainTrackPan4 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 5 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow4 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing4 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2, 	command: commands.mainTrack5 , type: "button", size: 16, group: trackGrp, help: "Track 6", sprite: 13,  hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol5 , type: "button", size: 8, group: trackGrp, help: "Volume Track 6 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton" , onMouseOver},
                {x: px , y: py, 		command: commands.mainTrackPan5 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 6 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow5 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing5 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2,   	command: commands.mainTrack6 , type: "button", size: 16, group: trackGrp, help: "Track 7", sprite: 14,  hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol6 , type: "button", size: 8, group: trackGrp, help: "Volume Track 7 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton" , onMouseOver},
                {x: px , y: py,        	command: commands.mainTrackPan6 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 7 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow6 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing6 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
                
                {x: X  , y: Y += 2,   	command: commands.mainTrack7 , type: "button", size: 16, group: trackGrp, help: "Track 8", sprite: 15,  hidden: true, pxScale: 10, onMouseOver },
                {x: vx , y: py += 20, 	command: commands.mainTrackVol7 , type: "button", size: 8, group: trackGrp, help: "Volume Track 8 Mouse wheel to change", sprite: 0, sprites: volSprites,  hidden: true, pxScale: 1, onWheel: onVolWheel, cssClass: "volumeButton" , onMouseOver},
                {x: px , y: py , 	 	command: commands.mainTrackPan7 , type: "buttonNew", size: 8, sizeName: "iconPan", group: trackGrp, help: "Sterio pan 8 Mouse wheel to change", sprite: 0, sprites: panSprites,  hidden: true, pxScale: 1, onWheel: onPanWheel, cssClass: "volumeButton", onMouseOver},
                {x: sx  , y: py, 		command: commands.mainTrackShow7 , type: "buttonNew", size: 8, sizeName: "iconsChannelShow", group: trackGrp, help: "Hide show track notes", sprite: 0, sprites: colSprites,  hidden: true, pxScale: 1, onWheel: onColWheel, onMouseOver},
                {x: gx  , y: py, 		command: commands.mainTrackSwing7 , type: "buttonNew", size: 16, group: trackGrp, help: "Swing type\n[RIGHT] toggle on off", sprite: 0, sprites: swingSprites,  hidden: true, pxScale: 1, onMouseOver},
            ];
			Buttons.add(container, buttons);
			Buttons.add(container, buttonsB);
           
            const createEnvolopeRenderer = (envolope) =>  (ctx, w, h) => {
                var x = 0;
                const ww = w - 2;
                const hh = h - 2;
                ctx.fillStyle = "#FFF";
                ctx.beginPath();
                var h2, h1 = (1 - envolope.level(x / ww)) * hh | 0;
                while (x < ww) {
                    
                    x++;
                    h2 = (1 - envolope.level(x / ww)) * hh | 0;
                    if (h2 > h1 + 1) {
                        ctx.rect(x, h1 + 1, 1, h2 - h1);
                    } else if (h2 < h1 - 1) {
                        ctx.rect(x, h2 + 1, 1, h1 - h2);
                    } else {
                        ctx.rect(x, h1 + 1, 1, 1);
                    }
                    h1 = h2;
                }
                ctx.fill();
            }
            Buttons.add(container, [
				{type: "subContain", pxScale: 1, x: 486, y: 40, id: "TrackEnvelopePanel"},
                ...commandSets.commons.synth.envelopes.map((e, i) => {
                    return {    
                        command: commands.trackEnvelopeA + i,
                        x: 35 * i, y: 0, w: 32, h: 12,
                        type: "buttonRendered", group: trackGrp, help: "Click to select envolope for current track", sprite: 0, group: envelopeGroup, disable: true, pxScale: 1,
                        draw: createEnvolopeRenderer(e), 
                    };
                })
            ]);
                /*{x: 0 ,     y: 0, w: 32, h: 12, command: commands.trackEnvelopeA , type: "buttonRendered", draw: createEnvolopeRenderer(), group: trackGrp, help: "", sprite: 0, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 0 ,     y: 0, command: commands.trackEnvelopeA , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 0, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35,     y: 0, command: commands.trackEnvelopeB , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 1, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 2, y: 0, command: commands.trackEnvelopeC , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 2, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 3, y: 0, command: commands.trackEnvelopeD , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 3, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 4, y: 0, command: commands.trackEnvelopeE , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 4, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 5, y: 0, command: commands.trackEnvelopeF , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 5, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 6, y: 0, command: commands.trackEnvelopeG , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 6, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 7, y: 0, command: commands.trackEnvelopeH , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 7, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 8, y: 0, command: commands.trackEnvelopeI , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 8, group: envelopeGroup, disable: true, pxScale: 1},
                {x: 35 * 9, y: 0, command: commands.trackEnvelopeJ , type: "buttonNew", sizeName: "icon3216", group: trackGrp, help: "", sprite: 9, group: envelopeGroup, disable: true, pxScale: 1},
            ]);*/
            commandSets.registerSet(commands.TRACK , commands.TRACK_END, API);
            removeTrackBtn = Buttons.byCmd.get(commands.removeTrack);
            mergeTracksBtn = Buttons.byCmd.get(commands.mergeTracks);
			var i = 0;
			while (i < MAX_TRACKS) {
				trackSelects.push(Buttons.byCmd.get(commands.mainTrack0 + i++));
			}
        },
        ready() {
            keyboard.addKeyCommand("1", commands.mainTrack0, "default");
            keyboard.addKeyCommand("2", commands.mainTrack1, "default");
            keyboard.addKeyCommand("3", commands.mainTrack2, "default");
            keyboard.addKeyCommand("4", commands.mainTrack3, "default");
            keyboard.addKeyCommand("5", commands.mainTrack4, "default");
            keyboard.addKeyCommand("6", commands.mainTrack5, "default");
            keyboard.addKeyCommand("7", commands.mainTrack6, "default");
            keyboard.addKeyCommand("8", commands.mainTrack7, "default");
            keyboard.addKeyCommand(" ", commands.mainPlayNote, "default");
            keyboard.addKeyCommand(" _Ctrl", commands.mainPlayPos, "default");
            keyboard.addKeyCommand(" _Shift", commands.mainPlayChord, "default");
            keyboard.addKeyCommand("s", commands.mainKeyboardKeyC, "default");
            keyboard.addKeyCommand("e", commands.mainKeyboardKeyCs,"default");
            keyboard.addKeyCommand("d", commands.mainKeyboardKeyD, "default");
            keyboard.addKeyCommand("r", commands.mainKeyboardKeyDs,"default");
            keyboard.addKeyCommand("f", commands.mainKeyboardKeyE, "default");
            keyboard.addKeyCommand("g", commands.mainKeyboardKeyF, "default");
            keyboard.addKeyCommand("y", commands.mainKeyboardKeyFs,"default");
            keyboard.addKeyCommand("h", commands.mainKeyboardKeyG, "default");
            keyboard.addKeyCommand("u", commands.mainKeyboardKeyGs,"default");
            keyboard.addKeyCommand("j", commands.mainKeyboardKeyA, "default");
            keyboard.addKeyCommand("i", commands.mainKeyboardKeyAs,"default");
            keyboard.addKeyCommand("k", commands.mainKeyboardKeyB, "default");
            keyboard.addKeyCommand("l", commands.mainKeyboardKeyC1, "default");
            keyboard.addKeyCommand("S_Shift", commands.mainKeyboardAddKeyC, "default");
            keyboard.addKeyCommand("E_Shift", commands.mainKeyboardAddKeyCs, "default");
            keyboard.addKeyCommand("D_Shift", commands.mainKeyboardAddKeyD, "default");
            keyboard.addKeyCommand("R_Shift", commands.mainKeyboardAddKeyDs, "default");
            keyboard.addKeyCommand("F_Shift", commands.mainKeyboardAddKeyE, "default");
            keyboard.addKeyCommand("G_Shift", commands.mainKeyboardAddKeyF, "default");
            keyboard.addKeyCommand("Y_Shift", commands.mainKeyboardAddKeyFs, "default");
            keyboard.addKeyCommand("H_Shift", commands.mainKeyboardAddKeyG, "default");
            keyboard.addKeyCommand("U_Shift", commands.mainKeyboardAddKeyGs, "default");
            keyboard.addKeyCommand("J_Shift", commands.mainKeyboardAddKeyA, "default");
            keyboard.addKeyCommand("I_Shift", commands.mainKeyboardAddKeyAs, "default");
            keyboard.addKeyCommand("K_Shift", commands.mainKeyboardAddKeyB, "default");
            keyboard.addKeyCommand("L_Shift", commands.mainKeyboardAddKeyC1, "default");
            sequencer.addEvent("deserializeStart", () => silent = true);
            sequencer.addEvent("addedTrack", API.update);
			sequencer.addEvent("removedTrack", API.update);
            sequencer.addEvent("deserialize", () => {silent = false; API.update()});
            sequencer.addEvent("trackChange", onTrackChange);
            sequencer.addEvent("trackEnvelope", API.updateEnvelope);
			API.firstUpdate();
			API.update();
        },
        commands: {
            [commands.addTrack](cmd, left, right) { right ? sequencer.copyTrack() : sequencer.addTrack("s1") },
            [commands.removeTrack](cmd, left, right) { sequencer.removeTrack() },
            [commands.mergeTracks](cmd, left, right) {
				if(mouse.captured === 0) {
					if (mouse.requestCapture(id, null, null, onMergeUp)) {
						merger.waiting = true;
						merger.setup = true;
						merger.trackIdx = sequencer.activeTrack.idx;
						merger.text = "Click to merge with track " + sequencer.activeTrack.idx + " '" + sequencer.activeTrack.channelName + "'";
						API.updateTrackSelector();
					}
				}
            },
            /*[commands.trackNoteVolDown](cmd, left, right) {
                if (piano.selection.selected) {
                    piano.selection.eachOnce(n => {
                        if(n.vol > 0.1) { n.vol -= 0.1; }
                        else { n.vol = 0; }
                        console.log(n.vol);
                    });
                    
                }
                
            },
            [commands.trackNoteVolUp](cmd, left, right) {
                if (piano.selection.selected) {
                    piano.selection.eachOnce(n => {
                        if(n.vol < 0.9) { n.vol += 0.1; }
                        else { n.vol = 1; }
                        console.log(n.vol);
                    });
                    
                }
                
            },*/
            [commands.mainPlayNote](cmd, left, right) {
                piano.playNote();
                return true;
            },
			[commands.mainPlayChord](cmd, left, right) {
                piano.playChord();
                return true;
            },
            [commands.mainPlayPos](cmd, left, right) {
                piano.playPos();
                return true;
            }
        },
        commandRange(cmd, left, right, mouse) {
            if (cmd >= commands.mainKeyboardKeyC && cmd <= commands.mainKeyboardKeyC1) {
                if (keyboard.downCount === 1) {
                    piano.playKeyboardPos(cmd - commands.mainKeyboardKeyC);
                }
                return true;
            } else if (cmd >= commands.mainKeyboardAddKeyC && cmd <= commands.mainKeyboardAddKeyC1) {
                if (keyboard.downCount === 1) {
                    piano.addKeyboardPos(cmd - commands.mainKeyboardAddKeyC);
                }
                return true;
            } else if (cmd >= commands.mainTrackSwing0 && cmd <= commands.mainTrackSwing10) {
                swingClicked(cmd - commands.mainTrackSwing0, left, right);
            } else if (cmd >= commands.mainTrack0 && cmd <= commands.mainTrack10) {
                if (left) { sequencer.setActiveTrack(cmd - commands.mainTrack0) }
                else if (right) { sequencer.muteTrack(cmd - commands.mainTrack0) }
            } else if (cmd >= commands.mainTrackVol0 && cmd <= commands.mainTrackVol10) {
                trackClicked(cmd - commands.mainTrackVol0, left, right);
		    } else if (cmd >= commands.mainTrackShow0 && cmd <= commands.mainTrackShow10) {
				sequencer.showTrack(cmd - commands.mainTrackShow0);
            } else if (cmd >= commands.trackEnvelopeA && cmd <= commands.trackEnvelope_END) {
                envelopeClicked(cmd - commands.trackEnvelopeA, left, right);
                return true;
            }
        },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right) === true) { return } }
            else { if (API.commandRange(cmd, left, right) === true) { return } }
            API.update();
        },
        updateEnvelope() {
            const t = sequencer.activeTrack;
            if (t) {
                Buttons.Groups.enable(envelopeGroup, true);
                Buttons.Groups.radio(envelopeGroup, t.envelopeIdx + commands.trackEnvelopeA, true);
            } else {
                Buttons.Groups.enable(envelopeGroup, false);
                Buttons.Groups.radio(envelopeGroup, -1, true)
            }
        },
		updateTrackSelector(on = true) {
			clearTimeout(merger.hdl);
			var i = 0;
            for (const t of sequencer.tracks) {
                const btn = trackSelects[i].element;
				if (merger.trackIdx !== i) {
					if(merger.setup) {
						btn.style.cursor = mouse.getCustomCursorStyle("pointer_track_select");
						btn.API.setHelp(btn.title + " " + merger.text);
					}
					if (!merger.waiting) {
						btn.style.cursor = "pointer";
					}
					on && merger.waiting ? btn.classList.add("selectable") : btn.classList.remove("selectable");
				}
				i++;
			}
			merger.setup = false;
			if (merger.waiting) {
				merger.hdl = setTimeout(API.updateTrackSelector, 250, !on);
			} else {
				while (i < trackSelects.length) {
					const btn = trackSelects[i].element;
					btn.classList.remove("selectable");
					i++;
				}
			}
		},
        firstUpdate() {
            var i = 0;
            while (i < MAX_TRACKS) {
                trackSelects[i].element.API._trackIdx = i;;
                Buttons.byCmd.get(commands.mainTrackVol0 + i).element.API._trackIdx = i;
                Buttons.byCmd.get(commands.mainTrackPan0 + i).element.API._trackIdx = i;
                Buttons.byCmd.get(commands.mainTrackShow0 + i).element.API._trackIdx = i;
                Buttons.byCmd.get(commands.mainTrackSwing0 + i).element.API._trackIdx = i;
                i++;
            }
        },            
        update() {
            if (silent) { return }
            var i = 0;
            var hasActive = 0;
            const volSteps = volSprites.length;
            const panSteps = panSprites.length;
            for (const t of sequencer.tracks) {
                const cmdId = commands.mainTrack0 + i;
                const btn = trackSelects[i];
                btn.element.API.show();
               
                !merger.waiting && btn.element.API.setHelp("Track " + (i + 1) + " '" + t.channelName + "'");
                const vol = Buttons.byCmd.get(commands.mainTrackVol0 + i).element;
                const pan = Buttons.byCmd.get(commands.mainTrackPan0 + i).element;
                const show = Buttons.byCmd.get(commands.mainTrackShow0 + i).element;
                const swing = Buttons.byCmd.get(commands.mainTrackSwing0 + i).element;

                vol.API.show();
                pan.API.show();
                show.API.show();
                swing.API.show();
                vol.API.setHelp("Track volume: " + t.vol.toFixed(2));
                pan.API.setHelp("Pan " + ((t.pan === 0.5) ? "center" : (t.pan < 0.5) ? "right: " + (-(t.pan * 2 - 1)).toFixed(2) : "left: " + (t.pan * 2 - 1).toFixed(2)));
                
                if (!t.swingOn) { 
                    swing.API.setChecked(false);
                    swing.API.setSprite(0) 
                } else { 
                    swing.API.setChecked(true);
                    swing.API.setSprite(t.swingIdx + 1) 
                }
				vol.API.setSprite(Math.min(t.vol * volSteps | 0, volSteps - 1));
				pan.API.setSprite(Math.min(t.pan * panSteps | 0, panSteps - 1));
				t.show || t.active ? show.API.setSprite(t.noteColorIdx) : show.API.setSprite(12);
                Buttons.Groups.check(trackGrp, cmdId, !t.mute);
                Buttons.Groups.check(trackGrp, cmdId, t.active, "active");
                t.active && (hasActive++);
                i++;
            }
            while(i < MAX_TRACKS) {
                Buttons.byCmd.get(commands.mainTrackShow0 + i).element.API.hide();
                Buttons.byCmd.get(commands.mainTrackVol0 + i).element.API.hide();
                Buttons.byCmd.get(commands.mainTrackPan0 + i).element.API.hide();
                Buttons.byCmd.get(commands.mainTrackSwing0 + i).element.API.hide();
                trackSelects[i].element.API.hide();
                i++;
            }
            removeTrackBtn.element.API.enable(hasActive);
            mergeTracksBtn.element.API.enable(hasActive && sequencer.tracks.length > 1);
            API.updateEnvelope();
            /*if (sequencer.tracks.length) {
                Buttons.byCmd.get(commands.trackNoteVolDown).element.API.enable();
                Buttons.byCmd.get(commands.trackNoteVolUp).element.API.enable();
            } else {
                Buttons.byCmd.get(commands.trackNoteVolDown).element.API.disable();
                Buttons.byCmd.get(commands.trackNoteVolUp).element.API.disable();
            }*/
            
        },
    };
    return API;
}
export {UITrack};