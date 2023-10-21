

const buttonMasks = [1, 2, 4, 0b110, 0b101, 0b011];
const buttonNames = ["left","center","right"];
var active = false;
var element;
var m;
const mouse = Object.assign(m = {
        setElement(el, padBy = 0) {
            element = el;
            if(!active) {
                active = true;

				const bounds = element.getBoundingClientRect();
				mouse.bounds = {
					top: bounds.top + padBy / 2,
					left: bounds.left + padBy / 2,
					width: bounds.width - padBy,
					height: bounds.height - padBy,
				};
				document.addEventListener("wheel",mouse.cancelableWheel,{passive:false});
                ["mousedown","mouseup","mousemove","wheel"].forEach(name => document.addEventListener(name, mouse.event,{passive:true}));
				document.addEventListener("contextmenu", (e) => e.preventDefault() );
                mouse.fireEvent("mouseActivated");
            };
        },
        locked: false,
        left: false,
        right: false,
        center: false,
        down: false,
        buttons: 0,
		stickyButtons: 0,
        oldButtons: 0,
		wheel: 0,
		x: 0,
		y: 0,
		oX: 0,
		oY: 0,
		pX: 0,
		pY: 0,
		cancelableWheel(e) {
			e.preventDefault();
		},
        event(e) {
            mouse.oX = mouse.x;
            mouse.oY = mouse.y;
            mouse.pX = e.pageX;
            mouse.pY = e.pageY;
            mouse.alt = e.altKey;
            mouse.shift = e.shiftKey;
            mouse.ctrl = e.ctrlKey;        
			mouse.x = mouse.pX - mouse.bounds.left - scrollX;
            mouse.y = mouse.pY - mouse.bounds.top - scrollY;
			mouse.over = mouse.x >= 0 && mouse.x < mouse.bounds.width && mouse.y >= 0 && mouse.y < mouse.bounds.height;
			if (e.type === "wheel") {
				mouse.wheel += Math.sign(-e.deltaY);
            } else if (e.type === "mouseup") {
                mouse.oldButtons = mouse.buttons;
                mouse[buttonNames[e.which - 1]] = false;
                mouse.buttons &= buttonMasks[e.which + 2];        
                mouse.down = mouse.buttons !== 0;
            } else if(e.type === "mousedown") {
                mouse.oldButtons = mouse.buttons;
                mouse[buttonNames[e.which - 1]] = true;
                mouse.buttons |= buttonMasks[e.which - 1];        
                mouse.down = true;
				mouse.stickyButtons |= mouse.buttons; 
            }        
        },  

    },
    events(m)
    
);
