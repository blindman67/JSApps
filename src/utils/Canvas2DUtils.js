import {} from "./MathExtensions.js";
const ROT_ORIGINS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const ROT_AXIS = [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]];
const Canvas2DUtils = {
	mirror(ctx, x, y) {
		ctx.setTransform(x ? -1 : 1, 0, 0, y ? -1 : 1, x ? ctx.canvas.width : 0,  y ? ctx.canvas.height : 0);
		ctx.globalCompositeOperation = "copy";
		ctx.drawImage(ctx.canvas, 0, 0);
		ctx.globalCompositeOperation = "source-over";
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	},
	rotateAA(ctx, ang) { // in steps of 90 deg
		ang = (ang % 4 + 4) % 4;
		const a = ROT_AXIS[ang];
		const o = ROT_ORIGINS[ang];
		ctx.setTransform(a[0], a[1], a[2], a[3], o[0] * ctx.canvas.width, o[1] *  ctx.canvas.height);
		ctx.globalCompositeOperation = "copy";
		ctx.drawImage(ctx.canvas, 0, 0);
		ctx.globalCompositeOperation = "source-over";
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

};
export {Canvas2DUtils};