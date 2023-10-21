import {EZWebWorkers} from "./EZWebWorkers.jsm";

function noteCreator() {
    const notesOld = [27.50,  29.14, 30.87, 32.70, 34.65, 36.71, 38.89, 41.20, 43.65, 46.25, 49.00, 51.91, 55.00, 58.27, 61.74, 65.41, 69.30, 73.42, 77.78, 82.41, 87.31, 92.50, 98.00, 103.83, 110.00, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880.00, 932.33, 987.77, 1046.50, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760.00, 1864.66, 1975.53, 2093.00, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520.00, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88]; // from A0
    const notes = {};
    const noteNames = "A,As,B,C,Cs,D,Ds,E,F,Fs,G,Gs".split(",");
    const noteNamesB = "A,A\u266F,B,C,C\u266F,D,D\u266F,E,F,F\u266F,G,G\u266F".split(",");
    notesOld.map((freq, idx)=> {
        const newName = noteNames[idx % 12] + (idx / 12 | 0);
        notes[newName] =  freq;
    })
    Object.entries(notes).forEach(([name, freq], i) => notes[name] = {name, nameB: noteNamesB[i % 12], freq, idx: i, octave: i / 12 | 0, note: i % 12});

    const NOTE_NAME = new Map(Object.values(notes).map(note=>([note.name, note])));
    const NOTE_FREQ = new Map(Object.values(notes).map(note=>([note.freq, note])));
    const NOTE_IDX = Object.values(notes).map(note => note);

    const F32 = data => new Float32Array(data);
    const Fz64 = data => new Array(data).fill(0);
    const F64 = data => new Array(data);
    const randSign = () => Math.random() < 0.5 ? 1 : -1;
    const spect = (vol = 1, freqScale = 1, power = 1, phase = 0, dc = 0, shape = Waves.sin) => ({vol, freqScale, power, phase, dc, shape});
    const TAU = Math.PI * 2;
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
        sin: () => { var p = 0; return (nTime) => Math.sin(((p += nTime) - nTime) * TAU); },
        sqr: () => { var p = 0; return (nTime) => ((p += nTime) - nTime) % 1 < 0.5 ? -1 : 1; },
        tri: () => { var p = 0; return (nTime, v = ((p += nTime) - nTime) % 1) => (v < 0.5 ? v * 2 : 2 - v * 2) * 2 - 1; },
        saw: () => { var p = 0; return (nTime, v = ((p += nTime) - nTime) % 1) => v * 2 - 1; },
        pulse: () => { var p = 0; return (nTime, width) => ((p += nTime) - nTime) % 1 < width ? -1 : 1; },
        noise: () => () => Math.random() * 2 - 1,
        pulseGate: () => { var p = 0; return (nTime, width) => ((p += nTime) - nTime) % 1 < width ? -1 : 1},
        noisePulse: () => { var p = 0; return  (nTime, width) => ((p += nTime) - nTime) % 1 < width ? Math.random() * 2 - 1 : - 1},
        noisePulseGate: () => { var p = 0; return (nTime, width) => ((p += nTime) - nTime) % 1 < width ? (Math.random() < 0.5 ? -1 : 1) : - 1},
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
        //rampOn: (width) => (eTime) => eTime < width ? eTime / width : 1,
        //rampOff: (width) => (eTime) => eTime > 1 - width ? 1 - (eTime - (1 - width)) / width : 1,
        rampOnOff: (onWidth, offWidth) => (eTime) => {
            onWidth = Math.min(1, Math.max(0, onWidth));
            offWidth = Math.min(1, Math.max(0, offWidth));
            if (onWidth > offWidth) {
                onWidth = offWidth = (onWidth + offWidth) / 2;
            }
            return eTime < width ? eTime / width : (
                eTime > 1 - width ?
                    1 - (eTime - (1 - width)) / width :
                    1
                )
        },
        //ma+xEnv: (...env) => (eTime) => Math.max(...env.map(e => e(eTime))),
        //minEnv: (...env) => (eTime) => Math.min(...env.map(e => e(eTime))),
        // meanEnv: (...env) => (eTime) => env.reduce((v, e) => v + e(eTime), 0) / env.length,
        mix: () => (a, b, e) => e * a + (1- e) * b,
        //mixWave: (wave, ...args) => (nTime, a, b, e = (wave(nTime, ...args) + 1) / 2) => e  * a + (1- e) * b,
        add: () => (a, b) => a + b,
        sub: () => (a, b) => a - b,
        mult: () => (a, b) => a * b,
        min: () => (a, b) => Math.min(a, b),
        max: () => (a, b) => Math.max(a, b),
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
        bufDelay: (time) => {
            const samples = Sounds.rate * time | 0;
            return (v) => {
                const pos = Sounds.idx - samples;
                if (pos < 0) { return 0 }
                return Sounds.buf[pos];
            }
        },
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
        loPass: () => {
            var out = 0;
            return (freq, v) => {
                const ePow = 1- Math.exp( -(1 / Sounds.rate)  * 2 * Math.PI * freq);
                out += (v - out) * ePow;
                return out;
            }
        },
        hiPass: () => {
            var out = 0, pv = 0;
            return (freq, v) => {
                const f = (1 / Sounds.rate) * freq * Math.PI;
                const a = 1 / (f + 1);
                const b = f - 1;
                out = a * (v - pv - out * b);
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
        normalizeBuffer(buf) {
            var i = 0;
            var max = 0;
            while (i < buf.length) {
                max = Math.max(Math.abs(buf[i++]), max);
            }
            i = 0;
            while (i < buf.length) {
                buf[i] = (buf[i] / max) * 0.7;
                i++
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

    const Commands = {
        instrument: {
            match(s) { return s === "instrument" },
            create(parent, s, cmds) {
                const cmd = {
                    instrument: true,
                    name: cmds.pop(),
                    synthEnvIdx: 0,
                    icon: 0,
                    loop: false,
                    cmds: [],
                    notes: [],
                    bus: [],
                    parent,
                    async exe(S) {
                        console.log("instrument");
                        var created = false;
                        const samples = { hasNotes: createNoteArray() };
                        const createNote = async (cmd, vals, note) => {
                            console.log("Note: " + note.name + " cmd: " + cmd.name);
                            samples.hasNotes[note.idx] = true;
                            const buf = await cmd.exe(Sounds, vals);
                            buf._baseFreq = note.freq;
                            buf._loop = cmd.loop || this.loop;
                            samples[note.name] = buf;
                            created = true;
                        }
                        for (const [name, bus] of Object.entries(this.bus)) {
                            if (bus.exe) { bus.val = bus.exe(S) }
                            console.log("Bus: " + name);
                        }
                        var noteIdx = 0;
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
                                setTimeout(() => {
                                    nextNote()
                                }, 25);
                                Synth.infoElement.textContent = "Note " + noteIdx + " of " + this.notes.length;
                            } else { Synth.infoElement.textContent  = "Notes created!" }
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
                            if (cmd.length > 1) {
                                cmd = cmd.slice(1);
                            }
                        }
                    }
                    if (open) {
                        if (cmd.endsWith("]")) {
                            listing = false;
                            if (cmd.length > 1) {
                                cmd = cmd.slice(0,-1);
                            }
                        }
                    }

                    if (open && cmd !== "]" && cmd !== "[") {
                        if (cmd === "-") {
                            noteIdxs.push(-1);
                        } else {
                            const note = NOTE_NAME.get(cmd);
                            if (note) {
                                noteIdxs.push(note.idx);
                            }
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
                        while (ns <= ne) {
                            notes.push(NOTE_IDX[ns++]);
                        }
                        i++;
                    } else {
                        notes.push(NOTE_IDX[noteIdx]);
                    }
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
                    async exe(S, busVals = {}) {
                        var complete = false;
                        var buffer;
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
                            S.fill(buf, (i) => {
                                const vals = {...busVals}
                                const e = S.eTime(i);
                                for (const [name, bus] of Object.entries(this.bus)) {
                                    if (bus.samp) {
                                        vals[name] = bus.val(S, vals, i);
                                    } else if (bus.sig) {
                                        vals[name] = bus.val(S, vals);
                                    } else if (bus.env) {
                                        vals[name] = bus.val(e)
                                    } else if (bus.proc) {
                                        vals[name] = bus.val(vals);
                                    } else if (bus.filter) {
                                        vals[name] = bus.val(vals);
                                    }
                                };
                                return vals[this.name];
                            });
                            S.buf = [];
                            S.normalizeBuffer(buf);
                            buffer = S.createSample(atx, buf, this.freq);
                        } else {

                        }
                        buffer._envIdx = this.synthEnvIdx;
                        buffer._loop = this.loop;
                        return buffer;

                    }
                };
                parent.cmds.push(cmd);
                return cmd;
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
        iconIdx: {
            match(s) { return s === "icon" },
            create(parent, s, cmds) { parent.icon = Number(cmds.pop()) | 0; return parent }
        },
        env: {
            match(s) { return s === "env" },
            create(parent, s, cmds) { parent.synthEnvIdx = Number(cmds.pop()) | 0; return parent }
        },
        load: {
            match(s) { return s === "load" },
            create(parent, s, cmds) {
                const fileName = cmds.pop();
                cmds.push(">");
                parent.bus[getOutBus(parent, cmds)] = {
                    load: true,
                    async load(atx) {
                        const buffer = await atx.decodeAudioData(await (await fetch(fileName)).arrayBuffer())
                        buffer._baseFreq = parent.freq
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
                parent.bus[cmds.pop().slice(1)] = {
                    samp: true, val(S, vals, n) { return S.nTime(n, ...getArgs(vals, args, argArray)) },
                };;
                return parent;
            }
        },
        occilator: {
            match(s) { return ["sin","tri","saw","sqr","pulse","noise", "pulseGate", "noisePulse", "noisePulseGate"].includes(s) },
            create(parent, func, cmds) {
                const args = getValues(cmds), fFunc = Sounds[func](), argArray = [];
                parent.bus[getOutBus(parent, cmds)] = {
                    sig: true, val(S, vals) { return fFunc(...getArgs(vals, args, argArray)) },
                };
                return parent;
            }
        },
        envelope: {
            match(s) { return ["decay", "AHRSR", "range", "rampOnOff"].includes(s) },
            create(parent, func, cmds) {
                const args = getValues(cmds), fFunc = Sounds[func];
                parent.bus[getOutBus(parent, cmds)] = {
                    env: true, exe(S) { return fFunc(...getArgs({}, args)) },
                };
                return parent;
            }
        },
        gain: {
            match(s) { return ["add", "sub", "mult", "amp"].includes(s) },
            create(parent, funcName, cmds) {
                const args = getValues(cmds);
                const func = Sounds[funcName]();
                parent.bus[getOutBus(parent, cmds)] = {
                    proc: true, exe(S) { return (vals) => func(...getArgs(vals, args)) },
                };
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
                parent.bus[getOutBus(parent, cmds)] = {
                    proc: true, exe(S) { return (vals) => func(vals[inA], vals[inB], ...getArgs(vals, args)) },
                };
                return parent;
            }
        },
        filters: {
            match(s) { return ["runMean", "delay", "bufDelay", "chase", "chaseOpen"].includes(s) },
            create(parent, funcName, cmds) {
                const init = getNumbers(cmds);
                const inBus = cmds.pop().slice(0, -1);
                const func = Sounds[funcName](...init);
                parent.bus[getOutBus(parent, cmds)] = {
                    filter: true, exe(S) { return (vals) => func(vals[inBus]) },
                };
                return parent;
            }
        },
        dinFilters: {
            match(s) { return ["loPass", "hiPass", "cut", "pullDown"].includes(s) },
            create(parent, funcName, cmds) {
                const args = getValues(cmds);
                const func = Sounds[funcName]();
                parent.bus[getOutBus(parent, cmds)] = {
                    filter: true, exe(S) { return (vals) => func(...getArgs(vals, args)) },
                };
                return parent;
            }
        },
    }
    const CommandArray = Object.values(Commands);
    function buildWave(str) {
        const lines = str
            .replace(/;|\r\n/g, "\n")
            .split("\n")
            .map(l => l.replace(/\/\/.*/g,"").trim())
            .filter(l => l !== "");
        const tokens  = [];
        const sounds = {cmds: []};

        var cmd = sounds;
        for (const line of lines) { tokens.push(...line.split(" ").filter(s=> s !== "")) }
        tokens.reverse();
        while(tokens.length) {
            const t = tokens.pop();
            const cm = CommandArray.find(com => com.match(t));
            if (cm) { cmd = cm.create(cmd, t, tokens) }
        }
        const S = Sounds;
        const bufs = {};
        for (const c of cmd.cmds) {
            bufs[c.name] = c;
            //c.exe(bufs, S)
        }
        return bufs;
    }
    var buffs;
    function workerFunction(data) {
        if (data.task === "parse") {
            buffs = buildWave(data.soundStr);
            return Object.keys(buffs);
        } else if(data.task === "create") {
            buffs.exe();
        }


    }
}

