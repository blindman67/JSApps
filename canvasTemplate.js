import {$,$$} from "./src/DOM/geeQry.jsm";

function startApp(event) { location.href = event.target.dataset.url + "/index.html" }
for (const link of $("?#root li")) { link.dataset.url && link.addEventListener("click", startApp) }






