"use strict";
var  defaultShape;
const SPRITE_SHAPE_TYPES = [];
const spriteShapes = (() => {
    var test = 0;
    defaultShape = {
        serial() { return {inner: this.inner} },
        deserial(shape) { this.inner = shape.inner },
        inner: 0,
    }
    const pointsArray = [];
    const pointsRecureArray = [];
    const workArray = [];
    const centerPoints = [];
    centerPoints.size = 0;
    var pLen = 0;
    const wp1 = utils.point;
    const wp2 = utils.point;
    const wp3 = utils.point;
    const wp4 = utils.point;
    const wp5 = utils.point;
    const wp6 = utils.point;
    const wp7 = utils.point;



    /*function fitArcTangentLine(ctx, lp1, lp2, tangentAt, radius) {
        wp3.x = Math.cos(tangentAt) * radius;
        wp3.y = Math.sin(tangentAt) * radius;
        wp4.x = wp3.x + wp3.y;
        wp4.y = wp3.y - wp3.x;
        getPointLinesIntercept(lp1, lp2, wp3, wp4, wp5);
        const dist = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
        const dx = lp2.x - lp1.x;
        const dy = lp2.y - lp1.y;
        const dir = dx * wp3.y - dy * wp3.x
        const d = dist / (dx * dx + dy * dy) ** 0.5;
        wp1.x = wp5.x + dx * d;
        wp1.y = wp5.y + dy * d;
        wp2.x = wp1.x + dy;
        wp2.y = wp1.y - dx;
        wp4.x = 0;
        wp4.y = 0;
        getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);
        const rad = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
        const ang = Math.atan2(wp1.y - wp5.y, wp1.x - wp5.x);

        if (dir > 0) {
            ctx.arc(wp5.x, wp5.y, rad, (tangentAt % Math.PI2 + Math.PI2) % Math.PI2, (ang % Math.PI2 +  Math.PI2) %  Math.PI2);
        } else {
            ctx.arc(wp5.x, wp5.y, rad,  (ang % Math.PI2 +  Math.PI2) %  Math.PI2, (tangentAt % Math.PI2 + Math.PI2) % Math.PI2);

        }
    }*/


    const shapeUtils = {
        roundCornerCircleLine(c, size, inner, start, end, inStart, inEnd, pRad) {

            var dist, dx, dy, d, px, py, ppx, ppy, rad, ang, ta;

            var ra = pRad / size;
            var rai = pRad / inner;
            ra = ra > (end-start) / 2 ? (end-start) / 2 : ra;
            rai = rai > (inEnd-inStart) / 2 ? (inEnd-inStart) / 2 : rai;
            wp1.x = Math.cos(start) * size;
            wp1.y = Math.sin(start) * size;
            wp2.x = Math.cos(inStart) * inner;
            wp2.y = Math.sin(inStart) * inner;

            wp3.x = Math.cos(start + ra) * size;
            wp3.y = Math.sin(start + ra) * size;
            wp4.x = wp3.x + wp3.y;
            wp4.y = wp3.y - wp3.x;
            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            dist = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            dx = wp2.x - wp1.x;
            dy = wp2.y - wp1.y;
            d = (dx * dx + dy * dy) ** 0.5;
            px = wp5.x + (dx / d) * dist;
            py = wp5.y + (dy / d) * dist;



            ppx = px + (wp2.y - wp1.y);
            ppy = py - (wp2.x - wp1.x);
            wp1.x = px;
            wp1.y = py;
            wp2.x = ppx;
            wp2.y = ppy;
            wp4.x = 0;
            wp4.y = 0;

            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);


            rad = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            ang = Math.atan2(py - wp5.y, px - wp5.x);
            ang = (ang % Math.PI2 +  Math.PI2) %  Math.PI2;
            ta = start + ra;
            ta = (ta % Math.PI2 + Math.PI2) % Math.PI2;

            c.moveTo(wp5.x + Math.cos(ang) * rad, wp5.y + Math.sin(ang) * rad);
            c.arc(wp5.x, wp5.y, rad, ang, ta);
            // done first corner
            //---------------------------------------------------------------------
            c.arc(0, 0, size, start + ra, end - ra);

            wp1.x = Math.cos(end) * size;
            wp1.y = Math.sin(end) * size;
            wp2.x = Math.cos(inEnd) * inner;
            wp2.y = Math.sin(inEnd) * inner;

            wp3.x = Math.cos(end - ra) * size;
            wp3.y = Math.sin(end - ra) * size;
            wp4.x = wp3.x + wp3.y;
            wp4.y = wp3.y - wp3.x;
            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            dist = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            dx = wp2.x - wp1.x;
            dy = wp2.y - wp1.y;
            d = (dx * dx + dy * dy) ** 0.5;
            px = wp5.x + (dx / d) * dist;
            py = wp5.y + (dy / d) * dist;

            ppx = px + (wp2.y - wp1.y);
            ppy = py - (wp2.x - wp1.x);
            wp1.x = px;
            wp1.y = py;
            wp2.x = ppx;
            wp2.y = ppy;
            wp4.x = 0;
            wp4.y = 0;

            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            rad = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            ang = Math.atan2(py - wp5.y, px - wp5.x);

            c.arc(wp5.x, wp5.y, rad, end - ra, ang);
            // done second corner
            //---------------------------------------------------------------------

            wp1.y = Math.sin(inEnd) * inner;
            wp1.x = Math.cos(inEnd) * inner;
            wp2.x = Math.cos(end) * size;
            wp2.y = Math.sin(end) * size;

            wp3.x = Math.cos(inEnd - rai) * inner;
            wp3.y = Math.sin(inEnd - rai) * inner;
            wp4.x = wp3.x + wp3.y;
            wp4.y = wp3.y - wp3.x;

            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            dist = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            dx = wp2.x - wp1.x;
            dy = wp2.y - wp1.y;
            d = (dx * dx + dy * dy) ** 0.5;
            px = wp5.x + (dx / d) * dist;
            py = wp5.y + (dy / d) * dist;

            ppx = px + (wp2.y - wp1.y);
            ppy = py - (wp2.x - wp1.x);
            wp1.x = px;
            wp1.y = py;
            wp2.x = ppx;
            wp2.y = ppy;
            wp4.x = 0;
            wp4.y = 0;

            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            rad = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            ang = Math.atan2(py - wp5.y, px - wp5.x);
            ta = inEnd - rai + Math.PI
            ang = (ang % Math.PI2 +  Math.PI2) %  Math.PI2;
            ta = (ta % Math.PI2 + Math.PI2) % Math.PI2;

            c.arc(wp5.x, wp5.y, rad, ang, ta);


            // done first inner corner
            //---------------------------------------------------------------------


            c.arc(0, 0, inner, inEnd - rai, inStart + rai, true);
            wp1.y = Math.sin(inStart) * inner;
            wp1.x = Math.cos(inStart) * inner;
            wp2.x = Math.cos(start) * size;
            wp2.y = Math.sin(start) * size;

            wp3.x = Math.cos(inStart + rai) * inner;
            wp3.y = Math.sin(inStart + rai) * inner;
            wp4.x = wp3.x + wp3.y;
            wp4.y = wp3.y - wp3.x;

            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            dist = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            dx = wp2.x - wp1.x;
            dy = wp2.y - wp1.y;
            d = (dx * dx + dy * dy) ** 0.5;
            px = wp5.x + (dx / d) * dist;
            py = wp5.y + (dy / d) * dist;

            ppx = px + (wp2.y - wp1.y);
            ppy = py - (wp2.x - wp1.x);
            wp1.x = px;
            wp1.y = py;
            wp2.x = ppx;
            wp2.y = ppy;
            wp4.x = 0;
            wp4.y = 0;

            getPointLinesIntercept(wp1, wp2, wp3, wp4, wp5);

            rad = ((wp5.x - wp3.x) ** 2 + (wp5.y - wp3.y) ** 2) ** 0.5;
            ang = Math.atan2(py - wp5.y, px - wp5.x);

            c.arc(wp5.x, wp5.y, rad, inStart + rai + Math.PI, ang);

        },
        path(ctx, points, sx = 1, sy = 1) {
            ctx.moveTo(points[0] * sx, points[1] * sy)
            for(var i = 2; i < points.length; i+= 2) {
                ctx.lineTo(points[i] * sx, points[i + 1] * sy);
            }
            ctx.closePath();
        },
        pathScale(ctx, points,  sEven = 1, sOdd = 1, step = 1) {
            ctx.moveTo(points[0] * sEven, points[1] * sEven)
            var j = 1;
            for(var i = 2; i < points.length; i+= 2) {
                if((j/step|0) % 2) {
                    ctx.lineTo(points[i] * sOdd, points[i + 1] * sOdd);
                }else{
                    ctx.lineTo(points[i] * sEven, points[i + 1] * sEven);
                }
                j++;
            }
            ctx.closePath();
        },
        roundedPath(ctx, points, radius, sx = 1, sy = 1, lenOffset = 0) {
            var i,cross, o, len, len2, x1,y1,x2,y2,x3,y3,p1,p2,p3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2;
            sx = Math.abs(sx);
            sy = Math.abs(sy);
            var r = radius;
            o = points;//pointsToCoords(points);
            len = (len2 = o.length) / 2 - lenOffset;
            for(i = 0; i < len; i ++ ){
                p1 = i * 2;
                p2 = ((i + 1) * 2) % len2;
                p3 = ((i + len - 1) * 2) % len2;
                x1 = o[p1] * sx;
                y1 = o[p1 + 1] * sy;
                x2 = o[p2] * sx;
                y2 = o[p2 + 1] * sy;
                x3 = o[p3] * sx;
                y3 = o[p3 + 1] * sy;
                vx1 = x2 - x1;
                vy1 = y2 - y1;
                vx2 = x3 - x1;
                vy2 = y3 - y1;
                a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                nx1 = vx1 / a;
                ny1 = vy1 / a;
                nx2 = vx2 / b;
                ny2 = vy2 / b;
                ang = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
                d1 = Math.sqrt(Math.pow(r / Math.sin(ang / 2), 2) - r * r);
                cross = nx1 * ny2 - nx2 * ny1;
                if (cross < 0) {
                    as = Math.atan2(-nx2, ny2);
                    ae = Math.atan2(nx1, -ny1);
                    x = x1 + nx1 * d1 - (-ny1) * r;
                    y = y1 + ny1 * d1 - nx1 * r;
                    if(i === 0){
                        ctx.moveTo(
                            x + Math.cos(as) * r,
                            y + Math.sin(as) * r
                        );
                    }
                    ctx.arc(x, y, r, as, ae, true);
                } else {
                    as = Math.atan2(nx2, -ny2);
                    ae = Math.atan2(-nx1, ny1);
                    x = x1 + nx1 * d1 + -ny1 * r;
                    y = y1 + ny1 * d1 + nx1 * r;
                    if(i === 0){
                        ctx.moveTo(
                            x + Math.cos(as) * r,
                            y + Math.sin(as) * r
                        );
                    }
                    ctx.arc(x, y, r, as, ae);
                }
            }
            ctx.closePath();
            return ctx;
        },
        compoundPathComputed(ctx, count, points) {
            const pa = points;
            var first = true;
            count *= 7;
            var i = 0;

            while(i < count) {
                const x = pa[i++];
                const y = pa[i++];
                const r = pa[i++];
                const as = pa[i++];
                const ae = pa[i++];
                const CCW = pa[i++] === 1;
                const dist = pa[i++];
                if (r > 0) {
                    if (first) { ctx.moveTo(x + Math.cos(as) * r, y + Math.sin(as) * r) }
                    ctx.arc(x, y, r, as, ae, CCW);
                } else {
                    if (first) { ctx.moveTo(x, y) }
                    else { ctx.lineTo(x, y) }
                }
                first = false;
            }


        },
        compoundPathComputedSegment(ctx, count, points, start, length, loop = true, startNewPath = true, reverse = false) {
            const pa = points;
            var first = true;
            var idx = 0, i;
            var x,y,r,as,ae,CCW,d, unitPosA, unitPosB, back, px, py;
            var xx,yy,rr,ass,aee,ccw,dd;
            var dd = 0;
            var size = count
            if (loop) {
                size = count + 1;
                i = count * 7;
                idx = 0;
                pa[i++] = pa[idx++];
                pa[i++] = pa[idx++];
                pa[i++] = pa[idx++];
                pa[i++] = pa[idx++];
                pa[i++] = pa[idx++];
                pa[i++] = pa[idx++];
                pa[i++] = 1;
            }
            if (reverse) {
                i = (size - 1) * 7;
            } else {
                i = 0;
            }
            idx = 1;
            xx  = pa[i++];
            yy  = pa[i++];
            rr  = pa[i++];
            ass = pa[i++];
            aee = pa[i++];
            ccw = pa[i++] === 1;
            dd  = pa[i++];
            var started = false;
            while(idx < size) {
                i = (reverse ? (size - 1 - idx) : idx) * 7;
                x = pa[i++];
                y = pa[i++];
                r = pa[i++];
                as = pa[i++];
                ae = pa[i++];
                CCW = pa[i++] === 1;
                d = pa[i++];
                unitPosA = unitPosB = -1;
                if (r > 0) {
                    if (first) { ctx.moveTo(x + Math.cos(as) * r, y + Math.sin(as) * r) }
                    ctx.arc(x, y, r, as, ae, CCW);
                } else {
                    if (dd > d) {
                        back = true;
                        const atEnd = idx === 1 && dd === 1;
                        let ts = start, end = ts + length;
                        if (atEnd && end >= dd) { end = 1 }
                        if (idx === size - 1 && d === 0 && ts < d) { ts = 0 }
                        if (end >= d && ((!atEnd && end < dd) || (atEnd && end <= dd))) {
                            unitPosA = end - d;
                            started = true;
                        }
                        if (ts >= d && ((!atEnd && ts < dd) || (atEnd && ts <= dd))) {
                            unitPosB = ts - d;
                            started = false;
                        } else if(started) { unitPosB = 0 }
                    } else {
                        back = false;
                        const atEnd = idx === size - 1 && d === 1;
                        let ts = start, end = ts + length;
                        if (idx === 1 && dd === 0 && ts < dd) { ts = 0 }
                        if (ts >= dd && ((!atEnd && ts < d) || (atEnd && ts <= d))) {
                            unitPosA = ts - dd;
                            started = true;
                        }
                        if (end >= dd &&   ((!atEnd && end < d) || (atEnd && end <= d))) {
                            unitPosB = end - dd;
                            started = false;
                        } else if(started) { unitPosB =  d - dd }
                    }
                }
                const len = back ? dd - d : d - dd;
                if (unitPosA >= 0) {
                    px = back ? x + (xx - x) * unitPosA / len : xx + (x - xx) * unitPosA / len;
                    py = back ? y + (yy - y) * unitPosA / len : yy + (y - yy) * unitPosA / len;
                    if (first && startNewPath) {
                        ctx.moveTo(px, py);
                    }
                    else { ctx.lineTo(px, py) }
                }
                if (unitPosB >= 0) {
                    px = back ? x + (xx - x) * unitPosB / len : xx + (x - xx) * unitPosB / len;
                    py = back ? y + (yy - y) * unitPosB / len : yy + (y - yy) * unitPosB / len;
                    ctx.lineTo(px, py);
                }
                xx = x;
                yy = y;
                rr = r;
                ass = as;
                aee = ae;
                ccw = CCW;
                dd = d;
                idx ++;
                first = false;
            }
        },
        compoundPath(ctx, points, inner, offset, open = false, roundCaps, start, length, totalLength) {
            var i, o, len, len2, nnx, nny, ac, pLen, prLen,x1,y1,x2,y2,x3,y3,vx1,vy1,vx2,vy2,nx1,ny1,nx2,ny2, r, A, cnx, cny;
            pLen = 0;
            prLen = 0;
            //open = inner === 0 ? false : open;
            var dist = 0, endDist = 0;
            const pa = pointsArray;
            const pra = pointsRecureArray
            o = points;
            len = (len2 = (o.size !== undefined && o.size < o.length) ? o.size : o.length) / 3;
            const steps = len - (open ? 0 : 0);
            var first = true;
            for(i = 0; i < steps; i ++ ){
                const p1 = ((i + len - 1) * 3) % len2;;
                const p2 = i * 3;
                const p3 = ((i + 1) * 3) % len2;
                const last = i === steps - 1;
                x1 = o[p1];
                y1 = o[p1 + 1];
                x2 = o[p2];
                y2 = o[p2 + 1];
                r  = o[p2 + 2]
                x3 = o[p3];
                y3 = o[p3 + 1];
                vx1 = x1 - x2;
                vy1 = y1 - y2;
                vx2 = x3 - x2;
                vy2 = y3 - y2;
                const a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                const b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                endDist = dist + b / totalLength;
                nx1 = vx1 / a;
                ny1 = vy1 / a;
                nx2 = vx2 / b;
                ny2 = vy2 / b;
                const CW = (nx1 * ny2 - nx2 * ny1) < 0;
                const sign = CW ? 1 : -1;
                const ang = Math.acos(nx1 * nx2 + ny1 * ny2) / 2;
                const sinA = Math.sin(ang);
                const cosA = Math.cos(ang);

                const ag = Math.atan2(ny1, nx1) - ang * sign;
                cnx = Math.cos(ag + (CW ? 0 : Math.PI));
                cny = Math.sin(ag + (CW ? 0 : Math.PI));
                const offsetScale = offset / sinA;

                const H = r / sinA;
                A = Math.min(a / 2, H * cosA, b / 2);
                r = sinA * A / cosA;
                const cx = x2 + nx1 * A + ny1 * r * sign;
                const cy = y2 + ny1 * A - nx1 * r * sign;

                if (r > 0) {
                    r -= offset * sign;
                }
                A = (cosA * inner / sinA) * sign;
                const cix =  nx1 * A + ny1 * inner;
                const ciy =  ny1 * A - nx1 * inner;

                if (r > 0 || (open && roundCaps && (first || last))) {
                    const as = (CW ? Math.atan2(nx1, -ny1) : Math.atan2(-nx1, ny1));// + Math.PI;
                    const ae = (CW ? Math.atan2(-nx2, ny2) : Math.atan2(nx2, -ny2));// + Math.PI;
                    if (open) {
                        if (first || last) {

                            if (first) {
                                pra[prLen++] = x2 - ny2 * inner / 2 - ny2 * offset;
                                pra[prLen++] = y2 + nx2 * inner / 2 + nx2 * offset;
                                pra[prLen++] = inner / 2;
                                pra[prLen++] = (pra[prLen++] = Math.atan2(-nx2, ny2)) + Math.PI;
                                pra[prLen++] = 0;
                                pra[prLen++] = dist;
                            } else {
                                pra[prLen++] = x2 + ny1 * inner / 2 + ny1 * offset;
                                pra[prLen++] = y2 - nx1 * inner / 2 - nx1 * offset;
                                pra[prLen++] = inner / 2;
                                pra[prLen++] = (pra[prLen++] = Math.atan2(-nx1, ny1)) + Math.PI;
                                pra[prLen++] = 0;
                                pra[prLen++] = dist;
                            }
                        } else {
                            pra[prLen++] = cx;
                            pra[prLen++] = cy;
                            pra[prLen++] = r;
                            pra[prLen++] = as;
                            pra[prLen++] = ae;
                            pra[prLen++] = CW ? 0 : 1;
                            pra[prLen++] = dist;
                        }
                    }
                    if (inner > 0) {
                        if (open && (first || last)) {

                        }else {
                            if (r - inner > 0 && CW) {
                                pa[pLen++] = cx;
                                pa[pLen++] = cy;
                                pa[pLen++] = r - inner;
                                pa[pLen++] = open ? ae : as;
                                pa[pLen++] = open ? as : ae;
                                pa[pLen++] = open ? 1 : 0;
                                pa[pLen++] = dist;

                            } else if(!CW) {
                                pa[pLen++] = cx;;
                                pa[pLen++] = cy;;
                                pa[pLen++] = r + inner;
                                pa[pLen++] = open ? ae : as;
                                pa[pLen++] = open ? as : ae;
                                pa[pLen++] = open ? 0 : 1;
                                pa[pLen++] = dist;
                            } else {
                                pa[pLen++] =  x2 + cix + cnx * offsetScale;
                                pa[pLen++] =  y2 + ciy + cny * offsetScale;
                                pa[pLen++] = pa[pLen++] = pa[pLen++] = pa[pLen++] = 0;
                                pa[pLen++] = dist;
                            }
                        }
                    }
                    if (!open) {
                        pra[prLen++] = cx;
                        pra[prLen++] = cy;
                        pra[prLen++] = r;
                        pra[prLen++] = as;
                        pra[prLen++] = ae;
                        pra[prLen++] = CW ? 0 : 1;
                        pra[prLen++] = dist;
                    }
                } else {
                    if (!open) {
                        pra[prLen++] = x2 + cnx * offsetScale;
                        pra[prLen++] = y2 + cny * offsetScale;
                        pra[prLen++] = pra[prLen++] = pra[prLen++] = pra[prLen++] = 0;
                        pra[prLen++] = dist;

                        if (inner > 0) {
                            pa[pLen++] = x2 + cix + cnx * offsetScale;
                            pa[pLen++] = y2 + ciy + cny * offsetScale;
                            pa[pLen++] = pa[pLen++] = pa[pLen++] = pa[pLen++] = 0;
                            pa[pLen++] = dist;
                        }

                    } else {

                        if (first) {
                            pra[prLen++] = x2 - ny2 * offset;
                            pra[prLen++] = y2 + nx2 * offset;

                            pa[pLen++] = x2 - ny2 * inner - ny2 * offset;
                            pa[pLen++] = y2 + nx2 * inner + nx2 * offset;
                        } else if (last) {
                            pra[prLen++] = x2 + ny1 * offset;
                            pra[prLen++] = y2 - nx1 * offset;
                            pa[pLen++] = x2 + ny1 * inner + ny1 * offset;
                            pa[pLen++] = y2 - nx1 * inner - nx1 * offset;
                        } else {
                            pra[prLen++] = x2 + cnx * offsetScale;
                            pra[prLen++] = y2 + cny * offsetScale;
                            pa[pLen++] =  x2 + cix + cnx * offsetScale;
                            pa[pLen++] =  y2 + ciy + cny * offsetScale;
                        }
                        pra[prLen++] = pra[prLen++] = pra[prLen++] = pra[prLen++] = 0;
                        pra[prLen++] = dist;
                        pa[pLen++] = pa[pLen++] = pa[pLen++] = pa[pLen++] = 0;
                        pa[pLen++] = dist;

                    }
                }
                dist = endDist;
                first = false;
            }
            if (open) {
                i = pLen - 1;
                while(i > 0) {
                    pra[prLen++] = pa[i - 6];
                    pra[prLen++] = pa[i - 5];
                    pra[prLen++] = pa[i - 4];
                    pra[prLen++] = pa[i - 3];
                    pra[prLen++] = pa[i - 2];
                    pra[prLen++] = pa[i - 1];
                    pra[prLen++] = pa[i - 0];
                    i -= 7;
                }
                if (length < 1) {
                    shapeUtils.compoundPathComputedSegment(ctx, prLen / 7, pra, start, length, false, true);
                } else {
                    shapeUtils.compoundPathComputed(ctx, prLen / 7, pra);
                }
                ctx.closePath();
            } else  if (inner > 0) {
                if(length !== 1) {
                    start = ((start % 1) + 1) % 1;
                    if (start + length > 1) {
                        shapeUtils.compoundPathComputedSegment(ctx, prLen / 7, pra, start, length, true, true);
                        shapeUtils.compoundPathComputedSegment(ctx, prLen / 7, pra, start - 1, length, true, false);
                        shapeUtils.compoundPathComputedSegment(ctx, pLen / 7, pa, start - 1, length, true, false, true);
                        shapeUtils.compoundPathComputedSegment(ctx, pLen / 7, pa, start, length, true, false, true);
                    } else {
                        shapeUtils.compoundPathComputedSegment(ctx, prLen / 7, pra, start, length, true, true);
                        shapeUtils.compoundPathComputedSegment(ctx, pLen / 7, pa, start, length, true, false, true);
                    }
                } else {
                    shapeUtils.compoundPathComputed(ctx, prLen / 7, pra);
                    ctx.closePath()
                    shapeUtils.compoundPathComputed(ctx, pLen / 7, pa);
                }
                ctx.closePath();
            } else {
                shapeUtils.compoundPathComputed(ctx, prLen / 7, pra);
                ctx.closePath();
            }
            return ctx;
        },
        roundedPathRadius(ctx, points, inner = 0, open = false) {
            var i, o, len, len2, nnx, nny, ac, pLen;
            pLen = 0;
            const pa = pointsArray;
            o = points;
            len = (len2 = (o.size !== undefined && o.size < o.length) ? o.size : o.length) / 3;
            const steps = len - (open ? 1 : 0);
            var first = true;
            for(i = 0; i < steps; i ++ ){
                const p1 = i * 3;
                const p2 = ((i + 1) * 3) % len2;
                const p3 = ((i + len - 1) * 3) % len2;
                const x1 = o[p1];
                const y1 = o[p1 + 1];
                let r  = o[p1 + 2]
                const x2 = o[p2];
                const y2 = o[p2 + 1];
                const x3 = o[p3];
                const y3 = o[p3 + 1];
                const vx1 = x2 - x1;
                const vy1 = y2 - y1;
                const vx2 = x3 - x1;
                const vy2 = y3 - y1;
                const a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                const b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                const min = Math.min(a, b) / 2;
                const c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                const nx1 = vx1 / a;
                const ny1 = vy1 / a;
                const nx2 = vx2 / b;
                const ny2 = vy2 / b;

                nnx = (nx1 + nx2) / 2;
                nny = (ny1 + ny2) / 2;
                const aa = Math.sqrt(nnx * nnx + nny * nny);
                nnx /= aa;
                nny /= aa;
                const ss = Math.sin(ac = Math.acos((c * c - a * a - b * b) / (-2 * a * b)) / 2);
                const cc = Math.cos(ac);
                var ll = r / ss;
                ll = ll * cc > min ? min / cc :  ll;
                const rad = ll * ss;
                const CW = (nx1 * ny2 - nx2 * ny1) > 0;
                if(rad > 0) {
                    const x = x1 + nnx * ll;
                    const y = y1 + nny * ll;
                    const as = (CW ? Math.atan2(-nx2,  ny2) : Math.atan2( nx2, -ny2)) + Math.PI;
                    const ae = (CW ? Math.atan2( nx1, -ny1) : Math.atan2(-nx1,  ny1)) + Math.PI;
                    if (!open || (open && i < steps -1)) {
                        if (inner > 0) {
                            if (rad - inner > 0 && CW) {

                                pa[pLen++] = x;
                                pa[pLen++] = y;
                                pa[pLen++] = rad - inner;
                                pa[pLen++] = as;
                                pa[pLen++] = ae;
                                pa[pLen++] = 0;
                            } else if(!CW) {
                                pa[pLen++] = x;
                                pa[pLen++] = y;
                                pa[pLen++] = rad + inner;
                                pa[pLen++] = as;
                                pa[pLen++] = ae;
                                pa[pLen++] = 1;
                            } else {
                                ll = inner / ss;
                                pa[pLen++] = x1 + nnx * ll;
                                pa[pLen++] = y1 + nny * ll;
                                pa[pLen++] = pa[pLen++] = pa[pLen++] = pa[pLen++] = 0;
                            }
                        }
                        if (first) { ctx.moveTo(x + Math.cos(as) * rad, y + Math.sin(as) * rad) }
                        ctx.arc(x, y, rad, as, ae, !CW);
                    }
                } else {
                    if (!open || (open && i < steps -1)) {
                        if (first) { ctx.moveTo(x1, y1) }
                        else { ctx.lineTo(x1, y1) }
                        if (inner > 0) {
                            ll = (CW ? inner : -inner)/ ss
                            pa[pLen++] = x1 + nnx * ll;
                            pa[pLen++] = y1 + nny * ll;
                            pa[pLen++] = pa[pLen++] = pa[pLen++] = pa[pLen++] = 0;
                        }
                    }

                }
                first = false;

            }
            !open && ctx.closePath();

            if (inner > 0) {
                if (open) {
                    //first = true;
                    i = pLen - 1;
                    while(i > 0) {
                        const CCW = pa[i--] === 1;
                        const ae = pa[i--];
                        const as = pa[i--];
                        const r = pa[i--];
                        const y = pa[i--];
                        const x = pa[i--];
                        //if (first) { ctx.moveTo(x, y) }
                        //else { ctx.lineTo(x,y) }
                        ctx.lineTo(x,y)
                    }
                    ctx.closePath();

                } else {
                    first = true;
                    i = 0;
                    while(i < pLen) {
                        const x = pa[i++];
                        const y = pa[i++];
                        const r = pa[i++];
                        const as = pa[i++];
                        const ae = pa[i++];
                        const CCW = pa[i++] === 1;
                        if (r > 0) {
                            if (first) { ctx.moveTo(x + Math.cos(as) * r, y + Math.sin(as) * r) }
                            ctx.arc(x, y, r, as, ae, CCW);
                        } else {
                            if (first) { ctx.moveTo(x, y) }
                            else { ctx.lineTo(x, y) }
                        }
                        first = false;
                    }
                    ctx.closePath();
                }
            }


            return ctx;
        },
        vectorPathBake(shape, dest, pathIdx) {
            const t = shape;
            const type = t.sides - 1;
            const isPoints = (type % 3) === 2;
            const minLen = ((shape.valC + 4) / 8) ** 2 * 32;
            var i, idx, x1,y1,x2,y2, x3,y3, ax, ay, bx, by, pIdx = 0;
            const skipSize = 0;//t.strokeWidth ? (isPoints ? 0 : 2) : 4;
            if (t.valA > -4) {
                const area = ((t.valA + 4) * 4) ** 3;
                for (const path of t.data) {
                    if (pathIdx === undefined || (pathIdx === pIdx)) {
                        if (path.length > skipSize && Math.polyArea(path) > area) {
                            dest.push(shapeUtils.vectorPathLimit(path, [], path.length, minLen));
                        }
                    }
                    pIdx ++;
                }
            } else {
                for (const path of t.data) {
                    if (pathIdx === undefined || (pathIdx === pIdx)) {
                        if (path.length > skipSize) {
                            dest.push(shapeUtils.vectorPathLimit(path, [], path.length, minLen));
                        }
                    }
                    pIdx ++;
                }
            }
            return dest;
        },
        vectorPathLimit(points, newPoints, size, minLen = 0, limitLength = true) {
            if ( minLen <= 0.707) {
                points.size = size;
                return points;
            }
            function simplify(start, end) {
                var maxDist, idx, i, dx, dy, px, py, t, dist, dist1;
                const xx = pp[start], yy = pp[start + 1];
                const ddx = pp[end] - xx, ddy = pp[end + 1] - yy;
                dist1 = ddx * ddx + ddy * ddy;
                maxDist = minLen;
                i = start + 2
                while(i < end) {
                    dx = (px = pp[i ++]) - xx;
                    dy = (py = pp[i ++]) - yy;
                    t = (dx * ddx + dy * ddy) / dist1;
                    if (t > 1) {
                        dx = px - pp[end];
                        dy = py - pp[end + 1];
                    } else if (t > 0) {
                        dx -= ddx * t;
                        dy -= ddy * t;
                    }
                    dist = (dx * dx + dy * dy) ** 0.5;
                    if (dist > maxDist) {
                        idx = i - 2;
                        maxDist = dist;
                    }
                }
                if (maxDist > minLen) {
                    if (idx - start > 2) { simplify(start, idx) }
                    tp[rIdx++] = pp[idx];
                    tp[rIdx++] = pp[idx + 1];
                    if (end - idx > 2) { simplify(idx, end) }
                }
            }
            const tp = newPoints;
            const pp = points;
            var rIdx = 0;
            tp[rIdx++] = pp[size] = pp[0];
            tp[rIdx++] = pp[size + 1] = pp[1];
            simplify(0, size);
            tp.size = rIdx;
            return tp;
        },
        vectorPathMinLengthOLD(points, newPoints, size, minLen = 0) {
            var idx = 0, i = 0, x1,y1, x2, y2, x3, y3, vx1, vy1, vx2, vy2, o, d1, d, dd;
            o = points;
            if (minLen === 0) {
                points.size = size;
                return points;
            }
            const ss = size - 2;
            const wa = newPoints;
            const ws = centerPoints;

            while (i < size) {
                x1 = o[(i + ss)   % size];
                y1 = o[(i+1 + ss) % size];
                x2 = o[i++];
                y2 = o[i++];
                x3 = o[(i)   % size];
                y3 = o[(i+1) % size];
                vx1 = x1 - x2;
                vy1 = y1 - y2;
                vx2 = x3 - x2;
                vy2 = y3 - y2;
                ws[idx++] = d = (vx2 * vx2 + vy2 * vy2) ** 0.5;
                dd = (vx1 * vx1 + vy1 * vy1) ** 0.5;
                ws[idx++] = Math.abs((vx2 / d) * (vy1 / dd) - (vy2 / d) * (vx1 / dd));
            }
            i = 0;
            idx  = 0;
            while(i < size) {
                const len = ws[i];
                if (len < minLen) {
                    const c = ws[i + 1];
                    const cc = ws[(i + 2) % size];
                    if (c < 0.7 && cc < 0.7) {
                        if (c < cc)  {

                        } else {
                            wa[idx++] = o[i];
                            wa[idx++] = o[i+1];
                            i += 2;
                        }
                    } else {
                        wa[idx++] = o[i];
                        wa[idx++] = o[i+1];
                    }
                } else {
                    wa[idx++] = o[i];
                    wa[idx++] = o[i+1];
                }

                i += 2;
            }
            wa.size = idx

            /*x1 = o[i++];
            y1 = o[i++];
            wa[idx++] = x1
            wa[idx++] = y1;
            while (i < size) {
                x2 = o[i++];
                y2 = o[i++];
                vx1 = x2 - x1;
                vy1 = y2 - y1;
                d1 = (vx1* vx1 + vy1 * vy1);
                if (d1 >= minLen) {
                    wa[idx++] = x2
                    wa[idx++] = y2;
                    x1 = x2;
                    y1 = y2;
                }
            }
            x2 = o[i % size];
            y2 = o[(i + 1) % size];
            vx1 = x2 - x1;
            vy1 = y2 - y1;
            d1 = (vx1* vx1 + vy1 * vy1);
            if (d1 < minLen) {
                wa.size = idx - 2;
            } else {
                wa.size = idx;
            }*/
            return wa;


        },
        optimiseVectorPath(points, offX = 0, offY = 0, angleThreshold = 0.1) {
            var ia, ib, size = 1, cross, dot, o, len, len2, x1,y1,x2,y2,x3,y3,a,b,vx1,vx2,vy1,vy2,nx1,ny1,nx2,ny2;
            const res = [];
            const ws = []; // work space
            o = points;
            const sa = Array.isArray(o[0]);
            len = o.length;
            if (sa) {
                if (o[0][0] === o[len -1][0] && o[0][1] === o[len - 1][1]) {  len -= 1;  }
                res.push(o[0][0] + offX, o[0][1] + offY);
            } else {
                size = 2
                if (o[0] === o[len -2] && o[1] === o[len - 1]) {  len -= 2;  }
                res.push(o[0] + offX, o[1] + offY);
            }
            ia = 0;
            ib = size;

            while (ib <= len) {
                if (sa) {
                    x1 = o[ia % len][0];
                    y1 = o[ia % len][1];
                    x2 = o[ib % len][0];
                    y2 = o[ib % len][1];
                } else {
                    x1 = o[(ia) % len];
                    y1 = o[(ia + 1) % len];
                    x2 = o[(ib) % len];
                    y2 = o[(ib + 1) % len];

                }
                vx1 = x2 - x1;
                vy1 = y2 - y1;
                a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                if (a < 2) {
                    if (ib === len) {
                        res.pop();
                        res.pop();
                    }
                    ib += size;
                } else {
                    if (ib < len) {
                        res.push(x2 + offX, y2 + offY);
                    }
                    ia = ib;
                    ib += size;
                }
            }
            var reduce = true;

            o = res;
            while (reduce && o.length > 6) {
                reduce = false;
                len = o.length;
                ia = 0;
                while (ia <= len) {
                    x1 = o[(ia + (len-2)) % len];
                    y1 = o[(ia + (len-2) + 1) % len];
                    x2 = o[(ia + 0) % len];
                    y2 = o[(ia + 1) % len];
                    x3 = o[(ia + 2) % len];
                    y3 = o[(ia + 3) % len];
                    vx1 = x1 - x2;
                    vy1 = y1 - y2;
                    a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                    vx2 = x3 - x2;
                    vy2 = y3 - y2;
                    b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                    nx1 = vx1 / a;
                    ny1 = vy1 / a;
                    nx2 = vx2 / b;
                    ny2 = vy2 / b;
                    cross = Math.abs(nx1 * ny2 - nx2 * ny1);
                    dot = nx1 * nx2 + ny1 * ny2;
                    if (cross < angleThreshold && dot < 0) {
                        reduce = true;
                        o.splice(ia % len, 2);
                        len -= 2;
                    } else {
                        ia += 2;
                    }
                }
            }
            return res;
        },
        roundedVectorPath(ctx, points, radius, inRad, corner, size, asPoints = false) {
            var idx = 0, i = 0,cross, o, len, A, len2, x1,y1,x2,y2,x3,y3,p1,p2,p3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2, sc, cnx, cny, ia, ib, ic;
            var r, r1 = radius, ir1 = inRad;

            o = points;
            len = (len2 = size ) / 2 ;
            i = 0;
            if (asPoints) {
                x1 = o[i++];
                y1 = o[i++];
                ctx.moveTo(x1 - 0.1, y1);
                ctx.lineTo(x1 + 0.1, y1);
                while (i < len2) {
                    x2 = o[i++];
                    y2 = o[i++];
                    ctx.moveTo(x2 - 0.1, y2);
                    ctx.lineTo(x2 + 0.1, y2);
                }
                return;
            }
            if (len2 < 6) { return }
            if ((radius <= 0 && inRad <= 0) || corner === 0 || corner <= -Math.PI) {
                x1 = o[i++];
                y1 = o[i++];
                ctx.moveTo(x1, y1);
                while (i < len2) {
                    x2 = o[i++];
                    y2 = o[i++];
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                return;
            }
            const cornerUnder = corner > 0;
            corner = Math.abs(corner);
            var first = true;
            ia = len2 - 2;
            ib = 0;
            if (o[ia] === o[ib] && o[ia + 1] === o[ib + 1]) {
                len2 -= 2;
                len -= 1;
                ia -= 2;
            }
            var roundCorner;
            while (ib < len2) {
                x1 = o[ia];
                y1 = o[ia + 1];
                x2 = o[ib ++];
                y2 = o[ib ++];
                ic = ib % len2;
                x3 = o[ic];
                y3 = o[ic + 1];
                vx1 = x1 - x2;
                vy1 = y1 - y2;
                a = (vx1 * vx1 + vy1 * vy1) ** 0.5;
                vx2 = x3 - x2;
                vy2 = y3 - y2;
                b = (vx2 * vx2 + vy2 * vy2) ** 0.5;
                nx1 = vx1 / a;
                ny1 = vy1 / a;
                nx2 = vx2 / b;
                ny2 = vy2 / b;

                const angR = Math.acos(nx1 * nx2 + ny1 * ny2);
                if (cornerUnder) {
                    roundCorner = Math.abs(angR) <= corner;
                } else {
                    roundCorner = Math.abs(angR) >= corner;
                }
                const CW = (nx1 * ny2 - nx2 * ny1) < 0;
                r = CW ? r1 : ir1;
                if (roundCorner && r > 0) {
                    const sign = CW ? 1 : -1;
                    const ang = angR / 2;
                    const sinA = Math.sin(ang);
                    const cosA = Math.cos(ang);
                    const ag = Math.atan2(ny1, nx1) - ang * sign;
                    cnx = Math.cos(ag + (CW ? 0 : Math.PI));
                    cny = Math.sin(ag + (CW ? 0 : Math.PI));
                    const H = r / sinA;
                    A = Math.min(a / 2, H * cosA, b / 2);
                    r = sinA * A / cosA;
                    const cx = x2 + nx1 * A + ny1 * r * sign;
                    const cy = y2 + ny1 * A - nx1 * r * sign;

                    if (r > 0) {
                        const as = (CW ? Math.atan2(nx1, -ny1) : Math.atan2(-nx1, ny1));
                        const ae = (CW ? Math.atan2(-nx2, ny2) : Math.atan2(nx2, -ny2));
                        if (first) { ctx.moveTo(cx + Math.cos(as) * r, cy + Math.sin(as) * r) }
                        ctx.arc(cx, cy, r, as, ae, !CW);
                    } else {
                         if (first) { ctx.moveTo(x2, y2) }
                         else { ctx.lineTo(x2, y2) }
                    }
                } else {
                    if (first) { ctx.moveTo(x2, y2) }
                    else { ctx.lineTo(x2, y2) }

                }
                first = false;
                ia = ib - 2;
            }
            ctx.closePath();
            return ctx;
        },
        roundedPoly(ctx, points, w, h, inner, radius) {
            var i,cross, len, x1,y1,x2,y2,x3,y3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2,an,r, nnx, nny, ac;
            const ang1 = Math.TAU / points;
            pLen = 0;
            const pa = pointsArray;
            an = -Math.PI90;
            r = radius;
            len = points;
            x2 = Math.cos(an) * w;
            y2 = Math.sin(an) * h;
            x1 = Math.cos(an - ang1) * w;
            y1 = Math.sin(an - ang1) * h;
            for(i = 0; i < len; i ++ ){
                x3 = x1;
                y3 = y1
                x1 = x2;
                y1 = y2;
                an += ang1;
                x2 = Math.cos(an) * w;
                y2 = Math.sin(an) * h;
                r = radius;

                vx1 = x2 - x1;
                vy1 = y2 - y1;
                vx2 = x3 - x1;
                vy2 = y3 - y1;
                a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                const min = Math.min(a, b) / 2;
                c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                nx1 = vx1 / a;
                ny1 = vy1 / a;
                nx2 = vx2 / b;
                ny2 = vy2 / b;

                nnx = (nx1 + nx2) / 2;
                nny = (ny1 + ny2) / 2;
                const aa = Math.sqrt(nnx * nnx + nny * nny);
                nnx /= aa;
                nny /= aa;
                const ss = Math.sin(ac = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b)) / 2);

                const rr = (r / ss) * Math.cos(ac) > min ? min / Math.cos(ac):  r / ss;
                r = rr * ss;

                if (inner > 0) {
                    const hh = inner / ss;

                    if (rr > hh) {
                        pa[pLen++] = x = x1 + nnx * rr;
                        pa[pLen++] = y = y1 + nny * rr;
                        pa[pLen++] = r -  r * (hh / rr);
                    } else {
                        x = x1 + nnx * rr;
                        y = y1 + nny * rr;
                        pa[pLen++] = x1 + nnx * hh;
                        pa[pLen++] = y1 + nny * hh;
                        pa[pLen++] = 0;
                    }

                    pa[pLen++] = as = Math.atan2(-nx2, ny2) + Math.PI;
                    pa[pLen++] = ae = Math.atan2(nx1, -ny1) + Math.PI;
                } else {
                    x = x1 + nnx * rr;
                    y = y1 + nny * rr;
                    as = Math.atan2(-nx2, ny2) + Math.PI;
                    ae = Math.atan2(nx1, -ny1) + Math.PI;
                }
                if (i === 0) { ctx.moveTo( x + Math.cos(as) * r, y + Math.sin(as) * r) }
                ctx.arc(x, y, r, as, ae);

            }
            ctx.closePath();
            if(inner > 0){
                for (i = 0; i < pLen; ) {
                    x = pa[i++];
                    y = pa[i++];
                    r = pa[i++];
                    as = pa[i++];
                    ae = pa[i++];
                    if (r <= 0.01) {
                        if (i === 5) { ctx.moveTo(x, y) }
                        else { ctx.lineTo(x, y) }
                    } else {
                        if (i === 5) { ctx.moveTo(x + Math.cos(as) * r, y + Math.sin(as) * r) }
                        ctx.arc(x, y, r, as, ae);
                    }
                }
                ctx.closePath();
            }
            return ctx;
        },
        roundedStarComplex(ctx, points, outerRound, innerRound, radius, radiusInner, center, innerMove) {
            var i,cross, len, x1,y1,x2,y2,x3,y3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2,an,r;
            const ang1 = Math.TAU / points;
            const ang2 = ang1 / 2;
            an = -Math.PI90
            x1 = Math.cos(an) * radius;
            y1 = Math.sin(an) * radius;
            x2 = Math.cos(an + ang2) * radiusInner;
            y2 = Math.sin(an + ang2) * radiusInner;
            vx1 = (x2 - x1) / 4;
            vy1 = (y2 - y1) / 4;
            const radMidA = ((x1 + vx1)     ** 2 + (y1 + vy1)     ** 2) ** 0.5;
            const radMidB = ((x1 + vx1 * 2) ** 2 + (y1 + vy1 * 2) ** 2) ** 0.5;
            const radMidC = ((x1 + vx1 * 3) ** 2 + (y1 + vy1 * 3) ** 2) ** 0.5;
            const ang3A = Math.asin((vx1 / radMidA)** (center + 0.5));
            const ang3B = Math.asin((vx1 * 2 / radMidB)** (center + 0.5));
            const ang3C = Math.asin((vx1 * 3 / radMidC)** (center + 0.5));
            const cC = ((radMidA - radiusInner) / (radius - radiusInner)) ** (center + 0.5);
            const cB = ((radMidB - radiusInner) / (radius - radiusInner)) ** (center + 0.5);
            const cA = ((radMidC - radiusInner) / (radius - radiusInner)) ** (center + 0.5);
            const r1 = outerRound / 2;
            const r2 = innerRound / 2;
            len = points * 8;
            x2 = x1;
            y2 = y1;
            x1 = Math.cos(an - ang3A + innerMove * cA) * radMidA;
            y1 = Math.sin(an - ang3A + innerMove * cA) * radMidA;
            for(i = 0; i < len; i ++ ){
                x3 = x1;
                y3 = y1
                x1 = x2;
                y1 = y2;
                const ii = i % 8;
                if(ii === 0) {
                    x2 = Math.cos(an + ang3A + innerMove * cA) * radMidA;
                    y2 = Math.sin(an + ang3A + innerMove * cA) * radMidA;
                    r = r1;
                } else if(ii === 1) {
                    x2 = Math.cos(an + ang3B + innerMove * cB) * radMidB;
                    y2 = Math.sin(an + ang3B + innerMove * cB) * radMidB;
                    r = r1;
                } else if(ii === 2) {
                    x2 = Math.cos(an + ang3C + innerMove * cC) * radMidC;
                    y2 = Math.sin(an + ang3C + innerMove * cC) * radMidC;
                    r = r1;
                } else if(ii === 3) {
                    x2 = Math.cos(an + ang2 + innerMove) * radiusInner;
                    y2 = Math.sin(an + ang2 + innerMove) * radiusInner;
                    r = r2;
                } else if(ii === 4) {
                    an += ang1;
                    x2 = Math.cos(an - ang3C + innerMove * cC) * radMidC;
                    y2 = Math.sin(an - ang3C + innerMove * cC) * radMidC;
                    r = r1;
                } else if(ii === 5) {
                    x2 = Math.cos(an - ang3B + innerMove * cB) * radMidB;
                    y2 = Math.sin(an - ang3B + innerMove * cB) * radMidB;
                    r = r1;
                }  else if(ii === 6) {
                    x2 = Math.cos(an - ang3A + innerMove * cA) * radMidA;
                    y2 = Math.sin(an - ang3A + innerMove * cA) * radMidA;
                    r = r1;
                }  else {
                    x2 = Math.cos(an) * radius;
                    y2 = Math.sin(an) * radius;
                     r = r1;
                }
                if (r <= 0.01) {
                    if(i === 0) {  ctx.moveTo(x1,y1) }
                    else { ctx.lineTo(x1,y1)  }
                } else {
                    vx1 = x2 - x1;
                    vy1 = y2 - y1;
                    vx2 = x3 - x1;
                    vy2 = y3 - y1;
                    a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                    b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                    const min = Math.min(a,b) / 2;
                    c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                    nx1 = vx1 / a;
                    ny1 = vy1 / a;
                    nx2 = vx2 / b;
                    ny2 = vy2 / b;
                    ang = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
                    d1 = Math.sqrt(((r / Math.sin(ang / 2)) ** 2) - r * r);
                    r = d1 < min ? r : r * (min / d1);
                    d1 = d1 < min ? d1 : min;
                    cross = nx1 * ny2 - nx2 * ny1;
                    if (cross < 0) {
                        as = Math.atan2(-nx2, ny2);
                        ae = Math.atan2(nx1, -ny1);
                        x = x1 + nx1 * d1 - (-ny1) * r;
                        y = y1 + ny1 * d1 - nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae, true);
                    } else {
                        as = Math.atan2(nx2, -ny2);
                        ae = Math.atan2(-nx1, ny1);
                        x = x1 + nx1 * d1 + -ny1 * r;
                        y = y1 + ny1 * d1 + nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae);
                    }
                }
            }
            ctx.closePath();
            return ctx;
        },
        roundedStar(ctx, points, outerRound, innerRound, radius, radiusInner) {
            var i,cross, len, x1,y1,x2,y2,x3,y3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2,an,r;
            const ang1 = Math.TAU / points;
            const ang2 = ang1 / 2;
            an = -Math.PI90;
            const r1 = outerRound;
            const r2 = innerRound;
            len = points * 2;
            x2 = Math.cos(an) * radius;
            y2 = Math.sin(an) * radius;
            x1 = Math.cos(an - ang2) * radiusInner;
            y1 = Math.sin(an - ang2) * radiusInner;
            for(i = 0; i < len; i ++ ){
                x3 = x1;
                y3 = y1
                x1 = x2;
                y1 = y2;
                const ii = i % 2;
                if(ii === 0) {
                    x2 = Math.cos(an + ang2) * radiusInner;
                    y2 = Math.sin(an + ang2) * radiusInner;
                    r = r2;
                }  else {
                    an += ang1;
                    x2 = Math.cos(an) * radius;
                    y2 = Math.sin(an) * radius;
                     r = r1;
                }
                if (r <= 0.01) {
                    if(i === 0) {  ctx.moveTo(x1,y1) }
                    else { ctx.lineTo(x1,y1)  }
                } else {
                    vx1 = x2 - x1;
                    vy1 = y2 - y1;
                    vx2 = x3 - x1;
                    vy2 = y3 - y1;
                    a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                    b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                    const min = Math.min(a,b) / 2;
                    c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                    nx1 = vx1 / a;
                    ny1 = vy1 / a;
                    nx2 = vx2 / b;
                    ny2 = vy2 / b;
                    ang = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
                    d1 = Math.sqrt(((r / Math.sin(ang / 2)) ** 2) - r * r);
                    r = d1 < min ? r : r * (min / d1);
                    d1 = d1 < min ? d1 : min;
                    cross = nx1 * ny2 - nx2 * ny1;
                    if (cross < 0) {
                        as = Math.atan2(-nx2, ny2);
                        ae = Math.atan2(nx1, -ny1);
                        x = x1 + nx1 * d1 - (-ny1) * r;
                        y = y1 + ny1 * d1 - nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae, true);
                    } else {
                        as = Math.atan2(nx2, -ny2);
                        ae = Math.atan2(-nx1, ny1);
                        x = x1 + nx1 * d1 + -ny1 * r;
                        y = y1 + ny1 * d1 + nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae);
                    }
                }
            }
            ctx.closePath();
            return ctx;
        },
        roundedGear(ctx, points, outerRoundRadius, innerRoundRadius, radius, radiusInner, edge, edgeInner) {
            var i,cross, len, x1,y1,x2,y2,x3,y3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2,an,r;
            const ang1 = Math.TAU / points;
            const ang2 = ang1 / 2;
            const a1 = (edge / (radius * Math.TAU)) * Math.TAU / 4;
            const a2 = (edgeInner / (radiusInner * Math.TAU)) * Math.TAU / 4;
            var r1 = Math.sin(a1) * radius;
            var r2 = Math.sin(a2) * radiusInner;
            r1 = outerRoundRadius;// < r1 ? outerRoundRadius : r1;
            r2 = innerRoundRadius;// < r2 ? innerRoundRadius : r2;
            len = points * 4;
            an = -Math.PI90
            x1 = Math.cos(an - a1) * radius;
            y1 = Math.sin(an - a1) * radius;
            x2 = Math.cos(an + a1) * radius;
            y2 = Math.sin(an + a1) * radius;
            for(i = 0; i < len; i ++ ){
                x3 = x1;
                y3 = y1
                x1 = x2;
                y1 = y2;
                const ii = i % 4;
                if(ii === 0) {
                    x2 = Math.cos(an + ang2 - a2) * radiusInner;
                    y2 = Math.sin(an + ang2 - a2) * radiusInner;
                    r = r1;
                } else if(ii === 1) {
                    x2 = Math.cos(an + ang2 + a2) * radiusInner;
                    y2 = Math.sin(an + ang2 + a2) * radiusInner;
                    r = r2;
                } else if(ii === 2) {
                    x2 = Math.cos(an + ang1 - a1) * radius;
                    y2 = Math.sin(an + ang1 - a1) * radius;
                    r = r2;
                } else  {
                    x2 = Math.cos(an + ang1 + a1) * radius;
                    y2 = Math.sin(an + ang1 + a1) * radius;
                    r = r1;
                    an += ang1;
                }
                if(r <= 1) {
                    if(i === 0) {
                        ctx.moveTo(x1,y1)
                    }else{
                        ctx.lineTo(x1,y1)
                    }
                } else {
                    vx1 = x2 - x1;
                    vy1 = y2 - y1;
                    vx2 = x3 - x1;
                    vy2 = y3 - y1;
                    a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
                    b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
                    const min = Math.min(a,b) / 2;
                    c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
                    nx1 = vx1 / a;
                    ny1 = vy1 / a;
                    nx2 = vx2 / b;
                    ny2 = vy2 / b;
                    ang = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
                    d1 = Math.sqrt(((r / Math.sin(ang / 2)) ** 2) - r * r);
                    r = d1 < min ? r : r * (min / d1);
                    d1 = d1 < min ? d1 : min;
                    cross = nx1 * ny2 - nx2 * ny1;
                    if (cross < 0) {
                        as = Math.atan2(-nx2, ny2);
                        ae = Math.atan2(nx1, -ny1);
                        x = x1 + nx1 * d1 - (-ny1) * r;
                        y = y1 + ny1 * d1 - nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae, true);
                    } else {
                        as = Math.atan2(nx2, -ny2);
                        ae = Math.atan2(-nx1, ny1);
                        x = x1 + nx1 * d1 + -ny1 * r;
                        y = y1 + ny1 * d1 + nx1 * r;
                        if(i === 0){
                            ctx.moveTo(
                                x + Math.cos(as) * r,
                                y + Math.sin(as) * r
                            );
                        }
                        ctx.arc(x, y, r, as, ae);
                    }
                }
            }
            ctx.closePath();
            return ctx;
        },
        involuteGear(ctx, teeth, addendum, dedendumOffset, angleScaleA, angleScaleB, curveSegRadius) {  // approx
            const INVOLUTE_STEPS = 8;
            const angleStep = Math.TAU / (teeth | 0);
            const hAS = angleStep / 2;
            const aA = hAS * angleScaleA ;
            const r = addendum, r1 = r - dedendumOffset;
            const r2 = ((r1 + curveSegRadius) ** 2 - curveSegRadius * curveSegRadius) ** 0.5;
            const curveAng = Math.asin(curveSegRadius / (r1 + curveSegRadius));
            const aB = hAS * angleScaleB + curveAng;
            const rStep = (r2 - r) / INVOLUTE_STEPS;// aStep = (angleStep - (aA + aB) * 2) / 16;
            var a = 0, x, y, first = true, ri, ai, idx;
            const involute = [];  // angle offset and radius
            const fB = hAS - aB;
            ai = aA;
            const aStep = (fB - aA) / INVOLUTE_STEPS;
            ri = r;
            if ((ai < fB && aStep <= 0) || (ai > fB && aStep >= 0)) { return }
            while (ai < fB) {
                const ang = ((ri * ri) / (r2 * r2) -1) ** 0.5;
                involute.push(
                    ai - aA,
                    (((Math.cos(ang) + ang * Math.sin(ang)) * r2) ** 2 + ((Math.sin(ang) - ang * Math.cos(ang)) * r2) ** 2) ** 0.5
                );
                ai += aStep;
                ri += rStep;
            }



            while (a < Math.TAU - hAS) {


                const fA = a - aA;
                const tA = a + aA;
                const fB = a + hAS - aB;
                const tB = a + hAS + aB;
                if (first) {
                    ctx.moveTo(Math.cos(fA) * r, Math.sin(fA) * r);
                    first = false;
                }
                ctx.arc(0, 0, r, fA, tA);
                idx = 0;
                while (idx < involute.length) {
                    const ang = involute[idx ++] + tA;
                    const dist = involute[idx ++];
                    ctx.lineTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
                }
                ctx.arc(Math.cos(fB + curveAng) * (r1 + curveSegRadius), Math.sin(fB + curveAng) * (r1 + curveSegRadius), curveSegRadius,  fB + curveAng - Math.PI / 2 - curveAng  , fB + curveAng - Math.PI, true)
                ctx.arc(0, 0, r1, fB + curveAng, tB - curveAng);
                ctx.arc(Math.cos(tB - curveAng) * (r1 + curveSegRadius), Math.sin(tB - curveAng) * (r1 + curveSegRadius), curveSegRadius,  tB - curveAng + Math.PI, tB - curveAng + Math.PI - Math.PI / 2 + curveAng, true)
                a += angleStep;
                while (idx > 0) {
                    const dist = involute[--idx];
                    const ang = a - aA - involute[--idx];
                    ctx.lineTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
                }

            }

            ctx.closePath();


        },
        joinedArcs(ctx, x1, y1, r1, x2, y2, r2, r, inside, inner = 0, isIn = false) {
            r1 = r1 < 0 ? 0 : r1;
            r2 = r2 < 0 ? 0 : r2;
            r = r < 0 ? 0 : r;
            const p90 = Math.PI / 2;
            const p180 = Math.PI;
            const TAU = Math.PI * 2;
            const vx = x2 - x1;
            const vy = y2 - y1;
            const ASqr = vx * vx + vy * vy, A = ASqr ** 0.5;
            const iDist = Math.max(r1, r2) - Math.min(r1,r2)

            if (inside) {//A < iDist && A > iDist - r * 2) { // inside
                const B = r1 - r;
                const C = r2 + r;
                const ang = Math.acos((C * C - ASqr - B * B) / (-2 * A * B));
                const angTo = Math.atan2(vy, vx);
                const ax = Math.cos(angTo + ang) * B + x1;
                const ay = Math.sin(angTo + ang) * B + y1;
                const bx = Math.cos(angTo - ang) * B + x1;
                const by = Math.sin(angTo - ang) * B + y1;
                const dist = Math.hypot(ax - bx, ay - by);
                if(dist <= r * 2 || A > r1 + r2 || A < iDist - r * 2) {
                    ctx.moveTo(x1 + r1, y1);
                    ctx.arc(x1, y1, r1, 0, Math.PI * 2);
                    ctx.moveTo(x2 + r2, y2);
                    ctx.arc(x2, y2, r2, 0, Math.PI * 2);

                    if (!isIn && inner !== 0) {
                        this.joinedArcs(ctx, x1, y1, r1 - inner, x2, y2, r2- inner, r + inner, true, 0, true)
                    }

                } else {


                    const af = Math.atan2(ay - y1, ax - x1); // from
                    const at = Math.atan2(by - y1, bx - x1); // to
                    const bf = Math.atan2(ay - y2, ax - x2); // from
                    const bt = Math.atan2(by - y2, bx - x2); // to

                    ctx.moveTo(x1 + Math.cos(af) * r1, y1  + Math.sin(af) * r1);
                    ctx.arc(x1, y1, r1, af, at);

                    let att = (at + TAU) % TAU;
                    let btt = (bt + TAU - p180) % TAU;
                    let aff = (af + TAU) % TAU;
                    let bff = (bf + TAU - p180) % TAU;

                    ctx.arc(bx, by, r,  att, btt);

                    ctx.arc(x2, y2, r2, bt, bf, true);

                    ctx.arc(ax, ay, r,  bff , aff);

                    if (!isIn && inner !== 0) {
                        this.joinedArcs(ctx, x1, y1, r1 - inner, x2, y2, r2 + inner, r - inner,true, 0, true)
                    }
                }


            } else {

                const B = r1 + r;
                const C = r2 + r;

                const ang = Math.acos((C * C - ASqr - B * B) / (-2 * A * B));
                const angTo = Math.atan2(vy, vx);

                const ax = Math.cos(angTo + ang) * B + x1;
                const ay = Math.sin(angTo + ang) * B + y1;
                const bx = Math.cos(angTo - ang) * B + x1;
                const by = Math.sin(angTo - ang) * B + y1;

                const dist = Math.hypot(ax - bx, ay - by);

                if(dist <= r * 2 || A > r1 + r2 + r || A < iDist) {
                    ctx.moveTo(x1 + r1, y1);
                    ctx.arc(x1, y1, r1, 0, Math.PI * 2);
                    ctx.moveTo(x2 + r2, y2);
                    ctx.arc(x2, y2, r2, 0, Math.PI * 2);

                    if (!isIn && inner !== 0) {
                        this.joinedArcs(ctx, x1, y1, r1 - inner, x2, y2, r2- inner, r + inner,false, 0, true)
                    }

                } else {

                    const af = Math.atan2(ay - y1, ax - x1); // from
                    const at = Math.atan2(by - y1, bx - x1); // to
                    const bf = Math.atan2(ay - y2, ax - x2); // from
                    const bt = Math.atan2(by - y2, bx - x2); // to

                    ctx.moveTo(x1 + Math.cos(af) * r1, y1  + Math.sin(af) * r1);
                    ctx.arc(x1, y1, r1, af, at);
                    ctx.arc(bx, by, r,  at + p180 , bt + p180, true );
                    ctx.arc(x2, y2, r2, bt, bf);
                    ctx.arc(ax, ay, r,  bf + p180 , af + p180, true );
                    if (!isIn && inner !== 0) {
                        this.joinedArcs(ctx, x1, y1, r1 - inner, x2, y2, r2- inner, r + inner, false,0, true)
                    }
                }
            }
        },
        compoundCircles(circles, x, y, r, cut = false) {
            var vx, vy, d, d2, nvx, nvy, inside, outside, overlap, c1, c2, i, p1, p2, pc1, pc2, s1, e1, s2, e2, a;
            function compare(c1, c2) {
                vx = c2.x - c1.x;
                vy = c2.y - c1.y;
                d2 = vx * vx + vy * vy;
                d = d2 ** 0.5;
                a = Math.atan2(vy, vx);
                a = ((a % Math.TAU) + Math.TAU) % Math.TAU;
                inside = d + c2.r < c1.r;
                outside = d > (c2.r + c1.r);
                overlap = !inside && !outside;
                pc1 = (c2.r * c2.r - c1.r * c1.r - d2) / (-2 * c1.r * d);
                pc2 = (c1.r * c1.r - c2.r * c2.r - d2) / (-2 * c2.r * d);
                p2 = pc1 * c1.r > d ?  Math.PI - Math.acos(pc2) : Math.acos(pc2);
                p1 = Math.acos(pc1);
                s1 = a + (c1.cut ? -p1 : p1);
                e1 = a + (c1.cut ? p1 : Math.TAU - p1);
                s2 = a + Math.PI + (c2.cut ? p2 : -p2);
                e2 = a + Math.PI + (c2.cut ? -p2 : p2);
            }
            const s = cut ? Math.TAU : 0, e = cut ? 0 : Math.TAU;

            const cir = {x, y, r, s, e, cut, vis: true};
            i = 0;
            while (i < circles.length) {
                c1 = circles[i];
                c2 = cir;
                if (c1.r < c2.r) {
                    c1 = cir;
                    c2 = circles[i];
                }
                compare(c1, c2);
                if (inside) {
                    if (c1.cut && !c2.cut) {
                        c1.vis = c2.vis = true;
                    } else if (!c1.cut && c2.cut) {
                        c1.vis = c2.vis = true;
                    } else if (c1.cut === c2.cut) {
                        c2.vis = false;
                    }
                } else if(outside) {
                    c1.vis = c2.vis = true;
                } else {
                    c1.vis = c2.vis = true;
                }
                if (overlap) {

                }





            }


        },
        polyPoints: (()=> {
            const sideArray = [];
            for(var sides = 3; sides < 17; sides ++) {
                const pol = [];
                for(var a = 0; a < sides; a++) {
                    const ang = (a / sides) * Math.TAU - Math.PI90;
                    pol.push(Math.cos(ang), Math.sin(ang));
                }
                sideArray.push(pol);
            }
            return sideArray;
        })(),
        shadowShapeState(shape, spr) {
            var state;
            if (shape.scaleable) {
                state = shape.shapeState === undefined ? shape.shapeState = {} : shape.shapeState;
            } else {
                state = spr.shapeState === undefined ? spr.shapeState = {} : spr.shapeState;
            }

            state.force = false;
            state.radius =  shape.radius;
            state.inner = shape.inner;
            state.sides = shape.sides;
            state.valA = shape.valA;
            state.valB = shape.valB;
            state.w = spr.w;
            state.h = spr.h;
        },
    }
    function draw(c, spr) {
        var update = false;
        if (spr.shape.scaleable) {
            if (spr.shape.path === undefined){
                shapeUtils.shadowShapeState(this, spr);
                update = true;
            }
            if (this.needUpdate(spr) || update){
                spr.shape.path = new Path2D();
                spr.shape.path.fillRule = "evenodd";
                this.create(spr.shape.path, spr);
            }
            spr.shapePath = spr.shape.path;
        } else {
            if (spr.shapePath === undefined){
                shapeUtils.shadowShapeState(this, spr);
                update = true;
            }
            if (this.needUpdate(spr) || update){
                spr.shapePath = new Path2D();
                spr.shapePath.fillRule = "evenodd";
                this.create(spr.shapePath, spr);
            }
        }
    }

    function serial() {
        const def = shapeDefaults[this.name] ? shapeDefaults[this.name]: shapeDefaults.defaults;
        const ser = {
            radius: this.radius !== def.radius ? this.radius : undefined,
            inner: this.inner !== def.inner ? this.inner : undefined,
            sides: (this.sides + 0.5 | 0) !== def.sides  ? (this.sides + 0.5 | 0): undefined,
            valA: this.valA !== def.valA ? this.valA : undefined,
            valB: this.valB !== def.valB ? this.valB : undefined,
            valC: this.valC !== def.valC ? this.valC : undefined,
            valD: this.valD !== def.valD ? this.valD : undefined,
            w: this.w !== 256 ? this.w : undefined,
            h: this.h !== 256 ? this.h : undefined,

        };
        if (this.isCompound) {
            ser.joinedIDS = [...this.joined.values()].map(spr => spr.guid);
        }

        return ser;
    }
    function deserial(shape) {
        const def = shapeDefaults[shape.name] ? shapeDefaults[shape.name]: shapeDefaults.defaults;
        this.radius = shape.radius !== undefined ? shape.radius : def.radius;
        this.inner = shape.inner !== undefined ? shape.inner : def.inner;
        this.sides = shape.sides !== undefined ? shape.sides : def.sides;
        this.valA = shape.valA !== undefined ? shape.valA : def.valA;
        this.valB = shape.valB !== undefined ? shape.valB : def.valB;
        this.valC = shape.valC !== undefined ? shape.valC : def.valC;
        this.valD = shape.valD !== undefined ? shape.valD : def.valD;
        this.w = shape.w !== undefined ? shape.w : 256;
        this.h = shape.h !== undefined ? shape.h : 256;
        shape.joinedIDS && (this.joinedIDS = shape.joinedIDS);

    }
    function needUpdate(spr) {
        var state, update = false;
        if (this.update && this.update !== frameCount) { this.update = 0 }
        if (this.scaleable) {
            state = this.shapeState === undefined ? this.shapeState = {} : this.shapeState;
        } else {
            state = spr.shapeState === undefined ? spr.shapeState = {} : spr.shapeState;
        }
        if(state.force) { update = true; state.force = false }
        if(state.w !== spr.w) { update = true; state.w = spr.w }
        if(state.h !== spr.h) { update = true; state.h = spr.h }
        if(state.radius !== this.radius) { update = true; state.radius = this.radius }
        if(state.inner !== this.inner) { update = true; state.inner = this.inner }
        if(state.sides !== this.sides) { update = true; state.sides = this.sides }
        if(state.valA !== this.valA) { update = true; state.valA = this.valA }
        if(state.valB !== this.valB) { update = true; state.valB = this.valB }
        if(state.valC !== this.valC) { update = true; state.valC = this.valC }
        if(state.valD !== this.valD) { update = true; state.valD = this.valD }
        if(this.update) { update = true }
        if (!update && spr.shape.isCompound) {
            if(spr.changed) { return true }
            if(spr.shape.joined && spr.shape.joined.size) {
                if(state.joined !== spr.shape.joined.size) { update = true; state.joined = spr.shape.joined.size }
                else if (!update) {
                    for (const s of spr.shape.joined.values()) {
                        if (s.changed) {
                            update = true;
                            break;
                        }
                    }
                }
            } else {
                if (state.joined) { update = true; state.joined = 0 }
                else { state.joined = 0 }
            }

        }
        if (update && spr.ofShapes) {
            for (const s of spr.ofShapes.values()) {
                if (s.canJoinShapes) { s.update = frameCount }
            }
        }
        return update;
    }
    function needUpdate_notvAB(spr) {
        var update = false;
        var state;
        if (this.scaleable && !this.updateOnlyGroup) {
            state = this.shapeState === undefined ? this.shapeState = {} : this.shapeState;
        } else {
            state = spr.shapeState === undefined ? spr.shapeState = {} : spr.shapeState;
        }
        if(state.force) { update = true; state.force = false }
        if(state.w !== spr.w) { update = true; state.w = spr.w }
        if(state.h !== spr.h) { update = true; state.h = spr.h }
        if(state.radius !== this.radius) { update = true; state.radius = this.radius }
        if(state.inner !== this.inner) { update = true; state.inner = this.inner }
        if(state.sides !== this.sides) { update = true; state.sides = this.sides }
        //if(state.valA !== this.valA) { update = true; state.valA = this.valA }
        //if(state.valB !== this.valB) { update = true; state.valB = this.valB }
        return update;
    }
    function snapper(spr, addLine){
        addLine(spr.x, spr.y, spr.rx,0);
        addLine(spr.x, spr.y, spr.ry,1);
        var sizeX = Math.abs(spr.w) / 2;
        var sizeY = Math.abs(spr.h) / 2;
        spr.key.toWorld(sizeX, sizeY);
        addLine(spr.key.wx, spr.key.wy, spr.rx,0);
        addLine(spr.key.wx, spr.key.wy, spr.ry,1);
        addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
        addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);
    };
    function snapperCenters(spr, addLine){
        const x = spr.x, y = spr.y;
        const c = spr.shapeCenters;
        const k = spr.key;
        addLine(x, y, spr.rx,0);
        addLine(x, y, spr.ry,1);
        k.toWorld(c[0], c[1]);
        addLine(k.wx, k.wy, spr.rx,0);
        addLine(k.wx, k.wy, spr.ry,1);
        k.toWorld(c[2], c[3]);
        addLine(k.wx, k.wy, spr.rx,0);
        addLine(k.wx, k.wy, spr.ry,1);
        k.toWorld(c[4], c[5]);
        addLine(k.wx, k.wy, spr.rx,0);
        addLine(k.wx, k.wy, spr.ry,1);
        k.toWorld(c[6], c[7]);
        addLine(k.wx, k.wy, spr.rx,0);
        addLine(k.wx, k.wy, spr.ry,1);
        var sizeX = Math.abs(spr.w) / 2;
        var sizeY = Math.abs(spr.h) / 2;
        k.toWorld(sizeX, sizeY);
        addLine(k.wx, k.wy, spr.rx,0);
        addLine(k.wx, k.wy, spr.ry,1);
        addLine(x - k.wrx, y - k.wry, spr.rx,0);
        addLine(x - k.wrx, y - k.wry, spr.ry,1);
    };
    function snapperInner(spr, addLine){
        addLine(spr.x, spr.y, spr.rx,0);
        addLine(spr.x, spr.y, spr.ry,1);
        var w = Math.abs(spr.w) / 2;
        var h = Math.abs(spr.h) / 2;
        spr.key.toWorld(w, h);
        addLine(spr.key.wx, spr.key.wy, spr.rx,0);
        addLine(spr.key.wx, spr.key.wy, spr.ry,1);
        addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
        addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);
        if(this.inner > 0 && this.inner < Math.min(w,h)) {
            w -= this.inner;
            h -= this.inner;
            spr.key.toWorld(w, h);
            addLine(spr.key.wx, spr.key.wy, spr.rx,0);
            addLine(spr.key.wx, spr.key.wy, spr.ry,1);
            addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
            addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);
        }
    };
    function compoundJoin(spr) {
        if ((this.canJoinShapes === true && spr.type.shape) || this.canJoinShapes !== true) {
            this.joined.add(spr);
            spr.type.compoundShape = true;
            if (spr.ofShapes === undefined) { spr.ofShapes = new Set() }
            spr.ofShapes.add(this);
            this.update = frameCount;
        }
    }
    function compoundUnjoin(spr) {
        if (this.joined) {
            this.joined.delete(spr);
        }
        if (spr.ofShapes) {
            spr.ofShapes.delete(this);
            if(spr.ofShapes.size === 0) {
                spr.type.compoundShape = false;
                delete spr.ofShapes;
            }
        } else {
            spr.type.compoundShape = false;
        }
        this.update = frameCount;

    }
    const SVGPath = {
        get SVGType() {return {name: "path", atts: {d: ""}} },
        SVG(spr, pCtx, att) {
            this.create(pCtx, spr)
            if(this.strokeWidth){
                att["stroke-width"] = this.strokeWidth.toFixed(SVGDig).replace(SVGForNum, "");
                att.stroke = "##RGBA##";
                att.class = "stroke";
            } else {
                att.fill = "##RGBA##";
                att.class = "fill";
            }
        },
    }
    const defaultNames = {sides: "Sides", inner: "Thickness", radius: "Radius", valA: "Staet ang", valB: "Sweep", valC: "NA", valD: "Stroke", updateOnlyGroup: false};
    const defaultLockNames = {sides: "Fillrule", inner: "NA", radius: "NA", valA: "NA", valB: "NA", valC: "NA", valD: "Stroke"};
    const defaultProps = {APIName:"Shape", canBake: true, bakeFixed: true};

    const shapeDefaults = {
        defaults:       {...defaultProps, inner: 0,   valA: 0,   valB: 0,       valC: 0,  valD: -4,     sides: 1,  radius : 0,   names: {...defaultNames}},
        circle:         {...defaultProps, inner: 0,   valA: 0,   valB: 0,       valC: 0,  valD: -4,     sides: 1,  radius : 0,   names: {...defaultNames, valC: "Inner size"}},
        ellipse:        {...defaultProps, inner: 0,   valA: 0,   valB: 0,       valC: 0,  valD: -4,     sides: 0,  radius : 0,   names: {...defaultNames}},
        square:         {...defaultProps, inner: 0,   valA: 0,   valB: 0.5,     valC: 0,  valD: -4,     sides: 0,  radius : 8,   names: {...defaultNames, valB: "NA", valA: "NA", sides: "NA"}},
        rectangle:      {...defaultProps, inner: 0,   valA: 0,   valB: 0.5,     valC: 0,  valD: -4,     sides: 0,  radius : 8,   names: {...defaultNames}},
        polygon:        {...defaultProps, inner: 0,   valA: 0,   valB: 0.0,     valC: 0,  valD: -4,     sides: 5,  radius : 8,   names: {...defaultNames, valB: "Rotate", valA: "NA"}},
        poly:           {...defaultProps, inner: 0,   valA: 0,   valB: 0.0,     valC: 0,  valD: -4,     sides: 5,  radius : 8,   names: {...defaultNames, valB: "Rotate", valA: "NA"}},
        star:           {...defaultProps, inner: 0,   valA: 0,   valB: 0,       valC: 0,  valD: -4,     sides: 5,  radius : 8,   names: {...defaultNames, sides: "Points", valA: "Inner", valB: "Rotate"}},
        gear:           {...defaultProps, inner: 20,  valA: -2,  valB: -2,      valC: 0,  valD: -4,     sides: 16, radius : 8,   names: {...defaultNames, sides: "Teeth", inner: "Depth", radius: "CurveR", valA: "Out Ang", valB: "In Ang", }},
        cone:           {...defaultProps, inner: 0,   valA: 2,   valB: 0,       valC: 0,  valD: -4,     sides: 0,  radius : 16,  names: {...defaultNames, valA: "Tapper", valB: "Skew"}},
        compoundShape:  {...defaultProps, inner: 0,   valA: 0,   valB: 0,       valC: 0,  valD: -4,     sides: 1,  radius : 10,  names: {...defaultNames, updateOnlyGroup: true, radius: "Join Rad", valB: "NA", valA: "NA"}},
        compoundCircle: {...defaultProps, inner: 0,   valA: 0,   valB: 0,       valC: 0,  valD: -4,     sides: 1,  radius : 10,  names: {...defaultNames, radius: "Join Rad", valB: "NA", valA: "NA"}},
        compoundLine:   {...defaultProps, inner: 16,  valA: 0,   valB: 0,       valC: 4,  valD: -4,     sides: 1,  radius : 0,   names: {...defaultNames, valB: "Start", valA: "Offset", valC: "Length"}},
        arrow:          {...defaultProps, inner: 16,  valA: 0.5, valB: -1.75,   valC: 0,  valD: -4,     sides: 3,  radius : 0,   names: {...defaultNames, valB: "Head W", valA: "Head H"}},
        angleArrow:     {...defaultProps, inner: 16,  valA: -2,  valB: 0,       valC: 0,  valD: -4,     sides: 3,  radius : 0,   names: {...defaultNames,radius: "NA", valB: "NA", valA: "Angle"}},
        vector:         {...defaultProps, inner: 8,   valA: -3,  valB: 2,       valC: -0, valD: -4,     sides: 1,  radius : 256,   names: {...defaultNames, sides: "NA", inner: "In Radius", radius: "Out Radius",valC: "Corner", valB: "Tolerance", valA: "Detail"}},
        vectorCommited: {...defaultProps, inner: 0,   valA: -4,   valB: 0,       valC: -4, valD: -4,     sides: 1,  radius : 0,   names: {...defaultNames, sides: "Type", inner: "In Radius", radius: "Out Radius",valC: "Min len", valB: "Corner", valA: "Area"}},
        tube:           {...defaultProps, inner: 128, valA: 0,   valB: 0,       valC: 0,  valD: -3.95,  sides: 6,  radius : 0,   names: {...defaultNames, inner: "Sweep", radius: "Angle", valA: "Pitch", valB: "Roll"}},
        sphere:         {...defaultProps, inner: 0,   valA: 0,   valB: 2.2,     valC: 0,  valD: -4,     sides: 4,  radius : 100, names: {...defaultNames, valA: "Pitch", valB: "Roll"}},
    };
    const spriteShapes = {
        circle: {
            name: "circle",
            isSquare: true,
            serial, deserial, needUpdate,  draw,
            ...shapeDefaults.circle,
            get id() { return getGUID() },
            ...SVGPath,
            snapper(spr, addLine){
                addLine(spr.x, spr.y, spr.rx,0);
                addLine(spr.x, spr.y, spr.ry,1);
                var size = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2;
                spr.key.toWorld(size, size);
                addLine(spr.key.wx, spr.key.wy, spr.rx,0);
                addLine(spr.key.wx, spr.key.wy, spr.ry,1);
                addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
                addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);

                if (this.inner > 0 && this.inner < size * 2) {
                    size -= this.inner;
                    spr.key.toWorld(size, size);
                    addLine(spr.key.wx, spr.key.wy, spr.rx,0);
                    addLine(spr.key.wx, spr.key.wy, spr.ry,1);
                    addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
                    addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);
                }
            },
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                var r,outR,r1,angOffset, size = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2;
                var stroke = false;
                if (this.valD > -4) {
                    size -= (this.strokeWidth = (this.valD + 4) * 32) / 2;
                    stroke = true;
                } else { this.strokeWidth = 0 }
                const INNER = this.inner / 256 * size;
                if (this.valB !== 0) {
                    var sides = Math.min(this.sides, (4 / this.valB | 0));
                    sides = sides < 1 ? 1 : sides;
                    const step = 4 / sides;
                    var start = this.valA;
                    const inner = size - INNER
                    const cc = this.valC < 0 ? (this.valC / 4) * (this.valB / 2)  : (this.valC / 4) * (4 - (this.valB * (sides < 2 ? 2 : sides))) / 2;
                    while(sides--){
                        if (INNER > 0 && INNER < size) {
                            if (this.radius > 0) {
                                if (this.valC !==  0) {


                                    shapeUtils.roundCornerCircleLine(
                                        c, size, inner,
                                        start * Math.PI90,
                                        (start + this.valB) * Math.PI90,
                                        (start - cc) * Math.PI90,
                                        (start + (this.valB + cc)) * Math.PI90,
                                        this.radius
                                    );
                                } else {
                                    var r = this.radius < INNER / 2 ? this.radius : INNER / 2;
                                    var outR = size - r;
                                    const p = r / outR;
                                    var r1 = (p * inner) / (1 - p);
                                    var angOffset = Math.asin(p);
                                    if(r + r1 >= INNER) {
                                        r = INNER - r1;
                                        outR = size - r;
                                        angOffset = Math.asin(r / outR)
                                    }
                                    if(angOffset > this.valB) {
                                        angOffset -= (angOffset - this.valB) / 2;
                                    }
                                    const a = start * Math.PI90 + angOffset;
                                    const b = (start + this.valB) * Math.PI90 -angOffset;
                                    const be = b + angOffset + Math.PI90;
                                    const ae = a - angOffset + Math.PI270;
                                    const inR = inner + r1;
                                    c.moveTo(Math.cos(a) * size, Math.sin(a) * size);
                                     c.arc(0, 0, size, a, b);
                                    c.arc(Math.cos(b) * outR, Math.sin(b) * outR, r, b, be);
                                    c.arc(Math.cos(b) * inR, Math.sin(b) * inR, r1, be, b + Math.PI);
                                    c.arc(0, 0, inner, b, a, true);
                                    c.arc(Math.cos(a) * inR, Math.sin(a) * inR, r1, a + Math.PI, ae);
                                    c.arc(Math.cos(a) * outR, Math.sin(a) * outR, r, ae, a + Math.TAU);
                                }
                            }else{
                                c.moveTo(Math.cos( start * Math.PI90) * size, Math.sin( start * Math.PI90) * size);
                                c.arc(0, 0, size, start * Math.PI90, (start + this.valB) * Math.PI90);
                                if (this.valC !==  0) {
                                    c.arc(0, 0, inner, (start + (this.valB + cc)) * Math.PI90, (start - cc) * Math.PI90, true);
                                } else {
                                    c.arc(0, 0, inner, (start + this.valB) * Math.PI90, start * Math.PI90, true);
                                }
                            }
                            c.closePath();
                        } else {
                            if (this.radius > 0) {
                                const sizeIn = size - this.radius;
                                const angOffset = Math.asin(this.radius / sizeIn);
                                const a = start * Math.PI90 + angOffset;
                                const b = (start + this.valB) * Math.PI90 -angOffset;
                                c.moveTo(0, 0);
                                c.arc(Math.cos(a) * sizeIn, Math.sin(a) * sizeIn, this.radius, a - angOffset - Math.PI90, a);
                                c.arc(0, 0, size, a , b);
                                c.arc(Math.cos(b) * sizeIn, Math.sin(b) * sizeIn, this.radius, b, b + angOffset + Math.PI90);
                                c.closePath();
                            } else {
                                stroke ? c.moveTo(Math.cos(start* Math.PI90) * size, Math.sin(start* Math.PI90) * size) : c.moveTo(0, 0);
                                c.arc(0, 0, size, start* Math.PI90, (start + this.valB) * Math.PI90);
                                !stroke && c.closePath();
                            }
                        }

                        start += step;
                   }
                } else {
                    c.arc(0,0, size, 0, Math.PI2) ;
                    if(INNER > 0 && INNER < size) {
                        c.moveTo(size - INNER, 0);
                        c.arc(0,0,size - INNER, 0, Math.PI2);
                        if (this.sides > 1) {
                            let sides = this.sides - 1;
                            let r = size;
                            let step = (r - INNER / 2) / sides;
                            while (sides > 1) {
                                r -= step;
                                c.arc(0, 0, r, 0, Math.PI2);
                                if (r - INNER > 0) {
                                    c.arc(0, 0, r - INNER, 0, Math.PI2);
                                    sides--;
                                } else { break }
                            }
                            if (r - step > 0) {
                                c.arc(0, 0, r - step, 0, Math.PI2);
                            }
                        }
                    }
                    c.closePath();
                }


            },
        },
        ellipse: {
            name: "ellipse",
            serial, deserial, draw, snapper: snapperInner,
            isSquare: false,
            ...shapeDefaults.ellipse,
            get id() { return getGUID() },
            ...SVGPath,
            needUpdate(spr) {
                var update = false;
                const state = spr.shapeState === undefined ? spr.shapeState = {} : spr.shapeState;
                if(state.w !== spr.w) { update = true; state.w = spr.w }
                if(state.h !== spr.h) { update = true; state.h = spr.h }
                if(state.inner !== this.inner) { update = true; state.inner = this.inner }
                if(state.valA !== this.valA) { update = true; state.valA = this.valA }
                if(state.valB !== this.valB) { update = true; state.valB = this.valB }
                if(state.valD !== this.valD) { update = true; state.valD = this.valD }
                if(state.sides !== this.sides) { update = true; state.sides = this.sides }
                return update;
            },
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                var w = spr.w, h = spr.h, close = true;
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                    w -= this.strokeWidth;
                    h -= this.strokeWidth;
                    close = false;
                } else { this.strokeWidth = 0 }

                const w2 = w / 2, h2 = h / 2;
                if (this.valB !== 0 && this.valB < 4 && this.valB > -4) {
                    const a = this.valA * Math.PI90;
                    const b = this.valB * Math.PI90
                    var sides = Math.min(this.sides, (4 / this.valB | 0));
                    sides = sides < 1 ? 1 : sides;
                    const step = (4 / sides) * Math.PI90;

                    if(!close) {
                        var i = 0;
                        while (i < sides) {
                            c.moveTo(Math.cos(a + i * step) * w2, Math.sin(a + i * step) * h2);
                            c.ellipse(0, 0, w2, h2, 0, a + i * step, a + i * step + b);
                            i ++;
                        }
                    } else {
                        var i = 0;
                        if(this.inner === 0 || this.inner >= Math.min(w2, h2)) {
                            while (i < sides) {
                                c.moveTo(0,0);
                                c.ellipse(0, 0, w2, h2, 0, a + i * step, a + i * step + b);
                                c.closePath();
                                i ++;
                            }
                        } else {
                            const inn = this.inner;
                            while (i < sides) {
                                c.moveTo(Math.cos(a + i * step) * w2, Math.sin(a + i * step) * h2);
                                c.ellipse(0, 0, w2, h2, 0, a + i * step, a + i * step + b);
                                c.ellipse(0, 0, w2 - inn, h2 - inn,0 ,a + i * step + b, a + i * step, true);
                                c.closePath();
                                i++;
                            }
                        }
                    }
                } else {
                    c.ellipse(0, 0, w2, h2, 0, 0, Math.PI2)
                    if(this.inner > 0 && this.inner < Math.min( w2, h2)) {
                        c.moveTo(w2 - this.inner, 0);
                        c.ellipse(0, 0, w2 - this.inner , h2 - this.inner, 0, 0, Math.PI2);
                    }
                }

            },
        },
        square: {
            name: "square",
            serial, deserial, draw,
            ...shapeDefaults.square,
            isSquare: true,
            get id() { return getGUID() },
            ...SVGPath,
            needUpdate(spr) {
                var update = false;
                const state = spr.shapeState === undefined ? spr.shapeState = {} : spr.shapeState;
                if(state.w !== spr.w) { update = true; state.w = spr.w }
                if(state.h !== spr.h) { update = true; state.h = spr.h }
                if(state.radius !== this.radius) { update = true; state.radius = this.radius }
                if(state.inner !== this.inner) { update = true; state.inner = this.inner }
                if(state.valD !== this.valD) { update = true; state.valD = this.valD }
                return update;
            },
            snapper(spr, addLine){
                var size = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2;
                spr.key.toWorld(size, size);
                addLine(spr.key.wx, spr.key.wy, spr.rx,0);
                addLine(spr.key.wx, spr.key.wy, spr.ry,1);
                addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
                addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);

                if (this.inner > 0 && this.inner < size * 2) {
                    size -= this.inner;
                    spr.key.toWorld(size, size);
                    addLine(spr.key.wx, spr.key.wy, spr.rx,0);
                    addLine(spr.key.wx, spr.key.wy, spr.ry,1);
                    addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.rx,0);
                    addLine(spr.x - spr.key.wrx, spr.y - spr.key.wry, spr.ry,1);
                }
            },
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                var size = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2;
               if (this.valD > -4) {
                    size -= (this.strokeWidth = (this.valD + 4) * 32) / 2;
                } else { this.strokeWidth = 0 }
                const r = this.radius < size ? this.radius : size;
                if(this.radius > 0) {
                    shapeUtils.roundedPath(c, [-size, -size, size, -size, size, size, -size, size], r);
                    if (this.inner > 0 && this.inner < size) {
                        size -= this.inner;
                        if (this.inner < r) {
                            shapeUtils.roundedPath(c, [-size, -size, size, -size, size, size, -size, size], r - this.inner);
                        } else {
                            c.rect(-size, -size , size * 2, size * 2);
                        }
                    }
                } else {
                    c.rect(-size, -size, size * 2, size * 2);
                    if (this.inner > 0 && this.inner < size * 2) {
                        size -= this.inner;
                        c.rect(-size, -size, size * 2, size * 2);
                    }
                }

            },
        },
        rectangle: {
            name: "rectangle",
            serial, deserial, draw, snapper : snapperInner,
            isSquare: false,
            ...shapeDefaults.rectangle,
            get id() { return getGUID() },
            ...SVGPath,
            needUpdate,
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                var w = Math.abs(spr.w) / 2;
                var h = Math.abs(spr.h) / 2;
                var mSize = Math.min(w,h);
                if (this.valD > -4) {
                   const sw = (this.valD + 4) * 32;
                    this.strokeWidth = sw;
                    w -= sw / 2;
                    h -= sw / 2;
                    mSize -= sw / 2;
                } else { this.strokeWidth = 0 }
                var r = this.radius < mSize ? this.radius : mSize;
                if (this.inner > 0) {
                    if (r > 0) {
                        shapeUtils.roundedPath(c, [-w, -h, w, -h, w, h, -w, h],  r);
                    } else {
                        c.rect(-w, -h, w * 2, h * 2);
                    }
                    if(this.inner < mSize) {
                        const max = Math.floor((h - this.inner) / (Math.max(1,Math.min(r - this.inner,this.inner ))));
                        var sides = Math.floor(this.sides < 1 ? 1 : this.sides > max ? max : this.sides);
                        const hStep = (h * 2 - this.inner) / sides;
                        const hs = (h * 2 - this.inner) / sides - this.inner;
                        var hStart = -h + this.inner;
                        w -= this.inner;
                        while(sides--) {
                            if (r > 0 && this.inner < r) {
                                shapeUtils.roundedPath(c, [-w, hStart, w, hStart, w, hStart + hs, -w, hStart + hs], r - this.inner);
                            } else {
                                c.rect(-w, hStart, w * 2, hs);
                            }
                            hStart += hStep;
                        }
                    }
                } else {
                    var sides = this.sides < 1 ? 1 : this.sides;
                    if(sides === 1) {
                        if (r > 0) {
                            shapeUtils.roundedPath(c, [-w, -h, w, -h, w, h, -w, h],  r);
                        } else {
                            c.rect(-w, -h, w * 2, h * 2);
                        }
                    } else {
                        var dist = w * 2 / sides;
                        var xPos = -w;
                        var ww = dist * (this.valB < (1 /dist) ? 1 / dist : this.valB);
                        dist += (dist - ww) / (sides - 1);
                        xPos += dist * (this.valA % 1);
                        mSize = Math.min(ww / 2, h);
                        var r = this.radius < mSize ? this.radius : mSize;
                        while (sides--) {
                            if (r > 0) {
                                shapeUtils.roundedPath(c, [xPos, -h, xPos + ww, -h, xPos + ww, h, xPos, h], r);
                            } else {
                                c.rect(xPos, -h, ww, h * 2);
                            }
                            xPos += dist;
                        }
                    }
                }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
            },
        },
        cone: {
            name: "cone",
            serial, deserial, needUpdate, draw, snapper: snapperCenters,
            isSquare: false,
            ...shapeDefaults.cone,
            get id() { return getGUID() },
            ...SVGPath,
            points: [],
            create(c, spr) {
                if (spr.shapeCenters === undefined){
                    spr.shapeCenters = [];
                    spr.shapeCenters.size = 0;
                }
                if (spr.snapFunc === undefined){
                    spr.setSnaps(this.snapper.bind(this))
                }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                const p = workArray; // spriteShapes.cone.points;
                const h = Math.abs(spr.h / 2);
                const w = Math.abs(spr.w / 2);
                const lh = this.valA < 0 ? 1 + this.valA / 4 : 1;
                const rh = this.valA > 0 ? 1 - this.valA  / 4: 1;
                const skew = this.valB / 4;
                const inn = this.inner / 4;
                const r1 = this.radius < 0 ? 0 : this.radius;;
                const LR = 1- lh;
                const RR = 1- rh;

                //const LH = h - lh * h;
                //const RH = h - rh * h;
                const LS = lh < 1 ? h * (1 - lh) * skew : 0;
                const RS = rh > 0 ? h * (1 - rh) * skew : 0;

                var lx = -w;
                var ly = h * lh;
                var rx = w;
                var ry = h * rh;

                const slR = -(ry - ly) / (rx - lx);


                var idx = 0;

                p[idx++] = lx;
                p[idx++] = (lh === 0 ? 0 : -ly) + LS;
                p[idx++] = r1;
                p[idx++] = rx;
                p[idx++] = (rh === 0 ? 0 : -ry) + RS;
                p[idx++] = r1;
                if (rh !== 0) {
                    p[idx++] = rx;
                    p[idx++] = ry + RS;
                    p[idx++] = r1;
                }
                if (lh !== 0) {
                    p[idx++] = lx;
                    p[idx++] = ly + LS;
                    p[idx++] = r1;
                }
                p.size = idx;
                shapeUtils.roundedPathRadius(c, p, inn);

            },
        },
        polygon: {
            name: "polygon",
            serial, deserial, needUpdate, draw, snapper,
            isSquare: true,
            ...shapeDefaults.polygon,
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                var i, idx = 0, ang = -Math.PI * 0.5, s = (this.sides + 0.5 | 0);
                s = s < 3 ? 3 : s;
                const angStep = (Math.PI * 2) / s;
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                var size = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2 - this.strokeWidth / 2;
                const inn = this.inner < 0 ? 0 : this.inner / 256 * size;
                const r = this.radius < 0 ? 0 : this.radius;
                ang += (this.valB / 4) * Math.PI;

                const p = workArray;
                i = 0;
                while(i < s) {
                    p[idx++] = Math.cos(ang) * size;
                    p[idx++] = Math.sin(ang) * size;
                    p[idx++] = r;
                    i ++;
                    ang += angStep;
                }
                workArray.size = idx;
                shapeUtils.roundedPathRadius(c, p, inn);
            },
        },
        poly: {
            name: "poly",
            serial, deserial, needUpdate, draw, snapper,
            isSquare: false,
            ...shapeDefaults.poly,
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                var i = 0, idx = 0, ang = -Math.PI * 0.5, s = (this.sides + 0.5 | 0);
                s = s < 3 ? 3 : s;
                var sw = 0;
                if (this.valD > -4) { sw = (this.strokeWidth = (this.valD + 4) * 32) / 2 }
                else { this.strokeWidth = 0 }
                const angStep = (Math.PI * 2) / s;
                var sizeW = Math.abs(spr.w) / 2 - sw;
                var sizeH = Math.abs(spr.h) / 2 - sw;
                const inn = this.inner < 0 ? 0 : this.inner / 4;
                const r = this.radius < 0 ? 0 : this.radius;
                ang += (this.valB / 4) * angStep;
                const p = workArray;
                while(i < s) {
                    p[idx++] = Math.cos(ang) * sizeW;
                    p[idx++] = Math.sin(ang) * sizeH;
                    p[idx++] = r;
                    i ++;
                    ang += angStep;
                }
                workArray.size = idx;
                shapeUtils.roundedPathRadius(c, p, inn);
            },
        },
        star: {
            name: "star",
            serial, deserial,needUpdate, draw, snapper,
            ...shapeDefaults.star,
            isSquare: true,
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                var i, idx = 0, ang = -Math.PI * 0.5;
                const sides = this.sides / 3 | 0;
                const inset = this.sides % 3;
                
                var s = sides + 0.5 | 0;
                s = s < 2 ? 2 : s;
                const angStep = (Math.PI * 2) / s;
                const p = workArray;
                var size = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2;
                const size2 = (1 - (this.valA + 4) / 8) * size;
                const inn = this.inner < 0 ? 0 : this.inner / 4;
                const r = this.radius < 0 ? 0 : this.radius;
                ang += (this.valB / 4) * Math.PI;

                const a = Math.sin(angStep * 0.5) * size2;
                const b = size - Math.cos(angStep * 0.5) * size2;
                const h = (Math.min(r, a) / (a / ((a * a + b * b) ** 0.5))) - Math.min(r, a);

                if (inset) {
                    i = 0;
                    while(i < s) {
                        
                        p[idx++] = Math.cos(ang) * (size + h);
                        p[idx++] = Math.sin(ang) * (size + h);
                        p[idx++] = r * 0.5;
                        if (inset == 2) {
                            p[idx++] = 0;
                            p[idx++] = 0;
                            p[idx++] = r * 0.5;                        
                            p[idx++] = Math.cos(ang - angStep * 0.5) * size2;
                            p[idx++] = Math.sin(ang - angStep * 0.5) * size2;
                            p[idx++] = r;                            
                        } else {
                            p[idx++] = Math.cos(ang + angStep * 0.5) * size2;
                            p[idx++] = Math.sin(ang + angStep * 0.5) * size2;
                            p[idx++] = r;
                            p[idx++] = 0;
                            p[idx++] = 0;
                            p[idx++] = r * 0.5;                        
                        }
                        i ++;
                        ang += angStep;
                        workArray.size = idx;
                        shapeUtils.roundedPathRadius(c, p, this.inner < 0 ? 0 : this.inner / 4);
                        idx = 0;
                    }
                    
                } else {
                    i = 0;
                    while(i < s) {
                        p[idx++] = Math.cos(ang) * (size + h);
                        p[idx++] = Math.sin(ang) * (size + h);
                        p[idx++] = r;
                        p[idx++] = Math.cos(ang + angStep * 0.5) * size2;
                        p[idx++] = Math.sin(ang + angStep * 0.5) * size2;
                        p[idx++] = r;
                        i ++;
                        ang += angStep;
                    }
                    workArray.size = idx;
                    shapeUtils.roundedPathRadius(c, p, this.inner < 0 ? 0 : this.inner / 4);
                }
            },
        },
        gear: {
            name: "gear",
            serial, deserial, needUpdate,  draw, snapper,
            ...shapeDefaults.gear,
            isSquare: true,
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                var s = (this.sides + 0.5 | 0) - 3;
                s = s < 0 ? 0 : s;
                const count = s + 3;
                const outer = Math.min(Math.abs(spr.w), Math.abs(spr.h)) / 2;
                const inner = outer > this.inner ? this.inner : 0;
                const outerAng = (this.valA + 4) / 8;
                const innerAng = (this.valB + 4) / 8;
                shapeUtils.involuteGear(c, count, outer, inner, outerAng, innerAng, this.radius);

            },
        },
        compoundShape: {
            name: "compoundShape",
            isSquare: false,
            isCompound: true,
            scaleable: true,
            canJoinShapes: true,
            namedOptions: ["Even Odd", "Non Zero"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.compoundShape,
            compoundJoin, compoundUnjoin,
            hasIcon: true,
            icon: (() => {
                const p = new Path2D();
                p.rect(-13, -13, 26, 26)
                const points = [-12, -24, -16, -22, -16, 20, -13, 23, 14, 23, 14, 13, -4, 13, -4, -14, 14, -14, 14, -24];
                var i = 0;
                p.moveTo(points[i++]*0.5+1, points[i++]*0.5);
                while (i < points.length) {  p.lineTo(points[i++]*0.5+1, points[i++]*0.5) }
                p.closePath();


                p.x = 1;
                p.y = 1;
                return p;
            })(),
            get id() { return getGUID() },
            get joined() { return new Set() },
            hasSprite(spr) { return this.joined.has(spr) },
            create(c, spr) {
                var idx = 0;
                if (this.joined && this.joined.size) {
                    const l = [...this.joined.values()];
                    l.sort((a,b) => a.index - b.index);
                    while(idx < l.length) {
                        const sprShp = l[idx++];
                        const mat = new DOMMatrix(sprShp.key.m);
                        if (c.isShadowPath2D) {
                            c.save();
                            c.setTransform(mat.a, mat.b, mat.c, mat.d, mat.e, mat.f);
                            sprShp.shape.create(c, sprShp);
                            c.restore();
                        } else {
                            const path = new Path2D();
                            sprShp.shape.create(path, sprShp)
                            c.addPath(path, mat);
                        }
                    }
                    c.fillRule = this.sides % 2 ? "evenodd" : "nonzero";
                }
            },
            toShadowPath(sPath2d) {
                 var idx = 0;
                if (this.joined && this.joined.size) {
                    const l = [...this.joined.values()];
                    l.sort((a,b) => a.index - b.index);
                    while(idx < l.length) {
                        const sprShp = l[idx++];
                        const mat = new DOMMatrix(sprShp.key.m);
                        sPath2d.setTransform(mat.a, mat.b, mat.c, mat.d, mat.e, mat.f);
                        sprShp.shape.create(sPath2d, sprShp)
                    }
                }
            }
        },
        compoundCircle: {
            name: "compoundCircle",
            isSquare: true,
            isCompound: true,
            canNotGroup: true,
            namedOptions: ["Outside","Inside"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.compoundCircle,
            compoundJoin, compoundUnjoin,
            hasIcon: true,
            icon: (() => {
                const p = new Path2D();
                p.rect(4, 4, 24, 24)
                p.moveTo(14, 20)
                p.arc(12, 12, 6, Math.PI / 2, Math.PI * 2);
                p.arc(20, 20, 6, Math.PI * 1.5, Math.PI * 3);
                p.x = 1;
                p.y = 1;
                return p;
            })(),
            get id() { return getGUID() },
            get joined() { return new Set() },
            create(c, spr) {
                var inner = (this.inner / 8);
                var a =  this.valA * 4 * inner;
                var b =  (this.valB + 4) * 4 * inner;
                const w = spr.w, w2 = w / 2;
                const h = spr.h, h2 = h / 2;
                const size = Math.min(w2, h2);
                var R = this.radius;
                const sides = this.sides - 1;
                const inside = sides % 2 === 1;;


                if (this.joined && this.joined.size) {
                    const l = [...this.joined.values()][0];
                    spr.key.toLocal(l.x, l.y);
                    const x = spr.key.lx - w2;
                    const y = spr.key.ly - h2;
                    const s2 = Math.min(l.w, l.h) / 2;
                    shapeUtils.joinedArcs(c, 0, 0, size, x, y, s2, R, inside, inner);

                } else {
                    c.arc(0, 0, size, 0, Math.PI * 2);
                }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
            }
        },
        compoundLine: {
            name: "compoundLine",
            isSquare: false,
            isCompound: true,
            canNotGroup: true,
            scaleable: true,
            namedOptions: ["Closed","Open"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.compoundLine,
            compoundJoin, compoundUnjoin,
            hasIcon: true,
            icon: (() => {
                const p = new Path2D();
                 p.rect(-12, -12, 24, 24)
                p.moveTo(-6, -6);
                p.lineTo(4, -4);
                p.lineTo(6, 6);
                p.lineTo(-4, 4);
                p.rect(-8, -8, 4, 4);
                p.rect(2, -6, 4, 4);
                p.rect(4, 4, 4, 4);
                p.rect(-6, 2, 4, 4);
                p.x = 0;
                p.y = 0;
                p.useSprCol = true;
                return p;
            })(),
            get id() { return getGUID() },
            get joined() { return new Set() },
            create(c, spr) {
                var vx, vy, x, y, totalLength = 0;

                var R = this.radius;
                const p = workArray
                var inner = (this.inner / 2);
                var offset =  this.valA * 64;
                var length =  R > 0 ? 1 : this.valC / 4;
                var start =  R > 0 ? 0 : this.valB / 4;
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                if (length < 0) {
                    start += length;
                    length = - length;
                }

                length = length > 1 ? 1 : length;

                const w = spr.w, w2 = w / 2;
                const h = spr.h, h2 = h / 2;

                const sides = this.sides - 1;
                var open = sides % 2 === 1;



                if (this.joined && this.joined.size) {
                    if (open && this.joined.size < 3) { open = false }
                    const l = [...this.joined.values()];
                    l.sort((a,b) => a.index - b.index);
                    //l.unshift(spr);

                    var idx = 0, i = 0;
                    var s1 = l[idx];
                    spr.key.toLocal(s1.x, s1.y);
                    p[i++] = x = spr.key.lx - w2;
                    p[i++] = y = spr.key.ly - h2;
                    p[i++] = R;
                    while(idx < l.length - 1) {
                        const s2 = l[(idx + 1) % l.length];
                        spr.key.toLocal(s2.x, s2.y);
                        p[i++] = vx = spr.key.lx - w2;
                        p[i++] = vy = spr.key.ly - h2;
                        totalLength += Math.hypot(x-vx, y-vy)
                        p[i++] = R;
                        idx += 1;
                        x = vx;
                        y = vy;
                    }
                    if (!open) {
                        totalLength += Math.hypot(x-p[0], y-p[1])
                    }
                    if (length >= 1 || ! open || (start >= 0 && start < 1) || (start + length >= 0 && start + length <= 1)) {
                        workArray.size = i;
                        shapeUtils.compoundPath(c, p, inner, offset, open, open && R > 0, start, length, totalLength);
                    }

                }


            }


        },
        arrow: {
            name: "arrow",
            isSquare: false,
            namedOptions: ["None","Start","End","Start_End", "Cross","Cross_Start","Cross_End","Cross_Start_End"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.arrow,
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                // todo Complete functionality of following commented line
                // if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                const p = workArray
                var inner = (this.inner / 8); // scale;
                var a =  this.valA * 4 * inner;
                var b =  (this.valB + 4) * 4 * inner;
                const w = spr.w, w2 = w / 2;
                const h = spr.h, h2 = h / 2;
                var R = Math.min(this.radius / 8, a / 2, inner)
                const sides = this.sides - 1;
                const start = (sides % 4 === 1 || sides % 4 === 3);
                const end = (sides % 4 === 2 || sides % 4 === 3);
                const cross = (sides / 4 | 0) % 2 === 1;
                if(R > 0) {
                    const i = inner;
                    const d = (R * (b * b + i * i + 2 * i * a + a * a) ** 0.5) / (i + a) - R;
                    shapeUtils.roundedPath(c, [
                            ...start ? [
                                    -w2 + b - d, inner,
                                    -w2 + b - d, inner + a,
                                    -w2 - d,             0,
                                    -w2 + b - d,  -inner - a,
                                    -w2 + b - d,  -inner,
                                ] : [ -w2, inner, -w2,  -inner ],
                            ...cross ? (start ? [
                                    -inner, -inner,
                                    -inner, -h2 + b - d,
                                    -inner - a, -h2 + b - d,
                                    0, -h2 - d,
                                    inner + a, -h2 + b - d,
                                    inner, -h2 + b - d,
                                    inner, -inner,
                                ] : [
                                    -inner, -inner,
                                    -inner, -h2,
                                     inner, -h2,
                                     inner, -inner,
                                ]) : [],
                            ...end ? [
                                    w2 - b + d, -inner,
                                    w2 - b + d, -inner - a,
                                    w2 + d,      0,
                                    w2 - b + d,  inner + a,
                                    w2 - b + d,  inner,
                                ] : [ w2, -inner, w2,  inner ],
                           ...cross ? (end ? [
                                    inner, inner,
                                    inner,     h2 - b + d,
                                    inner + a, h2 - b + d,
                                    0, h2 + d,
                                    -inner - a, h2 - b + d,
                                    -inner,     h2 - b + d,
                                    -inner, inner,
                                ] : [
                                    inner, inner,
                                    inner, h2,
                                    -inner, h2,
                                    -inner, inner,
                                ]) : [],
                        ], R
                    );
                } else {
                    if (start) {
                        c.moveTo(-w2 + b,  inner);
                        c.lineTo(-w2 + b,  inner + a);
                        c.lineTo(-w2    , 0);
                        c.lineTo(-w2 + b,  -inner - a);
                        c.lineTo(-w2 + b,  -inner);
                    } else {
                        c.moveTo(-w2,  inner);
                        c.lineTo(-w2, -inner);
                    }
                    if (cross) {
                        c.lineTo(-inner, -inner);
                        if (start) {
                            c.lineTo( -inner, -h2 + b);
                            c.lineTo( -inner - a, -h2 + b);
                            c.lineTo(0, -h2);
                            c.lineTo( inner + a, -h2 + b);
                            c.lineTo( inner, -h2 + b);
                        } else {
                            c.lineTo(-inner, -h2);
                            c.lineTo( inner, -h2);

                        }
                        c.lineTo( inner, -inner);
                    }
                    if (end) {
                        c.lineTo(w2 - b, -inner);
                        c.lineTo(w2 - b, -inner - a);
                        c.lineTo(w2,0);
                        c.lineTo(w2 - b,  inner + a);
                        c.lineTo(w2 - b,  inner);
                    } else {
                        c.lineTo(w2, -inner);
                        c.lineTo(w2,  inner);
                    }
                    if (cross) {
                        c.lineTo( inner, inner);
                        if (end) {
                            c.lineTo( inner, h2 - b);
                            c.lineTo( inner + a, h2 - b);
                            c.lineTo(0, h2);
                            c.lineTo(-inner - a, h2 - b);
                            c.lineTo(-inner, h2 - b);
                        } else {
                            c.lineTo( inner, h2);
                            c.lineTo(-inner, h2);
                        }
                        c.lineTo(-inner, inner);
                    }
                    c.closePath();
                }
            },
        },
        angleArrow: {
            name: "arrow",
            isSquare: false,
            namedOptions: ["None","Start","End","Start_End"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.angleArrow,
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                // todo Complete functionality of following commented line
                // if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }

                var inner = (this.inner / 8); // scale;
                var a =  2 * inner;
                var b =  8 * inner;
                const angle = (this.valA + 4) / 4 * Math.PI;
                const w = spr.w, w2 = w / 2;
                const h = spr.h, h2 = h / 2;
                var R = Math.min(this.radius / 8, a / 2, inner)
                const sides = this.sides - 1;
                const start = (sides % 4 === 1 || sides % 4 === 3);
                const end = (sides % 4 === 2 || sides % 4 === 3);


                let l =  b / (w2 - a - inner)
                if (start && end) {
                    c.moveTo(...Math.polar2d(l, w2 - (a + inner) * 2));
                    c.lineTo(...Math.polar2d(0, w2 - (a + inner)));
                    c.lineTo(...Math.polar2d(l, w2));
                    c.arc(0, 0, w2 - a, l, angle - l);
                    c.lineTo(...Math.polar2d(angle - l, w2));
                    c.lineTo(...Math.polar2d(angle, w2 - (a + inner)));
                    c.lineTo(...Math.polar2d(angle - l, w2 - (a + inner) * 2));
                    c.arc(0, 0, w2 - a - inner * 2, angle - l, l, true);
                    c.closePath();

                } else if (start) {
                    c.arc(0, 0, w2 - a, l, angle);
                    c.arc(0, 0, w2 - a - inner * 2, angle, l, true);
                    c.lineTo(...Math.polar2d(l, w2 - (a + inner) * 2));
                    c.lineTo(...Math.polar2d(0, w2 - (a + inner)));
                    c.lineTo(...Math.polar2d(l, w2));
                    c.closePath();

                } else if (end) {
                    c.arc(0, 0, w2 - a, 0, angle - l);
                    c.lineTo(...Math.polar2d(angle - l, w2));
                    c.lineTo(...Math.polar2d(angle, w2 - (a + inner)));
                    c.lineTo(...Math.polar2d(angle - l, w2 - (a + inner) * 2));
                    c.arc(0, 0, w2 - a - inner * 2, angle - l, 0, true);
                    c.closePath();
                } else {
                    c.arc(0, 0, w2 - a, 0, angle);
                    c.arc(0, 0, w2 - a - inner * 2, angle, 0, true);
                    c.closePath();
                }
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }

            },
        },
        vector: {
            name: "vector",
            serial, deserial, draw, snapper,
            _needUpdate: needUpdate,
            hasData: false,
            needUpdate(spr) {
                if (this.data) {
                    this.hasData = true;
                    var update = this._needUpdate(spr) || this.data.desc.dirty || this.data.desc.dirtyLines;
                    return update;
                }
                return false;
            },
            serialVector() {
                const data = {
                    id: this.id,
                    w: this.data.w,
                    h: this.data.h,
                    scaleX: this.data.desc.pathStr.scaleX,
                    scaleY: this.data.desc.pathStr.scaleY,

                    posSize: [],
                    pStr: [],

                };
                this.data.desc.pathStr.paths.forEach(p => {
                    data.posSize.push(p.x, p.y, p.length);
                    data.pStr.push(p.path);
                });
                log.warn("Saving a vector that is dependent on an image. This dependancy is lost in the saved copy.");
                return data;

            },
            deserialVector(data) {
                this.data = {
                    desc: {
                        dirty: true,
                        dirtyLines: true,
                        pathStr:  {
                            isPathStr : true,
                            detail : 2,
                            segs : 8,
                            paths: [],
                            noBitmap: true,
                            scaleX: data.scaleY,
                            scaleY: data.scaleX,
                        }
                    }
                }
                var i = 0;

                while (i < data.pStr.length) {
                    this.data.desc.pathStr.paths.push({
                        x: data.posSize[i * 3],
                        y: data.posSize[i * 3 + 1],
                        path: data.pStr[i],
                        length: data.posSize[i * 3 + 2],
                    });
                    i ++;
                }

                this.hasData = true;
                this.names.valB = "NA";
            },
            ...shapeDefaults.vector,
            isSquare: false,
            scaleable: true,
            forceRemake: false,
            canBake: false,
            colorChanged(state) {
                if (state && this.update === 0) {
                    this.update = frameCount
                    this.forceRemake = state;
                    this.data.desc.dirtyLines = true;

                } else {
                    this.forceRemake = false;
                     this.data.desc.dirtyLines = false;
                }
            },
            //namedOptions: ["Lines", "Smooth_2", "Smooth_3", "Smooth_4", "Smooth_5"],
            //actions: ["Stack?Creates a stack of commited copies each with threashold increased\nMax 16 copies", "StackCol?Same as stack use main and second color to interpolate samples", "StackPallet?Pallet must be attached to vector sprite"],
            actions: [ "StackPallet?Pallet must be attached to vector sprite"],
            layerStack: false,
            StackPallet(spr) {
                if (spr.attachers) {
                    const pSpr = [...spr.attachers.values()].find(aSpr => aSpr.type.pallet === true);
                    if (pSpr) {
                        this.layerStack = true;
                        this.getStack(spr, false, pSpr.pallet);

                    } else { log.warn("No pallet attached to sprite") }

                } else { log.warn("No pallet attached to sprite") }

            },
            StackCol(spr) {
                const colRange = utils.colorRange;
                colRange.init(colours.mainColor, colours.secondColor);
                this.getStack(
                    spr,
                    true,
                    colRange
                );
            },
            Stack(spr) {
                this.getStack(spr);
            },
            getStack(spr,useCol = false, colRange) {
                var pallet, pIdx = 0;
                var start = this.valB;
                var steps = this.inner;
                const rgb = spr.rgb.copy();
                const color = utils.rgba;
                var valB = start;
                if (!useCol && colRange) {
                    pallet = colRange;
                    steps = pallet.length;
                } else {
                    steps = steps < 2 ? 0 : steps > 15 ? 15 : steps;
                }
                const range = this.radius < 8 ? 1 : (this.radius/512);
                if(steps <= 0) { log.warn("Too few steps to bother"); return }
                const step = useCol || pallet ? 0 : ((4 - start) * range) / steps;
                const colStep = 1 / (steps - 1);
                var colPos = 0;
                function create() {
                    selection.clear();
                    selection.add(spr);
                    spr.shape.valB = valB;
                    if (pallet) {
                        pallet.getRGB(pIdx++, color);
                        spr.rgb.fromColor(color);
                    } else if (useCol) {
                        colRange.rgbAt(colPos, color)
                        spr.rgb.fromColor(color);
                    }
                    spr.shape.update = frameCount
                    spr.shape.forceRemake = true;
                    spr.shape.data.desc.dirtyLines = true;

                    extraRenders.addOneTimeReady(()=> {
                        issueCommand(commands.edSprCopy);
                        const nVC = selection[0];
                        const width = nVC.w * nVC.sx;
                        nVC.setPos(nVC.x + width, nVC.y);
                        steps--;
                        if(steps > 0) {
                            colPos += colStep;
                            valB += step;
                            setTimeout(create, 64);
                        } else {
                            selection.clear();
                            selection.add(spr);
                            spr.shape.valB = start;
                            if (useCol || pallet) {
                                spr.rgb.fromColor(rgb);
                                spr.shape.colorChanged(true);
                            }
                            this.layerStack = false;

                            heartBeat.keepAwake = true;
                        }

                    },3);
                }
                heartBeat.keepAwake = true;
                setTimeout(create, 64);
            },
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                if (!this.hasData) { return }
                if (this.valD > -4) {
                    if (this.valD < -3.98) {
                        this.strokeWidth = -1;
                    } else {
                        this.strokeWidth = (this.valD + 4) * 32;
                    }
                } else { this.strokeWidth = 0 }
                this.update = 0;
                const vec = this.data.desc.pathStr
                const type = (this.sides - 1) % 5;
                //const smooth = type > 0;
                //const segs = smooth ? type + 1 : 0;
                const detail = (((this.valA + 4) * 8) * 0.5+ 0.5) ** 1.2
                const tolerance = (this.valB + 4) / 8 * 255;
                //const cornerAngle = Math.sin((this.valC + 4) / 16 * Math.PI);
                const corner = (this.valC / 4) * Math.PI;
                var dty = this.data.desc.dirtyLines, dtyTol = this.forceRemake;
                //vec.smooth !== smooth && (dty = true, vec.smooth = smooth);
                //(smooth && vec.segs !== segs) && (dty = true, vec.segs = segs);
                (vec.detail !== detail) && (dty = true, vec.detail = detail);
                (!vec.noBitmap && vec.tolerance !== tolerance) && (dtyTol = true, vec.tolerance = tolerance);
                //(vec.cornerAngle !== cornerAngle) && (dty = true, vec.cornerAngle = cornerAngle);
                this.data.desc.dirtyLines = dty;
                if(vec.noBitmap === undefined && dtyTol) {
                    this.data.desc.pathStr.color = spr.rgb;
                    this.data.remake(this.layerStack);
                }
                if (this.data.desc.dirtyLines) {
                    if (vec.noBitmap !== undefined) {
                        this.data.paths = utils.pathStrToPoints(this.data.desc.pathStr);
                        this.data.desc.pathPointCount = utils.lastVectorPointCount;
                        this.data.desc.dirtyLines = false;
                    } else {
                        this.data.redraw();
                    }
                }
                this.data.desc.dirty = false;
                this.forceRemake = false;
                const offsetX = -spr.cx, offsetY = -spr.cy;
                var pathCount = 0, pointCount = 0, skipCount = 0, skipSize = this.strokeWidth ? 0 : 2;
                for (const path of this.data.paths) {
                    if (path.length > skipSize) {
                        const mp = workArray;//shapeUtils.vectorPathLimit(path, workArray, path.length, 0);
                        let idx = 0;
                        for (const p of path) {
                            workArray[idx++] = p[0] + offsetX;
                            workArray[idx++] = p[1] + offsetY;
                        }
                        mp.size = idx;
                        shapeUtils.roundedVectorPath(c, mp, this.radius, this.inner, corner, mp.size, false);
                        pointCount += path.length / 2
                        pathCount++;
                    } else {
                        skipCount ++;
                    }
                }
                /*for (const path of this.data.paths) {
                    if (path.length > skipSize) {
                        var first = true;
                        for (const point of path) {
                            if (first) {
                                first = false;
                                c.moveTo(point[0] + offsetX, point[1] + offsetY);
                            } else {
                                c.lineTo(point[0] + offsetX, point[1] + offsetY);
                            }
                            pointCount ++;
                        }
                        c.closePath();
                        pathCount++;
                    } else {
                        skipCount ++;
                    }
                }*/
                this.info = pointCount + " points, " + pathCount + " paths " + skipCount + " skipped";


            },
        },
        tube: {
            name: "tube",
            isSquare: false,
            namedOptions: ["topIn","topOut","botIn","botOut","BackIn","BackOut","FrontIn","FrontOut"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.tube,
            get id() { return getGUID() },
            ...SVGPath,
            roll(vec3d, pitch, yaw, ) {
                const c = vec3d;
                const pc = Math.cos(pitch);
                const ps = Math.sin(pitch);
                const yc = Math.cos(yaw);
                const ys = Math.sin(yaw);
                var x = pc * c.x + ps * c.y;    // in roll direction space
                var y = pc * c.y - ps * c.x;
                var xx = x * yc - c.z * ys;   // rotate
                c.z = x * ys + c.z * yc;
                c.x = pc * xx - ps * y;         // back to world space
                c.y = pc * y  + ps * xx;
            },
            center: {x:0, y:0, z: 1},
            right:  {x:1, y:0, z: 0},
            curveA: {x:0, y:1, z: 0},
            curveB: {x:0, y:-1, z: 0},
            create(c, spr) {
                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }
                var pitch =  this.valA / 4 * Math.PI;
                var yaw =  -this.valB / 4 * Math.PI;
                const radius = Math.abs(spr.h) / 2;
                const l = Math.abs(spr.w) / 2;

                const front = (this.sides - 1) % 2 === 1;
                const part = (this.sides - 1) / 2 | 0;
                const side = ((part / 2 | 0) % 2) === 1;
                const top = (part % 2) === 0;
                const bot = (part % 2) === 1;
                const cc = this.center, rr = this.right;
                const P270 = Math.PI90 * 3;
                const P90 = Math.PI90;
                const e = P90 - (this.radius / 128) * Math.PI;
                const s = e - (1 - this.inner / 128) * Math.PI;
                const cE = this.curveA;
                const cS = this.curveB;
                cE.x = Math.cos(e);
                cE.y = Math.sin(e);
                cE.z = 0;
                cS.x = Math.cos(s);
                cS.y = Math.sin(s);
                cS.z = 0;
                this.roll(cE, pitch, yaw);
                this.roll(cS, pitch, yaw);

                rr.y = cc.x = 0;
                rr.z = cc.y = 0;
                rr.x = cc.z = 1;
                this.roll(cc, pitch, yaw);
                this.roll(rr, pitch, yaw);
                var len = (cc.x * cc.x + cc.y * cc.y) ** 0.5;
                len = len < -1 ? -1 : len > 1 ? 1 : len;  // to avoid floatng point errors
                const pheta = Math.acos(len);             // rotation around z axis
                const sr = Math.sin(pheta) * radius;
                var eDir = (Math.atan2(cc.y, cc.x) + Math.TAU) % Math.TAU;



                const x = cc.x * len * l, y = cc.y * len * l;

                if (!side) {
                    if (top) {
                        if (front) {
                            if (cc.z > 0) {
                                c.ellipse( x,  y, sr, radius, eDir, 0, Math.TAU);
                            }
                        } else {
                             if (cc.z < 0) {
                                c.ellipse( x,  y, sr, radius, eDir, 0, Math.TAU);
                            }
                        }
                    } else {
                        if (front) {
                            if (cc.z < 0) {
                                c.ellipse( -x,  -y, sr, radius, eDir, 0, Math.TAU);
                            }
                        } else {
                             if (cc.z > 0) {
                                c.ellipse( -x,  -y, sr, radius, eDir, 0, Math.TAU);
                            }
                        }
                    }
                } else {
                    const away = rr.z < 0;
                    const right = cc.z > 0;
                    let ae1 = P90 ;
                    ae1 += right ? (this.radius / 128) * P90 : -(this.radius / 128) * P90;
                    let as1 = ae1 + (right ? (this.inner / 128) * P90 : -(this.inner / 128) * P90);

                    if (top) {
                        if (front) {
                            if (away) {
                                c.ellipse( x,  y, sr, radius, eDir, as1, ae1, right);
                                c.ellipse( -x,  -y, sr, radius, eDir, ae1, as1, !right);
                                c.closePath();
                            }
                        } else {
                             if (!away) {
                                c.ellipse( x,  y, sr, radius, eDir, as1, ae1, right);
                                c.ellipse( -x,  -y, sr, radius, eDir, ae1, as1, !right);
                                c.closePath();
                            }
                        }
                    } else {
                        if (front) {
                            if (!away) {
                                c.ellipse( x,  y, sr, radius, eDir, as1, ae1, right);
                                c.ellipse( -x,  -y, sr, radius, eDir, ae1, as1, !right );
                                c.closePath();
                            }
                        } else {
                             if (away) {
                                c.ellipse( x,  y, sr, radius, eDir, as1, ae1, right);
                                c.ellipse( -x,  -y, sr, radius, eDir, ae1, as1, !right);
                                c.closePath();
                            }
                        }
                    }
                }


            },

        },
        sphere: {
            name: "sphere",
            isSquare: true,
            namedOptions: ["frontCurve","backCurve","frontFace","backFace"],
            serial, deserial, needUpdate,  draw,   snapper : snapperInner,
            ...shapeDefaults.sphere,
            get id() { return getGUID() },
            ...SVGPath,
            roll(vec3d, pitch, yaw, ) {
                const c = vec3d;
                const pc = Math.cos(pitch);
                const ps = Math.sin(pitch);
                const yc = Math.cos(yaw);
                const ys = Math.sin(yaw);
                var x = pc * c.x + ps * c.y;    // in roll direction space
                var y = pc * c.y - ps * c.x;
                var xx = x * yc - c.z * ys;   // rotate
                c.z = x * ys + c.z * yc;
                c.x = pc * xx - ps * y;         // back to world space
                c.y = pc * y  + ps * xx;
            },
            drawSectionInner(ctx, sr, cr, inner, backFace, showFace) {  // cr is circle radius r is slice radius
                const c = this.center, ci = this.centerInner;
                var cx = c.x, cy  = c.y, cz = c.z;
                const ccZ = cz * (backFace ? -1 : 1);

                var ir = Math.sin(Math.asin(sr / cr) + (inner / cr)) * cr;

                var reverse = false
                if (sr > cr) {
                    sr = cr - (sr - cr);
                    reverse = true;
                }
                var len = (cx * cx + cy * cy) ** 0.5;
                len = len < -1 ? -1 : len > 1 ? 1 : len;  // to avoid floatng point errors

                const pheta = Math.asin(len);             // rotation around z axis
                const eDir = Math.atan2(cy, cx);

                const R = cr / sr;
                const Ri = cr / ir;
                const A = Math.cos(Math.asin(1 / R)) * R;
                const Ai = Math.cos(Math.asin(1 / Ri)) * Ri;
                const sra = Math.abs(Math.cos(pheta)) * sr;
                const ira = Math.abs(Math.cos(pheta)) * ir;
                const x = cx * A * sr, y = cy * A * sr;
                const xi = cx * Ai * ir, yi = cy * Ai * ir;

                if (showFace) {
                    if (ccZ > 0) {
                        ctx.ellipse( xi,  yi, ira, ir, eDir, 0, Math.TAU);
                    } else {
                        ctx.ellipse( x,  y, sra, sr, eDir, 0, Math.TAU);
                    }
                    return;
                }


                var tx = Infinity, ix = Infinity;
                if (len > 0) {
                    let c1 = Math.sin(pheta) * A;
                    let c2 = 1 / (Math.cos(pheta) ** 2);
                    let roots = Math.quadRoots(c2 - 1, -2 * c1 * c2, c1 * c1 * c2 + R * R - 1.001);
                    roots > 0 && (tx = (roots === 1 ? Math.roots.a: (Math.roots.a + Math.roots.b) * 0.5) * sr);
                    c1 = Math.sin(pheta) * Ai;
                    c2 = 1 / (Math.cos(pheta) ** 2);
                    roots = Math.quadRoots(c2 - 1, -2 * c1 * c2, c1 * c1 * c2 + Ri * Ri - 1.001);
                    roots > 0 && (ix = (roots === 1 ? Math.roots.a: (Math.roots.a + Math.roots.b) * 0.5) * ir);

                }
                const ab = Math.acos(tx / cr);
                const bb = Math.acos((tx - len * A * sr) / sra);
                const ai = Math.acos(ix / cr);
                const bi = Math.acos((ix - len * Ai * ir) / ira);
                const ax = Math.cos(eDir)
                const ay = Math.sin(eDir)

                if (Math.abs(ira) <  0.1 || Math.abs(sra) < 0.1) {
                    const ab = Math.asin(sr / cr);
                    const ai = Math.asin(ir / cr);
                    ctx.arc(0, 0, cr,  eDir + ab, eDir + ai, reverse);
                    ctx.arc(0, 0, cr,  eDir - ai, eDir - ab, reverse);
                    ctx.rect(-cr, -cr, 2, 2);
                    ctx.rect(-cr, -cr + 4, 2, 4);
                } else if (tx >= cr && ix >= cr) {
                    if (ccZ < 0) {
                    } else {
                        ctx.ellipse( x,  y, sra, sr, eDir, 0, Math.TAU);
                        ctx.moveTo(ira * ax + xi,  ira * ay + yi);
                        ctx.ellipse( xi,  yi, ira, ir, eDir, 0, Math.TAU);
                    }
                } else if (ix >= cr) {
                    ctx.arc(0, 0, cr,  eDir + ab, eDir - ab, !reverse);
                    ctx.ellipse( x, y, sra, sr, eDir, -bb, bb, reverse);
                    ctx.moveTo(ira * ax + xi,  ira * ay + yi);
                    ctx.ellipse( xi,  yi, ira, ir, eDir, 0, Math.TAU);
                } else if (tx >= cr) {
                    if (ccZ < 0) {
                        ctx.arc(0, 0, cr,  eDir - ai, eDir + ai, reverse);
                        ctx.ellipse( xi, yi, ira, ir, eDir, bi, -bi, !reverse);
                    } else {
                        ctx.arc(0, 0, cr,  eDir - ai, eDir + ai, reverse);
                        ctx.ellipse( xi, yi, ira, ir, eDir, bi, -bi, reverse);
                        ctx.moveTo(sra * ax + x,  sra * ay + y);
                        ctx.ellipse( x,  y, sra, sr, eDir, 0, Math.TAU);
                    }
                } else {
                    if(ccZ < 0) {
                        ctx.arc(0, 0, cr, eDir + ab, eDir + ai, reverse);
                        ctx.ellipse( xi, yi, ira, ir, eDir, bi, -bi, !reverse);
                        ctx.arc(0, 0, cr, eDir - ai, eDir - ab, reverse);
                        ctx.ellipse( x, y, sra, sr, eDir, -bb, bb, reverse);
                    } else {
                        ctx.arc(0, 0, cr, eDir + ab, eDir + ai, reverse);
                        ctx.ellipse( xi, yi, ira, ir, eDir, bi, -bi, reverse);
                        ctx.arc(0, 0, cr, eDir - ai, eDir - ab, reverse);
                        ctx.ellipse( x, y, sra, sr, eDir, -bb, bb, !reverse);
                    }
                }
            },
            drawSection(ctx, sr, cr, backFace, showFace) {  // cr is circle radius r is slice radius
                const c = this.center;
                var cx = c.x, cy  = c.y, cz = c.z;
                const ccZ = cz * (backFace ? -1 : 1);
                var reverse = false
                if (sr > cr) {
                    sr = cr - (sr - cr);
                    reverse = true;
                }
                var len = (cx * cx + cy * cy) ** 0.5;
                len = len < -1 ? -1 : len > 1 ? 1 : len;  // to avoid floatng point errors
                const pheta = Math.asin(len);             // rotation around z axis
                const eDir = Math.atan2(cy, cx);
                const R = cr / sr;
                const A = Math.cos(Math.asin(1 / R)) * R;
                const sra = Math.abs(Math.cos(pheta)) * sr;
                const x = cx * A * sr, y = cy * A * sr;


                if (showFace) {
                    if (ccZ > 0) {
                        ctx.ellipse( x,  y, sra, sr, eDir, 0, Math.TAU);
                    }
                    return;
                }

                var tx = Infinity; // x pos where circle and ellipse touch if they do
                if (len > 0) {
                    const c1 = Math.sin(pheta) * A;
                    const c2 = 1 / (Math.cos(pheta) ** 2);
                    let roots = Math.quadRoots(c2 - 1, -2 * c1 * c2, c1 * c1 * c2 + R * R - 1.001);
                    roots > 0 && (tx = (roots === 1 ? Math.roots.a: (Math.roots.a + Math.roots.b) * 0.5) * sr);
                }
                if (tx >= cr) {
                    if (ccZ < 0) {

                    } else {
                        ctx.ellipse( x,  y, sra, sr, eDir, 0, Math.TAU);
                        if (reverse) {
                            ctx.moveTo(cr,0);
                            ctx.arc(0, 0, cr, 0, Math.TAU)
                        }
                    }
                } else {
                    const ab = Math.acos(tx / cr);
                    const bb = Math.acos((tx - len * A * sr) / sra);
                    if (ccZ < 0 ) {
                        ctx.arc(0, 0, cr, eDir + ab, eDir - ab, !reverse);
                        ctx.ellipse( x, y, sra, sr, eDir, -bb, bb, reverse);
                    } else {
                        ctx.arc(0, 0, cr, eDir + ab, eDir - ab, !reverse);
                        ctx.ellipse( x, y, sra, sr, eDir, -bb, bb, !reverse);
                    }
                }
            },
            center: {x:0, y:0, z: 1},
            centerInner: {x:0, y:0, z: 1},
            create(c, spr) {

                if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }

                var pitch =  this.valA / 4 * Math.PI;
                var yaw =  -this.valB / 4 * Math.PI;
                const sphereRadius = Math.abs(spr.w) / 2;
                var sliceRadius = this.radius > sphereRadius * 2 ? sphereRadius * 2 - 0.1 : this.radius
                var inner = this.inner;
                const reverse = sliceRadius > sphereRadius;
                const reverseInner = sliceRadius + inner > sphereRadius;
                const backFace = (this.sides - 1) % 2 === 1;
                const curve = ((this.sides - 1) / 2 | 0) % 2 === 1;

                this.center.x = 0;
                this.center.y = 0;
                this.center.z = 1;
                this.roll(this.center, pitch, reverse ? -yaw : yaw)
                if(inner > 0) {
                    this.centerInner.x = 0;
                    this.centerInner.y = 0;
                    this.centerInner.z =  1;
                    this.roll(this.centerInner, pitch, reverseInner ? -yaw : yaw)
                    this.drawSectionInner(c, sliceRadius, sphereRadius, inner, backFace, curve);
                } else {
                    this.drawSection(c, sliceRadius, sphereRadius, backFace, curve);
                }

                if (this.valD > -4) {
                    this.strokeWidth = (this.valD + 4) * 32;
                } else { this.strokeWidth = 0 }

            },
        },
        vectorCommited: {
            name: "vectorCommited",
            serial, deserial, draw,needUpdate, snapper,
            ...shapeDefaults.vectorCommited,
            serialVector() {
                if (this.data.isShadowPath2D) {
                    const tempPath = ShadowPath2D();  // untransformed path
                    this.create(tempPath);
                    const data = {
                        id: this.id,
                        path2D: true,
                        pathStr: tempPath.toString(),
                    };
                    return data;
                }
                const data = {
                    id: this.id,
                    paths: [],
                };
                for (const path of this.data) {
                    data.paths.push(path.map(v => Math.round(v * 10) / 10));
                }
                return data;

            },
            deserialVector(data) {
                if (data.path2D) {
                    this.data = {
                        isShadowPath2D: true,
                        pathStr: data.pathStr,
                        path: new Path2D(data.pathStr),
                    };
                    this.hasData = true;
                } else {
                    this.data = data.paths;
                    this.hasData = true;
                    this.data.size = data.paths.length;
                }
            },
            hasData: false,
            isSquare: false,
            scaleable: true,
            canBake: false,
            namedOptions: ["Even Odd", "Non Zero"],
            namedOptionsCompoundShape: ["Even Odd", "Non Zero"],

            Divide(spr) {
                if (!this.data.isShadowPath2D) {
                    var idx = 0;
                    if ( this.divideAt === undefined) {
                        this.divideAt = 0;
                    }
                    const select = [];
                    var subShape
                    const areas = this.data.map(p => ({area: Math.polyArea(p), path: p}));
                    areas.sort((a,b)=> b.area - a.area);
                    var count = 10;
                    var i = 0;
                    while (i < this.data.length && this.divideAt < this.data.length) {
                        const path = this.data[i];
                        if(areas[this.divideAt].path === path) {
                            if (!subShape) {
                                subShape = new Sprite(...utils.viewCenter,256,256,"Sub Path");
                                subShape.fitTo(spr);
                                subShape.changeToShape(spr.name+" sub path "+ i, "vectorCommited");
                            }
                            subShape.shape.commitFrom(spr, false, i);
                            if(subShape.shape.data.size) {
                                select.push(subShape);
                                subShape = undefined;
                                this.divideAt++;
                                count --;
                                if (count <= 0) { break }
                                else { i = 0 }
                            } else {
                                this.divideAt++;
                                i ++;
                            }
                        } else { i ++ }
                    }
                    if (this.divideAt === this.data.length) { this.divideAt = undefined }
                    if (select.length) { setTimeout(() => editSprites.addCreatedSprites(...select), 200) }
                }
            },
            Join() { log("Join action called") },
            actions: ["Divide?Seperates each path"],//,"Join?Combines path only paths of type VectorCommited","Extract?Seperates out inside paths"],
            commitClose() {
                this.data.path = new Path2D(this.data.toString());
                this.data.reset();
            },
            commitFrom(srcSpr, add, pathIndex) {
                var copySetup = true;
                if (srcSpr.shape.canBake) {
                    if (add) {
                        if(!this.data) {
                            this.data = ShadowPath2D();
                            this.namedOptions = this.namedOptionsCompoundShape;
                        }
                        srcSpr.shape.create(this.data, srcSpr);
                        copySetup = false;
                    } else {
                        const sPath2d = ShadowPath2D();
                        srcSpr.shape.create(sPath2d, srcSpr);
                        sPath2d.path = new Path2D(sPath2d.toString());
                        sPath2d.reset();
                        this.data = sPath2d;
                        this.data.bakeFixed = srcSpr.shape.bakeFixed;
                        this.namedOptions = this.namedOptionsCompoundShape;
                    }
                }else if (srcSpr.shape.name === "vector") {
                    const offsetX = -srcSpr.cx, offsetY = -srcSpr.cy;
                    const p = [];
                    for (const path of srcSpr.shape.data.paths) {
                        const  pp = shapeUtils.optimiseVectorPath(path, offsetX, offsetY);
                        p.push(pp);
                    }
                    this.data = p;
                    this.data.size = p.length;
                    copySetup = false;
                } else if (srcSpr.shape.name === "vectorCommited") {
                    if (!srcSpr.shape.data.isShadowPath2D) {
                        const p = [];
                        const pp = []
                        if (pathIndex !== undefined) {
                            shapeUtils.vectorPathBake(srcSpr.shape, p, pathIndex);
                            for (const path of p) {
                                const op = shapeUtils.optimiseVectorPath(path,0,0);
                                if (op.length > 1) { pp.push(op) }
                            }
                        } else {
                            shapeUtils.vectorPathBake(srcSpr.shape, p);
                            for (const path of p) {
                                const op = shapeUtils.optimiseVectorPath(path,0,0);
                                if (op.length > 1) { pp.push(op) }
                            }
                        }
                        this.data = pp;
                        this.data.size = pp.length;
                    }
                }
                if(this.data.bakeFixed){
                    Object.assign(this.names, defaultLockNames);
                } else if(copySetup){
                    this.valA = srcSpr.shape.valA;
                    this.valB = srcSpr.shape.valB;
                    this.valC = srcSpr.shape.valC;
                    this.valD = srcSpr.shape.valD;
                    this.sides = srcSpr.shape.sides;
                    this.inner = srcSpr.shape.inner;
                    this.radius = srcSpr.shape.radius;
                }
                this.w = srcSpr.w;
                this.h = srcSpr.h;
                this.hasData = true;
            },
            get id() { return getGUID() },
            ...SVGPath,
            create(c, spr) {
                //if (spr.snapFunc === undefined){ spr.setSnaps(this.snapper.bind(this)) }
                if (!this.hasData) { return }
                this.update = 0;
                if (this.data.isShadowPath2D) {
                    if (this.valD > -4) { this.strokeWidth = (this.valD + 4) * 32 }
                    else { this.strokeWidth = 0 }
                    if(c.isShadowPath2D) { c.addPath(this.data) }
                    else { c.addPath(this.data.path) }
                } else {
                    if (this.valD > -4) { this.strokeWidth = (this.valD + 4) * 32 }
                    else { this.strokeWidth = 0 }
                    const minLen = ((this.valC + 4) / 8) ** 2 * 32;
                    const corner = (this.valB / 4) * Math.PI;
                    var i, idx, x1,y1,x2,y2, x3,y3, ax, ay, bx, by, pathCount = 0, pointCount = 0, skipCount = 0;
                    const skipSize = this.strokeWidth ? 2 : 4;
                    const p = pointsArray;
                    if (this.valA > -4) {
                        const area = ((this.valA + 4) * 4) ** 3;
                        for (const path of this.data) {
                            if (path.length > skipSize && Math.polyArea(path) > area) {
                                const mp = shapeUtils.vectorPathLimit(path, workArray, path.length, minLen);
                                shapeUtils.roundedVectorPath(c, mp, this.radius, this.inner, corner, mp.size, false);
                                pointCount += path.length / 2
                                pathCount++;
                            } else {
                                skipCount ++;
                            }
                        }
                    } else {
                        for (const path of this.data) {
                            if (path.length > skipSize) {
                                const mp = shapeUtils.vectorPathLimit(path, workArray, path.length, minLen);
                                shapeUtils.roundedVectorPath(c, mp, this.radius, this.inner, corner, mp.size, false);
                                pointCount += path.length / 2
                                pathCount++;
                            } else {
                                skipCount ++;
                            }
                        }
                    }
                    this.info = pointCount + " points, " + pathCount + " paths " + skipCount + " skipped";
                }
                c.fillRule = this.sides % 2 ? "evenodd" : "nonzero";
            },
        },

    };
    for(const key of Object.keys(spriteShapes)) { spriteShapes[key].name = key }
    SPRITE_SHAPE_TYPES.push(...Object.keys(spriteShapes));
    return spriteShapes;
})();