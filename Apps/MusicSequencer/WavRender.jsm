import {encodeWav} from "./WavEncoder.jsm";
import {compressor, defaultCompressor, simpleCompressor, advanceCompressor, setCompressorBuffers} from "./Compressor.jsm";

//---------------------------------------------------------------------------------------
// BiquadFilters
// lowPass(cutoff, resonance)
// hiPass(cutoff, resonance)
// bandPass(freq, Q)
// notch(freq, Q) 
// peaking(freq, Q, db)
// allPass(freq, Q)
// lowShelf(freq, Q, db)
// highShelf(freq,  Q, db)
import {applyBiquadFilter, setBiquadBuffers} from "./BiquadFilters.jsm";
//---------------------------------------------------------------------------------------

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
const wavBuf = [[],[]];
const useBuf = [[],[]];
const L = wavBuf[0];
const R = wavBuf[1];
const Lu = useBuf[0];
const Ru = useBuf[1];
wavBuf.channels = 2;
var samples = 0;
const FADE_POW = 0.7;
const FADE_OUT_POW = 2;
const FADE_LEN = 280;
const FADE_OUT_LEN = 280;
const FADE_LEN_INV = 1 / FADE_LEN;
const FADE_OUT_LEN_INV = 1 / FADE_OUT_LEN;
const MIN_DYNAMIC_RANGE = 0.95;
const OUT_LEVEL = 0.95;
const COMPRESSOR_PRESSURE = 3.4; // this is logarithmic
const COMPRESSOR_THRESHOLD = 0.75;
const SPEED_OF_SOUND = 343 * 100;  // in cm per second
const INV_SPEED_OF_SOUND = 1 / SPEED_OF_SOUND;
const RMS_SAMPLE_TIME = 0.3;    // in seconds
const INTERPOLATORS = [nearest, linear, cosine, cubicCatmullRom];
var trackIdx = 0;
const bufStack = [];
var useFade = true;
var sterio = true;
var trackVolume = 0.5;
const gain2Db = g => 6 * Math.log2(g);
const dB2Gain = db => 2 ** (db / 6);
function fadeIn(samplesFromStart) {
    return samplesFromStart < FADE_LEN ? (samplesFromStart * FADE_LEN_INV) ** FADE_POW : (useFade = false, 1.0);
}
function fadeOut(samplesFromEnd) {
    return samplesFromEnd < FADE_OUT_LEN ? (samplesFromEnd * FADE_OUT_LEN_INV) ** FADE_OUT_POW : 1.0;
}
const maxArr = a => a.reduce((m,v) => m > Math.abs(v) ? m : Math.abs(v), 0);
function cubicCatmullRom(data, pos) {
    const l = data.length - 1;
    const x = pos * data.length % 1;
    const idx = Math.floor(pos * data.length);
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
}
function nearest(data, pos) {
    return data[Math.floor(pos * data.length)];
}
function linear(data, pos) {
    const l = data.length - 1;    
    const u = (pos * data.length) % 1;
    const idx = Math.floor(pos * data.length);
    if (u === 0.0) { return data[idx] }
    const v0 = data[idx];
    return (data[Math.min(l, idx + 1)] - v0) * u + v0;
}
function cosine(data, pos) {
    const idx = Math.floor(pos * data.length);
    const v0 = data[idx];
    const v1 = data[Math.min(data.length - 1, idx + 1)];
    const x = (1 - Math.cos(((pos * data.length) % 1) * Math.PI)) * 0.5;
    return v0 * (1 - x) + v1 * x;  
}
function compressorCall() {
    setCompressorBuffers(L, R, Lu, Ru, wavBuf.rate);
    defaultCompressor();
    compressor();

}
function mixer() {
    const lM = 1 / Math.max(1, maxArr(Lu));
    const rM = 1 / Math.max(1, maxArr(Ru));
    var i = L.length;
    while (i--) {
        L[i] *= lM;
        R[i] *= rM;
    }
}
function sampleMixer() {
    var i = L.length;
    while (i--) {
        L[i] = Lu[i] ? L[i] / Lu[i] : 0.0;;
        R[i] = Ru[i] ? R[i] / Ru[i] : 0.0;;
    }
}
function sampleVol(len) {
    var invLen = 1 / len;
    var i = 0;
    var rl = 0;
    var ll = 0;
    while (i < L.length) {
        ll += L[i] * L[i];
        rl += R[i] * R[i];
        if (i > len) {
            const ii = i - len;
            ll -= L[ii] * L[ii];
            rl -= R[ii] * R[ii];
        }
        Lu[i] = (ll * invLen) ** 0.5;
        Ru[i] = (rl * invLen) ** 0.5;
        i++;
    }
}
function normalize(scale) {
    var i = L.length;
    while (i--) {
        L[i] *= scale;
        R[i] *= scale;
    }
}
const volume = normalize;
function peekRMS() {
    const samples = Math.floor(wavBuf.rate * RMS_SAMPLE_TIME), invSamples = 1 / samples;
    var sL = 0, sR = 0, sLR = 0, mL = 0, mR = 0, mLR = 0, maxL = 0, maxR = 0, maxLR = 0;
    var clip = 0;
    var i = 0;
    while (i < L.length) {
        const l = Math.abs(L[i]);
        const r = Math.abs(R[i]);
        clip += l > 1 ? 1 : 0;
        clip += r > 1 ? 1 : 0;
        sL += l;
        sR += r;
        sLR += (l + r) * 0.5;
        if (i > samples) {
            const l = Math.abs(L[i - samples]);
            const r = Math.abs(R[i - samples]);
            sL -= l;
            sR -= r;
            sLR -= (l + r) * 0.5;            
            mL = sL * invSamples;
            mR = sR * invSamples;
            mLR = sLR * invSamples;
        } else {
            mL = sL * invSamples;
            mR = sR * invSamples;
            mLR = sLR * invSamples;
        }
        maxL = Math.max(maxL, mL);
        maxR = Math.max(maxR, mR);
        maxLR = Math.max(maxLR, mLR);
        i ++;
    }
    peekRMS.L = maxL;
    peekRMS.R = maxR;
    peekRMS.LR = maxLR;
    peekRMS.clip = (clip / (L.length * 10)) * 1000;
    
}
function autoNormalize() {
    const scale = 1 / getDynamicRange();
    var i = L.length;
    while (i--) {
        L[i] *= scale;
        R[i] *= scale;
    }
}
function getDynamicRange() {
    getDynamicRange.peekAt = 0;
    return getDynamicRange.peek = wavBuf[0].reduce((max, v, i) => {
        v = Math.max(Math.abs(v), Math.abs(R[i]));
        if (v > max) {
            getDynamicRange.peekAt = i;
            return v;
        }
        return max;
    }, 0);
}
getDynamicRange.getPeek = () => Math.max(Math.abs(L[getDynamicRange.peekAt]), Math.abs(R[getDynamicRange.peekAt]));
function panDirectDelay(ang) {
    const x = Math.cos(ang) * 18;
    const y = Math.sin(ang) * 18;
    const earsX = 0;
    const leftEarY = -9;
    const rightEarY = 9;
    const leftDist = ((x - earsX) * (x - earsX) + (y - leftEarY) * (y - leftEarY)) ** 0.5;
    const rightDist = ((x - earsX) * (x - earsX) + (y - rightEarY) * (y - rightEarY)) ** 0.5;
    const leftTime = leftDist * INV_SPEED_OF_SOUND;
    const rightTime = rightDist * INV_SPEED_OF_SOUND;
    return {
        delay: (rightTime - leftTime),
        leftLev: ang < 0 ? 1 : Math.cos(ang * 0.75),
        rightLev: ang > 0 ? 1 : Math.cos(ang * 0.75),
    };
}
function panVolume(pan) {
    if (pan === 0) { return { delay: 0, leftLev: 1, rightLev: 1 } }
    if (pan < 0) { return { delay: 0, leftLev: 1, rightLev: Math.max(0, 1 + pan) } }
    return { delay: 0, leftLev: Math.max(0, 1 - pan), rightLev: 1 }
}
function hiPass(cutoff) {
    const f = (1 / wavBuf.rate) * Math.PI * cutoff, invF = 1 / (f + 1);
    var i = 0;
    var vL = L[i];
    var vR = R[i++];
    while (i < L.length) {            
        vL = L[i] = invF * (L[i] - vL - vL * (f - 1));
        vR = R[i] = invF * (R[i] - vR - vR * (f - 1));
        i++;
    }
}
function lowPass(cutoff) {
    var rc = 1.0 / (cutoff * 2 * Math.PI);
    var dt = 1.0 / wavBuf.rate;
    var alpha = dt / (rc + dt);
    var i = 0;
    var vL = L[i];
    var vR = R[i++];
    while (i < L.length) {
        vL = L[i] = vL + (alpha * (L[i] - vL));
        vR = R[i] = vR + (alpha * (R[i] - vR));
        i++;
    }
}
function popFromStack() {
    getDynamicRange.peekAt = 0;   
    getDynamicRange.peek = 0;
    var max = 0;
    const sBuf = bufStack.pop();
    const len = sBuf.LR[0].length;
    var i = 0;
    while (i < len) {
        const vl = Math.abs(L[i] = sBuf.LR[0][i]);
        const vr = Math.abs(R[i] = sBuf.LR[1][i]);
        if (vl > max || vr > max) {
            getDynamicRange.peek = max = Math.max(vr, vl);
            getDynamicRange.peekAt = i;
        }
        Lu[i] = sBuf.LRu[0][i];
        Ru[i] = sBuf.LRu[1][i];
        i++;
    }
}
function pushToStack() {
    const sBuf = {
        LR: [[],[]],
        LRu: [[],[]],
    };
    var i = 0;
    while (i < L.length) {
        sBuf.LR[0][i] = L[i];
        sBuf.LR[1][i] = R[i];
        sBuf.LRu[0][i] = Lu[i];
        sBuf.LRu[1][i] = Ru[i];
        i++;
    }
    bufStack.push(sBuf);
}
function mixToStack() {
    if (bufStack.length === 0) {
        pushToStack();
        return;
    }
    const sBuf = bufStack[bufStack.length - 1];
    const len = sBuf.LR[0].length;
    var i = 0;
    while (i < len) {
        sBuf.LR[0][i] += L[i];
        sBuf.LR[1][i] += R[i];
        sBuf.LRu[0][i] += Lu[i];
        sBuf.LRu[1][i] += Ru[i];
        i++;
    }
}
function mixFromU(wet = 1) {
    const dry = 1 - wet;
    const len = L.length;
    var i = 0;
    if (wet === 1) {
        while (i < len) {
            L[i] = Lu[i];
            R[i] = Ru[i++];
        }       
    } else {
        while (i < len) {
            L[i] = L[i] * dry + Lu[i] * wet;
            R[i] = R[i] * dry + Ru[i] * wet;
            i++;
        }
    }
}
 
// lowPass(cutoff, db)
// hiPass(cutoff, db)
// bandPass(freq, _, Q)
// notch(freq, _, Q) 
// peaking(freq, db, Q)
// allPass(freq, _, Q)
// lowShelf(freq, db, Q)
// highShelf(freq, db,  Q)
const filtersCommon = {
    phat: { freq: 1, db: 0.9, Q: 1, wet: 1, use: false },  // freq = gain, db = pow
    lowPass: { freq: 48, db: 2, Q: 1, wet: 1, use: false },  // freq = cutoff, db = repeats
    hiPass: { freq: 48, db: 2, Q: 1, wet: 1, use: false },
    //bandPass: { freq: 0, db: -1, Q: 1, wet: 0, use: false },
};
filtersCommon.phat.info = () => { return {
        name: "phat",
        prams: [
            { name: "gain", step: 1/20, min: 0, max: 1, value: 1,   setValue(v) { return Math.min(1, Math.max(0, v)) },              showValue(v) { return "Gain: " + v.toFixed(3); } },
            { name: "power", step: 1, min: 1, max: 20, value: 1, setValue(v) { return Math.round(Math.min(20, Math.max(0, v))) }, showValue(v) { return "Pow: " + (1 - (0.5 / 20) * v).toFixed(3); } },
        ],
    };
}
filtersCommon.lowPass.info = () => { return {
        name: "lowPass",
        prams: [        
            { name: "cutoff", step: 1, min: 0, max: notesFloored.length - 1, value: 48, setValue(v) { return Math.round(Math.min(notesFloored.length - 1, Math.max(0, v))) }, showValue(v) { return "Cutoff: " + notesFloored[v] + "hz"; }   },
            { name: "repeat", step: 1, min: 1, max: 6, value: 1,                        setValue(v) { return Math.round(Math.min(20, Math.max(1, v))) },                      showValue(v) { return "Repeats: " + v.toFixed(0); }  },
        ],
    };
}
filtersCommon.hiPass.info = () => { return {
        name: "hiPass",
        prams: [        
            { name: "cutoff", step: 1, min: 0, max: notesFloored.length - 1, value: 48, setValue(v) { return Math.round(Math.min(notesFloored.length - 1, Math.max(0, v))) }, showValue(v) { return "Cutoff: " + notesFloored[v]  + "hz"; }   },
            { name: "repeat", step: 1, min: 1, max: 6, value: 1,                        setValue(v) { return Math.round(Math.min(20, Math.max(1, v))) },                      showValue(v) { return "Repeats: " + v.toFixed(0); }  },
        ],
    };
}
/*filtersCommon.bandPass.info = () => { return {
        name: "bandPass",
        prams: [        
            { name: "cutoff", min: 100, max: 22000, value: 440  },
            { name: "db", min: 0, max: -64, value: -1  },
        ],
    };
}*/



const WavRender = {
    info: [],
    hasContent: false,
    playable: undefined,
    filters: filtersCommon,
    options: {
        save: false,
        RMS: true,
        normalize: false,
        compress: false,
        trackCompress: false,
        mixDown: true,
        dryOnly: true,
        interpolatorIdx: 2,
        delaySterio: false,        
        filters: [
            ...(() => {
                const filters = [];
                var i = 0;
                while (i < 10) {
                    const filter = {};
                    for (const [name, value] of Object.entries(filtersCommon)) { filter[name] = {...value}; }
                    filters.push(filter);
                    i++;
                }
                return filters;
            })()
        ],
    },
    createBuf(lenSeconds, channels = 2, rate = 48000, trackVol = 0.5) {
        trackIdx = 0;
        WavRender.playable = undefined;
        WavRender.hasContent = false;
        sterio = channels === 2;
        wavBuf.channels = channels;
        wavBuf.rate = rate;
        samples = lenSeconds * rate;
        trackVolume = trackVol;
        L.length = 0;
        R.length = 0;
        Lu.length = 0;
        Ru.length = 0;
        var i = 0;
        while (i < samples) {
            L.push(0);
            R.push(0);
            Lu.push(0);
            Ru.push(0);
            i++;
        }
    },
    flush() {
        samples = 0;
        L.length = 0;
        R.length = 0;
        Lu.length = 0;
        Ru.length = 0;
        WavRender.hasContent = false;
    },
    drawSample(sample) {
        useFade = true;
        const inter = INTERPOLATORS[WavRender.options.interpolatorIdx];
        const sterioBuf         = sample.buffer.numberOfChannels === 2;
        const startIdx          = Math.floor(sample.time * wavBuf.rate);
        const length            = Math.floor(sample.stopTime * wavBuf.rate) - startIdx;
       
        const dataL             = sample.buffer.getChannelData(0);
        const dataR             = sterioBuf ? sample.buffer.getChannelData(1) : dataL;
        const pan               = WavRender.options.delaySterio ? panDirectDelay((sterio ? sample.panPos : 0) * Math.PI * 0.5) : panVolume(sterio ? sample.panPos : 0);
        const noteTimeSamples   = (sample.stopTime - sample.time) * sample.buffer.sampleRate
        const sampScale         = wavBuf.rate / sample.buffer.sampleRate;
        //const loops             = sample.buffer._loop ? (noteTimeSamples / dataL.length) + 1 : 1.0;
        const invSampLen        = 1 / dataL.length;
        const fadeOutPos        = length - FADE_OUT_LEN - 1;

        var i = 0;
        while (i < length) {
            const sampleIdx = startIdx + i;
            if (sampleIdx >= 0 && sampleIdx < samples) {
                var sampPos = (i * sampScale * sample.freqScale) * invSampLen;
                if (sampPos >= 0) {
                    WavRender.hasContent = true;
                    const eV    = sample.env.level(i / length);
                    const fIn   = useFade ? fadeIn(i) : 1;
                    const fOut  = (i > fadeOutPos ? fadeOut(length - i)  : 1) * fIn;
                    const vol   = sample.vol * eV * fOut;
                    if (sterioBuf) {
                        L[sampleIdx] += inter(dataL, (sampPos - pan.delay + 1) % 1) * vol * pan.leftLev;
                        R[sampleIdx] += inter(dataR, (sampPos + pan.delay + 1) % 1) * vol * pan.rightLev;
                    } else {
                        const vl = inter(dataL, (sampPos - pan.delay + 1) % 1) * vol;
                        const vr = inter(dataL, (sampPos + pan.delay + 1) % 1) * vol;
                        L[sampleIdx] += vl * pan.leftLev;
                        R[sampleIdx] += vr * pan.rightLev;
                    }
                    Lu[sampleIdx] += 1;
                    Ru[sampleIdx] += 1;
                }
            } else  if (sampleIdx > samples) {
                break;
            }
            i++;
        }
    },
    completedTrack(filename = "testSound", vol = 1, level = OUT_LEVEL) {
        if (WavRender.options.RMS) {// && !WavRender.options.mixDown) {
            peekRMS();
            WavRender.info.push("Track RMS L: " + gain2Db(peekRMS.L).toFixed(1) + "db R: " + gain2Db(peekRMS.R).toFixed(1) + "db LR: " + gain2Db(peekRMS.LR).toFixed(1) + "db");
            peekRMS.clip > 0 && WavRender.info.push("Clipping: " + peekRMS.clip.toFixed(3) + "mp");
        }
        if (!WavRender.options.mixDown) {
            if (!WavRender.options.dryOnly) {
                for (const [name, filter] of Object.entries(WavRender.options.filters[trackIdx])) {
                    if (filter.wet > 0 && filter.use) {
                        setBiquadBuffers(L, R, Lu, Ru, wavBuf.rate);
                        if (applyBiquadFilter(name, filter.freq, filter.db, filter.Q)) {
                            const info = filtersCommon[name].info();
                            WavRender.info.push("Filter: '" + name + "' " + 
                                (info.prams[0] ? info.prams[0].showValue(filter.freq) + " " : "")  + "" +  
                                (info.prams[1] ? info.prams[1].showValue(filter.db) + " " : "")  + "" + 
                                (info.prams[2] ? info.prams[2].showValue(filter.Q) + " " : "")  + 
                                "wet: " + filter.wet.toFixed(3));
                            mixFromU(filter.wet);
                        }
                    }
                }
            }
        }
        if (WavRender.options.trackCompress) {
            var dRange = getDynamicRange();
            WavRender.info.push("Peek " + getDynamicRange.peek.toFixed(3));
            if (dRange > 1.0) {
                
                WavRender.info.push("Compressor");
                compressorCall();
                mixFromU(1);
                dRange = getDynamicRange();
                WavRender.info.push("Post Compressor peek: " + dRange);
            }
            if (dRange < MIN_DYNAMIC_RANGE) {
                WavRender.info.push("Dynamic range too low: " + dRange);
                normalize(1 / dRange);
                WavRender.info.push("Normalized by scaling: " + (1 / dRange));
            } else if (dRange > 1) {
                WavRender.info.push("Normalize to fix clipping: " + dRange);
                normalize(1 / dRange);
                WavRender.info.push("Normalized by scaling: " + (1 / dRange));
            }
            WavRender.info.push("Wave Dynamic range: " + getDynamicRange.getPeek());
            normalize(level);
            WavRender.info.push("Synth level: " + level);
             if (WavRender.options.RMS) {
                peekRMS();
                WavRender.info.push("Track RMS L: " + gain2Db(peekRMS.L).toFixed(1) + "db R: " + gain2Db(peekRMS.R).toFixed(1) + "db LR: " + gain2Db(peekRMS.LR).toFixed(1) + "db");
                peekRMS.clip > 0 && WavRender.info.push("Clipping: " + peekRMS.clip.toFixed(3) + "mp");
            }           
        }

        if (WavRender.options.mixDown) {
            mixToStack();
            WavRender.info.push("Stacked track: " + filename);
            return new Promise(done => {
                WavRender.flush();
                done(true);
            });
        } else {
            trackIdx++;
            if (WavRender.options.save) {
                return new Promise(savedAndReady => {
                    const wav = {
                        sampleRate: wavBuf.rate,
                        float: true,
                        channelData: [
                            new Float32Array(L),
                            new Float32Array(R)
                        ]
                    };
                    encodeWav(wav).then(buffer => {
                        const anchor = document.createElement('a');
                        const revokeable = anchor.href = URL.createObjectURL(new Blob([buffer] ,{type: "application/octet-stream"}));
                        anchor.download = filename + ".wav";
                        anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
                        URL.revokeObjectURL(revokeable);
                        WavRender.flush();
                        savedAndReady(true);
                    });
                });
            } else {
                return new Promise(savedAndReady => {
                    WavRender.flush();
                    savedAndReady(true);
                });
            }
        }
    },
    hasStacked() { return bufStack.length > 0; },
    completed(filename = "testSound", synth) {
        WavRender.info.push("Completing................................");
        if (WavRender.options.mixDown) {
            popFromStack();
            if (!WavRender.options.dryOnly) {
                for (const [name, filter] of Object.entries(WavRender.options.filters[trackIdx])) {
                    if (filter.wet > 0 && filter.use) {
                        setBiquadBuffers(L, R, Lu, Ru, wavBuf.rate);
                        if (applyBiquadFilter(name, filter.freq, filter.db, filter.Q)) {
                            const info = filtersCommon[name].info();
                            WavRender.info.push("Filter: '" + name + "' " + 
                                (info.prams[0] ? info.prams[0].showValue(filter.freq) + " " : "")  + "" +  
                                (info.prams[1] ? info.prams[1].showValue(filter.db) + " " : "")  + "" + 
                                (info.prams[2] ? info.prams[2].showValue(filter.Q) + " " : "")  + 
                                "wet: " + filter.wet.toFixed(3));
                            mixFromU(filter.wet);
                        }
                    }
                }        
            }
            getDynamicRange();            
            WavRender.info.push("Peek " + getDynamicRange.peek.toFixed(3));
            if (getDynamicRange.peek !== 0 && (WavRender.options.normalize || WavRender.options.compress)) {
                 if (WavRender.options.RMS) {
                    peekRMS();
                    WavRender.info.push("RMS L: " + gain2Db(peekRMS.L).toFixed(1) + "db R: " + gain2Db(peekRMS.R).toFixed(1) + "db LR: " + gain2Db(peekRMS.LR).toFixed(1) + "db");
                    peekRMS.clip > 0 && WavRender.info.push("Clipping: " + peekRMS.clip.toFixed(3) + "mp");
                }                
                if (WavRender.options.compress) {     
                    WavRender.info.push("Compressor");
                    compressorCall();
                    mixFromU(1);
                    getDynamicRange.peek = getDynamicRange();
                    WavRender.info.push("Post Compressor peek: " + getDynamicRange.peek.toFixed(3));
                    if (WavRender.options.normalize && getDynamicRange.peek !== 0 && getDynamicRange.peek !== 1) { 
                        WavRender.info.push("Normalized for peek: " + getDynamicRange.peek.toFixed(3));
                        normalize(1.0 / getDynamicRange.peek);
                    }
                    
                } else if (WavRender.options.normalize) {       
                    WavRender.info.push("Normalized for peek: " + getDynamicRange.peek.toFixed(3));
                    normalize(1.0 / getDynamicRange.peek);
                }
            } 
             if (WavRender.options.RMS) {
                peekRMS();
                WavRender.info.push("RMS L: " + gain2Db(peekRMS.L).toFixed(1) + "db R: " + gain2Db(peekRMS.R).toFixed(1) + "db LR: " + gain2Db(peekRMS.LR).toFixed(1) + "db");
                peekRMS.clip > 0 && WavRender.info.push("Clipping: " + peekRMS.clip.toFixed(3) + "mp");
            }             
            //sampleMixer();
            if (WavRender.options.save) {
                return new Promise(savedAndReady => {
                    const wav = {
                        sampleRate: wavBuf.rate,
                        float: true,
                        channelData: [
                            new Float32Array(L),
                            new Float32Array(R)
                        ]
                    };
                    encodeWav(wav).then(buffer => {
                        const anchor = document.createElement('a');
                        const revokeable = anchor.href = URL.createObjectURL(new Blob([buffer] ,{type: "application/octet-stream"}));
                        anchor.download = filename + ".wav";
                        anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
                        URL.revokeObjectURL(revokeable);
                        WavRender.flush();
                        savedAndReady(true);
                    });
                });
            } else {
                return new Promise(done => {
                    const bufL = new Float32Array(L);
                    const bufR = new Float32Array(R);
                    WavRender.playable = synth.createSound(new Float32Array(L), new Float32Array(R));
                    WavRender.playable.peek = getDynamicRange.peek;
                    WavRender.flush();
                    done(true);
                });
            }
        } else {
            return new Promise(done => { done(true)});
        }
    }
};
export {WavRender};