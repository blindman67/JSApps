"use strict";
    const toggleString = (function(){
        const controlOptionsDefault = {
            highlight : "#3d338c",
        }
        function createControl(name,options){
            var options = Object.assign({},controlOptionsDefault,options);
            var backColor;
            function setHelp(){
                if (options.help && options.help !== elements.displayName.title) {elements.displayName.title = options.help}
            }

            function mouseOver(event){
                if(!event.exclusive){
                    backColor = elements.text.style.background;
                    
                    elements.text.style.background = options.highlight;
                }
            }
            function mouseOut(event){
                if (!event.exclusive) {elements.text.style.background = backColor}
            }
            function mouseDown(event){
                if(!event.exclusive){
                    GUI.events.captureEvent("mouseup",mouseUp);
                    GUI.events.exclusive();
                }
            }
            function mouseUp(event){
                GUI.events.releaseEvent("mouseup");
                GUI.events.releaseExclusive();
                if(event.target.id === elements.text.id){
                    if(event.which === 3){
                        toggle(-1);
                        event.preventDefault();
                    }else{
                        toggle(1);
                    }
                }
            }
                
            function toggle(dir = 1){
                setValue(options.states[(options.states.indexOf(control.value) + options.states.length + dir) % options.states.length]);            
            }
            function update(dontCheckData){
                if(!dontCheckData){
                    if(options.data){
                        if (options.data[options.property] !== control.value) {setValue(options.data[options.property])}
                    }
                }
                if(control.value !== elements.text.textContent){
                    elements.text.textContent = control.value;
                    var prevVal = options.states[(options.states.indexOf(control.value) + options.states.length - 1) % options.states.length];                            
                    var nextVal = options.states[(options.states.indexOf(control.value)+ 1) % options.states.length];                            
                    elements.text.title = "Left click '"+nextVal+"' Right click '"+prevVal+"'";
                }
                setHelp();
            }
            function setValue(value){
                 // bad state so default to the first in the state list
                if (options.states.indexOf(value) === -1) {value = options.states[0]}
                control.value = value;
                if (options.data) {options.data[options.property] = value}
                if (control.onchange) {control.onchange(control)}
                else if (control.dialog.onchanged) {control.dialog.onchanged(control)}
                update(true)
            }
            function getValue(){
                if (options.data) {return options.data[options.property]}            
                return control.value;
            }
            var uName = name + GUI.getUID();
            const elements = {
                container   :  $("$D ",uName,"control toggle"),
                displayName : $("$D " + options.name, uName+"Anontation", "toggleAnotation"),
                text   : $("$D ", uName+"ToggleText", "toggleText"),
            };
            $$(elements.container,[
                elements.displayName,
                elements.text,
            ]);
            GUI.events.blockContextMenu(elements.text);
          
            GUI.events.bindEvent("mouseover",elements.text,mouseOver);
            GUI.events.bindEvent("mouseout",elements.text,mouseOut);
            GUI.events.bindEvent("mousedown",elements.text,mouseDown);


            
            function destroy(){
        
                GUI.events.unbindEvent("mouseover",elements.text);
                GUI.events.unbindEvent("mouseout",elements.text);   
                GUI.events.unbindEvent("mousedown",elements.text);
     

                elements.container.innerHTML = "";
                elements.displayName = undefined;
                elements.text = undefined;
            }

            var control = {
                type : GUI.controlTypes.toggleString,
                dialog : options.dialog,
                options,
                name ,
                uName,
                elements,
                value : options.value,
                getValue,
                setValue,
                mouseOverStyle : options.highlight,
                update,
                setHelp,
                onchanged : null,
                destroy,
                height : CONTROL_HEIGHT + 1,
            }
            setValue(options.value ? options.value : options.states[0]);        
            if (options.dialog !== undefined) {options.dialog.addControl(control)}
            return control;
        }
        return {create : createControl}
    }())


    CSSInjector.add(`
    /***********************************************************************************************************************
    * toggleString                                                       
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
    .toggleText{
        position: absolute;
        color : white;
        text-indent : 3px;
        cursor : pointer;
        top: 1px;
        left : 40px;
        right : 0px;
        text-align: center;
        background: #243232;
        border : 1px black solid;
        height : ${CONTROL_HEIGHT-4}px;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;    
    }
    `);
