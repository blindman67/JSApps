function ShadowPath2D() {
    const paths = [];
    const pathStrs = [];

    const wp1 = utils.point;
    const matrix = [1,0,0,1,0,0];
    matrix.isIdent = true;
    const matrixStack = [];

    var currentPath;
    function saveTransform() { matrixStack.push([...matrix, matrix.isIdent]) }
    function restoreTransform() {
        const m = matrixStack.pop();
        matrix.isIdent = m.pop();
        matrix[0] = m[0];
        matrix[1] = m[1];
        matrix[2] = m[2];
        matrix[3] = m[3];
        matrix[4] = m[4];
        matrix[5] = m[5];
    }
    function transformPoint(x, y, w = wp1) {
        if (matrix.isIdent) {
            w.x = x;
            w.y = y;
        } else {
            const m = matrix;
            w.x = x * m[0] + y * m[2] + m[4];
            w.y = x * m[1] + y * m[3] + m[5];
        }
        return w;
    }
    function rotateDir(dir) {
        if (matrix.isIdent) { return dir }
        const x = Math.cos(dir);
        const y = Math.sin(dir);
        const m = matrix;
        return Math.atan2(x * m[1] + y * m[3], x * m[0] + y * m[2]);
    }
    function scaleDir(size, dir) {
        if (matrix.isIdent) { return size }
        const x = Math.cos(dir) * size;
        const y = Math.sin(dir) * size;
        const m = matrix;
        wp1.x = x * m[0] + y * m[2];
        wp1.y = x * m[1] + y * m[3];
        return (wp1.x * wp1.x + wp1.y * wp1.y) ** 0.5;
    }


    const dig = 3;
    const forNum = new RegExp("(\\.0{"+dig+"}|0{1,"+dig+"})$","g");
    function numToStr(num) {
        return num.toFixed(dig).replace(forNum, "");
    }

    function getStrCommand(p, str) {
        var pos = p;
        const com = str[pos++];
        var next = str.charCodeAt(pos++);
        while(pos < str.length && !(next >= 65 && next <= 90) && !(next >= 97 && next <= 122)) {
            next = str.charCodeAt(pos++);
        }
        if(pos === str.length && !(next >= 65 && next <= 90) && !(next >= 97 && next <= 122)) {
            return [pos, com, str.slice(p + 1).split(" ").map(Number)];
        }
        return [pos-1, com, str.slice(p + 1, pos - 1).split(" ").map(Number)];



    }


    const API = {
        isShadowPath2D: true,
        save() { saveTransform() },
        restore() { restoreTransform() },
        setTransform(a,b,c,d,e,f) {
            matrix[0] = a;
            matrix[1] = b;
            matrix[2] = c;
            matrix[3] = d;
            matrix[4] = e;
            matrix[5] = f;
            matrix.isIdent = false;
        },
        transform(a,b,c,d,e,f) {
            const m = matrix;
            this.setTransform(
                m[0] * a + m[2] * b,
                m[1] * a + m[3] * b,
                m[0] * c + m[2] * d,
                m[1] * c + m[3] * d,
                m[0] * e + m[2] * f + m[4],
                m[1] * e + m[3] * f + m[5]
            );
        },
        reset() {
            paths.length = 0;
            pathStrs.length = 0;
            currentPath = undefined;
            matrix.length = 0;
            matrix.push(1,0,0,1,0,0);
            matrix.isIdent = true;
        },
        beginPath(spr) {
            this.spr = spr;
            paths.push(currentPath = []);
        },
        closePath() { currentPath.push("Z") },
        fill(spr) { this.toString() },
        stroke(spr) { this.toString() },
        pathStr: "",
        toString() {
            if (this.pathStr) { return this.pathStr }
            var s, str = "";
            for (const p of paths) {
                str = "";
                s = "";
                for (const v of p) {
                    if (isNaN(v)) {
                        str += v;
                        s = "";
                    } else {
                        str += s + numToStr(v)
                        s = " "
                    }
                }
                pathStrs.push(str);
            }
            return this.pathStr = pathStrs.join(" ");
        },
        addPath(path, mat) {
            if (!path.isShadowPath2D) { throw new RangeError("ShadowPath2D can not parse Path2D objects") }
            if (!path.pathStr) { path.toString() }
            const str = path.pathStr;
            if (mat) {
                saveTransform();
                API.transform(mat.a, mat.b, mat.c, mat.d, mat.e, mat.f);
            }
            var pos = 0, com, data;
            while(pos < str.length) {
                [pos, com, data] = getStrCommand(pos, str);
                if (API[com]) { API[com](...data) }
                else { log.warn("Unknown path command: `" + com + " " + (data.join(" ")) + "'") }
            }
            if (mat) {
                restoreTransform();
            }

        },
        moveTo(x, y) {
            transformPoint(x, y);
            currentPath.push("M", wp1.x, wp1.y);
        },
        lineTo(x, y) {
            transformPoint(x, y)
            currentPath.push((currentPath.length ? "L" : "M"), wp1.x, wp1.y);
        },
        rect(x, y, w, h) {
            this.moveTo(x, y);
            this.lineTo(x + w, y);
            this.lineTo(x + w, y + h);
            this.lineTo(x, y + h);
            this.closePath();
        },
        svgArc(radW, radH, dir,  cw, large, x, y) {
            radW = scaleDir(radW, dir)
            radH = scaleDir(radH, dir)
            dir = rotateDir(dir);
            transformPoint(x, y);
            currentPath.push("A", radW, radH, dir,  cw, large, wp1.x, wp1.y);
        },
        arc(x, y, r, start, end, dir) {
            var ex,ey;
            const sx = x + Math.cos(start) * r;
            const sy = y + Math.sin(start) * r;
            this.lineTo(sx, sy);
            if (start === 0 && end === Math.PI * 2) {
                ex = x + Math.cos((start + end) / 2) * r;
                ey = y + Math.sin((start + end) / 2) * r;
                transformPoint(ex, ey);
                currentPath.push("A", r, r, 0, 0, (dir !== true ? 1 : 0), wp1.x, wp1.y);
                ex = x + Math.cos(end) * r;
                ey = y + Math.sin(end) * r;
                transformPoint(ex, ey);
                currentPath.push("A", r, r, 0, 0, (dir !== true ? 1 : 0), wp1.x, wp1.y);
                return

            }
            ex = x + Math.cos(end) * r;
            ey = y + Math.sin(end) * r;
            transformPoint(ex, ey);
            currentPath.push("A", r, r, 0, 0, (dir !== true ? 1 : 0), wp1.x, wp1.y);
            //currentPath.push("A", r, r, 0, (dir !== true ? 1 : 0), 0, wp1.x, wp1.y);
        },
        ellipse(x,  y, radW, radH, dir, start, end, sweepDir) {
            var [sx, sy] = Math.polarEllipse2d(start, radW, radH, dir);
            this.lineTo(sx + x, sy + y);
            if (start === 0 && end === Math.PI * 2) {
                const m = (start + end) / 2;
                [sx, sy] = Math.polarEllipse2d(m, radW, radH, dir);
                ex = x + sx;
                ey = y + sy;
                transformPoint(ex, ey);
                currentPath.push("A", radW, radH, dir, 0, (dir !== true ? 1 : 0), wp1.x, wp1.y);
                [sx, sy] = Math.polarEllipse2d(end, radW, radH, dir);
                ex = x + sx;
                ey = y + sy;
                transformPoint(ex, ey);
                currentPath.push("A", radW, radH, dir, 0, (dir !== true ? 1 : 0), wp1.x, wp1.y);
      
                return

            } else {
                var [ex, ey] = Math.polarEllipse2d(end, radW, radH, dir);
                transformPoint(ex + x, ey + y);
                currentPath.push("A", radW, radH, dir,  0, (sweepDir !== true ? 1 : 0), wp1.x, wp1.y);
            }
        },
    };

    API.A = API.svgArc;
    API.M = API.moveTo;
    API.L = API.lineTo;
    API.Z = API.closePath;
    API.z = API.closePath;
    API.beginPath();
    return API;
}



