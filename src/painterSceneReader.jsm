const painterSceneReader = (() => {
	function parseSprites(sprites, spriteSheetName, linkedSprites) {
		const parts = [];
		function getById(id) {
			for(const spr of sprites) {
				if(spr.id === id) { return spr }
			}
		}
		for(const spr of sprites) {
			if(spr.type === "image" && spr.src === spriteSheetName) {
				const part = {};
				part.idx = spr.subSpriteIdx;
				part.id = spr.id;
				part.name = spr.name;
				if(spr.attachment) {
					const sheetLoc = linkedSprites.getSheetLoc(part.idx);
					const cAtt = getById(spr.attachedTo);
					if (cAtt) {
						const r = cAtt.rx !== undefined ? cAtt.rx : 0;
						part.r = spr.rx !== undefined ? spr.rx : 0;
						let x = cAtt.w / 2;
						let y = cAtt.h / 2;
						const xx = x * Math.cos(-r) - y * Math.sin(-r);
						const yy = x * Math.sin(-r) + y * Math.cos(-r);
						part.cx = Math.round(sheetLoc.W / 2 - spr.attachment.x + xx);
						part.cy = Math.round(sheetLoc.H / 2 - spr.attachment.y + yy);
						if(cAtt.animated) {
							part.keys = {}
							part.tracks = [];
							for(const keyName of cAtt.namedKeys) {
								const kn = keyName === "rx" ? "r" : keyName;
								if(keyName === "rx" || keyName === "x" || keyName === "y") {
									part.tracks.push(kn);
									part.keys[kn] = {
										value: cAtt.keys[keyName].value,
										time: cAtt.keys[keyName].time,
									}
								}
							}
						}

						if(cAtt.attachedTo) {
							part.linkId = cAtt.attachedTo;  // parent of this sprite.
							const parent = getById(part.linkId);
							if(parent && parent.attachedTo) {
								const parentAnchor = getById(parent.attachedTo);
								if(parentAnchor) {
									const r1 = cAtt.rx !== undefined ? cAtt.rx : 0;
									const r2 = parentAnchor.rx !== undefined ? parentAnchor.rx : 0;
									part.r = r1 - r2;
									const x = cAtt.x - parentAnchor.x;  // relative to parents pivot point
									const y = cAtt.y - parentAnchor.y;
									const dist = (x * x + y * y) ** 0.5;
									const dir = Math.atan2(y,x) - r2 
									part.x = Math.round(Math.cos(dir) * dist);
									part.y = Math.round(Math.sin(dir) * dist); 
									
									
								}else {
									throw new Error("Could not parse scene. Sprite missing anchor attachment");								
								}
								
							}else {
								throw new Error("Could not parse scene. Sprite missing anchor attachment");								
							}
						} else {
							part.x = Math.round(cAtt.x);  // set Absolute pos of sprite
							part.y = Math.round(cAtt.y);							
							//part.cx = 0;							
							//part.cy = 0;							
						}
						parts.push(part);	
					}  else {
						throw new Error("Could not parse scene. Data corrupted");
					}
				} else {
					throw new Error("Could not parse scene. Sprite '" + spr.name + "'missing attachment.");
				}
			}
		}
		for (const part of parts) {
			const spr = linkedSprites.addSprite(part.name, part.idx, part.x, part.y, part.cx, part.cy, 1, 1, part.r);
			if (part.tracks) {
				for (const trackName of part.tracks) {
					const track = linkedSprites.addAnimTrack(linkedSprites.TrackTypes[trackName.toUpperCase()],spr);
					let i = 0;
					while(i < part.keys[trackName].value.length) {
						track.addKey(new linkedSprites.Key(part.keys[trackName].value[i], part.keys[trackName].time[i] / 60));
						i ++;
					}
				}
			}
		}
		var i = 0;
		var added = [];
		while(i < parts.length) {
			if(parts[i].linkId === undefined) {
				added.push(parts.splice(i--,1)[0]);
			}
			i++;
		}
		var tries = parts.length * parts.length;
		while(parts.length && tries--) {
			const part = parts.shift();
			if(part.linkId === undefined) {
				added.push(part);
			} else {
				const linked = added.find(p => p.id === part.linkId);
				if(linked) {
					linkedSprites.namedSprites[linked.name].addLink(linkedSprites.namedSprites[part.name]);
					added.push(part);
					
				} else {
					parts.push(part);
				}
					
			}
		}
		if(tries <= 0) { throw new Error("Could not build linked sprites. File contains missing links.") }
		linkedSprites.compileAnimations();	
	}
	function parse(data, spriteSheetName, linkedSprites) {
		if(data.info && data.info.app && (data.info.app.toLowerCase() === "painter" || data.info.app.toLowerCase() === "painterv3")){
			if(data.info.type.toLowerCase() === "scene"){
				parseSprites(data.scene.sprites, spriteSheetName, linkedSprites);
			}
		}
	}
	const API = {
		async load(url, spriteSheetName, linkedSprites) {
			return fetch(url)
				.then(text => text.json())
				.then(data => parse(data, spriteSheetName, linkedSprites))
				.catch(mess => console.warn("Could not load file " + url + " : " + mess));
		},
	};
	return API;
})();


export {painterSceneReader};