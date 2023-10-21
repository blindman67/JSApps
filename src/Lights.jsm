export {Lights};

function Lights() {
	
	const lights = {};
	function Light(name, pos, color, idx) {
		this.name = name;
		this.pos = pos.clone();
		this.color = color.clone();
		this.idx = idx;
	}
	
	Light.prototype = {
		update() {
			this.pos.setArray(API.pos, this.idx);
			this.color.setArray(API.colors, this.idx);
			API.dirty = true;
		}
	};
	const API = {
		pos: [],
		colors: [],
		ambient: new Float32Array([0,0,0]),
		count: 0,
		setAmbient(v) { v.setArray(API.ambient, 0); API.dirty = true },
		named: lights,
		add(name, pos, color) {
			const posOld = API.pos;
			const colorsOld = API.colors;
			API.pos = new Float32Array(posOld.length + 3);
			API.colors = new Float32Array(colorsOld.length + 3);
			API.pos.set(posOld);
			API.colors.set(colorsOld);
			lights[name] = new Light(name, pos, color, posOld.length);
			lights[name].update();
			API.count ++;
		}
		
		
	};
	
	return API;
}