function $(com, props) {
	const elementAssign = (el, props) => {
		if (props.style) {
			const style = props.style;
			delete props.style;
			Object.assign(el, props);
			Object.assign(el.style, style);
			props.style = style;
			return el;
		}
		return Object.assign(el, props);
	}
	if ($.isStr(com)) {
		if (com[0] === "?") { // query
			if (com[1] === "@") { return props.getBoundingClientRect() }
		    const qry = document.querySelectorAll(com.slice(1).trim());
			if (isNaN(props)) { return [...qry] }
			props = Number(props);
			if (Number(props) < 0) { props = qry.length - props }
			props = props < 0 ? 0 : props > qry.length - 1 ? qry.length - 1 : props;
			return qry[props]
		}
		com = com.toLowerCase();
		com = com === "text" ? document.createTextNode(props) : document.createElement(com);
	}
	return $.isObj(props) ? elementAssign(com, props) : com;
}
function $$(el, ...sibs) {
	var idx = 0, where = 1;
	while (idx < sibs.length) {
		const sib = sibs[idx++];
		if ($.isNum(sib)) { where = Number(sib) }
		else if ($.isStr(sib)) { sibs[--idx] = $("text", sib) }
		else if (where <= 0) { el.insertBefore(sib, el.firstChild) }
		else { el.appendChild(sib) }
	}
	return el;
}
function $R(fromEl, ...els){
	for (const el of els) {
		fromEl.removeChild(el);
	}
	return fromEl;
}
$.isObj = val => typeof val === "object" && !Array.isArray(val) && val !== null;
$.isArr = val => Array.isArray(val);
$.isNum = val => !isNaN(val);
$.isStr = val => typeof val === "string";
$.setOf = (count, cb, i = 0, a = []) => {while (i < count) { a.push(cb(i++)) } return a;}
$$.INSERT = 0;
$$.APPEND = 1;

 
export {$, $$, $R};
        
        