const stubFunction = function() { return this };
const rand = (min, max) => Math.random() * (max- min) + min;
var display;
const ParticleManager = {
	addType(name, interfaceObj) {
		const uName = name[0].toUperCase() + name.slice(1)];
		Particle.prototype[uName] = {
			init: interfaceObj.init ? interfaceObj.init : stubFunction;
			update: interfaceObj.update ? interfaceObj.update : stubFunction;
	},
	set display(_display) { display = _display },
	set pusher(_pusher) { pusher = _pusher },
	createSet() {
		return Object.assign([], {
			size: 0,
			add(type, options) { 
				var p;
				if (this.length > this.size) {
					p = this[this.size++];
				} else {
					this.push(p = new Particle());
					this.size ++;
				}
				type ? p.initType(type, options) : p.init(options);
			},
			each(cb) {
				var i = 0;
				const s = this.size;
				for(const p of this) {
					if(i === s) { return }
					cb(p,i);
				}
			},
			update() {
				const size = this.size;
				if (size) {
					var tail = 0, head = 0, tailP;
					while(head < size) {
						const p = this[head];
						p.update();
						if (!p.active) { 
							tailP = p;
							head ++;
							break;
						}
						head ++;
						tail ++;
					}
					while(head < size) {
						const p = this[head];
						p.update();
						if (p.active) {
							this[head++] = tailP;
							this[tail++] = p;
							tailP = this[tail]
						} else {
							head++;							
						}
					}
					this.size = tail;
				}
			}
			
		})
	}
}
		
function Particle() {}
Particle.prototype = {
	initType(type, options){
		this.init = type.init;	
		this.update = type.update;
		this.init(options);
	},
	default: {
		init(options) {
			this.displayPad = options.pad !== undefined ? options.pad : 32;
			this.x = Math.rand(-display.width / 2, display.width / 2);
			this.y = Math.rand(-display.height / 2, display.height / 2);
			const dir = Math.rand(0, Math.PI * 2);
			const speed = Math.rand(options.minSpeed, options.maxSpeed) / 60;
			this.vx = Math.cos(dir) * speed;
			this.vy = Math.sin(dir) * speed;
			this.active = true;
		},
		update() {
			this.x += this.vx;
			this.y += this.vy;		
			if (pusher) { this.push() }
			this.warp();
		},
	},
    push() {    
		const dx = this.x - pusher.x;
		const dy = this.y - pusher.y;
		const dist = (dx * dx + dy * dy) ** 0.5;
		const push = Math.ease(1 - dist / pusher.distance) * pusher.strength;
		this.x += dx * push;
		this.y += dy * push;
	},
    warp(){
        const b = this.displayPad, w = display.width / 2 + b, h = display.height / 2 + b;
        this.x = this.x < -w ? w : this.x > w ? -w : this.x;
        this.y = this.y < -h ? h : this.y > h ? -h : this.y;
    },
}

export {Particle, ParticleManager};
