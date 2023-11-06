"use strict";
const widget = (() => {
    const id = UID ++;
    // invS for inverse scale invLS for Local Scale x and y
    // ax, ay actual pos not snapped.
    // asx, asy, swx, swy used with scaling
    // lx, ly local pos
    // cx, cy relative center
    // rx, ry rotation of x an y axis
    // sx, sy scale (always positive) mx, my bools if sprite mirrored in x, y
    // sox, soy scale origin
    // invS, world inv scale invLSx, invLSy local invers scales
    // over mouse over
    // scaleCorners scale corners bit 1 x axis bit 2 y axis
    var w, h, x, y, ax, ay, cx, cy, rx, ry, c, v, aw, ah,pointLike,cCount, snapFound, invS, invLSx, invLSy, vim, vm;
    var cursorRotate = 0;
    var sx, sy, sox, soy, sux, suy, swx, swy, mx, my, lx, ly, wx, wy, over, scaleCorners, asx, asy, xdx, xdy, ydx,ydy;
    var handledCapturedMouseEvents = false;  // this is set to true after releasing mouse.capture with the widget id
    function mouseCaptureReleased(rId) { handledCapturedMouseEvents = true }
    var pixelSnap = 1;
    var rotateScaleWidgetMode2 = false;
    var cornerSnaps = true;
    var midSnaps = true;
    var centerSnaps = true;
    var snapsSelect = 1 + 2 + 4;
    function setSnapSelect(corner = cornerSnaps, mid = midSnaps, center = centerSnaps) {
        snapsSelect = (corner ? 1 : 0) + (mid ? 2 : 0) + (center ? 4 : 0);
    }
    var cursorScaleRotateAdd = 0;
    var cursorRotateRotateAdd = 0;
    var viewDiagonal = 1000;
    var axisAligned;
    var axisShared;
    var axisSharedX;
    var axisSharedY;
    const locks = {
        rotateX : false, rotateY : false, scaleX : false, scaleY : false, positionX : false, positionY : false,
        off() {
            locks.rotateX = false;
            locks.rotateY = false;
            locks.scaleX = false;
            locks.scaleY = false;
            locks.positionX = false;
            locks.positionY = false;
        },
        on() {
            locks.rotateX = true;
            locks.rotateY = true;
            locks.scaleX = true;
            locks.scaleY = true;
            locks.positionX = true;
            locks.positionY = true;
        },
    }
    const subScale = 0.1
    var singleSprite = false;
    // the next set of const index into the array cursors
    const none = 0;
    const top = 1;
    const right = 2;
    const bottom = 3;
    const left = 4;
    const center = 5;
    const rotate = 6;
    const topLeft = 7;
    const topRight = 8;
    const bottomRight = 9;
    const bottomLeft = 10;
    const selector = 11;
    const selectable = 12;
    const rotateSide = 13;
    const attachCenter = 14;
    const linkLine = 15;
    const linkOrder = 16;
    const newLinkIn = 17;
    const newLinkOut = 18;
    const newFLinkIn = 19;
    const newFLinkOut = 20;
    const lookatLink = 21;
    const attachedLink = 22;
    const linkedLink = 23;
    const fLineNoCut = -1;
    // end of cursor indexes
    // True if above const are used to drag scale
    const isScalingDrag = [false,true,true,true,true,false,false,true,true,true,true];
    const wigetCorners = [ // world offsets to corners from top left clockwise
        {x : 0, y : 0},  // first point is center and always 0, 0
        {x : 0, y : 0},  // top left
        {x : 0, y : 0},  // top right
        {x : 0, y : 0},  // bottom right
        {x : 0, y : 0},  // bottom left
        {x : 0, y : 0},  // top mid
        {x : 0, y : 0},  // right mid
        {x : 0, y : 0},  // bottom mid
        {x : 0, y : 0},  // left mid
    ];
    const wigetCornersPos = [
        {x : 0, y : 0},  // first point is center and always 0, 0
        {x : -0.5, y : -0.5},  // top left
        {x : 0.5, y : -0.5},  // top right
        {x : 0.5, y : 0.5},  // bottom right
        {x : -0.5, y : 0.5},  // bottom left
        {x : 0, y : -0.5},  // top mid
        {x : 0.5, y : 0},  // right mid
        {x : 0, y : 0.5},  // bottom mid
        {x : -0.5, y : 0},  // left mid
    ];
    const selArray = [];
    const gridLines = [];
    var gridLineCount = 0;
    const gridLineObj = {
        p1 : {x : 0, y : 0},
        p2 : { x : 0, y : 0},
        direction : 0,
        center : { x: 0, y : 0 },
    }
    const minGridLine = { dist : 0, index : -1, x : 0, y : 0, ox : 0, oy : 0, ix : 0, iy : 0, };
    const minGridLineNext = { dist : 0, index : -1, x : 0, y : 0, ox : 0, oy : 0 };
    const minSpriteCorner = { dist : 0, x : 0, y : 0 };
    var gridSnapDist = settings.gridLineSnapDistance;
    var limitModify = settings.limitModify;
    const sel = { x: 0, y : 0, xx : 0, yy : 0}
    const snapPosRef = {x : 0, y : 0, c : 0};
    const workPoint1 = {x : 0, y : 0}; // general purpose 2D point like object
    const workPoint2 = {x : 0, y : 0}; // general purpose 2D point like object
    const workPoint3 = {x : 0, y : 0}; // general purpose 2D point like object
    const workPoint4 = {x : 0, y : 0}; // general purpose 2D point like object
    const workPoint5 = {x : 0, y : 0}; // general purpose 2D point like object
    const workPoint6 = {x : 0, y : 0}; // general purpose 2D point like object
    const wp1 = workPoint1; // alias
    const wp2 = workPoint2; // alias
    const wp3 = workPoint3; // alias
    const wp4 = workPoint4; // alias
    const wp5 = workPoint5; // alias
    const wp6 = workPoint6; // alias
    var vDist, hDist, rDist, hLine, vLine, rLine, rSide;
    var dragType;
    var dragAngle;
    var draggingType = none;
    var extent;
    var lastChange = -1;
    var active = false;
    var mouseOverSelectable = false;
    const m = [1, 0, 0, 1, 0, 0];
    const im = [1, 0, 0, 1, 0, 0];
    const sm = Object.assign([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], {
        update() {
            sm[0] = m[0];
            sm[1] = m[1];
            sm[2] = m[2];
            sm[3] = m[3];
            sm[4] = m[4];
            sm[5] = m[5];
            // inverse matrix
            sm[6] = im[0];
            sm[7] = im[1];
            sm[8] = im[2];
            sm[9] = im[3];
            sm[10] = im[4];
            sm[11] = im[5];
        },
        lx : 0, ly : 0, wx : 0, wy : 0,
        toWorld(x, y) {
            sm.wx = x * sm[0] + y * sm[2] + sm[4];
            sm.wy = x * sm[1] + y * sm[3] + sm[5];
        },
        toLocal(x, y) {
            const xx = x - sm[4];
            const yy = y - sm[5];
            sm.lx = xx * sm[6] + yy * sm[8];
            sm.ly = xx * sm[7] + yy * sm[9];
        }
    });
    const linkLines = [];
    var linkAction = 0;
    const LINK_ACTIONS = {
        cut : 1,
        moveUp: 2,
        moveDown: 3,
        newLinkIn: 4,
        newLinkOut: 5,
    };
    const closestLinkLine = {
        dist: 0,
        line: null,
        cutAll: false,
        allStart: false,
        
    };
    var holdFor = 0; // Holds button action for a few frames to show feedback on link line interface
    var linkCount = 0;
    const LINK_OPTS = {
        lineSpacing: 7,
        boxSize: 5,
        highLightStroke: 3,
        stroke : 1,
        inCol: "#0F0",
        outCol: "#F80",
        lookatCol: "#00F",
        attachCol: "#0A0",
        linkedCol: "#A00",
        lookatHighlightCol: "#8FF",
        attachHighlightCol: "#0F0",
        linkedHighlightCol: "#F00",
    };
    const linkTypes = {
        box : newLinkIn,
        boxOut : newLinkOut,
        line: linkLine,
        lineStart: linkOrder,
        fLineIn: newFLinkIn,
        fLineOut: newFLinkOut,
        fLineNoCut: fLineNoCut,
        lookat: lookatLink,
        attach: attachedLink,
        linked: linkedLink,
    };
    const linkStyles = {
        fLinkInput(c, dist, ivs) {
            var s = 16 * ivs;
            var s1 = s * 0.1;
            var s2 = s * 0.3;
            c.moveTo(dist - s2,0);
            c.lineTo(s * 0.2  ,0);
            c.moveTo(dist     , -s1);
            c.lineTo(dist - s2, 0);
            c.lineTo(dist     , s1);
        },
        fLinkOutput(c, dist, ivs) {
            var s = 16 * ivs;

            var s1 = s * 0.1;
            var s2 = s * 0.3;            
            c.moveTo(s * 0.2  ,0);
            c.lineTo(dist     ,0);
            c.moveTo(dist - s2, -s1);
            c.lineTo(dist     , 0);
            c.lineTo(dist - s2, s1);
        },
        fLinkInUnbound(c, dist, ivs, highlight = false, col = LINK_OPTS.inCol, showOrderBox = false) {
            c.strokeStyle = col;
            c.rect(35, -15, 30, 30);
        },
        fLinkOutUnbound(c, dist, ivs, highlight = false, col = LINK_OPTS.outCol, showOrderBox = false) {
            c.strokeStyle = col;
            c.rect(35, -15, 30, 30);
        },
        fLinkNewInput(c) {
            c.rect(-LINK_OPTS.boxSize/2, -LINK_OPTS.boxSize/2, LINK_OPTS.boxSize, LINK_OPTS.boxSize);
        },
        fLinkNewOutput(c) {
            c.rect(-LINK_OPTS.boxSize/2, -LINK_OPTS.boxSize/2, LINK_OPTS.boxSize, LINK_OPTS.boxSize);
        },
        fLinkInputUD(c, dist, ivs) {
            c.moveTo(-LINK_OPTS.boxSize/ 2, 0);
            c.lineTo(0, -LINK_OPTS.boxSize / 2);
            c.lineTo(LINK_OPTS.boxSize / 2, 0);
            c.moveTo(-LINK_OPTS.boxSize/ 2, 0);
            c.lineTo(0, LINK_OPTS.boxSize / 2);
            c.lineTo(LINK_OPTS.boxSize / 2, 0);
            c.rect(-LINK_OPTS.boxSize/2, -LINK_OPTS.boxSize/2, LINK_OPTS.boxSize, LINK_OPTS.boxSize);
        },
        fLinkOutputUD(c, dist, ivs) {
            c.moveTo(-LINK_OPTS.boxSize/ 2, 0);
            c.lineTo(0, -LINK_OPTS.boxSize / 2);
            c.lineTo(LINK_OPTS.boxSize / 2, 0);
            c.moveTo(-LINK_OPTS.boxSize/ 2, 0);
            c.lineTo(0, LINK_OPTS.boxSize / 2);
            c.lineTo(LINK_OPTS.boxSize / 2, 0);
            c.rect(-LINK_OPTS.boxSize / 2, -LINK_OPTS.boxSize/2, LINK_OPTS.boxSize, LINK_OPTS.boxSize);
        },
        lookat(c, dist, ivs) {
            const eye = dist * 0.3;
            const eye4 = eye + 40
            c.moveTo(0,0);
            c.lineTo(eye,0);
            c.lineTo(eye4, 20);
            c.moveTo(eye ,0);
            c.lineTo(eye4,-20 );
            c.moveTo(eye4 - 10 ,15);
            c.lineTo(eye4 - 7,0 );
            c.lineTo(eye4 - 10,-15 );
            c.moveTo(eye4 ,0);
            c.lineTo(dist ,0);
            c.lineTo(dist  - 40,10);
            c.moveTo(dist ,0);
            c.lineTo(dist -40,-10);
        },
        attach(c, dist, ivs) {
            c.moveTo(35,-10);
            c.lineTo(2,0);
            c.lineTo(35,10);
            c.moveTo(2,0);
            c.lineTo(dist -10,0);
            c.lineTo(dist +5,10);
            c.lineTo(dist +5,-10);
            c.lineTo(dist -10,0);
        },
        linked(c, dist, ivs) {
            c.moveTo(-8, -14);
            c.lineTo(22, 0);
            c.lineTo(-8, 14);
            c.moveTo(4, 0);
            c.lineTo(dist, 0);
			c.rect(dist-3,-3,6,6);
            
        }		
    }
    const isOutputLinkStyle = style => style === linkStyles.fLinkOutput || style === linkStyles.fLinkNewOutput || style === linkStyles.fLinkOutputUD;
    var selectionCallback;
    var selectingPreviouseArray;
    var selectingAxisSel;
    var selectingAxisId; // 1 x, 2 y, 3 both
    var selectingAxisEdges;  // bit field bits 3,2,1 for left,center, right, or top, center, bottom
    var widgetColor = "yellow";
    var selectorColor = "white";
    var audioLevelColor = "#0AF";
    var selectorDashSize = 10;
    var selectorDash = [selectorDashSize];
    const cursors = [
        {name : "default", holdName: undefined},
        {rot : 0, name : "drag_NS", corner: 5},
        {rot : Math.PI * (1 / 2), name : "drag_EW", corner: 6},
        {rot : Math.PI , name : "drag_NS", corner: 7},
        {rot : Math.PI * (3 / 2), name : "drag_EW", corner: 8},
        {name : "move"},
        {rot : -Math.PI * (1 / 2), name : "rotate_N_skew_ns", dragName : "rotate_N"},
        {rot : Math.PI * (3 / 4), name : "drag_NS", corner: 1},
        {rot : Math.PI * (3 / 4), name : "drag_EW", corner: 2},
        {rot : Math.PI * (7 / 4), name : "drag_NS", corner: 3},
        {rot : -Math.PI * (9 / 4), name : "drag_EW", corner: 4},
        {name : "pointer"},
        {name : "pointer"},
        {rot :-Math.PI * (1 / 2), name : "rotate_N_skew_ew", dragName : "rotate_N"},
        {name : "special_move"},
        {name : "cutter", actionName: "cutter_cut"},
        {name : "add_sub"},
        {name : "add_input"},
        {name : "add_output"},
        {name : "add_input"},
        {name : "add_output"},
        {name : "cutter", actionName: "cutter_cut"},    // lookat
        {name : "cutter", actionName: "cutter_cut"},    // attached
        {name : "cutter", actionName: "cutter_cut"},    // linked
    ];
    function updateTransform() {
        x -= cx - w / 2;
        y -= cy - h / 2;
        cx = w / 2;
        cy = h / 2;
        m[0] = (xdx = Math.cos(rx)) * sx;
        m[1] = (xdy = Math.sin(rx)) * sx;
        m[2] = (ydx = Math.cos(ry)) * sy;
        m[3] = (ydy = Math.sin(ry)) * sy;
        m[4] = x;
        m[5] = y;
        const cross = m[0]  * m[3]  - m[1]  * m[2] ;
        im[0] =  m[3] / cross;
        im[1] = -m[1] / cross;
        im[2] = -m[2] / cross;
        im[3] =  m[0] / cross;
        im[4] = (m[1] * m[5] - m[3] * m[4]) / cross;
        im[5] = (m[2] * m[4] - m[0] * m[5]) / cross;
        invLSx = 1 / sx;
        invLSy = 1 / sy;
        if(!pointLike){
            wigetCorners[1].x = -cx * m[0] - cy * m[2];
            wigetCorners[1].y = -cx * m[1] - cy * m[3];
            wigetCorners[2].x =  cx * m[0] - cy * m[2];
            wigetCorners[2].y =  cx * m[1] - cy * m[3];
            wigetCorners[3].x =  cx * m[0] + cy * m[2];
            wigetCorners[3].y =  cx * m[1] + cy * m[3];
            wigetCorners[4].x = -cx * m[0] + cy * m[2];
            wigetCorners[4].y = -cx * m[1] + cy * m[3];
            wigetCorners[5].x = -cy * m[2];
            wigetCorners[5].y = -cy * m[3];
            wigetCorners[6].x =  cx * m[0];
            wigetCorners[6].y =  cx * m[1];
            wigetCorners[7].x =  cy * m[2];
            wigetCorners[7].y =  cy * m[3];
            wigetCorners[8].x = -cx * m[0];
            wigetCorners[8].y = -cx * m[1];
            cCount = 9;
        }else{
            cCount = 1;
        }
    }
    function toLocal(x, y) {
        const iv = 1 / invS;
        const xx = x - m[4];
        const yy = y - m[5];
        lx = (xx * im[0] + yy * im[2]);
        ly = (xx * im[1] + yy * im[3]);
    }
    function locateLocal(x, y) {
        const iv = 1 / invS;
        const xx = x - m[4];
        const yy = y - m[5];
        lx = (xx * im[0] + yy * im[2]);
        ly = (xx * im[1] + yy * im[3]);
        var rightX,topY,botY, leftX
        cx < 0 ? (leftX = cx, rightX = cx - w) : (leftX = -cx, rightX = -cx + w);
        cy < 0 ? (topY = cy, botY = cy - h) : (topY = -cy, botY = -cy + h);
        cursorScaleRotateAdd = (cx < 0) === (cy < 0) ? 0 : Math.PI90;
        over = lx > leftX  && lx < rightX && ly > topY && ly < botY;
        rDist = 100000;
        rSide = -1;
        if (Math.abs(ly - topY) < Math.abs(ly - botY)) {
            vDist = (ly - topY) * iv / invLSy;
            hLine =  cy < 0 ? bottom : top;
        } else {
            vDist = (botY - ly) * iv / invLSy;
            hLine =  cy < 0 ? top : bottom;
        }
        if (Math.abs(lx - leftX) < Math.abs(lx - rightX)) {
            hDist = (lx - leftX) * iv / invLSx;
            vLine =  cx < 0 ? right : left;
        } else {
            hDist = (rightX - lx) * iv / invLSx;
            vLine =  cx < 0 ? left : right;
        }
        cursorRotateRotateAdd = 0;
        if (vDist < -2 && vDist > -20) {
            rDist = Math.abs(0 - lx) * iv  / invLSx;
            vDist = hDist = 100000;
            rLine = hLine;
            rSide = rotate;
            cursorRotateRotateAdd = cy < 0 ? Math.PI : 0;
        } else if (hDist < -2 && hDist > -20) {
            rDist = Math.abs(0 - ly) * iv  / invLSy;
            vDist = hDist = 100000;
            rLine = vLine;
            rSide = rotateSide;
            cursorRotateRotateAdd = cx < 0 ? Math.PI : 0;
        } else if (vDist < -10 || hDist < -10) { vDist = hDist = 100000 }
        else {
            const hsize = Math.abs(h * iv / invLSy);
            const wsize = Math.abs(w * iv / invLSx);
            if (hsize < 60 && vDist >= 0 && vDist > hsize / 6) { vDist = 20 }
            else { vDist = Math.abs(vDist) }
            if (wsize < 60 && hDist >= 0 && hDist > wsize / 6) { hDist = 20 }
            else { hDist = Math.abs(hDist) }
        }
    };
    function toWorld(x, y) {
        wx = x * m[0] + y * m[2] + m[4];
        wy = x * m[1] + y * m[3] + m[5];
    };
    function toWorldRelPoint(x, y, point) {
        point.x = x * m[0] + y * m[2];
        point.y = x * m[1] + y * m[3];
    };
    function highlightLinkBeforeAction() {
        holdFor && (holdFor--);
        if(!holdFor) {
            const lLine = closestLinkLine.line;
            const lSpr = lLine.start;


            if (linkAction === LINK_ACTIONS.moveUp) {
                let source = isOutputLinkStyle(lLine.style) ? lSpr.fLink.outputs : lSpr.fLink.inputs;
                const t = source[lLine.idx];
                source[lLine.idx] = source[lLine.idx - 1];
                source[lLine.idx - 1] = t;
                if (lSpr.fLink.resetOnChange) { lSpr.fLink.reset = true }
            } else if (linkAction === LINK_ACTIONS.moveDown) {
                let source = isOutputLinkStyle(lLine.style)  ? lSpr.fLink.outputs : lSpr.fLink.inputs;
                const t = source[lLine.idx];
                source[lLine.idx] = source[lLine.idx + 1];
                source[lLine.idx + 1] = t;
                if (lSpr.fLink.resetOnChange) { lSpr.fLink.reset = true }
            } else if (linkAction === LINK_ACTIONS.cut) {
                if(lLine.type === linkTypes.attach) {
                    lSpr.clearAttached();
                } else if(lLine.type === linkTypes.lookat) {
                    lSpr.clearLookat();
                } else if(lLine.type === linkTypes.linked) {
                    lSpr.clearLinked();
                } else {
                    let source = isOutputLinkStyle(lLine.style)  ? lSpr.fLink.outputs : lSpr.fLink.inputs;
                    if (lLine.cutAll) {
                        source.length = 0;
                    } else {
                        source.splice(lLine.idx,1);
                    }
                    lLine.allStart = false;    
                    lLine.cutAll = false;
                    if (lSpr.fLink.resetOnChange) { lSpr.fLink.reset = true }
                }
            } else if (linkAction === LINK_ACTIONS.newLinkIn) {
                //lSpr.fLink.funcObj
            } else if (linkAction === LINK_ACTIONS.newLinkOut) {
                 //source.splice(lLine.idx,1);
            }
            linkAction = 0;
            editSprites.update();
            API.update();
        }  else {
            const lLine = closestLinkLine.line;
            if (linkAction === LINK_ACTIONS.moveUp) {
                drawLink(lLine, false, "#0FF");
                drawLink(linkLines[lLine.listPos - 1], false, "#F00");
            } else if (linkAction === LINK_ACTIONS.moveDown) {
                drawLink(lLine, false, "#0FF");
                drawLink(linkLines[lLine.listPos + 1], false, "#F00");
            } else if (linkAction === LINK_ACTIONS.cut) {
                drawLink(lLine, false, "#F00", ((holdFor + 1) / 20) ** 0.8);
                if ((mouse.ctrl || lLine.cutAll) && lLine.type === linkTypes.line) {
                    for(const link of linkLines) {
                        if (lLine.start === link.start && link.col === lLine.col && lLine !== link) {
                            if (!lLine.allStart) {  lLine.cutAll = true; }
                            drawLink(link, false, "#F00", ((holdFor + 1) / 20) ** 0.8);
                            link.start && (link.start.highlight = false);
                            link.end && (link.end.highlight = false);
                        }
                    }
                }
                lLine.allStart = true;

            }else if (linkAction === LINK_ACTIONS.newLinkIn) {
                //lSpr.fLink.funcObj
            } else if (linkAction === LINK_ACTIONS.newLinkOut) {
                 //source.splice(lLine.idx,1);
            }
            lLine.start && (lLine.start.highlight = false);
            lLine.end && (lLine.end.highlight = false);
        }
    }
    function drawLink(link, checkDist, col = link.col, lineWidthScale = 1) {
        var x1,y1,x2,y2,dx,dy,dist,dis,nx,ny,wx,wy,hx,hy;
        const rx = mouse.cMouse.rx;
        const ry = mouse.cMouse.ry;
        const ivs = 1 / invS;
        const is = invS * (settings.Render_U_I_Size / 10);
 
        const lw = (checkDist ? LINK_OPTS.stroke : LINK_OPTS.highLightStroke) * lineWidthScale;
        if (!checkDist) {

            if (link.start && link.end) {
                link.start.highlight = true;
                link.end.highlight = true;
            }

        }
        c.strokeStyle = col;
        const mat = x1 = link.start.key.m;
        if(link.type === linkTypes.box || link.type === linkTypes.boxOut || link.type === linkTypes.lineStart || link.type === linkTypes.fLineIn || link.type === linkTypes.fLineOut) {
            if(invS < 1.5) {
                x1 = link.start.x + mat[0] * link.xPos + mat[2] * link.yPos;
                y1 = link.start.y + mat[1] * link.xPos + mat[3] * link.yPos;
                let text = "";
       
                if(checkDist) {
                    dx = x1 - rx;
                    dy = y1 - ry;
                    dist = Math.sqrt(dx * dx + dy * dy) * 2;        
                    if(dist < closestLinkLine.dist) {
                        closestLinkLine.dist = dist;
                        closestLinkLine.line = link;
                    }
                } else if(link.start.fLink.funcObj) {
                    if(link.style === linkStyles.fLinkInputUD) {
                        const inp = link.start.fLink.funcObj.inputs[link.idx];
                        text = inp[0];
                    } else if(link.style === linkStyles.fLinkOutputUD) {
                        const outp = link.start.fLink.funcObj.outputs[link.idx];
                        text = outp[0];
                    }
                }
                c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
                c.transform(mat[0], mat[1], mat[2], mat[3], x1, y1);
                c.beginPath();
                link.style(c);
                c.setTransform(1,0,0,1,0,0);
                c.lineWidth = lw
                c.stroke();
                if(text !== "") {
                    c.font = "10px arial";
                    c.textAlign = "left";
                    c.textBaseline ="bottom";
                    c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
                    c.transform(mat[0], mat[1], mat[2], mat[3], x1, y1);
                    const w = c.measureText(text).width
                    c.fillStyle = "#0009"
                    c.fillRect(4, -11, w + 4, 12);
                    c.fillStyle = "#FFF"
                    c.fillText(text, 6, 0);
                    c.setTransform(1,0,0,1,0,0);
                }
            }
        } else {
            x1 = link.start.x + mat[0] * link.xPos + mat[2] * link.yPos;
            y1 = link.start.y + mat[1] * link.xPos + mat[3] * link.yPos;
            x2 = link.end ? link.end.x : x1 - 100;
            y2 = link.end ? link.end.y : y1;
            dx = x2 - x1;
            dy = y2 - y1;
            dist = Math.sqrt(dx * dx + dy * dy);
            if(dist > 0) {
                nx = dx / dist * is;
                ny = dy / dist * is;
                dist /= is;
                if(link.end && !link.toCenter) {
                    const dx = Math.cos(link.end.rx) * 0.5;
                    const dy = Math.sin(link.end.rx) * 0.5;
                    wx = link.end.w * link.end.sx * dx;
                    wy = link.end.w * link.end.sx * dy;
                    hx = link.end.h * link.end.sy * -dy;
                    hy = link.end.h * link.end.sy * dx;
                    wp1.x = link.end.x - wx - hx;
                    wp1.y = link.end.y - wy - hy;
                    wp2.x = link.end.x + wx - hx;
                    wp2.y = link.end.y + wy - hy;
                    wp3.x = link.end.x + wx + hx;
                    wp3.y = link.end.y + wy + hy;
                    wp4.x = link.end.x - wx + hx;
                    wp4.y = link.end.y - wy + hy;
                    wp5.x = x1;
                    wp5.y = y1;
                    wp6.x = x2;
                    wp6.y = y2;
                    const u = unitDistToBoxLineIntercept(wp1, wp2, wp3, wp4, wp5, wp6);
                    dist *= u > 1 ? 1 : u;
                    x2 = x1 + nx * dist;
                    y2 = y1 + ny * dist;
                }
                if (checkDist && link.type !== linkTypes.fLineNoCut) {
                    const distFrom = distPointFromLineseg(x1,y1,x2,y2,rx,ry) / is;
                    const uDist = D2PointRes.u * dist;
                    if(distFrom < closestLinkLine.dist && uDist < dist - LINK_OPTS.lineSpacing * 2 && uDist > LINK_OPTS.lineSpacing * 2) {
                        closestLinkLine.dist = distFrom;
                        closestLinkLine.line = link;
                    }
                }
                c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
                c.transform(nx, ny, -ny, nx, x1, y1);
                c.beginPath();
                link.style(c, dist, ivs);
                c.setTransform(1,0,0,1,0,0);
                c.lineWidth = lw;
                c.stroke();
            }
        }
    }
    function drawLinks() {
        if (closestLinkLine.dist !== -1) {
            if (closestLinkLine.line) {
                closestLinkLine.line.start && (closestLinkLine.line.start.highlight = false);
                closestLinkLine.line.end && (closestLinkLine.line.end.highlight = false);
            }
        }
        if (!linkAction) {
            closestLinkLine.dist = LINK_OPTS.boxSize ;
            closestLinkLine.line = undefined;
        } else {
            closestLinkLine.dist = -1;
        }
        var idx = 0;
        if(linkCount){
            for(const link of linkLines) {
                if(linkAction && link === closestLinkLine.line) {
                }else{
                    drawLink(link, true);
                }
                idx ++;
                if(!(idx < linkCount)) { break }
            }
            if (closestLinkLine.dist !== -1) {
                if (closestLinkLine.line?.start) {
                    if (linkAction) {
                        closestLinkLine.line.start.highlight = true;
                        closestLinkLine.line.end.highlight = true;
                    }
                           
                }
            }
        }
    }
    function draw(lineWidth) {
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.lineWidth = invS * lineWidth;
        c.strokeStyle = widgetColor;
        c.beginPath();
        const SX = invLSx * invS;
        const SY = invLSy * invS;
        if(selectionCallback && selectingAxisSel && (mouse.ctrl || mouse.alt)){
            if(mouse.ctrl){
                c.lineTo(-cx - 1000 * SX, -cy);
                c.lineTo(-cx + w + 1000 * SX, -cy);
                c.moveTo(-cx + w + 1000 * SX, -cy + h);
                c.lineTo(-cx - 1000 * SX, -cy + h);
            }else{
                c.lineTo(-cx + w, -cy - 1000 * SY);
                c.lineTo(-cx + w, -cy + h + 1000 * SY);
                c.moveTo(-cx, -cy + h + 1000 * SY);
                c.lineTo(-cx, -cy - 1000 * SY);
            }
        }else{
            // outer box
            if((singleSprite && (!locks.scaleX || !locks.scaleY)) || !singleSprite){
                c.lineTo(-cx, -cy);
                c.lineTo(-cx + w, -cy);
                c.lineTo(-cx + w, -cy + h);
                c.lineTo(-cx, -cy + h);
                c.closePath();
            }
            if(singleSprite && selection[0] && selection[0].locates) {
                const sS = subScale;
                c.moveTo(-cx * sS, -cy * sS);
                c.lineTo(-cx * sS + w * sS, -cy * sS);
                c.lineTo(-cx * sS + w * sS, -cy * sS + h * sS);
                c.lineTo(-cx * sS, -cy * sS + h * sS);
                c.closePath();
            }
        }
        // inner cross
        if(!locks.positionX || !locks.positionY){
            c.moveTo(-8 * SX, 0);
            c.lineTo(8 * SX, 0);
            c.moveTo(0, -8 * SY);
            c.lineTo(0, 8 * SY);
        }
        if(!locks.rotateX || !locks.rotateY){
            // Top rotator
            c.moveTo(-2 * SX, -cy);
            c.lineTo(-2 * SX, -cy - 18 * SY);
            c.moveTo(2 * SX, -cy);
            c.lineTo(2 * SX, -cy - 18 * SY);
            //Bottom rotator
            c.moveTo(0, -cy + h);
            c.lineTo(0, -cy + h + 18 * SY);
            //right rotator
            c.moveTo(-cx + w, 0);
            c.lineTo(-cx + w + 18 * SX, 0);
            //left rotator
            c.moveTo(-cx, 0);
            c.lineTo(-cx - 18 * SX, 0);
        }
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.stroke();
        drawLinks();

    }
    function drawSelector() {
        c.lineWidth = 1;
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        const x = Math.min(sel.x, sel.xx);
        const y = Math.min(sel.y, sel.yy);
        const w = Math.abs(sel.x - sel.xx);
        const h = Math.abs(sel.y - sel.yy);
        if(selectionCallback) {
            c.strokeStyle = selectorColor;
        }else{
            c.strokeStyle = settings.highlightColor;
        }
        c.setLineDash([selectorDashSize]);
        c.beginPath();
        c.rect(x, y, w, h);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.stroke();
        sel.tx = x;
        sel.ty = y;
        sel.w = w;
        sel.h = h;
         c.setLineDash([]);
    }
    function highlight(part) {
        if (part === linkLine) {
            
            if (mouse.ctrl) {
                for(const link of linkLines) {
                    if (closestLinkLine.line.start === link.start && link.col === closestLinkLine.line.col && closestLinkLine.line !== link) {
                        drawLink(link, false, link.col, 1);
                    }
                }
            } else {
                for(const link of linkLines) {
                    if (link.start?.highlight) { link.start.highlight = false; }
                    if (link.end?.highlight) { link.end.highlight = false; }
                }
                
            }     
            drawLink(closestLinkLine.line, false, closestLinkLine.line.hCol);            
            return;
        }
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.lineWidth = invS * 3;
        c.strokeStyle = widgetColor;
        c.beginPath();
        if (part === top) {
            c.lineTo(-cx, -cy);
            c.lineTo(-cx + w, -cy);
        } else if (part === right) {
            c.lineTo(-cx + w, -cy);
            c.lineTo(-cx + w, -cy + h);
        } else if (part === bottom) {
            c.lineTo(-cx + w, -cy + h);
            c.lineTo(-cx, -cy + h);
        } else if (part === left) {
            c.lineTo(-cx, -cy + h);
            c.lineTo(-cx, -cy);
        } else if (part === center) {
            c.moveTo(-invS *8 * invLSx, 0);
            c.lineTo(invS *8 * invLSx, 0);
            c.moveTo(0, -invS *8 * invLSy);
            c.lineTo(0, invS *8 * invLSy);
            c.moveTo(-cx, -cy);
            c.lineTo(-cx + w, -cy);
            c.lineTo(-cx + w, -cy + h);
            c.lineTo(-cx, -cy  + h );
            c.closePath();
        } else if (part === attachCenter) {
            const sS = subScale;
            c.strokeStyle = "red";
            c.moveTo(-cx * sS, -cy * sS);
            c.lineTo(-cx * sS + w * sS, -cy * sS);
            c.lineTo(-cx * sS + w * sS, -cy * sS + h * sS);
            c.lineTo(-cx * sS, -cy * sS + h * sS);
            c.closePath();
        } else if (part === rotate) {
            c.moveTo(-invS * 2 * invLSx, -cy);
            c.lineTo(-invS * 2 * invLSx, -cy - invS *18 * invLSy);
            c.moveTo(invS * 2 * invLSx, -cy);
            c.lineTo(invS * 2 * invLSx, -cy - invS *18 * invLSy);
            c.moveTo(0, -cy + h);
            c.lineTo(0, -cy + h + invS *18 * invLSy);
            //right rotator
            c.moveTo(-cx + w, 0);
            c.lineTo(-cx + w + invS * 18 * invLSx, 0);
            //left rotator
            c.moveTo(-cx, 0);
            c.lineTo(-cx - invS * 18 * invLSx, 0);
        }
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.stroke();
    }
    function drawCross(x, y, width = 2, size = 8, col = "red") {
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.lineWidth = invS * width;
        c.strokeStyle = col;
        c.beginPath();
        c.moveTo(x -invS * size, y - invS * size);
        c.lineTo(x + invS * size, y + invS * size);
        c.moveTo(x -invS * size, y + invS * size);
        c.lineTo(x + invS * size, y - invS * size);
        c.stroke();
    }
    function lineTo(x,y,xx, yy) {
        c.lineTo(x + xx * xdx + yy * ydx, y + xx * xdy + yy * ydy);
    }
    function moveTo(x,y,xx, yy) {
        c.moveTo(x + xx * xdx + yy * ydx, y + xx * xdy + yy * ydy);
    }
    function findSnapMark() {
        snapPosRef.x = 0;
        snapPosRef.y = 0;
        var cc = 0;
        if(snapsSelect === 4) { return cc }
        if ((snapsSelect & 4) && Math.abs(lx) < w * 0.25 && Math.abs(ly) < h * 0.25) { return cc }
        if ((snapsSelect & 3) === 1) {
            if (lx < 0 && ly >= 0) { snapPosRef.x = -w / 2; snapPosRef.y = h / 2; cc = 4 }
            else if (lx >= 0 && ly < 0) { snapPosRef.x = w / 2; snapPosRef.y = -h / 2; cc = 2 }
            else if (lx >= 0 && ly >= 0) { snapPosRef.x = w / 2; snapPosRef.y = h / 2; cc = 3 }
            else { snapPosRef.x = -w / 2; snapPosRef.y = -h / 2; cc = 1 }
            return cc;
        }
        if ((snapsSelect & 3) === 2) {
            if (lx < 0) { // left
                if (Math.abs(ly) > - lx) {  // top bot
                    if (ly < 0) { snapPosRef.y = -h / 2; cc = 5 } // top
                    else { snapPosRef.y = h / 2; cc = 7 } // bot
                } else { snapPosRef.x = -w / 2; cc = 8 }  // left

            } else {  // right
                if (Math.abs(ly) > lx) {  // top bot
                    if (ly < 0) { snapPosRef.y = -h / 2; cc = 5 } // top
                    else { snapPosRef.y = h / 2; cc = 7 } // bot
                } else { snapPosRef.x = w / 2; cc = 6 }  // right

            }
            return cc;
        }
        if (lx < -w * 0.25) { snapPosRef.x = -w / 2; cc = 8 }
        else if (lx > w  * 0.25) { snapPosRef.x = w / 2; cc = 6  }
        if (ly < -h  * 0.25) {
            snapPosRef.y = - h / 2;
            cc = cc === 0 ? 5 : (cc === 8 ? 1 : 2);
        } else if (ly > h  * 0.25) {
            snapPosRef.y =  h / 2;
            cc = cc === 0 ? 7 : (cc === 8 ? 4 : 3);
        }
        return cc;
    }
    const snapMarks = [
        function (x,y, s) {
            lineTo(x, y,-s, - s);
            lineTo(x, y,s, s);
            moveTo(x, y, -s, s);
            lineTo(x, y, s, - s);
        },
        function (x,y, s) { // top lef
            moveTo(x, y, s, s / 2);
            c.lineTo(x, y);
            lineTo(x, y, s / 2, s);
        },
        function (x,y, s) { // top right
            moveTo(x, y, - s, s / 2);
            c.lineTo(x, y);
            lineTo(x, y, - s / 2, s);
        },
        function (x,y, s) { // bottom right
            moveTo(x, y, - s, - s / 2);
            c.lineTo(x, y);
            lineTo(x, y, - s / 2, - s);
        },
        function (x,y, s) { // bottom left
            moveTo(x, y, s, - s / 2);
            c.lineTo(x, y);
            lineTo(x, y, s / 2, - s);
        },
        function (x,y, s) { // top mid
            moveTo(x, y, - s / 2, s);
            c.lineTo(x, y);
            lineTo(x, y, s / 2, s);
        },
        function (x,y, s) { // right mid
            moveTo(x, y, - s, - s / 2);
            c.lineTo(x, y);
            lineTo(x, y, - s, s / 2);
        },
        function (x,y, s) { // bottom mid
            moveTo(x, y, - s / 2, - s);
            c.lineTo(x, y);
            lineTo(x, y, s / 2, - s);
        },
        function (x,y, s) { // left mid
            moveTo(x, y, s, - s / 2);
            c.lineTo(x, y);
            lineTo(x, y, s, s / 2);
        },
    ];
    const snapScaleMarks = [
        function (x,y, s) {
            lineTo(x, y,-s, - s);
            lineTo(x, y,s, s);
            moveTo(x, y, -s, s);
            lineTo(x, y, s, - s);
        },
        function (x,y, s) { // top left
            moveTo(x, y, s, 0);
            lineTo(x, y, -s * 0.75, -s * 0.75);
            lineTo(x, y, 0, s);
        },
        function (x,y, s) { // top right
            moveTo(x, y, - s, 0);
            lineTo(x, y, s * 0.75, -s * 0.75);
            lineTo(x, y, 0, s);
        },
        function (x,y, s) { // bottom right
            moveTo(x, y, 0, - s);
            lineTo(x, y, s * 0.75, s * 0.75);
            lineTo(x, y, - s, 0);
        },
        function (x,y, s) { // bottom left
            moveTo(x, y, 0, - s);
            lineTo(x, y, -s * 0.75, s * 0.75);
            lineTo(x, y, s, 0);
        },
        function (x,y, s) { // top mid
            moveTo(x, y, - s / 2, 0);
            lineTo(x, y, 0, -s);
            lineTo(x, y, s / 2, 0);
        },
        function (x,y, s) { // right mid
            moveTo(x, y, 0, - s / 2);
            lineTo(x, y, s, 0);
            lineTo(x, y, 0, s / 2);
        },
        function (x,y, s) { // bottom mid
            moveTo(x, y, - s / 2,0);
            lineTo(x, y, 0, s);
            lineTo(x, y, s / 2, 0);
        },
        function (x,y, s) { // left mid
            moveTo(x, y, 0, - s / 2);
            lineTo(x, y, -s, 0);
            lineTo(x, y, 0, s / 2);
        },
    ];
    function drawSnapMark(type, x, y, width = 2, size = 8, col = "red") {
        if(snapMarks[type]) {
            c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
            c.lineWidth = invS * width;
            c.strokeStyle = col;
            c.beginPath();
            snapMarks[type](x,y, invS * size);
            c.stroke();
        }
    }
    function drawScaleSnapMark(type, x, y, width = 2, size = 8, col = "red") {
        if(snapScaleMarks[type]) {
            c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
            c.lineWidth = invS * width;
            c.strokeStyle = widgetColor;
            c.beginPath();
            snapScaleMarks[type](x,y, invS * size);
            c.stroke();
        }
    }
    function debugP(x, y, size = 8, col = "red") {  // point marker local space
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.lineWidth = invS *4;
        c.strokeStyle = col;
        c.beginPath();
        c.moveTo(x -invS * size, y - invS * size);
        c.lineTo(x + invS * size, y + invS * size);
        c.moveTo(x -invS * size, y + invS * size);
        c.lineTo(x + invS * size, y - invS * size);
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.stroke();
    }
    function debugL(x1, y1, x2, y2, width = 1, col = "red") { // line marker local space
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.lineWidth = width * invS;
        c.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        c.strokeStyle = col;
        c.beginPath();
        c.lineTo(x1, y1);
        c.lineTo(x2, y2);
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.stroke();
    }
    function debugWP(x, y, size = 8, col = "red") {
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.lineWidth = invS *4;
        c.strokeStyle = col;
        c.beginPath();
        c.moveTo(x -invS * size, y - invS * size);
        c.lineTo(x + invS * size, y + invS * size);
        c.moveTo(x -invS * size, y + invS * size);
        c.lineTo(x + invS * size, y - invS * size);
        c.stroke();
    }
    function debugScrSpce(x1,y1,dir,len,width = 1, col = "red"){
        const x2 = Math.cos(dir);
        const y2 = Math.sin(dir);
        c.lineWidth = width;
        c.transform(1,0,0,1,0,0);
        c.strokeStyle = col;
        c.beginPath();
        c.lineTo(x1, y1);
        c.lineTo(x2 * len + x1, y2 * len + y1);
        c.lineTo(x2 * (len - 4) - y2 * 2 + x1, y2 * (len-4) + x2  * 2 + y1);
        c.stroke();
    }
    var debugStart = { x: 50, y : 50, step : 16}
    var debugDo = { ...debugStart}
    function debugSss(){
        debugDo = { ...debugStart}
    }
    function debugText(text, col = "white"){
                 c.transform(1,0,0,1,0,0);
        c.strokeStyle = col;
         c.textAlign = "left";
         c.fillText(text, debugDo.x, debugDo.y);
         debugDo.y += debugDo.step;
     }
    function selectionMade() {
        if (selectionCallback) {
            var call = selectionCallback;
            sprites.selectingSprite = false;
            selectionCallback = undefined;
            call(selectingPreviouseArray, selectingAxisId, selectingAxisEdges);
            mouse.button = 0;
            sprites.each(spr => spr.highlightSelecting = false);
            mouse.release(id);
            draggingType = none;
            spriteList.eachOpen(listItem => {
                listItem.element.classList.remove("itemHighlight");
            });
        }
    }
    function evalSelection(originX, originY) {
        var ax,ay;
        axisAligned = true;
        axisShared = undefined;
        if(selection.length === 1){
            axisAligned = true;
            axisShared = true;
            selection.each(spr => {
                ax = spr.rx;
                ay = spr.ry;
                var ex = spr.extra;
                if(ex === undefined){
                    spr.extra = ex = {};
                }
                ex.w = spr.w * spr.sx;
                ex.h = spr.h * spr.sy;
                ex.x = spr.x - originX;
                ex.y = spr.y - originY;
            });
        }else{
            selection.each(spr => {
                if(axisShared === undefined){
                    axisShared = true;
                    ax = spr.rx;
                    ay = spr.ry;
                }else if(axisShared){
                    if( ! ((Math.axisEqual(ax,spr.rx) || Math.axisEqual(ay,spr.rx)) && (Math.axisEqual(ax,spr.ry) || Math.axisEqual(ay,spr.ry))) ) {
                        axisShared = false;
                    }
                }
                if(axisAligned){
                    if( ! ((Math.axisEqual(0,spr.rx) || Math.axisEqual(Math.PI90,spr.rx)) && (Math.axisEqual(0,spr.ry) || Math.axisEqual(Math.PI90,spr.ry))) ) {
                        axisAligned = false;
                    }
                }
                var ex = spr.extra;
                if(ex === undefined){
                    spr.extra = ex = {};
                }
                ex.w = spr.w * spr.sx;
                ex.h = spr.h * spr.sy;
                ex.x = spr.x - originX;
                ex.y = spr.y - originY;
            });
        }
        if(axisShared){
            axisSharedX = ax;
            axisSharedY = ay;
        }else{
            axisSharedX = 0;
            axisSharedY = Math.PI90;
        }
    }
    function addLink(spr, sprTo, idx, num, type, style, col, count, highlightCol = col) {
        var link;
        const spy = LINK_OPTS.lineSpacing;
        if(linkCount < linkLines.length) {
            link = linkLines[linkCount];
            link.start = spr;
            link.end = sprTo;
            link.style = style;
            link.idx = idx;
            link.col = col;
            link.hCol = highlightCol;
            link.type = type;
            link.xPos = -spr.cx - LINK_OPTS.boxSize * 2;
            link.yPos =   - count * spy * 0.5 + spy * num;
            link.listPos = linkCount;
            link.toCenter = false;
        } else {
            linkLines.push(link = {
                start: spr,
                end: sprTo,
                style,
                idx,
                col,
                hCol: highlightCol,
                type,
                xPos : -spr.cx - LINK_OPTS.boxSize * 2,
                yPos :  - count * spy * 0.5 + spy * num,
                listPos: linkCount,
                toCenter: false,
            });
        }
        linkCount ++;
        return link;
    }
    function updateLines() {
        var idx, num;
        linkCount = 0;
        const spy = LINK_OPTS.lineSpacing;
        selection.each(spr => {
            if (!spr.type.hideOutline || spr.type.functionLink) {            
                if(spr.type.functionLink) {
                    idx = 0;
                    num = 0;
                    if(spr.fLink.funcObj) {
                        const count = spr.fLink.funcObj.inputs.length + spr.fLink.funcObj.outputs.length - 1
                        if(singleSprite) {
                            const count = spr.fLink.funcObj.inputs.length + spr.fLink.funcObj.outputs.length - 1;
                            for(const s of spr.fLink.funcObj.inputs) {
                                const box = addLink(spr, undefined, idx, num, linkTypes.fLineIn, linkStyles.fLinkInputUD, LINK_OPTS.inCol, count);
                                box.xPos = -spr.cx - LINK_OPTS.boxSize * 2;
                                box.yPos = -count * spy * 0.5 + spy * num;
                                num ++;
                                idx ++;
                            }
                            idx = 0;
                            for(const s of spr.fLink.funcObj.outputs) {
                                const box = addLink(spr, undefined, idx, num, linkTypes.fLineOut, linkStyles.fLinkOutputUD, LINK_OPTS.outCol, count);
                                box.xPos = -spr.cx - LINK_OPTS.boxSize * 2;
                                box.yPos = -count * spy * 0.5 + spy * num;
                                num ++;
                                idx ++;
                            }
                            idx = 0;
                            num = 0;
                        }
                        for(const s of spr.fLink.funcObj.inputs) { 
                            addLink(spr, spr.fLink.funcObj.getById(s[1]), idx++, num++, linkTypes.fLineNoCut, linkStyles.fLinkInput, LINK_OPTS.inCol, count); 
                        }
                        idx = 0;
                        for(const s of spr.fLink.funcObj.outputs) {  
                            addLink(spr, spr.fLink.funcObj.getById(s[1]), idx++, num++, linkTypes.fLineNoCut, linkStyles.fLinkOutput, LINK_OPTS.outCol, count); 
                        }
                    }else{
                        const count =  spr.fLink.inputs.length + spr.fLink.outputs.length - 1;
                        if(singleSprite) {
                            const count = spr.fLink.inputs.length + spr.fLink.outputs.length - 1;
                            const inLinker = addLink(spr, undefined, 0, 0, linkTypes.box, linkStyles.fLinkNewInput, LINK_OPTS.inCol, count);
                            const outLinker = addLink(spr, undefined, 0, 0, linkTypes.boxOut, linkStyles.fLinkNewOutput, LINK_OPTS.outCol, count);
                            inLinker.xPos = -spr.cx - LINK_OPTS.boxSize;
                            inLinker.yPos = -spr.cy;
                            outLinker.xPos = -spr.cx - LINK_OPTS.boxSize;
                            outLinker.yPos = spr.cy;
                            for(const s of spr.fLink.inputs) {
                                const box = addLink(spr, s, idx, num, linkTypes.lineStart, linkStyles.fLinkInputUD, LINK_OPTS.inCol, count);
                                box.xPos = -spr.cx - LINK_OPTS.boxSize * 2;
                                box.yPos = - count * spy * 0.5 + spy * num;
                                num ++;
                                idx ++;
                            }
                            idx = 0;
                            for(const s of spr.fLink.outputs) {
                                const box = addLink(spr, s, idx, num, linkTypes.lineStart, linkStyles.fLinkOutputUD, LINK_OPTS.outCol, count);
                                box.xPos = -spr.cx - LINK_OPTS.boxSize * 2;
                                box.yPos = - count * spy * 0.5 + spy * num;
                                num ++;
                                idx ++;
                            }
                            idx = 0;
                            num = 0;
                        }
                        for(const s of spr.fLink.inputs) { addLink(spr, s, idx++, num++, linkTypes.line, linkStyles.fLinkInput, LINK_OPTS.inCol, count) }
                        idx = 0;
                        for(const s of spr.fLink.outputs) { addLink(spr, s, idx++, num++, linkTypes.line, linkStyles.fLinkOutput, LINK_OPTS.outCol, count) }
                    }
                }
                if(spr.type.lookat) {
                    const line =  addLink(spr, spr.lookat.spr, 0, 0, linkTypes.lookat, linkStyles.lookat, LINK_OPTS.lookatCol, 0, LINK_OPTS.lookatHighlightCol) ;
                    line.xPos = 0;
                    line.yPos = 0;
                    line.toCenter = true;
                }
                if(spr.type.attached) {
                    const line =  addLink(spr, spr.attachedTo, 0, 0, linkTypes.attach, linkStyles.attach, LINK_OPTS.attachCol, 0, LINK_OPTS.attachHighlightCol);
                    line.xPos = 0;
                    line.yPos = 0;
                    line.toCenter = true;
                }
                if(spr.type.linked) {
                    const line =  addLink(spr, spr.linked, 0, 0, linkTypes.linked, linkStyles.linked, LINK_OPTS.linkedCol, 0, LINK_OPTS.linkedHighlightCol) ;
                    line.xPos = 0;
                    line.yPos = 0;
                    line.toCenter = true;
                }				
            }
        });
        linkLines.length = linkCount;
    }
    function addGridLine(x, y, dir, axis, far = false) {
        var line = gridLines[gridLineCount];
        if (line === undefined) {
            gridLines[gridLineCount] = line = {
                p1 : {x : 0, y : 0},
                p2 : { x : 0, y : 0},
                direction : 0,
                center : { x: 0, y : 0 },
            };
        }
        dir = ((dir % Math.PI) + Math.PI) % Math.PI;
        var dx = Math.cos(dir) * 10000;
        var dy = Math.sin(dir) * 10000;
        line.p1.x = x  - dx;
        line.p1.y = y  - dy;
        line.p2.x = x  + dx;
        line.p2.y = y  + dy;
        line.center.x = x;
        line.center.y = y;
        line.direction = dir;
        line.axis = axis;
        line.far = far;
        gridLineCount ++;
    }
    function updateGridLines() {
        gridLineCount = 0;
        sprites.each(spr => {
            if (!spr.selected && spr.type.snapTo) {
                if(spr.type.grid){
                    const type = spr.grid.type === "X" ? 0 : 1;
                    spr.key.toWorld(0, -spr.cy);
                    const tcx = spr.key.wx;
                    const tcy = spr.key.wy;
                    spr.key.toWorld(0, spr.cy);
                    const bcx = spr.key.wx;
                    const bcy = spr.key.wy;
                    const count = spr.gridY;
                    var dx = (bcx - tcx) / count;
                    var dy = (bcy - tcy) / count;
                    var i = 0, xx = tcx, yy = tcy;
                    while(i <= count) {
                        addGridLine(xx, yy, spr.rx, type, true);
                        xx += dx;
                        yy += dy;
                        i++;
                    }
                }else  if(spr.type.vanish){
                    if(spr.grid.radial){
                        // not sure if this should be supported.
                        const type = spr.grid.type === "X" ? 0 : 1;
                        const count = spr.gridY * 4;
                        const x = spr.x;
                        const y = spr.y;
                        var i = 0;
                        while(i < count) {
                            const ang = (i / count) * Math.TAU
                            addGridLine(x, y, ang, type, true);
                            i++;
                        }
                    }else{
                        const type = spr.grid.type === "X" ? 0 : 1;
                        spr.key.toWorld(spr.cx, -spr.cy);
                        const tcx = spr.key.wx;
                        const tcy = spr.key.wy;
                        spr.key.toWorld(spr.cx, spr.cy);
                        const bcx = spr.key.wx;
                        const bcy = spr.key.wy;
                        const count = spr.gridY;
                        var dx = (bcx - tcx) / count;
                        var dy = (bcy - tcy) / count;
                        const x = spr.x;
                        const y = spr.y;
                        var i = 0, xx = tcx, yy = tcy;
                        while(i <= count) {
                            addGridLine(x, y, Math.atan2(y - yy, x - xx), type, true);
                            xx += dx;
                            yy += dy;
                            i++;
                        }
                    }
                } else if(spr.snapFunc) {
                    spr.snapFunc(spr, addGridLine);
                } else if(!spr.type.marker) {
                    addGridLine(spr.x, spr.y, spr.rx,0);
                    addGridLine(spr.x, spr.y, spr.ry,1);
                    spr.key.toWorld(-spr.cx, -spr.cy);
                    addGridLine(spr.key.wx, spr.key.wy, spr.rx,0);
                    addGridLine(spr.key.wx, spr.key.wy, spr.ry,1);
                    spr.key.toWorld(-spr.cx + spr.w, -spr.cy + spr.h);
                    addGridLine(spr.key.wx, spr.key.wy, spr.rx,0);
                    addGridLine(spr.key.wx, spr.key.wy, spr.ry,1);
                }else{
                    addGridLine(spr.x, spr.y, spr.rx,0,true);
                    addGridLine(spr.x, spr.y, spr.ry,1,true);
                }
            }
        });
    }
    function getClosestGridLine(px, py, minDistF, next, within = viewDiagonal) {
        var x, y, x1, y1, xx, yy, dist;
        var minDist = minDistF === undefined ? Infinity : minDistF;
        var minLineIndex = -1;
        const mgl = next ? minGridLineNext : minGridLine;
        mgl.show = false;
        snapFound = false;
        const wCount = pointLike ? 1 : 5;
        for (var i = 0; i < gridLineCount; i++) {
            const l = gridLines[i];
            if (next && (i === minGridLine.index || Math.abs(minGridLine.dir - l.direction) < 0.01)) { continue }
            if(l.far || (Math.abs(px - l.center.x) < within && Math.abs(py- l.center.y) < within)){
                xx = l.p1.x;
                yy = l.p1.y;
                const v1x = l.p2.x - xx;
                const v1y = l.p2.y - yy;
                const cc = (v1y * v1y + v1x * v1x);
                for (var j = 0; j < wCount; j++) {
                    const c = wigetCorners[j];
                    const ppx = px + c.x;
                    const ppy = py + c.y;
                    const u = ((ppx - xx) * v1x + (ppy - yy) * v1y) / cc;
                    x1 = (x = xx + v1x * u) - ppx;
                    y1 = (y = yy + v1y * u) - ppy;
                    dist = Math.sqrt(x1 * x1 + y1 * y1);
                    if (dist < minDist) {
                        mgl.x = x;
                        mgl.y = y;
                        mgl.ox = c.x;
                        mgl.oy = c.y;
                        mgl.index = i;
                        mgl.cornerIndex = j;
                        mgl.dist = dist;
                        mgl.dir = l.direction;
                        minDist = dist;
                        minLineIndex = i;
                        snapFound = true;
                        break;
                    }
                }
            }
        }
        return minDist;
    }
    function getClosestGridLineToCorner(px, py, minDistF, next, cornerIdx, within = viewDiagonal) {
        var x, y, x1, y1, xx, yy, dist;
        var minDist = minDistF === undefined ? Infinity : minDistF;
        var minLineIndex = -1;
        const mgl = next ? minGridLineNext : minGridLine;
        mgl.show = false;
        snapFound = false;
        const c = wigetCorners[cornerIdx];
        const wCount = pointLike ? 1 : 5;
        for (var i = 0; i < gridLineCount; i++) {
            const l = gridLines[i];
            if (next && (i === minGridLine.index || Math.abs(minGridLine.dir - l.direction) < 0.01)) { continue }
            if(l.far || (Math.abs(px - l.center.x) < within && Math.abs(py- l.center.y) < within)){
                xx = l.p1.x;
                yy = l.p1.y;
                const v1x = l.p2.x - xx;
                const v1y = l.p2.y - yy;
                const cc = (v1y * v1y + v1x * v1x);
                const ppx = px + c.x;
                const ppy = py + c.y;
                const u = ((ppx - xx) * v1x + (ppy - yy) * v1y) / cc;
                x1 = (x = xx + v1x * u) - ppx;
                y1 = (y = yy + v1y * u) - ppy;
                dist = Math.sqrt(x1 * x1 + y1 * y1);
                if (dist < minDist) {
                    mgl.x = x;
                    mgl.y = y;
                    mgl.ox = c.x;
                    mgl.oy = c.y;
                    mgl.index = i;
                    mgl.cornerIndex = cornerIdx;
                    mgl.dist = dist;
                    mgl.dir = l.direction;
                    minDist = dist;
                    minLineIndex = i;
                    snapFound = true;
                }
            }
        }
        return minDist;
    }
    function getClosestSpriteCorner(px,py, minDistF){
        const p = workPoint1;
        var dx,dy;
        var minDist = minDistF;
        snapFound = false;
        sprites.each(spr => {
            if(!spr.selected && spr.type.snapTo){
                const k = spr.key;
                for(var i = 0; i < 4; i++){
                    k.corner(i,p);
                    dx = p.x - px;
                    dy = p.y - py;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if(dist < minDist){
                        minSpriteCorner.x = p.x;
                        minSpriteCorner.y = p.y;
                        minSpriteCorner.dist = minDist = dist;
                        snapFound = true;
                    }
                }
            }
        });
        return minDist;
    }
    function getClosestGrid(px, py, axis,  minDistF, within = viewDiagonal) {
        var x, y, x1, y1, xx, yy, dist;
        var minDist =  minDistF;
        var minLineIndex = -1;
        const mgl = minGridLine;
        mgl.show = false;
        snapFound = false;
        for (var i = 0; i < gridLineCount; i++) {
            const l = gridLines[i];
            if(axis !== undefined) {
                if(Math.abs(axis - l.direction) % Math.PI > 0.01){
                    continue;
                }
            }
            if(l.far || (Math.abs(px - l.center.x) < within && Math.abs(py- l.center.y) < within)){
                xx = l.p1.x;
                yy = l.p1.y;
                const v1x = l.p2.x - xx;
                const v1y = l.p2.y - yy;
                const cc = (v1y * v1y + v1x * v1x);
                const u = ((px - xx) * v1x + (py - yy) * v1y) / cc;
                x1 = (x = xx + v1x * u) - px;
                y1 = (y = yy + v1y * u) - py;
                dist = Math.sqrt(x1 * x1 + y1 * y1);
                if (dist < minDist) {
                    mgl.x = x;
                    mgl.y = y;
                    mgl.ox = 0;
                    mgl.oy = 0;
                    mgl.index = i;
                    mgl.dist = dist;
                    mgl.dir = l.direction;
                    minDist = dist;
                    minLineIndex = i;
                    snapFound = true;
                }
            }
        }
        return minDist;
    }
    function getNextClosestGrid(px, py,  minDistF, within = viewDiagonal) {
        var x, y, x1, y1, xx, yy, dist;
        var minDist =  minDistF;
        var minLineIndex = -1;
        const mgl = minGridLineNext;
        mgl.show = false;
        snapFound = false;
        for (var i = 0; i < gridLineCount; i++) {
            const l = gridLines[i];
            if(i === minGridLine.index) { continue; }
            if(l.far || (Math.abs(px - l.center.x) < within && Math.abs(py- l.center.y) < within)){
                xx = l.p1.x;
                yy = l.p1.y;
                const v1x = l.p2.x - xx;
                const v1y = l.p2.y - yy;
                const cc = (v1y * v1y + v1x * v1x);
                const u = ((px - xx) * v1x + (py - yy) * v1y) / cc;
                x1 = (x = xx + v1x * u) - px;
                y1 = (y = yy + v1y * u) - py;
                dist = Math.sqrt(x1 * x1 + y1 * y1);
                if (dist < minDist) {
                    mgl.x = x;
                    mgl.y = y;
                    mgl.ox = 0;
                    mgl.oy = 0;
                    mgl.index = i;
                    mgl.dist = dist;
                    mgl.dir = l.direction;
                    minDist = dist;
                    minLineIndex = i;
                    snapFound = true;
                }
            }
        }
        return minDist;
    }
    const locSnapArray = [[0,0],[0,0],[0,0],[0,0]];
    function interceptGridLines(){
        const mlA = minGridLine;
        const mlB = minGridLineNext;
        const l1 = gridLines[mlA.index];
        const l2 = gridLines[mlB.index];
        const v1x = l1.p2.x - l1.p1.x;
        const v1y = l1.p2.y - l1.p1.y;
        const v2x = l2.p2.x - l2.p1.x;
        const v2y = l2.p2.y - l2.p1.y;
        var u = (v2x * (l1.p1.y - l2.p1.y) - v2y * (l1.p1.x - l2.p1.x)) / (v1x * v2y - v1y * v2x);
        var xx = l1.p1.x + v1x * u;
        var yy = l1.p1.y + v1y * u;
        var minDist = Infinity;
        var wc;
        for (var j = 0; j < cCount; j++) {
            const c = wigetCorners[j];
            var dist = Math.sqrt((((c.x + x) - xx) ** 2) + (((c.y + y) - yy) ** 2));
            if(dist < minDist){
                minDist = dist;
                wc = c;
            }
        }
        if (wc) {
            mlA.xx = xx;
            mlA.yy = yy;
            mlA.ix = xx - wc.x;
            mlA.iy = yy - wc.y;
        }
        return minDist;
    }
    function drawGridLines() {
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.strokeStyle = API.gridLineColor;
        c.globalAlpha = 1;
        c.lineWidth = v.invScale;
        c.beginPath();
        for (var i = 0; i < gridLineCount; i++) {
            const l = gridLines[i];
            c.moveTo(l.p1.x, l.p1.y);
            c.lineTo(l.p2.x, l.p2.y);
        }
        c.stroke();
    }
    function drawGridLine(index) {
        c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
        c.strokeStyle = API.gridLineColor;
        c.globalAlpha = 3;
        c.lineWidth = v.invScale;
        c.beginPath();
        const l = gridLines[index];
        c.moveTo(l.p1.x, l.p1.y);
        c.lineTo(l.p2.x, l.p2.y);
        c.stroke();
    }
    function drawAnimPath(spr) {
        if (spr.widgetAnimPath) {
            c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
            c.globalAlpha = 0.5;
            c.strokeStyle = "#0A0";
            c.lineWidth = v.invScale;
            const len = spr.widgetAnimPath.length;
            var i = 0, p;
            c.beginPath();
            p = spr.widgetAnimPath[i++];
            c.moveTo(p.x, p.y);
            while (i < len) {
                p = spr.widgetAnimPath[i++];
                c.lineTo(p.x, p.y);
            }
            c.stroke();
            c.lineWidth = v.invScale * 1.5;
            c.strokeStyle = "#FFF";
            i = 0;
            c.beginPath();
            while (i < len) {
                p = spr.widgetAnimPath[i++];
                c.moveTo(p.x - v.invScale, p.y);
                c.lineTo(p.x, p.y);
            }
            c.stroke();                
            c.lineWidth = v.invScale * 5;
            c.strokeStyle = "#F00";
            c.globalAlpha = 0.75;
            i = 0;
            c.beginPath();
            while (i < len) {
                p = spr.widgetAnimPath[i++];
                if (p.key) {
                    c.moveTo(p.x - v.invScale, p.y);
                    c.lineTo(p.x, p.y);
                }
            }
            c.stroke();                
        }
        
    }
    function drawLevelPath(spr) {
        if (spr.levels && spr.levels.length > 1) {
            c.setTransform(vm[0], vm[1], vm[2], vm[3], vm[4], vm[5]);
            const mat = spr.key.m;
            c.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
            c.globalAlpha = 0.5;
            c.strokeStyle = "#000";
            c.lineWidth = v.invScale * 2;
            const len = spr.levels.length;
            var i = 0, pathW = spr.sx * spr.w, pathH = spr.sy * spr.h, offY = spr.cy;
            c.beginPath();
            const wp1 = utils.point;
            const wp2 = utils.point;
            var xPosA, yPosA;
            var minDist = pathH / 10;
            while (i < len) {
                const p = spr.levels[i]
                const xPosB = p.x * pathW - spr.cx;
                const yPosB = (1 - p.y) * pathH - offY;
                c.lineTo(xPosB, yPosB);
                if (xPosA !== undefined) {
                    const dist = distPointFromLineseg(xPosA, yPosA, xPosB, yPosB, spr.key.lx- spr.cx, spr.key.ly - offY);
                    if (dist < minDist) {
                        minDist = dist;
                        wp1.as(xPosA, yPosA);
                        wp2.as(xPosB, yPosB);
                    }
                }
                i++;
                xPosA = xPosB;
                yPosA = yPosB;
                
            }
            c.stroke();                
            c.globalAlpha = 1.0;
            c.strokeStyle = audioLevelColor;
            c.lineWidth = v.invScale;
            c.stroke();                
            if (minDist < pathH) {
                c.beginPath();
                c.lineWidth = v.invScale * 3;
                c.lineTo(wp1.x, wp1.y);
                c.lineTo(wp2.x, wp2.y);
                c.stroke();                
            }
            /*   c.beginPath();
                c.lineWidth = v.invScale * 3;
                c.lineTo(spr.key.lx - 5 - spr.cx, spr.key.ly - offY);
                c.lineTo(spr.key.lx + 5 - spr.cx, spr.key.ly - offY);
                c.moveTo(spr.key.lx - spr.cx, spr.key.ly - 5 - offY);
                c.lineTo(spr.key.lx - spr.cx, spr.key.ly + 5 - offY);
                c.stroke();  */
        }
        
    }    
    const API = {
        gridLineColor : settings.gridLineColor,
        setView(view) {
            v = view;
            c = view.context;
            vm = view.matrixRef;
            vim = view.invMatrixRef;
        },
        selectionCallback(callback, axisSelectable = false, axisId = 3, edges = 0b101) {
            if (callback === undefined) {
                selectionCallback = undefined;
                sprites.selectingSprite = false;
                selectingPreviouseArray = undefined;
                selectingAxisSel = false;
                selectingAxisId = 0;
                selectingAxisEdges = 0;
                spriteList.eachOpen(listItem => {
                    listItem.element.classList.remove("itemHighlight");
                });
            } else {
                selectingAxisSel = axisSelectable;
                selectingAxisId = axisId;
                selectingAxisEdges = edges;                 
                if(axisSelectable) { 
                    keyboard.lastKey = undefined; 
                    spriteRender.highlightAxis = selectingAxisId !== 3
                } else {                        
                    spriteRender.highlightAxis = false;
                }
                selectionCallback = callback;
                sprites.selectingSprite = true;
                selectingPreviouseArray = selection.asArray();
                selection.clear();
            }
        },
        specialSelectionOption() {
            if(selectingAxisSel){
                selectingAxisId += 1;
                selectingAxisId = selectingAxisId > 3 ? 1 : selectingAxisId;
                spriteRender.highlightAxis = selectingAxisId !== 3;
            }
        },
        specialSelectionSelect(clear = false) {
            if(clear) { selection.clear() }
            selectionMade();
        },
        modifing: false, // If this is true then timeline can automaticly update keyframes (record and modify modes). timeline will be set to false after automaticlty modifing key frames.
        doMouse(cMouse) {
            var nw, nh, dx, dy,snaX,snaY;
            if (!editSprites.drawingModeOn) {
                invS = v.invScale;
                const snapDist = 20 * invS;
                mouseOverSelectable = cMouse.overSpritesLength > 0;
                if ((active && cMouse.over) || mouse.captured === id) {
                    toLocal(cMouse.oldRx, cMouse.oldRy);
                    const olx = lx;
                    const oly = ly;
                    locateLocal(cMouse.rx, cMouse.ry);
                    const rightButton = (mouse.button & 4) === 4;
                    const leftButton = (mouse.button & 1) === 1;
                    if (mouse.captured === id) {
                        if (draggingType === selector) {
                            if (mouse.button === 1) {
                                sel.xx = cMouse.rx;
                                sel.yy = cMouse.ry;
                            } else {
                                mouse.release(id);
                                draggingType = none;
                                selectionMade();
                            }
                        } else if (mouse.button !== 0) {
							animation.lightboxOn && (animation.lightBoxNeedsUpdate = true);
                            dx = cMouse.rx - cMouse.oldRx;
                            dy = cMouse.ry - cMouse.oldRy;
                            editSprites.undoable = true;
                            const ox = x;
                            const oy = y;
                            if (draggingType === center || draggingType === attachCenter) {
                                API.modifing = true;
                                x += dx;
                                y += dy;
                                ax += dx;
                                ay += dy;
                                snaX = ax + snapPosRef.x;
                                snaY = ay + snapPosRef.y;
                            } else if (draggingType === rotate || draggingType === rotateSide) {
                                 API.modifing = true;
                                let v1x = cMouse.rx - x;
                                let v1y = cMouse.ry - y;
                                let v2x = cMouse.oldRx - x;
                                let v2y = cMouse.oldRy - y;
                                let len = (v1x * v1x + v1y * v1y) ** 0.5;
                                v1x /= len;
                                v1y /= len;
                                len = (v2x * v2x + v2y * v2y) ** 0.5;
                                v2x /= len;
                                v2y /= len;
                                var ang = Math.asin(v2x * v1y - v2y * v1x);
                                rx += ang;
                                ry += ang;
                                cursorRotate = Math.atan2(cMouse.ry - m[5], cMouse.rx - m[4]);

                            } else if (isScalingDrag[draggingType]) {
                                API.modifing = true;
                                if (editSprites.snapMode === 2) {
                                    x += dx;
                                    y += dy;
                                    snaX = cMouse.rx + snapPosRef.x;
                                    snaY = cMouse.ry + snapPosRef.y;
                                    sm.toLocal(Math.round(cMouse.rx / pixelSnap) * pixelSnap, Math.round(cMouse.ry / pixelSnap) * pixelSnap);
                                } else if (editSprites.snapMode === 1) {
                                    if (gridLineCount > 0) {
                                        let mrx = cMouse.rx;
                                        let mry = cMouse.ry;
                                        if ((scaleCorners & 3) === 1){
                                            getClosestGrid(mrx, mry, axisSharedY, snapDist+1);
                                            if (snapFound) {
                                                mrx = minGridLine.x;
                                                mry = minGridLine.y;
                                                minGridLine.show = true;
                                                drawCross(mrx,mry,2, 6,API.gridLineColor);
                                            }
                                        } else if ((scaleCorners & 3) === 2){
                                            getClosestGrid(mrx, mry,axisSharedX,snapDist+1);
                                            if (snapFound) {
                                                mrx = minGridLine.x;
                                                mry = minGridLine.y;
                                                minGridLine.show = true;
                                                drawCross(mrx,mry,2, 6,API.gridLineColor);
                                            }
                                        } else {
                                            getClosestSpriteCorner(mrx, mry,snapDist+1);
                                            if (!snapFound) {
                                                getClosestGrid(mrx, mry,undefined,snapDist+1);
                                                if (snapFound) {
                                                    mrx = minGridLine.x;
                                                    mry = minGridLine.y;
                                                    minGridLine.show = true;
                                                    getNextClosestGrid(cMouse.rx, cMouse.ry,snapDist+1);
                                                    if (snapFound) {
                                                        if(interceptGridLines() < snapDist){
                                                            drawCross(minGridLine.xx, minGridLine.yy, 2, 6, API.gridLineColor);
                                                            mrx = minGridLine.xx;
                                                            mry = minGridLine.yy;
                                                            minGridLineNext.show = true;
                                                        }
                                                    } else {
                                                        drawCross(mrx,mry,2, 6,API.gridLineColor);
                                                    }
                                                }
                                            } else {
                                                mrx = minSpriteCorner.x;
                                                mry = minSpriteCorner.y;
                                                drawCross(mrx,mry,2, 6,API.gridLineColor);
                                            }
                                        }
                                        sm.toLocal(mrx, mry);
                                    } else {
                                        sm.toLocal(Math.round(cMouse.rx / pixelSnap) * pixelSnap, Math.round(cMouse.ry / pixelSnap) * pixelSnap);
                                    }
                                } else {sm.toLocal(cMouse.rx, cMouse.ry) }
                                nw = (sm.lx - sox) * asx;
                                nh = (sm.ly - soy) * asy;
                            }
                            if (draggingType === center || draggingType === attachCenter) {
                                 API.modifing = true;
                                if (editSprites.drawingModeOn === false) {
                                    if (editSprites.snapMode === 1) {
                                        if (getClosestGridLineToCorner(ax , ay, snapDist, false, snapPosRef.c) < snapDist) {
                                            dx = minGridLine.x - ox - minGridLine.ox;
                                            dy = minGridLine.y - oy - minGridLine.oy;
                                            minGridLine.show = true;
                                            if (getClosestGridLineToCorner(x + dx,y + dy,snapDist, true, snapPosRef.c) < snapDist) {
                                                if(interceptGridLines() < snapDist){
                                                    drawCross(minGridLine.xx, minGridLine.yy, 2, 6, API.gridLineColor);
                                                    dx = minGridLine.ix - ox;
                                                    dy = minGridLine.iy - oy;
                                                    minGridLineNext.show = true;
                                                }
                                            }
                                        } else {
                                            dx = ax - ox;
                                            dy = ay - oy;
                                        }
                                    } else if (editSprites.snapMode === 2) {
                                        dx = (Math.round(snaX / pixelSnap) * pixelSnap - ox) - snapPosRef.x;
                                        dy = (Math.round(snaY / pixelSnap) * pixelSnap - oy) - snapPosRef.y;
                                    }
                                }
                                selection.widgetMove(dx, dy, draggingType === attachCenter);
                            } else if (draggingType === rotate || draggingType === rotateSide) {
                                API.modifing = true;
                                if (leftButton) {
                                    if (selection.length > 1 && rotateScaleWidgetMode2) {
                                        selection.widgetRotate(sm[4], sm[5], ang, ang, false, true);
                                    } else {
                                        selection.widgetRotate(cx, cy, ang, ang);
                                    }
                                } else if (rightButton) {
                                    if (draggingType === rotate) { selection.widgetRotate(cx, cy, ang, 0, true) }
                                    else { selection.widgetRotate(cx, cy, 0, ang, true) }
                                }
                            } else if (isScalingDrag[draggingType]) {
                                API.modifing = true;
                                if (selection.length > 1) {
                                    //const sc = Math.max(nw / aw, nh / ah);
                                    //const scx = nw / aw;
                                    //const scy = nh / ah;
                                    if(axisAligned || rotateScaleWidgetMode2){
                                        const scx = nw / aw;
                                        const scy = nh / ah;
                                        const sscx = ((nw - aw / 2) / (aw / 2))
                                        const sscy = ((nh - ah / 2) / (ah / 2))
                                        selection.eachUpdate(spr => {
                                            if (!spr.locks.scale) {
                                                const e = spr.extra;
                                                if (spr.type.normalisable) {
                                                    if(spr.type.vanish){
                                                        if ((scaleCorners & 1) === 1) { spr.w = sscx * e.w };
                                                        if ((scaleCorners & 2) === 2) { spr.h = sscy * e.h };
                                                    }else{
                                                        if ((scaleCorners & 1) === 1) { spr.w = scx * e.w };
                                                        if ((scaleCorners & 2) === 2) { spr.h = scy * e.h };
                                                    }
                                                    spr.cx = spr.w / 2;
                                                    spr.cy = spr.h / 2;
                                                } else {
                                                    const mx = Math.sign(spr.sx), my = Math.sign(spr.sy);
                                                    if ((scaleCorners & 1) === 1) { spr.sx = (scx * e.w) / spr.w }
                                                    if ((scaleCorners & 2) === 2) { spr.sy = (scy * e.h) / spr.h }
                                                    spr.sx = Math.abs(spr.sx) * mx;
                                                    spr.sy = Math.abs(spr.sy) * my;
                                                }
                                                if(!spr.type.vanish){
                                                    if ((scaleCorners & 1) === 1) { spr.x = sm.wx + e.x * scx }
                                                    if ((scaleCorners & 2) === 2) { spr.y = sm.wy + e.y * scy }
                                                }
                                            }
                                        });
                                    }else{
                                        const sc = Math.max(nw / aw, nh / ah);
                                        selection.eachUpdate(spr => {
                                            if(!spr.locks.scale) {
                                                const e = spr.extra;
                                                if (spr.type.normalisable) {
                                                    spr.w = sc * e.w;
                                                    spr.h = sc * e.h;
                                                    spr.cx = spr.w / 2;
                                                    spr.cy = spr.h / 2;
                                                } else {
                                                    const mx = Math.sign(spr.sx), my = Math.sign(spr.sy);
                                                    spr.sx = (sc * e.w) / spr.w;
                                                    spr.sy = (sc * e.h) / spr.h;
                                                    spr.sx = Math.abs(spr.sx) * mx;
                                                    spr.sy = Math.abs(spr.sy) * my;
                                                }
                                                if(!spr.type.vanish){
                                                    spr.x = sm.wx + e.x * sc;
                                                    spr.y = sm.wy + e.y * sc;
                                                }
                                            }
                                        });
                                    }
                                } else {
                                    const sscx = ((nw - aw / 2) / (aw / 2))
                                    const sscy = ((nh - ah / 2) / (ah / 2))
                                    selection.eachUpdate(spr => {
                                        if(!spr.locks.scale) {
                                            const k = spr.key;
                                            const e = spr.extra;
                                            if (spr.type.normalisable) {
                                                if(spr.type.vanish){
                                                    if ((scaleCorners & 1) === 1) { spr.w = sscx * e.w };
                                                    if ((scaleCorners & 2) === 2) { spr.h = sscy * e.h };
                                                }else{
                                                    if ((scaleCorners & 1) === 1) { spr.w = nw };
                                                    if ((scaleCorners & 2) === 2) { spr.h = nh };
                                                }
                                                spr.cx = spr.w / 2;
                                                spr.cy = spr.h / 2;
                                            } else {
                                                if ((scaleCorners & 1) === 1) { spr.sx = nw / spr.w }
                                                if ((scaleCorners & 2) === 2) { spr.sy = nh / spr.h }
                                                spr.sx = Math.abs(spr.sx) * (mx ? -1 : 1);
                                                spr.sy = Math.abs(spr.sy) * (my ? -1 : 1);
                                            }
                                            if(spr.type.hasLocators) { spr.locators.update() }
                                            if(spr.attachment) {
                                                if(spr.attachment.inheritScaleX) { spr.attachment.sx = spr.sx / spr.attachedTo.sx }
                                                if(spr.attachment.inheritScaleY) { spr.attachment.sy = spr.sy / spr.attachedTo.sy }
                                            }
                                            k.update();
                                            k.toWorld(sux * spr.w, suy * spr.h);
                                            if(!spr.type.vanish){
                                                spr.x += sm.wx - k.wx;
                                                spr.y += sm.wy - k.wy;
                                            }
                                        }
                                    });
                                }
                            }
                            if(!limitModify && timeline.editMode === timeline.editModes.modify){
                                if(draggingType === rotate || draggingType === rotateSide) {
                                    timeline.modifyKeysOfSelectedSpr(commands.animSetKeyRotate);
                                }else if(draggingType === center || draggingType === attachCenter) {
                                    timeline.modifyKeysOfSelectedSpr(commands.animSetKeyPos);
                                }else {
                                    timeline.modifyKeysOfSelectedSpr(commands.animSetKeyPosScale);
                                }
                                timeline.canUpdate = true;
                            } else  if(timeline.editMode === timeline.editModes.record){
                                if(draggingType === rotate || draggingType === rotateSide) {
                                    timeline.addKeyToSelectedSpr(commands.animSetKeyRotate);
                                }else if(draggingType === center || draggingType === attachCenter) {
                                    timeline.addKeyToSelectedSpr(commands.animSetKeyPos);
                                }else {
                                    timeline.addKeyToSelectedSpr(commands.animSetKeyPosScale);
                                }
                                timeline.canUpdate = true;
                            }
                            API.update();
                        } else {
                            API.modifing = true;
                            mouse.release(id);
                            const changedForAnim = draggingType;
                            draggingType = none;
                            selection.callIf(spr => spr.type.normalisable, "normalize");
                            if (spriteList.listType === commands.spritesShowGroups) { groups.reboundGroups() }
                            API.update();
                            if(timeline.editMode === timeline.editModes.record){
                                if(changedForAnim === rotate || changedForAnim === rotateSide) {
                                    timeline.addKeyToSelectedSpr(commands.animSetKeyRotate);
                                }else if(changedForAnim === center || changedForAnim === attachCenter) {
                                    timeline.addKeyToSelectedSpr(commands.animSetKeyPos);
                                }else {
                                    timeline.addKeyToSelectedSpr(commands.animSetKeyPosScale);
                                }
                            } else if (timeline.editMode === timeline.editModes.modify){
                                if (changedForAnim === center || changedForAnim === attachCenter) {
                                    timeline.modifyKeysOfSelectedSpr(commands.animSetKeyPos);
                                } else if(changedForAnim === rotate || changedForAnim === rotateSide) {
                                    timeline.modifyKeysOfSelectedSpr(commands.animSetKeyRotate);
                                }
                            }
                            spriteList.updateInfo();
                        }
                    }
                    if ((over && !mouse.shift) || (!mouse.shift && dragType !== none && dragType !== selectable)) {
                        let captured = false;
                        if (mouse.captured === 0) {
                            if (leftButton || (rightButton  && dragType !== center)) {
                                captured = mouse.requestCapture(id,undefined, mouseCaptureReleased);
                                rotateScaleWidgetMode2 = mouse.ctrl;
                            } else if (rightButton) {
                                captured = mouse.requestCapture(id, undefined, mouseCaptureReleased);
                                if (captured) { editSprites.command(commands.edSprClone); }
                            }
                        }
                        if (captured && mouse.captured === id) {
                            API.modifing = false;
                            if(dragType >= linkLine){
                                let okDone = false;
                                const lLine = closestLinkLine.line;
                                if (lLine) {
                                    const lSpr = lLine.start;
                                    if (dragType === lookatLink || dragType === attachedLink || dragType === linkedLink) {
                                        if (leftButton) {
                                            linkAction = LINK_ACTIONS.cut;
                                            okDone = true;
                                        }
                                    } else {
                                        let source = lLine.style === linkStyles.fLinkOutput ? lSpr.fLink.outputs : lSpr.fLink.inputs;
                                        if( dragType === newLinkIn || dragType === newLinkOut) {
                                            issueCommand(dragType === newLinkOut ? commands.edSpriteAttachFuncOutput : commands.edSpriteAttachFuncInput);
                                            mouse.button = 0;
                                            mouse.release(id);
                                            draggingType = none;
                                            return;
                                        }else  if( dragType === newFLinkIn || dragType === newFLinkOut) {
                                            issueCommand(dragType === newFLinkOut ? commands.edSpriteAttachFuncOutput : commands.edSpriteAttachFuncInput);
                                            lSpr.fLink.attachIdx = lLine.idx;
                                            mouse.button = 0;
                                            mouse.release(id);
                                            draggingType = none;
                                            return;
                                        }else  if( dragType === linkOrder){
                                            if (leftButton) {
                                                if(lLine.idx > 0) { linkAction = LINK_ACTIONS.moveUp }
                                                okDone = true;
                                            } else  if (rightButton) {
                                                if(lLine.idx < source.length - 1) { linkAction = LINK_ACTIONS.moveDown}
                                                okDone = true
                                            }
                                        }else{
                                            if (leftButton) {
                                                linkAction = LINK_ACTIONS.cut;
                                                okDone = true;
                                            }
                                        }
                                    }
                                }
                                if (okDone) {
                                    holdFor = 20; // frames visual FX held for so user can see it
                                    cursors[none].holdName = cursors[dragType].actionName ? cursors[dragType].actionName : undefined;

                                    mouse.button = 0;
                                    mouse.release(id);
                                    draggingType = none;
                                    return;
                                }
                            }
                            const dt = draggingType = dragType;
                            let offX = 0, offY = 0;
                            const mrX = mx ? -1 : 1, mrY = my ? -1 : 1;
                            sox = - cx * mrX;
                            soy = - cy * mrY;
                            aw = w * mrX;
                            ah = h * mrY;
                            ax = x;
                            ay = y;
                            sux = -0.5 * mrX;
                            suy = -0.5 * mrY;
                            scaleCorners = 0;
                            if (dt === right || dt === topRight || dt === bottomRight) {
                                scaleCorners |= 1;
                                offX = (lx + sox) / sx;
                            } else if (dt === left || dt === topLeft || dt === bottomLeft) {
                                offX = (lx - sox) / sx;
                                sox +=  aw;
                                sux = 0.5 * mrX;
                                scaleCorners |= 5;
                            }
                            if (dt === bottom || dt === bottomLeft || dt === bottomRight) {
                                scaleCorners |= 2;
                                offY = (ly + soy) / sy;
                            } else if (dt === top || dt === topLeft || dt === topRight) {
                                offY = (ly - soy) / sy;
                                soy += ah;
                                suy = 0.5 * mrY;
                                scaleCorners |= 10;
                            }
                            sox *= mrX;
                            soy *= mrY;
                            if(editSprites.snapMode > 0){
                                asx = (aw * sx) / (lx - sox - offX);
                                asy = (ah * sy) / (ly - soy - offY);
                            }  else {
                                asx = (aw * sx) / (lx - sox);
                                asy = (ah * sy) / (ly - soy);
                            }
                            sm.update();
                            sm.toWorld(sox, soy);
                            evalSelection(sm.wx,sm.wy);
                        }
                    } else if ((!over || mouse.shift) && cMouse.over && draggingType === none) {
                        if ((leftButton || rightButton) && mouse.captured === 0) {
                            API.modifing = false;
                            if (selection.length > 0) {
                                mouse.requestCapture(id,undefined, mouseCaptureReleased);
                                if (mouse.captured === id) {
                                    if (cMouse.overSpritesLength > 0) {
                                        var startAfterSel = false;
                                        for (let i = 0; i <  cMouse.overSpritesLength ; i++) {
                                            if (sprites[cMouse.overSprites[cMouse.overSpritesLength  - i - 1]].selected) {
                                                startAfterSel = !sprites[cMouse.overSprites[0]].selected;
                                                break;
                                            }
                                        }
                                        for (let i = 0; i <  cMouse.overSpritesLength ; i++) {
                                            const spr = sprites[cMouse.overSprites[cMouse.overSpritesLength  - i - 1]];
                                            if (startAfterSel && spr.selected) { startAfterSel = false }
                                            else if (!startAfterSel && !spr.selected) {
                                                if (!mouse.ctrl && !rightButton) { selection.clear(true) }
                                                selection.add(spr);
                                                spriteList.update();
                                                mouse.release(id);
                                                mouse.button = 0;
                                                selectionMade();
                                                break;
                                            }
                                        }
                                    }
                                    if (mouse.button) {
                                        draggingType = selector;
                                        sel.xx = sel.x = cMouse.rx;
                                        sel.yy = sel.y = cMouse.ry;
                                        selection.clear();
                                        spriteList.update();
                                    }
                                }
                            }
                        }
                    }
                } else if (draggingType === none && cMouse.over) {
                    API.modifing = false;
                    if ((mouse.button === 1 || mouse.button === 4) && mouse.captured === 0) {
                        mouse.requestCapture(id, undefined, mouseCaptureReleased);
                        if (mouse.captured === id) {
                            if (cMouse.overSpritesLength > 0) {
                                for (let i = 0; i <  cMouse.overSpritesLength; i++) {
                                    const spr = sprites[cMouse.overSprites[cMouse.overSpritesLength  - i - 1]];
                                    if (!spr.selected) {
                                        selection.add(spr);
                                        spriteList.update();
                                        break;
                                    }
                                }
                                mouse.release(id);
                                selectionMade();
                                mouse.button = 0;
                            } else {
                                draggingType = selector;
                                sel.xx = sel.x = cMouse.rx;
                                sel.yy = sel.y = cMouse.ry;
                            }
                        }
                    }
                }
            }
        },
        updateViewSize() {
            const scale = view.scale;
            const w = c.canvas.width / scale;
            const h = c.canvas.height / scale;
            viewDiagonal = Math.sqrt(w * w + h * h);
        },
        draw() {
            invS = v.invScale;
            API.updateViewSize();
            if (draggingType !== none && mouse.captured !== id) { draggingType = none }
            if (draggingType === selector) {
                drawSelector();
                sprites.getUnderSel(sel, true, selArray);
                selection.add(selArray);
                selArray.length = 0;
                spriteList.update();
            }
            if (active && (mouse.captured === 0 || mouse.captured === id)) {
                if (mouse.captured === 0 && (!mouse.cMouse.over && !holdFor)) {
                    c.globalAlpha = 1;
                    draw(1);
                } else {
                    c.globalAlpha = 1;
                    if (editSprites.drawingModeOn === false && editSprites.snapMode === 1) {
                        if (minGridLineNext.show) { drawGridLine(minGridLineNext.index) }
                        if (minGridLine.show) { drawGridLine(minGridLine.index) }
                    }
                    draw(1);
                    if (draggingType === none) {
                        if ((!locks.scaleX || !locks.scaleY) && (hDist < 10  || vDist < 10)) {
                            if (hDist + vDist < 20) {
                                highlight(vLine);
                                highlight(hLine);
                                dragAngle = rx + cursorScaleRotateAdd;
                                if (vLine === left && hLine === top) { dragType = topLeft; dragAngle += Math.PI  }
                                else if (vLine === right && hLine === top) { dragType = topRight }
                                else if (vLine === right && hLine === bottom) { dragType = bottomRight; dragAngle += Math.PI  }
                                else if (vLine === left && hLine === bottom) { dragType = bottomLeft }
                            } else if (hDist < vDist) {
                                highlight(vLine);
                                dragType = vLine;
                                dragAngle = ry;
                            } else {
                                highlight(hLine);
                                dragType = hLine;
                                dragAngle = rx;
                            }
                            if (editSprites.snapMode && mouse.captured === 0) {
                                const wcp =  wigetCornersPos[snapPosRef.c = cursors[dragType].corner];
                                toWorldRelPoint(wcp.x * w, wcp.y * h, snapPosRef);
                                drawScaleSnapMark(snapPosRef.c, x + snapPosRef.x, y + snapPosRef.y,1, 8, "white");
                            }
                        } else {
                            if (over && (!locks.positionX && !locks.positionY)) {
                                if(singleSprite && selection[0] && selection[0].locates) {
                                    const spr = selection[0];
                                    const lxs = spr.w * spr.sx * subScale;
                                    const lys = spr.h * spr.sy * subScale;
                                    if (lx > - lxs && lx < lxs && ly > - lys && ly  < lys) { dragType = attachCenter }
                                    else { dragType = center }
                                }else {
                                    dragType = center;
                                }
                                highlight(dragType);
                                if (editSprites.snapMode && mouse.captured === 0) {
                                    if (editSprites.snapMode === 1) { setSnapSelect(true, true, true) }
                                    else { setSnapSelect() }
                                    const cc = snapPosRef.c = findSnapMark();
                                    toWorldRelPoint(snapPosRef.x, snapPosRef.y, snapPosRef);
                                    drawSnapMark(cc,x + snapPosRef.x,  y + snapPosRef.y,1, 8, "white");
                                }
                            } else if ((!locks.rotateX && !locks.rotateY) && rDist < 10) {
                                highlight(rotate);
                                dragType = rSide;
                            } else if (closestLinkLine.line) {
                                if(!linkAction) {
                                    highlight(linkLine);
                                    dragType = closestLinkLine.line.type;
                                }else {
                                    dragType = none;
                                    highlightLinkBeforeAction();
                                }
                                dragAngle = undefined;
                            } else {
                                dragAngle = undefined;
                                if (mouseOverSelectable) {
                                    dragType = selectable;
                                } else {
                                    dragType = none;
                                }
                            }
                        }
                    }
                    if (mouse.shift) {
                        mouse.requestCursor(id, cursors[selectable].name, undefined);
                    } else if (dragType !== undefined) {
                        if (selection.length === 1 || mouse.button === 0) {
                            if (dragType === rotate) {
                                dragAngle = ry + cursorRotateRotateAdd;
                                if (rLine === bottom) { dragAngle += Math.PI }
                            } else if (dragType === rotateSide) {
                                dragAngle = rx  + cursorRotateRotateAdd;
                                if (rLine === right) { dragAngle += Math.PI }
                            }
                        } else {
                            dragAngle = cursorRotate + cursorRotateRotateAdd + Math.PI;
                            dragAngle = (dragAngle % Math.TAU + Math.TAU) % Math.TAU;
                        }
                        if (mouse.captured === id && cursors[dragType].dragName) { mouse.requestCursor(id, cursors[dragType].dragName, cursors[dragType].rot + dragAngle) }
                        else if (holdFor > 0 && cursors[dragType].holdName) { mouse.requestCursor(id, cursors[dragType].holdName, cursors[dragType].rot + dragAngle) }
                        else { mouse.requestCursor(id, cursors[dragType].name, cursors[dragType].rot + dragAngle) }
                    }
                }
            } else if (mouseOverSelectable) { mouse.requestCursor(id, cursors[selectable].name, undefined) }
            else { mouse.requestCursor(id, cursors[none].name, undefined) }
            if (selectionCallback && selectingPreviouseArray.length > 0){
                if (selectingAxisSel && dragType < linkLine && (keyboard.lastKey === "ControlLeft" || keyboard.lastKey === "ControlRight")) {
                    keyboard.lastKey = undefined;
                    API.specialSelectionOption();
                }
                spriteRender.drawSpriteList(selectingPreviouseArray, selectingAxisId, selectingAxisEdges);
            }
            if (singleSprite && selection[0]) {
                if (selection[0].type.showAnimPath) {
                    if (!selection[0].widgetAnimPath) { selection[0].updateWidgetAnimPath(); }
                    drawAnimPath(selection[0]);
                } 
                if (selection[0].type.hasLevelPath) { drawLevelPath(selection[0]); }
                
            }            
        },
        update() {
            if (selection.length > 0) {
                if (editSprites.drawingModeOn === false && editSprites.snapMode === 1) {
                    if (mouse.button === 0) {
                        minGridLineNext.show = false;
                        minGridLine.show = false;
                    }
                    updateGridLines();
                }
                if(spriteList.listType === commands.spritesShowGroups) {
                    groups.reboundGroups();
                }
                if (handledCapturedMouseEvents) {
                    handledCapturedMouseEvents = false;
                    editSprites.fireUpdate();
                }
            }
            if (selection.length === 1) {
                singleSprite = true;
                active = true;
                const spr = selection[0];
                locks.rotateX = spr.locks.rotate || spr.locks.rotateX;
                locks.rotateY = spr.locks.rotate || spr.locks.rotateY;
                locks.scaleX = spr.locks.scale || spr.locks.scaleX;
                locks.scaleY = spr.locks.scale || spr.locks.scaleY;
                locks.positionX = spr.locks.position || spr.locks.positionX;
                locks.positionY = spr.locks.position || spr.locks.positionY;
                if(spr.type.ISO){
                    const i = spr.iso;
                    mx = i.isx < 0;
                    my = i.isy < 0;
                    w = spr.w;
                    x = spr.x;
                    cx = spr.cx;
                    sx = Math.abs(i.isx);
                    h = spr.h;
                    y = spr.y;
                    cy = spr.cy;
                    sy = Math.abs(i.isy);
                    rx = i.irx;
                    ry = i.iry;
                } else {
                    mx = spr.sx < 0;
                    my = spr.sy < 0;
                    w = spr.w;
                    x = spr.x;
                    cx = spr.cx;
                    sx = Math.abs(spr.sx);
                    h = spr.h;
                    y = spr.y;
                    cy = spr.cy;
                    sy = Math.abs(spr.sy);
                    rx = spr.rx;
                    ry = spr.ry;
                }
                pointLike = spr.type.marker === true;
                updateTransform();

            } else if (selection.length > 0) {
                singleSprite = false;
                active = true;
                extent = selection.getLocksAndExtent(extent,locks);
                w = extent.w;
                h = extent.h;
                x = extent.x + extent.w / 2;
                y = extent.y + extent.h / 2;
                cx = extent.w / 2;
                cy = extent.h / 2;
                sx = 1;
                sy = 1;
                mx = false;
                my = false;
                rx = 0;
                ry = Math.PI90;
                updateTransform();
            } else {
                active = false;
                singleSprite = false;
            }
            updateLines();

        },
        clear() {
            active = false;
            mouse.cursor = cursors[none];
        },
    }
    selection.addEvent("change", API.update);
    animation.addEvent("change", (owner, name, data) => {
        if (selection.length === 1) {
            if (mouse.captured !== id || (mouse.captured === id && timeline.editMode === timeline.editModes.place)) {
                if (selection[0].type.showAnimPath && (data.type === "forcedchange" || data.type === "state")) {  
                    log("Ap");
                    selection[0].updateWidgetAnimPath();
                }
            }
        }
    });
    function getSettings(){
        limitModify = settings.limitModify;
        widgetColor = settings.widgetColor;
        selectorColor = settings.selectorColor;
        audioLevelColor = settings.audioLevelColor;
        selectorDashSize = Number(settings.selectorDashSize);
        selectorDash[0] = selectorDashSize;
        gridSnapDist = settings.gridLineSnapDistance;
        API.gridLineColor = settings.gridLineColor;
        LINK_OPTS.outCol = settings.highlightSelOutput;
        LINK_OPTS.inCol = settings.highlightSelInput;
        pixelSnap  = settings.pixelSnap;
        cornerSnaps =  settings.gizmoSnapsCorners; // "Use and show gizom corners when snapping",
        midSnaps = settings.gizmoSnapsMidEdge;// "Use and show gizom edge mid points when snapping",
        centerSnaps = settings.gizmoSnapsCenter; // "Use and show gizom center when snapping",
        setSnapSelect();
    }
    getSettings();
    settingsHandler.onchange = getSettings;
    return API;
}) ();