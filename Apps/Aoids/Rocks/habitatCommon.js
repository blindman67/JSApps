import {Vec2} from "../../../src/Vec2.js";
import {data} from "../data.js";
import {Aoids} from "../Aoids.js";
const SPRITES = data.spriteSheet.sprites;
const BIT_DEFAULT_Z_INDEX = data.spriteSheet.defaultZIndexBit;
const habitatCommon = {
    status: {

        statusStr() {
            const s = this.extraStatus
            if (this.shutDown) {
                return "Shut down";
            }
            if (this.usesPower) {
                 if (this.powerState === 0) {
                     return "Need "+this.desc.power.toFixed(1)+"MW power" + (s ? " " + s : "");
                 }
            }
            if (this.needWorkers) {
                return "Need "+this.desc.personal+" workers"+ (s ? " " + s : "");
            }
            return "Productivity: " + (this.productivity*100).toFixed(0) + "%"+ (s ? " " + s : "");
        },


    },
    power: {
        usesPower: true,
        initPower() {
            this.productivity = 0;
            this.noPowerCount = 0;
            this.powerState = 0;
            this.pwR = 0;
            this.pwC = 0;
            this.blue = 0.1 + Math.random() * 0.1;
        },
        powerSupply(amount = this.desc.power) {
            if (this.needWorkers || this.shutDown) { amount = 0 }
            this.pwR += (this.pwC = (this.pwC += (amount - this.pwR) * this.blue ) * 0.1);
            amount = this.pwR;
            if (amount === 0) {
                if(!this.hasWorkers) { this.productivity = 1 }
                this.powerState = 1;
                this.noPowerCount = 0;
                return;
            }
            var power = this.base.powerRequest(amount, this);
            this.powerState = power / amount;
            if (power === 0) {
                if (this.hasWorkers && this.personal > 0) {
                    this.noPowerCount ++
                    if(this.noPowerCount > 60 + Math.random() * 30) {
                        this.hasWorkers && this.standdownWorkers();
                    }
                }
                this.productivity = 0;
            } else  if (power < amount) {
                if(this.hasWorkers) {
                    this.productivity *= power / amount;
                } else {
                    this.productivity = power / amount;
                }
                this.noPowerCount = 0;
            } else if(!this.hasWorkers) {
                this.productivity = 1;
                this.noPowerCount = 0;
            }

        }

    },
    personalManager: {
        hasWorkers: true,
        initPersonal() {
            this.personal = 0;
            this.personalWorkLength = 0;
            this.productivity = 0;
            this.personalState = 0;
            this.clock = 0;
            this.needWorkers = false;
        },
        deaths(){
            if (this.personal > 0) {
                this.base.personalDeaths += this.personal;
                this.personal = 0;
                this.productivity = 0;
                this.personalState = 0;
                this.needWorkers = false;
            }
        },
        updateWorkers() {
             if (this.shutDown) {
                if (this.personal > 0) {
                    this.standdownWorkers()
                }
                return;
            }
            if (this.personal > 0) {
                this.clock = (this.clock + 1) % (this.desc.personal + 1);
                this.personalWorkLength --;
                if (this.personalWorkLength <= 0) {
                    this.personal = this.base.personalExchange(this.personal);
                    this.personalState = this.productivity = 0;
                    this.needWorkers = true;
                }
            }
            if (this.personal < this.desc.personal) {
                this.needWorkers = true;
                this.personal += this.base.personalExchange(this.personal - this.desc.personal, this);
                this.personalState = this.productivity = this.personal / this.desc.personal;

            } else {
                 this.needWorkers = false;
                 this.personalState = this.productivity = 1;
            }



        },
        standdownWorkers() {
            if (this.personal) {

                if (this.personalWorkLength > this.base.dayLength / 5) { this.personal = this.base.stooddownWorkers(this.personal, this) }
                else { this.personal = this.base.personalExchange(this.personal) }
                this.personalState = this.productivity = 0;
                this.needWorkers = true;
            }
        },
        checkWorkTime() {
            if (this.shutDown) {
                if (this.personal > 0) {
                    this.standdownWorkers()
                }
                return;
            }

            if (this.personal > 0) {
                this.clock = (this.clock + 1) % (this.desc.personal + 1);
                this.personalWorkLength --;
                if (this.personalWorkLength <= 0) {
                    this.personal = this.base.personalExchange(this.personal);
                    this.personalState = this.productivity = 0;
                    this.needWorkers = true;
                }
                this.personalState = this.productivity = this.personal / this.desc.personal;
            } else {
                this.personalState = this.productivity = 0;
                this.needWorkers = true;
            }
        },
        getWorkers() {
            if (!this.shutDown) {
                if (this.personal < this.desc.personal) {
                    this.personal += this.base.personalExchange(this.personal - this.desc.personal, this);
                    this.personalState = this.productivity = this.personal / this.desc.personal;
                    this.needWorkers = this.personalState === 0;

                }
            }
        },
    },
    fireArc: {
        checkSafeFireFor(rock){
            const r = this.owner.rock;
            var left = this.left;
            var right = this.right;
            const a = r.r - Math.PI90;
            while(left < right) {
                const dx = Math.cos(a + left) * 2400, dy = Math.sin(a + left) * 2400;
                if (rock.isOnLineSlow(48, r.x, r.y, r.x + dx, r.y + dy)) { left += 0.01 }
                else { break }
            }


            while(right > left) {
                const dx = Math.cos(a + right) * 2400, dy = Math.sin(a + right) * 2400;
                if (rock.isOnLineSlow(48, r.x, r.y, r.x + dx, r.y + dy)) { right -= 0.01 }
                else { break }
            }
            this.left = this.left !== left ? left + 0.02 : this.left;
            this.right = this.right !== right ? right - 0.02 : this.right;
        },
        checkSafeFire(habitats) {
            const r = this.owner.rock;
            for (const hab of habitats) {
                if (hab !== r) {
                    this.checkSafeFireFor(hab);
                }
            }
            this.left = Math.sin(this.left);
            this.right = Math.sin(this.right);
        },
    },
    debug: {
        debug(buf, stride, rr, col) {
            const o = this.owner;
            const r = o.rock;
            const x = r.x, y = r.y;
            const A = this.aimAngleR;
            this.line(
                buf,
                stride,
                data.spriteSheet.names.whiteSwatch,
                x, y,
                x + Math.cos(r.r + rr) * 2600,
                y + Math.sin(r.r + rr) * 2600,
                SPRITES[data.spriteSheet.names.whiteSwatch].w,
                SPRITES[data.spriteSheet.names.whiteSwatch].h,
                10, col,
                0.1,
                Aoids.buffers.draw.bufIdx
            );
        },
        line(buf,  stride, sprIdx, xA, yA, xB, yB, sprW, sprH, width, color, z = 0.1) {
            var i = buf.length * stride;
            const b = buf.data;
            const bI = buf.UI32
            const dx = xB - xA;
            const dy = yB - yA;
            const r = Math.atan2(dy, dx);
            const len = (dx * dx + dy * dy) ** 0.5;
            b[i    ] = xA;
            b[i + 1] = yA;
            b[i + 2] = width / sprW;
            b[i + 3] = len / sprH;
            b[i + 4] = 0.5;
            b[i + 5] = 1;
            b[i + 6] = r;
            //b[i + 7] = z;
            bI[i + 8] = color;
            bI[i + 9] = sprIdx | BIT_DEFAULT_Z_INDEX;
        },
    }
}
export {habitatCommon};
