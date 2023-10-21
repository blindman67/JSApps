

import {Vertices} from "../geometry/Vertices.js";
import {Vector, Vec2} from "../geometry/Vector.js";
import {Sleeping} from "../core/Sleeping.js";
import {Mouse} from "../core/Mouse.js";
import {Events} from "../core/Events.js";
import {Detector} from "../collision/Detector.js";
import {Constraint} from "./Constraint.js";
import {Composite} from "../body/Composite.js";
import {Common} from "../core/Common.js";
import {Bounds} from "../geometry/Bounds.js";
import {Selection} from "../core/Selection.jsm";


const PointConstraint = (()=> {
    class PointConstraint {
        label = "Point Constraint";
        pointA = Vector.Point();
        pointB = Vector.Point();
        length = 0.01;
        stiffness = 1;
        angularStiffness = 0.001;   
        bodyB;    
        type = Composite.types.pointConstraint;
        allBodies;
        focusedObject;
        active = false;
        constructor(render_) {
            this.render = render_;
        }
        update() {
           this.allBodies = Composite.allBodies(this.render.engine.world); 
        }
        objectUnder() {
            const w = this.render.engine.world;
            const b = this.allBodies;    
            this.focusedObject = undefined;
            var i, j;
            for (i = 0; i < b.length; i++) {
                const body = b[i];
                if (Bounds.contains(body.bounds, this.pointA)) {
                    for (j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                        const part = body.parts[j];
                        if (part.vertices.contains(this.pointA)) {                        
                            this.focusedObject = body;
                            return body;
                        }
                    }
                        
                }
            }                           
        }
        activate() { this.active = true; }
        deactivate() { 
            this.active = false; 
            this.bodyB = undefined; 
        }
        apply() {
            var j;
            if (this.active && this.focusedObject) {
                const body = this.focusedObject;
                if (!this.bodyB) {
                    for (j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                        const part = body.parts[j];
                        if (part.vertices.contains(this.pointA)) {                        
                            this.bodyB = body;
                            this.pointB.set(this.pointA.x - this.bodyB.pos.x, this.pointA.y - this.bodyB.pos.y);
                            this.angleB = this.bodyB.angle;
                            Sleeping.set(body, false);

                            break;
                        }
                    }
                }
                if (this.bodyB) {
                    Sleeping.set(this.bodyB, false);
                }
            } 
        }            
        
    };

    return PointConstraint;
})();
export {PointConstraint};

