"use strict";
/* This is experimental and subject to change.
   Gives primitives custom construction functions.
   For example. A PrimitiveArray can have a constructor added that snaps all the Beziers it contains together creating one path
                A Vec can have a constructor that places it one a line
                A Box can bound all the primitives assigned to via the constructor
                
   Many situation require the use of primitives that rely on the state of other primitives. The constructors extension provides a consistent means of adding such functionality.

   example of a Vec on a line
   vec = new Vec();
   line = new Line(new Vec(), new Vec());
   vec.addConstructor(
        geom.createConstructor(
            [line], // the primitive used to position the vec
            function(constuctorData, fromPrimitives){ // passes  constuctorData and array of primitives
                fromPrimitives[0].closestPoint(this,this); // puts this Vec at the closest point on the line
            }
        )
    );
    // to call the constructor function
    vec.recreate();
    
   
                
*/
groover.geom.Geom.prototype.addConstructors = function(){
    var geom; 
    geom = this;
    
    this.extensions.constructions = {   // add extensions 
        functions : [],
        info : "Provides methods to customise primitive construction"
    }; 
    var utilityFunctions = { // these are overload functions. They replace existing functions if they exist
        hasId : function(id){
            var i;
            if(!this.constructedWith.hasId(id)){
                for(i = 0; i < this.constructedWith.primitives.length; i ++){
                    if(this.constructedWith.primitives[i].hasId(id)){
                        return true;
                    }
                }
                return false;
            }
            return true;
        },
        getAllIdsAsArray : function(array){
            var i;
            this.constructedWith.getAllIdsAsArray(array);
            for(i = 0; i < this.constructedWith.primitives.length; i ++){
                this.constructedWith.primitives[i].getAllIdsAsArray(array);
            }
            return array;
        },
        replace : function(id,prim){
            if(id !== undefined){
                if(prim !== undefined){
                    this.constructedWith.replace(id,prim);
                    for(i = 0; i < this.constructedWith.primitives.length; i ++){
                        var p = this.constructedWith.primitives[i];
                        if(p.replace !== undefined){
                            p.replace(id,prim);
                        }
                        if(prim.type === p.type && p.id === id){
                            this.constructedWith.primitives[i] = prim;
                        }
                    }
                }
            }
            return this;
        },
    } 
    var functions = { // functions to add to each primitive
        hasConstructor : function(){  // returns true if this primitive has a constructor
            if(this.constructedWith !== undefined){
                return true;
            }
            return false;
        },
        addConstructor : function(construction, protectRecursion){ // adds a constructing object to the primitive. Use Geom.createConstructor to create a construing object. if protectRecursion is true then the primitive is modified so not to allow recursive searches
            this.constructedWith = construction;
            construction.create = construction.create.bind(this);
            if(!protectRecursion){
                construction.hasId = this.hasId.bind(this);
                construction.getAllIdsAsArray = this.getAllIdsAsArray.bind(this);
                if(this.replace !== undefined){
                    construction.replace = this.replace.bind(this);
                    this.replace = utilityFunctions.replace.bind(this);
                }
                this.hasId = utilityFunctions.hasId.bind(this);
                this.getAllIdsAsArray = utilityFunctions.getAllIdsAsArray.bind(this);
            }
            return this;
        },
        recreate : function(data){  // function recreates the primitive by calling the constructing function. Data is any optional data the constructing function may need.
            if(this.constructedWith !== undefined && typeof this.constructedWith.create === "function"){
                this.constructedWith.create(data, this.constructedWith);
            }
            return this;
        },
        removeConstructor : function(){  // removes a constructor and reverts the primitive back to standard type
            var cw = this.constructedWith;
            if(cw.hasId !== undefined){
                this.hasId = cw.hasId.bind(this);
            }
            if(cw.getAllIdsAsArray !== undefined){
                this.getAllIdsAsArray = cw.getAllIdsAsArray.bind(this);
            }
            if(cw.replace !== undefined){
                this.replace = cw.replace.bind(this);
            }
            this.constructedWith = undefined;
            return this;
        }    
    }
    for(var i in functions){ // register all the construction functions
        this.extensions.constructions.functions.push(i);   
    }  
    for(var j = 0; j < this.primitiveTypes.length; j ++){ // add construction extension functions to all primitives
        if(geom[this.primitiveTypes[j]]){
            var proto = geom[this.primitiveTypes[j]].prototype;
            for(var i in functions){
                proto[i] = functions[i];
            }
        }
    }
    geom.PrimitiveArray.prototype.callConstructors = function(){
        this.each(function(prim){
            if(prim.hasConstructor()){
                prim.recreate();
            }
        });
        return this;
    }
    geom.Geom.prototype.createConstructor = function(primitives,constructingFunction){ // creates constructor object. primitives is an array of primitives used to construct the this primitive. constructingFunction is the function that constructs the primitive
        var obj = {
            primitives : primitives,
            create : constructingFunction,
        }
        return obj;
    }
    console.log("Groover.Geom.extensions.constructions installed");
}
console.log("Groover.Geom Constructors extension parsed.");