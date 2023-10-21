
function displayNumber(digits, sprIdx, sheet, playfield) {
	
	const COLOR = 0xFF0000FF;
	const COLOR1 = 0xFF00FFFF;
	const sprites = [...digits];
	var bufPos;
	const spr = sheet.spriteRef;
	var xx = 0, yy = 0, i = sprites.length;
	var realValue;
	while (i--) {
		const d = digits[i];
		let sIdx = sprIdx;
		if(d === ",") { sIdx += 10 }
		if (bufPos === undefined) {
			bufPos = sheet.addSprite(sIdx, xx, yy, 0.5, 0, 0, 0, 0, 0.1); // (sprIdx, x, y, scale, offsetX, offsetY, rotate, colorInt32, zIdx) {
			bufPos = sheet.addSprite(sIdx + 10, xx, yy, 0.5, 0, 0, 0, 0, 0.1); // (sprIdx, x, y, scale, offsetX, offsetY, rotate, colorInt32, zIdx) {
		} else {			
			sheet.addSprite(sIdx, xx, yy, 0.5, 0, 0, 0, 0, 0.1);
			sheet.addSprite(sIdx + 10, xx, yy, 0.5, 0, 0, 0, 0, 0.1);
		}
		xx -= spr[sIdx]. w * 1.2 * 0.5;
	}
	sheet.lockBuffered();
	const [bF32, bI32, bI8] = sheet.buffers;
	const stride = sheet.stride;
	const baseCC = "0".charCodeAt(0);
			
			
    const API = {
		update(val, x, y) {
			if(realValue === undefined) {
				realValue = val;
			} else {
				realValue += (val - realValue) * 0.1
			}
			val = ("" + Math.round(realValue)).padStart(digits.length, " ");
			var i = sprites.length, ig = i - 1, bp = bufPos, xx, yy
			xx = playfield.topRight.x - x * playfield.invScale;
			yy = playfield.topRight.y + y * playfield.invScale;
			while (i --) {
				const c = sprites[i];
				const cv = val[ig];
				if(cv !== " ") {
					const sIdx = sprIdx + (c !== "," ?  cv.charCodeAt(0) - baseCC : 10);
					ig -= c !== "," ? 1 : 0;
					xx -= (spr[sIdx].w * 0.5 - 2) *  playfield.invScale;
					const bp1 = bp + stride;
					bF32[bp1] = bF32[bp] = xx;
					bF32[bp1 + 1] = bF32[bp + 1] = yy;
					bF32[bp1 + 3] = bF32[bp1 + 2] = bF32[bp + 3] = bF32[bp + 2] = playfield.invScale * 0.5;
					bI32[bp1 + 8] = COLOR1; 
					bI32[bp + 8] = COLOR;
					bI32[bp1 + 9] = (bI32[bp + 9] = sIdx) + 11;
					
				} else {
					bI32[bp + 8 + stride] = bI32[bp + 8] = 0;
				}
				bp += stride + stride;
			}
		}
	};
	return API;
}

export {displayNumber};