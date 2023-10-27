"use strict";
/* NeuQuant Neural-Net Quantization Algorithm
 * -----------------------------------------------------------------------------------
 *
 * Original copyright notice as required
 *
 *====================================================================================
 * Copyright (c) 1994 Anthony Dekker
 *
 * NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994.
 * See "Kohonen neural networks for optimal colour quantization"
 * in "Network: Computation in Neural Systems" Vol. 5 (1994) pp 351-367.
 * for a discussion of the algorithm.
 * See also  http://members.ozemail.com.au/~dekker/NEUQUANT.HTML
 *
 * Any party obtaining a copy of these files from the author, directly or
 * indirectly, is granted, free of charge, a full and unrestricted irrevocable,
 * world-wide, paid up, royalty-free, nonexclusive right and license to deal
 * in this software and documentation files (the "Software"), including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons who receive
 * copies from any such party to do so, with the only requirement being
 * that this copyright notice remain intact (and amendment (1) below).
 *
 * (1) 2017 Mark Spronck. Rewrite to Javascript ES6 to optimise performance and
 * use ES6.
 *====================================================================================
 *
 *
 */

 /*********************************************************************************
    Re written by Mark Spronck (BM67) to improve performance and bring up to ES6.

	----------------------------------------------------------------------------
    Function
		neuQuant.getColorPalette(imageData, [numberColours, [rangeQuality, [sortResult]]]);
	Arguments
		imageData
			Is the object returned by 2d context getImageData.
			pal = getColourPallet(ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height));
		numberColours
			Optional default = 256. Number of colours. Size of the returned palette
		rangeQuality
		    Optional default = 4. Determins how closely the resulting palette matches
		    the range of colours. This setting does not effect computation time.
		    A value of 0 will create a palette with values that match a wider range
		    of pixels values. A value of 8 (the max value) will will produce a palette
		    that is closer to dominate colours but will result in an image that more
		    closely matches the origials dynamic range.
		sortResult
			Optional default = false. If true the pallet is sorted from darkest to lightest.

    Returns
        This function returns an array of RGB values in the form [[r,g,b],[r,g,b],...
		Values are floored in the range 0-255

    Notes
		I have removed quality setting as the results were very bad for anything
		but the highest quality. To get the same effect as the original quality setting
		scale the image data down with nearest filter, for better result yet still
		reducing the algorithums time use bilinear filter when scaling down the original
		image. Use the function neuQuant.getImagePixels(image, quality)

		When using this to find colours of an animated GIF you need to pass all the
		GIF frames as one image so that it gets a good palette across the animation.
		Getting a palette for individual frames will produce slightly different
		colours per frame resulting in some flickering.

		I have removed many constants to keep overall code size down.

	----------------------------------------------------------------------------
    Function
        neuQuant.getImagePixels(image, [quality])

	Arguments
	    image
	        Image, Canvas, Video, to get pixels from. Note video only gets one frame.
	    quality
	        Optional default = 1. Scales image down to improve performances at the
	        cost of quality. This value gives an approimate performance increase.
	        ie quality 1 no performance increase, 2 half execution time, 4 quater
	        execution time.

	Returns
	    Returns ImageData object containing all or down sampled pixels of image.
	    Down sample uses CanvasRenderingContext2D default smoothing filter and
	    quality settings when down sampling.


	----------------------------------------------------------------------------
	Function
	   neuQuant.applyPaletteToImageData(palette, imageData, [dither, [chunkSize]])

	Arguments
        palette
            palette array as returned by neuQuant.getColorPalette
        imageData
            ImageData object containing pixels to recolour to match colour. Use
            closest spatial colour in RGBs approximation.
        dither
            Optional default = false. If true then a random dither is applied to
            image. This is a very simple dither and I would recogmend finding
            a better method if image size and quality is important.
        chunkSize
            Optional default = 30000. Number of pixels divide by 4 to process
            per blocking code cycle. 30000 is aprox 1/10th second processing
            for 256 colour palette on average laptop.

    Returns
        Returns a Promise. The promise will resolve with the original ImageData
        object containing the modified pixels.

    Note
        The property neuQuant.progress is the percentage progress of the function.


**************************************************************************************/

/* quant worker is a versioin that can be used with EZWebWorkers to process images in a non blocking sepoerate thread */

function quantWorker () {

        // random for dither. A seeded random will keep the dither pattern across animation frames
        const seeded = (() => {
            var seed = 1;
            const m = 2576436549074795;
            return {
                reseed (s) { seed = s },
                random ()  { return (seed = ((8765432352450986 * seed) + 8507698654323524) % m) / m  },
            }
        })();
        function getColorPalette(imageData, numberColours = 256, sortResult = false) {
            const pixels = imageData.data;
            const netSize = numberColours | 0;
            const numCycles = 512;
            const netBiasShift = 4;
            const intBias = (1 << 16);
            const initFreq = intBias / netSize;
            const gammaShift = 10;
            const betaShift = 10;
            const radiusBiasShift = 6;
            const radiusDec = 30;
            const alphaDec = 30;
            const initAlpha = (1 << 10);  // // Note this is nothing to do with the alpha channel
            const radBias = (1 << 8);
            const alphaRadBias = (1 << (10 + 8));
            const primes = [499, 491, 487, 503];  // primes
            const netIntBiasShift = 16 - netBiasShift;
            const beta = (intBias >> betaShift);
            const betaGamma = (intBias << (gammaShift - betaShift));
            const initRadius = ((netSize >> 3) * (1 << radiusBiasShift));
            const sort = (a, b) => (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) - (b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
            var radPower;
            function unBiasNet() {
                for (var i = 0; i < netSize; i++) {
                    palette[i][0] = palette[i][0] >> netBiasShift;
                    palette[i][1] = palette[i][1] >> netBiasShift;
                    palette[i][2] = palette[i][2] >> netBiasShift;
                }
            }
            function alterNeigh(radius, i, r, g, b) {
                var j, k, n, p, a, m;
                const lo = Math.abs(i - radius);
                const hi = Math.min(i + radius, netSize);
                j = i + 1;
                k = i - 1;
                m = 1;
                while ((j < hi) || (k > lo)) {
                    a = radPower[m++];
                    if (j < hi) {
                        p = palette[j++];
                        p[0] -= (a * (p[0] - r)) / alphaRadBias;
                        p[1] -= (a * (p[1] - g)) / alphaRadBias;
                        p[2] -= (a * (p[2] - b)) / alphaRadBias;
                    }
                    if (k > lo) {
                        p = palette[k--];
                        p[0] -= (a * (p[0] - r)) / alphaRadBias;
                        p[1] -= (a * (p[1] - g)) / alphaRadBias;
                        p[2] -= (a * (p[2] - b)) / alphaRadBias;
                    }
                }
            }
            function contest(r, g, b) {
                var bestd, bestBiasd, bestPos, bestBiasPos, i, n, dist, biasDist, betaFreq;
                bestBiasd = bestd = ~(1 << 31);
                bestBiasPos = bestPos = -1;
                r *= r; g *= g; b *= b;
                for (i = 0; i < netSize; i++) {
                    n = palette[i];
                    dist = (((n[0] * n[0] - r) ** 2 + (n[1] * n[1] - g) ** 2 + (n[2] * n[2] - b) ** 2) ** 0.5) ** 0.5 | 0;
                    if (dist < bestd) {
                        bestd = dist;
                        bestPos = i;
                    }
                    biasDist = dist - (bias[i] >> netIntBiasShift);
                    if (biasDist < bestBiasd) {
                        bestBiasd = biasDist;
                        bestBiasPos = i;
                    }
                    betaFreq = freq[i] >> betaShift;
                    freq[i] -= betaFreq;
                    bias[i] += betaFreq << gammaShift;
                }
                freq[bestPos] += beta;
                bias[bestPos] -= betaGamma;
                return bestBiasPos;
            }
            function learn() {
                var b, g, r, j, n, step, ind, i, radSqu;
                var pix = 0;
                const byteCount = pixels.length;
                const pixelCount = (pixels.length / 4);
                const lengthCount = pixelCount * 3;

                const delta = Math.max(1, (pixelCount / numCycles)) | 0;
                var alpha = initAlpha;
                var radius = initRadius;
                var rad = radius >> radiusBiasShift;
                if (rad <= 1) { rad = 2 }
                radPower = new Uint32Array(rad);
                radSqu = rad * rad;
                for (i = 0; i < rad; i++) {
                    radPower[i] = (alpha * (((radSqu - i * i) * radBias) / radSqu)) | 0;
                }
                if (lengthCount < 3 * primes[0]) {  step = 1 }
                else {
                    i = 0;
                    while(i < primes.length && (lengthCount % primes[i++]) === 0);  // << do not remove the ;
                    step = primes[i-1];
                }
                i = 0;
                while (i++ < pixelCount) {
                    ind = (pix << 2) % byteCount;
                    pix = (pix + step) % lengthCount;
                    r = pixels[ind ++] << netBiasShift;
                    g = pixels[ind ++] << netBiasShift;
                    b = pixels[ind]    << netBiasShift;
                    j = contest(r, g, b);
                    n = palette[j];
                    n[0] -= (alpha * (n[0] - r)) / initAlpha;
                    n[1] -= (alpha * (n[1] - g)) / initAlpha;
                    n[2] -= (alpha * (n[2] - b)) / initAlpha;
                    if (rad !== 0) { alterNeigh(rad, j, r, g, b) } // alter neighbours
                    if (i % delta === 0) {
                        alpha -= alpha / alphaDec;
                        radius -= radius / radiusDec;
                        rad = radius >> radiusBiasShift;
                        if (rad <= 1) { rad = 0 }
                        else {
                            radSqu = rad * rad;
                            for (j = 0; j < rad; j ++) {
                                radPower[j] = (alpha * (((radSqu - j * j) * radBias) / (radSqu))) | 0;
                            }
                        }
                    }
                }
            }
            const palette = [];
            const bias = new Int32Array(netSize);
            const freq = new Int32Array(netSize);
            freq.fill(initFreq);
            for (let i = 0; i < netSize; i += 1) {
                const v = (i << (netBiasShift + 8)) / netSize;
                palette[i] = [v, v, v];
            }
            learn();
            unBiasNet();
            if (sortResult) { palette.sort(sort) }
            return palette;
        }
        function getImagePixels(image, quality = 1){
            quality = quality < 1 ? 1 : quality;
            var scaled    = document.createElement("canvas");
            scaled.width  = ((image.naturalWidth  ? image.naturalWidth  : image.width)  / (Math.sqrt(quality))) | 0;
            scaled.height = ((image.naturalHeight ? image.naturalHeight : image.height) / (Math.sqrt(quality))) | 0;
            const ctx = scaled.getContext("2d");
            ctx.drawImage(image, 0, 0, scaled.width, scaled.height);
            return ctx.getImageData(0, 0, scaled.width, scaled.height);
        }
        function applyPaletteToImageData(palette, imageData, randDither = false, chunkSize = 30000){
            function closestPaletteIndex(r, g, b){
                var i = 0;
                var p, distSqr, index, dr, dg, db;
                var minDif = Infinity;
                if(randDither){
                    r += seeded.random() * dither - ditherHalf;
                    g += seeded.random() * dither - ditherHalf;
                    b += seeded.random() * dither - ditherHalf;
                }
                r *= r; g *= g; b *= b;
                for( ; i < workPal.length; i++){
                    p = workPal[i];
                    dr = p[0] - r;
                    dg = p[1] - g;
                    db = p[2] - b;
                    distSqr = dr * dr + dg * dg + db * db;
                    if(distSqr === 0) { return i } // if matching then we found the colour
                    if(distSqr < minDif){
                        minDif = distSqr;
                        index = i;
                    }
                }
                return index;
            }
            function paletteToPhoton(palette){
                var i = 0;
                const palP = [];
                for( ; i < palette.length; i++){
                    palP.push([
                        palette[i][0] * palette[i][0],
                        palette[i][1] * palette[i][1],
                        palette[i][2] * palette[i][2]
                    ]);
                }
                return palP;
            }
            API.progress = 0;
            const dither = (256 / Math.max(2,Math.sqrt(palette.length)));
            const ditherHalf = dither / 2;
            seeded.reseed(imageData.width * imageData.height);
            const workPal = paletteToPhoton(palette);
            const dat = imageData.data;
            var i = 0;
            var nextChunk = 0;
            const doChunk = () => {
                while(i < dat.length && i < nextChunk ){
                    const col = palette[closestPaletteIndex(dat[i], dat[i + 1], dat[i + 2])];
                    dat[i++] = col[0];
                    dat[i++] = col[1];
                    dat[i++] = col[2];
                    i++;
                }
            }
            while(i < dat.length){
                API.progress = i / dat.length;
                nextChunk += chunkSize;
                doChunk();
            }
            API.progress = 1;
            return imageData;
        }
        var progressVal = 0;
        const API = {
            getColorPalette,
            applyPaletteToImageData,
            getImagePixels,
            set progress(value) {
                progressVal = value;
                progressMessage(value);
            },
        };
        const newQuant = API;



    function workerFunction(data){
        var result;
        console.log("A");
        if(typeof newQuant[data.call] === "function"){
            result = newQuant[data.call](...data.args);
        }
        return result;
    }

}
/*
const neuQuant = (function newQuantWorker(){
    // random for dither. A seeded random will keep the dither pattern across animation frames
    const seeded = (() => {
        var seed = 1;
        const m = 2576436549074795;
        return {
            reseed (s) { seed = s },
            random ()  { return (seed = ((8765432352450986 * seed) + 8507698654323524) % m) / m  },
        }
    })();
    function getColorPalette(imageData, numberColours = 256, sortResult = false) {
        console.log("B");
        const pixels = imageData.data;
        const netSize = numberColours | 0;
        const numCycles = 512;
        const netBiasShift = 4;
        const intBias = (1 << 16);
        const gammaShift = 10;
        const betaShift = 10;
        const radiusBiasShift = 6;
        const radiusDec = 30;
        const alphaDec = 30;
        const initAlpha = (1 << 10);  // // Note this is nothing to do with the alpha channel
        const radBias = (1 << 8);
        const alphaRadBias = (1 << (10 + 8));
    	const primes = [499, 491, 487, 503];  // primes
        const netIntBiasShift = 16 - netBiasShift;
        const beta = (intBias >> betaShift);
        const betaGamma = (intBias << (gammaShift - betaShift));
        const initRadius = ((netSize >> 3) * (1 << radiusBiasShift));
    	const sort = (a, b) => (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) - (b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
        var radPower;
        function unBiasNet() {
            for (var i = 0; i < netSize; i++) {
                palette[i][0] = palette[i][0] >> netBiasShift;
                palette[i][1] = palette[i][1] >> netBiasShift;
                palette[i][2] = palette[i][2] >> netBiasShift;
            }
        }
        function alterNeigh(radius, i, r, g, b) {
    		var j, k, n, p, a, m;
            const lo = Math.abs(i - radius);
            const hi = Math.min(i + radius, netSize);
            j = i + 1;
            k = i - 1;
            m = 1;
            while ((j < hi) || (k > lo)) {
                a = radPower[m++];
                if (j < hi) {
                    p = palette[j++];
                    p[0] -= (a * (p[0] - r)) / alphaRadBias;
                    p[1] -= (a * (p[1] - g)) / alphaRadBias;
                    p[2] -= (a * (p[2] - b)) / alphaRadBias;
                }
                if (k > lo) {
                    p = palette[k--];
                    p[0] -= (a * (p[0] - r)) / alphaRadBias;
                    p[1] -= (a * (p[1] - g)) / alphaRadBias;
                    p[2] -= (a * (p[2] - b)) / alphaRadBias;
                }
            }
        }
        function contest(r, g, b) {
            var bestd, bestBiasd, bestPos, bestBiasPos, i, n, dist, biasDist, betaFreq;
            bestBiasd = bestd = ~(1 << 31);
            bestBiasPos = bestPos = -1;
            for (i = 0; i < netSize; i++) {
                n = palette[i];
               // dist = Math.abs(n[0] - r) + Math.abs(n[1] - g) + Math.abs(n[2] - b);
                dist = ((n[0] - r) ** 2 + (n[1] - g) ** 2 + (n[2] - b) ** 2) ** 0.5 | 0;
                if (dist < bestd) {
                    bestd = dist;
                    bestPos = i;
                }
                biasDist = dist - (bias[i] >> netIntBiasShift);
                if (biasDist < bestBiasd) {
                    bestBiasd = biasDist;
                    bestBiasPos = i;
                }
                betaFreq = freq[i] >> betaShift;
                freq[i] -= betaFreq;
                bias[i] += betaFreq << gammaShift;
            }
            freq[bestPos] += beta;
            bias[bestPos] -= betaGamma;
            return bestBiasPos;
        }
        function learn() {
            const byteCount = pixels.length | 0;
            const pixelCount = pixels.length >> 2;
            const lengthCount = pixelCount * 3 | 0;
            const delta = Math.max(1, (pixelCount / numCycles)) | 0;

            var b, g, r, j, n, step, ind, i, radSqu;
            var pix = 0, alpha = initAlpha, radius = initRadius;
            var rad = radius >> radiusBiasShift;
            if (rad <= 1) { rad = 2 }
            radPower = new Uint32Array(rad);
            radSqu = rad * rad;
            for (i = 0; i < rad; i++) {
                radPower[i] = (alpha * (((radSqu - i * i) * radBias) / radSqu)) | 0;
            }
            if (lengthCount < 3 * primes[0]) {  step = 1 }
    		else {
    			i = 0;
    			while (i < primes.length && (lengthCount % primes[i++]) === 0);
    			step = primes[i-1];
    		}
            i = 0;
            while (i++ < pixelCount) {
                ind = (pix << 2) % byteCount;
                pix = (pix + step) % lengthCount;
                r = pixels[ind ++] << netBiasShift;
                g = pixels[ind ++] << netBiasShift;
                b = pixels[ind]    << netBiasShift;
                j = contest(r, g, b);
                n = palette[j];
                n[0] -= (alpha * (n[0] - r)) / initAlpha;
                n[1] -= (alpha * (n[1] - g)) / initAlpha;
                n[2] -= (alpha * (n[2] - b)) / initAlpha;
                if (rad !== 0) { alterNeigh(rad, j, r, g, b) } // alter neighbours
                if (i % delta === 0) {
                    alpha -= alpha / alphaDec;
                    radius -= radius / radiusDec;
                    rad = radius >> radiusBiasShift;
                    if (rad <= 1) { rad = 0 }
                    else {
                        radSqu = rad * rad;
                        for (j = 0; j < rad; j ++) {
                            radPower[j] = (alpha * (((radSqu - j * j) * radBias) / (radSqu))) | 0;
                        }
                    }
                }
            }
        }
    	const palette = [];
    	const bias = new Float64Array(netSize);
    	const freq = new Float64Array(netSize);
    	for (let i = 0; i < netSize; i += 1) {
    		const v = (i << (netBiasShift + 8)) / netSize;
    		palette[i] = [v, v, v];
    		freq[i] = intBias / netSize;
    		bias[i] = 0;
    	}
        learn();
        unBiasNet();
        if (sortResult) { palette.sort(sort) }
        return palette;
    }
    function getImagePixels(image, quality = 1){
        quality = quality < 1 ? 1 : quality;
    	var scaled    = document.createElement("canvas");
    	scaled.width  = ((image.naturalWidth  ? image.naturalWidth  : image.width)  / (Math.sqrt(quality))) | 0;
    	scaled.height = ((image.naturalHeight ? image.naturalHeight : image.height) / (Math.sqrt(quality))) | 0;
    	const ctx = scaled.getContext("2d");
    	ctx.drawImage(image, 0, 0, scaled.width, scaled.height);
    	return ctx.getImageData(0, 0, scaled.width, scaled.height);
    }
    function applyPaletteToImageData(palette, imageData, randDither = false, asLookup = false, chunkSize = 30000){
    	function closestPaletteIndex(r, g, b){
    		var i = 0;
    		var p, distSqr, index, dr, dg, db;
    		var minDif = Infinity;
    		if(randDither){
        		r += seeded.random() * dither - ditherHalf;
        		g += seeded.random() * dither - ditherHalf;
        		b += seeded.random() * dither - ditherHalf;
    		}
    		r *= r; g *= g; b *= b;
    		for( ; i < workPal.length; i++){
    			p = workPal[i];
    			dr = p[0] - r;
    			dg = p[1] - g;
    			db = p[2] - b;
    			distSqr = dr * dr + dg * dg + db * db;
    			if(distSqr === 0) { return i } // if matching then we found the colour
    			if(distSqr < minDif){
    				minDif = distSqr;
    				index = i;
    			}
    		}
    		return index;
        }
    	function paletteToPhoton(palette){
    		var i = 0;
    		const palP = [];
    		for( ; i < palette.length; i++){
    			palP.push([
    				palette[i][0] * palette[i][0],
    				palette[i][1] * palette[i][1],
    				palette[i][2] * palette[i][2]
    			]);
    		}
    		return palP;
    	}
    	API.progress = 0;
    	const dither = (256 / Math.max(2,Math.sqrt(palette.length)));
    	const ditherHalf = dither / 2;
    	seeded.reseed(imageData.width * imageData.height);
    	const workPal = paletteToPhoton(palette);
    	const dat = imageData.data;
        const indexed = lookup ? new Uint8ClampedArray(imageData.width * imageData.height) : undefined;

    	var i = 0;
    	var nextChunk = 0;
    	const doChunk = () => {
        	while(i < dat.length && i < nextChunk ){
        		const col = palette[closestPaletteIndex(dat[i], dat[i + 1], dat[i + 2])];
        		dat[i++] = col[0];
        		dat[i++] = col[1];
        		dat[i++] = col[2];
        		i++;
        	}
    	}
    	const doChunkLookup = () => {
        	while(i < dat.length && i < nextChunk ){
        		indexed[i / 4] = closestPaletteIndex(dat[i], dat[i + 1], dat[i + 2]);
        	}
    	}
    	return new Promise((resolve)=>{
    	    const doNextChunk = ()=>{
    	        API.progress = i / dat.length;
    	        nextChunk += chunkSize;
                if (asLookup) { doChunkLookup() }
                else { doChunk() }
        	    if(i >= dat.length){
        	        API.progress = 1;

        	        resolve(lookup ? indexed : imageData)
        	    }else{
        	        setTimeout(doNextChunk,1);
        	    }
    	    }
            setTimeout(doNextChunk,1);
    	});
    }
    const API = {
        getColorPalette,
        applyPaletteToImageData,
        getImagePixels,
        progress : 0,
    };
    return API;
})();*/
