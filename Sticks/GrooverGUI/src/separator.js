"use strict";
    const separator = (function(){
        const controlOptionsDefault = {
            color : "#544848",
            background : "black",
            text : "",   
            height : CONTROL_HEIGHT,
        }
        function createControl(name,options){
            
            options = Object.assign({},controlOptionsDefault,options);
            function clicked(event){
                if(!event.exclusive){
                    control.dialog.focus();
                }
            }        
            function setHelp(){
                if(options.help && options.help !== elements.text.title){
                    elements.text.title = options.help;
                    elements.container.title = options.help;
                }
            }
            function setHeight(_height = controlOptionsDefault.height){
                if(_height){
                    if(typeof _height === "string" && isNaN(_height)){
                        if(_height.toLowerCase() === "default"){
                            _height = controlOptionsDefault.height;
                        }else if(_height.toLowerCase() === "small"){
                            _height = Math.ceil(controlOptionsDefault.height/4);
                        }else if(_height.toLowerCase() === "medium"){
                            _height = Math.ceil(controlOptionsDefault.height/2);
                        }else if(_height.toLowerCase() === "big"){
                            _height =controlOptionsDefault.height*1.5;     
                        }else if(_height.toLowerCase() === "large"){
                            _height =controlOptionsDefault.height*2;
                        }
                    }
                    elements.container.style.height = _height + "px";     
                    elements.text.style.paddingTop = Math.floor(((_height - controlOptionsDefault.height)/2)+2) + "px";
                    height = Number(_height);
                }           
            }
            function setState(state = {}){
                const isDefault = (val) => typeof val === "string" && val.toLowerCase() === "default";
                if(state.color){        
                    if (isDefault(state.color)) { state.color = controlOptionsDefault.color }
                    elements.container.style.color = options.color = state.color;
                }
                if (state.help) { setHelp(state.help) }
                if (state.height) { setHeight(state.height) }
                if (state.text) {
                    if (isDefault(state.text)) { state.text = (options.displayName ? options.displayName : options.name) }
                    elements.text.textContent = state.text;                    
                }      
                if(state.background){
                    if (isDefault(state.background)) { state.background = controlOptionsDefault.background }
                    elements.container.style.background = state.background;
                }            
            }                
            function update(dontCheckData){
                setHelp();
            }
            var uName = name + GUI.getUID();
            var height = options.height;
            const elements = {
                container   :  $("$D ",uName,"control"),
                text : $("$D " + (options.displayName ? options.displayName : options.name), uName+"Separator", "separator"),
            };
            setHeight(height);
            elements.container.style.background = options.background ? options.background : options.defaultBackground;
            $$(elements.container,[elements.text]);
            GUI.events.bindEvent("click",elements.container,clicked);        
            function destroy(){
                GUI.events.unbindEvent("click",elements.container);        
                elements.container.innerHTML = "";
                elements.text = undefined;
            }
            var control = {
                type : GUI.controlTypes.seperator,            
                dialog : options.dialog,
                options,
                name ,
                uName,
                elements,
                update,
                destroy,
                height : height + 1,
                setHeight,
                setState,
                setHelp,
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
    * Seperator
    ***********************************************************************************************************************/
    .separator{
        color : white;
        text-indent : 1px;
        cursor : default;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;  
        //pointer-events: none;
        padding-top: 2px;
        text-align: center;
        width: 100pc;
      
    }
    `);
