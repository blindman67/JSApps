import {$} from "../DOM/geeQry.js";


const subSpriteHeader = [...[..."0PV30SUB0SPR"].map(c => c === "0" ? 0xFF : c.charCodeAt(0))].reverse();
const subSpriteGridHeader = [...[..."0PV30GRD0SPR"].map(c => c === "0" ? 0xFF : c.charCodeAt(0))].reverse();
function decodeSprites(image) {
	var dat, i, p;
	const w = image.width, h = image.height;
	const checkSpriteHeader = (header, data) => { var i = 0; while(i < header.length && header[i] === data[i]) { i ++ }; return i === header.length };
	const readInt = pos => { pos --; return (dat[pos--] << 16) | (dat[pos--] << 8) | dat[pos--] }
	const readInt16 = pos => (dat[pos-2] << 8) | dat[pos-3];
	const readId = pos => (dat[pos-1] << 8) | dat[pos-5];
	const data = image.ctx.getImageData(w - (subSpriteHeader.length / 4), h - 1, subSpriteHeader.length / 4, 1);
	if (checkSpriteHeader(subSpriteGridHeader, data.data)) { image.is_grid_Sprites = true }
	if (image.is_grid_Sprites || checkSpriteHeader(subSpriteHeader, data.data)) {
		image.is_sprites = true;
		dat = image.ctx.getImageData(w - (subSpriteHeader.length / 4) - 1, h - 1, 1, 1).data;
		const subSpriteCount = readInt(3) / 16;
		const dh = image.sprite_data_rows = Math.ceil((subSpriteHeader.length + subSpriteCount * 4 + 1) / w);
		dat = image.ctx.getImageData(0,h - dh, w, dh).data;
		p = dat.length - (subSpriteHeader.length + 4) - 1;
		i = 0;
		const sprArr = [];
		while(i < subSpriteCount) {
			sprArr.push({
				id : readId(p),
				x : readInt16(p),
				y : readInt16(p-4),
				w : readInt16(p-8),
				h : readInt16(p-12),
			});
			p -= 16;
			i ++;
		}
		image.sprites = sprArr;			
	}
}

function doesSpriteOverlap(sprites, x, y, w, h) {
	const right = x + w;
	const bot = y + h;
	for (const spr of sprites) {
		if (!(x > spr.x + spr.w || right < spr.x || y > spr.y + spr.h || bot < spr.y)) {
			return true;
		}
	}
	return false;
		
}
function addSpriteToSheet(sheet, image) {
	var locating = true;
	const w = image.width, h = image.height;
	var x = 0, y = 0;
	while (y < sheet.height - h) {
		x = 0;
		while (x < sheet.width - w) {
			if (!doesSpriteOverlap(sheet.sprites, x, y, w, h)) {
				const spr = {x, y, w, h};
				sheet.sprites.push(spr);
				sheet.namedSprites[image.spriteName] = spr;
				sheet.ctx.drawImage(image, x, y);
				return;
			}
		}
	}
	throw new Error("Could not fit sprites to sheet");
}
	

function createSpriteSheet(width, height) {
	const sheet = $("canvas", {width, height});
	sheet.ctx = sheet.getContext("2d");
	sheet.sprites = [];
	sheet.namedSprites = {};
	return sheet;
	
}
	


		
var loadCount = 0;
var spriteLoadingCount = 0;
var mediaCount = 0;
var spriteCount = 0;
var loadComplete;
var spriteLoadComplete;
const named = {};
function checkComplete() {
	if (loadCount === 0 && loadComplete) { 
		setTimeout(loadComplete, 0);
		loadComplete = undefined;
		return true;
	}	
}
function checkSpritesComplete() {
	if (spriteLoadingCount === 0 && spriteLoadComplete) { 
		setTimeout(spriteLoadComplete, 0);
		spriteLoadComplete = undefined;
		return true;
	}	
}
const media = {
	get progress() { return mediaCount > 0 ? (1 - (loadCount / mediaCount)) * 100 | 0 : 0 },
	get spriteProgress() { return spriteCount > 0 ? (1 - (spriteLoadingCount / spriteCount)) * 100 | 0 : 0 },
	getByName(name) { return named[name] },
	set oncomplete(callback) { loadComplete = callback },
	set onspritescomplete(callback) { spriteLoadComplete = callback },
	loadImages(nameURLpairs) {
		return Promise.all(nameURLpairs.map(pair => media.loadImage(...pair)));
	},
	loadImage(name, url) { // if name is falsy then image will not be added to named store
		return new Promise((load, error) => {
			const image = new Image;
			image.src = url;
			(!name || !named[name]) && (mediaCount += 1);
			loadCount += 1;
			image.addEventListener("load", () => {
					!name ? mediaCount -= 1 : named[name] = image; 
					loadCount -= 1; 
					load(image);
					checkComplete();
				}, {once: true}
			);
			image.addEventListener("error", () => {
					loadCount -= 1;
					!name && (mediaCount -= 1);
					error(new Error("Media '" + (!name ? url : name)  + "' failed to load!"));
					checkComplete();
				}, {once: true}
			);
		})
	},
	spriteSheet(name, width, height) {
		return new Promise(done => {
			const sheet = createSpriteSheet(width, height)
			named[name] = sheet;
			done(sheet);
		});
	},
	addSpritesToSheet(sheetName, sCount, imageUrls) {
		const sheet = named[sheetName];
		if (!sheet.loadingSprites) {
			sheet.loadingSprites = true;
			spriteCount += imageUrls.length;
			spriteLoadingCount += imageUrls.length;
		}
		var count = sCount;
		while(count-- && image.length) {
			const url = images.pop()
			media.loadImage(undefined, url + ".png")
				.then(image => {
					if(imageUrls.length) { 
						media.addSpritesToSheet(sheetName, 1, imageUrls) 
						image.spriteName = url;
						addSpriteToSheet(sheet, image);
						spriteLoadingCount -= 1;
					} else {
						image.spriteName = url;
						addSpriteToSheet(sheet, image);		
						spriteLoadingCount  -= 1;						
						if (checkSpritesComplete()) {
							sheet.spritesToLoad = undefined;
						}
					}
				});
		}
		
		
	},
	remove(name) {
		if (named[name]) {
			mediaCount -= 1;
			named[name] = undefined;
		}
	},
};
export {media}