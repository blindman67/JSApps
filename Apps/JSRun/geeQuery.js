const setOf = (count, cb, i = 0, a = []) => {while (i < count) { a.push(cb(i++)) } return a}
const assign = Object.assign;
const freeze = Object.freeze;
const aFreeze = obj => freeze(assign(obj));
const Enum = (baseId, ...names) => Object.freeze(names.reduce((obj, name, id) => (obj[name] = id + baseId, obj), {}));
const listener = (el, name, call, opt = {}) =>( el.addEventListener(name, call, opt), el);
const elements = obj => (Object.entries(obj).forEach(([name, qry]) => obj[name] = $(qry)), obj);



const $ = (command, props) => {
	const elAssign = (el, props) => {
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
	if ($.isStr(command)) {
        command = command.trim();
		if (command[0] !== "<") {
		    const qry = document.querySelectorAll(command);
            $.found = qry.length;
			if (isNaN(props) || command[1] === "#") { return command[1] === "#" ? qry[0] : [...qry] }
			props = Number(props);
			if (Number(props) < 0) { props = qry.length - props }
			props = props < 0 ? 0 : props > qry.length - 1 ? qry.length - 1 : props;
			return qry[prop];
		}
		command = command.slice(1, command.length - 1).toLowerCase();
		command = command === "text" ? document.createTextNode(props) : document.createElement(command);
	}
	return $.isObj(props) ? elAssign(command, props) : command;
}
const $$ = (element, ...sibs) => {
	var idx = 0, appendWhere = 1;
	while (idx < sibs.length) {
		const sib = sibs[idx++];
		if ($.isNum(sib)) { appendWhere = Number(sib) }
		else if ($.isStr(sib)) { sibs[--idx] = $("<text>", sib) }
		else if (appendWhere <= 0) { element.insertBefore(sib, element.firstChild) }
		else { element.appendChild(sib) }
	}
	return element
}
Object.assign($, {
    isObj: val => !Array.isArray(val) && val !== null && typeof val === "object",
    isNum: val => !isNaN(val),
    isStr: val => typeof val === "string",
    text: (text, props = {}) => ({textContent: text, ...props}),
    class: (className, props = {}) => ({className, ...props}),
    id: (id, props = {}) => ({id, ...props}),
    classText: (className, text, props = {}) => ({className, textContent: text, ...props}),
    classId: (className, id, props = {}) => ({className, id, ...props}),
    textId: (text, id, props = {}) => ({id, textContent: text, ...props}),
    classTextId: (className, text, id, props = {}) => ({className, id, textContent: text, ...props}),
});
$$.INSERT = 0;
$$.APPEND = 1;