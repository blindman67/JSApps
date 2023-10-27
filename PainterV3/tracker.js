"use strict";
const tracker = (()=> {
    const types = {
        track: 1,
        follow: 2,
    }
    var scanMethodName = "";
    const id = UID ++;
    const MAX_REPEAT = 10;
	const REFINE_MAX_DOWN = 0.5; // Reduces max search area on good passes
	const REFINE_MAX_UP = 1.05; // Increases max search area on poor passes
	var dbCanvas; // debug canvas
    var gain = 3;
    var distMin = 1;
    var distMax = 4;
    var distMinSet = 1;
    var distMaxSet = 4;
    var rotateMin = 0.005;
    var atFirstFrame = false;
    var seekToFirst = false;
    var error = false;
    var currectTrackSpr;
    var stopWhenCan = false;
    var stopNow = false;
    var workspaceTime;
    var referenceSprite = undefined;
    var refSpriteCopy = undefined;
    const scanMethods = {
        simple : 1,
        zero : 2,
        prsZero : 3,
        prZero : 4,
        frameAdvance: 16,
    };
    const subScanMethods = {
        markers: 1,
        background: 2,
    };
    var advanceFrameRewindCount = 4;
    var advanceFrameStep = 2;
    var scanMethod = scanMethods.simple;
    var seekToFrame = -1;
    var scanMethodCap = 0;
    var fireOnFirstFrame;
    var atStartFunction;
    var nextTrackStartAction = 1;
    const nextTrackStartActions = {
        Keep: 1,
        RestoreAnim: 2,
        ClearAnim: 3,
    };
    var metricFunctions = {
        RGB : localProcessImage.findImageDifference,
        HSL : localProcessImage.findImageDifferenceHSL,
        HS(iA, iB, gain){  return localProcessImage.findImageDifferenceHSL(iA,iB, gain,true,true,false) },
        Hue(iA, iB, gain){  return localProcessImage.findImageDifferenceHSL(iA,iB, gain,true,false,false) },
    }
    var metricFunc = metricFunctions.RGB;
    var metricValue = true;
    var metricShape = false;
    var metricType = "Difference";
    var compareRes = 16;
    const trackers = [];
    const tracked = [];
    var tracking = false;
    var ready = false;
    var rate = 16;
    var scaleUniform = true;
    var includeRotate = false;
    var includeScale = false;
    var includePos = false;
    var includeScaleNonUniform = false;
	var useFirst = false; // if true then first frame (if sub scan first frame is first of sub scane) is also captured and compared to current frame
    var frameStep, currentFrame, timeoutHDL;
    var displaySpr, ix, iy;
    var animSprite, ctx;
    var A,B,C,AA;
    const pos = {
        x : 0,
        y : 0,
        rx : 0,
        ry : 0,
        sx : 0,
        sy : 0,
        idx: -1,
        xIdx: -1,
        yIdx: -1,
        rIdx: -1,
        sXIdx: -1,
        sYIdx: -1,
        sIdx: -1,
        sIdy: -1,
        range: 4,
        rangeR: 0.1,
        rangeSx: 0.01,
        rangeSy: 0.01,
        distance: 0,
        skip: false,
        minCoverage: 0.1,
        best: -1,
        bestValue: 0,
        bestDist: 0,
        besTDistMax: 0,
        total: 0,
        totalArea: 0,
        type: null,
        repeat: 1,
        countedRepeats: 0,
        useSubScans: false,
		useSubScansClearWhenDone: false,
        subScanMethod: subScanMethods.markers,
        ratings: [],
        subScans: [],
        relativeFrames: [],
        relativeFramesInit: [],
        //subKeyTimes: [],
        stepCount: 0,
        fromRange: 16,
        fromPos() {
            A.x = pos.x;
            A.y = pos.y;
            A.rx = pos.rx;
            A.ry = pos.ry;
            A.sx = pos.sx;
            A.sy = pos.sy;
            A.key.update();
        },
        searchCount() {
			var stepCount = 1;
            if(includePos) {
                stepCount *= pos.steps.length;
            }
            if(includeRotate) {
                stepCount *= pos.rSteps.length;
            }
            if(includeScale) {
                stepCount *= pos.sSteps.length;
            } else if(includeScaleNonUniform) {
                stepCount *= pos.sSteps.length;
                stepCount *= pos.sSteps.length;
            }
			return stepCount;
        },
		toIdx(idx) {
            pos.stepCount = 1;
            pos.idx = pos.rIdx = pos.sIdx = pos.sIdy = pos.sXIdx = pos.sYIdx =  0;
            if(includePos) {
                pos.idx = idx % pos.steps.length;
                pos.stepCount *= pos.steps.length;
            }
            if(includeRotate) {
                pos.rIdx = ((idx /  pos.stepCount) | 0) % pos.rSteps.length;
                pos.stepCount *= pos.rSteps.length;
            }
            if(includeScale) {
                pos.sIdy = pos.sIdx = ((idx /  pos.stepCount) | 0) % pos.sSteps.length;
                pos.stepCount *= pos.sSteps.length;
            } else if(includeScaleNonUniform) {
                pos.sIdx = ((idx /  pos.stepCount) | 0) % pos.sSteps.length;
                pos.stepCount *= pos.sSteps.length;
                pos.sIdy = ((idx /  pos.stepCount) | 0) % pos.sSteps.length;
                pos.stepCount *= pos.sSteps.length;
            }
        },
        steps: [[0,0],[1,0],[-1,0],[0,1],[0,-1]],
        xSteps: [0, -1, 1],
        ySteps: [0, -1, 1],
        rSteps: [0, -1, 1],
        sSteps: [0, -1, 1],
        stats: new Map(),
        report: [],
        calcRanges(){
            var size = Math.abs(Math.hypot(A.w * A.sx, A.h * A.sy)) / 2;
            var r = pos.fromRange;
            pos.rangeR = pos.rangeX = pos.rangeY = pos.range = r;
            pos.rangeR = r / size;
            pos.rangeSy = pos.rangeSx = Math.max(((A.w * A.sx) + r) / (A.w * A.sx) - 1, ((A.h * A.sy) + r) / (A.h * A.sy) - 1);
        },
        startFrame() {
            pos.report.length = 0;
            pos.skip = false;
            pos.best = -1;
            if (pos.currentStats.best[anim.idx] !== undefined) {
                pos.lastBest = pos.bestValue;
                pos.bestDist = distMaxSet;
                pos.bestValue = Infinity;
            } else {
                pos.bestDist = distMaxSet;
                pos.bestValue = Infinity;
                pos.lastBest = -1;
            }
            pos.fromRange = distMax;
            pos.calcRanges();
            const ca = anim.positions[anim.idx];
            ca.skip = false;
            if(pos.type === types.follow) {
                pos.x =  ca.ax;
                pos.y =  ca.ay;
                pos.rx = ca.arx;
                pos.ry = ca.ary;
                pos.sx = ca.asx;
                pos.sy = ca.asy;
            } else {
                pos.x =  ca.x === undefined  ? A.x  : ca.x;
                pos.y =  ca.y === undefined  ? A.y  : ca.y;
                pos.rx = ca.rx === undefined ? A.rx : ca.rx;
                pos.ry = ca.ry === undefined ? A.ry : ca.ry;
                pos.sx = ca.sx === undefined ? A.sx : ca.sx;
                pos.sy = ca.sy === undefined ? A.sy : ca.sy;
            }
        },
        retryFrame() {
            pos.report.push(pos.bestValue.toFixed(1)) ;
            pos.fromRange /= 2;
            pos.best = 0;
            pos.lastBest = pos.bestValue;
            pos.calcRanges();
        },
        refine(){
            pos.toIdx(pos.best)
            pos.x += pos.steps[pos.idx][0] * pos.range;
            pos.y += pos.steps[pos.idx][1] * pos.range;
            pos.rx += pos.rSteps[pos.rIdx] * pos.rangeR;
            pos.ry += pos.rSteps[pos.rIdx] * pos.rangeR;
            pos.sx *= 1 + pos.sSteps[pos.sIdx] * pos.rangeSx;
            pos.sy *= 1 + pos.sSteps[pos.sIdy] * pos.rangeSy;
            pos.range /= 2;
            pos.rangeR /= 2;
            pos.rangeSx /= 2;
            pos.rangeSy /= 2;
            pos.best = 0;
        },
        nextFrame(){
            pos.lastBest = -1;
            const fa = anim.positions[0];
            const ca = anim.positions[anim.idx];
            ca.skip = pos.skip;
            if(pos.type === types.follow) {
                ca.tx   = pos.x  -  fa.ax;
                ca.ty   = pos.y  -  fa.ay;
                ca.trx  = pos.rx - fa.arx;
                ca.ttry = pos.ry - fa.ary;
                ca.tsx  = pos.sx / fa.asx;
                ca.tsy  = pos.sy / fa.asy;
            }
            A.x =  ca.x = pos.x;
            A.y =  ca.y = pos.y;
            A.rx = ca.rx = pos.rx;
            A.ry = ca.ry = pos.ry;
            A.sx = ca.sx = pos.sx;
            A.sy = ca.sy = pos.sy;
            A.key.update();
            A.getSpriteLike(AA);
            spriteRender.renderStack.push(AA, "border", 3, ["#F00", 2, 0.8, 0]);
            const area = (A.sx * A.w / anim.spr.sx) * (A.sy * A.h / anim.spr.sy);
            pos.currentStats.best[anim.idx] = pos.bestValue;
            pos.totalArea += area
            pos.total += pos.bestValue;
            anim.idx += 1;
        }
    }
    const anim = {
        idx : 0,
        advanceToFrame: 0,
        start: 0,
        end: 0,
        refFrames: [],
        frames: [],
        positions: [],
        ignore: [],
		captureSprites: [],
        resetFrames() {

            anim.start = animation.startTime;
            anim.end = animation.endTime;
            if(anim.captureSprites <= 1) {

                anim.captureSprites = [anim.spr];
            } else {
                log("Reusing cap sprites");
            }

            anim.frames.length = 0;

            var i = anim.start;
            while(i <= anim.end) {
                anim.frames.push(i++)
            }
        }
    };
    const debugging = {
		data: {},
		marks: {},
		max: 0,
		isDebug: false,
		on() {
			dbCanvas = $("canvas",{width: 10, height: 10});
			dbCanvas.ctx = dbCanvas.getContext("2d");
			debugging.isDebug = true;
		},
		off(){
			dbCanvas = undefined;
			debugging.isDebug = false;
			debugging.data = undefined;
			debugging.marks = undefined;
			extraRenders.addOngoing("tracker"); // removes ongoing


		},
		startTrack() {
			const width = ((anim.end-anim.start) + 1) * pos.searchCount() * (Math.log2(distMax * 16)  - Math.log2(distMin * 16) + 1) | 0;
			if(width < 1) { width = 1 }
			dbCanvas.width = width > 2048 ? 2048 : width;
			dbCanvas.height = 256;
			debugging.data = {};
			debugging.marks = {};
			debugging.max = 256;
			debugging.isDebug = true;
			extraRenders.addOngoing("tracker",(ctx,common)=> {
				ctx.setTransform(1,0,0,1,0,0);
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = "source-over";
				ctx.filter = "none";
				ctx.drawImage(dbCanvas,0,0,ctx.canvas.width, dbCanvas.height);

			});
		},
		update() {
			const ctx = dbCanvas.ctx, data = debugging.data;
			const marks = debugging.marks;
			ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
			for(const mark of Object.values(marks)) {
				ctx.fillStyle = mark.col;
				ctx.fillRect(mark.pos | 0, 0, 1, ctx.canvas.height);
				ctx.font = "12px arial";
				ctx.textAlign = "right";
				ctx.textBaseline = "top";
				ctx.fillText(mark.name, mark.pos - 4 | 0, 4);
			}
			const max = Math.log(debugging.max);
			for(const dataSet of Object.values(data)) {
				ctx.fillStyle = dataSet.col;
				let x = 0;
				ctx.beginPath();
				while(x < dataSet.vals.length) {
					ctx.rect(x, Math.round((1 - Math.log(dataSet.vals[x++]) / max) * dbCanvas.height), 1, 1);
				}
				ctx.fill();
			}
		},
		addMark(name, col) {
			const data = debugging.data;
			const marks = debugging.marks;
			var samples = 0
			for(const dataSet of Object.values(data)) {
				samples = Math.max(dataSet.vals.length, samples);
				dataSet.vals.push(-1);
			}
			marks[name] = {
				pos: samples,
				name,
				col,
			};
		},
		addData(name, col, val) {
			const data = debugging.data;
			if(data[name]) {
				data[name].vals.push(val);
				data[name].max = Math.max(val, data[name].max);
				debugging.max = Math.max(data[name].max, debugging.max);
			} else {
				data[name] = {
					vals: [val],
					col,
					name,
					max: Math.max(256,val),
				};
			}
		},




	};


	function getAnimationPos() {
        var addRelInit = false;
        if(pos.relativeFramesInit.length === 0) { addRelInit = true }
        anim.positions.length = 0;
        pos.currentStats.prevFrames.length = 0;
        var hasAnim = false;
        if(A.type.animated) {
            const t = A.animation.tracks;
            if (t.x || t.y || t.rx || t.ry || t.sx || t.sy) { hasAnim = true }
        }
        if(pos.useSubScans) { getSubSections() }
        A.hasAnim = true;
        const aFrame = {};
        var first = true;
        if(pos.useSubScans && pos.subScanMethod === subScanMethods.background) {
            anim.relStartFrame = getRelativeFrame(pos.subScans[0][0], A, anim.spr);
            getFrame(A, aFrame);
        } else {
            pos.subScans.length = 0;
            anim.relStartFrame = getRelativeFrame(anim.frames[0], A, anim.spr);
        }
        for(const t of anim.frames) {
            A.setAnimFrame(t);
            A.key.update();
            let frame = {};
            if(first) {
                getFrame(A, frame);
            } else {
                frame.x =  A.animation && A.animation.tracks.x   ? A.x : undefined;
                frame.y =  A.animation && A.animation.tracks.y   ? A.y : undefined;
                frame.rx =  A.animation && A.animation.tracks.rx ? A.rx : undefined;
                frame.ry =  A.animation && A.animation.tracks.ry ? A.ry : undefined;
                frame.sx =  A.animation && A.animation.tracks.sx ? A.sx : undefined;
                frame.sy =  A.animation && A.animation.tracks.sy ? A.sy : undefined;
            }
            pos.currentStats.prevFrames.push({...frame});
            if(pos.useSubScans && pos.subScanMethod === subScanMethods.background) {
                const subScan = pos.subScans.find(ss => ss[0] === t);
                if (subScan) {
                    let ff;
                    pos.relativeFrames.push(ff = getRelativeFrame(t, A, anim.spr, true));
                    ff.t2 = subScan[1];
                    if(addRelInit) {
                        pos.relativeFramesInit.push(ff);
                    }
                }
                if(!first) {
                    frame.x =  undefined;
                    frame.y =  undefined;
                    frame.rx = undefined;
                    frame.ry = undefined;
                    frame.sx = undefined;
                    frame.sy = undefined;
                } else {
                    frame.x  = aFrame.x;
                    frame.y  = aFrame.y;
                    frame.rx = aFrame.rx;
                    frame.ry = aFrame.ry;
                    frame.sx = aFrame.sx;
                    frame.sy = aFrame.sy;
                }
                frame.ax = aFrame.x;
                frame.ay = aFrame.y;
                frame.arx = aFrame.rx;
                frame.ary = aFrame.ry;
                frame.asx = aFrame.sx;
                frame.asy = aFrame.sy;
            } else {
                getFrame(A, frame, "a");
            }
            first = false;
            anim.positions.push(frame);
            frame.skip = false;
        }
        if(pos.useSubScans && pos.type === types.follow && scanMethod !== scanMethods.simple) {
            scanMethod = scanMethods.simple;
        }
        clearSpriteAnim(A);
        anim.idx = 0;
    }
    function getRefFrames(useAttached) {
        if(refSpriteCopy) {
            const time = animation.time;
            anim.refFrames.length = 0;
			if(useAttached) {
				anim.refFrames.push(...selection[0].animRefFrames);
			} else {
				for(const t of anim.frames) {
					moveSpriteToTime(t,refSpriteCopy);
					anim.refFrames.push(getFrame(refSpriteCopy, {}));
				}
				if(selection.length) {
					selection[0].animRefFrames = [...anim.refFrames];
				}
			}
			moveSpriteToTime(time,refSpriteCopy);
        }
    }
    function setRefFrames(clearOnly = false) {
        var idx = 0;
        if(refSpriteCopy && anim.refFrames.length) {
            const time = animation.time;
            clearSpriteAnim(refSpriteCopy);
            if(!clearOnly) {
                for(const t of anim.frames) {
                    setAnimFrame(t,anim.refFrames[idx++],refSpriteCopy);
                }
            }
            moveSpriteToTime(time,refSpriteCopy);
        }
    }
    function getAnimationPosSub() {
		return;
        var first = true, i = 0;
        const rFrame = setRelativeFrame(pos.subScans[0][0], pos.relativeFrames[0], anim.spr, A.w, A.h)
        anim.relStartFrame = pos.relativeFrames[0];
        for(const t of anim.frames) {
            if(t <= pos.subScans[0][1]) {
                const frame = {};
                if(first) {
                    first = false;
                    frame.x = rFrame.x;
                    frame.y = rFrame.y;
                    frame.rx = rFrame.rx;
                    frame.ry = rFrame.ry;
                    frame.sx = rFrame.sx;
                    frame.sy = rFrame.sy;
                }else {
                    frame.x = undefined;
                    frame.y = undefined;
                    frame.rx = undefined;
                    frame.ry = undefined;
                    frame.sx = undefined;
                    frame.sy = undefined;
                }
                frame.ax = rFrame.x;
                frame.ay = rFrame.y;
                frame.arx = rFrame.rx;
                frame.ary = rFrame.ry;
                frame.asx = rFrame.sx;
                frame.asy = rFrame.sy;
                frame.skip = false;
                anim.positions[i] = frame;
            }
            i++;
        }
        clearSpriteAnim(A);
        anim.idx = 0;
    }
    function convertToDragger(spr) {
        const frames = [];
        for(const t of anim.frames) {
            spr.setAnimFrame(t);
            frames.push(getFrame(spr, {}));
        }
        clearSpriteAnim(spr);
        var first = true;
        var idx = 0;
        const a = frames[idx];
        for(const t of anim.frames) {
            const f = frames[idx];
            if(first) {
                first = false;
                setAnimFrame(t, a, spr);
            } else {
                setAnimFrame(
                    t,
                    createFrame(
                        a.x - (f.x - a.x),
                        a.y - (f.y - a.y),
                        a.rx - (f.rx - a.rx),
                        a.ry - (f.ry - a.ry),
                        a.sx / (f.sx / a.sx),
                        a.sy / (f.sy / a.sy)
                    ),
                    spr
                );
            }
            idx++;
        }
    }
    function updateBackgroundKeyFrames() {
        var last, time;
        for(const ff of pos.relativeFrames) {
            last = setRelativeSprite(ff.t, ff, A, anim.spr, true);
            time = ff.t2
        }
        setAnimFrame(time,last,A);
    }
    function resetBackgroundKeyFrames() {
        while(pos.relativeFramesInit.length) {
            const ff = pos.relativeFramesInit.shift();
            if(pos.relativeFramesInit.length === 0) {
                const last = setRelativeSprite(ff.t, ff, A, anim.spr, true, true);
                setAnimFrame(ff.t2, last, A, "", true);
            } else {
                setRelativeSprite(ff.t, ff, A, anim.spr, true, true);
            }
        }
    }
    function setAnimKeys() {
        var idx = 0;
        const fa = anim.positions[0];
        var x  = fa.ax;
        var y  = fa.ay;
        var rx = fa.arx;
        var ry = fa.ary;
        var sx = fa.asx;
        var sy = fa.asy;
        for(const t of anim.frames) {
            const ca = anim.positions[idx];
            if(idx < anim.idx) {
                if (!ca.skip) {
                    if(!anim.ignoreFrame){
                        if(pos.type === types.follow) {
                            A.addAnimKey({name:"x" , time: t, value: x += ca.tx});
                            A.addAnimKey({name:"y" , time: t, value: y += ca.ty});
                            A.addAnimKey({name:"rx", time: t, value: rx += ca.trx});
                            A.addAnimKey({name:"ry", time: t, value: ry += ca.ttry});
                            A.addAnimKey({name:"sx", time: t, value: sx *= ca.tsx});
                            A.addAnimKey({name:"sy", time: t, value: sy *= ca.tsy});
                        } else {
                            A.addAnimKey({name:"x", time: t, value :  ca.x});
                            A.addAnimKey({name:"y", time: t, value :  ca.y});
                            A.addAnimKey({name:"rx", time: t, value : ca.rx});
                            A.addAnimKey({name:"ry", time: t, value : ca.ry});
                            A.addAnimKey({name:"sx", time: t, value : ca.sx});
                            A.addAnimKey({name:"sy", time: t, value : ca.sy});
                        }
                    } else {
                        if(pos.type === types.follow) {
                            x += ca.tx;
                            y += ca.ty;
                            rx += ca.trx;
                            ry += ca.ttry;
                            sx *= ca.tsx;
                            sy *= ca.tsy;
                        }
                    }
                }
            }
            idx ++;
        }
    }
    function makeRelativeToReference(spr) {
        if(refSpriteCopy) {
            const rspr = refSpriteCopy;
            const rframes = [];
            const frames = [];
            const st = animation.startTime;
            for(const t of anim.frames) {
                if (t < st) {

                    rframes.push(undefined);
                    frames.push(undefined);
                } else {
                    rspr.setAnimFrame(t);
                    spr.setAnimFrame(t);
                    rspr.key.update();
                    spr.key.update();
                    let frame = {};
                    frame.x =  rspr.x;
                    frame.y =  rspr.y;
                    frame.rx = rspr.rx;
                    frame.ry = rspr.ry;
                    frame.sx = rspr.sx;
                    frame.sy = rspr.sy;
                    rframes.push(frame);
                    frame = {};
                    frame.x =  spr.x;
                    frame.y =  spr.y;
                    frame.rx = spr.rx;
                    frame.ry = spr.ry;
                    frame.sx = spr.sx;
                    frame.sy = spr.sy;
                    frames.push(frame);
                }
            }
			clearSpriteAnim(rspr);

            var idx = 0;
            var firstFound = false;
            var x,y,rx,ry,sx,sy;
            for(const t of anim.frames) {
                const f = frames[idx];
                if (f !== undefined) {
                    if (!firstFound) {
                        firstFound = true;
                        x = f.x;
                        y = f.y;
                        rx = f.rx;
                        ry = f.ry;
                        sx = f.sx;
                        sy = f.sy;
                    }
                    if(!anim.positions[idx] || !anim.positions[idx].skip) {
                        const rf = rframes[idx];
                        var scx = f.sx / sx;
                        var scy = f.sy / sy;
                        var xdx = Math.cos(-(f.rx - rx))
                        var xdy = Math.sin(-(f.rx - rx))
                        const xx = f.x - rf.x;
                        const yy = f.y - rf.y;
                        var ox = xx * xdx / scx - yy * xdy / scy + rf.x;
                        var oy = xx * xdy / scx + yy * xdx / scy + rf.y;
                        var drx = rf.rx - (f.rx - rx);
                        var dry = rf.ry - rf.rx;
                        var dx = rf.x - (ox - x);
                        var dy = rf.y - (oy - y);
                        var dsx = rf.sx / (f.sx / sx);
                        var dsy = rf.sy / (f.sy / sy);

                        rspr.addAnimKey({name:"x" , time: t, value : dx});
                        rspr.addAnimKey({name:"y" , time: t, value : dy});
                        rspr.addAnimKey({name:"rx", time: t, value : drx});
                        rspr.addAnimKey({name:"ry", time: t, value : drx + dry});
                        rspr.addAnimKey({name:"sx", time: t, value : dsx});
                        rspr.addAnimKey({name:"sy", time: t, value : dsy});
                    }
                }
                idx++;
            }
            rspr.key.update();
        }else { log.warn("No reference sprite set") }
    }
    function moveSpriteToTime(time, spr) {
        if (spr.type.attached) {
            spr.attachedTo.setAnimFrame(time);
            spr.setAnimFrame(time);
            spr.attachedTo.key.update();
            spr.key.update();
        } else {
            spr.setAnimFrame(time);
            spr.key.update();
        }
    }
    function clearSpriteAnim(spr) {
        if (spr.type.animated) {
            const t = spr.animation.tracks;
			const s = animation.startTime;
			const e = animation.endTime;
			t.x && t.x.clearRange  (s, e);
			t.y && t.y.clearRange  (s, e);
			t.rx && t.rx.clearRange(s, e);
			t.ry && t.ry.clearRange(s, e);
			t.sx && t.sx.clearRange(s, e);
			t.sy && t.sy.clearRange(s, e);
			spr.cleanAndUpdateTrackLookups();
		}
        /*spr.removeAnimTrack("x");
        spr.removeAnimTrack("y");
        spr.removeAnimTrack("rx");
        spr.removeAnimTrack("ry");
        spr.removeAnimTrack("sx");
        spr.removeAnimTrack("sy");      */
    }
    function clearSpriteAnimTrackRange(spr, trackName, fromTime, toTime) {
        if (spr.type.animated) {
            const a = spr.animation;
            const t = a.tracks[trackName];
            if (t) { t.clearRange(fromTime, toTime) }
        }
    }
    function clearSpriteAnimRange(spr, fromTime, toTime) {
        ("x,y,rx,ry,sx,sy").split(",").forEach(name => clearSpriteAnimTrackRange(spr, name, fromTime, toTime));
    }
    function createFrame(x, y, rx, ry, sx,sy) { return {x, y, rx, ry, sx, sy} }
    function setAnimFrame(time, frame, spr, namePrefix, atKey = false) {
        const atK = name => ((atKey && at[name]) || (!atKey && f[p + name] !== undefined)) === true;
        if (namePrefix === undefined) { namePrefix = "" }
        const f = frame;
        const p = namePrefix;
        var at;
        if(atKey && f.atKeys) { at = f.atKeys} else { atKey = false }
        atK("x")  && spr.addAnimKey({name:"x" , time, value : f[p + "x"] });
        atK("y")  && spr.addAnimKey({name:"y" , time, value : f[p + "y"] });
        atK("rx") && spr.addAnimKey({name:"rx", time, value : f[p + "rx"]});
        atK("ry") && spr.addAnimKey({name:"ry", time, value : f[p + "ry"]});
        atK("sx") && spr.addAnimKey({name:"sx", time, value : f[p + "sx"]});
        atK("sy") && spr.addAnimKey({name:"sy", time, value : f[p + "sy"]});
    }
    function getFrame(spr, frame, namePrefix) {
        if (namePrefix === undefined) { namePrefix = "" }
        const p = namePrefix;
        frame[p + "x"] =  spr.x;
        frame[p + "y"] =  spr.y;
        frame[p + "rx"] = spr.rx;
        frame[p + "ry"] = spr.ry;
        frame[p + "sx"] = spr.sx;
        frame[p + "sy"] = spr.sy;
        return frame;
    }
    function getRelativeFrame(time, spr, relativeTo, atKey = false) {
        const p = utils.point;
        const p1 = utils.point;
        const p2 = utils.point;
        moveSpriteToTime(time, relativeTo);
        moveSpriteToTime(time, spr);
        const S = spr;
        const R = relativeTo;
        const frame = {};
        const RK = R.key;
        p1.x = S.x + Math.cos(S.rx) * S.sx * S.w;
        p1.y = S.y + Math.sin(S.rx) * S.sx * S.w;
        p2.x = S.x + Math.cos(S.ry) * S.sy * S.h;
        p2.y = S.y + Math.sin(S.ry) * S.sy * S.h;
        RK.toLocalP(S.x, S.y, p);
        RK.toLocalPoint(p1);
        RK.toLocalPoint(p2);
        frame.x =  p.x;
        frame.y =  p.y;
        frame.rx = Math.atan2(p1.y - p.y, p1.x - p.x);
        frame.ry = Math.atan2(p2.y - p.y, p2.x - p.x);
        frame.sx = Math.hypot(p1.x - p.x, p1.y - p.y);
        frame.sy = Math.hypot(p2.x - p.x, p2.y - p.y);
        if (atKey && spr.type.animated) {
            const t = spr.animation.tracks;
            frame.atKeys = {
                x:  (t.x && t.x.atKey) === true,
                y:  (t.y && t.y.atKey) === true,
                rx: (t.rx && t.rx.atKey) === true,
                ry: (t.ry && t.ry.atKey) === true,
                sx: (t.sx && t.sx.atKey) === true,
                sy: (t.sy && t.sy.atKey) === true,
            };
			frame.curves = {
                x:  (t.x && t.x.atKey) ? t.x.currentKey(time).curve : undefined,
                y:  (t.y && t.y.atKey) ? t.y.currentKey(time).curve : undefined,
                rx:  (t.rx && t.rx.atKey) ? t.rx.currentKey(time).curve : undefined,
                ry:  (t.ry && t.ry.atKey) ? t.ry.currentKey(time).curve : undefined,
                sx:  (t.sx && t.sx.atKey) ? t.sx.currentKey(time).curve : undefined,
                sy:  (t.sy && t.sy.atKey) ? t.sy.currentKey(time).curve : undefined,
			};
        }
        frame.t = time;
        return frame;
    }
    function setRelativeSprite(time, frame, spr, relativeTo, toAnim = true, atKey = false) {
        const atK = name => ((atKey && at[name]) || !atKey) === true;
        const p = utils.point;
        const p1 = utils.point;
        const p2 = utils.point;
        moveSpriteToTime(time, relativeTo);
        const RK = relativeTo.key;
        const f = frame;
        p.x = f.x;
        p.y = f.y;
        p1.x = f.x + Math.cos(f.rx) * f.sx;
        p1.y = f.y + Math.sin(f.rx) * f.sx;
        p2.x = f.x + Math.cos(f.ry) * f.sy;
        p2.y = f.y + Math.sin(f.ry) * f.sy;
        RK.toWorldPoint(p.x,p.y, p);
        RK.toWorldPoint(p1.x,p1.y, p1);
        RK.toWorldPoint(p2.x,p2.y, p2);
        var at, curves;
        if(atKey && frame.atKeys) { at = frame.atKeys; curves = frame.curves} else { atKey = false }
		if(atKey && toAnim && frame.curves) { curves = frame.curves; log("Adding curves") }
        if(toAnim) {
            const cf = {};
            atK("x") && spr.addAnimKey({name:"x" , time, value : cf.x = p.x, curve: curves ? curves.x : undefined});
            atK("y") && spr.addAnimKey({name:"y" , time, value : cf.y = p.y, curve: curves ? curves.y : undefined});
            atK("rx") && spr.addAnimKey({name:"rx", time, value : cf.rx = Math.atan2(p1.y - p.y, p1.x - p.x), curve: curves ? curves.rx : undefined});
            atK("ry") && spr.addAnimKey({name:"ry", time, value : cf.ry = Math.atan2(p2.y - p.y, p2.x - p.x), curve: curves ? curves.ry : undefined});
            if (spr.type.normalisable) {
                atK("sx") && spr.addAnimKey({name:"sx", time, value : cf.sx = Math.hypot(p1.x - p.x, p1.y - p.y), curve: curves ? curves.sx : undefined});
                atK("sy") && spr.addAnimKey({name:"sy", time, value : cf.sy = Math.hypot(p2.x - p.x, p2.y - p.y), curve: curves ? curves.sy : undefined});
            } else {
                atK("sx") && spr.addAnimKey({name:"sx", time, value : cf.sx = Math.hypot(p1.x - p.x, p1.y - p.y) / spr.w, curve: curves ? curves.sx : undefined});
                atK("sy") && spr.addAnimKey({name:"sy", time, value : cf.sy = Math.hypot(p2.x - p.x, p2.y - p.y) / spr.h, curve: curves ? curves.sy : undefined});
            }
            return cf;
        }
        spr.x =  atK("x") && p.x;
        spr.y =  atK("y") && p.y;
        spr.rx = atK("rx") && Math.atan2(p1.y - p.y, p1.x - p.x);
        spr.ry = atK("ry") && Math.atan2(p2.y - p.y, p2.x - p.x);
        if (spr.type.normalisable) {
            spr.sx = atK("sx") && Math.hypot(p1.x - p.x, p1.y - p.y);
            spr.sy = atK("sy") && Math.hypot(p2.x - p.x, p2.y - p.y);
            spr.normalize();
        } else {
            spr.sx = atK("sx") && Math.hypot(p1.x - p.x, p1.y - p.y) / spr.w;
            spr.sy = atK("sy") && Math.hypot(p2.x - p.x, p2.y - p.y) / spr.h;
            spr.key.update();
        }
    }
    function setRelativeFrame(time, rframe, relativeTo, w, h, frame = {}, atKey = false ) {
        const atK = name => ((atKey && at[name]) || !atKey) === true;
        const p = utils.point;
        const p1 = utils.point;
        const p2 = utils.point;
        moveSpriteToTime(time, relativeTo);
        const RK = relativeTo.key;
        const f = rframe;
        p.x = f.x;
        p.y = f.y;
        p1.x = f.x + Math.cos(f.rx) * f.sx;
        p1.y = f.y + Math.sin(f.rx) * f.sx;
        p2.x = f.x + Math.cos(f.ry) * f.sy;
        p2.y = f.y + Math.sin(f.ry) * f.sy;
        RK.toWorldPoint(p.x,p.y, p);
        RK.toWorldPoint(p1.x,p1.y, p1);
        RK.toWorldPoint(p2.x,p2.y, p2);
        var at;
        if(atKey && frame.atKeys) { at = frame.atKeys} else { atKey = false }
        frame.x =  atK("x")  ? p.x : undefined;
        frame.y =  atK("y")  ? p.y : undefined;
        frame.rx = atK("rx") ? Math.atan2(p1.y - p.y, p1.x - p.x) : undefined;
        frame.ry = atK("ry") ? Math.atan2(p2.y - p.y, p2.x - p.x) : undefined;
        frame.sx = atK("sx") ? Math.hypot(p1.x - p.x, p1.y - p.y) / w : undefined;
        frame.sy = atK("sy") ? Math.hypot(p2.x - p.x, p2.y - p.y) / h : undefined;
        return frame;
    }
    function convertToRelative(aSpr, A, returnToFirst = false) {
        const frames = [];
        for (const t of anim.frames) { frames.push(getRelativeFrame(t, A, anim.spr)) }
        selection.save();
        selection.clear();
        selection.add(A);
        issueCommand(commands.edSprClone);
        const tSpr = selection[0];
		if (pos.trackedCollection) {
			pos.trackedCollection.add(tSpr);
		}
        selection.restore();
        clearSpriteAnim(tSpr);
        var idx = 0;
		var start = anim.start;
		var end = anim.end;
		var fStart = start;
		var fEnd = end;
		if(aSpr.type.animated) {
			if(aSpr.animation.tracks.image) {
				fStart = aSpr.animation.tracks.image.keys[0].time;
				fEnd = aSpr.animation.tracks.image.keys[aSpr.animation.tracks.image.keys.length - 1].time;
			}
		}
        for(const t of anim.frames) {
			if (A.subs) {
				if (A.subs[0] <= t && A.subs[1] >= t) {
					setRelativeSprite(t, frames[idx++], tSpr, aSpr);
				} else {
					idx++;
				}
			} else {
				setRelativeSprite(t, frames[idx++], tSpr, aSpr);
			}
        }
        if(A.subs) {
            tSpr.addAnimKey({name:"a" , time: A.subs[0], value : 1});
            tSpr.addAnimKey({name:"a" , time: A.subs[1], value : 1});
            if(A.subs[0] > anim.start) {
                tSpr.addAnimKey({name:"a" , time: A.subs[0] - 1, value : 0});
            }
            if(A.subs[1] < anim.end) {
                tSpr.addAnimKey({name:"a" , time: A.subs[1] + 1, value : 0});
            }
            delete A.subs;
        }
		if(fStart < start) {
			tSpr.addAnimKey({name:"a" , time: start, value : 1});
			tSpr.addAnimKey({name:"a" , time: start - 1, value : 0});
		}
		if(fEnd > end) {
			tSpr.addAnimKey({name:"a" , time: end, value : 1});
			tSpr.addAnimKey({name:"a" , time: end + 1, value : 0});
		}
        tSpr.gridSpecial = spriteRender.gridSpecialNames.trackingPoint; // This is set incase copied sprite is converted to cutter then the
                                                                        // grid special tracking point will be set
        tSpr.key.update();
		if(returnToFirst) {
			firstFrame(()=>undefined);
		}
        return tSpr;
    }
    function createMeasureSprites() {
		const simpleSprite = (S, name) => {
			if(S) {
				if (S.w === A.w && S.h === A.h) {
					S.type.captureFeedback = false;
					S.fitTo(A);
					S.key.update();
					return S;
				} else {
					//media.remove(B.image);
					S.image = null;
				}
			} else {
				S = new Sprite(A.x, A.y, A.w, A.h, name);
			}
			const w = A.w;
			const h = A.h;
			media.create({ width : w | 0, height : h | 0 , type : "offScreenCanvas", simple: true, private : true }, img => S.changeImage(img, false, true));
			S.type.captureFeedback = false;
			S.fitTo(A);
			S.key.update();
			return S;
		}
        selection.clear();
        selection.add(A);
        AA = A.getSpriteLike(AA);
		B = simpleSprite(B, "Metric");
		C = simpleSprite(C, "StartMetric");
        A.type.captureFeedback = false;
    }
    function sampleFrame(S, frame = anim.idx) {
        if(S) {
            //A.a = 0;
            //B.a = 0;
            const ca = anim.positions[anim.idx];
            if(ca) {
                S.x =  ca.ax;
                S.y =  ca.ay;
                S.rx = ca.arx;
                S.ry = ca.ary;
                S.sx = ca.asx;
                S.sy = ca.asy;
                S.key.update();
                spriteRender.captureSpecial(S, S.image, anim.captureSprites);
            }
        }
    }
    function addCaptureSprites(clear = false) {
        if (clear) {

            anim.captureSprites.forEach(s => {
                if(s !== anim.spr) { s.name.replace("T_R","") }
            });

            anim.captureSprites.length = 0;
            anim.captureSprites[0] = anim.spr;
        } else {
            selection.each(s => {
                if (!anim.captureSprites.includes(s)) {
                    anim.captureSprites.push(s);
                    s.name += "T_R";
                }
            })
            anim.captureSprites.sort((a,b) => a.index - b.index);
        }
    }

    function ratePosition() {
        var dx, dy, rx, sx, sy, val, val1;
        A.x = pos.x + (dx = pos.steps[pos.idx][0] * pos.range);
        A.y = pos.y + (dy = pos.steps[pos.idx][1] * pos.range);
        A.rx = pos.rx + (rx = pos.rSteps[pos.rIdx] * pos.rangeR);
        A.ry = pos.ry + pos.rSteps[pos.rIdx] * pos.rangeR;
        A.sx = pos.sx * (1 + (sx = pos.sSteps[pos.sIdx] * pos.rangeSx));
        A.sy = pos.sy * (1 + (sy = pos.sSteps[pos.sIdy] * pos.rangeSy));
        A.key.update();
        B.fitTo(A);
        A.a = 0;
        B.a = 0;
        pos.distance = (dx * dx + dy * dy + rx * rx + sx * sx + sy * sy) ** 0.5;
		if (!useFirst) {
			spriteRender.captureSpecial(B, B.image, anim.captureSprites);

			let c = metricFunc(A.image,B.image, gain, compareRes, true, metricValue, true);
			if(debugging.isDebug) {
				debugging.addData("sum","#F00", metricFunc.sumShape);
				debugging.addData("var","#0F0", metricFunc.variance ** 0.5);
				debugging.addData("scr","#00F", (metricFunc.sumShape * metricFunc.variance ** 0.5) ** 0.5);
				//debugging.addData("dist","#0fF", pos.distance**2);
			}

			c = metricFunc.sumShape = (metricFunc.sumShape * metricFunc.variance ** 0.5) ** 0.5
			//c = metricFunc.sumShape =  metricFunc.variance ** 0.5;

			return c;
			// load tumblr_n5amdd1ysx1s9iw3ro1_250.gif
			// load northeast-bomb_h_GIFSoupcom.gif
		}
		spriteRender.captureSpecial(B, B.image, anim.captureSprites);
		val =  metricFunc(A.image,B.image, gain, compareRes, true, metricValue, true);
		val =  metricFunc.variance ** 0.5;
		const c = metricFunc.coverage;
		spriteRender.captureSpecial(B, B.image, anim.captureSprites);
		val1 = metricFunc(C.image,B.image, gain, compareRes, true, metricValue, true);
		val1 = val * metricFunc.variance ** 0.5
		metricFunc.sumShape = val1;
		metricFunc.coverage += c;
		metricFunc.coverage /= 2;
		return  val1;


    }
    function showRange(spr, ps = true, rot = true, sca = true) {
		const p = "#0f0", r = "#FF0", s = "#F00";
		const idxs = [
			[1,0,0,p],[2,0,0,p],[3,0,0,p],[4,0,0,p],
			[0,1,0,r],[0,2,0,r],[0,0,1,s],[0,0,2,s],
		]
		const A = spr;
		const x = A.x;
		const y = A.y;
		const rx = A.rx;
		const ry = A.ry;
		const sx = A.sx;
		const sy = A.sy;
		for(const idx of idxs) {
			if((ps && idx[0]) || (rot && idx[1]) || (sca && idx[2])){
				A.x = x + pos.steps[idx[0]][0] * pos.range;
				A.y = y + pos.steps[idx[0]][1] * pos.range;
				A.rx = rx + pos.rSteps[idx[1]] * pos.rangeR;
				A.ry = ry + pos.rSteps[idx[1]] * pos.rangeR;
				A.sx = sx * (1 + pos.sSteps[idx[2]] * pos.rangeSx);
				A.sy = sy * (1 + pos.sSteps[idx[2]] * pos.rangeSy);
				A.key.update();
				spriteRender.renderStack.push(A.getSpriteLike(), "border", 60, [idx[3], 1, 1, 0]);
			}
		}
		A.x = x;
		A.y = y;
		A.rx = rx;
		A.ry = ry;
		A.sx = sx;
		A.sy = sy;
		A.key.update();
    }
    function setupFollower() {
        if(refSpriteCopy === undefined) {
            if(anim.spr && anim.spr.type.attached) {
                refSpriteCopy = anim.spr.attachedTo;
                referenceSprite = undefined;
                return;
            }
        }
        if(refSpriteCopy === undefined) {
            const rs = referenceSprite;
            const s = new Sprite(rs.x,rs.y,rs.w*rs.sx,rs.h*rs.sy,"Dragger");
            media.create({ width : rs.w | 0, height : rs.h | 0 , type : "offScreenCanvas", private : true }, img => { s.changeImage(img, false, true) });
            s.key.update();
			s.locks.UI = true;
            sprites.addBottom(s);
            const offx = (anim.spr.x - rs.x)+ (rs.w * rs.sx * 0.5);
            const offy = (anim.spr.y - rs.y) + (rs.h * rs.sy * 0.5);
            refSpriteCopy = s;
            for(const t of anim.frames) {
                rs.setAnimFrame(t)
                s.addAnimKey({name:"x", time: t, value :  rs.x + offx});
                s.addAnimKey({name:"y", time: t, value :  rs.y + offy});
                s.addAnimKey({name:"rx", time: t, value : rs.rx});
                s.addAnimKey({name:"ry", time: t, value : rs.ry});
                s.addAnimKey({name:"sx", time: t, value : 1});
                s.addAnimKey({name:"sy", time: t, value : 1});
            }
            rs.setAnimFrame(anim.start)
            rs.key.update();
            clearSpriteAnim(rs);
            rs.a = 0;
            s.setAnimFrame(anim.start);
            convertToDragger(s);
            s.setAnimFrame(anim.start);
            s.key.update();
            referenceSprite = undefined;
            anim.spr.attachSprite(s);
            anim.spr.attachment.position();
            anim.spr.attachment.rotateType = "inherit";
            anim.spr.attachment.scaleAttach = true;
            anim.spr.attachment.inheritScaleX = true;
            anim.spr.attachment.inheritScaleY = true;
            anim.spr.key.update()
            //clearSpriteAnim(A);
            //setRelativeSprite(anim.start, anim.relStartFrame, A, anim.spr, false);
            anim.relStartFrame = undefined;
            sprites.cleanup()
            sprites.update();
            spriteList.update();
        }
    }
    function relTrackComplete() {
        if(refSpriteCopy) {
            anim.relStartFrame = getRelativeFrame(anim.start, A, anim.spr);
            makeRelativeToReference(A);
            clearSpriteAnim(A);
            setRelativeSprite(anim.start, anim.relStartFrame, A, anim.spr, false);
            anim.relStartFrame = undefined;
        }
    }
    function hunt() {
        var i, value, min, sVal, firstIdx = 0, bestSprLike;
        if (pos.best === -1) {
            pos.best = 0;
        } else { firstIdx = 1 }
        pos.toIdx(firstIdx);
        pos.skip = false;
        if(pos.useSubScans && pos.subScans.length && anim.frames[anim.idx] < pos.subScans[0][0]){
          //  log("Hunt early skip");
            pos.best = 0;
            pos.bextValue = 0;
            pos.bestDist = 0;
            pos.refine();
            setPos();
            return;
        }
        if(scanMethod === scanMethods.frameAdvance && anim.frames[anim.idx] < Math.max(anim.start, anim.advanceToFrame - advanceFrameRewindCount)) {
            pos.best = 0;
            pos.bextValue = 0;
            pos.bestDist = 0;
            pos.refine();
            setPos();
            return;
        }
        if (pos.bestValue > 1){
            i = firstIdx;
            while (i < pos.stepCount) {
                ratePosition();
                value = metricFunc.sumShape;
				//log(metricFunc.coverage)
                if (metricFunc.coverage < pos.minCoverage) {
                    pos.best = 0
                    pos.bestValue = 0;
                    pos.bestDist = pos.distance;
					log("low coverage");
                    //pos.skip = true;
					if(debugging.isDebug) {debugging.addData("best","#Ff0", -1);}
                    break;
                }
                if (value < pos.bestValue) {
                    pos.best = i;
                    pos.bestValue = value;
                    pos.bestDist = pos.distance;
                    bestSprLike = B.getSpriteLike();
					if(debugging.isDebug) {debugging.addData("best","#Ff0", value);}
                    if (pos.bestValue <= 1) {
                        break
                     }
                }else { if(debugging.isDebug) {debugging.addData("best","#Ff0", -1)} }
                i++;
                pos.toIdx(i)
            }
        }
        pos.refine();
		bestSprLike && spriteRender.renderStack.push(bestSprLike, "border", 1, ["#FF0", 1, 0.6, 0]);
        setPos();
    }
    function setPos(){
	    if(debugging.isDebug) { debugging.update() }

        if (scanMethod !== scanMethods.frameAdvance){
            busy.progress = animation.time / animation.length;
        }
        if(stopNow) { trackComplete(); return }
        if (pos.range >= distMin  && pos.bestValue > 1 && !pos.skip) {
            callIn(hunt,0);
        } else {
            if(pos.bestDist < Infinity && pos.bestDist > pos.bestDistMax) {
                pos.bestDistMax = pos.bestDist;
            }
            if(pos.type === types.follow){
                if(anim.idx < anim.frames.length - 1) {
                    sampleFrame(A);
                    const ca = anim.positions[anim.idx + 1];
                    ca.x = A.x;
                    ca.y = A.y;
                    ca.rx = A.rx;
                    ca.ry = A.ry;
                    ca.sx = A.sx;
                    ca.sy = A.sy;
                }
            }
			if(debugging.isDebug) {
			    debugging.addMark(""+animation.frame,"#AAA");
				debugging.update();
			}
            pos.nextFrame();
            if(((scanMethod !== scanMethods.frameAdvance && anim.idx < anim.frames.length && !pos.useSubScans) ||
                (scanMethod === scanMethods.frameAdvance && anim.idx < Math.min(anim.frames.length, anim.advanceToFrame))) && !stopWhenCan) {
                callIn(time, 2);

                return;
            }
            if(pos.subScans.length && pos.useSubScans && anim.frames[anim.idx] <= pos.subScans[0][1] && !stopWhenCan) {
                callIn(time, 2);
                return;
            }

			if(scanMethod === scanMethods.zero || scanMethod === scanMethods.prsZero || scanMethod === scanMethods.prZero) {
				var dif = 0;
				if(pos.currentStats.total === undefined) { dif = 1 }
				else { dif = pos.total - pos.currentStats.total }
				pos.currentStats.total = pos.total;
				pos.currentStats.totalArea = pos.totalArea;
				pos.difs[0] = includePos ? dif : pos.difs[0];
				pos.difs[1] = includeRotate ? dif : pos.difs[1];
				pos.difs[2] = includeScale ? dif : pos.difs[2];
				pos.difs[2] = includeScaleNonUniform ? dif : pos.difs[2];
				if(dif !== 0 || scanMethod === scanMethods.prsZero || scanMethod === scanMethods.prZero) {
					if(scanMethod === scanMethods.prsZero || scanMethod === scanMethods.prZero) {
						if(includePos) {
							includePos = false;
							includeRotate = true;
						} else if(includeRotate) {
							if(scanMethod === scanMethods.prZero) {
								pos.countedRepeats ++;
								if(pos.difs[0] === 0 && pos.difs[1] === 0) {
									trackComplete();
									return;
								}
								includePos = true;
								includeRotate = false;
								if(Math.max(pos.difs[0], pos.difs[1]) > 0) {
									pos.difCorrectingCount--;
									distMin *= REFINE_MAX_UP;
								}else { distMax *= REFINE_MAX_DOWN }
							} else {
								includeRotate = false;
								if(scaleUniform) { includeScale = true }
								else { includeScaleNonUniform = true }
							}
						} else if(includeScale || includeScaleNonUniform) {
							pos.countedRepeats ++;
							if(pos.difs[0] === 0 && pos.difs[1] === 0 && pos.difs[2] === 0) {
								trackComplete()
								return;
							}
							includePos = true;
							includeScale = false;
							includeScaleNonUniform = false;
							if(Math.max(pos.difs[0], pos.difs[1], pos.difs[2]) > 0 ) {
								pos.difCorrectingCount--;
								distMin *= REFINE_MAX_UP;
							} else { distMax *= REFINE_MAX_DOWN }
						}
					}
					if(scanMethod === scanMethods.zero) {
						pos.countedRepeats ++;
						if(dif > 0) {
							pos.difCorrectingCount--;
							distMin *= REFINE_MAX_UP
						}else { distMax *= REFINE_MAX_DOWN }
					}
					if(distMax > pos.bestDistMax) { distMax *= REFINE_MAX_DOWN }
					else if(distMax < pos.bestDistMax) { distMax *= REFINE_MAX_UP }
					if(pos.countedRepeats > pos.repeat || distMax < distMin || distMax > distMaxSet * 2 || pos.difCorrectingCount <= 0) {
						trackComplete();
					} else { repeatTracking() }
				} else { trackComplete() }
			} else {
				pos.currentStats.total = pos.total;
				pos.currentStats.totalArea = pos.totalArea;
				if (scanMethod === scanMethods.frameAdvance) {
					if(anim.advanceToFrame - advanceFrameRewindCount < anim.frames.length) {
						anim.advanceToFrame += advanceFrameStep;
                        busy.progress = (anim.advanceToFrame - advanceFrameRewindCount) / anim.frames.length;
						repeatTracking();
					} else { trackComplete() }
				} else {
					pos.countedRepeats ++;
					trackComplete();
				}
			}

        }
    }
    var hideAWhenDone = false;
    function trackComplete(){
        if(!stopWhenCan && pos.useSubScans && pos.subScans.length > 1 && (scanMethod === scanMethods.simple || pos.countedRepeats < pos.repeat)) {
            repeatTracking();
            return;
        }
        hideAWhenDone = false;
        distMax = distMaxSet;
        distMin = distMinSet;
        tracking = false;
        heartBeat.registerBusyProcess(id,false)

        setAnimKeys();
        if(pos.type === types.follow){
            if(refSpriteCopy || referenceSprite) {
                firstFrame(() => {
                    relTrackComplete();
                    if(pos.move2SecondAnim && pos.secondSprite) {
                        convertToRelative(pos.secondSprite, A);
                    }
                    A.a = 0;
                    if(pos.useSubScans && pos.subScanMethod === subScanMethods.background) {
                        resetBackgroundKeyFrames();
						if(pos.useSubScansClearWhenDone) {
							pos.useSubScans = false;
							pos.useSubScansClearWhenDone = false;
						}
                    }
                    tracked.push(A);
                    A = undefined;
                    hideAWhenDone = true;
                    firstFrame(nextTrack);
                });
                return;
            }
        }
        tracked.push(A);
        A = undefined;
        firstFrame(nextTrack);
    }
    var processingSub;
    function repeatTracking(){
        if(stopWhenCan) { trackComplete(); return }
        setAnimKeys();
        if(pos.type === types.follow){
            if(refSpriteCopy || referenceSprite) {
                if(pos.useSubScans && pos.subScans.length) {
                    processingSub = pos.subScans.shift();
                    //pos.subScans.shift();
                    pos.relativeFrames.shift();
                }
                tracking = false;
                firstFrame(() => {
                    relTrackComplete();
                    processingSub = undefined;
                    tracking = true;
                    if(pos.useSubScans && pos.subScans.length) {
                        updateBackgroundKeyFrames();
                    }
                    repeatTrackingReady();
                });
                return;
            }
        }
        repeatTrackingReady();
    }
    function repeatTrackingReady(){
        A.setAnimFrame(anim.start);
        anim.idx = 0;
        pos.total = 0;
        pos.totalArea = 0;
        if (scanMethod === scanMethods.frameAdvance || (pos.subScans.length && pos.useSubScans)) {
            if(pos.subScans.length && pos.useSubScans) {
                getAnimationPos();
                //getAnimationPosSub();
                seekToFrame = pos.subScans[0][0] - 1;
            } else {
                getAnimationPos();
                seekToFrame = Math.max(anim.start,anim.advanceToFrame - (advanceFrameRewindCount+1));
                seekToFrame = Math.min(anim.end - 1, seekToFrame);
            }
            while(anim.frames[anim.idx] < seekToFrame) {
                pos.report.length = 0;
                pos.skip = false;
                pos.best = -1;
                if (pos.currentStats.best[anim.idx] !== undefined) {
                    pos.lastBest = pos.bestValue;
                    pos.bestDist = distMaxSet;
                    pos.bestValue = Infinity;
                } else {
                    pos.bestDist = distMaxSet;
                    pos.bestValue = Infinity;
                    pos.lastBest = -1;
                }
                pos.fromRange = distMax;
                const ca = anim.positions[anim.idx];
                ca.skip = false;
                if(pos.type === types.follow) {
                    pos.x =  ca.ax;
                    pos.y =  ca.ay;
                    pos.rx = ca.arx;
                    pos.ry = ca.ary;
                    pos.sx = ca.asx;
                    pos.sy = ca.asy;
                }
                pos.best = 0;
                pos.bextValue = 0;
                pos.bestDist = 0;
                pos.nextFrame();
            }
            seekToTime(anim.frames[anim.idx], () => {
				if(useFirst && pos.useSubScans) {
					sampleFrame(C);
					log("Cap first @" + anim.idx);
				}
                if (currectTrackSpr.type === types.follow) {
                }
                time();
            });
            seekToFrame = 0;
            return;
        } else {
            getAnimationPos();
        }
        if (currectTrackSpr.type === types.follow) {
            if(anim.idx < anim.positions.length) {
				sampleFrame(A)
            }
        }
        time();
    }
    function getSubSections() {
        pos.subScans.length = 0;
        pos.relativeFrames.length = 0;
        if(pos.subScanMethod === subScanMethods.markers) {
            /*
            const marks = timeline.marks;
            const subSections = new Map();
            for(const m of marks) {
                let sub;
                if(subSections.has(m.name)) {
                    sub = subSections.get(m.name);
                    const start = Math.min(sub.start, sub.end, m.time);
                    const end = Math.max(sub.start, sub.end, m.time);
                    sub.start = start;
                    sub.end = end;
                } else {
                    subSections.set(m.name,{start: m.time, end: m.time});
                }
            }
            const subs = [...subSections.values()].sort((a,b) => a.start - b.start);
            for(const s of subs) {
                pos.subScans.push([s.start, s.end]);
            }
            */
            log.warn("Marker sub sections has been depreciated");
        } else if(pos.subScanMethod === subScanMethods.background) {
            if(A && A.type.animated) {
                const a = A.animation;
                const t = a.tracks;
                const keyTimes = new Set();
                for(const trackName of ["x","y"]) {
                    if(t[trackName]) {
                        t[trackName].eachKey(k => {
                            var time = k.time;
                            if(time < anim.start) { time = anim.start }
                            if(time > anim.end) { time = anim.end }
                            keyTimes.add(k.time)
                        });
                    }
                }
                const subs = [...keyTimes.values()].sort((a,b)=>a-b);
                let i = 0;
                while (i < subs.length - 1) {
                    if(subs[i + 1] === anim.end) {
                        pos.subScans.push([subs[i++], subs[i]]);
                    } else {
                        pos.subScans.push([subs[i++], subs[i]]);
                    }
                }
                A.subs = [pos.subScans[0][0], pos.subScans[pos.subScans.length - 1][1]];
            } else {
                pos.subScans.push([anim.start,anim.end ]);
                A.subs = [pos.subScans[0][0], pos.subScans[pos.subScans.length - 1][1]];
            }
        }
    }
    function cleanup() {
        clearTimeout(timeoutHDL);
        if(tracking) {
            if(error) {
                error = false;
                setAnimKeys();
            }
        }

		metricFunc(); // clear buffers
        tracking = false;
        heartBeat.registerBusyProcess(id,false)
        if(A) { tracked.push(A); A = undefined }
        tracked.push(...trackers);
        trackers.length = 0;
		trackerStartY = trackerStartX = undefined;
        if(!hideAWhenDone){for(const t of tracked) { t.a = 1; }}
        tracked.length = 0;
        currectTrackSpr = undefined;
        if(stopNow) {
            log.warn("Tracker forced to stop by user");
        } else if(stopWhenCan) {
            //log.info("Tracker stopped by user");
        }
        stopWhenCan = false;
        stopNow = false;
        if(workspaceTime !== undefined) {
            animation.time = workspaceTime;
            workspaceTime = undefined;
        }
        API.fireEvent("update", "trackingEnd");
    }

	var trackerStartX, trackerStartY
	function getClosestTracker() {
		var idx = 0, minIdx, min = Infinity;
		for(const tracker of trackers) {
			const dx = tracker.sprite.x - trackerStartX;
			const dy = tracker.sprite.y - trackerStartY;
			const dist = (dx * dx + dy * dy) ** 0.5;
			if(dist < min) {
				min = dist;
				minIdx = idx;
			}
			idx ++;
		}
		return trackers.splice(minIdx,1)[0];

	}
	function nextTrack() {
        if(stopNow || stopWhenCan) {
            cleanup();
            return;
        }
        var hideAWhenDone = false;
        if(atFirstFrame) {
            if(trackers.length > 0) {
                if(pos.move2SecondAnim) {
                    if(nextTrackStartAction === nextTrackStartActions.RestoreAnim) {
                        setRefFrames();
                    } else if(nextTrackStartAction === nextTrackStartActions.ClearAnim) {
                        setRefFrames(true);
                    }
                }
                distMaxSet = distMax;
                distMinSet = distMin;
                tracking = true;
                heartBeat.registerBusyProcess(id,true,scanMethodName);
                const spr = trackerStartX !== undefined ? getClosestTracker() : trackers.shift();
				if(spr.sprite.type.animated && !pos.useSubScans) {
					const t = spr.sprite.animation.tracks.x;
					if(t) {
						var atLeast = 0
						for(const k of t.keys) {
							if(k.time >= anim.start && k.time <= anim.end) {
								atLeast ++;
								if(atLeast >= 2) {
									pos.useSubScansClearWhenDone = true;
									pos.useSubScans = true;
									pos.subScanMethod = subScanMethods.background;
									break;
								}
							}
						}
					}
				}
				trackerStartX = spr.sprite.x;
				trackerStartY = spr.sprite.y;
                currectTrackSpr = spr;
                A = spr.sprite;
                pos.type = spr.type;
                if(displaySpr){ displaySpr.image.ctx.clearRect(0,0,displaySpr.image.width,displaySpr.image.height) }
                A.setAnimFrame(anim.start)
                createMeasureSprites();
                anim.idx = 0;
                pos.countedRepeats = 0;
                if (scanMethod === scanMethods.frameAdvance) {
                    let val = distMaxSet;
                    let distSteps = 1;
                    while(val > distMin) { val /= 2; distSteps ++}
                    advanceFrameRewindCount = distSteps;
                    anim.advanceToFrame = Math.min(advanceFrameStep, anim.frames.length);
                }
                pos.total = 0;
                pos.totalArea = 0;
                pos.bestDistMax = 0;
                pos.difCorrectingCount = (Math.log2(distMax * 16 - distMin * 16) | 0) + 1;
                pos.difs = [0,0,0] ;
                if(pos.stats.has(A.guid)) {
                    pos.currentStats = pos.stats.get(A.guid);
                } else {
                    pos.currentStats = {
                        prevFrames: [],
                        best:[],
                    };
                    pos.stats.set(A.guid, pos.currentStats);
                }
                pos.relativeFramesInit.length = 0;
                getAnimationPos();
				sampleFrame(A)
                if (spr.type === types.follow || scanMethodCap) {
					//useFirst && sampleFrame(C);
					if(useFirst && !pos.useSubScans) {
						sampleFrame(C);
						log("Cap first @" + anim.idx);
					}
				}
                API.fireEvent("update", "nextTrack");
                time();
				if(debugging.isDebug) { debugging.startTrack() }
            } else { cleanup() }
        }else{
            log.warn("Could not seek to first frame");
            error = true;
            cleanup();
        }
    }
	function checkSpriteSafeForSubTracks(spr) {
		const keyPos = new Uint8Array(anim.end - anim.start + 1);
		var error = "";
		var first = true;
		function countKeys(keys) {
			var atLeast = 0;
			for(const k of keys.keys) {
				if(k.time >= anim.start && k.time <= anim.end) {
					atLeast ++;
					if (first) { keyPos[k.time - anim.start] = 1; }
					else if(keyPos[k.time - anim.start] !== 1) {
					    error += "Keys are out of alignment.";
					    return false
					}
				}
			}
			if(atLeast < 2) {
				error += "Sub path tracking requiers at least 2 key frames";
				return false;
			}
			return true;
		}
		if(spr.type.animated) {
			const tracks = spr.animation.tracks;
			const posOK = tracks.x !== undefined && tracks.y !== undefined ;
			const rotOK = tracks.rx !== undefined  && tracks.ry !== undefined ;
			const scaleOK = tracks.sx !== undefined  && tracks.sy !== undefined ;
			if (includePos) {
			    if (posOK === includePos) {
					if (!countKeys(tracks.x) || !countKeys(tracks.y)) { return error }
				}else { return "Position Sub tracks requiers x,y keys" }
			}
			if (includeRotate) {
				if (rotOK === includeRotate) {
					if (!countKeys(tracks.rx) || !countKeys(tracks.ry)) { return error }
				}else { return "Rotation Sub tracks requiers rx,ry keys" }
			}
			if (includeScale) {
				if (scaleOK === includeScale) {
					if (!countKeys(tracks.sx) || !countKeys(tracks.sy)) { return error }
				}else { return "Scaling Sub tracks requiers sx,sy keys" }
			}
			return true;
		}
		return true;

	}

    function time(frame) {
        if (frame === undefined) {
            frame = anim.frames[anim.idx];
            if (frame < animation.startTime) {
                frame = animation.startTime;
            }
        }
        currentFrame = animation.time;
        if(currentFrame === frame) {
            currentFrame = frame - 1;
            animation.fTime = frame;
        } else if(currentFrame > frame) {
            currentFrame = frame - 1;
            animation.time = frame;
        } else { animation.time = frame }
    }
    function callIn(functionToCall, time = rate) {
        if(ready) {
            mouse.active = true;  // to keep renderer awake
            timeoutHDL = setTimeout(functionToCall, time);
        } else {
            log.warn("Tracker encountered a problem!!")
        }
    }
    function firstFrame(func) {
        atFirstFrame = false;
        seekToFirst = true;
        fireOnFirstFrame = func;
        time(anim.start);
    }
    var seekingToTime = false;
    var seekToFrameTime = 0;
    var fireOnTimeFrame;
    var atTimeFrame = false;
    function seekToTime(t, func) {
        atTimeFrame = false;
        seekingToTime = true;
        seekToFrameTime = t;
        fireOnTimeFrame = func;
        time(t);
    }
    function beforTimeChange() {
        if(tracking) {
            if (frameStep === undefined) {
                animation.videosSeekError = false;
                frameStep = timeline.frameStep;
            }
        }
    }
    function animTimeChanged() {
        if(ready){
            if(seekingToTime) {
                if(animation.time === seekToFrameTime) {
                    extraRenders.addOneTimeReady(seekFrameReady);
                } else {
                    log.warn("failed to seek to time " + seekToFrameTime);
                    cleanup();
                }
            }else  if(tracking) {
                if(animation.time >= currentFrame + 1){
                    extraRenders.addOneTimeReady(frameReady);
                }else {
                    log.warn("failed to seek At " + animation.time + " wanted : " + currentFrame);
                    error = true;
                    cleanup();
                }
            } else if(seekToFirst) {
                if(animation.time === anim.start) {
                    extraRenders.addOneTimeReady(firstFrameReady);
                } else {
                    log.warn("failed to seek to start ");
                    cleanup();
                }
            } else {
                currentFrame = animation.time;
                if(currentFrame === anim.start && atStartFunction) {
                    callIn(atStartFunction);
                    atStartFunction = undefined;
                }
            }
        }
    }
    function seekFrameReady() {
        atTimeFrame = true;
        seekingToTime = false;
        fireOnTimeFrame();
        seekToFrameTime = 0;
    }
    function firstFrameReady() {
        atFirstFrame = true;
        seekToFirst = false;
        fireOnFirstFrame();
    }
    function frameReady(){
        if(ready && tracking){
            currentFrame = animation.time;
            pos.startFrame();
            hunt();
        }
    }
    const API = {
        updateStatus: "",
        get isReady() { return ready },
        startup() {
            if(!ready) {
                heartBeat.registerBusyProcess(id,false)
                animation.addEvent("change", animTimeChanged);
                animation.addEvent("befortimechange", beforTimeChange);
                ready = true;
                log("Tracker Ready");
            }
        },
        stop() {
            if (tracking) {
                if (stopWhenCan) {
                    stopNow = true;
                } else {
                    stopWhenCan = true;
                }
            }
        },
        shutDown() {
            ready = false;
            displaySpr = undefined;
            animation.removeEvent("change", animTimeChanged);
            animation.removeEvent("befortimechange", beforTimeChange);
            cleanup();
            tracking = false;
            heartBeat.registerBusyProcess(id,false)
            trackers.length = 0;
            if(B) {
                media.remove(B.image);
                B = undefined;
                A = undefined;
            }
            clearTimeout(timeoutHDL);
            referenceSprite = undefined;
            refSpriteCopy = undefined;
            anim.start = 0;
            anim.end = 0;
            anim.frames.length = 0;
            anim.spr = undefined;
            log("Tracker shut down");
        },
        isTracking() { return tracking },
        distMin(val) {
            distMinSet = distMin = val < 1 / 16 ? 1 / 16 : val > distMaxSet ? distMaxSet : val;
        },
        distMax(val) {
            val = val < distMin ? distMin : val;
            distMaxSet = distMax = val;
        },
        gain(val) {
            if (val === "linear") {
                val = 0.1;
            }
            gain = val;
        },
        displaySprite(spr) {
            if(spr === undefined) {
                displaySpr = undefined;
            } else  if(spr.type.image && spr.image.isDrawable) {
                ix = 0;
                iy = 0;
                displaySpr = spr;
            }
        },
        clearRefSpriteAnim(from = 0) {
            if(refSpriteCopy) {
                if(from > 0) {
                    clearSpriteAnimRange(refSpriteCopy, from);
                } else {
                    clearSpriteAnim(refSpriteCopy);
                }
            }
        },
        clearSelectedTrackers(from = 0) {
            if(selection.length === 0 || (selection.length === 1 && !selection[0].type.animated)) {
                API.clearRefSpriteAnim(from);
                animation.forceUpdate();
                return refSpriteCopy;
            } else {
                selection.eachOfType(spr => {
                    if(from > 0) {
                        clearSpriteAnimRange(spr, from);
                    }else {
                        clearSpriteAnim(spr);
                        pos.stats.delete(spr.guid);
                    }
                },"animated");
            }
            animation.forceUpdate();
        },
        animSprite(spr) {

            anim.spr = spr;
            spr.smoothing = true;
            anim.resetFrames();
        },
        setCompareFunction(type, compRes = compareRes){
            if(type === "Difference") {
                metricValue = true;
                metricShape = false;
            } else if(type === "Diff by Shape") {
                metricValue = true;
                metricShape = true;
            } else if(type === "Shape") {
                metricValue = false;
                metricShape = true;
            }
            metricType = type;
            if (compareRes !== compRes) {
                compareRes = compRes;
            }
        },
        track() {
            return;
            timeline.editMode = timeline.editModes.place;
            if(anim.spr !== undefined) {
                selection.eachOfType(spr => {
                    if(spr !== anim.spr && spr !== refSpriteCopy ) {
                        if(spr.image.isDrawable) {
                            spr.smoothing = true;
                            trackers.push({sprite:spr, type:types.track});
                        }
                    }
                    if(spr === refSpriteCopy) { log.warn("Can not track reference sprite") }
                    if(spr === anim.spr)  { log.warn("Can not track animation sprite") }
                },"image");
                if(trackers.length) {
                    if(workspaceTime === undefined) {
                        workspaceTime = animation.time;
                    }
                    if(!tracking) {
                        firstFrame(nextTrack);
                    }
                }else {
                    log.info("no Tracking sprites selected");
                }
            } else {
                log.info("Animation sprite not set!");
            }
        },
        useFollower() {
            if(refSpriteCopy) {
                if(selection.length === 1 && selection[0] !== refSpriteCopy && selection[0] !== anim.spr) {
                    const t = animation.time;
                    A = selection[0];
                    relTrackComplete();
                    seekToTime(t, () => {
                        animation.forceUpdate();
                    });
                    A = undefined;
                }else {
                    log.warn("Selected sprite can not be used.");
                }
            }else {
                log.warn("Can not use follower, relative dragger not defined");
            }
        },
        trackUsing(pos, rotate, scale, uniform) {
            includePos = pos;
            if(uniform) {
                scaleUniform = uniform;
                includeScale = scale;
                includeScaleNonUniform = false;
            } else {
                scaleUniform = uniform;
                includeScale = false;
                includeScaleNonUniform = scale;
            }
            includeRotate = rotate;
            API.track();
        },
        followUsing(pos, rotate, scale, uniform, first) {
            includePos = pos;
			useFirst = first;
            if(uniform) {
                scaleUniform = uniform;
                includeScale = scale;
                includeScaleNonUniform = false;
            } else {
                scaleUniform = uniform;
                includeScale = false;
                includeScaleNonUniform = scale;
            }
            includeRotate = rotate;
            API.follow();
        },
        follow() {
			var canProcess = true;
			selection.eachOfType(spr => {
				if(spr !== anim.spr && spr.image.isDrawable) {
					const res = checkSpriteSafeForSubTracks(spr);
					if (res !== true) {
						log.warn(res);
						canProcess = false;
						return true;
					}
				}

			},"image");

			if (!canProcess) {return};
            timeline.editMode = timeline.editModes.place;
            anim.resetFrames();
            if(anim.spr !== undefined) {

                selection.eachOfType(spr => {
                    if(spr !== anim.spr) {
                        if(spr.image.isDrawable) {
                            trackers.push({sprite:spr, type:types.follow});
                        }
                    }
                },"image");
                if(trackers.length) {
                    if(selection.length > 1) {
                        pos.move2SecondAnim = true;
                    } else {
                        pos.move2SecondAnim = false;
                    }
                    if(workspaceTime === undefined) {
                        workspaceTime = animation.time;
                    }
                    if(!tracking) {
                        firstFrame(nextTrack);
                    }
                }else {
                    log.info("no Tracking sprites selected");
                }
            } else {
                log.info("Animation sprite not set!");
            }
        },
        /*useSubScans(val) {
            if(val === "Background") {
                pos.useSubScans = true;
                pos.subScanMethod = subScanMethods.background;
            }else {
                pos.useSubScans = val;
                pos.subScanMethod = subScanMethods.markers;
            }
        },*/
        setScanMethod(method) {
            var capBit = 0;
            scanMethodCap = false;
            if(method.includes("Simple")) {
                scanMethodName = "Simple";
                scanMethod = scanMethods.simple;
            } else if(method.includes("Frame Advance")) {
                scanMethodName = "F Advance";
                scanMethod = scanMethods.frameAdvance;
            } else if(method.includes("Refine to zero")) {
                scanMethodName = "Refine";
                scanMethod = scanMethods.zero;
            }else if(method.includes("PRS to zero")) {
                scanMethodName = "PRS";
                scanMethod = scanMethods.prsZero;
            }else if(method.includes("PR to zero")) {
                scanMethodName = "PR";
                scanMethod = scanMethods.prZero;
            }
        },
        setTrackStartAction(action) {
            action = action.replace(/ /g,"");
            nextTrackStartAction = nextTrackStartActions[action];
        },
        captureStartAnim(useAttached) {
            getRefFrames(useAttached);
        },
        asReference() {
            if(refSpriteCopy === undefined) {
                if(anim.spr && anim.spr.type.attached) {
                    refSpriteCopy = anim.spr.attachedTo;
                    referenceSprite = undefined;
                    log.info("using existing reference")
                    return refSpriteCopy;
                }
            }
            if(refSpriteCopy && !sprites.getById(refSpriteCopy.guid)) {
                selection.each(spr => {
                    if(spr !== anim.spr  &&  spr.type.image) {
                        referenceSprite = spr;
                        refSpriteCopy = undefined;
                        log.info("Reference sprite reset")
                        return true;
                    }
                });
                log.warn("Could not use selected sprites");
            } else {
                var failed = true;
                selection.each(spr => {
                    if(spr !== anim.spr &&  spr.type.image) {
                        if(referenceSprite === spr){
                            referenceSprite = undefined;
                            refSpriteCopy = undefined;
                            log.info("Reference sprite unset");
                            failed = false;
                            return true;
                        } else {
                            referenceSprite = spr;
                            refSpriteCopy = undefined;
                            failed = false;
                            setupFollower();
                            log.info("Reference sprite set")
                            return true;
                        }
                    }
                });
                if(failed){
                    log.warn("Could not use selected sprites");
                    referenceSprite = undefined;
                    refSpriteCopy = undefined;
                    log.info("Reference sprite unset");
                }
            }
            return refSpriteCopy;
        },
        setTrackRelative(aSpr, bigA){
            timeline.editMode = timeline.editModes.place;
            return convertToRelative(aSpr, bigA, true);
        },
        set2ndAnim(s2ndSpr) {
            pos.secondSprite = s2ndSpr;
			if(!pos.trackedCollection) {
				pos.trackedCollection = collections.create([],undefined,"tracks");
			}
        },
		has2ndAnim() { return pos.secondSprite !== undefined },
        setMaxRepeat(maxRepeat) {
            if(maxRepeat === 0) {
                pos.repeat = MAX_REPEAT;
            } else {
                pos.repeat = maxRepeat;
            }
        },
        asRelative() {
            if(selection.length === 1) {
                if(selection[0] !== referenceSprite) {
                    makeRelativeToReference(selection[0]);
                }else {
                    log.warn("Selected sprite is reference sprite and can not be made relative");
                }
            }else{
                log.warn("Only one sprite can be moved relative at a time");
            }
        },
        convertToDragger() {
            var count = 0;
            selection.eachOfType(spr => {
                convertToDragger(spr);
                count ++;
            },"animated");
            animation.forceUpdate();
            return count;
        },
		showRanges(position,rot,scale) {
			const A = selection[0];
			if(A) {
				var size = Math.abs(Math.hypot(A.w * A.sx, A.h * A.sy)) / 2;
				var r = pos.fromRange = distMax;
				pos.rangeR = pos.rangeX = pos.rangeY = pos.range = r;
				pos.rangeR = r / size;
				pos.rangeSy = pos.rangeSx = Math.max(((A.w * A.sx) + r) / (A.w * A.sx) - 1, ((A.h * A.sy) + r) / (A.h * A.sy) - 1);
				showRange(A, position,rot,scale);
			}

		},
        addSelectedToCapture() {
            addCaptureSprites();
        },
        clearCaptureSprites() {
            addCaptureSprites(true);
        },
		debugCanvas(state) {
			if(!state) {
				debugging.off();
			} else {
				debugging.on();

			}

		},
    };
    Object.assign(API, Events(API));
    API.addEvent("update",(e,n, data) => {
        API.updateStatus = data;
    }  );
    return API;
})();