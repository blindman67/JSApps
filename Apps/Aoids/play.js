import "../../src/utils/MathExtensions.js";
import {Vec2} from "../../src/Vec2.js";
import {View} from "../../src/View.js";
import {data} from "./data.js";
import {Aoids} from "./Aoids.js";
import {buffers} from "./buffers.js";
import {Bases} from "./Base.js";
import {Ship} from "./Ship.js";
import {Bullets, bulletHitTypes} from "./Bullets.js";
import {Rocks} from "./Rocks.js";
import {Pickups} from "./Pickups.js";
import {Metal} from "./Pickups/Metal.js";
import {Bonus} from "./Pickups/Bonus.js";
import {Timed} from "../../src/utils/Timed.js";
//import {Astronaut} from "./Pickups/Astronaut.js";
import {NumberDisplay} from "./NumberDisplay.js";
const MAX_ZOOM = data.playfield.maxZoom;
const MIN_ZOOM = data.playfield.minZoom;
const ZOOM_RATE = data.playfield.zoomRate;
var flasher, renderer, ship, rocks, pickups, bonuses, mouse, keys, background, FXs, inPlayDist, bullets;
var scoreDisplay, score = 0, zoom = MIN_ZOOM, zoomR = zoom, zoomC = 0;
const BASIC_SHIP_CONFIG_NAMES = Object.keys(data.ships.basic.configurations);
var shipTypeIdx = BASIC_SHIP_CONFIG_NAMES.indexOf(data.game.shipConfig);
var mouseZoomAdjust = 1;
const wV1 = new Vec2(), wV2 = new Vec2(), wV3 = new Vec2();
const viewOffsetNormal = data.playfield.viewOffset;
const viewOffsetDocking = data.playfield.viewOffsetDocking;
const viewOffsetDocked = data.playfield.viewOffsetDocked;
const viewOffsetFromHyper = data.playfield.viewOffsetFromHyper;
const viewOffsetBaseInspect = data.playfield.viewOffsetBaseInspect;
const viewOffset = new Vec2(), viewOffsetChase = new Vec2(), viewOffsetReal = new Vec2(), viewOffsetRange = new Vec2(), viewShipPos = new Vec2();
const view = new View();

function showInstructions() {

    if (gamePlayState.instructions.pos === gamePlayState.instructions.length) {
        gamePlayState.levelInstructions.stop();
        gamePlayState.levelInstructions = undefined;
        gamePlayState.instructions  = undefined;
        VIEW_MODES.viewLocked = false;
    } else {
         Aoids.logger.log("instructs" + gamePlayState.instructions[gamePlayState.instructions.pos % gamePlayState.instructions.length]);
        Aoids.info(gamePlayState.instructions[gamePlayState.instructions.pos++ % gamePlayState.instructions.length]);
    }
}
function showInstructionsLevel1(e, data) {

    if (gamePlayState.middleButtonClicked) {
        gamePlayState.middleButtonClicked = false;
        gamePlayState.instructions.pos = gamePlayState.instructions.length;
        Aoids.info("GAME STARTED", undefined, undefined, "flash" );
    }
    if (gamePlayState.instructions.pos === gamePlayState.instructions.length) {
        gamePlayState.levelInstructions.stop();
        gamePlayState.levelInstructions = undefined;
        gamePlayState.instructions  = undefined;
        VIEW_MODES.viewLocked = false;
        createRocks();
    } else {
        const inst = gamePlayState.instructions[gamePlayState.instructions.pos % gamePlayState.instructions.length];
        if (Array.isArray(inst)) {
            if (data === 1) { Aoids.info(inst[0], 3000, undefined, "flash" ) }
            if(showInstructionsLevel1[inst[1]]()) {
                if (data === 4) {
                    gamePlayState.instructions.pos++;
                }
                gamePlayState.levelInstructions.next();
            }

        } else {
            if (data === 1) { Aoids.info(inst, 3000, undefined, "flash" ) }
            if (data === 4) { gamePlayState.instructions.pos++ }
        }
    }
}
Object.assign(showInstructionsLevel1, {
    zoomIn() {
        currentViewOffset.freezeZoom = false;
        currentViewOffset.zoomA = 0.4;
        currentViewOffset.zoomD = 0.5;
        return zoom > 1
    },
    zoomOut() { return zoom < 0.15 },
    turn() {
        if (this.startAng === undefined) { this.startAng = ship.physics.angle};
        return Math.abs(this.startAng - ship.physics.angle) > Math.TAU * 2;

    },
    fire() {
        currentViewOffset.freezeFireButton = false;
        return bullets.shootsFired > 3;
    },
    thrust() {
        currentViewOffset.freezeThrustButton = false;


    },

})


var currentViewOffset;
var oldZoom = 0;
var dockingZoom = zoom;
var zoomAccelR = viewOffsetFromHyper.zoomA, zoomAccelC = 0, zoomAccel = viewOffsetFromHyper.zoomA;
var zoomDragR = viewOffsetFromHyper.zoomD, zoomDragC = 0, zoomDrag = viewOffsetFromHyper.zoomD;
function Teams() {
    var idx = 1, currentTeam;
    const teams = {};
    const API = {
        create(name) {
            teams[name] = currentTeam = {name, idx};
            return idx++;
        },
        set name(name) { currentTeam = teams[name] },
        get name() { return currentTeam.name },
        get idx() { return currentTeam.idx  },
    };
    return API;
};
var teams;
const overlayView = new View();
function setup() {
	flasher = Aoids.flasher;
	renderer = Aoids.renderer;
	mouse = Aoids.mouse;
	keys = Aoids.keys;
    teams = Aoids.teams = Teams();
    teams.create("Player");
    teams.create("Rocks");
    teams.create("Aliens");
	background = Aoids.background;
	FXs = Aoids.FXs;
	overlayView.init();
    Aoids.info = flasher;
    Aoids.flasher = Aoids.text.flasher();
}
function start(fromIntro) {
    view.init(view.origin.zero(),data.playfield.minZoom, 0, data.playfield.scale);
    gamePlayState.reset();
    buffers.draw.unlock().clear();
    buffers.drawB.unlock().clear();
    buffers.fx.unlock().clear();
    buffers.overlay.unlock().clear();
    buffers.overlayB.unlock().clear();
    createBullets();
	createPrizes();
	rocks = new Rocks();
	rocks.pickups = pickups;
	rocks.bonuses = bonuses;
    rocks.view = view;
    createBases();
	//createRocks();
	scoreDisplay = new NumberDisplay(10, 10, 9, 0xFF0000FF, 0xFF00FFFF);
	rocks.FXs = FXs;
	inPlayDist = 0;
    createShip();
    bindShip();
    gamePlayState.bases.init();
    //gamePlayState.bases.landShip("home", ship);
    if (fromIntro && fromIntro.view) {
        view.init(fromIntro.view.origin, fromIntro.view.zoom, 0, data.playfield.scale);
        wV1.copyOf(ship).sub(view.origin).normalize().scale(fromIntro.speed);
        gamePlayState.setViewMode(VIEW_MODES.fromHyperSpace);
        VIEW_MODES.viewLocked = true;
        viewOffsetChase.copyOf(wV1)
        zoomR = fromIntro.view.zoom;
        //setTimeout(() => { VIEW_MODES.viewLocked = false }, viewOffsetFromHyper.viewModeDelay);
        //setTimeout(() => { gamePlayState.setViewMode(VIEW_MODES.docking); Aoids.flasher("Docking Mode"); }, viewOffsetFromHyper.viewModeDelay);
        viewOffsetReal.copyOf(fromIntro.view.origin);
        gamePlayState.startLevel(1);
    } else {
        VIEW_MODES.viewLocked = false;
        createRocks();
        gamePlayState.setViewMode(VIEW_MODES.docking);
    }
}
function createBullets() {
    bullets && bullets.reset();
    Aoids.bullets = bullets = new Bullets();
	bullets.FXs = FXs;
}
function createShip() {
    buffers.draw.clear();
    buffers.fx.clear();
    buffers.overlay.clear();
    buffers.overlayB.clear();
    teams.name = "Player";
	ship = new Ship("basic",BASIC_SHIP_CONFIG_NAMES[shipTypeIdx], teams.idx, bullets).setup(renderer, FXs, mouse, keys, view, rocks);
	viewOffsetReal.copyOf(viewOffset.copyOf(ship));
	viewOffsetChase.zero();
	view.origin = ship;
}
function bindShip() {
    rocks.target = ship;
    pickups.reset();
    bonuses.reset();
	pickups.target = ship;
	bonuses.target = ship;
    gamePlayState.bases.target = ship;
}
function createPrizes() {
    pickups = new Pickups(Metal, data.rocks.maxMetal);
	bonuses = new Pickups(Bonus);
}
function createBases() {
    Aoids.bases = gamePlayState.bases = Bases();
    gamePlayState.bases.rocks = rocks;
    for (const baseName of Object.keys(data.bases)) {
        if (typeof data.bases[baseName] === "object") {
            gamePlayState.bases.addBase(baseName, "Player");
        }
    }
}
function nextWaveOfRocks(name) {
    teams.name = "Rocks";
    rocks.tidy();
    if (data.rocks.orbits[data.game.startRockWaveName][0].next) {
        rocks.fillOrbits(data.rocks.orbits[data.game.startRockWaveName][0].next);
    }

}
function createRocks() {
    teams.name = "Rocks";
    rocks.onRocksCompleted = nextWaveOfRocks;
    rocks.fillOrbits(data.game.startRockWaveName);
}
const VIEW_MODES = {
    start: -1,
    normal: 0,
    gameOver: 1,
    docking: 2,
    fromHyperSpace: 3,
    docked: 4,
    baseInspect: 5,
    viewLocked: false,
};
const gamePlayState = {
    incomingWarningTime: 0,
    levelLanded: 120,  // timer when the level first starts
    inPlay: true,
    lives: data.game.lives,
    shipIsAlive: true,
    waitForClick: false,
    gettingReady: false,
    habitats: [],
    landingPads: [],
    bases: undefined,
    gameOver: false,
    level: 0,
    playEnded: false,
    middleButtonClicked: false,
    messageHandle: undefined,
    viewMode: VIEW_MODES.start,
    setViewMode(mode) {
        if (gamePlayState.gameOver) { return }
        if (VIEW_MODES.viewLocked) { return }
        var newViewOffset = currentViewOffset;
        if (mode === VIEW_MODES.fromHyperSpace && gamePlayState.viewMode !== VIEW_MODES.fromHyperSpace) {
            newViewOffset = viewOffsetFromHyper;
            Aoids.flasher("So you survived hyperspace!!",1000);

        } else if (mode === VIEW_MODES.docking && gamePlayState.viewMode !== VIEW_MODES.docking) {
            newViewOffset = viewOffsetDocking;
            Aoids.flasher("Docked view activated.",1000);
        } else if (mode === VIEW_MODES.docked && gamePlayState.viewMode !== VIEW_MODES.docked) {
            newViewOffset = viewOffsetDocked;
            //Aoids.flasher("Docked view activated.",1000);
        } else if (mode === VIEW_MODES.normal && gamePlayState.viewMode !== VIEW_MODES.normal) {
            newViewOffset = viewOffsetNormal;
            Aoids.flasher("Back to the grinder.",1000);
        } else if (mode === VIEW_MODES.baseInspect && gamePlayState.viewMode !== VIEW_MODES.baseInspect) {
            newViewOffset = viewOffsetBaseInspect;
            //Aoids.flasher("Inspecting the hard place.",1000);
        }
        if (newViewOffset !== currentViewOffset) {
            gamePlayState.viewMode = mode;
            currentViewOffset && (currentViewOffset.defaultZoom = zoom);
            currentViewOffset = newViewOffset;
            zoom = currentViewOffset.defaultZoom;
            viewOffsetRange.x = renderer.width * currentViewOffset.amount;
            viewOffsetRange.y = renderer.height * currentViewOffset.amount;
        }
    },
    startLevel(level = 1) {
        setTimeout(() => {
            currentViewOffset.freezeFireButton = true;
            currentViewOffset.freezeThrustButton = true;
            currentViewOffset.freezeZoom = true;

            this.instructions = data.game.instructionText["level" + level];
            this.instructions.pos = 0;
            this.levelInstructions = new Timed();
            this.levelInstructions.addEvent(0, showInstructionsLevel1, 1 );
            this.levelInstructions.addEvent(1000, showInstructionsLevel1, 2);
            this.levelInstructions.addEvent(2000, showInstructionsLevel1, 3);
            this.levelInstructions.addEvent(2990, showInstructionsLevel1, 4);
            this.levelInstructions.addRepeat(3000);
            this.levelInstructions.selfTime(1000);
        }, 1000);

    },
    reset() {
        this.lives = data.game.lives;
        this.levelLanded = 120;
        this.gameOver = false;
        this.viewMode = VIEW_MODES.normal;
        this.shipIsAlive = true;
        this.waitForClick = false;
        this.gettingReady = false;
        this.inPlay = true;
        inPlayDist = 0;
    },
    nextShip() {
        this.shipIsAlive = true;
        this.waitForClick = false;
        this.gettingReady = false;
        this.inPlay = true;
        this.viewMode = VIEW_MODES.normal;
        inPlayDist = 0;
        createShip();
        bindShip();

        //gamePlayState.bases.landShip(Object.keys(data.bases)[0], ship);
    },
    update() {
        this.levelLanded > 0 && (this.levelLanded--);
        if (this.gettingReady) { return }
        if (this.waitForClick) {
            if (mouse.button) {
                mouse.button = 0;
                this.gettingReady = true;
                this.waitForClick = false;
                clearTimeout(this.messageHandle);
                Aoids.flasher("Get ready",1000);
                setTimeout(() => this.nextShip(), 1000);
                return;
            }
        } else if (!this.gameOver) {
            if (this.shipIsAlive) {
                if (!ship.alive) {
                    this.lives -= 1;
                    this.shipIsAlive = false;
                    this.inPlay = false;
                    if(this.lives) {
                        mouse.button = 0;
                        Aoids.flasher("Lost a ship. Lives remaining " + this.lives,5000);
                        this.waitForClick = true;
                        this.messageHandle = setTimeout(() => Aoids.flasher("Click for next life",1000), 5000);
                    } else {
                    }
                }
            }
            if(this.lives <= 0) {
                Aoids.flasher("Game Over!",1000000);
                viewOffsetReal.copyOf(view.origin);
                this.gameOver = true;
                this.viewMode = VIEW_MODES.gameOver;
                this.inPlay = false;
                return;
            }
            var alive = true;
            for(const h of this.habitats) {
                if(h.attached.alive) {
                    alive = true;
                    break;
                }
            }
            if(!alive) {
                Aoids.flasher("Game Over!",1000000);
                mouse.button = 0;
                this.gameOver = true;
                this.viewMode = VIEW_MODES.gameOver;
                this.inPlay = false;
                viewOffsetReal.copyOf(view.origin);
                return;
            }
        } else {
            if(mouse.button) {
                Aoids.state = "intro"
            }
            mouse.button = 0;
            mouse.wheel = 0;
            mouse.wx = 0;
            mouse.wy = 0;
            mouse.x = 0;
            mouse.y = 0;
        }
    }
}
function doIO(limits = true) {
    if (keys.KeyQ) {
        keys.KeyQ = false;
        ship.delete();
        shipTypeIdx ++;
        shipTypeIdx %= BASIC_SHIP_CONFIG_NAMES.length;
        createShip();
        bindShip();
        inPlayDist = 0;

        gamePlayState.bases.landShip("home", ship);
        Aoids.flasher("Selected basic ship config: " + BASIC_SHIP_CONFIG_NAMES[shipTypeIdx]);

    }
    if (!VIEW_MODES.viewLocked) {
        if( gamePlayState.viewMode !== VIEW_MODES.docking && ship.dockingInProgress && !ship.docked) {
            gamePlayState.setViewMode(VIEW_MODES.docking);
        }  else if(ship.docked && gamePlayState.viewMode === VIEW_MODES.baseInspect && ! ship.inspecting) {
            if(viewOffsetBaseInspect.holding <= 0) {
                if (gamePlayState.viewMode === VIEW_MODES.baseInspect) {
                    gamePlayState.setViewMode(VIEW_MODES.docked);
                }
            }
        } else if( gamePlayState.viewMode !== VIEW_MODES.docked && ship.docked && !ship.dockingInProgress && ! ship.inspecting) {
            gamePlayState.setViewMode(VIEW_MODES.docked);
        } else if(!(ship.dockingInProgress || ship.docked)){
            gamePlayState.setViewMode(VIEW_MODES.normal);

        } else if(ship.docked && ship.inspecting) {
            if (gamePlayState.viewMode === VIEW_MODES.docked) {
                gamePlayState.setViewMode(VIEW_MODES.baseInspect);
                viewOffsetBaseInspect.base = ship.inspecting
                viewOffsetBaseInspect.retarget = true;
                viewOffsetBaseInspect.holding = viewOffsetBaseInspect.holdViewFor
            } else if (gamePlayState.viewMode === VIEW_MODES.baseInspect) {
                if (ship.inspecting && viewOffsetBaseInspect.base !== ship.inspecting) {
                    viewOffsetBaseInspect.base = ship.inspecting
                    viewOffsetBaseInspect.retarget = true;
                    viewOffsetBaseInspect.holding = viewOffsetBaseInspect.holdViewFor;
                }
            }
        }

    } else {
        currentViewOffset.freezeFireButton && (mouse.button &= 6);
        currentViewOffset.freezeThrustButton && (mouse.button &= 3);
        currentViewOffset.freezeZoom && (mouse.wheel = 0);
        if ((mouse.button & 2) === 2) { gamePlayState.middleButtonClicked = true; Aoids.logger.log("middle")}

        //mouse.button = 0;
        //mouse.wheel = 0;
    }
    var Z = zoom;
    if (gamePlayState.viewMode === VIEW_MODES.docking) {
    }
    zoomAccel = currentViewOffset.zoomA;
    zoomDrag = currentViewOffset.zoomD;
	const oldx = mouse.wx;
	const oldy = mouse.wy;
	wV1.x = mouse.sx;
	wV1.y = mouse.sy;
	view.screenToWorld(wV1, wV2);
	mouse.wx = wV2.x;
	mouse.wy = wV2.y;
	if (Math.abs(mouse.wheel) > 0.1) {
		if (mouse.wheel > 0) { Z *= ZOOM_RATE }
		else if(mouse.wheel < 0) { Z *= 1/ZOOM_RATE }
		if (limits) { Z = Z <= MIN_ZOOM ? MIN_ZOOM : Z >= MAX_ZOOM ? MAX_ZOOM : Z }
		mouse.wheel *= 0.9;
	} else { mouse.wheel = 0 }
	if(!limits) {
		if((mouse.button & 2) === 2) {
			view.origin.x += oldx - mouse.wx;
			view.origin.y += oldy - mouse.wy;
			mouse.wx += oldx - mouse.wx;
			mouse.wy += oldy - mouse.wy;
		}
	}
    zoom = Z;
    zoomAccelR = (zoomAccelC = (zoomAccelC += (zoomAccel - zoomAccelR) * 0.4) * 0.4);
    zoomDragR = (zoomDragC = (zoomDragC += (zoomDrag - zoomDragR) * 0.4) * 0.4);
    zoomC += (Z - zoomR) * zoomAccelR;
    zoomR += (zoomC *= zoomDragR);
    view.zoom = limits ? (zoomR = zoomR <= MIN_ZOOM ? MIN_ZOOM : zoomR >= MAX_ZOOM ? MAX_ZOOM : zoomR) : zoomR;
    //view.screenScale = view.invZoom;
    Aoids.viewScale = zoomR;
	const diagonal = renderer.diagonal * (0.55 + currentViewOffset.amount) / zoomR;
	ship.screenRatio = renderer.aspect;
	if (inPlayDist !== diagonal) {
		bonuses.inPlayDistance = pickups.inPlayDistance = ship.inPlayDistance = rocks.inPlayDistance = inPlayDist = diagonal
	}
}

function bulletVRock(rock, bullet) {
	if (rock.isNearFastBullet(bullet)) {
		rock.bulletHit(bullet);
		ship.points += 1;
        return bullet.life > 0;
	}
	return true;
}
function smartVRock(rock, bullet) {
	if (rock.isNearFastBullet(bullet)) {
		rock.bulletHit(bullet);
		ship.points += 1;
        return rock.alive;
	}
	return true;
}
function lazerVRock(rock, lazer) {
	rock.isNearLazer(lazer)
	return true;
}
function bulletVRocks(bullet) {
    if (bullet.hitType === bulletHitTypes.lazer) {
        bullet.type.u = 2;
        bullet.type.rock = undefined;
        rocks.eachInPlay(lazerVRock, bullet);
        if (bullet.type.rock !== undefined) {
            bullet.type.rock.lazerHit(bullet);
            ship.points += 1;
            bullet.type.rock = undefined;
        }
    } else if (bullet.hitType === bulletHitTypes.smart) {
        if (bullet.type.armed) {
            rocks.eachInPlay(smartVRock, bullet);
        }
    } else {
        rocks.eachInPlay(bulletVRock, bullet);
    }
    return true;
}
const play = {
	setup() { setup() },
	end() {
        gamePlayState.playEnded = true;
        bullets.delete();
        bullets = undefined;
        Aoids.bullets = undefined;
        gamePlayState.bases.delete();
        gamePlayState.bases = undefined;
        rocks.delete();
        rocks = undefined;
        pickups = undefined;
        bonuses = undefined;
        scoreDisplay.delete();
        scoreDisplay = undefined;
        ship.delete();
        ship = undefined;
        VIEW_MODES.viewLocked = false;
        flasher("play ended")
    },
	start(fromIntro) {
        gamePlayState.playEnded = false;
        start(fromIntro);
        flasher("GO!", 500)
    },
	resized() {
		viewOffsetRange.x = renderer.width * currentViewOffset.amount;
		viewOffsetRange.y = renderer.height * currentViewOffset.amount;
		overlayView.origin.x = renderer.width / 2;
		overlayView.origin.y = renderer.height / 2;
		overlayView.update(renderer.width, renderer.height);;
	},
	updatePaused(time) {
		doIO(false);
		view.update(renderer.width, renderer.height);
	},
	update(time) {
        if (gamePlayState.playEnded) { return }
		buffers.draw.clear();
		buffers.fx.clear();
		buffers.drawB.clear();
		buffers.overlay.clear();
		buffers.overlayB.clear();
        gamePlayState.update();
		doIO()
		ship.update();
		if(ship.points) {
			const add = ship.points ** 0.2 + 1 | 0;
			ship.points -= add;
			if(ship.points < 0) {
				ship.points = 0;
			}
			score += add;
			scoreDisplay.value = score;
		}
		rocks.update();
        bullets.update();

        bullets.each(bulletVRocks);
		pickups.update();
		bonuses.update();
		FXs.update();
        bullets.updateSprites();

        gamePlayState.bases.update();
		scoreDisplay.update(10, 10);
        if(gamePlayState.viewMode === VIEW_MODES.gameOver) {
            view.origin = viewOffsetReal
                    .chase(
                        viewOffset.zero(),
                        viewOffsetChase,
                        currentViewOffset.chaseA,
                        currentViewOffset.chaseB
                    )
        } else if(gamePlayState.viewMode === VIEW_MODES.baseInspect) {
            !ship.inspecting  && (viewOffsetBaseInspect.holding--);
            ship.inspectingNext === true && (viewOffsetBaseInspect.holding = 0, ship.inspectingNext = false);
            const cVO = currentViewOffset;
            if (cVO.base) {
                wV1.copyOf(cVO.base.attached.attachedTo);
                wV3.copyOf(cVO.base).sub(wV1);
                if (cVO.retarget) {
                    viewShipPos.sub(wV1, wV2);
                    cVO.distR = wV2.length;
                    cVO.angR = cVO.base.attached.attachedTo.r + cVO.base.attached.angle  + wV3.angleTo(wV2);
                    cVO.retarget = false;
                Aoids.logger.log("Ang: " + cVO.angC.toFixed(3) + " Dist: " + cVO.dist.toFixed(3));
                }
                cVO.dist = wV3.length
                cVO.ang = cVO.base.attached.attachedTo.r + cVO.base.attached.angle;
            }
            cVO.distR += (cVO.distC = (cVO.distC += (cVO.dist - cVO.distR) * cVO.distAccel) * cVO.distDrag);
            cVO.angR += (cVO.angC = (cVO.angC += (cVO.ang - cVO.angR) * cVO.angAccel) * cVO.angDrag);


            view.origin = viewShipPos.chase(viewOffset
                    .copyOf(cVO.base.attached.attachedTo).addPolar(cVO.angR , cVO.distR),
                    viewOffsetChase,
                    currentViewOffset.chaseA,
                    currentViewOffset.chaseB
                );

        } else if(gamePlayState.viewMode === VIEW_MODES.normal) {
            view.origin = viewShipPos
                .copyOf(ship)
                .add(viewOffsetReal
                    .chase(viewOffset
                        .zero().addPolarVec(ship.r , viewOffsetRange.scale(view.invZoom, wV1)),
                        viewOffsetChase,
                        currentViewOffset.chaseA,
                        currentViewOffset.chaseB
                    )
                );
         } else {
            view.origin = viewShipPos
                .copyOf(ship)
                .add(viewOffsetReal
                    .chase(viewOffset
                        .zero().addPolarVec(Math.atan2(mouse.wy - ship.y, mouse.wx - ship.x) , viewOffsetRange.scale(view.invZoom, wV1)),
                        viewOffsetChase,
                        currentViewOffset.chaseA,
                        currentViewOffset.chaseB
                    )
                );
         }
         ship.updateSprites();
		//view.origin = ship;
		view.update(renderer.width, renderer.height);
        if(rocks.incoming) {
            if (gamePlayState.inPlay && gamePlayState.incomingWarningTime < time) {
                Aoids.flasher("INCOMING!!",2000);
                gamePlayState.incomingWarningTime = time + 10000;
            }
        } else {
            if (gamePlayState.inPlay && gamePlayState.incomingWarningTime > 0) {
                Aoids.flasher("All clear.",2000);
                gamePlayState.incomingWarningTime = 0;
            }
        }

        //Aoids.text.drawString("Testing the bitmap font! Did it work? 1234567890. \"with Qotes\"", 100,100,2);

        //if (Math.random() < 0.04) {
        //    Aoids.text.info("A random number: " + Math.random(),renderer.width / 2 | 0, 0, 2, 0xFFFFFFFF, Aoids.text.align.center, 120);
        //}
        Aoids.text.update();
		//flasher(ship.pickups +"");
	},
	render() {
        if (gamePlayState.playEnded) { return }
        const sprites = buffers.draw.shader;
        const overlay = buffers.overlay.shader;
		Aoids.debugCanvas && Aoids.debugCanvas.useView(view);
		background.draw(renderer, view);

		renderer.depthModes.lessEqual();
		renderer.blendModes.standard();
		sprites.soilTexture();
		if (sprites.use(view)) {
            sprites.draw(0);
            renderer.blendModes.lighten();
            sprites.use(view) && sprites.draw(1);
            renderer.depthModes.off();
            renderer.blendModes.standard();
            sprites.use(view) && sprites.draw(2);
        }
		overlay.soilTexture();
		if(overlay.use(overlayView)) {
            overlay.draw(0);
            renderer.blendModes.lighten();
            overlay.use(overlayView) && overlay.draw(1);
        }
	},
}
export {play};