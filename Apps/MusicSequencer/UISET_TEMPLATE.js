

function UI????(commands, Buttons) {
    const API = {
        create(container, commandSets) {
            var X = 10, Y = 10;
            const buttons = [
            ];
            Buttons.add(container, buttons);
            commandSets.registerSet(commands. , commands. _END, API);
        },
        ready() {},
        commands: {
            [](cmd, left, right) { },
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
export {UI????};

