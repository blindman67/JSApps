"use strict";
const extraRenders = (() => {
    const oneTime = [];
    const oneTimeReady = [];
	const ongoingArr = [];
	const ongoing = new Map();
    const DOMRenderers = {};
    const DOMRenderNames = [];
    const common = {
        dash : [5],
        dashOffset : 0,
        dashLight : "white",
        dashDark : "black",
        dashAlpha : 1,
        emptyDash : [],
        maxLineLen : 0,  // the shorts line that will still span the longest diagonal on th visible workspace
        vHeight : 0, // The workspace view height
        vWidth : 0, // The workspace view width
        update(ctx) {
            common.dashOffset += 1;
            common.dashOffset %= common.dash[0] * 2;
            const scale = view.scale;
            const w = common.vWidth = ctx.canvas.width / scale;
            const h = common.vHeight = ctx.canvas.height / scale;
            common.maxLineLen = Math.sqrt(w * w + h * h);
        }
    }
    function getSettings(){
        common.dash[0] = Number(settings.dashSize);
        common.dashAlpha = Number(settings.dashAlpha);
        common.dashLight = settings.dashLightColor;
        common.dashDark = settings.dashDarkColor;
    }
    getSettings();
    settingsHandler.onchange = getSettings;
    var captureId = 0, capRenderFunc;
    const API = {
        captureId: 0,
        requestCapture(id, renderFunc){
            if(captureId === 0 || captureId === id){
                API.captureId = captureId = id;
                capRenderFunc = renderFunc;
                if (capRenderFunc) { API.haveWork = true }
                return true;
            }
            return false;
        },
        release(id){
            if(id === captureId || captureId === 0 || id === -1){
                API.captureId = captureId = 0;
                capRenderFunc = undefined;
                return true;
            }
            return false;
        },
        // =============================================================================================================
        // DEBUG CODE This should not be part of release version.
        // This is a debug function and is called by heartBeat monitor as an attempt to restore running state
        reset(){
            captureId = 0;
            API.clear();
        },
        renderDOM() {

            for(const name of DOMRenderNames) { DOMRenderers[name]() }
        },
        DOMRenderingFunction(name, func) {
            if(func === undefined) {
                if(DOMRenderers[name]) {
                    DOMRenderers[name] = undefined;
                    const idx = DOMRenderNames.indexOf(name);
                    DOMRenderNames.splice(idx,1);
                }
            } else {
                if(DOMRenderers[name]) {
                    DOMRenderers[name] = func;
                }else{
                    DOMRenderers[name] = func;
                    DOMRenderNames.push(name);
                }
            }
        },
        callMe : false,
        callMeReady : false,
        haveWork: false,
		addOngoing(name, func) {
			if(func === undefined) {
				ongoing.delete(name);
			} else {
			    ongoing.set(name,func);
			}
			ongoingArr.length = 0;
			ongoingArr.push(...ongoing.values());
		    this.callMe = true;
		},
        hasOneTime(func) { return oneTime.some(fc => fc === func); },
        removeOneTime(func) {
            var h = 0, t = 0;
            while (h < oneTime.length) {
                if (oneTime(h) !== func) { oneTime[t++] = oneTime[h]; } 
                h++;
            }
            oneTime.length = t;
            if (t === 0 && ongoingArr.length === 0) { API.callMe = false; }
        },       
        addOneTime(func, id = 0){
            if(id === captureId){
                oneTime.push(func);
                API.callMe = true;
            }
        },            
        addOneTimeReady(func, delayFrames = 0){
            oneTimeReady.push({func, delay: spriteRender.captureCount + (sprites.hasVideo ? delayFrames + 1 : delayFrames)});
            API.callMeReady = true;
        },
        render(ctx){
            if (API.callMe) {
                common.update(ctx);
                let i = oneTime.length;                
                while (i -- > 0) { (oneTime.shift())(ctx, common) }
                for(const ongo of ongoingArr) { ongo(ctx, common) }
                API.callMe = oneTime.length > 0 || ongoingArr.length > 0;
            }
            if(API.callMeReady && (!sprites.hasVideo || (sprites.hasVideo && animation.videosReady && spriteRender.capturedReady && spriteRender.renderedReady))){
                let i = 0;
				var len = oneTimeReady.length;
                while(i < len) {
					oneTimeReady[i].delay--;
                    if (oneTimeReady[i].delay <= 0)  {
                        oneTimeReady[i].func();
                        oneTimeReady.splice(i--,1);
						len--;
                    }
                    i++
                }
                API.callMeReady = oneTimeReady.length !== 0;
            }
            if (capRenderFunc) { capRenderFunc(ctx) }
            API.captureId = captureId;
            API.haveWork = capRenderFunc !== undefined;
        },
        clear() {
            oneTime.length = 0;
            oneTimeReady.length = 0;
            API.callMe = false;
            API.callMeReady = false;
        }
    };
    return API;
})();

