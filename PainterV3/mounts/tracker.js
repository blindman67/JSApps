

if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") {
    log("[scanSpeed] default 10, 0 for fast scan. Is time between samples.");
    log("[scanPixels] default 100, total approx number of pixels per scan. the larger the number the larger the scan area");
    log("[capture | nocapture] Default no capture. ");
    log("                      If on then uses the sample from previouse frame to search for the next.");
    log("                      If off then uses the image sample in the tracking sprite.");
    log("[auto | manual] Auto Samples images in animation automaticly. Manual reqiers manual frame steps.");
    log("[fine | standard] Fine looks for a match at a sub pixel area (1/2- 1/10 pixel) else (3 - 1 pixels)");
    log("[rotate] Searchs for rotational match.");
    log("'Use mount tracker dialog' to open helper dialog.");
    log("Or enter `run trackerDialog` in the command prompt.");
    return;
}
if(args[0] === "Dialog" || args[0] === "dialog") {
    setTimeout(()=>commandLine("run trackerDialog",true),0);
    return;

}    
const Args = ("scanSpeed: " + args[0] + ", scanPixels: "  + args[1] + ", " + (args[2] ? args[2] : "") + " " + (args[3] ? args[3] : "") + " " + (args[4] ? args[4] : "") + " " + (args[5] ? args[5] : "") + " cornerK:" + (args[6] ? args[6] : "") + " cornerQ:" + (args[7] ? args[7] : "")).toLowerCase();

return (()=>{
    var closed = false;
    function deleted(item) {
        trackingInfo = undefined;
        animation.removeAllEventsByUID(UID);   
        if(positions) {
            positions.length = 0;
            positions = undefined;
            delete B.image;
            B = undefined;
            A.compMode = prevCompMode;
        }
        if(A) {
            delete A.ignorPoints;
            delete A.trackPaths;
        }
        if(trackBase) {
            trackBase = undefined;
        }
        tracks.length = 0;

        extraRenders.clear();
        animation.time = animation.startTime
        closed = true;
        log("tracker clossing")
        
        dismount(UID,true);
        log("tracker dismounted")
        issueCommand(commands.edSprUpdateUI);
        return "closed";
    }
    
       log.clear();
    
            
    function createMeasureSprite(spr) {
        if(Args.includes("corners") || Args.includes("follow")) { return {} }
        selection.clear();
        selection.add(spr);
        const extent = selection.getExtent();
        const B = new Sprite(extent.x + extent.w / 2, extent.y + extent.h / 2, extent.w, extent.h, "Metric");
        var ww = extent.w * 1;
        var hh = extent.h * 1;
        while (ww * hh > (512 * 512) ){ ww /= 2; hh /= 2 }
        media.create({ width : ww | 0, height : hh | 0 , type : "offScreenCanvas", private : true }, img => B.changeImage(img));
        log("Sampler size " + (ww | 0) + "by " + (hh | 0));
        B.sy = B.sx = 1;
        B.key.update();
        createMeasureSprite = undefined;
        return B;
    }
    var trackingInfo = sprites.find(spr => spr.name.includes("TrackingInfo"));
    var maxMetric = ((16 * (256 * 256 * 256) * 3) / (16 * 3)) ** (1/3) /4
    if(Args.includes("color") ) {  maxMetric = ((16 * (256 * 256 * 256 * 256 * 256 * 256) * 3) / (16 * 3)) ** (1/6) / 4 }
    
    var maxRMetric = ((256 * (256 * 256 * 256) * 3) / (256 * 3)) ** (1/3) /4
    if(Args.includes("color") ) { maxRMetric = ((16 * 16 * (256 * 256 * 256 * 256 * 256 * 256) * 3) / (256 * 3)) ** (1/6) / 4 }
    var edgePlot = 0;
    var cyclePlot = 0
    function plotReset() {
        edgePlot = 0;
        //cyclePlot = 0
    };
    function plotAng(val,ang,col, maxV = maxMetric) {
        if(!trackingInfo) {return;}
        //time += edgePlot;
        var W = trackingInfo.image.w;
        var H = trackingInfo.image.h;
        var R = Math.min(W,H) / 4
        var ctx = trackingInfo.image.ctx;
       // var start = animation.startTime;
      //  var end = animation.endTime;
    //    var range = end - start;
       // edgePlot += 1 / (W / range * 20);
       // var x = (time - start) / range * W | 0;
        var y = R -(val / maxV * R) | 0
        var xx = Math.cos(ang) * y + W / 2
        var yy = Math.sin(ang) * y + H / 2
        ctx.fillStyle = col;
        ctx.globalAlpha = 1;
        ctx.fillRect(xx|0, yy|0, 1, 1);
    }
    function plot(val,time,col, maxV = maxMetric) {
        if(!trackingInfo) {return;}
        time += edgePlot;
        var W = trackingInfo.image.w;
        var H = trackingInfo.image.h;
        var ctx = trackingInfo.image.ctx;
        var start = animation.startTime;
        var end = animation.endTime;
        var range = end - start;
        edgePlot += 1 / (W / range * 20);
        var x = ((time - start) / range * W | 0) % W;
        var y = H - (val / maxV * H) | 0
        ctx.fillStyle = col;
        ctx.globalAlpha = 1;
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y- 1, 1, 3);
    }
    function plotC(val,col, maxV = maxMetric) {
        if(!trackingInfo) {return;}
        var W = trackingInfo.image.w;
        var H = trackingInfo.image.h;
        var ctx = trackingInfo.image.ctx;
        cyclePlot += 1;
        var x = cyclePlot % W;

        var y = H - (val / maxV * H) | 0
        ctx.fillStyle = col;
        ctx.globalAlpha = 1;
        ctx.fillRect(x, y, 1, 1);
    }
        
    const tracks = [];        
    var trackCount = 0;
    const trackDesc = {
        top: {
            count : 0,
            x: 0,
            y: 0,
            next : {
                x: 0,
                y: 0,
            }
        },
        bot: {
            count : 0,
            x: 0,
            y: 0,
            next : {
                x: 0,
                y: 0,
            }
        },
    }
    function getTracks(A) {
        const wp1 = utils.point;
        const wp2 = utils.point;
        trackCount = 0;
        
        sprites.eachOfType(spr => {
            var corners;
            if(spr.type.animated && spr.animation.tracks.image) {
                const key = spr.animation.tracks.image.keyAtTime(animation.time - 1);
                if(key) {
                    corners = key.value.desc.corners;
                }
            }else{
                corners = spr.image.desc.corners;
            }
                
                
            if(corners) {
                for(const c of corners) {
                    if(c.next) {
                        spr.key.toWorldPoint(c.x,c.y, wp1);
                        if(A.key.isPointOver(wp1)) {
                            spr.key.toWorldPoint(c.next.x, c.next.y, wp2);
                            if(trackCount < tracks.length) {
                                const tp = tracks[trackCount];
                                tp.x = wp1.x;
                                tp.y = wp1.y;
                                tp.next.x = wp2.x;
                                tp.next.y = wp2.y;                                
                            }else {
                                tracks.push({x:wp1.x, y: wp1.y, next : {x : wp2.x, y: wp2.y}}); 
                            }
                            trackCount ++;
                        }
                    }
                }
            }
            
        },"image");
        if(trackCount > 0) {
            var tx,ty,tnx,tny,bx,by,bnx,bny,tc,bc;
            tc = 0;
            bc = 0;
            
            for(var i = 0; i < trackCount; i ++) {
                const t = tracks[i];
                A.key.toLocalP(t.x,t.y,wp1);
                A.key.toLocalP(t.next.x,t.next.y,wp2);
                if(wp1.y < A.h / 2) {
                    if(tx === undefined) {
                        tx = t.x;
                        ty = t.y;
                        tnx = t.next.x;
                        tny = t.next.y;
                        tc = 1;
                    }else{
                        tx += t.x;
                        ty += t.y;
                        tnx += t.next.x
                        tny += t.next.y
                        tc ++;
                    }
                } else {
                    if(bx === undefined) {
                        bx = t.x;
                        by = t.y;
                        bnx = t.next.x;
                        bny = t.next.y;
                        bc = 1;
                    }else{
                        bx += t.x;
                        by += t.y;
                        bnx += t.next.x
                        bny += t.next.y
                        bc ++;
                    }
                }
            }
            trackDesc.top.count = tc;
            trackDesc.bot.count = bc;
            if(tc > 0) {
                trackDesc.top.x = tx /= tc;
                trackDesc.top.y = ty /= tc;
                trackDesc.top.next.x = tnx /= tc;
                trackDesc.top.next.y = tny /= tc;
            }
            if(bc > 0) {
                trackDesc.bot.x = bx /= bc;
                trackDesc.bot.y = by /= bc;
                trackDesc.bot.next.x = bnx /= bc;
                trackDesc.bot.next.y = bny /= bc;
            }
                
        }else {
            trackDesc.top.count = 0;
            trackDesc.bot.count = 0;
        }            
        
        return;
        
        
        
    }
   
    var positions = [];
    var positionsTracks = [];
    var start = animation.startTime;
    function getAnimationPos() {
        if(A.type.animated) {
            start = animation.startTime;
            var end = animation.endTime;
            var t = start;
            while (t <= end) {
                A.setAnimFrame(t);
                const frame = {};
                if(trackCapture) {
                    const trackFrame = {};   
                    trackFrame.atKey = A.animation.atKey;
                    trackFrame.x = A.x;
                    trackFrame.y = A.y;
                    trackFrame.rx = A.rx;
                    trackFrame.ry = A.ry;
                    trackFrame.sx = A.sx;
                    trackFrame.sy = A.sy;
                    positionsTracks.push(trackFrame);
                    
                }
                frame.x =  A.animation.tracks.x ? A.x : undefined;
                frame.y =  A.animation.tracks.y ? A.y : undefined;
                frame.rx =  A.animation.tracks.rx ? A.rx : undefined;
                frame.ry =  A.animation.tracks.ry ? A.ry : undefined;
                frame.sx =  A.animation.tracks.sx ? A.sx : undefined;
                frame.sy =  A.animation.tracks.sy ? A.sy : undefined;
                
                positions.push(frame);
                t ++;            
            }
            A.setAnimFrame(start);
        }
    }
 
    log("Arguments: " + Args);
    animation.time = animation.startTime;
    var frameStep;
    var trackBase;
   /* if(Args.includes("follow")) { 
        for(const s of selection) {
            if(s.type.image && s.image.desc.corners) {
                trackBase = s;
                break;
            }
        }
        if(trackBase === undefined) {
            log.warn("No selected sprite contained corners to follow");
            return false;
        }
        selection.remove(trackBase);               
    }*/
    function locateTrack() {
        var wp = utils.point;
        var c = trackBase.image.desc.corners;
        for(const cn of c) {
            if(!trackbase.ignorPoints.includes(cn)) {
                var pLen = 0;
                var next = cn.next;;
                while(next) {
                    pLen ++;
                    next = next.next;
                }
                if(pLen > 2) {
                    var w = trackBase.key.toWorldPoint(cn.x, cn.y);
                    if(A.key.isPointOver(w)) {
                        trackBase.ignorPoints.push(cn);
                        var path = [w];
                        next = cn.next;
                        while(next) {
                            trackBase.ignorPoints.push(next);
                            path.push(trackBase.key.toWorldPoint(next.x, next.y));
                            next = next.next;
                        }
                        trackPaths.push(path);
                    }
                    
                    
                    
                }
            }
        }
    }
    
    
    var items = selection.loanOfType(UID, deleted, "image", true, "Requiers 1 sprites to be selected", 1, 1);
    if(items === undefined){ return false  }
    if (items[0].filter !== "none") {
        log.warn("Tracking sprite has a filter. This can effect the quality and speed of this function");
        log.warn("Consider using a capture sprite and apply the filter to it, this will mean the filter is applied only once per frame rather than once for every position sample.");
        log.info("See help Painter [Filters;Capture] and 3rd Party [Mounting.Functions.Tracker]");
    }
    var x=0,y=0,rx =0,ry = 0, sx,sy,rotateScan = false,capturePrev = true, trackCapture = false;
    if(Args.includes("trackcapture")) { trackCapture = true; log("Using track capture") }
    var frameCount;
    var metricInfo = {};
    var A = items[0];
    A.ignorePoints = [];
    A.trackPaths = [];
    getAnimationPos();
    log(positions.length)
    var prevCompMode = A.compMode;
    A.compMode = "difference";
    items = undefined;
    var B = createMeasureSprite(A);
   // var C = items[2];
    var huntResult = false,huntPow= 1,huntPowStart = 1,huntLive = false;
    const dir = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const huntDir = [[0,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
    //const huntRes = [0,0,0,0,0,0,0,0,0];

    const huntRes = new Float64Array(128 * 128);
    var huntX = 64;
    var huntY = 64;
    var huntR = 128*64;
    var huntRDir = 0;
    var huntRSteps = 0;
    var huntStart = false;
    var huntS = 128*64;
    var huntSVal = 10000;
    var scaleHuntStart = 16;
    var scaleHuntStep = 4;
    var scaleHuntRate= 80;
    var scaleHuntLimit= 1;
    var scx = 0,scy;
    var huntSDir = 0;
    var huntSize = 0;
    var huntCount = 0;
    var pow = 3;
    var powFine = 0.5;
    var powStart = 3;
    var scanPixelsStart;
    var rpow = 1;
    var best = [];
    var metricFunc = localProcessImage.calcImageValueMetric;
    if(Args.includes("color") ){ metricFunc = localProcessImage.calcImageColorMetric }
    
    function getMetric() {
        B.fitTo(A);
        spriteRender.captureA(B, B.image, true);
        var value = metricFunc(B.image,A.image, rotateScan, metricInfo);  
        if(scan.prevVal === -1) { scan.prevVal = value; scan.away = 0 }
        if(value > scan.prevVal) { scan.away ++ }
        if(value < scan.prevVal) { scan.away -- }
        if(value <scan.best.val){
            scan.best.x = scan.x;
            scan.best.y = scan.y;
            scan.best.r = scan.r
            scan.best.val = value;
            best.push(value | 0);
            scan.best.cc ++;
            if(selection.length === 0 && selection[0] === A) {
                widget.update();
            }
        }        
        scan.prevVal = value;
    }
    function scanStep(){
        scan.c -= 1;
        if(scan.c <= 0) {
            scan.searchCount ++;
            if (scan.searchCount === 4) { return  true }
            scan.d += 1;
            scan.d %= dir.length;
            if(scan.d === 0 || scan.d === 2) { scan.dCount += 1 }
            scan.c = scan.dCount;
            scan.dx = dir[scan.d][0];
            scan.dy = dir[scan.d][1];
        }
        return false; 
    }
    const scan = {
        x :0,
        y : 0,
        dx : 0,
        dy : 0,
        val : 10000,
        best : {
            x : 0,
            y : 0,
            sx : 0,
            sy : 0,
            rx : 0,
            ry : 0,
            val : 0,
        },
        count : 0,
        prevVal : -1,
        newOrigin() {
            scan.x = 0;
            scan.y = 0;
            scan.dx = 1;
            scan.dy = 0;
            scan.dCount = 1; 
            scan.c = 1; 
            scan.d = 0;    
            scan.r = 0;
            scan.sx = sx;
            scan.sy = sy;
            scan.prevVal = -1;
            
        },            
        reset() {
            scan.breakAway  = "";
            pow = powStart;
            scanPixels = scanPixelsStart
            scanSize = ((scanPixels ** 0.5) / 2) ** 2;
            plotReset();
            A.a = alphaHigh;
            if (positions.length) {
                const pos = positions[animation.time - start]
                x = pos.x !== undefined ? pos.x : A.x;
                y = pos.y !== undefined ? pos.y : A.y;
                rx = pos.rx !== undefined ? pos.rx : A.rx;
                ry = pos.ry !== undefined ? pos.ry : A.ry;
                sx = pos.sx !== undefined ? pos.sx : A.sx;
                sy = pos.sy !== undefined ? pos.sy : A.sy;
            } else {
                x = A.x;
                y = A.y;
                rx = A.rx;
                ry = A.ry;
                sx = A.sx;
                sy = A.sy;
            }
            scan.best.val =  255;
            scan.best.hasBest = false;
            
            scan.newOrigin();
            
            huntPow = huntPowStart;
            huntStart == true;
            scan.count = scanPixels; 
            setTimeout(scan.scanFunc,scanSpeed);
            dirList = "";
        },
        newCorners() {
            localProcessImage.harrisCornerDetect(A.image, cornerK, cornerSize, cornerQ);
            A.image.desc.cornersStatic = [];
            allCorners.push(A.image.desc.corners);
            allCornersStatic.push(A.image.desc.cornersStatic);            
            if(scanToEnd){
                if(animation.time < animation.endTime) {
                    setTimeout(() => animation.addTime = frameStep, scanSpeed);
                }else{
                    log("Processing corners");
                    setTimeout(() => {
                        localProcessImage.processCorners(A.image, allCorners, allCornersStatic,"cleanpoints"+"isolatestatic" + "near" + "paths" + "removeconverging" + "similarpath"+ "pathlinking");
                        log("Corners complete");
                        log("-------------------------------------");
                        
                        setTimeout(()=>deleted(),scanSpeed);
                    },scanSpeed);                    
                }
            }            
            
        },
        newScale() {
            huntRes.fill(-1);
            huntS = 128*64;
            huntSDir = 0;
            scan.best.sx = sx;
            scan.best.sy = sy;
            huntStart = true;

            huntSize = -scaleHuntStart;
            huntSVal = 10000;
            setTimeout(scan.nextScale, 1);
        },
        nextScale() {
            const isBest = val => {
                if(val < scan.best.val) {
                    scan.best.val = val;
                    scan.best.sx = A.sx;
                    scan.best.sy = A.sy;
                    scan.best.hasBest = true;
                }
                
            };
            huntCount ++;
            A.a = 1;       
            var sf,found = 0, val,valS,valB,v, at = 0,hs;
            
            if(huntStart) {
                if(huntSize < 0) {
                    sf = 1 / ((scaleHuntRate - huntSize / 2) / scaleHuntRate);
                } else {
                    sf = (scaleHuntRate + huntSize / 2) / scaleHuntRate;
                }
                A.sx = sx * sf;
                A.sy = sy * sf;
                A.key.update();
                B.fitTo(A);
                spriteRender.captureA(B, B.image, true);
                isBest(val = metricFunc(B.image,A.image, false, metricInfo));
                huntSize += scaleHuntStep;
                if(huntSize <= scaleHuntStart) {
                    setTimeout(scan.nextScale, scanSpeed);
                    return;
                }
                sx = scan.best.sx;
                sy = scan.best.sy;
                huntSVal = scan.best.val;
                huntSize = scaleHuntStart / scaleHuntStep;
                huntStart = false;
                setTimeout(scan.nextScale, scanSpeed);
                return;
                
            }
            
            if (huntSize === scaleHuntStart) {
                A.sx = sx;
                A.sy = sy;
                A.key.update();
                B.fitTo(A);
                spriteRender.captureA(B, B.image, true);
                isBest(val = metricFunc(B.image,A.image, false, metricInfo)) 
            } else {
                val = huntSVal;
            }

            sf = (scaleHuntRate + huntSize / 2) / scaleHuntRate;
            A.sx = sx * sf;
            A.sy = sy * sf;
            A.key.update();
            B.fitTo(A);
            spriteRender.captureA(B, B.image, true);
            isBest(valB = metricFunc(B.image,A.image, false, metricInfo)) 
            A.sx = sx * (1/sf);
            A.sy = sy * (1/sf);
            A.key.update();
            B.fitTo(A);
            spriteRender.captureA(B, B.image, true);
            isBest(valS = metricFunc(B.image,A.image, false, metricInfo)) 
            huntSize /= 2;
            if(huntSize < scaleHuntLimit) {
                scan.scaleCompleted()
                return;
            }
            if(val < valB && val < valS) {
                huntSVal = val;                    
                setTimeout(scan.nextScale, scanSpeed);
                return;                    
                
            }
            if(valB < valS) {
                sx *= sf;
                sy *= sf;
                huntSVal = valB;
                setTimeout(scan.nextScale, scanSpeed);
                return;                    
            }
            sx *= 1/sf;
            sy *= 1/sf;
            huntSVal = valS;
            setTimeout(scan.nextScale, scanSpeed);
                 
        
            
        },
        scaleCompleted(){
            A.sx = scan.best.sx;
            A.sy = scan.best.sy;
            A.a = 1;
            B.a = 0;
            A.key.update();
            A.addAnimKey({name:"sx", time: currentFrame, value : scan.best.sx})
            A.addAnimKey({name:"sy", time: currentFrame, value : scan.best.sy})
            
            best.length = 0;
            rpow = -rpow;
            if(scanToEnd){
                if(animation.time < animation.endTime) {
                    setTimeout(() => animation.addTime = frameStep, 18);
                }else{
                    scan.count = -10;
                    deleted();
                }
            }
            
            return false;
          
            
            
        },        
        newRotate() {
            //huntRes.fill(-1);
           // huntR = 128*64;
            huntRDir = -8;
            huntRSteps = 8;
            scan.bestHunt = 255;
            huntStart = true;
            setTimeout(scan.nextRotate, 1);
            
        },
        nextRotate() {

            A.a = 1;   
          
            var found = 0, val;
            
            if(huntStart) {
                A.rx = rx + scan.r + rpow * huntRDir * huntPow * 4 ;
                A.ry = ry + scan.r + rpow * huntRDir * huntPow * 4 ;
                A.key.update();
                B.fitTo(A);
                spriteRender.captureA(B, B.image, true);
                val = metricFunc(B.image,A.image,true, metricInfo); 
                plot(val,currentFrame,"#D006", maxRMetric);
                //plotAng(val,A.rx,"#D006", maxRMetric);
                if(val <= scan.best.val) {
                    scan.best.val = val;
                    scan.best.rx = rx + scan.r + rpow * huntRDir * huntPow * 4 ;
                    scan.best.ry = ry + scan.r + rpow * huntRDir * huntPow * 4 ;
                }
                       
                if(huntRDir < 9) {
                    huntRDir ++;
                    setTimeout(scan.nextRotate,scanSpeed);
                    return;
                }
                huntStart = false;
            } else {
                huntRDir -= 1;
               const pAng =  A.rx = rx + scan.r + rpow * huntRDir * huntPow * 4 ;
                A.ry = ry + scan.r + rpow * huntRDir * huntPow * 4 ;
                A.key.update();
                B.fitTo(A);
                spriteRender.captureA(B, B.image, true);
                var valCCW = metricFunc(B.image,A.image,true, metricInfo); 
                plotC(A.rx % Math.PI2,"#D80F", Math.PI2);
                if(valCCW <= scan.best.val) {
                    scan.best.val = valCCW;
                    scan.best.rx = rx + scan.r + rpow * huntRDir * huntPow * 4 ;
                    scan.best.ry = ry + scan.r + rpow * huntRDir * huntPow * 4 ;
                    huntRSteps --;
                    plotC(valCCW,"#D80C", maxRMetric);
                }else{
                    plotC(valCCW,"#D806", maxRMetric);
                }
                huntRDir += 2;
                A.rx = rx + scan.r + rpow * huntRDir * huntPow * 4 ;
                A.ry = ry + scan.r + rpow * huntRDir * huntPow * 4 ;
                A.key.update();
                B.fitTo(A);
                spriteRender.captureA(B, B.image, true);
                var valCW = metricFunc(B.image,A.image,false, metricInfo); 
                plotC(A.rx % Math.PI2,"#8D0F", Math.PI2);

                if(valCW <= scan.best.val) {
                    scan.best.val = valCW;
                    scan.best.rx = rx + scan.r + rpow * huntRDir * huntPow * 4 ;
                    scan.best.ry = ry + scan.r + rpow * huntRDir * huntPow * 4 ;
                    huntRSteps --;
                    plotC(valCW,"#D80C", maxRMetric);
                }else{
                    plotC(valCW,"#D806", maxRMetric);
                }
                if(valCW < valCCW) {
                    //huntRDir += 1;
                }else {
                    huntRDir -= 2;
                }
                plotC(huntRDir+huntPow * 20,"#0006",  3 * 40);
                huntRSteps --;
                if(huntRSteps > 0) {
                      setTimeout(scan.nextRotate,scanSpeed);
                    return;
                }                    
                       
                
                
                
                
            }
            
            if(huntPow > 0.2) {
                rx = scan.best.rx;
                ry = scan.best.ry;
                plotC(scan.best.val,"#FFF6", maxRMetric);
                 plotAng(scan.best.val,rx ,"#0004",maxRMetric);
                huntRDir = 0;
                scan.r = 0;
                if(huntPow >= 3) { huntPow = 1.5 }
                else if(huntPow === 1.5) { huntPow = 1 }
                else if(huntPow === 1) { huntPow = 0.5 }
                else if(huntPow === 0.5) { huntPow = 0.2 }
                huntRSteps = 8;
                setTimeout(scan.nextRotate,scanSpeed);
                return;
            }
            scan.rotateCompleted();
            return;

            
        },
        rotateCompleted(){

            A.rx = scan.best.rx;
            A.ry = scan.best.ry;
            plot(scan.best.val,currentFrame + 0.8,"#F88",maxRMetric);
            plotC(scan.best.val,"#FFFC", maxRMetric);
            //plot(scan.best.val,currentFrame + 0.8,"#F88",maxRMetric);
            plotAng(scan.best.val,A.rx ,"#FFF",maxRMetric);
           // log("best used " + (scan.best.rx * (180 / Math.PI)).toFixed(2)+"deg : "+scan.best.val.toFixed(2));
            A.a = 1;
            B.a = 0;
            A.key.update();
            A.addAnimKey({name:"rx", time: currentFrame, value :  scan.best.rx})
            A.addAnimKey({name:"ry", time: currentFrame, value :  scan.best.ry})
            
            best.length = 0;
            huntPow =huntPowStart;
            scan.best.val = 1000;
            if(scanToEnd){
                if(animation.time < animation.endTime) {
                    setTimeout(() => animation.addTime = frameStep,18);
                }else{
                    scan.count = -10;
                    deleted();
                }
            }else{
                if(animation.time < animation.endTime) {/* log("At last frame");*/}
            }
            return false;
          
            
            
        },
        newFollow() {
            
            setTimeout(scan.follow, 1);
        },
        follow() {
            getTracks(A);
            //const wp1 = utils.point,wp2 = utils.point,wp3 = utils.point,wp4 = utils.point;
            const tp = trackDesc.top;
            const bt = trackDesc.bot;
            var nx = 0, ny = 0, na = 0, ns = 1;
            if(trackCount > 0) {
                if(tp.count > 1 && bt.count > 1) {
                    //A.key.toLocalPoint(tp.x, tp.y, wp1);
                    //A.key.toLocalPoint(tp.next.x, tp.next.y, wp2);
                    //A.key.toLocalPoint(bt.x, bt.y, wp3);
                    //A.key.toLocalPoint(bt.next.x, bt.next.y, wp4);
                    nx = tp.next.x - tp.x;
                    ny = tp.next.y - tp.y;
                    var dx = bt.x - tp.x;
                    var dy = bt.y - tp.y;
                    var dnx = bt.next.x - tp.next.x;
                    var dny = bt.next.y - tp.next.y;
                    const d = (dx * dx + dy * dy) ** 0.5;
                    const dn = (dnx * dnx + dny * dny) ** 0.5;
                    if(d > 0 && dn > 0) {
                        dx /= d;
                        dy /= d;
                        dnx /= dn;
                        dny /= dn;                    
                        na = Math.asin(dx * dny - dy * dnx);
                        //ns = dn / d;
                    }
                    
                    
                    
                }else {
                    for(var i = 0; i < trackCount; i ++) {
                        const t = tracks[i];
                        nx += t.next.x - t.x;
                        ny += t.next.y - t.y;                    
                    }
                    nx /= trackCount;
                    ny /= trackCount;
                }
                //log("X: " + nx.toFixed(2) + "Y: " + ny.toFixed(2) + " count " + trackCount);
            }
            scan.best.x = nx;
            scan.best.y = ny;
            scan.best.rx = na;
            scan.best.ry = na;
            scan.best.sx = ns;
            scan.best.sy = ns;
            
            scan.followComplete();
            
        },
        followComplete() {
            A.x = x + scan.best.x;
            A.y = y + scan.best.y;
            A.rx = rx + scan.best.rx;
            A.ry = ry + scan.best.ry;
          //  A.sx = sx * scan.best.sx;
          //  A.sy = sy * scan.best.sy;
            A.a = 1;
            B.a = 0;
            plot(scan.best.val,currentFrame + 0.6,"#8F8");
            A.key.update();

            A.addAnimKey({name:"x", time: currentFrame, value : x + scan.best.x})
            A.addAnimKey({name:"y", time: currentFrame, value : y + scan.best.y})
            A.addAnimKey({name:"rx", time: currentFrame, value : rx + scan.best.rx})
            A.addAnimKey({name:"ry", time: currentFrame, value : ry + scan.best.ry})
           // A.addAnimKey({name:"sx", time: currentFrame, value : sx * scan.best.sx})
           // A.addAnimKey({name:"sy", time: currentFrame, value : sy * scan.best.sy})
            if(scanToEnd){
                if(animation.time < animation.endTime) {
                    setTimeout(() => animation.addTime = frameStep,18);
                }else{
                    scan.count = -10;
                    deleted();
                }
            }                   
            
        },
        newHunt() {
            huntRes.fill(-1);
            huntX = 64;
            huntY = 64;
            scan.x = 0;
            scan.y = 0;
            scanSize = 0;
            if(huntLive) {
                scan.hunt();
            }else{
                setTimeout(scan.hunt, 10);
            }
        },
        hunt() {
            var count = 2
           if(huntLive) {
               count = 10;
               
           }
           while(count--){
                var h = 0;
                A.a = 1;  
                scan.bestHunt = 255;
                scan.bestHuntDir = -1;

                var scans = 0;
                while(h < huntDir.length) {
                    const hx = huntDir[h][0];
                    const hy = huntDir[h][1];
                    const idx = huntX + hx  + (huntY + hy) * 128;
                    if(huntRes[idx] !== -1){
                        value = huntRes[idx];
                    }else{
                        scans ++;
                        A.x = x + (scan.x + hx)*huntPow;
                        A.y = y + (scan.y + hy)*huntPow;
                        A.key.update();                     
                        B.fitTo(A);
                        spriteRender.captureA(B, B.image, true);
                        var value = metricFunc(B.image,A.image, rotateScan, metricInfo);    
                        huntRes[idx] = value;
                        log(x +" : "+value)
                        plot(value,currentFrame,"#0D06");
                    }
                    if(value < scan.bestHunt){
                        scan.bestHunt = huntRes[idx];
                        scan.bestHuntDir = h;
                        scan.bestHuntX = hx;
                        scan.bestHuntY = hy;
                        scan.bestHuntIdx = idx;
                        if(value < scan.best.val) {
                            scan.best.x = scan.x + scan.bestHuntX;
                            scan.best.y = scan.y + scan.bestHuntY;    
                            scan.best.hasBest = true;    
                            scan.best.val =  value;
                        }                        
                    }
                    h++;
                }
                if(scans === 0){
                    

                    scan.best.x = scan.x + scan.bestHuntX;
                    scan.best.y = scan.y + scan.bestHuntY;
                    scan.best.r = scan.r
                    scan.best.val = huntRes[scan.bestHuntIdx];
                    if(huntLive) {
                        scan.huntComplete();
                    }else if(huntPow > 0.6) {
                        x = x + scan.best.x * huntPow;
                        y = y + scan.best.y * huntPow;                    
                        if(huntPow === 3) { huntPow = 1.5 }
                        else if(huntPow === 1.5) { huntPow = 1 }
                        else if(huntPow === 1) { huntPow = 0.5 }
                        else if(huntPow === 0.5) { huntPow = 0.2 }
                        
                        scan.newHunt();
                    }else{
                        scan.huntComplete();
                    }
                    return;

                }else {
                    huntX += huntDir[scan.bestHuntDir][0];
                    huntY += huntDir[scan.bestHuntDir][1];
                    if(huntX < 1 || huntY < 1 || huntX > 126 || huntY > 126) {
                        if(scan.best.hasBest) {
                            x = x + scan.best.x * huntPow;
                            y = y + scan.best.y * huntPow;    
                            if(huntLive) {
                                scan.huntComplete();                        
                            }
                            else if(huntPow === 0.5) { huntPow = 1 }
                            else if(huntPow === 1) { huntPow = 1.5 }
                            else if(huntPow === 1.5) { huntPow = 3 } 
                            else if(huntPow === 3) { huntPow = 4 } 
                            else if(huntPow === 4) { huntPow = 5 } 
                            else {
                                
                                scan.huntComplete();   
                            }                            
                            
                            
                        }else {
                             
                            scan.huntComplete();
                        }
                        return;
                    }
                        
                    scan.x +=  huntDir[scan.bestHuntDir][0];
                    scan.y +=  huntDir[scan.bestHuntDir][1];

                }
                
           }
            setTimeout(scan.hunt,scanSpeed);        
            
        },
        huntComplete() {
            
            A.x = x + scan.best.x * huntPow;
            A.y = y + scan.best.y * huntPow;
            A.a = 1;
            B.a = 0;
            plot(scan.best.val,currentFrame + 0.6,"#8F8");
            A.key.update();

            A.addAnimKey({name:"x", time: currentFrame, value : x + scan.best.x * huntPow})
            A.addAnimKey({name:"y", time: currentFrame, value : y + scan.best.y * huntPow})
            if(scanToEnd){
                if(animation.time < animation.endTime) {
                    setTimeout(() => animation.addTime = frameStep,18);
                }else{
                    scan.count = -10;
                    deleted();
                }
            }                
        },

    }

    var scanSpeed = 10;
    var scanPixels = 10;
    var scanToEnd = false;
    if(Args.includes("scanspeed")) { scanSpeed = Number(Args.split("scanspeed:")[1].split(",")[0].trim()) }
    else { scanSpeed = 10 }
    if(Args.includes("scanpixels")) { scanPixels = Number(Args.split("scanpixels:")[1].split(",")[0].trim()) }
    else { scanPixels = 25 }
    if(Args.includes("absolute")) { capturePrev = false; log("Will not capture samples") }

    scanToEnd = true;
    huntResult = true
    var pow = 0.5;
    var powFine = 0.1;
    if(scanPixels >= 30) {
        huntPowStart = 3;
        pow = 6;
    }else if( scanPixels > 15) {
        huntPowStart = 1.5;
        pow = 3;
    }else if( scanPixels > 10) {
        pow = 2;
        huntPowStart = 1;
    }else if( scanPixels > 5) {
        pow = 1;       
        huntPowStart = 0.5;
    }else { pow =1; huntPowStart = 0.2; }
    scanPixels = (scanPixels / pow) ** 2 * 4;
    scanPixelsStart = scanPixels;
    log("scanPixels: "+scanPixels)
    powStart = pow;    
    scan.scanFunc = scan.newHunt;
    var cornerK = 0.05;
    var cornerQ = 50;
    var currentFrame = animation.time;    
    const allCorners = [];    
    const allCornersStatic = []; 
    var followTrack = false;
    var alphaLow = 0;
    var alphaHigh = 1;
    if(Args.includes("follow")) { 
        followTrack = true;
        scan.scanFunc = scan.newFollow;
            
    
    
    } else if(Args.includes("corners")) { 
        scan.scanFunc = scan.newCorners;
        var cornerSize = Number(Args.split("corners")[1].split(" ")[0]);//includes("corners3") ? 3 : (Args.includes("corners4") ? 4 : 5);
        if(Args.includes("cornerk")) { cornerK = Number(Args.split("cornerk:")[1].split(" ")[0].trim()) }
        if(Args.includes("cornerq")) { cornerQ = Number(Args.split("cornerq:")[1].split(" ")[0].trim()) }
        if(selection[0].type.image) {
            if(selection[0].type.animated && selection[0].animation.tracks.image) {                    
                for(const key of selection[0].animation.tracks.image.keys) {
                    if(key.value.desc.corners) { key.value.desc.corners = undefined }
                    if(key.value.desc.cornersStatic) { key.value.desc.cornersStatic = undefined }
                }
            }
        }   
        log("Capturing corners. K val: " + cornerK + " Block: " + cornerSize + " Quan: " + cornerQ);
        if(cornerQ < 1) {
            cornerQ = 1;
        }
        if(animation.time === 0) {
            localProcessImage.harrisCornerDetect(A.image, cornerK, cornerSize, cornerQ);
            A.image.desc.cornersStatic = [];
            allCorners.push(A.image.desc.corners);
            allCornersStatic.push(A.image.desc.cornersStatic);          
        } else {
            log.warn("Missed first frame....");
        }
        alphaHigh = alphaLow = A.a;
        //currentFrame = -1;      
        //extraRenders.addOneTimeReady(frameReady);        

         

    }else if(Args.includes("scale")) { 

        huntResult = false;
        var scaleScan = true;
        var rotateScan = false;
        var diag = Math.max(A.w * A.sx, A.h * A.sy);
        rpow = 2 / diag;
        scanPixels = diag / 8 | 0;
        scan.scanFunc = scan.newScale;
    }else if(Args.includes("edges")) {
    }else if(Args.includes("rotate")) { 
        huntResult = false
        var diag = ((256*256*2) ** 0.5) * Math.PI;
        rpow = (Math.PI / diag);
        scanPixels = diag / 8 | 0;
        log("Rotate power = " + rpow);
        scan.scanFunc = scan.newRotate;
        
        var rotateScan = true;
        
    }
    if(scanSpeed === 0) { log("Will use fast scan") }
    var scanSize = ((scanPixels ** 0.5) / 2) ** 2;
    function beforTimeChange() {
        if (frameStep === undefined) { 
            animation.videosSeekError = false;
            frameStep = timeline.frameStep;
        }
        B.a = 0;
        A.a = alphaLow;
        if(capturePrev){
            if(trackCapture) {
                if(positionsTracks.length){
                    const tt = animation.time - animation.startTime;
                    if(positionsTracks[tt].atKey){    
                        A.x =  positionsTracks[tt].x;
                        A.y =  positionsTracks[tt].y;
                        A.rx = positionsTracks[tt].rx;
                        A.ry = positionsTracks[tt].ry;
                        A.sx = positionsTracks[tt].sx;
                        A.sy = positionsTracks[tt].sy;
                         A.key.update();
                         spriteRender.captureA(A,A.image, true);
                    }


                    
                    
                }
            }else{
                if (positions.length) {
                    A.x =  positions[0].x;
                    A.y =  positions[0].y;
                    A.rx = positions[0].rx;
                    A.ry = positions[0].ry;
                    A.sx = positions[0].sx;
                    A.sy = positions[0].sy;
                    
                    A.key.update();
                } 
                spriteRender.captureA(A,A.image, true);
            }
        }
    }    
    function animTimeChanged() {
        //log("Anim change time : " + animation.time);
        if(animation.time >= currentFrame + 1){
            extraRenders.addOneTimeReady(frameReady);
        }
    }
    function frameReady(){
        if (animation.videosSeekError) {
            log.warn("A video failed to seek. Can not continue");
            scan.count = -10;
            deleted();
        } else {
            currentFrame = animation.time;
            scan.reset();
        }
    }
    
    var dirList = "";
    if(rotateScan) { timeline.addKeyToSpr(A, commands.animSetKeyRotate) }
    else if(scaleScan) { timeline.addKeyToSpr(A, commands.animSetKeyScale) }
    else { timeline.addKeyToSpr(A, commands.animSetKeyPos) }

    animation.addEvent("change", animTimeChanged, UID);
    animation.addEvent("befortimechange", beforTimeChange, UID);
    return {dismount: deleted};
})();