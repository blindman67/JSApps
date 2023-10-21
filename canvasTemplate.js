import {$,$$} from "./src/DOM/geeQry.js";

function startApp(event) { location.href = event.target.dataset.url.includes("index.html") ? event.target.dataset.url : (event.target.dataset.url + "/index.html"); }
for (const link of $("?#root li")) { link.dataset.url && link.addEventListener("click", startApp) }







