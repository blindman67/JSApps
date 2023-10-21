import {Vertices} from "../geometry/Vertices.js";
import {Vector, Vec2} from "../geometry/Vector.js";
import {Sleeping} from "../core/Sleeping.js";
import {Render} from "../render/Render.js";
import {Common} from "../core/Common.js";
import {Bounds} from "../geometry/Bounds.js";
import {Axes} from "../geometry/Axes.js";
const BodyShapes = {
    vertices: 1,
    circle: 2,
};

const {Body, SimBody} = (()=> {
    const wV1 = new Vec2();
    const wV2 = new Vec2();
    const wV3 = new Vec2();
    const wV4 = new Vec2();
    class SimBody {
        id;
        type = 'body';
        label = 'Body';
        shapeType = BodyShapes.vertices;
        parts;
        plugin;
        angle = 0;
        vertices;
        pos;
        force;
        torque = 0;
        posImpulse;
        constraintImpulse = { x: 0, y: 0, angle: 0 };
        totalContacts = 0;
        speed = 0;
        angularSpeed = 0;
        velocity;
        angularVelocity = 0;
        isSensor = false;
        isStatic = false;
        isSleeping = false;
        motion = 0;
        sleepThreshold = 60;
        density = 0.001;
        restitution = 0;
        friction = 0.1;
        frictionStatic = 0.5;
        frictionAir = 0.01;
        collisionFilter
        slop = 0.05;
        timeScale = 1;
        render;
        events;
        bounds;
        chamfer;
        circleRadius = 0;
        posPrev;
        anglePrev = 0;
        parent;
        axes;
        area = 0;
        mass = 0;
        inertia = 0;
        original;
        constructor(options = {}) {
            this.id = Common.nextId();
            if (options.parts) {
                this.parts    = options.parts;
                this.vertices = options.vertices;
            } else {
                this.parts = [this];
                this.vertices = options.vertices;
            }
            this.pos                = options.pos               ? new Vec2().setVec(options.pos)        : new Vec2();
            this.force              = options.force             ? new Vec2().setVec(options.force)      : new Vec2();
            this.posImpulse         = options.posImpulse        ? new Vec2().setVec(options.posImpulse) : new Vec2();
            this.velocity           = options.velocity          ? new Vec2().setVec(options.velocity)   : new Vec2();
            this.posPrev            = options.posPrev           ? new Vec2().setVec(options.posPrev)    : Vector.clone(this.pos);
            this.constraintImpulse  = { x: 0, y: 0, angle: 0 };
            this.type               = options.type              ?? this.type;
            this.shapeType          = options.shapeType         ?? this.shapeType;
            this.label              = options.label             ?? this.label;
            this.plugin             = options.plugin            ?? {};
            this.angle              = options.angle             ?? this.angle;
            this.torque             = options.torque            ?? this.torque;
            this.totalContacts      = options.totalContacts     ?? this.totalContacts;
            this.speed              = options.speed             ?? this.speed;
            this.angularSpeed       = options.angularSpeed      ?? this.angularSpeed;
            this.angularVelocity    = options.angularVelocity   ?? this.angularVelocity;
            this.isSensor           = options.isSensor          ?? this.isSensor;
            this.isStatic           = options.isStatic          ?? this.isStatic;
            this.isSleeping         = options.isSleeping        ?? this.isSleeping;
            this.motion             = options.motion            ?? this.motion;
            this.sleepThreshold     = options.sleepThreshold    ?? this.sleepThreshold;
            this.density            = options.density           ?? this.density;
            this.restitution        = options.restitution       ?? this.restitution;
            this.friction           = options.friction          ?? this.friction;
            this.frictionStatic     = options.frictionStatic    ?? this.frictionStatic;
            this.frictionAir        = options.frictionAir       ?? this.frictionAir;
            this.slop               = options.slop              ?? this.slop;
            this.timeScale          = options.timeScale         ?? this.timeScale;
            this.events             = options.events            ?? this.events;
            this.bounds             = options.bounds            ?? Bounds.create(this.vertices);;
            this.chamfer            = options.chamfer           ?? this.chamfer;
            this.circleRadius       = options.circleRadius      ?? this.circleRadius;
            this.anglePrev          = options.anglePrev         ?? this.angle;
            this.parent             = options.parent            ?? this;
            this.axes               = options.axes              ?? this.axes;
            this.area               = options.area              ?? this.area;
            this.mass               = options.mass              ?? this.mass;
            this.invMass            = 1 / this.mass;
            this.inertia            = options.inertia           ?? this.inertia;
            this.invInertia         = 1 / this.inertia; 
            this.original           = options.original          ?? this.original;
            this.render = {
                visible: true,
                opacity: 1,
                strokeStyle: this.isStatic ? '#555' : '#ccc',
                fillStyle: (this.isStatic ? '#14151f' : Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1'])),
                lineWidth: this.isStatic && this.render?.fillStyle === undefined ? 1 : 0,
                ...(options.render ?? {}),
                sprite: {
                    xScale: 1,
                    yScale: 1,
                    xOffset: -(this.bounds.min.x - this.pos.x) / (this.bounds.max.x - this.bounds.min.x),
                    yOffset: -(this.bounds.min.y - this.pos.y) / (this.bounds.max.y - this.bounds.min.y),
                    ...(options.render?.sprite ?? {}),
                },
            };
            this.collisionFilter = {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0,
                ...(options.collisionFilter ?? {}),
            };
            if (this.vertices) {
                this.setVertices(this.vertices);
                this.setParts(this.parts);
            } else {
                this.setParts(this.parts, true);
            }
            this.setStatic(this.isStatic);
            Sleeping.set(this, this.isSleeping);
            this.vertices.rotate(this.angle, this.pos);
            Axes.rotate(this.axes, this.angle);
            Bounds.update(this.bounds, this.vertices, this.velocity);
            this.setMass(this.mass);
            this.setInertia(this.inertia);
        }
        setStatic(isStatic) {
            for (var i = 0; i < this.parts.length; i++) {
                var part = this.parts[i];
                part.isStatic = isStatic;
                if (isStatic) {
                    part._original = {
                        restitution: part.restitution,
                        friction: part.friction,
                        mass: part.mass,
                        inertia: part.inertia,
                        density: part.density,
                        invMass: part.invMass,
                        invInertia: part.invInertia
                    };
                    part.restitution = 0;
                    part.friction = 1;
                    part.mass = part.inertia = part.density = Infinity;
                    part.invMass = part.invInertia = 0;
                    part.posPrev.x = part.pos.x;
                    part.posPrev.y = part.pos.y;
                    part.anglePrev = part.angle;
                    part.angularVelocity = 0;
                    part.speed = 0;
                    part.angularSpeed = 0;
                    part.motion = 0;
                } else if (part._original) {
                    part.restitution = part._original.restitution;
                    part.friction = part._original.friction;
                    part.mass = part._original.mass;
                    part.inertia = part._original.inertia;
                    part.density = part._original.density;
                    part.invMass = part._original.invMass;
                    part.invInertia = part._original.invInertia;
                    part._original = null;
                }
            }
        }
        setMass(mass) {
            if (this.mass === 0) { 
                this.mass = mass; 
            }
            if (this.mass !== Infinity) {
                var moment = this.inertia / (this.mass / 6);
                this.inertia = moment * (mass / 6);
                this.invInertia = 1 / this.inertia;
                this.mass = mass;
                this.invMass = 1 / this.mass;
                this.density = this.mass / this.area;
            }
        }
        setDensity(density) {
            this.setMass(density * this.area);
            this.density = density;
        }
        setInertia(inertia) {
            this.inertia = inertia;
            this.invInertia = 1 / this.inertia;
        }
        setVertices(vertices) {
            if (vertices[0].body === this) {
                this.vertices = vertices;
            } else {
                this.vertices = Vertices.create(vertices, this);
            }
            const verts = this.vertices;
            this.axes = Axes.fromVertices(verts);
            this.area = verts.area();
            this.setMass(this.density * this.area);
            var center = verts.center(wV1);
            verts.translate(center, -1);
            this.setInertia(Body.inertiaScale * verts.inertia(this.mass));
            verts.translate(this.pos);
            Bounds.update(this.bounds, verts, this.velocity);
        }
        setParts(parts, autoHull) {
            var i;
            if (parts.length === 1) {
                
                
            } else {
                parts = parts.slice(0);
                this.parts.length = 0;
                this.parts[0] = this;
                this.parts[0].parent = this;
                for (i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    if (part !== this) {
                        part.parent = this;
                        this.parts.push(part);
                    }
                }
                if (this.parts.length === 1) { return; }
                autoHull = autoHull !== undefined ? autoHull : true;
                if (autoHull) {
                    
                    var vertices = [];
                    for (i = 1; i < parts.length; i++) {
                        vertices.push(...parts[i].vertices.map(v => new Vec2(v.x, v.y)));
                    }
                    const verts = Vertices.fromVectors(vertices);
                    Vertices.clockwiseSort(verts);
                    var hull = Vertices.hull(verts), hullCentre = Vertices.center(hull);
                    this.setVertices(hull);
                    Vertices.translate(hull,hullCentre);
                }
            }
            var total = Body.totalProperties(this);
            this.area = total.area;
            this.parent = this;
            this.pos.x = total.center.x;
            this.pos.y = total.center.y;
            this.posPrev.x = total.center.x;
            this.posPrev.y = total.center.y;
            this.setMass(total.mass);
            this.setInertia(total.inertia);
            this.setPos(total.center);
        }
        setCentre(center, relative) {
            if (!relative) {
                this.posPrev.x = center.x - (this.pos.x - this.posPrev.x);
                this.posPrev.y = center.y - (this.pos.y - this.posPrev.y);
                this.pos.x = center.x;
                this.pos.y = center.y;
            } else {
                this.posPrev.x += center.x;
                this.posPrev.y += center.y;
                this.pos.x += center.x;
                this.pos.y += center.y;
            }
        }
        setPos(pos) {
            var delta = pos.sub(this.pos);
            this.posPrev.x += delta.x;
            this.posPrev.y += delta.y;
            for (var i = 0; i < this.parts.length; i++) {
                var part = this.parts[i];
                part.pos.x += delta.x;
                part.pos.y += delta.y;
                part.vertices.translate(delta);
                Bounds.update(part.bounds, part.vertices, this.velocity);
            }
        }
        setAngle(angle) {
            var delta = angle - this.angle;
            this.anglePrev += delta;
            for (var i = 0; i < this.parts.length; i++) {
                var part = this.parts[i];
                part.angle += delta;
                Vertices.rotate(part.vertices, delta, this.pos);
                Axes.rotate(part.axes, delta);
                Bounds.update(part.bounds, part.vertices, this.velocity);
                if (i > 0) {
                    Vector.rotateAbout(part.pos, delta, this.pos, part.pos);
                }
            }
        }
        setVelocity(velocity) {
            this.posPrev.x = this.pos.x - velocity.x;
            this.posPrev.y = this.pos.y - velocity.y;
            this.velocity.x = velocity.x;
            this.velocity.y = velocity.y;
            this.speed = Vector.magnitude(this.velocity);
        }
        setAngularVelocity(velocity) {
            this.anglePrev = this.angle - velocity;
            this.angularVelocity = velocity;
            this.angularSpeed = Math.abs(this.angularVelocity);
        }
        translate(translation) {
            this.setPos(wV1.setVec(this.pos).add(translation));
        }
        rotate(rotation, point) {
            if (!point) {
                this.setAngle(this.angle + rotation);
            } else {
                const xAx = Math.cos(rotation);
                const xAy = Math.sin(rotation);
                const dx = this.pos.x - point.x;
                const dy = this.pos.y - point.y;
                this.setPos(wV1.set(point.x + (dx * xAx - dy * xAy), point.y + (dx * xAy + dy * xAx)));
                this.setAngle(this.angle + rotation);
            }
        }
        scale(scaleX, scaleY, point) {
            var totalArea = 0, totalInertia = 0, i;
            point = wV1.setVec(point ?? this.pos);
            for (i = 0; i < this.parts.length; i++) {
                const part = this.parts[i];
                part.vertices.scale(scaleX, scaleY, point);
                part.axes = Axes.fromVertices(part.vertices);
                part.area = part.vertices.area();
                part.setMass(this.density * part.area);
                wV2.set(-part.pos.x, -part.pos.y);
                //part.vertices.translate({x: -part.pos.x, y: -part.pos.y});
                part.setInertia(Body.inertiaScale * part.vertices.inertia(part.mass, wV2));
                //part.vertices.translate({x: part.pos.x, y: part.pos.y});
                if (i > 0) {
                    totalArea += part.area;
                    totalInertia += part.inertia;
                }
                part.pos.x = point.x + (part.pos.x - point.x) * scaleX;
                part.pos.y = point.y + (part.pos.y - point.y) * scaleY;
                Bounds.update(part.bounds, part.vertices, this.velocity);
            }
            if (this.parts.length > 1) {
                this.area = totalArea;
                if (!this.isStatic) {
                    this.setMass(this.density * totalArea);
                    this.setInertia(totalInertia);
                }
            }
            if (this.circleRadius) {
                if (scaleX === scaleY) {
                    this.circleRadius *= scaleX;
                } else {
                    this.circleRadius = null;
                }
            }
        }        
        #initProperties(options) { throw new Error("Dont call SimBody.#initProperties"); }
        applyForce(pos, force) {
            this.force.x += force.x;
            this.force.y += force.y;
            this.torque += (pos.x - this.pos.x) * force.y - (pos.y - this.pos.y) * force.x;
        }
        update(deltaTime, timeScale, correction) {
            var i;
            const dTimeSqu = Math.pow(deltaTime * timeScale * this.timeScale, 2);
            const dTimeSquMass = this.invMass * dTimeSqu;
            const fAir = (1 - this.frictionAir * timeScale * this.timeScale) * correction;
            const velPrevX = this.pos.x - this.posPrev.x;
            const velPrevY = this.pos.y - this.posPrev.y;
            this.velocity.x = velPrevX * fAir + this.force.x * dTimeSquMass;
            this.velocity.y = velPrevY * fAir + this.force.y * dTimeSquMass;
            this.posPrev.x = this.pos.x;
            this.posPrev.y = this.pos.y;
            this.pos.x += this.velocity.x;
            this.pos.y += this.velocity.y;
            this.angularVelocity = (this.angle - this.anglePrev) * fAir + this.torque * this.invInertia * dTimeSqu;
            this.anglePrev = this.angle;
            this.angle += this.angularVelocity;
            this.speed = this.velocity.magnitude();
            this.angularSpeed = Math.abs(this.angularVelocity);
            for (i = 0; i < this.parts.length; i++) {
                const part = this.parts[i];
                if (this.angularVelocity !== 0) {

                    if (i > 0) {
                        part.pos.x += this.velocity.x;
                        part.pos.y += this.velocity.y;
                    }
                    part.vertices.translateRotate(this.velocity, this.angularVelocity, this.pos);
                    Axes.rotate(part.axes, this.angularVelocity);
                    if (i > 0) {  part.pos.rotateAboutVec(this.angularVelocity, this.pos, part.pos); }
                } else {
                    part.vertices.translate(this.velocity);
                    if (i > 0) {
                        part.pos.x += this.velocity.x;
                        part.pos.y += this.velocity.y;
                    }                
                    
                }
                Bounds.update(part.bounds, part.vertices, this.velocity);
            }
        }    
    };    
    class Body {
        static inertiaScale = 4;
        static nextCollidingGroupId = 1;
        static nextNonCollidingGroupId = -1;
        static nextCategory = 0x0001;
        static create(options) { return new SimBody(options); }
        static nextGroup(isNonColliding) {
            if (isNonColliding) { return this.nextNonCollidingGroupId--; }
            return this.nextCollidingGroupId++;
        }
        static nextCategory() {
            this.nextCategory = this.nextCategory << 1;
            return this.nextCategory;
        }
 /*       initProperties(body, options) {
            options = options || {};
            this.set(body, {
                bounds: body.bounds || Bounds.create(body.vertices),
                posPrev: body.posPrev || Vector.clone(body.pos),
                anglePrev: body.anglePrev || body.angle,
                vertices: body.vertices,
                parts: body.parts || [body],
                isStatic: body.isStatic,
                isSleeping: body.isSleeping,
                parent: body.parent || body
            });
            Vertices.rotate(body.vertices, body.angle, body.pos);
            Axes.rotate(body.axes, body.angle);
            Bounds.update(body.bounds, body.vertices, body.velocity);
            this.set(body, {
                axes: options.axes || body.axes,
                area: options.area || body.area,
                mass: options.mass || body.mass,
                inertia: options.inertia || body.inertia
            });
            const defaultFillStyle = (body.isStatic ? '#14151f' : Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1']));
            const defaultStrokeStyle = body.isStatic ? '#555' : '#ccc';
            const defaultLineWidth = body.isStatic && body.render.fillStyle === null ? 1 : 0;
            body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
            body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
            body.render.lineWidth = body.render.lineWidth || defaultLineWidth;
            body.render.sprite.xOffset += -(body.bounds.min.x - body.pos.x) / (body.bounds.max.x - body.bounds.min.x);
            body.render.sprite.yOffset += -(body.bounds.min.y - body.pos.y) / (body.bounds.max.y - body.bounds.min.y);
        }*/
        static set(body, settings, value) {
            var property;
            if (typeof settings === 'string') {
                property = settings;
                settings = {};
                settings[property] = value;
            }
            for (property in settings) {
                if (!Object.prototype.hasOwnProperty.call(settings, property))
                    continue;
                value = settings[property];
                switch (property) {
                case 'isStatic':
                    this.setStatic(body, value);
                    break;
                case 'isSleeping':
                    Sleeping.set(body, value);
                    break;
                case 'mass':
                    this.setMass(body, value);
                    break;
                case 'density':
                    this.setDensity(body, value);
                    break;
                case 'inertia':
                    this.setInertia(body, value);
                    break;
                case 'vertices':
                    this.setVertices(body, value);
                    break;
                case 'position':
                    this.setPos(body, value);
                    break;
                case 'angle':
                    this.setAngle(body, value);
                    break;
                case 'velocity':
                    this.setVelocity(body, value);
                    break;
                case 'angularVelocity':
                    this.setAngularVelocity(body, value);
                    break;
                case 'parts':
                    this.setParts(body, value);
                    break;
                case 'center':
                    this.setCentre(body, value);
                    break;
                default:
                    body[property] = value;
                }
            }
        }
 /*       setStatic(body, isStatic) {
            for (var i = 0; i < body.parts.length; i++) {
                var part = body.parts[i];
                part.isStatic = isStatic;
                if (isStatic) {
                    part._original = {
                        restitution: part.restitution,
                        friction: part.friction,
                        mass: part.mass,
                        density: part.density,
                        invMass: part.invMass,
                        inertia: part.inertia,
                        invInertia: part.invInertia
                    };
                    part.restitution = 0;
                    part.friction = 1;
                    part.mass = part.inertia = part.density = Infinity;
                    part.invMass = part.invInertia = 0;
                    part.posPrev.x = part.pos.x;
                    part.posPrev.y = part.pos.y;
                    part.anglePrev = part.angle;
                    part.angularVelocity = 0;
                    part.speed = 0;
                    part.angularSpeed = 0;
                    part.motion = 0;
                } else if (part._original) {
                    part.restitution = part._original.restitution;
                    part.friction = part._original.friction;
                    part.mass = part._original.mass;
                    part.inertia = part._original.inertia;
                    part.density = part._original.density;
                    part.invMass = part._original.invMass;
                    part.invInertia = part._original.invInertia;
                    part._original = null;
                }
            }
        }*/
 /*       setMass(body, mass) {
            var moment = body.inertia / (body.mass / 6);
            body.inertia = moment * (mass / 6);
            body.invInertia = 1 / body.inertia;
            body.mass = mass;
            body.invMass = 1 / body.mass;
            body.density = body.mass / body.area;
        }*/
 /*       setDensity(body, density) {
            this.setMass(body, density * body.area);
            body.density = density;
        }*/
 /*       setInertia(body, inertia) {
            body.inertia = inertia;
            body.invInertia = 1 / body.inertia;
        }*/
 /*       setVertices(body, vertices) {
            if (vertices[0].body === body) {
                body.vertices = vertices;
            } else {
                body.vertices = Vertices.create(vertices, body);
            }
            body.axes = Axes.fromVertices(body.vertices);
            body.area = Vertices.area(body.vertices);
            this.setMass(body, body.density * body.area);
            var center = Vertices.center(body.vertices);
            Vertices.translate(body.vertices, center, -1);
            this.setInertia(body, this.inertiaScale * Vertices.inertia(body.vertices, body.mass));
            Vertices.translate(body.vertices, body.pos);
            Bounds.update(body.bounds, body.vertices, body.velocity);
        }*/
/*        setParts(body, parts, autoHull) {
            var i;
            parts = parts.slice(0);
            body.parts.length = 0;
            body.parts.push(body);
            body.parent = body;
            for (i = 0; i < parts.length; i++) {
                var part = parts[i];
                if (part !== body) {
                    part.parent = body;
                    body.parts.push(part);
                }
            }
            if (body.parts.length === 1) { return; }
            autoHull = autoHull !== undefined ? autoHull : true;
            if (autoHull) {
                var vertices = [];
                for (i = 0; i < parts.length; i++) {
                    vertices = vertices.concat(parts[i].vertices);
                }
                Vertices.clockwiseSort(vertices);
                var hull = Vertices.hull(vertices),
                    hullCentre = Vertices.center(hull);
                this.setVertices(body, hull);
                Vertices.translate(body.vertices, hullCentre);
            }
            var total = this.totalProperties(body);
            body.area = total.area;
            body.parent = body;
            body.pos.x = total.center.x;
            body.pos.y = total.center.y;
            body.posPrev.x = total.center.x;
            body.posPrev.y = total.center.y;
            this.setMass(body, total.mass);
            this.setInertia(body, total.inertia);
            this.setPos(body, total.center);
        }*/
  /*      setCentre(body, center, relative) {
            if (!relative) {
                body.posPrev.x = center.x - (body.pos.x - body.posPrev.x);
                body.posPrev.y = center.y - (body.pos.y - body.posPrev.y);
                body.pos.x = center.x;
                body.pos.y = center.y;
            } else {
                body.posPrev.x += center.x;
                body.posPrev.y += center.y;
                body.pos.x += center.x;
                body.pos.y += center.y;
            }
        }*/
  /*      setPos(body, pos) {
            var delta = Vector.sub(pos, body.pos);
            body.posPrev.x += delta.x;
            body.posPrev.y += delta.y;
            for (var i = 0; i < body.parts.length; i++) {
                var part = body.parts[i];
                part.pos.x += delta.x;
                part.pos.y += delta.y;
                Vertices.translate(part.vertices, delta);
                Bounds.update(part.bounds, part.vertices, body.velocity);
            }
        }*/
  /*      setAngle(body, angle) {
            var delta = angle - body.angle;
            body.anglePrev += delta;
            for (var i = 0; i < body.parts.length; i++) {
                var part = body.parts[i];
                part.angle += delta;
                Vertices.rotate(part.vertices, delta, body.pos);
                Axes.rotate(part.axes, delta);
                Bounds.update(part.bounds, part.vertices, body.velocity);
                if (i > 0) {
                    Vector.rotateAbout(part.pos, delta, body.pos, part.pos);
                }
            }
        }*/
 /*       setVelocity(body, velocity) {
            body.posPrev.x = body.pos.x - velocity.x;
            body.posPrev.y = body.pos.y - velocity.y;
            body.velocity.x = velocity.x;
            body.velocity.y = velocity.y;
            body.speed = Vector.magnitude(body.velocity);
        }*/
  /*      setAngularVelocity(body, velocity) {
            body.anglePrev = body.angle - velocity;
            body.angularVelocity = velocity;
            body.angularSpeed = Math.abs(body.angularVelocity);
        }*/
  /*      translate(body, translation) {
            this.setPos(body, Vector.add(body.pos, translation));
        }*/
  /*      rotate(body, rotation, point) {
            if (!point) {
                this.setAngle(body, body.angle + rotation);
            } else {
                var cos = Math.cos(rotation),
                    sin = Math.sin(rotation),
                    dx = body.pos.x - point.x,
                    dy = body.pos.y - point.y;
                this.setPos(body, {
                    x: point.x + (dx * cos - dy * sin),
                    y: point.y + (dx * sin + dy * cos)
                });
                this.setAngle(body, body.angle + rotation);
            }
        }*/
 /*       scale(body, scaleX, scaleY, point) {
            var totalArea = 0,
                totalInertia = 0;
            point = point || body.pos;
            for (var i = 0; i < body.parts.length; i++) {
                var part = body.parts[i];
                Vertices.scale(part.vertices, scaleX, scaleY, point);
                part.axes = Axes.fromVertices(part.vertices);
                part.area = Vertices.area(part.vertices);
                this.setMass(part, body.density * part.area);
                Vertices.translate(part.vertices, { x: -part.pos.x, y: -part.pos.y });
                this.setInertia(part, this.inertiaScale * Vertices.inertia(part.vertices, part.mass));
                Vertices.translate(part.vertices, { x: part.pos.x, y: part.pos.y });
                if (i > 0) {
                    totalArea += part.area;
                    totalInertia += part.inertia;
                }
                part.pos.x = point.x + (part.pos.x - point.x) * scaleX;
                part.pos.y = point.y + (part.pos.y - point.y) * scaleY;
                Bounds.update(part.bounds, part.vertices, body.velocity);
            }
            if (body.parts.length > 1) {
                body.area = totalArea;
                if (!body.isStatic) {
                    this.setMass(body, body.density * totalArea);
                    this.setInertia(body, totalInertia);
                }
            }
            if (body.circleRadius) {
                if (scaleX === scaleY) {
                    body.circleRadius *= scaleX;
                } else {
                    body.circleRadius = null;
                }
            }
        }*/
        /*update(body, deltaTime, timeScale, correction) {
            var deltaTimeSquared = Math.pow(deltaTime * timeScale * body.timeScale, 2);
            var frictionAir = 1 - body.frictionAir * timeScale * body.timeScale;
            var velocityPrevX = body.pos.x - body.posPrev.x;
            var velocityPrevY = body.pos.y - body.posPrev.y;
            body.velocity.x = (velocityPrevX * frictionAir * correction) + (body.force.x / body.mass) * deltaTimeSquared;
            body.velocity.y = (velocityPrevY * frictionAir * correction) + (body.force.y / body.mass) * deltaTimeSquared;
            body.posPrev.x = body.pos.x;
            body.posPrev.y = body.pos.y;
            body.pos.x += body.velocity.x;
            body.pos.y += body.velocity.y;
            body.angularVelocity = ((body.angle - body.anglePrev) * frictionAir * correction) + (body.torque / body.inertia) * deltaTimeSquared;
            body.anglePrev = body.angle;
            body.angle += body.angularVelocity;
            body.speed = Vector.magnitude(body.velocity);
            body.angularSpeed = Math.abs(body.angularVelocity);
            for (var i = 0; i < body.parts.length; i++) {
                var part = body.parts[i];
                Vertices.translate(part.vertices, body.velocity);
                if (i > 0) {
                    part.pos.x += body.velocity.x;
                    part.pos.y += body.velocity.y;
                }
                if (body.angularVelocity !== 0) {
                    Vertices.rotate(part.vertices, body.angularVelocity, body.pos);
                    Axes.rotate(part.axes, body.angularVelocity);
                    if (i > 0) {
                        Vector.rotateAbout(part.pos, body.angularVelocity, body.pos, part.pos);
                    }
                }
                Bounds.update(part.bounds, part.vertices, body.velocity);
            }
        }*/
        /*applyForce(body, pos, force) {
            body.force.x += force.x;
            body.force.y += force.y;
            body.torque += (pos.x - body.pos.x) * force.y - (pos.y - body.pos.y) * force.x;
        }*/
        static totalProperties(body) {
            var properties = {
                mass: 0,
                area: 0,
                inertia: 0,
                inertiaInv: 0,
                center: new Vec2()
            };
            for (var i = body.parts.length === 1 ? 0 : 1; i < body.parts.length; i++) {
                var part = body.parts[i],
                    mass = part.mass !== Infinity ? part.mass : 1;
                properties.mass += mass;
                properties.area += part.area;
                properties.inertia += part.inertia;
                properties.inertiaInv = 1 / properties.inertia;
                properties.center.add(part.pos.mult(mass));
            }
            properties.center.div(properties.mass);
            return properties;
        }
    };
    
    return {Body, SimBody};
})();
export {Body, BodyShapes};