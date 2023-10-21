
import {$, $$, $R} from "../../../src/DOM/geeQry.jsm";
function FloatingModule(common, modName, mod) {
    var i = common.commands.CMD_TAIL;
    const cmds = {
        move: i++,
        close: i++,
        ...mod.cmds(),
    };
    var container;
    
 	const id = common.commandSets.mouse.getId();
    const mouse = common.commandSets.mouse;    
    const keyboard = common.commandSets.mouse.keyboard;    
    const {commandSets, commands, Buttons}  = common;
    const API = {
        create() {            
            $$(content, container = $("div",{className:"floatingModule"}));
            Buttons.add(container, [
				{x: 0, y: 0, command: cmds.move, captureId: id, text: modName, type: "dragger", right: 24, drags: container, help: "", posRef: "top", size: 24},
				{x: 0, y: 0, command: cmds.close, captureId: id,  type: "buttonNew", help: "Close", posRef: "topRight", size: 24, sizeName: "icon24", sprite: 33}
			]);
            /*const uiEls = */
            mod.create(container);
            commandSets.tailCommands(cmds, API);    
        },           
        destroy() {
            mod.destroy();
            common.commandSets.dockCommands(API);
            $R(content, container);
            container = undefined;
            commandSets.issueCommand(commands.sysModuleDestroy);
        },
        commands: {
            [cmds.move](cmd, l, r, e) { },
            [cmds.close](cmd, l, r, e) { API.destroy(); return true; },
        },
        command(cmd, e, m) {
            const r = m ? (m.oldButton & 4) === 4 : false, l = m ? (m.oldButton & 1) === 1 : false;
            if (API.commands[cmd]) { if (API.commands[cmd](cmd,  l, r, e) === true) { return } }
            if (mod.commands[cmd]) { if (mod.commands[cmd](cmd,  l, r, e) === true) { return } }
            else if (mod.commandRange(cmd)) { return }
            mod.update();
        },  
        update() {
            mod.update();
        }
        
    }
    return API;
}

export {FloatingModule};