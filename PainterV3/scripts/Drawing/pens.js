"use strict";
/* Many buttons have multiple uses, rather than create many named instances for each button I just use the original
   names to reference these UI settings. This can be confusing so then following comment contains the most common.
 Command name and paint property name
        commands.paintAntiAlias,      paint.antiAlias
Frome painter Pannel second row  2nd from the left going right in order are
        commands.paintColorBlend,     paint.colorBlend
        commands.paintBrushSizeBlend, paint.sizeBlend
        commands.paintFadeAlphaDist,  paint.useAlphaDist
        commands.paintSizeDist,       paint.useSizeDist
        commands.paintRandColor,      paint.randColor
        commands.paintUseDirection,   paint.useDirection
        commands.paintUseSpeed,       paint.useSpeed AKA imageBrush
Sliders From top to bottom on left then right of painter pannel
        commands.paintBrushMin,           paint.brushMin     0-60
        commands.paintBrushMax,           paint.brushMax     0-60
        commands.paintLengthFade,         paint.lengthFade   0-200
        commands.paintWidthFade,          paint.widthFade    0-200
        commands.paintCurveStep,          paint.curveStep    0-60
        commands.paintBrushStep,          paint.brushStep    0-60
        commands.paintPalletPickupPower,  paint.pickupPower  0-100
        commands.paintPalletPickupRadius, paint.pickupRadius 0- 100
And the curve slider
        commands.paintCurvePowA, paint.activeCurvePower
Curve names from the top left above the curve slider to right and the row under
            commands.paintCurveSetBrushColor,  curves.brushColor
            commands.paintCurveSetBrushAlpha,  curves.brushAlpha
            commands.paintCurveSetLineColor,   curves.lineColor
            commands.paintCurveSetLineWidth,   curves.lineWidth
            commands.paintCurveSetLineAlpha,   curves.lineAlpha
            commands.paintCurveSetSprayColor,  curves.sprayColor
            commands.paintCurveSetSpraySize,   curves.spraySize
            commands.paintCurveSetSpraySpread, curves.spraySpread
            commands.paintCurveSetSprayAlpha,  curves.sprayAlpha
*/
const pens = (()=>{
    const recallColors = {};
	const HEX = [];
	for (let i = 0; i < 255; i++) { HEX.push((i < 16 ? "0" : "") + i.toString(16)) }
	HEX.push("FF","FF");
	function clampRGBMixA(r,g,b,a) { return "#" + HEX[r | 0] + HEX[g | 0] + HEX[b | 0] + HEX[a | 0] }
	function clampRGBMix(col) { return "#" + HEX[col.r | 0] + HEX[col.g | 0] + HEX[col.b | 0] + HEX[col.a | 0] }
	function HSLMix() { return "hsla("+ (Math.round(H) % 360) + "," + Math.round(S) + "%," + Math.round(L) + "%,"+ A +")" }
	var H,S,L,A;
	function toHSL(col) {
		var dif,min,max;
		const r = col.r, g = col.g, b = col.b;
		A = col.a / 256
		min = Math.min(r, g, b);
		max = Math.max(r, g, b);
		if (min === max) { L = min / 2.56 }
		else {
			dif = max - min;
			L = max + min;
			S =  (L > 256 ? dif / (512 - max - min) :  dif / L) * 100;
			L /= 5.12;
			if (max === r) { H = (g - b) / dif + (g < b ? 6 : 0) }
			else if (max === g) { H = (b - r) / dif + 2 }
			else { H = (r - g) / dif + 4 }
            H *= 60;
		}
	}
    var useMarkedSpriteAsColorSource = false;
    var colorSource = undefined;
    var tick = 0.0;
    var gDir = 0, gDirC = 0, gDirA = 0;
    var gSpd = 0, gSpdC = 0, gSpdA = 0;
    const fillModes = {}; // set at first run
    var smallCircleRadius = 0;
    var aliasCircleRadiusX = 0;
    var aliasCircleRadiusY = 0;
    var aliasCircleCenterSnapCorrect = false;
    var aliasCircleCenterSnap = utils.point;
    var rgbClamper = new Uint8ClampedArray(4);
    const circleBrushSpreadSubStep = 8;
    const circleBrushSpreadSubStepUnit = 1 / circleBrushSpreadSubStep;
    const sprayBrushSteps = [1.1,1.2,1.4,1.8,2,2.5,3,3.5,4,5,6,7,10,15,20]; // multiplies rate
    const smallAliasCirclesFill =   [[],[0,], [1,0,],   [2,2,1,],         [3,3,2,1,],[4,4,3,2,1,],[5,5,4,4,3,1,],[6,6,5,5,4,3,1,],];
    const smallAliasCirclesStroke = [[],[0,0],[1,0,0,1],[2,0,2,1,1,2,0,2],[3,0,3,1,2,2,1,3,0,3],[4,0,4,1,3,2,2,3,1,4,0,4],[5,0,5,1,4,2,4,3,3,4,2,4,1,5,0,5],[6,0,6,1,5,2,5,3,4,4,3,5,2,5,1,6,0,6],];
    const aliasRects = [[0,1], [0,1], [-1,2], [-1.5,3], [-2,4], [-2.5,5], ] // first is zero size
    const edgeFill = {
        started : false,
        select : 0,
        doit : false,
        distSegment : 0,
        selectPreviouse : -1,
        useFeedback : false,
        edges : [0b10, 0b1000000, 0b100, 0b10000000, 0b1000, 0b10000, 0b1, 0b100000],
    }
    const BRUSH_MAX_SIZE = 256;
    const BRUSH_MAX_CENTER = 127;
    var imageTop;
    var imageTopSrc;
    const moves = {
        current: [[ 0,0]],
        dir: 1,
        step: 1,
        noMove: [[ 0,  0]],
        rand:   [[ 0,  1], [ 1,  0], [ 0, -1], [-1,  0], [ 0,  2], [ 2,  0], [ 0, -2], [-2,  0], [ 0,3], [3,  0], [ 0, -3], [-3,  0], [ 0,4], [4,  0], [ 0, -4], [-4,  0]],
        diag:   [[ 1,  1], [-1,  1], [-1, -1], [ 1, -1]],
        axis:   [[ 1,  0], [ 0,  1], [-1,  0], [ 0, -1]],
        hex:    [[ 1,  0], [ 1,  1], [ 0,  1], [-1,  1], [-1,  0], [-1, -1], [ 0, -1], [ 1, -1]],
        hor:    [[ 1,  0], [-1,  0]],
        ver:    [[ 0, -1], [ 0,  1]],
        forw:   [[-1, -1], [ 1,  1]],
        back:   [[ 1, -1], [-1,  1]],
        horOf:  [[ 1,  0], [ 1,  0], [ 1,  0], [ 0, -2], [-1,  0], [-1,  0], [-1,  0], [ 0,  2]],
        verOf:  [[ 0,  1], [ 0,  1], [ 0,  1], [ 2,  0], [ 0, -1], [ 0, -1], [ 0, -1], [-2,  0],],
        forwOf: [[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-2,  2], [ 1,  1], [ 1,  1], [ 1,  1], [ 1,  1], [ 2, -2],],
        backOf: [[ 1, -1], [ 1, -1], [ 1, -1], [ 1, -1], [ 2,  2], [-1,  1], [-1,  1], [-1,  1], [-1,  1], [-2, -2]],
        a:      [[ 1,  0], [ 1,  1], [ 0,  1], [-1,  1], [-1,  0], [-1, -1], [ 0, -1], [ 1, -1]],
        b:      [[ 2,  0], [ 2,  1], [ 2,  2], [ 1,  2], [ 0,  2], [-1,  2], [-2,  2], [-2,  1], [-2,  0], [-2, -1], [-2, -2], [-1, -2], [ 0, -2], [ 1, -2], [ 2, -2], [ 2, -1]],
        round:  [[ 2,  0], [ 2,  1], [ 2,  2], [ 1,  2], [ 0,  2], [-1,  2], [-2,  2], [-2,  1], [-2,  0], [-2, -1], [-2, -2], [-1, -2], [ 0, -2], [ 1, -2], [ 2, -2], [ 2, -1]],
        c:      [[ 1,  0], [ 1,  0], [ 1,  0], [ 1,  1], [ 0,  1], [ 0,  1], [ 0,  1], [-1,  1], [-1,  0], [-1,  0], [-1,  0], [-1, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 1, -1]],
        hexA:   [[ 1,  0], [ 1,  0], [ 1,  0], [ 1,  1], [ 0,  1], [ 0,  1], [ 0,  1], [-1,  1], [-1,  0], [-1,  0], [-1,  0], [-1, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 1, -1]],
        d:      [[ 1,  0], [ 1,  0], [ 1,  0], [ 1,  0], [ 1,  0], [ 1,  0], [ 1,  1], [ 0,  1], [ 0,  1], [ 0,  1], [-1,  1], [-1,  0], [-1,  0], [-1,  0], [-1, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 1, -1]],
        hexB:   [[ 1,  0], [ 1,  0], [ 1,  0], [ 1,  0], [ 1,  0], [ 1,  0], [ 1,  1], [ 0,  1], [ 0,  1], [ 0,  1], [-1,  1], [-1,  0], [-1,  0], [-1,  0], [-1, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 0, -1], [ 1, -1]],
        circle: (()=> {
            const array = [];
            for (var i = 0; i < 1; i += 1 / 64) {
                const a = Math.PI2 * i;
                array.push([Math.cos(a), Math.sin(a)]);
            }
            return array;
        })(),
    };
    const wCanvas1 = utils.canvas(BRUSH_MAX_SIZE,BRUSH_MAX_SIZE);
    const wCanvas2 = utils.canvas(BRUSH_MAX_SIZE,BRUSH_MAX_SIZE);
	const wCanvas3 = utils.canvas(BRUSH_MAX_SIZE,BRUSH_MAX_SIZE);
    const workDOMMatrix = new DOMMatrix([1,0,0,1,0,0]);
    const workMatrix = utils.matrix;
    const workPointA = utils.point;
    const workPointB = utils.point;
    const workPointC = utils.point;
    const mouseDownAt = utils.point;
    const colorRangeRGB = utils.colorRange;
    const palletRangeRGB =  utils.colorRange;
    const wColor = utils.rgba;
    const wColorRGB1 = utils.rgba;
    const wColorRGB2 = utils.rgba;
    const wColorRGBSimple1 = {r:0,g:0,b:0,a:0};
    const wColorRGBSimple2 = {r:0,g:0,b:0,a:0};
    const prevMainRGB = utils.rgba;
    const prevSecondRGB = utils.rgba;
    const palletColorMain =  utils.rgba;
    const palletColorSecond =  utils.rgba;
    const colorRangeHSL = utils.colorRange.useHSL();
    const wColorHSL1 = utils.rgba.toHSL();
    const wColorHSL2 = utils.rgba.toHSL();
    const floodFillLandings = {
        landings: [],
        landing: false,
        count: 0,
        idx: 0,
        landedCount: 0,
        contact: 0,
        fillAll: false,
    };
    var floodFillLanding = false;
    var fillAreaMode = false;
    var colorRange  = colorRangeRGB;
    var wColor1 = wColorRGB1;
    var wColor2 = wColorRGB2;
    var colorRangeDry = false;
    var colorRangeStartDry = false;
    var oldCursor = "";
    var specialBrushSpeedScale = 1;
    var specialBrushSpeedScaleA = 1;
	var specialBrushIseSpeedScale = false;
	var specialInterpolate = false;
    var lineDynamicPattern = false;
	const penCirclesAliased = [
        (ctx, x, y) => ctx.fillRect(x,     y,     1, 1),                                                                                                                                // 1
		(ctx, x, y) => ctx.fillRect(x,     y - 1, 1, 2),                                                                                                                                // 2
		(ctx, x, y) => ctx.fillRect(x - 1, y - 1, 2, 2),                                                                                                                                // 3
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x,     y - 1,  1,  3), ctx.rect(x - 1, y,      3,  1), ctx.fill()),                                                                   // 4
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 1, y - 2,  2,  4), ctx.rect(x - 2, y - 1,  4,  2), ctx.fill()),                                                                   // 5
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 1, y - 2,  3,  5), ctx.rect(x - 2, y - 1,  5,  3), ctx.fill()),                                                                   // 6
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 1, y - 2,  4,  6), ctx.rect(x - 2, y - 1,  6,  4), ctx.fill()),                                                                   // 7
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 2, y - 3,  5,  7), ctx.rect(x - 3, y - 2,  7,  5), ctx.fill()),                                                                   // 8
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 2, y - 4,  4,  1), ctx.rect(x - 3, y - 3,  6,  1), ctx.rect(x - 4, y - 2,  8,  4), ctx.rect(x - 3, y + 2, 6, 1), ctx.rect(x - 2, y + 3, 4, 1), ctx.fill()),    // 9
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 3, y - 3,  7,  7), ctx.rect(x - 2, y - 4,  5,  9), ctx.rect(x - 4, y - 2,  9,  5), ctx.fill()),                                  // 10
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 3, y - 3,  8,  8), ctx.rect(x - 2, y - 4,  6, 10), ctx.rect(x - 4, y - 2, 10,  6), ctx.fill()),                                  // 11
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 4, y - 4,  9,  9), ctx.rect(x - 3, y - 5,  7, 11), ctx.rect(x - 5, y - 2, 11,  7), ctx.fill()),                                  // 12
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 3, y - 4,  8, 10), ctx.rect(x - 4, y - 3, 10,  8), ctx.rect(x - 2, y - 5,  4, 12), ctx.rect(x - 5, y - 2, 12, 4), ctx.fill()),   // 13
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 4, y - 5,  9, 11), ctx.rect(x - 5, y - 4, 11,  9), ctx.rect(x - 2, y - 6,  5, 13), ctx.rect(x - 6, y - 2, 13, 5), ctx.fill()),   // 14
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 4, y - 5, 10, 12), ctx.rect(x - 5, y - 4, 12, 10), ctx.rect(x - 2, y - 6,  6, 14), ctx.rect(x - 6, y - 2, 14, 6), ctx.fill()),   // 15
		(ctx, x, y) => (ctx.beginPath(), ctx.rect(x - 5, y - 6, 11, 13), ctx.rect(x - 6, y - 5, 13, 11), ctx.rect(x - 3, y - 7,  7, 15), ctx.rect(x - 7, y - 3, 15, 7), ctx.fill()),   // 16
	];
	const pathCirclesAliased = [
        (ctx,x, y) => ctx.rect(x,      y,      1,  1),                                                                                                                                       //  1
		(ctx,x, y) => ctx.rect(x,      y - 1,  1,  2),                                                                                                                                       //  2
		(ctx,x, y) => ctx.rect(x - 1,  y - 1,  2,  2),                                                                                                                                       //  3
		(ctx,x, y) => (ctx.rect(x,     y - 1,  1,  3), ctx.rect(x - 1, y,      3,  1)),                                                                                                      //  4
		(ctx,x, y) => (ctx.rect(x - 1, y - 2,  2,  4), ctx.rect(x - 2, y - 1,  4,  2)),                                                                                                      //  5
		(ctx,x, y) => (ctx.rect(x - 1, y - 2,  3,  5), ctx.rect(x - 2, y - 1,  5,  3)),                                                                                                      //  6
		(ctx,x, y) => (ctx.rect(x - 1, y - 2,  4,  6), ctx.rect(x - 2, y - 1,  6,  4)),                                                                                                      //  7
		(ctx,x, y) => (ctx.rect(x - 2, y - 3,  5,  7), ctx.rect(x - 3, y - 2,  7,  5)),                                                                                                      //  8
        (ctx,x, y) => (ctx.rect(x - 2, y - 4,  4,  1), ctx.rect(x - 3, y - 3,  6,  1), ctx.rect(x - 4, y - 2,  8,  4), ctx.rect(x - 3, y + 2,  6,  1), ctx.rect(x - 2, y + 3, 4, 1)),        // 9
		(ctx,x, y) => (ctx.rect(x - 3, y - 3,  7,  7), ctx.rect(x - 2, y - 4,  5,  9), ctx.rect(x - 4, y - 2,  9,  5)),                                                                      //  10
		(ctx,x, y) => (ctx.rect(x - 3, y - 3,  8,  8), ctx.rect(x - 2, y - 4,  6, 10), ctx.rect(x - 4, y - 2, 10,  6)),                                                                      //  11
		(ctx,x, y) => (ctx.rect(x - 3, y - 5,  7,  1), ctx.rect(x - 4, y - 4,  9,  1), ctx.rect(x - 5, y - 3, 11,  7), ctx.rect(x - 4, y + 4,  9,  1), ctx.rect(x - 3, y + 5, 7, 1)),        //  12
		(ctx,x, y) => (ctx.rect(x - 3, y - 6,  6,  1), ctx.rect(x - 4, y - 5,  8,  1), ctx.rect(x - 5, y - 4, 10,  1), ctx.rect(x - 6, y - 3, 12,  6), ctx.rect(x - 5, y + 3, 10, 1),ctx.rect(x - 4, y+4, 8, 1),ctx.rect(x - 3, y+5, 6, 1)),          //  13
		(ctx,x, y) => (ctx.rect(x - 4, y - 5,  9, 11), ctx.rect(x - 5, y - 4, 11,  9), ctx.rect(x - 2, y - 6,  5, 13), ctx.rect(x - 6, y - 2, 13,  5)),                                       //  14
		(ctx,x, y) => (ctx.rect(x - 4, y - 5, 10, 12), ctx.rect(x - 5, y - 4, 12, 10), ctx.rect(x - 2, y - 6,  6, 14), ctx.rect(x - 6, y - 2, 14,  6)),                                       //  15
		(ctx,x, y) => (ctx.rect(x - 5, y - 6, 11, 13), ctx.rect(x - 6, y - 5, 13, 11), ctx.rect(x - 3, y - 7,  7, 15), ctx.rect(x - 7, y - 3, 15,  7)),                                       //  16
		(ctx,x, y) => (ctx.rect(x - 6, y - 6, 12, 12), ctx.rect(x - 7, y - 5, 14, 10), ctx.rect(x - 5, y - 7, 10, 14), ctx.rect(x - 3, y - 8,  6, 16), ctx.rect(x - 8, y - 3, 16, 6)),        //  17
		(ctx,x, y) => (ctx.rect(x - 6, y - 6, 13, 13), ctx.rect(x - 7, y - 5, 15, 11), ctx.rect(x - 5, y - 7, 11, 15), ctx.rect(x - 3, y - 8,  7, 17), ctx.rect(x - 8, y - 3, 17, 7)),        //  18
		(ctx,x, y) => (ctx.rect(x - 7, y - 7, 14, 14), ctx.rect(x - 8, y - 6, 16, 12), ctx.rect(x - 6, y - 8, 12, 16), ctx.rect(x - 4, y - 9,  8, 18), ctx.rect(x - 9, y - 4, 18, 8)),        //  19
		(ctx,x, y) => (ctx.rect(x - 7, y - 7, 15, 15), ctx.rect(x - 8, y - 6, 17, 13), ctx.rect(x - 6, y - 8, 13, 17), ctx.rect(x - 4, y - 9,  9, 19), ctx.rect(x - 9, y - 4, 19, 9)),        //  20
	];
    var guideScaling = 1;
    var guideScalingStart = 1;
    const hairArcResult = fitArc(0,0,10,0,10,10); // create full result
    const harA = fitArc(0,0,10,0,10,10); // create full result
    const harB = fitArc(0,0,10,0,10,10); // create full result
    const workingArcResult = fitArc(0,0,10,0,10,10); // create full result
    const pointBuf = [utils.point, utils.point, utils.point];
    var colorMixVal, optionLineWidth,colorPickAreaOn, randomColor,dontGetPixelColor,dontUpdateColorPallet,sprayMin, sprayMax, sprayRange,brushStep, curveStep, gradientAlpha,dirty,cancelStroke, useShadow, filter, alias, mainColor, secondColor, mainDrawMode, secondDrawMode, nextDrawMode, brushMax, brushMin, brushRange, alpha, buttonUsed;
    cancelStroke = false;
    var fromPallet = false;
    gradientAlpha = false;
    dontGetPixelColor = false;
    dontUpdateColorPallet = false;
    colorPickAreaOn = false;
    var colorFunctionSource;
    var colorCurve,pointColorFunc;
    dirty = false;
    var colorModelHSL = false;
	var dither = 0;
	var colorModeFunc;
    var colorModeFunc2;
    var colorModeFunc1;
    var colorInterpFunctionRGBAlpha = colorRange.rgbaAt.bind(colorRange);
    var colorInterpFunctionRGB = colorRange.rgbAt.bind(colorRange);
    var colorInterpFunction = colorInterpFunctionRGBAlpha;
    var gradientColorCurve = undefined;
    var gradientAlphaCurve = undefined;
    var mouseButtonDown = -1;
    var startingStroke = false;
    var waitingForDirection = false;
    var brushCanPaint = false;
    var hbSprites;
    var renderMove = ()=>{};
    const selectionClip = Extent();
    var useSelectionClip = false;
    var drawModeMouseLocked = false;
    const shapeModStates = {
        shift: false,
        alt: false,
        ctrl: false,
        clear() {
            shapeModStates.shift = false;
            shapeModStates.alt = false;
            shapeModStates.ctrl = false;
        }
    }
    function setPaintState() {
        if (colorModelHSL !== colours.useHSLModel) {
            colorModelHSL = colours.useHSLModel;
            if (colours.useHSLModel) {
                colorRange = colorRangeHSL;
                colorRange.initHSLFromRGB(colorRangeRGB);
                wColor1 = wColorHSL1;
                wColor2 = wColorHSL2;
            } else {
                colorRange = colorRangeRGB;
                wColor1 = wColorRGB1;
                wColor2 = wColorRGB2;
            }
        }
        if (curves.lineAlpha.name === "flat") {
            const pow = curves.lineAlpha.power;
            gradientAlpha = (pow <= 0 || pow >= 1) && ! curves.lineAlpha.inverted;
        } else { gradientAlpha = true }
        randomColor = paint.randColor;
        filter = paint.buildFilter();
        useShadow = paint.filterShadow;
        brushMin = paint.brushMin;
        brushMax = paint.brushMax;
        brushRange = paint.brushRange = brushMax - brushMin;
        specialBrushes.curveStep = curveStep = paint.curveStep;  // slider above brush step. Controls spacing of intorpolated brushes
		colorMixVal = paint.pickupRadius / 100;
        brushStep = paint.brushStep;
        sprayMin = paint.lengthFade;
        optionLineWidth = sprayMin / 200 + 0.25;
        sprayMax = paint.widthFade;
        sprayRange = sprayMax;// - sprayMin;
        alpha = colours.alpha;
        var dontCaptureColor = false;
        colorPickAreaOn = false;
        buttonUsed = (mouse.button & 1) ? 1 : (mouse.button & 4) ? 2 : 0;
        drawModeMouseLocked && mouse.saveSetModState(false, false, false);
        if (!dontGetPixelColor && paint.palletFrom === commands.paintColImage) { }
        if (!dontGetPixelColor && paint.palletFrom === commands.paintColImage) {
            if (randomColor && !API.inFeedback) {
                getRandomColorSet(colorRange,true);
                colorPickAreaOn = true;
            } else {
                colorRange.useLookup = false;
                if (buttonUsed === 2) {
                    getPixelColour(wColorRGB2,true);
                    if (wColorRGB2.a === 0) { wColorRGB2.copyOf(prevSecondRGB) }
                    prevSecondRGB.copyOf(wColorRGB2);
                } else {
                    getPixelColour(wColorRGB1,true);
                    if (wColorRGB1.a === 0) { wColorRGB1.copyOf(prevMainRGB) }
                    prevMainRGB.copyOf(wColorRGB1);
                }
            }
            if (buttonUsed === 2) {
                colorRangeRGB.init(wColorRGB2,wColorRGB1);
                secondColor = wColorRGB1.cssRGBA;
                colorModeFunc = colorModeFunc2;
                mainColor = colorModeFunc ? colorModeFunc(wColorRGB2) : wColorRGB2.cssRGBA;
                palletRangeRGB.init(colours.secondColor,colours.mainColor);
                palletRangeRGB.rgba1.captureHSL();
                if (colorModelHSL) { colorRange.initHSLFromRGB(colorRangeRGB) }
                secondDrawMode  = colours.getDrawMode(colours.mainDrawMode);
                mainDrawMode = colours.getDrawMode(colours.secondDrawMode);
            } else {
                colorRangeRGB.init(wColorRGB1,wColorRGB2);
                colorModeFunc = colorModeFunc1;
                mainColor = colorModeFunc ? colorModeFunc(wColorRGB1) : wColorRGB1.cssRGBA;
                secondColor = wColorRGB2.cssRGBA;;
                palletRangeRGB.init(colours.mainColor,colours.secondColor);
                 palletRangeRGB.rgba1.captureHSL();
                if (colorModelHSL) { colorRange.initHSLFromRGB(colorRangeRGB) }
                mainDrawMode = colours.getDrawMode(colours.mainDrawMode);
                secondDrawMode = colours.getDrawMode(colours.secondDrawMode);
            }
        } else {
             colorRange.useLookup = false;
            if (buttonUsed === 2) {
                if (!dontGetPixelColor && paint.palletFrom === commands.paintColImage && wColorRGB1.a > 0) {
                    if (!dontUpdateColorPallet) { colours.setColor(wColorRGB1.r,wColorRGB1.g,wColorRGB1.b,true) }
                }
                secondColor = colours.mainColor.css;
                mainColor = colours.secondColor.css;
                colorRangeRGB.init(colours.secondColor,colours.mainColor);
                palletRangeRGB.init(colours.secondColor,colours.mainColor);
                if (colorModelHSL) { colorRange.initHSLFromRGB(colorRangeRGB) }
                secondDrawMode  = colours.getDrawMode(colours.mainDrawMode);
                mainDrawMode = colours.getDrawMode(colours.secondDrawMode);
                prevMainRGB.copyOf(colours.secondColor);
                prevSecondRGB.copyOf(colours.mainColor);
            } else {
                if (!dontGetPixelColor && paint.palletFrom === commands.paintColImage && wColorRGB1.a > 0) {
                    if (!dontUpdateColorPallet) { colours.setColor(wColorRGB1.r,wColorRGB1.g,wColorRGB1.b) }
                } else if (!dontCaptureColor && buttonUsed === 1 && colours.pending) {  colours.pendingColorUsed() }
                mainColor = colours.mainColor.css;
                secondColor = colours.secondColor.css;
                colorRangeRGB.init(colours.mainColor,colours.secondColor);
                if (colorModelHSL) { colorRange.initHSLFromRGB(colorRangeRGB) }
                mainDrawMode = colours.getDrawMode(colours.mainDrawMode);
                secondDrawMode = colours.getDrawMode(colours.secondDrawMode);
                prevMainRGB.copyOf(colours.secondColor);
                prevSecondRGB.copyOf(colours.mainColor);
            }
        }
        fromPallet = !(paint.palletFrom === commands.paintColImage);
        if (randomColor) {
            pointColorFunc = colorFunctionSource.random;
        }else if (paint.colorBlend) {
            if (fromPallet) {
                pointColorFunc = colorFunctionSource.blendPallet;
            } else {
                pointColorFunc = colorFunctionSource.blend;
            }
        } else {
            pointColorFunc = colorFunctionSource.pallet;
        }
        drawModeMouseLocked && mouse.restoreModState();
    }
    function setupContext(spr, seperateStrokeAndFill = false) {
        const ctx = spr.image.ctx;
        if (API.inFeedback) {
            if (paint.drawType === commands.paintSpray && randomColor && paint.palletFrom === commands.paintColImage) {
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = "red";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(spr.key.lx, spr.key.ly,paint.pickupRadius / 4, 0, Math.PI2);
                ctx.stroke();
            }
        }
        if (useSelectionClip) {
            //spr.image.clipToExtent(useSelectionClip);
        }
        ctx.imageSmoothingQuality = "high";
        if (randomColor) {
            if (buttonUsed === 2) {
                mainColor = colours.colorRange[1 - curves.brushColor(Math.random()) * 255 | 0];
            } else {
                mainColor = colours.colorRange[curves.brushColor(Math.random()) * 255 | 0];
            }
        }
        ctx.globalAlpha = alpha;
        ctx.filter = filter;
        paint.shadow(ctx,true);
        const loaded = colorRange.isLoaded();
        if (paint.filterShadow && ctx.shadowUsesMain) {
            colorCurve = curves.lineColor;
            pointColorFunc(ctx,Math.random());
            ctx.shadowColor = ctx.fillStyle;
        }
        if (seperateStrokeAndFill) {
            ctx.strokeStyle = mainColor;
            ctx.fillStyle = secondColor;
        } else {
            ctx.fillStyle = ctx.strokeStyle = mainColor;
        }
        ctx.globalCompositeOperation = mainDrawMode;
    }
    const renderFunctions = (()=>{
        var lastX = 0;
        var lastY = 0;
        const API = {
            mark(ctx,x,y,size,col) {
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.moveTo(x-size,y)
                ctx.lineTo(x+size,y)
                ctx.moveTo(x,y - size)
                ctx.lineTo(x,y + size)
                ctx.stroke();
            },
            line(ctx,l,col) {
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.moveTo(l.p1.x,l.p1.y)
                ctx.lineTo(l.p2.x,l.p2.y)
                ctx.stroke();
            },
            interpolate : {
                desc : {
                    x : 0,
                    y : 0,
                    dx : 0,
                    dy : 0,
                    step : 0,
					dist: 0,
					travel: 0,
					toTravel: 0,
                    start : 0,
                    count : 0,
                    odds : 0,
                    empty : true,
                    onSpriteSingle(spr) { // this is used in feedback rendering to drawable drawOn's
                        const k = spr.key;
                        this.x = k._lx;
                        this.y = k._ly;
						k.dist = 0;
						k.__lx = k.__ly = null;
                        this.empty = false;
                        var dx = this.dx = k.lx - k._lx;
                        var dy = this.dy = k.ly - k._ly;
                        var len = this.dist = Math.sqrt(dx * dx + dy * dy) + 0.00001;
                        this.count = 1 ;
                        this.start = 0;
                        this.toTravel = this.travel = 0;
						this.dontPaint = false;
                        if (paint.drawType === commands.paintSpray) {
                            this.odds = 1;
                            this.dx = 0;
                            this.dy = 0;
                            this.x += dx * 0.5;
                            this.y += dy * 0.5;
                            this.step = 1 / (brushStep/4);
                        } else {
                            if (brushStep > 0) {
                                this.step = 0.5
                            } else {
                                this.step = 0.5;
                                if (curveStep > 0) {
                                    this.step *= curveStep;
                                    //this.count += this.step/2
                                    if (!startingStroke) {
                                        //this.start += this.step;
                                    }
                                }
                            }
                        }
                        k._lx = k.lx;
                        k._ly = k.ly;
                    },
                    onSprite(spr) {
                        var dx,dy;
                        var lx,ly
                        const k = spr.key;
                        this.x = k._lx;
                        this.y = k._ly;
						if (startingStroke) {
							k.__lx = k.__ly = null;
						}
                        this.empty = false;
                        lx = k.lx;
                        ly = k.ly;
                        dx = this.dx = lx - this.x;
                        dy = this.dy = ly - this.y;
						this.travel += this.toTravel;
                        var len = this.toTravel = this.dist = Math.sqrt(dx * dx + dy * dy);
						this.dontPaint = false;
                        this.count = 1 ;
                        this.start = 0;
                        if (paint.drawType === commands.paintSpray) {
                            if (curveStep > 0) {
                                if (len === 0) {
                                    this.start = 2;
                                    this.step  = 1;
                                } else {
                                    this.step = 1 / ((brushStep+1) * len);
                                    this.odds = 1 / curveStep;
                                }
                            } else {
                                this.odds = 1;
                                if (brushStep > 46) {
                                    this.step = 1 / (brushStep* sprayBrushSteps[brushStep - 46]);
                                } else {
                                    this.step = 1 / (brushStep+1);
                                }
                            }
                            k._lx = lx;
                            k._ly = ly;
                        } else {
                            if ( brushStep > 0) {
                                this.step = 1 / brushStep;
								if (specialInterpolate && specialBrushes.currentStep.canInterpolate && curveStep > 0) {
									if (len < 0.1) { this.dontPaint = true }
                                } else if (curveStep > 0) {
                                    this.step *= curveStep;
                                    if (!startingStroke) {
										this.start = (1 - (k.dist / curveStep) % 1) * this.step;
                                        if (len < curveStep) { this.empty = true }
                                    }
									if (this.empty) {
										this.toTravel = 0;
										return;
									}
                                }
                                k._lx = lx;
                                k._ly = ly;
                            } else {
                                this.step = len >= 1 ? 1 / len : 0.5;
								if (specialInterpolate && specialBrushes.currentStep.canInterpolate && curveStep > 0) {
									if (len < 0.1) { this.dontPaint = true }
                                } else if (curveStep > 0) {
                                    /*if (curveStep <= 1 && !startingStroke) {
                                        if (len < 1 && len > 0) {
                                            len = ((lx | 0) !== (k._lx | 0) || (ly | 0) !== (k._ly | 0)) ? 1 : len;
                                            this.toTravel = this.dist = len
                                            this.step = len >= 1 ? 1 / len : 0.5;
                                        }
                                    }*/
                                    this.step *= curveStep;
                                    if (!startingStroke) {
                                        this.start = (1 - (k.dist / curveStep) % 1) * this.step;
                                        if (len < curveStep) { this.empty = true }
                                    }
                                    if (this.empty) {
                                        this.toTravel = 0;
                                        return;
                                    }
                                }
                                k._lx = lx;
                                k._ly = ly;
                            }
                        }
						k.dist += len;
                    }
                },
                point : {
                    pixelAlias_OLD(spr) {
                        const point = renderFunctions.alias.point;
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                         const br = brushRange / 2;
                        const bm = brushMin / 2;
                        const step = d.step;
                        const count = d.count;
                        if (count > 1) {
                            gDirC = mouseBrush.directionChange * step;
                            gSpdC = mouseBrush.speedChange * step;
                        } else {
                            gDirC = mouseBrush.directionChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                            gSpdC = mouseBrush.speedChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                        }
                        gDirA = gDir  = mouseBrush.direction;
                        gSpdA = gSpd  = mouseBrush.speed-mouseBrush.speedChange;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var rx,ry,i,xx,yy,xxl,yyl;
                        ctx.lineWidth = Math.max(sprayMin / 8 + 1, 1);
                        ctx.beginPath();
                        var rad = bm;
                        if (curveStep === 1) {
                            if (spr.key.__lx !== null) {
                                xxl = (spr.key.__lx + 4096 | 0) - 4096;
                                yyl = (spr.key.__ly + 4096 | 0) - 4096;
                            } else {
                                xxl = yyl = Infinity;
                            }
                            if (paint.useAlphaDist && br !== 0) {
                                for (i = d.start; i < count; i += step) {
                                    rad = curves.lineWidth(Math.random()) * br + bm;
                                    xx = (x + dx * i + 4096 | 0) - 4096;
                                    yy = (y + dy * i + 4096 | 0) - 4096;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (!(xx === xxl && yy === yyl)) {
                                        if (rad < 1.5) { ctx.rect(xx,yy,1,1) }
                                        else { point(ctx,xx,yy,rad) }
                                        dither ++;
                                    }
                                }
                            }else if (rad < 1.5) {
                                for (i = d.start; i < count; i += step) {
                                    xx = (x + dx * i + 4096 | 0) - 4096;
                                    yy = (y + dy * i + 4096 | 0) - 4096;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (!(xx === xxl && yy === yyl)) {
                                        ctx.rect(xx,yy,1,1);
                                    }
                                }
                            } else {
                                for (i = d.start; i < count; i += step) {
                                    xx = (x + dx * i + 4096 | 0) - 4096;
                                    yy = (y + dy * i + 4096 | 0) - 4096;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (!(xx === xxl && yy === yyl)) {
                                        point(ctx,xx,yy,rad);
                                        dither ++;
                                    }
                                }
                            }
                            spr.key.__lx = xx;
                            spr.key.__ly = yy;
                        } else {
                            if (paint.useAlphaDist && br !== 0) {
                                for (i = d.start; i < count; i += step) {
                                    rad = curves.lineWidth(Math.random()) * br + bm;
                                    xx = (x + dx * i + 4096 | 0) - 4096;
                                    yy = (y + dy * i + 4096 | 0) - 4096;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (rad < 1.5) { ctx.rect(xx,yy,1,1) }
                                    else { point(ctx,xx,yy,rad) }
                                    dither ++;
                                }
                            }else if (rad < 1.5) {
                                for (i = d.start; i < count; i += step) {
                                    xx = (x + dx * i + 4096 | 0) - 4096;
                                    yy = (y + dy * i + 4096 | 0) - 4096;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    ctx.rect(xx,yy,1,1);
                                }
                            } else {
                                for (i = d.start; i < count; i += step) {
                                    xx = (x + dx * i + 4096 | 0) - 4096;
                                    yy = (y + dy * i + 4096 | 0) - 4096;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    point(ctx,xx,yy,rad);
                                    dither ++;
                                }
                            }
                        }
                        ctx.fill();
                    },
                    pixelAlias(spr) {
                        const ctx = spr.image.ctx;
						const point = renderFunctions.alias.point;
                        const d = renderFunctions.interpolate.desc;
						const useDist = paint.useAlphaDist || paint.useSizeDist ? true : false;
						const repeatDist = paint.widthFade < 1 ? 1e9 : paint.widthFade;
						const lineDist = paint.lengthFade < 1 ? 1 : paint.lengthFade ** 1.5
						const lineDistTotal = lineDist * repeatDist;
                        const step = d.step;
                        const start = curveStep === 1 ? 0 : d.start;
                        //const start = curveStep === 1 ? d.start : d.start;
                        const count = curveStep === 1 ? d.count + d.start/4 : d.count ;
                        //const count = curveStep === 1 ? d.count : d.count ;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var size = Math.round(brushMin), brushRadius = brushMin / 2 | 0;
                        colorCurve = curves.lineColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        const fromPallet = !(paint.palletFrom === commands.paintColImage);
						const dist = (dx * dx + dy * dy) ** 0.5;
						var curDist,al;
                        var rx,ry,i,xxl,yyl;
                        //var drawRect = ctx.fillRect.bind(ctx);
                        var usePath = false;
						if (spr.key.__lx !== null) {
							xxl = (spr.key.__lx + 4096 | 0) - 4096;
							yyl = (spr.key.__ly + 4096 | 0) - 4096;
						} else {
							xxl = yyl = Infinity;
						}
                        if (!randomColor && !(useDist && paint.useSizeDist)) {
                            usePath = true;
                            pointColorFunc(ctx);
                            ctx.beginPath();
                        }
                        for (i = start; i < count; i += step) {
							rx = (x + dx * i + 4096 | 0) - 4096;
							ry = (y + dy * i + 4096 | 0) - 4096;
							if (!(rx === xxl && ry === yyl)) {
								curDist = d.travel + dist * i;
								if (!useDist || curDist < lineDistTotal) {
									if (useDist) {
										const distNorm = (curDist % lineDist) / lineDist;
										if (paint.useAlphaDist) {  // line width
											size = Math.round(curves.lineWidth(distNorm) * brushRange + brushMin);
											brushRadius = size < 2 ? 1 : size / 2 | 0;
										}
										if (paint.useSizeDist) { // line alpha
											ctx.globalAlpha = al = curves.lineAlpha(distNorm) * alpha;
										}
									}
									if (usePath) {
										if (brushRadius < 1) { ctx.rect(rx - brushRadius, ry - brushRadius, size, size) }
										else { point(ctx, rx, ry, brushRadius) }
									} else {
										pointColorFunc(ctx);
										if (al > 0) {
											ctx.beginPath();
											if (size < 1.5) { ctx.rect(rx,ry,1,1) }
											else { point(ctx, rx, ry,brushRadius) }
											ctx.fill();
										}
									}
								}
							}
							if (curveStep === 1) {
								xxl = rx;
								yyl = ry;
							}
                        }
                        if (usePath) { ctx.fill() }
						spr.key.__lx = rx;
                        spr.key.__ly = ry;
                    },
                    pixelShape(spr) {
                        const point = renderFunctions.alias.points[pens.options.pointTypes[paint.brushOptionsA]];
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var rx,ry,i;
                        ctx.lineWidth = Math.max(sprayMin / 8 + 1, 1);
                        colorCurve = curves.lineColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        const fromPallet = !(paint.palletFrom === commands.paintColImage);
                        if (count > 1) {
                            gDirC = mouseBrush.directionChange * step;
                            gSpdC = mouseBrush.speedChange * step;
                        } else {
                            gDirC = mouseBrush.directionChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                            gSpdC = mouseBrush.speedChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                        }
                        gDirA = gDir  = mouseBrush.direction;
                        gSpdA = gSpd  = mouseBrush.speed-mouseBrush.speedChange;
                        var size, brushRadius = brushMin , bm = brushRadius , br = brushRange ;
                        if (paint.antiAlias) {
                            for (i = d.start; i < count; i += step) {
                                if (paint.useAlphaDist) {
                                    size = curves.lineWidth(Math.random()) * br + bm;
                                    brushRadius = size < 1 ? 1 : size;
                                }
                                gDirA += gDirC;
                                gSpdA += gSpdC;
                                pointColorFunc(ctx);
                                point(ctx, x + dx * i, y + dy * i, brushRadius | 0);
                            }
                        } else {
                            for (i = d.start; i < count; i += step) {
                                if (paint.useAlphaDist) {
                                    size = curves.lineWidth(Math.random()) * br + bm;
                                    brushRadius = size < 1 ? 1 : size;
                                }
                                gDirA += gDirC;
                                gSpdA += gSpdC;
                                pointColorFunc(ctx);
                                point(ctx, (x + dx * i + 4096 | 0) - 4096, (y + dy * i + 4096 | 0) - 4096, brushRadius | 0);
                            }
                        }
                    },
                    pixel(spr) {
                        if (!randomColor) {
                            renderFunctions.interpolate.point.pixelAlias(spr);
                            return;
                        }
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var rx,ry,i;
                        colorCurve = curves.lineColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        const fromPallet = !(paint.palletFrom === commands.paintColImage);
                        var size, brushRadius = brushMin / 2, bm = brushRadius / 2, br = brushRange / 2;
                        for (i = d.start; i < count; i += step) {
                            if (paint.useAlphaDist) {
                                size = curves.lineWidth(Math.random()) * br + bm;
                                brushRadius = size < 1 ? 1 : size;
                            }
                            pointColorFunc(ctx);
                            if (brushRadius <= 1) {
                                rx = (x + dx * i + 4096 | 0) - 4096;
                                ry = (y + dy * i + 4096 | 0) - 4096;
                                ctx.fillRect(rx,ry,1,1);
                            } else if (brushRadius===2) {
                                rx = ((x + dx * i + 4096 | 0) - 4097);
                                ry = ((y + dy * i + 4096 | 0) - 4097);
                                ctx.fillRect(rx,ry,2,2);
                            } else if (brushRadius===3) {
                                rx = ((x + dx * i + 4096 | 0) - 4095.5);
                                ry = ((y + dy * i + 4096 | 0) - 4095.5);
                                ctx.fillRect(rx - 0.5,ry- 1.5,1,3);
                                ry -= 0.5;
                                ctx.fillRect(rx - 1.5,ry,1,1);
                                ctx.fillRect(rx + 0.5,ry,1,1);
                            } else if (brushRadius===4) {
                                rx = ((x + dx * i + 4096 | 0) - 4096);
                                ry = ((y + dy * i + 4096 | 0) - 4096);
                                ctx.fillRect(rx - 1,ry- 2,2,4);
                                ry -= 1;
                                ctx.fillRect(rx - 2,ry,1,2);
                                ctx.fillRect(rx + 1,ry,1,2);
                            } else if (brushRadius===5) {
                                rx = (x + dx * i + 4096 | 0) - 4095.5;
                                ry = (y + dy * i + 4096 | 0) - 4095.5;
                                ctx.fillRect(rx - 1.5,ry- 2.5,3,5);
                                ry -= 1.5;
                                ctx.fillRect(rx - 2.5,ry,1,3);
                                ctx.fillRect(rx + 1.5,ry,1,3);
                            } else {
                                rx = (x + dx * i + 4096 | 0) - 4095.5;
                                ry = (y + dy * i + 4096 | 0) - 4095.5;
                                ctx.beginPath();
                                ctx.arc(rx, ry, brushRadius/2, 0, Math.PI2);
                                ctx.fill();
                            }
                        }
                    },
                    point(spr) {
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
						const useDist = paint.useAlphaDist || paint.useSizeDist ? true : false;
						const repeatDist = paint.widthFade < 1 ? 1e9 : paint.widthFade;
						const lineDist = paint.lengthFade < 1 ? 1 : paint.lengthFade ** 1.5
						const lineDistTotal = lineDist * repeatDist;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var size = brushMin, brushRadius = brushMin / 2;
                        colorCurve = curves.lineColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        const fromPallet = !(paint.palletFrom === commands.paintColImage);
						const dist = (dx * dx + dy * dy) ** 0.5;
						var curDist,al;
                        var rx,ry,i;
                        var usePath = false;
                        if (!randomColor && !(useDist && paint.useSizeDist)) {
                            usePath = true;
                            pointColorFunc(ctx);
                            ctx.beginPath();
                        }
                        for (i = d.start; i < count; i += step) {
                            rx = x + dx * i;
                            ry = y + dy * i;
							curDist = d.travel + dist * i;
							if (!useDist || curDist < lineDistTotal) {
								if (useDist) {
									const distNorm = (curDist % lineDist) / lineDist;
									if (paint.useAlphaDist) {  // line width
										size = curves.lineWidth(distNorm) * brushRange + brushMin;
										brushRadius = size < 2 ? 1 : size / 2;
									}
									if (paint.useSizeDist) { // line alpha
										ctx.globalAlpha = al = curves.lineAlpha(distNorm)  * alpha;
									}
								}
								if (usePath) {
									if (brushRadius < 1) {
										ctx.rect(rx-brushRadius, ry-brushRadius, size, size);
									} else {
										ctx.arc(rx, ry, brushRadius, 0, Math.PI2);
									}
								} else {
									pointColorFunc(ctx);
									if (al > 0) {
										ctx.beginPath();
										ctx.arc(rx, ry, brushRadius, 0, Math.PI2);
										ctx.fill();
									}
								}
							}
                        }
                        if (usePath) { ctx.fill() }
                    },
                    brush(spr) {
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var brushRadius = brushMin / 2;
                        var size = brushMin;
                        var img = wCanvas1;
                        const colorCurve = curves.lineColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        const fromPallet = !(paint.palletFrom === commands.paintColImage);
                        var rx,ry,i;
                        for (i = d.start; i < count; i += step) {
                            if (paint.useAlphaDist) {
                                size = curves.lineWidth(Math.random()) * brushRange + brushMin;
                                brushRadius = size < 2 ? 1 : size / 2;
                            }
                            if (randomColor) {
                                const style =  colorModeFunc(colorRange.rgbaAt(colorCurve(Math.random()), wColor));
                                //const style = fromPallet ? colorRange.cssAt(colorCurve(Math.random())) : clLookup[clLen * Math.random() | 0];
                                renderFunctions.image.colorBrush(style);
                            }else if ( paint.colorBlend) {
                                renderFunctions.image.colorBrush( fromPallet ? colorModeFunc(colorRange.rgbaAt(colorCurve(0.5), wColor)) : colorModeFunc(colorRange.rgbaAt(colorCurve(Math.random()), wColor)))
                                //renderFunctions.image.colorBrush( fromPallet ? colorRange.cssAt(colorCurve(dist)) :  clLookup[clLen * Math.random() | 0])
                            }
                            rx = x + dx * i - brushRadius;
                            ry = y + dy * i - brushRadius;
                            ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx,ry,size,size);
                        }
                         img.ctx.globalCompositeOperation = "source-over";
                    },
                },
                spray : {
                    pixelAlias(spr) {
                        const point = renderFunctions.alias.point;
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                         const br = brushRange / 2;
                        const bm = brushMin / 2;
                        const step = d.step;
                        const count = d.count;
                        if (count > 1) {
                            gDirC = mouseBrush.directionChange * step;
                            gSpdC = mouseBrush.speedChange * step;
                        } else {
                            gDirC = mouseBrush.directionChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                            gSpdC = mouseBrush.speedChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                        }
                        gDirA = gDir  = mouseBrush.direction;
                        gSpdA = gSpd  = mouseBrush.speed-mouseBrush.speedChange;
                        const gs = guideScalingStart;
                        const gsRange = guideScaling - guideScalingStart;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var rx,ry,i,dist,ang,uDist;
                        const distCurve = curves.spraySpread;
                        ctx.lineWidth = Math.max(sprayMin / 8 + 1, 1);
                        ctx.beginPath();
                        var rad = bm + br;
                        if ((paint.useAlphaDist || paint.useSizeDist) && br !== 0) {
                            for (i = d.start; i < count; i += step) {
                                if (d.odds === 1 || Math.random() < d.odds) {
                                    const gScale = Math.abs(gs + gsRange * i);
                                    ang = Math.random() * Math.PI2;
									uDist = distCurve(Math.random());
                                    dist = ((uDist * sprayRange  + sprayMin) / 2) * gScale;
                                    rad = (curves.spraySize(uDist) * br + bm) * gScale;
                                    rx = (x + dx * i + Math.cos(ang) * dist) | 0;
                                    ry = (y + dy * i + Math.sin(ang) * dist) | 0;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (rad < 1.5) { ctx.rect(rx,ry,1,1) }
                                    else { point(ctx,rx,ry,rad) }
                                    dither ++;
                                } else {
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    dither ++;
                                }
                            }
                        } else {
                            for (i = d.start; i < count; i += step) {
                                if (d.odds === 1 || Math.random() < d.odds) {
                                    ang = Math.random() * Math.PI2;
                                    const gScale = Math.abs(gs + gsRange * i);
                                    dist = ((distCurve(Math.random()) * sprayRange  + sprayMin) / 2) * gScale;;
                                    rx = (x + dx * i + Math.cos(ang) * dist) | 0;
                                    ry = (y + dy * i + Math.sin(ang) * dist) | 0;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    const size = bm * gScale;
                                    if (size < 1.5) {
                                        ctx.rect(rx,ry,1,1);
                                    } else {
                                        point(ctx,rx,ry,size);
                                    }
                                    dither ++;
                                } else {
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                }
                            }
                        }
                        ctx.fill();
                    },
                    pixelShape(spr) {
                        const point = renderFunctions.alias.points[pens.options.pointTypes[paint.brushOptionsA]];
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        //colorCurve = curves.sprayColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        ctx.lineWidth = Math.max(sprayMin / 8 + 1, 1);
                        colorCurve = curves.lineColor;
                        const gs = guideScalingStart;
                        const gsRange = guideScaling - guideScalingStart;
                        const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                        const br = brushRange;
                        const bm = brushMin;
                        const step = d.step;
                        const count = d.count;
                        if (count > 1) {
                            gDirC = mouseBrush.directionChange * step;
                            gSpdC = mouseBrush.speedChange * step;
                        } else {
                            gDirC = mouseBrush.directionChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                            gSpdC = mouseBrush.speedChange * (1 / (step >= count ? 1 : ((1 / step) | 0) + 1));
                        }
                        gDirA = gDir  = mouseBrush.direction;
                        gSpdA = gSpd  = mouseBrush.speed-mouseBrush.speedChange;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var rx,ry,i,dist,ang,uDist,aa;
                        const distCurve = curves.spraySpread;
                        var rad = bm + br;
                        if (paint.antiAlias) {
                            for (i = d.start; i < count; i += step) {
                                if (d.odds === 1 || Math.random() < d.odds) {
                                    const gScale = Math.abs(gs + gsRange * i);
                                    ang = Math.random() * Math.PI2;
                                    dist = ((uDist = distCurve(Math.random())) * sprayRange  * gScale ) / 2;
                                    aa = alphaCurve(1-uDist) * alpha;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (aa > 0.01) {
                                        ctx.globalAlpha = aa;
                                        rad = (curves.spraySize(Math.random()) * br + bm) * gScale;
                                        pointColorFunc(ctx, uDist);
                                        rx = (x + dx * i + Math.cos(ang) * dist);
                                        ry = (y + dy * i + Math.sin(ang) * dist);
                                        point(ctx,rx,ry,rad);
                                    }
                                    dither ++;
                                } else {
                                    dither ++;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                }
                            }
                        } else {
                            for (i = d.start; i < count; i += step) {
                                if (d.odds === 1 || Math.random() < d.odds) {
                                    const gScale = Math.abs(gs + gsRange * i);
                                    ang = Math.random() * Math.PI2;
                                    dist = ((uDist = distCurve(Math.random())) * sprayRange  * gScale) / 2;
                                    aa = alphaCurve(1-uDist) * alpha;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                    if (aa> 0.01) {
                                        ctx.globalAlpha = aa;
                                        pointColorFunc(ctx, uDist);
                                        rad = (curves.spraySize(Math.random()) * br + bm) * gScale;
                                        rx = (x + dx * i + Math.cos(ang) * dist + 4096 | 0) - 4096;
                                        ry = (y + dy * i + Math.sin(ang) * dist + 4096 | 0) - 4096;
                                        point(ctx,rx,ry,rad);
                                    }
                                    dither ++;
                                } else {
                                    dither ++;
                                    gDirA += gDirC;
                                    gSpdA += gSpdC;
                                }
                            }
                        }
                    },
                    pixel(spr) {
                        if (!randomColor && !paint.useAlphaDist && !paint.colorBlend) {
                            renderFunctions.interpolate.spray.pixelAlias(spr);
                            return;
                        }
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var rx,ry,i;
                        var ang,dist,brushRadius,size,uDist;
                        const distCurve = curves.spraySpread;
                        const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                        colorCurve = curves.lineColor;
                        var aa;
                       ctx.globalAlpha = aa = alpha;
                        brushRadius = brushMin / 2;
                        const bm = brushRadius / 2, br = brushRange / 2;
                        const gs = guideScalingStart;
                        const gsRange = guideScaling - guideScalingStart;
                        //colorCurve = curves.sprayColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        for (i = d.start; i < count; i += step) {
                            if (d.odds === 1 || Math.random() < d.odds) {
                                uDist = distCurve(Math.random());
                                ctx.globalAlpha = aa = alphaCurve(1-uDist) * alpha;
                                if (aa >= 0.01) {
                                    const gScale = Math.abs(gs + gsRange * i);
                                    ang = Math.random() * Math.PI2;
                                    dist = ((uDist * sprayRange + sprayMin) / 2) * gScale;
                                    if (paint.useSizeDist) {
                                        size = curves.spraySize(uDist) * br + bm;
                                        brushRadius = size | 0;
                                    }
                                    pointColorFunc(ctx, uDist);
                                    const bRG = brushRadius * gScale;
                                    if (bRG <= 1) {
                                        rx = (x + dx * i + Math.cos(ang) * dist) | 0;
                                        ry = (y + dy * i + Math.sin(ang) * dist) | 0;
                                        ctx.fillRect(rx,ry,1,1);
                                    } else if (bRG===2) {
                                        rx = ((x + dx * i + Math.cos(ang) * dist) | 0) - 1;
                                        ry = ((y + dy * i + Math.sin(ang) * dist) | 0) - 1;
                                        ctx.fillRect(rx,ry,2,2);
                                    } else if (bRG===3) {
                                        rx = ((x + dx * i + Math.cos(ang) * dist) | 0) +0.5;
                                        ry = ((y + dy * i + Math.sin(ang) * dist) | 0) + 0.5;
                                        ctx.fillRect(rx - 0.5,ry- 1.5,1,3);
                                        ry -= 0.5;
                                        ctx.fillRect(rx - 1.5,ry,1,1);
                                        ctx.fillRect(rx + 0.5,ry,1,1);
                                    } else if (bRG===4) {
                                        rx = ((x + dx * i + Math.cos(ang) * dist) | 0);
                                        ry = ((y + dy * i + Math.sin(ang) * dist) | 0);
                                        ctx.fillRect(rx - 1,ry- 2,2,4);
                                        ry -= 1;
                                        ctx.fillRect(rx - 2,ry,1,2);
                                        ctx.fillRect(rx + 1,ry,1,2);
                                    } else if (bRG===5) {
                                        rx = ((x + dx * i + Math.cos(ang) * dist) | 0) +0.5;
                                        ry = ((y + dy * i + Math.sin(ang) * dist) | 0) + 0.5;
                                        ctx.fillRect(rx - 1.5,ry- 2.5,3,5);
                                        ry -= 1.5;
                                        ctx.fillRect(rx - 2.5,ry,1,3);
                                        ctx.fillRect(rx + 1.5,ry,1,3);
                                    } else {
                                        rx = ((x + dx * i + Math.cos(ang) * dist) | 0) + 0.5;
                                        ry = ((y + dy * i + Math.sin(ang) * dist) | 0) + 0.5;
                                        ctx.beginPath();
                                        ctx.arc(rx, ry, bRG/2, 0, Math.PI2);
                                        ctx.fill();
                                    }
                                }
                            }
                        }
                    },
                    point(spr) {
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var brushRadius = brushMin / 2;
                        var rx,ry,i,aa;
                        var ang,dist,uDist;
                        const distCurve = curves.spraySpread;
                        const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                        //colorCurve = curves.sprayColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        colorCurve = curves.lineColor;
                        const gs = guideScalingStart;
                        const gsRange = guideScaling - guideScalingStart;
                        var drawRect = ctx.fillRect.bind(ctx);
                        const bm = brushRadius / 2, br = brushRange / 2;
                        var usePath = false;
                        if (!paint.useAlphaDist && !randomColor) {
                            ctx.globalAlpha = aa = alpha;
                            drawRect = ctx.rect.bind(ctx);
                            usePath = true;
                            ctx.beginPath();
                        }
                        for (i = d.start; i < count; i += step) {
                            if (d.odds === 1 || Math.random() < d.odds) {
                                uDist = distCurve(Math.random());
                                !usePath && (ctx.globalAlpha = aa = alphaCurve(1-uDist) * alpha);
                                if (aa >= 0.01) {
                                    const gScale = Math.abs(gs + gsRange * i);
                                    if (paint.useSizeDist) {
                                        var size = curves.spraySize(uDist) * br + bm;
                                        brushRadius = size ;
                                    }
                                    ang = Math.random() * Math.PI2;
                                    dist = ((uDist * sprayRange + sprayMin) / 2) * gScale;
                                    rx = x + dx * i + Math.cos(ang) * dist;
                                    ry = y + dy * i + Math.sin(ang) * dist;
                                    pointColorFunc(ctx, uDist);
                                    const bRG = brushRadius * gScale;
                                    if (bRG <= 2) {
                                        drawRect(rx - bRG, ry -bRG, bRG * 2, bRG * 2);
                                    } else {
                                        if (usePath) {
                                            ctx.moveTo(rx + bRG/2, ry);
                                            ctx.arc(rx, ry, bRG/2, 0, Math.PI2);
                                        } else {
                                            ctx.beginPath();
                                            ctx.arc(rx, ry, bRG/2, 0, Math.PI2);
                                            ctx.fill();
                                        }
                                    }
                                }
                            }
                        }
                        if (usePath) { ctx.fill() }
                    },
                    brush(spr) {
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var brushRadius = brushMin / 2;
                        var size = brushMin;
                        var img = wCanvas1;
                        var ang,dist,aa;
                        const blendColor = paint.colorBlend;
                        const distCurve = curves.spraySpread;
                        const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat;
                        const colorCurve = curves.sprayColor;
                        const clLen = colorRange.lookupLen;
                        const clLookup = colorRange.lookup;
                        const gs = guideScalingStart;
                        const gsRange = guideScaling - guideScalingStart;
                        var rx,ry,i;
                        if (blendColor) {
                            for (i = d.start; i < count; i += step) {
                                if (d.odds === 1 || Math.random() < d.odds) {
                                    dist = distCurve(Math.random());
                                    ctx.globalAlpha = aa=alphaCurve(1-dist) * alpha;
                                    if (aa >= 0.01) {
                                        const gScale = Math.abs(gs + gsRange * i);
                                        if (paint.useSizeDist) {
                                            size = curves.spraySize(Math.random()) * brushRange + brushMin;
                                            brushRadius = size < 2 ? 1 : size / 2;
                                        }
                                        ang = Math.random() * Math.PI2;
                                        if (randomColor) {
                                            renderFunctions.image.colorBrush(colorModeFunc(colorRange.rgbaAt(colorCurve(Math.random()), wColor)))
                                        } else {
                                            renderFunctions.image.colorBrush( fromPallet ? colorModeFunc(colorRange.rgbaAt(colorCurve(dist), wColor)): colorModeFunc(colorRange.rgbaAt(colorCurve(Math.random()), wColor)))
                                        }
                                        dist = (dist * sprayRange + sprayMin)/2;
                                        rx = x + dx * i + (Math.cos(ang) * dist - brushRadius) * gScale;
                                        ry = y + dy * i + (Math.sin(ang) * dist - brushRadius) * gScale;
                                        ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx,ry,size* gScale, size* gScale);
                                    }
                                }
                            }
                        } else {
                            for (i = d.start; i < count; i += step) {
                                if (d.odds === 1 || Math.random() < d.odds) {
                                    dist = distCurve(Math.random());
                                    ctx.globalAlpha = aa = alphaCurve(1-dist) * alpha;
                                    if (aa >= 0.01) {
                                        const gScale = Math.abs(gs + gsRange * i);
                                        if (paint.useSizeDist) {
                                            size = curves.spraySize(Math.random()) * brushRange + brushMin;
                                            brushRadius = size < 2 ? 1 : size / 2;
                                        }
                                        ang = Math.random() * Math.PI2;
                                        dist = dist * sprayRange + sprayMin;
                                        rx = x + dx * i + (Math.cos(ang) * dist - brushRadius)* gScale;
                                        ry = y + dy * i + (Math.sin(ang) * dist - brushRadius)* gScale;
                                        if (randomColor) {
                                            renderFunctions.image.colorBrush( fromPallet ? colorRange.cssAt(colorCurve(Math.random())) :  clLookup[clLen * Math.random() | 0] )
                                        }
                                        ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx,ry,size* gScale,size* gScale);
                                    }
                                }
                            }
                        }
                        img.ctx.globalCompositeOperation = "source-over";
                    },
                },
                image : {
                    spray : {
                        pixel(spr) {},
                        point(spr) {},
                        brush_OLD(spr) {
                            const ctx = spr.image.ctx;
                            const d = renderFunctions.interpolate.desc;
							const imgCopyFade = paint.palletFrom === commands.paintColPallet  ? 0 : 1 - paint.pickupPower / 99;
							const recycle = paint.recycleDestination || paint.recycleColor;
							const useDist = paint.useAlphaDist || paint.useSizeDist ? true : false;
							const repeatDist = paint.widthFade + 1;
                            const lineDist = paint.lengthFade < 1 ? 1 : paint.lengthFade ** 2
                            const lineDistTotal = lineDist * repeatDist;
                            const step = d.step;
                            const count = d.count;
                            const dx = d.dx;
                            const dy = d.dy;
                            var x = d.x;
                            var y = d.y;
                            var brushRadius = brushMin / 2;
                            var size = brushMin;
                            var img = wCanvas1;
                            var xdx,xdy,ang,dist;
                            const distCurve = curves.spraySpread;
                            const dir = mouseBrush.direction;
                            const dirChange = mouseBrush.directionChange;
                            const colorCurve = curves.brushColor;
							const distTraveling = (dx * dx + dy * dy) ** 0.5;
							var curDist, al = 1;
							ctx.globalAlpha = 1;
							const smoothing = ctx.imageSmoothingEnabled;
							ctx.imageSmoothingEnabled = paint.antiAlias;
                            var rx,ry,i;
                            for (i = d.start; i < count; i += step) {
                                dist = (distCurve(Math.random()) * sprayRange) / 2;
                                ang = Math.random() * Math.PI2;
                                rx = x + dx * i + Math.cos(ang) * dist;
                                ry = y + dy * i + Math.sin(ang) * dist;
								curDist = d.travel + distTraveling * i;
								if (!useDist || curDist <= lineDistTotal) {
									if (!paint.antiAlias) {
										rx |= 0;
										ry |= 0;
									}
									if (useDist) {
										const distNorm = (curDist % lineDist) / lineDist;
										if (paint.useAlphaDist) {  // line width
											size = curves.lineWidth(distNorm) * brushRange + brushMin;
											brushRadius = size < 2 ? 1 : size / 2;
										}
										if (paint.useSizeDist) { // line alpha
											ctx.globalAlpha = al = curves.lineAlpha(distNorm);
										}
									}
									if (randomColor && fromPallet) {
										if (paint.colorBlend) {
											colorRange.rgbAt(curves.lineColor(Math.random()),wColorRGBSimple1);
											colorRange.rgbAt(curves.lineColor(Math.random()),wColorRGBSimple2);
											renderFunctions.image.createColor(colorCurve, wColorRGBSimple1, wColorRGBSimple2)
											renderFunctions.image.circleColorBrush();
										} else {
											renderFunctions.image.colorBrush(colorRange.cssAt(curves.lineColor(Math.random())));
										}
									}
									if (al * alpha > 0) {
										if (paint.useDirection) {
											const d = dirChange * i;
											xdx = Math.cos(d);
											xdy = Math.sin(d);
											ctx.setTransform(xdx,xdy,-xdy,xdx, rx, ry);
											ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,- brushRadius,- brushRadius,size,size);
											if (recycle && imgCopyFade > 0) {
												renderFunctions.image.imageDirFade(imageTopSrc,rx,ry,imgCopyFade,d,size);
												renderFunctions.image.copyToOther();
											}
										} else {
											ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx- brushRadius,ry- brushRadius,size,size);
											if (recycle && imgCopyFade > 0) {
												renderFunctions.image.imageDirFade(imageTopSrc,rx,ry,imgCopyFade,0,size);
												renderFunctions.image.copyToOther();
											}
										}
									}
								}
							}
							ctx.globalAlpha = alpha;
                            img.ctx.globalCompositeOperation = "source-over";
							ctx.imageSmoothingEnabled = smoothing;
                        },
                        brush(spr) {
                            const ctx = spr.image.ctx;
                            const d = renderFunctions.interpolate.desc;
                            const imgCopyFade = paint.palletFrom === commands.paintColPallet  ? 0 : paint.pickupPower / 99;
							const recycle = paint.recycleDestination || paint.recycleColor;
							const fromPallet = paint.palletFrom === commands.paintColPallet;
							const curveS = curveStep < 1 ? (paint.brushStep < 1 ? 1 : 1 / paint.brushStep) : curveStep;
							const useAlphaDist = paint.useAlphaDist;
							const useSizeDist = paint.useSizeDist;
                            const step = d.step;
                            const count = d.count;
                            const dx = d.dx;
                            const dy = d.dy;
                            var x = d.x;
                            var y = d.y;
							const br = brushRange * (128 / 60);
							const bm = brushMin * (128 / 60);
                            var brushRadius = bm / 2;
                            var size = bm;
                            const img = wCanvas1;
                            var xdx,xdy;
                            const dir = mouseBrush.direction - mouseBrush.directionChange;
                            const dirChange = mouseBrush.directionChange;
                            const dirChangeP = Math.abs(dirChange);
                            colorCurve = curves.brushColor;
							const distCurve = curves.spraySpread;
							const sizeCurve = curves.spraySize;
							const pickupCurve = curves.sprayColor;
							const alphaCurve = paint.useAlphaDist ? curves.sprayAlpha : curves.flat
							const pickupMax = paint.lengthFade;
							var al = alpha;
							ctx.globalAlpha = alpha;
							const smoothing = ctx.imageSmoothingEnabled;
							ctx.imageSmoothingEnabled = paint.antiAlias;
                            var rx,ry,i, rcx, rcy, k = 0, dist, ang, uDist;
                            for (i = d.start; i < count; i += step) {
								if (d.odds === 1 || Math.random() < d.odds) {
									uDist = distCurve(Math.random());
									dist = (uDist * sprayRange  + sprayMin) / 2;
									ang = Math.random() * Math.PI2;
									rx = (rcx = x + dx * i) + Math.cos(ang) * dist;
									ry = (rcy = y + dy * i) + Math.sin(ang) * dist;
									if (useAlphaDist) {
										ctx.globalAlpha = al = alphaCurve(1-uDist) * alpha;
									}
									if (useSizeDist) {
										size = sizeCurve(uDist) * br + bm;
										brushRadius = size < 2 ? 1 : size / 2;
									}
									if (randomColor && 8) {
										if (paint.colorBlend) {
											colorRange.rgbAt(curves.lineColor(Math.random()),wColorRGBSimple1);
											colorRange.rgbAt(curves.lineColor(Math.random()),wColorRGBSimple2);
											renderFunctions.image.createColor(colorCurve, wColorRGBSimple1, wColorRGBSimple2)
											renderFunctions.image.circleColorBrush();
										} else {
											renderFunctions.image.colorBrush(pointColorFunc(ctx, uDist));
										}
									}
									if (al > 0) {
										if (paint.useDirection) {
											const direct = dir + dirChange * i;
											xdx = Math.cos(direct);
											xdy = Math.sin(direct);
											ctx.setTransform(xdx,xdy,-xdy,xdx, rx, ry);
											ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,- brushRadius,- brushRadius,size,size);
											if (recycle && imgCopyFade > 0) {
												uDist = pickupCurve(Math.random());
												dist = (uDist * pickupMax) / 2;
												ang = Math.random() * Math.PI2;
												imageBrushRecycleFunction(imageTopSrc,rcx + Math.cos(ang) * dist,rcy + Math.sin(ang) * dist, imgCopyFade,direct,size);
												renderFunctions.image.copyToOther();
											}
										} else {
											ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx- brushRadius,ry- brushRadius,size,size);
											if (recycle && imgCopyFade > 0) {
												uDist = pickupCurve(Math.random());
												dist = (uDist * pickupMax) / 2;
												ang = Math.random() * Math.PI2;
												imageBrushRecycleFunction(imageTopSrc,rcx + Math.cos(ang) * dist,rcy + Math.sin(ang) * dist,imgCopyFade,0,size);
												renderFunctions.image.copyToOther();
											}
										}
									}
								}
                            }
							ctx.globalAlpha = alpha;
							ctx.imageSmoothingEnabled = smoothing;
                        }
                    },
                    point : {
                        pixel(spr) {},
                        point(spr) {},
                        brush(spr) {
                            const ctx = spr.image.ctx;
                            const d = renderFunctions.interpolate.desc;
                            const imgCopyFade = paint.palletFrom === commands.paintColPallet  ? 0 : paint.pickupPower / 99;
							const recycle = paint.recycleDestination || paint.recycleColor;
							const fromPallet = paint.palletFrom === commands.paintColPallet;
							const useDist = paint.useAlphaDist || paint.useSizeDist ? true : false;
							const repeatDist = paint.widthFade < 1 ? 1e9 : paint.widthFade;
							const lineDist = paint.lengthFade < 1 ? 1 : paint.lengthFade ** 1.5
                            const lineDistTotal = lineDist * repeatDist;
							const curveS = curveStep < 1 ? (paint.brushStep < 1 ? 1 : 1 / paint.brushStep) : curveStep;
                            const step = d.step;
                            const count = d.count;
                            const dx = d.dx;
                            const dy = d.dy;
                            var x = d.x;
                            var y = d.y;
							const br = brushRange * (128 / 60);
							const bm = brushMin * (128 / 60);
                            var brushRadius = bm / 2;
                            var size = bm;
                            var img = wCanvas1;
                            var xdx,xdy;
                            const dir = mouseBrush.direction - mouseBrush.directionChange;
                            const dirChange = mouseBrush.directionChange;
                            const dirChangeP = Math.abs(dirChange);
                            const colorCurve = curves.brushColor;
							const dist = (dx * dx + dy * dy) ** 0.5;
							var curDist, al = alpha;
							ctx.globalAlpha = alpha;
							const smoothing = ctx.imageSmoothingEnabled;
							ctx.imageSmoothingEnabled = paint.antiAlias;
                            var rx,ry,i, k = 0;
							var vStep = step;
							var start = d.start;
							if (paint.useDirection) {
								const aaS = (brushRadius * start * dirChangeP + dist * start) / (3 * curveS) ;
								start = aaS > 1 ? start / (aaS < 2560 ? aaS : 2560) : start;
								const aavS = (brushRadius * vStep * dirChangeP + dist * vStep) / (3 * curveS) ;
								vStep = aavS > 1 ? step / (aavS < 2560 ? aavS : 2560) : step;
							}
                            for (i = start; i < count; i += vStep) {
                                rx = x + dx * i;
                                ry = y + dy * i;
								curDist = d.travel + dist * i;
								if (!useDist || curDist < lineDistTotal) {
									if (!paint.antiAlias) {
										rx |= 0;
										ry |= 0;
									}
									if (useDist) {
										const distNorm = (curDist % lineDist) / lineDist;
										if (paint.useAlphaDist) {  // line width
											size = curves.lineWidth(distNorm) * br + bm;
											brushRadius = size < 2 ? 1 : size / 2;
										}
										if (paint.useSizeDist) { // line alpha
											ctx.globalAlpha = al = curves.lineAlpha(distNorm) * alpha;
										}
									}
									if (randomColor && fromPallet) {
										if (paint.colorBlend) {
											colorRange.rgbAt(curves.lineColor(Math.random()),wColorRGBSimple1);
											colorRange.rgbAt(curves.lineColor(Math.random()),wColorRGBSimple2);
											renderFunctions.image.createColor(colorCurve, wColorRGBSimple1, wColorRGBSimple2)
											renderFunctions.image.circleColorBrush();
										} else {
											renderFunctions.image.colorBrush(colorRange.cssAt(curves.lineColor(Math.random())));
										}
									}
									if (al > 0) {
										if (paint.useDirection) {
											const direct = dir + dirChange * i;
											xdx = Math.cos(direct);
											xdy = Math.sin(direct);
											ctx.setTransform(xdx,xdy,-xdy,xdx, rx, ry);
											ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,- brushRadius,- brushRadius,size,size);
											if (recycle && imgCopyFade > 0) {
												imageBrushRecycleFunction(imageTopSrc,rx,ry,imgCopyFade,direct,size);
												renderFunctions.image.copyToOther();
											}
										} else {
											ctx.drawImage(img,0,0,BRUSH_MAX_SIZE,BRUSH_MAX_SIZE,rx- brushRadius,ry- brushRadius,size,size);
											if (recycle && imgCopyFade > 0) {
												imageBrushRecycleFunction(imageTopSrc,rx,ry,imgCopyFade,0,size);
												renderFunctions.image.copyToOther();
											}
										}
									}
								}
                            }
							ctx.globalAlpha = alpha;
							ctx.imageSmoothingEnabled = smoothing;
                        }
                    }
                },
                hairs : {
                    brushPixel(spr) {
                        var hairs = specialBrushes.draw();
                        const scl = specialBrushSpeedScaleA;
                        const sclA = specialBrushSpeedScale - specialBrushSpeedScaleA;
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const point = renderFunctions.alias.point;
                        const count = d.count;
                        const steps = step >= count ? 1 : ((1 / step) | 0) + 1;
                        const dStep =  d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const rStep = d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var size = brushMin;
                        var rx,ry,i,j,x1,y1,x2,y2;
                        for (i = d.start; i < count; i += step) {
                            rx = x + dx * i;
                            ry = y + dy * i;
                            specialBrushes.currentStep(rx,ry,dStep,rStep);
							if (!d.dontPaint) {
								const ssc = specialBrushIseSpeedScale ? curves.lineWidth(scl + sclA * i) : 1;
								ctx.setTransform(ssc, 0, 0, ssc, rx - hairs.xo | 0, ry - hairs.yo | 0);
								for (j = 0; j < hairs.size; j++) {
									const h = hairs[j];
									if (!h.hide) {
										ctx.fillStyle = h.css;
										var size = h.size * guideScaling;
										size = size < 1 ? 1 : size | 0;
										const offset = -(size / 2 | 0);
										ctx.beginPath();
										ctx.rect(h.x * guideScaling + offset | 0, h.y * guideScaling + offset | 0, size, size);
										if (h.seg > 1) {
											ctx.rect(h.x1 * guideScaling + offset | 0, h.y1 * guideScaling + offset | 0, size, size);
											if (h.segs > 2) {
												ctx.rect(h.x2 * guideScaling + offset | 0, h.y2 * guideScaling + offset | 0, size, size);
												if (h.segs > 3) {
													ctx.rect(h.x3 * guideScaling + offset | 0, h.y3 * guideScaling + offset | 0, size, size);
													if (h.segs > 4) {
														ctx.rect(h.x4 * guideScaling + offset | 0, h.y4 * guideScaling + offset | 0, size, size);
													}
												}
											}
										}
										ctx.fill();
									}
								}
							}
                        }
                    },
                    brushAlias(spr) {
                        var hairs = specialBrushes.draw();
                        const scl = specialBrushSpeedScaleA;
                        const sclA = specialBrushSpeedScale - specialBrushSpeedScaleA;
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const line = renderFunctions.alias.lineQuick;
                        const step = d.step;
                        const count = d.count;
                        const steps = step >= count ? 1 : ((1 / step) | 0) + 1;
                        const dStep =  d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const rStep = d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        var size = brushMin;
                        var rx,ry,i,j,x1,y1,x2,y2;
                        for (i = d.start; i < count; i += step) {
                            rx = x + dx * i;
                            ry = y + dy * i;
                            specialBrushes.currentStep(rx,ry,dStep,rStep);
							if (!d.dontPaint) {
								const ssc = specialBrushIseSpeedScale ? curves.lineWidth(scl + sclA * i) : 1;
								ctx.setTransform(ssc, 0, 0, ssc, rx - hairs.xo | 0, ry - hairs.yo | 0);
								for (j = 0; j < hairs.size; j++) {
									const h = hairs[j];
									if (!h.hide) {
										ctx.fillStyle = h.css;
										var rec = aliasRects[h.size | 0];
										var rec = h.size < 1 ? 1 : h.size | 0;
										ctx.beginPath();
										line(ctx,h.x * guideScaling, h.y * guideScaling, h.x1 * guideScaling, h.y1 * guideScaling, rec);
										if (h.segs >= 2) {
											line(ctx,h.x1 * guideScaling, h.y1 * guideScaling, h.x2 * guideScaling, h.y2 * guideScaling, rec);
											if (h.segs >= 3) {
												line(ctx,h.x2 * guideScaling, h.y2 * guideScaling, h.x3 * guideScaling, h.y3 * guideScaling, rec);
												if (h.segs >= 4) {
													line(ctx,h.x3 * guideScaling, h.y3 * guideScaling, h.x4 * guideScaling, h.y4 * guideScaling, rec);
												}
											}
										}
										ctx.fill();
									}
								}
							}
                        }
                    },
                    brushPixelAlias(spr) {
                        var hairs = specialBrushes.draw();
                        const scl = specialBrushSpeedScaleA;
                        const sclA = specialBrushSpeedScale - specialBrushSpeedScaleA;
                        const ctx = spr.image.ctx;
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const steps = step >= count ? 1 : ((1 / step) | 0) + 1;
                        const dStep =  d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const rStep = d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        const colorCurve = curves.brushColor;
                        var rx,ry,i,j;
                        for (i = d.start; i < count; i += step) {
                            rx = x + dx * i;
                            ry = y + dy * i;
                            specialBrushes.currentStep(rx,ry,dStep,rStep);
							if (!d.dontPaint) {
								const ssc = specialBrushIseSpeedScale ? curves.lineWidth(scl + sclA * i) : 1;
								ctx.setTransform(ssc, 0, 0, ssc, rx - hairs.xo, ry - hairs.yo);
								for (j = 0; j < hairs.size; j++) {
									const h = hairs[j];
									if (!h.hide) {
										ctx.fillStyle = h.css;
										var size = h.size * guideScaling;
										var sizeh = size / 2;
										ctx.beginPath();
										ctx.rect(h.x * guideScaling - sizeh, h.y * guideScaling, size, size);
										if (h.seg > 1) {
											ctx.rect(h.x1 * guideScaling - sizeh, h.y1 * guideScaling - sizeh, size, size);
											if (h.segs > 2) {
												ctx.rect(h.x2 * guideScaling - sizeh, h.y2 * guideScaling - sizeh, size, size);
												if (h.segs > 3) {
													ctx.rect(h.x3 * guideScaling - sizeh, h.y3 * guideScaling - sizeh, size, size);
													if (h.segs > 4) {
														ctx.rect(h.x4 * guideScaling - sizeh, h.y4 * guideScaling - sizeh, size, size);
													}
												}
											}
										}
										ctx.fill();
									}
								}
							}
                        }
                    },
                    brush(spr) {
                        var hairs = specialBrushes.draw();
                        const scl = specialBrushSpeedScaleA;
                        const sclA = specialBrushSpeedScale - specialBrushSpeedScaleA;
                        const ctx = spr.image.ctx;
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        const d = renderFunctions.interpolate.desc;
                        const step = d.step;
                        const count = d.count;
                        const steps = step >= count ? 1 : ((1 /step) | 0) + 1;
                        const dStep =  d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const rStep = d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        const colorCurve = curves.brushColor;
                        var rx,ry,i,j;
                        for (i = d.start; i < count; i += step) {
                            rx = x + dx * i;
                            ry = y + dy * i;
                            specialBrushes.currentStep(rx, ry, dStep, rStep);
							if (!d.dontPaint) {
								const ssc = specialBrushIseSpeedScale ? curves.lineWidth(scl + sclA * i) : 1;
								ctx.setTransform(ssc, 0, 0, ssc, rx - hairs.xo, ry - hairs.yo);
								for (j = 0; j < hairs.size; j++) {
									const h = hairs[j];
									if (!h.hide) {
										ctx.strokeStyle = h.css;
										ctx.lineWidth = h.size;
										ctx.beginPath();
										ctx.lineTo(h.x * guideScaling, h.y * guideScaling);
										ctx.lineTo(h.x1 * guideScaling + 0.1, h.y1 * guideScaling);
										if (h.segs >= 2) {
											ctx.lineTo(h.x2 * guideScaling - 0.1 ,h.y2 * guideScaling);
											if (h.segs >= 3) {
												ctx.lineTo(h.x3 * guideScaling, h.y3 * guideScaling + 0.1);
												if (h.segs >= 4) {
													ctx.lineTo(h.x4 * guideScaling, h.y4 * guideScaling - 0.1);
												}
											}
										}
										ctx.stroke();
									}
								}
							}
                        }
                    },
                    brushArc(spr) {
                        var hairs = specialBrushes.draw();
                        const scl = specialBrushSpeedScaleA;
                        const sclA = specialBrushSpeedScale - specialBrushSpeedScaleA;
                        const ctx = spr.image.ctx;
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        const d = renderFunctions.interpolate.desc;
                        const har = hairArcResult;
                        const step = d.step;
                        const count = d.count;
                        const steps = step >= count ? 1 : ((1 / step) | 0) + 1;
                         const dStep =  d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const rStep = d.dist < 1 || brushStep > 0 ? step : 1 / steps;
                        const dx = d.dx;
                        const dy = d.dy;
                        var x = d.x;
                        var y = d.y;
                        const colorCurve = curves.brushColor;
                        var rx,ry,i,j;
                        var h2,h3;
                        var countHair = 0;
						const arcType = specialBrushes.currentStep.arcType;
                        for (i = d.start; i < count; i += step) {
                            rx = x + dx * i;
                            ry = y + dy * i;
                            specialBrushes.currentStep(rx,ry,dStep,rStep);
							if (!d.dontPaint) {
								const stringOf = specialBrushes.currentStep.stringSize;
								const ssc = specialBrushIseSpeedScale ? curves.lineWidth(scl + sclA * i) : 1;
								ctx.setTransform(ssc,0,0,ssc,rx-hairs.xo,ry-hairs.yo);
								if (arcType === 2) {
									let jj = 0;
									for (j = 0; j < hairs.size - 1; ) {
										if (stringOf <= 2) {
											let h1 = hairs[j++];
											let h2 = hairs[j++];
											if (!h1.hide) {
												ctx.strokeStyle = h1.css;
												ctx.lineWidth = h1.size;
												ctx.beginPath();
												ctx.moveTo(h1.x, h1.y);
												ctx.lineTo(h2.x, h2.y);
												ctx.stroke();
											}
											if (stringOf === 2 && j < hairs.size) {
												h1 = h2;
												h2 = hairs[j++];
												if (!h1.hide) {
													ctx.strokeStyle = h1.css;
													ctx.lineWidth = h1.size;
													ctx.beginPath();
													ctx.moveTo(h1.x, h1.y);
													ctx.lineTo(h2.x, h2.y);
													ctx.stroke();
												}
											}
										} else {
											let h1 = hairs[j+ jj ++];
											let h2 = hairs[j+ jj ++];
											let drawTail = false;
											while(jj < stringOf) {
												let h3 = hairs[j+ jj ++];
												drawTail = false;
												if (!h1.hide && !h2.hide) {
													ctx.strokeStyle = h1.css;
													ctx.lineWidth = h1.size;
													fitArc(h1.x, h1.y, h2.x, h2.y, h3.x, h3.y, har, 4000);
													ctx.beginPath();
													if (har.use) {
														if (har.r < 0) { ctx.arc(har.x,har.y,-har.r,har.start,har.end,true) }
														else { ctx.arc(har.x,har.y,har.r,har.start,har.end) }
													} else {
														ctx.lineTo(h1.x, h1.y);
														ctx.lineTo(h2.x, h2.y);
														drawTail = true;
													}
													ctx.stroke();
												}
												h1 = h2;
												h2 = h3;
											}
											if (drawTail && !h1.hide) {
												ctx.strokeStyle = h1.css;
												ctx.lineWidth = h1.size;
												ctx.beginPath();
												ctx.lineTo(h1.x, h1.y);
												ctx.lineTo(h2.x, h2.y);
												ctx.stroke();
											}
											j += stringOf;
										}
									}
								} else {
									for (j = 0; j < hairs.size; j++) {
										const h1 = hairs[j];
										if (!h1.hide) {
											ctx.strokeStyle = h1.css;
											ctx.lineWidth = h1.size;
											if (arcType === 1) { // special arc brushes
												if (h1.segs >= 3) {
													fitArc(h1.x1, h1.y1, h1.x2, h1.y2, h1.x3, h1.y3, har, 4000);
													if (har.balance > 0.15) {
														ctx.beginPath();
														if (har.use && har.balance > 0.25 && har.angle > Math.PI90 * 0.7) {
															if (har.r < 0) {
																ctx.arc(har.x,har.y,-har.r,har.start,har.end,true);
															} else {
																ctx.arc(har.x,har.y,har.r,har.start,har.end);
															}
														} else if (har.angle > Math.PI90 * 1.5) {
															ctx.lineTo(h1.x1, h1.y1);
															ctx.lineTo(h1.x2, h1.y2);
															ctx.lineTo(h1.x3, h1.y3);
														}
														ctx.stroke();
													}
												}
											} else {
												ctx.beginPath();
												if (h1.segs ===  1) {
													ctx.moveTo(h1.x, h1.y);
													ctx.lineTo(h1.x1, h1.y1);
												}
												if (h1.segs >=  2) {
													fitArc(h1.x, h1.y, h1.x1, h1.y1, h1.x2, h1.y2, har, 4000, Math.PI90, 0.33);
													if (har.use) {
														const r = Math.abs(har.r);
														ctx.moveTo(har.x + Math.cos(har.start) * r ,har.y + Math.sin(har.start) * r);
														if (har.r < 0) { ctx.arc(har.x, har.y, r, har.start, har.end,true) }
														else { ctx.arc(har.x, har.y, r, har.start, har.end) }
													} else {
														ctx.moveTo(h1.x, h1.y);
														ctx.lineTo(h1.x1, h1.y1);
														ctx.lineTo(h1.x2, h1.y2);
													}
												}
												if (h1.segs >=  3) {
													fitArc(h1.x1, h1.y1, h1.x2, h1.y2, h1.x3, h1.y3, har, 4000, Math.PI90, 0.33);
													if (har.use) {
														const r = Math.abs(har.r);
														ctx.moveTo(har.x + Math.cos(har.start) * r ,har.y + Math.sin(har.start) * r);
														if (har.r < 0) { ctx.arc(har.x, har.y, r, har.start, har.end, true) }
														else { ctx.arc(har.x, har.y, r, har.start, har.end) }
													} else {
														ctx.lineTo(h1.x3, h1.y3);
													}
												}
												if (h1.segs >=  4) {
													fitArc(h1.x2, h1.y2, h1.x3, h1.y3, h1.x4, h1.y4, har, 4000, Math.PI90, 0.33);
													if (har.use) {
														const r = Math.abs(har.r);
														ctx.moveTo(har.x + Math.cos(har.start) * r ,har.y + Math.sin(har.start) * r);
														if (har.r < 0) { ctx.arc(har.x, har.y, r, har.start, har.end,true) }
														else { ctx.arc(har.x, har.y, r, har.start, har.end) }
													} else {
														ctx.lineTo(h1.x4, h1.y4);
													}
												}
												ctx.stroke();
											}
										}
									}
								}
							}
                        }
                    }
                }
            },
            curved : (()=> {
                var dotted, dotCount, pxX, pxY, pxX1, pxY1, rad1, rad2, cctx, alias, point;
                const startAddPoints = (dot, ctx, al, pnt) => {
                    dotted = dot;
                    cctx = ctx;
                    pxX1 = pxX = undefined;
                    dotCount = 0;
                    alias =  al;
                    point = pnt;
                }
                const pointFunc = (cctx, x, y, r) => {
                    cctx.moveTo(x + r,y);
                    cctx.arc(x,y,r,0,Math.PI * 2)
                };
                // Bug fix next two functions fixes low quality rendering on chrome when rendering small number of pixel or smaller sized paths
                const addPointBug = (x, y, r) => {
                    !alias && (r |= 0);
                    if (pxX === x &&  pxY ===y && rad1 === r) { return }
                    if (pxX1 === undefined) {
                        if (pxX !== undefined) {
                            pxX1 = pxX;
                            pxY1 = pxY;
                            rad2 = r;
                        }
                    } else {
                        if (dotted) {
                            dotCount++ % 2 && cctx.fillRect(pxX1, pxY1, 1, 1);
                        } else if (alias) {
                            rad2 > 0.5 ? point(cctx, pxX1, pxY1,rad2) : cctx.fillRect(pxX1 - 0.5, pxY1 - 0.5, 1, 1);
                        } else {
                            rad2 > 1 ? point(cctx, pxX1, pxY1,rad2) : cctx.fillRect(pxX1, pxY1, 1, 1);
                        }
                        dither ++;
                        if ((x - pxX1) * (x - pxX1) > 1 || (y - pxY1) * (y - pxY1) > 1) {
                            pxX1 = pxX;;
                            pxY1 = pxY;
                            rad2 = rad1;
                        } else {  // remove a pixel
                            pxX1 = undefined;
                        }
                    }
                    pxX = x;
                    pxY = y;
                    rad1 = r;
                };
                const flushPointBug = () => {
                    if (dotted) {
                        pxX1 !== undefined && ((dotCount++ % 2 &&  cctx.fillRect(pxX1, pxY1, 1, 1)), dither ++);
                        pxX !== undefined && ((dotCount++ % 2 &&  cctx.fillRect(pxX, pxY, 1, 1)), dither ++);
                    } else if (alias) {
                        pxX1 !== undefined && ((rad2 > 0.5 ? point(cctx, pxX1, pxY1,rad2) : cctx.fillRect(pxX1 - 0.5, pxY1 - 0.5, 1, 1)), dither ++);
                        pxX !== undefined && ((rad1 > 0.5 ? point(cctx, pxX, pxY,rad1) : cctx.fillRect(pxX - 0.5, pxY - 0.5, 1, 1)), dither ++);
                    } else {
                        pxX1 !== undefined && ((rad2 > 1 ? point(cctx, pxX1, pxY1,rad2) : cctx.fillRect(pxX1, pxY1, 1, 1)), dither ++);
                        pxX !== undefined && ((rad1 > 1 ? point(cctx, pxX, pxY,rad1) : cctx.fillRect(pxX, pxY, 1, 1)), dither ++);
                    }
                }
                const addPointNorm = (x, y, r) => {
                    !alias && (r |= 0);
                    if (pxX === x &&  pxY ===y && rad1 === r) { return }
                    if (pxX1 === undefined) {
                        if (pxX !== undefined) {
                            pxX1 = pxX;
                            pxY1 = pxY;
                            rad2 = r;
                        }
                    } else {
                        if (dotted) {
                            dotCount++ % 2 && cctx.rect(pxX1, pxY1, 1, 1);
                        } else if (alias) {
                            rad2 > 0.5 ? point(cctx, pxX1, pxY1,rad2) : cctx.rect(pxX1 - 0.5, pxY1 - 0.5, 1, 1);
                        } else {
                            rad2 > 1 ? point(cctx, pxX1, pxY1,rad2) : cctx.rect(pxX1, pxY1, 1, 1);
                        }
                        dither ++;
                        if ((x - pxX1) * (x - pxX1) > 1 || (y - pxY1) * (y - pxY1) > 1) {
                            pxX1 = pxX;;
                            pxY1 = pxY;
                            rad2 = rad1;
                        } else {  // remove a pixel
                            pxX1 = undefined;
                        }
                    }
                    pxX = x;
                    pxY = y;
                    rad1 = r;
                };
                const flushPointNorm = () => {
                    if (dotted) {
                        pxX1 !== undefined && ((dotCount++ % 2 &&  cctx.rect(pxX1, pxY1, 1, 1)), dither ++);
                        pxX !== undefined && ((dotCount++ % 2 &&  cctx.rect(pxX, pxY, 1, 1)), dither ++);
                    } else if (alias) {
                        pxX1 !== undefined && ((rad2 > 0.5 ? point(cctx, pxX1, pxY1,rad2) : cctx.rect(pxX1 - 0.5, pxY1 - 0.5, 1, 1)), dither ++);
                        pxX !== undefined && ((rad1 > 0.5 ? point(cctx, pxX, pxY,rad1) : cctx.rect(pxX - 0.5, pxY - 0.5, 1, 1)), dither ++);
                    } else {
                        pxX1 !== undefined && ((rad2 > 1 ? point(cctx, pxX1, pxY1,rad2) : cctx.rect(pxX1, pxY1, 1, 1)), dither ++);
                        pxX !== undefined && ((rad1 > 1 ? point(cctx, pxX, pxY,rad1) : cctx.rect(pxX, pxY, 1, 1)), dither ++);
                    }
                }
                return {
                    show(spr) {
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        ctx.beginPath();
                        curved.eachLocal(p => ctx.rect(p[6]|0,p[7]|0,1,1));
                        ctx.fill();
                    },
                    pixelAlias(spr) { // smooth alias
                        const point = renderFunctions.alias.point;
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        const len = curved.length;  // approx pixel length
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        const br = brushRange / 2;
                        const bm = brushMin / 2
                        const dotted = bm === 0.5 && br === 0;
                        var dotCount = 0;
                        const spaceCurve = curves.lineAlpha;
                        const useSpaceCurve = paint.useSpeed;
                        const widthCurve = curves.lineWidth;
                        var segs,segFrom,segStart = 0;
                        const sizeIt = paint.sizeBlend;
                        var pixPSeg =  Math.max(1,paint.brushStep);
                        var i,j,x,y,pos,p,p1,sx,sy,dx,dy,dist,distRange;
                        var pxX, pxY, pxX1, pxY1, rad1, rad2;
                        const addPoint = (x, y, r) => {
                            r |= 0
                            if (pxX === x &&  pxY ===y && rad1 === r) { return }
                            if (pxX1 === undefined) {
                                if (pxX !== undefined) {
                                    pxX1 = pxX;
                                    pxY1 = pxY;
                                    rad2 = r;
                                }
                            } else {
                                if (dotted) {
                                    dotCount++ % 2 && ctx.rect(pxX1, pxY1, 1, 1);
                                } else {
                                    rad2 > 1 ? point(ctx, pxX1, pxY1,rad2) : ctx.rect(pxX1, pxY1, 1, 1);
                                }
                                dither ++;
                                if ((x - pxX1) * (x - pxX1) > 1 || (y - pxY1) * (y - pxY1) > 1) {
                                    pxX1 = pxX;;
                                    pxY1 = pxY;
                                    rad2 = rad1;
                                } else {  // remove a pixel
                                    pxX1 = undefined;
                                }
                            }
                            pxX = x;
                            pxY = y;
                            rad1 = r;
                        };
                        const flusHPoint = () => {
                            if (dotted) {
                                pxX1 !== undefined && ((dotCount++ % 2 &&  ctx.rect(pxX1, pxY1, 1, 1)), dither ++);
                                pxX !== undefined && ((dotCount++ % 2 &&  ctx.rect(pxX, pxY, 1, 1)), dither ++);
                            } else {
                                pxX1 !== undefined && ((rad2 > 1 ? point(ctx, pxX1, pxY1,rad2) : ctx.rect(pxX1, pxY1, 1, 1)), dither ++);
                                pxX !== undefined && ((rad1 > 1 ? point(ctx, pxX, pxY,rad1) : ctx.rect(pxX, pxY, 1, 1)), dither ++);
                            }
                        }
                        ctx.beginPath();
                        if (len < 0.7) {  // no line defined so draw what is seen via the pen feedback
                            renderFunctions.alias.pointAll(ctx,(spr.key.lx + 4096 | 0)- 4096,(spr.key.ly + 4096 | 0) - 4096,bm);
                        }else if (count > 0) {
                            for (i = 0; i < count-1; i ++) {
                                p = points[i];
                                p1 = points[i + 1];
                                sx = p[6];
                                sy = p[7];
                                dx = p1[6] - sx;
                                dy = p1[7] - sy;
                                dist = p[4];
                                distRange = p1[4] - dist;
                                segs = 1 / (distRange/pixPSeg);
                                segFrom = segStart / distRange;
                                for (j = segFrom; j < 1; j +=segs) {
                                    const jj = useSpaceCurve ? spaceCurve(j) : j;
                                    pos = dist + distRange * jj;
                                    const rad = sizeIt ? (widthCurve(pos / len) * br + bm) : bm;
                                    x = (dx * jj + sx + 4096 | 0) - 4096;
                                    y = (dy * jj + sy + 4096 | 0) - 4096;
                                    addPoint(x,y,rad);
                                }
                                segStart = distRange * j - distRange;
                            }
                        }
                        flusHPoint();
                        if (paint.fillMode !== fillModes.fillOpen) {
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.strokeStyle = secondColor;
                            }
                            ctx.fillStyle = ctx.strokeStyle;
                            ctx.fill();
                        }
                    },
                    pixel(spr) {  // smooth anti alias
                        const point = renderFunctions.alias.point;
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        const len = curved.length;  // approx pixel length
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        const br = brushRange / 4;
                        const bm = brushMin / 4;
                        const spaceCurve = curves.lineAlpha;
                        const useSpaceCurve = paint.useSpeed;
                        const widthCurve = curves.lineWidth;
                        var segs,segFrom,segStart = 0;
                        const sizeIt = paint.sizeBlend;
                        var pixPSeg =  Math.max(1,paint.brushStep);
                        var i,j,x,y,pos,p,p1,sx,sy,dx,dy,dist,distRange;
                        ctx.beginPath();
                        if (len < 0.7) {  // no line defined so draw what is seen via the pen feedback
                            renderFunctions.antiAlias.point(ctx,spr.key.lx,spr.key.ly,bm * 2);
                        }else if (count > 0) {
                            for (i = 0; i < count-1; i ++) {
                                p = points[i];
                                p1 = points[i + 1];
                                sx = p[6];
                                sy = p[7];
                                dx = p1[6] - sx;
                                dy = p1[7] - sy;
                                dist = p[4];
                                distRange = p1[4] - dist;
                                segs = 1 / (distRange/pixPSeg);
                                segFrom = segStart / distRange;
                                for (j = segFrom; j < 1; j +=segs) {
                                    const jj = useSpaceCurve ? spaceCurve(j) : j;
                                    pos = dist + distRange * jj;
                                    const rad = sizeIt ? (widthCurve(pos / len) * br + bm) : bm;
                                    x = (dx * jj + sx);
                                    y = (dy * jj + sy);
                                    ctx.moveTo(x+rad,y);
                                    ctx.arc(x,y,rad,0,Math.PI2);
                                }
                                segStart = distRange * j - distRange;
                            }
                        }
                        if (paint.fillMode !== fillModes.fillOpen) {
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.strokeStyle = secondColor;
                            }
                            ctx.fillStyle = ctx.strokeStyle;
                            ctx.fill();
                        }
                    },
                    lines(spr) {  // experimental
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        const len = curved.length;  // approx pixel length
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        const br = brushRange / 4;
                        const bm = brushMin / 4;
                        const widthCurve = curves.lineWidth;
                        const sizeIt = paint.sizeBlend;
                        var i;
                        ctx.beginPath();
                        for (i = 0; i < count; i ++) {
                            const p = points[i];
                            const rad = sizeIt ? (widthCurve (p[4] / len) * br + bm) : bm;
                            const x = p[6];
                            const y = p[7];
                            ctx.moveTo(x+rad,y);
                            ctx.arc(x,y,rad,0,Math.PI2);;
                        }
                        ctx.fillStyle = ctx.strokeStyle;
                        ctx.fill();
                    },
                    fillShape(spr) { // smooth shape (NOT COMPLETE)
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        var len = 0;
                        ctx.beginPath();
                        curved.eachLocal(p => ctx.lineTo(p[6],p[7]));
                        if (paint.fillMode >= fillModes.fillOpen) {
                            ctx.fill();
                        }
                        if (paint.fillMode !== fillModes.fillOpen) {
                            ctx.lineWidth = brushMin/4;
                            ctx.lineJoin = "round";
                            ctx.lineCap = "round";
                            ctx.globalCompositeOperation = secondDrawMode;
                            ctx.strokeStyle = secondColor;
                            ctx.stroke();
                        }
                    },
                    circles1(spr) {  // experimental
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        var len = 0;
                        len = curved.length;
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        if (count > 0) {
                        var x = 0, y = 0;
                        ctx.beginPath();
                        ctx.moveTo(points[0][7],points[0][8]);
                        for (var i = 0; i < count; i+=1) {
                           // const p1 = points[i-1];
                            const p1 = points[i];
                            var  r = p1[4];
                            if (r !== 0) {
                            var dir = r < -1 ? true : r > 1 ? false : 0;
                            r = Math.abs(r);
                            if (dir !== 0) {
                                x = Math.cos(p1[5]) * r;
                                y = Math.sin(p1[5]) * r;
                                ctx.moveTo(p1[9] + x, p1[10] + y);
                                ctx.arc(p1[9],p1[10],r,p1[5],p1[6],dir);
                            }else if (i < count-1) {
                                ctx.moveTo(p1[7] , p1[8] );
                                const p2 = points[i+1];
                                ctx.lineTo(p2[7] , p2[8] );
                            }
                            } else {
                                ctx.moveTo(p1[7] , p1[8] );
                                if (i < count-1) {
                                    const p2 = points[i+1];
                                    ctx.lineTo(p2[7] , p2[8] );
                                }
                            }
                        }
                        ctx.lineTo(points[count-1][7],points[count-1][8]);
                        if (paint.fillMode >= fillModes.fillOpen) {
                            ctx.fill();
                        }
                        if (paint.fillMode !== fillModes.fillOpen) {
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.strokeStyle = secondColor;
                            }
                            ctx.stroke();
                        }
                        }
                    },
                    circlesFill(spr) { // circle shape (NOT COMPLETE)
                        const ctx = spr.image.ctx;
                        curved.pointsToLocal(spr);
                        const len = curved.length;  // approx pixel length
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        var r1,r2,p1,p2,cx1,cy1,cx2,cy2,x,y,dx,dy;
                        var j,segFrom, segs,segStart = 0;
                        var distRange,dist,pos,da1,da2,aa1,bb1,back,forward,pixPSeg;
                        if (count > 0) {
                            ctx.beginPath();
                            const end = count - 2;
                            pixPSeg =  Math.max(1,paint.brushStep);
                            for (var i = 0; i < count-1; i+=1) {
                                back = false;
                                forward = false;
                                p2 = points[i];
                                if (i === 0) {
                                    p1 = p2;
                                    forward = true;
                                } else {p1 = points[i - 1]}
                                if (i === end) {
                                    p2 = p1;
                                    back = true;
                                }
                                r1 = Math.abs(p1[4]);
                                r2 = Math.abs(p2[4]);
                                if (r1 < 1) { forward = true }
                                if (r2 < 1) { back = true }
                                dist = points[i][12];
                                if (forward && back) {  // straight segment
                                    if (i < count-1) { distRange  = points[i+1][12] - dist }
                                    else { distRange  = len - dist  }
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    cx1 = points[i][7];
                                    cy1 = points[i][8];
                                    cx2 = points[i+1][7];
                                    cy2 = points[i+1][8];
                                    dx = cx2 - cx1;
                                    dy = cy2 - cy1;
                                    for (j = segFrom; j < 1; j +=segs) {
                                        x = dx * j + cx1;
                                        y = dy * j + cy1;
                                        ctx.lineTo(x,y);
                                    }
                                }else if (forward || back) { // single arc
                                    if (back) {
                                        aa1 = p1[11];
                                        da1 = p1[6] - aa1;
                                        cx1 = p1[9];
                                        cy1 = p1[10];
                                    } else {
                                        aa1 = p2[5];
                                        da1 = p2[11] - aa1;
                                        cx1 = p2[9];
                                        cy1 = p2[10];
                                        r1 = r2;
                                    }
                                    distRange = Math.abs(r1 * da1);
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    for (j = segFrom; j < 1; j +=segs) {
                                        const a1 = aa1 + da1 * j;
                                        x = Math.cos(a1) * r1 + cx1;
                                        y = Math.sin(a1) * r1 + cy1;
                                        ctx.lineTo(x,y);
                                    }
                                } else {  // double arc
                                    cx1 = p1[9];
                                    cy1 = p1[10];
                                    cx2 = p2[9];
                                    cy2 = p2[10];
                                    aa1 = p1[11];
                                    da1 = p1[6] - aa1;
                                    bb1 = p2[5];
                                    da2 = p2[11] - bb1;
                                    distRange = (Math.abs(r1 * da1) + Math.abs(r2 * da2)) / 2;
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    for (j = segFrom; j < 1; j += segs) {
                                        const a1 = aa1 + da1 * j;
                                        const a2 = bb1 + da2 * j;
                                        const jMix = 1-j;
                                        x = jMix * (Math.cos(a1) * r1 + cx1) + j * (Math.cos(a2) * r2 + cx2);
                                        y = jMix * (Math.sin(a1) * r1 + cy1) + j * (Math.sin(a2) * r2 + cy2);
                                        ctx.lineTo(x,y);
                                    }
                                }
                                segStart = distRange * j - distRange;
                            }
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.fill();
                            }
                            if (paint.fillMode !== fillModes.fillOpen) {
                                ctx.lineWidth = brushMin/4;
                                ctx.lineJoin = "round";
                                ctx.lineCap = "round";
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.strokeStyle = secondColor;
                                ctx.stroke();
                            }
                        }
                    },
                    circles(spr) { // circle anti alias
                        if (paint.widthFade <= 3) {
                            API.curved.simple(spr,false);
                            return;
                        }
                        const ctx = spr.image.ctx;
                        spr.key.toLocalP(0,0,workPointA);
                        ctx.setTransform(spr.key.im[0],spr.key.im[1],spr.key.im[2],spr.key.im[3],workPointA.x,workPointA.y);
                        const len = curved.length;  // approx pixel length
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        const spaceCurve = curves.lineAlpha;
                        const useSpaceCurve = paint.useSpeed;
                        const widthCurve = curves.lineWidth;
                        const spreadCurve = curves.brushAlpha;
                        const spreadCenterCurve = curves.brushColor;
                        const mixCurve = curves.spraySize;
                        const bm = Math.max(0.5, brushMin / 4);
                        const br =  brushRange / 4;
                        const repDist = paint.lengthFade * 2;
                        const sizeIt = paint.sizeBlend;
                        const spreadIt = !sizeIt;
                        var r1,r2,p1,p2,cx1,cy1,cx2,cy2,x,y,dx,dy;
                        var j,segFrom, segs,segStart = 0, jj;
                        var distRange,dist,pos,da1,da2,aa1,bb1,back,forward,pixPSeg;
                        var px,py,nx,ny,dn,u,uu,c= 0;
                        px = points[0][0];
                        py = points[0][1];
                        /*if (paint.fillMode !== fillModes.fillOpen) {
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.strokeStyle = secondColor;
                            }
                            ctx.fillStyle = ctx.strokeStyle;
                        }*/
                        startAddPoints(bm <= 1 && br === 0, ctx, true, pointFunc);
                        var flushPoint = flushPointNorm;
                        var addPoint = addPointNorm;
                        var bug = false;
                        ctx.fillStyle = ctx.strokeStyle;
                        ctx.beginPath();
                        if (len < 0.7) {  // no line defined so draw what is seen via the pen feedback
                            renderFunctions.antiAlias.point(spr.image.ctx, points[0][0], points[0][1],bm * 2);
                        }else if (count > 0) {
                            //if (spreadIt || br > 0  || bm > 1) {//  || len > 32) {
                                ctx.beginPath();
                            //} else {
                            //    flushPoint = flushPointBug;
                            //    addPoint = addPointBug;
                            //    bug = true;
                            //}
                            const end = count - 2;
                            pixPSeg =  Math.max(1,paint.brushStep);
                            for (var i = 0; i < count-1; i+=1) {
                                back = false;
                                forward = false;
                                p2 = points[i];
                                if (i === 0) {
                                    p1 = p2;
                                    forward = true;
                                } else {p1 = points[i - 1]}
                                if (i === end) {
                                    p2 = p1;
                                    back = true;
                                }
                                r1 = Math.abs(p1[4]);
                                r2 = Math.abs(p2[4]);
                                if (r1 < 1) { forward = true }
                                if (r2 < 1) { back = true }
                                dist = points[i][12];
                                if (i < count-1) { distRange  = points[i+1][12] - dist }
                                else { distRange  = len - dist  }
                                cx1 = points[i][0];
                                cy1 = points[i][1];
                                cx2 = points[i+1][0];
                                cy2 = points[i+1][1];
                                dx = cx2 - cx1;
                                dy = cy2 - cy1;
                                var dn = (dx * dx + dy * dy) ** 0.5;
                                if (dn < r1 / 12 || dn < r2 / 12) {
                                    forward = back = true;
                                }
                                if (forward && back) {  // straight segment
                                    if (i < count-1) { distRange  = points[i+1][12] - dist }
                                    else { distRange  = len - dist  }
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    if (spreadIt) {
                                        nx = - dy / dn;
                                        ny = dx / dn;
                                        segs/= circleBrushSpreadSubStep; segFrom /= circleBrushSpreadSubStep;
                                       for (j = segFrom; j < 1; j +=segs) {
                                            jj = useSpaceCurve ? spaceCurve(j) : j;
                                            pos = dist + distRange * jj;
                                            u = pos / len;
                                            uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                            const rad = widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1) * 2;
                                            x = dx * jj + cx1 + nx * rad ;
                                            y = dy * jj + cy1 + ny * rad ;
                                            px = x;
                                            py = y;
                                            if (bm < 1.5) {
                                                ctx.rect(x - bm * 0.707, y - bm  * 0.707, bm * 1.414, bm * 1.414);
                                            } else {
                                                ctx.moveTo(x + bm, y);
                                                ctx.arc(x, y, bm, 0, Math.PI2);
                                            }
                                        }
                                    } else {
                                        for (j = segFrom; j < 1; j +=segs) {
                                            jj = useSpaceCurve ? spaceCurve(j) : j;
                                            pos = dist + distRange * jj;
                                            u = pos / len;
                                            uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                            const rad = br > 0 ? (widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1)  + bm) : bm;
                                            x = dx * jj + cx1;
                                            y = dy * jj + cy1;
                                            addPoint(x,y, rad < 0.5 ? 0.5 : rad);
                                            /*if (rad < 0.5) {
                                                ctx.moveTo(x + 0.5, y);
                                                ctx.arc(x, y, 0.5, 0, Math.PI2);
                                            } else {
                                                ctx.moveTo(x + rad, y);
                                                ctx.arc(x, y, rad, 0, Math.PI2);
                                            }*/
                                        }
                                    }
                                }else if (forward || back) { // single arc
                                    if (back) {
                                        aa1 = p1[11];
                                        da1 = p1[6] - aa1;
                                        cx1 = p1[2];
                                        cy1 = p1[3];
                                    } else {
                                        aa1 = p2[5];
                                        da1 = p2[11] - aa1;
                                        cx1 = p2[2];
                                        cy1 = p2[3];
                                        r1 = r2;
                                    }
                                    const dR = distRange;
                                    distRange = Math.abs(r1 * da1);
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    if ((1 - segFrom) / segs < 6000) {  // Large radius can cause the need to render too many points. For now just ignor
                                        if (spreadIt) {
                                            segs /= circleBrushSpreadSubStep;
                                            segFrom /= circleBrushSpreadSubStep;
                                            for (j = segFrom; j < 1; j +=segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1;
                                                uu = c % 2 ? 1 - uu : uu;
                                                const rad = widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1) * 2;
                                                const a1 = aa1 + da1 * jj;
                                                x = Math.cos(a1) * r1 + cx1;
                                                y = Math.sin(a1) * r1 + cy1;
                                                nx = x - px;
                                                ny = y - py;
                                                dn = Math.sqrt(nx * nx + ny * ny)
                                                px = x;
                                                py = y;
                                                x += -(ny / dn) * rad;
                                                y += (nx / dn) * rad;
                                                if (bm < 1.5) {
                                                    ctx.rect(x - bm * 0.707, y - bm  * 0.707, bm * 1.414, bm * 1.414);
                                                } else {
                                                    ctx.moveTo(x + bm, y);
                                                    ctx.arc(x, y, bm, 0, Math.PI2);
                                                }
                                            }
                                        } else {
                                            for (j = segFrom; j < 1; j +=segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1;
                                                uu = c % 2 ? 1 - uu : uu;
                                                const rad = br > 0 ? (widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1)  + bm) : bm;
                                                const a1 = aa1 + da1 * jj;
                                                x = Math.cos(a1) * r1 + cx1;
                                                y = Math.sin(a1) * r1 + cy1;
                                                addPoint(x,y, rad < 0.5 ? 0.5 : rad);
                                                /*if (rad < 0.5) {
                                                    ctx.moveTo(x + 0.5, y);
                                                    ctx.arc(x, y, 0.5, 0, Math.PI2);
                                                } else {
                                                    ctx.moveTo(x + rad, y);
                                                    ctx.arc(x, y, rad, 0, Math.PI2);
                                                }*/
                                            }
                                        }
                                    } else { j = 1 }
                                } else {  // double arc
                                    cx1 = p1[2];
                                    cy1 = p1[3];
                                    cx2 = p2[2];
                                    cy2 = p2[3];
                                    aa1 = p1[11];
                                    da1 = p1[6] - aa1;
                                    bb1 = p2[5];
                                    da2 = p2[11] - bb1;
                                    const dR = distRange;
                                    distRange = (Math.abs(r1 * da1) + Math.abs(r2 * da2)) / 2;
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    if ((1 - segFrom) / segs < 6000) {  // Large radius can cause the need to render too many points. For now just ignor
                                        if (spreadIt) {
                                            segs/= circleBrushSpreadSubStep; segFrom /= circleBrushSpreadSubStep;
                                            for (j = segFrom; j < 1; j += segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                                const rad = widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1) * 2;
                                                const a1 = aa1 + da1 * jj;
                                                const a2 = bb1 + da2 * jj;
                                                const jMix = 1 - (jj = mixCurve(jj));
                                                x = jMix * (Math.cos(a1) * r1 + cx1) + jj * (Math.cos(a2) * r2 + cx2);
                                                y = jMix * (Math.sin(a1) * r1 + cy1) + jj * (Math.sin(a2) * r2 + cy2);
                                                nx = x - px;
                                                ny = y - py;
                                                dn = Math.sqrt(nx * nx + ny * ny)
                                                px = x;
                                                py = y;
                                                x += -(ny / dn) * rad;
                                                y += (nx / dn) * rad;
                                                if (bm < 1.5) {
                                                     ctx.rect(x - bm * 0.707, y - bm  * 0.707, bm * 1.414, bm * 1.414);
                                                } else {
                                                    ctx.moveTo(x + bm, y);
                                                    ctx.arc(x, y, bm, 0, Math.PI2);
                                                }
                                            }
                                        } else {
                                            for (j = segFrom; j < 1; j += segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                                const rad = br > 0 ? (widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1)  + bm) : bm;
                                                const a1 = aa1 + da1 * jj;
                                                const a2 = bb1 + da2 * jj;
                                                const jMix = 1 - (jj = mixCurve(jj));
                                                x = jMix * (Math.cos(a1) * r1 + cx1) + jj * (Math.cos(a2) * r2 + cx2);
                                                y = jMix * (Math.sin(a1) * r1 + cy1) + jj * (Math.sin(a2) * r2 + cy2);
                                                addPoint(x,y, rad < 0.5 ? 0.5 : rad);
                                                /*if (rad < 0.5) {
                                                    ctx.moveTo(x + 0.5, y);
                                                    ctx.arc(x, y, 0.5, 0, Math.PI2);
                                                } else {
                                                    ctx.moveTo(x + rad, y);
                                                    ctx.arc(x, y, rad, 0, Math.PI2);
                                                }*/
                                            }
                                        }
                                    } else { j = 1 }
                                }
                                segStart = distRange * j - distRange;
                            }
                            flushPoint();
                        }
                        !bug && ctx.fill();
                    },
                    simple(spr,alias) { // points too close for smoothing so treat as simple point list
                        const point = renderFunctions.alias.point;
                        const ctx = spr.image.ctx;
                        spr.key.toLocalP(0,0,workPointA);
                        if (alias) { ctx.setTransform(spr.key.im[0],spr.key.im[1],spr.key.im[2],spr.key.im[3],Math.round(workPointA.x),Math.round(workPointA.y)) }
                        else { ctx.setTransform(spr.key.im[0],spr.key.im[1],spr.key.im[2],spr.key.im[3],workPointA.x,workPointA.y) }
                        const len = curved.length;
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        const spaceCurve = curves.lineAlpha;
                        const useSpaceCurve = paint.useSpeed;
                        const widthCurve = curves.lineWidth;
                        const spreadCurve = curves.brushAlpha;
                        const spreadCenterCurve = curves.brushColor;
                        const repDist = paint.lengthFade * 2;
                        const sizeIt = paint.sizeBlend;
                        const spreadIt = !sizeIt
                        var p1,x,y,dx,dy,u,uu,c=0,nx,ny,px,py,dn,p2;
                        px =  points[0][0];
                        py =  points[0][1];
                        var distRange,dist,pos;
                        const br = brushRange / (alias ? 2 : 4);
                        const bm = Math.max(0.5,brushMin / (alias ? 2 : 4));
                        startAddPoints(bm === 0.5 && br === 0, ctx, !alias, alias ? point : pointFunc );
                        var flushPoint = flushPointNorm;
                        var addPoint = addPointNorm;
                        var bug = false;
                        ctx.fillStyle = ctx.strokeStyle;
                        if (len < 0.7) {  // no line defined so draw what is seen via the pen feedback
                            ctx.beginPath();
                            if (alias) {
                                renderFunctions.alias.pointAll(spr.image.ctx,(points[0][0] + 4096 | 0) - 4096,(points[0][1] + 4096 | 0) - 4096,bm);
                            } else {
                                renderFunctions.antiAlias.point(spr.image.ctx,points[0][0],points[0][1],bm * 2);
                            }
                        } else {
                            if (spreadIt || !alias || bm > 1  || len > 32) {
                                ctx.beginPath();
                            } else {
                                flushPoint = flushPointBug;
                                addPoint = addPointBug;
                                bug = true;
                            }
                            var pixPSeg =  Math.max(1,paint.brushStep);
                            if (spreadIt) {
                                 if (alias) {
                                    for (var i = 0; i < count; i += 1) {
                                        const segDist = i === count -1 ? circleBrushSpreadSubStepUnit : 1;
                                        p1 = points[i];
                                        p2 = points[i + (i===count-1 ? 0 : 1)];
                                        for (let k = 0; k < segDist; k += circleBrushSpreadSubStepUnit) {
                                            dist = ((p2[4] - p1[4]) * k + p1[4]) / len;
                                            x = ((p2[0] - p1[0]) * k + p1[0]);//p1[0];
                                            y = ((p2[1] - p1[1]) * k + p1[1]);//p1[1];
                                            u = pos / len;
                                            uu = (c++ / ( repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                            const rad = widthCurve(dist) * spreadCurve(dist)  * br * (curves.brushColor(uu) *  2 - 1);
                                            nx = x - px;
                                            ny = y - py;
                                            dn = Math.sqrt(nx * nx + ny * ny)
                                            px = x;
                                            py = y;
                                            x += -(ny / dn) * rad;
                                            y += (nx / dn) * rad;
                                            x = (x + 4096 | 0) - 4096;
                                            y = (y + 4096 | 0) - 4096;
                                            if ( bm < 1.5) { ctx.rect(x,y,1,1) }
                                            else { point(ctx,x,y,bm) }
                                            dither ++;
                                        }
                                    }
                                } else {
                                    for (var i = 0; i < count; i += 1) {
                                        const segDist = i === count -1 ? circleBrushSpreadSubStepUnit : 1;
                                        p1 = points[i];
                                        p2 = points[i + (i===count-1 ? 0 : 1)];
                                        for (let k = 0; k < segDist; k += circleBrushSpreadSubStepUnit) {
                                            dist = ((p2[4] - p1[4]) * k + p1[4]) / len;
                                            x = ((p2[0] - p1[0]) * k + p1[0]);//p1[0];
                                            y = ((p2[1] - p1[1]) * k + p1[1]);//p1[1];
                                            uu = (c++ / ( repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                            const rad = widthCurve(dist) * spreadCurve(dist)  * br * (curves.brushColor(uu) *  2 - 1) * 2;
                                            nx = x - px;
                                            ny = y - py;
                                            dn = Math.sqrt(nx * nx + ny * ny)
                                            px = x;
                                            py = y;
                                            x += -(ny / dn) * rad;
                                            y += (nx / dn) * rad;
                                            ctx.moveTo(x+bm,y);
                                            ctx.arc(x,y,bm,0,Math.PI2);
                                        }
                                    }
                                }
                            } else {
                                if (alias) {
                                    for (var i = 0; i < count; i += 1) {
                                        p1 = points[i];
                                        dist = p1[4] / len;
                                        x = (p1[0] + 4096 | 0) - 4096;
                                        y = (p1[1] + 4096 | 0) - 4096;
                                        uu = (c++ / ( repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                        const rad = br > 0 ? (widthCurve(dist) * spreadCurve(dist)  * br * (curves.brushColor(uu) *  2 - 1)  + bm) : bm;
                                        addPoint(x, y, rad);
                                    }
                                    flushPoint();
                                } else {
                                    for (var i = 0; i < count; i += 1) {
                                        p1 = points[i];
                                        dist = p1[4] / len;
                                        x = p1[0];
                                        y = p1[1];
                                        uu = (c++ / ( repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                        var rad = br > 0 ? (widthCurve(dist) * spreadCurve(dist)  * br * (curves.brushColor(uu) *  2 - 1)  + bm) : bm;
                                        rad = rad < 0.5 ? 0.5 : rad;
                                        ctx.moveTo(x+rad,y);
                                        ctx.arc(x,y,rad,0,Math.PI2);
                                    }
                                }
                            }
                        }
                        if  (!bug)  {
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.fill();
                            }
                            if (paint.fillMode !== fillModes.fillOpen) {
                                if (paint.fillMode >= fillModes.fillOpen) {
                                    ctx.globalCompositeOperation = secondDrawMode;
                                    ctx.strokeStyle = secondColor;
                                }
                                ctx.fillStyle = ctx.strokeStyle;
                                ctx.fill();
                            }
                        }
                    },
                    circlesAlias(spr) { // circle alias
                        if (paint.widthFade <= 3) {
                            API.curved.simple(spr,true);
                            return;
                        }
                        const point = renderFunctions.alias.point;
                        const ctx = spr.image.ctx;
                        spr.key.toLocalP(0,0,workPointA);
                        ctx.setTransform(spr.key.im[0],spr.key.im[1],spr.key.im[2],spr.key.im[3],Math.round(workPointA.x),Math.round(workPointA.y));
                        const len = curved.length;  // approx pixel length
                        const line = curved.line;
                        const points = line.points;
                        var count = line.count;
                        const spaceCurve = curves.lineAlpha;
                        const useSpaceCurve = paint.useSpeed;
                        const widthCurve = curves.lineWidth;
                        const spreadCurve = curves.brushAlpha;
                        const spreadCenterCurve = curves.brushColor;
                        const mixCurve = curves.spraySize;
                        const bm = Math.max(0.5, brushMin / 2);
                        const br = brushRange / 2;
                        const repDist = paint.lengthFade * 2;
                        const sizeIt = paint.sizeBlend;
                        const spreadIt = !sizeIt;
                        var r1,r2,p1,p2,cx1,cy1,cx2,cy2,x,y,dx,dy,ox,oy;
                        var j,segFrom, segs,segStart = 0, jj;
                        var distRange,dist,pos,da1,da2,aa1,bb1,back,forward,pixPSeg;
                        var px,py,nx,ny,dn,u,uu,c=0;
                        px = ox = points[0][0];
                        py = oy = points[0][1];
                        startAddPoints(bm === 0.5 && br === 0, ctx, false, point);
                        var flushPoint = flushPointNorm;
                        var addPoint = addPointNorm;
                        var bug = false;
                        ctx.fillStyle = ctx.strokeStyle;
                        if (len < 0.7) {  // no line defined so draw what is seen via the pen feedback
                            ctx.beginPath()
                            renderFunctions.alias.pointAll(spr.image.ctx,(ox + 4096 | 0) - 4096,(oy + 4096 | 0) - 4096,bm);
                        } else {
                            if (br> 0 || bm > 1  || len > 32) {
                                ctx.beginPath();
                            } else {
                                flushPoint = flushPointBug;
                                addPoint = addPointBug;
                                bug = true;
                            }
                            const end = count - 2;
                            pixPSeg =  Math.max(1,paint.brushStep);
                            for (var i = 0; i < count-1; i+=1) {
                                back = false;
                                forward = false;
                                p2 = points[i];
                                if (i === 0) {
                                    p1 = p2;
                                    forward = true;
                                } else {p1 = points[i - 1]}
                                if (i === end) {
                                    p2 = p1;
                                    back = true;
                                }
                                r1 = Math.abs(p1[4]);
                                r2 = Math.abs(p2[4]);
                                if (r1 < 1) { forward = true }
                                if (r2 < 1) { back = true }
                                dist = points[i][12];
                                if (i < count-1) { distRange  = points[i+1][12] - dist }
                                else { distRange  = len - dist  }
                                cx1 = points[i][0];
                                cy1 = points[i][1];
                                cx2 = points[i+1][0];
                                cy2 = points[i+1][1];
                                dx = cx2 - cx1;
                                dy = cy2 - cy1;
                                var dn = (dx * dx + dy * dy) ** 0.5;
                                if (dn < r1 / 12 || dn < r2 / 12) {
                                    forward = back = true;
                                }
                                if (forward && back) {  // straight segment
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    if (spreadIt) {
                                        nx = - dy / dn;
                                        ny = dx / dn;
                                        segs /= circleBrushSpreadSubStep;
                                        segFrom /= circleBrushSpreadSubStep;
                                        for (j = segFrom; j < 1; j +=segs) {
                                            jj = useSpaceCurve ? spaceCurve(j) : j;
                                            pos = dist + distRange * jj;
                                            u = pos / len;
                                            uu = (c++ / ( repDist / pixPSeg)) % 1;
                                            uu = c % 2 ? 1 - uu : uu;
                                            const rad = widthCurve(u) * spreadCurve(u)  * br * (curves.brushColor(uu) *  2 - 1);
                                            x = (dx * jj + cx1 + nx * rad + 4096 | 0) - 4096;
                                            y = (dy * jj + cy1 + ny * rad + 4096 | 0) - 4096;
                                            addPoint(x,y,bm);
                                            px = x;
                                            py = y;
                                        }
                                    } else {
                                        for (j = segFrom; j < 1; j +=segs) {
                                            jj = useSpaceCurve ? spaceCurve(j) : j;
                                            pos = dist + distRange * jj;
                                            u = pos / len;
                                            uu = (c++ / (repDist / pixPSeg)) % 1;
                                            uu = c % 2 ? 1 - uu : uu;
                                            const rad = br > 0 ? (widthCurve(u) * spreadCurve(u)  * br * (curves.brushColor(uu) *  2 - 1)  + bm) : bm;
                                            x = (dx * jj + cx1 + 4096 | 0) - 4096;
                                            y = (dy * jj + cy1 + 4096 | 0) - 4096;
                                            addPoint(x,y,rad);
                                            ox = x;
                                            oy = y;
                                        }
                                    }
                                }else if (forward || back) { // single arc
                                    if (back) {
                                        aa1 = p1[11];
                                        da1 = p1[6] - aa1;
                                        cx1 = p1[2];
                                        cy1 = p1[3];
                                    } else {
                                        aa1 = p2[5];
                                        da1 = p2[11] - aa1;
                                        cx1 = p2[2];
                                        cy1 = p2[3];
                                        r1 = r2;
                                    }
                                    const dR = distRange;
                                    distRange = Math.abs(r1 * da1);
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    if ((1 - segFrom) / segs < 6000) {  // Large radius can cause the need to render too many points. For now just ignor
                                        if (spreadIt) {
                                            segs/= circleBrushSpreadSubStep; segFrom /= circleBrushSpreadSubStep;
                                             for (j = segFrom; j < 1; j +=segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1;
                                                uu = c % 2 ? 1 - uu : uu;
                                                const rad = widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1);
                                                const a1 = aa1 + da1 * jj;
                                                x = Math.cos(a1) * r1 + cx1
                                                y = Math.sin(a1) * r1 + cy1
                                                nx = x - px;
                                                ny = y - py;
                                                dn = Math.sqrt(nx * nx + ny * ny)
                                                px = x;
                                                py = y;
                                                x += -(ny / dn) * rad;
                                                y += (nx / dn) * rad;
                                                x = (x + 4096 | 0) - 4096;
                                                y = (y + 4096 | 0) - 4096;
                                                addPoint(x,y,bm);
                                            }
                                        } else {
                                            for (j = segFrom; j < 1; j +=segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                                const rad = br > 0 ? (widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1)  + bm) : bm;
                                                const a1 = aa1 + da1 * jj;
                                                x = (Math.cos(a1) * r1 + cx1 + 4096 | 0) - 4096;
                                                y = (Math.sin(a1) * r1 + cy1 + 4096 | 0) - 4096;
                                                if ( rad < 1.5) {
                                                    addPoint(x,y,rad);
                                                    ox -= x;
                                                    oy -= y;
                                                    if (Math.abs(ox) >= 2 || Math.abs(oy) >= 2) {
                                                        addPoint((x + ox / 2) | 0, (y + oy / 2) | 0,rad);
                                                    }
                                                } else {
                                                    addPoint(x,y,rad);
                                                }
                                                ox = x;
                                                oy = y;
                                            }
                                        }
                                    } else { j = 1 }
                                } else {  // double arc
                                    cx1 = p1[2];
                                    cy1 = p1[3];
                                    cx2 = p2[2];
                                    cy2 = p2[3];
                                    aa1 = p1[11];
                                    da1 = p1[6] - aa1;
                                    bb1 = p2[5];
                                    da2 = p2[11] - bb1;
                                    const dR = distRange;
                                    distRange = (Math.abs(r1 * da1) + Math.abs(r2 * da2)) / 2;
                                    segs = 1 / (distRange/pixPSeg);
                                    segFrom = segStart / distRange;
                                    if ((1 - segFrom) / segs < 6000) {  // Large radius can cause the need to render too many points. For now just ignor
                                        if (spreadIt) {
                                           segs /= circleBrushSpreadSubStep;
                                           segFrom /= circleBrushSpreadSubStep;
                                           for (j = segFrom; j < 1; j += segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                                const rad = widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1);
                                                const a1 = aa1 + da1 * jj;
                                                const a2 = bb1 + da2 * jj;
                                                const jMix = 1 - (jj = mixCurve(jj));
                                                x = (jMix * (Math.cos(a1) * r1 + cx1) + jj * (Math.cos(a2) * r2 + cx2));
                                                y = (jMix * (Math.sin(a1) * r1 + cy1) + jj * (Math.sin(a2) * r2 + cy2));
                                                nx = x - px;
                                                ny = y - py;
                                                dn = Math.sqrt(nx * nx + ny * ny)
                                                px = x;
                                                py = y;
                                                x += -(ny / dn) * rad;
                                                y += (nx / dn) * rad;
                                                x = (x + 4096 | 0) - 4096;
                                                y = (y + 4096 | 0) - 4096;
                                                addPoint(x,y,bm);
                                            }
                                        } else {
                                            for (j = segFrom; j < 1; j += segs) {
                                                jj = useSpaceCurve ? spaceCurve(j) : j;
                                                pos = dist + dR * jj;
                                                 u = pos / len;
                                                uu = (c++ / (repDist / pixPSeg)) % 1; uu = c % 2 ? 1 - uu : uu;
                                                const rad = br > 0 ? (widthCurve(u) * spreadCurve(u)  * br * (spreadCenterCurve(uu) *  2 - 1)  + bm) : bm;
                                                const a1 = aa1 + da1 * jj;
                                                const a2 = bb1 + da2 * jj;
                                                const jMix = 1 - (jj = mixCurve(jj));
                                                x = ((jMix * (Math.cos(a1) * r1 + cx1) + jj * (Math.cos(a2) * r2 + cx2)) + 4096 | 0) - 4096;
                                                y = ((jMix * (Math.sin(a1) * r1 + cy1) + jj * (Math.sin(a2) * r2 + cy2)) + 4096 | 0) - 4096;
                                                if (rad < 1.5) {
                                                     addPoint(x,y,rad)
                                                    ox -= x;
                                                    oy -= y;
                                                    if (Math.abs(ox) >= 2 || Math.abs(oy) >= 2) {
                                                        addPoint((x + ox / 2) | 0, (y + oy / 2) | 0, rad);
                                                    }
                                                } else {
                                                    addPoint(x,y,rad);
                                                }
                                                ox = x;
                                                oy = y;
                                            }
                                        }
                                    } else { j = 1 }
                                }
                                segStart = distRange * j - distRange;
                            }
                        }
                        flushPoint();
                        if (!bug) {
                            if (paint.fillMode >= fillModes.fillOpen) {
                                ctx.fill();
                            }
                            if (paint.fillMode !== fillModes.fillOpen) {
                                if (paint.fillMode >= fillModes.fillOpen) {
                                    ctx.globalCompositeOperation = secondDrawMode;
                                    ctx.strokeStyle = secondColor;
                                }
                                ctx.fillStyle = ctx.strokeStyle;
                                ctx.fill();
                            }
                        }
                    }
                };
            })(),
            image : (()=>{
                const c1 = wCanvas1;  // These must be square (same width and height,
                const c2 = wCanvas2;  // must not change size and these must be in scope of pen object
				const c3 = wCanvas3;
                const ctx1 = wCanvas1.ctx;
                const ctx2 = wCanvas2.ctx;
                const ctx3 = wCanvas3.ctx;
				ctx1.imageSmoothingQuality = "high";
				ctx2.imageSmoothingQuality = "high";
				ctx3.imageSmoothingQuality = "high";
                const size = c1.width;
                const size2 = size / 2;
                var pattern, patternColMask, patternAlphaMask;
				var maskAsImage = false;
                var alphaMask;
                var colorMask;
                var prev = {x1:0, y1:0, x2: 0, y2:0};
                const patternBlendCurve = v => v <= 0 ? 0 : v >= 1 ? 1 : v;
				//var CTX; setTimeout(() => CTX = view.context, 1000) // debug code
                const API = {
					createFlatMask() {
                        alphaMask = renderFunctions.gradient.imageBrushFlatMask(ctx1, size2);
						colorMask = undefined;
					},
                    createMask( alphaCurve) {
                        alphaMask = renderFunctions.gradient.imageBrushMask(ctx1, size2, alphaCurve);
						colorMask = undefined;
                    },
                    createColorMask(colorCurve, alphaCurve) {
                        alphaMask = renderFunctions.gradient.imageBrushColorMask(ctx1, size2, colorCurve, alphaCurve);
						colorMask = renderFunctions.gradient.brushColorGrad;
                    },
					createColor(colorCurve, colorA, colorB) {
						colorMask = renderFunctions.gradient.imageColor(ctx1, size2, colorA, colorB, colorCurve);
					},
                    copyToOther(canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can1.ctx;
                        ctx.setTransform(1,0,0,1,0,0);
						ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "copy";
                        ctx.drawImage(can,0,0);
                        ctx.globalCompositeOperation = "source-over";
                    },
					maskTypes: {
						standard() {
							ctx3.globalCompositeOperation = "copy";
							ctx3.resetTransform();
							ctx3.fillStyle = alphaMask;
							ctx3.fillRect(0,0,size,size);
						},
						square() {
							ctx3.globalCompositeOperation = "copy";
							ctx3.resetTransform(1,0,0,1,0,0);
							ctx3.fillStyle = alphaMask;
							ctx3.fillRect(0,0,size,size);
							ctx3.setTransform(0, 1, 1, 0, 0, 0);
							ctx3.globalCompositeOperation = "destination-in";
							ctx3.drawImage(ctx3.canvas,0,0);
						},
					},
					convertMaskToImage() {
						ctx3.globalCompositeOperation = "copy";
						ctx3.resetTransform(1,0,0,1,0,0);
						ctx3.fillStyle = alphaMask;
						ctx3.fillRect(0,0,size,size);
					},
                    imageSettings() {
						ctx1.imageSmoothingEnabled = paint.antiAlias;
						ctx2.imageSmoothingEnabled = paint.antiAlias;
						ctx3.imageSmoothingEnabled = paint.antiAlias;
					},
					imageDirFade(img,x,y, alpha, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can.ctx;
                        const scale = 256 / bSize;
						ctx.globalCompositeOperation = "copy";
						ctx.setTransform(1,0,0,1,0,0);
						ctx.drawImage(can1, 0, 0);
						ctx.globalAlpha = alpha;
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.setTransform(scale,0,0,scale,size2,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
					imageDirFade_Bleed(img,x,y, alpha, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can.ctx;
                        const scale = 256 / bSize;
						ctx.globalCompositeOperation = "copy";
						ctx.setTransform(1,0,0,1,0,0);
						ctx.drawImage(can1, 0, 0);
						ctx.globalAlpha = alpha;
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.setTransform(scale,0,0,scale,size2 + Math.randOP(scale * 2, 3),size2 + Math.randOP(scale * 2, 3));
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
					imageDirFade_Zoom(img,x,y, alpha, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can.ctx;
                        const scale = 256 / (bSize * (1 + (paint.pickupRadius - 50) / 500));
						ctx.globalCompositeOperation = "copy";
						ctx.setTransform(1,0,0,1,0,0);
						ctx.drawImage(can1, 0, 0);
						ctx.globalAlpha = alpha;
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.setTransform(scale,0,0,scale,size2,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
					imageDirFade_Twist(img,x,y, alpha, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can.ctx;
                        const scale = 256 / bSize;
						dir += (paint.pickupRadius - 50) / 500;
                        //const scale = 256 / (bSize * (1 + (paint.pickupRadius - 50) / 500));
						ctx.globalCompositeOperation = "copy";
						ctx.setTransform(1,0,0,1,0,0);
						ctx.drawImage(can1, 0, 0);
						ctx.globalAlpha = alpha;
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.setTransform(scale,0,0,scale,size2,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
					imageDirFade_AlphaBleed(img,x,y, alpha, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can.ctx;
                        const scale = 256 / bSize;
                        ctx.clearRect(0,0,size,size);
						ctx.globalAlpha = 1;
                        ctx.setTransform(scale,0,0,scale,size2,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = alpha;
                        ctx.drawImage(can1,0,0);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "destination-in";
                        //ctx.fillStyle = alphaMask;
                        //ctx.fillRect(0,0,size,size);
						ctx.drawImage(c3,0,0);
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
					imageDirFade_AlphaBleedZoom(img,x,y, alpha, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const can1 = canvasID === 1 ? c2 : c1;
                        const ctx = can.ctx;
                        const scale = 256 / (bSize * (1 + (paint.pickupRadius - 50) / 500));
                        ctx.clearRect(0,0,size,size);
						ctx.globalAlpha = 1;
                        ctx.setTransform(scale,0,0,scale,size2,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = alpha;
                        ctx.drawImage(can1,0,0);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "destination-in";
                        //ctx.fillStyle = alphaMask;
                        //ctx.fillRect(0,0,size,size);
						ctx.drawImage(c3,0,0);
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
                    imageDir(img,x,y, dir, bSize, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const ctx = can.ctx;
                        const scale = 256 / bSize;
                        ctx.clearRect(0,0,size,size);
                        ctx.setTransform(scale,0,0,scale,size2,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.globalCompositeOperation = "destination-in";
						ctx.resetTransform();
						ctx.drawImage(c3,0,0);
                        ctx.globalCompositeOperation = "source-over";
                        return can;
                    },
                    releaseLinePattern() {
                        pattern = undefined;
                        patternColMask = undefined;
                        patternAlphaMask = undefined;
                    },
                    linePatternInit() {
                        const alphaCurve = paint.useAlphaDist ? curves.lineAlpha : undefined;
                        const colorCurve = paint.randColor ? curves.brushAlpha : ( paint.colorBlend ? curves.lineColor : patternBlendCurve );
                        patternColMask = renderFunctions.gradient.lineLength(ctx1, 0, size2, size, size2, undefined, colorCurve);
                        patternAlphaMask = alphaCurve ? renderFunctions.gradient.lineLength(ctx1, 0, size2, size, size2, undefined, alphaCurve) : undefined;
                    },
                    imageLinePatternBlend(img, x, y, x1, y1, bSize, canvasID = 1) {
                        if (x === prev.x1 && y === prev.y1 && prev.x2 === x1 && prev.y2 === y1 && pattern !== undefined) {
                            return pattern
                        }
                        prev.x1 = x;
                        prev.y1 = y;
                        prev.x2 = x1;
                        prev.y2 = y1;
                        const can = canvasID === 1 ? c1 : c2;
                        const ctx = can.ctx;
                        const dir = Math.atan2(y1 - y, x1 - x);
                        ctx.clearRect(0,0,size,size);
                        ctx.setTransform(size*8,0,0,1,size,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x1, -y1);
                        ctx.resetTransform();
                        ctx.globalCompositeOperation = "destination-in";
                        ctx.fillStyle = patternColMask;
                        ctx.fillRect(0,0,size,size);
                        ctx.setTransform(size*8,0,0,1,0,size2);
                        ctx.rotate(-dir);
                        ctx.globalCompositeOperation = "destination-atop";
                        ctx.drawImage(img, -x, -y);
                        ctx.resetTransform();
                        if (patternAlphaMask) {
                            ctx.fillStyle = patternAlphaMask;
                            ctx.globalCompositeOperation = "destination-in";
                            ctx.fillRect(0,0,size,size);
                        }
                        ctx.globalCompositeOperation = "source-over";
                        pattern = ctx.createPattern(can,"no-repeat");
                        const dx = x1 - x;
                        const dy = y1 - y;
                        const len = (dx * dx + dy * dy) ** 0.5;
                        const scaleW = 1;
                        const scaleLen = len / size;
                        if (len > 0) {
                            const nx = (dx / len);
                            const ny = (dy / len);
                            workDOMMatrix.a = nx * scaleLen;
                            workDOMMatrix.b = ny * scaleLen;
                            workDOMMatrix.c = -ny * scaleW;
                            workDOMMatrix.d = nx * scaleW;
                            workDOMMatrix.e = x - size / 2 * -ny * scaleW;
                            workDOMMatrix.f = y - size / 2 * nx * scaleW;
                        } else {
                            workDOMMatrix.a = scaleW;
                            workDOMMatrix.b = 0;
                            workDOMMatrix.c = 0;
                            workDOMMatrix.d = scaleW;
                            workDOMMatrix.e = x - size / 2 * scaleW;
                            workDOMMatrix.f = y - size / 2 * scaleW;
                        }
                        pattern.setTransform(workDOMMatrix);
                        return pattern;
                    },
                    imageLinePattern(img, x, y, x1, y1, bSize, canvasID = 1) {
                        if (x === prev.x1 && y === prev.y1 && prev.x2 === x1 && prev.y2 === y1 && pattern !== undefined) {
                            return pattern
                        }
                        prev.x1 = x;
                        prev.y1 = y;
                        prev.x2 = x1;
                        prev.y2 = y1;
                        const can = canvasID === 1 ? c1 : c2;
                        const ctx = can.ctx;
                        const dir = Math.atan2(y1 - y, x1 - x);
                        const scale = 256 / (bSize * 2);
                        ctx.clearRect(0,0,size,size);
                        ctx.setTransform(size*4,0,0,1,0,size2);
                        ctx.rotate(-dir);
                        ctx.drawImage(img, -x, -y);
                        ctx.resetTransform();
                        if (patternAlphaMask) {
                            ctx.fillStyle = patternAlphaMask;
                            ctx.globalCompositeOperation = "destination-in";
                            ctx.fillRect(0,0,size,size);
                        }
                        ctx.globalCompositeOperation = "source-over";
                        pattern = ctx.createPattern(can,"no-repeat");
                        const dx = x1 - x;
                        const dy = y1 - y;
                        const len = (dx * dx + dy * dy) ** 0.5;
                        const scaleW = 1;
                        const scaleLen = len / size;
                        if (len > 0) {
                            const nx = (dx / len);
                            const ny = (dy / len);
                            workDOMMatrix.a = nx * scaleLen;
                            workDOMMatrix.b = ny * scaleLen;
                            workDOMMatrix.c = -ny * scaleW;
                            workDOMMatrix.d = nx * scaleW;
                            workDOMMatrix.e = x - size / 2 * -ny * scaleW;
                            workDOMMatrix.f = y - size / 2 * nx * scaleW;
                        } else {
                            workDOMMatrix.a = scaleW;
                            workDOMMatrix.b = 0;
                            workDOMMatrix.c = 0;
                            workDOMMatrix.d = scaleW;
                            workDOMMatrix.e = x - size / 2 * scaleW;
                            workDOMMatrix.f = y - size / 2 * scaleW;
                        }
                        pattern.setTransform(workDOMMatrix);
                        return pattern;
                    },
                    colorBrush(color, canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const ctx = can.ctx;
                        ctx.fillStyle = color;
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.fillRect(0,0,size,size);
                        ctx.globalCompositeOperation = "source-over";
                    },
					circleColorBrush(canvasId = 1) {
                        const can = canvasId === 1 ? c1 : c2;
                        const ctx = can.ctx;
                        ctx.clearRect(0,0,size,size);
                        ctx.fillStyle = colorMask;
                        ctx.fillRect(0,0,size,size);
                        ctx.globalCompositeOperation = "destination-in";
						if (!ctx3.custom_brush) {
							ctx.fillStyle = alphaMask;
							ctx.fillRect(0,0,size,size);
						} else {
							ctx.drawImage(c3,0,0);
						}
                        ctx.globalCompositeOperation = "source-over";
                        ctx.setTransform(1,0,0,1,0,0);
					},
                    circleBrush(fillStyle,canvasID = 1) {
                        const can = canvasID === 1 ? c1 : c2;
                        const ctx = can.ctx;
                        ctx.clearRect(0,0,size,size);
                        ctx.fillStyle = fillStyle;
                        ctx.fillRect(0,0,size,size);
                        ctx.globalCompositeOperation = "destination-in";
						if (!ctx3.custom_brush) {
							ctx.fillStyle = alphaMask;
							ctx.fillRect(0,0,size,size);
						} else {
							ctx.drawImage(c3,0,0);
						}
                        ctx.globalCompositeOperation = "source-over";
                        ctx.setTransform(1,0,0,1,0,0);
                    },
                };
                return API;
            })(),
            colorModes : {
                basic(color) {
                    return  clampRGBMix(color);
                },
                lighter(color) {
					const change = 1 + colorMixVal;
                    var r,g,b;
                    r = Math.sqrt(color.r * color.r * change) + 0.5 | 0;
                    g = Math.sqrt(color.g * color.g * change) + 0.5 | 0;
                    b = Math.sqrt(color.b * color.b * change) + 0.5 | 0;
                    r = r > 255 ? 255 : r;
                    g = g > 255 ? 255 : g;
                    b = b > 255 ? 255 : b;
                    return clampRGBMixA(r,g,b,color.a);
                },
                darker(color) {
					const change = 1 / (1 + colorMixVal);
                    var r,g,b;
                    r = Math.sqrt(color.r * color.r * change) + 0.5 | 0;
                    g = Math.sqrt(color.g * color.g * change) + 0.5 | 0;
                    b = Math.sqrt(color.b * color.b * change) + 0.5 | 0;
                    r = r < 0 ? 0 : r;
                    g = g < 0 ? 0 : g;
                    b = b < 0 ? 0 : b;
                    return clampRGBMixA(r,g,b,color.a);
                },
                hueToMain(color) {
					toHSL(color);
                    var hh = palletRangeRGB.rgba1.h-H;
                    if (hh < -180) { hh = 360 + hh}
                    if (hh > 180) { hh = hh - 360 }
                    H = H + 360 + hh * colorMixVal;
					return HSLMix();
                },
                satToMain(color) {
                    toHSL(color);
                    S += (palletRangeRGB.rgba1.s-S) * colorMixVal;
                    return HSLMix();
                },
                lumToMain(color) {
					toHSL(color);
                    L += (palletRangeRGB.rgba1.l-L) * colorMixVal;
                    return HSLMix();
                },
                hueSatToMain(color) {
                    toHSL(color);
                    var hh = palletRangeRGB.rgba1.h-H;
                    if (hh < -180) { hh = 360 + hh}
                    if (hh > 180) { hh = hh - 360 }
                    H = H + 360 + hh * colorMixVal;
                    S += (palletRangeRGB.rgba1.s-S) * colorMixVal;
                    return HSLMix();
                },
                hueLumToMain(color) {
					toHSL(color);
                    var hh = palletRangeRGB.rgba1.h-H;
                    if (hh < -180) { hh = 360 + hh}
                    if (hh > 180) { hh = hh - 360 }
                    H = H + 360 + hh * colorMixVal;
                    L += (palletRangeRGB.rgba1.l-L) * colorMixVal;
                    return HSLMix();
                },
                lumSatToMain(color) {
					toHSL(color);
                    L += (palletRangeRGB.rgba1.l-L) * colorMixVal;
                    S += (palletRangeRGB.rgba1.s-S) * colorMixVal;
                    return HSLMix();
                },
				toMain(color) {
					var r, g, b, rr,gg,bb;
					rr = palletRangeRGB.rgba1.r;
					gg = palletRangeRGB.rgba1.g;
					bb = palletRangeRGB.rgba1.b;
					r = color.r, g = color.g, b = color.b;
					const m1 = 1 - colorMixVal;
					return clampRGBMixA(
						Math.sqrt(rr*rr * colorMixVal + r * r * m1) + 0.5,
						Math.sqrt(gg*gg * colorMixVal + g * g * m1) + 0.5,
						Math.sqrt(bb*bb * colorMixVal + b * b * m1) + 0.5,
						color.a
					);
				},
            },
            pixel : {
                pointColor : {
                    random(ctx,uDist) {
                        ctx.fillStyle = colorModeFunc(colorInterpFunction(colorCurve(Math.random()), wColor));
                    },
                    blend() {},
                    blendPallet() {},
                    pallet() {},
                },
                sprayColor : {
                    random(ctx,uDist) { ctx.fillStyle = colorModeFunc(colorInterpFunction(colorCurve(Math.random()), wColor)) },
                    blend(ctx,uDist) { ctx.fillStyle = colorModeFunc(colorInterpFunction(colorCurve(Math.random()), wColor)) },
                    blendPallet(ctx,uDist) { ctx.fillStyle = colorModeFunc(colorInterpFunction(colorCurve(uDist), wColor)) },
                    pallet() {},
                },
                sprayBrushColor : {
                    random(ctx,uDist) { return colorModeFunc(colorInterpFunction(colorCurve(Math.random()), wColor)) },
                    blend(ctx,uDist) { return colorModeFunc(colorInterpFunction(colorCurve(Math.random()), wColor)) },
                    blendPallet(ctx, uDist) { return colorModeFunc(colorInterpFunction(colorCurve(uDist), wColor)) },
                    pallet() {},
                },
                getTopImage() {
                    if (colorSource) { return colorSource }
                    var maybe, topSpr;
                    sprites.eachDrawableVisual(spr => {
                        if (!maybe) { maybe = spr }
						if (spr.type.subSprite) {
							const ss = spr.subSprite;
							if (spr.key.lx >= ss.x && spr.key.lx < ss.x + ss.w && spr.key.ly >= ss.y && spr.key.ly < ss.y + ss.h) {
								topSpr = spr;
                                return true;
							}
						} else {
							if (spr.key.lx >= 0 && spr.key.lx < spr.image.w && spr.key.ly >= 0 && spr.key.ly < spr.image.h) {
								topSpr = spr;
                                return true;
							}
						}
                    });
                    return topSpr ? topSpr : maybe;
                },
                getColorEndPoint(color) {
                    color.transparent();
                    if (colorSource) {
                        const spr = colorSource;
						let left = 0,top = 0,right = spr.image.w,bot = spr.image.h;
						if (spr.type.subSprite) {
							left = spr.subSprite.x;
							top = spr.subSprite.y;
							right = left + spr.subSprite.w;
							bot = top + spr.subSprite.h;
						}
                        if (spr.key.lx >= left && spr.key.lx < right && spr.key.ly >= top && spr.key.ly < bot) {
                            var dat = spr.image.desc.mirror.ctx.getImageData(spr.key.lx | 0, spr.key.ly | 0,1,1).data;
                            if (dat[0] !== undefined  && dat[3] > 0) {
                                color.fromPixel(0, dat);
								dat = undefined;
                                return true;
                            }
							dat = undefined;
                        }
                    } else {
                        sprites.eachDrawableVisual(spr => {
							if (spr.type.subSprite) {
								const ss = spr.subSprite;
								if (spr.key.lx >= ss.x && spr.key.lx < ss.x + ss.w && spr.key.ly >= ss.y && spr.key.ly < ss.y + ss.h) {
									var dat = spr.image.desc.mirror.ctx.getImageData(spr.key.lx | 0, spr.key.ly | 0,1,1).data;
									if (dat[0] !== undefined  && dat[3] > 0) {
										color.fromPixel(0, dat);
										dat = undefined;
										return true;
									}
									dat = undefined;
								}
							} else {
								if (spr.key.lx >= 0 && spr.key.lx < spr.image.w && spr.key.ly >= 0 && spr.key.ly < spr.image.h) {
									var dat = spr.image.desc.mirror.ctx.getImageData(spr.key.lx | 0, spr.key.ly | 0,1,1).data;
									if (dat[0] !== undefined  && dat[3] > 0) {
										color.fromPixel(0, dat);
										dat = undefined;
										return true;
									}
									dat = undefined;
								}
							}
                        });
                    }
                },
                getColor(color,firstLoad = false) {
                    if (firstLoad) {
                        color.transparent();
                    }
                    if (colorSource) {
                        API.pixel.getColorFrom(colorSource,color,firstLoad);
                    } else {
                        sprites.eachDrawableVisual(spr => API.pixel.getColorFrom(spr,color,firstLoad));
                    }
                },
                getColorFrom(spr,color,firstLoad) {
                    if (firstLoad) {
                        spr.key._lx = spr.key.lx;
                        spr.key._ly = spr.key.ly;
                    }
                    colorRangeDry = true;
					var left = 0,top = 0,right = spr.image.w ,bot = spr.image.h;
					if (spr.type.subSprite) {
						left = spr.subSprite.x;
						top = spr.subSprite.y;
						right = left + spr.subSprite.w;
						bot = top + spr.subSprite.h;
					}
					if (spr.key._lx >= left && spr.key._lx < right && spr.key._ly >= top && spr.key._ly < bot) {
                        var dat;
                        if (paint.recycleDestination && !firstLoad) {
                            dat = spr.image.ctx.getImageData(spr.key._lx | 0, spr.key._ly | 0,1,1).data;
                        } else {
                            dat = spr.image.desc.mirror.ctx.getImageData(spr.key._lx | 0, spr.key._ly | 0,1,1).data;
                        }
                        if (dat[0] !== undefined  && dat[3] > 0) {
                            if (!firstLoad && paint.recycleColor) {
                                var pickup = (paint.pickupPower / 100) ** 2;
                                var pickup1 = 1-pickup;
                                    if (Math.random() < pickup ) {
                                        color.r = (color.r * color.r * pickup1 + dat[0] * dat[0] * pickup) ** 0.5;
                                        color.g = (color.g * color.g * pickup1 + dat[1] * dat[1] * pickup) ** 0.5;
                                        color.b = (color.b * color.b * pickup1 + dat[2] * dat[2] * pickup) ** 0.5;
                                        color.a = color.a * pickup1 + dat[3] * pickup;
                                    }
                            } else {
                                color.fromPixel(0, dat, 1);
                            }
                            colorRangeDry = false;
							dat = undefined;
                            return true;
                        }
						dat = undefined;
                    }
                },
                getRandomColorSet(colorRange,firstLoad = false) {
                    var prevCount = 0;
                    if (!firstLoad) {
                        prevCount = colorRange.lookupLen;
                     }
                    colorRange.lookupLen = 0;
                    colorRangeDry = true;
                    wColorRGB1.transparent();
                    if (colorSource) {
                        if (firstLoad) {
                            colorSource.key._lx = colorSource.key.lx;
                            colorSource.key._ly = colorSource.key.ly;
                        }
                        API.pixel.getRandomColorSetFrom(colorSource,colorRange,firstLoad, prevCount);
                    } else {
                        sprites.eachDrawableVisual(spr => API.pixel.getRandomColorSetFrom(spr,colorRange,firstLoad, prevCount));
                    }
                },
                getRandomColorSetFrom(spr,colorRange,firstLoad, prevCount) {
                    var dat;
                    var alpha,r,g,b,a;
					var left = 0,top = 0,right = spr.image.w ,bot = spr.image.h;
					if (spr.type.subSprite) {
						left = spr.subSprite.x;
						top = spr.subSprite.y;
						right = left + spr.subSprite.w;
						bot = top + spr.subSprite.h;
					}
					if (spr.key._lx >= left && spr.key._lx < right && spr.key._ly >= top && spr.key._ly < bot) {
                        const size = 128;//(sprayMax + 1) | 0;
                        var cx = size;
                        var cy = size;
                        var x = (spr.key._lx | 0) - size;
                        var y = (spr.key._ly | 0)- size;
                        var x1 = (spr.key._lx | 0) + size;
                        var y1 = (spr.key._ly | 0) + size;
                        if ( x < left) {
                            x = left;
                            cx = (spr.key._lx - left | 0);
                        }
                        if ( y < top) {
                            y = top;
                            cy = (spr.key._ly - top | 0);
                        }
                        if (x1 > right) { x1 = right }
                        if (y1 > bot) { y1 = bot }
                        var w = x1 - x;
                        var h = y1 - y;
                        var dd,dd1;
                        if (paint.recycleDestination && !firstLoad) {
                            dat = spr.image.ctx.getImageData(x, y,w,h).data;
                        } else {
                            dat = spr.image.desc.mirror.ctx.getImageData(x, y,w,h).data;
                        }
						if (specialBrushes.imgColors.use) {
							specialBrushes.imgColors.active = true;
							specialBrushes.imgColors.dat = dat;
							specialBrushes.imgColors.w = w;
							specialBrushes.imgColors.h = h;
							specialBrushes.imgColors.cx = cx;
							specialBrushes.imgColors.cy = cy;
							specialBrushes.imgColors.xo = null;
							specialBrushes.imgColors.yo = null;
							specialBrushes.imgColors.scale = 1;
						}
                        var maxDist = paint.pickupRadius/4;
                        var pickup = firstLoad ? 1 : (paint.pickupPower / 100)**2;
                        const colCurve = curves.lineColor;
                        colorRange.useLookup = true;
                        for (var i = 0; i < 256; i++) {
                            const ang = Math.random() * Math.PI2;
                            const dist = colCurve(Math.random()) * maxDist;
                            var xx = Math.cos(ang) * dist + cx| 0;
                            var yy = Math.sin(ang) * dist + cy| 0;
                            if (xx >= 0 && xx < w && yy >= 0 && yy < h) {
                                var idx = (xx + yy * w) * 4;
                                if (Math.random() < pickup) {
                                    if (dat[idx + 3]  > 0) {
                                        colorRangeDry = false;
                                        if ( colorRange.lookupVal[colorRange.lookupLen] === undefined) {
                                             colorRange.lookupVal[colorRange.lookupLen] = [];
                                        }
                                        colorRange.lookupVal[colorRange.lookupLen][3] = a = dat[idx+3];
                                        colorRange.lookupVal[colorRange.lookupLen][0] = r = dat[idx];
                                        colorRange.lookupVal[colorRange.lookupLen][1] = g = dat[idx+1];
                                        colorRange.lookupVal[colorRange.lookupLen][2] = b = dat[idx+2];
                                        colorRange.lookup[colorRange.lookupLen++] = utils.hexCol(r,g,b,a);
                                        //colorRange.lookup[colorRange.lookupLen++] = "rgba("+dat[idx++]+","+dat[idx++]+","+dat[idx++]+","+(dat[idx]/255)+")";
                                    }
                                } else {
                                    if (colorRange.lookupLen < prevCount) {
                                        colorRange.lookupLen ++;
                                    }
                                }
                            }
                        }
                        return true;
                    }
                },
                getHairColor(hairs,dryDist,add = false) {
                    wColorRGB1.transparent();
                    if (colorSource) {
                        API.pixel.getHairColorFrom(colorSource,hairs,dryDist,add);
                    } else {
                        sprites.eachDrawableVisual(spr => API.pixel.getHairColorFrom(spr,hairs,dryDist,add));
                    }
                },
                getHairColorFrom(spr,hairs,dryDist,add) {
                    var dat,a,r,g,b,alpha;
					var left = 0,top = 0,right = spr.image.w ,bot = spr.image.h;
					if (spr.type.subSprite) {
						left = spr.subSprite.x;
						top = spr.subSprite.y;
						right = left + spr.subSprite.w;
						bot = top + spr.subSprite.h;
					}
                    if (spr.key._lx >= left && spr.key._lx < right && spr.key._ly >= top && spr.key._ly < bot) {
                        const size = 128;//(sprayMax + 1) | 0;
                        var cx = size;
                        var cy = size;
                        var x =  (spr.key._lx | 0) - size;
                        var y =  (spr.key._ly | 0) - size;
                        var x1 = (spr.key._lx | 0) + size;
                        var y1 = (spr.key._ly | 0) + size;
                        if ( x < left) {
                            x = left;
                            cx = (spr.key._lx - left | 0);
                        }
                        if ( y < top) {
                            y = top;
                            cy = (spr.key._ly - top | 0);
                        }
                        if (x1 > right) { x1 = right }
                        if (y1 > bot) { y1 = bot }
                        var w = x1 - x;
                        var h = y1 - y;
                        var xo = hairs.xo;
                        var yo = hairs.yo;
                        var dd,dd1;
                        if (paint.recycleDestination) {
                            dat = spr.image.ctx.getImageData(x, y,w,h).data;
                        } else {
                            dat = spr.image.desc.mirror.ctx.getImageData(x, y,w,h).data;
                        }
						if (specialBrushes.imgColors.use) {
							specialBrushes.imgColors.active = true;
							specialBrushes.imgColors.dat = dat;
							specialBrushes.imgColors.w = w;
							specialBrushes.imgColors.h = h;
							specialBrushes.imgColors.cx = cx;
							specialBrushes.imgColors.cy = cy;
							specialBrushes.imgColors.xo = xo;
							specialBrushes.imgColors.yo = yo;
							specialBrushes.imgColors.scale = guideScaling;
						}
                        for (var i = 0; i < hairs.size; i++) {
                            const hr = hairs[i];
                            var xx = ((hr.cx * guideScaling) + cx - xo | 0) ;
                            var yy = ((hr.cy * guideScaling) + cy - yo | 0);
                            if (xx >= 0 && xx < w && yy >= 0 && yy < h) {
                                const idx = (xx + yy * w) * 4;
								hr.icx = xx;
								hr.icy = yy;
								if (!add) {
									alpha = hr.a = dat[idx + 3] / 255;
									if (dat[idx + 3]  > 0) {
										hr.r1 = hr.r = dat[idx];
										hr.g1 = hr.g = dat[idx + 1];
										hr.b1 = hr.b = dat[idx + 2];
									}
								} else if (hr.stage & specialBrushes.RELOAD_COLOR) {
									alpha = hr.a = dat[idx + 3] / 255;
									if (dat[idx + 3]  > 0) {
										hr.r1 = hr.r = dat[idx];
										hr.g1 = hr.g = dat[idx + 1];
										hr.b1 = hr.b = dat[idx + 2];
									}
									hr.stage -= specialBrushes.RELOAD_COLOR;
								} else {
									if (paint.sizeBlend) {  // size blend is also coloured brush option
										dd = dryDist * curves.lineWidth(hr.distNorm);
										dd1 = (1-dd);
									} else {
										dd1 = (1-dryDist) ;
										dd = dryDist;
									}
									if (dd < 0.5) {
										if (Math.random() < (dd * 2) ** 2) {
											if (hr.a === 0) {
												dd = 1;
												dd1 = 0;
											} else {
												dd = 0.1;
												dd1 = 0.9;
											}
											a = dat[idx + 3];
											if (a  > 0) {
												hr.r1 = hr.r = Math.sqrt(hr.r * hr.r * dd1 + dat[idx] * dat[idx] * dd);
												hr.g1 = hr.g = Math.sqrt(hr.g * hr.g * dd1 + dat[idx+1] * dat[idx+1] * dd);
												hr.b1 = hr.b = Math.sqrt(hr.b * hr.b * dd1 + dat[idx+2] * dat[idx+2] * dd);
											}
											hr.a = (hr.a * dd1 + (a/255)  * dd) ;
											hr.a = hr.a > 1 ? 1 : hr.a < 0 ? 0 : hr.a;
										}
									} else {
										if (hr.a === 0) {
											dd = 1;
											dd1 = 0;
										}
										a = dat[idx + 3];
										if (a  > 0) {
											hr.r1 = hr.r = Math.sqrt(hr.r * hr.r * dd1 + dat[idx] * dat[idx] * dd);
											hr.g1 = hr.g = Math.sqrt(hr.g * hr.g * dd1 + dat[idx+1] * dat[idx+1] * dd);
											hr.b1 = hr.b = Math.sqrt(hr.b * hr.b * dd1 + dat[idx+2] * dat[idx+2] * dd);
										}
										hr.a = (hr.a * dd1 + (a/255) * dd) ;
										hr.a = hr.a > 1 ? 1 : hr.a < 0 ? 0 : hr.a;
									}
								}
                            } else {
                                hr.a = 0;
                                hr.a1 = 0;
								hr.icx = -1;
                            }
                        }
						dat = undefined;
                        return true;
                    }
                },
            },
            gradient : {
                imageBrushFlatMask(ctx, size2) {
                    const grad = ctx.createRadialGradient(size2,size2,0,size2,size2, size2);
					grad.addColorStop(0,"rgba(0,0,0,"+alpha+")");
                    grad.addColorStop(0.99,"rgba(0,0,0,"+alpha+")");
                    grad.addColorStop(1,"rgba(0,0,0,0)");
                    return grad;
                },
                imageBrushMask(ctx, size2, curve) {
                    var i;
                    const grad = ctx.createRadialGradient(size2, size2, 0, size2, size2, size2);
                    for (i = 0; i < size2; i++) {
                        const ii = i / size2;
                        grad.addColorStop(ii, "rgba(0,0,0," + alpha * curve(1 - ii) + ")");
                    }
                    grad.addColorStop(0.99, "rgba(0,0,0," + alpha * curve(0) + ")");
                    grad.addColorStop(1, "rgba(0,0,0,0)");
                    return grad;
                },
                imageBrushColorMask(ctx, size2, colorCurve, alphaCurve) {
                    var i;
                    const grad = ctx.createRadialGradient(size2, size2, 0, size2, size2, size2);
                    const gradCol = this.brushColorGrad = ctx.createRadialGradient(size2, size2, 0, size2, size2, size2);
                    for (i = 0; i < size2; i++) {
                        const ii = i / size2;
                        grad.addColorStop(ii, "rgba(0,0,0," + alpha * alphaCurve(1 - ii) + ")");
                        gradCol.addColorStop(ii, colorRange.cssAtFixA(colorCurve(ii), 1));
                    }
					grad.addColorStop(0.99, "rgba(0,0,0," + alpha * alphaCurve(0) + ")");
                    grad.addColorStop(1,"rgba(0,0,0,0)");
                    gradCol.addColorStop(1, colorRange.cssAtFixA(colorCurve(1), 1));
                    return grad;
                },
                imageColor(ctx, size2, colA, colB, colorCurve) {
                    var i;
					const r = colB.r - colA.r
					const g = colB.g - colA.g
					const b = colB.b - colA.b
                    const grad = ctx.createRadialGradient(size2,size2,0,size2,size2, size2);
                    for (i = 0; i < size2; i ++) {
                        const ii = i / size2;
                        const iC = colorCurve(ii);
                        grad.addColorStop(ii,clampRGBMixA(colA.r + r * iC, colA.g + g * iC, colA.b + b * iC, alpha * 255)); ;
                    }
					const iC = colorCurve(1);
                    grad.addColorStop(1,clampRGBMixA(colA.r + r * iC, colA.g + g * iC, colA.b + b * iC, alpha * 255));
                    return grad;
                },
                addStops(len, grad) {
                    var i = 0;
                    if (gradientAlpha) {
                        for (i = 0; i < len; i ++) {
                            const ii = i / len;
                            const pos = curves.lineColor( ii );
                            grad.addColorStop(ii,colorRange.cssAtFixA(pos,curves.lineAlpha(ii)));
                        }
                        grad.addColorStop(1,colorRange.cssAtFixA(curves.lineColor( 1 ),curves.lineAlpha(1)));
                    } else {
                        for (i = 0; i < len; i ++) {
                            const ii = i / len;
                            const pos = curves.lineColor( ii );
                            grad.addColorStop(ii,colorRange.cssAtFixA(pos),1);
                        }
                        grad.addColorStop(1,colorRange.cssAtFixA(curves.lineColor( 1 ),1));
                    }
                },
                addCurveStops(len, grad, colorCurve, alphaCurve) {
                    var i = 0;
                    if (colorCurve && alphaCurve) {
                        for (i = 0; i < len; i ++) {
                            const ii = i / len;
                            grad.addColorStop(ii,colorRange.cssAtFixA(colorCurve(ii),alphaCurve(ii)));
                        }
                        grad.addColorStop(1,colorRange.cssAtFixA(colorCurve(1),alphaCurve(1)));
                    }else if (alphaCurve) {
                        for (i = 0; i < len; i ++) {
                            const ii = i / len;
                            grad.addColorStop(ii,colorRange.cssAtFixA(0,alphaCurve(ii)));
                        }
                        grad.addColorStop(1,colorRange.cssAtFixA(0,alphaCurve(1)));
                    } else {
                        for (i = 0; i < len; i ++) {
                            const ii = i / len;
                            grad.addColorStop(ii,colorRange.cssAtFixA(colorCurve(ii), 1));
                        }
                        grad.addColorStop(1,colorRange.cssAtFixA(colorCurve( 1 ), 1));
                    }
                },
                lineLength(ctx, x, y, x1, y1, colorCurve, alphaCurve) {
                    var i = 0;
                    var dx = x1 - x;
                    var dy = y1 - y;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    const grad = ctx.createLinearGradient(x,y,x1,y1);
                    if (colorCurve || alphaCurve) {
                        renderFunctions.gradient.addCurveStops(len, grad, colorCurve, alphaCurve);
                    } else {
                        renderFunctions.gradient.addStops(len,grad);
                    }
                    return grad;
                },
                lineLengthPattern(ctx, x, y, x1, y1, w) {
                    if (cutBuffer.hasPattern) {
                        const pat = cutBuffer.pattern;
                        const dx = x1 - x;
                        const dy = y1 - y;
                        const len = (dx * dx + dy * dy) ** 0.5;
                        const scale = w / pat.h;
                        const scaleLen = len / pat.w;
                        if (len > 0) {
                            const nx = (dx / len);
                            const ny = (dy / len);
                            if (mouse.ctrl === true) {
                                workDOMMatrix.a = nx * scaleLen;
                                workDOMMatrix.b = ny * scaleLen;
                            } else {
                                workDOMMatrix.a = nx * scale;
                                workDOMMatrix.b = ny * scale;
                            }
                            workDOMMatrix.c = -ny * scale;
                            workDOMMatrix.d = nx * scale;
                            workDOMMatrix.e = x - pat.h / 2 * -ny * scale;
                            workDOMMatrix.f = y - pat.h / 2 * nx * scale;
                        } else {
                            workDOMMatrix.a = scale;
                            workDOMMatrix.b = 0;
                            workDOMMatrix.c = 0;
                            workDOMMatrix.d = scale;
                            workDOMMatrix.e = x - pat.h / 2 * scale;
                            workDOMMatrix.f = y - pat.h / 2 * scale;
                        }
                        pat.setTransform(workDOMMatrix);
                        return pat;
                    }
                    return "#0000";
                },
                lineWidth(ctx, x, y, x1, y1, width) {
                    var i = 0;
                    var dx = x1 - x;
                    var dy = y1 - y;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    x = (x1 + x) / 2;
                    y = (y1 + y) / 2;
                    width /= 2;
                    if (len > 0) {
                        dx /= len;
                        dy /= len;
                        dx *= width;
                        dy *= width;
                    } else {
                        dx = 0;
                        dy = width;
                    }
                    const grad = ctx.createLinearGradient(x + dy,y - dx, x - dy, y + dx);
                    renderFunctions.gradient.addStops(width * 2,grad)
                    return grad;
                },
                rectangleLinear(ctx,x,y,w,h,colorCurve,alphaCurve) {
                    const grad = ctx.createLinearGradient(x,y,x,y + h);
                    renderFunctions.gradient.addCurveStops(h,grad,colorCurve,alphaCurve);
                    return grad;
                },
                rectangleLinear90(ctx,x,y,w,h,colorCurve,alphaCurve) {
                    const grad = ctx.createLinearGradient(x,y,x+w,y);
                    renderFunctions.gradient.addCurveStops(w,grad,colorCurve,alphaCurve);
                    return grad;
                },
                rectangleRadial(ctx,x,y,w,h,colorCurve,alphaCurve) {
                    h /= 2;
                    x += w / 2;
                    y += h;
                    const grad = ctx.createRadialGradient(x,y,0,x,y, h);
                    renderFunctions.gradient.addCurveStops(h,grad,colorCurve,alphaCurve);
                    return grad;
                },
                cutBufferPattern(ctx,x,y,w,h,colorCurve,alphaCurve) {
                    if (cutBuffer.hasPattern) {
                        const pat = cutBuffer.pattern;
                        workDOMMatrix.e = x;
                        workDOMMatrix.f = y;
                        pat.setTransform(workDOMMatrix);
                        return pat;
                    }
                    return "#0000";
                },
                currentGradient : null,
            },
            alias : {
                walksInfo : {
                },
                walks: {
                    basic() { moves.current = moves.noMove },
                    circle() { moves.current = moves.circle },
                    rand() { moves.current = moves.rand },
                    axis() { moves.current = moves.axis },
                    diag() { moves.current = moves.diag },
                    hex() { moves.current = moves.hex },
                    hexA() { moves.current = moves.hexA },
                    hexB() { moves.current = moves.hexB },
                    round() { moves.current = moves.round },
                    ver() { moves.current = moves.ver },
                    hor() { moves.current = moves.hor },
                    forw() { moves.current = moves.forw },
                    back() { moves.current = moves.back },
                    verOf() { moves.current = moves.verOf },
                    horOf() { moves.current = moves.horOf },
                    forwOf() { moves.current = moves.forwOf },
                    backOf() { moves.current = moves.backOf },
                },
                pointsInfo : {
                    basic : [212,"basic roundish point","walks"],
                    crossHatch : [213, "Cross hatch","walks"],
                    direction : [214, "Random line in direction of brush","walks"],
                    directionAcross : [215, "Random line across direction of brush","walks"],
                    directionAcrossOffset : [216, "Random line 90 left of brush direction","walks"],
                    manySmall : [213, "Each point is many small random points","walks"],
                    manySmallFast : [214, "Each point is mant small random points more spread out","walks"],
                    path : [215, "","walks"],
                    box : [216, "Box outlines","walks"],
                    cross : [31, "Draws crosses","walks"],
                    lines : [31, "Draws line segments","walks"],
                    corners :[31, "Draws corners","walks"],
                    diagonals :[31, "Draws diagonals","walks"],
                    crossHatchA: [213, "","walks"],
                    crossHatchB: [213, "","walks"],
                    leftHatch:   [213, "","walks"],
                    leftHatchA:  [213, "","walks"],
                    leftHatchB:  [213, "","walks"],
                    rightHatch:  [213, "","walks"],
                    rightHatchA: [213, "","walks"],
                    rightHatchB: [213, "","walks"],
                    squareHatch: [213, "","walks"],
                    downHatch:   [213, "","walks"],
                    accrossHatch:[213, "","walks"],
                },
                points : {
                    basic(ctx,x,y,size) {
						const sizeIdx = size < 1.5 ? 0 : size | 0;
						const func = penCirclesAliased[sizeIdx];
						func ? func(ctx,x,y) : (ctx.beginPath(),ctx.moveTo(x + size/2, y),ctx.arc(x, y, size/2, 0, Math.PI2),ctx.fill());
                    },
                    crossHatch(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sx = size / 2;
                        const sy = size / 2;
                        var xx = x / size ;
                        var yy = y / size ;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * size - 65536;
                        const y1 = ((yy | 0) + u) * size;
                        nx = xx % 1;
                        ny = yy % 1;
                        u = (-(nx - 1) + ny) / 2;
                        const x2 = ((xx | 0) + 1 - u) * size - 65536;
                        const y2 = ((yy | 0) + u) * size;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx, y1 - sy);
                        ctx.lineTo(x1 + sx, y1 + sy);
                        ctx.moveTo(x2 - sx, y2 + sy);
                        ctx.lineTo(x2 + sx, y2 - sy);
                        ctx.stroke();
                    },
                    direction(ctx,x,y,size) {
                        var xx,yy,xx1,yy1;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        if (paint.useDirection) {
                            size *= gSpdA / 10;
                        }
                        size *= 0.5;
                        if (paint.antiAlias) {
                            const xdx = Math.cos(gDir) * size;
                            const xdy = Math.sin(gDir) * size;
                            ctx.beginPath();
                            ctx.lineTo(x - xdx, y - xdy);
                            ctx.lineTo(x + xdx, y + xdy);
                            ctx.stroke();
                        } else {
                            const dx = Math.cos(gDir);
                            const dy = Math.sin(gDir);
                            xx = (x -= dx * size - 0.5) | 0;
                            yy = (y -= dy * size - 0.5) | 0;
                            var ii = -size;
                            ctx.beginPath();
                            while(ii < size) {
                                if (xx !== xx1 || yy !== yy1) {
                                    ctx.rect(xx, yy, 1, 1);
                                    xx1 = xx;
                                    yy1 = yy;
                                }
                                xx = (x += dx) | 0;
                                yy = (y += dy) | 0;
                                ii++;
                            }
                            ctx.fill();
                        }
                    },
                    directionAcross(ctx,x,y,size) {
                        var xx,yy,xx1,yy1;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        if (paint.useDirection) {
                            size *= gSpdA /10;
                        }
                        if (paint.antiAlias) {
                            const xdx = Math.cos(gDirA+Math.PI / 2) * size / 2;
                            const xdy = Math.sin(gDirA+Math.PI / 2) * size / 2;
                            ctx.beginPath();
                            ctx.lineTo(x - xdx, y - xdy);
                            ctx.lineTo(x + xdx, y + xdy);
                            ctx.stroke();
                        } else {
                            const dx = Math.cos(gDirA+Math.PI / 2);
                            const dy = Math.sin(gDirA+Math.PI / 2);
                            xx = (x -= dx * size * 0.5 - 0.5) | 0;
                            yy = (y -= dy * size * 0.5 - 0.5) | 0;
                            var ii = 0;
                            ctx.beginPath();
                            while(ii < size) {
                                if (xx !== xx1 || yy !== yy1) {
                                    ctx.rect(xx, yy, 1, 1);
                                    xx1 = xx;
                                    yy1 = yy;
                                }
                                xx = (x += dx) | 0;
                                yy = (y += dy) | 0;
                                ii++;
                            }
                            ctx.fill();
                        }
                    },
                    directionAcrossOffset(ctx,x,y,size) {
                        var xx,yy,xx1,yy1;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        if (paint.useDirection) {
                            size *= gSpdA /10;
                        }
                        if (paint.antiAlias) {
                            const xdx = Math.cos(gDirA-Math.PI / 2) * size;
                            const xdy = Math.sin(gDirA-Math.PI / 2) * size;
                            ctx.beginPath();
                            ctx.lineTo(x, y);
                            ctx.lineTo(x + xdx, y + xdy);
                            ctx.stroke();
                        } else {
                            const dx = Math.cos(gDirA-Math.PI / 2);
                            const dy = Math.sin(gDirA-Math.PI / 2);
                            xx = x | 0;
                            yy = y | 0;
                            var ii = size/2;
                            ctx.beginPath();
                            while(ii < size) {
                                if (xx !== xx1 || yy !== yy1) {
                                    ctx.rect(xx, yy, 1, 1);
                                    xx1 = xx;
                                    yy1 = yy;
                                }
                                xx = (x += dx) | 0;
                                yy = (y += dy) | 0;
                                ii++;
                            }
                            ctx.fill();
                        }
                    },
                    directionRand(ctx,x,y,size) {
                        var xx,yy,xx1,yy1;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        if (paint.useDirection) {
                            size *= gSpdA /10;
                        }
                        const gDir = gDirA + (Math.random()*Math.random() - 0.5)* Math.PI * 2;
                        size *= 0.5;
                        if (paint.antiAlias) {
                            const xdx = Math.cos(gDir) * size;
                            const xdy = Math.sin(gDir) * size;
                            ctx.beginPath();
                            ctx.lineTo(x - xdx, y - xdy);
                            ctx.lineTo(x + xdx, y + xdy);
                            ctx.stroke();
                        } else {
                            const dx = Math.cos(gDir);
                            const dy = Math.sin(gDir);
                            xx = (x -= dx * size - 0.5) | 0;
                            yy = (y -= dy * size - 0.5) | 0;
                            var ii = -size;
                            ctx.beginPath();
                            while(ii < size) {
                                if (xx !== xx1 || yy !== yy1) {
                                    ctx.rect(xx, yy, 1, 1);
                                    xx1 = xx;
                                    yy1 = yy;
                                }
                                xx = (x += dx) | 0;
                                yy = (y += dy) | 0;
                                ii++;
                            }
                            ctx.fill();
                        }
                    },
                    circleBend(ctx, x, y, size) {
                        var xx,yy,xx1,yy1;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const steps = Math.max(2,(size / 2 | 0)+1);
                        var dc1 = (mouseBrush.directionChange * (size / gSpdA)) / steps;
                        var i = steps;
                        const s = size / steps;
                        var dir = gDirA;
                        if (paint.antiAlias) {
                            ctx.lineWidth = optionLineWidth;
                            ctx.strokeStyle = ctx.fillStyle;
                            ctx.beginPath();
                            ctx.lineTo(x, y);
                            while(i--> 0) {
                                dir += dc1
                                x += Math.cos(dir) * s;
                                y += Math.sin(dir) * s;
                                ctx.lineTo(x, y);
                            }
                            ctx.stroke();
                        } else {
                            var ii = 0;
                            ctx.beginPath();
                            while(i--> 0) {
                                dir += dc1
                                ii = 0;
                                while(ii < s) {
                                    x += Math.cos(dir);
                                    y += Math.sin(dir);
                                    xx = x + 0.5 | 0;
                                    yy = y + 0.5 | 0;
                                    if (xx !== xx1 || yy !== yy1) {
                                        ctx.rect(xx,yy,1,1);
                                        xx1 = xx;
                                        yy1 = yy;
                                    }
                                    ii++;
                                }
                            }
                            ctx.fill();
                        }
                    },
                    circleBend1(ctx, x, y, size) {
                        var xx,yy,xx1,yy1;
                        const steps = Math.max(2,(size / 2 | 0)+1);
                        var dc1 = (mouseBrush.directionChange * (size / gSpdA)) / steps;
                        var i = steps;
                        const s = size / steps;
                        var dir = gDirA;
                        if (paint.antiAlias) {
                            ctx.lineWidth = optionLineWidth;
                            ctx.strokeStyle = ctx.fillStyle;
                            ctx.beginPath();
                            ctx.lineTo(x, y);
                            while(i--> 0) {
                                dir += dc1
                                dc1 *= 1 + Math.random() - 0.2;
                                x += Math.cos(dir) * s;
                                y += Math.sin(dir) * s;
                                ctx.lineTo(x, y);
                            }
                            ctx.stroke();
                        } else {
                            var ii = 0;
                            ctx.beginPath();
                            while(i--> 0) {
                                dir += dc1
                                dc1 *= 1 + Math.random() - 0.2;
                                ii = 0;
                                while(ii < s) {
                                    x += Math.cos(dir);
                                    y += Math.sin(dir);
                                    xx = x + 0.5 | 0;
                                    yy = y + 0.5 | 0;
                                    if (xx !== xx1 || yy !== yy1) {
                                        ctx.rect(xx,yy,1,1);
                                        xx1 = xx;
                                        yy1 = yy;
                                    }
                                    ii++;
                                }
                            }
                            ctx.fill();
                        }
                    },
                    circleBendAcross(ctx, x, y, size) {
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const steps = Math.max(2,(size / 2 | 0)+1);
                        const dc1 = (mouseBrush.directionChange * (size / gSpdA)) / (steps/2);
                        ctx.beginPath();
                        ctx.lineTo(x, y);
                        var i = steps/ 2;
                        const s = size / steps;
                        var dir = gDirA + Math.PI / 2;
                        var x1 = x, y1 = y;
                        while(i--> 0) {
                            dir += dc1
                            x1 += Math.cos(dir) * s;
                            y1 += Math.sin(dir) * s;
                            ctx.lineTo(x1, y1);
                        }
                        ctx.moveTo(x, y);
                        i = steps/ 2;
                        dir = gDirA + Math.PI / 2;
                        while(i--> 0) {
                            dir -= dc1
                            x -= Math.cos(dir) * s;
                            y -= Math.sin(dir) * s;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    },
                    circleBendAcross1(ctx, x, y, size) {
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const steps = Math.max(2,(size / 2 | 0)+1);
                        const dc1 = (mouseBrush.directionChange * (size / gSpdA)) / (steps/2);
                        ctx.beginPath();
                        ctx.lineTo(x, y);
                        var i = steps/ 2;
                        const s = size / steps;
                        var dir = gDirA + Math.PI / 2;
                        var x1 = x, y1 = y;
                        while(i-- > 0) {
                            dir += dc1
                            x1 += Math.cos(dir) * s;
                            y1 += Math.sin(dir) * s;
                            ctx.lineTo(x1, y1);
                        }
                        ctx.moveTo(x, y);
                        i = steps/ 2;
                        dir = gDirA + Math.PI / 2;
                        while(i--> 0) {
                            dir += dc1
                            x -= Math.cos(dir) * s;
                            y -= Math.sin(dir) * s;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    },
                    circleBendAcross2(ctx, x, y, size) {
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const steps = Math.max(2,(size / 2 | 0)+1);
                        var dc1 = (mouseBrush.directionChange * (size / gSpdA)) / (steps/2);
                        ctx.beginPath();
                        ctx.lineTo(x, y);
                        var i = steps/ 2;
                        const s = size / steps;
                        var dir = gDirA + Math.PI / 2;
                        var dc2 = dc1;
                        var x1 = x, y1 = y;
                        while(i-- > 0) {
                            dir += dc1
                            dc1 *= 1 + Math.random() * 1 - 0.2;
                            x1 += Math.cos(dir) * s;
                            y1 += Math.sin(dir) * s;
                            ctx.lineTo(x1, y1);
                        }
                        ctx.moveTo(x, y);
                        i = steps/ 2;
                        dir = gDirA + Math.PI / 2;
                        while(i--> 0) {
                            dir += dc2
                            dc2 *= 1 + Math.random() * 1 - 0.2;
                            x -= Math.cos(dir) * s;
                            y -= Math.sin(dir) * s;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    },
                    dirHatch(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const xdx = Math.cos(gDir);
                        const xdy = Math.sin(gDir);
                        gDir += gDirC;
                        const sizeX = size * xdx;
                        const sizeY = size * xdy;
                        const sx1 = sizeX / 2;
                        const sy1 = sizeY / 2
                        var xx = sizeX === 0 ? 0 : x / sizeX;
                        var yy = sizeY === 0 ? 0 : y / sizeY;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        var u1 = (-(nx - 1) + ny) / 2;
                        const x1 = ((xx | 0) + u) * sizeX - 65536;
                        const y1 = ((yy | 0) + u1) * sizeY;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.stroke();
                    },
                    dirAcrossHatch(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const xdy = Math.cos(gDir);
                        const xdx = -Math.sin(gDir);
                        gDir += gDirC;
                        const sizeX = size * xdx;
                        const sizeY = size * xdy;
                        const sx1 = sizeX / 2;
                        const sy1 = sizeY / 2
                        var xx = sizeX === 0 ? 0 : x / sizeX;
                        var yy = sizeY === 0 ? 0 : y / sizeY;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * sizeX - 65536;
                        const y1 = ((yy | 0) + u) * sizeY;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.stroke();
                    },
                    rotTimeHatch(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const xdy = Math.cos(tick);
                        const xdx = -Math.sin(tick);
                        const sizeX = size * xdx;
                        const sizeY = size * xdy;
                        const sx1 = sizeX / 2;
                        const sy1 = sizeY / 2
                        var xx = sizeX === 0 ? 0 : x / sizeX;
                        var yy = sizeY === 0 ? 0 : y / sizeY;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * sizeX - 65536;
                        const y1 = ((yy | 0) + u) * sizeY;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.stroke();
                        tick += 0.01;
                    },
                    crossHatchA(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sizeX = size * 2;
                        const sizeY = size * 2;
                        const sx1 = size / 2;
                        const sy1 = sizeY / 2
                        const sx2 = sizeX / 2;
                        const sy2 = size / 2
                        var xx = x / size;
                        var yy = y / sizeY;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * size - 65536;
                        const y1 = ((yy | 0) + u) * sizeY;
                        xx = x / sizeX;
                        yy = y / size;
                        nx = xx % 1;
                        ny = yy % 1;
                        u = (-(nx - 1) + ny) / 2;
                        const x2 = ((xx | 0) + 1 - u) * sizeX - 65536;
                        const y2 = ((yy | 0) + u) * size;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.moveTo(x2 - sx2, y2 + sy2);
                        ctx.lineTo(x2 + sx2, y2 - sy2);
                        ctx.stroke();
                    },
                    crossHatchB(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sizeX = size * 2;
                        const sizeY = size * 2;
                        const sx1 = sizeX / 2;
                        const sy1 = size / 2
                        const sx2 = size / 2;
                        const sy2 = sizeY / 2
                        var xx = x / sizeX;
                        var yy = y / size;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * sizeX - 65536;
                        const y1 = ((yy | 0) + u) * size;
                        xx = x / size;
                        yy = y / sizeY;
                        nx = xx % 1;
                        ny = yy % 1;
                        u = (-(nx - 1) + ny) / 2;
                        const x2 = ((xx | 0) + 1 - u) * size - 65536;
                        const y2 = ((yy | 0) + u) * sizeY;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.moveTo(x2 - sx2, y2 + sy2);
                        ctx.lineTo(x2 + sx2, y2 - sy2);
                        ctx.stroke();
                    },
                    leftHatch(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sx = size / 2;
                        const sy = size / 2;
                        var xx = x / size ;
                        var yy = y / size ;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * size - 65536;
                        const y1 = ((yy | 0) + u) * size;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx, y1 - sy);
                        ctx.lineTo(x1 + sx, y1 + sy);
                        ctx.stroke();
                    },
                    leftHatchA(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sizeY = size * 2;
                        const sx1 = size / 2;
                        const sy1 = sizeY / 2
                        var xx = x / size;
                        var yy = y / sizeY;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * size - 65536;
                        const y1 = ((yy | 0) + u) * sizeY;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.stroke();
                    },
                    leftHatchB(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sizeX = size * 2;
                        const sx1 = sizeX / 2;
                        const sy1 = size / 2
                        var xx = x / sizeX;
                        var yy = y / size;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (nx + ny) / 2;
                        const x1 = ((xx | 0) + u) * sizeX - 65536;
                        const y1 = ((yy | 0) + u) * size;
                        ctx.beginPath();
                        ctx.lineTo(x1 - sx1, y1 - sy1);
                        ctx.lineTo(x1 + sx1, y1 + sy1);
                        ctx.stroke();
                    },
                    rightHatch(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sx = size / 2;
                        const sy = size / 2;
                        var xx = x / size ;
                        var yy = y / size ;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (-(nx - 1) + ny) / 2;
                        const x2 = ((xx | 0) + 1 - u) * size - 65536;
                        const y2 = ((yy | 0) + u) * size;
                        ctx.beginPath();
                        ctx.moveTo(x2 - sx, y2 + sy);
                        ctx.lineTo(x2 + sx, y2 - sy);
                        ctx.stroke();
                    },
                    rightHatchA(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sizeX = size * 2;
                        const sx2 = sizeX / 2;
                        const sy2 = size / 2;
                        var xx = x / sizeX;
                        var yy = y / size;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (-(nx - 1) + ny) / 2;
                        const x2 = ((xx | 0) + 1 - u) * sizeX - 65536;
                        const y2 = ((yy | 0) + u) * size;
                        ctx.beginPath();
                        ctx.moveTo(x2 - sx2, y2 + sy2);
                        ctx.lineTo(x2 + sx2, y2 - sy2);
                        ctx.stroke();
                    },
                    rightHatchB(ctx,x,y,size) {
                        x += 65536;
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const sizeY = size * 2;
                        const sx2 = size / 2;
                        const sy2 = sizeY / 2
                        var xx = x / size;
                        var yy = y / sizeY;
                        var nx = xx % 1;
                        var ny = yy % 1;
                        var u = (-(nx - 1) + ny) / 2;
                        const x2 = ((xx | 0) + 1 - u) * size - 65536;
                        const y2 = ((yy | 0) + u) * sizeY;
                        ctx.beginPath();
                        ctx.moveTo(x2 - sx2, y2 + sy2);
                        ctx.lineTo(x2 + sx2, y2 - sy2);
                        ctx.stroke();
                    },
                    squareHatch(ctx,x,y,size) {
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const s2 = size / 2;
                        const s4 = s2 / 2;
                        var xx = ((((x)/ s2 | 0) * s2) / 2 | 0) * 2 + 0.5;
                        var yy = ((((y)/ s2 | 0) * s2) / 2 | 0) * 2 + 0.5;
                        ctx.beginPath();
                        ctx.lineTo(x - s4,yy);
                        ctx.lineTo(x + s4,yy);
                        ctx.moveTo(xx, y + s4);
                        ctx.lineTo(xx, y - s4);
                        ctx.stroke();
                    },
                    downHatch(ctx,x,y,size) {
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const s2 = size / 2;
                        const s4 = s2 / 2;
                        var xx = ((((x)/ s2 | 0) * s2) / 2 | 0) * 2 + 0.5;
                       // var yy = ((((y)/ s2 | 0) * s2) / 2 | 0) * 2 + 0.5;
                        ctx.beginPath();
                        ctx.moveTo(xx, y + s4);
                        ctx.lineTo(xx, y - s4);
                        ctx.stroke();
                    },
                    accrossHatch(ctx,x,y,size) {
                        ctx.lineWidth = optionLineWidth;
                        ctx.strokeStyle = ctx.fillStyle;
                        const s2 = size / 2;
                        const s4 = s2 / 2;
                       // var xx = ((((x)/ s2 | 0) * s2) / 2 | 0) * 2 + 0.5;
                        var yy = ((((y)/ s2 | 0) * s2) / 2 | 0) * 2 + 0.5;
                        ctx.beginPath();
                        ctx.lineTo(x - s4,yy);
                        ctx.lineTo(x + s4,yy);
                        ctx.stroke();
                    },
                    randomWalk(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.random() * l;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkDirRand(ctx,x,y,size) {
                        var xdx = Math.round(Math.cos(gDir) * 10);
                        var xdy = Math.round(Math.sin(gDir) * 10);
                        var sx = xdx < 0 ? -1 : 1;
                        var sy = xdy < 0 ? -1 : 1;
                        xdx *= sx;
                        xdy *= sy;
                        xdy = -xdy;
                        var er = xdx + xdy;
                        size = size + 1 | 0;
                        ctx.beginPath();
                        while (size--) {
                            ctx.rect(x , y , 1, 1);
                            const e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy - Math.random()*6;
                                x += sx;
                            }
                            if (e2 < xdx) {
                                er += xdx + Math.random()*6;
                                y += sy;
                            }
                        }
                        ctx.fill();
                        gDir += gDirC;
                    },
                    walkDirRandTurnB(ctx,x,y,size) {
                        var dir = gDir;
                        gDir += gDirC;
                        var xdx = Math.round(Math.cos(dir) * 10);
                        var xdy = Math.round(Math.sin(dir) * 10);
                        var t;
                        var sx = xdx < 0 ? -1 : 1;
                        var sy = xdy < 0 ? -1 : 1;
                        xdx *= sx;
                        xdy *= sy;
                        xdy = -xdy;
                        var er = xdx + xdy;
                        var xx = x,yy = y,c = 0;
                        var tt = size /2;
                        var sp = mouseBrush.speed;
                        const m = size = mouseBrush.speed + size + 1 | 0;
                        const turns = 1 / size;
                        ctx.beginPath();
                        while (size--) {
                            ctx.rect(x , y , 1, 1);
                            if (c === 1) {
                                ctx.rect(xx , yy , 1, 1);
                            }
                            if (size === 0) { break }
                            const e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                                xx -= sy;
                            }
                            if (e2 < xdx) {
                                er += xdx;
                                y += sy;
                                yy += sx;
                            }
                            if ((mouseBrush.speedTrack += tt) > sp) {
                                mouseBrush.speedTrack-= sp;
                                tt +=4;
                            //if (Math.random() < turns / 4) {
                                dir += Math.PI * curves.lineAlpha(size / m) * (Math.random() < 0.5 ? -1 : 1);
                                xdx = Math.round(Math.cos(dir) * 10);
                                xdy = Math.round(Math.sin(dir) * 10);
                                sx = xdx < 0 ? -1 : 1;
                                sy = xdy < 0 ? -1 : 1;
                                xdx *= sx;
                                xdy *= sy;
                                xdy = -xdy;
                                er = xdx + xdy
                                xx = x;
                                yy = y;
                                c = 1;
                            }
                        }
                        ctx.fill();
                    },
                    walkDirRandTurnA(ctx,x,y,size) {
                        var dir = gDir;
                        gDir += gDirC;
                        var xdx = Math.round(Math.cos(dir) * 10);
                        var xdy = Math.round(Math.sin(dir) * 10);
                        var t;
                        var sx = xdx < 0 ? -1 : 1;
                        var sy = xdy < 0 ? -1 : 1;
                        xdx *= sx;
                        xdy *= sy;
                        xdy = -xdy;
                        var er = xdx + xdy;
                        var xx = x,yy = y,c = 0;
                        const m = size = size + 1 | 0;
                        const turns = 1 / size;
                        ctx.beginPath();
                        while (size--) {
                            ctx.rect(x , y , 1, 1);
                            if (c === 1) {
                                ctx.rect(xx , yy , 1, 1);
                            }
                            if (size === 0) { break }
                            const e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                                xx -= sy;
                            }
                            if (e2 < xdx) {
                                er += xdx;
                                y += sy;
                                yy += sx;
                            }
                            if (Math.random() < turns / 4) {
                                dir += Math.PI * curves.lineAlpha(size / m) * (Math.random() < 0.5 ? -1 : 1);
                                xdx = Math.round(Math.cos(dir) * 10);
                                xdy = Math.round(Math.sin(dir) * 10);
                                sx = xdx < 0 ? -1 : 1;
                                sy = xdy < 0 ? -1 : 1;
                                xdx *= sx;
                                xdy *= sy;
                                xdy = -xdy;
                                er = xdx + xdy
                                xx = x;
                                yy = y;
                                c = 1;
                            }
                        }
                        ctx.fill();
                    },
                    walkDirRandTurnACa(ctx,x,y,size) {
                        var dir = gDir;
                        gDir += gDirC;
                        var dd = 0;
                        var xdx;
                        var xdy;
                        var t;
                        var sx;
                        var sy;
                        var er
                        size = size + 1 | 0;
                        const turns = 1 / size;
                        var gd = gDirC / size;
                        var aa = curves.curves.lineColor.value / 30;
                        ctx.beginPath();
                        while (size--) {
                            var a = Math.sin(curves.lineAlpha(dd)*Math.PI*2) * aa;
                            xdx = Math.round(Math.cos(dir+aa) * 10);
                            xdy = Math.round(Math.sin(dir+aa) * 10);
                            dd += gd
                            sx = xdx < 0 ? -1 : 1;
                            sy = xdy < 0 ? -1 : 1;
                            xdx *= sx;
                            xdy *= sy;
                            xdy = -xdy;
                            if (er === undefined) {
                                er = (xdx + xdy)
                            }
                            ctx.rect(x , y , 1, 1);
                            if (size === 0) { break }
                            var e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                            }
                            if (e2 < xdx) {
                                y += sy;
                                er += xdx
                            }
                            ctx.rect(x , y , 1, 1);
                            var e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                            }
                            if (e2 < xdx) {
                                y += sy;
                                er += xdx
                            }
                        }
                        ctx.fill();
                    },
                    walkDirRandTurnAC(ctx,x,y,size) {
                        var dir = gDir;
                        gDir += gDirC;
                        var xdx;
                        var xdy;
                        var t;
                        var sx;
                        var sy;
                        var er
                        size = size + 1 | 0;
                        const turns = 1 / size;
                        var gd = gDirC / size;
                        ctx.beginPath();
                        while (size--) {
                            xdx = Math.round(Math.cos(dir) * 10);
                            xdy = Math.round(Math.sin(dir) * 10);
                            dir += gd
                            sx = xdx < 0 ? -1 : 1;
                            sy = xdy < 0 ? -1 : 1;
                            xdx *= sx;
                            xdy *= sy;
                            xdy = -xdy;
                            if (er === undefined) {
                                er = (xdx + xdy)
                            }
                            ctx.rect(x , y , 1, 1);
                            if (size === 0) { break }
                            var e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                            }
                            if (e2 < xdx) {
                                y += sy;
                                er += xdx
                            }
                            ctx.rect(x , y , 1, 1);
                            var e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                            }
                            if (e2 < xdx) {
                                y += sy;
                                er += xdx
                            }
                        }
                        ctx.fill();
                    },
                    walkDirRandTurn(ctx,x,y,size) {
                        var xdx = Math.round(Math.cos(gDir) * 10);
                        var xdy = Math.round(Math.sin(gDir) * 10);
                        gDir += gDirC;
                        var t;
                        var sx = xdx < 0 ? -1 : 1;
                        var sy = xdy < 0 ? -1 : 1;
                        xdx *= sx;
                        xdy *= sy;
                        xdy = -xdy;
                        var er = xdx + xdy;
                        size = size + 1 | 0;
                        const turns = 1 / size;
                        ctx.beginPath();
                        while (size--) {
                            ctx.rect(x , y , 1, 1);
                            const e2 = 2 * er;
                            if (e2 > xdy) {
                                er += xdy;
                                x += sx;
                            }
                            if (e2 < xdx) {
                                er += xdx;
                                y += sy;
                            }
                            if (Math.random() < turns) {
                                t = xdx;
                                xdx = -xdy;
                                xdy = -t;
                                t = sx;
                                sx = sy;
                                sy = t;
                                if (Math.random() < 0.5) {
                                    sy = -sy;
                                } else {
                                    sx = -sx;
                                }
                            }
                        }
                        ctx.fill();
                    },
                    walk(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = 0;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkStartReg(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.abs(mouseBrush.directionAbsolute / Math.PI2 * size | 0) % l ;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkStartReg2(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.abs(mouseBrush.directionAbsolute / Math.PI * size | 0) % l ;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkNoAlias(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = 0;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.rect(x + xx,y + yy,1,1);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkShapeRandom(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.random() * l;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.lineTo(x + xx,y + yy);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkShape(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = 0;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.lineTo(x + xx,y + yy);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkShapeReg2(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.abs(mouseBrush.directionAbsolute / Math.PI * size | 0) % l ;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.lineTo(x + xx,y + yy);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.fill();
                    },
                    walkLineRandom(ctx,x,y,size) {
                        ctx.strokeStyle = ctx.fillStyle;
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.random() * l;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.lineTo(x + xx,y + yy);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.closePath()
                        ctx.stroke();
                    },
                    walkLine(ctx,x,y,size) {
                        ctx.strokeStyle = ctx.fillStyle;
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = 0;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.lineTo(x + xx,y + yy);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.closePath()
                        ctx.stroke();
                    },
                    walkLineReg2(ctx,x,y,size) {
                        ctx.strokeStyle = ctx.fillStyle;
                        var xx = 0;
                        var yy = 0;
                        const m = moves.current;
                        const l = m.length;
                        const start = Math.abs(mouseBrush.directionAbsolute / Math.PI * size | 0) % l ;
                        var dir, i = 0;;
                        ctx.beginPath();
                        const step = 1 / ( size | 0 );
                        while(i <= 1) {
                            ctx.lineTo(x + xx,y + yy);
                            dir = m[(start + curves.lineAlpha(i) * l | 0) % l];
                            i+= step;
                            yy += dir[0];
                            xx += dir[1];
                        }
                        ctx.closePath()
                        ctx.stroke();
                    },
                    manySmallFast(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        while((size--) > 0) {
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                            xx += Math.random() < 0.5 ? -1 : 1;
                            yy += Math.random() < 0.5 ? -1 : 1;
                        }
                        ctx.fill();
                    },
                    manySmallFastA(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        while((size--) > 0) {
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                            xx += Math.random() < 0.5 ? -2 : 2;
                            yy += Math.random() < 0.5 ? -2 : 2;
                        }
                        ctx.fill();
                    },
                    pathA(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.a;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? 1 : m.length-1;
                        while((size--) > 0) {
                            xx += m[pos][0];
                            yy += m[pos][1];
                            pos = (pos + dir) % l;
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathA1(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.a;
                        var sp = Math.random() * 0.2 + 0.2;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? sp : m.length-sp;
                        while((size--) > 0) {
                            xx += m[pos|0][0];
                            yy += m[pos|0][1];
                            pos = (pos + dir) % l;
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathB(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.b;
                        var sp = Math.random() * 0.8 + 0.2;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? sp : -sp;
                        while((size--) > 0) {
                            xx += m[pos|0][0];
                            yy += m[pos|0][1];
                            pos = (pos + l + dir) % l;
                            dir*= 0.9;
                            ctx.rect(x + (xx/2 | 0),y + (yy/2 | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathC(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.c;
                        var sp = Math.random() * 0.8 + 0.2;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? sp : -sp;
                        while((size--) > 0) {
                            xx += m[pos|0][0];
                            yy += m[pos|0][1];
                            pos = (pos + l + dir) % l;
                            dir*= 0.9;
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathD(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.d;
                        var sp = Math.random() * 0.8 + 0.2;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? sp : -sp;
                        while((size--) > 0) {
                            xx += m[pos|0][0];
                            yy += m[pos|0][1];
                            pos = (pos + l + dir) % l;
                            dir*= 0.9;
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathBB(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.b;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? 0.2 : m.length-0.2;
                        while((size--) > 0) {
                            xx += m[pos][0];
                            yy += m[pos][1];
                            pos = (pos + dir) % l;
                            ctx.rect(x + (xx/2 | 0),y + (yy/2 | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathB1(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.b;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? 2 : m.length-2;
                        while((size--) > 0) {
                            xx += m[pos][0];
                            yy += m[pos][1];
                            pos = (pos + dir) % l;
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                        }
                        ctx.fill();
                    },
                    pathB2(ctx,x,y,size) {
                        var xx = 0;
                        var yy = 0;
                        ctx.beginPath();
                        size = size + size | 0 + 1;
                        const m = moves.b;
                        const l =  m.length;
                        var pos = Math.random() * l | 0;
                        var dir = Math.random() < 0.5 ? 3 : m.length-3;
                        while((size--) > 0) {
                            xx += m[pos][0];
                            yy += m[pos][1];
                            pos = (pos + dir) % l;
                            ctx.rect(x + (xx | 0),y + (yy | 0),1,1);
                        }
                        ctx.fill();
                    },
                    diagonals(ctx,x,y,size) {
                        if (size < 4) { return }
                        var x1 = (x + (Math.random() - 0.5) * size) | 0;
                        var y1 = (y + (Math.random() - 0.5) * size) | 0;
                        var x2 = (x + (Math.random() - 0.5) * size) | 0;
                        var y2 = (y + (Math.random() - 0.5) * size) | 0;
                        size |= 0;
                        ctx.beginPath();
                        while(size -- > 0) {
                            (Math.random() < 0.5 && (ctx.rect(x1++,y1++,1,1))) || (ctx.rect(x2--,y2++,1,1));
                        }
                        ctx.fill();
                    },
                    box(ctx,x,y,size) {
                        if (size < 4) {
                            return;
                        }
                        const s = size / 2 + 0.5 | 0;
                        ctx.beginPath();
                        ctx.rect(x-s,y-s,1,size);
                        ctx.rect(x+s,y-s,1,size);
                        ctx.rect(x-s+1,y-s,size -2, 1);
                        ctx.rect(x-s+1,y+s,size -2, 1);
                        ctx.fill();
                    },
                    cross(ctx,x,y,size) {
                        if (size < 4) {
                            return;
                        }
                        const s = size / 2 + 0.5 | 0;
                        ctx.beginPath();
                        ctx.rect(x,y-s,1,size);
                        ctx.rect(x-s,y,size, 1);
                        ctx.fill();
                    },
                    corners(ctx,x,y,size) {
                        if (size < 4) {
                            return;
                        }
                        const s = size / 2 + 0.5 | 0;
                        ctx.beginPath();
                        if (dither % 2) {
                            ctx.rect(x++,y-s,1,size--);
                            Math.random() < 0.5 && (ctx.rect(x,y-s,size, 1))
                            Math.random() < 0.5 && (ctx.rect(x,y+s,size, 1))
                        } else {
                            ctx.rect(x-s,y++,size--, 1);
                            Math.random() < 0.5 && (ctx.rect(x-s,y,1,size));
                            Math.random() < 0.5 && (ctx.rect(x+s,y,1,size));
                        }
                        ctx.fill();
                    },
                    lines(ctx,x,y,size) {
                        if (size < 4) {
                            return;
                        }
                        size*=4;
                        var xx;
                        var yy;
                        xx = x;
                        yy = y;
                        var ms = (size = size | 0 + 1) * 0.3;
                        ms = ms  < 2 ? 2 : ms
                        ctx.beginPath();
                        while(size > 0) {
                            var d = Math.random() * ms;
                            size -= d;
                            d = (d * (Math.random() < 0.5 ? -1 : 1)) | 0;
                            ctx.rect(xx, yy, d, 1);
                            if (size > 0) {
                                xx += d;
                                d = Math.random() * ms;
                                size -= d;
                                d = (d * (Math.random() < 0.5 ? -1 : 1)) | 0;
                                ctx.rect(xx, yy, 1, d);
                                yy += d;
                            }
                        }
                        ctx.fill();
                    },
                },
                point(ctx,x,y,size) { // assumes points size <=1 are not sent here.
					const sizeIdx = size < 2 ? 1 : size | 0;
					const func = pathCirclesAliased[sizeIdx];
					func ? func(ctx,x,y) : (ctx.moveTo(x + size/2, y),ctx.arc(x, y, size/2, 0, Math.PI2));
                },
                pointAll(ctx,x,y,size) { // assumes points size <=1 are not sent here.
					const sizeIdx = size < 2 ? 0 : size | 0;
					const func = pathCirclesAliased[sizeIdx];
					func ? func(ctx,x,y) : (ctx.moveTo(x + size/2, y),ctx.arc(x, y, size/2, 0, Math.PI2));
                },
                lineQuick(ctx, x1,y1,x2,y2,size) {
                    var x,y,dx,dy,sx,sy,er,e2,count;
                    const point = renderFunctions.alias.point;
                    const bm = brushMin / 2;
                    x1 = x = (x1 + 4096 | 0) - 4096;
                    y1 = y = (y1 + 4096 | 0) - 4096;
                    x2 = (x2 + 4096 | 0) - 4096;;
                    y2 = (y2 + 4096 | 0) - 4096;;
                    dx = Math.abs(x2 - x1);
                    dy = Math.abs(y2 - y1);
                    if (dx === 0 && dy === 0) {
                        ctx.rect(x1 , y1 , size, size);
                        return;
                    }
                    count = 1000;
                    dy = -dy;
                    sx = x1 < x2 ? 1 : -1;
                    sy = y1 < y2 ? 1 : -1;
                    er = dx + dy;
                    while (count--) {
                        ctx.rect(x1 , y1 , size, size);
                        if (x1 === x2 && y1 === y2) { return }
                        else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                        }
                    }
                },
                line(ctx, x1,y1,x2,y2, skipFirst = false, render = true) {
                    var x,y,dx,dy,sx,sy,er,e2,end,dist,d;
                    const point = renderFunctions.alias.point;
                    var bm = brushMin / 2;
                    const m = brushMin / 2 ;
                    const M = paint.sizeBlend ? brushMax / 2 : m;
                    const r = M - m;
                    ctx.setTransform(1,0,0,1,0,0);
                    x1 = x = (x1 + 4096 | 0) - 4096;
                    y1 = y = (y1 + 4096 | 0) - 4096;
                    x2 = (x2 + 4096 | 0) - 4096;;
                    y2 = (y2 + 4096 | 0) - 4096;;
                    dither = 1;
                    dx = Math.abs(x2 - x1);
                    dy = Math.abs(y2 - y1);
                    if (dx === 0 && dy === 0) {
                        if (!skipFirst) {
                            if (render) { ctx.beginPath() }
                            if (bm > 1.5) {
                                point(ctx, x1,y1,bm);
                                dither++;
                            } else { ctx.rect(x1 , y1 , 1, 1) }
                            if (render) { ctx.fill() }
                        }
                        return;
                    }
                    dist = dx > dy ? dx : dy;
                    d = 0;
                    dy = -dy;
                    sx = x1 < x2 ? 1 : -1;
                    sy = y1 < y2 ? 1 : -1;
                    er = dx + dy;
                    end = false;
                    if (skipFirst) {
                        if (x1 === x2 && y1 === y2) {end = true }
                        else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                            dither++;
                        }
                        d++;
                    }
                    if (render) { ctx.beginPath() }
                    const sizeBlend = paint.sizeBlend;
                    const widthCurve = paint.sizeBlend ? curves.lineWidth : undefined;
                    while (!end) {
                        if (sizeBlend) {
                            bm = widthCurve(d/dist) * r + m
                            if (bm > 1.5) { point(ctx, x1,y1, bm) }
                            else if (bm >= 1) { ctx.rect(x1 , y1 , 1, 1) }
                            else { dither % 2 && ctx.rect(x1 , y1 , 1, 1) }
                            d++;
                        } else {
                            if (bm > 1.5) {point(ctx, x1,y1,bm) }
                            else if (bm >= 1) { ctx.rect(x1 , y1 , 1, 1) }
                            else { dither % 2 && ctx.rect(x1 , y1 , 1, 1) }
                        }
                        dither++;
                        if (x1 === x2 && y1 === y2) { end = true }
                        else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                        }
                    }
                    if (render) { ctx.fill() }
                },
                lineScanLine(ctx, x1,y1,x2,y2, skipFirst = false, render = true) {
                    var x,y,dx,dy,sx,sy,er,e2,end,dist,d;
                    var w1, w2;
                    var bm = brushMin / 4;
                    const m = brushMin / 4 ;
                    const M = paint.sizeBlend ? brushMax / 4 : m;
                    const r = M - m;
                    x1 = (x1 + 4096 | 0) - 4096;
                    y1 = (y1 + 4096 | 0) - 4096;
                    x2 = (x2 + 4096 | 0) - 4096;;
                    y2 = (y2 + 4096 | 0) - 4096;;
                    ctx.setTransform(1,0,0,1,0,0);
                    const colorCurve = paint.randColor ? curves.brushAlpha : ( paint.colorBlend ? curves.lineColor : undefined );
                    const alphaCurve = paint.useAlphaDist ? curves.lineAlpha : undefined
                    const widthCurve = paint.sizeBlend ? curves.lineWidth : undefined;
                    if (widthCurve) {
                        w1 = widthCurve(0) * r + m;
                        w2 = widthCurve(1) * r + m;
                    } else {
                        w1 = m;
                        w2 = M;
                    }
                    dx = x2 - x1;
                    dy = y2 - y1;
                    const len = (dx * dx + dy * dy) ** 0.5;
                    if (len === 0) { return }
                    const nx = dx / len;
                    const ny = dy / len;
                    if (paint.gradientMode === 3) {
                        ctx.fillStyle = API.gradient.lineLengthPattern(ctx, x1, y1, x2, y2, Math.max(m,M) * 2);
                    } else if (paint.gradientMode === 2) {
                        ctx.fillStyle = API.gradient.lineWidth(ctx, x1, y1, x2, y2, Math.max(m,M)  * 2);
                    } else if (colorCurve) {
                        if (paint.recycleColor || paint.recycleDestination) {
                            ctx.fillStyle = API.image.imageLinePatternBlend(imageTopSrc, x1, y1, x2, y2, w1);
                        } else {
                            ctx.fillStyle = API.gradient.lineLength(ctx, x1, y1, x2, y2, colorCurve, alphaCurve);
                        }
                    }else if (paint.recycleColor || paint.recycleDestination) {
                        ctx.fillStyle = API.image.imageLinePattern(imageTopSrc, x1, y1, x2, y2, w1);
                    }
                    var lxx, lyy, rxx, ryy, lx, ly, rx, ry, ex, ey;
                    var xa = Math.round(x1 + ny * w1);
                    var ya = Math.round(y1 - nx * w1);
                    var xb = Math.round(x2 + ny * w2);
                    var yb = Math.round(y2 - nx * w2);
                    var xc = Math.round(x2 - ny * w2);
                    var yc = Math.round(y2 + nx * w2);
                    var xd = Math.round(x1 - ny * w1);
                    var yd = Math.round(y1 + nx * w1);
                    if (ya <= yb && ya <= yc && ya <= yd) {
                        rxx = lxx = xa;
                        ryy = lyy = ya;
                        rx = xb;
                        ry = yb;
                        lx = xd;
                        ly = yd;
                        ex = xc;
                        ey = yc;
                    } else if (yb <= yc &&  yb <= yd) {
                        rxx = lxx = xb;
                        ryy = lyy = yb;
                        rx = xc;
                        ry = yc;
                        lx = xa;
                        ly = ya;
                        ex = xd;
                        ey = yd;
                    } else if (yc <= yd) {
                        rxx = lxx = xc;
                        ryy = lyy = yc;
                        rx = xd;
                        ry = yd;
                        lx = xb;
                        ly = yb;
                        ex = xa;
                        ey = ya;
                    } else {
                        rxx = lxx = xd;
                        ryy = lyy = yd;
                        rx = xa;
                        ry = ya;
                        lx = xc;
                        ly = yc;
                        ex = xb;
                        ey = yb;
                    }
                    const bot = Math.max(ly, ry, ey);
                    if (ryy === ry) {
                        if (ry === ey) {
                            rxx = ex;
                            ryy = ey;
                            rx = lx;
                            ry = ly;
                        } else {
                            rxx = rx;
                            ryy = ry;
                            rx = ex;
                            ry = ey;
                        }
                    }
                    if (lyy === ly) {
                        if (ly === ey) {
                            lxx = ex;
                            lyy = ey;
                            lx = rx;
                            ly = ry;
                        } else {
                            lxx = lx;
                            lyy = ly;
                            lx = ex;
                            ly = ey;
                        }
                    }
                    var rxs = (rx - rxx) / (ry - ryy);
                    var lxs = (lx - lxx) / (ly - lyy);
                    var i = 0, li = 0.5, ri = 0.5;
                    var lines = bot - ryy ;
                    y = ryy;
                    if (render) { ctx.beginPath() }
                    while (i < lines) {
                        const lpx = Math.round(lxx + li * lxs);
                        const rpx = Math.round(rxx + ri * rxs);
                        if (lpx >= rpx) {
                            ctx.rect(rpx, y, 1, 1);
                        } else {
                            ctx.rect(lpx, y, rpx - lpx, 1);
                        }
                        i++;
                        if (i === lines) { break }
                        li++;
                        ri++;
                        y++;
                        if (y === ly) {
                            lxx = lx;
                            lyy = ly;
                            if (ly === ey) {
                                lx = rx;
                                ly = ry;
                            } else {
                                lx = ex;
                                ly = ey;
                            }
                            li = 0.5;
                            lxs = (lx - lxx) / (ly - lyy);
                        }
                        if (y === ry) {
                            rxx = rx;
                            ryy = ry;
                            if (ry === ey) {
                                rx = lx;
                                ry = ly;
                            } else {
                                rx = ex;
                                ry = ey;
                            }
                            ri = 0.5;
                            rxs = (rx - rxx) / (ry - ryy);
                        }
                    }
                    if (render) { ctx.fill() }
                },
                lineForShape(ctx, x1, y1, x2, y2, skipFirst = false, render = true) {
                    var x,y,dx,dy,sx,sy,er,e2,end,dist,d;
                    const point = renderFunctions.alias.point;
                    var bm = brushMin / 2;
                    const m = brushMin / 2 ;
                    const M = m;
                    const r = M - m;
                    ctx.setTransform(1,0,0,1,0,0);
                    x1 = x = (x1 + 4096 | 0) - 4096;
                    y1 = y = (y1 + 4096 | 0) - 4096;
                    x2 = (x2 + 4096 | 0) - 4096;;
                    y2 = (y2 + 4096 | 0) - 4096;;
                    dither = 1;
                    dx = Math.abs(x2 - x1);
                    dy = Math.abs(y2 - y1);
                    if (dx === 0 && dy === 0) {
                        if (!skipFirst) {
                            if (render) { ctx.beginPath() }
                            if (bm > 1.5) {
                                point(ctx, x1,y1,bm);
                                dither++;
                            } else { ctx.rect(x1 , y1 , 1, 1) }
                            if (render) { ctx.fill() }
                        }
                        return;
                    }
                    dist = dx > dy ? dx : dy;
                    d = 0;
                    dy = -dy;
                    sx = x1 < x2 ? 1 : -1;
                    sy = y1 < y2 ? 1 : -1;
                    er = dx + dy;
                    end = false;
                    if (skipFirst) {
                        if (x1 === x2 && y1 === y2) {end = true }
                        else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                            dither++;
                        }
                        d++;
                    }
                    if (render) { ctx.beginPath() }
                    while (!end) {
                        if (bm > 1.5) {point(ctx, x1,y1,bm) }
                        else if (bm >= 1) { ctx.rect(x1 , y1 , 1, 1) }
                        else { dither % 2 && ctx.rect(x1 , y1 , 1, 1) }
                        dither++;
                        if (x1 === x2 && y1 === y2) { end = true }
                        else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                        }
                    }
                    if (render) { ctx.fill() }
                },
                lineColorAlpha(ctx, x1,y1,x2,y2, skipFirst = false) {
                    var x,y;
                    ctx.setTransform(1,0,0,1,0,0);
                    x1 = x = (x1 + 4096 | 0) - 4096;
                    y1 = y = (y1 + 4096 | 0) - 4096;
                    x2 = (x2 + 4096 | 0) - 4096;;
                    y2 = (y2 + 4096 | 0) - 4096;;
                    dither = 1;
                    var dx = Math.abs(x2 - x1);
                    var sx = x1 < x2 ? 1 : -1;
                    var dy = -Math.abs(y2 - y1);
                    var sy = y1 < y2 ? 1 : -1;
                    var er = dx + dy;
                    var e2;
                    var end = false;
                    const point = renderFunctions.alias.point;
                    const colorCurve = curves.lineColor;
                    const alphaCurve = curves.lineAlpha;
                    const randCurve = curves.brushAlpha;
                    const widthCurve = curves.lineWidth;
                    const useColor = paint.colorBlend;
                    const useAlpha = paint.useAlphaDist;
                    const useRand = paint.randColor;
                    const sizeBlend = paint.sizeBlend;
                    const alpha = ctx.globalAlpha;
                    var bm = brushMin / 2;
                    const m = brushMin / 2 ;
                    const M = paint.sizeBlend ? brushMax / 2 : m;
                    const r = M - m;
                    const len = Math.max(dx, -dy, 1);
                    var dist = 0;
                    if (skipFirst) {
                        if (x1 === x2 && y1 === y2) {
                            end = true;
                        } else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                            dither++;
                        }
                        dist += 1;
                    }
                    while (!end) {
                        const unitDist = dist / len;
                        if (useRand) {
                            ctx.fillStyle = colorRange.cssAtFixA(randCurve(Math.random()),useAlpha ? alphaCurve(unitDist): 1);
                        }else if (useColor) {
                            ctx.fillStyle = colorRange.cssAtFixA(colorCurve(unitDist),useAlpha ? alphaCurve(unitDist): 1);
                        } else if (useAlpha) {
                            ctx.globalAlpha = alphaCurve(unitDist) * alpha;
                        }
                        if (sizeBlend) { bm = widthCurve(unitDist) * r + m }
                        if (bm > 1.5) {
                            ctx.beginPath();
                            point(ctx, x1,y1,bm);
                            ctx.fill();
                        } else if (bm >= 1) { ctx.fillRect(x1 , y1 , 1, 1) }
                        else { dither % 2 && ctx.fillRect(x1 , y1 , 1, 1) }
                        dither++;
                        dist += 1;
                        if (x1 === x2 && y1 === y2) {
                            end = true;
                        } else {
                            e2 = 2 * er;
                            if (e2 > dy) {
                                er += dy;
                                x1 += sx;
                            }
                            if (e2 < dx) {
                                er += dx;
                                y1 += sy;
                            }
                        }
                    }
                },
                circle(spr) {
                    const ctx = spr.image.ctx;
                    var radius = (((spr.key._lx- spr.key.lx) ** 2 + (spr.key._ly- spr.key.ly) ** 2) ** 0.5) | 0;
                    if (shapeModStates.shift) {
                        var radiusX = Math.max(1, Math.abs(spr.key._lx- spr.key.lx) | 0);
                        var radiusY = Math.max(1, Math.abs(spr.key._ly- spr.key.ly) | 0);
                        if (radiusX > radiusY) {
                            var yScale = radiusY / radiusX;
                            var xScale = 1;
                            radius = radiusX;
                        } else {
                            var xScale = radiusX / radiusY;
                            var yScale = 1;
                            radius = radiusY;
                        }
                        aliasCircleRadiusY = radiusY;
                        aliasCircleRadiusX = radiusX;
                    } else {
                        aliasCircleRadiusY = radius;
                        aliasCircleRadiusX = radius;
                    }
                    var sizeRange = brushMax - brushMin;
                    var minS = brushMin;
                    var ww =  minS
                    const size = Math.max(1, ww) | 0;
                    const offset = size / 2 | 0;
                    var x = radius-1;
                    var y = 0;
                    var dx = 1;
                    var dy = 1;
                    var err = dx - (radius << 1);
                    var x0 = (spr.key._lx + 4096 | 0) - 4096;
                    var y0 = (spr.key._ly + 4096 | 0) - 4096;
                    var x1 = x0 + 1;
                    var y1 = y0 + 1;
                    smallCircleRadius = radius;
                    if (paint.fillMode >= fillModes.fill) {
                        ctx.beginPath();
                        if (shapeModStates.shift) {
                            if (radius < smallAliasCirclesFill.length) {
                                const sc = smallAliasCirclesFill[radius];
                                const len = sc.length;
                                while(y < len) {
                                    x = (sc[y] * xScale | 0);
                                    ctx.rect(x0 - x, y0 - (y * xScale | 0), x * 2 + 2, 1);
                                    ctx.rect(x0 - x, y1 + (y * xScale | 0), x * 2 + 2, 1);
                                    y ++
                                }
                            } else {
                                var lx = x,ly = y;
                                while (x >= y) {
                                    const xa = x * xScale | 0;
                                    const ya = y * yScale | 0;
                                    ctx.rect(x0 - xa, y1 + ya, xa * 2 + 2, 1);
                                    ctx.rect(x0 - xa, y0 - ya, xa * 2 + 2, 1);
                                    if (x !== lx) {
                                        const xa = ly * xScale | 0;
                                        const ya = lx * yScale | 0;
                                        ctx.rect(x0 - xa, y0 - ya, xa * 2 + 2, 1);
                                        ctx.rect(x0 - xa, y1 + ya, xa * 2 + 2, 1);
                                    }
                                    lx = x;
                                    ly = y;
                                    y++;
                                    err += dy;
                                    dy += 2;
                                    if (err > 0) {
                                        x--;
                                        dx += 2;
                                        err += (-radius << 1) + dx;
                                    }
                                }
                                if (x !== lx) {
                                    const xa = ly * xScale | 0;
                                    const ya = lx * yScale | 0;
                                    ctx.rect(x0 - xa, y0 - ya, xa * 2 + 1, 1);
                                    ctx.rect(x0 - xa, y1 + ya, xa * 2 + 1, 1);
                                }
                            }
                        } else {
                            if (radius < smallAliasCirclesFill.length) {
                                const sc = smallAliasCirclesFill[radius];
                                const len = sc.length;
                                while(y < len) {
                                    x = sc[y];
                                    ctx.rect(x0 - x, y0 - y, x * 2 + 2, 1);
                                    ctx.rect(x0 - x, y1 + y, x * 2 + 2, 1);
                                    y ++
                                }
                            } else {
                                var lx = x,ly = y;
                                while (x >= y) {
                                    ctx.rect(x0 - x, y1 + y, x * 2 + 2, 1);
                                    ctx.rect(x0 - x, y0 - y, x * 2 + 2, 1);
                                    if (x !== lx) {
                                        ctx.rect(x0 - ly, y0 - lx, ly * 2 + 2, 1);
                                        ctx.rect(x0 - ly, y1 + lx, ly * 2 + 2, 1);
                                    }
                                    lx = x;
                                    ly = y;
                                    y++;
                                    err += dy;
                                    dy += 2;
                                    if (err > 0) {
                                        x--;
                                        dx += 2;
                                        err += (-radius << 1) + dx;
                                    }
                                }
                                if (x !== lx) {
                                    ctx.rect(x0 - ly, y0 - lx, ly * 2 + 1, 1);
                                    ctx.rect(x0 - ly, y1 + lx, ly * 2 + 1, 1);
                                }
                            }
                        }
                        if (renderFunctions.gradient.currentGradient) {
                            if (shapeModStates.shift) {
                                ctx.setTransform(xScale, 0, 0, yScale, x0, y0);
                                ctx.fillStyle = renderFunctions.gradient.currentGradient(
                                    ctx,
                                    -radius, -radius,
                                    radius * 2 + 1, radius * 2 + 1,
                                    gradientColorCurve, gradientAlphaCurve
                                );
                                ctx.fill();
                                ctx.setTransform(1, 0, 0, 1, 0, 0);
                            } else {
                                ctx.fillStyle = renderFunctions.gradient.currentGradient(
                                    ctx,
                                    x0 - radius, y0 - radius,
                                    radius * 2 + 1,radius * 2 + 1,
                                    gradientColorCurve, gradientAlphaCurve
                                );
                                ctx.fill();
                            }
                        } else {
                            ctx.fill();
                        }
                    }
                    if (paint.fillMode === fillModes.outline || paint.fillMode === fillModes.fillOutline)  {
                        if (paint.fillMode === fillModes.fillOutline) {
                            ctx.globalCompositeOperation = secondDrawMode;
                            ctx.fillStyle = secondColor;
                        }
                        if (shapeModStates.shift) {
                            if (radius < smallAliasCirclesStroke.length) {
                                if (radius === 2 || radius === 3) {  // For some reason chrome is not drawing bottom line at these radius so this is a fix
                                        const x = Math.floor(x0 - (radius - 1));
                                        const y = Math.floor(y0 - (radius - 1));
                                        const d = radius + radius - 1;
                                        const e = radius + radius;
                                        ctx.fillRect(x + 1, y + 0, d - 1, 1);
                                        ctx.fillRect(x + 1, y + d, d - 1, 1);
                                        ctx.fillRect(x + 0, y + 1, 1, d - 1);
                                        ctx.fillRect(x + d, y + 1, 1, d - 1);
                                        return;
                                } else {
                                    ctx.beginPath();
                                    const sc = smallAliasCirclesStroke[radius];
                                    const len = sc.length;
                                    var i = 0;
                                    while(i < len) {
                                        x = sc[i] | 0;
                                        y = sc[i+1] | 0;
                                        ctx.rect(x0 - ((x +  offset) * xScale | 0), y0 - ((y + offset) * yScale | 0), size, size);
                                        ctx.rect(x1 + ((x -  offset) * xScale | 0), y0 - ((y + offset) * yScale | 0), size, size);
                                        ctx.rect(x0 - ((x +  offset) * xScale | 0), y1 + ((y - offset) * yScale | 0), size, size);
                                        ctx.rect(x1 + ((x -  offset) * xScale | 0), y1 + ((y - offset) * yScale | 0), size, size);
                                        i += 2;
                                    }
                                }
                            } else {
                                ctx.beginPath();
                                x = radius-1;
                                y = 0;
                                dx = 1;
                                dy = 1;
                                err = dx - (radius << 1);
                                while (x >= y) {
                                    ctx.rect(x1 + ((x - offset) * xScale | 0), y1 + ((y - offset) * yScale | 0), size, size);
                                    ctx.rect(x0 - ((x + offset) * xScale | 0), y0 - ((y + offset) * yScale | 0), size, size);
                                    ctx.rect(x0 - ((y + offset) * xScale | 0), y1 + ((x - offset) * yScale | 0), size, size);
                                    ctx.rect(x1 + ((x - offset) * xScale | 0), y0 - ((y + offset) * yScale | 0), size, size);
                                    if (x > y) {
                                        ctx.rect(x1 + ((y - offset) * xScale | 0), y1 + ((x - offset) * yScale | 0), size, size);
                                        ctx.rect(x0 - ((x + offset) * xScale | 0), y1 + ((y - offset) * yScale | 0), size, size);
                                        ctx.rect(x0 - ((y + offset) * xScale | 0), y0 - ((x + offset) * yScale | 0), size, size);
                                        ctx.rect(x1 + ((y - offset) * xScale | 0), y0 - ((x + offset) * yScale | 0), size, size);
                                    }
                                    y++;
                                    err += dy;
                                    dy += 2;
                                    if (err > 0) {
                                        x--;
                                        dx += 2;
                                        err += (-radius << 1) + dx;
                                    }
                                }
                            }
                        } else {
                            if (radius < smallAliasCirclesStroke.length) {
                                if (radius === 2 || radius === 3) {  // For some reason chrome is not drawing bottom line at these radius so this is a fix
                                        const x = Math.floor(x0 - (radius - 1));
                                        const y = Math.floor(y0 - (radius - 1));
                                        const d = radius + radius - 1;
                                        const e = radius + radius;
                                        ctx.fillRect(x + 1, y + 0, d - 1, 1);
                                        ctx.fillRect(x + 1, y + d, d - 1, 1);
                                        ctx.fillRect(x + 0, y + 1, 1, d - 1);
                                        ctx.fillRect(x + d, y + 1, 1, d - 1);
                                        return;
                                } else {
                                    ctx.beginPath();
                                    const sc = smallAliasCirclesStroke[radius];
                                    const len = sc.length;
                                    var i = 0;
                                    while(i < len) {
                                        x = sc[i] | 0;
                                        y = sc[i+1] | 0;
                                        ctx.rect(x0 - x -  offset, y0 - y - offset, size, size);
                                        ctx.rect(x1 + x -  offset, y0 - y - offset, size, size);
                                        ctx.rect(x0 - x -  offset, y1 + y - offset, size, size);
                                        ctx.rect(x1 + x -  offset, y1 + y - offset, size, size);
                                        i += 2;
                                    }
                                }
                            } else {
                                ctx.beginPath();
                                x = radius-1;
                                y = 0;
                                dx = 1;
                                dy = 1;
                                err = dx - (radius << 1);
                                while (x >= y) {
                                    ctx.rect(x1 + x - offset, y1 + y - offset, size, size);
                                    ctx.rect(x0 - x - offset, y0 - y - offset, size, size);
                                    ctx.rect(x0 - y - offset, y1 + x - offset, size, size);
                                    ctx.rect(x1 + x - offset, y0 - y - offset, size, size);
                                    if (x > y) {
                                        ctx.rect(x1 + y - offset, y1 + x - offset, size, size);
                                        ctx.rect(x0 - x - offset, y1 + y - offset, size, size);
                                        ctx.rect(x0 - y - offset, y0 - x - offset, size, size);
                                        ctx.rect(x1 + y - offset, y0 - x - offset, size, size);
                                    }
                                    y++;
                                    err += dy;
                                    dy += 2;
                                    if (err > 0) {
                                        x--;
                                        dx += 2;
                                        err += (-radius << 1) + dx;
                                    }
                                }
                            }
                        }
                        ctx.fill("nonzero");
                    }
                },
                circleGuides(spr) {
                    var i,k,j,len,angX, angY, angY1, angX1, radX, radY, rad, ax, ay, cx, cy, dist, ang, px, py, ax,ay,x,y,ox,oy;
                    const ctx = spr.image.ctx;
                    if (paint.gridGuides) {
                        if (mouse.gMouse.count > 1) {
                            const point = renderFunctions.alias.point;
                            const bm = brushMin / 2;
                            ctx.beginPath();
                            len = mouse.gMouse.count;
                            if (mouse.gMouse.gridALocked !== -1) {
                                j = mouse.gMouse.gridALocked;
                                if (mouse.gMouse.gridBLocked !== -1) { i =  mouse.gMouse.gridBLocked }
                                else { i =  mouse.gMouse.minIndex }
                            } else {
                                i = mouse.gMouse.minIndex;
                                j = (i + 1) % len;
                            }
                            const pms = guides.guides[j];
                            const ms = guides.guides[i];
                            if (pms && ms) {
                                const pg = pms.grid;
                                const g = ms.grid;
                                const gcx = mouse.gMouse.wox;
                                const gcy = mouse.gMouse.woy;
                                angY = pg.angle;
                                angX = g.angle;
                                angY1 = pms.getGridLine(mouse.cMouse.rox,mouse.cMouse.roy) - angY;
                                angX1 = ms.getGridLine(mouse.cMouse.rox,mouse.cMouse.roy) - angX;
                                workPointC.x = mouse.cMouse.rox;
                                workPointC.y = mouse.cMouse.roy;
                                spr.key.toLocalPoint(workPointC);
                                radX = (g.p4.x - g.p3.x) / 2;
                                radY = (pg.p4.x - pg.p3.x) / 2;
                                radX = Math.max(radX,radY);
                                radY = Math.max(radX,radY);
                                rad = Math.max( Math.abs(radX), Math.abs(radY))
                                mouse.gMouse.guideCircleRadius = rad;
                                ax = angX + angX1 * 0.5;
                                ay = angY + angY1 * 0.5;
                                cx = spr.key._lx;// + radX * Math.cos(ax) + radY * Math.cos(ay);
                                cy = spr.key._ly;// + radX * Math.sin(ax) + radY * Math.sin(ay);
                                dist = 1 / (rad * Math.PI * 2);
                                if (bm > 2) { dist *= bm / 2 }
                                for (k = 0; k < 1; k += dist) {
                                    ang = k * Math.PI*2;
                                    px = Math.cos(ang);
                                    py = Math.sin(ang);
                                    ax = ((px + 1) / 2) * angX1 + angX;
                                    ay = ((py + 1) / 2) * angY1 + angY;
                                    px = px * radX;
                                    py = py * radY;
                                    x = (px * Math.cos(ax) + py * Math.cos(ay) + cx + 4096 | 0) - 4096;
                                    y = (px * Math.sin(ax) + py * Math.sin(ay) + cy + 4096 | 0) - 4096;
                                    if (bm > 1.5) {
                                        point(ctx,x,y,bm);
                                        dither++;
                                    } else {
                                        ctx.rect(x, y, 1, 1);
                                        if (k > 0 && Math.abs(ox - x) >1 || Math.abs(oy - y) > 1) {
                                            ctx.rect((x + ox) / 2| 0, (y + oy) / 2 | 0, 1, 1);
                                        }
                                    }
                                    ox = x;
                                    oy = y;
                                }
                            }
                            if (paint.fillMode === fillModes.fillOutline) {
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.fillStyle = secondColor;
                            }
                            ctx.fill()
                        }
                    }
                },
                rectangle(spr) {
                    const ctx = spr.image.ctx;
                    if (paint.gridGuides) {
                        if (mouse.gMouse.count > 1) {
                            var len = mouse.gMouse.count;
                            var i,j;
                            if (mouse.gMouse.gridALocked > -1) {
                                j = mouse.gMouse.gridALocked;
                                if (mouse.gMouse.gridBLocked !== -1) { i =  mouse.gMouse.gridBLocked }
                                else { i =  mouse.gMouse.minIndex }
                            } else {
                                i = mouse.gMouse.minIndex;
                                j = (i + 1) % len;
                            }
                            const pms = guides.guides[j];
                            const ms = guides.guides[i];
                            if (pms && ms) {
                                const pg = pms.grid;
                                const g = ms.grid;
                                const gcx = mouse.cMouse.rox;
                                const gcy = mouse.cMouse.roy;
                                pms.getGridLine();
                                ms.getGridLine(gcx, gcy);
                                spr.key.toLocalPoint(getLineIntercept(pg, g, workPointA));
                                ms.getGridLine();
                                pms.getGridLine(gcx, gcy);
                                spr.key.toLocalPoint(getLineIntercept(pg, g, workPointB));
                                workPointC.x = gcx;
                                workPointC.y = gcy;
                                spr.key.toLocalPoint(workPointC);
                                ctx.beginPath();
                                ctx.moveTo( spr.key._lx + 0.5,  spr.key._ly + 0.5);
                                ctx.lineTo(workPointA.x + 0.5, workPointA.y + 0.5);
                                ctx.lineTo(workPointC.x + 0.5, workPointC.y + 0.5);
                                ctx.lineTo(workPointB.x + 0.5, workPointB.y + 0.5);
                                ctx.closePath();
                                if (paint.fillMode === fillModes.fill || paint.fillMode === fillModes.fillOutline) {
                                    if (renderFunctions.gradient.currentGradient) {
                                        const wm = workMatrix;
                                        wm.ident();
                                        wm.position(spr.key._lx + 0.5,     spr.key._ly + 0.5);
                                        wm.axisFromLine(spr.key._lx + 0.5, spr.key._ly + 0.5, workPointA.x + 0.5, workPointA.y + 0.5, 0);
                                        wm.axisFromLine(spr.key._lx + 0.5, spr.key._ly + 0.5, workPointB.x + 0.5, workPointB.y + 0.5, 1);
                                        ctx.fillStyle = renderFunctions.gradient.currentGradient(ctx, 0, 0, wm.axisXLen, wm.axisYLen, gradientColorCurve, gradientAlphaCurve);
                                        wm.apply(ctx);
                                        ctx.fill();
                                        ctx.setTransform(1,0,0,1,0,0);
                                    } else { ctx.fill() }
                                 }
                                if (paint.fillMode === fillModes.outline || paint.fillMode === fillModes.fillOutline)  {
                                    const tempBrushMin = brushMin;
                                    brushMin += 1;
                                    colours.setContextDrawMode(ctx, nextDrawMode);
                                    ctx.fillStyle = ctx.strokeStyle;
                                    ctx.beginPath();
                                    renderFunctions.alias.lineForShape(ctx, spr.key._lx  + 0.5, spr.key._ly  + 0.5, workPointA.x + 0.5, workPointA.y + 0.5, true, false);
                                    renderFunctions.alias.lineForShape(ctx, workPointA.x + 0.5, workPointA.y + 0.5, workPointC.x + 0.5, workPointC.y + 0.5, true, false);
                                    renderFunctions.alias.lineForShape(ctx, workPointC.x + 0.5, workPointC.y + 0.5, workPointB.x + 0.5, workPointB.y + 0.5, true, false);
                                    renderFunctions.alias.lineForShape(ctx, workPointB.x + 0.5, workPointB.y + 0.5, spr.key._lx  + 0.5, spr.key._ly  + 0.5, true, false);
                                    ctx.fill();
                                    brushMin = tempBrushMin;
                                }
                                return;
                            }
                        }
                    } else {
                        const s = Math.max(1, brushMin | 0);
                        const o = s / 2;
                        var x = Math.round(Math.min(spr.key._lx, spr.key.lx) - o);
                        var y = Math.round(Math.min(spr.key._ly, spr.key.ly) - o);
                        var w = Math.round(Math.max(spr.key._lx,spr.key.lx) - x + o)-s;
                        var h = Math.round(Math.max(spr.key._ly,spr.key.ly) - y + o)-s;
                        if (renderFunctions.gradient.currentGradient) { ctx.fillStyle = renderFunctions.gradient.currentGradient(ctx, x, y, w, h, gradientColorCurve, gradientAlphaCurve) }
                        if (paint.fillMode === fillModes.fill) {
                            x = Math.floor(Math.min(spr.key._lx, spr.key.lx));
                            y = Math.floor(Math.min(spr.key._ly, spr.key.ly));
                            w = Math.floor(Math.max(spr.key._lx, spr.key.lx) + 1 - x);
                            h = Math.floor(Math.max(spr.key._ly, spr.key.ly) + 1 - y);
                            ctx.beginPath();
                            ctx.rect(x, y, w, h);
                            ctx.fill()
                        } else if (paint.fillMode === fillModes.fillOutline)  {
                            ctx.beginPath();
                            ctx.rect(x + s, y + s, w, h);
                            ctx.fill()
                        }
                        if (paint.fillMode === fillModes.outline || paint.fillMode === fillModes.fillOutline)  {
                            if (paint.fillMode === fillModes.fillOutline) {
                                ctx.globalCompositeOperation = secondDrawMode;
                                ctx.fillStyle = secondColor;
                            }
                            ctx.beginPath();
                            ctx.rect(x, y, w + s , s);
                            ctx.rect(x, y + h, w + s, s);
                            ctx.rect(x, y + s, s, h);
                            ctx.rect(x + w, y + s, s, h);
                            ctx.fill();
                        }
                    }
                },
                floodFillLandingOn(spr) {
                    const ctx = spr.image.ctx;
                    const cc = spr.image.desc.clipped;
                    const x = (spr.key._lx + 4096 | 0) - 4096;
                    const y = (spr.key._ly + 4096 | 0) - 4096;
                    if ((spr.image.desc.clipType && (x >= cc.x && y >= cc.y && x < cc.x1 && y < cc.y1)) ||
                       (!spr.image.desc.clipType && (x >= 0 && y >= 0 && x < spr.image.w && y < spr.image.h))) {
                           const data = spr.image.ctx.getImageData(x,y,1,1);
                           return data.data[3];
                    }
                    return -1;
                },
                floodFill(spr) {
                    const ctx = spr.image.ctx;
                    const cc = spr.image.desc.clipped;
                    const x = (spr.key._lx + 4096 | 0) - 4096;
                    const y = (spr.key._ly + 4096 | 0) - 4096;
                    if ((spr.image.desc.clipType && (x >= cc.x && y >= cc.y && x < cc.x1 && y < cc.y1)) ||
                       (!spr.image.desc.clipType && (x >= 0 && y >= 0 && x < spr.image.w && y < spr.image.h))) {
                        if (renderFunctions.gradient.currentGradient) {
                            const g = renderFunctions.gradient.currentGradient(ctx, x, y, spr.image.w, spr.image.h);
                            localProcessImage.floodFill(spr.image,  x, y, brushMin  | 0, false, false, g, true, fillAreaMode);
                        } else {
                            localProcessImage.floodFill(spr.image, x, y, brushMin | 0, false, false, ctx.fillStyle, true, fillAreaMode);
                        }
                    } else {
						spr.image.processed = true;  // for undo to be consistent across all active drawables
					}
                },
                floodFillDiagonal(spr) {
                    const ctx = spr.image.ctx;
                    const cc = spr.image.desc.clipped;
                    const x = (spr.key._lx + 4096 | 0) - 4096;
                    const y = (spr.key._ly + 4096 | 0) - 4096;
                    if ((spr.image.desc.clipType && (x >= cc.x && y >= cc.y && x < cc.x1 && y < cc.y1)) ||
                       (!spr.image.desc.clipType && (x >= 0 && y >= 0 && x < spr.image.w && y < spr.image.h))) {
                        if (renderFunctions.gradient.currentGradient) {
                            const g = renderFunctions.gradient.currentGradient(ctx, x, y, spr.image.w, spr.image.h);
                            localProcessImage.floodFill(spr.image,  x, y, brushMin  | 0, true, false, g, true, fillAreaMode);
                        } else {
                            localProcessImage.floodFill(spr.image,  x, y, brushMin  | 0, true, false, ctx.fillStyle, true, fillAreaMode);
                        }
                    } else {
						spr.image.processed = true;  // for undo to be consistent across all active drawables
					}
                },
                floodFillEdge(spr) {
                    const ctx = spr.image.ctx;
                    const xx = (spr.key._lx + 4096 | 0) - 4096;
                    const yy = (spr.key._ly + 4096 | 0) - 4096;
                    if (edgeFill.doIt) {
                        const cc = spr.image.desc.clipped;
                        if (!((spr.image.desc.clipType && (xx >= cc.x && yy >= cc.y && xx < cc.x1 && yy < cc.y1)) ||
                           (!spr.image.desc.clipType && (xx >= 0 && y >= 0 && xx < spr.image.w && yy < spr.image.h)))) {
                            if (edgeFill.useFeedback) {
                                if (!spr.image.restored) { spr.image.restore() }
                            }
                            localProcessImage.floodFillOutline(spr.image, xx, yy, brushMin| 0, false, edgeFill.select, ctx.fillStyle, true, fillAreaMode);
                        }
                        return;
                    }
                    if (edgeFill.started) {
                        var x = mouse.marked.x;
                        var y = mouse.marked.y;
                        var px = mouse.x - x;
                        var py = mouse.y - y;
                        var dist = Math.sqrt(px * px + py * py);
                        if (dist < 8) {
                            edgeFill.distSegment = 0;
                            edgeFill.select = 0b11111111;
                        } else {
                            var ang = Math.atan2(py,px) + Math.PI / 8;
                            ang = ((ang % Math.PI2) + Math.PI2) % Math.PI2;
                            ang /= Math.PI2;
                            ang *= 8;
                            ang |= 0;
                            edgeFill.select = edgeFill.edges[ang];
                            edgeFill.distSegment =4;
                            var ang1 = ang;
                            if (dist < 32) {
                                ang += 1;
                                ang1 += 7;
                                edgeFill.select |= edgeFill.edges[ang % 8] | edgeFill.edges[ang1 % 8];
                                edgeFill.distSegment--;
                            }
                            if (dist < 24) {
                                ang += 1;
                                ang1 += 7;
                                edgeFill.select |= edgeFill.edges[ang % 8] | edgeFill.edges[ang1 % 8];
                                edgeFill.distSegment--;
                            }
                            if (dist < 16) {
                                ang += 1;
                                ang1 += 7;
                                edgeFill.select |= edgeFill.edges[ang % 8] | edgeFill.edges[ang1 % 8];
                                edgeFill.distSegment--;
                            }
                        }
                        if (edgeFill.useFeedback) {
                            if (edgeFill.select !== edgeFill.selectPreviouse) {
                                if (!spr.image.restored) { spr.image.restore() }
                                localProcessImage.floodFillOutlineTemp(spr.image, xx, yy, brushMax| 0, false, edgeFill.select, ctx.fillStyle, fillAreaMode);
                                edgeFill.selectPreviouse = edgeFill.select;
                            }
                        }
                    } else {
                        edgeFill.started = true;
                        edgeFill.selectPreviouse =- 1;
                    }
               }
            },
            antiAlias : {
                point(ctx,x,y,size) { // assumes points size <=1 are not sent here.
                    size /= 2;
                    ctx.moveTo(x + size, y);
                    ctx.arc(x, y, size, 0, Math.PI2);
                },
                line(ctx,x1,y1,x2,y2) {
                    ctx.lineWidth = brushMin / 2;
                    ctx.lineCap = "butt";
                    ctx.beginPath();
                    ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                },
                lineColorAlpha(ctx,x1,y1,x2,y2) {
                    var m = brushMin / 4 ;
                    var M = paint.sizeBlend ? brushMax / 4 : m;
                    var x = x2 - x1;
                    var y = y2 - y1;
                    const len = Math.sqrt(x * x + y * y);
                    const colorCurve = paint.randColor ? curves.brushAlpha : ( paint.colorBlend ? curves.lineColor : undefined );
                    const alphaCurve = paint.useAlphaDist ? curves.lineAlpha : undefined
                    if (len) {
                        x /= len;
                        y /= len;
                    } else {
                        x = y = 0;
                    }
                    const smoothing = ctx.imageSmoothingEnabled;
                    if (paint.gradientMode === 3) {
                        ctx.imageSmoothingEnabled = paint.antiAlias;
                        ctx.fillStyle = API.gradient.lineLengthPattern(ctx, x1, y1, x2, y2, Math.max(m, M) * 2);
                    } else if (paint.gradientMode === 2) {
                        ctx.fillStyle = API.gradient.lineWidth(ctx, x1, y1, x2, y2, Math.max(m, M)  * 2);
                    } else if (colorCurve && !alphaCurve) {
                        if (paint.recycleColor || paint.recycleDestination) {
                            ctx.imageSmoothingEnabled = paint.antiAlias;
                            ctx.fillStyle = API.image.imageLinePatternBlend(imageTopSrc, x1, y1, x2, y2, m);
                        } else {
                            ctx.fillStyle = API.gradient.lineLength(ctx, x1, y1, x2, y2, colorCurve, alphaCurve);
                        }
                    } else if (colorCurve || alphaCurve) {
                        ctx.fillStyle = API.gradient.lineLength(ctx, x1, y1, x2, y2, colorCurve, alphaCurve);
                    }else if (paint.recycleColor || paint.recycleDestination) {
                        ctx.imageSmoothingEnabled = paint.antiAlias;
                        ctx.fillStyle = API.image.imageLinePattern(imageTopSrc, x1, y1, x2, y2, m)
                    }
                    ctx.beginPath();
                    ctx.lineTo(x1 + y * m, y1 - x * m);
                    ctx.lineTo(x2 + y * m, y2 - x * m);
                    ctx.lineTo(x2 - y * m, y2 + x * m);
                    ctx.lineTo(x1 - y * m, y1 + x * m);
                    ctx.fill();
                    ctx.imageSmoothingEnabled = smoothing;
                },
                widthArray : [0], // first value is length
                lineColorAlphaWidth(ctx,x1,y1,x2,y2) {
                    const colorCurve = paint.randColor ? curves.brushAlpha : ( paint.colorBlend ? curves.lineColor : undefined );
                    const alphaCurve = paint.useAlphaDist ? curves.lineAlpha : undefined
                    const widthCurve = paint.sizeBlend ? curves.lineWidth : undefined;
                    const wa = renderFunctions.antiAlias.widthArray;
                    var arrPos = 1;
                    wa[0] = 0;
                    var x = x2 - x1;
                    var y = y2 - y1;
                    const len = Math.sqrt(x * x + y * y);
                    var m = (widthCurve(0) * brushRange + brushMin) / 4;
                    var M = (widthCurve(1) * brushRange + brushMin) / 4;
                    if (len) {
                        x /= len;
                        y /= len;
                    } else {
                        x = y = 0;
                    }
                    const smoothing = ctx.imageSmoothingEnabled;
                    if (paint.gradientMode === 3) {
                        ctx.imageSmoothingEnabled = paint.antiAlias;
                        ctx.fillStyle = API.gradient.lineLengthPattern(ctx, x1, y1, x2, y2, Math.max(m, M) * 2);
                    } else if (paint.gradientMode === 2) {
                        ctx.fillStyle = API.gradient.lineWidth(ctx, x1 , y1, x2, y2, Math.max(m, M));
                    } else if (colorCurve && !alphaCurve) {
                        if (paint.recycleColor || paint.recycleDestination) {
                            ctx.imageSmoothingEnabled = paint.antiAlias;
                            ctx.fillStyle = API.image.imageLinePatternBlend(imageTopSrc, x1, y1, x2, y2, m);
                        } else {
                            ctx.fillStyle = API.gradient.lineLength(ctx, x1, y1, x2, y2, colorCurve, alphaCurve);
                        }
                    } else if (colorCurve || alphaCurve) {
                        ctx.fillStyle = API.gradient.lineLength(ctx, x1, y1, x2, y2, colorCurve, alphaCurve);
                    }else if (paint.recycleColor || paint.recycleDestination) {
                        ctx.imageSmoothingEnabled = paint.antiAlias;
                        ctx.fillStyle = API.image.imageLinePattern(imageTopSrc, x1, y1, x2, y2, m)
                    }
                    ctx.beginPath();
                    wa[arrPos++] = m;
                    wa[arrPos++] = 0;
                    var mRange = M-m;
                    var dist = 0;
                    var w = (widthCurve(dist / len) * brushRange + brushMin) /4;
                    wa[arrPos++] = w;
                    wa[arrPos++] = dist;
                    while(dist < len) {
                        ctx.lineTo(x1 + x * dist + y * w, y1 + y * dist - x * w);
                        dist += 1;
                        w = (widthCurve(dist / len) * brushRange + brushMin) / 4;
                        wa[arrPos++] = w;
                        wa[arrPos++] = dist;
                    }
                    arrPos --;
                    while(arrPos > 2) {
                        dist = wa[arrPos--];
                        w = wa[arrPos--];
                        ctx.lineTo(x1 + x * dist - y * w, y1 + y * dist + x * w);
                    }
                    ctx.fill();
                    ctx.imageSmoothingEnabled = smoothing;
                },
                circle(spr) {
                    var i,k,j,len,angX, angY, angY1, angX1, radX, radY, rad, ax, ay, cx, cy, dist, ang, px, py, ax,ay,x,y,ox,oy,gcx,gcy;
                    var gradientToGuids = false;
                    var usingGuides = false;
                    const ctx = spr.image.ctx;
                    ctx.lineWidth = brushMin/4;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    if (paint.gridGuides) {
                        usingGuides = true;
                        if (mouse.gMouse.count > 1) {
                            len = mouse.gMouse.count;
                            if (mouse.gMouse.gridALocked > -1) {
                                j = mouse.gMouse.gridALocked;
                                if (mouse.gMouse.gridBLocked !== -1) { i =  mouse.gMouse.gridBLocked }
                                else { i =  mouse.gMouse.minIndex }
                            } else {
                                i = mouse.gMouse.minIndex;
                                j = (i + 1) % len;
                            }
                            const pms = guides.guides[j];
                            const ms = guides.guides[i];
                            if (pms && ms) {
                                gcx = mouse.cMouse.rox;
                                gcy = mouse.cMouse.roy;
                                const pg = pms.grid;
                                const g = ms.grid;
                                angY = pg.angle;
                                angX = g.angle;
                                angY1 = pms.getGridLine(mouse.cMouse.rox,mouse.cMouse.roy) - angY;
                                angX1 = ms.getGridLine(mouse.cMouse.rox,mouse.cMouse.roy) - angX;
                                workPointC.x = mouse.cMouse.rox;
                                workPointC.y = mouse.cMouse.roy;
                                spr.key.toLocalPoint(workPointC);
                                radX = (g.p4.x - g.p3.x) / 2;
                                radY = (pg.p4.x - pg.p3.x) / 2;
                                radX = Math.max(radX,radY);
                                radY = Math.max(radX,radY);
                                rad = Math.max( Math.abs(radX), Math.abs(radY));
                                mouse.gMouse.guideCircleRadius = rad;
                                ax = angX + angX1 * 0.5;
                                ay = angY + angY1 * 0.5;
                                cx = spr.key._lx;// + radX * Math.cos(ax) + radY * Math.cos(ay);
                                cy = spr.key._ly;// + radX * Math.sin(ax) + radY * Math.sin(ay);
                                dist = 1 / (rad * Math.PI);
                                for (k = 0; k < 1; k += dist) {
                                    ang = k * Math.PI*2;
                                    px = Math.cos(ang);
                                    py = Math.sin(ang);
                                    ax = ((px + 1) / 2) * angX1 + angX;
                                    ay = ((py + 1) / 2) * angY1 + angY;
                                    px = px * radX;
                                    py = py * radY;
                                    x = px * Math.cos(ax) + py * Math.cos(ay) + cx;
                                    y = px * Math.sin(ax) + py * Math.sin(ay) + cy;
                                    ctx.lineTo(x,y);
                                }
                                ctx.closePath();
                                if (renderFunctions.gradient.currentGradient && (paint.fillMode === fillModes.fill || paint.fillMode === fillModes.fillOutline)) {
                                    gradientToGuids = true;
                                    const wm = workMatrix;
                                    wm.ident();
                                    wm.position(cx,cy);
                                    ax = angX1 + angX;
                                    ay = angY1 + angY;
                                    wm.axisFromLine(0, 0, radX * Math.cos(ax), radX * Math.sin(ax), 0);
                                    wm.axisFromLine(0, 0, radY * Math.cos(ay), radY * Math.sin(ay), 1);
                                }
                            }
                        }
                    } else {
                        if (shapeModStates.shift) {
                            var radiusX = Math.abs(spr.key._lx- spr.key.lx);
                            var radiusY = Math.abs(spr.key._ly- spr.key.ly);
                            ctx.setTransform(radiusX / radiusY, 0, 0, 1, spr.key._lx, spr.key._ly);
                            ctx.arc(0, 0,radiusY,0,Math.PI * 2);
                            radius = radiusY;
                            aliasCircleRadiusY = radiusY;
                            aliasCircleRadiusX = radiusX;
                        } else {
                            var radius = ((spr.key._lx- spr.key.lx) ** 2 + (spr.key._ly- spr.key.ly) ** 2) ** 0.5;
                            ctx.arc(spr.key._lx, spr.key._ly,radius,0,Math.PI * 2);
                            aliasCircleRadiusY = radius;
                            aliasCircleRadiusX = radius;
                        }
                    }
                    if (paint.fillMode === fillModes.fill || paint.fillMode === fillModes.fillOutline) {
                        if (renderFunctions.gradient.currentGradient) {
                            if (usingGuides) {
                                if (gradientToGuids) {
                                    const wm = workMatrix;
                                    ctx.fillStyle = renderFunctions.gradient.currentGradient(ctx,-wm.axisXLen,-wm.axisYLen,wm.axisXLen*2,wm.axisYLen*2,gradientColorCurve,gradientAlphaCurve);
                                    wm.apply(ctx);
                                    ctx.fill();
                                    ctx.setTransform(1,0,0,1,0,0);
                                }
                            } else {
                                if (shapeModStates.shift) {
                                    ctx.fillStyle = renderFunctions.gradient.currentGradient(
                                        ctx,
                                         - aliasCircleRadiusX,  - aliasCircleRadiusY,
                                        aliasCircleRadiusX * 2,aliasCircleRadiusY * 2,
                                        gradientColorCurve,gradientAlphaCurve);
                                } else {
                                    ctx.fillStyle = renderFunctions.gradient.currentGradient(
                                        ctx,
                                        spr.key._lx - radius, spr.key._ly - radius,
                                        radius * 2,radius * 2,
                                        gradientColorCurve,gradientAlphaCurve);
                                }
                                ctx.fill()
                            }
                        } else {
                            ctx.fill()
                        }
                    }
                    ctx.setTransform(1,0,0,1,0,0);
                    if (paint.fillMode === fillModes.outline || paint.fillMode === fillModes.fillOutline)  {
                        if (paint.fillMode === fillModes.fillOutline) {
                            ctx.globalCompositeOperation = secondDrawMode;
                            ctx.strokeStyle = secondColor;
                        }
                        ctx.stroke();
                    }
                },
                rectangle(spr) {
                    var gradientToGuids = false;
                    var grad;
                    const ctx = spr.image.ctx;
                    ctx.lineWidth = brushMin/2;
                    ctx.lineJoin = "miter";
                    ctx.beginPath();
                    if (paint.gridGuides) {
                        if (mouse.gMouse.count > 1) {
                            var len = mouse.gMouse.count;
                            var i,j;
                            if (mouse.gMouse.gridALocked >-1) {
                                j = mouse.gMouse.gridALocked;
                                if (mouse.gMouse.gridBLocked !== -1) { i =  mouse.gMouse.gridBLocked }
                                else { i =  mouse.gMouse.minIndex }
                            } else {
                                i = mouse.gMouse.minIndex;
                                j = (i + 1) % len;
                            }
                            const pms = guides.guides[j];
                            const ms = guides.guides[i];
                            if (pms && ms) {
                                const pg = pms.grid;
                                const g = ms.grid;
                                const gcx = mouse.cMouse.rox;
                                const gcy = mouse.cMouse.roy;
                                pms.getGridLine();
                                ms.getGridLine(gcx, gcy);
                                spr.key.toLocalPoint(getLineIntercept(pg, g, workPointA));
                                ms.getGridLine();
                                pms.getGridLine(gcx, gcy);
                                spr.key.toLocalPoint(getLineIntercept(pg, g, workPointB));
                                workPointC.x = gcx;
                                workPointC.y = gcy;
                                spr.key.toLocalPoint(workPointC);
                                ctx.moveTo(spr.key._lx + 0.5, spr.key._ly + 0.5)
                                ctx.lineTo(workPointA.x + 0.5, workPointA.y + 0.5)
                                ctx.lineTo(workPointC.x + 0.5, workPointC.y + 0.5)
                                ctx.lineTo(workPointB.x + 0.5, workPointB.y + 0.5)
                                ctx.closePath();
                                gradientToGuids = true;
                            }
                        }
                    } else {
                        ctx.rect(
                            Math.min(spr.key._lx, spr.key.lx) + 0.5,
                            Math.min(spr.key._ly, spr.key.ly) + 0.5,
                            Math.abs(spr.key._lx - spr.key.lx),
                            Math.abs(spr.key._ly - spr.key.ly)
                        );
                    }
                    if (renderFunctions.gradient.currentGradient) {
                        if (gradientToGuids) {
                            const wm = workMatrix;
                            wm.ident();
                            wm.position(spr.key._lx+ 0.5, spr.key._ly+ 0.5);
                            wm.axisFromLine(spr.key._lx+ 0.5, spr.key._ly+ 0.5, workPointA.x+ 0.5, workPointA.y+ 0.5, 0);
                            wm.axisFromLine(spr.key._lx+ 0.5, spr.key._ly+ 0.5, workPointB.x+ 0.5, workPointB.y+ 0.5, 1);
                            grad = renderFunctions.gradient.currentGradient(ctx,0,0,wm.axisXLen,wm.axisYLen,gradientColorCurve,gradientAlphaCurve);
                        } else {
                            let x = Math.min(spr.key._lx, spr.key.lx) + 0.5;
                            let y = Math.min(spr.key._ly, spr.key.ly) + 0.5;
                            let w = Math.abs(spr.key._lx - spr.key.lx);
                            let h = Math.abs(spr.key._ly - spr.key.ly);
                            grad = renderFunctions.gradient.currentGradient(ctx, x, y, w, h, gradientColorCurve, gradientAlphaCurve);
                        }
                    }
                    if (paint.fillMode === fillModes.fill || paint.fillMode === fillModes.fillOutline)  {
                        if (renderFunctions.gradient.currentGradient) {
                            if (gradientToGuids) {
                                const wm = workMatrix;
                                wm.ident();
                                wm.position(spr.key._lx+ 0.5, spr.key._ly+ 0.5);
                                wm.axisFromLine(spr.key._lx+ 0.5, spr.key._ly+ 0.5, workPointA.x+ 0.5, workPointA.y+ 0.5, 0);
                                wm.axisFromLine(spr.key._lx+ 0.5, spr.key._ly+ 0.5, workPointB.x+ 0.5, workPointB.y+ 0.5, 1);
                                ctx.fillStyle = grad;
                                wm.apply(ctx);
                                ctx.fill();
                                ctx.setTransform(1,0,0,1,0,0);
                            } else {
                                ctx.fillStyle = grad;
                                ctx.fill();
                            }
                        } else {
                            ctx.fill();
                        }
                    }
                    if (paint.fillMode === fillModes.outline || paint.fillMode === fillModes.fillOutline)  {
                        if (paint.fillMode === fillModes.fillOutline) {
                            ctx.globalCompositeOperation = secondDrawMode;
                            ctx.strokeStyle = secondDrawMode;
                        } else {
                            ctx.strokeStyle = grad;
                        }
                        ctx.stroke();
                    }
                },
                floodFill(spr) {
                    const ctx = spr.image.ctx;
                    const cc = spr.image.desc.clipped;
                    const x = spr.key._lx | 0;
                    const y = spr.key._ly | 0;
                    if ((spr.image.desc.clipType && (x >= cc.x && y >= cc.y && x < cc.x1 && y < cc.y1)) ||
                       (!spr.image.desc.clipType && (x >= 0 && y >= 0 && x < spr.image.w && y < spr.image.h))) {
                        if (renderFunctions.gradient.currentGradient) {
                            const g = renderFunctions.gradient.currentGradient(ctx, x, y, spr.image.w, spr.image.h);
                            localProcessImage.floodFill(spr.image,  x, y, brushMin  | 0, false, true, g, true, fillAreaMode);
                        } else {
                            localProcessImage.floodFill(spr.image, x, y, brushMin  | 0, false, true, ctx.fillStyle, true, fillAreaMode);
                        }
                    } else {
						spr.image.processed = true;  // for undo to be consistent across all active drawables
					}
                },
                floodFillDiagonal(spr) {
                    const ctx = spr.image.ctx;
                    const cc = spr.image.desc.clipped;
                    const x = spr.key._lx | 0;
                    const y = spr.key._ly | 0;
                    if ((spr.image.desc.clipType && (x >= cc.x && y >= cc.y && x < cc.x1 && y < cc.y1)) ||
                       (!spr.image.desc.clipType && (x >= 0 && y >= 0 && x < spr.image.w && y < spr.image.h))) {
                        if (renderFunctions.gradient.currentGradient) {
                            const g = renderFunctions.gradient.currentGradient(ctx, x, y, spr.image.w, spr.image.h);
                            localProcessImage.floodFill(spr.image, x, y, brushMin  | 0, true, true, g, true, fillAreaMode);
                        } else {
                            localProcessImage.floodFill(spr.image, x, y, brushMin  | 0, true, true, ctx.fillStyle, true, fillAreaMode);
                        }
                    } else {
						spr.image.processed = true;  // for undo to be consistent across all active drawables
					}
                },
            }
        };
        return API;
    })();
    const subStroke = renderFunctions.interpolate.desc;
    const getPixelColour = renderFunctions.pixel.getColor;
    const getPixelColourEnd = renderFunctions.pixel.getColorEndPoint;
    const getRandomColorSet = renderFunctions.pixel.getRandomColorSet;
    var refSprite; // sprite used to display info like line length etc
	var imageBrushRecycleFunction = renderFunctions.image.imageDirFade;
    colorFunctionSource = renderFunctions.pixel.pointColor;
    renderFunctions.interpolate.image.spray.pixel = renderFunctions.interpolate.image.spray.brush;
    renderFunctions.interpolate.image.spray.point = renderFunctions.interpolate.image.spray.brush;
    renderFunctions.interpolate.image.point.pixel = renderFunctions.interpolate.image.point.brush;
    renderFunctions.interpolate.image.point.point = renderFunctions.interpolate.image.point.brush;
    const penRenderOptions = {
        global() {
            // if (paint.useSelectionClip) {
                // selectionClip.irate();
                // cuttingTools.getExtent(selectionClip);
            // }
        },
        floodFill() {
            //penRenderOptions.global();
            if (paint.fillMode === fillModes.floodFill) {
                API.cursor = "flood_fill";
                API.feedbackRenderMove =  undefined;
                if (paint.antiAlias) {
                    renderMove = renderFunctions.antiAlias.floodFill;
                } else {
                    renderMove = renderFunctions.alias.floodFill;
                }
            } else if (paint.fillMode === fillModes.floodFillDiagonal) {
                API.cursor = "flood_fill_diagonal";
                API.feedbackRenderMove =  undefined;
                if (paint.antiAlias) {
                    renderMove = renderFunctions.antiAlias.floodFillDiagonal;
                } else {
                    renderMove = renderFunctions.alias.floodFillDiagonal;
                }
            } else if (paint.fillMode === fillModes.floodFillEdges) {
                API.cursor = "flood_fill_edge";
                renderMove = renderFunctions.alias.floodFillEdge;
                API.feedbackRenderMove =  feedbackGlobalrenders.edgeFill;
            }
            if (paint.gradientMode === 4) {
                renderFunctions.gradient.currentGradient = renderFunctions.gradient.cutBufferPattern;
            } else {
                renderFunctions.gradient.currentGradient = null;
            }
			//webGLFilterMenus.updatePaintStatus();
        },
        curve() {
           // penRenderOptions.global();
            API.canSnap = paint.pointMode;
			//webGLFilterMenus.updatePaintStatus();
        },
        points() {
            var funcSet;
           // penRenderOptions.global();
			paint.useDirection = paint.useDirectionShadow;
            colorModeFunc1 = renderFunctions.colorModes[API.options.colorModes[paint.colorMode]];
            colorModeFunc2 = renderFunctions.colorModes[API.options.colorModes[paint.colorMode2]];
			imageBrushRecycleFunction = renderFunctions.image["imageDirFade_" + API.options.imageRecycle[paint.colorMode]];
			imageBrushRecycleFunction = imageBrushRecycleFunction ? imageBrushRecycleFunction : renderFunctions.image.imageDirFade;
            colorModeFunc = colorModeFunc1;
            colorInterpFunction = colorInterpFunctionRGBAlpha;
            if (paint.drawType === commands.paintPoints) {
                if (paint.useSpeed) {
                    funcSet = renderFunctions.interpolate.image.point;
                    colorFunctionSource = renderFunctions.pixel.pointColor;
                } else {
                    funcSet = renderFunctions.interpolate.point;
                    colorFunctionSource = renderFunctions.pixel.sprayColor;
                }
            } else { // spray mode
                API.showPenAreaInner = paint.heightFade / 2;
                API.showPenAreaOuter = paint.widthFade / 2;
                if (paint.useSpeed) { // image  brush
                    funcSet = renderFunctions.interpolate.image.spray;
                    colorFunctionSource = renderFunctions.pixel.sprayBrushColor;
                } else {
                    funcSet = renderFunctions.interpolate.spray;
                    colorFunctionSource = renderFunctions.pixel.sprayColor;
                }
            }
            if (paint.useSpeed) {
                imageTop = renderFunctions.pixel.getTopImage();
                if (paint.recycleDestination) {
                    imageTopSrc = imageTop.image;
                } else {
                    imageTopSrc = imageTop.image.desc.mirror;
                }
                renderMove = funcSet.brush;
            } else {
                if (paint.sizeBlend) {
                    renderMove = funcSet.brush;
                    // forces rendered brush update. Was missing before will need to see how this impacts frame rates.
                    setPaintState()
                    renderFunctions.image.createMask(paint.sizeBlend? curves.brushAlpha: curves.flat)
                    renderFunctions.image.circleBrush(mainColor);
                } else {
                    if (paint.brushOptionsA > 0) {
                        renderMove = funcSet.pixelShape;
                    } else {
                        if (paint.antiAlias) {
                            renderMove = funcSet.point;
                        } else {
                            renderMove = funcSet.pixel;
                        }
                    }
                }
            }
			//webGLFilterMenus.updatePaintStatus();
        },
        shapes() {
            //paint.sizeBlend  // turn on colour
            //paint.useAlphaDist // use alhpa
            //penRenderOptions.global();
            if (paint.gradientMode > 0) {
                gradientColorCurve = paint.sizeBlend ? curves.brushColor : undefined; // turn on colour
                gradientAlphaCurve = paint.useAlphaDist  ? curves.brushAlpha : undefined;// use alhpa
                switch(paint.gradientMode) {
                    case 1:
                        renderFunctions.gradient.currentGradient = renderFunctions.gradient.rectangleLinear;
                        break;
                    case 2:
                        renderFunctions.gradient.currentGradient = renderFunctions.gradient.rectangleLinear90;
                        break;
                    case 3:
                        renderFunctions.gradient.currentGradient = renderFunctions.gradient.rectangleRadial;
                        break;
                    case 4:
                        renderFunctions.gradient.currentGradient = renderFunctions.gradient.cutBufferPattern;
                }
            } else {
                gradientColorCurve = undefined; // turn off colour
                gradientAlphaCurve = undefined;// use alhpa
                renderFunctions.gradient.currentGradient = null;
            }
            switch(paint.drawType) {
                case commands.paintLine:
                    guides.surfaceLock = false;
                    API.feedbackRenderMove = feedbackGlobalrenders.line;
                    API.penMove = penMove.line;
                    API.feedbackGuide = feedbackGlobalrenders.guides.line;
                    break;
                case commands.paintCircle:
                    guides.surfaceLock = paint.gridGuides;
                    if (paint.gridGuides) {
                        API.feedbackRenderMove = undefined;
                        API.feedbackGuide = feedbackGlobalrenders.guides.circle;
                    } else {
                        //API.feedbackRenderMove = undefined;
                        API.feedbackRenderMove = feedbackGlobalrenders.circle;
                        API.feedbackGuide = undefined;
                    }
                    API.penMove = penMove.circle;
                    break;
                case commands.paintRectangle:
                    guides.surfaceLock  = paint.gridGuides;
                    API.feedbackRenderMove = feedbackGlobalrenders.points;
                    API.penMove = penMove.rectangle;
                    API.feedbackGuide = feedbackGlobalrenders.guides.rectangle;
            }
			//webGLFilterMenus.updatePaintStatus();
        },
        specialBrushB() {
            //penRenderOptions.global();
            API.showPenAreaOuter = paint.widthFade/4;
            if (paint.colorMode > -1) {
                specialBrushes.setStepColorFunction(specialBrushes.options.colorTypes[paint.colorMode]);
            } else {
                specialBrushes.setStepColorFunction("basic");
            }
            paint.useDirection = paint.useDirectionShadow;
            penDown.specialBrushB();
            setPaintState()
            specialBrushes.currentLoad(colorRange);
            startingStroke = false;
            specialBrushes.usingArc = false;
            if (specialBrushes.forcePixelRender) {
                if (paint.antiAlias) {
                    renderMove = renderFunctions.interpolate.hairs.brushPixelAlias;
                } else {
                    renderMove = renderFunctions.interpolate.hairs.brushPixel;
                }
            } else {
                if (paint.antiAlias) {
                    if (paint.useSizeDist) {
                        renderMove = renderFunctions.interpolate.hairs.brushArc;
                        specialBrushes.usingArc = true;
                    } else {
                        renderMove = renderFunctions.interpolate.hairs.brush;
                    }
                } else {
                    renderMove = renderFunctions.interpolate.hairs.brushAlias;
                }
            }
			//webGLFilterMenus.updatePaintStatus();
        },
        cutPaste() {
            if (paint.drawType === commands.paintMagicCutter) { cuttingTools.selectionType = "magic"; }
            else if (paint.drawType === commands.paintCutter) { cuttingTools.selectionType = "box"; }
            else { cuttingTools.selectionType = "default"; }
			//webGLFilterMenus.updatePaintStatus();
        },
    }
    const penDown = {
        points() {
            renderFunctions.alias.walks[API.options.walkTypes[paint.brushOptionsB % API.options.walkTypes.length]]();
            renderFunctions.image.imageSettings();
            renderFunctions.image.createMask(paint.sizeBlend? curves.brushAlpha: curves.flat);
            renderFunctions.image.circleBrush(mainColor);
            startingStroke = true;
            colorRangeStartDry = false;
            colorRangeDry = false;
            guideScaling = 1;
            guideScalingStart = 1;
            if (!paint.useSpeed) {
                if (paint.palletFrom === commands.paintColImage) {
                    colorInterpFunction = colorInterpFunctionRGBAlpha;
                    if (!paint.recycleColor && !paint.recycleDestination) {
                        if (paint.randColor) {
                            colorRangeStartDry = true;
                            getRandomColorSet(colorRange,true);
                        }
                    }
                } else {
                    colorInterpFunction = colorInterpFunctionRGB;
                }
            } else {
				mouseBrush.resetDirection(0);
                colorInterpFunction = colorInterpFunctionRGBAlpha;
				waitingForDirection = paint.useDirection;
            }
        },
        curve() {
            curved.reset();
            curved.pointMode = paint.pointMode;
            startingStroke = true;
            mouse.cMouse._rx = mouse.cMouse.rx;
            mouse.cMouse._ry = mouse.cMouse.ry;
        },
        shapes() {
            shapeModStates.clear();
            startingStroke = true;
            aliasCircleCenterSnapCorrect = false;
            if (API.canSnap && paint.gridCanSnap && paint.drawType === commands.paintCircle) {
                if (mouse.cMouse.overSnap && mouse.cMouse.overSnapPoint && mouse.cMouse.overSnapPoint.alias) {
                    aliasCircleCenterSnapCorrect = true;
                    aliasCircleCenterSnap.as(mouse.cMouse.overSnapPoint.x,mouse.cMouse.overSnapPoint.y);
                }
            }
            lineDynamicPattern = false;
            if (paint.drawType === commands.paintLine && paint.palletFrom === commands.paintColImage) {
                const m = brushMin / 2 ;
                const M = paint.sizeBlend ? brushMax / 2 : m;
                if ((m > 1 || M > 1) && (paint.recycleColor || paint.recycleDestination)) {
                    lineDynamicPattern = true;
                    renderFunctions.image.linePatternInit();
                }
            }
            refSprite = renderFunctions.pixel.getTopImage();
            mouse.cMouse._rx = mouse.cMouse.rx;
            mouse.cMouse._ry = mouse.cMouse.ry;
        },
        specialBrushB() {
            mouseBrush.resetDirection(0);
            specialBrushes.updateColors(colorRangeRGB);
            if (paint.brushOptionsB > -1) { specialBrushes.setupShape(specialBrushes.options.shapeTypes[paint.brushOptionsB]) }
            else { specialBrushes.setupShape(specialBrushes.options.shapeTypes[0]) }
            if (paint.colorMode > -1) { specialBrushes.setStepColorFunction(specialBrushes.options.colorTypes[paint.colorMode]) }
            else { specialBrushes.setStepColorFunction("basic") }
            if (paint.useSpeed) {
                if (paint.brissleMode === 2 || paint.brissleMode === 3) { specialBrushes.setupStep("bendAndRotate") }
                else{ specialBrushes.setupStep("bend") }
            } else { specialBrushes.setupStep("basic") }
            if (paint.brushOptionsA > -1) {
                specialBrushes.setupStep(specialBrushes.options.stepTypes[paint.brushOptionsA]);
            }
            if (paint.colorBlend) { specialBrushes.setupLoad("curveRange") }
            else if (randomColor) { specialBrushes.setupLoad("randomRange") }
            else if (paint.palletFrom === commands.paintColImage) { specialBrushes.setupLoad("empty") }
            else { specialBrushes.setupLoad("basic") }
            specialBrushes.currentShape(sprayMin, sprayMax / 4, brushMin / 4, brushRange / 4, mouseBrush.direction);
            guideScaling = 1;
            startingStroke = true;
            waitingForDirection = paint.useDirection;
        },
        floodFill() {
            startingStroke = true;
            fillAreaMode = mouse.ctrlB;
            if (fillAreaMode) { log("Fill Area mode on."); }
            if (paint.fillMode === fillModes.floodFillEdges) {
                mouse.mark(); // remembers mouse location
            } else {
                mouse.cMouse._rx = mouse.cMouse.rx;
                mouse.cMouse._ry = mouse.cMouse.ry;
            }
        },
        cutPaste() {
            if (cuttingTools.cursor.substring(0,6) === "select") {
                if ((mouse.button & 4) === 4 && cuttingTools.isHoldingMask) {
                    sprites.restoreProcessed();
                    cuttingTools.toCutBuffer(mouse.ctrl);
                    cuttingTools.setFromCutBuffer();
                    paint.updateUI();
                } else {
                    if (!cuttingTools.draggingSelection) {
                        if (cuttingTools.isHoldingBuffer) { API.dropSelection() }
                        cuttingTools.sprite = renderFunctions.pixel.getTopImage();
                        cuttingTools.sprite.highlight = true;
                        sprites.restoreProcessed();
                        cuttingTools.setStart();
                    }
                }
            } else {
                if (!cuttingTools.dragging) {
                    if (cuttingTools.cursor === "move") {
                        if (cuttingTools.isHoldingBuffer) {
                            if ((mouse.button & 4) === 4) { API.dropSelection() }
                        } else {
                            if ((mouse.button & 4) === 4) {
                                if (cuttingTools.isHoldingMask) {
                                    sprites.restoreProcessed();
                                    cuttingTools.toCutBuffer(mouse.ctrl);
                                    cuttingTools.setFromCutBuffer();
                                    paint.updateUI();
                                }  else  if (cuttingTools.defined) {
                                    cuttingTools.toCutBuffer(mouse.ctrl);
                                    cuttingTools.setFromCutBuffer();
                                    paint.updateUI();
                                }
                            }
                        }
                    }
                    cuttingTools.dragStart();
                }
            }
        }
    }
    const penMoveGlobal = {
        points() {
			if (waitingForDirection) {
				brushCanPaint = false;
				paint.useDirection = false;
				if (mouseBrush.speed > 0) {
					brushCanPaint = true;
					paint.useDirection = true;
					waitingForDirection = false;
					subStroke.toTravel = subStroke.travel = 0;
					//specialBrushes.currentShape(sprayMin, sprayMax / 4, brushMin / 4, brushRange / 4, mouseBrush.directionAbsolute);
					//mouseBrush.resetDirection(mouseBrush.directionAbsolute, true);
					//specialBrushes.currentMove(mouse.cMouse.rx, mouse.cMouse.ry, mouseBrush.directionChange);
				} else {
					//specialBrushes.currentShape(sprayMin, sprayMax / 4, brushMin / 4, brushRange / 4, mouseBrush.directionAbsolute);
					//mouseBrush.resetDirection(mouseBrush.directionAbsolute, true);
					//specialBrushes.currentMove(mouse.cMouse.rx, mouse.cMouse.ry, mouseBrush.directionChange);
				}
			} else {
				brushCanPaint = true;
			}
            if (!colorRangeStartDry) {
                colorRangeDry = false;
            }
            if (paint.gridGuides) {
                if (mouse.gMouse.startDist !== -1 && mouse.gMouse.startDist !== undefined) {
                    guideScalingStart = guideScaling;
                    guideScaling = mouse.gMouse.dist / mouse.gMouse.startDist;
                }
            }
            if (paint.useSpeed) {   // use image brush
			    if (brushCanPaint) {
					if (paint.palletFrom === commands.paintColPallet) {
						if (paint.colorBlend && paint.sizeBlend) {
							renderFunctions.image.createColorMask(curves.brushColor, curves.brushAlpha);
							renderFunctions.image.circleColorBrush();
						} else if (paint.sizeBlend) {
							if (!wCanvas3.ctx.custom_brush) {
								renderFunctions.image.createMask(curves.brushAlpha);
							}
							renderFunctions.image.circleBrush(mainColor);
						} else  if (paint.colorBlend) {
							renderFunctions.image.createColorMask(curves.brushColor, curves.flat);
							renderFunctions.image.circleColorBrush();
						} else {
							if (!wCanvas3.ctx.custom_brush) {
								renderFunctions.image.createFlatMask();
							}
							renderFunctions.image.circleBrush(mainColor);
						}
					} else if (paint.palletFrom === commands.paintColImage) {
						imageTop = renderFunctions.pixel.getTopImage();
						if (paint.recycleDestination) {
							imageTopSrc = imageTop.image;
						} else { // recycleColor or sample color
							imageTopSrc = imageTop.image.desc.mirror;
						}
						if (startingStroke) {
							if (!wCanvas3.ctx.custom_brush) {
								renderFunctions.image.createMask(paint.sizeBlend? curves.brushAlpha: curves.flat);
								renderFunctions.image.maskTypes.standard();
							}
							if (paint.useDirection) {
								if (paint.useAlphaDist) {
									renderFunctions.image.imageDir(imageTopSrc, imageTop.key._lx, imageTop.key._ly, mouseBrush.direction,curves.lineWidth(0) * brushRange + brushMin);
								} else {
									renderFunctions.image.imageDir(imageTopSrc, imageTop.key._lx, imageTop.key._ly, mouseBrush.direction,brushMin);
								}
							} else {
								if (paint.useAlphaDist) {
									renderFunctions.image.imageDir(imageTopSrc, imageTop.key._lx, imageTop.key._ly, 0,curves.lineWidth(0) * brushRange + brushMin);
								} else {
									renderFunctions.image.imageDir(imageTopSrc, imageTop.key._lx, imageTop.key._ly,0,brushMin);
								}
							}
							renderFunctions.image.copyToOther();
						}
					}
				}
            } else {
                if (paint.palletFrom === commands.paintColImage) {
                    if (paint.recycleColor || paint.recycleDestination) {
                        if (paint.randColor) {
                            getRandomColorSet(colorRange,startingStroke);
                        } else {
                            getPixelColour(wColorRGB2,startingStroke);
                            if (wColorRGB2.a > 0) {
                                if (colorModeFunc) {
                                    mainColor = colorModeFunc(wColorRGB2);//wColorRGB2.cssRGBA;
                                } else {
                                    mainColor = wColorRGB2.css;
                                }
                                if (paint.sizeBlend || paint.colorBlend) {
                                    renderFunctions.image.colorBrush(mainColor);
                                }
                            }
                        }
                    }
                }
            }
        },
        specialBrushB() {
            if (mouse.button === 0) {
                specialBrushes.currentShape(sprayMin, sprayMax / 4, brushMin / 4, brushRange / 4, paint.useDirection ? mouseBrush.directionAbsolute : 0);
                mouseBrush.resetDirection(paint.useDirection ? mouseBrush.directionAbsolute : 0, true);
                specialBrushes.currentMove(mouse.cMouse.rx, mouse.cMouse.ry, paint.useDirection ? mouseBrush.directionChange : 0);
            } else {
                if (waitingForDirection) {
                    brushCanPaint = false;
                    paint.useDirection = false;
                    if (mouseBrush.speed > 0) {
                        brushCanPaint = true;
                        paint.useDirection = true;
                        waitingForDirection = false;
                        specialBrushes.currentShape(sprayMin, sprayMax / 4, brushMin / 4, brushRange / 4, mouseBrush.directionAbsolute);
                        mouseBrush.resetDirection(mouseBrush.directionAbsolute, true);
                        specialBrushes.currentMove(mouse.cMouse.rx, mouse.cMouse.ry, mouseBrush.directionChange);
                    } else {
                        specialBrushes.currentShape(sprayMin, sprayMax / 4, brushMin / 4, brushRange / 4, mouseBrush.directionAbsolute);
                        mouseBrush.resetDirection(mouseBrush.directionAbsolute, true);
                        specialBrushes.currentMove(mouse.cMouse.rx, mouse.cMouse.ry, mouseBrush.directionChange);
                    }
                } else {
                    brushCanPaint = true;
                    specialBrushes.currentMove(mouse.cMouse.rx, mouse.cMouse.ry, paint.useDirection ? mouseBrush.directionChange : 0);
                }
            }
            if (paint.gridGuides) {
                if (mouse.gMouse.startDist !== -1 && mouse.gMouse.startDist !== undefined) { guideScaling = mouse.gMouse.dist / mouse.gMouse.startDist }
            }
            if (paint.useSpeed) {
                specialBrushSpeedScaleA = specialBrushSpeedScale;
                specialBrushSpeedScale = sCurve(mouseBrush.speed, 1.04);
				specialBrushIseSpeedScale = true;
            } else {
                specialBrushSpeedScaleA = 1;
                specialBrushSpeedScale = 1;
				specialBrushIseSpeedScale = false;
            }
            var dryDist = (100-paint.pickupPower) ** 2;
			specialBrushes.imgColors.active = false; // set true if renderFunctions.pixel.getHairColor called
            if (startingStroke) {
                if (brushCanPaint) {
                    if (paint.palletFrom === commands.paintColImage) {
                        if (paint.randColor && (paint.recycleColor || paint.recycleDestination)) {
                            specialBrushes.currentLoad(colorRange);
                            getRandomColorSet(colorRangeRGB, false);
                        } else {
                            if (paint.colorBlend) {
                                renderFunctions.pixel.getHairColor(specialBrushes.hairs, paint.pickupPower  /100, true);
                                specialBrushes.currentLoad(palletRangeRGB);
                            } else {
                                specialBrushes.currentLoad(colorRange);
                                renderFunctions.pixel.getHairColor(specialBrushes.hairs, dryDist);
                            }
                        }
                    } else { specialBrushes.currentLoad(colorRange) }
                }
            } else {
                if (paint.palletFrom === commands.paintColImage && (paint.recycleDestination || paint.recycleColor)) {
                    if (paint.randColor) {
                        getRandomColorSet(colorRangeRGB, false);
                        specialBrushes.currentLoad(colorRange);
                    } else {
                        if (paint.colorBlend) { renderFunctions.pixel.getHairColor(specialBrushes.hairs, paint.pickupPower / 100, true) }
                        else { renderFunctions.pixel.getHairColor(specialBrushes.hairs, paint.pickupPower / 100, true) }
                    }
                } else {
                    if (paint.randColor) { specialBrushes.currentLoad(colorRange) }
                }
            }
        },
        shapes() {
            shapeModStates.shift = mouse.shift || shapeModStates.shift;
            if (paint.palletFrom === commands.paintColImage) {
                if (lineDynamicPattern && paint.drawType === commands.paintLine && (paint.recycleColor || paint.recycleDestination)) {
                    lineDynamicPattern = true;
                     //paint.gradientMode === 1 &&
                    imageTop = renderFunctions.pixel.getTopImage();
                    imageTopSrc = imageTop.image.desc.mirror;
                } else  if (paint.recycleColor || paint.recycleDestination) {
                    if (paint.drawType !== commands.paintLine || !mouse.ctrl) {  // for lines this statment make holding ctrl (in line mode) maintain the last second color
                        getPixelColourEnd(wColorRGB2);
                        if (wColorRGB2.a > 0) {
                            secondColor = wColorRGB2.cssRGBA;
                            colorRangeRGB.init(wColorRGB1,wColorRGB2);
                            if (colorModelHSL) { colorRange.initHSLFromRGB(colorRangeRGB) }
                        }
                    }
                }
            }
        },
        curve() {
            if (paint.palletFrom === commands.paintColImage) {
                if (paint.recycleColor || paint.recycleDestination) {
                    getPixelColourEnd(wColorRGB2);
                    if (wColorRGB2.a > 0) {
                        secondColor = wColorRGB2.css;
                        colorRangeRGB.init(wColorRGB1,wColorRGB2);
                        if (colorModelHSL) { colorRange.initHSLFromRGB(colorRangeRGB) }
                    }
                }
            }
            curved.addPoint(mouse.cMouse.rx, mouse.cMouse.ry);
            if (paint.pointMode && startingStroke && paint.gridCanAdd) { // && sprites.hasGuides === 0) {
                snaps.addPoint(mouse.cMouse.rx, mouse.cMouse.ry);
            }
        },
        cutPaste() {
            if (paint.gridGuides) {
                if (mouse.gMouse.startDist !== -1 && mouse.gMouse.startDist !== undefined) {
                    guideScalingStart = guideScaling;
                    guideScaling = mouse.gMouse.dist / mouse.gMouse.startDist;
                }
            }
            if (cuttingTools.draggingSelection) {
                cuttingTools.setEnd();
            } else if (cuttingTools.dragging) {
                cuttingTools.drag();
            }
        },
        floodFill() {
        },
    }
    const penMove = {
        floodFill(spr) {
            if (startingStroke) {
                spr.key._lx = spr.key.lx;
                spr.key._ly = spr.key.ly;
                if (colorSource) {
                    colorSource.key._lx = colorSource.key.lx;
                    colorSource.key._ly = colorSource.key.ly;
                }
            }
            const FFL = floodFillLandings;
            var paintLanding = false;
            if (FFL.landing) {
                const img = spr.image;
                setupContext(spr);
                useSelectionClip && img.clipToExtent(selectionClip);
                spr.type.subSprite && img.subSpriteClip(spr.subSprite);
                const landed = renderFunctions.alias.floodFillLandingOn(spr);
                if (landed > -1) {
                    FFL.landedCount ++;
                    if (FFL.contact === -1 && landed > 0) {
                        FFL.contact = FFL.idx;
                    }
                }
                FFL.landings[FFL.idx++] = landed;
                img.unclip();
            } else {
                if (FFL.contact === -1 || FFL.fillAll) {  // over transparent
                    if (FFL.landings[FFL.count] > -1) { paintLanding = true; }
                } else if (FFL.contact === FFL.count) { paintLanding = true }
                if (paintLanding) {
                    const img = spr.image;
                    setupContext(spr);
                    useSelectionClip && img.clipToExtent(selectionClip);
                    spr.type.subSprite && img.subSpriteClip(spr.subSprite);
                    renderMove(spr);
                    img.unclip();
                }
                FFL.count++;
            }
        },
        points(spr) {
            if (startingStroke) {
                spr.key._lx = spr.key.lx;
                spr.key._ly = spr.key.ly;
                if (colorSource) {
                    colorSource.key._lx = colorSource.key.lx;
                    colorSource.key._ly = colorSource.key.ly;
                }
				mouseBrush.directionChange = 0;
				//if (webGLFilterMenus.filterDialogOpen) { webGLFilterMenus.paintFilterStrokeStart(spr) }
            }
            if (brushCanPaint) {
			    var tempCtx;
				subStroke.onSprite(spr);
				if (subStroke.empty) { return }
                const img = spr.image;
				setupContext(spr);
                useSelectionClip && img.clipToExtent(selectionClip);
                spr.type.subSprite && img.subSpriteClip(spr.subSprite);
                renderMove(spr);
				//if (webGLFilterMenus.filterDialogOpen) { webGLFilterMenus.applyPaintFilter(spr, img) }
                img.unclip();
				img.processed = true;
                //updateImageDependency(spr);
			}
        },
        specialBrushB(spr) {
             if (startingStroke) {
                spr.key._lx = spr.key.lx;
                spr.key._ly = spr.key.ly;
                if (colorSource) {
                    colorSource.key._lx = colorSource.key.lx;
                    colorSource.key._ly = colorSource.key.ly;
                }
				//if (webGLFilterMenus.filterDialogOpen) { webGLFilterMenus.paintFilterStrokeStart(spr) }
            }
            if (brushCanPaint) {
                subStroke.onSprite(spr);
                if (subStroke.empty) { return }
                setupContext(spr);
                const img = spr.image;
                useSelectionClip && img.clipToExtent(selectionClip);
				if (spr.type.subSprite) {
                    img.subSpriteClip(spr.subSprite);
					renderMove(spr);
				} else {
					renderMove(spr);
					//if (webGLFilterMenus.filterDialogOpen) { webGLFilterMenus.applyPaintFilter(spr) }
				}
                img.unclip();
                img.processed = true;
            }
        },
        curve(spr) {
            const img = spr.image;
            !img.restored && img.restore();
            const seperateStrokeAndFill = paint.fillMode < fillModes.fillOpen;
            setupContext(spr, seperateStrokeAndFill);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            if (paint.useSizeDist) {
                if (seperateStrokeAndFill) {
                    if (paint.antiAlias) { renderFunctions.curved.circles(spr) }
                    else { renderFunctions.curved.circlesAlias(spr) }
                } else { renderFunctions.curved.circlesFill(spr) }
            } else {
                if (seperateStrokeAndFill) {
                    if (paint.antiAlias) { renderFunctions.curved.pixel(spr) }
                    else { renderFunctions.curved.pixelAlias(spr) }
                } else { renderFunctions.curved.fillShape(spr) }
            }
            img.unclip();
            img.processed = true;
            //img.presented();
        },
        line(spr) {
             const img = spr.image;
            !img.restored && img.restore();
            const k = spr.key;
            if (startingStroke) {
                k._lx = k.lx;
                k._ly = k.ly;
                if (colorSource) {
                    colorSource.key._lx = colorSource.key.lx;
                    colorSource.key._ly = colorSource.key.ly;
                }
            }
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            var sx = k._lx, sy = k._ly, ex = k.lx, ey = k.ly;
            if (shapeModStates.shift) {
                const dx = Math.abs(ex - sx), dy = Math.abs(ey - sy);
                if (dx > dy) { ey = sy }
                if (dx < dy) { ex = sx }
            }
            if (paint.antiAlias) {
                if (lineDynamicPattern) {
                    if (paint.sizeBlend) {
                        renderFunctions.antiAlias.lineColorAlphaWidth(img.ctx, sx, sy, ex, ey);
                    } else {
                        renderFunctions.antiAlias.lineColorAlpha(img.ctx, sx, sy, ex, ey);
                    }
                } else {
                    renderFunctions.antiAlias.line(img.ctx, sx, sy, ex, ey);
                }
            } else {
                const m = brushMin / 2 ;
                const M = paint.sizeBlend ? brushMax / 2 : m;
                if (m > 1 || M > 1) {
                    renderFunctions.alias.lineScanLine(img.ctx, sx, sy, ex, ey);
                } else {
                    if (paint.colorBlend || paint.useAlphaDist || paint.randColor) {
                        renderFunctions.alias.lineColorAlpha(img.ctx, sx, sy, ex, ey);
                    } else {
                        renderFunctions.alias.line(img.ctx, sx, sy, ex, ey);
                    }
                }
            }
			img.unclip();
            img.processed = true;
            //updateImageDependency(spr);
        },
        rectangle(spr) {
            const img = spr.image;
            if (!img.restored) { img.restore() }
            const k = spr.key;
            if (startingStroke) {
                k._lx = k.lx;
                k._ly = k.ly;
                if (colorSource) {
                    colorSource.key._lx = colorSource.key.lx;
                    colorSource.key._ly = colorSource.key.ly;
                }
            }
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            if (paint.antiAlias) {
                renderFunctions.antiAlias.rectangle(spr);
            } else {
                renderFunctions.alias.rectangle(spr);
            }
			img.unclip();
            img.processed = true;
            //updateImageDependency(spr);
        },
        circle(spr) {
            const img = spr.image;
            !img.restored && img.restore();
            const k = spr.key;
            if (startingStroke) {
                if (!paint.antiAlias && aliasCircleCenterSnapCorrect) {
                    k._lx = k.lx - 0.5;
                    k._ly = k.ly - 0.5;
                    if (colorSource) {
                        colorSource.key._lx = colorSource.key.lx - 0.5;
                        colorSource.key._ly = colorSource.key.ly - 0.5;
                    }
                } else {
                    k._lx = k.lx;
                    k._ly = k.ly;
                    if (colorSource) {
                        colorSource.key._lx = colorSource.key.lx;
                        colorSource.key._ly = colorSource.key.ly;
                    }
                }
            }
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            if (paint.antiAlias) {  renderFunctions.antiAlias.circle(spr) }
            else{
                if (paint.gridGuides && paint.canDrawCircle) {  renderFunctions.alias.circleGuides(spr) }
                else { renderFunctions.alias.circle(spr) }
            }
			img.unclip();
            img.processed = true;
            //updateImageDependency(spr);
        },
    }
    const penUp = {
        curve() {
            if (paint.gridCanAdd && paint.pointMode) { // && sprites.hasGuides === 0) {
                curved.each(p => { snaps.addPoint(p[0], p[1]) })
            }
        },
        shapes() {
            if (paint.drawType === commands.paintLine) {
                lineDynamicPattern && renderFunctions.image.releaseLinePattern();
            }
            if (paint.gridCanAdd) { // && sprites.hasGuides === 0) {
                switch(paint.drawType) {
                    case commands.paintLine:
                        if (paint.antiAlias) {
                            snaps.addLine(mouse.cMouse._rx ,mouse.cMouse._ry, mouse.cMouse.rx, mouse.cMouse.ry);
                        } else {
                            const x1 = (Math.abs(mouse.cMouse._rx | 0) + 0.5) * Math.sign(mouse.cMouse._rx);
                            const y1 = (Math.abs(mouse.cMouse._ry | 0) + 0.5) * Math.sign(mouse.cMouse._ry);
                            const x2 = (Math.abs(mouse.cMouse.rx | 0) + 0.5) * Math.sign(mouse.cMouse.rx);
                            const y2 = (Math.abs(mouse.cMouse.ry | 0) + 0.5) * Math.sign(mouse.cMouse.ry);
                            snaps.addLine(x1,y1,x2,y2);
                        }
                        break;
                    case commands.paintCircle:
                        if (paint.antiAlias) {
                            if (shapeModStates.shift) {
                                var radiusX = Math.abs(mouse.cMouse._rx - mouse.cMouse.rx);
                                var radiusY = Math.abs(mouse.cMouse._ry - mouse.cMouse.ry);
                                snaps.addCircle(mouse.cMouse._rx ,mouse.cMouse._ry, radiusY, aliasCircleRadiusX / aliasCircleRadiusY);
                            } else {
                                const dx =  mouse.cMouse._rx - mouse.cMouse.rx;
                                const dy =  mouse.cMouse._ry - mouse.cMouse.ry;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                snaps.addCircle(mouse.cMouse._rx ,mouse.cMouse._ry, dist,1);
                            }
                        } else {
                            var x1,y1,x2,y2;
                            x1 = Math.abs(mouse.cMouse._rx | 0);
                            //x2 = Math.abs(mouse.cMouse.rx | 0);
                            y1 = Math.abs(mouse.cMouse._ry | 0);
                            //y2 = Math.abs(mouse.cMouse.ry | 0);
                            x1 = mouse.cMouse._rx > 0 ? x1 + 1 : -x1;
                            //x2 = mouse.cMouse.rx > 0  ? x2 + 1 : -x2;
                            y1 = mouse.cMouse._ry > 0 ? y1 + 1 : -y1;
                            //y2 = mouse.cMouse.ry > 0  ? y2 + 1 : -y2;
                            if (shapeModStates.shift) {
                                if (aliasCircleCenterSnapCorrect) {
                                    snaps.addCircle(aliasCircleCenterSnap.x ,aliasCircleCenterSnap.y, aliasCircleRadiusY, aliasCircleRadiusX / aliasCircleRadiusY, true);
                                } else {
                                    snaps.addCircle(x1, y1, aliasCircleRadiusY, aliasCircleRadiusX / aliasCircleRadiusY, true);
                                }
                            } else {
                                if (aliasCircleCenterSnapCorrect) {
                                    snaps.addCircle(aliasCircleCenterSnap.x, aliasCircleCenterSnap.y, smallCircleRadius, 1,true);
                                } else {
                                    snaps.addCircle(x1, y1, smallCircleRadius, 1, true);
                                }
                            }
                            aliasCircleCenterSnapCorrect = false;
                        }
                        break;
                    case commands.paintRectangle:
                        snaps.addRectangle(mouse.cMouse._rx ,mouse.cMouse._ry, mouse.cMouse.rx, mouse.cMouse.ry);
                }
            }
        }
    }
    const penFeedback = {
        shapes(spr) {
            const img = spr.image;
            !img.restored && img.restore();
            const ctx = img.ctx;
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            const lx = spr.key.lx, ly = spr.key.ly;
            if (paint.drawType === commands.paintLine) {
                const smoothing = ctx.imageSmoothingEnabled;
                const m = Math.min(brushMin /2, brushMax /2);
                const M = Math.max(brushMin /2, brushMax /2);
                if (m > 1 || M > 1) {
                    if ((paint.recycleColor || paint.recycleDestination)) {
                        imageTop = renderFunctions.pixel.getTopImage();
                        imageTopSrc = imageTop.image.desc.mirror;
                    }
                    const dir = mouseBrush.direction;
                    const dx = Math.cos(dir) * 0.5;
                    const dy = Math.sin(dir) * 0.5;
                    const x = lx - dx;
                    const y = ly - dy;
                    const x1 = lx + dx;
                    const y1 = ly + dy;
                    if (paint.antiAlias) {
                        if (paint.sizeBlend || paint.colorBlend || paint.useAlphaDist || paint.randColor) {
                            if (paint.sizeBlend) {
                                renderFunctions.antiAlias.lineColorAlphaWidth(ctx, x, y, x1, y1);
                            } else {
                                renderFunctions.antiAlias.lineColorAlpha(ctx,  x, y, x1, y1);
                            }
                        } else {
                            renderFunctions.antiAlias.line(ctx,  x, y, x1, y1);
                        }
                    } else {
                        if (m > 1 || M > 1) {
                                renderFunctions.alias.lineScanLine(ctx,  x, y, x1, y1);
                        } else {
                            if (paint.colorBlend || paint.useAlphaDist || paint.randColor) {
                                renderFunctions.alias.lineColorAlpha(ctx,  x, y, x1, y1);
                            } else {
                                renderFunctions.alias.line(ctx,  x, y, x1, y1);
                            }
                        }
                    }
                } else {
                    if (paint.gradientMode  === 3) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.fillStyle = renderFunctions.gradient.lineLengthPattern(ctx, lx, ly, lx, ly, M);
                    }
                    ctx.beginPath();
                    if (paint.antiAlias || paint.gradientMode  === 3) {
                        renderFunctions.antiAlias.point(ctx,lx, ly, M);
                    } else {
                        renderFunctions.alias.pointAll(ctx,(lx + 4096 | 0) - 4096, (ly + 4096 | 0) - 4096, M);
                    }
                    ctx.fill();
                }
                ctx.imageSmoothingEnabled = smoothing;
            } else {
                const smoothing = ctx.imageSmoothingEnabled;
                const M = Math.max(brushMin /2, brushMax /2);
                if (paint.gradientMode  === 3) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.fillStyle = renderFunctions.gradient.lineLengthPattern(ctx, lx, ly, lx, ly, M);
                }
                ctx.beginPath();
                if (paint.antiAlias) {
                    renderFunctions.antiAlias.point(ctx,lx, ly, M);
                } else {
                    renderFunctions.alias.pointAll(ctx,(lx + 4096 | 0) - 4096, (ly + 4096 | 0) - 4096, M);
                }
                ctx.fill();
                ctx.imageSmoothingEnabled = smoothing;
            }
            img.unclip();
            img.processed = true;
            //updateImageDependency(spr);
        },
        points(spr) {
            guideScaling = 1;
            guideScalingStart = 1;
            subStroke.onSpriteSingle(spr);
            if (subStroke.empty) { return }
            const img = spr.image;
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            if (paint.useSpeed) {
				if (paint.palletFrom === commands.paintColPallet) {
					if (paint.colorBlend && paint.sizeBlend) {
						renderFunctions.image.createColorMask(curves.brushColor, curves.brushAlpha);
						renderFunctions.image.circleColorBrush();
					} else if (paint.sizeBlend) {
						if (!wCanvas3.ctx.custom_brush) {
							renderFunctions.image.createMask(curves.brushAlpha);
						}
						renderFunctions.image.circleBrush(mainColor);
					} else  if (paint.colorBlend) {
						renderFunctions.image.createColorMask(curves.brushColor, curves.flat);
						renderFunctions.image.circleColorBrush();
					} else {
						if (!wCanvas3.ctx.custom_brush) {
							renderFunctions.image.createFlatMask();
						}
						renderFunctions.image.circleBrush(mainColor);
					}
				} else if (paint.palletFrom === commands.paintColImage) {
					imageTop = renderFunctions.pixel.getTopImage();
					if (paint.recycleDestination) {
						imageTopSrc = imageTop.image;
					} else { // recycleColor or sample color
						imageTopSrc = imageTop.image.desc.mirror;
					}
					if (!wCanvas3.ctx.custom_brush) {
						renderFunctions.image.createMask(paint.sizeBlend? curves.brushAlpha: curves.flat);
						renderFunctions.image.maskTypes.standard();
					}
                    renderFunctions.image.imageDir(imageTopSrc, imageTop.key._lx, imageTop.key._ly, 0,brushMin);
                    renderFunctions.image.copyToOther();
				}
            }
            renderMove(spr);
            img.unclip();
            img.processed = true;
            //updateImageDependency(spr);
        },
        specialBrushB(spr) {
            subStroke.onSpriteSingle(spr);
            if (subStroke.empty) { return }
            const img = spr.image;
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            renderMove(spr);
            img.unclip();
            img.processed = true;
        },
        curve(spr) {
            const img = spr.image;
            !img.restored && img.restore();
            setupContext(spr);
            useSelectionClip && img.clipToExtent(selectionClip);
			spr.type.subSprite && img.subSpriteClip(spr.subSprite);
            img.ctx.beginPath();
            if (paint.antiAlias) {
                renderFunctions.antiAlias.point(img.ctx,spr.key.lx, spr.key.ly ,brushMin / 2);
            } else {
                renderFunctions.alias.pointAll(img.ctx, (spr.key.lx + 4096 | 0) - 4096, (spr.key.ly + 4096 | 0) - 4096, brushMin / 2);
            }
            img.ctx.fill();
            img.unclip();
            img.processed = true;
            //img.presented();
        }
    }
    const feedbackGlobalrenders = {
        pickupArea(ctx, common) {
            view.apply();
            const mx = mouse.cMouse.rx;
            const my = mouse.cMouse.ry;
            ctx.beginPath();
            var rad = paint.pickupRadius / 4;
            ctx.moveTo(mx + rad, my);
            ctx.arc(mx,my,rad,0,Math.PI2);
            if (colorRangeDry) {
                colorRangeDry = false;
                ctx.moveTo(mx-rad,my-rad);
                ctx.lineTo(mx+rad,my+rad);
                ctx.moveTo(mx-rad,my+rad);
                ctx.lineTo(mx+rad,my-rad);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.lineWidth = 0.75;
            ctx.strokeStyle = "red";
            ctx.setLineDash(common.dash);
            ctx.lineDashOffset = 0;
            ctx.stroke();
            ctx.strokeStyle = "white";
            ctx.lineDashOffset = common.dash[0];
            ctx.stroke();
            ctx.setLineDash(common.emptyDash);
        },
        edgeFill(ctx,common) {
            const x = mouse.marked.x;
            const y = mouse.marked.y;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth  = 2;
            if (edgeFill.distSegment < 4) {
                const seg = edgeFill.distSegment * 8;
                ctx.beginPath();
                ctx.arc(x,y,seg + 8,0,Math.PI2);
                ctx.moveTo(x + seg,y);
                ctx.arc(x,y,seg,0,Math.PI2);
                ctx.fill("evenodd");
            }
            ctx.beginPath();
            ctx.lineWidth  = 1;
            ctx.globalAlpha = 0.7;
            ctx.arc(x,y,8,0,Math.PI2);
            ctx.moveTo(x + 16,y);
            ctx.arc(x,y,16,0,Math.PI2);
            ctx.moveTo(x + 24,y);
            ctx.arc(x,y,24,0,Math.PI2);
            ctx.moveTo(x + 32,y);
            ctx.arc(x,y,32,0,Math.PI2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.fillStyle  = "red";
            (edgeFill.select & 1) && (ctx.fillRect(x - 16, y - 24, 32,8));
            (edgeFill.select & 2) && (ctx.fillRect(x + 16, y - 16, 8,32));
            (edgeFill.select & 4) && (ctx.fillRect(x - 16, y + 16, 32,8));
            (edgeFill.select & 8) && (ctx.fillRect(x - 24, y - 16, 8,32));
            (edgeFill.select & 16) && (ctx.fillRect(x - 24, y - 24, 7,7));
            (edgeFill.select & 32) && (ctx.fillRect(x + 17, y - 24, 7,7));
            (edgeFill.select & 64) && (ctx.fillRect(x + 17, y + 17, 7,7));
            (edgeFill.select & 128) && (ctx.fillRect(x - 24, y + 17, 7,7));
        },
        points(ctx, common) {
            view.apply();
            const mx = mouse.cMouse.rx;
            const my = mouse.cMouse.ry;
            const xLen = common.vWidth;
            const yLen = common.vHeight
            ctx.beginPath();
            ctx.lineTo(mx - xLen, my);
            ctx.lineTo(mx + xLen, my);
            ctx.moveTo(mx, my - yLen);
            ctx.lineTo(mx, my + yLen);
            if (API.showPenAreaInner  !==  0 || API.showPenAreaOuter !== 0) {
                if (API.showPenAreaInner > 0) {
                   // var radMin = paint.lengthFade / 2;
                    ctx.moveTo(mx + API.showPenAreaInner, my);
                    ctx.arc(mx,my,API.showPenAreaInner,0,Math.PI2);
                }
                if (API.showPenAreaOuter > 0) {
                   // var radMax = paint.widthFade / 2;
                    ctx.moveTo(mx + API.showPenAreaOuter, my);
                    ctx.arc(mx,my,API.showPenAreaOuter,0,Math.PI2);
                }
            }
            if (mouse.cMouse.overSnap) {
                if (mouse.cMouse.overSnapLine) {
                    const l = mouse.cMouse.overSnapLine;
                    ctx.moveTo(l.p1.x,l.p1.y);
                    ctx.lineTo(l.p2.x,l.p2.y);
                }else if (mouse.cMouse.overSnapCircle) {
                    const c = mouse.cMouse.overSnapCircle;
                    ctx.transform(c.aspect,0,0,1,c.p1.x,c.p1.y);
                    ctx.moveTo( c.radius,0);
                    ctx.arc(0,0,c.radius,0,Math.PI2);
                }
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.lineWidth = 0.5;
            if (mouse.cMouse.overSnap) {
                ctx.strokeStyle = "red";
            } else {
                ctx.strokeStyle = "white";
            }
            ctx.setLineDash(common.dash);
            ctx.lineDashOffset = 0;
            ctx.stroke();
            ctx.strokeStyle = "black";
            ctx.lineDashOffset = common.dash[0];
            ctx.stroke();
            ctx.setLineDash(common.emptyDash);
            ctx.fillStyle="white";
            ctx.lineWidth = 1.5;
            ctx.font = "12px arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const mid = ctx.canvas.width / 2 | 0;
            if (mouse.cMouse.logPosition) {
                mouse.cMouse.logPosition = false;
                log("{x: " + (mx | 0) + ", y: " + (my | 0)+"},");
            }
            if (paint.drawType === commands.paintRectangle && refSprite) {
                const k = refSprite.key;
                const xx = Math.min(k._lx, k.lx) | 0;
                const yy = Math.min(k._ly, k.ly) | 0;
                const ww = (Math.max(k._lx, k.lx) | 0) - xx + 1;
                const hh = (Math.max(k._ly, k.ly) | 0) - yy + 1;
                const text = "X: " + (xx | 0) + " Y: " + (yy | 0) + " W: " + (ww | 0) + " H: " + (hh | 0);
                ctx.strokeText(text, mid, 12.25);
                ctx.fillText(text, mid, 12);
            } else {
                ctx.strokeText("X : " + (mx | 0) + " Y : " + (my | 0),mid, 12.25);
                ctx.fillText("X : " + (mx | 0) + " Y : " + (my | 0),mid, 12);
            }
            feedbackGlobalrenders.drawEdgeMarkers(ctx);
        },
        drawEdgeMarkers(ctx) {  // context should be default transform
            if (hbSprites) {
                const  W = ctx.canvas.width;
                const  H = ctx.canvas.height;
                const mx = mouse.cMouse.x;
                const my = mouse.cMouse.y;
                var s = hbSprites.sprites[13];
                ctx.drawImage(hbSprites.img, s.x, s.y, s.w, s.h, W - s.w - 3, my - s.h / 2,s.w, s.h);
                 s = hbSprites.sprites[14];
                ctx.drawImage(hbSprites.img, s.x, s.y, s.w, s.h, 0, my - s.h / 2,s.w, s.h);
                s = hbSprites.sprites[15];
                ctx.drawImage(hbSprites.img, s.x, s.y, s.w, s.h, mx - s.w / 2, H - s.h,s.w, s.h);
                s = hbSprites.sprites[16];
                ctx.drawImage(hbSprites.img, s.x, s.y, s.w, s.h, mx - s.w / 2,0 ,s.w, s.h);
            } else {
                hbSprites = heartBeat.heartBeatSprites;
            }
        },
        line(ctx, common) {
            if (mouse.cMouse._rx === undefined) {
                feedbackGlobalrenders.points(ctx,common);
                return;
            }
            var mx1 = mouse.cMouse.rx;
            var my1 = mouse.cMouse.ry;
            var mx2 = mouse.cMouse._rx;
            var my2 = mouse.cMouse._ry;
            var dx = mx2 - mx1;
            var dy = my2 - my1;
            var col = mouse.ctrl ? "#AFA" : "#FFF";
            /*if (mouse.ctrl) {
                if (dx === 0 && dy === 0) {
                    lineQuickSnap.sx = 0;
                    lineQuickSnap.sy = 100;
                    lineQuickSnap.ex = 100;
                    lineQuickSnap.ey = 100;
                    lineQuickSnap.dx = 100;
                    lineQuickSnap.dy = 0;
                    lineQuickSnap.len = 10000;
                } else {
                    lineQuickSnap.sx = mx2;
                    lineQuickSnap.sy = my2;
                    lineQuickSnap.ex = mx1;
                    lineQuickSnap.ey = my1;
                    lineQuickSnap.dx = mx1 - mx2;
                    lineQuickSnap.dy = my1 - my2;
                    lineQuickSnap.len = lineQuickSnap.dx * lineQuickSnap.dx + lineQuickSnap.dy * lineQuickSnap.dy;
                }
            }*/
            if (shapeModStates.shift) {
                const ddx = Math.abs(dx), ddy = Math.abs(dy);
                if (dx > dy) { my1 = my2 }
                else { mx1 = mx2 }
                dx = mx2 - mx1;
                dy = my2 - my1;
                //dx = lineQuickSnap.dx;
                //dy = lineQuickSnap.dy;
                col = "#FAA";
            }
            var len = Math.sqrt(dx * dx + dy * dy);
            if (mouse.cMouse._rx === undefined) {
                feedbackGlobalrenders.points(ctx,common);
                return;
            }
            dx /= len;
            dy /= len;
            view.apply();
            const max = common.maxLineLen;
            dx *= max;
            dy *= max;
            ctx.beginPath();
            ctx.lineTo(mx1, my1);
            ctx.lineTo(mx1 - dx, my1 - dy);
            ctx.moveTo(mx2 + dy, my2 - dx);
            ctx.lineTo(mx2 - dy, my2 + dx);
            /*if (mouse.shift) {
                ctx.moveTo(lineQuickSnap.sx, lineQuickSnap.sy);
                ctx.lineTo(lineQuickSnap.ex, lineQuickSnap.ey);
            }*/
            ctx.moveTo(mx2, my2);
            ctx.lineTo(mx2 + dx, my2 + dy);
            ctx.moveTo(mx1,my1 - max);
            ctx.lineTo(mx1,my1 + max);
            ctx.moveTo(mx1 - max,my1);
            ctx.lineTo(mx1 + max,my1);
            if (mouse.cMouse.overSnap) {
                if (mouse.cMouse.overSnapLine) {
                    const l = mouse.cMouse.overSnapLine;
                    ctx.moveTo(l.p1.x,l.p1.y);
                    ctx.lineTo(l.p2.x,l.p2.y);
                }else if (mouse.cMouse.overSnapCircle) {
                    const c = mouse.cMouse.overSnapCircle;
                    ctx.transform(c.aspect,0,0,1,c.p1.x,c.p1.y);
                    ctx.moveTo( c.radius,0);
                    ctx.arc(0,0,c.radius,0,Math.PI2);
                }
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.lineWidth = 0.5;
            if (mouse.cMouse.overSnap) {
                ctx.strokeStyle = "red";
            } else {
                ctx.strokeStyle = col;
            }
            ctx.setLineDash(common.dash);
            ctx.lineDashOffset = 0;
            ctx.stroke();
            ctx.strokeStyle = "black";
            ctx.lineDashOffset = common.dash[0];
            ctx.stroke();
            ctx.setLineDash(common.emptyDash);
            ctx.fillStyle="white";
            ctx.lineWidth = 1.5;
            ctx.font = "12px arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const mid = ctx.canvas.width / 2 | 0
            if (refSprite) {
                const k = refSprite.key;
                const xx = k._lx | 0;
                const yy = k._ly | 0;
                const ww = Math.abs((k.lx | 0) - xx);
                const hh = Math.abs((k.ly | 0) - yy);
                len = ((ww * ww + hh * hh) ** 0.5 | 0) + 1;
                const text = "X: " + xx + " Y: " + yy + " W: " + (ww + 1) + " H: " + (hh + 1) + " Len: " + len;
                ctx.strokeText(text, mid, 12.25);
                ctx.fillText(text, mid, 12);
            } else {
                dx = (mx2 | 0) - (mx1 | 0);
                dy = (my2 | 0) - (my1 | 0);
                len = (Math.sqrt(dx * dx + dy * dy) | 0) + 1;
                if (mouse.cMouse.logPosition) {
                    mouse.cMouse.logPosition = false;
                    log("{p1 : {x: " + (mx1 | 0) + ", y: " + (my1 | 0)+"}, p2: {x: " + (mx2 | 0) + ", y: " + (my2 | 0)+"}, len : "+ len + "}");
                }
                ctx.strokeText("X : " + (mx1 | 0) + " Y : " + (my1 | 0) + " Len : " + (len | 0),mid, 12.25);
                ctx.fillText("X : " + (mx1 | 0) + " Y : " + (my1 | 0) + " Len : " + (len | 0),mid, 12);
            }
            feedbackGlobalrenders.drawEdgeMarkers(ctx);
        },
        circle(ctx, common) {
            if (mouse.cMouse._rx === undefined) {
                feedbackGlobalrenders.points(ctx,common);
                return;
            }
            const mx1 = mouse.cMouse.rx;
            const my1 = mouse.cMouse.ry;
            const mx2 = mouse.cMouse._rx;
            const my2 = mouse.cMouse._ry;
            var dx = mx2 - mx1;
            var dy = my2 - my1;
            var len = Math.sqrt(dx * dx + dy * dy);
            var lenX = len;
            var lenY = len;
            if (mouse.cMouse._rx === undefined) {
                feedbackGlobalrenders.points(ctx,common);
                return;
            }
            if (mouse.ctrl) {
                lenX = Math.abs(dx);
                lenY = Math.abs(dy);
            }
            view.apply();
            if (shapeModStates.shift) {
                lenX = Math.abs(dx);
                lenY = Math.abs(dy);
            }
            const xLen = common.vWidth;
            const yLen = common.vHeight
            ctx.beginPath();
            ctx.lineTo(mx1, my1);
            ctx.lineTo(mx2, my2);
            ctx.moveTo(mx2 + lenX, my2 - yLen);
            ctx.lineTo(mx2 + lenX, my2 + yLen);
            ctx.moveTo(mx2 - xLen, my2 + lenY);
            ctx.lineTo(mx2 + xLen, my2 + lenY);
            if (paint.antiAlias) {
                ctx.moveTo(mx2 - lenX, my2 - yLen);
                ctx.lineTo(mx2 - lenX, my2 + yLen);
                ctx.moveTo(mx2 - xLen, my2 - lenY);
                ctx.lineTo(mx2 + xLen, my2 - lenY);
            } else {
                ctx.moveTo(mx2 - lenX + 1, my2 - yLen);
                ctx.lineTo(mx2 - lenX + 1, my2 + yLen);
                ctx.moveTo(mx2 - xLen, my2 - lenY + 1);
                ctx.lineTo(mx2 + xLen, my2 - lenY + 1);
            }
            if (mouse.cMouse.overSnap) {
                if (mouse.cMouse.overSnapLine) {
                    const l = mouse.cMouse.overSnapLine;
                    ctx.moveTo(l.p1.x,l.p1.y);
                    ctx.lineTo(l.p2.x,l.p2.y);
                }else if (mouse.cMouse.overSnapCircle) {
                    const c = mouse.cMouse.overSnapCircle;
                    ctx.transform(c.aspect,0,0,1,c.p1.x,c.p1.y);
                    ctx.moveTo( c.radius,0);
                    ctx.arc(0,0,c.radius,0,Math.PI2);
                }
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.lineWidth = 0.5;
            if (mouse.cMouse.overSnap) {
                ctx.strokeStyle = "red";
            } else {
                ctx.strokeStyle = "white";
            }
            ctx.setLineDash(common.dash);
            ctx.lineDashOffset = 0;
            ctx.stroke();
            ctx.strokeStyle = "black";
            ctx.lineDashOffset = common.dash[0];
            ctx.stroke();
            ctx.setLineDash(common.emptyDash);
        },
        guides : {
            shapes : guideFeedbackGlobalRender.render,
            line : guideFeedbackGlobalRender.render,
            circle : guideFeedbackGlobalRender.surfaceCircle,
            rectangle : guideFeedbackGlobalRender.surfaceRectange,
            points : guideFeedbackGlobalRender.render,
            curve : guideFeedbackGlobalRender.render,
            specialBrushB : guideFeedbackGlobalRender.render,
        },
    }
    const savePalletMode = {};
    function altPalletMode(on) {
        if (on) {
            savePalletMode.saved = true;
            savePalletMode.palletFrom = paint.palletFrom ;
            savePalletMode.recycleColor = paint.recycleColor ;
            savePalletMode.recycleDestination = paint.recycleDestination ;
            if (paint.palletFrom === commands.paintColImage) {
                paint.palletFrom = commands.paintColPallet;
            } else {
                paint.palletFrom = commands.paintColImage;
            }
            paint.recycleDestination = false;
            paint.recycleColor = false;
        } else {
            savePalletMode.saved = false;
            paint.palletFrom = savePalletMode.palletFrom ;
            paint.recycleColor = savePalletMode.recycleColor ;
            paint.recycleDestination = savePalletMode.recycleDestination ;
        }
    }
    const API = {
        firstRun() {
            Object.assign(fillModes, paint.fillModes);
            const cwCIF = CodeWriter.arrayCallItemFunction;
            const cwCF = CodeWriter.arrayProcess;
            const setup = CodeWriter.createSettings();
            /*sprites.restoreProcessed = cwCIF ({...setup, call : "image.restore", condition : "item.type.image && item.image.processed"}).bind(sprites);
            sprites.restoreDrawable = cwCIF ({...setup, call : "image.restore", condition : "item.drawOn"}).bind(sprites);
            sprites.updateProcessed = cwCIF ({...setup, call : "image.update", condition : "item.type.image && item.image.processed"}).bind(sprites);
            //sprites.undoDrawable = cwCIF ({...setup, call : "image.undo", condition : "item.drawOn"}).bind(sprites);
            sprites.updatePatterns = cwCIF ({...setup, call : "updatePattern", condition : "item.type.pattern && item.image.processed"}).bind(sprites);
            const cutBuff = "if (!item.image.restored && restore) { item.image.restore() }; pens.setupContext(item); cuttingTools.drawBuffer(item,item.image.ctx);"
            sprites.drawCutBuffer = cwCF({...setup, condition : "item.drawOn", args : "restore = false", process : cutBuff}).bind(sprites);
            sprites.unrestore = cwCF({...setup, condition : "item.drawOn", process : "item.image.restored = false"}).bind(sprites);*/
            animation.addEvent("befortimechange", API.frameChange);
            API.firstRun = ()=>{};
        },
        clickId: 0,
        setupContext,
        showPenAreaInner : 0, // if zero shows nothing, else shows inner and outer coverage
        showPenAreaOuter : 0,
        penChangeRequiered : false,
        canSnap : false, // for drawing modes that can snap
        mouseCaptureId : undefined, // this is passed to mode.down functions and stored here. As any process may be using pens this id should be cleared in the up event and to be double safe in  mode.end events.
        feedbackRender : undefined,  // global render when pen is not down
        feedbackRenderMove : undefined,  // global feedback render when pen is down
        feedbackDrawable : undefined, // feedback rendered to drawable sprites marked draw on while pen is up
        feedbackGuide : undefined,  // global render if guides are active
        feedbackMoveGlobal : undefined, // once a frame call
        penMoveGlobal : undefined, // once a frame call
        penMove : undefined,
        penDown : undefined,
        penUp : undefined,
        penIsDown: false,
        feedbackCursor : undefined,
        penDownFunction : undefined,
        penChange : undefined,
        updataPaintState: false, // if true forces call to setPaintState. Set true via API.colorsChanged
        penCanceled : false, // some pen draw modes can cancel using two mouse buttons down. This flags pen up to not update sprite images
        mode : {
            feedback() {},
            end() {},
        },
        modes : {
            currentDrawType : 0,
            switchMode(name) {
                if (API.modes[name]) {
                    colorModeFunc = undefined;
                    colorModeFunc1 = undefined;
                    colorModeFunc2 = undefined;
                    API.mouseCaptureId = undefined;
                    API.mode.end();
                    API.feedbackRenderMove = undefined;
                    API.feedbackMoveGlobal = undefined;
                    API.canSnap = false;
					API.canUseWebGLPaintFilter = false;
                    API.mode = API.modes[name];
                    guides.dontSetGuideLock = false; // default allows lock to set once mouse moved  pastlock threshold
                    API.feedbackRender = feedbackGlobalrenders[name];
                    API.feedbackDrawable = penFeedback[name];
                    API.feedbackGuide = feedbackGlobalrenders.guides[name];
                    API.penDown = penDown[name];
                    API.penMove = penMove[name];
                    API.penUp = penUp[name];
                    API.penMoveGlobal = penMoveGlobal[name];
                    API.penChange = penRenderOptions[name];
                    API.cursor = "crosshair";
                    API.showPenAreaInner = 0;
                    API.showPenAreaOuter = 0;
                    dontUpdateColorPallet = false;
                    mouseBrush.oneWay = false;
                    API.mode.start();
                    API.paintChangeRequiered = false;
                    paint.changed = true;
					//webGLFilterMenus.updatePaintStatus();
                }
                API.modes.currentDrawType = paint.drawType;
            },
            specialBrushB : {
                start () {
                    mouseBrush.oneWay = true;
                    API.penChange();
                    API.feedbackRender = feedbackGlobalrenders.points;
                    API.feedbackMoveGlobal = API.penMoveGlobal;
					specialInterpolate = true;
                    dontUpdateColorPallet = true;
					API.canUseWebGLPaintFilter = true;
                },
                end() {
					specialInterpolate = false;
                },
                feedback() {
                    mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    API.feedback();
                    if (colorPickAreaOn ) { extraRenders.addOneTime(feedbackGlobalrenders.pickupArea) }
                },
                down(mouseCaptureId) {
                    API.mouseCaptureId = mouseCaptureId;
                    mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    API.down();
                    API.mode.move();
                    API.penIsDown = true;
                },
                move() {
                    if (!startingStroke || waitingForDirection) {
                        mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    }
                    API.move()
                    if (brushCanPaint) {
                        startingStroke = false;
                    }
                    specialBrushes.update();
                    if ((mouse.button & 0b101) === 0b101) {
                        mouse.cancelButtons(API.mouseCaptureId);
                        API.penCanceled = true;
                    }
                },
                up() {
                    paint.useDirection = paint.useDirectionShadow;
                    if (API.penCanceled) {
                        API.penCanceled = false;
                        sprites.restoreProcessed();
                        API.penIsDown = false;
                    } else {
                        API.up();
                    }
                },
            },
            shapes : {
                start () {
                    guides.dontSetGuideLock = true;
                    API.penChange();
                    API.feedbackRender = feedbackGlobalrenders.points;
                    API.canSnap = true;
                    drawModeMouseLocked = true;
                },
                end() {
                    drawModeMouseLocked = false;
                },
                feedback() {
                    paint.drawType === commands.paintLine && mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    API.feedback()
                },
                down(mouseCaptureId) {
                    API.mouseCaptureId = mouseCaptureId;
                    API.down();
                    API.mode.move();
                    API.penIsDown = true;
                },
                move() {
                    sprites.unrestore();
                    API.move()
                    startingStroke = false;
                    if (API.feedbackRenderMove) {extraRenders.addOneTime(API.feedbackRenderMove)}
                    if ((mouse.button & 0b101) === 0b101) {
                        mouse.cancelButtons(API.mouseCaptureId);
                        API.penCanceled = true;
                    }
                },
                up() {
                    if (API.penCanceled) {
                        API.penCanceled = false;
                        sprites.restoreProcessed();
                        API.penIsDown = false;
                    } else {
                        API.mode.move();
                        API.up();
                    }
                },
            },
            points : {
                start () {
                    API.feedbackDrawable = penFeedback.points;
                    dontUpdateColorPallet = true;
                    API.canSnap = true;
					API.canUseWebGLPaintFilter = true;
                },
                end() {},
                feedback() {
                    mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    API.feedback();
                    if (colorPickAreaOn ) { extraRenders.addOneTime(feedbackGlobalrenders.pickupArea) }
                },
                down(mouseCaptureId) {
                    API.mouseCaptureId = mouseCaptureId;
                    mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    API.down();
                    API.mode.move();
                    API.penIsDown = true;
                },
                move() {
                    if (!startingStroke  || waitingForDirection) {
                        mouseBrush.add(mouse.cMouse.rx, mouse.cMouse.ry);
                    }
                    API.move()
                    if (brushCanPaint) {
                        startingStroke = false;
                    }
                    if (colorPickAreaOn && (paint.recycleColor || paint.recycleDestination)) { extraRenders.addOneTime(feedbackGlobalrenders.pickupArea) }
                    if ((mouse.button & 0b101) === 0b101) {
                        mouse.cancelButtons(API.mouseCaptureId);
                        API.penCanceled = true;
                    }
                },
                up() {
                    if (API.penCanceled) {
                        API.penCanceled = false;
                        sprites.restoreProcessed();
						paint.useDirection = paint.useDirectionShadow;
                        API.penIsDown = false;
                    } else {
                        API.mode.move();
						paint.useDirection = paint.useDirectionShadow;
                        API.up();
                    }
                },
            },
            cutPaste : {
                start () { API.cursor = undefined },
                end() {},
                paintStateUpdate() {
                    if (paint.drawType === commands.paintMagicCutter) {
                        if (!cuttingTools.isHoldingBuffer && cuttingTools.defined && cuttingTools.isHoldingMask) {
                            cuttingTools.updateMagicStack();
                        }
                    }
                },
                feedback() {
                    //mouse.cMouse.over && setPaintState();
                    setPaintState();
                    if (!cuttingTools.draggingSelection) {
                        cuttingTools.updateCursor();
                    }
                    if (cuttingTools.isHoldingBuffer || cuttingTools.isHoldingMask) {
                        sprites.unrestore();
                        sprites.drawCutBuffer(true);
                    }
                },
                down() {
                    API.penChange(); // Paint UI changes do not trigger this call (BUG) needs to be fixed so it not call needlessly
                    API.penDown()
                },
                move() {
                    API.move();
                    if (cuttingTools.isHoldingBuffer || cuttingTools.isHoldingMask) {
                        sprites.unrestore();
                        sprites.drawCutBuffer(true, false, true);
                    }
                    startingStroke = false;
                },
                up() {
                    if (cuttingTools.dragging) { cuttingTools.dragEnd() }
                    else {
                        cuttingTools.endDragSelection();
                        paint.updateUI();
                    }
                    cuttingTools.sprite.highlight = false;
                },
            },
            floodFill : {
                start () {
                    penRenderOptions.floodFill();
                },
                end() { },
                feedback() { API.feedback() },
                down(mouseCaptureId) {
                    edgeFill.started = false;
                    API.mouseCaptureId = mouseCaptureId;
                    const FFL = floodFillLandings;
                    FFL.landing = true;
                    FFL.landedCount = FFL.idx = FFL.count = 0;
                    FFL.contact = -1;
                    FFL.fillAll = mouse.ctrl === true;
                    API.down();
                    API.mode.move();
                    API.penIsDown = true;
                    mouse.requestCursor(mouseCaptureId, "none");
                },
                move() {
                    if (paint.fillMode === fillModes.floodFillEdges) {
                        const FFL = floodFillLandings;
                        if (!FFL.landing) {
                            if (edgeFill.useFeedback) {
                                sprites.unrestore();
                            }
                            FFL.count = 0;
                            API.move();
                        } else {
                            API.move();
                            FFL.landing = false;
                        }
                        mouse.requestCursor(API.mouseCaptureId, "crosshair");
                        extraRenders.addOneTime(API.feedbackRenderMove);
                    } else {
                        if (mouse.clickId !== 0) {
                            if (mouse.clickId !== API.clickId) {
                                API.clickId = mouse.clickId;
                                API.move();
                                const FFL = floodFillLandings;
                                if (FFL.landedCount > 0) {
                                    FFL.count = 0;
                                    FFL.landing = false;
                                    sprites.eachDrawableVisual(API.penMove);
                                }
                                //mouse.fakeEvent(API.mouseCaptureId,{type : "mouseup", which : "all"});
                            }
                        }
                    }
                    startingStroke = false;
                },
                up() {
                    if (paint.fillMode === fillModes.floodFillEdges) {
                        const FFL = floodFillLandings;
                        if (FFL.landedCount > 0) {
                            FFL.count = 0;
                            if (edgeFill.useFeedback) {
                                sprites.unrestore();
                            }
                            edgeFill.doIt = true; // forces the edge fill render
                            API.move();
                            edgeFill.doIt = false; // forces the edge fill render
                        }
                        API.up();
                    } else {
                        if (API.clickId === mouse.oldClickId) {
                            API.up();
                        }
                    }
                },
            },
            curve : {
                start () {
                    API.feedbackRender = feedbackGlobalrenders.points;
                },
                end() {},
                feedback() {API.feedback() },
                down(mouseCaptureId) {
                    API.mouseCaptureId = mouseCaptureId;
                    API.down();
                    API.mode.move();
                    API.penIsDown = true;
                },
                move() {
                    sprites.unrestore();
                    API.move()
                    startingStroke = false;
                    if (API.feedbackRenderMove) { extraRenders.addOneTime(API.feedbackRenderMove) }
                    if ((mouse.button & 0b101) === 0b101) {
                        mouse.cancelButtons(API.mouseCaptureId);
                        API.penCanceled = true;
                    }
                },
                up() {
                    if (API.penCanceled) {
                        API.penCanceled = false;
                        sprites.restoreProcessed();
                        API.penIsDown = false;
                    } else {
                        API.mode.move();
                        API.up();
                    }
                },
            },
        },
        down() {
            if (mouse.alt) { altPalletMode(true) }
            mouse.cMouse._rx = mouse.cMouse.rx;
            mouse.cMouse._ry = mouse.cMouse.ry;
            sprites.restoreDrawable();
            setPaintState();
            API.penDown();
        },
        move() {
            if (API.updataPaintState) { setPaintState(); }
            API.penMoveGlobal();
            if (API.penMove) { sprites.eachDrawableVisual(API.penMove) }
            if (paint.gridSnapType || paint.gridGuides) {
                if (API.feedbackGuide) { extraRenders.addOneTime(API.feedbackGuide) }
            }
            if (colorSource) {
                colorSource.key._lx = colorSource.key.lx;
                colorSource.key._ly = colorSource.key.ly;
            }
        },
        up() {
            if (API.penUp) { API.penUp() }
            refSprite = undefined;
            sprites.updatePatterns();
            sprites.updateProcessed();
            API.penIsDown = false;
            fillAreaMode = false;
            mouse.cMouse._rx = undefined;
            mouse.cMouse._ry = undefined;
            if (savePalletMode.saved) { altPalletMode(false) }
        },
        frameChange() {
            if (editSprites.drawingModeOn) {
                if (API.mode === API.modes.cutPaste) {
                } else {
                    if (API.penIsDown) {
                       sprites.updateProcessedFrameChange();
                    } else {
                        sprites.restoreDrawable();
                    }
                    mouse.cMouse._rx = undefined;
                    mouse.cMouse._ry = undefined;
                }
            }
        },
        feedback() {
            if (mouse.cMouse.over) {
                if (!(paint.palletFrom === commands.paintColImage)) {
                    var overPal = false;
                    if (API.mousePallets > 0) {
                        const palIdx = pens.mouseOverPallets[pens.mousePallets-1].index ;
                        const sprIdx = mouse.cMouse.overSprites[mouse.cMouse.overSpritesLength-1];
                        if (sprIdx === undefined || sprIdx < palIdx) { overPal = true }
                    }
                    if (overPal) {
                        const p = API.mouseOverPallets[0];
                        const W = p.pallet.image.w;
                        const H = p.pallet.image.h;
                        const idx = p.pallet.colorIndexAtCoord((p.key.lx / p.w) * W | 0, (p.key.ly / p.h) * H | 0);
                        if (API.cursor !== "color_picker" ) { oldCursor = API.cursor; }
                        API.cursor = "color_picker";
                        const colorBut = colours.getButton(commands.mainColor);
                        p.pallet.getRGB(idx,palletColorMain);
                        colorBut.element.style.background = palletColorMain.css;
                    } else {
                        if (API.cursor === "color_picker") {
                            colours.updateUIColor();
                            API.cursor = oldCursor;
                        }
                    }
                }
                if (paint.changed || API.penChangeRequiered) {
                    if (API.penChange) {
                        API.penChange();
                    }
                    paint.changed = false;
                    API.penChangeRequiered = false;
                }
                sprites.restoreDrawable();
                setPaintState();
                if (API.feedbackRender) { extraRenders.addOneTime(API.feedbackRender) }
                if (API.feedbackMoveGlobal) { API.feedbackMoveGlobal() }
                if (API.feedbackDrawable) { sprites.eachDrawable(API.feedbackDrawable) }
                if (paint.gridSnapType || paint.gridGuides) {
                    if (API.feedbackGuide) { extraRenders.addOneTime(API.feedbackGuide) }
                }
                if (API.cursor) { mouse.requestCursor(0, API.cursor) }
            } else {
                sprites.restoreProcessed();
                if (paint.changed && !API.paintChangeRequiered && API.penChange) {
                    API.penChangeRequiered = true;
                    paint.changed = false;
                }
            }
        },
        colorsChanged() {
            if (API.penIsDown) {
                API.updataPaintState = true;
            }
        },
        palletSelect(keep) {
            if (API.mousePallets > 0) {
                const p = API.mouseOverPallets[0];
                const W = p.pallet.image.w;
                const H = p.pallet.image.h;
                const idx = p.pallet.colorIndexAtCoord((p.key.lx / p.w) * W | 0, (p.key.ly / p.h) * H | 0);
                if (API.cursor !== "color_picker" ) {
                    oldCursor = API.cursor;
                }
                //oldCursor = API.cursor !== "color_picker" ? API.cursor : oldCursor;
                API.cursor = "color_picker";
                p.pallet.getRGB(idx,palletColorMain);
                if (keep) {
                    if ((mouse.oldButton & 1) === 1) {
                        colours.setColor(palletColorMain.r,palletColorMain.g,palletColorMain.b,false);
                    } else if ((mouse.oldButton & 4) === 4) {
                        colours.setColor(palletColorMain.r,palletColorMain.g,palletColorMain.b,true);
                    }
                } else {
                    if ((mouse.button & 1) === 1) {
                        const colorBut = colours.getButton(commands.mainColor);
                        colorBut.element.style.background = palletColorMain.css;
                    }else if ((mouse.button & 4) === 4) {
                        const colorBut = colours.getButton(commands.secondColor);
                        colorBut.element.style.background = palletColorMain.css;
                    }
                }
            }
        },
        dropSelection() {
            if (cuttingTools.active) {
                if (cuttingTools.isHoldingBuffer) {
                    sprites.unrestore();
                    sprites.drawCutBuffer(true, true, true);
                    sprites.updatePatterns();
                    sprites.updateProcessed();
                }
            }
        },
        getTopSprite() { return renderFunctions.pixel.getTopImage() },
        setSelectionClipState(state) {
            if (state) {
                useSelectionClip = true;
                selectionClip.irate();
                cuttingTools.asClip(selectionClip);
            } else {
                cuttingTools.asClip();
                useSelectionClip = false;
                selectionClip.irate();
            }
        },
        processPenCommandList(commandList) {
            const renderCommands = [];
            const addCom = (type, x, y) => {
                if (y !== undefined) {
                    renderCommands.push({type,x,y});
                } else {
                    renderCommands.push({x : type,y : x});
                }
            }
            const nextCoord = () => {
                if (!isNaN(commandList[0])) {
                    x = commandList.shift();
                    y = commandList.shift();
                    return true;
                }
                return false;
            }
            var x,y;
            var isDown = false;
            var lastCommand = "";
            while(commandList.length) {
                const com = commandList.shift();
                if (com === "d") {
                    nextCoord();
                    addCom("d1",x,y);
                    isDown = true;
                }else if (com === "m") {
                    nextCoord();
                    if (!isDown) {
                        addCom("d1",x,y);
                        isDown = true;
                    }
                    addCom(x,y);
                    while(nextCoord()) {
                        addCom(x,y);
                    }
                }else if (com === "u") {
                    nextCoord();
                    if (!isDown) {
                        addCom("d1",x,y);
                    }
                    addCom("u1",x,y);
                    isDown = false;
                }
                lastCommand = com;
            }
            if (isDown && lastCommand !== "u") {
                addCom("u1",x,y);
                isDown = false;
                lastCommand = "u";
            }
            renderMessageStack.send("PenCommandList",{
                oncomplete : API.penCommandListComplete,
                pen : renderCommands,
            });
        },
        penCommandListComplete() {
            log("Command list completed.");
        },
        mouseOverPallets: [],
        mousePallets: 0,
        setSpriteColorSrc(spr) {
            if (editSprites.drawingModeOn) {
                if (colorSource) { colorSource.type.penColorSrc = false }
                 if (spr) {
                    colorSource = spr;
                    colorSource.type.penColorSrc = true;
                    API.colourSource = spr.guid;
                } else {
                    colorSource = undefined;
                    API.colourSource = -1;
                }
            } else {
                if (spr) {
                    API.colorSource = spr.guid;
                } else {
                    API.colorSource = -1;
                }
            }
        },
        colorSource : undefined,
		setImageBrush(img) { // standard image not loaded via media
			wCanvas3.ctx.setTransform(1,0,0,1,0,0);
            wCanvas3.ctx.clearRect(0,0, BRUSH_MAX_SIZE, BRUSH_MAX_SIZE);
			wCanvas3.ctx.globalCompositeOperation = "copy";
			wCanvas3.ctx.imageSmoothingEnabled = true;
			wCanvas3.ctx.drawImage(img, 0, 0, BRUSH_MAX_SIZE, BRUSH_MAX_SIZE);
			wCanvas3.ctx.custom_brush = true;
		},
		setBrushImage(spr) { // intent is that the image brush will have all props of spr (animation, live capture, Gif.. etc etc) for now just basic
			if (spr === undefined) {
				wCanvas3.ctx.custom_brush = false;
			} else {
				wCanvas3.ctx.setTransform(1,0,0,1,0,0);
                wCanvas3.ctx.clearRect(0,0, BRUSH_MAX_SIZE, BRUSH_MAX_SIZE);
                if (spr.image.w >= BRUSH_MAX_SIZE || spr.image.h >= BRUSH_MAX_SIZE) {
                    let scale = Math.min(BRUSH_MAX_SIZE / spr.image.w, BRUSH_MAX_SIZE / spr.image.h);
                    wCanvas3.ctx.globalCompositeOperation = "copy";
                    wCanvas3.ctx.imageSmoothingEnabled = true;
                    wCanvas3.ctx.drawImage(spr.image, BRUSH_MAX_CENTER-(spr.image.w * scale * 0.5 | 0), BRUSH_MAX_CENTER-(spr.image.h * scale  * 0.5 | 0), spr.image.w * scale, spr.image.h * scale);
                    wCanvas3.ctx.custom_brush = true;
                } else {
                    let scale = Math.min(BRUSH_MAX_SIZE / spr.image.w, BRUSH_MAX_SIZE / spr.image.h);
                    wCanvas3.ctx.globalCompositeOperation = "copy";
                    wCanvas3.ctx.imageSmoothingEnabled = false;
                    wCanvas3.ctx.drawImage(spr.image, BRUSH_MAX_CENTER-(spr.image.w * scale * 0.5 | 0), BRUSH_MAX_CENTER-(spr.image.h * scale  * 0.5 | 0), spr.image.w * scale, spr.image.h * scale);
                    wCanvas3.ctx.custom_brush = true;
                }
			}
		},
        cleanup() {
            recallColors.main = {...colours.mainColor};
            recallColors.second = {...colours.secondColor};
            if (colorSource) {
                colorSource.type.penColorSrc = false;
                colorSource = undefined;
            }
            pens.mousePallets = 0;
            pens.mouseOverPallets.length = 0;
            floodFillLandings.landings.length = 0;
            refSprite = undefined;
        },
        updateMode(recall = false) {
            API.firstRun();
            if (API.colorSource !== -1) {
                const guid = API.colorSource;
                API.colorSource = -1;
                sprites.eachOfType(spr => {
                    if (spr.guid === guid) {
                        colorSource = spr;
                        API.colorSource = guid;
                        colorSource.type.penColorSrc = true;
                        return true;
                    }
                },"image");
            }
            if (recall) {
                if (recallColors.second) { colours.setColor(recallColors.second.r, recallColors.second.g, recallColors.second.b, true) }
                if (recallColors.main) { colours.setColor(recallColors.main.r, recallColors.main.g, recallColors.main.b) }
            }
            if (API.modes.currentDrawType !== paint.drawType) {
                switch(paint.drawType) {
                    case commands.paintLine:
                    case commands.paintCircle:
                    case commands.paintRectangle:
                        API.modes.switchMode("shapes");
                        break;
                    case commands.paintCurve:
                        API.modes.switchMode("curve");
                        break;
                    case commands.paintSpray:
                    case commands.paintPoints:
                        API.modes.switchMode("points");
                        break;
                    case commands.paintImageSpray:
                        API.modes.switchMode("imageSpray");
                        break;
                    case commands.paintImage:
                        API.modes.switchMode("imaage");
                        break;
                    case commands.paintFloodFill:
                        API.modes.switchMode("floodFill");
                        break;
                    case commands.paintCutter:
                    case commands.paintMagicCutter:
                        API.modes.switchMode("cutPaste");
                        break;
                    case commands.paintBrissleB:
                        API.modes.switchMode("specialBrushB");
                        break;
                    case commands.paintBrissle:
                    case commands.paintBrissleC:
                        API.modes.switchMode("specialBrush");
                        break;
                }
            }
            API.mode.paintStateUpdate && API.mode.paintStateUpdate();
        },
    };
    API.options = {
        pointTypes : [...Object.keys(renderFunctions.alias.points)],
        pointInfo : renderFunctions.alias.pointsInfo,//[...Object.keys(renderFunctions.alias.pointsInfo)],
        walkTypes : [...Object.keys(renderFunctions.alias.walks)],
        walkInfo : [...Object.keys(renderFunctions.alias.walksInfo)],
        colorModes : [...Object.keys(renderFunctions.colorModes)],
		imageRecycle: ["Standard", "AlphaBleed", "Bleed", "Zoom", "Twist","AlphaBleedZoom",],
    };
    return API;
})()