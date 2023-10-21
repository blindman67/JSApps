export {Pool};
function Pool(Type) {
	this.items = [];
	this.Type = Type;
}
Pool.prototype = {
	getItem() { return this.items.length ? this.items.pop() : new this.Type() },
	returnItem(item) { this.items.push(item) },
	empty() { this.items.length = 0 },
}