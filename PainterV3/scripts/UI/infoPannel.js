"use strict";
const infoPannel = (()=> {
    var delay;
    const width = 100;
    const height = 100;
    const padd = 20;
    const wC = width / 2;
    const hC = height / 2;
    const offsetX = -30;
    const offsetY = -10;
    const totalWidth = width + padd;
    const displayCan = $("canvas", {width, height, className: "infoCanvas"});
    const ctxD = displayCan.getContext("2d");
    function getSettings(){
        delay = settings.infoPannelShowDelay;
    };
    getSettings();
    settingsHandler.onchange = getSettings;

    const pannel = $("#floatingInfoContainer")[0];
    const displayTypes = {
        unknown: 0,
        media: 1,
        sprite: 2,
        colorPicker: 3,
        autoComplete: 4,
        buffer: 5,
    };
    var debounceHdl;
    var currentContent;
    var currentId; // updates only if id matches
    var captured = false;

    var visible = false;
    var posX = 0;
    var posY = 0;
    var canShow = false;
    var leftOf = 0;
    function getPos() {
        posX = mouse.x + offsetX - width;
        if (leftOf > width) {
            if (posX + width > leftOf) { posX = leftOf - width; }
        }
        posY = mouse.y + offsetY;
        if (posX <= padd) { posX = mouse.x - offsetX }
        if (posY + height + padd > innerHeight) { posY = mouse.y - offsetY - height - padd }
    }
    function setPos(ox = 0, oy = 0, w = width, h = height) {
        getPos();
        pannel.style.left = (posX + ox | 0) + "px";
        pannel.style.top = (posY + oy | 0) + "px";
        pannel.style.width = (w | 0) + "px";
        pannel.style.height = (h | 0) + "px";
    }
    function setPosNear(element) {
        const bounds = element.getBoundingClientRect();
        pannel.style.left = (bounds.left - padd | 0) + "px";
        pannel.style.top = (bounds.bottom + padd | 0) + "px";
        pannel.style.width = (bounds.width - padd * 2 | 0) + "px";
        pannel.style.height = "unset";
    }
    function rShape(spr, x, y, w, h) {
        const c = ctxD;
        const sc = w / spr.w;
        c.transform(sc, 0, 0 , sc, w / 2, h / 2);
        if(!spr.shape.outline && spr.type.usingPattern && spr.patternSpr.pattern) {
            if (spr.shape.strokeWidth) {
                c.strokeStyle = spr.patternSpr.pattern.img;
                c.lineWidth = spr.shape.strokeWidth;
                c.beginPath();
                spr.shape.draw(c, spr);
                c.stroke(spr.shapePath);
            } else {
                c.fillStyle = spr.patternSpr.pattern.img;
                c.beginPath();
                spr.shape.draw(c, spr);
                c.fill(spr.shapePath, spr.shapePath.fillRule);
            }
        } else {
            c.strokeStyle = c.fillStyle = spr.rgb.css;
            c.beginPath();
            spr.shape.draw(c, spr);
            if (spr.shape.strokeWidth) { c.lineWidth = spr.shape.strokeWidth; c.stroke(spr.shapePath) }
            else {  c.fill(spr.shapePath, spr.shapePath.fillRule) }
        }
        c.setTransform(1,0,0,1,0,0);
        canShow = true;
    }
    function subSprImage(r, x, y, w, h, spr) {
        if (r.w < width || r.h < height) { ctxD.canvas.classList.add("englarged"); ctxD.imageSmoothingEnabled = false }
        else { ctxD.canvas.classList.remove("englarged"); ctxD.imageSmoothingEnabled = true }
        ctxD.drawImage(spr.image, r.x, r.y, r.w, r.h, x, y, w, h);
        canShow = true;
    }
    function sprImage(r, x, y, w, h, subSprites) {
        if (r.w < width || r.h < height) { ctxD.canvas.classList.add("englarged"); ctxD.imageSmoothingEnabled = false }
        else { ctxD.canvas.classList.remove("englarged"); ctxD.imageSmoothingEnabled = false }
        ctxD.drawImage(r, x, y, w, h);
        ctxD.setTransform(w / r.w, 0, 0, h / r.h, x, y);
        ctxD.beginPath();
        for (const ss of subSprites) {  ctxD.rect(ss.x, ss.y, ss.w, ss.h);  }
        ctxD.setTransform(1, 0, 0, 1, 0, 0);
        ctxD.strokeStyle = "#F88";
        ctxD.lineWidth = 1;        
        ctxD.stroke();
        ctxD.globalCompositeOperation = "source-over";
        canShow = true;
    }
    function rImage(r, x, y, w, h) {
        if (r.w < width || r.h < height) { ctxD.canvas.classList.add("englarged"); ctxD.imageSmoothingEnabled = false }
        else { ctxD.canvas.classList.remove("englarged"); ctxD.imageSmoothingEnabled = true }
        ctxD.drawImage(r, x, y, w, h);
        canShow = true;
    }
    const workDOMMatrix = new DOMMatrix([1,0,0,1,0,0])
    function rPattern(r, x, y, w, h) {
        if (r.w < width || r.h < height) { ctxD.canvas.classList.add("englarged"); ctxD.imageSmoothingEnabled = false }
        else { ctxD.canvas.classList.remove("englarged"); ctxD.imageSmoothingEnabled = true }
        r.setTransform(workDOMMatrix);
        ctxD.fillStyle = r;
        ctxD.fillRect(x, y, w, h);
        ctxD.fillStyle = "#000";
        canShow = true;
    }

    function drawContent(renderable, renderer = rImage, ref) {
        const scale = Math.min(width / renderable.w, height / renderable.h);
        ctxD.clearRect(0,0,width,height);
        const px = (width - renderable.w * scale) * 0.5 - 20;
        const py = (height - renderable.h * scale) * 0.5;
        const w = renderable.w * scale;
        const h = renderable.h * scale;
        renderer(renderable, 0, 0, w, h, ref);
        setPos(px, py, w, h);
    }
    function showDisplayCan(type) {
        if (canShow) {
            $$(pannel, displayCan);
            currentContent = displayCan;
            currentType = type;
            currentDisplay = displays[type];
            pannel.classList.add("show");
            visible = true;
            canShow = false;
        }
    }
    function hideTypeAny() {
        if (visible) {
            pannel.classList.remove("show");
            pannel.classList.remove("showActive");
            $R(pannel, currentContent);
            currentContent = undefined;
            currentId = 0;
            currentType = displayTypes.unknown;
            currentDisplay = displays[displayTypes.unknown];
            visible = false;
        }
        canShow = false;
    }
    const displays = {
        [displayTypes.unknown]: {
            hide: hideTypeAny,
        },
        [displayTypes.buffer]: {
            show(content) {
                leftOf = view.context.canvas.width;
                const canvas = content[0];
                drawContent(canvas, canvas.isPattern ?  rPattern : rImage);
                showDisplayCan(displayTypes.buffer);
            },
            hide: hideTypeAny,
        },
        [displayTypes.media]: {
            show(content) {
                leftOf = view.context.canvas.width;
                const media = content[0];
                if (media.desc.vector) {/* drawContent(spr, rMediaShape) */}
                else if (media.desc.video) { drawContent(media.desc.frameHold) }
                else if (media.desc.sprites) { drawContent(media.ctx.canvas, sprImage, media.desc.sprites) }
                else if (media.ctx) { drawContent(media.ctx.canvas) }
                else { drawContent(media) }
                showDisplayCan(displayTypes.media);
            },
            hide: hideTypeAny,
        },
        [displayTypes.sprite]: {
            show(content) {
                leftOf = view.context.canvas.width;
                const spr = content[0];
                if (spr.type.shape) { drawContent(spr, rShape) }
                else if (spr.type.pallet) {
                    ctxD.imageSmoothingEnabled = false;
                    drawContent(spr.pallet.image);
                    ctxD.imageSmoothingEnabled = true;
                } else if (spr.type.image) {
                    if (spr.type.subSprite) { drawContent(spr.subSprite, subSprImage, spr) }
                    else { drawContent(spr.image) }
                }
                showDisplayCan(displayTypes.media);
            },
            hide: hideTypeAny,
        },
        [displayTypes.colorPicker]: {
            capturing: true,
            show(content) {
                $$(pannel, displayCan);
                currentContent = displayCan;
                currentType = displayTypes.colorPicker;
                currentDisplay = displays[displayTypes.colorPicker];
                currentId = content[0];
                visible = true; // possibly Actual visibility via color picker callin update
                captured = true;

            },
            update(id, actionName, renderCallback, ...data){
                if (id === currentId) {
                    if (actionName === "close") {
                        hideTypeAny();
                        captured = false;
                    } else if (actionName === "show") {
                        setPos();
                        renderCallback && renderCallback(ctxD, ...data);
                        pannel.classList.add("show");
                    } else {
                        //pannel.classList.remove("show")
                    }
                }
            },
            hide() {
                hideTypeAny();
                captured = false;
            },
        },
        [displayTypes.autoComplete]: {
            capturing: true,
            show(content) {
                $$(pannel, displayCan);
                currentContent = displayCan;
                currentType = displayTypes.autoComplete;
                currentDisplay = displays[displayTypes.autoComplete];
                currentId = content[0];
                visible = true;
                captured = true;
                currentDisplay.lines.length = 0;
                currentDisplay.lines.size = 0;
                currentDisplay.lines.showing = 0;
                currentDisplay.lines.selectedIndex = -1;


            },
            lines: [],
            update(id, actionName, forElement, ...data){
                var idx = 0;
                if (id === currentId) {
                    const lines = currentDisplay.lines;
                    if (actionName === "close") {
                        const showing = lines.showing;
                        while (idx < showing) {
                            let line = lines[idx++];
                            $R(pannel, line);
                            lines.showing--;
                        }
                        lines.length = 0;
                        lines.size = 0;
                        lines.showing = 0;
                        hideTypeAny();
                        captured = false;
                        displayCan.classList.remove("hide");
                    } else if (actionName === "show") {
                        setPosNear(forElement);
                        displayCan.classList.add("info");
                        displayCan.classList.add("hide");
                        pannel.classList.add("showActive");
                        lines.selectedIndex = -1;

                    } else if (actionName === "first") {
                        if (lines.showing < 1) { return undefined }
                        if (lines.selectedIndex === -1 || lines.selectedIndex > lines.showing) { return lines[0] }
                        return lines[lines.selectedIndex];
                    } else if (actionName === "selected") {
                        if(lines.selectedIndex === -1 || lines.selectedIndex > lines.showing) { return undefined }
                        return lines[lines.selectedIndex];
                    } else if (actionName === "select") {
                        if (lines.showing > 0) {
                            let selectedLine;
                            if (lines.selectedIndex === -1) {
                                lines.selectedIndex = data[0] < 0 ? lines.showing -1 : 0;
                            } else {
                                lines.selectedIndex = (lines.selectedIndex+ (data[0] === -1 ? lines.showing -1 : data[0] )) % (lines.showing);
                            }
                            const showing = lines.showing;
                            while (idx < showing) {
                                let line = lines[idx];
                                if (idx !== lines.selectedIndex) {
                                    line.classList.remove("selected");

                                } else {
                                    line.classList.add("selected");
                                    selectedLine = line;
                                }
                                idx++


                            }
                            selectedLine.scrollIntoView()
                            return selectedLine;
                        }
                    } else if (actionName === "list") {
                        while (idx < data.length) {
                            let line = lines[idx];
                            if (line) {
                                line.textContent = data[idx];
                                line._commandStr = data[idx];
                            } else {
                                line = $("div",{textContent: data[idx], className: "info autoCompleteLine"});
                                line._commandStr = data[idx];
                                lines.push(line);
                                lines.size ++;
                            }
                            if (idx >= lines.showing) {
                                $$(pannel, line);
                                lines.showing ++;
                            }
                            if (idx !== lines.selectedIndex) {
                                line.classList.remove("selected");

                            } else {
                                line.classList.add("selected");
                            }
                            idx ++;
                        }
                        const showing = lines.showing;
                        while (idx < showing) {
                            let line = lines[idx++];
                            line.classList.remove("selected");
                            $R(pannel, line);
                            lines.showing--;
                        }
                        if (lines.showing === 0) {
                           pannel.classList.remove("showActive");
                        } else {
                            pannel.classList.add("showActive");
                        }
                    } else {
                    }
                }
            },
            hide() {
                hideTypeAny();
                captured = false;
            },

        },
    };
    var currentType = displayTypes.unknown;
    var currentDisplay = displays[displayTypes.unknown];
    const API = {
        displayTypes,
        update(...content) {
            return currentDisplay.update && currentDisplay.update(...content);
        },
        show(type, ...content) {
            if (!captured) {
                if (visible) { API.hide() } else { clearTimeout(debounceHdl); }
                if (!visible && displays[type] && displays[type].show) {
                    if (displays[type].capturing) { displays[type].show(content) }
                    else { debounceHdl = setTimeout(displays[type].show, delay, content) }
                }
            }
        },
        release() {
            clearTimeout(debounceHdl);
            if (currentDisplay.hide) { currentDisplay.hide() }
        },
        hide(type = currentType) {
            if (!captured) {
                clearTimeout(debounceHdl);
                if (currentDisplay.hide) { currentDisplay.hide() }
            }

        },


    };
    return API;

})();