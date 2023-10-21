function Mesh() {

	const v3CopyTo = (d, s) => (d.x = s.x, d.y = s.y, d.z = s.z, d);
	const v3Copy = (s) => {x: s.x, y: s.y, z: s.z};
	
	
	function Vert() { }
	Vert.prototype = {
		get pos() { return [] }
		
	};
	function Axis() {
		const origin = Mesh.V3();
		const direction = Mesh.V3.yAxis();
		const API = {
			set origin(v) { v3CopyTo(origin, v) },
			get origin() { return v3Copy(origin) },
			set direction(v) { v3CopyTo(direction, v) },
			get direction() { return v3Copy(direction) },
			spin(buffer, steps, capTop, capBot){}
			
		};
		return API;
	}

	function Buffer() {
		const API = Object.assign([], {
			add(...v) { this.push(... v.map(v3Copy)) }
		});
		return API;
	}
			
	const API = {
		create(name) {
			if(!API[name]) {
				API[name] = Buffer();
			}
			return API[name];
		},
		axis: Axis(),
		
		
	};
	
	return API;
};
Mesh.V3 = (x = 0, y = 0, z = 0) => ({x, y, z});
Mesh.V3.yAxis = () = Mesh.V3(0,1,0);
Mesh.V3.xAxis = () = Mesh.V3(1,0,0);
Mesh.V3.zAxis = () = Mesh.V3(0,0,1);


box  = Mesh();
box.create("edge").add(V3(1, 1,0), V3(1,-1,0));
box.axis.directiom(Mesh.V3.yAxis());
box.create("verts").add(box.axis.spin(box.edge, 3);

