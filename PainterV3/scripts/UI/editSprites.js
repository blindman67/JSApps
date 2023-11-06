"use strict";
const editSprites = (()=>{
    var view;
    var undoableDebounceHdl;
    var undoable = false;
    const buttonMap = new Map();
    var listElement;
    const patternReps = ["repeat","repeat-x","repeat-y","no-repeat"];
    const pixelSnapValues = [1,2,4,8,16,24,32,48,64,96,128,192,256];
    var cancelSelecting = false;
    const keepEnabled = [];
    const noSelectList = [];
    const imageOnlyList = [];
    const cutterOnlyList = [];
    const normalisableHideList = []; // list of commands to turn off that will not work on normalizable sprites

    const drawableOnlyList = [];
    const drawingModeDisable = [];
    const partOfTreeOnlyList = [];
    const attachedOnlyList = [];
    const displaySizerQuery = {isTimelineOpen : true};
    const lastFillColUsed = {r:0,g:0,b:0,css:"#000"};
    const compModes = "source-over,lighter,multiply,screen,overlay,color-dodge,color-burn,hard-light,soft-light,difference,exclusion,hue,saturation,color,luminosity,source-atop,source-in,source-out,destination-over,destination-atop,destination-in,destination-out,copy,xor".split(",");
    function createLists(){
        noSelectList.push(...[
            commands.edSprDelete,
            //commands.edSprImageCopy,


            commands.edSprCopy,
            commands.edSprClone,
            commands.edSprTop,
            commands.edSprBot,
            commands.edSprUp,
            commands.edSprDown,
            commands.edSprDouble,
            commands.edSprDoubleHor,
            commands.edSprDoubleVer,
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
            commands.edSprSpaceVer,
            commands.edSprSpaceHor,
            commands.edSprAlignRotate,
            commands.edSpriteToggleLookAt,
            commands.edSpriteToggleAttachTo,
            commands.edSprLockUI,
            commands.edSpriteToggleShow,
            commands.edSpriteHideFromRenderToggle,
            commands.edSprToggleSpriteAsPaintSrc,
            commands.edSprFitToo,
            commands.edSprResetScale,
            commands.edSprResetRot,
            commands.edSprClip,
            commands.edSprPad,
            commands.edSprClearSelected,
            commands.animSetKeyAll,
            //commands.edSprUndo,
            //commands.edSprRedo,
            //commands.edSprStoreImage ,
            //commands.edSprRevertImage,
            commands.edSprLiveCapture,
            commands.edSprCaptureSource,
            commands.edSprSmooth,
            commands.edSprSnapTo,
            commands.edSprAlpha,
            commands.edSprFill,
            commands.edSprStroke,
            commands.edSprPattern,
            commands.edSpriteToggleAttachScale,
            commands.edSpriteToggleAttachmentScale,
            commands.edSpriteToggleAttachRotate,
            commands.edSpriteToggleXYPositionLocks,
            commands.edSpriteAddLocator,
            commands.edSprToggleOutline,
            commands.edSprSelectTree,
            commands.edSprSetViewSprite,
			commands.edSprNextSubSprite,
			commands.edSprPrevSubSprite,

        ]);
        normalisableHideList.push(
            commands.edSpriteToggleAttachScale,
            commands.edSpriteToggleAttachmentScale,
        );
        cutterOnlyList.push(...[
            //commands.edSprPattern,
        ]);
        imageOnlyList.push(...[
            commands.edSprSmooth,
			commands.edSprNextSubSprite,
			commands.edSprPrevSubSprite,
            commands.edSprComp0 ,
            commands.edSprComp1 ,
            commands.edSprComp2 ,
            commands.edSprComp3 ,
            commands.edSprComp4 ,
            commands.edSprComp5 ,
            commands.edSprComp6 ,
            commands.edSprComp7 ,
            commands.edSprComp8 ,
            commands.edSprComp9 ,
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
        ]);
        drawableOnlyList.push(...[
            commands.edSprClip,
            commands.edSprPad,
            commands.edSprLiveCapture,
            commands.edSprToggleSpriteAsPaintSrc,
            commands.edSprClearSelected,
        ]);
        drawingModeDisable.push(...[
            commands.edSprAlignRotate,
            commands.edSpriteToggleLookAt,
            commands.edSpriteToggleAttachTo,
            commands.edSpriteAddLocator,
            commands.edSprFitToo,
            commands.edSprDelete,
            commands.edSprLockUI,
            commands.edSpriteToggleShow,
            commands.edSpriteHideFromRenderToggle,
        ]);
        attachedOnlyList.push(...[
            commands.edSpriteToggleAttachScale,
            commands.edSpriteToggleAttachmentScale,
            commands.edSpriteToggleAttachRotate,
        ]);
        partOfTreeOnlyList.push(...[
            commands.edSprSelectTree,
        ]);
    }
    function confirmDialog(title, textLines, options) {
        return new Promise(response => {
            if (commandLine.quickMenuOpen()) { log.warn("Close active dialogs first"); response(null);  }
            else {
                const confirmRes = buttons.quickMenu( "20 " + title + "|" + options.join(",") + "|textCenter " + textLines.map(t=>t.replace(/([^\\])\?/g, "$1\\?")).join(",textCenter "));
                confirmRes.onclosed = () => { response(confirmRes.exitClicked); }
            }
        });
    }
    function selectionCallbackClean(fittingSprites,buttonGroupName) {
        if(buttonGroupName) {
            buttons.groups.setRadio(buttonGroupName, -1);
        }
        spriteRender.highlightAxis = false;
        selection.clear(true);
        selection.add(fittingSprites);
        fittingSprites.length = 0;
        keepEnabled.length = 0;
        cancelSelecting = false;
    }
    function mirrorSelection(direction) {
        const attList = [];
        const extent =  selection.getExtent();
        const mx = direction === "hor" ? -1 : 1
        const my = direction === "vert" ? -1 : 1
        const cx = extent.w / 2 + extent.x;
        const cy = extent.h / 2 + extent.y;
        selection.sortByAttached("attachOrder");
        selection.each(spr => {
            if(spr.attachedTo) {
                attList.push({
                    spr,
                    attachedTo : spr.attachedTo,
                    attachment : spr.attachment
                });
                spr.clearAttached();
            }
        });
        selection.each(spr => {
            var x,y;
            if(spr.type.animated) {
                const a = spr.animation;
                if(a.tracks.x) {for(const k of a.tracks.x.keys) { k.value = cx + (k.value - cx) * mx }}
                if(a.tracks.y) {for(const k of a.tracks.y.keys) { k.value = cy + (k.value - cy) * my }}
                if(a.tracks.rx) {
                    for(const k of a.tracks.rx.keys) {
                        if (mx < 0) { k.value = Math.PI -k.value }
                        if (my < 0) { k.value =  -k.value }
                    }
                }
                if(a.tracks.ry) {
                    for(const k of a.tracks.ry.keys) {
                        if (mx < 0) { k.value = Math.PI -k.value }
                        if (my < 0) { k.value =  -k.value }
                    }
                }
            }
            spr.x = cx + (spr.x - cx) * mx;
            spr.y = cy + (spr.y - cy) * my;
            var applyRot = true;
            if(spr.type.lookat) {
                if(mx < 0) { spr.lookat.offsetX = Math.PI - spr.lookat.offsetX; }
                if(my < 0) { spr.lookat.offsetX = - spr.lookat.offsetX; }
            }
            if (spr.type.attached && spr.attachment.inheritRotate) {
                applyRot = false;
            }
            if(applyRot) {
                if(mx < 0) {
                    spr.rx = Math.PI - spr.rx;
                    spr.ry = Math.PI - spr.ry;
                }
                if(my < 0) {
                    spr.rx =  - spr.rx;
                    spr.ry =  - spr.ry;
                }
            }
            spr.key.update();
        });
        for(const {spr, attachedTo, attachment} of attList) {
            spr.attachSprite(attachedTo);
            spr.attachment.position();
            spr.attachment.inheritScaleX = attachment.inheritScaleX;
            spr.attachment.inheritScaleY = attachment.inheritScaleY;
            spr.attachment.rotateType = attachment.inheritRotate ? "inherit": "fixed";
            spr.attachment.scaleAttach = attachment.scaleAttachX;
        }
        selection.each(spr => spr.key.update());
        selection.callIf(spr => spr.type.normalisable, "normalize");
    }
    function copySelected(clone, copyAnim, copyTree, noShadow = false, copyAnimImages = false, addAnimImage = false, addAnimImageOp, count = 1, blankCopyImage = false) {
        var sprite;
        spriteList.holdUpdates = true;
        const newSprites = [];
        const newGSprites = [];
        const oldSprites = [];
		const IK = [];
        if (!clone) {

        }
        const copySizeOnly = blankCopyImage;
        sprites.cleanup();
        selection.sortByIndex();
        selection.each(spr => {
            if(!clone && spr.type.image) {
				if(copyAnimImages && spr.type.animated && spr.animation.tracks.image && spr.animation.tracks.image.keys.length > 0) {
					const uniqueImages = new Map(spr.animation.tracks.image.keys.map(key => [key.value.guid, {img: key.value, copy: null}]));
					let sprCopy;
                    if (copyAnim) {
                        if(spr.shadow && !noShadow) {
                            newGSprites.push(spr.cast.group.add(sprCopy = spr.copy(copyAnim, copyTree, clone)));
                        } else {
                            oldSprites.push(spr);
                            newSprites.push(sprites.add(sprCopy = spr.copy(copyAnim, copyTree, clone)))
                        }
                    } else {
                        sprCopy = spr;
                    }
					for(const imgToCopy of uniqueImages.values()) {
						media.create({ type: "copy", of: imgToCopy.img, copySizeOnly}, canvas => imgToCopy.copy = canvas);
					}
					for(const k of sprCopy.animation.tracks.image.keys) {
						k.value = uniqueImages.get(k.value.guid).copy;
					}
                } else if(addAnimImage) {
                    if (addAnimImageOp === "append keys") {
                        let ii = count;
                        if (!spr.type.animated || (spr.type.animated && !spr.animation.tracks.image)) {
                            spr.addAnimKey({name: "image", time: animation.time, value: spr.image, isNew: true});
                            spr.cleanAndUpdateTrackLookups();
                        }
                        const firstImageTime = spr.animation.tracks.image.keys[spr.animation.tracks.image.keys.length - 1].time + 1

                        while (ii-- > 0) {
                            media.create({ type: "copy", of: spr.image, copySizeOnly}, (canvas) => {
                                const newImageTime = spr.animation.tracks.image.keys[spr.animation.tracks.image.keys.length - 1].time + 1;
                                spr.addAnimKey({name: "image",  time: newImageTime, value: canvas, isNew: true});
                                spr.cleanAndUpdateTrackLookups();
                                ii === 0 && setTimeout(()=> {animation.time = firstImageTime}, 100);

                            });
                        }

                    } else {
                        media.create({ type: "copy", of: spr.image, copySizeOnly}, (canvas) => {
                            if (!spr.type.animated || (spr.type.animated && !spr.animation.tracks.image)) {
                                spr.addAnimKey({name: "image", time: animation.time, value: spr.image, isNew: true});
                                spr.cleanAndUpdateTrackLookups();
                            }
                            if (addAnimImageOp === "add key") {
                                let cTime = animation.time;
                                const key = spr.animation.tracks.image.keyAtTime(cTime);
                                if (key) {
                                    key.value = canvas;
                                } else {
                                    spr.addAnimKey({name: "image", time: cTime, value: canvas, isNew: true});
                                }
                            } else if (addAnimImageOp === "insert key") {
                                let cTime = animation.time;
                                const key = spr.animation.tracks.image.keyAtTime(cTime);
                                if (key) {
                                    cTime = key.time;
                                    spr.animation.tracks.image.eachKey(k => { if (k.time >= cTime) { k.time += 1; } });
                                    spr.cleanAndUpdateTrackLookups();
                                }
                                spr.addAnimKey({name: "image", time: cTime, value: canvas, isNew: true});

                            } else {
                                const newImageTime = spr.animation.tracks.image.keys[spr.animation.tracks.image.keys.length - 1].time + 1;
                                spr.addAnimKey({name: "image",  time: newImageTime, value: canvas, isNew: true});
                                setTimeout(()=> {animation.time = newImageTime}, 100);
                            }
                            spr.cleanAndUpdateTrackLookups();

                        });
                    }

				} else {
                    const isSub = spr.type.subSprite;
					media.create({ type: "copy", of: spr.image, subSprite: (isSub ? spr.subSprite : undefined)},
						(canvas)=>{
                            spr.type.subSprite = false
							var sprite = spr.copy(copyAnim, copyTree, clone);
                            spr.type.subSprite = isSub
							sprite.changeImage(canvas);
							if(spr.shadow && !noShadow) {
								newGSprites.push(spr.cast.group.add(sprite));
							} else {
								oldSprites.push(spr);
								newSprites.push(sprites.add(sprite));
							}
						}
					);
				}
            } else {
                if(spr.shadow && !noShadow) {
                    newGSprites.push(spr.cast.group.add(spr.copy(copyAnim, copyTree, clone)));

                } else {
                    oldSprites.push(spr);
                    newSprites.push(sprites.add(spr.copy(copyAnim, copyTree, clone)))
                }
            }
        });
        if (addAnimImage) {
            animation.forceUpdate();
            spriteList.holdUpdates = false;
            spriteList.rebuildLists();
            return;
        }

        const cols = new Set();
        oldSprites.forEach(spr => collections.getCollectionsContaining(spr).forEach(c => cols.add(c)))
        for (const oldCol of cols.values()) {
            const newCol = collections.create([], undefined, oldCol.name, false);
            const adding = [];
            oldSprites.forEach((oldSpr, i) => { oldCol.hasId(oldSpr.guid) && adding.push(newSprites[i]) });
            if (adding.length > 1) { adding.forEach(nSpr => newCol.add(nSpr)) }
        }


        if(copyTree) {
			const models = new Map();
            oldSprites.forEach((oldSpr,i) => {
				const mods = kinematics.modelsForSprite(oldSpr);
				mods.forEach(mod => { models.set(mod.id, mod) } )
			});
			const serialModels = [];
			for(const mod of models.values()) {
				if(mod.sprItems.every(spr => oldSprites.includes(spr))) {
					serialModels.push(mod.serialize());
				}
			}
            const computedAttachents = [];
            oldSprites.forEach((oldSpr,i) => {
                const newSpr = newSprites[i];

                if (oldSpr.type.shape && oldSpr.shape.isCompound && (clone || (!clone && oldSpr.shape.name !== "compoundShape"))) {
                    if (oldSpr.shape.joined && oldSpr.shape.joined.size) {
                        for (const j of oldSpr.shape.joined.values()) {
                            const s = sprites.getByGUID_I(j.guid);
                            if (s) {
                                newSpr.shape.compoundJoin(s);
                            } else {
                                newSpr.shape.compoundJoin(j);
                            }
                        }
                    }
                }
                if(oldSpr.type.attached) {
                    var a = sprites.getByGUID_I(oldSpr.attachedTo.guid);
                    if(a === undefined) { a = oldSpr.attachedTo }



                    newSpr.attachSprite(a, oldSpr.attachment, true);
                    newSpr.attachment.copyOf(oldSpr.attachment);
                    if (newSpr.attachment.computed === false) {
                        newSpr.attachment.computed = true;
                        computedAttachents.push(newSpr);
                    }

                }
                if (oldSpr.type.lookat) {
                    var l = sprites.getByGUID_I(oldSpr.lookat.spr.guid);
                    if(l === undefined) { l = oldSpr.lookat.spr }
                    newSpr.setLookatSprite(l, oldSpr.lookat.offsetX);
                }
                if (oldSpr.type.linked) {
                    var l = sprites.getByGUID_I(oldSpr.linked.guid);
                    if(l === undefined) { l = oldSpr.linked }
                    newSpr.setLinkedSprite(l);
                }
				
                if (oldSpr.type.hasLocators) {
                    for (const loc of oldSpr.locators) {
                        var l = sprites.getByGUID_I(loc.spr.guid);
                        if (l === undefined) { l = loc.spr }
                        newSpr.attachLocator(l);
                    }
                }
                if (oldSpr.type.functionLink) {
                    if(oldSpr.fLink.type === "Compiled") {
                        const bindings = newSpr.fLink.linked.map(id => {
                            const s = sprites.getByGUID_I(id);
                            if(s) { return [id, s.guid] }
                            return [id,id];
                        });
                        delete newSpr.fLink.linked;
                        const inputs = newSpr.fLink.inputs;
                        const outputs = newSpr.fLink.outputs;
                        newSpr.fLink.inputs = [];
                        newSpr.fLink.outputs = [];
                        if(!functionLinkCompiler.linkCompiledAndApply(newSpr, newSpr.fLink.source, bindings, inputs, outputs)) {
                            log.warn("Failed to compile and bind compiled function link.");

                        }


                    } else {
                        let idx = 0;
                        for(const input of oldSpr.fLink.inputs) {
                            let inp = sprites.getByGUID_I(input.guid);
                            if (inp) { newSpr.fLink.inputs[idx] = inp }
                            idx ++;
                        }
                        idx = 0;
                        for(const output of oldSpr.fLink.outputs) {
                            let outp = sprites.getByGUID_I(output.guid);
                            if (outp) { newSpr.fLink.outputs[idx] = outp }
                            idx ++;
                        }
                    }

                }
            });

            computedAttachents.forEach(spr => spr.attachment.computed = false );
			kinematics.deserialize(serialModels);
            sprites.removeImportGUID();
        }


        selection.clear().add(newSprites);

		if(copyAnim) { animation.forceUpdate() }
        spriteList.holdUpdates = false;
        spriteList.rebuildLists();
    }
    function fitTooCallback(fittingSprites){
        var extent;
        if(selection.length > 0){
            timeline.canUpdate = true;
            selection.markAnimatedForChange(fittingSprites);

            const scaleFit = (((mouse.oldButton & 4) !== 4) && ((mouse.button & 4) !== 4))

            if(selection.length === 1 && !mouse.shift){
                if(scaleFit) {log("Scale and move to sprite")}
                if(!scaleFit) {log("Move dont scale to sprite")}
                fittingSprites.forEach(spr => {
                    spr.fitTo(selection[0],scaleFit,!mouse.ctrl);
                    //if (spr.type.shape) { spr.shapeState.force = true }
                });
            }else{
                if (scaleFit) {log("Scale and move to selection")}
                if (!scaleFit) {log("Move dont scale to selection")}
                const inner = mouse.ctrl;
                if (mouse.shift) {
                    extent = selection.getExtent(undefined, true, inner);
                } else {
                    extent = selection.getExtent(undefined, undefined, inner);
                }
                fittingSprites.forEach(spr => {
                    spr.fitToExtent(extent, scaleFit);
                    //if (spr.type.shape) { spr.shapeState.force = true }
                });
            }
           // selection.callIf(spr => spr.type.normalisable, "normalize");
            selection.checkForAnimatedChanges();

        }
       // sprites.mustUpdate = true;
        selectionCallbackClean(fittingSprites,"selectToFit");
        spriteList.selectionCallback(undefined);
        return true;
    }
    function alignmentCallback(aligningSprites, axisId, edges){
        if(selection.length > 0){

            const extent = selection.getExtent();
            extent.irate();
            const spr = selection[0];
            const key = spr.key;
            const e = key.edge;
            var where = 0;
            const edge = ((edges & 1) === 1 ? 0 : 0) + ((edges & 2) === 2 ? 1 : 0) + ((edges & 4) === 4 ? 2 : 0);
            const names = [[
                    "left", "center", "right"
                ],[
                    "bottom", "middle", "top"
                ]
            ];
            if ((e & 1) === 1) {
                key.toWorld(-spr.cx * spr.sx, 0);
                extent.point(key.wx, key.wy);
                where = 0;
            } else if ((e & 2) === 2) {
                key.toWorld(0,0);
                extent.point(key.wx, key.wy);
                where = 0;
            } else if ((e & 4) === 4) {
                key.toWorld(spr.cx  * spr.sx, 0);
                extent.point(key.wx, key.wy);
                where = 0;
            } else if ((e & 8) === 8) {
                key.toWorld(0,-spr.cy * spr.sx);
                extent.point(key.wx, key.wy);
                where = 1;
            } else if ((e & 16) === 16) {
                key.toWorld(0,0);
                extent.point(key.wx, key.wy);
                where = 1;
            } else if ((e & 32) === 32) {
                key.toWorld(0, spr.cy * spr.sy);
                extent.point(key.wx, key.wy);
                where = 1;
            }
            extent.complete();
            selection.clear();
            selection.add(aligningSprites);
            aligningSprites.forEach(spr => spr.key.calcExtent());

            timeline.canUpdate = true;
            selection.markAnimatedForChange(aligningSprites);
            log("Aligning to " + names[where][edge]);
            log("" + extent);
            selection.align(names[where][edge], false, false, extent);
            selection.checkForAnimatedChanges();
        }
        selectionCallbackClean(aligningSprites,"alignments");
        return true;
    }
    function alignRotateCallback(aligningSprites,axisId){
        if(selection.length > 0){
            timeline.canUpdate = true;
            selection.markAnimatedForChange(aligningSprites);

            const s = selection[0];
            var rx = s.rx;
            var ry = s.ry;

            const xDist = s.cx - Math.abs(s.key.lx - s.cx);
            const yDist = s.cy - Math.abs(s.key.ly - s.cy);
            const axis = xDist > yDist ? rx : ry;
            if(axisId === 1) {
                aligningSprites.forEach(spr => { spr.setRotate(axis, spr.ry) });
            }else if(axisId === 2){
                aligningSprites.forEach(spr => { spr.setRotate(spr.rx, axis) });
            }else{
                aligningSprites.forEach(spr => {
                    if (spr.type.lookat) {
                        spr.lookat.offsetX = rx - (spr.rx - spr.lookat.offsetX);
                        spr.key.update();
                    } else if (spr.type.attached && spr.attachment.inheritRotate) {
                        spr.attachment.rx = rx - spr.attachedTo.rx;
                        spr.attachment.ry = ry - spr.attachedTo.rx;
                        spr.attachedTo.key.update();


                    } else {
                        spr.setRotate(rx, ry);
                    }
                });
            }
            selection.checkForAnimatedChanges();
        }
        selectionCallbackClean(aligningSprites,"alignRotate");
        return true;
    }
    function zorderCallback(spritesToMove){
        if (selection.length > 0) {
            if (zorderCallback.attachedOrder) {
                if (selection.length === 1) {
                    const refSpr = selection[0];
                    selection.clear(true);
                    selection.add(spritesToMove);
                    const dir = keepEnabled[0] === commands.edSprDown ? "down" : "up";
                    selection.moveAttachOrder(dir, refSpr)
                } else {
                    log.warn("Can only move selected attached order relative to one sprite at a time");
                }
            } else {
                    

                var minZ = Infinity, maxZ = -Infinity, spacing = [];
                if (keepEnabled[0] === commands.edSprDown) {
                    
                    selection.each(spr => minZ = Math.min(spr.index, minZ));
                    spritesToMove.sort((a,b) => a.index - b.index);
                    spritesToMove.forEach(spr => spacing.push(spr.index - spritesToMove[0].index));
                    selection.clear(true);
                    selection.add(spritesToMove);
                    sprites.moveSelectedZDist(minZ - spritesToMove[spritesToMove.length - 1].index, spacing);
                } else {
                    
                    selection.each(spr => maxZ = Math.max(spr.index, maxZ));
                    spritesToMove.sort((a,b) => a.index - b.index);
                    spritesToMove.forEach(spr => spacing.push(spr.index - spritesToMove[0].index));
                    selection.clear(true);
                    selection.add(spritesToMove);
                    sprites.moveSelectedZDist(maxZ - spritesToMove[0].index, spacing);
                }
            }

        }
        zorderCallback.attachedOrder = false;
        selectionCallbackClean(spritesToMove, "zorder");
        return true;
    }
    function alignLookatCallback(aligningSprites,axisId){
        if(selection.length > 0){
            const s = selection[0];
            aligningSprites.forEach(spr => { spr.setLookatSprite(s) });
        } else if(!cancelSelecting) {

            aligningSprites.forEach(spr => { spr.clearLookat() });
        }
        selectionCallbackClean(aligningSprites,"lookatselect");
        return true;
    }
    function alignAttachCallback(attachSprites,axisId){
        if(selection.length > 0){
            const s = selection[0];
            attachSprites.forEach(spr => {
                spr.attachSprite(s);
                spr.attachment.rotateType = spr.type.lookat ? "fixed" : "inherit";
            });
        } else if(!cancelSelecting) {
            attachSprites.forEach(spr => { spr.clearAttached() });
        }
        selectionCallbackClean(attachSprites, "attachToSelect");
        sprites.cleanup();
        return true;
    }
    function alignLinkedCallback(linkedSprites,axisId){
        if(selection.length > 0){
            const s = selection[0];
            if (mouse.ctrl) {
                linkedSprites.forEach(spr => { 
                    spr.setLinkedSprite(s); 
                    if (s.type.image && s.image.isDrawable && spr.type.cutter) {
                        
                        localProcessImage.fitToSubSprite(spr, s);
                    }
                });
            } else {
                linkedSprites.forEach(spr => { spr.setLinkedSprite(s) });
            }
        } else if(!cancelSelecting) {

            linkedSprites.forEach(spr => { spr.clearLinked() });
        }
        selectionCallbackClean(linkedSprites, "attachToSelect");
        sprites.cleanup();
        return true;
    }	
    function joinCompoundShapeCallback(joinSprites){
        if(selection.length > 0){
            const s = selection[0];
            joinSprites.forEach(jSpr => {
                if (jSpr.type.shape && jSpr.shape.isCompound) {
                    if (jSpr.type.group) {
                        selection.forEach(spr => {
                            if(jSpr.shape.joined.has(spr)) {
                            } else {
                                sprites.remove(spr);
                                jSpr.group.add(spr);
                            }
                        });
                        selection.clear();
                        selection.add(jSpr);

                    } else {
                        selection.forEach(spr => {
                            if(jSpr.shape.joined.has(spr)) {
                                jSpr.shape.compoundUnjoin(spr);
                            } else {
                                jSpr.shape.compoundJoin(spr);
                            }
                        });
                    }
                }
            })
        } else if(!cancelSelecting) {
        }
        selectionCallbackClean(joinSprites);
        sprites.cleanup();
        return true;
    }
    function patternAttachCallback(shapeSprites,axisId){
        if(selection.length > 0){
            const pat = selection[0];
            if(pat.type.pattern || pat.type.gradient) {
                shapeSprites.forEach(spr => {
                    if(spr.type.shape  || spr.type.text) { spr.usePattern(pat) }

                });
            } else {
                shapeSprites.forEach(spr => {
                    if(spr.type.shape || spr.type.text) { spr.usePattern() }
                });

            }
        } else if (!cancelSelecting) {
            shapeSprites.forEach(spr => {
                if(spr.type.shape) { spr.usePattern() }
            });
        }
        selectionCallbackClean(shapeSprites,"attachPattern");
        sprites.cleanup();
        return true;
    }
    function bindLocatorCallback(attachSprites,axisId){
        if(selection.length > 0){
            if(attachSprites.length > 1){
                selection.each(s => {
                    attachSprites.forEach(spr => s.attachLocator(spr))
                });
            }else{
                const s = selection[0];
                attachSprites.forEach(spr => spr.attachLocator(s));
            }
        } else if(!cancelSelecting) {

            attachSprites.forEach(spr => { spr.clearLocators() });
        }
        selectionCallbackClean(attachSprites,"attachToLocator");
        sprites.cleanup();
        return true;
    }
    function bindFuncInput(attach,axisId){
        if(selection.length > 0){
            selection.each(s => {
                attach.forEach(spr => spr.attachFunc(s, "input"))
            });
        }
        selectionCallbackClean(attach);
        sprites.cleanup();
        return true;
    }
    function bindFuncOutput(attach,axisId){
        if(selection.length > 0){
            selection.each(s => {
                attach.forEach(spr => spr.attachFunc(s, "output"))
            });
        }
        selectionCallbackClean(attach);
        sprites.cleanup();
        return true;
    }
    function removeFromCaptureList(spr) {
        sprites.each(s => {
            if (s.captureList && s.captureList.includes(spr)) {
                const idx = s.captureList.indexOf(spr);
                s.captureList.splice(idx,1);
                if (s.captureList.length === 0) {
                    s.captureList = undefined;
                }
            }
        });
    }
    function captureSourceSpritesCallback(renderable) {
        if(selection.length > 0){
            selection.eachOfType(spr => {
                if (spr.captureList === undefined) {
                    spr.captureList = [];
                }
                for (const r of renderable) {
                    if (!spr.captureList.includes(r)) {
                        spr.captureList.push(r);
                        r.addEvent("onpredelete", removeFromCaptureList);
                    }
                }
                spr.captureList.sort((a,b) => a.index - b.index);
            }, "liveCapture");
        } else if(!cancelSelecting) {
            for (const r of renderable) {
                removeFromCaptureList(r);
                r.removeEvent("onpredelete", removeFromCaptureList);
            }
        }
        selectionCallbackClean(renderable,"liveCapture");
        sprites.cleanup();
        return true;

    }
    function selectSubSpriteCallback(sel){
        if(selection.length > 0){
			if (selection.length > 1) {
				log.warn("Using first selected sub sprite");
			}
			let found = false;
            selection.each(s => {
				if (s.type.subSprite) {
					sel.forEach(spr => spr.changeToSubSprite(s.subSpriteIdx))
					found = true;
					return true;
				}
            });
			if (!found) {
				log.warn("Selection did not contain subSprites");
			}
        }
        selectionCallbackClean(sel);
        sprites.cleanup();
        return true;
    }
    var noUpdate = false;
    const API = {
        drawingModeOn : false,
        snapMode : 0,
        showGrid : false,
        getButton(commandId) { return buttonMap.get(commandId) },
        copySelectedSprites: copySelected,
        ready(){
            createLists();
            API.setButtonStatus(null,noSelectList);
            lastSel = false;
            if(displaySizer(displaySizerQuery)){
               buttonMap.get(commands.edSpriteToggleTimeline).setSprite(3);
            }else {
               buttonMap.get(commands.edSpriteToggleTimeline).setSprite(timeline.editMode-1);
            }
            lastFillColUsed.r = colours.mainColor.r;
            lastFillColUsed.g = colours.mainColor.g;
            lastFillColUsed.b = colours.mainColor.b;
            lastFillColUsed.css = colours.mainColor.css;
             if (grid.hasError) {
                buttonMap.get(commands.edSprShowGrid).disable();
            }           
        },
        setView(v){ view = v },
        updateSpriteText(text){
            var newText = commandLine()
            selection.eachOfType(spr => {
                spr.textInfo.textData = newText;
                spr.textInfo.update(view.context);
            },"text");
            widget.update();
        },
        selectingUtilName: "",
        spriteSelectUtilDone(prevSelection, name) {
            if(name === API.selectingUtilName){
                API.selectingUtilName = "";
                selection.clear(true);
                selection.add(prevSelection);
                keepEnabled.length = 0;
                log.info("Completed select sprite for '"+name+"'");
            }
        },
        spriteSelectUtil(selectedCallback, name, color = "#F88") {
            if(sprites.selectingSprite){
                return false;
            }
            keepEnabled.length = 0;
            API.selectingUtilName = name;
            widget.selectionCallback(selectedCallback, true);
            spriteRender.highlightColor = color;
            log.info("Select sprite for '"+name+"'");
            return true;
        },
        serializeWorkspace() {
            var workspace = {};
            workspace.showGrid = API.showGrid;
            workspace.snapMode = API.snapMode;
            workspace.pixelSnap = settings.pixelSnap;
            workspace.backgroundColor = document.body.style.backgroundColor;
            return workspace;
        },
        deserialWorkspace(workspace) {
            if (workspace) {
                API.showGrid = workspace.showGrid ?? API.showGrid;
                API.snapMode = workspace.snapMode ?? API.snapMode;
                settings.pixelSnap = workspace.pixelSnap ?? settings.pixelSnap;
                workspace.backgroundColor && (document.body.style.backgroundColor = workspace.backgroundColor);
                const cmdId = commands.edSprGridSnap1 + pixelSnapValues.indexOf(Number(settings.pixelSnap));
                if (cmdId >= commands.edSprGridSnap1) {  buttons.groups.setRadio("pixelSnap", cmdId) }
                buttonMap.get(commands.edSprSnapToggle).setSprite(API.snapMode);
                buttonMap.get(commands.edSprShowGrid).setSprite(API.showGrid ? 1 : 0);
            }
        },
        renamingNewSprite: true,
        newSpriteHoldUpdate: false,
        addCreatedSpritesNamed(...sprs) {
            const rename = API.renamingNewSprite;
            API.renamingNewSprite = false;
            API.addCreatedSprites(...sprs);
            API.renamingNewSprite = rename;
        },
        addSprites(sprs, selectAdded = false, focusOn = false, update = false) {
            
            for(const spr of sprs) {
                if (!spr.locks.rotate) { spr.locks.rotate = settings.newSpriteLockRotate }
                if (!spr.locks.scale) { spr.locks.scale = settings.newSpriteLockScale }
                spr.rgb.fromColor(lastFillColUsed);
                sprites.add(spr);
                selectAdded && selection.add(spr);
            }
            focusOn && selectAdded && selection.setView(view);
            if (update) { API.command(commands.edSprUpdateUI); }
        },
        addCreatedSprites(...sprs){
            selection.clear(true)
            for(const spr of sprs) {
                if (!spr.locks.rotate) { spr.locks.rotate = settings.newSpriteLockRotate }
                if (!spr.locks.scale) { spr.locks.scale = settings.newSpriteLockScale }
                spr.rgb.fromColor(lastFillColUsed);
                sprites.add(spr);
                selection.add(spr);
            }
            if (settings.focusOnNew) { selection.setView(view) }
            if(API.renamingNewSprite && !commandLine.isInBatch() && settings.nameOnCreate && sprs.length === 1) {
                const renameList = sprs;
                const renameFunc = (sl,type,item) => {
                    if(sprs.length) { spriteList.renameItem(sprs.shift()); }
                    else { spriteList.removeEvent("itemrenamed", renameFunc); }
                };
                spriteList.addEvent("itemrenamed", renameFunc);
                setTimeout(()=> { spriteList.renameItem(sprs.shift()) }, 100);
                API.renamingNewSprite = true;
            }
            if (!API.newSpriteHoldUpdate) { API.command(commands.edSprUpdateUI); }
            else { API.newSpriteHoldUpdate = false; }
        },
        commands: {
            updateWidget: true,
            updateLists: false,
            updateListsLazy: false,
            scrollSpriteToView: false,
            fireUpdate: false,
            [commands.edSprPrevSubSprite](left, right){
                if(right) {
                    if (commandLine.quickMenuOpen()) { log.warn("Active dialog must be closed befor opening subsprite dialog"); return false  }
                    let subSprIdx;
                    const getSelectedSubSpriteStatus = () => {
                        var subIdx;
                        var count = 0, iCount = 0;
                        const imgs = new WeakSet();
                        selection.eachOfType(spr => {
                            if(spr.image.desc.sprites) {
                                if (!imgs.has(spr.image)) {
                                    count += spr.image.desc.subSprCount;
                                    iCount ++;
                                    imgs.add(spr.image)
                                }
                                if(spr.type.subSprite) {
                                    if (subIdx === undefined) {  subIdx = spr.subSpriteIdx }
                                }
                            }
                        },"image");
                        if (text) {
                            if (iCount === 0) {
                                text.element.textContent = "No sheets selected";

                            } else if (iCount > 1) {

                                text.element.textContent = iCount + " sheets with " + count +" sprites";
                            } else {
                                text.element.textContent = "Sheets has " + count +" sprites";
                            }


                        }
                        return subIdx
                    }
                    subSprIdx = getSelectedSubSpriteStatus() ?? 0;

                    const subSpriteMenu = buttons.quickMenu(
                        "16 Sub Sprites?|Done|" +
                        "textCenter Use slider to set sub sprite idx," +
                        "$subSprIdx,slider 0 1024 1 " + subSprIdx + " #000 0," +
                        "{,$relative,Relative,$absolute,Absolute,},",
                        true

                    );
                    const slider = subSpriteMenu.getButton("subSprIdx");
                    const relative = subSpriteMenu.getButton("relative");
                    const absolute = subSpriteMenu.getButton("absolute");
                    var text = subSpriteMenu.getButton("TextLine_1");

                    /*window.tempData = {
                        slider,
                        relative,
                        absolute
                    }*/
                    subSpriteMenu.dataset.Relative = API.commands[commands.edSprPrevSubSprite].relative ?? false;
                    buttons.groups.setButtonRadio((subSpriteMenu.dataset.Relative? relative : absolute), relative, absolute);
                    const selChange = () => {
                        const subIdx = getSelectedSubSpriteStatus();
                        if (subIdx === undefined) {
                            slider.disable();
                            relative.disable();
                            absolute.disable();
                            return;
                        } else {
                            slider.enable();
                            relative.enable();
                            absolute.enable();
                            buttons.groups.setButtonRadio((subSpriteMenu.dataset.Relative? relative : absolute), relative, absolute);
                        }
                        if (subSpriteMenu.dataset.Relative) {
                            subSpriteMenu.dataset.lastVal = 0;
                            slider.slider.value = 0;
                            slider.slider.updateValue(true);
                        } else {
                            slider.slider.value = subSpriteMenu.dataset.prevVal = subIdx;
                            slider.slider.updateValue(true);
                        }
                    }
                    selection.addEvent("change", selChange);
                    API.addEvent("update", selChange);
                    subSpriteMenu.onclosed = () => {
                        selection.removeEvent("change", selChange);
                        API.removeEvent("update", selChange);

                    };
                    subSpriteMenu.oncommand = (cmd) => {
                        if (cmd === "done") {
                            subSpriteMenu.close(undefined, "Done");
                            return;
                        }
                        if (cmd === "Relative") {
                            API.commands[commands.edSprPrevSubSprite].relative = subSpriteMenu.dataset.Relative = true;
                            subSpriteMenu.dataset.prevVal = slider.value;
                            slider.slider.value = 0;
                            slider.slider.setRange(-255,255);
                            slider.slider.updateValue(true);
                            subSpriteMenu.dataset.lastVal = 0;
                            buttons.groups.setButtonRadio(relative, relative, absolute);
                        } else  if (cmd === "Absolute") {
                            API.commands[commands.edSprPrevSubSprite].relative = subSpriteMenu.dataset.Relative = false;
                            slider.slider.value = subSpriteMenu.dataset.prevVal;
                            slider.slider.setRange(0,255);
                            slider.slider.updateValue(true);
                            buttons.groups.setButtonRadio(absolute, relative, absolute);
                        } else if (!isNaN(cmd)) {
                            const offset = cmd - subSpriteMenu.dataset.lastVal
                             subSpriteMenu.dataset.lastVal = cmd
                            timeline.canUpdate = true;
                            selection.markAnimatedForChange();
                            selection.eachOfType(spr => {
                                if(spr.image.desc.sprites) {
                                    if(spr.type.subSprite) {
                                        if (subSpriteMenu.dataset.Relative) {
                                            spr.changeToSubSprite(spr.subSpriteIdx + offset);
                                        } else {
                                            spr.changeToSubSprite(cmd);
                                        }

                                    }
                                }

                            },"image");

                            selection.checkForAnimatedChanges();
                            API.fireUpdate();

                            sprites.cleanup();
                            spriteList.update();
                            guides.update();
                            widget.update();
                        }

                    };
                    return false;
                } else {
                    timeline.canUpdate = true;
                    selection.markAnimatedForChange();
                    selection.eachOfType(spr => {
                        if(spr.image.desc.sprites) {
                            if(spr.type.subSprite) {
                                const l = spr.image.desc.subSprCount;
                                spr.changeToSubSprite(spr.subSpriteIdx - 1);
                            } else {
                                spr.changeToSubSprite(0);
                            }
                            spr.updateSubGSpr();
                        }
                    }, "image");
                    selection.checkForAnimatedChanges();
                    API.commands.updateWidget = true;
                    API.commands.updateLists = true;
                    API.commands.fireUpdate = true;
                }
            },
            [commands.edSprNextSubSprite](left, right) {
				if (right || sprites.selectingSprite) {
                    if(sprites.selectingSprite){
                        widget.specialSelectionSelect(true);
                        buttons.groups.setRadio("subSpriteSelections",-1);
                        keepEnabled.length = 0;
                    }else{
                        keepEnabled[0] = commands.edSprNextSubSprite;
                        
                        widget.selectionCallback(selectSubSpriteCallback);
                        API.commands.updateWidget = false;
                        spriteRender.highlightColor = settings.highlightSelSubSprite;
                        buttons.groups.setRadio("subSpriteSelections",commands.edSprNextSubSprite);
                    }

                } else {
					timeline.canUpdate = true;
					selection.markAnimatedForChange();
					selection.eachOfType(spr => {
						if(spr.image.desc.sprites) {
							if(spr.type.subSprite) {
								const l = spr.image.desc.subSprCount;
								spr.changeToSubSprite(spr.subSpriteIdx + 1);
							} else {
								spr.changeToSubSprite(0);
							}
                            spr.updateSubGSpr();
						}
					},"image");
					selection.checkForAnimatedChanges();
					API.commands.updateWidget = true;
					API.commands.updateLists = true;
					API.commands.fireUpdate = true;
				}
			},            
            [commands.edSprCreateDraw](left, right){
                if(selection.length > 0){
                    const convert = selection.filter(spr=> !spr.type.inGroup && (spr.type.cutter || spr.type.image || spr.type.text || spr.type.shape  || spr.type.group));
                    if (!convert.length){
                        log.warn("Nothing selected can be converted to bitmap");
                    } else {
                        const added = [];
                        const addedSel = [];
                        selection.clear(true);
                        for (const spr of convert) {
                            if (spr.type.cutter) {
                                spr.positiveSize();
                                media.create({width: spr.w, height: spr.h, type : "canvas" },
                                    (canvas)=>{
                                        spriteRender.capture(spr, canvas);
                                        canvas.update();
                                        spr.changeImage(canvas);
                                        addedSel.push(spr);
                                    }
                                );

                            } else if (spr.type.image) {
                                const sprite = new Sprite(spr.x, spr.y, spr.w, spr.h, spr.name);
                                media.create({width: spr.image.w, height: spr.image.h, type: "canvas" }, canvas => {
                                    sprite.changeImage(canvas);
                                    sprite.fitTo(spr);
                                    added.push(sprite);
                                    addedSel.push(sprite);
                                    if (editSprites.drawingModeOn) {
                                        if (spr.drawOn) { spr.setDrawOn(false) }
                                        sprite.setDrawOn(true);
                                    }
                                });
                            } else {
                                if (spr.type.group && spr.group.open && !right) {
                                    log.warn("A selected group is open and can not be replaced with bitmap");
                                } else {
                                    const sprite = new Sprite(spr.x, spr.y, spr.w, spr.h, spr.name);
                                    sprite.fitTo(spr)
                                    media.create({width : sprite.w, height: sprite.h, type: "canvas"}, (canvas) => {
                                            sprite.changeImage(canvas);
                                            sprite.captureList = [spr];
                                            spriteRender.capture(sprite, canvas);
                                            sprite.captureList = undefined;
                                            canvas.update();
                                            right && added.push(sprite);
                                            addedSel.push(sprite);
                                        }
                                    );
                                    !right && sprites.replace(spr, sprite);
                                }
                            }
                        }
                        API.addCreatedSprites(...added)
                        selection.clear(true);
                        selection.add(addedSel);
                        if (settings.focusOnNew) { selection.setView(view) }

                    }
                }else{
                    var w = mainCanvas.width;
                    var h = mainCanvas.height;
                    media.create({width: w, height: h, type: "canvas"},
                        (canvas)=>{
                            var {x,y} = view.toWorld(w,h);
                            var xx = x, yy = y;
                            var {x,y} = view.toWorld(0,0);
                            var sprite = new Sprite((x+xx)/2, (y+yy)/2, w,h,"Canvas");
                            sprite.changeImage(canvas);
                            sprite.scaleTo(x,y,xx,yy);
                            API.addCreatedSprites(sprite);
                        }
                    );
                }
                //API.commands.updateWidget = false;
            },
            [commands.edSprCloneAnim](left, right){
                copySelected(true, true, true);
                API.commands.updateWidget = true;
                API.commands.updateLists = true;
                API.commands.updateListsLazy = true;
            },
            [commands.edSprClone](left, right) {
                if (right) {
                    return API.commands[commands.edSprCloneAnim](left, right);
                }
                copySelected(true, false, true);
                API.commands.updateWidget = true;
                API.commands.updateLists = true;
                API.commands.updateListsLazy = true;
            },
            [commands.edSprGroupClose](left, right) {
                selection.eachOfTypes(spr => {
                        if (spr.type.group && spr.group.open) {
                            spr.closeGroup();
                            selection.remove(spr, true);
                            API.commands.updateLists = API.commands.updateWidget = true;
                        } else if(spr.type.shadow) {
                            var cast = spr.cast;
                            while (cast) {
                                cast.closeGroup();
                                selection.remove(spr, true);
                                selection.add(cast);
                                if(cast.type.shadow) {
                                    spr = cast;
                                    cast = spr.cast;
                                } else { cast = undefined }
                            }
                            API.commands.updateLists = API.commands.updateWidget = true;
                        }
                    }, "group", "shadow"
                );
            },
            [commands.edSprOpenSelectedGroup](left, right) {
                if (right) { API.commands[commands.edSprOpenCopyGroup](left, right) }
                else {
                    selection.eachOfType(spr => {
                            if (!spr.group.open) { spr.openGroup() }
                        }, "group"
                    );
                    API.commands.updateWidget = true;
                }
            },
            [commands.edSprOpenCopyGroup](left, right) {
                const copySprs = [];
                selection.eachOfType(spr => {
                        if (!spr.group.open) { copySprs.push(...spr.openCopyGroup()) }
                    }, "group"
                );
                API.addCreatedSprites(...copySprs);
                API.commands.updateLists = API.commands.updateWidget = true;
            },
            [commands.edSprUngroupSelected](left, right) {
                const sel = [...selection];
                selection.clear();
                sel.forEach((spr, i) => {
                    if (spr.type.group) {
                        sel[i] = groups.ungroup(spr)
                        sel[i].unshift(spr);
                    }
                });
                sel.forEach(s => {
                    if (Array.isArray(s)) {
                        sprites.remove(s.shift());
                        s.forEach(spr => sprites.add(spr));
                        selection.add(s);
                    } else { selection.add(s) }
                });
                API.commands.updateWidget = true;
            },
            [commands.edSprGroupSelected](left, right) {
                API.commands.updateWidget = false;
                let groupSpr;
                if (selection.length > 1) {
                    if (!selection.some(spr => !spr.canGroup())) {
                        selection.unShadow();
                        const common = selection.getCommonGroup();
                        const extent = selection.getExtent();
                        const sel = selection.asArray(); // asArray to order selection by z index
                        groupSpr = new Sprite(extent.x + extent.w / 2, extent.y + extent.h / 2, extent.w, extent.h, "Group");
                        if (common.length === 1) {
                            sel.forEach(spr => common[0].owner.removeFromGroup(spr));
                            groupSpr.changeToGroup(sel, true);
                            common[0].add(groupSpr);
                            selection.clear();
                        } else {
                            sprites.remove(sel);
                            groupSpr.changeToGroup(sel, true);
                            API.addCreatedSprites(groupSpr);
                        }
                        API.commands.updateLists = API.commands.updateWidget = true;
                    } else if (selection.length > 1) { log.info("Selection contains 1 or more ungroupable sprites") }
                } else { log.info("Select 2 or more sprites to group") }
            },
            [commands.edSprAlpha](){
                if(!noUpdate){
                    timeline.canUpdate = true;
                    const alpha = buttonMap.get(commands.edSprAlpha).slider.value / 255;
                    selection.setValue("a",alpha);
                    selection.eachOfType(spr => spr.attachedTo.type.gradient && spr.attachedTo.updateGradient(), "attached");
                }
            },
            [commands.edSprCaptureSource](left, right) {
                if (mouse.shift) {
                    if(sprites.selectingSprite){
                        if(right) { cancelSelecting = true; }
                        widget.specialSelectionSelect(true);
                        buttons.groups.setRadio("liveCapture",-1);
                        keepEnabled.length = 0;
                    }else{
                        keepEnabled[0] = commands.edSprLiveCapture;
                        widget.selectionCallback(captureSourceSpritesCallback);
                        spriteList.selectionCallback(captureSourceSpritesCallback);
                        API.commands.updateWidget = false;
                        spriteRender.highlightColor = "#F00";
                        buttons.groups.setRadio("liveCapture",commands.edSprLiveCapture);
                    }

                }
            },
            [commands.edSprLiveCapture](left, right) {
                if (selection.length > 0) {
                    if (right){
						var flash = false;
						let warn;
						selection.each(spr => {
							if (spr.type.image && !spr.type.pattern && spr.image.isDrawable) {
                                spr.prepDrawOn();
                                spr.type.captureFeedback = !mouse.ctrl;
                                if (spr.captureList) { spr.captureList.sort((a,b) => a.index - b.index) }
                                const alpha = spr.a;
                                spr.a = 0;
                                spriteRender.capture(spr, spr.image);
                                spr.a = alpha;
                                if(spr.image.processed) { spr.image.update() }
                                flash = true;

							}
						});
						if(warn) { log.warn(warn) }
						if(flash){
							buttonMap.get(commands.edSprLiveCapture).element.classList.add("buttonOn");
							setTimeout(()=>buttonMap.get(commands.edSprLiveCapture).element.classList.remove("buttonOn"),settings.flashTime);
						}
                        selection.update();
                        API.commands.updateListsLazy = API.commands.updateLists = true;

					}else{
						var warn;
						var first = ! selection[0].type.liveCapture;
						selection.each(spr => {
							if (!spr.type.animated || (spr.type.animated && !spr.animation.tracks.image)){
								if (spr.type.image && !spr.type.pattern && spr.image.isDrawable) {
									if(spr.drawOn) {
										warn = "One or more images is being drawn on!";
									} else {
										spr.type.captureFeedback = !mouse.ctrl;
										if(first && spr.image.desc.capturing !== true){
											spr.image.desc.capturing = true;
											spr.image.desc.src = "capture" + getGUID();
										}else if(!first) {
											spr.image.desc.capturing = false;
											spr.image.desc.src = "captured";
											if(spr.image.processed) { spr.image.update() }
										}
										if(spr.type.liveCapture !== first) {
											spr.type.liveCapture = first;
											spr.fireEvent("onupdate");
											sprites.spriteTypeChange(spr);
										}
                                        if (spr.captureList && spr.type.liveCapture) { spr.captureList.sort((a,b) => a.index - b.index) }

									}
								}
							}else if(spr.type.animated && !spr.animation.tracks.image) { warn = "Live capture restricted. No animated image support"}
						});
						buttonMap.get(commands.edSprLiveCapture).setSprite(first ? 1 : 0);
						if(warn) { log.warn(warn) }
                        selection.update();
                        API.commands.updateListsLazy = API.commands.updateLists = true;
					}

                }
            },
            [commands.edSprFitToo](left, right) {
                if(sprites.selectingSprite){
                    if(right) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("selectToFit",-1);
                    keepEnabled.length = 0;
                }else{
                    keepEnabled[0] = commands.edSprFitToo;
                    widget.selectionCallback(fitTooCallback);
                    spriteList.selectionCallback(fitTooCallback);
                    API.commands.updateWidget = false;
                    spriteRender.highlightColor = settings.highlightSelFit;
                    buttons.groups.setRadio("selectToFit",commands.edSprFitToo);
                }
            },
            [commands.edSpriteToggleAttachPattern](left, right){
                 if (sprites.selectingSprite) {
                    if (right) { cancelSelecting = true }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("attachPattern",-1);
                    keepEnabled.length = 0;
                } else {
                    keepEnabled[0] = commands.edSprPattern;
                    widget.selectionCallback(patternAttachCallback);
                    API.commands.updateWidget = false;
                    spriteRender.highlightColor = "#F8A";
                    buttons.groups.setRadio("attachPattern",commands.edSprPattern);
                }
            },
            [commands.edSprPattern](left, right) {
                if (right) {
                    var rep, gradType;
                    selection.each(spr => {
                        if (spr.type.gradient) {
                            if (gradType === undefined) { gradType = (spr.gradient.type + 1) % 2 }
                            spr.gradient.type = gradType;
                            spr.gradient.update = true;

                        } else if (spr.type.pattern) {
                            if (rep === undefined) { rep = (patternReps.indexOf(spr.pattern.rep) + 1) % patternReps.length }
                            spr.setPatternRepeat(patternReps[rep]);
                        }
                    });
                    return;
                }
                if (selection.some(spr => spr.type.shape || spr.type.text)) {
                    API.commands[commands.edSpriteToggleAttachPattern](left, right);
                } else {
                    let  usePattern, useGradient;
                    selection.eachOfType(spr => {
                            if(usePattern === undefined) { usePattern = !spr.type.pattern }
                            spr.setPattern(usePattern);
                        },"image"
                    );
                    useGradient = usePattern;
                    selection.eachOfType(spr => {
                            if(useGradient === undefined) { useGradient = !spr.type.gradient }
                            spr.setGradient(useGradient);
                        },"cutter"
                    );
                    usePattern =  useGradient;
                    if(usePattern !== undefined) {
                        buttonMap.get(commands.edSprPattern).setSprite(usePattern ? 1 : 0);
                        API.commands.updateLists = true;
                    }
                }
            },
            [commands.edSpriteToggleShow](left, right, cmdId) {
                var hidden, duState;
                selection.each(spr => {
                    if (hidden === undefined) { hidden = spr.type.hidden }
                    else if (hidden !== spr.type.hidden) { return duState = true; }
                });
                if (duState) { hidden = false; }
                else { hidden = !hidden; }
                selection.each(spr => { spr.hide(hidden) });
                buttonMap.get(cmdId).setSprite(hidden ? 1 : 0);
                API.commands.updateLists = true;                
                
            },
            [commands.edSpriteHideFromRenderToggle](left, right, cmdId) {
                var renderable;
                selection.each(spr => {
                    if(renderable === undefined) { renderable = !spr.type.renderable }
                    spr.showToRender(renderable);
                });
                buttonMap.get(cmdId).setSprite(renderable ? 0 : 1);
                API.commands.updateLists = true;
            },
            [commands.edSprLockUI](left, right, cmdId) {
                var locked;
                selection.each(spr => {
                    if(locked === undefined) {  locked = !spr.locks.UI }
                    spr.locks.UI = locked;
                });
                buttonMap.get(cmdId).setSprite(locked ? 1 : 0);
                API.commands.updateLists = true;
            },
            [commands.edSprSnapToggle](left, right, cmdId) {
                if (right) {
                    cmdId = commands.edSprGridSnap1 + pixelSnapValues.indexOf(Number(settings.pixelSnap));
                    if (cmdId >= commands.edSprGridSnap1) {  buttons.groups.setRadio("pixelSnap", cmdId) }
                } else {
                    API.snapMode = (API.snapMode + 1) % 3;
                    buttonMap.get(cmdId).setSprite(API.snapMode);
                }
            },
            [commands.edSprShowGrid](left, right, cmdId) {
                if (!right) {
                    API.showGrid = !API.showGrid;
                    buttonMap.get(cmdId).setSprite(API.showGrid ? 1 : 0);
                }
            },
            [commands.edSprRotCW](left, right, cmdId) {API.commands[commands.edSprRotCCW](left, right, cmdId) },
            [commands.edSprRotCCW](left, right, cmdId) {
                if ((mouse.oldButton & 2) === 2) {
                    utils.processSelectedImages(localProcessImage.reorient, cmdId === commands.edSprRotCCW ? "rotateCCW" : "rotateCW");
                    API.commands.updateLists = true;
                } else {
                    var amount = Math.PI / 2;
                    if(mouse.alt) { // repeating
                        amount = Math.PI / 180;
                    } else {
                        if (mouse.ctrl && mouse.shift) { amount = Math.PI / 32 }
                        else if (mouse.ctrl) { amount = Math.PI / 4 }
                        else if (mouse.shift) { amount = Math.PI / 8 }
                    }
                    amount *= right || cmdId === commands.edSprRotCCW ? -1 : 1;
                    timeline.canUpdate = true;
                    selection.markAnimatedForChange();
                    selection.each(spr => spr.rotate(amount, true));
                    selection.checkForAnimatedChanges();
                }
            },
            [commands.edSprMirrorVer](left, right, cmdId) {
                if (mouse.shift || (mouse.oldButton & 2) === 2) {
                    utils.processSelectedImages(localProcessImage.reorient, "mirrory");
                } else {
                    timeline.canUpdate = true;
                    selection.markAnimatedForChange();
                    if( right) {
                        log.sys("Mirror selection command is currently disabled");
                        //mirrorSelection("vert");
                    }else{
                        selection.each(spr => spr.setScale(spr.sx,-spr.sy));
                        selection.callIf(spr => spr.type.normalisable, "normalize");
                    }
                    selection.checkForAnimatedChanges();
                }
                API.commands.updateLists = true;
            },
            [commands.edSprMirrorHor](left, right, cmdId) {
                if (mouse.shift || (mouse.oldButton & 2) === 2) {
                    utils.processSelectedImages(localProcessImage.reorient, "mirrorx");

                } else {
                    timeline.canUpdate = true;
                    selection.markAnimatedForChange();
                    if(right) {
                        log.sys("Mirror selection command is currently disabled");
                        //mirrorSelection("hor");
                    }else{
                        selection.each(spr => spr.setScale(-spr.sx,spr.sy));
                        selection.callIf(spr => spr.type.normalisable, "normalize");
                    }
                    selection.checkForAnimatedChanges();
                }
                API.commands.updateLists = true;
            },
            [commands.edSprCreateFunctionLink](left, right, cmdId) {
                API.commands.updateWidget = false;
                var update = false;
                if (right) {
                    if (!commandLine.quickMenuOpen()) {setTimeout(()=>commandLine("run safe functionLinkDialog",true),0) }
                    else { log.info("Existing dialog must be closed!") }


                }else{
                    if(mouse.ctrl && selection.length > 0) {
                        if(selection.length === 1 && selection[0].type.shape) {
                            let y = 0;
                            const added = [];
                            [["inner","shpI"],["radius","shpR"],["sides","shpC"],["valA","shpA"],["valB","shpB"]].forEach(type => {
                                if(selection[0].shape[type[0]] !== undefined) {
                                    const fLink = new Sprite(...utils.viewCenter,48 * 2,16,"Function Linker");
                                    fLink.changeToFunctionLink();
                                    fLink.y += y;
                                    y += 20;
                                    fLink.attachFunc(selection[0],"output");
                                    fLink.fLink.outTo = type[1];
                                    added.push(fLink);
                                }
                            });
                            API.addCreatedSprites(...added);
                            added.forEach(a => {
                                a.rgb.parseCSS(settings.functionLinkOutlineColor);
                                a.key.update();
                                API.commands.updateWidget = true;
                                update = true;
                            });
                        } else if(selection.length === 1 && !selection[0].type.functionLink) {
                            const fLinkX = new Sprite(...utils.viewCenter,48 * 2,16,"Function Linker");
                            const fLinkY = new Sprite(...utils.viewCenter,48 * 2,16,"Function Linker");
                            fLinkX.changeToFunctionLink();
                            fLinkY.changeToFunctionLink();
                            fLinkY.y += 20;
                            fLinkX.attachFunc(selection[0],"input");
                            fLinkY.attachFunc(selection[0],"input");
                            fLinkX.fLink.inFrom = "x";
                            fLinkY.fLink.inFrom = "y";
                            fLinkX.fLink.outTo = "x";
                            fLinkY.fLink.outTo = "y";
                            API.addCreatedSprites(fLinkX, fLinkY);
                            fLinkX.rgb.parseCSS(settings.functionLinkOutlineColor);
                            fLinkY.rgb.parseCSS(settings.functionLinkOutlineColor);
                            fLinkY.key.update();
                        } else if(selection.length === 1 && selection[0].type.functionLink) {
                            const fLink = new Sprite(...utils.viewCenter,48 * 2,16,"Function Linker");
                            fLink.changeToFunctionLink();
                            fLink.attachFunc(selection[0],"input");
                            fLink.fLink.inFrom = "v";
                            fLink.fLink.outTo = selection[0].fLink.outTo;
                            API.addCreatedSprites(fLink);
                            fLink.rgb.parseCSS(settings.functionLinkOutlineColor);
                        } else {
                            const fLink = new Sprite(...utils.viewCenter,48 * 2,16,"Function Linker");
                            fLink.changeToFunctionLink();
                            selection.each(spr => fLink.attachFunc(spr,"input"));
                            API.addCreatedSprites(fLink);
                            fLink.rgb.parseCSS(settings.functionLinkOutlineColor);
                        }
                        API.commands.updateWidget = true;
                        update = true;

                    }else{
                        const fLink = new Sprite(...utils.viewCenter,48 * 2,16,"Func");
                        fLink.changeToFunctionLink();
                        API.addCreatedSprites(fLink);
                        fLink.rgb.parseCSS(settings.functionLinkOutlineColor);
                        API.commands.updateWidget = true;
                        update = true;
                    }

                }
                return update;

            },
            [commands.sysGlobalEscape]() {
                if (animation.playing) {
                    if(media.videoCapture) {
                        const ctrl = mouse.ctrl;
                        mouse.ctrl = true;
                        issueCommand(commands.animPlayPause);
                        mouse.ctrl = ctrl;
                    } else {
                        issueCommand(commands.animPlayPause);
                    }
                }
                cancelSelecting = true;
                widget.specialSelectionSelect(true);
                buttons.groups.setRadio("selectToFit",-1);
                buttons.groups.setRadio("attachPattern",-1);
                buttons.groups.setRadio("alignments",-1);
                buttons.groups.setRadio("alignRotate",-1);
                buttons.groups.setRadio("lookatselect",-1);
                buttons.groups.setRadio("attachToSelect",-1);
                buttons.groups.setRadio("zorder",-1);
                buttons.groups.setRadio("attachToLocator",-1);
                buttons.groups.setRadio("liveCapture",-1);
                buttons.groups.setRadio("attachPattern",-1);
                keepEnabled.length = 0;
                if (animation.playing) {
                    if(media.videoCapture) {
                        const ctrl = mouse.ctrl;
                        mouse.ctrl = true;
                        issueCommand(commands.animPlayPause);
                        mouse.ctrl = ctrl;
                    } else {
                        issueCommand(commands.animPlayPause);
                    }
                }

                return false;
            },
            [commands.edSprUpdateAll](){ API.commands.updateLists = true },
            [commands.edSprUpdateUI](){
                widget.update();
                sprites.cleanup();
                spriteList.update();
                guides.update();
                API.update();
                return false;
            },
            [commands.animSetKeyAll]() { 
                timeline.command(commands.animSetKeyAll); 
                API.commands.updateListsLazy = true; 
            },
             [commands.animSetKeyPos]() { 
                timeline.command(commands.animSetKeyPos); 
                API.commands.updateListsLazy = true; 
            },
            [commands.animSetKeyRotate]() { 
                timeline.command(commands.animSetKeyRotate); 
                API.commands.updateListsLazy = true; 
            },            
            [commands.edSprVideoCaptureFrame](){
                if (window.capStream) {
                    try {
                        window.canvasVidTrack.requestFrame();
                    } catch (e) {
                        log.error(e);
                    }
                } else { log.info("No open capture stream found.")  }
                return false;
            },
            [commands.edSprBigPlayPause](){
				if(media.videoCapture) {
					const ctrl = mouse.ctrl;
					mouse.ctrl = true;
					issueCommand(commands.animPlayPause);
					mouse.ctrl = ctrl;
				} else {
					issueCommand(commands.animPlayPause);
				}
            },
            [commands.edSpriteToggleTimeline](left, right, cmdId){
                if (right) { issueCommand(commands.animEditMode) }
                else {
                    timeline.activateToggle();
                    if (timeline.active){  buttonMap.get(commands.edSpriteToggleTimeline).setSprite(3) }
                    else { buttonMap.get(commands.edSpriteToggleTimeline).setSprite(timeline.editMode - 1) }
                }
            },
            [commands.edSpriteToggleXYPositionLocks]() {
                var val;
                selection.each(spr => {
                    const a = spr.attachment;
                    var v = spr.locks.locX ? 1 : 0;
                    v += spr.locks.locY ? 2 : 0;
                    if(val === undefined) { val = (v + 1) % 4 }
                    spr.locks.locX = (val & 1) === 1;
                    spr.locks.locY = (val & 2) === 2;
                });
                buttonMap.get(commands.edSpriteToggleXYPositionLocks).setSprite(val);
                API.commands.updateLists = true;
            },
            [commands.edSprDelete](left, right, cmdId){
                API.commands.updateWidget = false;
                if (selection.length > 0) {
                    groups.deleting = true;
                    if (right){
                        const sel = selection.asArray();
                        sprites.remove(selection);
                        selection.clear();
                        for (const spr of sel) {
                            if (spr.type.image) { mediaList.deleteMedia(spr.image) }
                            else if (spr.type.vector) { mediaList.deleteMedia(spr.vector) }
                        }
                    } else {
                        sprites.remove(selection);
                        selection.clear();
                    }
                    timeline.cleanKeySelections();
                    groups.deleting = false;
                    API.commands.updateLists = true;
                } else { log.warn("Can not delete!!! nothing selected."); return false }
            },
            [commands.edSprUpdateAnimPath](){

                if (selection.length) {
                    const show = !selection[0].type.showAnimPath;
                    selection.forEach(spr => {
                        spr.type.showAnimPath = show;
                        spr.updateWidgetAnimPath();
                    });
                    if (selection.length > 1) {
                        log.warn("CMD edSprUpdateAnimPath will only show when single sprite selected");
                    }
                } else {
                    log.warn("No sprites selected");
                }
                return false;
            },
            [commands.edSprDrawing](left, right, cmdId){
                API.commands.updateWidget = false;
                if (API.drawingModeOn) {
                    buttons.groups.setRadio("drawingMode",0);
                    API.drawingModeOn = false;
                    paint.off();
                    if (selection.length > 0){ API.setButtonStatus(drawingModeDisable) }
                    widget.update();
                } else {
                    buttons.groups.setRadio("drawingMode",cmdId);
                    API.drawingModeOn = true;
                    paint.on();
                    API.setButtonStatus(null,drawingModeDisable);
                    widget.clear();
                }
            },
            [commands.edSprImageCopy]() {
                const newSprites = [];
                selection.each(spr => {
                    if(spr.type.image){
                        media.create({ type : "copy", of : spr.image, },
                            (canvas)=>{ }
                        );
                    }
                });
                API.commands.updateWidget = false;
                API.commands.updateLists = true;
            },
            [commands.edSprCopy](left, right, cmdId){ return API.commands[commands.edSprCopyAnim](left, right, cmdId) },
            [commands.edSprCopyAnim](left, right, cmdId){
                const copyAnim =  right || cmdId === commands.edSprCopyAnim;
                const hasImageAnimation = copyAnim && selection.some(spr => spr.type.image && spr.type.animated && spr.animation.tracks.image);
				if(hasImageAnimation) {
                    if (commandLine.quickMenuOpen()) { log.warn("Copy canceled. Close active dialogs first"); return   }
                    const copyAnimatedImages = buttons.quickMenu(
                        "26 Animated Images?|Cancel|"+
                        "textCenter A selected sprite contains animated images,textCenter Select a copy option\\?,,,"+
                        "!Copy anim and images\\?,,,"+
                        "!Copy replace images\\??Replaces all unique images with copies Does not copy sprite,,,"+
                        "!Copy current frame\\?,,,"+
                        "!Copy current frame and add to end of animation\\?,,,"+
                        "!Copy current frame and insert at current time\\??Only inserts if anim has later frames else add frame at current time,,,"+
                        "!Copy current frame and add at current time\\??If image key at time that image is replaced"
                    );
                    copyAnimatedImages.onclosed = () => {
                        if(copyAnimatedImages.optionClicked === "Copy current frame?"){
                            copySelected(false, false, true);
						} else if(copyAnimatedImages.optionClicked === "Copy current frame and insert at current time?"){
                            copySelected(false, false, false, false, false, true, "insert key");
						} else if(copyAnimatedImages.optionClicked === "Copy current frame and add to end of animation?"){
                            setTimeout(() => {
                                const numCopies = buttons.quickMenu("20 Number copies?|Cancel|textCenter How many copies of the image to add\\?,{,1,2,3,4,5,6,7,8,9,10,},{,11,12,13,14,15,16,17,18,19,20,},");
                                numCopies.onclosed = () => {
                                    if(numCopies.optionClicked === "Cancel") {
                                        log.warn("Copy franes aborted by user!");
                                        return
                                    } else {
                                        copySelected(false, false, false, false, false, true, "append keys" , Number(numCopies.optionClicked));
                                        sprites.cleanup();
                                        spriteList.update()
                                        guides.update();
                                    }

                                }
                            }, 200);
                            return
						} else if(copyAnimatedImages.optionClicked === "Copy current frame and add at current time?"){
                            copySelected(false, false, false, false, false, true, "add key");
						} else if(copyAnimatedImages.optionClicked === "Copy replace images?"){
                            copySelected(false, false, true, false, true);
						} else if(copyAnimatedImages.optionClicked === "Copy anim and images?"){
                            copySelected(false, true, true, false, true);
                        }else{
                            log.warn("Copy aborted by user!");
                            return
                        }
                        sprites.cleanup();
                        spriteList.update()
                        guides.update();
                    }
                    return;
				}
                if (selection.length === 1 && ((mouse.oldButton & 2) === 2)) {
                    const spr = selection[0];
                    if (spr.type.image && spr.image.desc.capturing) {
                         media.create({ type: "copy", of: spr.image}, (canvas) => {
                             log.info("Silent copy of capture sprite");
                         })
                        
                        API.commands.updateLists = true;
                        return
                        
                    }
                }
                const imgs = selection.reduce((c,spr) => c + (spr.type.image ?  1 : 0), 0);
                if(imgs >= 5) {
                    if (commandLine.quickMenuOpen()) { log.warn("Copy canceled. Close active dialogs first"); return   }
                    const copyManyConfirm = buttons.quickMenu( "20 Warning?|Cancel,Copy|textCenter Copying "+imgs+" images,textCenter Are you sure\\?");
                    copyManyConfirm.onclosed = () => {
                        if(copyManyConfirm.exitClicked === "Copy"){
                            copySelected(false, copyAnim, true);
                            sprites.cleanup();
                            spriteList.update()
                            guides.update();
                        }else{
                            log.warn("Copy aborted by user!");
                        }
                    }
                    return;
                }
                copySelected(false, copyAnim, true);
                API.commands.updateWidget = false;
                API.commands.updateLists = true;
            },
            [commands.edSprClip](left, right, cmdId) { return API.commands[commands.edSprPad](left, right, cmdId) },
            [commands.edSprPad](left, right, cmdId) {
                var hasAnimated = false;
                const subSprites = new Set();
                var processCount = 0;
                selection.eachImage((s, img, i) => {
                    if (img.desc.sprites) { subSprites.add(img) }
                    else { processCount ++ }
                });
                if (processCount === 0) {
                    if (subSprites.size) { log.warn("Can not pad or clip sub sprites") }
                    else { log.warn("No images selected to clip") }
                    return false;
                }
                const tempSel = selection.asArray();
                selection.silent = true;
                tempSel.forEach(spr => {
                    if ((spr.type.image && spr.image.desc.sprites) || spr.type.image === false) { selection.remove(spr, true) }
                });
                const reselect = () => {
                    selection.clear(true);
                    selection.add(tempSel);
                    selection.silent = false;
                }
                subSprites.size && log.warn("Sub sprites and will not be padded or clipped");

                selection.eachImage((s, img, i) => {
                    if (!hasAnimated) {
                        sprites.eachOfType(spr => {
                            if (spr.image === img) {
                                if (spr.type.animated) { return hasAnimated = true }
                                if (spr.type.attached && spr.attachedTo.type.animated) { return hasAnimated = true }
                                if (spr.attachers) {
                                    for (const a of spr.attachers.values()) {
                                        if (a.type.animated) {  return hasAnimated = true }
                                    }
                                }
                            }
                        },"image");
                    }
                });
                if (hasAnimated) {
                    if (commandLine.quickMenuOpen()) {
                        log.warn("Clipping animated sprites requiers dialog. Close active dialogs first");
                        reselect();
                        return;
                    }
                    const words = cmdId === commands.edSprClip ? ["Clip", "clip", "Clipping"] : ["Pad", "pad", "Padding"];
                    const clipAnimatedImages = buttons.quickMenu( "26 Animated?|Cancel|textCenter A selected sprite contains animations,textCenter " + words[2] + " the image,textCenter may result in undesired changes,textCenter Select an option," +
                        "!" + words[0] + " current frame as is\\?,,,"+
                        "!Backup and " + words[1] + " current frame\\?,,," +
                        "!" + words[0] + " animated as is\\?,,,"+
                        "!Backup and " + words[1] + " animated\\?"
                    );
                    clipAnimatedImages.onclosed = () => {
                        const processFunc = clipAnimatedImages.optionClicked.includes("animated") ? "processAnimatedImages" : "processImages";
                        if(clipAnimatedImages.optionClicked.includes(" as is?")){
                            selection[processFunc]((img, i) => {
                                var amount = (Math.min(img.width, img.height) * 0.25 * 0.5) | 0;
                                if (!amount || right) { amount = 1 }
                                img.restore(false);
                                const processed = cmdId === commands.edSprClip ? localProcessImage.autoClip(img) : localProcessImage.pad(img, 0, amount);
                                sprites.eachOfType(spr => {
                                    if (spr.image === img){  spr.imageResized(true) }
                                },"image");
                                return processed === true;
                            });
                            setTimeout(()=> {
                                reselect();
                                issueCommand(commands.edSprUpdateAll);
                                animation.forceUpdate();
                            },0);
						} else if(clipAnimatedImages.optionClicked.includes("Backup and ")){
                            spriteList.saveAll(true).then(() => {
                                selection[processFunc]((img, i) => {
                                    var amount = (Math.min(img.width, img.height) * 0.25 * 0.5) | 0;
                                    if (!amount || right) { amount = 1 }
                                    img.restore(false);
                                    const processed = cmdId === commands.edSprClip ? localProcessImage.autoClip(img) : localProcessImage.pad(img, 0, amount);
                                    sprites.eachOfType(spr => { spr.image === img && spr.imageResized(true) }, "image");
                                    return processed === true;
                                });
                                setTimeout(()=> {
                                    reselect();
                                    issueCommand(commands.edSprUpdateAll);
                                    animation.forceUpdate();
                                },0);
                            });
                        } else {
                            reselect();
                            log.warn("" + words[0] + " aborted by user!");
                        }
                    }
                    return;
                } else {
                    selection.processImages((img, i) => {
                        var amount = (Math.min(img.width, img.height) * 0.25 * 0.5) | 0;
                        if (!amount || right) { amount = 1 }
                        img.restore(false);
                        const processed = cmdId === commands.edSprClip ? localProcessImage.autoClip(img) : localProcessImage.pad(img, 0, amount);
                        sprites.eachOfType(spr => { spr.image === img && spr.imageResized(true) }, "image");
                        return processed === true;
                    });
                    reselect();
                    API.commands.updateWidget = true;
                    API.commands.updateLists = true;

                }
            },
            [commands.edSprDoubleVer](left, right, cmdId) { return API.commands[commands.edSprDouble](left, right, cmdId) },
            [commands.edSprDoubleHor](left, right, cmdId) { return API.commands[commands.edSprDouble](left, right, cmdId) },
            [commands.edSprDouble](left, right, cmdId) {
                timeline.canUpdate = true;
                selection.markAnimatedForChange();
                const scaleY = cmdId === commands.edSprDoubleVer || cmdId === commands.edSprDouble;
                const scaleX = cmdId === commands.edSprDoubleHor || cmdId === commands.edSprDouble;
                if (mouse.ctrl){
                    const step =  (mouse.repeatingState.button & 4) === 4 ? -2 : 2;
                    selection.each(spr => {
                        if(scaleY && scaleX){
                            let ss =  Math.max(spr.w * spr.sx,spr.h * spr.sy);
                            ss = (ss + step) / ss;
                            spr.setScale(spr.sx * ss,spr.sy * ss);
                        } else if(scaleY) {
                            let ss =  spr.h * spr.sy;
                            ss = (ss + step) / ss;
                            spr.setScale(spr.sx,spr.sy * ss);
                        }else {
                            let ss =  spr.w * spr.sx;
                            ss = (ss + step) / ss;
                            spr.setScale(spr.sx * ss,spr.sy);
                        }
                    })
                } else {
                    if (right) { selection.each(spr => spr.setScale(scaleX ? spr.sx * (1 / 2) : spr.sx, scaleY ? spr.sy * (1 / 2) : spr.sy)) }
                    else { selection.each(spr => spr.setScale(scaleX ? spr.sx * 2 : spr.sx, scaleY ?  spr.sy * 2 :  spr.sy)) }

                }
                API.commands.updateLists = true;
                selection.checkForAnimatedChanges();
            
			},
            [commands.edSprDown](left, right) {
                if (mouse.shift && !mouse.ctrl) {
                    if (right || sprites.selectingSprite) {
                         if(sprites.selectingSprite){
                            widget.specialSelectionSelect(true);
                            buttons.groups.setRadio("zorder", -1);
                            keepEnabled.length = 0;
                        }else{
                            keepEnabled[0] = commands.edSprUp;
                            zorderCallback.attachedOrder = true;
                            widget.selectionCallback(zorderCallback);
                            API.commands.updateWidget = false;
                            spriteRender.highlightColor = settings.highlightSelZorder;
                            buttons.groups.setRadio("zorder", commands.edSprUp);
                        }
                    } else if (left) {
                        selection.moveAttachOrder("down");
                        API.commands.updateWidget = false;
                        API.commands.updateLists = true;
                        API.commands.scrollSpriteToView = true;
                    }

                } else if (right || sprites.selectingSprite) {
                    if(sprites.selectingSprite){
                        widget.specialSelectionSelect(true);
                        buttons.groups.setRadio("zorder",-1);
                        keepEnabled.length = 0;
                    }else{
                        keepEnabled[0] = commands.edSprDown;
                        zorderCallback.attachedOrder = false;
                        widget.selectionCallback(zorderCallback);
                        API.commands.updateWidget = false;
                        spriteRender.highlightColor = settings.highlightSelZorder;
                        buttons.groups.setRadio("zorder",commands.edSprDown);
                    }

                } else {
                    sprites.moveZ("down");
                    API.commands.updateWidget = false;
                    API.commands.updateLists = true;
                    API.commands.scrollSpriteToView = true;
                }
            },
            [commands.edSprUp](left, right) {
                 if (mouse.shift && !mouse.ctrl) {
                    if (right || sprites.selectingSprite) {
                         if(sprites.selectingSprite){
                            widget.specialSelectionSelect(true);
                            buttons.groups.setRadio("zorder",-1);
                            keepEnabled.length = 0;
                        }else{
                            keepEnabled[0] = commands.edSprUp;
                            zorderCallback.attachedOrder = true;
                            widget.selectionCallback(zorderCallback);
                            API.commands.updateWidget = false;
                            spriteRender.highlightColor = settings.highlightSelZorder;
                            buttons.groups.setRadio("zorder", commands.edSprUp);
                        }
                    } else if(left) {
                        selection.moveAttachOrder("up");
                        API.commands.updateWidget = false;
                        API.commands.updateLists = true;
                        API.commands.scrollSpriteToView = true;
                    }
                } else if (right || sprites.selectingSprite) {
                    if(sprites.selectingSprite){
                        widget.specialSelectionSelect(true);
                        buttons.groups.setRadio("zorder",-1);
                        keepEnabled.length = 0;
                    }else{
                        keepEnabled[0] = commands.edSprUp;
                        zorderCallback.attachedOrder = false;
                        widget.selectionCallback(zorderCallback);
                        API.commands.updateWidget = false;
                        spriteRender.highlightColor = settings.highlightSelZorder;
                        buttons.groups.setRadio("zorder", commands.edSprUp);
                    }

                } else {
                    sprites.moveZ("up");
                    API.commands.updateWidget = false;
                    API.commands.updateLists = true;
                    API.commands.scrollSpriteToView = true;
                }
            },
            [commands.edSprTop](left, right) {
                if (left && mouse.shift && !mouse.ctrl) {
                    selection.moveAttachOrder("top");
                } else {
                    if (right) { sprites.moveZ("swap") }
                    else { sprites.moveZ("top") }
                }
                API.commands.updateWidget = false;
                API.commands.updateLists = true;
            },
            [commands.edSprBot](left, right) {
                if (left && mouse.shift && !mouse.ctrl) {
                    selection.moveAttachOrder("bottom");
                } else  {
                    if (right) { sprites.moveZ("swap") }
                    else { sprites.moveZ("bottom") }
                }
                API.commands.updateWidget = false;
                API.commands.updateLists = true;
            },
			[commands.edSpriteToggleLinkedTo](left, right) {
				if (buttonMap.get(commands.edSpriteToggleAttachTo).element.disabled) {
					return false;
				}
                if(sprites.selectingSprite){
                    if(right) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("attachToSelect",-1);
                    keepEnabled.length = 0;
                } else {
					mouse.shift = false;
					keepEnabled[0] = commands.edSpriteToggleAttachTo;
					widget.selectionCallback(alignLinkedCallback);
					spriteRender.highlightColor = settings.highlightSelLinked;
					buttons.groups.setRadio("attachToSelect", commands.edSpriteToggleAttachTo);
					API.commands.updateWidget = false;
                }		
			},
			[commands.edSpriteToggleAttachTo](left, right) {
                if(sprites.selectingSprite){
                    if(right) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("attachToSelect",-1);
                    keepEnabled.length = 0;
                } else {
					if (mouse.shift) {
						mouse.shift = false;
						keepEnabled[0] = commands.edSpriteToggleAttachTo;
						widget.selectionCallback(alignLinkedCallback, false);
						spriteRender.highlightColor = settings.highlightSelLinked;
						
					} else {
						keepEnabled[0] = commands.edSpriteToggleAttachTo;
						widget.selectionCallback(alignAttachCallback, false);
						spriteRender.highlightColor = settings.highlightSelAttach;
					}
					buttons.groups.setRadio("attachToSelect",commands.edSpriteToggleAttachTo);
					API.commands.updateWidget = false;
                }
            },			
 			[commands.edSprCreateCutter](left, right) {
                if (mouse.ctrl) {
                    let warn;
					if (mouse.oldButton & 4) {
						if (selection.length > 0) {
							const extent = Extent();
							const newSprites = [];
							selection.each(spr => {
									extent.irate();
									spr.key.calcExtent(extent);
									const cutter = new Sprite(extent.x + extent.w / 2, extent.y + extent.h / 2, extent.w, extent.h,"Cutter");
									newSprites.push(cutter);
								}
							);
							API.addCreatedSprites(...newSprites);
                            API.commands.updateWidget = true;
                            API.commands.updateLists = true;
						} else { warn = "No selected sprites found!"; }
					} else {
						selection.each(spr => {
							if (!spr.type.cutter) {
								if (!spr.changeToCutter()) { warn = "One or more selected sprite could not be converted to cutters" }
							}
						});
					}
                    if (warn) { log.warn(warn) }
                } else {
                    API.commands.updateWidget = false;
                    if (mouse.oldButton & 4 && selection.length > 0) {
                        const extent = selection.getExtent();
                        API.addCreatedSprites(new Sprite(extent.x + extent.w / 2, extent.y + extent.h / 2, extent.w, extent.h,"Cutter"));
                    } else { API.addCreatedSprites(new Sprite(...utils.viewCenter,256,256,"Cutter")); }
                    
                }
            },
            [commands.edSprCreateShape](left, right) {
                if (right) {
                    if (!commandLine.quickMenuOpen()) { setTimeout(()=>commandLine("run safe spriteShapeDialog",true),0); }
                    else { log.info("Existing dialog must be closed!"); }
                } else  { API.commands.updateWidget = false; }
            },
 			[commands.edSprCreateText](left, right) {
                if ((mouse.oldButton & 4) === 4) {
                    var foundText;
                    selection.eachOfType(spr => { foundText = spr; return true },"text");
                    if (foundText) {
                        if (mouse.ctrl) {
                            selection.eachOfType(spr => { spr.changeToText(undefined, undefined, true); }, "text");  // makes text unique
                        }
                        setTimeout(() => {
                                commandLine(API.updateSpriteText);
                                commandLine(selection[0].textInfo.textData, false, true, true);
                            }, 1);
                    } else { log.warn("There are no text sprites selected"); }
                } else {
                    API.commands.updateWidget = false;
                    var text = new Sprite(...utils.viewCenter, 256, 256, "Text");
                    text.changeToText("text");
                    API.renamingNewSprite = false;
                    API.addCreatedSprites(text);
                    log.info("Set the text content in the command bar");
                    setTimeout(() => {
                            commandLine(API.updateSpriteText);
                            commandLine(text.textInfo.textData, false, true, true);
                        }, 1);
                }
                API.commands.updateLists = true;
            },
 			[commands.edSprClearSelected](left, right) {
                if (editSprites.drawingModeOn) {
                    issueCommand(commands.paintClear);
                    return false;
                }
                selection.eachOfType(spr => { if(spr.image.isDrawable) { spr.image.clear(); } },"image");
            },                
 			[commands.edSpriteResetFunctionLinks](left, right) {
                selection.each(spr => {
                    if(spr.type.functionLink) {
                        spr.fLink.value = 0;                        
                        if(spr.fLink.funcObj) { spr.fLink.reset = true; }
                    }
                });
                return false;
            },
 			[commands.edSpriteResetAllFunctionLinks](left, right) {
                sprites.resetFunctionLinks();
                return false;
            }, 
            [commands.edSprSetViewSprite](left, right) {

                if(selection.length > 1) { log.info("Can only apply to one sprite at a time") }
                else {
                    let wasOn = false;
                    if(sprites.viewSprite) {
                        if(mainCanvas.ctx.useViewSprite()) {
                            wasOn = true;
                            mainCanvas.ctx.useViewSprite(false);
                        }
                        sprites.unsetViewSprite();
                    }
                    sprites.setViewSprite(selection[0]);
                    if (wasOn) { mainCanvas.ctx.useViewSprite(true) }
                    API.commands.updateLists = true;
                }
                return true;
            }, 
            
 			[commands.edSprToggleViewSprite](left, right) {
                if(sprites.viewSprite) {
                    if(mainCanvas.ctx.useViewSprite()) {
                        mainCanvas.ctx.useViewSprite(false);
                        //log.info("View sprite deactivate");
                        if (!grid.hasError) {
                            buttonMap.get(commands.edSprShowGrid).enable();
                        }
                    } else {
                        mainCanvas.ctx.useViewSprite(true);
                        if (API.showGrid) {
                            log.warn("Current grid overlay is not avalible with view sprites.");
                            API.showGrid = false;
                            buttonMap.get(commands.edSprShowGrid).setSprite(0);  
                        }                            
                        buttonMap.get(commands.edSprShowGrid).disable();                        
                        //log.info("View sprite activated");
                    }
                } else {
                    log.warn("No sprite set as view sprite");
                }
                return false;
            },
 			[commands.edSprClipboardCopy](left, right) {
                if (selection.length) {
                    if (!CanDo.clipboard) { log.warn("You dont have permision to access clipboard"); return false; }
                    issueCommand(commands.spritesSelectedToClipboard);
                }
                return false;
            },
 			[commands.edSprClipboardPaste](left, right) {
                
                if (!CanDo.clipboard) { log.warn("You dont have permision to access clipboard"); return false; }
                const readText = () => {
                     navigator.clipboard.readText().then(text => {
                        if (text) {
                            if (text.includes(storage.clipboardMark)) {
                                storage.jsonString = text;
                                storage.loadJSON(storage.clipboardName, "select");
                                text = undefined;
                            } else if (selection.length === 0) {
                                const textLines = text.replace(/\r/g, "").split("\n").map(t => t.trim()).filter(t => t !== "");
                                const added = [];
                                const fSize = Number(settings.textSpriteFontSize) * 1.2;
                                const [cx, cy] = mouse.cMouse.over ? [mouse.cMouse.rx, mouse.cMouse.ry] : utils.viewCenter;
                                var yOff = textLines.length * fSize * -0.5;
                                const addLines = () => {
                                    for (const line of textLines) {
                                        const tSpr = new Sprite(cx, cy + yOff, 256, 256, "clipText");
                                        tSpr.changeToText(line);
                                        added.push(tSpr)
                                        yOff += fSize;
                                    }
                                    API.renamingNewSprite = false;
                                    API.newSpriteHoldUpdate = true;
                                    API.addCreatedSprites(...added);     
                                    issueCommand(commands.edSprUpdateAll);
                                }
                                if (textLines.length > 20) {
                                    confirmDialog("Warning?", ["Are you sure you want to", "paste " + textLines.length + " lines of text?"], ["Cancel", "Paste"])
                                        .then(res => { res === "Paste" && addLines() });
                                } else {
                                    addLines();
                                }
                            } else {
                                if (selection.hasType("text")) {
                                    const textLines = text.replace(/\r/g, "").split("\n").map(t => t.trim()).filter(t => t !== "");
                                    var line = 0;
                                    selection.eachOfType(spr => {
                                            if (line < textLines.length) {
                                                spr.textInfo.change(textLines[line].trim());
                                            }
                                            line ++;
                                        },
                                        "text"
                                    );
                                    issueCommand(commands.edSprUpdateAll);
                                } else {
                                    log.warn("Selection contained nothing to paste text to!");
                                }
                            }
                            
                        } else {
                            log.sys("Clipboard appears to be empty.");
                            log.sys("Note browser may not have access to all clipboard content types.");
                        }
                        
                    }).catch(e=>{
                        log.warn("Paste command did not complete? Reason unknown!");                    
                    });
                };
                navigator.clipboard.read().then(content => {
                    var isText = false;
                    var hasImage = false;
                    for (const item of content) {
                        if (item.types.includes("text/plain")) { isText = true; }
                        if (item.types.includes("image/png")) { hasImage = true; }
                    }
                    if (isText) { readText(); }
                    if (hasImage) {
                        const [cx, cy] = mouse.cMouse.over ? [mouse.cMouse.rx, mouse.cMouse.ry] : utils.viewCenter;
                        var offX = 0;                     
                        for (const item of content) {
                            if (item.types.includes("image/png")) { 
                                item.getType('image/png').then(blob => {
                                    const imgID = getGUID();
                                    media.create({
                                        type: "dataURL", 
                                        image: {
                                            dataURL: URL.createObjectURL(blob),
                                            name: "Clipboard_" + imgID,
                                            fname: "",
                                            id: imgID
                                        }}, img => {
                                            if (!img) { log.warn("Clipboard contained bad image data") }
                                            else {
                                                if (offX) { offX += img.w * 0.5 }
                                                const spr = new Sprite(cx, cy, img.w, img.h, "clipboardImg");
                                                offX += img.w * 0.5;
                                                spr.changeImage(img);    
                                                API.renamingNewSprite = false;                                                
                                                API.addCreatedSprites(spr);
                                            }
                                        }   
                                    );
                                });
                            }
                        }
                    }
                        
                }).catch(() => log.warn("There was a problem accessing the clipboard."));
                return false;
            },	        
        },
        command(commandId){
            /* NOTE I am currently in the process of moving commands to functions in API.commands
               This may take some time as I am moving them as and when I make any changes.
            */
            const addCreatedSprite = API.addCreatedSprites;
            const rightClick = (mouse.oldButton & 4) === 4;
            var updateWidget = true;
            var updateLists = false;
            var updateListsLazy = false;
            var scrollSpriteToView = false;
            var fireUpdate = false;
            var commandProcessed = false
            if(API.commands[commandId]) {
                unloadWarning = true;
                API.commands.updateWidget = updateWidget;
                API.commands.updateLists = updateLists;
                API.commands.updateListsLazy = updateListsLazy;
                API.commands.scrollSpriteToView = scrollSpriteToView;
                API.commands.fireUpdate = fireUpdate;
                if (API.commands[commandId]((mouse.oldButton & 1) === 1, rightClick, commandId) === false) { return  }
                updateWidget = API.commands.updateWidget;
                updateLists = API.commands.updateLists;
                updateListsLazy = API.commands.updateListsLazy;
                scrollSpriteToView = API.commands.scrollSpriteToView;
                fireUpdate = API.commands.fireUpdate;
                commandProcessed = true;
            }
            if(commandProcessed) {

            } else if(commandId === commands.edSpriteToggleAttachScale){
                var val = undefined;
                let warnnormalisable = false;

                selection.eachOfType(spr => {
                        if (spr.attachedTo.type.normalisable) {
                            warnnormalisable += 1;
                        } else {
                            const a = spr.attachment;
                            var v = a.inheritScaleX ? 1 : 0;
                            v += a.inheritScaleY ? 2 : 0;
                            if(val === undefined) { val = (v + 1) % 4 }
                            a.inheritScaleX = (val & 1) === 1;
                            a.inheritScaleY = (val & 2) === 2;
                        }
                    },
                    "attached"
                );
                selection.eachOfType(spr => {
                        const l = spr.locators;
                        var v = l.scaleX ? 1 : 0;
                        v += l.scaleY ? 2 : 0;
                        if(val === undefined) { val = (v + 1) % 4 }
                        l.scales(["","x","y","xy"][val]);
                    },
                    "hasLocators"
                );
                selection.eachOfType(spr => {
                        for(const s of spr.locates) {
                            const l = s.locators;
                            var v = l.scaleX ? 1 : 0;
                            v += l.scaleY ? 2 : 0;
                            if(val === undefined) { val = (v + 1) % 4 }
                            l.scales(["","x","y","xy"][val]);
                        }
                    },
                    "locates"
                );
                if (warnnormalisable) {
                    log.warn("One or more sprites can not inherit attached scale as they are attached to sprite without scale.");
                }

                buttonMap.get(commands.edSpriteToggleAttachScale).setSprite(val);
                updateLists = true;
            }else if(commandId === commands.edSpriteToggleAttachmentScale){
                var val;
                let warnnormalisable = false;
                selection.eachOfType(spr => {
                        if (spr.attachedTo.type.normalisable) {
                            warnnormalisable += 1;
                        } else {
                            var v = spr.attachment.scaleAttachX;
                            if(val === undefined) { val = !v }
                            spr.attachment.scaleAttach = val;
                        }
                    },
                    "attached"
                );
                if (warnnormalisable) { log.warn("One or more sprites can not be have attach position scaled as they are attached to sprites without scale."); }
                updateLists = true;
                buttonMap.get(commands.edSpriteToggleAttachmentScale).setSprite(val ? 3 : 0);
            }else if(commandId === commands.edSpriteToggleAttachRotate){
                let val, didChange = false, hadLooker;
                selection.eachOfType(spr => {
                        if(!spr.type.lookat) {
                            const v = spr.attachment.inheritRotate;
                            if (val === undefined) { val = !v }
                            spr.attachment.rotateType = val ? "inherit" : "fixed";
                            didChange = true;
                        }else {
                            hadLooker = true;
                        }
                    },
                    "attached"
                );
                if (didChange) {
                    updateLists = true;
                    buttonMap.get(commands.edSpriteToggleAttachRotate).setSprite(val ? 0 : 1);
                    if (hadLooker) { log.info("Some sprites are lookat sprites and can not inherit rotation.") }
                } else if(hadLooker) {
                    log.info("Lookat sprites can not inherit rotation.");
                }
            }else if(commandId === commands.edSprToggleSpriteAsPaintSrc){
                if(selection.length > 0){
                    let errorSel = "Source must contain a drawable image";
                    selection.eachOfType(spr => {
                            if(spr.image.isDrawable) {
                                if(pens.colorSource !== spr.guid) {
                                    pens.setSpriteColorSrc(spr);
                                    buttonMap.get(commands.edSprToggleSpriteAsPaintSrc).setSprite(1);
                                } else {
                                    pens.setSpriteColorSrc(undefined);
                                    buttonMap.get(commands.edSprToggleSpriteAsPaintSrc).setSprite(0);
                                }
                                errorSel = "";
                                return true;
                            }
                        },"image"
                    );
                    if(errorSel){log.info(errorSel)}
                }
            }else if (commandId >= commands.edSprGridSnap1 && commandId < commands.edSprGridSnapLast) {
                const snapPx = pixelSnapValues[commandId-commands.edSprGridSnap1];
                commandLine("settings pixelSnap "+ snapPx, true)

            }else if(commandId === commands.edSprSelectTree){
                const next = new Set();
                let hasCompoundJoin = false, hasCompound = false, hasAttachers = false;
                selection.each(spr => {
                    if (spr.type.compoundShape) { hasCompoundJoin = true }
                    if (spr.type.shape && spr.shape.isCompound) { hasCompound = true }
                    if (spr.locates || spr.type.attached || spr.lookers || spr.type.lookat || spr.type.linked || spr.linkers || spr.attachers || spr.type.hasLocators) { hasAttachers = true }
                })
                if (mouse.shift || (!hasAttachers && (hasCompoundJoin || hasCompound))) {
                    if(rightClick || (hasCompoundJoin && !hasCompound)) {
                        selection.each(spr => {
                            if (spr.type.compoundShape) {
                                sprites.each(s => {
                                    if(s.type.shape && s.shape.isCompound && s.shape.joined.has(spr)) {
                                        next.add(s);
                                    }
                                });
                            }
                        });
                    } else {
                        selection.each(spr => {
                            if (spr.type.shape && spr.shape.isCompound) {
                                for (const j of spr.shape.joined.values()) {
                                    next.add(j);
                                }
                            }
                        });
                    }


                } else {
                    selection.each(spr => {
                        if(rightClick) {
                            if(spr.locates && !spr.locates.selected) { next.add(spr.locates) }
                            if(spr.lookers) {
                                for(const l of spr.lookers.values()) {
                                    if(!l.selected) { next.add(l) }
                                }
                            }
							if (spr.linkers) {
                                for(const l of spr.linkers.values()) {
                                    if(!l.selected) { next.add(l) }
                                }
							}
                            if(spr.type.attached && !spr.attachedTo.selected) { next.add(spr.attachedTo) }
                        }else{
                            if(spr.type.linked && !spr.linked.selected) { next.add(spr.linked) }
                            if(spr.type.lookat && !spr.lookat.spr.selected) { next.add(spr.lookat.spr) }
                            if(spr.attachers) {
                                for(const s of spr.attachers.values()) {
                                    if(!s.selected) { next.add(s) }
                                }
                            }
                            if(spr.type.hasLocators) {
                                for(const l of spr.locators) {
                                    if(!l.spr.selected) { next.add(l.spr) }
                                }
                            }
                        }
                    });

                }
                if(mouse.ctrl) { selection.clear() }
                for(const spr of next.values()) { selection.add(spr) }
            } else if(commandId === commands.edSprCreateShape_Vector){
                let haveImages = false;
                const imgSprs = [];
                selection.each(spr => {
                    if (spr.type.image && spr.image.isDrawable) {
                        haveImages = true;
                        imgSprs.push(spr);
                    }
                });

                if (haveImages) {
                    selection.clear(true);
                    selection.add(imgSprs, true);
                    let count = imgSprs.length;
                    imgSprs.length = 0;
                    utils.processSelectedImagesCallback(localProcessImage.imageToVectorPaths, (pathStr, img, spr) => {
                            const shape = new Sprite(0,0,img.w * spr.sx,img.h * spr.sy,"Vector");
                            shape.color = colours.mainColor.css;
                            sprites.add(shape);
                            media.create({ type : "vector", width : img.w  * spr.sx, height : img.h  * spr.sy, pathStr, fromImage : img },
                                (vec) => {
                                    shape.changeToShape("Shape","vector", vec);
                                    imgSprs.push(shape);
                                    shape.fitTo(spr);
                                    count --;
                                    if (count === 0) {
                                        setTimeout(() => {
                                            selection.clear();
                                            selection.add(imgSprs);
                                        },0);
                                    }
                                }
                            );
                            return true;
                        }, colours.mainColor, 32, "IncludeSprite");

                } else {
                    log.warn("No drawable images selected!!");
                }
            } else if(commandId === commands.edSprCreateShape_CompoundShape){
                const shapes = selection.arrayOfType("shape", true);
                const canNotGroup = shapes.some(s => s.shape.canNotGroup === true);
                if (shapes.length > 1 || (canNotGroup && shapes.length)) {
                    if (canNotGroup) {
                        if (mouse.ctrl === true) {
                            const shape = new Sprite(...utils.viewCenter,256,256,"Shape");
                            shape.changeToShape(shapes[0].name, "vectorCommited");
                            for (const shp of shapes) {
                                shape.shape.commitFrom(shp, true);
                            }
                            shape.shape.commitClose();
                            addCreatedSprite(shape);

                        } else {
                            log.warn("Selection contains 1 or more shapes that can not be grouped");
                            log.warn("To commit to vector hold [CTRL] and issue command");
                        }


                    } else {
                        selection.clear();
                        selection.add(shapes);
                        issueCommand(commands.spritesGroup);

                        selection[0].changeToShape("Shape", SPRITE_SHAPE_TYPES[commands.edSprCreateShape_CompoundShape - commands.edSprCreateShape_Circle]);

                        selection[0].group.addEvent("onremoved", (group, type, spr) => { group.owner.shape.compoundUnjoin(spr) })
                        selection[0].group.addEvent("onadded", (group, type, spr) => { group.owner.shape.compoundJoin(spr); spr.a = 0 })
                        shapes.forEach(s => {
                            selection[0].shape.compoundJoin(s);
                            s.a = 0;
                        });
                    }
                } else if (shapes.length === 1) {
                    log.warn("Compound shape requiers 2 or more selected shapes")
                } else {
                    log.warn("No shapes selected to create a compound shape from")
                }

            } else if(commandId >= commands.edSprCreateShape_Circle && commandId <= commands.edSprCreateShape_Sphere){
                let haveCutters = false;
                if ((mouse.oldButton & 4) === 4) {
                    selection.each(spr => { if (spr.type.cutter) { return haveCutters = true } });

                    if (haveCutters) {
                        const shape = SPRITE_SHAPE_TYPES[commandId - commands.edSprCreateShape_Circle]
                        selection.each(spr => {
                            if (spr.type.cutter) {
                                spr.changeToShape("Shape", shape);
                            }
                        });
                    }
                } else {
                    updateWidget = false;
                    let shape;
                    shape = new Sprite(...utils.viewCenter,256,256,"Shape");
                    shape.changeToShape("Shape", SPRITE_SHAPE_TYPES[commandId - commands.edSprCreateShape_Circle]);
                    addCreatedSprite(shape);
                }
            } else if (commandId === commands.edSprUndo) {// && !rightClick) {
                if (rightClick) {
                    //issueCommand(commands.paintUndo);
                    if (selection.length > 0) {
                        selection.processImages(image => (image.undo(), false));
                        selection.restoreDrawable();
                    } else {
                        log.warn("No images slected to undo");
                    }
                    return;	
                } else {
                    log.warn("UNDO Not yet implemented");
                    return;					
                }
                /*if (localStorage[APPNAME+"_BackupSessionId"] == APP_SESSION_ID || mouse.ctrl) {  // yes truthy used to match sessionId
                    if (localStorage[storage.localStorageNames[1]]) {
                        issueCommand(commands.sysResetAllSilent);
                        storage.loadJSON(storage.localStorageNames[1]);
                    } else {
                        log.warn("There is no backup in local storage");
                    }
                } else {
                    if (localStorage[storage.localStorageNames[1]]) {
                        log.warn("Stored backup session does not match the current session");
                        log.warn("To load the stored backup hold [CTRL] and [LEFT] click undo");
                    }else {
                        log.warn("There is no backup in local storage");
                    }
                }
                return;*/
            }else if (commandId === commands.edSprRedo) {
                log.warn("REDO Not yet implemented");
                //undos.loadRedo();
                return;
            }else if (commandId === commands.edSprUndo || commandId === commands.edSprStoreImage || commandId === commands.edSprRevertImage) {
                log.warn("UNDO Not yet implemented");
                return;				
                if (mouse.ctrl || commandId === commands.edSprStoreImage || commandId === commands.edSprRevertImage) {
                    /*if ((mouse.ctrl && commandId === commands.edSprUndo) || commandId === commands.edSprRevertImage) {
                        selection.eachImage((spr,image) => {
                            if(image.desc.inStore){
                                imageStore.restoreImage(image);
                            }
                        });
                    } else {
                        selection.eachImage((spr,image) => {
                            if(image.isDrawable){
                                imageStore.storeImage(image);
                            }
                        });
                    }*/
                    log.warn("Image store has been removed from PainterV3");
                } else {
                    const restore = [];
                    selection.processImages(image => {
                        if(image.isDrawable){
                            image.undo();
                            restore.push(image);
                            return true;
                        }
                        return false;
                    });
                    restore.forEach(image => image.restore() );
                }
                //sprites.restoreDrawable();
            }else if(commandId === commands.edSprCreateVanish || commandId === commands.edSprCreateVanishB){
                if((mouse.oldButton & 4) === 4){
                    selection.each(spr => {
                        if(spr.type.grid){
                            spr.type.vanish = true;
                            spr.type.grid = false;
                            spr.grid.radial = commandId === commands.edSprCreateVanishB;
                        } else if(spr.type.vanish){
                            spr.grid.radial = commandId === commands.edSprCreateVanishB;
                        }
                    });
                }else{
                    updateWidget = false;
                    const vanish = new Sprite(...utils.viewCenter,256,256,"Vanish grid");
                    vanish.changeToVanish(commandId === commands.edSprCreateVanishB);
                    vanish.gridY = settings.gridSpriteDefaultSteps;
                    addCreatedSprite(vanish);
                }
            }else if(commandId === commands.edSprCreateMarker){
                updateWidget = false;
                const marker = new Sprite(...utils.viewCenter,32,32,"Marker");
                var maxChar = ("A").charCodeAt(0)-1;
                sprites.eachOfType(spr => {
                        if(spr.marker.length === 1) {
                            maxChar = Math.max(spr.marker.charCodeAt(0), maxChar);
                        }
                    },"marker"
                );
                maxChar += 1;
                marker.changeToMarker(String.fromCharCode(maxChar));
                marker.locks.scale = true;
                addCreatedSprite(marker);
            }else if(commandId === commands.edSprCreatePallet){
                if((mouse.oldButton & 4) === 4){
                    if(selection.length === 1 && selection.type.image){
                                 log.warn("LAZY CODER WARNING!!!");
                                 log.warn("This code needs to be finnished");
                        return;
                    }else{
                        log.warn("Select image sprite to get pallet for");
                        return;
                    }
                }
                updateWidget = false;
                const pallet = new Sprite(...utils.viewCenter,16,16,"Pallet");
                pallet.changeToPallet();
                addCreatedSprite(pallet);
            /*}else if(commandId === commands.edSprCreateVector){
                if((mouse.oldButton & 4) === 4){
                    if(selection.length === 1 && selection.type.image){
                                 log.warn("LAZY CODER WARNING!!!");
                                 log.warn("This code needs to be finnished");
                        return;
                    }else{
                        log.warn("????????????????????????");
                        return;
                    }
                }
                updateWidget = false;
                const vector = new Sprite(...utils.viewCenter,256,256,"Vector");
                vector.changeToVector("Vector",[[[-118,-118],[118,-118],[118,118],[-118,118]],[[-108,-108],[108,-108],[108,108],[-108,108]]]);
                addCreatedSprite(vector);*/
            }else if(commandId === commands.edSprCreateGridSprite) {
            }else if(commandId === commands.edSprCreateGrid){
                if((mouse.oldButton & 4) === 4){
                    selection.each(spr => {
                        if(spr.type.vanish){
                            spr.type.vanish = false;
                            spr.type.grid = true;
                        }
                    });
                }else{
                    updateWidget = false;
                    const grid = new Sprite(...utils.viewCenter,256,256,"Grid");
                    grid.changeToGrid();
                    grid.gridY = settings.gridSpriteDefaultSteps;
                    addCreatedSprite(grid);
                }
            }else if(commandId === commands.edSprToggleOutline){
                if(selection.length > 0){
                    var first = ! selection[0].type.hideOutline;
                    selection.setType("hideOutline", first);
                    buttonMap.get(commandId).setSprite(first ? 1 : 0);
                }
            }else if(commandId >= commands.edSprComp0 && commandId <= commands.edSprComp24){
                buttons.groups.setRadio("compMode",commandId);
                selection.setValue("compMode",compModes[commandId - commands.edSprComp0]);
            }else if(
                commandId === commands.edSprAnimImgCopyAdd || commandId === commands.edSprAnimImgAdd ||
                commandId === commands.edSprAnimImgCopyInsert || commandId === commands.edSprAnimImgInsert ||
                commandId === commands.edSprAnimImgCopyReplace || commandId === commands.edSprAnimImgReplace){
                const hasImageAnimation = selection.some(spr => spr.type.image && spr.type.animated && spr.animation.tracks.image);
                if (hasImageAnimation) {

                    const blank = commandId === commands.edSprAnimImgAdd || commandId === commands.edSprAnimImgInsert || commandId === commands.edSprAnimImgReplace ? true : false;
                    if(commandId === commands.edSprAnimImgCopyAdd || commandId === commands.edSprAnimImgAdd ){
                        copySelected(false, false, false, false, false, true, "append keys" , 1, blank)
                    }else if(commandId === commands.edSprAnimImgCopyInsert || commandId === commands.edSprAnimImgInsert){
                        copySelected(false, false, false, false, false, true, "insert key", 1, blank);
                    }else if(commandId === commands.edSprAnimImgCopyReplace || commandId === commands.edSprAnimImgReplace){
                        copySelected(false, false, false, false, false, true, "add key", 1, blank);
                    }

                } else {
                    if(commandId === commands.edSprAnimImgCopyAdd || commandId === commands.edSprAnimImgAdd){
                        log.warn("No selected animated image sprite to append images");
                    }else if(commandId === commands.edSprAnimImgCopyInsert|| commandId === commands.edSprAnimImgInsert){
                        log.warn("No selected animated image sprite to insert images");
                    }else if(commandId === commands.edSprAnimImgCopyReplace || commandId === commands.edSprAnimImgReplace){
                        log.warn("No selected animated image sprite to replace images");
                    }
                }



            }/*else if(commandId === commands.edSprClip || commandId === commands.edSprPad){
                let hasAnimated = false;
                const rightClicked = (mouse.oldButton & 4) === 4;
                selection.eachImage((s, img, i) => {
                    if (!hasAnimated) {
                        sprites.eachOfType(spr => {
                            if (spr.image === img) {
                                if (spr.type.animated) { return hasAnimated = true }
                                if (spr.type.attached && spr.attachedTo.type.animated) { return hasAnimated = true }
                                if (spr.attachers) {
                                    for (const a of spr.attachers.values()) {
                                        if (a.type.animated) {  return hasAnimated = true }
                                    }
                                }
                            }
                        },"image");
                    }
                });
                if (hasAnimated) {
                    if (commandLine.quickMenuOpen()) { log.warn("Clipping animated sprites requiers dialog. Close active dialogs first"); return   }
                    const words = commandId === commands.edSprClip ? ["Clip", "clip", "Clipping"] : ["Pad", "pad", "Padding"];
                    const clipAnimatedImages = buttons.quickMenu( "26 Animated?|Cancel|textCenter A selected sprite contains animations,textCenter " + words[2] + " the image,textCenter may result in undesired changes,textCenter Select an option," +
                        "!" + words[0] + " current frame as is\\?,,,"+
                        "!Backup and " + words[1] + " current frame\\?,,," +
                        "!" + words[0] + " animated as is\\?,,,"+
                        "!Backup and " + words[1] + " animated\\?"
                    );
                    clipAnimatedImages.onclosed = () => {
                        const processFunc = clipAnimatedImages.optionClicked.includes("animated") ? "processAnimatedImages" : "processImages";
                        if(clipAnimatedImages.optionClicked.includes(" as is?")){
                            selection[processFunc]((img, i) => {
                                var amount = (Math.min(img.width, img.height) * 0.25 * 0.5) | 0;
                                if (!amount || rightClicked) { amount = 1 }
                                img.restore(false);
                                const processed = commandId === commands.edSprClip ? localProcessImage.autoClip(img) : localProcessImage.pad(img, 0, amount);
                                sprites.eachOfType(spr => {
                                    if (spr.image === img){  spr.imageResized(true) }
                                },"image");
                                return processed === true;
                            });
                            setTimeout(()=> {
                                issueCommand(commands.edSprUpdateAll);
                                animation.forceUpdate();
                            },0);
						} else if(clipAnimatedImages.optionClicked.includes("Backup and ")){
                            spriteList.saveAll(true).then(() => {
                                selection[processFunc]((img, i) => {
                                    var amount = (Math.min(img.width, img.height) * 0.25 * 0.5) | 0;
                                    if (!amount || rightClicked) { amount = 1 }
                                    img.restore(false);
                                    const processed = commandId === commands.edSprClip ? localProcessImage.autoClip(img) : localProcessImage.pad(img, 0, amount);
                                    sprites.eachOfType(spr => {
                                        if (spr.image === img){  spr.imageResized(true) }
                                    },"image");
                                    return processed === true;
                                });
                                setTimeout(()=> {
                                    issueCommand(commands.edSprUpdateAll);
                                    animation.forceUpdate();
                                },0);
                            });
                        }else{
                            log.warn("" + words[0] + " aborted by user!");
                        }
                    }
                    return;

                } else {

                    selection.processImages((img, i) => {
                        var amount = (Math.min(img.width, img.height) * 0.25 * 0.5) | 0;
                        if (!amount || (mouse.oldButton & 4) === 4) { amount = 1 }
                        img.restore(false);
                        const processed = commandId === commands.edSprClip ? localProcessImage.autoClip(img) : localProcessImage.pad(img, 0, amount);
                        sprites.eachOfType(spr => {
                            if (spr.image === img){  spr.imageResized(true) }
                        },"image");
                        return processed === true;
                    });
                    updateWidget = true;
                    updateLists = true;
                }
            }*/else if(commandId === commands.edSprFill){
                buttonMap.get(commandId).element.style.background = colours.current;
                colours.pendingColorUsed();
                lastFillColUsed.r = colours.mainColor.r;
                lastFillColUsed.g = colours.mainColor.g;
                lastFillColUsed.b = colours.mainColor.b;
                lastFillColUsed.css = colours.mainColor.css;
                selection.each(spr => {
                    if(spr.type.group && !spr.type.openGroup) {
                        spr.group.each(spr => {
                            spr.rgb.fromColor(lastFillColUsed);
                            if (spr.type.attached && spr.attachedTo.type.gradient) {spr.attachedTo.gradient.update = true }
                        });
                    }
                    spr.rgb.fromColor(lastFillColUsed);
                    if(spr.type.shadow) {
                        spr.shadow.rgb.fromColor(lastFillColUsed);
                        if (spr.shadow.type.attached && spr.shadow.attachedTo.type.gradient) {spr.shadow.attachedTo.gradient.update = true }
                    }
                    if (spr.type.attached && spr.attachedTo.type.gradient) {spr.attachedTo.gradient.update = true }
                    sprites.spriteTypeChange(spr);
                });
                API.updateSpriteColor(lastFillColUsed.css, true);
            }else if(commandId === commands.edSprStroke){
                if(colours.alpha === 0){
                    buttonMap.get(commandId).element.style.background = "transparent";
                }else{
                    buttonMap.get(commandId).element.style.background = colours.current;
                }
                selection.each(spr => {
                    if(spr.type.text){
                        if(colours.alpha !== 0) {
                            spr.textInfo.strokeStyle = colours.current;
                        }else{
                            spr.textInfo.strokeStyle = null;
                        }
                    } else if(spr.type.functionLink) {
                        spr.fLink.textColor = colours.alpha === 0 ? settings.functionLinkTextColor : colours.current;
                    }
                });


            } else if(commandId === commands.edSprVideoCapture){
				if(selection.length === 1 && selection[0].type.image && selection[0].image.desc.videoCap) {
					if(selection[0].type.videoCapture) {
						if(!media.videoCapture.busy) {
							let s = media.videoCapture.owner;
							s.type.videoCapture = false;
							s.type.liveCapture = false;
							buttonMap.get(commandId).setSprite(0);
							timeline.getButton(commands.animPlayPause).setSprite(0);
							timeline.getButton(commands.animGotoPrevFrame).setSprite(0);
							timeline.getButton(commands.animGotoNextFrame).setSprite(0);
							timeline.getButton(commands.animStop).setSprite(0);
						} else {
							log.warn("Video capture is busy and can not be stopped");
						}

					} else  if(!selection[0].type.videoCapture) {
						let s = selection[0];
						s.type.liveCapture = true;
						s.type.videoCapture = true;
						media.videoCapture.owner = s;
						media.videoCapture.record();
						buttonMap.get(commandId).setSprite(3);
						timeline.getButton(commands.animPlayPause).setSprite(1);
						timeline.getButton(commands.animGotoPrevFrame).setSprite(1);
						timeline.getButton(commands.animGotoNextFrame).setSprite(1);


						s.addEvent("ondeleting", () => {
							if(media.videoCapture) {
								let s = media.videoCapture.owner;
								s.type.videoCapture = false;
								s.type.liveCapture = false;
								setTimeout(() => {
									timeline.getButton(commands.animPlayPause).setSprite(0);
									timeline.getButton(commands.animGotoPrevFrame).setSprite(0);
									timeline.getButton(commands.animGotoNextFrame).setSprite(0);
									timeline.getButton(commands.animStop).setSprite(0);
									media.videoCapture.owner = undefined;
									API.fireUpdate("update",API)
									//API.fireEvent("update",API)
								},100);
							}
						})
						s = undefined;
						updateLists = true;
					} else {
						log.warn("Selected sprite is not a video capture source.");
					}
				}else {
					if (selection[0].type.image && selection[0].image.desc.videoCap) {
						log.warn("Select one sprite only");
					} else {
						log.warn("Selection must be a video capture source.");
					}
				}

            } else if(commandId === commands.edSprSnapTo){
                if((mouse.oldButton & 4) === 4) {
                    selection.clear();
                    sprites.each(spr => {
                        if(spr.type.snapTo) {  selection.add(spr) }
                    });
                    updateLists = true;
                    updateWidget  = true;

                } else {
                    if(selection.length > 0){
                        var first = ! selection[0].type.snapTo;
                        selection.setType("snapTo",first);
                        buttonMap.get(commandId).setSprite(first ? 1 : 0);
                        updateListsLazy = updateLists = true;
                    }
                }
            } else if(commandId === commands.edSprSmooth){
                if(selection.length > 0){
                    var first = ! selection[0].smoothing;
                    selection.setValue("smoothing",first);
                    buttonMap.get(commandId).setSprite(first ? 1 : 0);
                }
            } else if (commandId === commands.edSpriteHide) {
                selection.each(spr => {spr.hide(true)});
                updateLists = true;
                buttonMap.get(commands.edSpriteToggleShow).setSprite(0);
            } else if (commandId === commands.edSpriteShow) {
                selection.each(spr => spr.hide(false));
                updateLists = true;
                buttonMap.get(commands.edSpriteToggleShow).setSprite(1);
            }else if (commandId === commands.edSprResetRot) {
                if (rightClick) {
                    if (selection.length > 0) {
                        const rotateLocked = !selection[0].locks.rotate;
                        selection.each(spr =>  {spr.locks.rotate = rotateLocked});
                        buttons.groups.setCheck("spriteLocks", commands.edSprResetRot, rotateLocked);
                    }
                } else {
                    timeline.canUpdate = true;
                    selection.markAnimatedForChange();
                    selection.each(spr => spr.resetRotate(true));
                    selection.checkForAnimatedChanges();
                }
            } else if (commandId === commands.edSprResetScale) {

                timeline.canUpdate = true;
                selection.markAnimatedForChange();

                if (mouse.ctrl && (mouse.oldButton & 1) === 1) {
                    selection.each(spr =>  spr.scaleSquare());
                } else if (mouse.ctrl && rightClick) {
                    selection.each(spr =>  spr.resetScale(true, API.snapMode > 1));
                    if (selection.length) {
                        log("Selected sprite rescaled to nearest pixel");
                        if (API.snapMode > 1) { log("and repositioned to align with pixels"); }
                    }
                } else if (rightClick) {
                    if (selection.length > 0) {
                        const scaleLocked = !selection[0].locks.scale;
                        selection.each(spr => { spr.locks.scale = scaleLocked});
                        buttons.groups.setCheck("spriteLocks", commands.edSprResetScale, scaleLocked);
                    }
                } else {
                    selection.each(spr =>  spr.resetScale());
                }
                selection.callIf(spr => spr.type.normalisable, "normalize");
                selection.checkForAnimatedChanges();
            } else if(commandId === commands.edSprAlignCenter ||
                commandId === commands.edSprAlignMid ||
                commandId === commands.edSprAlignTop ||
                commandId === commands.edSprAlignBot ||
                commandId === commands.edSprAlignLeft ||
                commandId === commands.edSprAlignRight) {
                if (sprites.selectingSprite){
                    if(rightClick) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("alignments",-1);
                    keepEnabled.length = 0;
                } else {
                    if (rightClick && (commandId === commands.edSprAlignCenter || commandId === commands.edSprAlignMid)) {
                        let axis = 0, dir = 0;
                        if (commandId === commands.edSprAlignCenter) { axis = 0b010; dir = 2 }
                        else if (commandId === commands.edSprAlignMid) { axis = 0b010; dir = 1  }
                        //else if (commandId === commands.edSprAlignTop) { axis = 0b100; dir = 1  }
                        //else if (commandId === commands.edSprAlignBot) { axis = 0b1; dir = 1  }
                        //else if (commandId === commands.edSprAlignLeft) { axis = 0b1; dir = 2  }
                        //else if (commandId === commands.edSprAlignRight) { axis = 0b100; dir = 2  }
                        keepEnabled[0] = commandId;
                        widget.selectionCallback(alignmentCallback, true, dir, axis);
                        updateWidget = false;
                        spriteRender.highlightColor = settings.highlightSelAlign;
                        buttons.groups.setRadio("alignments",commandId);

                    } else {
                        if(commandId === commands.edSprAlignMid) { selection.align("middle", (mouse.oldButton & 4) === 4) }
                        else if(commandId === commands.edSprAlignCenter) { selection.align("center", (mouse.oldButton & 4) === 4) }
                        else if(commandId === commands.edSprAlignTop) { selection.align("top", (mouse.oldButton & 4) === 4, false, undefined, mouse.ctrl === true) }
                        else if(commandId === commands.edSprAlignBot) { selection.align("bottom", (mouse.oldButton & 4) === 4, false, undefined, mouse.ctrl === true) }
                        else if(commandId === commands.edSprAlignLeft) { selection.align("left", (mouse.oldButton & 4) === 4, false, undefined, mouse.ctrl === true) }
                        else if(commandId === commands.edSprAlignRight) { selection.align("right", (mouse.oldButton & 4) === 4, false, undefined, mouse.ctrl === true) }

                    }
                }
            } else if(commandId === commands.edSprAlignRotate) {
                if(sprites.selectingSprite){
                    if (rightClick) {
                        widget.specialSelectionOption();
                        return;
                    } else {
                        widget.specialSelectionSelect(true);
                        buttons.groups.setRadio("alignRotate",-1);
                        keepEnabled.length = 0;
                    }
                }else{
                    keepEnabled[0] = commands.edSprAlignRotate;
                    widget.selectionCallback(alignRotateCallback, true);
                    updateWidget = false;
                    spriteRender.highlightColor = settings.highlightSelAlign;
                    buttons.groups.setRadio("alignRotate",commands.edSprAlignRotate);
                }
            } else if(commandId === commands.edSpriteToggleLookAt) {
                if(sprites.selectingSprite){
                    if(rightClick) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("lookatselect",-1);
                    keepEnabled.length = 0;
                }else{
                    keepEnabled[0] = commands.edSpriteToggleLookAt;
                    widget.selectionCallback(alignLookatCallback);
                    updateWidget = false;
                    spriteRender.highlightColor = settings.highlightSelLookat;
                    buttons.groups.setRadio("lookatselect",commands.edSpriteToggleLookAt);
                    /*if(settings.help){
                        log("Select sprite for selected sprites to lookat.");
                        log("Sprites look along the ccenter X axis");
                    }*/
                }
            } else if(commandId === commands.edSprJoinCompoundShape) {  // not in UI atm
                if(sprites.selectingSprite){
                    if(rightClick) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    keepEnabled.length = 0;
                }else{
                    widget.selectionCallback(joinCompoundShapeCallback);
                    updateWidget = false;
                    spriteRender.highlightColor = settings.highlightSelAttach;
                }
            } else if(commandId === commands.edSpriteAttachFuncInput) {
                if(sprites.selectingSprite){
                    if(rightClick) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                }else{
                    let isSafe = true;
                    selection.each(spr => {
                        if(!spr.type.functionLink) { isSafe = false; return true }
                    });
                    if(isSafe) {
                        widget.selectionCallback(bindFuncInput, false);
                        updateWidget = false;
                        spriteRender.highlightColor = settings.highlightSelInput;
                    }else{
                        log.warn("Must have only function linker sprites selected");
                    }
                }
            } else if(commandId === commands.edSpriteAttachFuncOutput) {

                if(sprites.selectingSprite){
                    if(rightClick) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                }else{
                    let isSafe = true;
                    selection.each(spr => {
                        if(!spr.type.functionLink) { isSafe = false; return true }
                    });
                    if(isSafe) {
                        widget.selectionCallback(bindFuncOutput, false);
                        updateWidget = false;
                        spriteRender.highlightColor = settings.highlightSelOutput;
                    }else{
                        log.warn("Must have only function linker sprites selected");
                    }
                }
            } else if(commandId === commands.edSpriteActivateFunctionLinks) {
                sprites.functionLinksOn = true;
                fireUpdate = true;

            }  else if(commandId === commands.edSpriteDeActivateFunctionLinks) {
                fireUpdate = true;
                sprites.functionLinksOn = false;

            }  else if(commandId === commands.edSpriteSyncFunctionLinks) {
                fireUpdate = true;
                sprites.functionLinksAnimated = true;

            }  else if(commandId === commands.edSpriteFreeSyncFunctionLinks) {
                fireUpdate = true;
                sprites.functionLinksAnimated = false;

            } else if(commandId === commands.edSpriteAddLocator) {
                if(sprites.selectingSprite){
                    if(rightClick) { cancelSelecting = true; }
                    widget.specialSelectionSelect(true);
                    buttons.groups.setRadio("attachToLocator",-1);
                    keepEnabled.length = 0;
                }else{
                    keepEnabled[0] = commands.edSpriteAddLocator;
                    widget.selectionCallback(bindLocatorCallback);
                    updateWidget = false;
                    spriteRender.highlightColor = settings.highlightSelLocate;
                    buttons.groups.setRadio("attachToLocator",commands.edSpriteToggleAttachTo);
                    /*if(settings.help){
                        log("Select sprite to bind pixel position to.");
                        log("Select existing bound sprite to remove it.");
                    }*/
                }
            }else if(commandId === commands.edSprOrderFunctionLinks) { sprites.sortFunctionLinks(); updateLists = true; updateWidget = false }
            else if(commandId === commands.edSprSpaceHor) {
                if (mouse.ctrl) { selection.align("horBox", (mouse.oldButton & 4) === 4, mouse.shift) }
                else { selection.align("horSpace", (mouse.oldButton & 4) === 4,  mouse.shift) }
            } else if(commandId === commands.edSprSpaceVer) {
                if (mouse.ctrl) { selection.align("verBox", (mouse.oldButton & 4) === 4, mouse.shift) }
                else { selection.align("verSpace", (mouse.oldButton & 4) === 4, mouse.shift) }
            }  else if(commandId === commands.edSprResetView || commandId === commands.edSprResetViewFit){
                if(selection.length === 0){
                    view.scale = 1;
                    view.position = {x : 0, y : 0};
                    view.movePos(view.width / 2 | 0, view.height / 2 | 0);
                    view.rotate = 0;
                }else{
                    view.scale = 1;
                    const extent = selection.getExtent();
                    view.position = {x : -extent.x, y :  -extent.y};
                    view.movePos((view.width / 2 | 0) - (extent.w / 2 | 0), (view.height / 2 | 0)  - (extent.h / 2 | 0));
                    if(commandId === commands.edSprResetViewFit){
                        var min = Math.min(view.width/extent.w, view.height / extent.h);
                        view.scaleAt(
                            view.width / 2 | 0,
                            view.height / 2 | 0,
                            min * 1,
                        );
                    }
                }
                updateWidget = false;
            }else if(commandId === commands.testButton){
                log("Test button clicked");
                function closeDialog(){
                    pannel = undefined;
                    colHandler.close();
                    colHandler = undefined;
                    log("Test color dialog closed");
                }
                var pannel = buttons.FloatingPannel($("#floatingContainer")[0],{title : "Shadow filter", width : 13*16, onclosing : closeDialog});
                buttons.create([
                        { x : 0, y : 0, w : 3, h : 1, command : commands.displayOnly,text : "X pos"},
                        { x : 3, y : 0, w : 10, h : 1, command : commands.edSprAlpha, slider : {color : "black", min : -255, max : 255, step : 1,wStep : 8, value : 0 }},
                        { x : 0, y : 1, w : 3, h : 1, command : commands.displayOnly,text : "Y pos"},
                        { x : 3, y : 1, w : 10, h : 1, command : commands.edSprAlpha, slider : {color : "black", min : -255, max : 255, step : 1,wStep : 8, value : 0 }},
                        { x : 0, y : 2, w : 3, h : 1, command : commands.displayOnly,text : "Blur"},
                        { x : 3, y : 2, w : 10, h : 1, command : commands.edSprAlpha, slider : {color : "black", min : 0, max : 255, step : 1,wStep : 8, value : 0 }},
                    ],
                    {
                        pannel : pannel,
                        size : 16,
                    }
                );
                var colHandler = colours.addColorUIToPannel(pannel,3,13)
            }
            if(updateWidget) {
                widget.update()
            }
            if(updateLists) {
                sprites.cleanup();
                if(updateListsLazy) { spriteList.updateInfo() }
                else { spriteList.update(scrollSpriteToView) }
                guides.update();
            }
            if(fireUpdate){ API.fireUpdate(); }
        },
        get isUndoable() { return undoable },
        set undoable(v) { undos.undoable = undoable = true },
        fireUpdate() {
            API.fireEvent("update",API);
            if (undoable) {
                /*clearTimeout(undoableDebounceHdl);
                undoableDebounceHdl = setTimeout(() => {
                    undoable = false;
                    API.fireEvent("undoable",API);
                }, 500);*/
            }
        },
        updateSpriteColor(newCol, force) {
            const sprFill = buttonMap.get(commands.edSprFill);
            if(force === true) {
                sprFill.enable();
                sprFill.element.textContent = "";
                sprFill.element.style.background = newCol.css;
            }else if(!sprFill.element.disabled && sprFill.element.textContent !== "X" && sprFill.element.style.background !== "transparent") {
                sprFill.element.style.background = newCol.css;
            }
        },
        setButtonStatus(enableList,disableList){
            if(disableList){
                for(const command of disableList){ buttonMap.get(command).disable(command) }
            }
            if(enableList){
                for(const command of enableList){ buttonMap.get(command).enable(command) }
            }
        },
        setButtons(buts){
            for (const but of buts){
                buttonMap.set(but.command, but);
                buttons.eachCommandFor(cmdId => buttonMap.set(cmdId, but), but);
            }
            return buts;
        },
        update(){
            unloadWarning = true;
            if(selection.length === 0){
                API.setButtonStatus(null,noSelectList);
                API.setButtonStatus(null,imageOnlyList);
                API.setButtonStatus(null,cutterOnlyList);
                API.setButtonStatus(null,drawableOnlyList);
                API.setButtonStatus(null,drawingModeDisable);
                API.setButtonStatus(keepEnabled);
                lastSel = false;
            }else{
                var compMode;
                var smoothing, smoothingOff;
                var snapTo, snapToOff;
                var liveCapture, liveCaptureOff,videoCapture;
                var pattern, patternOff;
                var gradient, gradientOff;
                var gradientLinear, gradientLinearOff;
                var gradientRadial, gradientRadialOff;
                var fillCol, fillColOff;
                var strokeCol, strokeColOff;
                var attachedRotate, attachedRotateOff;
                var inheritScale, inheritScaleOff;
                var isColorSrc, isColorSrcActive = false;
                var attachedScalePos, attachedScalePosOff,localXYPositionLocks,localXYPositionLocksOff;
                var lockUIOff, lockUI, scaleLockOff, scaleLock, rotateLockOff, rotateLock;
                var hiddenOff, hidden;
                var renderable, renderableOff;
                var outlineOff, outline;
                var hasImage = false;
                var hasCutter = false;
                var hasDrawable = false;
                var isAttached = false;
                var hasAttached = false;
                var isLocator = false;
                var hasLocators = false;
                var isCompoundShape = false;
                var hasLookats = false;
                var isLookat = false;
                var hasLinkers = false;
                var isLinked = false;
				var subSprites = false;
                var normalisableCount = 0;

                var minAlpha = Infinity;
                var maxAlpha = -Infinity;
                selection.each(spr => {
                    minAlpha = Math.min(minAlpha,spr.a);
                    maxAlpha = Math.max(maxAlpha,spr.a);
                    if(spr.type.snapTo) { snapTo = true }
                    else  { snapToOff = true }
                    if(spr.type.hasLocators || spr.locates) {
                        hasLocators = true;
                        const sprs = spr.locates ? spr.locates : [spr];
                        for(const s of sprs) {
                            const l = s.locators;
                            if(inheritScale === undefined) {
                                inheritScale = (l.scaleX ? 1 : 0);
                                inheritScale += (l.scaleY ? 2 : 0);
                            }else {
                                if(inheritScale !== (l.scaleX ? 1 : 0) + (l.scaleY ? 2 : 0)){
                                    inheritScaleOff = true;
                                }
                            }
                        }
                    }


                    if((spr.type.shape && spr.shape.isCompound) || spr.type.compoundShape) { isCompoundShape = true }
                    if(spr.attachers) {  hasAttached = true }
                    if(spr.locates) {  isLocator = true }
                    if(spr.lookers) { hasLookats = true }
                    if(spr.linkers) { hasLinkers = true }
                    if(spr.type.linked) { isLinked = true }
                    if(spr.type.lookat) { isLookat = true }
                    if(fillCol === undefined){
                        fillCol = spr.rgb.css;
                    }else if(fillCol !== spr.rgb.css){
                        fillColOff = true;
                    }
                    if(spr.type.attached) {
                        isAttached = true;
                        const a = spr.attachment;
                        if(attachedRotate === undefined){
                            attachedRotate = a.inheritRotate;
                            if(inheritScale === undefined) {
                                inheritScale = (a.inheritScaleX ? 1 : 0);
                                inheritScale += (a.inheritScaleY ? 2 : 0);
                            }else{
                                 if(inheritScale !== (a.inheritScaleX ? 1 : 0) + (a.inheritScaleY ? 2 : 0)){
                                    inheritScaleOff = true;
                                }
                            }
                            attachedScalePos = a.scaleAttachX ? 3 : 0;
                        }else{
                            if(attachedRotate !== a.inheritRotate){
                                attachedRotateOff = true;
                            }
                            if(inheritScale !== (a.inheritScaleX ? 1 : 0) + (a.inheritScaleY ? 2 : 0)){
                                inheritScaleOff = true;
                            }
                            if(attachedScalePos !== a.scaleAttachX ? 3 : 0){
                                attachedScalePosOff = true;
                            }
                        }
                        if(spr.attachedTo.type.normalisable) { normalisableCount ++ }
                    }
                    if(spr.locks.locX ||  spr.locks.locY){
                        localXYPositionLocksOff = false;
                        localXYPositionLocks = (spr.locks.locX ? 1 : 0);
                        localXYPositionLocks += (spr.locks.locY ? 2 : 0);
                    }else {
                        localXYPositionLocksOff = true;
                        localXYPositionLocks = 0;
                    }
                    if(spr.locks.UI) { lockUI = true }
                    else { lockUIOff = true }
                    if (spr.type.renderable) { renderable = true }
                    else { renderableOff = true }
                    if (spr.type.hidden) { hidden = true }
                    else { hiddenOff = true }
                    
                    if (spr.type.hideOutline) { outline = true }
                    else { outlineOff = true }
                    if (spr.locks.scale) { scaleLock = true }
                    else { scaleLockOff = false }
                    if (spr.locks.rotate) { rotateLock = true }
                    else { rotateLockOff = false }
                    if (spr.type.renderable) {
                        hasImage = true;
                        if (compMode === undefined){ compMode = spr.compMode }
                        else if(compMode!== null && compMode !== spr.compMode) { compMode = null; }
                        
                    }
                    if(spr.type.penColorSrc) {
                        isColorSrc = true;
                        isColorSrcActive = true;
                    }
                    if (spr.type.gradient) {
                        hasImage = true;
                        if (compMode === undefined){ compMode = spr.compMode }
                        else if (compMode!== null && compMode !== spr.compMode) { compMode = null; }                        
                    }
                    if (spr.type.image) {
                        if (spr.image.isDrawable) {
                            hasDrawable = true;
                            if(pens.colorSource === spr.guid) { isColorSrc = true; }

                        }

                        if(spr.image.desc && spr.image.desc.sprites) { subSprites = true }
                        if(spr.type.videoCappture) { videoCapture = true }
                        hasImage = true;
                        if(compMode === undefined){
                            compMode = spr.compMode
                        }else if(compMode!== null && compMode !== spr.compMode) {
                            compMode = null;
                        }
                        if(spr.smoothing) { smoothing = true }
                        else  { smoothingOff = true }
                        if(spr.type.pattern) { pattern = true }
                        else  { patternOff = true }
                        if(spr.type.liveCapture) { liveCapture = true }
                        else  { liveCaptureOff = true }
                    } else if (spr.type.shape){
                        if(spr.type.usingPattern) { pattern = true }
                        else  { patternOff = true }
                    } else if (spr.type.cutter){
                        hasCutter = true;
                        if(spr.type.gradient) {
                            gradient = true;
                            if(spr.gradient.type === 0) {
                                gradientLinear = true;
                                gradientRadialOff = true;
                            } else if(spr.gradient.type === 1) {
                                gradientLinearOff = true;
                                gradientRadial = true;
                            }
                        } else  { gradientOff = true }

                        if(spr.type.usingPattern) { pattern = true }
                        else  { patternOff = true }
                    }else if(spr.type.text){
                        hasImage = true;
                        if(fillCol === undefined){
                            fillCol = spr.textInfo.fillStyle;
                        }else if(fillCol !== spr.textInfo.fillStyle){
                            fillColOff = true;
                        }
                        if(strokeCol === undefined){
                            strokeCol = spr.textInfo.strokeStyle;
                        }else if(strokeCol !== spr.textInfo.strokeStyle){
                            strokeColOff = true;
                        }
                        if(spr.type.usingPattern) { pattern = true }
                        else  { patternOff = true }
                    }else if(spr.type.functionLink) {
                        if(strokeCol === undefined){
                            strokeCol = spr.fLink.textColor;
                        }else if(strokeCol !== spr.fLink.textColor){
                            strokeColOff = true;
                        }
                    }


                })
                API.setButtonStatus(noSelectList);
                if (hasImage) { API.setButtonStatus(imageOnlyList) }
                else { API.setButtonStatus(null, imageOnlyList) }
                if (hasCutter) { API.setButtonStatus(cutterOnlyList) }
                else { API.setButtonStatus(null, cutterOnlyList) }
                if (hasDrawable) { API.setButtonStatus(drawableOnlyList) }
                else { API.setButtonStatus(null, drawableOnlyList) }
                if (isAttached || hasLocators) { API.setButtonStatus(attachedOnlyList) }
                else { API.setButtonStatus(null, attachedOnlyList) }
                if (isLocator || isAttached || isLookat || isLinked || hasLinkers || hasAttached || hasLocators || hasLookats || isCompoundShape) { API.setButtonStatus(partOfTreeOnlyList) }
                else { API.setButtonStatus(null, partOfTreeOnlyList) }


                lastSel = true;
                noUpdate = true;
                if(compMode){
                    const idx = compModes.indexOf(compMode);
                    buttons.groups.setRadio("compMode",commands.edSprComp0 + idx );
                }else{
                    buttons.groups.setRadio("compMode",-1);
                }
                const setTriState = (commandId, hasOn, hasOff, useSprOrGroup, ...states) => {
                    if(useSprOrGroup === true) {
                        if (hasOn && hasOff) { buttonMap.get(commandId).setSprite(states[0]) }
                        else { buttonMap.get(commandId).setSprite( hasOn ? states[1] : states[2]) }
                    } else {
                        if (hasOn && hasOff) { buttons.groups.setCheck(useSprOrGroup, commandId, true, states[0] ? states[0] : undefined) }
                        else { buttons.groups.setCheck(useSprOrGroup, commandId, hasOn) }
                    }
                };
                buttonMap.get(commands.edSprToggleSpriteAsPaintSrc).setSprite( isColorSrc ? (isColorSrcActive ? 2 : 1) : 0);
                setTriState(commands.edSprSmooth, smoothing, smoothingOff,true, 2,1,0);
                setTriState(commands.edSprSnapTo, snapTo, snapToOff,true, 2,1,0);
                if(videoCapture) {
                    buttonMap.get(commands.edSprToggleSpriteAsPaintSrc).setSprite( 3);
                }else{
                    setTriState(commands.edSprLiveCapture, liveCapture, liveCaptureOff,true, 2,1,0);
                }
                if (hasImage && spriteRender.captureCount) { buttonMap.get(commands.edSprCaptureSource).enable(commands.edSprCaptureSource) }
                else { buttonMap.get(commands.edSprCaptureSource).disable(commands.edSprCaptureSource) }
                if(pattern || gradient || gradientOff || patternOff){
                    if (!pattern && gradient) {
                        if (gradientLinear && !gradientLinearOff) {
                            buttonMap.get(commands.edSprPattern).setSprite(3);
                        } else if (gradientRadial && !gradientRadialOff) {
                            buttonMap.get(commands.edSprPattern).setSprite(4);
                        }
                    } else {
                        setTriState(commands.edSprPattern, pattern, patternOff,true, 2,1,0);
                    }
                }else{
                     buttonMap.get(commands.edSprPattern).setSprite(0);
                     buttonMap.get(commands.edSprPattern).disable();
                }
				if(subSprites) {
					buttonMap.get(commands.edSprNextSubSprite).enable();
					buttonMap.get(commands.edSprPrevSubSprite).enable();
				}else{
					buttonMap.get(commands.edSprNextSubSprite).disable();
					buttonMap.get(commands.edSprPrevSubSprite).disable();
				}

                setTriState(commands.edSprResetRot, rotateLock, rotateLockOff, "spriteLocks", "radioOnDark");
                setTriState(commands.edSprResetScale, scaleLock, scaleLockOff, "spriteLocks", "radioOnDark");
                setTriState(commands.edSprToggleOutline, outline, outlineOff,true, 2,1,0);
                setTriState(commands.edSprLockUI, lockUI, lockUIOff, true, 2,1,0);
                setTriState(commands.edSpriteToggleShow, hidden, hiddenOff, true, 2,1,0);
                setTriState(commands.edSpriteHideFromRenderToggle, renderable, renderableOff, true, 2,0,1);

                const sprFill = buttonMap.get(commands.edSprFill);
                if(fillCol !== undefined && fillColOff){
                    sprFill.enable();
                    sprFill.element.style.background = "transparent";
                    sprFill.element.textContent = "X";
                }else if(fillCol !== undefined){
                    sprFill.enable();
                    if(fillCol === null){
                        sprFill.element.style.background = "transparent";
                    }else{
                        sprFill.element.style.background = fillCol;
                        if(!editSprites.drawingModeOn) {
                            const col = utils.CSS2RGB(fillCol);
                            colours.setColor(col.r, col.g, col.b);
                        }
                    }
                    sprFill.element.textContent = "";
                }else{
                    sprFill.element.style.background = lastFillColUsed.css;
                    sprFill.disable();
                }
                if(strokeCol  !== undefined && strokeColOff){
                    buttonMap.get(commands.edSprStroke).enable();
                    buttonMap.get(commands.edSprStroke).element.style.background = "transparent";
                    buttonMap.get(commands.edSprStroke).element.textContent = "X";
                }else if(strokeCol  !== undefined){
                    buttonMap.get(commands.edSprStroke).enable();
                    if(strokeCol === null){
                        buttonMap.get(commands.edSprStroke).element.style.background = "transparent";
                    }else{
                        buttonMap.get(commands.edSprStroke).element.style.background = strokeCol;
                    }
                    buttonMap.get(commands.edSprStroke).element.textContent = "";
                }else{
                    buttonMap.get(commands.edSprStroke).disable();
                }
                if(isAttached || hasLocators) {
                    if(attachedRotateOff) {
                        buttonMap.get(commands.edSpriteToggleAttachRotate).setSprite(2);
                    }else{
                        buttonMap.get(commands.edSpriteToggleAttachRotate).setSprite(attachedRotate?0:1);
                    }
                    if(inheritScaleOff) {
                        buttonMap.get(commands.edSpriteToggleAttachScale).setSprite(5);
                    }else{
                        buttonMap.get(commands.edSpriteToggleAttachScale).setSprite(inheritScale);
                    }
                    if(attachedScalePosOff) {
                        buttonMap.get(commands.edSpriteToggleAttachmentScale).setSprite(5);
                    }else{
                        buttonMap.get(commands.edSpriteToggleAttachmentScale).setSprite(attachedScalePos);
                    }
                }
                if(localXYPositionLocksOff) {
                    buttonMap.get(commands.edSpriteToggleXYPositionLocks).setSprite(5);
                }else{
                    buttonMap.get(commands.edSpriteToggleXYPositionLocks).setSprite(localXYPositionLocks);
                }
                buttonMap.get(commands.edSprAlpha).slider.value = ((minAlpha + maxAlpha) / 2) * 255 | 0;
                buttonMap.get(commands.edSprAlpha).element.updateValue();
                noUpdate = false;
                if(API.drawingMode){
                    API.setButtonStatus(null,drawingModeDisable);
                }else{
                    API.setButtonStatus(drawingModeDisable);
                }
                API.setButtonStatus(keepEnabled);
                if(sprites.length === 1) {
                    buttonMap.get(commands.edSpriteToggleLookAt).disable();
                    buttonMap.get(commands.edSpriteToggleAttachTo).disable();
                    buttonMap.get(commands.edSpriteAddLocator).disable();
                }
                if (normalisableCount === selection.length) {
                    API.setButtonStatus(null,normalisableHideList);
                }
                if (mainCanvas.ctx.useViewSprite() || grid.hasError) {
                    buttonMap.get(commands.edSprShowGrid).disable();
                } else {
                    buttonMap.get(commands.edSprShowGrid).enable();
                }

            }
            //API.fireEvent("update",API);
            API.fireUpdate();
        }
    };
    var lastSel = false;
    Object.assign(API, Events(API));
    selection.addEvent("change", API.update)
    return API;
})()