export {View2D};
function View2D(canvas) {
    var dirty = true, iDirty = true;
    const m = new Float32Array([1,0,0,1]);
    const im = new Float32Array([1,0,0,1]); // inverse matrix
    const o = new Float32Array([0,0]);
    const io = new Float32Array([0,0]);
    var zoom = 1;
    var rotate = 0;
    function update() {
        const glW = 2 / canvas.width, glH = 2 / canvas.height;
        const xdx = Math.cos(rotate) * zoom, xdy = Math.sin(rotate) * zoom;
        m[0] =  xdx * glW;
        m[1] = -xdy * glH;
        m[2] = -xdy * glW;
        m[3] = -xdx * glH;
		dirty = false;
		iDirty = true;
	}
	function invert() {
		dirty && update();
		if (iDirty) {
			const cross =  m[0]  * m[3]  - m[1]  * m[2];
			im[0] =  m[3] / cross;
			im[1] = -m[1] / cross;
			im[2] = -m[2] / cross;
			im[3] =  m[0] / cross;
			io[0] = (m[1] * o[1] - m[3] * o[0]) / cross;
			io[1] = (m[2] * o[0] - m[0] * o[1]) / cross;		
			iDirty = false;
		}
    }
    const API = {
        get matrix() { API.wash(); return m },
        get origin() { return o },
        soil() { return dirty = true },
        wash() { dirty && update() },
        isDirty() { return dirty },
        set zoom(z) { zoom = z ? z : zoom; dirty = true },
        set rotate(r) { rotate = r; dirty = true },
        set origin(v) { o[0] = v.x; o[1] = v.y; dirty = true },
        get zoom() { return zoom },
        get rotate() { return rotate },
        get originX() { return o[0] },
        get originY() { return o[1] },
		toWorld(p, res = {}) {
			invert();
		    const x = (p.x - canvas.width / 2) / (canvas.width / 2);
		    const y = (p.y - canvas.height / 2) / (canvas.height / -2);
			res.x = x * im[0] + y * im[2] + io[0];
			res.y = x * im[1] + y * im[3] + io[1];
			return res;
		},
    };
    return API;
}