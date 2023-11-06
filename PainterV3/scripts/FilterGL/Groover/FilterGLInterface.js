/* This file is not Part of FilterGL and is not required to use FilterGL */
/* For groover coders this file is used to test FilterGL using GrooverAnimates CompoundSprite interface */
/* This uses datBMGUI.js and is not compatible with datGUI.js*/

if(typeof filterGL !== "undefined"){
    setTimeout(function(){filterGL.lastID = ID.getGUID()},2000); // this is just to get out of first run execution context, gave it 2 seconds so it wont fire in the zillion other loading timers.
    filterGL.GrooverMiddleMan = function(source,  filterName, args){
        if(source.image && !source.image.ctx){
            groover.tester.cSprites[0].systemReporter.warn("FilterGL can not process Image 'Not drawable.'");
            return;
        }
        var dImage = source.image;
        if(!filterGL.isSourceTextureSet()){
            filterGL.setSource(source.texture)[filterName](...args).show();   
        }else{
            filterGL[filterName](...args).show();   
        }
        dImage.ctx.globalAlpha = 1;
        dImage.ctx.globalCompositeOperation = "source-over";
        dImage.ctx.clearRect(0,0,dImage.ctx.canvas.width,dImage.ctx.canvas.height);
        dImage.ctx.drawImage(filterGL.canvas,0,0);
        dImage.fromFile = false;
        dImage.processed = true;
        dImage.depreciated = true;
        dImage.dirty = true;
        dImage.modifiedBy = "FilterGL";
        dImage.modifiedID = filterGL.lastID;
        filterGL.lastID += 1;       
        
        
    }
    
    
    filterGL.getAvalibleFilterList = function(keyWord = "FilterGL" ,fontSize = 16){
        var str = keyWord + " ?Use webGL to filter";   
        var maxTextSize = Math.ceil((innerWidth / fontSize) * 0.4);
        maxTextSize = maxTextSize < 20 ? 20 : maxTextSize; 
        filterGL.filters.availableFilters().forEach(name => {
            var filter = filterGL.filters.getFilter(name);
            str += "|" + name;
            if(filter.description){  
                var help;
            
                if(typeof filter.description === "string"){
                    help = filter.description;                       
                }else if(filter.description.text){
                    help = filter.description.text;
                }
                if(help){
                    if(help.length > 1024){
                        help = help.substr(0,1024).trim() + "...";
                    }
                    var helpWords = help.split(" ");
                    var help = "";
                    var space = "";
                    var len = 0;
                    var lines = [];
                    var wordBucket = [];
                    helpWords.forEach(word=>{
                        var endsWith = word[word.length-1];
                        var endWord = ".,?\n".indexOf(endsWith) === -1;
                        var newLine = "";
                        if(help.length + word.length > maxTextSize || (help.length + word.length > maxTextSize * (3/4) && endWord)){
                            if(endsWith === "\n"){
                                word = word.substr(0,word.length - 1);
                            }
                            newLine = "~";
                            help += space + word + newLine;
                            lines.push(help);
                            help = "";
                            space = "";
                        }else{
                            help += space + word;
                            space = " ";
                        }
                    });
                    
                    if(help !== ""){
                        lines.push(help);
                    }
                    str += "?" + lines.join("").replace(/\,|\||\!|\%|\!|\//g,"");
                }
                
            }
        });
        return str + ",";
        
    }
    function getFilterGLFilterInfo(name){  // this function needs clean up
        var filterInfo = {
            extraInfo : {
                canHaveSource : false,
                help : "No help found."
            },
            propertyInformation : {},
        };
        var filt = filterGL.filters.getFilter(name);
        if(filt === undefined){
            console.warn("Cant find filter "+name);
        }
        var desc
        if(typeof filt.description === "string"){
            desc = filt.description;
        }else if(typeof filt.description === "object"){
            desc = filt.description.text;
        }else{
            desc = "No help found";
        }
        filterInfo.extraInfo.help = desc;
        if(filt.arguments){
            filt.arguments.forEach(item => {
                if(item.type === "Number"){
                    var str = "##";
                    str += item.logarithimc ? "L" : "";
                    if(item.range === undefined ||  isNaN(item.range.def) ||
                    item.range.def == undefined ||  isNaN(item.range.min) ||
                    item.range.min === undefined ||  isNaN(item.range.max) ||
                    item.range.max === undefined ||  isNaN(item.range.step) ||
                    item.range.step === undefined){
                        throw new ReferenceError("Filter `" + name + "` argument '"+item.name+"'  missing range property or range object is mallformed.");
                    }
                    str += item.range.def;
                    str += " " + item.range.min;
                    str += " " + item.range.max; 
                    str += " " + item.range.step
                    str += " " + (item.range.wStep ? item.range.wStep : item.range.step);
                    filterInfo[item.name] = str;
                    filterInfo.propertyInformation[item.name] = {help : item.description};
                }else if(item.type === "Boolean"){
                    if(item.range && typeof item.range.def === "boolean"){
                        filterInfo[item.name] = item.range.def;
                    }else{
                        filterInfo[item.name] = true;
                    }
                    filterInfo.propertyInformation[item.name] = {help : item.description};
                }else if(item.type === "String"){
                    filterInfo[item.name] = item.range;
                    filterInfo.propertyInformation[item.name] = {help : item.description};
                }else if(item.type === "HexColor"){
                    var col;
                    
                    if(item.range && typeof item.range.def === "string"){
                        //col= filterInfo[item.name] = item.range.def;
                        col= item.range.def;
                    }else{
                        col = "#FFFFFF";
                       // col= filterInfo[item.name] = "#FFFFFF";
                    }
                    filterInfo[item.name+"_red"] = "##C"+parseInt(col.substr(1,2),16)+" 0 255 1 8";
                    filterInfo[item.name+"_green"] = "##C"+parseInt(col.substr(3,2),16)+" 0 255 1 8";
                    filterInfo[item.name+"_blue"] = "##C"+parseInt(col.substr(4,2),16)+" 0 255 1 8";
                    filterInfo[item.name+"_alpha"] = "##C"+255+" 0 255 1 8";
                    filterInfo.propertyInformation[item.name+"_red"] = {help : item.description};
                    filterInfo.propertyInformation[item.name+"_green"] = {help : item.description};
                    filterInfo.propertyInformation[item.name+"_blue"] = {help : item.description};
                    filterInfo.propertyInformation[item.name+"_alpha"] = {help : item.description};
                }else if(item.type === "Image"){
                    filterInfo[item.name] = "GetImage"
                    filterInfo.propertyInformation[item.name] = {help : item.description};
                }else if(item.type === "Vec2"){
                    filterInfo[item.name] = "Point";
                    filterInfo.propertyInformation[item.name] = {help : item.description};
                }
            });
        }
        return filterInfo;
    }

    CompoundSprite.prototype.filterGL_UI = function(data){
        if(this.filterGL_Instance === undefined){
            (function(me){
                var temp = filterGL.GrooverMiddleMan;
                var id = filterGL.lastID;
                filterGL = me.filterGL_Instance = filterGL.create();
                filterGL.usedFilters = {};
                filterGL.GrooverMiddleMan = temp;
                filterGL.lastID = id;
            }(this));
        }
        if(!this.owner.ui.isUIFree("filters") && this.filterSelectType !== "repeat"){
            this.systemReporter.warn("Only one FilterGL instance at a time.")
            return;
        }        
        function stopPreview(){clearTimeout(debouncePreviewHandle)}
        function getSelectedSprite(){
            if(!comSprObj.selectionSpriteOn && comSprObj.selectedSprite !== -1){
                return  comSprObj.sprites[comSprObj.selectedSprite];        
            }
        }
        function getDestSprite() {return comSprObj.filterDest}
        function removeSourceSprite(name,destroy){
            if(options.extraInfo.sources[name] !== undefined){
                if(destroy && options.extraInfo.sources[name].texture){
                    options.extraInfo.sources[name].texture.destroy();
                    options.extraInfo.sources[name].texture = undefined;
                    if(name === "destSprite"){
                        filterGL.clearSource();
                    }                    
                }
                if(options.extraInfo.sources[name].onChangeUID){
                    this.removeCallback(options.extraInfo.sources[name].sprite,options.extraInfo.sources[name].onChangeUID);
                    options.extraInfo.sources[name].onChangeUID = undefined;
                }
                options.extraInfo.sources[name].sprite = null;
                options.extraInfo.sources[name].image = undefined;
            }
        }
        function setSourceSprite(name, sprite, makeDrawable){
            var sources = options.extraInfo.sources;
            stopPreview();
            if(typeof sprite === "number"){
                if (sprite < comSprObj.sprites.length && sprite >= 0) {sprite = comSprObj.sprites[sprite]}
                else {sprite = null}
            } 
            if(sprite === null){
                removeSourceSprite(name,true);
                if (sources[name] === undefined) {sources[name] = {}}
                sources[name].sprite    = null;
                sources[name].index     = null;
                sources[name].texture   = undefined;
                sources[name].image     = undefined;
            }else if(sources[name] === undefined || sprite.ID + sprite.pKey.sprite !== sources[name].index){
                if (makeDrawable) {bitmaps.makeDrawable(sprite.ID + sprite.pKey.sprite)}
                removeSourceSprite(name,false);
                if (sources[name] === undefined) {sources[name] = {}}                
                sources[name].sprite    = sprite;
                sources[name].index     = sprite.ID + sprite.pKey.sprite;
                sources[name].image     = imageList[sprite.ID + sprite.pKey.sprite];
                sources[name].texture   = filterGL.createTexture(imageList[sprite.ID + sprite.pKey.sprite])
                

                /*if (sources[name].texture.isGLTexture) {
                    sources[name].texture.fromCanvas(sources[name].image)
                 }else {
                     sources[name].texture = filterGL.createTexture(imageList[sprite.ID + sprite.pKey.sprite])
                     console.log("Making textyr " + (sources[name].texture?"true":"false"))
                   }*/
                if (name === "destSprite") {sources.onChangeUID = comSprObj.addCallback(sprite,"onchange",onchange)}
            }
        }     
        function getSourceSprite(name){
            var sprite = getSelectedSprite();
            if (sprite === undefined) {return false}
            setSourceSprite(name,sprite);
            onchange();     
            return true            
        }
        function setupFilterDestination(sprite){
            if (sprite === undefined) {sprite = getSelectedSprite()}
            if (sprite === undefined) {sprite = getDestSprite()}
            if (sprite === undefined) {
                reporter.warn("Unable to set the filter destination");
                if (options.extraInfo.sources.destSprite.texture === undefined) {setupIncomplete = true}
                return;
            }
            restorePixels();
            setSourceSprite("destSprite",sprite,true);
            filterGL.setSource(options.extraInfo.sources.destSprite.texture);
            onchange();
        }
        function applyFilter(forExit){
            stopPreview();   
            preview();
            filterGL.completed();
            bitmaps.imageUpdate = true;
            if (options.extraInfo.sources.destSprite.sprite.hasImageInfo > -1) { 
                clearTimeout(imageInfoDebounceTimer);
                if (forExit) {comSprObj.renderImageInfo(options.extraInfo.sources.destSprite.sprite.index)}                        
                else {imageInfoDebounceTimer = setTimeout(()=>comSprObj.renderImageInfo(options.extraInfo.sources.destSprite.sprite.index),500)}
            }
            if (forExit) {saveFilterOptions()}       
        }
        function getArguments(noUi){
            var i = 0;
            var args = [];
            Object.keys(options).forEach(name => {
                if(name !== "extraInfo" && name !== "args" && name !== "propertyInformation"){
                    if(options.extraInfo.sources[name] !== undefined){
                        args.push(options.extraInfo.sources[name].texture);
                    }else{
                        if(name === "point"){
                            if(noUi){
                                args.push(options.args[i++]);
                            }else{
                                var spr = options.extraInfo.sources.destSprite.sprite;
                                args.push([spr.pKey.cx/spr.w,spr.pKey.cy/spr.h]);
                            } 
                            
                        }else if(name.has("_red") ||name.has("_green") ||name.has("_blue") ||name.has("_alpha")){
                            if(name.has("_red") ){
                                if(noUi){
                                    args.push(options.args[i++]);
                                }else{
                                    var n = name.replace("_red","");
                                    args.push([menu[n+"_red"],menu[n+"_green"],menu[n+"_blue"],menu[n+"_alpha"]]);
                                }
                            }
                            
                        }else{
                            args.push(noUi ? options.args[i++] : menu[name]);
                        }
                    }
                }
            }); 
            args.forEach((arg,i) => options.args[i] = arg);   
            return args;
        }        
        function getSourceButtonClickFunction(name){
            return function(data){
                var control = datGUIControl.namedControls[name];
                if(getSourceSprite(name)){
                    return {text : "Attached", help : "Right click to select the attached sprite.To remove the\nattached sprite left click with no sprites selected."};
                }else{
                    //reporter.warn("Source cleared");
                    setSourceSprite(name,null);
                    return {text : "Select Source", help : "This source is not attached to any image or sprite\nLeft click to attach the currently selected sprite."};
                }
                onchange();
            }
        }
        function setMenuArguments(fromPreset){
            var i = 0;
            if(!fromPreset && menu.propertyInformation === undefined){
                menu.propertyInformation = {};
            }
            Object.keys(options).forEach(name => {
                if(name !== "extraInfo" && name !== "args" && name !== "propertyInformation"){
                    if(fromPreset){
                        if(typeof menu[name] !== "function"){
                            if(name === "point"){
                                var spr = options.extraInfo.sources.destSprite.sprite;
                                menu[name] = "["+(spr.pKey.cx/spr.w).toFixed(3) + ", " + (spr.pKey.cy/spr.h).toFixed(3)+"]";
                                i++;
                            }else if(name.has("_red") ||name.has("_green") ||name.has("_blue") ||name.has("_alpha")){
                                if(name.has("_red")){
                                    var n = name.replace("_red","");
                                    menu[n+"_red"] = options.args[i][0];
                                    menu[n+"_green"] = options.args[i][1];
                                    menu[n+"_blue"] = options.args[i][2];
                                    menu[n+"_alpha"] = options.args[i][3];
                                    i ++;
                                }
                            }else{
                                menu[name] = options.args[i++];
                            }
                        }                        
                    }else{
                        if(options[name] === "GetImage"){
                            setSourceSprite(name, data.bmSrcId, true);
                            menu[name] = getSourceButtonClickFunction(name);
                            menu.propertyInformation[name] = options.propertyInformation[name];
                        }else if(name.has("_red") ||name.has("_green") ||name.has("_blue") ||name.has("_alpha")){
                            if(name.has("_red")){
                                var n = name.replace("_red","");
                                menu[n+"_red"] =   options[n+"_red"];
                                menu[n+"_green"] = options[n+"_green"];
                                menu[n+"_blue"] =  options[n+"_blue"];
                                menu[n+"_alpha"] = options[n+"_alpha"]; 
                                menu.propertyInformation[n+"_red"] = options.propertyInformation[n+"_red"];
                                menu.propertyInformation[n+"_green"] = options.propertyInformation[n+"_green"];
                                menu.propertyInformation[n+"_blue"] = options.propertyInformation[n+"_blue"];
                                menu.propertyInformation[n+"_alpha"] = options.propertyInformation[n+"_alpha"];
                            }
                        }else{
                            menu[name] = options[name];
                            menu.propertyInformation[name] = options.propertyInformation[name];
                        }
                    }
                }
            });
            i = 0;
        }       
        function onchange(){
            if (!settingUp) {
                if (menu.point){
                    if(options && options.extraInfo && options.extraInfo.sources && options.extraInfo.sources.destSprite && options.extraInfo.sources.destSprite.sprite){
                        var spr = options.extraInfo.sources.destSprite.sprite;
                        menu.point = "["+(spr.pKey.cx/spr.w).toFixed(3) + ", " + (spr.pKey.cy/spr.h).toFixed(3)+"]";
                    }
                    datGUIControl.updateDisplay();  
                }
            }
            if (livePreview) {
                
                if (asyncPreview) {
                    stopPreview();
                    if(performance.now()-lastPreviewTime > MAX_PREVIEW_DELAY){  // force preview if t0o long between updates
                        preview();
                    }else{
                        debouncePreviewHandle = setTimeout(preview,32);
                    }
                } else {preview()}
            }
        }
        function restorePixels(){ 
            if(canRestore){
                dImage = imageList[options.extraInfo.sources.destSprite.index];
                dImage.ctx.clearRect(0,0,dImage.ctx.canvas.width,dImage.ctx.canvas.height);
                filterGL.getSource(dImage.ctx);
                canRestore = false;
                return true;
            }
            return false;
        }
        var preview = (function(){
            stopPreview();
            if(options.extraInfo.sources.destSprite.texture === undefined){
                reporter.warn("There is no image to render too!");
                return;
            }
            var now = performance.now();
            filterGL.GrooverMiddleMan(options.extraInfo.sources.destSprite, data.filterName, getArguments()); 
            var time = performance.now() - now;
            lastPreviewTime = now + time;
            asyncPreview = time > 1000 / 60;
            lastRenderTime = time;            
            canRestore = true;                 
            addInfoLine("Render time : " + lastRenderTime.toFixed(0) + "ms Mode : " + (asyncPreview ? "deferred" : "immediate")); 
        }).bind(this);  
        function cleanupSources(){
            Object.keys(options.extraInfo.sources).forEach(name=>{
                removeSourceSprite(name,true);
                options.extraInfo.sources[name] = undefined;
            });
        }
        function cleanForExit(){
            livePreview = false;
            stopPreview();
            cleanupSources();
            filterGL.clearSource();
            uiInfoLines.length = 0;
            comSprObj.owner.ui.removeUI("filters");
        }
        function updateUIInfo(){
            if(uiInfoLines !== undefined && uiInfoLines.length > 0){
                uiInfoLines[0].textContent = uiInfo.pop();
                uiInfo.length = 0;
            }
        }
        function addInfoLine(info){
            uiInfo.push(info);
            updateUIInfo();
        }               
        function getPreviouseFilterArgs(filterOptionString){
            var fos = "_"+mMath.hashString(data.filterType) + mMath.hashString(data.filterType + " " + filterOptionString);
            if (filterGL.usedFilters[fos]) {return filterGL.usedFilters[fos].args}
        }
        function saveFilterOptions(){
            var argString = data.filterType + " " + data.filterName + " " + argumentsToString(options.args) + "";
            var fos = "_"+mMath.hashString(data.filterType) + mMath.hashString(argString);
            filterGL.usedFilters[fos] = {args : argumentsForSave(options.args)};
            var pos = comSprObj.lastFilterAction.indexOf(argString);
            if (pos !== -1) {comSprObj.lastFilterAction.splice(pos, 1)}
            comSprObj.lastFilterAction.push(argString);            
        }
        function argumentsForSave(args){
            var rArgs = [];
            var i = 0;
            Object.keys(options).forEach(name => {
                if(name !== "extraInfo" && name !== "args" && name !== "propertyInformation"){
                    if (options.extraInfo.sources[name] === undefined) {rArgs.push(args[i++])}
                    else {i++}
                }
            }); 
            return rArgs;
        }
        function argumentsToString(args){
            var str = "";
            var c = "";
            var i = 0;
            Object.keys(options).forEach(name => {
                if(name !== "extraInfo" && name !== "args" && name !== "propertyInformation"){
                    var arg = args[i++];
                    if(options.extraInfo.sources[name] === undefined){
                        if(name === "point"){
                            str += c + "["+arg[0].toFixed(3)+","+arg[1].toFixed(3)+"]";
                        }else if(name.has("_red") ||name.has("_green") ||name.has("_blue") ||name.has("_alpha")){
                            if(name.has("_red")){
                                str += c + "[#"+((arg[0]<16?"0":"")+arg[0].toString(16)) +
                                                ((arg[1]<16?"0":"")+arg[1].toString(16)) +
                                                ((arg[2]<16?"0":"")+arg[2].toString(16)) +
                                                "," + (arg[3]/255).toFixed(2) + "]";
                            }else{
                                i--;
                            }
                        } else if(typeof arg === "number"){
                            var s = "" + arg;
                            var s1 = arg.toFixed(2);
                            str += c + (s.length < s1.length ? s : s1);
                        } else if(Array.isArray(arg)){
                            str += c + "["+arg+"]";
                        }else{ str += c + arg}
                        c = ",";
                    }
                }
            });
            return str;
        }
        function setupOptions(){
            options= getFilterGLFilterInfo(data.filterName);
            var args = getPreviouseFilterArgs(data.optionString);
            if (args !== undefined) {options.args = [...args]}
            if (options.args === undefined) {options.args = []}
            if (options.extraInfo === undefined) {options.extraInfo = {sources : {}}}
            else {options.extraInfo.sources = {}}
            setupFilterDestination(data.sprite);
            if (data.bmDestId === data.bmSrcId) {data.bmSrcId = null}    
            if (data.bmSrcId !== null && comSprObj.filterSource) {data.bmSrcId = comSprObj.filterSource}
        }
        function setOtherSources(){
            var i = 0;
            Object.keys(options).forEach(name => {
                if (name !== "extraInfo" && name !== "args" && name !== "propertyInformation"){
                    if (options[name] === "GetImage") {
                        if (i === 0) {setSourceSprite(name, data.bmSrcId, true)}
                        else {setSourceSprite(name, null)}
                    }
                }
            });            
        }
        function applyWithoutUI(cleanUp){
            if(options.argsNoClose === undefined){
                options.argsNoClose = getArguments(true);
            }
            filterGL.GrooverMiddleMan(options.extraInfo.sources.destSprite, data.filterName, options.argsNoClose)
            filterGL.completed();
            if(cleanUp){
                if (options.extraInfo.sources.destSprite.sprite.hasImageInfo > -1) { 
                    comSprObj.renderImageInfo(options.extraInfo.sources.destSprite.sprite.index);
                }
                cleanupSources();
                filterGL.clearSource();
            }
            bitmaps.imageUpdate = true;
        }
        function applyForRepeats(){
            if(comSprObj.lastFilterGLSettings === undefined){
                setupOptions();                
                setOtherSources();
            }else{
                options = comSprObj.lastFilterGLSettings;
            }
            applyWithoutUI(false);
            comSprObj.lastFilterGLSettings = options;
        }            
            
                       
        var setupIncomplete = true;     
        var lastRenderTime = 0;
        var asyncPreview = false;
        var comSprObj = this;
        var livePreview = false;    
        var options;
        var debouncePreviewHandle;
        var imageInfoDebounceTimer
        var highlighter = [];
        var settingUp = true;
        var canRestore = false;
        var reporter = this.systemReporter;
        var bitmaps = this.owner.bitmaps;
        var imageList = bitmaps.imageList;
        var uiInfoLines = [];
        var uiInfo =[];
        var options;
        var lastPreviewTime = 0;
        const MAX_PREVIEW_DELAY = 250; //ms

        
        if(this.filterSelectType === "repeat keep open"){
            applyForRepeats();
            return;
        }
        if(this.lastFilterGLSettings){
            options = this.lastFilterGLSettings;
            this.lastFilterGLSettings = undefined;
            cleanupSources();
            filterGL.clearSource();
            options = undefined;
        }
        setupOptions();
        if(this.filterSelectType === "repeat"){
            setOtherSources();
            applyWithoutUI(true);
            return;
        }
        


        
        var menu = {};
        menu.datGUI_spacer7 = "Large " + data.filterType + " : " + data.filterName;
        menu.datGUI_spacer7A1 = "Big Info space";
        menu.datGUI_spacer7B1 = "Big Info space";
        menu.datGUI_spacer2 = "Small";
        setMenuArguments(false);
        menu.datGUI_spacer8 = "Small";       
        menu.OK = (function(){
            livePreview = false;
            applyFilter(true);
            cleanForExit();
        }).bind(this);       
        menu.apply = (function(){
            applyFilter();
            onchange();
        }).bind(this);        
        menu.datGUI_spacer9a = "Small";
        menu.setDestination = (function(){
            stopPreview();
            restorePixels();

            setupFilterDestination();
            onchange();
        }).bind(this);
        menu.datGUI_spacer9 = "Small";
        menu.snapshot = (function(){
            bitmaps.loadImages();
            bitmaps.copyBitmap(data.bmDestId);
            bitmaps.stopLoading();
        }).bind(this);               
        menu.livePreview = (function(){
            livePreview = ! livePreview;
            var highlight = "none";
            if(livePreview){
                onchange();
                highlight = highlighter;
                highlighter[0] = "#339947";
                highlighter[1] = "#151";
            }else{
                stopPreview();            
                dImage = imageList[data.bmDestId];
                restorePixels();
            }
            var text = "Live Preview "+ (livePreview ? "on." : "off.");
            return {text,highlight};
        }).bind(this);        
        menu.updateOnDraw = (function(callData){
            if(callData === "show state"){
                if(imageList[data.bmDestId].updateFilterOnDraw){
                    return {text : "On draw active!",highlight : ["#334799","#115"]};
                }
                return {text : "On draw off!",highlight : "none"};
            }
            if(imageList[data.bmDestId].updateFilterOnDraw){
                reporter.warn("Update on draw turned off for this sprite.");
                imageList[data.bmDestId].updateFilterOnDraw = undefined;
                return {text : "On draw off!",highlight : "none"};
            }
            imageList[data.bmDestId].updateFilterOnDraw = true;
            reporter.warn("This sprites image will apply filter on draw.");
            return {text : "On draw active!",highlight : ["#334799","#115"]};
        }).bind(this);    
        
        menu.datGUI_spacer10 = "Small";   
        menu.saveStateExit = (function(callData){
            saveFilterOptions();
            restorePixels();
            cleanForExit();
            //reporter.warn("Filter aborted");
        }).bind(this);        
        menu.exit = (function(callData){
            restorePixels();
            cleanForExit();
            //reporter.warn("Filter aborted");
        }).bind(this);        

        var datGUIControl = this.owner.ui.addUI("filters",menu,onchange);
        if (options.args.length > 0) {setMenuArguments(true)}
        datGUIControl.namedControls.livePreview.fire(); // turn on live
        datGUIControl.namedControls.updateOnDraw.fire("show state");
        settingUp = false;

        datGUIControl.updateDisplay();        
        uiInfoLines.push(...[datGUIControl.__ul.children[1],datGUIControl.__ul.children[2]]);
        addInfoLine("Setup complete");
    
 
    }
    
    
    
}else{
    window["filterGL"].getAvalibleFilterList = function(){
        return "FilterGL not installed?See Groover docs about how to install additional features.,"
    }
}
    