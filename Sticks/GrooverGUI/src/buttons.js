"use strict";
    const buttons = (function(){
        const controlOptionsDefault = {
            highlight : "#3d338c",
            mouseDownHighlight : "#8d333c",
            background : "#544848",
            highlightTime : 20,  // in frames which may not be consistent
            active : true,
            onhover : null,  // function get control object and second arg is true for over and false for out
        }
        function createControl(name,options) {
            var options = Object.assign({},controlOptionsDefault,options);
            var height = CONTROL_HEIGHT;
            var mouseOverId = -1;
            var mouseOverBut = false;
            var mouseDownOn; // the element the mouse button is down on
            function setHelp(){
                if(options.help && options.help !== elements.displayName.title){elements.displayName.title = options.help }
            }
            function setButtonSize() {
                var bounds = elements.container.getBoundingClientRect();
                var count = textTypes;
                var size = Math.floor((bounds.width - count * 2 - iconTypes * 2 - iconsWidth) / count);
                options.buttons.forEach((button,i)=>{
                    if(!elements[button.name].iconButton){
                        if(i === count - 1){ size = Math.ceil((bounds.width - count * 2) - (((bounds.width - count * 2) / count) * (count - 1))) }
                        elements[button.name].style.width = size + "px";
                    }
                });
            }
            function setCheckBoxLikeState(button){
                var icon;
                if(elements[button.name].toggles){
                    var index = elements[button.name].toggles.indexOf(elements[button.name].checked);
                    icon = button.asIcon.indexs[index];
                }else{
                    icon = elements[button.name].checked ? button.asIcon.onIndexOffset : 0;
                }
                setButtonState(elements[button.name],{iconIndex : icon, bothIcons : true});
            }
            function setRadioButton(name){
                options.data[options.property][name] = true
                var radioGroup = elements[name].radio;
                options.buttons.forEach((button,i)=>{
                    if(button.name !== name && elements[button.name].radio === radioGroup){
                        options.data[options.property][button.name] = false;
                    }
                });
            }
                
            
            function update(dontCheckData) {
                if(!dontCheckData){
                    if(options.likeCheckBoxes){
                        options.buttons.forEach((button,i)=>{
                            if(elements[button.name].iconButton){

                                if(elements[button.name].checked !== options.data[options.property][button.name]){
                                    elements[button.name].checked = options.data[options.property][button.name];
                                    setCheckBoxLikeState(button);
                                    control.subKey = button.name;
                                    if (control.onchanged) { control.onchanged(control) }   
                                    else if (control.dialog.onchanged) { control.dialog.onchanged(control) }                                    
                                    control.subKey = undefined;
                                }
                            }
                        })
                    }
                }
                setButtonSize() 
            }
            function mouseOver(event) {
                if(!event.exclusive){
                    if(event.target.active){
                        if(event.target.iconButton) {
                            GUI.image.updateSpriteSheetImage(event.target.spriteSheetName,event.target.iconOverIndex,event.target)
                        } else { event.target.style.background = options.highlight }
                        if(mouseOverBut === false && options.buttons[0].onhover){ 
                            options.buttons[0].onhover(control,true);
                        }
                        event.target.highlightOn = true;
                        mouseOverId = event.target.id;
                        mouseOverBut = true;
                        control.dialog.focus();
                    }
                }
            }
            function mouseOut(event){
                if(!event.exclusive){
                    if(event.target.iconButton) { 
                        GUI.image.updateSpriteSheetImage(event.target.spriteSheetName,event.target.iconIndex,event.target)                    
                    }else { event.target.style.background = event.target.uiColor }
                    event.target.highlightOn = false;
                    if(! event.notIO) { 
                        mouseOverBut = false;
                        if(options.buttons[0].onhover){ 
                            options.buttons[0].onhover(control,false);
                            
                        }
                    }
                }
            }
            function mouseDown(event){
                if(!event.exclusive){
                    if(event.target.active){
                        GUI.events.captureEvent("mouseup",clicked);
                        GUI.events.captureEvent("mouseout",clickedOut);
                        GUI.events.exclusive();                
                        mouseDownOn = event.target;
                        event.target.style.background = options.mouseDownHighlight;
                        if(event.target.fireOnMouseDown) { fire(event, event.target,control) }
                    }
                }
            }
            function onkey(event){
                if(!event.exclusive){
                    if(event.type === "keydown"){
                        if(keyBindings[event.modKey]){
                            if(elements[keyBindings[event.modKey].name] !== undefined){
                                var but = elements[keyBindings[event.modKey].name];
                                if (but.GUIAction) { fire({which:keyBindings[event.modKey].which,target : elements[keyBindings[event.modKey].name] }, but,control) }
                            }                            
                        }
                    }
                }
            }
            function clickedOut(event){
                if(mouseDownOn){
                    mouseDownOn.style.cssText = mouseDownOn.style.cssText.replace(/background.*?;/g,"");            
                    if(mouseDownOn.id === event.target.id){
                        if(event.target.fireOnMouseDown){
                            clicked(event);
                        }
                    }
                }
            }
            function setActiveState(element){
                if(element.active) { element.classList.remove("buttonInactive") }
                else{ element.classList.add("buttonInactive") }
            }
            function setState(state){ options.buttons.forEach(button => { setButtonState(button.name,state) }) }
            function setButtonState(element = options.buttons[0].name, state = {}){
                if(typeof element === "string"){
                    if(elements[element] !== undefined){
                        element = elements[element];
                    }else {
                        return;
                    }
                }
                if(element !== undefined){
                    if(element.iconButton) {
                        if(state.iconOver !== undefined){
                            element.iconOverIndex = element.iconBaseIndex + state.iconOver;  
                            if(element.highlightOn){
                                GUI.image.updateSpriteSheetImage(element.spriteSheetName,element.iconOverIndex,element);
                            }
                                
                        }
                        if(state.iconIndex  !== undefined){
                            element.iconIndex = element.iconBaseIndex + state.iconIndex;  
                            if(!element.highlightOn){
                                GUI.image.updateSpriteSheetImage(element.spriteSheetName,element.iconIndex,element);
                            }
                            if(state.bothIcons){
                                element.iconOverIndex = element.iconBaseIndex + state.iconIndex + 1;  
                                if(element.highlightOn){
                                    GUI.image.updateSpriteSheetImage(element.spriteSheetName,element.iconOverIndex,element);
                                }
                            }
                        }
                    } else { 
                        if(state.background){        
                            if(typeof state.background === "string" && state.background.toLowerCase() === "default"){
                                state.background = controlOptionsDefault.background;
                            }
                            element.style.background = state.background;
                            element.uiColor = state.background;
                        }
                        if(state.highlight){        
                            if(typeof state.highlight === "string" && state.highlight.toLowerCase() === "default"){
                                state.highlight = controlOptionsDefault.highlight;
                            }
                            options.highlight = state.highlight;
                        }
                        if(state.downHighlight){        
                            if(typeof state.downHighlight === "string" && state.downHighlight.toLowerCase() === "default"){
                                state.downHighlight = controlOptionsDefault.downHighlight;
                            }
                            options.mouseDownHighlight = state.downHighlight;
                        }                
                        if(state.text){
                            element.textContent = state.text;                    
                        }
                    }
                    if(state.active !== undefined){
                        element.active = state.active;
                        setActiveState(element);
                    }
                    if(state.highlightTime){
                        if(typeof state.highlightTime === "string" && state.highlightTime.toLowerCase() === "default"){
                            state.highlightTime = controlOptionsDefault.highlightTime;
                        }
                        options.highlightTime = state.highlightTime;
                    }
                }
            }
            function highlightFlash(element){
                GUI.animation.addFrameEvent(()=>{  mouseOut({target : element, notIO : true }) },options.highlightTime); // turn off highlight in 5 frames
                if(element.iconButton) {                            
                    GUI.image.updateSpriteSheetImage(element.spriteSheetName,element.iconOverIndex,element)
                }else{
                    if(mouseDownOn && mouseDownOn.id === element.id){ element.style.background = options.mouseDownHighlight }                        
                    else { element.style.background = options.highlight }
                }
                element.highlightOn = true;                
            }

            function fire(event,element,control){
                var prevVal,newVal;
                if(event === null){ event = {which : 1} }
                if(element.active){
                    var returnVal = element.GUIAction(event,control);
                    if (typeof returnVal === "string") {
                        element.textContent = returnVal;
                        highlightFlash(element);
                    } else if (typeof returnVal === "object"){
                        setButtonState(element,returnVal);
                        if (!returnVal.noFlash) { highlightFlash(element) }
                    } else { highlightFlash(element) }
                    if (element.likeCheckBox === true) { 
                        if(element.radio !== undefined){ setRadioButton(element.buttonName) }                            
                        update(false);
                    }
                }
            }
            function clicked(event){
                GUI.events.releaseEvent("mouseup");
                GUI.events.releaseEvent("mouseout");
                GUI.events.releaseExclusive();
                if(mouseDownOn.id === event.target.id){               
                    if (event.target.GUIAction) { fire(event,mouseDownOn,control) }
                    mouseDownOn = undefined;
                }            
            }
            function click(name = options.buttons[0].name){
                if(elements[name] !== undefined){
                    var but = elements[name];
                    if (but.GUIAction) { fire(null,but,control) }
                }
            }
            var uName = name + GUI.getUID();
            const elements = {
                container   :  $("$D ",uName,"control buttons"),
            };
            var buttons = [];
            var keyBindings = {};
            var textTypes = 0;
            var iconTypes = 0;
            var iconsWidth = 0;
            options.buttons.forEach(button => {
                var bEl;
                if(button.asIcon && GUI.image.spriteSheets[button.asIcon.name]){
                    buttons.push(elements[button.name] = $(GUI.image.getSpriteSheetImage(button.asIcon.name,button.asIcon.index),{id:uName+"_"+button.name,className:"buttonIcon"}));
                    bEl = elements[button.name];
                    bEl.iconButton = true;  
                    bEl.spriteSheetName = button.asIcon.name;
                    bEl.iconIndex = button.asIcon.index;  
                    bEl.iconBaseIndex = bEl.iconIndex; // when setting state icon index are relative to this value
                    bEl.iconOverIndex = button.asIcon.overIndex === undefined ? button.asIcon.index + 1 : button.asIcon.overIndex;  
                    iconTypes += 1;
                    var sizes = GUI.image.getSpriteSheetSpriteSize(button.asIcon.name);
                    if(button.breakLine === true){
                        height = Math.max(bEl.height*2 ,(sizes.height+3)*2) ;   
                        elements.container.classList.add("buttonMultiLine");
                   
                    }else{
                        iconsWidth += sizes.width;
                        height = Math.max(bEl.height ,sizes.height) ;
                    }
                }else{                
                    buttons.push(elements[button.name] = $("$D "+(button.displayName ? button.displayName : button.name),uName+"_"+button.name,"button"));
                    bEl = elements[button.name];
                    bEl.style.width = ((100-options.buttons.length*2)/options.buttons.length).toFixed(1) + "%";
                    bEl.iconButton = false;
                    textTypes += 1;
                } 
                bEl.uiColor = options.background;
                bEl.buttonName = button.name;
                if (button.likeCheckBox) {
                    options.likeCheckBoxes = true;
                    bEl.likeCheckBox = true;
                    if(button.toggles){ bEl.toggles = button.toggles }
                    button.checked = options.data[options.property][button.name];                    
                    if(button.radio !== undefined) { bEl.radio = button.radio }

                }
                if (button.active !== undefined) { bEl.active = button.active === false ? false :true }
                else { bEl.active = options.active === false ? false : true }
                setActiveState(bEl);
                bEl.title = button.help ? button.help : options.help ? options.help : "";
                bEl.fireOnMouseDown = button.fireOnMouseDown;
                GUI.events.blockContextMenu(bEl);
                if(typeof button.onclick === "function"){
                    bEl.GUIAction = button.onclick;
                    GUI.events.bindEvent("mousedown",bEl,mouseDown);
                    if (options.keyboardShortcut) { button.keyboardShortcut = options.keyboardShortcut }
                    if (options.keyboardShortcutLeft) { button.keyboardShortcut = options.keyboardShortcutLeft }
                    if (options.keyboardShortcutMid) { button.keyboardShortcutMid = options.keyboardShortcutMid }
                    if (options.keyboardShortcutRight) { button.keyboardShortcutRight = options.keyboardShortcutRight }
                    if(button.keyboardShortcut){
                        keyBindings[button.keyboardShortcut] = {name : button.name, which : 1};
                        GUI.events.bindKey(button.keyboardShortcut,bEl,onkey,button.keyboardPreventDefault);
                    }
                    if(button.keyboardShortcutMid){
                        keyBindings[button.keyboardShortcutMid] = {name : button.name, which : 2};
                        GUI.events.bindKey(button.keyboardShortcutMid,bEl,onkey,button.keyboardPreventDefault);
                    }
                    if(button.keyboardShortcutRight){
                        keyBindings[button.keyboardShortcutRight] = {name : button.name, which : 3};
                        GUI.events.bindKey(button.keyboardShortcutRight,bEl,onkey,button.keyboardPreventDefault);
                    }
                }
                GUI.events.bindEvent("mouseover",bEl,mouseOver);
                GUI.events.bindEvent("mouseout",bEl,mouseOut);
                
            });
            if(height > CONTROL_HEIGHT){
                elements.container.style.height = (height) + "px";
            }
            $$(elements.container,buttons);
            function destroy(){
                elements.container.innerHTML = "";
                options.buttons.forEach(button => {
                    if(typeof button.onclick === "function"){
                        GUI.events.unbindEvent("mousedown",elements[button.name]);
                        if(button.keyboardShortcut){ GUI.events.unbindKey(button.keyboardShortcut,elements[button.name]) };
                        if(button.keyboardShortcutMid){ GUI.events.unbindKey(button.keyboardShortcutMid,elements[button.name]) };
                        if(button.keyboardShortcutRight){ GUI.events.unbindKey(button.keyboardShortcutRight,elements[button.name]) };
                    }
                    GUI.events.unbindEvent("mouseover",elements[button.name]);
                    GUI.events.unbindEvent("mouseout",elements[button.name]);
                    elements[button.name] = undefined;
                });
                buttons.length = 0;
                buttons = undefined;
            }
            var control = {
                type : GUI.controlTypes.buttons,            
                dialog : options.dialog,
                options,
                click,  // call to call function click() for default or click(buttonName) to select which button
                name ,
                uName,
                elements,
                update,
                setHelp,
                onchanged : null,
                destroy,
                height : height + 1,
                setButtonState,
            }
            if(options.dialog !== undefined){
                options.dialog.addControl(control);
            }
            return control;
        }
        return {create : createControl}
    }())
    

    CSSInjector.add(`
    /***********************************************************************************************************************
    * Buttons                                                      
    ***********************************************************************************************************************/
    .buttons {
        top: 1px;
    }
    .buttonMultiLine{
        display : block;
    }
    .button{
        color: white;
        border: 1px #010101 solid;
        width: initial;
        display: inline-block;
        zoom : 1;
        background: #544848;
        cursor: pointer;
        text-align: center;
        -webkit-touch-callout: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;            
    }
    .buttonIcon{
        zoom : 1;
        background: #544848;
        cursor: pointer;
      /*  -webkit-touch-callout: none;*/
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;    
        
    }   
    .buttonInactive {
        color : #AAA;
        cursor: default;
        opacity: 0.5;
    }    

    /*.button:hover {
        background: #344898;
    }    */
    `);
