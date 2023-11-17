import {$,$$} from "./geeQry.js";

const ImageOverlay = {
    create(overlayEl, images) {

        var imgSet, imgIdx, imageEl;
        const addImage = () => {
            overlayEl.innerHTML = "";
            var info = $("div", {textContent: (imgIdx + 1) + " of " + imgSet.length, className: "overlayImageInfo"});
            imageEl = $("img", {src: imgSet[imgIdx].ref, id: "overlayImageEl", style: {position: "absolute"}});
            $$(overlayEl, info, imageEl);
            imageEl = overlayImageEl;
            imageEl.style.top = ((innerHeight - imageEl.naturalHeight) / 2) + "px";
            imageEl.style.left = ((innerWidth - imageEl.naturalWidth) / 2) + "px";
            const iB = info.getBoundingClientRect();
            info.style.left = ((innerWidth - iB.width) / 2) + "px";
            info.style.top= (((innerHeight - imageEl.naturalHeight) / 2) - 40) + "px";
            imageEl.addEventListener("click", showImagePopup);
        }
        const showImagePopup = (e) => {
            if (overlayEl.style.display === "none") {
                overlayEl.style.display = "block";    
                imgSet = e.target._imgSet;
                imgIdx = e.target._imgIdx;
                addImage()
                
            } else {
                if (imgSet && imgSet.length > 1) {
                    imageEl.removeEventListener("click", showImagePopup);
                    imgIdx = (imgIdx + 1) % imgSet.length;
                    addImage();
                }
            }
        }
        const hideImagePopup = (e) => {
            if (e.target === overlayEl) {
                imageEl.removeEventListener("click", showImagePopup);
                overlayEl.style.display = "none"; 
                overlayEl.innerHTML = "";
                imgSet = undefined;
                imgIdx = undefined;
            }   
        }
        for (const img of images) { 
            img.style.cursor = "pointer";
            img.addEventListener("click", showImagePopup);
        }
        overlayEl.addEventListener("click", hideImagePopup);
    }    
    
    
};
export {ImageOverlay};