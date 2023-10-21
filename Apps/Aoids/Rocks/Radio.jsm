import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {habitatCommon} from "./habitatCommon.jsm";
export {Radio, RadioDish};
const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
function RadioDish(owner, desc) {
    this.owner = owner;
    this.pos = Math.PI / 2;
    this.x = this.y = this.r = 0;
    this.w = SPRITES[owner.rock.sprIdx].w / -2;
    this.productivity = 0;
    this.rate = (desc.swingRate + Math.random() * desc.swingRate) * 0.5;
    this.range = (desc.swingRange + Math.random() * desc.swingRange) * 0.5;
    this.angOffset = Math.PI;
}
RadioDish.prototype = {
    delete() { this.owner = undefined },
    update() {
        if (this.owner.rock.size <= 1) {
            const dish = this.owner.rock;
            this.pos += this.rate * this.productivity;
            const ang = (dish.r += Math.cos(this.pos) * this.range + this.angOffset);
            dish.x += Math.cos(ang) * this.w;
            dish.y += Math.sin(ang) * this.w;
            dish.dr = dish.r - this.r;
            dish.dx = dish.x - this.x;
            dish.dy = dish.y - this.y;
            this.x = dish.x;
            this.y = dish.y;
            this.r = dish.r;
        } else { this.kill() }
    },
    kill() {
        this.owner.selfRender = true;
        this.owner.behaviour = undefined;
        this.owner = undefined;
    },
};
function Radio(owner, desc) {
    this.initPersonal();
    this.initPower();
    this.owner = owner;
    this.desc = desc;
    this.tracks = [];
    this.tracks.size = 0;
    this.shutDown = false;
    this.trackAssign = 0;
    this.rockRangeCheckOdds = 1 / this.desc.maxTracks;
    this.dropTrack = false; // if true will remove a track and find a new one. This ensure that there is a steady stream of tracks
                            // if not done then could end up with tracks that no gun can fire at
}
Radio.prototype = {
    ...habitatCommon.personalManager,
    ...habitatCommon.power,
    ...habitatCommon.status,
    get extraStatus() {
        if (this.productivity > 0) {
            return "Tracking " + this.tracks.size;
        }
    },
    kill() {
        this.deaths();
        this.base.remove(this.owner.rock);
        if (this.owner.attachment &&  this.owner.attachment.attached.behaviour) {
            this.owner.attachment.attached.behaviour.kill();
            this.owner.attachment = undefined;
        }
        this.owner.behaviour = undefined;
        this.owner = undefined;

    },
    update() {
        if (this.owner.rock.size !== 0) {
            this.kill();
            return;
        }
        if (this.owner.attachment) {
            this.updateWorkers();
            this.powerSupply();
            if (this.owner.attachment.attached && this.owner.attachment.attached.behaviour) { this.owner.attachment.attached.behaviour.productivity = this.productivity}
            if (this.productivity === 0) {
                this.tracks.size = 0;
            } else {
                this.updateTracks();
                if (this.tracks.size < this.desc.maxTracks) {
                    this.findTracks();
                }
            }
            this.base.radarTrackCount += this.tracks.size;
        }
    },
    get track() {
        if(this.trackAssign >= this.tracks.size) {
            this.trackAssign = 0;
            this.dropTrack = true;

            return;
        }
        this.dropTrack = true;
        return this.tracks[this.trackAssign++];
    },
    findTracks() {
        if(Math.random() < this.productivity){
            var i = this.tracks.size;
            var c = this.desc.scanCount * this.productivity | 0;
            const max = this.desc.maxTracks;
            const rock = this.owner.rock;
            const range = this.base.radarRange * this.base.radarRange;
            while(c-- > 0 && i < max) {
                const r = this.owner.rocks.randomRock;
                const dx = r.x - rock.x;
                const dy = r.y - rock.y;
                const d = dx * dx + dy * dy;
                if (d < range) {

                    this.tracks[i++] = r;
                }
            }
            this.tracks.size = i;
        }

    },
    updateTracks() {
        const tracks = this.tracks;
        var h = 0, t = 0, len = this.tracks.size;
        if (this.dropTrack) { tracks[0] = undefined }
        const rock = this.owner.rock;
        const range = this.base.radarRange * this.base.radarRange;
        const odds = this.rockRangeCheckOdds  * this.productivity;
        while (h < len) {
            const r = tracks[h];
            if(r && r.alive && !r.changed) {
                if (Math.random() < odds) {
                    const dx = r.x - rock.x;
                    const dy = r.y - rock.y;
                    const d = dx * dx + dy * dy;
                    if (d < range) {
                        if (h > t) {
                            tracks[h] = tracks[t];
                            tracks[t] = r;
                        }
                        t++;
                    }
                } else {
                    if (h > t) {
                        tracks[h] = tracks[t];
                        tracks[t] = r;
                    }
                    t++;
                }
            }
            h++;
        }
        this.tracks.size =  t;
        this.dropTrack = false;
    },
};