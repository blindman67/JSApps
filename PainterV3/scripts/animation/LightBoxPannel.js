"use strict";
function LightBoxPannel() {
    var butMap = new Map();
    const OFFSET_GROUP = "lightlayerOffset";
    const LAYER_GROUP = "lightBoxLayer";
    const OFFSET_CHECK_CLASS_NAME = "lightBoxRadioOnFrame";
    const alphas = [
        {value: 0.1, checkClassName: "alphaVLow"},
        {value: 0.2, checkClassName: "alphaLow" },
        {value: 0.5, checkClassName: "alphaMedium" },
        {value: 0.7, checkClassName: "alphaHigh" } ,
    ];
    const getLayerAlphaIdx = layConfig => {
        let idx = 0;
        for (const alp of alphas) {
            if (layConfig.alpha <= alp.value) { return idx }
            idx ++;
        }
        return alphas.length - 1;
    }
    const animatedImageSpriteCommands = [
        commands.edSprAnimImgCopyAdd,
        commands.edSprAnimImgCopyInsert,
        commands.edSprAnimImgCopyReplace,
        commands.edSprAnimImgAdd,
        commands.edSprAnimImgInsert,
        commands.edSprAnimImgReplace,
    ];

    var forceAnimUpdate = false;
    var selectedLayer = 0;
    var selectedLayerAlpha;
    const commandsFuncs = {
        [commands.lightBoxToggle]() {
            animation.lightboxOn = !animation.lightboxOn;
            forceAnimUpdate = true;
            return false;
        },
        [commands.lightBoxCyclePastEnds](e, comId, left, right) {
            const cConfig = animation.getLightBoxLayconfig(selectedLayer);
            if (left) {
                const cycle = !cConfig.cycle;
                animation.configLightBoxLayer(selectedLayer, cConfig.offset, cConfig.alpha, cycle);
            } else if (right) {
                const cycle = !cConfig.cycle;
                let idx = 0;
                while (idx < selectedLayer) { animation.configLightBoxLayer(idx++, undefined, undefined, cycle); }
            }
            forceAnimUpdate = true;
            return false;

        },
        [commands.lightBoxLayerFirst](e, comId, left, right) {
            var layer = Math.max(1, comId - commands.lightBoxLayerFirst + 1);
            if (left) {
                if (animation.lightBoxLayers < layer) {
                    animation.lightBoxLayers = layer;
                    forceAnimUpdate = true;
                }
                selectedLayer = layer - 1;
            } else if (right) {
                if (animation.lightBoxLayers >= layer && layer > 1) {
                    animation.lightBoxLayers = layer - 1;
                    forceAnimUpdate = true;
                    if (selectedLayer >= layer - 1) { selectedLayer = layer - 2 }
                }
            }
            return false;
        },
        [commands.lightBoxTimeOffsetFirst](e, comId, left, right) {
            var offset = (comId - commands.lightBoxTimeOffsetFirst) - 8;
            if (selectedLayer < animation.lightBoxLayers) {
                offset = offset <= 0 ? offset - 1 : offset;
                const cConfig = animation.getLightBoxLayconfig(selectedLayer);
                if (cConfig && offset === cConfig.offset) {
                    let idx = getLayerAlphaIdx(cConfig);
                    if (right) {
                        idx -= idx > 0 ? 1 : 0;
                    } else if (left) {
                        idx += idx < alphas.length-1 ? 1 : 0;
                    }
                    selectedLayerAlpha = alphas[idx];
                } else {
                    selectedLayerAlpha = alphas[getLayerAlphaIdx(cConfig)];
                }
                animation.configLightBoxLayer(selectedLayer, offset, selectedLayerAlpha.value);
                forceAnimUpdate = true;
                return false;
            }
        }
    };

    function setButtons(buttons){ for(const but of buttons){ butMap.set(but.command, but) }  return buttons }
    function closeDialog(){ pannel = undefined; handler.close() }
    var pannel = buttons.FloatingPannel($("#floatingContainer")[0],{title : "Animation utilities", width : 18*22+3, height: 32+21+15, onclosing : closeDialog, className: "lightBoxPannel"});
    if(!pannel){return}
    var idx1 = commands.lightBoxLayerFirst, idx = commands.lightBoxTimeOffsetFirst;
    var sprIdxOff = 57 + 2 * 22, sprIdxLay = sprIdxOff + 9 * 22;
    const lightOnEnableList = [commands.lightBoxCyclePastEnds, commands.lightBoxLayerFirst, commands.lightBoxTimeOffsetFirst]
    function addLayCom(id) { commandsFuncs[id] = commandsFuncs[commands.lightBoxLayerFirst]; lightOnEnableList.push(id); return id }
    function addOffCom(id) { commandsFuncs[id] = commandsFuncs[commands.lightBoxTimeOffsetFirst]; lightOnEnableList.push(id); return id }
    var className = "buttonSprite";
    var group = LAYER_GROUP;
    var help = "Selected layer time offset\nWhen selected [LEFT] or [RIGHT] click to change layer alpha";
    var helpLay = "[LEFT] Click select and turn on layer\n[RIGHT] click turn off layer";
    var y = (1 / 21) * 2 ;
    var y1 = (1 / 21) * 24
    buttons.create(setButtons([
            {dir: "right", x: 0, y, w: 1, h: 1,
                                command: idx++,            group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {x: 10.0, dir: "right",
                 y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: (sprIdxOff+=13,sprIdxOff++) , help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},
            {    y, w: 1, h: 1, command: addOffCom(idx++), group: OFFSET_GROUP, className, sprite: sprIdxOff++, help},

            {x: 9.0, y: y , w: 1, h: 1, command : commands.lightBoxToggle, className, sprite: 57 + 11 * 22 - 3, sprites: [57 + 11 * 22 - 3, 57 + 11 * 22 - 2]},
            {dir: "right", x: 11, y: y = y1, w: 1, h: 1,
                                   command: idx1++,            group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {       y, w: 1, h: 1, command: addLayCom(idx1++), group, className, sprite: sprIdxLay++, help: helpLay},
            {x:10,   y, w: 1, h: 1, command: commands.lightBoxCyclePastEnds, className, sprite: 57 + 12 * 22 - 3, sprites: [57 + 12 * 22 - 3, 57 + 12 * 22 - 2], help: "Toggles selected layer show past ends\n[RIGHT] click toggles all active layers"},
            {x:0,   y, w: 1, h: 1, command: commands.edSprAnimImgCopyAdd,     className, sprite: 57 + 12 * 22 - 1, help: "Copy current frame and add to end of animation"},
            {x:1,   y, w: 1, h: 1, command: commands.edSprAnimImgCopyInsert,  className, sprite: 57 + 12 * 22 - 0, help: "Copy current frame and insert at current time"},
            {x:2,   y, w: 1, h: 1, command: commands.edSprAnimImgCopyReplace, className, sprite: 57 + 12 * 22 + 1, help: "Copy current frame and add at current time"},
            {x:3,   y, w: 1, h: 1, command: commands.edSprAnimImgAdd,         className, sprite: 57 + 12 * 22 + 2, help: "Copy current frame and add to end of animation"},
            {x:4,   y, w: 1, h: 1, command: commands.edSprAnimImgInsert,      className, sprite: 57 + 12 * 22 + 3, help: "Copy current frame and insert at current time"},
            {x:5,   y, w: 1, h: 1, command: commands.edSprAnimImgReplace,     className, sprite: 57 + 12 * 22 + 4, help: "Copy current frame and add at current time"},


        ]), {pannel, size: 21, pannelSizeFixed: true}
    );

    var handler = {
        commands: commandsFuncs,
        command(commandId, _empty, event){
            if (handler.commands?.[commandId](event, commandId, (mouse.oldButton & 1) === 1, (mouse.oldButton & 4) === 4) !== false) { return }
            handler.updateUI();
        },
        updateUI() {
            if (LightBoxPannel.open) {
                butMap.get(commands.lightBoxToggle).setSprite(animation.lightboxOn ? 0 : 1);
                const layers = animation.lightBoxLayers;
                if (!animation.lightboxOn) {
                    for(const id of lightOnEnableList) { butMap.get(id).disable() }
                } else {
                    for(const id of lightOnEnableList) { butMap.get(id).enable() }
                }
                var i = 0;
                buttons.groups.clearGroup(LAYER_GROUP);
                buttons.groups.clearGroup(OFFSET_GROUP);
                while (i < layers) {
                    if (selectedLayer === i) {
                        buttons.groups.setCheck(LAYER_GROUP, commands.lightBoxLayerFirst + i++, true, "radioOnSelected");
                        const cConfig = animation.getLightBoxLayconfig(selectedLayer);
                        if (cConfig) {
                            butMap.get(commands.lightBoxCyclePastEnds).setSprite(cConfig.cycle ? 0 : 1);
                            const offset = cConfig.offset < 0 ? cConfig.offset + 1 : cConfig.offset;
                            selectedLayerAlpha = alphas[getLayerAlphaIdx(cConfig)];
                            const comId = commands.lightBoxTimeOffsetFirst + 8 + offset;
                            buttons.groups.setCheck(OFFSET_GROUP, comId, true, OFFSET_CHECK_CLASS_NAME);
                            buttons.groups.setCheck(OFFSET_GROUP, comId, true, selectedLayerAlpha.checkClassName);
                        }
                    } else {
                        buttons.groups.setCheck(LAYER_GROUP, commands.lightBoxLayerFirst + i++, true);
                    }
                }
                if (forceAnimUpdate) { animation.forceUpdate(true) }
                forceAnimUpdate = false;
            }
        },
        spriteStateChangeChanged() {
            var hasAnimatedImages = false;
            selection.eachOfType(spr => {
                if (spr.type.animated && spr.animation.tracks.image) { return hasAnimatedImages = true }
            },"image");
            if (hasAnimatedImages) {
                for (const comId of animatedImageSpriteCommands) { butMap.get(comId).enable() }
            } else {
                for (const comId of animatedImageSpriteCommands) { butMap.get(comId).disable() }
            }
        },
        close(){
            editSprites.removeEvent("update",handler.spriteStateChangeChanged);
            LightBoxPannel.open = false;
            commandRanges.removeHandler(handler.handle);
            butMap = undefined;
            handler = undefined;
        }
    }
    handler.handle = commandRanges.addHandler(commands.lightBoxStart, commands.lightBoxEnd, handler);
    editSprites.addEvent("update",handler.spriteStateChangeChanged);
    handler.spriteStateChangeChanged();
    LightBoxPannel.open = true;
    handler.updateUI();
}