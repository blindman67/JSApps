"use strict";

(()=>{
    function updateDisplaySizer(){ displaySizer() }
    function createSettingFold() {
		var randImageDirs = [
            NAMED_DIRECTORIES.downloads,
            NAMED_DIRECTORIES.aoids
        ];
        var randImageGifDir;
         const systemExtras = {
            systemSettings : {
                foldInfo : {
                    help : "System settings can be changed from this fold",
                    init(){
                        for(const name of Object.keys(settings)){
                            for(const item of this.fold.items){
                                if(item.item.objName === name) {
                                    settingsHandler.settingsMenuItems[name] = item;
                                    if(settingsHandler.settingsDescriptive.colors[name] !== undefined) { //.toLowerCase().indexOf("color") > -1){
                                        item.element.textContent = item.item.name;
                                        item.element.title += "\nClick to set the color to the current main color";
                                        $$(item.element,[item.colorSwatch = $("span",{className : "foldItemColorSwatch", style : {background : settings[name]}})]);
                                        item.onchange = systemExtras.systemSettings.foldInfo.showColor;

                                    }else{
                                        if(typeof settings[name] === "boolean"){
                                            item.onchange = systemExtras.systemSettings.foldInfo.showBoolean;
                                            item.onchange(name);
                                        }else{
                                            item.onchange = systemExtras.systemSettings.foldInfo.showValue;
                                            item.onchange(name);
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    },
                    showValue(name){
                        const item = settingsHandler.settingsMenuItems[name];
                        if (isNaN(settings[name])) {
                            item.element.textContent = item.item.name + ": '" + settings[name] + "'";
                        } else {
                            item.element.textContent = item.item.name + ": " + settings[name];
                        }
                    },
                    setColorItem(name){
                        settings[name] = colours.current;
                        this.showColor(name);
                    },
                    showColor(name){
                        settingsHandler.settingsMenuItems[name].colorSwatch.style.background = colours.current;
                    },
                    toggleBoolean(name){
                        settings[name] = !settings[name];
                        this.showBoolean(name);
                    },
                    showBoolean(name){
                        const item = settingsHandler.settingsMenuItems[name];
                        if(settings[name]){
                            item.element.classList.add("foldItemHighlight");
                            item.element.textContent = item.item.name + " " + textIcons.tickBox;
                        }else{
                            item.element.classList.remove("foldItemHighlight");
                            item.element.textContent = item.item.name + " " + textIcons.tickBoxOff;
                        }
                    },
                }
            },

        }
        function createSettingsFold(settingDesc,fold){
            if(fold === undefined){
                fold = Object.assign({},{foldInfo : {...systemExtras.systemSettings.foldInfo}});

            }
            for(const name of Object.keys(settingDesc)){
                if(typeof settingDesc[name] === "string"){
                    fold[name] = {
                        help : settingDesc[name],
                        call() {
                            if (typeof settings[name] === "boolean") {
                                fold.foldInfo.toggleBoolean(name);
                                settingsHandler.updateSettings();
                            } else if (name.toLowerCase().indexOf("color") > -1) {
                                fold.foldInfo.setColorItem(name);
                                settingsHandler.updateSettings();
                            } else {
                                log.info("Change the settings and hit return");
                                if (isNaN(settings[name])) {
                                    if (settingsHandler.settingsTokenOptions[name]) {
                                        log("Options are:");
                                        for (const opt of settingsHandler.settingsTokenOptions[name]) {
                                            log("    " + opt);
                                        }
                                    }
                                    commandLine("settings " + name + " \"" + settings[name] +"\"",false,true, true, true);
                                } else {
                                    commandLine("settings " + name + " " + settings[name],false,true, true, true);
                                }
                                commandLine.clearOnBlur = true;
                            }
                        }
                    };
                } else {
                    fold[name] = createSettingsFold(settingDesc[name]);
                }


            }
            return fold;

        }
        createSettingsFold(settingsHandler.settingsDescriptive, systemExtras.systemSettings);
        systemExtras.systemSettings.Save_Setting_As_JSON = {
            help: "Downloads settings as JSON. Include setting descriptions.",
            call() { issueCommand(commands.sysSaveSettingsAsJSONWithDescriptions); }
        };
        const foldsObj = {
            /*navigate : {
                home : {
                    help : "Return to painter main page",
                    call() {
                        history.go(-1)
                        log("Going home");

                    }
                },
                resources: {
                    help: "Open Resources page in new tab",
                    call() {
                        open('Resources/Resources.html', '_blank');
                    }
                }
            },*/
            imageProcessing : {
                ...localProcessImage.extras,
                filters : {
                    SVG_filter_dialog : {  // the snake case is so that name to human does not lowercase the SVG
                        help : "Runs the batch 'spriteFX' that lets you use SVG filters on selected images\nNote this will terminate any currently running batches.",
                        call(){

                            setTimeout(()=>commandLine("run safe spriteFX",true),0);
                        }
                    }
                }
            },
            /*painting : { ...paint.extras, },*/
            sprites : { ...selection.extras, },
            animation : { ...animation.extras, },
            helpers : {
				foldInfo: {
					help: "A veriaty of dialogs, functions and what not that did not fit elswhere",
					foldClass: "extrasHelpers",
				},
                testing : {
					foldInfo: {
						help: "This fold is only in development versions. Stuff related to rtesting and debugging",
						foldClass: "extrasHelpersTesting",

					},
					loadIconsAsImage: {
                        help : "Loads the icon image",
                        call() {
							media.create(NAMED_DIRECTORIES.icons + "iconsGreen.png", (img) => !img && log.error("Could not load media.") );
						}

					},
                    resetAddaptiveMouseWheel: {
                        help : "When there are mouse wheel problems Click this",
                        call() { mouse.wheelMin = Infinity }


                    },
                    contextLost : {
                        help : "GPU crashes will destroy content\nThis will attemp to restore as much as possible",
                        call() { media.contextLost() }
                    },
                    restartRender : {
                        help : "If workspace has stopped this will restart it",
                        call() { mainCanvas.ctx.restart() }
                    },
                    lockSim : {
                        help : "Simulates locking of images",
                        call() {
                            selection.eachOfType(spr => {
                                var p = 0;
                                var rate = Math.random() * 0.01 + 0.005;
                                var time = Math.random() * 100 + 1;
                                function fakeProgress(){
                                    p += rate;
                                    if(p < 1){

                                        spr.image.progress = p;
                                        setTimeout(fakeProgress, time);
                                    }else{
                                        spr.image.unlock();
                                    }
                                }
                                if(!spr.image.isLocked){
                                    spr.image.lock(0);
                                    fakeProgress();
                                }
                            },"image");
                        }
                    },

                },
                workspace: {
					foldInfo: {
						help: "Helpers for devices without wheel and or just one button",
						foldClass: "extrasHelpersWorkspace",
					},
                    fitSelected: {
                        help: "Zoom and fit selected to workspace\nIf nothing selected sets view to default",
                        call() { setTimeout(()=>commandLine("com edSprResetViewFit", true),0) }                         
                    },
                    zoom: {
                        help: "Set default zoom.",
                        call() { setTimeout(()=>commandLine("zoom", true),0) }
                    },
                    zoomIn: {
                        help: "Zoom in at center of workspace.",
                        call() { setTimeout(()=>commandLine("zoom in", true),0) }
                    },
                    zoomOut: {
                        help: "Zoom out at center of workspace.",
                        call() { setTimeout(()=>commandLine("zoom out", true),0) }
                    },
                    panHome: {
                        help: "Pan to home position.",
                        call() { setTimeout(()=>commandLine("pan", true),0) }
                    },
                    panUp: {
                        help: "Pan up 1/8th workspace.",
                        call() { setTimeout(()=>commandLine("pan up 0.5", true),0) }
                    },
                    panDown: {
                        help: "Pan down 1/8th workspace.",
                        call() { setTimeout(()=>commandLine("pan down 0.5", true),0) }
                    },
                    panLeft: {
                        help: "Pan left 1/8th workspace.",
                        call() { setTimeout(()=>commandLine("pan left 0.5", true),0) }
                    },
                    panRight: {
                        help: "Pan right 1/8th workspace.",
                        call() { setTimeout(()=>commandLine("pan right 0.5", true),0) }
                    },
                    
                },
                getKeyboardShortcuts : {
                    help : "List all registered keyboard commands\[RIGHT] Click to save as Text",
                    call() {
                        if(mouse.ctrl) {
                            const keys = keyboard.getKeyMappingString().map(str => {
                                if(str[0] === "[") {
                                    const p = str.split(" > ");
                                    const keys = p[0].replace(/\[/g,"").split("]");
                                    keys.pop();
                                    keys[0] = keys[0].replace("Key","");
                                    const key = keys.shift();
                                    str = (keys.length ? "["+keys.join("][")+"] " : "")+key;
                                    return [str ,p[1]];
                                }
                                return [str];
                            })


                            var x = 0, y = -36 * keys.length / 2;
                            const sprs = keys.flatMap(str => {
                                if(str.length === 1) {
                                    y+= 62;
                                    return [
                                        {...utils.Sprite("text","text",x, y-20, 128, 42),...{text:str[0], sx: 2, sy: 2}},
                                    ];
                                }
                                y+= 36;
                                return [
                                    {...utils.Sprite("text","text",x-128, y, 128, 34),...{text:str[0]}},
                                    {...utils.Sprite("text","text",x+128, y, 128, 34),...{text:str[1]}}
                                ];

                            });
                            storage.openContentOfType("sprites",{sprites : sprs});
                            log("Creating scene help.");


                        }else{
                            if(mouse.oldButton === 4) {
                                var text = "";
                                keyboard.getKeyMappingString().forEach(str =>(text += str + "\n", log(str)));
                                downloadText(text,"PainterKeyboardShortcuts");
                            }else{
                                keyboard.getKeyMappingString().forEach(str => log(str));
                            }
                        }
                    }
                },
                saveCommandBuffer: {
                    help: "Issue system command 'sysSaveCommandBuffer' that saves the content of the command buffer",
                    call() { issueCommand(commands.sysSaveCommandBuffer) },
                },
                clearCommandBuffer: {
                    help: "Clears all command from command buffer. Warning all buffered cammand will be lost.",
                    call() { issueCommand(commands.sysClearCommandBuffer) },
                },    
                ... (LOCALS.LOCAL ? {   
                    Test_Google_Font_API: {
                        help: "Query font API",
                        call() { APIs.TestAPI(); }

                    },
                } : {}),
                templateLoader: {
                    help : "Dialog with list of templates",
                    call(){ setTimeout(()=>commandLine("run safe templateLoader",true),0) }
                },
                Template_UI_Dialog: {
                    help : "Loads and starts dialog with UI for currently loaded templates",
                    call(){ setTimeout(()=>commandLine("run safe TestFunctionLinkCustomDialog " + FUNCTION_LINK_OBJECT_EXTENSION, true),0) }
                },                
                trackingDialog: {
                    help : "Dialog for tracking animations",
                    info: { disabled: !LOCALS.LOCAL },
                    call(){ setTimeout(()=>commandLine("run safe trackerDialogV2",true),0) }
                },

                SVG_Export: {
                    help: "Opens SVG export dialog",
                    info: { disabled: !LOCALS.LOCAL },
                    call() { setTimeout(()=>commandLine("run safe SVGExport",true),0) }
                },
                GameAnimationExport: {
                    help: "Exports basic animation as JSON file.",
                    info: { disabled: !LOCALS.LOCAL },
                    call() {
                        setTimeout(GameExport.export, 0);

                    }
                },
                "-----------------------------   ": { help: "A spacer", call(){} },
                GameSpriteExporter: {
                    help: "Exports Sprites using attachement rules",
                    info: { disabled: !LOCALS.LOCAL },
                    call() {
                        SpriteSheetExporter.exportSimple = false;
                        if (selection.length === 1) {
                            setTimeout(SpriteSheetExporter.export, 0);
                            return;
                        }
                        const eSprs = [];
                        selection.eachOfType(spr => eSprs.push(spr), "image");
                        selection.save();
                        selection.clear();
                        var count = 0;
                        var next;
                        function waitForIt() {
                            if (SpriteSheetExporter.busy) {
                                count ++;
                                if (count > 100) {
                                    log.warn("Game Sprite Export timed out.");
                                    selection.clear();
                                    selection.restore();
                                    return
                                }
                                setTimeout(waitForIt, 250);
                            } else {
                                if (next === undefined && eSprs.length) {
                                    next = eSprs.pop();
                                    selection.clear();
                                    selection.add(next)
                                    setTimeout(SpriteSheetExporter.export, 0);
                                    setTimeout(waitForIt, 250);
                                    next = undefined;
                                } else {
                                    log("All done'");
                                    selection.clear();
                                    selection.restore();
                                }
                            }
                        }
                        waitForIt();

                    }
                },
                GameSceneExporterV2: {
                    help: "Exports Aoids game scene V2\nMay not be loadable by Groover V3",
                    info: { disabled: !LOCALS.LOCAL },
                    call() {
                        if (selection.length && !this.saveStarted) {
                            this.saveStarted = true;
                            var oldName = sprites.sceneName;
                            var base;
                            var bases = [...selection];
                            var sel = [...bases];
                            const waitForIt = () => {
                                if (oldName != sprites.sceneName) {
                                    setTimeout(waitForIt, 1000);
                                    return;
                                }
                                log("Exporter saved Game Scene as " + base.name);
                                if (bases.length) {
                                    exportAttached();
                                    return;
                                }
                                this.saveStarted = false;
                                spriteList.saveAll_saveImages = true;
                                selection.clear();
                                selection.add(sel);
                                log("Game Scene Exporter all done");
                            }
                            const exportAttached = () => {
                                base = bases.shift();
                                const sel = [base];
                                sprites.each(spr => {
                                    if (spr.type.linked) {
                                        if (spr.linked === base) {
                                            sel.push(spr);
                                        } else if (spr.linked.type.linked && spr.linked.linked === base) {
                                            sel.push(spr);
                                        }
                                    }
                                });
                                selection.clear();
                                selection.add(sel);

                                sprites.saveSceneName(base.name);
                                issueCommand(commands.spritesSaveSelected);
                                setTimeout(waitForIt, 1000);
                            }
                            spriteList.saveAll_saveImages = false;
                            exportAttached();
                        } else {
                            log.warn("Nothing selected to save");
                        }
                    }
                },
                GameRockLayoutLocator: {
                    help: "Exports Json containing location of sprites within within sprite.\nSprites within must be joined to the containing sprite",
                    info: { disabled: !LOCALS.LOCAL },
                    call() { setTimeout(SpriteSheetExporter.AoidsRockLocationExport, 0); }

                },
                GameSpriteLocator: {
                    help: "Locates syb sprites attached to Aoids sprite sheet",
                    info: { disabled: !LOCALS.LOCAL },
                    call() { setTimeout(()=> { SpriteSheetExporter.export(false) }, 0); }
                },
                GameSceneExporterV1: {
                    help: "Exports Aoids game scene V1",
                    info: { disabled: !LOCALS.LOCAL },
                    call() { setTimeout(SpriteSheetExporter.exportScene, 0); }
                },
                "-----------------------------  ": { help: "A spacer", call(){} },
                SaveShaderToyImage: {
                    help: "Experiment to save image as compressed text formated data for use in shader toy",
                    info: { disabled: !LOCALS.LOCAL },
                    call() {
                        var palletSpr;
                        var palletIdx = selection.eachOfType(spr => {
                            if (spr.linkers) {
                                for (const linked of spr.linkers) {
                                    if (linked.type.pallet) {
                                        palletSpr = linked;
                                        return true;
                                    }
                                }
                            }
                        }, "image");
                        if (palletIdx !== undefined) {
                            const pallet = palletSpr.pallet;
                            utils.processSelectedImages(localProcessImage.SaveShaderToyImage, pallet);
                        } else {
                            log.warn("At least one image must be linked to a pallet");
                        }
                    }
                },
                SpriteLocationExporter: {
                    help: "Exports JS of sprite positions set by joiner links",
                    info: { disabled: !LOCALS.LOCAL },
                    call() {
                        SpriteSheetExporter.exportSimple = true;
                        if (selection.length === 1) {
                            setTimeout(SpriteSheetExporter.export, 0);
                            return;
                        }
                        const eSprs = [];
                        selection.eachOfType(spr => eSprs.push(spr), "image");
                        selection.save();
                        selection.clear();
                        var count = 0;
                        var next;
                        function waitForIt() {
                            if (SpriteSheetExporter.busy) {
                                count ++;
                                if (count > 100) {
                                    log.warn("Game Sprite Export timed out.");
                                    selection.clear();
                                    selection.restore();
                                    return
                                }
                                setTimeout(waitForIt, 250);
                            } else {
                                if (next === undefined && eSprs.length) {
                                    next = eSprs.pop();
                                    selection.clear();
                                    selection.add(next)
                                    setTimeout(SpriteSheetExporter.export, 0);
                                    setTimeout(waitForIt, 250);
                                    next = undefined;
                                } else {
                                    log("All done'");
                                    selection.clear();
                                    selection.restore();
                                }
                            }
                        }
                        waitForIt();

                    }
                },
                "----------------------------- ": { help: "A spacer", call(){} },

                Image_As_Data_URL : {
                    help : "Save selected images as data URL",
                    call() {
                        if(selection.length > 0){
                            var count = 0;
                            selection.eachImage(spr => {
                                try {
                                    count ++;
                                    let tCan = $("canvas",{width: spr.image.w, height: spr.image.h});
                                    let ctx = tCan.getContext("2d");
                                    ctx.drawImage(spr.image,0,0);
                                    downloadText(tCan.toDataURL(), spr.image.desc.name);
                                    ctx = tCan = undefined;
                                }catch(e){
                                    log.info("Could not convert image '"+spr.image.desc.name+ "' to data URL");
                                }
                            });
                            if(count === 0){
                                log.warn("No images selected");
                            }

                        }else{
                            log.warn("No images selected");
                        }
                    }
                },
                ...(LOCALS.LOCAL ? {
                    imageBrushes: (() => {
                        const brushFold = {
                            foldInfo: {},
                            useDefaultBrush: {
                                help: "Clears current image brush and uses default image brush.",
                                call() {
                                    pens.setBrushImage();
                                    log.info("Sprite set to default brush image.");
                                },
                            },
                            defineImageBrush: {
                                help: "Use currently selected sprite (one only) as image brush for painting.",
                                call(){
                                    var found = false;
                                    selection.eachImage(spr => {
                                        if (!found) {
                                            pens.setBrushImage(spr);
                                            found = true;
                                        }
                                    });
                                    if(found) {
                                        log.info("Sprite set to brush image.");
                                    } else {
                                        log.warn("No selected sprite with image found. Brush unchanged!");
                                    }
                                }
                            },
                        };
                        const brushes = new Directory(NAMED_DIRECTORIES.brushs);
                        brushes.getFiles("png")
                            .then(() => {
                                brushes.files.forEach(file => {
                                    const name = file.name.replace("." + file.type,"");
                                    brushFold.foldInfo.fold.addFoldObject({[name] : {
                                        help : "Load and use image brush " + name,
                                        call(){
                                            const img = new Image();
                                            img.src = file.toURL(brushes);
                                            img.addEventListener("load",() => {
                                                pens.setImageBrush(img);
                                                log.info("Image brush " + name + " set!");
                                            }, {once: true});

                                        },
                                    }});
                                })
                            })

                        return brushFold;

                    })(),
                } : {
                    imageBrushes: {
                        foldInfo: {},
                        useDefaultBrush: {
                            help: "Clears current image brush and uses default image brush.",
                            call() {
                                pens.setBrushImage();
                                log.info("Sprite set to default brush image.");
                            },
                        },
                        defineImageBrush: {
                            help: "Use currently selected sprite (one only) as image brush for painting.",
                            call(){
                                var found = false;
                                selection.eachImage(spr => {
                                    if (!found) {
                                        pens.setBrushImage(spr);
                                        found = true;
                                    }
                                });
                                if(found) {
                                    log.info("Sprite set to brush image.");
                                } else {
                                    log.warn("No selected sprite with image found. Brush unchanged!");
                                }
                            }
                        },
                                      
                        extraImageBrushes: {
                            help : "GitHub Pages does not support directory listing required for extra brushes\nThis feature has been disabled.",
                            info: { disabled: true },
                            call(){}
                        },
                    }
                }),
                pallets : {
                    save : {
                        help : "Saves selected pallets as json files\nNote empty pallets are ignored.",
                        call(){
                            if(selection.length === 0){ log.warn("Nothing selected") }
                            var count = 0;
                            selection.eachOfType(spr => {
                                if(spr.pallet.length > 0){
                                    spr.pallet.save(spr.name);
                                    count ++;
                                }
                            }, "pallet");
                            if(count > 0){
                                log.info("Downloading "+count+" pallets");
                            }else{
                                log.warn("No pallets found, or pallets were empty");
                            }
                        },

                    },
                    createBlackWhite : {
                        help : "Create 2 colour black and white pallet",
                        call(){
                            selection.setSilent(true);
                            issueCommand(commands.edSprCreatePallet);
                            selection[0].pallet.addColor(0,0,0);
                            selection[0].pallet.addColor(255,255,255);
                            selection[0].pallet.clean();
                            selection[0].setScale(8,8);
                            selection.setSilent(false);
                            issueCommand(commands.edSprUpdateAll);

                        }
                    },
                    Create_R_G_B_Y_C_M_B_W : {
                        help : "Create basic 8 colour pallet red, green, blue, yellow, cyan, magenta, black, and white",
                        call(){
                            selection.setSilent(true);
                            issueCommand(commands.edSprCreatePallet);
                            selection[0].pallet.addColor(0,0,0);
                            selection[0].pallet.addColor(255,0,0);
                            selection[0].pallet.addColor(0,255,0);
                            selection[0].pallet.addColor(0,0,255);
                            selection[0].pallet.addColor(255,255,0);
                            selection[0].pallet.addColor(0,255,255);
                            selection[0].pallet.addColor(255,0,255);
                            selection[0].pallet.addColor(255,255,255);
                            selection[0].pallet.clean();
                            selection[0].setScale(8,8);
                            selection.setSilent(false);
                            issueCommand(commands.edSprUpdateAll);

                        }
                    },
                    Create_Half_R_G_B_Y_C_M_B_W : {
                        help : "Create basic 15 colour pallet red, green, blue, yellow, cyan, magenta, black, and white\nas pairs light dark",
                        call(){
                            selection.setSilent(true);
                            issueCommand(commands.edSprCreatePallet);
                            selection[0].pallet.addColor(0,0,0);
                            selection[0].pallet.addColor(255,0,0);
                            selection[0].pallet.addColor(0,255,0);
                            selection[0].pallet.addColor(0,0,255);
                            selection[0].pallet.addColor(255,255,0);
                            selection[0].pallet.addColor(0,255,255);
                            selection[0].pallet.addColor(255,0,255);
                            selection[0].pallet.addColor(255,255,255);
                            selection[0].pallet.addColor(180,0,0);
                            selection[0].pallet.addColor(0,180,0);
                            selection[0].pallet.addColor(0,0,180);
                            selection[0].pallet.addColor(180,180,0);
                            selection[0].pallet.addColor(0,180,180);
                            selection[0].pallet.addColor(180,0,180);
                            selection[0].pallet.addColor(180,180,180);
                            selection[0].pallet.clean();
                            selection[0].setScale(8,8);
                            selection.setSilent(false);
                            issueCommand(commands.edSprUpdateAll);

                        }
                    },
                    greyScales : {
                        createGray16 : {
                            help : "Create 16 colour black to white pallet",
                            call(){
                                selection.setSilent(true);
                                issueCommand(commands.edSprCreatePallet);
                                selection[0].pallet.addColor(0,0,0);
                                selection[0].pallet.addColor(0x11,0x11,0x11);
                                selection[0].pallet.addColor(0x22,0x22,0x22);
                                selection[0].pallet.addColor(0x33,0x33,0x33);
                                selection[0].pallet.addColor(0x44,0x44,0x44);
                                selection[0].pallet.addColor(0x55,0x55,0x55);
                                selection[0].pallet.addColor(0x66,0x66,0x66);
                                selection[0].pallet.addColor(0x77,0x77,0x77);
                                selection[0].pallet.addColor(0x88,0x88,0x88);
                                selection[0].pallet.addColor(0x99,0x99,0x99);
                                selection[0].pallet.addColor(0xAA,0xAA,0xAA);
                                selection[0].pallet.addColor(0xBB,0xBB,0xBB);
                                selection[0].pallet.addColor(0xCC,0xCC,0xCC);
                                selection[0].pallet.addColor(0xDD,0xDD,0xDD);
                                selection[0].pallet.addColor(0xEE,0xEE,0xEE);
                                selection[0].pallet.addColor(0xFF,0xFF,0xFF);
                                selection[0].pallet.clean();
                                selection[0].setScale(8,8);
                                selection.setSilent(false);
                                issueCommand(commands.edSprUpdateAll);

                            }
                        },
                        createGray32 : {
                            help : "Create 32 colour black to white pallet",
                            call(){
                                selection.setSilent(true);
                                issueCommand(commands.edSprCreatePallet);
                                for(var i = 0; i < 256; i+= 8){
                                    selection[0].pallet.addColor(i,i,i);
                                }
                                selection[0].pallet.clean();
                                selection[0].setScale(8,8);
                                selection.setSilent(false);
                                issueCommand(commands.edSprUpdateAll);

                            }
                        },
                        createGray64 : {
                            help : "Create 64 colour black to white pallet",
                            call(){
                                selection.setSilent(true);
                                issueCommand(commands.edSprCreatePallet);
                                for(var i = 0; i < 256; i+= 4){
                                    selection[0].pallet.addColor(i,i,i);
                                }
                                selection[0].pallet.clean();
                                selection[0].setScale(8,8);
                                selection.setSilent(false);
                                issueCommand(commands.edSprUpdateAll);

                            }
                        },
                        createGray128 : {
                            help : "Create 128 colour black to white pallet",
                            call(){
                                selection.setSilent(true);
                                issueCommand(commands.edSprCreatePallet);
                                for(var i = 0; i < 256; i+= 2){
                                    selection[0].pallet.addColor(i,i,i);
                                }
                                selection[0].pallet.clean();
                                selection[0].setScale(8,8);
                                selection.setSilent(false);
                                issueCommand(commands.edSprUpdateAll);
                            }
                        },
                        createGray256 : {
                            help : "Create 256 colour black to white pallet",
                            call(){
                                selection.setSilent(true);
                                issueCommand(commands.edSprCreatePallet);
                                for(var i = 0; i < 256; i+= 1){
                                    selection[0].pallet.addColor(i,i,i);
                                }
                                selection[0].pallet.clean();
                                selection[0].setScale(8,8);
                                selection.setSilent(false);
                                issueCommand(commands.edSprUpdateAll);

                            }
                        },
                    },
                    sortByValue : {
                        help : "Sort pallet colors of select pallets by value\n[RIGHT] Click to reverse order",
                        call() {
                            if ((mouse.oldButton & 4) === 4) {selection.eachOfType(spr => spr.pallet.sortBy ="valReverse", "pallet") }
                            else { selection.eachOfType(spr => spr.pallet.sortBy ="val", "pallet") }
                        }
                    },
                    sortByPerceptualValue : {
                        help : "Sort pallet colors of select pallets by perceptual value\n[RIGHT] Click to reverse order",
                        call() {
                            if ((mouse.oldButton & 4) === 4) {selection.eachOfType(spr => spr.pallet.sortBy ="perceptualValReverse", "pallet") }
                            else { selection.eachOfType(spr => spr.pallet.sortBy ="perceptualVal", "pallet") }
                        }
                    },
                    sortByHue : {
                        help : "Sort pallet colors of select pallets by hue\n[RIGHT] Click to reverse order",
                        call() {
                            if ((mouse.oldButton & 4) === 4) {selection.eachOfType(spr => spr.pallet.sortBy ="hueReverse", "pallet") }
                            else { selection.eachOfType(spr => spr.pallet.sortBy ="hue", "pallet") }
                        }
                    },
                    palletPositionsFixed : {
                        help : "Set pallet color position to fixed",
                        call() {
                            var c = 0;
                            selection.eachOfType(spr => {c++; spr.pallet.sortBy ="fixed"}, "pallet");
                            if (c > 0) { log.info("Pallet color positions fixed") }
                        }
                    },
                    layoutSquare : {
                        help : "Sets sprite layout to square",
                        call() { selection.eachOfType(spr => spr.pallet.layout ="square", "pallet") }
                    },
                    layoutDouble: {
                        help : "Sets sprite layout to double",
                        call() { selection.eachOfType(spr => spr.pallet.layout ="double", "pallet") }
                    },
                    layoutLong : {
                        help : "Sets sprite layout to long",
                        call() { selection.eachOfType(spr => spr.pallet.layout ="long", "pallet") }
                    },
                    optimise : {
                        help : "Removes duplicated colors",
                        call() { selection.eachOfType(spr => (spr.pallet.optimize(),spr.pallet.update()), "pallet") }
                    },
                    palletToImage: {
                        help : "Converts selected pallets to images",
                        call(){
                            const newSprites = [];
                            var count = 0;
                            selection.eachOfType(p => {
                                const colors = p.pallet.length;
                                count += 1;
                                media.createImage(colors * 4, 4, "FromPallet "+ p.name, img => {
                                    var sprite = new Sprite(p.x, p.y, colors * 4, 4, "PalletImage");
                                    sprite.changeImage(img);
                                    p.pallet.eachCSS((css, x) => {
                                        img.ctx.fillStyle = css;
                                        img.ctx.fillRect(x * 4, 0, 4, 4);
                                    });
                                    img.update();
                                    newSprites.push(sprite);
                                    sprite.setScale(8,8);
                                    count --;
                                    if(count === 0) {
                                        selection.clear(true);
                                        editSprites.addCreatedSprites(...newSprites);
                                        newSprites.length = 0;
                                    }
                                })
                            }, "pallet");
                        }
                    },
                    imageToPallet: {
                        help : "Creates a pallet from selected images\nEach image height defines color square\n eg height 4 width 16 has 4 colors",
                        call(){
                            const newPallets = [];
                            const iSprs = [];
                            var count = 0;
                            selection.setSilent(true);
                            selection.eachOfType(spr => { if(spr.image.isDrawable) { iSprs.push(spr) } }, "image");
                            selection.clear();
                            for (const spr of iSprs) {
                                issueCommand(commands.edSprCreatePallet);
                                newPallets.push(selection[0]);
                                const pSpr = selection[0];
                                const pallet = pSpr.pallet;
                                selection.clear();
                                const img = spr.image;
                                const w = img.w;
                                const h = img.h;
                                const pixels = img.ctx.getImageData(0,0,w, h);
                                const d = pixels.data;
                                var x = 0,xx,r,g,b,c,yy, a;
                                while (x < w) {
                                    r = 0;
                                    g = 0;
                                    b = 0;
                                    a = 0;
                                    c = 0;
                                    for (xx = x; xx < x + h; xx++) {
                                        for (yy = 0; yy < h; yy++) {
                                            let idx = (xx + yy * w) * 4;
                                            r += d[idx] * d[idx++];
                                            g += d[idx] * d[idx++];
                                            b += d[idx] * d[idx++];
                                            a += d[idx];
                                            c ++;
                                        }
                                    }
                                    if (a / c > 1) {
                                        pallet.addColor((r / c) ** 0.5, (g / c) ** 0.5, (b / c) ** 0.5);
                                    }
                                    x += h;
                                }
                                pallet.clean(false); // false to not sort
                                pSpr.setScale(8,8);

                            }
                            if (newPallets.length) {
                                selection.setSilent(false);
                                selection.add(...newPallets);
                                issueCommand(commands.edSprUpdateAll);
                            }
                            selection.setSilent(false);
                        }


                    },
                    clearColorPallet: {
                        help : "Clear colour menu color pallet. Creates a pallet if removed colors",
                        call(){
                            issueCommand(commands.edSprCreatePallet);
                            const pal = colours.getPallet();
                            for(const col of pal){ selection[0].pallet.addColor(col[0],col[1],col[2]);}
                            selection[0].pallet.clean();
                            selection[0].setScale(8,8);
                            issueCommand(commands.edSprUpdateAll);
                            colours.clearPallet();
                            colours.update();
							colours.flash();
                        }


                    },
                    toColors : {
                        help : "Clear colour menu colors and add selected pallet colors",
                        call(){
                            colours.clearPallet();
                            selection.eachOfType(spr => { spr.pallet.each((r,g,b,i) => { colours.addColor({r,g,b})}) }, "pallet");
                            colours.update();
							colours.flash();

                        }
                    },
                    fromColors : {
                        help : "Create a pallet from the colors menu",
                        call(){
                            selection.setSilent(true);
                            issueCommand(commands.edSprCreatePallet);
                            const pal = colours.getPallet();
                            for(const col of pal){ selection[0].pallet.addColor(col[0],col[1],col[2]);}
                            selection[0].pallet.clean(false); // false to not sort
                            selection[0].setScale(8,8);
                            selection.setSilent(false);
                            issueCommand(commands.edSprUpdateAll);
							colours.flash();

                        }
                    },
                    merge : {
                        help : "Create new pallet containing unique colors in selected pallets",
                        call(){
                            if(selection.length === 0){ log.warn("Nothing selected") }

                            selection.setSilent(true);
                            var pallets = [];
                            var colors = 0;
                            var x = 0, y = 0;
                            selection.eachOfType(spr => {
                                if(spr.pallet.length > 0){
                                    pallets.push(spr.pallet);
                                    x += spr.x;
                                    y += spr.y;
                                }
                                colors += spr.pallet.length;

                            }, "pallet");
                            if(pallets.length === 0 || colors === 0){
                                log.warn("Either no pallets selected or pallets are empty.");
                            }
                            issueCommand(commands.edSprCreatePallet);
                            var nPallet = selection[0].pallet;
                            selection[0].setScale(8,8);
                            selection[0].setPos(x / pallets.length,y / pallets.length);

                            pallets.forEach(pal => {
                                pal.each((r,g,b,i) => {
                                    var idx = nPallet.closestColorIdx(r,g,b,0);
                                    if(idx === -1){
                                        nPallet.addColor(r,g,b);
                                    }
                                })
                            });
                            nPallet.clean();
                            selection.setSilent(false);
                            issueCommand(commands.edSprUpdateAll);
                        }
                    },
                },
                spriteSheats : {
                    saveSheatDetails: {
                        help: "Use names cutters to name and locate sprites on selected sheet",
                        call() {
                            var sprTxt;
                            var nameTxt;
                            var idxNameTxt;
                            var locsTxt;
                            var locationsTxt;
                            var lists;
                            const padNum = v => (""+ v).padStart(4," ");
                            const locate = (spr, cut, list) => {
                                var cx, cy, text;
                                const cName = cut.name;
                                const topLeft = spr.key.toLocalPoint(cut.key.corner(0));
                                const botRight = spr.key.toLocalPoint(cut.key.corner(2));
                                const x = topLeft.x;
                                const y = topLeft.y;
                                const x1 = botRight.x;
                                const y1 = botRight.y;
                                const left = Math.floor(Math.min(x, x1));
                                const right = Math.ceil(Math.max(x, x1));
                                const top = Math.floor(Math.min(y, y1));
                                const bot = Math.ceil(Math.max(y, y1));
                                if (cut.attachers) {
                                    for (const cutLocs of cut.attachers.values())  {
                                        const name = NAMES.clean(cutLocs.name);
                                        const loc = spr.key.toLocalPoint({x: cutLocs.x, y: cutLocs.y})
                                        cx = (loc.x - left).toFixed(1);
                                        cy = (loc.y - top).toFixed(1);
                                        if (name.toLowerCase() === "center") {
                                            text = "{x: " + padNum(left) + ", y: " + padNum(top)+ ", w: " + padNum(right - left) + ", h: " +  padNum(bot - top) + ", cx: " + padNum(cx) + ", cy: " + padNum(cy) + "}, ";
                                        } else {
                                            locationsTxt.push(name + ": {x: " + padNum(cx) + ", y: " + padNum(cy) + "}, ");
                                        }
                                    }
                                }
                                if (text === undefined) {
                                    text = "{x: " + padNum(left) + ", y: " + padNum(top)+ ", w: " + padNum(right - left) + ", h: " +  padNum(bot - top) + "}, ";
                                }

                                const namedText = cName + ": " + text
                                sprTxt.push(text + "// "+ sprTxt.length);
                                nameTxt.push(namedText);
                                if (list) {

                                    list.idxs.push(sprTxt.length - 1);
                                } else {
                                    idxNameTxt.push(cName + ": " + (sprTxt.length - 1) + ",");
                                }
                                foundSprites = true;
                            }

                            if (selection.length > 0) {
                                var str = "";
                                var filename;
                                var foundSprites = false;
                                selection.eachOfType(spr => {
                                    const name = spr.image.desc.name;
                                    filename = filename ?? name;
                                    sprTxt = [];
                                    nameTxt = [];
                                    idxNameTxt = [];
                                    locsTxt = [];
                                    lists = new Map();
                                    str += "//======================================================================================\r\n";
                                    str += "// Sprite " + name + " Image '" + (spr.image.desc.fName ?? spr.image.desc.name)+ "'\r\n";

                                    if (spr.attachers) {
                                        for (const cut of spr.attachers.values())  {
                                            locationsTxt = [];
                                            if (cut.type.cutter) {
                                                const cutName = NAMES.clean(cut.name).toLowerCase();

                                                if (cut.attachers && cutName.endsWith("group")) {
                                                    if (!lists.has(cut.name)) {
                                                        lists.set(cut.name, {name: cut.name, idxs: []});
                                                    }
                                                    const list = lists.get(cut.name);
                                                    for (const cut1 of cut.attachers.values())  {
                                                        locate(spr, cut1, list);
                                                    }
                                                } else {
                                                    locate(spr, cut);
                                                }
                                            }
                                            if (locationsTxt.length) {
                                                locsTxt.push(cut.name + ": { \r\n\t\t" + locationsTxt.join("\r\n\t\t") + "\r\n\t},");
                                            }

                                        }
                                        for (const list of lists.values()) {
                                            idxNameTxt.push(list.name + ": [" + list.idxs.join(", ") + "],");
                                        }
                                        lists.clear();
                                        str += "sprites = [\r\n\t" + sprTxt.join("\r\n\t") + "\r\n];\r\n";
                                        str += "sprites = {\r\n\t" + nameTxt.join("\r\n\t") + "\r\n};\r\n\r\n";
                                        str += "locations = {\r\n\t" + locsTxt.join("\r\n\t") + "\r\n};\r\n\r\n";
                                        str += "names = {\r\n\t" + idxNameTxt.join("\r\n\t") + "\r\n};\r\n\r\n";
                                        str += "//-----------------------------------------------------------------------------------------\r\n\r\n\r\n";
                                    }
                                }, "image");

                                if (foundSprites) {
                                    downloadText(str, filename);
                                } else {
                                    log.warn("Selected sprites could not be used to create sprite sheet dsescription");
                                    log.sys("Use cutters to define sprite position and names");
                                    log.sys("Attach cutters spritesheet image sprite");
                                    log.sys("Cutters attached to cutters attached to spritesheet are grouped");


                                }
                            } else {
                                log.warn("Nothing selected.");
                            }


                        },


                    },
                    extractUnique : {
                        help : "Locates sprites in a sprite sheat, extracting them to individual sprites",
                        call() {
                            if(selection.length === 0) { log.warn("No sprites selected"); return }
                            if(selection.length > 1) {log.warn("Currently only supports one sheet at a time."); return }
                            if(!selection[0].type.image || !selection[0].image.isDrawable){ log.warn("Selected sprite must be drawable") ; return}
                            if(editSprites.drawingModeOn) { log.warn("Only starts with paint pannel closed"); return }
                            log.info("Star5ting ");
                            globalEscape = false;
                            setTimeout(()=>{
                                mouse.pause = true;
                                var done = false;
                                var x = 0;
                                var y = 0;
                                var xx,yy;
                                var img = selection[0].image;
                                var spr = selection[0];
                                var w = img.width;
                                var h = img.height;
                                log("Size " + w + " : " + h);
                                const page = utils.point;
                                const mainCan = view.context.canvas;
                                const cid = globalRenderControl.canvasMouseId;
                                const findNextPixel=()=>{
                                    if(globalEscape) {
                                        done = true;
                                        log.warn("Escaped by client");
                                        mouse.pause = false;
                                        return;
                                    }
                                    while(!done){
                                        if(x >= w){
                                            x = 0;
                                            y += 1;
                                            if(y === h){
                                                done = true;
                                                return;
                                            }
                                        }
                                        var data = img.ctx.getImageData(x,y,w-x,1);
                                        var i = 0;
                                        while(data.data[i + 3] === 0 && i < data.data.length){ i += 4 }
                                        x += i / 4;
                                        if(i < data.data.length){
                                            spr.key.toWorldPoint(x + 0.5, y + 0.5,page)
                                            log.clear();
                                            spr.key.lx = x;
                                            spr.key.ly = y;
                                            //log(spr.key.lx + " : " + spr.key.ly + " == " + spr.key._lx + " : " + spr.key._ly);
                                            //log(page.x + " : " + page.y + " == " + x + " : " + y);
                                            //page.x = xx = spr.key.wx ;
                                            //page.y = yy = spr.key.wy ;
                                            //log(page.x + " : " + page.y);

                                            x += 1;
                                            return;
                                        }
                                    }
                                }

                                const timed = [
                                    ()=>{uiPannelList.paint.toggleShow()},
                                    //()=>{issueCommand(commands.paintPoints)},
                                    //()=>{issueCommand(commands.paintMagicCutter)},
                                    ()=>{if(!paint.diagonalCut){ commands.paintMagicCutter }},
                                    ()=>{colours.alpha = 1},
                                    ()=>{log("Starting scan")},
                                ];
                                function next(){
                                    if(globalEscape) {
                                        done = true;
                                        mouse.pause = false;
                                        log.warn("Escaped by client");

                                    } else if(timed.length) {
                                        setTimeout(()=>{
                                            (timed.shift())();
                                            setTimeout(next,32);
                                        },32);
                                        return;
                                    }else if(!done){
                                        findNextPixel();
                                        if(!done){
                                            mouse.button = 0;
                                            pens.mode.feedback();
                                            extraRenders.clear();

                                            mouse.button = 1;
                                            mouse.captured = cid;
                                            pens.mode.down(cid);
                                            extraRenders.clear();

                                            pens.mode.move(cid);
                                            extraRenders.clear();

                                            spr.key.lx-= 2;
                                            pens.mode.move(cid);
                                            extraRenders.clear();

                                            mouse.button = 0;
                                            pens.mode.up();
                                            extraRenders.clear();

                                            mouse.release(cid)
                                            pens.mode.feedback();
                                            extraRenders.clear();

                                            //view.toScreen(page.x,page.y,page);
                                            //mouse.fakeEvent(0,{type : "mousedown", page ,which : 1, target : mainCan});

                                            globalRenderControl.getFramePromise(()=>{
                                                globalRenderControl.getFramePromise(()=>setTimeout(next,32))
                                            })
                                            return;
                                            globalRenderControl.getFramePromise(()=>{
                                                view.context.setTransform(1, 0, 0, 1, 0, 0);
                                                view.context.fillRect(page.x,page.y,10,10);
                                                view.apply();
                                                view.context.strokeRect(page.x,page.y,10,1);
                                                mouse.fakeEvent(cid,{type : "mousemove",  page , target : mainCan});
                                                globalRenderControl.getFramePromise(()=>{
                                                    page.x -= 14;
                                                    mouse.fakeEvent(cid,{type : "mousemove",  page , target : mainCan});
                                                    globalRenderControl.getFramePromise(()=>{
                                                        mouse.fakeEvent(cid,{type : "mouseup",  page , which : 1, target : mainCan});
                                                        globalRenderControl.getFramePromise(()=>setTimeout(next,32))
                                                    });
                                                });
                                            });
                                            /*globalRenderControl.click(xx,yy,0);
                                            globalRenderControl.click(xx,yy,1);
                                            globalRenderControl.click(xx-2,yy,1);
                                            globalRenderControl.click(xx-2,yy,0);
                                            //log(""+xx+":"+yy);
                                            setTimeout(next,32);*/
                                            return;
                                        }
                                    }
                                    log("Done");
                                    mouse.pause = false;
                                    uiPannelList.paint.toggleShow()
                                }
                                next();



                            },0);


                        },
                    }
                },
                batches : {
                    isometric : {
                        toIsometricHelper : {
                            help : "A dialog that lets you quickly convert a sprite to isometric (pixel art) projection\nSupports many projection types",
                            call(){ setTimeout(()=>commandLine("run safe toIsoMenu",true),0) }
                        },
                        isometricBox : {
                            help : "Lets you create an drawable isometric box",
                            call(){ setTimeout(()=>commandLine("run safe iso",true),0) }
                        },
                        isometricTwoToOneGuides : {
                            help : "Create guides for a 2 to 1 pixelart image\nFitting the currently select sprite. ",
                            call(){ setTimeout(()=>commandLine("run safe isoGrid",true),0) }
                        },
                    },
                    tiles : {
                        imageTiler : {
                            help : "Creates a set of cutters to extract tiles from an image",
                            call(){ setTimeout(()=>commandLine("run safe tileImage",true),0) }
                        }
                    },
                    fun : {
                        imageFlower : {
                            help : "Creates drawable flower template",
                            call(){ setTimeout(()=>commandLine("run safe flower8",true),0) }
                        },



                    },
                },
            },
            ...systemExtras,
        };
        extrasRegistery.appendTo(foldsObj);
        extrasList.addFoldObject( foldsObj );
    }

    keyboard.mapKeyCommand("ArrowUp",{},"global",commands.sysUp);
    keyboard.mapKeyCommand("ArrowDown",{},"global",commands.sysDown);
    keyboard.addModeDetails("editSprites", "Sprite");
    keyboard.addModeDetails("drawing", "Draw");
    keyboard.addModeDetails("animation", "Anim");
    keyboard.addModeDetails("commandLine", "CMD");

    const uiFragment = document.createDocumentFragment();
    const uiFragmentAnim = document.createDocumentFragment();

    const colorPannel = buttons.Pannel(uiFragment,null,{title : "Colour" + textIcons.pallet, activeStyle : "colorPanelOpen"});
    const paintPannel = buttons.Pannel(uiFragment,null,{title : "Paint " + textIcons.pen, activeStyle : "paintPanelOpen"});
    const spritePannel = buttons.Pannel(uiFragment,null,{title : "Sprites" + textIcons.hammerSpanner, activeStyle : "spritesPanelOpen"});
    const animPannel = buttons.Pannel(uiFragmentAnim,null,{noTitle : true, activeStyle : "animPanelOpen"});
    const mediaTabs = buttons.Pannel(uiFragment,[{ name : "media", className: "media"},{ name : "sprites",className: "sprites"},{name : "extras",className: "extras"}],{title : "Media"});
    uiPannelList.color = colorPannel;
    uiPannelList.paint = paintPannel;
    uiPannelList.sprite = spritePannel;
    uiPannelList.anim = animPannel;
    uiPannelList.mediaTabs = mediaTabs;
    colorPannel.addEvent("open",updateDisplaySizer);
    colorPannel.addEvent("close",updateDisplaySizer);
    paintPannel.addEvent("open",updateDisplaySizer);
    paintPannel.addEvent("close",updateDisplaySizer);
    spritePannel.addEvent("open",updateDisplaySizer);
    spritePannel.addEvent("close",updateDisplaySizer);



    const cols = "000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000".split(",").map(c=>"#" + c);

    const Repeats = (rate = 500, mods = "", constantRate = false) => ({repeats: {rate, constantRate, ctrl: mods.includes("c"),  alt: mods.includes("a"), shift: mods.includes("s")}});
    var i= 1;

    /*==Colour menus ================================================================================================================*/
    buttons.mapSliders = true;
    const drawModeQuickSelect = buttons.PannelQuickSelect({preIssueCommand : true});
    var j = 0;

    const drawModeExtras = buttons.create(colours.setButtons([
            {x : 0, y : 0, w : 1, h : 1,dir : "right",
              group : "drawModeExtraGroup", command : commands.drawModeExtra1, sprite : 52 ,className : "buttonSprite", help : "Set  Lighter"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra2, sprite : 53 ,className : "buttonSprite", help : "Set  Multiply"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra3, sprite : 19 ,className : "buttonSprite", help : "Set  Screen"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra4, sprite : 20 ,className : "buttonSprite", help : "Set  overlay"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra5, sprite : 21 ,className : "buttonSprite", help : "Set  color-dodge"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra6, sprite : 22 ,className : "buttonSprite", help : "Set  color-burn"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra7, sprite : 23 ,className : "buttonSprite", help : "Set  hard-light"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra8, sprite : 44 ,className : "buttonSprite", help : "Set  soft-light"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra9, sprite : 45 ,className : "buttonSprite", help : "Set  difference"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra10, sprite : 46 ,className : "buttonSprite", help : "Set  exclusion"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra11, sprite : 47 ,className : "buttonSprite", help : "Set  hue"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra12, sprite : 48 ,className : "buttonSprite", help : "Set  saturation"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra13, sprite : 49 ,className : "buttonSprite", help : "Set  color"},
            { group : "drawModeExtraGroup", command : commands.drawModeExtra14, sprite : 50 ,className : "buttonSprite", help : "Set  luminosity"},
        ]),
        { pannel : drawModeQuickSelect, size : 16,}
    );
    const swatchs = [ {background : "#000", x : 1, y : 0, w : 1, h : 1,dir : "right",command : commands.swatchLow}];
    const swatch = {background : "black", command: commands.swatchLow + i, onDrag: colours.swatchDrag, help: "[LEFT] Click select main\n[RIGHT] Click select second\n[CTRL][SHIFT] Click to delete color"};
    while(i < cols.length){ swatchs.push({...swatch, background: cols[i],command : commands.swatchLow + i++, onDrag : colours.swatchDrag}) }
    keyboard.mode = "drawing";
    swatchs[0].key = "Digit1";
    swatchs[1].key = "Digit2";
    swatchs[2].key = "Digit3";
    swatchs[3].key = "Digit4";
    swatchs[4].key = "Digit5";
    swatchs[5].key = "Digit6";
    swatchs[6].key = "Digit7";
    swatchs[7].key = "Digit8";
    swatchs[8].key = "Digit9";
    swatchs[9].key = "Digit0";
    const mainButtons = buttons.create(colours.setButtons([
            { x : 0, y : 0, w : 1, h : 1,dir : "right",command : commands.scrollSwatchLeft, text : "<"},
            ...swatchs,
            {dir : "right",command : commands.scrollSwatchRight , text : ">"},
            {x :  5, y : 1, w : 10, h : 1,dir : "right",command : commands.redSlider,   slider : { color : "#fff",                  min : 0, max : 255, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x :  5, y : 2, w : 10, h : 1,dir : "right",command : commands.greenSlider, slider : { color : "#fff",                  min : 0, max : 255, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x :  5, y : 3, w : 10, h : 1,dir : "right",command : commands.blueSlider,  slider : { color : "#fff",                  min : 0, max : 255, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x : 15, y : 1, w : 10, h : 1,dir : "right",command : commands.hueSlider,   slider : { color : "#fff", cyclic : true,   min : 0, max : 360, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x : 15, y : 2, w : 10, h : 1,dir : "right",command : commands.satSlider,   slider : { color : "#fff",                  min : 0, max : 255, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x : 15, y : 3, w : 10, h : 1,dir : "right",command : commands.lumSlider,   slider : { color : "#fff",                  min : 0, max : 255, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x :  5, y : 4, w : 10, h : 1,dir : "right",command : commands.alphaSlider, slider : { color : "#fff",                  min : 0, max : 255, step : 1,wStep : 8, value : 255, smallMark : true, mouseAccesKey: MKey_COLOR_SLIDERS}},
            {x : 0, y : 1, w : 2, h : 2,  dir : "right",command : commands.mainColor, command_C_1: commands.swatchToMainColor, group : "currentColors", background : "black",onWheel : colours.mainWheel, help : "Main draw color.\nClick to accept new color\n[CTRL] [LEFT] Click to change selected swatch"},
            {x : 0, y : 3, w : 2, h : 2,  dir : "right",command : commands.secondColor,  group : "currentColors", background : "white",onWheel : colours.secondsWheel, help : "Second color use right button on drawing to use"},
            {x : 2, y : 1, w : 1, h : 1,  dir : "right", group : "drawMode",       sprite : 24 ,className : "buttonSprite",  command : commands.drawModeOver,    help : "Main draw normal mode"},
            {x : 2, y : 2, w : 1, h : 1,  dir : "right", group : "drawMode",       sprite : 25 ,className : "buttonSprite",  command : commands.drawModeErase,   help : "Main draw erase mode"},
            {x : 3, y : 1, w : 1, h : 1,  dir : "right", group : "drawMode",       sprite : 26 ,className : "buttonSprite",  command : commands.drawModeOntop,   help : "Main draw on top  mode"},
            {x : 3, y : 2, w : 1, h : 1,  dir : "right", group : "drawMode",       sprite : 27 ,className : "buttonSprite",  command : commands.drawModeBehind,  help : "Main draw under mode"},
            {x : 4, y : 1, w : 1, h : 1,  dir : "right", group : "drawMode",       sprite : 52 ,className : "buttonSprite",  command : commands.drawModeLighter,quickSelectRight :drawModeQuickSelect, wheelSelect : true, sprites : [52,53,19,20,21,22,23,44,45,46,47,48,49,50,51], help : "Lighten\n[RIGHT] Click to cycle composite modes"},
            {x : 4, y : 2, w : 1, h : 1,  dir : "right", group : "drawMode",       sprite : 53 ,className : "buttonSprite",  command : commands.drawModeDarker, quickSelectRight :drawModeQuickSelect, wheelSelect : true, sprites : [52,53,19,20,21,22,23,44,45,46,47,48,49,50,51], help : "Darker\n[RIGHT] Click to cycle composite modes"},
            {x : 2, y : 3, w : 1, h : 1,  dir : "right", group : "drawModeSecond", sprite : 24 ,className : "buttonSprite",  command : commands.drawModeOverB,    help : "Second draw normal mode"},
            {x : 2, y : 4, w : 1, h : 1,  dir : "right", group : "drawModeSecond", sprite : 25 ,className : "buttonSprite",  command : commands.drawModeEraseB,   help : "Second draw erase mode"},
            {x : 3, y : 3, w : 1, h : 1,  dir : "right", group : "drawModeSecond", sprite : 26 ,className : "buttonSprite",  command : commands.drawModeOntopB,   help : "Second draw on top  mode"},
            {x : 3, y : 4, w : 1, h : 1,  dir : "right", group : "drawModeSecond", sprite : 27 ,className : "buttonSprite",  command : commands.drawModeBehindB,  help : "Second draw under mode"},
            {x : 4, y : 3, w : 1, h : 1,  dir : "right", group : "drawModeSecond", sprite : 52 ,className : "buttonSprite",  command : commands.drawModeLighterB, quickSelectRight :drawModeQuickSelect, wheelSelect : true, sprites : [52,53,19,20,21,22,23,44,45,46,47,48,49,50,51], help : "Lighten\n[RIGHT] Click to cycle composite modes"},
            {x : 4, y : 4, w : 1, h : 1,  dir : "right", group : "drawModeSecond", sprite : 53 ,className : "buttonSprite",  command : commands.drawModeDarkerB, quickSelectRight :drawModeQuickSelect, wheelSelect : true, sprites : [52,53,19,20,21,22,23,44,45,46,47,48,49,50,51], help : "Darker\n[RIGHT] Click to cycle composite modes"},
            {x : 15, y : 4, w : 1, h : 1, sprite : 54 ,group : "colorPick" , key : "KeyC",className : "buttonSprite",  command : commands.colorPicker,  help : "Use to select color from images"},
            {x : 16, y : 4, w : 1, h : 1, sprite : 104 ,group : "HSLColorRange" , className : "buttonSprite",  command : commands.useHSLColorRange,  help : "Toggle color ranging blend between HSL and RGB modes"},
            {x : 17, y : 4, w : 1, h : 1, sprite : 110 ,className : "buttonSprite",  command : commands.setBackgroundColor,  help : "Set BG color\n[RIGHT] Click set and save BG color\n[CTRL] Click get BG color"},
            {x : 18, y : 4, w : 1, h : 1, sprite : 55 ,className : "buttonSprite",  command : commands.setSpriteColor,  help : "Set sprite color\n[CTRL] Click get sprite color"},
            {x : 19, y : 4, w : 1, h : 1, sprite : 166 ,className : "buttonSprite",  command : commands.setSnapGridColor,  help : "Set grid color\n[RIGHT] Click set and save grid color\n[CTRL] Click get grid color"},
            {x : 20, y : 4, w : 1, h : 1, sprite : 111 ,className : "buttonSprite",  command : commands.setImageBGColor,  help : "Fills the currently selected image background using the main color.\nUse this when saving JPEG images that have transparent pixels"},
            {x : 24, y : 4, w : 1, h : 1,  text : "D" ,  command : commands.setPalletDefault,  help : "Sets the current pallet as the default pallet for this session."},
        ]), {pannel : colorPannel,size : 16}
    );
    keyboard.mapKeyCommand("KeyD",{},"drawing",commands.colorsPrevSwatch);
    keyboard.mapKeyCommand("KeyE",{},"drawing",commands.colorsNextSwatch);
    keyboard.mapKeyCommand("KeyW",{},"drawing",commands.colorsHueUp);
    keyboard.mapKeyCommand("KeyQ",{},"drawing",commands.colorsHueDown);
    keyboard.mapKeyCommand("KeyS",{},"drawing",commands.colorsSatUp);
    keyboard.mapKeyCommand("KeyA",{},"drawing",commands.colorsSatDown);
    keyboard.mapKeyCommand("KeyX",{},"drawing",commands.colorsLighter);
    keyboard.mapKeyCommand("KeyZ",{},"drawing",commands.colorsDarker);
    keyboard.mapKeyCommand("KeyC",{},"global",commands.colorPickerCommit);
    //keyboard.mapKeyCommand("KeyI",{ctrl: true},"global",commands.sysHideUIToggle);



     keyboard.mode = "editSprites";
    /*==Media menus================================================================================================================*/
    var mediaButtons;
     var ix = 1/20;
    buttons.create(mediaList.setButtons(mediaButtons = [
            {x : 0, y : 20/16, w : 18, h : 10,dir : "right",command : commands.media,  list : {}},
        ]), { pannel : mediaTabs.media, size : 16, }
    );
    buttons.create(mediaList.setButtons([
            { x: ix,        y: 0, w: 1,   h: 1, command: commands.mediaSaveJpg,            text: textIcons.save,    help : "Save selected images as jpeg\n[RIGHT] Click to store image in RAM"},
            { x: ix += 1,   y: 0, w: 1,   h: 1, command: commands.mediaSavePng,            text: textIcons.saveDVD, help : "Save selected images as png"},
            { x: ix += 1,   y: 0, w: 1,   h: 1, command: commands.mediaSelectFromSelected, text: textIcons.list,    help : "Selects media used by selected sprites\n[RIGHT] Click select sprites with selected media"},
            { x: ix += 1,   y: 0, w: 1,   h: 1, command: commands.mediaReorder,            text: "O",               help : "Order as selected\n[RIGHT] Click to reverse order"},
            { x: ix += 1.2, y: 0, w: 1,   h: 1, command: commands.mediaDeleteImage,        html: textIcons.delete,  help : "Delete selected media item\n[CTRL] Click removes unused media"},
            { x: ix += 1.2, y: 0, w: 1,   h: 1, command: commands.spritesToDrawable,       text: textIcons.pallet,  help : "Converts media on selected sprites to drawable"},
            { x: ix += 1,   y: 0, w: 1.2, h: 1, command: commands.mediaSelectAll,          text: "All",             help : "Select all media items\n[RIGHT] Click to unselect all"},
            { x: ix += 1.2, y: 0, w: 1.2, h: 1, command: commands.mediaSelectInvert,       text: "Inv",             help : "Invert media selected"},
            { x: ix += 1.2, y: 0, w: 1.5, h: 1, command: commands.mediaAddToWorkspace,     text: "Add",             help : "Adds selected media to workspace"},
            { x: ix += 1.5, y: 0, w: 2,   h: 1, command: commands.mediaSetToCutBuffer,     text: "Copy",            help : "Copy first selected item to cut buffer\n[RIGHT] Click Copy first selected item to pattern buffer"},
            { x: ix += 2,   y: 0, w: 1,   h: 1, command: commands.mediaGetFromCutBuffer,   text: "P",               help : "Creates new media item from cut buffer\n[RIGHT] Click Creates new media item from pattern buffer"},
            { x: ix += 1,   y: 0, w: 1,   h: 1, command: commands.mediaImageToClipboard,   text: textIcons.outbox,  help : "Copy selected image to clipboard"},
            { x: ix += 1,   y: 0, w: 1.5, h: 1, command: commands.mediaSetSpriteImage,     text: "Img",             help : "Change selected sprites to selected image"},
            { x: ix += 1.5, y: 0, w: 1.5, h: 1, command: commands.mediaSetVideoSrc,        text: "Vid",             help : "Convert selected drawable to video source"},
            { x: ix += 1.5, y: 0, w: 1,   h: 1, command: commands.mediaImageZoomSendToTab, text: "Z",               help : "Send selected image to Image Zoom2 extention viewer"},

        ]), { pannel : mediaTabs.media, size : 20, }
    );

    /*== Sprite list menus================================================================================================================*/
    var spriteButtons;
    var ix = 1/20;
    buttons.create(spriteList.setButtons(spriteButtons = [
            {x : 0, y : 20/16, w : 18, h : 10,dir : "right",command : commands.sprites,  list : {}},
        ]), { pannel : mediaTabs.sprites, size : 16 });
    buttons.create(spriteList.setButtons([
            { x: ix     ,   y: 0, w: 1,    h: 1, command: commands.spritesShowSprites,     text: "S",  group: "spriteListShowType", className: "subtab",            help: "Show sprites"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesShowCollections, text: "C",  group: "spriteListShowType", className: "subtab",            help: "Show collections"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesShowGroups,      text: "G",  group: "spriteListShowType", className: "subtab",            help: "Show groups"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesShowLayers,      text: "L",  group: "spriteListShowType", className: "subtab",            help: "Show layers"},
            { x: ix += 1,   y: 0, w: 1.2,  h: 1, command: commands.spritesSelectAll,       text: "All",command__4: commands.spritesUnselectAll, key : "KeyA[c]",    help: "Select all sprites\n[RIGHT] Click unselect all"},
            { x: ix += 1.2, y: 0, w: 1.2,  h: 1, command: commands.spritesSelectInvert,    text: "Inv",                                                             help: "Invert sprite selection"},
            { x: ix += 1.2, y: 0, w: 1,    h: 1, command: commands.spritesShowSelected,    text: textIcons.magnifyingGlass,                                         help: "Scroll selected sprite/s into view\n[RIGHT] toggle enable auto scroll to selected sprite"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesGroup,           text: textIcons.grouped,                                                 help: "Group sselected sprites\n[RIGHT] Click copy ungroup sprites in selected group"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesUngroup,         text: textIcons.ungrouped,                                               help: "Ungroup"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesCollect,         text: textIcons.inDraw,                                                  help: "Collect selected sprite\n[RIGHT] Click remove from selected user collection\n[CTRL] Click to add selected sprites to selected user collection"},
            { x: ix += 1,   y: 0, w: 1,    h: 1, command: commands.spritesUncollect,       text: textIcons.outDraw,                                                 help: "Remove selected collection"},
            { x: ix += 2,   y: 0, w: 1,    h: 1, command: commands.spritesToggleToDraw,    text: textIcons.pen,key : "KeyD[c]",                                     help: "Selected drawable sprites are toggled in and out of drawing mode"},
            { x: ix += 2,   y: 0, w: 1,    h: 1, command: commands.spritesSaveAll,         command_C_1: commands.spritesSaveSelected,      text: textIcons.save,    help: "Save scene\n[CTRL] Click to save selected only"},
            { x: ix += 1.25,   y: 0, w: 1,    h: 1, command: commands.spritesSaveAllLocal,    command_C_1: commands.spritesSaveSelectedLocal, text: textIcons.saveAll, help: "Save scene to local storage\n[CTRL] Click to save selected only"},
            { x: ix += 1.25,   y: 0, w: 1,    h: 1, command: commands.spritesLoadFromLocal,   text: textIcons.outDraw,                                                 help: "Load sprites from local storage"},
        ]), {pannel : mediaTabs.sprites, size : 20, });

    /*==Extras list menus===============================================================================================================*/
    var extrasButtons
    buttons.create(extrasList.setButtons(extrasButtons = [
            {x : 0, y : 20/16, w : 18, h : 10,dir : "right",command : commands.extras,  list : {}},
        ]), { pannel : mediaTabs.extras, size : 16 });
    buttons.create(extrasList.setButtons([
            { x : 0, y : 0, w : 4, h : 1, command : commands.extrasOption1,text : "?", help : ""},
            { x : 4, y : 0, w : 4, h : 1, command : commands.extrasOption2,text : "?", help : ""},
            { x : 8, y : 0, w : 4, h : 1, command : commands.extrasOption3,text : "?", help : ""},
            { x : 12, y : 0, w : 4, h : 1, command : commands.extrasOption4,text : "?", help : ""},
        ]), {pannel : mediaTabs.extras, size : 20, });

    /*==Timeline menus================================================================================================================*/
    const timelineMaxTracks = settings.timelineMaxTracks;
     keyboard.mode = "animation";
    keyboard.mapKeyCommand("KeyX",{shift: true},"animation",commands.animSetKeyPos);
    keyboard.mapKeyCommand("KeyS",{shift: true},"animation",commands.animSetKeyScale);
    keyboard.mapKeyCommand("KeyR",{shift: true},"animation",commands.animSetKeyRotate);
    keyboard.mapKeyCommand("KeyA",{shift: true},"animation",commands.animSetKey_a);
    keyboard.mapKeyCommand("KeyI",{shift: true},"animation",commands.animSetKey_image);
    keyboard.mapKeyCommand("KeyC",{shift: true},"animation",commands.animSetKey_rgb);
    keyboard.mapKeyCommand("KeyA",{ctrl: true},"animation",commands.animSelectAllKeys);
    keyboard.mapKeyCommand("KeyX",{ctrl: true},"animation",commands.animCutSelectedKeys);
    keyboard.mapKeyCommand("KeyC",{ctrl: true},"animation",commands.animCopySelectedKeys);
    keyboard.mapKeyCommand("KeyV",{ctrl: true},"animation",commands.animPasteSelectedKeys);
    keyboard.mapKeyCommand("KeyV",{ctrl: true, shift: true},"animation",commands.animPasteSelectedKeysAtTime);

    keyboard.mapKeyCommand("ArrowLeft",{},"animation",commands.animGotoPrevFrame);
    keyboard.mapKeyCommand("ArrowRight",{},"animation",commands.animGotoNextFrame);
    keyboard.mapKeyCommand("BracketLeft",{},"animation",commands.animGotoNextFrameLoop);
    keyboard.mapKeyCommand("ArrowLeft",{shift:true},"animation",commands.animGotoPrevKey);
    keyboard.mapKeyCommand("ArrowRight",{shift:true},"animation",commands.animGotoNextKey);
    keyboard.mapKeyCommand("KeyP",{},"animation",commands.animPlayPause);
    /* Not optional in this version */
    const showTrackMarkUI = false; //settings.ShowTrackMark_UI;
    const showFrameStepUI = false; //settings.ShowFrameStep_UI;
    
    const trackWidth = 150;
    var iy = 26 / 21;
    var ix = 0;
    buttons.create(timeline.setButtons([
            {x: ix,         y: iy, w: 1,   h: 1, command: commands.animSelectAllTracks,      sprite: 65,                   className: "buttonSprite", help: "Select all tracks"},
            {x: ix += 1,    y: iy, w: 1,   h: 1, command: commands.animSelectInvertTracks,   sprite: 64,                   className: "buttonSprite", help: "Invert selected tracks"},
            {x: ix += 1,    y: iy, w: 1,   h: 1, command: commands.animTrackCompactToggle,   sprite: 29, sprites: [29,23], className: "buttonSprite", help: "Toggle compact timeline"},
            {x: ix += 1,    y: iy, w: 1,   h: 1, command: commands.animRemoveSelectedTracks, sprite: 28,                   className: "buttonSprite", help: "Remove selected tracks"},
            {x: ix += 1,    y: iy, w: 3,   h: 1, command: commands.animStartTime,            text: "0",                                               help: "Start time\n[RIGHT] Click to set Loop Start"},
            {x: ix += 3,    y: iy, w: 3,   h: 1, command: commands.animEndTime,              text: "0",                                               help: "End time\n[RIGHT] Click to set Loop End"},
            ...(showTrackMarkUI ? [
                {x: ix += 3,    y: iy, w: 1,   h: 1, command: commands.animGotoPrevMark,         key: "Comma",  sprite:  1 ,className: "buttonSprite", help: "Move time to nearest mark below this time"},
                {x: ix += 1,    y: iy, w: 2.5, h: 1, command: commands.animAddMark,              text: "Add",                                          help: "Shows mark name\nClick adds mark\n[RIGHT] Click remove mark\n[SHIFT][RIGHT] Click removes all marks\n[CTRL] Click prime toggle. Click again to start"},
                {x: ix += 2.5,  y: iy, w: 1,   h: 1, command: commands.animGotoNextMark,         key: "Period", sprite:  4 ,className: "buttonSprite", help: "Move to the next mark"},
            ] : (ix += 2.0, [])),
            {x: ix += 1   , y: iy, w: 1, h: 1, dir: "right",
             command: commands.animGotoStart     ,sprite:  0 ,                                          className: "buttonSprite", help: "Goto first frame"},
            {command: commands.animGotoPrevFrame ,sprite:  1 , sprites: [1, 24], ...Repeats(500, "c"),  className: "buttonSprite", help: ["Prev frame","Step record prev frame\nIf no frames recorde then captures this frame\n[CTRL] Click step to prev frame"]},
            {command: commands.animGotoPrevKey   ,sprite: 19 , key: "ArrowLeft[s]",                     className: "buttonSprite", help: "Set time to selected prev key"},
            {command: commands.animStop          ,sprite:  2 , sprites: [2, 27],                        className: "buttonSprite", help: ["Stop and return to start","Stop recording video"]},
            {command: commands.animPlayPause     ,sprite:  3 , key: "KeyP[]", sprites: [3, 25],         className: "buttonSprite", help: ["Toggle play/pause","Start step recording video source"]},
            {command: commands.animGotoNextKey   ,sprite: 20 , key: "ArrowRight[s]",                    className: "buttonSprite", help: "Set time to selected next key"},
            {command: commands.animGotoNextFrame ,sprite:  4 , sprites: [4, 26],  ...Repeats(500, "c"), className: "buttonSprite", help: ["Prev frame","Step record next frame\nIf no frames recorde then captures this frame\n[CTRL] Click step to next frame"]},
            {command: commands.animGotoEnd       ,sprite:  5 ,                                          className: "buttonSprite", help: "Goto last frame"},
            ...(showFrameStepUI ? [
                {x: ix += 8,    y: iy, w: 1, h: 1, command: commands.animDecreaseFrameStep, sprite:  41,    className: "buttonSprite", help: "Decrease frame step value"},
                {x: ix += 1,    y: iy, w: 1, h: 1, command: commands.animFrameStep,         text: "1",                                 help: "Current frame step value\n[RIGHT] Click to reset to 1"},
                {x: ix += 1,    y: iy, w: 1, h: 1, command: commands.animIncreaseFrameStep, sprite:  42,    className: "buttonSprite", help: "Increase frame step value"},
            ] : (ix += 7, [])),
            {x: ix += 1,    y: iy, w: 1, h: 1, command: commands.animRemoveAllKeys,     sprite:  7,     className: "buttonSprite", help: "Remove all selected keys"},
            {x: ix += 1,    y: iy, w: 1, h: 1, dir: "right",
             command: commands.animSetTrackLoop,     sprite:  36, sprites: [36, 37, 36 + 44, 37 + 44],                           className: "buttonSprite", help: "Toggle selected tracks loop"},
            {command: commands.animSetTrackPingPong, sprite:  38, sprites: [38, 40, 39, 35, 38 + 44, 40 + 44, 39 + 44, 35 + 44], className: "buttonSprite", help: "Cycle selected tracks loop type"},
            { x: ix += 2, y: iy, w: 1, h: 1, command: commands.animSelectAllKeys, key: "KeyA[c]", sprite: 21,                 className: "buttonSprite", help: "Select all keyframes\n[RIGHT] Click toggle select keys at time\n[CTRL][RIGHT] Click select add / remove keys at time\n[SHIFT][RIGHT] Click select range  of key from last\n[SHIFT][CTRL][RIGHT] Click range select add keys\n[SHIFT] Click clear selected key"},
            { x: ix += 1, y: iy, w: 1, h: 1, dir: "right",
             command: commands.animSetKeyPos,    command_C_1: commands.animFilterKeyPos,    group: "animKeyTypes", sprite:  8, className: "buttonSprite", key:"KeyX[]", help: "[LEFT] Add key XY coordinate\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKeyScale,  command_C_1: commands.animFilterKeyScale,  group: "animKeyTypes", sprite:  9, className: "buttonSprite", key:"KeyS[]", help: "[LEFT] Add key scale XY\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKeyRotate, command_C_1: commands.animFilterKeyRotate, group: "animKeyTypes", sprite: 10, className: "buttonSprite", key:"KeyR[]", help: "[LEFT] Add key rotate XY\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_x,     command_C_1: commands.animFilterKey_x,     group: "animKeyTypes", sprite: 11, className: "buttonSprite",               help: "[LEFT] Add key X coordinate\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_y,     command_C_1: commands.animFilterKey_y,     group: "animKeyTypes", sprite: 12, className: "buttonSprite",               help: "[LEFT] Add key Y coordinate\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_sx,    command_C_1: commands.animFilterKey_sx,    group: "animKeyTypes", sprite: 13, className: "buttonSprite",               help: "[LEFT] Add key scale X\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_sy,    command_C_1: commands.animFilterKey_sy,    group: "animKeyTypes", sprite: 14, className: "buttonSprite",               help: "[LEFT] Add key scale Y\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_rx,    command_C_1: commands.animFilterKey_rx,    group: "animKeyTypes", sprite: 15, className: "buttonSprite",               help: "[LEFT] Add key rotate X\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_ry,    command_C_1: commands.animFilterKey_ry,    group: "animKeyTypes", sprite: 16, className: "buttonSprite",               help: "[LEFT] Add key rotate Y\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_a,     command_C_1: commands.animFilterKey_a,     group: "animKeyTypes", sprite: 17, className: "buttonSprite", key:"KeyA[]", help: "[LEFT] Add Alpha key\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_image, command_C_1: commands.animFilterKey_image, group: "animKeyTypes", sprite: 18, className: "buttonSprite",               help: "[LEFT] Add Image key\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            {command: commands.animSetKey_rgb,   command_C_1: commands.animFilterKey_rgb,   group: "animKeyTypes", sprite: 30, className: "buttonSprite", key:"KeyC[]", help: "[LEFT] Add RGB key\n[RIGHT] to remove\n[CTRL] Click to toggle key filter"},
            { x: ix+= 12, y: iy, w: 1, h: 1, dir: "right",
             command: commands.animKeyCurveLinear     ,group: "animKeyCurves", sprite: 44, sprites: [44],                     className: "buttonSprite", help: "Set selected keys curve to linear"},
            {command: commands.animKeyCurveEaseOut    ,group: "animKeyCurves", sprite: 45, sprites: [45, 46, 47, 48, 49, 50], className: "buttonSprite", help: "Set selected keys curve to ease out"},
            {command: commands.animKeyCurveEaseInOut  ,group: "animKeyCurves", sprite: 51, sprites: [51, 52, 53, 54, 55, 56], className: "buttonSprite", help: "Set selected keys curve to ease in out"},
            {command: commands.animKeyCurveEaseIn     ,group: "animKeyCurves", sprite: 57, sprites: [57, 58, 59, 60, 61, 62], className: "buttonSprite", help: "Set selected keys curve to ease in"},
            {command: commands.animKeyCurveStep       ,group: "animKeyCurves", sprite: 63, sprites: [63],                     className: "buttonSprite", help: "Set selected keys curve to step"},
            {x: ix += 5,    y: iy, w: 4, h: 1, command: commands.animRecallKeySelection, selection: {items: ["--------"], itemHelp: "Select store key selection", index: 0, className: "small"},       help: "Recall named key selection"},
            {x: ix += 4,    y: iy, w: 1, h: 1, command: commands.animStoreKeySelection,  sprite:  43, sprites: [43],                                                        className: "buttonSprite", help: "Save key selection\n[CTRL] Click adds selected key to current"},
         ]), { pannel : animPannel, size : 21, }
    );

    buttons.create(timeline.setButtons([
            {x: 0,           y: 0,       w: 5 * 16 / 18, h: 26 / 18,             command: commands.animEditMode,           text: "Place", className: "animPlaceMode",   key: "KeyR[cr]",                       help: "Play pause\n{Right] Click to Toggle animation edit modes"},
            {x: 5 * 16 / 18, y: 8 / 18,  w: 3,          h: 1,                    command: commands.animTimeSlide,                         className: "animSlider",     track: true, dontSize: true, onWheel(steps) { timeline.animTimeStepsWheel(steps) }, help: ""},
            {x: 5 * 16 / 18, y: -1 / 18, w: 3,          h: 8 / 18,               command: commands.animTotalTimeSlide,                    className: "animTotalSlider", dontSize: true, canvas:{ w: 2, h: 3},  help: ""},
            {x: 0,           y: 0,       w: 1,          h: 26 / 18, dir: "left", command: commands.edSpriteToggleTimeline, text: "X",     className: "rightButton",                                            help: "Close timeline"},
         ]), { pannel: animPannel, size: 18, }
    );
    keyboard.mapKeyCommand("ArrowLeft",   {},           "drawing",      commands.animGotoPrevFrame);
    keyboard.mapKeyCommand("ArrowRight",  {},           "drawing",      commands.animGotoNextFrame);
    keyboard.mapKeyCommand("BracketLeft", {},           "drawing",      commands.animGotoNextFrameLoop);
    keyboard.mapKeyCommand("BracketLeft", {},           "editSprites",  commands.animGotoNextFrameLoop);
    keyboard.mapKeyCommand("ArrowLeft",   {shift:true}, "drawing",      commands.animGotoPrevKey);
    keyboard.mapKeyCommand("ArrowRight",  {shift:true}, "drawing",      commands.animGotoNextKey);
    keyboard.mapKeyCommand("KeyP",        {},           "drawing",      commands.animPlayPause);

    i = 0;
    var iy = ((21+26) / 16) + 15;
    buttons.create(timeline.setButtons([
            {x : 0, y: ((21+26)  / 16), w: trackWidth, h: timelineMaxTracks - 1, command: commands.animTracks, className: "animTrackTableContain", track: true, dontSize: true, text: "", help: ""},
        ]), {pannel: animPannel, size : 16, }
    );

    /*==Edit sprites menus===============================================================================================================*/
    keyboard.mode = "editSprites";
    var snapSprite = 57 + 11 * 22 - 1;
    var snapSpriteB = snapSprite + 22 * 2 - 2


    const spriteShapeSelect = buttons.PannelQuickSelect();
    const spriteShapeSelectButtons = buttons.create(editSprites.setButtons([
            {x : 0, y : 0, w : 1, h : 1,dir : "right",
             command : commands.edSprCreateShape_Circle   ,      sprite :  350 ,className : "buttonSprite",  help : "Create circle shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Ellipse  ,      sprite :  351 ,className : "buttonSprite",  help : "Create ellipse shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Square   ,      sprite :  352 ,className : "buttonSprite",  help : "Create square shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Rectangle,      sprite :  353 ,className : "buttonSprite",  help : "Create rectangle shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Cone     ,      sprite :  354 ,className : "buttonSprite",  help : "Create cone shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Polygon  ,      sprite :  355 ,className : "buttonSprite",  help : "Create uniform polygon shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Poly     ,      sprite :  356 ,className : "buttonSprite",  help : "Create polygon shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Star     ,      sprite :  357 ,className : "buttonSprite",  help : "Create star shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Gear     ,      sprite :  358 ,className : "buttonSprite",  help : "Create gear shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_CompoundShape,  sprite :  373 ,className : "buttonSprite",  help : "Create compound line shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_CompoundCircle, sprite :  374 ,className : "buttonSprite",  help : "Create compound Circle shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_CompoundLine,   sprite :  360 ,className : "buttonSprite",  help : "Create compound line shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Arrow    ,      sprite :  361 ,className : "buttonSprite",  help : "Create line arrow heads\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_AngleArrow ,    sprite :  362 ,className : "buttonSprite",  help : "Create arc with arrow head\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Vector   ,      sprite :  375 ,className : "buttonSprite",  help : "Create vector image from currently selected image sprite"},
            {command : commands.edSprCreateShape_Tube     ,      sprite :  377 ,className : "buttonSprite",  help : "Create 3D tube shape\n[RIGHT] Click to converts selected cutters"},
            {command : commands.edSprCreateShape_Sphere   ,      sprite :  363 ,className : "buttonSprite",  help : "Create 3D sphere shape\n[RIGHT] Click to converts selected cutters"},
        ]),
        { pannel : spriteShapeSelect, size : 32 }
    );
    const spriteGridSelect = buttons.PannelQuickSelect();
    const spriteGridSelectButtons = buttons.create(editSprites.setButtons([
            {x : 0, y : 0, w : 1, h : 1,dir : "right",
              command : commands.edSprCreateGrid,    sprite : 96 ,className : "buttonSprite", key : "KeyG[s]", help : "Creates a grid used to snap sprites too and to snap pen tools."},
            { command : commands.edSprCreateVanish,  sprite : 95 ,className : "buttonSprite", key : "KeyV[s]", help : "Creates a vanish point grid to snap pen tools."},
            { command : commands.edSprCreateVanishB, sprite : 97 ,className : "buttonSprite",                  help : "Creates a vanish point grid to snap pen tools."},
            { command : commands.edSprCreateMarker,  sprite : 89 ,className : "buttonSprite", key : "KeyM[s]", help : "Create a marker that defines a position relative to a sprite"},
        ]),
        { pannel : spriteGridSelect, size : 32 }
    );
    const spriteSnapSelect = buttons.PannelQuickSelect();
    const spriteSnapSelectButtons = buttons.create(editSprites.setButtons([
            { x: 0, y: 0, w: 1, h: 1,dir: "right",
              command: commands.edSprGridSnap1,      group: "pixelSnap", sprite: snapSprite + 1, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 1,  group: "pixelSnap", sprite: snapSprite + 2, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 2,  group: "pixelSnap", sprite: snapSprite + 4, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 3,  group: "pixelSnap", sprite: snapSprite + 8, className: "buttonSprite", help: "Set pixel snap distance"},
            { x: 0, y: 1, w: 1, h: 1, dir: "right",
              command: commands.edSprGridSnap1 + 4,  group: "pixelSnap", sprite: snapSpriteB + 0, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 5,  group: "pixelSnap", sprite: snapSpriteB + 1, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 6,  group: "pixelSnap", sprite: snapSpriteB + 2, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 7,  group: "pixelSnap", sprite: snapSpriteB + 3, className: "buttonSprite", help: "Set pixel snap distance"},
            { x: 0, y: 2, w: 1, h: 1, dir: "right",
              command: commands.edSprGridSnap1 + 8,  group: "pixelSnap", sprite: snapSpriteB + 4, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 9,  group: "pixelSnap", sprite: snapSpriteB + 5, className: "buttonSprite", help: "Set pixel snap distance"},
            { x: 2, y: 2, w: 2, h: 1, dir: "right",
              command: commands.edSprGridSnap1 + 10, group: "pixelSnap", sprite: snapSpriteB + 6, className: "buttonSprite", help: "Set pixel snap distance"},
            { x: 0, y: 3, w: 2, h: 1, dir: "right",
              command: commands.edSprGridSnap1 + 11, group: "pixelSnap", sprite: snapSpriteB + 8, className: "buttonSprite", help: "Set pixel snap distance"},
            { command: commands.edSprGridSnap1 + 12, group: "pixelSnap", sprite: snapSpriteB + 10,className: "buttonSprite", help: "Set pixel snap distance"},
        ]),
        { pannel: spriteSnapSelect, size: 21 }
    );
    const editSpriteButtons = buttons.create(editSprites.setButtons([
            { x: 0, y: 0, w: 1, h: 1,dir: "right",command: commands.edSprMirrorHor, sprite: 17 ,className: "buttonSprite", help: "Mirror in sprite local x\n[SHIFT] Click (Or [MIDDLE] Click) to mirror image only\n[RIGHT] Click mirror in screen horizontal"},
            {command: commands.edSprMirrorVer,   			 sprite: 28 ,className: "buttonSprite", help: "Mirror in sprite local y\n[SHIFT] Click (Or [MIDDLE] Click) to mirror image only\n[RIGHT] Click mirror in screen vertical"},
            {command: commands.edSprRotCW,       			 sprite: 29 ,  ...Repeats(500, "a") ,className: "buttonSprite", help: "Rotate 90 CW. [RIGHT] Click CCW\n[CTRL] 45deg. [SHIFT] 22.5Deg\n[SHIFT][CTRL] 5.625deg. [alt] 1deg (repeats)\n[MIDDLE] Click to rotate image content"},
            {command: commands.edSprRotCCW,      			 sprite: 30 ,  ...Repeats(500, "a") ,className: "buttonSprite", help: "Rotate 90 CCW. [RIGHT] Click CW\n[CTRL] 45deg. [SHIFT] 22.5Deg\n[SHIFT][CTRL] 5.625deg. [alt] 1deg (repeats)\n[MIDDLE] Click to rotate image content"},
            {command: commands.edSprTop,       			 sprite:  3 , className: "buttonSprite", help: "Move setlected sprites to top of z order\n[SHIFT][LEFT] move to first attached" },
            {command: commands.edSprBot,       			 sprite:  2 , className: "buttonSprite", help: "Move selected sprites to bottom of z order.\n[RIGHT] Click to swap selected sprite order in place.\n[SHIFT][LEFT] move to last attached (if attached)"},
            {command: commands.edSprUp,  group: "zorder",  sprite:  1 ,  ...Repeats(500),      className: "buttonSprite", help: "Move selected sprites up one in the z order\n[RIGHT] Click to select sprite to move above\n[CTRL][RIGHT] Click to swap selected sprite order in place\n[SHIFT][LEFT] move selected towards first attached"},
            {command: commands.edSprDown,group: "zorder",  sprite:  0 ,  ...Repeats(500),      className: "buttonSprite", help: "Move selected sprites down on in z order\n[RIGHT] Click to select sprite to move below\n[SHIFT][LEFT] move selected towards last attached"},
            {command: commands.edSprDouble,    			 sprite: 42 ,  ...Repeats(500, "c"), className: "buttonSprite", help: "Scale sprites up\n[RIGHT] scale down\n[CTRL] small steps (repeats)"},
            {command: commands.edSprDoubleHor,  			 sprite: 45 ,  ...Repeats(500, "c"), className: "buttonSprite", help: "Scale sprites horizontaly\n[RIGHT] scale down\n[CTRL] small steps (repeats)"},
            {command: commands.edSprDoubleVer, 			 sprite: 44 ,  ...Repeats(500, "c"), className: "buttonSprite", help: "Scale sprites verticaly\n[RIGHT] scale down\n[CTRL] small steps (repeats)"},
            {command: commands.edSprToggleSpriteAsPaintSrc, sprite: 85, sprites: [85,85 + 14, 85 + 28] ,     className: "buttonSprite", help: "Toggle selected drawable as colour source"},

            { x: 0, y: 1, w: 1, h: 1,dir: "right",
             command: commands.edSprUndo,        sprite: 103 , key: "KeyZ[c]", className: "buttonSprite",help: "[LEFT] Click undo from last backup [RIGHT] Click undo selected images"},
            {command: commands.edSprClearSelected, sprite: 62                    ,className: "buttonSprite", help: "Moves sprites to align top to highest sprite\n[RIGHT] Click to resize sprites to move top to topmost sprite."},
            {command: commands.edSprAlignTop,    group: "alignments", sprite: 4 ,className: "buttonSprite", help: "Moves sprites to align top to highest sprite\n[RIGHT] Click resize to highest top edge\n[CTRL][RIGHT] Click resize to lowest top edge"},
            {command: commands.edSprAlignMid,    group: "alignments", sprite: 5 ,className: "buttonSprite", help: "Moves sprites to align vertical centers\n[RIGHT] Click vert align selected to selectable sprite"},
            {command: commands.edSprAlignBot,    group: "alignments", sprite: 6 ,className: "buttonSprite", help: "Moves sprites to align bottom to lowest sprite\n[RIGHT] Click resize to lowest bottom edge\n[CTRL][RIGHT] Click resize to highest bottom edge"},
            {command: commands.edSprAlignLeft,   group: "alignments", sprite: 18 ,className: "buttonSprite", help: "Moves to align to left most edge\n[RIGHT] Click resize to left most left edge\n[CTRL][RIGHT] Click resize to right most left edge"},
            {command: commands.edSprAlignCenter, group: "alignments", sprite: 19 ,className: "buttonSprite", help: "Moves sprites to align horizontal centers\n[RIGHT] Click horizontal align selected to selectable sprite"},
            {command: commands.edSprAlignRight,  group: "alignments", sprite: 20 ,className: "buttonSprite", help: "Moves to align to right most edge\n[RIGHT] Click resize to right most right edge\n[CTRL][RIGHT] Click resize to left most right edge"},
            {command: commands.edSprSpaceHor,    group: "alignments", sprite: 7 ,className: "buttonSprite", help: "Even space horizontal\n[RIGHT] zero space moving  left\n[CTRL] Even space  horizontal non overlapping rows\n[RIGHT][CTRL]zero space moving left non overlapping rows\n[SHIFT][?LEFT,RIGHT] add pixel space between all"},
            {command: commands.edSprSpaceVer,    group: "alignments", sprite: 21 ,className: "buttonSprite", help: "Even space vertical\n[RIGHT] zero space moving up\n[CTRL] Even space  vertical non overlapping columns\n[RIGHT][CTRL]zero space moving up non overlapping columns\n[SHIFT][?LEFT,RIGHT] add pixel space between all"},
            {command: commands.edSprAlignRotate, group: "alignRotate",sprite: 94 ,className: "buttonSprite", help: "Aligns sprites with each other. Select sprites Click this button, then select  the sprite to align to."},
            {command: commands.edSprSetViewSprite, sprite: 336 ,className: "buttonSprite", help: "Turns selected sprite to a view\nUse view home button to use."},

            { x: 0, y: 2, w: 1, h: 1,dir: "right",
             command: commands.edSpriteToggleTimeline,                             sprite: 173 , sprites: [173,173-14,177,176],         key: "KeyY[c]",className: "buttonSprite", help: "Toggle timeline menu\n[RIGHT] Click to toggle animation edit modes"},
            {   command:     commands.animSetKeyAll,
                command_C_1: commands.animSetKeyPos,
                command_C_4: commands.animSetKeyPos,
                command_S_1: commands.animSetKeyRotate,
                command_S_4: commands.animSetKeyRotate,                            sprite: 337 , className: "buttonSprite", help: "Adds keys (X,Y,RX,RY) to selected\n[CTRL] Click adds keys (X, Y) to selected\n[SHIFT] Click adds keys (RX, RY) to selected\n[RIGHT] Click remove keys at time"},
            {command: commands.edSpriteToggleLookAt,   group: "lookatselect",     sprite: 101 ,key: "KeyL",className: "buttonSprite", help: "Click and select a lookat marker"},
            {command: commands.edSpriteToggleAttachTo, group: "attachToSelect",   sprite: 179 ,key: "KeyK",className: "buttonSprite", help: "Click and select a sprite to attach to\n[CTRL] Click to select linked sprite"},
            {command: commands.edSpriteToggleAttachmentScale  ,                    sprite: 266, sprites: [266, 267, 268,269, 278] ,className: "buttonSprite", help: "Toggle attach position scaled with attached too sprite"},
            {command: commands.edSpriteToggleAttachRotate     ,                    sprite: 270, sprites: [270, 271,277] ,className: "buttonSprite", help: "Toggle inherit rotation from attached too sprite"},
            {command: commands.edSpriteToggleAttachScale      ,                    sprite: 272, sprites: [272, 274, 273, 275,276] ,className: "buttonSprite", help: "Toggle inherit scale from attached too sprite"},
            {command: commands.edSpriteToggleXYPositionLocks      ,                sprite: 266, sprites: [266, 267, 268,269, 278] ,className: "buttonSprite", help: "Toggle local coordinate position locks"},
            {command: commands.edSpriteAddLocator,     group: "attachToLocator",  sprite: 178 ,key: "KeyK[c]",className: "buttonSprite", help: "Select sprite to bind this locator to"},
            {command: commands.edSprToggleOutline,                                 sprite: 65 ,className: "buttonSprite", sprites: [65,34,43],help: "Toggles Sprite outline display\nand state marks (eg red K for on keyframe)."},
            {command: commands.edSprLockUI,                                        sprite: 144 ,className: "buttonSprite", sprites: [144,143,142],help: "Toggles Sprite UI lock."},

            { x: 0, y: 3, w: 1, h: 1,dir: "right",
                command:    commands.edSprResetView,
                command__4:  commands.edSprResetViewFit,
                command_C_1: commands.edSprToggleViewSprite,            key: "Home[]", sprite: 31 ,className: "buttonSprite", help: "Set view to home position, or to selection\n[CTRL] Click to toggle view sprite if avalible"},
            {command: commands.edSprFitToo,     group: "selectToFit" , key: "KeyF", sprite: 48 ,className: "buttonSprite", help: "Fits selected sprites to another.\n Click this then select the sprite to fit to on the work space.\nFor details on options Click the Help in the logs"},
            {command: commands.edSprResetScale, sprite: 15 ,           key: "KeyS[s]", group: "spriteLocks", className: "buttonSprite", help: "Reset selected scale\n[RIGHT] Click Toggles scale lock.\n[CTRL][RIGHT] Click to rescale to closest pixel\n    If snap to pixel on then sprite is moved\n    to align top left with pixel grid\n[CTRL][LEFT} Click to square to smallest side"},
            {command: commands.edSprResetRot,   sprite: 16 ,           key: "KeyR[s]", group: "spriteLocks", className: "buttonSprite", help: "Reset selected rotation\n[RIGHT] Click Toggles rotation lock.\n"},
            {command: commands.edSprPattern,    sprite: 80 ,group: "attachPattern", className: "buttonSprite", sprites: [80, 81, 82, 378, 379], help: "Toggle sprite pattern on image or gardient using cutter\n[RIGHT] Click to cycle repeat or gradient type\nOR if shape selected Click to link to pattern or gradient sprite"},
            {command: commands.edSprClip,       sprite: 46 ,className: "buttonSprite", help: "Reduce sprite bitmap size removing\nall transparent pixels around the edges"},
            {command: commands.edSprPad,        sprite: 47 ,className: "buttonSprite", help: "Add transparent pixels around edges\n[RIGHT] Click to pad by 1 pixel each side"},
            {command: commands.edSprSmooth,     sprite: 63 ,className: "buttonSprite", sprites: [63,64,64+14+1],help: "Toggle sprite smoothing"},
            {   command:     commands.edSprLiveCapture,
                command_S_1: commands.edSprCaptureSource, sprite: 118 , group: "liveCapture", className: "buttonSprite", sprites: [118,119,120,323],help: "Toggle live capture\n[RIGHT] Click to capture one frame\n[CTRL] capture with feedback OFF\n[SHIFT] Click to select capture sprite to capture selected"},
            {command: commands.edSprSnapTo,     sprite: 76 ,className: "buttonSprite", sprites: [76,61,90],help: "Toggle sprite snap\n[RIGHT] Click selects all snap sprites"},
            {command: commands.edSprSnapToggle, sprite: 56 , sprites: [56,57,58],   quickSelectRight: spriteSnapSelect,      key: "KeyS[s]",className: "buttonSprite", help: "Toggle sprite snap modes.\nNo snap\nSnap to sprites\nSnap to pixels\n[RIGHT] Click to select pixel snap distance"},
            {command: commands.edSprShowGrid,   sprite: 60 , sprites: [60,59],     key: "KeyG[c]",className: "buttonSprite", help: "Toggle background grid display"},

            { x: 0, y: 4, w: 1, h: 1,dir: "right",
                command:     commands.edSprDelete,
                command_CS_4: commands.sysResetAll,      sprite: 14,  className: "buttonSprite", key: "Delete[]",                                           help: "Deletes selected sprites\n[CTRL][SHIFT]{RIGHT] Click to reset all" },
            {command: commands.edSprCopy,               sprite: 32,  className: "buttonSprite", key: "KeyD[sc]",                                           help: "Creates copy of selected\n[RIGHT] Click copies animation. If selected sprites animated will show more options"},
            {command: commands.edSprClone,              sprite: 33,  className: "buttonSprite", key: "KeyD[c]",                                            help: "Create new instance of selected sprites\n[RIGHT] Click copies (not instance) animation"},
            {command: commands.edSprCreateDraw,         sprite: 35,  className: "buttonSprite", key: "KeyD[s]",                                            help: "Creates new draw surface to fit the screen\nIf cutter/s selected then convert to drawable\nIf Image selected create same size empty drawable\nRasterizable sprites are converted to drawable images\n[RIGHT] Click to create drawable copy of rasterizable sprites "},
            {command: commands.edSprCreateCutter,       sprite: 49,  className: "buttonSprite", key: "KeyC[s]",                                            help: "Create a cutter sprite\n[RIGHT] to cover selected\n[CTRL][RIGHT] To cover each selected\n[CTRL]to convert selected sprites to cutters"},
            {command: commands.edSprCreateText,         sprite: 92,  className: "buttonSprite", key: "KeyT[s]",                                            help: "Creates a text object\n[RIGHT] Click to edit selected text\n[CTRL][RIGHT] Click edit and makes each selected text sprite unique"},
            {command: commands.edSprCreateGridSprite,   sprite: 96,  className: "buttonSprite", quickSelectLeft: spriteGridSelect,                          help: "Create a grid sprite."},
            {command: commands.edSprCreateShape,        sprite: 350, className: "buttonSprite", quickSelectLeft: spriteShapeSelect,                         help: "Create a shape sprite\n[RIGHT] Click to open shape properties dialog"},
            {command: commands.edSprCreateFunctionLink, sprite: 88,  className: "buttonSprite", key: "KeyP[s]",                                            help: "Create a function linker\n[RIGHT] Click to open Function linker dialog"},
            {command: commands.edSprPrevSubSprite,      sprite: 338, className: "buttonSprite",                                 ...Repeats(150, "", true),  help: "Step selected to  prev sub sprite"},
            {command: commands.edSprNextSubSprite,      sprite: 339, className: "buttonSprite", group: "subSpriteSelections",   ...Repeats(150, "", true),  help: "Step selected to next sub sprite\n[RIGHT] to select sub sprite index from workspace"},
            {command: commands.edSprSelectTree,         sprite: 167, className: "buttonSprite",                                                             help: "Select all from selected up\n[RIGHT] Click select bottom\n[CTRL]Unselects existing selection\n[SHIFT] Click select compound shape\n[SHIFT][RIGHT] Click select shape links"},

            { x: 0, y: 5, w: 1, h: 1,dir: "right",
            command: commands.edSprBigPlayPause,   sprite: 91 ,sprites: [91, 91-14], className: "buttonSprite", help: "Toggle animation Play/Pause"},
            { x: 10, y: 5, w: 1, h: 1,dir: "right",command: commands.sysForceRightButton,     sprite: 257 ,sprites: [257, 258, 260], className: "buttonSprite", help: "Cycles through force right, lock force right, normal buttons."},
            { x: 11, y: 5, w: 1, h: 1,dir: "right",command: commands.sysHideUIToggle,         sprite: 255 ,sprites: [255,256], className: "buttonSprite", help: "Toggle hide User Interface"},
        ]), { pannel: spritePannel,size: 32, }
    );
    buttons.create(editSprites.setButtons([
            { x : 22, y : 4, w : 1, h : 1,dir : "right",
             command : commands.edSpriteToggleShow, sprite : 186 ,className : "buttonSprite", sprites : [186, 187, 188],help : "Toggles sprite hidden from workspace"},
            {command : commands.edSpriteHideFromRenderToggle, sprite : 189 ,className : "buttonSprite", sprites : [189, 190, 191],help : "Toggles sprite hidden from from sprite renders."},
        ]), { pannel : spritePannel, size : 16,}
    );


    buttons.create(editSprites.setButtons([
            { x : 2, y :10, w : 10, h : 1, command : commands.edSprAlpha, slider : {color : "black", min : 0, max : 255, step : 1,wStep : 8, value : 255 }},
            { x : 12, y : 10, w : 1, h : 1, command : commands.edSprFill,background : "white", help : "Set current sprite fillStyle "},
            { x : 13, y : 10, w : 1, h : 1, command : commands.edSprStroke,background : "Black",className : "buttonSprite", help : "Set current sprite strokeStyle "},
            { x : 2, y :11, w : 18, h : 1, command : commands.animTimeSecondSlider, slider : {color : "#0F0", min : 0, max : 120, step : 1,wStep : 1, value : 0 },help : "Secondary timeline position."},

            { x : 0, y : 12, w : 1, h : 1,dir : "right", group : "compMode", command : commands.edSprComp0, sprite : 16 ,className : "buttonSprite", help : "Set composite to Source-over"},
            { group : "compMode", command : commands.edSprComp1,  sprite : 52 ,className : "buttonSprite", help : "Set composite to Lighter"},
            { group : "compMode", command : commands.edSprComp2,  sprite : 53 ,className : "buttonSprite", help : "Set composite to Multiply"},
            { group : "compMode", command : commands.edSprComp3,  sprite : 19 ,className : "buttonSprite", help : "Set composite to Screen"},
            { group : "compMode", command : commands.edSprComp4,  sprite : 20 ,className : "buttonSprite", help : "Set composite to overlay"},
            { group : "compMode", command : commands.edSprComp5,  sprite : 21 ,className : "buttonSprite", help : "Set composite to color-dodge"},
            { group : "compMode", command : commands.edSprComp6,  sprite : 22 ,className : "buttonSprite", help : "Set composite to color-burn"},
            { group : "compMode", command : commands.edSprComp7,  sprite : 23 ,className : "buttonSprite", help : "Set composite to hard-light"},
            { group : "compMode", command : commands.edSprComp8,  sprite : 44 ,className : "buttonSprite", help : "Set composite to soft-light"},
            { group : "compMode", command : commands.edSprComp9,  sprite : 45 ,className : "buttonSprite", help : "Set composite to difference"},
            { group : "compMode", command : commands.edSprComp10, sprite : 46 ,className : "buttonSprite", help : "Set composite to exclusion"},
            { group : "compMode", command : commands.edSprComp11, sprite : 47 ,className : "buttonSprite", help : "Set composite to hue"},
            { group : "compMode", command : commands.edSprComp12, sprite : 48 ,className : "buttonSprite", help : "Set composite to saturation"},
            { group : "compMode", command : commands.edSprComp13, sprite : 49 ,className : "buttonSprite", help : "Set composite to color"},
            { group : "compMode", command : commands.edSprComp14, sprite : 50 ,className : "buttonSprite", help : "Set composite to luminosity"},
            { group : "compMode", command : commands.edSprComp15, sprite : 51 ,className : "buttonSprite", help : "Set composite to source-atop"},
            { group : "compMode", command : commands.edSprComp16, sprite : 72 ,className : "buttonSprite", help : "Set composite to source-in"},
            { group : "compMode", command : commands.edSprComp17, sprite : 73 ,className : "buttonSprite", help : "Set composite to source-out"},
            { group : "compMode", command : commands.edSprComp18, sprite : 74 ,className : "buttonSprite", help : "Set composite to destination-over"},
            { group : "compMode", command : commands.edSprComp19, sprite : 75 ,className : "buttonSprite", help : "Set composite to destination-atop"},
            { group : "compMode", command : commands.edSprComp20, sprite : 76 ,className : "buttonSprite", help : "Set composite to destination-in"},
            { group : "compMode", command : commands.edSprComp21, sprite : 77 ,className : "buttonSprite", help : "Set composite to destination-out"},
            { group : "compMode", command : commands.edSprComp22, sprite : 78 ,className : "buttonSprite", help : "Set composite to copy"},
            { group : "compMode", command : commands.edSprComp23, sprite : 79 ,className : "buttonSprite", help : "Set composite to xor"},
            { group : "compMode", command : commands.edSprComp24, sprite : 80 ,className : "buttonSprite", help : "DONT PANIC!!! just a filler"},

            { x : 14, y : 10, w : 1, h : 1,dir : "right",
              group : "gif", command : commands.animGotoStart,      key : "ArrowLeft[c]", sprite : 212 ,className : "buttonSprite", help : "First frame"},
            { group : "gif", command : commands.animGotoPrevFrame,  key : "ArrowLeft[]",  sprite : 213 ,className : "buttonSprite", help : "Prev / Slower"},
            { group : "gif", command : commands.animStop,                                 sprite : 214 ,className : "buttonSprite", help : "Stop"},
            { group : "gif", command : commands.animPlayPause,                            sprite : 215 ,className : "buttonSprite", help : "Play / Pause toggle"},
            { group : "gif", command : commands.animGotoNextFrame,  key : "ArrowRight[]", sprite : 216 ,className : "buttonSprite", help : "Next / Faster"},

            { group : "gif", command : commands.animGotoEnd,    key : "ArrowRight[c]",  sprite : 217 ,className : "buttonSprite", help : "Last frame"},
        ]), { pannel : spritePannel, size : 16,}
    );



	keyboard.mapKeyCommand("KeyC", {ctrl : true}, "editSprites", commands.edSprClipboardCopy);
	keyboard.mapKeyCommand("KeyV", {ctrl : true}, "editSprites", commands.edSprClipboardPaste);
	keyboard.mapKeyCommand("KeyJ", {},            "editSprites", commands.edSpriteToggleLinkedTo);
	keyboard.mapKeyCommand("KeyU", {},            "editSprites", commands.edSprUpdateAnimPath);
    keyboard.mapKeyCommand("KeyO", {}, "editSprites", commands.edSpriteAttachFuncOutput);
    keyboard.mapKeyCommand("KeyO", {}, "animation", commands.edSpriteAttachFuncOutput);
	keyboard.mapKeyCommand("KeyI", {}, "editSprites", commands.edSpriteAttachFuncInput);
	keyboard.mapKeyCommand("KeyI", {}, "animation", commands.edSpriteAttachFuncInput);




    /*= Paint menus================================================================================================================*/
    keyboard.mode = "drawing";
    //                              0                5                   10                  15                 20                  25
    const drawTypeOptionSprites = [68,69,98,139,154,155,156,157,158,159,160,161,162,163,164,165,166,167,83,110,111,121,146,147,148,149,150,151,152,153];
    for(var i = 182; i < 400; i++) { drawTypeOptionSprites.push(i) } // from the 30th // 210 (28+30)
    drawTypeOptionSprites.push(100, 102); // line width gradient, line pattern
    var j = 0;
    var mixIconStart = 20 * 2 * 28;
    const curveMixTypeQuickSelect = buttons.PannelQuickSelect();
    const curveMixTypeButtons = buttons.create(paint.setButtons([
            {x : 0, y : 0, w : 1, h : 1,dir : "right",
             group : "curveMixTypeGroup", command : commands.paintCurveMixTypeNone, sprite : mixIconStart++,className : "buttonSprite", help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType1, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType2, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType3, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType4, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType5, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType6, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType7, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType8, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType9, sprite : mixIconStart++,className : "buttonSprite",  help : "Mix function " + curves.curveMixTypesNamed[j++]},
            {group : "curveMixTypeGroup", command : commands.paintCurveMixType10, sprite : mixIconStart++,className : "buttonSprite", help : "Mix function " + curves.curveMixTypesNamed[j++]},
        ]), { pannel : curveMixTypeQuickSelect, size : 16, }
    );
    function createQuickSelectPannel(types, typeInfo, group, commandBase, size) {
        const buttonList = [], pannel = buttons.PannelQuickSelect({preIssueCommand : true});
        var x = 0, y = 0, mod = (types.length ** 0.5) | 0, j = 0;
        for (const type of types) {
            const info = typeInfo[type];
            let sprite = 80 + j;
            let help = type;
            if (info) {
                if(Array.isArray(info)) {
                    sprite = drawTypeOptionSprites[info[0]];
                    help = info[1];
                } if(Array.isArray(info.info)){
                    sprite = drawTypeOptionSprites[info.info[0]];
                    help = info.info[1];
                }else if (info.info) {  help = info.info }
            }
            buttonList.push({x, y, w : 1, h : 1, group, command : commandBase + j, sprite ,className : "buttonSprite", help});
            j++;
            x += 1;
            if(x === mod){ x = 0; y += 1  }
        }
        buttons.create(buttonList, { pannel, size} );
        pannel.groupName = group;
        pannel.commandBase = commandBase;
        return pannel;
    }
    const selectionOptionsQuickSelect = buttons.PannelQuickSelect();
    const selectionOptionsButtons = buttons.create(paint.setButtons([
            {x : 0, y : 0, w : 1, h : 1,dir : "right",
              command: commands.paintPasteToImage,                       sprite : 392, className : "buttonSprite",  key: "KeyB[s]",  help : "Buffer added to media as image " },
            { command: commands.paintPasteToImageAndWorkSpace,           sprite : 393, className : "buttonSprite",  key: "KeyB[]", help : "Buffer added to media as image and added to workspace as sprite"},
            { command: commands.paintAsPattern,                          sprite : 394, className : "buttonSprite",  help : "Set Cut buffer or selection as current pattern"},
            { command: commands.paintClearPattern,                       sprite : 395, className : "buttonSprite",  help : "Releases current pattern "},
            { command: commands.paintSelectDefinesSprite,                sprite : 396, className : "buttonSprite",  key: "KeyH[s]", help : "Define selections as a sub sprite of sprite sheet\nNote curent image is converted to sprite sheet"},
            { command: commands.paintSelectDefinesSpriteAndAddWorkSpace, sprite : 397, className : "buttonSprite",  key: "KeyH[]", help : "Define selections as a sub sprite of sprite sheet\nand add to workspace"},
            { command: commands.paintSelectAsClip,                       sprite : 398, className : "buttonSprite",  help : "Restrict drawing to withing selection"},
        ]), { pannel : selectionOptionsQuickSelect, size : 32, }
    );
    const specialBrushModeQuickSelectPannel = createQuickSelectPannel(specialBrushes.options.stepTypes, specialBrushes.stepInfo, "specialBrushStepTypes", commands.paintSpecialBrushMode, 32);
    const specialBrushShapeQuickSelectPannel = createQuickSelectPannel(specialBrushes.options.shapeTypes, specialBrushes.shapeInfo, "specialBrushShapesTypes", commands.paintSpecialBrushShape, 32);
    const sprayModeQuickPannel = createQuickSelectPannel(pens.options.pointTypes, pens.options.pointInfo, "pointTypes", commands.paintSpecialBrushMode + 16, 32);
    const pointsModeQuickPannel = createQuickSelectPannel(pens.options.pointTypes, pens.options.pointInfo, "pointsTypes", commands.paintSpecialBrushMode + 16 + 57, 32);
    const sprayShapeQuickPannel = createQuickSelectPannel(pens.options.walkTypes, pens.options.walkInfo, "walkTypes", commands.paintSpecialBrushShape + 16, 32);

    const paintButtons = buttons.create(paint.setButtons([
            { x : 0, y : 0, w : 1, h : 1,dir : "right",
             command : commands.paintLine,      group : "drawType",     sprite : 70 ,className : "buttonSprite", help : ""},
            {command : commands.paintCircle,    group : "drawType",     sprite : 71 ,  sprites : [71,126,128],   wheelSelect : true,className : "buttonSprite", help : "Circle outline, fill and fill + outline"},
            {command : commands.paintRectangle, group : "drawType",     sprite : 72 ,  sprites : [72,127,129],   wheelSelect : true,className : "buttonSprite", help : "Retangle outline, fill and fill + outline"},
            {command : commands.paintFloodFill, group : "drawType",     sprite : 114 , sprites : [114,115,116], wheelSelect : true,className : "buttonSprite", help : "Flood fills, Flood fill lines, and Flood fill edge"},
            {command : commands.paintCurve,     group : "drawType",     sprite : 168 , sprites : [168,169,170,171,172], wheelSelect : true,className : "buttonSprite", help : "Curved freehand lines, curved closed\n shape fill, shape fill outline, shap fill outline closed"},
            {command : commands.paintSpray,     group : "drawType",     sprite : 74 ,className : "buttonSprite", help : ""},
            {command : commands.paintPoints,    group : "drawType",     sprite : 75 ,className : "buttonSprite", help : ""},
            {command : commands.paintBrissleB,  group : "drawType",     sprite : 141 ,  sprites : [141,142,143,144,145],className : "buttonSprite", wheelSelect : true, help : ""},
            {command : commands.paintBrushOptionsA,                     sprite : 159 ,  sprites : drawTypeOptionSprites, quickSelect : specialBrushModeQuickSelectPannel, quickSelectExtra: {specialBrush: specialBrushModeQuickSelectPannel, sprayBrush: sprayModeQuickPannel, pointBrush: pointsModeQuickPannel}, className : "buttonSprite", help : ""},
            {command : commands.paintBrushOptionsB,                     sprite : 159 ,  sprites : drawTypeOptionSprites,  quickSelect : specialBrushShapeQuickSelectPannel, quickSelectExtra: {specialBrush: specialBrushShapeQuickSelectPannel, pointBrush: sprayShapeQuickPannel}, className : "buttonSprite", help : ""},
            {command : commands.paintBrushOptionsC,                     sprite : 159 ,  sprites : drawTypeOptionSprites,className : "buttonSprite", help : ""},
            {command : commands.paintBrushOptionsD,                     sprite : 159 ,  sprites : drawTypeOptionSprites,className : "buttonSprite", help : ""},

            { x : 0, y : 1, w : 1, h : 1,dir : "right",
             command: commands.paintPointMode, sprite : 175, sprites : [175,174] , className : "buttonSprite", help : "Toggle point mode if avaliable"},
            {command: commands.paintColorBlend,           group: "gradientSetting", sprite: 158, sprites: drawTypeOptionSprites, className: "buttonSprite", help: ""},
            {command: commands.paintBrushSizeBlend,       group: "brushSizeBlend",  sprite: 150, sprites: drawTypeOptionSprites, className: "buttonSprite", help: ""},
            {command: commands.paintFadeAlphaDist,        group: "alphaFX",         sprite: 83,  sprites: drawTypeOptionSprites, className: "buttonSprite", help: "Toggle alpha dist fade"},
            {command: commands.paintSizeDist,             group: "sizeFX",          sprite: 111, sprites: drawTypeOptionSprites, className: "buttonSprite", help: "Toggle size distance change"},
            {command: commands.paintRandColor,            group: "randomColor",     sprite: 98,  sprites: drawTypeOptionSprites, className: "buttonSprite", help: ""},
            {command: commands.paintUseDirection,         group: "directionFX",     sprite: 68,  sprites: drawTypeOptionSprites, className: "buttonSprite", help: "Toggle use mouse direction"},
            {command: commands.paintUseSpeed,             group: "speedFX",         sprite: 69,  sprites: drawTypeOptionSprites, className: "buttonSprite", help: "Toggle use mouse speed"},
            {command: commands.paintFilterA,              group: "blurFX",          sprite: 66,                                  className: "buttonSprite", help: "Toggle blur filter.\n[RIGHT] Click to get Blur settings dialog"},
            {command: commands.paintFilterB,              group: "shadowFX",        sprite: 67,                                  className: "buttonSprite", help: "Toggle shadow filter.\n[RIGHT] Click to get Shadow settings dialog"},
            {command: commands.paintRecordPaintingToggle, group: "paintRecording",  sprite: 323, sprites: drawTypeOptionSprites, className: "buttonSprite", help: "Toggle paint recorder"},
            {command: commands.paintUseSnapGridGuides,    group: "gridSnapGuides",  sprite: 406, sprites: [406, 409, 407, 408] , className: "buttonSprite", help: "Cycle drawing snap options (off AddSnap Add Snap)\n[RIGHT] Click when on to clear snapes"},

            { x : 0, y : 2.5, w : 1, h : 1,dir : "right",command : commands.paintCutter, group : "cutters", sprite : 130 , className : "buttonSprite", help : ""},
            {command : commands.paintMagicCutter, group : "cutters", sprite : 131 ,sprites : [131,106] , className : "buttonSprite", help : ""},
            {command : commands.paintCut,   sprite : 132 , key : "KeyX[c]", className : "buttonSprite", help : ""},
            {command : commands.paintCopy,  sprite : 133 , key : "KeyC[c]", className : "buttonSprite", help : ""},
            {command : commands.paintPaste, sprite : 134 , key : "KeyV[c]", className : "buttonSprite", help : ""},
            {group : "selectionOptions", command : commands.paintSelectionOpts, sprite : 135,className : "buttonSprite", quickSelect : selectionOptionsQuickSelect, help :  "Show selection extra options"},

            //{command : commands.paintPasteToImage, sprite : 135 , key : "KeyV[sc]", className : "buttonSprite", help : "[LEFT] Click copy current buffer to media\n[RIGHT] Click pattern from current cut buffer\n[CTRL][LEFT] copy selection to media\n[CTRL][RIGHT] Click to create pattern from selection\n[SHIFT][CTRL][RIGHT] to clear pattern"},

            { x : 8, y : 2.5, w : 1, h : 1,dir : "right",command : commands.paintUseGridGuides, group : "useGridGuides", sprite : 107 , className : "buttonSprite", help : "Snaps pens to  active grid guides"},
            { x : 9, y : 2, w : 1, h : 1,dir : "right",command : commands.paintUseGuidesXY, group : "snapToGuides", sprite : 122 ,sprites : [122,136], className : "buttonSprite", help : "X Axis guide.\n[LEFT] Click toggles guide grid\n[RIGHT] Click Toggles Use guide\n[[SHIFT][RIGHT] selects next X axis guide if one avaliable "},
            {command : commands.paintUseGuidesXZ, group : "snapToGuides", sprite : 123 ,sprites : [123,137], className : "buttonSprite", help : "2d snaps use X and Z guide axies."},
            {command : commands.paintUseGuidesYZ, group : "snapToGuides", sprite : 124 ,sprites : [124,138], className : "buttonSprite", help : "2d snaps use Y and Z guide axies."},

            { x : 3, y : 3.5, w : 1, h : 1,dir : "right",
             command : commands.paintCurveSetBrushColor,  sprite : 148 , sprites : drawTypeOptionSprites, group : "curveSetting", className : "buttonSprite", help : "Use slider to set brush color curve"},
            {command : commands.paintCurveSetBrushAlpha,  sprite : 147 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set brush alpha curve"},
            {command : commands.paintCurveSetLineColor,   sprite : 149 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set line color curve"},
            {command : commands.paintCurveSetLineWidth,   sprite : 150 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set line width curve"},
            {command : commands.paintCurveSetLineAlpha,   sprite : 146 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set line alpha curve"},
            {command : commands.paintCurveSetSprayColor,  sprite : 110 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set spray color curve"},
            {command : commands.paintCurveSetSpraySize,   sprite : 111 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set spray size curve"},
            {command : commands.paintCurveSetSpraySpread, sprite : 152 , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set spay spread curve"},
            {command : commands.paintCurveSetSprayAlpha,  sprite : 83  , sprites : drawTypeOptionSprites, className : "buttonSprite", group : "curveSetting", help : "Use slider to set spay alpha spread curve"},

            { x : 0, y : 3.5, w : 1, h : 1,dir : "right",
             command : commands.colorPicker,group : "colorPickerPaint", sprite : 181,  className : "buttonSprite", help : "Click then select color from sprites"},
            {command : commands.paintColPallet, key : "KeyV[]",       sprite : 84 , sprites : [84, 85, 85 + 14, 85 + 28], wheelSelect : true, className : "buttonSprite radioOnWheelSelect", help : "Toggle color source\nFrom pallet\nFrom image"},
            {command : commands.paintAntiAlias, sprite : 86, sprites : [86,87] , wheelSelect : true, className : "buttonSprite", help : ""},

            { x : 0, y : 4.5, w : 1, h : 1,dir : "right",
             command : commands.paintClear, sprite : 62 , className : "buttonSprite", help : "Clear selected drawable sprites"},
            {command : commands.paintUndo,  sprite : 103 , key : "KeyZ[c]", className : "buttonSprite",help : "Undos last draw "},
            {command : commands.paintRedo,   sprite : 104 , key : "KeyY[c]", className : "buttonSprite",help : "Restore last undo change"},
        ]), { pannel : paintPannel, size : 32 }
    );

    keyboard.mapKeyCommand("KeyG",{},"drawing",commands.paintToggleGuidSpaceLock);
    keyboard.mapKeyCommand("KeyA",{ctrl : true},"drawing",commands.paintSelectAll);
    keyboard.mapKeyCommand("KeyC",{alt : true},"drawing",commands.paintLogCoordinate);
    keyboard.mapKeyCommand("KeyD",{ctrl : true},"drawing",commands.spritesToggleToDraw);
    var colorModeIconStart = 20 * 2 * 28 + 11;
    // Add small buttons
    buttons.create(paint.setButtons([
            {x : 6, y : 9, w : 2, h : 2,command : commands.paintCurveDisplayA,   canvas : { w : 2, h : 2}, help : "Click to invert the curve"},
            {x : 8, y : 9, w : 1, h : 1, command : commands.paintCurveMixSource, sprite : 212 - 28 * 3, sprites : [212 - 28 * 3, 212 - 28 * 3 + 1],className : "buttonSprite", help : "Click selects which mix curev A/B to edit"},
            // Curve setting icons
            {x : 8, y : 10, w : 1, h : 1,dir : "right",
             group : "curveGroupA", command : commands.paintCurveLineA,     sprite : 80,                            className : "buttonSprite", help : "Linear ramp"},
            {group : "curveGroupA", command : commands.paintCurveEaseA,     sprite : 81,                            className : "buttonSprite", help : "Ease"},
            {group : "curveGroupA", command : commands.paintCurveEase2A,    sprite : 82,                            className : "buttonSprite", help : "Ease 2"},
            {group : "curveGroupA", command : commands.paintCurveSigmoid,   sprite : 82,                            className : "buttonSprite", help : "Sigmoid"},
            {group : "curveGroupA", command : commands.paintCurveBellA,     sprite : 108,                           className : "buttonSprite", help : "Ease Bell"},
            {group : "curveGroupA", command : commands.paintCurveRandomA,   sprite : 83,                            className : "buttonSprite", help : "Random"},
            {group : "curveGroupA", command : commands.paintCurveRandRampA, sprite : 109,                           className : "buttonSprite", help : "Random Ramp"},
            {group : "curveGroupA", command : commands.paintCurveWaveA,     sprite : 167,                           className : "buttonSprite", help : "Aliased Random"},
            {group : "curveRepeatA", command : commands.paintCurveRepeatA,  sprite : 105, sprites : [105,105 + 28], className : "buttonSprite", help : "[RIGHT] Click to toggle curve repeat\n[LEFT] Click to use slider to edit repeat rate."},
            {group : "curveUseMix", command : commands.paintCurveMultiplyA, sprite : 106,                           className : "buttonSprite", quickSelect : curveMixTypeQuickSelect,help :  "When on uses the result\nof two selected curves.\ncurve = A*B"},
            {group : "curveGroupA", command : commands.paintCurveInOutA,    sprite : 107,                           className : "buttonSprite", help : "When on uses the result\nof two selected curves.\nInput ->A->B-> curve"},

            // Cut buffer transforms
            {x : 12, y : 5, w : 1, h : 1, command : commands.paintCutBufMirV,     sprite : 101,className : "buttonSprite", help : "Mirror selection verticaly"},
            {x : 13, y : 5, w : 1, h : 1, command : commands.paintCutBufMirH,     sprite : 100,className : "buttonSprite", help : "Mirror selection horizontaly"},
            {x : 12, y : 6, w : 1, h : 1, command : commands.paintCutBufRotCW,    sprite : 102,className : "buttonSprite", help : "Rotate selection clockwise"},
            {x : 13, y : 6, w : 1, h : 1, command : commands.paintCutBufRotCCW,   sprite : 103,className : "buttonSprite", help : "Rotate selection counter clockwise"},
            {x : 14, y : 5, w : 1, h : 1, command : commands.paintCutBufAnimPrev, sprite : 213,className : "buttonSprite", help : "Moves cut buffer animation back one frame"},
            {x : 15, y : 5, w : 1, h : 1, command : commands.paintCutBufAnimNext, sprite : 216,className : "buttonSprite", help : "Moves cut buffer animation forward one frame"},


            {x : 14, y : 6, w : 1, h : 1, command : commands.paintCutBufUniform, sprite : 130, className : "buttonSprite", help : "[LEFT] Click Uniform scale out\n[RIGHT] Click scale in\n[CTRL] for pixel steps\n[SHIFT] to tile"},
            {x : 15, y : 6, w : 1, h : 1, command : commands.paintCutBufWidth, sprite : 132, sprites: [132, 131], className : "buttonSprite", help : "[LEFT] Click Uniform scale width\n[RIGHT] Click scale width in\nHold [CTRL] for pixel steps\nHold [SHIFT] to scale height"},

            // Colour function buttons
            {x : 0, y : 4, w : 1, h : 1,dir : "right",
             group : "colorMode", command : commands.paintColorMode1 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode2 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode3 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode4 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode5 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode6 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode7 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode8 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode9 , sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode10, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode11, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode12, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode13, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode14, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode15, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode16, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode17, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},
            {group : "colorMode", command : commands.paintColorMode18, sprite: colorModeIconStart, sprites: [colorModeIconStart, 28 + (colorModeIconStart++)], className: "buttonSprite", help: ""},

            {x : 18, y : 6, w : 1, h : 1, group : "gridGuideSpaceLocs", command : commands.paintToggleGuidSpaceLockX, sprite : 80,className : "buttonSprite", help : "Toggle this gird's space loc.\nTo set spacing draw length and hit G"},
            {x : 20, y : 6, w : 1, h : 1, group : "gridGuideSpaceLocs", command : commands.paintToggleGuidSpaceLockY, sprite : 80,className : "buttonSprite", help : "Toggle this gird's space loc.\nTo set spacing draw length and hit G"},
            {x : 22, y : 6, w : 1, h : 1, group : "gridGuideSpaceLocs", command : commands.paintToggleGuidSpaceLockZ, sprite : 80,className : "buttonSprite", help : "Toggle this gird's space loc.\nTo set spacing draw length and hit G"},
         ]), { pannel : paintPannel, size : 16, }
    );

    const wheelStepRange60 = [[10,1],[26,2],[61,4]];
    const wheelStepRange60A = [[10,1],[26,2],[46,4],[61,1]];
    const wheelStepRange200 = [[10,1],[26,2],[61,4],[201,8]];
    const wheelStepRange100 = [[10,1],[42,2],[58,1],[90,2],[101,1]];
    paintPannel.addEvent("show",paint.togglePaintMode);
    paintPannel.addEvent("show",curves.setVisible);

    // Add sliders and slider icons
    buttons.create(paint.setButtons([
            {x : 0, y : 11, w : 1, h : 1,command : commands.displayOnly, sprite : 136, className : "buttonDisplayOnly"},
            {x : 0, y : 12, w : 1, h : 1,command : commands.displayOnly, sprite : 137, className : "buttonDisplayOnly"},
            {x :12, y : 11, w : 1, h : 1,command : commands.displayOnly, sprite : 164, className : "buttonDisplayOnly"},
            {x :12, y : 12, w : 1, h : 1,command : commands.displayOnly, sprite : 139, className : "buttonDisplayOnly"},
            {x : 0, y : 13, w : 1, h : 1,command : commands.displayOnly, sprite : 165, className : "buttonDisplayOnly"},
            {x : 0, y : 14, w : 1, h : 1,command : commands.displayOnly, sprite : 138, className : "buttonDisplayOnly"},
            {x :12, y : 13, w : 1, h : 1,command : commands.displayOnly, sprite : 222, className : "buttonDisplayOnly"},
            {x :12, y : 14, w : 1, h : 1,command : commands.displayOnly, sprite : 223, className : "buttonDisplayOnly"},

            {x : 1, y : 11, w : 11, h : 1 , command : commands.paintBrushMin,  help : "Brush min size, or brush width", slider : { color : "#00A", min : 1, max : 60, stepRange : wheelStepRange60, step : 1,wStep : 1, value : 1 ,valueDisplayExtra : 5}},
            {x : 1, y : 12, w : 11, h : 1 , command : commands.paintBrushMax,  help : "Brush max size, or brush fat",   slider : { color : "#05A", min : 1, max : 60, stepRange : wheelStepRange60, step : 1,wStep : 1, value : 1 ,valueDisplayExtra : 5 }},
            {x :13, y : 11, w : 11, h : 1 , command : commands.paintCurveStep, help : "Curve step",slider : { color : "#974", min : 0, max : 60, stepRange : wheelStepRange60, step : 1,wStep : 1, value : 1 ,valueDisplayExtra : 5 }},
            {x :13, y : 12, w : 11, h : 1 , command : commands.paintBrushStep, help : "Brush step",  slider : { color : "#a74", min : 0, max : 60, stepRange : wheelStepRange60A, step : 1,wStep : 1, value : 1 ,valueDisplayExtra : 5 }},
            {x : 1, y : 13, w : 11, h : 1,  command : commands.paintLengthFade,help : "Brush Length Fade", slider : { color : "#737", min : 0, max : 200, stepRange : wheelStepRange200, step : 1,wStep : 1, value : 1 ,valueDisplayExtra : 5 }},
            {x : 1, y : 14, w : 11, h : 1,  command : commands.paintWidthFade, help : "Brush Width Fade",  slider : { color : "#847", min : 0, max : 200, stepRange : wheelStepRange200, step : 1,wStep : 1, value : 1 ,valueDisplayExtra : 5 }},
            {x :13, y : 13, w : 11, h : 1,  command : commands.paintPalletPickupPower,   slider : { color : "#695", min : 0, max : 99, stepRange : wheelStepRange100, step : 1,wStep : 1, value : 50 ,valueDisplayExtra : 5 }},
            {x :13, y : 14, w : 11, h : 1,  command : commands.paintPalletPickupRadius,   slider : { color : "#695", min : 0, max : 99, stepRange : wheelStepRange100, step : 1,wStep : 1, value : 50 ,valueDisplayExtra : 5 }},

            {x : 9, y : 9, w : 15, h : 1,dir : "right",command : commands.paintCurvePowA,   slider : { color : "#695", min : 0, max : 99, stepRange : wheelStepRange100, step : 1,wStep : 1, value : 50 ,valueDisplayExtra : 5 }},
        ]), { pannel : paintPannel, size : 16 }
    );

    colours.ready();
        
    mediaList.ready( mediaTabs.media);
    extrasList.ready(mediaTabs.extras);
    spriteList.ready(mediaTabs.sprites);

    editSprites.ready();
    timeline.ready();
    createSettingFold()

    buttons.mapSliders = false;
    paint.ready();
    paintPannel.toggleShow();
    spritePannel.toggleShow();
    colorPannel.toggleShow();
    mediaTabs.media.toggleShow();
    mediaTabs.sprites.toggleShow();

    keyboard.mapKeyCommand("KeyN",{},"editSprites",commands.edSprVideoCaptureFrame);
    keyboard.mapKeyCommand("KeyN",{},"drawing",commands.edSprVideoCaptureFrame);
    keyboard.mapKeyCommand("Space",{},"drawing",commands.paintCoordsToLog);
    keyboard.mapKeyCommand("Space",{ctrl : true},"drawing",commands.paintCoordsToClipboard);
    keyboard.mapKeyCommand("KeyN",{},"animation",commands.edSprVideoCaptureFrame);
    // Menus all created and set up add to DOM
    $$($("#buttons")[0],[uiFragment]);
    $$($("#timeline")[0],[uiFragmentAnim]);

    ({minRightSize : mainButtons.width});
    displaySizer({uiWinBottom : mediaTabs.tabContainer}); // so last pannels will size to fit.
    extrasList.update();
    extrasList.initBehaviour(); // some folds and selected items have custom behaviours
    keyboard.globalEscapeCommand = commands.sysGlobalEscape;
    
    


    setTimeout(()=>{
        if (localStorage[APPNAME + "_openMediaTab"]) { mediaTabs[localStorage[APPNAME + "_openMediaTab"]].toggleShow(); }
        mediaTabs.extras.addEvent("show",() => { localStorage[APPNAME + "_openMediaTab"] = "extras"});
        mediaTabs.media.addEvent("show",() => { localStorage[APPNAME + "_openMediaTab"] = "media" });
        timeline.showDOMRenderWarning = true;
        unloadWarning = false;


    }, 100);

})();

