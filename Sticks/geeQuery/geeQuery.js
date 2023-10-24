//==============================================================================
// NOTE this is not in anyway associated with jQuery and is TOTALY incompatible with it.
// helper function
// $(element);    						// do nothing and return the element
// $(element,{}); 						// assign second arguments properties to the element and return element
// $(element,"query");                  // query element returning result array or null
// $(element,"query",n);                // query element returning n th item. if n negative item is from the top 
// $("query");          				// query select all
// $("$? data"); 						// shortcut for quick elements. $? the ? is used to identify the type followed by a space. See Short cut types
// $("$? data","id"); 					// shortcut with id
// $("$? data","id","className"); 		// shortcut with id and className. if id === "" it is not added
// $("$? data",{}); 					// shortcut for quick elements. Second argument is elements properties
// $("elementTagName",{}); 				// create element second argument is properties
// $("elementTagName","id"); 			// create element set id = id
// $("elementTagName","id","className");// create element set id = id and class to className
// $("query",n); 						// query and return the n th element in the query array Neg number from last element 

// $("$? data"); // shortcut for quick elements. $? is used to identify the type followed by a space. See Short cut types
// Shortcut types. Type can be upper or lower case. Note for some types the case is used and will be listed below
//    $P for paragraph. Eg "$p my text for the paragraph"
//    $T for text 
//    $A for anchor where the data is comma delimited with href then text.
//    $L for list returns a ul element populated with the comma delimited data
//    $I for list item
//    $B for bold text
//    $D for div containing data as text
//    $N for span containing data as text
//    $H# For heading where # represents the heading level
//    $S or $s Sub or Sup script text S for super and s for sub
                 
function $(query, q1, index){  // query 
    const setProperties = (src, dest) => {
        
        for (const k of Object.keys(src)) { if (k === "style" && typeof src.style === "object") { setProperties(src.style, dest.style) } else { dest[k] = src[k] } }     
        return dest;        
    }
    const shortCutAlias = { b : "b", i : "li", p : "p", s : "sub", S : "sup", h : "h1", h1: "h1", h2 : "h2", h3 : "h3", h4 : "h4", h5 : "h5", h6 : "h6", d : "div", n : "span", }
    const createShortcutElement = (str) => {
        var s = str.substr(1, 2).trim();
        var alias = shortCutAlias[s];
        if (alias === undefined) { alias = shortCutAlias[s.toLowerCase()] }
        if (alias) { return $(alias, {textContent : str.substr(2 + s.length)}) }
        switch(str[1].toLowerCase()) {
            case "l": return $$($("ul", {} ),  [...str.substr(3).split(",").filter(n => n.trim() !== "").map(n => $("$i " + n))]);
            case "t" : return new Text(str.substr(3));
            case "a" : s = str.substr(3).trim().split(","); return $("a",{href : s.shift().trim(), textContent : s.join(",")});
        }
        throw new TypeError("Unknown short-cut '" + str.substr(0, 3) + "'");
    }
	const getIndexed = (a,i) => a[(i < 0 ? a.length + (i < -a.length ? -a.length: i) : i >= a.length ? a.length-1 : i)];
    var e, nl;
    const isStr = typeof query === "string";
    const isStrQ1 = typeof q1 === "string";
    if (typeof q1 === "number") {        
        if (isStr) { return getIndexed(document.querySelectorAll(query), q1) }
        return query;
    }
    if(q1 !== undefined){
        if(isStr){
            if(query[0] === "$"){ e = createShortcutElement(query) } else { e = document.createElement(query) }
            if (typeof q1 !== "string") {
                if (Array.isArray(q1)) { q1.forEach(item => setProperties(item,e)) } else { setProperties(q1,e) }
            }else{
                if (q1.trim() !== "") { e.id = q1; }
                if (typeof index === "string") { e.className = index }
            }
            return e;            
        }
        if (typeof index === "number") { return getIndexed(query.querySelectorAll(q1), index) }
        if (isStrQ1) { return [...query.querySelectorAll(q1)] }
        if (! Array.isArray(q1) && q1 !== null && typeof q1 === "object") { return setProperties(q1, query) }
        throw new RangeError("geeQuery! $( Unknown argument combination. )");   
    }
    if(isStr){
        if (query[0] === "$") {  return createShortcutElement(query) } else {  return [...document.querySelectorAll(query)] }
    }
    return query; // just in case an element is passed
}

// Note that [] signifies an array not an optional argument.
// $$ append
// $$(element,element1)  	// adds element1 to element via appendChild
// $$(element,[elements])  	// *1 adds each item from arrayOfElements to element via appendChild in array order
// $$(valid$Query,element)  // executes $(valid$Query) and then appends element to the first element result via append child
// $$(element) 				// appended element to document.body via appendChild
// $$([elements]) 			// *1 appended array of elements to document.body via appendChild
//
// (*1) if array elements contains a sub array them the sub array is used as arguments for a $() query
// $$([["$D A div element","theID","theClassName"],["$H2 A header 2 element","theID1","theClassName"]])
// Returns the first argument 
function $$(element, e1){   // appends
    const appendArray = (parent, array) => {
        array.forEach(e => {
            if (Array.isArray(e)) { e = $(...e) } else if (typeof e === "string") { e = $(e) }
            if (Array.isArray(e)) { appendArray(parent, e) } else { parent.appendChild(e) }
        });
    }		
    if(e1 !== undefined){
		if (Array.isArray(element) ) { element = $(...element) }
        if (typeof element === "string") { element = $(element,0) }
        if (Array.isArray(e1)) { appendArray(element, e1) } else { element.appendChild(e1) }
    } else { 
	    if ( Array.isArray(element) ) { appendArray(document.body, element) } else { document.body.appendChild(element) }
	}
    return element;
}
// $R remove
function $R(fromElement,element){
    if (element === null) { return element }
	if (element === undefined) { element = fromElement; fromElement = document.body; }
    if (typeof fromElement === `string` && (fromElement[0] === "#" || fromElement[0] === "." )) { fromElement = $(fromElement)[0] }
    if (typeof element === `string` && (element[0] === "#" || element[0] === "." )) { element = $(element) }
    if (Array.isArray(element)) {  element.forEach(el=>{ fromElement.removeChild(el)  }) } else { fromElement.removeChild(element) }
    return element;
}


function downloadText(text, filename) {
	const link = $('a', {download : filename, href : URL.createObjectURL(new Blob([text], { type: 'text/txt' }))});
	const e = document.createEvent("MouseEvents");
	e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false,false, 0, null);
	link.dispatchEvent(e);
}
$download = downloadText;

//===========================================================================================================================================================
//  Because I am lazy and $U makes code more compact.
const $U = undefined;
//===========================================================================================================================================================
//  function for for Array/Object/loops iteration 
//  Performance of eachOf is 1.7 times faster than using Array.forEach
// 
// $doFor(count,callback)  // calls callback count times. Callback arguments (i) the current loop counter
// $doGrid(rows, columns, callback) // calls callback (rows * columns) times. Callback arguments (column, row) the current loop counter
// $eachOf(array,callBack) // calls callback once for each array item.  Callback arguments (item, index, arrayLength). Callback return true to end iteration
// $eachProp(object,callBack) // calls callback once for each object enumerable property.  Callback arguments (propValue, propName, loopCount, numberOfProps). Callback return true to end iteration
// $setOf(count,callback)   // creates and array of count items.  Callback arguments (loopCount). returns item to add to array
const $doFor = (count, fn) => { var i = 0; while (i < count && fn(i++) !== true); }; // the ; after while loop is important don't remove
const $doGrid = (rows, columns, fn) => {var i,j=0; while(j < rows){i=0; while( i < columns){if(fn(i++,j)===true) return}j++}};
const $do2D = (w, h, fn) => {var x,y=0; while(y < h){x=0; while( x < w){if(fn(x++,y)===true) return}y++}};
const $do3D = (w, h, d, fn) => {var x,y,z=0; while(z < d){y=0;while(y < h){x=0; while( x < w){if(fn(x++,y,z)===true) return}y++}z++}};
const $eachOf = (array, fn) => { var i = 0; const len = array.length; while (i < len && fn(array[i], i++, len) !== true ); };
const $eachProp = (obj, fn) => { if(obj) {const keys = Object.keys(obj); var i = 0; var len = keys.length; while(i < len && fn(obj[keys[i]],keys[i], i++, len) !== true ); }};
const $eachVal = (obj, fn) => { if(obj) {const v = Object.values(obj), len = v.length; var i = 0; while(i < len && fn(v[i], i++, len) !== true ); }};
const $eachKey = (obj, fn) => { if(obj) {const k = Object.keys(obj), len = k.length; var i = 0; while(i < len && fn(k[i], i++, len) !== true ); }};
const $eachPair = (obj, fn) => { if(obj) {const p = Object.entries(obj), len = p.length; var i = 0; while(i < len && fn(p[i][0], p[i][1], i++, len) !== true ); }};
const $setOf = (count, fn = (i)=>i) => {var a = [],i = 0; while (i < count) { a.push(fn(i ++)) } return a };

// creates a preallocated buffer queue 
// Argument
//    buf : An array
// Code.
// The variables w and r represent the write and read positions of the buffer
// Functions
//    empty() clears the buffer
//    push(val) adds value to the top (write position)
//    shift() removes value from bottom (read position)
//    pushArray(array) Adds values from array to the top.
//    getAt (pos) Returns an item at read + pos. Return undefined if pos is past write position
//    length () Returns the number of items in the Queue
//
// Limits.
//    To keep the performance high the circleBuffer does not bounds check the push. Adding to many items
//    will overflow the buffer and result in an empty queue.
//    To use you MUST know that you will not overflow, or incorporate overflow as part of the functionality.
//
// Performance.
//    The performance will depend on usage but this buffer offers a significant speed benefit over a conventional
//    queue using Array with push and pull. 
//    circle buffer is 1.56 to 1.67 times faster (strict mode).
//    

const circleBuffer = (buf) => {
    var w = 0;
    var r = 0;
	const size = buf.length;
    return {
        empty () { w = r = 0 },
        push (val) { buf[(w ++) % size] = val },
        shift () { if(r < w) { return buf[(r ++) % size] } },
        pushArray (arr) { for (var i = 0; i < arr.length; i ++) { buf[(w ++) % size] = arr[i] } },
        getAt (pos) { if(r + pos < w) { return buf[(r + pos) % size] } },
        length () { return w - r },
    }
};
// Hi performance array for short lived objects.
// Incorporates a object pool in the same array avoiding the need to change the array size and thus reducing over all GC hits.
// Items must implement update function the should return false when no longer needed. Items will the bubble to the top to be available as a pool item
//
// Use
//
// const points = bubbleArray(); 
// points.createCallFunction("draw",false);  // creates high performance call function
// function Point(){ this.life = 10 }
// Point.prototype = {
//     draw() { console.log(this.life) },
//     update() { this.life --; return this.life > 0 },	
//	   reset : Point,
// }
//
// function intervalFunction(){
//    var point = points.next();
//    if(point === undefined){ point = points.add(new Point()) }
//    else { point.reset() }
//    points.update();
//    points.draw();
// }
//
//  Performance excluding GC hits.
//  The update function out performs traditional splice approach by a factor of 25
//  Adding items is about 1.5 slower than just pushing new object. And is slightly quicker 2* than using a separate object pool.
//  
//

//    
//    points.draw(); // fill call each items active items draw Function
//    points.update(); // call each active items update function moving items to the top if inactive
//                     // changes the active count
//    bubbleArray.callEach(name); // call item function name and only active items 
//    bubbleArray.each(callback); // for each active item call callback passing item, and index
//    bubbleArray.next(); // returns the next inactive item. If there are no inactive items it returns undefined
//    bubbleArray.add(item); // adds an item. It is assumed the item is active and is placed as the last active items and before inactive items
//    bubbleArray.getCount(); // returns the number of active items.
//    bubbleArray.createCallFunction(name, [earlyExit]); // creates a new function as a property of the bubbleArray named name and calls active items function name
//                                         // if the flag earlyExit (default false) is true then the returning true from the items function breaks from the iteration.

const bubbleArray = () => {
    const items = [];
    var count = 0;
    return {
        update() {
            var head, tail;
            head = tail = 0;
            while (head < count) {
                if (items[head].update() === false) { head += 1 }
                else {
                    if (tail < head) {
                        const temp = items[head];
                        items[head] = items[tail];
                        items[tail] = temp;
                    }
                    head += 1;
                    tail += 1;
                }
            }
            return count = tail;
        },
        createCallFunction (name, earlyExit = false){
            name = name.split(" ")[0];
            const keys = Object.keys(this);
            if (Object.keys(this).indexOf(name) > -1) {  throw new Error(`Can not create function name '${name}' as it already exists.`) }
            if (!/\W/g.test(name)) {
                let func;
                if (earlyExit) {
                    func = `var items = this.items; var count = this.getCount(); var i = 0;\nwhile(i < count){ if (items[i++].${name}() === true) { break } }`;
                } else {
                    func = `var items = this.items; var count = this.getCount(); var i = 0;\nwhile(i < count){ items[i++].${name}() }`;
                }
                !this.items && (this.items = items);
                this[name] = new Function(func);
            }else{  throw new Error(`Function name '${name}' contains illegal characters. Use alpha numeric characters only.`) }
            
        },
        callEach(name) {var i = 0; while(i < count) { if (items[i++][name]() === true) { break } } },
        each(cb) { var i = 0; while(i < count) { if (cb(items[i], i++) === true) { break } } },
        next() { if (count < items.length) { return items[count ++] } },
        add(item) {
            if (count === items.length) {
                items.push(item);
                count ++;
            } else {
                items.push(items[count]);
                items[count++] = item;
            }
            return item;
        },
        getCount() { return count },
    }
}




//===========================================================================================================================================================
// Random function.
// Random floats   $rand & $randS   // randS the S id for Seeded
//  All the following functions have also have a seeded function. 
//  Add a S as the first character after the word $rand. Eg $randI has the seeded version $rabdSI
//
// Floats
// $rand() 			// random number 0-1
// $rand(10) 		// random number 0 - 10
// $rand(10,100)  	//random number 10, 100
//
// Integers
// $randI(10)  		// Random integer 0-9
// $randI(10,100)  	// Random integer 10-99
//
// Array
// $randItem(array)   	// returns a random item from the array
// $randPick(array)   	// pick an item from the array. The item is removed from the array
// $randPut(array,item) // put an item in the array at a random position
// $randShuffle(array) 	// shuffles the array in place

// $randSeed(seed)  // sets the random seed

// $randP(min, max, curve)  // return non uniform distribution around the ceneter (min + max) / 2 where curve determines distribution. 
//                          // The P is for Power
//                          // curve = 1 then even distribution
//                          // curve > 1 then distribution favours the center
//                          // 0 < curve < 1 then favours the edges. The inverse of curve > 1 is 1 / curve
 

// seeded randoms
const $seededRandom = (() => {
    var seed = 1;
    return { max : 2576436549074795, reseed (s) { seed = s }, random ()  { return seed = ((8765432352450986 * seed) + 8507698654323524) % this.max }}
})();
const $randSeed = (seed) => $seededRandom.reseed(seed|0);
const $randSI = (min = 2, max = min + (min = 0)) => ($seededRandom.random() % (max - min)) + min;
const $randS  = (min = 1, max = min + (min = 0)) => ($seededRandom.random() / $seededRandom.max) * (max - min) + min;
const $randSSign = () => ($seededRandom.random() & 1) ? 1 : -1;
const $randSItem = (array) => array[$seededRandom.random() % array.length];
const $randSPick = (array) => array.splice($seededRandom.random() % array.length,1)[0];
const $randSPut = (array,item) => array.splice($seededRandom.random() % (array.length+1),0,item)[0];
const $randSShuffle = (a, l = a.length) => { while (l) { a.push(a.splice($seededRandom.random() % l-- | 0, 1)[0]) } return a };
const $randSPlay = (a, r, i = a.splice($seededRandom.random() % r, 1)[0]) => (a.push(i), i);
const $randSP  = (min, max = min + (min = 0), p = 2) => (max + min) / 2 + (Math.pow($seededRandom.random() / $seededRandom.max, p) * (max - min) * 0.5) * ($randSI(2) < 1 ? 1 : -1);
const $randSHSLA = (h = 0, h1 = 360, s = 100, s1 = 100, l = 50, l1 = 50, a = 1, a1 = 1) =>  `hsla(${$randSI(h,h1) % 360},${$randSI(s,s1)}%,${$randSI(l,l1)}%,${$randS(a,a1)})`;
const $randSRGBA = (r = 0, r1 = 255, g = 0, g1 = 255, b = 0, b1 = 255, a = 1, a1 = 1) =>  `rgba(${$randSI(r,r1)},${$randSI(g,g1)},${$randSI(b,b1)},${$randS(a,a1)})`;
// JS random
const $randI = (min = 2, max = min + (min = 0)) => (Math.random() * (max - min) + min) | 0;
const $rand  = (min = 1, max = min + (min = 0)) => Math.random() * (max - min) + min;
const $randSign = () => Math.random() < 0.5 ? 1 : -1;
const $randItem = (array) => array[(Math.random() * array.length) | 0];
const $randPick = (array) => array.splice((Math.random() * array.length) | 0,1)[0];
const $randPut = (array,item) => array.splice((Math.random() * (array.length+1)) | 0,0,item);
const $randShuffle = (a, l = a.length) => { while (l) { a.push(a.splice(Math.random() * (l--) | 0, 1)[0]) } return a };
const $randPlay = (a, r, i = a.splice(Math.random() * r | 0, 1)[0]) => (a.push(i), i);
const $randG  = (min, max = min + (min = 0), p = 2) => (max + min) / 2 + (Math.pow(Math.random(), p) * (max - min) * 0.5) * (Math.random() < 0.5 ? 1 : -1);
const $randHSLA = (h, h1, s = 100, s1 = 100, l = 50, l1 = 50, a = 1, a1 = 1) =>  `hsla(${$randI(h,h1) % 360},${$randI(s,s1)}%,${$randI(l,l1)}%,${$rand(a,a1)})`;
const $randRGBA = (r = 0, r1 = 255, g = 0, g1 = 255, b = 0, b1 = 255, a = 1, a1 = 1) =>  `rgba(${$randI(r,r1)},${$randI(g,g1)},${$randI(b,b1)},${$rand(a,a1)})`;


const $hsla = (h,s,l,a) => a === U ? `hsl(${h|0},${s|0}%,${l|0}%)` :`hsla(${h|0},${s|0}%,${l|0}%,${a})`;
const $rgba = (r, g = r.g, b = r.b, a = r.a + (r = r.r, 0)) => a === U ? `rgb(${r|0},${g|0}%,${b|0}%)` :`rgba(${r|0},${g|0}%,${b|0}%,${a})`;
const $CSS2rgb = (css, rgba = {}) => {    
    const str2Hex = (str,i,l=2) => parseInt(str.substr(i,l),16);
    if(css.indexOf("rgb") === 0){
        var v = css.split("(")[1].split(")")[0].split(",");
        rgb.r = Number(v[0].trim()); rgb.g = Number(v[1].trim()); rgb.b = Number(v[2].trim());
        if (v.length > 3) { rgb.a = Number(v[3].trim()) }
    } else if(css[0] === "#") {
        if(css.length >= 7){
            rgb.r = str2Hex(css,1); rgb.g = str2Hex(css,3); rgb.b = str2Hex(css,5);
            if(css.length === 7) { return rgb };
            rgb.a = str2Hex(css,7) / 255;
            return rgb;
        }
        rgb.r = str2Hex(css,1,1);
        rgb.g = str2Hex(css,2,1);
        rgb.b = str2Hex(css,3,1);
        if(css.length === 4) { return rgb };
        rgb.a = str2Hex(css,4,1) / 15;
    }
    return rgb;
}
// Triangle wave cyclic. Top and bottom 1/3 clipped.
// Returns number as a Uint8Clampped (0-255)
// x cyclic period 1 and x > 0 
// phase range 0-3 maps to 0-1 for HSL to avoid arguments like 0.3333 or 1/3
// amp is amplitude of clipped wave
// dcOff offset of clipped wave after amp
const $clipTri = (x, phase, amp, dcOff) => { 
    x = 3 * Math.abs(2 * (x + phase / 3 - (x + (phase + 1.5) / 3 | 0))) - 1.5;
    return ((x < -0.5 ? -0.5 : x > 0.5 ? 0.5 : x) * amp + dcOff) * 255 | 0;
}
function $hsl2CSSHex(hue, sat, lum){
    lum = (lum - 0.5) * 2;
    var scale = (1 - Math.abs(lum));
    const offset = (lum < 0 ? 0 : lum) + 0.5 * scale;
    scale *= sat;
    return "#" + (
           ($clipTri(hue, 1.5, scale, offset) << 16) +
           ($clipTri(hue, 3.5, scale, offset) << 8) +
            $clipTri(hue, 5.5, scale, offset)
           ).toString(16).padStart(6, "0");
} 

function $angle(x1, y1, x2, y2, x3, y3){
    const nx1 = x1 - x2;
    const ny1 = y1 - y2;
    const nx2 = x3 - x2;
    const ny2 = y3 - y2;
    const d1 = Math.sqrt(nx1 * nx1 + ny1 * ny1);
    const d2 = Math.sqrt(nx2 * nx2 + ny2 * ny2);
    return Math.asin((nx1 / d1) * (ny2 / d2) - (ny1 / d1) * (nx2 / d2));
}
function $chaser(chaseStart, accel = 0.5, drag = (accel.drag ? accel.drag : 0.5) + (accel = (accel.accel ? accel.accel : 0.5), 0)) {
    var speed = 0;
    var real = chaseStart;
    var chaseVal = chaseStart;
    const chaser = {
        get real() { return real },
        set real(_real) { real = _real },
        update(chaseV = chaseVal) { 
            chaseVal = chaseV;
            speed += ( chaseVal - real ) * accel;
            speed *= drag;
            return real += speed;
        }
    };
    return chaser;
}

const $bezCurve = (x,a,b) => (x = x < 0 ? 0 : x > 1 ? 1 : x, a *= 3, b *= 3, a * x + (-2 * a + b) * x * x + (a - b + 1) * x * x * x);
const $ease = (v, p = 2) => Math.pow(v < 0 ? 0 : v > 1 ? 1 : v, p);
const $sCurve = (v, p = 2) => (2 / (1 + Math.pow(p,-v))) -1;
const $eCurve = (v, p = 2) => { var vv; if(v <= 0){ return 0 } if(v >= 1){ return 1 } return (vv = Math.pow(v, p)) / (vv + Math.pow(1 - v, p)) }

/*if(typeof $INCLUDE_EXTRAS !== undefined){
    function moneyFormat(value, {spacer = ",", currency = "$", length : 0, pad = " "} = {}){
        var str, result, nextChar, neg = "";
        nextChar = (str = value.toFixed(2)).length % 3;
        if(str[0] === "-"){ neg = "-"; str = str.substr(1) }
        result = nextChar ? [str.substr(0, nextChar)] : [];
        while(str[nextChar] !== "."){
            result.push(str.substr(nextChar, 3));
            nextChar += 3;
        }
        const formated =  (currency + neg + result.join(spacer) + str.substr(nextChar, 3));
        return formated.padStart(length,pad);
    }
}*/


/*======================================================================================================================
  Array2D for arrays of items in 2D
  
  Indexing can be outside the 2D array's bounds. Items outside the bounds are ignored, items ouside the bounds are 
  returned as undefined;
  
  x and y refer to a 2D index
  xx and yy refer to a second 2D index eg itemsAlong(x,y,xx,yy) gets items along a line the end of the line is xx,yy
  
  w and h refer to the width (number columns) and height (number rows)
        Note that w and h can be negative and can be used to reverse the iteration / results
  map is an array of x,y offests as  [{x:?,y:?},.....
  path is an array of directions
  count count of iteration steps
  items is either a single object or an array of object. If items has less items than needed to set array values then the 
        items are repeated  
  initVal For filling new array items. If this is a function then it is called for each new item with the 
        arguments initVal(x,y) a should return the obect to be added to the array
  nav holds x,y offset eg move right {x:1,y:0} or an absolute coordinate eg move to 10,10 {x : 10, y : 12, absolute : true}
      Returning the nav object as {x:0,y:0} will terminate navigation
  limit Some functional iterators can easily get into infinite loops. limit defaults to the array size times two. You
        can set the value if you need more iterations or want to set a limit to the number of navigating or path following steps.
  
        
   
  Most functional iterators like Array2D.each( can break out of the loop by returning true
   
  
  Create
  
  new Array2D(columns, rows, [initVal])
    initVal optional default is undefined. This is the value assigned to each array item. If the value is a function 
            then the return valu8e of that function is assigned. The function is called with the column and row.
            

  Functions
            
    Iterators
    
    Rows()     // iterater over all rows
    Columns()  // iterater over all columns
    row(columnIndex) 
    column(rowIndex)
    pattern(x,y,map)
    path(x,y,path)
    area(x,y,w,h)
    
    Settings items
    
    fill(item)
    setPattern(items, x, y, map)
    fillPattern(item, x, y, map)
    putItem(item,x,y)
    putItemsOver(items,x,y,w,h)
    putItemsAlong(items,x,y,xx,yy)
    
    
    Getting items
    
    itemAt(x,y)
    itemsOver(x,y,w,h,result)   returns a Array2D object. You can pass an existing Array2D and have the items put on it.
    itemsAlong(x,y,xx,yy)
            

    Functional itterators
    
    each(callback(item,x,y))  
    eachOver(callback(item,x,y,count),x,y,w,h) // count starts at 0 and adds 1 for item iterated
    eachAlong(callback(item,x,y,count), x,y,xx,yy)
    eachOfPattern(callback(item,x,y,mapIndex),x,y,map)
    navigate(callback(item,x,y,count,nav),x,y,[nav, [limit]])
    
    Misc
    
    asArray([flat])  flat defualts false. If true the returned array is one dimesioned else the array is a 2D array
    grow(left,top,right,bottom,initVal) 
    {x,y} = findPattern(callback(pattern, x, y),map,[x,[y]])  // callback pattern is aiterable object representing the pattern at x,y
        Callback should return true if pattern matches 
        
    map = toPattern(perdicate(item,cx,cy))  cx,cy is the center position of the map. returns a map item for each 
        item perdicate returns true for
    toString([rowTerminate]) Use row terminate to set the row termination string. Eg arr2d.toString("\n") adds a newline to every row
        
    semaphoreStack for recursize, or recursive like searched this returns am pbject that alows you to conitionaly add items to a stack
        based on the 2D coordinate . Each array coordinate has 8 semephore. bit 0 is set when an item is pushed to the stack and remains on. Bit 2 is
        set when an item is pushed to the stack. It is later set back to 0 when the item is popped from the stack. The remaing 6 bits can used for your own purpose
        



=======================================================================================================================*/

function objectStaticConstants(obj,constants){
    const descriptor = {};
    for(const [name, value] of Object.entries(constants)){ descriptor[name] = {value} }
    return Object.defineProperties(obj, descriptor);
}
    
    
function Array2D(columns, rows, initVal){
    const length = columns * rows;
    this.items = [];
    this.columns = columns;
    this.rows = rows;
    this.directions = [-columns, -columns + 1, 1, columns + 1, columns, columns -1, -1, -columns - 1];

    var i = 0;
    if (typeof initVal === "function") {
        let ix,iy;
        for (iy = 0; iy < rows; iy+= 1) {
            for(ix = 0; ix < columns; ix+= 1){ this.items[i++] = initVal(ix, iy) }
        }
    }else {
         while (i < length) {  this.items[i++] = initVal } 
    }
    
}
objectStaticConstants(Array2D, {
    DIR_UP : 0,
    DIR_UP_RIGHT : 1,
    DIR_RIGHT : 2,
    DIR_DOWN_RIGHT : 3, 
    DIR_DOWN : 4,
    DIR_DOWN_LEFT : 5,
    DIR_LEFT : 6,
    DIR_UP_LEFT : 7,
  //  patterns : objectStaticConstants({}, {
  //      fromText(w,h,cx,cy
});
// Pattern is an array of coordinate offsets eg [{x :-1, y : 0}, x : 1, y : 0}] pattern identifies the items to the left then right of a given position
// A nav object defines a movement as an offset nav = {x : 0, y : 1} moves down one item. A nav step can be forced to absolute navigation by setting the ansolute flag to true. eg {x : 10, y : 10, absolute : true}. Note that the absolute flag is reset to false after every absolute navigation. For relative navigations an offset of {x :0, y :0} is taken to mean navigation is to stop.
Array2D.prototype = {
    grow(left,top,right,bottom,initEmptyValue){
        var ix,iy;
        const oldArray = [...this.items];
        this.items.length = 0;
        const rows = top + this.rows + bottom;
        const columns = left + this.columns + right;
        var index = 0;
        for(iy = 0; iy < rows; iy ++){
            const oldY = iy - top;
            for(ix = 0; ix < columns; ix ++){
                const oldX = ix- left;
                if (oldY >= 0 && oldY < this.rows && oldX >= 0 && oldX < this.columns) {
                    this.items.push(oldArray[oldX + oldY * this.columns]);
                } else {
                    this.items.push(initEmptyValue)
                }
            }
        }
        this.columns = columns;
        this.rows = rows;
        this.directions.length = 0;
        this.directions.push(-columns, -columns + 1, 1, columns + 1, columns, columns -1, -1, -columns - 1);
        return this;
    },
    asArray(flat = false){
        const array = [];
        for(const row of this.Rows){
            if(flat) { array.push(...row) }
            else { array.push([...row]) }
        }
    },
    semaphoreStack(){
        const columns = this.columns;
        const size = columns * this.rows;
        const flags = new UInt8Array(size);
        const stack = [];
        return {            
            USED : 1,
            HOLDING : 2,
            push(item,x,y,conditionMask,conditionValue) {                
                var index = x + y * columns;
                if((conditionMask & flags[index]) === conditionValue){
                    stack.push(item,index);
                    flags[index] |= 3;
                }
            },
            pop(){
                const index = stack.pop();
                flags[index] = flags[index] & 0b11111101;
                return stack.pos();
            },
            flag(x,y,mask,value){
                const index = x + y * columns;
                if(mask === undefined){
                    return flags[index];
                }
                return flags[index] = (flags[index] & mask) | value;
            }
        }
    },
    [Symbol.iterator]() {  return this.items[Symbol.iterator]() },
    toString(rowTerm) { 
        if(rowTerm !== undefined){
            let str = "";
            for(const row of this.Rows()){str += ([...row]).toString() + rowTerm }
            return str;
        }
        return this.items.toString() 
    },
    Rows() {
        const a2D = this;
        return (function *() {
            var row = 0;
            while(row < a2D.rows) { yield a2D.row(row++) }
        })();
    },
    Columns() {
        const a2D = this;
        return (function *() {
            var column = 0;
            while(column < a2D.columns) { yield a2D.column(column++) }
        })();
    },
    row(rowIndex) {
        const a2D = this;
        return (function *() {
            const columns = a2D.columns;
            const index = rowIndex * columns;

            var col = 0;
            while(col < columns) { yield a2D.items[index + (col ++)] }
        })();
    },
    column(colIndex) {
        const a2D = this;
        return (function *() {
            const index = colIndex;
            const columns = a2D.columns;
            const rows = a2D.rows;
            var row = 0;
            while(row < rows) { yield a2D.items[index + (row ++) * a2D.columns] }
        })();
    },       
    pattern(x,y,map) {
        const a2D = this;
        return (function *() {
            var index = 0;
            while(index < map.length) { 
                const m = map[index++];
                yield a2D.itemAt(x + m.x, y + m.y);
            }
        })();
    },  
    path(x, y, path) {
        const a2D = this;
        return (function *() {
            var pathIndex = 0;
            const columns = a2D.columns;
            const index = x + y * columns;
            while(pathIndex < path.length) { 
                index += a2D.diections[path[pathIndex++] % 8];
                yield a2D.itemAt(index % columns, (index / columns) | 0);
            }
        })();
    },  
    area(x, y, w, h) {
        const a2D = this;
        return (function *() {
            var ix,iy;
            const dx = w < 0 ? -1 : 1;
            const dy = h < 0 ? -1 : 1;
            w = Math.abs(w);
            h = Math.abs(h);            
            const size = a2D.rows * a2D.columns;
            for (iy = 0; iy < h; iy += 1) {
                for (ix = 0; ix < w; ix += 1) {
                    const xx = x + ix * dx;
                    const yy = y + iy * dy;
                    const index = xx + yy * a2D.columns;
                    if (xx < 0 || xx >= a2D.columns || index < 0 || index >= size) { yield undefined }
                    else { yield a2D.items[index] }
                }
            }
        })();
    },
    navigate(callback, x, y, nav = { x : 0,  y : 0}, limit) { // this function can easily enter infinite loops. limit counts the loops and exits if the count is reached. It defaults to twice the array2D size, or can be set to another value if needed.
        if(!this.isInBounds(x,y)) { return }
        limit = limit === undefined ? this.items.length * 2 : limit;
        var i = 0,tnav;
        nav = (tnav = callback(this.itemAt(x,y),x,y,i++,nav)) ? tnav : nav;
        nav.x = Math.trunc(nav.x);
        nav.y = Math.trunc(nav.y);
        while(nav.x !== 0 || nav.y !== 0 && i < limit){
            if(nav.absolute){
                x = nav.x;
                y = nav.y;
                nav.absolute = false;
            }else{
                x += nav.x;
                y += nav.y;
            }
            if(!this.isInBounds(x,y)) { return }
            nav = (tnav = callback(this.itemAt(x,y),x,y,i++,nav)) ? tnav : nav;
            nav.x = Math.trunc(nav.x);
            nav.y = Math.trunc(nav.y);      
        }
    },      
    findPattern(callback, map, x, y){
        var minX = map[0].x;
        var minY = map[0].y;
        var maxX = map[0].x;
        var maxY = map[0].y;
        for(const offset of map){
            minX = Math.min(offset.x,minX);
            minY = Math.min(offset.y,minY);
            maxX = Math.min(offset.x,maxX);
            maxY = Math.min(offset.y,maxY);
        }
        x = x === undefined ? -maxX : x;
        y = y === undefined ? -maxY : y;
        const right = this.columns - minX;
        const bottom = this.rows - minY
        if (x >= right) {
            x =  - maxX;
            y += 1;
        }
        while (y < bottom) {
            if (callback(this.pattern(x, y, map), x, y) === true) { return {x, y}  }
            x += 1;
            if (x >= right) {
                x =  - maxX;
                y += 1;
            }
        }
        return;
    },
    findArea(callback, w, h, x, y){
        x = x === undefined ? -w : x;
        y = y === undefined ? -h : y;
        const right = this.columns;
        const bottom = this.rows;
        if (x >= right) {
            x =  0;
            y += 1;
        }
        while (y < bottom) {
            if (callback(this.area(x, y, w,h), x, y) === true) { return {x, y}  }
            x += 1;
            if (x >= right) {
                x =  0;
                y += 1;
            }
        }
        return;
    },    
    fillPattern(item, x, y, map){
        for(const offset of map){
            this.putItem(item ,x + offset.x,y + offset.y);
        }        
    },  
    setPattern(items, x, y, map){    
        var i = 0;
        for(const offset of map){
            this.putItem(items[(i++) % items.length],x + offset.x,y + offset.y);
        }        
    },
    findPattern(predicate, map, x, y){
        var minX = map[0].x;
        var minY = map[0].y;
        var maxX = map[0].x;
        var maxY = map[0].y;
        for(const off of map){
            minX = Math.min(minX, off.x);
            maxX = Math.max(maxX, off.x);
            minY = Math.min(minY, off.y);
            maxY = Math.max(maxY, off.y);
        }
        const bottom = this.columns - minY;
        const right = this.rows - minX;
        const left = - maxX;
        const top = - maxY;
        x = x === undefined ? left : x;
        y = y === undefined ? top : y;
        if(x >= right){
            x = left;
            y += 1;
        }
        y = y < top ? top : y;
        x = x < left ? left : x;
        while (y < bottom) {
            if (predicate(this.pattern(x,y,map),x,y) === true) { return {x, y} }
            x += 1;
            if(x >= right){
                x = left;
                y += 1;
            }
        }
        return;
    },
    eachOfPattern(callback, x, y, map){
        var i = 0;
        for(const offset of map){
            const xx = x + offset.x;
            const yy = y + offset.y;
            if(callback(this.itemAt(xx,yy),xx,yy,i++) === true){ break };
        }        
    },
    each(callback){
        var i = 0;
        while(i < this.items.length) {
            if(callback(this.items[i],i % this.columns, (i++) / this.columns | 0) === true){ break };
        }
    },
    eachOver(callback, x, y, w, h) {
        var ix,iy,i = 0;
        const dx = w < 0 ? -1 : 1;
        const dy = h < 0 ? -1 : 1;
        w = Math.abs(w);
        h = Math.abs(h);
        for (iy = 0; iy < h; iy ++) {
            for (ix = 0; ix < w; ix ++) {
                const xx = x + ix * dx;
                const yy = y + iy * dy;
                if(callback(this.itemAt(xx, yy), xx, yy, i++) === true) { return };
            }
        }
    },
    eachAlong(callback, x, y, xx, yy){
        // BRENSENHAM line
        const dx = Math.abs(xx - x);
        const dy = -Math.abs(yy - y);
        const sx = x < xx ? 1 : -1;
        const sy = y < yy ? 1 : -1;
        xx |= 0; yy |= 0; x |= 0; y |= 0;        
        // BRENSENHAM method uses the position errors to know when to move hor or vert
        var errA = dx + dy;
        var errB; 
        var end = false;
        var i = 0;
        while (!end) {
            if(callback(this.itemAt(x,y),x,y,i++) === true) { break }
            if (x === xx && y === yy) { end = true }
            else {                
                errB = 2 * errA;
                if (errB >= dy) {
                    errA += dy;
                    x += sx;
                }
                if (errB <= dx) {
                    errA += dx;
                    y += sy;
                }
            }
        }       
    },      
    fill(value) { this.items.fill(value) },
    isInBounds(x, y) { return !(x < 0 || y < 0 || x>= this.rows || y >= this.columns) },
    itemAt(x, y) { return this.isInBounds(x,y) ? this.items[x + y * this.columns] : undefined },
    putItemAt(item, x, y){ if (this.isInBounds(x,y)) { this.items[x + y * this.columns] = item } },
    putItem(item, x, y){ if (this.isInBounds(x,y)) { this.items[x + y * this.columns] = item } },
    putItemsOver(items, x, y, w, h){
        if(!Array.isArray(items)) { items = [items] }
        var ix, iy, index;
        const len = items.length;
        x |= 0; y |= 0;
        const dirX =  w < 0 ? -1 : 1;
        const dirY =  h < 0 ? -1 : 1;
        w = Math.abs(w) | 0;
        h = Math.abs(h) | 0;
        index = 0;
        
        for (iy = 0; iy < h; iy += 1) {
            for (ix = 0; ix < w; ix += 1) {
                this.putItemAt(items[(index++) % len], x + ix * dirX, y + iy * dirY);
            }
        }

    },        
    itemsOver(x, y, w, h, result){
        var ix, iy;
        x |= 0; y |= 0;
        const dirX =  w < 0 ? -1 : 1;
        const dirY =  h < 0 ? -1 : 1;
        w = Math.abs(w) | 0;
        h = Math.abs(h) | 0;
        if (!result || !(result instanceof Array2D)) { result = new Array2D(w,h) }
        if (w === 0 || h === 0) { return result }
        for (iy = 0; iy < h; iy += 1){
            for (ix = 0; ix < w; ix += 1) {
                result.putItem(this.itemAt(x + ix * dirX, y + iy * dirY),ix,iy);
            }
        }
        return result 
    },
    putItemsAlong(items, x, y, xx, yy, length){
        if (Array.isArray(items)) {  if(isNaN(length)){ length = items.length }
        } else{  items = [items]  }
        this.eachAlong((item,x,y,i) => { this.putItem(items[(i) % items.length],x,y) },x,y,xx,yy);
    },       
    itemsAlong(x, y, xx, yy){
        const result = [];
        this.eachAlong((item,x,y,i) =>{ result.push(item) },x,y,xx,yy);   
        return result;
    },
    toPattern(perdicate, cx, cy){
        var pattern = [];
        this.each((item,x,y)=>{
            if(predicate(item,x,y) === true){  pattern.push({x : cx - x, y : cy - y}) }
        });
        return pattern;
    },
};


const timeShare = (() => {
    var lastIdle = 0;
    var interval = 10;  // ms
    function timeout(ready) { setTimeout(ready, 0) }
    return {
        idle() {
            var now = performance.now();
            if (now - lastIdle > interval) {
                lastIdle = now;
                return new Promise(timeout);
            }
        },
        start() { lastIdle = performance.now() },
        set interval(val) { interval = val >= 1 ? val : 1 },
        get interval() { return interval },
    };
})();
const timeShareDelay = (() => {

    var interval = 10;  // ms
    function timeout(ready) { setTimeout(ready, interval) }
    return {
        idle() {return new Promise(timeout)},

        set interval(val) { interval = val >= 1 ? val : 1 },
        get interval() { return interval },
    };
})();    
    
async function fetchURL(url, type = "json",info){
  let response = await fetch(url,info);
  if(!response.ok) { throw {
      r : response,
      e : Error(`Fetch error ${response.statusText}`)
  } }
  return await response[type]();
}

/*
const states = new Uint32Array(4)
const statesT = new Uint32Array(4)
const rand64 = new Uint32Array(2)
states[1] = 1;
states[3] = 2;
function  xorshift128plus() {
  statesT[2] = states[0]; statesT[3] = states[1]; // s1
  statesT[0] = states[2]; statesT[1] = states[3]; // s1
  states[0] = statesT[0]; states[1] = statesT[1]



  statesT[2] ^= (statesT[2] << 23) | (statesT[3] >> (32 - 23));
  statesT[3] ^=  statesT[3] << 23;
  statesT[2] ^= (statesT[2] << 17) | (statesT[3] >> (32 - 17));
  statesT[3] ^=  statesT[3] << 17;  
  statesT[2] ^=  statesT[0];
  statesT[3] ^=  statesT[1];
  statesT[2] ^=  statesT[0] >> 26;
  statesT[3] ^= (statesT[1] >> 26) | (statesT[3]  << (32 - 26));
  states[2] = statesT[2]; states[3] = statesT[3];   

  rand64[1] = states[1] + states[3];
  rand64[0] += (rand64[1] < states[1] && rand64[1] < states[3]) ? 1 : 0;
  rand64[0] = states[0] + states[2];

} */

