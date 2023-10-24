"use strict";
groover.geom.Geom.prototype.addUI = function(element1){
    var geom, element, mouse, points, selected, unselected, boundingBox, selectionBox, buttonMain,buttonRight,buttonMiddle;
    var dragOffsetX, dragOffsetY,dragStartX, dragStartY, pointerLoc, mouseOveBounds,workVec,workVec1,workVec2,workVec3;
    var inSelectionBox, boundsCorners, boundsLines,shadowPoints, shadowing,mirrorShadow, shadowSelection,cancel;
    var rightClickSelect, buttonDown, buttonDownOnSelected, buttonDownOn, dragged, dragSelection, quickDrag, draggingFinnalFlag, pointsUpdated, currentMouseFunction, rightClickMouseFunction;
    // ##Var
    var rotationLine, boundsTransform, workTransform, cIndex, bounds, cursorNames, eventTypeNames, selectionHash, displayTransform;
    
    geom = this;
    element = element1;
    geom.Geom.prototype.UIelement = element;    
    geom.Geom.prototype.UIMouse;    
    geom.Geom.prototype.updatePointer;    
    
    if(this.UI !== undefined){
        if(element1 === undefined){
            console.log("Call to groover.geom.Geom.prototype.addUI() failed. Groover.Geom.UI extension already exists");        
            return;
        }
        throw new Error("Could not add UI for element because UI already exists. Use  groover.Geom.setUIElement(element) istead.");
    }    
    this.UI = function(){};  
    this.extensions.UI = {   // add extensions 
        functions : [],
        info : "Provides a User interface for basic interaction."
    };
    this.objectNames.push("UI");
    geom.Geom.prototype.setUIElement = function(_element){
        if(_element === undefined || _element === null){
            if(mouse.active){
                mouse.remove();
            }
            throw new TypeError("Groover.Geom.setUIElement invalid element can not start.");
        }
        element = geom.Geom.prototype.UIelement = _element;    
        mouse.start(element)
    }

    
  
    points = new geom.VecArray().makeUnique().setLabel("Geom.UI.Points");
    shadowPoints = new geom.VecArray().makeUnique().setLabel("Geom.UI.shadowPoints");
                                        // IF the client app modifies points  when they change (such as snap to) this array can be used to maintain the correct aspects and dragging offsets during dragging operations.
                                        // call shadowPoints to activate shadows
                                        // call unshadowPoints to deactivate
                                        // call isShadowing to get status
    shadowing = false;               
    mirrorShadow = function(a1,a2){  // copies the points coords in array 1 to array to 
        a1.each(function(p,i){
            a2.vecs[i].x = p.x;
            a2.vecs[i].y = p.y;
        });
    }      
    shadowSelection = new geom.VecArray().makeUnique().setLabel("Geom.UI.shadowSelected");    
    selected = new geom.VecArray().makeUnique().setLabel("Geom.UI.Selected");
    unselected = new geom.VecArray().makeUnique().setLabel("Geom.UI.unSelected");;
    inSelectionBox = new geom.VecArray().makeUnique().setLabel("Geom.UI.inSelectionBax");
    pointerLoc = new geom.Vec().makeUnique().setLabel("Geom.UI.pointer");;
    workVec = new geom.Vec();  // rather than create a new vec each time just use this onerror
    workVec1 = new geom.Vec();  // rather than create a new vec each time just use this onerror
    workVec2 = new geom.Vec();  // rather than create a new vec each time just use this onerror
    workVec3 = new geom.Vec();  // rather than create a new vec each time just use this onerror
    boundingBox = new geom.Box().makeUnique().setLabel("Geom.UI.boundingBox");;
    selectionBox = new geom.Box().makeUnique().setLabel("Geom.UI.selectionBox");;
    rotationLine = new geom.Line(new geom.Vec().setLabel("Top") ,new geom.Vec().setLabel("Rotate"));
    workTransform = new geom.Transform();
    boundsTransform = new geom.Transform();
    cancel = false; // global event cance;l
    buttonMain = 1;
    buttonRight = 4;
    buttonMiddle = 2;
    buttonDown = false;
    buttonDownOnSelected = false;
    buttonDownOn = undefined;
    dragged = false;
    dragSelection = false;
    quickDrag = false;
    draggingFinnalFlag = false; // this is true untill the pointer update after all dragging is complete
    pointsUpdated = false; // true if there are point that have been changed. 
    currentMouseFunction;
    rightClickMouseFunction;
    rightClickSelect = true;
    
    boundsCorners = [
        new geom.Vec().setLabel("TopLeft"),
        new geom.Vec().setLabel("TopRight"),
        new geom.Vec().setLabel("BottomRight"),
        new geom.Vec().setLabel("BottomLeft"),
        rotationLine.p1,
        new geom.Vec().setLabel("Right"),
        new geom.Vec().setLabel("Bottom"),
        new geom.Vec().setLabel("Left"),
        rotationLine.p2,
    ]; // from top left around clockwise
    boundsLines = [ 
        new geom.Line(boundsCorners[0],boundsCorners[1]),
        new geom.Line(boundsCorners[1],boundsCorners[2]),
        new geom.Line(boundsCorners[2],boundsCorners[3]),
        new geom.Line(boundsCorners[3],boundsCorners[0])
    ];
    cIndex = {
            topLeft : 0,
            topRight : 1,
            bottomRight : 2,
            bottomLeft : 3,
            top : 4,
            right : 5,
            bottom : 6,
            left : 7,
            rotate : 8,
    };   
    bounds = {
        box : boundingBox,
        rotationLine : rotationLine,
        padBy : 7,
        points : new geom.VecArray(boundsCorners),
        lines : new geom.PrimitiveArray(boundsLines),
        pointerOverPointIndex : -1,
        controls : false,  // if true then control points are active. Usually false when only a single point is selected
        active : false, // if true then bounds is set and active
        pointerOverControlIndex : -1,
        transform : boundsTransform,
        boundControlePointIndexs : cIndex,
        mainCursor : "move",
        controlPointCursors : [
            "nw-resize",
            "ne-resize",
            "se-resize",
            "sw-resize",
            "n-resize",
            "e-resize",
            "s-resize",
            "w-resize",
            "rotate",
        ],
        controlPointsTransformOriginIndex : [
           cIndex.bottomRight,
           cIndex.bottomLeft,
           cIndex.topLeft,
           cIndex.topRight,
           cIndex.bottom,
           cIndex.left,
           cIndex.top,
           cIndex.right,
         ],  
    }
    cursorNames = {
        selectAdd : "add",
        selectRemove : "remove",
        move : "move",
        select : "pointer",
    }   
    eventTypeNames = {
        onSelectChanged : "selectChanged",
        onDragStart : "dragStart",
        onDragMove : "dragMove",
        onDragEnd : "dragEnd", 
        onReset : "reset",
        onPointsChanged : "pointsChanged",
        onUnusedRightButton : "unusedRightButton",
    };

    this.UI.prototype = {
        pointOfInterestIndex : undefined,  // this holds a index to a point in one of the exposed vecArrays and is set depending on the function and argument. use it to access the point of interest
        points : points,
        selected : selected,
        closestToPointer : undefined,
        dragging : false,
        draggingItem : undefined,
        bounds : bounds,
        rotationLine : rotationLine,
        selectionBox : selectionBox,
        dragSelecting : false,
        pointerOverBounds : false,        
        changed : true,  // this is set to true if a point has been moved or there has been any change in any geom stored, changed is flaged true of points are added or removed. Changed does not include changes in selection
        cursor : "default",
        selectCursor : "pointer",
        dragPointCursor : "move",
        cursorNames : cursorNames,
        currentPointerFunction : undefined,   
        nextPointerFunctionOnDown : undefined,
        currentRightPointerFunction : undefined,
        nextRightPointerFunctionOnDown : undefined,
        onSelectChanged : undefined,  // fires on selection changed in any way. 
        onDragStart : undefined,      // fires on drag start. Return true to cancel the drag event. Will fire onDragEnd if set
        onDragMove : undefined,       // fires for each drag.
        onDragEnd : undefined,        // fires when draging has ended
        onReset : undefined,          // fires when UI is reset.. Return true to cancel reset
        onPointsChanged : undefined, // fires when UI has moved or changed any points.
        onUnusedRightButton : undefined, // fires when right button is clicked and dragged without a handler
        pointerLoc : pointerLoc,
        pointerDistLimit : 10,
        mainButton : false,
        rightButton : false,
        actionButton : false,
        activeButton : 0,
        transform : undefined,
        setInvTransform( transformation){ // set the transformation to move the mouse to canvas coords. This is usually the inverse of context current transform
            this.transform = transformation;
        },
        doEvent(name,info){
            if(typeof this[name] === "function"){
                cancel = this[name](this,{type:eventTypeNames[name],info : info});
                if(cancel !== false && cancel !== true){
                    cancel = false;
                }
            }else{
                cancel = false;
            }
        },
        setDragMode(mode){
            if(typeof mode === "string"){
                mode = mode.toLowerCase();
                switch( mode ){
                    case "quickdrag":
                        quickDrag = true;
                        return;
                    default:
                    case "clickselect":
                        quickDrag = false;
                        return;
                }
            }
        },   
        setRightClickSelect (state){
            rightClickSelect = state ? true : false;
        },
        removeEvents(){
            this.onSelectChanged = undefined;
            this.onDragStart = undefined;
            this.onDragMove = undefined;
            this.onDragEnd = undefined;
            this.onReset = undefined;
            this.onUnusedRightButton = undefined;
        },
        reset(){
            this.doEvent("onReset");
            if(!cancel){                
                selected.reset();
                unselected.reset();
                points.reset();
                inSelectionBox.reset();
                this.draggingItem = undefined;
                this.closestToPointer = undefined;
                this.currentPointerFunction = undefined;
                this.nextPointerFunctionOnDown = undefined;
                this.dragging = false;
                mouse.remove();
                this.removeEvents();
            }
        },
        buttonDown(){
            
        },
        dragComplete(updateSelection){
            this.doEvent("onDragEnd");
            if(updateSelection === true){
                this.selectionChanged();
            }
            this.dragging = false;
            this.activeButton = 0;
            this.currentPointerFunction = this.pointerHover;                    
        },
        updatePointerState(){
            this.mainButton = (mouse.buttonRaw & buttonMain) === buttonMain;
            this.rightButton = (mouse.buttonRaw & buttonRight) === buttonRight;
            if(this.activeButton === 0){
                this.actionButton = this.mainButton;
            }else
            if(this.activeButton === 2){
                this.actionButton = this.rightButton;
            }               
            if(this.transform !== undefined){
                pointerLoc = this.transform.applyToCoordinate(mouse.x,mouse.y,pointerLoc);
            }else{                
                pointerLoc.x = mouse.x;            
                pointerLoc.y = mouse.y;   
            }
            if(this.currentPointerFunction === undefined){
                this.currentPointerFunction = this.pointerHover;                    
            }
            if(this.currentRightPointerFunction === undefined){
                this.currentRightPointerFunction = this.pointerHover;                    
            }
        },
        pointerHover(){
            this.locateControlsAndPoints();
            if(this.mainButton  && !this.dragging){
                if(this.nextPointerFunctionOnDown !== undefined){
                    this.activeButton = 0;
                    this.currentPointerFunction = this.nextPointerFunctionOnDown;
                    this.nextPointerFunctionOnDown = undefined;
                    dragStartX = pointerLoc.x;
                    dragStartY = pointerLoc.y;    
                    this.actionButton = this.mainButton;
                    this.currentPointerFunction();
                    this.actionButton = false;
                }
            }        
            if(this.rightButton && !this.dragging){
                if(this.nextRightPointerFunctionOnDown !== undefined){
                    this.activeButton = 2;
                    this.currentPointerFunction = this.nextRightPointerFunctionOnDown;
                    this.nextRightPointerFunctionOnDown = undefined;
                    dragStartX = pointerLoc.x;
                    dragStartY = pointerLoc.y;                    
                    this.actionButton = this.rightButton;
                    this.currentPointerFunction();
                    this.actionButton = false;
                }
            }              
        },
        pointerDoNothing(){          
            if(!this.dragging){ 
                this.dragging = true;   
                this.doEvent("onUnusedRightButton",{type: "down",button:this.activeButton,mouseX : pointerLoc.x, mouseY :pointerLoc.y});    
                if(cancel){            
                    this.dragComplete();                                       
                }                
            }else{            
                if(!this.actionButton){
                    this.doEvent("onUnusedRightButton",{type: "up",button:this.activeButton,mouseX : pointerLoc.x, mouseY :pointerLoc.y});                        
                    this.dragComplete();                   
                }else{
                    this.doEvent("onUnusedRightButton",{type: "drag",button:this.activeButton,mouseX : pointerLoc.x, mouseY :pointerLoc.y});                        
                    if(cancel){            
                        this.dragComplete();                                       
                    }                      
                }
            }
        
        },
        pointerQuickMove(){
            if(!this.dragging){ 
                this.doEvent("onDragStart",{type: "quickMove",mouseX : pointerLoc.x, mouseY :pointerLoc.y,item : this.closestToPointer});
                if(!cancel){            
                    this.dragging = true;   
                    this.selectNone()
                    this.selectPoint(this.closestToPointer,true);
                    this.currentPointerFunction = this.pointerDragBounds;
                }else{
                    this.dragComplete();                                       
                }
            }else{            
                this.dragComplete();                   
            }
        },
        pointerSelectAdd(){
            if(!this.dragging){ 
                this.dragging = true;   
                buttonDownOn = this.closestToPointer;
            }else{            
                if(!this.actionButton){
                    this.getPointAtPointer();
                    if(this.closestToPointer && buttonDownOn.id === this.closestToPointer.id){
                        this.selectPoint(buttonDownOn,true);  
                        buttonDownOn = undefined;
                    }
                    this.dragComplete();                   
                }
            }
        },
        pointerSelectRemove(){
            if(!this.dragging){ 
                this.dragging = true;   
                buttonDownOn = this.closestToPointer;
            }else{            
                if(!this.actionButton){
                    this.getPointAtPointer();
                    if(this.closestToPointer !== undefined && buttonDownOn.id === this.closestToPointer.id){
                        this.unselectPoint(buttonDownOn,true);  
                        buttonDownOn = undefined;
                    }
                    this.dragComplete();                   
                }
            }            
        },
        pointerDragBounds(){  
            if(!this.dragging){ 
                this.doEvent("onDragStart",{type: "move",mouseX : pointerLoc.x, mouseY :pointerLoc.y});
                if(!cancel){
                    this.dragging = true;   
                    if(shadowing){
                        mirrorShadow(selected,shadowSelection);
                    };
                }else{
                    this.dragComplete(true);                                       
                }
            }else{
                if(!this.actionButton){
                    this.dragComplete(true);                   
                }else{
                    workVec.x = pointerLoc.x- dragStartX;
                    workVec.y = pointerLoc.y- dragStartY;
                    dragStartX = pointerLoc.x;
                    dragStartY = pointerLoc.y; 
                    if(this.onDragMove !== undefined){
                        this.doEvent("onDragMove",{type: "move",offset:workVec.asSimple(),mouseX: pointerLoc.x, mouseY:pointerLoc.y});
                    }else{
                        cancel = false;
                    }
                    if(!cancel){
                        if(shadowing){
                            shadowSelection.add(workVec);
                            mirrorShadow(shadowSelection,selected);
                        }else{                    
                            selected.add(workVec);
                        }
                        boundingBox.add(workVec);
                        this.bounds.points.add(workVec);
                        this.changed = pointsUpdated = true;                
                    }
                }
            }
        },
        pointerDragBoundsRotate(){    
            if(!this.dragging){ 
                this.doEvent("onDragStart",{type: "rotate",mouseX : pointerLoc.x, mouseY :pointerLoc.y});
                if(!cancel){
                    this.dragging = true;   
                    this.bounds.draggingPointIndex = this.bounds.pointerOverControlIndex;         
                    if(shadowing){
                        mirrorShadow(selected,shadowSelection);
                    };                
                }else{
                    this.dragComplete(true);                                                        
                }
            }else{
                if(!this.actionButton){
                    this.dragComplete(true);     
                    this.bounds.draggingPointIndex = -1;                    
                }else{
                    workVec.x = dragStartX;
                    workVec.y = dragStartY;
                    dragStartX = pointerLoc.x;
                    dragStartY = pointerLoc.y;  
                    if(this.onDragMove !== undefined){
                        this.doEvent("onDragMove",{type: "rotate",offset:workVec.asSimple(),mouseX: pointerLoc.x, mouseY:pointerLoc.y});
                    }else{
                        cancel = false;
                    }
                    if(!cancel){                    
                        boundingBox.center(workVec3);
                        workVec2.x = pointerLoc.x;
                        workVec2.y = pointerLoc.y;
                        var ang = workVec.sub(workVec3).angleBetween(workVec2.sub(workVec3));
                        this.bounds.transform.reset()
                            .setOrigin(workVec3) // set center
                            .negateOrigin()      // invert origin so that all points are move to be relative to center
                            .rotate(ang)         // rotate all points
                            .translate(workVec3.x,workVec3.y);  // return points to the original position
                        if(shadowing){
                            this.bounds.transform.applyToVecArray(shadowSelection);   
                            mirrorShadow(shadowSelection,selected);                        
                        }else{
                            this.bounds.transform.applyToVecArray(selected)
                        }
                        this.bounds.transform.applyToVecArray(this.bounds.points);           
                        this.changed = pointsUpdated = true;  
                    }
                        
                }
            }
        },
        pointerDragBoundsScale(){           
            if(!this.dragging){ 
                this.doEvent("onDragStart",{type: "scale",mouseX : pointerLoc.x, mouseY :pointerLoc.y});
                if(!cancel){            
                    this.dragging = true;   
                    this.bounds.draggingPointIndex = this.bounds.pointerOverControlIndex;    
                    if(shadowing){
                        mirrorShadow(selected,shadowSelection);
                    };       
                }else{   
                    this.dragComplete(true);   
                }
            }else{
                if(!this.actionButton){
                    this.dragComplete(true);     
                    this.bounds.draggingPointIndex = -1;                    
                }else{
                    workVec.x = pointerLoc.x- dragStartX;
                    workVec.y = pointerLoc.y- dragStartY;
                    dragStartX = pointerLoc.x;
                    dragStartY = pointerLoc.y;   
                    if(this.onDragMove !== undefined){
                        this.doEvent("onDragMove",{type: "scale",offset:workVec.asSimple(),mouseX: pointerLoc.x, mouseY:pointerLoc.y});
                    }else{
                        cancel = false;
                    }
                    if(!cancel){                        
                        var oldWidth = boundingBox.right - boundingBox.left;
                        var oldHeight = boundingBox.bottom - boundingBox.top;
                        this.bounds.points.vecs[this.bounds.draggingPointIndex].add(workVec);
                        switch(this.bounds.draggingPointIndex){
                            case cIndex.topLeft:
                            case cIndex.topRight:
                            case cIndex.top:
                               boundingBox.top += workVec.y;
                               if(boundingBox.top > boundingBox.bottom - 1){
                                    boundingBox.top = boundingBox.bottom - 1;
                               }
                               break;
                            case cIndex.bottomRight:
                            case cIndex.bottomLeft:
                            case cIndex.bottom:
                               boundingBox.bottom += workVec.y;
                               if(boundingBox.bottom < boundingBox.top + 1){
                                    boundingBox.bottom = boundingBox.top + 1;
                               }
                               break;
                        }
                        switch(this.bounds.draggingPointIndex){
                            case cIndex.topLeft:
                            case cIndex.bottomLeft:
                            case cIndex.left:
                               boundingBox.left += workVec.x;
                               if(boundingBox.left > boundingBox.right - 1){
                                    boundingBox.left = boundingBox.right - 1;
                               }
                               break;
                            case cIndex.topRight:
                            case cIndex.bottomRight:
                            case cIndex.right:
                               boundingBox.right += workVec.x;
                               if(boundingBox.right < boundingBox.left + 1){
                                    boundingBox.right = boundingBox.left + 1;
                               }
                               break;
                        }
                        var v1 = this.bounds.points.vecs[this.bounds.controlPointsTransformOriginIndex[this.bounds.draggingPointIndex]];
                        this.bounds.transform.reset()
                            .setOrigin(v1)
                            .negateOrigin()
                            .scale((boundingBox.right - boundingBox.left) / oldWidth, (boundingBox.bottom - boundingBox.top) / oldHeight)
                            .translate(v1.x,v1.y)
                        if(shadowing){
                            this.bounds.transform.applyToVecArray(shadowSelection);   
                            mirrorShadow(shadowSelection,selected);                        
                        }else{
                            this.bounds.transform.applyToVecArray(selected);        
                        }
                        this.changed = pointsUpdated = true;                   
                        this.updateBounds();
                    }
                }
            }
        },
        pointerDragSelect(){
            if(!this.dragging){ 
                this.doEvent("onDragStart",{type: "select",mouseX : pointerLoc.x, mouseY :pointerLoc.y});
                if(!cancel){   
                    selectionBox.right = selectionBox.left = dragStartX;
                    selectionBox.bottom = selectionBox.top = dragStartY;
                    this.dragging = true;
                    this.dragSelecting = true;        
                }else{
                    this.dragSelecting = false;                
                    this.dragComplete(true);                      
                }   
            }else{
                if(!this.actionButton){
                    this.dragSelecting = false;                
                    this.dragComplete(true);  
                }else{
                    selectionBox.left = dragStartX;
                    selectionBox.top = dragStartY;
                    selectionBox.right = pointerLoc.x;
                    selectionBox.bottom = pointerLoc.y;
                    selectionBox.normalise();
                    if(this.onDragMove !== undefined){
                        this.doEvent("onDragMove",{type: "select",bounds:selectionBox.asSimple(),mouseX: pointerLoc.x, mouseY:pointerLoc.y});
                    }else{
                        cancel = false;
                    }
                    if(!cancel){                        
                        points.findInsideBox(selectionBox,selected,unselected);
                        this.dragSelecting = true;                
                    }
                }
            }
        },       
        getPointAtPointer(){
            var ind = points.findClosestIndex(pointerLoc,this.pointerDistLimit);
            if(ind !== -1){
                this.closestToPointer = points.vecs[ind];
                return this.isSelected(this.closestToPointer.id);
            }else{
                this.closestToPointer = undefined;
            }         
            return false;            
        },
        locateControlsAndPoints(){
            var vecSelected = false;
            this.nextPointerFunctionOnDown = undefined;
            if(this.bounds.active){
                if(this.bounds.controls){
                    this.bounds.pointerOverControlIndex = this.bounds.points.findClosestIndex(pointerLoc,this.pointerDistLimit, true);
                    if(this.bounds.pointerOverControlIndex === -1){ 
                        this.bounds.pointerOverControlIndex = -1;
                        this.pointerOverBounds = boundingBox.isVecInside(pointerLoc);
                    }else{
                        this.pointerOverBounds = false;
                    }
                }else{
                    this.bounds.pointerOverControlIndex = -1;
                    this.pointerOverBounds = boundingBox.isVecInside(pointerLoc);
                }
            }else{
                this.bounds.pointerOverControlIndex = -1;
                this.pointerOverBounds = false;
            }
            if(!this.dragging){
                vecSelected = this.getPointAtPointer();
                if(this.bounds.pointerOverControlIndex > -1){
                    this.nextRightPointerFunctionOnDown = this.pointerDoNothing;
                    mouse.requestCursor(this.bounds.controlPointCursors[this.bounds.pointerOverControlIndex]);
                    if(this.bounds.pointerOverControlIndex !== cIndex.rotate){
                        this.nextPointerFunctionOnDown = this.pointerDragBoundsScale;
                    }else{
                        this.nextPointerFunctionOnDown = this.pointerDragBoundsRotate;
                    }
                }else
                if(this.pointerOverBounds){
                    if(this.closestToPointer !== undefined && rightClickSelect){
                        if(vecSelected){
                            this.nextRightPointerFunctionOnDown = this.pointerSelectRemove;
                        }else{
                            this.nextRightPointerFunctionOnDown = this.pointerSelectAdd;
                        }
                    }else{
                        this.nextRightPointerFunctionOnDown = this.pointerDoNothing;
                    }
                        
                    if(mouse.ctrl && this.closestToPointer !== undefined){
                        if(vecSelected){
                            mouse.requestCursor(cursorNames.selectRemove);
                            this.nextPointerFunctionOnDown = this.pointerSelectRemove;                            
                        }else{
                            mouse.requestCursor(cursorNames.selectAdd);
                            this.nextPointerFunctionOnDown = this.pointerSelectAdd;
                        }
                    }else{
                        mouse.requestCursor(this.bounds.mainCursor);
                        this.nextPointerFunctionOnDown = this.pointerDragBounds;
                    }
                }else
                if(this.closestToPointer !== undefined){
                    if(this.closestToPointer !== undefined && rightClickSelect){
                        if(vecSelected){
                            this.nextRightPointerFunctionOnDown = this.pointerSelectRemove;
                        }else{
                            this.nextRightPointerFunctionOnDown = this.pointerSelectAdd;
                        }
                    }else{
                        this.nextRightPointerFunctionOnDown = this.pointerDoNothing;
                    }                    
                    if(quickDrag){
                        if(mouse.ctrl){
                            if(vecSelected){
                                mouse.requestCursor(cursorNames.selectRemove);
                                this.nextPointerFunctionOnDown = this.pointerSelectRemove;
                            }else{
                                mouse.requestCursor(cursorNames.selectAdd);
                                this.nextPointerFunctionOnDown = this.pointerSelectAdd;
                            }
                        }else{
                            mouse.requestCursor(cursorNames.move);
                            this.nextPointerFunctionOnDown = this.pointerQuickMove;
                        }
                    }else{
                        if(vecSelected){
                            mouse.requestCursor(cursorNames.selectRemove);
                            this.nextPointerFunctionOnDown = this.pointerSelectRemove;
                        }else{
                            mouse.requestCursor(cursorNames.selectAdd);
                            this.nextPointerFunctionOnDown = this.pointerSelectAdd;
                        }                            
                    }
                            

                }else{
                    this.nextPointerFunctionOnDown = this.pointerDragSelect;
                    this.nextRightPointerFunctionOnDown = this.pointerDoNothing;
                    mouse.releaseCursor();
                }
            }else{
                this.closestToPointer = undefined;
                mouse.requestCursor("none");
            }
            
            
        },
        updatePointer(){
            var oc;
            this.updatePointerState();
            if(this.onPointsChanged !== undefined){
                oc = this.changed;
                this.changed = false;
                this.currentPointerFunction();
                if(this.changed){
                    this.doEvent("onPointsChanged");
                }
                this.changed = oc;
            }else{            
                this.currentPointerFunction();
            }
        },
        hasPointMoved(id){ // id can be a point or the index or an array returns true of a point with Id is in the selected vecArray and it is being dragged
            if(pointsUpdated){
                pointsUpdated = false; 
                if(Array.isArray(id)){
                    for(var i = 0; i < id.length; i ++){
                        if(id[i] !== undefined && id[i].id !== undefined){
                            if(selected.isIdInArray(id[i].id)){
                                this.pointOfInterestIndex = geom.registers.get("c"); 
                                return true;
                            }
                        }else{
                            if(selected.isIdInArray(id[i])){
                                this.pointOfInterestIndex = geom.registers.get("c"); 
                                return true;
                            }                            
                        }
                    }
                    return false;
                    
                }else
                if(geom.isPrimitive(id)){
                    return selected.isIdInArray(id.id);
                }
                return selected.isIdInArray(id)
            }
        },
        shadowPoints(){
            var p,v;
            if(!shadowing){
                shadowPoints.reset();
                points.each(function(p){
                    shadowPoints.push(v = p.copy());
                    v.id = p.id;
                });
                shadowing = true;
                this.shadowSelection();
            }
            return this;
        },
        unshadowPoints(){
            if(shadowing){
                shadowPoints.reset();
                this.shadowSelection();
                shadowing = false;
            }
            return this;
        },
        isShadowing(){
            return shadowing;
        },
        shadowSelection(){
            var v;
            if(shadowing){
                shadowSelection.clear();
                selected.each(function(p,i){
                    v = shadowPoints.getVecById(p.id);
                    if(v === undefined){
                        shadowSelection.clear();
                        throw new Error("Geom.UI.shodowSelection. Points array missmatch. Cant find selected in shadow array.");
                    }
                    shadowSelection.push(v);
                });
            }
            return this;
        },
        addPoint(...vecs){
            if(typeof vecs[vecs.length - 1] === "boolean"){
                if (vecs.pop() === true) { vecs.forEach(vec => vec.makeUnique()) }
            }
            vecs.forEach(vec => {
                if(!points.isIdInArray(vec.id)){
                    points.push(vec);                
                    this.pointsListChanged();
                    this.selectPoint(vec,true);                
                    this.changed = true;
                }
            });
            return this;
        },
        addPoints(vecArray, allreadyUnique){
            var i,len,vec;
            if(geom.isPrimitive(vecArray)){
                if(vecArray.type === "VecArray"){
                    vecArray.each(function(vec){
                        if(!allreadyUnique){
                            vec.makeUnique();
                        }
                        if(!points.isIdInArray(vec.id)){
                            points.push(vec);
                        }
                    });
                }else
                if(vecArray.type === "Vec"){
                     if(!allreadyUnique){
                        vecArray.makeUnique();
                    }
                    if(!points.isIdInArray(vecArray.id)){
                        points.push(vecArray);
                    }                   
                }else{
                    return this;
                }
            }else
            if(Array.isArray(vecArray)){
                len = vecArray.length;
                for(i = 0; i < len; i ++){
                    vec = vecArray[i];
                    if(geom.isPrimitive(vec) && vec.type === "Vec"){
                        if(!allreadyUnique){
                            vec.makeUnique();
                        }
                        if(!points.isIdInArray(vec.id)){
                            points.push(vec);
                        }    
                    }
                }
                        
                        
                
            }else{
                return this;
            }
            this.pointsListChanged();
            this.selectPoints(vecArray,true);
            this.changed = true;
            return this;
        },
        pointsListChanged(){
            if(shadowing){
                shadowPoints.setLength(points.length);
                shadowPoints.each(function(p,i){
                    p.x = points.vecs[i].x;
                    p.y = points.vecs[i].y;
                    p.id = points.vecs[i].id;
                });
            }
            return this;
        },
        selectPointToggle(point, safe){ // point is a vec and safe is true if you want the selection to check for violations.
            var sel,unsel;
            if(safe){
                if(points.isIdInArray(point.id)){
                    sel = selected.isIdInArray(point.id);
                    var indS = geom.registers.get("c"); // get the index of point
                    unsel = unselected.isIdInArray(point.id);
                    var indU = geom.registers.get("c"); // get the index of point
                    if(sel && !unsel){                            
                        selected.remove(indS);   
                        unselected.push(point);   
                    }else
                    if(!sel && unsel){
                        selected.push(point);
                        unselected.remove(indU);
                    }
                }
            }else{
                if(selected.isIdInArray(point.id)){
                    selected.remove(geom.registers.get("c"));                    
                    unselected.push(point);
                }else{
                    unselected.removeById(point.id);                    
                    selected.push(point);
                }
            }
            this.selectionChanged();
            return this;
        },
        selectPoint(point, safe){ // point is a vec and safe is true if you want the selection to check for violations.
            if(safe){
                if(points.isIdInArray(point.id)){
                    unselected.removeById(point.id);
                    if(!selected.isIdInArray(point.id)){
                        selected.push(point);
                    }
                }
            }else{
                unselected.removeById(point.id);
                selected.push(point);
            }
            this.selectionChanged();
            return this;
        },
        unselectPoint(point, safe){ // point is a vec and safe is true if you want the selection to check for violations.
            if(safe){
                if(points.isIdInArray(point.id)){
                    selected.removeById(point.id);
                    if(!unselected.isIdInArray(point.id)){
                        unselected.push(point);
                    }
                }
            }else{
                selected.removeById(point.id);
                unselected.push(point);
            }
            this.selectionChanged();
            return this;
        },        
        selectPoints(selPoints, safe){
            if(selPoints !== undefined && selPoints.type === "VecArray"){
                selPoints.each((function(vec){
                    this.selectPoint(vec, safe);
                }).bind(this));
            }else
            if(Array.isArray(selPoints)){
                selPoints.forEach((function(vec){
                    this.selectPoint(vec, safe);
                }).bind(this));
            }
            this.selectionChanged();
            return this;
        },
        selectAll(){
            unselected.clear();
            selected.clear().append(points);
            this.selectionChanged();
            return this;
        },
        selectNone(){
            unselected.clear().append(points);
            selected.clear();
            this.selectionChanged();
            return this;
        },
        selectInvert(){
            var idList = [];
            selected.each(function(vec){
                idList[idList.length] = vec.id;
            })
            unselected.clear().append(selected);
            selected.clear();
            points.each(function(vec){
                if(idList.indexOf(vec.id) === -1){
                    selected.push(vec);
                }
            });
            this.selectionChanged();
            return this;
        },
        selectionChanged(forced){
            var newHash = this.selected.getHash();
            if(forced || selectionHash !== newHash){
                selectionHash = newHash;
                this.doEvent("onSelectChanged",{type:"selectChanged"});
                if(!cancel){
                    if(selected.length === 0){
                        boundingBox.irrate();
                        this.bounds.active = false;
                        this.bounds.controls = false;
                    }else
                    if(selected.length === 1){
                        selected.asBox(boundingBox.irrate()).pad(bounds.padBy);
                        this.bounds.active = true;
                        this.bounds.controls = false;
                    }else{
                        selected.asBox(boundingBox.irrate())
                        if(boundingBox.width() < bounds.padBy && boundingBox.height() < bounds.padBy){
                            boundingBox.pad(bounds.padBy);
                            this.bounds.active = true;
                            this.bounds.controls = false;
                        }else{
                            boundingBox.pad(bounds.padBy);
                            boundingBox.center(rotationLine.p1);
                            this.bounds.active = true;
                            this.bounds.controls = true;
                            this.updateBounds()
                        }
                    }
                    if(shadowing){
                        this.shadowSelection();
                    }
                }
            }
                
            return this;
        },
        updateBounds(){
            if(this.bounds.active){
                if(!this.bounds.controls){
                }else{
                    boundingBox.center(rotationLine.p1);
                    var cy = rotationLine.p1.y
                    var cx = rotationLine.p1.x
                    //rotationLine.p1.y = boundingBox.top;
                    boundsCorners[cIndex.left].x = boundsCorners[cIndex.topLeft].x = boundsCorners[cIndex.bottomLeft].x = boundingBox.left;
                    boundsCorners[cIndex.right].x = boundsCorners[cIndex.topRight].x = boundsCorners[cIndex.bottomRight].x = boundingBox.right;
                    boundsCorners[cIndex.top].x = boundsCorners[cIndex.bottom].x = cx;
                    boundsCorners[cIndex.top].y = boundsCorners[cIndex.topLeft].y = boundsCorners[cIndex.topRight].y = boundingBox.top;
                    boundsCorners[cIndex.bottom].y = boundsCorners[cIndex.bottomLeft].y = boundsCorners[cIndex.bottomRight].y = boundingBox.bottom;
                    boundsCorners[cIndex.left].y = boundsCorners[cIndex.right].y = cy;
                    rotationLine.p2.y = boundingBox.top - 20;
                    rotationLine.p2.x = rotationLine.p1.x;
                                        
                }
            }
            return this;
        },
        isSelected(id){
            if(selected.length > 0){
                if(typeof id === "number" || typeof id === "string" || Array.isArray(id)){
                    return selected.isIdInArray(id);
                }else
                if(geom.isPrimitive(id)){
                    return selected.isIdInArray(id.id);
                }
            }
            return false;
        },
        drawPoints(what,how){  // draws UI parts. What is what to draw. "all","selected","unselected". How is who to draw. how = "mark" marks vecs, how = "label" labels the vec
            if(typeof points.mark !== "function"){
                throw new Error("UI cant draw as there is no rendering extension 'mark()'");
            }
            if(what === undefined){
                what = "all";
            }else{
                what = what.toLowerCase();
            }
            if(how === undefined){
                how = "mark";
            }else
            if(how !== "label" && how !== "mark"){
                how = "mark";
            }
                
            if(what === "all"){
                points[how]();
            }else
            if(what === "selected"){
                if(how === "label"){
                    selected[how]("#");
                }else{
                    selected[how]();
                }
            }else
            if(what === "unselected"){
                unselected[how]();
            }else
            if(what === "inselectionbox"){
                inSelectionBox[how]();
            }else
            if(what === "nearmouse" && this.closestToPointer !== undefined){
                this.closestToPointer[how]();
            }
        },
        mapMouseButton(which, where){
            if(where === undefined) { throw new Error("mapMouseButton requires second argument!")  }
            else { where = where.toLowerCase() }
            if(which === undefined){ which = 1 }
            else{
                which = which.toLowerCase();
                if(which === "left"){ which = 1 }
                else if(which === "middle"){ which = 2 }
                else if(which === "right"){ which = 4 }
                else{ throw new Error("mapMouseButton unknown mouse button : "+which) }
            }
            if(where === "left"){ buttonMain = which }
            else if(where === "middle"){ buttonMiddle = which }
            else if(where === "right"){ buttonRight = which }
            else { throw new Error("mapMouseButton unknown mouse button : "+where) }
        }            
    }
    this.ui = new this.UI();
    geom.Geom.prototype.UIMouse = mouse = (function(){
        function preventDefault(e) { e.preventDefault(); }
        var interfaceId = 0;
        var i;
        var customCursors = {
            add :    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAYCAYAAABwZEQ3AAABzElEQVRIicWWX0tCQRDFf6BYJmgP+TcwSiy7FfRgZlqgBPX9P9HtYWdxHO/euzdRB4aVo+6ePXN2dqE4KipPGjWgDjRkrJ2KyBnQBNpAV8am4EeNmiycqhwBA8GPplAVV5I2kKZp6sm8CqG2fF89NBHvkRZOBU1mDiSCtziwh7RHBjgVNJkvNuoMOKCHsjySGjI2D+KhCsYjRUHYQxV2+5LFcvtVBddHuhm7z1NmBjwCfZw6vh/5rKu0eLC0WpmR7HiO84gm8wOsBV8AbzhD38hGukBPyPXY9CaLd4BL4CJEyHvGGzcRUprMGvgApkahJKDcJICPgSFwJUplRsxpmmJ8hSpnCfwFuBNCuQpt9RmVCz151mdLIA8XQkNcyYIe0h3Ye2iG88iOoTMW/Y3BZc4xzkN1ck6Z9dAj4o3QUTdGL8Rx/ktwpm7kkYFtD/WB20hlYstUioxXyHvoukgBq1YOvqJEmXRUhXlPKyIThhpiCnwH8JWoEmVgG1lNcSY5Bd5xJ+1T5VIWnMu4lFzI/6KOdiisoSfAPU7mB1ztn4BnGRP5jc9E4VFNryjsM7QjE3bYtHufe10HsWEf6OfsXoR7XZRlI+aJ8K8nxB+sHLGQMpxpsgAAAABJRU5ErkJggg==') 8 8, pointer",
            remove : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAUCAYAAAD2rd/BAAABuUlEQVRIicWXbUtCMRTHf6AoFlyEusrV3hRi+BBRRFk+VFRC3/8D2Ysdce5u8yxFB4dzx862/87+Z+dcKLdKgpy81YAGcK6QhtifrNWBDMiBAuhEpBC7TOYdvdVk81WC9DDgM47s6QrmenNgpWkC+FFAt4AzoEqc47tiQR0nFQwn26R5+AUYYrzcxM/xNV3qhGOjYYkqTmwP98Rzr8AMmFuyAN6BD/meAGPgBuhS5nhLDpKJblGOjUIclYsuUMbJmsMdAT0E7hy5T7yBPnANXO2wG0TGonESeyW64kkvn3192fDB7ofsQuNs4iTHsKDE6dA73BTQ9mI+gFsb+7412pKJ3EBbcASD0JaqGHdigGMHSdHWOt+YWLrF8N/r4dABtgD7rtYH+D8HsOZ+Ac8YSlyQkKBKgEOe9vR/NQAjlDgcYOXGy5idbz1nfC9KFM7pf5y+Tz4jY0vFfFXQ+QD7Esub6CkmySwcmWKy4ZPoKZsENJN+aP5c1t/5rIWam1gGjowpJ5oR5jr7okfW2Fg5f68Cy04sbcIp1U27lx6bWEo+aAlrJ5ZY0aItbDTz9y5dtWWhtnRM+g37A/SOJQU/LgzQAAAAAElFTkSuQmCC') 8 5, pointer",
            rotate : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAARCAYAAAAsT9czAAABWElEQVQ4ja2V20rDQBCGP3JR0pI0ltJTlBIrWi0mUClW8f2fSy/yrxk2m7RBB4btbv5DdjK7hWERBfLP4YtEwAiIgbHJWOsh/FUxMunmE2AKzIEFsNQ41/rEw1t+Z8RAAmQaE4ktge9A3gN3ej41HMeP+4wyieTKlRMOhTF9kOnK8NfSaxmOgNSJirD3TeyuAusvHn8HbKT7W9JI7nMr4v9WfgBn4N03DeBLoJBuLB8i6s5ahMol4qcMjsArcNB47OG8AY/SHftmy47yfMmoFHmrb7LVvOzgnYAn6V42897yGbgFZvoOM827OL1mwTIa8l47SvUN0gv4zjK6Bilsx5l0O8tp2jnTPIQ/A1WoQaBp/VxvU8ngpLGkbuU1zWFNNN/pucVX0nGVaN0mMXAjQCGwy4L6zNhD6na36cDn0uu9RVLCd2AaIA7Ft6Lvdv8PfCuG/m9dhf8BJ+ccqa7A1i0AAAAASUVORK5CYII=') 12 4, pointer",
        }
        var mouse = {
            x : 0, y : 0, w : 0, alt : false, shift : false, ctrl : false, buttonRaw : 0,
            bounds : null,
            active : false,
            currentCursor : "default",
            requestedCursor : "default",
            over : false,  // mouse is over the element
            bm : [1, 2, 4, 6, 5, 3], // masks for setting and clearing button raw bits;
            getInterfaceId () { return interfaceId++; }, // For UI functions
            mouseEvents : "mousemove,mousedown,mouseup,wheel".split(",")
        };
        function mouseMove(e) {
            var t = e.type, m = mouse;
            m.bounds = m.element.getBoundingClientRect();
            m.x = e.pageX - m.bounds.left - scrollX;
            m.y = e.pageY - m.bounds.top - scrollY;            
            if(m.x >= 0 && m.y >= 0 && m.x < m.bounds.width && m.y < m.bounds.height){ m.over = true }
            else { m.over = false }
                
            m.alt = e.altKey;m.shift = e.shiftKey;m.ctrl = e.ctrlKey;
            if (t === "mousedown") { m.buttonRaw |= m.bm[e.which-1] }
            else if (t === "mouseup") { m.buttonRaw &= m.bm[e.which + 2] }
            else if (t === "wheel") { m.w += -e.deltaY }
            if(this.callbacks){
                for(i = 0; i < this.callbacks.length; i ++) { this.callbacks[i](e) }
            }
            e.preventDefault();
        }
        mouse.updateCursor = function(){
            if(this.requestedCursor !== this.currentCursor){
                this.currentCursor = this.requestedCursor;
                if(customCursors[this.requestedCursor] !== undefined){
                    this.element.style.cursor = customCursors[this.requestedCursor];
                }else{
                    this.element.style.cursor = this.currentCursor;
                }
            }
        }
        mouse.requestCursor = function(cursor){
            this.requestedCursor = cursor;
            mouse.updateCursor();
        }
        mouse.releaseCursor = function(){
            this.requestedCursor = "default";
            mouse.updateCursor();
        }        
        mouse.addCallback = function(callback){
            if(typeof callback === "function"){
                if(mouse.callbacks === undefined){
                    mouse.callbacks = [callback];
                }else{
                    mouse.callbacks.push(callback);
                }
            }
        }
        mouse.start = function(element = document, blockContextMenu = false){
            if(mouse.element !== undefined){ mouse.remove();}
            mouse.element = element;
            mouse.mouseEvents.forEach(n => { document.addEventListener(n, mouseMove); } );
            if(blockContextMenu === true){
                element.addEventListener("contextmenu", preventDefault, false);
                mouse.contextMenuBlocked = true;
            }
            mouse.active = true;
        }
        mouse.remove = function(){
            if(mouse.element !== undefined){
                mouse.releaseCursor();
                mouse.mouseEvents.forEach(n => { document.removeEventListener(n, mouseMove); } );
                if(mouse.contextMenuBlocked === true){ mouse.element.removeEventListener("contextmenu", preventDefault);}
                mouse.contextMenuBlocked = undefined;
                mouse.callbacks = undefined;
                mouse.element = undefined;
            }
            mouse.active = false;
        }
        return mouse;
    })();    
    
    if(element !== undefined && element !== null){
        mouse.start(element,true);
        console.log("Groover.Geom.ui added mouse.");
    }
    console.log("Groover.Geom.ui installed.");
    
}
console.log("Groover.Geom UI extension parsed.");

/* example code for displaying ui gisom        
// GG is groover.geom
// Requiers 
// groover.geom.extension.render
// groover.geom.extension.ui
// ui can run without render but you will have to supply the rendering

// then this resets, adds element 
GG.ui.reset()
GG.setUIElement(canvas);
GG.setCtx(ctx);  // sets render target for render extension.
GG.ui.setDragMode("quickDrag")
GG.ui.addPoints(tri.asVecArray(undefined,true));
GG.ui.addPoints(cir.asVecArray(undefined,true));
// ctx is context
// begin style set style for fill, stroke, and lineWidth then calls beginPath

var drawGeomUI = function(){
    
    // Highligh vec near mouse
    GG.setMark("circle");
    GG.setMarkSize(6)
    beginStyle("blue","red",3);
    GG.ui.drawPoints("nearmouse");
    ctx.fill();
    ctx.stroke();
    
    // draw all unselected    
    GG.setMark("circle");
    GG.setMarkSize(4)
    beginStyle("blue","#000",1);
    GG.ui.drawPoints("unselected");
    ctx.stroke();

    // draw all selected
    GG.setMark("circle");
    GG.setMarkSize(5)
    beginStyle("blue","red",2);
    GG.ui.drawPoints("selected");
    ctx.stroke();

    // draw the bounding box
    if(GG.ui.bounds.active){
        if(GG.ui.pointerOverBounds){  // is mouse over
            beginStyle("blue","Yellow",2);
        }else{
            beginStyle("blue","Yellow",1);
        }
        GG.ui.bounds.lines.moveTo().draw(); // draw the lines
        if(GG.ui.bounds.controls){          // draw controls if active (single points have no controls)
            GG.ui.bounds.rotationLine.moveTo().draw();
            GG.setMark("box");
            GG.setMarkSize(GG.ui.pointerDistLimit)
            GG.ui.bounds.points.mark();
        }
        ctx.stroke();
        // highlight bounds control if point over it
        if(GG.ui.bounds.pointerOverPointIndex > -1){
            beginStyle("blue","Yellow",2);
            GG.ui.bounds.points.vecs[GG.ui.bounds.pointerOverPointIndex].mark();
            ctx.stroke();
        }
    }

    // if drag selecting then draw the selection box
    if(GG.ui.dragSelecting){
        beginStyle("rgba(255,255,255,0.1)","white",2);
        GG.ui.selectionBox.moveTo().draw(); // expand by 7
        ctx.fill();
        ctx.stroke();
    }
 }*/