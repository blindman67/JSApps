
import {$, $$, $R} from "../../../src/DOM/geeQry.jsm";


function Waves(common) {
    
    const wavRender = common.sequencer.getWavRender();
    var i = common.commands.CMD_TAIL + 4;
    const cmds = {
        wave_render: i++,
        wave_play: i++,
        wave_play_loop: i++,
        wave_mixTracksDown: i++,
        wave_saveOnRender: i++,
        wave_normalize: i++,
        wave_compress: i++,
        wave_delaySterio: i++,
        wave_dryOnly: i++,

        CMD_END: i,
    };
    const FILTER_NAMES = Object.keys(wavRender.filters);
    const FILTER_COUNT = FILTER_NAMES.length;
    (()=>{
        var c = FILTER_COUNT;
        var idx = 1;
        while (c--) {
            const info = wavRender.filters[FILTER_NAMES[idx - 1]].info();
            cmds["wave_filter_onOff_" + idx] = i + 0;
            cmds["wave_filter_wetDry_" + idx] = i + 1;
            cmds["wave_filter_val1_" + idx] = i + 2;
            cmds["wave_filter_val2_" + idx] = i + 3;
            cmds["wave_filter_val3_" + idx] = i + 4;
            
            i += 6;
            idx ++;
        }
        cmds.CMD_END = i;
    })();
    const btns = {};
 	const id = common.commandSets.mouse.getId();
    const mouse = common.commandSets.mouse;    
    const keyboard = common.commandSets.mouse.keyboard;    
    const {commandSets, commands, Buttons, piano, sequencer, synth}  = common;
    const updateStack = [];
    var hdl, loopPlay = false;
    
    
    function toggleOption(name) {
        const bApi = btns[name].API; 
        bApi.setChecked(!bApi.checked); 
    }
    function getOption(name) {
        const bApi = btns[name].API; 
        bApi.setChecked(wavRender.options[name]);         
    }
    function setOption(name, text) {
        const bApi = btns[name].API;
        bApi.setText(text + " " + (bApi.checked ? "ON" : "OFF"));
        wavRender.options[name] = bApi.checked;    
    }        
    
    const API = {
        cmds() { return cmds; },
        create(container) {
            const group = "waves";
            const buttonsA = [
                {type: "subContain", pxScale: 1, x: 5, y: 5, id: "WavEdit", fitContent: false,  padX: 28, padY: 40},
                {x: 1, y: 22 + 50 + 24 * 1, command: cmds.wave_mixTracksDown, type: "text", text: "Mix down OFF",      sizeW: 188, sizeH: 18, help: "When selected render mixes all tracks down", pxScale: 1},
                {x: 1, y: 22 + 50 + 24 * 2, command: cmds.wave_saveOnRender,  type: "text", text: "Save render OFF",   sizeW: 188, sizeH: 18, help: "Save rendered result", pxScale: 1},
                {x: 1, y: 22 + 50 + 24 * 3, command: cmds.wave_normalize,     type: "text", text: "Normalize OFF",     sizeW: 188, sizeH: 18, help: "Normalizes track or stack when rendered", pxScale: 1},
                {x: 1, y: 22 + 50 + 24 * 4, command: cmds.wave_compress,      type: "text", text: "Compress OFF",      sizeW: 188, sizeH: 18,  help: "Compress stacked render", pxScale: 1},
                {x: 1, y: 22 + 50 + 24 * 5, command: cmds.wave_dryOnly,       type: "text", text: "Dry only OFF",      sizeW: 188, sizeH: 18,  help: "Output from process fillters off if dry only", pxScale: 1},
                {x: 1, y: 22 + 50 + 24 * 6, command: cmds.wave_delaySterio,   type: "text", text: "Delay pan OFF",     sizeW: 188, sizeH: 18, help: "Use delay pan", pxScale: 1},

                {x: 1, y: 22, command: cmds.wave_render,  cssClass: "hiZ", type: "button", size: 48, pxScale: 1, sprite: 2, sprites: [2,3,4,5], help: "Render sequencer tracks"},               
                {x: 51, y: 22, command: cmds.wave_play,   cssClass: "hiZ", type: "button", size: 48, pxScale: 1, sprite: 0, sprites: [2,3,4,5], help: "Play last rendered"},               
                {x: 101, y: 22, command: cmds.wave_play_loop,   cssClass: "hiZ", type: "button", size: 48, pxScale: 1, sprite: 4, sprites: [2,3,4,5,6], help: "Play loop last rendered"},               
			];
            
            (()=>{
                var xp = 200, xxp = 0, top = 32;
                var c = FILTER_COUNT;
                var idx = 1;
                while (c--) {
                    const info = wavRender.filters[FILTER_NAMES[idx - 1]].info();
                    buttonsA.push(
                        {x: xp, y: top, command: cmds["wave_filter_onOff_" + idx], type: "button", size: 12, pxScale: 1, sprite: 1, sprites: [4,0,1,2,3,5,6,7,8,10,11,12,13], help: "Turn " + info.name + " on/off"}, 
                        {x: xp, y: top + 16, command: cmds["wave_filter_wetDry_" + idx], type: "slide", value: 1, min: 0, max: 1, sizeW: 12, sizeH: 200 - 16, color: "#4C6", group: "filterSlide_" + idx, popupText: "Filter wet level", pxScale: 1, mouse, keyboard},                        
                    );   
                    xxp += 16;
                    if (info.prams.length >= 1) {
                        const p = info.prams[0];
                        buttonsA.push({x: xp + xxp, y: top,  command: cmds["wave_filter_val1_" + idx],   type: "slide", value: p.value, min: p.min, max: p.max, wheelStep: p.step, sizeW: 12, sizeH: 200, color: "#C64", group: "filterSlide_" + idx, popupText: p.name, pxScale: 1, mouse, keyboard});
                        xxp += 16;
                    }
                    if (info.prams.length >= 2) {
                        const p = info.prams[1];
                        buttonsA.push({x: xp + xxp, y: top,  command: cmds["wave_filter_val2_" + idx],   type: "slide", value: p.value, min: p.min, max: p.max, wheelStep: p.step, sizeW: 12, sizeH: 200, color: "#84A", group: "filterSlide_" + idx, popupText: p.name, pxScale: 1, mouse, keyboard});
                        xxp += 16;
                    }
                    if (info.prams.length >= 3) {
                        const p = info.prams[2];
                        buttonsA.push({x: xp + xxp, y: top,  command: cmds["wave_filter_val3_" + idx],   type: "slide", value: p.value, min: p.min, max: p.max, wheelStep: p.step, sizeW: 12, sizeH: 200, color: "#46A", group: "filterSlide_" + idx, popupText: p.name, pxScale: 1, mouse, keyboard});
                        xxp += 16;
                    }
                    idx ++;
                    xp += xxp + 8;
                    xxp = 0;
                }
            })();            
            
            
            Buttons.add(container, buttonsA);            
            btns.container = container;
            btns.render = Buttons.byCmd.get(cmds.wave_render).element; 
            btns.play = Buttons.byCmd.get(cmds.wave_play).element; 
            btns.playLoop = Buttons.byCmd.get(cmds.wave_play_loop).element; 
            
            btns.mixDown = Buttons.byCmd.get(cmds.wave_mixTracksDown).element;   
            btns.save = Buttons.byCmd.get(cmds.wave_saveOnRender).element;   
            btns.normalize = Buttons.byCmd.get(cmds.wave_normalize).element;   
            btns.compress = Buttons.byCmd.get(cmds.wave_compress).element;   
            btns.dryOnly = Buttons.byCmd.get(cmds.wave_dryOnly).element;   
            btns.delaySterio = Buttons.byCmd.get(cmds.wave_delaySterio).element;   
            getOption("mixDown");
            getOption("save");
            getOption("normalize");               
            getOption("compress");               
            getOption("dryOnly");               
            getOption("delaySterio");               
            
            
            
            (()=>{
                var c = FILTER_COUNT;
                var idx = 1;
                while (c--) {
                    const info = wavRender.filters[FILTER_NAMES[idx - 1]].info();
                    const channelFilter = wavRender.options.filters[0][FILTER_NAMES[idx - 1]];
                    const onOffBtn = Buttons.byCmd.get(cmds["wave_filter_onOff_" + idx]).element; 
                    const wetBtn = Buttons.byCmd.get(cmds["wave_filter_wetDry_" + idx]).element; 
                    const pram1Btn = info.prams.length >= 1 ? Buttons.byCmd.get(cmds["wave_filter_val1_" + idx]).element : undefined;
                    const pram2Btn = info.prams.length >= 2 ? Buttons.byCmd.get(cmds["wave_filter_val2_" + idx]).element : undefined;
                    const pram3Btn = info.prams.length >= 3 ? Buttons.byCmd.get(cmds["wave_filter_val3_" + idx]).element : undefined;
                    let updateFilter = true;

                    API.commands[cmds["wave_filter_onOff_" + idx]] = (cmd, l, r, e) => { channelFilter.use = !channelFilter.use; updateFilter = true; focusedElement = undefined; };
                    API.commands[cmds["wave_filter_wetDry_" + idx]] = (cmd, l, r, e)  => { channelFilter.wet = wetBtn.API.value; updateFilter = true;  focusedElement = wetBtn; };
                    pram1Btn && (API.commands[cmds["wave_filter_val1_" + idx]] = (cmd, l, r, e)  => {channelFilter.freq = info.prams[0].setValue(pram1Btn.API.value); updateFilter = true; focusedElement = pram1Btn; });
                    pram2Btn && (API.commands[cmds["wave_filter_val2_" + idx]] = (cmd, l, r, e)  => {channelFilter.db =   info.prams[1].setValue(pram2Btn.API.value); updateFilter = true; focusedElement = pram2Btn; });
                    pram3Btn && (API.commands[cmds["wave_filter_val3_" + idx]] = (cmd, l, r, e)  => {channelFilter.Q =    info.prams[2].setValue(pram3Btn.API.value); updateFilter = true; focusedElement = pram3Btn; });
                    
                    var focusedElement;
                    const sprIdx = idx;
                    updateStack.push(() => {
                        if (updateFilter) {
                            onOffBtn.API.setSprite(channelFilter.use ? sprIdx : 0);
                            if (channelFilter.use) {
                                wetBtn.API.enable();
                                pram1Btn && pram1Btn.API.enable();
                                pram2Btn && pram2Btn.API.enable();
                                pram3Btn && pram3Btn.API.enable();
                                
                                wetBtn.API.value = channelFilter.wet;
                                wetBtn.API.setPopupText("Wet: " + channelFilter.wet.toFixed(3));
                                pram1Btn && (pram1Btn.API.value = channelFilter.freq, pram1Btn.API.setPopupText(info.prams[0].showValue(channelFilter.freq)));
                                pram2Btn && (pram2Btn.API.value = channelFilter.db,   pram2Btn.API.setPopupText(info.prams[1].showValue(channelFilter.db)));
                                pram3Btn && (pram3Btn.API.value = channelFilter.Q,    pram3Btn.API.setPopupText(info.prams[2].showValue(channelFilter.Q)));  
                                if (focusedElement) {
                                    focusedElement.API.showPopup();
                                }
                                
                                
                            } else {
                                wetBtn.API.disable();
                                pram1Btn && pram1Btn.API.disable();
                                pram2Btn && pram2Btn.API.disable();
                                pram3Btn && pram3Btn.API.disable();
                            }
                            updateFilter = false;
                        }
                    });
                    idx ++;
                }
            })();              
            
            
            sequencer.addEvent("removedTrack", API.update);
            sequencer.addEvent("addedTrack", API.update);
            sequencer.addEvent("start", API.update);
            sequencer.addEvent("stop", API.update);
            sequencer.addEvent("renderCompleted", API.update);
            
        },     
        destroy() {
            sequencer.removeEvent("removedTrack", API.update);
            sequencer.removeEvent("addedTrack", API.update);
            sequencer.removeEvent("start", API.update);
            sequencer.removeEvent("stop", API.update);           
            sequencer.removeEvent("renderCompleted", API.update);           
        },
        
        commands: {
            [cmds.wave_mixTracksDown](cmd, l, r, e) { toggleOption("mixDown"); },
            [cmds.wave_saveOnRender](cmd, l, r, e) { toggleOption("save"); },
            [cmds.wave_normalize](cmd, l, r, e) { toggleOption("normalize"); },
            [cmds.wave_compress](cmd, l, r, e) { toggleOption("compress"); },
            [cmds.wave_dryOnly](cmd, l, r, e) { toggleOption("dryOnly"); },
            [cmds.wave_delaySterio](cmd, l, r, e) { toggleOption("delaySterio"); },
            [cmds.wave_render](cmd, l, r, e) { sequencer.stepSample(); },
            [cmds.wave_play](cmd, l, r, e) { 
                if (wavRender.playable) {
                    if (synth.currentSample) {
                        clearTimeout(hdl);
                        synth.stopSound();
                        btns.play.API.setSprite(0);
                        btns.playLoop.API.setSprite(4);
                        btns.play.API.enable();
                        btns.playLoop.API.enable();                       
                    } else {
                        if (cmd === cmds.wave_play_loop) {
                            synth.playSound(wavRender.playable, true);
                            loopPlay = true;
                            btns.playLoop.API.setSprite(3);
                            btns.play.API.disable();
                            
                        } else {
                            synth.playSound(wavRender.playable);
                            loopPlay = false;
                            btns.play.API.setSprite(1);
                            btns.playLoop.API.disable();
                            
                            hdl = setTimeout(() => {
                                if (synth.currentSample) { synth.stopSound(); }
                                btns.play.API.setSprite(0);
                                btns.playLoop.API.setSprite(4);
                                btns.play.API.enable();
                                btns.playLoop.API.enable();
                            }, wavRender.playable.duration * 1000 + 200);
                        }
                    }
                }
            },
            [cmds.wave_play_loop](cmd, l, r, e) { 
                API.commands[cmds.wave_play](cmd, l, r, e);
            },
        }, 
        commandRange(cmd, left, right) { 

		},  
        seqBusy() {
            if (sequencer.playing || sequencer.tracks.length === 0 || synth.currentSample) {
                btns.render.API.disable();

            } else if (sequencer.tracks.length) {
                btns.render.API.enable();
            }
            if (wavRender.playable && (!sequencer.playing && !synth.currentSample)) {
                    btns.playLoop.API.enable();
                    btns.play.API.enable();
            } else if (wavRender.playable && synth.currentSample) {       
            
                if (loopPlay) {
                    btns.play.API.disable();
                    btns.playLoop.API.enable();
                } else {
                    btns.play.API.enable();
                    btns.playLoop.API.disable();
                }
            } else {
                btns.play.API.disable();
                btns.playLoop.API.disable();
            }
            if (wavRender.playable) {
                btns.container.children[0].textContent = "R: " + wavRender.playable.duration.toFixed(2) + " sec" + (wavRender.playable.peek ? " Peek: " + wavRender.playable.peek.toFixed(3) : "")  ;
            } else {
                btns.container.children[0].textContent = "Nothing playable";
            }           

        },            
        update() {
            API.seqBusy();
            setOption("mixDown", "Mix down");
            setOption("save", "Save rendered");
            setOption("normalize", "Normalize");
            setOption("compress", "Compress");
            setOption("dryOnly", "Dry only");
            setOption("delaySterio", "Delay pan");
            for (const up of updateStack) { up(); }
            

        }            
        
    }
 
    return API;
}

export {Waves};