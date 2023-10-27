"use strict";
const curves = (()=>{
    var backgroundColor = "black";
    var lineColorMix = "#FFF";
    var lineColor = "#0F0";
    var lineColorA = "#0F0";
    var lineColorB = "#0F0";
    var secondEdit;
    var context = null;
    var curveRealtimeFrameCounter = 0;

    var on = false;
    function display(ctx,curve,lineColor){
        if(on && ctx){
            var w = ctx.canvas.width;
            var h = ctx.canvas.height
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0,0,w,h);
            ctx.strokeStyle = lineColor;
            ctx.beginPath();
            h -= 2;
            for(var x = 0; x < w; x ++){
                var i = (x) / (w-1);
                var y = h - curve(i,API.a,API.b,API.c) * h + 1;
                ctx.lineTo(x,y);
            }
            ctx.stroke();
        }
    }
    function displayMix(ctx,...curves){
        if(on && ctx){
            var curveFirst = curves[2];
            var curveSecond = curves[0];
            var curveLast = curves[1];
            var colFirst = lineColorB;
            var colLast = lineColorA;
            if (secondEdit){
                curveFirst = curves[1];
                curveLast = curves[2];
                colFirst = lineColorA;
                colLast = lineColorB;        
            }                
            
            var w = ctx.canvas.width;
            var h = ctx.canvas.height
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0,0,w,h);
            h -= 2;
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = colFirst;
            ctx.beginPath();
            for(var x = 0; x < w; x ++){
                var i = (x) / (w-1);
                var y = h - curveFirst(i) * h + 1;
                ctx.lineTo(x,y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = lineColorMix;
            ctx.beginPath();
            for(var x = 0; x < w; x ++){
                var i = (x) / (w-1);
                var y = h - curveSecond(i) * h + 1;
                ctx.lineTo(x,y);
            }
            ctx.stroke();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = colLast;
            ctx.beginPath();
            for(var x = 0; x < w; x ++){
                var i = (x) / (w-1);
                var y = h - curveLast(i) * h + 1;
                ctx.lineTo(x,y);
            }
            ctx.stroke();
            ctx.globalAlpha = 0.5;
        }
    }    

    const API = {
        curveTypes : "flat,ease,ease2,sigmoid,easeBell,random,randRamp,wave".split(","),
        curveMixTypes : "none,mult,add,sub,addClamp,subClamp,pow,pow2,pipe,max,min".split(","),
        curveMixTypesNamed : "Off|A*B|(A+B)/2|(A-B)/2+0.5|min(1,A+B)|max(0,A+B)|A^B|A^(B+1)^2|A(B)|max(A,B)|min(A,B)".split("|"),
        createCurve(named){
            var currentCurveSet;
            var namedSecond;
            var namedFirst;
            var curveA,curveB
            var mixing = false;
            var mixTypeName = "none";
            var editSecond = false;
            var a = 2;
            var aa = 2;
            var u = 0.5; // unit power 0 - 1
            var u2 = 1; // doubed unit 0 - 2
            var power = 50;
			var superPower = 0; // index of super power

            var repeats = 1;
            const curve = {
                value : 0.5,
				superPowers:  [50,50,50,50,50,50,50,50],  // not directly used in this API.
                set repeats(v) { 
                    if(editSecond){ namedSecond.repeats = v }
                    else{ repeats = v / 2 }
                },
                get baseRepeats() { return repeats * 2 },
                get repeats() { return editSecond ? namedSecond.repeats : repeats * 2 },
				get color() {  return curve.isSecond ? lineColorB : lineColorA },				
				get superIdx() { return superPower },
				set superIdx(idx) {
					superPower = idx % curve.superPowers.length;
					curve.power = curve.superPowers[superPower];
                    lineColor = curve.state[curve.name].colors[superPower % curve.state[curve.name].colors.length];
                    if(curve.isSecond) { lineColorB = lineColor } else { lineColorA = lineColor }					
				},
                set power(v){
                    if(editSecond){ namedSecond.power = v }
                    else {
                        u = this.value = v / 100;
                        u = u < 0 ? 0 : u > 1 ? 1 : u;
                        u2 = u * 2;
                        
                        curve.superPowers[superPower] = power = a = v;
                        if (a < 50){ aa = a / 50 }
                        else { aa = (50 + (a - 50) ** 2.4)/ 50 }
                        if (a < 50){ a /= 50 }
                        else { a = (50 + (a - 50) ** 2)/ 50 }                   
                    }
                },
                get basePower() { return power },
                get power() { return editSecond ? namedSecond.power : power },
                mix : {
                    mult(v) { return curveA(v) * curveB(v) },
                    add(v) { return (curveA(v) + curveB(v)) / 2 },
                    sub(v) {  return (curveA(v) - curveB(v)) / 2 + 0.5 },
                    addClamp(v) { var a = curveA(v) + curveB(v); return a > 1 ? 1 : a },
                    subClamp(v) { var a = curveA(v) - curveB(v); return a < 0 ? 0 : a },
                    pow(v) { return curveA(v) ** curveB(v) },
                    pow2(v) { return curveA(v) ** ((curveB(v) + 1) ** 2) },
                    pipe(v) { return curveA(curveB(v)) },
                    max(v) { var a = curveA(v), b = curveB(v); return a > b ? a : b },
                    min(v) { var a = curveA(v), b = curveB(v); return a < b ? a : b },
                },
                cycle : {
                    ease(v) { v = Math.abs((v%1) * 2-1); return (((v % 1) + 1) % 1) **  aa },
                    ease2(v) {   v = Math.abs((v%1) * 2-1); v = 1-(((v % 1) + 1) % 1);  return ((1 - (v * v)) ** 0.5) ** a },
                    sigmoid(v) {
                        var vv; 
                        v = Math.abs((v%1) * 2-1); 
                        return (vv = (v ** a)) / (vv + ((1 - v) ** a)); 
                    },                    
                    easeBell(v) {  v = Math.abs((v%1) * 2-1); v = ((v % 1) + 1) % 1; return Math.sin(v * Math.PI) ** a },
                    random() { var v = ((Math.random() - 0.5) * a) + 0.5; return v < 0 ? 0 : v > 1 ? 1 : v },
                    randRamp(v) { 
                        const a1 = Math.abs(Math.sin(v *2* Math.PI)) ** a;
                        v = Math.abs((v%1) * 2-1);
                        v = (((v % 1) + 1) % 1) + ( Math.random() - 0.5 ) * a1; 
                        return v < 0 ? 0 : v > 1 ? 1 : v  
                     },
                    flat(v) {
                        v = Math.abs((v%1) * 2-1);
                        if (a < 1) { v = ((v - 0.5) * a) + (1.5 - a) }
                        else { v += 0.5 - 0.5 / a; v = ((v - 0.5) * a) + 0.5 }
                        return v < 0 ? 0 : v > 1 ? 1 : v
                    },
                    wave(v) { return Math.sin((Math.abs(v%1) * 27.6) * a) ** 8;}
                },                
                cycleInv : {
                    ease(v) { v = Math.abs((v%1) * 2-1); return 1-((((v % 1) + 1) % 1) **  aa) },
                    ease2(v) {   v = Math.abs((v%1) * 2-1); v = 1-(((v % 1) + 1) % 1);  return 1-(((1 - (v * v)) ** 0.5) ** a) },
                    sigmoid(v) {
                        var vv; 
                        v = Math.abs((v%1) * 2-1); 
                        return 1-(vv = (v ** a)) / (vv + ((1 - v) ** a)); 
                    },                    
                    easeBell(v) {  v = Math.abs((v%1) * 2-1); v = ((v % 1) + 1) % 1; return 1-(Math.sin(v * Math.PI) ** a) },
                    random() { var v = ((Math.random() - 0.5) * a) + 0.5; return 1-(v < 0 ? 0 : v > 1 ? 1 : v) },
                    randRamp(v) { 
                        const a1 = Math.abs(Math.sin(v *2* Math.PI)) ** a;
                        v = Math.abs((v%1) * 2-1);
                        v = (((v % 1) + 1) % 1) + ( Math.random() - 0.5 ) * a1; 
                        return 1-(v < 0 ? 0 : v > 1 ? 1 : v ); 
                     },
                    flat(v) {
                        v = Math.abs((v%1) * 2-1);
                        if (a < 1) { v = ((v - 0.5) * a) + (1.5 - a) }
                        else { v += 0.5 - 0.5 / a; v = ((v - 0.5) * a) + 0.5 }
                        return 1-(v < 0 ? 0 : v > 1 ? 1 : v);
                    },
                    wave(v) { return 1 - (Math.sin((Math.abs(v%1) * 27.6) * a) ** 8) }
                },
                norm : {
                    ease(v) { return (v < 0 ? 0 : v > 1 ? 1 : v) **  aa },
                    ease2(v) {   v = (v < 0 ? 1 : v > 1 ? 0 : 1-v);  return ((1 - (v * v)) ** 0.5) ** a },
                    sigmoid(v) {
                        var vv; 
                        if(v <= 0){ return 0 } 
                        if(v >= 1){ return 1 } 
                        return (vv = (v ** a)) / (vv + ((1 - v) ** a)); 
                    },
                    easeBell(v) {  v = (v < 0 ? 0 : v > 1 ? 1 : v); return Math.sin(v * Math.PI) ** a },
                    random() { var v = ((Math.random() - 0.5) * a) + 0.5; return v < 0 ? 0 : v > 1 ? 1 : v },
                    randRamp(v) { 
                        const a1 = Math.sin(v * Math.PI) ** a;
                        v = (v < 0 ? 0 : v > 1 ? 1 : v) + ( Math.random() - 0.5 ) * a1; 
                        return v < 0 ? 0 : v > 1 ? 1 : v;
                     },
                    flat(v) {
                        v = (v < 0 ? 0 : v > 1 ? 1 : v);
                        v = u2 < 1 ? v * (1 - u2) + u2 : 2-u2; 
                        return v < 0 ? 0 : v > 1 ? 1 : v
                    },
                    wave(v) { 
                        v = v < 0 ? 0 : v > 1 ? 1 : v;
                        return v > u ? 1 : 0;
                    },
                },
                normRep : {
                    ease(v) { v = Math.abs(((v * repeats)%1) * 2-1); return (((v % 1) + 1) % 1) **  aa },
                    ease2(v) {   v = Math.abs(((v * repeats)%1) * 2-1); v = 1-(((v % 1) + 1) % 1);  return ((1 - (v * v)) ** 0.5) ** a },
                    sigmoid(v) {
                        var vv; 
                        v = Math.abs(((v * repeats)%1) * 2-1) 
                        return (vv = (v ** a)) / (vv + ((1 - v) ** a)); 
                    },                    
                    easeBell(v) {  v = Math.abs(((v * repeats)%1) * 2-1); v = ((v % 1) + 1) % 1; return Math.sin(v * Math.PI) ** a },
                    random() { var v = ((Math.random() - 0.5) * a) + 0.5; return v < 0 ? 0 : v > 1 ? 1 : v },
                    randRamp(v) { 
                        const a1 = Math.abs(Math.sin(v *2* Math.PI)) ** a;
                        v = Math.abs(((v * repeats)%1) * 2-1);
                        v = (((v % 1) + 1) % 1) + ( Math.random() - 0.5 ) * a1; 
                        return v < 0 ? 0 : v > 1 ? 1 : v  
                     },
                    flat(v) {
                        v = Math.abs(((v * repeats)%1) * 2-1);
                        if (a < 1) { v = ((v - 0.5) * a) + (1.5 - a) }
                        else { v += 0.5 - 0.5 / a; v = ((v - 0.5) * a) + 0.5 }
                        return v < 0 ? 0 : v > 1 ? 1 : v
                    },
                    wave(v) { 
                        v = (((v * repeats)%1)+1)%1;
                        return v > u ? 1 : 0;

                    },
                },                
                normInv : {
                    ease(v) { return 1 - ((v < 0 ? 0 : v > 1 ? 1 : v) **  aa) },
                    ease2(v) {   v = (v < 0 ? 1 : v > 1 ? 0 : 1-v);  return 1 - (((1 - (v * v)) ** 0.5) ** a) },
                    sigmoid(v) {
                        var vv; 
                        if(v <= 0){ return 1 } 
                        if(v >= 1){ return 0 } 
                        return 1-(vv = (v ** a)) / (vv + ((1 - v) ** a)); 
                    },
                    easeBell(v) {  v = (v < 0 ? 0 : v > 1 ? 1 : v); return 1 - (Math.sin(v * Math.PI) ** a) },
                    random() { var v = ((Math.random() - 0.5) * a) + 0.5; return 1 - (v < 0 ? 0 : v > 1 ? 1 : v) },
                    randRamp(v) { 
                        const a1 = Math.sin(v * Math.PI) ** a;
                        v = (v < 0 ? 0 : v > 1 ? 1 : v) + ( Math.random() - 0.5 ) * a1; 
                        return 1 - (v < 0 ? 0 : v > 1 ? 1 : v);
                    },
                    flat(v) {
                        if (a < 1) {  v = ((v - 0.5) * a) +(1.5 - a) }
                        else { v += 0.5 - 0.5/ a; v = ((v - 0.5) * a) + 0.5 }
                        return 1 - (v < 0 ? 0 : v > 1 ? 1 : v);
                    },
                    wave(v) { 
                        v = v < 0 ? 0 : v > 1 ? 1 : v;
                        return v > u ? 0 : 1;

                    },
                },
                normInvRep : {
                    ease(v) { v = Math.abs(((v * repeats)%1) * 2-1); return 1-((((v % 1) + 1) % 1) **  aa) },
                    ease2(v) {   v = Math.abs(((v * repeats)%1) * 2-1); v = 1-(((v % 1) + 1) % 1);  return 1-(((1 - (v * v)) ** 0.5) ** a) },
                    sigmoid(v) {
                        var vv; 
                        v = Math.abs(((v * repeats)%1) * 2-1) 
                        return 1 - (vv = (v ** a)) / (vv + ((1 - v) ** a)); 
                    }, 
                    easeBell(v) {  v = Math.abs(((v * repeats)%1) * 2-1); v = ((v % 1) + 1) % 1; return 1-(Math.sin(v * Math.PI) ** a) },
                    random() { var v = ((Math.random() - 0.5) * a) + 0.5; return 1-(v < 0 ? 0 : v > 1 ? 1 : v) },
                    randRamp(v) { 
                        const a1 = Math.abs(Math.sin(v *2* Math.PI)) ** a;
                        v = Math.abs(((v * repeats)%1) * 2-1);
                        v = (((v % 1) + 1) % 1) + ( Math.random() - 0.5 ) * a1; 
                        return 1-(v < 0 ? 0 : v > 1 ? 1 : v)  
                     },
                    flat(v) {
                        v = Math.abs(((v * repeats)%1) * 2-1);
                        if (a < 1) { v = ((v - 0.5) * a) + (1.5 - a) }
                        else { v += 0.5 - 0.5 / a; v = ((v - 0.5) * a) + 0.5 }
                        return 1-(v < 0 ? 0 : v > 1 ? 1 : v);
                    },
                    wave(v) { 
                        v = (((v * repeats)%1)+1)%1;
                        return v > u ? 0 : 1;

                    },
                },                   
                state : {
                    ease : { inverted : false, repeat : false,color : "#F88", colors: "#F88,#A88,#855,#700".split(",") },
                    ease2 : { inverted : false, repeat : false, color : "#F8F", colors: "#F8F,#A8A,#858,#707".split(",") },
                    sigmoid : { inverted : false, repeat : false, color : "#F8F", colors: "#F8F,#A8A,#858,#707".split(",")},
                    easeBell : { inverted : false, repeat : false, color : "#0FF", colors: "#0FF,#0AA,#088,#077".split(",") },
                    random : { inverted : false, repeat : false, color : "#FF0", colors: "#FF0,#AA0,#880,#770".split(",") },
                    randRamp : { inverted : false, repeat : false, color : "#FF0", colors: "#FF0,#AA0,#880,#770".split(",") },
                    flat : { inverted : false, repeat : false, color : "#88F", colors: "#88F,#88A,#558,#007".split(",") },
                    wave : { inverted : false, repeat : false, color : "#0FF", colors: "#0FF,#0AA,#088,#066".split(",") },
                    
                    get bitFlagsRepeat() {
                        var bit = 0, flags = 0;
                        for(const name of API.curveTypes){
                            flags += (curve.state[name].repeat ? 1 : 0) << (bit++);
                        }
                        return flags;
                    },
                    set bitFlagsRepeat(flags) {
                        var bit = 0;
                        for(const name of API.curveTypes){
                            curve.state[name].repeat = (flags & (1 << (bit++))) !== 0;
                        }
                    },
                    get bitFlagsInverted() {
                        var bit = 0, flags = 0;
                        for(const name of API.curveTypes){
                            flags += (curve.state[name].inverted ? 1 : 0) << (bit++);
                        }
                        return flags;
                    },
                    set bitFlagsInverted(flags) {
                        var bit = 0;
                        for(const name of API.curveTypes){
                            curve.state[name].inverted = (flags & (1 << (bit++))) !== 0;
                        }
                    }
                },
                _name : "flat",
                set name(val){
                    if(editSecond){
                        namedSecond.name = val;
                    }else{
                        curve._name = val;
                    }
					curve.isRandom = val === "random";
                },
                get baseName() { return curve._name },
                get name() { return editSecond ? curveB.name : curve._name },
                isSecond : false,
                get baseCurve() { return curve.isSecond ? curveB : curveA },
                useCurve (curveName = curve.name) {
                    if(editSecond){
                        curveB = namedSecond.useCurveAsSecond(curveName);
                    }else{
                        const inv = curve.state[curveName].inverted ? "Inv" : "";
                        const rep = curve.state[curveName].repeat ? "Rep" : "";
                        curveA = curve[currentCurveSet + inv + rep][curve.name = curveName];
                        if(!mixing){
                            API.currentCurve = API[named] = curveA;
                        }else{
                            //API[named].name = curveName;
                        }
						curveA.superIdx = superPower;
                        //lineColor = curve.state[curveName].colors[superPower % curve.state[curveName].colors.length];
                        //if(curve.isSecond) { lineColorB = lineColor } else { lineColorA = lineColor }
                            
                    }
                },
                useCurveAsSecond (curveName = curve.name) {
                    const inv = curve.state[curveName].inverted ? "Inv" : "";
                    const rep = curve.state[curveName].repeat ? "Rep" : "";
                    lineColor = curve.state[curveName].color;
                    if(curve.isSecond) { lineColorB = lineColor } else { lineColorA = lineColor }
                    return API[named] = curve[currentCurveSet + inv + rep][curve.name = curveName];
                },
                mixSecond(mixType){
                    mixTypeName = mixType;
                    if(mixType === "none"){
                        API.currentCurve = API[named] = curveA;
                        mixing = curve.editSecond = false;
                        
                    }else{
                        mixing = true;
                        API[named] = curve.mix[mixType];
                    }
                },
                get mixType() {
                    return mixTypeName;
                    
                },
                get secondCurve() {
                    return namedSecond;
                },
                set editSecond(val){
                    editSecond = val;
                    
                },
                get editSecond(){
                    return editSecond;
                },
                attachSecondCurve(namedS){
                    namedSecond = API.curves[namedS];
                    curveB = API[namedS];
                    curveB.isSecond = true;
                },
                repeat() {
                    if(editSecond){
                        namedSecond.repeat();                        
                    }else{
                        curve.state[curve.name].repeat = !curve.state[curve.name].repeat;
                        curve.useCurve();
                    }
                },
                get isRepeat() { return editSecond ? namedSecond.isRepeat : curve.state[curve.name].repeat },
                get isInverted() { return editSecond ? namedSecond.inverted : curve.state[curve.name].inverted },
                invert() {
                    if(editSecond){
                        namedSecond.invert();                        
                    }else{                    
                        curve.state[curve.name].inverted = !curve.state[curve.name].inverted;
                        curve.useCurve();
                    }
                },
                set curveSet(name){
                    if(editSecond){
                        namedSecond.curveSet = name;                        
                    }else{                    
                        if(name === ""){ name = currentCurveSet === "cycle" ? "norm" : "cycle" }
                        currentCurveSet = name === "cycle" ? "cycle" : "norm";
                        curve.useCurve();
                        API.forceDisplay(named);
                    }
                },
                get curveSet(){ return editSecond ? namedSecond.curveSet : currentCurveSet },
                getCurveState(state = {}) {
                    var editHold = editSecond;
                    editSecond = false;
                    state.name = curve.name;                    
                    state.curveSet = currentCurveSet;
                    state.power = curve.power;
                    state.repeats = curve.repeats;
                    state.inverted = curve.state.bitFlagsInverted;
                    state.repeat = curve.state.bitFlagsRepeat;
					state.superPowers = [...curve.superPowers];
					state.superIdx = superPower;
                    
                    state.mixType = mixTypeName;
                    if(mixTypeName !== "none"){
                        state.nameB = namedSecond.name;                    
                        state.curveSet = namedSecond.curveSet;
                        state.powerB = namedSecond.power;
                        state.repeatsB = namedSecond.repeats;
                        state.invertedB = namedSecond.state.bitFlagsInverted;
                        state.repeatB = namedSecond.state.bitFlagsRepeat;
                    } else {
                        delete state.nameB;                    
                        delete state.curveSetB;
                        delete state.powerB;
                        delete state.repeatsB;
                        delete state.invertedB;
                        delete state.repeatB;                       
                        
                    }
                        
                    editSecond = editHold;
                    
                    return state;
                },
                setCurveState(state) { // may get an undefined or empty object. The will just mean keep current state
                    if(state){

                        editSecond = false;                        
                        if(state.inverted !== undefined) { curve.state.bitFlagsInverted = state.inverted }
                        if(state.repeat !== undefined) { curve.state.bitFlagsRepeat = state.repeat }
                        if(state.curveSet !== undefined) {
                            var csName = state.curveSet ? state.curveSet  : "";
                            if(csName === ""){ csName = currentCurveSet === "cycle" ? "norm" : "cycle" }
                            currentCurveSet = csName === "cycle" ? "cycle" : "norm";  
                        }
                        if(state.name !== undefined && state.name){
                            curve.name = state.name;  
                            if(API.curveTypes.indexOf(state.name) === -1){ curve.name = API.curveTypes[0] }
                        }                        
                        
                        if(state.power !== undefined) { curve.power = state.power }
						if(state.superPowers !== undefined) {
							if(curve.superPowers === undefined) {
								curve.superPowers = [...state.superPowers];
							}else {
								curve.superPowers.length = 0;
								curve.superPowers.push(...state.superPowers);
							}
						}
                        if(state.repeats !== undefined) { curve.repeats = state.repeats }
                        if(state.mixType !== undefined) { 

                            if(state.mixType !== "none"){
                                namedSecond.name = state.nameB;                    
                                namedSecond.curveSet = state.curveSet;
                                namedSecond.power = state.powerB;
                                namedSecond.repeats = state.repeatsB;
                                namedSecond.state.bitFlagsInverted = state.invertedB;
                                namedSecond.state.bitFlagsRepeat = state.repeatB;    
                                curve.mixSecond(state.mixType);                                
                                
                                
                            }else{
                                curve.mixSecond("none")
                            }
                        }   
						if (state.superIdx !== undefined) { superPower = state.superIdx }
						else { superPower = 0 }
						
                        curve.useCurve();                        
                        API.forceDisplay(named);
                    }
                },
                    
            }
            currentCurveSet = "norm";
            curve.norm.random.realtime = true;
            curve.norm.randRamp.realtime = true;
            curve.normInv.random.realtime = true;
            curve.normInv.randRamp.realtime = true;
            curve.normInv.randRamp.isRandom = true;
            curve.norm.random.isRandom = true;
            curve.norm.randRamp.isRandom = true;

            curve.cycleInv.random.isRandom = true;
            curve.cycle.random.realtime = true;
            curve.cycle.randRamp.realtime = true;
            curve.cycleInv.random.realtime = true;
            curve.cycleInv.randRamp.realtime = true;
            curve.cycleInv.randRamp.isRandom = true;
            curve.cycle.random.isRandom = true;
            curve.cycle.randRamp.isRandom = true;
            curve.cycleInv.random.isRandom = true;
            
            API.curves[named] = curve;
            API.curveNames.push(named);
            return curve;
        },
        flat(){return 1},
        linear(v){return v},
        on() { on = true; curves.forceDisplay() },
        off()  { on = false },
        setVisible(eventType, state){  on = state }, // from pannel show events
        display() {
            if (on) {
                if (API.currentCurve.realtime && (((curveRealtimeFrameCounter++) % 5) === 0)) {
                    if (API.currentCurveMixed) { displayMix(context, API.currentCurve, API.currentCurveA, API.currentCurveB) }
                    else { display(context, API.currentCurve,API.currentCurveMixed ? "white" : lineColor) }
                }

            }
        },
        forceDisplay(named){
            if(named !== undefined) {
                if(API.currentCurveName === named){
                    if (API.currentCurveMixed) { displayMix(context, API.currentCurve, API.currentCurveA, API.currentCurveB) }
                    else { display(context, API.currentCurve,API.currentCurveMixed ? "white" : lineColor) }
                    curveRealtimeFrameCounter = 1;
                }
                
            }else{
                if (API.currentCurveMixed) { displayMix(context, API.currentCurve, API.currentCurveA, API.currentCurveB) }
				else { display(context, API.currentCurve,API.currentCurveMixed ? "white" : lineColor) }
                curveRealtimeFrameCounter = 1;
            }

        },
        selectEditMixCurveA(curveA){
            secondEdit = API.curves[API.currentCurveName].editSecond = curveA ? false : true;
        },
        select(name) {  
            API.curves[API.currentCurveName].editSecond = false;
            API.curves[API.currentCurveName].useCurve(name);
            API.currentCurveMixed = API.curves[API.currentCurveName].mixType !== "none" ? true : false;
            API.currentCurveA = API.curves[API.currentCurveName].baseCurve;
            secondEdit = false;
        },
        selectMix(mixType){
            API.curves[API.currentCurveName].mixSecond(mixType);
            API.currentCurveMixed = API.curves[API.currentCurveName].mixType !== "none" ? true : false;
            secondEdit = API.curves[API.currentCurveName].editSecond;
            API.currentCurveA = API.curves[API.currentCurveName].baseCurve;
        },
        selectSecond(name) {  
            API.curves[API.currentCurveName].editSecond = true;
            API.curves[API.currentCurveName].useCurve(name);
            API.currentCurveMixed = API.curves[API.currentCurveName].mixType !== "none" ? true : false;
            API.currentCurveA = API.curves[API.currentCurveName].baseCurve;
            secondEdit = true;
        },
        setContext(c) { context = c },
        curves : {},
        curveNames : [],
        currentCurveObj : null,
        currentCurveObjB : null,
        currentCurve : null,
        currentCurveA : null,
        currentCurveB : null,
        currentCurveMixed : false,
        currentCurveName : "",
        set displayCurve(named) {
            API.currentCurveName = named;
            API.currentCurve = API[named];
            API.currentCurveA = API.curves[API.currentCurveName].baseCurve;
            API.currentCurveB = API[named+ "_B"];
            API.currentCurveObj = API.curves[API.currentCurveName];
            API.currentCurveObjB = API.curves[API.currentCurveName].secondCurve;
            API.currentCurveMixed = API.curves[API.currentCurveName].mixType !== "none" ? true : false;
            secondEdit = API.curves[API.currentCurveName].editSecond;
        },
        namedCurves : "brushColor,brushAlpha,lineColor,lineWidth,lineAlpha,sprayColor,spraySize,spraySpread,sprayAlpha".split(","),
       // setDisplayCurve(index){ API.displays[displayIndex]  = API.namedCurves[index] }
    }
    API.createCurve("A").useCurve("flat");

    API.namedCurves.forEach(curveName => {
        API.createCurve(curveName + "_B").useCurve("ease");
        API.createCurve(curveName).useCurve("ease");
        API.createCurve(curveName).attachSecondCurve(curveName + "_B");
    });
    API.displayCurve = "lineAlpha";
    API.select("flat");
    API.curves.lineAlpha.power = 0;
    return API;
})();