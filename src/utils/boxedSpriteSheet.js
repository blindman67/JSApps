import {$} from "../DOM/geeQry.js";

function getSprite(px, idx, stride) {
	var w = 0, h = 0, xx, yy;
	var x = idx % stride;
	var y = idx / stride | 0;	
	while (px[idx + w] && x + w < stride) { w ++ }
	while (px[idx + h * stride]) { h ++ }	
	for(yy = 0; yy < h; yy ++) {
		for(xx = 0; xx < w; xx ++) { px[x + xx + (y + yy) * stride] = 0 }
	}
	x += 1;
	y += 1;
	w -= 2;
	h -= 2;	
	return {x, y, w, h, d: (w * w + h * h) ** 0.5};
}		
function boxedSpriteSheet(media) {
	const w = media.naturalWidth, h = media.naturalHeight
	const can = $("canvas", {width: w, height: h});
	const ctx = can.getContext("2d");
	ctx.drawImage(media, 0, 0);
	const sprites = [];	
	const imgData = ctx.getImageData(0, 0, w, h);
	const px = new Uint32Array(imgData.data.buffer);
	var idx = 0;
	while (idx < px.length) {
		if (px[idx]) {
			const spr = getSprite(px, idx, w);
			sprites.push(spr);
			ctx.clearRect(spr.x - 1, spr.y - 1, spr.w + 2, 1);
			ctx.clearRect(spr.x - 1, spr.y - 1, 1, spr.h + 2);
			ctx.clearRect(spr.x + spr.w , spr.y, 1, spr.h);
			ctx.clearRect(spr.x, spr.y + spr.h , spr.w, 1);
			idx += spr.w;
		}
		idx ++;
	}
	can.ctx = ctx;
	can.sprites = sprites;
	return can;
}
	
export {boxedSpriteSheet};
	