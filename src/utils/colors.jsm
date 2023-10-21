/* 
  Performance NOTE
  
  This module is written for speed (hence repeated code) but is not intended for heavy use inside performant loops. Rather use it to build color lookup tables and use them in performant code
  
*/


const clipTri = (x, phase, amp, dcOff) => { 
	x = 3 * Math.abs(2 * (x + phase / 3 - (x + (phase + 1.5) / 3 | 0))) - 1.5;
	return ((x < -0.5 ? -0.5 : x > 0.5 ? 0.5 : x) * amp + dcOff) * 255 | 0;
}      
const clipTriDouble = (x, phase, amp, dcOff) => { 
	x = 3 * Math.abs(2 * (x + phase / 3 - (x + (phase + 1.5) / 3 | 0))) - 1.5;
	return (x < -0.5 ? -0.5 : x > 0.5 ? 0.5 : x) * amp + dcOff;
}  
const sortColorStop = (a, b) => a.pos - b.pos;
const UInt32 = new Uint32Array(4);
const UChar = new Uint8Array(UInt32.buffer);
const UCharClamped = new Uint8ClampedArray(UInt32.buffer);


function ColorGradient() {
	this.stops = [];	
}
ColorGradient.prototype = {
	addStopRGBA(pos, rgba) { this.stops.push({pos, rgba: colors.RGBAToLRGBA(rgba)}); return this },
	addStopHSLA(pos, hsla) { this.stops.push({pos, rgba: colors.RGBAToLRGBA(colors.HSLAToRGBA(hsla))}); return this },
	asUInt32Array(length, clamp = true) {
		var i = 0;
		const l1 = length - 1, c = wRGBA1;
		const array = new Uint32Array(length);
		this.stops.sort(sortColorStop);
		const start = this.stops[0].pos;
		const range = this.stops[this.stops.length - 1].pos - start;
		var idx = 0;
		var A = this.stops[idx++];
		var B = this.stops[idx++];
		while (i < length) {
			const pos = i / l1;
			if (pos > B.pos) {
				A = B
				B = this.stops[idx++];
			}
			const subPos = (pos - A.pos) / (B.pos - A.pos);
			c.r = (B.rgba.r - A.rgba.r) * subPos + A.rgba.r;
			c.g = (B.rgba.g - A.rgba.g) * subPos + A.rgba.g;
			c.b = (B.rgba.b - A.rgba.b) * subPos + A.rgba.b;
			c.a = (B.rgba.a - A.rgba.a) * subPos + A.rgba.a;
			array[i++] = clamp ? colors.RGBAToUInt32Clamp(colors.LRGBAToRGBA(c, c)) : colors.RGBAToUInt32(colors.LRGBAToRGBA(c, c));
		}
		return array;
	},
}

const colors = {
	get HSLA() { return {h: 0, s: 100, l: 50, a: 1} },
	get RGBA() { return {r: 255, g: 0, b:  0, a: 1} },
	get Gradient() { return new ColorGradient() },
    HSLAToRGBA(hsla, rgba = colors.RGBA) { 
        const hue = (hsla.h % 360) / 360; 
        const lum = ((hsla.l / 100) - 0.5) * 2;
        var scale = (1 - Math.abs(lum));
        const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
        scale *= (hsla.s / 100);
        rgba.r = clipTri(hue, 1.5, scale, offset);
        rgba.g = clipTri(hue, 3.5, scale, offset);
        rgba.b = clipTri(hue, 5.5, scale, offset);
        rgba.a =  1;
        return rgba;
	},		
    HSLAToUInt32(hsla) { 
        const lum = ((hsla.l / 100) - 0.5) * 2;
        var scale = (1 - Math.abs(lum));
        const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
        const hue = (hsla.h % 360) / 360; 
        scale *= (hsla.s / 100);
		UChar[0] = clipTri(hue, 1.5, scale, offset);
		UChar[1] = clipTri(hue, 3.5, scale, offset);
		UChar[2] = clipTri(hue, 5.5, scale, offset);
		UChar[3] = rgba.a * 255;
		return UInt32[0];			
    },
    HSLAToFloat(hsla, array = new Float32Array(4)) { 
        const lum = ((hsla.l / 100) - 0.5) * 2;
        var scale = (1 - Math.abs(lum));
        const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
        const hue = (hsla.h % 360) / 360; 
        scale *= (hsla.s / 100);
		array[0] = clipTriDouble(hue, 1.5, scale, offset);        
		array[1] = clipTriDouble(hue, 3.5, scale, offset);   
		array[2] = clipTriDouble(hue, 5.5, scale, offset);  
		array[3] = hsla.a;
    },	
	RGBAToFloat(RGBA, array = new Float32Array(4)) {
		array[0] = RGBA.r / 255;
		array[1] = RGBA.g / 255;
		array[2] = RGBA.b / 255;
		array[3] = RGBA.a;
		return array;
	},
    RGBAToUInt32Clamp(rgba) { 
		UCharClamped[0] = rgba.r;
		UCharClamped[1] = rgba.g;
		UCharClamped[2] = rgba.b;
		UCharClamped[3] = rgba.a * 255;
		return UInt32[0];
	},
    RGBAToUInt32(rgba) { 
		UChar[0] = rgba.r;
		UChar[1] = rgba.g;
		UChar[2] = rgba.b;
		UChar[3] = rgba.a * 255;
		return UInt32[0];
	},
    RGBAToHSLA(rgba, hsla = colors.HSLA) {
        var minC, maxC, dif, h, l, s,min, max, r, g, b;
        hsla.a = rgba.a;
        r = rgb.r / 255;
        g = rgb.g / 255;
        b = rgb.b / 255;
        min = Math.min(r, g, b);
        max = Math.max(r, g, b);
        if(min === max){  // no colour so early exit
            hsl.h = 0;
            hsl.s = 0;
            hsl.l = min * 100 | 0;
            return hsl;
        }
        dif = max - min;
        l = (max + min) / 2;
        if (l > 0.5) { s = dif / (2 - max - min) }
        else { s = dif / (max + min) }
        if (max === r) {
            if (g < b) { h = (g - b) / dif + 6.0 }
            else { h = (g - b) / dif }
        } else if (max === g) { h = (b - r) / dif + 2.0 }
        else { h = (r - g) / dif + 4.0 }
        hsl.h = (h *  60 + 0.5);
        hsl.s = (s * 100 + 0.5);      
        hsl.l = (l * 100 + 0.5);
        return hsla;
    },  
	RGBAToLRGBA(rgba, lrgba = colors.RGBA) {
		lrgba.r = rgba.r * rgba.r;
		lrgba.g = rgba.g * rgba.g;
		lrgba.b = rgba.b * rgba.b;
		lrgba.a = rgba.a;
		return lrgba;
	},
	LRGBAToRGBA(lrgba, rgba = colors.RGBA) {
		rgba.r = lrgba.r ** 0.5;
		rgba.g = lrgba.g ** 0.5;
		rgba.b = lrgba.b ** 0.5;
		rgba.a = lrgba.a;
		return rgba;
	},
	createRGBA(r, g, b, a = 1) {
		const rgba = colors.RGBA;
		rgba.r = r;
		rgba.g = g;
		rgba.b = b;
		rgba.a = a;
		return rgba;
	},

}

export {colors};
const wRGBA1 = colors.RGBA;