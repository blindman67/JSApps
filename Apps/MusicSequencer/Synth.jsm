import {NOTE_NAME, NOTE_FREQ, NOTE_IDX, createKey, NamedScales, chords, guitar, nameConvert, createNoteArray} from "./music.jsm";
import {getInstrument} from "./ripSounds.jsm";
import {fileExists, getDirectory} from "./FileIO.jsm";
import {Events} from "./Events.jsm";

const NOTE_ARRAY_ALL = createNoteArray().map(()=>true);
const F32 = data => new Float32Array(data);
const Fz64 = data => new Array(data).fill(0);
const F64 = data => new Array(data);
const randSign = () => Math.random() < 0.5 ? 1 : -1;
const spect = (vol = 1, freqScale = 1, power = 1, phase = 0, dc = 0, shape = Waves.sin) => ({vol, freqScale, power, phase, dc, shape});
const TAU = Math.PI * 2;
const createSin = () => {
    var i = 0;
    const v = [];
    while (i < 48000) {
        v.push(Math.sin((i++ / 48000) * TAU));
    }
    return v;
}
const sinTable = createSin();
function easeBell(v, p = 2){
    if (v <= 0 || v >= 1) { return 0 }
    const vv = (v = v > 0.5 ? 2 - v * 2 : v * 2) ** p;
    return vv / (vv + ((1 - v) ** p));
}
const chaser = {  // filter by Blindman67
    isOscillator(a, b){ // returns true if cofs a, b defines an oscillating filter
        const bb = a * b - b - 1;
        return b > (bb * bb) / 4;
    },
    getPeriod(a, b){ // get period for values a,b. Note may return NaN if filter is not an oscillator
        return  (Math.PI * 2) / Math.atan(-2 * (Math.sqrt(b - (bb * bb) / 4) / bb));
    },
    getBForPeriod(a, p){ // get second cof b for given period p and cof a
                         // a is acceleration value. p is period
                         // Returns two values use first
                         // Use isOccilator to see if returned values are valid
        var v = (Math.tan(Math.PI * 2 / p) / -2);
        v *= v;
        const aa = a * a;
        const Av = v * (1 - 2 * a + aa) + (aa / 4 - 0.5 * a + 0.25);
        const Bv = v * (2 - 2 * a) - (0.5 + 0.5 * a);
        const Cv = v + 0.25;
        const s = Math.sqrt(Bv * Bv - 4 * Av * Cv);
        return [(-Bv - s) / (Av * 2), (-Bv + s) / (Av * 2)];
    },
}
const Sounds = {
    //busy: false,
    draw(buffer) {
        var i = 0;
        const len = buffer.length;
        const w = canvas.width, h = canvas.height, h2 = h / 2;
        canvas.ctx.clearRect(0, 0, w, h);
        canvas.ctx.beginPath();
        while (i < len) {
            canvas.ctx.lineTo((i / len) * w, (buffer[i] / buffer.max) * h2 + h2);
            i++
        }
        canvas.ctx.stroke();
    },
    time: 0,
    get buffer() { return Sounds.buf = Fz64(Sounds.samples(Sounds.time)) },
    fill(buffer, call) {
        var i = 0, max = 0;
        while (i < buffer.length) {
            Sounds.idx = i;
            const v = buffer[i] = call(i);
            max = Math.max(max, Math.abs(v));
            i++;
        }
        buffer.max = max;
        return buffer;
    },
    rate: 48000,
    rootFreq: 440,
    buf: [],
    idx: 0,
    samples: time => Sounds.rate * time | 0,
    nTime: (sample, freq) => (1 / Sounds.rate) * freq,
    eTime: (sample) => sample / (Sounds.rate * Sounds.time),
    w2u: (v) => (v + 1) / 2,
    sin: () =>  { var p = 0;    return (nTime, phase = 0) => Math.sin((((p += nTime) + phase) - nTime) * TAU); },
    sinT:() =>  { var p = 0;    return (nTime, phase = 0) => sinTable[((((p += nTime) + phase) - nTime) * Sounds.rate | 0) % Sounds.rate]; },
    sqr: () =>  { var p = 0;    return (nTime, phase = 0) => (((p += nTime) + phase) - nTime) % 1 < 0.5 ? -1 : 1; },
    tri: () =>  { var p = 0.25; return (nTime, phase = 0, v = (((p += nTime) + phase) - nTime) % 1) => (v < 0.5 ? v * 2 : 2 - v * 2) * 2 - 1; },
    saw: () =>  { var p = 0.5;  return (nTime, phase = 0, v = (((p += nTime) + phase) - nTime) % 1) => v * 2 - 1; },
    pulse: () => { var p = 0;    return (nTime, width, phase = 0) => (((p += nTime) + phase) - nTime) % 1 < width ? -1 : 1; },
    spectrum: () => {
        const pos = [];
        var fCount, max;
        return (nTime, range, ...levs) => {
            var i;
            if (pos.length === 0) {
                fCount = levs.length;
                max = 0;
                i = 0;
                console.log("T:" + (Sounds.rate * nTime) + " :" + (Sounds.rate * (nTime * (1 - range * 0.5))) + " : " + (Sounds.rate * (nTime * (1 + range * 0.5))));
                while (i < fCount) { 
                    max += levs[i] * levs[i];
                    pos[i++] = i / fCount; 
                }
                max = 1 / max;
                
            }
            const rStep = range / (fCount - 1);
            var r = 1 - range * 0.5;
            i = 0;
            var v = 0;
            while (i < fCount) { 
                const tS = nTime * r;
                const amp = levs[i];
                v += Math.sin(((pos[i] += tS) - tS) * TAU) * amp * amp;
                r += rStep;
                i++;
            }
            return v * max;
        }
    },
    noise: () => () => Math.random() * 2 - 1,
    pulseGate: () => { var p = 0; return (nTime, width, phase = 0) => (((p += nTime) + phase) - nTime) % 1 < width ? -1 : 1},
    noisePulse: () => { var p = 0; return  (nTime, width, phase = 0) => (((p += nTime) + phase) - nTime) % 1 < width ? Math.random() * 2 - 1 : - 1},
    noisePulseGate: () => { var p = 0; return (nTime, width, phase = 0) => (((p += nTime) + phase) - nTime) % 1 < width ? (Math.random() < 0.5 ? -1 : 1) : - 1},
    envelope: (a, h, r, s, sv, z) => (eTime) => {
        if (eTime <= a) { return eTime / a }
        if (eTime <= h) { return 1 }
        if (eTime < r) { return 1 - ((eTime - h) / (r - h)) * (1 - sv) }
        if (eTime <= s) { return sv }
        if (eTime < z) { return (1 - (eTime - s) / (z - s)) * sv  }
        return 0;
    },
    AHRSR: (a = 5, h = 10, r = 20, s = 50, sv = 50, z = 100) => {
        a /= 100;
        h /= 100;
        r /= 100;
        s /= 100;
        sv /= 100;
        z /= 100;
        return (eTime) => {

            if (eTime <= a) { return eTime / a }
            if (eTime <= h) { return 1 }
            if (eTime < r) { return 1 - ((eTime - h) / (r - h)) * (1 - sv) }
            if (eTime <= s) { return sv }
            if (eTime < z) { return (1 - (eTime - s) / (z - s)) * sv  }
            return 0;
        };
    },
    range: (a, b) => (eTime) => eTime * (b-a) + a,
    decay: (pow) => (eTime) => (1 - eTime) ** pow,
    rampOnOff: (onWidth, offWidth) => (eTime) => {
        onWidth = Math.min(1, Math.max(0, onWidth));
        offWidth = Math.min(1, Math.max(0, offWidth));
        if (onWidth > offWidth) {
            onWidth = offWidth = (onWidth + offWidth) / 2;
        }
        return eTime < onWidth ? eTime / onWidth : (
            eTime > 1 - offWidth ?
                1 - (eTime - (1 - offWidth)) / offWidth :
                1
            )
    },
    mix: () => (a, b, e) => e * a + (1- e) * b,
    add: () => (a, b)    => a + b,
    sub: () => (a, b)    => a - b,
    mult:() => (a, b)    => a * b,
    min: () => (a, b)    => Math.min(a, b),
    max: () => (a, b)    => Math.max(a, b),
    abs: () => a         => Math.max(a),
    neg: () => a         => -a,
    pow: () => (v, pow)  => Math.abs(v) ** pow * Math.sign(v),
    sign: () => (a, b)   => a * Math.sign(b),
    rangeVal: () => (v, a, b) => ((v + 1) * 0.5) * (b - a) + a,
    amp: () => (v, level) => v * level,
    invert: v => -v,
    delay: (time) => {
        const samples = Sounds.rate * time | 0;
        const buf = new Array(samples).fill(0);
        var pos = 0;
        return (v) => {
            buf[pos % samples] = v;
            pos ++;
            return buf[pos % samples];
        }
    },
    /*bufDelay: (time) => {
        const samples = Sounds.rate * time | 0;
        return (v) => {
            const pos = Sounds.idx - samples;
            if (pos < 0) { return 0 }
            return Sounds.buf[pos];
        }
    },
    bufDelayPitch: (time, pitchShift) => {
        const samples = Sounds.rate * time | 0;
        var sPos = -samples;
        return (v) => {
            const pos = Sounds.idx - sPos;
            sPos += 0 + (1 - pitchShift)
            if (pos < 0) { return 0 }
            return Sounds.cubicCatmullRom(Sounds.buf, pos / Sounds.buf.length);
        }
    },    
    cubicCatmullRom(data, pos) {
        const l = data.length - 1;
        const x = pos * data.length % 1;
        const idx = pos * data.length | 0;
        if (x === 0.0) { return data[idx] }
        const v0 = data[Math.max(0, idx - 1)];
        const v1 = data[            idx     ];
        const v2 = data[Math.min(l, idx + 1)];
        const v3 = data[Math.min(l, idx + 2)];
        const xx = x * x;
        const a0 = -0.5 * v0 + 1.5 * v1 - 1.5 * v2 + 0.5 * v3;
        const a1 =        v0 - 2.5 * v1 + 2   * v2 - 0.5 * v3;
        const a2 = -0.5 * v0 +            0.5 * v2;
        return a0 * x * xx + a1 * xx + a2 * x + v1;
    },  */ 
    runMean: (time) => {
        const samples = Sounds.rate * time | 0;
        const buf = new Array(samples).fill(0);
        var pos = 0;
        return (v) => {
            buf[(pos++) % samples] = v;
            var i = samples, mean = 0;
            while (i--) { mean += buf[i] }
            return mean / samples;
        }
    },
    chase: (a, freq) => {
        var r = 0, rc = 0;
        const b = chaser.getBForPeriod(a, Sounds.rate / freq)[0];
        return (v) => {
            rc += (v - r) * a;

            return r += (rc *= b);
        }
    },
    chaseOpen: (a, b) => {
        var r = 0, rc = 0;
        return (v) => {
            rc += (v - r) * a;
            return r += (rc *= b);
        }
    },
    lowPassBuffer(buf, cutoff, rate) {
        var rc = 1.0 / (cutoff * 2 * Math.PI);
        var dt = 1.0 / rate;
        var alpha = dt / (rc + dt);
        var i = 0;
        var v = buf[i++];
        while (i < buf.length) {
            v = buf[i] = v + (alpha * (buf[i] - v));
            i++;
        }
    },    
    loPass: () => {
        var out = 0;
        const rc =  -(1 / Sounds.rate)  * 2 * Math.PI; 
        return (freq, v) => {
            const ePow = 1- Math.exp(rc * freq);
            out += (v - out) * ePow;
            return out;
        }
    },
    hiPass: () => {
        var out = 0, pv = 0;
        const rc = (1 / Sounds.rate) * Math.PI;
        return (freq, v) => {
            const f = rc * freq;
            out = (1 / (f + 1)) * (v - pv - out * (f - 1));
            pv = v;
            return out;
        }
    },
    cut: () => (level, v) => Math.abs(v) > level ? level * Math.sign(v) : v,
    pullDown: () => (level, frac, v) => {
        if (level <= 0) { return 0 }
        if (frac <= 0) { return Math.abs(v) < level ? level * Math.sign(v) : v }
        const levelLead = level * frac;
        const levelStart = level - levelLead;
        var va = Math.abs(v);
        return va > levelStart ?
            (((va - levelStart) / (1 - levelStart)) ** 2 ** levelLead * levelLead + levelStart) * Math.sign(v) :
            v;
    },
    /*lowPassBW: (freq) => { //2nd order Butterworth low pass filter
        const dt = 1 / Sounds.rate, dt2 = dt * dt;
        const tau = freq * TAU, tau4 = tau * tau * 4;
        const t = Math.SQRT2 * 2 * tau * dt;

        const cy = [-2 * (dt2 - tau4) / (dt2 + t + tau4), (-dt2 + t - tau4) / (dt2 + t + tau4)];
        const cx = [dt2 / (dt2 + t + tau4), 2 * dt2 / (dt2 + t + tau4), dt2 / (dt2 + t + tau4)];
        var px = 0, py = 0;
        const bx = [0,0,0], by = [0,0];
        return v => {
            px = (px + 1) % 3;
            py = (py + 1) % 2;
            bx[px] = v;
            var o = by[py] * cy[0] + by[(py + 1) % 2] * cy[1];
            o += bx[px] * cx[0] + bx[(px + 1) % 3] * cx[1] + bx[(px + 2) % 3] * cx[2];
            return by[py] = o;
        }
	},*/
    createSample(atx, buf, freq) {
        const buffer = atx.createBuffer(1, buf.length, atx.sampleRate);
        buffer._baseFreq = freq;
        const data = buffer.getChannelData(0);
        var i = 0;
        while (i < buf.length) { data[i] = buf[i]; i++ }
        return buffer;
    },
    normScale: 0, // for debugging
    normalizeBuffer(buf, peak = 0.7) {
        var i = 0;
        var max = 0;
        while (i < buf.length) {
            max = Math.max(Math.abs(buf[i++]), max);
        }
        i = 0;
        Sounds.normScale = max = (1 / max) * peak;
        while (i < buf.length) {
            buf[i] *= max;
            i++
        }
        return buf;
    },
    normalizeBuffers(bufL, bufR, peak = 0.9) {
        var i = 0;
        var max = 0;
        while (i < bufL.length) { max = Math.max(Math.abs(bufL[i++]), max); }
        var i = 0;
        while (i < bufR.length) { max = Math.max(Math.abs(bufR[i++]), max); }
        Sounds.normScale = max = (1 / max) * peak;
        i = 0;
        while (i < bufL.length) {
            bufL[i] *= max;
            i++
        }
        i = 0;
        while (i < bufR.length) {
            bufR[i] *= max;
            i++
        }       
        
    },    
    findBufferTrim(buf) {
        const min = 2.3283064370807974e-10;
        var start = 0;
        var end = buf.length - 1;
        while(start < end) {
            if (Math.abs(buf[start]) >= min) {
                break;
            }
            start++;
        }
        while(end > start) {
            if (Math.abs(buf[end]) >= min) {
                break;
            }
            end--;
            
        }
        return {start, end};
        
    },
    loopDeClick2(buf) {
        //const mean
        const dist = 256;
        const d2 = dist * 2;
        const len = buf.length;
        const l = len - dist;
        const s = buf[l];
        const e = buf[dist];
        const r = e - s;
        var i = 0;
        while (i < d2) {
            var u = i > dist ? 1 - (i - dist) / dist : i / dist;
            var uu = i / d2;
            const v = buf[(l + i) % len];
            buf[(l + i) % len] = u * (uu * r + s) + (1-u) * v;
            i++;
        }
        return buf;

    },
    loopDeClick(buf) {
        //const mean
        const dist = 256;
        const len = buf.length;
        const l = len - dist;
        var min = 1e9, minPos;
        var i = l;
        while (i < len) {
            if (Math.abs(buf[i]) <= min) {
                min = Math.abs(buf[i]);
                minPos = i;
            }
            i++;
        }
        if (min < 0.01) {
            buf.length = minPos;
        } else {
            Sounds.loopDeClick2(buf);
        }
        return buf;
    }
};
function getNumbers(cmds) {
    var c = cmds.pop();
    const vals = [];
    while(c[0] !== ">" && c[c.length -1] !== ">") {
        if (isNaN(c)) {
            vals.push(NOTE_NAME.get(c).freq);
        } else {
            vals.push(Number(c));
        }
        c = cmds.pop();
    }
    cmds.push(c);
    return vals;
}
function getValues(cmds) {
    var c = cmds.pop();
    const vals = [];
    while(c[0] !== ">") {
        if (c[c.length -1] === ">") {
            vals.push({bus: c.slice(0, -1)})
        } else {
            if (isNaN(c)) {
                vals.push({num: NOTE_NAME.get(c).freq});
            } else {
                vals.push({num: Number(c)});
            }
        }
        c = cmds.pop();
    }
    cmds.push(c);
    return vals;
}
function getOutBus(parent, cmds) {
    const b = cmds.pop();
    if (b === ">") { return parent.name }
    return b.slice(1);
}
function getArgs(vals, args, res = []) {
    var i = 0;
    for (const a of args) {
        if (a.bus) { res[i++] = vals[a.bus] }
        else { res[i++] = a.num }
    }
    return res;
}
const CommandTokens = {
    instrument: {
        match(s) { return s === "instrument" },
        create(parent, s, cmds) {
            const cmd = {
                instrument: true,
                name: cmds.pop(),
                synthEnvIdx: 0,
                icon: 0,
                loop: false,
				drums: false,
                cmds: [],
                notes: [],
                bus: [],
                parent,
                async exe(S, onDone) {
                    var created = false;
                    const samples = { hasNotes: this.all ? NOTE_ARRAY_ALL : createNoteArray() };
                    const createNote = async (cmd, vals, note) => {
                        !doAll && (samples.hasNotes[note.idx] = true);
                        const buf = await cmd.exe(Sounds, undefined, vals);
                        buf._baseFreq = note.freq;
                        buf._loop = buf._loop ?? cmd.loop ?? this.loop;
                        samples[note.name] = buf;
                        created = true;
                    }
					const createSampleRefs = () => {
						var i = 0;
						const sampleLocs = Object.entries(samples);
						const findNearest = note => {
							const f = note.freq;
							var dist = Infinity, nearestSample;
							for (const [name, sample] of sampleLocs) {
								const d = Math.abs(sample._baseFreq - f);
								if (d < dist) {
									dist = d;
									nearestSample = sample;
								}
							}
							samples[note.name] = nearestSample;
						}
									
						while (i < NOTE_IDX.length) {
							const n = NOTE_IDX[i];
							if (!samples[n.name]) {
								findNearest(n);
							}
							i++;
						}
						
					}
                    for (const [name, bus] of Object.entries(this.bus)) {
                        if (bus.exe) { bus.val = bus.exe(S) }
                    }
                    var noteIdx = 0, doAll = this.all;
                    const nextNote = async () => {
                        const note = this.notes[noteIdx];
                        const vals = {};
                        for (const [name, bus] of Object.entries(this.bus)) {
                            if (bus.notes) { vals[name] = bus.val() }
                        }
                        created = false;
                        for (const cmd of this.cmds) {
                            cmd.wave && cmd.name === note.name && (await createNote(cmd, vals, note));
                        }
                        if (!created) {
                            for (const cmd of this.cmds) { cmd.wave && cmd.name === this.name && (await createNote(cmd, vals, note)) }
                        }
                        noteIdx ++;
                        if (noteIdx < this.notes.length) {
                            setTimeout(() => { nextNote() }, 25);
                            Synth.infoElement.textContent = "Note " + noteIdx + " of " + this.notes.length;
                        } else {
                            Synth.infoElement.textContent  = "Notes created!";
							doAll && createSampleRefs();
                            onDone && onDone(samples);
                        }
                        Synth.instrumentUpdate(this.name);
                    }
                    await nextNote();
                    return samples;
                }
            };
            parent.cmds.push(cmd);
            return cmd;
        }
    },
    notes: {
        match(s) { return s === "notes" },
        create(parent, s, cmds) {
            const noteIdxs = [], notes = parent.notes;
            var listing = true;
            var open = false;
            while (listing) {
                let cmd = cmds.pop();
                if (cmd.includes("-") && cmd.length > 1) {
                    if (cmd.startsWith("-")) {
                        cmds.push(cmd.slice(1));
                        cmd = "-";
                    } else if (cmd.endsWith("-")) {
                        cmds.push("-");
                        cmd = cmd.slice(0,-1);
                    } else {
                        const spl = cmd.split("-");
                        cmd = spl[0];
                        cmds.push(spl[1]);
                        cmds.push("-");
                    }
                }
                if (!open) {
                    if (cmd[0] === "[") {
                        open = true;
                        if (cmd.length > 1) { cmd = cmd.slice(1) }
                    }
                }
                if (open) {
                    if (cmd.endsWith("]")) {
                        listing = false;
                        if (cmd.length > 1) { cmd = cmd.slice(0,-1) }
                    }
                }
                if (open && cmd !== "]" && cmd !== "[") {
                    if (cmd === "-") { noteIdxs.push(-1) }
                    else {
                        const note = NOTE_NAME.get(cmd);
                        if (note) { noteIdxs.push(note.idx) }
                    }
                }
            }
            var i = 0, ns, ne;
            while (i < noteIdxs.length) {
                const noteIdx = noteIdxs[i];
                if (noteIdx === -1) {
                    ns = Math.min(noteIdxs[i - 1], noteIdxs[i + 1]);
                    ne = Math.max(noteIdxs[i - 1], noteIdxs[i + 1]);
                    notes.pop();
                    while (ns <= ne) { notes.push(NOTE_IDX[ns++]) }
                    i++;
                } else { notes.push(NOTE_IDX[noteIdx]) }
                i++;
            }
            parent.notes = notes;
            parent.bus[cmds.pop().slice(1)] = {
                notes: true,
                exe(){
                    var idx = 0
                    return () => notes[idx++].freq;
                }
            };
            return parent;
        }
    },
    wave: {
        match(s) { return s === "wave" },
        create(parent, s, cmds) {
            const cmd = {
                wave: true,
                name: cmds.pop(),
                synthEnvIdx: 0,
                loop: false,
                icon: 0,
                cmds: [],
                bus: {},
                parent,
                async exe(S, onDone, busVals = {}) {
                    var complete = false;
                    var buffer;
                    if (this.samples !== undefined) {
                        this.dur = this.samples / Sounds.rate;
                    }
                    S.time = this.dur;
                    S.rootFreq = this.freq;
                    const buf = S.buffer;
                    S.idx = 0;
                    for (const [name, bus] of Object.entries(this.bus)) {
                        if (bus.exe) { bus.val = bus.exe(S) }
                        else if (bus.load) {
                            complete = true;
                            buffer = await bus.load(atx);
                        }
                    }
                    if (!complete) {
                        const vals = {...busVals};
                        S.fill(buf, (i) => {
                            Object.assign(vals, busVals);
                            const e = S.eTime(i);
                            for (const [name, bus] of Object.entries(this.bus)) {
                                if (bus.samp) { vals[name] = bus.val(S, vals, i) }
                                else if (bus.sig) { vals[name] = bus.val(S, vals) }
                                else if (bus.env) { vals[name] = bus.val(e) }
                                else if (bus.proc) { vals[name] = bus.val(vals) }
                            };
                            return vals[this.name];
                        });
                        S.buf = [];
                        //if (this.loop) { S.loopDeClick(buf) }
                        //S.normalizeBuffer(buf);
                        buffer = S.createSample(atx, buf, this.freq);
                    }
                    buffer._envIdx = this.synthEnvIdx;
					buffer._loop = buffer._loop ?? this.loop;
                    onDone && onDone(buffer);
                    return buffer;
                }
            };
            parent.cmds.push(cmd);
            return cmd;
        }
    },
    occilator: {
        match(s) { return ["sin","sinT","tri","saw","sqr","pulse","noise", "pulseGate", "noisePulse", "noisePulseGate", "spectrum"].includes(s) },
        create(parent, func, cmds) {
            const args = getValues(cmds), fFunc = Sounds[func](), argArray = [];
            parent.bus[getOutBus(parent, cmds)] = { 
                sig: true, 
                val(S, vals) { 
                    return fFunc(...getArgs(vals, args, argArray)) 
                }
            };
            return parent;
        }
    },    
    gain: {
        match(s) { return ["add", "sub", "mult", "amp", "min", "max", "abs", "neg", "sign", "pow", "rangeVal", "pow"].includes(s) },
        create(parent, funcName, cmds) {
            const args = getValues(cmds), func = Sounds[funcName]();
            parent.bus[getOutBus(parent, cmds)] = { 
                proc: true, 
                exe(S) { 
                    return (vals) => func(...getArgs(vals, args));
                } 
            };
            return parent;
        }
    },    
    "{": {
        match(s) { return s === "{" },
        create(parent, s, cmds) { return parent }
    },
    "}": {
        match(s) { return s === "}" },
        create(parent, s, cmds) { return parent.parent }
    },
    dur: {
        match(s) { return s === "dur" },
        create(parent, s, cmds) { parent.dur = Number(cmds.pop()); return parent }
    },
    samples: {
        match(s) { return s === "samples" },
        create(parent, s, cmds) { parent.samples = Number(cmds.pop()); return parent }
    },    
    all: {
        match(s) { return s === "playAll" },
        create(parent, s, cmds) { parent.all = true; return parent }
    },	
    iconIdx: {
        match(s) { return s === "icon" },
        create(parent, s, cmds) { parent.icon = Number(cmds.pop()) | 0; return parent }
    },
    drums: {
        match(s) { return s === "drums" },
        create(parent, s, cmds) { parent.drums = true; return parent }
    },
    env: {
        match(s) { return s === "env" },
        create(parent, s, cmds) { parent.synthEnvIdx = Number(cmds.pop()) | 0; return parent }
    },
    load: {
        match(s) { return s === "load" },
        create(parent, s, cmds) {
			var cmd = cmds.pop(), filename, loopStart, loopEnd, isLooping = false, hold = false, cleanOnLoad = false;;
            if (cmd.toLowerCase() === "clean") {
                cleanOnLoad = true;
                cmd = cmds.pop();
            }
			if (isNaN(cmd)) {
                if (cmd.toLowerCase() === "hold") {
                    hold = true;
                    filename = cmds.pop();
                } else {
                    filename = cmd;
                }
			} else {
				loopStart = Number(cmd);
				loopEnd = Number(cmds.pop());
				filename = cmds.pop();
				isLooping = true;
			}
            cmds.push(">");
            parent.bus[getOutBus(parent, cmds)] = {
                load: true,
                async load(atx) {
                    var buffer = await atx.decodeAudioData(await (await fetch(filename)).arrayBuffer());
                    if (cleanOnLoad) {
                        const rate = buffer.sampleRate;
                        const sterio = buffer.numberOfChannels > 1;
                        console.log("'" + filename + "' Sterio: " + sterio + " Rate: " + rate + " duration: "  + buffer.duration.toFixed(2) );
                        var bufL = buffer.getChannelData(0);
                        var bufR = sterio ? buffer.getChannelData(1) : undefined;
                        const lTrim = Sounds.findBufferTrim(bufL);
                        const rTrim = sterio ? Sounds.findBufferTrim(bufR) : lTrim;
                        if (sterio) {
                            Sounds.normalizeBuffers(bufL, bufR, 1);
                        } else {
                            Sounds.normalizeBuffer(bufL, 1);
                        }
                        lTrim.start = Math.min(lTrim.start, rTrim.start);
                        lTrim.end = Math.min(lTrim.end, rTrim.end);
                        const samples = lTrim.end - lTrim.start;
                        
                        
                        if (buffer.numberOfChannels === 1) {
                            const buf = atx.createBuffer(1, samples, rate);
                            const smps = new Float32Array(samples);
                            let i = 0;
                            while (i < samples) {
                                smps[i] = bufL[lTrim.start + i];
                                i++;
                            }
                            buf.copyToChannel(smps, 0);
                            buffer = buf;
                        } else {
                            const buf = atx.createBuffer(2, samples, rate);
                            const smps = new Float32Array(samples);
                            let i = 0;
                            while (i < samples) {
                                smps[i] = bufL[lTrim.start + i];
                                i++;
                            }
                            buf.copyToChannel(smps, 0);
                            i = 0;
                            while (i < samples) {
                                smps[i] = bufR[lTrim.start + i];
                                i++;
                            }  
                            buf.copyToChannel(smps, 1);    
                            buffer = buf;
                        }
                        console.log("Cleaned duration: "  + buffer.duration.toFixed(2) + " Norm scale: " + Sounds.normScale );
                        
                    }
                    
                    buffer._baseFreq = parent.freq;
                    buffer._hold = hold;
                    const fName = filename.split("/").pop().split(".");
                    fName.pop();
                    buffer._filename = fName.join(".");
                    buffer._url = filename;
					if (isLooping) {
						buffer._loopStart = loopStart;
						buffer._loopEnd = loopEnd;
						buffer._loop = true;
					}
                    return buffer;

                },
            };
            return parent;
        }
    },
    loop: {
        match(s) { return s === "loop" },
        create(parent, s, cmds) { parent.loop = true; return parent }
    },
    freq: {
        match(s) { return ["freq"].includes(s) },
        create(parent, s, cmds) {
            const args = getValues(cmds), argArray = [];
            if (parent.freq === undefined) { parent.freq = args[0].num }
           // if (args.length === 2) 
            parent.bus[cmds.pop().slice(1)] = { samp: true, val(S, vals, n) { return S.nTime(n, ...getArgs(vals, args, argArray)) } };
            return parent;
        }
    },
    envelope: {
        match(s) { return ["decay", "AHRSR", "range", "rampOnOff"].includes(s) },
        create(parent, func, cmds) {
            const args = getValues(cmds), fFunc = Sounds[func];
            parent.bus[getOutBus(parent, cmds)] = { env: true, exe(S) { return fFunc(...getArgs({}, args)) } };
            return parent;
        }
    },
    mixers: {
        match(s) { return ["mix"].includes(s) },
        create(parent, funcName, cmds) {
            const inA = cmds.pop().slice(0, -1);
            const inB = cmds.pop().slice(0, -1);
            const args = getValues(cmds);
            const func = Sounds[funcName]();
            parent.bus[getOutBus(parent, cmds)] = { proc: true, exe(S) { return (vals) => func(vals[inA], vals[inB], ...getArgs(vals, args)) } };
            return parent;
        }
    },
    filters: {
        match(s) { return ["runMean", "delay", /*"bufDelay",*/ "chase", "chaseOpen"].includes(s) },
        create(parent, funcName, cmds) {
            const init = getNumbers(cmds);
            const inBus = cmds.pop().slice(0, -1);
            const func = Sounds[funcName](...init);
            parent.bus[getOutBus(parent, cmds)] = { proc: true, exe(S) { return (vals) => func(vals[inBus]) } };
            return parent;
        }
    },
    dinFilters: {
        match(s) { return ["loPass", "hiPass", "cut", "pullDown"].includes(s) },
        create(parent, funcName, cmds) {
            const args = getValues(cmds);
            const func = Sounds[funcName]();
            parent.bus[getOutBus(parent, cmds)] = { proc: true, exe(S) { return (vals) => func(...getArgs(vals, args)) } };
            return parent;
        }
    },
}


const instrumentDisplayStylesByName = new Map();
const CommandArray = Object.values(CommandTokens);
function buildWave(str, bufs = {}) {
    const lines = str
        .replace(/;|\r\n/g, "\n")
        .split("\n")  
        .map(l => l.replace(/https:\/\//g,"https:####").replace(/\/\/.*/g,"").replace(/https:####/g, "https://").trim())
        .filter(l => l !== "");
    const tokens  = [];
    const sounds = {cmds: []};
    var cmd = sounds;
    for (const line of lines) { tokens.push(...line.split(" ").filter(s=> s !== "")) }
    tokens.reverse();
    while(tokens.length) {
        const t = tokens.pop();
        const cm = CommandArray.find(com => com.match(t));
        if (cm) {
            cmd = cm.create(cmd, t, tokens);
        } else {
            console.warn("Wave builder unknown token: '" + t + "'");
        }
    }
    const S = Sounds;
    for (const c of cmd.cmds) { bufs[c.name] = c }
    return bufs;
}
const buildQueue = [];
buildQueue.current;
buildQueue.next = () => {
    if (!buildQueue.current && buildQueue.length) {
        const next = buildQueue.shift();
        buildQueue.current = next;
        next.exe(Sounds, (res) => {
            next.done(res);
            buildQueue.current = undefined;
            buildQueue.next();
        });
    }
}
function enqueueBuild(commandTokenExe, onDone) {
    buildQueue.push({exe: commandTokenExe, done: onDone});
    buildQueue.next();
}
{
var SoundDef = `
/* =======================================================================================================
// commands
// -------------------------------------------------------------------------------------------------------
// Instrument
// defined a set of notes for an instrument
//
// instrument name { }
//
// Example
// Creates notes from C3 to C5 with special not at A6
// instrument SoftSound {    // Define an instrument named SoftSound
//    notes [C3 - C5 A6] >f  // frequencies output to frequency bus f
//                           // All waves in this instrument get bus f
//    wave name {    // All notes unless intrument contains a wave named for defined note
//       dur 1       // sample is 1 second long
//       env 3       // use synth envolope 3
//       loop        // sample can loop
//       freq f> >a  // get note fequency
//       sin a> >    // output sin wave to main bus
//    }
//    wave A6 {        // special note A6
//       dur 2         // sample is 2 second long
//       freq 440 >a   // set frequency
//       sin a> >b     // sin wave to bus b
//       decay 2 >c    // quadratic decay to bus c
//       amp b> c> >   // Amplify bus b by bus c and send to main bus
//    }
// }
//
// -------------------------------------------------------------------------------------------------------
// Wave defines a sound (a single note)
//
// wave [name | noteName] {  }
// name of sound
// noteName if wave is part of an instrument then noteName defines the note. eg A4

// -------------------------------------------------------------------------------------------------------
// Misalainouse
//
// notes [list of notes] out
//     list must start with [ and end with ]
//     List contains named notes Eg As4 is A shape 4th octive
//     Notes must be seperated by space or -
//     A sequence of notes can be defined with - Eg C4 - C5 all note from C4 to and including C5
// playAll When included with an instrument all notes can be played. If there is no sample an existing note is speed up or down
//         to match the request note.
// dur length: length of wave in seconds. Eg dur 1 wave is 1 second long
// samples count: if provided overrides dur, setting the duration to match count samples
// env idx: Index of default synth envolope used when assigning sound to a track
// loop: If included sound is looped when played
// freq [frequence | noteName | in] [phaseShift | in] freqOut:
// load ["clean"] |             // when loaded clean note. Trims silence, normalize volume
//      ["hold"] |             // play all of note
//      [loopStart loopend] |  // loopEnd in second. loopEnd must be greater than loopStart
//      [name | datURL] |                     // filename or data url
// icon idx:  // index of channel select icon
//
//
// The first defined frequency is used to set the note base frequency. Note frequency is shifted to make base frequence match note frequency. All other frequencies will be shifted the same amount 
// The default note is 440 (A4)
// thus setting freq 440 >a; freq 880 >b will play at A4 the highest freq 880
// else setting freq 220 >a; freq 880 >b sets the base freq to 220 (A3) To play A4 the base 220 is shifted up by 2 and will also convert the 880 to 1760
// else setting freq 880 >a; freq 220 >b sets the base freq to 880 (A5) To play A4 the base 880 is shifted down by 2 whichg also converts the 220 to 110
//
// -------------------------------------------------------------------------------------------------------
// Buses
//
//  Buses are used to relay signals. Out from a bus is busName followed by >, Into a bus is > followed by busName
//  busNames is case sensitive alphaNumeric name with no spaces.
//  Eg create an occilator that gets frequency from bus A and output signal to bus B. sin A> >B
//  Each output buss '>BusName' must be to a unique bus name. Example 'add a> b> >a' will fail as the output bus a is already defined
//
// -------------------------------------------------------------------------------------------------------
// Occilators
// Outputs the samples to the out bus
// List of occilator types
//   sin, sinT, tri, saw, sqr, noise, pulse, pulseGate, noisePulse, noisePulseGate
//
// sin freqIn [phase] out
// sinT freqIn [phase] out  // uses sine table for faster sin function max resolution 1 second
// tri freqIn [phase] out
// saw freqIn [phase] out
// sqr freqIn [phase] out
// spectrum freqIn range spec_1 spec_2 spec_3 ...spec_n out
// noise out
// pulse freqIn widthIn [phase] out
// pulseGate freqIn widthIn [phase] out
// noisePulse freqIn widthIn [phase] out
// noisePulseGate freqIn widthIn [phase] out
//
// argument descriptions
//     freqIn must be a frequency bus output by freq command
//     widthIn From bus (or value) range is 0 to 1
//     phase from bus or value in range 0 1 sets the phase of the occilator
//
// -------------------------------------------------------------------------------------------------------
// Envelopes
// Outputs a signal over the time of the sample
//
// decay power out
// AHRSR attackTime holdTime releaseTime substainTime substainLevel release out
// range valueA valueB out
// rampOnOff widthOn widthOff out
//
//
// -------------------------------------------------------------------------------------------------------
// Gains
// Modify the level of a bus
//
// add inA inB out    // out = inA + inB
// sub inA inB out    // out = inA - inB
// mult inA inB out   // out = inA * inB
// min inA inB out    // out = Math.min(inA, inB)
// max inA inB out    // out = Math.max(inA, inB)
// abs inA out        // out = Math.abs(inA)
// neg inA out        // out = -inA
// sign inA inB out   // out = inA * Math.sign(inB)
// pow inA inB out    // out = Math.abs(inA) ** inB * Math.sign(inA)
// amp inA inB out    // same as mult out = inA * inB
// rangeVal inA inMin inMax out // Converts occilator input inA to ranged from inMin to inMax
//
//
// -------------------------------------------------------------------------------------------------------
// Mixers
// Mixes bus levels
//
// Mix inA inB mixAmount out // out = inA * mixAmount + (1 - mixAmount) * inB
//
// -------------------------------------------------------------------------------------------------------
// Filters
// Applys a filter to a bus signal
//
// runMean time in out   // applies a running mean to in bus Running mean over time
// delay time in out     // Send delayed by time in bus to out bus
// /*bufDelay time in out  // Send delayed by time from main bus (sample) (in is not used) to out bus*/
// /*bufDelayPitch time shift in out // Send delayed by time shifted in pitch from main bus (sample) (in is not used) to out bus*/
// chase a freq in out   // Chase filter response 0 < a < 1, freq
// chaseOpen a b in out  // Chase filter with undefined responce. Ensure a + b < 1
// loPass freq in out
// hiPass freq in out
// cut level in out      // cuts output to level if in above level
// pullDown level frac in out // pulls level down from (level * frac) to max level
   ======================================================================================================= */
`
}
var instrumentDisplayStyle = "procedural";
var SoundDefs = {
    sin: `
		wave sin { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			sin F> 0.0 >a
			amp a> 0.95 >
		}`,      
    sinSqr: `
		wave sinSqr { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			sin F> 0.0 >a
            pow a> 0.5 >b
			amp b> 0.95 >
		}`,       
    sinSqr2: `
		wave sinSqr2 { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			sin F> 0.0 >a
            pow a> 2 >b
			amp b> 0.95 >
		}`,            
    tri: `
		wave tri { 
			icon 9
			env 3
			dur 4
			freq 440 >F
			tri F> 0 >a
			amp a> 0.95 >
		}`,    
    triSqr: `
		wave triSqr { 
			icon 9
			env 3
			dur 4
			freq 440 >F
			tri F> 0 >a
            pow a> 0.5 >b
			amp b> 0.95 >
		}`,  
    triSqr2: `
		wave triSqr2 { 
			icon 9
			env 3
			dur 4
			freq 440 >F
			tri F> 0 >a
            pow a> 2 >b
			amp b> 0.95 >
		}`,        
    sinOnce: `
		wave sinOnce { 
			icon 8
			env 11
            loop
			dur 0.1 
            freq 100 >F
			sin F> 0.0 >a
			amp a> 0.95 >
		}`,        
    triOnce: `
		wave triOnce { 
			icon 9
			env 11
            loop
			dur 0.1 
            freq 100 >F
			tri F> 0.0 >a
			amp a> 0.95 >
		}`,       
    sawOnce: `
		wave sawOnce { 
			icon 10
			env 11
            loop
			dur 0.1 
            freq 100 >F
			saw F> 0.0 >a
			amp a> 0.95 >
		}`,       
    sqrOnce: `
		wave sqrOnce { 
			icon 11
			env 11
            loop
			dur 0.1 
            freq 100 >F
			sqr F> 0.0 >a
			amp a> 0.95 >
		}`,          
    saw: `
		wave saw { 
			icon 10
			env 3
			dur 4
			freq 440 >F
			saw F> 0 >a
			amp a> 0.95 >
		}
	`,	   
    sawSqr: `
		wave sawSqr { 
			icon 10
			env 3
			dur 4
			freq 440 >F
			saw F> 0 >a
            pow a> 0.5 >b
			amp b> 0.95 >
		}
	`,    
    sawSqr2: `
		wave sawSqr2 { 
			icon 10
			env 3
			dur 4
			freq 440 >F
			saw F> 0
            >a
            pow a> 2 >b
			amp b> 0.95 >
		}
	`,     
    sqr: `
		wave sqr { 
			icon 11
			env 3
			dur 4
			freq 440 >F
			sqr F> 0.121212 >a
			amp a> 0.7 >
		}
	`,    
    noise: `
		wave noise { 
			icon 7
			env 4
			dur 4
			freq 440 >F
			noise F> >a
			amp a> 0.7 >
		}
	`,      
    pulse: `
		wave noise { 
			icon 11
			env 4
			dur 4
			freq 440 >F
            freq 0.5 >F1
            saw F1> 0.5 >b
            mult b> 0.5 >c
            add c> 0.5 >d
			pulse F> d> >a
            chase 0.35 4400 a> >e
            delay 0.003607730066750222 e> >f
            mix e> f> 0.5 >m1
			amp m1> 0.7 >
		}
	`,      
    spec: `
		wave spec { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			spectrum F> 0.1 0.1 0.1 0.15 0.1 0.2 0.1 0.25 0.1 0.3 0.1 0.4 0.1 0.5 0.1 0.6 0.1 0.7 0.1 0.8 0.1 0.9 0.1 1 0.1 0.9 0.1 0.8 0.1 0.7 0.1 0.6 0.1 0.5 0.1 0.4 0.1 0.3 0.1 0.25 0.1 0.2 0.1 0.15 0.1 0.1 0.1 >a
            loPass 440 a> >b
			amp b> 0.95 >
		}`,      
    spec1: `
		wave spec1 { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			spectrum F> 0.05 0.1 0.1 0.15 0.1 0.2 0.1 0.25 0.1 0.3 0.1 0.4 0.1 0.5 0.1 0.6 0.1 0.7 0.1 0.8 0.1 0.9 0.1 1 0.1 0.9 0.1 0.8 0.1 0.7 0.1 0.6 0.1 0.5 0.1 0.4 0.1 0.3 0.1 0.25 0.1 0.2 0.1 0.15 0.1 0.1 0.1 >a
            hiPass 440 a> >b
			amp b> 0.95 >
		}`,       
    spec2: `
		wave spec2 { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			spectrum F> 0.025 0.1 0.1 0.15 0.1 0.2 0.1 0.25 0.1 0.3 0.1 0.4 0.1 0.5 0.1 0.6 0.1 0.7 0.1 0.8 0.1 0.9 0.1 1 0.1 0.9 0.1 0.8 0.1 0.7 0.1 0.6 0.1 0.5 0.1 0.4 0.1 0.3 0.1 0.25 0.1 0.2 0.1 0.15 0.1 0.1 0.1 >a
			amp a> 0.95 >
		}`,   
    spec3: `
		wave spec3 { 
			icon 8
			env 3
			dur 4 
            freq 440 >F
			spectrum F> 0.0125 0.1 0.1 0.15 0.1 0.2 0.1 0.25 0.1 0.3 0.1 0.4 0.1 0.5 0.1 0.6 0.1 0.7 0.1 0.8 0.1 0.9 0.1 1 0.1 0.9 0.1 0.8 0.1 0.7 0.1 0.6 0.1 0.5 0.1 0.4 0.1 0.3 0.1 0.25 0.1 0.2 0.1 0.15 0.1 0.1 0.1 >a
			amp a> 0.95 >
		}`,           
    sinStack: `
		wave sinStack { 
			icon 4
			loop
			env 4
			dur 30
			freq 440 >F2
			freq 110 >F0
			freq 220 >F1
			freq 880 >F3
			sin F0> >a0
			sin F1> >a1
			sin F2> >a2
			sin F3> >a3
			mix a3> a2> 0.5 >m1
			mix m1> a1> 0.5 >m2
			mix a0> m2> 0.7 >m3
			pullDown 0.7 0.3 m3> >
		}`,			
    sinTri: `
		wave sinTri { 
			icon 4
			env 3
			dur 2 
			freq 440 >F
			sin F> >a1
			tri F> >a2
			decay 2 >d
			mix a1> a2> d> >aa
			pullDown 0.7 0.3 aa> >
		}`,
    triSin: `
		wave triSin { 
			icon 4
			env 3
			dur 2 
			freq 440 >F
			sin F> >a1
			tri F> >a2
			decay 2 >d
			mix a2> a1> d> >aa
			pullDown 0.7 0.3 aa> >
		}`,
    sinTriPick: `
		wave sinTriPick { 
			icon 4
			env 0
			dur 1 
			freq 440 >F
			sin F> >a1
			tri F> >a2
			decay 3 >d3
			decay 2 >d
			mix a1> a2> d> >aa
			pullDown d3> 0.3 aa> >
		}`,
    triSinPick: `
		wave triSinPick { 
			icon 4
			env 0
			dur 1 
			freq 440 >F
			sin F> >a1
			tri F> >a2
			decay 3 >d3
			decay 2 >d
			mix a2> a1> d> >aa
			pullDown d3> 0.3 aa> >
		}`,		
    triHarm: `
		wave triHarm { 
			icon 4
			env 3
			dur 1
			freq 440 >F
			freq 441.5 >F1a
			freq 443 >F2a
			freq 438.5 >F1b
			freq 437 >F2b
			rampOnOff 0.5 0.5 >R1
			rampOnOff 1 0 >R2
			tri F> >a
			tri F1a> >a1
			tri F2a> >a2
			tri F1b> >a3
			tri F2b> >a4
			mix a1> a3> R1> >m1
			mix a2> a4> R2> >m2
			mix m1> m2> 0.5 >m3
			mix a> m3> 0.5 >aa
			pullDown 0.7 0.3 aa> >
		}`,		
    organ1: `
        wave organ_gen1 {
			icon 1
            env 3
            loop
            dur 4
            freq 440 >F
            freq 880 >F1
            freq 220 >F2
            freq 2 >Ma
            freq 4 >Mb
            sin F>  >a
            sin F1> >a1
            sin F2> >a2
            sin Ma> >sM1
            sin Mb> >sM2
            rangeVal sM1> 0.5 1 >d1
            rangeVal sM2> 0.5 1 >d2
            mix a1>   a>  d1>  >aa1
            mix a2>   a>  d2> >aa2
            mix aa1> aa2> 0.5 >aa3
            loPass 640 aa3> >aa4
            amp aa4> 0.7 >
        }
    `,
    organ2: `
        wave organ_gen2 {
			icon 1
            env 3
            loop
            dur 4
            freq 440 >F
            freq 880 >F1
            freq 220 >F2
            freq 2 >Ma
            freq 1 >Mb
            sin F>  >a
            tri F1> >a1
            sin F2> >a2
            sin Ma> >sM1
            sin Mb> >sM2
            rangeVal sM1> 0.5 1 >d1
            rangeVal sM2> 0.5 1 >d2
            mix a1>   a>  d1>  >aa1
            mix a2>   a>  d2> >aa2
            mix aa1> aa2> 0.5 >aa3
            loPass 800 aa3> >aa4
            amp aa4> 0.7 >
        }
    `,
    organ3: `
        wave organ_gen3 {
			icon 1
            env 3
            loop
            dur 4
            freq 440 >F
            freq 880 >F1
            freq 220 >F2
            freq 2 >Ma
            freq 1 >Mb
            sin F>  >a
            tri F1> >a1
            tri F2> >a2
            sin Ma> >sM1
            sin Mb> >sM2
            rangeVal sM1> 0.2 1 >d1
            rangeVal sM2> 0.2 1 >d2
            mix a>   a1>  d1>  >aa1
            mix a>   a2>  d2> >aa2
            mix aa1> aa2> 0.5 >aa3
            loPass 400 aa3> >aa4
            amp aa4> 0.7 >
        }
    `,
    stabOrgan1: `
        wave stabOrgan_gen1 {
			icon 4
            env 3
            dur 4
            freq 440 >F
            freq 880 >F1
            freq 220 >F2
            sin F>  >a
            sin F1> >a1
            sin F2> >a2
            decay 0.9 >d
            decay 1.3 >d1
            decay 2   >d2
            decay 3   >d3
            mix a>   a1>  d>  >aa1
            mix a>   a2>  d1> >aa2
            mix aa1> aa2> d2> >aa3
            loPass 640 aa3> >aa4
            pullDown d3> 0.5 aa4> >
        }
    `,
    stabOrgan2: `
        wave stabOrgan_gen2 {
			icon 4
            env 3
            dur 4
            freq 440 >F
            freq 880 >F1
            freq 220 >F2
            sin F>  >a
            sin F1> >a1
            sin F2> >a2
            decay 0.333 >d
            decay 0.5 >d1
            decay 1   >d2
            decay 3   >d3
            mix a>   a1>  d>  >aa1
            mix a>   a2>  d1> >aa2
            mix aa1> aa2> d2> >aa3
            loPass 350 aa3> >aa4
            pullDown d3> 0.5 aa4> >
        }
    `,
    windRes1: `
        wave windRes1 {
            icon 4
            env 4
            dur 1
            freq 440 >F
            freq 441 >F1
            freq 439 >F2
            freq 220 >Fl
            sin F> >s
            sin F1> >s1
            sin F2> >s2
            tri Fl> >sw
            tri F1> >sw1
            tri F2> >sw2
            decay 2 >D
            rampOnOff 0.1 0.9 >R
            pow R> 2.0 >R1
            mix s1> s2> 0.5 >ss
            mix sw1> sw2> 0.5 >sw22
            mix sw> sw22> 0.5 >sw23
            mix s> ss> D> >ms
            mix sw23> ms> R1> >ms1
            loPass 640 ms1> >ms2
            pullDown D> 0.1 ms2> >
        }
    `,
    windResHi2: `
        wave windResHi2 {
            icon 4
            env 4
            dur 1
            freq 440 >F
            freq 441 >F1
            freq 439 >F2
            freq 440 >Fl
            tri F> >s
            sin F1> >s1
            tri F2> >s2
            sin Fl> >sw
            tri F1> >sw1
            tri F2> >sw2
            decay 2 >D
            rampOnOff 0.1 0.9 >R
            pow R> 2.0 >R1
            mix s1> s2> 0.5 >ss
            mix sw1> sw2> 0.5 >sw22
            mix sw> sw22> 0.5 >sw23
            mix s> ss> D> >ms
            mix sw23> ms> R1> >ms1
            loPass 640 ms1> >ms2
            pullDown D> 0.1 ms2> >
        }
    `,

}

var UseSounds;
var drumSounds = {};

instrumentDisplayStyle = "strings";
createInstrumentUtil("Guitar_smp1", 2, "Midi/", "Korg-01W-A-Guitar-C3.wav");
createInstrumentUtil("Guitar_smp2", 2, "Midi/", "Korg-01W-RosewoodGt-C3.wav");
createInstrumentUtil("Guitar_smp3", 2, "Midi/", "Korg-M3R-Guitar-C3.wav");
createInstrumentUtil("Guitar_smp5", 3, "Midi/", "Korg-N1R-Flamenco-C4.wav");


createInstrumentUtil("Brass_smp1", 3, "Midi/", "Casio-MT-600-Brass-Ens-C3.wav");
createInstrumentUtil("Brass_smp2", 3, "Midi/", "Ensoniq-ESQ-1-Brass-Ensemble-C4.wav");
createInstrumentUtil("Brass_smp3", 3, "Midi/", "Ensoniq-VFX-SD-Fat-Brass-C4.wav");

createInstrumentUtil("violin_smp", 2, "Midi/", "Ensoniq-SQ-1-Violin-1-C5.wav");
createInstrumentUtil("Cello_smp", 2, "Midi/", "Korg-TR-Rack-Solo-Cello-C4.wav");
createInstrumentUtil("Viola_smp", 2, "Midi/", "Korg-TR-Rack-Viola-C4.wav");

instrumentDisplayStyle = "bass";
createSimpleInstrumentUtil("Bass_smp1", 3, "C3", "", "Bass.wav");
createSimpleInstrumentUtil("FingerBass_smp", 3, "C3", "", "fingerBass.wav");
createSimpleInstrumentUtil("fretlessBass_smp", 3, "C3", "", "fretlessBass.wav");
createSimpleInstrumentUtil("BassBuzz1", 3, "B2", "Marks/", "BassBuzz_B2.wav");
createSimpleInstrumentUtil("BassBuzz2", 3, "B2", "Marks/", "BassBuzz_B2_long.wav");


instrumentDisplayStyle = "horns";
createInstrumentUtil("horn_smp1", 3, "Midi/", "Yamaha-SY22-Fr-Horn-C5.wav");
createInstrumentUtil("horn_smp2", 3, "Midi/", "Roland-SC-88-French-Horn-C4.wav");
createInstrumentUtil("horn_smp3", 3, "Midi/", "Korg-TR-Rack-French-Horn-Ensemble-C5.wav");
createInstrumentUtil("horn_smp4", 3, "Midi/", "Kawai-K5000W-FrenchHr-C4.wav");
createInstrumentUtil("horn_smp5", 3, "Midi/", "Kawai-K1r-FrenchHorn-C5.wav");
createInstrumentUtil("horn_smp6", 3, "Midi/", "Ensoniq-ZR-76-Fr-Horn-GM-C4.wav");
createInstrumentUtil("horn_smp7", 3, "Midi/", "Ensoniq-SQ-1-French-Horn-C4.wav");
createInstrumentUtil("horn_smp8", 3, "Midi/", "E-Mu-Proteus-FX-FrHorns2-C4.wav");


instrumentDisplayStyle = "precision";
createInstrumentUtil("piano_smp", 0, "Midi/", "Ensoniq-SQ-2-Piano-C2.wav", "Ensoniq-SQ-2-Piano-C4.wav", "Ensoniq-SQ-2-Piano-C7.wav");
createInstrumentUtil("piano_smp2", 0, "Midi/", "Korg-NS5R-Piano-3-C3.wav", "Korg-NS5R-Piano-3-C5.wav");
createInstrumentUtil("pianoRock_smp", 0, "Midi/", "Korg-M3R-Ready2Rock-C2.wav");

instrumentDisplayStyle = "pipe";
createInstrumentUtil("Organ_smp", 1, "Midi/", "Ensoniq-ESQ-1-Organ-C4.wav ");
createInstrumentUtil("organ_smp2", 1, "Midi/", "Ensoniq-VFX-SD-Organ-C4.wav");
createInstrumentUtil("rockOrgan_smp", 1, "Midi/", "Ensoniq-ESQ-1-Rock-Organ-C4.wav");
createInstrumentUtil("garageOrgan_smp", 1, "Midi/", "Korg-TR-Rack-Garage-Organ-C3.wav");
createInstrumentUtil("cathedralOrgan_smp", 1, "Midi/", "Ensoniq-VFX-SD-Cathedral-Organ-C4.wav");
createSimpleInstrumentUtil("Pipe_smp", 1, "C3", "", "Pipe.wav");
createSimpleInstrumentUtil("PipeAccordion_smp", 1, "C3", "", "PipeAccordion.wav");
createSimpleInstrumentUtil("PipeReed_smp", 1, "C3", "", "PipeReed.wav");
createSimpleInstrumentUtil("PipeRock_smp", 1, "C3", "", "PipeRock.wav");


instrumentDisplayStyle = "misc";
createSimpleInstrumentUtil("Bottle_smp", 12, "C3", "", "Bottle.wav");
createSimpleInstrumentUtil("orchestra_smp", 5, "C3", "", "orchestra.wav");
createSimpleInstrumentUtil("orchestra_smp2", 5, "C3", "", "orchestra2.wav");
createSimpleInstrumentUtil("PhasedString", 5, "D3", "FX/Assorted/", "Dm_PhasedString.wav");

createSimpleFileInstrument("Midi/MadeSounds/", "windchime_D5_ic16.wav");
createSimpleFileInstrument("Midi/MadeSounds/", "guitar_Fs5_ic2.wav");

createSimpleFileInstrument("synth/", "Growle_F2_ic18.wav");
createSimpleFileInstrument("synth/", "RaveyChord_F3_ic17.wav");
createSimpleFileInstrument("synth/", "Synth_D2_ic17.wav");
createSimpleFileInstrument("synth/", "Synth_Fs3_ic14.wav");
createSimpleFileInstrument("synth/", "SynthStab_Gs2_ic17.wav");
createSimpleFileInstrument("synth/", "ChordVoicesSynth_Em3_ic17.wav");
createSimpleFileInstrument("synth/", "DrillSynth_F3_ic17.wav");
createSimpleFileInstrument("synth/", "GlossDrop_F3_ic17.wav");






instrumentDisplayStyle = "drums";

createDrumSet("DrumsOld_smp", 15, "A2",
    "drums/DrumCym.wav",
    "drums/DrumCymClose.wav",
    "drums/DrumRim.wav",
    "drums/DrumRim2.wav",
    "drums/DrumSnare.wav",
    "drums/DrumTom.wav",
    "drums/DrumTom2.wav",
    "drums/DrumTom3.wav",
    "drums/DrumTom4.wav",
    "drums/DrumKick.wav",
    "drums/DrumKick2.wav",
);
createDrumSet("Drums_smp", 15, "A2",
    "drums/Drum.ogg",
    "drums/DrumA.ogg",
    "drums/DrumB.ogg",
    "drums/DrumC.ogg",
    "drums/DrumD.ogg",
    "drums/DrumE.ogg",
    "drums/DrumF.ogg",
    "drums/DrumG.ogg",
    "drums/DrumH.ogg",
    "drums/DrumI.ogg",
    "drums/DrumJ.ogg",
    "drums/DrumK.ogg",

);
createDrumSet("Drums_smp2", 15, "A2",
    "coalhod.wav",
    "church.schellingwoude.wav",
    "drums/giant-electrotom.wav",
    "drums/tom-tom-spring-verb-hi.wav",
    "drums/tom-tom-spring-verb-lo.wav",
    "drums/dissonant_tom.wav",
    "drums/distortotom.wav",
    "drums/giant_tom.wav",
    "drums/giant_floor_tom.wav",
    "drums/hietom.wav",
    "drums/medetom.wav",
    "drums/loetom.wav",
    "drums/hitom.wav",
    "drums/midtom.wav",
    "drums/midtom2.wav",
    "drums/lotom.wav",
    "drums/ambient_tom_1.wav",
    "drums/ambient_tom_2.wav",
    "drums/ambient_tom_3.wav",
);

if (localStorage.synthInMode === "MODE2") {
}
async function createSoundKits() {
    const items = await getDirectory("./sounds/DrumKits/", true, false)
    for (const kit of items) {
        const files = await getDirectory(kit.path, false, true);
        createDrumSet("DrumSet_" + kit.name, 15, "A1", ...files.map(file => file.path.replace("./sounds/", "")));  
    }
    for (const [name, descStr] of Object.entries(drumSounds)) {
        UseSounds[name] = descStr;
        
    }
}
async function createSoundKit(icon, name, path) {
    const files = await getDirectory(path, false, true);
    if (files.length > 0) {
        createDrumSet(name, icon, "A1", ...files.map(file => file.path.replace("./sounds/", "")));  
    }
    for (const [name, descStr] of Object.entries(drumSounds)) { UseSounds[name] = descStr; }
}
async function createSampleSet(name, icon, startNote, endNote, filename) {
    var sIdx = NOTE_NAME.get(startNote).idx;
    var eIdx = NOTE_NAME.get(endNote).idx;

    var str = "instrument " + name + " { \n";
    str += "icon " + icon + ";\n";
    str += "drums;\n ";
    str += "notes [";
    const idxs = [];
    var idx = sIdx;
    var s = "";
    while (idx <= eIdx) {
        const isFile = await fileExists(filename.replace(/###/gi, NOTE_IDX[idx].name));
        if (isFile) { idxs.push(idx); }
        idx++;
    }

    for (const idx of idxs) {
        str += s + NOTE_IDX[idx].name;
        s = " ";
    }
    str += "] >F;\n";
    for (const idx of idxs) {
        const name = filename.replace(/###/gi, NOTE_IDX[idx].name);
        str += "wave " + NOTE_IDX[idx].name + " { load clean " + name + " }\n";
    }    
    str += "\n}";
    UseSounds[name] = str;
    instrumentDisplayStylesByName.set(name, { style: instrumentDisplayStyle });
    console.log(str);
}
function createDrumSet(name, icon, startNote, ...wavs) {
    var nIdx = NOTE_NAME.get(startNote).idx;
    name += "_" + wavs.length;
    var str = "instrument " + name + " { \n";
    str += "icon " + icon + ";\n";
    str += "drums;\n ";
    str += "notes [";
    var idx = nIdx;
    var s = "";
    for (const w of wavs) {
        str += s + NOTE_IDX[idx].name;
        idx++;
        s = " ";
    }
    str += "] >F;\n";
    idx = nIdx;
    for (const w of wavs) {
        const hold = w.includes("_Hold");
        const clean = w.includes("_Clean");
        str += "wave " + NOTE_IDX[idx].name + " { load " + (clean ? "clean " : "") + (hold ? "hold " : "") + "./sounds/" + w + " }\n";
        idx++;
    }    
    str += "\n}";
    drumSounds[name] = str;
    instrumentDisplayStylesByName.set(name, { style: instrumentDisplayStyle });
    console.log("Drum set: " + name + " : " + wavs.length + " samples");
} 
function createSimpleFileInstrument(dir, wav) {
    const parts = wav.split("_");
    createSimpleInstrumentUtil(parts[0], Number(parts[2].split(".")[0].replace("ic", "")), parts[1], dir, wav);    
}
function createSimpleInstrumentUtil(name, iconIdx, note, dir, wav) {
    const hold = wav.includes("_Hold");
 	SoundDefs[name] = `instrument ${name} { icon ${iconIdx}; notes [A1-C7] >F; playAll wave ${note} { load clean ${hold ? "hold " : ""} ./sounds/${dir}${wav} } }`;
    instrumentDisplayStylesByName.set(name, { style: instrumentDisplayStyle });   
}
function createInstrumentUtil(name, iconIdx, dir, ...wavs) {
	var str =  `instrument ${name} { `;
	const notes = [];
	const waves = [];
	for (const wav of wavs) {
		const parts = wav.split("-");
		const note = parts.pop().split(".")[0];
		notes.push(note);
		waves.push(`wave  ${note} { load clean ./sounds/${dir}${wav} } `);
	}
	str += `icon ${iconIdx}; env 4; notes [${notes.join(" ")}] >F; playAll `;
	str += waves.join(" ");
	str += " } ";
	SoundDefs[name] = str;
    instrumentDisplayStylesByName.set(name, { style: instrumentDisplayStyle });
    console.log(str);
}

var currentVolume = 0;
var currentWetVolume = 0;
var gain;
var wetGain;
var delay, delayGain, delayTime = 1, delayfeedback = 0.0
var convolver, compressor, convolverName = "";
async function waitForBuffer(name, samples) {
    return new Promise(done => {
        const wait = () => {
            samples[name] && done(samples[name]);
            !samples[name] && setTimeout(wait, 1000);
        }
        wait();
    });
}
async function loadSample(atx, samples, noteName, srcFiles) {
    const newName = nameConvert.newName(noteName);
    const note = NOTE_NAME.get(newName);
    samples.hasNotes[note.idx] = true;
    if (srcFiles[noteName].length <= 3) {
        const srcNote = nameConvert.newName(srcFiles[noteName]);
        const buffer = await waitForBuffer(srcNote, samples);
        samples[newName] = buffer;
    } else {
        const buffer = await atx.decodeAudioData(await (await fetch(srcFiles[noteName])).arrayBuffer());
        srcFiles[noteName] = undefined;
        buffer._baseFreq = note.freq;
        samples[newName] = buffer;
    }
}
async function loadSampleBuffer(atx, sampleFamily, sampleName) {
    return await atx.decodeAudioData(await (await fetch(sampleFamily[sampleName])).arrayBuffer());
}
const EnvP = (level, time) => ({level, time});
const envelopeTypes = {
    fixed(shape) {
        const last = shape[shape.length - 1];
        const endP = EnvP(0, 1);
        return Object.assign((atx, vol, time, stopTime) => {
            const env = atx.createGain();
            const decayStart = stopTime - time - 0.01;
            shape[0].time !== 0 && env.gain.setValueAtTime(0, time);
            for (const p of shape) {
                if (p.time >= decayStart) { break }
                else { env.gain.linearRampToValueAtTime(vol * p.level, time + p.time) }
            }
            last.level > 0 && env.gain.linearRampToValueAtTime(0,  stopTime);
            return env;
        }, {
            forTime(dur) {  },            
            level(t) {
                if (t <= 0 || t >= 1.0) { return 0; }
                var i = 0;
                while (i < shape.length) {
                    const sp = shape[i];
                    const sp1 = i + 1 < shape.length ? shape[i + 1] : endP
                    if (t >= sp.time && t < sp1.time) {
                        var tt = (t - sp.time) / (sp1.time - sp.time);
                        var v = (sp1.level - sp.level) * tt + sp.level;
                        return v;                        
                    }
                    i++;
                }
                return 0;
            }
        });
    },
    open() {
        return Object.assign((atx, vol, time, stopTime) => {
            const env = atx.createGain();
            env.gain.value = vol;                        
            return env;
        }, {
            forTime(dur) {},
            level(t) { return 1; }
        });;

    },
    timeScale(shape) {
        const last = shape[shape.length - 1];
        const endP = EnvP(0, 1);
        return Object.assign((atx, vol, time, stopTime) => {
            const env = atx.createGain();
            const t = stopTime - time;
            shape[0].time !== 0 && env.gain.setValueAtTime(0, time);
            for (const p of shape) { env.gain.linearRampToValueAtTime(vol * p.level, time + t * p.time) }
            last.time !== 1 && env.gain.linearRampToValueAtTime(0,  stopTime);
            return env;
        }, {
            forTime(dur) { dur; },
            level(t) {
                if (t <= 0 || t >= 1.0) { return 0; }
                var i = 0;
                while (i < shape.length) {
                    const sp = shape[i];
                    const sp1 = i + 1 < shape.length ? shape[i + 1] : endP
                    if (t >= sp.time && t < sp1.time) {
                        var tt = (t - sp.time) / (sp1.time - sp.time);
                        var v = (sp1.level - sp.level) * tt + sp.level;
                        return v;                        
                    }
                    i++;
                }
                return 0;
            }            
        });;
    }
}
function createEnvelope(type, shape) {
    if (envelopeTypes[type]) { return envelopeTypes[type](shape) }
}
const envelopes = [
    createEnvelope("timeScale", [EnvP(1, 0)]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(1, 0.98)]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(1, 0.1), EnvP(1, 0.4), EnvP(0.6, 0.6)]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(1, 0.01),EnvP(1, 0.9)]),
    createEnvelope("timeScale", [EnvP(1, 0), EnvP(1, 0.4)]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(1, 0.5)]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(1, 0.02), EnvP(0.75 * 0.75, 0.1 + (0.9 * 0.25)), EnvP(0.25, 0.1 + (0.9 * 0.5)), EnvP(0.25 * 0.25, 0.1 + (0.9 * 0.75))]),
    createEnvelope("timeScale", [EnvP(1, 0), EnvP(0.75 * 0.75, 0.25), EnvP(0.25, 0.5), EnvP(0.25 * 0.25, 0.75)]),
    createEnvelope("timeScale", [EnvP(1, 0), EnvP(0.75 * 0.75 * 0.75, 0.25), EnvP(0.5 * 0.5 * 0.5, 0.5), EnvP(0.25 * 0.25 * 0.25, 0.75)]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(0.25 * 0.25, 0.25), EnvP(0.25, 0.5), EnvP(0.75 * 0.75, 0.75), EnvP(0.98 * 0.98, 0.98)  ]),
    createEnvelope("timeScale", [EnvP(0, 0), EnvP(0.25 * 0.25 * 0.25, 0.25), EnvP(0.5 * 0.5 * 0.5, 0.5), EnvP(0.75 * 0.75 * 0.75, 0.75), EnvP(0.98 * 0.98 * 0.98, 0.98)  ]),
    createEnvelope("open", []),
];
const EMPTY_NOTE_INFO = { empty: true };
const DEFAULT_NOTE_INFO = { empty: false };
const sampleStack = [];
const channelTypes = {
    Sound(name, wave, envIdx = 0) {
        var buffer, panPos = 0, volume = 0.5;
        const play = Object.assign(function (note, time, stopTime, eIdx = envIdx) {
            const freqScale = note.freq / buffer._baseFreq;
            stopTime = Math.min(stopTime, buffer._loop ? stopTime : time + buffer.duration / freqScale);
            const sample = atx.createBufferSource();
			const pan = atx.createStereoPanner();
			pan.pan.value = panPos;
            sample.buffer = buffer
            sample.loop = buffer._loop;
            sample.playbackRate.value = freqScale;
            const env = envelopes[eIdx](atx, note.vol * volume, time, stopTime - 0.005);
            sample.connect(env).connect(pan).connect(gain);
            env.connect(pan).connect(wetGain);
            sample.start(time);
            sample.stop(stopTime);
            //if (stopTime - time > 4.0) { sampleStack.push(sample); }
        },{
            getDefaultEnvelopeIdx() { return envIdx },
			hasNotes: NOTE_ARRAY_ALL,
            iconIdx: wave.icon,
            building: false,
            isInstrument: false,
            isSound: true,            
			pan(pos) { panPos = pos },
            setVolume(vol) { volume = vol; },
            getNoteInfo() {
                return DEFAULT_NOTE_INFO;                
            },
            getBuffer() {
                return buffer;
                //sequencer
            },            
            async init() {
                play.building = true;
                enqueueBuild(wave.exe.bind(wave), (result) => {
                    buffer = result;
                    envIdx = buffer._envIdx;
                    play.building = false;
                });
                play.init = undefined;
            },
            sampler(note, time, stopTime, eIdx = envIdx) {
                const sample = {
                    time,
                    stopTime: Math.min(stopTime, buffer._loop ? stopTime : time + buffer.duration / (note.freq / buffer._baseFreq)),
                    freqScale: note.freq / buffer._baseFreq,
                    panPos,
                    vol: note.vol * volume,
                    env: envelopes[eIdx],
                    buffer,
                };
                envelopes[eIdx].forTime(sample.stopTime - time);
                return sample;  
            }
        });
        return play;
    },
    Instrument(name, instrument, envIdx = instrument.synthEnvIdx) {
        var samples, panPos = 0, volume = 0.5;
        const play = Object.assign(function (note, time, stopTime, eIdx = envIdx) {
            const buffer = samples[note.note.name];
            if (buffer) {
                const freqScale = note.freq / buffer._baseFreq;
				stopTime = buffer._hold ? time + buffer.duration / freqScale : Math.min(stopTime, buffer._loop ? stopTime : time + buffer.duration / freqScale);
                const sample = atx.createBufferSource();
				const pan = atx.createStereoPanner();
				pan.pan.value = panPos;
                sample.buffer = buffer;
				if (buffer._loop) {
					sample.loop = true;
					sample.loopStart = buffer._loopStart;
					sample.loopEnd = buffer._loopEnd;
				} else {
					sample.loop = false;
				}
                sample.playbackRate.value = freqScale;
                const env = envelopes[eIdx](atx, note.vol * volume, time, stopTime - 0.005);
                sample.connect(env).connect(pan).connect(gain);
                env.connect(pan).connect(wetGain);
                sample.start(time);
                sample.stop(stopTime);
                //if (stopTime - time > 4.0) { sampleStack.push(sample); }
            }
        },{
            getDefaultEnvelopeIdx() { return envIdx },
            iconIdx: instrument.icon,
			drums: instrument.drums,
            building: false,
            isInstrument: true,
            isSound: false,
            loNote: undefined,
            hiNote: undefined,
            getNoteInfo(note) {
                if (!play.building) {
                    const buf = samples[note.note.name];
                    if (buf) {
                        return {
                            sample: buf._filename,
                            duration: buf.duration / (note.freq / buf._baseFreq),
                            loops: buf._loop,
                        };                        
                    }
                }
                return EMPTY_NOTE_INFO;                   
            },
			pan(pos) { panPos = pos },
            setVolume(vol) { volume = vol; },
            async init() {
                play.building = true;
                enqueueBuild(instrument.exe.bind(instrument), (result) => {
                    samples = result;
                    play.hasNotes = samples.hasNotes;
                    envIdx = samples._envIdx;
                    play.building = false;
                    play.loNote = undefined;
                    play.hiNote = undefined;
                    for (const note of NOTE_IDX) {
                        if (play.loNote === undefined) {
                            if (samples[note.name] !== undefined) {
                                play.loNote = note;
                            }
                        } else if (play.loNote) {
                            if (samples[note.name]) {
                                play.hiNote = note;
                            }
                        }
                    }
                            
                });
                play.init = undefined;
            },
            getBuffer(name) { 
                return samples ? samples[name] : undefined;
            },
            sampler(note, time, stopTime, eIdx = envIdx) {
                const buffer = samples[note.note.name];
                if (buffer) {
                    const sample = {
                        time,
                        stopTime: buffer._hold ? time + buffer.duration / freqScale : Math.min(stopTime, buffer._loop ? stopTime : time + buffer.duration / (note.freq / buffer._baseFreq)),
                        freqScale: note.freq / buffer._baseFreq,
                        panPos,
                        vol: note.vol * volume,
                        env: envelopes[eIdx],
                        buffer,
                    };
                    envelopes[eIdx].forTime(sample.stopTime - time);
                    return sample;  
                }
                return;
            }            
        });
        return play;
    },
}

var log = () => {};
instrumentDisplayStylesByName.set("Dropped_Wavs", { style: "dropped" });
const waves = Object.assign([], {
    name: "Dropped_Wavs",
    icon: 17,
    env: 11,
    noteIdx: NOTE_NAME.get("A3").idx,
    createStr() {
        var str = "instrument " + waves.name + " { \n";
        str += "icon " + waves.icon + ";\n";
        str += "env " + waves.env + ";\n ";
        str += "drums;\n ";
        str += "notes [" + waves.map(wav => wav.note).join(" ") + "] >F;\n";
        for (const wav of waves) {
            const hold = wav.hold || wav.filename.includes("_Hold");
            const clean = wav.filename.includes("_Clean");
            str += "wave " + wav.note + " { load " + (clean ? "clean " : "") + (hold ? "hold " : "") + "" + wav.filename + " }\n";
        }
        str += "}";
        return str;
      
        
    }
});

if (localStorage.synthInMode === "MODE2") {
    UseSounds = {
        sin: SoundDefs.sin,
        sinSqr: SoundDefs.sinSqr,
        sinSqr2: SoundDefs.sinSqr2,
        tri: SoundDefs.tri,
        triSqr: SoundDefs.triSqr,
        triSqr2: SoundDefs.triSqr2,
        sinOnce: SoundDefs.sinOnce,
        triOnce: SoundDefs.triOnce,
        sawOnce: SoundDefs.sawOnce,
        sqrOnce: SoundDefs.sqrOnce,
        //saw: SoundDefs.saw,
        //sqr: SoundDefs.sqr,
        //noise: SoundDefs.noise,
        //pulse: SoundDefs.pulse,
    };
    [UseSounds, SoundDefs] = [SoundDefs, UseSounds];
    
}
    
const Synth = {
    get context() { return atx },
    serialize() { return { sounds: SoundDef } },
    serializeSetup() {
        return {
            filter: convolverName,
            volume:  Number(Synth.volume.toFixed(3)),
            wetVolume: Number(Synth.volumeWet.toFixed(3)),
        };
    },
    deserializeSetup(setup) {
        Synth.filter = setup.filter;
        Synth.volume = setup.volume;
        Synth.volumeWet = setup.wetVolume;
    },
    deserialize(data) {
        SoundDef = data.sounds;
        Synth.resetChannels();
    },
    deserializeSounds(sounds) { Object.keys(sounds).forEach(name => { SoundDefs[name] = sounds[name] }); Synth.resetChannels();},
    getSoundDescription(name) { return SoundDefs[name] },
    getInstruments() { return UseSounds; },
    hasInstrument(name) { return SoundDefs[name] !== undefined; },
    setInstrument(name) { return SoundDefs[name] = UseSounds[name]; },
    getInstrumentStyleStr(instName) { return instrumentDisplayStylesByName.get(instName)?.style; },
    addLogger(logger) { log = logger; },
    channelNames: [],
    addSoundWave(filename, hold) {
        waves.push({
            filename,
            hold,
            note: NOTE_IDX[waves.noteIdx++].name,
        });
        UseSounds[name] = waves.createStr();
        console.log(UseSounds[name]);    
    },
    defaultChannelName: "",
    envelopes,
    createSound(bufL, bufR) {
        var channels = 2, len = 0;
        if (bufR === undefined || bufR.length === 0) {
            channels = 1;
            len = bufL.length;
        } else {
            len = Math.min(bufL.length, bufR.length);
        }
        const buffer = atx.createBuffer(channels, len, atx.sampleRate);    
        buffer.copyToChannel(bufL, 0);
        channels === 2 && buffer.copyToChannel(bufR, 1);
        return buffer;
    },
    currentSample: undefined,
    stopSounds() {
        gain.disconnect();        
        gain = atx.createGain();
        gain.connect(compressor);
        if (convolver) {
            wetGain.disconnect();
            wetGain = atx.createGain();
            wetGain.connect(convolver);
        }
        Synth.stopSound();
    },
    stopSound() {
        if (Synth.currentSample) { 
            Synth.currentSample.stop(); 
            Synth.currentSample = undefined;
        }        
    },
    playSound(buffer, loop = false) {
        Synth.stopSound();
        const sample = Synth.currentSample = atx.createBufferSource();
        sample.buffer = buffer;
        sample.loop = loop;
        sample.playbackRate.value = 1;
        sample.connect(gain);
        sample.start(atx.currentTime);
        if (!loop) {
            sample.stop(atx.currentTime + buffer.duration);
        }
        
    },
    get volumeWet() { return currentWetVolume },
    get volume() { return currentVolume },
    set volume(val) { gain.gain.value = currentVolume = val },
    set volumeWet(val) { wetGain.gain.value = currentWetVolume = val },
    get filterNames() { return Object.keys(getInstrument("family covolverImpulses")) },
    get filterName() { return convolverName },
    set filter(val) {
        if (convolver) {
            wetGain.disconnect(convolver);
            convolver.disconnect(compressor);
            convolverName = "";
        }
        if (val !== 0) {
            if (typeof val === "string") {
				if (val === "") {
					if (convolver) { convolver = undefined }
				} else {
					loadSampleBuffer(atx, getInstrument("family covolverImpulses"), val)
						.then(buffer => {
							convolver = atx.createConvolver();
							convolver.normalize = true;
							convolver.buffer = buffer;
							wetGain.connect(convolver);
							convolver.connect(compressor);
							//this.message =  "Filter: " + (convolverName = val);
						})
				}
                convolverName = val;
            }
        } else {
            if (convolver) { convolver = undefined }
            convolverName = "";
        }
    },
    addChannel(name, type, ...data) {
        if (channelTypes[type]) {
            !Synth.defaultChannelName && (Synth.defaultChannelName = name)
            Synth.channelNames.push(name);
            Synth[name] = channelTypes[type](name, ...data);
            return Synth[name];
        }
    },
    channels: [],
    instrumentUpdate(name) { Synth.fireEvent("instrumentUpdate", name) },
    connect(output) { compressor.connect(output) },
    disconnect(output) { compressor.disconnect(output) },
    monitor() { /*// todo monitor atx.destination for gain */ },
    addSoundChannel(name) {
        if (!Synth.hasInstrument(name)) {
            if (UseSounds[name] !== undefined) {
                SoundDefs[name] = UseSounds[name]; 
                const soundBufs = {};
                buildWave(SoundDefs[name], soundBufs)        
                for (const name of Object.keys(soundBufs)) {
                    if (soundBufs[name].wave) {
                        Synth.channels.push(Synth.addChannel(name, "Sound", soundBufs[name]));
                    } else if (soundBufs[name].instrument) {
                        Synth.channels.push(Synth.addChannel(name, "Instrument", soundBufs[name]));
                    }
                }
                Synth.fireEvent("channelsReset");
                return true;
            }
        }
        return false;
    },
    resetChannels() {
        //this.message = "Reseting channels";
        for (const name of Synth.channelNames) { Synth[name] = undefined }
        Synth.channelNames.length = 0;
        Synth.channels.length = 0;
        Synth.defaultChannelName = "";
        const soundBufs = {};
        Object.keys(SoundDefs).forEach(name => buildWave(SoundDefs[name], soundBufs));
        Synth.channels = [
            ...Object.keys(soundBufs).map(name =>
                soundBufs[name].wave ? Synth.addChannel(name, "Sound", soundBufs[name]) : undefined
            ),
            ...Object.keys(soundBufs).map(name =>
                soundBufs[name].instrument ? Synth.addChannel(name, "Instrument", soundBufs[name]) : undefined
            ),
        ].filter(s => s !== undefined);
        Synth.fireEvent("channelsReset");
    },
};
Object.assign(Synth, Events(Synth));
var atx;
//;
function StartAudio(db) {

    if (atx) { return }
    Synth.atx = atx = new AudioContext();
    compressor = atx.createDynamicsCompressor();
    gain = atx.createGain();
    wetGain = atx.createGain();
    gain.connect(compressor);
    compressor.connect(atx.destination);
    Synth.resetChannels();
    Synth.volume = 0.5;
    Synth.volumeWet = 0.5;
    return Synth;
}
setTimeout(createSoundKits, 1)
setTimeout(() => {
    createSoundKit(17, "PunchPads", "./sounds/FX/PunchPads/");
    createSoundKit(17,"WoshPads", "./sounds/FX/WoshPads/");
    createSoundKit(17,"MusicalPads", "./sounds/FX/MusicalPads/");
    createSoundKit(17,"Assorted", "./sounds/FX/Assorted/");
}, 100);

export {StartAudio};