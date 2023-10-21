import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {Matter} from "./module/main.js";

$$(document.body, $("p", {textContent: "Hi there browser"}));

console.log(Matter);
bridge();

function bridge() {
    const Engine          = Matter.Engine;
    const Render          = Matter.Render;
    const Runner          = Matter.Runner;
    const Body            = Matter.Body;
    const Composites      = Matter.Composites;
    const Common          = Matter.Common;
    const Constraint      = Matter.Constraint;
    const MouseConstraint = Matter.MouseConstraint;
    const Mouse           = Matter.Mouse;
    const Composite       = Matter.Composite;
    const Bodies          = Matter.Bodies;
    const Events          = Matter.Events;


    var width = innerWidth;
    var height = innerHeight;

    var engine = Engine.create();
    var world = engine.world;


    var render = Render.create({
            Matter,
            element: document.body, 
            engine,
        }, {
            fullpage: true,
            showAngleIndicator: false,
            showPerformance: true,
            showSleeping: false,
        }
    );

    Render.run(render);

    var runner = render.runner = Runner.create({isFixed: true, delta: 1000 / 60 });
    Runner.run(runner);
engine.gravity.y = 1;
engine.gravity.x = 0;
    var group = Body.nextGroup(true);
    const bridgeLeft = {x: 160, y: 200};
    const bridgeRight = {x: width - 160, y: height - 120};
    const bridgeTempRight = {x: width - 160, y: 200};
    const bridgeSegs = 80;
    const bridgeSegOverlap = 10;
    const bridgeLen = Math.hypot(bridgeRight.x - bridgeLeft.x, bridgeRight.y - bridgeLeft.y);
    const bridgeSegLen = bridgeLen / bridgeSegs + bridgeSegOverlap * 2;
    const blockSizeX = 140;
    const blockSizeY = 40;
    const blockRows = 14;
    const blockCols = 11;
    const blockSides = 7;
    const blockCenter = {x: width / 2, y : -500};
    //Composite.add(world, Car(1200, 50, 500, 30, 50));
    
    /*var bridge = Composites.stack(bridgeLeft.x, bridgeLeft.y,  bridgeSegs, 1, -bridgeSegOverlap, 0, function(x, y) {
        return Bodies.rectangle(x -bridgeSegOverlap, y, bridgeSegLen , 20, { 
            collisionFilter: { group: group },
            chamfer: 5,
            density: 0.005,
            frictionAir: 0.05,
            render: { fillStyle: '#260a19' }
        });
    });*/
    
    /*Composites.chain(bridge, 0.5 - (bridgeSegOverlap / bridgeSegLen), 0, -0.5 + (bridgeSegOverlap / bridgeSegLen), 0, { 
        stiffness: 1,
        length: 0,
        render: { visible: false }
    });*/
    
    /*
    var msize = 685.8;
    var mpixels = (2560 * 2560 + 1440 * 1440) ** 0.5;
    console.log("pxPer-mm: " + (mpixels / msize) );
    console.log("Grav in pixel per second squared: " + ((9800 * (mpixels / msize)) / 60) );
    engine.gravity.y = (9800 * (mpixels / msize)) / 60000;*/
    const arrow = Matter.Vertices.fromPath('40 0 40 20 100 20 100 80 40 80 40 100 0 50');
    const chevron = Matter.Vertices.fromPath('100 0 75 50 100 100 25 100 0 50 25 0');
    const star = Matter.Vertices.fromPath('50 0 63 38 100 38 69 59 82 100 50 75 18 100 31 59 0 38 37 38');
    const horseShoe = Matter.Vertices.fromPath('35 7 19 17 14 38 14 58 25 79 45 85 65 84 65 66 46 67 34 59 30 44 33 29 45 23 66 23 66 7 53 7');   
    
    var stack = Composites.stack(blockCenter.x - blockCols * blockSizeX * 0.5, blockCenter.y - blockRows * blockSizeY * 5.5, blockCols, blockRows, 0, 0, function(x, y) {
        /*if (Math.random() < 0.16666667) { 
            const r = Common.random(25, 150);
            return Bodies.egg(x, y, r, Common.random(r, r* 3), Common.random(r * 0.33, r), { 
                  
                density: 0.4,
                frictionAir: 0,
                friction: 1,
                render: { fillStyle: '#060a19' }            
            
            }, 30); 
        }            
        if (Math.random() < 0.2) { 
            const r = Common.random(25, 150);
            return Bodies.ellipse(x, y, r, r, { 
                  
                density: 0.4,
                frictionAir: 0,
                friction: 1,
                render: { fillStyle: '#060a19' }            
            
            });             
            return Bodies.circle(x, y, Common.random(25, 150), { 
                  
                density: 0.4,
                frictionAir: 0,
                friction: 1,
                render: { fillStyle: '#060a19' }            
            
            });        
        }        
        if (Math.random() < 0.25) { 
            return Bodies.ellipse(x, y, Common.random(25, 150), Common.random(25, 150), { 
                  
                density: 0.4,
                frictionAir: 0,
                friction: 1,
                render: { fillStyle: '#060a19' }            
            
            }); 
        }

        if (Math.random() < 0.33) { */
           /* return Bodies.fromVertices(x, y, arrow, { 
                  
                density: 0.4,
                frictionAir: 0,
                friction: 1,
                render: { fillStyle: '#060a19' }            
            
            }, true);*/
        /*}
        if (Math.random() < 0.5) { */
            /*return Bodies.polygon(x, y, Common.random(3,blockSides), Common.random(25, 150), { 
                chamfer: 0, 
                density: 0.4,
                frictionAir: 0,
                friction: 1,//Math.random(),
                render: { fillStyle: '#060a19' }               
            }); */
       // }
        return Bodies.rectangle(x, y, blockSizeX + Math.random() * blockSizeX * 6, blockSizeY + Math.random() * blockSizeY * 6, { 
            /*collisionFilter: { group: group },*/
            chamfer: 0,
            density: 0.4,
            frictionAir: 0,
            friction: 0.1,//Math.random(),
            render: { fillStyle: '#060a19' }
        }/*Common.random(20, 40)*/);
    });
    
    var rightBridgePos;
    Composite.add(world, [
        bridge,
        stack,
        Bodies.rectangle(-width* 6- height * 0.5, height * -4, height, height * 12, { 
            isStatic: true, 
            friction: 1
            
        }),
        Bodies.rectangle(width * 7 + height * 0.5, height * -4, height, height * 12, { 
            isStatic: true, 
            friction: 1
        }),          
        // bottom
        /*Bodies.rectangle(width * 0.5, height + height * 0.49, width * 14, height , { 
            isStatic: true, 
            friction: 1
        }),*/
        //Bodies.rectangleEdged(-width * 2.5, -height, width, height, 0, 1, [-100,100,-200,100,50, 100,150,200,-100,50] , { 
        ...Bodies.rectangleEdged(-width * 6, height *0.5, width* 14, height, 0, 1, [-3300,-2600,-2400,-2100,-1100,-1200,100,50, 100,150,200,-100,50,300,-100,100,-200,100,50, 100,150,200,-100,50] , { 
            isStatic: true, 
            friction: 1
        }),
       /* Bodies.rectangleEdged(-width * 2.5, -height, width, height, 0, 1, [0] , { 
            isStatic: true, 
            friction: 1
        }),*/
        // top
        Bodies.rectangle(width * 0.5, height + height * -10.49, width * 14, height , { 
            isStatic: true, 
            friction: 1
        }),        
     
       /* Constraint.create({ 
            pointA: {x: bridgeLeft.x + bridgeSegOverlap, y: bridgeLeft.y}, 
            bodyB: bridge.bodies[0], 
            pointB: { x: -(bridgeSegLen * 0.5 - bridgeSegOverlap), y: 0 },
            length: 2,
            stiffness: 0.9
        }),
        rightBridgePos = Constraint.create({ 
            pointA: {x: bridgeTempRight.x, y: bridgeTempRight.y},
            bodyB: bridge.bodies[bridge.bodies.length - 1], 
            pointB: { x: bridgeSegLen * 0.5 - bridgeSegOverlap, y: 0 },
            length: 2,
            stiffness: 0.9
        })*/
    ]);

    // add mouse control
    var mouse = new Mouse(render.canvas);
    /*    mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.1,
                render: {
                    visible: false
                }
            }
        });*/

    Composite.add(world, render.pointConstraint);
    Matter.Keyboard.addKeyListener("KeyP", () => { render.pause = !render.pause; });
    Matter.Keyboard.addKeyListener("Comma", () => { 
        render.selection.each(body => {
            body.scale(1.1, 1.1);
        });
    });
    Matter.Keyboard.addKeyListener("Period", () => { 
        render.selection.each(body => {
            body.scale(1/1.1, 1/1.1);
        });
    });

    render.mouse = mouse;
    mouse.view = render.view;

    Render.lookAt(render);
    
    var bp = 0.0;
    var info = 0;
    var info1;
    //beforeUpdate,afterUpdate,collisionStart,collisionActive,collisionEnd
    const collisionEvent = e => info += 1;

    render.events.addListener("beforeRender", (e) => {
        //info = e.info.timestamp +""; 
        info ++;
        if (info === 100 && info1 === undefined) {
            runner.events.addListener("beforeTick", e => { info1 = info = 0; });
            engine.events.addListener("beforeUpdate", e => { info1++; });
            engine.events.addListener("collisionStart", collisionEvent);
            engine.events.addListener("collisionActive", collisionEvent);
            engine.events.addListener("collisionEnd", collisionEvent);                      
            e.target.events.removeListener("beforeRender", e.listener);
        }
    });
    render.events.addListener("afterRender", (e) => {
        const ctx = e.target.context;
        ctx.fillStyle = "#FFF";
        ctx.fillText(info + " : " + info1, 20, 20);

    });

    return {
        engine: engine,
        runner: runner,
        render: render,
        canvas: render.canvas,
        stop: function() {
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
        }
    };
};
function Car(xx, yy, width, height, wheelSize) {
    var Body = Matter.Body,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Constraint = Matter.Constraint;

    var group = Body.nextGroup(true),
        wheelBase = 20,
        wheelAOffset = -width * 0.5 + wheelBase,
        wheelBOffset = width * 0.5 - wheelBase,
        wheelYOffset = 0;

    var car = Composite.create({ label: 'Car' }),
        body = Bodies.rectangle(xx, yy, width, height, { 
            collisionFilter: {
                group: group
            },
            chamfer: {
                radius: height * 0.5
            },
            density: 0.0002
        });

    var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, { 
        collisionFilter: {
            group: group
        },
        friction: 0.001
    });
                
    var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, { 
        collisionFilter: {
            group: group
        },
        friction: 0.001
    });
                
    var axelA = Constraint.create({
        bodyB: body,
        pointB: { x: wheelAOffset, y: wheelYOffset },
        bodyA: wheelA,
        stiffness: 0.1,
        length: 0
    });
                    
    var axelB = Constraint.create({
        bodyB: body,
        pointB: { x: wheelBOffset, y: wheelYOffset },
        bodyA: wheelB,
        stiffness: 1,
        length: 0
    });
    
    Composite.addBody(car, body);
    Composite.addBody(car, wheelA);
    Composite.addBody(car, wheelB);
    Composite.addConstraint(car, axelA);
    Composite.addConstraint(car, axelB);

    return car;
};


