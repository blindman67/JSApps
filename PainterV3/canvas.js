/* This file has changed its name to render.js. Just here as a backup. Will remove the next time I notice it */



"use strict";
var globalTime = 0;
var view;

const render = (() => {
    const id = UID ++;
    const cid = UID ++;
    const ctx = mainCanvas.getContext("2d");
    view = ezView({ctx : ctx});
    spriteRender.setView(view);
    editSprites.setView(view);
    widget.setView(view);
    grid.setView(view);
    heartBeat.context = ctx;
    var h = mainCanvas.width;
    var w = mainCanvas.height;
    var frameCount = 0;
    const cMouse = {
        over : false,
        rx : 0,
        ry : 0,
        x : 0,
        y : 0,
        oldRx : 0,
        oldRy : 0,
        oldX : 0,
        oldY : 0,
        temp : {x:0, y:0},
        overSprites : [],
        overSpritesLength : 0,
    };
    mouse.cMouse = cMouse;
        
    var bounds;
    function resize() {
        bounds = editContainer.getBoundingClientRect();
        w = mainCanvas.width = bounds.width-4;
        h = mainCanvas.height = bounds.height;
        ctx.font = "12px arial";
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
    }
    function captureViewAsCanvas() {
        media.create({
                width : mainCanvas.width,
                height : mainCanvas.height,
                type : "canvas",
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
    function background() {
        
        
    }
    function viewUpdate() {
        var used = false
        if ((mouse.button & 2) === 2) {
            if (cMouse.over && mouse.captured === 0) { mouse.requestCapture(id, mainCanvas) }
            
            if (mouse.captured === id) {
                used = true;
                if ((mouse.button & 2) === 2) { view.movePos(cMouse.x - cMouse.oldX, cMouse.y - cMouse.oldY) }                
            }
        }
    
        if (mouse.wheel) {
            if (cMouse.over && mouse.captured === 0 || mouse.captured === id ) {
                if (mouse.captured === 0) { mouse.requestCapture(id, mainCanvas) }
                if (mouse.captured === id) {
                    const z =settings.wheelScaleRate;
                    used = true;
                    if (view.scale < 120 && mouse.wheel>0) {
                       // view.scale = 120;
                        view.scaleAt(cMouse.x, cMouse.y, mouse.wheel > 0 ? z : 1/z);
                    } else if (view.scale > 0.020 && mouse.wheel < 0) { view.scaleAt(cMouse.x, cMouse.y, mouse.wheel > 0 ? z : 1/z) }
                    

                    mouse.wheel *= settings.wheelScaleResponse;
                    if (Math.abs(mouse.wheel) < 1) { mouse.wheel = 0 };
                }
            }
        }
        if (!used) {
            if (mouse.captured === id) { mouse.release(id) }            
        }
       /* if (buttons.floatingPannelOpen) { return }
                */
        cMouse.oldX = cMouse.x;
        cMouse.oldY = cMouse.y;
        cMouse.oldRx = cMouse.rx;
        cMouse.oldRy = cMouse.ry;
        cMouse.oldROx = cMouse.rox;
        cMouse.oldROy = cMouse.roy;
        cMouse.x = mouse.page.x - bounds.left - scrollX;
        cMouse.y = mouse.page.y - bounds.top - scrollY;
        if (cMouse.x < bounds.left || cMouse.x > bounds.right || cMouse.y < bounds.top || cMouse.y > bounds.bottom) { cMouse.over = false }
         else if (buttons.floatingPannelOpen && buttons.mouseOverFloating) { cMouse.over = false }
         else { 
            if(cMouse.over === false && mouse.captured === 0){
                mouse.wheel = 0;
            }
         
            cMouse.over = true 
        }
        
        view.toWorld(cMouse.x, cMouse.y, cMouse.temp);
        cMouse.rx = cMouse.temp.x;
        cMouse.ry = cMouse.temp.y;        
        cMouse.rox = cMouse.temp.x;
        cMouse.roy = cMouse.temp.y;        
        if (editSprites.drawingModeOn && (paint.gridGuides || paint.gridGuidesSnap)  ) {
            if (cMouse.gridSurface) {
                if (mouse.captured === 0) {
                    cMouse.rpx = cMouse.temp.x;
                    cMouse.rpy = cMouse.temp.y;        
                    cMouse.gridSpriteALocked = null;
                    cMouse.gridSpriteBLocked = null;
                    sprites.eachGridLike(spr => {
                        spr.setGridLine(cMouse.rx, cMouse.ry);
                        spr.color = "black";
                    });
                } else if (mouse.captured === cid) {
                    if (cMouse.gridSprites === undefined) { cMouse.gridSprites = [] }
                    
                    var minDist = Infinity;
                    var minSpr;
                    var minIndex;
                    var cc = 0;
                    sprites.eachGridLike(spr => {
                        cMouse.gridSprites[cc] = spr;
                        spr.grid.lockedOn = false;
                        if (cc !== cMouse.gridSpriteALocked && cc !== cMouse.gridSpriteBLocked ) {
                            var dist = spr.getGridPos(cMouse.rx, cMouse.ry);                    
                            if (dist < minDist) {
                                minDist = dist;
                                minSpr = spr;
                                minIndex = cc;
                            }
                        }
                        cc ++;
                    });
                    cMouse.gridSpritesCount = cc;
                    if (minSpr) {
                        cMouse.gridSpritesMinIndex = minIndex;

                        minSpr.grid.lockedOn = true;
                        cMouse.rx = minSpr.grid.x;
                        cMouse.ry = minSpr.grid.y;
                        if (cMouse.gridSpriteALocked === null && minDist < 15) {
                            var dist = (((cMouse.rx - cMouse.rpx) ** 2) + ((cMouse.ry - cMouse.rpy) ** 2)) ** 0.5;
                            if (dist > 15) {
                                cMouse.gridSpriteALocked = minIndex;
                                minSpr.color = "red";
                            }
                        } else if (cMouse.gridSpriteALocked !== null && cMouse.gridSpriteBLocked === null && minDist < 15) {
                            var dist = (((cMouse.rx - cMouse.rpx) ** 2) + ((cMouse.ry - cMouse.rpy) ** 2)) ** 0.5;
                            if (dist > 15) {
                                cMouse.gridSpriteBLocked = minIndex;
                                minSpr.color = "green";
                            }
                        }

                    }
                }
            } else {
                var getit = false;
                if (mouse.captured === 0) {
                    cMouse.rpx = cMouse.temp.x;
                    cMouse.rpy = cMouse.temp.y;        
                    cMouse.gridSpriteALocked = null;
                    cMouse.gridSpriteBLocked = null;
                    sprites.eachGridLike(spr => {
                        spr.setGridLine(cMouse.rx, cMouse.ry,paint.gridGuidesSnap);

                    });
                    getit = true;
                }
                if (mouse.captured === cid || getit) {
                    if (cMouse.gridSprites !== undefined) { cMouse.gridSprites.length = 0 }
                    var minDist = Infinity;
                    var minSpr;
                    sprites.eachGridLike(spr => {
                        spr.grid.lockedOn = false;
                        var dist = spr.getGridPos(cMouse.rx, cMouse.ry);                    
                        if (dist < minDist) {
                            minDist = dist;
                            minSpr = spr;
                        }
                    });
                    if (minSpr) {
                        minSpr.grid.lockedOn = true;
                        cMouse.rx = minSpr.grid.x;
                        cMouse.ry = minSpr.grid.y;
                    }
                }

            }
        }
        sprites.doMouse(cMouse, cid);
        widget.doMouse(cMouse);
        
    }    
    
    function mainLoop(time) {
        heartBeat.frameComplete = false;
        frameCount ++;
        globalTime = time;
        bounds = editContainer.getBoundingClientRect();
        if (bounds.width-4 !== w || bounds.height !== h) { resize() }
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        viewUpdate();
        if (editSprites.showGrid) { grid.draw() }
        
        view.apply();

        spriteRender.liveCapture();


        if (editSprites.drawingModeOn) {
                      
            if (mouse.button !== 0) {
                if ((mouse.captured === 0 && cMouse.over) || mouse.captured === cid) {
                    if (mouse.captured === 0) { 
                        mouse.requestCapture(cid) 
                        if (mouse.captured === cid) { pens.mode.down() }
                    } else {
                        pens.mode.move(cid);
                    }
                } else {
                    pens.mode.feedback();
                }
            } else {
                if (mouse.captured === cid) { 
                    pens.mode.up();
                    if (mouse.oldButton === 1) {
                        colours.mainColor.usedCount += 1;
                        colours.update(0.99);
                    } else  if (mouse.oldButton === 4) {
                        colours.secondColor.usedCount += 1;
                        colours.update(0.99);
                    } 
                    mouse.release(cid) 
                } else {
                    pens.mode.feedback();
                }
            }
            
            spriteRender.drawAll();
            if(cuttingTools.active){
                cuttingTools.update(ctx);
            }

        } else {
            spriteRender.drawAll();
            widget.draw();
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if(extraRenders.callMe){
            extraRenders.render(ctx);
        }
        
        grid.drawScaleBar();
        heartBeat.monitor(time);
        if(busy.count > 0){
            heartBeat.showBusy(time);
        }
        heartBeat.showAlerts();
        
        curves.display();
        mouse.updateCursor(mainCanvas);
        requestAnimationFrame(mainLoop);
        heartBeat.frameComplete = true;
    }
    
    
    
    
    
    
    return function() {
        resize();
        requestAnimationFrame(mainLoop);
        ctx.setBackgroundColor = function(bgCol) {
            document.body.style.backgroundColor = bgCol;
        };
        return ctx;
    }
        
}) ()



