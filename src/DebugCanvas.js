import {} from "./utils/MathExtensions.js";
import {$, $$, $R} from "./DOM/geeQry.js";
import {Vec2} from "./Vec2.js";
import {renderer} from "./webGL/renderer.js";
export {DebugCanvas};
const wV1 = new Vec2();
const wV2 = new Vec2();
const wV3 = new Vec2();
const wV4 = new Vec2();
const wV5 = new Vec2();
const wV6 = new Vec2();
const wV7 = new Vec2();
const callStack = [];
function SCall(call, life, args) {
	this.call = call;
	this.life = life;
	this.args = args.map(a => a.clone ? a.clone() : a);
	callStack.push(this);
}
SCall.prototype = {
	run() { this.call(...this.args); this.life--; return this.life > 0 },
}
function DebugCanvas() {
	const canvas = $("canvas",{className: "debugCanvas"});
	const ctx = canvas.getContext("2d");
	const matrix = [];
	var W,H, show = true, paused = false;
	$$(document.body, canvas);
	function defaults() {
		W = canvas.width = innerWidth;
		H = canvas.height = innerHeight;
		ctx.font = "12px arial";
		ctx.fillStyle = "#FFF";
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";
	}
	function stroke(col, lw) {
		ctx.setTransform(1,0,0,1,0,0);
		ctx.strokeStyle = col;
		ctx.lineWidth = lw;
		ctx.stroke();
	}
	const API = {
		addCall(name, life, ...args) { new SCall(API[name], life, args) },
		update() {
			ctx.setTransform(1,0,0,1,0,0);
			ctx.globalAlpha = 1;
			ctx.filter = "none";
			ctx.globalCompositeOperation = "source-over";
			if(W !== innerWidth || H !== innerHeight) { defaults() }
			else { ctx.clearRect(0,0,W,H) }
			ctx.lineWidth = 1;
			ctx.strokeStyle = show ? "#F00" : "#FF0";
			ctx.strokeRect(0.5, 0.5, W-1, H-1);
		},
		endOfFrame() {
			var tail = 0, head = 0;
			while(head < callStack.length) {
				const call = callStack[head];
				if(!call.run() && !paused) {
					callStack[head] = undefined;
					head += 1;
				} else if(head !== tail) {
					callStack[head] = callStack[tail];
					callStack[tail] = call;
					head ++;
					tail ++;
				} else {
					head ++;
					tail ++;
				}
			}
			callStack.length = tail;
		},
		set paused(v) { paused = v },
		toggleShow() { show = !show	},
		useView(view) { view.asMatrixArray(ctx.canvas.width, ctx.canvas.height, matrix) },
		drawVector(vec, vecFrom, scale = 1, col = "#F00", lw = 2) {
			if (!show) { return }
			vec.scale(scale, wV1);
			vec.normalize(wV2);
			vecFrom.add(wV1, wV1);			
			wV3.copyOf(wV2).rotate90();
			ctx.setTransform(...matrix);
			ctx.beginPath();
			ctx.rect(-10 + vecFrom.x,-10 + vecFrom.y,20,20)
			ctx.moveTo(...vecFrom);
			ctx.lineTo(...wV1);
			ctx.lineTo(...wV1.addScaled(-14, wV2).addScaled(14, wV3));
			stroke(col, lw);
		},
		drawLine(v1, v2, col = "#F00", lw = 2) {
			if (!show) { return }			
			ctx.setTransform(...matrix);
			ctx.beginPath();
			ctx.rect(-2 + v1.x,-2 + v1.y,4,4)
			ctx.moveTo(-2 + v2.x,-2 + v2.y)
			ctx.rect(-2 + v2.x,-2 + v2.y,4,4)
			ctx.moveTo(...v1);
			ctx.lineTo(...v2);
			stroke(col, lw)
		},
		drawPoint(v, size, col = "#F00", lw = 2) {
			API.drawPointSquare(v, size, col, lw);
		},
		drawPointSquare(v, size, col = "#F00", lw = 2) {
			if (!show) { return }			
			ctx.setTransform(...matrix);
			ctx.beginPath();
			ctx.rect(v.x - size / 2, v.y - size / 2, size, size)
			stroke(col, lw)
		},
		drawPointCircle(v, size, col = "#F00", lw = 2) {
			if (!show) { return }			
			ctx.setTransform(...matrix);
			ctx.beginPath();
			ctx.arc(v.x, v.y, size / 2, 0, Math.PI * 2)
			stroke(col, lw)
		},
		drawNumber(value, v, dec = 2, col = "#FFF") {
			if (!show) { return }			
			ctx.setTransform(...matrix);
			ctx.fillStyle = col;
			ctx.fillText(value.toFixed(dec), v.x, v.y);
		},
			
		drawAngle(v, fromAng, ang, size, col = "#F00", lw = 2) {
			if (!show) { return }			
			ctx.setTransform(...matrix);
			const dx1 = Math.cos(fromAng);
			const dy1 = Math.sin(fromAng);
			const dx2 = Math.cos(fromAng + ang);
			const dy2 = Math.sin(fromAng + ang);
			const dir = Math.sign(ang);
			const dx3 = Math.cos(fromAng + ang - 10 / (size / 2) * dir);
			const dy3 = Math.sin(fromAng + ang - 10 / (size / 2) * dir);
			ctx.beginPath();

			ctx.moveTo(v.x + dx1 * size * 0.6,  v.y + dy1 * size * 0.6);
			ctx.lineTo(v.x, v.y);
			ctx.lineTo(v.x + dx2 * size * 0.53,  v.y + dy2 * size * 0.53);
			if(dir < 0) {
				ctx.moveTo(v.x + dx1 * size * 0.5,  v.y + dy1 * size * 0.5);
				ctx.arc(v.x, v.y, size / 2, fromAng , fromAng + ang, true);
				ctx.lineTo(v.x + dx3 * (size * 0.5 + 5),  v.y + dy3 * (size * 0.5 + 5));
			} else {
				ctx.moveTo(v.x + dx1 * size * 0.5,  v.y + dy1 * size * 0.5);
				ctx.arc(v.x, v.y, size / 2, fromAng, fromAng + ang);
				ctx.lineTo(v.x + dx3 * (size * 0.5 + 5),  v.y + dy3 * (size * 0.5 + 5));
			}
			stroke(col, lw)
		},		
		drawCollisionMap(v, scale, rotate, map, col = "#F00", lw = 2) {
			if (!show) { return }			
			var a = 0;
			const x = v.x;
			const y = v.y;
			const ml = map.length;
			ctx.setTransform(...matrix);
			ctx.beginPath();
			while(a < ml) {
				const ang = (a / map.length) * Math.PI * 2 + rotate;
				const l = map[a] * scale;
				ctx.lineTo(
					Math.cos(ang) * l + x,
					Math.sin(ang) * l + y,
				);
				a += 1;
			}	
			ctx.closePath();
			stroke(col, lw);
		}
	};
	return API;
}