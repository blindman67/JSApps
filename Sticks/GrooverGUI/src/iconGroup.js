"use strict";
    const ICON_WIDTH = 24;
    /* Icon group also include boolean (single icon) */
    const iconGroup = (function(){
        const controlOptionsDefault = {
        }
        function createControl(name,options){
            return;
            var preColour;
            var iconWidth = ICON_WIDTH;
            var options = Object.assign({},controlOptionsDefault,options);
            function mouseOver (event) {control.mouseOver = true}
            function mouseOut (event) {control.mouseOver = false}
            function setHelp () {
                if (options.help && options.help !== elements.displayName.title) {elements.displayName.title = options.help}
            }

            function iconClicked(event){
                if(!event.exclusive){
                    var iconName = event.target.dataset.iconName;
                    dontUpdate = false;
                    changeIcon(iconName,!control.icons[iconName].on);
                    control.dialog.focus(); 
                }
            }
            function iconHover(event){
                if(!event.exclusive){
                    control.icons[event.target.dataset.iconName].mouseOver = true;
                    setIcons();
                    control.dialog.focus();
                }
            }        
            function iconHoverOut(event){
                if(!event.exclusive){
                    control.icons[event.target.dataset.iconName].mouseOver = false;
                    setIcons();
                }
            }
            function positionIcons(){
                if(icons.length === 1){
                    icons[0].style.right = 40 + (iconWidth-CONTROL_HEIGHT)+"px";
                }else{
                    var controlWidth = options.dialog.options.position.width - 90;
                    var containWidth = controlWidth / icons.length;
                    containWidth = containWidth > iconWidth ? iconWidth : containWidth;
                    icons.forEach((icon,i)=>{
                        icon.style.right = 40 + (iconWidth-CONTROL_HEIGHT) + (containWidth * ((icons.length-1) - i)) + "px";
                    })
                }
            }
            function setIcons(){
                Object.keys(control.icons).forEach(iconName=>{
                    var icon = control.icons[iconName];
                    if(icon.spriteSheet){
                        var ref;
                        if (icon.mouseOver) {ref = icon.on ? icon.images.onHover : icon.images.offHover}
                        else {ref = icon.on ? icon.images.on : icon.images.off}
                        if(ref !== icon.lastRef){
                            icon.lastRef = ref;
                            var details = ref.split(",");
                            GUI.image.updateSpriteSheetImage(details[1],details[2],elements["img_"+iconName])
                        }
                    }else{
                        if (icon.mouseOver) {elements["img_"+iconName].src = icon.on ? icon.images.onHover : icon.images.offHover}
                        else {elements["img_"+iconName].src = icon.on ? icon.images.on : icon.images.off}
                    }
                })
            }
            function update(dontCheckData,supressCallback){
                dontCallCallback = supressCallback;
                if(!dontCheckData){
                    if(options.data){
                        Object.keys(control.icons).forEach(iconName=>{
                            dontUpdate = true;
                            if(typeof options.data[options.property] === "boolean"){
                                changeIcon(iconName,options.data[options.property]);
                            }else{
                                changeIcon(iconName,options.data[options.property][iconName]);
                            }
                        });
                    }
                }
                positionIcons();
                if (control.dirty) {setIcons()}
                setHelp();
                control.dirty = false;
                dontCallCallback = false;
            }
            var dontUpdate = false;
            var dontCallCallback = false;
                
            function changeIcon(name,state){
                if(control.icons[name].on !== state){
                    control.icons[name].on = state;
                    if (options.data) {
                        if(typeof options.data[options.property] === "boolean"){
                            options.data[options.property] = state;                        
                        }else{
                            options.data[options.property][name] = state;
                        }
                    }
                    if(!dontCallCallback){
                        control.dirty = true;
                        if (control.onchanged) {control.onchanged(control, control.icons[name])}   
                        else if (control.dialog.onchanged) {control.dialog.onchanged(control, control.icons[name])}   
                    }                
                    if (!dontUpdate) {update()}
                    dontUpdate = false;
                }
                return control;
            }

            var uName = name + GUI.getUID();
            const elements = {
                container   :  $("$D ",uName,"control iconGroup"),
                displayName : $("$D " + (options.displayName ? options.displayName : options.name), uName+"Anontation", "anotation"),
            }
            var icons = [];
            var iconMaxWidth = 0;
            Object.keys(options.icons).forEach((icon,i)=>{
                if(options.icons[icon].images === undefined){
                    options.icons[icon].images = {
                        on : options.icons[icon].imageOn,
                        off : options.icons[icon].imageOff,
                    }
                } 
                if(options.icons[icon].images.on.indexOf("#SpriteSheet") === 0){
                    options.icons[icon].spriteSheet = true;
                    var details = options.icons[icon].images.on.split(",");
                    elements["img_"+icon] = GUI.image.getSpriteSheetImage(details[1],details[2]);
                    elements["img_"+icon].className = "iconImage";
                    elements["img_"+icon].title = options.icons[icon].help;
                    elements["img_"+icon].id = "img_"+uName+"_"+icon;
                    elements["img_"+icon].style.top = CONTROL_HEIGHT - elements["img_"+icon].height + "px";
                    iconMaxWidth = Math.max(elements["img_"+icon].width,iconMaxWidth);
                }else{
                    elements["img_"+icon] = $("img",{
                        src : options.icons[icon].on ? options.icons[icon].images.on : options.icons[icon].images.off,
                        className : "iconImage",
                        title : options.icons[icon].help,
                        id : "img_"+uName+"_"+icon,
                    })
                }
                elements["img_"+icon].dataset.iconName = icon;
                elements["img_"+icon].dataset.iconIndex = i;
                elements[icon] = 
                    $$($("$N",uName + "_"+icon+"_imgCont","iconContainer"),[
                        elements["img_"+icon] 
                    ]);
                GUI.events.bindEvent("click",elements["img_"+icon],iconClicked);  
                if(options.icons[icon].images.onHover || options.icons[icon].images.offHover ){
                    GUI.events.bindEvent("mouseover",elements["img_"+icon],iconHover);                
                    GUI.events.bindEvent("mouseout",elements["img_"+icon],iconHoverOut);           
                }
                icons.push(elements[icon]);
            })
            if(iconMaxWidth !== 0){
                iconWidth = iconMaxWidth;
            }
            $$(elements.container,[
                elements.displayName,
                ...icons,
            ]);
            if(icons.length === 1){
                elements.displayName.dataset.iconName = icons[0].childNodes[0].dataset.iconName;
                elements.container.dataset.iconName = elements.displayName.dataset.iconName;
                elements.displayName.dataset.iconIndex = 0;
                elements.container.dataset.iconIndex = 0;
                elements.displayName.style.cursor = "pointer"; 
                elements.container.style.cursor = "pointer";
                GUI.events.bindEvent("click",elements.displayName,iconClicked);              
                GUI.events.bindEvent("click",elements.container,iconClicked);              
            }


            function destroy(){
                Object.keys(control.icons).forEach(iconName=>{
                    var icon = control.icons[iconName];
                    GUI.events.unbindEvent("click",elements["img_"+iconName]);    
                    if(icon.images.onHover || icon.images.offHover ){
                        GUI.events.unbindEvent("mouseover",elements["img_"+iconName]);                
                        GUI.events.unbindEvent("mouseout",elements["img_"+iconName]);           
                    }                
                })
                if(icons.length === 1){
                    GUI.events.unbindEvent("click",elements.displayName);              
                    GUI.events.unbindEvent("click",elements.container);              
                }

                elements.container.innerHTML  = "";
                elements.displayName = undefined;
                icons.length = 0;
                
            }
            var control = {
                type : GUI.controlTypes.iconGroup,
                dialog : options.dialog,
                name ,
                uName,
                dirty : true,
                elements,
                update,
                setHelp,
                setValue(name,value){
                    if(value === undefined && control.icons[name] === undefined){                    
                        changeIcon(icons[0].childNodes[0].dataset.iconName,name == true); // meant to be == not ===
                    }else{                    
                        changeIcon(name,value == true);  // meant to be == not ===
                    }
                    return this;
                },
                setIcon : changeIcon,
                getIcon(name){
                    if (control.icons[name]) {return control.icons[name].on}
                    return;
                },
                onchanged : options.onchanged ? options.onchanged : null,
                destroy,
                icons : options.icons,
                options,
                height : CONTROL_HEIGHT + 1,
            }
            if (options.dialog !== undefined) {options.dialog.addControl(control)}        
            return control;
        }
        return {create : createControl}
    }())
/*    import {GUICSSInjector} from "http://localhost/MarksHome/GitHub/GrooverGUI/src/CSSInject.js";
    GUICSSInjector().add(`*/
//  CSSInjector.add(`
    /***********************************************************************************************************************
    * iconGroup                                                       
    ***********************************************************************************************************************/
/*    .iconGroup {
        top : 1px;
    }
    .iconContainer{
        float: right;
        color : white;
        position: absolute;    
        top : 0px;
        text-align : left;
        display: flex;
        -webkit-touch-callout: none;

        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;       
    }
    .iconImage {
        cursor : pointer;
        position: absolute; 
        left : ${ICON_WIDTH}px;
        top : -7px;
    }
    `);*/
//    return iconGroup;
//}

    /* Icon group also include boolean (single icon) */
    const bool = (function(){
        const controlOptionsDefault = {
        }
        function createControl(name,options){
            var preColour;
            var iconWidth = ICON_WIDTH;
            var mouseOverFlag = false;
            var options = Object.assign({},controlOptionsDefault,options);
            function mouseOver (event) {mouseOverFlag = true}
            function mouseOut (event) {mouseOverFlag = false}

            function iconClicked(event){
                if(!event.exclusive){
                    dontUpdate = false;
                    changeIcon(!control.checked);
                    control.dialog.focus(); 
                }
            }
            function iconHover(event){
                if(!event.exclusive){
                    mouseOverFlag = true;
                    setIcons();
                    control.dialog.focus();
                }
            }        
            function iconHoverOut(event){
                if(!event.exclusive){
                    mouseOverFlag = false;
                    setIcons();
                }
            }

            function setIcons(){

                if(options.spriteSheet){
                    if (mouseOverFlag && options.images.onHoverIndex && options.images.offHoverIndex) {
                        if (control.checked) { GUI.image.updateSpriteSheetImage(options.images.onHoverSpriteSheetName, options.images.onHoverIndex, elements.icon) }
                        else { GUI.image.updateSpriteSheetImage(options.images.offHoverSpriteSheetName, options.images.offHoverIndex, elements.icon) }
                    } else {
                        if(control.checked){ GUI.image.updateSpriteSheetImage(options.images.onSpriteSheetName, options.images.onIndex, elements.icon) }
                        else{ GUI.image.updateSpriteSheetImage(options.images.offSpriteSheetName, options.images.offIndex, elements.icon) }
                    }

                }else{
                    if (mouseOverFlag) {elements.icon.src = control.checked ? options.images.onHover : options.images.offHover}
                    else {elements.icon.src = control.checked ? options.images.on : options.images.off}
                }
            }
            function update(dontCheckData, supressCallback){
                dontCallCallback = supressCallback;
                if(!dontCheckData){
                    if(options.data !== undefined){
                        dontUpdate = true;
                        if(typeof options.data[options.property] === "boolean"){
                            changeIcon(options.data[options.property]);
                        }
                    }
                }
              
                if (control.dirty) {setIcons()}
                control.dirty = false;
                dontCallCallback = false;
            }
            var dontUpdate = false;
            var dontCallCallback = false;
                
            function changeIcon(state){
                if(control.checked !== state){
                    control.checked = state;
                    if (options.data !== undefined) {
                        if(typeof options.data[options.property] === "boolean"){
                            options.data[options.property] = state;                        
                        }
                    }
                    if(!dontCallCallback){
                        control.dirty = true;
                        if (control.onchanged) { control.onchanged(control)}   
                        else if (control.dialog.onchanged) { control.dialog.onchanged(control) }   
                    }                
                    if (!dontUpdate) { update() }
                    dontUpdate = false;
                }
                return control;
            }
            
            function setState(state){
               if(state.onIconIndex){ options.images.onIndex = state.onIconIndex }
               if(state.offIconIndex){ options.images.offIndex = state.offIconIndex }
               if(state.onHoverIconIndex){ options.images.onHoverIndex = state.onHoverIconIndex }
               if(state.offHoverIconIndex){ options.images.offHoverIndex = state.offHoverIconIndex }
               if(state.text) { elements.displayName.textContent = state.text }       
               if(state.help) {
                   elements.displayName.title = state.help;
                   elements.container.title = state.help;
                   elements.icon.title = state.help;
               }
               
                
            }

            var uName = name + GUI.getUID();
            const elements = {
                container   :  $("$D ",uName,"control iconGroup"),
                displayName : $("$D " + (options.displayName ? options.displayName : options.name), uName+"Annotation", "anotation"),
                icon : null,
            }

            
   
            if(options.images === undefined){
                options.images = {
                    on : options.imageOn,
                    off : options.imageOff,
                }
            } 
            if(options.images.on.indexOf("#SpriteSheet") === 0){
                options.spriteSheet = true;
                if(options.images.offHover){
                    var details = options.images.offHover.split(",");
                    options.images.offHoverIndex = details[2];
                    options.images.offHoverSpriteSheetName = details[1];
                    var details = options.images.onHover.split(",");
                    options.images.onHoverIndex = details[2];
                    options.images.onHoverSpriteSheetName = details[1];
                }
                
                var details = options.images.off.split(",");
                options.images.offIndex = details[2];
                options.images.offSpriteSheetName = details[1];
                
                var details = options.images.on.split(",");
                options.images.onIndex = details[2];
                options.images.onSpriteSheetName = details[1];
                
                elements.icon = GUI.image.getSpriteSheetImage(details[1],details[2]);
                elements.icon.className = "iconImage";
                elements.icon.id = "img_"+uName;
                elements.icon.style.top = CONTROL_HEIGHT - elements.icon.height + "px";
            }else{
                elements.icon = $("img",{
                    src : options.on ? options.images.on : options.images.off,
                    className : "iconImage",
                    id : "img_"+uName,
                })
            }

            elements.iconContainer = $$($("$N",uName + "_imgCont","iconContainer"),[elements.icon  ]);
            GUI.events.bindEvent("click",elements.icon,iconClicked);  
            if(options.images.onHover || options.images.offHover ){
                GUI.events.bindEvent("mouseover",elements.icon,iconHover);                
                GUI.events.bindEvent("mouseout",elements.icon,iconHoverOut);           
            }
            $$(elements.container,[ elements.displayName, elements.iconContainer, ]);
            elements.displayName.style.cursor = "pointer"; 
            elements.container.style.cursor = "pointer";
            GUI.events.bindEvent("click",elements.displayName,iconClicked);              
            GUI.events.bindEvent("click",elements.container,iconClicked);              
            setState({help : options.help});



            function destroy(){

                GUI.events.unbindEvent("click",elements.icon);    
                if(options.images.onHover || options.images.offHover ){
                    GUI.events.unbindEvent("mouseover",elements.icon);                
                    GUI.events.unbindEvent("mouseout",elements.icon);           
                }                
                GUI.events.unbindEvent("click",elements.displayName);              
                GUI.events.unbindEvent("click",elements.container);              
                elements.container.innerHTML  = "";
                elements.displayName = undefined;
                elements.icon = undefined;
                elements.iconContainer = undefined;
            }
            var control = {
                type : GUI.controlTypes.bool,
                dialog : options.dialog,
                name ,
                uName,
                dirty : true,
                elements,
                update,
                setValue(value){
                    changeIcon(value == true);  // meant to be == not ===
                    return this;
                },
                getvalue(){
                    return this.checked;
                },
                setState,
                checked : options.checked,
                onchanged : options.onchanged ? options.onchanged : null,
                destroy,
                options,
                height : CONTROL_HEIGHT + 1,
            }
            if (options.dialog !== undefined) {options.dialog.addControl(control)}        
            return control;
        }
        return {create : createControl}
    }())
    CSSInjector.add(`
    /***********************************************************************************************************************
    * bool                                                       
    ***********************************************************************************************************************/
    .bool {
        top : 1px;
    }
    .iconContainer{
        float: right;
        color : white;
        position: absolute;    
        top : 0px;
        right : 17px;
        text-align : left;
        display: flex;
        -webkit-touch-callout: none;

        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;       
    }
    .iconImage {
        cursor : pointer;
        position: absolute; 
       /* left : ${ICON_WIDTH}px;*/
        top : -7px;
    }
    `);
