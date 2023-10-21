import {} from "./MathExtensions.jsm";
export {Timed, KeyFrames};
function Timed() {
	this.currentTime = 0;
	this.events = [];
	this.currentPos = 0;
	this.startTime = 0;
    this.stopped = false;
    this.timeHandle;
    this.started = false;
    this.gTime = 0;
    this.step = false;
}
function repeat(event) {
	this.currentPos = 0;
	this.startTime += event.time;
}
Timed.prototype = {

	set start(t) { this.gTime = this.startTime = t; this.currentPos = 0; this.started = true; },
	set time(t) {
		this.currentTime = t - this.startTime;
		var currentEvent = this.events[this.currentPos];
		while (currentEvent && this.currentTime >= currentEvent.time) {
			this.currentPos ++;
			currentEvent.call(currentEvent, currentEvent.data);
			this.currentTime = t - this.startTime;
			currentEvent = this.events[this.currentPos];
		}
	},
    next() { this.step = true },
    stop() { this.stopped = true; clearTimeout(this.timeHandle) },
    selfTime(rate) {
        clearTimeout(this.timeHandle);
        if (this.stopped) {
            this.events = undefined;
            return;
        }
        if (!this.started) {
            this.start = 0;
            this.time = 0;
            if (this.stopped) {
                this.events = undefined;
                return;
            }
        }
        this.timeHandle = setTimeout(() => {
            this.next();
            while (this.step) {
                this.step = false;
                this.time = (this.gTime += rate);
                if (this.stopped) {
                    this.events = undefined;
                    return;
                }
            }

            this.selfTime(rate);
        }, rate);
    },
	addEvent(time, call, data) { this.events.push({time, call, data}) },
	addRepeat(time) { this.events.push({time, call: repeat.bind(this)}) }
};




function Key(time, value, curve = "linear") {
	this.time = time;
	this.value = value;
	this.curve = Math[curve]; // curve is incoming from previouse frame
}
Key.prototype = {
	time: 0,
	value: 0,
	curve: Math.linear,
}
function trackSort(kA, kB) { return kA.time - kB.time }
function Track() {
	this.keys = [];
	this.dirty = false;
	this.currentTime = 0;
	this.startTime = 0;
	this.currentPos = 0;
	this.frameTime = 0;
}
Track.prototype = {
	clean() {
		this.dirty = false;
		this.keys.sort(trackSort);
	},
	addKey(key) {
		this.keys.push(key);
		this.dirty = true;
	},
	get value() { return this.currentValue },
	set start(t) { this.startTime = t },
	set ketTime(key) {
		this.currentTime = 0
		this.currentPos = key.currentPos;
		this.frameTime = key.frameTime;
		this.currentValue = 0;

	},
	set time(t) {
		const len = this.keys.length, len1 = len - 1;
		var time = this.currentTime = t - this.startTime;
		if (time <= this.keys[0].time) {
			const tLen = this.keys[len1].time;
			if (this.loop) {
				time = (time % tLen + tLen) % tLen;
			} else {
				this.currentPos = 0;
				this.currentValue = this.keys[0].curve(0) * this.keys[0].value;
				return;
			}
		} else {
			time = this.loop ? (time % this.keys[len1].time) : time;
		}
		var frameTime = 0;  // unit time between keys
		var pos = this.currentPos < len ? this.currentPos : len - 1;
		var posB = pos + 1;
		var findingKeys = true;
		while (findingKeys) {
			findingKeys = false;
			var kB = this.keys[posB];
			var kA = this.keys[pos];
			while (pos < len && kB && kB.time <= time) {
				kA = kB;
				pos += 1;
				posB += 1;
				kB = this.keys[pos];
			}

			if (kB) {
				frameTime = kB.curve((time - kA.time) / (kB.time - kA.time));
			} else {  // past end
				if (this.loop) {
					pos = 0;
					posB = 1;
					findingKeys = true;
				} else {
					frameTime = kA.curve(0);
					kB = kA;
				}
			}
		}
		this.frameTime = frameTime;
		this.currentPos = pos;
		this.currentValue = (bK.value - aK.value) * frameTime + aK.value;
	}
}
function KeyFrames() {
	throw new Error("DO NOT USE! KeyFrames module is incomplete and untested.");
	this.tracks = {};
	this.named = [];
	this.startTime = 0;
	this.currentTime = 0;
	this.keysMatch = false;  // if true than the assumption is that all track have keys at the same time stampes
	                         // This improves performance as only one track needs to search for time. all others can
							 // use its index and avoid the search
}
KeyFrames.prototype = {
	startTime: 0,
	currentTime: 0,
	keysMatch: false,
	addTrack(name) {
		this.tracks[name] = new Track();
		this.named.length = 0;
		this.named.push(Object.keys(this.tracks));
	},
	getTrack(name) { return this.tracks[name] },
	set start(t) {
		for (const t of this.tracks) { t.start = t };
		this.startTime = t;
	},
	set time(t) {
		t = t - this.startTime;
		if (this.currentTime !== t) {
			if (this.keysMatch) {
			}
		}
	}

};

