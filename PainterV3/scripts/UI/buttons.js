"use strict";
const buttons = (() => {
    const modCommands = ["_1", "_2", "_4", "C_1", "C_2", "C_4", "S_1", "S_2", "S_4", "A_1", "A_2", "A_4", "CS_1", "CS_2", "CS_4", "CA_1", "CA_2", "CA_4", "SA_1", "SA_2", "SA_4", "CSA_1", "CSA_2", "CSA_4"];
	var overrideDisabled = false;
    const floatingPannelPos = {
    }
    function createInput(container, width, height, button) {
        var value, input;

        input = button.textInput;
        input.uid = UID++;
        input.defaultValue = input.value;
        input.silent = true;
        input.updateValue = (silent) => {
            const oldSilent = input.silent;
            input.silent = silent;
            container.updateValue();
            input.silent = oldSilent;
        }
        container.updateValue = function(mouse, event) {
            log("Called " + input.value);
            if ((event === undefined && !container.disabled) || (event !== undefined && !event.target.disabled) || overrideDisabled) {

                container.value = input.value ?? "";
                if (!input.silent && !overrideDisabled) {
                    issueCommand(button.command, input.value)

                }
            }
        }
        container.blurInput = function() {
            container.updateValue();
            keyboard.release(input.uid);
        }
        container.focusInput = function() {
            if (mouse.captured === 0 || mouse.captured === input.uid) {
                if (keyboard.requestCapture(input.uid)) {
                    input.defaultValue = input.value;
                    return;
                }
            }
            log ("Focuse failed")
            container.blur();
        }
        container.keydown = function(e) {
            if (e.key === "Tab") { e.preventDefault() }
        }
        container.keyup = function(e) {
            if (e.key === "Escape") {
                input.value = container.value = input.defaultValue;
                container.blur();
                return;
            }
            if (e.key === "Enter") {
                input.value = container.value;
                container.blur();
                return;
            }
            input.value = container.value;
            input.updateValue();
        }


        container.addEventListener("keydown" ,container.keydown);
        container.addEventListener("keyup" ,container.keyup);
        container.addEventListener("focus" ,container.focusInput);
        container.addEventListener("blur" , container.blurInput);
        container.updateValue();
        input.silent = false;
        return container;
    }
    function createSlider(container, width, height, button) {
        var slide, direction = 1, totalWidth, numExtra, s, value, silent = true;
        numExtra = button.slider.valueDisplayExtra ? button.slider.valueDisplayExtra : 0;
        totalWidth = width - (2 * 9 + numExtra) - 3;
        s = button.slider;
        const mAKey = s.mouseAccesKey ?? 0;

		s.setRange = function(min = s.min, max = s.max, step = s.step, wStep = s.wStep) {
			s.min = Number(min);
			s.max = Number(max);
			s.step = Number(step);
			s.wStep = Number(wStep);
			direction = 1;
			if (min > max) {
				const min = s.min;
				s.min = s.max;
				s.max = min;
				s.step = s.step < 0 ? -s.step : s.step;
				s.wStep = s.sWtep < 0 ? -s.wStep : s.wStep;
				direction = -1;
			}
		}
		s.setRange()
        s.uid = UID++;
        if (s.smallMark) {
            totalWidth -= 6;
            slide = $("div", {className : "slideSmall",style : {}});
        } else { slide = $("div", {className: "slide", style: {width: "0px", height: (height - 6) + "px"}}) }
        if (s.color) { slide.style.background = s.color }
        value = $("div", {
            className: "value", textContent: button.slider.max,
            style: {width: (2 * 9 + numExtra) + "px", height: (height - 4) + "px", right: "0px"}
        });
        container.updateWheel = function(mouse, event) {
            if (!event.target.disabled) {
                if (s.stepRange) {
                    for (const step of s.stepRange) {
                        if (s.value < step[0]) {
                            s.value += Math.sign(mouse.wheel / 120) * step[1];
                            break;
                        }
                    }
                } else { s.value += mouse.wheel < 0 ? -s.wStep : s.wStep }
                mouse.oldButton = 0;
                mouse.wheel = 0;
                container.updateValue();
            }
        }
        function keyStep(code, mod) {
            var change = 0;
            if (code === "ArrowLeft") { change = mod === "s" ? -s.wStep : -s.step }
            else if(code === "ArrowRight") { change = mod === "s" ? s.wStep : s.step  }
            if (change) {
                if (mod === "c") { s.value = change < 0 ? s.min : s.max }
                else { s.value += change }
                container.updateValue();
                return true;
            }
        }
        container.focusKeyboard = function(overState) {
            if (overState) {
                if (mouse.captured === 0 || mouse.captured === s.uid) { keyboard.requestCapture(s.uid, keyStep) }
            } else { keyboard.release(s.uid) }

        };
        container.onDrag = function(mouse, event) {
            if (!event.target.disabled || mouse.captured === s.uid) {
                if (mouse.captured === s.uid) {
                    if (mouse.button === 0) {
                        mouse.release(s.uid);
                        mouse.onbutton = null;
                        mouse.onmove = null;
                    } else {
                        if (mouse.button === 4) { s.value += s.step * Math.sign(mouse.x - mouse.oldX) }
                        if (s.infinite) { s.value += ((mouse.x - mouse.oldX) / totalWidth) * (s.max-s.min) }
                        else {
                            s.value = (mouse.x / totalWidth) * (s.max - s.min) + s.min;
                            if (s.stepRange) {
                                for (const step of s.stepRange) {
                                    if (s.value < step[0]) {
                                        s.value = Math.floor(s.value / step[1]) * step[1];
                                        break;
                                    }
                                }
                            }
                        }
                        container.updateValue();
                    }
                } else {
                    if (mouse.captured === 0) {
                        if (mouse.requestCapture(s.uid, container)) { /*keyboard.requestCapture(s.uid, keyStep) */}
                    }
                    if (mouse.captured === s.uid) {
                        mAKey && mouse.setAccessKey(s.uid, mAKey);
                        if (s.infinite) { mouse.oldX = mouse.x }
                        mouse.onbutton = container.onDrag;
                        mouse.onmove = container.onDrag;
                        container.onDrag(mouse, event);
                    }
                }
            }
        }
        s.defaultValue = s.value;
        s.silent = true;
        s.updateValue = (silent) => {
            const oldSilent = s.silent;
            s.silent = silent;
            container.updateValue();
            s.silent = oldSilent;
        }
        container.updateValue = function(mouse, event) {
            if ((event === undefined && !container.disabled) || (event !== undefined && !event.target.disabled) || overrideDisabled) {
                var barV;
                const fixStep = s.wStep !== 0 ? Math.min(s.wStep, s.step) : s.step;
                if (s.cyclic){
                    const range = s.max - s.min;
                    barV = s.value = ((((s.value - s.min) % range) + range) % range) + s.min;
                } else if (s.infinite) {
                    const range = s.max - s.min;
                    barV = ((((s.value -s.min) % range) + range) % range) + s.min;
                }else{ barV = s.value = s.value < s.min ? s.min : s.value > s.max ? s.max : s.value }
                !s.infinite && (s.value = Math.round(s.value / fixStep) * fixStep);
                barV = Math.round(barV / fixStep) * fixStep;
                if (!s.silent && !overrideDisabled) { issueCommand(button.command,s.value) }
                if (s.smallMark) { slide.style.left = (((barV - s.min) / (s.max - s.min)) * totalWidth) + "px" }
                else { slide.style.width = (((barV - s.min) / (s.max - s.min)) * totalWidth) + "px" }
                value.textContent = s.decimals !== undefined ? (s.value * direction).toFixed(s.decimals) : s.value * direction;
            }
        }
        container.updateValue();
        container.changeColor = (color) => {
            if (color === undefined) {
                if(!s.color) { return }
                color = s.color;
            }
            slide.style.background = color;
        }
        s.silent = false;
        return $$(container, [slide, value]);
    }
    function createSelection(container, height, button) {
        var s = button.selection, silent = true, i = 0, listItems = [];
        s.uid = UID++;
        s.index = s.index === undefined ? 0 : s.index;
        const zIndex = container.style.zIndex;
        var element = $("div", { className : "selectionItem" + (s.className ? " "+s.className : ""), style : { height : height+"px", }});
        const dropDownElement = $("div", {
            className : "selectionDropDown",
            textContent : textIcons.triangleLeft,
            style : { height : height+"px" }
        });
        const list = $("ul",{ className : "selectionList", style : { top : "15px",left : "0px",}});
        button.canEnable = function() { return list.listItems.length }
        function selectItem(index = s.index, beSilent = silent){
            if(index >= 0 && index < list.listItems.length) {
                list.listItems[s.index].classList.remove("selectionListItemHighlight");
                s.index = index;
                list.listItems[s.index].classList.add("selectionListItemHighlight");
				const sl = silent;
				silent = beSilent;
                container.updateValue();
				silent = sl;
            } else {
                element.textContent = "";
                button.disable();
            }
        }
        function toggleItemList(event){
            if (event && event.target.uid === s.uid && mouse.captured === s.uid && mouse.button === 0) {
                selectItem(event.target.itemIndex)
            }

            if (list.classList.contains("selectionListShow")) {
                if (mouse.captured === 0 || mouse.captured === s.uid) {
                    list.classList.remove("selectionListShow");
                    dropDownElement.textContent = textIcons.triangleLeft;
                    container.classList.remove("selectionListItemHighlight");
                    list.style.top = "15px";
                    list.style.left = "0px";
                    container.style.zIndex = zIndex;
                    mouse.release(s.uid)
                }
            }else{
                if(mouse.requestCapture(s.uid, container)) {
                    mouse.releaseOnClickFunction(s.uid, ()=> { // consume the first mouse button up
                        mouse.releaseOnClickFunction(s.uid, toggleItemList)
                    });
                    list.classList.add("selectionListShow");
                    container.classList.add("selectionListItemHighlight");
                    dropDownElement.textContent = textIcons.triangleDown;
                    const bounds = list.getBoundingClientRect();
                    const bottom = innerHeight - 2;
                    if (bounds.top + bounds.height > bottom) {
                        list.style.top = (bottom - (bounds.top + bounds.height)  +14  | 0) + "px";
                        if (bounds.width + bounds.left + 14 < innerWidth) {list.style.left = "15px" }
                        container.style.zIndex = zIndex + 400;

                    }
                }
            }
        }
        /*function onListItemClicked(mouse,event){
            log("list item selected------------------");
            selectItem(event.target.itemIndex)
            toggleItemList();
        }*/
        list.listItems = [];
        for(const item of s.items){
            list.listItems.push($("li",{
                textContent : item,
                className : "selectionListItem",
                title : s.itemHelp ? s.itemHelp[i] : null,
                itemIndex : i++,
                uid: s.uid,
            }));
        }
        $$(list, list.listItems);
        s.removeItem = function(itemIdx) {
            var update = false;
            if(itemIdx >= 0 && itemIdx < s.items.length) {
                s.items.splice(itemIdx, 1);
                if(Array.isArray(s.itemHelp)) { s.itemHelp.splice(itemIdx, 1) }
                const li = list.listItems.splice(itemIdx,1)[0];
                $R(list, li);
                if(s.index === itemIdx) { update = true }
                if(s.index >= s.items.length) {
                    s.index = Math.max(0,s.items.length - 1);
                    update = true;
                }
                if(update) {
                    mouse.oldButton = 0;
                    selectItem(s.index);
                }
            }
        }
        s.updateItem = function(itemIdx, text, help) {
            if(itemIdx >= s.items.length){
                let top = s.items.length;
                const extras = [];
                while(top <= itemIdx) {
                    s.items.push("");
                    if(Array.isArray(s.itemHelp)) { s.itemHelp.push("") }
                    let li;
                    list.listItems.push(li = $("li",{
                        textContent : "",
                        className : "selectionListItem",
                        title :  null,
                        itemIndex : top++,
                        uid: s.uid,
                    }));
                    extras.push(li);
                }
                $$(list, extras);
            }
            if(itemIdx >= 0 && itemIdx < s.items.length) {
                s.items[itemIdx]  = list.listItems[itemIdx].textContent = text;
                if (Array.isArray(s.itemHelp)) {
                    s.itemHelp[itemIdx] = list.listItems[itemIdx].title = (help ? help : null);
                }else {
                    s.itemHelp = list.listItems[itemIdx].title = (help ? help : null);
                }
                if(s.index === itemIdx){
                    element.textContent = s.items[s.index];
                    container.title = s.itemHelp ? s.itemHelp[s.index] : null;
                }
            }
        }
        container.updateWheel = function(mouse, event) {
            if (!event.target.disabled) {
                var index = s.index;
                if(mouse.wheel < 0){
                    index += 1;
                    index %= s.items.length;
                    mouse.wheel += 120;
                }else if(mouse.wheel > 0){
                    index += s.items.length-1;
                    index %= s.items.length;
                    mouse.wheel -= 120;
                }
                mouse.oldButton = 0;
                selectItem(index);
            }
        }
        container.openSelection = function(mouse, event){

            if (!event.target.disabled && (mouse.captured === 0 || mouse.captured === s.uid)) {
                mouse.downOn = null;
                setTimeout(toggleItemList,0);
            }
        }
        /*container.onButtonClick = function(mouse, event){

            if (!event.target.disabled && (mouse.captured === 0 || mouse.captured === s.uid)) {

            }
        }*/
        container.updateValue = function(mouse, event) {
            if ((event === undefined && !container.disabled) || (event !== undefined && !event.target.disabled)) {

                if (!silent) { issueCommand(button.command, button, event) }
                element.textContent = s.items[s.index];
                container.title = s.itemHelp ? s.itemHelp[s.index] : null;
            }
        }
        s.selectItem = selectItem;

        selectItem();
        silent = false;
        return $$(container, [element, dropDownElement, list]);
    }
    function createList( width, height, button, foldable = false, scroller) {
        if(button && button.list) { button.list.uid = UID ++ }
        if(button && button.fold) { button.fold.uid = UID ++ }
        var list = $("div", { className : foldable ? "fold" : "list", style : { } });
        list.isList = true;
        scroller = scroller === undefined ? list : scroller;
        var scrollingBy = 0;
        var scrollChase = 0;
        var scrollRateChange = 0
        const wheelMoment = () => {
            const Y = scroller.scrollY;
            if((scrollingBy < 0 && Y === 0) || (scrollingBy > 0 && Y >= scroller.scrollTopMax)) {
                scrollingBy = 0;
                scrollChase = 0;
                scrollRateChange = 0;
            } else {
                scrollRateChange += (scrollingBy - scrollChase) * 0.15;
                scrollRateChange *= 0.5;
                scrollChase += scrollRateChange;
                scroller.scrollBy(0,scrollChase);
                scrollingBy += -Math.sign(scrollingBy);
                if (Math.abs(scrollingBy) > 1) {
                    extraRenders.addOneTime(wheelMoment);
                } else {
                    scrollingBy = 0;
                    scrollChase = 0;
                    scrollRateChange = 0;
                }
            }
        }
        const wheelScroll = (amount) => {
            if(scrollingBy === 0){
                scrollingBy -= amount / 10;
                wheelMoment();
            }else{
                scrollingBy -= amount / 10;
           }
        };
        list.addExistingItem = function(group, item) {
            //var item;
            $$(group, [ item.element  ]);
            return item;
        }
        list.addItem = function(commandId, name, onDrag) {
            var item;
            $$(list, [ item = $("div", { className : "listItem",textContent : name, commandId, onDrag, wheelScroll}) ]);
            return item;
        }
        list.addFoldItem = function(button) {
            var item;
            button.list = createList(width, height, button, true, scroller);
            $$(list, [
				$$(button.list , [
					item = $("div", { className : "foldItem", textContent : button.name, commandId : button.commandId, wheelScroll })
				])
			]);
            return item;
        }
        list.remove = function(element) { return  $R(list, element) }

        return list;
    }
    const groups = {};
    var zStack = 1000;
    var floatingClose;
    function setupKeyboardCommand(but) {
        if (but.key) {
            let str = "";
            let mods = but.key.split("[")[1];
            let keyName = but.key.split("[")[0];
            let keyMods = {};
            if (mods !== undefined) {
                str += mods.indexOf("c") > -1? "[ctrl]" : "";
                str += mods.indexOf("a") > -1 ? "[alt]" : "";
                str += mods.indexOf("s") > -1 ? "[shift]" : "";
                keyMods.ctrl = mods.indexOf("c") > -1;
                keyMods.alt = mods.indexOf("a") > -1;
                keyMods.shift = mods.indexOf("s") > -1;
                keyMods.second = mods.indexOf("r") > -1;
            }
            keyboard.mapKeyCommand(keyName, keyMods, undefined, but.command);
			if(Array.isArray(but.help)) {
				but.keyHelp = "\nKey "+str + "[" + keyName.replace("Key", "") + "]";
			} else {
				but.help += "\nKey "+str + "[" + keyName.replace("Key", "") + "]";
			}
        }
    }
    function createSimpleDialog(textDesc, keepOpen, batchScope) {
        /*
            This function is a rather ill thought out hack and is not of release quality. It and the supporting commandLine interface needs a rewrite


            Text desc format
            ------------------------------

            `dialogTitle Width|Dialog But1?button help,Dialog But2?button help|UI`

            Width is optional
            Must have at least one dialog button
            UI comma delimited UI commands

            example

            "Exit 10|Save?Saves befor exit,Exit?Exits without save,Cancel?Do nothing|File not saved select option"



            UI commands
            ------------------------------

            , delimits commands
            ,, adds spacer
            ^  move up. reverse of spacer eg ,^,
            {  begins row. Use Must be single { and } eg  button,{,button,button,},
            }  ends row
            !  Big. Makes button text big. eg ,text !Big,
            $name links to a batch variable by name
            Text
                Start with text for left align text or textCenter
                text

            Selection list
                % Seperates selection items
                    Example a selection list linked to batch variable. Selectable items include help.
                    ,$color,Selection title%Red?This is red%Blue?This is blue,
            Slider
                slider name min max step value color
                    Example
                        creates a slider from 1 to 100 steps 1 current value 50 and color green
                        ,slider SlideTitle 1 100 1 50 #0F0,
                        To link to batch variable
                        ,$MyBatchVar,slider SlideTitle 1 100 1 50 #0F0,
            textInput

                textInput name 'value string'

            Image
                Inserts image. Image must be in relative directory ./icons/
                {imagesrc.png 10 10?help}    shows image  width height (**optional) ?help optional


             MOTES
             ----------------------------------
             ** IMAGE width and height currently must be included




        */


        var ignoreCommands = false;
        var timeoutHandle;
        var groupName = "simpleDialogGroup";
        var results = {
            waiting : true,
            optionClicked : "",
            exitClicked : "",
            groupName,
        };
        var width = 0;

        var title = textDesc.split("|")[0].split(" ");
        if(!isNaN(title[0])){
            width = Number(title.shift());
        }
        title = title.join(" ");
        var exitButtons = textDesc.split("|")[1].split(",");
        var optionButtonDesc = textDesc.split("|")[2].split(",");
        // remove trailing empty strings if memu text has trailing commas
        if(exitButtons[exitButtons.length - 1].trim() === "") { exitButtons.pop() }
        if(optionButtonDesc[optionButtonDesc.length - 1].trim() === "") { optionButtonDesc.pop() }
        var optionButtons = [];
        var optionButtonHelp = [];
        var rows = [];
        var options = [];
        var args = {};
        var currentArgName;
        var currentButtonId;
        var addSpacer = 0;
        optionButtonDesc.forEach(opt=>{
            const trOpt = opt.trim();
            if(trOpt === "") {
                addSpacer += 0.3;
            } else if (trOpt === "^") {
                addSpacer -= 1 / 3;
            } else if (trOpt === "{") {
                if(rows.length > 0 && rows[rows.length - 1].end === -1) { rows[rows.length - 1].end = optionButtons.length - 1 }
                rows.push({start:optionButtons.length, end: -1});
            }else if(trOpt === "}") {
                if(rows.length > 0 && rows[rows.length - 1].end === -1) { rows[rows.length - 1].end = optionButtons.length - 1 }
            } else if (trOpt[0] === "{" && trOpt.endsWith("}")) {
                optionButtons.push(trOpt);
                options.push({arg : currentArgName, bid: currentButtonId, value : trOpt, addSpacer});
                currentButtonId = currentArgName = undefined;
                addSpacer = 0;
            }else if(opt[0] === "~"){
                currentButtonId = opt.slice(1);
            }else if(opt[0] === "$"){
                currentArgName = opt;
            }else if(opt.includes("%")) { // is a selection list
                optionButtons.push(opt);
                optionButtonHelp.push(opt.split("%")[0].split("?")[1]);
                options.push({arg : currentArgName, bid: currentButtonId, value : opt , addSpacer});
                currentButtonId = currentArgName = undefined;
                addSpacer = 0;
            }else{
                const opts = opt.replace(/\\\?/g,"#Q#").split("?");
                optionButtons.push(opts[0].replace(/#Q#/g,"?"));
                optionButtonHelp.push(opts[1] ? opts[1].replace(/#Q#/g,"?") : "");
                options.push({arg : currentArgName, bid: currentButtonId, value : opts[0] , addSpacer});
                currentButtonId = currentArgName = undefined;
                addSpacer = 0;
            }
        });
        function closeDialog() {
            pannel = undefined;
            handler.close();
        }
        width = Math.max(width, Math.max(exitButtons.length, 2) * 6);
        var height = optionButtons.length+3 - rows.reduce((count,row) => count + (row.end !== -1 ? row.end - row.start : 0),0);
        var exitWidth = width / exitButtons.length;
        var pannel = buttons.FloatingPannel($("#floatingContainer")[0], {title , width : width*16, height : height * 16, onclosing : closeDialog});
        if (!pannel) {return}
        if(exitButtons[0] === ""){ // no exit options give so assume a satus dialog is to be displayed
            exitButtons.length = 0;
        }
        var x = 0;
        var y = 1;
        var endX = 0;
        var commandBase = commands.quickDialogBase + 1;
        var butList;
        var textLineCount = 1;

        buttons.create(butList = [
                ...optionButtons.reduce((arr, text, index) => {
                    const help = optionButtonHelp[index] !== undefined ? optionButtonHelp[index] : "";
                    y += options[index].addSpacer;
                    const bid = options[index].bid;
                    if (text[0] === "{" && text.endsWith("}")) {
                        text = text.slice(1, -1);
                        const [img, help] = text.split("?");
                        const [imgSrc, w1, h1] = img.split(" ");

                         arr.push(options[index].image =  {
                            x: x + (width - w1 / 16) / 2,
                            y: y,
                            w: Number(w1) / 16,
                            h: Number(h1) / 16,
                            bid,
                            group : groupName,
                            command : commandBase++,
                            imageSrc: imgSrc,
                            help : help ? help : "",
                        });
                        //x += Number(w1);
                        y += Number(h1)/16 - 1;
                        return arr;
                    }
                    if(text.indexOf("textInput ") === 0){
                        var parts = text.replace(/ +/g," ").split(" ");
                        parts.shift();
                        const value = parts.pop();
                        const name = parts.pop();

                        var w = 0;
                        if(name !== ""){
                            arr.push({
                                x : x, y : y, w : 4, h : 1,
                                commands : commands.displayOnly,
                                className : "buttonDisplayTextOnly textLeft",
                                text : name.replace(/\_/g," "),
                                bid,
                            });
                            w = 4;

                        }

                        arr.push(options[index].textInput =  {
                            x: x + w, y: y++, w: width - w, h: 1, bid,
                            group: groupName,
                            command: commandBase++,
                            textInput: {value},
                        })

                        args[options[index].arg.substr(1)] = options[index].textInput;
                        return arr;

                    }
                    if(text.indexOf("slider ") === 0 || text.indexOf("sliderwrap ") === 0){
                        const infinite = text.includes("sliderwrap ");
                        var parts = text.replace(/ +/g," ").split(" ");
                        parts.shift();
                        var space = "";
                        var name = "";
                        while(isNaN(parts[0])){
                            name += space + parts.shift();
                            space = " ";
                        }
                        var min = Number(parts.shift());
                        var max = Number(parts.shift());
                        var decimals = Math.abs(Math.log10(max));
                        var valueDisplayExtra = ((Math.abs(Math.log10(max)) | 0) ) * 9;
                        valueDisplayExtra = valueDisplayExtra < 0 ? 0 : valueDisplayExtra;
                        var step = Number(parts.shift());
                        if (step % 1 > 0) {
                            const fract = step % 1;
                            if (fract < 0.001) { decimals += 4; valueDisplayExtra += 4 * 8 }
                            else if (fract < 0.01) { decimals += 3; valueDisplayExtra += 3 * 8 }
                            else if (fract < 0.1) { decimals += 2; valueDisplayExtra += 2 * 8 }
                            else { decimals += 1; valueDisplayExtra += 1 * 8 }
                           
                        }                           
                        var value = Number(parts.shift());
                        var color = parts[0] !== undefined ? parts.shift() : "black";
                        if(!isNaN(color) || parts.length)  {
                            const dd = ((isNaN(color) ? Number(parts[0]) : Number(color)) + "").split(".");
                            if(dd.length === 2){
                                decimals = Math.max(decimals, Number(dd[1]));
                                valueDisplayExtra = (Number(dd[0]) + Number(dd[1])) * 9;
                            } else {
                                decimals = 0;//Math.max(decimals, Number(dd[1]));
                                valueDisplayExtra = Number(dd[0]) * 9;
                            }
                            color = isNaN(color) ? color : "black";
                        }

                        var w = 0, slideLabel;
                        if(name !== ""){
                            arr.push(slideLabel = {
                                x : x, y : y, w : 4, h : 1,
                                commands : commands.displayOnly,
                                className : "buttonDisplayTextOnly textLeft",
                                text : name.replace(/\_/g," "),
                                bid,

                            });
                            w = 4;

                        }

                        arr.push(options[index].slide =  {
                            x : x + w, y : y++, w : width - w, h : 1,bid,
                            group : groupName,
                            command : commandBase++,
                            slider : { min, max, step, wStep : step, value, color, decimals, valueDisplayExtra, infinite},
                        })
                        if(slideLabel) { options[index].slide.label = slideLabel }
                        args[options[index].arg.substr(1)] = options[index].slide;
                        return arr;
                    }
                    const row = rows.find(r => r.end != -1 && index >= r.start && index <= r.end);
                    var rw = width;

                    var rIdx = 0;
                    if(row) {
                        rw = width / (row.end - row.start + 1);
                        rIdx = index - row.start;
                    }

                    if(text.indexOf("text ") === 0 || text.indexOf("textCenter ") === 0){
                        y -= 1;
                        const isCentered = text.indexOf("textCenter ") === 0;
                        let but;
                        if (!isCentered && text.includes("[") && text.includes("]")) {
                            const textA = text.split("[")[0];
                            const textB = text.split("[")[1].split("]")[0];
                            arr.push(but = {
                                x, y,
                                w: width - 0.3,
                                h: 1,
                                bid,
                                group : groupName,
                                command : commandBase++,
                                textOnly : true,
                                textSplit : true,
                                lines : true,
                                className: "textButtonTextSplit",
                                classNameLeft: "textButtonTextLabelLeft",
                                classNameRight: "textButtonTextContentRight",
                                textLeft : textA.replace("textCenter ","").replace("text ",""),
                                textRight : textB,
                                help : help ? help : "",
                            });
                            args["TextLine_" + textLineCount] = but;
                            y +=  2;

                        } else {
                            arr.push(but = {
                                x, y,
                                w: width,
                                h: isCentered ? 1.5 : 1,
                                bid,
                                group : groupName,
                                command : commandBase++,
                                textOnly : true,
                                lines : true,
                                className: isCentered ? "textButtonLabelCenter" : "",
                                text : text.replace("textCenter ","").replace("text ",""),
                                help : help ? help : "",
                            });
                            y += isCentered ? 2.5 : 2;
                            args["TextLine_" + textLineCount] = but;
                        }


                        return arr;
                    }
                    if(text[0] === "*"){
                        text = text.substr(1);
                    }
                    const selectionBox = text.includes("%");
                    const bigButton = text.indexOf("!") === 0;
                    var rowEndExtra = 0;
                    if(options[index] && options[index].arg && !selectionBox) {
                            arr.push(options[index].textButton = {
                                x: x + rw * rIdx, y: y, w: rw, h : 1.1,bid,
                                group : groupName,
                                command : commandBase++,
                                className : row ? "textButtonArgRowItem" : "textButtonLeftText",
                                text: text.replace(/\_/g," "),
                                help, subText : "",
                            });
                            if(!row || index === row.end) {y += 1.1}

                            args[options[index].arg.substr(1)] = options[index].textButton;
                    }else{
                        if(selectionBox) {
                            const hasHelp = text.includes("?");
                            const subOpts = text.split("%").map(opt => opt.split("?")[0]);
                            const subOptsHelp = text.split("%").map(opt => {const o = opt.split("?"); o.shift(); return o.join("?")});
                            const helpA = help + (hasHelp ? subOptsHelp.shift() : "");
                            let ww = width  * 0.5;// subOpts.length;
                            let xx = x;
                            const sel =  {items: [], itemHelp: hasHelp ? [] : helpA, index: 0};
                            let but;
                            arr.push(but = options[index].textButton = {
                                x, y, w : ww, h : 1.1,bid,
                                group : groupName,
                                className : "textButtonSubGroupText",
                                text: subOpts.shift().replace(/\_/g," "),
                                selFrom: sel,
                                help: helpA,
                            });
                            xx += ww;
                            arr.push(but = {
                                xx, y, w : width * 0.5, h : 1.1,bid,
                                group : groupName,
                                command : commandBase,
                                selection: sel,
                                help: helpA,
                            });
                            while(subOpts.length) {
                                but.selection.items.push(subOpts.shift());
                                hasHelp && but.selection.itemHelp.push(subOptsHelp.shift());
                            }
                            if(options[index].arg) {
                                args[options[index].arg.substr(1)] = but;
                            }
                            y+= 1.1;
                            commandBase ++;
                        } else {
                            let but;
                            if(row){
                                if(bigButton) {
                                    text = text.slice(1);
                                    arr.push(but = {
                                        x: x + rw * rIdx, y, w: rw,  h : 1.6,bid,
                                        group : groupName,
                                        className : "textButtonRowItem textButtonBigButton",
                                        command : commandBase++,
                                        text: text.replace(/\_/g," "),
                                        help,
                                    });
                                    rowEndExtra = 0.5;

                                }else {
                                    arr.push(but = {
                                        x: x + rw * rIdx, y, w: rw,  h : 1.1,bid,
                                        group : groupName,
                                        className : "textButtonRowItem",
                                        command : commandBase++,
                                        text: text.replace(/\_/g," "),
                                        help,
                                    });
                                }
                            }else{
                                if(bigButton) {
                                    text = text.slice(1);
                                    arr.push(but = {
                                        x: x, y: y,w : width, h : 1.6,bid,
                                        group : groupName,
                                        command : commandBase++,
                                        className: "textButtonBigButton",
                                        text: text.replace(/\_/g," "),
                                        help,
                                    });
                                    y+= 0.5;
                                } else {
                                    arr.push(but = {
                                        x: x, y: y,w : width, h : 1.1,bid,
                                        group : groupName,
                                        command : commandBase++,
                                        text: text.replace(/\_/g," "),
                                        help,
                                    });
                                }
                            }
                            args["Button_" + text.trim().replace(/ /g,"_")] = but;
                            if(!row || index === row.end) {y += 1.1 + rowEndExtra};
                        }
                    }
                    return arr
                },[]),
                ...exitButtons.map(text => {
                    return {
                        x : (endX++) * exitWidth, y : y + 1, w : exitWidth, h : 1.5,
                        command : commandBase++,
                        className : "dialogExit",
                        text
                    };
                })
            ],  {pannel: pannel, size: 16});
        var mouseLock = -1;
        var mouseLockedToCId = -1;

        const bidMap = new Map();
        for(const but of butList) {
            if(but.bid !== undefined) {
                bidMap.set(but.bid,but);
            }
        }
        var handler = {
            command(commandId) {
                if(mouse.captured) {  /* This should not be needed. No commands other than that that started the capture should be being issused */
                    if(mouseLock === -1 || mouseLock !== mouse.captured){
                        mouseLock = mouse.captured;
                        mouseLockedToCId = commandId;
                    }else {
                        if(commandId !== mouseLockedToCId) {
                            return;
                        }
                    }
                }else {
                    mouseLock = -1;
                    mouseLockedToCId = -1;
                }
                if(!ignoreCommands){
                    if (commandId >= commands.quickDialogExtras && commandId < commands.quickDialogExtrasTop){
                        if(results.extras && results.extras.includes(""+(commandId - commands.quickDialogExtras))){
                            ignoreCommands = !keepOpen;
                                clearTimeout(timeoutHandle);
                                timeoutHandle = setTimeout(() => {
                                results.exitUsed = false;
                                results.optionArg = undefined;
                                results.optionClicked = "menuextra" + (commandId - commands.quickDialogExtras);
                                results.oncommand(results.optionClicked);
                                results.optionClicked = "";
                            }, 0);
                        }
                        return;
                    }
                    if ( commandId >= commandBase - exitButtons.length) {
                        if(commandId - (commandBase - exitButtons.length) >= exitButtons.length){throw new RangeError("Quick menu exit click got wrong commandID") }
                        results.exitClicked = exitButtons[commandId - (commandBase - exitButtons.length)];
                        ignoreCommands = !keepOpen;
                        clearTimeout(timeoutHandle);
                        timeoutHandle = setTimeout(() => {
                            results.exitUsed = true;
                            if(!keepOpen){
                                if(results.optionClicked !== undefined && results.optionClicked[0] === "*") {
                                    results.optionClicked = results.optionClicked.substr(1);
                                }
                                issueCommand(commands.floatingPannelClose, undefined, {target : pannel.closeElement});
                            }else{
                                results.optionArg = undefined;
                                results.optionClicked = results.exitClicked.toLowerCase() ;
                                results.oncommand(results.optionClicked);
                                results.optionClicked = "";
                                results.exitClicked = "";
                            }
                        }, 0);
                    } else if (commandId > commands.quickDialogBase) {
                        var optionId = commandId - (commands.quickDialogBase + 1);
                        results.exitClicked = exitButtons[0];
                        results.exitUsed = false;
                        if(options[optionId].slide !== undefined){
                            results.optionClicked = options[optionId].slide.slider.value;
                        } else if(options[optionId].textInput){
                            results.optionClicked = options[optionId].textInput.textInput.value;
                        } else if(options[optionId].textButton && options[optionId].textButton.selFrom){
                            const sel = options[optionId].textButton.selFrom;
                            results.optionClicked = options[optionId].value.split("%").shift() + " "  + sel.items[sel.index];

                        } else {
                            results.optionClicked = optionButtons[optionId];
                            if(mouse.downOn && mouse.downOn.but && mouse.downOn.but.subOption) {
                                results.optionClicked = results.optionClicked.split("%").shift() + " " + mouse.downOn.but.subOption;
                            }
                        }
                        results.optionArg = options[optionId].arg;
                        ignoreCommands = !keepOpen;
                        clearTimeout(timeoutHandle);
                        timeoutHandle = setTimeout(() => {
                            if(results.optionClicked !== undefined && results.optionClicked?.[0] === "*") { results.optionClicked = results.optionClicked.substr(1) }
                            if(!keepOpen){
                                issueCommand(commands.floatingPannelClose, undefined, {target : pannel.closeElement});
                            }else if(results.oncommand){
                                results.currentCmdId = commandId;
                                results.oncommand(results.optionClicked);
                                results.currentCmdId = undefined;
                                results.optionClicked = "";
                                results.exitClicked = "";
                            }
                        }, 0);
                    }
                }
            },
            close(error, viaExit) {
                if(error){
                    results.onclosed = undefined;
                    issueCommand(commands.floatingPannelClose, undefined, {target : pannel.closeElement});
                }else if (viaExit && exitButtons.includes(viaExit)) {
                    keepOpen = false;
                    handler.command((commandBase - exitButtons.length) + exitButtons.indexOf(viaExit))
                } else {

                    commandRanges.removeHandler(handler.handle);
                    handler = undefined;
                    results.waiting = false;
                    results.close = undefined;
                    results.update = undefined;
                    if (results.onclosed) { results.onclosed() }
                    results.onclosed = undefined;
                }
            },
            getButton(argName) {
                if(args[argName]) { return args[argName] }
                if(bidMap.has(argName)) { return bidMap.get(argName) }
            },
            update(argName, value, action){
                ignoreCommands = true;
                if(args[argName]){
                    if (action) {
                        if (typeof args[argName][action] === "function") {
                            args[argName][action]();
                        }
                    } else {
                        if (args[argName].slider){
                            if(!isNaN(value)){
                                args[argName].slider.value = Number(value);
                            } else if (typeof value === "string" && value[0] === "#") {
                                if (args[argName].label) {
                                    args[argName].label.element.textContent = value.slice(1)
                                }
                            } else {
                                args[argName].slider.value = args[argName].slider.defaultValue;
                            }
                            args[argName].element.updateValue();
                        } else if(args[argName].selection) {
                            if (Array.isArray(value)) {
                                let idx = 0;
                                while(idx < args[argName].selection.items.length) {
                                    if (value[idx]) {
                                       args[argName].selection.updateItem(idx, value[idx], "");
                                    } else {
                                        args[argName].selection.updateItem(idx, "-", "");
                                    }
                                    idx += 1;
                                }
                            } else {
                                args[argName].selection.selectItem(args[argName].selection.items.indexOf(value));
                            }
                        } else if(args[argName].text) {
                            let str = value.toString();
                            if (str.includes("?")) {
                                const parts = str.split("?");
                                str = parts.shift();
                                args[argName].setHelp(parts.join("?"));
                                args[argName].subElement.textContent = str;
                            } else {
                                args[argName].subElement.textContent = value.toString();
                            }
                            //args[argName].element.textContent = args[argName].text +  value.toString();
                        } else if(args[argName].textInput) {
                            let str = value?.toString() ?? value;
                            if (str?.includes("?")) {
                                const parts = str.split("?");
                                str = parts.shift();
                                args[argName].setHelp(parts.join("?"));
                                args[argName].textInput.value = str;
                            } else {
                                args[argName].textInput.value = str;
                            }
                            args[argName].element.value = str;


                        }
                    }
                }
                ignoreCommands = false;
            },

        }
        var radioStarSet = false;
        for(var i = 0; i < optionButtons.length; i ++){
            const text = optionButtons[i];
            if(text[0] === "*") {
                if (radioStarSet) {
                    API.groups.setDialogButtonCheck(groupName, commands.quickDialogBase + 1 + i, true);
                } else {
                    API.groups.setRadio(groupName, commands.quickDialogBase + 1 + i);
                    results.optionClicked = text;
                }
                radioStarSet = true;

            } else if(text[0] === "!") {
                 optionButtons[i] = text.slice(1);
            }

        }
        if(batchScope) {
            for(const arg of Object.keys(args)){
                if(typeof batchScope[arg] === "string" || !isNaN(batchScope[arg])){
                    handler.update(arg,batchScope[arg]) ;
                }
            }
            batchScope = undefined;
        }
        handler.handle = commandRanges.addHandler(commands.quickDialogBase, commands.quickDialogExtrasTop, handler);
        results.close = handler.close;
        results.update = handler.update;
        results.getButton = handler.getButton;
        results.dataset = {};
        return results;
    }

    async function dialog(textDesc) {
        return new Promise((onClosed, onCancel) => {
            const dialog = createSimpleDialog(textDesc);
            dialog.onclosed = () => {
                if (dialog.exitClicked === "Cancel" || (dialog.exitClicked === "" && dialog.optionClicked === "")) {
                    const value = (dialog.exitClicked === "" && dialog.optionClicked === "") ? "Closed" : dialog.exitClicked;
                    setTimeout(() => {onCancel({exit: value})}, 100);
                } else {
                    setTimeout(() => {onClosed({exit: dialog.exitClicked , option: dialog.optionClicked})}, 100);
                }
            };
        });
    }
    async function dialogTree(dialogs, tree, results = {}) {
        for (const [name, result] of Object.entries(tree)) {
            const res = await dialog(dialogs[name]);
            const isStr = typeof result === "string";
            results[name] = !isStr || (isStr && result !== "option") ? res.exit : res.option;
            if (!isStr && result[res.exit] !== undefined) {
                results = await dialogTree(dialogs, result[res.exit], results);
            }
        }
        return results;
    }
    const API = {
		set overrideDisabled(state) { overrideDisabled = state }, // Bug fix lets sliders get updated value if disabled and overrideDisabled is true. Note that slider update is silent
        floatingOpenCount : 0,
        floatingPannelOpen : false,
        sliders : new Map(),
        mapSliders : true,
        groups : {
            removeGroup(group) { groups[group] = undefined },
            removeGroups(groupsToRemove) {
                 for (const groupName of Object.keys(groupsToRemove)) { API.groups.removeGroup(groupName) }
            },
            clearGroup(group) {
                if (groups[group]) {
                    for (const ui of groups[group].elements) { ui.className = ui.defaultClassNames + (ui.disabled ? " buttonDisabled" : "") }
                }
            },
            setButtonRadio(checkedButton, ...buttons) {
                for(const but of buttons) {
                    if (checkedButton === but) {
                        but.element.classList.add("radioOn");
                    } else {
                        but.element.classList.remove("radioOn");
                    }

                }
            },
            setRadio(group, commandId, strictRadio) {
                if (groups[group]) {
                    for (const ui of groups[group].elements) {
                        if (ui.commandId === commandId) {
                            ui.classList.add("radioOn");
                            if(ui.but.wheelSelect) { ui.classList.add("radioOnWheelSelect")  }
                            else if (strictRadio) { ui.classList.add("radioOnStrict") }
                        } else { ui.className = ui.defaultClassNames + (ui.disabled ? " buttonDisabled" : "") }
                    }
                }
            },
            setCheck(group, commandId, checked, unquieClass) {
                if (groups[group]) {
                    for (const ui of groups[group].elements) {
                        if (ui.commandId === commandId) {
                            if (checked) {
                                if (unquieClass) { ui.classList.add(unquieClass) }
                                else { ui.classList.add("radioOn")  }
                            } else { ui.className = ui.defaultClassNames + (ui.disabled ? " buttonDisabled" : "") }
                         }
                    }
                }
            },
            setDialogButtonEnable(group, commandId, enable) {
                if (groups[group]) {
                    for (const ui of groups[group].elements) {
                        if (ui.commandId === commandId) {
                            if (enable) {
                                ui.but.enable();
                            } else {
                                ui.but.disable();
                            }
                        }
                    }
                }
            },
            setDialogButtonCheck(group, commandId, checked, unquieClass) {
                if (groups[group]) {
                    for (const ui of groups[group].elements) {
                        if (ui.commandId === commandId) {
                            if (checked) {
                                if (unquieClass) { ui.classList.add(unquieClass) }
                                else { ui.classList.add("radioOn")  }
                            } else {
                                if (unquieClass) { ui.classList.remove(unquieClass) }
                                else { ui.classList.remove("radioOn")  }
                            }
                        }
                    }
                }
            },
        },
        commands: {
            [commands.floatingPannelMinMax](event) { event?.target?.minMax && event.target.minMax() },
            [commands.floatingPannelClose](event) { event?.target?.close && event.target.close() },
        },
        command(commandId, m, event) {
            API.commands[commandId] && API.commands[commandId](event);
        },
        FloatingPannel(container, setting) {
            const id = UID ++;
            API.floatingPannelOpen = true;
            API.floatingOpenCount += 1;
            const titleId = setting.title.replace(/ /g,"_");
            var top = 22;
            var pannel = {
                container,
                setting : {...setting },
                closeable: true,
                set height(value) {
                    height = value ;
                    this.element.style.height = height + "px";
                },
                get height() { return height },
                set width(value) {
                    width = value ;
                    this.element.style.width = width + "px";
                },
                get width() { return width },
                get top() { return top },
				setTitleText(text) {name.textContent = text},
                addEvent (name, callback) { if (events[name]) { events[name].push(callback) } },
                get maximised() { return maximised },
                positionUpdate() { updatePosition(false) },
            }
            var maximised = true, minHeight = setting.minHeight ? setting.minHeight : 22;
            var w = setting.width ? setting.width : 300, width = w;
            var height = setting.height ? setting.height : 16;
            var pannelX = ((innerWidth / 2 - width / 2) | 0);
            var pannelY =  40;
            if (floatingPannelPos[titleId] !== undefined) {
                pannelX = floatingPannelPos[titleId].x;
                pannelY = floatingPannelPos[titleId].y;
            } else {
                floatingPannelPos[titleId] = {x : pannelX, y : pannelY};
            }
            if(pannelX < 0) { pannelX = 0 }
            if(pannelY < 0) { pannelY = 0 }
            var mouseOver = false;
            var pannelElement = $("div", {
                className : "floatingPannel" + (setting.className ? " " + setting.className : ""),
                style : {
                    width : width + "px",
                    height : height + "px",
                    left : pannelX + "px",
                    top : pannelY + "px",
                    zIndex: zStack,
                }
            });
            zStack += 1000;
            function mouseOverOut(event) {
                if (event.type === "mouseover") {
                    API.mouseOverFloating = true;
                    mouseOver = true;
                } else {
                    API.mouseOverFloating = false;
                    mouseOver = false;
                }
            }
            pannelElement.addEventListener("mouseover", mouseOverOut, false);
            pannelElement.addEventListener("mouseout", mouseOverOut, false);
            var title = $("div", { className : "floatingTitle", helpText : setting.help !== undefined ? setting.help : ""});
            var oldX, oldY, onBottom = false;
            function updatePosition(dragging = true) {
                const H = maximised ? height : minHeight;
                if (pannelX < 1) { pannelX = 1 }
                if (pannelY < 1) { pannelY = 1 }
                if (dragging && pannelX + mouse.bounds.width + 10 >  innerWidth) { pannelX = innerWidth - mouse.bounds.width - 10  }
                else if (pannelX + width + 10 >  innerWidth) { pannelX = innerWidth - width - 10  }
                if (pannelY + H + 5 >  innerHeight) {
                    pannelY = innerHeight - H - 5;
                    onBottom = true;
                } else { onBottom = false; }
                pannelElement.style.top = pannelY + "px";
                pannelElement.style.left = pannelX + "px";
                floatingPannelPos[titleId].x = pannelX;
                floatingPannelPos[titleId].y = pannelY;
            }
            function mouseDragTitle(mouse, event) {
                if(mouse.captured === id) {
                    if (event.type === "mousemove") {
                        pannelX += mouse.x - oldX;
                        pannelY +=  mouse.y - oldY;
                        updatePosition();
                    } else if (event.type === "mouseup") {
                        mouse.release(id);
                        mouse.onmove = undefined;
                        mouse.onbutton = undefined;
                        API.mouseOverFloating = mouseOver;
                    }
                }
            }
            title.onDrag = function(mouse, event) {
                mouse.requestCapture(id, title);
                if (mouse.captured === id) {
                    oldX = mouse.x;
                    oldY = mouse.y;
                    mouse.onmove = mouseDragTitle;
                    mouse.onbutton = mouseDragTitle;
                }
            }
			var name = $("div", {className: "floatPannelName", textContent: setting.title});
            var minMax = $("div", {className: "minMaxButton", textContent : textIcons.triangleDown });
            var close = $("div", {className: "closeButton", textContent : "X" });
            minMax.commandId = commands.floatingPannelMinMax;
            minMax.minMax = function() {
                pannelElement.classList.toggle("minimised", !(maximised = !maximised));
                if (onBottom && !maximised) { pannelY = innerHeight - minHeight - 5; }
                pannelElement.style.height = (maximised ? height : minHeight) + "px";
                minMax.textContent = maximised ? textIcons.triangleDown : textIcons.triangleLeft;
                updatePosition(false);
                setting.onMaximise && setting.onMaximise();
            }
            close.commandId = commands.floatingPannelClose;
            close.close = function() {
                pannelElement.removeEventListener("mouseover", mouseOverOut,false);
                pannelElement.removeEventListener("mouseout", mouseOverOut,false);
                API.mouseOverFloating = false;
                if (pannel.groupNames !== undefined) {
                    API.groups.removeGroups(pannel.groupNames);
                    pannel.groupNames = undefined;
                }
                if (setting.onclosing) { setting.onclosing() }
                $R(container, pannelElement);
                container = undefined;
                title.pannel = undefined;
                title = undefined;
                delete close.close;
				name = undefined;
                close = undefined;
                delete pannel.title;
                delete pannel.element;
                delete pannel.container;
                delete pannel.setting;
                delete pannel.toggleShow;
                delete pannel.minMax;
                delete pannel.addEvent;
                pannel = undefined;
                pannelElement = undefined;
                API.floatingOpenCount -= 1;
                API.floatingPannelOpen = API.floatingOpenCount > 0;
                zStack -= 1000;
            };
            pannel.title = title;
            pannel.closeElement = close;
            pannel.minMaxElement = minMax;
            title.pannel = pannel;
            pannel.element = pannelElement;
            $$(container, $$(pannelElement, $$(title, [name,minMax,close])));
            return pannel;
        },
        quickMenu : createSimpleDialog,
        dialog,
        dialogTree,
        PannelQuickSelect(settings = {}){
            const pannel = {
                id : getGUID(),
                width : 0,
                height : 0,
                top : 0,
                left : 0,
                preIssueCommand : settings.preIssueCommand,
                floatingWidth : true,
                visible : false,
                element : $("div",{className : "quickSelectPannel"}),
                toggleShow(button){
                    if(!pannel.visible){ pannel.show(button) }
                    else { pannel.hide() }
                },
                globalClickRelease(event) {
                    if(event.target.buttonPannelId === pannel.id){
                        mouse.onGlobalClick(event);
                    }
                    pannel.hide();
                    return true;
                },
                show(button) {
                    if(mouse.captured === 0){
                        mouse.requestCapture(pannel.id);
                        if(mouse.captured === pannel.id){
                            if(pannel.preIssueCommand){
                                if(issueCommand(button.commandId) === false){
                                    mouse.release(pannel.id);
                                    return;
                                }
                            }
                            mouse.releaseOnClickFunction(pannel.id,pannel.globalClickRelease);
                            var bounds = button.getBoundingClientRect();
                            var leftW = innerWidth;
                            var topH = innerHeight;
                            var left = mouse.x - pannel.width / 2 | 0
                            var top = mouse.y - pannel.height / 2 | 0
                            left = left + pannel.width > leftW ? leftW - pannel.width -8  | 0: left;
                            top = top < 2 ? 8 : top;
                            top = top + pannel.height > topH ? topH - pannel.Height -8  | 0: top;
                            pannel.element.style.top = top + "px";
                            pannel.element.style.left = left + "px";
                            pannel.element.style.width = (pannel.width -2)+ "px";
                            pannel.element.style.height = (pannel.height -2)+ "px";
                            const contain = $("#floatingContainer")[0];
                            $$(contain,[pannel.element]);
                            pannel.visible = true;
                        }
                    }
                },
                hide(){
                    if(mouse.captured === pannel.id){
                        //mouse.onGlobalClick = undefined;
                        mouse.release(pannel.id);
                        $R($("#floatingContainer")[0],pannel.element);
                        pannel.visible = false;
                    }
                }
            }
            return pannel;
        },
        Pannel(container, tabs, settings) {
            var height = 8;
            var top = 0;
            const events = {  show : [], open : [], close : [] };
            function fireEvent(type, ...data) {
                if (events[type]) {
                    for (const event of events[type]) { event(type, ...data) }
                }
            }
            const openToggleEvent = { dontToggle : false , opening : false};
            if (tabs) {
                const tabContainer = $("div",{ className : "pannelTabContainer" });
                const tabEl = [];
                const pannelEl = [];
                const pannels = {};
                for (const tab of tabs) {
                    const pannel = {
                        container,
                        settings : { ...settings },
                        set height(value) {}, // yes it is ignored
                        get height() { return height },
                        get top() { return top },
                        get isOpen() { return this.titleElement.classList.contains("tabOn") },
                        toggleShow() {
                            var on = this.titleElement.classList.contains("tabOn");
                            for (const tab of tabs) {
                                pannels[tab.name].element.classList.add("hide");
                                pannels[tab.name].titleElement.classList.remove("tabOn");
                            }
                            if (! on) {
                                this.element.classList.remove("hide");
                                this.titleElement.classList.add("tabOn");
                                this.fireEvent("show", this.titleElement.classList.contains("tabOn"));
                            }
                        },
                        events: {  show : [] },
                        addEvent(name, callback) { if (this.events[name]) { this.events[name].push(callback) } },
                        fireEvent(type, ...data) {
                            if (this.events[type]) {
                                for (const event of this.events[type]) { event(type, ...data) }
                            }
                        },
                    }
                    const pannelElement = $("div", { className : "tabPannel", });




                    const title = $("div", {
                        className : "tabTitle" + (tab.className ? " " + tab.className : ""),
                        textContent : objNameToHuman(tab.name),
                        commandId : commands.pannelClicked,
                        tabName : tab.name,
                        helpText : tab.help !== undefined ? tab.help : "",

                    });
                    title.pannel = pannel;
                    pannel.element = pannelElement;
                    pannel.titleElement = title;
                    pannelEl.push(pannelElement);
                    tabEl.push(title)
                    pannels[tab.name] = pannel;
                }
                pannels.tabContainer = tabContainer;
                $$(container,$$(tabContainer, [...tabEl, ...pannelEl]));
                return pannels;
            } else {
                const pannelElement = $("div", { className : "pannel" });
                var title,triangle;
                if(!settings.noTitle){
                    title = $("div", {
                        className : "title",
                        textContent : settings.title,
                        commandId : commands.pannelClicked,
                        helpText : settings.help !== undefined ? settings.help : "",
                    });
                    triangle = $("div", { className : "pannelTriangle",textContent : textIcons.triangleDown});
                    $$(title, triangle);
                }
                const pannel = {
                    container,
                    settings : {...settings },
                    set height(value) {
                        height = value ;
                        this.element.style.height = height + "px";
                    },
                    get height() { return height },
                    get top() { return top },
                    get isOpen() { return !this.element.classList.contains("hide") },
                    toggleShow() {
                        if(!settings.noTitle) {
                            var eventType;
                            var open = !this.element.classList.contains("hide");
                            openToggleEvent.dontToggle = false;
                            openToggleEvent.opening = !open;
                            fireEvent("show", openToggleEvent);
                            if (!openToggleEvent.dontToggle) {
                                this.element.classList.toggle("hide");
                                open = !this.element.classList.contains("hide");
                                if (settings.activeStyle) {
                                    if (open) {
                                        this.title.classList.add(settings.activeStyle);
                                        eventType = "open";
                                    } else {
                                        this.title.classList.remove(settings.activeStyle);
                                        eventType = "close";
                                    }
                                    fireEvent(eventType, {target : pannel, type : eventType});
                                }
                                triangle.textContent = open ? textIcons.triangleDown : textIcons.triangleRight;
                            }
                        }
                        this.open = open;
                    },
                    addEvent (name, callback) { if (events[name]) { events[name].push(callback) } },
                }
                pannel.element = pannelElement;
                if(!settings.noTitle){
                    pannel.title = title;
                    title.pannel = pannel;
                    $$(container, [title, pannelElement]);
                }else{
                    $$(container, [pannelElement]);
                }
                return pannel;
            }
        },
        create(butList, setting) {
            const pannel = setting.pannel;
            const bounds = pannel.element.getBoundingClientRect();
            const helpOn = settings.help;
            const container = pannel.element;
            const elements = {};
            const elList = [];
            var sizeFix = setting.size === 32 ? 5 : 4;
            const xs = setting.size | 0;
            var spritePos = index => (-(index % (448 / xs | 0)) * xs - 2) + "px "+ (-(index / (448 / xs | 0) | 0) * xs - 3) + "px";
            if(setting.size === 21) { spritePos = index => (-(index % 22) * 20 - 2) + "px "+ (-((index / 22 | 0) * 20 ) - 674)+ "px"; }
            var x, y, w, h, width, maxY, topY, dir, style, overLapDepth, maxX;
            width = y = x = 0;
            maxY = pannel.height;
            topY = pannel.top;
            if (pannel.floatingWidth) { maxX = pannel.width }
            else { maxX = 0 }
            dir = "right";
            overLapDepth = butList.length * 2;
            for (const but of butList) {
                if (but.x === undefined || but.y === undefined) {
                    if (dir === "right") { x += w }
                    if (dir === "down") { y += h }
                    but.x = but.x === undefined ? x : but.x;
                    but.y = but.y === undefined ? x : but.y;
                } else { [x, y, w, h] = [but.x, but.y, but.w, but.h] }
                style = {};
                const padTop = h === 1 ? 0 : 10;
                if (but.dir === "left") { style.right = (x * xs + 1) + "px"; }
                else { style.left = (x * xs + 1) + "px"; }
                style.top  = (y * xs + 1 + topY) + "px";
                if(!but.dontSize){
                    style.width  = (xs * w - sizeFix) + "px";
                    style.height = (xs * h - sizeFix ) + "px";
                }
                maxY = Math.max(maxY, (y * xs + 1) + (xs * h + 1));
                maxX = Math.max(maxX, (x * xs + 1) + (xs * w + 1));
                setupKeyboardCommand(but);
                var helpText = but.help ? (but.sprites && Array.isArray(but.help) ? but.help[0] : but.help) : "";
				but.helpText = (helpText += (but.keyHelp ? but.keyHelp : ""));
                const extraClassNames = but.className ? " " + but.className : "";
                var ui;
                if (but.canvas) {
                    ui = $("canvas", {
                        className : "buttons" + extraClassNames,
                        width : (xs * but.canvas.w - sizeFix),
                        height : (xs * but.canvas.h - sizeFix ),
                        helpText, style
                    });
                    ui.ctx = ui.getContext("2d");
                }else if (but.imageSrc) {
                    ui = $("img", {
                        src: "./icons/" + but.imageSrc,
                        className: "buttons dialogImage" + extraClassNames,
                        width: but.w ? (xs * but.w - sizeFix) : null,
                        height: but.h ? (xs * but.h - sizeFix ) : null,
                        helpText,
                        style
                    });
                } else if (but.textInput) {
                    ui = createInput($("input", {
                            type: "text",
                            spellcheck: "false",
                            className: "dialogTextInput font12" + extraClassNames,
                            value: but.text,
                            helpText,
                            style
                        }),
                        (xs * w - 4),
                        h * setting.size,
                        but
                    );
                } else if (but.slider) {
                    ui = createSlider($("div", {
                        className : "sliders" + extraClassNames,
                        helpText,style
                    }), (xs * w - 4), h * setting.size, but);
                } else if (but.selection){
                    style.zIndex = overLapDepth--;
                    ui = createSelection($("div",{className : "selection", style}),h * setting.size, but);
                    ui.style.top = style.top;
                } else if (but.textOnly) {
                    if (but.textSplit === true) {
                        ui = $$(
                            $("div",{className : "dialogText" + extraClassNames, style}), [
                                $("div",{className : "dialogText" + extraClassNames + " " + but.classNameLeft, textContent: but.textLeft}),
                                $("div",{className : "dialogText" + extraClassNames + " " + but.classNameRight, textContent: but.textRight}),
                            ]
                        );
                        ui.style.top = but.lines ? style.top : null;

                    } else {
                        ui = $("div",{className : "dialogText" + extraClassNames, textContent : but.text, style});
                        ui.style.top = but.lines ? style.top : null;
                    }
                } else if (but.list) {
                    ui = createList((xs * w - 4), h * setting.size, but);
                    ui.style.top = style.top;
                } else if (but.track) {
                    const divProps = { className : extraClassNames, helpText,style };
                    if (but.html) { divProps.innerHTML = but.html }
                    else { divProps.textContent = but.text ? but.text : "" }
                    ui = $("div", divProps);
                } else if (but.customElement) {
                    ui = but.customElement;
                    ui.style.top = style.top;
                } else {
                    const divProps = { className : "buttons" + extraClassNames, helpText,style };
                    if (but.html) { divProps.innerHTML = but.html }
                    else { divProps.textContent = but.text ? but.text : "" }
                    ui = $("div", divProps);
                }
                but.setHelp = (help = but.helpText) => { if (helpOn) { but.element.title = help ? help : "" } }
                ui.title = helpOn ? ui.helpText ?? but.helpText ?? "" : "";
                if (but.sprite !== undefined) { ui.style.backgroundPosition = spritePos(but.sprite) }
                if (but.sprites !== undefined) {
                    but.setSprite = function(index) {
                        index = ((index % but.sprites.length) + but.sprites.length) % but.sprites.length;
                        if(index !== but.spritesIdx){
                            but.spritesIdx = index;
                            const idx = but.sprites[index];
                            but.element.style.backgroundPosition = spritePos(idx);
							if(Array.isArray(but.help)) {
								if(but.help[but.spritesIdx] !== undefined) {
									but.element.title = but.help[but.spritesIdx] + (but.keyHelp ? but.keyHelp : "");
								}
							}
                        }
                    }
                    but.spritesIdx = 0;
                    but.stepSprite = function(amount) {
                        const len = but.sprites.length;
                        but.setSprite(but.spritesIdx + amount);
                        return but.spritesIdx;
                    }
                    if (but.wheelSelect) {
                        ui.updateWheel = function(mouse, wheel) {
                            if (!event.target.disabled) {
                                const pc = mouse.ctrl;
                                const ob = mouse.oldButton;
                                mouse.wheelSelect = true;
                                mouse.ctrl = mouse.wheel < 0;
                                mouse.oldButton |= 4;
                                issueCommand(but.command)
                                mouse.ctrl = pc;
                                mouse.oldButton = ob;
                                mouse.wheel = 0;
                                mouse.wheelSelect = false;
                            }
                        }
                    }
                }
				if (but.text && typeof but.text === "string" && but.text.trim() !== "") {
					but.updateText = function(text) { but.element.textContent = text }
				}
                if (but.background !== undefined) {  ui.style.background = but.background }
                ui.disabled = false;
                but.disable = function(command, force) {
                    var canDisable = true;
                    if (but.disableCheck) { canDisable = but.disableCheck(command) }
                    if (!but.element.disabled && canDisable) {
                        if (but.element.modCommands) {
                            if (command) {
                                const mcs = but.element.modCommands;
                                const mces = but.element.modEnabled;
                                let countOn = 0;
                                for (const [key, val] of Object.entries(mcs)) {
                                    if (command === val) { mces[key] = false; }
                                    if (mces[key]) { countOn++ }
                                }
                                if (countOn) { canDisable = false }
                            } else { canDisable = ![...Object.values(but.element.modEnabled)].some(v => v) }
                        }
                        if (canDisable || force === true) {
                            but.element.disabled = true;
                            const classList = but.element.classList;
                            classList.add("buttonDisabled");
                            if (classList.contains("radioOn")) { classList.remove("radioOn") }
                            if (classList.contains("radioOnStrict")) { classList.remove("radioOnStrict") }
                            but.element.title = "";
                        }
                    }
                }
                but.enable = function(command) {
                    var canEnable = true;
                    if(but.enableCheck) { canEnable = but.enableCheck(command) }
                    if(canEnable) {
                        if (command && but.element.modCommands) {
                            const mcs = but.element.modCommands;
                            const mces = but.element.modEnabled;
                            let countOn = 0;
                            for (const [key, val] of Object.entries(mcs)) {
                                if (command === val) {
                                    mces[key] = true;
                                    countOn++;
                                    break;
                                }
                            }
                            if (!countOn) { canEnable = false }
                        }
                        if (but.element.disabled && canEnable) {
                            but.element.disabled = false;
                            but.element.classList.remove("buttonDisabled");
                            but.element.title = helpOn ? but.element.helpText : "";
                        }
                    }
                }
                but.setEnabled = function(state, command) {
                    state === true ? but.enable(command) : state === false ? but.disable(command) : log.error("Buttton setEnabled got non boolean state.");
                }
                if (but.onDrag) { ui.onDrag = but.onDrag }
                if (but.onWheel) {
                    ui.updateWheel = function(mouse,event){
                        if (!but.element.disabled) {
                            const steps = mouse.wheel / 120;
                            mouse.wheel = 0;
                            mouse.oldButton = 0;
                            but.onWheel(steps);
                        }
                    }
                }
                if (but.mouseFocus) { ui.mouseFocus = but.mouseFocus }
                if (but.group) {
                    if (groups[but.group] === undefined) { groups[but.group] = {elements : []} }
                    ui.defaultClassNames = ui.className;
                    groups[but.group].elements.push(ui);
                    if (pannel.closeable) {
                        if (pannel.groupNames === undefined) { pannel.groupNames = {} }
                        pannel.groupNames[but.group] = true;
                    }
                }
                if (pannel.id) { ui.buttonPannelId = pannel.id }
                if (but.quickSelect){
                    ui.onButtonClick = function(mouse, event){
                        if (!but.element.disabled) { setTimeout(() => but.quickSelect.toggleShow(but.element),0) }
                    }
                }
                if (but.quickSelectLeft){
                    ui.onButtonClick = function(mouse, event){
                        if (!but.element.disabled && (mouse.oldButton & 1) === 1) { setTimeout(() => but.quickSelectLeft.toggleShow(but.element),0) }
                    }
                }
                if (but.quickSelectRight){
                    ui.onButtonClick = function(mouse, event){
                        if (!but.element.disabled && (mouse.oldButton & 4) == 4){ setTimeout(()=>but.quickSelectRight.toggleShow(but.element),0) }
                    }
                }
                if (but.subText !== undefined) {
                    but.subElement = $("span",{textContent : but.subText, className : "textButtonSubText"});
                    $$(ui,[but.subElement]);
                }
                if (but.repeats) {
                    ui.repeater = true;
                    ui.repeatRate = but.repeats.rate ?? 500;
                    if(but.repeats.ctrl) { ui.repeaterCtrl = true }
                    if(but.repeats.Alt) { ui.repeaterAlt = true }
                    if(but.repeats.shift) { ui.repeaterShift = true }
					but.repeats.constantRate && (ui.constantRate = true);
                }
                but.element = ui;
                ui.commandId = but.command;
                const mcs = {}, mces = {};
                var useMc = false;
                for (const mC of modCommands) {
                    but["command_" + mC] !== undefined && (mcs[mC] = but["command_"+mC], mces[mC] = true, useMc = true);
                }
                if (useMc) {
                    ui.modCommands = mcs;
                    ui.modEnabled = mces;
                    ui.modCommands._1 = but.command;
                    ui.modEnabled._1 = true;
                }

                ui.but = but;
                dir = but.dir ? but.dir : dir;
                if (but.slider && API.mapSliders) { API.sliders.set(but.command, but) }
                elList.push(ui);
            };
            $$(container, elList);
            if (!setting.pannelSizeFixed) {
                pannel.height = maxY + topY;
                if (pannel.floatingWidth) { pannel.width = maxX; }
            }
            return { width, elements }
        },
        eachCommandFor(cb, but) {  // but is button descriptor not the button as created in above function
            for (const mC of modCommands) {
                if (but["command_" + mC] !== undefined) { cb(but["command_" + mC]) }
            }
        },
    };
    return API;
}) ();