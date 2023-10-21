var Composite = {};
export {Composite};
import {Events} from "../core/Events.js";
import {Common} from "../core/Common.js";
import {Bounds} from "../geometry/Bounds.js";
import {Body} from "./Body.js";
(function() {
    Composite.create = function(options) {
        const comp =  Common.extend({
            id: Common.nextId(),
            type: 'composite',
            parent: null,
            isModified: false,
            bodies: [],
            constraints: [],
            composites: [],
            label: 'Composite',
            plugin: {},
            cache: {
                allBodies: null,
                allConstraints: null,
                allComposites: null
            },
            
        }, options);
        Events.for(comp, "beforeAdd,afterAdd,beforRemove,afterRemove");
        return comp;
    };
    Composite.setModified = function(composite, isModified, updateParents, updateChildren) {
        composite.isModified = isModified;
        if (isModified && composite.cache) {
            composite.cache.allBodies = null;
            composite.cache.allConstraints = null;
            composite.cache.allComposites = null;
        }
        if (updateParents && composite.parent) {
            Composite.setModified(composite.parent, isModified, updateParents, updateChildren);
        }
        if (updateChildren) {
            for (var i = 0; i < composite.composites.length; i++) {
                var childComposite = composite.composites[i];
                Composite.setModified(childComposite, isModified, updateParents, updateChildren);
            }
        }
    };
    Composite.types = {
        constraint: "constraint",
        body: "body",
        composite: "composite",
        mouseConstraint: 2,
        pointConstraint: 3,
    };
    Composite.add = function(composite, object) {
        var objects = [].concat(object);
        composite.events.onBeforeAdd.fire({object});
        //Events.trigger(composite, 'beforeAdd', { object: object });
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            switch (obj.type) {
            case Composite.types.body:
                if (obj.parent !== obj) {
                    Common.warn('Composite.add: skipped adding a compound body part (you must add its parent instead)');
                    break;
                }
                Composite.addBody(composite, obj);
                break;
            case Composite.types.constraint:
                Composite.addConstraint(composite, obj);
                break;
            case Composite.types.composite:
                Composite.addComposite(composite, obj);
                break;
            case Composite.types.mouseConstraint:
            case Composite.types.pointConstraint:
                Composite.addConstraint(composite, obj);
                break;
            }
        }
        composite.events.onAfterAdd.fire({object});
        //Events.trigger(composite, 'afterAdd', { object: object });
        return composite;
    };
    Composite.remove = function(composite, object, deep) {
        var objects = [].concat(object);
        //Events.trigger(composite, 'beforeRemove', { object: object });
        composite.events.onBeforeRemove.fire({object});
        
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            switch (obj.type) {
            case Composite.types.body:
                Composite.removeBody(composite, obj, deep);
                break;
            case Composite.types.constraint:
                Composite.removeConstraint(composite, obj, deep);
                break;
            case Composite.types.composite:
                Composite.removeComposite(composite, obj, deep);
                break;
            case Composite.types.pointConstraint:
                Composite.removeConstraint(composite, obj.constraint);
                break;
            }
        }
        composite.events.onAfterRemove.fire({object});
        //Events.trigger(composite, 'afterRemove', { object: object });
        return composite;
    };
    Composite.addComposite = function(compositeA, compositeB) {
        compositeA.composites.push(compositeB);
        compositeB.parent = compositeA;
        Composite.setModified(compositeA, true, true, false);
        return compositeA;
    };
    Composite.removeComposite = function(compositeA, compositeB, deep) {
        var pos = Common.indexOf(compositeA.composites, compositeB);
        if (pos !== -1) {
            Composite.removeCompositeAt(compositeA, pos);
        }
        if (deep) {
            for (var i = 0; i < compositeA.composites.length; i++){
                Composite.removeComposite(compositeA.composites[i], compositeB, true);
            }
        }
        return compositeA;
    };
    Composite.removeCompositeAt = function(composite, pos) {
        composite.composites.splice(pos, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };
    Composite.addBody = function(composite, body) {
        composite.bodies.push(body);
        Composite.setModified(composite, true, true, false);
        return composite;
    };
    Composite.removeBody = function(composite, body, deep) {
        var pos = Common.indexOf(composite.bodies, body);
        if (pos !== -1) {
            Composite.removeBodyAt(composite, pos);
        }
        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeBody(composite.composites[i], body, true);
            }
        }
        return composite;
    };
    Composite.removeBodyAt = function(composite, pos) {
        composite.bodies.splice(pos, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };
    Composite.addConstraint = function(composite, constraint) {
        composite.constraints.push(constraint);
        Composite.setModified(composite, true, true, false);
        return composite;
    };
    Composite.removeConstraint = function(composite, constraint, deep) {
        var pos = Common.indexOf(composite.constraints, constraint);
        if (pos !== -1) {
            Composite.removeConstraintAt(composite, pos);
        }
        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeConstraint(composite.composites[i], constraint, true);
            }
        }
        return composite;
    };
    Composite.removeConstraintAt = function(composite, pos) {
        composite.constraints.splice(pos, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };
    Composite.clear = function(composite, keepStatic, deep) {
        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.clear(composite.composites[i], keepStatic, true);
            }
        }
        if (keepStatic) {
            composite.bodies = composite.bodies.filter(function(body) { return body.isStatic; });
        } else {
            composite.bodies.length = 0;
        }
        composite.constraints.length = 0;
        composite.composites.length = 0;
        Composite.setModified(composite, true, true, false);
        return composite;
    };
    Composite.allBodies = function(composite, cache) {
        if (!cache && composite.cache && composite.cache.allBodies) {
            return composite.cache.allBodies;
        }
        if (!cache && composite.cache) {
            if (!composite.cache.allBodies) {
                composite.cache.allBodies = Object.assign([], {size: 0});
            }
        } 
        const bodies = cache ?? composite.cache.allBodies;
        var i, idx = bodies.size, j;
        for (i = 0; i < composite.bodies.length; i++) {
            bodies[bodies.size++] = composite.bodies[i];
        }
        for (j = 0; j < composite.composites.length; j++) {
            Composite.allBodies(composite.composites[j], bodies);
        }
        return bodies;
    };
    Composite.allConstraints = function(composite) {
        if (composite.cache && composite.cache.allConstraints) {
            return composite.cache.allConstraints;
        }
        var constraints = [].concat(composite.constraints);
        for (var i = 0; i < composite.composites.length; i++)
            constraints = constraints.concat(Composite.allConstraints(composite.composites[i]));
        if (composite.cache) {
            composite.cache.allConstraints = constraints;
        }
        return constraints;
    };
    Composite.allComposites = function(composite) {
        if (composite.cache && composite.cache.allComposites) {
            return composite.cache.allComposites;
        }
        var composites = [].concat(composite.composites);
        for (var i = 0; i < composite.composites.length; i++)
            composites = composites.concat(Composite.allComposites(composite.composites[i]));
        if (composite.cache) {
            composite.cache.allComposites = composites;
        }
        return composites;
    };
   
    
    Composite.get = function(composite, id, type) {
        var objects,
            object;
        switch (type) {
        case Composite.types.body:
            objects = Composite.allBodies(composite);
            break;
        case Composite.types.constraint:
            objects = Composite.allConstraints(composite);
            break;
        case Composite.types.composite:
            objects = Composite.allComposites(composite).concat(composite);
            break;
        }
        if (!objects)
            return null;
        object = objects.filter(function(object) {
            return object.id.toString() === id.toString();
        });
        return object.length === 0 ? null : object[0];
    };
    Composite.move = function(compositeA, objects, compositeB) {
        Composite.remove(compositeA, objects);
        Composite.add(compositeB, objects);
        return compositeA;
    };
    Composite.rebase = function(composite) {
        var objects = Composite.allBodies(composite)
            .concat(Composite.allConstraints(composite))
            .concat(Composite.allComposites(composite));
        for (var i = 0; i < objects.length; i++) {
            objects[i].id = Common.nextId();
        }
        return composite;
    };
    Composite.translate = function(composite, translation, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;
        for (var i = 0; i < bodies.length; i++) {
            Body.translate(bodies[i], translation);
        }
        return composite;
    };
    Composite.rotate = function(composite, rotation, point, recursive) {
        var cos = Math.cos(rotation),
            sin = Math.sin(rotation),
            bodies = recursive ? Composite.allBodies(composite) : composite.bodies;
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.pos.x - point.x,
                dy = body.pos.y - point.y;
            Body.setPos(body, {
                x: point.x + (dx * cos - dy * sin),
                y: point.y + (dx * sin + dy * cos)
            });
            Body.rotate(body, rotation);
        }
        return composite;
    };
    Composite.scale = function(composite, scaleX, scaleY, point, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.pos.x - point.x,
                dy = body.pos.y - point.y;
            Body.setPos(body, {
                x: point.x + dx * scaleX,
                y: point.y + dy * scaleY
            });
            Body.scale(body, scaleX, scaleY);
        }
        return composite;
    };
    Composite.bounds = function(composite) {
        var bodies = Composite.allBodies(composite),
            vertices = [];
        for (var i = 0; i < bodies.length; i += 1) {
            var body = bodies[i];
            vertices.push(body.bounds.min, body.bounds.max);
        }
        return Bounds.create(vertices);
    };

})();