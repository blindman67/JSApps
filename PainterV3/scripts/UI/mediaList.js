"use strict";
const mediaList = (()=>{
    const buttonMap = new Map();
    const items = [];
    const updateFlags = {
        canSave: false,
        canMakeDrawable: false,
        canSendToImageZoom: false,
        clear() {
            updateFlags.canSave = false;
            updateFlags.canMakeDrawable = false;
            updateFlags.canSendToImageZoom = false;
        },
    };
    var index = 0;
    var listElement;
    var tabElement;
    var flasher;
    var index;
    var lastIdxClicked = -1;
    var imageZoomAvailable = false;
    var mediaSelected = Object.assign([],{
        each(cb) { index = 0; for (const media of this) { if( cb(media, index++) === true ) { return --index  } } },
        contains(media) { return this.each(m => media=== m) !== undefined },
        clear() {
            mediaSelected.each(media => media.selected = false);
            mediaSelected.length = 0;
        },
        cleanup() {
            var i = 0;
            while(i < this.length) {
                if(API.indexOf(this[i]) === undefined) {
                    this[i].selected = false;
                    this[i].selectOrder = null;
                    this.splice(i--, 1);
                }
                i++;
            }
        },
		replace(oldMedia, newMedia) {
			const idx = this.indexOf(oldMedia);
			if(idx > -1) {
				this[idx] = newMedia;
				newMedia.selected = true;
				newMedia.selectOrder = idx;
			}
		},
        add(media) {
            if(!this.contains(media)){
                this.push(media);
                media.selected = true;
                media.selectOrder = this.length;
            }
            return this;
        },
        remove(media) {
            if(this.contains(media)){
                media.selected = false;
                media.selectOrder = null;
                this.splice(index, 1);
                this.each((media, idx) => media.selectOrder = idx + 1 );
            }
            return this;
        },
    });
    function mouseInOut(event) {
        var target = event.target;
        if(target.listItem && target.listItem.media && event.target.listItem.media.desc) {
            event.target.listItem.media.desc.highlight = event.type === "mouseover";
            if (event.type === "mouseover") {
                infoPannel.show(infoPannel.displayTypes.media, event.target.listItem.media);
            } else {
                infoPannel.hide();
            }
        }
    }
    var findTopSelect = false;
    var topSelect;
    var editingNameListItem, editingName, renameList = [];;
    function updateItem(listItem, idx) {
        const media = listItem.media;
        const element = listItem.element;
        if(media.helpString){ element.title = media.helpString() }
        else { element.title = "Cllick to select\n[Right] click add/remove from selected\n[CTRL][LEFT] click to edit name\n[Shift] click to select range" }
        const idxPos = (isNaN(media.selectOrder) || media.selectOrder === null || !media.selected) ? "" : " " + (media.selectOrder);
        element.textContent = media.desc ? media.desc.toString() +  idxPos : "Bad media!";
        if(media.selected){
            element.classList.add("itemSelected");
            if(media.desc) { updateFlags.canSave = true }
        } else { element.classList.remove("itemSelected") }
        if(selection.hasMedia(media)){element.classList.add("itemSelectedUsed") }
        else { element.classList.remove("itemSelectedUsed") }
        if(media.desc && media.desc.dirty) { element.classList.add("itemDirty") }
        else {
            element.classList.remove("itemDirty");
            updateFlags.canSendToImageZoom = true;
        }
        if (media.tainted) { element.classList.toggle("itemTainted", media.tainted) }
        if(findTopSelect) {
            if(media.selected) {
                topSelect = element;
                findTopSelect = false;
            }
        }
        if(!media.isDrawable && !media.desc.video && !media.vector){
            updateFlags.canMakeDrawable = true;
        }
    }
    const API = {
        updateItemNameComplete(status) {
            var restoreOld = false;
            var newName;
            if(status === "rejected" || editingNameListItem.media.desc.name.trim() === "") {
                restoreOld = true;
                !(status === "rejected") && setTimeout(()=>log.warn("Blank name rejected."), 100);
            }else{
                newName = editingNameListItem.media.desc.name.trim();
                newName = newName[0] === "*" ? newName.slice(1) : newName;
                newName = newName[newName.length - 1] === "*" ? newName.slice(0, newName.length - 1) : newName;
            }
            renameList.forEach(lItem => {
                if (restoreOld) {
                    lItem.media.desc.name = lItem.media.desc.oldName;
                } else {
                    lItem.media.desc.name = NAMES.register(newName);
                    lItem.media.desc.dirty = true;
                    lItem.media.lastAction = "Name changed";
                }
                lItem.element.classList.remove("itemEditingText");
                lItem.media.desc.oldName = undefined;
                updateItem(lItem);
                /*if(editingNameListItem.media.desc.frame !== undefined) {
                    const editName = editingName.replace(/_F[0-9]+$/,"");
                    const newName = editingNameListItem.media.desc.name.trim().replace(/_F[0-9]+$/,"");
                    editingNameListItem.media.desc.name = editingName;
                    API.each(mediaItem => {
                        var oldName = mediaItem.media.desc.name.replace(/_F[0-9]+$/,"");
                        if(oldName === editName) {
                            mediaItem.media.desc.name = newName + "_F" + mediaItem.media.desc.frame; //mediaItem.media.desc.name.replace(editName, newName);
                            mediaItem.media.desc.dirty = true;
                            mediaItem.media.lastAction = "Name changed";
                            updateItem(mediaItem);
                        }
                    });
                }*/
            });
            renameList.length = 0;
            editingNameListItem = undefined;
        },
        updateItemName() {
            const newName = editingNameListItem.media.desc.name = commandLine();
            updateItem(editingNameListItem);
            editingNameListItem.element.classList.add("itemEditingText");
            renameList.forEach(lItem => {
                if (lItem !== editingNameListItem) {
                    lItem.media.desc.name = newName;
                    lItem.element.classList.add("itemEditingText");
                    updateItem(lItem);
                }
            });
        },
        mediaSelected,  // this name has deprciated and will be removed when I know it to be safe to remove. use mediaList.selected
        selected: mediaSelected,
        get length() { return items.length },
        each(cb, i = 0){
            index = i;
            for(const m of items) { if( cb(m, index++) === true ) { return --index } }
        },
        eachSelected(cb, i = 0){
            index = i;
            for(const m of mediaSelected) { if( cb(m, index++) === true ) { return --index } }
        },
        indexOf(media) {
            var i = 0;
            for(i = 0; i < items.length; i ++){
                if(media === items[i].media) {
                    return i;
                }
            }
        },
        indexOfByGUID(media) {
            var i = 0;
			const guid = typeof media === "number" ? media : media.guid;
            for(i = 0; i < items.length; i ++){
                if(guid === items[i].media.guid) {
                    return i;
                }
            }
        },
		listItemByIndex(idx) {
			if(idx >= 0 && idx < items.length) {
				return items[idx];
			}
		},
        ready(pannel) {
            tabElement = pannel.titleElement;
            flasher = elementFlasher(tabElement, {newItem : "tabFlashNew"});
            listElement = buttonMap.get(commands.media).element;
            ["mouseover","mouseout"].forEach(name => buttonMap.get(commands.media).element.addEventListener(name,mouseInOut,{passive:true}))
            API.update();
            API.updateForCutBuffer();
        },
        commands: {
            [commands.mediaSavePng]() {
                mediaSelected.each(m => {
					if(m.save) { m.save() }
					else{
						var desc = m.desc;
						m.desc = undefined;
						if (!saveImage(m, desc.name,"png")) { log.warn("Could not save media '" + desc.name + "'") }
						else {
							desc.dirty = false;
							m.lastAction = "as PNG";
						}
						m.desc = desc;
					}
                });
                setTimeout(()=>API.update(), 100);
                return false;
            },
            [commands.spritesToDrawable]() {
                mediaSelected.each(m => {
                    if (!m.isDrawable && !m.desc.video && !m.desc.vector) {
                        var newM = media.toDrawable(m);
                        sprites.each(s => {
                            if (s.type.image) {
                                if (s.image === m) {  s.image = newM }
                                if (s.type.animated && s.animation.tracks.image) {
                                    s.animation.tracks.image.eachKey(imgKey => {
                                        if (imgKey.value === m) { imgKey.value = newM }
                                    });
                                }
                                if (s.type.imgSequence) {
                                    let i = 0;
                                    while (i < s.imgSequence.length) {
                                        if (s.imgSequence[i] === m) { s.imgSequence[i] === newM }
                                        i++
                                    }
                                }
                            }
                        });
						mediaSelected.replace(m, newM);
                        var mItem = mediaList.getMediaItem(m);
                        mItem.media = newM;
                        mItem.element.textContent = mItem.media.desc.toString();
                    }
                });
                issueCommand(commands.edSprUpdateUI);
            },
            [commands.mediaSaveJpg](event, leftClicked, rightClicked) {
                mediaSelected.each(media => {
                    var desc = media.desc;
                    media.desc = undefined;
                    if (!saveImage(media, desc.name, "jpeg", settings.JPEG_Save_Quality)) { log.warn("Could not save media '" + desc.name + "'") }
                    else {
                        desc.dirty = false;
                        media.lastAction = "as JPEG";
                    }
                    media.desc = desc;
                });
                setTimeout(()=>API.update(), 100);
                return false;
            },
            [commands.mediaSelectFromSelected](event, leftClicked, rightClicked) {
                let scrollToSel = false;
                if(rightClicked) {
                    selection.clear();
                    mediaSelected.each(m => {
                        sprites.eachOfType(spr => {
                                if(spr.image.guid === m.guid) { selection.add(spr) }
                            },"image"
                        );
                    })
                }else{
                    mediaSelected.clear();
                    selection.eachOfType(spr => {
                        if (spr.type.animated && spr.animation.tracks.image && !spr.type.subSprite) {
                            spr.animation.tracks.image.eachKey(key => mediaSelected.add(key.value));
                        } else { mediaSelected.add(spr.image) }
                    },"image" );
                    selection.eachOfType(spr => { mediaSelected.add(spr.vector) },"vector" );
                    scrollToSel = findTopSelect = true;
                }
                API.update();
                if(scrollToSel) {
                    if (findTopSelect) { findTopSelect = false }
                    else { topSelect.scrollIntoView() }
                }
                return false;
            },
            [commands.mediaCutBufferUpdate]() {
                API.updateForCutBuffer();
            },
            [commands.mediaSetToCutBuffer](e, left, right) {
                mediaSelected.each(media => {
                    cutBuffer.fromMedia(media);
                    if (right) {
                        cutBuffer.createPattern();
                        log.info("Added media '" + media.desc.toString() + "' to cut & pattern buffer");
                    } else {
                        log.info("Added media '" + media.desc.toString() + "' to cut buffer");
                    }
                    return true;
                });
            },
            [commands.mediaGetFromCutBuffer](e, left, right) {
                if(cutBuffer.hasContent){
                    if (right) {
                        if (cutBuffer.hasPattern) { cutBuffer.patternToMedia() }
                        else { log.warn("Not pattern defined to add to media") }
                    } else {
                        cutBuffer.copyToMedia()
                    }
                }
            },
            [commands.mediaImageToClipboard](e, left, right) {
                if (mediaSelected.length === 1 && CanDo.clipboard) {
                    if (mediaSelected[0].isDrawable) {
                        if (mediaSelected[0].toBlob) {
                            mediaSelected[0].toBlob((blob) => {
                                const data = [new ClipboardItem({ [blob.type]: blob })];
                                navigator.clipboard.write(data).then(
                                    () => { log.sys("Media copied to clipboard"); },
                                    () => { log.warn("Could not copy media to clipboard"); },
                                );
                            });
                        } else if (mediaSelected[0].convertToBlob) {
                            mediaSelected[0].convertToBlob()
                                .then(blob => {
                                    const data = [new ClipboardItem({ [blob.type]: blob })];
                                    navigator.clipboard.write(data).then(
                                        () => { log.sys("Media copied to clipboard"); },
                                        () => { log.warn("Could not copy media to clipboard"); },
                                    );
                                })
                                .catch(() => log.warn("Copy to clipboarded failed!"));
                        }                            
                    }
                }
                return false;
            },
            [commands.mediaReorder](event, leftClicked, rightClicked){
                if(mediaSelected.length === 0) {
                    items.sort((a,b) => {
                        return Number(a.media.desc.toString().split(" ")[0].replace(/[^0-9]/g,"")) - Number(b.media.desc.toString().split(" ")[0].replace(/[^0-9]/g,""));
                    });
                } else {
                    items.sort((a,b) => {
                        const aIdx =  a.media.selectOrder !== null ? a.media.selectOrder : 1000000;
                        const bIdx =  b.media.selectOrder !== null ? b.media.selectOrder : 1000000;
                        return rightClicked ? bIdx - aIdx : aIdx - bIdx;
                    });
                }
                const ordered = items.map(entry => entry.media);
                API.clear();
                API.buildFrom(ordered);
            },
            [commands.mediaSelectAll](e, left, right){
                if (right) {
                    mediaSelected.clear();
                } else {
                    media.each(media => {
                        if (!media.selected) { mediaSelected.add(media) }
                    });
                }
            },
            [commands.mediaSelectInvert]() {
                media.each(media => {
                    if (media.selected) {  mediaSelected.remove(media) }
                    else {  mediaSelected.add(media) }
                });
            },
            [commands.mediaImageZoomSendToTab]() {
                var str = [];
                mediaSelected.each(media => {
                    if (!media.desc.dirty) {
                        str.push(media.src ?? media.desc.scrName ?? media.desc.fname);
                        log(str[str.length -1]);
                    }
                });
                if (str.length) { IMAGE_ZOOM_DATA.textContent = "Images\n" + str.join("\n") }
            },
            [commands.mediaDeleteImage]() {
                const canNotRemove = [];
				var vid;
                for(var i = 0; i < mediaSelected.length; i ++){
                    if(sprites.hasMedia(mediaSelected[i])){
						canNotRemove.push(mediaSelected[i]);
					} else if (media.videoCapture) {
						if (mediaSelected[i].desc.videoCap) {
							if(media.videoCapture.busy) {
								 canNotRemove.pus(mediaSelected[i]);
							} else {
								vid = mediaSelected[i];
							}
						}
					}
                }
                for (var i = 0; i < canNotRemove.length; i ++){ mediaSelected.remove(canNotRemove[i]) }
                for (var i = 0; i < mediaSelected.length; i ++){
					if(vid !== mediaSelected[i]){
						media.remove(mediaSelected[i]);
						const idx = API.indexOf(mediaSelected[i]);
						if(idx !== undefined && vid !== mediaSelected[i]) {
							listElement.remove(items[idx].element);
							items.splice(idx,1);
						}
					}
                }
                mediaSelected.clear();
				if (vid) { mediaSelected.add(vid) }
                for (var i = 0; i < canNotRemove.length; i ++) { mediaSelected.add(canNotRemove[i]) }
				if (vid) {
                    const removeVid = buttons.quickMenu( "20 Confirm?|Delete,Keep|Video capture media contains recorded content!");
					removeVid.onclosed = () => {
						if(removeVid.exitClicked === "Delete"){
							media.remove(vid);
							const idx = API.indexOf(vid);
							if(idx !== undefined) {
								listElement.remove(items[idx].element);
								items.splice(idx,1);
							}
							media.videoCapture = undefined;
							log.warn("Video capture media removed");
						}else{
							log.warn("Video capture media kept");
						}
					};
				}
                if (canNotRemove.length > 0) { log.warn("Could not remove some media because it is being used.") }
                canNotRemove.length = 0;
            },
            [commands.mediaAddToWorkspace]() {
                if(mediaSelected.length > 0) {
                    selection.clear(true);
                    mediaSelected.each(media => {
                        if(media.userMedia) {
                            if (media.desc.status === "OK") {
                                 var sprite = new Sprite(...utils.viewCenter, media.w, media.h);
                                sprite.changeImage(media);
                                sprites.add(sprite);
                                view.centerOn(sprite.x, sprite.y);
                                selection.add(sprite);
                            }else {
                                media.openMedia((media) => {
                                     var sprite = new Sprite(...utils.viewCenter, media.w, media.h);
                                    sprite.changeImage(media);
                                    sprites.add(sprite);
                                    view.centerOn(sprite.x, sprite.y);
                                    selection.add(sprite);
                                    if(media.desc.webCamMounted === undefined){
                                        const busyId = busy.start("Mounting");
                                        media.desc.webCamMounted = "pending";
                                        setTimeout(()=>commandLine("Mount webCam busyId:"+ busyId+ ",",true));
                                    }
                                });
                            }
                        } else if(media.desc) {
                            if(media.desc.vector) {
                                const shape = new Sprite(...utils.viewCenter, media.w, media.h, media.desc.name);
                                shape.color = colours.mainColor.css;
                                sprites.add(shape);
                                shape.changeToShape(undefined,"vector", media);
                                view.centerOn(shape.x, shape.y);
                                selection.add(shape);
                            }else{
                                var sprite = new Sprite(...utils.viewCenter, media.w, media.h);
                                sprite.changeImage(media);
                                sprites.add(sprite);
                                view.centerOn(sprite.x, sprite.y);
                                selection.add(sprite);
                            }
                        } else {
                            log.warn("Media load error in mediaList command mediaAddToWorkspace");
                        }
                    });
                }
            },
            [commands.mediaSetVideoSrc](event) {
                if(mediaSelected.length === 1 && selection.length === 1 && selection[0].type.image && selection[0].image.guid === mediaSelected[0].guid) {
                    if(!media.videoCapture) {
						const guid = mediaSelected[0].guid
                        const m = media.convertToCanvas(mediaSelected[0]);
						m.selected = true;
						const listItemIdx = API.indexOfByGUID(guid);
						mediaSelected[0] = items[listItemIdx].media = m;
						sprites.eachOfType(spr => { if(spr.image.guid === guid) { spr.image = m } },"image");
						media.videoCapture = canvasRecorder(m, 60);
						media.videoCapture.mediaListItem = items[listItemIdx];
						m.desc.videoCap = true;
						m.desc.toString = function() {
							return textIcons.video + " ("  + media.videoCapture.status + ") " +  media.videoCapture.frames + "F " + media.videoCapture.duration.toFixed(2) +  "s " + utils.numToRAM(media.videoCapture.size) + " " + m.w + "by"  + m.h;
						}
					    issueCommand(commands.edSprVideoCapture);
						media.videoCapture.background = colours.secondColor.css;
                    } else { log.warn("There is already an active Video source") }
                } else { log.warn("There can only be one Video source sprite") }
            },
            [commands.mediaSetSpriteImage](event, leftClicked, right) {
                if(right && mediaSelected.length > 1) {
                    const m = mediaSelected[0];
                    if(selection.length > 0){
                        var changed = 0;
                        selection.eachOfTypes(spr => {
                            if(spr.image !== m) {
                                spr.changeImage(m, false, true); // false = dont rename, true = fit to existng size
                                changed += 1;
                            }
                        },"image", "cutter");
                        if (changed === 0) { log.info("No image changed.") }
                        else{
                            if (timeline.editMode === timeline.editModes.record) { issueCommand(commands.animSetKey_image) }
                            const seq = [...mediaSelected];
                            selection.eachOfType(spr => { spr.addImageSequence(seq) },"image");
                        }
                    }
                } else if(mediaSelected.length === 1) {
                    if (right) { log.warn("Did not assign media sequence. Only 1 media item selected") }
                    const m = mediaSelected[0];
                    if (selection.length > 0) {
                        var changed = 0;
                        selection.eachOfTypes(spr => {
                            if(spr.image !== m) {
                                spr.changeImage(m, false, true); // false = dont rename, true = fit to existng size
                                changed += 1;
                            }
                        },"image", "cutter", "shape");
                        if (changed === 0){ log.info("No image changed.") }
                        else {
                            if (timeline.editMode === timeline.editModes.record) {
                                issueCommand(commands.animSetKey_image);
                            }
                        }
                    }
                }
            },
            [commands.mediaItem](event, leftClicked, rightClicked) {
                var m = event.target.listItem.media;
                if(mouse.ctrl && !mouse.shift && leftClicked) {
                    if (!m.selected) { mediaSelected.add(m) }
                    const eEl = event.target.listItem.element;
                    editingNameListItem = event.target.listItem;
                    editingNameListItem.media.desc.oldName = editingName = event.target.listItem.media.desc.name;
                    renameList.length = 0;
                    API.selected.each(m => {
                        renameList.push(API.listItemByIndex(API.indexOf(m)));
                        m.desc.oldName = m.desc.name;
                    });
                    commandLine(API.updateItemName, API.updateItemNameComplete);
                    commandLine(m.desc.name, false, true, true);
                    lastIdxClicked = -1;
                } else {
                    if (!m.selected) {
                        if (mouse.shift && leftClicked && lastIdxClicked === -1 && mediaSelected.length === 1) {
                            lastIdxClicked = items.findIndex(item => item.media.selected);
                        }
                        if (mouse.shift && leftClicked && lastIdxClicked > -1) {
                            const nextIdx = items.findIndex(item => item.media === m);
                            const min = Math.min(lastIdxClicked, nextIdx);
                            const max = Math.max(lastIdxClicked, nextIdx);
                            for(let i = min; i <= max; i++) {
                                if (!items[i].media.selected) { mediaSelected.add(items[i].media) }
                            }
                        } else {
                            if (leftClicked){ mediaSelected.clear(); }
                            mediaSelected.add(m);
                            lastIdxClicked = items.findIndex(item => item.media === m);
                        }
                    } else {
                        if (rightClicked){
                            mediaSelected.clear();
                            mediaSelected.add(m);
                            lastIdxClicked = items.findIndex(item => item.media === m);
                        } else { mediaSelected.remove(m); }
                    }
                }
            },
        },
        command(commandId,button,event){
            const rightClicked = (mouse.oldButton & 4) === 4;
            if(API.commands[commandId]) {
                if (API.commands[commandId](event, (mouse.oldButton & 1) === 1, rightClicked) === false) { return  }
                API.update();
                return;
            }
        },
        update(item){
			if(item !== undefined) {
				updateItem(item);
				return;
			}
            updateFlags.clear();
            mediaSelected.cleanup();
            topSelect = undefined;
            this.each(updateItem);
            var clipboardCan;
            if (!CanDo.clipboard || API.selected.length !== 1) {
                clipboardCan = false;
            } else {
                clipboardCan = true;
            }
            if(API.length > 0) {
                buttonMap.get(commands.mediaDeleteImage).enable();
                buttonMap.get(commands.mediaSelectFromSelected).enable();
                buttonMap.get(commands.mediaSelectAll).enable();
                buttonMap.get(commands.mediaSelectInvert).enable();
            } else {
                buttonMap.get(commands.mediaDeleteImage).disable();
                buttonMap.get(commands.mediaSelectFromSelected).disable();
                buttonMap.get(commands.mediaSelectAll).disable();
                buttonMap.get(commands.mediaSelectInvert).disable();
            }
            if (!clipboardCan) { buttonMap.get(commands.mediaImageToClipboard).disable() }
            if(mediaSelected.length > 0){
                if(mediaSelected.length > 1) {  buttonMap.get(commands.mediaReorder).enable()  }
                else {  buttonMap.get(commands.mediaReorder).disable()  }
                if (updateFlags.canMakeDrawable) { buttonMap.get(commands.spritesToDrawable).enable() }
                else { buttonMap.get(commands.spritesToDrawable).disable() }
                if(updateFlags.canSave) {
                    buttonMap.get(commands.mediaSavePng).enable();
                    buttonMap.get(commands.mediaSaveJpg).enable();
                }else{
                    buttonMap.get(commands.mediaSavePng).disable();
                    buttonMap.get(commands.mediaSaveJpg).disable();
                }
                if (clipboardCan) { buttonMap.get(commands.mediaImageToClipboard).enable(); }
                buttonMap.get(commands.mediaAddToWorkspace).enable();
                buttonMap.get(commands.mediaSetToCutBuffer).enable();
                buttonMap.get(commands.mediaSetSpriteImage).enable();
                if(selection.length > 0 && mediaSelected.length === 1) {
                    if(!media.videoCapture) {
                        buttonMap.get(commands.mediaSetVideoSrc).enable();
                    }else{
                        buttonMap.get(commands.mediaSetVideoSrc).disable();
                    }
                }else{
                    buttonMap.get(commands.mediaSetVideoSrc).disable();
                }
                if (updateFlags.canSendToImageZoom ) { buttonMap.get(commands.mediaImageZoomSendToTab).enable() }
                else { buttonMap.get(commands.mediaImageZoomSendToTab).disable() }
            }else{
                if (items.length > 0) { buttonMap.get(commands.mediaReorder).enable() }
                else { buttonMap.get(commands.mediaReorder).disable() }
                buttonMap.get(commands.mediaSavePng).disable();
                buttonMap.get(commands.mediaSaveJpg).disable();
                buttonMap.get(commands.mediaAddToWorkspace).disable();
                buttonMap.get(commands.mediaSetToCutBuffer).disable();
                buttonMap.get(commands.mediaSetSpriteImage).disable();
                buttonMap.get(commands.mediaSetVideoSrc).disable();
                buttonMap.get(commands.spritesToDrawable).disable();
                buttonMap.get(commands.mediaImageToClipboard).disable();
                buttonMap.get(commands.mediaImageZoomSendToTab).disable();
            }
        },
        updateForCutBuffer() {
            if(cutBuffer.hasContent){
                buttonMap.get(commands.mediaGetFromCutBuffer).enable();
            } else {
                buttonMap.get(commands.mediaGetFromCutBuffer).disable();
            }
        },
        getMediaItem(image){
            for(const item of items){
                if(item.media === image){
                    return item;
                }
            }
        },
        clear() {
            for(var i = 0; i < items.length; i ++){
                mediaSelected.remove(items[i].media);
                listElement.remove(items[i].element);
                items.splice(i--,1);
            };
        },
        buildFrom(arr) { arr.forEach(API.add) },
        deleteAll() {
            const ms = [...items];
            while (ms.length) { API.deleteMedia(ms.pop().media) };
        },
        deleteMedia(m){
            for(var i = 0; i < items.length; i ++){
                if(items[i].media === m){
                    if(!sprites.hasMedia(items[i].media) && !(media.videoCapture && media.videoCapture.canvas === m)){
                        media.remove(items[i].media);
                        listElement.remove(items[i].element);
                        items.splice(i--,1);
                        API.update();
                        break;
                    }
                }
            };
        },
        add(media){
            var item;
            items.push(item = { media : media, element : listElement.addItem(commands.mediaItem, media.desc.toString()) });
            item.element.listItem = item;
            API.update();
            flasher("newItem");
        },
        replace(media) {
            const idx = API.indexOfByGUID(media);
            if(idx !== undefined) {
                items[idx].media = media;
                sprites.each(spr => {
                    if(spr.type.image) {
                        spr.image = media;
                    }
                });
            }
        },
        setButtons(buttons){
            for (const but of buttons) { buttonMap.set(but.command, but) }
            return buttons;
        }
    };
    return API;
})();