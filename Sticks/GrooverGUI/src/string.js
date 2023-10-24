"use strict";
    const stringInput = (function(){
        const controlOptionsDefault = {
            highlight : "#3d338c",
            mouseDownHighlight : "#8d333c",
            color : "#544848",
            defaultColor : "#544848",
            placeholder : "enter text",
        }
        function createControl(name,options){
            var options = Object.assign({},controlOptionsDefault,options);
            var backColor;
            var moueDownOn;
            function setHelp(){
                if(options.help && options.help !== elements.displayName.title){
                    elements.displayName.title = options.help;
                    elements.text.title = options.help;
                }
            }
            function setInputDisplaySize(inset = 60){
                var bounds = elements.container.getBoundingClientRect();
                //bounds.width -= 60;//elements.displayName.getBoundingClientRect().width;
                elements.text.style.width = (bounds.width-inset) + "px";
            }
            function update(dontCheckData){
                if(!dontCheckData){
                    if(options.data){
                        if (options.data[options.property] !== control.value) { setValue(options.data[options.property]) }
                    }
                }
                if (control.value !== elements.text.value) { elements.text.value = control.value }            
                setInputDisplaySize();
                setHelp();
            }
            function keyEvents(event){
                if(!event.exclusive){
                    if(event.type === "mousedown"){
                        releaseFocus();
                        return;
                    }
                    if(event.type === "keyup"){
                        if(event.code === "Enter"){
                            releaseFocus();
                            return;                          
                        }else{
                            //elements.text.value += event.code;
                            setValue(elements.text.value);
                        }
                    }
                    //if(elements.text control.value){
                }
            }
            function clicked(event){
                if(!event.exclusive){
                    select();
                }
            }
            function releaseFocus(){
                if(options.focused){
                    elements.text.classList.remove("stringFocused");
                    setInputDisplaySize(0);
                    options.focused = false;
                    elements.text.blur();
                    GUI.events.releaseEvent("keyup");
                    GUI.events.releaseEvent("keydown");
                    GUI.events.releaseEvent("mousedown");
                    GUI.events.releaseExclusive();  
                }
            }                

            function select(){
                if(!options.focused){
                    elements.text.classList.add("stringFocused");
                    setInputDisplaySize(0);
                    options.focused = true;
                    elements.text.select();
                    
                    GUI.events.captureEvent("mousedown",keyEvents);
                    GUI.events.captureEvent("keyup",keyEvents);
                    GUI.events.captureEvent("keydown",keyEvents);
                    GUI.events.exclusive();      
                    control.dialog.focus();   
                }                    
            }
            function setValue(value){
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
                container   :  $("$D ",uName,"control"),
                displayName : $("$D " + (options.displayName ? options.displayName : options.name), uName+"Annotation", "annotationIndent"),            
                text : $("input",{type : "text", value : options.data[options.property],size:17,placeholder : options.placeholder,className : "control stringInput"})
            };
            $$(elements.container,[elements.displayName,elements.text]);
           // GUI.events.bindEvent("keyup",elements.text,keyup);
            GUI.events.bindEvent("click",elements.text,clicked);
            function destroy(){
                //GUI.events.unbindEvent("keyup",elements.text);
                GUI.events.unbindEvent("click",elements.text);
                elements.container.innerHTML = "";
                elements.displayName = undefined;
                elements.text = undefined;
            }
            var control = {
                type : GUI.controlTypes.string,            
                dialog : options.dialog,
                options,
                name ,
                uName,
                elements,
                focused : false,
                update,
                select,
                setHelp,
                onchanged : null,
                destroy,
                height : CONTROL_HEIGHT + 1,
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
    * StringInput
    ***********************************************************************************************************************/
    .annotationIndent{

        color : white;
        text-indent : 1px;
        cursor : default;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;  
        //pointer-events: none;
        padding-top: 2px;
      
    }
    .stringInput{
        position: absolute;
        height: ${CONTROL_HEIGHT-1}px;
        left : 60px;
        top: 1px;
        font-size : 12px;
        background-color: #400057;
        user-select: text;
        cursor: auto;
        padding: 0px;
        border-width: 0px;
        border-style: none;
        border-color: rgba(0, 0, 0, 0);
        color: #ffdece;
        text-indent: 4px;
        text-shadow: 1px 1px 1px #000;
    }
    .stringFocused{
        left : 0px;
    }
    /*.button:hover {
        background: #344898;
    }    */
    `);
