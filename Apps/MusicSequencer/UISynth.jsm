

function UISynth(commands, Buttons, sequencer, synth) {
    const channelGrp = "synthChannel";
    const filterGrp = "synthFilter";
    var channelText, silent = false, mouse, keyboard, cmdSet;
    var volumeBtn, volumeWetBtn, currentFilter;
    var containingElement;
    //const filterNames = ["f200", "f500", "f1000", "f5000"];
    //const filterNames = [0.1, 0.25, 0.5, 0.75];
    /*const filterNames = [
        //w, h, mic1, mic2, reflections, pulseLength = 0.2, difuseTime = 0.001, speedOfSound = 40
        [12, 4, 1,   2,  2,  0.1, 0.001, 30],
        [12, 4, 1.5, 3,  2,  0.1, 0.001, 30],
        [12, 4, 3,   6,  2,  0.1, 0.001, 30],
        [12, 4, 5,   10, 2,  0.1, 0.001, 30],
    ];*/
    const filterNames = synth.filterNames;


    function setFilter(cmdId) {
        if (currentFilter === cmdId) {
            currentFilter = undefined;
            Buttons.Groups.radio(filterGrp, -1, true);
            synth.filter = 0;
            volumeWetBtn.element.API.disable();
        } else {
            if (filterNames[cmdId - commands.synthFilterA]) {
                Buttons.Groups.radio(filterGrp, cmdId, true);
                currentFilter = cmdId;
                synth.filter = filterNames[cmdId - commands.synthFilterA];
                volumeWetBtn.element.API.enable();
            }
        }
        setTimeout(() => cmdSet.issueCommand(commands.sysUpdateSynth), 500);

    }
    function trackChangeEvent(event) {
        if (silent) { return }
        if (event.data.type === "channel" || event.data.type === "active") {
            if (event.data.track?.active) {
                API.update();
            }
        }
    }
    function synthReset() {
         const cn = synth.channelNames;
        const buttons = [
            {type: "existingContainer", pxScale: 1, x: 620, y: 221, id: "SynthChannelPanel"},
            ...cn.map((name, i) => {
                return {
                    x:  i * 27,
                    y: 0,
                    command: commands.synthCh0 + i,
                    type: "buttonNew",
                    //cssClass: "hide",
                    size: 24,
                    sizeName: "icon24",
                    group: channelGrp,
                    help: name,
                    pxScale: 1,
                    sprite: synth.channels[i].iconIdx
                };
            }),
        ];        
        Buttons.add(containingElement, buttons);
        
    }
    const API = {
        create(container, commandSets) {
            containingElement = container;
            cmdSet = commandSets;
            mouse = cmdSet.mouse;
            keyboard = cmdSet.mouse.keyboard;
            const cn = synth.channelNames;
            var i = 0, j = 0;
            //var X = 66, Y = 24.6;
            const buttons = [
				{type: "subContain", pxScale: 1, x: 620+ 200, y: 221, id: "SynthChannelPanel"},
                ...cn.map((name, i) => {
                    return {
                        x:  i * 27,
                        y: 0,
                        command: commands.synthCh0 + i,
                        type: "buttonNew",
                        //cssClass: "hide",
                        size: 24,
						sizeName: "icon24",
                        group: channelGrp,
                        help: name,
						pxScale: 1,
                        sprite: synth.channels[i].iconIdx
                    };
                }),
			];
			const buttonsB = [
				{type: "subContain", pxScale: 1, x: 330, y: 60, id: "SynthFXPanel"},
                {x: 11,  y: 0,      command: commands.synthFilterA, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 8, pxScale: 1 },
                {x: 11,  y: 19,     command: commands.synthFilterB, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 9, pxScale: 1 },
                {x: 11,  y: 19 * 2, command: commands.synthFilterC, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 10, pxScale: 1 },
                {x: 11,  y: 19 * 3, command: commands.synthFilterD, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 11, pxScale: 1 },
                {x: 11,  y: 19 * 4, command: commands.synthFilterE, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 12, pxScale: 1 },
                {x: 11,  y: 19 * 5, command: commands.synthFilterF, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 13, pxScale: 1 },
                {x: 11,  y: 19 * 6, command: commands.synthFilterG, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 14, pxScale: 1 },
                {x: 11,  y: 19 * 7, command: commands.synthFilterH, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 15, pxScale: 1 },
                {x: 31, y: 0,      command: commands.synthFilterI, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 16, pxScale: 1 },
                {x: 31, y: 19,     command: commands.synthFilterJ, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 17, pxScale: 1 },
                {x: 31, y: 19 * 2, command: commands.synthFilterK, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 18, pxScale: 1 },
                {x: 31, y: 19 * 3, command: commands.synthFilterL, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 19, pxScale: 1 },
                {x: 31, y: 19 * 4, command: commands.synthFilterM, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 20, pxScale: 1 },
                {x: 31, y: 19 * 5, command: commands.synthFilterN, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 21, pxScale: 1 },
                {x: 31, y: 19 * 6, command: commands.synthFilterO, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 22, pxScale: 1 },
                {x: 31, y: 19 * 7, command: commands.synthFilterP, type: "button", size: 16, group: filterGrp, help: filterNames[j++],  sprite: 23, pxScale: 1 },
                {
                    x: 50,  y: 0,command: commands.synthVolume, type: "slide",
                    value:0.7,
                    min: 0, max: 1, sizeW: 8, sizeH: 157, color: "#4C6",
                    group: "volumeSlide", help: "", pxScale: 1, mouse, keyboard,
                },{
                    x: 0,  y: 0,command: commands.synthVolumeWet, type: "slide",
                    value:0.7,
                    min: 0, max: 1, sizeW: 8, sizeH: 157, color: "#4C6",
                    group: "volumeSlide", help: "", pxScale: 1, mouse, keyboard,
                },
			];
			const buttonsC = [				
                {x: 442 + 200,  y: 221, command: commands.synthChText  , type: "text", text: "", size: 174, sizeH: 24,  help: "", pxScale: 1},
            ];
            Buttons.add(container, buttons);
            Buttons.add(container, buttonsB);
            Buttons.add(container, buttonsC);
            commandSets.registerSet(commands.SYNTH , commands.SYNTH_END, API);
            channelText = Buttons.byCmd.get(commands.synthChText);
            volumeBtn = Buttons.byCmd.get(commands.synthVolume);
            volumeWetBtn = Buttons.byCmd.get(commands.synthVolumeWet);
            //Buttons.byCmd.get(commands.synthFilterK).element.API.disable();
            //Buttons.byCmd.get(commands.synthFilterL).element.API.disable();
        },
        ready() {
            synth.addEvent("channelsReset", synthReset);
            sequencer.addEvent("trackChange", trackChangeEvent);
            //sequencer.addEvent("addedTrack", API.update);
            sequencer.addEvent("deserializeStart", () => silent = true);
            sequencer.addEvent("deserialize", () => {silent = false; API.update()});
            volumeBtn.element.API.value = synth.volume;
            volumeWetBtn.element.API.value = synth.volumeWet;
            setTimeout(() => cmdSet.issueCommand(commands.sysUpdateSynth), 500);

        },
        commands: {
            [commands.synthFilterA](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterB](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterC](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterD](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterE](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterF](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterG](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterH](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterI](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterJ](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterK](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterL](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterM](cmd, left, right) { setFilter(cmd) },
            [commands.synthFilterN](cmd, left, right) { setFilter(cmd) },
            [commands.synthVolume](cmd, left, right) {
                synth.volume = volumeBtn.element.API.value;
            },
            [commands.synthVolumeWet](cmd, left, right) {
                synth.volumeWet = volumeWetBtn.element.API.value;
            },
        },
        commandRange(cmd, left, right) {
            if (cmd >= commands.synthCh0 && cmd < commands.synthChLast) {
                const at = sequencer.activeTrack;
                if (at) {
                    const name = synth.channelNames[cmd - commands.synthCh0];
                    at.setChannel(name);
                }
            }

            return false
        },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  left, right) === true) { return } }
            else { if (API.commandRange(cmd, left, right) === true) { return } }
            API.update();
        },
        update() {
            if (silent) { return }
            const at = sequencer.activeTrack;
            var channelName = "";
            if (at) {

                const idx = synth.channels.findIndex(play => at.play === play);
                if (idx > -1) {
                    Buttons.Groups.radio(channelGrp, commands.synthCh0 + idx, true);
                    channelName = at.channelName;
                } else {
                    Buttons.Groups.radio(channelGrp, -1, true);
                }
            } else {
                Buttons.Groups.radio(channelGrp, -1, true);
            }
            channelText.element.textContent = channelName;
            volumeBtn.element.API.value = synth.volume;
            volumeWetBtn.element.API.value = synth.volumeWet;
            const fIdx = filterNames.indexOf(synth.filterName);
            if (fIdx > -1) {
                currentFilter = commands.synthFilterA + fIdx;
                Buttons.Groups.radio(filterGrp, currentFilter, true);
                volumeWetBtn.element.API.enable();
            } else {
                Buttons.Groups.radio(filterGrp, -1, true);
                volumeWetBtn.element.API.disable();
            }

        },
    };
    return API;
}
export {UISynth};

