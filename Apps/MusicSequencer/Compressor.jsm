
var L, R, Lu, Ru, state = {};
const SF_COMPRESSOR_MAXDELAY  = 1024;
const SF_COMPRESSOR_SPU       = 32;
const SF_COMPRESSOR_SPACINGDB = 5;

const dB2Gain_C = db => 10 ** (0.05 * db);
const gain2DB_C = gain => 20.0 * Math.log10(gain);
const kneeCurve = (x, k, threshold) => threshold + (1.0 - Math.exp(-k * (x - threshold))) / k;
const kneeSlope = (x, k, threshold) => k * x / ((k * threshold + 1) * Math.exp(k * (x - threshold)) - 1);
const adaptiveReleaseCurve = (x, a, b, c, d) => {
	const x2 = x * x;
	return a * x2 * x + b * x2 + c * x + d;
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const abs = Math.abs;
const fix = (v, def) => isNaN(v) || v === Infinity ? def : v;
const compCurve = (x, k, slope, lThreshold, lThresholdKnee, threshold, knee, kneeOffset) => {
	if (x < lThreshold)     { return x; }
	if (knee <= 0.0)        { return dB2Gain_C(threshold + slope * (gain2DB_C(x) - threshold)); }
	if (x < lThresholdKnee) { return kneeCurve(x, k, lThreshold); }
	return dB2Gain_C(kneeOffset + slope * (gain2DB_C(x) - threshold - knee));
}


function defaultCompressor() {

	advanceCompressor(
		  0,    // pregain
	  	 -24,   // threshold
	 	  30,   // knee
		  12,   // ratio
		  0.003,// attack
		  0.25, // release
		  0,    // predelay
		  0.09, // releasezone1
		  0.16, // releasezone2
		  0.42, // releasezone3
		  0.98, // releasezone4
		  0,    // postgain
	);
}
function simpleCompressor(pregain, threshold, knee,  ratio,  attack,  release){
	advanceCompressor(pregain, threshold, knee, ratio, attack, release,
		0,    // predelay
		0.09, // releasezone1
		0.16, // releasezone2
		0.42, // releasezone3
		0.98, // releasezone4
		0,    // postgain
	);
}
function advanceCompressor(pregain, threshold, knee, ratio, attack, release, preDelay, releaseZone1, releaseZone2, releaseZone3, releaseZone4,  postGain) {
    const rate = state.rate;
	var delayBufSize = rate * preDelay;
	if (delayBufSize < 1) {
		delayBufSize = 1;
	} else if (delayBufSize > SF_COMPRESSOR_MAXDELAY) {
		delayBufSize = SF_COMPRESSOR_MAXDELAY;
    }
    const buf = state.delayBuf = [[], []];
    var i = 0;
    while (i < delayBufSize) {
        buf[0][i] = 0;
        buf[1][i++] = 0;
    }
      
	const linearThreshold = dB2Gain_C(threshold);
	const slope = 1 / ratio;
	var k = 5; 
	var kneeDBOffset = 0;
	var linearThresholdKnee = 0;
	if (knee > 0){ 
		const xknee = dB2Gain_C(threshold + knee);
		let mink = 0.1, maxk = 10000;
		for (let i = 0; i < 15; i++){
			kneeSlope(xknee, k, linearThreshold) < slope ? maxk = k : mink = k;
			k = (mink * maxk) ** 0.5;
		}
		kneeDBOffset = gain2DB_C(kneeCurve(xknee, k, linearThreshold));
		linearThresholdKnee = dB2Gain_C(threshold + knee);
	}

	const fulllevel = compCurve(1.0, k, slope, linearThreshold, linearThresholdKnee, threshold, knee, kneeDBOffset);
    const releaseSamples = rate * release;
	const y1 = releaseSamples * releaseZone1;
	const y2 = releaseSamples * releaseZone2;
	const y3 = releaseSamples * releaseZone3;
	const y4 = releaseSamples * releaseZone4;



	state.threshold            = threshold;
	state.knee                 = knee;
	state.linearPregain        = dB2Gain_C(pregain);
	state.linearThreshold      = linearThreshold;
	state.slope                = slope;
	state.attackSamplesInv     = 1 / (rate * attack);
	state.satReleaseSamplesInv = 1 / (rate * 0.0025);
	state.k                    = k;
	state.kneeDBOffset         = kneeDBOffset;
	state.linearThresholdKnee  = linearThresholdKnee;
	state.masterGain           = dB2Gain_C(postGain) * Math.pow(1.0 / fulllevel, 0.6);
	state.a                    = (-y1 + 3.0 * y2 - 3.0 * y3 + y4) / 6.0;
	state.b                    = y1 - 2.5 * y2 + 2.0 * y3 - 0.5 * y4;
	state.c                    = (-11.0 * y1 + 18.0 * y2 - 9.0 * y3 + 2.0 * y4) / 6.0;
	state.d                    = y1;
	state.detectorAvg          = 0.0;
	state.compGain             = 1.0;
	state.maxCompDiffDB        = -1.0;
	state.delayBufSize         = delayBufSize;
	state.delayWritePos        = 0;
	state.delayReadPos         = delayBufSize > 1 ? 1 : 0;
}
function compressor() {

	var threshold            = state.threshold;
	var knee                 = state.knee;
	const linearPregain      = state.linearPregain;
	var linearThreshold      = state.linearThreshold;
	var slope                = state.slope;
	var attackSamplesInv     = state.attackSamplesInv;
	var satReleaseSamplesInv = state.satReleaseSamplesInv;
	var k                    = state.k;
	var kneeDBOffset         = state.kneeDBOffset;
	var linearThresholdKnee  = state.linearThresholdKnee;
	var masterGain           = state.masterGain;
	var a                    = state.a;
	var b                    = state.b;
	var c                    = state.c;
	var d                    = state.d;
	var detectorAvg          = state.detectorAvg;
	var compGain             = state.compGain;
	var maxCompDiffDB        = state.maxCompDiffDB;
	var delayBufSize         = state.delayBufSize;
	var delayWritePos        = state.delayWritePos;
	var delayReadPos         = state.delayReadPos;
	const delayBuf           = state.delayBuf;
    const Ld = delayBuf[0];
    const Rd = delayBuf[1];

    const size = L.length;
	var chunks = size / SF_COMPRESSOR_SPU;
	const ang90 = Math.PI * 0.5;
	const ang90inv = 1 / ang90;

	var spacingdb = SF_COMPRESSOR_SPACINGDB;
    var ch, chi, desiredGain, scaledDesiredGain, compDiffDB, envelopeRate, inputL, inputR, attenuation, rate, attenuationdb, premixGain;
    var samplePos = 0;
	for (ch = 0; ch < chunks; ch++) {
		detectorAvg = fix(detectorAvg, 1);
		desiredGain = detectorAvg;
		scaledDesiredGain = Math.asin(desiredGain) * ang90inv;
		compDiffDB = gain2DB_C(compGain / scaledDesiredGain);

		if (compDiffDB < 0) { 
			compDiffDB = fix(compDiffDB, -1);
			maxCompDiffDB = -1; 
			envelopeRate = dB2Gain_C(SF_COMPRESSOR_SPACINGDB / adaptiveReleaseCurve((clamp(compDiffDB, -12, 0) + 12) * 0.25, a, b, c, d));
		} else { 
			compDiffDB = fix(compDiffDB, 1);
			if (maxCompDiffDB === -1 || maxCompDiffDB < compDiffDB) { maxCompDiffDB = compDiffDB; }
			envelopeRate = 1 - (0.25 / (maxCompDiffDB < 0.5 ? 0.5 : maxCompDiffDB)) ** attackSamplesInv;
		}
		for (chi = 0; chi < SF_COMPRESSOR_SPU; chi++, samplePos++, delayReadPos = (delayReadPos + 1) % delayBufSize, delayWritePos = (delayWritePos + 1) % delayBufSize) {

			inputL = L[samplePos] * linearPregain;
			inputR = R[samplePos] * linearPregain;
            
            
			Ld[delayWritePos] = inputL;
			Rd[delayWritePos] = inputR;

			inputL = abs(inputL);
			inputR = abs(inputR);
			const inputMax = Math.max(inputL, inputR)
            attenuation = inputMax < 0.0001 ? 1 : compCurve(inputMax, k, slope, linearThreshold, linearThresholdKnee, threshold, knee, kneeDBOffset) / inputMax;

			if (attenuation > detectorAvg) { 
				attenuationdb = -gain2DB_C(attenuation);
				if (attenuationdb < 2) { attenuationdb = 2 }
				rate = dB2Gain_C(attenuationdb * satReleaseSamplesInv) - 1;
			} else { rate = 1 }

			detectorAvg += (attenuation - detectorAvg) * rate;
			if (detectorAvg > 1) { detectorAvg = 1 }
			detectorAvg = fix(detectorAvg, 1);

			if (envelopeRate < 1) {
				compGain += (scaledDesiredGain - compGain) * envelopeRate;
			} else { 
				compGain *= envelopeRate;
				if (compGain > 1) { compGain = 1 }
			}
			const gain = masterGain * Math.sin(ang90 * compGain);
			Lu[samplePos] = Ld[delayReadPos] * gain;
			Ru[samplePos] = Rd[delayReadPos] * gain;
		}
	}


	state.detectorAvg   = detectorAvg;
	state.compGain      = compGain;
	state.maxCompDiffDB = maxCompDiffDB;
	state.delayWritePos = delayWritePos;
	state.delayReadPos  = delayReadPos;
}
function setCompressorBuffers(left, right, leftU, rightU, rate) {
    
    L = left;
    R = right;
    Lu = leftU;
    Ru = rightU;
    state.rate = rate;   
}

export {compressor, defaultCompressor, simpleCompressor, advanceCompressor, setCompressorBuffers};