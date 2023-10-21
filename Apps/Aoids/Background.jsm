import {} from "../../src/utils/MathExtensions.jsm";
import {$} from "../../src/DOM/geeQry.jsm";
import {Aoids} from "./Aoids.jsm";
import {data} from "./data.jsm";

export {Background};
function sortShaderBuffer(shader) {
	const ps = [];
	const buf = shader.getBuffer(0);
	const ofs = shader.offsets;
	var j = 0;
	while (j < buf.length) { ps.push({idx: j, z: buf.data[(j++) * ofs.stride + ofs.z]}) }
	const b = buf.data, bI = buf.UI32;
	const temp = [0,0,0,0,0];
	ps.sort((a,b) => b.z - a.z);
	j = 0;
	while(j < ps.length) {
		const p = ps[j];
		const idxA = j * ofs.stride;
		const idxB = p.idx * ofs.stride;
		if(idxA !== idxB) {
			temp[0] = b[idxA];
			temp[1] = b[idxA+1];
			temp[2] = b[idxA+2];
			temp[3] = b[idxA+3];
			temp[4] = bI[idxA+4];
			b[idxA]    = b[idxB];
			b[idxA+1]  = b[idxB+1];
			b[idxA+2]  = b[idxB+2];
			b[idxA+3]  = b[idxB+3];
			bI[idxA+4] = bI[idxB+4];
			b[idxB]    = temp[0];
			b[idxB+1]  = temp[1];
			b[idxB+2]  = temp[2];
			b[idxB+3]  = temp[3];
			bI[idxB+4] = temp[4];
		}
		j++;
	}
}
function Background(pointShader, colorShader, hyperShader, seed, skyImage) {
	const width = data.playfield.width;
	const height = data.playfield.height;
	const diagonal = (width * width + height * height) ** 0.5;
	const mapSize = width * height;
	const colors = data.background.colors;
	var nebularAlpha = 0.2;
    var inHyperSpace = false, hyperSpeed = 0, hyperDirection = 0;

	function addPoints() {
		pointShader.clear();
		Math.randSeed(seed);
		const point = pointShader.defaultPoint;
		var sScale = data.playfield.scale;
		var mSize = data.background.minSize;
		var MSizeRange = data.background.maxSize - mSize;
		var mZIndex = data.background.minZIndex;
		var MZIndex = data.background.maxZIndex;
		var j = data.background.numPoints;
		while (j--) {
			point.x = Math.randSI(0, width * sScale) - width * sScale / 2;
			point.y = Math.randSI(0, height * sScale) - height * sScale / 2;
			const d = Math.randS(0,1) ** (1 / 3);
			point.z = d * (MZIndex - mZIndex) + mZIndex;
			point.s = Math.randS(0, 1) ** 3 * (1 - point.z) * MSizeRange + mSize;
			point.color = 0xFF000000 + (Math.randSI(90,255) << 16) + (Math.randSI(90,255) << 8) + (Math.randSI(90,255));
			pointShader.add(point);
		}
		sortShaderBuffer(pointShader);
        hyperShader.setBuffer(0, pointShader.getBuffer(0));
		colorShader.clear();
		Math.randSeed(seed);
		mSize = data.background.minColorSize;
		var MSize = data.background.maxColorSize;
	    mZIndex = data.background.minColorZIndex;
		MZIndex = data.background.maxColorZIndex;
		const colors = data.background.nebularColors;
		j = data.background.numColorPoints;
		while (j--) {
			point.x = Math.randSI(0, width * sScale) - width * sScale / 2;
			point.y = Math.randSI(0, height * sScale) - height * sScale / 2;
			const d = Math.randS(0,1);
			point.z = d * (MZIndex - mZIndex) + mZIndex;
			point.s = MSize - point.z * (MSize-mSize);
			point.color = colors[j % colors.length];
			colorShader.add(point);
		}
		sortShaderBuffer(colorShader);
	}
	const flash = {r:0,g:0,b:0, u: 0, step: 0};

	function SkyMap(imgData) {
		this.U32 = new Uint32Array(imgData.data.buffer);
		this.UC32 = new Uint32Array(4);
		this.UC8 = new Uint8Array(this.UC32.buffer);
		this.w1 = (this.width = imgData.width) - 1;
		this.h1 = (this.height = imgData.height) - 1;
	}
	SkyMap.prototype = {
		getBG(view, resRGBA = {}) {
			const o = view.origin, w = this.width, h = this.height, B = this.UC8;
			var idx, idx1, x,   rA, gA, bA, rB, gB, bB;
			const dist = ((o.x * o.x + o.y * o.y) ** 0.5 / (diagonal / 2)) * w;
			x = dist < 13 ? 13 : dist > w - 2 ? w - 2 : dist;
			const xx = x | 0;
			idx = xx;
			idx1 = xx + 1;
			this.UC32[0] = this.U32[idx];
			this.UC32[1] = this.U32[idx1];
			x %= 1;
			resRGBA.r = (B[0] + x * (B[4] - B[0])) / 255;
			resRGBA.g = (B[1] + x * (B[5] - B[1])) / 255;
			resRGBA.b = (B[2] + x * (B[6] - B[2])) / 255;
			const t = (Math.sin(Aoids.time * (6.28 / 50000))  + 1) * 2;
			nebularAlpha = ((Math.sin(resRGBA.r * Math.PI * (5 + t)) + Math.sin(resRGBA.g * Math.PI * (7 + t)) + Math.sin(resRGBA.b * Math.PI * (11 + t)) + 3) / 16);
			if (flash.u > 0) {
				const u = flash.u ** 2;
				flash.u -= flash.step;
				resRGBA.r += flash.r * u;
				resRGBA.g += flash.g * u;
				resRGBA.b += flash.b * u;
			}
			return resRGBA;
		},
	}
	const API = {
        get inHyperSpace() { return inHyperSpace },
		populate(newSeed = seed) { addPoints() },
		flashColor(r, g, b, step){
			flash.r = r;
			flash.g = g;
			flash.b = b;
			flash.step = step;
			flash.u = 1;
		},
        hyperSpace(speed, dir) {
            inHyperSpace = true;
            hyperShader.hyperSpeed = hyperSpeed = speed;
            hyperShader.hyperDirection = hyperDirection = dir;
        },
        normalSpace() { inHyperSpace = false },
		draw(renderer, view) {
			renderer.backgroundColor = API.skyMap.getBG(view, renderer.backgroundColor);
			colorShader.alpha = nebularAlpha;
            var starShader = inHyperSpace ? hyperShader : pointShader;
            renderer.clear();
            renderer.depthModes.off();
            renderer.blendModes.lighten();
            colorShader.use(view) && colorShader.draw();
            starShader.use(view) && starShader.draw(0, Math.min(1, view.zoom * 2));
		},
		skyMap(img) {
			const ctx = $("canvas", {width: img.width, height: img.height}).getContext("2d");
			ctx.drawImage(img, 0, 0);
			API.skyMap = new SkyMap(ctx.getImageData(0,0,img.width, img.height));
		},
	};
	API.skyMap(skyImage);
	skyImage = undefined;
	return API;
}