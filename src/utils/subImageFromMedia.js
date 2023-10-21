import {$} from "../DOM/geeQry.jsm";
	
function subImageFromMedia(media, {
		width = media.naturalWidth,
		height = media.naturalHeight,
		offsetX = 0,
		offsetY = 0,
		tileX = 0,
		tileY = 0,
	}) {
	const can = $("canvas", {width, height});
	can.ctx = can.getContext("2d");
	can.ctx.drawImage(media, -(offsetX + tileX * width), -(offsetY + tileY * height));
	return can;
}
	
export {subImageFromMedia};
	