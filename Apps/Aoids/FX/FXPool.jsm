export {FXPool};
function FXPool(FX, callback, defaultBufferIdx) {
	this.items = [];
	this.FX = FX;
	this.bufferIdx = defaultBufferIdx;
	this.callback = callback;
}
FXPool.prototype = {
	getItem() { return this.items.length ? this.items.pop() : new this.FX() },
	returnItem(fx) { this.items.push(fx) },
	set buffers(bufArray) { this.callback(bufArray) },
};
