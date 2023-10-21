export {SpriteSheet};


function SpriteSheet(url) {
	const sheets = {};
	var currentSheet, currentSize;
	var W, H;
	


	const API = {
		get URL() { return url },
		set URL(v) { url = v },
		get sheet() {
			const sheet = currentSheet;
			const size = currentSize;
			if(sheet && size) {
				const API = {
					isSpriteSheet: true,
					getSize(s = {}) {
						s.w = size.w;
						s.h = size.h;
						return s;
					},
					locateSprite(idx, loc = {}) {
						loc.x = sheet.x + (idx % size.stride) * size.w;
						loc.y = sheet.y + (idx / size.stride | 0) * size.h;		
						return loc;
					}
				}
				return API;
			}
		},
		defineSheet(sheetName,x, y, w, h) {
			currentSheet = sheets[sheetName] = {x, y, w, h, sizes: {}};
			return this;
		},
		defineSize(sizeName, w, h) {
			currentSize = currentSheet.sizes[sizeName] = {w, h, stride: (currentSheet.w / w) | 0};
			return this;
		},
		getSize(sizeName, size = {}) {
			currentSize = currentSheet.sizes[sizeName];
			if (currentSize) {
				size.w = currentSize.w;
				size.h = currentSize.h;
			}
			return size;
		},
		locateSprite(sizeName, idx, loc = {}) {
			currentSize = currentSheet.sizes[sizeName];
			if (currentSize) {
				loc.x = currentSheet.x + (idx % currentSize.stride) * currentSize.w;
				loc.y = currentSheet.y + (idx / currentSize.stride | 0) * currentSize.h;				
			}
			return loc;
		}
		
	};
	return API;
}

