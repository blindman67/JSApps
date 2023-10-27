"use strict";
const heartBeat = (() => {
    const img = new Image();
    const id = UID ++;
    var ctx;
    img.src = "icons/heartBeat.png";
    const sprites = [
        { x : 10, y : 0, w : 9, h : 9, },
        { x : 0, y : 10, w : 9, h : 9, },
        { x : 0, y : 0, w : 9, h : 9, },
        { x : 6, y : 28, w : 5, h : 7, }, // 0
        { x : 18, y : 28, w : 5, h : 7, }, // 1
        { x : 12, y : 28, w : 5, h : 7, }, // 2
        { x : 10, y : 10, w : 5, h : 7, }, // 3
        { x : 16, y : 10, w : 5, h : 7, }, // 4
        { x : 0, y : 20, w : 5, h : 7, }, // 5
        { x : 6, y : 20, w : 5, h : 7, }, // 6
        { x : 12, y : 20, w : 5, h : 7, }, // 7
        { x : 18, y : 20, w : 5, h : 7, }, // 8
        { x : 0, y : 28, w : 5, h : 7, }, // 9
        // used by extraRender
        { x : 0, y : 36, w : 10, h : 20 }, // Left side locator
        { x : 11, y : 36, w : 10, h : 20 }, // right side locator
        { x : 0, y : 36, w : 20, h : 10 }, // bottom  locator
        { x : 0, y : 47, w : 20, h : 10 }, // top  locator
    ];
    const buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const busyDisplayOffset = 2.5; // larger values move busy indicator away from corner
    var write = 0;
    var read = 0;
    var lastTime;
    var frameCount = 0;
    var frameTime = 0;
    var totalTime = 0;
    var mouseDelay = 0;
    var mouseHangC,mouseHangB,mouseHangA;
    var awakeCount = 0;
    var start = 0;
    var end = Math.PI * 0.2;
    var endSpeed = 1.5;
    const alerts = [];
    var alertTime, alertBase,alertSize, showWarn, showError, showInfo, countBadFrames = 0, badFrameMessages = [];
    function monitor() {
        if(!API.frameComplete){
            if(countBadFrames === 3){
                log.warn("There could be a problem " + textIcons.emotQuizzical + ". Please Wait!");
                log.errorLockout(id);
            }else if(countBadFrames === 5){
                log.error("Painter has crashed " + textIcons.emotConstination+ ".  Attempting recovery",id);
                countBadFrames += 1;
                mouse.release(-1); // force mouse release;
                if(extraRenders.reset) {extraRenders.reset()};
                extraRenders.clear();
                if(editSprites.drawingModeOn){
                    editSprites.command(commands.edSprDrawing);
                    uiPannelList.paint.toggleShow();
                    badFrameMessages.push("Paint mode closed.");

                }
                countBadFrames = 9;
            }else if(countBadFrames === 7){
                badFrameMessages.push("Restarting main renderer.");

            }else if(countBadFrames === 10){
                render();
            }else if(countBadFrames === 12){
                const F = textIcons.fire + textIcons.fire + textIcons.fire;
                log.error("-=<"+ F +" Could not recover workspace interface " + F + ">=-",id);
                log.warn("If posible save your work. Restart Painter.");
                log.clearErrorLockout(id);
            }
            countBadFrames += 1;
        }else{
            if(countBadFrames > 0){
                while(badFrameMessages.length > 0) {
                    log.warn(badFrameMessages.shift());
                }
                log.info("Workspace interface recoverd");
                log.info("Save work before continuing.");
                log.clearErrorLockout(id);
            }
            countBadFrames = 0;
        }
    }
    var monitorHandle = setInterval(monitor,500);
    var sleepWakeFrames;
    function getSettings(){
        alertTime = settings.alertTime;
        alertSize = settings.alertSize;
        showWarn = settings.showWarnAlerts;
        showError = settings.showErrorAlerts;
        showInfo = settings.showInfoAlerts;
        mouseHangA = settings.mouseHangTime * 32 * (1/3) | 0;
        mouseHangB = settings.mouseHangTime * 32 * (2/3) | 0;
        mouseHangC = settings.mouseHangTime * 32;
        sleepWakeFrames = settings.sleepWakeFrames;
    }
    getSettings();
    settingsHandler.onchange = getSettings;
    const alertStyles = {
        warn : "orange",
        error : "red",
        info : "green",
    };
    function layoutUpdate(event){
        alertBase = event.horSplit;
    }
    displaySizer({onafterupdate : layoutUpdate, fireAfterUpdate : true});
    var beatRate = 20; // real frame count not optimal frames
    function drawSprite(idx, x, y) {
        var s = sprites[idx];
        if (s) {
            ctx.drawImage(img, s.x, s.y, s.w, s.h, x, y, s.w, s.h);
        } else {
            // This should no longer happen. See comment at calling code (re neg FPS)
            log.warn("=========== Inportant ============");
            log.warn("Must trace and fix heartbeat error");
            log.warn("----------------------------------");
            throw new Error("HeartBeat No sprite at sprites[" + idx+"]");
        }
    }
    const busyProcesses = new Map();
    const API = {
        get heartBeatSprites() {
            if(img.complete) { return {img,sprites} }
        },
        frameComplete : true,
		keepAwake: false,
        countKeepAwake(dir) {
            awakeCount += dir;
            if (awakeCount <= 0) {
                awakeCount = 0;
                API.keepAwake = false;
                mouse.eventTime = performance.now();
            } else {
                API.keepAwake = true;
            }
        },
        set context(cont) { ctx = cont },
        get busy() { log.warn("Wrong busy call") },
		get canSleep() {
			return !mouse.captured && !busy.isBusy && !animation.playing &&  !heartBeat.keepAwake && !alerts.length;
		},
        isBusy(id) {
            if (busy.isBusy) {
                if (id !== undefined) { return busyProcesses.has(id) }
                return true;
            }
            return false;

        },
        registerBusyProcess(id, busyState, text = "") {
            if (busyState) {
                if (!busyProcesses.has(id)) { busyProcesses.set(id, {id, registered: []}) }
                const bp = busyProcesses.get(id);
                bp.registered.push(busy(text));
            } else {
                const bp = busyProcesses.get(id);
                if (bp) {
                    busy.end(bp.registered.pop());
                    !busy.isBusy && (mouse.eventTime = performance.now());
                    busyProcesses.delete(id);
                }
            }
        },
        asleep: 0,
        sleepStarted: 0,
        sleeping(start){
            if(!API.asleep) {
                API.sleepStarted = start;
                API.asleep = sleepWakeFrames;
                ctx.setTransform(4,0,0,4,ctx.canvas.width - 64 ,ctx.canvas.height - 34);
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#000";
                ctx.globalAlpha = 0.75;
                ctx.fillText(textIcons.sleep,0.7,0.7)
                ctx.fillStyle = "#FFF";
                ctx.globalAlpha = 1;
                ctx.fillText(textIcons.sleep,0,0);
                API.fireEvent("onsleep");

            }
        },
        microSleep() {
			ctx.imageSmoothingEnabled = false;
			drawSprite(2, 2, 2);  // flatline
		},
        monitor(time) {
            API.asleep = 0;
            frameCount += 1;
            ctx.imageSmoothingEnabled = false;
            if (lastTime === undefined) {
                lastTime = time;
                return;
            }
            if (!unloadWarning) {
                ctx.fillStyle = "#F00";
                ctx.fillRect(12, 9, 7, 1);
                
            }              
            var size = (mouse.eventDelay / (1000 / 60)) * 32;
            mouse.eventDelay = 0;
            mouseDelay += (size - mouseDelay) * 0.25;
            size = mouseDelay | 0;
            if(size > mouseHangA) {
                ctx.fillStyle = "#000";
                ctx.fillRect(8,7,size + 2, 4);
                ctx.fillStyle = size > mouseHangB ? (size > mouseHangC ? "#F00" : "#F80") : "#FF0";
                ctx.fillRect(9,8,size, 2);
            }
            frameTime = time - lastTime;
            lastTime = time;
            totalTime -= buf[write % 10];
            buf[(write++) % 10] = frameTime;
            totalTime += frameTime;
            var meanFPS = 1000 / (totalTime / 10) | 0;
            if (meanFPS > 0) {  // debugging can mess with this value and to prevent bug when drawing sprite, just ignore neg rates
                if (meanFPS > 10) {
                    const br = (frameCount / beatRate | 0) % 2;
                    drawSprite(br, 2, 2);
                    if (meanFPS > 100) {
                        drawSprite((frameCount / (beatRate * 2) | 0) % 2, br ? 11: 15, 2);
                    } else if (meanFPS > 57) {
                        meanFPS = 60; // The rate is just at 60 so to prevent flicker between 60 and 59 just set to 60
                        drawSprite(9, 11, 2);
                        drawSprite(3, 15, 2);
                    } else {
                        drawSprite(3 + (meanFPS / 10 | 0) % 10, 11, 2);
                        drawSprite(3 + meanFPS % 10, 15, 2);
                    }
                } else {
                    drawSprite(2, 2, 2);  // flatline
                    drawSprite(3 + (meanFPS / 10 | 0) % 10, 11, 2);
                    drawSprite(3 + meanFPS % 10, 15, 2);
                }
            }
  

        },
        showBusy(time){
            mouse.eventTime = performance.now();
            var cx = (ctx.canvas.width / 2) | 0;
            var cy = (ctx.canvas.height * 0.2) | 0;
            var r = Math.sqrt(cx*cx + cy*cy) * 0.025;
            start += 0.15;
            end += 0.15 * endSpeed;
            if(endSpeed > 1){
                if(end > start + Math.PI * 1.8){
                    endSpeed = 0.5;
                }
            }else{
                if(end < start + Math.PI * 0.2){
                    endSpeed = 1.5;
                }
            }
            cy = r * busyDisplayOffset;
            cx = ctx.canvas.width - r * busyDisplayOffset;
            ctx.lineCap = "round";
            ctx.lineWidth = r * 0.4;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(cx,cy,r,start, end);
            ctx.stroke();
            ctx.lineWidth = r * 0.25;
            ctx.strokeStyle = "white";
            ctx.stroke();
            if(busy.progress !== null){
                var a = (-Math.PI * 0.5) + (1 - (busy.progress % 1)) * Math.PI * 2;
                ctx.strokeStyle = "black";
                ctx.lineWidth = r * 0.2;
                ctx.beginPath();
                ctx.arc(cx,cy,r * 1.3 ,-Math.PI * 0.5, a);
                ctx.stroke();
                ctx.lineWidth = r * 0.15;
                ctx.strokeStyle = "RED";
                ctx.stroke();
            }


            if(busy.text !== ""){
                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.strokeStyle = "black";
                ctx.fillStyle = busy.text==="Error!"?"#FBB":"white";
                ctx.strokeText(busy.text,cx,cy);
                ctx.fillText(busy.text,cx,cy);
            }
        },
        showAlerts() {
            if(alerts.length > 0){
                const alert = alerts[0];
                if(alert.time <= 0){
                    alerts.shift();
					mouse.eventTime = performance.now();
                }else{
                    var x = ctx.canvas.width;
                    var center = Math.max(alertSize, alertBase - alertSize * 4);

                    var t = (1 - (alert.time / alertTime) ** 2);
                    var size1 = alertSize * t;
                    var size2 = size1 * 2;
                    center = center - size2 < 0 ? center + size2 : center;
                    var len = t * 200 + size2;
                    var x = ctx.canvas.width - alertSize * 2 * ( 1 - t);
                    ctx.globalAlpha = 1-(t**2);
                    ctx.fillStyle = alertStyles[alert.type];
                    ctx.beginPath();
                    ctx.lineTo(x - len,center- size1);
                    ctx.lineTo(x- size2,center- size1);
                    ctx.lineTo(x- size2,center- size2);
                    ctx.lineTo(x, center);
                    ctx.lineTo(x- size2,center+ size2);
                    ctx.lineTo(x- size2,center+ size1);
                    ctx.lineTo(x - len,center+ size1);
                    ctx.fill();
                    alert.time -= alerts.length;
                }
            }
        },
        addAlert(type){
            if(alerts.length < 4){
                if((type === "info" && showInfo) ||(type === "warn" && showWarn) || (type === "error" && showError)){
                    alerts.push({type, time : alertTime})
                }
            }
			mouse.eventTime = performance.now();
        },
    }
    Object.assign(API, Events(API));
    return API;
}) ();