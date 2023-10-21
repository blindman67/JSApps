import {$, $$} from "../DOM/geeQry.jsm";

addEventListener("error",(e)=> {
	$$(document.body, $("div", {
		textContent: e.message,
		style: {
			position: "absolute",
			top: "20px",
			left: "20px",
			right: "20px",
			color: "white",
			background: "red",
			fontFamily: "consola monespaced",
			fontSize: "small",
		}
	}));
});
const errorReporter = {};
export {errorReporter};