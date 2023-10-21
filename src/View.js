// import {} from "./utils/MathExtensions.js";
import {Vec2} from "./Vec2.js";
import {Mat2} from "./Mat2.js";
export {View};

function View() {
    var zoom = 1, rotate = 0, screenScale = 1, W, H, W2, H2; // screenScale AKA playfield
    const origin = new Vec2();
    const viewMat = new Mat2().useFloat32Array();
	const om = new Float32Array([0,0]); // origin
	const sm = new Float32Array([0,0]); // screen  // size of render frame
	const m = viewMat.m
    const invViewMat = new Mat2(); // best not toconvert to type array because array of numbers is faster than array of typed
	const im = invViewMat.m

	const wV = new Vec2(); // working vector
	var aspect = 1;


    const API = {
        init(org = {x: 0, y: 0}, _zoom = 1, _rotate = 0, _screenScale = 1) {
            origin.copyOf(org);
			zoom = _zoom;
			rotate = _rotate;
			screenScale = _screenScale;
			return API;
        },
        get matrix() { return m },
        get originArray() { return om },
		get screenArray() { return sm },
        get origin() { return origin },
		get zoom() { return zoom },
		get invZoom() { return 1 / zoom },
		get rotate() { return rotate },
		get aspect() { return aspect },
		get screenScale() { return screenScale },
		set screenScale(s) { screenScale = s },
        set origin(p) { origin.x = p.x; origin.y = p.y },
		set zoom(z) { zoom = z },
		set rotate(r) { rotate = r },
        worldDistanceFromOrigin(obj) {
            const dx = obj.x - origin.x, dy = obj.y - origin.y;
            return (dx * dx + dy * dy) ** 0.5;
        },
		asMatrixArray(width, height, ma = []) {
			const w = width / 2;
			const h = height / -2;
			ma[0] = w * m[0];
			ma[1] = h * m[1];
			ma[2] = w * m[2];
			ma[3] = h * m[3];
			ma[4] = w - origin.x * ma[0];
			ma[5] = -h - origin.y * ma[3];
			return ma;
		},
		screenToWorld(point, res = point) {
			var x = point.x, y = point.y;
			res.x = x * im[0] + y * im[2] + origin.x;
			res.y = x * im[1] + y * im[3] + origin.y;
			return res;
		},
        screenPixelToWorld(point, res = point) {
            const x = (point.x / W - 0.5) * 2;
            const y = (point.y / H - 0.5) * -2;
			res.x = x * im[0] + y * im[2] + origin.x;
			res.y = x * im[1] + y * im[3] + origin.y;
            return res;
        },
		worldToScreen(point, res = point) {
			var x = point.x - origin.x;
			var y = point.y - origin.y;
			res.x = (x * m[0] + y * m[2]) * W2 + W2;
			res.y = (x * m[1] + y * m[3]) * -H2 + H2;
			return res;
		},
		worldToScreenVector(vec, res = vec) {
			var x = vec.x;
			var y = vec.y;
			res.x = (x * m[0] + y * m[2]) * W2;
			res.y = (x * m[1] + y * m[3]) * -H2;
			return res;
		},
        viewRect(rect) {
            const x = rect.x = origin.x;
            const y = rect.y = origin.y;
            rect.left = x - W2 / zoom;
            rect.right = x + W2 / zoom;
            rect.top = y - H2 / zoom;
            rect.bottom = y + H2 / zoom;

        },
        update(viewWidth, viewHeight) {
			aspect = viewHeight / viewWidth;
			const w = 2 / (W = viewWidth);
			const h = -2 / (H = viewHeight);
			W2 = W / 2;
			H2 = H / 2;
			const xdx = Math.cos(rotate) * zoom;
			const xdy = Math.sin(rotate) * zoom;
			om[0] = origin.x;
			om[1] = origin.y;
			sm[0] = viewWidth * screenScale;
			sm[1] = viewHeight * screenScale;
			m[0] = xdx * w;
			m[1] = xdy * h;
			m[2] = -xdy * w;
			m[3] = xdx * h;
			viewMat.invert(invViewMat);
			return API;
        },

    };
    return API;
}