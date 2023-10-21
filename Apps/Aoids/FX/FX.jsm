export {FX};
function FX() {
	this.x = 0;
	this.y = 0;
    this.dx = 0;
    this.dy = 0;
	this.alive = true;
	this.bufferIdx = 0;
	this._type = undefined;
}
FX.prototype = {
	set type(type) {
		this._type && (this._type.returnItem(this.fxType));
		this._type = type;
		this.fxType = type.getItem();
	},
    initDelta(x, y, dx, dy, ...args) {
		this.alive = true;
		this.x = x - dx;
		this.y = y - dy;
		this.dx = dx;
		this.dy = dy;
		this.fxType.init(this, ...args);
    },

	init(x, y, ...args) {
		this.alive = true;
		this.x = x;
		this.y = y;
        this.dy = this.dx = 0;
		this.fxType.init(this, ...args);
	},
	update() {
        this.x += this.dx;
        this.y += this.dy;
        return this.alive = this.fxType.update(this);
    },
};