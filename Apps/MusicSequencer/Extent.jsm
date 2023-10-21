function Extent(){
    var mx,my,Mx,My,xxa,xya,xxb,xyb,yxa,yya,yxb,yyb;
    var imx, imy, iMx, iMy;
    function complete(){
        API.l = API.x = mx;
        API.t = API.y = my;
        API.w = Mx - mx;
        API.h = My - my;
        API.b = API.t + API.h;
        API.r = API.l + API.w;
        return API;
    }

    const API = {
        x : 0, y : 0, w : 0, h : 0,  // [w]idth, [h]eight
        t : 0, b : 0, l : 0, r : 0,  // [t]op, [b]ottom, [l]eft, [r]ight
        complete,
        irate(){
            iMx = iMy = Mx = My = -(imx = imy = mx = my = Infinity);
            API.x = API.y = API.w = API.h = 0;
            API.t = API.b = API.l = API.r = 0;
            return API;
        },
        inner() {
            mx = imx;
            my = imy;
            Mx = iMx;
            My = iMy;
            complete();
            return API;
        },
        floor(){
            API.x = Math.floor(API.x);
            API.y = Math.floor(API.y);
            API.w = Math.floor(API.w);
            API.h = Math.floor(API.h);
            return API;
        },
        transform(matrix) {
            const m = matrix;
            const e = API;
            var x1 = (xxa = e.l * m[0]) + (yxa = e.t * m[2])
            var y1 = (xya = e.l * m[1]) + (yya = e.t * m[3])
            var x3 = (xxb = e.r * m[0]) + (yxb = e.b * m[2])
            var y3 = (xyb = e.r * m[1]) + (yyb = e.b * m[3])
            var x2 =  xxb + yxa;
            var y2 =  xyb + yya;
            var x4 =  xxa + yxb;
            var y4 =  xya + yyb;
            imx = Math.max(imx, mx = Math.min(x1, x2, x3, x4) + m[4]);
            imy = Math.max(imy, my = Math.min(y1, y2, y3, y4) + m[5]);
            iMx = Math.min(iMx, Mx = Math.max(x1, x2, x3, x4) + m[4]);
            iMy = Math.min(iMy, My = Math.max(y1, y2, y3, y4) + m[5]);
            return API;
        },
        point(x, y) {
            imx = Math.max(imx, mx = Math.min(mx, x));
            imy = Math.max(imy, my = Math.min(my, y));
            iMx = Math.min(iMx, Mx = Math.max(Mx, x));
            iMy = Math.min(iMy, My = Math.max(My, y));
        },
        add(x, y) {
            imx = Math.max(imx, mx = Math.min(mx, x));
            imy = Math.max(imy, my = Math.min(my, y));
            iMx = Math.min(iMx, Mx = Math.max(Mx, x));
            iMy = Math.min(iMy, My = Math.max(My, y));
            complete();
            return API;
        },
        addRect(rect) {
            API.point(rect.left, rect.top);
            API.point(rect.left + rect.width, rect.top + rect.height);
            complete();
            return API;
        },
        center() { return [API.x + API.w / 2, API.y + API.h / 2] },
        combine(extent) {
            imx = Math.max(imx, mx = Math.min(mx, extent.x, extent.r));
            imy = Math.max(imy, my = Math.min(my, extent.y, extent.b));
            iMx = Math.min(iMx, Mx = Math.max(Mx, extent.x, extent.r));
            iMy = Math.min(iMy, My = Math.max(My, extent.y, extent.b));
            complete();
            return API;
        },
        toSheetSpriteString() {
            complete();
            API.floor();
            return "{x: " + API.x + ", y: " + API.y + ", w: " + API.w + ", h: " + API.h + "},";
        },
        toString() {
            complete();
            return "Left: " + API.l.toFixed(3) + " Right: " + API.r.toFixed(3) +
                " Top: " + API.t.toFixed(3) + " Bottom: " + API.b.toFixed(3) +
                " Width: " + API.w.toFixed(3) + " Height: " + API.h.toFixed(3);

        },
    }
    API.irate();
    return API;
};
export {Extent};
