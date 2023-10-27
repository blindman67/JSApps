function canvasRecorder(canvas, playback, settings) {
    const mimeType = mimeType => ({mimeType});
    const options = ["video/webm", "video/webm,codecs=vp9", "video/vp8"];
    var buffer, recorder, recorded, pauseRecordHandle;
    const sourceOpen = e =>  buffer = source.addSourceBuffer('video/webm; codecs="vp8"');
    const dataAvailable = e => { if (e.data && e.data.size > 0) { recorded.push(e.data) } };
    var playbackURL;
    const stop = () => {
        if(playback) {
            if(playbackURL) { URL.revokeObjectURL(playbackURL)  }
            playback.src = playbackURL = URL.createObjectURL(new Blob(recorded, {type: 'video/webm'}));
        }
    }
    const source = new MediaSource();
    source.addEventListener('sourceopen', sourceOpen, false);
    const frameRate = settings.frameRate === undefined ? 0 : settings.frameRate;
    const stream = canvas.captureStream(frameRate); 
    canvas.desc.recording = false; 
    canvas.desc.capturing = true;
    const videoTrack = stream.getVideoTracks()[0];
    const mediaRemoved = (owner,name,data) => {
        if(data.media.guid === canvas.guid) {
            API.stop();
            canvas.desc.capturing = false;
            API.canRecord = true;
            API.hasContent = true;
            API.status = "Removed";
            media.removeEvent("onremoved",mediaRemoved)
            source.removeEventListener('sourceopen', sourceOpen);
            canvas = undefined;
            if(playbackURL) { URL.revokeObjectURL(playbackURL)  }
            playback =  undefined;  
            recorded = undefined;
            stream = undefined;
            log("capture stopped");
            try { source.endOfStream() } catch(e) {}
            
        }
    }
    media.addEvent("onremoved",mediaRemoved);
    const API = {
        canRecord : false,
        hasContent : false,
        status : "Need View",
        viewSet(spr) {
            spr.addEvent("ondeleting", () => {
                if(API.status === "Recording") {
                    API.stop();
                }
                API.status = "Need View";
                API.canRecord = false;
                canvas.desc.capturing = false;               
                spr = undefined;
            })
            spr.type.videoCapture = true;
            canvas.desc.recording = false;      
         
            API.status = "Ready";
            API.canRecord = true;
        },
        step(frameTime = 1000/30) {
            if (API.status === "Recording") {
                if(pauseRecordHandle) {
                    clearTimeout(pauseRecordHandle);
                } else {
                    recorder.resume();
                }
                videoTrack.requestFrame();
                pauseRecordHandle = setTimeout(() => {
                    recorder.pause();
                    pauseRecordHandle = undefined;
                }, frameTime < 1000/30 ? 1000/30 : frameTime); // This is an approximate time
				return true;
            } else {
				return false;
			}
            
            
        },
        get canStep() {return frameRate === 0},
        get media() { return canvas },
        record(time) {
            if (API.status === "Ready") {
                recorded = [];
                canvas.desc.dirty = true;
                API.hasContent = false;
                for (const opt of options) {
                    try {
                        recorder = new MediaRecorder(stream, mimeType(opt));
                    } catch (e) { break }
                    recorder.onstop = stop;
                    recorder.ondataavailable = dataAvailable;
                    recorder.start(1000); // 1000ms       
                    if(frameRate === 0) { recorder.pause() }
                    API.status = "Recording";
                    canvas.desc.recording = true;
                    if (time) { setTimeout(() => API.stop(), time) }
					return true;            
                }
                log.error("Could not start media recorder.");
                API.status = "Error";
            }
        },
        stop(){
            if (API.status === "Recording") {
                API.hasContent = true;
                recorder.stop();
                canvas.desc.recording = false;
                recorder.onstop = undefined;
                recorder.ondataavailable = undefined;   
                canvas.onupdated = undefined;                
                API.status = "Ready";
            }
        },
        download(name) {
            if(API.hasContent) {
                const anchor = document.createElement('a');
                const url = anchor.href = URL.createObjectURL(new Blob(recorded, {type: 'video/webm'}));
                anchor.download = name + ".webm";
                anchor.dispatchEvent(new MouseEvent( "click", {view  : window, bubbles: true, cancelable : true} ));  
                setTimeout(() => URL.revokeObjectURL(url) , 1000);   
            }
        }            
    }
    
    return API;
}
