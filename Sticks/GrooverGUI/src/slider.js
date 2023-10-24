"use strict";
    const slider = (function(){
        const controlOptionsDefault = {
            min : 0,
            max : 100,
            value : 0,
            step : 1,
            highlight : "#2cc5c5",
            color : "#0ca5a5",
            slideType : "bar",
            markWidth : 6,
            hideText : false,
            active : true,
        }
        function createControl(name,options){
            var preColour;
            var debugCounter = 0;            
            var options = Object.assign({},controlOptionsDefault,options);
            if (options.step >= 1) {options.digits = 0}
            else if (options.step >= 0.1) {options.digits = 1}
            else if (options.step >= 0.01) {options.digits = 2}
            else if (options.step >= 0.001) {options.digits = 3}
            function mouseSliderDrag(event){
                if(event.type === "mouseup"){
                    GUI.events.releaseEvent("mousemove");
                    GUI.events.releaseEvent("mouseup");
                    GUI.events.releaseExclusive();
                    elements.sliderTop.style.background = options.color;
                }
                var sliderPos = 0;
                var bounds = elements.slideBack.getBoundingClientRect();
                sliderPos = event.pageX-bounds.left;
                sliderPos = sliderPos < 0 ? 0 : sliderPos > bounds.width ?  bounds.width : sliderPos;
                var newVal = (sliderPos / bounds.width);
                newVal = (control.max - control.min) * newVal + control.min;
                setValue(newVal);
            }
            function barMouseDown(event){
                if(options.active){
                    GUI.events.captureEvent("mousemove",mouseSliderDrag);
                    GUI.events.captureEvent("mouseup",mouseSliderDrag);
                    GUI.events.exclusive();      
                    
                    mouseSliderDrag(event);
                    control.dialog.focus();            
                }
            }
            function stepValue(step, event){
                var value;
                var stepExtra = event && event.ctrlKey ? 10:1;
                if (control.step) {value = control.value + Math.sign(step) * control.step * stepExtra}
                else {value = control.value + Math.sign(step) * ((control.max - control.min) / 100) * stepExtra}
                setValue(value);
            }
            function keyMove(event){
                var step = 0;
                if(!event.exclusive){
                    if(options.active){
                        if(event.type === "keydown"){
                            if(event.code === "ArrowLeft"){
                                step = -1;
                            }else if(event.code === "ArrowRight"){
                                step = 1;
                            }
                            stepValue(step,event);
                            event.preventDefault();
                            control.dialog.focus();        
                        }
                    }
                }
            }
            function wheelMove(event){
                if(!event.exclusive){
                    if(options.active){
                        var step = -event.deltaY;
                        stepValue(step, event);
                        //event.preventDefault();
                        control.dialog.focus();
                    }
                }
            }
            function mouseOver(event){
                if(options.active){
                    control.mouseOver = true;
                    if (!event.exclusive) {
                        elements.sliderTop.style.background = options.highlight;
                        GUI.events.captureEvent("ArrowLeft",keyMove);
                        GUI.events.captureEvent("ArrowRight",keyMove);
                        control.dialog.focus();                
                    }
                }
            }
            function mouseOut(event){
                control.mouseOver = false;
                if (!event.exclusive) {
                    elements.sliderTop.style.background = options.color;
                    GUI.events.releaseEvent("ArrowLeft");
                    GUI.events.releaseEvent("ArrowRight");                
                }
            }
            function setSlideBar(){
                var bounds = elements.slideBack.getBoundingClientRect();
                var pos = ( (control.value-control.min) / (control.max - control.min)) * bounds.width;
                if(pos + "px" !== elements.sliderTop.style.width){
                    if (options.slideType === "bar") {elements.sliderTop.style.width = pos + "px"}
                    else if(options.slideType === "mark"){
                        elements.sliderTop.style.width = options.markWidth + "px";
                        elements.sliderTop.style.left = (pos-(options.markWidth/2)) + "px";
                    }
                }
            }
            function setSlideText(){
                if (elements.textInput.value !== control.value.toFixed(control.digits)) {elements.textInput.value = control.value.toFixed(control.digits) }
            }
            function textChanged (event){
                var newVal = elements.textInput.value;
                if (!isNaN(newVal)) {setValue(newVal)}
            }
            function setHelp(){
                if (options.help && options.help !== elements.displayName.title) {
                    elements.displayName.title = options.help;
                    elements.slideBack.title = options.help;
                    elements.textInput.title = options.help;
                    elements.sliderTop.title = options.help;
                }
            }
            function setActiveState(){
                if(options.active) {
                    elements.displayName.classList.remove("slideInactive");
                    elements.sliderTop.classList.remove("slideInactive");
                    elements.sliderTop.classList.remove("slideTopInactive");
                    elements.textInput.classList.remove("slideInactive");                   
                    elements.slideBack.classList.remove("slideInactive");                   
                }else{
                    elements.displayName.classList.add("slideInactive");
                    elements.sliderTop.classList.add("slideInactive");
                    elements.sliderTop.classList.add("slideTopInactive");
                    elements.textInput.classList.add("slideInactive");                   
                    elements.slideBack.classList.add("slideInactive");                   
                }
            }            
            function setState(state = {}){
                const isDefault = (val) => typeof val === "string" && val.toLowerCase() === "default";
                if(state.color){        
                    if (isDefault(state.color)) { state.color = controlOptionsDefault.color }
                    options.color = state.color;
                    if(! control.mouseOver){ elements.sliderTop.style.background = options.color }
                }
                if(state.help){ setHelp(state.help) }
                if(state.text){
                    if (isDefault(state.text)) { state.text = (options.displayName ? options.displayName : options.name) }
                    elements.displayName.textContent = state.text;                    
                }
                if(state.highlight){
                    if (isDefault(state.highlight)) { state.highlight = controlOptionsDefault.highlight }
                    options.highlight = state.highlight;
                    if(control.mouseOver){  elements.sliderTop.style.background = options.highlight }
                }
                if(state.gradient){ elements.slideBack.style.background = state.gradient }
                if(state.gradientTop){ 
                    //var linear-gradient(to right
                    elements.sliderTop.style.background = state.gradientTop;
                    options.highlight= options.color = state.gradientTop;
                }
                if(state.active !== undefined){
                    options.active = state.active;
                    setActiveState();
                }
                    
            }        
            function update(dontCheckData){
                if(!dontCheckData){
                    if(options.data){
                        if (options.data[options.property] !== control.value) {setValue(options.data[options.property])}
                    }
                }
                setSlideBar();
                setSlideText();
                setHelp();
                setActiveState();
            }
            function setValue(value){
                value = value < control.min ? control.min : value > control.max ? control.max : value;
                if (control.step) {value = Math.round((value - control.min) / control.step) * control.step + control.min}
                if(value !== control.value){
                    control.value = value;
                    if (options.data) {options.data[options.property] = value}
                    if (options.onchange) {options.onchange(control)}
                    else if(control.dialog.onchanged) {control.dialog.onchanged(control)}
                }
                update(true)
            }
            function getValue(){
                if (options.data) {return options.data[options.property]}            
                return control.value;
            }
            var uName = name + GUI.getUID();             
            const elements = {
                container   :  $("$D ",uName,"control slider"),
                displayName : $("$D " + (options.hideText ? "" : ( options.displayName ? options.displayName : options.name)), uName+"Anontation", "anotation"),
                slideBack   : !options.showTicks ? $("$D ", uName+"SliderBack", "slideBack") :
                                $(GUI.image.getSpriteSheetImage("sliderTicks",0),{id:uName+"SliderBack",className:"slideBack",draggable:false}),
                textInput   : $("input",{type : "text",className : "slideInput", id : uName+"slideInput"}),
                sliderTop   : $("$D ", uName+"SliderFront", "slideFront"),
            };
            elements.sliderTop.style.background = options.color;
            $$(elements.container,[
                elements.displayName,
                elements.slideBack,
                elements.sliderTop,
                elements.textInput,
            ]);
            GUI.events.bindEvent("mousedown",elements.slideBack,barMouseDown);
            GUI.events.bindEvent("change",elements.textInput,textChanged);
            GUI.events.bindEvent("mouseover",elements.slideBack,mouseOver);
            GUI.events.bindEvent("mouseout",elements.slideBack,mouseOut);
            GUI.events.bindEvent("wheel",elements.slideBack,wheelMove); 
            function destroy(){
                GUI.events.unbindEvent("mousedown",elements.slideBack);
                GUI.events.unbindEvent("change",elements.textInput);
                GUI.events.unbindEvent("mouseover",elements.slideBack);
                GUI.events.unbindEvent("mouseout",elements.slideBack);
                GUI.events.unbindEvent("wheel",elements.slideBack);
                elements.container.innerHTML = "";
                elements.displayName = undefined;
                elements.slideBack = undefined;
                elements.textInput = undefined;
                elements.sliderTop = undefined;
            }
            var control = {
                type : GUI.controlTypes.slider,            
                dialog : options.dialog,
                name ,
                uName,
                elements,
                value : options.value,
                getValue,
                setValue,
                min : options.min,
                max : options.max,
                step : options.step,
                digits : options.digits,
                options,
                update,
                setState,
                setHelp,
                destroy,
                height : CONTROL_HEIGHT + 1,
            }
            setHelp();
            if (options.dialog !== undefined) {options.dialog.addControl(control)}
            return control;
        }
        return {
            create : createControl,
        }
    }())

    CSSInjector.add(`
    /***********************************************************************************************************************
    * Slider                                                       
    ***********************************************************************************************************************/
    .slider {
        top: 1px;
    }
    .anotation{
        position: absolute;
        color : white;
        text-indent : 2px;
        cursor : default;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;  
        pointer-events: none;
        z-index: 300;
        top: 1px;
    }
    .slideBack{
         background: #243232;
        position: absolute;
        left: 0px;
        top: 1px;
        width: 160px;
        bottom: 1px;
        cursor : ew-resize;
     
    }   
    .slideInput{
        position: absolute;
        right: 1px;
        height: ${CONTROL_HEIGHT-2}px;
        width: 30px;
        top: 1px;
        font-size : 12px;
        background-color: #655d5d;
        user-select: text;
        cursor: auto;
        padding: 0px;
        border-width: 0px;
        border-style: none;
        border-color: rgba(0, 0, 0, 0);
        border-image: transparent;
        color: #fff;
        text-indent: 2px;
        text-shadow: 1px 1px 1px #000;
        text-align : right;
    }
    .slideCanvas{
        pointer-events:none;
    }
    .slideFront{
        background: #0ca5a5;
        position: absolute;
        left: 0px;
        top: 1px;
        right: 36px;
        bottom: 1px;
        pointer-events: none;
    }
    .slideInactive{
        color : #AAA;
        cursor : default;        
    }
    .slideTopInactive{
        display : none;
    }
        
    `);
