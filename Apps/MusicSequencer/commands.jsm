const commands = (() => {
    var i = 1000;
    return Object.freeze({

        KEY: i,
        mainKeyA:  i++,
        mainKeyAs: i++,
        mainKeyB:  i++,
        mainKeyC:  i++,
        mainKeyCs: i++,
        mainKeyD:  i++,
        mainKeyDs: i++,
        mainKeyE:  i++,
        mainKeyF:  i++,
        mainKeyFs: i++,
        mainKeyG:  i++,
        mainKeyGs: i++,
        editUpdate: i++,
        KEY_END: i - 1,

        TRACK: i,
        mainTrack0:  i++,
        mainTrack1:  i++,
        mainTrack2:  i++,
        mainTrack3:  i++,
        mainTrack4:  i++,
        mainTrack5:  i++,
        mainTrack6:  i++,
        mainTrack7:  i++,
        mainTrack8:  i++,
        mainTrack9:  i++,
        mainTrack10: i++,
        mainTrack11: i++,
        mainTrack12: i++,
        mainTrack13: i++,
        mainTrack14: i++,
        mainTrack15: i++,

        mainTrackVol0:  i++,
        mainTrackVol1:  i++,
        mainTrackVol2:  i++,
        mainTrackVol3:  i++,
        mainTrackVol4:  i++,
        mainTrackVol5:  i++,
        mainTrackVol6:  i++,
        mainTrackVol7:  i++,
        mainTrackVol8:  i++,
        mainTrackVol9:  i++,
        mainTrackVol10: i++,
        mainTrackVol11: i++,
        mainTrackVol12: i++,
        mainTrackVol13: i++,
        mainTrackVol14: i++,
        mainTrackVol15: i++,

        mainTrackPan0:  i++,
        mainTrackPan1:  i++,
        mainTrackPan2:  i++,
        mainTrackPan3:  i++,
        mainTrackPan4:  i++,
        mainTrackPan5:  i++,
        mainTrackPan6:  i++,
        mainTrackPan7:  i++,
        mainTrackPan8:  i++,
        mainTrackPan9:  i++,
        mainTrackPan10: i++,
        mainTrackPan11: i++,
        mainTrackPan12: i++,
        mainTrackPan13: i++,
        mainTrackPan14: i++,
        mainTrackPan15: i++,

        mainTrackShow0:  i++,
        mainTrackShow1:  i++,
        mainTrackShow2:  i++,
        mainTrackShow3:  i++,
        mainTrackShow4:  i++,
        mainTrackShow5:  i++,
        mainTrackShow6:  i++,
        mainTrackShow7:  i++,
        mainTrackShow8:  i++,
        mainTrackShow9:  i++,
        mainTrackShow10: i++,
        mainTrackShow11: i++,
        mainTrackShow12: i++,
        mainTrackShow13: i++,
        mainTrackShow14: i++,
        mainTrackShow15: i++,
        
        mainTrackSwing0:  i++,
        mainTrackSwing1:  i++,
        mainTrackSwing2:  i++,
        mainTrackSwing3:  i++,
        mainTrackSwing4:  i++,
        mainTrackSwing5:  i++,
        mainTrackSwing6:  i++,
        mainTrackSwing7:  i++,
        mainTrackSwing8:  i++,
        mainTrackSwing9:  i++,
        mainTrackSwing10: i++,
        mainTrackSwing11: i++,
        mainTrackSwing12: i++,
        mainTrackSwing13: i++,
        mainTrackSwing14: i++,
        mainTrackSwing15: i++,        

        trackEnvelopeA: i++,
        trackEnvelopeB: i++,
        trackEnvelopeC: i++,
        trackEnvelopeD: i++,
        trackEnvelopeE: i++,
        trackEnvelopeF: i++,
        trackEnvelopeG: i++,
        trackEnvelopeH: i++,
        trackEnvelopeI: i++,
        trackEnvelopeJ: i++,
        trackEnvelope_END: (i += 64, i - 1),

        addTrack: i++,
        removeTrack: i++,
		mergeTracks: i++,
        currentNoteText: i++,
        mainPlayNote: i++,
        mainPlayPos: i++,
        mainPlayChord: i++,
        mainKeyboardKeyC: i++,
        mainKeyboardKeyCs: i++,
        mainKeyboardKeyD: i++,
        mainKeyboardKeyDs: i++,
        mainKeyboardKeyE: i++,
        mainKeyboardKeyF: i++,
        mainKeyboardKeyFs: i++,
        mainKeyboardKeyG: i++,
        mainKeyboardKeyGs: i++,
        mainKeyboardKeyA: i++,
        mainKeyboardKeyAs: i++,
        mainKeyboardKeyB: i++,
        mainKeyboardKeyC1: i++,
		
        mainKeyboardAddKeyC: i++,
        mainKeyboardAddKeyCs: i++,
        mainKeyboardAddKeyD: i++,
        mainKeyboardAddKeyDs: i++,
        mainKeyboardAddKeyE: i++,
        mainKeyboardAddKeyF: i++,
        mainKeyboardAddKeyFs: i++,
        mainKeyboardAddKeyG: i++,
        mainKeyboardAddKeyGs: i++,
        mainKeyboardAddKeyA: i++,
        mainKeyboardAddKeyAs: i++,
        mainKeyboardAddKeyB: i++,
        mainKeyboardAddKeyC1: i++,
        
    

        trackUpdate: i++,

        TRACK_END: i - 1,

        SHUTTLE: i,
        mainPlay: i++,
        mainRecord: i++,
        mainStop: i++,
        mainBackOne: i++,
        mainForwardOne: i++,
        mainSeekStart: i++,
        mainSeekEnd: i++,
        shuttleUpdate: i++,
        rollPosition: i++,
        rollMarkerPosition: i++,  // does nothing ATM
        SHUTTLE_END: i - 1,

        SYNTH: i,
        synthCh0:  i++,
        synthChLast: i += 128,

        synthFilterA: i++,
        synthFilterB: i++,
        synthFilterC: i++,
        synthFilterD: i++,
        synthFilterE: i++,
        synthFilterF: i++,
        synthFilterG: i++,
        synthFilterH: i++,
        synthFilterI: i++,
        synthFilterJ: i++,
        synthFilterK: i++,
        synthFilterL: i++,
        synthFilterM: i++,
        synthFilterN: i++,

        synthChText: i++,
        synthUpdate: i++,
        synthVolume: i++,
        synthVolumeWet: i ++,


        SYNTH_END: i - 1,

        SELECT: i,
        selectOff:    i++,
        selectTrack:    i++,
        selectBars:    i++,
        selectNotes:    i++,
        selectKey:    i++,
        selectCopy:    i++,
        selectCut:    i++,
        selectPaste:    i++,
        selectShorten: i++,
        selectLengthen: i++,
        selectMoveBeatLeft: i++,
        selectMoveBeatRight: i++,
        selectMoveNoteUp: i++,
        selectMoveNoteDown: i++,        
        selectUpdate: i++,
        SELECT_END: i - 1,

        VIEW: i,
        zoomX1: i++,
        zoomX2: i++,
        zoomX3: i++,
        zoomX4: i++,
        zoomY1: i++,
        zoomY2: i++,
        zoomY3: i++,
        zoomY4: i++,
        zoomUpdate: i++,
		followPlayToggle: i++,
        VIEW_END: i - 1,

        PATTERNS: i,
        patCopy: i++,
        patPaste: i++,
		patSelAllNotes: i++,
        patBarCopy: i++,
        patBarPaste: i++,
        patBarCloneNew: i++,
        patBarClear: i++,
        deleteNotes: i++,
        deletePatterns: i++,
        // patDelete: i++, ???
        patBarNotesUp: i++,
        patBarNotesDown: i++,
        patBarNotesLeft: i++,
        patBarNotesRight: i++,
        patBarNotesVolDown: i++,
        patBarNotesVolUp: i++,
        patShowNoteVolume: i++,
        patToggleSwingMode: i++,
        patBarNotesLengthShorter: i++,
        patBarNotesLengthLonger: i++,

        patRow1: i++,
        patRow2: i += 135,
        patRow3: i += 135,
        patRow4: i += 135,
        patRow5: i += 135,
        patRow6: i += 135,
        patRow7: i += 135,
        patRow8: i += 135,
        patRow9: i += 135,
        patRowsLast: i += 135,

        patNoteCol1: i++,
        patNoteCol2: i++,
        patNoteCol3: i++,
        patNoteCol4: i++,
        patNoteCol5: i++,
        patNoteCol6: i++,
        patNoteCol7: i++,
        patNoteCol8: i++,
        patNoteCol9: i++,
        patNoteCol10: i++,
        patNoteCol11: i++,
        patNoteCol12: i++,


        PATTERNS_END: i - 1,

        SEQUENCER: i,
        seqTime22: i++,
        seqTime32: i++,
        seqTime42: i++,
        seqTime62: i++,
        seqTime82: i++,
        seqTime23: i++,
        seqTime33: i++,
        seqTime43: i++,
        seqTime63: i++,
        seqTime83: i++,
        seqTime24: i++,
        seqTime34: i++,
        seqTime44: i++,
        seqTime64: i++,
        seqTime84: i++,
        seqTempoDown: i++,
        seqTempo: i++,
        seqTempoUp: i++,
		seqOptimiseTrack: i++,
		seqUpdateScaleKey: i++,
		__spare: i++, //not used
        SEQUENCER_END: i - 1,
		
		MUSIC: i++,
		musicScaleFirst: i++,
		musicScaleLast: i+= 100,
		musicKeyFirst: ++i,
		musicKeyLast: i+= 12,
		musicChordsFirst: ++i,
		musicChordsLast: i+= 120,
		musicShowKey: (i++, i++),
		musicPrevChordType: i++,
		musicNextChordType: i++,
		musicName: i++,		
		MUSIC_END: i - 1,
        
        PIANO_ROLL: i++,
        prPlayNote: i++,
        prAddNote: i++,
        prAddChord: i++,
        
        PIANO_ROLL_END: i - 1,
        


        SYSTEM: i,
        sysEscape: i++,
        sysSave: i++,
        sysLoad: i++,
        sysLoadLocal: i++,
        sysSaveLocal: i++,
        sysUpdate: i++,
        sysUpdateSynth: i++,
        sysStatus1: i++,
        sysStatus2: i++,
        sysStatus3: i++,
		sysHelp: i++,
		sysCloseHelp: i++,
        sysUndo: i++,
        sysRedo: i++,
        sysCmdStr: i++,
        sysLogClick: i++,
        synthCMDLog: i++,
        synthCMD: i++,
        synthCMD_up: i++,
        synthCMD_down: i++,
        synthCMD_focus: i++,
        sysLog: i++,
        sysModule: i++,
        sysModuleDestroy: i++,
        SYSTEM_END: i - 1,
        
        CMD_TAIL: i + 1000,

    });
})();

const cmdById = new Map(Object.entries(commands).map(([name, id]) => [id, name]));
const commandSets = Object.assign([], {
    commandNameById(cmdId) {
        return cmdById.get(cmdId);
    },
    addCmdHandler(creates) {
        const handler = creates(commands);
        return handler;
        
    },
    addUI(type, container, Buttons, ...args) {
        const handler = type(commands, Buttons, ...args);
        handler.create(container?.element, commandSets);
        return handler;
    },
    dockCommands(handler) {
        const idx = commandSets.findIndex(set => set.handler === handler);
        if (idx > -1) {
            commandSets.splice(idx, 1);
        }
    },
    tailCommands(tailCmds, handler) {
        commandSets.push({start: commands.CMD_TAIL, end: tailCmds.CMD_END, handler});
        return tailCmds
    },
    registerSet(start, end, handler) {
        commandSets.push({start, end, handler});
    },
    ready() { for (const cS of commandSets) { cS.handler.ready?.() } },
    issueCommand(cmdId, event, mouse) {
        const cmdSet = commandSets.find(set => cmdId >= set.start && cmdId <= set.end);
        cmdSet?.handler?.command(cmdId, event, mouse);
        //if (cmdId !== commands.sysUpdate) { commandSets.issueCommand(commands.sysUpdate) }
    },
});

export {commands, commandSets};
