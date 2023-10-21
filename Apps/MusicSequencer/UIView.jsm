function UIView(commands, Buttons, piano) {
    const zoomXGrp = "viewZoomX", zoomYGrp = "viewZoomY";
    var zoomX, zoomY, followPlayToggle, mouse, keyboard, cmdSets, id;
    function setView() { piano.setZoom(zoomX - commands.zoomX1 + 1, zoomY - commands.zoomY1 + 1) }
	function scaleView(sx, sy) { piano.scaleZoom(sx, sy) }
    const API = {
        create(container, commandSets) {
			mouse = commandSets.mouse;
            keyboard = commandSets.mouse.keyboard;
            cmdSets = commandSets;
			id = mouse.getId();
            var X = 0, Y = 0;
            const buttons = [
                {type: "subContain", pxScale: 1, x: 4, y: 143, id: "ViewPanel"},
                {x: X     ,  y: Y, command: commands.zoomX1, type: "button", size: 24, group: zoomXGrp, help: "Zoom time *1",   sprite: 36 },
                {x: X += 3,  y: Y, command: commands.zoomX2, type: "button", size: 24, group: zoomXGrp, help: "Zoom time *2",   sprite: 37 },
                {x: X += 3,  y: Y, command: commands.zoomX3, type: "button", size: 24, group: zoomXGrp, help: "Zoom time *3",   sprite: 38 },
                {x: X += 3,  y: Y, command: commands.zoomX4, type: "button", size: 24, group: zoomXGrp, help: "Zoom time *4",   sprite: 39 },
                {x: X =  0,  y: Y += 3, command: commands.zoomY1, type: "button", size: 24, group: zoomYGrp, help: "Zoom notes *1",  sprite: 40 },
                {x: X += 3,  y: Y, command: commands.zoomY2, type: "button", size: 24, group: zoomYGrp, help: "Zoom notes *2",  sprite: 41 },
                {x: X += 3,  y: Y, command: commands.zoomY3, type: "button", size: 24, group: zoomYGrp, help: "Zoom notes *3",  sprite: 42 },
                {x: X += 3,  y: Y, command: commands.zoomY4, type: "button", size: 24, group: zoomYGrp, help: "Zoom notes *3",  sprite: 43 },
                {x: X += 3,  y: Y, command: commands.followPlayToggle, type: "buttonNew", sizeName: "icon24", size: 24, group: "followPlayToggle", help: "Toggle roll follow play position",  sprite: 0, sprites: [44, 45] },
            ];
            Buttons.add(container, buttons);
            zoomX = commands.zoomX1;
            zoomY = commands.zoomY1;
            commandSets.registerSet(commands.VIEW, commands.VIEW_END, API);
			followPlayToggle = Buttons.byCmd.get(commands.followPlayToggle)
        },
        ready() {
            [zoomX, zoomY] = piano.getZoom();
            zoomX = commands.zoomX1 + (Math.min(3, Math.max(1, zoomX | 0)) - 1);
            zoomY = commands.zoomY1 + (Math.min(3, Math.max(1, zoomY | 0)) - 1);
            API.update();
        },
        commands: {
            [commands.zoomX1](cmd, left, right) {
				if (right) { scaleView(0.5, 1) }
				else {
					zoomX = zoomX === cmd ? -1 : cmd;
					setView();
				}
            },
            [commands.zoomX2](cmd, left, right) {
                zoomX = zoomX === cmd ? -1 : cmd;
                setView();
            },
            [commands.zoomX3](cmd, left, right) {
                zoomX = zoomX === cmd ? -1 : cmd;
                setView();
            },
            [commands.zoomX4](cmd, left, right) {
                zoomX = zoomX === cmd ? -1 : cmd;
                setView();
            },
            [commands.zoomY1](cmd, left, right) {
				if (right) { scaleView(1, 0.5) }
				else {
					zoomY = zoomY === cmd ? -1 : cmd;
					setView();
				}
            },
            [commands.zoomY2](cmd, left, right) {
                zoomY = zoomY === cmd ? -1 : cmd;
                setView();
            },
            [commands.zoomY3](cmd, left, right) {
                zoomY = zoomY === cmd ? -1 : cmd;
                setView();
            },
            [commands.zoomY4](cmd, left, right) {
                zoomY = zoomY === cmd ? -1 : cmd;
                setView();
            },
            [commands.followPlayToggle](cmd, left, right) {
                piano.followPlay = !piano.followPlay;
            },
        },
        commandRange(cmd, left, right) { return false },
        command(cmd, event, mouse) {
            const right = mouse ? (mouse.oldButton & 4) === 4 : false;
            const left = mouse ? (mouse.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) {
                if (API.commands[cmd](cmd,  left, right) === true) { return }
            } else {
                if (API.commandRange(cmd,left,right) === true) { return }
            }
            API.update();
        },
        update() {
            Buttons.Groups.radio(zoomXGrp, zoomX, true);
            Buttons.Groups.radio(zoomYGrp, zoomY, true);
			followPlayToggle.element.API.setSprite(piano.followPlay ? 0 : 1);
        },
    };
    return API;
}
export {UIView};