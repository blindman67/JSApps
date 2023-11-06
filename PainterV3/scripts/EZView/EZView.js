"use strict";
//export default ezView;
function ezView(settings = {}) {
    var dirty = true;  // when true matrix and invMatrix may not reflect the current view state
    const matrix = [1,0,0,1,0,0]; // current view transform. 
    const invMatrix = [1,0,0,1,0,0]; // current inverse view transform
    var rotate = 0;  // current x axis direction in radians
    var scale = 1;   // current scale
    const views = [];
    const pos = {  x : 0,  y : 0 };
    var ctx;
    var useConstraint = false;
    const constrained = {  // flags which constraints have been applied
        scale : false,
        max : false,
        min : false,
        position : false,
        top : false,
        bottom : false,
        left : false,
        right : false,        
    };
    const bounds = {top : 0, left : 0, right : 200, bottom : 200};
    var useConstraint = false; // view is restricted to bounds, and Max and Min scale rules.
    var minScale = undefined; // if undefined then no limit
    var maxScale = undefined; // if undefined then no limit;
    const pinch1 = {x :0, y : 0}; // holds the pinch origin used to pan zoom and rotate with two touch points
    const pinch1R = {x :0, y : 0};
    var pinchDist = 0;
    var pinchScale = 1;
    var pinchAngle = 0;
    var pinchStartAngle = 0;
    const workPoint1 = {x :0, y : 0};
    const workPoint2 = {x :0, y : 0};
    const tweenStart = {
        pos : { ...pos },
        scale : 1,
        rotate : 0,
    }
    const tweenEnd = {
        pos : { ...pos },
        scale : 1,
        rotate : 0,
    }
    const bExtent = {
        p1 : { ...pos },  // top left and then around clockwise
        p2 : { ...pos },
        p3 : { ...pos },
        p4 : { ...pos },
        ...bounds,            
    };
    const boundRot = {...bExtent}; // rotated bounds
    // internal functions
    function toWorld(p) {
        p.x -= m[4];
        p.y -= m[5];
        wp2.x = p.x * im[0] + p.y * im[2];
        wp2.y = p.x * im[1] + p.y * im[3];
    }
    function toScreen(p) {  
        wp2.x = p.x * m[0] + p.y * m[2] + m[4]; 
        wp2.y = p.x * m[1] + p.y * m[3] + m[5];
    }    
    function clearConstrained() {
        const c = constrained;
        c.scale = c.max = c.min = c.position = c.top = c.bottom = c.left = c.right = false;
    }
    function boundExtent(bounds) {
        var tx, ty, lx, ly, rx, ry;
        const b = bExtent;
        b.p1.x   = (tx = bounds.top * m[0]) + (lx = bounds.left * m[2]) + m[4];
        b.p1.y   = (ty = bounds.top * m[1]) + (ly = bounds.left * m[3]) + m[5];
        b.p2.x   = tx + (rx = bounds.right * m[2]) + m[4];
        b.p2.y   = ty + (ry = bounds.right * m[3]) + m[5];            
        b.p3.x   = (tx = bounds.bottom * m[0]) + rx + m[4];
        b.p3.y   = (ty = bounds.bottom * m[1]) + ry + m[5];            
        b.p4.x   = tx + lx + m[4];
        b.p4.y   = ty + ly + m[5];     
        b.left   = Math.min(b.p1.x, b.p2.x, b.p3.x, b.p4.x);
        b.top    = Math.min(b.p1.y, b.p2.y, b.p3.y, b.p4.y);
        b.right  = Math.max(b.p1.x, b.p2.x, b.p3.x, b.p4.x);
        b.bottom = Math.max(b.p1.y, b.p2.y, b.p3.y, b.p4.y);
        return b;
    }
    function rotateBoundsExtent(bounds){
        var tx, ty, lx, ly, rx, ry;
        const xdx = Math.cos(rotate);
        const xdy = Math.sin(rotate);
        const b = boundRot;
        b.p1.x   = (tx = bounds.top * xdx) - (lx = bounds.left * xdy);
        b.p1.y   = (ty = bounds.top * xdy) + (ly = bounds.left * xdx);
        b.p2.x   = tx - (rx = bounds.right * xdy);
        b.p2.y   = ty + (ry = bounds.right * xdx);            
        b.p3.x   = (tx = bounds.bottom * xdx) - rx;
        b.p3.y   = (ty = bounds.bottom * xdy) + ry;            
        b.p4.x   = tx - lx;
        b.p4.y   = ty + ly;     
        b.left   = Math.min(b.p1.x, b.p2.x, b.p3.x, b.p4.x);
        b.top    = Math.min(b.p1.y, b.p2.y, b.p3.y, b.p4.y);
        b.right  = Math.max(b.p1.x, b.p2.x, b.p3.x, b.p4.x);
        b.bottom = Math.max(b.p1.y, b.p2.y, b.p3.y, b.p4.y);
        return b;
    }            
    function constrainScale(scale){
        if (useConstraint) {
            if (minScale !== undefined && scale > minScale) { 
                constrained.min = constrained.scale = true;
                return minScale;
            }
            if (maxScale !== undefined && scale < maxScale) { 
                constrained.max = constrained.scale = true;
                return maxScale;
            }
        }   
        return scale;
    }
    function constrain() {
        var mScale, scaleResult;
        const c = constrained;
        scaleResult = scale;
        if (maxScale === undefined) {
            const rB = rotateBoundsExtent(bounds);
            mScale = Math.min(ctx.canvas.width / (rB.right - rB.left), ctx.canvas.height / (rB.bottom - rB.top));
        } else { mScale = maxScale }
        if (scale < mScale) { scaleResult = mScale }
        else if( minScale !== undefined && scale > minScale) { scaleResult = minScale }
        if(scaleResult !== scale){
            if(scale > scaleResult) { c.min = true } else { c.max = true }
            scale = scaleResult;
            const xdx = Math.cos(rotate) * scale;
            const xdy = Math.sin(rotate) * scale;
            m[3] = m[0] = xdx;
            m[2] = -(m[1] = xdy);
            c.scale = true;
        }
        const b = boundExtent(bounds);
        const width = b.right - b.left;
        const height = b.bottom - b.top;
        if (width < ctx.canvas.width) { 
            c.right = c.left = c.position = true;
            m[4] = pos.x -= b.left - (ctx.canvas.width - width) / 2; 
        } else if (b.left > 0) { 
            c.left = c.position = true;
            m[4] = pos.x -= b.left; 
        } else if (b.right < ctx.canvas.width) { 
            c.right = c.position = true
            m[4] = (pos.x -= b.right -  ctx.canvas.width); 
        }
        if (height < ctx.canvas.height) { 
            c.top = c.bottom = c.position = true;
            m[5] = pos.y -= b.top - (ctx.canvas.height - height) / 2; 
        } else if (b.top > 0) { 
            c.top = c.position = true;
            m[5] = pos.y -= b.top; 
        } else if (b.bottom < ctx.canvas.height) { 
            c.bottom = c.position = true;
            m[5] = (pos.y -= b.bottom -  ctx.canvas.height); 	
        }
    }
    /* Alias to make code base a little more readable */
    const wp1 = workPoint1; // alias
    const wp2 = workPoint2; // alias	
    var m = matrix;  // alias
    var im = invMatrix; // alias	
    const API = {
        applyDefault(_ctx = ctx){ _ctx.setTransform(1, 0, 0, 1, 0, 0) },
        apply(_ctx = ctx) {
            if (dirty) { API.update() }
            _ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        },
        applyOn(_ctx = ctx) {
            if (useConstraint) { throw new Error("Can not applyOn existing transform while constraints.") }
            if (dirty) { API.update() }
            _ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        },
        get matrix() { if (dirty) { API.update() } return [...matrix] },
        get invMatrix() { if (dirty) { API.update() } return [...invMatrix] },
        get matrixRef() { return matrix },
        get invMatrixRef() { return invMatrix },        
        get scale() { return scale },
        get invScale() { return 1 / scale },
        get rotation() { return rotate },
        get position() { return {x : pos.x, y : pos.y} },
        get x() { return pos.x },
        get y() { return pos.y },
        get context() { return ctx },      
        get width() { return ctx.canvas.width },
        get height() { return ctx.canvas.height },
        get viewWidth() { return ctx.canvas.width / scale },
        get viewHeight() { return ctx.canvas.height / scale },
        get maxScale() { if (useConstraint) { return maxScale } },        
        get minScale() { if (useConstraint) { return minScale } },      
        set context (context) {
            if (context instanceof CanvasRenderingContext2D) {
                ctx = context; 
                dirty = true;
            } else { throw new ReferenceError("Argument is not an instance of CanvasRenderingContext2D") }
        }, 
        set widget(wig) {
            rotate = Math.atan2(wig.key.im[1], wig.key.im[0]);
            scale = Math.min(ctx.canvas.width / (wig.w * wig.sx), ctx.canvas.height / (wig.h * wig.sy));
            pos.x = ctx.canvas.width / 2  - (wig.x * Math.cos(rotate) * scale - wig.y * Math.sin(rotate) * scale );
            pos.y = ctx.canvas.height / 2 - (wig.x * Math.sin(rotate) * scale + wig.y * Math.cos(rotate) * scale );                    
            dirty = true;
        },
        set position(point) {  pos.x = point.x; pos.y = point.y; dirty = true },
        set scale(_scale) { scale = _scale; dirty = true },			
        set rotate(_rot) { rotate = _rot; dirty = true },			
        set minScale(_scale) { minScale = _scale },   
        getPosition(point = {}) { point.x = pos.x; point.y = pos.y; return point },
        isDirty() { return dirty },
        update() {		
            dirty = false;           
            const xdx = Math.cos(rotate) * scale;
            const xdy = Math.sin(rotate) * scale;
            m[3] = m[0] = xdx;
            m[2] = -(m[1] = xdy);
            m[4] = pos.x;
            m[5] = pos.y;
            if (useConstraint) { constrain() }
            const cross = xdx * xdx + xdy * xdy;
            im[3] = im[0] = xdx / cross;
            im[1] = -(im[2] = xdy / cross);      
        },
        save(name) {
            var savedView = views[name];
            if (dirty) { API.update() }
            if (savedView === undefined) { views[name] = savedView = {rotate, scale, pos : { ...pos }} }
            else {
                savedView.rotate = rotate;
                savedView.scale = scale;
                savedView.pos.x = pos.x;
                savedView.pos.y = pos.y;
            }
            return savedView;
        },
        restore(name) {
            const savedView = views[name];
            if (savedView){
                rotate = savedView.rotate;
                scale = savedView.scale;
                pos.x = savedView.pos.x;
                pos.y = savedView.pos.y;
                API.update();
                return true;
            }
            return false;
        },		
        transition(amount){
            amount = amount < 0 ? 0 : amount > 1 ? 1 : amount;
            pos.x = (tweenEnd.pos.x - tweenStart.pos.x) * amount + tweenStart.pos.x;
            pos.y = (tweenEnd.pos.y - tweenStart.pos.y) * amount + tweenStart.pos.y;
            pos.scale = (tweenEnd.scale - tweenStart.scale) * amount + tweenStart.scale;
            pos.rotate = (tweenEnd.rotate - tweenStart.rotate) * amount + tweenStart.rotate;
        },
        createTransition(start, end){
            if(start){
                if(views[start] !== undefined){
                    Object.assign(tweenStart,views[start]);
                } else {
                    if (dirty) { API.update() }
                    tweenStart.pos.x = pos.x;
                    tweenStart.pos.y = pos.y;
                    tweenStart.scale = scale;
                    tweenStart.rotate = rotate;
                }
            }
            if(end){
                if(views[end] !== undefined){
                    Object.assign(tweenEnd,views[end]);
                } else {
                    if (dirty) { API.update() }
                    tweenEnd.pos.x = pos.x;
                    tweenEnd.pos.y = pos.y;
                    tweenEnd.scale = scale;
                    tweenEnd.rotate = rotate;
                }
            }
        },        
        wasConstrained(result = {}) {
            Object.assign(result, constrained);
            clearConstrained();           
            return result;
        },
        isConstrained() { return useConstraint },
        worldCorners(result = []) {
            if(ctx === undefined){
                throw new ReferenceError("World corners requiers a 2D context");
            }
            if (dirty) { API.update() }            
            result[0] = API.toWorld(0, 0, result[0]);
            result[1] = API.toWorld(ctx.canvas.width, 0, result[1]);
            result[2] = API.toWorld(ctx.canvas.width, ctx.canvas.height, result[2]);
            result[3] = API.toWorld(0, ctx.canvas.height, result[3]);
            return result;
        },        
        toWorld(x, y, point = {}) {
            if (dirty) { API.update() }
            const xx = x - m[4];
            const yy = y - m[5];
            point.x = xx * im[0] + yy * im[2];
            point.y = xx * im[1] + yy * im[3];
            return point;
        },
        toScreen(x, y, point = {}) {  
            if (dirty) { API.update() }
            point.x = x * m[0] + y * m[2] + m[4]; 
            point.y = x * m[1] + y * m[3] + m[5];
            return point;
        },
        centerOn(x, y){
            if (dirty) { API.update() }
            pos.x = ctx.canvas.width / 2  - (x * m[0] + y * m[2]);
            pos.y = ctx.canvas.height / 2 - (x * m[1] + y * m[3]);             
            dirty = true;	
        },
        rotateBy(angle) { rotate += angle; dirty = true },
        rotateAt(x, y, angle) {
            API.toWorld(x, y, wp1);
            rotate += angle;
            API.update();
            pos.x = x - wp1.x * m[0] - wp1.y * m[2];
            pos.y = y - wp1.x * m[1] - wp1.y * m[3];
            dirty = true;				
        },			
        movePos(x, y) { pos.x += x; pos.y += y; dirty = true },
        setPos(x, y) {  pos.x = x;pos.y = y; dirty = true },
        scaleTo(scaleType = "fit") {
            if ((scaleType = scaleType.toLowerCase()) === "fit") { 
                scale = constrainScale(
                    Math.min(
                        ctx.canvas.width / (bounds.right - bounds.left) , 
                        ctx.canvas.height / (bounds.bottom - bounds.top)
                 ));
            } else if (scaleType === "fill") { 
                scale = constrainScale(
                    Math.max(
                        ctx.canvas.width / (bounds.right - bounds.left) , 
                        ctx.canvas.height / (bounds.bottom - bounds.top)
                ));
            }
            else { scale = constrainScale(1) }			
            dirty = true;     
        },
        scaleAt(x, y, sc) {
            if (dirty) { API.update() }
            sc = constrainScale(scale * sc) / scale;
            scale *= sc;
            pos.x = x - (x - pos.x) * sc;
            pos.y = y - (y - pos.y) * sc;
            dirty = true;
        },
        setPinchStart(p1, p2) { // for pinch zoom rotate pan set start of pinch screen coords
            if (dirty) { API.update() }
            pinch1.x = p1.x;
            pinch1.y = p1.y;
            const x = (p2.x - pinch1.x);
            const y = (p2.y - pinch1.y);
            pinchDist = Math.sqrt(x * x + y * y);
            pinchStartAngle = Math.atan2(y, x);
            pinchScale = scale;
            pinchAngle = rotate;
            API.toWorld(pinch1, pinch1R);
        },
        movePinch(p1, p2, dontRotate){
            if (dirty) { API.update() }
            const x = (p2.x - p1.x);
            const y = (p2.y - p1.y);
            const pDist = Math.sqrt(x * x + y * y);
            scale = constrainScale(pinchScale * (pDist / pinchDist));       
            if(!dontRotate) { rotate = pinchAngle + (Math.atan2(y, x) - pinchStartAngle) }
            API.update();
            pos.x = p1.x - pinch1R.x * m[0] - pinch1R.y * m[2];
            pos.y = p1.y - pinch1R.x * m[1] - pinch1R.y * m[3];
            dirty = true;
        },
        noBounds () { useConstraint === true && (useConstraint = false, dirty = true) },
        useBounds () {
            if (ctx === undefined){ console.warn("Can not use bounds as there is no rendering context defined.") }
            else { useConstraint = true; dirty = true }
        },
        noConstraints () { API.noBounds() },
        useConstraints () { 
            if (ctx === undefined){ console.warn("Can not use constraints as there is no rendering context defined.") }
            else { useConstraint = true; dirty = true }
        },
        setBounds (top, left, right, bottom) {
            if(left === undefined){
                bounds.top = top.top;
                bounds.left = top.left;
                bounds.right = top.right;
                bounds.bottom = top.bottom;
            }else{
                bounds.top = top;
                bounds.left = left;
                bounds.right = right;
                bounds.bottom = bottom;
            }
        },
        maxScaleAuto() { maxScale = undefined },
        maxScaleAlowRotate() {
            if (useConstraint) {
                const diagonal = Math.hypot(bounds.right - bounds.left, bounds.bottom - bounds.top);
                maxScale = Math.min(ctx.canvas.width / diagonal, ctx.canvas.height / diagonal);
            }                
        },
        maxScaleAxisAligned() {
            if (useConstraint) {
                maxScale = Math.min(ctx.canvas.width / (bounds.right - bounds.left), ctx.canvas.height / (bounds.bottom - bounds.top));
            }                
        },
        fitImage(image, fitType = "fill"){  /* This function is not part of EZView */
            console.warn("fitImage is not part of EZView. Do not use.");
            if ((fitType = fitType.toLowerCase()) === "fit") { scale = Math.min(width / image.width, height / image.height) }
            else if (fitType === "fill") { scale = Math.max(width / image.width, height / image.height) }
            else { scale = 1 }				
            pos.x = width / 2;
            pos.y = height / 2;
            dirty = true;
        }			
    };
    if(settings.ctx) { API.context = settings.ctx }
    else if(settings.context) { API.context = settings.context }
    if(settings.bounds) { API.setBounds(settings.bounds) }
    if(settings.useConstraints) { API.useConstraints() }
    return API;
};