function startMouse(supressContext = true, useWheel = true, offsetX = 0, offsetY = 0) {
	const events = ["mousedown","mouseup","mousemove"];
	useWheel && events.push("wheel");
	var eHandler;
    const m = {
		x: 0, y: 0, oldX: 0, oldY: 0, button: 0, buttonOld: 0, wheel: 0, wheelTotal: 0, alt: false, ctrl: false, shift: false, over: false,
		set extHandler(h) { if (h instanceof Function) { eHandler = h } },
		get extHandler() { return eHandler },
		isOver(el) {
			const bounds = el.getBoundingClientRect;
			return m.x >= bounds.left && m.x < bounds.right && m.y >= bounds.top && m.y < bounds.bottom;
		},
	};
	function mouseEvent(e){
        m.x = e.pageX + offsetX;
        m.y = e.pageY + offsetY;
		m.alt = e.altKey;
		m.ctrl = e.ctrlKey;
		m.shift = e.shiftKey;
		if (e.type === "mousedown") { m.buttonOld = m.button; m.button |= 1 << (e.which - 1) }
		else if(e.type === "mouseup") { m.buttonOld = m.button; m.button &= ~(1 << (e.which - 1)) }
		else if (e.type === "wheel") { m.wheelTotal += (m.wheel = Math.sign(-e.deltaY)) }
		eHandler && eHandler(e);
	}
	function cancelable(e) { e.preventDefault() }
	useWheel && document.addEventListener("wheel", cancelable, {passive: false});
	supressContext && document.addEventListener("contextmenu", cancelable);
	events.forEach(name => document.addEventListener(name, mouseEvent, {passive: true}));
	document.addEventListener("mouseout", (e) => { eHandler && eHandler(e) }, {passive: true});
	document.addEventListener("mouseover", (e) => { eHandler && eHandler(e) }, {passive: true});
	return m;
}
export {startMouse};

