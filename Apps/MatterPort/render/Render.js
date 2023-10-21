
import {Common} from "../core/Common.js";
import {Composite} from "../body/Composite.js";
import {Bounds} from "../geometry/Bounds.js";
import {Events} from "../core/Events.js";
import {Vector} from "../geometry/Vector.js";
import {Mouse} from "../core/Mouse.js";
import {View} from "../render/View.js";
import {PointConstraint} from "../constraint/PointConstraint.js";
import {Selection} from "../core/Selection.jsm";
import {BodyShapes} from "../body/Body.js";

const GOOD_FPS = 30;
const GOOD_RENDER = 1000 / 120;
const GOOD_DELTA = 1000 / 60;
const HISTORY_SIZE = 60;
const HISTORY_NEG_SIZE = HISTORY_SIZE - 1;
const HISTORY_INV_SIZE = 1 / HISTORY_SIZE;
class TimeHistory {
    #owner = null;
    #history;
    #sum = 0;
    #delta = 0;
    #mean = 0;
    #meanInv = 0;
    #lastTime;
    against = 1;
    constructor(owner, against) {
        this.#owner = owner;
        this.#history = new Array(HISTORY_SIZE);
        this.#history.fill(0);
        this.against = 1 / against;
    }
    set time(t) {
        if (!this.#lastTime) { this.#lastTime = t; }
        this.delta = t - this.#lastTime;
        this.#lastTime = t;
    }       
    set delta(t) {
        const o = this.#owner;
        this.#delta = t;
        this.#sum -= this.#history[o.idx] - t; 
        this.#history[o.idx] = t;
        this.#meanInv = 1 / (this.#mean = this.#sum * HISTORY_INV_SIZE);
    }
    get delta() { return this.#delta }
    get mean() { return this.#mean }
    get meanNormalize() { return this.#mean * this.against }
    sample(i) { return this.#history[(i + this.#owner.idx) % HISTORY_SIZE] * this.#meanInv; }
};



const Render = (() => {
    const HISTORY_SIZE = 60;
    function createBuffer(size, val = 0) {
        const buf = new Array(size);
        buf.fill(val);
        return buf;
    }
    var goodFps = 30;
    var goodDelta = 1000 / 60;
    function mean(values) {
        var result = 0;
        for (const val of values) { result += val; }
        return (result / values.length) || 0;
    }
    function createCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function() { return false; };
        canvas.onselectstart = function() { return false; };
        return canvas;
    }
    function getPixelRatio(canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                                      || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                                      || context.backingStorePixelRatio || 1;
        return devicePixelRatio / backingStorePixelRatio;
    }
    function getTexture(render, imagePath) {
        var image = render.textures[imagePath];
        if (!image) {
            image = render.textures[imagePath] = new Image();
            image.src = imagePath;
        }
        return image;
    }
    function applyBackground(render, background) {
        var cssBackground = background;
        if (/(jpg|gif|png)$/.test(background))
            cssBackground = 'url(' + background + ')';
        render.canvas.style.background = cssBackground;
        render.canvas.style.backgroundSize = "contain";
        render.currentBackground = background;
    }    
    function updateTiming(render, time) {
        var engine = render.engine, timing = render.timing, historySize = timing.historySize, timestamp = engine.timing.timestamp;
        const idx = timing.idx;
        timing.deltaTime = time - timing.lastTime || goodDelta;
        timing.lastTime = time;
        timing.timestampElapsed = timestamp - timing.lastTimestamp || 0;
        timing.lastTimestamp = timestamp;
        
       /* timing.renderSum -= timing.renderHistory[idx] - timing.renderTime;
        timing.renderHistory[idx] = timing.renderTime;
        
        timing.deltaSum -= timing.deltaHistory[idx] - timing.deltaTime;
        timing.deltaHistory[idx] = timing.deltaTime;
        
        timing.idx = (idx + 1) % timing.historySize;*/
    }   
    class Render {
        create(setup, options) {
            const timing = {
                historySize: HISTORY_SIZE,
                historySizeInv: 1 / HISTORY_SIZE,
                idx: 0,
                lastTime: 0,
                lastTimestamp: 0,
            };
            const render = {
                engine: null,
                element: null,
                canvas: null,
                mouse: null,
                frameRequestId: null,
                runner: null,
                pause: false,
                timing: Object.assign(timing, {
                    sim: new TimeHistory(timing, 16),
                    render: new TimeHistory(timing, GOOD_RENDER),
                    delta: new TimeHistory(timing, GOOD_DELTA),
                }),                              
                options: {
                    width: 800,
                    height: 600,
                    fullpage: true,
                    pixelRatio: 1,
                    background: '#14151f',
                    wireframeBackground: '#14151f',
                    hasBounds: setup.bounds !== undefined,
                    enabled: true,
                    wireframes: true,
                    showSleeping: true,
                    showPerformance: false,
                    showBounds: false,
                    showVelocity: false,
                    showCollisions: false,
                    showSeparations: false,
                    showAxes: false,
                    showPositions: false,
                    showAngleIndicator: false,
                    showIds: false,
                    showVertexNumbers: false,
                    showConvexHulls: false,
                    showInternalEdges: false,
                    showMousePosition: false,
                    ...options,
                },
                ...setup,
            };
            if (render.canvas) {
                if (render.options.fullpage) {
                    render.options.width = innerWidth;
                    render.options.height = innerHeight;
                } 
                render.canvas.width = render.options.width ?? render.canvas.width;
                render.canvas.height = render.options.height ?? render.canvas.height;
            } else {
                if (render.options.fullpage) {
                    render.options.width = innerWidth;
                    render.options.height = innerHeight;
                } 
          
            }
            render.canvas = render.canvas ?? createCanvas(render.options.width, render.options.height);
            View.context = render.context = render.canvas.getContext('2d');
            Events.for(render);
            render.events.register("beforeRender");
            render.events.register("afterRender");
            render.view = View;

            render.textures = {};
            render.bounds = View.getBounds(new Bounds());
            render.pointConstraint = new PointConstraint(render);

            render.selection = new Selection(0);
            
            render.controller = Render;
            render.options.showBroadphase = false;
            if (render.options.pixelRatio !== 1) { this.setPixelRatio(render, render.options.pixelRatio); }
            if (Common.isElement(render.element)) { render.element.appendChild(render.canvas); }
            return render;
        }
        resize(render, width, height) {
            render.options.width = width;
            render.options.height = height;   
            this.setPixelRatio(render, render.options.pixelRatio);    
            this.lookAt(render);
            
        }
        run(render) {
            var now;
            const loop = time => {
                render.frameRequestId = requestAnimationFrame(loop);
                
                if (render.options.fullpage) {
                    if (render.canvas.width !== innerWidth || render.canvas.height !== innerHeight) {
                        this.resize(render, innerWidth, innerHeight);
                    }
                }
                //if (render.options.showPerformance) {
                now = performance.now();
                if (render.mouse) {
                    const m = render.mouse;
                    m.update();
                    if (m.button & 2) {
                        View.pan(m.elementDelta);
                    }
                    if (m.wheel.y) {
                        const h = m.wheel.y * 0.5;
                        var done = false;
                        while (!done) {
                            if (m.wheel.y > 0) {
                                m.wheel.y *= 0.9;
                                View.scaleAt(m.elementPos, 1 / 1.01);
                                if (m.wheel.y < 0.1) { m.wheel.y = 0; done = true; }
                                else if (m.wheel.y < h) { done = true; }
                            } else if (m.wheel.y < 0) {
                                m.wheel.y *= 0.9;
                                View.scaleAt(m.elementPos, 1.01);
                                if (m.wheel.y > -0.1) { m.wheel.y = 0; done = true; }
                                else if (m.wheel.y > h) { done = true; }
                            }
                        }
                    }
                    const pC = render.pointConstraint;
                    const s = render.selection;
                    pC.pointA.setVec(m.worldPos);
                    if (m.button & 4) {
                        pC.update();
                        pC.objectUnder();
                        if (pC.focusedObject) {
                            if (s.has(pC.focusedObject)) {
                                s.remove(pC.focusedObject);
                            } else {
                                s.add(pC.focusedObject);
                            }
                            m.button &= 0b011;    
                        } else {
                            s.clear();
                            m.button &= 0b011;
                        }
                    }
                        

                    if (m.button & 1) {
                        if(pC.active) {
                            pC.apply();
                        } else {
                            
                            pC.update();
                            pC.objectUnder();
                            const o = pC.focusedObject;
                            if (o && s.has(o)) {
                                pC.activate();
                            } else if (o) {
                                s.clear();
                                s.add(o);
                                m.button &= 0b110;
                            } else {
                                s.clear();
                                m.button &= 0b110;
                            }
                        }
                        
                    } else {
                        

                    }
                }
                    
                //var i = 10;
                
                if(!render.pause && render.runner) {
                   // while (i--) {
                        render.Matter.Runner.tick(render.runner, render.engine, time);
                    //}
                }
                if (render.mouse) {
                    if ((render.mouse.button & 1) !== 1) {
                        render.pointConstraint.deactivate();
                    }
                }
                render.timing.sim.delta = performance.now() - now;
                
                now = performance.now();
                this.world(render, time);
                render.timing.render.delta = performance.now() - now;
                
                render.timing.delta.time = time;
                if (render.options.showPerformance) {
                    this.performance(render, render.context, time);
                }
                /*} else {
                    render.runner && render.Matter.Runner.tick(render.runner, render.engine, time);
                    this.world(render, time);
                }*/
            };
            loop(performance.now());
        }
        stop(render) {
            cancelAnimationFrame(render.frameRequestId);
        }
        setPixelRatio(render, pixelRatio) {
            var options = render.options, canvas = render.canvas;
            if (pixelRatio === 'auto') {  pixelRatio = getPixelRatio(canvas);  }
            options.pixelRatio = pixelRatio;
            canvas.setAttribute('data-pixel-ratio', pixelRatio);
            canvas.width = options.width * pixelRatio;
            canvas.height = options.height * pixelRatio;
            canvas.style.width = options.width + 'px';
            canvas.style.height = options.height + 'px';
            render.bounds.min.x = 0;
            render.bounds.min.y = 0;
            render.bounds.max.x = canvas.width;
            render.bounds.max.y = canvas.height;
        }
        updateView(render) {
            View.apply();
            render.context._iv = View.invScale;
        }
        lookAt(render) {
            var i = 0;
            

            const bodies = Composite.allBodies(render.engine.world);
            render.bounds.irate();
            for (i = 0; i < bodies.length; i++) {
                render.bounds.addBounds(bodies[i].bounds);
            }
            View.fitBounds(render.bounds);    
                
            this.updateView(render);
            return;
            
            
            center = center !== undefined ? center : true;
            objects = Common.isArray(objects) ? objects : [objects];
            padding = padding || {
                x: 0,
                y: 0
            };
            var bounds = {
                min: { x: Infinity, y: Infinity },
                max: { x: -Infinity, y: -Infinity }
            };
            for (var i = 0; i < objects.length; i += 1) {
                var object = objects[i],
                    min = object.bounds ? object.bounds.min : (object.min || object.pos || object),
                    max = object.bounds ? object.bounds.max : (object.max || object.pos || object);
                if (min && max) {
                    if (min.x < bounds.min.x)
                        bounds.min.x = min.x;
                    if (max.x > bounds.max.x)
                        bounds.max.x = max.x;
                    if (min.y < bounds.min.y)
                        bounds.min.y = min.y;
                    if (max.y > bounds.max.y)
                        bounds.max.y = max.y;
                }
            }
            var width = (bounds.max.x - bounds.min.x) + 2 * padding.x,
                height = (bounds.max.y - bounds.min.y) + 2 * padding.y,
                viewHeight = render.canvas.height,
                viewWidth = render.canvas.width,
                outerRatio = viewWidth / viewHeight,
                innerRatio = width / height,
                scaleX = 1,
                scaleY = 1;
            if (innerRatio > outerRatio) {
                scaleY = innerRatio / outerRatio;
            } else {
                scaleX = outerRatio / innerRatio;
            }
            render.options.hasBounds = true;
            render.bounds.min.x = bounds.min.x;
            render.bounds.max.x = bounds.min.x + width * scaleX;
            render.bounds.min.y = bounds.min.y;
            render.bounds.max.y = bounds.min.y + height * scaleY;
            if (center) {
                render.bounds.min.x += width * 0.5 - (width * scaleX) * 0.5;
                render.bounds.max.x += width * 0.5 - (width * scaleX) * 0.5;
                render.bounds.min.y += height * 0.5 - (height * scaleY) * 0.5;
                render.bounds.max.y += height * 0.5 - (height * scaleY) * 0.5;
            }
            render.bounds.min.x -= padding.x;
            render.bounds.max.x -= padding.x;
            render.bounds.min.y -= padding.y;
            render.bounds.max.y -= padding.y;
            if (render.mouse) {
                Mouse.setScale(render.mouse, {
                    x: (render.bounds.max.x - render.bounds.min.x) / render.canvas.width,
                    y: (render.bounds.max.y - render.bounds.min.y) / render.canvas.height
                });
                Mouse.setOffset(render.mouse, render.bounds.min);
            }
        }

        world(render, time) {
            var startTime = Common.now(),
                engine = render.engine,
                world = engine.world,
                canvas = render.canvas,
                context = render.context,
                options = render.options,
                timing = render.timing;
            var allBodies = Composite.allBodies(world),
                allConstraints = Composite.allConstraints(world),
                background = options.wireframes ? options.wireframeBackground : options.background,
                bodies = [],
                constraints = [],
                i;
            var event = {
                timestamp: engine.timing.timestamp
            };
            render.events.onBeforeRender.fire(event);
            //Events.trigger(render, 'beforeRender', event);
            if (render.currentBackground !== background) {
                applyBackground(render, background);
            }
            context.clearRect(0, 0, canvas.width, canvas.height);            
            context.globalCompositeOperation = 'source-over';
            

                constraints = allConstraints;
                bodies = allBodies;
                this.updateView(render);
                if (render.options.pixelRatio !== 1) {
                    render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
                }

            if (!options.wireframes || (engine.enableSleeping && options.showSleeping)) {
                this.bodies(render, bodies, context);
            } else {
                if (options.showConvexHulls) {
                    this.bodyConvexHulls(render, bodies, context);
                }
                this.bodyWireframes(render, bodies, context);
            }
            const pC = render.pointConstraint;
            const s = render.selection;
            if (s.selected.length) {
                this.bodiesHighlight(render, s.selected, context);
            }

            //this.bodyBounds(render, bodies, context);
            //this.bodyAxes(render, bodies, context);
            //this.bodyPositions(render, bodies, context);
            //this.bodyVelocity(render, bodies, context);
            //this.bodyIds(render, bodies, context);
            //this.separations(render, engine.pairs.list, context);
            this.collisions(render, engine.pairs.list, context);
            //this.vertexNumbers(render, bodies, context);
            //this.mousePosition(render, render.mouse, context);
            this.constraints(constraints, context);
            if (options.hasBounds) {
                this.endViewTransform(render);
            }

            View.applyIdent();
            render.events.onAfterRender.fire(event);
            timing.lastElapsed = Common.now() - startTime;
        }

        performance(render, context) {
            const engine = render.engine;
            const timing = render.timing;
            const idx = timing.idx;
            const size = HISTORY_SIZE;
            const invSize = HISTORY_INV_SIZE;


            View.applyIdent();
            const graphHeight = 4, gap = 12, width = 60, height = 34, x = 10, y = 69;
            context.fillStyle = '#0e0f19';
            context.fillRect(0, 50, gap * 4 + width * 5 + 22, height);
            this.status(
                context, 
                x, y, 
                width, graphHeight, size,
                Math.round(1000 / timing.delta.delta) + ' fps',
                timing.delta.meanNormalize - 0.5,
                function(i) { return timing.delta.sample(i) - 1; }
            );
            this.status(
                context, 
                x + gap + width, y, 
                width, graphHeight, size,
                timing.render.mean.toFixed(3) + ' ms',
                timing.render.meanNormalize,
                function(i) { return timing.render.sample(i) - 1; }
            );
            this.status(
                context, 
                x + (gap + width) * 2, y, 
                width, graphHeight, size,
                timing.sim.mean.toFixed(3) + ' ms',
                timing.sim.meanNormalize,
                function(i) { return timing.sim.sample(i) - 1; }
            );           
            
            timing.idx = (timing.idx + 1) % size;

        }
        status(context, x, y, width, height, count, label, indicator, plotY) {
            context.strokeStyle = '#888';
            context.fillStyle = '#444';
            context.lineWidth = 1;
            context.fillRect(x, y + 7, width, 1);
            context.beginPath();
            context.moveTo(x, y + 7 - height * Common.clamp(0.4 * plotY(0), -2, 2));
            for (var i = 0; i < width; i += 1) {
                context.lineTo(x + i, y + 7 - (i < count ? height * Common.clamp(0.4 * plotY(i), -2, 2) : 0));
            }
            context.stroke();
            context.fillStyle = 'hsl(' + Common.clamp(120 - 95 * indicator, 0, 120) + ',100%,60%)';
            context.fillRect(x, y - 7, 4, 4);
            context.font = '12px Arial';
            context.textBaseline = 'middle';
            context.textAlign = 'right';
            context.fillStyle = '#eee';
            context.fillText(label, x + width, y - 5);
        }
        constraints(constraints, context) {
            var c = context;
            for (var i = 0; i < constraints.length; i++) {
                var constraint = constraints[i];
                if (!constraint.render.visible || !constraint.pointA || !constraint.pointB)
                    continue;
                var bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB,
                    start,
                    end;
                if (bodyA) {
                    start = Vector.add(bodyA.pos, constraint.pointA);
                } else {
                    start = constraint.pointA;
                }
                if (constraint.render.type === 'pin') {
                    c.beginPath();
                    c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                    c.closePath();
                } else {
                    if (bodyB) {
                        end = Vector.add(bodyB.pos, constraint.pointB);
                    } else {
                        end = constraint.pointB;
                    }
                    c.beginPath();
                    c.moveTo(start.x, start.y);
                    if (constraint.render.type === 'spring') {
                        var delta = Vector.sub(end, start),
                            normal = Vector.perp(Vector.normalise(delta)),
                            coils = Math.ceil(Common.clamp(constraint.length / 5, 12, 20)),
                            offset;
                        for (var j = 1; j < coils; j += 1) {
                            offset = j % 2 === 0 ? 1 : -1;
                            c.lineTo(
                                start.x + delta.x * (j / coils) + normal.x * offset * 4,
                                start.y + delta.y * (j / coils) + normal.y * offset * 4
                            );
                        }
                    }
                    c.lineTo(end.x, end.y);
                }
                if (constraint.render.lineWidth) {
                    c.lineWidth = constraint.render.lineWidth;
                    c.strokeStyle = constraint.render.strokeStyle;
                    c.stroke();
                }
                if (constraint.render.anchors) {
                    c.fillStyle = constraint.render.strokeStyle;
                    c.beginPath();
                    c.arc(start.x, start.y, 5, 0, 2 * Math.PI);
                    c.arc(end.x, end.y, 3, 0, 2 * Math.PI);
                    c.closePath();
                    c.fill();
                }
            }
        }
        bodies(render, bodies, context) {
            var c = context,
                engine = render.engine,
                options = render.options,
                showInternalEdges = options.showInternalEdges || !options.wireframes,
                body,
                part,
                i,
                k;
            for (i = 0; i < bodies.length; i++) {
                body = bodies[i];
                if (!body.render.visible)
                    continue;
                for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                    part = body.parts[k];
                    if (!part.render.visible)
                        continue;
                    if (options.showSleeping && body.isSleeping) {
                        c.globalAlpha = 0.5 * part.render.opacity;
                    } else if (part.render.opacity !== 1) {
                        c.globalAlpha = part.render.opacity;
                    }
                    if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
                        var sprite = part.render.sprite,
                            texture = getTexture(render, sprite.texture);
                        c.translate(part.pos.x, part.pos.y);
                        c.rotate(part.angle);
                        c.drawImage(
                            texture,
                            texture.width * -sprite.xOffset * sprite.xScale,
                            texture.height * -sprite.yOffset * sprite.yScale,
                            texture.width * sprite.xScale,
                            texture.height * sprite.yScale
                        );
                        c.rotate(-part.angle);
                        c.translate(-part.pos.x, -part.pos.y);
                    } else {
                        if (part.circleRadius) {
                            c.beginPath();
                            c.arc(part.pos.x, part.pos.y, part.circleRadius, 0, 2 * Math.PI);
                        } else {
                            c.beginPath();
                            c.moveTo(part.vertices[0].x, part.vertices[0].y);
                            for (var j = 1; j < part.vertices.length; j++) {
                                if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                    c.lineTo(part.vertices[j].x, part.vertices[j].y);
                                } else {
                                    c.moveTo(part.vertices[j].x, part.vertices[j].y);
                                }
                                if (part.vertices[j].isInternal && !showInternalEdges) {
                                    c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                                }
                            }
                            c.lineTo(part.vertices[0].x, part.vertices[0].y);
                            c.closePath();
                        }
                        if (!options.wireframes) {
                            c.fillStyle = part.render.fillStyle;
                            if (part.render.lineWidth) {
                                c.lineWidth = part.render.lineWidth;
                                c.strokeStyle = part.render.strokeStyle;
                                c.stroke();
                            }
                            c.fill();
                        } else {
                            c.lineWidth = 1;
                            c.strokeStyle = '#bbb';
                            c.stroke();
                        }
                    }
                    c.globalAlpha = 1;
                }
            }
        }
        
        bodiesHighlight(render, bodies, ctx, lineWidth = 1, style = "#FAA") {
            var i;
            ctx.beginPath();
            for (i = 0; i < bodies.length; i++) {
                this.bodyHighlight(render, bodies[i], ctx);
            }
            ctx.lineWidth = lineWidth * render.context._iv;
            ctx.strokeStyle = style;
            ctx.stroke(); 
        }
        bodyHighlight(render, body, ctx) {
            if (body.render.visible) { 
                let k, j;
                for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                    const part = body.parts[k];
                    if (part.shapeType === BodyShapes.vertices) {
                        ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
                        for (j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || render.options.showInternalEdges) {
                                ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                                ctx.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }
                            if (part.vertices[j].isInternal && !render.options.showInternalEdges) {
                                ctx.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                        }
                        ctx.closePath(); 
                    } else if (part.shapeType === BodyShapes.circle) {
                        ctx.moveTo(part.pos.x, part.pos.y); 
                        ctx.arc(part.pos.x, part.pos.y, part.circleRadius, part.angle, part.angle + Math.PI * 2);
                        ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
                        for (j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                                ctx.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }
                            if (part.vertices[j].isInternal && !showInternalEdges) {
                                ctx.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                        }
                        ctx.closePath();                        
                    }
                }              
            }
            
        }
        bodyWireframes(render, bodies, context) {
            const ctx = context;
            var showInternalEdges = render.options.showInternalEdges;
            var body;
            var part;
            var i;
            var j;
            var k;
            ctx.beginPath();
            for (i = 0; i < bodies.length; i++) {
                body = bodies[i];
                if (body.render.visible) { 
                    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                        part = body.parts[k];
                        if (part.shapeType === BodyShapes.vertices) {
                            ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
                            for (j = 1; j < part.vertices.length; j++) {
                                if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                    ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
                                } else {
                                    ctx.moveTo(part.vertices[j].x, part.vertices[j].y);
                                }
                                if (part.vertices[j].isInternal && !showInternalEdges) {
                                    ctx.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                                }
                            }
                            ctx.closePath();
                        } else if (part.shapeType === BodyShapes.circle) {
                            //c.moveTo(part.pos.x + part.circleRadius, part.pos.y); 
                            ctx.moveTo(part.pos.x, part.pos.y); 
                            ctx.arc(part.pos.x, part.pos.y, part.circleRadius, part.angle, part.angle + Math.PI * 2);

                        }
                    }
                }
            }
            ctx.lineWidth = 1 * ctx._iv;
            ctx.strokeStyle = '#bbb';
            ctx.stroke();
        }
        bodyConvexHulls(render, bodies, context) {
            var c = context,
                body,
                part,
                i,
                j,
                k;
            c.beginPath();
            for (i = 0; i < bodies.length; i++) {
                body = bodies[i];
                if (!body.render.visible || body.parts.length === 1)
                    continue;
                c.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (j = 1; j < body.vertices.length; j++) {
                    c.lineTo(body.vertices[j].x, body.vertices[j].y);
                }
                c.lineTo(body.vertices[0].x, body.vertices[0].y);
            }
            c.lineWidth = 1 * c._iv;
            c.strokeStyle = 'rgba(255,255,255,0.2)';
            c.stroke();
        }
        vertexNumbers(render, bodies, context) {
            var c = context,
                i,
                j,
                k;
            for (i = 0; i < bodies.length; i++) {
                var parts = bodies[i].parts;
                for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                    var part = parts[k];
                    for (j = 0; j < part.vertices.length; j++) {
                        c.fillStyle = 'rgba(255,255,255,0.2)';
                        c.fillText(i + '_' + j, part.pos.x + (part.vertices[j].x - part.pos.x) * 0.8, part.pos.y + (part.vertices[j].y - part.pos.y) * 0.8);
                    }
                }
            }
        }
        mousePosition(render, mouse, context) {
            var c = context;
            c.fillStyle = 'rgba(255,255,255,0.8)';
            c.fillText(mouse.pos.x + '  ' + mouse.pos.y, mouse.pos.x + 5, mouse.pos.y - 5);
        }
        bodyBounds(render, bodies, context) {
            var c = context,
                engine = render.engine,
                options = render.options;
            c.beginPath();
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                if (body.render.visible) {
                    var parts = bodies[i].parts;
                    for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        var part = parts[j];
                        c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                    }
                }
            }
            if (options.wireframes) {
                c.strokeStyle = 'rgba(255,255,255,0.08)';
            } else {
                c.strokeStyle = 'rgba(0,0,0,0.1)';
            }
            c.lineWidth = 1 * c._iv;
            c.stroke();
        }
        bodyAxes(render, bodies, context) {
            const ctx = context;
            const engine = render.engine;
            const options = render.options;
            var part,  i, j, k;
            ctx.beginPath();
            for (i = 0; i < bodies.length; i++) {
                var body = bodies[i],
                    parts = body.parts;
                if (!body.render.visible)
                    continue;
                //if (options.showAxes) {
                    for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        part = parts[j];
                        for (k = 0; k < part.axes.length; k++) {
                            var axis = part.axes[k];
                            ctx.moveTo(part.pos.x, part.pos.y);
                            ctx.lineTo(part.pos.x + axis.x * 20, part.pos.y + axis.y * 20);
                        }
                    }
                //} else {
                /*    for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        part = parts[j];
                        for (k = 0; k < part.axes.length; k++) {
                            ctx.moveTo(part.pos.x, part.pos.y);
                            ctx.lineTo((part.vertices[0].x + part.vertices[part.vertices.length-1].x) / 2,
                                (part.vertices[0].y + part.vertices[part.vertices.length-1].y) / 2);
                        }
                    }*/
                //}
            }
            if (options.wireframes) {
                ctx.strokeStyle = "#F00";
                ctx.lineWidth = 1 * ctx._iv;
            } else {
                ctx.strokeStyle = "#FFF8";
                ctx.globalCompositeOperation = 'overlay';
                ctx.lineWidth = 2 * ctx._iv;
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
        bodyPositions(render, bodies, context) {
            var c = context,
                engine = render.engine,
                options = render.options,
                body,
                part,
                i,
                k;
            c.beginPath();
            for (i = 0; i < bodies.length; i++) {
                body = bodies[i];
                if (!body.render.visible)
                    continue;
                for (k = 0; k < body.parts.length; k++) {
                    part = body.parts[k];
                    c.arc(part.pos.x, part.pos.y, 3, 0, 2 * Math.PI, false);
                    c.closePath();
                }
            }
            if (options.wireframes) {
                c.fillStyle = 'indianred';
            } else {
                c.fillStyle = 'rgba(0,0,0,0.5)';
            }
            c.fill();
            c.beginPath();
            for (i = 0; i < bodies.length; i++) {
                body = bodies[i];
                if (body.render.visible) {
                    c.arc(body.posPrev.x, body.posPrev.y, 2, 0, 2 * Math.PI, false);
                    c.closePath();
                }
            }
            c.fillStyle = 'rgba(255,165,0,0.8)';
            c.fill();
        }
        bodyVelocity(render, bodies, context) {
            var c = context;
            c.beginPath();
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                if (!body.render.visible)
                    continue;
                c.moveTo(body.pos.x, body.pos.y);
                c.lineTo(body.pos.x + (body.pos.x - body.posPrev.x) * 2, body.pos.y + (body.pos.y - body.posPrev.y) * 2);
            }
            c.lineWidth = 3 * c._iv;
            c.strokeStyle = 'cornflowerblue';
            c.stroke();
        }
        bodyIds(render, bodies, context) {
            var c = context,
                i,
                j;
            for (i = 0; i < bodies.length; i++) {
                if (!bodies[i].render.visible)
                    continue;
                var parts = bodies[i].parts;
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    var part = parts[j];
                    c.font = "12px Arial";
                    c.fillStyle = 'rgba(255,255,255,0.5)';
                    c.fillText(part.id, part.pos.x + 10, part.pos.y - 10);
                }
            }
        }
        collisions(render, pairs, context) {
            const ctx = context;
            const options = render.options;
            var pair;
            var collision;
            var corrected;
            var bodyA;
            var bodyB;
            var i, j;
            ctx.beginPath();
            for (i = 0; i < pairs.length; i++) {
                pair = pairs[i];
                if (!pair.isActive)
                    continue;
                collision = pair.collision;
                for (j = 0; j < pair.activeContacts.length; j++) {
                    var contact = pair.activeContacts[j], vertex = contact.vertex;
                    ctx.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
                }
            }

            ctx.fillStyle = options.wireframes ? "#FFFB" : "#F80";
            ctx.strokeStyle = options.wireframes ? "#FA0B" : "#F80";

            ctx.fill();
            ctx.beginPath();
            for (i = 0; i < pairs.length; i++) {
                pair = pairs[i];
                if (!pair.isActive)
                    continue;
                collision = pair.collision;
                if (pair.activeContacts.length > 0) {
                    var normalPosX = pair.activeContacts[0].vertex.x,
                        normalPosY = pair.activeContacts[0].vertex.y;
                    if (pair.activeContacts.length === 2) {
                        normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                        normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                    }
                    if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                        ctx.moveTo(normalPosX - collision.normal.x * 16, normalPosY - collision.normal.y * 16);
                    } else {
                        ctx.moveTo(normalPosX + collision.normal.x * 16, normalPosY + collision.normal.y * 16);
                    }
                    ctx.lineTo(normalPosX, normalPosY);
                }
            }

            ctx.lineWidth = 1 * ctx._iv;
            ctx.stroke();
        }
        separations(render, pairs, context) {
            var c = context,
                options = render.options,
                pair,
                collision,
                corrected,
                bodyA,
                bodyB,
                i,
                j;
            c.beginPath();
            for (i = 0; i < pairs.length; i++) {
                pair = pairs[i];
                if (!pair.isActive)
                    continue;
                collision = pair.collision;
                bodyA = collision.bodyA;
                bodyB = collision.bodyB;
                var k = 1;
                if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
                if (bodyB.isStatic) k = 0;
                c.moveTo(bodyB.pos.x, bodyB.pos.y);
                c.lineTo(bodyB.pos.x - collision.penetration.x * k, bodyB.pos.y - collision.penetration.y * k);
                k = 1;
                if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
                if (bodyA.isStatic) k = 0;
                c.moveTo(bodyA.pos.x, bodyA.pos.y);
                c.lineTo(bodyA.pos.x + collision.penetration.x * k, bodyA.pos.y + collision.penetration.y * k);
            }
            if (options.wireframes) {
                c.strokeStyle = 'rgba(255,165,0,0.5)';
            } else {
                c.strokeStyle = 'orange';
            }
            c.stroke();
        }
        inspector(inspector, context) {
            var engine = inspector.engine,
                selected = inspector.selected,
                render = inspector.render,
                options = render.options,
                bounds;
            if (options.hasBounds) {
                var boundsWidth = render.bounds.max.x - render.bounds.min.x,
                    boundsHeight = render.bounds.max.y - render.bounds.min.y,
                    boundsScaleX = boundsWidth / render.options.width,
                    boundsScaleY = boundsHeight / render.options.height;
                context.scale(1 / boundsScaleX, 1 / boundsScaleY);
                context.translate(-render.bounds.min.x, -render.bounds.min.y);
            }
            for (var i = 0; i < selected.length; i++) {
                var item = selected[i].data;
                context.translate(0.5, 0.5);
                context.lineWidth = 1 * c._iv;
                context.strokeStyle = 'rgba(255,165,0,0.9)';
                context.setLineDash([1,2]);
                switch (item.type) {
                case 'body':
                    bounds = item.bounds;
                    context.beginPath();
                    context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3),
                        Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
                    context.closePath();
                    context.stroke();
                    break;
                case 'constraint':
                    var point = item.pointA;
                    if (item.bodyA)
                        point = item.pointB;
                    context.beginPath();
                    context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                    context.closePath();
                    context.stroke();
                    break;
                }
                context.setLineDash([]);
                context.translate(-0.5, -0.5);
            }
            if (inspector.selectStart !== null) {
                context.translate(0.5, 0.5);
                context.lineWidth = 1;
                context.strokeStyle = 'rgba(255,165,0,0.6)';
                context.fillStyle = 'rgba(255,165,0,0.1)';
                bounds = inspector.selectBounds;
                context.beginPath();
                context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y),
                    Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
                context.closePath();
                context.stroke();
                context.fill();
                context.translate(-0.5, -0.5);
            }
            if (options.hasBounds)
                context.setTransform(1, 0, 0, 1, 0, 0);
        }


    };
    return new Render();
})();
export {Render};