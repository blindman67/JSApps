import {$,$$} from "./geeQry.js";
const Animator = (() => {
    const keys = [];
    var stop = false;
    var animated = false;
    function createStyleKey(element, time, styleName, startVal, endVal) { addKeys({start: performance.now(), time, element, styleName, startVal: Number(startVal ?? element.style[styleName]), endVal: Number(endVal)}) }
    function createEventKey(time, callback) { addKeys({start: performance.now(), time, callback, isEvent: true}) }
    function addKeys(key) {
        keys.push(key);
        if (!animated) {
            animated = true;
            requestAnimationFrame(animate);
        }
    };
    function animate(time) {
        var head = 0, tail = 0;
        while (head < keys.length) {
            const key = keys[head];
            const kTime = time - key.start;
            if (kTime >= key.time) {
                if (key.isEvent) { key.callback() }
                else { key.element.style[key.styleName] = key.endVal }
            } else if (!key.isEvent) {
                key.element.style[key.styleName] = (key.endVal - key.startVal) * (kTime / key.time) + key.startVal;
                keys[tail++] = keys[head];
            } else { keys[tail++] = keys[head] }
            head ++;
        }
        keys.length = tail;
        if (tail) { requestAnimationFrame(animate) }
        else { animated = false }
    }
    function stopAll() {
        if (animated) {
            const time = performance.now();
            var head = 0, tail = 0;
            while (head < keys.length) {
                const key = keys[head];
                const kTime = time - key.start;
                if (kTime >= key.time) {
                    if (key.isEvent) { key.callback() }
                    else { key.element.style[key.styleName] = key.endVal }
                } else if (!key.isEvent) { key.element.style[key.styleName] = (key.endVal - key.startVal) * (kTime / key.time) + key.startVal }
                else { keys[tail++] = keys[head] }
                head ++;
            }
            keys.length = tail;
            keys.sort((a, b) => a.start + a.time > b.start + b.time);
            for (const key of keys) { key.callback() }
            keys.length = 0;
        }
    }
    const API = {
        styleKey: createStyleKey,
        eventKey: createEventKey,
        stop: stopAll,
    };
    return API;
})();
const ImageOverlay = (() => {
    var fadeInMs = 300;
    var fadeOutMs = 300;
    const API = {
        set animTime(val) {
            fadeInMs = val;
            fadeOutMs = val * (2 / 3);
        },
        create(overlayEl, images) {
            var imgSet, imgIdx, imageEl, infoEl;
            const addImage = () => {
                overlayEl.innerHTML = "";
                infoEl = $("div", {textContent: (imgIdx + 1) + " of " + imgSet.length, className: "overlay info"});
                imageEl = $("img", {src: imgSet[imgIdx].src, title: imgSet[imgIdx].title ?? null, className: "overlay image", style: {position: "absolute"}});
                $$(overlayEl, infoEl, imageEl);
                imageEl.style.opacity = 0;
                infoEl.style.opacity = 0;
                Animator.styleKey(overlayEl, fadeInMs, "opacity", undefined, 1);
                Animator.styleKey(imageEl, fadeInMs, "opacity", 0, 1);
                Animator.styleKey(infoEl, fadeInMs, "opacity", 0, 1);
                resized();
                imageEl.addEventListener("click", showImagePopup);
            }
            const resized = () => {
                if (imageEl && infoEl) {
                    var h = imageEl.naturalHeight;
                    var w = imageEl.naturalWidth;
                    if (h > innerHeight * 0.85) {
                        h = innerHeight * 0.85;
                        w *= h / imageEl.naturalHeight;
                    }
                    if (w > innerWidth * 0.85) {
                        w = innerWidth * 0.85;
                        h = imageEl.naturalHeight * (w / imageEl.naturalWidth);
                    }
                    imageEl.width = w;
                    imageEl.height = h;
                    imageEl.style.top = ((innerHeight - h) / 2 | 0) + "px";
                    imageEl.style.left = ((innerWidth - w) / 2 | 0) + "px";
                    const iB = infoEl.getBoundingClientRect();
                    infoEl.style.left = ((innerWidth - iB.width) / 2) + "px";
                    infoEl.style.top= ((((innerHeight - h) / 2) - iB.height * 1.2) | 0) + "px";
                }
            }
            const showImagePopup = (e) => {
                if (overlayEl.style.display === "none") {
                    Animator.stop();
                    overlayEl.style.display = "block";
                    overlayEl.style.opacity = 0;
                    imgSet = e.target._imgSet;
                    imgIdx = e.target._imgIdx;
                    addImage()
                } else {
                    if (imgSet && imgSet.length > 1) {
                        imageEl.removeEventListener("click", showImagePopup);
                        Animator.stop();
                        Animator.styleKey(imageEl, fadeOutMs, "opacity", undefined, 0);
                        Animator.styleKey(infoEl, fadeOutMs, "opacity", undefined, 0);
                        Animator.eventKey(fadeOutMs + 20, nextImage);
                    }
                }
            }
            const nextImage = () => {
                imgIdx = (imgIdx + 1) % imgSet.length;
                addImage();
            }
            const hideImagePopup = (e) => {
                if (e.target === overlayEl) {
                    Animator.stop();
                    Animator.styleKey(overlayEl, fadeOutMs, "opacity", undefined, 0);
                    Animator.styleKey(imageEl, fadeOutMs, "opacity", undefined, 0);
                    Animator.styleKey(infoEl, fadeOutMs, "opacity", undefined, 0);
                    Animator.eventKey(fadeOutMs + 20, imagePopupDone);
                    imageEl.removeEventListener("click", showImagePopup);
                    imgSet = undefined;
                    imgIdx = undefined;
                }
            }
            const imagePopupDone = () => {
                overlayEl.style.display = "none";
                overlayEl.innerHTML = "";
                infoEl = undefined;
                imageEl = undefined;
            }
            for (const img of images) {
                img.style.cursor = "pointer";
                img.addEventListener("click", showImagePopup);
            }
            overlayEl.addEventListener("click", hideImagePopup);
            addEventListener("resize", resized);
        }
    }
    return API;
})();
export {ImageOverlay};