

function UISelecting(commands, Buttons) {
    var selMode = commands.selectOff;
    const selectTypeGrp = "selectType";
    const API = {
        create(container, commandSets) {
            /*var X = 122, Y = 4;
            const buttons = [
                {x: X += 0, y: Y, command: commands.selectTrack , type: "button", size: 40, group: selectTypeGrp, help: "",  sprite: 0 },
                {x: X += 5, y: Y, command: commands.selectBars  , type: "button", size: 40, group: selectTypeGrp, help: "",  sprite: 1 },
                {x: X += 5, y: Y, command: commands.selectNotes , type: "button", size: 40, group: selectTypeGrp, help: "",  sprite: 2 },
                {x: X += 5, y: Y, command: commands.selectKey   , type: "button", size: 40, group: selectTypeGrp, help: "",  sprite: 5 },

                {x: X -= 15, y: Y += 5, command: commands.selectCopy   , type: "button", size: 32, group: "copyPaste", help: "",  sprite: 22 },
                {x: X += 4,  y: Y     , command: commands.selectCut    , type: "button", size: 32, group: "copyPaste", help: "",  sprite: 21 },
                {x: X += 4,  y: Y     , command: commands.selectPaste  , type: "button", size: 32, group: "copyPaste", help: "",  sprite: 23 },

                {x: X -= 8, y: Y += 4, command: commands.selectShorten       , type: "button", size: 40, group: "selectFunctions", help: "",  sprite: 9 },
                {x: X += 5,  y: Y += 0, command: commands.selectLengthen      , type: "button", size: 40, group: "selectFunctions", help: "",  sprite: 10 },
                {x: X += 5,  y: Y += 0, command: commands.selectMoveBeatLeft  , type: "button", size: 40, group: "selectFunctions", help: "",  sprite: 7 },
                {x: X += 5,  y: Y += 0, command: commands.selectMoveBeatRight , type: "button", size: 40, group: "selectFunctions", help: "",  sprite: 6 },
                {x: X += 5,  y: Y += 0, command: commands.selectMoveNoteUp    , type: "button", size: 40, group: "selectFunctions", help: "",  sprite: 3 },
                {x: X += 5,  y: Y += 0, command: commands.selectMoveNoteDown  , type: "button", size: 40, group: "selectFunctions", help: "",  sprite: 4 },

            ];
            Buttons.add(container, buttons);
            commandSets.registerSet(commands.SELECT , commands.SELECT_END, API);*/
        },
        ready() {},
        commands: {
            [commands.selectTrack](cmd, left, right) { selMode = selMode === cmd ? -1 : cmd },
            [commands.selectBars](cmd, left, right) { selMode = selMode === cmd ? -1 : cmd  },
            [commands.selectNotes](cmd, left, right) { selMode = selMode === cmd ? -1 : cmd  },
            [commands.selectKey](cmd, left, right) { selMode = selMode === cmd ? -1 : cmd  },
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
            Buttons.Groups.radio(selectTypeGrp, selMode, true);
        },
    };
    return API;
}
export {UISelecting};
