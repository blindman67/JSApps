function planet(game) {
	
	
	const ROTATE_SPEED = 0.01;
	const PLANET_SPRITE = 39;
	const ATMOSPHERE_SCALE1 = 10;
	const ATMOSPHERE_SCALE2 = 9;
	var bufPos;
	const [bF32, bI32, bI8] = game.sheets.rockFX.buffers;
	const stride = game.sheets.rockFX.stride;	
	
	
	
	
	
	const API = {
		ang: 0,
		mass: 10000,
		population: 9000000000,
		get radius() {
			return game.sheets.rockFX.spriteRef[PLANET_SPRITE].w / 2;
		},
		get atmosphereRadius() {
			return game.sheets.rockFX.spriteRef[PLANET_SPRITE + 1].w / 2 * ATMOSPHERE_SCALE1;
		},
		create() {
			API.population = 9000000000;
			bufPos = game.sheets.rockFX.addSprite(PLANET_SPRITE+1, 0, 0, ATMOSPHERE_SCALE1, 0.5, 0.5, 0, 0x88FF8800, 0.2);
			game.sheets.rockFX.addSprite(PLANET_SPRITE+1, 0, 0, ATMOSPHERE_SCALE2, 0.5, 0.5, 0, 0x88FF0000, 0.19);
			game.sheets.rockFX.addSprite(PLANET_SPRITE, 0, 0, 1, 0.5, 0.5, 0, 0xFFFFFFFF, 0.18);			
			game.sheets.rockFX.lockBuffered();
			
		}, 
		update() {
			API.ang += ROTATE_SPEED;
			bF32[bufPos + stride * 2 + 6] = API.ang;
		},
		
	};
	return API;
}

export {planet};