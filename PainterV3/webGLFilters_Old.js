"use strict";
const webGLFilterMenus = (()=>{
    var isGlfBusy = false;
    var processTime = 0;
	var filterGLInterface;
    var time = 500;
    var loading = 0;
    var currentDialog;
    var timeoutHandle;
    const imageList = [];
    const watchSprites = [];
    var hasAnimated = false;
    var animatedSprites = [];
    const dialog = { width: 18, argNameWidth: 6, sliderColor: "rgb(34, 68, 105)", grid: 18 }
    const markers = [];
    const filterQueue = [];
    const processList = [];
    const jobStack = [];
    var closeAfterQueue = false;
    function updateMarkers(fspr, args) {
        for(const mark of markers) {
            var spr = mark.spr;
            if (spr && spr.type.marker) {
                var x = spr.x;
                var y = spr.y;
                fspr.key.toLocalP(x, y, mark.pos);
                args[mark.argIndex][0] = mark.pos.x / (fspr.w * fspr.sx);
                args[mark.argIndex][1] = mark.pos.y / (fspr.h * fspr.sy);
				if(args[mark.argIndex].length > 2) {
					args[mark.argIndex][2] = fspr.rx - spr.rx;
					if(args[mark.argIndex].length > 3) {
						args[mark.argIndex][3] = fspr.ry - spr.ry;
					}
				}
            }
        }
    }
    function checkMarkerUpdate() {
        var markerDelete = false;
        if (markers.length === 0) { return }
        var needUpdate = false;
        for(const spr of watchSprites) {
            if (spr.changeCount) {
                needUpdate = true
                spr.changeCount--;
            }
        };
        for(const mark of markers) {
            var spr = mark.spr;
            if (spr.deleted) {
                markerDelete = true;
            } else if (spr.changeCount) {
                needUpdate = true
                spr.changeCount--;
            }
        }
        if (markerDelete) {
            let i = 0;
            while (i < markers.length) {
                if (markers[i].spr.deleted) {
                    markers.splice(i--,1);
                }
                i++;
            }
        }
        setTimeout(()=>{
            if (currentDialog) {
                if (needUpdate && currentDialog.preview) {
                    filterWhenNotBusy(applyFilter, currentDialog.filter, false, currentDialog.args);
                }
                extraRenders.addOneTime(checkMarkerUpdate);
            }
        },0);
    }
    const activePallets = [];
    function closePallet(pallet) {
        if (pallet && pallet.isPallet) {
            const idx = activePallets.indexOf(pallet);
            if (idx > -1) {
                pallet.removeEvent("updated", palletUpdated);
                activePallets.splice(idx, 1);
                log("WebGL pallet event removed");
            }
        }
    }
    function closePallets() {
        while (activePallets.length) {
            closePallet(activePallets[activePallets.length - 1]);
        }
    }
    function addPallet(pallet) {
        activePallets.push(pallet);
        pallet.addEvent("updated", palletUpdated);
        log("WebGL pallet event added");
    }
    function palletUpdated() {
        setTimeout(()=>{
            if (currentDialog.preview) {
                filterWhenNotBusy(applyFilter, currentDialog.filter, false, currentDialog.args);
                log("WebGL pallet update debounced");
            }
        },0);
    }
    function animationUpdate() {
        for(const idx of animatedSprites) {
            const item = imageList[idx];
            if (item.spr.image !== item.image) {
                if (item.image.processed) { item.image.restore() }
                item.image = item.spr.image;
                 applyFilterToListImage(item, currentDialog.filter , currentDialog.args);
            }
        }
    }
    function clearTempRenderedCanvas() {
        imageList.forEach(item => item.image.filterCanvas = undefined );
    }
	function paintFilterStart(spr, filter, args) {
		for (const arg of args) {
			if (arg.isSpriteSrc) {
				arg.texture1.fromCanvas(spr.image);
			}
		}
	}
	function applyPaintFilter(spr, overlay, filter, args) {
        isGlfBusy = true;
		clearTimeout(timeoutHandle);
        timeoutHandle = undefined;
		updateMarkers(spr, args);
		if (!filter.webGLFilters.isSourceTextureSet()) {
			filter.webGLFilters.sourceTexture = filter.webGLFilters.createTexture();
		}
        filter.webGLFilters.setSource(overlay);
		for (const arg of args) {
			if (arg.isSpriteSrc && arg.sprite !== spr) { arg.sprite = spr; }
		}
		filter.callback(...args);
        isGlfBusy = false;
	}
    function applyTempFilter(filter, args) {
        isGlfBusy = true;
        //log("T:");
        clearTimeout(timeoutHandle);
        timeoutHandle = undefined;        
        clearTempRenderedCanvas();
        imageList.forEach(item => {
            const image = item.image;
            if (!image.filterCanvas) {
                updateMarkers(item.spr, args);
                if (!filter.webGLFilters.isSourceTextureSet()) { filter.webGLFilters.sourceTexture = filter.webGLFilters.createTexture(image, image.width, image.height); }
                filter.webGLFilters.setSource(image);
				if(args[0] && args[0].isSpriteSrc) {
					args[0].sprite = item.spr
					filter.callback(...args).show();
					image.filterCanvas = filter.webGLFilters.canvas;
				} else {
					filter.callback(...args).show();
					image.filterCanvas = filter.webGLFilters.canvas;
				}
            }
            return false;
        });
        isGlfBusy = false;
    }
    function restoreProcessed() {

        imageList.forEach(item => { if (item.image.processed) { item.image.restore(); log([item.image._ID, item.image.desc.mirror._ID,item.image.desc.undoCan._ID]+""); } });
    }
    function updateProcessed() {

        imageList.forEach(item => { if (item.image.processed) { item.image.update(); log([item.image._ID, item.image.desc.mirror._ID,item.image.desc.undoCan._ID]+""); } });
    }
    function applyFilterToListImage(item, filter, args) {
        isGlfBusy = true;
        const image = item.image;
        updateMarkers(item.spr, args);
        if (!filter.webGLFilters.isSourceTextureSet()) {
            filter.webGLFilters.sourceTexture = filter.webGLFilters.createTexture(image.desc.mirror, image.width, image.height);
        }
        filter.webGLFilters.setSource(image.desc.mirror);
		if(args[0].isSpriteSrc) { args[0].sprite = item.spr }
        filter.callback(...args).show();
        image.ctx.setTransform(1,0,0,1,0,0);
        image.ctx.clearRect(0,0, image.width, image.height);
        image.ctx.drawImage(filter.webGLFilters.canvas,0,0);
        image.processed = true;
        isGlfBusy = false;
    }
    function processFilterQueue(filter, args) {
        const busyId = busy.start("WebGL");
        function next() {
            isGlfBusy = true;
            if (filterQueue.length) {
                const item = filterQueue.shift();
                busy.text = "WebGL-"+ filterQueue.length;
                if (item.image.processed === false) {
                    applyFilterToListImage(item, filter, args);
                    processList.push(item.image);
                    isGlfBusy = false;
                    setTimeout(next,10);
                } else {
                    isGlfBusy = false;
                    setTimeout(next,1);
                }
            } else {
                processList.forEach(image => { if (image.processed) { image.update() } });
                busy.end(busyId);
                processList.length = 0;
                if (closeAfterQueue) {
                    closeAfterQueue();
                    closeAfterQueue = undefined;
                }
                isGlfBusy = false;
            }
        }
        setTimeout(next,10);
    }
    function applyFilter(filter, apply, args, UICallback) {
  
        isGlfBusy = true;
        restoreProcessed();
        clearTempRenderedCanvas();
        const now = performance.now();
        imageList.forEach(item => {
            const image = item.image;
            updateMarkers(item.spr, args);
            if (!filter.webGLFilters.isSourceTextureSet()) { filter.webGLFilters.sourceTexture = filter.webGLFilters.createTexture(image.desc.mirror, image.width, image.height); }
            filter.webGLFilters.setSource(image.desc.mirror);
            filter.callback(...args).show();
            image.ctx.setTransform(1,0,0,1,0,0);
            image.ctx.clearRect(0,0, image.width, image.height);
            image.ctx.drawImage(filter.webGLFilters.canvas,0,0);
            image.processed = true;
        });
        if (hasAnimated && apply) {
            for(const idx of animatedSprites) {
                const item = imageList[idx];
                const spr = item.spr;
                spr.animation.tracks.image.eachKey(key => {
                    if (key.value.processed === false) { filterQueue.push({spr, image: key.value}); }
                    else { processList.push(key.value); }
                });
            }
            if (filterQueue.length > 0) {
                processFilterQueue(filter, args);
                processTime = performance.now() - now;
                isGlfBusy = false;
                return;
            }
            processList.forEach(image => { if (image.processed) { image.update() } });
            processList.length = 0;
            processTime = performance.now() - now;
            if (closeAfterQueue) {
                closeAfterQueue();
                closeAfterQueue = undefined;
            }
            isGlfBusy = false;
            return;
        }
        if (apply) { updateProcessed();  }

        processTime = performance.now() - now;
    
        if (closeAfterQueue && apply) {
            closeAfterQueue();
            closeAfterQueue = undefined;
        } else if(filter.updateArguments) {
			filter.updateArguments = false;
			if(UICallback) { UICallback() }
		}
        isGlfBusy = false;
    }
    function clearJobStack() {
        jobStack.length = 0;
        if (jobStack.hasPending) {
            extraRenders.removeOneTimeStack(rendersCallback);
            jobStack.hasPending = false;
        }
        clearTimeout(timeoutHandle);
        timeoutHandle = undefined;        
    }
    function rendersCallback() {
        if (!API.filterDialogOpen) {
            jobStack.hasPending = false;
            jobStack.length = 0;
            isGlfBusy = false;
            log.warn("Dialog closed before jobs completed!");
            return;
        }
        if ((isGlfBusy || timeoutHandle) && jobStack.length) {
            extraRenders.addOneTime(rendersCallback);
            jobStack.hasPending = true;
        } else if (jobStack.length) {
            const call = jobStack.shift();
            if (jobStack.length) {
                extraRenders.addOneTime(rendersCallback);
                jobStack.hasPending = true;
            } else { jobStack.hasPending = false; }            
             const hdl = timeoutHandle = setTimeout(()=>{log("CC Call hdl: " + hdl); call[0](...call.slice(1))}, 18);
            log("New hdl: " + timeoutHandle);
        } else { jobStack.hasPending = false;  }
    }
    function filterWhenNotBusy(call, filter, ...args) {
        if (isGlfBusy) {
            if (filter.webGLFilters.hasError()) {
                log.warn("WebGL filters encountered an error. Continued use may have undefined behaviour.");
                isGlfBusy = false;
            }
        }
        //if (isGlfBusy || jobStack.hasPending || jobStack.length) {
       //     if (jobStack.length > 10) {
       //         jobStack[jobStack.length - 1] = [call, filter, ...args];
       //     } else {
       //         jobStack.push([call, filter, ...args]);
       //     }
            //if (!jobStack.hasPending) {
            //    extraRenders.addOneTime(rendersCallback);
            //    jobStack.hasPending = true;
            //}
        //} else {
            //const hdl = timeoutHandle = setTimeout(()=> {
            //        log("Call hdl: " + hdl); 
                    call(filter, ...args);
            //        while (jobStack.length) {
            //            const call = jobStack.shift();
            //            call[0](...call.slice(1));
            //        }
            //    }, 18
            //);
            //log("New hdl: " + timeoutHandle);
        //}
    }
    
    function getFilterArgs(filterName) {
        const filter = filterGLInterface.filters.getFilter(filterName);
        const args = [];
        var x, y, com = commands.webGLFilterArgsBase + 1;
        var idx =0;
        const pArgs = filter.prevArgs;
        if (pArgs) { return pArgs }
        const getPArg = arg => pArgs ? pArgs[idx++] : arg;
        filter.arguments.forEach(arg => {
            const range = arg.range;
            var argA;
            if (arg.type === "Number") { // use a slider
                argA = getPArg(range.def);
                args.push(argA);
            } else if (arg.type === "HexColor") {
                argA = getPArg(range.def);
                if (Array.isArray(argA)) {
                    args.push(argA);
                } else {
                    args.push([r, g, b,255]);
                }
            } else if (arg.type === "Vec2" || arg.type === "Vec3" || arg.type === "Vec4") {
                var count = markers.length;
                var i = 0;
                var index = sprites.eachOfType(spr=>{
                    if (i === count) { return true}
                    i++
                },"marker");
                if (index !== undefined) {
                    sprites[index].marker = arg.name;
					const pos = arg.type === "Vec2" ? {x: 0, y: 0} : arg.type === "Vec3" ? {x: 0, y: 0, rx: 0} : {x: 0, y: 0, rx: 0, ry: Math.PI / 2};
                    markers.push({spr: sprites[index], index, argIndex: args.length, pos });
                }
                argA = getPArg(range.def);
                args.push(range.def);
			} else if (arg.type === "Sprite") {
				argA = getPArg(range.def);
				if(argA === null) {
					//log("Sprite argument created in get arguments");
					argA = {
						texture: filter.webGLFilters.createTexture(),
						texture1: filter.webGLFilters.createTexture(),
						isSpriteSrc: true,
					};
				}
				args.push(argA);
            } else if (arg.type === "Canvas") {
				argA = getPArg(range.def);
				if(!isNaN(argA)) {
					argA = media.byGUID(argA);
					if (argA === undefined || !argA.isDrawable) { argA = null }
					else {
						const arg = {ctx: argA.desc.mirror.ctx};
						arg.media = argA;
						arg.name = argA.desc.name;
						arg.imageName = argA.desc.name;
						arg.guid = argA.guid;
                        log ("getFilterArgs Got media " + arg.name);
                        argA = arg;
					}
                }
				args.push(argA);
            } else if (arg.type === 1) {
				argA = getPArg(range.def);
				if(!isNaN(argA)) {
					argA = media.byGUID(argA);
					if (argA === undefined) { argA = null }
					else {
						const arg = argA;
						argA = filter.webGLFilters.createTexture(arg.desc.mirror, arg.w, arg.h);
						argA.imageName = arg.desc.name;
						argA.guid = arg.guid;
					}
				}
				args.push(argA);
            } else if (arg.type === "Boolean") {
                argA = getPArg(range.def);
                args.push(argA);
            } else if (arg.type === "String") {
                argA = getPArg(range[0]);
                args.push(argA);
            } else {
                argA = getPArg(null);
                args.push(null);
            }
        });
        return args;
    }
    function createFilterDialog(filterName) {
		API.paintFilter = false;
        imageList.length = 0;
        watchSprites.length = 0;
        animatedSprites.length = 0;
        hasAnimated = false;
        selection.eachImage((spr, image) => {
            if (image.isDrawable && !image.isLocked) {
                imageList.push({spr, image})
                if (spr.type.animated && spr.animation.tracks.image) {
                    hasAnimated = true;
                    animatedSprites.push(imageList.length - 1);
                }
            }
        });
        var imagesToProcess = imageList.length;
        if (imagesToProcess === 0) {
            log.warn("There are no drawable images selected");
            if (selection.length > 0) {
                log.sys("Ensure that any images are maked as draw on");
            }
            return;
        }
        if (hasAnimated) {
            animation.addEvent("change", animationUpdate);
        }
        processTime = 0;
        const filter = filterGLInterface.filters.getFilter(filterName);
		if (filter.prevFilterType !== undefined) { filter.prevFilterType = undefined }
        const args = [];
        var x, y, com = commands.webGLFilterArgsBase + 1;
        const buts = [];
        const nw = dialog.argNameWidth;
        const sWidth = dialog.width - dialog.argNameWidth;
        const bWidth = dialog.width / 2 - 1 | 0;
        x = 0;
        y = 0;
        markers.length = 0;
        var previewOn = false;
        var dialogButMap = new Map();
        function setButtons(buttons) {
            for (const but of buttons) { dialogButMap.set(but.command, but) }
            return buttons
        }
        function closeDialog() {
            pannel = undefined;
            handler.close();
        }
        var pannel = buttons.FloatingPannel($("#floatingContainer")[0],{title: "Web GL "+ filterName, width: dialog.width*dialog.grid, onclosing: closeDialog});
        if (!pannel) {return}
        var idx =0;
        const pArgs = filter.prevArgs;
        const getPArg = arg => pArgs ? pArgs[idx++] : arg;
        filter.arguments.forEach(arg => {
            const range = arg.range;
            var argA,nameBut;
            if (arg.type === "Number") { // use a slider
                buts.push(nameBut = {x, y, w: nw, h: 1,  command: commands.displayOnly, text: arg.name, help: arg.description});
                argA = getPArg(range.def);
                buts.push({x: x + nw, y, w: sWidth, h: 1, command: com++, nameBut, slider: {
                    color: dialog.sliderColor,
                    min: range.min,
                    max: range.max,
                    step: range.step,
                    wStep:  range.step,
                    value: argA,
                    valueDisplayExtra: 12, // give more room to the numeric display
                    decimals: Math.ceil(Math.log10(1 / range.step)),
                }});
                args.push(argA);
            } else if (arg.type === "HexColor") {
                buts.push(nameBut = {x, y, w: nw, h: 1,  command: commands.displayOnly, text: arg.name, help: arg.description + "\n[LEFT] click to assign main color from pallet\n[RIGHT] click to request color picker to select color"});
                argA = getPArg(range.def);
                if (Array.isArray(argA)) {
                    const rgb = "rgb(" + argA[0] +","+argA[1]+ ","+argA[2] + ")";
                    buts.push({x: x + nw, y, w: sWidth, h: 1, command: com++,nameBut, background: rgb, text: "", help: arg.description + "\n[LEFT] click to assign main color from pallet\n[RIGHT] click to request color picker to select color"});
                    args.push(argA);
                } else {
                    buts.push({x: x + nw, y, w: sWidth, h: 1, command: com++,nameBut, background: range.def, text: "", help: arg.description + "\n[LEFT] click to assign main color from pallet\n[RIGHT] click to request color picker to select color"});
                    const r = parseInt(range.def.substring(1,3),16);
                    const g = parseInt(range.def.substring(3,5),16);
                    const b = parseInt(range.def.substring(5,7),16);
                    args.push([r, g, b, 255]);
                }
            } else if (arg.type === "Vec2" || arg.type === "Vec3" || arg.type === "Vec4") {
                var count = markers.length;
                var i = 0;
                var index = sprites.eachOfType(spr=>{
                    if (i === count) { return true}
                    i++
                },"marker");
                if (index === undefined) {
                    issueCommand(commands.edSprCreateMarker);
                    i = 0;
                    index = sprites.eachOfType(spr=>{
                        if (i === count) { return true }
                        i++
                    },"marker");
                }
                if (index !== undefined) {
                    sprites[index].marker = arg.name
					const pos = arg.type === "Vec2" ? {x: 0, y: 0} : arg.type === "Vec3" ? {x: 0, y: 0, rx: 0} : {x: 0, y: 0, rx: 0, ry: Math.PI / 2};
                    markers.push({spr: sprites[index], index, argIndex: args.length, pos});
                }
                if (watchSprites.length === 0) {
                    imageList.forEach(item => {
                        sprites.eachOfType(spr => {
                            if (imageList.some(item => item.image.guid === spr.image.guid)) {
                                watchSprites.push(spr);
                            }
                        },"image");
                    });
                }
                argA = getPArg(range.def);
                args.push(range.def);
                com++;
            } else if (arg.type === "Sprite") { // only for use with paint filters and webGL2
				if(range && range.def !== undefined) {
					argA = getPArg(range.def);
					if(argA === null) {
						//log("Sprite argument created.");
						argA = {
							texture: filter.webGLFilters.createTexture(),
							texture1: filter.webGLFilters.createTexture(),
							isSpriteSrc: true,
						};
					}
					args.push(argA);
					com++;
				} else {
					argA = getPArg(null);
					com++;
					args.push(null);
				}
				API.paintFilter = true;
            } else if (arg.type === "Image") {
				if(range && range.def !== undefined) {
					argA = getPArg(range.def);
					if(!isNaN(argA)) {
						argA = media.byGUID(argA);
						if (argA === undefined) { argA = null }
						else {
							const arg = argA;
							argA = filter.webGLFilters.createTexture(arg.desc.mirror, arg.w, arg.h);
							argA.imageName = arg.desc.name;
							argA.guid = arg.guid;
						}
					}
					if(argA === null) {
						buts.push({x, y, w: dialog.width, h: 1,  group: arg.name, command: com++, text: arg.name, help: arg.description});
					} else {
						buts.push({x, y, w: dialog.width, h: 1,  group: arg.name, command: com++, text: arg.name + ": " + argA.imageName, help: arg.description});
					}
					args.push(argA);
				} else {
					argA = getPArg(null);
					com++;
					args.push(null);
				}
            } else if (arg.type === "Canvas") {
				if(range && range.def !== undefined) {
					argA = getPArg(range.def);
					if(!isNaN(argA)) {
                        argA = media.byGUID(argA);
                        if (argA === undefined || !argA.isDrawable) { argA = null }
                        else {
                            const arg = {ctx: argA.desc.mirror.ctx};
                            arg.media = argA;
                            arg.name = argA.desc.name;
                            arg.imageName = argA.desc.name;
                            arg.guid = argA.guid;
                            log ("createFilterDialog Got media " + arg.name);
                            argA = arg;
                        }
					}
					if(argA === null) {
						buts.push({x, y, w: dialog.width, h: 1,  group: arg.name, command: com++, text: arg.name, help: arg.description});
					} else {
						buts.push({x, y, w: dialog.width, h: 1,  group: arg.name, command: com++, text: arg.name + ": " + argA.imageName, help: arg.description});
					}
					args.push(argA);
				} else {
					argA = getPArg(null);
					com++;
					args.push(null);
				}
            } else if (arg.type === "Boolean") {
                argA = getPArg(range.def);
                buts.push({x, y, w: dialog.width, h: 1,  group: arg.name, command: com++, text: arg.name, help: arg.description});
                args.push(argA);
            } else if (arg.type === "String") {
                buts.push(nameBut = {x, y, w: nw, h: 1,  command: commands.displayOnly, text: arg.name, help: arg.description});
                argA = getPArg(range[0]);
                buts.push({x: x + nw, y, w: sWidth, h: 1, command: com++,nameBut, selection: {
                    items: range,
                    itemHelp: arg.itemHelp,
                    index: range.indexOf(argA),
                }});
                args.push(argA);
            } else {
                argA = getPArg(null);
                com++;
                args.push(null);
            }
            y += 1;
        })
		if(API.paintFilter) {
			buttons.create(setButtons([
					...buts,
					{x: 0, y: y++, w: dialog.width, h: 1, command: commands.webGLFilterReset, text: "Reset", help: "Resets filter setting to default"},
					{x: 0, y: y++, w: dialog.width, h: 1, command: commands.webGLFilterCommandLineString, text: "Command Line String", help: "Adds filter and setting to command line"},
					{x: dialog.width- bWidth, y: y++, w: bWidth, h: 1, command: commands.webGLFilterClose, text: "OK", help: "Exit this filter"},
				]), {pannel, size: dialog.grid }
			);
		} else {
			 y += 1;
			buttons.create(setButtons([
					...buts,
					{x: 0, y: y++, w: dialog.width, h: 1, group: "filterPreview", command: commands.webGLFilterPreview, text: "Preview", help: "Toggle filter preview"},
					{x: 0, y: y++, w: dialog.width, h: 1, command: commands.webGLFilterApply, text: "Apply", help: "Applies the filter to all selected drawable images"},
					{x: 0, y: y++, w: dialog.width, h: 1, command: commands.webGLFilterReset, text: "Reset", help: "Resets filter setting to default"},
					{x: 0, y: y++, w: dialog.width, h: 1, command: commands.webGLFilterCommandLineString, text: "Command Line String", help: "Adds filter and setting to command line"},
					{x: 0, y: 0.5 + y, w: bWidth, h: 1.5, command: commands.webGLFilterCancel, text: "Cancel", help: "Cancel the filter"},
					{x: dialog.width- bWidth, y: 0.5 + y++, w: bWidth, h: 1.5, command: commands.webGLFilterClose, text: "OK", help: "Apply and exit"},
				]), {pannel, size: dialog.grid }
			);
		}
		function updateUI() {
			const filter = filterGLInterface.filters.getFilter(filterName);
			var x, y, com = commands.webGLFilterArgsBase + 1;
			filter.arguments.forEach(arg => {
				if(arg._hide === true) {
					const b = dialogButMap.get(com);
					b.disable();
					if (b.nameBut) { b.nameBut.disable() }
				} else if(arg._hide === false) {
					const b = dialogButMap.get(com);
					b.enable();
					if (b.nameBut) { b.nameBut.enable() }
					if(arg._name) {
						if(b.nameBut) {
							b.nameBut.updateText(arg._name);
							b.nameBut.element.title = arg._description;
						}
						b.element.title = arg._description;
					}
				}
				com++;
			});
		}
		function resetFilter() {
			const filter = filterGLInterface.filters.getFilter(filterName);
			var x, y, com = commands.webGLFilterArgsBase + 1;
			var idx = 0;
			filter.arguments.forEach(arg => {
				if (arg.type === "Number") {
					const slide = dialogButMap.get(com++);
					slide.slider.value = arg.range.def;
					slide.slider.silent = true;
					slide.element.updateValue();
					slide.slider.silent = false;
					args[idx++] = arg.range.def;
				} else if (arg.type === "HexColor") {
					const col = dialogButMap.get(com++);
					const r = parseInt(arg.range.def.substring(1,3),16);
					const g = parseInt(arg.range.def.substring(3,5),16);
					const b = parseInt(arg.range.def.substring(5,7),16);
                    args[idx][0] = r;
                    args[idx][1] = g;
                    args[idx][2] = b;
                    col.element.style.background = "rgb(" + r +","+ g + ","+ b + ")";
					idx++;
				} else if (arg.type === "Canvas") {
					args[idx] = null;
					dialogButMap.get(com).updateText(filter.arguments[idx].name + ":");
					idx ++;
					com ++;
				} else if (arg.type === "Image") {
					args[idx] = null;
					dialogButMap.get(com).updateText(filter.arguments[idx].name + ":");
					idx ++;
					com ++;
				} else if (arg.type === "Boolean") {
					buttons.groups.setRadio(dialogButMap.get(com).group, arg.range.def ? com : -1);
					args[idx++] = arg.range.def;
					com ++;
				} else if (arg.type === "String") {
					args[idx++] = arg.range[0];
					const button = dialogButMap.get(com++);
					button.selection.selectItem(0, true); // true for silent update
				} else {
					com++;
					idx++;
				}
			});
		}
        var handler = {
			pannel,
            filter,
            preview: false,
            args,
            commands: {
                update: false,
                [commands.webGLFilterUpdateDialog](state) {  this.update = true; },
                [commands.webGLFilterPreview](state) { 
 					if(!API.paintFilter) {
						if (state !== undefined) { previewOn = state; }
						else { previewOn = !previewOn; }
						handler.preview = previewOn;
						buttons.groups.setRadio(dialogButMap.get(commands.webGLFilterPreview).group, previewOn ? commands.webGLFilterPreview : -1);
						if (previewOn) {
							this.update = true;
                            return;
						}
                        restoreProcessed();
					}
                    return false;    
                },
                [commands.webGLFilterCommandLineString](state) {
                    commandLine("filter " + filter.name + " " + args.join(" "), false, true);
                    return false;
                },
                [commands.webGLFilterApply](state) { 
                    filterWhenNotBusy(applyFilter, filter, true, args);
                    filter.prevArgs = args;
                    this.update = true;                
                },
                [commands.webGLFilterReset](state) { 
					resetFilter();
					this.update = true;               
                },
                [commands.webGLFilterCancel](state) { 
                    clearTempRenderedCanvas();
                    restoreProcessed();
                    pannel.closeElement.close();   
                    return false;     
                },
                [commands.webGLFilterClose](state) { 
                    clearJobStack();
					if(API.paintFilter) {
						filter.prevArgs = args;
						pannel.closeElement.close();
					} else {
						clearTempRenderedCanvas();
						closeAfterQueue = pannel.closeElement.close;
						applyFilter(filter, true, args);
						filter.prevArgs = args;
					}
					return false;               
                },
            },
            command(commandId, state) {
                var update = false;
                if (handler.commands[commandId]) {
                    handler.commands.update = false;
                    if (handler.commands[commandId](state) === false) { return }
                    update = handler.commands.update;
                }
                /*if (commandId === commands.webGLFilterUpdateDialog) {
                    update = true;
                } else if (commandId === commands.webGLFilterPreview) {
					if(!API.paintFilter) {
						if (state !== undefined) { previewOn = state; }
						else { previewOn = !previewOn; }
						handler.preview = previewOn;
						buttons.groups.setRadio(dialogButMap.get(commandId).group, previewOn ? commands.webGLFilterPreview : -1);
						if (previewOn) {
							update = true;
						} else {
							restoreProcessed();
						}
					}
                } else if (commandId === commands.webGLFilterCommandLineString) {
                    let cmd = "filter " + filter.name + " " + args.join(" ");
                    commandLine(cmd, false, true);
                    return;
                } else if (commandId === commands.webGLFilterClose) {
					if(API.paintFilter) {
						filter.prevArgs = args;
						pannel.closeElement.close();
					} else {
                        clearJobStack();
						clearTempRenderedCanvas();
						closeAfterQueue = pannel.closeElement.close;
						applyFilter(filter, true, args);
						filter.prevArgs = args;
					}
					return;
                } else if (commandId === commands.webGLFilterApply) {
                    filterWhenNotBusy(applyFilter, filter, true, args);
                    filter.prevArgs = args;
                    update = true;
                } else if (commandId === commands.webGLFilterReset) {
					resetFilter();
					update = true;
                } else if (commandId === commands.webGLFilterCancel) {
                    clearTempRenderedCanvas();
                    restoreProcessed();
                    pannel.closeElement.close();
                } else */
                if (commandId > commands.webGLFilterArgsBase && commandId < commands.webGLFiltersEnd) {
                    var argIdx = commandId - commands.webGLFilterArgsBase - 1;
                    if (filter.arguments[argIdx].type === "Number") {
                        const slide = dialogButMap.get(commandId);
                        if (args[argIdx] !== slide.slider.value) {
                            args[argIdx] = slide.slider.value;
                            update = true;
                        }
                    } else if (filter.arguments[argIdx].type === "HexColor") {
                        if (args[argIdx][3] && args[argIdx][3].isPallet) {
                            closePallet(args[argIdx][3]);
                        }
                        if ((mouse.oldButton & 4) === 4) {
                            const argIdxCP = args[argIdx];
                            const colCommandId = commandId;
                            colours.command(commands.colorPicker)
                                .then(col => {
                                    if (col) {
                                        argIdxCP[0] = col.r;
                                        argIdxCP[1] = col.g;
                                        argIdxCP[2] = col.b;
                                        dialogButMap.get(commandId).element.style.background = col.css;
                                        if (argIdxCP.length > 3) { argIdxCP.pop() }
                                        handler.command(commands.webGLFilterUpdateDialog);
                                    }
                                }).catch(()=>{});
                            return;
                        } else {
                            if (selection.length === 1 && selection[0].type.pallet) {
                                const p = args[argIdx][3] = selection[0].pallet;
                                addPallet(selection[0].pallet);
                                p.getRGBArray(0,args[argIdx]);
                                dialogButMap.get(commandId).element.style.background = p.getCSS(0);
                            } else {
                                args[argIdx][0] = colours.mainColor.r;
                                args[argIdx][1] = colours.mainColor.g;
                                args[argIdx][2] = colours.mainColor.b;
                                dialogButMap.get(commandId).element.style.background = colours.mainColor.css;
                                if (args[argIdx].length > 3) { args[argIdx].pop() }
                            }
                        }
                         update = true;
                    } else if (filter.arguments[argIdx].type === "Image") {
						if(selection.length === 1) {
							if(selection[0].type.image) {
								args[argIdx] = filter.webGLFilters.createTexture(selection[0].image.desc.mirror, selection[0].image.w, selection[0].image.h);
								args[argIdx].imageName = selection[0].image.desc.name;
								args[argIdx].guid = selection[0].image.guid;
								dialogButMap.get(commandId).updateText(filter.arguments[argIdx].name + ": " + args[argIdx].imageName);
								update = true;
							} else {
								log.warn("Selected sprite is not an image.");
							}
						} else {
							if(args[argIdx]) {
								args[argIdx] = null;
								dialogButMap.get(commandId).updateText(filter.arguments[argIdx].name + ":");
								update = true;
							}else {
								log.warn("Select one image sprite.");
							}
						}
                    } else if (filter.arguments[argIdx].type === "Canvas") {
						if(selection.length === 1) {
							if(selection[0].type.image) {
                                if (selection[0].image.isDrawable) {
                                    args[argIdx] = {ctx: selection[0].image.desc.mirror.ctx};
                                    args[argIdx].media = selection[0].image;
                                    args[argIdx].name = selection[0].image.desc.name;
                                    args[argIdx].imageName = selection[0].image.desc.name;
                                    args[argIdx].guid = selection[0].image.guid;
                                    dialogButMap.get(commandId).updateText(filter.arguments[argIdx].name + ": " + args[argIdx].imageName);
                                    update = true;
                                    log("createFilterDialog got media " + args[argIdx].name );
                                } else {
                                    log.warn("Selected media sprite must be drawable.");
                                }
							} else {
								log.warn("Selected sprite is not an image.");
							}
						} else {
							if(args[argIdx]) {
								args[argIdx] = null;
								dialogButMap.get(commandId).updateText(filter.arguments[argIdx].name + ":");
								update = true;
							}else {
								log.warn("Select one image sprite.");
							}
						}
                    }  else if (filter.arguments[argIdx].type === "Boolean") {
                        args[argIdx] = !args[argIdx];
                        buttons.groups.setRadio(dialogButMap.get(commandId).group, args[argIdx] ? commandId : -1);
                        update = true;
                    } else if (filter.arguments[argIdx].type === "String") {
                        const button = dialogButMap.get(commandId);
                        args[argIdx] = button.selection.items[button.selection.index];
                        update = true;
                    }
                }
				if (update) {
                    //filterWhenNotBusy(applyTempFilter, filter, args);
                    filterWhenNotBusy(applyFilter, filter, false, args, updateUI);
                }
            },
            close() {
				if(!API.paintFilter) { log("Filter time: " + processTime.toFixed(3) + "ms"); }
                closePallets();
                API.filterDialogOpen = false;
                currentDialog = undefined;
                markers.length = 0;
                imageList.length = 0;
                watchSprites.length = 0;
                animatedSprites.length = 0;
				if (filter.prevArgs) {
					filter.arguments.forEach((arg, idx) => {
						if(arg.type === "Sprite") {
							if(filter.prevArgs[idx]) {  // to prevent holding texture in memory
								filter.prevArgs[idx].texture.destroy();
								filter.prevArgs[idx].texture1.destroy();
								filter.prevArgs[idx].texture = undefined;
								filter.prevArgs[idx].texture1 = undefined;
								filter.prevArgs[idx].sprite = undefined;
								filter.prevArgs[idx] = null;
							}
						}else if(arg.type === "Image" || arg.type === "Canvas") {
							if(filter.prevArgs[idx]) {  // to prevent holding texture in memory
								if(isNaN(filter.prevArgs[idx]) && filter.prevArgs[idx].guid) {
									filter.prevArgs[idx] = filter.prevArgs[idx].guid;
								}
							}
						}
					});
				}
                if (hasAnimated) { animation.removeEvent("change", animationUpdate) }
            }
        }
        com = commands.webGLFilterArgsBase + 1;
        filter.arguments.forEach((arg, i) => {
            if (arg.type === "Number") {
                const slide = dialogButMap.get(com);
                slide.slider.value = args[i];
                slide.element.updateValue();
            } else if (arg.type === "Boolean") {
                buttons.groups.setRadio(dialogButMap.get(com).group, args[i] ? com : -1);
            } else if (arg.type === "String") {
            }
            com ++;
        });
        handler.command(commands.webGLFilterPreview, true)
        API.filterDialogOpen = true;
        currentDialog = handler;
        extraRenders.addOneTime(checkMarkerUpdate);
		API.updatePaintStatus();
    }
    const API = {
		paintFilter: false,
        filterDialogOpen: false,
        filterDialog(filterName) {
            if (API.filterDialogOpen) { return }
            createFilterDialog(filterName);
        },
        command(commandId) { if (currentDialog) { currentDialog.command(commandId) } },
        applyTempFilter() {
            if (API.filterDialogOpen) {
                var i = 0;
                var filterImageHasChange = false;
                var hasChange = false;
                for (const img of imageList) {
                    if (img.spr.image.changed === frameCount || img.spr.drawOn) {
                        filterImageHasChange = true;
                        break;
                    }
                }
                if (!filterImageHasChange) {
                    for (const a of currentDialog.filter.arguments) {
                        if (a && a.type === "Canvas") {
                            if (currentDialog.args[i] && currentDialog.args[i].media.changed === frameCount && !currentDialog.args[i].media.restored) {
                                hasChange = true;
                                break;
                            }
                        }
                        i ++;
                    }
                }
                if (filterImageHasChange || hasChange) {
                    if (!isGlfBusy) {
                        isGlfBusy = true;
                        applyTempFilter(currentDialog.filter, currentDialog.args);
                        isGlfBusy = false;
                    } else {
                        filterWhenNotBusy(applyTempFilter, currentDialog.filter, currentDialog.args);
                    }
                }
            }
        },
		updatePaintStatus() {
			if (API.filterDialogOpen && API.paintFilter) {
				currentDialog.pannel.setTitleText(currentDialog.pannel.setting.title + (pens.canUseWebGLPaintFilter ? " Active" : " OFF"));
			}
		},
		paintFilterStrokeStart(spr) {
			if (API.filterDialogOpen && API.paintFilter) {  paintFilterStart(spr, currentDialog.filter, currentDialog.args) }
		},
		applyPaintFilter(spr, overlay = spr.image) {
			if (API.filterDialogOpen && API.paintFilter) {
                //clearJobStack();
                filterWhenNotBusy(applyPaintFilter, spr, overlay, currentDialog.filter, currentDialog.args);
            }
		},
        get extras() {
            const extras = {
				foldInfo: {
					foldClass: "extrasImageProcessingWebGL",
				},
			};
            for(const foldName of Object.keys(glFilters.named)) {
                extras[foldName] = {
					foldInfo: {
						foldClass: "extrasWGL_F" + foldName,
					}
				}
                const fold = extras[foldName];
                glFilters.named[foldName].forEach(displayName => {
					var glI;
					if (Array.isArray(displayName)) {
						glI =  displayName[0];
						displayName = displayName[1];
					} else {
						glI = "webGL";
					}
                    const name = displayName.indexOf("_") > -1 ? displayName.replace(/_/g,"") : displayName;
                    fold[displayName] = {
                        help: "Not yet loaded.",
                        call() {
							filterGLInterface = glI === "webGL2" ? filterGL2 : filterGL;;
                            if ((mouse.oldButton & 4) === 4) {
                                const args = getFilterArgs(name)
                                imageList.length = 0;
                                watchSprites.length = 0;
                                animatedSprites.length = 0;
                                selection.eachImage((spr, image) => {
                                    if (image.isDrawable && !image.isLocked) {
                                        imageList.push({spr, image})
                                    }
                                });
                                if (imageList.length === 0) {
                                    log.warn("No drawable selected can not apply filter");
                                } else {
                                    applyFilter(filterGLInterface.filters.getFilter(name), true, args);
                                }
                            } else {
                                API.filterDialog(name)
                            }
                        },
                    };
                });
            }
			setTimeout(() => {
				extrasList.updateByObjName("Web GL Filters","WebGL loading...");
			},100);
            return extras;
        },
        setFilterHelp() {
			extrasList.updateByObjName("WebGL loading...","WebGL Filters");
            for(const foldName of Object.keys(glFilters.named)) {
                glFilters.named[foldName].forEach(displayName => {
					if (Array.isArray(displayName)) {
						const name = displayName[1].indexOf("_") > -1 ? displayName[1].replace(/_/g,"") : displayName[1];
						const glInterface = displayName[0] === "webGL2" ? filterGL2 : filterGL;
						const filter = glInterface.filters.getFilter(name);
						extrasList.updateByObjName(displayName[1], undefined, filter.description);
					} else {
						const name = displayName.indexOf("_") > -1 ? displayName.replace(/_/g,"") : displayName;
						const filter = filterGL.filters.getFilter(name);
						extrasList.updateByObjName(displayName, undefined, filter.description);
					}
                });
            }
        },
        loadGLFilters() {
            if (typeof filterGL !== "undefined") {// && typeof filterGL2 !== "undefined") {
                glFilters.dependents.forEach(filterFile => {
                    loading += 1;
                    const filterScript = $("script",{src: "webGLFilters/"+filterFile});
                    filterScript.addEventListener("load", event => {
                        loading --;
                        if (loading === 0) {
                            glFilters.filters.forEach(filterFile => {
                                loading += 1;
                                const filterScript = $("script",{src: "webGLFilters/"+filterFile});
                                filterScript.addEventListener("load", event => {
                                    //log("Loaded filter '"+ filterFile+"'");
                                    loading --;
                                    if (loading === 0) {
                                        filterGL.create();
										//filterGL2.create();
                                        API.setFilterHelp();
                                    }
                                });
                                $$(filterScript);
                            })
                        }
                    })
                    $$(filterScript);
                });
            } else {
                if (time > 6000) {
                    log.warn("There is a problem loading webGL filters");
                    return;
                }
                setTimeout(API.loadGLFilters, time);
                time += 500;
            }
        }
    };
    return API;
})();