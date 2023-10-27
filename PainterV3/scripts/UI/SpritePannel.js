"use strict";
function SpritePannel(spr) {
    var butMap = new Map();
    const id = getUID();
    var hasContent = false;
    var frameLastChanged;
    var imageGuid;
    var subSprIdx;
    var subSpriteUnderMouse;
    var imageDirty;
    var imageDrawable;
    var imageDeleted = true;
    var imgW = spr.image.w;
    var imgH = spr.image.h;
    var maxW = Math.min(Math.max(18*22+3, imgW), innerWidth / 2);
    var maxH = Math.min(Math.max(32+21+15, imgH), innerHeight - 60);
    var canvas =  $("canvas", {className: "imageCan", width: maxW, height: maxH})
    var pannelScale = 1;
    const commandsFuncs = {
        [commands.test]() { return false },
    };
    function setButtons(buttons){ for(const but of buttons){ butMap.set(but.command, but) }  return buttons }
    function closeDialog(){ pannel = undefined; handler.close() }
    function maximiseDialog() { handler.dirty && handler.updateUI() }
    function mouseOverOut(event) {

        if (event.type === "mouseover") {
            if (mouse.captured === 0) {
                if (mouse.requestCapture(id, customElement)) {
                    mouse.onmove = mouseMove;
                }
            }
        } else {
            if (mouse.captured === id && !mouse.button) {
                mouse.wheel = 0
                mouse.release(id);
                mouse.onmove = undefined;
                handler.updateTitle();
                renderImage();

            }
        }
    }
    function mouseMove(mouse, e) {
        mouse.forElement();
        if (spr.type.image && spr.image.desc.sprites) {
            const subSprs = spr.image.desc.sprites;
            const scale = Math.min(maxW / spr.image.w, maxH / spr.image.h);
            const mx = (mouse.x / pannel.width) * spr.image.w | 0;
            const my = (mouse.y / (pannel.height - 24)) * spr.image.h | 0;
            const s = subSprs.find(s => mx >= s.x && mx < s.x + s.w && my >= s.y && my < s.y + s.h);
            if (s) {
                subSpriteUnderMouse = s;
                pannel.setTitleText("#" + s.id + (s.name ? " "+s.name : "") + " x:" + (mx - s.x).toFixed(0) + " y:" + (my - s.y).toFixed(0));
                customElement.title = "#" + s.id + (s.name ? " "+s.name : "") + " x:" + s.x + " y:" + s.y + " w:" + s.w + " h:" + s.h;
                renderImage(subSpriteUnderMouse);
                ctx.setTransform(scale, 0, 0, scale, maxW / 2 - spr.image.w * scale / 2, maxH / 2 - spr.image.h * scale / 2);
                ctx.fillStyle = "#F007";
                ctx.fillRect(mx, s.y, 1, s.h)
                ctx.fillRect(s.x, my,  s.w, 1)
            } else {
                subSpriteUnderMouse && handler.updateTitle();
                subSpriteUnderMouse = undefined;
                pannel.setTitleText("Mouse x:" + mx.toFixed(0) + " y:" + my.toFixed(0));
                customElement.title = "";
                renderImage();
                ctx.setTransform(scale, 0, 0, scale, maxW / 2 - spr.image.w * scale / 2, maxH / 2 - spr.image.h * scale / 2);
                ctx.fillStyle = "#F007";
                ctx.fillRect(mx, 0, 1, spr.image.h)
                ctx.fillRect(0, my,  spr.image.w, 1)
            }


        }

    }
    var pannel = buttons.FloatingPannel(
        $("#floatingContainer")[0],{
            title : "Image: " + spr.image.guid + " [" + spr.image.w + " by " + spr.image.h + "]",
            width : maxW ,
            height: maxH + 24,
            onclosing : closeDialog,
            onMaximise: maximiseDialog,
            className: "SpriteFloatingPannel"
    });
    if(!pannel){return}

    var customElement =  $$($("div", {className: "imageContainer"}), canvas);
    customElement.addEventListener("mouseover", mouseOverOut, false);
    customElement.addEventListener("mouseout", mouseOverOut, false);
    pannel.title.classList.add("imagePannel");

    const ctx = canvas.getContext("2d");

    customElement.updateWheel = (mouse, e) => {
        if (mouse.captured === id) {
            //if (mouse.captured === id || mouse.requestCapture(id, customElement)) {
                const scaleBy = mouse.shift ? 1.02 : 1.2;
                if (mouse.wheel < 0) {
                    mouse.wheel = 0;
                    pannelScale *= 1 / scaleBy;
                    if (maxW * pannelScale < 128 || ((maxH + 24) * pannelScale | 0) < 128) {
                        pannelScale *= scaleBy;
                    } else {
                        handler.dirty = true;
                    }
                } else {
                    mouse.wheel = 0;
                    pannelScale *= scaleBy;
                    if (((maxH + 24) * pannelScale | 0) > (innerHeight - 60) || maxW * pannelScale > innerWidth - 60) {
                        pannelScale *= 1/scaleBy;
                    } else {
                        handler.dirty = true;
                    }
                }
                //mouse.wheel === 0 && mouse.release(id);
            //}
        }
    }
    buttons.create(setButtons([{customElement}]), {pannel, size: 21, pannelSizeFixed: true});
    var tHdl;
    function debouncedUpdate() {
        if (selection.length === 1) {
            selection.each(s => { handler.setImage(s) });
        }
        if(handler.dirty) { handler.updateUI() };
    }

    function renderSubSprite(ss) {
        ctx.rect(ss.x - 0.5, ss.y - 0.5, ss.w + 1, ss.h + 1);
        if (ss.cx !== undefined) {
            const cx = ss.x + ss.cx;
            const cy = ss.y + ss.cy;
            ctx.moveTo(ss.x, cy);
            ctx.lineTo(ss.x + ss.w, cy);
            ctx.moveTo(cx, ss.y);
            ctx.lineTo(cx, ss.y + ss.h);
        }
    }
    function renderImage(highlightSubSprite) {
        frameLastChanged = spr.image.changed;
        ctx.imageSmoothingEnabled = false;

        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
        const scale = Math.min(maxW / spr.image.w, maxH / spr.image.h);
        ctx.setTransform(scale, 0, 0, scale, maxW / 2 - spr.image.w * scale / 2, maxH / 2 - spr.image.h * scale / 2);
        ctx.drawImage(spr.image, 0, 0);
        if (spr.image.desc.sprites) {
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 1;
            ctx.globalCompositeOperation = "difference";
            ctx.beginPath();
            for (const ss of spr.image.desc.sprites) {
                renderSubSprite(ss);
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.stroke();
            if (spr.type.subSprite) {
                ctx.setTransform(scale, 0, 0, scale, maxW / 2 - imgW * scale / 2, maxH / 2 - imgH * scale / 2);
                ctx.strokeStyle = "#0FF";
                ctx.beginPath();
                renderSubSprite(spr.subSprite);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.stroke();
            }
            if (highlightSubSprite) {
                ctx.setTransform(scale, 0, 0, scale, maxW / 2 - imgW * scale / 2, maxH / 2 - imgH * scale / 2);
                ctx.strokeStyle = "#F0F";
                ctx.beginPath();
                renderSubSprite(highlightSubSprite);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.stroke();
            }
            ctx.globalCompositeOperation = "source-over";
        }

    }
    function refreshImage() {
        if (imageDeleted) { return }
        if (spr.image.guid !== imageGuid) { handler.setImage(spr) }
        if ((imgW !== spr.image.w && imgH !== spr.image.h) || handler.dirty ) {
            handler.dirty = true;
            handler.updateUI();
        } else if (pannel.maximised && spr.image.changed !== frameLastChanged) {
            renderImage();
            if (imageDirty !== spr.image.desc.dirty || imageDrawable !== spr.image.isDrawable) { handler.updateTitle() }
        }
    }
    var handler = {
        dirty: false,
        commands: commandsFuncs,
        command(commandId, _empty, event){
            if (handler.commands?.[commandId](event, commandId, (mouse.oldButton & 1) === 1, (mouse.oldButton & 4) === 4) !== false) { return }
            handler.updateUI();
        },
        updateTitle() {
            if (imageDeleted) {
                pannel.setTitleText("Deleted!");
                pannel.title.classList.add("deleted");
                pannel.title.classList.remove("dirty");
                pannel.title.classList.remove("drawable");
                return;
            }
            pannel.title.classList.remove("deleted");
            if (spr.image.desc.isGif) {
                pannel.setTitleText("Gif: " + spr.image.guid + " [" + spr.image.w + " x " + spr.image.h + "] F: " + spr.image.desc.frame + "/" + spr.image.desc.frameCount);
            } else {
                if (spr.type.subSprite) {
                    const s =  spr.subSprite;
                    pannel.setTitleText(
                        "#" + spr.subSpriteIdx + (s.name ? " "+s.name : "") +
                        " x:" + s.x +
                        " y:" + s.y +
                        " w:" + s.w +
                        " h:" + s.h
                    );
                } else {
                    pannel.setTitleText("Id:" + spr.image.guid + " " + spr.image.w + " x " + spr.image.h + "");
                }
            }
            spr.image.desc.dirty ? pannel.title.classList.add("dirty") : pannel.title.classList.remove("dirty");
            spr.image.isDrawable ? pannel.title.classList.add("drawable") : pannel.title.classList.remove("drawable");
            imageDirty = spr.image.desc.dirty;
            imageDrawable = spr.image.isDrawable;
        },
        imageDeleted(owner, name, data) {
            if (spr && data.media === spr.image) {
                imageDeleted = true;
                spr = undefined;
                imageGuid = undefined;
                imageDirty = undefined;
                imageDrawable = undefined;
                handler.updateUI();
            }
        },
        setImage(sprite) {
            if (sprite.type.cutter && sprite.attachedTo?.type.subSprite && sprite.gridSpecial === spriteRender.gridSpecialNames.subSpriteAnchor) {
                sprite = sprite.attachedTo;
            }
            if (sprite.type.image) {
                var needUpdate = imageGuid !== sprite.image.guid;
                if (!needUpdate && sprite.image.desc.sprites) {
                    const len =sprite.image.desc.sprites;
                    if (sprite.type.subSprite) {
                        const ssIdx = (sprite.subSpriteIdx % len + len) % len;
                        if (subSprIdx !== ssIdx) { needUpdate = true }
                    } else if (subSprIdx !== sprite.subSpriteIdx) { needUpdate = true }
                }
                if (needUpdate) {
                    imageGuid = sprite.image.guid;
                    if (sprite.type.subSprite) {
                        const len =sprite.image.desc.sprites;
                        subSprIdx = (sprite.subSpriteIdx % len + len) % len;
                    } else {
                        subSprIdx = undefined;
                    }
                    imageDirty = undefined;
                    imageDrawable = undefined;
                    spr = sprite;
                    imageDeleted = false;
                    hasContent = false;
                    handler.dirty = true;
                    imgW = spr.image.w;
                    imgH = spr.image.h;
                }
            }
        },
        updateUI() {
            if (pannel.maximised) {
                handler.dirty = false;
                if (!imageDeleted) {
                    imgW = spr.image.w;
                    imgH = spr.image.h;
                }
                maxH = Math.min(Math.max(64, imgH), innerHeight - 60);
                const aspect = imgW / imgH;
                maxW = maxH * aspect;
                const maxW1 = Math.min(Math.max(45, imgW), innerWidth - 45);
                if (maxW1 < maxW) {
                    pannelScale = maxW1 / maxW;
                }
                pannel.height = (maxH + 24) * pannelScale | 0;
                pannel.width = maxW * pannelScale | 0;
                if (!imageDeleted) {
                    if (canvas.width !== maxW || canvas.height !== maxH) {
                        canvas.width = maxW;
                        canvas.height = maxH;
                    }
                    renderImage();
                    if (imageDirty !== spr.image.desc.dirty || imageDrawable !== spr.image.isDrawable) { handler.updateTitle() }
                    frameLastChanged = spr.image.changed;
                }
                pannel.positionUpdate(false);
            } else {
                if (!imageDeleted) {
                    const h = Math.min(Math.max(180, spr.image.h), innerHeight - 60);
                    const aspect = spr.image.w / spr.image.h;
                    pannel.width = (h * aspect)* pannelScale | 0;
                }
                pannel.positionUpdate(false);
            }
            handler.updateTitle()
        },
        spriteStateChangeChanged() {
            clearTimeout(tHdl);
            tHdl = setTimeout(debouncedUpdate, 20)
        },
        selectionChanged() {
            pannelScale = 1;
            clearTimeout(tHdl);
            tHdl=setTimeout(debouncedUpdate, 20);
        },
        close(){
            clearTimeout(tHdl);
            customElement.removeEventListener("mouseover", mouseOverOut);
            customElement.removeEventListener("mouseout", mouseOverOut);
            extraRenders.DOMRenderingFunction("spritePannel" + id);
            editSprites.removeEvent("update",handler.spriteStateChangeChanged);
            selection.removeEvent("change",handler.selectionChanged);
            media.removeEvent("onremoved", handler.imageDeleted);
            SpritePannel.open = false;
            commandRanges.removeHandler(handler.handle);
            butMap = undefined;
            handler = undefined;
        }
    }
    handler.handle = commandRanges.addHandler(commands.spritePannelStart, commands.spritePannelEnd, handler);
    extraRenders.DOMRenderingFunction("spritePannel" + id, refreshImage);
    editSprites.addEvent("update",handler.spriteStateChangeChanged);
    selection.addEvent("change",handler.selectionChanged);
    media.addEvent("onremoved", handler.imageDeleted);
    handler.spriteStateChangeChanged();
    SpritePannel.open = true;
    handler.setImage(spr);
    handler.updateUI();
    pannel.positionUpdate(false); // Forces pannel to fit page
}