import "../../src/utils/MathExtensions.js";
import {arrayUtils} from "../../src/utils/arrayUtils.js";
import {Vec2} from "../../src/Vec2.js";
import {data} from "./data.js";
import {colors} from "../../src/utils/colors.js";
import {buffers} from "./buffers.js";
import {Aoids} from "./Aoids.js";
export {Bases, Base};
const SUN_MASS = data.background.sunMass;
const GRAV_CONST = data.background.gravConstant;
const OVERLAY_WHITE_SPR_IDX = data.overlaySpriteSheet.names.whiteSquare;
const OVERLAY_WHITE_SPR_SIZE = 14;
var rocks, sortSlotSprIdx;
const habSortFunc = (a, b) => a.attached.angle - b.attached.angle;
const slotsSortFunc = (a, b) => rocks.collisionMap.edgeDist(sortSlotSprIdx, b) - rocks.collisionMap.edgeDist(sortSlotSprIdx, a);
function Base(bases, baseName, teamName, rock) {
    const desc = data.bases[baseName];
    this.bases = bases;
    this.name = baseName;
    Aoids.teams.name = teamName;
    this.personal = 0;
    this.personalDeaths = 0;
    this.personalNeedSleep = 0;
    this.maxPersonal = 0;
    this.radarTrackCount = 0;
    this.radarTracks = 0;
    this.radarRange = desc.radarRange;
    this.power = 0;
    this.maxPower = 0;
    this.powerSupply = 0;
    this.currentDemand = 0;
    this.desc = desc;
    if (!rock && desc.distance) {
        this.homeRock = rocks.newFixedItem().asOrbitBody(
            data.spriteSheet.names[desc.rockSpriteName],
            desc.rockScale,
            desc.mass,
            (rock) => {
                const nx = rock.x - 0, ny = rock.y - 0;
                const dist = (nx * nx + ny * ny) ** 0.5;
                const vel = ((GRAV_CONST * rocks.homeRock.mass) / dist) ** 0.5;
                rock.dx = -ny / dist * vel;
                rock.dy = nx / dist * vel;
                rock.x += rock.dx;
                rock.y += rock.dy;
            }).asMemberOfCurrentTeam();
        this.homeRock.x = desc.distance;
        this.homeRock.y = 0;
        this.homeRock.moveFunc(this.homeRock);
    } else {
        this.homeRock = rock ? rock :
            rocks.newFixedItem().asOrbitBody(
                data.spriteSheet.names[desc.rockSpriteName],
                desc.rockScale,
                desc.mass
            ).asMemberOfCurrentTeam();
        if (desc.isHome) { rocks.homeRock = this.homeRock }
    }
    this.homeRock.dr = desc.rotate;
    this.dayLength = desc.dayTime;//Math.TAU / desc.rotate;
    this.all = [];
    this.habitats = new Map();
    this.cantBuild = new Set();
    this.buildables  = new Set(desc.canBuild);
    this.metals = Object.values(data.rocks.metalTypes).map((type, i) => {
        return {
            ...type,
            count: 0 + data.bases.startupMetalCheat,
            oldCount: 0,
            maxCount: type.baseMax + data.bases.startupMetalCheat,//type.baseMax,
            flash: 0,
        };
    });
    Object.values(data.habitats.namedTypes).forEach(typeIdx => !this.habitats.has(typeIdx) && (this.habitats.set(typeIdx, [])));
    const useHabitLayout = desc.habitsLayout !== undefined;
    this.slots = desc.slots ? [...desc.slots] : arrayUtils.setOf(desc.habitatCount, i => ((i + 1) / (desc.habitatCount + 2)) * Math.TAU);
    this.updateBuildables();
    const add = [...desc.mustHave ? desc.mustHave : []];
    sortSlotSprIdx = this.homeRock.sprIdx;

    if (desc.buildFromPad) {
        let padBuildOffset = 0, padBuildDist = Math.TAU / this.slots.length;
        this.pickFunc = (arr) => {
            const pads = this.habitats.get(data.habitats.namedTypes.dockingPad);
            if (pads.length) {
                arr.pop();
                const ang = pads[0].attached.angle + padBuildOffset + padBuildDist;
                padBuildOffset = -padBuildOffset + padBuildDist / 2;
                padBuildDist = - padBuildDist;
                return (ang % Math.TAU + Math.TAU) % Math.TAU;
            }
        }
    } else {
        desc.buildFromLow && (this.slots.sort(slotsSortFunc));
        this.pickFunc = desc.buildFromLow ? (arr => arr.pop()) : Math.randSPick
    }
    while (this.slots.length && add.length) {
        const typeIdx = Math.randSPick(add);
        if (this.buildables.has(typeIdx)) {
            this.addHabitat(typeIdx, this.pickFunc(this.slots))
        }
    }
    this.radars = this.habitats.get(data.habitats.namedTypes.radio);
}
Base.prototype = {
    delete() {
        this.homeRock = undefined;
        this.habitats.length = 0;
        this.habitats = undefined;
    },
    update() {
        this.radarTracks = this.radarTrackCount;

        this.power = this.maxPower = this.powerSupply;
        this.radarTrackCount = 0;
        this.powerSupply = 0;
        if (this.maxPower === 0) {
            this.powerRation = 0;
        } else {
            if (this.currentDemand > this.maxPower) {
                this.powerRation = this.maxPower / this.currentDemand;
            } else if (this.powerRation < 0.95) {
                this.powerRation += (1 - this.powerRation) * 0.25;
            } else {
                this.powerRation = 1;
            }
        }
        this.currentDemand = 0;

    },
    init() {
        this.homeRock.initFixed();
        for(const rock of this.all) { rock.initFixed() }
        this.schedualSafetyCheck();
    },
    personalExchange(number, habitOrStatus) {  // neg number to get personal, plus to return personal
        if (number < 0) {
            if (this.personal >= -number) {
                this.personal += number;
                habitOrStatus.personalWorkLength = this.dayLength / 3 + Math.random() * 30 | 0;
                //Aoids.logger.log((-number) + " work at: "+ habitOrStatus.desc.name + " AFW: " + this.personal );
                return -number;

            }
            if (this.personal > 0) {
                number = this.personal;
                habitOrStatus.personalWorkLength = this.dayLength / 3 + Math.random() * 30  | 0;
                this.personal = 0;
               // Aoids.logger.log(number + " work at:"+ habitOrStatus.desc.name + " AFW: " + this.personal );
                return number;
            }
            //Aoids.logger.log("Need "+ (-number) + " workers at:"+ habitOrStatus.desc.name)
            return 0;
        }
        if (habitOrStatus) {
            this.personal += number;
           // Aoids.logger.log(number + " reported for work. AFW: " + this.personal );
        } else {
            this.personalNeedSleep += number;
            //Aoids.logger.log(number + " need sleep. AFW: " + this.personal );
        }
        return 0;

    },
    stooddownWorkers( number, who){
        this.personal += number;
        Aoids.logger.log(number + " stood down by "+who.desc.name +". AFW: " + this.personal );
        return 0;
    },
    get radarTrack() {
        if (this.radars.length) {
            const station = this.radars[Math.random() * this.radars.length | 0];
            return station.attached.behaviour.track;
        }
    },
    powerRequest(amount, who) {
        this.currentDemand += amount;
        if (this.powerRation === 0) { return 0 }
        amount *= this.powerRation;
        if (amount <= this.power) {
            this.power -= amount;
            return amount;
        }
        if (this.power > 0) {
            amount = this.power;
            this.power = 0;
            return amount;
        }
        return 0;
    },
    metalExchange(transact, sign = 1) {
        const m = this.metals[transact.metalType];
        const a = transact.amount * sign;
        if (a < 0) {
            if (m.count > -a) {
                m.count += a;
                return -a;
            }
            return 0;
        } else {
            const count = m.count + a;
            m.count = count > m.maxCount ? m.maxCount : count;
        }
    },
    safetyTimeoutHandle: undefined,
    schedualSafetyCheck() {
        clearTimeout(this.safetyTimeoutHandle);
        this.safetyTimeoutHandle = setTimeout(this.checkSafety, 1000, this);
    },
    checkSafety(base) {
        base.all.sort(habSortFunc);
        for(const rock of base.all) {

            if (rock.attached && rock.attached.behaviour) {
                if (rock.attached.behaviour.checkSafeFire) {
                    rock.attached.behaviour.checkSafeFire(base.all);
                }
            }
        }
        Aoids.flasher("Base \""+base.name+"\" work safe reports all pillows fluffy", 4000);
        return this;
    },
    remove(rock) {
        if (rock.attached) {
            const habsOfType = this.habitats.get(rock.attached.type);
            const idx = habsOfType.indexOf(rock);
            const aIdx = this.all.indexOf(rock);
            if (idx > -1 && aIdx > -1) {
                habsOfType.splice(idx, 1);
                this.all.splice(aIdx,1);
            } else {
                if (idx === -1) { Aoids.logger.error("MISSING Hab type " + rock.attached.type) }
                if (aIdx === -1) { Aoids.logger.error("MISSING Hab from all") }
            }

        }
    },
    isLevelBase(typeIdx, scale, angle) {
        const desc = data.habitats.types[typeIdx];
        const level = rocks.collisionMap.edgeDist(this.homeRock.sprIdx, angle) * this.homeRock.scale;
        const bs = (desc.baseWidth * scale);
        const w =  bs / level
        const lLeft = rocks.collisionMap.edgeDist(this.homeRock.sprIdx, angle - w) * this.homeRock.scale;
        const lRight = rocks.collisionMap.edgeDist(this.homeRock.sprIdx, angle + w) * this.homeRock.scale;
        if (lLeft < level && lRight < level) {
            return false
        }
        const l = lLeft < level ?
            (level ** 2 - lLeft ** 2) ** 0.5 - Math.sin(w) * level :
            (lLeft ** 2 - level ** 2) ** 0.5 - Math.sin(w) * lLeft;
        const r = lRight < level ?
            (level ** 2 - lRight ** 2) ** 0.5 - Math.sin(w) * level :
            (lRight ** 2 - level ** 2) ** 0.5 - Math.sin(w) * lRight;
        const t = bs * 1.4;
        return Math.abs(l - r) < t;
    },
    //habitatOfType(typeIdx, idx = Math.randI(0, this.habitats[typeIdx].length)) { return this.habitats[typeIdx][idx % this.habitats[typeIdx].length] },
    buyHab(typeIdx, metals, angLoc) {
        if (this.buildables.has(typeIdx)) {
            if (this.bases.canCreate(data.habitats.types[typeIdx], this) === true) {
                let ang = angLoc !== undefined ? angLoc : this.getFreeSlotFor(typeIdx);
                if (ang !== undefined) {
                    this.bases.buy(data.habitats.types[typeIdx], metals);
                    this.addHabitat(typeIdx, ang);
                }
            }
        }
    },
    getFreeSlotFor(typeIdx) {
        const crowdedSlots = [];
        var ang = this.pickFunc(this.slots);
        while(!this.isSlotClear(ang, typeIdx)) {
            crowdedSlots.push(ang);
            if (this.slots.length) {
                ang = this.pickFunc(this.slots);
            } else {
                Aoids.flasher("There is no room to build");
                this.slots.push(...crowdedSlots);
                return;
            }
        }
        return ang;
    },
    isSlotClear(angle, typeIdx) {
        angle = Math.normalizeRadian(angle) + Math.TAU;
        const types = data.habitats.types;
        const desc = types[typeIdx];
        const scale = desc.scale !== undefined ? desc.scale : this.desc.scale === undefined ? data.habitats.scale : this.desc.scale;
        var idx  =  0;
        const sprIdx = data.spriteSheet.names[types[typeIdx].breakable][0];
        const angWidth = ((desc.baseWidth ? desc.baseWidth : data.spriteSheet.sprites[sprIdx].w) * scale * 0.5) / this.homeRock.radius;
        const right = angle + angWidth, left = angle - angWidth;
        while(idx < types.length) {
            const habs = this.habitats.get(idx);
            if (habs.length) {
                const desc = types[typeIdx];
                const scale = desc.scale !== undefined ? desc.scale : this.desc.scale === undefined ? data.habitats.scale : this.desc.scale;
                const sprIdx = data.spriteSheet.names[types[idx].breakable][0];
                const angWidthB = ((desc.baseWidth ? desc.baseWidth : data.spriteSheet.sprites[sprIdx].w) * scale* 0.5) / this.homeRock.radius;
                for (const h of habs) {
                    const a = Math.normalizeRadian(h.attached.angle) + Math.TAU;
                     if ( !(left > a + angWidthB || right < a - angWidthB)) {
                         return false;
                     }
                }
            }
            idx++;
        }
        return true;
    },
    updateBuildables() {
        for (const typeIdx of this.buildables.values()) {
            if(this.bases.canCreate(data.habitats.types[typeIdx], this) !== true) {
                this.cantBuild.add(typeIdx);
            } else {
                this.cantBuild.delete(typeIdx);
            }
        }
    },
    addHabitat(typeIdx, angle) {
        const desc = data.habitats.types[typeIdx];
        this.maxPersonal += desc.beds ? desc.beds : 0;
        this.maxPower += desc.generatesPower ? desc.generatesPower : 0;
        const scale = desc.scale !== undefined ? desc.scale : this.desc.scale === undefined ? data.habitats.scale : this.desc.scale;
        const level = rocks.collisionMap.edgeDist(this.homeRock.sprIdx, angle);
        const w = Math.PI / desc.baseWidth
        const lLeft = rocks.collisionMap.edgeDist(this.homeRock.sprIdx, angle - w);
        const lRight = rocks.collisionMap.edgeDist(this.homeRock.sprIdx, angle + w);
        const habitat = rocks.newFixedItem();
        habitat.asAttached(this.homeRock, angle, scale, typeIdx, rocks);
        habitat.attached.behaviour ? habitat.attached.behaviour.base = this : habitat.attached.base = this ;
        this.habitats.get(typeIdx).push(habitat);
        this.all.push(habitat)
        this.bases.habAdded(desc, this);
        this.updateBuildables();
        this.schedualSafetyCheck();
        Aoids.flasher("Built base " + desc.name);
    },
};
function Bases() {
    const STATUS = data.habitats.dockingTypes;
    var metals;
    const bases = [];
    var namedBases = {};
    var baseShip;
    var currentBase = undefined;
    var currentDocked = undefined;
    var timerHandle;
    function baseMenu() {
        // Yellow for requiered
        const BUILD_HAB_GREEN_TO_YELLOW = colors.Gradient
            .addStopRGBA(0,    colors.createRGBA(0,255,0,1))
            .addStopRGBA(1,    colors.createRGBA(255,255,0,1))
            .asUInt32Array(32);
        const BUILD_HAB_GREEN_TO_WHITE = colors.Gradient
            .addStopRGBA(0,    colors.createRGBA(0,255,0,1))
            .addStopRGBA(1,    colors.createRGBA(255,255,255,1))
            .asUInt32Array(32);
        const HAB_HEALTH = colors.Gradient
            .addStopRGBA(0,    colors.createRGBA(0,255,0,1))
            .addStopRGBA(0.5,    colors.createRGBA(255,180,0,1))
            .addStopRGBA(1,    colors.createRGBA(255,0,0,1))
            .asUInt32Array(32);

        const HAB_POWER = colors.Gradient
            .addStopRGBA(0,    colors.createRGBA(255,0,180,1))
            .addStopRGBA(0.5,    colors.createRGBA(0,160,255,1))
            .addStopRGBA(1,    colors.createRGBA(0,255,255,1))
            .asUInt32Array(32);
        const rend = Aoids.renderer;
        const mouse = Aoids.mouse;
        const buf = buffers.overlay;
        const stride = buf.stride;
        const stride4 = buf.stride * 4;
        const bF = buf.data;
        const bI = buf.UI32;
        const bI8 = buf.UI8;
        const SPRITES = data.overlaySpriteSheet.sprites;
        const menuSlots = arrayUtils.setOf(240, () => ({
            hover: 0,
            hoverR: 0,
            hoverC: 0,
            hoverB: 0,
            hoverBR: 0,
            hoverBC: 0,
            hoverD: 0,
            hoverDR: 0,
            hoverDC: 0,
            requiered: false,
            disable: false,
            remove: false,
            mouseOver: false,
            update(mouseOver = false) {
                this.hoverR += (this.hoverC = (this.hoverC += (this.hover - this.hoverR) * 0.4) * 0.2);
                this.hoverDR += (this.hoverDC = (this.hoverDC += (this.hoverD - this.hoverDR) * 0.05) * 0.9);
                this.hoverR = this.hoverR > 1 ? 1 : this.hoverR < 0 ? 0 : this.hoverR;
                this.hoverDR = this.hoverDR > 1 ? 1 : this.hoverDR < 0 ? 0 : this.hoverDR;
                this.mouseOver = mouseOver;
                if (this.remove) {
                    this.hover = -1;
                } else {
                    !mouseOver && (this.hover = 0);
                }
            },
            reset() {
                this.hover= 0;
                this.hoverR= 0;
                this.hoverC= 0;
                this.hoverB= 0;
                this.hoverBR= 0;
                this.hoverBC= 0;
                this.remove = false;
                this.requiered = false;
                this.disable = false;
                this.mouseOver = false;
            },
        }));
        function clearMenuSlots() { for (const slot of menuSlots) {  slot.reset() } }
        const underMouse = {
            spr: undefined,
            x: 0, y: 0, col: 0,
            slot: 0,
            menuIdx: 0,
        };
        var currentSlot = 0;
        var cursorPointer = false;
        function setCursor(pointer = false) {
            if (pointer && !cursorPointer) {
                rend.canvas.classList.add("cursorPointer");
                cursorPointer = true;
            } else if (!pointer && cursorPointer) {
                rend.canvas.classList.remove("cursorPointer");
                cursorPointer = false;
            }
        };
        const BASE_COST_SPR = SPRITES[data.overlaySpriteSheet.names.costIcon]
        const BASE_STATUS_SPR = SPRITES[data.overlaySpriteSheet.names.baseStatusIcon]
        const FONT_SMALL_NUM = data.overlaySpriteSheet.names.fontDigitsSmall;
        const BASE_STATUS_SCALE = 1;
        const habSprs = [];
        Object.keys(data.habitats.namedTypes).forEach(name => {
            habSprs[data.habitats.namedTypes[name]] = SPRITES[data.overlaySpriteSheet.names[name] + data.overlaySpriteSheet.names.buildingsStartEnd[0]];
        });
        var menuPos = 0;
        var menuPosR = 0;
        var menuPosC = 0;
        var menuBase;
        var metals;


        const shipUpgrades = new Map();
        var currentShipUpgradeOpts;
        var baseViewScrollPos = 0;
        var gData;
        const personal = {
            count : 0,
            maxCount: 0,
            colMask: 0xFFFF00FF,
        }
        const SPR_W = habSprs[0].w;
        const SPR_H = habSprs[0].h;
        const menuOptionsSprIdxs = [
            data.overlaySpriteSheet.names.repairBaseIcon,
            data.overlaySpriteSheet.names.buildBaseIcon,
            data.overlaySpriteSheet.names.upgradShipIcon,
        ];
        const menuOptionsNextMenu = ["drawBase","drawBuild","shipOptions"];

        function drawHealthIcon(x, y, habTypeIdx, health) {
            const slot = menuSlots[currentSlot];
            if (slot.hover === 1) {
                slot.hoverB = 1;
            } else {
                slot.hoverB = 0;
            }
            slot.hoverBR += (slot.hoverBC = (slot.hoverBC += (slot.hoverB - slot.hoverBR) * 0.1) * 0.3);
            y -=  170 * slot.hoverBR;
            y |= 0;
            y -= 0.5 / rend.height;
            const draw = slot.hoverBR > 0.5;
            var i = buf.length * stride;

            if (!draw) {

            } else {
                bF[i    ] = x;
                bF[i + 1] = y;
                bF[i + 2] = 1;
                bF[i + 3] = 1;
                bF[i + 4] = 0;
                bF[i + 5] = 0
                bF[i + 6] = 0;
                bI[i + 8] = 0xFFFFFFFF;
                bI[i + 9] = BASE_COST_SPR.idx;
                buf.length ++;
                i += stride;
                const costs = data.habitats.types[habTypeIdx].costs
                var idx = 0, yy = y + 4 * BASE_STATUS_SCALE, xx;
                for (const metal of metals) {
                    const col = costs[idx] * health > metal.count ? (0xFF0000FF) : 0xFFFFFFFF;
                    let m = costs[idx] * health | 0;
                    xx = x + 58 * BASE_STATUS_SCALE;
                    do {
                        const spr = SPRITES[FONT_SMALL_NUM + m % 10];
                        bF[i    ] = xx;
                        bF[i + 1] = yy;
                        bF[i + 2] = BASE_STATUS_SCALE;
                        bF[i + 3] = BASE_STATUS_SCALE;
                        bF[i + 4] = 1;
                        bF[i + 5] = 0;
                        bF[i + 6] = 0;
                        bI[i + 8] = col;
                        bI[i + 9] = spr.idx;
                        buf.length ++;
                        i += stride;
                        xx -= spr.w * BASE_STATUS_SCALE;
                        m = m / 10 | 0;
                    } while (m > 0);
                    yy += 12 * BASE_STATUS_SCALE;
                    idx++;
                }
            }
        }
        function drawCostIcon(x, y, habTypeIdx, upgrade) {
            const slot = menuSlots[currentSlot];
            if (slot.hover === 1) {
                slot.hoverB = 1;
            } else {
                slot.hoverB = 0;
            }
            slot.hoverBR += (slot.hoverBC = (slot.hoverBC += (slot.hoverB - slot.hoverBR) * 0.1) * 0.3);
            y -=  155 * slot.hoverBR;
            y |= 0;
            y -= 0.5 / rend.height;
            const draw = slot.hoverBR > 0.5;
            var i = buf.length * stride;
            var canUse = upgrade || !(menuBase && menuBase.cantBuild.size && menuBase.cantBuild.has(habTypeIdx));
            if (!draw) {
                const costs = upgrade ? upgrade.costs : data.habitats.types[habTypeIdx].costs;
                var idx = 0, yy = y + 4 * BASE_STATUS_SCALE, xx;
                for (const metal of metals) {
                    if (costs[idx++] > metal.count) {
                        slot.disable = true;
                        return;
                    }
                }
            } else {
                bF[i    ] = x;
                bF[i + 1] = y;
                bF[i + 2] = 1;
                bF[i + 3] = 1;
                bF[i + 4] = 0;
                bF[i + 5] = 0
                bF[i + 6] = 0;
                bI[i + 8] = 0xFFFFFFFF;
                bI[i + 9] = BASE_COST_SPR.idx;
                buf.length ++;
                i += stride;
                const costs = upgrade ? upgrade.costs : data.habitats.types[habTypeIdx].costs
                var idx = 0, yy = y + 4 * BASE_STATUS_SCALE, xx;
                for (const metal of metals) {
                    const col = costs[idx] > metal.count ? (canUse = false, 0xFF0000FF) : 0xFFFFFFFF;
                    let m = costs[idx] | 0;
                    xx = x + 58 * BASE_STATUS_SCALE;
                    do {
                        const spr = SPRITES[FONT_SMALL_NUM + m % 10];
                        bF[i    ] = xx;
                        bF[i + 1] = yy;
                        bF[i + 2] = BASE_STATUS_SCALE;
                        bF[i + 3] = BASE_STATUS_SCALE;
                        bF[i + 4] = 1;
                        bF[i + 5] = 0;
                        bF[i + 6] = 0;
                        bI[i + 8] = col;
                        bI[i + 9] = spr.idx;
                        buf.length ++;
                        i += stride;
                        xx -= spr.w * BASE_STATUS_SCALE;
                        m = m / 10 | 0;
                    } while (m > 0);
                    yy += 12 * BASE_STATUS_SCALE;
                    idx++;
                }
            }
            canUse && (slot.disable = false);
            slot.disable = !canUse;
        }
        function drawBaseStatus(x, y) {
            x |= 0;
            y |= 0;
            var i = buf.length * stride;
            bF[i    ] = x;
            bF[i + 1] = y;
            bF[i + 2] = BASE_STATUS_SCALE;
            bF[i + 3] = BASE_STATUS_SCALE;
            bF[i + 4] = 0;
            bF[i + 5] = 0
            bF[i + 6] = 0;
            bI[i + 8] = 0xFFFFFFFF;
            bI[i + 9] = BASE_STATUS_SPR.idx;
            buf.length ++;
            i += stride;
            var idx = 0, yy = y + 4 * BASE_STATUS_SCALE, xx, metal;
            while (idx < 8) {
                if(idx === 6) {
                    metal = personal;
                    metal.count = menuBase.personal;
                    metal.maxCount = menuBase.maxPersonal;
                } else if(idx === 7) {
                    metal = personal;
                    metal.count = menuBase.personalNeedSleep;
                    metal.maxCount = menuBase.maxPersonal;
                } else if(idx === 5) {
                    metal = personal;
                    metal.count = menuBase.powerRation * 100;
                    metal.maxCount = 100;
                } else {
                    metal = metals[idx]
                }
           // for (const metal of metals) {
                bF[i    ] = x + 15 * BASE_STATUS_SCALE;
                bF[i + 1] = yy;
                bF[i + 2] = ((metal.count / metal.maxCount) * BASE_STATUS_SCALE * 75 | 0) / OVERLAY_WHITE_SPR_SIZE;
                bF[i + 3] = BASE_STATUS_SCALE * 8 / OVERLAY_WHITE_SPR_SIZE;
                bF[i + 4] = 0;
                bF[i + 5] = 0;
                bF[i + 6] = 0;
                bI[i + 8] = metal.colMask;
                bI[i + 9] = OVERLAY_WHITE_SPR_IDX;
                buf.length ++;
                i += stride;
                let m = metal.count | 0;
                xx = x + 127 * BASE_STATUS_SCALE;
                do {
                    const spr = SPRITES[FONT_SMALL_NUM + m % 10];
                    bF[i    ] = xx;
                    bF[i + 1] = yy;
                    bF[i + 2] = BASE_STATUS_SCALE;
                    bF[i + 3] = BASE_STATUS_SCALE;
                    bF[i + 4] = 1;
                    bF[i + 5] = 0;
                    bF[i + 6] = 0;
                    bI[i + 8] = 0xFFFFFFFF;
                    bI[i + 9] = spr.idx;
                    buf.length ++;
                    i += stride;
                    xx -= spr.w * BASE_STATUS_SCALE;
                    m = m / 10 | 0;
                } while (m > 0);
                yy += 12 * BASE_STATUS_SCALE;
                idx++;
            }
        }
        function drawMenuItem(spr, x, y, col, menuIdx, under = false) {
            var i = buf.length * stride, ii = i * 4 + 3;
            const slot = menuSlots[under ? underMouse.slot : currentSlot++];
            if (slot.remove) {
                slot.update();
                y += (1 - (slot.hoverR + 1) / 2) * SPR_H * 2.5;
                if (slot.hoverR < -0.99) {
                    //slot.remove = false;
                }

            } else if (mouse.y > y && mouse.x >= x && mouse.x < x + spr.w) {
                slot.update(true);

                if (!under) {
                    slot.hover = 1;
                    underMouse.slot = currentSlot - 1;
                    underMouse.spr = spr;
                    underMouse.x = x;
                    underMouse.y = y;
                    underMouse.col = col ? col : 0xFFFFFFFF;
                    underMouse.menuIdx = menuIdx;
                    underMouse.data = gData;
                    underMouse.width = 0;

                    if (!slot.disable && menuPosR > 0.99 && menuIdx > -1 && mouse.button === 1) {
                        mouse.button = 0;
                        return true
                    }
                    if (mouse.button) { mouse.button = 0}
                    return;
                }
            } else {
                slot.update();

            }
            var hd = 5 * slot.hoverDR;
            var w = 18 * slot.hoverR;
            var h = 18 * slot.hoverR;
             bF[i   ] = x - 2 - w / 2 ;
            bF[i + 1] = y - 2 - h - hd;
            bF[i + 2] = (SPR_W + 2 + w) / OVERLAY_WHITE_SPR_SIZE;
            bF[i + 3] = (SPR_H + 2 + h) / OVERLAY_WHITE_SPR_SIZE;
            bF[i + 4] = 0;
            bF[i + 5] = 0;
            bF[i + 6] = 0;
            if (col) {
                bI[i + 8] = col;
            } else {
                bI[i + 8] = slot.requiers ? BUILD_HAB_GREEN_TO_YELLOW[slot.hoverDR * 31.9 | 0] : BUILD_HAB_GREEN_TO_WHITE[slot.hoverR * 31.9 | 0];
            }
            bI[i + 9] =  OVERLAY_WHITE_SPR_IDX;
            buf.length ++;
            i += stride;
            bF[i   ] = x- w / 2;
            bF[i + 1] = y- h - hd;
            bF[i + 2] = (SPR_W + w) / SPR_W;
            bF[i + 3] = (SPR_H + h) / SPR_H;
            bF[i + 4] = 0;
            bF[i + 5] = 0;
            bF[i + 6] = 0;
            bI[i + 8] = slot.disable ? 0x7FFFFFFF : 0xFFFFFFFF;
            bI[i + 9] = spr.idx;
            buf.length ++;
        }
        function drawHealthBar(x, y, col, health, colB, prod, colC, power) {
            var i = buf.length * stride, ii = i * 4 + 3;
            const slot = menuSlots[currentSlot-1];

            var hd = 5 * slot.hoverDR;
            var w = 18 * slot.hoverR;
            var h = 18 * slot.hoverR;
            y -= 10;
             bF[i   ] = x - 2 - w / 2 ;
            bF[i + 1] = y - 2 - h - hd;
            bF[i + 2] = (SPR_W + 2 + w) * (health < 0 ? 0 : health) / OVERLAY_WHITE_SPR_SIZE;
            bF[i + 3] = (8) / OVERLAY_WHITE_SPR_SIZE;
            bF[i + 4] = 0;
            bF[i + 5] = 0;
            bF[i + 6] = 0;
            bI[i + 8] = col;
            bI[i + 9] =  OVERLAY_WHITE_SPR_IDX;
            buf.length ++;
            i += stride;

            if ( colB) {
                y -= 6;
                 bF[i   ] = x - 2 - w / 2 ;
                bF[i + 1] = y - 2 - h - hd;
                bF[i + 2] = (SPR_W + 2 + w) * (prod) / OVERLAY_WHITE_SPR_SIZE;
                bF[i + 3] = (4) / OVERLAY_WHITE_SPR_SIZE;
                bF[i + 4] = 0;
                bF[i + 5] = 0;
                bF[i + 6] = 0;
                bI[i + 8] = colB;
                bI[i + 9] =  OVERLAY_WHITE_SPR_IDX;
                buf.length ++;
                i += stride;
            }
            if ( colC) {
                y -= 6;
                 bF[i   ] = x - 2 - w / 2 ;
                bF[i + 1] = y - 2 - h - hd;
                bF[i + 2] = (SPR_W + 2 + w) * (power) / OVERLAY_WHITE_SPR_SIZE;
                bF[i + 3] = (4) / OVERLAY_WHITE_SPR_SIZE;
                bF[i + 4] = 0;
                bF[i + 5] = 0;
                bF[i + 6] = 0;
                bI[i + 8] = colC;
                bI[i + 9] =  OVERLAY_WHITE_SPR_IDX;
                buf.length ++;
                i += stride;
            }

        }
        const API = {
            start(base) {
                menuPos = 1;
                menuBase = base;
                menuBase.updateBuildables();
                metals = base.metals;
                API.backMenu = "menuOptions";
                API.currentMenu = API.menuOptions;
                API.nextMenuSetup = API.nextSetup;
                API.open = true;
                baseShip.inspect();
            },
            backMenu: "menuOptions",
            currentMenu(){},
            nextMenu(){},
            nextMenuSetup(){},
            nextSetup(){},
            changeMenu: false,
            setupShip() {
               // shipOptions.length = 0;
                /*for(const opt of baseShip.config.upgrades) {
                    if(typeof opt[0] === "string") {
                        opt[0] = data.overlaySpriteSheet.names[opt[0]];
                    }
                    shipOptions.push(opt);
                }*/

            },
            addShipUpgradeOption(opts) {
                const shipOpt = baseShip.config.upgrades[opts.slotName];
                if (!shipOpt) { Aoids.info("Ship upgrade options not found!!!!!!!!!"); return }
                var slot = shipUpgrades.get(opts.slotName);
                if (slot === undefined) {
                    slot = {
                        options: new Map(),
                        level: 0,
                    };
                    shipUpgrades.set(opts.slotName, slot);
                } else if (opts.level !== undefined) {
                    if (opts.level > slot.level) { slot.level ++; }
                } else {
                    slot.level ++;
                }
                if(!shipOpt.levels[slot.level]) { Aoids.info("Upgrade " + opts.slotName + " level maxed"); return }
                const levelOpt = shipOpt.levels[slot.level];
                if(typeof shipOpt.sprite === "string") {
                    slot.sprIdx =  data.overlaySpriteSheet.names[shipOpt.sprite]
                    if(slot.sprIdx === undefined) {
                        Aoids.logger.error("Bad sprite ship upgrades");
                        Aoids.logger.error("Cant find sprite '" + shipOpt.sprite + "'");
                        shipOpt.sprite = slot.sprIdx =  data.overlaySpriteSheet.names.shipUpgradeIcons.default;

                    } else {
                        shipOpt.sprite = slot.sprIdx;
                    }
                } else if (shipOpt.sprite !== undefined) {
                    slot.sprIdx = shipOpt.sprite;
                }

                if (levelOpt.message) { Aoids.info(levelOpt.message) }
                else if (shipOpt.message) { Aoids.info(shipOpt.message) }
                for (const upgrade of levelOpt.upgrades) {
                    let sprIdx = data.overlaySpriteSheet.names.shipUpgradeIcons[upgrade.name];
                    if (sprIdx === undefined) {
                        Aoids.logger.error("Bad sprite ship level upgrades");
                        Aoids.logger.error("Cant find sprite '" + upgrade.name + "'");

                        sprIdx = data.overlaySpriteSheet.names.shipUpgradeIcons.default;
                    }
                    const up = {
                        ...upgrade,
                        sprIdx
                    };
                    slot.options.set(upgrade.name, up);
                }
            },
            close() {
                menuPos = -0.01;
                API.closing = true;
                baseShip.inspect();
            },
            closing: false,
            startNextMenu(name) {
                if(API[name] && !API.changeMenu) {
                    menuPos = -0.01;
                    API.closing = false;
                    API.changeMenu = true;
                    API.nextMenu = API[name];
                    API.nextMenuSetup = API[name + "Setup"] ? API[name + "Setup"] : API.nextSetup;

                }
            },
            startMenuDraw() {
                menuPosR += (menuPosC = (menuPosC += (menuPos - menuPosR) * 0.45) * 0.45);
                if(menuPosR <= 0) {
                    if (API.closing) {
                        API.open = false;
                        setCursor(false);
                        API.closing = false;
                        return false;
                    }
                    if(API.changeMenu) {
                        API.changeMenu = false;
                        API.currentMenu = API.nextMenu;
                        API.backMenu = "";
                        API.nextMenuSetup();
                        baseShip.inspect();
                        clearMenuSlots();
                        menuPos = 1;
                        return false;
                    }
                    return false;
                }
                drawBaseStatus((-BASE_STATUS_SPR.w + (BASE_STATUS_SPR.w + 8) * menuPosR) * BASE_STATUS_SCALE,  rend.height - 175 * BASE_STATUS_SCALE);
                var  y = rend.height - (habSprs[0].h + 4) * menuPosR;
                if (mouse.y > y) {
                    setCursor(true);
                } else {
                    setCursor(false);
                }
                currentSlot = 0;
                underMouse.slot = -1;
                return true;
            },
            menuOptions(x, skip, backOption) {
                const w = habSprs[0].w + 8;
                const notHolding = x !== undefined;
                var  x = x === undefined ? (rend.width / 2 - w * menuOptionsSprIdxs.length / 2) | 0: x;
                var y = rend.height - (habSprs[0].h + 4) * menuPosR;
                var idx = 0;
                for(const sprIdx of menuOptionsSprIdxs) {
                    if (idx !== skip) {
                        if(drawMenuItem(SPRITES[sprIdx], x, y, 0, idx ) === true) {
                            API.startNextMenu(menuOptionsNextMenu[underMouse.menuIdx]);
                        }
                        x += w;
                    }
                    idx ++;
                }
                if (backOption) {
                    if(drawMenuItem(SPRITES[data.overlaySpriteSheet.names.backIcon], x, y, 0, idx ) === true) {
                        API.startNextMenu(API.backMenu);
                    }
                    x += w;
                    idx ++;
                }

                if (!notHolding && underMouse.slot > -1) { API.drawUnderMouse() }
                return x + 10;
            },
            shipSubOptions(x) {
                !API.backMenu && (API.backMenu = "shipOptions");
                const w = habSprs[0].w + 8;
                const notHolding = x !== undefined;
                var  x = x === undefined ? (rend.width / 2 - w * (currentShipUpgradeOpts.size + 2) / 2) | 0: x;
                var y = rend.height - (habSprs[0].h + 4) * menuPosR;
                x = API.menuOptions(x, 2, true);
                var idx = 0, count = 0;
                gData = undefined;
                for(const upgrade of currentShipUpgradeOpts.values()) {
                    const slot = menuSlots[currentSlot];
                    if (upgrade.qty === 0 && slot.remove && slot.hoverR <= 0) {
                        if (underMouse.slot === currentSlot) { underMouse.slot = -1 }
                        currentSlot ++;
                        idx ++;
                    } else {
                        count ++;
                        if (upgrade.qty > 0 || (upgrade.qty === 0 && slot.remove)) {
                            gData = upgrade;
                            drawCostIcon(x, rend.height, idx, upgrade);
                            if (drawMenuItem(SPRITES[upgrade.sprIdx], x, y, 0, idx ) === true) {
                                if (upgrade.ship) {
                                    if (baseShip.metals[upgrade.metalType]) {
                                        baseShip.metals[upgrade.metalType].maxCount += upgrade.amount;
                                        basesAPI.buy(upgrade);
                                        upgrade.qty --;
                                        Aoids.flasher("Upgraded ship metal stow: "+ upgrade.amount);
                                    }
                                } else if (upgrade.controls && baseShip.controls[upgrade.controls]) {
                                    let upgraded = false;
                                    for (const mount of baseShip.controls[upgrade.controls]) { // mounts
                                        if (mount.upgrade(upgrade.property, upgrade.amount)) {
                                            basesAPI.buy(upgrade);
                                            upgraded = true;
                                        }
                                    }
                                    if (upgraded) {
                                        upgrade.qty --;
                                        Aoids.flasher("Upgraded "+ upgrade.controls + " " + upgrade.name + " by " + upgrade.amount + " to " + baseShip.controls[upgrade.controls][0].upgradeResult);
                                    }

                                } else if (upgrade.mounts) {


                                }
                                if (upgrade.qty === 0) {
                                    slot.remove = true;
                                }
                            }
                            x += w;
                        }
                        idx ++;
                    }
                }
                if (count === 0) {
                    API.startNextMenu(API.backMenu);
                }
                if(!notHolding && underMouse.slot > -1) {

                    const slot = menuSlots[underMouse.slot];
                    if (slot && !slot.remove) {

                        API.drawUnderMouse();
                        const um = underMouse;
                        if (um.data) {
                            let str = "";
                            if (um.data.message) {
                                str = um.data.message;
                            } else {
                                if (um.data.ship) {
                                    str = "Ship " + um.data.name + " metal max +" + um.data.amount;
                                } else {
                                    str = "Upgrade "+ um.data.controls + " " + um.data.name + " by " + um.data.amount;
                                }
                            }
                            if (um.width === 0) {
                                um.width = Aoids.text.measure(str, 1);
                            }
                            Aoids.text.drawString(str, (um.x - um.width / 2 + um.spr.w / 2) | 0, um.y - slot.hoverBR * 130 | 0)
                        }
                    }
                }
                gData = undefined;
                return x + 10;
            },
            shipOptionsSetup() {
                for (const [typeName, opts] of shipUpgrades.entries()) {
                    for (const [name, upgrade] of opts.options.entries()) {
                        if (upgrade.qty === 0) {
                            opts.options.delete(name);
                        }
                    }
                    if (opts.options.size === 0) {
                        shipUpgrades.delete(typeName);
                    }
                }
            },
            shipOptions(x) {
                !API.backMenu && (API.backMenu = "menuOptions");
                const w = habSprs[0].w + 8;
                const notHolding = x !== undefined;
                var  x = x === undefined ? (rend.width / 2 - w * (shipUpgrades.size + 2) / 2) | 0: x;
                var y = rend.height - (habSprs[0].h + 4) * menuPosR;
                x = API.menuOptions(x, 2, true);
                var idx = 0;
                for(const opts of shipUpgrades.values()) {
                    if (opts.options.size ) {
                        if (drawMenuItem(SPRITES[opts.sprIdx], x, y, 0, idx ) === true) {
                            currentShipUpgradeOpts = opts.options;
                             API.startNextMenu("shipSubOptions");

                        }
                    }
                    x += w;
                    idx ++;
                }
                if(!notHolding && underMouse.slot > -1) {
                    API.drawUnderMouse();
                }
                return x + 10;
            },
            drawBaseSetup() {
                baseShip.glancing = true;
            },
            drawBase() {
                !API.backMenu && (API.backMenu = "menuOptions");
                const w = habSprs[0].w + 8;
                var  y = rend.height - (habSprs[0].h + 4) * menuPosR;
                var x =  (menuOptionsSprIdxs.length) * w + 10;
                var idx = 0;
                const screenW = rend.width - x;
                const um = (mouse.x - x) / screenW;
                const menuWidth = menuBase.all.length * w;
                API.menuOptions(8,0, true);
                gData = undefined;
                if (menuWidth > screenW) {
                    if (mouse.y > y) {
                        if(mouse.x < x) {
                            baseViewScrollPos = 0;
                        } else {
                            baseViewScrollPos =  um * (menuWidth - screenW );
                        }
                    }

                    x = -baseViewScrollPos + x;
                    idx = baseViewScrollPos / w | 0;
                    x += idx * w;
                    while(currentSlot < idx) { menuSlots[currentSlot++].update() }

                }
                if (mouse.y < y) {
                    if (baseShip.glancing && baseShip.closestAttachedDist < 6600 ) {
                        baseShip.inspect(baseShip.closestAttached, true)
                    }
                    if (baseShip.closestAttachedDist < 6600 && (mouse.button & 1) === 1) {
                        mouse.button &= 6;
                        baseShip.inspect(baseShip.closestAttached);

                    }


                }

                const flashColor = (Aoids.frame / 20 | 0) % 2 ? 0xFF0000FF : 0;
                while (idx < menuBase.all.length) {
                    const hab = gData = menuBase.all[idx]
                    const slot = menuSlots[currentSlot]
                    const health = hab.damage / hab.hp;
                    if (mouse.y < y && baseShip.closestAttached === hab) {
                        slot.hover = 1;
                        underMouse.slot = currentSlot;
                        underMouse.spr = habSprs[hab.attached.type];
                        underMouse.x = x;
                        underMouse.y = y;
                        underMouse.col = 0xFFFFFFFF;

                        underMouse.data = gData;
                        underMouse.width = 0;
                    }

                    health > 0.1 && drawHealthIcon(x, rend.height, hab.attached.type, 1 - health);
                    if (drawMenuItem(habSprs[hab.attached.type], x, y, health > 0.9 ? flashColor : 0, idx ) === true) {

                        baseShip.inspect(hab);
                    }
                    const habB = hab.attached.behaviour;
                    if (habB && habB.hasWorkers) {
                        const p = habB.personalState;
                        if (habB.usesPower && habB.personalState > 0) {
                            const w = habB.powerState;
                            drawHealthBar(x, y,
                                HAB_HEALTH[health * 31.9 | 0], 1 - health,
                                HAB_HEALTH[(1-p) * 31.9 | 0], 0.1 + p * 0.9,
                                HAB_POWER[w* 31.9 | 0], 0.1 + w * 0.9
                            );

                        } else {
                            drawHealthBar(x, y, HAB_HEALTH[health * 31.9 | 0], 1 - health, HAB_HEALTH[(1-p) * 31.9 | 0], 0.1 + p * 0.9);
                        }
                    } else if (habB && habB.usesPower) {
                        const w = habB.powerState;
                        drawHealthBar(x, y,
                            HAB_HEALTH[health * 31.9 | 0], 1 - health,
                            HAB_POWER[w* 31.9 | 0], 0.1 + w * 0.9
                        )
                    } else {
                        drawHealthBar(x, y, HAB_HEALTH[health * 31.9 | 0], 1 - health);
                    }

                    x += w;
                    idx++;
                    if (x > rend.width) { break }
                }
                while(currentSlot < menuBase.all.length) { menuSlots[currentSlot++].update() }

                if (underMouse.slot > -1) {
                    const slot = menuSlots[underMouse.slot];
                    API.drawUnderMouse();
                    const um = underMouse;
                    if (um.data) {
                        let str = "";
                        if (um.data.attached && um.data.attached.behaviour && um.data.attached.behaviour.statusStr ) {
                            str = um.data.attached.behaviour.statusStr();
                        }
                        if(str){
                            um.width = Aoids.text.measure(str, 1);
                            Aoids.text.drawString(str, (um.x - um.width / 2 + um.spr.w / 2) | 0, um.y - slot.hoverR *90 | 0)
                        }
                    }
                }
                gData = undefined;

            },
            drawBuild() {
                !API.backMenu && (API.backMenu = "menuOptions");
                const w = habSprs[0].w + 8;
                var  x = 8, y = rend.height - (habSprs[0].h + 4) * menuPosR;
                var idx = 0;
                x = API.menuOptions(8,1, true);
                for(const typeIdx of menuBase.buildables.values()) {
                    drawCostIcon(x, rend.height, typeIdx);
                    if (drawMenuItem(habSprs[typeIdx], x, y, 0, typeIdx) === true) {
                        menuBase.buyHab(underMouse.menuIdx);
                    }
                    x += w;
                }
                //API.drawBase(x + 18)
                if (underMouse.slot > -1) {
                    const menuIdx = underMouse.menuIdx;
                    const slot = menuSlots[menuIdx];
                    if (menuBase.cantBuild.has(menuIdx)) { //slot.disable) {
                        if (data.habitats.types[menuIdx].requiersFlat === undefined) {
                            data.habitats.types[menuIdx].requiersFlat = data.habitats.types[menuIdx].requiers.flat();
                        }
                        const requiers = data.habitats.types[menuIdx].requiersFlat;
                        for(const typeIdx of menuBase.buildables.values()) {
                            const slot = menuSlots[typeIdx];
                            if (requiers.includes(typeIdx-1)) {
                                slot.requiers = true;
                                slot.hoverD = 1;
                            } else {
                                slot.requiers = false;
                                slot.hoverD = 0;
                            }
                        }
                    } else {
                        for(const typeIdx of menuBase.buildables.values()) {
                            menuSlots[typeIdx].requiers = false;
                            menuSlots[typeIdx].hoverD = 0;
                        }
                    }
                    API.drawUnderMouse();
                } else {
                    for(const typeIdx of menuBase.buildables.values()) {
                        menuSlots[typeIdx].requiers = false;
                        menuSlots[typeIdx].hoverD = 0;
                    }
                }
            },
            drawUnderMouse() {
                drawMenuItem(underMouse.spr, underMouse.x, underMouse.y, underMouse.col,  underMouse.menuIdx, true);
            },
        }
        return API;
    }
    var delivery = {
        metals: undefined,
        bonus: undefined,
    }
    const API = {
        target: undefined,
        needDockingPad: 1,
        menu: undefined,
        delete() {
            for (const b of bases) { b.delete() }
            bases.length = 0;
            namedBases = {};
            rocks = undefined;
            this.menu = undefined;
        },
        set rocks(r) { rocks = r },
        init() {
            bases.forEach(base => base.init())
            this.menu = baseMenu();
        },
        landShip(baseName, ship) {
            if (namedBases[baseName]) {
                const dockingPads = namedBases[baseName].habitats.get(data.habitats.namedTypes.dockingPad);
                if (dockingPads.length > 0) {
                    ship.bases = API;
                    baseShip = ship;
                    ship.land = dockingPads[0];
                    API.menu.setupShip();
                }
            }
        },
        habAdded(desc, base) {
            if (desc.stores) {
                if (Array.isArray(desc.stores)) {
                    for (const s of desc.stores) {
                        if (s.metalType !== undefined && metals[s.metalType]) {
                            metals[s.metalType].maxCount += s.amount;
                            Aoids.flasher(metals[s.metalType].name + " max storage " + metals[s.metalType].maxCount);
                        }
                    }
                }
                if(desc.stores.metalType !== undefined && metals[desc.stores.metalType]) {
                    metals[desc.stores.metalType].maxCount += desc.stores.amount;
                    Aoids.flasher(metals[desc.stores.metalType].name + " max storage " + metals[desc.stores.metalType].maxCount);
                }
            }
            if (desc.shipUpgrades) {

                API.menu.addShipUpgradeOption(desc.shipUpgrades);

            }
            /*if (desc.shipStores && baseShip) {
                if(desc.shipStores.metalType !== undefined && baseShip.metals[desc.stores.metalType]) {
                    baseShip.metals[desc.shipStores.metalType].maxCount += desc.shipStores.amount;
                    Aoids.flasher("Ship " + baseShip.metals[desc.shipStores.metalType].name + " max stow " + baseShip.metals[desc.shipStores.metalType].maxCount);
                }

            }
            if (desc.shipWeapon && baseShip) {
                for (const upgrade of desc.shipWeapon) {
                    for (const [name, value] of Object.entries(upgrade)) {
                        for (const gun of baseShip.controls.fireMain) {
                            if (gun[name] !== undefined) { gun.upgrade(name,  value) }
                        }
                        Aoids.flasher("Upgraded: Gun "+ data.shipTech.names[name +"Name"]+ " by " + value);
                    }
                }
            }*/

        },
        buy(desc, metal = metals) {
            if (desc.costs) {
                let i = 5;
                while(i--) {
                    metal[i].count -= desc.costs[i];
                }
                currentBase && currentBase.updateBuildables();
                return
            }
            if (desc.metal === true) {
                const m = metal[desc.metalType];
                if (m.count === 0) {
                    return 0
                }
                if (m.count > desc.amount) {
                    m.count -= desc.amount;
                    currentBase && currentBase.updateBuildables();
                    return desc.amount;
                }
                const amount = m.count;
                m.count = 0;
                currentBase && currentBase.updateBuildables();
                return amount;
            }
        },
        canAfford(item, base, metals = base.metals) {
            var i = 5;
            if (item.costs) {
                while (i--) {
                    if (item.costs[i] > metals[i].count) { return false }
                }
            }
            return true;
        },
        canCreate(habDesc, base) {
            if (habDesc.costs) {
                if (!base) { return false }
                for (const typeIdx of habDesc.requiers) {
                    if (Array.isArray(typeIdx)) {
                        let hasItem = typeIdx.length === 0;
                        for (const tIdx of typeIdx) {
                            if (base.habitats.get(tIdx).length) {
                                hasItem = true;
                                break;
                            }
                        }
                        if (!hasItem) { return false }
                    } else {
                        if (!base.habitats.get(typeIdx).length) { return false }
                    }
                }
            }
            return true;
        },
        locateBaseByDocking(rock) {
            for (const b of bases) {
                for (const h of b.habitats.get(data.habitats.namedTypes.dockingPad)) {
                    if( h === rock) { return b }
                }
            }
        },
        locateBaseByRock(rock) {
            for (const b of bases) {
                if (b.homeRock === rock) {
                    return b;
                }
            }
        },
        createPad(onRock, ship) {
            const base = this.locateBaseByRock(onRock);
            if (base) {
                if (base.habitats.get(data.habitats.namedTypes.dockingPad).length === 0) {
                    if (this.canAfford(data.habitats.types[data.habitats.namedTypes.dockingPad], base, ship.metals)) {
                        currentBase = base;
                        this.needDockingPad = 0;
                        clearTimeout(timerHandle);
                        const desc = data.habitats.types[data.habitats.namedTypes.dockingPad];
                        const ang = Math.atan2(ship.y - onRock.y, ship.x - onRock.x) - onRock.r;
                        const scale = desc.scale !== undefined ? desc.scale : base.desc.scale === undefined ? data.habitats.scale : base.desc.scale;

                        const sprIdx = data.spriteSheet.names[desc.breakable][0];
                        const angWidth = ((desc.baseWidth ? desc.baseWidth : data.spriteSheet.sprites[sprIdx].w) * scale * 0.5) / onRock.radius;
                        base.buyHab(data.habitats.namedTypes.dockingPad, ship.metals, (ang + (Math.TAU * 10000)) % Math.TAU);
                        this.landShip(base.name, ship);

                        return;

                    } else {
                        Aoids.logger.log("could not afford");
                    }

                } else {
                    Aoids.logger.log("Already has landing pad");
                }
            } else {
                Aoids.logger.log("Rock not suitiable for base");
            }

        },
        deliver(onPad, newMetals) {
            currentDocked = onPad;
            currentBase = this.locateBaseByDocking(onPad);
            metals = currentBase.metals;
            API.menu.start(currentBase);
            delivery.metals = newMetals;
            delivery.unloadType = 0;
        },
        addBase(name, teamName) { bases.push(namedBases[name] = new Base(API, name, teamName)); },
        update() {

            if (currentBase) {
                if(currentDocked.attached.behaviour && currentDocked.attached.behaviour.docked) {
                    if (delivery.metals) {
                        const mType = delivery.unloadType % 5;
                        const m = metals[mType];
                        const mD = delivery.metals[mType];
                        if (mD.count > 0 && m.count < m.maxCount) {
                            mD.count --;
                            m.count ++;
                            currentBase.updateBuildables();
                        }
                        if (mD.count === 0 || m.count >= m.maxCount) {
                            delivery.unloadType++;
                        }
                    }
                } else {
                    API.menu.close();
                    currentBase = undefined;
                    currentDocked = undefined;
                    metals = undefined;
                }
            }
            if (API.menu.open && API.menu.startMenuDraw()) {
                API.menu.currentMenu()
            } else if (this.target && this.needDockingPad) {
                this.needDockingPad ++;
                if (this.needDockingPad % 60 === 0) {
                    if (this.canAfford(data.habitats.types[data.habitats.namedTypes.dockingPad], undefined, this.target.metals)) {
                        this.needDockingPad = 0;
                        Aoids.info("Docking Pad available.", 2000, undefined, undefined, "flash");
                        timerHandle = setTimeout(() => { Aoids.info("Land ship to deploy Docking Pad.", undefined, undefined, "flash") }, 2000);
                    }

                }
            }
            for (const base of bases) { base.update() }

        },
    };
    const basesAPI = API;
    return API;
};