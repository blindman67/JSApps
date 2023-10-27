"use strict";
const colours = (()=>{
    const cols = "444444,666666,888888,999999,AAAAAA,BBBBBB,CCCCCC,DDDDDD,EEEEEE,FF0088,FF00FF,8800FF,0000FF,0088FF,0FF,00FF88,00FF00,88FF00,FFFF00,FF8800,FF0000,FFFFFF,000".split(",").map(c=>"#" + c);
    var keySlideStep = 1;
    function getSettings(){
        keySlideStep = settings.Key_HSL_Slide_Step;
    }
    getSettings();
    settingsHandler.onchange = getSettings;
	var flasher;
    const buttonMap = new Map();
    var  secondShadow, mainShadow;  // holds copy of main and second color buttons
    var drawModeQuickSelectFor;
    var oldPalletSort;
    var holdTillButUp = false;
    var holdColor;
    var whichColor = 0; // selects main or second color
    function ColsPallet() {
        const pallet = Object.assign([], {
            indexOfColor(color) {
                return pallet.findIndex(col => {
                    if(col !== undefined) {
                        if(col.r === color.r && col.g === color.g && col.b === color.b){
                            return true;
                        }
                    }
                    return false;
                });
            },
            addColor(color) {
                if(pallet.indexOfColor(color) === -1) {
                    pallet.unshift(color);
                    if (pallet.sourcePallet) {
                        pallet.sourcePallet.addColor(color.r, color.g, color.b);
                    }
                }
            },
            removeColor(color) {
                const idx = pallet.indexOfColor(color);
                if(idx !== -1) {
                    pallet.splice(idx,1);
                    if (pallet.sourcePallet) {
                        pallet.sourcePallet.removeColor(color.r, color.g, color.b);
                    }
                }
            },

            setColorByIdx(color, idx) {

                if (idx >= 0 && idx < pallet.length) {
                    const oldCol = pallet[idx];
                    pallet[idx] = color;
                    if (pallet.sourcePallet) {
                        const pIdx = pallet.sourcePallet.idxOfRGB(oldCol.r, oldCol.g, oldCol.b);
                        if (pIdx > -1) {
                            pallet.sourcePallet.replaceColor(pIdx, color);
                        }
                    }
                }
            },
            fromMediaPallet(mPal) {
                pallet.length = 0;
                mPal.each((r, g, b, idx) => {
                    pallet[idx] = { r,g,b,a: 255, css: rgbaToCSS(r,g,b,255), usedCount: idx };
                });
                pallet.sourcePallet = mPal;
                pallet.sourcePalletSort = mPal.sortBy;

            },
        });
        return pallet;
    }
    var workPallet = ColsPallet();
    var pallet = ColsPallet();
    var defaultPallet = pallet;
    const id = UID ++;
    var palletDisplayPos = 0;
    var palletSwatchHighlight = 0;
    const lastBgColor = {  // used to suppress slider gradient update if the same as previouse update
        r : -1,
        g : -1,
        b : -1,
    }
    var pending;
    var noUpdate = false;
    var redS,greenS,blueS,alphaS,main,second,hueS,lumS,satS;
    const sliderToCSS = () => "rgba(" + redS.slider.value + "," + greenS.slider.value + ","+ blueS.slider.value + ",1)";
    const createColFromSliders = () => ({r : redS.slider.value, g : greenS.slider.value, b : blueS.slider.value, a : 255});
    const createColFromNamedSliders = (redS,greenS,blueS,alphaS) => ({r : redS.slider.value, g : greenS.slider.value, b : blueS.slider.value, a : alphaS === undefined ? 1 : alphaS.slider.value});
    const createColA = (r,g,b,a) => ({r, g, b, a ,css : rgbaToCSS(r,g,b,a) });
    const createCol = (r,g,b) => ({r, g, b, a : 255,css : rgbaToCSS(r,g,b,255) });
    const rgbaToCSS = (r,g,b,a) => "rgba(" + r + "," + g + ","+ b + "," + a + ")";
    const hslToCSS = (h,s,l) => "hsl(" + h + "," + s + "%,"+ l +"%)";
    const hexToRGBA = (hex) => {
        if(hex.length > 4){
            return {
                r : parseInt(hex.substr(1,2),16),
                g : parseInt(hex.substr(3,2),16),
                b : parseInt(hex.substr(5,2),16),
                a : 255,
            };
        }
        return {
            r : parseInt(hex.substr(1,1),16) * 16,
            g : parseInt(hex.substr(2,1),16) * 16,
            b : parseInt(hex.substr(3,1),16) * 16,
            a : 255,
        };
    }
    const clipTri = (x, phase, amp, dcOff) => {
        x = 3 * Math.abs(2 * (x + phase / 3 - (x + (phase + 1.5) / 3 | 0))) - 1.5;
        return ((x < -0.5 ? -0.5 : x > 0.5 ? 0.5 : x) * amp + dcOff) * 255 | 0;
    }
    function HSLToRGBA(h,s,l, rgba){
        const lum = ((l / 255) - 0.5) * 2;
        var scale = (1 - Math.abs(lum));
        const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
        scale *= (s / 255);
        const hue = h / 360;
        rgba.r = clipTri(hue, 1.5, scale, offset);
        rgba.g = clipTri(hue, 3.5, scale, offset);
        rgba.b = clipTri(hue, 5.5, scale, offset);
        rgba.a =  255;
        return rgba;
    }
    function RGBToHSL(r,g,b,hsl = {}){ // integers in the range 0-255
        var minC, maxC, dif, h, l, s,min, max;
        h = l = s = 0;
        r /= 255;  // normalize channels
        g /= 255;
        b /= 255;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){  // no colour so early exit
            hsl.h = 0;
            hsl.l = min * 255 | 0;
            hsl.s = 0;
            return hsl;
        }
        dif = max - min;
        l = (max + min) / 2;
        if (l > 0.5) { s = dif / (2 - max - min) }
        else { s = dif / (max + min) }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6.0 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2.0 }
        else { h = (r - g) / dif + 4.0 }
        hsl.h  = (h * 60 + 0.5) | 0;
        hsl.l = (l * 255 + 0.5) | 0;
        hsl.s = (s * 255 + 0.5) | 0;
        return hsl;
    }
    function sliderHSLToRGBA(hueSlide = hueS, satSlide = satS, lumSlide = lumS){
        const lum = ((lumSlide.slider.value / 255) - 0.5) * 2;
        var scale = (1 - Math.abs(lum));
        const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
        scale *= (satSlide.slider.value / 255);
        const hue = hueSlide.slider.value / 360;
        return {
            r : clipTri(hue, 1.5, scale, offset),
            g : clipTri(hue, 3.5, scale, offset),
            b : clipTri(hue, 5.5, scale, offset),
            a : 255,
        }
    }
    function setHSLSliders(rgb, hueSlide = hueS, satSlide = satS, lumSlide = lumS){ // integers in the range 0-255
        if(rgb === undefined) { return }
        var minC, maxC, dif, h, l, s,min, max, r, g, b;
        h = l = s = 0;
        r = rgb.r / 255;  // normalize channels
        g = rgb.g / 255;
        b = rgb.b / 255;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){  // no colour so early exit
            hueSlide.slider.value = 0;
            lumSlide.slider.value = min * 255 | 0;
            satSlide.slider.value = 0;
        }
        dif = max - min;
        l = (max + min) / 2;
        if (l > 0.5) { s = dif / (2 - max - min) }
        else { s = dif / (max + min) }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6.0 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2.0 }
        else { h = (r - g) / dif + 4.0 }
        API.mainHSL.h = hueSlide.slider.value = (h * 60 + 0.5) | 0;
        API.mainHSL.s = lumSlide.slider.value = (l * 255 + 0.5) | 0;
        API.mainHSL.l = satSlide.slider.value = (s * 255 + 0.5) | 0;
        noUpdate = true;
        hueSlide.element.updateValue();
        satSlide.element.updateValue();
        lumSlide.element.updateValue();
        noUpdate = false;
    }
    function updatePallet(useCurrentSelSwatch){
        var i;

        if (palletDisplayPos + (commands.swatchHigh -commands.swatchLow) > pallet.length){
            palletDisplayPos = pallet.length - (commands.swatchHigh -commands.swatchLow);
        }
        if(palletDisplayPos < 0) { palletDisplayPos = 0 }
        var p = palletDisplayPos;

        for(i = commands.swatchLow ; i <= commands.swatchHigh && p < pallet.length; i++){
            var color = pallet[p++];
            if(color !== undefined){
                buttonMap.get(i).element.style.background = color.css;
                if (useCurrentSelSwatch) {
                    if (palletSwatchHighlight === p) {
                        buttonMap.get(i).element.classList.add("colorSwatchSel");
                    } else {
                        buttonMap.get(i).element.classList.remove("colorSwatchSel");
                    }
                } else {
                    if (color.r ===  API.mainColor.r && color.g ===  API.mainColor.g && color.b ===  API.mainColor.b) {
                        buttonMap.get(i).element.classList.add("colorSwatchSel");
                        palletSwatchHighlight = p;
                    } else {
                        buttonMap.get(i).element.classList.remove("colorSwatchSel");
                    }
                }

            }else{
                buttonMap.get(i).element.style.background = "transparent";
				buttonMap.get(i).element.classList.remove("colorSwatchSel");
            }
        }
        for(; i <= commands.swatchHigh; i++){
            buttonMap.get(i).element.style.background = "transparent";
			buttonMap.get(i).element.classList.remove("colorSwatchSel");
        }

    }
    function findColInPallet(rgba){
        var i;
        for(i = 0; i < pallet.length; i++){
            const col = pallet[i];
            if(col === undefined){
                log("Undefined pallet item, pallet length reduced from " + pallet.length + "to " + i);
                pallet.length = i;
                break;
            }
            if(col.r === rgba.r && col.g === rgba.g && col.b === rgba.b){
                return i;
            }
        }
    }
    function addColor(rgba, forceToMain = false){
        var index = pallet.indexOfColor(rgba);
        if(index === -1){
            var color = { ...rgba, css: rgbaToCSS(rgba.r,rgba.g,rgba.b,255), usedCount: pallet.length, };
            if (!API.pending) {
                pallet.addColor(color); 
                if (forceToMain) {
                    API.main = color;
                }

                return color;
            } else{
                pending = color;
                return API.main = color;
            }
        } else { return API.main = pallet[index] }
    }
    function moveSliders(h,s,l) {
        if (!noUpdate) {
            if (holdTillButUp && mouse.savedState.button === 0) {
                holdTillButUp = false;
                API.pending = false;           
            } else if(!holdTillButUp  && mouse.savedState.button !== 0) {
                holdTillButUp = true;
                API.pending = false;
            } 
        }
        var ll = lumS.slider.value + l * keySlideStep;
        var ss = satS.slider.value + s * keySlideStep;
        var hh = hueS.slider.value + h * keySlideStep;
        ll = ll < 0 ? 0 : ll > 255 ? 255 : ll;
        ss = ss < 0 ? 0 : ss > 255 ? 255 : ss;
        hh = hh < 0 ? 359 : hh > 359 ? 0 : hh;
        if(h) {
            hueS.slider.silent = true;
            hueS.slider.value = hh;
            hueS.element.updateValue();
            hueS.slider.silent = false;
        }
        if(s) {
            satS.slider.silent = true;
            satS.slider.value = ss;
            satS.element.updateValue();
            satS.slider.silent = false;
        }
        if(l) {
            lumS.slider.silent = true;
            lumS.slider.value = ll;
            lumS.element.updateValue();
            lumS.slider.silent = false;
        }
        setSliders(sliderHSLToRGBA());
        updateColor();


        if (!noUpdate) {
            if (!holdTillButUp) {
                API.pending = true;
                holdColor = addColor(createColFromSliders());                
            } else {            
                const rgba = createColFromSliders();
                if (API.pending === false) {
                    API.pending = true;
                    holdColor = addColor(rgba);
                } else  {
                    pending.r = rgba.r;
                    pending.g = rgba.g;
                    pending.b = rgba.b;
                    pending.a = rgba.a;
                    pending.css = rgbaToCSS(rgba.r,rgba.g,rgba.b,255);
                } 
            }
        }
    }
 
    function setSlidersBackgroundColors(force = false){
        if(force || redS.slider.value !== lastBgColor.r || greenS.slider.value !== lastBgColor.g || blueS.slider.value !== lastBgColor.b){
            var rr = (lastBgColor.r = redS.slider.value).toString(16).padStart(2,"0");
            var gg = (lastBgColor.g = greenS.slider.value).toString(16).padStart(2,"0");
            var bb = (lastBgColor.b = blueS.slider.value).toString(16).padStart(2,"0");
            redS.element.style.backgroundImage = `linear-gradient( to right, #00${gg+bb}, #FF${gg+bb} 88%)`;
            greenS.element.style.backgroundImage = `linear-gradient( to right, #${rr+"00"+bb}, #${rr+"FF"+bb} 88%)`;
            blueS.element.style.backgroundImage = `linear-gradient( to right, #${rr+gg+"00"}, #${rr+gg+"FF"} 88%)`;
            var hh = hueS.slider.value;
            var ll = satS.slider.value/255 * 100 | 0;
            var ss = lumS.slider.value/255 * 100 | 0;
            var llss = `${ll}%,${ss}%)`
            hueS.element.style.backgroundImage = `linear-gradient( to right, hsl(0,${llss},hsl(60,${llss},hsl(120,${llss},hsl(180,${llss},hsl(240,${llss},hsl(300,${llss}, hsl(360,${ll}%,${ss}%) 88%)`;
            satS.element.style.backgroundImage = `linear-gradient( to right, hsl(${hh},0%,${ss}%), hsl(${hh},100%,${ss}%) 88%)`;
            lumS.element.style.backgroundImage = `linear-gradient( to right, hsl(${hh},${ll}%,0%), hsl(${hh},${ll}%,50%) 44%, hsl(${hh},${ll}%,100%) 88%)`;

        }
    }
    function setSliders(col,rSlide = redS, gSlide = greenS, bSlide = blueS){
        rSlide.slider.value = col.r;
        gSlide.slider.value = col.g;
        bSlide.slider.value = col.b;
        noUpdate = true;
        rSlide.element.updateValue();
        gSlide.element.updateValue();
        bSlide.element.updateValue();
        noUpdate = false;
    }
    function selectColor(col,which){
        if(which === "main" && whichColor === 0){
            API.main = col;
            setSliders(col);
            main.element.style.background = col.css;
            createColorRange();
            setSlidersBackgroundColors();
            updatePallet();

        }else if(which === "second" && whichColor === 1) {
            API.second = col;
            second.element.style.background = col.css;
            createColorRange();
            setSlidersBackgroundColors();
            updatePallet();
            
        } else {
            API.second = col;
            second.element.style.background = col.css;
            createColorRange();            
        }
    }
    function updateColor(){
        main.element.style.background = sliderToCSS();
        setSlidersBackgroundColors();
    }
    const workRGBA = {r :0, g: 0, b : 0, a : 255};
    const prevRGBA = {r :0, g: 0, b : 0, a : 255};
    function createColorRange(){
        if(colorRangeInHSL){
            var h,s,l;
            const hslStart = RGBToHSL(API.mainColor.r, API.mainColor.g, API.mainColor.b);
            const hslEnd = RGBToHSL(API.secondColor.r, API.secondColor.g, API.secondColor.b);
            const hsl = RGBToHSL(API.secondColor.r, API.secondColor.g, API.secondColor.b);
            h = hslEnd.h - hslStart.h;
            if(Math.abs(h) > 180){
                h = (360 - Math.abs(h)) * (-Math.sign(h));
            }
            s =  hslEnd.s - hslStart.s;
            l =  hslEnd.l - hslStart.l;
            const scale = 100 / 255;
            for(var i = 0; i < 256; i ++){
                const ii = i / 255;
                API.colorRange[i] = hslToCSS(
                    (hslStart.h + ii * h | 0) % 360,
                    (hslStart.s + ii * s) * scale | 0,
                    (hslStart.l + ii * l) * scale | 0,
                );
            }
        }else{
            var r,rr,g,gg,b,bb;
            r = API.mainColor.r ** 2;
            g = API.mainColor.g ** 2;
            b = API.mainColor.b ** 2;
            rr = (API.secondColor.r ** 2) - r;
            gg = (API.secondColor.g ** 2) - g;
            bb = (API.secondColor.b ** 2) - b;
            for(var i = 0; i < 256; i ++){
                API.colorRange[i] = rgbaToCSS(
                    (((i / 255) * rr + r) ** 0.5) | 0,
                    (((i / 255) * gg + g) ** 0.5) | 0,
                    (((i / 255) * bb + b) ** 0.5) | 0,
                    255
                );
            }
        }
    }
    const compModes = "source-over,lighter,multiply,screen,overlay,color-dodge,color-burn,hard-light,soft-light,difference,exclusion,hue,saturation,color,luminosity,source-atop,source-in,source-out,destination-over,destination-atop,destination-in,destination-out,copy,xor".split(",");
    var compAlt =[[1,2],[1,2]];
    var colorRangeInHSL = false;
    const colorPickerInfo = {
        x: 0,
        y: 0,
    }
    function colorPickerInfoPannelRender(ctxD, ctxF) {
        const c = ctxD.canvas;
        const w = c.width;
        const h = c.height;
        const ww = w / 10;
        const hh = h / 10;
        const xx = ww * 0.5 - 0.5 ;
        const yy = hh * 0.5 - 0.5;

        ctxD.clearRect(0,0,w,h);
        ctxD.imageSmoothingEnabled = false;
        const x = mouse.x - xx;
        const y = mouse.y - yy;
        ctxD.drawImage(ctxF.canvas, x, y, ww, hh, 0, 0, w, h);
        ctxD.strokeWidth = 1;
        ctxD.strokeStyle = "#FFF";
        ctxD.strokeRect(xx * 10 - 0.5, yy * 10 - 0.5, 11, 11);
        ctxD.strokeStyle = "#000";
        ctxD.strokeRect(xx * 10 - 1.5, yy * 10 - 1.5, 13, 13);
        ctxD.imageSmoothingEnabled = true;
    }
    const API = {
        colorRange : [],
        createColorRange,
        useHSLModel : false,
        addToColorRange(i,r,g,b){
            API.colorRange[i] = rgbaToCSS( r | 0,g | 0,b | 0,255);
        },
        getButton(commandId) { return buttonMap.get(commandId) },
        each(cb) {
            var i = 0;
            while(i < pallet.length) {
                if (cb(pallet[i], i) === true) { return }
                i++;
            }
        },
        ready(){
			if (flasher === undefined) {
                flasher = elementFlasher(uiPannelList.color.title, {palletUpdate : "colorPanelFlash"});
                this.flash = function(name = "palletUpdate") { flasher(name) };
            }
            var used = 0;
            for(const hex of cols){ addColor(hexToRGBA(hex)); }
            updatePallet();
            selectColor(pallet[0],"main");
            selectColor(pallet[1],"second");
            API.command(commands.drawModeOver);
            API.command(commands.drawModeOverB);
            alphaS.element.updateValue();
            setSlidersBackgroundColors();
            selection.addEvent("change",() => {
                if (uiPannelList.color.isOpen) {
                    if (selection.length === 1 && selection[0].type.pallet && (selection[0].pallet !== pallet.sourcePallet || selection[0].pallet.sortBy !== pallet.sourcePalletSort)) {

                        pallet = workPallet;
                        oldPalletSort = selection[0].pallet.sortByString;
                        selection[0].pallet.sortBy = "fixed";
                        pallet.fromMediaPallet(selection[0].pallet);
                        updatePallet();
                        if (pallet.length > 0) {
                            selectColor(pallet[0],"main");
                            if (pallet.length > 1) {
                                selectColor(pallet[1],"second");
                            }
                        }
                        setSlidersBackgroundColors();
                    } else {
                        if (pallet !== defaultPallet) {
                            pallet.sourcePallet.sortBy = oldPalletSort;
                            pallet = defaultPallet;
                            updatePallet();
                            pallet[0] && selectColor(pallet[0],"main");
                            pallet[1] && selectColor(pallet[1],"second");
                            setSlidersBackgroundColors();
                        }
                    }
                } 
            });

        },
        addColorUIToPannel(pannel,pos,width,color){
            var dialogButMap = new Map();
            function setButtons(buttons){
                for(const but of buttons){
                    dialogButMap.set(but.command, but);
                }
                return buttons
            }
            var handler = {
                r : color.r,
                g : color.g,
                b : color.b,
                a : color.a,
                h : 0,
                s : 0,
                l : 0,
                css : "",
                command(commandId){
                    if(!noUpdate){
                        if(commandId === commands.dialogHue || commandId === commands.dialogSat ||commandId === commands.dialogLum){
                            var col = sliderHSLToRGBA(hSlide,sSlide,lSlide);
                            col.a = handler.a;
                            Object.assign(handler,col);
                            if(!noUpdate){
                                setSliders(handler,rSlide,gSlide,bSlide);
                                handler.css = rgbaToCSS(handler.r, handler.g, handler.b, handler.a);
                                swatch.element.style.background = handler.css;
                            }
                        }else if(commandId === commands.dialogRed || commandId === commands.dialogGreen ||commandId === commands.dialogBlue){
                            if(!noUpdate){
                                Object.assign(handler,createColFromNamedSliders(rSlide,gSlide,bSlide,aSlide));
                                handler.a /= 255;
                                setHSLSliders(handler,hSlide,sSlide,lSlide);
                                handler.css = rgbaToCSS(handler.r, handler.g, handler.b, handler.a);
                                swatch.element.style.background = handler.css;
                            }
                        }else if(commandId === commands.dialogAlpha){
                            handler.a = aSlide.slider.value / 255;
                            handler.css = rgbaToCSS(handler.r, handler.g, handler.b, handler.a);
                            swatch.element.style.background = handler.css;
                        }
                        color.r = handler.r
                        color.g = handler.g
                        color.b = handler.b
                        color.a = handler.a
                        color.css = handler.css;
                    }
                },
                enable(){
                    rSlide.enable();
                    gSlide.enable();
                    bSlide.enable();
                    aSlide.enable();
                    hSlide.enable();
                    sSlide.enable();
                    lSlide.enable();
                    swatch.enable();
                },
                disable(){
                    rSlide.disable();
                    gSlide.disable();
                    bSlide.disable();
                    //aSlide.disable();
                    hSlide.disable();
                    sSlide.disable();
                    lSlide.disable();
                    swatch.disable();
                },
                close(){
                    rSlide = undefined;
                    gSlide = undefined;
                    bSlide = undefined;
                    aSlide = undefined;
                    hSlide = undefined;
                    sSlide = undefined;
                    lSlide = undefined;
                    swatch = undefined;
                    dialogButMap = undefined;
                    commandRanges.removeHandler(handler.handle);
                    handler = undefined;
                }
            }
            pos++;
            buttons.create(setButtons([
                    { x : 0, y : (pos++)-1, w : width, h : 2, command : commands.displayOnly, background: color.css},
                    { x : 0, y : pos, w : 1, h : 1, command : -2, text : "R", help : "Red slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : pos++, w : width-1, h : 1, command : commands.dialogRed, slider : {color : "red", min : 0, max : 255, step : 1,wStep : 8, value : color.r }},
                    { x : 0, y : pos, w : 1, h : 1, command : -2, text : "G", help : "Green slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : pos++, w : width-1, h : 1, command : commands.dialogGreen, slider : {color : "green", min : 0, max : 255, step : 1,wStep : 8, value :  color.g }},
                    { x : 0, y : pos, w : 1, h : 1, command : -2, text : "B", help : "Blue slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : pos++, w : width-1, h : 1, command : commands.dialogBlue, slider : {color : "blue", min : 0, max : 255, step : 1,wStep : 8, value :  color.b }},
                    { x : 0, y : pos, w : 1, h : 1, command : -2, text : "A", help : "Alpha slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : pos++, w : width-1, h : 1, command : commands.dialogAlpha, slider : {color : "Black", min : 0, max : 255, step : 1,wStep : 8, value :  color.a }},
                    { x : 0, y : 1+pos, w : 1, h : 1, command : -2, text : "H", help : "Hue slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : 1+pos++, w : width-1, h : 1, command : commands.dialogHue, slider : {color : "Black", min : 0, max : 360, step : 1,wStep : 8, value : 0 }},
                    { x : 0, y : 1+pos, w : 1, h : 1, command : -2, text : "S", help : "Sat slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : 1+pos++, w : width-1, h : 1, command : commands.dialogSat, slider : {color : "Black", min : 0, max : 255, step : 1,wStep : 8, value : 0 }},
                    { x : 0, y : 1+pos, w : 1, h : 1, command : -2, text : "L", help : "Lum slider", className : "buttonDisplayTextOnly"},
                    { x : 1, y : 1+pos++, w : width-1, h : 1, command : commands.dialogLum, slider : {color : "Black", min : 0, max : 255, step : 1,wStep : 8, value : 0 }},
                ]),
                {
                    pannel : pannel,
                    size : 16,
                }
            );
            var rSlide = dialogButMap.get(commands.dialogRed);
            var gSlide = dialogButMap.get(commands.dialogGreen);
            var bSlide = dialogButMap.get(commands.dialogBlue);
            var aSlide = dialogButMap.get(commands.dialogAlpha);
            var hSlide = dialogButMap.get(commands.dialogHue);
            var sSlide = dialogButMap.get(commands.dialogSat);
            var lSlide = dialogButMap.get(commands.dialogLum);
            var swatch = dialogButMap.get(commands.displayOnly);
            setSliders(color,rSlide,gSlide,bSlide);
            aSlide.slider.value = handler.a * 255 | 0;
            aSlide.element.updateValue();
            setHSLSliders(color,hSlide,sSlide,lSlide);
            handler.command(-1);
            handler.handle = commandRanges.addHandler(commands.dialogRed,commands.dialogLum,handler);
            if(color.useMain || color.useSecond){
                handler.disable();
            }
            return handler;
        },
        swatchDrag(mouse,event){
            var oldX,oldY;
            var palPos;
            var dragColor;
            var newPos, currentPos;
            function dragging(mouse,event){
                //if(mouse.over === false){ mouse.downOn = null }
                if(event.type === "mouseup"){
                    dragColor = undefined;
                    mouse.onmove = undefined;
                    mouse.onbutton = undefined;
                    mouse.release(id);
                }else{
                    if(dragColor !== undefined){
                        newPos = dragColor + ((mouse.x -oldX) / 16 | 0);
                        if(newPos >= 0 && newPos < pallet.length){
                            if(newPos !== currentPos){
                                var col = pallet[currentPos];
                                var col1 = pallet[newPos];
                                pallet[newPos] = col;
                                pallet[currentPos] = col1;
                                if(newPos < palletDisplayPos) {
                                    palletDisplayPos = newPos;
                                }else if(newPos >= palletDisplayPos + (commands.swatchHigh-commands.swatchLow)){
                                    palletDisplayPos = newPos - (commands.swatchHigh-commands.swatchLow);
                                }
                                currentPos = newPos;
                            }
                        }
                    }else{
                        palletDisplayPos = palPos - ((mouse.x -oldX) / 8 | 0);
                        if(palletDisplayPos !== palPos){ mouse.downOn = null }
                    }
                    updatePallet();
                }
            }
            mouse.requestCapture(id,mouse.downOn);
            if(mouse.captured === id){
                if((mouse.button & 4) === 4){
                    currentPos = dragColor = event.target.commandId - commands.swatchLow + palletDisplayPos;
                }else{
                }
                oldX = mouse.x;
                oldY = mouse.y;
                mouse.onmove = dragging;
                mouse.onbutton = dragging;
                palPos = palletDisplayPos;
            }
        },
        setValue(name, val){
            if(name === "alpha"){
                alphaS.slider.value = val;
                alphaS.element.updateValue();
            }else if(name === "mainDrawMode"){
                const ob = mouse.oldButton;
                mouse.oldButton = 0;
                API.command(val);
                mouse.oldButton = ob;
            }else if(name === "secondDrawMode"){
                const ob = mouse.oldButton;
                mouse.oldButton = 0;
                API.command(val);
                mouse.oldButton = ob;
            }
        },
        colorPickerUpdate(ctx) {
            if(mouse.x >= 0 && mouse.x <= ctx.canvas.width && mouse.y >= 0 && mouse.y < ctx.canvas.height){
                if (mouse.x !== colorPickerInfo.x || mouse.y !== colorPickerInfo.y) {
                    colorPickerInfo.x = mouse.x;
                    colorPickerInfo.y = mouse.y;
                }
                infoPannel.update(id, "show",  colorPickerInfoPannelRender, ctx);
            } else {
                infoPannel.update(id, "hide" );
            }

        },
        colorPicker(mouse, event){
            if(event.type === "mouseup"){
                mouse.release(id);
                mouse.onbutton = null;
                if (extraRenders.release(id)) {
                    infoPannel.update(id, "close" );
                }
            }else{
                const ctx = view.context;
                if(mouse.x >= 0 && mouse.x <= ctx.canvas.width && mouse.y >= 0 && mouse.y < ctx.canvas.height){
                    const pixData = ctx.getImageData(mouse.x,mouse.y,1,1).data;
                    if (pixData[3] === 0){
                        log.warn("Alpha zero is not pickable");
                        const capData = mouse.getCaptureReleaseData(id);
                        capData && (capData.colorIdx = 0);
                    }else{

                        if((mouse.button & 4) === 4){
                            API.setColor(pixData[0],pixData[1],pixData[2],true);
                            const capData = mouse.getCaptureReleaseData(id)
                            capData && (capData.colorIdx = 2);
                        }else{
                            API.setColor(pixData[0],pixData[1],pixData[2]);
                            API.alpha = pixData[3] / 255;
                            alphaS.slider.value = pixData[3];
                            alphaS.element.updateValue();
                            const capData = mouse.getCaptureReleaseData(id)
                            capData && (capData.colorIdx = 1);
                        }
                        paint.changed = true;
                    }
                }
            }
        },
        mainWheel(steps,second = false){
            var index = findColInPallet(API.mainColor);
            index = index === undefined ? 0 : index;
            index += steps;
            index = ((index % pallet.length) + pallet.length) % pallet.length;
            API.pending = false;
            var col = pallet[index];
            if(second){
                selectColor(col,"second");
            }else{
                setHSLSliders(col);
                selectColor(col,"main");
            }
        },
        secondsWheel (steps){ API.mainWheel(steps,true) },
		commands: {
            [commands.setPalletDefault]() {
                defaultPallet =  pallet;
                log.info("Current pallet set as default for this session");
            },
            [commands.alphaSlider]() { API.alpha = alphaS.slider.value / 255 },
            [commands.blueSlider]() { API.commands[commands.redSlider]() },
            [commands.greenSlider]() { API.commands[commands.redSlider]() },
            [commands.redSlider]() {
				updateColor();
                const col = createColFromSliders();
				setHSLSliders(col);
				if(!editSprites.drawingModeOn && selection.length > 0){
					const pend = API.pending;
					API.pending = false;
					issueCommand(commands.edSprFill);
					API.pending = pend;
				}
				if(!noUpdate){
                    if (mouse.ctrl) {
                        pallet.setColorByIdx({r: col.r, g: col.g, b: col.b, css: rgbaToCSS(col.r, col.g, col.b,255)}, palletSwatchHighlight-1);
                        API.pending = false;
                        updatePallet(true);
                    } else {
                        API.pending = true;
                        addColor(col);
                    }
				}
			},
			[commands.lumSlider]() { API.commands[commands.hueSlider]() },
			[commands.satSlider]() { API.commands[commands.hueSlider]() },
			[commands.hueSlider]() {
                const col = sliderHSLToRGBA();
				setSliders(col);

				updateColor();
				if(!editSprites.drawingModeOn && selection.length > 0){
					const pend = API.pending;
					API.pending = false;
					issueCommand(commands.edSprFill);
					API.pending = pend;
				}
				if(!noUpdate){
                    if (mouse.ctrl) {
                        pallet.setColorByIdx({r: col.r, g: col.g, b: col.b, css: rgbaToCSS(col.r, col.g, col.b,255)}, palletSwatchHighlight-1);
                        API.pending = false;
                        updatePallet(true);
                    } else {
                        API.pending = true;
                        addColor(col);
                    }
				}
			},
            [commands.mainColor](e, left, right) {
				API.pendingColorUsed(right === true);
				var setSlides = whichColor !== 0;
				main = mainShadow;
				second = secondShadow;
				whichColor = 0;
				if (setSlides) {
                    const col = API.mainColor;
                    selectColor(col,"main");
                    setHSLSliders(col);

				}
				setSlidersBackgroundColors(true);
				buttons.groups.setRadio(buttonMap.get(commands.mainColor).group,commands.mainColor, false);
			},
            [commands.secondColor]() {
				var setSlides = whichColor !== 1;
				whichColor = 1;
				main = secondShadow;
				second = mainShadow;
				if(setSlides){
					var col = API.secondColor;
					selectColor(col,"main");
					setHSLSliders(col);
				}
				setSlidersBackgroundColors(true);
				buttons.groups.setRadio(buttonMap.get(commands.secondColor).group,commands.secondColor, false);
			},
            [commands.setBackgroundColor]() {
				if(mouse.ctrl) {
					mainCanvas.ctx.fillStyle = document.body.style.backgroundColor;
					const c = hexToRGBA(mainCanvas.ctx.fillStyle);
					API.setColor(c.r, c.g, c.b);
				}else{
					mainCanvas.ctx.setBackgroundColor(API.mainColor.css);
					API.pendingColorUsed();
					if((mouse.oldButton & 4)=== 4) {
						settings.backgroundColor = API.mainColor.css;
						saveSettings();
						log.sys("Background saved to settings");
					}
				}
			},
            [commands.setSnapGridColor]() {
				if(mouse.ctrl) {
					mainCanvas.ctx.fillStyle = widget.gridLineColor;
					const c = hexToRGBA(mainCanvas.ctx.fillStyle);
					API.setColor(c.r, c.g, c.b);
				}else{

					widget.gridLineColor = API.mainColor.css;
					API.pendingColorUsed();

					if((mouse.oldButton & 4)=== 4) {
						settings.gridLineColor = API.mainColor.css;
						saveSettings();
						log.sys("Grid guides color saved to settings");
					}
				}
			},
            [commands.colorPickerCommit]() {
                return API.commands[commands.colorPicker](true);
            },
            [commands.colorPicker](commit = false) {
                return new Promise((picked, failed) => {
                    if (mouse.captured === 0) {
                        mouse.requestCapture(id, view.context.canvas, (rid,data) => {
                            if(rid === id){
                                buttons.groups.setCheck("colorPick", commands.colorPicker, false);
                                buttons.groups.setCheck("colorPickerPaint", commands.colorPicker, false);
                                if(data.colorIdx > 0) {
                                    commit && API.pendingColorUsed();
                                    picked(data.colorIdx ? API.mainColor : API.secondColor);
                                } else {
                                    failed("Zero alpha");
                                }
                            } else if(id === -1) {  // global release command Normaly via Esc key
                                mouse.onbutton = null;
                                picked();
                            }
                        },{colorIdx:0});
                        if(mouse.captured === id){
                            if(extraRenders.requestCapture(id, API.colorPickerUpdate)){
                                sprites.restoreDrawable(false)


                                buttons.groups.setCheck("colorPick", commands.colorPicker, true);
                                buttons.groups.setCheck("colorPickerPaint", commands.colorPicker, true);
                                mouse.requestCursor(id,"color_picker");
                                mouse.onbutton = API.colorPicker;
                                colorPickerInfo.y = colorPickerInfo.x = -1;
                                infoPannel.show(infoPannel.displayTypes.colorPicker, id);
                            }else{
                                mouse.release(id);
                                log.warn("Workspace is busy!!");
                                failed("Workspace is busy!!");
                            }
                        } else { failed("Mouse is busy!!") }
                    } else {
                        failed("Mouse is busy!");
                    }
                });
			},
            [commands.useHSLColorRange]() {
				colorRangeInHSL = !colorRangeInHSL;
				API.useHSLModel = colorRangeInHSL;
				buttons.groups.setRadio(buttonMap.get(commands.useHSLColorRange).group,colorRangeInHSL ? commands.useHSLColorRange : -1);
				createColorRange();
			},
            [commands.setSpriteColor]() {
				if (mouse.ctrl) {
					if(selection.length === 0) { log.warn("No sprite selected to get colour from") }
					else {
						mainCanvas.ctx.fillStyle = selection[0].rgb.css;
						const c = hexToRGBA(mainCanvas.ctx.fillStyle);
						API.setColor(c.r, c.g, c.b);
					}
				} else {
					selection.each(spr => {
						if(API.pending) { API.pendingColorUsed() }
						spr.rgb.fromColor(API.mainColor);
                        if (spr.type.attached && spr.attachedTo.type.gradient) {
                            spr.attachedTo.gradient.update = true;
                        }
						if(spr.type.vector) {
							if(spr.vector.desc.pathStr.displayColor.css !== spr.rgb.css){
								spr.vector.desc.pathStr.displayColor = {...API.mainColor};
								spr.vector.redraw();
							}
						}
					});
				}
			},
            [commands.setImageBGColor]() {
				if((mouse.oldButton & 4) === 4){
					selection.processImages((img, i) => {
						if(API.pending) { API.pendingColorUsed() }
						const processed = localProcessImage.fillForegroundWithColor(img, API.mainColor.css);
						return processed === true;
					});
				}else{
					selection.processImages((img, i) => {
						if(API.pending) { API.pendingColorUsed() }
						const processed = localProcessImage.fillTransparentWithColor(img, API.mainColor.css);
						return processed === true;
					});
				}
			},
			[commands.colorsDarker]() {  moveSliders(0,0,-1); pens.colorsChanged(); },
			[commands.colorsLighter]() { moveSliders(0,0,1); pens.colorsChanged(); },
			[commands.colorsSatDown]() { moveSliders(0,-1,0); pens.colorsChanged(); },
			[commands.colorsSatUp]() {   moveSliders(0,1,0); pens.colorsChanged(); },
			[commands.colorsHueDown]() { moveSliders(-1,0,0); pens.colorsChanged(); },
			[commands.colorsHueUp]() {   moveSliders(1,0,0); pens.colorsChanged(); },
			[commands.swatchToMainColor]() {
                const main = API.mainColor;
                pallet.setColorByIdx({r: main.r, g: main.g, b: main.b, css: main.css }, palletSwatchHighlight-1);
                updatePallet();
            },
			[commands.scrollSwatchLeft]() {
				palletDisplayPos -= 1;
				updatePallet();
			},
			[commands.scrollSwatchRight]() {
				palletDisplayPos += 1;
				updatePallet();
			},
            [commands.colorsPrevSwatch](e, left, right) {
                API.pending = false;              
                let col = palletSwatchHighlight-2;
                if (col < palletDisplayPos) { palletDisplayPos -= 1; }
                if(col < 0) { 
                    col = pallet.length - 1;
                    palletDisplayPos = col - (commands.swatchHigh -commands.swatchLow);
                }
                col = pallet[col];
                if(mouse.oldButton === 4){
                    selectColor(col,"second");
                } else if (mouse.keyEvent && whichColor === 1) {
                    selectColor(col,"second");
                    setHSLSliders(col);
                } else {
                    setHSLSliders(col);
                    selectColor(col,"main");
                }
                pens.colorsChanged();

            },
            [commands.colorsNextSwatch](e, left, right) {
                API.pending = false;
                const rightMostSwatch = palletDisplayPos + (commands.swatchHigh -commands.swatchLow);
                let col = palletSwatchHighlight;
                if (col > rightMostSwatch) { palletDisplayPos += 1;  }
                    
                if(col >= pallet.length) { 
                    col = 0; 
                    palletDisplayPos = 0;                 
                }
                col = pallet[col];
                if (mouse.oldButton === 4){
                    selectColor(col,"second");
                } else if (mouse.keyEvent && whichColor === 1) {
                    selectColor(col,"second");
                    setHSLSliders(col);
                }else{
                    setHSLSliders(col);
                    selectColor(col,"main");
                }
                pens.colorsChanged();
            }
		},
        command(commandId,button,event){
            if(!noUpdate){
                const leftButton = (mouse.oldButton & 1) === 1;
                const rightButton = (mouse.oldButton & 4) === 4;


				if(API.commands[commandId]) {
                    const commandRes = API.commands[commandId]( event, leftButton, rightButton);
					if (commandRes === undefined || commandRes instanceof Promise) { return commandRes }
				}


				if(commandId >= commands.swatchLow && commandId <= commands.swatchHigh){
                    var col = pallet[(commandId - commands.swatchLow)+palletDisplayPos];
                    if (mouse.shift && mouse.ctrl) {
                        if(col) { pallet.removeColor(col) }

                    }
                    if(col) {
                        API.pending = false;
                        if(mouse.oldButton === 4){
                            selectColor(col,"second");
                        }else{
                            setHSLSliders(col);
                            selectColor(col,"main");
                            if(!editSprites.drawingModeOn && selection.length > 0){
                                issueCommand(commands.edSprFill);
                            }
                        }
                    }
                } else if(commandId === commands.drawModeLighter ||commandId === commands.drawModeDarker ||commandId === commands.drawModeLighterB ||commandId === commands.drawModeDarkerB){
                    const button = buttonMap.get(commandId);
                    drawModeQuickSelectFor = commandId;
                    const alt = compAlt[button.group === "drawMode" ? 0 : 1];
                    var mode = alt[(commandId - commands.drawModeLighter) % 2];
                    if((mouse.oldButton & 4) === 4){
                        buttons.groups.setRadio("drawModeExtraGroup",commands.drawModeExtra1 + mode -1);
                    }else{
                        if(buttonMap.get(commandId).group === "drawMode"){
                            API.mainDrawMode = commandId;
                        }else{
                            API.secondDrawMode = commandId;
                        }
                        buttons.groups.setRadio(buttonMap.get(commandId).group,commandId);
                    }


                }else if(commandId >= commands.drawModeExtra1 && commandId <= commands.drawModeExtra14) {
                   const button = buttonMap.get(drawModeQuickSelectFor);
                    const alt = compAlt[button.group === "drawMode" ? 0 : 1];
                    var mode = commandId - commands.drawModeExtra1 + 1;
                    button.setSprite(mode-1);
                    if(commands.drawModeLighter === drawModeQuickSelectFor || commands.drawModeLighterB === drawModeQuickSelectFor) {
                        alt[0] = mode;
                    } else {
                        alt[1] = mode;
                    }

                    button.element.title = compModes[mode] + "\n" + button.element.helpText.split("\n")[1];

                }else if(commandId >= commands.drawModeOver && commandId < commands.drawModeLast) {
                    if(commandId >= commands.drawModeLighter){
                        const button = buttonMap.get(commandId);
                        const alt = compAlt[button.group === "drawMode" ? 0 : 1];
                        var mode = alt[(commandId - commands.drawModeLighter) % 2];
                        if((mouse.oldButton & 4) === 4){
                            if(mouse.ctrl){
                                mode = (mode + (button.sprites.length - 1)) % button.sprites.length;
                                mode = mode ? mode : button.sprites.length - 1;
                            }else{
                                mode = (mode + 1) % button.sprites.length;
                                mode = mode ? mode : 1;
                            }
                            button.setSprite(mode-1);
                            alt[(commandId - commands.drawModeLighter) % 2] = mode;
                            button.element.title = compModes[mode] + "\n" + button.element.helpText.split("\n")[1];

                        }
                    }
                    if(buttonMap.get(commandId).group === "drawMode"){
                        API.mainDrawMode = commandId;
                    }else{
                        API.secondDrawMode = commandId;
                    }
                    buttons.groups.setRadio(buttonMap.get(commandId).group,commandId);
                }
            }
        },
        pendingColorUsed (replace = false) {

            if (API.pending) {
                if (mouse.button !== 0) {
                    if (holdTillButUp) { return; }
                } else {
                    if (holdTillButUp) { holdTillButUp = false; }
                }               
                if (replace && palletSwatchHighlight > 0 && palletSwatchHighlight <= pallet.length) {
                    pallet.setColorByIdx(API.mainColor, palletSwatchHighlight - 1);
                } else {
                    palletDisplayPos = 0;
                    pallet.addColor(API.mainColor);
                }
                API.pending = false;
                updatePallet();
            } else {
                
            }
        },
        removeColor(col) {
            pallet.removeColor(col)
            updatePallet();
        },
        addColor(col){
            var col = addColor(col, true)
            setHSLSliders(col);
            selectColor(col,"main");
            updatePallet();
        },
        setColor(r,g,b,useSecond){
            if(useSecond === true){
                const col = createCol(r,g,b);
                second.element.style.background = col.css;
                API.secondColor = col;
            }else{
                prevRGBA.r = workRGBA.r = r;
                prevRGBA.g = workRGBA.g = g;
                prevRGBA.b = workRGBA.b = b;
                const palletIndex = findColInPallet(workRGBA);
                if(palletIndex !== undefined){
                    var col = pallet[palletIndex];
                    setHSLSliders(col);
                    selectColor(col,"main");
                }else{
                    API.pending = true;
                    const col = createCol(r,g,b);
                    main.element.style.background = col.css;
                    setHSLSliders(col);
                    setSliders(col);
                    addColor(col);
                    createColorRange();
                    setSlidersBackgroundColors(true);
                }
            }
        },
        updateUIColor() {
            main.element.style.background = API.mainColor.css;
            second.element.style.background = API.secondColor.css;
        },
        pending : false,
        set main(col) {
            var noChange;

            if(whichColor === 0) {
                noChange = API.mainColor.css === col.css;
                API.mainColor = col;
            }else {
                noChange = API.secondColor.css === col.css;
                API.secondColor = col;
            }

            if (mouse.button === 0) {
                if (!noChange) {
                    createColorRange();
                    paint.changed = true;
                    if (mouse.oldButton !== 0) {
                        whichColor === 0  ? API.fireEvent("maincolorchanged", API.mainColor) : API.fireEvent("secondcolorchanged", API.secondColor);
                    }
                }
            } else if (!noChange){
                if (mouse.oldButton === 0) {
                   whichColor === 0  ? API.fireEvent("maincolorchanged", API.mainColor) : API.fireEvent("secondcolorchanged", API.secondColor);
                }
            }

        },
        set second(col) {
            var noChange;
            if(whichColor === 0) {
                noChange = API.secondColor.css === col.css;
                API.secondColor = col;
            } else {
                noChange = API.mainColor.css === col.css;
                API.mainColor = col;
            }
            if (mouse.button === 0) {
                if (!noChange) {
                    createColorRange();
                    paint.changed = true;
                    if (mouse.oldButton !== 0) {
                        whichColor !== 0  ? API.fireEvent("maincolorchanged", API.mainColor) : API.fireEvent("secondcolorchanged", API.secondColor);
                    }
                }
            } else if (!noChange){
                if (mouse.oldButton === 0) {
                   whichColor !== 0  ? API.fireEvent("maincolorchanged", API.mainColor) : API.fireEvent("secondcolorchanged", API.secondColor);
                }
            }
        },
        get current(){
            if (API.pending) { API.pendingColorUsed() }
            return API.mainColor.css;
        },
        mainHSL : {h : 0, s: 0, l: 0},
        mainColor : "#000",
        secondColor : "#FFF",
        get secondColorAlpha() {
            const c = API.secondColor;
            c.a = Math.floor(API.alpha * 255);
            return c;
        },
        alpha : 1,
        mainDrawMode : 0,
        secondDrawMode : 0,
        getPallet() {
            const p = [];
            for(const col of pallet){
                p.push([col.r, col.g, col.b]);
            }
            return p;
        },
        clearPallet() {
            pallet.length = 0;
            API.pending = false;
        },
        setPallet(cols) {
            for(const p of cols) {
                API.setColor(p[0],p[1],p[2]);
            }
        },
        setContextDrawMode(ctx,mode){
            if(mouse.ctrl){
                if(mode === commands.drawModeOver || mode === commands.drawModeOntop || mode === commands.drawModeBehind){
                    ctx.globalCompositeOperation = compModes[compAlt[0][1]];
                    return;
                }
                if(mode === commands.drawModeOverB || mode === commands.drawModeOntopB || mode === commands.drawModeBehindB){
                    ctx.globalCompositeOperation = compModes[compAlt[1][1]];
                    return
                }
            }
            if(mouse.shift){
                if(mode === commands.drawModeOver || mode === commands.drawModeOntop || mode === commands.drawModeBehind){
                    ctx.globalCompositeOperation = compModes[compAlt[0][0]];
                    return;
                }
                if(mode === commands.drawModeOverB || mode === commands.drawModeOntopB || mode === commands.drawModeBehindB){
                    ctx.globalCompositeOperation = compModes[compAlt[1][0]];
                    return
                }
            }
            if(mode === commands.drawModeOver || mode === commands.drawModeOverB){
                ctx.globalCompositeOperation = "source-over";
            }else if(mode === commands.drawModeErase || mode === commands.drawModeEraseB){
                ctx.globalCompositeOperation = "destination-out";
            }else if(mode === commands.drawModeOntop || mode === commands.drawModeOntopB){
                ctx.globalCompositeOperation = "source-atop";
            }else if(mode === commands.drawModeBehind || mode === commands.drawModeBehindB){
                ctx.globalCompositeOperation = "destination-over";
            }else if(mode === commands.drawModeLighter){
                ctx.globalCompositeOperation = compModes[compAlt[0][0]];
            }else if(mode === commands.drawModeDarker){
                ctx.globalCompositeOperation = compModes[compAlt[0][1]];
            }else if(mode === commands.drawModeLighterB){
                ctx.globalCompositeOperation = compModes[compAlt[1][0]];
            }else if(mode === commands.drawModeDarkerB){
                ctx.globalCompositeOperation = compModes[compAlt[1][1]];
            }
        },
        getDrawMode(mode){
            if(mouse.ctrl){
                if(mode === commands.drawModeOver || mode === commands.drawModeOntop || mode === commands.drawModeBehind){
                    return compModes[compAlt[0][1]];
                }
                if(mode === commands.drawModeOverB || mode === commands.drawModeOntopB || mode === commands.drawModeBehindB){
                    return compModes[compAlt[1][1]];
                }
            }
            if(mouse.shift){
                if(mode === commands.drawModeOver || mode === commands.drawModeOntop || mode === commands.drawModeBehind){
                    return compModes[compAlt[0][0]];
                }
                if(mode === commands.drawModeOverB || mode === commands.drawModeOntopB || mode === commands.drawModeBehindB){
                    return compModes[compAlt[1][0]];
                }
            }
            if (mode === commands.drawModeOver || mode === commands.drawModeOverB) { return "source-over" }
            if (mode === commands.drawModeErase || mode === commands.drawModeEraseB) { return   "destination-out" }
            if (mode === commands.drawModeOntop || mode === commands.drawModeOntopB) { return  "source-atop" }
            if (mode === commands.drawModeBehind || mode === commands.drawModeBehindB) {  return   "destination-over"}
            if (mode === commands.drawModeLighter) {  return  compModes[compAlt[0][0]] }
            if (mode === commands.drawModeDarker) { return   compModes[compAlt[0][1]] }
            if (mode === commands.drawModeLighterB) { return  compModes[compAlt[1][0]] }
            return  compModes[compAlt[1][1]];
        },
        update(reduceUseCount){
            updatePallet();
        },
        getButton(commandId) { return buttonMap.get(commandId) },
        setButtons(buttons){
            for(const but of buttons){
                buttonMap.set(but.command, but);
            }
            redS = buttonMap.get(commands.redSlider)
            greenS = buttonMap.get(commands.greenSlider)
            blueS = buttonMap.get(commands.blueSlider)
            hueS = buttonMap.get(commands.hueSlider)
            satS = buttonMap.get(commands.satSlider)
            lumS = buttonMap.get(commands.lumSlider)
            alphaS = buttonMap.get(commands.alphaSlider)
            mainShadow = main = buttonMap.get(commands.mainColor)
            secondShadow = second = buttonMap.get(commands.secondColor)
            return buttons;
        },
    };
    Object.assign(API, Events(API));
    return API;
})();