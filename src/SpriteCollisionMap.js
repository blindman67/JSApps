export {SpriteCollisionMap};

const TAU = Math.PI * 2;
function SpriteCollisionMap(angSteps = 64){
	var sprites, steps = 0, stepsHalf = 0, stepsHalfRadian = 0;
	const sins = [], coss = [];
    function setupContants(stepCount) {
        var i = 0;
        steps = stepCount;
        stepsHalf = steps / 2;
        stepsHalfRadian = Math.PI / steps;
        sins.length = 0;
        coss.length = 0;
        while(i < steps) {
            const ang = (i / steps) * TAU;
            coss.push(Math.cos(ang));
            sins.push(Math.sin(ang));
            i ++;
        }
    };
	const API = {
		get resultObj() { return {inside: false, dist: 0, distA: 0, distB: 0, ang: 0, x:0, y:0, cx: 0, cy: 0} }, // cx and cy for external use
		/*setupContants(stepCount) {
			steps = stepCount;
			stepsHalf = steps / 2;
            stepsHalfRadian = Math.PI / steps;
			var i = 0;
			sins.length = 0;
			coss.length = 0;
			while(i < steps) {
				const ang = (i / steps) * Math.PI * 2;
				coss.push(Math.cos(ang));
				sins.push(Math.sin(ang));
				i ++;
			}
		},*/
		mapByIdx(idx) { return [...sprites[idx].eMap] },
		addSprites(sprs, edges) {
			sprites = sprs;
			for (const spr of sprites) {
				if (spr.e !== undefined && Array.isArray(edges[spr.e])) {
					spr.eMap = edges[spr.e];
					spr.max = Math.max(...spr.eMap);
					spr.min = Math.max(...spr.eMap);
					spr.mean = spr.eMap.reduce((total, dist) => total += dist, 0) / spr.eMap.length;
				}
			}
		},
        edgeDist(idx, angle) {
            const a = (((angle / (Math.PI * 2)) % 1 + 1) % 1) * steps;
			const spr = sprites[idx];
            const m = spr.eMap;
            const distA = m[a | 0];
            const distB = m[(a + 1) % steps | 0];
            return (a % 1) * (distB - distA) + distA;
        },
        angleOfMinDist(idx, above = 0, below = Infinity) {
			const spr = sprites[idx];
            const m = spr.eMap;
            var foundIdx = -1;
            var i = 0;
            for (const dist of m) {
                if (dist < below && dist > above) {
                    foundIdx = i;
                    below = dist;
                }
                i++;
            }
            return foundIdx > -1 ? foundIdx * 2 * stepsHalfRadian : undefined;
        },
		checkSpriteFast(idx, x, y, rotate, scale, point) {
			const spr = sprites[idx];
			const dx = point.x - x;
			const dy = point.y - y;
			const dist = (dx * dx + dy * dy) ** 0.5;
			if (dist < spr.min * scale) { return true }
			if (dist <= spr.max * scale) {
				const m = spr.eMap;
				rotate = (rotate % TAU + TAU) % TAU;
				const angPos = (((Math.atan2(dy,dx) + TAU * 2 - rotate) % TAU) / TAU) * steps;
				const distA = m[angPos | 0] * scale;
				const distB = m[(angPos + 1) % steps | 0] * scale;
				const rDist = (angPos % 1) * (distB - distA) + distA;
				if (dist <= rDist) { return true }
			}
			return false;
		},
		checkSpriteFast(idx, x, y, rotate, scale, point, pRadius, res = {}) {
			const spr = sprites[idx], m = spr.eMap;
			rotate = ((rotate - stepsHalfRadian) % TAU + TAU) % TAU;
            res.ang =  Math.atan2(point.y - y, point.x - x) + TAU * 2;
			res.distA = sprites[idx].eMap[(((res.ang - rotate) % TAU) / TAU) * steps  | 0] * scale;
            res.dist = res.distA + pRadius;
            res.distB = pRadius;
            res.x = (x + point.x) / 2;
            res.y = (y + point.y) / 2;

        },
		checkSpriteDistance(idx, x, y, rotate, scale, point) {
			const spr = sprites[idx], m = spr.eMap;
			rotate = ((rotate - stepsHalfRadian) % TAU + TAU) % TAU;
			const angPos = (((Math.atan2(point.y - y, point.x - x) + TAU * 2 - rotate) % TAU) / TAU) * steps;
			return sprites[idx].eMap[angPos | 0] * scale;
		},
		checkSprite(idx, x, y, rotate, scale, point, res = {}) {
			const spr = sprites[idx], m = spr.eMap;
			const dx = point.x - x;
			const dy = point.y - y;
			const dist = (dx * dx + dy * dy) ** 0.5;
			rotate = (rotate % TAU + TAU) % TAU;
			const ang = Math.atan2(dy,dx) + TAU * 2
			const angPos = (((ang - rotate) % TAU) / TAU) * steps;
			const distA = m[angPos | 0] * scale;
			const distB = m[(angPos + 1) % steps | 0] * scale;
			var rDist = (angPos % 1) * (distB - distA) + distA;
			res.inside = dist <= rDist;
			rDist = (res.dist = rDist) / dist;
			res.ang = ang;
			res.x = x + dx * rDist;
			res.y = y + dy * rDist;
		},
		checkSprites( idx, x, y, rotate, scale,  idxB, xB, yB, rotateB, scaleB,  res = {}) {
			const spr = sprites[idx], sprB = sprites[idxB];
			const m = spr.eMap, mB = sprB.eMap;
			const dx = xB - x;
			const dy = yB - y;
			const dist = (dx * dx + dy * dy) ** 0.5;
			rotate = (rotate % TAU + TAU) % TAU;
			rotateB = (rotateB % TAU + TAU) % TAU;
			const ang = Math.atan2(dy, dx) + TAU * 2
			const angPos = (((ang - rotate) % TAU) / TAU) * steps;
			const angPosB = (((ang + Math.PI - rotateB) % TAU) / TAU) * steps;
			const angA = angPos | 0, angA1 = (angA + 1) % steps;
			const angB = angPosB | 0, angB1 = (angB + 1) % steps;
			const distA1 = m[angA] * scale;
			const distA2 = m[angA1] * scale;
			const distB1 = mB[angB] * scaleB;
			const distB2 = mB[angB1] * scaleB;
			const uA = angPos % 1;
			const uB = angPosB % 1;
			const rDistA = uA * (distA2 - distA1) + distA1;
			const rDistB = uB * (distB2 - distB1) + distB1;
			res.inside = dist <= rDistA + rDistB;
			if(res.inside) {
				res.dist = rDistA + rDistB;
				res.distA = rDistA;
				res.distB = rDistB;
				res.ang = ang;
				res.x = x + dx / 2;
				res.y = y + dy / 2;
			}
		},
		checkSpriteAndBall( idx, x, y, rotate, scale,  idxB, xB, yB, scaleB,  res = {}) {
			const spr = sprites[idx], sprB = sprites[idxB], m = spr.eMap;
			const dx = xB - x;
			const dy = yB - y;
			const dist = (dx * dx + dy * dy) ** 0.5;
			rotate = (rotate % TAU + TAU) % TAU;
			const ang = Math.atan2(dy, dx) + TAU * 2
			const angPos = (((ang - rotate) % TAU) / TAU) * steps;
			const angA = angPos | 0, angA1 = (angA + 1) % steps;
			const dist1 = m[angA] * scale;
			const dist2 = m[angA1] * scale;
			const rDist = (angPos % 1) * (dist2 - dist1) + dist1;
			const rDistB = sprB.mean * scaleB;
			res.inside = dist <= rDist + rDistB;
			if(res.inside) {
				res.dist = rDist + rDistB;
				res.distA = rDist;
				res.distB = rDistB;
				res.ang = ang % TAU;
				res.x = x + dx / 2;
				res.y = y + dy / 2;

			}
		},
		checkSpritesBallAndBall(idx, x, y, scale, idxB, xB, yB, scaleB,  res = {}) {
			const spr = sprites[idx], sprB = sprites[idxB];
			const dx = xB - x;
			const dy = yB - y;
			const dist = (dx * dx + dy * dy) ** 0.5;
			const ang = Math.atan2(dy, dx) + TAU * 2
			const rDist = spr.mean * scale;
			const rDistB = sprB.mean * scaleB;
			res.inside = dist <= rDist + rDistB;
			if(res.inside) {
				res.dist = rDist + rDistB;
				res.distA = rDist;
				res.distB = rDistB;
				res.ang = ang;
				res.x = x + dx / 2;
				res.y = y + dy / 2;
			}
		},

	}
	setupContants(angSteps);
	return API;
}