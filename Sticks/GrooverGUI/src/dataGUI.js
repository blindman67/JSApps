"use strict";
    
    const dataGUI = {
        reserved : ["name","onclose","onchanged","onbeforeclose","onafterupdate","oncancel","onok","onmoved","ondock","onundock","onfolded","onunfolded","dialogState"],
        createDialog(data, extras){
            var keys = Object.keys(data).filter(name=>name[0] !== "_" && dataGUI.reserved.indexOf(name) === -1);
            var name = data.name ? data.name : "dialog";
            var ui = dialog.create(name, {
                state:          data.dialogState, 
                onbeforeclose:  data.onbeforeclose,
                onchanged:      data.onchanged,
                onclosed:       data.onclose,
                onafterupdate:  data.onafterupdate,
                ondock:         data.ondock,
                onundock:       data.onundock,
                onfolded:       data.onfolded,
                onunfolded:     data.onunfolded,
                onmoved:        data.onmoved,
                container:      "#GUI-container",   
                data:           data,
            });
            data._controls = ui.controls;
            data._dialog = ui;        
            var commonState = {};
            if(data.dialogState && data.dialogState.commonState){
                commonState = data.dialogState.commonState;
                data.dialogState.commonState = undefined;
            }
            ui.building = true;
            keys.forEach(key => {
                const setUpKeyboardBinding = (data,info) => {
                    ["", "Left", "Mid", "Right"].forEach(but=>{
                        if( typeof data["key" + but] === "string"){
                            var keyMods;
                            if (typeof data["keyMod" + but] === "string") { keyMods = data["keyMod" + but].split(",") }
                            info["keyboardShortcut"+but] = GUI.events.getKeyName(data["key" + but], keyMods) ;
                            if (info.help) {
                                if (keyMods) {  info.help += "\n[" + keyMods.join("") + "" + data["key" + but] + "]" }
                                else { info.help += "\n[" + data["key" + but] + "]" }
                            }
                        }    
                    });
                    if (data.keyboardPreventDefault) { info.keyboardPreventDefault = data.keyboardPreventDefault }
                }                
                const getSubKey = (subKey, name, defaultValue) => {
                    return typeof data[key]["_"+subKey] === "object" &&  data[key]["_"+subKey][name] !== undefined ? data[key]["_"+subKey][name] : defaultValue;
                }
                var type;
                var  info;
                type = typeof data[key];
                info = Object.assign({},commonState,{
                    type,
                    dialog:         ui,
                    name:           key,
                    displayName:    GUI.utilities.nameToReadable(key),
                    help:           data["_"+key] && data["_"+key].help ? data["_"+key].help : "",
                    property:       key,
                    data:           data,
                });
                if (type === "string") {
                    if(data[key].indexOf("##") === 0){
                        var dat = data[key].substr(2);
                        var setting = dat.split(",");
                        if (!isNaN(setting[0].trim())){
                            var dat = data[key].substr(2);
                            info.type = "slider";
                            data[key] = Number(setting.shift().trim());
                            info.min = Number(setting.shift().trim());
                            info.max = Number(setting.shift().trim());
                            info.step = Number(setting.shift().trim());
                            if(setting[0].trim().toLowerCase() === "ticks"){
                                setting.shift();
                                info.showTicks = true;
                            }
                            info.help = setting.join(",");
                        } else if(setting[0].trim() === "true" || setting[0].trim() === "false"){
                            info.type = "checkBox";
                            info.images = {
                                    on : "#SpriteSheet,checkBoxDefault,1",
                                    off : "#SpriteSheet,checkBoxDefault,0",
                                };
                            data[key] = info.checked = setting.shift().trim() === "true";
                            info.help =  setting.join(",").trim();
                        }
                    } else if (data[key].indexOf("**") === 0) {
                        var dat = data[key].substr(2);
                        var setting = dat.split("**");
                        data[key] = setting[0];  // the value can be empty
                        info.placeholder = setting[1] ? setting[1] : "Enter text";
                        info.help = setting[2] ? setting[2] : "";
                        info.type = "stringInput";
                    } else if (data[key].indexOf("==") === 0) {
                        var dat = data[key].substr(2);
                        var setting = dat.split(",");
                        info.displayName = data[key] = setting.shift();
                        info.height = setting.shift();
                        if (setting[0][0] === "#") { info.background = setting.shift(); }
                        info.help = setting.length ? setting.join(",") : "";
                        info.type = "separator";
                    } else if (data[key].indexOf("&&") === 0) {
                        var dat = data[key].substr(2);
                        var setting = dat.split(",");
                        info.displayName = data[key] = setting.shift();
                        info.height = setting.shift();
                        if (setting[0][0] === "#") { info.background = setting.shift(); }
                        info.help = setting.length ? setting.join(",") : "";
                        info.type = "color";
                    } else {
                        return;
                    }
                } else if (type === "number") {
                    info.type = "slider";
                } else if (type === "boolean") {
                    info.type = "checkBox";
                    info.images = {
                            on : "#SpriteSheet,checkBoxDefault,1",
                            off : "#SpriteSheet,checkBoxDefault,0",
                        };
                    info.checked = data[key];
                    help = data["_"+key] && data["_"+key].help ? data["_"+key].help : "";
                    
                }else if (Array.isArray(data[key])) {
                    if (typeof data[key][0] === "boolean"){
                        /* not sure if I will do this one */
                    }else {
                        if(data[key].length < 3){
                            info.type = "toggleString";      
                            info.states = data[key];
                        }else{
                            info.items = data[key];
                            info.type = "selection";
                        }
                    }
                }else if(type === "object"){
                    var subKeys = Object.keys(data[key]).filter(subKey=>subKey[0] !== "_");
                    if(subKeys.length > 0){
                        const firstItem = data[key][subKeys[0]];
                        if(typeof firstItem === "boolean" || (typeof firstItem === "string" && firstItem.indexOf("##") === 0)){
                            info.type = "buttons";
                            const iconDefault = {name : "checkBoxDefault",index :0, onIndexOffset : 1}
                            info.buttons = [];
                            subKeys.forEach(subKey => {

                                var helpKey = "";
                                const dat = data[key];
                                var val = dat[subKey];
                                var help = GUI.utilities.nameToReadable(subKey);
                                var toggles = false;
                                if(typeof val === "string"){
                                    val = val.substr(2).split(",");
                                    dat[subKey] = val[0] === "true" ? true : false;
                                    help = val[1] ? val[1] : help;
                                }else if(Array.isArray(val)){
                                    dat[subKey] = val[0];
                                    toggles = true;
                                }
                                const subInfo = {}
                                subInfo.name = subKey;
                                subInfo.displayName = GUI.utilities.nameToReadable(subKey);
                                subInfo.likeCheckBox = true;
                                subInfo.asIcon = getSubKey(subKey, "icon", iconDefault);
                                subInfo.active = getSubKey(subKey, "active", true);
                                if(toggles) { subInfo.toggles = val }
                                var breakLine = getSubKey(subKey, "breakLine", undefined);
                                if(breakLine !== undefined ) { subInfo.breakLine = breakLine }
                                var radio = getSubKey(subKey, "radio", undefined);
                                if(radio !== undefined ) { subInfo.radio = radio }
                                subInfo.onclick = function(event, control){
                                    if(radio !== undefined) { return }
                                    if(toggles){
                                        var i = (val.indexOf(dat[subKey]) + 1) % val.length;
                                        dat[subKey] = val[i];                                        
                                        return {iconIndex : subInfo.asIcon.indexs[i], bothIcons : true}
                                    }
                                    var state = dat[subKey] = !dat[subKey];
                                    var icon = state ? subInfo.asIcon.onIndexOffset : 0;
                                    return {iconIndex : icon, bothIcons : true}
                                };
                                subInfo.fireOnMouseDown = getSubKey(subKey, "fireOnMouseDown", false);
                                subInfo.help = getSubKey(subKey, "help", help);
                                info.buttons.push(subInfo);
                                if(typeof dat["_"+subKey] === "object"  && typeof dat["_"+subKey].key === "string"){
                                    setUpKeyboardBinding(dat["_"+subKey],subInfo);
                                }
                            });
                        }else {
                            info.type = "buttons";
                            info.buttons = [];
                            subKeys.forEach(subKey => {
                                if(subKey === "lineCap") { log("SS : " + subKey) }
                                if(typeof data[key][subKey] === "function"){
                                    var helpKey = "";
                                    var subInfo;
                                    info.buttons.push(subInfo = {
                                        name : subKey,
                                        displayName : GUI.utilities.nameToReadable(subKey),
                                        asIcon : getSubKey(subKey, "icon", undefined),
                                        active : getSubKey(subKey, "active", true),
                                        onclick : data[key][subKey].bind(data),
                                        fireOnMouseDown : getSubKey(subKey, "fireOnMouseDown", undefined),
                                        help : getSubKey(subKey, "help", GUI.utilities.nameToReadable(subKey)),
                                    });
                                    if(typeof data[key]["_"+subKey] === "object"  && typeof data[key]["_"+subKey].key === "string"){
                                        setUpKeyboardBinding(data[key]["_"+subKey],subInfo);
                                    }
                                }
                            });
                        }
                    }
                }else if(type === "function"){
                    info.buttons = [{
                        name : key,
                        displayName : info.displayName,
                        onclick : data[key].bind(data),
                    }]
                    info.type = "buttons";
                }
                if(data["_"+key] !== null && !Array.isArray(data["_"+key]) && typeof data["_"+key] === "object"){
                    info = Object.assign(info,data["_"+key]);  
                    setUpKeyboardBinding(data["_"+key],info);
                }
                
                if (info.type === "slider") { GUI.UIs.slider.create(key,info) }
                else if (info.type === "iconGroup") { GUI.UIs.iconGroup.create(key,info) }
                else if (info.type === "checkBox") { GUI.UIs.checkBox.create(key,info) }           
                else if (info.type === "toggleString") { GUI.UIs.toggleString.create(key,info) }
                else if (info.type === "stringInput") {GUI.UIs.stringInput.create(key,info) }
                else if (info.type === "separator") { GUI.UIs.separator.create(key,info) }
                else if (info.type === "color") { GUI.UIs.color.create(key,info) }
                else if (info.type === "selection") { GUI.UIs.selection.create(key,info) }
                else if (info.type === "buttons") {GUI.UIs.buttons.create(key,info) }
            });
            if(extras !== undefined){
                if(extras.toLowerCase() === "okcancel" || extras.toLowerCase() === "cancelok"){
                    var butts = [{
                            name : "cancel",
                            displayName : "Cancel",
                            onclick(event,control) { 
                                if(data.oncancel) { data.oncancel(event,control) }
                                ui.close(event) ;
                            }
                        },{
                            name : "ok",
                            displayName : "OK",
                            onclick(event,control) { 
                                if(data.onok) { data.onok(event,control) }
                                ui.close(event) ;
                            }
                        }
                    ];
                }
                if(extras.toLowerCase() === "ok"){
                    var butts = [{
                            name : "ok",
                            displayName : "OK",
                            onclick(event,control) { 
                                if(data.onok) { data.onok(event,control) }
                                ui.close(event) ;
                            }
                        }
                    ];
                }
                GUI.UIs.buttons.create("confirmExit",{name:"confirmExit",dialog:ui,buttons:butts});
            }
            ui.buildComplete();        
            return ui;
        }  
    }
    GUI.dataGUI = dataGUI;
