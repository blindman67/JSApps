"use strict";

groover.geom.Geom.prototype.addRender = function(ctx1){
    var mark, currentMarkName, markStyleStackTop, geom, ctx, size, workVec,a,b,c,lowercaseMarkNameWarning,markStyleStack;  // a,b,c are general registers for this scope
    lowercaseMarkNameWarning = false;
    geom = this;
    ctx = ctx1;
    size = 1;
    geom.Geom.prototype.size = size;    
    geom.Geom.prototype.ctx = ctx;    
    workVec = new geom.Vec();  // rather than create a new vec each time just use this one
    markStyleStack = []; 
	markStyleStackTop = 0;

    
    this.extensions.render = {   // add extensions 
        functions : ["lineTo","moveTo","draw","mark","label"],
        info : "Provides helper functions to render primitives to the canvas 2D context."
    };
    function getMarkNames(){  // set the list of names
        var names = Object.getOwnPropertyNames(geom.marks);
        geom.markNames = names.filter(function(name){
            if(typeof geom.marks[name] === "function"){
                if(name === "vecArray"){
                    if(geom.marks.vecArrayShape !== undefined){
                        return true;
                    }
                    return false;
                }
                return true;
            }
            return false;
        });
    }
    
    geom.Geom.prototype.setCtx = function(ctx1){
        this.ctx = ctx1;
        ctx = ctx1;        
    };
    geom.Geom.prototype.setSize = function(newSize){ // depreciated use setMarkSize
        throw new ReferenceError("Groover.Geom.setSize has been depreciated. Use Groover.Geom.setMarkSize.");
        /*size = newSize;
        this.size = 1;*/ // Commented code to be remove next review
    };
    geom.Geom.prototype.setMarkSize = function(newSize){
        size = newSize;
        this.size = 1;
    };    
    geom.Geom.prototype.marks = {
        cross : function (vec, _size = size){
            ctx.moveTo(vec.x - _size, vec.y);
            ctx.lineTo(vec.x + _size, vec.y);
            ctx.moveTo(vec.x, vec.y - _size);
            ctx.lineTo(vec.x, vec.y + _size);
        },
        crossdiag : function (vec, _size = size){
            ctx.moveTo(vec.x - _size, vec.y - _size);
            ctx.lineTo(vec.x + _size, vec.y + _size);
            ctx.moveTo(vec.x + _size, vec.y - _size);
            ctx.lineTo(vec.x - _size, vec.y + _size);
        },
        circle : function (vec, _size = size){
            ctx.moveTo(vec.x + _size, vec.y)
            ctx.arc(vec.x, vec.y, _size, 0, Math.PI*2);
            ctx.closePath();
        },
        square : function (vec, _size = size){
            ctx.moveTo(vec.x - _size / 2, vec.y - _size / 2);
            ctx.rect(vec.x - _size / 2, vec.y - _size / 2, _size, _size);
        },
        box :  function (vec, _size = size){
            ctx.moveTo(vec.x - _size / 2, vec.y - _size / 2);
            ctx.rect(vec.x - _size / 2, vec.y - _size / 2, _size, _size);
        },
        tri : function (vec, _size = size){
            ctx.moveTo(vec.x, vec.y - _size);
            ctx.lineTo(vec.x + _size, vec.y + _size);
            ctx.lineTo(vec.x - _size, vec.y + _size);
            ctx.closePath();
        },
        vecArrayShape : undefined,
        vecArray : function(vec){
            if(this.vecArrayShape !== undefined){
                this.vecArrayShape.each(function(vec1,i){
                    if(i === 0){
                        ctx.moveTo(vec.x + vec1.x, vec.y +vec1.y);
                    }else{
                        ctx.lineTo(vec.x + vec1.x, vec.y +vec1.y);
                    }
                })
                this.closePath();
            }
            
        }
    }
    geom.Geom.prototype.markNames = null; // list of avalible mark names
    geom.Geom.prototype.setMarkShape = function(vecArray){    // set the vecArray for custom mark shape
        geom.marks.vecArrayShape = vecArray;        
    }
    geom.Geom.prototype.setMark = function ( name , _size){ // set the named mark
        if(typeof geom.marks[name] === "function"){
            mark = geom.marks[name];
			currentMarkName = name;
        }else if(typeof geom.marks[name.toLowerCase()] === "function"){
            if(!lowercaseMarkNameWarning){
                lowercaseMarkNameWarning = true;
                console.warn("Groover.Geom.setMark. mark name '"+name+"' should be lower-case '"+(name.toLowerCase())+"' The incorrect case variant has been temporarily added.(This warn is only displayed once.)");
            }
            mark = geom.marks[name] = geom.marks[name.toLowerCase()];
			currentMarkName = name;
            getMarkNames();
        }
        if(_size !== undefined){
            size = _size;
            this.size = 1;
        }        
    }
    geom.Geom.prototype.pushMark = function ( name , _size){ // same as set mark but pushes current mark onto a stack
                                                             // use popMark to restore to the previous mark
		if(markStyleStack.length === markStyleStackTop){ 									 
			markStyleStack.push([mark,size,currentMarkName]);   
			markStyleStackTop ++;
		}else{
			markStyleStack[markStyleStackTop][0] = mark;
			markStyleStack[markStyleStackTop][2] = currentMarkName;   
			markStyleStack[markStyleStackTop++][1] = size;   
		}
        this.setMark(name,_size);
    }
    geom.Geom.prototype.popMark = function (){ // Restores previous pushed mark style
        if(markStyleStackTop > 0){
            markStyleStackTop --;
            mark = markStyleStack[markStyleStackTop][0];
            size = markStyleStack[markStyleStackTop][1];
            currentMarkName = markStyleStack[markStyleStackTop][2];
        }
    }
    
    geom.Geom.prototype.addNamedMark = function ( name, func ){ // adds a new mark shape
        if(typeof func === "function"){
            geom.marks[name] = func;
            getMarkNames();
        }
    }
    
    getMarkNames(); 
    mark = geom.marks.cross;  // set current mark shape
	currentMarkName = "cross";
    if(geom.Vec){
        geom.Vec.prototype.moveTo = function (){
            ctx.moveTo(this.x,this.y);   
            return this;// returns this
        };
        geom.Vec.prototype.lineTo = function (){
            ctx.lineTo(this.x,this.y);
            return this;// returns this
        };
        geom.Vec.prototype.mark = function (name = currentMarkName, _size = size){
			
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				mark(this, _size);
				geom.popMark();			
			}else{			
				mark(this, _size);
			}
            return this;// returns this
        };
        geom.Vec.prototype.draw = function (dir){ // The dir is a boolean that if true reveres the direction to the draw. Not applicable in this case
            mark(this);
            return this;// returns this
        };
        geom.Vec.prototype.label = function (text){
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }
            ctx.fillText(text, this.x, this.y);
            return this;
        }
    };
    if(geom.Line){
        geom.Line.prototype.moveTo = function () {
            this.p1.moveTo();
            return this;// returns this
        };
        geom.Line.prototype.lineTo = function () {
            this.p1.lineTo();
            return this;// returns this
        };
        geom.Line.prototype.draw = function (dir) { // dir draw direction
            if(dir){
                this.p2.lineTo();
                this.p1.lineTo();            
            }else{
                this.p1.lineTo();
                this.p2.lineTo();
            }
            return this;// returns this
        };
        geom.Line.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				this.p1.mark(name, _size);
				this.p2.mark(name, _size);
				geom.popMark();			
			}else{			
				this.p1.mark(name, _size);
				this.p2.mark(name, _size);
			}
            return this;// returns this
        };
        geom.Line.prototype.label = function (text,pos){
            if(pos === undefined){
                pos = 0.5;
            }
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }
            this.setTransformToLine(ctx);
            ctx.fillText(text, pos * this._leng, 0);
            return this;

        };
    }
    if(geom.Bezier){
        geom.Bezier.prototype.moveTo = function () {
            this.p1.moveTo();
            return this;// returns this
        };
        geom.Bezier.prototype.lineTo = function () {
            this.p1.lineTo();
            return this;// returns this
        };
        geom.Bezier.prototype.draw = function (dir) { // The {odir} is a boolean that if true reveres the direction to the draw
            if(dir){
                if(this.cp2 === undefined){
                    ctx.lineTo(this.p2.x, this.p2.y);
                    ctx.quadraticCurveTo(this.cp1.x, this.cp1.y, this.p1.x, this.p1.y);
                }else{
                    ctx.lineTo(this.p2.x, this.p2.y);
                    ctx.bezierCurveTo(this.cp2.x, this.cp2.y, this.cp1.x, this.cp1.y, this.p1.x, this.p1.y);                    
                }
            }else{
                if(this.cp2 === undefined){
                    ctx.lineTo(this.p1.x, this.p1.y);
                    ctx.quadraticCurveTo(this.cp1.x, this.cp1.y, this.p2.x, this.p2.y);
                }else{
                    ctx.lineTo(this.p1.x, this.p1.y);
                    ctx.bezierCurveTo(this.cp1.x, this.cp1.y, this.cp2.x, this.cp2.y, this.p2.x, this.p2.y);                    
                }
            }
            return this;// returns this
        };
        geom.Bezier.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				this.p1.mark(name, _size);
				this.p2.mark(name, _size);
				if(this.cp2 === undefined){
					this.cp1.mark(name, _size);                
				}else{
					this.cp1.mark(name, _size);
					this.cp2.mark(name, _size);
				}
				geom.popMark();			
			}else{			
				this.p1.mark(name, _size);
				this.p2.mark(name, _size);
				if(this.cp2 === undefined){
					this.cp1.mark(name, _size);                
				}else{
					this.cp1.mark(name, _size);
					this.cp2.mark(name, _size);
				}
			}
            return this;// returns this
        };
        geom.Bezier.prototype.label = function (text,pos){
            if(pos === undefined){
                pos = 0.5;
            }
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }
            ;
            return this;

        };
    }    
    if(geom.PrimitiveArray){
        var paLineTo = function(primitive){
            primitive.lineTo();
        }
        var paDraw = function(primitive){
            primitive.moveTo();
            primitive.draw();
        }
        var paDrawJoined = function(primitive){
            primitive.draw();
        }
        var paMark = function(primitive){
            primitive.mark();
        }
        geom.PrimitiveArray.prototype.moveTo = function(){
            if(this.primitives.length > 0){
                this.primitives[0].moveTo();
            }
            return this;// returns this
        };
        geom.PrimitiveArray.prototype.lineTo = function(){
            this.each(paLineTo);
            return this;// returns this
        };
        geom.PrimitiveArray.prototype.draw = function(join){  // The {odir} is a boolean that if true reveres the direction to the draw
            
            if(join){
                this.each(paDrawJoined);
            }else{
                this.each(paDraw);
            }
            return this; // returns this
        };
        geom.PrimitiveArray.prototype.mark = function(name, _size){
            this.each(paMark);
            return this;// returns this
        };
        geom.PrimitiveArray.prototype.label = function (text){
            if(text === null || text === undefined){
                this.each(function(primitive){
                    primitive.label(null);
                });            
            }else
            if(text === "#"){
                this.each(function(primitive,i){
                    primitive.label(i);
                });            
            }else
            if(typeof text === "string"){
                this.each(function(primitive,i){
                    primitive.label(text);
                });
            }else{
                this.each(function(primitive,i){
                    primitive.label(text[i]);
                });
            }
            return this;
        };        
    }
    if(geom.VecArray){
        geom.VecArray.prototype.moveTo = function(position){ // position is the index of the vec 
                                                             // unless it is undefined, negative, or greater than vecArray.length
                                                             // if undefined then the first vec if any is used.
                                                             // if negative then the index starts from the end vecArray.length - position. 
                                                             //    if the negative offset indexs a point less than 0 then 0 is used
                                                             // if position is greater than length-1 then length is used;
            if(position === undefined){                    
                if(this.vecs.length > 0){
                    this.vecs[0].moveTo();
                }
            }else
            if((a = this.vecs.length) > 0){
                if(position < 0){
                    position = Math.max(0,a + position);
                }else{
                    position = Math.min(a-1,position);
                }
                this.vecs[position].moveTo();
            }
            return this;// returns this
        };
        geom.VecArray.prototype.lineTo = function(position){ // position is the index of the vec 
                                                             // unless it is undefined, negative, or greater than vecArray.length
                                                             // if undefined then the first vec if any is used.
                                                             // if negative then the index starts from the end vecArray.length - position. 
                                                             //    if the negative offset indexs a point less than 0 then 0 is used
                                                             // if position is greater than length-1 then length is used;
            if(position === undefined){                    
                if(this.vecs.length > 0){
                    this.vecs[0].lineTo();
                }
            }else
            if((a = this.vecs.length) > 0){
                if(position < 0){
                    position = Math.max(0,a + position);
                }else{
                    position = Math.min(a-1,position);
                }
                this.vecs[position].lineTo();
            }
            return this;// returns this
        };
        geom.VecArray.prototype.draw = function(){  // The {odir} is a boolean that if true reveres the direction to the draw
            this.each(function(vec){
                vec.lineTo();
            });
            return this; // returns this
        };
        geom.VecArray.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				this.each(vec => { vec.mark(name, _size) });
				geom.popMark();			
			}else{			
				this.each(vec => { vec.mark(name, _size) });
			}

            return this;// returns this
        };
        geom.VecArray.prototype.label = function (text){
            if(text === null || text === undefined){
                this.each(function(vec,i){
                    vec.label(null);
                });            
            }else
            if(text === "#"){
                this.each(function(vec,i){
                    vec.label(i);
                });            
            }else
            if(typeof text === "string"){
                this.each(function(vec,i){
                    vec.label(text);
                });
            }else{
                this.each(function(vec,i){
                    vec.label(text[i]);
                });
            }
            return this;
        };
    }
    if(geom.Circle){
        geom.Circle.prototype.moveTo = function(){
            ctx.moveTo(this.center.x + this.radius, this.center.y);
            return this;// returns this
        }
        geom.Circle.prototype.lineTo = function(){
            ctx.lineTo(this.center.x + this.radius, this.center.y);
            return this;// returns this
        }
        geom.Circle.prototype.draw = function(dir){  // The {odir} is a boolean that if true reveres the direction to the draw
            if(this.radius < 0){
                ctx.arc(this.center.x, this.center.y, -this.radius,0, Math.PI * 2, !dir);
            }else{
                ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, dir);
            }
            return this;// returns this
        }
        geom.Circle.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				this.center.mark(name, _size);
				geom.popMark();			
			}else{			
				this.center.mark(name, _size);
			}
            return this;// returns this
        }
        geom.Circle.prototype.label = function (text){
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }
            ctx.fillText(text, this.center.x, this.center.y);
            return this;
        };    
    }
    if(geom.Arc){
        geom.Arc.prototype.moveTo = function(end){ // if end (optional) is true then move to the end else move to the start
            if(this.start !== this.end){
                if(end === true){
                    this.endAsVec().moveTo();
                }else{
                   this.startAsVec().moveTo();
                }
            }
            return this;// returns this
        };
        geom.Arc.prototype.lineTo = function(end){ // if end (optional) is true then line to the end else line to the start
            if(this.start !== this.end){
                if(end === true){
                    this.endAsVec().lineTo();
                }else{
                    this.startAsVec().lineTo();
                }
            }
            return this;// returns this
        };
        geom.Arc.prototype.draw = function(dir){// The {odir} is a boolean that if true reveres the direction to the draw
            if(this.start !== this.end){
                if(this.circle.radius >= 0){
                    if(dir === undefined){
                        ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.start, this.end, this.direction);
                    }else{
                        ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.start, this.end, dir);
                    }
                }else{
                    // ignoring negative radius
                }
            }
            return this;// returns this
        };
        geom.Arc.prototype.mark = function(name = currentMarkName, _size = size){
			if(this.start !== this.end){
				if(name !== currentMarkName){
					geom.pushMark( name , _size);
					this.endsAsVec().mark(name, _size);
					geom.popMark();			
				}else{			
					this.endsAsVec().mark(name, _size);
				}
            }
            return this;// returns this
        };
        geom.Arc.prototype.label = function (text){
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }
            var len = this.cordAsLine().setTransformToLine().leng();
            ctx.fillText(text, len / 2, 0);
            return this;

        };       
    }
    if(geom.Rectangle){    
        geom.Rectangle.prototype.moveTo = function(){
            this.top.p1.moveTo();
            return this;// returns this
        };
        geom.Rectangle.prototype.lineTo = function(){
            this.top.p1.lineTo();
            return this;// returns this
        };
        geom.Rectangle.prototype.draw = function(dir){// The {odir} is a boolean that if true reveres the direction to the draw
            this.corners().draw(dir);
            ctx.closePath();
            return this;// returns this
        };
        geom.Rectangle.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				this.corners().mark(name, _size);
				geom.popMark();			
			}else{			
				this.corners().mark(name, _size);
			}
            return this;// returns this
        };
        geom.Rectangle.prototype.label = function (text){
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }
            var len = this.top.setTransformToLine(ctx).leng()/2;
            ctx.fillText(text, len , len * this.aspect);
            return this;
        };    
        geom.Rectangle.prototype.getCTX = function (){
            return ctx;
        };
    }
    if(geom.Triangle){
        geom.Triangle.prototype.moveTo = function(){
            this.p1.moveTo();
            return this;// returns this
        };
        
        geom.Triangle.prototype.lineTo = function(){
            this.p1.lineTo();
            return this;// returns this
        };
        
        geom.Triangle.prototype.draw = function(dir){// The {odir} is a boolean that if true reveres the direction to the draw
            ctx.lineTo(this.p1.x,this.p1.y);
            ctx.lineTo(this.p2.x,this.p2.y);
            ctx.lineTo(this.p3.x,this.p3.y);
            ctx.lineTo(this.p1.x,this.p1.y);
            return this;// returns this
        };
        
        geom.Triangle.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				this.p1.mark(name, _size);
				this.p2.mark(name, _size);
				this.p3.mark(name, _size);
				geom.popMark();			
			}else{			
				this.p1.mark(name, _size);
				this.p2.mark(name, _size);
				this.p3.mark(name, _size);
			}
            return this;// returns this
        };
        
        geom.Triangle.prototype.label = function (text){
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }        
            this.center(workVec).label(text);
            return this;
        };    
    }
    if(geom.Box){
        geom.Box.prototype.moveTo = function(){
            ctx.moveTo(this.left, this.top);
            return this;// returns this
        };
        geom.Box.prototype.lineTo = function(){
            ctx.lineTo(this.left, this.top);
            return this;// returns this
        };
        geom.Box.prototype.draw = function(expand){ // The {odir} is a boolean that if true reveres the direction to the draw
            if(expand !== undefined){
                ctx.rect(this.left - expand, this.top -  expand, this.right - this.left + expand * 2, this.bottom - this.top + expand * 2);
            }else{
                ctx.rect(this.left , this.top, this.right - this.left, this.bottom - this.top);
            }
            return this;// returns this
        };
        geom.Box.prototype.mark = function(name = currentMarkName, _size = size){
			if(name !== currentMarkName){
				geom.pushMark( name , _size);
				workVec.x = this.left;
				workVec.y = this.top;
				workVect.mark(name, _size);
				workVec.x = this.right;
				workVect.mark(name, _size);
				workVec.y = this.bottom;
				workVect.mark(name, _size);
				workVec.x = this.left;
				workVect.mark(name, _size);
				geom.popMark();			
			}else{			
				workVec.x = this.left;
				workVec.y = this.top;
				workVect.mark(name, _size);
				workVec.x = this.right;
				workVect.mark(name, _size);
				workVec.y = this.bottom;
				workVect.mark(name, _size);
				workVec.x = this.left;
				workVect.mark(name, _size);
			}

            return this;// returns this
        };    
        geom.Box.prototype.label = function (text){
            if(text === null || text === undefined){
                text = this.labelStr;            
                if(text === null || text === undefined){
                    text = this.type;
                }
            }        
            ctx.fillText(text, (this.left + this.right) / 2, (this.top + this.bottom) / 2);
            return this;

        };    
    }   
    if(geom.Empty){
        geom.Empty.prototype.moveTo = function(){
            return this;// returns this
        };
        geom.Empty.prototype.lineTo = function(){
            return this;// returns this
        };
        geom.Empty.prototype.draw = function(){
            return this;// returns this
        };
        geom.Empty.prototype.mark = function(){
            return this;// returns this
        };
        geom.Empty.prototype.label = function(){
            return this;// returns this
        };
    }
    console.log("Groover.Geom render extension installed.");
    
}
console.log("Groover.Geom Render extension parsed.");
