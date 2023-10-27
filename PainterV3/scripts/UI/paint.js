"use strict";
const paint = (()=>{
    var view;
    var lastDrawType;
    var stateObj;
    //var preKeyboardMode = "default";
    const userDefinedBrush = {
        fold : null,
        item : null,
    };
    //palletFrom = commands.paintColImage || paintColPallet , recycleColor = bool,recycleDestination  = bool
    var palletFromSelectStates = [];
    palletFromSelectStates.current = 0;
    palletFromSelectStates.findMatch = () => {
        var i =0;
        for(const state of palletFromSelectStates) {
            if(API.palletFrom === state.palletFrom &&
                API.recycleColor === state.recycleColor &&
                API.recycleDestination === state.recycleDestination){
                    return palletFromSelectStates.current = i;
                }
            i++;
        }
        return palletFromSelectStates.current = 0;
    }
    const brushOptionsA = { names : null, info : null,commandId : null };
    const brushOptionsB = { names : null, info : null,commandId : null  };
    const brushOptionsC = { names : null, info : null,commandId : null  };
    const brushOptionsD = { names : null, info : null,commandId : null  };
    const colorModes = { names : null, info : null};

    var specialBrushInfoNames;
    var paintStates = [undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,];
    const buttonMap = new Map();
    const drawTypeNames = new Map();
    const noPainting = [];
    const checkBoxCommands = [];
    const sliderStateCommands = new Map();
    const addSliderStateCommand = (commandId, name, pastThrough = false) => {  //pastThrough if true means command will set state but still be passed to the                                                                        // API.command function so related states can be changed if needed
        sliderStateCommands.set(commandId, {commandId, name, pastThrough});
    }
    const booleanStateCommands = new Map();
    const addBooleanStateCommand = (commandId, name, radio ,pastThrough = false) => {  //radio if true will use the button group too set visual state. pastThrough if true means command will set state but still be passed to the                                                                        // API.command function so related states can be changed if needed
        if(radio) {
            const group = buttonMap.get(commandId).group;
            booleanStateCommands.set(commandId, {commandId, name, radio, group, pastThrough});
        }else{
            booleanStateCommands.set(commandId, {commandId, name, radio, pastThrough});
        }
    }
    const sliderCommands = [];
    const curveCommands = [];
    var curveTypeCommands,curveMixHelp;
    const buttonGradientModeIconIndex = [8,4,5,6,7, 400 - 182 + 30, 400 - 182 + 31];
    const buttonLineGradientModeIconIndex = [25, 25, 400 - 182 + 30, 400 - 182 + 31];
    function createLists(){
        brushPresets.addPointTypes();
        palletFromSelectStates.push(
            { palletFrom : commands.paintColPallet, sprite : 0, recycleColor : false, recycleDestination : false},
            { palletFrom : commands.paintColImage,  sprite : 1, recycleColor : false, recycleDestination : false},
            { palletFrom : commands.paintColImage,  sprite : 2, recycleColor : true,  recycleDestination : false},
            { palletFrom : commands.paintColImage,  sprite : 3, recycleColor : true,  recycleDestination : true }
        );
        drawTypeNames.set(commands.paintLine, {name : "Line"});
        drawTypeNames.set(commands.paintCircle, {name : "Circle"});
        drawTypeNames.set(commands.paintRectangle, {name : "Rectangle"});
        drawTypeNames.set(commands.paintFloodFill, {name : "FloodFill"});
        drawTypeNames.set(commands.paintCurve, {name : "SmoothLines"});
        drawTypeNames.set(commands.paintSpray, {name : "Spray"});
        drawTypeNames.set(commands.paintPoints, {name : "Points"});
        drawTypeNames.set(commands.paintBrissleB,  {name : "SpecialFXBrushB"});
        drawTypeNames.set(commands.paintCutter,  {name : "CutPaste"});
        drawTypeNames.set(commands.paintMagicCutter,  {name : "MagicSelect"});
        drawTypeNames.set(commands.paintSBM_1,  {name : "FXB_Light"});
        drawTypeNames.set(commands.paintSBM_2,  {name : "FXB_Heavy"});
        drawTypeNames.set(commands.paintSBM_3,  {name : "FXB_Stickey"});
        drawTypeNames.set(commands.paintSBM_8,  {name : "FXB_Sketcher"});
        drawTypeNames.set(commands.paintSBM_9,  {name : "FXB_SketcherRand"});
        drawTypeNames.set(commands.paintSBM_13,  {name : "FXB_StringyBrush"});
		for(let i = 1; i < commands.paintSBM_199 - commands.paintSBM_13; i++) {
			const comName = "paintSBM_" + i;
			if (!drawTypeNames.has(comName)) {
				if (brushPresets["FXB_"+ i] !== undefined) {
					drawTypeNames.set(commands[comName],  {name : "FXB_" + i});
				} else {
                    //break;
                }
			}
		}

        noPainting.push(...[
            commands.paintLine,
            commands.paintCircle,
            commands.paintRectangle,
            commands.paintCurve,
            commands.paintSpray,
            commands.paintPoints,
            commands.paintFloodFill,
            commands.paintBrissleB,
            commands.paintColPallet,
            commands.paintBrushMin,
            commands.paintBrushMax,
            commands.paintBrushOptionsA,
            commands.paintBrushOptionsB,
            commands.paintBrushOptionsC,
            commands.paintBrushOptionsD,
            commands.paintCurvePowA,
            commands.paintPalletPickupPower,
            commands.paintPalletPickupRadius,
            commands.paintCurveStep,
            commands.paintBrushStep,
            commands.paintLengthFade,
            commands.paintWidthFade,
            commands.paintRandColor,
            commands.paintColorBlend,
            commands.paintBrushSizeBlend,
            commands.paintAntiAlias,
            commands.paintCurveDisplayA,
            commands.paintCurveLineA,
            commands.paintCurveEaseA,
            commands.paintCurveEase2A,
            commands.paintCurveSigmoid,
            commands.paintCurveBellA,
            commands.paintCurveRandomA,
            commands.paintCurveRandRampA,
            commands.paintCurveWaveA,
            commands.paintUseGridGuides,
            commands.paintUseSnapGridGuides,
            commands.paintUseGuidesXY,
            commands.paintUseGuidesXZ,
            commands.paintUseGuidesYZ,
            commands.paintUseDirection,
            commands.paintFilterA,
            commands.paintFilterB,
        ]);
        curveCommands.push(...[
            commands.paintCurveSetBrushColor,
            commands.paintCurveSetBrushAlpha,
            commands.paintCurveSetLineColor,
            commands.paintCurveSetLineWidth,
            commands.paintCurveSetLineAlpha,
            commands.paintCurveSetSprayColor,
            commands.paintCurveSetSpraySize,
            commands.paintCurveSetSpraySpread,
            commands.paintCurveSetSprayAlpha,
        ]);
        curveTypeCommands = {
            flat : commands.paintCurveLineA,
            ease : commands.paintCurveEaseA,
            ease2 : commands.paintCurveEase2A,
            sigmoid : commands.paintCurveSigmoid,
            random : commands.paintCurveRandomA,
            easeBell : commands.paintCurveBellA,
            randRamp : commands.paintCurveRandRampA,
            wave : commands.paintCurveWaveA,
        };
        curveMixHelp = {
            none : "Click to use second mixin curve\nNOTE! brushes with heavy curve use may slow\nPainterV3 Pro. Settings 'JIT curves' improves performance",
            mult : "Curve = A(in) * B(in)",
            add : "Curve = (A(in) + B(in)) / 2",
            sub : "Curve = ((A(in) - B(in)) + 1) / 2",
            addClamp : "Curve = A(in) + B(in)",
            subClamp : "Curve = A(in) - B(in)",
            pow : "Curve = A(in) ^ B(in)",
            pow : "Curve = A(in) ^ ((B(in) + 1) ^ 2)",
            pipe : "Curve = A(B(in))",
            max : "Curve = Max(A(in), B(in))",
            min : "Curve = Min(A(in), B(in))",
        };
        checkBoxCommands.push(...[
            commands.paintClear,
            commands.paintColPallet,
            commands.paintAntiAlias,
            commands.paintPointMode,
            commands.paintColorBlend,
            commands.paintBrushSizeBlend,
            commands.paintFadeAlphaDist,
            commands.paintSizeDist,
            commands.paintRandColor,
            commands.paintUseDirection,
            commands.paintUseSpeed,
            commands.paintFilterA,
            commands.paintFilterB,
        ]);
        checkBoxCommands.push(...curveCommands);
        checkBoxCommands.push(...[
            commands.paintBrushOptionsA,
            commands.paintBrushOptionsB,
            commands.paintBrushOptionsC,
            commands.paintBrushOptionsD,
        ]);
        brushOptionsA.commandId = commands.paintBrushOptionsA;
        brushOptionsB.commandId = commands.paintBrushOptionsB;
        brushOptionsC.commandId = commands.paintBrushOptionsC;
        brushOptionsD.commandId = commands.paintBrushOptionsD;
        sliderCommands.push(...[
            commands.paintBrushMin,
            commands.paintBrushMax,
            commands.paintCurveStep,
            commands.paintBrushStep,
            commands.paintLengthFade,
            commands.paintWidthFade,
            commands.paintPalletPickupPower,
            commands.paintPalletPickupRadius,
        ]);
        addSliderStateCommand(commands.paintBrushMin,"brushMin");
        addSliderStateCommand(commands.paintBrushMax,"brushMax");
        addSliderStateCommand(commands.paintCurveStep,"curveStep");
        addSliderStateCommand(commands.paintBrushStep,"brushStep");
        addSliderStateCommand(commands.paintLengthFade,"lengthFade");
        addSliderStateCommand(commands.paintWidthFade,"widthFade");
        addSliderStateCommand(commands.paintCurvePowA,"activeCurvePower",true);
        addSliderStateCommand(commands.paintPalletPickupPower,"pickupPower");
        addSliderStateCommand(commands.paintPalletPickupRadius,"pickupRadius");
        addBooleanStateCommand(commands.paintAntiAlias, "antiAlias", false, true);
        addBooleanStateCommand(commands.paintPointMode, "pointMode", false);
        addBooleanStateCommand(commands.paintColorBlend, "colorBlend", true, true);
        addBooleanStateCommand(commands.paintBrushSizeBlend, "sizeBlend", true, true);
        addBooleanStateCommand(commands.paintFadeAlphaDist, "useAlphaDist", true, true);
        addBooleanStateCommand(commands.paintSizeDist, "useSizeDist", true, true);
        addBooleanStateCommand(commands.paintRandColor, "randColor", true, true);
        addBooleanStateCommand(commands.paintUseDirection, "useDirection", true);
        addBooleanStateCommand(commands.paintUseSpeed, "useSpeed", true, true);
        addBooleanStateCommand(commands.paintFilterB, "filterShadow", true);
        addBooleanStateCommand(commands.paintFilterA, "filterBlur", true);
        addBooleanStateCommand(commands.paintUseGridGuides, "gridGuides", true, true);
        addBooleanStateCommand(commands.paintUseGuidesXY, "useGuideX", true, true);
        addBooleanStateCommand(commands.paintUseGuidesXZ, "useGuideY", true, true);
        addBooleanStateCommand(commands.paintUseGuidesYZ, "useGuideZ", true, true);
        specialBrushInfoNames = {
            brushColor:  commands.paintCurveSetBrushColor,
            brushAlpha:  commands.paintCurveSetBrushAlpha,
            lineColor:  commands.paintCurveSetLineColor,
            lineWidth:  commands.paintCurveSetLineWidth,
            lineAlpha:  commands.paintCurveSetLineAlpha,
            colorBlend: commands.paintColorBlend,
            sizeBlend: commands.paintBrushSizeBlend,
            useAlphaDist: commands.paintFadeAlphaDist,
            useSizeDist: commands.paintSizeDist,
            sprayColor:  commands.paintCurveSetSprayColor,
            spraySize: commands.paintCurveSetSpraySize,
            spraySpread:  commands.paintCurveSetSpraySpread,
            sprayAlpha:   commands.paintCurveSetSprayAlpha,
        };
        specialBrushInfoNames.names = Object.keys(specialBrushInfoNames);
    }
    function disableGuidesUI(all){
        buttons.groups.setRadio(buttonMap.get(commands.paintUseGuidesXY).group,-1);
        buttonMap.get(commands.paintUseGuidesXY).disable();
        buttonMap.get(commands.paintUseGuidesXZ).disable();
        buttonMap.get(commands.paintUseGuidesYZ).disable();
        buttonMap.get(commands.paintToggleGuidSpaceLockX).disable();
        buttonMap.get(commands.paintToggleGuidSpaceLockY).disable();
        buttonMap.get(commands.paintToggleGuidSpaceLockZ).disable();
        if(all){
            buttonMap.get(commands.paintUseGridGuides).disable();
        }
    }
    const filters = [];
    const filtersDesc = {
        shadow : {
            dialogOpen : false,
            settings : {
                xPos : 1,
                yPos : 1,
                blur : 1,
                r : 0,
                g : 0,
                b : 0,
                a : 1,
                css : "black",
                useMain : false,
                useSecond : false,
                setContext(ctx, on){
                    ctx.shadowUsesMain = this.useMain;
                    if(API.filterShadow && on){
                        ctx.shadowColor = filtersDesc.shadow.settings.css;
                        ctx.shadowOffsetX = filtersDesc.shadow.settings.xPos;
                        ctx.shadowOffsetY = filtersDesc.shadow.settings.yPos;
                        ctx.shadowBlur = filtersDesc.shadow.settings.blur;

                    }else{
                        ctx.shadowColor = "rgba(0,0,0,0)";
                    }
                },
                create(){
                    if(this.useMain){
                        this.r = colours.mainColor.r;
                        this.g = colours.mainColor.g;
                        this.b = colours.mainColor.b;
                        this.css = "rgba(" + this.r + "," + this.g + ","+ this.b + "," + this.a + ")";
                    }else if(this.useSecond){
                        this.r = colours.secondColor.r;
                        this.g = colours.secondColor.g;
                        this.b = colours.secondColor.b;
                        this.css = "rgba(" + this.r + "," + this.g + ","+ this.b + "," + this.a + ")";
                    }
                    return `drop-shadow(${this.xPos}px ${this.yPos}px ${this.blur}px ${this.css})`;
                }
            }
        },
        blur : {
            dialogOpen : false,
            settings : {
                types : [
                    ["blur","px",0,0,128],
                    ["brightness","%",0,400,800],
                    ["contrast","%",0,400,800],
                    ["grayscale","%",0,0,400],
                    ["invert","%",0,0,400],
                    ["saturate","%",0,400,800],
                    ["sepia","%",0,0,400],
                    ["hue-rotate","deg",-180,0,180],
                ],
                names : [
                    "blur",
                    "brightness",
                    "contrast",
                    "grayscale",
                    "invert",
                    "saturate",
                    "sepia",
                    "hue-rotate",
                ],
                c : ["blur","px",0,0,128],
                set current(idx){
                    const c = filtersDesc.blur.settings.types[idx];
                    filtersDesc.blur.settings.c = c;
                },
                blur : 1,
                create(){
                    var c =  filtersDesc.blur.settings.c;
                    return `${c[0]}(${this.blur/4}${c[1]})`;
                }
            }
        }
    }
    function createShadowFilterDialog(){
        var dialogButMap = new Map();
        function setButtons(buttons){
            for(const but of buttons){
                dialogButMap.set(but.command, but);
            }
            return buttons
        }
        function closeDialog(){
            pannel = undefined;
            colHandler.close();
            colHandler = undefined;
            handler.close();
            filtersDesc.shadow.dialogOpen = false;
        }
        var pannel = buttons.FloatingPannel($("#floatingContainer")[0],{title : "Shadow filter", width : 13*16, onclosing : closeDialog});
        if(!pannel){return}
        buttons.create(setButtons([
                { x : 0, y : 0, w : 3, h : 1, command : commands.displayOnly,text : "X pos"},
                { x : 3, y : 0, w : 10, h : 1, command : commands.dialogXPos, slider : {color : "black", min : -12, max : 12, step : 0.5,wStep : 1, value : 0 }},
                { x : 0, y : 1, w : 3, h : 1, command : commands.displayOnly,text : "Y pos"},
                { x : 3, y : 1, w : 10, h : 1, command : commands.dialogYPos, slider : {color : "black", min : -12, max : 12, step : 0.5,wStep :0.5, value : 0 }},
                { x : 0, y : 2, w : 3, h : 1, command : commands.displayOnly,text : "Blur"},
                { x : 3, y : 2, w : 10, h : 1, command : commands.dialogShadowBlur, slider : {color : "black", min : 0, max : 16, step : 0.5,wStep : 0.5, value : 0 }},
                { x : 0, y : 3, w : 6, h : 1, group : "shdowFilterUse", command : commands.dialogShadowUseMain,text : "Use Rand", help : "When on uses main or random color"},
                { x : 7, y : 3, w : 6, h : 1, group : "shdowFilterUse",  command : commands.dialogShadowUseSecond,text : "Use Second", help : "When on uses second color to color the shadow"},
            ]), { pannel : pannel, size : 16, }
        );
        var handler = {
            command(commandId){
                if(commandId === commands.dialogXPos || commandId === commands.dialogYPos || commandId === commands.dialogShadowBlur){
                    filtersDesc.shadow.settings.xPos = xSlide.slider.value;
                    filtersDesc.shadow.settings.yPos = ySlide.slider.value;
                    filtersDesc.shadow.settings.blur = bSlide.slider.value;
                }else if(commandId === commands.dialogShadowUseMain){
                    if(filtersDesc.shadow.settings.useMain){
                        filtersDesc.shadow.settings.useMain = false;
                        filtersDesc.shadow.settings.useSecond = false;
                        buttons.groups.setRadio(dialogButMap.get(commandId).group,-1);
                        colHandler.enable();
                    }else{
                        filtersDesc.shadow.settings.useMain = true;
                        buttons.groups.setRadio(dialogButMap.get(commandId).group,commandId);
                        colHandler.disable();
                    }
                }else if(commandId === commands.dialogShadowUseSecond){
                    if(filtersDesc.shadow.settings.useSecond){
                        filtersDesc.shadow.settings.useMain = false;
                        filtersDesc.shadow.settings.useSecond = false;
                        buttons.groups.setRadio(dialogButMap.get(commandId).group,-1);
                        colHandler.enable();
                    }else{
                        filtersDesc.shadow.settings.useSecond = true;
                        buttons.groups.setRadio(dialogButMap.get(commandId).group,commandId);
                        colHandler.disable();
                    }
                }
            },
            close(){
                xSlide = undefined;
                ySlide = undefined;
                bSlide = undefined;
                dialogButMap = undefined;
                commandRanges.removeHandler(handler.handle);
                handler = undefined;
            }
        }
        var xSlide = dialogButMap.get(commands.dialogXPos);
        var ySlide = dialogButMap.get(commands.dialogYPos);
        var bSlide = dialogButMap.get(commands.dialogShadowBlur);
        xSlide.slider.value = filtersDesc.shadow.settings.xPos;
        ySlide.slider.value = filtersDesc.shadow.settings.yPos;
        bSlide.slider.value = filtersDesc.shadow.settings.blur;
        xSlide.element.updateValue();
        ySlide.element.updateValue();
        bSlide.element.updateValue();
        if(filtersDesc.shadow.settings.useMain){
            buttons.groups.setRadio(dialogButMap.get(commands.dialogShadowUseMain).group,commands.dialogShadowUseMain);
        }else if(filtersDesc.shadow.settings.useSecond){
            buttons.groups.setRadio(dialogButMap.get(commands.dialogShadowUseSecond).group,commands.dialogShadowUseSecond);
        }else{
            buttons.groups.setRadio(dialogButMap.get(commands.dialogShadowUseMain).group,-1);
        }
        var colHandler = colours.addColorUIToPannel(pannel,4,13,filtersDesc.shadow.settings);
        filtersDesc.shadow.dialogOpen = true;
        handler.handle = commandRanges.addHandler(commands.dialogXPos,commands.dialogShadowUseSecond,handler);
    }
    function createBlurFilterDialog(){
        var dialogButMap = new Map();
        function setButtons(buttons){
            for(const but of buttons){
                dialogButMap.set(but.command, but);
            }
            return buttons
        }
        function closeDialog(){
            pannel = undefined;
            handler.close();
            filtersDesc.blur.dialogOpen  = false;
        }
        var pannel = buttons.FloatingPannel($("#floatingContainer")[0],{title : "Blur filter", width : 13*16, onclosing : closeDialog});
        if(!pannel){return}
        buttons.create(setButtons([
                { x :0, y : 0, w : 13, h : 1, command : commands.dialogBlur, slider : {color : "black", min : 0, max : 13*16, step : 1,wStep : 1, value : 0 }},

                {x : 0 , y : 1, w : 4, h: 1,  command : commands.displayOnly, text : "Filter", help : "Selects filter type"},
                {x : 4 , y : 1, w : 9 , h: 1, command : commands.dialogBlurType, selection : {
                    items : filtersDesc.blur.settings.names,
                    itemHelp : filtersDesc.blur.settings.names,
                    index : 0,
                }}
            ]), { pannel : pannel, size : 16 }
        );
        var handler = {
            command(commandId){
                if( commandId === commands.dialogBlur){
                    var c = filtersDesc.blur.settings.c;
                    var r = bSlide.slider.value / 208;
                    c[3] = Math.round(r * (c[4] - c[2]) + c[2]);
                    filtersDesc.blur.settings.blur = c[3];
                }
                if( commandId === commands.dialogBlurType){
                    filtersDesc.blur.settings.current = bType.selection.index;
                    var c = filtersDesc.blur.settings.c;
                    var r = c[3]/(c[4] - c[2]);

                    bSlide.slider.value = r*208;
                    bSlide.element.updateValue();
                }
            },
            close(){
                bSlide = undefined;
                dialogButMap = undefined;
                commandRanges.removeHandler(handler.handle);
                handler = undefined;
            }
        }
        var bSlide = dialogButMap.get(commands.dialogBlur);
        var bType = dialogButMap.get(commands.dialogBlurType);
        bSlide.slider.value = filtersDesc.blur.settings.blur;
        bSlide.element.updateValue();
        handler.handle = commandRanges.addHandler(commands.dialogBlur,commands.dialogBlurType,handler);
        filtersDesc.blur.dialogOpen = true;
    }
    var noUpdate = false;
    const API = {
        shadow :  filtersDesc.shadow.settings.setContext,
        sliders : {  // to be removed
            brush : { min : 1, max : 1, step : 1 },
            brushMin : 1,
            brushMax : 1,
            brushStep : 1,
            brushRange : 0,
            curvePower : 1,
            curveStep : 1,
            lengthFade : 1,
            widthFade : 1,
        },
        getButton(commandId) { return buttonMap.get(commandId) },
        ready(){
            createLists();
            [...drawTypeNames.values()].forEach(type=>API.loadNamedPenState(type.name));
            buttonMap.get(commands.paintBrushMin).element.updateValue();
            buttonMap.get(commands.paintBrushMax).element.updateValue();
            buttonMap.get(commands.paintCurvePowA).element.updateValue();
            buttonMap.get(commands.paintPalletPickupPower).element.updateValue();
            buttonMap.get(commands.paintPalletPickupRadius).element.updateValue();
            buttonMap.get(commands.paintBrushStep).element.updateValue();
            buttonMap.get(commands.paintCurveStep).element.updateValue();
            buttonMap.get(commands.paintLengthFade).element.updateValue();
            buttonMap.get(commands.paintWidthFade).element.updateValue();
            API.palletFrom = commands.paintColPallet;
            curves.setContext(buttonMap.get(commands.paintCurveDisplayA).element.ctx);
            API.command(commands.paintCurveSetBrushColor);
            API.command(curveTypeCommands.ease);
            API.off();
            SVGFilters.start(svgFilterContainer,"drawFilters");
            filters.push("blur(2px)");
            filters.push( "drop-shadow(1px 1px 1px " + colours.secondColor.css+")");
            filters.push(SVGFilters.addFilter("turbulence",{amount : 2}));
            filters.push(SVGFilters.addFilter("erode",{amount : 2}));
            filters.push(SVGFilters.addFilter("outline",{amount : 2}));
            filters.push(SVGFilters.addFilter("blur",{amount : 2}));
            buttonMap.get(commands.paintPaste).element.mouseFocus = API.showCutBufferInfo;
            buttonMap.get(commands.paintAsPattern).element.mouseFocus = API.showCutPatternInfo;
            API.menuReady = true;
            API.usedNamedPenState("circulared");
        },
        setView(v){ view = v },
        fillModes : {  // Contains two sets of fill modes, One for closed shapes and oine for open shapes
            outline : 0,
            fill : 1,
            outlineClose : 1,
            fillOutline : 2,
            fillOpen : 2,
            fillOutlineOpen : 3,
            fillOutlineClosed : 4,
            floodFill : 0,
            floodFillDiagonal : 1,
            floodFillEdges : 2,
        },
        get currentDrawName() {
            var name = drawTypeNames.get(API.drawType);
            if(name !== undefined){
                return name.name;
            }
            return undefined;
        },
        logCoords: false,
        menuReady : false,
        drawType : 0,
        palletFrom : 0,
        brushMin : 1,
        brushMax : 1,
        brushStep : 1,
        brushRange : 0,
        curvePower : 1,
        curveStep : 1,
        lengthFade : 1,
        widthFade : 1,
        editCurveRepeat : false,
        activeCurvePower : 1,
		curveExtraFunction: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]], // idx of curve brush super power
        curveLinkedCommand : [-1,-1,-1,-1,-1,-1,-1,-1,-1], // linkes curveCommands list to checkbox commands that activate the curve
        currentActiveCurveIdx : -1,
        currentCurve : -1,  // holds curve button commandId
        currentCurveMixed : false, // when true using a mixed curve
		colorModeUIUpdatePending: false,
		colorModeUISetIndex: 0,
        recycleColor : false,
        recycleDestination : false,
        cuttingTool : 0,
        prevCMDWasToBuffer: false,
        brissleMode : 0,
		perviouseBrissleState: null,
        randColor : false,
        colorMode : false,
        colorMode2 : false,
        colorBlend : false,
        colorBlendTypes : 0, // 0 normal 1 for gradients
        gradientMode : 0,
        sizeBlend : false,
        antiAlias : false,
        useDirection : false,
        useAlphaDist : false,
        useSpeed : false,
        gridGuides : false,
        gridGuidesSnap : false,  // depreciated use gridSnapType
        gridSnapType: 0, // 0 off, 1 add snap, 2 snap only, 3 add only
        gridCanAdd: false,
        gridCanSnap: false,
        canDrawCircle: true,  // set to false if any vanish grids in use. Blocks pen from using grid to draw
        diagonalCut : false,
        brushOptionsA : -1,
        brushOptionsB : -1,
        brushOptionsC : -1,
        brushOptionsD : -1,
        pickupPower : 50,
        pickupRadius : 50,
        pointMode : true,
        usingGuides : -1,
        useGuideX : false,
        useGuideY : false,
        useGuideZ : false,
        fillMode : 0, // 0 stroke  1 fill 2 stroke fill
        filterBlur : false,
        filterShadow : false,
        filterC : false,
        filterD : false,
        filterE : false,
        filterF : false,
        changed : true,
        showingCutBuffer: false,
        showCutBufferInfo(show) {
            if (show) {
                if(cutBuffer.hasContent) {
                    infoPannel.show(infoPannel.displayTypes.buffer, cutBuffer.buffer)
                    API.showingCutBuffer = true;
                    return true;
                }
            } else if (API.showingCutBuffer) { infoPannel.hide(); }

        },
        showingCutPattern: false,
        showCutPatternInfo(show) {
            if (show) {
                if(cutBuffer.hasPattern) {
                    infoPannel.show(infoPannel.displayTypes.buffer, cutBuffer.pattern);
                    API.showingCutPattern = true;
                    return true;
                }
            } else if (API.showingCutPattern) { infoPannel.hide(); }

        },
        buildFilter(){
            var filter = "";
            var space = ""
            if(!API.filterShadow && !API.filterBlur && !API.filterC && !API.filterD && !API.filterE && !API.filterF) { return "none" }
            const sl = API.sliders;
            if(API.filterBlur){
                filter += space +  filtersDesc.blur.settings.create();
                space = " ";
            }
            if(API.filterShadow){
                filtersDesc.shadow.settings.create();
            }
            if(API.filterC){
                filter += space + filters[2];
                space = " ";
            }
            if(API.filterD){
                filter += space + filters[3];
                space = " ";
            }
            if(API.filterE){
                filter += space + filters[4];
                space = " ";
            }
            if(API.filterF){
                filter += space + filters[5];
                space = " ";
            }
            return filter;
        },
        paintSpritePreDeleteEvent(spr) {
            if (spr.type.image && spr.image.isDrawable && spr.drawOn) {
                log("pre delete");
                spr.setDrawOn(false);
                spr.removeEvent("onpredelete", API.paintSpritePreDeleteEvent);
                setTimeout(() => {
                    var c = 0;
                    sprites.each(spr => { c += (spr.type.image && spr.image.isDrawable && spr.drawOn) ? 1 : 0 });
                    if (c === 0) {
                        uiPannelList.paint.toggleShow();

                    }

                },0);
            }

        },
        togglePaintMode(eventType, event){
            if(!editSprites.drawingModeOn){
                if(event.opening){
                    sprites.eachDrawable(spr=>spr.setDrawOn(false));
                    var count = 0, hasLiveCap = false, hasLocked = false, wrongType = false;
                    var webGLFilter = webGLFilterMenus.filterDialogOpen;
                    if (!webGLFilter) {
                        selection.each(spr => {
                            if(spr.type.image && spr.image.isDrawable){
                                if (spr.locks.UI || spr.type.hidden) {
                                    hasLocked = true;
                                } else if (!spr.type.liveCapture) {

                                    spr.addEvent("onpredelete", API.paintSpritePreDeleteEvent);
                                    spr.setDrawOn(true);
                                    count ++;
                                } else {
                                    hasLiveCap = true;
                                }
                            } else if(!spr.type.cutter) {
                                wrongType = true;
                            }
                        });
                    }
                    if(count === 0){

                        if(selection.length > 0 && !hasLiveCap && !hasLocked && !wrongType && !webGLFilter){
                            const convertToDrawable = buttons.quickMenu( "20 Confirm?|Cancel,Convert|textCenter Images must be drawable to open paint mode!,textCenter Convert selected images to drawable\\?");
                            convertToDrawable.onclosed = () => {
                                if(convertToDrawable.exitClicked === "Convert"){
                                    selection.silent = true;
                                    const sel = selection.asArray();
                                    selection.clear();
                                    sel.forEach(spr => {if(spr.type.image && !spr.image.isDrawable) {selection.add(spr)}});
                                    if(selection.length > 0) { issueCommand(commands.spritesToDrawable) }
                                    selection.clear();
                                    sel.forEach(spr => {if(spr.type.cutter) {selection.add(spr)}});
                                    if(selection.length > 0) { issueCommand(commands.edSprCreateDraw) }
                                    selection.silent = false;
                                    selection.clear();
                                    selection.add(sel.filter(spr => spr.type.image && spr.image.isDrawable))


                                    setTimeout(() => {uiPannelList.paint.toggleShow()},10);

                                }else{
                                    log.warn("Can not open paint on selected images.");
                                }
                            };
                        } else {
                            if (webGLFilter) {
                                log.warn("Can not paint while applying a WebGL filter");
                            }
                            if (wrongType) {
                                log.warn("One or more selected sprites can not be drawn on.");
                            }
                            if (hasLocked) {
                                log.warn("Can not draw on locked or hidden sprites.");
                            }
                            if (hasLiveCap) {
                                log.warn("Can not draw on live capture images.");
                            }
                            if (!hasLocked && ! hasLiveCap && !webGLFilter) {
                                 log.warn("No images selected to draw on!");
                            }
                        }
                        event.dontToggle = true;
                        spriteList.updateInfo();
                        return;
                    }


                }
            }else{
                sprites.each(spr => {
                    if(spr.type.image && spr.image.isDrawable && spr.drawOn){
                        spr.removeEvent("onpredelete", API.paintSpritePreDeleteEvent);
                        spr.setDrawOn(false);
                    }
                });

            }
            editSprites.drawingModeOn = !event.opening;
            editSprites.command(commands.edSprDrawing);
            if(editSprites.drawingModeOn){
                pens.updateMode(true);
                API.state = paintStates[API.stateId - commands.paintDrawTypesStart];
                API.updateUI();
            } else {
                if (typeof pens !== "undefined") { pens.cleanup() }
                curved.release(); // free up memory used by arrays
                paintStates[API.stateId - commands.paintDrawTypesStart] = API.state;
            }
            spriteList.updateInfo();
            setKeyboardMode();

        },
        updateCutBuffer() {
            if(cutBuffer.hasContent){
                if(cutBuffer.hasPattern && API.drawType !== commands.paintSpray && API.drawType !== commands.paintPoints && API.drawType !== commands.paintCurve && API.gradientMode === 4) {
                    cutBuffer.createPattern();
                } else if(cuttingTools.active && cuttingTools.defined){
                    cuttingTools.setFromCutBuffer();
                }
            }
        },
        paintStateUpdateInProgress : false,
        booleanState(commandId,state){
            const comDesc = booleanStateCommands.get(commandId);
            const name = comDesc.name;
            if (state !== undefined) { API[name] = state }
            else { API[name] = !API[name] }
            if(name === "useDirection") {
                API.useDirectionShadow = API.useDirection; // bug fix pens object changes this value (API.useDirection) and its too much messing around to keep the state known
                                                           // so this stops the state switching to false incorrectly

            }
            if (comDesc.radio) { buttons.groups.setRadio(comDesc.group, API[name] ? commandId : -1) }
            else {  buttonMap.get(commandId).setSprite(API[name] ? 1 : 0) }
            return comDesc.pastThrough;
        },
        sliderState(commandId,state){
            var name = sliderStateCommands.get(commandId).name;
            var api = API;
            const pastThrough = sliderStateCommands.get(commandId).pastThrough;
            const button = buttonMap.get(commandId);
            var stateChanged = false;
            if(state !== undefined){
                button.slider.value = state;
                button.element.updateValue();
                api[name] = state;
                stateChanged = api.changed = true;
            }else{
                api[name] = button.slider.value;
                stateChanged = api.changed = true;
            }
            return stateChanged && pastThrough;
        },
        commandCallSimple : true, // tells command handler to not include any button and event related stuff
        commands: {
            updateGuides: false,
            updateCurves: false,
            [commands.paintCutBufAnimPrev](){
                if(cutBuffer.hasContent && cutBuffer.isAnimated) { cutBuffer.stepFrame(-1) }
            },
            [commands.paintCutBufAnimNext](){
                if(cutBuffer.hasContent && cutBuffer.isAnimated) { cutBuffer.stepFrame(1) }
            },
            [commands.paintCutBufMirV](){
                if (cutBuffer.hasContent) {
                    const size = cuttingTools.saveSize();
                    cutBuffer.transform("mirror ver");
                    API.updateCutBuffer();
                    cuttingTools.restoreSize(size);
                }
            },
            [commands.paintCutBufMirH](){
                if(cutBuffer.hasContent){
                    const size = cuttingTools.saveSize();
                    cutBuffer.transform("mirror hor");
                    API.updateCutBuffer();
                    cuttingTools.restoreSize(size);
                }
            },
            [commands.paintCutBufRotCCW](){
                if(cutBuffer.hasContent){
                    const size = cuttingTools.saveSize();
                    cutBuffer.transform("rotate ccw");
                    API.updateCutBuffer();
                    [size.h, size.w] = [size.w, size.h];
                    cuttingTools.restoreSize(size);
                }
            },
            [commands.paintCutBufRotCW](){
                if(cutBuffer.hasContent){
                    const size = cuttingTools.saveSize();
                    cutBuffer.transform("rotate cw");
                    API.updateCutBuffer();
                    [size.h, size.w] = [size.w, size.h];
                    cuttingTools.restoreSize(size);
                }
            },
            [commands.paintCutBufUniform](e, left, right){
                if (cuttingTools.active) {
                    if (mouse.ctrl && mouse.shift) {
                        log.warn("Ambiguouse command [CTRL] and [SHIFT] is not a known modifier combo");
                    } else if (mouse.shift) {
                        cuttingTools.tile();
                    } else if (mouse.ctrl) {
                        if (left) { cuttingTools.resize("resize", 1) }
                        else if (right) { cuttingTools.resize("resize", -1) }
                    } else {
                        if (left) { cuttingTools.resize("scale", 2) }
                        else if (right) { cuttingTools.resize("scale", 0.5) }
                    }

                }
            },
            [commands.paintCutBufWidth](e, left, right){
                if (cuttingTools.active) {
                    if (mouse.shift) {
                        if (mouse.ctrl) {
                            if (left) { cuttingTools.resize("resize", 1, false, true) }
                            else if (right) { cuttingTools.resize("resize", -1, false, true) }
                        } else {
                            if (left) { cuttingTools.resize("scale", 2, false, true) }
                            else if (right) { cuttingTools.resize("scale", 0.5, false, true) }
                        }

                    } else {
                        if (mouse.ctrl) {
                            if (left) { cuttingTools.resize("resize", 1, true, false) }
                            else if (right) { cuttingTools.resize("resize", -1, true, false) }
                        } else {
                            if (left) { cuttingTools.resize("scale", 2, true, false) }
                            else if (right) { cuttingTools.resize("scale", 0.5, true, false) }
                        }
                    }

                }
            },
            [commands.paintSelectionOpts](e, left, right){  // button to access selection options
                if(cuttingTools.active && !cuttingTools.isHoldingBuffer) {
                     buttonMap.get(commands.paintSelectDefinesSpriteAndAddWorkSpace).enable();
                     buttonMap.get(commands.paintSelectDefinesSprite).enable();
                     buttonMap.get(commands.paintSelectAsClip).enable();

                } else {
                     buttonMap.get(commands.paintSelectDefinesSpriteAndAddWorkSpace).disable();
                     buttonMap.get(commands.paintSelectDefinesSprite).disable();
                     buttonMap.get(commands.paintSelectAsClip).disable();
                }
                if(cutBuffer.hasPattern) {

                    buttonMap.get(commands.paintClearPattern).enable();
                } else {
                    buttonMap.get(commands.paintClearPattern).disable();
                }

            },
            [commands.paintSelectAsClip](e, left, right) {
                if (cuttingTools.defined) {
                    API.useSelectionClip = !API.useSelectionClip;

                } else {
                    API.useSelectionClip = false;
                }
                pens.setSelectionClipState(API.useSelectionClip);
                if (API.useSelectionClip) { log.info("Clip to selection area ON") }
                else { log.info("Clip to selection area OFF") }
            },
            [commands.paintSelectDefinesSprite](e, left, right){
                API.commands[commands.paintSelectDefinesSpriteAndAddWorkSpace]( commands.paintSelectDefinesSprite, left, right);
            },
            [commands.paintSelectDefinesSpriteAndAddWorkSpace](e, left, right){
                var selectionPos, cutFromSpr;
                var selPos;
                var nameNewSprite = mouse.keyEvent;
                const addSubSprToWorkSpace = (spr, idx) => {
                    const subSpr = spr.image.desc.sprites[idx];
                    const tL = spr.key.toWorldPoint(subSpr.x, subSpr.y);
                    const bR = spr.key.toWorldPoint(subSpr.x + subSpr.w , subSpr.y + subSpr.h);
                    var spr1 = new Sprite((tL.x + bR.x) / 2 , (tL.y + bR.y) / 2, spr.w, spr.h);
                    spr1.changeImage(spr.image);
                    spr1.changeToSubSprite(idx);
                    spr1.sx = spr.sx;
                    spr1.sy = spr.sy;
                    spr1.rx = spr.rx;
                    spr1.ry = spr.ry;
                    spr1.key.update();
                    if (nameNewSprite) { editSprites.addCreatedSpritesNamed(spr1) }
                    else { editSprites.addCreatedSprites(spr1) }
                    
                    if (selPos) { setTimeout(() => cuttingTools.restoreSize(selPos), 0) };

                }
                const createSubSprite = (spr, pos) => {
                    if (!spr.image.desc.sprites ) { spr.image.addSubSprites([]) }
                    var id = spr.image.desc.sprites.length;
                    const x = (pos.x - pos.w / 2) | 0;
                    const y = (pos.y - pos.h / 2) | 0;
                    const w = pos.w | 0;
                    const h = pos.h | 0;
                    spr.image.desc.sprites.push({x, y, w, h, id});
                }
                if(cuttingTools.active && !cuttingTools.isHoldingBuffer) {
                    selPos = cuttingTools.saveSize();
                    cuttingTools.constrainSelection();
                    selectionPos = cuttingTools.saveSize();
                    if (selectionPos.w !== 0 && selectionPos.h !== 0) {
                        cutFromSpr = cuttingTools.sprite;
                        createSubSprite(cutFromSpr, selectionPos);
                        if(e !== commands.paintSelectDefinesSprite) {
                            addSubSprToWorkSpace(cutFromSpr, cutFromSpr.image.desc.sprites.length - 1);
                        }


                    } else {
                        log.warn("Selection is outside the source sprite");
                        if (selPos) { setTimeout(() => cuttingTools.restoreSize(selPos), 0) };
                    }
                }
            },
            [commands.paintAsPattern](e, left, right){
                 if (cuttingTools.defined) {
                    cuttingTools.directToPattern();
                    log.info("Selection copied to current pattern");
                  }  else if (cutBuffer.hasContent) {
                    cutBuffer.createPattern();
                    log.info("Copy buffer copied to current pattern");
                  }
            },
            [commands.paintCoordsToClipboard](e, left, right){
                log.copyToClipboard();
                return false;
            },
            [commands.paintCoordsToLog](e, left, right){
                if (cuttingTools.active) {
                    API.logCoords = true;
                    return false;
                }
                log.warn("Coords to log only in cut mode.");
                return false;
            },
            [commands.paintClearPattern](e, left, right){
                cutBuffer.clearPattern();
                if(API.drawType !== commands.paintCurve){
                    if (API.drawType === commands.paintLine) {
                        if (API.gradientMode === 3) {
                            API.gradientMode = 0;
                            API.colorBlend = false
                            buttonMap.get(commands.paintColorBlend).setSprite(buttonLineGradientModeIconIndex[API.gradientMode]);
                            buttons.groups.setRadio("gradientSetting", -1);
                        }
                    } else if(API.colorBlendTypes !== 0 && API.gradientMode === 4) {
                        API.gradientMode = 0;
                        API.colorBlend = false;
                        buttonMap.get(commands.paintColorBlend).setSprite(buttonGradientModeIconIndex[API.gradientMode]);
                        buttonMap.get(commands.paintCurveSetBrushColor).setSprite(buttonGradientModeIconIndex[API.gradientMode]);
                        if (!API.sizeBlend && !API.useAlphaDist) { API.sizeBlend = true }
                        buttons.groups.setRadio(buttonMap.get(commands.paintBrushSizeBlend).group, API.sizeBlend ? commands.paintBrushSizeBlend : -1);
                        buttons.groups.setRadio(buttonMap.get(commands.paintFadeAlphaDist).group, API.useAlphaDist ? commands.paintFadeAlphaDist : -1);
                    }
                    log.info("Pattern discarded");
                }
                API.commands.updateGuides = true;

            },
            [commands.paintPasteToImageAndWorkSpace](e, left, right){
                var selectionPos, cutFromSpr;
                var selPos;
                var nameNewSprite = mouse.keyEvent;

                const addToWorkSpace = (canvas) => {
                    var x = selectionPos.x, y = selectionPos.y;
                    x -= selectionPos.w / 2;
                    y -= selectionPos.h / 2;
                    var xx = x + selectionPos.w;
                    var yy = y + selectionPos.h;
                    const topLeft = cutFromSpr.key.toWorldPoint(x, y);
                    const topRight = cutFromSpr.key.toWorldPoint( x + selectionPos.w, y);
                    const botLeft = cutFromSpr.key.toWorldPoint(x, y + selectionPos.h);
                    
                    var sprite = new Sprite(0,0, canvas.w, canvas.h, "sliced_"+cuttingTools.sprite.name);
                    sprite.changeImage(canvas);
                    sprite.fitToCorners(topLeft, topRight, botLeft);
                    selection.save();
                    if (nameNewSprite) { editSprites.addCreatedSpritesNamed(sprite) }
                    else { editSprites.addCreatedSprites(sprite) }
                    selection.restore();
                    selPos && setTimeout(() => cuttingTools.restoreSize(selPos), 0);
                }
                
                if(cuttingTools.active  && !cuttingTools.isHoldingBuffer) {
                    selPos = cuttingTools.saveSize();
                    cuttingTools.constrainSelection();
                    selectionPos = cuttingTools.saveSize();
                    
                    if (selectionPos.w !== 0 && selectionPos.h !== 0) {
                        cutFromSpr = cuttingTools.sprite;
                        cuttingTools.selectionToMedia().then(addToWorkSpace);

                    } else {
                        log.warn("Can not copy selection to media as Selection is outside the image");
                        if (selPos) { setTimeout(() => cuttingTools.restoreSize(selPos), 0) };
                    }
                } else if (cutBuffer.hasContent) {
                    if (cutBuffer.isAnimated) {
                        log.warn("Cutbuffer containes an animation, add to media and paste to workspace is yet to be implemented");
                    } else {
                        selectionPos = cuttingTools.saveSize();
                        cutFromSpr = cuttingTools.sprite;
                        cutBuffer.copyToMedia().then(addToWorkSpace);
                    }
                }

            },
            [commands.paintPasteToImage](e, left, right){
                if(cutBuffer.hasContent) {
                    cutBuffer.copyToMedia()
                    log.info("Copy buffer added to media as image");
                } else if(cuttingTools.defined) {
                    cuttingTools.directToMedia()
                    log.info("Copy buffer added to media as image");
                }
            },
            [commands.paintCurvePowA]() {
                if(API.currentCurve !== -1){
                    if (API.editCurveRepeat) { curves.curves[curves.currentCurveName].repeats = API.activeCurvePower }
                    else {
						const extrafunctions = API.curveExtraFunction[API.currentCurve - commands.paintCurveSetBrushColor];
						curves.curves[curves.currentCurveName].power = API.activeCurvePower
						if(extrafunctions[0] > 1) {
							curves.curves[curves.currentCurveName].superPowers[extrafunctions[1]] = curves.curves[curves.currentCurveName].power;

						}
					}
                    API.commands.updateCurves = true;
                }
            },
            [commands.paintMouseBrushTrackIncrease]() {
                mouseBrush.trackRate = 0.1;
                API.commands.updateGuides = false;
            },
            [commands.paintMouseBrushTrackDecrease]() {
                mouseBrush.trackRate = -0.1;
                API.commands.updateGuides = false;
            },
            [commands.paintLogCoordinate]() { mouse.cMouse.logPosition = true },
            [commands.paintUndo]() {
                sprites.processImages(image => (image.undo(), true));
                sprites.restoreDrawable();
            },
            [commands.paintRedo]() {
                sprites.processImages(image=> (image.redo(), true));
                sprites.restoreDrawable();
            },
            [commands.paintFilterA]() { if (!filtersDesc.blur.dialogOpen ) { createBlurFilterDialog() } },
            [commands.paintFilterB]() { if (!filtersDesc.shadow.dialogOpen) { createShadowFilterDialog() } },
            [commands.paintToggleGuidSpaceLock]() { guides.setSpacingLock() },
            [commands.paintSelectAll]() {
                if (!cuttingTools.active) { issueCommand(commands.paintCutter) }
                if (cuttingTools.active) {
                    if (!cuttingTools.draggingSelection) {
                        if (cuttingTools.isHoldingBuffer) { pens.dropSelection() }
                        cuttingTools.sprite = pens.getTopSprite();
                        cuttingTools.selectAll();
                    }
                }
            },
            [commands.paintCopy]() {
                if(cuttingTools.active && cuttingTools.defined){
                    if (cutBuffer.hasContent && API.prevCMDWasToBuffer) {
                        log.warn("Buffer already holding this content.");
                        API.prevCMDWasToBuffer = true;
                        return false;
                    } else {  
                        cuttingTools.toCutBuffer(false);
                        cuttingTools.setFromCutBuffer();
                        cuttingTools.cutBufferToClipboard();
                        API.commands.updateGuides = true;
                        API.prevCMDWasToBuffer = true;
                        cuttingTools.hasDragged = false;

                    }
                }
            },
            [commands.paintCut]() {
                if(cuttingTools.active && cuttingTools.defined){
                    if (cutBuffer.hasContent && API.prevCMDWasToBuffer) {
                        log.warn("Buffer already holding this content.");
                        API.prevCMDWasToBuffer = true;
                        return false;
                    } else {                    
                        cuttingTools.toCutBuffer(true);
                        cuttingTools.cutBufferToClipboard();
                        API.commands.updateGuides = true;
                        API.prevCMDWasToBuffer = true;
                        cuttingTools.hasDragged = false;
                    }
                }
            },
            [commands.paintPaste]() {
                if (cutBuffer.hasContent) {
                    if (cuttingTools.active) {
                        pens.dropSelection();
                        cuttingTools.setFromCutBuffer();
                    } else {
                        setTimeout(()=>{
                            API.command(commands.paintCutter);
                            cuttingTools.setFromCutBuffer();
                        }, 0);
                    }
                }
            },
            [commands.paintBrushOptionsA]() {
                const groupName = buttonMap.get(commands.paintBrushOptionsA).quickSelect.groupName;
                const comBase = buttonMap.get(commands.paintBrushOptionsA).quickSelect.commandBase;
                buttons.groups.setRadio(groupName, comBase + API.brushOptionsA);
                return false;
            },
            [commands.paintBrushOptionsB]() {
                const groupName = buttonMap.get(commands.paintBrushOptionsB).quickSelect.groupName;
                const comBase = buttonMap.get(commands.paintBrushOptionsB).quickSelect.commandBase;
                buttons.groups.setRadio(groupName, comBase + API.brushOptionsB);
                return false;
            },
            [commands.paintBrushOptionsC](event, left, right) {
                if (right) { API.brushOptionsC += brushOptionsC.names.length - 1 }
                else { API.brushOptionsC += 1 }
                API.brushOptionsC %= brushOptionsC.names.length;
                if (API.drawType === commands.paintBrissleB) { API.colorMode = API.brushOptionsC }
                API.commands.updateGuides = true;
            },
            [commands.paintFilterC](event, left, right) {
                if(right && API.filterC){
                    const node = SVGFilters.getFilterNode(filters[2]);
                    node.displace.scale = API.curveStep;
                }else{
                    API.filterC = !API.filterC;
                    buttonMap.get(commands.paintFilterC).setSprite(API.filterC ? 1 : 0);
                }
            },
            [commands.paintFilterD](event, left, right) {
                if(right && API.filterD){
                    const node = SVGFilters.getFilterNode(filters[3]);
                    node.erode.radius = API.curveStep;
                }else{
                    API.filterD = !API.filterD;
                    buttonMap.get(commands.paintFilterD).setSprite(API.filterD ? 1 : 0);
                }
            },
            [commands.paintFilterE] (event, left, right) {
                 if(right && API.filterE){
                    const node = SVGFilters.getFilterNode(filters[4]);
                    node.dilate.radius = API.curveStep;
                }else{
                    API.filterE = !API.filterE;
                    buttonMap.get(commands.paintFilterE).setSprite(API.filterE ? 1 : 0);
                }
            },
            [commands.paintFilterF](event, left, right) {
                if(right && API.filterF){
                    const node = SVGFilters.getFilterNode(filters[5]);
                    node.blur.stdDeviation = API.curveStep;
                }else{
                    API.filterF = !API.filterF;
                    buttonMap.get(commands.paintFilterF).setSprite(API.filterF ? 1 : 0);
                }
            },
            [commands.paintClear](event, left, right) {
                if (right) {
					const cleared = new WeakSet();
					sprites.each(spr => {
						if (spr.drawOn) {
							if (spr.type.subSprite) {
								if(spr.type.animated && spr.animation.tracks.image) {
									for(const key of spr.animation.tracks.image.keys) {
										const subSpr = spr.getUniqueSubSpriteForIdx(key.value);
										if (!cleared.has(subSpr.uid)) {
											cleared.add(subSpr.uid);
											spr.image.clear(true, subSpr.subSprite);
										}
									}
								} else if (!cleared.has(spr.subSprite)) {
									cleared.add(spr.subSprite);
									spr.image.clear(true,spr.subSprite);
								}
							} else {
								if(spr.type.animated && spr.animation.tracks.image) {
									for(const key of spr.animation.tracks.image.keys) {
										if (!cleared.has(key.value)) {
											cleared.add(key.value);
											key.value.clear();
										}
									}
								}else if(!cleared.has(spr.image)) {
									cleared.add(spr.image);
									spr.image.clear();
								}
							}
						}
					});
				} else {
					const cleared = new WeakSet();
					sprites.each(spr => {
						if (spr.drawOn) {
							if (spr.type.subSprite) {
								if (!cleared.has(spr.subSprite)) {
									cleared.add(spr.subSprite);
									spr.image.clear(true,spr.subSprite);
								}
							} else if(!cleared.has(spr.image)) {
								cleared.add(spr.image);
								spr.image.clear();
							}
						}
					});
				}
                if(API.gridSnapType &&  !snaps.lock){
                    if (!right) {
                        log.info("Clearing all snap items. To keep and clear, use right click on this button");
                        snaps.clearAll();
                    }
                }
            },
            [commands.paintColPallet](event, left, right) {
                if (mouse.ctrl || right) { palletFromSelectStates.current += palletFromSelectStates.length - 1 }
                else { palletFromSelectStates.current += 1 }
                palletFromSelectStates.current %= palletFromSelectStates.length;
                const pfs = palletFromSelectStates[palletFromSelectStates.current];
                buttonMap.get(commands.paintColPallet).setSprite(pfs.sprite);
                API.recycleColor = pfs.recycleColor;
                API.recycleDestination = pfs.recycleDestination;
                API.palletFrom = pfs.palletFrom;
				API.commands.updateGuides = true;
				API.colorModeUIUpdatePending = true;
				return true;
            },
			[commands.paintUseSpeed]() {
				if(API.drawType === commands.paintSpray || API.drawType === commands.paintPoints) {
					if (!API.paintStateUpdateInProgress) {
						if(API.useSpeed) {
							API.randColor && (API.colorBlend = false);
							API.colorBlend && (API.randColor = false);
						} else {
							API.colorBlend = false;
							API.sizeBlend = false;
						}
					}
                    API.colorModeUISetIndex = 0;
					API.updateColorModeUI()
				}
			},
            [commands.paintRecordPaintingToggle]() {
                if(!API.recording && !media.videoCapture) {
                    let foundCount = 0;
                    let foundMedia, foundView;
                    sprites.eachOfType(spr => {
                        if(spr.drawOn) {
                            if(foundCount === 0) {
                                foundMedia = spr.image;
                                foundView = spr;
                                foundCount ++;
                            }
                            if(foundMedia && foundMedia.guid !== spr.image.guid) { foundCount ++ }

                        }
                    },"image");
                    if(foundCount > 1) { log.warn("Can only record one image at a time") }
                    else {
						function frameCaptured() { }
						const guid = foundMedia.guid
                        const m = media.convertToCanvas(foundMedia);
						sprites.eachOfType(spr => { if(spr.image.guid === guid) { spr.image = m } },"image");
						media.videoCapture = canvasRecorder(m, 30);
						media.videoCapture.mediaListItem = mediaList.listItemByIndex(mediaList.indexOfByGUID(guid));
						m.desc.videoCap = true;
						m.desc.toString = function() {
							return textIcons.video + " ("  + media.videoCapture.status + ") " +  media.videoCapture.frames + "F " + media.videoCapture.duration.toFixed(2) +  "s " + utils.numToRAM(media.videoCapture.size) + " " + m.w + "by"  + m.h;
						}
                        m.onupdated = function() {
							if (API.recording) { media.videoCapture.step(1, frameCaptured) }
                        };


						foundView.type.videoCapture = true;
						media.videoCapture.background = colours.secondColor.css;
						media.videoCapture.owner = foundView;
						m.update();
						media.videoCapture.record();
                        API.recording = true;
						log.info("Recording");
                    }
                } else if(media.videoCapture && !API.recording) {
					media.videoCapture.owner.videoCapture = true;
					media.videoCapture.record();
					API.recording = true;
					log.info("Resumed recording");

				}else{
                    //API.videoCapture.stop();
                    log.info("Recording paused. The recording can be saved via the Media tab");
					media.videoCapture.pause();
                    API.recording = false;
                }
                buttons.groups.setCheck(buttonMap.get(commands.paintRecordPaintingToggle).group,commands.paintRecordPaintingToggle, API.recording);
                mediaList.update();
                API.commands.updateGuides = true;
            },
            [commands.paintUseSnapGridGuides](event, left, right) {
                if (left) {
                    API.gridSnapType = (API.gridSnapType + 1) % 4;
                    API.gridCanSnap = API.gridSnapType === 1 || API.gridSnapType === 3;
                    API.gridCanAdd = API.gridSnapType === 1 || API.gridSnapType === 2;
                }
                if (right && API.gridSnapType) {
                    snaps.clearAll();

                }
                API.commands.updateGuides = true;

                API.commands.updateGuides = true;
            },
            [commands.paintAntiAlias]() { },
            [commands.paintColorBlend]() {
				if(API.drawType === commands.paintSpray || API.drawType === commands.paintPoints) {
					if (!API.paintStateUpdateInProgress) {
						if(API.colorBlend && API.randColor) { API.randColor = false }
					}
				} else if(API.drawType !== commands.paintCurve){
                    if (API.drawType === commands.paintLine) {
                        if (!API.paintStateUpdateInProgress) {
                            const modeTypes = cutBuffer.hasPattern ? 4 : 3;
                            API.gradientMode += mouse.ctrl ? (modeTypes - 1): 1;
                            API.gradientMode %= modeTypes;
                            API.colorBlend = API.gradientMode > 0;
                        }
                        buttonMap.get(commands.paintColorBlend).setSprite(buttonLineGradientModeIconIndex[API.gradientMode]);
                        buttons.groups.setRadio("gradientSetting", API.colorBlend ? commands.paintColorBlend : -1);
                        if (API.gradientMode === 3) {
                            buttonMap.get(commands.paintFadeAlphaDist).disable();
                            API.useAlphaDist = false
                        } else {
                            buttonMap.get(commands.paintFadeAlphaDist).enable();
                        }
                    } else if(API.colorBlendTypes !== 0){
                        const modeTypes = cutBuffer.hasPattern ? 5 : 4;
                        API.gradientMode += mouse.ctrl ? (modeTypes - 1): 1;
                        API.gradientMode %= modeTypes;
                        buttonMap.get(commands.paintColorBlend).setSprite(buttonGradientModeIconIndex[API.gradientMode]);
                        buttonMap.get(commands.paintCurveSetBrushColor).setSprite(buttonGradientModeIconIndex[API.gradientMode]);
                        API.colorBlend = API.gradientMode > 0;
                        if (!API.sizeBlend && !API.useAlphaDist) { API.sizeBlend = true }
                        buttons.groups.setRadio(buttonMap.get(commands.paintBrushSizeBlend).group, API.sizeBlend ? commands.paintBrushSizeBlend : -1);
                        buttons.groups.setRadio(buttonMap.get(commands.paintFadeAlphaDist).group, API.useAlphaDist ? commands.paintFadeAlphaDist : -1);
                    }
                }
            },
            [commands.paintBrushSizeBlend]() { // this and paintFadeAlphaDist are overloaded and handle gradient color and alpha
                if(API.drawType !== commands.paintCurve){
                    if (API.colorBlendTypes === 0 && API.drawType === commands.paintLine) {
                        if(API.gradientMode <= 1) {

                        }
                        buttons.groups.setRadio(buttonMap.get(commands.paintBrushSizeBlend).group, API.sizeBlend ? commands.paintBrushSizeBlend : -1);
                    } else if(API.colorBlendTypes === 1 && API.gradientMode > 0){
                        if(API.sizeBlend && !API.useAlphaDist){
                            API.sizeBlend = false;
                            API.useAlphaDist = true
                        }else if(API.sizeBlend && API.useAlphaDist){
                            API.sizeBlend = false;
                            API.useAlphaDist = true;
                        }else if(!API.sizeBlend) { API.sizeBlend = true }
                        buttons.groups.setRadio(buttonMap.get(commands.paintBrushSizeBlend).group, API.sizeBlend ? commands.paintBrushSizeBlend : -1);
                        buttons.groups.setRadio(buttonMap.get(commands.paintFadeAlphaDist).group, API.useAlphaDist ? commands.paintFadeAlphaDist : -1);
                    }
                }
            },
            [commands.paintFadeAlphaDist]() { // this is use alpha gradient
                if(API.drawType !== commands.paintCurve){
                    if (API.colorBlendTypes === 0 && API.drawType === commands.paintCurve && API.gradientMode <= 1) {
                        log("line alpha blend");
                    } else if(API.colorBlendTypes === 1 && API.gradientMode > 0){
                        if(API.useAlphaDist && !API.sizeBlend){
                            API.sizeBlend = true;
                            API.useAlphaDist = false
                        }else if(API.useAlphaDist && API.sizeBlend){
                            API.sizeBlend = true;
                            API.useAlphaDist = false;
                        } else if(!API.useAlphaDist) { API.useAlphaDist = true }
                        buttons.groups.setRadio(buttonMap.get(commands.paintBrushSizeBlend).group, API.sizeBlend ? commands.paintBrushSizeBlend : -1);
                        buttons.groups.setRadio(buttonMap.get(commands.paintFadeAlphaDist).group, API.useAlphaDist ? commands.paintFadeAlphaDist : -1);
                    }
                }
            },
            [commands.paintCurveRepeatA](event, left, right) {
                if(curves.curves[curves.currentCurveName].isRepeat){
                     if (right) {
                        curves.curves[curves.currentCurveName].repeat();
                        API.editCurveRepeat = false;
                        API.activeCurvePower =  curves.curves[curves.currentCurveName].power;
                    } else {
                        if (API.editCurveRepeat) {
                            API.editCurveRepeat = false;
                            API.activeCurvePower =  curves.curves[curves.currentCurveName].power;
                        } else {
                            API.editCurveRepeat = true;
                            API.activeCurvePower =  curves.curves[curves.currentCurveName].repeats;
                        }
                    }
                } else {
                    curves.curves[curves.currentCurveName].repeat();
                    if (left) {
                        API.editCurveRepeat = true;
                        API.activeCurvePower =  curves.curves[curves.currentCurveName].repeats;
                    }
                }
                API.updateCurveUI();
                API.commands.updateCurves = true;
            },
            [commands.paintCurveMixSource]() {
                if (API.currentCurveMixed) {
                    curves.selectEditMixCurveA(curves.currentCurveObj.editSecond);
                    API.updateCurveUI();
                } else { log.info("Curve not in mix mode!") }
            },
            [commands.paintCurveMultiplyA]() {
                var idx = (curves.curveMixTypes.indexOf(API.currentCurveMixName)) % curves.curveMixTypes.length;
                API.currentCurveMixName = curves.curveMixTypes[idx];

                API.currentCurveMixed = idx !== 0;
                curves.selectMix(API.currentCurveMixName);
                API.updateCurveUI(true);
                API.commands.updateCurves = true;
            },
            [commands.paintCurveDisplayA](event, left, right) {
				if (right) { curves.curves[curves.currentCurveName].curveSet = "" }
				else { curves.curves[curves.currentCurveName].invert() }
                API.commands.updateCurves = true;
            },
            [commands.paintCutBufferUpdate]() {
                API.commands.updateGuides = true;
                API.commands.updateCurves = true;
                
            }
        },
        command(commandId, commandState) {
            // to prevent copy or cutting from empty (prev cut) canvas and losing content.
            if (API.prevCMDWasToBuffer && (cuttingTools.hasDragged || (commandId !== commands.paintCut && commandId !== commands.paintCopy))) {
                API.prevCMDWasToBuffer = false;
                cuttingTools.hasDragged = false;
            }            
            var updateGuides = false;
            var updateCurves = false;
            var booleanStateProcessed = false;
            var doStateCommands = true;
			var stateCommandId = commandId;
            if (API.gradientMode > 0 && API.colorBlendTypes === 1) {
                if(commandId === commands.paintBrushSizeBlend || commandId == commands.paintFadeAlphaDist) {
                    doStateCommands = false;
                }
            }
            if (doStateCommands) {
                if ((mouse.oldButton & 4)!== 4){
                    if (booleanStateCommands.has(commandId)){
                        if (API.booleanState(commandId,commandState)) {
                            updateGuides = true;
                        } else {
                            commandId = commands.NULL_COMMAND;
                            commandState = undefined;
                        }
                        booleanStateProcessed = true;;
                    } else if (sliderStateCommands.has(commandId)){
                        if (API.sliderState(commandId,commandState)) {
                        } else {
                            commandId = commands.NULL_COMMAND;
                            commandState = undefined;
                        }
                    }
                }
            }


            const rightClicked = (mouse.oldButton & 4) === 4;
            if (API.commands[commandId]) {
                API.commands.updateGuides = updateGuides;
                API.commands.updateCurves = updateCurves;
                if (API.commands[commandId](event, (mouse.oldButton & 1) === 1, (mouse.oldButton & 4) === 4) === false) { return  }
                updateGuides = API.commands.updateGuides;
                updateCurves = API.commands.updateCurves;
                if(!updateCurves && !updateGuides) { return }
            }
			if (commandId >= commands.paintSpecialBrushMode && commandId <= commands.paintSpecialBrushModeEnd) {
                commandId = commands.paintBrissleB;  // this applys for paintSpray and paintPoints
			}

            if (commandId >= commands.paintColorMode1 && commandId <= commands.paintColorMode18) {
                if(API.drawType !== commands.paintBrissleB){
                    if((mouse.oldButton & 4)=== 4){
                        API.colorMode2 = commandId - commands.paintColorMode1;
                    }else{
                        API.colorMode = commandId - commands.paintColorMode1;
                    }
                } else if(API.drawType === commands.paintBrissleB){
                    API.colorMode2 = API.colorMode = commandId - commands.paintColorMode1;
                    API.brushOptionsC = API.colorMode % brushOptionsC.names.length;
                    log("API.brushOptionsC : " + API.brushOptionsC  + "'" + brushOptionsC.names[API.brushOptionsC ]+ "'");

                }
                updateGuides = true;
            }else if (commandId === commands.paintUseGridGuides || commandId === commands.paintUseGuidesXY || commandId === commands.paintUseGuidesXZ || commandId === commands.paintUseGuidesYZ) {
                updateGuides = true;
                if(commandId === commands.paintUseGridGuides){
                }else{
                    if((mouse.oldButton & 4)=== 4){
                        if(mouse.shift){
                            if(commandId === commands.paintUseGuidesXY) { guides.XGuideIndex += 1 }
                            else if(commandId === commands.paintUseGuidesXZ) { guides.YGuideIndex += 1 }
                            else if(commandId === commands.paintUseGuidesYZ) { guides.ZGuideIndex += 1 }
                            guides.updateGuideIndexed();
                        }else{
                            const bit = commandId -commands.paintUseGuidesXY;
                            if(guides.useOnly & (1<<bit)){
                                guides.useOnly -=  (1<<bit);
                            }else{
                                guides.useOnly |=  (1<<bit);
                            }
                        }
                    }
                }
            }else if(commandId >= commands.paintCurveSetBrushColor && commandId < commands.paintCurveSetMarker){
				const extrafunction = API.curveExtraFunction[commandId - commands.paintCurveSetBrushColor][0] > 1;
                if(API.currentCurve !== commandId || extrafunction){
					const curveChanged = API.currentCurve !== commandId;
                    API.currentCurve = commandId;
                    API.updateCurveUI(false, curveChanged);
                    updateCurves = true;
                };
            } else if(commandId >= commands.paintSpecialBrushShape && commandId <= commands.paintSpecialBrushShapeEnd) {
                API.brushOptionsB = commandId - commands.paintSpecialBrushShape;
                const groupName = buttonMap.get(commands.paintBrushOptionsB).quickSelect.groupName;
                const comBase = buttonMap.get(commands.paintBrushOptionsB).quickSelect.commandBase;
                buttons.groups.setRadio(groupName, comBase + API.brushOptionsB);
                updateGuides = true;
            } else if (commandId >= commands.paintCurveMixTypeNone && commandId <= commands.paintCurveMixType13){
                API.currentCurveMixName = curves.curveMixTypes[commandId - commands.paintCurveMixTypeNone];
                curves.selectMix(API.currentCurveMixName);
                API.updateCurveUI(true);
                updateCurves = true;

            } else if (commandId >= commands.paintCurveLineA && commandId <= commands.paintCurveWaveA) {
                if(API.currentCurveMixed){
                    if(curves.currentCurveObj.editSecond){
                        curves.selectSecond(curves.curveTypes[commandId - commands.paintCurveLineA]);
                    }else{
                        curves.select(curves.curveTypes[commandId - commands.paintCurveLineA]);
                    }
                }else{
                    curves.select(curves.curveTypes[commandId - commands.paintCurveLineA]);
                }
                API.updateCurveUI();
                updateCurves = true;
            } else if(commandId >= commands.paintDrawTypesStart && commandId < commands.paintDrawTypesEnd) {
                if(mouse.wheelSelect && API.drawType !== commandId) { return }
                var cuttingOff = false;
                if(cuttingTools.active){
                    if(commandId !== commands.paintCutter && commandId !== commands.paintMagicCutter){
                        pens.dropSelection()
                        cuttingTools.stop();
                        buttons.groups.setRadio(buttonMap.get(commands.paintCutter).group,-1);
                    }else{
                        if(API.drawType === commands.paintMagicCutter && commandId === API.drawType){
                            API.diagonalCut = !API.diagonalCut;
                        } else if(API.drawType === commandId){
                            cuttingTools.release();
                            sprites.restoreProcessed();
                            return;
                        }
                    }
                }
                if(commandId === commands.paintCutter || commandId === commands.paintMagicCutter){
                    var useSpr;
                    if(selection.length === 0){
                        sprites.each(spr => { if(spr.drawOn){ useSpr = spr} });
                    }else{
                        selection.each(spr => { if(spr.drawOn){ useSpr = spr} });
                        if (useSpr === undefined) {
                            sprites.each(spr => { if(spr.drawOn){ useSpr = spr} });
                        }
                    }
                    if(useSpr === undefined){
                        log.warn("Cutter could not locate a sprite to cut from.");
                        return;
                    }
                    buttons.groups.setRadio(buttonMap.get(commands.paintCircle).group, -1);
                    if(commandId === commands.paintMagicCutter && API.cuttngTool === commandId){
                        API.diagonalCut = !API.diagonalCut;
                    }
                    API.cuttingTool = commandId;
                    cuttingTools.active = true;
                    cuttingTools.sprite = useSpr;
                }
                if(stateObj === undefined){
                    stateObj = {stateId: stateCommandId};
                }

				if (API.drawType !== commands.paintBrissleB && commandId === commands.paintBrissleB) {
					if (API.perviouseBrissleState) { stateCommandId = API.perviouseBrissleState }
				}
				const stateId = stateObj.stateId;
                paintStates[stateObj.stateId - commands.paintDrawTypesStart] = API.state;
                var paintState = paintStates[stateCommandId - commands.paintDrawTypesStart];
                if(paintState === undefined){
                    stateObj = {stateId: stateCommandId};
                    paintStates[stateCommandId - commands.paintDrawTypesStart] = API.state;
                }
                if (commandId === commands.paintBrissleB) {
                    if (paintState) { commandId = paintState.drawType; log(commandIdToString(commandId)); }
					API.perviouseBrissleState = stateCommandId;
					API.brissleMode = buttonMap.get(commandId).spritesIdx;

                } else if (commandId === commands.paintCurve) {
                    if (API.drawType === commandId) {  API.fillMode = buttonMap.get(commandId).stepSprite(mouse.ctrl ? -1: 1) }
                    else { API.fillMode = buttonMap.get(commandId).spritesIdx };
                } else if (commandId === commands.paintRectangle || commandId === commands.paintCircle || commandId === commands.paintFloodFill){
                    if (API.drawType === commandId) {  API.fillMode = buttonMap.get(commandId).stepSprite(mouse.ctrl ? -1: 1) }
                    else { API.fillMode = buttonMap.get(commandId).spritesIdx };
                }


                buttons.groups.setRadio(buttonMap.get(commandId).group,commandId, true);
				if(commandId !== API.drawType || stateCommandId !== stateId){
                    API.pendingDrawTypeChange = commandId;
                    API.pendingDrawTypeState = paintState;
                } else {
                    updateGuides = true;
                }
            }
            if(API.pendingDrawTypeChange) {
                if(API.paintStateUpdateInProgress){
                    log.error("Paint state update in progress flag illegal during pending drawTypeChange");
                    log.warn("This should not be happening and may corrupt drawing state");
                }
				const drawTypeChanged = API.drawType !== API.pendingDrawTypeChange;
                API.drawType = API.pendingDrawTypeChange;
                API.pendingDrawTypeChange = undefined;
                drawTypeChanged && API.setDrawTypeUI();
                if(API.pendingDrawTypeState){
                    const paintState = API.pendingDrawTypeState;
                    API.pendingDrawTypeState = undefined;
                    setTimeout(() => { API.state = paintState },10);
                }else{
                    API.changed = true;
                    curves.forceDisplay();
                    API.updateUI();
                    if(editSprites.drawingModeOn){ pens.updateMode(); }
                }
                return;
            }
            if(!API.paintStateUpdateInProgress){
                API.changed = true;
                if (updateCurves) { curves.forceDisplay() }
                if (updateGuides) { API.updateUI() }
                if(editSprites.drawingModeOn){ pens.updateMode() }
            }
        },
        updateCurveUI(forceCurve = false, changeCurveSuper = true) {
            const curveName = curves.namedCurves[API.currentCurve - commands.paintCurveSetBrushColor];
			const extrafunctions = API.curveExtraFunction[API.currentCurve - commands.paintCurveSetBrushColor];


            if(forceCurve || curveName !== curves.currentCurveName){
                curves.displayCurve = curveName;
                API.currentCurveMixName = curves.currentCurveObj.mixType;
                API.currentCurveMixed = API.currentCurveMixName !== "none";


            }else{
                curves.selectMix(API.currentCurveMixName);
                curves.displayCurve = curveName;

            }
            const curveObj = curves.currentCurveObj;
            const curveObjB = curves.currentCurveObjB;

			curveObj.superPowers[curveObj.superIdx] = curveObj.power; // save existing state
			if(!changeCurveSuper) {
				extrafunctions[1] = curveObj.superIdx = (curveObj.superIdx + 1) % extrafunctions[0];
			} else {
				curveObj.superIdx = curveObj.superIdx;
			}
			if(extrafunctions[0] > 1) {
				const superIdx = curveObj.superIdx;

				log.info("Curve extra function selected. " +  extrafunctions[superIdx * 2 + 3]);
				const but = buttonMap.get(specialBrushInfoNames[specialBrushInfoNames.names[API.currentCurve - commands.paintCurveSetBrushColor]]);
				but.setHelp(extrafunctions[superIdx * 2 + 3]);
				but.setSprite(extrafunctions[superIdx * 2 + 2]);
			} else {
				curveObj.superIdx = 0;

			}
			buttons.groups.setRadio(buttonMap.get(API.currentCurve).group, API.currentCurve, extrafunctions[0] === 1);



            buttons.groups.setRadio("curveMixTypeGroup", curves.curveMixTypes.indexOf(API.currentCurveMixName) + commands.paintCurveMixTypeNone);

            var groupName = buttonMap.get(commands.paintCurveLineA).group;
            var curveTypeName = curveObj.editSecond?curveObjB.name:curveObj.baseName;
            const curveType = curveTypeCommands[curveObj.name];
            const curveTypeB = curveTypeCommands[curveObjB.name];
            const curveTypeA = curveTypeCommands[curveObj.baseName];
            var curveMixName = API.currentCurveMixName;
            var editChannel = !API.currentCurveMixed || !curveObj.editSecond ? "A" : "B"

            buttons.groups.clearGroup("curveGroupA");
            if(API.currentCurveMixed){
                if(curveObj.editSecond){
                    buttons.groups.setCheck("curveGroupA", curveTypeA, true, "radioOnDark");
                    buttons.groups.setCheck("curveGroupA", curveTypeB, true);
                    buttonMap.get(commands.paintCurveMixSource).setSprite(1);

                }else{
                    buttons.groups.setCheck("curveGroupA", curveTypeA, true);
                    buttons.groups.setCheck("curveGroupA", curveTypeB, true, "radioOnDark");
                    buttonMap.get(commands.paintCurveMixSource).setSprite(0);
                }
                buttons.groups.setRadio("curveUseMix", commands.paintCurveMultiplyA);
            }else{

                buttons.groups.setRadio("curveGroupA", curveType);
                buttons.groups.setRadio("curveUseMix", -1);
                buttonMap.get(commands.paintCurveMixSource).setSprite(0);
            }
            buttonMap.get(commands.paintCurveMultiplyA).setHelp(curveMixHelp[API.currentCurveMixName]);
            const isRep = curveObj.isRepeat;
            buttonMap.get(commands.paintCurveRepeatA).setSprite(isRep ? 1 : 0);
            if (!isRep && API.editCurveRepeat) { API.editCurveRepeat = false }
            buttons.groups.setRadio(buttonMap.get(commands.paintCurveRepeatA).group, API.editCurveRepeat ? commands.paintCurveRepeatA : -1);
            if (API.editCurveRepeat) {
                API.sliderState(commands.paintCurvePowA, curveObj.repeats);
            } else {
                API.sliderState(commands.paintCurvePowA, curveObj.power);
            }
            buttonMap.get(commands.paintCurvePowA).element.changeColor(curveObj.color);
        },
        updateBrushOptions(optionInfo, option){
            if(option === -1) { return }
            const name = optionInfo.names[option];
            if(optionInfo.info[name]){
                const info = optionInfo.info[name];
                const but = buttonMap.get(optionInfo.commandId);
                if(info.info){
                    if(Array.isArray(info.info)){
                        but.setHelp("Controls brush stroke behaviour\n"+info.info[1]);
                        but.setSprite(info.info[0]);
                    }else{
                        but.setHelp("Controls brush stroke behaviour\n"+info.info);
                        but.setSprite(option);
                    }
                }else{
                    but.setSprite(option);
                    but.setHelp("Controls brush stroke behaviour\n"+"No additional help avialable.");
                }


                for(const name of specialBrushInfoNames.names){
                    if(info[name]){
                        const but = buttonMap.get(specialBrushInfoNames[name])
                        if(Array.isArray(info[name])){
                            but.setHelp(info[name][1]);
                            but.setSprite(info[name][0]);
							if(info[name].length > 2) {
								const idx = specialBrushInfoNames.names.indexOf(name);
								API.curveExtraFunction[idx][0] = info[name].length / 2;
								API.curveExtraFunction[idx][1] = 0;
								let i = 0;
								while(i < info[name].length) {
									API.curveExtraFunction[idx][i+2] = info[name][i++];  // icon
									API.curveExtraFunction[idx][i+2] = info[name][i++];  // help
								}

							} else {
								const idx = specialBrushInfoNames.names.indexOf(name);
								API.curveExtraFunction[idx][0] = 1;
								API.curveExtraFunction[idx][1] = 0;
								API.curveExtraFunction[idx].length = 2;
							}
                        }else{
                            but.setHelp(info[name]);
                        }
                    }
                }
            }else {
                buttonMap.get(optionInfo.commandId).setSprite(option);
            }
        },
        updateColorModeUI() { // called from updateUI if colorModeUIUpdatePending true
			API.colorModeUIUpdatePending = false;
 			if(API.drawType === commands.paintSpray || API.drawType === commands.paintPoints) {
				if (API.useSpeed && API.palletFrom === commands.paintColImage && (API.recycleDestination || API.recycleColor)) {
					if(API.colorModeUISetIndex !== 2) {
						$doFor(commands.paintColorMode18 - commands.paintColorMode1 + 1, idx => {
							const but = buttonMap.get(commands.paintColorMode1 + idx);
							if (colorModes.secondNames[idx]) {
								but.enable();
								but.setSprite(1);
								but.setHelp(colorModes.secondNames[idx]);
							} else { but.disable(); but.setSprite(0) }
						});
						API.colorModeUISetIndex = 2;
					}
				} else {
					if(API.colorModeUISetIndex !== 1) {
						$doFor(commands.paintColorMode18 - commands.paintColorMode1 + 1, idx => {
							const but = buttonMap.get(commands.paintColorMode1 + idx);
							but.setSprite(0);
							if (colorModes.names[idx]) {
								but.enable();
								but.setHelp(colorModes.names[idx]);
							} else { but.disable() }
						});
						API.colorModeUISetIndex = 1;
					}
				}
			} else if(API.drawType === commands.paintBrissleB){
				if(API.colorModeUISetIndex !== 3) {
					$doFor(commands.paintColorMode18 - commands.paintColorMode1 + 1, idx => {
						const but = buttonMap.get(commands.paintColorMode1 + idx);
						but.setSprite(0);
						if (colorModes.names[idx]) {
							but.enable();
							but.setHelp(colorModes.names[idx]);
						} else { but.disable() }
					});
					API.colorModeUISetIndex = 3;
				}

			}
		},


		updateUI() {

            if(paint.randColor && paint.palletFrom === commands.paintColImage && colours.useHSLModel) {
                if(!settings.allow_HSL_Model){
                    issueCommand(commands.useHSLColorRange);
                    log.infoOnce("Optimisation. Random color must use RGB Model. Use setting 'allow_HSL_Model' to override");
                }
            }
            if(!cuttingTools.active){
                buttons.groups.setRadio(buttonMap.get(API.drawType).group,API.drawType,API.drawType === commands.paintCutter);
                buttons.groups.setRadio(buttonMap.get(commands.paintCutter).group,-1);
            }
            if(API.drawType === commands.paintMagicCutter){
                buttonMap.get(commands.paintMagicCutter).setSprite(API.diagonalCut ? 1 : 0);
            } else if(API.drawType === commands.paintSpray || API.drawType === commands.paintPoints) {


                if(API.useSpeed) { // AKA imageBrush in com paintSpray ad paintPoints

					buttonMap.get(commands.paintRandColor).setEnabled((!API.colorBlend && !API.randColor) || (API.randColor && !API.colorBlend));
					buttonMap.get(commands.paintColorBlend).setEnabled((!API.colorBlend && !API.randColor) || (!API.randColor && API.colorBlend));

					buttonMap.get(commands.paintCurveSetLineColor).setEnabled(API.randColor);
					buttonMap.get(commands.paintCurveSetBrushColor).setEnabled(API.colorBlend);
					buttonMap.get(commands.paintCurveSetBrushAlpha).setEnabled(API.sizeBlend);
                    buttonMap.get(commands.paintBrushSizeBlend).enable();


				} else {
					buttonMap.get(commands.paintRandColor).enable();
					buttonMap.get(commands.paintCurveSetLineColor).setEnabled(API.randColor);
                    buttonMap.get(commands.paintColorBlend).disable();
					buttonMap.get(commands.paintCurveSetBrushColor).disable();
                    buttonMap.get(commands.paintBrushSizeBlend).disable();
					buttonMap.get(commands.paintCurveSetBrushAlpha).disable();

				}
				if( API.drawType === commands.paintPoints) {

					buttonMap.get(commands.paintCurveSetLineWidth).setEnabled(API.useAlphaDist); // inCXT line width
					buttonMap.get(commands.paintCurveSetLineAlpha).setEnabled(API.useSizeDist); // inCXT line Alpha
					buttonMap.get(commands.paintLengthFade).setEnabled(API.useAlphaDist || API.useSizeDist);
					buttonMap.get(commands.paintWidthFade).setEnabled(API.useAlphaDist || API.useSizeDist);
				} else {
					buttonMap.get(commands.paintLengthFade).enable();
					buttonMap.get(commands.paintWidthFade).enable();
				}
				if(API.palletFrom === commands.paintColPallet) {
					buttonMap.get(commands.paintPalletPickupPower).disable();
					buttonMap.get(commands.paintPalletPickupRadius).disable();
				} else {
					buttonMap.get(commands.paintPalletPickupPower).setEnabled(API.recycleColor || API.recycleDestination);
					buttonMap.get(commands.paintPalletPickupRadius).setEnabled(API.recycleColor || API.recycleDestination);
				}



            } else if(API.drawType === commands.paintLine) {

                if (API.gradientMode === 3) {
                    buttonMap.get(commands.paintFadeAlphaDist).disable();
                } else {
                    buttonMap.get(commands.paintFadeAlphaDist).enable();
                }

            } else if(API.drawType === commands.paintCurve) {
				if(API.useSizeDist) {  // circular curves
					buttonMap.get(commands.paintCurveSetLineAlpha).setEnabled(API.useSpeed); // segment spacing curve
					buttonMap.get(commands.paintCurveSetSprayColor).disable(); // not used
				} else {   // bezier like curves

				    // not yet complete just showing curves to keep everything working
					buttonMap.get(commands.paintCurveSetLineAlpha).enable(); // segment spacing curve
					buttonMap.get(commands.paintCurveSetSprayColor).enable(); // not used


				}

			}
			if((API.drawType !== commands.paintSpray && API.drawType !== commands.paintPoints && API.gradientMode === 4) ||
                (API.drawType !== commands.paintLine && API.gradientMode === 3) ||
                (cuttingTools.active && cuttingTools.defined)) {
                buttonMap.get(commands.paintCutBufMirV).enable();
                buttonMap.get(commands.paintCutBufMirH).enable();
                buttonMap.get(commands.paintCutBufRotCW).enable();
                buttonMap.get(commands.paintCutBufRotCCW).enable();
                buttonMap.get(commands.paintCutBufUniform).enable();
                buttonMap.get(commands.paintCutBufWidth).enable();
                if(cutBuffer.isAnimated) {
                    buttonMap.get(commands.paintCutBufAnimPrev).enable();
                    buttonMap.get(commands.paintCutBufAnimNext).enable();

                }else {
                    buttonMap.get(commands.paintCutBufAnimPrev).disable();
                    buttonMap.get(commands.paintCutBufAnimNext).disable();
                }
            } else {
                buttonMap.get(commands.paintCutBufMirV).disable();
                buttonMap.get(commands.paintCutBufMirH).disable();
                buttonMap.get(commands.paintCutBufRotCW).disable();
                buttonMap.get(commands.paintCutBufRotCCW).disable();
                buttonMap.get(commands.paintCutBufAnimPrev).disable();
                buttonMap.get(commands.paintCutBufAnimNext).disable();
                buttonMap.get(commands.paintCutBufUniform).disable();
                buttonMap.get(commands.paintCutBufWidth).disable();
            }
            if(cuttingTools.active && cuttingTools.defined){
                buttons.groups.setRadio(buttonMap.get(API.drawType).group,API.cuttingTool,API.drawType === commands.paintCutter);
                buttonMap.get(commands.paintCut).enable();
                buttonMap.get(commands.paintCopy).enable();

            }else{
                buttonMap.get(commands.paintCut).disable();
                buttonMap.get(commands.paintCopy).disable();

            }
            if(cutBuffer.hasContent || cuttingTools.defined){
                if(cutBuffer.hasContent){
                    buttonMap.get(commands.paintPaste).enable();
                }else{
                    buttonMap.get(commands.paintPaste).disable();
                }
                buttonMap.get(commands.paintSelectionOpts).enable();
            }else{
                buttonMap.get(commands.paintPaste).disable();
                buttonMap.get(commands.paintSelectionOpts).disable();
            }
            API.updateBrushOptions(brushOptionsA, API.brushOptionsA);
            API.updateBrushOptions(brushOptionsB, API.brushOptionsB);
            API.updateBrushOptions(brushOptionsC, API.brushOptionsC);
            API.updateBrushOptions(brushOptionsD, API.brushOptionsD);
			if (API.colorModeUIUpdatePending) { API.updateColorModeUI() }
            if(API.drawType === commands.paintBrissleB){
                buttons.groups.setRadio(buttonMap.get(commands.paintColorMode1).group,commands.paintColorMode1 + API.colorMode);
            }else{
                const colorModeGroup = buttonMap.get(commands.paintColorMode1).group;
                buttons.groups.clearGroup(colorModeGroup);
                buttons.groups.setCheck(colorModeGroup, commands.paintColorMode1 + API.colorMode, true, "radioOnLeft");
                buttons.groups.setCheck(colorModeGroup, commands.paintColorMode1 + API.colorMode2, true, "radioOnRight");
            }

            {
                const bt = buttonMap.get(commands.paintUseSnapGridGuides);
                buttons.groups.setRadio(bt.group, API.gridSnapType ? commands.paintUseSnapGridGuides : - 1);
                bt.setSprite(API.gridSnapType);
            }

            if(sprites.hasGuides === 0){
                spriteRender.showExtraGrid = false;
                buttons.groups.setRadio(buttonMap.get(commands.paintUseGridGuides).group,-1);

                disableGuidesUI(true);
                return;
            }
            API.canDrawCircle = true;
            if (API.gridGuidesSnap) {  }
            else if (API.gridGuides) { buttons.groups.setRadio(buttonMap.get(commands.paintUseGridGuides).group,commands.paintUseGridGuides) }
            else { buttons.groups.setRadio(buttonMap.get(commands.paintUseGridGuides).group,-1) }
            spriteRender.showExtraGrid = true;
            spriteRender.showGridAxies = 0;
            
            if((guides.availableAxies & 1)=== 1){
                buttonMap.get(commands.paintUseGuidesXY).enable();
                buttons.groups.setCheck(buttonMap.get(commands.paintUseGuidesXY).group,commands.paintUseGuidesXY, API.useGuideX);
                buttonMap.get(commands.paintUseGuidesXY).setSprite((guides.useOnly & 1) === 1 ? 1 : 0);
                guides.activateGrid("X",API.useGuideX);
                if (guides.guides[guides.XGuideIndex] && guides.guides[guides.XGuideIndex].type.vanish) {
                    API.canDrawCircle = false;
                    buttonMap.get(commands.paintToggleGuidSpaceLockX).enable();
                }else{
                    buttonMap.get(commands.paintToggleGuidSpaceLockX).disable();
                }

                if (guides.guides[guides.XGuideIndex] && guides.guides[guides.XGuideIndex].grid.spacing && guides.guides[guides.XGuideIndex].grid.spacing.on) {
                    buttons.groups.setCheck(buttonMap.get(commands.paintToggleGuidSpaceLockX).group,commands.paintToggleGuidSpaceLockX, true);
                } else {
                    buttons.groups.setCheck(buttonMap.get(commands.paintToggleGuidSpaceLockX).group,commands.paintToggleGuidSpaceLockX, false);
                }

            }else{
                buttons.groups.setCheck(buttonMap.get(commands.paintUseGuidesXY).group,commands.paintUseGuidesXY, false);
                buttonMap.get(commands.paintUseGuidesXY).disable();
                buttonMap.get(commands.paintToggleGuidSpaceLockX).disable();
            }
            if((guides.availableAxies & 2)=== 2){
                buttonMap.get(commands.paintUseGuidesXZ).enable();
                buttons.groups.setCheck(buttonMap.get(commands.paintUseGuidesXZ).group,commands.paintUseGuidesXZ, API.useGuideY);
                buttonMap.get(commands.paintUseGuidesXZ).setSprite((guides.useOnly & 2) === 2 ? 1 : 0);
                guides.activateGrid("Y",API.useGuideY);
                if (guides.guides[guides.YGuideIndex] && guides.guides[guides.YGuideIndex].type.vanish) {
                    API.canDrawCircle = false;
                    buttonMap.get(commands.paintToggleGuidSpaceLockY).enable();
                }else{
                    buttonMap.get(commands.paintToggleGuidSpaceLockY).disable();
                }
                if (guides.guides[guides.YGuideIndex] && guides.guides[guides.YGuideIndex].grid.spacing && guides.guides[guides.YGuideIndex].grid.spacing.on) {
                    buttons.groups.setCheck(buttonMap.get(commands.paintToggleGuidSpaceLockY).group,commands.paintToggleGuidSpaceLockY, true);
                } else {
                    buttons.groups.setCheck(buttonMap.get(commands.paintToggleGuidSpaceLockY).group,commands.paintToggleGuidSpaceLockY, false);
                }
            }else{
                buttons.groups.setCheck(buttonMap.get(commands.paintUseGuidesXZ).group,commands.paintUseGuidesXZ, false);
                buttonMap.get(commands.paintUseGuidesXZ).disable();
                buttonMap.get(commands.paintToggleGuidSpaceLockY).disable();
            }
            if((guides.availableAxies & 4)=== 4){
                buttonMap.get(commands.paintUseGuidesYZ).enable();
                buttons.groups.setCheck(buttonMap.get(commands.paintUseGuidesYZ).group,commands.paintUseGuidesYZ, API.useGuideZ);
                buttonMap.get(commands.paintUseGuidesYZ).setSprite((guides.useOnly & 4) === 4 ? 1 : 0);
                guides.activateGrid("Z",API.useGuideZ);
                if (guides.guides[guides.ZGuideIndex] && guides.guides[guides.ZGuideIndex].type.vanish) {
                    API.canDrawCircle = false;
                    buttonMap.get(commands.paintToggleGuidSpaceLockZ).enable();
                }else{
                    buttonMap.get(commands.paintToggleGuidSpaceLockZ).disable();
                }
                if (guides.guides[guides.ZGuideIndex] && guides.guides[guides.ZGuideIndex].grid.spacing && guides.guides[guides.ZGuideIndex].grid.spacing.on) {
                    buttons.groups.setCheck(buttonMap.get(commands.paintToggleGuidSpaceLockZ).group,commands.paintToggleGuidSpaceLockZ, true);
                } else {
                    buttons.groups.setCheck(buttonMap.get(commands.paintToggleGuidSpaceLockZ).group,commands.paintToggleGuidSpaceLockZ, false);
                }
            }else{
                buttons.groups.setCheck(buttonMap.get(commands.paintUseGuidesYZ).group,commands.paintUseGuidesYZ, false);
                buttonMap.get(commands.paintUseGuidesYZ).disable();
                buttonMap.get(commands.paintToggleGuidSpaceLockZ).disable();
            }
            
            
            if(!media.videoCapture) {
                buttonMap.get(commands.paintRecordPaintingToggle).enable();
                buttons.groups.setCheck(buttonMap.get(commands.paintRecordPaintingToggle).group,commands.paintRecordPaintingToggle, API.recording);
            } else {
                buttonMap.get(commands.paintRecordPaintingToggle).disable();
            }
        },
        drawTypeCommands: {
            [commands.paintCutter]() {
                const T = true, F = false;
                API.setupPenUI(F,[
                        T,F,T,F, // clear, palletsource, antalias, pointMode
                        F,F,F,F,F,F,F,
                        [0,"Use blur FX when painting.\nRight click to get blur setting dialog\nWARNING can slow response."], // blur
                        [0,"Use shadow FX when painting.\nAdd drop shadow to each drawn element\nRight click to get shadow setting dialog\nWaning can slow respose on low end devices"], // shadow
                        F,F,F,F,F,F,F,F,F,F,F,F,F
                    ],[
                        F,F,F,F,F,F,F,F
                    ]
                );
            },
            [commands.paintMagicCutter]() {
                const T = true, F = false;
                API.setupPenUI(F,[
                        T,F,T,F, // clear, palletsource, antalias, pointMode
                        F,F,F,F,F,F,F,
                        [0,"Use blur FX when painting.\nRight click to get blur setting dialog\nWARNING can slow response."], // blur
                        [0,"Use shadow FX when painting.\nAdd drop shadow to each drawn element\nRight click to get shadow setting dialog\nWaning can slow respose on low end devices"], // shadow
                        F,F,F,F,F,F,F,F,F,F,F,F,F
                    ],[
                        "Tollerance of magic select",
                        F,F,F,F,F,F,F
                    ]
                );
            },
            [commands.paintCircle]() { API.drawTypeCommands[commands.paintRectangle]() },
            [commands.paintRectangle]() {
                const T = true, F = false;
                curves.curves.spraySize.curvset = "cycle";
                API.setupPenUI(true,[
                        T,T,T,F, // clear, palletsource, antalias, pointMode
                        [8,"Click to cycle gradient fill modes\nRight click cycles backwards"],
                        [24,"Set to turn off color curve on gradient",0],
                        [23,"Set to use alpha curve on gradient",1],
                        F,F,F,F,T,T,
                        [24,"Curve used for color gradient"], // Curve brush colour
                        [23,"Curve used for Alpha gradient"], // Curve brush alpha
                        F,F,F,F,F,F,F ,F,F,F,F
                    ],[ "Start line width, or width from, if line width checked",F,F,F,F,F,F,F  ]
                );
            },
            [commands.paintFloodFill]() {
                const T = true, F = false;
                curves.curves.spraySize.curvset = "cycle";
                API.setupPenUI(true,[
                        T,T,T,F, // clear, palletsource, antalias, pointMode
                        [8,"Click to cycle gradient fill modes\nRight click cycles backwards"],
                        [24,"Set to turn off color curve on gradient",0],
                        [23,"Set to use alpha curve on gradient",1],
                        F,F,F,F,T,T,
                        [24,"Curve used for color gradient"], // Curve brush colour
                        [23,"Curve used for Alpha gradient"], // Curve brush alpha
                         F,F,F,F,F,F,F, F,F,F,F
                    ],["Tollerance of fill", F,F,F,F,F,F,F]
                );
            },
            [commands.paintBrissleB]() {
                const T = true, F = false;
                buttonMap.get(commands.paintBrushOptionsA).quickSelect = buttonMap.get(commands.paintBrushOptionsA).quickSelectExtra.specialBrush;
                buttonMap.get(commands.paintBrushOptionsB).quickSelect = buttonMap.get(commands.paintBrushOptionsB).quickSelectExtra.specialBrush;
                brushOptionsA.names = specialBrushes.options.stepTypes;
                brushOptionsA.info = specialBrushes.stepInfo;
                brushOptionsB.names = specialBrushes.options.shapeTypes;
                brushOptionsB.info = specialBrushes.shapeInfo;
                brushOptionsC.names = specialBrushes.options.colorTypes;
                brushOptionsC.info = specialBrushes.stepColorInfo;
                colorModes.names = specialBrushes.options.colorTypes;
                brushOptionsC.names.forEach((name,idx) => {
                    const but = buttonMap.get(commands.paintColorMode1 + idx);
                    if(but) {
                        but.enable();
                        but.setHelp(name) ;
                    }
                });
                API.setupPenUI(true,[
                        T,T,T,F, // clear, palletsource, antalias, pointMode
                        [19,"Set to use color curve on brush point",0],
                        [23,"Set to use alpha curve on brush point",1],
                        [25,"Set to use colour over stroke"],
                        [31,"Uses arcs to draw brush contact\nOnly for anti aliased brushes"],
                        [21,"Set to use random colors from current color range\nUses the color curve",3],
                        [0,"Set to use mouse direction"],
                        [33,"Set to use mouse speed"],
                        [0,"Use blur FX when painting.\nRight click to get blur setting dialog\nWARNING can slow response."], // blur
                        [0,"Use shadow FX when painting.\nAdd drop shadow to each drawn element\nRight click to get shadow setting dialog\nWaning can slow respose on low end devices"], // shadow
                        [24,"?"],
                        [23,""],
                        [25,"Color blend over stroke distance curve"],
                        [26,"Size blend over stroke distance curve"],
                        [10,"Distance point load falloff curve"],
                        [19,"Curve modifies point distance to point colour"],
                        [20,"Curve modifies point distance to point size"],
                        [28,"Curve modifies point distance to new point dist"],
                        [18,"Curve modifies point distance to point alpha"],
                        [12,"Cycle point move function"],
                        [12,"Cycle brush shape function"],
                        [12,"Cycle brush color function"],
                        F
                    ],[
                        "Brush size, or size from if brush size checked",
                        "To brush size if brush size checked",
                        "If below is zero then Flow rate set per pixel traveled\n10 means one point every 10 pixels,",
                        "Flow rate per frame\nIf zero then uses above slider as distance flow rate\nIf both zero flow rate is automatic",
                        "Brush point count",
                        "Brush point area",
                        "?",
                        "?"
                    ]
                );
            },
            [commands.paintSpray]() {
                const T = true, F = false;
                buttonMap.get(commands.paintBrushOptionsA).quickSelect = buttonMap.get(commands.paintBrushOptionsA).quickSelectExtra.sprayBrush;
                buttonMap.get(commands.paintBrushOptionsB).quickSelect = buttonMap.get(commands.paintBrushOptionsB).quickSelectExtra.pointBrush;
                brushOptionsA.names = pens.options.pointTypes;
                brushOptionsA.info = pens.options.pointInfo;
                brushOptionsB.names = pens.options.walkTypes;
                brushOptionsB.info = pens.options.walkInfo;
                colorModes.names = pens.options.colorModes;
				colorModes.secondNames = pens.options.imageRecycle;
                API.setupPenUI(true,[
                        T,T,T,F, // clear, palletsource, antalias, pointMode
                        [24,"Set to use color curve on brush point",0, false],  // disabled by default as its dependent on image brush
                        [23,"Set to use alpha curve on brush point",1, false],
                        [18,"Use curve to transform distance to alpha value",8],
                        [20,"Use curve to transform distance to point size value",6],
                        [21,"Set to use random colors from current color range\nUses the color curve",3],
                        [0,"Use stroke direction"],
                        [1,"Use masked image brush"],
                        [0,"Use blur FX when painting.\nRight click to get blur setting dialog\nWARNING can slow response."], // blur
                        [0,"Use shadow FX when painting.\nAdd drop shadow to each drawn element\nRight click to get shadow setting dialog\nWaning can slow respose on low end devices"], // shadow
                        [24,"Use to set the brush color curve"], // Curve brush colour
                        [23,"Use to set the brush alpha curve"],
                        [21,"Curve use to select or pickup random colors"],
                        [26,"Curve to control brush size"],
                        [26,"Curve to control point shape"],
                        [19,"Spray distance to color curve\nPoint distance from centert is converted\ncolor selection by this curve"],
                        [20,"Spray distance to size curve\nPoint distance from center is converted\nto brush size by this curve"],
                        [28,"Spray distance to actual distance curve\nPoint distance from center is converted\nto actual distance by this curve\nDoes not effect other distance based curves"],
                        [18,"Spray distance to alpha curve\nPoint distance from cente is converted\nto alpha value by this curve"],
                        [12,"Cycle point shape function"],
                        [12,"Cycle point shape walk type"],
                        F,F
                    ],[
                        "Brush size, or size from if brush size checked",
                        "To brush size if brush size checked",
                        "If below is zero then Flow rate set per pixel traveled\n10 means one point every 10 pixels,",
                        "Flow rate per frame\nIf zero then uses above slider as distance flow rate\nIf both zero flow rate is automatic",
                        "Controls line sizes in some options",
                        "Outer spray diameter",
                        "When colour from pallet is in recycle mode this\ncontrols the rate of coulr pickup",
                        "When random color and color source is image this sets the colour pickup area"
                    ]
                );
            },
            [commands.paintPoints]() {
                const T = true, F = false;
                buttonMap.get(commands.paintBrushOptionsA).quickSelect = buttonMap.get(commands.paintBrushOptionsA).quickSelectExtra.pointBrush;
                buttonMap.get(commands.paintBrushOptionsB).quickSelect = buttonMap.get(commands.paintBrushOptionsB).quickSelectExtra.pointBrush;
                brushOptionsA.names = pens.options.pointTypes;
                brushOptionsA.info = pens.options.pointInfo;
                brushOptionsB.names = pens.options.walkTypes;
                brushOptionsB.info = pens.options.walkInfo;
                colorModes.names = pens.options.colorModes;
				colorModes.secondNames = pens.options.imageRecycle;
                API.setupPenUI(true,[
                        T,T,T,F, // clear, palletsource, antalias, pointMode
                        [24,"Set to use color curve on brush point",0, false],  // disabled by default as its dependent on image brush
                        [23,"Set to use alpha curve on brush point",1, false],
                        [26,"Use the size curve over stroke length",3],
                        [22,"Use the alpha curve over stroke length",3],
                        [21,"Set to use random colors from current color range\nUses the color curve",2],
                        [0,"Use stroke direction"],
                        [1,"Use masked image brush"],

                        T,T,
                        [24,"Use to set the brush color curve"], // Curve brush colour
                        [23,"Use to set the brush alpha curve"],
                        [21,"Curve use to select or pickup random colors"],
                        [26,"Curve to control brush size"],
                        [22,"Curve to control brush alpha"],
                        F,F,F,F,
                        [12,"Cycle point shape function"],
                        [12,"Cycle point shape walk type"],
                        F,F
                    ],[
                        "Brush size, or size from if brush size checked",
                        "To brush size if brush size checked",
                        "Flow distance between points if next slider is zero",
                        "Flow rate per frame, if zero then uses above slider to use distance\nIf both zero flow rate is automatic",
                        "Controls line sizes in some options",
                        "Amount to bend when brush is smearing",
                        "When colour from pallet is in recycle mode this\ncontrols the rate of coulr pickup",
                        "When random color and color source is image this sets the colour pickup area"
                    ]
                );
                curves.curves.spraySize.curvset = "cycle";
            },
            [commands.paintCurve]() {
                const T = true, F = false;
                API.setupPenUI(true,[
                        T,T,T,T, // clear, palletsource, antalias, pointMode
                        F,
                        [26,"Set to use line width curves",1],
                        [16,"Turns on addaptive segmentation"],
                        [15,"Use circlared curve"], // paintSizeDist
                        [21,"Set to use random colors from current color range\nUses the color curve",2],
                        [17,"Combine smooth and circlared"], // direction
                        [14,"Use segement spacing curve",4], // speed
                        T, T,
                        [84,"Repeated width curve"], // Curve brush colour
                        [83,"Multiplies second width curve"],
                        F,//[26,"Curve for line width. This is a compound curve and also uses the next curve"],
                        [26,"Second width curve"],
                        [14,"Segment spacing curve"],
                        [13,"Sets the tension curve"],
                        [13,"Interpolation curve"],
                        F, F, F,F,F,F
                    ],[
                        "Brush size, or size from if brush size checked",
                        "To brush size if brush size checked",
                        "Controls max curve tension",
                        "Set the segment count, or if using addaptive segmentation controls length of segment",
                        "Sets the minimin segmenation distance when using addaptive segmentation",
                        "Sets threshold distance of curve simplification",
                        "When colour from pallet is in recycle mode this\ncontrols the rate of coulr pickup",
                        "When random color and color source is image this sets the colour pickup area"
                    ]
                );
                curves.curves.spraySize.curvset = "cycle";
            },
            [commands.paintLine]() {
                const T = true, F = false;
                curves.curves.spraySize.curvset = "cycle";
                API.setupPenUI(true,[
                        T,T,T,T, // clear, palletsource, antalias, pointMode
                        [25,"Click to cycle gradient fill modes",2],
                        [26,"Set to use line width curve along line length",3],
                        [22,"Set to use line alpha curve anlong line length",4],
                        T,
                        [21,"Set to use random colors from current color range\nUses the color curve",1],
                        F,F,T,T,F,
                        [21,"Set the line random color curve"],
                        [25,"Set the line color curve"],
                        [26,"Set the line width curve"],
                        [22,"Set the line alpha curve"],
                        F,F,F,F, F,F,F,F
                    ],[
                        "Start line width, or width from if line width checked",
                        "End line width if line width checked",
                        F,F,F,F,F,F
                    ]
                );
            },
        },
        setDrawTypeUI(){
            const dt = API.drawType;
            colorModes.names = [];
            const T = true, F = false;
			API.colorModeUIUpdatePending = true;
			API.colorModeUISetIndex = 0;
            if (API.drawTypeCommands[dt]) {
                API.drawTypeCommands[dt]();
            } else {
                API.setupPenUI(F,[ T,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F ],[F,F,F,F,F,F,F,F]);
            }
        },
        set stateObject(obj) { stateObj = obj ? obj : {} },
        set state(obj){
            API.paintStateUpdateInProgress = true;
            const oldButton = mouse.oldButton;
            mouse.oldButton = 1;
            API.drawType = obj.drawType;

            if(API.drawType === commands.paintRectangle || API.drawType === commands.paintCircle || API.drawType === commands.paintFloodFill || API.drawType === commands.paintCurve){
                API.colorBlendTypes = 1;
            } else if(API.drawType === commands.paintLine) { API.colorBlendTypes = 0 }
            else { API.colorBlendTypes = 0 }
			buttons.overrideDisabled = true;
            curves.curves.brushColor.setCurveState( obj.curveStateBrushColor );
            curves.curves.brushAlpha.setCurveState( obj.curveStateBrushAlpha );
            curves.curves.lineColor.setCurveState(  obj.curveStateLineColor  );
            curves.curves.lineWidth.setCurveState(  obj.curveStateLineWidth  );
            curves.curves.lineAlpha.setCurveState(  obj.curveStateLineAlpha  );
            curves.curves.sprayColor.setCurveState( obj.curveStateSprayColor );
            curves.curves.spraySize.setCurveState(  obj.curveStateSpraySize  );
            curves.curves.spraySpread.setCurveState(obj.curveStateSpraySpread);
            curves.curves.sprayAlpha.setCurveState( obj.curveStateSprayAlpha );
            API.command(commands.paintBrushMin, obj.brushMin);
            API.command(commands.paintBrushMax, obj.brushMax);;
            API.command(commands.paintCurveStep, obj.curveStep);
            API.command(commands.paintBrushStep, obj.brushStep);
            API.command(commands.paintLengthFade, obj.lengthFade);
            API.command(commands.paintWidthFade, obj.widthFade);
            API.command(commands.paintPalletPickupPower, obj.pickupPower);
            API.command(commands.paintPalletPickupRadius, obj.pickupRadius);
            API.command(commands.paintFilterB, obj.filterShadow);
            API.command(commands.paintFilterA, obj.filterBlur);
            API.command(commands.paintRandColor, obj.randColor);
            API.command(commands.paintAntiAlias, obj.antiAlias);
            API.command(commands.paintUseDirection, obj.useDirection);
            API.command(commands.paintColorBlend, obj.colorBlend);
            API.command(commands.paintBrushSizeBlend, obj.sizeBlend);  // must be under color blend
            API.command(commands.paintFadeAlphaDist, obj.useAlphaDist);// must be under color blend
            API.command(commands.paintPointMode, obj.pointMode);
            API.command(commands.paintUseSpeed, obj.useSpeed);
            API.command(commands.paintSizeDist, obj.useSizeDist);

            API.brushOptionsA = obj.brushOptionsA;
            API.brushOptionsB = obj.brushOptionsB;
            API.brushOptionsC = obj.brushOptionsC;
            API.brushOptionsD = obj.brushOptionsD;
            API.gradientMode = obj.gradientMode;
            API.diagonalCut = obj.diagonalCut;
            API.colorMode = obj.colorMode;
            API.colorMode2 = obj.colorMode2;
            API.palletFrom = obj.palletFrom;
            API.recycleColor = obj.recycleColor;
            API.recycleDestination = obj.recycleDestination;
            API.gridSnapType = obj.gridSnapType;

            API.gridCanSnap = API.gridSnapType === 1 || API.gridSnapType === 3;
            API.gridCanAdd = API.gridSnapType === 1 || API.gridSnapType === 2;

            palletFromSelectStates.findMatch();
            buttonMap.get(commands.paintColPallet).setSprite(palletFromSelectStates[palletFromSelectStates.current].sprite);

            if (API.colorBlendTypes === 0) {
                if (API.drawType === commands.paintLine) {
                    buttonMap.get(commands.paintColorBlend).setSprite(buttonLineGradientModeIconIndex[API.gradientMode]);
                }
            }else {
                buttonMap.get(commands.paintColorBlend).setSprite(buttonGradientModeIconIndex[API.gradientMode]);
            }
            if (obj.drawType === commands.paintCurve) { buttonMap.get(commands.paintCurve).spritesIdx = obj.fillMode }
            else if (obj.drawType === commands.paintRectangle) { buttonMap.get(commands.paintRectangle).spritesIdx = obj.fillMode }
            else if (obj.drawType === commands.paintCircle) { buttonMap.get(commands.paintCircle).spritesIdx = obj.fillMode }
            else if (obj.drawType === commands.paintBrissleB) {
				buttonMap.get(commands.paintBrissleB).spritesIdx = obj.brissleMode;
                const groupName = buttonMap.get(commands.paintBrushOptionsA).quickSelect.groupName;
                const comBase = buttonMap.get(commands.paintBrushOptionsA).quickSelect.commandBase;
                buttons.groups.setRadio(groupName, comBase + API.brushOptionsA);
			}
            API.brissleMode = obj.brissleMode;
			buttons.overrideDisabled = false;
            colours.setValue("alpha", obj.alpha * 255);
			buttons.overrideDisabled = true;
            colours.setValue("mainDrawMode", obj.mainDrawMode);
            colours.setValue("secondDrawMode", obj.secondDrawMode);
            if(obj.currentCurve > -1){
                API.currentCurve = obj.currentCurve;
                API.currentCurveMixed = obj.currentCurveMixed;
                API.currentCurveMixName = obj.currentCurveMixName;
                API.updateCurveUI();
            }
            stateObj = obj;
            paintStates[API.stateId - commands.paintDrawTypesStart]  = stateObj;
            mouse.oldButton = oldButton;
            API.paintStateUpdateInProgress = false;
            API.changed = true;
			buttons.overrideDisabled = false;
            curves.forceDisplay();
            API.updateUI();
            if (editSprites.drawingModeOn) { pens.updateMode() }
        },
        get state() {
            Object.assign(stateObj,{
                    pickupPower: API.pickupPower,
                    pickupRadius: API.pickupRadius,
                    brushMin: API.brushMin,
                    brushMax: API.brushMax,
                    brushStep: API.brushStep,
                    curveStep: API.curveStep,
                    lengthFade: API.lengthFade,
                    widthFade: API.widthFade,
                    filterShadow: API.filterShadow,
                    filterBlur: API.filterBlur,
                    randColor: API.randColor,
                    antiAlias: API.antiAlias,
                    sizeBlend: API.sizeBlend,
                    useDirection: API.useDirection,
                    useSpeed: API.useSpeed,
                    useAlphaDist: API.useAlphaDist,
                    useSizeDist: API.useSizeDist,
                    colorBlend: API.colorBlend,
                    gradientMode: API.gradientMode,
                    gridSnapType: API.gridSnapType,
                    palletFrom: API.palletFrom,
                    drawType: API.drawType,
                    fillMode: API.fillMode,
                    pointMode: API.pointMode,
                    brissleMode: API.brissleMode,
                    brushOptionsA: API.brushOptionsA,
                    brushOptionsB: API.brushOptionsB,
                    brushOptionsC: API.brushOptionsC,
                    brushOptionsD: API.brushOptionsD,
                    alpha: colours.alpha,
                    mainDrawMode: colours.mainDrawMode,
                    secondDrawMode: colours.secondDrawMode,
                    colorMode: API.colorMode,
                    colorMode2: API.colorMode2,
                    diagonalCut: API.diagonalCut,
                    recycleColor: API.recycleColor,
                    recycleDestination: API.recycleDestination,
                    currentCurve: API.currentCurve,
                    currentCurveMixed: API.currentCurveMixed,
                    currentCurveMixName: API.currentCurveMixName,
                    curveStateBrushColor: curves.curves.brushColor.getCurveState(stateObj.curveStateBrushColor),
                    curveStateBrushAlpha: curves.curves.brushAlpha.getCurveState(stateObj.curveStateBrushAlpha),
                    curveStateLineColor: curves.curves.lineColor.getCurveState(stateObj.curveStateLineColor),
                    curveStateLineWidth: curves.curves.lineWidth.getCurveState(stateObj.curveStateLineWidth),
                    curveStateLineAlpha: curves.curves.lineAlpha.getCurveState(stateObj.curveStateLineAlpha),
                    curveStateSpraySize: curves.curves.spraySize.getCurveState(stateObj.curveStateSpraySize),
                    curveStateSpraySpread: curves.curves.spraySpread.getCurveState(stateObj.curveStateSpraySpread),
                    curveStateSprayAlpha: curves.curves.sprayAlpha.getCurveState(stateObj.curveStateSprayAlpha),
                    curveStateSprayColor: curves.curves.sprayColor.getCurveState(stateObj.curveStateSprayColor),
                }
            );
            return stateObj;
        },
        loadNamedPenState(name){
            const state = brushPresets.getNamedBrush(name);
            if(state){
                paintStates[state.stateId - commands.paintDrawTypesStart]  = state;

            }else{
                log.warn("Pen '" + name +"' does not exist.");
            }
        },
        usedNamedPenState(name){

            const state = brushPresets.getNamedBrush(name);
            if(state){
                API.stateObject = state;
                API.state = state;
            }else{
                log.warn("Pen '" + name +"' does not exist.");
            }
        },
        copyPenState(){
            var temp = stateObj;
            stateObj = {};
            const stateCopy = API.state;
            stateObj = temp;
            stateCopy.palletFrom = commandIdToString(stateCopy.palletFrom);
            stateCopy.drawType = commandIdToString(stateCopy.drawType);
            stateCopy.currentCurve = commandIdToString(stateCopy.currentCurve);
            stateCopy.mainDrawMode = commandIdToString(stateCopy.mainDrawMode);
            stateCopy.secondDrawMode = commandIdToString(stateCopy.secondDrawMode);
            return stateCopy;
        },
        setupPenUI(useCurves, setup, sliders){
            /*
            Named command order from left to right from first button after alias
            paintColorBlend paintBrushSizeBlend  paintFadeAlphaDist paintPointMode paintSizeDist paintRandColor paintUseDirection paintUseSpeed paintFilterA paintFilterB
            Curve check box order top row then bottom
            paintCurveSetBrushColor paintCurveSetBrushAlpha paintCurveSetLineColor paintCurveSetLineWidth paintCurveSetLineAlpha
            paintCurveSetSprayColor paintCurveSetSpraySize paintCurveSetSpraySpreadpaintCurveSetSprayAlpha,
            paintBrushOptionsA,paintBrushOptionsB,paintBrushOptionsC,paintBrushOptionsD,
            Slide values on left from top to bottom. With Multy curve named paintCurvePowA, and not accessable
            paintBrushMin, paintBrushMax,  paintCurveStep, paintBrushStep, paintLengthFade, paintWidthFade,  paintPalletPickupPower, paintPalletPickupRadius,
            */
            var i;
            for(i = 0; i < curveCommands.length; i++){  // clear all curves linked to buttons via button.commandId
                API.curveLinkedCommand[i] = -1;
            }
            i = 0;
            var curveIndex;
            for(const but of setup){
                if(i >= 12 && i < 21) {
					curveIndex = i - 12;  // index of curve commands
					API.curveExtraFunction[curveIndex][0] = 1; /// num super powers
					API.curveExtraFunction[curveIndex][1] = 0; // current super power
					API.curveExtraFunction[curveIndex].length = 2;
				} else { curveIndex = undefined }

                const command = checkBoxCommands[i++];
                const button = buttonMap.get(command);
                if(but === true || (Array.isArray(but) && but[0] === true)) {
                    if(button.setSprite) { button.setSprite(9) } // this sets to blank. The default icon should not be used, set manualy
                    button.enable();
                    if(curveIndex !== undefined && API.curveLinkedCommand[curveIndex] === -1){
                        API.curveLinkedCommand[curveIndex] = -2; // flags curve as used
                    }
                }else if(but === false || (Array.isArray(but) && but[0] === false)) {
                    if(button.setSprite) { button.setSprite(9) }
                    button.disable();
                    if(Array.isArray(but) && typeof but[1] === "string"){ buttons.setHelp(but[1]) }
                    else { button.setHelp("") }
                }else if(Array.isArray(but)) {
                    but[3] === false ? button.disable() : button.enable();
                    if(button.setSprite) { button.setSprite(but[0]) }
                    if(but[1]) { button.setHelp(but[1]) }
					if(but[2]) { API.curveLinkedCommand[but[2]] = command }
                    else if(curveIndex !== undefined && API.curveLinkedCommand[curveIndex] === -1){
                        API.curveLinkedCommand[curveIndex] = -2; // flags curve as used
                    }

				} else {
                   if(curveIndex !== undefined && API.curveLinkedCommand[curveIndex] === -1){
                        API.curveLinkedCommand[curveIndex] = -2; // flags curve as used
                    }
                }
            }
            i = 0;
            for(const but of sliders){
                const button = buttonMap.get(sliderCommands[i++]);
                if(but === true || typeof but === "string") {
                    button.enable();
                    if(typeof but === "string"){ button.setHelp(but) }
                }else{
                    button.disable();
                    button.setHelp("");
                }
            }
			API.colorModeUIUpdatePending = true;
			API.colorModeUISetIndex = 0;

            if(useCurves){
                API.setButtonStatus([
                    commands.paintCurvePowA,
                    commands.paintCurveDisplayA,
                    commands.paintCurveLineA,
                    commands.paintCurveEaseA,
                    commands.paintCurveEase2A,
                    commands.paintCurveSigmoid,
                    commands.paintCurveRandomA,
                    commands.paintCurveBellA,
                    commands.paintCurveRandRampA,
                    commands.paintCurveWaveA
                ]);
            }else{
                API.setButtonStatus(undefined,[
                    commands.paintCurvePowA,
                    commands.paintCurveDisplayA,
                    commands.paintCurveLineA,
                    commands.paintCurveEaseA,
                    commands.paintCurveEase2A,
                    commands.paintCurveSigmoid,
                    commands.paintCurveRandomA,
                    commands.paintCurveBellA,
                    commands.paintCurveRandRampA,
                    commands.paintCurveWaveA
                ]);
            }
        },
        setButtonStatus(enableList,disableList){
            if(disableList){
                for(const command of disableList){ buttonMap.get(command).disable() }
            }
            if(enableList){
                for(const command of enableList){ buttonMap.get(command).enable() }
            }
        },
        on() {
            curves.on();
            API.setButtonStatus(noPainting);
            guides.update();
        },
        off() {
            curves.off();
            API.setButtonStatus(null, noPainting);
        },
        setButtons(buttons){
            for(const but of buttons){
                buttonMap.set(but.command, but);
            }
            return buttons;
        },
        switchToNamedPenState(name){
            const state = brushPresets.getNamedBrush(name);
            if(state){
                Object.assign(paintStates[state.drawType - commands.paintDrawTypesStart],state);
                if(state.drawType === API.drawType){
                    API.state = state;
                }else{
                    API.command(state.drawType);
                }
            }
        },
        updateBrushFoldName : {
            done : true,
            complete(text) {
                if(!this.done){
                    this.change(text)
                    if(userDefinedBrush.name) {
                        brushPresets.setNamedBrushUserText(userDefinedBrush.name,text);
                        brushPresets.setNamedBrushPath(userDefinedBrush.name,userDefinedBrush.path);
                        log.sys("User brush '"+userDefinedBrush.name+"' name set to '"+text+"'");
                    }else{
                        log.sys("User brush fold named '"+text+"'");
                    }
                    brushPresets.saveToLocal();
                    this.done = true;
                }
            },
            change(text) {
                if(!this.done){
                    userDefinedBrush.item.item.name = text;
                    if (userDefinedBrush.fold.owner) { userDefinedBrush.fold.owner.update() }
                    else { userDefinedBrush.fold.update() }
                }
            },
        },
        get extras(){
            function removeBrush() {
                if(currentSelectedItem) {
                    extrasList.removeItem(currentSelectedItem);
                    brushPresets.removeNamedUserBrush(currentSelectedItem.item.objName);
                    brushPresets.saveToLocal();
                    log.sys("Remove brush "+currentSelectedItem.item.name);
                    currentSelectedItem = undefined;
                }
            }
            function removeFold() {
                log.sys("Remove fold goes here");
            }
            function addBrush(fold) {
                if(editSprites.drawingModeOn) {
                    const penState = API.copyPenState();
                    log.info("Enter a name for this brush?");
                    log.info("Hit enter when done");
                    const brushName = "brush"+getGUID();
                    this.addFoldObject({[brushName] : {
                        help : "User generated brush",
                        call(){
                            log.info("Loading brush '" + brushName + "'");
                            API.switchToNamedPenState(brushName);
                        },
                    }});
                    setTimeout(()=>{
                            brushPresets.setNamedBrush(brushName,penState);
                            API.updateBrushFoldName.complete(commandLine());
                            API.updateBrushFoldName.done = false;
                            userDefinedBrush.fold = this;
                            userDefinedBrush.item = this.getItemByName(brushName);
                            userDefinedBrush.name = brushName;
                            const path = extrasList.getItemPathByName(brushName).reverse();
                            path.shift();
                            if(path.length > 0){
                                userDefinedBrush.path = path.join(".");
                            }else{
                                userDefinedBrush.path = undefined;
                            }

                            this.update();
                            this.toggle();
                            this.toggle();
                            commandLine(API.updateBrushFoldName);
                            commandLine(brushName,false,true,true);
                        },1
                    );
                } else {
                    log.warn("You need to be in paint mode to save a brush.");
                }
            }
            function addFold(fold){
                log.info("Enter the new fold name");
                log.info("Hit enter when done");
                const foldName = "fold"+getGUID();
                setTimeout(()=>{
                        API.updateBrushFoldName.complete(commandLine());
                        API.updateBrushFoldName.done = false;
                        userDefinedBrush.name = undefined;
                        userDefinedBrush.item = userDefinedBrush.fold = this.addFoldObject({[foldName] : {foldInfo}});
                        this.update();
                        this.toggle();
                        this.toggle();
                        commandLine(API.updateBrushFoldName);
                        commandLine(foldName,false,true,true);
                    },1
                );
            }
            const foldInfo = {
				help: "A place to organize and store brushes created while painting",
				foldClass: "extrasPainting",
                onOpenFold(fold) {
                    if(currentSelectedItem){
                        currentSelectedItem.element.classList.remove("foldPaintingItemSelected");
                        currentSelectedItem = undefined;
                        extrasList.setupOptionsButton(3,"?","");
                    }
                    if(fold.owner){

                        if(currentSelectedFold){
                            currentSelectedFold.element.classList.remove("foldPaintingFoldActive");
                        }
                        fold.element.classList.add("foldPaintingFoldActive");
                        currentSelectedFold = fold
                        extrasList.setupOptionsButton(3,"Del fold","Delete selected open fold and its content.",removeFold);
                    }
                    extrasList.setupOptionsButton(1,"Add Fold","Adds a brush fold.",addFold.bind(fold));
                    extrasList.setupOptionsButton(2,"Add Brush","Adds current brush to fold.",addBrush.bind(fold));


                },
            }

            const extras = {
                foldInfo,

            };
            var currentSelectedFold;
            var currentSelectedItem;
            brushPresets.loadFromLocal();
            for(const name of Object.keys(brushPresets.customBrushes)){
                const brush = brushPresets.customBrushes[name];
                const entry = {
                    help : "User generated brush",
                    name : brushPresets.customBrushes[name].userName,
                    call(){
                        log.info("Loading brush '" + name + "'");
                        const item = this.items.find(item => item.item.objName === name);
                        item.element.classList.add("foldPaintingItemSelected");
                        if(currentSelectedItem){
                            currentSelectedItem.element.classList.remove("foldPaintingItemSelected");
                        }
                        currentSelectedItem = item;
                        extrasList.setupOptionsButton(3,"Del brush","Delete selected brush.",removeBrush);
                        API.switchToNamedPenState(name);
                    },
                };
                if(brush.path){
                    const path = brush.path.split(".");

                    var obj = extras;
                    while(path.length){
                        const foldName = path.shift();
                        if(obj[foldName] === undefined){
                            obj[foldName] = { foldInfo };
                        }
                        obj = obj[foldName];
                    }
                    obj[name] = entry;


                }else{
                    extras[name] = entry;
                }

            }
            return extras;
        }
    };
    return API;
})()