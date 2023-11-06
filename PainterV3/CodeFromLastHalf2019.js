/*END*/



    ctx.setTransform(1,0,0,1,0,0)
    ctx.clear()

function Vert(x = 0, y = 0, z = 0) { this.init(x,y,z) }
Vert.prototype = {
    init(x,y,z) { return Object.assign(this, {x,y,z}) },
    assign(vert) { return (this.x = vert.x, this.y = vert.y, this.z = vert.z, this) },
    copy() { return new Vert(this.x, this.y, this.z) },
    add(vert) { return (this.x += vert.x, this.y += vert.y, this.z += vert.z, this) },
    subtract(vert) { return (this.x -= vert.x, this.y -= vert.y, this.z -= vert.z, this) },
    multiply(val)  { return (this.x *= val, this.y *= val, this.z *= val, this) },
    length() { return (this.x * this.x + this.y * this.y + this.z * this.z) ** 0.5 },
    normalize() { return this.multiply( 1 / this.length()) },
    rotateZ(ang, origin) {
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const r = this.copy().subtract(origin);
        this.x = r.x * c - r.y * s + origin.x; 
        this.y = r.x * s + r.y * c + origin.y; 
    },
    rotateY(ang, origin) {
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const r = this.copy().subtract(origin);
        this.x = r.x * c - r.z * s + origin.x; 
        this.z = r.x * s + r.z * c + origin.z; 
    },   
    rotateX(ang, origin) {
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const r = this.copy().subtract(origin);
        this.y = r.y * c - r.z * s + origin.y; 
        this.z = r.y * s + r.z * c + origin.z; 
    },   
};
const V = (...args) => new Vert(...args);
function Verts(...verts) {
    return Object.assign([...verts], {
        copy() { return Verts(...this.map(v => v.copy())) },
        polyEachVert(cb, poly) { for(const idx of poly) { cb(this[idx]) } },
        polyEachEdge(cb, poly, i = 0) { while (i < poly.length) {  cb(this[poly[i++]], this[poly[i % poly.length]]) } },
        polyArray(poly) { return poly.map(idx => this[idx]) },
        polyMid(poly) {
            const m = V();
            for(const idx of poly) { m.add(this[idx]) }
            m.multiply(1 / poly.length);
            return m;
        },
    });
}


const distance = (a, b) => a.copy().subtract(b).length();

const dotProduct = (a, b, c) => {
    const A = a.copy().subtract(b);
    const B = c.copy().subtract(b);
    return A.x * B.x + A.y * B.y + A.z * B.z;
}
const dotProductNorm = (a, b, c) => {
    const A = a.copy().subtract(b).normalize();
    const B = c.copy().subtract(b).normalize();
    return A.x * B.x + A.y * B.y + A.z * B.z;
}
const crossProduct = (a, b, c) => {
    const A = a.copy().subtract(b);
    const B = c.copy().subtract(b);
    return V(A.y * B.z - A.z * B.y, A.z * B.x - A.x * B.z, A.x * B.y - A.y * B.x);
}
const crossProductNorm = (a, b, c) => {
    const A = a.copy().subtract(b).normalize();
    const B = c.copy().subtract(b).normalize();
    return V(A.y * B.z - A.z * B.y, A.z * B.x - A.x * B.z, A.x * B.y - A.y * B.x);
}
const midPoint = (a, b, c) => {
    return a.copy().add(b).add(c).multiply(1 / 3);
}

const verts = Verts(V(10, -50, 0), V(100, 10, 0), V(50, 100, 0));
const poly = [0,1,2];
const cent = verts.polyMid(poly);
function rotate(poly, ang, axis, origin) {
    axis = axis.toUpperCase();
    verts.polyEachVert(v => v["rotate" + axis](ang, origin), poly);
}

function drawPoly(poly) {


    const cross = crossProduct(...verts.polyArray(poly))
    const crossA = cross.copy().multiply(1 / dotProduct(...verts.polyArray(poly)))
    
    ctx.setTransform(1,0,0,1,100,100)
    
    verts.polyEachEdge((a, b) => ctx.strokeLine(a.x, a.y, b.x, b.y), poly);
    ctx.strokeLine(verts[0].x, verts[0].y, r.x, r.y);

  //  ctx.strokeLine(verts[poly[1]].x, verts[poly[1]].y, verts[poly[1]].x + cross.x, verts[poly[1]].y +cross.y);
  //  ctx.strokeLine(verts[poly[1]].x, verts[poly[1]].y, verts[poly[1]].x + crossA.x, verts[poly[1]].y +crossA.y);
    
    ctx.setTransform(1,0,0,1,100,300)
    
    verts.polyEachEdge((a, b) => ctx.strokeLine(a.x, a.z, b.x, b.z), poly);
  //  ctx.strokeLine(verts[poly[1]].x, verts[poly[1]].z, verts[poly[1]].x + cross.x, verts[poly[1]].z +cross.z);
  //  ctx.strokeLine(verts[poly[1]].x, verts[poly[1]].z, verts[poly[1]].x + crossA.x, verts[poly[1]].z +crossA.z);
    ctx.strokeLine(verts[0].x, verts[0].z, r.x, r.z);
    
    ctx.setTransform(1,0,0,1,300,100)
    
    verts.polyEachEdge((a, b) => ctx.strokeLine(a.z, a.y, b.z, b.y), poly);
    //ctx.strokeLine(verts[poly[1]].z, verts[poly[1]].y, verts[poly[1]].z + cross.z, verts[poly[1]].y +cross.y);
   // ctx.strokeLine(verts[poly[1]].z, verts[poly[1]].y, verts[poly[1]].z + crossA.z, verts[poly[1]].y +crossA.y);
    ctx.strokeLine(verts[0].z, verts[0].y, r.z, r.y);
    
    ctx.setTransform(1,0,0,1,0,0)
}

var cross = crossProductNorm(...verts.polyArray(poly))


var r = V(verts[0].x + 50, verts[0].y, verts[0].z);
ctx.strokeStyle = "black" 
drawPoly(poly)
var sum0 = 0;
verts.polyEachEdge((a, b) => sum0 += (a.x * b.y - a.y * b.x), poly);
var a0 = Math.abs(sum0 / 2);
log("Area = " + Math.abs(sum0 / 2))

rotate(poly,Math.random() * Math.PI / 4,"z",cent);  
rotate(poly,Math.random() * Math.PI / 4,"x",cent);  
rotate(poly,Math.random() * Math.PI / 4,"y",cent);  
 

ctx.strokeStyle = "green" 
drawPoly(poly)

var r = V(verts[0].x + 50, verts[0].y, verts[0].z);

var rot = Math.acos(dotProductNorm(
    V(verts[1].x, verts[1].y, 0), 
    V(verts[0].x, verts[0].y, 0),
    V(r.x, r.y, 0),
));

rotate(poly,-rot,"z",verts[poly[0]]);  


var rot = Math.acos(dotProductNorm(
    V(verts[1].x, 0, verts[1].z), 
    V(verts[0].x, 0, verts[0].z),
    V(r.x,0, r.z),
));

rotate(poly,rot,"y",verts[poly[0]]);  

var rot = Math.acos(dotProductNorm(
    V(0, verts[2].y, verts[2].z), 
    V(0, verts[0].y, verts[0].z),
    V(0, r.y+ 20, r.z),
));

log(rot)
rotate(poly,-rot,"x",verts[poly[0]]);  

var sum = 0;
verts.polyEachEdge((a, b) => sum += (a.x * b.y - a.y * b.x), poly);
var a = Math.abs(sum / 2)
log("Area = " + a)


 
ctx.strokeStyle = "red" 
drawPoly(poly)


//requestAnimationFrame(main);
function main() {
    ctx.setTransform(1,0,0,1,0,0)
    ctx.clear()    
    rotate(poly,0.001,"x",cent);
    drawPoly(poly)
    if(mouse.button === 0) { requestAnimationFrame(main) }
    else { log("done") }
}


/*END*/
log.clear();
canvas.style.background = "#000"
//const ctx = canvas.getContext( '2d' );
const GRAVITY = 0.2;  // per frame squared
//var cw = canvas.width = innerWidth;
//var ch = canvas.height = innerHeight;

var cw = canvas.width;
var ch = canvas.height;

const TARGET_RADIUS = 5;
const SHELL_X = cw / 2;  // Location that shells are fired from in px
const SHELL_Y = ch;
const TURN_RATE = 0.01;  // in fraction of angulare dist from down

var startTime, globalTime;
const DISPLAY_TIME = 100000; // in ms
const SHELL_TIME = 100;     // in frames
const MAX_SHELLS = 10;        
const MAX_PARTICLES = 1000;        
const SHELL_RANDOM_RATE = 0.1; // cof of shell random fire control
const SHELL_FIRE_CURVE = 3;     // Highest power of fire control exponents 
var randomFire = 0; // holds the odds of a random shell being fired
var hue = 120;
var limiterTotal = 5;
var limiterTick = 0;
var timerTotal = 60;
var timerTick = 0;
var mousedown = false, mx, my;		

Math.TAU = Math.PI * 2;
Math.PI90 = Math.PI / 2;
Math.PI270 = Math.PI + Math.PI90;
Math.rand = (m, M) => Math.random() * (M - m) + m;
Math.distance = (x1, y1, x2, y2) => ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;

requestAnimationFrame(mainLoop);


function Trail() {}
function Particle() { }
function Shell( sx, sy, tx, ty ) {
	this.trail = new Trail();
	this.init(sx, sy,tx,sy);
}

Trail.prototype = {
	init(x, y) {
		this.x1 = this.x2 = this.x3 = x;
		this.y1 = this.y2 = this.y3 = y;
	},
	update(x, y) {
		this.x3 = this.x2
		this.y3 = this.y2
		this.x2 = this.x1
		this.y2 = this.y1
		this.x1 = x;
		this.y1 = y;
	},
	draw() {
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x2, this.y2);
		ctx.lineTo(this.x3, this.y3);
	}
};
Shell.prototype = {
	init(tx, ty, time) {  // time in frames must be integer
		var i;
		this.x = SHELL_X;
		this.y = SHELL_Y;
		this.sx = (tx - this.x) / (time / 2);
		this.sy = ((ty - this.y) * (GRAVITY / ((time / 2) ** 0.5)));
		this.tx = tx;
		this.ty = ty;
		this.power = (-this.sy * 10) | 0;
		this.hue = Math.rand(360, 720) % 360 | 0;
		this.hue2 = Math.rand(360, 720) % 360 | 0;
		this.active = true;
		this.trail.init(this.x, this.y);
		this.time = time  / 2;
		this.life = time / 2;
	},
	explode() {
		this.active = false;
		particles.explode(this, this.power);
		
	},
	update() {
	    this.time -= 1;
		if (this.time <= 0) { this.explode() }
		this.sy += GRAVITY;
		this.x += this.sx;
		this.y += this.sy;
		this.trail.update(this.x, this.y);
		return this.active;
	},
	draw() {
		var lum = (this.time / this.life) * 100;
		ctx.strokeStyle = 'hsl(' + this.hue + ', 100%, ' + lum + '%)';
		ctx.beginPath();
		this.trail.draw();
		ctx.stroke();
	},
};

Particle.prototype = {
	init(shell) {
		this.x2 = this.x1 = this.x = shell.x;
		this.y2 = this.y1 = this.y = shell.y;
		this.dx = shell.sx;
		this.dy = shell.sy;
		this.angle = Math.rand(0, Math.TAU);
		const zAng = Math.cos(Math.random() ** 2 * Math.PI)
		this.speed = zAng * shell.power / 30;
		this.friction = 0.95;
		this.gravity = GRAVITY;
		const hue = shell.hue + 360;
		this.hue =Math.rand( hue - 5, hue + 5 ) % 360;
		this.hueChange = shell.hue2;//Math.rand(0,360) + this.hue;
		this.currentHue = shell.hue;
		this.brightness = Math.rand( 25, 50 );
		this.alpha = shell.power / 10;
		this.decay = Math.rand( 0.2, 0.5);
		this.active = true;
	},
	update() {
	    const dx = Math.cos(this.angle);
	    const dy = Math.sin(this.angle);
		this.x2 = this.x1;
		this.y2 = this.y1;
		this.x1 = this.x - dx;
		this.y1 = this.y + dy;
		this.speed *= this.friction;
		this.currentHue += this.hue - this.currentHue;
		if(this.alpha <= 1 && Math.random() < 0.1) {
		    this.hue = this.hueChange;
		}

		this.x += (this.dx *= 0.9);
		this.y += (this.dy *= 0.9);
		this.dy += GRAVITY / 100;
		this.x += dx * this.speed;
		this.y += dy * this.speed;
		this.alpha -= this.decay;
		if( this.alpha <= 0 || this.x < 0 || this.y < 0 || this.x > cw) {
			this.active = false;
		}
		return this.active;
	},
	draw() {
	    const alpha = this.alpha/5 > 1 ? 1 : this.alpha / 5;
	    const lum = this.brightness + this.alpha
	    const hue = this.currentHue % 360;
		ctx.strokeStyle = 'hsla(' + hue + ', 100%, ' + (lum < 100 ? lum : 100) + '%, ' + alpha + ')';
		ctx. beginPath();
		ctx.moveTo( this.x2, this.y2);
		ctx.lineTo( this.x, this.y );
		ctx.stroke();
		
	}
};

function BubbleArray(extension) {
	// Bubble down array, rather than slicing, active items bubble down to bottom of array, while
	// inactive items move up. New items are pushed or taken from existing inactive items
	// This avoids GC problems on lower end devices
	// For long lived Arrays only
	return Object.assign([], { //extends an Array
			size: 0,
			update() {
				var read = 0, write = 0; 
				while (read < this.size) {
					const item = this[read];
					if(read !== write) {
						const temp = this[write]
						this[write] = item;
						this[read] = temp;
					}
					if (item.update() === true) {
						write ++; 
					}
					read++;
				}
				this.size = write;
			},
			draw() {
				const len = this.size;
				var i = 0
				while(i < len) { this[i++].draw() }
			},
			add(item) {
				this.size ++;
				this.push(item);
			},
			getInactive() { return this.size < this.length ? this[this.size++] : undefined },
		},
		extension,
	);
	
}
const particles = BubbleArray({
	explode(shell, count) {
		var item;
		while(count-- > 0) {
			!(item = this.getInactive()) && this.add(item = new Particle());
			item.init(shell);
		}
	},
});
const shells = BubbleArray({
	fire(tx = mx, ty = my) {
		var item;
		!(item = this.getInactive()) && this.add(item = new Shell());
		item.init(tx, ty, 100);
	}
});

ctx.lineCap = "round";


function mainLoop(time) {
	globalTime = time;
	if (startTime === undefined) { startTime = time }
	if (time - startTime > DISPLAY_TIME) {
	    log("done timeout")
		return; // ends update
	}
	


	ctx.globalCompositeOperation = 'destination-out';
	ctx.globalAlpha = 0.4;
	ctx.fillStyle = "#000"
	ctx.fillRect( 0, 0, cw, ch );
	ctx.globalCompositeOperation = 'lighter';
	shells.update();
	particles.update();
	
	ctx.lineWidth = 2;
	shells.draw();
	ctx.lineWidth = 3;
	particles.draw();

    if(shells.size < MAX_SHELLS && particles.size < MAX_PARTICLES) {
		if(mousedown) {
			randomFire = 0;
			shells.fire(mx, my, SHELL_TIME);
		} else {		
			randomFire += SHELL_RANDOM_RATE;
			if(Math.random() < randomFire ** SHELL_FIRE_CURVE) {
				randomFire = 0;
				shells.fire(Math.rand(cw * (1/3), cw *(2/3) ), Math.rand(0, ch / 2 + ch / 4 ), SHELL_TIME);
			}
		}
	}
	
	//requestAnimationFrame(mainLoop);
	
	
	if(mouse.button !== 4) {
        requestAnimationFrame(mainLoop);
	} else {
	    log("done")
	}
	
}

log("Rready")



/*END*/
function popularNToysBM1(numToys, topToys, toys, numQuotes, quotes) {
	const toyMap = new Map(toys.map(toy => [toy, [0]]));
	quotes.length > numQuotes && (quotes.length = numQuotes);
	for (const quote of quotes) {
		for (const word of quote.toLowerCase().split(/[^A-Z]/gi)) {
			toyMap.has(word) && (toyMap.get(word)[0] += 1);
		}
	}
	const top = [...toyMap.entries()].sort(
	        (a, b) => a[1] === b[1] ? 
		        (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0) :
		        b[1] - a[1]
	);
	top.length = topToys <= toys.length ? topToys : toys.length;
	return top.map(entry => entry[0]);
}
function popularNToysBM(numToys, topToys, toys, numQuotes, quotes) {
	quotes.length > numQuotes && (quotes.length = numQuotes);
	toys.length > numToys && (toys.length = numToys);
	const toyMap = new Map(toys.map(toy => [toy, [0]]));
	for (const toy of quotes.join(" ")
	    .toLowerCase()
	    .match(new RegExp(toys.join("|"), "gi"))) { 
	    toyMap.get(toy)[0] ++;
	}
	const top = [...toyMap.entries()].sort(
	        (a, b) => a[1] === b[1] ? 
		        (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0) :
		        b[1] - a[1]
	);
	top.length = topToys <= toys.length ? topToys : toys.length;
	return top.map(entry => entry[0]);
}



function popularNToysOP1(numToys, topToys, toys, numQuotes, quotes){
  const pattern = new RegExp(toys.join("|"), "gi");
  const matches = quotes.flatMap(e => e.toLowerCase().match(pattern));
  
  const toyFrequencies = matches.reduce((counts, toy) => {
    counts[toy] = ++counts[toy] || 1;
    return counts;
  }, {});

  return Object.entries(toyFrequencies)
    .sort(([aToy, aCount], [bToy, bCount]) =>
      bCount - aCount || bToy.localeCompare(aToy)
    )
    .slice(0, topToys)
    .map(([toy, count]) => toy);
};

// DEFINE ANY FUNCTION NEEDED
function sanitize (w) {
    return w.toLowerCase();
}
function sanitizeSentence(sentence = "") {
    return sanitize(sentence.replace(/[^a-zA-Z ]/g, ""));
}
function sanitizeArr(arr = []) {
    return arr.map(a => sanitize(a));
}
function getUniqueWordsOf(quote) {
    return quote.split(" ").reduce((uniqueWords, word) => {
        if (!uniqueWords.includes(word)) {
            uniqueWords.push(word);
        }
        return uniqueWords;
    }, []);
}

// returns a key value object, 
// with key the toy name and value the number of toys
function getToysFromQuotes(quotes, toys = []) {
  const sanitizedToys = sanitizeArr(toys);
  const uniqueToys = {};
  quotes.forEach(quote => {
    const uniqueWords = getUniqueWordsOf(quote);
    uniqueWords.reduce((uniqueToys, word) => {        
        if (toys.includes(word)) {
            if (uniqueToys[word]) {
                uniqueToys[word] = uniqueToys[word] + 1;                
            } else {
                uniqueToys[word] = 1;
            }         
        }
        return uniqueToys;
    }, uniqueToys);
  });
  return uniqueToys;
}
function orderToys (toyObj) {
    const sortable = [];
    for (const toy in toyObj) {
        sortable.push([toy, toyObj[toy]]);
    }
    return sortable.sort((a, b) => b[1] - a[1])
        .map(x => x[0]);
}
// FUNCTION SIGNATURE BEGINS, THIS FUNCTION IS REQUIRED
function popularNToys(numToys, topToys, toys, numQuotes, quotes) {
    // WRITE YOUR CODE HERE
    const quotesArr = quotes.map(sentence => sanitizeSentence(sentence));
    const sanitizedToys = sanitizeArr(toys);
    const mentionedToys = getToysFromQuotes(quotesArr, toys);
    const orderedToys = orderToys(mentionedToys);

    return (orderedToys.length <= topToys)
      ? orderedToys
      : orderedToys.slice(0, topToys);
}
// FUNCTION SIGNATURE ENDS

const tests = [[
        6,2,
        ["elmo", "elsa", "legos", "drone", "tablet", "warcraft"],
        51,
        [
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Emo is the hottest of the season! Elmo will be on every kid's wishlist!",
            "The new Elmo dolls are super high quality", 
            "Expect the Elsa dolls to be very popular this year",
            "Elsa and Elmo are the toys I'll be buying for my kids",
            "For parents of older kids, look into buying them a drone",
            "Warcraft is slowly rising in popularity ahead of the holiday season"
        ]
    ],
];

for(const test of tests) {
    const result  = popularNToys(...test);
    const resultBM1  = popularNToysBM1(...test);
    const resultBM  = popularNToysBM(...test);
    const resultOP1  = popularNToysOP1(...test);
    log("---------------------")
    log(result + "")
    log(resultBM + "")
    log(resultBM1 + "")
    log(resultOP1 + "")
}
//return;
var soak = 0;
function testA() {
    for(const test of tests) {
        soak += popularNToys(...test).length;
    }
}
function testB() {
    for(const test of tests) {
        soak += popularNToysBM(...test).length;
    }
}
function testC() {
    for(const test of tests) {
        soak += popularNToysOP1(...test).length;
    }
}


setTimeout(() => performanceTester(tester), 0);
const tester = {
    name: "JS performance tester",
	testCount: 10,  // if ondone given this is number of times to do a complete test
	cooldown: 1000,  // time between tests
	testCycles: 100, // number of testing cycles
	prepCycles : 30, // Number of cycles to run befor testing. This
					 // is a optimiser shake down and used to ensure test times
					 // are above the timerResolution
	groupsPerCycle : 10, // number of timed groups per cycle
	groupTrim : 1,        // starting trim setting
	callsPerGroup : 100,  // number of calls per timed group

	timerResolution : 0.2, // this is the minimum resolution of the timer in ms
						   // Note that due to security concerns performance timers
						   // have had the time resolution reduced to stop
						   // code attempting to access CPU caches
	testInterval : 10, // Time between test cycles.
	resolutionError : false, // If the run time of the callsPerGroup is lower than
							 // the timer resoultion then the accumilating error
							 // makes results meaningless. This flag is set true
							 // when test time is too small. In the prep phase
							 // groupTrim is used to increase the time
							 // till a time above timerResoltion is found
	onEachDone: null,
	onDone: null,	

    args:[],

    functions: [{
            name: "OP",
            func: testA,
        },{
            name: "BM",
            func: testB,
        },{
            name: "OP1",
            func: testC,
        }
    ],
};

//testDfs()




/*END*/
const isNumber = (ch)=>{
  return Number(ch) == ch
}

const isExp = (exp, comp)=>{
  let i=j=0;


  while(i<exp.length && j<comp.length){
    if(comp[j] !== exp[i] && !isNumber(comp[j])){
      return false
    }
    else if(isNumber(comp[j])){

     let currentCompIdx = j;

     /*Find consexutive numbers*/
      while(isNumber(comp[currentCompIdx+1]))currentCompIdx++;

      /*Get Number from the compressed string*/
      const moveIndexBy = Number(comp.slice(j,currentCompIdx+1));
            /*set j pointer to index after the number*/
            j=currentCompIdx+1;

      /*Check if the letters after number is same*/
      if(comp[j] !== exp[i+moveIndexBy]){
        return false
      }
     i++;      
     j++;

    }
    else{
      i++;
      j++;
    }
  }
  return true
}
/*END*/

function popularity (users, geners) {
  const songsG = {}
  for (let gener in geners) {
    const songs = geners[gener]
    let i = 0
    while (i<songs.length) {
      const song = songs[i]
      songsG[song] = gener
      i++
    }
  }
  const pGeners = {}
  for (let user in users) {
    const uSongs = users[user]
    let i = 0; 
    const songMap = {}
    const pUserGeners = []
    while (i<uSongs.length) {
      const song = uSongs[i]
      const gener = songsG[song]
      if (songMap.hasOwnProperty(gener)) {
        if (songMap[gener] < 2) {
        pUserGeners.push(gener)
        songMap[gener] = songMap[gener] + 1
        }
      } else if (gener) {
        songMap[gener] = 1
      }
      i++
    }
     pGeners[user] = pUserGeners
  }
  return pGeners 
}

function popularity1(users,geners) {
    const userFavs = {};
    const songGeners = {};
    
    //for (const [genre, songs] of Object.entries(geners)) {
    for (const genre of Object.keys(geners)) {
        for(const song of geners[genre]) { songGeners[song] = genre }
    } 
    //for(const [name, songs] of Object.entries(users)) {
    for(const name of Object.keys(users)) {
        const gCounts = {};
        const favs = [];
        let max = 0, idx = 0;
        for (const song of users[name]) {
            const g = songGeners[song];
            const count = gCounts[g] = (gCounts[g] || 0) + 1;
            if (count >= max) {
                if (count > max) { idx = 0 }
                max = count;
                favs[idx++] = g;
            }
        }
        favs.length = idx;
        userFavs[name] = favs;
    }
    return userFavs;
}
function popularity12(users,geners) {
    const userFavs = {};
    const songGeners = {};
    
    //for (const [genre, songs] of Object.entries(geners)) {
    for (const genre of Object.keys(geners)) {
        for(const song of geners[genre]) { songGeners[song] = genre }
    } 
    //for(const [name, songs] of Object.entries(users)) {
    for(const name of Object.keys(users)) {
        const favs = [];
        const gCounts = {};
        let max = 0, idx = 0;
        for (const song of users[name]) {
            const g = songGeners[song];
            const count = gCounts[g] = (gCounts[g] || 0) + 1;
            if (count >= max) {
                if (count > max) { idx = 0 }
                max = count;
                favs[idx++] = g;
            }
        }
        idx < favs.length && (favs.length = idx);
        userFavs[name] = favs;
    }
    return userFavs;
}
const songs = [
    "a1","b1","c1","d1","e1","f1","g1","h1","i1","j1",
    "a2","b2","c2","d2","e2","f2","g2","h2","i2","j2",
    "a3","b3","c3","d3","e3","f3","g3","h3","i3","j3",
    "a4","b4","c4","d4","e4","f4","g4","h4","i4","j4",
    "a5","b5","c5","d5","e5","f5","g5","h5","i5","j5",
    "a6","b6","c6","d6","e6","f6","g6","h6","i6","j6",
    "a7","b7","c7","d7","e7","f7","g7","h7","i7","j7",
];
const randomSongs = () => $setOf($randI(1,15), i => $randItem(songs)).sort((a,b)=> a[1] - b[1]);
const userSongs = {  
   A: randomSongs(),
   B: randomSongs(),
   C: randomSongs(),
   D: randomSongs(),
   E: randomSongs(),
   F: randomSongs(),
   G: randomSongs(),
   H: randomSongs(),
   I: randomSongs(),
   J: randomSongs(),
   K: randomSongs(),
   L: randomSongs(),
   M: randomSongs(),
};
const songGenres = {  
   AA: ["a1","b1","c1","d1","e1","f1","g1","h1","i1","j1",],
   BB: ["a2","b2","c2","d2","e2","f2","g2","h2","i2","j2",],
   CC: ["a3","b3","c3","d3","e3","f3","g3","h3","i3","j3",],
   DD: ["a4","b4","c4","d4","e4","f4","g4","h4","i4","j4",],
   EE: ["a5","b5","c5","d5","e5","f5","g5","h5","i5","j5",],
   FF: ["a6","b6","c6","d6","e6","f6","g6","h6","i6","j6",],
   GG: ["a7","b7","c7","d7","e7","f7","g7","h7","i7","j7",],
}

log.obj(userSongs)
log("-------------------")
log.obj(popularity(userSongs, songGenres))
log("-------------------")
log.obj(popularity1(userSongs, songGenres))
return;




setTimeout(() => performanceTester(tester), 0);
const tester = {
    name: "JS performance tester",
	testCount: 10,  // if ondone given this is number of times to do a complete test
	cooldown: 1000,  // time between tests
	testCycles: 100, // number of testing cycles
	prepCycles : 30, // Number of cycles to run befor testing. This
					 // is a optimiser shake down and used to ensure test times
					 // are above the timerResolution
	groupsPerCycle : 10, // number of timed groups per cycle
	groupTrim : 1,        // starting trim setting
	callsPerGroup : 100,  // number of calls per timed group

	timerResolution : 0.2, // this is the minimum resolution of the timer in ms
						   // Note that due to security concerns performance timers
						   // have had the time resolution reduced to stop
						   // code attempting to access CPU caches
	testInterval : 10, // Time between test cycles.
	resolutionError : false, // If the run time of the callsPerGroup is lower than
							 // the timer resoultion then the accumilating error
							 // makes results meaningless. This flag is set true
							 // when test time is too small. In the prep phase
							 // groupTrim is used to increase the time
							 // till a time above timerResoltion is found
	onEachDone: null,
	onDone: null,	

    args:[userSongs, songGenres],

    functions: [{
            name: "BM",
            func: popularity1,
        },{
            name: "BM2",
            func: popularity12,
        },{
            name: "OP",
            func: popularity,
        }
    ],
};









/*END*/


const point = (x = 0, y)=>{if(x.x && y===undefined) { return {x : x.x, y: x.y} } return {x,y : y === undefined ? 0: y}};
const line = (p1 = point(),p2 = point())=>({p1,p2});
const pointAs = (pointToSet,p) => { pointToSet.x = p.x; pointToSet.y = p.y; return pointToSet};
const lengthSqr = (l,y=0) => { if(l.p1){ return Math.pow(l.p1.x - l.p2.x,2) + Math.pow(l.p1.y - l.p2.y,2) } if(l.x) { return l.x*l.x+l.y*l.y } return l * l + y * y };
const leng = (l,y=0) => { if(l.p1){ return Math.hypot(l.p1.x - l.p2.x, l.p1.y - l.p2.y) } if(l.x){ return Math.hypot(l.x,l.y) } return Math.hypot(l,y)} ;
const direction = (l,y=0) => { if(l.p1){ return Math.atan2(l.p2.y - l.p1.y, l.p2.x - l.p1.x) } if(l.x){ return Math.atan2(l.y,l.x) } return Math.atan2(y,l) };
const norm = (l,p = point()) =>{const len = leng(l); if(l.p1){p.x = (l.p2.x-l.p1.x)/len; p.y = (l.p2.y-l.p1.y)/len}else{p.x = l.x / len; p.y = l.y / len} return p}; 
const toVec = (l,p = point()) => (p.x = l.p2.x - l.p1.x, p.y = l.p2.y - l.p1.y, p);
const cross = (v1,v2) => v1.x * v2.y - v1.y * v2.x;
const dot = (v1,v2 = v1) => v1.x * v2.x + v1.y * v2.y;
const along = (v1,v2) =>(v2.x * v1.x + v2.y * v1.y)/(v1.y * v1.y + v1.x * v1.x);
const rot90 = (p) => {const x = p.x; p.x = -p.y; p.y = x; return p};
const rot180 = (p) => {p.x = -p.x; p.y = -p.y; return p};
const rotN90 = (p) => {const x = p.x; p.x = p.y; p.y = -x; return p};
const P2 = point;
const L2 = line;
const scale = 3;
const w = canvas.width;
const h = canvas.height;
const lLen = 60 * scale;
const spawnLen = 15 * scale;// lines spawn new lines at when longer than this len
const maxLen = 20 * scale;// 
const minSpawnLen = 2 * scale; // will Not spawn under this len
const growStress = 2 * scale;// lines spawn new lines when grow stress over this value
const growStressSide = 0.00002; // Fraction of growStress that rotates line
const spawnOdds = 1/ 12; // Lines above spawn len have this odds of spawning
const spawnCount = 15; // number of times a line can spawn
const spawnSize = 0.5; // new spawn line size as fraction of spawning line
const spawnStress = 0.50; // grows sprawning line to add stress. As fraction of original length
const maxCount = 60;
const agePerFrame = 0.1; // amount a line ages per frame
const unstressedLifeExtend = 0.1; // If line has negative growth stress this extends life as fraction of current life
const forcedAgeStress = 100.5; // scales crowding force to increase aging. 0 and there is no crowded forced aging
const maxAge = 100; // line older than this stops growing
const deadWood = 0.01; // how much dead lines resist change in length
const minD = 15 * scale;  // point repel max dist
const minD2 = minD * minD;
const joinDist = 0.5 * scale; // distance between points on ajoining lines that will cut out the two lines
const unBend = 0.05; // amount to unbend lines as fraction of alignment error
const force = 0.6;   // point repel force
const giggle = 0.01; // point random move
const lGrow = 0.14; // line growth 
const top = minD;
const left = minD;
const right = w - minD;
const bot = h - minD;
var end = 0;
var frame = 0
var frameStep = 10;
var simFrame = 0;
const maxFrames = 10000; // for debugging


const marks = [];
function addMarkP2(func, p2, ...args) {
    addMark(func, p2.x, p2.y, ...args);
}
function addMark(func, ...args) {
    marks.push({func,args});
}
function circle(mark,x, y, r = 2, lw = 1, style = "#FF0" ) {
    ctx.strokeStyle = style;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke()
}
function vector(mark, x, y, xx, yy, lw = 1, style = "#FF0" ) {
    ctx.strokeStyle = style;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.lineTo(x, y);
    ctx.lineTo(x + xx, y + yy);
    ctx.lineTo(x + xx * 0.8 - yy * 0.2, y + yy * 0.8 + xx * 0.2)
    ctx.stroke()
}
function lineSeg(mark, x, y, xx, yy, age, lw = 1, style = "#FF0" ) {
    ctx.strokeStyle = style;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.lineTo(x, y);
    ctx.lineTo(xx,yy);
    ctx.stroke()
    mark.args[4] --;
    return mark.args[4] > 0;
}
function drawMarks(keepMarks = false) {
    const keep = [];
    ctx.setTransform(1,0,0,1,0,0);
    if(keepMarks) {
        for(const m of marks) {
            m.func(m,...m.args);
        }
        
    
    } else {
        while(marks.length) {
            const m = marks.pop();
            if(m.func(m,...m.args)) { keep.push(m) }
        }
        
        marks.push(...keep);
    }
    
    
}
const lineV = P2(0,0);
const lineP = P2(0,0);
const linePDist = P2(0,0);
var workingLine;
function distFrom(p) {
    const l = workingLine;
    var x1,y1,x2,y2;
    x2 = p.x - l.p1.x;
    y2 = p.y - l.p1.y;
    u = (x2 * lineV.x  + y2 * lineV.y) / lineV.d;
    if(u >= 0 && u <= 1){
        linePDist.x = (l.p1.x + lineV.x * u) - p.x;
        linePDist.y = (l.p1.y + lineV.y * u) - p.y;
    } else {
        linePDist.x = l.p1.x - p.x;
        linePDist.y = l.p1.y - p.y;
    }
    return linePDist.x * linePDist.x + linePDist.y * linePDist.y;

}

const points = Object.assign([],{
    add(x,y) { var p; points.push(p = P2(x,y)); p.f = 0; p.inUse = true; return p },
    unUse() {
        for(const p of points) { p.inUse = false }
    },
    force(setPointForceVal = true) {
        var i = 0, j = 0, len = points.length, lLen = lines.length;
        var x,y,xx,yy,d
        while(i < lLen) {
            const l = workingLine = lines[i];
            if(l.dead && l.l1.dead) { i++; continue }
            const p1 = l.p1;
            if(p1.fix) {
                p1.x = p1.fix.x;
                p1.y = p1.fix.y;
                p1.f = -0.4;
            } else {
                setPointForceVal && (p1.f = -0.0);
                p1.x += ((Math.random() - 0.5) * 2) ** 2 * giggle;
                p1.y += ((Math.random() - 0.5) * 2) ** 2 * giggle;
                if(p1.x < left) { p1.f += 0.1; p1.x += ((minD - p1.x) / minD) ** 2 * force }
                if(p1.y < top) { p1.f += 0.1; p1.y += ((minD - p1.y) / minD) ** 2 * force }
                if(p1.x > right) { p1.f += 0.1; p1.x -= ((p1.x - right) / minD) ** 2 * force }
                if(p1.y > bot) {p1.f += 0.1;  p1.y -= ((p1.y - bot) / minD) ** 2 * force }
                lineV.x = l.p2.x - l.p1.x;
                lineV.y = l.p2.y - l.p1.y;
                lineV.d = lineV.x * lineV.x + lineV.y * lineV.y;                 
                const pp = l.p2;                
                j = i + 1;
                while(j < lLen) {
                    //const p2 = points[j];
                    const p2 = lines[j].p1;//points[j];
                    if(p2.inUse && p2 !== p1 && p2 !== l.p2 && p2 !== l.l1.p1) {
                        const dist = distFrom(p2);
                        if(dist < minD2) {
                            var d = dist ** 0.5;
                            xx = linePDist.x / d;
                            yy = linePDist.y / d;
                            d = (minD - d) / minD;
                            f  = force * d**2;
                            p1.x += xx * f * 0.5;
                            p1.y += yy * f * 0.5;
                            pp.x += xx * f * 0.5;
                            pp.y += yy * f * 0.5;
                           // addMark(vector,p2.x, p2.y, -xx * 200 * f, -yy * 200 * f, 1, "#FF0")
                           p1.f += f;
                            p2.x -= xx * f;
                            p2.y -= yy * f;

                        }
                    }
                    j++
                }
                //p1.inUse = false;
            }
            i++;
        }
    },
});
const lines = Object.assign([], {
    size: 0,
    writePos: 0,
    add(p1,p2,readFrom = lines.length) { 
        var l,x,y; 
        if(lines.writePos <= readFrom) {
            lines[lines.writePos++] = l = L2(p1,p2);
            l.idx = lines.writePos - 1;
        } else {
            lines.push(l = L2(p1,p2)); 
            l.idx = lines.length - 1;
        }
        x = p1.x - p2.x;
        y = p1.y - p2.y;
        l.dead = false;
        l.age = 0;
        l.growStress = 0;
        l.count = spawnCount;
        l.len = l.dLen = (x * x + y * y) ** 0.5 / 0.9;
        return l;
    },
    grow(amount = lGrow) {
        var cc = 0;
        const len = lines.length;
        lines.writePos = 0;
        var tt = 0, ts = 0,tl = 0;
        var x,y,xx,yy,x1,y1, d, dd, gs, i = 0,l1,l2;
        while(i < len) {
            if(cc++ > len) { throw new Error("Grow itteration error") }
            const l = lines[i];
            if(l.dead) {
                i ++;
                
            } else {
                if(lines.writePos < i) {
                    lines[lines.writePos] = l;
                }
                lines.writePos ++;
                if(l.count <= 0 || l.age > maxAge) {
    
                    l.count = -1;
                    const p1 = l.p1, p2 = l.p2;
                    xx = p2.x - p1.x;
                    yy = p2.y - p1.y;
                    dd = (xx * xx + yy * yy) ** 0.5;
                    l.dLen = dd;
                    xx /= dd;
                    yy /= dd;
                    dd = (l.len - dd) / 2 * deadWood;
                    p1.x -= xx * dd;
                    p1.y -= yy * dd;
                    p2.x += xx * dd;
                    p2.y += yy * dd;
                    
                } else {
                    const p1 = l.p1, p2 = l.p2;
                    tl += 1;
                    l.age += agePerFrame + (p1.f + p2.f) * forcedAgeStress;
                    l.len += lGrow * ((maxAge - l.age) / maxAge);
                    l.len = l.len > maxLen ? maxLen : l.len;

                    x1 = x = xx = p2.x - p1.x;
                    y1 = y = yy = p2.y - p1.y;
                    d = amount / (dd = (xx * xx + yy * yy) ** 0.5) ;
                    gs = l.len - dd;
                    ts += gs;
                    
                    const gss = gs > 0 ? gs * growStressSide : 0;
                    gs -= gss;
                    l.growStress = gs;
                    if(gs < 0) {
                        //addMark((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, Math.abs(gs) + 1, 2, gs < 0 ? "#F00" : "#FF0");
                        l.age -= (maxAge - l.age) * unstressedLifeExtend;
                        l.age =  l.age < 0 ? 0 : l.age; 
                    }
                    x /= dd;
                    y /= dd;
                    xx *= d;
                    yy *= d;
                    
                    if(d < spawnLen) {
                        p1.x -= xx;
                        p1.y -= yy;
                        p2.x += xx;
                        p2.y += yy;
                    } else {
                         p1.x += xx;
                        p1.y += yy;
                        p2.x -= xx;
                        p2.y -= yy;                   
                    }
                    //addMark((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 10-(l.age / maxAge) * 10 + 1, 2);
                    p1.x += y * gss;
                    p1.y -= x * gss;
                    p2.x -= y * gss;
                    p2.y += x * gss;
                    if(minSpawnLen < dd && (gs > growStress || dd > spawnLen) && Math.random() < spawnOdds) {
                        addMark(lineSeg, p1.x, p1.y, p2.x, p2.y,4, 2, "#FF0")
                        const p = points.add(p1.x + x1 * spawnSize, p1.y + y1 * spawnSize);
                        l.p2 = p;
                        l.len = dd * spawnStress;
                        l.count --;
                        ll = lines.add(p,p2, i, lines.writePos);
                        tl ++;
                        tt += ll.len;
                        if(l.l2) {
                            l.l2.l1 = ll;
                        }
                        ll.l2 = l.l2
                        ll.l1 = l;
                        l.l2 = ll
                    } else {
                       xx = p2.x - p1.x;
                       yy = p2.y - p1.y;
                       l.len -=  (l.len - dd) * 0.01;
                       
                    }
                }
                tt += l.len
                i ++;
            }
        }
        if(i < lines.length) {
            if (lines.writePos < i) {
                while (i < lines.length) {
                    lines[lines.writePos++] = lines[i++];
                }
                lines.length = lines.writePos;
                
            }
        }
        lines.totalLen = tt;
        lines.totalStress = ts.toFixed(1);
        lines.totalActive = tl;
    },

    straight() {
        var cc = 0;
        var x,y,xx,yy,dx,dy,dxx,dyy,dnx,dny,dn, d, dd,d1;
        var l = lines[0], start = l;
        do{
            if(cc++ > lines.length* 2) { 
                log("Straight itteration error: "+ cc + " > " + lines.length) 
                throw new Error("Straight itteration error") 
                
            }

            var ll = l.l2;
            if(ll) {
                /*if(l.count < 0 && l.dLen <= joinDist) {
                    l.dead = true;
                    l.l1.l2 = ll;
                    ll.l1 = l.l1;
                    log("dead cull" + l.idx)
                   
                    
                    
                    
                } else */{

                    
                    
                    x = (ll.p2.x - l.p1.x) / 2;
                    y = (ll.p2.y - l.p1.y) / 2;
                    xx = l.p1.x + x - l.p2.x;
                    yy = l.p1.y + y - l.p2.y;
                    d1 = (x * x + y * y) ** 0.5;
                    if (d1 <= joinDist) {
                        l.l1.l2 = ll.l2
                        ll.l2.l1 = l.l1;
                        l.dead = true;
                        ll.dead = true;
                        if(ll === start) { break }
                        ll = ll.l2;
                        log("bend  cull")

                    } else {
                        
                        dx = l.p1.x - l.p2.x;
                        dy = l.p1.y - l.p2.y;
                        dxx = ll.p2.x - l.p2.x;
                        dyy = ll.p2.y - l.p2.y;
                        x = ll.p2.x - l.p1.x;
                        y = ll.p2.y - l.p1.y;
                        d1 = (x * x + y * y) ** 0.5;
                        d = (dx * dx + dy * dy) ** 0.5;
                        dd = (dxx * dxx + dyy * dyy) ** 0.5;
                        x /= d1;
                        y /= d1;
                        dx /= d;
                        dy /= d;
                        dxx /= dd;
                        dyy /= dd;
                        const a = dx * dyy - dy * dxx;
                        //if (a > -0.01 && a < 0.01) {
                            dnx = (dx + dxx) / 2;
                            dny = (dy + dyy) / 2;
                            dn = (dxx * dxx + dyy * dyy) ** 0.5;
                            const aa = Math.abs(Math.asin(a));

                            const scaleY = Math.sin(aa) * unBend;
                            const scaleX = Math.sin(aa) * unBend;
                            //addMark(vector,l.p2.x, l.p2.y, dnx *1000 * scale, dny * 1000 * scale, 2, "#F00")
                            //addMark(vector,l.p2.x, l.p2.y, dnx *40 , dny * 40, 1, "#00F" )
                            l.p2.x += dnx * scaleY;
                            l.p2.y += dny * scaleY;
                            //addMark(vector,l.p2.x, l.p2.y, -x *200* scaleX , -y * 200* scaleX,1,"#F00" )
                            //addMark(vector,l.p2.x, l.p2.y, x *200* scaleX , y * 200* scaleX,1,"#FF0" )
                            
                            l.p1.x -= x * scaleX;
                            l.p1.y -= y * scaleX;
                            ll.p2.x += x * scaleX;
                            ll.p2.y += y * scaleX;
                        //}                        
                        /*d = (xx * xx + yy * yy) ** 0.5;
                        dd = l.len + ll.len;
                        d /= dd;
                        x /= d1;
                        y /= d1;
                        d1 = (dd - (d1 * 2));
                        d1 = d1 < 0 ? 0 : d1 * 0.1;*/
                        /*l.p2.x += xx * unBend * d;
                        l.p2.y += yy * unBend * d;
                        l.p1.x -= x * unBend * d1;
                        l.p1.y -= y * unBend * d1 ;
                        ll.p2.x += x * unBend * d1 ;
                        ll.p2.y += y * unBend * d1 ;*/
                        
                        l.p2.inUse = true;
                        l.p1.inUse = true;
                        ll.p2.inUse = true;
                    }
                }
    
                
                l = ll;
            } else {
                break;
            }
        } while(l && l !== start)
        
    },
    draw(wid = 1, col = "#000") {
        var cc = 0;
        var l = lines[0], start = l;
        ctx.lineWidth = wid;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(l.p1.x, l.p1.y);
        l.p1.inUse = true;
        do{
            if(cc++ > lines.length ) { 
                ctx.stroke();
                throw new Error("Draw itteration error: "+ cc + " > " + lines.length) 
                
            }

            ctx.lineTo(l.p2.x, l.p2.y);
            l.p2.inUse = true;
            l = l.l2;
        } while(l && l !== start) 
        
        ctx.lineTo(l.p2.x, l.p2.y);
        //ctx.fill();
        ctx.stroke();
        
    },
    drawCounts(wid = 1, col = "#000") {
        var l = lines[0], start = l;
        ctx.lineWidth = wid;
        
        do{
            ctx.beginPath();
            if(l.count < 0) {
                 ctx.strokeStyle = "#000";
                ctx.moveTo(l.p1.x, l.p1.y);
                ctx.lineTo(l.p2.x, l.p2.y);
                               
            }else {

                if(l.age < 2) {
                    ctx.strokeStyle = "Yellow"
                    
                    
                }else {
                    ctx.strokeStyle = "#" + 
                        Math.floor(l.count).toString(16).padStart(2,"0") + "55" +
                        Math.floor(l.age* 2).toString(16).padStart(2,"0");
                }
                   

                ctx.moveTo(l.p1.x, l.p1.y);
                ctx.lineTo(l.p2.x, l.p2.y);
                if(l.p1.f < 0) {
                    /*ctx.moveTo(l.p1.x - 4, l.p1.y - 4);
                    ctx.lineTo(l.p1.x + 4, l.p1.y + 4);
                    ctx.moveTo(l.p1.x - 4, l.p1.y + 4);
                    ctx.lineTo(l.p1.x + 4, l.p1.y - 4);*/
                    
                    
                } else {
                   //ctx.rect(l.p1.x - l.p1.f*100, l.p1.y - l.p1.f*100,  l.p1.f*100*2,   l.p1.f *100 *2)
                }
              //var c= l.p1.f* 100; //l.growStress;
               // ctx.rect(l.p1.x - c, l.p1.y - c,  c*2,   c *2)
            }
            ctx.stroke();
            l = l.l2;
        } while(l && l !== start) 
       // ctx.lineTo(l.p2.x, l.p2.y);
        //ctx.fill();
        
    },    
    drawSmooth(wid = 1, col = "#000") {
        var l = lines[0], start = l;
        var firstSeg = true, lastSeg = false;
        var x1,y1,x2,y2,x3,y3,d1,d2,d3,xx1,yy1,xx2,yy2,nx,ny;
        var bx1, by1;
        const smooth = 1 / 2.5;
        ctx.lineWidth = wid;
        ctx.strokeStyle = col;
        ctx.beginPath();
        debugger
        do{
            x1 = l.l1.p1.x;
            y1 = l.l1.p1.y;
            x2 = l.p1.x;
            y2 = l.p1.y;
            x3 = l.p2.x;
            y3 = l.p2.y;
            xx1 = x1 - x2;
            yy1 = y1 - y2;
            xx2 = x3 - x2;
            yy2 = y3 - y2;
            d1 = (xx1 * xx1 + yy1 * yy1) ** 0.5;
            d2 = (xx2 * xx2 + yy2 * yy2) ** 0.5;
            xx1 /= d1;
            yy1 /= d1;
            xx2 /= d2;
            yy2 /= d2;
            const cross = (xx1 * yy2 - yy1 * xx2) < 0 ? 1 : -1
            nx = xx2 + xx1;
            ny = yy2 + yy1;
            d3 = (nx * nx + ny * ny) ** 0.5;
            nx /= d3;
            ny /= d3;
            if(firstSeg) {
                firstSeg = false;
                ctx.moveTo(x2,y2);
                bx1 = x2 + ny * d2 * smooth * cross;
                by1 = y2 - nx * d2 * smooth * cross;
            } else {
                ctx.bezierCurveTo(
                    bx1,by1,
                    x2 - ny * d1 * smooth * cross, y2 + nx * d1 * smooth * cross,
                    x2,y2
                );
                bx1 = x2 + ny * d2 * smooth * cross;
                by1 = y2 - nx * d2 * smooth * cross;
                
            }
            l = l.l2;
            if(l === start && ! lastSeg) {
                start = l.l2;
                lastSeg = true;
            }
        } while(l && l !== start) 
//        ctx.lineTo(l.p2.x, l.p2.y);
       // ctx.stroke();
        ctx.fill();
        
        
        
    }

});

function addLine() {
    const step = 1/ (w / lLen);
    var i = step * 4,l1,l2;
    var p = points.add(i * w, h / 2);
   // p.fix = P2(p.x, p.y);
    const end = 1 - step * 4 + step / 2;
    i+= step;
    while(i < end) {
        const p1 = points.add(i * w, h / 2);
        l2 = lines.add(p,p1);
        if (l1) {
            l2.l1 = l1;
            l1.l2 = l2;
        }
        l1 = l2;
        p = p1;
        i+= step;
    }
    //p.fix = P2(p.x, p.y);
    
    
}
function addLine() {
    const step = 0.4/ (w / lLen);
    var i = 0,l1,l2, fl;
    var p = points.add(Math.cos(i * Math.PI * 2) * w / 5 + w / 2, Math.sin(i * Math.PI * 2) * h / 5 + h / 2);
    var pp = p;
   // p.fix = P2(p.x, p.y);
    const end = 1   + step / 2;
    i+= step;
    while(i < end) {
        const p1 = points.add(Math.cos(i * Math.PI * 2) * w / 5 + w / 2, Math.sin(i * Math.PI * 2) * h / 5 + h / 2);
        //const p1 = points.add(i * w, h / 2);
        l2 = lines.add(p,p1);
        if (l1) {
            l2.l1 = l1;
            l1.l2 = l2;
        } else {
            fl = l2;
        }

        l1 = l2;
        p = p1;
        i+= step;
    }
    //l2 = lines.add(p,pp);
    l1.p2 = fl.p1
    l1.l2 = fl;
    fl.l1 = l1;
    //p.fix = P2(p.x, p.y);
    
    
}
addLine();

requestAnimationFrame(update);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,w,h);           

function update() {

    
      if(end === 1) {
        //for(let i = 0; i < 100; i++){
        points.force();
        lines.straight();           
       // }
                    ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,w,h);           
            lines.drawSmooth(2,"#000");
            //drawMarks();
            log("closed") 
            return;
    }
    //if(mouse.button === 1) {
        frame += 1;
        if(frame % frameStep === 0) {
            log.clear();
            log("Sim: " + simFrame)
            log("Lines: " + lines.length)
            log("Points: " + points.length)
            var n = performance.now();
            points.unUse();
            var n1 = performance.now() - n;

            n = performance.now();
            lines.straight();
            var n2 = performance.now() - n;

            n = performance.now();
            points.force();
            var n3 = performance.now() - n;
            
            n = performance.now();
            lines.straight();
            var n4 = performance.now() - n;

           // points.force(false);
            //lines.straight();
           //  points.force(false);
            if(end === 0){
                n = performance.now();
                
                lines.grow();
                var n5 = performance.now() - n;
                
            }
                   
            simFrame ++;

            if(lines.totalActive === 0) { end = 1 }
         //   if(lines.totalLen/lines.totalActive > 20) { return }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,w,h);           
            lines.draw(2,"#000");
            drawMarks();
            if(n3 > 132) { end = 1; log("Function time too long") }
            if(maxFrames < frame ) { end = 2 }
            log("Stage: " + end)          
            log("Active lines: " + lines.totalActive)
            log("LineAvr: " + lines.totalLen/lines.totalActive)
            log("Unuse: " + n1.toFixed(2) + "ms")
            log("straight: " + (n2+n4).toFixed(2) + "ms")
            log("force: " + n3.toFixed(2) + "ms")
            log("grow: " + n5.toFixed(2) + "ms")
        }else  if(frame % frameStep === 1){
            log("Stepped: ")
        } else {
            points.force();
            lines.straight();
            //drawMarks(true);
        }
   // }


    //lines.draw(0.5,"#000");
    
    //lines.drawSmooth(1,"#000");
    if(end === 2) {
        log("closed");
        return;
    }
    
    if(mouse.button !== 2) {
        requestAnimationFrame(update);
        
    } else { 
        mouse.button = 0;
        end += 1;
        if(end === 2) {
            log("closed") 
        } else {
            requestAnimationFrame(update);
        }
    }
    
    
    
    
    
    
}


/*END*/
/*
 #++++
####+++
@@###++
 @###+
 
 +++
###++
@@#++
 @#+
  

##+
@#+

 
*/
const shade = {
    "#": [0,0,0],
    "+": [0,0,10],
    "@": [0,0,-10],
    hsl(pix, hsl) {
        const off = shade[pix];
        return `hsl(${hsl[0] + off[0]},${hsl[1] + off[1]}%,${hsl[2] + off[2]}%)`;
    }
}


const slices = {
    b9_6: "  #++++   ####+++ @@###++++@@@####++ @@###++   @###+  ",
    b7_4: " #++++ ####+++@@###++ @###+ ",
    b5_4: " +++ ###++@@#++ @#+ ",
    b3_2: "##+@#++",
    idxToCoord(idx, w, h, x, y) {
        return [x + (idx % w - (w / 2 | 0)), y + (((idx / w) | 0) - (h / 2 | 0))];
    }
}
const marks = {
    b9_6: "  __6__   5_____7 4________________0 3_____1   __2__  ",
    b7_4: " 5_6_7 4____________0 3_2_1 ",
    b5_4: " _6_ 5___74___0 321 ",
}
const steps = {
    b7_4: [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],
    b5_4: [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],
        
}
const B1 = [120,50,0];
const C1 = [120,50,40];
const C11 = [120,50,30];
const C2 = [60,50,40];
const C3 = [30,50,60];
const M = drawMark;
const S = drawSlice;
const model = [
    [[M,3,-1,7,4,B1], [M,3,5,7,4,B1], [M,6,-1,7,4,B1], [M,6,2,7,4,B1]],
    [[M,3,-1,7,4,B1],  [M,6,-1,7,4,B1]],
    [[M,3,-1,7,4,C1],  [M,6,-1,7,4,C1]],
    [[M,3,-1,7,4,C1], [M,3,5,7,4,C1], [M,6,-1,7,4,C1], [M,6,2,7,4,C1],[S,3,-1,5,4,C1]],
    [[M,3,-1,7,4,C1], [M,3,5,7,4,C1], [M,6,-1,7,4,C1], [M,6,2,7,4,C1],[S,3,-1,5,4,C2]],

    [[S,3,-1,5,4,C1],[M,2,-1,5,4,C3],[M,2,6,5,4,C3],[M,2,-1,7,4,C3],[M,2,-1,9,6,C3],[M,2,-1,7,4,C3]],
    [[S,3,-1,5,4,C1],[M,2,-1,7,4,C3]],
    [[S,3,-1,5,4,C1],[M,2,-1,7,4,C3]],

    [[S,3,-1,5,4,C3]],
    [[S,3,-1,5,4,C3]],
    [[S,3,-1,7,4,C11]],
    [[S,3,-1,5,4,C1]],
    //[[M,0,0,7,4,C1], [M,0,0,7,4,C1]]
    
]


function drawSlice(x, y, ang, step, w, h, hsl) {
    const slice = slices["b" + w + "_" + h];
    const len = w * h;
    var i = 0;
    while(i < len) {
        const pix = slice[i];
        if(pix !== " ") {
            const [xx, yy]= slices.idxToCoord(i, w, h, x, y);
            ctx.fillStyle = shade.hsl(pix, hsl);
            ctx.fillRect(xx,yy,1,1);
        }
        i++;
    }
}
function drawMark(x, y, ang, step, w, h, hsl) {
    const name = "b" + w + "_" + h;
    const idx = marks[name].indexOf(ang);
    const pix = slices[name][idx];
    const [sx, sy] = step > -1 ? steps[name][(ang+step)%8] : [0,0]
    log(sx+":"+sy)
    const [xx, yy]= slices.idxToCoord(idx, w, h, x , y );
    ctx.fillStyle = shade.hsl(pix, hsl);
    ctx.fillRect(xx+ sx,yy+ sy,1,1);
}
const draw = {
    mark: drawMark, 
    slice: drawSlice,
}

ctx.setTransform(1,0,0,1,0,0);
ctx.clear();
ctx.setTransform(4,0,0,4,0,0);

var y = 0;
for(const mods of model) {
    for(const mod of mods) {
        const modA = [...mod];
        const func = modA.shift();
        const ang = modA.shift();
        for(var x = 0; x < 8; x += 1) {
            func(10 + x * 14, 18 - y, (ang + x) % 8, ...modA)
        }
    }
    y ++;
}



/*END*/

requestAnimationFrame(update);
Math.TAU = 2.0 * Math.PI;
Math.rand = (min, max) => Math.random() * (max - min) + min;
Math.randNonZero = () => Math.random() * (1 - Number.EPSILON) + Number.EPSILON;
Math.randBoxMuller = () => (-2.0 * Math.log(Math.randNonZero()) * Math.cos(Math.TAU * Math.randNonZero())) ** 0.5;
Math.lerp = (u, min, max) => u * (max - min) + min;

const Vec3 = (x = 0,y = 0,z = 0) => ({x, y, z});
const vecs = {
	assign(vec, x, y, z) {
		vec.x = x;
		vec.y = y;
		vec.z = z;
		return vec;
	},
	randSpherical(vec, dist) {  // dist from origin
		const theta = Math.random(0, Math.PI);
        const phi = Math.random(0, Math.TAU);
		vec.x = dist * Math.cos(phi) * Math.sin(theta);
		vec.y = dist * Math.sin(phi) * Math.sin(theta);
		vec.z = dist * Math.cos(theta);
	},
};
const G = 6.67e-11; // in SI
const mSun = 2e30;
const kpc = 3e19;
const Gyr = 3.15e16;
const Galt = G * (mSun * (Gyr ** 2)) / (kpc ** 3);
const dt = 0.01;
const particleCount = 100;
const boxSize = 30;
const particleMassTotal = 1e11;  // approx
const hue = {min: 240, max: 300}; // interpolated from min (most distant) to max (closest) z
                                  // Only when drawFast is false;
const radius = {min: 1, max: 20};
const hostArgs = [1e11, 20, "#F00", 1, 1];  // arguments used to create host particle
const satArgs = [1e10, 10, "#00F", 1, 0.5]; // ditto
const particleSmooth = 0.1; 

var width = innerWidth | 0;  // bitwise OR 0 converts to int32 (signed 32 bit integer)
var height = innerHeight | 0;
var info = document.getElementById("info");
//const canvas = document.getElementById("sim")
//canvas.width = width;
//canvas.height = height;
//const ctx = canvas.getContext('2d');
const particles = [];

var globalTime;
var pause = false;
var drawFast = false;
var maxDist = 0;

const keyboard = {
	keys: {  // named key codes. See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code for names
		Space() { pause = !pause },
		Enter() { drawfast = !drawFast },
	},
	event(e) {
		if (keyboard.keys[e.code]) {
			keyboard.keys[e.code]();
		}
	}
}
addEventListener("keyup", keyboard.event);
focus(); // to focus Code Review's snippet keyboard input


function Particle(m = 1e6, r = 2, c = "black", flag = 0, smooth = 0.1) {
    this.m = m;
    this.color = c;
    this.radius = r;
    this.pos = Vec3();
    this.f = Vec3();  // Gravity applys force. No need to convert to acceleration in gravity function many time
	                  // convert force to accel in evolve onlyonce per particle
    this.vel = Vec3();
    this.flag = 0;
    this.smooth2 = (this.smooth = smooth) ** 2; 
}
Particle.prototype = {
	drawFast() {
		ctx.moveTo(this.pos.x + this.radius, this.pos.y);
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.TAU);
	},
	draw() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.TAU);
		ctx.fill();		
	},
};


createSystem();





function createSystem(n = particleCount) { // n must be > 0
	var i = 0;
	const host = new Particle(...hostArgs);
	const sat = new Particle(...satArgs);
	particles.push(host);
	particles.push(sat);

	host.vel.y = -(sat.m / host.m) * sat.vel.y;
	
	while (i++ < n) {
		const particle = new Particle(
			particleMassTotal / n, 	// mass
			Math.rand(radius.min, radius.max),
			undefined,    					// default color
			0,   					// flag
			particleSmooth 		// smooth
		);
		particles.push(particle);
		vecs.randSpherical(particle.pos, particle.radius);
		vecs.randSpherical(particle.vel, (Galt * 1e11 / particle.radius) ** 0.5);
	}
}


function gravity(p1, p2){ // calculating and update the force on a pair of particles
	const dx = p2.pos.x - p1.pos.x; 
	const dy = p2.pos.y - p1.pos.y;
	const dz = p2.pos.z - p1.pos.z;
	const r2 = dx * dx + dy * dy + dz * dz + p1.smooth2 + p2.smooth2;
	if(r2 > Number.EPSILON) {
    	const nf = Galt / (r2 ** 0.5 * r2); // normalising Force to distance between particles
        p1.f.x = -(p1.f.x = dx * nf);
    	p1.f.y = -(p1.f.y = dy * nf);
        p1.f.z = -(p1.f.z = dz * nf);
	} else {
        p1.f.x = 0;
    	p1.f.y = 0;
        p1.f.z = 0;
	    
	    
	}
}
function updateParticles(ps) {
	var i, j;
    for (i = 0; i < particles.length; i++) {
		const particle = particles[i];
		//if (particle.flag === 1) {
			for (j = i + 1; j < particles.length; j++) {
				gravity(particle, particles[j]);
			}
		//}		
	}
}

function draw() {
	var i = 0;
	
	particles[i++].draw();
	particles[i++].draw();
	if (drawFast) {
		ctx.fillStyle = "#000";
		ctx.beginPath();
		while (i < particles.length) { particles[i++].drawFast() }
		ctx.fill();
	} else {
		while (i < particles.length) { 			
			const p = particles[i++];
			p.color = "hsl(" + Math.lerp(p.pos.z / (boxSize * 2) + 0.5, hue.min, hue.max) % 360 + ",100%,50%)";
			p.draw();
		}		
	}
}

function evolve() {
	for (const {pos, f, vel, m}  of particles) {
		const nm = m * dt / 2; // normalised force, mass, delta time
		pos.x += (vel.x += f.x * nm) * dt;
		pos.y += (vel.y += f.y * nm) * dt;
		pos.z += (vel.z += f.z * nm) * dt;
		maxDist = Math.max(maxDist, pos.y, pos.y)
	}
	updateParticles(); // finds new forces
	
	for (const {f, vel, m}  of particles) {
		const nm = m * dt / 2; 
		vel.x += f.x * nm;
		vel.y += f.y * nm;
		vel.z += f.z * nm;
	}
}

function view() {  // scales to fit boxSize to canvas. Origin set to canvas center
    const size = Math.max(boxSize, maxDist) * 2;
    const scale = Math.min(canvas.width / size, canvas.height / size);
log(scale)
    ctx.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);
}

function update(time) {
	if(globalTime) { 
    	const fps = 1000 / (time - globalTime);
    	if (info) {
    	    info.textContent = " fps = " + Math.round(fps) + (pause ? " Paused" : "") + " Mode: " + (drawFast ? " fast" : " standard");
    	} else {
    	    log.clear();
    	    log(" fps = " + Math.round(fps) + (pause ? " Paused" : "") + " Mode: " + (drawFast ? " fast" : " standard"));
    	}
	}
	globalTime = time

    if(! pause) {
        
        evolve();
        ctx.setTransform(1,0,0,1,0,0); // Default transform (identity)
        ctx.clearRect(0, 0, width, height);    
        view();
        draw();
    } 

	if(!mouse.button) {
        requestAnimationFrame(update);
	} else {
	    log("Stopped");
	}
}







/*END*/
/* Alias and abrevations used, actual content depends on context
 p, par         parent element, node, backward branch, array, set, map...
 arr            itterable array or like
 s, sib, sibs   siblings, sibling, child, children
 props          object containing key value pairs representing properties
 cb             callback function
 name           String used to identify named and or namable entity/s
 el, els        A DOM element or elements
 ref, refs      reference of any type.
 
*/

// Use $(name, props) creates element by tag name assigning shalow properties returning new element
//     $$(par, ...sibs) appends sibling to parent, if sibling is marked with an action the action is performed
//                      for the parent 
// For more infor query the core API. Eg ?type="examples"&contains="geeQry"

Math.TAU = Math.PI * 2;
Math.PI90 = Math.PI / 2;
Math.DEG = Math.PI / 180;
Math.mod = (v, div = 1) => (v % div + div) % div;
Math.clamp = (v, min = 0, max = 1) => v < min ? min : v > max ? max : v;
Math.rand = n => Math.random() * n;
Math.randI = n => Math.random() * n | 0; 



const assign = Object.assign;
const create = Object.create;
const freeze = Object.freeze;
const entries = Object.entries;
const isArr = Array.isArray;
const now = Date.now;
const tick = Performance.now;
const doc = document;
const head = doc.head;
const define = (obj, desc) => Object.defineProperties(obj, desc);


const U = undefined;
define(String.prototype, {
    like: { value(str) { return this === str || this.trim().toLowerCase() === str.trim().toLowerCase() } }
});
define(Array.prototype, {
    first: { value() { return this[0] } },
    last: { value() { return this[this.length - 1] } },
});
const rId = () => Math.random().toFixed(16).slice(2);  
const UId = assign(()=>UId.id++,{id:1000}); 
const isStr = item => typeof item === "string";
const is = {
    str(item) { return typeof item === "string" },
    obj(item) { return typeof item === "object" && !is.arr(item) && item !== null },
    arr(item) { return isArr(item) },
    num(item) { return !isNaN(item) },
    fnc(item) { return typeof item === "function" },
};
const int = val => Math.trunc(Number(val));
const int32 = val => Number(val) | 0;
const notObj = val => typeof val !== "object" && val !== null;
const eachOf = (arr, cb, i = 0) => { for(const item of arr) { if (cb(item, i) === false) { break } i++ } return i }
const Of = (arr, cb) => { for(const item of (isArr(arr) ? arr : entries(arr))) { cb(item) } return arr }
const setOf = (size, cb = i => i, arr = []) => {var i = 0; while(i < size) { arr.push(cb(i++, size)) } return arr }
const flat = (obj, arr = []) => (Of(obj,pair => arr.push(...pair)), arr);
const flatStr = (obj, join = "", arr = []) => (Of(obj,pair => arr.push(pair.join(join))), arr);
const remap = (arr, cb) => {var i = 0; for(const item of arr) { arr[i++] = cb(...item) } return arr }
const camel2CSS = name => name.replace(/[A-Z]/g, str => "-" + str).toLowerCase();
const CSS2Camel = name => name.replace(/-([A-Z])/g, () => "$1");


const indent = (str, dent = 0, dentOut = "{", dentIn = "}") => {
    const dented = [];
    const lines = str.split("\n");
    for(const line of lines ){
        dented.push(("".padStart(dent * 4," ")) + line);
        for(const c of line) {
            if(dentOut.includes(c)) {dent += 1}
            else if(dentIn.includes(c)) {
                dent -= 1;
                dented[dented.length - 1] = dented[dented.length - 1].slice(4);
            
            }
        }
        if(dent < 0) { dent = 0 }
    }
    return dented.join("\n");
}




const registerShadow = (name, init, extend) => {
    const shadow = (el, mode = "closed") => el.attachShadow({mode});
    class API extends extend { constructor() { super(); init(this, shadow(this)) } }
    customElements.define(name, API);
};


// import {jsUtils} from "../../core/web/scripts/geeQry/jsUtils,jsm";
// jsUtils();

const [$, $$] = (() => {
    const CSSRulePrefix = " .#";
    const $ = (tag, props = {}) => assign(doc.createElement(tag), props);
    const $$ = (par, ...sibs) => sibs.reduce((p, s) => ((s.$ ? s.action(p) : p.appendChild(s)), p), par);
    const act = $.$ = cb => freeze({$: true, action: cb});
    
    $.before = (el, ref = null) => act(p => p.insertBefor(el, ref));
    $.replace = (el, ref) => act(p => ref ? p.replaceChild(el, ref) : p.removeChild(el));
    $.event = (name, cb) => act(p => p.addEventListener(name, cb));
    $.shadow = (name, cb) => act(ref => registerShadow(name, cb, ref));
    $.rule = (name, rules, join = ";") => act(p => p.insertRule(name + "{" + flatStr(rules, ":").join(join) + "}"));
    $.data = props => act(p => Of(props, ([name, val]) => p.dataset[name] = val));
    $.style = props => act(p => Of(props, ([name, val]) => p.style[name] = val));
    $.Q = (qry, par = doc) => par.querySelector(qry);
    $.Qa = (qry, par = doc) => [...par.querySelectorAll(qry)];
    $.qry = (qry, par = doc) => par.querySelector(qry);
    $.qryAll = (qry, par = doc) => [...par.querySelectorAll(qry)];
    
    const CSSSelecterPrefix = name => " .#".includes(name[0])
    const ruleAct = (name, rules) => act(p => p.insertRule(name + "{" + rules.join(";") + "}"));

    $.rules = CSSRules => {
        debugger
        const res = [], cas = [], read = ""; // cas for cascade
        Of(CSSRules, ([name, ]) => {
            cas.push([name, name, CSSRules]);
            const rules = [], at = name[0] === "@";
            let next = 0;
            while (cas.length) {
                const [name, key, obj] = cas.shift();
                const rule = obj[key];
                at ? next = rules.length : rules.length = 0;
                Of(rule, ([key, value]) => {
                    if (notObj(value)) { rules.push(camel2CSS(key) + ":" + value) }
                    else { 
                        if (at) { cas.push([key  , key, rule]) }
                        else{ cas.push([name + (CSSSelecterPrefix(key) ? "" : ">") + key, key, rule]) }
                    }
                        
                });
                if (rules.length) {
                    if (at) {
                        let i = next, str = "", delim =  name + "{";
                        while (i < rules.length) {
                            str += delim + rules[i++];
                            delim = ";"
                        }
                        rules.length = next;
                        rules.push(str + "}");
                    } else { res.push(ruleAct(name, [...rules])) }
                }
            }
            if (at && rules.length) { res.push(ruleAct(name, [...rules])) }
        });
        return res;
    }
    delete $.$;
    return Of([$, $$], freeze);
})();


const box = (t, r, b, l, bx = {}) => 
    isStr(t) ? (
        box[t] ? box[t](bx) : bx
    ):(
        (t !== U ? bx.top    = t : U),
        (r !== U ? bx.right  = t : U),
        (b !== U ? bx.bottom = t : U),
        (l !== U ? bx.left   = t : U),
        bx
    )
        
box.fill = bx => box(0, 0, 0, 0, bx);

const tagName = "ui-slider-" + rId();
    


    
    
const pageStyle = $("style");
$$(head, pageStyle);

$$(pageStyle.sheet, ...$.rules({ 

    ".ui": {
        position : "absolute",
        top: "0px",
        left: "0px",
        ".slider": { display : "flex", },        
        div: { div: {  backgroundColor:"#000", } }
    },
    "@keyframes slidein": {
      from: {
        marginLeft: "100%",
        width: "300%",
      },
      to: {
        marginLeft: "0%",
        width: "100%",
      }
    }
    
}));

return;

$$(canvas.parentNode, 
    $$(
        $(tagName, {
            textContent:"bugger",
            width: 100,
            height: 20,
            className: "slider",
        }),
        $.style({
            position: "absolute",
            width: "200px",
            height: "20px",
        }),
        $.data({
            min: 0,
            max: 100,
            step: 1,
            value: 100,
            edit: true,
            
        }),
        $.event("change", () => log("test"))
   )
    
);
   
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
;(()=>{

    const eventDef = {bubbles: true, composed: true};
    const uiShadow = $("style");
    $$(head, uiShadow);
    
    $$(uiShadow.sheet, 
        $.CSSRule(".sliderEdit",{
            position : "absolute",
            right: "0px"
        }),
    );
    

    const events = {
        change: new Event("change", eventDef),
    };
    const bx = box("fill");
    Of(bx, ([k,v]) => bx[k] = v + "px")

    function init(el, root) {
        const bar = $$(
            $("span"), 
            $.style({
                backgroundColor: "black",
                position: "absolute",
                ...bx,
                
            })
        )
        
        const label = $("span");
        const min = el.dataset.min;
        const max = el.dataset.max;
        const step = el.dataset.step;
        const value = el.dataset.value;

        var nodes;        
        if (el.dataset.edit === "true") {
            const val = $("input",{className: "sliderEdit", value:100, type: "number", min, max, step});
            nodes = $$(bar, val, label);
        } else {
            nodes = $$(bar, label);
        }

        var test;
        $$(
            root, 
            nodes
        );
        log("Init complete for " + tagName);
        
    }
    

    $$(HTMLElement, $.shadow(tagName, init));

})()


































function findPropertiesByName(name, obj, path, showPathsChecked = false) {
    const checked = new WeakSet();
    const found = [];
    const unenumarated = ["__proto__", "prototype"];
    const isCheckable = (key, value) => 
        !checked.has(value) &&
        value !== null && 
        !Array.isArray(value) && 
        (typeof value === "object" || typeof value === "function") &&
        true;
        
    const check = (obj, path = "") => {
        var enums;
        try { 
            enums = Object.entries(obj);  // can throw Illegal invocation
        } catch(e) {
            try {  // assumes typeError Illegal invocation
                enums = Object.keys(obj).map(key => [key, obj[key]]);  
            } catch(e) {
                enums = Object.keys(obj).map(key => [key, ""]);  // ignore value
            }
        }
        const entries = [...enums, ...unenumarated.map(name => [name, obj[name]]).filter(pair => pair[1] !== undefined)];
        for(const [key, value] of entries) {
            if (key === name) { found.push(path + "." + key) }
            if (isCheckable(key, value) === true) {
                checked.add(value);
                check(value, path + "." + key);
            }
            console.log(value)
            showPathsChecked && log(path + "." + key)
        }
    }
    check(obj, path);
    if (found.length > 0) {
        log("Found " + found.length + " paths named  `" + name + "'");
        log(found);
        
        
    } else {
        
        log("Property search complete. Property name not found");
    }
}      




































/*END*/
const Scales = (()=>{
    const names = "A#BC#D#EF#G#A#BC#D#EF#G";  // starts at 4th A
    const middleCOffset = 3;
    const middleC = 54;
    const octiveBase = 4;          // Octive of A
    const norm = note => (note % 12 + 12) % 12;
    const str2Note = str => {
        const octStr = str.replace(/[ABCDEFG#b]/gi,"");
        const octive = octStr === "" || isNaN(octStr) ? octiveBase : Number(octStr);
        var idx = names.indexOf(str[0].toUpperCase());
        if(str.length > 1) {
            let i = 1;
            while(i < str.length) {
                if(str[1] === "#") { idx ++; }
                if(str[1] === "b") { idx += 11; }
                i++;
            }
        }
        return norm(idx) + middleCOffset + octive * 12;
    }
    const note2Str = note => {
        var oct = ((note - middleCOffset) / 12) | 0;
        note = norm(note + 12 - middleCOffset) ;
        return (names[note] === "#" ? names[note-1] + "#" : names[note]) + (oct !== octiveBase ? oct : "");
    };
    const str2Scale = notes => notes.split(",").map(str => norm(str2Note(str) - middleC));
    const scale2Str = scale => scale.map(note => note2Str(note)).join(",")
    const scales = Object.freeze({
        diatonic: Object.freeze(str2Scale("C,D,E,F,G,A")),
        minDiatonic: Object.freeze(str2Scale("C,D,D#,F,G#,A")),
        chromatic: Object.freeze([0,1,2,3,4,5,6,7,8,9,10,11]),
        minPentatonic: Object.freeze(str2Scale("C,Eb,F,G,Bb")),
        pentatonic: Object.freeze(str2Scale("C,D,E,G,A")),
        minBlues: Object.freeze(str2Scale("C,Eb,F,Ab,Bb")),
        majBlues: Object.freeze(str2Scale("C,D,F,G,A")),
    });
        

    function scale(from, scaleSrc) {
        var scale;
        if (typeof scaleSrc === "string") {
             scale = scales[scaleSrc] ? [...scales[scaleSrc]] : str2Scale(scaleSrc);
        } else { scale = [...scaleSrc] }
        if (typeof from === "string") { from = str2Note(from) }
        const len = scale.length;
        
        const API = Object.freeze({
            toString() {
                return scale.map(note => note2Str(note + from)).join(",");
            },
            desending() { return (scale = scale.map((n,i) => scale[(len - i)%len] - (i?12:0)), API) },
            transpose(val) { return (from += val,API) },
            get root() { return from },

            
            
        });
        return API;
    }
    
    
    const API = Object.freeze({
        str2Note,
        note2Str,
        str2Scale,
        scale2Str,
        octiveOfNote(note) { return (note / 12) | 0 },
        scales,
        scale,
        
        
        
    });
    return API;
    
})();

log(Scales.str2Note("C"))
log(Scales.note2Str(55))
log(Scales.scale("C",Scales.scales.pentatonic))
log(Scales.scale("C",Scales.scales.diatonic))
log(Scales.scale("C",Scales.scales.diatonic).desending())
log(Scales.scale("C",Scales.scales.diatonic).transpose(5))

 
/*END*/
const units = {
    element: {
    },
    surface: {
        
        
    },
    shape: {
        
        
    },
    mass: {
        air: 0.02, 
        rock: 2,   
        water: 1,  
    },
    gravity: 1, // pixel per tick squared
    define: {
        element(name, mass, cCof) {
            return units.element[name] = {name, mass, cCof};
        },
        surface(name, sfCof, afCof) {
            return units.surface[name] = {name, sfCof, afCof};
        },
        shape(name, volumeFunc, mR) {
            return units.shape[name] = {name, volumeFunc, mR};
        }
    }
}
units.define.element("ball", units.mass.rock * 0.8, 0.9);
units.define.surface("pollished", 0.1, 0.2);
units.define.shape("ball", r => 3/4 * Math.PI * r * r * r, 0.7);

const Ball = {
    p: {x:0, y:0},   // current position
    v: {x:0, y:0},   // current velocity
    r: 1,            // radius
    a: 0,            // angle
    aV: 0,           // angular velocity
    mR: 0.7,         // mass radius
    m: 1,            // mass
    sf: 0.5,         // surface friction coeficient
    af: 0.5,         // air friction coeficient
    c: 0.5,          // collision coeficient
}
const createBall = (element, surface, shape) => {
    return {
        ...Ball,
        m: element.mass,
        c: element.cCof,
        sf: surface.sfCof,
        af: surface.afCof,
        r: shape.volumeFunc,
        mR:shape.mR,
    };
}
const initBall = (ball, x,y,r,a) => {
    ball.p.x = x;
    ball.p.y = y;
    ball.a = a;
    ball.m = ball.m * ball.r(r) * Math.sin(ball.mR);
    ball.r = r;
    return ball;
}
const drawBall = (b) => {
    ctx.moveTo(b.p.x, b.p.y);
    ctx.arc(b.p.x, b.p.y, b.r, b.a, b.a+ Math.PI * 2);
}
const updateBall = (b) =>{
    b.p.x += b.v.x;
    b.p.y += b.v.y;
    b.a += b.aV;
    
    
    
}

const b = createBall(units.element.ball, units.surface.pollished, units.shape.ball)
initBall(b, canvas.width / 2, canvas.height * 0.2, canvas.height * 0.07, 0);
b.aV = 0.1;


mainLoop()


function mainLoop() {
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    updateBall(b)
    ctx.lineWidth = 2;
    ctx.strokeStye = "black";
    ctx.beginPath();
    drawBall(b);
    ctx.stroke();
    
    if (mouse.button === 0) {
        requestAnimationFrame(mainLoop);
    } else { log("done") }
}    
    



/*END*/
const displayGroup = (idx, f,l,val, why) => {
    var str = "".padStart(f * 2 - 1,". ");
    str += "<".padEnd((l - f + 1) * 2,  val+" ") + ">";
    log(str.padEnd(displayGroup.displayWidth * 2, ". ") + ": Grp[" + (""+idx).padStart(3," ") + "] = [" + f + "," + l + "," + val+"]; // "+ why )
}

displayGroup.legend = () => { log("".padStart(displayGroup.displayWidth * 2,"0 1 2 3 4 5 6 7 8 9 A B C D E F ")); }
displayGroup.curentTotals = (groups, why) => {
    
    const vals = "".padStart(displayGroup.displayWidth * 2,"= ").split("");
    for(const group of groups) {
        vals[group.f * 2 - 1] = "|";
        vals[group.l * 2 + 1] = "|";
        let i = group.l - group.f + 1;
        while (i-- > 0) { vals[(i + group.f) * 2] = group.ignored ? group.val : "#" }
        
    }
    log(vals.join("") + "; // "+ why);
}
function findMaxColumnSum(columns, rowValues) { //AKA n and array
    var max = -Infinity;
    const updateGroup = (val, f, l, group) => {
        max = Math.max(max, group.val += val), 
        group.f = f;
        group.l = l;
        return group
    };
    const groups = [];
    const maxForRow = [];
    var maxMax = 0
    var stopAt = 20;
    var ignoreBelow = 0;
    var groupCount = 0;
    const addGroup = (f, l, val, why) => { // first last idx and value of row
        //if(stopAt-- < 0) {return}
        var idx = 0, tail = 0
        while(idx < groups.length) {
            
            const g = groups[idx];
            if(g.val >= ignoreBelow) {
                if(g.ignored) {log("Was ignored"); g.ignored = false }
                if(!(l < g.f || f > g.l)) { // there is overlap
                    const right = g.l, left = g.f, existingVal = g.val;
                    if(f <= g.f  && l >= g.l ) { // new group totaly overlaps existing
                        //displayGroup("?",f, l, val, (why ? why : "New group") + " total overlaps grp: " + idx);
                        updateGroup(val, g.f, g.l, g);
                        //displayGroup(idx,g.f, g.l, g.val, "Overlaps existing val increased");                    
                        if(f < g.f) { addGroup(f, g.f - 1, val, "left of existing") }
                        if(l > g.l) { addGroup(g.l + 1, l, val, "right of existing") }
             
                    } else if(f < g.f && l <= g.l) { // new group overlaps and left of existing
                       // displayGroup("?",f, l, val, (why ? why : "New group") + " overlaps left grp: " + idx);
    
                        updateGroup(val, g.f, l, g);
                        //displayGroup(idx, g.f, g.l, g.val, "Overlaping left");
                        addGroup(f, g.f - 1, val, "Isolating new group non overlap left")
                        if(l < right) { addGroup(l + 1, right, existingVal, "Isolated non overlap at right") }
         
                       // return;
                    } else if(f >= g.f && l > g.l) { // new group overlaps and right of existing
                       // displayGroup("?",f, l, val, (why ? why : "New group") + " overlaps right grp: " + idx);
    
                        updateGroup(val, f, g.l, g);
                        //displayGroup(idx,g.f, g.l, g.val, "Overlaps right");
                        addGroup(g.l + 1, l, val, "Isolating new group non overlap right")
                        if(f > left) { addGroup(left, f - 1, existingVal, "Isolating non overlap left of existing") }
                  
                       // return;
                    } else {
                    // new group is inside existing
                    
                       // displayGroup("?",f, l, val, (why ? why : "New group") + " inside grp: " + idx);
                        updateGroup(val, f, l, g);
                       // displayGroup(idx,g.f, g.l, g.val, "New group inside");
                      if(f > left) { addGroup(left, f - 1, existingVal, "Isolating non overlap right of existing") }
                      if(l < right) { addGroup(l + 1, right, existingVal, "Isolating non overlap left of existing") }
      
                    }
                    return;
                }
            } else {
                g.ignored = true;
                
            }
            idx ++;
        }
        // no overlap found so group is unique and add it to the list of calculated group values
        groups.push(updateGroup(0,f,l, {f, l, val}))
        //displayGroup(groups.length - 1,f, l, val, "New unquie group. "+(why?why:""));
    }
    
    
    displayGroup.displayWidth = columns+1;  // to help visulize
    
    var idx = 0;
    var pMax = 0;
    for(const row of rowValues) {
        var [f, l, val] = row;
        pMax += val;
        maxForRow.push(pMax);
        if (f < columns) { // only if within the columns range
            l = l > columns ? columns : l; // clip right side of group if needed
          //  displayGroup(idx,f, l, val,"Max: " + pMax + " Row "+idx);
        } else {
          //  displayGroup(idx,f, l, val, "Row "+idx + " skipped");
        }
        idx ++;
    }        
    maxMax = pMax
   // log("Max max " + pMax);
   displayGroup.legend(groups);
    var idx = 0;
    for(const row of rowValues) {
        var [f, l, val] = row;
        if (f < columns) { // only if within the columns range
            l = l > columns ? columns : l; // clip right side of group if needed
            //displayGroup.legend(groups);
            ignoreBelow = max - (maxMax - maxForRow[idx]);
            addGroup(f,l,val); 
            const remainging = maxMax - maxForRow[idx]
           // displayGroup.curentTotals(groups, "Row "+idx+" processed " + remainging + " avali");
        } else {
          //  displayGroup.curentTotals(groups, "Row  Skipped");
        }
        idx ++;
    }

    log("The answer is "+ max)    
        
}
function arrayManipulation(n, arr) {
  var res = [];
  var max = Number.MIN_VALUE;

  for (var i = 0; i < arr.length; i++) {
    const a = arr[i];
    for (var j = a[0]; j <= a[1]; j++) {
        res[j] = (res[j] || 0) + a[2];

        max = Math.max(max, res[j]);
        
    }
   // log(str.padEnd(n * 2+ 3,". ")+": "+i)
  }
  return max;
}

function arrayManipulation(n, arr) {
  arr = arr.sort((a, b) => a[0] < b[0] ? -1 : a[0] === b[0] ? 0 : 1);
  var max = Number.MIN_VALUE;

  for (var i = 0; i < arr.length; i++) {
    var sum = arr[i][2];
    for (var j = i + 1; j < arr.length; j++) {
      if (arr[j][0] < arr[i][1])
        sum += arr[j][2];
      else
        break;
    }
    max = Math.max(sum, max);
  }

  return max;
}





function findMaxColumnSumA(columns, rowValues) { //AKA n and array
    var max = 0;
    const groups = [];
    const updateGroup = (val, first, last, group) => {
        max = Math.max(max, group.val += val), 
        group.first = first;
        group.last = last;
        return group;
    }
    const addGroup = (first, last, val) => {
        for (const g of groups) {
            if (!(last < g.first || first > g.last)) {
                const right = g.last, left = g.first, existingVal = g.val;
                if (first <= g.first && last >= g.last) {
                    updateGroup(val, g.first, g.last, g);
                    if (first < g.first) { addGroup(first, g.first - 1, val) }
                    if (last > g.last) { addGroup(g.last + 1, last, val) }
                } else if (first < g.first && last <= g.last) { 
                    updateGroup(val, g.first, last, g);
                    addGroup(first, g.first - 1, val);
                    if (last < right) { addGroup(last + 1, right, existingVal) }
                } else if (first >= g.first && last > g.last) {
                    updateGroup(val, first, g.last, g);
                    addGroup(g.last + 1, last, val);
                    if (first > left) { addGroup(left, first - 1, existingVal) }
                } else {    
                    updateGroup(val, first, last, g);
                    if (first > left) { addGroup(left, first - 1, existingVal) }
                    if (last < right) { addGroup(last + 1, right, existingVal) }
                }
                return; 
            }
        }
        groups.push(updateGroup(0, first, last, {first, last, val}));
    }
    var left,right;
    const addGroup1 = (first, last, val) => {
        if(left) {
            if(last < left.first) {
                left = left.left = {first, last, val};
                max = Math.max(val, max)
                return;
            }
            if(first === left.first) {
                if(last < left.last) {
                    const g = {first, last, val: left.val + val}
                    max = Math.max(left.val + val, max)
                    left.first = last + 1
                    left.left = left;
                    g.right = left;
                    left = g;
                } else if(last === left.last) {
                    left.val += val
                    max = Math.max(left.val, max)
                }
                
            }
            if(first >= left.first && first <= left.last) {
        } else {
            left = {first, last, val}
        }
    }
    
    for (const row of rowValues) { addGroup(...row) }
    return max;
}

const data = [];
for(var t = 0; t < 10; t ++ ){
    var s = 10000;//$randI(10, 10000);
    var g = 5;//$randI(10, 9);
    var r = 10;
    const test = [];
    for(var i = 0; i < g; i ++) {
        const left = $randI(s-2);
        const right = $randI(s-2);
        const v = $randI(1 ,  r);
        test.push([Math.min(left, right),Math.max(left, right),v]);
    }
    var res = arrayManipulation(s, test);
    var res1 = findMaxColumnSumA(s, test);
    if(res1 !== res) {
        log(res1+" : "+res)
    
        //throw "bugger"
        
    }
    data.push([s,test]);
}
return
var ia = 0, ib = 0;
const testA = () => arrayManipulation(...data[(ia++) % data.length])
const testB = () => findMaxColumnSumA(...data[(ib++) % data.length])
setTimeout(() => performanceTester(tester), 0);
const tester = {
    name: "JS performance tester",
    testCount: 10,
    testCycles: 100, // number of testing cycles
    prepCycles : 30, // Number of cycles to run befor testing. 
    testPerCycle : 10,
    timedCycleTrim : 1,
    timedCycles : 100,  // number of cycles per test
    timerResolution : 0.2, // this is the minimum resolution of the timer in ms
    testInterval : 10, // Time between test cycles.
    resolutionError : false, 
    args:[],

    functions: [{
            name: "An",
            func: testA,
        },{
            name: "BM",
            func: testB,
        }
    ],
};






/*END*/









var requestedBytes = 1024*1024*150; // 10MB
const fileSystem = {
    
    memory: 0,
    fs : null,
    start(megabytes) {
        return new Promise((accessGranted, error) => {
            navigator.webkitPersistentStorage.requestQuota(
                megabytes * 1024 * 1024, 
                granted => {  
                    fileSystem.memory = granted;
                    webkitRequestFileSystem(
                        PERSISTENT, 
                        granted, 
                        fs => accessGranted(fileSystem.init(fs)), 
                        error
                    );
                },
                e => error(fileSystem.error(e))
            );        
        });
    },
    init(fs) { fileSystem.fs = fs; return fileSystem  },
    //error({code}) {
    error(e) {
        return "File system error!\n"+e.message;
        const errors = {
            [FileError.QUOTA_EXCEEDED_ERR]:"File quota error",
            [FileError.NOT_FOUND_ERR]: "File not found",
            [FileError.SECURITY_ERR]:"File security error!",
            [FileError.INVALID_MODIFICATION_ERR]:"Invalid modification?",
            [FileError.INVALID_STATE_ERR]:"file system state error",
        };
        if (!code || errors[code] === undefined) {
            if (fileSystem.fs === null) { return "File system is not avalible!" }
            if (fileSystem.memory === 0) { return "File system has not been allocated storage!" }
            return "Unknown error!"
        }
        return errors[code];
    },    
    writeFile(filename, content) {
        return new Promise((writeComplete, error) => {
            if(fileSystem.fs) {
                fileSystem.fs.root.getFile(
                    filename, 
                    {create: true}, 
                    file => {
                        file.createWriter(writer => {
                            writer.onwriteend = writeComplete;
                            writer.onerror = error;
                            writer.write(new Blob([content], {type: 'text/plain'}));
                        }, e => error(fileSystem.error(e)));

                    }, 
                    e => error(fileSystem.error(e))
                );  
            } else {
                error("FileSystem is not avalibale");
            }
        });
    },
    readFile(filename) {
        return new Promise((readComplete, error) => {
            if (fileSystem.fs) {
                fileSystem.fs.root.getFile(
                    filename, 
                    {}, 
                    entry => {
                        entry.file(file => {
                                log.obj(file, true, 4)
                                const reader = new FileReader();
                                reader.readAsText(file);
                                reader.onloadend = () => readComplete(reader.result);
                            },
                            e => error(fileSystem.error(e))
                        );
                    },
                    e => error(fileSystem.error(e))
                )
                    
            } else {
                error("FileSystem is not avalibale");
            }
        });
    },
}

 /* fs.root.getFile('log.txt', {}, function(fileEntry) {
    fileEntry.file(function(file) {
       var reader = new FileReader();

       reader.onloadend = function(e) {
         var txtArea = document.createElement('textarea');
         txtArea.value = this.result;
         document.body.appendChild(txtArea);
       };

       reader.readAsText(file);
    }, errorHandler);

  }, errorHandler);*/

/*fileSystem.start(1)
    .then(fs => fs.writeFile("TestFile.text", "Hello world of files!"))
    .then(() => log("File write complete"))
    .catch(e => log.error(e))*/
    
fileSystem.start(1)
    .then(fs => fs.readFile("TestFile.txt"))
    .then(text => log(text))
    .catch(e => log.error(e))   

//  fs.root.getFile('log.txt', {create: true, exclusive: true}, function(fileEntry) {


 // }, errorHandler);

//}

navigator.webkitPersistentStorage.requestQuota (
    requestedBytes, function(grantedBytes) {  
        fileSystem.memory = grantedBytes;
        requestFileSystem(PERSISTENT, grantedBytes, fileSystem.init, fileSystem.errorHandler);

    }, fileSystem.errorHandle)

/*END*/   
 /*  <div  id="crystalMain">
  <h2>Target: <span id="targetDisplay"></span></h2>
  <h2>Total: <span id="totalDisplay"></span></h2>
  <h3>Level: <span id="levelDisplay"></span></h3>

    <div id="crystals">
    <img src=""   alt="Blue" title="Click to add crystals value"   class="img"  data-crystal = 0>
    <img src=""  alt="Green" title="Click to add crystals value"  class="img"  data-crystal = 1>
    <img src=""    alt="Red" title="Click to add crystals value"    class="img"  data-crystal = 2>
    <img src="" alt="Yellow" title="Click to add crystals value" class="img"  data-crystal = 3>
    </div>

  <h4>Score: <span id="scoreDisplay"></span></h4>

</div>*/
//log.obj(canvas)
   const p = canvasContainer;
   p.innerHTML = "";
   if(!document.querySelector("#targetDisplay")){
        $$(p,
            [$("div",{id:"targetDisplay", textContent:"Target: "}),
            $("div",{id:"totalDisplay", textContent:"Total: "}),
            $("div",{id:"levelDisplay", textContent:"Level: "}),
            $("div",{id:"scoreDisplay", textContent:"Score: "}),
            $$($("div",{id:"crystals"}),
                [$("div",{id:"red", textContent:"red",style:{cursor:"pointer"}}),
                $("div",{id:"green", textContent:"green",style:{cursor:"pointer"}}),
                $("div",{id:"blue", textContent:"blue",style:{cursor:"pointer"}}),
                $("div",{id:"yellow", textContent:"yellow",style:{cursor:"pointer"}})]
                )
            
            ])
   
   }
   
    const gems = [];
    
    var levMax, levMin, levelMoves, perfectMoves,maxMoves, target, total, score, prevScore, moves, inPlay;


    const targetDisplay = $("#targetDisplay")
    const totalDisplay= $("#totalDisplay")
    const levelDisplay= $("#levelDisplay")
    const scoreDisplay= $("#scoreDisplay")
  //  const crystals= $("#crystals")


    crystals.addEventListener("click", crystalClick);
    
    
    init();
    
    
    
   
    function rand() { return Math.random() * (levMax - levMin) + levMin | 0 }
    function randGem() { return gems[Math.random() * gems.length | 0] }
    
    
    function minMaxMoves(type = "min") {
      const sorted = [...(new Set(gems)).values()].sort((a, b) => b - a);
      if (type === "max") { sorted.reverse() }
      const used = new Array(sorted.length).fill(0);
      used[0] = 1;
      var idx = 0;
      var targ = 0;
      var moves = 0;
      var testing = 0;
       log(" gems  : "+sorted);
       log(" targ  : "+target);
      while(testing++ < 100) {
         
          targ = used.reduce((s, v, i) => s += sorted[i] * v, 0);
          if(targ === target) {
            log("Moves " + type + " : "+ used + " : "+ used.reduce((s, v, i) => (log(""+v+"*"+sorted[i]+"="+(v * sorted[i])),s += v), 0));
            return used.reduce((s, v) => s += v, 0);
          }
          if(targ > target) {
              used[idx] -= 1;
              idx = (idx + 1) % 4

          }
          if(used[idx] > levelMoves) { used[idx] = 0; used[idx+1] += 1}
          
              used[idx] += 1;
          
          
      
           log("Try " + type + " : "+ used)

      }
      
      
      if (testing > 900) { throw new Error("THERE is a BUG! could not calculate min move!!!") }
      log("WTF")
    }
    
    function init() {
      levMax = 9;
      levMin = 4;
      levelMoves = 10;
      score = 0;    
      
      levelStart();
    
    }
    
    function levelStart() {
        inPlay = true;
        var i = levelMoves - 4;
        const pick = $setOf(levMax - levMin, i => i+ levMin)
        gems.length = 0;
        
        gems.push($randPick(pick),$randPick(pick),$randPick(pick),$randPick(pick));

        moves = 0;
        target = total = 0;
        var str = gems[0]+"+"+gems[1]+"+"+gems[2]+"+"+gems[3]
        target = gems[0]+gems[1]+gems[2]+gems[3];
        while (i--) { var t = randGem(); target += t; str += "+"+t} 
        log(str)

        perfectMoves = minMaxMoves();
      //  maxMoves = minMaxMoves("max");
        console.log();
        scoreDisplay.textContent = score;      
        targetDisplay.textContent = target
        levelDisplay.textContent = " "+(levelMoves-9) +" in Moves: "+levelMoves+" min: "+ perfectMoves+" max: "+maxMoves;
        totalDisplay.textContent = total;  
    }




    function logic(crystalIdx) {
        if(inPlay){
            total += gems[crystalIdx];

            totalDisplay.textContent = total;    
            if (total === target) {


                scoring = "moves";
                prevScore = score;
                inPlay = false;
                levelUp(moves, 1);

            } else if (total > target) {
                scoreDisplay.textContent = score + " Failed!!";
                inPlay = false;
                setTimeout(levelStart, 1400);
            }
        }
    }
    
    function crystalClick(event) {
      if (event.target.dataset.crystal !== undefined) {
        moves ++;
        logic(event.target.dataset.crystal)
      }
    }
    var scoring = "moves";
    function levelUp(points, scoreAdd) {
        if(points !== 0) {
          if(points < 0) {
              points ++;
          } else {
              points --;
          
          }
          score += scoreAdd;
          scoreDisplay.textContent = score + " " + points + scoring;
          setTimeout(levelUp, 500, points, scoreAdd);
          return;
        } 
        if( scoring === "bonus +1"){
          if(moves === perfectMoves){
              scoring = "perfect bonus +"+((levelMoves - moves) * (score -prevScore));
              levelUp(1, (levelMoves - moves) * (score -prevScore));
              return;
          }
        }
        if( scoring === "moves +1"){
          if(moves < levelMoves) {
             scoring = "bonus +1";
             levelUp(levelMoves - moves, 2);
             return;
          } else if(moves > levelMoves) {
             scoring = "move penalty -1" ;
             levelUp(moves - levelMoves, -1);
             return;
          }
        }
       scoreDisplay.textContent = score + " level up";
       setTimeout(levelStart, 1400);
       levMax ++;
       levMin += levMax % 4 === 0 ? 1 : 0;
       levelMoves ++;
         
      
    
    }
 
/*

The are two types of programming, One in which the coder follows a strict design, and the outher where the coder is both the designer and programmer.

Your code is the latter. You are the designer of the finnal app and thus the code and the design will be reviewed. You can have the best code ever written yet inplementing bad design and it can be the wrost app ever.

Major design problems 

Not all targets are solvable.

You pick a random target and 4 random gem values.  If the target is Odd and all the gem values are even then there is no way to solve the problem.

This type of unsolveable puzzel quickly stops people using the app.

There is no discovery

Games requier a hook, a reason to keep playing. In your app each game is the same as the next. It does not get harder





*/



/*END*/
const code = `
    API.updateWidget = false;
    if (!API.active) { 
        return 
        
    }
    var val, dif;
    const con = 10, dif;
    value229429 = spr229428.y + value229426;
    spr229420.y = value229429;
    spr229420.key.update();
    API.updateWidget = spr229420.selected ? true : API.updateWidget;
    value229422 = (spr229421.y - spr229420.y) + -128;
    if (value229423 === undefined) { value229423 = 0 }
    value229423 += (0) + 0.112
    value229427 = 0;
    if (value229426 === undefined) { value229426 = 0 }
    value229426 += (value229423 + value229427) + 0.001
    if (value229422 < 0) {
        value229424 = (value229423) * -0.876 + 0;
    } else {
       value229424 = null;
    );


   API.updateWidget = false;
    if (!API.active) { return }
    var val, dif;
    val = spr235894.a;
    if (delay235797 === null) { delay235797 = value235797 = val }
    delay235797 = val;
    val = value235811 + delay235797 + value235897;
    if (delay235800 === undefined) { 
    delay235800 = value235800 = val 
        
    }
    delay235800 = val;
    spr235799.a = delay235800 < 0 ? 0 : delay235800 > 1 ? 1 : delay235800;
    val = delay235800;
    if (delay235804 === undefined) { delay235804 = value235804 = val }
    

    if (delay235814 === undefined) { 
        delay235814 = value235814 = val 
        
    }
    delay235814 = val;
    spr235813.a = delay235814 < 0 ? 0 : delay235814 > 1 ? 1 : delay235814;
    val = delay235814;
    
    delay235800 = (10 + 20) - (100 * (30 + 4));
        value229426 += (value229423 + value229427) + 0.001

`.split("\n");
//    assignment: /(?<prop>[a-z]+[0-9]+(\.[a-z]+)+(?= = ))|(?<var>[a-z]+[0-9]+(?= = ))|(?<localVar>[a-z]+(?= = ))/gi,

const exp = {

    allVars: /(([a-z]+[0-9]+(\.[a-z]+)+)|([a-z]+(\.[a-z]+)+)|([a-z]+[0-9]+)|([a-z]+))\(*/gi,
    literals: /(\b-{0,1}[0-9]+\.*[0-9]*)|undefined|true|false/g,
    math: / ([\+\-\*]) /g,
    assignment: / (=|\+=) /g,
   // tokens: /(\(*)(?<![0-9a-zA-Z])(while|else|if|var|undefined|true|false|return)(\)*)(?![0-9a-zA-Z])/g,
    tokens: /^(while|else|if|var|const|let|undefined|true|false|return)$/,
    logic: /(===|\!==|\&\&|\|\||\!)/g,
    func: /(([a-z]+[0-9]+(\.[a-z]+)+)|([a-z]+(\.[a-z]+)+)|([a-z]+[0-9]+)|([a-z]+))\(/gi,
    statements:/\b(else if|while|for|do|else|if)\b/g,
    declarations:/\b(var|const|let)\b/g,
    group: /\(|\)/g,
    comma: /(,)/g
    
    
}
const sourceTrim = line => line.trim().replace(/\/\/.*|\/\*.*\*\/|\/\*.*|.*\*\//g,"")                

const TYPES = ((i=1)=>({
    variable: i++,
    literal: i++,
    math: i++,
    assignment: i++,
    logic: i++,
    group: i++,
    groupNode: i++,
    statement: i++,
    declaration: i++,
    comma: i++,
    line: {
        empty: i++,
        statement: i++,
        assignment: i++,
        declaration: i++,
        unknown: i++,
    },
    toName(type) {
        if(TYPES.toName.indexed === undefined) {
            TYPES.toName.indexed = ["",...Object.keys(TYPES)];
            TYPES.toName.indexed.pop();
            TYPES.toName.indexed.pop();
            TYPES.toName.indexed.push(...Object.keys(TYPES.line).map(name => "line." + name));
        }
        if(TYPES.toName.indexed[type]) { return TYPES.toName.indexed[type] }
        return "";
    }
    
}))();
const lineBreakDown = (lineRaw) => {
    var lineBreakDown;
    log("===================================================")      
    line = sourceTrim(lineRaw);
    if(line.length !== 0){
    
        const cVar = (f) => ({v: f[0], name: f[0],id: f[0].replace(/[a-z]+/gi,""), idx: f.index, type: TYPES.variable});
        const literal = (f) => ({v: f[0], value: f[0], idx: f.index, type: TYPES.literal})
        const math = (f) => ({v: f[1], operation: f[1], idx: f.index, type: TYPES.math})
        const assignment = (f) => ({v: f[1], operation: f[1], idx: f.index, type: TYPES.assignment})
        const group = (f) => ({v: f[0], value: f[0], idx: f.index, type: TYPES.group})
        const logic = (f) => ({v: f[1], value: f[1], idx: f.index, type: TYPES.logic})
        const statement = (f) => ({v: f[0], value: f[0], idx: f.index, type: TYPES.statement})
        const declaration = (f) => ({v: f[0], value: f[0], idx: f.index, type: TYPES.declaration})
        const comma = (f) => ({v: f[0], value: f[0], idx: f.index, type: TYPES.comma})
        const isToken = (f) => exp.tokens.test(f[0]);
        const isFunction = (f) => exp.func.test(f[0]);
        //const canUse = (f) => (isNotToken(f) && isNotFunction(f));
        const canUse = (f) => !(isToken(f) || isFunction(f));
        const found =(f, test, as) => (test && test(f) || !test) && items.push(as(f));
        var f, items = [];
        while((f = exp.allVars.exec(line)) !== null) { found(f, canUse, cVar)}
        while((f = exp.literals.exec(line)) !== null) { found(f, canUse, literal) }
        while((f = exp.math.exec(line)) !== null) { found(f, canUse, math) }
        while((f = exp.assignment.exec(line)) !== null) { found(f, canUse, assignment) }
        while((f = exp.group.exec(line)) !== null) { found(f, undefined, group) }
        while((f = exp.logic.exec(line)) !== null) { found(f, undefined, logic) }
        while((f = exp.statements.exec(line)) !== null) { found(f, undefined, statement) }
        while((f = exp.declarations.exec(line)) !== null) { found(f, undefined, declaration) }
        while((f = exp.comma.exec(line)) !== null) { found(f, undefined, comma) }
        items.sort((a,b) => a.idx - b.idx)
      
        var ass = []
        if(items[0] && items[0].type === TYPES.variable) {
            if(items[1] && items[1].type === TYPES.assignment) {
                if(items[1].v.length > 1) {
                    var aa = assignment(Object.assign([,"="],{index:items[1].idx}));
                    const open = group(Object.assign(["("],{index:items[1].idx}));
                    const close = group(Object.assign([")"],{index:items[1].idx}));
                    items[1].v = items[1].v.replace(/=/g,"");
                    items[1].operation = items[1].operation.replace(/=/g,"");
                    items[1].type = TYPES.math;
                    items.splice(1,0,aa,items[0]);
                    items.splice(4,0,open);
                    items.push(close);
                    var right = [...items], a;
                    ass.push(a = [right.shift().v,right.shift().v,right.map(i=>i.v).join(" ")])
                   // log("Assigning " + a[0] + " the vals (" + a[2]+")")
                    
                    
                }else {
                    var right = [...items], a;
                    ass.push(a = [right.shift().v,right.shift().v,right.map(i=>i.v).join(" ")])
                  //  log("Assigning " + a[0] + " the vals (" + a[2]+")")
                }
            }
        }
        
        const showGroup = (group) => {
            var str = "(",s = "";
            for(const it of group.items) {
                str += s + it.v;
                s = " ";
            }
            str+=")";
            log("Groups: "+str);
            const show = [];
            for(const it of group.items) {
                if(it.type === TYPES.groupNode) {
                    show.push(it)
                }
            }
            for(const g of show) {
                showGroup(g)
            }
        }
        var groups = [];
        var cg;
        for(const it of items) {
            if(it.type === TYPES.group) {
                if(it.value === "(") {
                    const grp = {
                        v: "(##)",
                        open: it,
                        items: [],
                        parent: cg,
                        close: null,
                        type: TYPES.groupNode,
                        toString() {
                            var str = "G(",s = "";
                            for(const it of this.items) {
                                str += s + it.v;
                                s = " ";
                            }
                            str+=")\n";
                            for(const it of this.items) {
                                if(it.type === TYPES.groupNode) {
                                    str += it;
                                }
                            }                            
                            return str;
                        }
                    }
                    if(cg) {
                        cg.items.push(grp);
                    } else {
                        groups.push(grp);
                    }
                    cg = grp;
                } else if(it.value === ")") {
                    if(cg){
                        cg.close = it;
                        cg = cg.parent;
                    }
                }
            } else if(cg) {
                cg.items.push(it);
            }
        }
        if(groups) {
            for(const g of groups){
                //showGroup(g);
            }
        }
        
        
        
    
        
        lineBreakDown = {
            type: (() => {
                if(items[0]){
                    if(items[0].type === TYPES.statement) { return TYPES.line.statement };
                    if(items[0].type === TYPES.declaration) { return TYPES.line.declaration };
                    if(items[1]) {
                        if(items[0].type === TYPES.variable && 
                            items[1].type === TYPES.assignment) { return TYPES.line.assignment };
                    }
                }
                return TYPES.line.unknown; 
                
            })(),
            groups,
            items,
            indent: (()=>{var i = 0; while(i < lineRaw.length && lineRaw[i++] === " "); return i < lineRaw.length ? i : -1})(),
            raw: lineRaw,
            toString() {
                var str = "", s = "".padStart(this.indent," ");
                for(const v of this.items) {
                    str += s + v.v;
                    s = " ";
                }
                return str;
            },
            groupsToString() {
                var str = "";
                if(this.groups) {
                    for(const g of this.groups){
                        str += g;
                    }
                }  
                return str;
                
            },
        }
    }else{
        lineBreakDown = {
            type: TYPES.line.empty,
            items: [],
            raw: lineRaw,
            toString() { return "" },
            groupsToString() { return "" },
        }
        
    }

    //og(lineRaw.trim())
    log(TYPES.toName(lineBreakDown.type))
    log(lineBreakDown.groupsToString())
    log(lineRaw + "")
    log(lineBreakDown + "")
    lineBreakDown.items.forEach(item => log(TYPES.toName(item.type)+": " + item.v))
      
}
log.clear();
var i = 0;
while(i < code.length){
    lineBreakDown(code[i++])
}





/*END*/    
    
var W = canvas.width;
var H = canvas.height;


var c1 = 0;
var c2 = 0;
function flood(land, dir, col, from) {
    var ws = W / (land.length * 2 + 2);

    
    
    const drawLand = (x,y) => {
        while(y > 0){
            ctx.fillRect(off + x * ws, H - y * ws, ws-1,  ws - 1);
            y --;
        }
    }
    const drawSlime = (x,y, d) => {
        ctx.fillRect(off + x * ws, H - y * ws, ws-1, d * ws);
        ctx.fillStyle = "#000"
        ctx.fillText(""+d,off + x * ws, H - (y + 1) * ws);
        ctx.fillText(""+waterVol,off + x * ws, H - (y + 2) * ws);
    }    
    var off = 0;
    const LEN = land.length;
;
    var i = 0;
    var peak = 0, peakPos;
    var waterVol = 0;
    var totalWaterVol = 0;
    while(i < LEN) {
        c1 ++;
        const lev = land[i];
        ctx.fillStyle = "#0008"   

        drawLand(i,lev)        
        if(lev < peak) {
            ctx.fillStyle = col;
            waterVol += peak - lev;
            drawSlime(i,peak, peak - lev)
            //land[i] = peak;
         
        }
        if (lev >= peak) {
            peak = lev;
            peakPos = i;
            totalWaterVol += waterVol;
            
          //  log(waterVol)
            waterVol = 0;
                          ctx.fillStyle = "#944"   
            drawLand(peakPos,peak); 
        }


        i += 1;
    }

    var off = W / 2;
    const LEFT = peakPos - 1;
    var i = LEN - 1;
    var peak = 0;
    waterVol = 0;
    while(i > LEFT) {
        c1 ++;
        const lev = land[i];
        ctx.fillStyle = "#0008"   

        drawLand(i,lev)        
        if(lev < peak) {
            ctx.fillStyle = col;
            waterVol += peak - lev;
            drawSlime(i,peak, peak - lev)
            
            //land[i] = peak;
         
        }
        if (lev >= peak) {
            peak = lev;
            peakPos = i;
            totalWaterVol += waterVol;
            
            //log(waterVol)
            waterVol = 0;
                          ctx.fillStyle = "#944"   
            drawLand(peakPos,peak); 
        }


        i -= 1;
    }    

        
        return totalWaterVol

    
}


function flood(elevations) {
    var peakIdx, i = 0, peak = -Infinity, vol = 0, totalVol = 0;
    const depth = (i, elevation = elevations[i]) => {
        if (elevation >= peak) {
            peak = elevation;
            peakIdx = i;
            totalVol += vol;
            vol = 0;
        } else { vol += peak - elevation }
    }
    while (i < elevations.length) { depth(i++) }
    const LEFT = peakIdx;
    vol = 0;
    peak = -Infinity;
    while (i-- >= LEFT) { depth(i) }    
    return totalVol;
}


function trap(height) {
  let res = 0;
  const LEN = height.length;
  for (let i = 1; i < LEN - 1; i++) {
      c2 ++
    let maxLeft = -Infinity, maxRight = -Infinity;
    for (let j = i; j >= 0; j--) {
        c2 ++
      maxLeft = Math.max(maxLeft, height[j]);
    }
    for (let j = i; j < LEN; j++) {
        c2 ++
      maxRight = Math.max(maxRight, height[j]);
    }
    res += Math.min(maxLeft, maxRight) - height[i];
  }
  return res;
};
ctx.font = "20px arial"
function create(len) {
    var lev = Math.random() * len * 0.3 | 0;
    const a = [];
    while(len --) {
        a.push(lev);
        const step = Math.random() ** 2 * len * 0.3;
        lev += Math.random() < 0.5 ? -step : step;
       // lev = lev < 0 ? 0 : lev;
        
    }
    return a;
}
ctx.clear()
function test(count = 10) {
for(var i = 0; i < 1000; i++){
    const land = create(0);//Math.random() * 100 + 1 | 0)
    var f1 = flood(land,"right","#494", land.length - 1);
    var f2 = trap(land);
    
//    log(f1 + " : " + f2)
    //log(c1 + " : " + c2)
    if(f1.toFixed(4) !== f2.toFixed(4) ) { log("------------------------------------------"); throw "fgghfhffh" }
}
log("count")
if(count) { setTimeout(test,100,count - 1) }
else {log("Passed")}
}
test()



//flood([0,1,0,2,1,0,1,3,2,1,2,1,3,4,6,9,10,4,4,4,3,2,2,2,3,3,4,5,7,4,1],"right","#494" )
//flood([0,1,0,2,1,0,1,3,2,1,2,1,3,4,6,9,10,4,4,4,3,2,2,2,3,3,4,5,7,4,1],"left","#0908" )



/*END*/

function toTitleCase(name) {
    var str = "", i = 1, c;
    name = name.trim();
    while(i < name.length) {
        str += ((c = name[i++]) >= "A" && c <= "Z" ? " " : "") + c;
    }
    return name[0].toUpperCase() + str;
}




log(toTitleCase("myTestSample"))
log(toTitleCase("MyTestSample"))







function findStartingIndex1(T, pattern) {
  let S = T;
  const res = [];
  while(true) {
    const i = S.indexOf(pattern);
    if (i === -1) { return res; }

    S = S.substring(i + 1);
    res.push(i ? i + 1 : i);
  }
  return res;
}
function findStartingIndex2(test, pat) {
    const res = [], reg = new RegExp(pat, "g");
    const collect = (str, i) => (res[res.length] = i, str);
    test.replace(reg, collect);
    return res;
}
function findStartingIndex(test, pat) {
    const lenB = pat.length,  res = [];
    var j, i = test.length - lenB + 1;
    while (i-- > 0) {
        j = lenB;
        while (j-- && test[i + j] === pat[j]);
        !~j && res.push(i);
    }
    return res;
}
function findStartingIndex5(test, pat) {
    var idx = 0;
    const res = [];
    while(~(idx = test.indexOf(pat, idx))) { 
        res[res.length] = idx++
    }
    return res
    
}

function findStartingIndex4(txt, pat) {
    const res = [], find = i => ~(i = txt.indexOf(pat, i)) ?  (res.push(i++), find(i)) : res;
    return find();

}
function findStartingIndexF(h, n, acc = [], currentIndex = 0) {
  const index = h.indexOf(n);
  if (index < 0) {
    return acc;
  } else {

    const newHaystack = h.slice(index + 1);
    return findStartingIndexF(newHaystack, n, [...acc, index + currentIndex], currentIndex + index + 1);
  }
}
log("A"+findStartingIndex1("abr","abr")+"");
log("B"+findStartingIndex("abr","abr")+"");
log("C"+findStartingIndex2("abr","abr")+"");
log("D"+findStartingIndex4("abr","abr")+"");
log("E"+findStartingIndex5("abr","abr")+"");
log("F"+findStartingIndexF("abr","abr")+"");

var ss = "abbssbbdkjajgadlaklsdljhadskjakdaslslkhasdjasjhaabbssbbdkjajgadlaklsdljhadskjakdaslslkhasdjasjhaabbssbbdkjajgadlaklsdljhadskjakdaslslkhasdjasjhaabbssbbdkjajgadlaklsdljhadskjakdaslslkhasdjasjhaabbssbbdkjajgadlaklsdljhadskjakdaslslkhasdjasjha";
//const test = [ss+ss+ss+ss+ss+ss+ss+ss+ss+ss+ss+ss+ss,"jakdasls"]
//var ss = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const test = [ss,"hasd"]

log("A"+findStartingIndex1(...test)+"");
log("B"+findStartingIndex(...test)+"");
log("C"+findStartingIndex2(...test)+"");
log("D"+findStartingIndex4(...test)+"");
log("E"+findStartingIndex5(...test)+"");
log("F"+findStartingIndexF(...test)+"");




//return
if(canvas.results === undefined) {
    canvas.chart = null;
    canvas.results = {
         type: 'bar',   
         data: {
            labels:[],   
            datasets:[],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            responsiveAnimationDuration : 100,
            tooltips: {
                enabled : false,
            },
             title: {
                display: true,
                text: 'Custom Chart Title'
            },           
            scales: {
                fontColor: 'black',
                
                yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Time ms',
						fontColor: 'black',
					},
					ticks: {
						min: 0.00,
					}                    
                }]
            },
            legend: {
                labels: {
                    fontColor: 'black',
                    boxWidth:12,
                    position: "bottom",
                }
            }
        }     
    }
}

canvas.style.background = "white"; // for charts       

var colors = "#748109,#708b02,#7fa703,#81a902,#aa507e,#8e9b6a,#9ca73a,#8b8e83,#ae7a6c,#e25805,#8bc700,#9ea651,#be854b,#9353b0,#bc9c13,#98b73b,#c19c03,#a67490,#8670b1,#5141e2,#a76d95,#7a42d0,#e66403,#b8777b,#323def,#2317f9,#ce9205,#7280ba,#a15fac,#c69736,#ab8489,#864dcc,#bb9063,#c29252,#df8105,#a6779f,#e2674a,#d88240,#c08177,#ad937f,#da9108,#d47a5e,#acc705,#bf9c5c,#c2b202,#d67862,#ce6883,#c8886f,#d2a227,#ca60ab,#c7809a,#ddb000,#b45ec9,#d761a4,#db77a2,#d456bf,#cc77b6,#e06fb6,#b70dfc,#dd43d5,#e751da,#fc1df8".split(",");

function onEachDone(test, i) {
    var res = canvas.results;
    const dataset = tester.dataset ? tester.dataset : {
        data:[],
        backgroundColor: colors[( 2* canvas.results.data.datasets.length) % colors.length],
		borderColor: colors[( 2 * canvas.results.data.datasets.length) % colors.length],
		borderWidth: 1            
    };
    tester.dataset = dataset;
    canvas.results.data.labels[i] = test.name;
    dataset.data[i] = test.ms;
}

function onDone(){
    var l = canvas.results.data.datasets.length;
    tester.dataset.label = "Test "+tester.args[0].length+ "by" + tester.args[1].length;
    canvas.results.data.datasets.push(tester.dataset);
    tester.dataset = undefined;
    if (canvas.chart === null){
        canvas.results.options.title.text = tester.name;
        canvas.chart = new Chart(ctx,canvas.results) 
        
    }
   // tester.args[0] += ss;
    l++;
    var f = (Math.random() * ss.length - l * 4) | 0;
   // tester.args[1] += ss.slice(f,  f + l * 4 );
    canvas.chart.update();
    return true; // continues if true and testCount > 0
}        

setTimeout(() => performanceTester(tester), 0);
const tester = {
    name: "JS performance tester",
    testCount: 20,
    testCycles: 30, // number of testing cycles
    prepCycles : 10, // Number of cycles to run befor testing. 
    testPerCycle : 10,
    timedCycleTrim : 1,
    timedCycles : 10,  // number of cycles per test
    timerResolution : 0.2, // this is the minimum resolution of the timer in ms
    testInterval : 10, // Time between test cycles.
    resolutionError : false, 
    onEachDone: onEachDone ? onEachDone : undefined,
    onDone: onDone ? onDone : undefined,
    args:test,
    functions: [/*{
            name: "BM Simple",
            func: findStartingIndex,
        },{
            name: "BM Reg",
            func: findStartingIndex2,
        },{
            name: "BM Recursive",
            func: findStartingIndex4,
        },*/
        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },        {
            name: "While1",
            func: findStartingIndex5,
        },
        
        
        
        //{
          //  name: "OP",
          //  func: findStartingIndex1,
      //  },
      /*  {
            name: "OP_F",
            func: findStartingIndexF,
        }*/
    ],
};











/*END*/
log.clear();
log("loading")
jsonReadWriter.load(APP_ROOT_DIR + "MarksHome/GameEngine/Jan2018/DirectoryListing.json",file => {
    var ii ="\\\\"+("UglifyJS,zebra,ChipmunkPhysics,node_modules,ace-master,NodeJS,js,ThirdParty,Git,GitHub,English,codePens,CodeTester,Electron".split(",").join("|\\\\"));
    if(typeof file === "string") { log(file) } 
    else {
        log("Loaded " + file.text.length+ "bytes");
        setTimeout(()=>{
            const ignoreDir = new RegExp(ii,"")
            const fileExt = /(?<date>\d\d\/\d\d\/\d\d\d\d  \d\d:\d\d [PA]M) +(?<size>[\d,]+) (?<name>.+)\.(?<ext>.+$)/
            const dirExt = /(\d\d\/\d\d\/\d\d\d\d  \d\d:\d\d +[PA]M) +(<DIR>) +(.+$)/
            const dirPathExt = /Dir (?<path>.+$)/
            file.text = file.text.split("\r\n");
            var inDir = "";
            var ignore = true;
            file.text = file.text.filter(line => {
                if(inDir === "") {
                    if(dirPathExt.test(line)) {
                        const {path} = dirPathExt.exec(line).groups;
                        ignore = ignoreDir.test(line);
                        inDir = path;
                        return !ignore;
                    }
                    return false;
                }
                if(dirPathExt.test(line)) {
                    const {path} = dirPathExt.exec(line).groups;
                    ignore = ignoreDir.test(line);
                    inDir = path;
                    return !ignore;
                } else if(ignore) { return false }
                else if(fileExt.test(line)) {
                    return true;
                }
                return false;
            });
            var count =  file.text.length
            var idx = 0;
            const getDirectory = (...path) => {
                var r = root;
                path.shift();
                while(path.length){
                    const rr = r.dirs[path.shift()];
                    if(rr === undefined){
                        return r
                    }
                    r = rr;
                }
                return r;
            }
            const createDir = line => {
                const path = dirPathExt.exec(line).groups.path.split("\\");
                const name = path.pop();
                path.shift();
                return {
                    path,
                    toString() {
                        return [...this.path, this.name].join("/").replace(markLocalHost.rootName, markLocalHost.url);
                    },
                    name,
                    dirs: {},
                    parent: null,
                    files: Object.assign([],{
                        toString() {
                            var str = "", s = "";
                            for(const f of this) {
                                str += s + f.name;
                                s = ", ";
                            }
                            return str;
                        }
                        
                    }),
                };
            }
            const createFile = line => {
                var {date, size, name, ext} = fileExt.exec(line).groups;
                size = Number(size.replace(/,/g,""));
                return { date, size, name, type : ext, dir};
            }
            var dir, root;
            const files = [];
            while(count--) {
                const line = file.text[idx++];
                if(dirPathExt.test(line)) {
                    const d = createDir(line);
                    if(!root) { 
                        root = d; 
                    } else { 
                        dir = getDirectory(...d.path)
                        dir.dirs[d.name] = d;
                        d.parent = dir;
                    }
                    dir = d;
                }else if(dirExt.test(line)) {
                }else if(fileExt.test(line)) {
                    const f = createFile(line);
                    dir.files.push(f);
                    files.push(f);
                }else {
                }
                
            }
            root.parent = root;
            log.obj(root,true,1);
            window.markLocalHost = {
                root,
                files,
                url: APP_ROOT_DIR + "MarksHome",
                rootName: root.name,
                current: root,
                getDirectory(...path){
                    var r = this.root;
                    path[0] === "" && path.shift();
                    path[0] === this.root.name && path.shift();
                    while(path.length){
                        const rr = r.dirs[path.shift()];
                        if(rr === undefined){
                            return r
                        }
                        r = rr;
                    }
                    return r;
                },                
                cd(path = "") {
                    if (path.trim() === "") {
                        
                    } else if (path === ".") {
                        this.current = this.current.parent;
                    } else if(path === "..") {
                        this.current = this.root;
                    } else if(this.current.dirs[path]) {
                        this.current = this.current.dirs[path];
                    } else {
                        
                        this.current = this.getDirectory(...path.split(/\/|\\/));
                    }
                    log("cd " + path)
                    log([...this.current.path, this.current.name].join("/").replace(this.rootName, this.url));
                    //return this.current;
                },
                dir(){
                    log(this.current.toString())
                    for(const d of Object.values(this.current.dirs)) {
                        log(d.name);
                    }
                    
                },
                
                
            };
            window.cd = window.markLocalHost.cd;
            window.dir = window.markLocalHost.dir;
            
        },0);
        
        
    }
    
    
})

/*END*/
function MinStack() {
    const node = (val, next = top) => {
        const node = {val, next};
        if (next) { next.prev = node }
        return node;
    }
    
    const lowest = from => {
               log("L: "+from.val)
        if(from.lower) {
            return lowest(from.lower);
        }
        return from;
    }
    const higher = from => {
       log("H: "+from.val)
        if (from.higher) {
            return lowest(from.higher);
        } 
        //if (from.above) {
        //    return higher(from.above);
       // }
        
        
        
    }
    
    const insert = val => {
        var n = center, added, order, searching = true, prev;
        if(val < min.val) {
            added = node(val)
            min.lower = added;
            added.above = min;
            min.down = added;
            added.up = min;
            min = added;
        } else if(val > max.val) {
            added = node(val)
            max.higher = added;
            added.above = max;
            max.up = added;
            added.down = max;
            max = added;            
            
            
        }else{
            while(searching) {
    
                
                if(val < n.val) {
                    if(!n.lower) {
                        n.lower = added = node(val);
                        added.above = n;
                               log("Added: " + val + " lower: " + added.above.val)
                               
                        if(added.above.down) {
                            added.above.down.up = added;
                           // 
                            
                        }
                        if(added.above.above){
                            if(added.above.above.val < val){
                                //added.above.above.up = added;
                            }else {
                         //       log("" + added.above.above.val + " is above " + added.above.val);
                          //      const l = lowest(added.above.above);
                          //      log("Lowest " + l.val)
                           //     if(l.lower){
                            //        log("Lowest " + lowest(added.above.above).val)
                                    
                       //         }
                            }
                            //added.above.above.ordered =
                            
                        }
                        added.up = added.above;
                        added.up.down = added; 
                        
                        break;
                    }
                    n = n.lower;
                } else if(val > n.val) {
                    if(!n.higher) {
                        n.higher = added = node(val);
                        added.above = n;
                         log("Added: " + val + " higher: " + added.above.val)
                      //  if(added.above.up) {   
                            /* added.up = added.above.up;
                             added.above.up = added
                             added.above.down = added;
                             added.down = added.above*/
                            
                       // }else{
                            added.up = added.above;
                            added.above.up = added;
                            added.down = added.above
                       log.obj(added.above,true,5)
                        //}
                        break;
                    }
                    n = n.higher;
                } else {
                    while(n.same) { n = n.same }
                    n.same = added = node(val);
                    break;
                }
    
            }
        }
       // if(order){
       //     added.ordered = order;
       // }
        return top = added;
    }
    const toStringTop = (node = top) => node.val + (node.next ? "," + toStringTop(node.next) : "");
    const toStringMin = (node = min) => {
        return node.val + (node.above ? "," + toStringTop(node.above) : "");
    }
    
    var top, min, max,center, test = [];
    
    
    
    const API = {
        toStringTop,
        toStringMin,
        toString(order = "top") {
            if(top) {
                return order === "top" ? toStringTop() : toStringMin(min);
            }
            return "Empty";
            
        },
        log(levels = 2) {
            log.obj(test,true, levels)
        },
        logUp() {
            var n = min;
            var str = "U: " + n.val;
            var c = 0;
            
            while(c++ < test.length && n.up && n.up.val !== n.val) {n = n.up; str += "" + n.val}
            log(str)
            
           // test.forEach(n => log("" + n.val + " > " + (n.up ? n.up.val : "?")))
            API.logDown()
        },
    
        logDown() {
            var n = max;
            var str = "D: " + n.val;
            var c = 0;
            
            while(c++ < test.length && n.down && n.down.val !== n.val) {n = n.down; str += "" + n.val}
            log(str)
            
           //test.forEach(n => log("" + n.val + " < " + (n.down ? n.down.val : "?")))
        },        
        push(val) {
            if (top) {
                insert(val); 
            } else {
                center = max =  min = top = node(val);
            }
            test.push(top);
                
                
        },
        pop() {
            if (top) {
                const val = top.val;                
                if(top === min) {
                    if (min.same) {
                        min.same = min.same.same;
                    } else {
                        min = top.above;
                        if (min) { min.lower = undefined }
                    }
                }                
                top = top.next;
                if (top ) { top.prev = undefined  }
                return val;
            }
        },
        min() {
            if (min) {
                const val = min.val;
                if(top === min) {
                    top = top.next;
                    top.prev = undefined;                  
                } else {
                    min.prev.next = min.next;
                    min.next.prev = min.prev;                                        
                }
                if(min.same) {
                    min.same = min.same.smae;
                }else if(min.above){
                    min = min.above;
                    if(min){
                        min.lower = undefined;
                    }
                }
                
            }
            
            
        }
    }
    return API;
}
function test() {
    const test = $setOf(10, i=>i);
    const randTest = $randShuffle(test);
    const s = new MinStack();
    log(s)
    const a = [...randTest]
    while(a.length) {
        s.push(a.pop());
        s.logUp();
       // log("From Top: "+s);
       // log("From Min: "+s.toString("min"));
    }
   // s.log(5)
  //  log("A: "+randTest+"");
   // log("From Top: "+s);
   // log("From Min: "+s.toString("min"));
    var v, str = "";
    while((v = s.pop()) !== undefined){
        str += v;
    }
   // log(str)
  //  log(s)
}
test();




/*END*/
const test1 = [
    "teste.mail+alex@leetcode.com",
    "testemail+alex+@leetcode.com",
    "testemailalex+@leetcode.com",
    "testemailalex@leetcode.com",
    "testemailbobcathy@leetcode.com",
    "testemaildavid@lee.tcode.com"
];
const test = ["test.email+alex@leetcode.com","test.e.mail+bob.cathy@leetcode.com","testemail+david@lee.tcode.com"];

var checkForward = emails => {
  const validMails = new Set();
  for (const mail of emails) {
    let [local, domain] = mail.split('@');
    local = local.replace(/\+(.*)$/, '').replace(/\./g, '');
    const key = `${local}@${domain}`;
    if (!validMails.has(key)) { validMails.add(key); }
  }
  return validMails.size;
};


const checkForward1 = (resend, email) => {

    const s  = email.split("@");
    const clean = s[0].replace(/\./g,"");
    const i = clean.indexOf("+");
    if(i > -1) {
        resend.add(clean.substring(0,i) + "@" + s[1]);
    }else if(clean.length !== s[0].length){
        resend.add(clean + "@" + s[1]);
    }
    return resend;

}
const checkForward1A = (send, email) => {

    const ii = email.indexOf("@");
    const clean = email.substring(0,ii).replace(/\./g,"");
    const i = clean.indexOf("+");
    if(i > -1) {
        send.add(clean.substring(0,i) + email.substring(ii));
    }else if(clean.length !== ii){
        send.add(clean  + email.substring(ii));
    }else  {
        send.add(email);
    }
    return send;

}

function validateEmails1(emails) {
    const resend = emails.reduce(checkForward1, new Set() )
    return resend.size;
}
function validateEmails1A(emails) {
    return emails.reduce( (send, email) => {
        const ii = email.indexOf("@");
        const clean = email.substring(0,ii).replace(/\./g,"");
        const i = clean.indexOf("+");
        if(i > -1) {
            send.add(clean.substring(0,i) + email.substring(ii));
        }else if(clean.length !== ii){
            send.add(clean  + email.substring(ii));
        }else  {
            send.add(email);
        }
        return send;
    
    }, new Set()).size;
}
const getUniqueEmailKey = email => {
    const [local, domain] = email.split('@')
    return local
        .split('+')[0] // Take everything before +
        .split('.').join('') // Remove dots
        + '@' + domain
}

const numUniqueEmails = emails => new Set(emails.map(getUniqueEmailKey)).size



log(checkForward(test1));

log(validateEmails1A(test1));
log(numUniqueEmails(test1));





performanceTester({
    cycles : 100, 
    prepCycles : 30,
    testPerCycle : 10,
    timedCycleTrim : 1,
    timedCycles : 100, 
    timerResolution : 0.2, 
    testInterval : 10, 
    resolutionError : false, 
    args:[test1],

    functions: [{
            name: "OP",
            func: checkForward,
        },{
            name: "BM1A",
            func: validateEmails1A,
        },{
            name: "A",
            func: numUniqueEmails,
        }
    ],
});
/*END*/

var xx1,xx2





const WallCount = 16;
var st = ctx.canvas.width / WallCount ;
var h = ctx.canvas.height;
const drawWater = (x1,x2,y) => {
        ctx.fillStyle="#fff3";

    ctx.fillRect(x1* st,h - y,(x2-x1)*st, y);
    
    
}
    
function biggest(points){
    var max = 0, x = 0, len = points.length;
    var dams = new Map();
    while(x <  len){
        const y = points[x];
        if (dams.has(y)) {
            const starts = dams.get(y);
            const size = (x - starts) * y;
            drawWater(starts,x,y)
            if(size > max){
                max = size;
                xx1 = starts;
                xx2 = x;
            }
        } else {
         dams.set(y,[x])

            
        }
        x++;
    }
    return max;

}
var maxArea2 = height => {
  let l = max = 0;
  let r = height.length - 1;
  while (l < r) {
    const area = Math.min(height[l], height[r]) * (r - l);
    if (height[l] > height[r]) {
      r--;      
    } else {
      l++;
    }
    max = Math.max(max, area);
  }
  return max;
};
function biggest1(points){
    var max = 0, x = 0, len = points.length;
    var dams = new Map();
    while(x <  len){
        const y = points[x];
        if (dams.has(y)) {
            const starts = dams.get(y);
            const size = (x - starts) * y;
            if(size > max){
                max = size;
                xx1 = starts;
                xx2 = x;
            }
        } else {
            if(y*(len-x) > max){
                dams.set(y,[x])
            }
            
        }
        x++;
    }
    return max;

}
 ctx.clear();
var p = $setOf(WallCount,i=>$randI(10) * 14);
function test(p){

    ctx.fillStyle="#000";
    var x = 0;
    var st = ctx.canvas.width / p.length ;
    var h = ctx.canvas.height;

    for(const y of p) {
        ctx.fillRect(x,h - y,1, y);
        x += st
        
    }
    ctx.fillStyle="#00F7";
    var y = p[xx1]-14;
    ctx.fillRect(xx1* st,h - y,(xx2-xx1)*st, y);
}
log(biggest(p));
test(p)
log(biggest1(p));
test(p)
log(maxArea2(p))









/*END*/

abaaefahijkamnoaqrsmtavaxyaABCDEFGHIaKLMNOPQRSTUVWXYZ1234567890
                    qrstavxyABCDEFGHIKLMNOPQRSTUVWXYZ1234567890

















const styles = {
    blockBox: {
        fillStyle: "#00000088",
        lineWidth: 4,
        strokeStyle: "#000",
        lineJoin: "round",
    },
    blockBoxMouseOver: {
        fillStyle: "#FFFC",
    },
    font: "px Arial",
    fontScale: 0.8,
    fontYOffset: 0.05,
    blockFont: {
        fillStyle: "#000",
        textAlign: "center",
        textBaseline: "middle",

    },
    blockLayout: {
        pad: 3,
    },
    mouseOver: {
        growRate: 0.1,
        shrinkRate: 0.02,
    },
    move: {
        speed: 0.1,
    },
    atPos: {
        speed: 0.1,
        fillStyle: "#F31D",
    },
    box: {
        fillStyle: "#FFFD",
        lineWidth: 4,
        strokeStyle: "#000",
        lineJoin: "round",
    },
    gameOver: {
        boxTop : 0.4,
        
        font: {
            size : 0.1,
            family: "arial"
        },
        fontStyle: {
            fillStyle: "#000",
            textAlign: "center",
            textBaseline: "middle",
        },
        
        
    }
    
    
    
};
function animBool(state, rateUp, rateDown = rateUp) {
    var value = state ? 1 : 0;
    return {
        get val() {
            if(state) {
                if(value < 1) { value += rateUp }
                if (value > 1) { value = 1 }  
            } else {
                if (value > 0) { value -= rateDown }
                if (value < 0) { value = 0 }     
            }
            return value;
        },
        on(){ state = true },
        off(){ state = false },
        get state() { return state },
        get value() { return value },
        forceOff(){
            state = false;
            value = 0;
        }
    };
    
}
    

const eCurve   = (v, p = 2) =>  v < 0 ? 0 : v > 1 ? 1 : v ** p / (v ** p + (1 - v) ** p); 

const createBlock = (value, pos) => ({
    x: pos % board.grid,
    y: pos / board.grid | 0,
    hx: pos % board.grid,  // home pos
    hy: pos / board.grid | 0,
    moving: animBool(false, styles.move.speed),
    atPos: animBool(false, styles.atPos.speed),
    size: board.blockSize,
    mouseOver: animBool(false, styles.mouseOver.growRate, styles.mouseOver.shrinkRate),
    value, 
    draw() {
        const mo = this.mouseOver.val
        const ap = this.atPos.val
        const pad = styles.blockLayout.pad * (1-eCurve(mo));
        const size = this.size;
        const sized = size - pad * 2;
        var x = this.x, y = this.y;
        if (this.moving) {
            const pos = eCurve(this.moving.val)
            x = (board.zeroBlock.x - x) * pos + x;
            y = (board.zeroBlock.y - y) * pos + y;
        }
        Object.assign(ctx, styles.blockBox);
        ctx.beginPath();
        ctx.rect(x * size + pad, y * size + pad, sized, sized);
        ctx.fill();
        if (ap > 0){
            ctx.fillStyle = styles.atPos.fillStyle;
            ctx.globalAlpha = eCurve(ap);
            ctx.fill();
        }            
        if (mo > 0){
            ctx.fillStyle = styles.blockBoxMouseOver.fillStyle;
            ctx.globalAlpha = eCurve(mo);
            ctx.fill();
        }
        ctx.globalAlpha = 1
        ctx.stroke();
        ctx.font = (size * styles.fontScale | 0) + styles.font;
        Object.assign(ctx, styles.blockFont);
        ctx.fillText((this.value + 1), (x + 0.5) * size , (y + 0.5 + styles.fontYOffset) * size);
    }, 
    update(tx, ty, ignorInput) { // t for top
        const pad = styles.blockLayout.pad;
        const size = this.size;
        const sized = size - pad * 2;
        const x = this.x, y = this.y;
        if(ignorInput) {
            this.mouseOver.off();
        } else {
            if (mouse.x > x * size + pad + tx && mouse.x < x * size + pad + sized + tx && 
                mouse.y > y * size + pad + ty && mouse.y < y * size + pad + sized + ty){
                this.mouseOver.on();
            } else {
                this.mouseOver.off();
            }
        }

        if (this.moving.state) {
            if (this.moving.value === 1) {
                var bx = board.zeroBlock.x
                var by = board.zeroBlock.y
                board.zeroBlock.x = this.x;
                board.zeroBlock.y = this.y;
                this.x = bx;
                this.y = by;
                this.moving.forceOff()
                board.checkWin();
            }
        }
    }
});
const board = {
    init(){
        board.w = canvas.width;
        board.h = canvas.height;
        board.cx = canvas.width / 2 | 0;
        board.cy = canvas.height / 2 | 0;
        board.blockSize = Math.min(board.w / board.grid, board.h / board.grid) | 0;
        board.createBlocks();
    },
    createBlocks() {
        board.blocks.length = 0;
        var i = board.grid * board.grid;
        board.zeroBlock = createBlock(0, --i);
        while (i--) {
            board.blocks.push(createBlock(i, i ))
        }
        board.moves = 0;
    },
    scramble() {
        const zb = board.zeroBlock;
        const opts = [];
        var scrambling = board.grid * board.grid * board.grid;
        var lastMoved;
        while (scrambling -- > 0) {
            opts.length = 0;
            for (const block of board.blocks) {
                if (board.nearEmpty(block) && block !== lastMoved) { opts.push(block) }
            }
            lastMoved = opts[Math.random() * opts.length | 0];
            const x = lastMoved.x, y = lastMoved.y;
            lastMoved.x = zb.x;
            lastMoved.y = zb.y;
            zb.x = x;
            zb.y = y;
        }
    },
    nearEmpty(block) {
        const zb = board.zeroBlock, b = block;
        return (b.x === zb.x && (b.y === zb.y - 1 || b.y === zb.y + 1)) || (b.y === zb.y && (b.x === zb.x - 1 || b.x === zb.x + 1));
    },
    blocks:[],
    blockSize: 0,
    grid: 2,
    checkWin() {
        board.moves += 1;
        var atPosCount = 0;
        for (const block of board.blocks) {
            if (block.hx === block.x && block.hy === block.y){
                if (!block.atPos.state) { block.atPos.on() }
                atPosCount ++;
            } else { block.atPos.off() }
        }
        if(atPosCount === board.blocks.length && game.stateName === game.stateNames.inPlay){
            game.state = game.stateNames.gameOver;
        }
    },
    update(ignoreInput = false) {
        const tx = board.cx - board.grid * board.blockSize * 0.5;
        const ty = board.cy - board.grid * board.blockSize * 0.5;
        for(const block of board.blocks) {
            block.update(tx, ty, ignoreInput);
            if (!ignoreInput) {
                if(block.mouseOver.state && mouse.button === 1 && !block.moving.state) {
                    if(board.nearEmpty(block)) {
                        block.moving.on();   
                        mouse.button = 0;
                    }
                }
            }
        }        
    },
    draw(){
        ctx.setTransform(1,0,0,1,
            board.cx - board.grid * board.blockSize  * 0.5,
            board.cy - board.grid * board.blockSize * 0.5
        );
        
        for(const block of board.blocks) {
            block.draw();
        }
    }
};


function textWidth(text,font) {
    ctx.font = (font.size * canvas.height | 0) + "px " + font.family;
    return ctx.measureText(text).width;
}

function drawText(text, font , style, y) {
    Object.assign(ctx, style);
    ctx.font = (font.size * canvas.height | 0) + "px " + font.family;
    ctx.fillText(text,0, y)
}

const titleScreens = {
    endGame() {
        board.draw();
        ctx.setTransform(1,0,0,1,canvas.width / 2, canvas.height / 2);
        const w = textWidth("Level complete", styles.gameOver.font);
        Object.assign(ctx, styles.box);
        const bt = styles.gameOver.boxTop;
        const top = -canvas.height * bt
        ctx.beginPath();
        ctx.rect(-w / 2 * 1.2, top, w * 1.2, canvas.height * 0.25);
        ctx.fill();
        ctx.stroke()
        
        drawText("Level complete", styles.gameOver.font, styles.gameOver.fontStyle, top + canvas.height * styles.gameOver.font.size * 0.7);
        drawText("Score " + board.moves, styles.gameOver.font, styles.gameOver.fontStyle, top + canvas.height * styles.gameOver.font.size * 1.8);
        
    }
    
    
    
}
const stateNames =  {
    inPlay: "inPLay",
    gameOver: "gameOver",
};
const game = {
    update(){},
    render(){},
    stateNames,
    stateName: "",
    set state(val) {
        game.states[game.stateName] && game.states[game.stateName].end();
        
        game.stateName = val;
        game.update = game.states[game.stateName].update;
        game.render = game.states[game.stateName].draw;
        game.states[game.stateName].start();
    },
    states: {
        [stateNames.inPlay]: {
            start(){
                mouse.button = 0;
                board.init()
                board.scramble();
                board.checkWin();
                board.moves = 0;
            },
            update(){
                board.update()
                
            },
            draw(){
                board.draw()
                updateFrame = true
            },
            end(){
                
                
            }
        },
        [stateNames.gameOver]: {
            start(){
                mouse.button = 0;
            },
            update(){
                board.update(true);
                if(mouse.button === 1) {
                    game.state = game.stateNames.inPlay;
                }
            },
            draw(){
                titleScreens.endGame();
                updateFrame = true
            },
            end(){
                board.grid += 1;
                
            }
            
            
            
        }
    }
    
    
    
    
}



game.state = game.stateNames.inPlay;
var updateFrame = true;
requestAnimationFrame(mainLoop);

function mainLoop(time) {
    mouse.forElement(canvas);
    if(updateFrame) {
;
        updateFrame = false;
        game.update();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,canvas.width, canvas.height);
        game.render();
        
    }
    if(mouse.button !== 2) {
        requestAnimationFrame(mainLoop);
    }else {
        log("exit");
    }
    
    
    
}



/*END*/
const rand = {
    seeded: {
        seed(seed) { seededRandom.reseed(seed|0) },
        int(min = 2, max = min + (min = 0)) { return ($seededRandom.random() % (max - min)) + min },
        float(min = 1, max = min + (min = 0)) { return  ($seededRandom.random() / $seededRandom.max) * (max - min) + min },
        sign() { return ($seededRandom.random() & 1) ? 1 : -1 },
        item(array) { return array[$seededRandom.random() % array.length] },
        pick(array) { return array.splice($seededRandom.random() % array.length,1)[0] },
        put(array,item) { return array.splice($seededRandom.random() % (array.length+1),0,item)[0] },
        shuffle(a, l = a.length) { while (l) { a.push(a.splice($seededRandom.random() % l-- | 0, 1)[0]) } return a },
    }
}
const cards = {
    suits: "hearts,diamonds,clubs,spades",
    faces: "2,3,4,5,6,7,8,9,10,J,Q,K,A",
    icon: {hearts:"♥",diamonds: "♢",clubs: "♧" ,spades: "♤"},
    values: {J: 10, Q: 10, K: 10, A: 11},
    cardBehaviour: {
        toString() { return "[" + this.face + cards.icon[this.suit] + "]" }
    },        
    deck() {
        return cards.suits.split(",")
            .map(suit => cards.faces.split(",")
                .map(face => {
                    const value = cards.values[face] ? cards.values[face] : Number(face);
                    return {face, suit, value, ace: face === "A", ...cards.cardBehaviour};
                })
            ).flat();
    },
    shuffle(cards) { return rand.seeded.shuffle(cards) },
    value(cards) {
        const values = [0];
        for (const card of cards) {
            values.forEach((value, i) => values[i] += card.value);
            if (card.ace) { values.push(...values.map(value => value - 10)) }
        }
        
        const best = values.filter(val => val <= 21).sort((a, b) => b - a);
        return best.length ? best[0] : "Bust";    
    }
}

const hand = {
    cards: null,
    reset() {
        this.cards = [];
        this.handValue = 0;
        this.hide = false;
        return this;
    },
    handValue: 0,
    addCard(card) {
        this.cards.push(card);
        return this.handValue = cards.value(this.cards);
    },
    hide: false,
    toString() {
        if(this.hide) {
            return ("").padStart(this.cards.length * 2,"[]");
        }
        return this.cards.join("") + ": " + this.handValue;
    },
    toStringBet() {
        return "Pool $" + this.pool + " Bet $" + this.bet;
    },
    betVal(amount) {
        this.bet += amount;
        this.pool -= amount;
    }
}

        
const game = {
    cards: null,
    player: {...hand},
    dealer: {...hand},    
    start() {
        this.cards = cards.shuffle([...cards.deck(), ...cards.deck(), ...cards.deck()]);
        game.player.reset();
        game.player.bet = 0;
        game.player.pool = 100;
        game.dealer.reset();
        game.state = "ready";
    },
    keys:[],
    set state(name) {
        game.currentState = game.states[name];
        if(game.currentState.start) { game.currentState.start() }
    },
    currentState: null,
    states: {
        ready:{
            start(){
                log("To start [s]");
                game.keys.length = 0;
                game.keys.push("s");
                game.player.bet = 0;
                game.player.reset();
                game.dealer.reset();                
            },
            action(key){
                log("New Game...");             
                game.player.betVal(1);
                game.player.addCard(game.cards.pop());
                game.player.addCard(game.cards.pop());
                game.dealer.addCard(game.cards.pop());
                game.dealer.addCard(game.cards.pop());

                game.state = "player";
            }
        },
        player: {
            start() {
                log("Players hand "+game.player);
                log(game.player.toStringBet());                
                log("Hit me [C], hold [h], fold [f]");
                game.keys.length = 0;
                game.keys.push("h","c","f");
            },
            c(){
                game.player.addCard(game.cards.pop());
                log(game.player);   
                if(game.player.handValue === "Bust") {
                    log("Player Busted");
                    
                    log("Dealers hand "+game.dealer);
                    if(game.dealer.handValue === "Bust") {
                        game.player.pool += game.player.bet;

                    }
                    game.player.bet = 0;                    
                    log("Players "+ game.player.toStringBet());
                    game.state = "ready";
                    
                }
            },
            f(){
                log("Player Folds");
                game.state = "ready";                
            },
            h(){
                log("Player Holds")
                log("Players hand "+ game.player);         
                game.player.holds = true;
                game.state = "bet";
            },
            
        },
        bet:{
            start() {
                log(game.player.toStringBet());
                log("Bet [1-9]" );
                game.keys.length = 0;
                game.keys.push("1","2","3","4","5","6","7","8","9");
            },
            action(key){
                log("Player bets $"+key)
                game.player.betVal( Number(key));
                log(game.player.toStringBet());
                game.state = "dealer";
                
            },            
            
        },
        dealer: {
            start() {
                game.dealer.hide = true;
                if(game.dealer.handValue < 16) {
                    
                    while(game.dealer.handValue < 16) {
                        game.dealer.addCard(game.cards.pop());
                        game.player.holds = false;
                    }
                    if(game.dealer.handValue === "Bust"){
                        game.dealer.hide = false;
                        log("Dealer busted. " + game.dealer);
                        game.player.betVal(-game.player.bet * 2);
                        game.player.bet = 0; 
                        log("Players "+ game.player.toStringBet());
                        game.state = "ready";      
                        return;
                    }
                }
                if(game.player.holds) {
                    game.dealer.hide = false;
                    game.player.holds = false;
                    if(game.player.handValue === game.dealer.handValue){
                        log("Player draws " + game.player);
                        log("Dealer draws " + game.dealer);
                        game.player.pool += game.player.bet;                          
                        
                    }else if(game.player.handValue > game.dealer.handValue){
                        log("Player wins " + game.player);
                        log("Dealer loses  " + game.dealer);
                        log("Players return $" + game.player.bet); 
                        game.player.pool += game.player.bet * 2;                            
                    }else if(game.player.handValue < game.dealer.handValue){
                        log("Player loses " + game.player);
                        log("Dealer wins  " + game.dealer);
                    }
                    game.player.bet = 0; 
                    log("Players "+ game.player.toStringBet());
                    game.state = "ready"; 
                    
                }else{
                    log("Dealer holds " + game.dealer)
                    game.state = "player";
                }
                
                
            }
            
            
        }
    },
    display() {
        log("Players hand: "+player);
        
    },

}    
commandLine((command)=> {
    if(game.keys.includes(command.toLowerCase())) {
        if(game.currentState[command.toLowerCase()]) {
            //log(command)
            game.currentState[command.toLowerCase()]();
        } else {
            game.currentState.action(command);
        }
        commandLine("");
        
        return false;
    }
    return true;
    
});
log.clear();
commandInput.focus();
game.start();


/*END*/

const BLOCK_SIZE = 8;
const ISO_X = 2;
const ISO_Y = 2;
const ISO_Z = -1;
const ISO_S_X = 1; 
const ISO_S_Y = 1; 
const ISO_S_Z = 1; 
const ISO_PX = 1 / BLOCK_SIZE; 
const ISO_PY = 1 / BLOCK_SIZE; 
const ISO_PZ = 1  / BLOCK_SIZE; 
const wp = {x:0,y:0};
const wp1 = {x:0,y:0};
const wp2 = {x:0,y:0};
const wp3 = {x:0,y:0};
const wp4 = {x:0,y:0};
function line(p1, p2){

    var x1 = p1.x | 0;
    var y1 = p1.y | 0;
    var x2 = p2.x | 0;
    var y2 = p2.y | 0;
    var dx = Math.abs(x2 - x1);
    var sx = x1 < x2 ? 1 : -1;
    var dy = -Math.abs(y2 - y1);
    var sy = y1 < y2 ? 1 : -1;
    var er = dx + dy;
    var e2;
    var end = false;
    while (!end) {
        ctx.rect(x1, y1, 1, 1);
        if (x1 === x2 && y1 === y2) {
            end = true;
        } else {
            e2 = 2 * er;
            if (e2 >= dy) {
                er += dy;
                x1 += sx;
            }
            if (e2 <= dx) {
                er += dx;
                y1 += sy;
            }
        }
    }                  
}
const p3Buf = Object.assign([], {
    size : 0,
    next() { 
        var p;
        if(p3Buf.length > p3Buf.size) {
            p = p3Buf[p3Buf.size ++];
        }else {
            p = P3();
            p3Buf.push(p);
            p3Buf.size = p3Buf.length;
        }
        return p;
    },
    isFacing(idx1, idx2, idx3) {
        var x2 = p3Buf[idx2].x; 
        var y2 = p3Buf[idx2].y;
        return (p3Buf[idx3].x - x2) * (p3Buf[idx1].y - y2) - (p3Buf[idx3].y - y2) * (p3Buf[idx1].x - x2) >= 0;
    },

});
const P3 = (x= 0, y= 0, z = 0)=>({x,y,z});

const p3Util =  {
    copy(p) { return P3(p.x, p.y, p.z) },
    zero(p) { p.x = p.y = p.z = 0; return p },
    set(p, x= 0,y= 0,z= 0) { p.x = x; p.y = y; p.z = z; return p },
    from(p, p1) { p.x = p1.x; p.y = p1.y; p.z = p1.z; return p },
    add(p, p1) { p.x += p1.x; p.y += p1.y; p.z += p1.z; return p },
    sub(p, p1) { p.x -= p1.x; p.y -= p1.y; p.z -= p1.z; return p },
    mul(p, s) { p.x *= s; p.y *= s; p.z *= s; return p },
    div(p, s) { p.x /= s; p.y /= s; p.z /= s; return p },
    pow(p, s) { p.x **= s; p.y **= s; p.z **= s; return p },
    dis(p,p1) { return Math.sqrt((p.x - p1.x) * (p.x - p1.x) + (p.y - p1.y) * (p.y - p1.y) + (p.z - p1.z) * (p.z - p1.z)) },
    len(p) { return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) },
    norm(p) { const d = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z); p.x /= d; p.y /= d; p.z /= d; return p },
    rotZ90(p) { const x = p.x; p.x = - p.y; p.y = x; return p },
    cross(p, p1, p2) {
        p.x = p1.y * p2.z - p1.z * p2.y;
        p.y = p1.z * p2.x - p1.x * p2.z;
        p.z = p1.x * p2.y - p1.y * p2.x;
        return p;
    },
    dot(p1, p2) { return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z }
    
    
}
const Mat3 = (x = 0, y = 0, z = 0) => ([1, 0, 0, 0, 1, 0, 0, 0, 1, x,y,z]);
function matrix3() {
    var m;
    function Matrix3(){}
    Matrix3.prototype = {
        set mat(mat) { m = mat },
        get mat() { return m },
        copy() { return [...m] },
        pos(p) { return [1,0,0,0,1,0,0,0,1,p.x,p.y,p.z] },
        ident() {
            m[8] = m[4] = m[0] = 1;
            m[1] = m[2] = m[3] = m[5] = m[6] = m[7] = m[9] = m[10] = m[11] = 0;
        },
        translate(p) {m[9] += p.x; m[10] += p.y; m[11] += p.z},
        scale(p) {
            m[0] *= p.x; m[1] *= p.x; m[2] *= p.x;
            m[3] *= p.y; m[4] *= p.y; m[5] *= p.y;
            m[6] *= p.z; m[7] *= p.z; m[8] *= p.z;
        },
        rotX(rot){
            m[4] = m[0] = Math.cos(rot); 
            m[3] = -(m[1] = Math.sin(rot)); 
            m[5] = m[2] = 0;
        },
        mul(a,b) {
			m[0]  = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
			m[1]  = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
			m[2]  = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];
			m[3]  = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
			m[4]  = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
			m[5]  = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];	
			m[6]  = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
			m[7]  = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
			m[8]  = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];
			m[9]  = a[9] * b[0] + a[10] * b[3] + a[11] * b[6] + b[9];
			m[10] = a[9] * b[1] + a[10] * b[4] + a[11] * b[7] + b[10];
			m[11] = a[9] * b[2] + a[10] * b[5] + a[11] * b[8] + b[11];            
        }
    };
    return new Matrix3;
}
const matrix = matrix3();
const ISO = {
    block: {
        x: {
            x: BLOCK_SIZE * ISO_S_X,
            y: BLOCK_SIZE / ISO_X * ISO_S_X,
            z: -BLOCK_SIZE * ISO_S_X,
        },
        y: {
            x: -BLOCK_SIZE * ISO_S_Y,
            y: BLOCK_SIZE / ISO_Y * ISO_S_Y,
            z: -BLOCK_SIZE * ISO_S_Y,
        },
        z: {
            x: 0 * ISO_S_Z,
            y: BLOCK_SIZE / ISO_Z * ISO_S_Z,
            z: ISO_S_Z * BLOCK_SIZE
        },
    },
    pixel: {
        x: {
            x: BLOCK_SIZE / BLOCK_SIZE,
            y: BLOCK_SIZE / ISO_X / BLOCK_SIZE,
        },
        y: {
            x: -BLOCK_SIZE / BLOCK_SIZE,
            y: BLOCK_SIZE / ISO_Y / BLOCK_SIZE,
        },
        z: {
            x: 0 / BLOCK_SIZE,
            y: BLOCK_SIZE / ISO_Z / BLOCK_SIZE,
        },
        
        
    },
    origin: {
        x: canvas.width / 2 | 0,
        y: canvas.height * 0.75 | 0,
        z: canvas.height,
    },
    toScreen(x,y,z, p = {}) {
        const block = ISO.block;
        p.x = x * block.x.x + y * block.y.x + z * block.z.x + ISO.origin.x;
        p.y = x * block.x.y + y * block.y.y + z * block.z.y + ISO.origin.y;
        return p;
    },
    pointToScreen(p, t, p1 = {}) {
        const block = ISO.block;
        var x = p.x + t.x;
        var y = p.y + t.y;
        var z = p.z + t.z;
        p1.x = x * block.x.x + y * block.y.x + z * block.z.x + ISO.origin.x;
        p1.y = x * block.x.y + y * block.y.y + z * block.z.y + ISO.origin.y;
        p1.z = x * block.x.z + y * block.y.z + z * block.z.z + ISO.origin.z;
        return p1;
    },     
    rayToScreen(p, p1 = {}) {
        const block = ISO.block;
        p1.x = p.x * block.x.x + p.y * block.y.x + p.z * block.z.x;
        p1.y = p.x * block.x.y + p.y * block.y.y + p.z * block.z.y;
        p1.z = p.x * block.x.z + p.y * block.y.z + p.z * block.z.z;
        return p1;
    },      
    transformShape(shape, m) {
        const xx = m[0], xy = m[1], xz = m[2];
        const yx = m[3], yy = m[4], yz = m[5];
        const zx = m[6], zy = m[7], zz = m[8];
        const x = m[9], y = m[10], z = m[11];
        const tp = shape.tPoints;
        var idx = 0;
        
        for (const p of shape.points) {
            const t = tp[idx++];
            t.x = p.x * xx + p.y * xy + p.z * xz + x;
            t.y = p.x * yx + p.y * yy + p.z * yz + y;
            t.z = p.x * zx + p.y * zy + p.z * zz + z;
        }
    },
    lightFaces(shape, light) {
        var i = 0;
        if(!shape.shaded) { shape.shaded = [] }
        for(const face of shape.faces) {
            p3Util.from(wp1, shape.tPoints[face[0]]);
            p3Util.from(wp2, shape.tPoints[face[1]]);
            p3Util.from(wp3, shape.tPoints[face[2]]);
            p3Util.norm(p3Util.cross(wp4, p3Util.sub(wp1,wp2),  p3Util.sub(wp3,wp2)));
            const l = p3Util.dot(light,wp4 );
            shape.shaded[i] = l < 0 ? 0 : l;
            i++;
        }
    },
    castEdgeShadow(p1, p2, light) {
        p3Util.mul(p3Util.from(wp,light),100);
        p3Util.from(wp1,p1);
        p3Util.from(wp2,p2);
        p3Util.add(p3Util.from(wp3,p1), wp);
        p3Util.add(p3Util.from(wp4,p2), wp);
        p3Util.zero(wp)
        ISO.pointToScreen(wp1,wp, wp1);
        ISO.pointToScreen(wp2,wp, wp2);
        ISO.pointToScreen(wp3,wp, wp3);
        ISO.pointToScreen(wp4,wp, wp4);
        ctx.pixelZBufLine(wp1.x, wp1.y, wp1.z, wp3.x, wp3.y, wp3.z, 1, 0xFF000000);
        
        
    },
    line(p1,p2,c1,c2,light) {
        p3Util.from(wp1,p1);
        p3Util.from(wp2,p2);
        p3Util.zero(wp)
        ISO.pointToScreen(wp1,wp, wp1);
        ISO.pointToScreen(wp2,wp, wp2);
        ctx.pixelZBufLine(wp1.x, wp1.y, wp1.z, wp2.x, wp2.y, wp2.z, light, c1, c2);
    },
    shapeOutline(shape, style = {}) {
        if(shape.edges) {
            $eachOf(shape.edges, e => { 
                const p1 = p3Buf[e[0]];
                const p2 = p3Buf[e[1]];
                
                ctx.pixelZBufLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, 1, style.lineColor);
            });
        }
    },
    shapePoly(shape, style = {}) {
        if(shape.faces) {
            if(shape.tFaces) {
                $eachOf(shape.faces, (face,i) => { 
                    if (!style.backfaceCull || p3Buf.isFacing(face[0], face[1], face[2])) {
                        const verts = new Array(face.length);
                        const tFace = shape.tFaces[i];
                        const tex = new Array(face.length);
                        const sprIdx = shape.tSprites ? shape.tSprites[i] : -1;
                        var j = 0;
                        for(const idx of face) {
                            tex[j] = shape.tex[tFace[j]];
                            verts[j++] = p3Buf[idx];
                        }
                        const light = style.light ? shape.shaded[i] : 1;
                        ctx.pixelPolygonTextured(verts, light, sprIdx + style.spriteOffset, tex, style.map, style.forceZBufWrite, style.forcedZBufValue) ;
                        
                    }
                    /*if(style.shadow) {
                        var j = 0;
                        while(j < face.length) {
                            ISO.castEdgeShadow(shape.tPoints[face[j]], shape.tPoints[face[(j + 1) % face.length]], style.light);
                            j ++;
                        }
                        
                    }*/
                });
            } else {
                $eachOf(shape.faces, face => { 
                    if (!style.backfaceCull || p3Buf.isFacing(face[0], face[1], face[2])) {
                        const verts = new Array(face.length);
                        var j = 0;
                        for(const idx of face) {
                            verts[j++] = p3Buf[idx];
                        }
                        ctx.pixelPolygon(verts);
                    }
                });
                
            }
        }
    },
    drawObject(obj,mat) {
        const styles = obj.styles;
        const pos = obj.pos;
        for(const item of obj.items) {
            if(item.object) {
                matrix.mat = item.wMat;
                matrix.mul(obj.matrix, item.matrix);
                ISO.drawObject(item.object,matrix.mat)
                
            } else if (item.shape) {
                const style = styles.get(item.style);
                if(style && !style.hide) {
                    matrix.mat = item.wMat;
                    matrix.mul(mat ? mat : obj.matrix, item.matrix);
                    ISO.transformShape(item.shape, matrix.mat);
                    if(style.light) {
                        ISO.lightFaces(item.shape, style.light);
                    }
                    item.shape.pos.x = pos.x;
                    item.shape.pos.y = pos.y;
                    item.shape.pos.z = pos.z;
                    p3Buf.size = 0;
                    $eachOf(item.shape.tPoints, p =>{ISO.pointToScreen(p, pos, p3Buf.next())});                    
                    if (style.lineUnder) { ISO.shapeOutline(item.shape, style) }
                    if (style.textured) { ISO.shapePoly(item.shape, style);
                    } else if (style.flat) {
                        ctx.fillStyle = style.flatColor;
                        ISO.shapePoly(item.shape, style);
                    }
                    if (style.lineOver) { ISO.shapeOutline(item.shape, style) }
                }
            }
                    
            
            
        }
        
        
        
    },
    objects: {
        create(matrix=[1,0,0,0,1,0,0,0,1,0,0,0]) { return { pos: P3(0,0,0), matrix, wMat:[1,0,0,0,1,0,0,0,1,0,0,0], items : [], styles : new Map() } },
        addStyle(obj, name, style) { obj.styles.set(name, style) },
        addShape(obj, shape, matrix, styleName) { obj.items.push({shape, matrix, wMat:[1,0,0,0,1,0,0,0,1,0,0,0], style: styleName}) },
        addObject(obj,object, matrix, styleName) { obj.items.push({object, matrix, wMat:[1,0,0,0,1,0,0,0,1,0,0,0]}) },
    },
    shapes: {
        box(w, h, l,hasTop = true, hasBottom = false, sideSprite = 0) {
            const x = -w / 2;
            const y = -h / 2;
            const z = 0;
            const S = sideSprite;
            const box = ISO.utils.scaleTextureCoordsToBlock({
                pos: P3(0,0,0),
                points: [
                    P3(x, y, z),
                    P3(x + w, y, z),
                    P3(x + w, y + h, z),
                    P3(x, y + h, z),
                    P3(x, y, z + l),
                    P3(x + w, y, z + l),
                    P3(x + w, y + h, z + l),
                    P3(x, y + h, z + l),
                ],
                tex: [[0, 0], [w, 0], [w, h], [0, h], [0, l], [w, l], [h, l], [h, 0]],
                //      0       1         2     3       4       5        6     7
                edges: [
                    [0,1],[1,2],[2,3],[3,0],
                    [4,5],[5,6],[6,7],[7,4],
                    [0,4],[1,5],[2,6],[3,7],
                ],
                faces: [
                      [3,2,1,0], // bottom
                      [1,5,4,0],
                      [2,6,5,1],  // front right
                      [3,7,6,2], // front left
                      [0,4,7,3],
                      [4,5,6,7], // top
                ],
                tSprites: [0,S,S,S,S,0],  // MUIST match faces Same number sprite idx as face counts
                tFaces: [  // MUIST match faces Samae face count and smae indexs per face
                      [3,2,1,0], 
                      [4,0,1,5], 
                      [4,0,7,6], 
                      [4,0,1,5], 
                      [4,0,7,6], 
                      [3,2,1,0], 
                ]
            });
            box.tPoints = [...box.points.map(p=>p3Util.copy(p))];
            if (!hasTop) {
                box.faces.pop()
                box.tFaces.pop();
                box.tSprites.pop();
            }
            if (!hasBottom) {
                box.faces.shift()
                box.tFaces.shift();
                box.tSprites.shift();
            }
            return box;
        },       
        piramid(w, h, l, hasBottom = false) {
            const x = -w / 2;
            const y = -h / 2;
            
            const L = p3Util.len(P3(x,y,l));
            const z = 0;
            const box = ISO.utils.scaleTextureCoordsToBlock({
                pos: P3(0,0,0),
                points: [
                    P3(x, y, z),
                    P3(x + w, y, z),
                    P3(x + w, y + h, z),
                    P3(x, y + h, z),
                    P3(x + w / 2, y + h / 2, z + l),                
                ],
                tex: [[0, l], [w, l], [w / 2, 0]],
                edges: [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]],
                faces: [[3,2,1,0],[1,4,0],[2,4,1],[3,4,2],[0,4,3]],
                tSprites: [1,6,0,4,5], 
                tFaces: [[3,2,1,0],[0,2,1],[0,2,1],[0,2,1],[0,2,1]]
            });
            box.tPoints = [...box.points];
            if (!hasBottom) {
                box.faces.shift()
                box.tFaces.shift();
                box.tSprites.shift();
            }
            return box;
        },
        piramidTrunc(w,h,l,slice) {
            const x = -w / 2;
            const y = -h / 2;
            const z = 0;
            const xx = w / 2 * slice;
            const yy = h / 2 * slice;
            l = l * slice;
            return {
                pos: P3(0,0,0),
                points: [
                    P3(x, y, z),
                    P3(x + w, y, z),
                    P3(x + w, y + h, z),
                    P3(x, y + h, z),
                    P3(-xx, -yy, z + l),
                    P3(xx, -yy, z + l),
                    P3(xx, yy, z + l),
                    P3(-xx, yy, z + l),                
                ],
                tPoints: [
                    P3(x, y, z),
                    P3(x + w, y, z),
                    P3(x + w, y + h, z),
                    P3(x, y + h, z),
                    P3(-xx, -yy, z + l),
                    P3(xx, -yy, z + l),
                    P3(xx, yy, z + l),
                    P3(-xx, yy, z + l),                
                ],
                edges: [
                    [0,1],[1,2],[2,3],[3,0],
                    [4,5],[5,6],[6,7],[7,4],
                    [0,4],[1,5],[2,6],[3,7],
                ],
                faces : [
                      [3,2,1,0], 
                      [0,4,5,1],
                      [1,5,6,2],  
                      [2,6,7,3], 
                      [3,7,4,0],
                      [4,5,6,7], 
                ]                
            }
        },
        rectangle(w,h, useMappedTexture = false) {
            const x = -w / 2;
            const y = -h / 2;
            const rect = {
                pos: P3(0,0,0),
                points: [
                    P3(x, y, 0),
                    P3(x + w, y, 0),
                    P3(x + w, y + h, 0),
                    P3(x, y + h, 0),
                ],
                tPoints: [
                    P3(x, y, 0),
                    P3(x + w, y, 0),
                    P3(x + w, y + h, 0),
                    P3(x, y + h, 0),
                ],       
                tex: [[0 ,0], [w, 0], [w, h], [0, h]],
                edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
                faces: [[0,1,2,3]], //[3,2,1,0]
                tSprites: [0],
                tFaces: [[0, 1, 2, 3]],
            };
            if (!useMappedTexture) {return ISO.utils.scaleTextureCoordsToBlock(rect) }
            return rect;
        },
        rectangleUp(w,h,rot, useMappedTexture = false) {
            const x = Math.cos(rot) * (-w / 2);
            const y = Math.sin(rot) * (-w / 2);
            const rect = {
                pos: P3(0,0,0),
                points: [
                    P3(x, y, 0),
                    P3(x, y, h),
                    P3(-x,-y, h),
                    P3(-x, -y, 0),
                ],
                tPoints: [
                    P3(x, y, 0),
                    P3(x + w, y, 0),
                    P3(x + w, y + h, 0),
                    P3(x, y + h, 0),
                ],       
                tex: [[0 ,0], [w, 0], [w, h], [0, h]],
                edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
                faces: [[0,1,2,3]], //[3,2,1,0]
                tSprites: [0],
                tFaces: [[3, 0, 1, 2]],
            };
            if (!useMappedTexture) {return ISO.utils.scaleTextureCoordsToBlock(rect) }
            return rect;
        },        
        rectangleUpRand(w,h,count,width, length, hAdd, sprites, useMappedTexture = false) {
            var rect;
            var fi = 0;
            while(count--) {
                const x1 = Math.random() * width - width / 2;
                const y1 = Math.random() * length - length / 2;
                const hh =0;// Math.random() * hAdd;
                const rot = Math.random() * Math.PI;
                const x = Math.cos(rot) * (w / 2);
                const y = Math.sin(rot) * (w / 2);
                if(rect === undefined) {
                    rect = {
                        pos: P3(0,0,0),
                        points: [],
                        tPoints: [],       
                        tex: [[0 ,0], [w, 0], [w, h], [0, h]],
                        edges: [],
                        faces: [],
                        tSprites: [],
                        tFaces: [],
                    };
                }
                rect.points.push(
                    P3(x + x1, y + y1, 0),
                    P3(x + x1, y + y1, h+hh),
                    P3(-x + x1,-y + y1, h+hh),
                    P3(-x + x1, -y + y1, 0),
                );
                rect.tPoints.push(
                    P3(x + x1, y + y1, 0),
                    P3(x + x1, y + y1, h),
                    P3(-x + x1,-y + y1, h),
                    P3(-x + x1, -y + y1, 0),
                );
                rect.faces.push([fi++,fi++,fi++,fi++,]);
                rect.tSprites.push(sprites[Math.random() * sprites.length | 0]);
                rect.tFaces.push([3, 0, 1, 2]);
            }
            if (!useMappedTexture) {return ISO.utils.scaleTextureCoordsToBlock(rect) }
            return rect;
        },         
        outline(w,h,thick,useMappedTexture = false) {
            const shape = ISO.shapes.rectangle(w,h,useMappedTexture);
            ISO.utils.inset(shape, 0, (w - thick * 2) / w)
            ISO.utils.removeFace(shape,0);
            return shape;
        },
        outlineWall(w,h,l,thick,useMappedTexture = false) {
            const shape = ISO.shapes.box(w,h,l);
            ISO.utils.inset(shape, 4, (w - thick * 2) / w);
            ISO.utils.removeFace(shape, 4);
            const shapeInner = ISO.utils.flipFaces(ISO.shapes.box(w - thick * 2, h - thick * 2, l, false,false));
            //return shapeInner;
            return ISO.utils.mergeShapes(shape, shapeInner);

        },
        poly(r, sides, useMappedTexture = false) {
            const step = 1 / sides;

            const shape = {
                pos: P3(0,0,0),
                points: [],
                tPoints: [],   
                tex:[],
                edges: [],
                tSprites: [0],
                faces: [[]], 
                tFaces: [[]], 
            };
            var idx = 0;
            for(let i = 0; i < sides; i += 1) {
                const ang = ((i / sides) - step / 2)* Math.PI * 2;
                const x = Math.cos(ang) * r;
                const y = Math.sin(ang) * r;
                shape.points.push(P3(x,y,0));
                shape.tPoints.push(P3(x,y,0));
                shape.tex.push([x + r,y + r])
                shape.edges.push([idx, (idx + 1) % sides]);
                shape.tFaces[0].push(idx);
                shape.faces[0].push(idx++);
            }
            if (!useMappedTexture) {return ISO.utils.scaleTextureCoordsToBlock(shape) }
            else {return ISO.utils.scaleTextureCoords(shape, 0.5) }
            return shape;
        }
    },
    utils: {
        scaleTextureCoordsToBlock(shape) {
            if(shape.tex) {
                for(const t of shape.tex) {
                    t[0] *= BLOCK_SIZE;
                    t[1] *= BLOCK_SIZE;
                    if(t.length === 3) { t[2] *= BLOCK_SIZE }
                }
            }
            return shape;
        },
        scaleTextureCoords(shape, scale) {
            if(shape.tex) {
                for(const t of shape.tex) {
                    t[0] *= scale;
                    t[1] *= scale;
                    if(t.length === 3) { t[2] *= scale }
                }
            }
            return shape;
        },
        removeFace(shape,faceIdx) {
            shape.faces.splice(faceIdx,1);
            shape.tFaces.splice(faceIdx,1);
            shape.tSprites.splice(faceIdx,1);
            return shape;
        },
        flipFace(shape,faceIdx) {
            shape.faces[faceIdx].reverse();
            return shape;
        },
        flipFaces(shape){
            shape.faces.forEach(face=>face.reverse());
            return shape;
        },
        createMap(map, base) {
            const mapped = {
                map : new Uint16Array(map.length * map[0].length),
                width:  map[0].length,
                height: map.length,
            };
            base = base.charCodeAt(0);
            var y = 0;
            for(const row of map) {
                idx = y * mapped.width;
                for(const cell of row) {
                    mapped.map[idx++] = cell.charCodeAt(0)-base;
                }
                y++;
            }
            return mapped;
        },
        mergeShapes(shape, ...shapes) {
            log.obj(shapes[0]+":")
            for(const s of shapes) {
                var pointStart = shape.points.length;
                var texStart = shape.tex.length;
                for(const edge of s.edges) {
                    shape.edges.push([edge[0] + pointStart, edge[1] + pointStart]);
                }
                for(const face of s.faces) {
                    const nFace = [];
                    for(const idx of face){
                        nFace.push(idx + pointStart);
                    }
                    shape.faces.push(nFace);
                }
                for(const tFace of s.tFaces) {
                    const nTFace = [];
                    for(const idx of tFace){
                        nTFace.push(idx + texStart);
                    }
                    shape.tFaces.push(nTFace);
                }
                for(const p of s.points) {
                    shape.points.push(p3Util.copy(p));
                    shape.tPoints.push(p3Util.copy(p));
                }
                for(const t of s.tex) {
                    shape.tex.push([...t]);
                }
                shape.tSprites.push(...s.tSprites)
            }
            return shape;
        },
        translateFace(shape, faceIdx, vec) {
            for(const idx of shape.faces[faceIdx]){
                p3Util.add(shape.points[idx], vec);
            }
            return shape;
        },
        scaleFace(shape, faceIdx, scale, origin) {
            if(!origin) {
                origin = P3();
                for (const idx of shape.faces[faceIdx]) {
                    p3Util.add(origin, shape.points[idx]);
                }
                p3Util.div(origin, shape.faces[faceIdx].length);
            }
                
            for(const idx of shape.faces[faceIdx]){
                p3Util.add(p3Util.mul(p3Util.sub(shape.points[idx], origin), scale), origin);
            }
            return shape;
        },
        inset(shape,faceIdx,amount) {
            const face = shape.faces[faceIdx];
            const tFace = shape.tFaces[faceIdx];
            const nIdx = shape.points.length;
            const tIdx = shape.tex.length;
            const fL = face.length;
            p3Util.zero(wp1);
            p3Util.zero(wp2);
            for(const idx of face) {
                p3Util.add(wp1, shape.points[idx]);
            }
            for(const idx of tFace) {
                p3Util.add(wp2, P3(shape.tex[idx][0],shape.tex[idx][1],shape.tex[idx][2]));
            }
            log("face len " + face.length);
            p3Util.div(wp1, face.length);
            p3Util.div(wp2, tFace.length);

            var i = 0
            for(const idx of face) {
                const p = p3Util.copy(shape.points[idx]);
                p.x = (p.x - wp1.x) * amount + wp1.x;
                p.y = (p.y - wp1.y) * amount + wp1.y;
                p.z = (p.z - wp1.z) * amount + wp1.z;
                shape.points.push(p);
                shape.tPoints.push(p3Util.copy(p))
                shape.edges.push([idx, nIdx + i]);
                shape.edges.push([nIdx + i,nIdx + (i + 1) % fL]);
                i++;
            }
            var i = 0
            for(const idx of tFace) {
                const p = P3(shape.tex[idx][0],shape.tex[idx][1],shape.tex[idx][2]);
                p.x = (p.x - wp2.x) * amount + wp2.x;
                p.y = (p.y - wp2.y) * amount + wp2.y;
                p.z = (p.z - wp2.z) * amount + wp2.z;
                if (shape.tex[idx].length === 2) {
                    shape.tex.push([p.x, p.y]);  
                } else {
                    shape.tex.push([p.x, p.y, p.z]); 
                }
                shape.tSprites.push(shape.tSprites[faceIdx]);
           }           
           
            i = 0;
            for(const idx of face) {
               shape.faces.push([
                   face[(i + 1) % fL],
                   nIdx + ((i + 1) % fL),
                   nIdx + i,
                   idx,
               ]);
               i++;
            }
            i = 0;
            for(const idx of tFace) {
               shape.tFaces.push([
                   tFace[(i + 1) % fL],
                   tIdx + ((i + 1) % fL),
                   tIdx + i,
                   idx,
               ]);    
               i++;
            }
            i = 0;
            for(const idx of face) {
               face[i] = nIdx + i;
               i++;
            }
            i = 0;
            for(const idx of tFace) {
               tFace[i] = tIdx + i;
               i++;
            }
            return shape;
        },  
        extrude(shape,faceIdx,vec,addEdges, addFaces) {
            const face = shape.faces[faceIdx];
            const tFace = shape.tex ? shape.tFaces[faceIdx] : undefined;
            const nIdx = shape.points.length;
            
            const tIdx = tFace ? shape.tex.length : 0;
            const fl = face.length;
            const tl = tFace ? tFace.length * 2 : 0;
            const dist = p3Util.len(vec);
            var sideTX = 100;

            var i = 0
            for(const idx of face) {
                shape.points.push(p3Util.add(p3Util.copy(shape.points[idx]), vec));
                shape.tPoints.push(p3Util.copy(shape.points[idx]));
                if(addEdges === undefined || addEdges.includes(i)) {
                    shape.edges.push([idx, nIdx + i]);
                }
                if(addEdges === undefined || addEdges.includes(fl)) {
                    shape.edges.push([nIdx + i,nIdx + (i + 1) % fl]);
                }
                i++;

            }
            i = 0;
            for(const idx of tFace) {
                const fIdx = tFace[(i + 1) % fl];
                const sideLen = p3Util.dis(
                    P3(shape.tex[idx][0],shape.tex[idx][1],shape.tex[idx][2]),
                    P3(shape.tex[fIdx][0],shape.tex[fIdx][1],shape.tex[fIdx][2])
                );
                //log(sideTX/BLOCK_SIZE)
                const sideSizeLen = p3Util.dis(shape.points[face[i]],shape.points[face[(i+1)%fl]]);
                shape.tSprites.push(shape.tSprites[faceIdx]);
                shape.tex.push([sideTX, 0]);
                shape.tex.push([sideTX, dist * (sideLen / sideSizeLen)]);
                sideTX += sideLen;
                i++;

            }
            i = 0;
            var j = 0;
            for(const idx of face) {
                if(addFaces === undefined || addFaces.includes(i)) {
                    shape.faces.push([face[(i + 1) % fl],nIdx + ((i + 1) % fl),nIdx + i, idx]);
                    if (tFace) {
                        //shape.tFaces.push([tIdx + j,tIdx + j + 1,tIdx + ((j + 3) % tl), tIdx + ((j + 2) % tl)]);
                        shape.tFaces.push([tIdx + ((j + 3) % tl), tIdx + ((j + 2) % tl),tIdx + j,tIdx + j + 1]);
                        j += 2
                    }
                }
                i++;
            }
            i = 0;
            for(const idx of face) {
                face[i] = nIdx + i;
                i++;
            }

        },
    }
}
const logO = o => log.obj(o,true,4);

var renderBuffer;
const tiles = new Image();
tiles.src = "../GameEngine/Jan2018/ISOTiles16A.png";
log("image loading");
tiles.onload = () => {
    log("image loaded");
    const U = 16;
    const sprites = [];
    for(let i = 0; i < 16 * 16; i++){
        const x = i % 16;
        const y = (i / 16) | 0;
        sprites.push([U * x, U * y, U, U]);
    }
    ctx.setPixelTexture(tiles, sprites);
    renderBuffer = ctx.createRenderBuffer();
    renderBuffer.addZBuffer(canvas.height/2,canvas.height*2);
    
    mouse.button = 1;
    main();
}
tiles.onerror = () => { log("image failed"); }

ctx.clear();
const grassSquare = ISO.utils.createMap(["abc", "qrs","abc", "qrs"],"a");
const rock = ISO.utils.createMap(["ab", "qr"],"a");
const grassSquare1 = ISO.utils.createMap([
        "abbbbbbbc", 
        "deeeeeeef",
        "deabbbcef", 
        "dedeeefef", 
        "dedeeefef", 
        "dedeeefef", 
        "deghhhief", 
        "deeeeeeef",
        "ghhhhhhhi"
    ],"a");
//const light = p3Util.norm(P3(1,-4,-14));
//const light = p3Util.norm(P3(1,1,4));
const light = p3Util.norm(P3(-1,-2,-4));
const lightRay = P3(-1, -10, -2);
log.obj(light);
log.obj(lightRay);
const test = ISO.objects.create();
const brick = ISO.objects.create();
var t;
ISO.objects.addStyle(test, "grassA", {textured:true, backfaceCull:true, light,spriteOffset: 33+16, lineOver: true, lineColor : 0xFFFFFFFF});
ISO.objects.addStyle(test, "grass", {textured:true, backfaceCull:true, map: grassSquare, light,spriteOffset:54});
ISO.objects.addStyle(test, "rock", {textured:true, backfaceCull:false, map: rock, light, spriteOffset: 18});
ISO.objects.addStyle(test, "grassn", {textured:true, backfaceCull:true, map: grassSquare1, light, hide:true});
ISO.objects.addStyle(test, "brickBack", {textured:true, backfaceCull:true, light, spriteOffset: 33});
ISO.objects.addStyle(test, "brick", {textured:true, backfaceCull:true, light, spriteOffset: 0});
ISO.objects.addStyle(brick, "brick", {textured:true, backfaceCull:true, light, spriteOffset: 0, shadow: true});
ISO.objects.addStyle(test, "plants", {textured:true, backfaceCull:false, spriteOffset: 10});
ISO.objects.addStyle(test, "brickh", {textured:true, backfaceCull:true, hide : true});
ISO.objects.addStyle(test, "zBackClip", {textured:true, backfaceCull:true, spriteOffset: -1, forceZBufWrite: true});
ISO.objects.addStyle(test, "zFrontClip", {textured:true, backfaceCull:true, spriteOffset: -1, forceZBufWrite: true, forcedZBufValue: -1000});


//ISO.objects.addShape(test,t = ISO.shapes.box(128,128,32, false), Mat3(48,48, 0), "grass");
ISO.objects.addShape(test,t = ISO.shapes.box(44,44,32,false), Mat3(-6,-6, -32), "zFrontClip");
ISO.objects.addShape(test,t = ISO.shapes.box(44,44,32, false), Mat3(6,6, 0), "zBackClip");
log(t.faces.length)
ISO.utils.flipFaces(t);
ISO.utils.removeFace(t,2)
ISO.utils.removeFace(t,1)
log(t.faces.length)

ISO.objects.addShape(test,t = ISO.shapes.rectangle(32,32,true), Mat3(0,0), "grass");

t = ISO.shapes.box(32,1,2,);
t.tSprites[4] = 16;
var t2 = ISO.shapes.box(1, 24,2,);
t2.tSprites[4] = 16;
ISO.objects.addShape(test,t, Mat3(0,12), "brick");
ISO.objects.addShape(test,t, Mat3(0,-12), "brick");
ISO.objects.addShape(test,t2, Mat3(14,0), "brick");
var t2 = ISO.shapes.box(1, 24,1,);
t2.tSprites[4] = 16;
ISO.objects.addShape(test,t2, Mat3(13,0,10), "brick");

var t2 = ISO.shapes.box(1, 1,12,);
t2.tSprites[4] = 16;
ISO.objects.addShape(test,t2, Mat3(13,-11), "brick");
ISO.objects.addShape(test,t2, Mat3(13,11), "brick");
ISO.objects.addShape(test,t2, Mat3(13,-8), "brick");
ISO.objects.addShape(test,t2, Mat3(13,8), "brick");
ISO.objects.addShape(test,t2, Mat3(13,-4), "brick");
ISO.objects.addShape(test,t2, Mat3(13,4), "brick");

t = ISO.shapes.rectangleUpRand(6,2,1100,32,32,2,[0,1,2,3,4,5,16]);
ISO.objects.addShape(test,t, Mat3(0,0,-0.0), "plants");



const brickShape = ISO.shapes.box(2,2,2);
ISO.objects.addShape(brick,brickShape,Mat3(),"brick");
brickShape.tSprites[4] = 16;
brickShape.tSprites[1] = 3;
brickShape.tSprites[2] = 3;
brickShape.tSprites[3] = 3;
//brickShape.tSprites[4] = 2;
function *drawTower(part,w,h,l) {
    var z,y,x;
    for(z = 0; z < l; z ++){
        for(y = 0; y < h; y ++){
            for(x = 0; x < w; x ++){
                if(z % 4 === 0 || x === 1 || y === 1 || x === w -2 || y === h - 2){
                    if(z%4 === 0 || w < 5 || 
                        (y !== (w / 2 | 0) && y !== (w / 2 | 0)-1  &&
                        x !== (w / 2 | 0) && x !== (w / 2 | 0)-1 )
                    ) {
                        part.matrix[9] = x * 2 - w;// + Math.random() * 0.01 - 0.005;
                        part.matrix[10] = y * 2 - h;// + Math.random() * 0.01 - 0.005;
                        part.matrix[11] = z * 2;// + Math.random() * 0.01 - 0.005;
                        ISO.drawObject(part);
                        renderBuffer.present();

                    }
                }
                
            }
            yield 1;
        }
        if(z % 4 === 0){w--;h--}
    }
    tower = undefined;
    
    
}
//var tower = drawTower(brick,6,6,16);



function *drawTree(x,y,bRad) {
    const posOnPath = (path, dist) => {
        var pos = dist * (path.length-1);
        var off = pos % 1;
        pos |= 0;
        var p1 = path[pos|0];
        var p2 = path[pos + 1];
        p3Util.from(wp1,p1);
        p3Util.add(p3Util.mul(p3Util.sub(p3Util.from(wp,p2),p1),off),p1);
        
        return wp;
    }
    
    var stems = 200 * bRad | 0;
    var pathCount = 20 * bRad | 0;
    var p1 = P3();
    var p2 = P3();
    var pp1 = P3();
    var pt1 = P3();
    var pp2 = P3();
    var pt2 = P3();
    var d = P3();
    const paths = [];
    while(pathCount --) {
        const ang = $randS(Math.PI * 2);
        const l = Math.cos(ang+2) < 0 ? 0.5 : Math.cos(ang+2) * 0.5 + 0.5;
        const dist = (1 - $randS(1) ** 2) * bRad;
        var tlen = 35 * bRad | 0;//$randSI(13,35);
        var twistAng = $randS(Math.PI * 2);
        var twist = $randS(-0.5,0.5);
        var twistDist = $randS(0.2);
        p1.x = Math.cos(ang) * dist + x;
        p1.y = Math.sin(ang) * dist + y;
        p1.z = 0;
        var copyP = true;
        var copyI = 0;
        if(paths.length === 0){
            copyP = false;
        }else{
            oldPath = $randSItem(paths);
        }
        
        if(copyP) {
            p3Util.from(p1,oldPath[copyI++]);
        }
        p3Util.from(p2,p1);
        d.x = 0;
        d.y = 0;
        d.z = 2;
        const path = [p3Util.copy(p1)]
        p3Util.add(p2,d);
        while(tlen-- && (!copyP || (copyP && copyI < oldPath.length))){
            if(copyP) {
                p3Util.from(p2,oldPath[copyI++]);
            }              
            path.push(p3Util.copy(p2));
            p3Util.from(p1,p2);
            p3Util.mul(d,0.9);
            d.x += Math.cos(twistAng) * twistDist;
            d.y += Math.sin(twistAng) * twistDist;
            twistAng += twist;
            if(copyP && ($randS(1) < 0.2 || tlen < 13)) {
                copyP = false;
                const ll = p3Util.len(d);
                d.x = $randS(-1,1);
                d.y = $randS(-1,1);
                d.z = $randS(0.5,2);
                tlen = tlen > 1 ? tlen * 0.5 | 0 : tlen;

                p3Util.mul(p3Util.norm(d),$randS(ll/2,ll))
            }

            p3Util.add(p2,d);
            
        }
        paths.push(path);
    }
    
    log(paths.length);
    while(stems --) {
        var path = $randSItem(paths);
        var ang = $randS(Math.PI * 2);
        const l = Math.cos(ang-2) < 0 ? 0.5 : Math.cos(ang-2) * 0.5 + 0.5;
        var dist = (1 - $randS(1) ** 2) * bRad;
        var tlen = $randSI(13,35);
        var twistAng = 0;//$randS(Math.PI * 2);
        var twist = $randS(-0.05,0.05);
        var twistDist = $randS(0.02);
        var pDist = 0;
        var pSpeed = 0.01;
        p1.x = Math.cos(ang) * dist;
        p1.y = Math.sin(ang) * dist;
        p1.z = 0;
        p3Util.from(p2,p1);
        p3Util.add(p3Util.from(pt1,p3Util.from(pp1,posOnPath(path,pDist))),p1);
        pDist += pSpeed;

        while(pDist<= 1){
            p3Util.add(p3Util.from(pt2,p3Util.from(pp2,posOnPath(path,pDist))),p2);
            
            if($randS(1) < (0.4 * (pDist**2)) || pDist > 1) {
                p3Util.from(d,pt2);
                pt2.x += $randS(-1,1);
                pt2.y += $randS(-1,1);
                pt2.z += $randS(-0.5,2);
                ISO.line(pt1,pt2,0xff4488aa,0xff4488aa,l);
                for(var k = 0; k < 10; k++){
                    p3Util.from(p1,pt2);
                    p1.x += $randS(-0.5,0.5);
                    p1.y += $randS(-0.5,0.5);
                    p1.z += $randS(-0.1,0.5);
                    
                    ISO.line(pt2,p1,0xff00CC00,0xff00AA00,l);
                    
                    //ISO.line(pt1,pt2,0xff008800,0xff00FF00,l);
                }
                p3Util.from(pt2,d);
                //break;
            }            
            ISO.line(pt1,pt2,0xff4488aa,0xff4488aa,l);
            if(pDist > 0.7 && $randS(1) < (0.4 * (pDist**1.1))) {
                for(var k = 0; k < 10; k++){
                    p3Util.from(p1,pt2);
                    p1.x += $randS(-0.5,0.5);
                    p1.y += $randS(-0.5,0.5);
                    p1.z += $randS(0.0,0.5);
                    
                    ISO.line(pt2,p1,0xff00CC00,0xff00CC00,l);
                }
            }
            p3Util.from(pt1,pt2);
            pDist += pSpeed;
            p2.x = Math.cos(ang+ twistAng) * dist;
            p2.y = Math.sin(ang+ twistAng) * dist;
            dist *= 0.96;
            twistAng += twist;

          
            
        }
        
            renderBuffer.present();
            yield 1;        
    }
    
    tower = undefined;
    tower = drawTree($randS(-16,16),$randS(-16,16),$randS(0.1,0.45))
    
    
}
var tower = drawTree(0,0,0.54)
//ISO.utils.removeFace(t,0)







const mat = Mat3();
matrix.mat = mat;
const edges = []


ctx.globalAlpha = 1;
var ang = 0;

function main(){
    //log.clear();
  //  ctx.clear();
    mouse.forElement(canvas);
    
    
    if(mouse.button === 1){
        //log.clear();
      //  log("rendering...")
        renderBuffer.clear();
    //    ang = mouse.x / canvas.width * 8 + (mouse.y / canvas.height) * (8/canvas.width);
      //  matrix.rotX(ang)
       // ISO.transformShape(rect1, mat)
      /*  ISO.transformShape(rect2, mat)
        ISO.transformShape(rect2T, mat)
        ISO.transformShape(rect2T1, mat)*/
      //  ISO.transformShape(rect3, mat)
        
        


        ISO.drawObject(test);
      //  ISO.drawObject(test2);

       // renderBuffer.zBufferShadow(lightRay, 0.5);
        //renderBuffer.zBufferToPixel();
        renderBuffer.present();
  
     
        mouse.button = 0;
       // log("rendered")
    }
    if(tower){
        tower.next();
    }else{
        mouse.button = 1;
    }
    
    
    if(mouse.button === 0){
        requestAnimationFrame(main);
    }else{log("END")}
    
    
}


















/*END*/





/*END*/
const Pallet = {
    color: (r, g, b, a = 255) => ({r, g, b, a}),
    createLookup(range, size) {
        var idx = 0;
        Pallet.range = range;
        Pallet.int32 = new Uint32Array(size);
        const int8 = new Uint8ClampedArray(Pallet.int32.buffer);
        const rangeStep = size / (range.length -1);
        for(let i = 0; i < size; i ++) {
            const low = i / rangeStep | 0;
            const high = low + 1;
            const unitDistBetweenRange = (i - (low * rangeStep)) / rangeStep;
            const u = unitDistBetweenRange;
            const lRGBA = range[low];
            const hRGBA = range[high];
            int8[idx++] = ((hRGBA.r ** 2 - lRGBA.r ** 2) * u + lRGBA.r ** 2) ** 0.5;
            int8[idx++] = ((hRGBA.g ** 2 - lRGBA.g ** 2) * u + lRGBA.g ** 2) ** 0.5;
            int8[idx++] = ((hRGBA.b ** 2 - lRGBA.b ** 2) * u + lRGBA.b ** 2) ** 0.5;
            int8[idx++] = ((hRGBA.a ** 2 - lRGBA.a ** 2) * u + lRGBA.a ** 2) ** 0.5;
        }
        return Pallet.int32;
    }
};
;(() => {
    const blockSize = 32;
    var panX = -3.5, panY = -1.5, zoom = 100;
    const maxI = 16;
    const ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    const imgData = ctx.getImageData(0,0,blockSize,blockSize);
    const pixels = new Uint32Array(imgData.data.buffer);
    var cbounds = canvas.getBoundingClientRect();
    var started = false, canRender = false;
    W = canvas.width, H = canvas.height;    
    const pallet = Pallet.createLookup([
            Pallet.color(0, 0, 0), 
            Pallet.color(0xFF, 0x00, 0x00), 
            Pallet.color(0x00, 0xff, 0xff), 
            Pallet.color(0x00, 0xFF, 0x00), 
            Pallet.color(0x00, 0xFF, 0x00), 
            Pallet.color(0x00, 0x00, 0xFF), 
            Pallet.color(0xFF, 0xFF, 0x00), 
            Pallet.color(0xFF, 0x00, 0xFF), 
            Pallet.color(0xAA, 0xED, 0x56), 
        ], maxI
    );

    function resetView() {
        zoom = 100;
        panX = -0.5 - ((W / 2) / zoom);
        panY = 0 - ((H / 2) / zoom);
    }
    resetView();
    requestAnimationFrame(main);
    function main() {
        mouse.forElement(canvas);
        if(mouse.over){
            if(mouse.button === 1) { 
                var mx = panX + mouse.x / zoom;
                var my = panY + mouse.y / zoom;
                zoom *= 2;
                panX = mx - (mouse.x / zoom);
                panY = my - (mouse.y / zoom);         
                mouse.button = 0;
                render()
            }
            if(mouse.button === 2) { 
                resetView();
                mouse.button = 0;
                render();
            }
        }
        if(mouse.button === 4) { 
            EZWebWorkers.shutDown();
            log("done");
            return;
        };
        requestAnimationFrame(main);;
    }

    function render(){
        if(canRender) {
          W = canvas.width, H = canvas.height;
          for(var by = 0; by < H; by += blockSize){
            for(var bx = 0; bx < W; bx += blockSize){
                mWorkers.mandelWorker({call:"draw", args: [zoom, panX, panY, bx, by, blockSize, blockSize]})
                    .then(result => {
                        imgData.data.set(result.data);
                        ctx.putImageData(imgData,result.x,result.y);
                        
                    })
                  .catch(e=>log("Process Error: "+e.message))
            }
          }
      }
    }

    const mWorkers = {};
    EZWebWorkers.worker(mandelWorker, {interface: mWorkers, concurrent : 3})
        .then(worker => (started = true, worker))
        .then(worker => worker.cast({call:"setPallet", args: [pallet]},true))
        .then(()=> (canRender = true, setTimeout(render,100)))
        .catch(e => log("Init Error: " + e.message + " For worker: '" + e.target.name + "'"));
 

    function mandelWorker() {
        const mandelRenderer = (() => {
            var pallet,pallet8; // draw will throw if pallet not set
            var pixels,pixelChannels, palletCount;;
            var subPix = 2;
            var subTot = subPix * subPix;
            return {
                setPallet(p) { 
                    pallet = new Uint32Array(p.length);
                    pallet8 = new Uint8ClampedArray(pallet.buffer);
                    pallet.set(p);
                    palletCount = p.length;
                    return workerId + " Pallet set";
                },
                draw(zoom, panX, panY, x, y, w, h, iterations = 256) { 
                    
                    if(!pixels || pixels.length !== w * h){
                        pixels = new Uint32Array(w * h);
                        pixelChannels = new Uint8ClampedArray(pixels.buffer);
                    }
                    var sx,sy,px, py,mix, xx, yy, ox, oy, nx, ny, ii, i, j, jj, u, u1, dist, idx = 0;
                    var r,g,b,rr,gg,bb;
                    const pCount = palletCount;
                    const pScale1 = pCount * 64;
                    const pScale2 = pCount* 16;
                    for (py = 0; py < h; py++) {
                        for (px = 0; px < w; px++) {
                            r = g = b = 0;
                            for (sy = 0; sy < subPix; sy++) {
                                for (sx = 0; sx < subPix; sx++) {
                                    ox = xx = panX + (px + (sx / subPix) + x) / zoom;
                                    oy = yy = panY + (py + (sy / subPix) + y) / zoom;
                                    u1= 1;
                                    u = 1;
                                    for (i = 0; i < pCount * 256; i++) {
                                        nx = (ox * ox) - (oy * oy) + xx;
                                        ny = (2 * ox * oy ) + yy;
                                        dist = ny * ny + nx *nx;
                                        if (dist > 3) { u+=1}
                                        if (dist > 2.5) { u1 *= 0.92}
                                        //if (nx / ny > 13.4) { i= pCount * 4 - i + Math.atan2(nx,ny*10); break }
                                        //if (nx + ny > 16.4) { i=45-i*3-  Math.atan2(nx*4,ny); break }
                                        if (dist >= 4) { break }
                                        ox = nx;
                                        oy = ny
                                    }
                                    i = Math.abs((i+u) / pScale1) % pCount;
                                    j = Math.abs((i+i*u1) / pScale2) % pCount;
                                    mix = i % 1;
                                    ii = i  << 2;
                                    jj = j  << 2;
                                    rr = (pallet8[jj++] - pallet8[ii]) * mix + pallet8[ii++];
                                    gg = (pallet8[jj++] - pallet8[ii]) * mix + pallet8[ii++];
                                    bb = (pallet8[jj++] - pallet8[ii]) * mix + pallet8[ii++];

                                    r += rr * rr;
                                    g += gg * gg;
                                    b += bb * bb;
                                }
                            }
                            pixelChannels[idx++] = Math.sqrt(r/subTot);
                            pixelChannels[idx++] = Math.sqrt(g/subTot);
                            pixelChannels[idx++] = Math.sqrt(b/subTot);
                            pixelChannels[idx++] = 255;
                            
                        }
                    }
                    return {data: pixelChannels, x, y};
                }
            };
        })();
        
        function workerFunction(data){
            if (mandelRenderer[data.call]) { return mandelRenderer[data.call](...data.args) }
        }    
    }    

    
})();



/*END*/

const wave = Object.freeze({
    sin: (t, freq = 1) => (Math.sin(t * freq * Math.PI * 2) + 1) / 2,
    saw: (t, freq = 1) => t * freq % 1,
    tri: (t, freq = 1) => (t = t * freq % 1, (t > 0.5 ? 1 - t : t) * 2),
    sqr: (t, freq = 1, width = 0.5) => (t = t * freq % 1, t < width ? 0 : 1),
    bell: (t, freq = 1, p = 2) => {
        t = t * freq % 1;
        const tt = Math.pow(t = t > 0.5 ? 2 - t * 2 : t * 2, p);
        return tt / (tt + Math.pow(1 - t, p));
    }
});
const ease = Object.freeze({
    linear: t => t < 0 ? 0 : t > 1 ? 1 : t,
    in: (t, p = 2) => t < 0 ? 0 : t > 1 ? 1 : Math.pow(t, p),
    out: (t, p = 2) => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, p),
    inOut: (t, p = 2, pp) => t < 0 ? 0 : t > 1 ? 1 : (pp = Math.pow(t, p), pp / (pp + Math.pow((1 - t), p))),
    rushInOut: (t, p = 2, pp) => t < 0 ? 0 : t > 1 ? 1 : (p = 1 / p, pp = Math.pow(t, p), pp / (pp + Math.pow((1 - t), p))),
    sin: t => t < 0 ? 0 : t > 1 ? 1 : (Math.cos((1 - t) * Math.PI) + 1) / 2,
    sinPow: (t, p = 2) => t < 0 ? 0 : t > 1 ? 1 : Math.pow((Math.cos((1 - t) * Math.PI) + 1) / 2, p),
    step: (t, p = 0.5) => t < p ? 0 : 1,
    spring: Object.freeze({
        in: (t, a, p) => t < 0 ? 0 : t > 1 ? 1 : a * Math.pow(2 , 10 * --t) * Math.sin((Math.asin(1 / a) * p - t) / p),
        out: (t, a, p) => t < 0 ? 0 : t > 1 ? 1 : 1 - a * Math.pow(2 , -10 * (t = +t)) * Math.sin((t + Math.asin(1 / a) * p) / p),
        inOut: (t, a, p) => t < 0 ? 0 : t > 1 ? 1 :
            ((t = t * 2 - 1) < 0
                ? a * Math.pow(2 , 10 * t) * Math.sin((Math.asin(1 / a) * p - t) / p)
                : 2 - a * Math.pow(2 , -10 * t) * Math.sin((Math.asin(1 / a) * p + t) / p)) / 2,
    }),
    occilate: Object.freeze({
        in: (t, p = 2, over = 0.2, freq = 8, pf = 1.5) =>  t < 0 ? 0 : t > 1 ? 1 : Math.pow(t, p) + over * Math.sin(-t * freq * Math.PI * 2) *  Math.pow(t, pf),
        out: (t, p = 2, over = 0.2, freq = 8, pf = 1.5) => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, p) - over * Math.sin(t * freq * Math.PI * 2) * Math.pow(1 - t, pf),
        inOut: (t, over = 0.2, freq = 8, p = 1.5) => {
            const a = (1 - t) * Math.PI;
            return t < 0 ? 0 : t > 1 ? 1 : (Math.cos(a) + 1) / 2 + over * Math.sin(-t * freq * Math.PI * 2) * Math.pow((Math.cos(a * 2) + 1) / 2, p);
        },
    }),
    
});
const W = canvas.width;
const H = canvas.height;
ctx.lineWidth = 1;
ctx.strokeRect(0,H*0.25, W, H * 0.5)
//for(var k = 0; k < 2; k += 0.1){
    for(var j = 0; j < 0.2; j += 0.01){
        ctx.beginPath();
        for (var i = 0; i < 1; i += 1 / W) {
            const x = i * W;
            //const y = ease.spring.out(1 - i, 2, 0.25, 16, 12) * H * 0.5 + H * 0.25;
            const y = ease.spring.in(1 - i, 7.6, j-0.1) * H * 0.5 + H * 0.25;
            //const y = wave.sqr(1 - i,10, 0.5) * H * 0.5 + H * 0.25;
            ctx.lineTo(x,y);
        }
        ctx.stroke();
    }
//}
const p =  {x:W / 2 + 0,y:0,t:0,}
const p1 = {x:W / 2 + 40,y:0,t:0}
const p2 = {x:W / 2 + 80,y:0,t:0}
const p3 = {x:W / 2 + 120,y:0,t:0}
const p4 = {x:W / 2 + 160,y:0,t:0}
const p5 = {x:W / 2 + 200,y:0,t:0}
const p6 = {x:W / 2 + 240,y:0,t:0}
const po = [p,p1,p2,p3,p4,p5,p6]
   requestAnimationFrame(anim);
function anim(time) {
    //ctx.clear();
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    
    ctx.drawImage(canvas,-4,0)
    p6.t = wave.tri(time / 4000,1);
    p5.t = p4.t = p3.t = p2.t = p1.t = p.t = wave.sin(time / 4000,1);
    p.y = ease.spring.out(p.t, -1, 0.0421);
    p1.y = ease.spring.in(p1.t, -1, 0.0421);
    p2.y = ease.spring.inOut(p2.t,-1, 0.0421);
    p3.y = ease.occilate.out(p3.t, 2, 0.1);
    p4.y = ease.occilate.in(p4.t, 2, 0.1);
    p5.y = ease.occilate.inOut(p5.t, 0.1);
    p6.y = wave.tri(p6.t, 0.5);
    
    
    for(const p of po) {
        ctx.beginPath();
        ctx.arc(p.x,p.y * H * 0.5 + H * 0.25,10,0,Math.PI * 2);
        ctx.fill();
    }
    
    if(mouse.button === 0) {
        requestAnimationFrame(anim);
    }else { log("ed") }
    
    
    
    
}
/*END*/
performanceTester({
    cycles : 100, 
    prepCycles : 30,
    testPerCycle : 10,
    timedCycleTrim : 1,
    timedCycles : 100, 
    timerResolution : 0.2, 
    testInterval : 10, 
    resolutionError : false, 
    args:[100, 100, 0.1, 0.5],

    functions: [{
            name: "Old",
            func: oldTest,
        },{
            name: "New",
            func: newTest,
        }
    ],
});

/*END*/
//I have come accross a highly unusual outlier in terms of votes

const years = (y,m) => Number((y + m / 12).toFixed(3));
const top6JS = [
    {votes: 86, years: years(4, 8), views: 139009},
    {votes: 71, years: years(7, 5), views: 123681},
    {votes: 68, years: years(5, 2), views: 7969},
    {votes: 53, years: years(5, 3), views: 161348},
    {votes: 52, years: years(5, 1), views: 34755},
    {votes: 49, years: years(0, 2), views: 8150},
    {votes: 48, years: years(7, 3), views: 92180},
    {votes: 41, years: years(4, 7), views: 16926},
    {votes: 47, years: years(3, 1), views: 6418},
    {votes: 42, years: years(4, 10), views: 43345},
];
const stats = {
    viewPerDay(rec) { return Number((rec.views / (rec.years * 365)).toFixed(2)) },
    voteViewRate(rec) { return Number((rec.votes / rec.views * 1000).toFixed(1)) },
    voteDayRate(rec) { return Number((rec.votes / (rec.years * 365) * 10).toFixed(1)) },
}
function addStats(data, stats) {
    for(const [name, func] of Object.entries(stats)) {
        for(const rec of data) {
            rec[name] = func(rec);
        }
    }
}
function textTable(fields, data) {
    const widths = fields.map(f => f.length);
    for(const rec of data) {
        let i = 0;
        for(const fname of fields) {
            widths[i] = Math.max((""+rec[fname]).length, widths[i++])
        }
    }
    var sep, str = "\n  "+fields.reduce((s,f,i) => s+= f.padStart(widths[i]," ")+" | ","") +"\n";
    str += ("").padStart(str.length-1,"-")+"\n";
    for(const rec of data) {
        sep = " ";
        let i = 0;
        for(const fname of fields) {
            const val = rec[fname];
            str += sep+(""+val).padStart(widths[i++]+1, " ") + " ";
            sep = "|";
        }
        str += "\n";
    }
    log(str)
}
addStats(top6JS,stats)
textTable(Object.keys(top6JS[0]), top6JS)

/*END*/

const onlineArr = parent.children.map(c => c.online);
const connectedArr = parent.children.map(c => c.connected);
let status;

if (!onlineArr.includes(true)) {
  status = 'Offline';
} else if (!onlineArr.includes(false)) {
  if (!connectedArr.includes(true)) {
    status = 'Disconnected';
  } else if (!connectedArr.includes(false)) {
    status = 'Connected';
  } else {
    status = 'Partially disconnected';
  }
} else {
  status = 'Partially offline';
}

console.log(status);
const strLen = (l,a,b,c) => {
    var str = "";
    for(var i = 0; i < l; i++){
        if(i === a || i === b || i === c) {
            str += "^"
            
        }else {
            str += "_"
        }
        
    }
    return str;
}
//        log("" + arr.join("") + " > " + arr[i] + " idx: " + i + ", " + mid + ", " + top)
//        log(strLen(arr.length,i, i+mid, top));        

function createPartitionOf(arr, pivot) {
    var i, temp, top = arr.length - 1, mid = 0,step = true;
    for (i = 0; i <= top - mid; i++) {
        if (mid && step) { arr[i] = arr[i + mid] } 
        step = true;
        if (arr[i] > pivot) {  
            if (arr[top] === pivot) { 
                arr[top--] = arr[i];
                arr[i] = arr[i + (++mid)];
            } else {  
                temp = arr[i];
                arr[i] = arr[top];
                arr[top--] = temp;
                step = false;
            }
            i--;
        } else if(arr[i] === pivot) { 
            mid++;
            i--;
        }
    }
     //if (mid && step) { arr[i] = arr[i + mid] }
    while (mid--) { arr[i++] = pivot }
    return arr;
}



log("-------" + createPartitionOf([2, 0, 1, 3,3,4,5], 3)+"");
log("-------" + createPartitionOf([2, 4, 0, 1, 5,3,3], 3)+"");
log("-------" + createPartitionOf([2, 3, 4, 0, 1,3, 5], 3)+"");
log("-------" + createPartitionOf([2, 3, 3, 4, 0, 1, 5], 3)+"");
log("-------" + createPartitionOf([3,3,2, 4, 0, 1, 5 ], 3)+"");


/*END*/
// 2d Helper functions will use a global ctx, or pass a 2d context as last argument
// P2 is a point. I use p to mean a point
//var ctx; // global 2D context

const W = canvas.width;
const H = canvas.height;

Math.PI2 = Math.PI * 2;
Math.expand = (unit, start, end) => unit * (end - start) + start;
Math.easeInOut = (v, p = 2) =>  v < 0 ? 0 : v > 1 ? 1 : v ** p / (v ** p + (1 - v) ** p); 
Math.ease = (v, p = 2) =>  v < 0 ? 0 : v > 1 ? 1 : v ** p; 
Math.easeOut = (v, p = 2) =>  v < 0 ? 0 : v > 1 ? 1 : 1 - ((1-v) ** p); 
const P2 = (x = 0, y = 0) => ({x,y});
const p2 = {
    set: (p, pA) => (p.x = pA.x, p.y = pA.y, p),
    cpy: (p)=> P2(p.x, p.y),
    mul: (p, val) => (p.x *= val, p.y *= val, p),
    add: (p, pA) => (p.x += pA.x, p.y += pA.y, p),
    sub: (p, pS) => (p.x -= pS.x, p.y -= pS.y, p),
    dis: (p1, p2) => ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5,
    dir: (p1, p2) => Math.atan2(p1.y - p2.y, p1.x - p2.x),
    closest(p, dist, ...points) {
        var min = dist, minPoint;
        for(const pp of points) {
            const dist = p2.dis(pp, p);
            if(dist < min){
                min = dist;
                minPoint = pp;
            }
        }
        return minPoint;
    }
};
const setStyle = (style, c = ctx) => Object.assign(c,style);
const setLineStyle = (strokeStyle = "#000",linewidth = 1, linecap = "round", linejoin = "round", c) =>  setStyle({strokeStyle,linewidth,linecap, linejoin}, c);
const setColors = (stroke, fill, c = ctx) => (c.strokeStyle = (stroke ? stroke : c.strokeStyle), c.fillStyle = (fill ? fill : c.fillStyle));
const clear = (c = ctx) => (setPos(), c.clearRect(0,0,c.canvas.width,c.canvas.height));
const line = (p1, p2, c = ctx) => (c.moveTo(p1.x, p1.y), c.lineTo(p2.x, p2.y));
const circle = (p1, r, c = ctx) => (c.moveTo(p1.x + r, p1.y), c.arc(p1.x, p1.y, r, 0, Math.PI2));
const fillCircle = (r, c = ctx) => (c.beginPath(),c.arc(0, 0, r, 0, Math.PI2),c.fill());
const strokeCircle = (r, c = ctx) => (c.beginPath(),c.arc(0, 0, r, 0, Math.PI2),c.stroke());
const setPos = (p, c = ctx) => p ? c.setTransform(1, 0, 0, 1, p.x, p.y) : c.resetTransform();
const path = (p, path, c = ctx) => {
    c.setTransform(1,0,0,1,p.x,p.y);
    for(const seg of path) {  // each segment
        let first = true;
        for(const p of seg) {  // each point
            first ? (c.moveTo(p.x,p.y), first = false):(c.lineTo(p.x, p.y));
        }
    }
}
const styles = {
    spiral: {
        fillStyle: "Black",
        strokeStyle: "Black",
        lineWidth: 4,
        lineJoin: "round",
        lineCap: "round",
    },
    highlight: { strokeStyle: "red", lineWidth : 1},
    centerCir: { fillStyle: "red"},
    startCir: { fillStyle: "Blue"},
    endCir: { fillStyle: "White"},

    
};
function createSpiral(x,y, ease, easePow) {
    const wp = P2();
    const spiral = {
        start: {
            ang: undefined,
            dist: undefined,
            pos:P2(x-100,y),
        },
        end: {
            ang: undefined,
            dist: undefined,
            pos:P2(x + 100,y),
        },
        center: P2(x,y),
        update() {
            
            if(spiral.start.ang === undefined) { spiral.start.ang = p2.dir(spiral.start.pos, spiral.center) }
            if(spiral.end.ang === undefined) { spiral.end.ang = p2.dir(spiral.end.pos, spiral.center) }
    
    
            const ds = spiral.start.dist = p2.dis(spiral.center, spiral.start.pos);
            const de = spiral.end.dist = p2.dis(spiral.center, spiral.end.pos);
            const as = spiral.start.ang;
            const ae = spiral.end.ang;
            
            var norm = p2.mul(p2.sub(p2.set(wp, spiral.start.pos), spiral.center), 1 / ds);
            spiral.start.ang += Math.asin(Math.cos(as) * norm.y - Math.sin(as) * norm.x);
            
            
            var norm = p2.mul(p2.sub(p2.set(wp, spiral.end.pos), spiral.center), 1 / de);
            spiral.end.ang += Math.asin(Math.cos(ae) * norm.y - Math.sin(ae) * norm.x);
            
            
        },
        draw(){
            var i, endDir;
            var step = 1 / (Math.max(spiral.start.dist, spiral.end.dist) * Math.abs(spiral.start.ang - spiral.end.ang) / Math.PI2);
            step = step < 0.001 ? 0.001 : step;
            const end = 1 + step / 2;
            setStyle(styles.spiral);
            ctx.beginPath();
            setPos(spiral.center);
            log.clear();
            log(spiral.start.ang)
            
            for(i = 0; i < end; i += step) {
                const ang = Math.expand(i, spiral.start.ang, spiral.end.ang);
                const rad = Math.expand(ease(i,easePow), spiral.start.dist, spiral.end.dist);
                ctx.lineTo(
                    Math.cos(ang) * rad,
                    Math.sin(ang) * rad,
                );
            }
            ctx.stroke();        
        }
    }
    return spiral;
}

const spiral1 = createSpiral(200,200, Math.easeOut, 4);
const spiral2 = createSpiral(400,200, Math.ease, 4);
spiral2.start.pos = spiral1.end.pos;


const center = P2(W / 2, H / 2);
const start = P2(100,200)
const end = P2(10,20)
var dragging = false;
var dragPoint;
const dragPoints = [spiral1.center,spiral1.start.pos,spiral1.end.pos,spiral2.center,spiral2.end.pos];
clear()
spiral1.update();
spiral2.update();
spiral1.center.nextCent = spiral2.center;
spiral2.center.nextCent = spiral1.center;
function update() {
    clear();
    mouse.forElement(canvas);
    if(mouse.button === 1) {
        if(!dragging) {
            dragPoint = p2.closest(mouse, 10, ...dragPoints);
            if(dragPoint) {
                dragging = true;
            }
        }
    }else {
        if(dragging) {
            dragging = false;
            dragPoint = undefined;
        }else{
            var near = p2.closest(mouse, 10, ...dragPoints);
            if(near) {
                canvas.style.cursor = "move";
                setStyle(styles.highlight);
                setPos(near);
                strokeCircle(12);
            }else{
                canvas.style.cursor = "default";
            }
        }
    }
    if(dragging) {
        canvas.style.cursor = "none";
        mouse.getPos(dragPoint);
        spiral1.update();
        spiral2.update();
        if(dragPoint.nextCent) {
            if(dragPoint === spiral1.center) {
                dragPoint.nextCent.x = Math.cos(spiral1.end.ang) * (spiral2.start.dist) + spiral2.start.pos.x;
                dragPoint.nextCent.y = Math.sin(spiral1.end.ang) * (spiral2.start.dist) + spiral2.start.pos.y;
            }else{
                dragPoint.nextCent.x = Math.cos(spiral2.start.ang) * (spiral1.end.dist) + spiral1.end.pos.x;
                dragPoint.nextCent.y = Math.sin(spiral2.start.ang) * (spiral1.end.dist) + spiral1.end.pos.y;

            }
            
            
            
            
        }
        spiral1.update();
        spiral2.update();
    }
    spiral1.draw();
    spiral2.draw();
    
    
    setStyle(styles.centerCir);
    setPos(spiral1.center)
    fillCircle(10);
    setPos(spiral2.center)
    fillCircle(10);
    
    setStyle(styles.startCir);
    setPos(spiral1.end.pos);
    fillCircle(5);
    
    setStyle(styles.endCir);
    setPos(spiral1.start.pos);
    fillCircle(5);
    setPos(spiral2.end.pos);
    fillCircle(5);
    
    if(mouse.button !== 4) {
        requestAnimationFrame(update);
    }else{
        log("done");
    }
}
update();



/*END*/

//ctx = myCanvas.getContext("2d");
setLineStyle("#F90", 2);
setColors(undefined, "blue");

function drawAxis(fromP, toP, mark, lineStyle, marks, markStyle, markDist) {
    const len = p2.disDist(fromP, toP);
    const norm = P2Mult(P2Sub(P2Copy(toP), fromP), 1 / len);
    const step = P2Mult(P2Sub(P2Copy(toP), fromP), 1 / (marks.length-1));
    const pos = P2Copy(fromP);
    setStyle(lineStyle);
    ctx.beginPath();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    line(fromP, toP);
    for(const m of marks) {
        path(pos, mark);
        P2Add(pos, step)
    }
    ctx.stroke();

    P2Set(pos, fromP);
    setStyle(markStyle);
    for(const m of marks) {
        setPos(pos);
        ctx.fillText(m,-norm.y * markDist, norm.x * markDist)
        P2Add(pos, step)
    }
}

const insetW = W * 0.1; 
const insetH = H * 0.1; 
clear();
drawAxis(
    P2(insetW, H - insetH),
    P2(insetW, insetH),
    paths.markLeft,
    styles.markStyle,
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    {...styles.textLeft, ...styles.markTextStyle},
    -18
)
drawAxis(
    P2(insetW, H - insetH),
    P2(W - insetW, H - insetH),
    paths.markUp,
    styles.markStyle,
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    {...styles.textHang, ...styles.markTextStyle},
    6
)
setPos(); // resets transform







/*END*/

function *sort1(array) {
    array = array.slice();
    for (let i = 1; i < array.length; i++) {
      let j = i, temp = array[i];
      yield {i, j : 0, array};
      while (j > 0 && array[j - 1] > temp) {
          yield {i:j-1, j , array,swap:1};
          array[j] = array[j - 1];
          j--;
      }
      if (j < i) {
          yield {i, j, array,swap:1};
          array[j] = temp;
      }
      // Invariant: here array[0] to array[i] will be correctly sorted!
    }
    yield {i:0 , j:0, array};
    yield {i:0 , j:0, array};
}
function *sort(array) {
  array = array.slice();

  for (var i = 0; i < array.length; i++) {
       yield {i,j : 0,array};
    for (var j = 0; j < array.length - 1; j++) {
       yield {i,j,array};    
      if (array[j] > array[i]) {
        //swap
        yield {i,j,array,swap:1};
        [array[i], array[j]] = [array[j], array[i]];
        //break;
      }
    }
    
  }
  yield {i,j,array};
  return array;
}
const styles = {inactive: "#444", i: "#0F0", j:"#0F0"};
const borderStyle = "black";
const textStyle = "white";
const textInset = 20;
ctx.font = "24px Airal";
ctx.textAlign = "center";
const inset = 2;
const border = 2;
const frameRate = 8;
const swapRate = 2;
function draw(state) {
    const W = ctx.canvas.width, H = ctx.canvas.height
    const hS = H / state.array.reduce((max,val) => Math.max(max,val),0);
    const wS = W / state.array.length | 0;
    var idx = 0;
    const drawBar = (idx, value, style, text, offset = 0) => {
        const val = value * hS;
        ctx.fillStyle = borderStyle;
        ctx.fillRect(idx * wS + inset + offset, H - val, wS - inset * 2, val);
        ctx.fillStyle = style;
        ctx.fillRect(idx * wS + inset + border  + offset, H - val + border, wS - (border + inset) * 2, val- border * 2);
        ctx.globalAlpha = 1;
        if(text){
            ctx.fillStyle = textStyle;
            ctx.fillText(text, (idx+ 0.5) * wS  + offset, H - textInset);
        }

    }
    ctx.clearRect(0,0,W,H);
    for(const value of state.array) {
        if (state.i !== idx  && state.j !== idx) { drawBar(idx,value,styles.inactive) }
        idx ++;
    }

    if(state.swap === undefined) {
        ctx.globalAlpha = 0.5;
        drawBar(state.i, state.array[state.i], styles.i,"I");
        ctx.globalAlpha = 0.5;
        drawBar(state.j, state.array[state.j], styles.j,"J");
        
    }else {
        const offset = wS * (state.i - state.j);
        ctx.globalAlpha = 0.5;
        drawBar(state.i, state.array[state.i], styles.i, "I", -offset * (1 - state.swap));
        ctx.globalAlpha = 0.5;
        drawBar(state.j, state.array[state.j], styles.j, "J", offset * (1 - state.swap));
    }
    
    
}
var frameCount = 0;
var sortState;
var a = $setOf(60, ()=> $randI(2,100));
const sortGen = sort1(a);
animLoop();
function animLoop() {
    if (mouse.button) { log("done"); return }
    if(frameCount % frameRate === 0){
        sortState = sortGen.next().value;
        if(sortState === undefined) { return }
        if(!sortState.swap) { draw(sortState) }
        
    }
    
    if(sortState.swap) { 
        sortState.swap -= 1 / (frameRate * swapRate);
        sortState.swap = sortState.swap < 0 ? 0 : sortState.swap;
        draw(sortState) 
        frameCount = frameRate - 2;
    }else{
        frameCount ++;
    }
    
    requestAnimationFrame(animLoop);
}






/*END*/

/*END*/
        
        ctx.linecap = 'round';
        // draw a scale with the numbers on it
        ctx.lineWidth = 2;
            
        ctx.strokeStyle = '#FF9900';
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(100, 400);             
        for (i = 0; i <= 6; i+=1) {
            
             //put a stroke mark
             ctx.lineTo(100*i,400);
             ctx.lineTo(100*i,405); //markers
             ctx.lineTo(100*i,400);
             
             // write the number 10px below
             ctx.strokeStyle = '#000000';
             // default size is 10px
             ctx.strokeText(i, 100*i, 415);
             ctx.strokeStyle = '#FF9900';
        }    
        // draw a vertical scale with lines on it
        ctx.moveTo(0, -100);
        for (b = 0; b <= 9; b+=1) {
            
            //put a stroke mark
            ctx.lineTo(0,44.5*b);
            ctx.lineTo(5,44.5*b);
            ctx.lineTo(0,44.5*b);
            
            // write the number 10px below
            ctx.strokeStyle = '#000000';
            // default size is 10px                  
       }  
       ctx.strokeStyle = '#000000'
       ctx.strokeText(1, 8, 365);
       ctx.strokeText(2, 8, 320.5);
       ctx.strokeText(3, 8, 276);
       ctx.strokeText(4, 8, 231.5);
       ctx.strokeText(5, 8, 187);
       ctx.strokeText(6, 8, 142.5);
       ctx.strokeText(7, 8, 98);
       ctx.strokeText(8, 8, 53.5);
       ctx.strokeText(9, 8, 9);
       ctx.strokeStyle = '#FF9900';
        ctx.stroke();