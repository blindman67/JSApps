const Audio = (() => {
	var dynamicCompressor = settings.dynamicCompressor;
    settingsHandler.onchange = function getSettings(){
		var update = false;
		if (dynamicCompressor !== settings.dynamicCompressor) {
			dynamicCompressor = settings.dynamicCompressor;
			update = true;
		}
		update && setupAudioState();
    }
	var atx, compressor, gain;
	function setupAudioState() {
		if (atx) {
			gain.disconnect();
			compressor.disconnect();
			if (settings.dynamicCompressor) {
				gain.connect(compressor).connect(atx.destination);
			} else {
				gain.connect(atx.destination);
			}
		}
	}
	async function loadSampleBuffer(atx, url) {
		return await atx.decodeAudioData(await (await fetch(url)).arrayBuffer())
	}
	function volBuffer(sprite) {
        const sound = sprite.sound;
        const vol = Math.min(2.0, Math.abs((sprite.h * sprite.sy) / sprite.image.h));
        if (sound.volume !== vol) {
            sound.volume = vol;
            if (sprite.image.desc.playing) {
                sound.gain.gain.value = vol;
            }
        }
    }

    
	function playBuffer(sprite, rate = 1, from = 0,start = 0, end = desc.sBuffer.duration) {
		const sound = sprite.sound;
		const desc = sprite.image.desc;
		const buf = desc.sBuffer;
		sound.sample?.stop?.();
		const sample = sound.sample = atx.createBufferSource();
		const bufferGain = sound.gain = atx.createGain();
		sample.buffer = buf;
		sound.loop = sample.loop = false;
		sound.rate = rate;
		const scaledRate = sample.playbackRate.value = sound.rate * sound.rateScale;
        sound.volume = Math.min(2.0, Math.abs((sprite.h * sprite.sy) / sprite.image.h));
        
        
		bufferGain.gain.value = sound.volume;

		sample.connect(bufferGain).connect(gain);
        desc.renderPosition(sprite);
		if (sound.startOffset < 0) {
			sample.start(sound.startTime = atx.currentTime - sound.startOffset / sound.rateScale, from);
			sound.startTime -= from;
		} else {
			sample.start(sound.startTime = atx.currentTime, (from + sound.startOffset));
			sound.startTime -= (from + sound.startOffset) / scaledRate;
		}
		desc.playing = true;
		desc.status = "Playing";
        

    
		sample.onended = () => {
			sound.gain = undefined;
			sound.sample = undefined;
			desc.playing = false;
			desc.status = "Stopped";
		};
	}
	function drawPCM(can) {
		const h = can.h;
		const w = can.w;
		const data = can.desc.sBuffer.getChannelData(0);
		const time = can.desc.sBuffer.duration;
		const len = data.length;
		const vBuf = can.desc.vBuf = new Array(w);
		var x = 0, xx;
		var i = 0, smin = 0, smax = 0, sMinSum, sMaxSum, c;
		const ctx = can.ctx;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = "#FFF";
		while (i < len) {
			sMinSum = sMaxSum = 0;
			smin = data[i];
			smax = data[i];
			c = 0;
			xx = (i / len) * w | 0;
			x = xx;
			while (x === xx && i < len) {
				const s = data[i++];
				smin = Math.min(smin, s);
				smax = Math.max(smax, s);
				sMinSum += s < 0 ? s : 0;
				sMaxSum += s > 0 ? s : 0;
				c ++;
				xx = (i / len) * w | 0;
			}
			vBuf[x * 2] = Math.max(Math.abs(smin), Math.abs(smax));
			vBuf[x * 2 + 1] = (Math.abs(sMinSum) + Math.abs(sMaxSum)) * 0.5 / c;
			smin = (1 - (smin * 0.5 + 0.5)) * h;
			smax = (1 - (smax * 0.5 + 0.5)) * h;
			ctx.fillRect(x + 0.2, smin  , 0.6, smax - smin);
			smin = (1 - ((sMinSum / c) * 0.5 + 0.5)) * h;
			smax = (1 - ((sMaxSum / c) * 0.5 + 0.5)) * h;
			ctx.fillRect(x, smin  , 1, smax - smin);
		}
	}
	const API = {
		start() {
			if (!atx) {
				atx = new AudioContext();
				if (dynamicCompressor) {
					compressor = atx.createDynamicsCompressor();
					gain = atx.createGain();
					setupAudioState();
				}
			}
		},
		loadSound(url, ready, failed) {
			loadSampleBuffer(atx, url).then(ready).catch(failed);
		},
		async loadSoundFile(file, ready) {
            const data = await atx.decodeAudioData(await file.arrayBuffer());
            ready && ready(data);
		},        
		copyBuffer(buffer) {
			API.start();
			const copy = atx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
			var data, channels = buffer.numberOfChannels, i = 0;
			while (i < channels) { copy.copyToChannel(buffer.getChannelData(i), i++) }
			return buffer;
		},
		draw: drawPCM,
		play: playBuffer,
        vol: volBuffer,
		stop(spr) {
			const sound = spr.sound;
			const desc = spr.image.desc;
			sound.sample?.stop?.();
			sound.sample = undefined;
			sound.gain = undefined;        
			desc.playing = false;
			desc.status = "Stopped";
		},
		getTime() { return atx?.currentTime },
	};
	return API;
})();