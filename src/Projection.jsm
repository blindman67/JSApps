// import {} from "./utils/MathExtensions.jsm";
import {Vec3} from "./Vec3.jsm";
import {Mat4} from "./Mat4.jsm";
export {Projection};
	
function Projection(fov = Math.PI / 3, near = 1, far = 100) {
    const projMat = new Mat4().useFloat32Array();
    const m = projMat.m;
    const viewMat = new Mat4().useFloat32Array();
    const invViewMat = new Mat4();
    const vm = viewMat.m;
	const wV = new Vec3(); // working vector
	const aspect = new Float32Array([1,1]);
	var camera; // float 32 array taken from camera 
    m[11] = -1;
    m[15] = 0;
    
    const API = {
        init(_fov, _near, _far) {
            near = _near;
            far = _far;
            fov = _fov;
			return API;
        },
        get matrix() { return m },
        get viewMatrix() { return vm },
        get mat4() { return projMat },
        get near() { return near },
        get far() { return far },
        get fov() { return fov },
		get aspect() { return aspect },
		get camera() { return camera },
        set near(v) {near = v },
        set far(v) { far = v },
        set fov(v) { fov = v },
		invertView() { viewMat.invert3By4(invViewMat); return API },
		screenToWorld(point, res = point) {
			const m = invViewMat.m, x = point.x, y = point.y;
			res.x = x * m[0] + y * m[4] - m[8]  + m[12];
			res.y = x * m[1] + y * m[5] - m[9]  + m[13];
			res.z = x * m[2] + y * m[6] - m[10] + m[14];			
			return res;			
		},
        toView(cam) { projMat.multiply(cam.mat4Inv, viewMat);  camera = cam; return API },
        update(viewWidth, viewHeight) {
    		const depth = near - far;
    		aspect[0] = m[0] = (aspect[1] = m[5] = Math.tan((Math.PI - fov) / 2)) * (viewHeight / viewWidth);
    		m[10] = (near + far) / depth;
    		m[14] = 2 * near * far / depth;
			return API;
        },
        
    };
    return API;
}