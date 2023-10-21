const notesFloored = [
    27,   29,   30,   32,   34,   36,   38,   41,   43,   46,   49,   51,
    55,   58,   61,   65,   69,   73,   77,   82,   87,   92,   98,   103,
    110,  116,  123,  130,  138,  146,  155,  164,  174,  185,  196,  207,
    220,  233,  246,  261,  277,  293,  311,  329,  349,  369,  392,  415,
    440,  466,  493,  523,  554,  587,  622,  659,  698,  739,  783,  830, 
    880,  932,  987,  1046, 1108, 1174, 1244, 1318, 1396, 1479, 1567, 1661,
    1760, 1864, 1975, 2093, 2217, 2349, 2489, 2637, 2793, 2959, 3135, 3322,
    3520, 3729, 3951, 4186, 4434, 4698, 4978, 5274, 5587, 5919, 6271, 6644
];
const state = {
    rate: 1,
    b0: 0,
    b1: 0,
    b2: 0,
    a1: 0,
    a2: 0,
    x1L: 0, x1R: 0,
    x2L: 0, x2R: 0,
    y1L: 0, y1R: 0,
    y2L: 0, yR2: 0,
}
function biquadProcess(){
    
    const L  = state.L;
    const R  = state.R;
    const Lu = state.Lu;
    const Ru = state.Ru;    
    
	const b0 = state.b0;
	const b1 = state.b1;
	const b2 = state.b2;
	const a1 = state.a1;
	const a2 = state.a2;
	var x1L = state.x1L, x1R = state.x1R;
	var x2L = state.x2L, x2R = state.x2R;
	var y1L = state.y1L, y1R = state.y1R;
	var y2L = state.y2L, y2R = state.y2R;
    const size = L.length;
    var i = 0;
    while (i < size) {
		const x0L = L[i], x0R = R[i]
		Lu[i] = b0 * x0L + b1 * x1L + b2 * x2L - a1 * y1L - a2 * y2L;
		Ru[i] = b0 * x0R + b1 * x1R + b2 * x2R - a1 * y1R - a2 * y2R;
        
		x2L = x1L;
		x2R = x1R;
		x1L = x0L;
		x1R = x0R;
        
		y2L = y1L;
		y2R = y1R;
		y1L = Lu[i];
		y1R = Ru[i];
        i++;
	}
}
function stateResetExtra() {
    state.repeat = 1;
    state.gain = -1;
    state.pow = 1;
}    
function stateReset() {
	state.x1L = 0;
	state.x1R = 0;
	state.x2L = 0;
	state.x2R = 0;
	state.y1L = 0;
	state.y1R = 0;
	state.y2L = 0;
	state.y2R = 0;

}
function stateScale(scale) {
	state.b0 = scale;
	state.b1 = 0.0;
	state.b2 = 0.0;
	state.a1 = 0.0;
	state.a2 = 0.0;
}
function statePassThrough() { stateScale(1) }
function stateZero() { stateScale(0) }
const process = {
    scale(scale) {
        const Lu = state.Lu;
        const Ru = state.Ru;          
        var i = 0;
        while (i < Lu.length) {
            Lu[i] *= scale;
            Ru[i] *= scale;
            i++;
        }
    },
    peek(wet) {
        var L = state.L;
        var R = state.R;          
        if (wet) {
            L = state.Lu;
            R = state.Ru;          
        }
        var i = 0, max = 0;
        while (i < L.length) {
            max = Math.max(Math.abs(L[i]), Math.abs(R[i]), max);
            i++;
        }
        return max;
    },
    wet() {
        const L  = state.L;
        const R  = state.R;
        const Lu = state.Lu;
        const Ru = state.Ru;          
        var i = 0, l, r, max = 0;
        while (i < L.length) {
            l = Lu[i] = L[i];
            r = Ru[i] = R[i];
            max = Math.max(Math.abs(l), Math.abs(r), max);
            i++;
        }
        state.wetPeek = max;
    },
    dry() {
        const L  = state.L;
        const R  = state.R;
        const Lu = state.Lu;
        const Ru = state.Ru;          
        var i = 0;
        while (i < L.length) {
            L[i] = Lu[i];
            R[i] = Ru[i];
            i++;
        }
    },    
    phat() {
        const L = state.L;
        const R = state.R;          
        const Lu = state.Lu;
        const Ru = state.Ru;          
        const pow = (1 - (0.5 / 20) * state.pow);      
        const dryPeek = process.peek(false);
        const scale = (1 / dryPeek) * state.gain;
        var i = 0;
        while (i < Lu.length) {
            const l = L[i];
            const r = R[i];
            Lu[i] = (Math.abs(l * scale) ** pow) * Math.sign(l);
            Ru[i] = (Math.abs(r * scale) ** pow) * Math.sign(r);
            i++;
        }
        const p = process.peek(true);
        process.scale(dryPeek / p);      
    },
    lowPass() {
        var c = state.repeat < 1 ? 1 : state.repeat;
        while (c--) {
            stateReset();
            biquadProcess();
            process.dry();
        }
    },
    hiPass() {
        var c = state.repeat < 1 ? 1 : state.repeat;
        while (c--) {
            stateReset();
            biquadProcess();
            process.dry();
        }
        
    }
}
const biquad = {  
    phat(gain, pow) {
        state.gain = gain;
        state.pow = pow;
    },        
    lowPass(cutoff, repeat) {
        stateResetExtra();
        state.repeat = repeat;
        cutoff = notesFloored[cutoff] / (state.rate * 2);
        const theta = Math.PI * 2 * cutoff;
        const alpha = Math.sin(theta) * 0.5;
        const cos  = Math.cos(theta);
        const beta  = (1 - cos) * 0.5;
        const aInv = 1 / (1 + alpha);
        state.b0 = aInv * beta;
        state.b1 = aInv * 2 * beta;
        state.b2 = aInv * beta;
        state.a1 = aInv * -2 * cos;
        state.a2 = aInv * (1 - alpha);
    },
    hiPass(cutoff, repeat) {
        stateResetExtra()
        state.repeat = repeat;
        cutoff = notesFloored[cutoff] / (state.rate * 0.5);
        const theta = Math.PI * 2 * cutoff;
        const alpha = Math.sin(theta) * 0.5;
        const cos  = Math.cos(theta);
        const beta  = (1 + cos) * 0.5;
        const aInv = 1 / (1 + alpha);
        state.b0 = aInv * beta;
        state.b1 = aInv * -2 * beta;
        state.b2 = aInv * beta;
        state.a1 = aInv * -2 * cos;
        state.a2 = aInv * (1 - alpha);
    },
    bandPass(freq, _, Q) {
        stateReset()
        freq /= state.rate * 0.5;
        if (freq <= 0 || freq >= 1) { stateZero(); }
        else if (Q <= 0) { statePassThrough(); }
        else { 
            const theta = Math.PI * 2 * freq;
            const alpha = Math.sin(theta) / (2 * Q);
            const k     = Math.cos(theta);
            const a0inv = 1 / (1 + alpha);
            state.b0 = a0inv * alpha;
            state.b1 = 0;
            state.b2 = a0inv * -alpha;
            state.a1 = a0inv * -2 * k;
            state.a2 = a0inv * (1 - alpha);
        }
    },
    notch(freq, _, Q) {
        stateReset()
        freq /= state.rate * 0.5;
        if (freq <= 0 || freq >= 1) { statePassThrough(); }
        else if (Q <= 0) { stateZero(); }
        else { 
            const theta = Math.PI * 2 * freq;
            const alpha = Math.sin(theta) / (2 * Q);
            const k     = Math.cos(theta);
            const a0inv = 1 / (1 + alpha);
            state.b0 = a0inv;
            state.b1 = a0inv * -2 * k;
            state.b2 = a0inv;
            state.a1 = a0inv * -2 * k;
            state.a2 = a0inv * (1 - alpha);
        }
    },
    peaking(freq, db, Q) {
        stateReset()
        freq /= state.rate * 0.5;
        const A = 10 ** (db * 0.025);
        if (freq <= 0 || freq >= 1) { statePassThrough(); }
        else if (Q <= 0) { stateScale(A * A); }
        else { 
            const theta = Math.PI * 2 * freq;
            const alpha = Math.sin(theta) / (2 * Q);
            const k     = Math.cos(theta);
            const a0inv = 1 / (1 + alpha / A);
            state.b0 = a0inv * (1 + alpha * A);
            state.b1 = a0inv * -2 * k;
            state.b2 = a0inv * (1 - alpha * A);
            state.a1 = a0inv * -2 * k;
            state.a2 = a0inv * (1 - alpha / A);
        }
    },
    allPass(freq, _, Q) {
        stateReset()
        freq /= state.rate * 0.5;
        if (freq <= 0 || freq >= 1) { statePassThrough(); }
        else if (Q <= 0) { stateScale(-1); }
        else {
            const theta = Math.PI * 2 * freq;
            const alpha = Math.sin(theta) / (2 * Q);
            const k     = Math.cos(theta);
            const a0inv = 1 / (1 + alpha);    
            state.b0 = a0inv * (1 - alpha);
            state.b1 = a0inv * -2 * k;
            state.b2 = a0inv * (1 + alpha);
            state.a1 = a0inv * -2 * k;
            state.a2 = a0inv * (1 - alpha);
        }
    },
    lowShelf(freq, db, Q) {
        stateReset();
        freq /= state.rate * 0.5;
        const A = 10 ** (db * 0.025);
        if (freq <= 0 || Q === 0) { statePassThrough(); }
        else if (freq >= 1) { stateScale(A * A); }
        else {    
            const theta = Math.PI * 2 * freq;
            const alpha = 0.5 * Math.sin(theta) * ((Math.max(0, (A + 1 / A) * (1 / Q - 1) + 2)) ** 0.5);
            const k     = Math.cos(theta);
            const k2    = 2 * (A ** 0.5) * alpha;
            const Ap1   = A + 1;
            const Am1   = A - 1;
            const a0inv = 1 / (Ap1 + Am1 * k + k2);
            state.b0 = a0inv *  A * (Ap1 - Am1 * k + k2);
            state.b1 = a0inv *  2 * A * (Am1 - Ap1 * k);
            state.b2 = a0inv *  A * (Ap1 - Am1 * k - k2);
            state.a1 = a0inv * -2 * (Am1 + Ap1 * k);
            state.a2 = a0inv * (Ap1 + Am1 * k - k2);
        }
    },
    highShelf(freq, db, Q) {
        stateReset()
        freq /= state.rate * 0.5;
        const A = 10 ** (db * 0.025);
        if (freq >= 1 || Q === 0) { statePassThrough(); }
        else if (freq <= 0) { stateScale(A * A); }
        else {      
            const theta = Math.PI * 2 * freq;
            const alpha = 0.5 * Math.sin(theta) * ((Math.max(0, (A + 1 / A) * (1 / Q - 1) + 2)) ** 0.5);
            const k     = Math.cos(theta);
            const k2    = 2 * (A ** 0.5) * alpha;
            const Ap1   = A + 1;
            const Am1   = A - 1;
            const a0inv = 1 / (Ap1 - Am1 * k + k2);
            state.b0 = a0inv *  A * (Ap1 + Am1 * k + k2);
            state.b1 = a0inv * -2 * A * (Am1 + Ap1 * k);
            state.b2 = a0inv *  A * (Ap1 + Am1 * k - k2);
            state.a1 = a0inv *  2 * (Am1 - Ap1 * k);
            state.a2 = a0inv * (Ap1 - Am1 * k - k2);
        }
    }
}
function setBiquadBuffers(left, right, leftU, rightU, rate) {
    state.L = left;
    state.R = right;
    state.Lu = leftU;
    state.Ru = rightU;
    state.rate = rate;   
}
function applyBiquadFilter(name, ...args) {
    if (state?.L.length && biquad[name]) {

        biquad[name](...args);
        process[name] ? process[name]() : biquadProcess();
        return true;
    }
    return false;
}
export {applyBiquadFilter, setBiquadBuffers, biquad};

// lowPass(cutoff, db)
// hiPass(cutoff, db)
// bandPass(freq, _, Q)
// notch(freq, _, Q) 
// peaking(freq, db, Q)
// allPass(freq, _, Q)
// lowShelf(freq, db, Q)
// highShelf(freq, db,  Q)