
const StartAudio = (() => {  
	/* Deactivated compressor, convolver, filter and wetGain in this version of Synth.js */
	/* Only has channels InstancedSoundFX and SoundFX */
	var atx, currentVolume = 0, gain;
	async function loadSampleBuffer(atx, url) { return await atx.decodeAudioData(await (await fetch(url)).arrayBuffer()) }
	const envelopeTypes = {
		timeScale(shape) {
			const last = shape[shape.length - 1];
			return (atx, vol, time, stopTime) => {
				const env = atx.createGain();
				const t = stopTime - time;
				shape[0].time !== 0 && env.gain.setValueAtTime(0, time);
				for (const p of shape) { env.gain.linearRampToValueAtTime(vol * p.level, time + t * p.time) }
				last.time !== 1 && env.gain.linearRampToValueAtTime(0,  stopTime);
				return env;
			};
		},
		flat() {        
			return (atx, vol, time, stopTime) => {
				const env = atx.createGain();            
				env.gain.setValueAtTime(0, time);
				env.gain.linearRampToValueAtTime(vol, time + 0.01);
				env.gain.linearRampToValueAtTime(vol,  stopTime -  0.01);
				env.gain.linearRampToValueAtTime(0,  stopTime);
				return env;
			};
		}	
	}
	function createEnvelope(type, shape) {
		if (envelopeTypes[type]) { return envelopeTypes[type](shape) }
	}
	const EnvP = (level, time) => ({level, time});
	const envelopes = [createEnvelope("timeScale", [EnvP(1, 0)]), createEnvelope("flat")];
	const channelTypes = {
		InstancedSoundFX(samples) { // Sounds by id. Sound can be stopped using Play.stop Play.stopAll, or when new sound played with same id.
								 // To keep resource use low limit soundCount
			var canPlay = false, soundCount = 0;		
			const active = []; 
			const ended = idx => () => active[idx] = undefined;
			const play = Object.assign(function (idx, name, time, duration = 0, vol = 1, freqScale = 1, panPos = 0, eIdx = 1, loop = false) {            
				if (canPlay && idx >= 0 && idx < soundCount) {
					active[idx]?.stop();
					active[idx] = undefined;
					const buffer = samples[name];
					const startNow = time === 0;
					time = atx.currentTime + time;
					var stopTime = time + (duration === 0 ? buffer.duration : duration);
					stopTime = Math.min(stopTime, time + buffer.duration * freqScale);
					const sample = atx.createBufferSource();
					const pan = atx.createStereoPanner();
					pan.pan.value = Math.min(1, Math.max(-1, panPos));
					sample.buffer = buffer;
					sample.loop = loop;
					sample.playbackRate.value = 1 / freqScale;
					const env = envelopes[eIdx](atx, vol, time, stopTime - 0.005);
					sample.connect(env).connect(pan).connect(gain);
					sample.addEventListener("ended", ended(idx), {once: true});
					startNow ? sample.start() : sample.start(time);
					sample.stop(stopTime);
					active[idx] = sample;
				}
			},{
				canPlay() { return canPlay },
				stop(idx) { idx >= 0 && idx < soundCount && active[idx]?.stop() },
				stopAll() {
					var i = soundCount;
					while (i-- > 0) {
						active[i]?.stop();
						active[i] = undefined;
					}
				},				
				async init(maxSounds) {
					soundCount = maxSounds;
					active.length = soundCount;
					active.fill(undefined);
					canPlay = true;
					play.init = undefined;
				}
			});
			return play;
		},
		SoundFX(samples) {
			var canPlay = false;		
			const play = Object.assign(function (name, time, duration = 0, vol = 1, freqScale = 1, panPos = 0, eIdx = 1, loop = false) {            
				if (canPlay) {
					const buffer = samples[name];
					const startNow = time === 0;
					time = atx.currentTime + time;
					var stopTime = time + (duration === 0 ? buffer.duration : duration);
					stopTime = Math.min(stopTime, time + buffer.duration * freqScale);
					const sample = atx.createBufferSource();
					const pan = atx.createStereoPanner();
					pan.pan.value = Math.min(1, Math.max(-1, panPos));
					sample.buffer = buffer;
					sample.loop = loop;
					sample.playbackRate.value = 1 / freqScale;
					const env = envelopes[eIdx](atx, vol, time, stopTime - 0.005);
					sample.connect(env).connect(pan).connect(gain);
					startNow ? sample.start() : sample.start(time);
					sample.stop(stopTime);
				}
			},{
				canPlay() { return canPlay },
				async init() {
					canPlay = true;
					play.init = undefined;
				}
			});
			return play;
		},
	}
	const Synth = {
		get context() { return atx },
		get volume() { return currentVolume },
		set volume(val) { gain.gain.value = currentVolume = val },
		loadSounds(type, readyCB, ...sounds) {
			var loadCount = 0;
			const samples = {};
			for (const [name, url] of sounds) {
				loadCount += 1;
				loadSampleBuffer(atx, url).then(buffer => { 
					samples[name] = buffer;
					loadCount -= 1;
					loadCount <= 0 && readyCB && readyCB();
				});
			}			
			return channelTypes[type](samples);
		},
		reset() {},
	};

	function StartAudio() {
		if (atx) { return }
		Synth.atx = atx = new AudioContext();
		gain = atx.createGain();
		gain.connect(atx.destination);
		Synth.reset();
		Synth.volume = 1;
		return Synth;
	}
	return StartAudio;
})();
export {StartAudio}; 
