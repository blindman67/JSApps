import {glUtils} from "../../src/webGL/glUtils.jsm";

function rocks(game) {
	const HIDE_COL = 0;
	const GOLD_COL = 0xFF00FFFF;
	const HIGHLIGHT_COL = 0xFF000000;
	const ROCK_SPR_IDX = 22;
	const START_SPEED = 0.5;
	const START_ROT = 0.1;
	const START_DAMAGE = 15;
	const GOLD_ODDS = 1/15;
	const CAPTURE_TICKS = 30; 
	const [bF32, bI32, bI8] = game.sheets.rockFX.buffers;
	var mass, planetRad, atmosphereRadius,fxSize, sheet, mouse, playfield, collectPoint, planet;
	var planetAng = 0;
	
	function Rock(idx, sprIdx) {
		this.idx = idx;
		this.sprIdx = sprIdx;
		this.hide = idx % 8 > 0;
		this.burning = false;
		this.mouseOver = false;
		const rc = Math.randI(128, 160);
		this.c = this.hide ? HIDE_COL : glUtils.RGBA2Int32Clamped(rc,rc,rc,255);
		this.isGold = false;
		this.damage = 0;
		this.maxDamage = START_DAMAGE;
		this.captured = 0;
		this.s = Math.rand(0.4,0.6);
		this.UIScale = 8;
		this.r = Math.rand(0, Math.TAU);
		const pos = playfield.randOrbit;
		this.x = pos.x;
		this.y = pos.y;
		this.z = 0.95;
		this.sr = Math.rand(-START_ROT, START_ROT);
		this.sx = pos.sx;
		this.sy = pos.sy;
		this.bufPos = sheet.addSprite(this.sprIdx, this.x, this.y, this.s, 0.5, 0.5, this.r, this.c, this.z);
	}
	Rock.prototype = {
		burn() {
			const spr = sheet.spriteRef[this.sprIdx];
			const i = this.bufPos;
			this.damage += 1;
			if(this.damage > this.maxDamage) {
				this.hide = true;
			} else {
				const f1 = this.damage / this.maxDamage;
				const f = (1 - f1) ** 2;
				this.x = Math.cos(this.ang + planetAng) * planetRad;
				this.y = Math.sin(this.ang + planetAng) * planetRad;
				var a = Math.rByte() << 24;
				sheet.addSprite(40,this.x, this.y, this.s * f, 0.5, 0.5, 0, a + 0x0077FF, 0.185);
				a = Math.rByte() << 24;
				sheet.addSprite(38,this.x, this.y, Math.rand(0, this.s * f), 0.5, 0.5, Math.rand(0, Math.TAU), a +  0x77AAFF, 0.185);
				a = Math.rByte() << 24;
				sheet.addSprite(37,this.x, this.y, Math.rand(0, this.s * f * f), 0.5, 0.5, Math.rand(0, Math.TAU), a +  0x77AAFF, 0.185);
				a = Math.rByte() << 24;
				sheet.addSprite(40,this.x, this.y, Math.rand(0, this.s * f * f * f), 0.5, 0.5, Math.rand(0, Math.TAU), a +  0xFFFFFF,0.1);		
				if(planet.population > 2) {
					planet.population *= (1 - this.kill) * (f1 ** 2) + this.kill;
					if(planet.population > 2) {
					}else{
						planet.population = 0;
					}
				} else {
					planet.population = 0;
				}
				
			}
			
			
		},
		update() {
			const spr = sheet.spriteRef[this.sprIdx];
			const i = this.bufPos;
			if(this.captured) {
				const f = (this.captured / this.captureTicks) ** 2;
				this.captured += 1;
				this.r += this.sr;
				bF32[i + 0] = (collectPoint.x - this.x) * f + this.x;
				bF32[i + 1] = (collectPoint.y - this.y) * f + this.y;
				const s = (playfield.invScale - this.s) * f + this.s;
				bF32[i + 2] = bF32[i + 3] = s;
				bF32[i + 6] = this.r;
				bI32[i + 8] = GOLD_COL;
				
				if (this.captured >= this.captureTicks) {
					this.hide = true;
					playfield.score +=  (this.s * spr.w * 0.75) ** 3;
					bI32[i + 8] = 0
				}
				
				
			} else {
				this.x += this.sx;
				this.y += this.sy;
				this.r += this.sr;
				//playfield.edgeWarp(this, spr.d);
				
				const d = (this.x * this.x + this.y * this.y) ** 0.5;
				if(d > atmosphereRadius * 100) {
					bI32[i + 8] = 0;
					this.hide = true;
					return;
				}
				if(d <= atmosphereRadius) {
					const speed = this.sx * this.sx + this.sy * this.sy;
					
					const f = (1 - (d - planetRad) / (atmosphereRadius - planetRad)) ** 2;
				    const ff = (f ** 2 * 255 | 0) << 24;
					const fa = f * speed * 0.5;
					this.kill = 1 - f * 0.003;
					this.sx *= 1 - f * 0.01;
					this.sy *= 1 - f * 0.01;

					this.s = (((spr.w * this.s) ** 3 - (fa*30)) ** (1/3)) / spr.w;
					if(isNaN(this.s)) {
						sheet.addSprite(40,this.x, this.y, 0.1 * fa, 0.5, 0.5, 0, 0xFF0077FF, 0.1);
						bI32[i + 8] = 0;
						this.hide = true;
						return;
					}
					bF32[i + 2] = bF32[i + 2] = this.s
					const s = (spr.w * this.s) / fxSize * 2;
					const dir = Math.atan2(this.sy, this.sx) + Math.TAU;
					sheet.addSprite(41,this.x, this.y, s, 0.5, 0.5, dir,ff +  0x0077FF, 0.1);
					sheet.addSprite(38,this.x, this.y, Math.rand(0,s * fa), 0.5, 0.5, Math.rand(0,Math.TAU),ff +  0x77AAFF, 0.1);
					sheet.addSprite(37,this.x, this.y, Math.rand(0,s * fa), 0.5, 0.5, Math.rand(0,Math.TAU),ff +  0x77AAFF, 0.1);
					sheet.addSprite(40,this.x, this.y, Math.rand(0,s * fa), 0.5, 0.5, Math.rand(0,Math.TAU),ff +  0xFFFFFF, 0.1);

					
					if(d <= planetRad) {
						this.ang = Math.atan2(this.y, this.x) - planetAng;
						this.x = Math.cos(this.ang + planetAng) * planetRad;
						this.y = Math.sin(this.ang + planetAng) * planetRad;
						sheet.addSprite(40,this.x, this.y, s * fa, 0.5, 0.5, 0, 0xFF0077FF, 0.1);
						this.s = s * fa;
						this.maxDamage = s * fa * 20;
						this.damage = 0;
						this.burning = true;
						bI32[i + 8] = 0;
						return;
					}
				}
				const nx = this.x / d;
				const ny = this.y / d;
				
				this.sx -= (mass / (d * d)) * nx;
				this.sy -= (mass / (d * d)) * ny;
				
				const dx = mouse.wx - this.x;
				const dy = mouse.wy - this.y;
				const md = this.mouseDist = (dx * dx + dy * dy) ** 0.5;

				if(this.mouseDist < spr.d / 2 * this.s * this.UIScale) {
					
					this.mouseOver = true;
					if (this.damage < this.maxDamage) {
						this.damage += 1;
						const ud = this.damage / this.maxDamage;
						let v = this.c & 0xFF;
						let r = (255 - v) * ud + v;
						let gb = v * (1-ud); 
						bI32[i + 8] = glUtils.RGBA2Int32Clamped(r, gb,gb,255)
					} else {
						this.breakit();
					}
				} else {
					if(this.mouseOver) {  bI32[i + 8] = this.c } 
					this.mouseOver = false;
				}
						
				
				bF32[i + 0] = this.x;
				bF32[i + 1] = this.y;
				//bF32[i + 2] = bF32[i + 2] = this.s;
				bF32[i + 6] = this.r;
				//bF32[i + 7] = this.z;
				//bI32[i + 8] = this.c;
				//bI32[i + 9] = this.sprIdx;
			}
		},
		copyFrom(f, sIdx) {
			const sf = sheet.spriteRef[f.sprIdx];
			const st = sheet.spriteRef[this.sprIdx + sIdx];
			const x = Math.rand(-(sf.w - st.w) / 2 * f.s, (sf.w - st.w) / 2 * f.s);
			const y = Math.rand(-(sf.h - st.h) / 2 * f.s, (sf.h - st.h) / 2 * f.s);
			const d = (x * x + y * y) ** 0.5;
			const dir = Math.atan2(y, x);
			this.x = f.x + x;
			this.y = f.y + y;
			this.r = f.r
			this.sx = f.sx - f.sr * d * Math.sin(dir);
			this.sy = f.sy + f.sr * d * Math.cos(dir);
			this.sr = f.sr + Math.rand(-START_ROT, START_ROT);
			this.mouseOver = false;
			this.isGold = this.isGold || f.isGold;
			this.c = this.isGold ? GOLD_COL : f.c;
			this.z = this.isGold ? 0.8 : f.z;
			this.s = f.s;
			this.hide = false;
			this.damage = 0;
			this.UIScale = f.UIScale * 2;
			this.maxDamage = f.maxDamage;
			this.sprIdx += sIdx;
			sheet.setSprite(this.bufPos, this.sprIdx, this.x, this.y, this.s, 0.5, 0.5, this.r, this.c, this.z);
		},
		breakit() {
			const sI = this.sprIdx - 22;
			var next, sprIdxOff, damage, damage1;
			if(sI === 0) {
				next = rocks[this.idx + 4];
				sprIdxOff = 1;
				damage1 = damage = START_DAMAGE / 2
				this.s *= 1.42;
				this.UIScale = 4;
			} else if(sI <= 2) {
				next = rocks[this.idx + 2];
				sprIdxOff = 2;
				damage1 = damage = START_DAMAGE / 3
			} else if(sI <= 6) {
				next = rocks[this.idx + 1];
				sprIdxOff = 4;
				damage = Math.rand(2, START_DAMAGE / 4);
				damage1 = Math.rand(2, START_DAMAGE / 4);
			} else if(this.isGold && this.captured === 0) {
				this.captured = 1;
				this.captureTicks = Math.randI(CAPTURE_TICKS,CAPTURE_TICKS * 1.5);
			} else {
				
				this.s *= 0.9;
				let i = this.bufPos + 2;					
				bF32[i++] = bF32[i] = this.s
				if(this.s < 0.3) {
					this.hide = true
					bI32[i + 5] = 0;
				} else {
					this.isGold = Math.random() < GOLD_ODDS;
				}
			}
			if(next){
				if(Math.random() < GOLD_ODDS) {
					next.isGold = true;
				}				
				next.sprIdx += sprIdxOff;
				next.copyFrom(this,sprIdxOff);
				if(Math.random() < GOLD_ODDS) {
					this.isGold = true;
				}
				this.copyFrom(this,sprIdxOff);
				this.maxDamage = damage;
				next.maxDamage = damage1;
				
			}
		}
	}
			
	
	
	const rocks = Object.assign([], {
		add(rock) { this.push(rock) },
		update() {
			planetAng = planet.ang;
			for(const r of this) {
				if(!r.hide) {
					if (r.burning) {
						r.burn();
					} else {
						r.update();
					}
				}
			}
		},
		create(count) {
			sheet = game.sheets.rockFX;
			mouse = game.mouse;
			planet = game.planet;
			playfield = game.playfield;
			collectPoint = playfield.topRight;

			planetRad = game.planet.radius;
			atmosphereRadius = game.planet.atmosphereRadius * 1.5;
			mass = game.planet.mass
			fxSize = sheet.spriteRef[41].w;
			this.length = 0;
			count *= 8;
			while (count -- > 0) {
				rocks.add(new Rock(rocks.length, ROCK_SPR_IDX));
			}
			sheet.lockBuffered();
		},
	});
	return rocks;
}


export {rocks};