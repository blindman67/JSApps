"use strict";
const unsafeCommands = [
    commands.paintFilterC,
    commands.paintFilterD,
    commands.paintFilterE,
    commands.paintFilterF,
];
const commandLineCommandSliders = [
    commands.edSprAlpha,
];
const commandLineCommands = [

    commands.sysShowFileHistory,

    commands.sysResetAll,
    commands.sysResetAllSilent,
    commands.sysSaveSettingsAsJSON,
    commands.sysSaveSettingsAsJSONWithDescriptions,
    commands.sysSaveCommandBuffer,
    commands.sysClearCommandBuffer,
    commands.sysHideUIToggle,
    commands.sysHideUIFull,
    commands.sysShowUITemp,
    commands.sysForceRightButton,
    commands.sysShowTimeBarTemp,
    commands.sysCommandManagerQueueCallback,
    commands.sysGlobalEscape,

    commands.testButton,
    commands.floatingPannelCommandsStart,
    commands.floatingPannelClose,
    commands.floatingPannelMinMax,
    commands.floatingPannelCommandsEnd,


    commands.scrollSwatchLeft,
    commands.scrollSwatchRight,
    commands.colorsPrevSwatch,
    commands.colorsNextSwatch,
    commands.colorsDarker,
    commands.colorsLighter,
    commands.colorsHueDown,
    commands.colorsHueUp,
    commands.colorsSatDown,
    commands.colorsSatUp,

    commands.mainColor,
    commands.secondColor,
    commands.swatchToMainColor,
    commands.drawModeOver,
    commands.drawModeErase,
    commands.drawModeOntop,
    commands.drawModeBehind,
    commands.drawModeLighter,
    commands.drawModeDarker,
    commands.drawModeOverB,
    commands.drawModeEraseB,
    commands.drawModeOntopB,
    commands.drawModeBehindB,
    commands.drawModeLighterB,
    commands.drawModeDarkerB,
    commands.setBackgroundColor,
    commands.setSpriteColor,
    commands.setImageBGColor,
    commands.setSnapGridColor,
    commands.setPalletDefault,
    commands.useHSLColorRange,
    commands.mediaSaveJpg,
    commands.mediaSavePng,

    commands.mediaDeleteImage,
    commands.mediaSelectFromSelected,
    commands.mediaReorder,
    commands.mediaSelectInvert,
    commands.mediaSelectAll,
    commands.mediaAddToWorkspace,
    commands.mediaSetToCutBuffer,
    commands.mediaGetFromCutBuffer,
    commands.mediaSetVideoSrc,
    commands.mediaCutBufferUpdate,
    commands.mediaImageZoomSendToTab,
    commands.mediaImageToClipboard,
    commands.spritesSelectAll,
    commands.spritesUnselectAll,
    commands.spritesSelectInvert,
    commands.spritesShowSelected,
    commands.spritesOrderUp,
    commands.spritesOrderDown,


    commands.spritesToDrawable,
    commands.spritesToDrawOn,
    commands.spritesToDrawOff,
    commands.spritesToggleToDraw,
    commands.spritesGroup,
    commands.spritesUngroup,
    commands.spritesOpenGroup,
    commands.spritesCloseGroup,
    commands.spritesCollect,
    commands.spritesUncollect,
    commands.spritesShowSprites,
    commands.spritesShowCollections,
    commands.spritesShowLayers,
    commands.spritesShowGroups,
    commands.saveForUndo,
    commands.spritesResetAll,




    commands.spritesRemember,
    commands.spritesRecall,
    commands.spritesSelectedToClipboard,
    commands.spritesSaveSelected,
    commands.spritesSaveSelectedLocal,
    commands.spritesSaveAll,
    commands.spritesSaveAllLocal,
    commands.spritesLoadFromLocal,

    commands.webGLFilterClose,
    commands.webGLFilterApply,
    commands.webGLFilterPreview,
	commands.webGLFilterReset,
	commands.webGLFilterCommandLineString,
    commands.webGLFilterCancel,
    commands.webGLFilterUpdateDialog,
    commands.webGLFilterArgsBase,


    //commands.extras,
    commands.extrasOption1,
    commands.extrasOption2,
    commands.extrasOption3,
    commands.extrasOption4,
    commands.edSprDelete,
    commands.edSprCopy,
    commands.edSprCopyAnim,
    commands.edSprImageCopy,
    commands.edSprAnimImgCopyInsert,
    commands.edSprAnimImgCopyAdd,
    commands.edSprAnimImgCopyReplace,
    commands.edSprAnimImgInsert,
    commands.edSprAnimImgAdd,
    commands.edSprAnimImgReplace,
    commands.edSprUpdateAnimPath,
    commands.edSprCloneAnim,
    commands.edSprClone,
    commands.edSprTop,
    commands.edSprBot,
    commands.edSprUp,
    commands.edSprDown,
    commands.edSprDouble,
    commands.edSprClipboardCopy,
    commands.edSprClipboardPaste,   
    commands.edSprUngroupSelected,
    commands.edSprGroupClose,
    commands.edSprGroupSelected,
    commands.edSprOpenSelectedGroup,
    commands.edSprOpenCopyGroup,
    commands.edSprSelectTree,
    commands.edSpriteToggleLookAt,
    commands.edSpriteToggleAttachTo,
	commands.edSpriteToggleLinkedTo,
    commands.edSpriteToggleTimeline,
    //commands.edSprHalf,
    commands.edSprDoubleHor,
    commands.edSprAlignRotate,
    commands.edSprDoubleVer,
    commands.edSprPattern,
    commands.edSprSnapTo,
    commands.edSprLiveCapture,
    commands.edSprCaptureSource,
    commands.edSprCreateCutter,
    commands.edSprCreateDraw,
    commands.edSprCreateVanish,
    commands.edSprCreateVanishB,
    commands.edSprCreateMarker,
    commands.edSprCreateGrid,
    commands.edSprCreateText,
    commands.edSprCreatePallet,
    commands.edSprCreateShape,
    commands.edSprCreateShape_Circle,
    commands.edSprCreateShape_Ellipse,
    commands.edSprCreateShape_Square,
    commands.edSprCreateShape_Rectangle,
    commands.edSprCreateShape_Polygon,
    commands.edSprCreateShape_Poly,
    commands.edSprCreateShape_Star,
    commands.edSprCreateShape_Gear,
    //commands.edSprCreateShape_Ellipsoid,
    commands.edSprCreateShape_Cone,
    //commands.edSprCreateShape_Eclipse,
    commands.edSprCreateShape_CompoundShape,
    commands.edSprCreateShape_CompoundCircle,
    commands.edSprCreateShape_CompoundLine,
    commands.edSprCreateShape_Arrow,
    commands.edSprCreateShape_AngleArrow,
    commands.edSprCreateShape_Vector,
    commands.edSprCreateShape_Tube,
    commands.edSprCreateShape_Sphere,
    commands.edSprCreateFunctionLink,
    commands.edSprJoinCompoundShape,
    commands.edSpriteToggleAttachPattern,
    commands.edSpriteAttachFuncInput,
    commands.edSpriteAttachFuncOutput,
    commands.edSpriteResetFunctionLinks,
    commands.edSpriteResetAllFunctionLinks,
    commands.edSpriteActivateFunctionLinks,
    commands.edSpriteDeActivateFunctionLinks,
    commands.edSpriteSyncFunctionLinks,
    commands.edSpriteFreeSyncFunctionLinks,
    commands.edSprOrderFunctionLinks,



    commands.edSprToggleOutline,
    commands.edSpriteToggleIKChain,
    commands.edSprToggleSpriteAsPaintSrc,
    commands.edSprVideoCaptureFrame,
    commands.edSprLiveCaptureVideo,
    commands.edSprUpdateAll,
	commands.edSprNextSubSprite,
	commands.edSprPrevSubSprite,
    commands.edSprUpdateUI,
    commands.edSprRevertImage,
    commands.edSprStoreImage,
    commands.edSprComp1,
    commands.edSprComp2,
    commands.edSprComp3,
    commands.edSprComp4,
    commands.edSprComp5,
    commands.edSprComp6,
    commands.edSprComp7,
    commands.edSprComp8,
    commands.edSprComp9,
    commands.edSprComp10,
    commands.edSprComp11,
    commands.edSprComp12,
    commands.edSprComp13,
    commands.edSprComp14,
    commands.edSprComp15,
    commands.edSprComp16,
    commands.edSprComp17,
    commands.edSprComp18,
    commands.edSprComp19,
    commands.edSprComp20,
    commands.edSprComp21,
    commands.edSprComp22,
    commands.edSprComp23,
    commands.edSprComp24,
    commands.edSprMirrorVer,
    commands.edSprMirrorHor,
    commands.edSprRotCW,
    commands.edSprRotCCW,
    commands.edSprAlignTop,
    commands.edSprAlignMid,
    commands.edSprAlignBot,
    commands.edSprAlignLeft,
    commands.edSprAlignCenter,
    commands.edSprAlignRight,
    commands.edSprClearSelected,
    commands.edSprSpaceVer,
    commands.edSprSpaceHor,
    commands.edSprResetView,
    commands.edSprResetViewFit,
    commands.edSprSetViewSprite,
    commands.edSprFitToo,
    commands.edSprLockUI,
    commands.edSpriteToggleShow,
    commands.edSpriteHide,
    commands.edSpriteHideFromRenderToggle,
    commands.edSpriteShow,
    commands.edSprResetScale,
    commands.edSprResetRot,
    commands.edSprClip,
    commands.edSprPad,
    commands.edSprDrawing,
    commands.edSprAlpha,
    commands.edSprStroke,
    commands.edSprFill,
    commands.paintCutBufferUpdate,
    commands.paintLine,
    commands.paintCircle,
    commands.paintRectangle,
    commands.paintCurve,
    commands.paintSpray,
    commands.paintImageSpray,
    commands.paintPoints,
    commands.paintImage,
    commands.paintFloodFill,
    commands.paintBrissle,
    commands.paintBrissleB,
    commands.paintBrissleC,
    commands.paintColPallet,
    commands.paintColImage,
    commands.paintBrushMin ,
    commands.paintBrushMax ,
    commands.paintCurveMixSource,
    commands.paintCurvePowA,
    commands.paintCurvePowB,
    commands.paintCurvePowC,
    commands.paintCurveStep,
    commands.paintBrushStep,
    commands.paintLengthFade,
    commands.paintWidthFade,
    commands.paintPalletPickupPower,
    commands.paintPalletPickupRadius,
    commands.paintClear,
    commands.paintUndo,
    commands.paintRedo,
    commands.paintRandColor,
    commands.paintColorBlend,
    commands.paintBrushSizeBlend,
    commands.paintUseGridGuides,
    commands.paintUseSnapGridGuides,
    commands.paintToggleGuidSpaceLockX,
    commands.paintToggleGuidSpaceLockY,
    commands.paintToggleGuidSpaceLockZ,
    commands.paintUseGuidesXY,
    commands.paintUseGuidesXZ,
    commands.paintUseGuidesYZ,
    commands.paintAntiAlias,
    commands.edSprSnapToggle,
    commands.paintCurveLineA,
    commands.paintCurveEaseA,
    commands.paintCurveEase2A,
    commands.paintCurveBellA,
    commands.paintCurveRandomA,
    commands.paintCurveRandRampA,
    commands.paintCurveWaveA,
    commands.paintCurveRepeatA,
    commands.paintCurveMultiplyA,
    commands.paintCurveInOutA,
    /*commands.paintCurveLineB,
    commands.paintCurveEaseB,
    commands.paintCurveEase2B,
    commands.paintCurveBellB,
    commands.paintCurveRandomB,
    commands.paintCurveRandRampB,
    commands.paintCurveWaveB,
    commands.paintCurveLineC,
    commands.paintCurveEaseC,
    commands.paintCurveEase2C,
    commands.paintCurveBellC,
    commands.paintCurveRandomC,
    commands.paintCurveRandRampC,
    commands.paintCurveWaveC,*/
    commands.paintUseDirection,
    commands.paintBrushOptionsA,
    commands.paintBrushOptionsB,
    commands.paintBrushOptionsC,
    commands.paintBrushOptionsD,
    commands.paintUseSpeed,
    commands.paintFadeAlphaDist,
    commands.paintMouseBrushTrackIncrease,
    commands.paintMouseBrushTrackDecrease,
    commands.paintSizeDist,
    commands.paintFilterA,
    commands.paintFilterB,
    commands.paintFilterC,
    commands.paintFilterD,
    commands.paintFilterE,
    commands.paintFilterF,
    commands.paintCutter,
    commands.paintMagicCutter,
    commands.paintCut,
    commands.paintCopy,
    commands.paintPaste,
    commands.paintCoordsToLog,
    commands.paintCoordsToClipboard,

    commands.paintSelectionOpts,
    commands.paintPasteToImage,
    commands.paintPasteToImageAndWorkSpace,
    commands.paintAsPattern,
    commands.paintSelectDefinesSprite,
    commands.paintSelectDefinesSpriteAndAddWorkSpace,
    commands.paintSelectAsClip,

    commands.paintCutBufMirV,
    commands.paintCutBufMirH,
    commands.paintCutBufRotCW,
    commands.paintCutBufRotCCW,
    commands.paintCutBufAnimPrev,
    commands.paintCutBufAnimNext,
    commands.paintCutBufUniform,
    commands.paintCutBufWidth,
    commands.paintCutBufHeight,


    commands.paintSaveDrawTypeState,
    commands.edSprShowGrid,
    //commands.edSprHide,
    commands.paintRecordPaintingToggle,


    commands.edSprShow,
    commands.animGotoStart,
    commands.animGotoEnd,
    commands.animGotoNextFrame,
    commands.animGotoPrevFrame,
    commands.animGotoNextFrameLoop,
    commands.animGotoPrevFrameLoop,
    commands.animGotoNextKey,
    commands.animGotoPrevKey,
    commands.animAddMark,
    commands.animRemoveMark,
    commands.animGotoPrevMark,
    commands.animGotoNextMark,

    commands.animTimePos,
    commands.animTimeSeg,
    commands.animEditMode,
    commands.animPlayPause,
    commands.animStop,
    commands.animIncreaseFrameStep,
    commands.animFrameStep,
    commands.animDecreaseFrameStep,
    commands.animRemoveAllKeys,
    commands.animStoreKeySelection,
    commands.animRecallKeySelection,
    commands.animRemoveCurrentKeys,
    commands.animRemoveSelectedTracks,
    commands.animMoveKeysLeft,
    commands.animMoveKeysRight,
    commands.animSetTrackLoop,
    commands.animSetTrackLoopOff,
    commands.animSetTrackPingPong,
    commands.animSetTrackReverse,
    commands.animSetTrackForward,
    commands.animSetKeyAll,
    commands.animSetKeyPosScale,
    commands.animSetKeyPos,
    commands.animSetKeyScale,
    commands.animSetKeyRotate,
    commands.animSetKey_x,
    commands.animSetKey_y,
    commands.animSetKey_sx,
    commands.animSetKey_sy,
    commands.animSetKey_rx,
    commands.animSetKey_ry,
    commands.animSetKey_a,
    commands.animSetKey_image,
    commands.animSetKey_rgb,
    commands.animFilterKeyPos,
    commands.animFilterKey_x,
    commands.animFilterKey_y,
    commands.animFilterKeyScale,
    commands.animFilterKey_sx,
    commands.animFilterKey_sy,
    commands.animFilterKeyRotate,
    commands.animFilterKey_rx,
    commands.animFilterKey_ry,
    commands.animFilterKey_a,
    commands.animFilterKey_image,
    commands.animFilterKey_rgb,


    commands.animSelectAllKeys,
    commands.animCopySelectedKeys,
    commands.animCutSelectedKeys,
    commands.animPasteSelectedKeys,
    commands.animPasteSelectedKeysAtTime,
    commands.animSelectAllTracks,
    commands.animSelectInvertTracks,
    commands.animTrackCompactToggle,
    commands.animKeyCurveLinear,
    commands.animKeyCurveEaseOut,
    commands.animKeyCurveEaseInOut,
    commands.animKeyCurveEaseIn,
    commands.animKeyCurveStep,


]
const commandIdToString = (()=>{
    const names = Object.keys(commands);
    return function(id){
        return names.find(name => commands[name] === id);
    }
})();
const commandRanges = {
    default : {start : 0, end : 0, handler : {command(){}}},
    handlers : [
        {start : commands.sysCommandsStart,   end : commands.sysCommandsEnd, handler : system},
        {start : commands.animStart,  end : commands.animEnd, handler : timeline},
        {start : commands.colors,  end : commands.colorsEnd, handler : colours},
        {start : commands.media,   end : commands.mediaEnd, handler : mediaList},
        {start : commands.sprites, end : commands.spritesEnd, handler : spriteList},
        {start : commands.extras, end : commands.extrasEnd, handler : extrasList},
        {start : commands.webGLFiltersStart, end : commands.webGLFiltersEnd, handler : webGLFilterMenus},
        {start: commands.floatingPannelCommandsStart, end: commands.floatingPannelCommandsEnd,  handler : buttons},
        {start: commands.edSpr, end : commands.edSprEnd, handler : editSprites},
        {start: commands.paintStart, end: commands.paintEnd, handler : paint},
    ],
    addHandler(start, end, handler, offset = 1){
        var handle;
        start -= offset;
        end += offset;
        commandRanges.handlers.push(handle = {start, end, handler});
        return handle;
    },
    removeHandler(handle){
        for(var i = 0; i < commandRanges.handlers.length; i ++){
            if(commandRanges.handlers[i] === handle){
                commandRanges.handlers.splice(i,1);
                return;
            }
        }
    },
    eachHandler(cb) {
        for(const range of commandRanges.handlers){
            cb(range.handler);
        }
    },
    getAPI(commandId){
        for(const range of commandRanges.handlers){
            if(range.handler && ((range.start !== undefined && commandId > range.start && commandId < range.end) || (range.command === commandId))){ return range.handler }
        }
        return commandRanges.default.handler;
    },
    getHandler(commandId){
        for(const range of commandRanges.handlers){
            if(range.handler && ((range.start !== undefined && commandId > range.start && commandId < range.end) || (range.command === commandId))){ return range.handler.command }
        }
        return commandRanges.default.handler;
    }
};

const uiPannelList = {}
mouse.onGlobalClick = function (event){
    if(event.target.commandId && !event.target.disabled){
        if(event.target.commandId === commands.pannelClicked){ event.target.pannel.toggleShow() }
        else{
            const t = event.target;
            if (t.modCommands) {
                const mod = (mouse.ctrl ? "C" : "") + (mouse.shift ? "S" : "") + (mouse.alt ? "A" : "") + ("_"+mouse.oldButton);
                const modCommand = t.modCommands[mod];
                if (t.modEnabled[mod] && modCommand !== undefined) {
                    const API = commandRanges.getAPI(modCommand);
                    if(API.commandCallSimple !== true){
                        API.command(modCommand ,null, event);
                    }else{
                        API.command(modCommand);
                    }
                    return;
                } else if(modCommand !== undefined) { return; }
            }

            const API = commandRanges.getAPI(t.commandId);
            if(API.commandCallSimple !== true){
                API.command(t.commandId,null,event);
            }else{
                API.command(t.commandId);
            }

        }
    }
};
function simulateCommand(commandId, mouseState){
    mouse.save();
    mouse.state = mouseState;
    const API = commandRanges.getAPI(commandId);
    var result;
    result = API.command(commandId);
    mouse.restore();
    return result
}
function issueCommand(commandId, ...args){
    if (commandId === commands.sysGlobalEscape) {
        commandQueue.clear();
        commandRanges.eachHandler(API => {
            API.commandCallSimple !== true ?  API.command(commandId, ...args) : API.command(commandId);
        });
        return;
    }
    //if (commandQueue.cmds.length) {
    //    commandQueue.add(commandId, 0, args);
    //    return;
    //} 
    const API = commandRanges.getAPI(commandId);
    return API.commandCallSimple !== true ?  API.command(commandId, ...args) : API.command(commandId);
}
const commandQueue = {
    cmds: [],
    hdl: 0,
    consume() {
        if (commandQueue.cmds.length) {
            const cmd = commandQueue.cmds.shift();
            if (cmd.cId === commands.sysCommandManagerQueueCallback) {
                if (cmd.args[0] instanceof Function) {
                    cmd.args[0]();
                }
            } else {
                const API = commandRanges.getAPI(cmd.cId);
                API.commandCallSimple !== true ?  API.command(cmd.cId, ...cmd.args) : API.command(cmd.cId);   
            }
            if (commandQueue.cmds.length) {
                commandQueue.hdl = setTimeout(commandQueue.consume, cmd.msDelay);
            }
        }            
    },
    clear() {
        clearTimeout(commandQueue.hdl);
        commandQueue.cmds.length = 0;
    },
    add(cId, msDelay, args) {
        if (!commandQueue.cmds.length) { 
            commandQueue.hdl = setTimeout(commandQueue.consume, msDelay);
        }
        commandQueue.cmds.push({
            cId,
            msDelay,
            args
        });
        
    },
    
}
function queueCommand(commandId, msDelay, ...args){
    commandQueue.add(commandId, msDelay, args);
}
/*function issuseCommand(...args){ // Bad spelling. This is here until all code has been refactored
log.warn("Legacy issue command call");
    return issueCommand(...args);
}*/