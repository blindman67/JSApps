const defaultCurvePreset = {curveSet: "norm", inverted: 0, name: "ease", power: 50, repeat: 0, repeats: 2, mixType:"none", get superPowers() {return [50,50,50,50,50,50] }};
const brushPresets = {
    curveNames : "curveStateBrushColor,curveStateBrushAlpha,curveStateLineColor,curveStateLineWidth,curveStateLineAlpha,curveStateSpraySize,curveStateSpraySpread,curveStateSprayAlpha,curveStateSprayColor".split(","),
    commandNames :  "palletFrom,drawType,stateId,mainDrawMode,secondDrawMode,currentCurve".split(","),
    customBrushes : {},
    defaults : {
        pickupPower: 50,
        pickupRadius: 50,
        brushMin: 1,
        brushMax: 1,
        brushStep: 0,
        curveStep: 0,
        lengthFade: 1,
        widthFade: 1,
        filterShadow: false,
        filterBlur: false,
        randColor: false,
        antiAlias: false,
        sizeBlend: false,
        useDirection: false,
        useSpeed: false,
        useAlphaDist: false,
        useSizeDist: false,
        colorBlend: false,
        gradientMode: 0,
        palletFrom: "paintColPallet",
        drawType: "paintCurve",
		stateId: undefined,
        fillMode: 0,
        pointMode : false,
        brissleMode: 0,
        gridSnapType: 0,
        alpha: 1,
        brushOptionsA : -1,
        brushOptionsB : -1,
        brushOptionsC : -1,
        brushOptionsD : -1,
        mainDrawMode: "drawModeOver",
        secondDrawMode: "drawModeEraseB",
        recycleColor: false,
        recycleDestination: false,
        currentCurve: "paintCurveSetBrushColor",
        currentCurveMixed : false,
        currentCurveMixName : "none",
        diagonalCut : false,
        colorMode : 0,
        colorMode2 : 0,
        curveStateBrushColor: defaultCurvePreset,
        curveStateBrushColor_B: defaultCurvePreset,
        curveStateBrushAlpha: defaultCurvePreset,
        curveStateBrushAlpha_B: defaultCurvePreset,
        curveStateLineColor: defaultCurvePreset,
        curveStateLineColor_B: defaultCurvePreset,
        curveStateLineWidth: defaultCurvePreset,
        curveStateLineWidth_B: defaultCurvePreset,
        curveStateLineAlpha: defaultCurvePreset,
        curveStateLineAlpha_B: defaultCurvePreset,
        curveStateSprayColor: defaultCurvePreset,
        curveStateSprayColor_B: defaultCurvePreset,
        curveStateSpraySize: defaultCurvePreset,
        curveStateSpraySize_B: defaultCurvePreset,
        curveStateSpraySpread: defaultCurvePreset,
        curveStateSpraySpread_B: defaultCurvePreset,
        curveStateSprayAlpha: defaultCurvePreset,
        curveStateSprayAlpha_B: defaultCurvePreset,
    },
    getNamedBrush(name){
        var named = brushPresets[name];
        if(named === undefined) {
            named = brushPresets.customBrushes[name];
            if(named === undefined) {return }
        }
        const brush = {...brushPresets.defaults, ...named};
        for(const name of brushPresets.curveNames){
            if(named[name]){
                brush[name] = { ...brushPresets.defaults[name],...named[name] };
            }else{
                brush[name] = { ...brushPresets.defaults[name] };
            }
        }
		if(brush.stateId === undefined) {
			brush.stateId = brush.drawType;
			if(brush.stateId === undefined) {
				log.warn("Brush preset error. Missing 'drawType' name!!");
				log.warn("Some brushes may not be avialible.");
			}
		}
        for(const cName of brushPresets.commandNames){
            brush[cName] = commands[brush[cName]];
        }
        return brush;
    },
    saveToLocal(){
        localStorage.painterV3_customBrushes =JSON.stringify(brushPresets.customBrushes);
    },
    loadFromLocal(){
        const compressed = localStorage.painterV3_customBrushes;
        if(compressed) {
            brushPresets.customBrushes = JSON.parse(compressed);
        }
    },
    removeNamedUserBrush(name){
        brushPresets.customBrushes[name] = undefined;
    },
    setNamedBrushUserText(name, text){
        brushPresets.customBrushes[name].userName = text;
    },
    setNamedBrushPath(name,path){
        brushPresets.customBrushes[name].path = path;
    },
    setNamedBrush(name, state){
        var add;
        const dState = {};
        for(const key of Object.keys(brushPresets.defaults)){
            if(brushPresets.curveNames.indexOf(key) > -1){
                const cState = {};
                const dCurve = brushPresets.defaults[key];
                const sCurve = state[key];
                add = false;
                for(const cKey of Object.keys(dCurve)) {
                    if(sCurve[cKey] !== dCurve[cKey]){
                        add = true;
                        cState[cKey] = sCurve[cKey];
                    }
                }
                if(add){
                    dState[key] = cState;
                }
            }else{
                if(state[key] !== brushPresets.defaults[key]){
                    dState[key] = state[key];
                }
            }
        }
        brushPresets.customBrushes[name] = dState;
    },
	hasNamedState(name) { return brushPresets.customBrushes[name] !== undefined },
    addPointTypes() {
        i = 18;
        for (const pt of pens.options.pointTypes) {
            brushPresets["FXB_" + i] = {
                drawType: "paintSpray",
                stateId: "paintSBM_" + i,
                brushOptionsA: 1 + (i-18),
                brushOptionsB: 1,
            };
            i++;
        }
        const startsAt = i;
        for (const pt of pens.options.pointTypes) {
            brushPresets["FXB_" + i] = {
                drawType: "paintPoints",
                stateId: "paintSBM_" + i,
                brushOptionsA: 1 + (i-startsAt),
                brushOptionsB: 1,
            };
            i++;
        }
    },
    circulared : {
        widthFade: 105,
        useSizeDist: true,
        drawType: "paintCurve",
        sizeBlend: true,
        curveStep : 30,
        pointMode : false,
        brushMin: 2,
        curveStateBrushColor: { ...defaultCurvePreset, name: "flat", curveSet: "norm", power: 50, inverted: 0 },
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "flat", curveSet: "norm", power: 50, inverted: 0 },
        curveStateLineWidth: { ...defaultCurvePreset, name: "easeBell", curveSet: "norm", power: 50, inverted: 0 },
    },
    Line : {
        drawType: "paintLine",
        brushMin: 2,
    },
    Circle : {
        drawType: "paintCircle",
    },
    Rectangle : {
        drawType: "paintRectangle",
    },
    FloodFill : {
        drawType: "paintFloodFill",
    },
    SmoothLines : {
        drawType: "paintCurve",
		widthFade: 100,
		curveStep: 30,
		pointMode: true,
		useSizeDist: true, // turn on circular interpolation
    },
    Spray : {
        drawType: "paintSpray",
        brushOptionsA : 0,
        brushOptionsB : 1,
    },
    Points : {
        drawType: "paintPoints",
        brushOptionsA : 0,
        brushOptionsB : 1,
    },
    SpecialFXBrushB : {
        drawType: "paintBrissleB",
        lengthFade: 12,  // hair count
        widthFade: 6,  // brush size
        brushOptionsA : 0,
        curveStateSpraySize: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 }, // All size of smalll
        curveStateSprayAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },  // All alpha = 1
    },
    FXB_Light : {
        drawType: "paintBrissleB",
		stateId: "paintSBM_1",
        lengthFade: 12,  // hair count
        widthFade: 6,  // brush size
		useDirection: true, // Brush rotate
        brushOptionsA : 0,
		brushOptionsB : 4,
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 6, inverted: 0, superPowers: [6, 0] },
        curveStateSpraySize: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateSprayAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },
    },
	FXB_Heavy : {
        drawType: "paintBrissleB",
		stateId: "paintSBM_2",
        lengthFade: 12,     // hair count
        widthFade: 6,       // brush size
		useDirection: true, // Brush rotate
        brushOptionsA : 1,
		brushOptionsB : 4,
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 4, inverted: 0, superPowers: [4, 0] },
        curveStateSpraySize: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateSprayAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },
    },
	FXB_Stickey : {
        drawType: "paintBrissleB",
		stateId: "paintSBM_3",
        lengthFade: 5,  // hair count
        widthFade: 44,  // brush size
		antiAlias: false,
		useSizeDist: true, // Fit circles only for antiAlias true
		useDirection: true, // Brush rotate
        brushOptionsA : 2,
        brushOptionsB : 4,
        curveStateBrushColor: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 50, inverted: 0 },
        curveStateSpraySize: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateLineAlpha: { ...defaultCurvePreset, name: "easeBell", curveSet: "norm", power: 60, inverted: 0 },
    },
	FXB_StringyBrush : {
        drawType: "paintBrissleB",
		stateId: "paintSBM_13",
        lengthFade: 40,  // hair count
        widthFade: 20,  // brush size
		antiAlias: false,
		useSizeDist: false, // Fit circles only for antiAlias true
		useDirection: true, // Brush rotate
        brushOptionsA : 12,
        brushOptionsB : 4,
        curveStateBrushColor: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 50, inverted: 0, superPowers: [50, 0] },
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 5, inverted: 0, superPowers: [5, 12] },
        curveStateLineWidth: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },
        curveStateLineAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },
        curveStateSprayAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },
    },
   // FXB_3:  { drawType: "paintBrissleB", stateId: "paintSBM_3", brushOptionsA: 2 },
    FXB_4:  { drawType: "paintBrissleB", stateId: "paintSBM_4", brushOptionsA: 3 },
    FXB_5:  { drawType: "paintBrissleB", stateId: "paintSBM_5", brushOptionsA: 4 },
    FXB_6:  { drawType: "paintBrissleB", stateId: "paintSBM_6", brushOptionsA: 5 },
    FXB_7:  { drawType: "paintBrissleB", stateId: "paintSBM_7", brushOptionsA: 6 },
    //FXB_8:  { drawType: "paintBrissleB", stateId: "paintSBM_8" },
    //FXB_9:  { drawType: "paintBrissleB", stateId: "paintSBM_9", brushOptionsA: 8 },
    FXB_10: { drawType: "paintBrissleB", stateId: "paintSBM_10", brushOptionsA: 9 },
    FXB_11: { drawType: "paintBrissleB", stateId: "paintSBM_11", brushOptionsA: 10 },
    FXB_12: { drawType: "paintBrissleB", stateId: "paintSBM_12", brushOptionsA: 11 },
    //FXB_13: { drawType: "paintBrissleB", stateId: "paintSBM_13", brushOptionsA: 12 },
    FXB_14: { drawType: "paintBrissleB", stateId: "paintSBM_14", brushOptionsA: 13 },
    FXB_15: { drawType: "paintBrissleB", stateId: "paintSBM_15", brushOptionsA: 14 },
    FXB_16: { drawType: "paintBrissleB", stateId: "paintSBM_16", brushOptionsA: 15 },
    FXB_17: { drawType: "paintBrissleB", stateId: "paintSBM_17", brushOptionsA: 16 },
	FXB_Sketcher : {
        drawType: "paintBrissleB",
		stateId: "paintSBM_8",
        lengthFade: 1,  // hair count
        widthFade: 1,  // brush size
		antiAlias: true,
		useSizeDist: true, // Fit circles only for antiAlias true
		useDirection: true, // Brush rotate
        brushOptionsA : 7,
        brushOptionsB : 4,
        curveStateBrushColor: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateSpraySize: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 }, // All size of smalll
        curveStateSprayAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },  // All alpha = 1
    },
	FXB_SketcherRand : {
        drawType: "paintBrissleB",
		stateId: "paintSBM_9",
        lengthFade: 1,  // hair count
        widthFade: 1,  // brush size
		antiAlias: true,
		useSizeDist: true,  // Fit circles
		useDirection: true, // Brush rotate
        brushOptionsA : 8,
        brushOptionsB : 4,
        curveStateBrushColor: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateBrushAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 },
        curveStateSpraySize: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 100, inverted: 0 }, // All size of smalll
        curveStateSprayAlpha: { ...defaultCurvePreset, name: "ease", curveSet: "norm", power: 0, inverted: 0 },  // All alpha = 1
    },
    CutPaste : {
        drawType: "paintCutter",
    },
    MagicSelect : {
        drawType: "paintMagicCutter",
    },
    //FXB_18: { drawType: "paintSpray", stateId: "paintSBM_18",  brushOptionsA: 1 ,  brushOptionsB: 1 },
    //FXB_19: { drawType: "paintSpray", stateId: "paintSBM_19",  brushOptionsA: 2 ,  brushOptionsB: 1 },
    //FXB_20: { drawType: "paintSpray", stateId: "paintSBM_20",  brushOptionsA: 3 ,  brushOptionsB: 1 },
    //FXB_21: { drawType: "paintSpray", stateId: "paintSBM_21",  brushOptionsA: 4 ,  brushOptionsB: 1 },
}