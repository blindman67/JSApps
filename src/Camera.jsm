// import {} from "./utils/MathExtensions.jsm";
import {Vec3} from "./Vec3.jsm";
import {Mat4} from "./Mat4.jsm";
export {Camera};
	
function Camera(at, pos) {
    const camMat = new Mat4().useFloat32Array();
    const camInvMat = new Mat4().useFloat32Array();
    const lookat = new Vec3().copyOf(at);
    const position = new Vec3().copyOf(pos);
	const eye = new Float32Array([0,0,0]);
    const xAxis = new Vec3(), yAxis = new Vec3(), zAxis = new Vec3();
    const m = camMat.m;
    var up = new Vec3(0,-1,0);

    const API = {
        init(at, pos) {
            lookat.copyOf(at);
            position.copyOf(pos);
            return API;
        },
        pos(x, y, z) { position.x = x; position.y = y; position.z = z; return API },
        at(x, y, z) { lookat.x = x; lookat.y = y; lookat.z = z; return API },	
        get lookat() { return lookat },
        get position() { return position },
		get eye() { return eye },
        get forward() { return zAxis },
        get up() { return yAxis },
        get right() { return xAxis },
        set lookat(v) { lookat.copyOf(v) },
        set position(v) { position.copyOf(v) },
        set up(v) { up = v },
        get matrix() { return m },
        get mat4() { return camMat },
        get mat4Inv() { return camInvMat },
        update(invert = true) {
            zAxis.init(position.x - lookat.x, position.y - lookat.y, position.z - lookat.z).normalize();
            zAxis.cross(up, xAxis).normalize();
            zAxis.cross(xAxis, yAxis).normalize();
            m[0]  = xAxis.x;
            m[1]  = xAxis.y;
            m[2]  = xAxis.z;
            m[4]  = yAxis.x;
            m[5]  = yAxis.y;
            m[6]  = yAxis.z;
            m[8]  = zAxis.x;
            m[9]  = zAxis.y;
            m[10] = zAxis.z;
            eye[0] = m[12] = position.x;
            eye[1] = m[13] = position.y;
            eye[2] = m[14] = position.z;
            invert && camMat.invert3By4(camInvMat);
            return API;
        },
    };
    return API;
}