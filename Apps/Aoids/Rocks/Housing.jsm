import {Vec2} from "../../../src/Vec2.jsm";
import {data} from "../data.jsm";
import {Aoids} from "../Aoids.jsm";
import {habitatCommon} from "./habitatCommon.jsm";
export {Housing};
function Housing(owner, desc) {
    this.owner = owner;
    this.desc = desc;
    this.beds = [];
    this.sleeping = 0;
    this.personal = this.desc.beds;
    this.shutDown = false;

    var i = 0;
    while(i < desc.beds) {
        this.beds[i++] = 0;
    }
    this.initPower();
}
Housing.prototype = {
    ...habitatCommon.power,
    delete() { this.owner = undefined },
    statusStr() {
        return "Sleeping: " + this.sleeping + " idle: " + this.personal;
    },
    update() {
        if (this.owner.rock.size !== 0) { this.kill() }
        else {
            const beds = this.beds;
            var h = 0, t = 0;
            while(h < this.sleeping) {
                var sleep = beds[h];
                if (sleep > 0) {
                    sleep -= 0.5 + this.productivity;
                    if (sleep <= 0) {
                        sleep = 0;
                        this.personal += 1
                    }
                    beds[h] = sleep;
                    if (h > t) {
                        beds[h] = beds[t];
                        beds[t] = sleep;
                    }
                    t ++;
                }
                h++;
            }
            this.sleeping = t;
            if (this.personal) {
                const d = this.desc.workCost;
                if (this.base.metals[d[0]].count >= d[1]) {
                    this.base.metals[d[0]].count -= d[1];
                    Aoids.logger.log("Refreshed worker return");
                    this.base.personalExchange(1, true); // ready to work
                    this.personal --;
                }
            }
            if (this.base.personalNeedSleep && this.sleeping < this.beds.length) {
                const d = this.desc.sleepCost;
                if (this.base.metals[d[0]].count >= d[1] && this.base.metals[d[2]].count > d[3]) {
                    this.base.metals[d[0]].count -= d[1];
                    this.base.metals[d[2]].count -= d[3];
                    this.beds[this.sleeping++] = this.base.dayLength / 3  + Math.random() * 30 | 0;
                    this.base.personalNeedSleep--;
                }
            }
            this.powerSupply(this.desc.power * this.sleeping);
        }
    },
    kill() {
        if (this.sleeping > 0) {
            this.base.personalDeaths += this.sleeping;
            this.sleeping = 0;
        }
        if (this.personal) {
            this.base.personalDeaths += this.personal;
            this.personal = 0;
        }
        this.base.remove(this.owner.rock);
        this.owner.behaviour = undefined;
        this.owner = undefined;
    },
};
