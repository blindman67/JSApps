
function UIEdit(commands, Buttons) {
    const keyGrp = "cordKey";
    const API = {
        create(container, commandSets) {
            /*var X = 40, Y = 1;
            const buttons = [
                {x: X     , y: Y, command: commands.mainKeyA,  type: "button", size: 32, group: keyGrp, help: "Key A", sprite: 0},
                {x: X += 4, y: Y, command: commands.mainKeyAs, type: "button", size: 32, group: keyGrp, help: "Key A sharp", sprite: 1},
                {x: X += 4, y: Y, command: commands.mainKeyB,  type: "button", size: 32, group: keyGrp, help: "Key B", sprite: 2},
                {x: X += 4, y: Y, command: commands.mainKeyC,  type: "button", size: 32, group: keyGrp, help: "Key C", sprite: 3},
                {x: X += 4, y: Y, command: commands.mainKeyCs, type: "button", size: 32, group: keyGrp, help: "Key C sharp", sprite: 4},
                {x: X += 4, y: Y, command: commands.mainKeyD,  type: "button", size: 32, group: keyGrp, help: "Key D", sprite: 5},
                {x: X += 4, y: Y, command: commands.mainKeyDs, type: "button", size: 32, group: keyGrp, help: "Key D sharp", sprite: 6},
                {x: X += 4, y: Y, command: commands.mainKeyE,  type: "button", size: 32, group: keyGrp, help: "Key E", sprite: 7},
                {x: X += 4, y: Y, command: commands.mainKeyF,  type: "button", size: 32, group: keyGrp, help: "Key F", sprite: 8},
                {x: X += 4, y: Y, command: commands.mainKeyFs, type: "button", size: 32, group: keyGrp, help: "Key F sharp", sprite: 9},
                {x: X += 4, y: Y, command: commands.mainKeyG,  type: "button", size: 32, group: keyGrp, help: "Key G", sprite: 10},
                {x: X += 4, y: Y, command: commands.mainKeyGs, type: "button", size: 32, group: keyGrp, help: "Key G sharp", sprite: 11},

                {x: 250,  y: 226, command: commands.currentNoteText  , type: "text", text: "", size: 106, sizeH: 20,  help: "", pxScale: 1},

            ];
            Buttons.add(container, buttons);
            commandSets.registerSet(commands.KEY , commands.KEY_END, API);*/
        },
        ready() {},
        commands: {
            //[](cmd, left, right) { },
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

        },
    };
    return API;
}
export {UIEdit};

