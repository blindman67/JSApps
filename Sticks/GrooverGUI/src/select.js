"use strict";
    const SELECT_BOX_MAX_LINES = 16;
    const selection = (function(){
        const controlOptionsDefault = {
            highlight : "#3d8c33",
            selectedColor : "red",
        }
        function createControl(name,options){
            var options = Object.assign({},controlOptionsDefault,options);
            var backColor;
            var scrollPos = 0;
            var scrollPosR = 0;
            var scrollPosC = 0;
            var scrollAnimId;
            var selectBoxLines = 0;
            var currentSelectedElement;
            const animations = {
                scrolling(transition){
                    scrollPosC += (scrollPos - scrollPosR) * 0.3;
                    scrollPosC *= 0.3;
                    scrollPosR += scrollPosC;
                    elements.scrollBox.style.top = scrollPosR + "px";
                    if(Math.abs(scrollPosC) < 0.01 && Math.abs(scrollPosR - scrollPos) < 0.01){
                        elements.scrollBox.style.top = scrollPos + "px";
                        transition.pos = -1; // stops the transition
                        scrollAnimId = undefined; // flag no animation is happening
                    }else{
                        elements.scrollBox.style.top = scrollPosR + "px";
                    }
                },
                openSelection (transition) {elements.selectBox.style.height = (1-transition.pos) * transition.data.size + "px"},
                openedSelection (transition) {elements.selectBox.style.height = transition.data.size + "px"},
                closeSelection (transition) {elements.selectBox.style.height = (transition.pos) * transition.data.size + "px"},
                closedSelection (transition) {
                    elements.selectBox.style.display = "none";
                    control.dialog.hideOverflow();
                },

            }
            function setHelp(){
                if (options.help && options.help !== elements.displayName.title) { elements.displayName.title = options.help }
            }
            function getMaxScroll() { return  (options.items.length) * (CONTROL_HEIGHT - 1) - selectBoxLines * (CONTROL_HEIGHT - 2) }

            function setArrows(){
                var maxScroll = getMaxScroll();
                if (scrollPos < 0) { elements.scrollArrowUp.style.display = "block" }
                else {  elements.scrollArrowUp.style.display = "none" }
                if (scrollPos > -maxScroll) { elements.scrollArrowDown.style.display = "block" }
                else { elements.scrollArrowDown.style.display = "none";}
            }
            function scrollItems(event){
                if(event.type === "keyup"){ return }
                if(event.type === "keydown"){
                    scrollPos = scrollPos + CONTROL_HEIGHT * (event.code === "ArrowUp" ? -2 : 2);
                    scrollPosC += (event.code === "ArrowUp" ? -1 : 1);
                }else{
                    scrollPos = scrollPos + CONTROL_HEIGHT * Math.sign(-event.deltaY) * 2;
                    scrollPosC += 1 * Math.sign(-event.deltaY);
                }
                scrollPos = scrollPos > 0 ? 0 : scrollPos;
                var maxScroll = getMaxScroll();
                scrollPos = scrollPos < -maxScroll ? -maxScroll : scrollPos;
                if(scrollAnimId === undefined){  scrollAnimId = GUI.animation.addTransition(1000, {}, animations.scrolling) }
                setArrows();
            }
            function clicked(event){  // open select box
                if(!event.exclusive){
                    control.dialog.focus();
                    var bounds = elements.text.getBoundingClientRect();
                    var bottom = GUI.window.height;
                    var zIndex = GUI.window.getTopZIndex() + 1;
                    selectBoxLines = Math.min(SELECT_BOX_MAX_LINES,options.items.length);
                    if(selectBoxLines  * (CONTROL_HEIGHT - 2) + bounds.top + bounds.height > bottom){
                        selectBoxLines = Math.floor((bottom - (bounds.top + bounds.height)) / (CONTROL_HEIGHT - 2));
                        if(selectBoxLines < 2){
                            /* todo make select box open upwards if it can fit */                        
                        }
                    }
                    GUI.animation.addTransition(
                        0.2, { size : selectBoxLines * (CONTROL_HEIGHT-2) },
                        animations.openSelection,
                        animations.openedSelection
                    );
                    control.dialog.allowOverflow();
                    elements.selectBox.style.display = "block";
                    elements.selectBox.style.zIndex = zIndex;
                    setArrows();
                    GUI.events.captureEvent("wheel",scrollItems);
                    GUI.events.captureEvent("click",clickedItem);
                    GUI.events.captureEvent("mousedown",selectionBoxOpenMouseDown);
                    GUI.events.captureEvent("ArrowUp",scrollItems);
                    GUI.events.captureEvent("ArrowDown",scrollItems);
                    GUI.events.exclusive();
                }
            }
            function clearSelectionBox(){
                if(scrollAnimId !== undefined){
                    GUI.animation.clearTransition(scrollAnimId);
                    scrollAnimId = undefined;
                }
                var size = Math.min(SELECT_BOX_MAX_LINES,options.items.length);
                GUI.animation.addTransition(
                    0.2, {size : size * (CONTROL_HEIGHT-2) },
                    animations.closeSelection,
                    animations.closedSelection
                );
                GUI.events.releaseEvent("wheel");
                GUI.events.releaseEvent("click");
                GUI.events.releaseEvent("mousedown");
                GUI.events.releaseEvent("ArrowUp");
                GUI.events.releaseEvent("ArrowDown");            
                GUI.events.releaseExclusive();
            }
            function selectionBoxOpenMouseDown(event){
                if (event.target.id !== elements.text.id && event.target.id.indexOf(uName + "_") === -1) { clearSelectionBox() }
            }
            function clickedItem(event){
                if(!event.exclusive){
                    control.dialog.focus(); 
                    if (event.target.id.indexOf(uName + "_") === 0) { setValue(event.target.textContent) }
                    clearSelectionBox();
                }
            }
            function mouseOver(event){
                if(!event.exclusive){
                    options.mouseOver = true;
                    backColor = elements.text.style.background;                
                    elements.text.style.background = options.highlight;
                    GUI.events.captureEvent("ArrowUp",keyMove);
                    GUI.events.captureEvent("ArrowDown",keyMove);
                    control.dialog.focus();
                }
            }
            function mouseOut(event){
                elements.text.style.background = backColor;
                options.mouseOver = false;
                if(!event.exclusive){
                    GUI.events.releaseEvent("ArrowUp");
                    GUI.events.releaseEvent("ArrowDown");              
                }
            }
            function mouseDown(event){
                if(!event.exclusive){
                }
            }
            function keyMove(event){
                var step = 0;
                if(!event.exclusive){
                    if(event.type === "keydown"){
                        if(event.code === "ArrowUp"){  step = -1}
                        else if(event.code === "ArrowDown"){ step = 1}
                        selectNext(step,event);
                        event.preventDefault();
                        control.dialog.focus();        
                    }
                }
            }        
            function wheelSelect(event){
                if(!event.exclusive){
                    control.dialog.focus();
                    selectNext(Math.sign( event.deltaY));
                    event.preventDefault();
                }
            }
            function selectNext(dir){
                var itemIndex = options.items.indexOf(control.value);
                itemIndex += dir;
                itemIndex = itemIndex < 0 ? options.items.length - 1 : itemIndex >= options.items.length ? 0 : itemIndex;
                setValue(options.items[itemIndex]);
            }
            function update(dontCheckData){
                if(!dontCheckData){ 
                    if(options.data){
                        if (options.data[options.property] !== control.value) { setValue(options.data[options.property]) }
                    }
                }
                if (control.value !== elements.text.textContent) { elements.text.textContent = control.value }
                setHelp();
            }
            function setValue(value){
                var itemIndex = options.items.indexOf(control.value);
                if (itemIndex > -1) { elements.items[itemIndex].style.cssText = "" }
                itemIndex = options.items.indexOf(value);
                if(itemIndex === -1){ 
                    value = options.items[0];
                    itemIndex = 0;
                }
                control.value = value;
                if (options.data) { options.data[options.property] = value }
                if (options.onchange) { options.onchange(control) }
                else if(control.dialog.onchanged) { control.dialog.onchanged(control) }
                currentSelectedElement = elements.items[itemIndex];
                elements.items[itemIndex].style.background = options.selectedColor;
                // var itemIndex = options.items[0]; WTF ????????? have commented as make no sense
                update(true)
            }
            function getValue(){
                if (options.data) { return options.data[options.property] }            
                return control.value;
            }
            function setState(state = {}){
                const isDefault = (val) => typeof val === "string" && val.toLowerCase() === "default";
                if(state.selectedColor){
                    if(isDefault(state.selectedColor)){ state.selectedColor = controlOptionsDefault.selectedColor }
                    options.selectedColor = state.selectedColor;
                    if(currentSelectedElement !== undefined){
                        currentSelectedElement.style.background = options.selectedColor;
                    }
                }
                if(state.highlight){
                    if(isDefault(state.highlight)){ state.highlight = controlOptionsDefault.highlight }
                    options.highlight = state.highlight;
                    if(options.mouseOver){
                        elements.text.style.background = options.highlight;                
                    }
                }
                if(state.text && (state.value !== undefined || state.index !== undefined)){
                    var item;
                    if(state.value){
                         state.index = options.items.indexOf(state.value);
                    }
                    if(state.index !== undefined){
                        if(!isNaN(state.index) && state.index >= 0 && state.index < options.items.length){
                            state.value = options.items[state.index];
                            options.items[state.index] = state.text;
                            elements.items[state.index].textContent = state.text;
                            if(control.value === state.value){
                                setValue(state.text);
                            }
                        }
                    }
                }
            }                
            function getIndexOf(value){
                 return options.items.indexOf(value);
            }
            function addItem(item, index = options.items.length, forceCopy = false){
                addOption(item,index,forceCopy);
            }
            function removeItem(item){
                return removeOption(item);
            }
            function addOption(item, index = options.items.length, forceCopy = false){
                var el;
                if(forceCopy || options.items.indexOf(item) === -1){  // add to list only if a new options
                    options.items.push(item);
                }
                $$(elements.scrollBox,el = $("div",{id:uName + "_"+index,className : "selectItem scrollPos",textContent : item}));
                elements.items.push(el);
                GUI.events.bindEvent("click",el,clickedItem)
            }
            function removeOption(item){
                var el,index;
                if((index = options.items.indexOf(item)) === -1){  
                    return false;
                }
                for(var i = 0; i < elements.items.length; i++){
                    if(elements.items[i].textContent === item){
                        GUI.events.bindEvent("click",elements.items[i]);
                        elements.scrollBox.removeChild(elements.items[i]);
                        if(control.value === item){
                            control.value = "";
                        }
                        if(elements.text.textContent === item){
                            elements.text.textContent = "";
                        }
                        elements.items.splice(i,1);
                        options.items.splice(index,1);
                        scrollPos = 0;
                        scrollItems({deltaY: 0});
                        return true;
                    }
                }
            }
            var uName = name + GUI.getUID();
            const elements = {
                container   :  $("$D ",uName,"control toggle"),
                displayName : $("$D " + options.name, uName+"Anontation", "toggleAnotation"),
                text   : $("$D ", uName+"ToggleText", "toggleText"),
                dropArrow : GUI.image.getSpriteSheetImage("dropArrowDefault",0),            
                selectBox : $("$D ",uName+"selectBox","selectBox"),
                scrollBox : $("$D ",uName+"scrollBox","scrollBox"),
                items : [],
                scrollArrowUp : GUI.image.getSpriteSheetImage("dropArrowDefault",1),            
                scrollArrowDown : GUI.image.getSpriteSheetImage("dropArrowDefault",0),            
            };
            elements.dropArrow.className = "dropArrow";
            elements.dropArrow.id = uName + "dropArrow"; 
            elements.scrollArrowUp.className = "scrollArrowUp";
            elements.scrollArrowUp.id = uName + "scrollArrowUp"; 
            elements.scrollArrowDown.className = "scrollArrowDown";
            elements.scrollArrowDown.id = uName + "scrollArrowDown"; 
            options.items.forEach((item,i) => { addOption(item,i) })
            $$(elements.container,[
                elements.displayName,
                elements.text,
                elements.dropArrow,
                $$(elements.selectBox,[elements.scrollBox, elements.scrollArrowUp, elements.scrollArrowDown]),
            ]);
            GUI.events.blockContextMenu(elements.text);
            GUI.events.bindEvent("click",elements.text, clicked);
            GUI.events.bindEvent("wheel",elements.text, wheelSelect);
            GUI.events.bindEvent("mouseover",elements.text, mouseOver);
            GUI.events.bindEvent("mouseout",elements.text, mouseOut);
            GUI.events.bindEvent("mousedown",elements.text, mouseDown);
            function destroy(){
                GUI.events.unbindEvent("click", elements.text);
                GUI.events.unbindEvent("wheel", elements.text);
                GUI.events.unbindEvent("mouseover", elements.text);
                GUI.events.unbindEvent("mouseout", elements.text);
                GUI.events.unbindEvent("mousedown", elements.text);
                GUI.events.unbindEvent("mouseup", elements.text);
                elements.items.forEach(item=>GUI.events.unbindEvent("click",item));

                elements.container.innerHTML = "";
                elements.displayName = undefined;
                elements.text = undefined;
                elements.selectBox = undefined;
                elements.scrollBox = undefined;
                elements.items = undefined;
                elements.dropArrow = undefined;
                elements.scrollArrowUp.id =undefined; 
                elements.scrollArrowDown.id = undefined;             
            }
            var control = {
                type : GUI.controlTypes.selection,            
                dialog : options.dialog,
                options,
                mouseOverStyle : options.highlight,
                value : options.value,
                height : CONTROL_HEIGHT + 1,
                name ,
                uName,
                elements,
                setState,
                getValue,
                setValue,
                addItem,
                removeItem,
                addOption,
                removeOption,
                getIndexOf,
                update,
                setHelp,
                onchanged : null,
                destroy,
            }
            setValue(options.value ? options.value : options.items[0]);        
            if (options.dialog !== undefined) {options.dialog.addControl(control)}
            return control;
        }
        return {create : createControl}
    }())

    CSSInjector.add(`
    /***********************************************************************************************************************
    * Selector                                                       
    ***********************************************************************************************************************/
    .toggle {
        top: 1px;
    }
    .toggleAnotation {
        position: absolute;
        color: white;
        text-indent: 3px;
        cursor: default;
        top: 1px;    
    }
    .selectBox{
        border : 1px #FA8 solid;
        display:none;
        position: absolute;
        top: ${CONTROL_HEIGHT}px;
        left: 40px;
        background: #243232;
        right: 0px;    
        overflow: hidden;
        height: ${CONTROL_HEIGHT*SELECT_BOX_MAX_LINES}px;
        box-shadow: 3px 3px 3px rgba(0,0,0,0.5);
        
    }
    .selectItem {
        position:relative;
        color : white;
        background: #243232;
        cursor : pointer;
        list-style-type: none;
        width : 100%;
        text-align : center;
    }
    .scrollBox {
        position:absolute;
        top : 0px;
        width : 100%;
    }
    .selectItem:hover {
        background : #475;
    }
    .dropArrow {
        position: absolute;
        top : 0px;
        right : 1px;
       // pointer-events: none;
        
    }
    .scrollArrowUp {
        position: absolute;
        top : 0px;
        right : 1px;
       // pointer-events: none;
        
    }
    .scrollArrowDown{
        position: absolute;
        bottom : 0px;
        right : 1px;
      //  pointer-events: none;
        
    }
    `);
