import {} from "../code/MathExtensions.jsm";


function Block(sprIdx) {
	this.sprIdx = sprIdx;
	this.links = [];
	
	
	
}
var refSprites;
	
function structure(sprIdx, x, y, r = 0, xx = 0, yy = 0, scaleX = 1, scaleY = 1, ofx = 0.5, ofy = 0.5, rotate = 0, color = 0xFFFFFFFF, z = 0) {

	const API = {
		spriteReference(sprites) { refSprites = sprites },
		links: [],
		x,y,r,
		desc: {sprIdx, x: xx, y: yy, scaleX, scaleY, ofx, ofy, rotate, color, z},
		add(sprIdx, x, y, r = 0, xx = 0, yy = 0, scaleX = 1, scaleY = 1, ofx = 0.5, ofy = 0.5, rotate = 0, color = 0xFFFFFFFF, z = 0) {
			var block;
			sprIdx %= refSprites.length;
			const sprT = refSprites[API.desc.sprIdx];
			const spr = refSprites[sprIdx];

			const xAdd = scaleX * spr.W * Math.cos(rotate) * ofx +
			             API.desc.scaleX * sprT.W * Math.cos(API.desc.rotate) * API.desc.ofx;
			
			const yAdd = scaleY * spr.H * Math.sin(rotate) * ofy +
			             API.desc.scaleY * sprT.H * Math.sin(API.desc.rotate) * API.desc.ofy;
			
			const xdx = Math.cos(r);
			const xdy = Math.sin(r);
			x += this.x + xAdd * xdx - yAdd * xdy;
			y += this.y + xAdd * xdy + yAdd * xdx;		
	
			API.links.push(block = structure(sprIdx, x, y, r, xx, yy, scaleX, scaleY, ofx, ofy, rotate, color, z));
			return block;
		}
		
		
		
	};
	
	return API;
}

function mapBuilder(map) {
	const l = {}, r = {}, t = {}, b = {};
	const f = map.tiles.fixer;
	
	map.eachRect((val, idx, ix, iy, x, y, mFX, ) => {
		map.getTile(x-1,y,l);
		map.getTile(x+1,y,r);
		map.getTile(x,y-1,t);
		map.getTile(x,y+1,b);		
		if(f[val] && f[val][0] !== "") {
			var i = 0;
			for(const fix of f[val]) {
				if(i > 0) {
					if(
						fix[0](l.tile) && 
						fix[1](t.tile) && 
						fix[2](r.tile) && 
						fix[3](b.tile) ) {

							return Math.randItem(fix[4]);
					}
				}
				i++;
			}
		}
		return -1;
	});
	
}


export {
	structure,
	mapBuilder,
};