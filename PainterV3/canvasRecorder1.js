function canvasRecorder(canvas, frameRate) {
	var encoder = new webm.Encoder(canvas, "PainterV3", stepRecordReady, frameRate);
	function mediaRemoved(owner,name,data) {
        if(data.media.guid === canvas.guid) {

            canvas.desc.capturing = false;
            API.hasContent = false;
            API.status = "Removed";
            media.removeEvent("onremoved", mediaRemoved)
            canvas = undefined;
			encoder = undefined;
        }
    }

	
	var busy = false;
    media.addEvent("onremoved",mediaRemoved);
	var stepCallback, style, duration = 0, size = 0, owner;
	
	function addBackground() {
		canvas.ctx.save();
		canvas.ctx.globalCompositeOperation = "destination-atop";
		canvas.ctx.filter = "none";
		canvas.ctx.globalAlpha = 1;
		canvas.ctx.setTransform(1,0,0,1,0,0);
		canvas.ctx.fillStyle = style;
		canvas.ctx.fillRect(0, 0, canvas.w, canvas.h);
		canvas.ctx.restore();			
		
	}
	
	function stepRecordReady(lenMS, ramUse) {
		if(stepCallback) { 
			const cb = stepCallback;
			stepCallback = undefined;
			duration = lenMS / 1000;
			size = ramUse;
			cb(true);
			if (API.mediaListItem) { mediaList.update(API.mediaListItem) }				
		}
	}
    const API = {
        hasContent : false,
		get canvas() { return canvas },
		get frames() { return encoder ? encoder.frameCount : -1 },
		get size() { return size },
		get duration() { return duration },
		set background(fillStyle) { 
			style = fillStyle;
			if (API.status === "Ready") {
				addBackground();
			}
		},
		set owner(sprite) { 
			if(sprite === undefined) {
				if(API.hasContent) {
					API.status = "Has Content";
				} else {
					API.status = "Empty";
				}
				if(API.mediaListItem) { mediaList.update(API.mediaListItem) }
				owner = undefined;								
			} else {
				owner = sprite;
			}
		},
		get owner() { return owner },
		set busy(value) { busy = value },
		get busy() { return busy },
        status: "Ready",
        step(frameStep = 1, cb) {
			stepCallback = cb;
			if(API.status === "Recording"){
				if (style) { addBackground() }
				encoder.add(canvas, frameStep);
				API.hasContent = true;
				return true;
			}
			stepCallback = undefined;
			if(cb) {setTimeout(cb,0,false)}
			return false;
        },
		pause() {
			if (API.status === "Recording") {
				API.status = "Ready";
				if(API.mediaListItem) { mediaList.update(API.mediaListItem) }
				return true;
			}
			return false;
		},
        record() {
            if (API.status === "Ready") {
                API.status = "Recording";
				if(API.mediaListItem) { mediaList.update(API.mediaListItem) }
				return true;     
            }
			return false; 
        },
        stop(){
            if (API.hasContent) {
				API.download(canvas.desc.name);
				API.hasContent = false;
                API.status = "Completed and saved";
				if (API.mediaListItem) { mediaList.update(API.mediaListItem) }

				return true;
            } else { log.warn("Video recorder has no content.") }
        },
        download(name) {
            if (API.hasContent) {
                const anchor = document.createElement('a');
                const url = anchor.href = URL.createObjectURL(encoder.toBlob());
                anchor.download = name + ".webm";
                anchor.dispatchEvent(new MouseEvent( "click", {view: window, bubbles: true, cancelable: true} ));  
                setTimeout(() => URL.revokeObjectURL(url) , 1000);   
            }
        }            
    }
    
    return API;
}
