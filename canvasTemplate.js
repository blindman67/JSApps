import {$,$$} from "./src/DOM/geeQry.js";
root.style.position = "absolute";
const bounds = root.getBoundingClientRect();
root.style.left = ((innerWidth - bounds.width) * 0.5 | 0) + "px";

function startApp(e) { location.href = e.target.dataset.url?.includes("index.html") ? e.target.dataset.url : e.target.dataset.named !== undefined ? e.target.dataset.named : (e.target.dataset.url + "/index.html"); }
for (const link of $("?#root li")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }
for (const link of $("?#root > ul > li > span")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }







