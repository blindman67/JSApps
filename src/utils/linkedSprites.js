import {} from "../code/MathExtensions.js";
import {glUtils} from "../code/glUtils.js";
const DEBUG = true;

export {linkedSprites};

function linkedSprites() {
	var sprSheet;
	var bF32, bI32, stride;
	const bOff_X = 0;
	const bOff_Y = 1;
	const bOff_SX = 2;
	const bOff_SY = 3;
	const bOff_CX = 8;
	const bOff_CY = 9;
	const bOff_R = 10;
	const bOff_Z = 11;
	const bOff_RGBA = 12;
	const TrackTypes = {X: 1, Y: 2, R: 3, SX: 4, SY: 5, Z: 6, CX: 7, CY: 8, FRAME_STEP: 9,};
	const TrackNames = [,"X","Y","R","SX","SY","Z","CX","CY","Frame"];	
	
	const namedSprites = {};
	function Link() {
		this.x = 0;
		this.y = 0;
		this.sx = 1;
		this.sy = 1;
		this.r = 0;		
		this.yAy = this.xAx = 1;
		this.yAx = this.xAy = 0;
		this.py = this.px = 0;		
		this.psy = this.psy = 1;			
		this.pr = 1;		
	}
	Link.prototype = {
		headless() {
			this.link = null;
			this.links = [];
		},
		addLink(sprite) {
			!this.link && (this.link = new Link());
			this.links.push(sprite);
		},	
		addToChain(chain = []){
			if (this.link) {
				for (const sprite of this.links) { sprite.addToChain(chain) }
			}		
			return chain;
		},		
		updateLink(link) {
			link.position(this);
			if (this.link) {
				this.link.fromP(link);
				for (const sprite of this.links) { sprite.updateLink(this.link) }
			}
		},			
		update() {
			this.yAy = this.xAx = Math.cos(this.r);
			this.yAx = -(this.xAy = Math.sin(this.r));
		}, 
		position(obj) {
			const sx = this.psx = this.sx * obj.sx;
			const sy = this.psy = this.sy * obj.sy;
			this.pr = this.r + obj.r;
			this.px = obj.x * this.xAx * sx + obj.y * this.yAx * sy + this.x;
			this.py = obj.x * this.xAy * sx + obj.y * this.yAy * sy + this.y;
		},
		fromS(sprite) {
			this.r = sprite.r;
			this.x = sprite.x;
			this.y = sprite.y;
			this.sx = sprite.sx;
			this.sy = sprite.sy;	
			this.update();			
		},
		fromP(link) {
			this.x = link.px;
			this.y = link.py;
			this.sx = link.psx;
			this.sy = link.psy;
			this.r = link.pr;
			this.update();
		},
	};
	function Key(value, time, curve) { 
		this.value = value;
		this.time = time;
		this.curve = 0;
	}
	function AnimTrack(sprite, type) {
		this.sprite = sprite;
		this.type = type;
		this.time = 0.0;
		this.startTime = 0;
		this.endTime = 0;
		this.timeRange = 1;
		this.valRange = 1;
		this.keyPos = 0;
		this.ready = false;
		this.keys = [];
		if (type === TrackTypes.FRAME_STEP) {
			this.tick = this.tickFrame.bind(this);
		} else {
			this.keyA = null;
			this.keyB = null;		
			this.tick = this.tickTime.bind(this);
		}
		this.setValue = this["set" + TrackNames[type]].bind(this);
	}
	AnimTrack.prototype = {
		setValue(){},
		compile(){
			const fillRange = (a, b, i) => {
				var t;
				for(t = Math.floor(a.time * 60); t < Math.floor(b.time * 60); t++) {
					const p = (t - this.startTime) * 4;
					const frac = (t - Math.floor(a.time * 60)) / (Math.floor(b.time * 60) - Math.floor(a.time * 60));
					const val = (b.values[i] - a.values[i]) * frac + a.values[i];
					buffer[p + i] = val;
				}				
			}
			this.keys.sort((a,b) => a.time - b.time);
			this.endTime = this.keys[this.keys.length - 1].time;
			this.startTime = this.keys[0].time;
			if (this.type === TrackTypes.FRAME_STEP) {
				this.startTime = Math.floor(this.startTime * 60);
				this.endTime = Math.floor(this.endTime * 60);
				const buffer = new Float32Array((this.endTime - this.startTime + 1) * 4);
				let i = 0;
				while (i < 4) {
					var a,b;
					for (const key of this.keys) {
						if (key.value[i] !== undefined) {
							if (!a) {
								a = key;
								if (Math.floor(a.time * 60) > this.startTime) {
									fillRange({values: a.values, time: (this.startTime / 60)}, a, i);
								}
							} else {
								b = key;
								fillRange(a, b, i);
								a = b;
								b = undefined;
							}
						}
					}
					if (Math.floor(a.time * 60) < this.endTime) {
						fillRange(a, {values: a.values, time: (this.endTime + 1) / 60},i);
					}
				}
				this.keys = buffer;
			} else {
				this.keyA = this.keys[this.keyPos++];
				this.keyB = this.keys[(this.keyPos++) % this.keys.length];
				this.valRange = this.keyB.value - this.keyA.value;
			}
			this.keyPos = 0;
			this.ready = true;
			!this.sprite.animTracks && (this.sprite.animTracks = []);
			this.sprite.animTracks.push(this);
		},
		addKey(key) {
			this.keys.push(key);
		},
		tick(){},
		tickFrame(frames) {
			this.keyPos = (this.keyPos + frames) % this.frames;
			this.setValue();
		},
		tickTime(time) {
			this.time += time;
			if(this.time >= this.keyB.time) {
				this.keyA = this.keyB;
				if (this.keyPos >= this.keys.length) {
					this.keyPos = 0;
					this.time -= this.keyB.time;
					this.keyA = this.keys[(this.keyPos ++) % this.keys.length];
				}
				this.keyB = this.keys[(this.keyPos ++) % this.keys.length];
				this.valRange = this.keyB.value - this.keyA.value;
				this.timeRange = this.keyB.time - this.keyA.time;
			}
			this.value = this.valRange * (((this.time - this.keyA.time) / this.timeRange) % 1) + this.keyA.value;
			this.setValue();
		},
		setX() { this.sprite.x = this.value },
		setY() { this.sprite.y = this.value },
		setR() { this.sprite.r = this.value },
		setSX() { this.sprite.sx = this.value },
		setSY() { this.sprite.sy = this.value },
		setZ() { this.sprite.z = this.value },
		setFrame() {
			const s = this.sprite;
			const k = this.keys;
			var i = (this.keyPos ++) * 4;
			s.x = k[i++];
			s.y = k[i++];
			s.r = k[i++];
			s.sy = s.sx = k[i++];
		},
	};
	function Sprite(idx, x, y, cx, cy, sx, sy, r) {
		this.sprImg = sprSheet.sprites[idx];
		this.x = x;
		this.y = y;
		this.w = this.sprImg.W;
		this.h = this.sprImg.H;
		this.cx = cx !== undefined ? cx / this.w : 0.5;
		this.cy = cy !== undefined ? cy / this.h : 0.5;
		this.sx = sx;
		this.sy = sy;
		this.r = r;
		this.RGBA32 = glUtils.toRGBA8Clamp(255,255,255,255);
		this.z = 0;
		this.links = [];
		this.link = null;
		this.bufPos = sprSheet.addSprite(idx, x, y, this.s, this.cx, this.cy, this.r, this.RGBA32, this.z); 	
		this.bufIdx = this.bufPos * stride;
	}
	Sprite.prototype = {
		updateLink(link) {
			if(this.animTracks){
				for(const track of this.animTracks) { track.tick(API.timeStep) }
			}			
			link.position(this);
			const i = this.bufIdx;
			bF32[i] = link.px;
			bF32[i + bOff_Y] = link.py;
			bF32[i + bOff_SX] = link.psx * this.w;
			bF32[i + bOff_SY] = link.psy * this.h;
			bF32[i + bOff_R] = link.pr;				
			if (this.link) {
				this.link.fromP(link);
				for (const sprite of this.links) { sprite.updateLink(this.link) }
			}		
		},
	    update() {
			const i = this.bufIdx;
			if(this.animTracks){
				const x = this.x, y = this.y;
				for(const track of this.animTracks) { track.tick(API.timeStep) }
				this.x = x;
				this.y = y;
			}
			bF32[i] = this.x;
			bF32[i + bOff_Y]  = this.y;
			bF32[i + bOff_SX] = this.sx * this.w;
			bF32[i + bOff_SY] = this.sy * this.h;
			bF32[i + bOff_R]  = this.r;
			if (this.link) {
				this.link.fromS(this);
				for (const sprite of this.links) { sprite.updateLink(this.link) }
			}
		}, 
	    store() {
			const i = this.bufIdx;
			bF32[i] = this.x;
			bF32[i + bOff_Y]  = this.y;
			bF32[i + bOff_SX] = this.sx * this.w;
			bF32[i + bOff_SY] = this.sy * this.h;
			bF32[i + bOff_CX] = this.cx;
			bF32[i + bOff_CY] = this.cy;
			bF32[i + bOff_R]  = this.r;
			bF32[i + bOff_Z]  = this.z;
			bI32[i + bOff_RGBA]  = this.RGBA32;
		}, 		
		fastMove(dx, dy) {
			const i = this.bufIdx;
			bF32[this.bufIdx] += dx;
			bF32[this.bufIdx + bOff_Y] += dy;
		},
		addToChain(chain = [], indent = ""){
			chain.push(this)
			DEBUG && console.log(indent + this.name + " " + this.x + ", "+ this.y);
			if (this.link) {
				DEBUG && (indent += "    ");
				for (const sprite of this.links) { sprite.addToChain(chain, indent) }
			}		
			return chain;
		},
		addLink(sprite) {
			!this.link && (this.link = new Link());
			this.links.push(sprite);
		},
	};
	const API = {
		timeStep: 1 / 60,
		namedSprites,
		namedChains: [],
		Sprite,
		TrackTypes,
		Key,
		getSheetLoc(idx) { return sprSheet.sprites[idx] },
		set sheet(sheet) {
			sprSheet = sheet;
			stride = sheet.stride;
			[bF32, bI32] = sheet.buffers;
		},
		eachInChain(cb, chain) {
			var i = 0;
			for(const sprite of chain) { cb(sprite, i++) }
		},
		createChain(name, fromSprite) {
			API.namedChains[name] = fromSprite.addToChain();
		},
		addAnimTrack(type, sprite) {
			this.tracks === undefined && (this.tracks = []);
			const track = new AnimTrack(sprite,type);
			this.tracks.push(track);
			return track;
		},
		compileAnimations(){
			if(this.tracks) {
				for(const track of this.tracks){
					!track.ready && track.compile();
				}
			}
		},
		addSprite(name, idx, x, y, cx, cy, sx = 1, sy = 1, r = 0) {
			namedSprites[name] = new Sprite(idx, x, y, cx, cy, sx, sy, r);
			DEBUG && (namedSprites[name].name = name);
			return namedSprites[name];
		}
	};
	return API;
	
}