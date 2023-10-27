"use strict";
function VerletIK(start, kutils, id) {
	var points = [];
	const constrainedLines = [];
	var lines = [];
	var pointsStart;
	var fric = 1; // drag or air friction
	var grav = 0;   // gravity
	var stiffness = 12;  // number of itterations for line constraint
	function addPoint(spr, fixed = false){
		points.push({ x: spr.x, y: spr.y ,ox: 0, oy: 0, fixed, spr })
	}
	function addLine(p1, p2, spr){
		lines.push({p1, p2, spr, len : spr.h * spr.sy })
	} 	
	function addConstrainedLine(p1, p2){
		const dx = p2.spr.x - p1.spr.x;
		const dy = p2.spr.y - p1.spr.y; 
		const len = (dx * dx + dy * dy) ** 0.5;
		constrainedLines.push({p1, p2, len, damp: len, constraint: true })
	} 
	function movePoint(p){
		if ( (p.spr.type.animated ) ) { 
		    p.x = p.spr.x;
		    p.y = p.spr.y;
			p.fixed = true;
			return;
		}
		if(p.spr.selected) {
		    p.x = p.spr.x;
		    p.y = p.spr.y;
			p.fixed = true;
			return;
		}
		p.fixed = false;
	}
	function constrainLine(l){
		var dx = l.p2.x - l.p1.x;
		var dy = l.p2.y - l.p1.y;
		var ll = Math.hypot(dx,dy);
		var fr = ((l.len - ll) / ll) / 2;
		dx *= fr;
		dy *= fr;
		if(l.p2.fixed){
			if(!l.p1.fixed){
				l.p1.x -=dx * 2;
				l.p1.y -=dy * 2;
			}
		}else if(l.p1.fixed){
			if(!l.p2.fixed){
				l.p2.x +=dx * 2;
				l.p2.y +=dy * 2;
			}
		}else{
			l.p1.x -=dx;
			l.p1.y -=dy;
			l.p2.x +=dx;
			l.p2.y +=dy;
		}
	}
	function movePoints(){
		for (const point of points){ movePoint(point) }
	}
	function constrainLines(main = true){
		if(main) {
			for (const line of lines){ constrainLine(line) }
		} else {
			for (const line of constrainedLines){ constrainLine(line) }
		}
	}
	const sprItems = [start];
	var chain = true;
	var b = start;
	//b.attachment.rotateType = false;
	while(chain) {
		chain = false;
		if(b.attachers) {
			const nArm = b.attachers.values().next().value;
			if (nArm.attachers) {
				const b1 = nArm.attachers.values().next().value;
				b1.attachment.rotateType = false;
				sprItems.push(nArm, b1);
				nArm.attachment.x = b.w * b.sx * 0.5;
				nArm.attachment.y = (b.h * b.sy + nArm.h * nArm.sy) * 0.5;
				b1.attachment.x = nArm.w * nArm.sx * 0.5;
				b1.attachment.y = nArm.h * nArm.sy ;
				nArm.attachment.position();
				b1.attachment.position();
				b = b1;
				chain = true;
			}
		}
	}
	if (sprItems.length < 3) {
		log.warn("VerletIK requiers at least 3 linked sprites");
		return;
	}
	kutils.spriteEvent(sprItems, "ondeleting", () => {
		kutils.deleteModel(id, coll);
		sprItems.length = 0;
		coll = update = API.update = start= undefined;
	});
	var coll = kutils.createCollection(sprItems, "VerletIK"+ "_"+id+":");		
	var i = 0, j;
	while (i < sprItems.length) {
		sprItems[i++].key.update();
	}
	i = 0;	
	while (i < sprItems.length) {
		sprItems[i++].clearAttached();;
	}
	i = 0;
	while (i < sprItems.length) {
		addPoint(sprItems[i]);
		i += 2;
	}
	i = 1, j = 0;
	while (i < sprItems.length) {
		addLine(points[j], points[j + 1],sprItems[i]);
		i += 2;
		j += 1
	}
	i = 1, j = 0;
	while (j < points.length - 2) {
		addConstrainedLine(points[j], points[j + 2]);
		j += 1
	}	
	function update(){
		var updateWidget = false;
        movePoints();
        //constrainPoints();
		for(var i = 0; i < stiffness/ 2; i++){
            constrainLines(false);
        }
        for(var i = 0; i < stiffness; i++){
            constrainLines();
        }        
		const p1 = points[0];
		p1.spr.x = p1.x;
		p1.spr.y = p1.y;
		p1.spr.key.update();
		if (p1.spr.selected) { updateWidget = true }
		for(const line of lines) {
			const dx = line.p1.x - line.p2.x;
			const dy = line.p1.y - line.p2.y;
			const ang = Math.atan2(dy, dx) + Math.PI90;
			line.spr.ry = ang + (line.p1.spr.ry - line.p1.spr.rx);
			line.spr.rx = ang;
			line.spr.x = line.p1.x - dx / 2;
			line.spr.y = line.p1.y - dy / 2;
			line.spr.key.update();
			line.p2.spr.x = line.p2.x;
			line.p2.spr.y = line.p2.y;
			line.p2.spr.key.update();
			if (line.p2.spr.selected || line.spr.selected) { updateWidget = true }
		}
		API.updateWidget = updateWidget;	
    }	
	const API = {
		update,
		updateWidget: false,
		sprItems,
	}
	return API;		
}
function Pendulum(pivot, kutils, id) {
	if(!pivot.attachers) {
		log.warn("Pendulum pivot must have an attached swing arm");
	}
	if(pivot.attachers.size !== 1) {
		log.warn("Pendulum pivot can only have one swing arm");
		return;
	}	
    var arm  = pivot.attachers.values().next().value;
	if(!arm.attachers) {
		log.warn("Pendulum swing arm must have an attached weight");
	}
	if(arm.attachers.size !== 1) {
		log.warn("Pendulum swing arm can only have one attached weight");
		return;
	}	
	var ball = arm.attachers.values().next().value;
	const sprItems = [pivot, arm, ball];
	const angMoments = [{x:ball.x, y:ball.y, a: 0}];
	var chain = true;
	var b = ball;
	ball.attachment.rotateType = false;
	while(chain) {
		chain = false;
		if(b.attachers) {
			const nArm = b.attachers.values().next().value;
			if(nArm.attachers) {
				b = nArm.attachers.values().next().value;
				b.attachment.rotateType = false;
				sprItems.push(nArm, b);
				angMoments.push({x:b.x, y:b.y, a: 0});
				chain = true;
			}
		}
	}
	var homeDir = pivot.rx;
	var homeYDirOffset = pivot.ry - pivot.rx;
	var hX = Math.cos(homeDir);
	var hX = Math.sin(homeDir);
	var angMoment = 0;
	var grav = 4; // gave force
	var gx = 0, gy = 1; // grav direction
	var drag = 0.01;
	kutils.spriteEvent(sprItems, "ondeleting", () => {
		kutils.deleteModel(id, coll);
		sprItems.length = 0;
		coll = update = API.update = pivot = arm = ball = undefined;
	});
	var coll = kutils.createCollection(sprItems, "Pendulum"+ "_"+id+":");	
	function update() {
		var updateWidget = false;
		var ang,ang1,a,m,p,dx,dy,fx,fy,nfx,nfy,i,j,pmx,pmy, am,pMag,fMag,dir;
		const len = arm.h * arm.sy;
		i = 1;
		p = pivot;
		while(i < sprItems.length) {
			const a = sprItems[i++];
			const b = sprItems[i++];
			b.attachment.x = a.w * a.sx * 0.5;
			b.attachment.y = a.h * a.sy;
			a.attachment.x = p.w * p.sx * 0.5; 
			a.attachment.y = (p.h * p.sy + a.h * a.sy) * 0.5; 	
			a.attachment.position();
			b.attachment.position();
			p = b;
			if(a.selected || b.selected || p.selected) { updateWidget = true }
		}			
		var dir = pivot.rx + Math.PI90;
		if (ball.selected) {
			angMoment = 0;
			dir = Math.atan2(ball.y - pivot.y,  ball.x - pivot.x);
		} else {		
			i = 0;
			j = 0;
			//p = pivot;
			while (i < sprItems.length - 1) {
				p = sprItems[i++];
				a = sprItems[i++];
				m = angMoments[j++];
				const len = a.h * a.sy;
				dir = p.rx + Math.PI90;
				dx = Math.cos(dir);
				dy = Math.sin(dir);
				if(i === 2) {
					pmx = (m.x - p.x) /15;
					pmy = (m.y - p.y) /15;
					m.x = p.x;
					m.y = p.y;	
					pMag = (pmx * pmx + pmy * pmy) ** 0.5;
					if (pMag) {
						pmx /= pMag;
						pmy /= pMag;
						ang1 = Math.asin(dx * pmy - dy * pmx);
						m.a += Math.sin(ang1) * (pMag / len);
					} else {
						ang1 = 0;
						pMag = 0;
					}
				} else {
					ang1 *= 0.9;
					m.a += Math.sin(ang1) * (pMag / len);
				}
				fx = gx * grav;
				fy = gy * grav;
				fMag = (fx * fx + fy * fy) ** 0.5;
				nfx = fx / fMag;
				nfy = fy / fMag;
				ang = Math.asin(dx * nfy - dy * nfx);
				m.a += Math.sin(ang) * (fMag / len);
				m.a -= m.a * drag;
				dir += m.a;
				p.rx = (dir -= Math.PI90);
				p.ry = dir + homeYDirOffset;
				p.key.update();
			}
		}
		/*i = 0, j = 0;
		while(i < sprItems.length - 1) {
			p = sprItems[i++];
			a = angMoments[j++];
			p.key.update();
			i++	;
		}*/
		API.updateWidget = updateWidget;	
	}		
	const API = {
		update,
		updateWidget: false,
		sprItems,
	}
	return API;	
}
function SlideArmIK(slide, kutils, id, name = "SlideArmIK") {
	const sprItems = [];
	var head, arm, collection, bend;
	if(slide instanceof Sprite) {
		sprItems.push(slide);
		sprItems.push(arm = slide && slide.attachedTo || undefined);
		sprItems.push(head = arm && arm.attachedTo || undefined);
		if (sprItems.includes(undefined)) {
			log.warn("Could not start " + name + ". Bad linking");
			return;
		}
		slide.name.includes("Cutter") && (slide.name = "IKSlide_" + id);
		arm.name.includes("Cutter") && (arm.name = "IKArm_" + id);
		head.name.includes("Cutter") && (head.name = "IKHead_" + id);
		collection = kutils.createCollection(sprItems, name + "_"+id+":");
		slide.clearAttached();
		head.attachment && (head.attachment.rotateType = false);	
	} else {
		const f = sprites.getByGUID_I(slide.sprites[0]);
		sprItems.push(f);
		sprItems.push(arm = sprites.getByGUID_I(slide.sprites[1]));
		sprItems.push(head = sprites.getByGUID_I(slide.sprites[2]));
		collection = collections.getByGUID_I(slide.collGuid);
		if (!collection) { collection = kutils.createCollection(sprItems, name + "_"+id+":") }
		slide = f;
	}
	function deleteSprite() {
		kutils.spriteEventRemove(sprItems, "ondeleting", deleteSprite);
		kutils.deleteModel(id, collection);
		sprItems.length = 0;
		collection = update = API.update = head = arm = slide = undefined;
	};
	kutils.spriteEvent(sprItems, "ondeleting", deleteSprite);
	var updateLengths = true;
	function update(shadow) { // shadow true when called by shadow render eg (light box)
		var x,y, a1, a2,x1,y1,hx,hy;
		const armLen = arm.h * arm.sy;
		if (!shadow && (updateLengths || (arm.selected && selection.length === 1))) {
			updateLengths = false;
			arm.attachment.x = head.w * head.sx * 0.5; 
			arm.attachment.y = (head.h * head.sy + armLen) * 0.5; 
			arm.attachment.position();	
		}		
		hx = head.x;
		hy = head.y;
		a1 = slide.ry;
		const vx = Math.cos(a1), vy = Math.sin(a1);
		if (!shadow && (slide.selected && selection.length === 1)) {
			x1 = hx + Math.cos(head.ry) * armLen + vx;
			y1 = hy + Math.sin(head.ry) * armLen + vy;
			const u = (slide.x - x1) * vx + (slide.y - y1) * vy;
			//const u1 = Math.sign((hx - x1) * vy - (hy - y1) * vx);
			slide.x = x = x1 + vx * u;
			slide.y = y = y1 + vy * u;	
			a1 = Math.atan2(y - hy, x - hx) ;
			head.x = x - Math.cos(a1) * armLen;
			head.y = y - Math.sin(a1) * armLen;
			a1 -= Math.PI90;
		} else {		
			x1 = slide.x + vx;
			y1 = slide.y + vy;
			const u = (hx - x1) * vx + (hy - y1) * vy;
			x = x1 + vx * u;
			y = y1 + vy * u;		
			const dx = hx - x, dy = hy - y;
			const dist = (dx * dx + dy * dy) ** 0.5;
			if(dist < armLen) {
				const slidePos = Math.cos(Math.asin(dist / armLen)) * armLen * -Math.sign(u);
				x += vx * slidePos;
				y += vy * slidePos;
				slide.x = x;
				slide.y = y;
			} else {
				x = slide.x;
				y = slide.y;
			}
			a1 = Math.atan2(y - hy, x - hx) - Math.PI90;
		}
		head.ry = a1 + (head.ry - head.rx);
		head.rx = a1;
		head.key.update();
		slide.key.update();
		if (shadow ) { arm.key.update() }
		API.updateWidget = slide.selected || arm.selected || head.selected;			
	}
	const API = {
		serialize() { return  { name, collGuid: collection.guid, sprites: [slide.guid, arm.guid, head.guid] } },
		update,
		id,
		sprItems,
		updateWidget: false,
	}
	kutils.addCollectionFunctions(collection, API);
	return API;	
}
function SlideLockIK(slide, kutils, id) {
	const mod = SlideIK(slide, kutils, id, "SlideLockIK");
	mod.pull = true;
	return mod;
}	
function SlideIK(slide, kutils, id, name = "SlideIK") {
	const sprItems = [];
	var arm, collection;
	const lock = name === "SlideLockIK";
	if(slide instanceof Sprite) {
		sprItems.push(slide);
		sprItems.push(arm = slide && slide.attachedTo || undefined);
		if (sprItems.includes(undefined)) {
			log.warn("Could not start " + name + ". Bad linking");
			return;
		}
		slide.name.includes("Cutter") && (slide.name = "IKSlide_" + id);
		arm.name.includes("Cutter") && (arm.name = "IKSlideRail_" + id);
		collection = kutils.createCollection(sprItems, name + "_"+id+":");
		slide.clearAttached();	
	} else {
		const f = sprites.getByGUID_I(slide.sprites[0]);
		sprItems.push(f);
		sprItems.push(arm = sprites.getByGUID_I(slide.sprites[1]));
		collection = collections.getByGUID_I(slide.collGuid);
		if (!collection) { collection = kutils.createCollection(sprItems, name + "_"+id+":") }
		slide = f;
	}
	function deleteSprite() {
		kutils.spriteEventRemove(sprItems, "ondeleting", deleteSprite);
		kutils.deleteModel(id, collection);
		sprItems.length = 0;
		collection = update = API.update = arm = slide = undefined;
	};
	kutils.spriteEvent(sprItems, "ondeleting", deleteSprite);
	function update(shadow) { // shadow true when called by shadow render eg (light box)
		var x, y, a1, x1, y1, u;
		const len = arm.h * arm.sy;
		a1 = lock ? arm.ry : slide.ry;
		const vx = Math.cos(a1) * len, vy = Math.sin(a1) * len, vx2 = vx / 2, vy2 = vy / 2;
		a1 += Math.PI90;
		x1 = arm.x - vx2;
		y1 = arm.y - vy2;
		u = ((slide.x - x1) * vx + (slide.y - y1) * vy) / (vx * vx + vy * vy);			
		if(arm.selected && arm.selected && selection.length === 1) {
			u = u < 0 ? 0 : u > 1 ? 1 : u;
			slide.x = x1 + vx * u;
			slide.y = y1 + vy * u;	
			if (!lock) {			
				arm.ry = a1 + (arm.ry - arm.rx);
				arm.rx = a1;
				arm.key.update();
			}
			slide.key.update();
		} else {
			if (lock) {
				u = u < 0 ? 0 : u > 1 ? 1 : u;
				slide.x = x1 + vx * u;
				slide.y = y1 + vy * u;		
				slide.key.update(false);				
			} else {
				if (u >= 0 && u <= 1) {
					arm.x = slide.x - (vx * u) + vx2 ;
					arm.y = slide.y - (vy * u) + vy2 ;
				} else {
					if( u < 0) {
						arm.x = slide.x + vx2;
						arm.y = slide.y + vy2;
					} else {
						arm.x = slide.x - vx2;
						arm.y = slide.y - vy2;
					}
				}
				arm.ry = a1 + (arm.ry - arm.rx);
				arm.rx = a1;
				arm.key.update(false);
			}
			//slide.key.update();
		}
		API.updateWidget = slide.selected;			
	}
	const API = {
		serialize() { return  { name, collGuid: collection.guid, sprites: sprItems.map(spr => spr.guid) } },
		update,
		id,
		sprItems,
		updateWidget: false,
	}
	kutils.addCollectionFunctions(collection, API);
	return API;	
}
function GroundIK(ground, kutils, id, name = "GroundIK") {
	const sprItems = [];
	var collection;
	if(ground instanceof Sprite) {
		sprItems.push(ground);
		if(ground.attachers) {
			for(const spr of ground.attachers) {
				sprItems.push(spr);
				spr.clearAttached();
			}
		} else {
			log.warn("Could not start " + name + ". No linked sprites found");
			return;
		}
		ground.name.includes("Cutter") && (ground.name = "IKGround_" + id);
		collection = kutils.createCollection(sprItems, name + "_"+id+":");
	} else {
		const f = sprites.getByGUID_I(ground.sprites[0]);
		sprItems.push(f);
		var i = 1;
		while(i < ground.sprites.length) {
			sprItems.push(sprites.getByGUID_I(ground.sprites[i++]));
		}
		collection = collections.getByGUID_I(ground.collGuid);
		if (!collection) { collection = kutils.createCollection(sprItems, name + "_"+id+":") }
		ground = f;
	}
	function deleteSprite() {
		kutils.spriteEventRemove(sprItems, "ondeleting", deleteSprite);
		kutils.deleteModel(id, collection);
		sprItems.length = 0;
		collection = update = API.update = ground = undefined;
	};
	kutils.spriteEvent(sprItems, "ondeleting", deleteSprite);
	function update(shadow) { // shadow true when called by shadow render eg (light box)
		var x, y, a1, x1, y1, u, i, uw = false;
		const width = ground.w * ground.sx;
		const height = ground.h * ground.sy;
		a1 = ground.rx;
		const vx = Math.cos(a1), vy = Math.sin(a1);
		x1 = ground.x - vx * width * 0.5 + height * vy * 0.5;
		y1 = ground.y - vy * width * 0.5 - height * vx * 0.5;
		i = 1;
		const vvx = vx * width, vvy = vy * width, ddist = vvx * vvx + vvy * vvy;
		while(i < sprItems.length) {
			const spr = sprItems[i++];
			const xx = spr.x - x1;
			const yy = spr.y - y1;
			if(xx * vvy - yy * vvx < 0) {
				u = (xx * vvx + yy * vvy) / ddist;	
				if (u>= 0 && u <= 1) {
					spr.x = x1 + vvx * u;
					spr.y = y1 + vvy * u;
					spr.key.update(false);
					uw = spr.selected ? true : uw;
				}
			}
		}
		API.updateWidget = uw;			
	}
	const API = {
		serialize() { return  { 
				name, 
				collGuid: collection.guid, 
				sprites: sprItems.map(spr => spr.guid)
			} 
		},
		update,
		id,
		updateWidget: false,
		sprItems,
	}
	kutils.addCollectionFunctions(collection, API);
	return API;	
}
function ConnectIK(tail, kutils, id, name = "ConnectIK") {
	const sprItems = [];
	var collection, head, arm;
	if(tail instanceof Sprite) {
		sprItems.push(tail);
		sprItems.push(arm = tail && tail.attachedTo || undefined);
		sprItems.push(head = arm && arm.attachedTo || undefined);		
		if (sprItems.includes(undefined)) {
			log.warn("Could not start " + name + ". No linked sprites found");
			return;
		}
		tail.name.includes("Cutter") && (tail.name = "IKConnectBase_" + id);
		arm.name.includes("Cutter") && (arm.name = "IKConnectArm_" + id);
		head.name.includes("Cutter") && (head.name = "IKConnectHead_" + id);
		tail.clearAttached();
		arm.attachment.rotateType = false;
		arm.attachment.computed = true;		
		collection = kutils.createCollection(sprItems, name + "_"+id+":");
	} else {
		const f = sprites.getByGUID_I(tail.sprites[0]);
		sprItems.push(f);
		sprItems.push(arm = sprites.getByGUID_I(tail.sprites[1]));
		sprItems.push(head = sprites.getByGUID_I(tail.sprites[2]));
		collection = collections.getByGUID_I(tail.collGuid);
		if (!collection) { collection = kutils.createCollection(sprItems, name + "_"+id+":") }
		tail = f;
	}
	function deleteSprite() {
		kutils.spriteEventRemove(sprItems, "ondeleting", deleteSprite);
		kutils.deleteModel(id, collection);
		sprItems.length = 0;
		collection = update = API.update = tail = arm = head = undefined;
	};
	kutils.spriteEvent(sprItems, "ondeleting", deleteSprite);
	function update(shadow) { // shadow true when called by shadow render eg (light box)
		var x, y, a1, x1, y1, h, i, uw = false;
		x = tail.x - head.x;
		y = tail.y - head.y;
		h = (x * x + y * y) ** 0.5;
		a1 = Math.atan2(y,x) - Math.PI90;
		arm.x = head.x + x / 2;
		arm.y = head.y + y / 2;
		arm.ry = a1 + (arm.ry - arm.rx);
		arm.rx = a1;
		if(arm.normalisable) {
			arm.h = h / arm.sy;
		} else {
			arm.sy = h / arm.h;
		}
		arm.key.update();
		API.updateWidget = arm.selected;			
	}
	const API = {
		serialize() { return  { 
				name, 
				collGuid: collection.guid, 
				sprites: sprItems.map(spr => spr.guid)
			} 
		},
		update,
		id,
		updateWidget: false,
		sprItems,
	}
	kutils.addCollectionFunctions(collection, API);
	return API;	
}
function SingleJoinIKPull(foot, kutils, id) {
	const mod = SingleJoinIK(foot, kutils, id, "SingleJoinIKPull");
	mod.pull = true;
	return mod;
}
function SingleJoinIK(foot, kutils, id, name = "SingleJoinIK") {
	const sprItems = [];
	function getLimbLength(jointA, jointB) {
		const dx = jointA.x - jointB.x;
		const dy = jointA.y - jointB.y;
		return (dx * dx + dy * dy) ** 0.5;
	}
	
	function deleteSprite() {
		kutils.spriteEventRemove(sprItems, "ondeleting", deleteSprite);
		kutils.deleteModel(id, collection);
		sprItems.length = 0;
		collection = update = API.update = lower = knee = hip = upper = undefined;
	};
	
	function checkBendDirection() {
		const x = foot.x - hip.x;
		const y = foot.y - hip.y;
		const x1 = knee.x - hip.x;
		const y1 = knee.y - hip.y;
		return x * y1 - y * x1 < 0 ? 1 : -1;
	}	
	var knee, hip, upper, lower, collection, bend;
	const footPos = {x: 0, y: 0};
	if(foot instanceof Sprite) {
		sprItems.push(foot);
		sprItems.push(lower = foot && foot.attachedTo || undefined);
		sprItems.push(knee = lower && lower.attachedTo || undefined);
		sprItems.push(upper = knee && knee.attachedTo || undefined);
		sprItems.push(hip = upper && upper.attachedTo || undefined);
		if (sprItems.includes(undefined)) {
			log.warn("Could not start " + name + ". Bad linking");
			return;
		}
		foot.name.includes("Cutter") && (foot.name = "IKFoot_" + id);
		knee.name.includes("Cutter") && (knee.name = "IKKnee_" + id);
		hip.name.includes("Cutter") && (hip.name = "IKHip_" + id);
		upper.name.includes("Cutter") && (upper.name = "IKUpperArm_" + id);
		lower.name.includes("Cutter") && (lower.name = "IKLowerArm_" + id);
		collection = kutils.createCollection(sprItems, name + "_"+id+":");
		footPos.x = foot.attachment.x;
		footPos.y = foot.attachment.y;
		foot.clearAttached();
		knee.attachment.rotateType = false;
		knee.attachment.computed = true;

		hip.attachment && (hip.attachment.rotateType = false);	
	} else {
		const f = sprites.getByGUID_I(foot.sprites[0]);
		sprItems.push(f);
		sprItems.push(lower = sprites.getByGUID_I(foot.sprites[1]));
		sprItems.push(knee = sprites.getByGUID_I(foot.sprites[2]));
		sprItems.push(upper = sprites.getByGUID_I(foot.sprites[3]));
		sprItems.push(hip = sprites.getByGUID_I(foot.sprites[4]));
		bend = foot.bend;
		collection = collections.getByGUID_I(foot.collGuid);
		if (!collection) { collection = kutils.createCollection(sprItems, name + "_"+id+":") }
		foot = f;
		
		
	}
	var lowerLength = getLimbLength(knee, foot);
	var upperLength = getLimbLength(hip, knee);
	const upperPos = {x: upper.attachment.x, y: upper.attachment.y};
	const lowerPos = {x: lower.attachment.x, y: lower.attachment.y};
	
	
	kutils.spriteEvent(sprItems, "ondeleting", deleteSprite);	
	bend = bend === undefined ? checkBendDirection() : bend;
	var updateLengths = false;
	function update(shadow) {
		knee.attachment && (knee.attachment.computed = true);
		foot.attachment && (foot.attachment.computed = true);

		var x,y, a1, a2,x1,y1,x2,y2;
		const lowerLen = lowerLength;
		const upperLen = upperLength;
		if (!shadow && knee.selected && selection.length === 1) {
			x = knee.x - hip.x;
			y = knee.y - hip.y;
			a1 = Math.atan2(y, x) - Math.PI90;
			hip.ry = a1 + (hip.ry - hip.rx);
			hip.rx = a1;		
			x = foot.x - (knee.x = hip.x + Math.cos(a1 + Math.PI90) * upperLen);
			y = foot.y - (knee.y = hip.y + Math.sin(a1 + Math.PI90) * upperLen);			
			a2 = Math.atan2(y, x) - Math.PI90;
			knee.ry = a2 + (knee.ry - knee.rx);
			knee.rx = a2;	
			hip.key.update();
			knee.key.update();
			foot.x = hip.x + Math.cos(a1 + Math.PI90) * upperLen + Math.cos(a2 + Math.PI90) * lowerLen;
			foot.y = hip.y + Math.sin(a1 + Math.PI90) * upperLen + Math.sin(a2 + Math.PI90) * lowerLen;			
			foot.key.update(false)
			bend = checkBendDirection();		
		} else {
			x = foot.x - hip.x;
			y = foot.y - hip.y;
			const dir = Math.atan2(y,x) + Math.PI / 2;
			const ll2 = lowerLen * lowerLen;
			const ul2 = upperLen * upperLen;

			const dist2 = x * x + y * y;

			const ab21 = (upperLen * Math.sqrt(dist2)) * 2;
			const ab22 = (upperLen * lowerLen) * 2;				
			if (!shadow && (updateLengths || ((lower.selected || upper.selected) &&   selection.length === 1))) {
				updateLengths = false;
				upper.attachment.x = hip.w * hip.sx * 0.5; 
				upper.attachment.y = (hip.h * hip.sy + upperLen) * 0.5; 
				lower.attachment.x = knee.w * knee.sx * 0.5; 
				lower.attachment.y = (knee.h * knee.sy + lowerLen) * 0.5; 
				knee.attachment.x = upper.w *  upper.sx * 0.5;
				knee.attachment.y = upperLen;
				upper.attachment.position();
				knee.attachment.position();		
				lower.attachment.position();	
			}			
			a1 = dir + bend * Math.acosc((ll2 - (ul2 + dist2)) / (ab21 ? ab21 : 1));
			a2 = a1 + bend * Math.acosc((dist2 - (ul2 + ll2)) / (ab22 ? ab22 : 1));
			hip.ry = a1 + (hip.ry - hip.rx);
			hip.rx = a1;
			knee.ry = a2 + (knee.ry - knee.rx);
			knee.rx = a2;
			knee.key.update();
			hip.key.update();
			if(!API.pull){
				//lower.key.scaleSelToWorldPoint(footPos.x, footPos.y, false , false, foot);

				
				foot.x = hip.x + Math.cos(a1 + Math.PI90) * upperLen + Math.cos(a2 + Math.PI90) * lowerLen;
				foot.y = hip.y + Math.sin(a1 + Math.PI90) * upperLen + Math.sin(a2 + Math.PI90) * lowerLen;
				foot.key.update(false);
			}
		}
		if(shadow ){
			upper.key.update();
			lower.key.update();
		}
		API.updateWidget = foot.selected || knee.selected || hip.selected;			
	}
	const API = {
		serialize() {
			var i = 0;
			return  {
				name,
				bend,
				collGuid: collection.guid,
				sprites: sprItems.map(spr => spr.guid),
				id,
			};
		},
		id,
		update,
		updateWidget: false,
		pull: false,
		sprItems,
	}
	kutils.addCollectionFunctions(collection, API);
	return API;	
}
const kinematics = (()=>{
	const Mods = {
		SingleJoinIK,
		SingleJoinIKPull,
		SlideArmIK,
		GroundIK,
		ConnectIK,
		SlideIK,
		SlideLockIK,
		//Pendulum,
		//VerletIK,
	};
	const modNames = Object.keys(Mods);
	const modelMap = new Map();
	const idChars = "ABCDEF";
	const getCharId = () => {
		var i = id, str = "";
		while(i) {
			const char = i % idChars.length;
			str += idChars[char];
			i -= char;
			i = i / idChars.length | 0;
		}
		return str;
	}
	var id = 0;
	function orderModel(collection, mod, direction) {
		const map = [...modelMap.values()];
		var i = 0, moved = false;
		while(i < map.length) {
			if(map[i] === mod) {
				if (direction === "up") {
					if (i > 0) {
						map[i] = map[i - 1];
						map[i - 1] = mod;
						moved = true;
						collections.order(collection,"up");
					}
				} else if (direction === "down") {
					if (i < map.length - 1) {
						map[i] = map[i + 1];
						map[i + 1] = mod;
						moved = true;
						i++;
						collections.order(collection,"down");
					}
				}
			}
			i++;
		}
		if(moved) {
			modelMap.clear();
			map.forEach(mod => {modelMap.set(mod.id, mod)});
		}
	}
	const kutils = {
		spriteEvent(list, name, call) { list.forEach(spr => spr.addEvent(name, call)) },
		spriteEventRemove(list, name, call) { list.forEach(spr => spr.removeEvent(name, call)) },
		addCollectionFunctions(collection, mod) {			
			collection.moveUp = () => orderModel(collection, mod, "up");
			collection.moveDown = () => orderModel(collection, mod, "down");
		},
		createCollection(list, name) { return collections.create(list, undefined, name) },
		deleteModel(id, collection) {
			collections.delete(collection);
			modelMap.delete(id);
		},
	};
	const API = {
		modNames,
		deserialize(data) {
			if (data) { data.forEach(item => API.create(item.name, item)) }
		},
		serialize() {
			const data = [];
			for (const mod of modelMap.values()) { data.push(mod.serialize()) }
			return data;
		},
		create(name, initFrom = selection[0]) {
			if(Mods[name]) {
				++id;
				const cid = getCharId();
				const mod = Mods[name](initFrom, kutils, cid);
				if (mod) { modelMap.set(cid, mod) }
			} else { log.warn("No kinematics model named '"+name+"' avialable") }
		},
		update(shadow) {
			API.updateWidget = false;
			for (const mod of modelMap.values()) {
				mod.update(shadow);
				API.updateWidget = mod.updateWidget ? true : API.updateWidget;
			}
		},
		modelsForSprite(spr) {
			const mods = [];
			for (const mod of modelMap.values()) {
				if(mod.sprItems.includes(spr)) { mods.push(mod) }
			}
			return mods;
			
		},
		updateWidget: false,
	};
	return API;
})();