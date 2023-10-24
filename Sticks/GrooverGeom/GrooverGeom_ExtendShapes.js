"use strict";

groover.geom.Geom.prototype.addShapes = function(){
    if(this.Shape !== undefined){
        console.log("Call to groover.geom.Geom.prototype.addShapes() failed. Groover.Geom.Shape extension already exists");        
        return;
    }
    var geom = this;
    this.extensions.shapes = {   // add extensions for self documenter
        functions : [],
        info : "Provides helper functions to create complex shapes."
    };
    this.objectNames.push("Shape");
    this.Shape = function(){
        this.items = [];
    }
    this.Shape.prototype = {
        items : [],
        type : "shape",
        polygon : function(){
            var vecA ;
            var __convex = undefined;
            var lines = this.lines = [];
            this.name = "poly";
            this.type = "polygon";
            this.count = 0;
            this.dirty = true;
            this.items.push(vecA = new geom.VecArray())
            this.verts = vecA;
            var triA = [];
            this.triangles = triA;
            this.vecOfInterest;
            this.bounds = new geom.Box().irrate();
            this.caculate = function(){
                if(this.dirty){
                    this.dirty = false;
                    triA.length = 0;
                    lines.length = 0;
                    if(this.count > 1){
                        for(var i = 0; i < this.count; i++){
                            lines.push(new geom.Line(vecA.vecs[i],vecA.vecs[(i + 1)% this.count]));
                        }
                    }
                    __convex = undefined;
                    this.bounds = this.asBox();
                }
                return this;
            };
            this.setVert = function(index,vec){
                if(index >= 0 && index < vecA.getCount()){
                    vecA.vecs[index].setAs(vec);
                }
            };
            this.addVert = function(vert,force){ 
                // add {avert} as Vec to the end of the array of verts. 
                // Will ignore vects that are the same as the first point or the same as the last point. 
                // The property polygon.dirty will be true if the vert has been added or its state will not change of the vert has not been added. if the {oforce} is true the vert will always be added. This could result in a polygon that may not be able to complete some of its functions
                this.count = vecA.vecs.length;
                var mIndex = vecA.indexOf(vert);
                if(!(force === true)){
                    if((this.count > 0 && mIndex === this.count-1) || (mIndex === 0 && this.count > 1)){
                        return this;
                    }
                }
                this.dirty = true;
                vecA.push(vert);
                this.count += 1;
                return this;
            };
            this.copy = function(){
                var shape = new geom.Shape();
                shape.polygon();
                this.items[0].each(function(vec){
                    shape.addVert(vec.copy());
                });
                return shape;
            }
            this.slice = function(line){
                this.caculate();
                if(lines.length > 0){
                    vecA.clear();
                    var on = true;
                    for(var i = 0; i < lines.length; i ++){
                        var l1 = this.items[i].copy();
                        var v1 = l1.interceptSeg(line);
                        if(v1.isEmpty()){
                            if(on){
                                this.addVert(l1.p1);
                            }
                        }else{
                            if(on){
                                on = false;
                                this.addVert(l1.p1);
                                this.addVert(v1);
                            }else{
                                on = true;
                                this.addVert(v1);
                            }
                        }
                    }
                }
                return this;
            }
            this.chamfer = function(amount){
                this.caculate();
                if(this.items.length > 1){
                    vecA.clear();
                    for(var i = 1; i < this.items.length; i ++){
                        var l1 = this.items[i].copy();
                        if(i + 1 >= this.items.length){
                            var l2 = this.items[1].copy();
                        }else{
                            var l2 = this.items[i + 1].copy()
                        }
                        this.addVert(l1.p2.copy().sub(l1.asVec().setLeng(amount)));
                        this.addVert(l2.p1.copy().add(l2.asVec().setLeng(amount)));
                    }
                }
                return this;
            }
            this.inflate = function(amount){
                this.caculate();
                if(lines.length > 0){
                    var va = vecA.copy();
                    for(var i = 1; i < this.items.length; i ++){
                        var l1 = this.items[i].copy();
                        if(i + 1 >= this.items.length){
                            var l2 = this.items[1].copy();
                        }else{
                            var l2 = this.items[i + 1].copy()
                        }
                        l1.add(l1.asVec().norm().rN90().mult(amount));
                        l2.add(l2.asVec().norm().rN90().mult(amount));
                        va.vecs[i%va.vecs.length].setAs(l1.intercept(l2));
                    }
                    vecA.setAs(va);
                }
                return this;
            }
            this.getMinLeng = function(){
                this.caculate();
                if(lines.length === 0){
                    return 0;
                }
                var minLen = Infinity;
                for(var i = 1; i < this.items.length; i ++){
                    minLen = Math.min(this.items[i].leng(),minLen);
                }
                return minLen;
            };
            this.getMaxLeng = function(){
                this.caculate();
                if(lines.length === 0){
                    return 0;
                }
                var maxLen = -Infinity;
                for(var i = 1; i < this.items.length; i ++){
                    maxLen = Math.max(this.items[i].leng(),maxLen);
                }
                return maxLen;
            };
            this.validate = function(){
                if(this.dirty){
                    this.caculate();
                }
                if(!this.isClockwise()){
                    vecA.reverse();
                    this.dirty = true;
                    this.caculate();
                }
                if(__convex === undefined){
                    this.isConvex();
                }
                if(__convex === false){
                    this.triangulate();
                }
                return this;
            },
            this.isConvex = function(){
                this.caculate();
                var l1,l2,firstDirection,len;
                len = lines.length;
                if(len > 0){
                    l1 = lines[0].asVec();
                    for(var i = 1; i < len+1; i ++){

                        l2 = lines[i % len].asVec();
                        if(firstDirection === undefined){
                            firstDirection = l1.cross(l2);
                        }else
                        if((l1.cross(l2) >= 0 && firstDirection < 0) || (l1.cross(l2) < 0 && firstDirection >= 0)){
                            __convex = false;
                            return false;
                        }
                        l1 = l2;
                    }
                    __convex = true;
                    return true;
                }
                __convex = undefined;
                return undefined;
            };
            this.isClockwise = function(){ // returns true if the polygon is clockwise
                this.caculate();
                if(vecA.sumCross() < 0){
                    return false;
                }
                return true; // return false if polygon is anti clockwise
            };
            this.isSelfIntersecting = function(){ // returns true is any lines are crossing 
                this.caculate();
                if(lines.length > 0){
                    var len = lines.length;
                    for(var i = 0; i < len; i ++){
                        var l1 = lines[i];
                        for(var  j = i + 2; j < len; j ++){
                            var l2 = lines[j];
                            var v1 = l1.interceptSegs(l2);
                            if(!v1.isEmpty()){
                                this.vecOfInterest = v1;
                                return true;
                            }
                        }
                    }
                }
                return false; // returns false is no lines are crossing           
            };
            this.setAs = function(polygon){
                var me = this;
                polygon.verts.each(function(vec,i){
                    if(i >= vecA.vecs.length){
                        me.addVert(vec)
                    }else{
                        vecA.vecs[i].setAs(vec);
                    }
                })
                vecA.vecs.length = polygon.verts.vecs.length;
                return this;
            };
            this.isEmpty = function(){
                if(vecA.length === 0){
                    return true;
                }
                return false;
            };
            this.eachLine = function(callback,backward,start){
                var i;
                var len = lines.length;
                var s = start === null || start === undefined ? 0 : start;
                if(backward === true){
                    s = len-start;
                    for(i = s;i >= 1; i-- ){
                        if(callback(lines[i],i) === false){
                            break;
                        }
                    }
                }else{
                    for(var i = s; i < len; i ++){
                        if(callback(lines[i],i) === false){
                            break;
                        }
                    }
                }
                return this;
            },
            this.triangulate = function(){
                var left,right,start,len,me,vec1,vec2,vec3,line,triangle,ntri,found,clipping,verts;
                len = vecA.vecs.length;
                if(len < 3){
                    return this;
                }
                triA.length = 0;
                me = this;
                vec1 = new geom.Vec();
                vec2 = vec1.copy();
                vec3 = vec1.copy();
                line = new geom.Line();
                line.p1 = vec2;
                line.p2 = vec3;
                triangle = new geom.Triangle();
                triangle.p1 = vec1;
                triangle.p2 = vec2;
                triangle.p3 = vec3;
                function B(index){return (index + (len -1))%len;} // back one 
                function F(index){return (index + 1)%len;} // forward one 
                function doesLineCross(line){  // checks if a line crosses an edge
                    var crossing = false;
                    me.eachLine(function(l){
                        if(line.isLineSegIntercepting(l)){
                            crossing = true;
                            return true;
                        }
                    });
                    return crossing;
                }                
                right = left = start = 0;
                clipping = true;
                verts = vecA.copy();
                verts.each(function(v,i){ v.id = i;}) // include the vert Id 
                var count = 0
                while(clipping && count < 200){
                    count += 1;
                    var found = false;
                    right = F(start);
                    left = B(start);
                    if(left !== right){
                        vec1.setAs(verts.vecs[start]);
                        vec2.setAs(verts.vecs[right]);
                        vec3.setAs(verts.vecs[left]);
                        if(triangle.isClockwise()){  // is right way around
                            if(!doesLineCross(line)){ // does it cross any edges???
                                triA.push(ntri = triangle.copy())  // safe to clip this tri 
                                ntri.p1.id = verts.vecs[start].id;  // keep IDs
                                ntri.p2.id = verts.vecs[right].id;
                                ntri.p3.id = verts.vecs[left].id;
                                verts.remove(start);
                                len = verts.getCount();
                                start = F(start);
                                found = true;
                            }
                        }
                    }
                    if(len < 3){  // no points left so exit
                        clipping = false;
                    }else
                    if(!found && len > 3){ // no valide poly found so try another 
                        start = F(start);
                    }
                }
                return this;

                
            };
            this.isVecInside = function(vec){
                this.caculate();
                if(this.bounds.isVecInside(vec)){                
                    if(__convex === undefined){
                        this.validate();
                    }
                    if(__convex === true){
                        var len = lines.length;
                        for(var i = 0; i < len; i ++){
                            if(!lines[i].isVecLeft(vec)){
                                return false;
                            };
                        }
                        return true;
                    }else
                    if(__convex === false){
                        var len = triA.length;
                        for(var i = 0; i < len; i ++){
                            if(triA[i].isVecInside(vec)){
                                return true;
                            }
                        }
                        return false;
                    }
                }
                return false;
                
            };
            this.isLineInside = function(line){
                this.caculate();
                if(this.bounds.isVecInside(line.p1)  && this.bounds.isVecInside(line.p2)){                
                    if(__convex === undefined){
                        this.validate();
                    }
                    if(__convex === true){                
                        var len = lines.length;
                        for(var i = 0; i < len; i ++){
                            if(!this.items[i].isLineLeft(line)){
                                return false;
                            }
                        }
                        return true;
                    }else
                    if(__convex === false){   
                        // for concave poly check if endpoints are inside a triangle
                        // If they are check that the line does not cross an edge.
                        // inside if both ends are on a triangle and the line does not cross an eadge.
                        var inside = false;
                        var len = triA.length;
                        var vec = line.p1;
                        for(var i = 0; i < len; i ++){
                            if(triA[i].isVecInside(vec)){
                                inside = true;
                                break;
                            }
                        }
                        if(!inside){
                            return false;
                        }
                        inside = false;
                        vec = line.p2;
                        for(var i = 0; i < len; i ++){
                            if(triA[i].isVecInside(vec)){
                                inside = true;
                                break;
                            }
                        }
                        if(!inside){
                            return false;
                        }
                        inside = true;
                        this.eachLine(function(l){
                            var inter = line.interceptSegs(l);
                            if(!inter.isEmpty()){
                                inside = false;
                                return false; // break from the itterator
                            }
                        });
                        return inside;
                        
                        
                    }
                }
                return false;
                
            };
            this.isPolygonInside = function(poly){
                poly.validate();
                if(this.dirty){
                    this.caculate();
                }
                if(!this.bounds.isBoxInside(poly.bounds)){
                    return false;
                }
                var me = this;
                var inside = true;
                if(__convex === undefined){
                    this.validate();
                }
                if(__convex === true){                
                    poly.verts.each(function(vec){
                        if(!me.isVecInside(vec)){
                            inside = false;
                            return false;
                        }
                    })
                    return inside;
                }else
                if(__convex === false){
                    poly.eachLine(function(line){
                        if(!me.isLineInside(line)){
                            inside = false;
                            return false;
                        }
                    });
                    return inside;
                }
                return false;
            }
            this.makeDirty = function(){
                this.dirty = true;
                return this;
            };
            this.asBox = function(box){
                this.caculate();
                return vecA.asBox(box);
            };
            // add drawing functions
            if(vecA.mark !== undefined){
                this.lineTo = function(){
                    this.caculate();
                    if(lines.length > 1){
                        lines[0].p1.lineTo();
                    }
                    return this;// returns this;
                }
                this.moveTo = function(){
                    this.caculate();
                    if(lines.length > 1){
                        lines[0].p1.moveTo();
                    }
                    return this;// returns this;
                }
                this.draw = function(dir){
                    this.caculate();
                    var len = lines.length;
                    if(len > 0){
                        lines[0].p1.lineTo();
                        for(var i = 1; i < len; i ++){
                            lines[i].p1.lineTo();
                        }
                        lines[0].p1.lineTo();
                    }
                    return this;// returns this;
                }
                this.mark = function(){
                    this.caculate();
                    var len = lines.length;
                    if(len > 0){
                        lines[0].p1.mark();
                        for(var i = 1; i < len; i ++){
                            lines[i].p1.mark();
                        }
                    }
                    return this;// returns this;
                }
                this.label = function(text){
                    this.center().label(text);
                    return this;
                }
            }  
            this.center = function(){
                return vecA.mean();
                
            },
            this.area = function(){
                this.caculate();
                if(lines.length > 1){
                    return vecA.area();
                }
                return 0;
                
            }
            this.perimiter = function(){ // Returns the length of the perimiter of this shape
                this.caculate();
                if(lines.length > 1){
                    return vecA.perimiter();
                }
                return 0;
            }       
            return this;
        },
        roundedPill : function (vec1, vec2, number1, number2) { 
            // Creates a rounded pill shape with {avec}1 and {avec}2 being the center of each end and {anumber1} and {anumber2} are the radius at each end{avec}1
            var c1,c2,a1,a2, l1,l2,mainC;
            this.isCircle = false;
            this.items.push(c1 = new geom.Circle(vec1,number1));
            this.items.push(c2 = new geom.Circle(vec2,number2));
            this.items.push(l1 = new geom.Line());
            this.items.push(l2 = new geom.Line());
            this.items.push(a1 = new geom.Arc(c1,0,0));
            this.items.push(a2 = new geom.Arc(c2,0,0));
            this.calculate = function(){
                var l = new geom.Line(c1.center,c2.center);
                var dir = l.dir();
                var dist = l.leng();
                if(dist < Math.max(c1.radius,c2.radius) - Math.min(c1.radius,c2.radius)){
                    this.isCircle = true;
                    if(c1.radius > c2.radius){
                        mainC = c1;
                    }else{
                        mainC = c2;
                    }
                }else{
                    this.isCircle = false;
                    if(c2.radius === c1.radius){
                        a1.start = dir + Math.PI * (1 / 2);
                        a1.end = dir + Math.PI * (3 / 2);
                        a2.start = dir - Math.PI * (1 / 2);
                        a2.end = dir + Math.PI * (1 / 2);
                    }else{
                        //var d = l.leng(); //c2.center.copy().sub(c1.center).leng(); 
                       // var dir = c2.center.copy().sub(c1.center).dir(); 
                        var rr = c1.radius - c2.radius;
                        var d = Math.sqrt(dist * dist - rr * rr)
                        var s = rr / d;
                        var c =  c1.radius/s;//(d * rr)/c1.radius;
                        var e = Math.hypot(c,c1.radius);
                        var ang = Math.asin(c/e);
                        a1.start = dir + ang;
                        a1.end = dir + (Math.PI*2) - ang;
                        a2.end = dir + ang;
                        a2.start = dir - ang;
                        a2.normalise();
                        a1.normalise();
                    }
                    var end1 = a1.endsAsVec();
                    var end2 = a2.endsAsVec();
    
                    l1.p1 = end1.vecs[1];
                    l1.p2 = end2.vecs[0];
                    l2.p2 = end1.vecs[0];
                    l2.p1 = end2.vecs[1];
                }
                return this; // returns this;

            }                
            if(geom.extensions.render){
                this.lineTo = function(){
                    if(this.isCircle){
                        mainC.lineTo();
                    }else{
                        l1.lineTo();
                    }
                    return this;// returns this;
                }
                this.moveTo = function(){
                    if(this.isCircle){
                        mainC.moveTo();
                    }else{
                        l1.moveTo();
                    }
                    return this;// returns this;
                }
                this.draw = function(dir){
                    if(this.isCircle){
                        mainC.draw(dir);
                    }else{
                        if(dir){
                            a2.draw(true);
                            l2.draw(true);
                            a1.draw(true);
                            l1.draw(true);                        
                        }else{
                            l1.draw();
                            a2.draw();
                            l2.draw();
                            a1.draw();
                        }
                    }
                    return this;// returns this;
                }
                this.mark = function(){
                    if(this.isCircle){
                        mainC.mark();
                    }else{
                        l1.mark();
                        a2.mark();
                        l2.mark();
                        a1.mark();
                    }
                    return this;// returns this;
                }
            }
            this.area = function(){ // Returns the area of this shape
                this.calculate();
                if(this.isCircle){
                    return mainC.area();
                }
                var a = a2.areaOfSegment() + a1.areaOfSegment();
                var va = new geom.VecArray();
                va.push(l1.p1);
                va.push(l2.p2);
                va.push(l2.p1);
                va.push(l1.p2);
                a += va.area();
                return a; // returns a Number
            }
            this.perimiter = function(){ // Returns the length of the perimiter of this shape
                this.calculate();          // returns a number
                if(this.isCircle){
                    return mainC.circumference();
                }
                return a2.arcLength() + a1.arcLength() + l1.leng() + l2.leng();
            }           
            this.asBox = function(box){
                this.calculate();
                if(this.isCircle){
                    return mainC.asBox(box);
                }
                box = a1.asBox(box);
                return l2.asBox(l1.asBox(a2.asBox(box)));
            }
            this.calculate();
            return this;
        },
        flexyCrescent : function(vecArray,variant){
            var a1Left,a2Left;
            const TWO_ARCS = 0;
            const THREE_ARCS = 1;
            if(variant === "3arc"){
                this.variant = THREE_ARCS;
            }else{
                this.variant = TWO_ARCS;
            }
                
            this.dirty = true;
            if(geom.isPrimitive(vecArray)){
                if(vecArray.type === "VecArray"){
                    vecArray = vecArray.asVecArray();
                    this.items.push(vecArray.first());
                    this.items.push(vecArray.next());
                    this.items.push(vecArray.next());
                    this.items.push(vecArray.next());
                }
            }else
            if(Array.isArray(vecArray)){
                this.items.push(vecArray[0]);
                this.items.push(vecArray[1]);
                this.items.push(vecArray[2]);
                this.items.push(vecArray[3]);
            }
                
            this.items.push(this.arc1 = new geom.Arc(new geom.Circle(new geom.Vec(0,0)),0,0,false));            
            this.items.push(this.arc2 = new geom.Arc(new geom.Circle(new geom.Vec(0,0)),0,0,false));
            this.items.push(this.arc3 = new geom.Arc(new geom.Circle(new geom.Vec(0,0)),0,0,false));
            this.items.push(this.centerLine = new geom.Line(this.items[0],this.items[2]));
            this.makeDirty = function(){
                this.dirty = true;
                return this;
            };            
            this.calculate = function(){
                if(this.dirty){
                    this.arc1.fromVec3(this.items[0],this.items[1],this.items[2]);
                    this.arc2.fromVec3(this.items[2],this.items[3],this.items[0]);
                    if(this.variant === THREE_ARCS){
                        this.arc1.endFromVec(this.items[1]);
                        this.arc2.startFromVec(this.items[3]);
                        this.arc3.fromVec3(this.items[1],this.items[2],this.items[3]);
                    }
                    a1Left = this.centerLine.isVecLeft(this.items[1]);
                    a2Left = this.centerLine.isVecLeft(this.items[3]);
                    if(a1Left === a2Left){
                        if(a1Left){
                            this.arc2.swap().direction = true;
                        }else{
                            this.arc1.swap().direction = true;
                        }
                    }else{
                        if(!a1Left){
                            this.arc2.swap().direction = true;
                            this.arc1.swap().direction = true;
                            
                        }else{
                            this.arc2.direction = false;
                            this.arc1.direction = false;
                        }
                    }
                }
                this.dirty = false;
            }
            if(geom.extensions.render){
                this.mark = function(){
                    var it,i,len;
                    this.calculate();
                    it = this.items;
                    for(i = 0; i < 6; i ++){
                        it[i].mark();
                    }    
                    return this;
                    
                }
                this.moveTo = function(){
                    this.calculate();
                    if(this.items.length > 0){
                        this.items[0].moveTo();
                    }                    
                    return this;
                }
                this.lineTo = function(){
                    this.calculate();                    
                    if(this.items.length > 0){
                        this.items[0].lineTo();
                    }                    
                    return this;
                }
                this.draw = function(){
                    var it,i,len;
                    this.calculate();
                    if(this.variant === THREE_ARCS){
                        this.arc1.draw();
                        this.arc3.draw();
                        this.arc2.draw();
                    }else{
                        this.arc1.draw();
                        this.arc2.draw();
                    }

                    
                    return this;
                }
                this.label = function(text){
                    return this;
                }
            }
            this.calculate();
            return this;             
            
        },
        roundedPath : function(vecArray,radius,closed){
            var lastVecCount;
            this.vecArray = vecArray;
            this.dirty = true;
            this.closed = closed;
            this.radius = radius;
            lastVecCount = vecArray.vecs.length;
            this.setArray = function(vecArray){
                this.vecArray = vecArray()
                lastVecCount = vecArray.vecs.length;
                this.dirty = true;
                return this;
            };
            this.closePath = function(state){
                if(state !== this.closed){
                    this.dirty = true;
                    closed = this.closed = state;
                }
                return this;
            };
            this.setRadius = function(rad){
                if(rad !== this.radius){
                    this.dirty = true;
                    radius = this.radius = rad;
                }
                return this;
            };
            this.makeDirty = function(){
                this.dirty = true;
                return this;
            };            
            this.calculate = function(){
                if(this.dirty || lastVecCount !== this.vecArray.vecs.length){
                    var lastV;
                    this.items.length = 0;
                    var arc,line1,line2,items,va,i,len;
                    va = this.vecArray;
                    items = this.items;
                    if(va.vecs.length > 2){
                        va.each(function(v){
                            if(lastV !== undefined){
                                items.push(new geom.Line(lastV.copy(),v.copy()));
                                items.push(new geom.Arc(new geom.Circle(v.copy(), radius),0,0));
                            }
                            lastV = v;
                        });
                        if(closed){
                            items.push(new geom.Line(lastV.copy(),vecArray.vecs[0].copy()));
                            items.push(new geom.Arc(new geom.Circle(vecArray.vecs[0].copy(), radius),0,0));
                        }else{
                            items.pop();  // if open then dont need the last arc
                        }
                        len = items.length;
                        for(i = 0; i < len; i +=2){
                            line1 = items[i];
                            line2 = items[(i+2)%len];
                            arc = items[i + 1];
                            arc.fitCorner(line1,line2);
                        }
                        for(i = 0; i < len; i += 2){
                            line1 = items[i];
                            line2 = items[(i+2)%len];
                            arc = items[i + 1];
                            arc.startAsVec(line1.p2);
                            arc.endAsVec(line2.p1);
                        }
                    }
                    this.dirty = false;
                    lastVecCount = vecArray.vecs.length;                    
                }
                return this;                
            }
            if(geom.extensions.render){
                this.mark = function(){
                    var it,i,len;
                    this.calculate();
                    it = this.items;
                    len = this.items.length;
                    for(i = 0; i < len; i ++){
                        it[i].mark();
                    }    
                    return this;
                    
                }
                this.moveTo = function(){
                    this.calculate();
                    if(this.items.length > 0){
                        this.items[0].moveTo();
                    }                    
                    return this;
                }
                this.lineTo = function(){
                    this.calculate();                    
                    if(this.items.length > 0){
                        this.items[0].lineTo();
                    }                    
                    return this;
                }
                this.draw = function(){
                    var it,i,len;
                    this.calculate();
                    it = this.items;
                    len = this.items.length;
                    for(i = 0; i < len; i ++){
                        it[i].draw();
                    }
                    return this;
                }
                this.label = function(text){
                    return this;
                }
            }
            this.calculate();
            return this; 
        }        
    }
    
    
    
    console.log("Groover.Geom.Shapes installed.");
    
}
console.log("Groover.Geom shapes extension parsed.");

