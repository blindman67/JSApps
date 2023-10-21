const MAX_PLAYFIELD_SCALE = 7;
const MASS_SCALE = 1 / 10;
const ROCK_GLOW_START = 161;
const METAL_GOLD_IDX = 0, METAL_YELLOW_IDX = 0;  // AKA gold
const METAL_GREEN_IDX = 1;
const METAL_CYAN_IDX = 2;
const METAL_BLUE_IDX = 2; // same as cyan
const METAL_RED_IDX = 3;
const METAL_BONUS_IDX = 4;

const HAB_COST_CHEAT = 0;
const UPGRADE_COST_CHEAT = 0;
const HAB_HP_CHEAT = 0.1; // low weeker habs
const METAL_ODDS_CHEAT = 2; // increases odds by this factor
const BASE_METAL_CHEAT = 0; // adds to base metal stored and max storable

const data = {
	keyboardKeys: [
		"ArrowLeft",  // thrust turn left
		"KeyA",       // thrust turn left
		"ArrowRight", // thrust turn right
		"KeyD",       // thrust turn right
		"ArrowUp",    // thrust forward
		"KeyW",       // thrust forward
		"ArrowDown",  // thrust back
		"KeyS",       // thrust back
		"KeyG",
		"KeyX",  // Used in debug modes (could be anything if at all);
		"KeyQ",  // Used in testing, cycles ship types.
        "KeyC",  // Toggle docking mode view.. This docking mode view puts the docking port in view for easier landings
        "KeyR",  // Toggle radar
        "KeyE",  // Establish orbit.  This will be a flight control bonus that changes speed to orbit
		"KeyF",  // when pause frame step
		"KeyP",  // pause
		"Space", // stop physics of ship
		"Escape", // return to start state
		"Home", // toggle debug canvas display data
		"anyKey",
	],
    game: {
        lives: 30,
        shipConfig: "basic",
        startRockWaveName: "start",
        introText: [
            "Welcome to AOIDS",
            "Click to initiate hyperspace...",
            "Use weapons to smash ROCKS",
            "Build a base.",
            "Mine metals, expand your base and upgrade your ship",
            "Mine metals, expand your base and upgrade your ship",
            "Protect your base from incoming rocks.",
            "Install base defences.",
            "Prepare for the unknown.",
            "Click to initiate hyperspace and begin your adventure...",
            "Click to initiate hyperspace and begin your adventure..."
        ],
        hyperspaceText: ["Punch it!", "...", "Almost", "there..."],  // Must contain 4 strings
        instructionText: {
            level1: [
                "Welcome to sector Zero Zero One!",
                "Your ship is in orbit of a prospective base.",
                "For first time pilots please hold for instructions.",
                "Ex pilots, middle button any time to start.",
                "Ex pilots, middle button any time to start.",
                "Use the mouse wheel to zoom in and out.",
                ["Zoom in to continue.", "zoomIn"],
                ["OK now zoom out.", "zoomOut"],
                "Very good. You can zoom in and out any time as you play.",
                "You are equiped with Two plasma blasters.",
                "As you gain experiance you will be able to upgrade your weapons.",
                ["Fire a few rounds (left mouse button) to continue", "fire"],
                "To turn your ship will face towards your mouse.",
                ["Turn you ship 360 deg twice to continue.", "turn"],
                "You have limited fuel to power your ship.",
            ],
        }

    },
	playfield: {
		width: 1024 * 255,
		height: 1024 * 255,
		widthInit: 1024 * 100,
		heightInit: 1024 * 100,
		scale: MAX_PLAYFIELD_SCALE,
		spawnScale: 0.1,  // playfield size scaled by then object are respawned to keep them within this scaled dist of play
		maxZoom: 4,
		minZoom: 1 / MAX_PLAYFIELD_SCALE,
		zoomRate: 1.01,
		viewOffset: {

			amount: 1 / 4,    // amount of offset relative to screen. Must be < 1/2 or ship will be out of screen
			chaseA: 0.02,  // View origincurve acceleration
			chaseD: 0.04,  // View origin curve drag
            zoomA: 0.5, // Zoom curve acceleration
            zoomD: 0.5, // Zoom curve drag
            defaultZoom: 1 / MAX_PLAYFIELD_SCALE,
		},
        viewOffsetDocking: {  // Use Key C to toggle docking mode view
			amount: 1 / 5,    // scaling of docking port distance to zoom. If 1 then ship and docking port will fit centers to shortest screen axis. 0 < amount < 1 smalled will zoom out
			chaseA: 0.01,
			chaseD: 0.6,
            zoomA: 0.05,
            zoomD: 0.6,
            maxDist: 4048,    // ship must be within this distance of docking port for Docking mode view to activate
            defaultZoom: 1 ,
		},
        viewOffsetDocked: {
			amount: 1 / 4,
			chaseA: 0.01,
			chaseD: 0.6,
            zoomA: 0.4,
            zoomD: 0.6,
            defaultZoom: 0.25 ,
		},
        viewOffsetBaseInspect: {
            holdViewFor: 160, // number of frames to keep view befor switch back to docked
            holding: 0,
            ang: 0,
            angR: 0,
            angC: 0,
            angAccel: 0.1,
            angDrag: 0.1,
            dist: 10,
            distR: 10,
            distC: 0,
            distAccel: 0.3,
            distDrag: 0.3,
            retarget: false,
			amount: 0.01,
			chaseA: 0.2,
			chaseD: 0.2,
            zoomA: 0.4,
            zoomD: 0.6,
            defaultZoom: 0.25 ,
		},
        viewOffsetFromHyper: {  // Use Key C to toggle docking mode view
			amount: 1 / 6,    // scaling of docking port distance to zoom. If 1 then ship and docking port will fit centers to shortest screen axis. 0 < amount < 1 smalled will zoom out
			chaseA: 0.013,
			chaseD: 0.016,
            zoomA: 0.05,
            zoomD: 0.3,
            defaultZoom: 1,
            viewModeDelay: 4000, // ms to wait for view to locate player after hyper space intro
		},
	},
	background: {
		numPoints: 1000,
		numColorPoints: 16,
		minZIndex: 0.3,
		maxZIndex: 0.8,
		minColorZIndex: 0.55,  // nebular
		maxColorZIndex: 0.95,
		minSize: 4, //* MAX_PLAYFIELD_SCALE,
		maxSize: 32, //* MAX_PLAYFIELD_SCALE,
		minColorSize: 2000,
		maxColorSize: 3652,
		nebularColors: [0xFFFF8080, 0xFFFF8880, 0xFF101080, 0xFF8088FF, 0xFF1010FF], // neg 255 zero 0 positive 255 are 0,128,255
		skyImage: "./media/aoids_skyB1.png",
		gravConstant: 0.00005,

	},
	rocks: {
        keepAliveDist: 1024 * 10, // small rocks die if past this dist from target (ship)
        metalClaimTime: 300, // number of frame that minerals can be claimed from a rock that you hit (bumped into, hit with weapon)
		maxCount: 250 * 3,  					// approx only
		minScale: 0.5,
		maxScale: 1.5,
		scaleCurve: 5,      				// curve for scale. v > 1 more small rocks than large, less than 1 and greater than 0 more large than small
		massScale: MASS_SCALE,  			// scales rock mass. The smaller this number to easier it is to push rocks around.
		orbitDrag: 0.005,                   // the amount rock is dragged to a circular orbit per frame
      //  deorbitDrag: 0.06,                  // the amount rock is slowed in orbit (bringing it closer to home)
        deorbitDrag: 0.15,                  // the amount rock is slowed in orbit (bringing it closer to home)
       // deorbitDragScale: 2,                // As rocks get close to home orbit dedrag is scaled to lift rock. Must be > 1. The larger the value the higher the final stable oribit
        deorbitDragScale: 0.02,                // As rocks get close to home orbit dedrag is scaled to lift rock. Must be > 1. The larger the value the higher the final stable oribit
		respawnOdds: 1 / 2,
		maxMetal: 1000, 					// count of metals. Approx only
		metalOdds: Math.min(0.9, (1 / 3) * METAL_ODDS_CHEAT),  				// WARNING MUST BE LESS THAN 1 !!!!!  Odds that a breaking rock will produce metals for pickup
		metalLife: 120, 					// in frames approx only

		bonusOdds: Math.min(0.9, (1 / 150) *  METAL_ODDS_CHEAT),  				// Odds that a breaking rock will produce bonus
		smashAngles: [0,1, 0, 1, 0], // Angle away from center break 1 === 90deg
		bonusColor: 0xFFFF7700,
		bonusColorAccent: 0xFFFF77FF,
		orbits: {
            start: [{
				minDist: 7000,
				maxDist: 12000,
				count: 200,
                scales: [1.75,1.5],    // randomly selected scales
                hpScale: 2,           // per scale point
				colors: [0xFF778877, 0xFF667766, 0xFF556655],
                deDrag:  0.001,
                drag: 0.005,
                dedragScale: 0,
                metalOdds: Math.min(0.9, (1 / 3) * METAL_ODDS_CHEAT),
   		        bonusOdds: Math.min(0.9, (1 / 150) *  METAL_ODDS_CHEAT),  				// Odds that a breaking rock will produce bonus
                smash: true, // if a rock is split it get split to many parts
                next: "gathering",
			}],
            gathering: [{
				minDist: 40000,
				maxDist: 40000,
                useSiblings: false, // only for distant rocks. When true all smashed parts of rocks are removed from sim while not visible
				count: 5,
                scales: [5],    // randomly selected scales
                hpScale: 166,           // per scale point
				colors: [0xFF442222, 0xFF554433, 0xFF664444],
                deDrag:  0.15,
                drag: 0.005,
                dedragScale: 0.02,
                metalOdds: Math.min(0.9, (1 / 1.5) * METAL_ODDS_CHEAT),
        		bonusOdds: Math.min(0.9, (1 / 100) *  METAL_ODDS_CHEAT),  				// Odds that a breaking rock will produce bonus

                next: "farAway",
			}],
            farAway: [{
				minDist: 120000,
				maxDist: 120000,
				count: 1,
                useSiblings: true, // only for distant rocks. When true all smashed parts of rocks are removed from sim while not visible
                scales: [10],    // randomly selected scales
                hpScale: 166,           // per scale point
				colors: [0xFF002222, 0xFF004433, 0xFF004444],
                deDrag:  0.15,
                drag: 0.005,
                dedragScale: 0.02,
			}],
            incoming: [{

            }]
		},
		metalTypes: {
			gold: {

                idx: METAL_GOLD_IDX,
                colMask: 0xFF00FFFF,
                odds: 20,     // odds over 1 in metal types not bonus
                baseMax: 250, // default max for base
                name: "Yellow metal",
            },
			green: {
                idx: METAL_GREEN_IDX,
                colMask: 0xFF00FF00,
                odds: 10,     // odds over 1 in metal types not bonus
                baseMax: 250, // default max for base
                name: "Green metal",
            },
			cyan: {
                idx: METAL_CYAN_IDX,
                colMask: 0xFFFFFF00,
                odds: 5,        // odds over 1 in metal types not bonus
                baseMax: 250,   // default max for base
                name: "Blue metal",
            },
			ruby: {
                idx: METAL_RED_IDX,
                colMask: 0xFF0000FF,
                odds: 2,        // odds over 1 in metal types not bonus
                baseMax: 250,   // default max for base
                name: "Red metal",
            },
            bonus: {  // this is a temp code fix
                colMask: 0xFFAAAAAA,  // not a mask
                baseMax: 200, // default max for base
                name: "Bonus metal",
            },
		},
        metalTypeSel: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 1,1,1,1,1,1,1,1,1,1, 2,2,2,2,2, 3,3,3],

	},
	prizes: {
		astronautCount: 2,
		astronautScore: 20000,
		bonusColors: [0xFFFF6666, 0xFF66FF66, 0xFF6666FF, 0xFFFFFF66, 0xFF66FFFF, 0xFFFF66FF],
		metalTypePoints: [2,4,8,16],
        landingScore: 200,

	},
	shipTech: {
        names: {
            rechargeRateName: "Recharge rate ",
            coilMaxName: "Charge coils ",
            lanceName: "Lancing",
        },
		hulls: {
			basic: {
				display: {
					small: {
						bodySprite: "shipBody",
						spriteLists: {
							pannel: "shipDisplayPannel",
						},
						draw: [
                            // items marked procedural must remain in the same order
							{sprIdx: "shipBody", color: 0xFFFFFFFF, z: 0.09},
							{sprIdx: "pilotBody",    py: -24, color: 0xFFFFFFFF, z: 0.09},
							{sprIdx: "pilotForearm", procedural: true, px: -13, py: -21, sx:  1, color: 0xFFFFFFFF, z: 0.09},
							{sprIdx: "pilotForearm", procedural: true, px:  13, py: -21, sx: -1, color: 0xFFFFFFFF, z: 0.09},
							{sprIdx: "pilotArm",     procedural: true, px: -7, py: -18, cx: 8.5 / 12, cy: 9.5 / 13, sx:  1, color: 0xFFFFFFFF, z: 0.09},
							{sprIdx: "pilotArm",     procedural: true, px:  7, py: -18, cx: 8.5 / 12, cy: 9.5 / 13, sx: -1, color: 0xFFFFFFFF, z: 0.09},
							{sprIdx: "pilotHead",    procedural: true, color: 0xFFFFFFFF, z: 0.09}, // out of position procedural will move it to correct position -15
							{
								sprIdx: "shipDisplayPannel.0", cx: 0.5, cy: 0.5, py: -42.5, z: 0.09, color: 0xFFFFFFFF,
								animate: {
									sprites: "pannel",
									rate: 30,
									method: "randomSprite",
								},

							},
							{sprIdx: "shipCockpit", color: 0xFFFFFFFF, z: 0.08},
							{sprIdx: "shipBumper", cx: 0.5, py: -76, color: 0xFFFFFFFF, z: 0.08},
						],
						fx: [
						]
					}
				},
				small: {
					name: "My Ship",
					turnAccel: 0.6,         // Reaction control curves
					turnDrag: 0.01,
					spaceDrag: 0.002,        // controls ship max speed
					mass: 64 ** 3 * Math.PI * MASS_SCALE,
					explodeTime: 120,        // Number of frames for ship to explode
					pickupConstantG: 1000000,// 1000000, // attraction of pickup items to ship
                    smokeDamage: 200,       // above this damage and a smoke FX is started
					maxDamage: 400,         // amount of damage the ship can take befor exploding.
                    dockedRepair: {metal: true, metalType: METAL_YELLOW_IDX, amount: 1, fix: -10}, // sent to base buy function

				},
			},
			alienSmall: {
				display: {
					small: {
						bodySprite: "alienShipBody.0",
						draw: [
							{sprIdx: "alienShipBody.0", z: 0.09},
							{sprIdx: "alienShipBody.1", z: 0.08}, // glass and covers
						],
						fx: []
					}
				},
				small: {
					name: "Alien",
					turnAccel: 0.6,         // Reaction control curves
					turnDrag: 0.01,
					spaceDrag: 0.002,        // controls ship max speed
					mass: 64 ** 3 * Math.PI * MASS_SCALE,
					explodeTime: 16,        // Number of frames for ship to explode
                    smokeDamage: 200,       // above this damage and a smoke FX is started
					maxDamage: 400,         // amount of damage the ship can take befor exploding.
                    dockedRepair: {metal: true, metalType: METAL_YELLOW_IDX, amount: 1, fix: -10}, // sent to base buy function
				},
			},
		},
		powers: {
            simple: { // used by NPCs
 				inboard: {
					mass: 166400 * MASS_SCALE,
				}
            },
			fuelCell: {
				inboard: {
					mass: 166400 * MASS_SCALE,
					fuel: 10000,  // fuel
					fuelMaxMetalUpgrade: 0,
                    reservePower: 100,  // this is fuel suppllied when no fuel left (to get home)
					FER: 2,  // Fuel efficency rating. higher is better
					output: 1000,  // max output in power. power = fuel * FER
                    dockedRefill: {metal: true, metalType: METAL_GREEN_IDX, amount: 1, fuel: 500}, // sent to base buy function
				}
			},
		},
		guns: {
			alienSmall: {
				display: {
					outboard_left: {
                        bodyIdx: 0, // idx into this.sprites
						bodyX: -103,
						chargeVentX: -74.5,
						sprites: ["alienShipBody.7"],
						FXSprites: ["alienShipBody.10"],
						overlaySprites: [],
					},
					outboard: {
                        bodyIdx: 0, // idx into this.sprites
						bodyX: -103,
						chargeVentX: -74.5,
						sprites: ["alienShipBody.8"],
						FXSprites: ["alienShipBody.10"],
						overlaySprites: [],
					},
				},
				outboard: {
					name: "Plasma gun",
					bulletType: "plasma",
					mass: 104088 * MASS_SCALE,
					lance: 1,
					rechargeRate: 20,  // base rate in frames (60 FPS)
					coilMax: 100,
				},
            },
			plasma: {
				display: {
					inboard: {
                        barrelIdx: 0, // idx into this.sprites
						barrelX: -38,
                        barrelZoffset: 0,
						sprites: ["gunPlasma.barrelR"],
						FXSprites: [],
						overlaySprites: [],
                        z: 0.12,
					},
					outboard_left: {
                        barrelIdx: 0, // idx into this.sprites
                        bodyIdx: 1, // idx into this.sprites
						barrelX: -38,
                        recoil: 25,
                        recoilFlash: 37,
						bodyX: -103,
						chargeVentX: -74.5,
						dischargeVentX: -139,
						sprites: ["gunPlasma.barrelL", "gunPlasma.left"],
						FXSprites: ["gunPlasma.charge", "gunPlasma.dischargeL"],
						overlaySprites: [],
					},
					outboard: {
                        barrelIdx: 0, // idx into this.sprites
                        bodyIdx: 1, // idx into this.sprites
						barrelX: -38,
                        recoil: 25,
                        recoilFlash: 37,
						bodyX: -103,
						chargeVentX: -74.5,
						dischargeVentX: -139,
						sprites: ["gunPlasma.barrelR", "gunPlasma.right"],
						FXSprites: ["gunPlasma.charge", "gunPlasma.dischargeR"],
						overlaySprites: [],
					},
				},
				inboard: {
					name: "Plasma gun",
					bulletType: "plasma",
					mass: 27588 * MASS_SCALE,
					PER: 5,  // Power efficency rating. Smaller uses less power
					lance: 1,
                    lanceMax: 8,
                    damage: 8,
					rechargeRate: 0, // frames to recharge is  (18 - rechargeRate)
					coilMax: 100,



				},
				outboard: {
					name: "Plasma gun",
					bulletType: "plasma",
					mass: 104088 * MASS_SCALE,
					PER: 5,  // Power efficency rating
					lance: 1,
                    lanceMax: 8,
                    damage: 8,
					rechargeRate: 0,  // frames to recharge is  (18 - rechargeRate)
					coilMax: 200,
                    converg: true,


				},
			},
			ion: {
				display: {

					inboard: {
                        barrelIdx: 0, // idx into this.sprites
						barrelX: -38,
						coilStatusSprScale: 1,
						coilStatusColor: 0xFFDD8899,
						coilStatusBarX: 40,
						coilStatusBarY: 150,
                        barrelZoffset: 0,

						sprites: ["gunIon.barrelR"],
						FXSprites: ["gunIon.blast"],
						overlaySprites: [],
					},
					outboard_left: {
                        barrelIdx: 0, // idx into this.sprites
                        bodyIdx: 1, // idx into this.sprites
						barrelX: -38,
                        recoil: 25,
                        recoilFlash: 37,
						bodyX: -103,
						chargeVentX: -74.5,
						dischargeVentX: -139,
						coilStatusSprScale: 1,
						coilStatusColor: 0xFFDD8899,
						coilStatusBarX: 50,
						coilStatusBarY: 150,
						sprites: ["gunIon.barrelL", "gunIon.left"],
						FXSprites: ["gunIon.charge", "gunIon.dischargeL"],
						overlaySprites: ["leftBar"],
					},
					outboard: {
                        barrelIdx: 0, // idx into this.sprites
                        bodyIdx: 1, // idx into this.sprites
						barrelX: -38,
                        recoil: 25,
                        recoilFlash: 37,
						bodyX: -103,
						chargeVentX: -74.5,
						dischargeVentX: -139,
						coilStatusSprScale: -1,
						coilStatusColor: 0xFFDD8899,
						coilStatusBarX:90,
						coilStatusBarY: 150,
						sprites: ["gunIon.barrelR", "gunIon.right"],
						FXSprites: ["gunIon.charge", "gunIon.dischargeR"],
						overlaySprites: ["leftBar"],
					},
				},
				inboard: {
					name: "Ion gun",
					bulletType: "ion",
					mass: 27588 * MASS_SCALE,
					PER: 9,  // Power efficency rating
					lance: 1,
                    lanceMax: 8,
                    damage: 12,
					rechargeRate: 0,
					coilMax: 200,

				},
				outboard: {
					name: "Ion gun",
					bulletType: "ion",
					mass: 104088 * MASS_SCALE,
					PER: 9,  // Power efficency rating
					lance: 1,
                    lanceMax: 8,
                    damage: 12,
					rechargeRate: 0,
					coilMax: 200,
                    converg: true,


				},
			},
			lazer: { // only mounts 1 out board per wing
				display: {
					outboard_left: {
                        bodyIdx: 0, // idx into this.sprites
						bodyX: -74,
						chargeVentX: -115,
                        chargeVentY: -0.5,
						dischargeVentX: -37,
						dischargeVentY: -0.5,
                        muzzelOffsetX: -54,
                        muzzelOffsetY: 0.5,
						sprites: ["gunLaz.left"],
						FXSprites: ["gunLaz.chargeL", "gunLaz.discharge",],
						overlaySprites: [],
					},
					outboard: {
                        bodyIdx: 0, // idx into this.sprites
						bodyX: -74,
						chargeVentX: -115,
						chargeVentY: -0.5,
                        dischargeVentX: -37,
                        dischargeVentY: -0.5,
                        muzzelOffsetX: -54,
                        muzzelOffsetY: -0.5,
						sprites: ["gunLaz.right"],
						FXSprites: ["gunLaz.chargeR", "gunLaz.discharge",],
						overlaySprites: [],
					},
				},
				outboard: {
					name: "Lazer gun",
					bulletType: "lazer",
					mass: 104088 * MASS_SCALE,
					PER: 9,  // Power efficency rating
					lance: 1,
                    lanceMax: 8,
                    damage: 4,
					rechargeRate: 0,
					coilMax: 1200,
					upgrades: [
						{PER: 8, message: "GUN POWER UPGRADED!" },
					],
				},
			},
			missile: { // only mounts 1 out board per wing
                powerTypes: [{  // divides bullet power by 200 and then indexs this array
                        spriteIdxs: [5, 2, 1], // indexes gunMis.bullets and gunMis.sparks
                        fuel: 50,
                        mass: 100,
                        thrust: 140,
                    },{
                        spriteIdxs: [4, 2, 1],
                        fuel: 150,
                        mass: 50,
                        thrust: 140,
                    },{
                        spriteIdxs: [3, 2, 1],
                        fuel: 200,
                        mass: 300,
                        thrust: 140,
                    },{
                        spriteIdxs: [0, 0, 1],
                        fuel: 160,
                        mass: 70,
                        thrust: 130,
                    },{
                        spriteIdxs: [1, 0, 1],
                        fuel: 400,
                        mass: 400,
                        thrust: 310,
                    },{
                        spriteIdxs: [0, 0, 1],
                        fuel: 100,
                        mass: 200,
                        thrust: 10,
                    },
                ],
				display: {
					outboard_left: {
                        bodyIdx: 1, // idx into this.sprites
                        barrelIdx: 0, // idx into this.sprites
                        barrelZoffset: 0.02,

						barrelX: -107,
						barrelY: 11,

						bodyX: -107,
                        bodyY: 11,
                        muzzelOffsetX: -92,
                        muzzelOffsetY: 6,
						sprites: ["gunMis.barrelL", "gunMis.left"],
						FXSprites: [],
						overlaySprites: [],
					},
					outboard: {
                        bodyIdx: 1, // idx into this.sprites
                        barrelIdx: 0, // idx into this.sprites
                        barrelZoffset: 0.02,
                        barrelX: -107,
                        barrelY: 11,
						bodyX: -107,
						bodyY: 11,
                        muzzelOffsetX: -92,
                        muzzelOffsetY: -6,
						sprites: ["gunMis.barrelR", "gunMis.right"],
						FXSprites: [],
						overlaySprites: [],
					},
				},
				outboard: {
					name: "Missile launcher",
					bulletType: "Missile",
                    useTargetingComputer: true,
                    hasAmo: true,  // when true gun creates a magazine and allocated bullets
                    magSize : 15,  // size of magazine is hasAmo is true
                    magVisible: 5, // vissible bullets in mag per frame
                    magOffsetX: 0,  // offset to each mag hard point
                    magOffsetY: 8,
					mass: 104088 * MASS_SCALE,
					PER: 1,  // Power efficency rating
					lance: 5,  // number missiles
                    damage: 16 * 2,
					rechargeRate: 0,
					coilMax: 200,

					upgrades: [
						{PER: 8, message: "GUN POWER UPGRADED!" },
					],
				},
			},
		},
		shields: {
			ion: {
				display: {
					reactor: { sprites:[], FXSprites:["shipShield"], scale: 2, colors: [0xFF0000, 0xFF8800, 0xFFFF88]},
					plate: { sprites:[], FXSprites:["shipShield"], scale: 2},
				},
				reactor: { //
					mass: 15239 * MASS_SCALE,
					powerLevels: [0.5, 0.6, 0.7], // visual fx
					maxPower: 100,
                    damageFactor: 0.5, // reduces damage by damageFactor
                    ringDown: 0.95, // rate at which shields can power down. Smaller is quicker
                    ionizingInterupt: 0.5, // Shield output from 1 to 0. ionizingInterupt is when engines and weapons are avalible again
					PER: 1,  // Power efficency rating. Smaller is better (less power per unit shield protection)
				},
				plate: {
					mass: 4000 * MASS_SCALE,
					powerLevels: [[0.5, 0.75, 1]],
					maxLevel: 1, // sum of powerLevels
                    damageFactor: 0.1, //  reduces damage by damageFactor
                    ringDown: 0.95, // rate at which shields can power down. Smaller is quicker
					maxPower: 10,
					PER: 5,  // Power efficency rating. Smaller is better (less power per unit shield protection)

				},
			}
		},
		thrusters: {
			CuIon: {
				display: {
					reaction: {cx: 1, direction: Math.PI, sprites:[], FXSprites:["shipThrusterForwardRight"]},
					reaction_left: {cx: 1, direction: Math.PI, sprites:[], FXSprites:["shipThrusterForwardLeft"]},
					reactionRear: {cx: 0, direction: 0, sprites:[], FXSprites:["shipThrusterBackLeft"]},
					propulsion: {cx: 0, direction: 0, sprites:[], FXSprites:["shipThrust"]},
				},
				reaction: {
					mass: 1792 * MASS_SCALE,
					thrust: 13000, // pixels per kilogram
					PER: 5,  // Power efficency
					powerCurve: 1/1.5,
					injectorRamp: 0.1,
					injectorCool: 0.5,
					injectorA: 0.5,  // Post fix A is second curve acceleration
					injectorD: 0.4,  // Post fix D is second curve drag
					reactionA: 0.5,  // Post fix A is second curve acceleration
					reactionD: 0.4,  // Post fix D is second curve drag
				},
				reactionRear: {
					mass: 5239 * MASS_SCALE,
					thrust: 16000, // pixels per kilogram
					PER: 4,  // Power efficency
					powerCurve: 1/1.5,
					injectorRamp: 0.1,
					injectorCool: 0.5,
					injectorA: 0.5,  // Post fix A is second curve acceleration
					injectorD: 0.4,  // Post fix D is second curve drag
					reactionA: 0.5,  // Post fix A is second curve acceleration
					reactionD: 0.4,  // Post fix D is second curve drag
				},
				propulsion: {
					mass: 359948 * MASS_SCALE,
					thrust:100000, // pixels per kilogram
					PER: 200,  // Power efficency
					powerCurve: 1.5,
					injectorRamp: 0.01,
					injectorCool: 0.95,
					injectorA: 0.1,  // Post fix A is second curve acceleration
					injectorD: 0.8,  // Post fix D is second curve drag
					reactionA: 0.2,  // Post fix A is second curve acceleration
					reactionD: 0.7,  // Post fix D is second curve drag

                    injectorA: 0.5,  // Post fix A is second curve acceleration
					injectorD: 0.5,  // Post fix D is second curve drag
					reactionA: 0.5,  // Post fix A is second curve acceleration
					reactionD: 0.5,  // Post fix D is second curve drag
				},
			},
		},
		getByHardPoint(hardPoint) { return data.shipTech[hardPoint.type + "s"][hardPoint.name][hardPoint.point] },
		getByNamed(type, name, point) { return data.shipTech[type + "s"][name][point]; },
		getByMount(mount, optionName) { // nameOptionIdx = 0) {
			const t = data.shipTech[mount.type + "s"];
			const named = t[optionName];
			var display, tech;
			if (named) {
				if (named.display) {
					display = mount.display ? named.display[mount.point + "_" + mount.display] : named.display[mount.point];
					if(display) {
						if (display.draw) {
							namesToIdx(display.draw, "sprIdx", data.spriteSheet);
							namesToIdx(display.fx, "sprIdx", data.spriteSheet);
							namesToIdx(display.overlay, "sprIdx", data.overlaySpriteSheet);
							display.bodySprite = data.spriteSheet.nameToIdx(display.bodySprite);
							for (const [key, value] of Object.entries(display.spriteLists)) {
								if (typeof value === "string") {
									display.spriteLists[key] = data.spriteSheet.nameToIdx(value);
								} else if(Array.isArray(value)) {
									namesToIdx(display.spriteLists[key], undefined, data.spriteSheet);
								}
							}
						} else {
							namesToIdx(display.sprites, undefined, data.spriteSheet);
							namesToIdx(display.FXSprites, undefined, data.spriteSheet);
							namesToIdx(display.overlaySprites, undefined, data.overlaySpriteSheet);
						}
					}
				}
				tech = named[mount.point];
			}
			return {tech, display};
		},
	},
	ships: {
		basic: {
            maxMetals: [200,200,200,200,20],
			mounts: {
				hull: 				{type: "hull",   z: 3,                   point: "small",                        names: ["basic"]},
				power: 				{x:0,   y:    0, z: 6, type: "power",    point: "inboard",                      names: ["fuelCell"]},
				shield: 			{x:0,   y:    0, z: 7, type: "shield",   point: "reactor",                      names: ["ion"]},
				gunMid: 			{x:120, y:    0, z: 0, type: "gun",	     point:  "inboard", 					names: ["plasma", "ion"]},
				gunWingOutLeft: 	{x: 74, y: -103, z: 1, type: "gun",	     point: "outboard", display: "left",    names: ["plasma", "ion"]},
				gunWingOutRight: 	{x: 74, y:  103, z: 1, type: "gun",	     point: "outboard", 					names: ["plasma", "ion"]},
				gunWingLeft: 	    {x: 86, y:  -81, z: 2, type: "gun",	     point: "outboard", display: "left",    names: ["plasma", "ion", "lazer", "missile"]},
				gunWingRight:   	{x: 86, y:   81, z: 2, type: "gun",	     point: "outboard", 					names: ["plasma", "ion", "lazer", "missile"]},
				reactionFowardLeft: {x: 13, y:  -38, z: 4, type: "thruster", point: "reaction",  display: "left",	names: ["CuIon"]},
				reactionFowardRight:{x: 13, y:   38, z: 4, type: "thruster", point: "reaction", 					names: ["CuIon"]},
				reactionBackLeft: 	{x:-42, y:  -56, z: 4, type: "thruster", point: "reactionRear", 				names: ["CuIon"]},
				reactionBackRight: 	{x:-42, y:   56, z: 4, type: "thruster", point: "reactionRear", 				names: ["CuIon"]},
				mainThrust: 		{x:-40, y:    0, z: 5, type: "thruster", point: "propulsion" ,				    names: ["CuIon"]},
			},
            upgrades: [
                ["gunMid","gunWingLeft", "gunWingRight","gunWingOutLeft", "gunWingOutRight","power","power","power"],
            ],
            controls: {
                forwardMain: ["mainThrust"],
                forwardSlow: ["reactionBackLeft", "reactionBackLeft"],
                backward:    ["reactionFowardLeft", "reactionFowardRight"],
                left:        ["reactionFowardLeft", "reactionBackRight"],
                right:       ["reactionFowardRight", "reactionBackLeft"],
                fireMain:    ["gunMid","gunWingLeft", "gunWingRight","gunWingOutLeft", "gunWingOutRight"],
                fireSecond:  ["gunWingOutLeft", "gunWingOutRight"],
                shield:      ["shield"],
                power:       ["power"],
                thrusters:   ["mainThrust", "reactionFowardLeft", "reactionFowardRight", "reactionBackLeft", "reactionBackLeft"],
                thrustMain:  ["mainThrust"],
                hull:        ["hull"],
            },
            configurations: {
                basic: {
                    mounts: [
                        "gunWingLeft,plasma",
                        "gunWingRight,plasma",
                        "hull,basic",
                        "power,fuelCell",
                        "mainThrust,CuIon",
                        "reactionFowardLeft,CuIon",
                        "reactionFowardRight,CuIon",
                        "reactionBackLeft,CuIon",
                        "reactionBackRight,CuIon",
                        "shield,ion",
                    ],

                    upgrades: {
                        weapon: {
                            sprite: "weaponSystems",
                            message: "New ship weapon upgrades available.",
                            levels: [
                                { upgrades: [{name: "Recharge", controls: "fireMain", property: "rechargeRate", amount: 1,   qty: 4, costs: [100, 50,20,10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Lance",    controls: "fireMain", property: "lance",        amount: 1,   qty: 2, costs: [50, 100,20,10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Coils",    controls: "fireMain", property: "coilMax",      amount: 100, qty: 2, costs: [20, 50,100,10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Power",    controls: "fireMain", property: "PER",          amount: 1,   qty: 1, costs: [20, 50,100,10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "InboardPlasma",  mount: ["gunMid,plasma"],  qty: 1,  costs: [250, 150, 150, 100, 20].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "QuadPlasma",  mount: ["gunWingOutLeft,plasma", "gunWingOutRight,plasma"],  qty: 1,  costs: [500, 250, 250, 250, 50].map(v => v  * UPGRADE_COST_CHEAT)}] },
                            ],
                        },
                        stores: {
                            sprite: "shipSystems",
                            message: "New ship upgrades available.",
                            levels: [
                                { upgrades: [{name: "Yellow", ship: true, metalType: 0, amount: 150, qty: 1, costs: [100,0,0,0,0].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Green",  ship: true, metalType: 1, amount: 150, qty: 1, costs: [0,100,0,0,0].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Blue",   ship: true, metalType: 2, amount: 150, qty: 1, costs: [0,0,100,0,0].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Red",    ship: true, metalType: 3, amount: 150, qty: 1, costs: [0,0,0,100,0].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                {
                                    upgrades: [
                                        {name: "Yellow", ship: true, metalType: 0, amount: 200, qty: 1, costs: [50,0,0,0,0].map(v => v  * UPGRADE_COST_CHEAT)},
                                        {name: "Green",  ship: true, metalType: 1, amount: 200, qty: 1, costs: [0,50,0,0,0].map(v => v  * UPGRADE_COST_CHEAT)},
                                        {name: "Blue",   ship: true, metalType: 2, amount: 200, qty: 1, costs: [0,0,50,0,0].map(v => v  * UPGRADE_COST_CHEAT)},
                                        {name: "Red",    ship: true, metalType: 3, amount: 200, qty: 1, costs: [0,0,0,50,0].map(v => v  * UPGRADE_COST_CHEAT)},
                                    ]
                                }
                            ],
                        },
                        thrusters: {
                            sprite: "propulsionSystems",
                            message: "New thruster upgrades available.",
                            levels: [
                                { upgrades: [{name: "Power",   message: "Thruster efficency +10",  controls: "thrustMain", property: "PER",          amount: -10,   qty: 1, costs: [120, 50, 20, 10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Power",   message: "Thruster efficency +20",    controls: "thrustMain", property: "PER",          amount: -15,   qty: 2, costs: [120, 50, 20, 10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Power",   message: "Thruster efficency +40",    controls: "thrustMain", property: "PER",          amount: -20,   qty: 3, costs: [120, 50, 20, 10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },
                                { upgrades: [{name: "Power",   message: "Thruster efficency +50",    controls: "thrustMain", property: "PER",          amount: -25,   qty: 4, costs: [120, 50, 20, 10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },


                            ],
                        },
                        power: {
                            sprite: "powerSystems",
                            message: "New Ship power upgrades available.",
                            levels: [
                                { upgrades: [{name: "Power",   message: "Reactor fuel efficency +1",    controls: "power", property: "FER",          amount: 1,   qty: 4, costs: [120, 50, 20, 10,5].map(v => v  * UPGRADE_COST_CHEAT)}] },


                            ],
                        },



                        shipQuadPlasma: {
                            sprite: "shipQuadPlasma",
                        },
                        shipCenterIon: {
                            sprite: "shipCenterIon",
                        },
                        shipDualIon: {
                            sprite: "shipDualIon",
                        },
                        shipQuadIon: {
                            sprite: "shipQuadIon",
                        },
                        shipDualLazer: {
                            sprite: "shipDualLazer",
                        },
                        shipRocketPods: {
                            sprite: "shipRocketPods",
                        },
                    },
                    /*upgrades: [
                        ["shipCenterPlasma","gunMid,plasma"],
                        ["shipDualPlasma","gunWingLeft,plasma","gunWingRight,plasma"],
                        ["shipQuadPlasma","gunWingOutLeft,plasma", "gunWingOutRight,plasma"],
                        ["shipCenterIon", "gunMid,ion"],
                        ["shipDualIon","gunWingLeft,ion","gunWingRight,ion"],
                        ["shipQuadIon", "gunWingOutLeft,ion", "gunWingOutRight,ion"],
                        ["shipDualLazer", "gunWingLeft,lazer","gunWingRight,lazer"],
                        ["shipRocketPods","gunWingLeft,missile","gunWingRight,missile"],
                    ],*/
                },
                // following setup are debug only ships
                plasmaFull: {
                    mounts: [
                        "gunMid,plasma",
                        "gunWingLeft,plasma",
                        "gunWingRight,plasma",
                        "gunWingOutLeft,plasma",
                        "gunWingOutRight,plasma",
                        "hull,basic",
                        "power,fuelCell",
                        "mainThrust,CuIon",
                        "reactionFowardLeft,CuIon",
                        "reactionFowardRight,CuIon",
                        "reactionBackLeft,CuIon",
                        "reactionBackRight,CuIon",
                        "shield,ion",
                    ],
                },
                basicIon: {
                    mounts: [
                        "gunWingLeft,ion",
                        "gunWingRight,ion",
                        "hull,basic",
                        "power,fuelCell",
                        "mainThrust,CuIon",
                        "reactionFowardLeft,CuIon",
                        "reactionFowardRight,CuIon",
                        "reactionBackLeft,CuIon",
                        "reactionBackRight,CuIon",
                        "shield,ion",
                    ],
                },
                ionFull: {
                    mounts: [
                        "gunMid,ion",
                        "gunWingLeft,ion",
                        "gunWingRight,ion",
                        "gunWingOutLeft,ion",
                        "gunWingOutRight,ion",
                        "hull,basic",
                        "power,fuelCell",
                        "mainThrust,CuIon",
                        "reactionFowardLeft,CuIon",
                        "reactionFowardRight,CuIon",
                        "reactionBackLeft,CuIon",
                        "reactionBackRight,CuIon",
                        "shield,ion",
                    ],
                },
                lazerSpecial: {
                    mounts: [
                        "gunWingLeft,lazer",
                        "gunWingRight,lazer",
                        "hull,basic",
                        "power,fuelCell",
                        "mainThrust,CuIon",
                        "reactionFowardLeft,CuIon",
                        "reactionFowardRight,CuIon",
                        "reactionBackLeft,CuIon",
                        "reactionBackRight,CuIon",
                        "shield,ion",
                    ],
                },
                missileSpecial: {
                    mounts: [
                        "gunMid,ion",
                        "gunWingLeft,missile",
                        "gunWingRight,missile",
                        "hull,basic",
                        "power,fuelCell",
                        "mainThrust,CuIon",
                        "reactionFowardLeft,CuIon",
                        "reactionFowardRight,CuIon",
                        "reactionBackLeft,CuIon",
                        "reactionBackRight,CuIon",
                        "shield,ion",
                    ],
                }
            },
		},
        alienSmall: {
			mounts: {
				hull: 				{type: "hull",                     point: "small",                      names: ["alienSmall"]},
				power: 				{x:0,   y:    0, type: "power",    point: "inboard",                    names: ["simple"]},
				gunWingLeft: 	    {x: 86, y:  -81, type: "gun",	   point: "outboard", display: "left",  names: ["alienSmall",]},
				gunWingRight:   	{x: 86, y:   81, type: "gun",	   point: "outboard", 					names: ["alienSmall",]},
				mainThrust: 		{x:-40, y:    0, type: "thruster", point: "propulsion" ,				names: ["AI"]},
			},
            controls: {
                move: ["mainThrust"],
                fire:    ["gunWingLeft", "gunWingRight"],
            },
            configurations: {
                basic: {
                    mounts: [
                        "gunWingLeft,AI",
                        "gunWingRight,AI",
                        "hull,alienSmall",
                        "power,simple",
                        "mainThrust,AI",
                    ],
                },
            },
		},
	},
    habitats: {
        scale: 4,  // scale of habiats in world space
        massScale: MASS_SCALE * 0.1,  // density like value. Volume (of estimated scaled 3D AABB) is multiplied by this value
        dockingTypes: {
            none: 0,
            good: 1,
            bad: 2,
            docked: 3,
            undocking: 9,
            liftOff: 4,
            landing: 5,
            landingAborted: 6,
            autoDock: 10,
            inRange: 7,
            departed: 8,
        },
        namedTypes: { /* !!! IMPORTANT !!! Must be in order and no gaps or will result in spare array in performance code. */
            dockingPad: 0,
            gun: 1,
            dish: 2,
            post: 3,
            radio: 3,  // same as above
            tiny: 4,
            small: 5,
            home: 6,
            large: 7,
            missileLauncher: 8,
            ionCanon: 9,
            tankYellow: 10,
            tankGreen:11,
            tankBlue: 12,
            tankRed: 13,
            drill: 14,
            power: 15,

            /* todo
            power:
            redTank:
            greenTank:
            cyanTank:
            redTank:


            */
        },
        types: [{
                name: "DockingPad",
                breakable: "habitatLandingPadBreakable",
                dockingColors: [0x0088FF88, 0x0088FF88, 0x008888FF, 0x00FF8888], // not used, approch good, approchBad, docked
                parts: "habitatLandingPadParts",
                needRocks: true, // needs access to the global rocks object
                baseWidth: 400,
                dockingDist: 560,
                hitPoints: 12000,// * HAB_HP_CHEAT | 0,
                costs: [150, 100, 50, 10, 0].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                //costs: [0, 0, 0, 0, 0],  // metals yellow, green, cyan, red, bonus
                requiers: [],
                personal: 0,
            },{
                name: "DefenceGun",
                breakable: "habitatGunBreakable",
                parts: "habitGunParts",
                gunType: "plasma",
                needRocks: true, // needs access to the global rocks object
                scanCount: 4, // Number of rocks to check per frame when locating rock in range
                range: 0,  // in game pixels If zero use base range value
                angleRange: 0.80, // value is sin of angle. From center in both directions (thus a value of 1 means it can swing 2)
                coilRecharge: 18, // in frames
                gunPower: 120,  // in game pixels per frame
                lance: 4,    // Multiplier of bullet damage
                damage: 8,
                fireCost: {metalType: METAL_YELLOW_IDX, amount: 2},
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                power: 10, // requiered to operate at full productivity
                costs: [200,100,0,0,1].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: [["tiny", "small", "home", "large"], "radio", "tankYellow", "tankGreen"],
                shipUpgrades: {
                    slotName: "weapon",
                },
                personal: 1,
            },{
                name: "RadioDish",
                breakable: "habitRadioDishBreakable",
                swingRate: 0.01, // radians per frame
                swingRange: 2, // from center in radians. swings from negative to positive this value
                offsetY: 40,
                offsetX: 22,
                angleOffset: 0,
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                costs: [0, 0, 0, 0, 0].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                personal: 0,

            },{
                name: "Radio",
                breakable: "habitRadioPostBreakable",
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                attach: {
                    habitTypeName: "dish",
                    scale: 1, // applied to existing scale
                    anglePos: Math.PI * 1.5, // radians, where to attach

                },
                costs: [0, 200, 0, 0, 1].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: [["tiny", "small", "home", "large"], "tankGreen",],
                personal: 4,
                power: 40, // requiered to operate at full productivity
                needRocks: true, // needs access to the global rocks object
                scanCount: 8, // Number of rocks to check per frame when locating rock in range
                maxTracks: 10, // number of rocks that can be tracked.
            },{
                name: "Housing",
                breakable: "habitatTinyBreakable",
                scale: 4,
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                power: 4, // requiered per sleeping person
                costs: [20, 100, 1, 0, 2].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad", "tankYellow", "tankGreen", "tankBlue"],
                sleepCost: [1, 5, 2, 5], // max len 4. in pairs metalType, amount. Cost per person to sleep
                workCost: [0, 10], // max len 1. in pairs metalType, amount. Cost per person to work
                beds: 6,
                shipUpgrades: { slotName: "thrusters", level: 0,},
            },{
                name: "Housing",
                breakable: "habitatSmallBreakable",
                scale: 4,
                power: 2, // requiered per sleeping person
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                costs: [100, 100, 50, 0, 2].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad", "tankYellow", "tankGreen", "tankBlue",],
                sleepCost: [1, 4, 2, 4], // max len 4. in pairs metalType, amount. Cost per person to sleep
                workCost: [0, 8], // max len 1. in pairs metalType, amount. Cost per person to work
                beds: 12,
                shipUpgrades: { slotName: "thrusters", level: 1,},
            },{
                name: "Housing",
                breakable: "habitatBreakable",
                scale: 4,
                power: 1, // requiered per sleeping person
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                costs: [200, 200, 100, 0, 4].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad", "tankYellow", "tankGreen", "tankBlue"],
                sleepCost: [1, 2, 2, 2], // max len 4. in pairs metalType, amount. Cost per person to sleep
                workCost: [0, 5], // max len 1. in pairs metalType, amount. Cost per person to work
                beds: 24,
                shipUpgrades: { slotName: "thrusters", level: 2,},
            },{
                name: "Housing",
                scale: 4,
                power: 0.5, // requiered per sleeping person
                breakable: "habitatLargeBreakable",
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                costs: [400, 400, 200, 0, 8].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad", "tankYellow", "tankGreen", "tankBlue"],
                sleepCost: [1, 2, 2, 2], // max len 4. in pairs metalType, amount. Cost per person to sleep
                workCost: [0, 4], // max len 1. in pairs metalType, amount. Cost per person to work
                beds: 32,
                shipUpgrades: { slotName: "thrusters", level: 3,},
            },{
                name: "MissileLauncher",
                breakable: "habitatMissileLauncherBreakable",
                offsetY: 11,
                power: 5,
                parts: "habitMissileLauncherParts",
                needRocks: true, // needs access to the global rocks object
                scanCount: 8, // Number of rocks to check per frame when locating rock in range
                misslePower: 600,
                range: 21035,  // in game pixels
                angleRange: 0.70, // value is sin of angle. From center in both directions (thus a value of 1 means it can swing 2)
                onTarget: 0.1, // sensitivity to targeting. Small means more time between firing
                power: 120,  // in game pixels per frame
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                damage: 128,
                fireCost: {metalType: METAL_RED_IDX, amount: 2},
                costs: [100, 100, 0, 100, 2].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: [["tiny", "small", "home", "large"], "radio",  "tankYellow", "tankGreen", "tankRed",],
                personal: 4,

            },{
                name: "DefenceGun",
                breakable: "habitatGunBreakable",
                parts: "habitGunParts",
                gunType: "ion",
                power: 20,
                needRocks: true, // needs access to the global rocks object
                scanCount: 4, // Number of rocks to check per frame when locating rock in range
                range: 4035,  // in game pixels
                angleRange: 0.80, // value is sin of angle. From center in both directions (thus a value of 1 means it can swing 2)
                coilRecharge: 18, // in frames
                gunPower: 420,  // in game pixels per frame
                lance: 1,    // Multiplier of bullet damage
                damage: 16,
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                fireCost: {metalType: METAL_BLUE_IDX, amount: 2},
                costs: [200, 0, 100, 0, 1].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: [["tiny", "small", "home", "large"], "radio", "tankYellow", "tankBlue"],
                personal: 2,
            },{
                name: "tankYellow",
                breakable: "habitatTankYellowBreakable",
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                scale: 4,
                shipWeapon: [{rechargeRate: 1}],
                shipStores: {metalType: 0, amount: 50},
                stores: {metalType: 0, amount: 200},
                costs: [200, 0, 0, 0, 0].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad",],
                shipUpgrades: { slotName: "stores", level: 0,},

            },{
                name: "tankGreen",
                breakable: "habitatTankGreenBreakable",
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                scale: 4,
                shipWeapon: [{coilMax: 100}],
                shipStores: {metalType: 1, amount: 50},
                stores: {metalType: 1, amount: 200},
                costs: [0, 200, 0, 0, 1].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad","tankYellow"],
                shipUpgrades: { slotName: "stores", level: 1,},
            },{
                name: "tankBlue",
                breakable: "habitatTankBlueBreakable",
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                scale: 4,
                shipWeapon: [{lance: 1}],
                shipStores: {metalType: 2, amount: 50},
                stores: {metalType: 2, amount: 200},
                costs: [0, 0, 200, 0, 2].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad","tankYellow","tankGreen",],
                shipUpgrades: { slotName: "stores", level: 2,},
            },{
                name: "tankRed",
                breakable: "habitatTankRedBreakable",
                shipStores: {metalType: 3, amount: 50},
                stores: {metalType: 3, amount: 200},
                scale: 4,
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                costs: [0,  0, 0, 200, 3].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad","tankYellow","tankGreen", "tankBlue",],
                shipUpgrades: { slotName: "stores", level: 3,},
            },{
                name: "Drill",
                breakable: "habitatDrillBreakable",
                parts: "habitatDrillParts",
                scale: 4,
                power: 20,
                stores: {},
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                metalRate: 5,  // when at 100% productivity will collect metal every metalRate frame ie 5 means 12 metal per second
                costs: [200,  100, 40, 10, 4].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad","tankYellow","tankGreen", "tankBlue", "tankRed",],
                shipUpgrades: { slotName: "stores"},
                personal: 2,
            },{
                name: "Power",
                breakable: "habitatPowerPlantBreakable",
                parts: "habitatPowerPlantParts",
                scale: 4,
                generatesPower: 100,
                stores: {},
                hitPoints: 12000 * HAB_HP_CHEAT | 0,
                costs: [200,  100, 40, 10, 4].map(v => v  * HAB_COST_CHEAT),  // metals yellow, green, cyan, red, bonus
                requiers: ["dockingPad","tankYellow","tankGreen", "tankBlue", "tankRed",],
                shipUpgrades: { slotName: "power"},
                personal: 2,
            }

        ],
    },
	bases: {
        startupMetalCheat: BASE_METAL_CHEAT,
        home: {
            isHome: true,
            rockSpriteName: "darkRockLarge",  // name of home rock in data.spriteSheet.names
            rockScale: 18,  // home rock scale
            rotate: 0.0005,  // base rotate. In radians
            radarRange: 10000, // in world pixels;
            dayTime: 6000, // in frames. Number of ticks for a work daya. Personal need 1/3 this time to sleep, and work only 1/3 this time between sleeps

            scale: 4,       // habitat scale
            mass: (((1400 / 8) * 18) ** 3),
            mineable: [1000000,100000,10000,1000,200], // metals that can be mined
            habitatCount: 128,  // max habitats
           // habitSel: [0,1,3,4,5,6,7,8,9,10,11,12,13],
            mustHave: [],    // indexs of habitats that must be included. Can be empty
            canBuild: [0,1,3,4,5,6,7,8,9,10,11,12,13,14,15],
            buildFromLow: false, // will add from lowest point if this is true.
            buildFromPad: true, // of true will build new habs close to landing pad

         },

        /*orbit: {
            distance: 19000,  // if included then distance from world center
            orbitDirection: 1, // positive clockwize, neg anti clockwize
            mass: ((300 / 4) ** 3),
            rockSpriteName: "darkRockMedium",  // name of home rock in data.spriteSheet.names
            rockScale: 6,  // home rock scale
            rotate: 0.002,  // base rotate. In radians
            scale: 4,       // habitat scale
            mineable: [10000,1000,100,10,2], // metals that can be mined
            habitatCount: 16,  // max habitats
           // habitSel: [9,],
            mustHave: [0],    // indexs of habitats that must be included. Can be empty
            canBuild: [0,1,3,4,5,6,7,8,9,10,11,12,13,14],
            buildFromLow: true, // will add from lowest point if this is true.
         },*/
    },
    fx: {
        rockSmoke:  [0xFF555555, 0xFF444444, 0xFF333333, 0xFF558888, 0xFF447777, 0xFF335555, 0xFFAA5555, 0xFF994444, 0xFF883333],
		shockwaveColors: [0xFF8822, 0xFFFF44, 0x886633],
		shipExplodeShockwaveColors: [0x22FF88, 0xFFFF44, 0x88FF33],
		shipExplodeSparkColors: [0xFF00FF00, 0xFF88FF00,0xFF00FF88],
        shipDamageSmokeColors: [0xFF00FF00,0xFF44FF88,0xFF00AA00],
		plasmaBulletHitSmokeColors:  [0x3F2088FF, 0x7F20FFFF, 0x3F66AAFF, 0x7F2044DD],  // lighten FX like fire
        muzzelFlashTime: 6, // time in frames of default muzzel flash. MUST be > 0
        bulletMuzzelFlash: {
            ion: "gunIon.blast" ,
            plasma: "gunPlasma.blast",
            lazer: "gunLaz.blast",
            scaleSeq: [32 / 32, 32 / 96, 32 / 64, 32 / 48, 32 / 128, 32 / 24],  // x,y pairs
        },

	},
	overlaySpriteSheet: {
		image: "./media/aoids_overlayC14.png",
        defaultZIndexBit: 0x40000000, // this is logic ORed with sprite index to force default z index
		nameToIdx,
		names: {
			title: 0,
			numbers: {compoundSized: true, idx: 1, w: 10, h: 1, sizes: [17,17,17,16,18,17,17,17,17,16]},
			numbersHighlight: {compoundSized: true, idx: 2, w: 10, h: 1, sizes: [17,17,17,16,18,17,17,17,17,16]},
			smallNumbersA: {compoundSized: true, idx: 3, w: 10, h: 1, sizes: [11,8,11,11,11,12,11,11,12,11]},
			smallNumbersB: {compoundSized: true, idx: 4, w: 10, h: 1, sizes: [11,8,11,11,11,12,11,11,12,11]},
			smallNumbersC: {compoundSized: true, idx: 5, w: 10, h: 1, sizes: [11,8,11,11,11,12,11,11,12,11]},
            yellowName: 6,
            greenName: 7,
            cyanName: 8,
            redName: 9,
            locatorRing: 10,
            pointer: 11,
            pointerFull: 12,
            whiteSquare: 13,
            homePointer: 14,
            rockPointer: 15,
            metalSymbols: [16,17,18,19],
            metalLargeSymbols: [152, 153, 154, 155],
            personSymbol: 151,
            personLargeSymbol: 156,
            orbitIndicator: 157,
            fuelSymbol: 20,
            fontStart: 21,
            fontCharacters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890%/\\()[]{}$!?/+*-=<>,;:\"'. ",
            buildingsStartEnd: [21 + 88, 21 + 88 + 22 + 9],
            small: 0, // add idx to buildingsStartEnd[0] to get sprite idx
            home: 4,
            dockingPad: 2,
            radio: 3,
            tiny: 1,
            large: 5,
            missileLauncher: 6,
            gun: 7,
            ionCanon: 8,
            tankYellow: 11,
            tankRed: 12,
            tankGreen: 13,
            tankBlue: 14,
            drill: 9,
            power: 10,

            backIcon: 21 + 88 + 17,
            costIcon: 21 + 88 + 18,
            repairBaseIcon: 21 + 88 + 19,
            buildBaseIcon: 21 + 88 + 20,
            upgradShipIcon: 21 + 88 + 21,
            shipUpgradeIcons: {
                default: 131, // this will add warning to log as only used in debug and development
                Yellow: 134,
                Green: 134,
                Blue: 134,
                Red: 134,
                Coils: 135,
                Recharge: 136,
                Lance: 137,
                InboardPlasma: 131,
                QuadPlasma: 131,
                InboardIon: 131,
                DualIons: 131,
                QuadIons: 131,
                Armour: 131,
                Sheild: 131,
                Power: 131,
            },
            weaponSystems: 132,
            shipSystems: 131,
            propulsionSystems: 133,
            powerSystems: 134,


            baseStatusIcon: 21 + 88 + 31,
            fontDigitsSmall: 141, // 0123456789

		},
		sprites: [
            { x: 1, y: 1, w: 449, h: 102},
            { x: 453, y: 1, w: 169, h: 25},
            { x: 625, y: 1, w: 169, h: 25},
            { x: 453, y: 29, w: 110, h: 17},
            { x: 566, y: 29, w: 110, h: 17},
            { x: 679, y: 29, w: 110, h: 17},
            { x: 453, y: 49, w: 98, h: 21},
            { x: 554, y: 49, w: 99, h: 21},
            { x: 656, y: 49, w: 104, h: 21},
            { x: 763, y: 49, w: 64, h: 21},
            { x: 1, y: 106, w: 258, h: 258},
            { x: 262, y: 106, w: 36, h: 34},
            { x: 301, y: 106, w: 36, h: 34},
            { x: 340, y: 106, w: 16, h: 16},
            { x: 359, y: 106, w: 29, h: 18},
            { x: 391, y: 106, w: 31, h: 18},
            { x: 425, y: 106, w: 10, h: 10},
            { x: 438, y: 106, w: 8, h: 12},
            { x: 449, y: 106, w: 8, h: 10},
            { x: 460, y: 106, w: 9, h: 10},
            { x: 472, y: 106, w: 20, h: 14},

            // bitmap font
            { x: 262, y: 143, w: 12, h: 25},
            { x: 277, y: 143, w: 12, h: 25},
            { x: 292, y: 143, w: 12, h: 25},
            { x: 307, y: 143, w: 12, h: 25},
            { x: 322, y: 143, w: 12, h: 25},
            { x: 337, y: 143, w: 12, h: 25},
            { x: 352, y: 143, w: 12, h: 25},
            { x: 367, y: 143, w: 12, h: 25},
            { x: 382, y: 143, w: 6, h: 25},
            { x: 391, y: 143, w: 10, h: 25},
            { x: 404, y: 143, w: 12, h: 25},
            { x: 419, y: 143, w: 12, h: 25},
            { x: 434, y: 143, w: 12, h: 25},
            { x: 449, y: 143, w: 12, h: 25},
            { x: 464, y: 143, w: 12, h: 25},
            { x: 479, y: 143, w: 12, h: 25},
            { x: 494, y: 143, w: 12, h: 25},
            { x: 509, y: 143, w: 12, h: 25},
            { x: 524, y: 143, w: 12, h: 25},
            { x: 539, y: 143, w: 12, h: 25},
            { x: 554, y: 143, w: 12, h: 25},
            { x: 569, y: 143, w: 12, h: 25},
            { x: 584, y: 143, w: 15, h: 25},
            { x: 602, y: 143, w: 12, h: 25},
            { x: 617, y: 143, w: 12, h: 25},
            { x: 632, y: 143, w: 12, h: 25},
            { x: 262, y: 171, w: 11, h: 25},
            { x: 276, y: 171, w: 11, h: 25},
            { x: 290, y: 171, w: 11, h: 25},
            { x: 304, y: 171, w: 11, h: 25},
            { x: 318, y: 171, w: 11, h: 25},
            { x: 332, y: 171, w: 11, h: 25},
            { x: 346, y: 171, w: 11, h: 25},
            { x: 360, y: 171, w: 11, h: 25},
            { x: 374, y: 171, w: 6, h: 25},
            { x: 383, y: 171, w: 9, h: 25},
            { x: 395, y: 171, w: 11, h: 25},
            { x: 409, y: 171, w: 6, h: 25},
            { x: 418, y: 171, w: 11, h: 25},
            { x: 432, y: 171, w: 11, h: 25},
            { x: 446, y: 171, w: 11, h: 25},
            { x: 460, y: 171, w: 11, h: 25},
            { x: 474, y: 171, w: 11, h: 25},
            { x: 488, y: 171, w: 11, h: 25},
            { x: 502, y: 171, w: 11, h: 25},
            { x: 516, y: 171, w: 10, h: 25},
            { x: 529, y: 171, w: 11, h: 25},
            { x: 543, y: 171, w: 11, h: 25},
            { x: 557, y: 171, w: 13, h: 25},
            { x: 573, y: 171, w: 11, h: 25},
            { x: 587, y: 171, w: 11, h: 25},
            { x: 601, y: 171, w: 10, h: 25},
            { x: 262, y: 199, w: 6, h: 25},
            { x: 271, y: 199, w: 12, h: 25},
            { x: 286, y: 199, w: 12, h: 25},
            { x: 301, y: 199, w: 12, h: 25},
            { x: 316, y: 199, w: 12, h: 25},
            { x: 331, y: 199, w: 12, h: 25},
            { x: 346, y: 199, w: 12, h: 25},
            { x: 361, y: 199, w: 12, h: 25},
            { x: 376, y: 199, w: 12, h: 25},
            { x: 391, y: 199, w: 12, h: 25},
            { x: 262, y: 227, w: 12, h: 25},
            { x: 277, y: 227, w: 12, h: 25},
            { x: 292, y: 227, w: 12, h: 25},
            { x: 307, y: 227, w: 9, h: 25},
            { x: 319, y: 227, w: 9, h: 25},
            { x: 331, y: 227, w: 9, h: 25},
            { x: 343, y: 227, w: 9, h: 25},
            { x: 355, y: 227, w: 10, h: 25},
            { x: 368, y: 227, w: 10, h: 25},
            { x: 381, y: 227, w: 12, h: 25},
            { x: 396, y: 227, w: 6, h: 25},
            { x: 405, y: 227, w: 12, h: 25},
            { x: 420, y: 227, w: 10, h: 25},
            { x: 433, y: 227, w: 10, h: 25},
            { x: 446, y: 227, w: 11, h: 25},
            { x: 460, y: 227, w: 10, h: 25},
            { x: 473, y: 227, w: 10, h: 25},
            { x: 486, y: 227, w: 12, h: 25},
            { x: 501, y: 227, w: 12, h: 25},
            { x: 516, y: 227, w: 6, h: 25},
            { x: 525, y: 227, w: 6, h: 25},
            { x: 534, y: 227, w: 6, h: 25},
            { x: 543, y: 227, w: 10, h: 25},
            { x: 556, y: 227, w: 6, h: 25},
            { x: 565, y: 227, w: 6, h: 25},
            { x: 574, y: 227, w: 7, h: 25},
            // font end

            // Building images
            { x: 262, y: 255, w: 66, h: 66},
            { x: 331, y: 255, w: 66, h: 66},
            { x: 400, y: 255, w: 66, h: 66},
            { x: 469, y: 255, w: 66, h: 66},
            { x: 538, y: 255, w: 66, h: 66},
            { x: 607, y: 255, w: 66, h: 66},
            { x: 676, y: 255, w: 66, h: 66},
            { x: 745, y: 255, w: 66, h: 66},
            { x: 814, y: 255, w: 66, h: 66},
            { x: 883, y: 255, w: 66, h: 66},
            { x: 952, y: 255, w: 66, h: 66},
            { x: 262, y: 324, w: 66, h: 66},
            { x: 331, y: 324, w: 66, h: 66},
            { x: 400, y: 324, w: 66, h: 66},
            { x: 469, y: 324, w: 66, h: 66},
            { x: 538, y: 324, w: 66, h: 66},
            { x: 607, y: 324, w: 66, h: 66},
            { x: 676, y: 324, w: 66, h: 66},
            { x: 745, y: 324, w: 66, h: 66},
            { x: 814, y: 324, w: 66, h: 66},
            { x: 883, y: 324, w: 66, h: 66},
            { x: 952, y: 324, w: 66, h: 66},
            // ship upgrade options
            { x: 262, y: 393, w: 66, h: 66},
            { x: 331, y: 393, w: 66, h: 66},
            { x: 400, y: 393, w: 66, h: 66},
            { x: 469, y: 393, w: 66, h: 66},
            { x: 538, y: 393, w: 66, h: 66},
            { x: 607, y: 393, w: 66, h: 66},
            { x: 676, y: 393, w: 66, h: 66},
            { x: 745, y: 393, w: 66, h: 66},
            { x: 814, y: 393, w: 66, h: 66},

            // base satus pannel
            { x: 883, y: 393, w: 135, h: 66 + 12 * 3},


		],
        spriteGroups: [[  // small digits
                { x: 453, y: 73, w: 7, h: 11},
                { x: 463, y: 73, w: 5, h: 11},
                { x: 471, y: 73, w: 7, h: 11},
                { x: 481, y: 73, w: 7, h: 11},
                { x: 491, y: 73, w: 7, h: 11},
                { x: 502, y: 73, w: 7, h: 11},
                { x: 512, y: 73, w: 7, h: 11},
                { x: 522, y: 73, w: 7, h: 11},
                { x: 532, y: 73, w: 7, h: 11},
                { x: 542, y: 73, w: 7, h: 11},
            ],[ // person small/large, metals yellow, green, blue, red, orbitIndicator
                { x: 495, y: 106, w: 11, h: 16}, // person small
                { x: 509, y: 106, w: 20, h: 20}, // large metal yellow
                { x: 532, y: 106, w: 16, h: 24}, // large metal green
                { x: 551, y: 106, w: 16, h: 20}, // large metal blue
                { x: 570, y: 106, w: 18, h: 20}, // large metal red
                { x: 591, y: 106, w: 20, h: 30}, // person large
                { x: 614, y: 106, w: 24, h: 24}, // orbitIndicator
            ],

        ],
        spriteEdgeGrouped: [[],[]],  // not used in overlays so far
	},
	spriteSheet: {
		maxSpriteCount: 4096 * 2,  // this is sprite instance buffer count per shader.
        defaultZIndexBit: 0x40000000, // this is logic ORed with sprite index to force default z index
		image: "./media/Aoids_SpriteSheetC14.png",
		nameToIdx,
		names: {
			rocks: [[0], [1,2], [3,4,5,6], [7,8,9,10,11,12,13,14], [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]],
			rockGlows: [[ROCK_GLOW_START + 0], [ROCK_GLOW_START + 1, ROCK_GLOW_START + 2], [ROCK_GLOW_START + 3, ROCK_GLOW_START + 4, ROCK_GLOW_START + 5, ROCK_GLOW_START + 6], [ROCK_GLOW_START + 7, ROCK_GLOW_START + 8, ROCK_GLOW_START + 9, ROCK_GLOW_START + 10, ROCK_GLOW_START + 11, ROCK_GLOW_START + 12, ROCK_GLOW_START + 13, ROCK_GLOW_START + 14], [ROCK_GLOW_START + 15, ROCK_GLOW_START + 16, ROCK_GLOW_START + 17, ROCK_GLOW_START + 18, ROCK_GLOW_START + 19, ROCK_GLOW_START + 20, ROCK_GLOW_START + 21, ROCK_GLOW_START + 22, ROCK_GLOW_START + 23, ROCK_GLOW_START + 24, ROCK_GLOW_START + 25, ROCK_GLOW_START + 26, ROCK_GLOW_START + 27, ROCK_GLOW_START + 28, ROCK_GLOW_START + 29, ROCK_GLOW_START + 30]],
            darkRockLarge: 259,
            darkRockMedium: 260,
            darkRockSmallA: 261,
            darkRockSmallB: 262,
            darkRockSmallC: 263,
            darkRockSmallD: 264,
            darkRockSmallE: 265,
            darkRockSmallF: 266,
			shipBody: 31,
			shipCockpit: 32,
			gunPlasma: {
				left: 33,
				right: 34,
				barrelL: 35,
				barrelR: 36,
				charge: 37,
				dischargeL: 38,
				dischargeR: 39,
				blast: 45,
				bullets:[50],
				sparks:[46, 51, 52,65,66],
			},
			gunIon: {
				left: 67,
				right: 68,
				barrelL: 35,
				barrelR: 36,
				charge: 69,
				dischargeL: 70,
				dischargeR: 71,
				blast: 72,
				bullets:[77],
				sparks:[74, 78, 79, 80,81],
			},
			gunLaz: {
				left: 73,
				right: 74,
				chargeL: 75,
				chargeR: 76,
				discharge: 47,
				blast: 48,
				bullets:[49],
				sparks:[48],
			},
			gunMis: {  // Missile launcher
				left: 230,
				right: 231,
				barrelL: 229,
				barrelR: 232,
				bullets:[233,234,235,236,237,238],
				smoke:[239,240,241,242],
				sparks:[243, 244, 245],  // missile thrust
			},
            gunAlien: {
				left: 230,
				right: 231,
				bullets:[49],
                blast: 254,
                charge: 255,


            },
			randSparks: [90],
			shipBumper: 40,
			shipThrust: 41,
			shipThrusterForwardRight: 42,
			shipThrusterForwardLeft: 43,
			shipThrusterBackLeft: 44,
			shipDisplayPannel: [53,54,55,56,57,58,59,60,61,62,63,64],
			shipShield: 82,
            shipShieldAddaptor: 303,
            shipWeaponPowerAddaptor: 304,
			FXShock: 82,
			FXGlow: 83,
			FXGlowStar: 84,
			FXSmallStar: 90,
            whiteSparks: [91, 92, 93, 94, 95, 96, 97],  // replaces pilotParts & astronautParts
			plasmaSparks: [46, 51, 52,65,66],
			plasmaSmoke: [88,89],
			ionSparks: [74, 78, 79, 80,81],
			smoke: [85,86,87,88,89],
			pilotParts: [91,92,93,94,95,96,97,98,99,100,101],
			astronautParts: [91,92,93,94,95,96,97,98,99,100,101],
			//empty: [102],
            dockingGuide: 102,
			pilot: 101,
			pilotBody: 101,
			pilotHead: 100,
			pilotArm: 99,
			pilotForearm: 98,
			metals: [104,105,106,107],
			goldMetal: 104,
			greenMetal: 105,
			cyanMetal: 106,
			rubyMetal: 107,
            whiteSwatch: 108,
			bonusGem: [109, 110, 82],
			shipCargoTank: 111,
			shipCargoTug: 112,
			shipCargoWindows: 113,
			shipCargoEngine: 114,
			shipCargoEngineLeftCover: 115,
			shipCargoEngineRightCover: 116,
			shipCargoThrustGlow: 117,
			shipCargoDoorL: 118,
			shipCargoDoorOpenL: 119,
			shipCargoDoorR: 120,
			shipCargoDoorOpenT: 121,
			shipCargoGunCharge: 122,
			lightning: [123, 124, 125, 126, 127],
			alienShip: 128,
			alienShipWindow: 129,
			alienShipWindowBack: 130,
			alienShipThrust: 131,
			alienShipThrustLeft: 132,
			alienShipThrustCenter: 133,
			alienShipThrustRight: 134,
			alienShipGubCharge: 135,
			alienShipGubChargeA: 136,
			alienTentical: [137,138,139,140,141,142,143,144,145, 146, 147, 148,149],
			lightningSparks: [150, 151, 152],
			plasmaSurfaceSparks: [153, 154, 155, 156, 157, 158, 159, 160],
            habitGunParts: [202, 205, 207, 206, 203], // background, cover, barrel, gun, foreground
            habitMissileLauncherParts: [224, 225, 226, 227, 228, 221, 233, 233], // silo cover, swingArm, missile clasper, upper piston, lower piston, foreground habitat, missle, missle
            habitatLandingPadBreakable: [200, 201,],
            habitatGunBreakable:     [203, 204],
            habitatMissileLauncherBreakable:  [221, 222, 223],
            habitRadioDishBreakable: [211, 212],
            habitRadioPostBreakable: [213, 214, 215],
            habitatTinyBreakable:   [297, 298, 299],
            habitatSmallBreakable:   [290, 291, 292],
            habitatBreakable:   [293, 294, 295, 296],
            habitatLargeBreakable:   [300, 301, 302],
            //habitatTankBreakable:    [196, 197, 198, 199],
            habitatTankYellowBreakable: [267, 271, 272],
            habitatTankGreenBreakable:  [268, 273],
            habitatTankBlueBreakable:   [270, 275],
            habitatTankRedBreakable:    [269, 274],
            habitatDrillBreakable:    [276, 277, 278],
            habitatPowerPlantBreakable: [305, 305],
            habitats: [200, 203, 211, 213, 192, 208, 216, 196, 267, 268, 269, 270, 276,305],
            hyperSpaceRingGlow: 219,
            hyperSpaceRing: 220,

            missles: [233,234,235,236,237,238],
            alienShipBody: [246, 247, 248, 250, 249, 251, 252, 253, 254, 255], // body, cockpit, main thruster, second thruster, main thrust, second thrust
                                                                               // gunh left, gun right, gub blast, guncharge
            habitatLandingLights: {compound: true, idx: 258, w: 8, h: 1},
            habitatLandingPadParts: [200, 256, 257, 258],
            habitatDrillParts: [276, 279, 280, [281, 282, 283, 284, 285, 286, 287, 288, 289]],
            habitatPowerPlantParts: [305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316], // power plant, big, small glow, sparks


            NEXT_FREE_SPRITE: 317, // UPDATE THIS WHEN ADDING NEW SPRITES
		},

/* this commented set of sprites are no longer used

*/

/* sprites with //* at end of line are no longer used */
		sprites:[ // e is edge idx
			{ x:    1, y:   1, w: 191, h: 201, e: 0},
			{ x:  195, y:   1, w: 189, h: 110, e: 1},
			{ x:  387, y:   1, w: 190, h:  97, e: 2},
			{ x:  580, y:   1, w:  98, h: 105, e: 3},
			{ x:  681, y:   1, w:  92, h: 108, e: 4},
			{ x:  776, y:   1, w: 108, h:  92, e: 5},
			{ x:  887, y:   1, w:  85, h:  92, e: 6},
			{ x:  975, y:   1, w:  86, h:  57, e: 7},
			{ x: 1064, y:   1, w:  75, h:  59, e: 8},
			{ x: 1142, y:   1, w:  98, h:  49, e: 9},
			{ x: 1243, y:   1, w:  90, h:  60, e: 10},
			{ x:  975, y:  64, w: 105, h:  47, e: 11},
			{ x: 1083, y:  64, w:  82, h:  57, e: 12},
			{ x: 1168, y:  64, w: 101, h:  51, e: 13},
			{ x: 1272, y:  64, w:  55, h:  47, e: 14},
			{ x:  195, y: 114, w:  49, h:  48, e: 15},
			{ x:  247, y: 114, w:  42, h:  56, e: 16},
			{ x:  292, y: 114, w:  41, h:  57, e: 17},
			{ x:  336, y: 114, w:  39, h:  37, e: 18},
			{ x:  378, y: 114, w:  59, h:  44, e: 19},
			{ x:  440, y: 114, w:  40, h:  45, e: 20},
			{ x:  483, y: 114, w:  34, h:  49, e: 21},
			{ x:  520, y: 114, w:  49, h:  52, e: 22},
			{ x:  572, y: 114, w:  57, h:  42, e: 23},
			{ x:  632, y: 114, w:  47, h:  47, e: 24},
			{ x:  682, y: 114, w:  40, h:  49, e: 25},
			{ x:  725, y: 114, w:  44, h:  52, e: 26},
			{ x:  772, y: 114, w:  60, h:  43, e: 27},
			{ x:  835, y: 114, w:  38, h:  45, e: 28},
			{ x:  876, y: 114, w:  33, h:  46, e: 29},
			{ x:  912, y: 114, w:  25, h:  26, e: 30},
			{ x: 1, y: 742, w: 172, h: 186, 	e: 32},
			{ x: 176, y: 742, w: 172, h: 186},
			{ x: 351, y: 742, w: 32, h: 87},
			{ x: 386, y: 742, w: 32, h: 87},
			{ x: 421, y: 742, w: 24, h: 58},
			{ x: 448, y: 742, w: 24, h: 58},
			{ x: 475, y: 742, w: 21, h: 10},
			{ x: 499, y: 742, w: 23, h: 28},
			{ x: 525, y: 742, w: 23, h: 28},
			{ x: 551, y: 742, w: 80, h: 45},
			{ x: 634, y: 742, w: 139, h: 73},
			{ x: 776, y: 742, w: 12, h: 36},
			{ x: 791, y: 742, w: 12, h: 36},
			{ x: 806, y: 742, w: 17, h: 19},
            { x: 826, y: 742, w: 64, h: 47},
            { x: 893, y: 742, w: 3, h: 13},
            { x: 899, y: 742, w: 18, h: 50},
            { x: 920, y: 742, w: 37, h: 23},
            { x: 960, y: 742, w: 9, h: 27},
            { x: 972, y: 742, w: 13, h: 42},
            { x: 988, y: 742, w: 26, h: 23},
            { x: 1017, y: 742, w: 11, h: 12},
            { x: 1031, y: 742, w: 16, h: 7},
            { x: 1050, y: 742, w: 16, h: 7},
            { x: 1069, y: 742, w: 16, h: 7},
            { x: 1088, y: 742, w: 16, h: 7},
            { x: 1107, y: 742, w: 16, h: 7},
            { x: 1126, y: 742, w: 16, h: 7},
            { x: 1145, y: 742, w: 16, h: 7},
            { x: 1164, y: 742, w: 16, h: 7},
            { x: 1183, y: 742, w: 16, h: 7},
            { x: 1202, y: 742, w: 16, h: 7},
            { x: 1221, y: 742, w: 16, h: 7},
            { x: 1240, y: 742, w: 16, h: 7},
            { x: 1259, y: 742, w: 39, h: 38},
            { x: 1301, y: 742, w: 41, h: 37},
            { x: 1345, y: 742, w: 32, h: 87},
            { x: 1380, y: 742, w: 32, h: 87},
            { x: 1415, y: 742, w: 21, h: 10},
            { x: 1439, y: 742, w: 23, h: 28},
            { x: 1465, y: 742, w: 23, h: 28},
            { x: 1491, y: 742, w: 64, h: 47},
            { x: 1558, y: 742, w: 32, h: 125},
            { x: 1593, y: 742, w: 32, h: 125},
            { x: 1628, y: 742, w: 32, h: 44},
            { x: 1663, y: 742, w: 32, h: 44},
            { x: 1698, y: 742, w: 13, h: 42},
            { x: 1714, y: 742, w: 26, h: 23},
            { x: 1743, y: 742, w: 11, h: 12},
            { x: 1757, y: 742, w: 39, h: 38},
            { x: 1799, y: 742, w: 41, h: 37},
			{ x: 1, y: 931, w: 223, h: 222},
			{ x: 227, y: 931, w: 218, h: 216},
			{ x: 448, y: 931, w: 183, h: 183},
			{ x: 634, y: 931, w: 26, h: 25},
			{ x: 663, y: 931, w: 26, h: 25},
			{ x: 692, y: 931, w: 29, h: 30},
			{ x: 724, y: 931, w: 47, h: 47},
			{ x: 774, y: 931, w: 65, h: 52},
            { x: 842, y: 931, w: 47, h: 45},
            { x: 892, y: 931, w: 14, h: 14},
            { x: 909, y: 931, w: 10, h: 10},
            { x: 922, y: 931, w: 12, h: 9},
            { x: 937, y: 931, w: 7, h: 7},
            { x: 947, y: 931, w: 10, h: 10},
            { x: 960, y: 931, w: 14, h: 14},
            { x: 977, y: 931, w: 12, h: 7},
            { x: 1046, y: 931, w: 8, h: 20},
            { x: 1057, y: 931, w: 14, h: 15},
            { x: 1088, y: 931, w: 17, h: 17},
            { x: 1108, y: 931, w: 33, h: 38},
            { x: 1144, y: 931, w: 104, h: 74},
            { x: 1251, y: 931, w: 33, h: 38},
            { x: 1287, y: 931, w: 44, h: 44},
            { x: 1334, y: 931, w: 44, h: 44},
            { x: 1381, y: 931, w: 44, h: 44},
            { x: 1428, y: 931, w: 44, h: 44},
            { x: 1475, y: 931, w: 8, h: 8},
            { x: 1486, y: 931, w: 66, h: 66},
            { x: 1555, y: 931, w: 66, h: 66},
			{ x: 1, y: 1156, w: 170, h: 406, e: 34},
			{ x: 174, y: 1156, w: 266, h: 236, e: 35},
			{ x: 443, y: 1156, w: 106, h: 68},
			{ x: 552, y: 1156, w: 64, h: 50},
			{ x: 619, y: 1156, w: 74, h: 24},
			{ x: 696, y: 1156, w: 71, h: 29},
			{ x: 770, y: 1156, w: 20, h: 44},
			{ x: 793, y: 1156, w: 36, h: 34},
			{ x: 832, y: 1156, w: 36, h: 23},
			{ x: 871, y: 1156, w: 36, h: 34},
			{ x: 910, y: 1156, w: 36, h: 23},
			{ x: 949, y: 1156, w: 22, h: 10},
			{ x: 974, y: 1156, w: 60, h: 71},
			{ x: 1037, y: 1156, w: 70, h: 89},
			{ x: 1110, y: 1156, w: 141, h: 104},
			{ x: 1254, y: 1156, w: 80, h: 113},
			{ x: 1337, y: 1156, w: 95, h: 111},
			{ x: 1, y: 1565, w: 184, h: 158},
			{ x: 188, y: 1565, w: 230, h: 84},
			{ x: 421, y: 1565, w: 204, h: 56},
			{ x: 628, y: 1565, w: 153, h: 73},
			{ x: 784, y: 1565, w: 6, h: 10},
			{ x: 793, y: 1565, w: 14, h: 12},
			{ x: 810, y: 1565, w: 6, h: 10},
			{ x: 819, y: 1565, w: 42, h: 49},
			{ x: 864, y: 1565, w: 70, h: 18},
			{ x: 937, y: 1565, w: 24, h: 27,  cy: 26, cx: 16},
			{ x: 964, y: 1565, w: 27, h: 29,  cy: 28, cx: 20},
			{ x: 994, y: 1565, w: 29, h: 33,  cy: 32, cx: 21},
			{ x: 1026, y: 1565, w: 27, h: 38, cy: 37, cx: 19},
			{ x: 1056, y: 1565, w: 20, h: 43, cy: 42, cx: 12},
			{ x: 1079, y: 1565, w: 15, h: 47, cy: 46, cx: 7},
			{ x: 1097, y: 1565, w: 14, h: 49, cy: 48, cx: 7},
			{ x: 1114, y: 1565, w: 15, h: 47, cy: 46, cx: 7},
			{ x: 1132, y: 1565, w: 20, h: 43, cy: 43, cx: 7},
			{ x: 1155, y: 1565, w: 27, h: 38, cy: 37, cx: 7},
			{ x: 1185, y: 1565, w: 29, h: 33, cy: 32, cx: 7},
			{ x: 1217, y: 1565, w: 27, h: 29, cy: 28, cx: 6},
			{ x: 1247, y: 1565, w: 24, h: 27, cy: 26, cx: 7},
			{ x: 1, y: 1749, w: 50, h: 39, cx: 34, cy: 35},
			{ x: 54, y: 1749, w: 78, h: 65, cx: 42, cy: 51},
			{ x: 135, y: 1749, w: 63, h: 46, cx: 34, cy: 28},
			{ x: 201, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 233, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 265, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 297, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 329, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 361, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 393, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
			{ x: 425, y: 1749, w: 29, h: 23, cx: 14, cy: 21},
		],
		spriteGroups: [ // these are sorted in group then added to list
			[// Rock glow
				{ x:    1, y: 205, w: 191, h: 201},
				{ x:  195, y: 205, w: 189, h: 110},
				{ x:  387, y: 205, w: 190, h: 97},
				{ x:  580, y: 205, w:  98, h: 105},
				{ x:  681, y: 205, w:  92, h: 108},
				{ x:  776, y: 205, w: 108, h: 92},
				{ x:  887, y: 205, w:  85, h: 92},
				{ x:  975, y: 205, w:  86, h: 57},
				{ x: 1064, y: 205, w:  75, h: 59},
				{ x: 1142, y: 205, w:  98, h: 49},
				{ x: 1243, y: 205, w:  90, h: 60},
				{ x:  975, y: 268, w: 105, h: 47},
				{ x: 1083, y: 268, w:  82, h: 57},
				{ x: 1168, y: 268, w:  101, h: 51},
				{ x: 1272, y: 268, w:  55, h: 47},
				{ x:  195, y: 318, w:  49, h: 48},
				{ x:  247, y: 318, w:  42, h: 56},
				{ x:  292, y: 318, w:  41, h: 57},
				{ x:  336, y: 318, w:  39, h: 37},
				{ x:  378, y: 318, w:  59, h: 44},
				{ x:  440, y: 318, w:  40, h: 45},
				{ x:  483, y: 318, w:  34, h: 49},
				{ x:  520, y: 318, w:  49, h: 52},
				{ x:  572, y: 318, w:  57, h: 42},
				{ x:  632, y: 318, w:  47, h: 47},
				{ x:  682, y: 318, w:  40, h: 49},
				{ x:  725, y: 318, w:  44, h: 52},
				{ x:  772, y: 318, w:  60, h: 43},
				{ x:  835, y: 318, w:  38, h: 45},
				{ x:  876, y: 318, w:  33, h: 46},
				{ x:  912, y: 318, w:  25, h: 26},
			],[ // habitat sprites

                { x: 1, y: 410, w: 102, h: 199},   // *
                { x: 106, y: 410, w: 102, h: 124}, // *
                { x: 211, y: 410, w: 102, h: 66},  // *
                { x: 316, y: 410, w: 102, h: 48},  // *
                { x: 421, y: 410, w: 124, h: 224}, // *
                { x: 548, y: 410, w: 124, h: 151}, // *
                { x: 675, y: 410, w: 112, h: 80},  // *
                { x: 790, y: 410, w: 105, h: 54},  // *

                { x: 898, y: 410, w: 160, h: 64},
                { x: 1061, y: 410, w: 160, h: 47},
                { x: 1224, y: 410, w: 76, h: 18},
                { x: 1303, y: 410, w: 101, h: 47},
                { x: 1407, y: 410, w: 101, h: 56},
                { x: 1224, y: 431, w: 64, h: 16},
                { x: 1511, y: 410, w: 17, h: 44},
                { x: 1531, y: 410, w: 11, h: 31},

                { x: 1545, y: 410, w: 102, h: 216}, // *
                { x: 1650, y: 410, w: 102, h: 158}, // *
                { x: 1755, y: 410, w: 102, h: 90}, // *

                { x: 1, y: 639, w: 62, h: 98},
                { x: 66, y: 639, w: 62, h: 98},
                { x: 131, y: 639, w: 44, h: 100},
                { x: 178, y: 639, w: 50, h: 100},
                { x: 231, y: 639, w: 50, h: 48},
                { x: 675, y: 493, w: 150, h: 87},
                { x: 828, y: 493, w: 150, h: 87}, // *
                { x: 981, y: 493, w: 150, h: 46}, // *
            ],[ // hyper space ring
                { x: 1601, y: 1758, w: 217, h: 282},
                { x: 1821, y: 1758, w: 217, h: 282},
            ],[ // missile habitat and parts
                { x: 1180, y: 460, w: 88, h: 52},
                { x: 1271, y: 460, w: 68, h: 52},
                { x: 1342, y: 460, w: 50, h: 39},

                { x: 1134, y: 460, w: 43, h: 7},
                { x: 1134, y: 470, w: 37, h: 7},
                { x: 1134, y: 480, w: 37, h: 14},
                { x: 1134, y: 497, w: 11, h: 22},
                { x: 1148, y: 497, w: 9, h: 18},
            ],[ // rocket pod rockets and FX
                { x: 351, y: 832, w: 42, h: 58},
                { x: 396, y: 832, w: 47, h: 58},
                { x: 446, y: 832, w: 47, h: 58},
                { x: 496, y: 832, w: 42, h: 58},
                { x: 541, y: 832, w: 13, h: 45},
                { x: 557, y: 832, w: 13, h: 37},
                { x: 573, y: 832, w: 13, h: 31},
                { x: 589, y: 832, w: 11, h: 31},
                { x: 603, y: 832, w: 11, h: 23},
                { x: 617, y: 832, w: 11, h: 16},
                { x: 631, y: 832, w: 13, h: 13},
                { x: 647, y: 832, w: 10, h: 10},
                { x: 660, y: 832, w: 13, h: 14},
                { x: 676, y: 832, w: 14, h: 14},
                { x: 693, y: 832, w: 9, h: 25},
                { x: 705, y: 832, w: 7, h: 16},
                { x: 715, y: 832, w: 5, h: 12},
            ], [ // small alien ship
                { x: 827, y: 795, w: 72, h: 56}, // body
                { x: 776, y: 795, w: 48, h: 59}, // overlay
                { x: 902, y: 795, w: 33, h: 15},
                { x: 902, y: 813, w: 33, h: 68},
                { x: 938, y: 795, w: 42, h: 5},
                { x: 938, y: 803, w: 42, h: 25},
                { x: 983, y: 795, w: 13, h: 43},
                { x: 999, y: 795, w: 13, h: 43},
                { x: 1015, y: 795, w: 15, h: 57},
                { x: 1033, y: 795, w: 14, h: 16},
            ], [ // docking platform parts
                { x: 1342, y: 502, w: 160, h: 56},
                { x: 1505, y: 502, w: 36, h: 43},
                { x: 1342, y: 561, w: 57, h: 10}

            ], [ // large rocks
                { x: 1340, y: 1, w: 346, h: 339},
                { x: 1689, y: 1, w: 158, h: 160},
                { x: 1850, y: 1, w: 92, h: 60},
                { x: 1945, y: 1, w: 95, h: 59},
                { x: 1850, y: 64, w: 93, h: 59},
                { x: 1946, y: 64, w: 91, h: 56},
                { x: 1850, y: 126, w: 92, h: 61},
                { x: 1945, y: 126, w: 97, h: 62},

            ], [ // hadbit tanks yellow red green blue
                { x: 284, y: 639, w: 72, h: 81},  // yellow
                { x: 613, y: 629, w: 69, h: 106}, // green
                { x: 548, y: 629, w: 62, h: 110}, // blue
                { x: 359, y: 639, w: 79, h: 95},  // red
                { x: 441, y: 639, w: 72, h: 78},
                { x: 685, y: 629, w: 67, h: 46},
                { x: 755, y: 629, w: 70, h: 36},
                { x: 685, y: 678, w: 84, h: 47},
                { x: 828, y: 629, w: 70, h: 40},
            ], [ // habitat drill and parts
                { x: 901, y: 629, w: 79, h: 94},
                { x: 983, y: 629, w: 79, h: 94},
                { x: 1065, y: 629, w: 77, h: 59},
                { x: 1065, y: 691, w: 24, h: 32},
                { x: 1162, y: 629, w: 13, h: 11},
                { x: 1145, y: 629, w: 14, h: 5},
                { x: 1145, y: 637, w: 14, h: 5},
                { x: 1145, y: 645, w: 14, h: 5},
                { x: 1145, y: 653, w: 14, h: 5},
                { x: 1145, y: 661, w: 14, h: 5},
                { x: 1145, y: 669, w: 14, h: 5},
                { x: 1145, y: 677, w: 14, h: 5},
                { x: 1145, y: 685, w: 14, h: 5},
                { x: 1145, y: 693, w: 14, h: 5},
            ], [ // hab small
                { x: 115, y: 544, w: 77, h: 83},
                { x: 195, y: 544, w: 77, h: 83},
                { x: 275, y: 544, w: 77, h: 30},
            ], [ // hab medium
                { x: 1860, y: 410, w: 77, h: 149}, // 0
                { x: 1940, y: 410, w: 78, h: 149}, // 2
                { x: 1940, y: 562, w: 78, h: 118},
                { x: 1860, y: 562, w: 77, h: 38},  // 1
            ], [ // hab tiny
                { x: 981, y: 542, w: 77, h: 54},
                { x: 1061, y: 542, w: 77, h: 56},
                { x: 1141, y: 542, w: 77, h: 30},
            ], [ // hab huge
                { x: 1515, y: 629, w: 132, h: 87},
                { x: 1650, y: 629, w: 132, h: 88},
                { x: 1785, y: 629, w: 133, h: 47},
            ], [ // ship shield addaptor, and weapon power addaptor
                { x: 421, y: 803, w: 132, h: 20},
                { x: 351, y: 893, w: 172, h: 35},
            ], [ // hab power plant, glow large , small, power sparks * 9
                { x: 1, y: 409, w: 78, h: 146},
                { x: 155, y: 409, w: 36, h: 65},
                { x: 1, y: 558, w: 74, h: 71},
                { x: 82, y: 409, w: 70, h: 10},
                { x: 82, y: 422, w: 70, h: 10},
                { x: 82, y: 435, w: 70, h: 10},
                { x: 82, y: 448, w: 70, h: 10},
                { x: 82, y: 461, w: 70, h: 10},
                { x: 82, y: 474, w: 70, h: 10},
                { x: 82, y: 487, w: 70, h: 10},
                { x: 82, y: 500, w: 70, h: 10},
                { x: 82, y: 513, w: 70, h: 10},
            ],


		],
		spriteEdges: [
			[91, 91.5, 94, 96.5, 99, 102.5, 102.5, 97.5, 98, 96, 98, 99, 99, 99.5, 100, 97.5, 95, 90.5, 92, 93.5, 96.5, 98, 96, 98.5, 99.5, 103, 101.5, 102.5, 100, 97.5, 96, 91.5, 91.5, 90.5, 90, 92, 94.5, 94.5, 98, 100, 102.5, 101.5, 102.5, 99, 93.5, 91, 91, 94.5, 97.5, 98.5, 96, 94.5, 94.5, 90, 92, 90.5, 92.5, 95, 98, 99, 102, 97.5, 95, 92.5],
			[88, 93.5, 93, 95.5, 99, 101.5, 91.5, 80, 74.5, 68.5, 61, 55.5, 49.5, 48, 47.5, 47, 45.5, 45, 45.5, 47, 50.5, 55.5, 58.5, 65.5, 72, 77, 82.5, 97.5, 100, 94.5, 91, 88.5, 84.5, 83.5, 82, 79.5, 78, 74, 71.5, 64.5, 62, 51.5, 50.5, 48.5, 48, 48, 49.5, 51, 53, 54, 54, 53, 51.5, 52, 54, 54, 53, 53.5, 57.5, 60.5, 61, 68.5, 73.5, 81.5],
			[89.5, 78, 74, 66.5, 64, 62, 58.5, 59, 55.5, 53.5, 52, 51.5, 50, 48.5, 44, 43.5, 42, 40.5, 38, 39, 40.5, 43.5, 45, 48.5, 51.5, 52.5, 58.5, 58.5, 64, 70.5, 75, 82, 88, 90, 93.5, 97, 99.5, 96.5, 80, 65, 57, 52, 50, 49, 48, 47.5, 45, 44.5, 44.5, 44.5, 46, 48.5, 49, 50, 51, 53.5, 55.5, 60.5, 69, 81.5, 101.5, 98, 94.5, 92],
			[43.5, 44, 44.5, 47, 49.5, 52, 54, 60.5, 64, 57.5, 54.5, 53.5, 53.5, 51.5, 51, 51.5, 50, 49.5, 49, 48.5, 49, 50, 53.5, 57.5, 64, 60.5, 55, 51, 47.5, 45.5, 43.5, 41, 39, 38, 38.5, 38.5, 37.5, 37, 38, 38.5, 40, 39, 37.5, 40, 41.5, 42, 40, 40.5, 43.5, 42.5, 41, 42, 46, 49, 54.5, 66.5, 59, 53, 50.5, 47.5, 46.5, 44.5, 43.5, 43],
			[39.5, 43, 45.5, 45.5, 46.5, 48.5, 52.5, 55.5, 59, 63, 61, 56.5, 54, 51.5, 53, 53, 52.5, 52, 51, 52, 54, 53, 54, 56.5, 56.5, 51.5, 49, 47.5, 46.5, 44.5, 44.5, 44, 45, 45, 45.5, 45.5, 47.5, 49.5, 52.5, 55.5, 62, 66, 62.5, 52, 48.5, 41.5, 34.5, 33, 31, 30.5, 27.5, 25, 24.5, 24.5, 25, 25.5, 26.5, 28, 27.5, 28, 30, 32, 35.5, 37],
			[52.5, 53, 53, 52, 53, 55.5, 56.5, 60.5, 63.5, 50, 46.5, 44, 41, 39.5, 39.5, 36, 34.5, 35, 34.5, 34, 31, 30.5, 31, 32, 33.5, 33.5, 34, 36, 39, 41, 41.5, 43, 47, 49, 50.5, 53, 56, 58.5, 61, 61, 57.5, 56.5, 52.5, 48.5, 45, 42.5, 41.5, 39, 38, 38, 38.5, 41.5, 44, 46, 48.5, 53, 57.5, 60.5, 56.5, 53, 51.5, 51, 50.5, 51],
			[35, 32.5, 25.5, 25.5, 25, 24, 23, 22.5, 21, 20.5, 20.5, 21.5, 22, 22.5, 25, 27, 27.5, 31, 36.5, 38.5, 41, 45, 52.5, 58, 57, 52, 46, 43.5, 39.5, 38, 36, 36.5, 36.5, 37.5, 38, 38, 39.5, 43.5, 48.5, 49.5, 55.5, 55.5, 54, 49.5, 47.5, 44.5, 41.5, 41, 41, 40, 40.5, 43.5, 46.5, 48.5, 49, 50, 54, 53.5, 48.5, 45.5, 43.5, 41, 40, 37.5],
			[39.5, 40, 40.5, 41.5, 43, 45, 44, 40, 36, 33, 33, 30, 27.5, 26.5, 24.5, 24.5, 24, 24.5, 24.5, 26.5, 28.5, 31, 33, 33, 37, 38.5, 45.5, 46, 43, 40.5, 36.5, 34, 33, 32, 29.5, 25, 24.5, 24, 24, 23, 23, 20, 18.5, 17.5, 18, 18, 18.5, 19.5, 19.5, 19.5, 17.5, 17, 17.5, 17.5, 19.5, 22.5, 27.5, 32, 49, 46, 43, 41.5, 39.5, 40],
			[16, 18.5, 31, 33.5, 39.5, 41, 41, 41.5, 40, 36.5, 34, 31, 27.5, 24.5, 21.5, 21.5, 20, 19.5, 19.5, 19, 20, 20.5, 24.5, 29, 37, 41.5, 42, 40, 38, 37, 36, 34.5, 34.5, 34.5, 35, 35, 36, 40, 43.5, 43, 40, 30, 25.5, 23, 21, 19, 14.5, 12.5, 11.5, 10.5, 9.5, 9.5, 9, 9.5, 9.5, 9.5, 10.5, 10.5, 11.5, 13, 14, 15, 14.5, 15],
			[45.5, 45, 46.5, 50, 45.5, 37, 33, 31, 28.5, 27.5, 27, 25.5, 25, 24.5, 23.5, 22.5, 21, 22.5, 22.5, 21, 22, 23, 24.5, 26.5, 27.5, 29, 31, 35, 43, 50, 47.5, 46, 45, 45, 44.5, 45.5, 47.5, 45.5, 36.5, 32, 24.5, 23.5, 22, 23, 23, 23.5, 22.5, 22.5, 22.5, 22.5, 23.5, 24.5, 25, 25.5, 25.5, 26.5, 28, 30.5, 36.5, 45.5, 46.5, 47, 46.5, 46],
			[42.5, 43, 43.5, 43.5, 45, 45, 43, 37.5, 33.5, 29.5, 26, 27, 27, 27, 26.5, 28, 28.5, 28, 27.5, 27, 29, 30.5, 28.5, 28, 29.5, 29.5, 30.5, 38, 41.5, 41.5, 41.5, 41, 42, 43, 44.5, 42.5, 43, 41.5, 39.5, 37.5, 35, 34.5, 34.5, 32.5, 30, 28, 25, 23, 21, 20, 19, 18.5, 18, 19, 19, 20.5, 24, 34.5, 43, 48.5, 47.5, 44.5, 43.5, 42],
			[48, 49.5, 51, 53.5, 54.5, 47.5, 35, 29, 26, 23.5, 22, 20.5, 20, 18, 17.5, 18.5, 19, 19.5, 20.5, 21, 22, 22, 24.5, 25, 27.5, 29, 31, 33, 39.5, 49.5, 50, 49.5, 50.5, 50.5, 50, 49.5, 52, 47.5, 38.5, 30.5, 26, 22.5, 21, 18.5, 16.5, 16, 15.5, 14.5, 14.5, 14.5, 14.5, 15, 15.5, 16, 17, 20, 21.5, 27.5, 33, 39, 45.5, 50.5, 47, 46.5],
			[39.5, 40, 40.5, 41.5, 41, 40.5, 40, 35, 33.5, 34, 29, 27.5, 28.5, 26.5, 24.5, 23.5, 22, 20.5, 20.5, 20, 21, 22, 23, 22.5, 22.5, 24, 27.5, 28.5, 35, 37.5, 37.5, 36, 38, 39, 40.5, 40.5, 42, 43, 43, 41, 38.5, 26.5, 23, 22, 22, 20, 18.5, 18.5, 18.5, 18.5, 19.5, 21, 23, 25.5, 28, 30, 33, 34.5, 36.5, 43, 43, 41.5, 39.5, 39],
			[47, 47.5, 47, 47.5, 49, 49.5, 35, 30.5, 27.5, 25, 22, 20.5, 20, 20, 18.5, 16.5, 15, 15, 14.5, 16, 16.5, 16, 17, 17, 16, 16, 16, 16, 17.5, 22, 23.5, 26.5, 30.5, 36.5, 42, 45, 53.5, 49.5, 35, 30.5, 27.5, 25, 23, 22, 21, 20, 19.5, 20.5, 20.5, 19.5, 20.5, 21, 21, 22, 23, 25, 26, 27.5, 29.5, 32.5, 38, 48.5, 49, 49.5],
			[21, 19.5, 17.5, 17, 14.5, 14, 13.5, 13.5, 14.5, 14.5, 15, 15, 14.5, 15, 14.5, 14.5, 14, 15.5, 15.5, 17, 18.5, 20.5, 24.5, 27.5, 30, 31.5, 30.5, 30, 27.5, 26.5, 24.5, 23.5, 24.5, 24.5, 23, 22, 23, 23, 23, 25, 26, 27.5, 25.5, 23, 22, 20, 19.5, 19.5, 18.5, 18.5, 17.5, 18, 17.5, 18, 18.5, 17, 17.5, 18, 18.5, 22, 24.5, 26.5, 25.5, 23.5],
			[22, 22.5, 21.5, 21, 22, 23, 23, 23.5, 24.5, 24.5, 24, 22.5, 22.5, 20.5, 21, 22, 21.5, 22, 22, 24, 24.5, 26, 26, 29, 31, 30, 27, 25.5, 23, 21, 17.5, 16.5, 16.5, 15.5, 15, 15, 14.5, 14.5, 15, 14, 12.5, 11.5, 12, 11.5, 12.5, 14.5, 15, 16, 18, 19, 19, 18.5, 19, 22.5, 26, 29, 28.5, 26.5, 25.5, 25.5, 24, 23.5, 22.5, 23.5],
			[16.5, 16, 15, 14.5, 16, 18, 20, 21.5, 24, 26.5, 28.5, 28, 28.5, 28, 27.5, 26, 25.5, 26, 25, 25, 25.5, 26, 26, 27, 26.5, 25.5, 21.5, 19, 18, 17.5, 17, 17, 17, 15, 15, 16.5, 17, 18, 17.5, 17, 18, 19, 19, 19, 18, 18.5, 18, 19, 19, 19, 21, 22.5, 25.5, 28, 32, 31.5, 28, 21.5, 19, 17, 16, 17, 17, 18],
			[18, 19.5, 19.5, 19, 20, 20.5, 21, 22.5, 23, 25, 25.5, 23, 21, 20, 19.5, 20.5, 21, 22.5, 23.5, 26.5, 28.5, 30.5, 31, 29, 27.5, 25, 23, 22, 21, 19, 18.5, 18.5, 18.5, 18.5, 18.5, 19, 21, 20, 20.5, 22.5, 23, 23.5, 26, 28.5, 29.5, 27.5, 23.5, 22.5, 21.5, 20.5, 20.5, 20, 21, 20.5, 20.5, 19.5, 19, 19.5, 19.5, 19.5, 19.5, 19, 18.5, 18.5],
			[10, 12.5, 14.5, 19, 18.5, 15.5, 15, 14.5, 16, 16, 17, 17.5, 16.5, 17, 16.5, 16.5, 16, 17.5, 17.5, 18, 18.5, 18, 17, 17, 17.5, 18, 18.5, 18.5, 18.5, 18, 17.5, 17.5, 17.5, 18.5, 17.5, 18, 17.5, 18.5, 19.5, 21, 21.5, 22.5, 21, 10.5, 9, 8.5, 8.5, 8.5, 7.5, 7.5, 7.5, 6.5, 7, 7, 7.5, 8, 7.5, 8, 8, 8.5, 8, 8.5, 8.5, 9.5],
			[28, 28.5, 29, 28.5, 28.5, 27.5, 26.5, 25, 25, 21.5, 22, 23.5, 22.5, 20.5, 19, 18, 17.5, 17, 16, 16.5, 17, 18, 19, 20.5, 22.5, 25, 28.5, 31.5, 30.5, 28.5, 27, 26.5, 25.5, 25.5, 25.5, 26.5, 26.5, 27.5, 29, 30, 29.5, 27, 25, 23.5, 22.5, 21.5, 21, 20, 21, 21, 21, 21.5, 22.5, 23.5, 24, 25.5, 28, 29, 28.5, 27.5, 28.5, 28.5, 28, 28.5],
			[13.5, 13, 13, 13.5, 15, 15.5, 18, 24.5, 26, 23.5, 21, 19.5, 18.5, 18, 17.5, 17.5, 17, 18.5, 18.5, 19, 21, 23, 25.5, 26.5, 25, 24.5, 22.5, 21.5, 20.5, 18.5, 18, 18, 18, 18, 18, 18.5, 19, 21.5, 22, 23, 25, 26.5, 24.5, 23, 22, 21, 20.5, 20.5, 20.5, 20.5, 21.5, 22, 22, 22, 19.5, 18.5, 18, 18, 16.5, 15.5, 15, 14.5, 14, 14],
			[14.5, 15, 14, 14.5, 16, 17, 18, 19, 19.5, 22, 26.5, 26.5, 25, 24.5, 23.5, 21.5, 19, 19.5, 20.5, 21, 21, 21, 21.5, 18.5, 18, 16.5, 15.5, 14.5, 14, 13.5, 14, 14, 14, 14, 15, 16.5, 16.5, 17, 16.5, 16.5, 18, 20, 21, 19.5, 20, 20, 19.5, 20.5, 21.5, 21.5, 22.5, 24.5, 24, 25.5, 25.5, 25, 22.5, 19, 18, 17, 16.5, 16.5, 16, 15],
			[22, 22.5, 22.5, 23.5, 23.5, 24, 25.5, 26.5, 28.5, 29, 27.5, 27, 27, 25, 25, 25, 23.5, 23, 22, 24, 27, 28, 27.5, 22.5, 20.5, 20, 19.5, 21, 22, 22, 22.5, 23.5, 23.5, 22.5, 21.5, 22, 23, 24, 25.5, 26.5, 24, 20.5, 18, 17, 16.5, 16.5, 16, 17, 18, 20, 21, 22.5, 23.5, 28, 30, 31, 31.5, 30, 28, 25.5, 24, 23.5, 21.5, 21.5],
			[24, 23.5, 23.5, 24.5, 25, 25.5, 27, 27.5, 26.5, 25.5, 24, 22.5, 21.5, 19.5, 19, 19, 18.5, 18, 17, 16.5, 16.5, 17, 18, 19, 20.5, 22, 25, 27.5, 27.5, 26.5, 25.5, 26.5, 26.5, 26.5, 28, 27.5, 27.5, 27.5, 26.5, 25, 23, 21.5, 20.5, 20, 20.5, 20.5, 20, 20, 19, 19, 19, 18.5, 19, 20, 20, 21.5, 24, 25, 26.5, 29.5, 29.5, 28.5, 28, 25.5],
			[19, 20.5, 20.5, 22, 23, 25.5, 27, 29, 28.5, 27.5, 27, 24, 20, 17, 16.5, 16.5, 16, 16.5, 17.5, 17, 17.5, 19.5, 19.5, 19.5, 20.5, 22.5, 24, 24, 23, 23.5, 22.5, 22.5, 21.5, 20.5, 19.5, 20, 20, 20.5, 21, 21, 21.5, 22.5, 22, 23, 22, 22, 21.5, 22.5, 22.5, 21.5, 21.5, 22, 23, 23, 23, 26.5, 27.5, 29, 27, 24, 22, 21, 19.5, 19.5],
			[15.5, 16, 17, 18.5, 19, 21.5, 21.5, 23, 24, 25, 25.5, 26.5, 25, 24.5, 23.5, 22.5, 21, 19.5, 18.5, 19, 22, 22, 21.5, 20, 18, 15.5, 15.5, 15.5, 15, 15.5, 15, 16, 16, 17, 17, 18.5, 20.5, 20, 20.5, 21, 21.5, 22, 22, 22, 22, 22, 21.5, 22.5, 22.5, 22.5, 22.5, 23.5, 25, 25.5, 25.5, 23.5, 21, 19.5, 19, 18, 17, 16.5, 15, 16],
			[19.5, 20, 20, 20.5, 21.5, 21.5, 21.5, 22, 22.5, 23.5, 24, 23.5, 22.5, 21.5, 22, 24, 24.5, 24, 22, 22.5, 25.5, 27, 27.5, 28, 28, 27, 25, 23.5, 21.5, 19.5, 18, 18, 18, 18, 18, 17.5, 18, 19, 20, 23, 26.5, 27, 26, 26, 25.5, 25, 25, 25, 24, 24, 23, 24, 23.5, 24.5, 27.5, 28, 28, 27, 24, 22.5, 21.5, 21.5, 21, 21],
			[27.5, 29, 29.5, 30, 30, 30.5, 31, 31, 27.5, 25, 22, 19.5, 12, 10.5, 10.5, 10.5, 10, 10, 9.5, 9.5, 9, 9.5, 9, 9, 9, 9, 9.5, 10, 10.5, 11, 12, 13, 16, 20, 21, 22.5, 24.5, 31.5, 33, 29.5, 28.5, 20, 18.5, 17.5, 16.5, 16, 15.5, 15.5, 15.5, 15.5, 16.5, 17, 17.5, 18.5, 19.5, 21, 23, 24.5, 26, 28, 28, 28, 28.5, 28],
			[15.5, 16, 15, 15.5, 16, 15.5, 16.5, 18, 19.5, 22, 23, 24, 23, 21, 17.5, 16.5, 15, 15.5, 15.5, 16, 16.5, 17.5, 18.5, 21, 21.5, 21.5, 19, 18, 17, 16.5, 16, 16, 16, 17, 17, 17.5, 18, 19, 20, 23, 24, 26.5, 24.5, 23, 23, 22, 20.5, 20.5, 19.5, 19.5, 19.5, 20, 21, 22, 22, 22.5, 22.5, 21.5, 21.5, 20, 18, 17.5, 16, 17],
			[6, 6.5, 6.5, 6.5, 7, 7, 7.5, 8, 9, 9, 9.5, 13.5, 16.5, 16.5, 17, 19, 18.5, 20, 22, 22.5, 23.5, 24.5, 24, 22.5, 21.5, 20, 17, 16, 14.5, 13, 12.5, 12.5, 12.5, 12.5, 12.5, 13, 12, 11.5, 12.5, 12.5, 13, 14, 15, 18, 18, 19.5, 20, 22, 22, 20, 20, 20.5, 21.5, 21.5, 22, 21.5, 21.5, 18.5, 10, 7, 7, 6.5, 6.5, 6.5],
			[5, 5.5, 5, 4.5, 4.5, 4, 4, 4.5, 4, 4, 4.5, 4, 4, 4, 4, 4, 4, 5, 5, 6, 7.5, 12, 14, 14.5, 14, 13.5, 12.5, 11.5, 12, 12, 10.5, 10.5, 10.5, 9.5, 9.5, 9.5, 9, 9.5, 10, 10.5, 9.5, 10, 9.5, 9.5, 10.5, 11, 11, 11, 12, 12, 12, 12.5, 12.5, 12, 13, 14, 14, 14, 13.5, 13, 9, 7.5, 7.5, 6.5],


			[73.5, 76, 86.5, 87.5, 82, 82.5, 86.5, 86.5, 74.5, 80, 85, 88, 88.5, 90.5, 90.5, 90, 90.5, 90, 90.5, 90.5, 88.5, 88, 85, 80, 74.5, 86.5, 86.5, 82.5, 82, 87.5, 86.5, 76, 74, 60, 54, 51, 50.5, 52, 52.5, 55, 57.5, 60.5, 64.5, 70, 73.5, 78, 83.5, 90, 92, 90, 83.5, 78, 73.5, 70, 64.5, 60.5, 57.5, 55, 52.5, 52, 50.5, 51, 54, 60],
	/* ship 3 guns */ [97.5, 94, 99.5, 102, 106, 111, 113, 109.5, 83, 82, 89.5, 94.5, 96.5, 98.5, 98, 98.5, 99, 98.5, 98, 98.5, 96.5, 94.5, 89.5, 82, 83, 109.5, 113, 111, 106, 102, 99.5, 94, 98, 96.5, 92.5, 95, 97, 102, 105, 51.5, 54, 58, 61.5, 65, 67.5, 71.5, 76.5, 99.5, 99.5, 99.5, 76.5, 71.5, 67.5, 65, 61.5, 58, 54, 51.5, 105, 102, 97, 95, 92.5, 96.5],
	/* ship 5 guns */ [113.5, 117.5, 115, 122, 126.5, 132.5, 135.5, 126.5, 83, 82, 89.5, 94.5, 96.5, 98.5, 98, 98.5, 99, 98.5, 98, 98.5, 96.5, 94.5, 89.5, 82, 83, 126.5, 135.5, 132.5, 126.5, 122, 115, 117.5, 114, 110.5, 111, 113.5, 121.5, 102, 105, 51.5, 54, 58, 61.5, 65, 67.5, 71.5, 76.5, 99.5, 99.5, 99.5, 76.5, 71.5, 67.5, 65, 61.5, 58, 54, 51.5, 105, 102, 121.5, 113.5, 111, 110.5],
		],
        spriteEdgeGrouped: [[// Rock glow
            ],[
                [29.5, 29, 27.5, 26, 27, 28, 30, 32, 35, 39, 44.5, 106, 106.5, 102.5, 100, 98.5, 98, 98.5, 100, 102.5, 106.5, 106, 44.5, 39, 35, 32, 30, 28, 27, 26, 27.5, 29, 30, 29, 28.5, 44.5, 48.5, 54, 57.5, 62, 67.5, 72.5, 78.5, 84, 88.5, 92, 95, 97.5, 98.5, 97.5, 95, 92, 88.5, 84, 78.5, 72.5, 67.5, 62, 57.5, 54, 48.5, 44.5, 28.5, 29],
                [24.5, 26, 26.5, 27, 27, 29, 33.5, 40, 67.5, 78.5, 73, 69, 66, 63.5, 62, 61, 60.5, 61, 62, 63.5, 66, 69, 73, 78.5, 67.5, 40, 33.5, 29, 27, 27, 26.5, 26, 25, 25, 25, 26, 25.5, 30.5, 31, 32, 63.5, 62, 60, 62, 62.5, 61.5, 56, 56, 59, 61, 54, 58.5, 63.5, 62, 66, 46.5, 35, 32, 30, 28, 27, 26, 25, 25],
                [31.5, 33, 34.5, 49, 53, 56.5, 57.5, 50, 45, 41, 38, 36, 34.5, 33, 32.5, 32, 31.5, 32, 32.5, 33, 34.5, 36, 38, 41, 45, 50, 57.5, 56.5, 53, 49, 34.5, 33, 32, 31, 30.5, 30, 29, 29.5, 30.5, 37.5, 38, 33.5, 38, 34, 33.5, 27.5, 30.5, 31, 30, 28, 29.5, 31, 30, 34, 37.5, 38.5, 38, 34.5, 30.5, 29.5, 29, 30, 30.5, 31],
                [33.5, 36, 48.5, 52, 54, 48.5, 41, 36, 32.5, 29.5, 27.5, 26, 24.5, 24, 23, 23, 22.5, 23, 23, 24, 24.5, 26, 27.5, 29.5, 32.5, 36, 41, 48.5, 54, 52, 48.5, 37, 35, 34, 33.5, 32, 32, 34, 36, 26.5, 25, 25.5, 27.5, 19, 18, 19.5, 20, 19, 23, 20, 14, 13.5, 12.5, 21.5, 21.5, 22, 31, 28, 32, 31.5, 31, 32, 32.5, 33],
                [59.5, 61, 61, 61.5, 62.5, 62, 62.5, 63, 63.5, 66, 82.5, 89, 120, 115.5, 113, 111.5, 110.5, 111.5, 113, 115.5, 120, 89, 82.5, 66, 63.5, 63, 62.5, 62, 62.5, 61.5, 61, 61, 60, 60, 61, 62.5, 64.5, 68, 72, 77.5, 83, 86.5, 91.5, 95, 98, 100, 101.5, 111.5, 107, 111.5, 101.5, 100, 98, 95, 91.5, 86.5, 83, 77.5, 72, 68, 64.5, 62.5, 61, 60],
                [51.5, 49, 45.5, 44.5, 45, 60, 58, 58, 60.5, 78.5, 89.5, 84, 80.5, 77.5, 75.5, 74.5, 74, 74.5, 75.5, 77.5, 80.5, 84, 89.5, 78.5, 59, 54, 56.5, 46, 45, 44.5, 45.5, 49, 52, 55, 58, 61.5, 64.5, 69, 72, 77.5, 84.5, 96, 82.5, 76.5, 73, 77.5, 66.5, 65.5, 61.5, 66.5, 69.5, 73.5, 75.5, 80.5, 84.5, 96, 84.5, 77.5, 72, 69, 64.5, 61.5, 58, 55],
                [46.5, 45, 43.5, 47, 53, 57.5, 61, 61, 55, 50, 46.5, 44, 42, 40.5, 39.5, 39, 38.5, 39, 39.5, 40.5, 42, 44, 46.5, 50, 55, 61, 58.5, 55.5, 50.5, 44.5, 42.5, 44, 44, 49, 45.5, 41, 44, 47.5, 61, 58, 55, 42.5, 43, 41.5, 41, 37.5, 37.5, 39, 35, 32, 36.5, 39.5, 42, 43, 46.5, 45.5, 42, 56.5, 57.5, 60, 46.5, 34, 49.5, 54],
                [42, 44.5, 48, 50.5, 52, 54.5, 46.5, 40.5, 36.5, 33.5, 31, 29, 28, 27, 26.5, 26, 25.5, 26, 26.5, 27, 28, 29, 31, 33.5, 36.5, 40.5, 46.5, 55, 54.5, 53.5, 52.5, 47.5, 45.5, 44.5, 47, 48.5, 55.5, 51.5, 32, 31.5, 28.5, 30.5, 9.5, 9.5, 9.5, 11, 12.5, 15, 17, 21, 23, 22, 22, 9.5, 4, 23, 28, 26.5, 39.5, 50.5, 55.5, 46.5, 43, 40.5],
                [77.5, 79, 80.5, 82.5, 81, 55.5, 50, 44, 36.5, 33.5, 31, 16.5, 20.5, 27, 26.5, 26, 25.5, 26, 26.5, 27, 20.5, 29, 31, 33.5, 38, 44, 53.5, 55.5, 81, 82.5, 80.5, 79, 78, 75, 79.5, 73, 47, 38, 33.5, 36, 39.5, 38.5, 21.5, 20, 19, 18.5, 18, 21, 23, 21, 18, 18.5, 19, 20, 21.5, 23, 42, 41, 37.5, 38, 47, 73, 79.5, 75],
                [78.5, 79, 80.5, 77.5, 56, 41, 31, 27.5, 24.5, 12.5, 14, 16.5, 18.5, 18, 17.5, 17.5, 17, 17.5, 17.5, 18, 18.5, 16.5, 14, 22.5, 24.5, 27.5, 35, 43, 53, 77.5, 80.5, 79, 79, 79, 76, 75, 56, 31.5, 29.5, 14.5, 13, 9, 9, 9.5, 10, 13.5, 15, 15.5, 17.5, 18.5, 19.5, 20, 10, 9.5, 9, 9, 9, 31, 31, 29, 43, 74, 76, 79],
                [29.5, 33, 37.5, 27.5, 4, 4, 4, 4.5, 4, 4, 4.5, 4.5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4.5, 4, 4, 4.5, 4.5, 4, 27.5, 37.5, 33, 30, 26, 23, 20.5, 18, 14.5, 12.5, 11, 9.5, 10, 9.5, 9, 8.5, 8, 8, 8, 8, 8, 8, 8, 8.5, 9, 9.5, 10, 11, 12.5, 12.5, 14.5, 16, 20.5, 23, 26],
                [42, 47.5, 50, 51.5, 53.5, 43, 36.5, 32, 28.5, 26.5, 24.5, 23, 22, 21, 20.5, 22.5, 22, 22.5, 22.5, 21, 22, 23, 24.5, 26.5, 28.5, 32, 36.5, 43, 53.5, 51.5, 50, 47.5, 43.5, 42.5, 42, 41, 40.5, 32.5, 27.5, 27.5, 27.5, 26.5, 25.5, 25.5, 24, 23.5, 22.5, 22.5, 22.5, 22.5, 22.5, 23.5, 24, 24, 24.5, 25, 26, 26, 27.5, 35, 39.5, 40, 41, 41.5],
                [43, 42.5, 48, 51.5, 53.5, 53, 44.5, 39, 35, 32, 30, 28, 27, 26, 25, 27, 26.5, 27, 27.5, 26, 27, 28, 30, 32, 35, 39, 44.5, 53, 53.5, 51.5, 40, 44.5, 43.5, 41.5, 41, 31, 28.5, 30, 29, 16, 16, 16.5, 16.5, 14.5, 14, 14.5, 15, 16, 17, 18, 17.5, 16.5, 16, 15.5, 18, 18, 17.5, 16, 16, 28.5, 36.5, 38, 39, 43.5],
                [26.5, 28, 31.5, 24, 18, 14.5, 12.5, 11, 9.5, 9, 8, 7.5, 7.5, 7, 7, 7, 6.5, 7, 7, 7, 7.5, 7.5, 8, 9, 9.5, 11, 12.5, 14.5, 18, 24, 31.5, 29, 27, 23, 20.5, 17.5, 15.5, 12.5, 10.5, 9, 8, 9, 8, 7.5, 7.5, 7, 7, 7, 7, 7, 7, 7, 7.5, 7.5, 8, 9, 9.5, 10, 10.5, 12.5, 15.5, 17, 20.5, 23],
                [7, 7.5, 7.5, 7.5, 8, 8.5, 9, 9.5, 10.5, 11.5, 12, 12, 12.5, 12.5, 13, 13, 12.5, 13, 13, 12.5, 12.5, 12, 12, 11.5, 10.5, 9.5, 9, 8.5, 8, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 8, 8.5, 9, 9, 9, 9, 9.5, 15.5, 16.5, 18.5, 20, 21, 21, 21, 20, 18.5, 17, 15.5, 13, 9, 9, 9, 9, 8.5, 8, 7.5, 7.5, 7.5],
                [4, 4.5, 4, 4.5, 4, 5, 4, 4, 4.5, 4.5, 4, 5, 6.5, 8.5, 12.5, 14.5, 14, 14.5, 14.5, 12, 9, 7, 6, 5.5, 4.5, 4.5, 4, 4, 4.5, 4, 4.5, 4, 4.5, 4.5, 4, 4.5, 4, 5, 4, 4.5, 4.5, 5.5, 6, 7, 9, 15, 14.5, 13.5, 13.5, 13.5, 14.5, 8.5, 6.5, 5, 4, 4, 4.5, 4.5, 4, 4, 4.5, 4, 4.5, 4.5],
                [47.5, 48, 48.5, 50, 49.5, 49.5, 50.5, 47, 45, 44, 52, 55, 115.5, 111.5, 109, 107.5, 106.5, 107.5, 109, 111.5, 115.5, 55, 52, 44, 45, 47, 50.5, 49.5, 49.5, 50, 48.5, 48, 48, 48, 45.5, 44.5, 41.5, 38, 35.5, 38.5, 63.5, 75.5, 86, 91.5, 92, 93, 105, 103, 90, 89, 86.5, 94, 94, 91.5, 86, 75.5, 63.5, 38.5, 35.5, 38, 41.5, 44.5, 45.5, 48],
                [35.5, 20, 28.5, 30, 32, 31.5, 32, 33.5, 36.5, 42.5, 89.5, 88, 84, 81.5, 79.5, 78, 77.5, 78, 79.5, 81.5, 84, 88, 89.5, 42.5, 36.5, 33.5, 32, 31.5, 32, 30, 30.5, 40, 42, 46, 46, 42.5, 53, 55.5, 55, 58, 69, 69.5, 69.5, 72.5, 73.5, 70, 70, 74, 70, 73, 78.5, 80, 61.5, 57.5, 57.5, 61, 59, 59.5, 56.5, 54, 52, 49, 46.5, 44],
                [26.5, 27, 28.5, 30, 33.5, 37, 60, 64.5, 62, 56.5, 52.5, 49.5, 47.5, 45.5, 44.5, 44, 43.5, 44, 44.5, 45.5, 47.5, 49.5, 52.5, 56.5, 62, 64.5, 60, 38.5, 34.5, 32, 29.5, 28, 26, 25, 24, 26, 27, 28, 53.5, 49, 46.5, 45, 46.5, 46.5, 45, 42.5, 39.5, 39, 40, 43, 41.5, 38.5, 42, 40.5, 49, 47.5, 52, 37.5, 37, 34, 29, 28, 27.5, 26],
                [29.5, 30, 29.5, 27.5, 23.5, 19, 19.5, 20.5, 21, 23, 25, 26, 28.5, 31, 33.5, 36, 38.5, 45, 48.5, 49, 47.5, 45, 43, 40.5, 38, 36, 34.5, 33.5, 32, 31, 30.5, 30, 30, 30, 30.5, 31, 32, 33.5, 34.5, 37.5, 39.5, 40.5, 44, 46.5, 48.5, 50, 48.5, 45, 40, 36, 33.5, 31, 28.5, 26, 25, 23, 21, 20.5, 19.5, 19, 23.5, 27.5, 29.5, 30],
                [29.5, 30, 29.5, 27.5, 23.5, 19, 19.5, 20.5, 19.5, 20.5, 21.5, 27, 28.5, 31, 33.5, 47, 39.5, 45, 48.5, 49, 47.5, 45, 41, 40.5, 38, 36, 34.5, 33.5, 32, 31, 30.5, 30, 30, 30, 30.5, 31, 32, 33.5, 34.5, 38.5, 32.5, 42.5, 44, 46.5, 48.5, 50, 48.5, 45, 40, 36, 33.5, 31, 28.5, 31.5, 25, 23, 21, 20.5, 19.5, 19, 23.5, 27.5, 29.5, 30],
                [10.5, 11, 11, 11, 11.5, 13.5, 14, 15.5, 18, 20, 37.5, 44.5, 53, 51, 49.5, 49, 48.5, 49, 49.5, 51, 53, 10.5, 8.5, 7.5, 5.5, 5, 4.5, 4.5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4.5, 4.5, 5, 5.5, 6, 7, 7.5, 7.5, 10, 15, 40.5, 48, 49, 45.5, 44.5, 36.5, 21, 17.5, 15.5, 14, 12.5, 12.5, 12, 11.5, 11, 11, 11],
                [9.5, 10, 10, 10, 10.5, 10.5, 10.5, 11.5, 11, 12.5, 16, 38, 47, 51, 49.5, 49, 48.5, 49, 49.5, 51, 53, 50.5, 14, 11, 9.5, 7.5, 7, 6.5, 6, 5, 5, 5, 5, 5, 5, 4, 4, 4.5, 4.5, 5, 5.5, 5, 5, 6, 6, 6.5, 10, 11, 18, 25, 42.5, 48, 47.5, 43, 43, 20, 16.5, 14, 13, 12, 10.5, 10, 10, 10],
                [12.5, 14, 16, 18.5, 19, 20, 21.5, 21.5, 21, 28, 27.5, 26, 24.5, 24, 23, 23, 22.5, 23, 23, 24, 24.5, 26, 27.5, 29.5, 32.5, 31, 28.5, 18, 15.5, 14.5, 12, 6, 6, 5, 10, 10, 8.5, 10, 10.5, 11, 11, 14, 16, 21.5, 23.5, 22.5, 21, 20, 22, 22, 23, 24, 24.5, 17, 16, 14, 14, 12.5, 12, 11, 11.5, 11, 11, 12],
                [50.5, 51, 49.5, 73, 80, 79.5, 71, 51, 59, 54.5, 51, 48, 29.5, 28.5, 41, 42.5, 42, 42.5, 41, 28.5, 29.5, 48, 51, 54.5, 59, 51, 71, 79.5, 80, 73, 49.5, 51, 51, 48, 48.5, 47, 46.5, 43, 39.5, 38.5, 36, 32.5, 44.5, 43.5, 39.5, 38, 43, 26.5, 25.5, 25.5, 25.5, 25.5, 26, 25.5, 25, 26.5, 48.5, 50, 43, 43, 46.5, 47, 48.5, 48],
                [53.5, 56, 57, 73, 80, 79.5, 71, 51, 59, 54.5, 51, 48, 31.5, 29.5, 41, 42.5, 42, 42.5, 41, 28.5, 29.5, 48, 51, 54.5, 59, 51, 71, 79.5, 80, 73, 49.5, 51, 51, 48, 45.5, 45.5, 41, 39.5, 39.5, 38.5, 36, 32.5, 44.5, 43.5, 39.5, 38, 43, 25.5, 25.5, 25.5, 23.5, 25.5, 26, 25.5, 27, 26.5, 16.5, 13, 35, 41, 46.5, 50, 51.5, 52],
                [69.5, 74, 73, 65, 30, 46.5, 39.5, 34.5, 31, 11.5, 10.5, 11, 13, 21.5, 22, 22, 21.5, 22, 22, 21.5, 13, 12, 13, 14, 31, 34.5, 39.5, 46.5, 57, 65, 73, 74, 70, 51, 43.5, 41, 30, 30.5, 25, 17, 7, 6, 6, 5.5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5.5, 6, 6, 5.5, 28, 27.5, 24.5, 25.5, 62.5, 61, 57],
            ],[// hyper space ring
            ],[// missile habitat and parts
                [18.5, 19, 19, 19.5, 20.5, 21.5, 22.5, 24.5, 26.5, 29.5, 28.5, 28, 27, 26, 24, 24, 23.5, 24, 24, 25, 27, 28, 28.5, 31, 28, 25.5, 24, 22.5, 21.5, 20.5, 20, 20, 20, 20, 20, 20.5, 21.5, 48.5, 44.5, 39, 35, 32, 27.5, 26, 24.5, 24, 25, 25, 25, 25, 25, 24, 24.5, 26, 27.5, 32, 35, 39, 44.5, 48.5, 20.5, 19.5, 19, 19],
                [18.5, 17, 23, 24, 23.5, 23, 23, 24.5, 26.5, 29.5, 28.5, 28, 27, 26, 24, 24, 23.5, 24, 24, 25, 27, 28, 28.5, 31, 28, 20.5, 19.5, 20, 18, 17.5, 20, 20, 30, 33, 31.5, 30, 35.5, 33.5, 32, 31, 28, 29.5, 24, 22.5, 21.5, 18.5, 25, 25, 25, 25, 25, 24, 24.5, 26, 27.5, 32, 33.5, 33.5, 35.5, 35, 33.5, 19.5, 19, 19],
                [23.5, 23, 22, 21.5, 21.5, 22.5, 24, 25.5, 24.5, 23.5, 22, 20.5, 18.5, 18, 17.5, 17.5, 17, 17.5, 17.5, 18, 18.5, 20.5, 22, 23.5, 24.5, 29, 28.5, 24.5, 21.5, 16.5, 16, 15, 15, 15, 14, 13.5, 12.5, 14.5, 18.5, 11.5, 12.5, 14, 14, 11.5, 8, 7.5, 7.5, 8.5, 8.5, 8.5, 17.5, 19, 18.5, 18.5, 18.5, 22, 17.5, 16.5, 17, 11, 16.5, 15.5, 14, 24],
            ],[// rocket pod rockets and FX
            ],[ // small alien ship
                [34.5, 35, 34.5, 34, 33.5, 29.5, 27.5, 27, 26.5, 26.5, 27.5, 27.5, 28, 28, 27.5, 27, 26.5, 27, 27.5, 28, 28, 27.5, 27.5, 26.5, 26.5, 27, 27.5, 29.5, 33.5, 34, 34.5, 35, 35, 35, 35.5, 35.5, 34.5, 35, 34, 33.5, 32.5, 31.5, 30, 27, 27, 27, 26.5, 27, 27, 27, 26.5, 27, 27, 27, 30, 31.5, 32.5, 33.5, 34, 35, 34.5, 35.5, 35.5, 35],
            ],[ // docking platform parts
            ],[ // large rocks
                 [155.5, 157.5, 159, 165, 168.5, 170.5, 170.5, 172, 168, 170, 172.5, 171.5, 169, 163.5, 162.5, 156, 156, 153, 153, 155, 156, 157, 163.5, 163.5, 163, 166.5, 169.5, 171, 169.5, 168, 167, 164.5, 157, 154.5, 157, 157.5, 158, 161, 167, 170.5, 175, 171, 167.5, 164.5, 163.5, 159, 156.5, 157, 157.5, 160, 161.5, 164.5, 168, 168, 170.5, 171.5, 171, 168, 167, 166.5, 165.5, 165, 162, 157.5],
                 [66.5, 67, 68, 70, 74.5, 89.5, 91.5, 91.5, 91.5, 91.5, 91, 86, 76.5, 73, 71, 70, 71.5, 76, 80.5, 82.5, 82, 82.5, 85, 86.5, 86, 82.5, 81.5, 78, 74.5, 72, 72, 69, 69, 69, 73, 81.5, 82, 82.5, 84.5, 87.5, 91.5, 89, 87.5, 87, 85.5, 80, 75, 73, 73, 73, 75, 78, 85.5, 87, 90, 89.5, 87.5, 87.5, 89.5, 88, 84, 81.5, 70, 67],
                 [44.5, 45, 45.5, 47, 46.5, 45, 44.5, 42.5, 38, 34.5, 32, 30.5, 29, 28, 27.5, 27, 27.5, 29, 27.5, 28, 29, 30.5, 32, 34.5, 38, 40.5, 43, 42, 42, 42.5, 44.5, 45, 44, 41, 38.5, 34, 34.5, 36, 38, 38.5, 36.5, 36, 34.5, 32.5, 28, 27, 26.5, 26, 26, 26, 26.5, 27, 28, 29, 31, 33.5, 35, 37.5, 42, 44.5, 44, 42.5, 43.5, 43],
                 [46, 46.5, 47, 48.5, 49, 49.5, 47.5, 43, 34.5, 29, 27, 25.5, 24, 23.5, 22.5, 22.5, 22, 22.5, 22.5, 23.5, 25, 26.5, 28, 30, 33, 40, 47.5, 48, 49, 48.5, 47, 46.5, 45.5, 46.5, 46, 45, 44.5, 41, 37.5, 35.5, 34.5, 34, 33, 31, 30.5, 29.5, 29, 27.5, 26.5, 25.5, 24.5, 24.5, 26.5, 28.5, 30.5, 34, 37, 43, 42.5, 43.5, 43.5, 43, 42, 43.5],
                 [43, 44.5, 46, 47.5, 47, 44.5, 42.5, 42, 38.5, 36.5, 34, 30, 28.5, 27.5, 27, 26.5, 27, 28.5, 29, 29.5, 30.5, 31, 33, 35.5, 38.5, 41.5, 45.5, 47, 49, 47.5, 46, 45.5, 44.5, 43.5, 46, 47.5, 49, 47.5, 42, 40, 38.5, 36.5, 34, 32, 30.5, 29.5, 29, 28.5, 28.5, 28.5, 29, 29.5, 30.5, 31, 31.5, 32.5, 34.5, 35, 36.5, 37.5, 38, 39.5, 41, 42.5],
                 [43, 42.5, 43, 43, 44.5, 44.5, 43, 42.5, 38, 33.5, 32, 30.5, 29, 28, 27.5, 27, 26.5, 27, 27.5, 28, 29, 29, 31, 32, 33.5, 37.5, 41, 44.5, 46, 46.5, 46, 45.5, 44.5, 43.5, 45, 47.5, 48, 48.5, 44.5, 40.5, 33.5, 32, 30, 29, 29, 28, 27.5, 27, 27, 27, 27.5, 28, 29, 30.5, 32, 34.5, 38, 42.5, 43.5, 43.5, 43.5, 43, 44, 44.5],
                 [41.5, 43, 45.5, 47, 48.5, 48.5, 49, 41.5, 37, 34, 33, 31, 29.5, 28.5, 28, 26.5, 26, 26.5, 28, 28.5, 29.5, 32, 35, 38, 38.5, 41, 43, 43, 45, 46.5, 45.5, 44, 44, 45, 44.5, 44.5, 45, 43, 42, 40, 39.5, 36.5, 34, 32, 30.5, 29.5, 29, 28.5, 28.5, 29.5, 30, 30.5, 31.5, 33, 34, 35.5, 37, 41, 44, 43, 43, 41.5, 38.5, 40],
                 [47, 46.5, 47, 47.5, 48, 48, 46.5, 44, 35, 25.5, 24, 22.5, 21.5, 20.5, 20, 20, 19.5, 20, 20, 20.5, 21.5, 22.5, 24, 25.5, 28, 47, 51, 51.5, 50, 49.5, 48, 44.5, 43.5, 44.5, 47, 49.5, 51, 51.5, 51, 45.5, 32.5, 29.5, 27.5, 26, 24.5, 24, 23, 23, 23, 23, 23, 24, 24.5, 26, 27.5, 37.5, 42, 45.5, 47.5, 47, 47, 48.5, 47, 47.5],
            ],[ // metal tanks
                [34.5, 34, 33.5, 33, 32.5, 32.5, 31, 31, 31.5, 45.5, 47.5, 44.5, 42.5, 41, 40, 39.5, 39, 39.5, 40, 41, 42.5, 44.5, 44.5, 34, 36.5, 41.5, 42, 36, 34.5, 33, 32.5, 32, 32, 32, 32.5, 32.5, 32, 32.5, 33.5, 33.5, 33.5, 34, 34, 34.5, 36, 37, 38, 39.5, 38.5, 35.5, 34, 31.5, 33, 33, 34, 34.5, 34.5, 37, 38.5, 38.5, 36.5, 35.5, 34.5, 34],
                [26, 26.5, 27, 25.5, 26.5, 30, 31.5, 32.5, 33, 34.5, 60, 58.5, 56, 54, 53, 52, 51.5, 52, 53, 54, 56, 58.5, 58, 40, 39.5, 39, 37.5, 37.5, 36, 32.5, 33, 33.5, 33.5, 33.5, 33, 32.5, 36, 36.5, 37.5, 38, 38.5, 38.5, 39.5, 39.5, 38.5, 39.5, 49.5, 52, 52, 45.5, 37.5, 36.5, 36.5, 35, 34.5, 33.5, 33, 31.5, 30.5, 30, 27.5, 25.5, 27, 26.5],
                [28.5, 29, 29.5, 31, 31, 34, 35.5, 36, 38, 38.5, 39.5, 55, 58, 56, 55, 54, 53.5, 54, 55, 56, 58, 61, 50, 38.5, 38, 36, 35.5, 34, 30, 31, 29.5, 29, 29, 30, 30.5, 29, 32, 32.5, 33.5, 34.5, 35, 34.5, 35.5, 36, 36.5, 36.5, 40.5, 49, 54, 49, 40.5, 36.5, 36.5, 36, 35.5, 34.5, 35, 34.5, 33.5, 32.5, 32, 30, 30.5, 30],
                [28, 34.5, 35, 36, 37, 39, 42.5, 43, 54, 60, 55.5, 52.5, 50, 48.5, 47, 46.5, 46, 46.5, 47, 48.5, 50, 52.5, 55.5, 57.5, 38.5, 44.5, 46, 42.5, 40.5, 39, 38, 38.5, 31.5, 31.5, 31, 31.5, 33, 35.5, 41, 41.5, 41.5, 43, 45, 45.5, 47, 47.5, 47, 46.5, 46.5, 46.5, 47, 46.5, 45.5, 43.5, 42.5, 40.5, 38.5, 39, 37.5, 32, 29.5, 28.5, 28, 28.5],
                [33.5, 34, 33.5, 32, 32, 31.5, 30.5, 31, 31, 45.5, 45.5, 43, 41, 39.5, 38.5, 38, 37.5, 38, 38.5, 39.5, 41, 43, 44.5, 39, 35, 40.5, 41, 36, 33.5, 30, 28.5, 27, 27, 26, 26.5, 27, 28, 28, 28.5, 29.5, 29.5, 23, 22.5, 22.5, 23.5, 24, 25, 26, 28, 29, 29.5, 30, 32, 35, 44.5, 42.5, 39.5, 37.5, 39.5, 38.5, 36.5, 35.5, 34.5, 34],
                [25, 23.5, 22.5, 21, 18.5, 32, 34, 34.5, 31, 28, 26, 24.5, 23.5, 22.5, 22, 22, 21.5, 22, 22, 22.5, 23.5, 24.5, 26, 28, 31, 32.5, 30.5, 28.5, 23.5, 28.5, 31, 32.5, 29.5, 27.5, 23.5, 21, 20, 18.5, 17, 16, 16, 15.5, 17, 18, 19.5, 22.5, 22, 20, 17, 15, 12.5, 12, 11.5, 10, 9.5, 9, 9, 6, 6.5, 6, 20.5, 22, 21.5, 28.5],
                [18.5, 31, 33.5, 35.5, 36.5, 36, 30.5, 26.5, 24, 21.5, 20, 19, 18, 17.5, 17, 17, 16.5, 17, 17, 17.5, 18, 19, 20, 21.5, 24, 26.5, 30.5, 36, 34.5, 33, 17, 20, 21, 23, 26.5, 31, 28.5, 28, 27.5, 21.5, 21, 19, 18, 17, 12.5, 13.5, 15, 16, 16, 14, 13, 11, 14, 15.5, 15.5, 20.5, 24, 24.5, 21.5, 30.5, 27, 21.5, 18, 19],
                [34.5, 34, 34.5, 41.5, 43, 45, 40, 35, 31.5, 29, 27, 25.5, 24, 23.5, 22.5, 22.5, 22, 22.5, 22.5, 23.5, 24, 25.5, 27, 29, 31.5, 35, 40, 39.5, 37.5, 25, 38.5, 39, 39, 39, 40.5, 41.5, 43, 39, 32, 30.5, 26, 25, 23, 22, 21, 21, 22.5, 21.5, 20.5, 20.5, 19.5, 20, 20, 20.5, 21, 22.5, 23, 29, 30, 32.5, 40.5, 42.5, 38.5, 36],
                [23.5, 22, 20.5, 18.5, 31, 32.5, 34, 29.5, 26.5, 24.5, 22.5, 21.5, 20.5, 19.5, 19, 19, 18.5, 19, 19, 19.5, 20.5, 21.5, 22.5, 24.5, 26.5, 29.5, 31, 29, 28, 24, 23, 26, 30, 33, 34.5, 33, 28.5, 17, 17.5, 15.5, 15.5, 15.5, 15.5, 14.5, 14, 13.5, 13, 12, 10, 10, 11, 14.5, 15.5, 14.5, 14, 14, 26.5, 28, 28.5, 30.5, 36.5, 33, 28.5, 25],

            ],[ // drill
                [32, 34.5, 35, 36, 37, 42.5, 46, 49.5, 54, 59.5, 55, 52, 49.5, 48, 46.5, 46, 45.5, 46, 46.5, 48, 49.5, 52, 55, 59, 54, 49.5, 46, 35.5, 34, 32.5, 32, 30.5, 30.5, 30.5, 31, 31.5, 33, 34.5, 35.5, 39, 43, 48, 53, 45, 43, 41.5, 40.5, 38, 12, 12, 12, 12.5, 12.5, 13.5, 14, 14.5, 13, 12, 12.5, 14.5, 16.5, 18, 20.5, 25.5],
                [32, 33.5, 35, 36, 37, 42.5, 46, 44.5, 54, 59.5, 55, 52, 49.5, 48, 46.5, 46, 45.5, 46, 46.5, 48, 49.5, 52, 55, 57.5, 51.5, 40.5, 46, 34.5, 33, 31.5, 31, 30.5, 30.5, 30.5, 30, 30.5, 29.5, 32, 33, 35.5, 36.5, 46.5, 45.5, 49.5, 49.5, 39.5, 37.5, 37, 36, 33, 17.5, 12, 9, 7.5, 8, 9, 9.5, 11, 12.5, 14.5, 16.5, 18, 20.5, 25.5],
                [34, 35.5, 36, 39, 39.5, 40, 45, 44.5, 40, 36.5, 34, 32, 30.5, 29.5, 29, 28.5, 28, 28.5, 29, 29.5, 30.5, 32, 34, 36.5, 40, 44.5, 42.5, 42.5, 34, 33.5, 25.5, 17.5, 20.5, 19.5, 19.5, 18.5, 18.5, 15.5, 15, 18.5, 20.5, 22.5, 23, 24, 25, 26.5, 27, 27.5, 28.5, 26.5, 23, 21, 19.5, 18, 17, 16, 16, 16.5, 17, 18, 18.5, 19, 23, 23.5],
            ],[ // hab small
                [30, 28.5, 30, 30.5, 31.5, 33, 35, 38, 53, 52, 48.5, 45.5, 43.5, 42, 41, 40.5, 40, 40.5, 41, 42, 43.5, 45.5, 48.5, 52, 53, 39, 36.5, 34.5, 33, 31.5, 31, 29.5, 31.5, 32.5, 33, 31.5, 35, 37, 36.5, 37, 38.5, 39, 40, 41, 41.5, 41, 41, 40.5, 40.5, 40.5, 41, 41, 40.5, 40, 39, 38.5, 37, 36.5, 36.5, 36.5, 34, 30.5, 32, 31.5],
                [30, 28.5, 30, 30.5, 31.5, 33, 35, 38, 53, 52, 48.5, 45.5, 43.5, 42, 41, 40.5, 40, 40.5, 41, 42, 43.5, 45.5, 48.5, 52, 53, 42, 31, 37, 36, 31.5, 31, 29.5, 31.5, 31.5, 31, 31.5, 35, 37, 36.5, 37, 37, 36.5, 36.5, 39, 41.5, 41, 41, 40.5, 40.5, 39.5, 36, 32.5, 27.5, 35, 39, 47, 41.5, 36.5, 36.5, 36.5, 34, 30.5, 32, 31.5],
                [29, 29.5, 38, 39, 36.5, 29.5, 25, 22, 19.5, 18, 16.5, 15.5, 15, 14.5, 14, 14, 13.5, 14, 14, 14.5, 15, 15.5, 16.5, 18, 19.5, 22, 25, 29.5, 36.5, 39, 38, 31.5, 32.5, 33.5, 29, 22, 16.5, 16, 14, 12.5, 10.5, 11.5, 13, 14.5, 15, 14.5, 14, 13, 13, 13, 12, 12, 11.5, 11, 9.5, 8.5, 7.5, 7.5, 7.5, 16.5, 35, 31.5, 31, 29.5],
            ], [ // hab medium
                [29, 29.5, 28, 26.5, 24.5, 23, 22, 21, 21.5, 24, 53, 79.5, 79.5, 76.5, 74.5, 73.5, 73, 73.5, 74.5, 76.5, 79.5, 79.5, 54.5, 26, 23, 21, 22, 24, 25, 27.5, 29, 30.5, 30.5, 29.5, 32, 33.5, 34, 34.5, 37.5, 39, 41.5, 51, 60, 62.5, 67.5, 70.5, 73.5, 73.5, 73.5, 73.5, 72.5, 70.5, 66.5, 61.5, 58, 49.5, 41.5, 38, 36.5, 33, 33, 32.5, 31, 28.5],
                [29.5, 31, 31.5, 30, 28, 26, 24, 22.5, 22.5, 25, 52, 78, 79.5, 76.5, 74.5, 73.5, 73, 73.5, 74.5, 76.5, 79.5, 80.5, 55.5, 25, 22.5, 21, 20.5, 22, 24.5, 25.5, 27.5, 28, 29, 29, 28.5, 31, 32, 31.5, 33.5, 35, 38, 40.5, 48.5, 58, 62, 64, 69.5, 72.5, 73.5, 72.5, 73.5, 72.5, 70.5, 65.5, 61.5, 59.5, 50.5, 43.5, 39.5, 38.5, 34.5, 34, 32.5, 33],
                [15.5, 16, 16, 16.5, 17, 18, 19, 20, 41, 45.5, 66.5, 65.5, 62.5, 60.5, 59, 58, 57.5, 58, 59, 60.5, 62.5, 65.5, 68, 48.5, 43.5, 33.5, 20, 14.5, 16, 16.5, 16, 16, 16, 16, 17, 25, 30, 32.5, 34, 38.5, 41, 44, 57.5, 56.5, 52, 54, 55, 52, 54, 50, 44.5, 52, 49.5, 61, 68, 52, 48, 41, 38, 36, 33.5, 32, 28.5, 21],
                [29, 29.5, 30, 39, 40.5, 38, 32, 28, 25, 23, 21.5, 20, 19, 18.5, 18, 18, 17.5, 18, 18, 18.5, 19, 20, 21.5, 23, 25, 28, 32, 38, 40.5, 39, 31, 31.5, 35.5, 30.5, 21.5, 20.5, 15.5, 15, 16, 9.5, 10.5, 11.5, 11.5, 11.5, 12.5, 13.5, 14, 12, 11, 11, 11, 11, 10.5, 10, 9.5, 8.5, 7.5, 15.5, 16, 37.5, 39.5, 32.5, 31, 29.5],
            ],[ // hab tiny
                [31, 31.5, 30.5, 29.5, 31.5, 42.5, 45, 40.5, 36.5, 33.5, 31, 29, 28, 27, 26.5, 26, 25.5, 26, 26.5, 27, 28, 29, 31, 33.5, 36.5, 40.5, 45, 42.5, 33, 31.5, 31, 32.5, 32.5, 31.5, 34, 33.5, 33.5, 32, 31.5, 31.5, 31, 29.5, 28.5, 28, 28, 27, 26.5, 26, 26, 26, 26.5, 27, 28, 28, 28.5, 29.5, 30, 30, 30.5, 31.5, 33, 32.5, 33, 29.5],
                [31, 28.5, 31, 31, 30.5, 42.5, 45, 42.5, 38, 34.5, 32, 30.5, 29, 28, 27.5, 27, 26.5, 27, 27.5, 28, 29, 30.5, 32, 34.5, 38, 42.5, 45, 42.5, 35, 36, 28, 33.5, 33.5, 32.5, 34, 33.5, 33, 31, 31.5, 29.5, 29.5, 29, 27.5, 27, 27, 26, 25, 25, 25, 25, 24, 24, 22.5, 23.5, 24, 24.5, 25, 40.5, 36.5, 33, 31.5, 32.5, 33, 31.5],
                [29, 29.5, 38, 39, 36.5, 29.5, 25, 22, 19.5, 18, 16.5, 15.5, 15, 14.5, 14, 14, 13.5, 14, 14, 14.5, 15, 15.5, 16.5, 18, 19.5, 22, 25, 29.5, 36.5, 39, 38, 31.5, 32.5, 33.5, 29, 22, 16.5, 16, 14, 12.5, 10.5, 11.5, 13, 14.5, 15, 14.5, 14, 13, 13, 13, 12, 12, 11.5, 11, 9.5, 8.5, 7.5, 7.5, 7.5, 16.5, 35, 31.5, 31, 29.5],
            ], [ // hab huge
                [60.5, 59, 60, 61.5, 63.5, 73.5, 76, 66.5, 60, 54.5, 51, 48, 46, 44, 43, 42.5, 42, 42.5, 43, 44, 46, 48, 51, 54.5, 60, 66.5, 76, 73.5, 63.5, 61.5, 60, 59, 61, 60, 63, 60, 58.5, 57.5, 55, 53, 51.5, 49.5, 47.5, 45.5, 44.5, 44, 43, 42.5, 42.5, 42.5, 43, 44, 44.5, 45.5, 47.5, 48.5, 51.5, 52.5, 54.5, 56.5, 58.5, 60, 63, 60],
                [60.5, 59, 60, 64.5, 66, 72.5, 77, 67.5, 60.5, 55.5, 51.5, 48.5, 46.5, 44.5, 43.5, 43, 42.5, 43, 43.5, 44.5, 46.5, 48.5, 51.5, 55.5, 60.5, 67.5, 77, 72.5, 63.5, 61.5, 60, 59, 61, 60, 63, 59.5, 58, 57, 55, 56.5, 48, 52, 46.5, 45, 44, 43.5, 42.5, 42, 42, 42, 42.5, 43.5, 44, 45, 46.5, 48.5, 50.5, 52, 54, 56.5, 58, 59.5, 63, 60],
                [54, 60.5, 60.5, 67, 58.5, 47.5, 40, 35, 31.5, 29, 27, 25.5, 24, 23.5, 22.5, 22.5, 22, 22.5, 22.5, 23.5, 24, 25.5, 27, 29, 31.5, 35, 40, 47.5, 58.5, 68, 64.5, 61.5, 64.5, 59.5, 18.5, 12, 12, 11.5, 11.5, 11.5, 12, 10.5, 16, 16, 15.5, 17, 19.5, 18.5, 19.5, 22.5, 18.5, 18.5, 18.5, 18, 11, 10, 9, 9.5, 9, 18, 20, 21, 48, 48.5],
            ], [ // ship shield and weapon power addaptors
            ], [ // hab power plant, glow large , small, power sparks * 9
                [33.5, 34, 30.5, 31, 36.5, 38.5, 39.5, 40.5, 42, 52, 66, 76, 77.5, 75, 73, 72, 71.5, 72, 73, 75, 77.5, 76, 66, 52, 42, 40.5, 39.5, 38.5, 36.5, 31, 30.5, 34, 34, 34, 30.5, 31, 36.5, 38.5, 39.5, 38.5, 48, 52, 54, 56.5, 58, 60.5, 66.5, 71, 72, 71, 66.5, 60.5, 58, 56.5, 54, 52, 48, 38.5, 39.5, 38.5, 36.5, 31, 30.5, 34],
            ],






        ],
	}
};

cleanupSprites(data.spriteSheet);
cleanupSprites(data.overlaySpriteSheet);


data.fx.bulletMuzzelFlash.ion = data.spriteSheet.nameToIdx(data.fx.bulletMuzzelFlash.ion);
data.fx.bulletMuzzelFlash.plasma = data.spriteSheet.nameToIdx(data.fx.bulletMuzzelFlash.plasma);
data.fx.bulletMuzzelFlash.lazer = data.spriteSheet.nameToIdx(data.fx.bulletMuzzelFlash.lazer);

for (const hab of data.habitats.types) {
    let idx = 0;
    if (hab.requiers) {
        for(const req of hab.requiers) {
            if (Array.isArray(req)) {
                let idx = 0;
                for(const opt of req) { req[idx++] = data.habitats.namedTypes[opt] }
            } else { hab.requiers[idx] = data.habitats.namedTypes[req] }
            idx++
        }
    }
}

function nameToIdx(name) {
	if (typeof name === "string") {
		if (name.includes(".")) {
			const path = name.split(".").reverse();
			let names = this.names[path.pop()];
			while (path.length && names !== undefined) { names = names[path.pop()] }
			return names;
		}
		return this.names[name];
	}
	return name;
}
function namesToIdx(data, property, spriteSheet) {
	if (data !== undefined) {
		if(Array.isArray(data)) {
			if (property === undefined) {
				let idx = 0;
				for(const name of data) { data[idx ++] = spriteSheet.nameToIdx(name) }
			} else {
				for(const item of data) { item[property] = spriteSheet.nameToIdx(item[property]) }
			}
		} else {
			for(const item of Object.values(data)) { item[property] = spriteSheet.nameToIdx(item[property]) }
		}
	}
}
function cleanupSprites(sheet) {
	const sprites = sheet.sprites;
    var idx = 0;
	sprites.sort((a,b) => a.y === b.y ? a.x - b.x :  a.y - b.y );
	if(sheet.spriteGroups) {
        let gIdx = 0
		for (const group of sheet.spriteGroups) {
            if(sheet.spriteEdgeGrouped[gIdx] && sheet.spriteEdgeGrouped[gIdx].length > 0) {
                const edges = sheet.spriteEdgeGrouped[gIdx];
                var eIdx = 0;
                for (const spr of group) {
                    if (edges[eIdx]) {
                        sheet.spriteEdges.push(edges[eIdx]);
                        spr.e = sheet.spriteEdges.length - 1;
                        eIdx ++;
                    }
                    sprites.push(spr);
                }
            } else {
                sprites.push(...(group.sort((a,b) => a.y === b.y ? a.x - b.x :  a.y - b.y )));
            }
            gIdx ++;
		}
	}
	for (const name of Object.keys(sheet.names)) {
		const val = sheet.names[name];
		if(!Array.isArray(val) && typeof val === "object" && (val.compound || val.compoundSized)) {
			const spr = sprites[val.idx], idxs = [val.idx];
			if (val.compound) {
				const xStep = (val.w === 1 ? spr.w : spr.w - 1) / val.w;
				const yStep = (val.h === 1 ? spr.h : spr.h - 1) / val.h;
				const w = val.w === 1 ? xStep : xStep + 1;
				const h = val.h === 1 ? yStep : yStep + 1;
				let x = spr.x + xStep, y = spr.y, rx = spr.x + spr.w - 1, ry = spr.y + spr.h - 1;
				while (y < ry) {
					while (x < rx) {
						idxs.push(sprites.length);
						sprites.push({x, y, w, h});
						x += xStep;
					}
					x = spr.x;
					y += yStep;
				}
				spr.w = w;
				spr.h = h;
			} else if (val.compoundSized && val.h === 1) {
				let first = true;
				const h = spr.h;
				let x = spr.x, y = spr.y;
				spr.w = val.sizes[0];
				for (const size of val.sizes) {
					if (!first) {
						idxs.push(sprites.length);
						sprites.push({x, y, w: size + 1, h});
					} else { first = false }
					x += size;
				}
			}
			sheet.names[name] = idxs;
		}
	}
    idx = 0;
	for (const spr of sheet.sprites) {

		spr.d = Math.min(spr.w, spr.h);  // d for depth
		spr.diag = (spr.w * spr.w + spr.h * spr.h) ** 0.5;
		spr.size = Math.max(spr.w, spr.h);
        spr.idx = idx ++;
		if(spr.cx === undefined) { spr.cx = 0.5 }
		else { spr.cx /= spr.w }
		if(spr.cy === undefined) { spr.cy = 0.5 }
		else { spr.cy /= spr.h }
	}
}
export {data};