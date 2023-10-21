export {HSLA};
function HSLA(h, s = 100, l = 50, a = 1) {
	this.h = h;
	this.s = s;
	this.l = l;
	this.a = a;
}
HSLA.prototype = {
	get CSS() {
		return "hsla(" +
			((this.h % 360 + 360) % 360) + "," +
			(this.s < 0 ? 0 : this.s > 100 ? 100 : this.s) + "%," +
			(this.l < 0 ? 0 : this.l > 100 ? 100 : this.l) + "%," +
			(this.a < 0 ? 0 : this.a > 1 ? 1 : this.a) + ")";
	},
	asCSS(h = 0, s = 0, l = 0, a = 0) {
		h += this.h;
		s += this.s;
		l += this.l;
		a += this.a;
		return "hsla(" +
			((h % 360 + 360) % 360) + "," +
			(s < 0 ? 0 : s > 100 ? 100 : s) + "%," +
			(l < 0 ? 0 : l > 100 ? 100 : l) + "%," +
			(a < 0 ? 0 : a > 1 ? 1 : a) + ")";
	},
	get contrastBW() { return this.l < 50 ? "#FFF" : "#000" },
};
	