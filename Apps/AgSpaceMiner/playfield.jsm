import {} from "../../src/utils/MathExtensions.jsm";

var canvas, mouse, game;
const playfield = {
	width: 1024 * 6,
	height: 1024 * 6,
	mass: 1000,
	set game(g) { game = g; mouse = game.mouse },
	get game() { return game },
	set canvas(c) { canvas = c },
	get canvas() { return canvas },
	set mouse(m) { mouse = m },
	get mouse() { return mouse },
	startView() {
		playfield.origin = {x: new Math.Curve(Math.sig, 0, 0, playfield.nextView, 2), y: new Math.Curve(Math.sig, 0, 0, playfield.nextView, 2)};
		playfield.zoom = new Math.Curve(Math.sig, 1, playfield.maxZoom, playfield.nextView, 2);
		playfield.zoom = new Math.Curve(Math.sig, 1, 1, playfield.nextView, 2);
		playfield.rotate = new Math.Curve(Math.sig, 0, Math.TAU, playfield.nextView, 2);		
	},
	get maxZoom() { return Math.min(this.width / canvas.width, this.height / canvas.height) },
	edgeWarp(pos, maxSpriteDiagonal) {
		const md = maxSpriteDiagonal, md2 = md / 2, pf = playfield;
		pos.x = ((pos.x + (md + pf.width) * 1.5) % (pf.width + md)) - (pf.width / 2 + md2);
		pos.y = ((pos.y + (md + pf.height) * 1.5) % (pf.height + md)) - (pf.height / 2 + md2);
	},
	get randPos() { return {x: Math.rand(-playfield.width / 2, playfield.width / 2), y: Math.rand(-playfield.height / 2, playfield.height / 2)} },
	get randOrbit() {
		const a = Math.rand(0,Math.TAU);
		const maxD = Math.min(playfield.width, playfield.height) / 2;
		const d = Math.rand(maxD * (1.5/3), maxD * (2.5/3));
		const x = Math.cos(a) * d;
		const y = Math.sin(a) * d;
		const s = Math.sqrt(playfield.mass / d);
		return {
			x, y, 
			sx: -Math.sin(a) * s,
			sy: Math.cos(a) * s,
		}
	},
	nextView: 60,
	wp: {x:0, y:0}, 
	topLeft: {x:0, y: 0},
	topRight: {x:0, y: 0},
	botLeft: {x:0, y: 0},
	botRight: {x:0, y: 0},
	getSheetBuffers(sheet) { [playfield.bF32, playfield.bI32, playfield.bI8] = sheet.buffers },
	goldCollector: {x : innerWidth - 100, y : 100},
	goldCollectorWorld: {x : 0, y : 0},
	updateView(sheet) {
		var scale, rot;
		const pf = playfield;
		if (pf.nextView-- <= 0) {
			const lastZoom = pf.zoom.invAt(pf.nextView);
			const z = pf.maxZoom;//lastZoom < 3 ? Math.rand(pf.maxZoom / 2, pf.maxZoom) : Math.rand(1, 1.2);
			const range = pf.nextView = Math.randI(60,120);
			pf.zoom.next(z, range)
			const p = {x:0, y:0};//pf.randPos;
			const edgeX = (this.width / 2 - canvas.width  / 2 * z);
			const edgeY = (this.height / 2 - canvas.height / 2 * z);
			pf.origin.x.next(p.x < -edgeX ? -edgeX : p.x > edgeX ? edgeX : p.x, range);
			pf.origin.y.next(p.y < -edgeY ? -edgeY : p.y > edgeY ? edgeY : p.y, range);
			pf.rotate.next(Math.rand(0, Math.TAU * 2), range);
		}
		const a = pf.nextView, im = pf.invView, bF32 = pf.bF32;
		sheet.setView(pf.origin.x.invAt(a), pf.origin.y.invAt(a), scale = pf.zoom.invAt(a), rot = 0);//playfield.rotate.invAt(a));
		//sheet.setView(0, 0, scale = 10, rot = 0);//playfield.rotate.invAt(a));
		pf.invScale = scale;
		sheet.view2World(mouse, pf.wp);		
		mouse.wx = pf.wp.x;
		mouse.wy = pf.wp.y;
		pf.wp.x = 0;
		pf.wp.y = 0;
		sheet.view2World(pf.wp, pf.topLeft);		
		pf.wp.x = pf.canvas.width;
		sheet.view2World(pf.wp, pf.topRight);		
		pf.wp.y = pf.canvas.height;
		sheet.view2World(pf.wp, pf.botRight);		
		pf.wp.x = 0;
		sheet.view2World(pf.wp, pf.botLeft);		
		/*const i = mouse.sprBufPos;
		bF32[i    ] = mouse.wx;
		bF32[i + 1] = mouse.wy;
		bF32[i + 2] = 1;
		bF32[i + 3] = 1;
		bF32[i + 6] = -rot;
		sheet.view2World(pf.goldCollector, pf.goldCollectorWorld);*/
	},		


};



export {playfield};