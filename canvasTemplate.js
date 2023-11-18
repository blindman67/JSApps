import {$,$$} from "./src/DOM/geeQry.js";
import {ImageOverlay} from "./src/DOM/ImageOverlay.js";


(() => {
    function startApp(e) { 
        if (e.target.dataset.target === "newTab") {
            open(e.target.dataset.named !== undefined ? 
                    e.target.dataset.named : 
                    (e.target.dataset.url + "/index.html")
                , "_blank");
        } else {
            location.href = e.target.dataset.url?.includes("index.html") ? 
                e.target.dataset.url : 
                e.target.dataset.named !== undefined ? 
                    e.target.dataset.named : 
                    (e.target.dataset.url + "/index.html"); 
        }
    }
    for (const link of $("?#root li")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }
    for (const link of $("?#root > ul > li > span")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }
    const centreElement = el => (el.style.position = "absolute", el.style.left = ((innerWidth - el.getBoundingClientRect().width) * 0.5 | 0) + "px");   
    if (imageOverlayEl) { 
        ImageOverlay.create(imageOverlayEl, $("?#root > ul > li > img"));
        ImageOverlay.animTime = document.body._extras.overlayAnimTime ?? 300;
    }
    $("?#root", 0).style.display = null;
    centreElement(root);
    addEventListener("resize", () => { centreElement(root) });

})();







