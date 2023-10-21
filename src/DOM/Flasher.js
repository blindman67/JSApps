import {$, $$, $R} from "../../src/DOM/geeQry.js";
export {Flasher};

function Flasher(element, parent = document.body) {
	var flashing = false, handle, cName;
	function flashInfo(text, time = 4000, color = "white", className) {
		if (!flashing) {
			$$(parent, element);
			flashing = true;
			if (className) {
				cName && element.classList.remove(cName);
				element.classList.add(cName = className);
			}
			element.style.color = color;
			element.textContent = text;
            flashInfo.log && flashInfo.log("I> " + text);
			handle = setTimeout(() => {
				$R(parent, element);
				flashing = false;
			}, time);
		} else {
			$R(parent, element);
			flashing = false;
			clearTimeout(handle);
			flashInfo(text, time, color);
		}
		return flashInfo;
	}
	return flashInfo;
}