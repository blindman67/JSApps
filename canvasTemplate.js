import {$,$$} from "./src/DOM/geeQry.js";

function startApp(e) { location.href = e.target.dataset.url?.includes("index.html") ? e.target.dataset.url : e.target.dataset.named !== undefined ? e.target.dataset.named : (e.target.dataset.url + "/index.html"); }
for (const link of $("?#root li")) { (link.dataset.url || link.dataset.named) && link.addEventListener("click", startApp) }







