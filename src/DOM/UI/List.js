import {$,$$,$R} from "../geeQry.js";
import {getUID} from "../../utils/getUID.js";
import {commands} from "../../utils/commands.js";


export {List};
List.style = `
.frame .list {
	position: absolute;
	border: 1px solid black;
	background-color: #UI_BG_COLOR#;
	color: #UI_TEXT_COLOR#;
	cursor: pointer;	
	padding-left: 5px;
	font-size: x-small;	
	height: 12px;
}
.frame .list.downOn {
	color: white;
}
.frame .list.over {
	border: 1px solid white;
	background-color: UI_HOVER_BG_COLOR;
	
}
.frame .list.disabled {
	pointer-events: none;
	background-color: #DISABLED_BG_COLOR#;
}
.frame .list .text {
	position: absolute;
	top: 0px;
	left: 0px;
	pointer-events: none;
	padding-left: 2px;
	font-size: x-small;
	color: #UI_TEXT_COLOR#;
}
.frame .list .dropArrow {
	pointer-events: none;
	position: absolute;
	top: -2px;
	right: 2px;	
	width: 14px;
	text-align: right;
}
.frame .list .selected {
	position: absolute;
	top: 0px;
	right: 16px;
	pointer-events: none;
	padding-left: 2px;
	font-size: x-small;
	background: #UI_BG_COLOR_ITEM#;
	color: #UI_TEXT_COLOR_ITEM#;
}
.dropBox {
	position: absolute;
	/*pointer-events: none;*/
	padding-left: 2px;
	font-size: x-small;
	background: #UI_BG_COLOR_ITEM#;
	color: #UI_TEXT_COLOR_ITEM#;
	z-index: 2000;
}
.dropBox.hide {
	display: none;
}
.dropBox .listItem {
	position: absolute;
	left: 1px;
	right: 1px;
	padding-right: 7px;
	text-align: right;
	cursor: pointer;
	border: 1px solid #CHECK_SLIDE_OUTLINE_COLOR#;
}
.dropBox .listItem.even {
	background: #LIST_ITEM_EVEN_COLOR#;
}
.dropBox .listItem.odd {
	background: #LIST_ITEM_ODD_COLOR#;
}
.dropBox .listItem:hover {
	background: #LIST_ITEM_HOVER_BG_COLOR#;
	color: #LIST_ITEM_HOVER_COLOR#;
	border: 1px solid #CHECK_SLIDE_OUTLINE_HIGHLIGHT_COLOR#;
}
.dropBox .listItem.selected {
	background: #LIST_ITEM_SELECTED_BG_COLOR#;
	color: #LIST_ITEM_SELECTED_COLOR#;	
}
.dropBox .listItem.highlight {
	
}
.dropBox .listItem.disabled {
	pointer-events: none;
	
}
`

const DOWN_ARROW = "\ud83d\udf83";
const RIGHT_ARROW = "\ud83d\udf80";
function ListItem(container, text, top, idx, command_Id) {
	this.container = container;
	this.id = getUID();
	this.element = $("div", {className: "listItem " + (idx % 2 ? "odd" : "even"), textContent: text, list_item: this, command_Id, style: {top: top + "px"}});
	$$(this.container, this.element);
	this.text = text;
	this.isSelected = false;
	this.isHighlighted = false;
	this.isEnabled = true;
}
ListItem.prototype = {
	remove() { $R(this.container, this.element) },
	add() { $$(this.container, this.element) },
		
	update() { 
	    if (this.text !== this.element.textContent) { this.element.textContent = this.text }
		if (this.isSelected) { this.element.classList.add("selected") }
		else { this.element.classList.remove("selected") }
		if (this.isHighlighted) { this.element.classList.add("highlight") }
		else { this.element.classList.remove("highlight") }
		if (this.isEnabled) { this.element.classList.remove("disabled") }
		else { this.element.classList.add("disabled") }
	},
	enable() {
		if (!this.isEnabled) {
			this.isEnabled = true;
			this.element.classList.remove("disabled");
		}
	},
	disable() {
		if (this.isEnabled) {
			this.isEnabled = false;
			this.element.classList.add("disabled");
		}
	},
	get selected() { return this.isSelected },
	set selected(v) {
		if (this.isSelected !== v) {
			this.isSelected = v == true;
			this.update();
		}
	},
	get highlighted() { return this.isHighlighted },
	set highlighted(v) {
		if (this.isHighlighted !== v) {
			this.isHighlighted = v == true;
			if (this.isHighlighted) { this.element.classList.add("highlight") }
			else { this.element.classList.remove("highlight") }
			this.update();
		}
	},
};
function List(dialog, mouse, options = {}) {
	const opts = {
		text: "List",
		name: options.name || ("list" + getUID()),
		disabled: false,
		items: options.items ? [...options.items] : [],
		selected: undefined,
		selectedIdx: -1,
		dropped: false,
		
		...options,
	}
	var state, over = false, dropBoxHeight = 0,items = opts.items, select = opts.selected ? opts.selected : opts.items[0];
	opts.selected = undefined;
	opts.items = undefined;
	function mouseEvent(event, type) {
		if(type === mouse.events.mouseover) { over = true }
		if(type === mouse.events.mouseout) {  over = false }	
		if(type === mouse.events.mouseup) {
			if ((mouse.button & 1) === 0 && (mouse.buttonOld & 1) === 1) {
				mouse.buttonOld &= 0b110;
				if (mouse.downOn === event.target) {
					if(opts.dropped) { API.undrop() }
					else {
						setTimeout(()=>{
							mouse.capture(dropBox.command_Id, mouseEventDropped);
							API.drop();
						},0);
					}
				}
			}
			mouse.releaseCapture(list.command_Id);
			mouse.downOn = undefined;
			updateOverState();
		}
	}
	function mouseEventDropped(event, type) {
		const t = event.target;
		if (type === mouse.events.mouseup) {
			mouse.releaseCapture(dropBox.command_Id);
			if (t.list_item) {
				if ((mouse.button & 1) === 0 && (mouse.buttonOld & 1) === 1) {
					if(mouse.downOn === t) {
						API.select = t.list_item;
						setTimeout(() => API.undrop(), 100);
					} else { API.undrop() }
				} else { API.undrop() }
			} else { API.undrop() }
			mouse.downOn = undefined;
		} else if (type === mouse.events.mousedown) {
			if (t.list_item) { mouse.downOn = t }
		} else if(type === mouse.events.wheel) {  
			API.index = (API.index + (mouse.wheel > 0 ? itemList.length - 1 : 1)) % itemList.length;
		}
	}
	var list = $("div", {className: "list", command_Id: getUID()});
	var text = $("div", {className: "text", textContent: opts.text});
	var selected = $("div", {className: "selected"});
	var dropArrow = $("div", {className: "dropArrow", textContent: RIGHT_ARROW});
	var dropBox = $("div", {className: "dropBox hide", command_Id: getUID()});
	var itemList = [];

	commands.add(dropBox.command_Id, {
		mouseEvent(e, type) {
			if(opts.dropped) {
				if(mouse.captureId === 0 && type === mouse.events.mousedown) {
					mouse.capture(dropBox.command_Id, mouseEventDropped);
					mouse.downOn = e.target;
				} else if(type === mouse.events.mouseup) { API.undrop() }
			}
		}
	});
	commands.add(list.command_Id, {
		mouseEvent(e, type) {
			if(type === mouse.events.mouseover) { over = true }
			else if(type === mouse.events.mouseout) {  over = false }	
			else if(type === mouse.events.wheel) {  
				API.index = (API.index + (mouse.wheel > 0 ? itemList.length - 1 : 1)) % itemList.length;
			} else if(mouse.captureId === 0 && type === mouse.events.mousedown) {
				mouse.capture(list.command_Id, mouseEvent);
				mouse.downOn = e.target;
			} 
			if(mouse.captureId === 0) { updateOverState() }
		}
	});	
	function updateOverState() {
		over ? list.classList.add("over") : list.classList.remove("over");
	}	
	function findListItemWithText(text, idx = 0) {
		idx = idx < 0 || isNaN(idx) ? 0 : idx;
		while (idx < itemList.length) {
			if (itemList[idx].text === text) { return [itemList[idx], idx] }
			idx ++;
		}
		return [undefined, -1];
	}
	function positionDropBox() {
		const l = list.getBoundingClientRect();
		dropBox.style.left = l.left + "px";
		dropBox.style.width = l.width + "px";
		const bottom = l.top + l.height + dropBoxHeight;
		if (bottom >= innerHeight) {
			dropBox.style.top = (l.top - dropBoxHeight) + "px";
			
		} else {
			dropBox.style.top = (l.top + l.height) + "px";
		}
	}
	
	const API = {
		get name() { return opts.name },
		disable() { if (!opts.disabled) { opts.disabled = true; API.update() } },
		enable() {  if (opts.disabled) { opts.disabled = false; API.update() } },
		set text(t) { 
			if (opts.text !== t) { text.textContent = opts.text = t }
		},
		get text() { return opts.text },
		addItems(...items) {
			const h = API.height-2;
			for (const item of items) { 
				itemList.push(new ListItem(dropBox, item, dropBoxHeight, itemList.length, dropBox.command_Id));
				dropBoxHeight += h;
			}
			dropBox.style.height = dropBoxHeight + "px";
			items.length && API.update()			
		},
		set select(item) {
			if (item instanceof ListItem) {
				if (item !== opts.selected) {
					opts.selected && (opts.selected.selected = false);
					opts.selected = item;
					opts.selected.selected = true;
					opts.selectedIdx = itemList.indexOf(item);
					state && (state[opts.name] = opts.selected.text)
					API.action("changed");
					API.update();
				}
				return
			} 
			if (!opts.selected || item !== opts.selected.text) {
				opts.selected && (opts.selected.selected = false);
				const [selected, idx] = findListItemWithText(item);
				if (selected) {
					opts.selected = selected;
					opts.selected.selected = true;
				}
				opts.selectedIdx = idx;
				state && (state[opts.name] = selected ? selected.text : undefined)
				API.action("changed");
				API.update();
			}
		},
		get selected() { return opts.selected ? opts.selected.text : undefined },
		get index() { return opts.selectedIdx },
		set index(idx) {
			if(itemList[idx] !== opts.selected && itemList[idx] !== undefined) {				
				API.select = itemList[idx];
			} else if (itemList[idx] === undefined) {
				API.select = undefined;
			}
		},
		drop() {
			if (!opts.dropped) {
				opts.dropped = true;
				positionDropBox();
				dropBox.classList.remove("hide");
				dropArrow.textContent = DOWN_ARROW;
				return true;
			}
		},
		undrop() {
			if (opts.dropped) {
				opts.dropped = false;
				dropBox.classList.add("hide");
				dropArrow.textContent = RIGHT_ARROW;

			}

		},
		get height() { return list.getBoundingClientRect().height },
		get dialog() { return dialog },
		fromState() { state && (API.select = state[opts.name]) },
		stateObj(_state) { (state = _state)[opts.name] = API.selected },
		update() {
			text.textContent = opts.text;
			list.style.left = opts.x + "px";
			list.style.right = opts.right  + "px";
			list.style.top = opts.y + "px";
			selected.textContent = opts.selected ? opts.selected.text : "";
			opts.disabled ? list.classList.add("disabled") : list.classList.remove("disabled");
		},
		action(type) { opts[type] instanceof Function && opts[type](API, type) },
		close() {
			commands.remove(list.command_Id, dropBox.command_Id);
			for (const item of itemList) { item.remove() }
			opts.selected = undefined;
			itemList.length = 0;
			$R(dialog.frame, list);
			$R(dialog.container, dropBox);
			state = list =  text = selected = dropBox = undefined;			
			delete API.list;		
		},		
		list,
	}
	$$(dialog.frame, $$(list, text, selected, dropArrow));
	$$(dialog.container, dropBox);
	API.addItems(...items);
	select && (API.select = select);
	select = items = undefined;
	return API;
}
