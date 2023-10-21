const indent = "    ", indentSize = 4;
var currentFocus;
var text;
const log = (a) => info.textContent = a;
const keys = {
	tab: doTab,
	shifttab: doTab,
	ctrld: dupLine,
	ctrls: saveCode,
	enter: autoIndent,
	["shift}"]: autoUndent,
	ctrlarrowup(arg) { moveLine(arg, -1) },
	ctrlarrowdown(arg) { moveLine(arg, 1) },
	arrowdown: lineInfo,
	arrowup: lineInfo,
	arrowleft: lineInfo,
	arrowright: lineInfo,
	shiftarrowdown: lineInfo,
	shiftarrowup: lineInfo,
	shiftarrowleft: lineInfo,
	shiftarrowright: lineInfo,
	home: moveHome,
	shifthome: moveHome,
};
function keyEvent(e) { 
    if (e.key === "Shift" || e.key === "Control") { return }
	const k = (e.ctrlKey ? "ctrl" : "") + (e.shiftKey ? "shift" : "") + e.key.toLowerCase();
	
	keys[k]?.(textFunc(e));
	lineInfo();

}
addEventListener("keydown", keyEvent)

function textFunc(e) {
	

	const ctrl = e.ctrlKey;
	const shift = e.shiftKey;
	const el = e.target;				
	const start = el.selectionStart;
	const end = el.selectionEnd;
	text = el.value;
	return {e, ctrl, shift, el, start, end};
}
var rHdl;
function lineInfo() {
	clearTimeout(rHdl);
	rHdl = setTimeout(() => {
		rangeInfo(currentFocus._lines.lineIdxs(currentFocus.selectionStart, currentFocus.selectionEnd));		
	}, 250);
}
function rangeInfo(range) {
	if (range.end !== range.start) {
		if (range.length === 1) {
			info.textContent = "Line: " + range.idx + " column: " + (range.start - range.pos) + " sel: " + (range.end - range.start);
		} else {
			info.textContent = "Lines: " + range.idx + " - " + (range.idx + range.length) + " sel: " + (range.end - range.start);
		}
		
	} else {
		info.textContent = "Line: " + range.idx + " column: " + (range.start - range.pos);
	}
	
}

const htmlLines = html._lines = Text(html);
const styleLines = style._lines = Text(style);
const codeLines = code._lines = Text(code);


function Text(el) {
	var lines, size, lineStart, lineEnd;
	var dirty = true, changed = false;
	listener(el, "input", () => dirty = true);
	const API = freeze({
		update(get = false) {
			if (get) {
				if (changed) { el.value = lines.join("\n") }					
			} else { lines = el.value.split("\n") }
			size = el.value.length;
			dirty = false;
			changed = false;
			return API;
			
		},
		get length() {
			dirty && API.update();
			return lines.length;			
		},
		setLine(idx, line) { 
			dirty && API.update();
			if (idx >= 0 && idx < lines.length) {
				if (line !== lines[idx]) {
					lines[idx] = line;
					changed = true;
				}
			}
		},
		lineByIdx(idx) { 
			dirty && API.update();
			return lines[idx];
		},
		mapRange(range, cb) {
			var i = 0, result = [];
			while (i < range.length) {
				result.push(cb(lines[range.idx + i], range.idx + i));
				i++;
			}
			return result;
			
		},
		eachByRange(range, cb) {
			var i = 0;
			while (i < range.length) {
				cb(lines[range.idx + i], range.idx + i);
				i++;
			}
		},
		cutRange(range) {
			changed = true;
			return lines.splice(range.idx, range.length);
			
		},
		insert(idx, newLines) {
			 lines.splice(idx, 0, ...newLines);
			 changed = true;
		},
		lineIdxs(start, end) {
			var s = Math.min(start, end);
			var e = Math.max(start, end);
			if (start === end) { return {idx: API.lineIdx(s), pos: lineStart, length: 1, size: lineEnd - lineStart, start: s, end: e} }
			dirty && API.update();
			var i = 0, lineIdx = 0;
			if (s < 0) { 
				const idx = 0;
				if (e >= size) { return {idx, pos:0, length: lines.length, size, start: s, end: e} }
				const endLineIdx = API.lineIdx(e);
				return {idx, pos:0, length: endLineIdx + 1, size: lineEnd, start: s, end: e};					
			}
			if (s > size) { return {idx: size, pos: size, length: 0, size: 0, start: s, end: e}  }
			if (e < 0) { return {idx: -1, pos: 0, length: 0, size: 0, start: s, end: e}  }
			while (lineIdx < lines.length && s >= i + lines[lineIdx].length + 1) {
				i += lines[lineIdx++].length + 1;
			}
			const idx = lineIdx;
			const startPos = i;
			while (lineIdx < lines.length && e >= i + lines[lineIdx].length + 1) {
				i += lines[lineIdx++].length + 1;
			}				
			const endPos = i + lines[lineIdx].length + 1;
			return {
				idx, 
				pos: startPos, 
				length: (lineIdx < lines.length ? lineIdx - idx + 1 : lines.length - idx),
				size: endPos - startPos,
				start: s, end: e
			};
		},		
		lineIdx(pos) {
			dirty && API.update();
			var i = 0, lineIdx = 0;
			if (pos >= 0 && pos <= size) {
				while (lineIdx < lines.length && pos >= i + lines[lineIdx].length + 1) {
					i += lines[lineIdx++].length + 1;
				}
				if (lineIdx < lines.length) { 
					lineStart = i;
					lineEnd = i + lines[lineIdx].length + 1;				
					return lineIdx;
				}
			}
		},
		get lineStart() { return lineStart },
		get lineEnd() { return lineEnd },
		change(str, start, end, sel) {
			const s = Math.min(start, end);
			const e = Math.max(start, end);
			el.setRangeText(str, s, e, "select");
			if (sel === "end") { el.setSelectionRange(s + str.length, s + str.length, "forward") }
			else if (sel === "all") { el.setSelectionRange(s, s + str.length, "forward") }
			else if (sel === "start") { el.setSelectionRange(s, s, "forward") }
			dirty = true;
		},
		select(start, length) {
			const s = Math.min(start, start + length);
			const e = Math.max(start, start + length);
			el.setSelectionRange(s, e, length < 0 ? "backward" : "forward" );
		},		
		selectLines(pos, size) {
			const s = Math.min(pos, pos + size);
			const e = Math.max(pos, pos + size);
			var i = 0, idx = 0;
			while (idx < s && idx < lines.length) { i += lines[idx++].length + 1 }
			const sPos = i;
			while (idx < e && idx < lines.length) { i += lines[idx++].length + 1 }			
			el.setSelectionRange(sPos, i-1, size < 0 ? "backward" : "forward" );
		},			
	});
	return API;
}
function scrollTextToView(pos, scrollOffset = innerHeight * 0.25) {
	if (currentFocus) {
		currentFocus.focus();
		sizeText({target: currentFocus});
		currentFocus.setSelectionRange(pos, pos, "forward");
		const b = currentFocus.getBoundingClientRect();
		const sy =  scrollY + (b.top + currentFocus._lines.lineIdx(pos) * (Number(fontSize.value) * 1.25)) - scrollOffset;		
		editPannel.scrollTo(0, sy);

	}	
}
function findIndentAbove(start) {
	
	var s = start;
	var first;
	while (s >= 0 && text[s] !== "\n") { 
	    if (first === undefined && text[s] !== " ") { first = text[s] }
		s--;
	}
	s ++;
	if (s > 0) {
		var n = s;
		while (text[n] === " ") { n++ }
		return (n - s) + 1 + (first === "{" ? indentSize : 0);
	}
	return 0;	
}
function canUndent(start) {
	var s = start;
	while (s >= 0 && text[s] !== "\n") { 
		if (text[s] !== " ") { return -1 }
		s-- 
	}
	if (start - s >= indentSize) { return start - indentSize + 1 }
	return -1;	
}
function saveCode({e}) {
	e.preventDefault();
	saveToStore(true);
}
function autoIndent({e, ctrl, shift, el, start, end}) {
	e.preventDefault();
	const spaces = findIndentAbove(start-1);
	const newLine = "\n".padEnd(spaces, " ");
	el.setRangeText(newLine, start, end, "select");
	el.setSelectionRange(start + newLine.length, start + newLine.length, "forward");
		
}
function autoUndent({e, ctrl, shift, el, start, end}) {
	e.preventDefault();
	var pos = canUndent(start - 1);	
	if (pos === -1) { pos = start }
	el.setRangeText("}", pos, end, "select");
	el.setSelectionRange(pos+1, pos+1, "forward");
}
function moveHome({e, ctrl, shift, el, start, end}) {
	e.preventDefault();
	const lines = el._lines.update();
	const lineIdx = lines.lineIdx(start);	
	const lineStartPos = lines.lineStart;
	const linePos = start - lineStartPos;
	const line = lines.lineByIdx(lineIdx);
	var i = 0;
	var inHomePos = 0;
	var outHomePos = 0;
	while (i < line.length && line[i] === " ") { i ++ }
	if (i < line.length && line[i] !== " ") { outHomePos = i }
	if (linePos > 0 && linePos <= outHomePos) {
		lines.select(lineStartPos, shift ? end - lineStartPos : 0);
	} else {
		lines.select(lineStartPos + outHomePos, shift ? end - (lineStartPos + outHomePos) : 0);
	}
	
	
}
function moveLine({e, ctrl, shift, el, start, end}, dir) {	
	e.preventDefault();
	const lines = el._lines;
	const range = lines.lineIdxs(start, end);	
	if ((dir < 0 && range.idx === 0) || (dir > 0 && range.idx + range.length >= lines.length)) {
		
	} else {
		const moveLine = lines.lineByIdx(dir < 0 ? range.idx - 1 : range.idx + range.length + 1);
		const l = lines.cutRange(range);
		lines.insert(range.idx += dir, l);
		lines.update(true);
	}
	lines.selectLines(range.idx, range.length);

}
function dupLine({e, ctrl, shift, el, start, end}) {
	e.preventDefault();
	const lines = el._lines;
	const range = lines.lineIdxs(start, end);	
	var charCount = 0;
	const copyLines = lines.mapRange(range, line => {
		charCount += line.length + 1;
		return line;
	});
	lines.insert(range.idx + range.length,  copyLines);
	lines.update(true);
	lines.select(range.pos + range.size, charCount-1);
	sizeText({target: el});

		
}
function doTab({e, ctrl, shift, el, start, end}) {
	e.preventDefault();
	const lines = el._lines;
	var range, newChars = 0;
	if (!shift) {
		if (start === end) { 
			lines.change(indent, start, end, "end");
			return;
		}
		range = lines.lineIdxs(start, end);
		lines.eachByRange(range, (line, idx) => {
			newChars += line.length + indentSize + 1;
			lines.setLine(idx, indent + line);
		});
	} else {
		range = lines.lineIdxs(start, end);
		lines.eachByRange(range, (line, idx) => {
			line = line.replace(/^ {1,4}/, "");
			newChars += line.length + 1;
			lines.setLine(idx, line);
		});
		
	}
	lines.update(true);
	lines.select(range.pos, newChars-1);
}
function creatStandalone() {
	const parts = [
		html.value,
		style.value,
		code.value,
	];			
	const name = codeName.value.replace(/ /g, "_");
	
	const text = `<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<meta http-equiv="Content-Type" content="text/html;charset=ISO-8859-8">\n\t\t<title>`+name+`</title>\n\t\t<style>
`+parts[1]+`\n\t\t</style>\n\t</head>\n\t<body style = "font-family:monospace">\n\t\t`+parts[0]+`\n\t\t
<script>`+parts[2]+`\n\t\t</scr`+`ipt>\n\t</body>\n<html>`
	
	const e = document.createEvent("MouseEvents");
	e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	Object.assign(doc.createElement("a"), {
		href: URL.createObjectURL(new Blob([text], {type:"text/html"})),
		download: name + ".html",
	}).dispatchEvent(e);
	setTimeout(() => open((localStorage.MS_localDownloads ?? "/") + name + ".html", "_blank"), 1500);


}

function getStore(name, def) {
	var val = localStorage[name] ?? def;
	if (val === "undefined") { val = def }
	return val;
}
function styleCode(rule, value) {
	html.style[rule] = value;
	style.style[rule] = value;
	code.style[rule] = value;
}
const doc = document;
const body = doc.body;
html._openCloseBtn = openCloseHTML;
style._openCloseBtn = openCloseStyle;
code._openCloseBtn = openCloseCode;
html.value = getStore("JS_RUN_HTML", "HTML here").replace(/\t/g, indent);
style.value = getStore("JS_RUN_STYLE", "CSS here").replace(/\t/g, indent);
code.value = getStore("JS_RUN_CODE", "JavaScript here").replace(/\t/g, indent);
codeName.value = getStore("JS_RUN_CODE_NAME", "JSCode");
fontSize.value = getStore("JS_RUN_CODE_FS", fontSize.value);
var dark;
setTheme(dark = (localStorage.JS_RUN_CODE_THEME ?? darkTheme.textContent) === "Dark");
sizeFont(0);
currentFocus = document.getElementById(getStore("JS_RUN_FOCUS", "none"));
if (currentFocus) {
	text = currentFocus.value;
	scrollTextToView(getStore("JS_RUN_TEXT_POS", 0));
	/*currentFocus.focus();
	sizeText({target: currentFocus});
	const pos = getStore("JS_RUN_TEXT_POS",0);
	currentFocus.setSelectionRange(pos, pos, "forward");
	scrollTo(0,currentFocus.getBoundingClientRect().top + countLines(currentFocus.value, pos) * fontSize.value + innerHeight );
	*/
}


function message(mess) {
	storeSaveHTML.textContent = mess;
	storeSaveStyle.textContent = mess;
	storeSaveCode.textContent = mess;
}
function saveToStore(mess = false) {
	localStorage.JS_RUN_HTML = html.value;
	localStorage.JS_RUN_STYLE = style.value;
	localStorage.JS_RUN_CODE = code.value;	
	localStorage.JS_RUN_FOCUS = currentFocus?.id ?? "none";
	currentFocus && (localStorage.JS_RUN_TEXT_POS = currentFocus.selectionStart);
	(codeName.value !== "" || codeName.value !== "JSCode") && (localStorage.JS_RUN_CODE_NAME = codeName.value);	
	if (mess) {
		message("Saved!");
		saveToStore.tHdl = setTimeout(message, 4000, ""); 
	}
}
run.addEventListener("click", () => {
	clearTimeout(saveToStore.tHdl);
	removeEventListener("keydown", keyEvent)
	saveToStore();
	const parts = [
		html.value,
		style.value,
		code.value,
	];
	body.style = "font-family: monospace";
	const stEl = $("<style>", {innerHTML: parts[1]});
	const scEl = $("<scr"+"ipt>", {innerHTML: ";(()=>{\n" + parts[2] + "\n})();\n"});
	
	$$(doc.head, stEl);
	body.innerHTML = parts[0];
	$$(doc.body, scEl);
	

}, {once: true});
function setTheme(d) {
	dark = d;
	html.classList.toggle("dark", dark);
	style.classList.toggle("dark", dark);
	code.classList.toggle("dark", dark);
	
	body.style.color = dark ? "white" : "black";
	body.style.background = dark ? "black" : "white";

	darkTheme.textContent = dark ? "Light" : "Dark";
	localStorage.JS_RUN_CODE_THEME = dark ? "Dark" : "Light";
}
function sizeFont(dir) {
	var size = Number(fontSize.value) + dir;
	size = size < 8 ? 8 : size;
	fontSize.value = size = isNaN(size) ? 10 : size;
	styleCode("fontSize", size + "px");
	localStorage.JS_RUN_CODE_FS = size;
}
function sizeText(e) {
	currentFocus = e.target;
	const lines = currentFocus._lines.length;
	const size = lines * (Number(fontSize.value) * 1.25);
	e.target.style.height = size + "px";
	//e.target.scrollHeight !== e.target.clientHeight && (e.target.style.height = e.target.scrollHeight + "px");
	e.target._open = true;
	e.target._openCloseBtn.textContent = "-";
}
function closeText(e) {
	e.target._open = false;
	e.target.style.height = "1em";
	e.target._openCloseBtn.textContent = "+";
}
function openClose(el) {
	if (el._open) {
		el._open = false;
		el._openCloseBtn.textContent = "+";
		el.style.height = "1em";
	} else {
		el._open = true;
		el._openCloseBtn.textContent = "-";
		sizeText({target: el});
	
	}
}
smaller.addEventListener("click", () => sizeFont(-1));
larger.addEventListener("click", () => sizeFont(+1));
darkTheme.addEventListener("click", () => setTheme(!dark));
//toTop.addEventListener("click", () => scrollTo(0,0));
standalone.addEventListener("click", () => creatStandalone(0,0));
html.addEventListener("input", sizeText);
html.addEventListener("focus", sizeText);
html.addEventListener("click", lineInfo);
//html.addEventListener("blur", closeText);
style.addEventListener("input", sizeText);
style.addEventListener("focus", sizeText);
style.addEventListener("click", lineInfo);
//style.addEventListener("blur", closeText);
code.addEventListener("input", sizeText);
code.addEventListener("focus", sizeText);
code.addEventListener("click", lineInfo);
//code.addEventListener("blur", closeText);

openCloseHTML.addEventListener("click", () => openClose(html));
openCloseStyle.addEventListener("click", () => openClose(style));
openCloseCode.addEventListener("click", () => openClose(code));

