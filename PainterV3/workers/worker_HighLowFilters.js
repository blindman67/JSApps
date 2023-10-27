"use strict";
/* For use with EZWebWorkers.js the use strict above is not needed but there as a matter of standards */
function worker_HighLowFilters() {
    var progressVal = 0;

    function Complex(real = 0, imag = 0) {
        this.real = real;
        this.imag = imag;
    }
    Complex.prototype = {
        copy(){ return new Complex(this.real, this.imag) },
        unit(phase,r,i) { 
            var real = Math.cos(phase); 
            var imag = Math.sin(phase);
            this.real = real * r - imag * i;
            this.imag = real * i + imag * r;
            return this;
        },
        setAs(comp) { this.real = comp.real; this.imag = comp.imag; return this },
        setFrom(arr,idx) { idx *= 2; this.real = arr[idx++]; this.imag = arr[idx]; return this },
        mag2(){ return this.real * this.real + this.imag * this.imag },
        mag() { return Math.sqrt(this.real * this.real + this.imag * this.imag) },
        add(comp) { this.real += comp.real; this.imag += comp.imag; return this },
        sub(comp) { this.real -= comp.real; this.imag -= comp.imag; return this },
        scale(scale) { this.real *= scale; this.imag *= scale; return this },
        
        mult(comp) {
            const real = this.real * comp.real - this.imag * comp.imag;
            const imag = this.real * comp.imag + this.imag * comp.real;
            this.real = real;
            this.imag = imag;
        },
    }
    const workComplex = new Complex(); // working value to avoid creating 
    const workComplex1 = new Complex(); // working value to avoid creating 
    const workComplex2 = new Complex(); // working value to avoid creating 
    const workComplex3 = new Complex(); // working value to avoid creating 
    const workComplex4 = new Complex(); // working value to avoid creating 
    const c1 = workComplex; // alias
    const c2 = workComplex1; // alias
    const c3 = workComplex2; // alias
    const c4 = workComplex3; // alias
    const c5 = workComplex4; // alias
    
    var complex;
    var complexInv;
    
    function setDirect(data, idx, real, imag){
        idx *= 2;
        data[idx++] = real;
        data[idx] = imag;
        
    }
    function setComplex(data, idx, comp){
        idx *= 2;
        data[idx++] = comp.real;
        data[idx] = comp.imag;
    }
    function setCoord(data,x,y,real,imag){
        const idx = (x + y * W) * 2;
        data[idx] = real;
        data[idx + 1] = imag;
    }
    
    var W,H,W2,H2,width, height;
    function imgData2Gray(data){
        W2 = (W = width = data.width) / 2;
        H2 = (H = height = data.height) / 2;
        const len = data.data.length;
        const nd = new Uint8ClampedArray(len/4);
        const d = data.data;
        var i = 0;
        var idx = 0;
        while(i < len){
            nd[i++] = ((d[idx] * d[idx++] + d[idx] * d[idx++] + d[idx] * d[idx++]) / 3) ** 0.5;
            idx ++;
        }
        return nd;
    }


    function filterLow(data, lowPass){
        var x,y;
        lowPass *= lowPass;
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++) {
                const f = (y - W2) ** 2 + (x - H2) ** 2;
                if (f < lowPass){ setCoord(data,x,y,0,0) }
            }
        }        
    }
    function filterHigh(data, highPass){
        var x,y;
        highPass *= highPass;
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++) {
                const f = (y - W2) ** 2 + (x - H2) ** 2;
                if ( f > highPass ) { setCoord(data,x,y,0,0) }
            }
        }
        
    }
    function filter(data, low, high){
        var x,y;
        high *= high;
        low *= low;
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++) {
                const f = (y - W2) ** 2 + (x - H2) ** 2;
                if ( f < low || f > high  ) { setCoord(data,x,y,0,0) }
            }
        }
        
    }
   /* function filter(data, dims, lowPass, highPass) {
        var x,y;
        if (isNaN(lowPass) && !isNaN(highPass)){ filterHigh(data, dims, highPass) }
        else if (!isNaN(lowPass) && isNaN(highPass)) { filterLow(data, dims, lowPass) }
        else {
            lowPass *= lowPass;
            highPass *= highPass;
            for (y = 0; y < H; y++) {
                for (x = 0; x < W; x++) {
                    const f = (y - W2) ** 2 + (x - H2) ** 2;
                    if (f < lowPass || f > highPass) { data[y * H + x] = new Complex() }
                }
            }
        }
    }*/


    function rec(out, start, sig, offset, len, s) {
        if (len === 1) {
            setDirect(out, start, sig[offset], 0);
        } else {
            const len2 = len / 2;
            rec(out, start, sig, offset, len2, 2 * s);
            rec(out, start + len2, sig, offset + s, len2, 2 * s);
            for (var k = 0; k < len2; k++) {
                const idx = start + k;
                const idxN = idx + len2
                const outR = out[idxN * 2];
                const outI = out[idxN * 2 + 1];
                c1.unit(-2 * Math.PI * k / len, outR, outI );
                c4.setAs(c3.setFrom(out,idx));
                setComplex(out, idx, c3.add(c1));
                setComplex(out, idxN, c4.sub(c1));
            }
        }
    }

    function invert(out, inData) {
        var i, len, p;
        invertSig(out, 0, inData, 0, inData.length, 1);
        len = out.length / 2;
        p = 10 ** 2;
        for (i = 0; i < out.length; i+=2) { out[i] = Math.round((out[i] / len) * p) / p }
    }

    function invertSig(out, start, inData, offset, len, s) {
        if (len === 1) {
            out[start * 2] = inData[offset * 2];
            out[start * 2 + 1] = inData[offset * 2 + 1];
        } else {
            const len2 = len / 2;
            invertSig(out, start, inData, offset, len2, 2 * s);
            invertSig(out, start + len2, inData, offset + s, len2, 2 * s);
            for (var k = 0; k < len2; k++) {
                const idx = start + k;
                const idxN = idx + len2;
                const outR = out[idxN * 2];
                const outI = out[idxN * 2 + 1];
                c1.unit(2 * Math.PI * k / len, outR, outI );

                
                c4.setAs(c3.setFrom(out,idx));
                
                setComplex(out, idx, c3.add(c1));
                setComplex(out, idxN, c4.sub(c1));

            }
        }
    }

    const contrast = 9e-3;
    const API = {
        showFreq(imgData, low, high) { return API.filter(imgData,low, high,true,true,false,true) },
        rangePass(imgData, low, high, rgb, alpha) { return API.filter(imgData,low, high,true,rgb, alpha,false) },
        lowPass(imgData, freq, rgb, alpha) { return API.filter(imgData,freq,-1,false,rgb, alpha,false) },
        highPass(imgData, freq, rgb, alpha) { return API.filter(imgData,-1,freq,false, rgb, alpha,false) },
        filter(imgData,low, high, range,rgb, alpha, showFreq){
            var i,logMax,x,y,len,max = 0;
            const p = 10 ** 2;

            const gray = imgData2Gray(imgData);
            complex = new Float64Array(gray.length * 2); 
            
            rec(complex,0,gray,0,gray.length,1);

            if(range){
                filter(complex,low,high);
            }else{
                if(low < 0 && high >= 0){
                    filterHigh(complex,high);
                }else if(low >= 0 && high < 0){
                    filterLow(complex,low);
                }
            }
            if(showFreq){
                for (i = 0; i < complex.length; i+=2) {
                    const mag = complex[i] * complex[i] + complex[i+1] * complex[i+1];
                    if (mag > max) { max = mag }
                }          
                var logMax = Math.log(contrast * Math.sqrt(max) + 1);
                var d = imgData.data;
                for(y = 0; y < H; y ++){
                    for(x = 0; x < W; x ++){
                        var idx = (x + y * W) * 4;
                        const idxC = (x + y * W) * 2;
                        const mag = Math.sqrt(complex[idxC] * complex[idxC] + complex[idxC+1] * complex[idxC+1]);
                        const val = (Math.log(contrast * mag + 1) / logMax) * 255
                        d[idx] = val;
                        d[idx+1] = val;
                        d[idx+2] = val;
                        d[idx+3] = 255;
                    }
                }
                return imgData;
            }
            
            complexInv = new Float64Array(gray.length * 2); 
            invertSig(complexInv, 0, complex, 0, complex.length/ 2, 1);
            len = complexInv.length / 2;
            for (i = 0; i < complexInv.length; i+=2) { 
                complexInv[i] = Math.round((complexInv[i] / len) * p) / p;
            }            

            var d = imgData.data;

            for(y = 0; y < H; y ++){
                for(x = 0; x < W; x ++){
                    var idx = (x + y * W) * 4;
                    const idxC = (x + y * W) * 2;
                    
                    const val = complexInv[idxC];
                    if(rgb){
                        d[idx] = val;
                        d[idx+1] = val;
                        d[idx+2] = val;
                    }
                    if(alpha){
                        d[idx+3] = val;
                    }
                }
            }
            return imgData;                 
        }
    }


    function workerFunction(data){
        var result;

        if(typeof API[data.call] === "function"){
            result = API[data.call](...data.args);
        }
        return result;            
    }
}
localProcessImage.registerWorker(
    worker_HighLowFilters,
    "showFreq",
    "rangePass",
    "lowPass",
    "highPass",
);



