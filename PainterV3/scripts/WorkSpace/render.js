"use strict";


var view;
const renderMessageStack = (()=>{
    const stack = [];
    const API = {
        hasMessage : false,
        send(type, data){
            stack.push({type, data});
            API.hasMessage = true;
        },
        next() {
            if (API.hasMessage) {
                const mess = stack.shift();
                if (stack.length === 0) { API.hasMessage = false; }
                return mess;
            }
        },
    }
    return API;
})();
const render = (() => {
    const id = UID ++;
    const cid = UID ++;
    const mid = UID ++;
	const sleepMonitorTimeout = 500; // in ms
	var sleepMonitorTimeoutHdl;
	var microSleep = false;
    const ctx = mainCanvas.getContext("2d");//,{alpha:false});
    const _mainCanvas = mainCanvas;
    _mainCanvas.wheelSoak = 0;
    view = ezView({ctx : ctx});
    var useViewSprite = false;
    spriteRender.setView(view);
    editSprites.setView(view);
    widget.setView(view);
    grid.setView(view);
    heartBeat.context = ctx;
    var needAnimUpdate = false;
    var h = _mainCanvas.width;
    var w = _mainCanvas.height;
    var smoothScaling = 0;
    var lockedGuideSpr;
    var sleepTime, showMouseInfo;
    function getSettings(){
        sleepTime = (settings.sleepTime / 60) * 1000;
        showMouseInfo = (settings.showMouseInfo / 60) * 1000;
    }
    getSettings();
    settingsHandler.onchange = getSettings;
    const cMouse = {  // canvas mouse (AKA mouse over the workspace)
        over: false,
        prevOver: false,
        rx: 0,
        ry: 0,
        x: 0,
        y: 0,
        oldRx: 0,
        oldRy: 0,
        oldX: 0,
        oldY: 0,
        changedView: false,
        temp: {x:0, y:0},
        overSprites: [],
        overSpritesLength: 0,
        posStack: [],
        stackPos: 0,
        stackEnd: 0,
    };
    Object.assign(cMouse, Events(cMouse));
    mouse.cMouse = cMouse;
    var bounds;
    var inPenCommandMode = false;
    var penCommandList;
    function handleRenderMessage() {
        const mess = renderMessageStack.next();
        if (mess.type === "PenCommandList") {
            if (editSprites.drawingModeOn) {
                inPenCommandMode = true;
                penCommandList = mess.data;
                mouse.pause = true;
            } else {
                log.warn("Not in painting mode. Render can not process pen commands ");
            }
        }
    }
    function resize() {
        bounds = editContainer.getBoundingClientRect();
        w = _mainCanvas.width = bounds.width-4;
        h = _mainCanvas.height = bounds.height;
        ctx.font = "12px arial";
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        needAnimUpdate = true;
    }
    function captureViewAsCanvas() {
        media.create({
                width: _mainCanvas.width,
                height: _mainCanvas.height,
                type: "canvas",
            },
            (canvas) => {
                var {x, y} = view.toWorld(w, h);
                var xx = x;
                var yy = y;
                var {x, y} = view.toWorld(0, 0);
                canvas.desc.sprite = new Sprite(x, y, w, h);
                canvas.desc.sprite.changeImage(canvas);
                canvas.desc.sprite.scaleTo(x, y, xx, yy);
                canvas.desc.sprite.createWorldKey();
                sprites.add(canvas.desc.sprite);
            }
        );
    }
    function background() { }
    function updateViewSprite() {
        if (sprites.viewSprite) { view.widget = sprites.viewSprite }
    }
    var mButtonDownOut = false;
    function viewUpdate() {
        const vScale = view.scale;
        const lockingDist = 10 / vScale;
        const snapDist = 30 / vScale;
        if (!inPenCommandMode) {
            var used = false;
            if (!cMouse.over) {
                if (mouse.button) {
                    if (!mButtonDownOut) { mButtonDownOut = true; }
                } else if (mButtonDownOut) { mButtonDownOut = false; }
            }
            if ((mouse.button & 2) === 2) {
                if (cMouse.over && mouse.captured === 0) { mouse.requestCapture(id, _mainCanvas) }
                if (mouse.captured === id) {
                    used = true;
                    if ((mouse.button & 2) === 2) {
                        view.movePos(cMouse.x - cMouse.oldX, cMouse.y - cMouse.oldY)
                        cMouse.changedView = true;
                        needAnimUpdate = true;
                    }
                }
            }
            if (mouse.wheel && cMouse.over && (mouse.captured === 0 || mouse.captured === id)) {
                if (mouse.alt && editSprites.drawingModeOn) {
                    const steps = mouse.wheel / 120;
                    mouse.wheel = 0;
                    colours.mainWheel(steps);
                    mouse.oldButton = 0;
                } else {
                    const z = mouse.shift ? (settings.wheelScaleRate - 1) * 0.1 + 1 : settings.wheelScaleRate;
                    used = true;
                    if (view.scale < 120 && mouse.wheel > 0) {
                        view.scaleAt(cMouse.x, cMouse.y, mouse.wheel > 0 ? z : 1 / z);
                        cMouse.changedView = true;
                    } else if (view.scale > 0.020 && mouse.wheel < 0) {
                        view.scaleAt(cMouse.x, cMouse.y, mouse.wheel > 0 ? z : 1 / z)
                        cMouse.changedView = true;
                    }
                    needAnimUpdate = true;
                    mouse.wheel *= mouse.ctrl ? 0 : settings.wheelScaleResponse;
                    if (Math.abs(mouse.wheel) < 1) { mouse.wheel = 0 };
                }
            }
            if (!used && mouse.captured === id) { mouse.release(id) }
            cMouse.oldX = cMouse.x;
            cMouse.oldY = cMouse.y;
            cMouse.oldRx = cMouse.rx;
            cMouse.oldRy = cMouse.ry;
            cMouse.oldROx = cMouse.rox;
            cMouse.oldROy = cMouse.roy;
            cMouse.x = mouse.page.x - bounds.left - scrollX;
            cMouse.y = mouse.page.y - bounds.top - scrollY;
            cMouse.prevOver = cMouse.over;
            if (cMouse.x < bounds.left || cMouse.x > bounds.right || cMouse.y < bounds.top || cMouse.y > bounds.bottom) { cMouse.over = false }
            else if (buttons.floatingPannelOpen && buttons.mouseOverFloating) { cMouse.over = false }
            else {
                if(cMouse.over === false && mouse.captured === 0){ mouse.wheel = 0 }
                cMouse.over = true
            }
            if (mButtonDownOut) { cMouse.over = false; }
            if (!cMouse.prevOver && cMouse.over) { cMouse.fireEvent("overcanvas"); }
            else  if (cMouse.prevOver && !cMouse.over) {
                if (timeline.active) { timeline.highlightFrameNum = frameCount }
                cMouse.fireEvent("outcanvas");
            }
            view.toWorld(cMouse.x, cMouse.y, cMouse.temp);
            cMouse.rx = cMouse.temp.x;
            cMouse.ry = cMouse.temp.y;
            cMouse.rox = cMouse.temp.x;
            cMouse.roy = cMouse.temp.y;
        } else {
            if (cMouse.over === false && mouse.captured === 0) { mouse.wheel = 0 }
            if (penCommandList.pen.length === 0) {
                mouse.pause = false;
                inPenCommandMode = false;
                if (penCommandList.oncomplete) { penCommandList.oncomplete() }
                penCommandList = undefined;
                if (mouse.captured === id) { mouse.release(id) }
            } else {
                cMouse.over = true;
                cMouse.oldX = cMouse.x;
                cMouse.oldY = cMouse.y;
                cMouse.oldRx = cMouse.rx;
                cMouse.oldRy = cMouse.ry;
                cMouse.oldROx = cMouse.rox;
                cMouse.oldROy = cMouse.roy;
                const penCommand = penCommandList.pen.shift();
                view.toScreen(penCommand.x, penCommand.y, cMouse.temp);
                cMouse.rx = penCommand.x;
                cMouse.ry = penCommand.y;
                cMouse.rox = penCommand.x;
                cMouse.roy = penCommand.y;
                mouse.oldX = mouse.x;
                mouse.oldY = mouse.y;
                mouse.x = cMouse.temp.x;
                mouse.y = cMouse.temp.y;
                cMouse.x = cMouse.temp.x;
                cMouse.y = cMouse.temp.y;
                cMouse.temp.x = penCommand.x;
                cMouse.temp.y = penCommand.y;
                if (penCommand.type === "d1") {
                    mouse.oldButton = mouse.button;
                    mouse.button |= 1;
                } else if (penCommand.type === "d3") {
                    mouse.oldButton = mouse.button;
                    mouse.button |= 4;
                } else if (penCommand.type === "u1") {
                    mouse.oldButton = mouse.button;
                    mouse.button &= 0b110;
                } else if (penCommand.type === "u3") {
                    mouse.oldButton = mouse.button;
                    mouse.button &= 0b011;
                }
            }
        }
        if (editSprites.drawingModeOn) { guides.doMouse(mouse, cid) } // also handles drawing snaps
        sprites.doMouse(cMouse, cid);
        widget.doMouse(cMouse);
        sprites.updateLocators();
        if (animation.ticked || !sprites.functionLinksAnimated) {
			kinematics.update();
			var hasUpdated = kinematics.updateWidget;
            if (sprites.hasFunctionLinks && sprites.functionLinksOn) {
                functionLinkBuilder.updateFrameData();
                sprites.eachFunctionLink(spr => { if (spr.updateFunctionLink()) { hasUpdated = true } })
            }
        }
        if (hasUpdated) { widget.update() }
    }
    function doPainting(){
        if (animation.lightboxOn) { spriteRender.drawLightbox(false); }
        if (editSprites.drawingModeOn) {
            if (mouse.button !== 0) {
                if ((mouse.captured === 0 && cMouse.over) || mouse.captured === cid) {
                    if (mouse.captured === 0) {
                        pens.selectingFromPallets = false;
                        if (pens.mousePallets > 0) {
                            const palIdx = pens.mouseOverPallets[pens.mousePallets-1].index ;
                            const sprIdx = mouse.cMouse.overSprites[mouse.cMouse.overSpritesLength - 1];
                            if(sprIdx === undefined || sprIdx < palIdx) {  pens.selectingFromPallets = true; }
                        }
                        mouse.requestCapture(cid)
                        if (mouse.captured === cid) {
                            if (pens.selectingFromPallets) { pens.palletSelect(false) }
                            else { pens.mode.down(cid) }
                        }
                    } else {
                        if (pens.selectingFromPallets) { pens.palletSelect(false) }
                        else { pens.mode.move(cid) }
                    }
                } else if (mouse.captured === 0 || mouse.accessKey === MKey_COLOR_SLIDERS) { pens.mode.feedback() }
            } else {
                if (mouse.captured === cid) {
                    if (pens.selectingFromPallets) { pens.palletSelect(true) }
                    else {
                        pens.mode.up();
                        if (mouse.oldButton === 1) {
                            colours.mainColor.usedCount += 1;
                            colours.update(0.99);
                        } else if (mouse.oldButton === 4) {
                            colours.secondColor.usedCount += 1;
                            colours.update(0.99);
                        }
                        if (colours.pending && pens.updataPaintState) {  colours.pendingColorUsed() }
                    }
                    mouse.release(cid)
                    pens.updataPaintState = false;  
                } else if (mouse.captured === 0) { pens.mode.feedback() }
            }
            if (webGLFilterMenus.filterDialogOpen && editSprites.drawingModeOn) { webGLFilterMenus.applyTempFilter() }
            spriteRender.resetUI();
            spriteRender.drawAll();
            cuttingTools.update(ctx);  
        } else {
            spriteRender.resetUI();
            spriteRender.drawAll();
            widget.draw();
        }
    }
    var showInfoOverride;
    function setInfoCall(call) {
        if (call instanceof Function) {
            showInfoOverride = call;
        } else {
            showInfoOverride = undefined;
        }
    }
	function showInfo() {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#fff";
		ctx.font = "12px arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
        ctx.globalAlpha = 1;
		const mid = ctx.canvas.width / 2 | 0;
		const bot = ctx.canvas.height - 7;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillStyle = "#fff";
        
        var info = "";
        if (showInfoOverride) {
            const lines = showInfoOverride();
            if (Array.isArray(lines)) {
                let yy = bot - 14 * lines.length;
                let idx = 0;
                while(idx < lines.length) {
                    info = lines[idx];
                    if (yy > 10) {
                        ctx.strokeText(info , mid, yy );
                        ctx.fillText(info , mid, yy);
                    }
                    yy += 14;
                    idx ++;
                }
                return;
            } else {
                info = lines;
            }
        } else {
            if (cMouse.over) {
                info += (cMouse.rx | 0) + ", " + (cMouse.ry | 0) + "";
                if (selection.length === 1) {
                    const spr = selection[0];
                    if (spr.key.over) {
                        if (spr.type.subSprite) {
                            info += " Mxy:{" + (spr.key.lx - spr.subSprite.x | 0) + ", " + (spr.key.ly - spr.subSprite.y | 0) +  "}";
                            info += "  Sub: " + spr.subSpriteIdx + " of " +  spr.image.desc.subSprCount + " {X " + (spr.subSprite.x | 0) + " Y " +  (spr.subSprite.y | 0) + " W " + (spr.subSprite.w | 0) + " H: " +(spr.subSprite.h | 0) + "} ";
                        } else { info += "  Mxy:{" + (spr.key.lx | 0) + ", " + (spr.key.ly | 0) +  "}" }
                        if (spr.type.linked) {
                            let linkPos = 0
                            for (const lSpr of spr.linked.linkers.values()) {
                                if (lSpr === spr) { break; }
                                linkPos += 1;
                            }
                            info += " Link: " + linkPos + " "; 
                        }
                    } 
                    info += "  {X " + (spr.x | 0) + " Y " + (spr.y | 0) + " W " + (spr.w * spr.sx | 0) + " H " + (spr.h * spr.sy | 0) + "}";
                }
                info += " " + emojiIcons.keyboard + " " + keyboard.modeDisplayName;
            } else { info += emojiIcons.keyboard + " " + keyboard.modeDisplayName }
        }
        ctx.strokeText(info , mid, bot );
        ctx.fillText(info , mid, bot);
	}
    function sleeping() {
		const time = performance.now();
		if (time - mouse.eventTime > sleepTime) {
			sleepMonitorTimeoutHdl = setTimeout(sleeping, sleepMonitorTimeout);
			heartBeat.frameComplete = true;
			heartBeat.sleeping(mouse.eventTime);
			return;
		}
		if (heartBeat.asleep) {
			if (mouse.active || !heartBeat.canSleep) {
				heartBeat.asleep = 0
			} else {
				heartBeat.asleep -=  sleepMonitorTimeout / 16.6667 | 0;
				heartBeat.asleep = heartBeat.asleep < 0 ? 0 : heartBeat.asleep;
			}
			if (heartBeat.asleep) {
				mouse.eventTime = heartBeat.sleepStarted;
				sleepMonitorTimeoutHdl = setTimeout(sleeping, sleepMonitorTimeout);
				return;
			}
		}
		requestAnimationFrame(mainLoop);
	}
	function mainLoop(time) {
        if (sleepTime && heartBeat.canSleep) {
            if (time - mouse.eventTime > sleepTime) {
                sleepMonitorTimeoutHdl = setTimeout(sleeping, sleepMonitorTimeout);
                heartBeat.frameComplete = true;
                heartBeat.sleeping(mouse.eventTime);
                return;
            }
        }
        mouse.active = false;
        if (mouse.captured === 0 && !inPenCommandMode){
            if (renderMessageStack.hasMessage) { handleRenderMessage() }
        }
        heartBeat.frameComplete = false;
        frameCount ++;
        globalTime = time;
		if (microSleepFrames > 0) {
			if (!cMouse.over && frameCount > mouse.frameCountUp + microSleepFrames) {
				if (mouse.x < bounds.left || mouse.x > bounds.right || mouse.y < bounds.top || mouse.y > bounds.bottom) { 
					if (!microSleep) {
						microSleep = true;
						heartBeat.microSleep();
					}
					requestAnimationFrame(mainLoop);
					heartBeat.frameComplete = true;		
					return;	
				}
				
			} else if (frameCount > (mouse.frameCount + microSleepFrames) && mouse.wheel === 0 && heartBeat.canSleep) {
				if (!microSleep) {
					microSleep = true;
					heartBeat.microSleep();
				}
				requestAnimationFrame(mainLoop);
				heartBeat.frameComplete = true;		
				return;	
			}
		}
		microSleep = false;
        bounds = editContainer.getBoundingClientRect();
        if (needAnimUpdate && !animation.playing) {
            needAnimUpdate = false;
            if (animation.lightboxOn) { animation.forceUpdate(true);  }
        }
        extraRenders.renderDOM();
        timeline.highlightFrameNum && timeline.updateHighlightSprite();
        if (bounds.width-4 !== w || bounds.height !== h) { resize() }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        cMouse.changedView = false;
        sprites.mustUpdate && sprites.update();
        viewUpdate();
        useViewSprite && updateViewSprite();
        editSprites.showGrid && grid.draw();
        view.apply();
        spriteRender.liveCapture();
        doPainting();
        animation.ticked = false;
        spriteRender.renderStack.hasContent && spriteRender.renderStack.render();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (extraRenders.haveWork || extraRenders.callMeReady || extraRenders.callMe){
            extraRenders.render(ctx);
        }
        snaps.draw()
        grid.drawScaleBar();
        heartBeat.monitor(time);
        busy.count > 0 && heartBeat.showBusy(time);
        heartBeat.showAlerts();
        if (ctx._tainted) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.lineWidth = 2;
            ctx.fillStyle = (frameCount / 20 | 0) % 2 ? "#F00" : "#FFF";
            ctx.strokeStyle = "#F00";
            ctx.strokeRect(1, 1, ctx.canvas.width-4, ctx.canvas.height - 2);
            ctx.setTransform(2, 0, 0, 2, ctx.canvas.width / 2, 30);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("CANVAS TAINED!", 0,0);

        }
        curves.display();
		showMouseInfo && /*cMouse.over && */showInfo(ctx);
        mouse.updateCursor(_mainCanvas);
        requestAnimationFrame(mainLoop);
        heartBeat.frameComplete = true;
        if (framePromissed) {
            framePromissed(1);
            framePromissed = undefined;
        }
    }
    var framePromissed;
    var viewW = {x:0,y:0};
    globalRenderControl = {
        getFramePromise(call) {
            if (framePromissed === undefined) {
                var p = new Promise(res => { framePromissed = res }).then(call);
            }
        },
        canvasMouseId : cid,
        click(x,y,button) {
            if (mouse.inSavedState) { return false }
            mouse.save();
            view.toScreen(x,y,viewW)
            mouse.state = {x : viewW.x, y : viewW.y, button, alt : false, ctrl : false, shift : false, wheel : 0}
            viewUpdate();
            view.apply();
            doPainting();
            if (extraRenders.callMe) { extraRenders.clear(); }
            heartBeat.monitor(globalTime);
        }
    };
    return function() {
        resize();
        ctx.setBackgroundColor = bgCol => { document.body.style.backgroundColor = bgCol };
        guides.ready();
        ctx.setInfoCall = setInfoCall;
        ctx.viewUpdate = viewUpdate;
        ctx.restart = () => { requestAnimationFrame(mainLoop) }
        ctx.useViewSprite = state => {
            if (state === undefined) { return useViewSprite };
            if (sprites.viewSprite && state) {
                if(useViewSprite === false) { view.save("renderView") }
                useViewSprite = true;
            }
            if (state === false) {
                view.restore("renderView");
                useViewSprite = false
            }
        }
		ctx.wakeUp = time => {
            if (heartBeat.asleep) {
				heartBeat.asleep = 0;
                clearTimeout(sleepMonitorTimeoutHdl);
                mainLoop(time);
			}
		}
        requestAnimationFrame(mainLoop);
        return ctx;
    }
}) ();