"use strict";
const storage = (()=>{
    function jsonInfo() {
        return {
            app : "painterv3",
            date : new Date(),
            id : getGUID(),
            author : settings.author,
            copyright : settings.copyright,
        };
    }
    function jsInfo(filename) {
        return `/*************************************************************************
  App: "PainterV3 Beta"
  Date: ${new Date()}
  Id: ${getGUID()}
  Author: ${settings.author}
  Copyright: ${settings.copyright}${filename ? "\n  Filename: " + filename : ""}
*************************************************************************/`;
    }
    function vetSprite(spr) {
        if (isNaN(spr.x) || isNaN(spr.y) ||
            isNaN(spr.rx) || isNaN(spr.ry) ||
            isNaN(spr.sx) || isNaN(spr.sy)) {
            return true;
        }
        return false;
    }
    const test = () => {};
    var gifLoadOption = settings.animateGifOnLoad;
    function importSpriteList(loaded, data){
        if (!data.selectLoadedSprites) { selection.save() }
        gifLoadOption = settings.animateGifOnLoad;
        function fixSprite(spr) {
            log.warn("Corrupted sprite attempting fix");
            const loadedSpr = data.sprites.find(s => s.id = spr.guid_I);
            if (loadedSpr) {
                spr.x = isNaN(spr.x) && loadedSpr.x !== undefined ? loadedSpr.x : spr.x;
                spr.y = isNaN(spr.y) && loadedSpr.y !== undefined ? loadedSpr.y : spr.y;
                spr.rx = isNaN(spr.rx) && loadedSpr.rx !== undefined ? loadedSpr.rx : spr.rx;
                spr.ry = isNaN(spr.ry) && loadedSpr.ry !== undefined ? loadedSpr.ry : spr.ry;
                spr.sx = isNaN(spr.sx) && loadedSpr.sx !== undefined ? loadedSpr.rx : spr.sx;
                spr.sy = isNaN(spr.sy) && loadedSpr.sy !== undefined ? loadedSpr.ry : spr.sy;
                if (vetSprite(spr)) {
                    log.warn("Could not fix sprite, not enough data.");
                } else {
                    log.warn("Fixed sprite maybe?");
                }
            } else {
                log.warn("Could not locate fix sprite")
            }
        }
        settings.animateGifOnLoad = false;
        var imagesToLoad = [];
        var mediaToLoad = new Set();
        var filesToLoad = new Map();
        var loadedFiles = new Map();
        maxUID = Math.max(maxUID, UID);
        const UIDOffset = getUID();
        media.clearActionItems();
        if (data.subSprites) {
            media.deserialiseSprites(data.subSprites);
        }

        for(const spr of data.sprites){
            if(spr.fLink) {
                if(spr.fLink.type === "Compiled" && spr.fLink.source.endsWith(".js")) {
                    if(filesToLoad.has(spr.fLink.source)) {
                        filesToLoad.get(spr.fLink.source).sprites.push(spr);
                    }else {
                        filesToLoad.set(spr.fLink.source, {filename:spr.fLink.source, sprites: [spr]});
                    }
                }
            }
            if(spr.type === "image" && !spr.capImage){
                if (spr.src) {
                    var sr = spr.src.split("{")[0];
                    if (!spr.capImage  && !media.isLoaded(sr)) { mediaToLoad.add(sr) }
                }
                if (spr.subSpriteIdx === undefined) {
                    if(spr.animated && spr.keys.image && spr.keys.image.value) {
                        for(const id of spr.keys.image.value) {
                            if (isNaN(id)) {
                                const sr = id.split("{")[0];
                                if (!media.isLoaded(sr)) { mediaToLoad.add(sr) }
                            }
                        }
                    }
                    if (spr.imgSeq) {
                        for(const id of spr.imgSeq) {
                            if (isNaN(id)) {
                                const sr = id.split("{")[0];
                                if(!media.isLoaded(sr)) {
                                    mediaToLoad.add(sr);
                                }
                            }
                        }
                    }
                }
            }
        }
        imagesToLoad = data.images ?? [];
        mediaToLoad = [...mediaToLoad.values()];
        filesToLoad = [...filesToLoad.values()];
        if(mediaToLoad.length > 0 || filesToLoad.length > 0 || imagesToLoad.length > 0){
            loadMedia();
        }else{
            mediaLoaded();
        }
        function mediaLoaded() {
            spriteList.holdUpdates = true;
            const selectable = new Set();
            selection.clear(true);
            const mediaSecondPass = [];
            for (const spr of data.sprites) {
                var sprite = new Sprite(spr.x, spr.y, 256, 256);
                sprite.deserial(spr, UIDOffset);
                if (spr.type === "image"  && !spr.capImage) {
                    if(spr.imgSeq) {
                        var idx = 0;
                        let secondPassNeeded = false;
                        for(let id of spr.imgSeq) {
                            const m = media.byGUID(id);
                            if (m) { spr.imgSeq[idx] = m }
                            else {
                                const m =  media.getByUrl(id);
                                if (m) { spr.imgSeq[idx] = m }
                                else { secondPassNeeded = true }
                            }
                            idx++;
                        }
                        if(secondPassNeeded) {
                            mediaSecondPass.push([spr,sprite]);
                        }
                    }
                    if(spr.animated && spr.keys.image && spr.subSpriteIdx === undefined) {
                        var idx = 0;
                        let secondPassNeeded = false, firstFound = false;
                        for(let id of spr.keys.image.value) {
                            const m = media.byGUID(id);
                            if (m) {
                                if(!firstFound) {
                                    sprite.changeImage(m, false, false, true);
                                    firstFound = true;
                                }
                                sprite.animation.tracks.image.keys[idx].value = m;
                            } else {
                                const m = media.getByUrl(id);
                                if(m && !firstFound) {
                                    sprite.changeImage(m, false, false, true);
                                    firstFound = true;
                                }
                                if(m) { sprite.animation.tracks.image.keys[idx].value = m }
                                else { secondPassNeeded = true }
                            }
                            idx++;
                        }
                        if(secondPassNeeded) {
                            mediaSecondPass.push([spr,sprite]);
                        }
                    }else{

                        if (spr.imgGuid) {
                            const m = media.byGUID(spr.imgGuid);
                            if (m) { sprite.changeImage(m, false, false, true) }
                            else {
                                const m = media.byName(spr.imgName);
                                if (m) { sprite.changeImage(m, false, false, true) }
                            }
                        } else  {
                            const src = spr.src;
                            const m = media.getByUrl(src);
                            if (m) {
                                sprite.changeImage(m, false, false, true);
                            } else {
                                let justName = src.split(".");
                                justName.pop();
                                const m = media.getByUrl(justName.join("."));
                                if (m) {
                                    sprite.changeImage(m, false, false, true);
                                }else{
                                    mediaSecondPass.push([spr,sprite])
                                }
                            }
                        }
                    }
                }
                sprites.add(sprite);
                selectable.add(sprite);
                if(spr.type === "text" && !spr.textId) {
                    setTimeout(()=>{  fontManager.useFont(spr.font, sprites.updateFonts) },0);
                }
            }
            if(mediaSecondPass.length > 0) {
                let count = 0;
                for(const [spr, sprite] of mediaSecondPass) {
                    if(spr.imgSeq){
                        var idx = 0, missing = 0;
                        for(let src of spr.imgSeq) {
                            if (typeof src === "string") {
                                const m = media.getByUrl(src);
                                if(m) {
                                    spr.imgSeq[idx] = m;
                                }else {
                                    count++;
                                    missing++;
                                    spr.imgSeq[idx]= null;
                                }
                                idx++;
                            }
                        }
                        if(missing) {
                            spr.imgSeq = spr.imgSeq.filter(i => i);
                        }
                    }
                    if(spr.animated && spr.keys.image && spr.subSpriteIdx === undefined) {
                        var idx = 0, missing = 0;
                        for(let src of spr.keys.image.value) {
                            const m = media.getByUrl(src);
                            if(m && sprite.image === undefined) {
                                sprite.changeImage(m, false, false, true);
                            }
                            if(m) {
                                sprite.animation.tracks.image.keys[idx].value = m;
                            } else {
                                count++;
                                missing++;
                                sprite.animation.tracks.image.keys[idx].value = null;
                            }
                            idx++;
                        }
                        if(missing) {
                            for(const k of sprite.animation.tracks.image.keys) {
                                if(k.value === null){
                                    k.value = sprite.image;
                                }
                            }
                        }
                    }else{
                        let src = spr.src
                        const m = media.getByUrl(src);
                        if(m) {
                            sprite.changeImage(m, false, false, true);
                        } else {
                            let justName = src.split(".");
                            justName.pop();
                            const m = media.getByUrl(justName.join("."));
                            if(m) {
                                sprite.changeImage(m, false, false, true);
                            }else{
                                sprite.changeToCutter(false);
                                log.info("Could not locate media: `" + src + "`");
                                count ++;
                            }
                        }
                    }
                }
                if(count > 0) {
                    log.warn("Failed to locate some media items.");
                }
                mediaSecondPass.length = 0;
            }
            for(const spr of data.sprites){
                const sprite = sprites.getByGUID_I(spr.id);
                if (spr.imgSeq) {
                    sprite.addImageSequence([...spr.imgSeq], spr.imgIdx ? spr.imgIdx : 0);
                    delete spr.imgSeq;
                }
            }
            if(data.collections) { collections.deserial(data.collections) }
			kinematics.deserialize(data.kinematics);
            spriteText.deserialize(data.text);
            var newfLinks = false;
            var turnOnFunctionLinks = false;
			const computedAttachents = [];
            for(const spr of data.sprites){
                if (spr.textId) {
                    const t = spriteText.getByOldId(spr.textId);
                    if (t) {
                        const sprite = sprites.getByGUID_I(spr.id);
                        if(sprite) {
                            sprite.changeToText(undefined,t);
                            setTimeout(()=>{  fontManager.useFont(sprite.textInfo.font, sprites.updateFonts, sprite.textInfo.local) },0);

                        }
                    }

                }
                if (spr.fLink) {
                    turnOnFunctionLinks = true;
                    const sprite = sprites.getByGUID_I(spr.id);
                    if(sprite) {
                        if(spr.fLink.type === "Compiled") {
                            let apply = true;
                            if (spr.fLink.source.endsWith(".js")) {
                                if (loadedFiles.has(spr.fLink.source)) {
                                    spr.fLink.fileSource = spr.fLink.source;
                                    spr.fLink.source = loadedFiles.get(spr.fLink.source);
                                } else {
                                    log.warn("Compiled function linker failed to load source file");
                                    apply = false;
                                }
                            }
                            if(apply) {
                                const bindings = spr.fLink.linked.map((id, idx) => {
                                    const s = sprites.getByGUID_I(id);
                                    const sId = spr.fLink.srcIds ? spr.fLink.srcIds[idx] : -1;
                                    return s ? [id, s.guid, sId] : [id, id, sId];
                                });
                                //log(bindings);
                                if(!functionLinkCompiler.linkCompiledAndApply(sprite, spr.fLink.source, bindings, spr.fLink.inputs, spr.fLink.outputs, spr)) {
                                    log.warn("Failed to compile and bind compiled function link.");
                                }
                            }
                        } else {
                            if(spr.fLink.inputs) {
                                sprite.fLink.inputs.length = 0;
                                for(const id of spr.fLink.inputs) {
                                    var inp = sprites.getByGUID_I(id);
                                    if(inp) {
                                        sprite.fLink.inputs.push(inp);
                                    }
                                }
                            }
                            if(spr.fLink.outputs) {
                                sprite.fLink.outputs.length = 0;
                                for(const id of spr.fLink.outputs) {
                                    var outp = sprites.getByGUID_I(id);
                                    if(outp) {
                                        sprite.fLink.outputs.push(outp);
                                    }
                                }
                            }
                        }
                        newfLinks = true;
                        sprite.fLink.reset = true;
                    }
                }
                if (spr.shape) {
                    if (spr.shape.joinedIDS) {
                        const sprite = sprites.getByGUID_I(spr.id);
                        if (sprite && sprite.type.shape && sprite.shape.isCompound) {
                            for (const jId of spr.shape.joinedIDS) {
                                const j = sprites.getByGUID_I(jId);
                                if (j) {
                                    sprite.shape.compoundJoin(j);
                                }
                            }
                        }
                    }
                    if (spr.shape.name === "vectorCommited" || spr.shape.name === "vector") {
                        const sprite = sprites.getByGUID_I(spr.id);
                        if (sprite && sprite.type.shape && !sprite.shape.hasData) {
                            const vecData = data.vectors.find(vec => vec.id === spr.shape.id);
                            sprite.shape.deserialVector(vecData);
                            if (!sprite.normalisable) {
                                sprite.cx = sprite.w / 2;
                                sprite.cy = sprite.h / 2;
                            }
                        }
                    }
                }
                if (spr.pattern) {
                    const sprite = sprites.getByGUID_I(spr.id);
                    if(sprite) {
                        sprite.setPattern(true, true, spr.pat.rep);
                        sprite.key.update();
                    }
                }
                if (spr.usePattern ) {
                    const sprite = sprites.getByGUID_I(spr.id);
                    if(sprite) {
                        const pat = sprites.getByGUID_I(spr.usePattern);
                        if (pat) { sprite.usePattern(pat) }
                    }
                }
                if (spr.linkers) {
                    const sprite = sprites.getByGUID_I(spr.id);
                    if (sprite) {
                        if (vetSprite(sprite)) { fixSprite(sprite) }
                        for (const lId of spr.linkers) {
                            const lSprite = sprites.getByGUID_I(lId);
                            if (lSprite) {
                                lSprite.setLinkedSprite(sprite);
                            }
                            
                        }
                        
                    }
                    
                }
                if (spr.lookat || spr.attachedTo || spr.locators || spr.linked) {
                    const sprite = sprites.getByGUID_I(spr.id);
                    if (sprite) {
                        if (spr.linked) {
                            const linked = sprites.getByGUID_I(spr.linked);
                            if (linked) {
                                if (vetSprite(linked)) { fixSprite(linked) }
                                sprite.setLinkedSprite(linked);
                            }
                        }
                        if (spr.lookat) {
                            const lookingAt = sprites.getByGUID_I(spr.lookat[0]);
                            if (lookingAt) {
                                if (vetSprite(lookingAt)) { fixSprite(lookingAt) }
                                sprite.setLookatSprite(lookingAt);
                                sprite.lookat.offsetX  = spr.lookat[1];
                                sprite.lookat.offsetY  = spr.lookat[2];
                            }
                        }
                        if (spr.attachedTo) {
                            const attachedTo = sprites.getByGUID_I(spr.attachedTo);
                            if(attachedTo) {
                                sprite.attachSprite(attachedTo, spr.attachedPos, true);
                                sprite.attachment.deserialize(spr.attachment);
								if (sprite.attachment.computed === false) {
									sprite.attachment.computed = true;
									computedAttachents.push(sprite);
								}
                            }
                        }
                        if(spr.locators) {
                            let i = 0;
                            for(const loc of spr.locators) {
                                const locates = sprites.getByGUID_I(loc.guid);
                                if(locates) {
                                    sprite.attachLocator(locates);
                                    sprite.locators[i].deserialize(loc);
                                }
                                i++;
                            }
                            if(sprite.type.hasLocators) {
                                sprite.locators.scales = spr.locatorScales;
                            }
                        }
                    } else {
                        log("Missing sprite");
                    }
                }
            }
            for(const spr of data.sprites){
                if (spr.animated) {
                    const sprite = sprites.getByGUID_I(spr.id);
                    sprite.deserialAnim(spr, UIDOffset);
                }
            }
			//sprites.update();
            if(data.groups) {
                for(const group of data.groups) {
                    const id = group.id;
                    const gSprites = [];
                    const dSprites = [];
                    for(const spr of data.sprites) {
                        if(spr.groupId === id) {
                            const gSpr = sprites.getByGUID_I(spr.id);
                            if(gSpr) {
                                dSprites.push(spr);
                                gSprites.push(gSpr);
                            }
                        }
                    }
                    if(gSprites.length > 0) {
                        const children = group.children.map(sid => sprites.getByGUID_I(sid));
                        children.forEach(spr => {
                            selectable.delete(spr);
                            sprites.remove(spr)
                        });
                        const spr = dSprites.shift();
                        const gSpr = gSprites.shift();
                        const state = gSpr.getState();
                        gSpr.changeToGroup(children, false);
                        var newGroup = gSpr.group;
                        gSpr.setState(state);
                        if (spr.shape) {
                            gSpr.changeToShape(spr.name, spr.shape.name);
                            newGroup.addEvent("onremoved", (group, type, spr) => { group.owner.shape.compoundUnjoin(spr) })
                            newGroup.addEvent("onadded", (group, type, spr) => { group.owner.shape.compoundJoin(spr); spr.a = 0 })
                            children.forEach(s => {
                                gSpr.shape.compoundJoin(s);
                                s.a = 0;
                            });
                            for(const sprA of data.sprites) {
                                if (sprA.shape && spr !== sprA) {
                                    if (sprA.shape.id === spr.shape.id) {
                                        const s = sprites.getByGUID_I(sprA.id);
                                        if (s) {
                                            s.shape = gSpr.shape;
                                        }
                                    }
                                }
                            }
                        }
                        while(gSprites.length) {
                            const spr = dSprites.shift();
                            const gSpr = gSprites.shift();
                            const state = gSpr.getState();
                            gSpr.changeToGroup(undefined, false, newGroup);
                            gSpr.setState(state);
                        }
                    }
                }
                groups.reboundGroups();
            }
            if(newfLinks) {sprites.functionLinksOn = false}
            sprites.eachOfTypes(spr => {
                    if(!spr.type.normalisable) {
                        if(spr.attachers) {
                            for(const s of spr.attachers.values()) {
                                s.attachment.x *= spr.sx;
                                s.attachment.y *= spr.sy;
                            }
                        }
                        spr.type.normalisable = true;
                    }
                    spr.normalize();
                },"cutter"
            );
            for(const spr of data.sprites){
				if( spr.subSpriteIdx !== undefined) {
						const sprite = sprites.getByGUID_I(spr.id);
						if(!sprite.image.isDrawable && !sprite.image.desc.sprites) {
							var newM = media.toDrawable(sprite.image);
							sprites.each(s => {
								if (s.type.image) {
									if (s.image === sprite.image) {  s.image = newM }
									if (s.type.animated && s.animation.tracks.image) {
										s.animation.tracks.image.eachKey(imgKey => {
											if (imgKey.value === sprite.image) { imgKey.value = newM }
										});
									}
									if (s.type.imgSequence) {
										let i = 0;
										while (i < s.imgSequence.length) {
											if (s.imgSequence[i] === sprite.image) { s.imgSequence[i] === newM }
											i++
										}
									}
								}
							});
						}
						if(sprite.image.desc.sprites) {
							sprite.changeToSubSprite(spr.subSpriteIdx);
						}
					}
            }

            sprites.cleanup();
            
              
            sprites.removeImportGUID();
			collections.removeImportGUID()
			spriteText.removeImportGUID()
            var animated = false;
            for(const spr of data.sprites){
                if(spr.animated) {
                    animated = true;
                    break;
                }
            }
            if(data.animation) {
                animation.deserialize(data.animation);
            }
            if(animated) {
                animation.forceUpdate();
                animation.time = animation.startTime;
            }
            if(loaded) {loaded({status : "Loaded sprites OK"})}
            settings.animateGifOnLoad = gifLoadOption;
            
            var skipViewSetup = false;
            var isSetup = false;
            function loadedCommands() {
                if(data.info && data.info.loadedCommands && data.info.loadedCommands.length) {
                    const commandName = data.info.loadedCommands.shift();
                    const commandId = commands[commandName];
                    if (commandId !== undefined) {
                        setTimeout(()=> {
                            console.log("Issue command: " + commandName);
                            issueCommand(commandId);
                            loadedCommands();
                        }, 20);
                    } else {
                        setTimeout(()=> {
                            console.log("Unknown command: " + commandName);
                            loadedCommands();
                        }, 20);
                    }
                } else if (!isSetup) {
                    setTimeout(()=> {
                        if (turnOnFunctionLinks && !sprites.functionLinksOn) {
                            issueCommand(commands.edSpriteActivateFunctionLinks);
                        }
                        data.addSceneAsCollection && (collections.create(selection.asArray(), undefined, data.collectionSceneName));
                        if (!skipViewSetup) {
                            (data.viewLoadedSprites && data.zoomLoadedSprites) && issueCommand(commands.edSprResetViewFit);
                            (data.viewLoadedSprites && !data.zoomLoadedSprites) && issueCommand(commands.edSprResetView);
                            !data.selectLoadedSprites && selection.restore();
                        }
                        settings.saveGridState && editSprites.deserialWorkspace(data.workspace);
                        isSetup = true;
                        loadedCommands();
                    },20);
                } else if(data.info && data.info.cmds && data.info.cmds.length) {
                    const cmd = data.info.cmds.shift();
                    setTimeout(()=> {
                        console.log("Run: " + cmd);
                        if (cmd === "skipViewSetup") { skipViewSetup = true; }
                        else { commandLine(cmd, true); }
                        loadedCommands();
                    }, 20);
                }
            }
            
            /*function loadedCommands() {
                if(data.info && data.info.loadedCommands && data.info.loadedCommands.length) {
                    const commandId = commands[data.info.loadedCommands.shift()];
                    setTimeout(()=> {
                        issueCommand(commandId);
                        loadedCommands();
                    } ,18);
                } else {
                    setTimeout(()=> {
                        if (turnOnFunctionLinks && !sprites.functionLinksOn) {
                            issueCommand(commands.edSpriteActivateFunctionLinks);
                        }
                        data.addSceneAsCollection && (collections.create(selection.asArray(), undefined, data.collectionSceneName));
                        (data.viewLoadedSprites && data.zoomLoadedSprites) && issueCommand(commands.edSprResetViewFit);
                        (data.viewLoadedSprites && !data.zoomLoadedSprites) && issueCommand(commands.edSprResetView);
                        !data.selectLoadedSprites && selection.restore();
                        settings.saveGridState && editSprites.deserialWorkspace(data.workspace);
                    },18);
                }
            }*/
            timeline.deserialize(data.timeline, UIDOffset);
			computedAttachents.forEach(spr => spr.attachment.computed = false );
			computedAttachents.length = 0;
            const mlac = media.loadActionCount;
            if (mlac) {
                log.warn("There where " + mlac + " unresolved media load actions. Actions cleared.");
                media.reportOnLoadActions();
                media.clearActionItems();
            }

            setUID(maxUID + 1);

            selection.add([...selectable.values()]);
            spriteList.holdUpdates = false;
            spriteList.rebuildLists();
            loadedCommands();
            loadedFiles.clear();
        }
        function loadFiles() {
            if(filesToLoad.length === 0) {
                setTimeout(mediaLoaded, 0);
                return;
            }
            var file = filesToLoad[0];
            fileReadWriter.load(file.filename)
                .then(fileText => {
                    loadedFiles.set(file.filename, fileText);
                    if (filesToLoad.length > 1) { setTimeout(loadFiles, 0) }
                    else { setTimeout(mediaLoaded, 0) }
                    filesToLoad.shift();
                })
                .catch(file => {
                    log.warn("Could not locate file '" + file.filename + "'");
                    if (filesToLoad.length > 1) { setTimeout(loadFiles, 0) }
                    else { setTimeout(mediaLoaded, 0) }
                    filesToLoad.shift();
                });
        }
        function loadMedia() {
            if (imagesToLoad.length) {
                media.create({
                    type: "dataURL",
                    image: imagesToLoad.shift(),
                },(image) => {
                    if(!image){ log.warn("Bad image data URL") }
                    if(imagesToLoad.length || mediaToLoad.length){
                        setTimeout(loadMedia,0);
                    }else{
                        setTimeout(loadFiles,0);
                    }
                });
            } else {

                if(mediaToLoad.length === 0) {
                    setTimeout(loadFiles, 0);
                    return;
                }
                var name = mediaToLoad[0];
                media.create(name, (image) => {
                    if (!image) { log.warn("Bad media reference.")  }
                    if (mediaToLoad.length > 1) { setTimeout(loadMedia,0) }
                    else {  setTimeout(loadFiles,0) }
                    mediaToLoad.shift();
                });
            }
        };
    }
    function iterateObject(libMap, dataRecord) {
        var fields = Object.keys(dataRecord);
        var idx = 0;
        while(idx < fields.length) {
            const field = fields[idx];
            if(field[0] === "_" && libMap.has(field)) {
                const keeping = {...dataRecord};
                Object.assign(dataRecord, libMap.get(field), keeping);
                delete dataRecord[field];
            }
            idx ++;
        }
        fields = Object.keys(dataRecord);
        idx = 0;
        while(idx < fields.length) {
            const record = dataRecord[fields[idx]];
            if(Array.isArray(record)) {
                iterateArray(libMap, record);
            } else if(typeof record === "object") {
                iterateObject(libMap, record);
            } else if(typeof record === "string" && record[0] === "_" && libMap.has(record)){
                dataRecord[fields[idx]] = {...libMap.get(record)};
                idx --;
            }
            idx ++;
        }
    }
    function iterateArray(libMap, dataArray) {
        var idx = 0;
        while(idx < dataArray.length) {
            const record = dataArray[idx];
            if(Array.isArray(record)) {
                iterateArray(libMap, record);
            } else if(typeof record === "object") {
                iterateObject(libMap, record);
            } else if(typeof record === "string" && record[0] === "_" && libMap.has(record)){
                dataArray[idx] = {...libMap.get(record)};
                idx --;
            }
            idx ++;
        }
    }
    function compileFromDataLib(dataLib, ...arrays) {
        const lib = new Map();
        for(const ref of Object.keys(dataLib)) {
            lib.set(ref, dataLib[ref]);
        }
        for(const arr of arrays) {
            if(arr) {
                iterateArray(lib, arr);
            }
        }
    }
    var currentFile;
    var files = {};
    const clipboardName = "p3SpritesClipboard";
    const localNames = [
        "p3SpritesLoc",
        "p3SpritesBackup",
        clipboardName,
    ];
    $doFor(settings.undoLevels,i => localNames.push("undo" + (i+1)));;
    const clipboardMark = "pv3849246525-02139-2923497";
    
    function loadSceneDialog(info, options) {

        const date = new Date(info.date);
        return new Promise(ok => {
            if (options !== undefined) { ok("Load " + options); return }
            if (commandLine.quickMenuOpen()) { log.warn("Load canceled. Close active dialogs first"); ok("Cancel"); return   }
            var selLoad = settings.selectLoaded ? "*" : "";
            var viewLoad = settings.viewLoaded ? "*" : "";
            var zoomOnLoadedOn = settings.zoomOnLoadedOn ? "*" : "";
            if (!settings.viewLoaded) { settings.zoomOnLoadedOn = false; zoomOnLoadedOn = ""; }
            var colLoad = settings.addLoadedAsCollection ? "*" : "";
            const loadOptions = buttons.quickMenu(
                "30 Load scene options?|" +
                "Cancel,Load|"+
                "textCenter File details...,"+
                "text Scene: [" + info.scene.replace(/,/g, ".") + "]?Name of scene,},"+
                "text Id: [" + ""+info.id + "]?Scene ID when saved,"+
                "text App: [" + info.app.replace(/,/g, ".") + "]?App version used to save this file,"+
                "text Author: [" + info.author.replace(/,/g, ".") + "]?Authors mark,"+
                "text Rights: [" + info.copyright.replace(/,/g, ".") + "]?Contents useage rights,"+
                "text Created: [" + date.toLocaleDateString() + " " + date.toLocaleTimeString() + "]?Date time of file save,,," +
                "$addCollection," + colLoad + "Add as collection?When load is complete all loaded sprites are added as a collection named as the filename,," +
                "$view," + viewLoad + "Set view to loaded?When load complete view is updated to show loaded sprites,," +
                "$zoomOnLoaded," + zoomOnLoadedOn + "Zoom to fit loaded?Zooms to fit loaded items.\nOnly if set view to loaded is selected,," + 
                "$selectLoaded," + selLoad + "Select loaded sprites?When load is complete all loaded sprites are selected,,",
                true, // keep dialog open for option changes
            );
            selLoad = settings.selectLoaded;
            viewLoad = settings.viewLoaded;
            zoomOnLoadedOn = settings.zoomOnLoadedOn;
            colLoad = settings.addLoadedAsCollection;
            if (!viewLoad) {
                const but = loadOptions.getButton("zoomOnLoaded");
                but.disable();
            }
            options = [selLoad ? "select" : "", viewLoad ? "view" : "", zoomOnLoadedOn ? "zoom" : "", colLoad ? "collections" : ""].join(" ");
            loadOptions.oncommand = (cmd) => {
                if (loadOptions.exitUsed) {
                    if (cmd === "load") {
                        settings.selectLoaded = selLoad;
                        settings.viewLoaded = viewLoad;
                        settings.addLoadedAsCollection = colLoad;
                        settings.zoomOnLoadedOn = zoomOnLoadedOn;
                        setTimeout(()=> ok("Load " + options),0);
                        loadOptions.close(undefined, "Load");
                        settingsHandler.updateSettings();
                    } else {
                        setTimeout(()=> ok("Cancel"),0);
                        loadOptions.close(undefined, "Cancel");
                    }
                    return;
                }
                var check;
                if (cmd === "Add as collection") {
                    if (options.includes("collections")) {
                        options = options.replace("collections","");
                        check = false;
                    } else {
                        options += "collections";
                        check = true;
                    }
                    colLoad = check;
                } else if (cmd === "Select loaded sprites") {
                    if (options.includes("select")) {
                        options = options.replace("select","");
                        check = false;
                    } else {
                        options += "select";
                        check = true;
                    }
                    selLoad = check;
                } else if (cmd === "Zoom to fit loaded") {
                     if (options.includes("zoom")) {
                        options = options.replace("zoom","");
                        check = false;
                    } else {
                        options += "zoom";
                        check = true;
                    }
                    zoomOnLoadedOn = check;                   
                    
                } else if (cmd === "Set view to loaded") {
                    if (options.includes("view")) {
                        options = options.replace("view","");
                        check = false;
                    } else {
                        options += "view";
                        check = true;
                    }
                    viewLoad = check;
                }
                if (check !== undefined) { 
                    buttons.groups.setDialogButtonCheck(loadOptions.groupName, loadOptions.currentCmdId, check);
                    if (cmd === "Set view to loaded") {
                        if (check) {
                            loadOptions.getButton("zoomOnLoaded").enable();
                        } else {
                            const but = loadOptions.getButton("zoomOnLoaded");
                            but.disable();
                            options = options.replace("zoom","");
                            zoomOnLoadedOn = false;
                            settings.zoomOnLoadedOn = zoomOnLoadedOn;
                            buttons.groups.setDialogButtonCheck(loadOptions.groupName, but.command, false);
                            
                        }

                    }
                        
                }

            }
            loadOptions.onclosed = () => {



            }
        });

    }
    const API = {
        clipboardMark,
        clipboardName, 
        localStorageNames: localNames,
        addCommandLineHistory(line) {
            const coms = localStorage[APPNAME + "_CommandLineHistory"];
            var comsArray;
            if (coms) {
                try {
                    comsArray = JSON.parse(coms);
                } catch(e) { comsArray = [] }

            } else {
                comsArray = [];
            }
            if (line !== comsArray[0]) {
                if (comsArray.length > 50) {
                    comsArray.length = 50;
                }
                comsArray.unshift(line);
                localStorage[APPNAME + "_CommandLineHistory"] = JSON.stringify(comsArray);
            }
        },
        getCommandLineHistory() {
            const clh = localStorage[APPNAME + "_CommandLineHistory"];
            try {
                return clh ? JSON.parse(clh).reverse() : [];
            } catch(e) {}
            return [];

        },
        addFileHistory(filename) {
            filename = filename.toLowerCase();
            const files = localStorage[APPNAME + "_RecentFiles"];
            var fileArray;
            if (files) {
                try {
                    fileArray = JSON.parse(files);
                } catch(e) { fileArray = [] }
            } else {
                fileArray = [];
            }
            fileArray = fileArray.filter(f => f !== filename);
            if (fileArray.length > 50) {
                fileArray.length = 50;
            }
            fileArray.unshift(filename.toLowerCase());
            localStorage[APPNAME + "_RecentFiles"] = JSON.stringify(fileArray);
        },
        listFileHistory() {
            const files = localStorage[APPNAME + "_RecentFiles"];
            var fileArray;
            if (files) {
                try {
                    for (const filename of JSON.parse(files).reverse()) {
                        log.command(filename.replace(APP_ROOT_DIR_REG, "..."),"load " + filename);
                    };
                } catch(e) { log("Could not access file history") }
            } else { log("No recent file history found") }
        },
        file(val) {
            if(!files[val]) {
                files[val] = {};
            }
            currentFile = files[val];
        },
        close() {
            currentFile = undefined;
        },
        write(name, value) {
            if(currentFile) {
                currentFile[name] = value;
            }
        },
        read(name,def) {
            if(currentFile && currentFile[name] !== undefined) {
                return currentFile[name];
            }
            return def;
        },
        get infoHeader() {
            return jsonInfo();
        },
        jsInfoHeader: jsInfo,
        jsonString: "",
        openContentOfType(type, data, callback) {
            if(type === "sprites" || Array.isArray(data.sprites)) {
                importSpriteList(callback,data);
            }else if(type === "animation") {
                animation.deserialize(data.animation);
                if(callback) { callback() }
            }else {
            }
        },
        fromJSONText(text, name, options) {
            return new Promise((loaded, error) => {
                var data;
                try {
                    data = JSON.parse(text);
                } catch(e) {
                    log.warn("Could not parse file '" + name + "'");
                    log.warn(e.message);
                    error({status : "JSON parsing error."});
                    return;
                }
                API.decode(data, loaded, error, name, options);
            });
        },
        decode(data, loaded, error, name, options) {
            if(data.info && data.info.app && (data.info.app.toLowerCase() === "painter" || data.info.app.toLowerCase() === "painterv3")){
                log.sys("Parsing painter file.");
                if(data.info.author) { log.sys("Author: " + data.info.author) }
                if(data.info.copyright) { log.sys("Copyright: " + data.info.copyright) }
                if(data.info.details) { log.sysStyle(data.info.details) }
                if(data.info.type.toLowerCase() === "scene"){
                    loadSceneDialog(data.info, options).then(loadType => {
                        if (loadType.includes("Load")) {
                           // if (!loadingLocal) { localStorage[APPNAME + "_lastLoadedSprites"] = name }

                            //filename && API.addFileHistory(filename);
                            data.selectLoadedSprites = loadType.includes("select");
                            data.viewLoadedSprites = loadType.includes("view");
                            data.zoomLoadedSprites = loadType.includes("zoom");
                            data.images = data.scene.images;
                            data.sprites = data.scene.sprites;
                            data.subSprites = data.scene.media ? data.scene.media : data.scene.subSprites;
                            data.vectors = data.scene.vectors;
                            data.groups = data.scene.groups;
                            data.collections = data.scene.collections;
                            data.addSceneAsCollection = loadType.includes("collections");
                            data.collectionSceneName = data.info.scene ?? data.info.collectionName ?? "LoadedCollection";
                            data.timeline = data.scene.timeline;
                            data.animation = data.scene.animation;
                            data.kinematics = data.scene.kinematics;
                            data.workspace = data.scene.workspace;
                            data.text = data.scene.text;
                            data.name = name;
                            data.scene.sprites = undefined;
                            data.scene.images = undefined;
                            data.scene.vectors = undefined;
                            data.scene.groups = undefined;
                            data.scene.collections = undefined;
                            data.scene.timeline = undefined;
                            data.scene.animation = undefined;
                            data.scene.kinematics = undefined;
                            data.scene.subSprites = undefined;
                            data.scene.media = undefined;
                            data.scene.text = undefined;
                            data.scene.workspace = undefined;
                            data.scene = undefined;
                            if (data.info.useLib === true && data.lib) {
                                compileFromDataLib(data.lib, data.sprites, data.groups, data.collections);
                            }
                            importSpriteList(loaded, data);
                            if (data.info.scene) {
                                log.sys("Setting scene name: '" + data.info.scene + "`");
                                document.title = "P3" + SUB_VERSION + " '" + data.info.scene + "'";
                                sprites.sceneName = data.info.scene;
                            }
                        }
                    })
                    return;
                }
                if(data.info.type.toLowerCase() === "sprites"){
                    //if (!loadingLocal) { localStorage[APPNAME + "_lastLoadedSprites"] = name }
                    importSpriteList(loaded, data);
                    if (data.info.scene) {
                        log.sys("Setting scene name: '" + data.info.scene + "`");
                        sprites.sceneName = data.info.scene;
                    }
                    return;
                }
                if(data.info.type.toLowerCase() === "pallet"){
                    //filename && API.addFileHistory(filename);
                    issueCommand(commands.edSprCreatePallet);
                    selection[0].name = name;
                    selection[0].pallet.fromHexStr(data.pallet);
                    return
                }
                if(data.info.type.toLowerCase() === "palletv2"){
                    //filename && API.addFileHistory(filename);
                    issueCommand(commands.edSprCreatePallet);
                    selection[0].name = name;
                    selection[0].pallet.sortBy = "*" + data.palletv2.sortBy;  // "*" prevents clean() being called
                    selection[0].pallet.layout = "*" + data.palletv2.layout;  // "*" prevents clean() being called
                    selection[0].pallet.fromHexStr(data.palletv2.colors, false); // false prevents clean() being called
                    selection[0].pallet.clean();
                    selection[0].resetScale();
                    issueCommand(commands.edSprUpdateUI);
                    return;
                }
                if(data.info.type.toLowerCase() === "vector"){
                    error({status: "Vector type files are no longer supported by PainterV3"});
                    return;
                }
                if(data.info.type.toLowerCase() === "settings"){
                    settingsHandler.fromObj(data.settings);
                    log.sys("Loaded setting from file");
                    return;
                }
                if(data.info.type.toLowerCase() === "commandbuffer"){
                    commandLine.addToBuffer(data.commandbuffer, true);
                    log.sys("Added commands to command buffer");
                    return;
                }
            }
            error({status : "Unknow JSON content."});

        },
        
        loadJSON(name, options, firstTryDir){
            return new Promise((loaded, error) => {
                var holdDirCount = false;
                var dir = 0;
                var filename;
                var loadingLocal = false;
                tryFile();
                function tryFile(){
                    if (clipboardName === name) {
                        loadingLocal = true;
                        try {
                            loadComplete(JSON.parse(API.jsonString));
                            API.jsonString = undefined;                            
                        } catch(e) {
                            log.warn("There was an error pasting data from the clipboard.");
                            return;
                        }
                    } else if (localNames.includes(name)) {
                        loadingLocal = true;
                        jsonReadWriter.loadLocal(name, loadComplete);
                    } else {
                        if (name.indexOf("http") === 0) {
                            filename = name;
                            jsonReadWriter.load(name, loadComplete);
                        } else {
                            if (firstTryDir !== undefined) {
                                holdDirCount = true;
                                filename = firstTryDir + name;
                                jsonReadWriter.load(firstTryDir + name, loadComplete);
                                firstTryDir = undefined;
                            } else {
                                filename = directories[dir] + name;
                                jsonReadWriter.load(directories[dir] + name, loadComplete);
                            }
                        }
                    }
                    function loadComplete(data) {
                        if(data.status && data.status === "JSON error") {
                            log.error("Could not parse JSON data");
                            error(data);
                            return;
                        }
                        if(data.status && data.status !== "loaded") {
                            if (holdDirCount) { holdDirCount = false; }
                            else { dir ++; }
                            if(dir ===  directories.length){
                                data.info = "Could not load JSON"
                                error(data);
                                return;
                            }
                            tryFile();
                            return;
                        }
                        API.decode(data, loaded, error, name, options);
                    }
                }
                
            });
        },
        saveJSON(data, name, type = "unknown", details, named){
            const json = {
                info : {
                    ...API.infoHeader,
                    scene: named ? sprites.sceneName : undefined,
                    details,
                },
                [type.toLowerCase()] : data,
            };
            json.info.type = type.toLowerCase();
            if(localNames.includes(name)) {
                if (localNames[2] === name) {
                    try {
                        json.info.clipboardMark = clipboardMark;
                        navigator.clipboard.writeText(settings.prettyJSON ? JSON.stringify(json, null, "    ") : JSON.stringify(json)).then(
                            () => { log.sys("Selected copied to clipboard.") }, 
                            () => { log.warn("There was an error saving data to clipboard") }
                        );                        
                    } catch(e) {
                        log.warn("There was an error saving data to clipboard");
                    }          
                } else {
                    return localStoreJson(json, name) ? "local" : undefined;
                }
            } else {
                if (settings.appendIdOnSave) {
                    downloadAsJson(json, name + "_" + json.info.id + ".json");
                    return name + "_" + json.info.id + ".json"
                }
                downloadAsJson(json, name + ".json");
                return name + ".json"
            }
        },
    };
    return API;
})();