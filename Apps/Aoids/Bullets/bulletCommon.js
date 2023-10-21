export {bulletCommon};
const bulletCommon = {
    init() { },
    hitSomething(objHit, hitPower){
		const O = this.owner;
		O.lastContact = 0;
        O.powerR2 = O.powerR = O.powerC = O.power = 0;
        O.life = 0;
        O.visible = false;
        return objHit.damage > objHit.hp;
	},
}