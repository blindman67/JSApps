"use strict";
const animation = (()=> {
    var currentTime = 0;
    var currentTimeSeconds = 0;



    var lightboxTime = 0;
    var lightboxTimeSeconds = 0;
    var lightboxOn = false;
    var lightBoxConfig = [
        {offset:-1, alpha: 0.25, cycle: false, rendered: -1},
        {offset:-2, alpha: 0.2,  cycle: false, rendered: -1},
        {offset:-3, alpha: 0.2,  cycle: false, rendered: -1},
        {offset:-4, alpha: 0.15, cycle: false, rendered: -1},
        {offset:-5, alpha: 0.15, cycle: false, rendered: -1},
        {offset:-6, alpha: 0.1,  cycle: false, rendered: -1},
        {offset:-7, alpha: 0.1,  cycle: false, rendered: -1},
        {offset:-8, alpha: 0.1,  cycle: false, rendered: -1},
        {offset:-9, alpha: 0.1,  cycle: false, rendered: -1},
    ];
    var currentLightBoxConfig;
    var lightBoxLayerCount = 1;
    var lightboxUpdate = false;


    var startTime = 0;
    var endTime = 120;
    var maxLength = 120;
    var maxSetLength = 120;
    var playSpeed = 1;
    var videosSeeking = 0;
    var lastSeekPos = -1;
    var ignoreMedia = false;
    const animationChangeEvent = {
        type : "",
    };
	function updatePlaySpeed() { 
		for (const soundSpr of displayedSounds) { soundSpr.sound.rate = playSpeed }
	}
    function playSprites() {
        if (sprites.hasVideo) {
            for (const video of displayedVideos.values()) {
                if (video.paused) {
                    video.holdingFrame = false;
                    video.playbackRate = playSpeed;
					video.loop = true;
                    video.play();
                }
            }
        }

		for (const soundSpr of displayedSounds) {
			Audio.play(soundSpr, playSpeed, currentTime / 60, startTime / 60, endTime / 60);
		}
    }
    function pauseSprites() {
        if (sprites.hasVideo) {
            for (const video of displayedVideos.values()) {
				video.loop = false;
                if (!video.paused) { video.pause() }
            }
        }

		for (const soundSpr of displayedSounds) { Audio.stop(soundSpr) }	
    }
    function updateLightboxSprites(idx) {
        const time = lightBoxConfig[idx].rendered;
        var hasSelected = false;
        sprites.markImages(false);
        sprites.updateAtTime(time);
		if (animation.ticked || !sprites.functionLinksAnimated) { kinematics.update(true) };

    }
    function doLightbox() {
        if(animation.lightboxOn) {
            const updateState = sprites.mustUpdate;
            sprites.mustUpdate = false;
            if(mouse.cMouse.changedView || animation.lightBoxNeedsUpdate) {
                sprites.saveStates();
                const lbLay = animation.lightBoxLayers - 1;
                var layer = lbLay;
                var fade = 0.12;
                while (layer > -1 && !animation.lightbox(layer)) { layer -- }
                spriteRender.clearLightbox();
                if (layer > -1) {
                   spriteRender.drawLightbox(true, 0, currentLightBoxConfig.alpha);
                    layer --;
                    while(layer > -1) {
                        animation.lightbox(layer) && spriteRender.drawLightbox(true, fade, currentLightBoxConfig.alpha);
                        layer --;

                    }
                }
                lightboxUpdate = true;
                sprites.restoreStates();
            }
            sprites.mustUpdate = updateState;
        }
    }
    function fastSeek(time) {
        sprites.each(spr => { if(spr.type.animated || spr.type.animate) { spr.setAnimFrame(time) } });
        sprites.update();
        if (sprites.hasFunctionLinks && sprites.functionLinksOn) {
            sprites.eachFunctionLink(spr => {spr.updateFunctionLink() })
        }
    }
    function videoSeeked(event) {
        videosSeeking --;
        if (videosSeeking <= 0) {
			videosSeeking = 0;
			API.videosReady = true;
		}
    }
    var ignoreVideoUpdate = false;
    function updateSprites() {
        if(API.lightboxOn && lightboxUpdate) { doLightbox(); }
        if (API.playing === false) {
            if (ignoreVideoUpdate) {
                ignoreVideoUpdate = false;
            } else {
                var seekVideo = false;
                if (videosSeeking > 0) { API.videosSeekError = true; }
                if (lastSeekPos !== currentTimeSeconds) {
                    videosSeeking = 0;
                    API.videosReady = true;
                    seekVideo = true;
                }
                if (sprites.hasVideo) {
                    for (const video of displayedVideos.values()) {
                        if (!video.paused) { video.pause() }
                        if ((video.duration !== 0 && video.duration !== Infinity) && currentTimeSeconds >= video.duration && video.currentTime < video.duration) {
                            API.videosReady = false;
                            if (seekVideo) {
                                videosSeeking += 1;
                                video.seekTo(video.duration);
                            }
                        } else if(video.currentTime < currentTimeSeconds || video.currentTime >= currentTimeSeconds + (1/120)) {
                            API.videosReady = false;
                            if (seekVideo) {
                                videosSeeking += 1;
                                video.seekTo(currentTimeSeconds);
                            }
                        }
                    }
                }
            }
        }
        sprites.each(spr => { if(spr.type.animated || spr.type.animate) { spr.setAnimFrame(currentTime) } });
        
        

		for (const soundSpr of displayedSounds) {
            Audio.vol(soundSpr);
		}        
        sprites.mustUpdate = true;
        if(lastSeekPos !== currentTimeSeconds) {
            API.ticked = true;
        } else {
            API.ticked = false;
        }
        lastSeekPos = currentTimeSeconds;
    }
    const displayedVideos = new Set();
    sprites.addEvent("videoAdded", (e, type, video) => {
        if (!displayedVideos.has(video) ) {
            displayedVideos.add(video);
            if (!video.onSeeked) {
                video.onSeeked = videoSeeked;
            }
        }
    });
    sprites.addEvent("videoRemoved",(e, type, video) => {
        if (displayedVideos.has(video) ) {
            video.onSeeked = null;
            displayedVideos.delete(video)
        }
    });
    const displayedSounds = new Set();
    sprites.addEvent("soundAdded",(e, type, soundSpr) => !displayedSounds.has(soundSpr) && displayedSounds.add(soundSpr));
    sprites.addEvent("soundRemoved",(e, type, soundSpr) => displayedSounds.has(soundSpr) && displayedSounds.delete(soundSpr));
	
    function getTimeExtent(videoOnly) {
        var min = maxSetLength;
        var max = videoOnly ? 0 : maxSetLength;
        if(!videoOnly){
            sprites.eachOfType(spr => {
                    min = Math.min(min, spr.animation.startTime);
                    max = Math.max(max, spr.animation.endTime);
                },"animated"
            );
        }
		for(const soundSpr of displayedSounds.values()) { max = Math.max(max, soundSpr.image.desc.sBuffer.duration * 60) }
        for(const video of displayedVideos.values()) { max = Math.max(max, video.duration * 60) }
        !videoOnly && min >= max && (max = min);
        return max;
    }
    const API = {
        APIName : "animation",
        startTick : 0,
        ticked: false,
        videosReady : false,
        videosSeekError : false,
        get lightboxOn() { return lightboxOn },
        set lightboxOn(on) {
            if(on && !spriteRender.lightbox) {
                lightboxOn = true;
                spriteRender.lightbox = true;
            }else if(!on) {
                lightboxOn = false;
                spriteRender.lightbox = false;
            }
        },
        get lightBoxLayers() { return lightBoxLayerCount },
        set lightBoxLayers(val) {
            lightBoxLayerCount = val;
            var i;
            for(i = 0; i < val; i++) { lightBoxConfig[i].rendered = -1 }

        },
        getLightBoxLayconfig(layId) {
            const fig = lightBoxConfig[layId];
            if (fig) {
                return {...fig};
            }
        },
        lightBoxConfig,
        configLightBoxLayer(layId, offsetTime, alpha, cycle) {
            const lbc = lightBoxConfig[layId];
            if (lbc) {
                lbc.offset = offsetTime ?? lbc.offset;
                lbc.alpha = alpha ?? lbc.alpha;
                lbc.alpha = lbc.alpha < 0.1 ? 0.1 : lbc.alpha > 0.75 ? 0.75 : lbc.alpha;
                lbc.cycle = (cycle ?? lbc.cycle) === true;
                lbc.rendered = -1;
            }
        },
		set lightBoxNeedsUpdate(value) {
			lightboxUpdate = value;
		},
        get lightBoxNeedsUpdate() {
            var i;
            if (lightboxUpdate) {
                lightboxUpdate = false;
                return true;
            }
            for (i = 0; i < lightBoxLayerCount; i++) {
                const lbc = lightBoxConfig[i];
                if (currentTime + lbc.offset !== lbc.rendered) { return true }
            }
            return false;
        },
        lightbox(idx) {
            const lbc = currentLightBoxConfig = lightBoxConfig[idx];
            var time = currentTime + lbc.offset;
            if (lbc.cycle) {
                if (time < startTime) { time = endTime - (startTime - time) }
                if (time > endTime) { time = startTime + (time - endTime) }
            } else {
                if (time < startTime || time > endTime) {
                    return false;
                }
            }
            //lightBoxRenderedTimes[idx] = time;
            lbc.rendered = time;
            updateLightboxSprites(idx);
            lightboxTime = time;
            lightboxTimeSeconds = time / 60;
            return true;
        },
        updateSprWidgetAnimPath(spr) {
            const updateState = sprites.mustUpdate;
            const lightboxUpdateState = lightboxUpdate;
            const resetTime = currentTime;
            sprites.mustUpdate = false;
            lightboxUpdate = false
            
            sprites.saveStates();
            var i = startTime, pIdx = 0, p; 
            while (i <= endTime) {
                sprites.updateAtTime(i);
                if (animation.ticked || !sprites.functionLinksAnimated) { kinematics.update(true) };
                
                if (spr.widgetAnimPath.length > pIdx) {
                    p = spr.widgetAnimPath[pIdx++];
                } else {
                    p = utils.point;
                    spr.widgetAnimPath[pIdx++] = p;
                }
                p.x = spr.x;
                p.y = spr.y;
                p.key = spr.type.animated && spr.animation.atKey;

                i++;
            }
            spr.widgetAnimPath.length = pIdx;
            sprites.restoreStates();
            lightboxUpdate = lightboxUpdateState;
            sprites.mustUpdate = updateState;   
            sprites.updateAtTime(resetTime);            
        },
        frameTick() {
            var time = (globalTime - API.startTick) / (1000/(60 * playSpeed)) | 0;
            time = ((time - startTime) % (endTime - startTime + 1)) + startTime;
            API.time = time;

        },
        playing : false,
        get speed() { return playSpeed },
        set speed(val) {
            if(API.playing && sprites.hasVideo) {
                API.pause();
            }else if(API.playing){
                API.startTick = globalTime - (currentTime * (1000/(60 * playSpeed))) * (playSpeed / val);
            }
            playSpeed = val;
			updatePlaySpeed();
        },
        play() {
            if(API.playing === false){
                API.playing = true;
                API.startTick = globalTime - currentTime * (1000 / 60) / playSpeed;
                API.fireEvent("playpause");
                playSprites();
                extraRenders.DOMRenderingFunction("frameTick", API.frameTick);
            }
        },
        pause() {
            if(API.playing === true){
                API.playing = false;
                API.fireEvent("playpause");
                pauseSprites();
                extraRenders.DOMRenderingFunction("frameTick");
            }
        },
        get maxLengthQuick() { return maxLength },
        get maxLength() {
            maxLength = getTimeExtent();
            return maxLength;
        },
        set maxLength(value) {
            const vLength = getTimeExtent(true);
            if(value < vLength) {
                log.warn("Animation length can not be shorter than displayed video duration");
                if(vLength <maxLength){
                    maxLength = vLength;
                }
            }else{
                maxLength = value;
            }
            if(endTime > maxLength) {
                API.endTime = maxLength;
            }
        },
        get length() { return endTime - startTime },
        get startTime() { return startTime },
        get endTime() { return endTime },
        get time() { return currentTime },
        set length(val) {
            API.endTime = startTime + (val < 1 ? 1 : val)
            maxSetLength = endTime;
        },
        set sectionStart(time) {
            var length = endTime - startTime;
            time = Math.floor(time);
            time  = time < 0 ? 0 : time;
            time = time > maxLength - ( endTime - startTime) ? maxLength - ( endTime - startTime) : time;
            API.startTime = time;
            API.endTime = time + length;
        },
        set startTime(time) {
            time = Math.floor(time);
            time = time > maxLength -1 ? maxLength - 1 : time < 0 ? 0 : time;
            if(time !== startTime){
                if(currentTime  < time) { API.time = time }
                startTime = time;
                if(endTime <= startTime) { endTime = startTime + 1 }
                animationChangeEvent.type = "starttime";
                API.fireEvent("change", animationChangeEvent);
            }
        },
        set endTime(time) {
            time = Math.floor(time);
            time = time < 1 ? 1 : time > maxLength ? maxLength : time;
            if(time > settings.maxAnimationLength) { time = settings.maxAnimationLength }
            if(time !== endTime){
                if(currentTime  > time) {  API.time = time }
                endTime = time;
                if(startTime >= endTime) { startTime = endTime - 1 }
                animationChangeEvent.type = "endtime";
                API.fireEvent("change", animationChangeEvent);
            }
        },
        frame: 0,
        seconds: 0,
        set fastSeek(time) {
            if(time < startTime) { time = startTime }
            if(time > endTime) { time = endTime }
            API.frame = currentTime = time;
            API.seconds = currentTimeSeconds = time / 60;
            if(time === startTime && sprites.functionLinksAnimated) {
                sprites.resetFunctionLinks();
            }
            fastSeek(time);
        },
        set time(time) {
            if(time < startTime) { time = startTime }
            if(time > endTime) { time = endTime }
            if(time !== currentTime){
                API.fireEvent("befortimechange");
                API.frame = currentTime = time;
                API.seconds = currentTimeSeconds = time / 60;
                animationChangeEvent.type = "time";
                API.fireEvent("change", animationChangeEvent);
                if(time === startTime && sprites.functionLinksAnimated) {
                    sprites.resetFunctionLinks();
                }
            }
        },
        set fTime(time) {
            if(time < startTime) { time = startTime }
            if(time > endTime) { time = endTime }

            API.fireEvent("befortimechange");
            if (currentTime === time) {
                ignoreVideoUpdate = true;
            }
            API.frame = currentTime = time;
            API.seconds = currentTimeSeconds = time / 60;

            animationChangeEvent.type = "time";
            API.fireEvent("change", animationChangeEvent);
            if(time === startTime && sprites.functionLinksAnimated) {
                sprites.resetFunctionLinks();
            }

        },
        set addTimeLoop(frames) {
            var t = currentTime + frames;
            if (t > endTime) { t = (t - endTime) + startTime - 1 }
            if (t < startTime) { t = (t - startTime) + endTime + 1 }
            API.time = t;
        },
        set addTime(frames) {
            var t = currentTime + frames;
            if (t > endTime) { t = endTime }
            if (t < startTime) { t = startTime }
            API.time = t;
        },
        nextFrame() { API.time = Math.floor(currentTime) + 1 },
        prevFrame() { API.time = Math.floor(currentTime) - 1 },
        startFrame() { API.time = Math.floor(startTime)  },
        endFrame() { API.time = Math.floor(endTime)  },
        forceUpdate(updateLightBox = true) {
            lightboxUpdate = updateLightBox;
            animationChangeEvent.type = "forcedchange";
            API.fireEvent("change", animationChangeEvent);
        },
        animStateUpdate() {
            animationChangeEvent.type = "state";
            API.fireEvent("change", animationChangeEvent);
        },        
        serialize() {
            const A = {};
            A.time = API.time;
            A.start = API.startTime;
            A.end = API.endTime;
            A.length = Math.max(API.maxLength, API.endTime - API.startTime);
            A.speed = API.speed;
            if (lightboxOn){
                A.lightBox = {
                    on: API.lightboxOn,
                    layers: API.lightBoxLayers,
                    layerDescription: lightBoxConfig.map(({offset, alpha, cycle}) => ({offset, alpha, cycle})),

                }
            }
            return A;
        },
        deserialize(A) {
            startTime = A.start;
            endTime = A.end;
            maxLength = A.length;
            playSpeed = A.speed;
            if(A.lightBox) {
                lightboxOn = A.lightBox.on;
                lightBoxLayerCount = A.lightBox.layers;
                if (A.lightBox.offsets) { // legacy
                    let i = 0;
                    while (i < lightBoxLayerCount) {
                        lightBoxConfig[i].offset = A.lightBox.offsets[i];
                        i++
                    }
                } else {
                    let i = 0;
                    for (const cif of A.lightBox.layerDescription) {
                        Object.assign(lightBoxConfig[i++], cif);
                    }
                }
            } else {
                lightboxOn = false;
                lightBoxLayerCount = 0;
            }
            currentTime = A.time;
            API.lightboxOn = lightboxOn;
            API.forceUpdate(lightboxOn);

        },
        createImageAnimation(source,sort = "Forward",frameStep = 1, fading = false) {
            const imgs = [];
            const med = [];
            var renameSprite = true;
            var sprImg,sprImg1;
            if(source === "Time change") {
                if(sort === "forward") {
                    frameStep = Math.abs(frameStep);
                } else {
                    frameStep = -Math.abs(frameStep);
                }
                const spr = selection[0];
                let i,count = 0, removed = 0;
                for(i = animation.startTime; i <= animation.endTime; i ++) {
                    const key = spr.getAnimKey(i,"image");
                    if(key) {
                        key.time += frameStep;
                        count += 1;
                        if(key.time < animation.startTime || key.time > animation.endTime) {
                            spr.removeKeyFrame(key);
                            removed += 1
                        }
                    }
                }
                spr.updateKeyFrameLookup("image");
                animation.forceUpdate();
                return count + " keys moved by " + frameStep + " frames. Removed " + removed + "keys out of range";
            }
            if(source === "Selected sprites"){
                selection.eachOfType(spr => { imgs.push(spr); med.push(spr.image) },"image");
                selection.clear();
                sprImg = imgs.shift();
                imgs.forEach(spr => sprites.remove(spr));
            }else if(source === "Selected images"){
                mediaList.eachSelected(m => { med.push(m) });
            }else if(source === "All images"){
                mediaList.each(item => { med.push(item.media) });
            }else if(source === "From GIF") {
                const llg = media.lastLoadedGif;
                const name = llg.name;
                for(let i = 0; i < llg.frames; i++) {
                    const m = media.byName(name.replace("{F#}","{F"+ i + "}"));
                    if(m) { med.push(m) }
                }
            }else { return "unknown source " + source }
            if(sort === "Selection order") {
            } else if(sort === "Forward") {
                med.sort((a,b) => {
                    if(a.desc.frame && b.desc.frame) {
                        return a.desc.frame - b.desc.frame
                    }
                    const nameA = a.desc.name.split(".")[0].toLowerCase();
                    const nameB = b.desc.name.split(".")[0].toLowerCase();
                    if(nameA < nameB) { return -1 }
                    if(nameA > nameB) { return 1 }
                    return 0;
                });
            } else if(sort === "Backward") {
                med.sort((a,b) => {
                    if(a.desc.frame && b.desc.frame) {
                        return b.desc.frame - a.desc.frame
                    }
                    const nameA = a.desc.name.split(".")[0].toLowerCase();
                    const nameB = b.desc.name.split(".")[0].toLowerCase();
                    if(nameA < nameB) { return 1 }
                    if(nameA > nameB) { return -1 }
                    return 0;
                });
            }else { return "Unknown order options " + sort }
            if(med.length === 0) {
                return "No images found to create animation from.";
            }
            mediaList.mediaSelected.clear();
            mediaList.mediaSelected.add(med[0]);
            if(sprImg === undefined){
                if(fading) {
                    issueCommand(commands.mediaAddToWorkspace);
                    sprImg1 = selection[0];
                    selection.clear();
                }
                issueCommand(commands.mediaAddToWorkspace);
                sprImg = selection[0];
                selection.clear();
                if(source === "From GIF"){
                    var name = media.lastLoadedGif.name.split("{").shift();
                    if(name.length) {
                        if(name.length > 8) { name = name.substring(0,8) }
                    } else { name = "GIF" }
                    sprImg.name = NAMES.register(name);
                    if (sprImg1) { sprImg1.name = NAMES.register(name + "A") }
                    renameSprite = false;
                }
            }
            var count = 1;
            selection.add(sprImg);
            animation.startFrame();
            frameStep = Number(frameStep);
            API.length = med.length * frameStep - 1;
            var med2;
            if(fading) { med2 = [...med] }
            do {
                const m =  med.shift();
                if(fading){
                    sprImg.a = 1 - (1 / frameStep);
                    issueCommand(commands.animSetKey_a);
                }
                sprImg.changeImage(m,renameSprite);
                issueCommand(commands.animSetKey_image);
                count += 1;
                if(med.length) {
                    if(fading) {
                        animation.addTime = frameStep - 1;
                        sprImg.a = 0;
                        issueCommand(commands.animSetKey_a);
                        animation.addTime = 1;
                    }else{
                        animation.addTime = frameStep;
                    }
                }else if(fading){
                    animation.endFrame();
                    sprImg.a = 0;
                    issueCommand(commands.animSetKey_a);
                }
            } while(med.length);
            if(fading) {
                var count = 1;
                selection.clear();
                selection.add(sprImg1);
                animation.startFrame();
                med2.push(med2.shift());
                do {
                    const m =  med2.shift();
                    sprImg1.changeImage(m,renameSprite);
                    issueCommand(commands.animSetKey_image);
                    count += 1;
                    if (med2.length) { animation.addTime = frameStep  }
                } while(med2.length);
            }
             animation.startFrame();
            return "Created " + (count / 60).toFixed(2) + " second animation with "+count+" images";
        },
        get extras() {
            const setLength = time => (API.maxLength = time, API.length = API.maxLengthQuick, log.info("Anim length " + API.maxLengthQuick));
            const addLength = time => (API.maxLength = API.maxLengthQuick + time, API.length = API.maxLengthQuick, log.info("Anim length " + API.maxLengthQuick));
            const extras = {
				foldInfo: {
					help: "All things animation, time, key frames, and mor",
					foldClass: "extrasAnimation",
				},
                AnimationAndLightBoxPannel: {
                    help: "Opens Animation and Light Box floating pannel",
                    call() {
                        if(LightBoxPannel.open) {
                            log.warn("Animation pannel already open");
                        } else {
                            LightBoxPannel();
                        }
                    }
                },
                timeUtilsDialog : {
                    help : "Opens animation time utilities dialog.",
                    call() {
                        animation.pause();
                        setTimeout(()=>commandLine("run safe animationTimeUtils",true), 0);
                    },
                },
                time : {
                    quickSet : {
                        "10_frames" : {help : "", call() { setLength(10) }, },
                        "20_frames" : {help : "", call() { setLength(20) }, },
                        "30_frames" : {help : "", call() { setLength(30) }, },
                        "45_frames" : {help : "", call() { setLength(45) }, },
                        "1_second" : {help : "", call() { setLength(60) }, },
                        "1.5_seconds" : {help : "", call() { setLength(90) }, },
                        "2_seconds" : {help : "", call() { setLength(120) }, },
                        "2.5_seconds" : {help : "", call() { setLength(150) }, },
                        "3_seconds" : {help : "", call() { setLength(180) }, },
                        "4_seconds" : {help : "", call() { setLength(240) }, },
                        "5_seconds" : {help : "", call() { setLength(300) }, },
                    },
                    addFrames : {
                        Add_1_frame : {help : "", call() { addLength(1) }, },
                        Add_2_frames : {help : "", call() { addLength(2) }, },
                        Add_5_frames : {help : "", call() { addLength(5) }, },
                        Add_10_frames : {help : "", call() { addLength(10) }, },
                        Add_1_second : {help : "", call() { addLength(60) }, },
                        Add_10_second : {help : "", call() { addLength(600) }, },
                        Add_1_minute : {help : "", call() { addLength(60 * 60) }, },
                    },
                    removeFrames : {
                        Remove_1_frame : {help : "", call() { addLength(-1) }, },
                        Remove_2_frames : {help : "", call() { addLength(-2) }, },
                        Remove_5_frames : {help : "", call() { addLength(-5) }, },
                        Remove_10_frames : {help : "", call() { addLength(-10) }, },
                        Remove_1_second : {help : "", call() { addLength(-60) }, },
                        Remove_10_second : {help : "", call() { addLength(-600) }, },
                        Remove_1_minute : {help : "", call() { addLength(-60 * 60) }, },
                    },
                    keyTimes : {
                        alignToPixels: {
                            help: "Adjust selected key times so that frames align to pixels",
                            call() {
                                if(timeline) { timeline.cleanSelectedKeys() }
                                selection.eachOfType(spr => {
                                    spr.animation.eachTrack(track => {
                                        var pKey;
                                        if (track.name === "x" || track.name === "y") {
                                            for(const key of track.keys) {
                                                if(key.selected) {
                                                    if (pKey) {
                                                        const time = key.time - pKey.time;
                                                        const dist = Math.abs(key.value - pKey.value);
                                                        if (dist > 0) {
                                                            if (dist >= time * 8) {
                                                                key.time = pKey.time + (dist / 8 | 0);
                                                            } else if (dist >= time * 7) {
                                                                key.time = pKey.time + (dist / 7 | 0);
                                                            } else if (dist >= time * 6) {
                                                                key.time = pKey.time + (dist / 6 | 0);
                                                            } else if (dist >= time * 5) {
                                                                key.time = pKey.time + (dist / 5 | 0);
                                                            } else if (dist >= time * 4) {
                                                                key.time = pKey.time + (dist / 4 | 0);
                                                            } else if (dist >= time * 3) {
                                                                key.time = pKey.time + (dist / 3 | 0);
                                                            } else if (dist >= time * 2) {
                                                                key.time = pKey.time + (dist / 2 | 0);
                                                            } else {
                                                                key.time = pKey.time + (dist | 0);
                                                            }
                                                            track.dirty = true;
                                                        }

                                                    }
                                                }
                                                pKey = key;
                                            }
                                        }

                                    });
                                },"animated");
                                API.forceUpdate();
                            }

                        },
                        evenSpaceKeys : {
                            help : "Per track, spaces selected keys to fit evenly.",
                            call() {
                                if(timeline) { timeline.cleanSelectedKeys() }
                                selection.eachOfType(spr => {
                                        spr.animation.eachTrack(track => {
                                            var count = 0, start, end;
                                            for(const key of track.keys) {
                                                if(key.selected) {
                                                    if(start === undefined) { start = key.time }
                                                    end = key.time;
                                                    count ++;
                                                }
                                            }
                                            if ( count > 0) {
                                                var c = 0;
                                                for(const key of track.keys) {if(key.selected) { c++ } }
                                                if(c > 2) {
                                                    c = 0;
                                                    for(const key of track.keys) {
                                                        if(key.selected) { key.time = Math.round((c++ / (count-1)) * (end - start) + start) }
                                                    }
                                                    track.dirty = true;
                                                }
                                            }
                                        });
                                    },"animated"
                                );
                                API.forceUpdate();
                            }
                        },
                        fitKeysToTime : {
                            help : "Stretch selected key times to fit animation time",
                            call() {
                                if(timeline) { timeline.cleanSelectedKeys() }
                                var max = animation.startTime;
                                var min = animation.endTime;
                                var count = 0;
                                selection.eachOfType(spr => {
                                        spr.animation.eachTrack(track => {
                                            for(const key of track.keys) {
                                                if(key.selected) {

                                                    min = Math.min(min, key.time);
                                                    max = Math.max(max, key.time);
                                                    count ++;
                                                }
                                            }
                                        });
                                    },"animated"
                                )
                                if( count > 2){
                                    const start = animation.startTime;
                                    const end = animation.endTime;
                                    const range = end - start;
                                    selection.eachOfType(spr => {
                                            spr.animation.eachTrack(track => {
                                                for(const key of track.keys) {
                                                    if(key.selected) {
                                                        key.time = Math.round(((key.time - min) / (max - min)) * range + start);
                                                        track.dirty = true
                                                    }
                                                }
                                            });
                                        },"animated"
                                    );
                                }
                                API.forceUpdate();
                            }
                        },
						reverseTime: {
							help : "Reverse time of selected keys",
							call() {
                               if(timeline) { timeline.cleanSelectedKeys() }
                                const keyTypeFilters = timeline.keyTypeFilters;
								var hasSelectedTracks = false;
                                selection.eachOfType(spr => {
									spr.animation.eachTrack(track => hasSelectedTracks = track.selected);
									return hasSelectedTracks;
								},"animated");
								var count = 0, sCount = 0;
                                selection.eachOfType(spr => {
                                        spr.animation.eachTrack(track => {
                                            if((hasSelectedTracks && track.selected) || (!hasSelectedTracks && keyTypeFilters[track.name])){
                                                const useTiming = track.timing.type !== utils.animPlayTypes.normal;
                                                const start = useTiming ? track.timing.start : animation.startTime;
                                                const end = useTiming ? track.timing.end : animation.endTime;
                                                const range = end - start + 1;
                                                for(const key of track.keys) {
                                                    if(key.time >= start && key.time <= end) {
														key.time = end - (key.time - start)
                                                        count ++;
                                                        track.dirty = true
                                                    }
                                                }
                                            }
                                            sCount += 1;
                                        });
                                    },"animated"
                                );
                                if(sCount) {
                                    if ( count ){
                                        API.forceUpdate();
                                    } else {
                                        log.warn("Selected tracks did not contain keys");
                                    }
                                } else {
                                    log.warn("No sprites selected containing selected animation tracks.");
                                }
							},

						},
                        doubleKeyTime : {
                            help : "Double key time range from lowest to highest selected key time\nWill increase animation length to ensure keys fit",
                            call() {
                                if(timeline) { timeline.cleanSelectedKeys() }
                                var min = animation.endTime;
                                var max = animation.startTime;
                                var count = 0;
                                selection.eachOfType(spr => {
                                        spr.animation.eachTrack(track => {
                                            for(const key of track.keys) {
                                                if(key.selected) {
                                                    min = Math.min(min, key.time);
                                                    max = Math.max(max, key.time);
                                                    count ++;
                                                }
                                            }
                                        });
                                    },"animated"
                                )
                                if((max - min) * 2 + min > animation.maxLengthQuick) {
                                    if(animation.maxLengthQuick === animation.endTime) {
                                        animation.maxLength = (max - min) * 2 + min;
                                        animation.endTime = (max - min) * 2 + min;
                                    } else {
                                        animation.maxLength = (max - min) * 2 + min;
                                    }
                                }
                                if( count > 0){
                                    selection.eachOfType(spr => {
                                            spr.animation.eachTrack(track => {
                                                for(const key of track.keys) {
                                                    if(key.selected) {
                                                        key.time = Math.round((key.time - min) * 2 + min);
                                                        track.dirty = true
                                                    }
                                                }
                                            });
                                        },"animated"
                                    );
                                }
                                API.forceUpdate();
                            }
                        },
                        HalfKeyTime : {
                            help : "Halves key time range from lowest to highest selected key time",
                            call() {
                                if(timeline) { timeline.cleanSelectedKeys() }
                                var min = animation.endTime;
                                var max = animation.startTime;
                                var count = 0;
                                selection.eachOfType(spr => {
                                        spr.animation.eachTrack(track => {
                                            for(const key of track.keys) {
                                                if(key.selected) {
                                                    min = Math.min(min, key.time);
                                                    max = Math.max(max, key.time);
                                                    count ++;
                                                }
                                            }
                                        });
                                    },"animated"
                                )

                                if( count > 0){
                                    selection.eachOfType(spr => {
                                            spr.animation.eachTrack(track => {
                                                for(const key of track.keys) {
                                                    if(key.selected) {
                                                        key.time = Math.round((key.time - min) / 2 + min);
                                                        track.dirty = true
                                                    }
                                                }
                                            });
                                        },"animated"
                                    );
                                }
                                API.forceUpdate();
                            }
                        },
                        retreatFrames : {
                            help : "Moves selected tracks backward by frame step\nFrames below start are move to the end",
                            call() { extras.time.keyTimes.advanceFrames.call(undefined, -timeline.frameStep) },
                        },
                        advanceFrames : {
                            help : "Moves selected tracks forward frame step\nFrames past end time are move to the start",
                            call(menuItem, step = timeline.frameStep) {
                                if(timeline) { timeline.cleanSelectedKeys() }
                                const keyTypeFilters = timeline.keyTypeFilters;
								var hasSelectedTracks = false;
                                selection.eachOfType(spr => {
									spr.animation.eachTrack(track => hasSelectedTracks = track.selected);
									return hasSelectedTracks;
								},"animated");
								var count = 0, sCount = 0;
                                selection.eachOfType(spr => {
                                        spr.animation.eachTrack(track => {
                                            if((hasSelectedTracks && track.selected) || (!hasSelectedTracks && keyTypeFilters[track.name])){
                                                const useTiming = track.timing.type !== utils.animPlayTypes.normal;
                                                const start = useTiming ? track.timing.start : animation.startTime;
                                                const end = useTiming ? track.timing.end : animation.endTime;
                                                const range = end - start + 1;
                                                for(const key of track.keys) {
                                                    if(key.time >= start && key.time <= end) {
                                                        key.time += step;
                                                        key.time = (((key.time - start) % range + range) % range) + start;
                                                        count ++;
                                                        track.dirty = true
                                                    }
                                                }
                                            }
                                            sCount += 1;
                                        });
                                    },"animated"
                                );
                                if(sCount) {
                                    if ( count ){
                                        log("Changed " + count + "keys in "+sCount+"tracks");
                                    } else {
                                        log.warn("Selected tracks did not contain keys");
                                    }
                                } else {
                                    log.warn("No sprites selected containing selected animation tracks.");
                                }
                            }
                        },
                    },
					toSelectedVideoDuration: {
						help : "Sets the animation time to the currently selected video duration.\nNote that if duration is 0 play the video first",
						call() {
							var zeroLen = false;
							const durSet = selection.eachOfType(spr => {
								if(spr.image.desc.video) {
									if(spr.image.duration !== 0) {
										if((spr.image.duration * 60 | 0) !== spr.image.duration * 60) {
											log.warn("Video length is not a multiple of 60.");
											log.warn("Add time correction. Video may not loop correctly");
											setLength(spr.image.duration * 60 + 4| 0);
										} else {
											setLength(spr.image.duration * 60);
										}
									} else {
										zeroLen = true;
									}
									return true;


								}
							},"image");
							if(durSet !== undefined && zeroLen) {
								log.warn("Selected video duration is zero!");
							} else if(durSet === undefined) {
								log.warn("No video selected!");
							}

						}
					},
                    doubleFrames :  {help : "", call() { addLength(API.maxLengthQuick) }, },
                    halfFrames :  {help : "", call() { addLength(-(API.maxLengthQuick / 2 | 0)) }, },
                    atCurrentTime : { call() { addLength(API.time - API.maxLengthQuick) }, help : "Sets animation length to the current time",},
                    commonLoopEnd : {
                        help : "Set length such that all selected sprite anim tracks have a common loop end",
                        call() {
                            if (selection.length === 0) {
                                log.info("No sprites selected.");
                                return;
                            }
                            const timings = new Set();
                            const APT = utils.animPlayTypes;
                            selection.eachOfType(spr => {
                                    spr.animation.eachSelectedTrack(track => {
                                        var range;
                                        const t = track.timing;
                                        if (t.type === APT.loop) {
                                            range = t.play === APT.pingPong ? (t.end - t.start) * 2 - 1: t.end - t.start;
                                            range /= t.speed; // need frame count so inverse of speed
                                            range |= 0;
                                            timings.add(range);
                                        }
                                    });
                                }, "animated"
                            );
                            if (timings.size === 0) {
                                log.info("No looped animated tracks found.");
                                return;
                            }
                            const ranges = [...timings.values()].sort((a, b) => a - b);
                            var maxCommonTime = ranges[ranges.length - 1];
                            var maxCommonFactor = ranges.reduce((m, r) => m * r,1);

                            var lowestCommon, searching;
                            var counter = 10000;
                            do {
                                searching = false;
                                for (const range of ranges) {
                                    if ((maxCommonFactor / range) % maxCommonTime === 0) {
                                        lowestCommon = maxCommonFactor / range;
                                        if (!ranges.some(range => lowestCommon % range)) {
                                            searching = true;
                                            maxCommonFactor = lowestCommon;
                                        }
                                    }
                                }
                            } while(searching && counter-- > 0);
                            if(counter === 0) {
                                log.info("Failed to find a common loop end");

                            } else {
                                if(maxCommonFactor > settings.maxAnimationLength) {
                                    log.warn("Over max time. " + (maxCommonFactor / (60 * 60)).toFixed(0) + "min long");
                                    log.info("This is too long. Use extras->settings->misc->Max Animation Length  to change");

                                }else{
                                    addLength(maxCommonFactor - API.maxLengthQuick);
                                }
                            }
                        },
                    }
                },
                image : {
                    help : "Display image animation dialog",
                    call() {
                        animation.pause();
                        setTimeout(()=>commandLine("run safe ImageAnimationDialog",true),0);
                    },
                },
                Create_GIF : {
                    help : "Opens GIF creation dialog. Lets you create and save animated GIF",
                    call() {
                        animation.pause();
                        setTimeout(()=>commandLine("run safe GifCreatorDialog",true),0);
                    }
                },

            };
            return extras;
        },
    };
    Object.assign(API, Events(API));
    API.addEvent("change", updateSprites);
    return API;
})();