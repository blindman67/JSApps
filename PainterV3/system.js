"use strict";
const system = (()=>{
    const extensions = new Map;
    const system = {
        UIVisible: true,
        UIFullInvisible: false,
        UIToggleCount: 0,
        hasImageZoom: false,
        commands: {
            [commands.sysGlobalEscape]() {
                if (!system.UIVisible) {
                    system.UIVisible = true;
                    displaySizer({showUI: true});
                }
                system.fireEvent("globalescape");
            },
            [commands.sysHideUIFull]() {
                displaySizer({
                    hideUI: true,
                    hideUIFull: true,
                    hideUIInfo: "[ESC] or [CTRL][I] to restore UI",
                    hideUIInfoTime: 3000,
                });
                system.UIFullInvisible = false;

            },
            [commands.sysShowTimeBarTemp]() {
                if (!system.UIVisible) {
                    system.UIVisible = true;
                    displaySizer({showUI: true, showTimeBar: true, hideOnCanvas: true})
                    system.UIFullInvisible = false;
                    log("sysShowTimeBarTemp");
                }
            },
            [commands.sysShowUITemp]() {
                if (!system.UIVisible) {
                    system.UIVisible = true;
                    displaySizer({showUI: true, hideOnCanvas: true})
                    system.UIFullInvisible = false;
                }

            },
            [commands.sysHideUIToggle]() {
                system.UIVisible = !system.UIVisible;
                if (system.UIVisible) {
                    displaySizer({showUI: true})
                    system.UIFullInvisible = false;

                } else {
                    system.UIToggleCount ++;
                    if (system.UIToggleCount < 4) {
                        displaySizer({
                            hideUI: true,
                            hideUIInfo: "[ESC] or [CTRL][I] or hover right to restore UI",
                            hideUIInfoTime: 3000,
                        });
                    } else { displaySizer({hideUI: true}) }
                }
            },
            [commands.sysShowFileHistory]() {
                storage.listFileHistory();
            },
            [commands.sysResetAllSilent]() {
                selection.clear();
                collections.reset();
                sprites.remove([...sprites]);
                mediaList.deleteAll();
                media.reset();
                sprites.cleanup();
                issueCommand(commands.edSprResetView);
                issueCommand(commands.edSprUpdateAll);
                issueCommand(commands.edSprUpdateUI);
            },
            [commands.sysResetAll]() {
                return new Promise((ok, cancel) => {
                    if (busy.isBusy) { log.info("Painter is busy can not reset."); cancel(false); return }
                    if (commandLine.quickMenuOpen()) { log.warn("Active dialog must be closed befor resetting"); cancel(false); return  }
                    const confirmReset = buttons.quickMenu( "26 Reset all!|Cancel,Reset|textCenter This action will delete all content.,textCenter Are you sure you want to reset\\?");
                    confirmReset.onclosed = () => {
                        if(confirmReset.exitClicked === "Reset"){
                            if (busy.isBusy) {
                                log.info("Between asking for comformation and getting the responce Painter became busy. Can not reset while busy!");
                                cancel(false);
                            } else {
                                issueCommand(commands.sysResetAllSilent);
                                ok(true);
                            }
                        }else{
                            log.warn("Reset command canceled by user!");
                            cancel(false);
                        }
                    }
                })

            },
            [commands.sysClearCommandBuffer]() {
                commandLine.clearCommandBuffer();
                log.sys("Command buffer cleared");

            },        
            [commands.sysSaveCommandBuffer]() {
                commandLine.saveBufferAsJson();
                log.sys("Downloading command buffer");

            },
            [commands.sysSaveSettingsAsJSON]() {
                settingsHandler.saveSettingAsJson();
                log.sys("Downloading settings.");
            },
            [commands.sysSaveSettingsAsJSONWithDescriptions]() {
                settingsHandler.saveSettingAsJson(undefined, true);
                log.sys("Downloading settings with descriptions.");
            },
            [commands.sysUp]() { system.globalAction(commands.sysUp) },
            [commands.sysDown]() { system.globalAction(commands.sysDown) },
        },
        globalAction(commandId) {
                if (uiPannelList.mediaTabs.sprites.isOpen) {

                    spriteList.globalAction(commandId);
                } else if (uiPannelList.mediaTabs.media.isOpen) {
                    log("media down");

                } else if (uiPannelList.mediaTabs.extras.isOpen) {
                    log("extras down");
                }

        },
        command(commandId, ...args) {
            if (system.commands[commandId]) {
                return system.commands[commandId](args);
            }

        },
        get hasImageZoomExt() { return system.hasImageZoom },
        set hasImageZoomExt(val) { system.hasImageZoom = val },
        addExtension(name) {
            if (name !== undefined && name !== "") {
                
                if (extensions.has(name)) { return extensions.get(name); }
                extensions.set(name, {
                    name,
                    ext: {}
                });
                return extensions.get(name);
            }
                
        },
        getExtension(name) {
            if (extensions.has(name)) { return extensions.get(name); }
        },
    };
    Object.assign(system, Events(system));
    return system;
})();