function planet(sheet, playfield) {
	
	
	const ROTATE_SPEED = 0.01;
	const PLANET_SPRITE = 39;
	const ATMOSPHERE_SCALE1 = 10;
	const ATMOSPHERE_SCALE2 = 9;
	var bufPos;
	var ang = 0;
	const [bF32, bI32, bI8] = sheet.buffers;
	const stride = sheet.stride;	
	
	
	
	
	
	const API = {
		mass: 10000,
		get radius() {
			return sheet.spriteRef[PLANET_SPRITE].w / 2;
		},
		get atmosphereRadius() {
			return sheet.spriteRef[PLANET_SPRITE + 1].w / 2 * ATMOSPHERE_SCALE1;
		},
		create() {
			bufPos = sheet.addSprite(PLANET_SPRITE+1, 0, 0, ATMOSPHERE_SCALE1, 0.5, 0.5, 0, 0x88FF8800, 0.2);
			sheet.addSprite(PLANET_SPRITE+1, 0, 0, ATMOSPHERE_SCALE2, 0.5, 0.5, 0, 0x88FF0000, 0.19);
			sheet.addSprite(PLANET_SPRITE, 0, 0, 1, 0.5, 0.5, 0, 0xFFFFFFFF, 0.18);			
			sheet.lockBuffered();
			
		}, 
		update() {
			ang += ROTATE_SPEED;
			bF32[bufPos + stride * 2 + 6] = ang;
		},
		
	};
	return API;
}

export {planet};