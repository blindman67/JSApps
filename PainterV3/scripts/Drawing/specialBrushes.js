"use strict";
/* Many buttons have multiple uses, rather than create many named instances for each button I just use the original
   names to reference these UI settings. This can be confusing so then following comment contains the most common.
 Command name and paint property name
        commands.paintAntiAlias,      paint.antiAlias
		
 From paint Pannel second row  2nd from the left going right in order are
        commands.paintColorBlend,     paint.colorBlend
        commands.paintBrushSizeBlend, paint.sizeBlend
        commands.paintFadeAlphaDist,  paint.useAlphaDist
        commands.paintSizeDist,       paint.useSizeDist
        commands.paintRandColor,      paint.randColor
        commands.paintUseDirection,   paint.useDirection
        commands.paintUseSpeed,       paint.useSpeed
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
const specialBrushes = (() => {
	const ALPHA_MIN = 3 / 255;
	var useAlphaMin = false;
    var HSLBlendRate = 0.1;
    const workRGBA = utils.rgba;
    const maxHairs = 201;
    const hairs = [];
    const hairsMirror = [];
	const workArray = [];
	workArray.size = 0;
	const wa = workArray;
    const center = utils.point.as(0,0);
    const rgbC = new Uint8ClampedArray(6);
    var hairCount = 0;
    var firstFrame = false;
    var mx,my,H,S,L;
    var oldMx, oldMy;
    const colorRangeO = utils.colorRange;
    var colorRangePens;
	var colorMixVal = 0.5
    const HAIR = {
        x : 0,  // calculated point pos
        y : 0,
        x1 : 0,  // to seg 1
        y1 : 0,
        x2 : 0,  // to seg 2
        y2 : 0,
        x3 : 0, // seg 3
        y3 : 0,
        x4 : 0, // seg 4
        y4 : 0,
        x5 : 0,
        y5 : 0,
		cx: 0,  // color pickup coord
		cy: 0,
		icx: 0,  // x,y of imgColor.dat or icx is -1
		icy: 0,
        segs : 2, // for anti aliased rendering there can be 1 or 2 line segments. This sets tha countpoints the 
        dist : 0,  // distance from center to point
        distNorm : 0, // normalised distance 0-1
        size: 0,  // line width for antialiased and pixel size for aliased
		stage: 0, // processing stage. 0 is common first contact
        angle : 0, // angle from center to point
        dAngle : 0,// delta angle
		dir: 0,
        fade : 1, // multiplies alpha
        hide : false,
        r : 0,  // main color
        g : 0,
        b : 0,
        a : 0,
        r1 : 0, // second color
        g1 : 0,
        b1 : 0,
        a1 : 0,
        revCol : false,
        css : "#000",
		steps: 0, // steps since brush load
    };
                                          

    var _spread,_sizeMin,_sizeRange,_direction;
    var startDirection = 0;
    function hairInit(h, dist){ 
        h.distNorm = dist;
        h.dist = (dist * 0.995 + 0.005) * _spread;
        h.size = curves.spraySize(1-dist) * _sizeRange + _sizeMin;
        h.fade = curves.sprayAlpha(1-dist) ;  
        h.segs = 1;
        h.dAngle = 0;
		h.dir = _direction;
        h.stage = 0;
        h.x3 = h.y3 = 0;
        h.hide = false;
        h.revColor = false;
		h.steps = 0;
        h.cx = h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist;
        h.cy = h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist;   
    }
    function hairInitPix(h, dist){ 
        h.distNorm = dist;
        h.dist = dist;
        h.size = curves.spraySize(1-dist) * _sizeRange + _sizeMin;
        h.fade = curves.sprayAlpha(1-dist) ;   
        h.segs = 1;
        h.dAngle = 0;
		h.dir = _direction;		
        h.stage = 0;
        h.x3 = h.y3 = 0;
        h.hide = false;
        h.revColor = false;
        h.cx = h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist;
        h.cy = h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist;   
    }    
	const bGlobal = {
		speed: 0,
		frameCount: 0,
		direction: 0,
		v1: 0, c1: 0, r1: 0,
	};
	const bShadowGlobal = Object.assign({}, bGlobal);

    // shape helper functions
    function common(){
        startDirection = mouseBrush.direction;
        API.forcePixelRender = false;
		colorMixVal = (paint.pickupRadius / 100) ** 2;
		HSLBlendRate = 0.01 * (paint.pickupRadius / 100)  ** 2;
		bGlobal.speed = 0;
		bGlobal.frameCount = 0;
		bGlobal.direction = _direction;
    }
    function isInDist(x,y,spread){
        const dist =  Math.sqrt(x * x + y * y)
        return dist <= spread && dist > 0;
    }
    function posToAngle(h,x,y,spread){
        const ang = Math.atan2(y,x);
        const dist = Math.sqrt(x * x + y * y);
        h.angle = ang;
        h.dAngle = 0;
        h.dist = dist / spread;
        return h;
    }
    var currentStepColorFunction;
    for(let i = 0; i < maxHairs; i ++){
        hairs.push({...HAIR});
        hairsMirror.push({...HAIR});
    }
    function shadow(){
        var i = 0;
		Object.assign(bShadowGlobal, bGlobal);
        while(i < hairCount){
            Object.assign(hairsMirror[i], hairs[i]);
            i++;
        }
        return hairsMirror;
    }

    function fromShadow(){
        var i = 0;
		Object.assign(bGlobal, bShadowGlobal);
        while(i < hairCount){
            Object.assign(hairs[i], hairsMirror[i]);
            i++;
        }
        return hairs;
    }
	const HEX = [];
	for (let i = 0; i < 255; i++) { HEX.push((i < 16 ? "0" : "") + i.toString(16)) }
	function clampRGBMix(r, g, b, m) {
		return "#" + (r >= 255 ? "FF" : HEX[r | 0]) + (g >= 255 ? "FF" : HEX[g | 0]) + (b >= 255 ? "FF" : HEX[b | 0]) + (m >= 1 ? "FF" : HEX[m * 255 | 0]);
	}
	function HSLMix(h, s, l, m) {
		return "hsla("+ (Math.round(h) % 360) + "," + Math.round(s) + "%," + Math.round(l) + "%,"+ m +")";
	}
	function toHSL(r, g, b){                
		var dif,min,max;
		min = Math.min(r, g, b);
		max = Math.max(r, g, b);
		if(min === max){  
			L = min / 2.56;
		}else{
			dif = max - min;
			L = max + min;
			S =  (L > 256 ? dif / (512 - max - min) :  dif / L) * 100;
			L /= 5.12;
			if (max === r) {
				 H = ((g - b) / dif + (g < b ? 6  : 0)) * 60;
			} else if (max === g) { 
				H = ((b - r) / dif + 2) * 60 ;
			} else {
				H = ((r - g) / dif + 4) * 60; 
			}
		}
	}
    const API = {
		RELOAD_COLOR: 0b10000000,
		imgColors: {
			dat: null,
			active: false,
			w: 0,
			h: 0,
			xo: 0,
			yo: 0,
			cx: 0,
			cy: 0,
			use: false,
		},
        usingArc: false,
		curveStep: 0, // interpolation steps for brushes that can
        hairs,
        shapeInfo : {
            basic : { info : [44,"Random round brush"] },
            pixel : { info : [45,"Square array of pixels\neach pisel is minBrush size and\nthe width of brush is maxSize"]},
            thin : {info : [46,"Random thin horizontal 90 to travel"] },
            thinDouble : {info : [47,"Random thin horizontal\nAlternating points are second color"] },
            thinRegular : {info : [48,"Thin regular brush 90 deg to travel"] },
            thinRegularDoubled : {info : [49,"Thin regular 90 deg to travel\nAlternating points are second color"] },
            thinRegular2 : {info : [45,"Thin regular (two rows) 90 deg to travel"] },
            thinRegularDoubled2 : {info : [45,"Thin regular (two rows) 90 deg to travel\nAlternating points are second color"] },            
            thinAlong : {info : [50,"Thin brush along the direction of travel"] },
            thinAlongDoubled : {info : [51,"Thin brush along the direction of travel\nAlternating points are second color"] },
            traling : {info : [52,"Medium random brush trailing travel directiom"] },
            thinTraling : {info : [53,"Thin regular brush trailing travel directiom"] },
            thinTralingDouble : {info : [54,"Thin regular brush trailing travel directiom\nAlternating points are second color"] },
            tiny : {info : [55,"All points at center (no size)"] },
            tinyDoubled : {info : [56,"All points at center (no size)\nAlternating points are second color"] },
            roundPixeled : {info : [57,"Packed circle of points\nNot effected by brush spacing curve"] },
            roundRegular : {info : [58,"Hair in a circle evenly spaced\nRings of hair spacing set by spacing curve"] },
            roundPacked : {info : [59,"Hairs in a square grid and trimed to be round\nHair spacing set by spacing curve"] },
        },    
        shape : {
            basic(count,spread, sizeMin, sizeRange, direction) {
                _spread = spread;
                _sizeMin = sizeMin;
                _sizeRange = sizeRange;
                _direction = direction;
                hairs.size = hairCount = count < 1 ? 1 : count;
                common();
                var i = 0;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    h.angle = Math.random() * Math.PI2;
                    const dist = curves.spraySpread(Math.random());
                    hairInit(h,dist);
                    i++
                }
            },
            pixel(count,spread, sizeMin, sizeRange, direction) {
                var sizeMinR = sizeMin < 1 ? 1 : sizeMin 
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                const addPoint = (x,y) => {
                    if(i < maxHairs) {
                        const h = hairs[i++];
                        posToAngle(h, x, y, spread);
                        h.angle += direction;
                        const dist = curves.spraySpread(h.dist);
                        hairInit(h, dist);
                        h.size = sizeMinR ;
                    }
                }                    
                var i = 0;
                var sizeMax = sizeMin + sizeRange;
                for(var x = 0; x < sizeMax / 2 && i < maxHairs; x += sizeMinR){
                    for(var y = 0; y < spread + sizeMinR/2 && i < maxHairs; y += sizeMinR){
                        addPoint(x,y);
                        if(x > 0){
                            addPoint(-x,y);
                        }
                        if(y > 0){
                            addPoint(x,-y);
                            if(x > 0){
                                addPoint(-x,-y);
                            }
                        }
                    }
                }
                hairs.size = hairCount = i;
                API.forcePixelRender = true;
            },
            thin(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                hairs.size = hairCount = count < 1 ? 1 : count;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = curves.spraySpread(Math.random());
                    var y = (dist * 0.95 + 0.05) * spread * (Math.random() < 0.5 ? -1 : 1);
                    var x = Math.random() * spread * 0.1 * (Math.random() < 0.5 ? -1 : 1);
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    i++
                }
            },
            thinDouble(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                hairs.size = hairCount = count < 1 ? 1 : count;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = curves.spraySpread(Math.random());
                    var y = (dist * 0.95 + 0.05) * spread * (Math.random() < 0.5 ? -1 : 1);
                    var x = Math.random() * spread * 0.1 * (Math.random() < 0.5 ? -1 : 1);
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    i++
                    if(i < hairCount){
                        const h = hairs[i];
                        y+= 1;
                        h.angle = Math.atan2(y,x) + direction;
                        hairInit(h,dist);
                        h.dist = Math.sqrt(x*x + y*y);
                        h.revColor = true;
                        i++
                    }
                }
            },            
            thinRegular(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var h,dist,x,y,i = 0,j = 0;
                 hairs.size = hairCount = count < 1 ? 1 : count;
				const activeCount = API.currentStep.shapeCount ? API.currentStep.shapeCount() : 1;
                count = count < 1 ? 1 : count / activeCount + 1 | 0;
                var step = 1 / (count > 1 ? (count - 1) : count);
                var start = step/2;
                firstFrame = true;
				while(i < hairCount) {
					h = hairs[i++];
					dist = curves.spraySpread(Math.abs(start * 2));
					y = dist * spread;
					x = 0;
					h.angle = Math.atan2(y,x) + direction;
					hairInit(h,dist);
					h.dist = Math.sqrt(x*x + y*y);
					j = 1;
					while(i < hairCount && j < activeCount) {
						const h1 = hairs[i++];
						h1.angle = h.angle;
						hairInit(h1, dist);
						j++;
					}						
					
					h = hairs[i++];
					dist = curves.spraySpread(Math.abs(start * 2));
					y = -y;
					h.angle = Math.atan2(y,x) + direction;
					hairInit(h,dist);
					h.dist = Math.sqrt(x*x + y*y);
					j = 1;
					while(i < hairCount && j < activeCount) {
						const h1 = hairs[i++];
						h1.angle = h.angle;
						hairInit(h1, dist);
						j++;
					}						
					start += step;
				}
				
            },
            thinRegularDoubled(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0,j;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
				const activeCount = API.currentStep.shapeCount ? API.currentStep.shapeCount() : 1;
                count = count < 1 ? 1 : count / activeCount + 1 | 0;
				
                var step = 1 / (count > 1 ? (count - 1) : count);
                var h, dist,x,y,start = step/2;

                firstFrame = true;
                while(i < hairCount) {
                    h = hairs[i++];
                    dist = curves.spraySpread(Math.abs(start * 2));
                    y = dist * spread;
                    x = 0;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    h.revColor = (i / 2 | 0)  % 2 === 1;
					j = 1;
					while(i < hairCount && j < activeCount) {
						const h1 = hairs[i++];
						h1.angle = h.angle;
						hairInit(h1, dist);
						j++;
					}						
                    
                    h = hairs[i++];
                    dist = curves.spraySpread(Math.abs(start * 2));
                    y = -y;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    h.revColor = (i / 2 | 0)  % 2 === 1;     
					j = 1;
					while(i < hairCount && j < activeCount) {
						const h1 = hairs[i++];
						h1.angle = h.angle;
						hairInit(h1, dist);
						j++;
					}						
                    start += step;
                    

                }
            },            
            thinRegular2(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var h,dist,x,y,i = 0, cc = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 1 / (count > 1 ? (count - 1) : count);
                var start = step/2;
                firstFrame = true;
                while(i < hairCount) {
                    h = hairs[i++];
                    dist = curves.spraySpread(Math.abs(start * 2));
                    y = dist * spread;
                    x = cc % 2 ? -1 : 1;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    h = hairs[i++];
                    dist = curves.spraySpread(Math.abs(start * 2));
                    y = -y;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    start += step;
                    cc++;
                }
            },
            thinRegularDoubled2(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 1 / (count > 1 ? (count - 1) : count);
                var h, dist,x,y,start = step/2,cc= 0;

                firstFrame = true;
                while(i < hairCount) {
                    h = hairs[i++];
                    dist = curves.spraySpread(Math.abs(start * 2));
                    y = dist * spread;
                    x = cc % 2 ? -1 : 1;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    h.revColor = (i / 2 | 0)  % 2 === 1;
                    
                    h = hairs[i++];
                    dist = curves.spraySpread(Math.abs(start * 2));
                    y = -y;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    h.revColor = (i / 2 | 0)  % 2 === 1;
                   
                    start += step;
                    cc ++;
                    

                }
            },                
            thinAlong(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = curves.spraySpread(Math.abs(start));
                    var x = dist * spread * Math.sign(start);
                    var y = 0;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    start += step;
                    i++
                }
            },                       
            thinAlongDoubled(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = curves.spraySpread(Math.abs(start));
                    var x = dist * spread * Math.sign(start);
                    var y = 0;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    h.revColor = i % 2 === 1;
                    start += step;
                    i++
                }
            },            
            traling(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = curves.spraySpread(Math.abs(start));
                    var x = dist * spread * -1;//Math.sign(start);
                    var y = Math.random()*spread*0.3*Math.sign(Math.random()-0.5);
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    start += step;
                    i++
                }
            },                        
            thinTraling(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = curves.spraySpread(Math.abs(start));
                    var x = dist * spread * -1;//Math.sign(start);
                    var y = 0;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    start += step;
                    i++
                }
            },                        
            thinTralingDouble(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = 0.5;//curves.spraySpread(Math.abs(start));
                    var x = dist * spread * -1;//Math.sign(start);
                    var y = i % 2 ? spread / 2 : -spread / 2;
                    h.angle = Math.atan2(y,x) + direction;
                    hairInit(h,dist);
                    h.dist = Math.sqrt(x*x + y*y);
                    start += step;
                    i++
                }
            },                        
            tiny(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = 0.5;//curves.spraySpread(Math.abs(start));
                    h.angle = Math.random() * Math.PI2;
                    hairInit(h,1/spread);
                    h.x = 0;
                    h.y = 0;
                    h.dist = 0;
                    start += step;
                    i++
                }
            },                        
            tinyDoubled(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 2 / (count > 1 ? (count - 1) : count);
                var start = -1;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    const dist = 0.5;//curves.spraySpread(Math.abs(start));
                    h.angle = Math.random() * Math.PI2;
                    hairInit(h,1/spread);
                    h.x = 0;
                    h.y = i % 2 ? 1: -1;
                    h.dist = i % 2 ? 1/spread : -1/spread;
                    h.revColor = i % 2 === 1;
                    start += step;
                    i++
                }
            },             
            roundPixeled(count,spread, sizeMin, sizeRange, direction){
                var sizeMinR = sizeMin < 1 ? 1 : sizeMin 
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var scaleUp = 1 + paint.widthFade / 50;
                scaleUp = scaleUp < 1 ? 1 : scaleUp;
                const addPoint = (x,y) => {
                    const h = hairs[i++];
                    posToAngle(h, x * scaleUp , y * scaleUp , 1);
                    h.angle += direction;
                   //const dist = curves.spraySpread(h.dist);
                    hairInitPix(h, h.dist);
                    h.size = sizeMinR ;
                    if(x >= 0 && y >= 0){
                        placed[x] = y;
                    }
                    
                }                    
                var i = 0;
                var sizeMax = sizeMin + sizeRange;
                var x = 0;
                var y = 0;
                var placed = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
                addPoint(x,y);
                var rad = 1;
                
                while(i < count && rad < spread){
                    x = 0;
                    while(x <= rad){
                        y = placed[x] + 1;
                        while(x * x + y * y < rad * rad){
                            if(x === 0) {
                                addPoint(x,y);
                                addPoint(x,-y);
                                addPoint(y,x);
                                addPoint(-y,x);
                            }else if(y === 0) {
                                addPoint(x,y);
                                addPoint(-x,y);
                                addPoint(y,x);
                                addPoint(y,-x);
                            }else if(x === y){
                                addPoint(x,y);
                                addPoint(-x,-y);
                                addPoint(x,-y);
                                addPoint(-x,y);
                            }else {
                                addPoint(x,y);
                                addPoint(-x,y);
                                addPoint(x,-y);
                                addPoint(-x,-y);   
                                
                                addPoint(y,x);
                                addPoint(-y,x);
                                addPoint(y,-x);
                                addPoint(-y,-x);                               
                            }
                            y++;
                        }
                        x++;
                    }
                    rad += 1;
                }
                        

                hairs.size = hairCount = i;
                API.forcePixelRender = true;
            },
            roundRegular(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                var i = 0;
                count = count < 1 ? 1 : count;
                hairs.size = hairCount = count;
                var step = 1 / Math.sqrt(count);
                var startDist = step;
                var ang = 0;
                var spacing = 2;
                firstFrame = true;
                while(i < hairCount) {
                    const h = hairs[i];
                    h.angle = ang;
                    ang += Math.PI2 / ((startDist * spread * Math.PI) / spacing);
                    if(ang >= Math.PI2){
                        ang -= Math.PI2;
                        startDist += step;
                        if(i + ((startDist * spread * Math.PI) / spacing) > hairCount){
                            spacing = startDist * spread * Math.PI / (hairCount - i);
                        }
                    }
                    const dist = curves.spraySpread(startDist);
                    hairInit(h,dist)
                    i++
                }
            },
            roundPacked(count,spread, sizeMin, sizeRange, direction){
                _spread = spread;_sizeMin = sizeMin;_sizeRange = sizeRange;_direction = direction;
                common();
                const setHair = (x,y) => {
                    const h = hairs[idx];
                    if(isInDist(x,y,spread)){
                        posToAngle(h,x,y,spread);
                        const dist = curves.spraySpread(h.dist);
                        hairInit(h,dist)
                        idx += 1;
                    }
                }
                firstFrame = true;
                var idx = 0;
                var i = 0;
                count = count < 1 ? 1 : count;
                var s = spread * 0.95
                var s1 = spread * 0.7
                if(count === 1){
                    setHair(0,0);
                }else if(count === 2){
                    setHair(0,-s);
                    setHair(0,s);
                }else if(count === 3){
                    setHair(-s1,s1);
                    setHair(s1,s1);
                    setHair(0,-s1);
                }else if(count === 4){
                    setHair(-s1,s1);
                    setHair(s1,s1);
                    setHair(-s1,-s1);
                    setHair(s1,-s1);
                }else if(count === 5){
                    setHair(-s,0.0);
                    setHair(s,0.0);
                    setHair(0,-s);
                    setHair(0,s);
                    setHair(0,0);
                }else{
                    var side = Math.sqrt(count) + 1 | 0;
                    while(side * side >= 128) { side -- }
                    var step = 2 / side;
                    var start = -1 + step;
                    var end = 1 - step;
                    step = (end-start) / side;
                    end += step / 2;
                    for(var y = start; y <= end; y += step){
                        for(var x = start; x <= end; x += step){
                            setHair(x * spread, y * spread);
                        }
                    }
                }
                hairs.size = hairCount = idx;
            },
        },
        load : {
            basic(colorRange){
                var i = 0;
                while(i < hairCount) {
                    const h = hairs[i];
                    h.r = colorRange.rgba1.r;
                    h.g = colorRange.rgba1.g;
                    h.b = colorRange.rgba1.b;
                    h.a = colorRange.rgba1.a;
                    h.a = 1;
                    h.css = colorRange.rgba1.cssRGBA;
                    h.r1 = colorRange.rgba2.r;
                    h.g1 = colorRange.rgba2.g;
                    h.b1 = colorRange.rgba2.b;
                    h.a1 = 1
                    i++
                }
            },
            empty(colorRange){
                var i = 0;
                while(i < hairCount) {
                    const h = hairs[i];
                    h.r1 = h.r = 0;
                    h.g1 = h.g = 0;
                    h.b1 = h.b = 0;
                    h.a1 = h.a = 0;
                    h.css = colorRange.rgba1.cssRGBA;
                    i++
                }
            },
            randomRange(colorRange){
                var i = 0;
                while(i < hairCount) {
                    const h = hairs[i];
                    colorRange.rgbaAt(curves.sprayColor(Math.random()),workRGBA)
                    h.r = workRGBA.r;
                    h.g = workRGBA.g;
                    h.b = workRGBA.b;
                    h.a = workRGBA.a;
                    
                    h.css = workRGBA.cssRGBA;
                    colorRange.rgbaAt(1-curves.sprayColor(Math.random()),workRGBA)
                    h.r1 =  workRGBA.r;
                    h.g1 = workRGBA.g;
                    h.b1 = workRGBA.b;
                    h.a1 = workRGBA.a;

                    i++;
                }
            },
            curveRange(colorRange){
                var i = 0;
                const a = curves.curves.lineColor.value;
                const a1 = 1-a;
                while(i < hairCount) {
                    const h = hairs[i];
                    colorRange.rgbaAt(curves.sprayColor(h.distNorm),workRGBA)
                    h.r = Math.sqrt(h.r * h.r * a1 + workRGBA.r * workRGBA.r * a);
                    h.g = Math.sqrt(h.g * h.g * a1 + workRGBA.g * workRGBA.g * a);
                    h.b = Math.sqrt(h.b * h.b * a1 + workRGBA.b * workRGBA.b * a);
                    h.a = 1;
                    h.css = workRGBA.cssRGBA;
                    colorRange.rgbaAt(1-curves.sprayColor(h.distNorm),workRGBA)
                    h.r1 = Math.sqrt(h.r1 * h.r1 * a1 + workRGBA.r1 * workRGBA.r1 * a);
                    h.g1 = Math.sqrt(h.g1 * h.g1 * a1 + workRGBA.g1 * workRGBA.g1 * a);
                    h.b1 = Math.sqrt(h.b1 * h.b1 * a1 + workRGBA.b1 * workRGBA.b1 * a);
                    h.a1 = 1;
                    i++
                }
            }
        },
        stepColorInfo : {
            blend : {
                info : "Uses line color curve to mix main and second colors",
            },
            basic : {
                info : "Uses only the current color",
            },
            curve : {
                info : "Applys line color curve to each RGB channel",
            }                
        },
        stepColor : {
            basic(mix,hair){
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
				if(paint.useAlphaDist) {  // to use colour curve over stroke
					const m = curves.lineColor(mix);
					const m1 = 1 - m;
					hair.css = hair.revColor ?
						"rgba("+ (hair.r1 * m1 + hair.r * m) + "," + (hair.g1 * m1 + hair.g * m) + "," + (hair.b1 * m1 + hair.b * m) + ","+ mixa+")" :           
						"rgba("+ (hair.r1 * m + hair.r * m1) + "," + (hair.g1 * m + hair.g * m1) + "," + (hair.b1 * m + hair.b * m1) + ","+ mixa+")" ;				
				}else{
					hair.css = hair.revColor ?
						"rgba("+ hair.r1 + "," + hair.g1 + "," + hair.b1 + ","+ mixa+")" :           
						"rgba("+ hair.r + "," + hair.g + "," + hair.b + ","+ mixa+")";           
				}
            },
            lighter(mix,hair){
                var m,m1,change = 1 + colorMixVal;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
				
				if(paint.useAlphaDist) {  // to use colour curve over stroke
					if (hair.revColor){ m1 = 1 - (m = curves.lineColor(mix)); }
					else { m = 1 - (m1 = curves.lineColor(mix)) }
					return hair.css = clampRGBMix(
						Math.sqrt((hair.r1 * hair.r1 * m + hair.r * hair.r * m1) * change) + 0.5,
						Math.sqrt((hair.g1 * hair.g1 * m + hair.g * hair.g * m1) * change) + 0.5,
						Math.sqrt((hair.b1 * hair.b1 * m + hair.b * hair.b * m1) * change) + 0.5,
						mixa
					);
				} 
				if(hair.revColor){
					return hair.css = clampRGBMix(
					    Math.sqrt(hair.r1 * hair.r1 * change) + 0.5,
					    Math.sqrt(hair.g1 * hair.g1 * change) + 0.5,
					    Math.sqrt(hair.b1 * hair.b1 * change) + 0.5,
						mixa
					);
				}
				hair.css = clampRGBMix(
					Math.sqrt(hair.r * hair.r * change) + 0.5,
					Math.sqrt(hair.g * hair.g * change) + 0.5,
					Math.sqrt(hair.b * hair.b * change) + 0.5,
					mixa
				);
            },
            darker(mix,hair){
                var m,m1,change = 1 / (1 + colorMixVal);
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
				
				if(paint.useAlphaDist) {  // to use colour curve over stroke
					if (hair.revColor){ m1 = 1 - (m = curves.lineColor(mix)); }
					else { m = 1 - (m1 = curves.lineColor(mix)) }
					return hair.css = clampRGBMix(
						Math.sqrt((hair.r1 * hair.r1 * m + hair.r * hair.r * m1) * change) + 0.5,
						Math.sqrt((hair.g1 * hair.g1 * m + hair.g * hair.g * m1) * change) + 0.5,
						Math.sqrt((hair.b1 * hair.b1 * m + hair.b * hair.b * m1) * change) + 0.5,
						mixa
					);
				} 
				if(hair.revColor){
					return hair.css = clampRGBMix(
					    Math.sqrt(hair.r1 * hair.r1 * change) + 0.5,
					    Math.sqrt(hair.g1 * hair.g1 * change) + 0.5,
					    Math.sqrt(hair.b1 * hair.b1 * change) + 0.5,
						mixa
					);
				}
				hair.css = clampRGBMix(
					Math.sqrt(hair.r * hair.r * change) + 0.5,
					Math.sqrt(hair.g * hair.g * change) + 0.5,
					Math.sqrt(hair.b * hair.b * change) + 0.5,
					mixa
				);
            },
            hueToMain(mix,hair){
                
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}		
				
                H = S = L = 0;
                hair.revColor ? toHSL(hair.r1, hair.g1, hair.b1) : toHSL(hair.r, hair.g, hair.b);
                var hh = colorRangeO.rgba1.h - H;
                if (hh < -180) { hh = 360 + hh}
                if (hh > 180) { hh = hh - 360 }    
				hair.css = HSLMix(H + 360 + hh * colorMixVal, S, L, mixa);

            }, 
            satToMain(mix,hair){
                var dif, h, l, s,min, max, r, g, b;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
                H = S = L = 0;
                hair.revColor ? toHSL(hair.r1, hair.g1, hair.b1) : toHSL(hair.r, hair.g, hair.b); 
				hair.css = HSLMix(H, S + (colorRangeO.rgba1.s - S) * colorMixVal, L, mixa);
            },            
            lumToMain(mix,hair){
                var dif, h, l, s,min, max, r, g, b;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
                H = S = L = 0;
                hair.revColor ? toHSL(hair.r1, hair.g1, hair.b1) : toHSL(hair.r, hair.g, hair.b); 
				hair.css = HSLMix(H,S, L + (colorRangeO.rgba1.l - L) * colorMixVal, mixa);
            },               
            hueSatToMain(mix,hair){
                var dif, h, hh, l, s,min, max, r, g, b;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
                H = S = L = 0;
                hair.revColor ? toHSL(hair.r1, hair.g1, hair.b1) : toHSL(hair.r, hair.g, hair.b);
                var hh = colorRangeO.rgba1.h - H;
                if (hh < -180) { hh = 360 + hh}
                if (hh > 180) { hh = hh - 360 }  
				hair.css = HSLMix(H + 360 + hh * colorMixVal, S + (colorRangeO.rgba1.s - S) * colorMixVal, L, mixa);

            }, 
            hueLumToMain(mix,hair){
                var dif, h, hh, l, s,min, max, r, g, b;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
                H = S = L = 0;
                hair.revColor ? toHSL(hair.r1, hair.g1, hair.b1) : toHSL(hair.r, hair.g, hair.b);
                var hh = colorRangeO.rgba1.h - H;
                if (hh < -180) { hh = 360 + hh}
                if (hh > 180) { hh = hh - 360 }        
                hair.css = HSLMix(H + 360 + hh * colorMixVal, S,  L + (colorRangeO.rgba1.l - L) * colorMixVal, mixa);
            },               
			satLumToMain(mix,hair){
                var dif, h, l, s,min, max, r, g, b;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
                H = S = L = 0;
                hair.revColor ? toHSL(hair.r1, hair.g1, hair.b1) : toHSL(hair.r, hair.g, hair.b);

                hair.css = HSLMix(H,  S + (colorRangeO.rgba1.s - S) * colorMixVal,  L + (colorRangeO.rgba1.l - L) * colorMixVal, mixa);
            },   			
			toMain(mix,hair){
                var r, g, b, rr,gg,bb;
                const mixa = curves.lineAlpha(mix) *  hair.a * hair.fade;
				if (useAlphaMin && mixa < ALPHA_MIN) {
					hair.hide = true;
					hair.css = "#0000";
					return;
				}
				rr = colorRangeO.rgba1.r;
				gg = colorRangeO.rgba1.g;
				bb = colorRangeO.rgba1.b;
				hair.revColor ? (r = hair.r1, g = hair.g1, b = hair.b1) : (r = hair.r, g = hair.g, b = hair.b);
				const m1 = 1 - colorMixVal;
				return hair.css = clampRGBMix(
					Math.sqrt(rr*rr * colorMixVal + r * r * m1) + 0.5,
					Math.sqrt(gg*gg * colorMixVal + g * g * m1) + 0.5,
					Math.sqrt(bb*bb * colorMixVal + b * b * m1) + 0.5,
					mixa
				);		
            },   			
        },
        stepInfo : {
            Template : {
                info : "Draws brush as is",
                brushColor: "",
                brushAlpha: "",
                lineColor:  "",
                lineWidth:  "",
                lineAlpha:  "",
                //sprayColor: "",
                //spraySize : "",
                //spraySpread:"",
                //sprayAlpha: "",                 
            },            
            basic : {
                info : [58,"Simple multy stroke brush"],
                brushColor: [33, "Hair stroke length", 35, "Brush angle offset"],
                brushAlpha: [34, "Contact flare",35, "Max contact length"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            },               
			basic2 : {
                info : [59,"Simple 2 segment multy stroke brush"],
                brushColor: [33, "Hair stroke length", 35, "Brush angle offset"],
                brushAlpha: [34, "Random jitter",35, "Max contact length"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 					
			sticky : {
                info : [60,"Sticky brush"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [34, "Random jitter"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 					
			crawler : {
                info : [86,"Crawling brush"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [34, "Random crawl amount"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 					
			crawler2 : {
                info : [87,"Crawling inplace brush"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [34, "Random crawl amount"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 					
			crawler3 : {
                info : [88,"Crawling inplace spinner brush"],
                brushColor: [33, "Hair stroke length", 35, "Brush angle offset"],
                brushAlpha: [34, "Random crawl turn amount", 35, "Random crawl move amount", 36, "Random hair aging"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 					
			mover : {
                info : [58,"Moves colour out and in"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [34, "Random jitter", 35, "Color move amount", 36, "Move angle offset"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 			
			longHair : {
                info : [64,"Long hair brush"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [33, "Hair contact length"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 				
			sketcher : {
                info : [89,"Sketcher"],
                brushColor: [33, "Hair stroke length", 34, "Segment corner threashold"],
                brushAlpha: [33, "Hair segment MAX length",34, "Hair segment MIN length"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 				
			sketcherRandom : {
                info : [90,"Sketcher Random"],
                brushColor: [33, "Hair stroke length", 34, "Segment corner threashold"],
                brushAlpha: [33, "Hair segment MAX length",34, "Hair segment MIN length",35, "Random size"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 			
			longHairOnce : {
                info : [65,"Long hair brush load once"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [33, "Hair contact length"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 			
			speedBrush : {
                info : [58,"Multi stroke speed brush"],
                brushColor: [33, "Hair stroke length",34, "Speed sensitivity"],
                brushAlpha: [26, "Speed size curve"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            },            
			stringBrush : {
                info : [62,"String brush"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [27,"String segment length",28,"String segements"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            },     
			stringBrushRandom : {
                info : [63,"String brush random"],
                brushColor: [33, "Hair stroke length", 34, "Random amount"],
                brushAlpha: [27,"String segment length",28,"String segements"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            }, 			
            string : {
                info : [62,"Connects brush points as a string"],
                brushColor: [33,""],
                brushAlpha: [35,""],
                lineWidth:  "Color blend curve",
            },
			pointSlip : {
                info : [79,"Experiment direct acess to bitmap"],
                brushColor: [39,"Flow speed < 50 away from dark > 50 to dark"],
                brushAlpha: [41,"Color flow drag", 40,"Hair stroke length"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],
            }, 
			jumper : {
                info : [58,"Hairs jump position"],
                brushColor: [33, "Hair stroke length"],
                brushAlpha: [34, "Jump odds", 35, "Jump stay for"],
                lineColor:  [25,"Color mix per stroke"],
                lineWidth:  [26,"Width curve per stroke"],
                lineAlpha:  [22,"Alpha curve per stroke"],				
            },			
        },
        step : {
     
            basic(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,t,size;
                const directionChange = hairs.dd * step;
                var nx = hairs.dx * rStep;
                var ny = hairs.dy * rStep;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.superPowers[0] ** 2;
				var brushAngleOffset =  (curves.curves.brushColor.superPowers[1] - 50) / 50 * Math.PI;
				var contactFlare =  curves.curves.brushAlpha.superPowers[0] / 50 - 1;
				const maxContact =  curves.curves.brushAlpha.superPowers[1] * rStep;
				const limitContact = speed > maxContact * rStep ? (maxContact * rStep) / speed : 1;
				nx *= limitContact;
				ny *= limitContact;		
				
				
				var veryLong = false;
				hairLife = hairLife < 1 ? (veryLong = true, 1e12) : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = 0;
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.angle += brushAngleOffset;
							h.stage = 0b11;

						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
									h.angle += brushAngleOffset;
								}								
								h.steps = veryLong ? 0 : h.steps % hairLife;
								h.hide = true;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
								h.stage |= 0b100;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	
							h.stage |= 0b11;
							

						}
					}
					if(veryLong) {
						t = size = 1;
					} else {						
						t = h.steps /  hairLife;
						size = curves.lineWidth(t);
					}
					if(h.stage & 0b10) {
						h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist * size;
						h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist * size;	
						h.x4 = h.x3 = 0;
						h.y4 = h.y3 = 0;					
						h.stage -= 0b10;		
						h.steps += speed;						
					} else {
						t = t > 1 ? 1 : t < 0 ? 0 : t;
						h.x4 = (h.x3 = -nx) - nx;
						h.y4 = (h.y3 = -ny) - ny;
						h.x2 = h.x1 - nx; 						
						h.y2 = h.y1 - ny; 
                        h.x -= nx;						
                        h.y -= ny;						
						h.x1 = h.x;    					
						h.y1 = h.y ; 	
						
						h.x2 += (h.x4 - h.x2) * contactFlare * t;
						h.y2 += (h.y4 - h.y2) * contactFlare * t;						
						h.x1 += (h.x3 - h.x1) * contactFlare * t;
						h.y1 += (h.y3 - h.y1) * contactFlare * t;

						
						x = Math.cos(h.angle) * h.dist * size;
						y = Math.sin(h.angle) * h.dist * size;	
						//xx = x - h.x;
						//yy = y - h.y;
						//const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps +=  speed;
						h.x = x;
						h.y = y;
					}
					t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 2;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = h.x;
					h.cy = h.y;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },	
            basic2(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy;
                const directionChange = hairs.dd * step;
                var nx = hairs.dx * rStep;
                var ny = hairs.dy * rStep;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.superPowers[0];
				var brushAngleOffset =  (curves.curves.brushColor.superPowers[1] - 50) / 50 * Math.PI;
				var randomSize =  curves.curves.brushAlpha.superPowers[0] / 10;
				const maxContact =  curves.curves.brushAlpha.superPowers[1] * rStep;
				const limitContact = speed > maxContact * rStep ? (maxContact * rStep) / speed : 1;
				nx *= limitContact;
				ny *= limitContact;		
				
				
				var veryLong = false;
				hairLife = hairLife < 1 ? (veryLong = true, 1e12) : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = veryLong ? 0 : Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.angle += brushAngleOffset;
							h.stage = 0b11;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
									h.angle += brushAngleOffset;
								}								
								h.steps = veryLong ? 0 : h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	
							h.stage |= 0b11;
							

						}
					}
					

					if(h.stage & 0b10) {
						h.x2 = (h.x1 = (h.x = Math.cos(h.angle) * h.dist + Math.randPn(randomSize)) - nx + Math.randPn(randomSize)) - nx + Math.randPn(randomSize);
						h.y2 = (h.y1 = (h.y = Math.sin(h.angle) * h.dist + Math.randPn(randomSize)) - ny + Math.randPn(randomSize)) - ny + Math.randPn(randomSize);	
						h.stage -= 0b10;		
						h.steps += speed;						
					} else {
						h.x2 = h.x1 - nx + Math.randPn(randomSize); 						
						h.y2 = h.y1 - ny + Math.randPn(randomSize); 
                        h.x -= nx;						
                        h.y -= ny;						
						h.x1 = h.x + Math.randPn(randomSize);    					
						h.y1 = h.y + Math.randPn(randomSize); 						
						x = Math.cos(h.angle) * h.dist + Math.randPn(randomSize);
						y = Math.sin(h.angle) * h.dist + Math.randPn(randomSize);	
						xx = x - h.x;
						yy = y - h.y;
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + speed;
						h.x = x;
						h.y = y;
					}
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 2;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = h.x;
					h.cy = h.y;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },		
            sticky(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.value * 100 ** 2;
				var randomSize =  curves.curves.brushAlpha.value * 10;				
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.stage = 1;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
								}								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	
							h.stage |= 0b11;
						}
					}
					if(h.stage & 0b10) {
						h.x2 = (h.x1 = (h.x = Math.cos(h.angle) * h.dist + Math.randPn(randomSize)) - nx + Math.randPn(randomSize)) - nx + Math.randPn(randomSize);
						h.y2 = (h.y1 = (h.y = Math.sin(h.angle) * h.dist + Math.randPn(randomSize)) - ny + Math.randPn(randomSize)) - ny + Math.randPn(randomSize);	
						h.stage -= 0b10;		
						h.steps += speed;						
					} else {
						h.x2 -= nx; 						
						h.y2 -= ny;
						h.x1 -= nx; 						
						h.y1 -= ny;
						
						h.x2 = 0.8 * h.x2  + 0.2 * (h.x1 + Math.randPn(randomSize));	
						h.y2 = 0.8 * h.y2  + 0.2 * (h.y1 + Math.randPn(randomSize));
						h.x1 = 0.8 * h.x1  + 0.2 * (h.x + Math.randPn(randomSize));
						h.y1 = 0.8 * h.y1  + 0.2 * (h.y + Math.randPn(randomSize));	
						x = Math.cos(h.angle) * h.dist + Math.randPn(randomSize);
						y = Math.sin(h.angle) * h.dist + Math.randPn(randomSize);	
						xx = x - h.x;
						yy = y - h.y;
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + speed;
						h.x = x;
						h.y = y;
					}
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 2;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = (h.x + h.x1) / 2;
					h.cy = (h.y + h.y1) / 2;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
            crawler(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,t;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.value * 100;
				var randomSize =  curves.curves.brushAlpha.value * 10;				
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.stage = 1;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
								}								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	
							h.stage |= 0b11;
						}
					}
					if(h.stage & 0b10) {
						h.x1 = (h.x2 = h.x = Math.cos(h.angle) * h.dist) - nx;
						h.y1 = (h.y2 = h.y = Math.sin(h.angle) * h.dist) - ny;	
						h.stage -= 0b10;		
						h.steps += speed;	
						t = h.steps /  hairLife;						
					} else {
						h.x1 = h.x - nx;
						h.y1 = h.y - ny;	
						t = h.steps /  hairLife;
						t = 1 - curves.lineWidth(t);
						x = h.x + Math.randPn(randomSize * t);
						y = h.y + Math.randPn(randomSize * t);	
						xx = x - (h.x - nx);
						yy = y - (h.y - ny);
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + speed;
						h.x = x;
						h.y = y;
						t = h.steps /  hairLife;
					}

					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 1;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = h.x2;
					h.cy = h.y2;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
            crawler2(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,t;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.value * 100;
				var randomSize =  curves.curves.brushAlpha.value * 10;				
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.stage = 1;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
								}								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	
							h.stage |= 0b11;
						}
					}
					if(h.stage & 0b10) {
						h.x1 = (h.x2 = h.x = Math.cos(h.angle) * h.dist) - nx;
						h.y1 = (h.y2 = h.y = Math.sin(h.angle) * h.dist) - ny;	
						h.stage -= 0b10;		
						h.steps = speed;	
						t = h.steps /  hairLife;						
					} else {
						h.x1 = h.x - nx;
						h.y1 = h.y - ny;	
						t = h.steps /  hairLife;
						t = 1 - curves.lineWidth(t);
						x = h.x + Math.randPn(randomSize * t) - nx;
						y = h.y + Math.randPn(randomSize * t) - ny;	
						xx = x - h.x;
						yy = y - h.y;
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + 0.1;
						h.x = x;
						h.y = y;
						t = h.steps /  hairLife;
					}

					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 1;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = (h.x1 + h.x) / 2;
					h.cy = (h.y1 + h.y) / 2;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
            crawler3(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,t;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.superPowers[0];
				
				var brushAngleOffset =  (curves.curves.brushColor.superPowers[1] - 50) / 50 * Math.PI;
				var randomTurn =  (curves.curves.brushAlpha.superPowers[0] / 25) * Math.PI90;				
				var randomMove =  curves.curves.brushAlpha.superPowers[1] / 10;	
				var randomLife =  curves.curves.brushAlpha.superPowers[2] / 100;	
				var veryLong = false;
				hairLife = hairLife < 1 ? (veryLong = true, 1e12) : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = veryLong ? 0 : Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.angle += brushAngleOffset;
							h.x3 = h.angle;
							h.y3 = 0;
							h.stage = 0b11;
							h.y4 = hairLife * (Math.random() * randomLife);
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
									h.angle += brushAngleOffset;
								}								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	
							h.x3 = h.angle;
							h.y3 = 0;
							h.y4 = hairLife * (Math.random() * randomLife);
							h.stage |= 0b11;
						}
					}
					if(h.stage & 0b10) {
						h.x1 = (h.x2 = h.x = Math.cos(h.angle) * h.dist) - nx;
						h.y1 = (h.y2 = h.y = Math.sin(h.angle) * h.dist) - ny;	
						h.stage -= 0b10;		
						h.steps = speed;	
						t = h.steps /  hairLife;						
					} else {
						h.x -= nx;
						h.y -= ny;
						h.x1 = h.x;
						h.y1 = h.y;	
						//t = h.steps /  hairLife;
						//t = 1 - curves.lineWidth(t);
						h.x3 += Math.randPn(randomTurn);
						h.y3 = Math.abs(h.y3 + Math.randPn(randomMove));
						if(h.y3 > randomMove) { h.y3 += (randomMove - h.y3) * 0.5 }
						
						xx = Math.cos(h.x3) * h.y3;
						yy = Math.sin(h.x3) * h.y3;
						x = h.x + xx;
						y = h.y + yy;	
						xx = x - h.x;
						yy = y - h.y;
						const stepSpeed = ((xx * xx + yy * yy) ** 0.5)  ;					
						h.steps += stepSpeed + 0.1 +  h.y4;
						h.x = x;
						h.y = y;
						t = h.steps /  hairLife;
					}

					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 1;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = (h.x1 + h.x) / 2;
					h.cy = (h.y1 + h.y) / 2;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },		
            mover(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,dx,dy;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.value * 100;
				var randomSize =  curves.curves.brushAlpha.superPowers[0] / 10;
				var moveDist =  (curves.curves.brushAlpha.superPowers[1] - 50) / (50 / 3);
				var moveAng =  ((curves.curves.brushAlpha.superPowers[2] - 50) / 50) * Math.PI90;
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i++];
                    h.angle += directionChange;
                    h.dir += directionChange;
	
					
					if (h.steps >= hairLife || h.stage ===  0) {

						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) { h.hide = true }

							h.stage = 1;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { API.currentShape.reset(h) }								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100
							}
							h.stage |= 0b11;
						}
					}
					dx = Math.cos(h.angle);
					dy = Math.sin(h.angle);
					if(h.stage & 0b10) {
						h.x1 = (h.x = dx * h.dist) + Math.randPn(randomSize);
						h.y1 = (h.y = dy * h.dist) + Math.randPn(randomSize);	
						h.stage -= 0b10;		
						h.steps += speed;						
					} else {
						h.y1 = h.y + Math.randPn(randomSize);
						h.x1 = h.x + Math.randPn(randomSize);    					
						x = dx * h.dist;
						y = dy * h.dist;	
						xx = x - h.x1;
						yy = y - h.y1;
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + speed;
						h.x = x;
						h.y = y;
					}
					dx = Math.cos(h.angle + moveAng);
					dy = Math.sin(h.angle + moveAng);					
					
					const dn = h.distNorm ** 0.5;
					h.cx = h.x + dx * moveDist * dn;
					h.cy = h.y + dy * moveDist * dn;
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 1;
					h.hide = h.stage & 0b100 ? true : false;					
					if (!h.hide) {
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}

                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },							
            sketcher(x,y, step, rStep){
				const calcNextSeg = (x1, y1, x2, y2) => {
					xx = x2 - x1;
					yy = y2 - y1;
					d = (xx * xx + yy * yy) ** 0.5;
					if (d > hairLen) {
						xx = x1 + xx / d * hairLen;
						yy = y1 + yy / d * hairLen;
						return true;
					}
					xx = x2;
					yy = y2;		
					return false;
				}
				useAlphaMin = false;
                var lw,nx,ny,d,a,i = 0,t,x,y,xx,yy,segAdd;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const directionChangePos = Math.abs(directionChange);
				const speed = (nx * nx + ny * ny) ** 0.5;
				var aa =  curves.curves.brushAlpha.superPowers[0] * 2;
				var bb =  curves.curves.brushAlpha.superPowers[1] * 2;

				var hairLife =  curves.curves.brushColor.superPowers[0] * 4;
				var angleCut =  curves.curves.brushColor.superPowers[1] * (Math.PI / 180) / 4;
				angleCut = angleCut < 0.01 ? 0 : angleCut;
				hairLife = hairLife < 1 ? 1e12 : hairLife;				
				var hairLen = bb < 1 ? 1e12 : bb;
				var hairLenMin = aa < 1 ? 1e12 : aa;
				var hairLenRange = hairLen - hairLenMin;
				const hl = hairLen;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;
				const hc = hairCount - 1;

                while(i < hairCount) {
					const unit = hc  ? 1 - (i / hc) : 1;
					hairLen = hairLenMin + hairLenRange * unit;

                    const h = hairsMirror[i];
                    h.angle += directionChange;
					
                    h.dir += directionChange;

					if (h.segs === 4 || h.stage ===  0) {

						if (h.stage === 0) {
							h.steps = hairLen;//hairLife * Math.random();
							h.stage = 0b1001;
							h.dAngle = 0;
						} else {
							if (API.currentShape.reset) { API.currentShape.reset(h) }	
							h.steps = h.steps >= hairLife ? hairLen : h.steps;
							h.stage = 0b1;
							h.dAngle = 0;
						}
						h.x3 = h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist;
						h.y3 = h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist;
						h.segs = 1;
					}
					

					if(h.segs >= 3) {
						h.segs = 2;
						h.x3 = h.x2;
						h.y3 = h.y2;
						h.x2 = h.x1;
						h.y2 = h.y1;						
						h.steps = hairLen;
						h.dAngle = 0;
					}
					h.x3 -= nx;
					h.y3 -= ny;
					h.x2 -= nx;
					h.y2 -= ny;
					h.x1 -= nx;
					h.y1 -= ny;    					
					x = Math.cos(h.angle) * h.dist;
					y = Math.sin(h.angle) * h.dist;	
					xx = x - (h.x - nx);
					yy = y - (h.y - ny);
					const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
					h.steps += stepSpeed + speed;
					h.dAngle += directionChangePos;
					h.x = x;
					h.y = y;

					if(h.steps > h.segs * hairLen || (angleCut && Math.abs(h.dAngle) > angleCut + h.segs * (angleCut * unit))) {

						if(h.segs === 1) {
							h.x2 = h.x - nx;
							h.y2 = h.y - ny;
							if(h.stage & 0b100){
								h.x1 = h.x2;
								h.y1 = h.y2;
								h.stage = 1;
							}
							h.segs = 2;
						} else if(h.segs === 2) {
							h.x1 = h.x - nx;
							h.y1 = h.y - ny;
							h.segs = 3;							
						}
					}


					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.size =  curves.lineWidth(t) * br + bm;
					h.hide = false;
					currentStepColorFunction(t,h);
					h.cx = h.x;
					h.cy = h.y;
                    i++;
					

                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },	
            sketcherRandom(x,y, step, rStep){
				const calcNextSeg = (x1, y1, x2, y2) => {
					xx = x2 - x1;
					yy = y2 - y1;
					d = (xx * xx + yy * yy) ** 0.5;
					if (d > hairLen) {
						xx = x1 + xx / d * hairLen;
						yy = y1 + yy / d * hairLen;
						return true;
					}
					xx = x2;
					yy = y2;		
					return false;
				}
				useAlphaMin = false;
                var lw,nx,ny,d,a,i = 0,t,x,y,xx,yy,segAdd;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const directionChangePos = Math.abs(directionChange);
				const speed = (nx * nx + ny * ny) ** 0.5;
				var aa =  curves.curves.brushAlpha.superPowers[0] * 2;
				var bb =  curves.curves.brushAlpha.superPowers[1] * 2;
				var randomSize =  curves.curves.brushAlpha.superPowers[2] / 10;
				var hairLife =  curves.curves.brushColor.superPowers[0] * 4;
				var angleCut =  curves.curves.brushColor.superPowers[1] * (Math.PI / 180) / 4;
				angleCut = angleCut < 0.01 ? 0 : angleCut;
				hairLife = hairLife < 1 ? 1e12 : hairLife;				
				var hairLen = bb < 1 ? 1e12 : bb;
				var hairLenMin = aa < 1 ? 1e12 : aa;;
				var hairLenRange = hairLen - hairLenMin;
				const hl = hairLen;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;
				const hc = hairCount - 1;

                while(i < hairCount) {
					const unit = hc  ? 1-(i / hc) : 1;
					hairLen = hairLenMin + hairLenRange * unit;

                    const h = hairsMirror[i];
                    h.angle += directionChange;
					
                    h.dir += directionChange;

					if (h.segs === 4 || h.stage ===  0) {

						if (h.stage === 0) {
							h.steps = hairLen;//hairLife * Math.random();
							h.stage = 0b1001;
							h.dAngle = 0;
						} else {
							if (API.currentShape.reset) { API.currentShape.reset(h) }	
							h.steps = h.steps >= hairLife ? hairLen : h.steps;
							h.stage = 0b1;
							h.dAngle = 0;
						}
						h.x3 = h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist;
						h.y3 = h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist;
						h.segs = 1;
					}
					

					if(h.segs >= 3) {
						h.segs = 2;
						h.x3 = h.x2;
						h.y3 = h.y2;
						h.x2 = h.x1;
						h.y2 = h.y1;						
						h.steps = hairLen;
						h.dAngle = 0;
					}
					h.x3 -= nx + Math.randPn(randomSize);;
					h.y3 -= ny + Math.randPn(randomSize);;
					h.x2 -= nx + Math.randPn(randomSize);;
					h.y2 -= ny + Math.randPn(randomSize);;
					h.x1 -= nx + Math.randPn(randomSize);;
					h.y1 -= ny + Math.randPn(randomSize);;    					
					x = Math.cos(h.angle) * h.dist;
					y = Math.sin(h.angle) * h.dist;	
					xx = x - (h.x - nx);
					yy = y - (h.y - ny);
					const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
					h.steps += stepSpeed + speed;
					h.dAngle += directionChangePos;
					h.x = x;
					h.y = y;

					if(h.steps > h.segs * hairLen || (angleCut && Math.abs(h.dAngle) > angleCut + h.segs * (angleCut * unit))) {

						if(h.segs === 1) {
							h.x2 = h.x - nx;
							h.y2 = h.y - ny;
							if(h.stage & 0b100){
								h.x1 = h.x2;
								h.y1 = h.y2;
								h.stage = 1;
							}
							h.segs = 2;
							h.dAngle = 0;
						} else if(h.segs === 2) {
							h.x1 = h.x - nx;
							h.y1 = h.y - ny;
							h.dAngle = 0;
							h.segs = 3;
						}
					}


					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.size =  curves.lineWidth(t) * br + bm;
					h.hide = false;
					currentStepColorFunction(t,h);
					h.cx = h.x;
					h.cy = h.y;
                    i++;


                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },	
            longHair(x,y, step, rStep){
				const calcNextSeg = (x1, y1, x2, y2) => {
					xx = x2 - x1;
					yy = y2 - y1;
					d = (xx * xx + yy * yy) ** 0.5;
					if (d > hl) {
						xx = x1 + xx / d * hl;
						yy = y1 + yy / d * hl;
						return true;
					}
					xx = x2;
					yy = y2;		
					hl *= 0.75;
					hl = hl < 1 ? 1 : hl;
					return false;
				}
				useAlphaMin = true;
                var lw,nx,ny,d,a,i = 0,t,x,y,xx,yy,segAdd,hl;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLen =  curves.curves.brushAlpha.value * 10 ** 2;
				var hairLife =  curves.curves.brushColor.value * 100 ** 2;
				hairLife = hairLife < 1 ? 1e12 : hairLife;				
				hairLen = hairLen < 1 ? 1 : hairLen;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
					hl = hairLen;
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {

						if (h.stage === 0) {
							h.steps = hairLife * Math.random();
							h.stage = 1;
						} else {
							if (API.currentShape.reset) { API.currentShape.reset(h) }	
							h.steps = h.steps % hairLife;
						}
						h.x4 = h.x3 = h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist;
						h.y4 = h.y3 = h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist;
						h.segs = 1;
					}
					

					
					h.x4 -= nx;
					h.y4 -= ny;
					h.x3 -= nx;
					h.y3 -= ny;
					h.x2 -= nx;
					h.y2 -= ny;
					h.x1 -= nx;
					h.y1 -= ny;    					
					x = Math.cos(h.angle) * h.dist;
					y = Math.sin(h.angle) * h.dist;	
					xx = x - h.x;
					yy = y - h.y;
					const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
					h.steps += stepSpeed + speed;
					h.x = x;
					h.y = y;
					h.segs = calcNextSeg(h.x, h.y, h.x1, h.y1) && h.segs === 1 ? 2 : h.segs;
					h.x1 = xx;
					h.y1 = yy;					
					h.segs = calcNextSeg(h.x1, h.y1, h.x2, h.y2) && h.segs === 2 ? 3 : h.segs;
					h.x2 = xx;
					h.y2 = yy;
					h.segs = calcNextSeg(h.x2, h.y2, h.x3, h.y3) && h.segs === 3 ? 4 : h.segs;
					h.x3 = xx;
					h.y3 = yy;
					h.segs = calcNextSeg(h.x3, h.y3, h.x4, h.y4) && h.segs === 4 ? 5 : h.segs;
					h.x4 = xx;
					h.y4 = yy;
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.size =  curves.lineWidth(t) * br + bm;
					h.hide = false;
					currentStepColorFunction(t,h);
					h.cx = (h.x + h.x1) / 2;
					h.cy = (h.y + h.y1) / 2;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },	
            longHairOnce(x,y, step, rStep){
				const calcNextSeg = (x1, y1, x2, y2) => {
					xx = x2 - x1;
					yy = y2 - y1;
					d = (xx * xx + yy * yy) ** 0.5;
					if (d > hl) {
						xx = x1 + xx / d * hl;
						yy = y1 + yy / d * hl;
						return true;
					}
					xx = x2;
					yy = y2;		
					hl *= 0.75;
					hl = hl < 1 ? 1 : hl;
					return false;
				}
				useAlphaMin = true;
                var lw,nx,ny,d,a,i = 0,t,x,y,xx,yy,segAdd;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLen =  curves.curves.brushAlpha.value * 10 ** 2;
				var hairLife =  curves.curves.brushColor.value * 10 ** 2;
				hairLife = hairLife < 1 ? 1e12 : hairLife;				
				hairLen = hairLen < 1 ? 1 : hairLen;
				var hl;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;
				
				const hc = hairsMirror[0];  // ceneter line hair
                while(i < hairCount) {
                    const h = hairsMirror[i];
					hl = hairLen;
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {

						if (h.stage === 0) {
							h.steps = 0;
							h.stage = 1;
							if (i === 0) { h.dist = 0 }
								
						} else {
							h.hide = true;
							i++;
							continue;
						}
						const s = curves.lineWidth(0);						
						h.x4 = h.x3 = h.x2 = h.x1 = h.x = Math.cos(h.angle) * h.dist * s;
						h.y4 = h.y3 = h.y2 = h.y1 = h.y = Math.sin(h.angle) * h.dist * s;
						h.segs = 1;
					}
					

					
					h.x4 -= nx;
					h.y4 -= ny;
					h.x3 -= nx;
					h.y3 -= ny;
					h.x2 -= nx;
					h.y2 -= ny;
					h.x1 -= nx;
					h.y1 -= ny;    		
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					const s = curves.lineWidth(t)
					x = Math.cos(h.angle) * h.dist * s;
					y = Math.sin(h.angle) * h.dist * s;	
					xx = x - h.x;
					yy = y - h.y;
					const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
					h.steps += i === 0 ? 0 : stepSpeed + speed;
					h.x = x;
					h.y = y;
					h.segs = calcNextSeg(h.x, h.y, h.x1, h.y1) && h.segs === 1 ? 2 : h.segs;
					h.x1 = xx;
					h.y1 = yy;					
					h.segs = calcNextSeg(h.x1, h.y1, h.x2, h.y2) && h.segs === 2 ? 3 : h.segs;
					h.x2 = xx;
					h.y2 = yy;
					h.segs = calcNextSeg(h.x2, h.y2, h.x3, h.y3) && h.segs === 3 ? 4 : h.segs;
					h.x3 = xx;
					h.y3 = yy;
					h.segs = calcNextSeg(h.x3, h.y3, h.x4, h.y4) && h.segs === 4 ? 5 : h.segs;
					h.x4 = xx;
					h.y4 = yy;
					/*if(i > 0) {
						h.x1 += (hc.x1 - h.x1) / 100;
						h.y1 += (hc.y1 - h.y1) / 100;
						h.x2 += (hc.x2 - h.x2) / 50;
						h.y2 += (hc.y2 - h.y2) / 50;
						h.x3 += (hc.x3 - h.x3) / 20;
						h.y3 += (hc.y3 - h.y3) / 20;
						h.x4 += (hc.x4 - h.x4) / 10;
						h.y4 += (hc.y4 - h.y4) / 10;					
					}*/

					h.size =  curves.lineWidth(t) * br + bm;
					//h.hide = i === 0 ? true : false;
					
					currentStepColorFunction(t,h);
					h.cx = (h.x + h.x1) / 2;
					h.cy = (h.y + h.y1) / 2;

                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },						
            speedBrush(x, y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.superPowers[0];
				var sSen = curves.curves.brushColor.superPowers[1] ;
				sSen = sSen < 1 ? 1 : sSen;
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;
				const bg = bShadowGlobal;
				if(bg.frameCount === 0) {
					bg.speed = mouseBrush.speed;
					bg.c1 = bg.r1 = bg.v1 = 0;
					bg.val2 = 0;
				}
				bg.direction += directionChange;
				bg.frameCount ++;
				bg.v1 = (bg.speed  + ((mouseBrush.speed - bg.speed) * step * 0.5)) / sSen;
				bg.v1 = bg.v1 > 1 ? 1 : bg.v1;
				bg.c1 += (bg.v1 - bg.r1) * 0.6;
				bg.c1 *=  0.4;
				bg.r1 += bg.c1;

				var bSize =  1 - curves.brushAlpha(bg.r1) ;
				bg.speed += (mouseBrush.speed - bg.speed) * step;
                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {

						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if (API.curveStep && h.steps < 0) { h.hide = true }
							h.stage = 0b11;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { API.currentShape.reset(h) }								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b011;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage != 0b100;
							}
							h.stage != 0b11;
						}
					}
					if(h.stage & 0b10) {
						h.x2 = (h.x1 = (h.x = Math.cos(h.angle) * h.dist * bSize) - nx) - nx;
						h.y2 = (h.y1 = (h.y = Math.sin(h.angle) * h.dist * bSize) - ny) - ny;	
						h.stage -= 0b10;		
						h.steps += speed;		
						h.segs = 1;						
					} else {
						h.x2 = h.x1; 						
						h.y2 = h.y1; 							
						h.y1 = h.y; 						
						h.x1 = h.x;    					
						x = Math.cos(h.angle) * h.dist * bSize;
						y = Math.sin(h.angle) * h.dist * bSize;	
						xx = x - h.x1;
						yy = y - h.y1;
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + speed;
						h.x = x;
						h.y = y;
						h.segs = 2;
					}
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {
						h.size =  curves.lineWidth(t) * br * bSize + bm;
						h.size = h.size < 0.5 ? 0.5 : h.size;
						currentStepColorFunction(t,h);
					}
					h.cx = h.x;
					h.cy = h.y;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
            stringBrush(x, y, dStep, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,d;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * dStep;
				const speed = (nx * nx + ny * ny) ** 0.5;

				var hairLife = (curves.curves.brushColor.value * 100) ** 2;
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;
				const bg = bShadowGlobal;
				if(bg.frameCount === 0) {
					bg.speed = mouseBrush.speed;
					bg.c1 = bg.r1 = bg.v1 = 0;
					bg.val2 = 0;
				}
				bg.direction += directionChange;
				bg.frameCount ++;

				const stringSize = (curves.curves.brushAlpha.superPowers[1] / 10 | 0) + 2;
				const hairLen = curves.curves.brushAlpha.superPowers[0] / 10;
				API.step.stringBrush.stringSize = stringSize;

				const hf = hairsMirror[0];
                while(i < hairCount) {
                    const h = hairsMirror[i];
					
					const stringId = i % stringSize;
					const u = 1 - stringId / (stringSize - 1);
					if(stringId === 0){
						h.angle += directionChange;
						h.dir += directionChange;
						if (h.steps >= hairLife || h.stage ===  0) {

							if (h.stage === 0) {
								h.steps = 0;
								h.stage = 0b11;
								h.a *= u;
								h.a1 *= u;
								h.fade *= u;

								if (API.curveStep && h.steps < 0) { 
									h.hide = true 
									h.stage != 0b100;
								}
							} else {
								if(!API.curveStep || (API.curveStep && h.hide)) {
									if (API.currentShape.reset) { API.currentShape.reset(h) }								
									h.steps = h.steps % hairLife;
									h.hide = false;
									h.stage = 0b011;
								} else {
									h.hide = true;
									h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
									h.stage != 0b111;
								}
								h.stage != 0b11;
							}

						}
						if(h.stage & 0b10) {
							h.steps += speed;		
							const s= curves.lineWidth(hf.steps / hairLife)
							h.x1 = h.x = Math.cos(h.angle) * h.dist * s;
							h.y1 = h.y = Math.sin(h.angle) * h.dist * s;	
							for(let j = 1; j < stringSize; j ++){
								const hh = hairsMirror[i + j];
								hh.x1 = hh.x = h.x;
								hh.y1 = hh.y = h.y;
								hh.segs = 1;	
								hh.hide = true;
								hh.stage = API.RELOAD_COLOR;
								
							}

							h.stage &= 0b101;		
							h.segs = 1;						
						} else {
							
							h.x1 -= nx;    					
							h.y1 -= ny; 		
							const s = curves.lineWidth(hf.steps / hairLife);						
							x = Math.cos(h.angle) * h.dist * s;
							y = Math.sin(h.angle) * h.dist * s;	
							xx = x - (h.x - nx);
							yy = y - (h.y - ny);
							const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
							h.steps += stepSpeed + speed;
							h.x = x;
							h.y = y;
							xx = h.x1 - h.x;
							yy = h.y1 - h.y;
							d = (xx * xx + yy * yy) ** 0.5;
							if (d > hairLen) {
								h.x1 = h.x + xx / d * hairLen;
								h.y1 = h.y + yy / d * hairLen;
							}
	
						}
						var t = h.steps /  hairLife;
						t = t > 1 ? 1 : t < 0 ? 0 : t;
						h.hide = h.stage & 0b100 ? true : false;
					} else {
						const hr = hairsMirror[i - 1];
						const u = 1 - (stringId - 1) / (stringSize - 2);
						
						h.steps = hr.steps;
						h.x1 -= nx;
						h.y1 -= ny;
						h.x = hr.x1;
						h.y = hr.y1;
						xx = h.x1 - h.x;
						yy = h.y1 - h.y;
						d = (xx * xx + yy * yy) ** 0.5;
						if (d > hairLen * u) {
							h.x1 = h.x + xx / d * hairLen * u;
							h.y1 = h.y + yy / d * hairLen * u;
							h.hide = hr.hide;
						}						
						
						var t = h.steps /  hairLife;
						t = t > 1 ? 1 : t < 0 ? 0 : t;
					}
					if (!h.hide) {
						h.size =  curves.lineWidth(t) * u * br + bm;
						h.size = h.size < 0.5 ? 0.5 : h.size;
						currentStepColorFunction(t * u,h);
					}
					h.cx = h.x;
					h.cy = h.y;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
            stringBrushRandom(x, y, dStep, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,d;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * dStep;
				const speed = (nx * nx + ny * ny) ** 0.5;

				var hairLife = curves.curves.brushColor.superPowers[0] ** 2;
				var randomSize = curves.curves.brushColor.superPowers[1] / 10;;
				hairLife = hairLife < 1 ? 1e12 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;
				const bg = bShadowGlobal;
				if(bg.frameCount === 0) {
					bg.speed = mouseBrush.speed;
					bg.c1 = bg.r1 = bg.v1 = 0;
					bg.val2 = 0;
				}
				bg.direction += directionChange;
				bg.frameCount ++;

				const stringSize = (curves.curves.brushAlpha.superPowers[1] / 10 | 0) + 2;
				const hairLen = curves.curves.brushAlpha.superPowers[0] / 10;
				API.step.stringBrushRandom.stringSize = stringSize;

				const hf = hairsMirror[0];
                while(i < hairCount) {
                    const h = hairsMirror[i];
					
					const stringId = i % stringSize;
					if(stringId === 0){
						h.angle += directionChange;
						h.dir += directionChange;
						if (h.steps >= hairLife || h.stage ===  0) {

							if (h.stage === 0) {
								h.steps = 0;
								h.stage = 0b11;
								if (API.curveStep && h.steps < 0) { 
									h.hide = true 
									h.stage != 0b100;
								}
							} else {
								if(!API.curveStep || (API.curveStep && h.hide)) {
									if (API.currentShape.reset) { API.currentShape.reset(h) }								
									h.steps = h.steps % hairLife;
									h.hide = false;
									h.stage = 0b011;
								} else {
									h.hide = true;
									h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
									h.stage != 0b111;
								}
								h.stage != 0b11;
							}

						}
						if(h.stage & 0b10) {
							h.steps += speed;		
							const s= curves.lineWidth(hf.steps / hairLife)
							h.x1 = h.x = Math.cos(h.angle) * h.dist * s;
							h.y1 = h.y = Math.sin(h.angle) * h.dist * s;	
							for(let j = 1; j < stringSize; j ++){
								const hh = hairsMirror[i + j];
								hh.x1 = hh.x = h.x;
								hh.y1 = hh.y = h.y;
								hh.segs = 1;	
								hh.hide = true;
								hh.stage = API.RELOAD_COLOR;
								
							}

							h.stage &= 0b101;		
							h.segs = 1;						
						} else {
							
							h.x1 -= nx;    					
							h.y1 -= ny; 		
							const s = curves.lineWidth(hf.steps / hairLife);						
							x = Math.cos(h.angle) * h.dist * s;
							y = Math.sin(h.angle) * h.dist * s;	
							xx = x - (h.x - nx);
							yy = y - (h.y - ny);
							const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
							h.steps += stepSpeed + speed;
							h.x = x;
							h.y = y;
							xx = h.x1 - h.x + Math.randPn(randomSize);
							yy = h.y1 - h.y + Math.randPn(randomSize);
							d = (xx * xx + yy * yy) ** 0.5;
							if (d > hairLen) {
								h.x1 = h.x + xx / d * hairLen;
								h.y1 = h.y + yy / d * hairLen;
							}
	
						}
						var t = h.steps /  hairLife;
						t = t > 1 ? 1 : t < 0 ? 0 : t;
						h.hide = h.stage & 0b100 ? true : false;
					} else {
						const hr = hairsMirror[i - 1];						
						h.steps = hr.steps;
						h.x1 -= nx + Math.randPn(randomSize);
						h.y1 -= ny + Math.randPn(randomSize);
						h.x = hr.x1;
						h.y = hr.y1;
						xx = h.x1 - h.x;
						yy = h.y1 - h.y;
						d = (xx * xx + yy * yy) ** 0.5;
						if (d > hairLen) {
							h.x1 = h.x + xx / d * hairLen;
							h.y1 = h.y + yy / d * hairLen;
							h.hide = hr.hide;
						}						
						
						var t = (h.steps /  hairLife) * (stringId / stringSize);
						t = t > 1 ? 1 : t < 0 ? 0 : t;
					}
					if (!h.hide) {
						h.size =  curves.lineWidth(t) * br + bm;
						h.size = h.size < 0.5 ? 0.5 : h.size;
						currentStepColorFunction(t,h);
					}
 					h.cx = (h.x + h.x1) / 2;
					h.cy = (h.y + h.y1) / 2;
                   i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
            pointSlip(x, y, step, rStep){
				useAlphaMin = true;
                var lw,len,nx,ny,i = 0,sp,t,x,y,xx,yy,idx,iv,ivxl,ivxr,ivyu,ivyd,px,py;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
				const speed = (nx * nx + ny * ny) ** 0.5;
				const iStep = step > 0 ? 1 / step : 0;
                len = Math.sqrt(hairs.dx * hairs.dx + hairs.dy * hairs.dy);
                const dirc = Math.atan2(hairs.dy, hairs.dx)
                const directionChange = hairs.dd * step; // direction change
                var flowSpeed = (curves.curves.brushColor.value - 0.5) * 28;
                var drag = curves.curves.brushAlpha.superPowers[0] / 99;

				var hairLife =  curves.curves.brushAlpha.superPowers[1] ** 2;
				hairLife = hairLife < 1 ? 1 : hairLife;				
				const iW = API.imgColors.w - 1;
				const iH = API.imgColors.h - 1;
				const imgW = API.imgColors.w;
				const imgW4 = API.imgColors.w << 2;
				const dat = API.imgColors.dat;
				const icActive = API.imgColors.active;
				const haveImgPos = API.imgColors.xo !== null;
				const cx = API.imgColors.cx;
				const cy = API.imgColors.cy;
				const bg = bShadowGlobal;
				bg.direction += directionChange;
				//const fx = Math.cos(bg.direction);
				//const fy = Math.sin(bg.direction);
				const fIdx = imgW4;//(Math.round(fx) + Math.round(fy) * imgW) * 4;
				const rIdx = 4;//(Math.round(-fy) + Math.round(fx) * imgW) * 4;
				
                

                var bm = paint.brushMin/2;
                 var br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.x3 = 1;
							h.stage = 0b11;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { API.currentShape.reset(h) }
								h.steps = 0;
								h.hide = false;
								h.stage &= 0b11;
								h.x3 = 1;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}							

							h.stage |= 0b11;
						}

						h.x2 = 0;
						h.y2 = 0;
					}
					h.hide = h.stage & 0b100 ? true : false;
					if (icActive && !h.hide) {
						if (haveImgPos) {
                            h.icx = (h.cx + cx | 0) ;
                            h.icy = (h.cy + cy | 0);						
						}
						const pixD = h.x3;
						if(h.icx >= pixD && h.icx < iW - pixD && h.icy >= pixD && h.icy < iH - pixD) {
							idx = ((h.icx + h.icy * imgW) << 2);
							if (dat[idx+3] > 0) {
								iv = (dat[idx] + dat[idx + 1] + dat[idx + 2])/3;
								ivxr = ivxl = ivyu = ivyd = 0;
								var idxA = idx - fIdx * pixD;
								if (dat[idxA + 3] > 0) { ivyu = (dat[idxA] + dat[idxA + 1] + dat[idxA + 2]) / 3 }
								idxA = idx + fIdx * pixD;
								if (dat[idxA + 3] > 0) { ivyd = (dat[idxA] + dat[idxA + 1] + dat[idxA + 2]) / 3 }
								idxA = idx - rIdx * pixD;
								if (dat[idxA + 3] > 0) { ivxl = (dat[idxA] + dat[idxA + 1] + dat[idxA + 2]) / 3 }
								idxA = idx + rIdx * pixD;
								if (dat[idxA + 3] > 0) { ivxr = (dat[idxA] + dat[idxA + 1] + dat[idxA + 2]) / 3 }								
								px = (ivxl - iv) + (iv - ivxr);
								py = (ivyu - iv) + (iv - ivyd);
								var dist = (px * px + py * py) ** 0.5;
								if (dist > 0) {
									px /=  dist * iStep;
									py /=  dist * iStep;
									dist /= 360;
									h.x2 +=  px * flowSpeed * dist;
									h.y2 +=  py * flowSpeed * dist;		
									dist = dist < 0 ? 0 : dist > 1 ? 1 : dist;
									h.steps += (1 - dist) * 10;
									dist = (h.x2 * h.x2 + h.y2 + h.y2) ** 0.5 | 0;
									h.x3 = h.x3 < dist ? h.x3 + 1 : h.x3;
									//h.x2 +=  (px * fx - py * fy) * flowSpeed * (dist / 360);
									//h.y2 +=  (px * fy + py * fx) * flowSpeed * (dist / 360);		
								} else {
									h.x3 += 1;
									h.steps += (hairLife / 16) * h.x3;
								}
							}
						}else{
							h.steps += hairLife;
						}
					}
					if(h.stage & 0b10) {
						h.x1 = (h.x = Math.cos(h.angle) * h.dist) - nx;
						h.y1 = (h.y = Math.sin(h.angle) * h.dist) - ny;	
						h.stage -= 0b10;		
						h.steps += speed;						
					} else {
						h.y1 = h.y - nx; 						
						h.x1 = h.x - ny;    					
						//x = Math.cos(h.angle) * h.dist + h.x2 - nx;
						//y = Math.sin(h.angle) * h.dist + h.y2 - ny;	
						x = h.x - nx;
						y = h.y - ny;	
						x += h.x2;
						y += h.y2;	
						xx = x - h.x;
						yy = y - h.y;
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed * Math.random();
						h.x = x;
						h.y = y;
					}
					var t = h.steps /  hairLife;
					t = t > 1 ? 1 : t < 0 ? 0 : t;
					
					h.x2 *= drag;
					h.y2 *= drag;
					h.segs = 1;
					
					if(!h.hide) {
						h.size =  (curves.lineWidth(t) * br + bm)/2;
						currentStepColorFunction(t,h);
					}
					h.cx = h.x;
					h.cy = h.y;
                    i++;
                }
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },	
            jumper(x,y, step, rStep){
				useAlphaMin = true;
                var lw,nx,ny,dd,i = 0,t,x,y,xx,yy,t;
                nx = hairs.dx * rStep;
                ny = hairs.dy * rStep;
                const directionChange = hairs.dd * step;
				const speed = (nx * nx + ny * ny) ** 0.5;
				var hairLife =  curves.curves.brushColor.value * 100;
				var posSwap =  (curves.curves.brushAlpha.superPowers[0] / 100) / (hairCount + 1)
				var swapStay =  curves.curves.brushAlpha.superPowers[1] ** 1.5;				
				hairLife = hairLife < 1 ? 1e16 : hairLife;
                const bm = paint.brushMin/2;
                const br = (paint.brushMax - paint.brushMin)/2;

                while(i < hairCount) {
                    const h = hairsMirror[i];
                    h.angle += directionChange;
                    h.dir += directionChange;
					if (h.steps >= hairLife || h.stage ===  0) {
						if (h.stage === 0) {
							h.steps = Math.random() * hairLife - API.curveStep * Math.random();
							if(API.curveStep && h.steps < 0) {
								h.hide = true;
							}
							h.stage = 1;
						} else {
							if(!API.curveStep || (API.curveStep && h.hide)) {
								if (API.currentShape.reset) { 
									API.currentShape.reset(h);
								}								
								h.steps = h.steps % hairLife;
								h.hide = false;
								h.stage &= 0b11;
								h.stage |= API.RELOAD_COLOR;
							} else {
								h.hide = true;
								h.steps = hairLife - API.curveStep / 2 - API.curveStep * Math.random();
								h.stage |= 0b100;
							}	

							h.stage |= 0b11;
						}
						h.x3 = 0;
						h.y3 = -2;
					}

					if(h.stage & 0b10) {
						h.x1 = (h.x = Math.cos(h.angle) * h.dist) - nx;
						h.y1 = (h.y = Math.sin(h.angle) * h.dist) - ny;	
						h.stage -= 0b10;		
						h.steps = speed;	
						t = h.steps /  hairLife;						
					} else {
						h.x1 = h.x - nx;
						h.y1 = h.y - ny;	

						x = Math.cos(h.angle) * h.dist;
						y = Math.sin(h.angle) * h.dist;	
						xx = x - (h.x - nx);
						yy = y - (h.y - ny);
						const stepSpeed = (xx * xx + yy * yy) ** 0.5;					
						h.steps += stepSpeed + 0.1;
						h.x = x;
						h.y = y;
						t = h.steps /  hairLife;
						if(h.x3 > 0) {
							h.x3 -= stepSpeed;
							h.hide = false;
							h.stage |= 0b1000;
						} else {
							
							h.stage &= 0b11110111;
							if (h.y3 === -2) {h.hide = true;}
							if (h.y3 === -1) { h.y3 = -2 }
						}						
					}

					t = t > 1 ? 1 : t < 0 ? 0 : t;
					h.segs = 1;
					//h.hide = h.stage & 0b100 ? true : false;
					if (!h.hide) {					
						h.size =  curves.lineWidth(t) * br + bm;
						currentStepColorFunction(t,h);
					}
					h.cx = (h.x1 + h.x) / 2;
					h.cy = (h.y1 + h.y) / 2;
                    i++;
                }
				i = 0;
                while(i < hairCount) {
					const h = hairsMirror[i];
					if(!(h.stage & 0b1000)) {
						if(h.y3 > -1) {
							const idx = h.y3;
							const h2 = hairsMirror[idx];
							h.y3 = -1;
							h2.y3 = -1;

							const angle = h.angle;
							const dist = h.dist;
							const dir = h.dir;
							const fade = h.fade;
							h.angle = h2.angle;
							h.dist = h2.dist;
							h.dir = h2.dir;
							h.fade = h2.fade;
							h2.angle = angle;
							h2.dist = dist;
							h2.dir = dir;
							h2.fade = fade;
						}else if(h.y3 === -2 && Math.random() < posSwap) {
							//const idx = i + (Math.random() < 0.5 ? -1 : 1);
							const idx = (Math.random() * hairCount  | 0);
							if (idx >= 0 && idx < hairCount) {
								const h2 = hairsMirror[idx];
								if(h2 !== h && !(h.stage & 0b1000)) {
									//h2.steps = hairLife;
									h.stage |= 0b1000;
									h2.stage |= 0b1000;
									const angle = h.angle;
									const dist = h.dist;
									const dir = h.dir;
									const fade = h.fade;
									h.angle = h2.angle;
									h.dist = h2.dist;
									h.dir = h2.dir;
									h.fade = h2.fade;
									h2.angle = angle;
									h2.dist = dist;
									h2.dir = dir;
									h2.fade = fade;
									h2.x3 = h.x3 = Math.random() * swapStay + 1;
									h.y3 = idx;
									h2.y3 = i;
									h.hide = h2.hide = false;
								}
							}
						}
						
					}	
					i++;
				}					
                hairsMirror.xo = 0;
                hairsMirror.yo = 0;
            },				
			
		},			

        move : {
            basic(x,y,dirChange){
                var dx = x - oldMx;
                var dy = y - oldMy;
                oldMx = x;
                oldMy = y;
                hairs.dx = dx;
                hairs.dy = dy;
               // dirChange = dirChange < -0.1 ? -0.1 : dirChange > 0.1 ? 0.1 : dirChange;
                hairs.dd = dirChange;
                hairs.xo = hairsMirror.xo;
                hairs.yo = hairsMirror.yo;
            }
        },
        draw(){
            shadow();
            hairsMirror.size = hairCount;
            hairsMirror.dx = hairs.dx;
            hairsMirror.dy = hairs.dy;
            hairsMirror.dd = hairs.dirChange;

            return hairsMirror;
        },
        update() {
            fromShadow();
        },
        setupLoad(name){
            API.currentLoad = API.load[name];
        },
        setupShape(name){
             API.currentShape = API.shape[name];
        },
        setupStep(name){
            API.currentStep = API.step[name];
			if(name === "pointSlip") {
				
				API.imgColors.use = true;
			} else {
				
				API.imgColors.use = false;
				API.imgColors.dat = undefined;
			}
        },
        setup(move,shape,load){
			useAlphaMin = false;
            API.currentMove = API.move[move];
            API.currentStep = API.step[move];
            API.currentShape = API.shape[shape];
            API.currentLoad = API.load[load];
			
        },
        setStepColorFunction(name){
            if(API.stepColor[name]){
                currentStepColorFunction = API.stepColor[name];
            }
        },
        updateColors(penColorRange){
            colorRangePens = penColorRange;
            colorRangeO.init(colours.mainColor,colours.secondColor);
            colorRangeO.rgba1.captureHSL();
            colorRangeO.rgba2.captureHSL();
        },
        currentMove : null,
        currentShape : null,
        currentLoad : null,
    };
    API.options = {
        stepTypes : [...Object.keys(API.step)],
        shapeTypes : [...Object.keys(API.shape)],
        colorTypes : [...Object.keys(API.stepColor)],
    }
    currentStepColorFunction = API.stepColor.blend;
    API.setup("basic","basic","basic");
	API.step.basic.canInterpolate = true;
	API.step.basic2.canInterpolate = true;
	API.step.mover.canInterpolate = true;
	API.step.pointSlip.canInterpolate = true;
	API.step.speedBrush.canInterpolate = true;
	API.step.sketcher.arcType = 1;
	API.step.sketcherRandom.arcType = 1;
	
	API.step.stringBrush.shapeCount = () => (curves.curves.brushAlpha.superPowers[1] / 10 | 0) + 2;
	API.step.stringBrush.arcType = 2; // string
	API.step.stringBrush.canInterpolate = true;
	
	API.step.stringBrushRandom.arcType = 2; // string
	API.step.stringBrush.shapeCount = () => (curves.curves.brushAlpha.superPowers[1] / 10 | 0) + 2;
	API.step.stringBrushRandom.canInterpolate = true;
	
	API.shape.basic.reset= function(h) {
		h.angle = Math.random() * Math.PI2;
        const dist = curves.spraySpread(Math.random());
        h.distNorm = dist;
        h.dist = (dist * 0.995 + 0.005) * _spread;
        h.size = curves.spraySize(1-dist) * _sizeRange + _sizeMin;
        h.fade = curves.sprayAlpha(1-dist) ;
        h.cx = h.x = Math.cos(h.angle) * h.dist;
        h.cy = h.y = Math.sin(h.angle) * h.dist;  	
	}		
	API.shape.thin.reset = function(h) {
		const dist = curves.spraySpread(Math.random());				
		var y = (dist * 0.95 + 0.05) * _spread * (Math.random() < 0.5 ? -1 : 1);
		var x = Math.random() * _spread * 0.1 * (Math.random() < 0.5 ? -1 : 1);
		h.angle = Math.atan2(y,x) + h.dir;
        h.distNorm = dist;
        h.dist = (dist * 0.995 + 0.005) * _spread;
        h.size = curves.spraySize(1-dist) * _sizeRange + _sizeMin;
        h.fade = curves.sprayAlpha(1-dist) ;
        h.cx = h.x = Math.cos(h.angle) * h.dist;
        h.cy = h.y = Math.sin(h.angle) * h.dist; 	
        h.dist = Math.sqrt(x * x + y * y);
    }	
	API.shape.traling.reset = function(h) {
		const dist = curves.spraySpread(Math.random());				
        var x = dist * _spread * -1;
        var y = Math.random() * _spread * 0.3 * Math.sign(Math.random()-0.5);
		h.angle = Math.atan2(y,x) + h.dir;
        h.distNorm = dist;
        h.dist = (dist * 0.995 + 0.005) * _spread;
        h.size = curves.spraySize(1-dist) * _sizeRange + _sizeMin;
        h.fade = curves.sprayAlpha(1-dist) ;
        h.cx = h.x = Math.cos(h.angle) * h.dist;
        h.cy = h.y = Math.sin(h.angle) * h.dist; 	
        h.dist = Math.sqrt(x * x + y * y);	
	}
    return API;
})();