import {$,$$} from "./src/DOM/geeQry.js";
matchMedia && (() => {
    const setColorScheme = () => schemeCSSLink.href = darkMode ? "darkScheme.css" : "lightScheme.css";
    var darkMode = matchMedia('(prefers-color-scheme: dark)').matches;
    setColorScheme();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => ((darkMode = e.matches ? "dark" : "light"), setColorScheme()));         
})();
(() => {
    const centreElement = el => (el.style.position = "absolute", el.style.left = ((innerWidth - el.getBoundingClientRect().width) * 0.5 | 0) + "px");
    centreElement(root);
    function startApp(e) { location.href = e.target.dataset.url?.includes("index.html") ? e.target.dataset.url : e.target.dataset.named !== undefined ? e.target.dataset.named : (e.target.dataset.url + "/index.html"); }
    for (const link of $("?#root li")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }
    for (const link of $("?#root > ul > li > span")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }
    
    
    var matchCount = 0, resetHdl;
    document.addEventListener("keydown", (e) => {
        if (pageTitle.dataset.key[matchCount] === e.key) {
            matchCount ++;
            if (matchCount === pageTitle.dataset.key.length) {
                showCpp.style.display = "block";
            } else {
                clearTimeout(resetHdl);
                resetHdl = setTimeout(() => { matchCount = 0; }, 1000);
            }
        } else {
            matchCount = 0;
        }
            
    });
    
    
})();







